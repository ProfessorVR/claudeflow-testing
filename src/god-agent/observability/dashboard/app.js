/**
 * God Agent Observability Dashboard
 * Unified dashboard with tabs, sidebar, command bar, and SSE streaming
 */

class DashboardApp {
    constructor() {
        // SSE connection
        this.eventSource = null;
        this.reconnectTimeout = null;
        this.reconnectDelay = 5000;
        this.connectionStatus = 'disconnected';

        // Data stores
        this.activities = [];
        this.agents = new Map();
        this.pipelines = new Map();
        this.routingDecisions = [];
        this.qualityChart = null;

        // Filters
        this.componentFilter = '';
        this.statusFilter = '';
        this.domainSearchTerm = '';

        // UI state
        this.currentMainTab = 'analytics';
        this.currentMemoryTab = 'interaction-store';
        this.sidebarCollapsed = false;
        this.commandHistory = [];
        this.commandHistoryIndex = -1;
        this.isDarkTheme = true;

        // Lazy loading - tracks which tabs have been loaded
        this.loadedTabs = new Set();
        this.tabLoadingStates = new Map();

        // Metrics
        this.ucmMetrics = {};
        this.idescMetrics = {};
        this.episodeMetrics = {};
        this.hyperedgeMetrics = {};
        this.tokenMetrics = {};
        this.daemonMetrics = {};
        this.registryMetrics = { total: 264, categories: 30 };
        this.learningMetrics = { trajectories: {}, patterns: {} };

        // Cost projections
        this.monthlyBudget = parseFloat(localStorage.getItem('monthlyBudget')) || 500;

        // Analytics data
        this.analyticsData = {
            summary: null,
            models: null,
            quality: null,
            costs: null
        };

        // Monitoring data
        this.monitoringData = {
            health: null,
            alerts: [],
            metrics: null
        };

        // Router data
        this.routerData = {
            circuits: null,
            rateLimits: null,
            degradation: null,
            experiments: []
        };

        // Explore data
        this.exploreData = {
            stats: null,
            kus: [],
            rus: [],
            graph: null,
            trace: null,
            coverage: null
        };

        // God Write data
        this.godWriteData = {
            config: null,
            corpora: null,
            profiles: null,
            currentJob: null,
            history: [],
            revisions: [],
            generatedContent: null,
            rawMarkdown: null
        };
        this.godWriteGenerating = false;
        this.godWritePollingInterval = null;
        this.godWriteElapsedInterval = null;
        this.godWriteStartTime = null;
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        // Store app instance globally for onclick handlers
        window.dashboardApp = this;

        this.loadUIState();
        this.setupMainTabs();
        this.setupSidebar();
        this.setupCommandBar();
        this.setupThemeToggle();
        this.setupKeyboardShortcuts();
        this.setupPanelToggles();
        this.setupEventListeners();
        this.setupExploreListeners();
        this.setupGodWriteListeners();
        this.setupCommandAutocomplete();
        this.initializeCharts();
        await this.loadInitialData();
        this.connectSSE();
        this.startPolling();
    }

    /**
     * Load UI state from localStorage
     */
    loadUIState() {
        try {
            const state = localStorage.getItem('dashboardUIState');
            if (state) {
                const parsed = JSON.parse(state);
                this.currentMainTab = parsed.currentMainTab || 'analytics';
                this.sidebarCollapsed = parsed.sidebarCollapsed || false;
                this.isDarkTheme = parsed.isDarkTheme !== false;
                this.commandHistory = parsed.commandHistory || [];
            }
        } catch (e) {
            console.warn('Failed to load UI state:', e);
        }
    }

    /**
     * Save UI state to localStorage
     */
    saveUIState() {
        try {
            const state = {
                currentMainTab: this.currentMainTab,
                sidebarCollapsed: this.sidebarCollapsed,
                isDarkTheme: this.isDarkTheme,
                commandHistory: this.commandHistory.slice(-50)
            };
            localStorage.setItem('dashboardUIState', JSON.stringify(state));
        } catch (e) {
            console.warn('Failed to save UI state:', e);
        }
    }

    /**
     * Setup main tab navigation (Analytics, Monitoring, Router, Memory, Activity)
     */
    setupMainTabs() {
        const mainTabs = document.querySelectorAll('.main-tab');
        const tabPanels = document.querySelectorAll('.tab-panel');

        mainTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                this.switchMainTab(tabId);
            });
        });

        // Restore saved tab
        this.switchMainTab(this.currentMainTab);
    }

    /**
     * Switch to a main tab
     */
    switchMainTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.main-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });

        // Update tab panels
        document.querySelectorAll('.tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabId}-tab`);
        });

        this.currentMainTab = tabId;
        this.saveUIState();

        // Load data for the tab
        this.loadTabData(tabId);
    }

    /**
     * Load data for a specific tab (with lazy loading)
     * @param {string} tabId - Tab identifier
     * @param {boolean} forceRefresh - Force reload even if already loaded
     */
    async loadTabData(tabId, forceRefresh = false) {
        // Skip if already loaded and not forcing refresh
        if (!forceRefresh && this.loadedTabs.has(tabId)) {
            return;
        }

        // Skip if currently loading this tab
        if (this.tabLoadingStates.get(tabId)) {
            return;
        }

        // Show loading state
        this.setTabLoading(tabId, true);

        try {
            switch (tabId) {
                case 'analytics':
                    await this.loadAnalyticsData();
                    break;
                case 'monitoring':
                    await this.loadMonitoringData();
                    break;
                case 'router':
                    await this.loadRouterData();
                    break;
                case 'memory':
                    await this.loadInteractionStore();
                    break;
                case 'activity':
                    this.renderActivities();
                    break;
                case 'explore':
                    await this.loadExploreData();
                    break;
                case 'phd-pipeline':
                    await this.loadPhdPipelineData();
                    break;
                case 'god-write':
                    await this.loadGodWriteData();
                    break;
                case 'claim-map':
                    await this.loadClaimMapData();
                    break;
            }

            // Mark tab as loaded
            this.loadedTabs.add(tabId);
        } catch (error) {
            console.error(`Error loading tab ${tabId}:`, error);
            this.toastError('Load Error', `Failed to load ${tabId} data`);
        } finally {
            this.setTabLoading(tabId, false);
        }
    }

    /**
     * Set loading state for a tab
     */
    setTabLoading(tabId, isLoading) {
        this.tabLoadingStates.set(tabId, isLoading);

        const tabPanel = document.getElementById(`${tabId}-tab`);
        if (tabPanel) {
            if (isLoading) {
                // Add loading overlay if not exists
                if (!tabPanel.querySelector('.tab-loading-overlay')) {
                    const overlay = document.createElement('div');
                    overlay.className = 'tab-loading-overlay';
                    overlay.innerHTML = `
                        <div class="loading-spinner"></div>
                        <span>Loading ${tabId}...</span>
                    `;
                    tabPanel.appendChild(overlay);
                }
            } else {
                // Remove loading overlay
                const overlay = tabPanel.querySelector('.tab-loading-overlay');
                overlay?.remove();
            }
        }
    }

    /**
     * Force refresh current tab data
     */
    async refreshCurrentTab() {
        await this.loadTabData(this.currentMainTab, true);
        this.updateLastRefresh();
        this.toastInfo('Refreshed', `${this.currentMainTab} data updated`);
    }

    /**
     * Load all explore tab data
     */
    async loadExploreData() {
        await Promise.all([
            this.loadExploreStats(),
            this.loadExploreKUs(),
            this.loadExploreRUs()
        ]);
    }

    // ===========================================================================
    // PhD PIPELINE TAB METHODS
    // ===========================================================================

    /**
     * Load PhD Pipeline tab data
     */
    async loadPhdPipelineData() {
        try {
            await Promise.all([
                this.loadCorporaList(),
                this.loadCorpusStats(),
                this.loadPipelineSessions()
            ]);
        } catch (error) {
            console.error('Error loading PhD Pipeline data:', error);
            this.toastError('Load Error', 'Failed to load PhD Pipeline data');
        }
    }

    /**
     * Load available corpora list
     */
    async loadCorporaList() {
        try {
            const res = await fetch('/api/phd-pipeline/corpora');
            const { success, data, message } = await res.json();

            if (!success) {
                console.error('Failed to load corpora:', message);
                return;
            }

            const select = document.getElementById('corpusSelect');
            if (!select) return;

            if (data.length === 0) {
                select.innerHTML = '<option value="">No corpora available</option>';
                return;
            }

            select.innerHTML = data.map(corpus =>
                `<option value="${corpus.name}">${corpus.displayName}</option>`
            ).join('');

            // Load current selection
            const currentRes = await fetch('/api/phd-pipeline/corpus/current');
            const { data: current } = await currentRes.json();
            if (current?.corpus) {
                select.value = current.corpus;
                const modeRadio = document.querySelector(`input[name="pipelineMode"][value="${current.mode}"]`);
                if (modeRadio) {
                    modeRadio.checked = true;
                }
                // Update badge
                const badge = document.getElementById('phdPipelineActiveCorpus');
                if (badge) {
                    badge.textContent = current.corpus;
                }
                // Load stats for selected corpus
                await this.loadCorpusStats();
            }
        } catch (error) {
            console.error('Error loading corpora list:', error);
            this.toastError('Load Error', 'Failed to load corpora list');
        }
    }

    /**
     * Load corpus statistics
     */
    async loadCorpusStats() {
        try {
            const select = document.getElementById('corpusSelect');
            if (!select) return;

            const corpusName = select.value;
            if (!corpusName) {
                // Clear stats
                document.getElementById('corpusDocCount').textContent = '--';
                document.getElementById('corpusKUCount').textContent = '--';
                document.getElementById('corpusRUCount').textContent = '--';
                document.getElementById('corpusChunkCount').textContent = '--';
                document.getElementById('corpusAvgConf').textContent = '--';
                return;
            }

            const res = await fetch(`/api/phd-pipeline/corpus/${corpusName}`);
            const { success, data, error } = await res.json();

            if (!success) {
                console.error('Failed to load corpus stats:', error);
                return;
            }

            document.getElementById('corpusDocCount').textContent = data.documentCount || 0;
            document.getElementById('corpusKUCount').textContent = data.totalKUs || 0;
            document.getElementById('corpusRUCount').textContent = data.totalRUs || 0;
            document.getElementById('corpusChunkCount').textContent = data.totalChunks || 0;
            document.getElementById('corpusAvgConf').textContent =
                data.avgConfidence ? (data.avgConfidence * 100).toFixed(1) + '%' : '--';
        } catch (error) {
            console.error('Error loading corpus stats:', error);
        }
    }

    /**
     * Load active pipeline sessions
     */
    async loadPipelineSessions() {
        try {
            const res = await fetch('/api/phd-pipeline/sessions');
            const { success, data, count } = await res.json();

            if (!success) {
                console.error('Failed to load pipeline sessions');
                return;
            }

            const container = document.getElementById('phdPipelineSessions');
            const sessionCountBadge = document.getElementById('sessionCount');

            if (!container) return;

            if (!data || data.length === 0) {
                container.innerHTML = '<p class="empty-state">No active sessions</p>';
                if (sessionCountBadge) sessionCountBadge.textContent = '0';
                return;
            }

            container.innerHTML = data.map(session => `
                <div class="session-item">
                    <div class="session-id">${session.id}</div>
                    <div class="session-query">${session.query}</div>
                    <div class="session-corpus">
                        <span class="badge badge-info">${session.corpus}</span>
                    </div>
                    <div class="session-status session-status-${session.status}">
                        ${session.status === 'running' ? '⟳ Running' :
                          session.status === 'completed' ? '✓ Complete' : '✗ Failed'}
                    </div>
                </div>
            `).join('');

            if (sessionCountBadge) {
                sessionCountBadge.textContent = count || data.length;
            }
        } catch (error) {
            console.error('Error loading pipeline sessions:', error);
        }
    }

    /**
     * Apply corpus selection
     */
    async applyCorpusSelection() {
        try {
            const select = document.getElementById('corpusSelect');
            const modeRadio = document.querySelector('input[name="pipelineMode"]:checked');

            if (!select || !modeRadio) {
                this.toastError('Error', 'Cannot read corpus selection');
                return;
            }

            const corpus = select.value;
            const mode = modeRadio.value;

            if (!corpus) {
                this.toastError('Error', 'Please select a corpus');
                return;
            }

            const res = await fetch('/api/phd-pipeline/corpus/select', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ corpus, mode })
            });

            const { success, error } = await res.json();

            if (success) {
                this.toastSuccess('Applied', `Now using ${corpus} corpus in ${mode} mode`);

                // Update badge
                const badge = document.getElementById('phdPipelineActiveCorpus');
                if (badge) {
                    badge.textContent = corpus;
                }

                // Reload stats
                await this.loadCorpusStats();
            } else {
                this.toastError('Error', error || 'Failed to apply corpus selection');
            }
        } catch (error) {
            console.error('Error applying corpus selection:', error);
            this.toastError('Error', 'Failed to apply corpus selection');
        }
    }

    /**
     * Submit PhD query to backend
     */
    async submitPhdQuery() {
        try {
            const input = document.getElementById('phdQueryInput');
            const submitBtn = document.getElementById('phdQuerySubmit');
            const errorDiv = document.getElementById('phdQueryError');
            const errorMsg = document.getElementById('phdQueryErrorMessage');
            const responseContainer = document.getElementById('phdQueryResponseContainer');
            const responseDiv = document.getElementById('phdQueryResponse');
            const corpusSelect = document.getElementById('corpusSelect');

            if (!input || !submitBtn) return;

            const query = input.value.trim();
            if (!query) {
                this.toastError('Error', 'Please enter a query');
                return;
            }

            // Hide previous response/error
            if (errorDiv) errorDiv.style.display = 'none';
            if (responseContainer) responseContainer.style.display = 'none';

            // Show loading state
            this.showQueryLoading(true);

            // Get active corpus
            const corpus = corpusSelect ? corpusSelect.value : '';

            // Update active corpus badge
            const queryCorpusBadge = document.getElementById('queryActiveCorpus');
            if (queryCorpusBadge) {
                queryCorpusBadge.textContent = corpus || 'All';
            }

            // Submit query
            const res = await fetch('/api/phd-pipeline/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, corpus })
            });

            const { success, data, error } = await res.json();

            if (success && data) {
                // Show response
                if (responseDiv && responseContainer) {
                    responseDiv.innerHTML = this.formatQueryResponse(data.response);
                    responseContainer.style.display = 'block';
                }
                this.toastSuccess('Query Complete', 'Response received');
            } else {
                // Show error
                if (errorDiv && errorMsg) {
                    errorMsg.textContent = error || 'Failed to process query';
                    errorDiv.style.display = 'block';
                }
                this.toastError('Query Failed', error || 'An error occurred');
            }
        } catch (error) {
            console.error('Error submitting PhD query:', error);
            const errorDiv = document.getElementById('phdQueryError');
            const errorMsg = document.getElementById('phdQueryErrorMessage');
            if (errorDiv && errorMsg) {
                errorMsg.textContent = error.message || 'Network error';
                errorDiv.style.display = 'block';
            }
            this.toastError('Error', 'Failed to submit query');
        } finally {
            this.showQueryLoading(false);
        }
    }

    /**
     * Format query response for display
     */
    formatQueryResponse(response) {
        // Convert markdown-style formatting to HTML
        let formatted = response
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold
            .replace(/\*(.*?)\*/g, '<em>$1</em>')               // Italic
            .replace(/`(.*?)`/g, '<code>$1</code>')             // Inline code
            .replace(/\n\n/g, '</p><p>')                        // Paragraphs
            .replace(/\n/g, '<br>');                            // Line breaks

        return `<p>${formatted}</p>`;
    }

    /**
     * Show/hide loading state for query submission
     */
    showQueryLoading(isLoading) {
        const submitBtn = document.getElementById('phdQuerySubmit');
        const input = document.getElementById('phdQueryInput');

        if (submitBtn) {
            const btnText = submitBtn.querySelector('.btn-text');
            const btnLoading = submitBtn.querySelector('.btn-loading');

            if (btnText) btnText.style.display = isLoading ? 'none' : 'inline';
            if (btnLoading) btnLoading.style.display = isLoading ? 'inline-flex' : 'none';

            submitBtn.disabled = isLoading;
        }

        if (input) {
            input.disabled = isLoading;
        }
    }

    /**
     * Clear query interface
     */
    clearQueryInterface() {
        const input = document.getElementById('phdQueryInput');
        const responseContainer = document.getElementById('phdQueryResponseContainer');
        const errorDiv = document.getElementById('phdQueryError');

        if (input) input.value = '';
        if (responseContainer) responseContainer.style.display = 'none';
        if (errorDiv) errorDiv.style.display = 'none';

        this.toastInfo('Cleared', 'Query interface reset');
    }

    /**
     * Copy response to clipboard
     */
    async copyQueryResponse() {
        const responseDiv = document.getElementById('phdQueryResponse');
        if (!responseDiv) return;

        const text = responseDiv.innerText || responseDiv.textContent;

        try {
            await navigator.clipboard.writeText(text);
            this.toastSuccess('Copied', 'Response copied to clipboard');
        } catch (error) {
            console.error('Failed to copy:', error);
            this.toastError('Copy Failed', 'Could not copy to clipboard');
        }
    }

    // =========================================================================
    // GOD WRITE TAB
    // =========================================================================

    /** Built-in presets */
    static GOD_WRITE_PRESETS = {
        'dissertation-chapter': {
            name: 'Dissertation Chapter',
            description: 'Full academic pipeline with inline validation, corpus grounding, staged composition, and source verification',
            flags: {
                style: 'academic', format: 'section', length: 'comprehensive',
                'use-corpus': true, 'corpus-chunks': 20, 'corpus-relevance': 0.75,
                'verify-sources': true, 'acquire-missing': false,
                'use-inline-validation': true, 'inline-validation-strictness': 'moderate',
                'inline-max-retries': 3, 'inline-enable-citation-lookup': true,
                'citation-enforcement-mode': 'auto-correct', 'citation-min-pass-rate': 0.85,
                'citation-max-hallucinations': 3, 'enable-endnotes': true,
                'use-staged-composition': true, 'chapter-outline': '', 'download-dir': './corpus/downloads',
                'corpus-collections': ''
            }
        },
        'quick-draft': {
            name: 'Quick Draft',
            description: 'Fast generation without corpus or validation - good for brainstorming',
            flags: {
                style: 'casual', format: 'essay', length: 'short',
                'use-corpus': false, 'corpus-chunks': 15, 'corpus-relevance': 0.75,
                'verify-sources': false, 'acquire-missing': false,
                'use-inline-validation': false, 'inline-validation-strictness': 'lenient',
                'inline-max-retries': 1, 'inline-enable-citation-lookup': false,
                'citation-enforcement-mode': 'warn', 'citation-min-pass-rate': 0.5,
                'citation-max-hallucinations': 10, 'enable-endnotes': false,
                'use-staged-composition': false, 'chapter-outline': '', 'download-dir': './corpus/downloads',
                'corpus-collections': ''
            }
        },
        'technical-report': {
            name: 'Technical Report',
            description: 'Technical writing with source verification and citation enforcement',
            flags: {
                style: 'technical', format: 'report', length: 'long',
                'use-corpus': true, 'corpus-chunks': 15, 'corpus-relevance': 0.80,
                'verify-sources': true, 'acquire-missing': true,
                'use-inline-validation': false, 'inline-validation-strictness': 'moderate',
                'inline-max-retries': 3, 'inline-enable-citation-lookup': true,
                'citation-enforcement-mode': 'auto-correct', 'citation-min-pass-rate': 0.80,
                'citation-max-hallucinations': 5, 'enable-endnotes': false,
                'use-staged-composition': false, 'chapter-outline': '', 'download-dir': './corpus/downloads',
                'corpus-collections': ''
            }
        },
        'research-synthesis': {
            name: 'Research Synthesis',
            description: 'Maximum quality: inline validation, strict citation enforcement, endnotes, and staged composition',
            flags: {
                style: 'academic', format: 'paper', length: 'comprehensive',
                'use-corpus': true, 'corpus-chunks': 25, 'corpus-relevance': 0.70,
                'verify-sources': true, 'acquire-missing': true,
                'use-inline-validation': true, 'inline-validation-strictness': 'strict',
                'inline-max-retries': 5, 'inline-enable-citation-lookup': true,
                'citation-enforcement-mode': 'strict', 'citation-min-pass-rate': 0.95,
                'citation-max-hallucinations': 0, 'enable-endnotes': true,
                'use-staged-composition': true, 'chapter-outline': '', 'download-dir': './corpus/downloads',
                'corpus-collections': ''
            }
        }
    };

    /**
     * Setup God Write event listeners
     */
    setupGodWriteListeners() {
        // Preset selection
        const presetSelect = document.getElementById('gwPresetSelect');
        if (presetSelect) {
            presetSelect.addEventListener('change', () => this.applyGodWritePreset(presetSelect.value));
        }

        // Save preset
        document.getElementById('gwSavePreset')?.addEventListener('click', () => this.showPresetDialog());
        document.getElementById('gwPresetSaveConfirm')?.addEventListener('click', () => this.saveCustomPreset());
        document.getElementById('gwPresetSaveCancel')?.addEventListener('click', () => this.hidePresetDialog());
        document.getElementById('gwPresetDialogClose')?.addEventListener('click', () => this.hidePresetDialog());
        document.getElementById('gwDeletePreset')?.addEventListener('click', () => this.deleteCustomPreset());

        // Use corpus toggle -> enable/disable corpus-dependent fields
        const useCorpus = document.getElementById('flag-use-corpus');
        if (useCorpus) {
            useCorpus.addEventListener('change', () => this.updateCorpusDependentFields());
        }

        // Relevance slider value display
        const relevanceSlider = document.getElementById('flag-corpus-relevance');
        if (relevanceSlider) {
            relevanceSlider.addEventListener('input', () => {
                const display = document.getElementById('corpus-relevance-value');
                if (display) display.textContent = relevanceSlider.value;
            });
        }

        // Inline validation toggle -> enable/disable validation-dependent fields
        const useInlineValidation = document.getElementById('flag-use-inline-validation');
        if (useInlineValidation) {
            useInlineValidation.addEventListener('change', () => this.updateValidationDependentFields());
            // Initialize state
            this.updateValidationDependentFields();
        }

        // Citation pass rate slider value display
        const citationSlider = document.getElementById('flag-citation-min-pass-rate');
        if (citationSlider) {
            citationSlider.addEventListener('input', () => {
                const display = document.getElementById('citation-pass-rate-value');
                if (display) display.textContent = citationSlider.value;
            });
        }

        // Prompt character count
        const promptInput = document.getElementById('gwPromptInput');
        if (promptInput) {
            promptInput.addEventListener('input', () => {
                const count = document.getElementById('gwCharCount');
                if (count) count.textContent = `${promptInput.value.length} characters`;
                this.updateGodWriteEstimates();
            });
        }

        // Submit / generate
        document.getElementById('gwSubmit')?.addEventListener('click', () => this.submitGodWriteGeneration());
        document.getElementById('gwClear')?.addEventListener('click', () => this.clearGodWritePrompt());

        // Output actions
        document.getElementById('gwCopyOutput')?.addEventListener('click', () => this.copyGodWriteOutput());
        document.getElementById('gwDownloadMd')?.addEventListener('click', () => this.downloadGodWriteMarkdown());
        document.getElementById('gwDownloadTex')?.addEventListener('click', () => this.showLatexExportDialog());
        document.getElementById('gwToggleDiff')?.addEventListener('click', () => this.toggleDiffViewer());

        // LaTeX dialog
        document.getElementById('gwExportLatex')?.addEventListener('click', () => this.exportLatex());
        document.getElementById('gwCancelLatex')?.addEventListener('click', () => this.hideLatexDialog());
        document.getElementById('gwLatexDialogClose')?.addEventListener('click', () => this.hideLatexDialog());

        // Corpus selection
        document.getElementById('gwSelectAllCollections')?.addEventListener('click', () => this.selectAllCollections(true));
        document.getElementById('gwSelectNoneCollections')?.addEventListener('click', () => this.selectAllCollections(false));

        // History toggle
        document.getElementById('gwToggleHistory')?.addEventListener('click', () => this.toggleHistoryPanel());

        // Source verification toggles
        document.getElementById('gwToggleVerified')?.addEventListener('click', () => {
            const list = document.getElementById('gwVerifiedList');
            if (list) list.style.display = list.style.display === 'none' ? 'block' : 'none';
        });

        // Diff close
        document.getElementById('gwCloseDiff')?.addEventListener('click', () => {
            const viewer = document.getElementById('gwDiffViewer');
            if (viewer) viewer.style.display = 'none';
        });

        // History search
        document.getElementById('gwHistorySearch')?.addEventListener('input', (e) => this.filterGodWriteHistory(e.target.value));
        document.getElementById('gwHistorySort')?.addEventListener('change', (e) => this.sortGodWriteHistory(e.target.value));

        // Flag change listener for estimates
        document.querySelectorAll('#god-write-tab .flag-control, #god-write-tab input[type="checkbox"]').forEach(el => {
            el.addEventListener('change', () => this.updateGodWriteEstimates());
        });

        // Tooltip positioning system (fixed position to escape overflow containers)
        this.setupGodWriteTooltips();

        // Load custom presets from localStorage
        this.loadCustomPresets();

        // Setup God Write keyboard shortcuts
        this.setupGodWriteShortcuts();
    }

    /**
     * Setup God Write keyboard shortcuts
     */
    setupGodWriteShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (this.currentMainTab !== 'god-write') return;

            // Ctrl+Enter: Generate
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.submitGodWriteGeneration();
            }

            // Ctrl+Shift+L: Download LaTeX
            if (e.ctrlKey && e.shiftKey && (e.key === 'L' || e.key === 'l')) {
                e.preventDefault();
                this.showLatexExportDialog();
            }

            // Ctrl+Shift+M: Download Markdown
            if (e.ctrlKey && e.shiftKey && (e.key === 'M' || e.key === 'm')) {
                e.preventDefault();
                this.downloadGodWriteMarkdown();
            }

            // Ctrl+Shift+C: Copy output
            if (e.ctrlKey && e.shiftKey && (e.key === 'C' || e.key === 'c')) {
                e.preventDefault();
                this.copyGodWriteOutput();
            }

            // Ctrl+Shift+D: Toggle diff
            if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
                e.preventDefault();
                this.toggleDiffViewer();
            }

            // Escape: Close modals
            if (e.key === 'Escape') {
                this.closeGodWriteDialogs();
            }

            // Ctrl+H: Toggle history
            if (e.ctrlKey && (e.key === 'h' || e.key === 'H') && !e.shiftKey) {
                e.preventDefault();
                this.toggleHistoryPanel();
            }

            // Ctrl+1-4: Load presets
            if (e.ctrlKey && !e.shiftKey && e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                const presets = ['dissertation-chapter', 'quick-draft', 'technical-report', 'research-synthesis'];
                this.applyGodWritePreset(presets[parseInt(e.key) - 1]);
            }
        });
    }

    /**
     * Setup tooltip positioning system for God Write flags.
     * Uses fixed positioning so tooltips escape overflow:auto containers.
     */
    setupGodWriteTooltips() {
        const flagItems = document.querySelectorAll('#god-write-tab .flag-item');
        flagItems.forEach(item => {
            const tooltip = item.querySelector('.flag-tooltip');
            if (!tooltip) return;

            item.addEventListener('mouseenter', () => {
                const rect = item.getBoundingClientRect();
                const tooltipWidth = 340;
                const tooltipHeight = tooltip.offsetHeight || 200;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                // Position to the right of the item by default
                let left = rect.right + 12;
                let top = rect.top;

                // If tooltip would overflow right edge, position to the left
                if (left + tooltipWidth > viewportWidth - 20) {
                    left = rect.left - tooltipWidth - 12;
                }

                // If tooltip would overflow bottom, shift up
                if (top + tooltipHeight > viewportHeight - 20) {
                    top = viewportHeight - tooltipHeight - 20;
                }

                // Ensure not above viewport
                if (top < 10) top = 10;

                tooltip.style.top = `${top}px`;
                tooltip.style.left = `${left}px`;
                tooltip.style.opacity = '1';
                tooltip.style.visibility = 'visible';
            });

            item.addEventListener('mouseleave', () => {
                tooltip.style.opacity = '0';
                tooltip.style.visibility = 'hidden';
            });
        });
    }

    /**
     * Load all God Write tab data
     */
    async loadGodWriteData() {
        try {
            await Promise.all([
                this.loadGodWriteConfig(),
                this.loadGodWriteCorpora(),
                this.loadGodWriteProfiles(),
                this.loadGodWriteHistory()
            ]);
            this.updateCorpusDependentFields();
            this.updateGodWriteEstimates();
        } catch (error) {
            console.error('Error loading God Write data:', error);
            this.toastError('Load Error', 'Failed to load God Write data');
        }
    }

    /**
     * Load God Write configuration (flags)
     */
    async loadGodWriteConfig() {
        try {
            const response = await fetch('/api/god-write/config');
            if (response.ok) {
                this.godWriteData.config = await response.json();
            }
        } catch (error) {
            console.warn('God Write config endpoint not available:', error.message);
        }
    }

    /**
     * Load available corpora
     */
    async loadGodWriteCorpora() {
        try {
            const response = await fetch('/api/god-write/corpora');
            if (response.ok) {
                this.godWriteData.corpora = await response.json();
                this.renderGodWriteCorpora();
            }
        } catch (error) {
            console.warn('God Write corpora endpoint not available:', error.message);
        }
    }

    /**
     * Render corpora in the corpus selection panel
     */
    renderGodWriteCorpora() {
        const grid = document.getElementById('gwCollectionGrid');
        const data = this.godWriteData.corpora;
        if (!grid || !data) return;

        const collections = data.collections || data.corpora?.[0]?.collections || [];
        if (collections.length === 0) {
            grid.innerHTML = '<div class="loading-placeholder">No collections available</div>';
            return;
        }

        grid.innerHTML = collections.map(c => `
            <label class="collection-item">
                <input type="checkbox" value="${this.escapeHtml(c.name)}" checked>
                <span class="collection-name">${this.escapeHtml(c.name)}</span>
                <span class="collection-count">${c.docCount || 0} docs / ${c.chunkCount || 0} chunks</span>
            </label>
        `).join('');

        // Add change listeners to update summary
        grid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', () => this.updateCorpusSummary());
        });

        this.updateCorpusSummary();
    }

    /**
     * Update corpus selection summary
     */
    updateCorpusSummary() {
        const grid = document.getElementById('gwCollectionGrid');
        if (!grid) return;

        const checked = grid.querySelectorAll('input[type="checkbox"]:checked');
        let totalDocs = 0, totalChunks = 0;
        checked.forEach(cb => {
            const item = cb.closest('.collection-item');
            const count = item?.querySelector('.collection-count')?.textContent || '';
            const docMatch = count.match(/(\d+)\s*docs/);
            const chunkMatch = count.match(/(\d+)\s*chunks/);
            if (docMatch) totalDocs += parseInt(docMatch[1]);
            if (chunkMatch) totalChunks += parseInt(chunkMatch[1]);
        });

        const docsEl = document.getElementById('gwSelectedDocs');
        const chunksEl = document.getElementById('gwSelectedChunks');
        if (docsEl) docsEl.textContent = totalDocs.toLocaleString();
        if (chunksEl) chunksEl.textContent = totalChunks.toLocaleString();
    }

    /**
     * Select all/none collections
     */
    selectAllCollections(selectAll) {
        const grid = document.getElementById('gwCollectionGrid');
        if (!grid) return;
        grid.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.checked = selectAll;
        });
        this.updateCorpusSummary();
    }

    /**
     * Load style profiles
     */
    async loadGodWriteProfiles() {
        try {
            const response = await fetch('/api/god-write/profiles');
            if (response.ok) {
                this.godWriteData.profiles = await response.json();
                this.renderGodWriteProfiles();
            }
        } catch (error) {
            console.warn('God Write profiles endpoint not available:', error.message);
            // Show default profile info from memory
            this.renderDefaultProfile();
        }
    }

    /**
     * Render style profiles
     */
    renderGodWriteProfiles() {
        const data = this.godWriteData.profiles;
        const profiles = data?.profiles || [];
        const activeId = data?.activeProfileId;

        // Populate profile selector
        const select = document.getElementById('gwProfileSelect');
        if (select && profiles.length > 0) {
            select.innerHTML = profiles.map(p =>
                `<option value="${this.escapeHtml(p.id)}" ${p.id === activeId ? 'selected' : ''}>${this.escapeHtml(p.name)}</option>`
            ).join('');
            select.addEventListener('change', () => this.switchGodWriteProfile(select.value));
        }

        // Show active profile details
        const active = profiles.find(p => p.id === activeId) || profiles[0];
        if (active) this.displayProfileDetails(active);
    }

    /**
     * Display default profile when API unavailable
     */
    renderDefaultProfile() {
        this.displayProfileDetails({
            id: 'dalton-academic-mkn82c3v',
            name: 'dalton-academic',
            trainedFrom: ['phantasia paper', 'VR rhetoric thesis', 'virtual things paper'],
            characteristics: {
                avgSentenceLength: 31.24,
                longSentenceRatio: 0.516,
                passiveVoiceRatio: 0.201,
                formalityScore: 0.64,
                commonTransitions: ['thus', 'specifically', 'indeed', 'accordingly', 'hence', 'similarly', 'subsequently'],
                citationStyle: 'author-prominent',
                citationVerbs: ['observes', 'argues', 'suggests', 'states', 'maintains', 'notes']
            }
        });
    }

    /**
     * Display profile details in the style panel
     */
    displayProfileDetails(profile) {
        const el = (id) => document.getElementById(id);
        if (el('gwProfileId')) el('gwProfileId').textContent = profile.id || '--';
        if (el('gwStyleProfileBadge')) el('gwStyleProfileBadge').textContent = `Profile: ${profile.name || profile.id || '--'}`;

        // Trained from docs
        const trainedDocs = el('gwTrainedDocs');
        if (trainedDocs && profile.trainedFrom) {
            trainedDocs.innerHTML = profile.trainedFrom.map(d =>
                `<span class="doc-chip">${this.escapeHtml(d)}</span>`
            ).join('');
        }

        // Characteristics
        const chars = profile.characteristics || {};
        if (el('gwCharSentLen')) {
            el('gwCharSentLen').textContent = `${(chars.avgSentenceLength || 0).toFixed(1)} words`;
            el('gwCharSentLen').closest('.char-item')?.querySelector('.char-fill')?.style.setProperty('width', `${Math.min(100, (chars.avgSentenceLength || 0) * 2)}%`);
        }
        if (el('gwCharLongSent')) {
            el('gwCharLongSent').textContent = `${((chars.longSentenceRatio || 0) * 100).toFixed(1)}%`;
            el('gwCharLongSent').closest('.char-item')?.querySelector('.char-fill')?.style.setProperty('width', `${(chars.longSentenceRatio || 0) * 100}%`);
        }
        if (el('gwCharPassive')) {
            el('gwCharPassive').textContent = `${((chars.passiveVoiceRatio || 0) * 100).toFixed(1)}%`;
            el('gwCharPassive').closest('.char-item')?.querySelector('.char-fill')?.style.setProperty('width', `${(chars.passiveVoiceRatio || 0) * 100}%`);
        }
        if (el('gwCharFormality')) {
            el('gwCharFormality').textContent = (chars.formalityScore || 0).toFixed(2);
            el('gwCharFormality').closest('.char-item')?.querySelector('.char-fill')?.style.setProperty('width', `${(chars.formalityScore || 0) * 100}%`);
        }

        // Transitions
        const transChips = el('gwTransitionChips');
        if (transChips && chars.commonTransitions) {
            transChips.innerHTML = chars.commonTransitions.map(t =>
                `<span class="transition-chip">${this.escapeHtml(t)}</span>`
            ).join('');
        }

        // Citation style
        if (el('gwCitationStyle')) el('gwCitationStyle').textContent = chars.citationStyle || '--';
        const verbChips = el('gwCitationVerbs');
        if (verbChips && chars.citationVerbs) {
            verbChips.innerHTML = chars.citationVerbs.map(v =>
                `<span class="verb-chip">${this.escapeHtml(v)}</span>`
            ).join('');
        }
    }

    /**
     * Switch active style profile
     */
    async switchGodWriteProfile(profileId) {
        try {
            const response = await fetch('/api/god-write/profiles/activate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ profileId })
            });
            if (response.ok) {
                this.toastSuccess('Profile Switched', `Now using: ${profileId}`);
                await this.loadGodWriteProfiles();
            }
        } catch (error) {
            this.toastError('Error', 'Failed to switch profile');
        }
    }

    /**
     * Update corpus-dependent field enabled/disabled state
     */
    updateCorpusDependentFields() {
        const useCorpus = document.getElementById('flag-use-corpus')?.checked || false;
        document.querySelectorAll('.corpus-dependent').forEach(el => {
            if (useCorpus) {
                el.classList.remove('disabled');
            } else {
                el.classList.add('disabled');
            }
        });
    }

    /**
     * Enable/disable validation-dependent fields based on inline validation toggle
     */
    updateValidationDependentFields() {
        const useInline = document.getElementById('flag-use-inline-validation')?.checked || false;
        document.querySelectorAll('.validation-dependent').forEach(el => {
            if (useInline) {
                el.classList.remove('disabled');
            } else {
                el.classList.add('disabled');
            }
        });
    }

    /**
     * Get current flag values from the UI
     */
    getGodWriteFlags() {
        const val = (id) => document.getElementById(id)?.value || '';
        const checked = (id) => document.getElementById(id)?.checked || false;

        return {
            style: val('flag-style'),
            format: val('flag-format'),
            length: val('flag-length'),
            useCorpus: checked('flag-use-corpus'),
            corpusCollections: this.getSelectedCollections().join(','),
            corpusChunks: parseInt(val('flag-corpus-chunks')) || 15,
            corpusRelevance: parseFloat(val('flag-corpus-relevance')) || 0.75,
            verifySources: checked('flag-verify-sources'),
            acquireMissing: checked('flag-acquire-missing'),
            downloadDir: val('flag-download-dir'),
            useInlineValidation: checked('flag-use-inline-validation'),
            inlineValidationStrictness: val('flag-inline-validation-strictness'),
            inlineMaxRetries: parseInt(val('flag-inline-max-retries')) || 3,
            inlineEnableCitationLookup: checked('flag-inline-enable-citation-lookup'),
            citationEnforcementMode: val('flag-citation-enforcement-mode'),
            citationMinPassRate: parseFloat(val('flag-citation-min-pass-rate')) || 0.85,
            citationMaxHallucinations: parseInt(val('flag-citation-max-hallucinations')) || 3,
            enableEndnotes: checked('flag-enable-endnotes'),
            useStagedComposition: checked('flag-use-staged-composition'),
            chapterOutline: val('flag-chapter-outline') || null
        };
    }

    /**
     * Set flag values in the UI
     */
    setGodWriteFlags(flags) {
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
        const setChecked = (id, v) => { const el = document.getElementById(id); if (el) el.checked = !!v; };

        setVal('flag-style', flags.style || flags['style'] || 'academic');
        setVal('flag-format', flags.format || flags['format'] || 'paper');
        setVal('flag-length', flags.length || flags['length'] || 'comprehensive');
        setChecked('flag-use-corpus', flags.useCorpus ?? flags['use-corpus'] ?? true);
        setVal('flag-corpus-chunks', flags.corpusChunks ?? flags['corpus-chunks'] ?? 15);
        setVal('flag-corpus-relevance', flags.corpusRelevance ?? flags['corpus-relevance'] ?? 0.75);
        setChecked('flag-verify-sources', flags.verifySources ?? flags['verify-sources'] ?? false);
        setChecked('flag-acquire-missing', flags.acquireMissing ?? flags['acquire-missing'] ?? false);
        setVal('flag-download-dir', flags.downloadDir ?? flags['download-dir'] ?? './corpus/downloads');
        setChecked('flag-use-inline-validation', flags.useInlineValidation ?? flags['use-inline-validation'] ?? true);
        setVal('flag-inline-validation-strictness', flags.inlineValidationStrictness ?? flags['inline-validation-strictness'] ?? 'moderate');
        setVal('flag-inline-max-retries', flags.inlineMaxRetries ?? flags['inline-max-retries'] ?? 3);
        setChecked('flag-inline-enable-citation-lookup', flags.inlineEnableCitationLookup ?? flags['inline-enable-citation-lookup'] ?? true);
        setVal('flag-citation-enforcement-mode', flags.citationEnforcementMode ?? flags['citation-enforcement-mode'] ?? 'auto-correct');
        setVal('flag-citation-min-pass-rate', flags.citationMinPassRate ?? flags['citation-min-pass-rate'] ?? 0.85);
        setVal('flag-citation-max-hallucinations', flags.citationMaxHallucinations ?? flags['citation-max-hallucinations'] ?? 3);
        setChecked('flag-enable-endnotes', flags.enableEndnotes ?? flags['enable-endnotes'] ?? false);
        setChecked('flag-use-staged-composition', flags.useStagedComposition ?? flags['use-staged-composition'] ?? false);
        setVal('flag-chapter-outline', flags.chapterOutline ?? flags['chapter-outline'] ?? '');

        // Update slider displays
        const relDisplay = document.getElementById('corpus-relevance-value');
        if (relDisplay) relDisplay.textContent = document.getElementById('flag-corpus-relevance')?.value || '0.75';
        const citDisplay = document.getElementById('citation-pass-rate-value');
        if (citDisplay) citDisplay.textContent = document.getElementById('flag-citation-min-pass-rate')?.value || '0.85';

        this.updateCorpusDependentFields();
        this.updateValidationDependentFields();
        this.updateGodWriteEstimates();
    }

    /**
     * Get selected collection names
     */
    getSelectedCollections() {
        const grid = document.getElementById('gwCollectionGrid');
        if (!grid) return [];
        return Array.from(grid.querySelectorAll('input[type="checkbox"]:checked'))
            .map(cb => cb.value);
    }

    /**
     * Apply a preset configuration
     */
    applyGodWritePreset(presetKey) {
        if (!presetKey) {
            // Custom configuration - don't change anything
            document.getElementById('gwPresetDescription').textContent = '';
            document.getElementById('gwDeletePreset').style.display = 'none';
            return;
        }

        // Check built-in presets first
        let preset = DashboardApp.GOD_WRITE_PRESETS[presetKey];
        let isCustom = false;

        // Check custom presets
        if (!preset) {
            const customPresets = this.getCustomPresets();
            preset = customPresets.find(p => p.id === presetKey);
            isCustom = true;
        }

        if (!preset) return;

        this.setGodWriteFlags(preset.flags);

        // Update description
        const descEl = document.getElementById('gwPresetDescription');
        if (descEl) descEl.textContent = preset.description || '';

        // Show delete button for custom presets
        const deleteBtn = document.getElementById('gwDeletePreset');
        if (deleteBtn) deleteBtn.style.display = isCustom ? 'inline-block' : 'none';

        // Update select
        const select = document.getElementById('gwPresetSelect');
        if (select) select.value = presetKey;

        this.toastSuccess('Preset Applied', preset.name || presetKey);
    }

    /**
     * Show preset save dialog
     */
    showPresetDialog() {
        const dialog = document.getElementById('gwPresetDialog');
        if (dialog) dialog.style.display = 'flex';
        document.getElementById('gwPresetName')?.focus();
    }

    /**
     * Hide preset save dialog
     */
    hidePresetDialog() {
        const dialog = document.getElementById('gwPresetDialog');
        if (dialog) dialog.style.display = 'none';
    }

    /**
     * Save current configuration as a custom preset
     */
    saveCustomPreset() {
        const name = document.getElementById('gwPresetName')?.value?.trim();
        const desc = document.getElementById('gwPresetDesc')?.value?.trim();

        if (!name) {
            this.toastError('Error', 'Please enter a preset name');
            return;
        }

        const flags = this.getGodWriteFlags();
        const id = 'custom-' + Date.now();
        const preset = { id, name, description: desc || '', flags, createdAt: new Date().toISOString() };

        const customs = this.getCustomPresets();
        customs.push(preset);
        localStorage.setItem('gw-custom-presets', JSON.stringify(customs));

        this.loadCustomPresets();
        this.hidePresetDialog();

        // Clear inputs
        if (document.getElementById('gwPresetName')) document.getElementById('gwPresetName').value = '';
        if (document.getElementById('gwPresetDesc')) document.getElementById('gwPresetDesc').value = '';

        // Select the new preset
        const select = document.getElementById('gwPresetSelect');
        if (select) select.value = id;

        this.toastSuccess('Preset Saved', name);
    }

    /**
     * Delete selected custom preset
     */
    deleteCustomPreset() {
        const select = document.getElementById('gwPresetSelect');
        const key = select?.value;
        if (!key || !key.startsWith('custom-')) return;

        const customs = this.getCustomPresets().filter(p => p.id !== key);
        localStorage.setItem('gw-custom-presets', JSON.stringify(customs));
        this.loadCustomPresets();

        if (select) select.value = '';
        document.getElementById('gwDeletePreset').style.display = 'none';
        this.toastSuccess('Preset Deleted', 'Custom preset removed');
    }

    /**
     * Get custom presets from localStorage
     */
    getCustomPresets() {
        try {
            return JSON.parse(localStorage.getItem('gw-custom-presets') || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Load custom presets into the dropdown
     */
    loadCustomPresets() {
        const group = document.getElementById('gwCustomPresetsGroup');
        if (!group) return;

        const customs = this.getCustomPresets();
        group.innerHTML = customs.map(p =>
            `<option value="${this.escapeHtml(p.id)}">${this.escapeHtml(p.name)}</option>`
        ).join('');
    }

    /**
     * Update generation estimates based on current flags
     */
    updateGodWriteEstimates() {
        const flags = this.getGodWriteFlags();
        const estimates = this.estimateGeneration(flags);

        const el = (id) => document.getElementById(id);
        if (el('gwEstWords')) el('gwEstWords').textContent = `${estimates.minWords.toLocaleString()} - ${estimates.maxWords.toLocaleString()}`;
        if (el('gwEstTime')) {
            const minMin = Math.floor(estimates.minTime / 60);
            const minSec = estimates.minTime % 60;
            const maxMin = Math.floor(estimates.maxTime / 60);
            const maxSec = estimates.maxTime % 60;
            el('gwEstTime').textContent = `${minMin}:${minSec.toString().padStart(2, '0')} - ${maxMin}:${maxSec.toString().padStart(2, '0')}`;
        }
        if (el('gwEstCost')) el('gwEstCost').textContent = `~$${estimates.minCost} - $${estimates.maxCost}`;

        // Pipeline description
        const pipelineParts = ['7-stage gauntlet'];
        if (flags.useStagedComposition) pipelineParts.push('staged composition');
        if (flags.useCorpus) pipelineParts.push('corpus retrieval');
        if (flags.verifySources) pipelineParts.push('source verification');
        if (el('gwEstPipeline')) el('gwEstPipeline').textContent = pipelineParts.join(' + ');
    }

    /**
     * Estimate generation parameters
     */
    estimateGeneration(flags) {
        const estimates = { minWords: 500, maxWords: 1500, minTime: 30, maxTime: 120, minCost: '0.05', maxCost: '0.15' };

        const lengthMultiplier = { short: 0.5, medium: 1.0, long: 2.0, comprehensive: 3.0 };
        const mult = lengthMultiplier[flags.length] || 1.0;
        estimates.minWords = Math.round(500 * mult);
        estimates.maxWords = Math.round(1500 * mult);

        let timeAdd = 0;
        if (flags.useCorpus) timeAdd += 15;
        if (flags.verifySources) timeAdd += 10;
        if (flags.useStagedComposition) timeAdd += 60;
        timeAdd += 30; // gauntlet base

        estimates.minTime = Math.round((30 + timeAdd * 0.5) * mult);
        estimates.maxTime = Math.round((60 + timeAdd) * mult);

        const estOutputTokens = estimates.maxWords * 1.5;
        const estInputTokens = flags.useCorpus ? 8000 : 2000;
        estimates.minCost = ((estInputTokens * 0.002 + estOutputTokens * 0.5 * 0.01) / 1000).toFixed(2);
        estimates.maxCost = ((estInputTokens * 2 * 0.002 + estOutputTokens * 0.01) / 1000).toFixed(2);

        return estimates;
    }

    /**
     * Submit a God Write generation request
     */
    async submitGodWriteGeneration() {
        if (this.godWriteGenerating) return;

        const prompt = document.getElementById('gwPromptInput')?.value?.trim();
        if (!prompt) {
            this.toastError('Error', 'Please enter a writing prompt');
            return;
        }

        const flags = this.getGodWriteFlags();
        this.godWriteGenerating = true;
        this.godWriteStartTime = Date.now();

        // Update UI for generating state
        const submitBtn = document.getElementById('gwSubmit');
        if (submitBtn) {
            submitBtn.querySelector('.btn-text').style.display = 'none';
            submitBtn.querySelector('.btn-loading').style.display = 'inline-flex';
            submitBtn.querySelector('.shortcut-hint').style.display = 'none';
            submitBtn.disabled = true;
        }

        // Show progress bar
        const progress = document.getElementById('gwProgress');
        if (progress) progress.style.display = 'block';

        // Show live metrics
        const estimates = document.getElementById('gwEstimates');
        const liveMetrics = document.getElementById('gwLiveMetrics');
        if (estimates) estimates.style.display = 'none';
        if (liveMetrics) liveMetrics.style.display = 'block';

        // Start elapsed timer
        this.godWriteElapsedInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.godWriteStartTime) / 1000);
            const min = Math.floor(elapsed / 60);
            const sec = elapsed % 60;
            const el = document.getElementById('gwLiveElapsed');
            if (el) el.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
        }, 1000);

        // Show gauntlet pipeline
        const gauntlet = document.getElementById('gwGauntletPipeline');
        if (gauntlet) {
            gauntlet.style.display = 'block';
            this.initGauntletStages();
        }

        try {
            const response = await fetch('/api/god-write/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, flags })
            });

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}`);
            }

            const result = await response.json();
            this.godWriteData.currentJob = result;

            // Start polling for status
            this.startGodWritePolling(result.jobId);

        } catch (error) {
            console.error('God Write generation error:', error);
            this.toastError('Generation Failed', error.message || 'Failed to submit generation request');
            this.resetGodWriteGeneratingState();
        }
    }

    /**
     * Initialize gauntlet stage placeholders
     */
    initGauntletStages() {
        const container = document.getElementById('gwGauntletStages');
        if (!container) return;

        const stages = [
            'Citation Verifier', 'Quotation Fidelity', 'Toulmin Enforcer', 'Argument Coherence',
            'Citation Completeness', 'Citation Density', 'Style Consistency', 'Factual Accuracy',
            'Claim Verification'
        ];

        container.innerHTML = stages.map((name, i) => `
            <div class="gauntlet-stage" data-stage="${i}" data-status="pending">
                <div class="stage-header">
                    <span class="stage-name">${name}</span>
                    <span class="stage-status stage-pending">PENDING</span>
                </div>
                <div class="stage-progress-bar">
                    <div class="stage-fill" style="width: 0%; background: var(--bg-tertiary);"></div>
                </div>
                <div class="stage-meta">
                    <span class="stage-score">--</span>
                    <span class="stage-duration">--</span>
                </div>
            </div>
        `).join('');
    }

    /**
     * Start polling for God Write job status
     */
    startGodWritePolling(jobId) {
        this.godWritePollingInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/god-write/status/${jobId}`);
                if (!response.ok) {
                    console.warn('[GW-POLL] Response not ok:', response.status);
                    return;
                }

                // Parse as text first, then JSON - to catch control character issues
                const rawText = await response.text();
                let status;
                try {
                    status = JSON.parse(rawText);
                } catch (parseErr) {
                    console.error('[GW-POLL] JSON parse error:', parseErr.message, 'at position:', parseErr.message.match(/position (\d+)/)?.[1]);
                    console.error('[GW-POLL] Raw text around error (first 200 chars):', rawText.substring(0, 200));
                    return; // Skip this poll, try again next cycle
                }

                console.log('[GW-POLL] status:', status.status, 'progress:', status.progress, 'hasResult:', !!status.result);
                this.updateGodWriteProgress(status);

                if (status.status === 'complete' || status.status === 'failed') {
                    this.stopGodWritePolling();
                    if (status.status === 'complete') {
                        console.log('[GW-POLL] Complete! result keys:', status.result ? Object.keys(status.result) : 'NO RESULT');
                        console.log('[GW-POLL] content length:', status.result?.content?.length, 'gauntlet:', !!status.result?.gauntletResults);
                        this.displayGodWriteOutput(status.result);
                    } else {
                        this.toastError('Generation Failed', status.error || 'Unknown error');
                    }
                    this.resetGodWriteGeneratingState();
                }
            } catch (error) {
                console.error('[GW-POLL] Polling error:', error);
            }
        }, 2000);
    }

    /**
     * Stop God Write job polling
     */
    stopGodWritePolling() {
        if (this.godWritePollingInterval) {
            clearInterval(this.godWritePollingInterval);
            this.godWritePollingInterval = null;
        }
    }

    /**
     * Update God Write progress display
     */
    updateGodWriteProgress(status) {
        // Update progress bar
        const fill = document.getElementById('gwProgressFill');
        if (fill && status.progress) {
            fill.style.width = `${status.progress}%`;
        }

        // Update live stage
        const stageEl = document.getElementById('gwLiveStage');
        if (stageEl && status.stageProgress) {
            stageEl.textContent = status.stageProgress;
        }

        // Update generating status
        const genStatus = document.getElementById('gwGeneratingStatus');
        if (genStatus && status.stage) {
            genStatus.textContent = `${status.stage}...`;
        }

        // Update gauntlet stages if available
        if (status.gauntletProgress) {
            this.updateGauntletStages(status.gauntletProgress);
        }
    }

    /**
     * Update gauntlet stage visuals
     */
    updateGauntletStages(progress) {
        if (!Array.isArray(progress)) return;

        progress.forEach((stage, i) => {
            const stageEl = document.querySelector(`.gauntlet-stage[data-stage="${i}"]`);
            if (!stageEl) return;

            stageEl.dataset.status = stage.status || 'pending';

            const statusEl = stageEl.querySelector('.stage-status');
            if (statusEl) {
                if (stage.status === 'complete') {
                    statusEl.className = `stage-status ${stage.passed ? 'stage-pass' : 'stage-fail'}`;
                    statusEl.textContent = stage.passed ? 'PASS' : 'FAIL';
                } else if (stage.status === 'running') {
                    statusEl.className = 'stage-status stage-running';
                    statusEl.textContent = 'RUNNING';
                }
            }

            const fill = stageEl.querySelector('.stage-fill');
            if (fill && stage.score != null) {
                const pct = Math.round(stage.score * 100);
                fill.style.width = `${pct}%`;
                fill.style.background = stage.score >= 0.85 ? 'var(--accent-success)' :
                    stage.score >= 0.70 ? 'var(--accent-warning)' : 'var(--accent-error)';
            }

            const scoreEl = stageEl.querySelector('.stage-score');
            if (scoreEl && stage.score != null) scoreEl.textContent = stage.score.toFixed(2);
            const durEl = stageEl.querySelector('.stage-duration');
            if (durEl && stage.durationMs != null) durEl.textContent = `${(stage.durationMs / 1000).toFixed(1)}s`;
        });
    }

    /**
     * Reset the generating state UI
     */
    resetGodWriteGeneratingState() {
        this.godWriteGenerating = false;

        // Clear timers
        if (this.godWriteElapsedInterval) {
            clearInterval(this.godWriteElapsedInterval);
            this.godWriteElapsedInterval = null;
        }

        // Reset button
        const submitBtn = document.getElementById('gwSubmit');
        if (submitBtn) {
            submitBtn.querySelector('.btn-text').style.display = 'inline';
            submitBtn.querySelector('.btn-loading').style.display = 'none';
            submitBtn.querySelector('.shortcut-hint').style.display = 'inline';
            submitBtn.disabled = false;
        }

        // Hide progress
        const progress = document.getElementById('gwProgress');
        if (progress) progress.style.display = 'none';

        // Restore estimates, hide live metrics
        const estimates = document.getElementById('gwEstimates');
        const liveMetrics = document.getElementById('gwLiveMetrics');
        if (estimates) estimates.style.display = 'grid';
        if (liveMetrics) liveMetrics.style.display = 'none';
    }

    /**
     * Display God Write output
     */
    displayGodWriteOutput(result) {
        console.log('[GW-DISPLAY] Called with result:', !!result);
        if (!result) { console.warn('[GW-DISPLAY] Result is null/undefined, returning early'); return; }

        console.log('[GW-DISPLAY] content length:', result.content?.length, 'wordCount:', result.wordCount, 'qualityScore:', result.qualityScore);
        this.godWriteData.generatedContent = result;
        this.godWriteData.rawMarkdown = result.content;

        // Hide empty state, show output
        const empty = document.getElementById('gwOutputEmpty');
        const content = document.getElementById('gwOutputContent');
        console.log('[GW-DISPLAY] DOM elements found: empty=', !!empty, 'content=', !!content);
        if (empty) empty.style.display = 'none';
        if (content) content.style.display = 'block';

        // Render markdown
        const rendered = document.getElementById('gwOutputRendered');
        console.log('[GW-DISPLAY] rendered element:', !!rendered, 'marked available:', typeof marked !== 'undefined');
        if (rendered && typeof marked !== 'undefined') {
            try {
                rendered.innerHTML = marked.parse(result.content || '');
                console.log('[GW-DISPLAY] Rendered markdown, innerHTML length:', rendered.innerHTML.length);
            } catch (markErr) {
                console.error('[GW-DISPLAY] marked.parse error:', markErr);
                rendered.innerHTML = `<pre>${this.escapeHtml(result.content || '')}</pre>`;
            }
        } else if (rendered) {
            rendered.innerHTML = `<pre>${this.escapeHtml(result.content || '')}</pre>`;
            console.log('[GW-DISPLAY] Rendered plain text fallback');
        }

        // Show output actions
        const actions = document.getElementById('gwOutputActions');
        if (actions) actions.style.display = 'flex';

        // Quality badge
        const scoreBadge = document.getElementById('gwQualityBadge');
        const scoreValue = document.getElementById('gwQualityScore');
        if (scoreValue) scoreValue.textContent = (result.qualityScore || 0).toFixed(2);
        if (scoreBadge) {
            scoreBadge.className = 'quality-badge ' +
                (result.qualityScore >= 0.85 ? 'quality-pass' :
                result.qualityScore >= 0.70 ? 'quality-warn' : 'quality-fail');
        }

        // Word count
        const wordCount = document.getElementById('gwWordCount');
        if (wordCount) wordCount.textContent = `${(result.wordCount || 0).toLocaleString()} words`;

        // Gauntlet results
        if (result.gauntletResults) {
            this.displayGauntletResults(result.gauntletResults);
        }

        // Citation results
        if (result.citations) {
            this.displayCitationResults(result.citations);
        }

        // Store revisions if available
        if (result.revisions && result.revisions.length > 1) {
            this.godWriteData.revisions = result.revisions;
            const diffBtn = document.getElementById('gwToggleDiff');
            if (diffBtn) diffBtn.style.display = 'inline-block';
        }

        this.toastSuccess('Generation Complete', `${(result.wordCount || 0).toLocaleString()} words generated`);
    }

    /**
     * Display gauntlet results summary
     */
    displayGauntletResults(gauntlet) {
        console.log('[GW-GAUNTLET] Called with:', gauntlet ? { overallScore: gauntlet.overallScore, passed: gauntlet.passed, stagesCount: gauntlet.stages?.length } : 'null');
        const summary = document.getElementById('gwGauntletSummary');
        console.log('[GW-GAUNTLET] summary element found:', !!summary);
        if (summary) summary.style.display = 'block';

        const overall = document.getElementById('gwGauntletOverall');
        if (overall) overall.textContent = (gauntlet.overallScore || 0).toFixed(2);

        const verdict = document.getElementById('gwGauntletVerdict');
        if (verdict) {
            verdict.textContent = gauntlet.passed ? 'PASSED' : 'FAILED';
            verdict.className = `gauntlet-verdict ${gauntlet.passed ? 'pass' : 'fail'}`;
        }

        if (gauntlet.revisionCount != null) {
            const revEl = document.getElementById('gwGauntletRevisions');
            if (revEl) revEl.textContent = gauntlet.revisionCount;
        }
    }

    /**
     * Display citation verification results
     */
    displayCitationResults(citations) {
        const verPanel = document.getElementById('gwSourceVerification');
        if (!verPanel) return;

        verPanel.style.display = 'block';

        const el = (id) => document.getElementById(id);
        if (el('gwVerifiedCount')) el('gwVerifiedCount').textContent = citations.verified || 0;
        if (el('gwMissingCount')) el('gwMissingCount').textContent = citations.missing || 0;
        if (el('gwVerifiedTotal')) el('gwVerifiedTotal').textContent = citations.verified || 0;
        if (el('gwMissingTotal')) el('gwMissingTotal').textContent = citations.missing || 0;

        const total = (citations.total || 0);
        const rate = total > 0 ? Math.round(((citations.verified || 0) / total) * 100) : 0;
        if (el('gwVerificationRate')) el('gwVerificationRate').textContent = `${rate}%`;

        // Show missing section if any
        const missingSection = document.getElementById('gwMissingSection');
        if (missingSection) {
            missingSection.style.display = (citations.missing || 0) > 0 ? 'block' : 'none';
        }
    }

    /**
     * Copy God Write output to clipboard
     */
    async copyGodWriteOutput() {
        const content = this.godWriteData.rawMarkdown;
        if (!content) {
            this.toastError('Error', 'No output to copy');
            return;
        }

        try {
            await navigator.clipboard.writeText(content);
            this.toastSuccess('Copied', 'Output copied to clipboard');
        } catch (error) {
            this.toastError('Copy Failed', 'Could not copy to clipboard');
        }
    }

    /**
     * Download God Write output as markdown
     */
    downloadGodWriteMarkdown() {
        const content = this.godWriteData.rawMarkdown;
        if (!content) {
            this.toastError('Error', 'No output to download');
            return;
        }

        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `god-write-${Date.now()}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.toastSuccess('Downloaded', 'Markdown file downloaded');
    }

    /**
     * Show LaTeX export dialog
     */
    showLatexExportDialog() {
        if (!this.godWriteData.rawMarkdown) {
            this.toastError('Error', 'No output to export');
            return;
        }
        const dialog = document.getElementById('gwLatexDialog');
        if (dialog) dialog.style.display = 'flex';
    }

    /**
     * Hide LaTeX export dialog
     */
    hideLatexDialog() {
        const dialog = document.getElementById('gwLatexDialog');
        if (dialog) dialog.style.display = 'none';
    }

    /**
     * Export content as LaTeX
     */
    async exportLatex() {
        const content = this.godWriteData.rawMarkdown;
        if (!content) return;

        const method = document.querySelector('input[name="latexMethod"]:checked')?.value || 'regex';
        const options = {
            documentClass: document.getElementById('latexDocClass')?.value || 'report',
            fontSize: parseInt(document.getElementById('latexFontSize')?.value) || 12,
            spacing: document.getElementById('latexSpacing')?.value || 'double',
            citationStyle: document.getElementById('latexCiteStyle')?.value || 'authoryear'
        };

        try {
            const response = await fetch('/api/god-write/convert-latex', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, method, options })
            });

            if (!response.ok) throw new Error('Conversion failed');

            const result = await response.json();

            // Download .tex file
            const blob = new Blob([result.latex], { type: 'application/x-tex' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = result.filename || `god-write-${Date.now()}.tex`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.hideLatexDialog();
            this.toastSuccess('Exported', 'LaTeX file downloaded');
        } catch (error) {
            this.toastError('Export Failed', error.message || 'LaTeX conversion failed');
        }
    }

    /**
     * Toggle diff viewer
     */
    toggleDiffViewer() {
        const viewer = document.getElementById('gwDiffViewer');
        if (!viewer) return;

        if (viewer.style.display === 'none') {
            if (this.godWriteData.revisions.length < 2) {
                this.toastError('No Revisions', 'Diff requires at least 2 revisions');
                return;
            }
            viewer.style.display = 'block';
            this.renderDiff();
        } else {
            viewer.style.display = 'none';
        }
    }

    /**
     * Render diff between revisions
     */
    renderDiff() {
        if (typeof Diff === 'undefined' || this.godWriteData.revisions.length < 2) return;

        const revisions = this.godWriteData.revisions;
        const oldText = revisions[revisions.length - 2]?.content || '';
        const newText = revisions[revisions.length - 1]?.content || '';
        const mode = document.querySelector('input[name="diffMode"]:checked')?.value || 'inline';

        const diffContent = document.getElementById('gwDiffContent');
        if (!diffContent) return;

        if (mode === 'inline') {
            const diff = Diff.diffWords(oldText, newText);
            diffContent.innerHTML = diff.map(part => {
                if (part.added) return `<ins class="diff-ins">${this.escapeHtml(part.value)}</ins>`;
                if (part.removed) return `<del class="diff-del">${this.escapeHtml(part.value)}</del>`;
                return this.escapeHtml(part.value);
            }).join('');
        } else {
            const diff = Diff.diffLines(oldText, newText);
            diffContent.innerHTML = diff.map(part => {
                if (part.added) return `<ins class="diff-ins">${this.escapeHtml(part.value)}</ins>`;
                if (part.removed) return `<del class="diff-del">${this.escapeHtml(part.value)}</del>`;
                return this.escapeHtml(part.value);
            }).join('');
        }

        // Stats
        const diff = Diff.diffWords(oldText, newText);
        let added = 0, removed = 0;
        diff.forEach(part => {
            if (part.added) added += part.count || 0;
            if (part.removed) removed += part.count || 0;
        });
        const addedEl = document.getElementById('gwDiffAdded');
        const removedEl = document.getElementById('gwDiffRemoved');
        if (addedEl) addedEl.textContent = added;
        if (removedEl) removedEl.textContent = removed;
    }

    /**
     * Load God Write history
     */
    async loadGodWriteHistory() {
        try {
            const response = await fetch('/api/god-write/history?limit=50');
            if (response.ok) {
                const data = await response.json();
                this.godWriteData.history = data.jobs || [];
                this.renderGodWriteHistory();
            }
        } catch (error) {
            console.warn('God Write history endpoint not available:', error.message);
        }
    }

    /**
     * Render history list
     */
    renderGodWriteHistory() {
        const list = document.getElementById('gwHistoryList');
        const countBadge = document.getElementById('gwHistoryCount');
        if (!list) return;

        const history = this.godWriteData.history;
        if (countBadge) countBadge.textContent = history.length;

        if (history.length === 0) {
            list.innerHTML = '<div class="loading-placeholder">No generation history yet</div>';
            return;
        }

        list.innerHTML = history.map(job => {
            const date = new Date(job.createdAt).toLocaleString();
            const durationSec = job.durationMs ? Math.round(job.durationMs / 1000) : 0;
            const durMin = Math.floor(durationSec / 60);
            const durSec = durationSec % 60;

            const qualityClass = (job.qualityScore || 0) >= 0.85 ? 'quality-pass' :
                (job.qualityScore || 0) >= 0.70 ? 'quality-warn' : '';

            return `
            <div class="history-item" data-job-id="${this.escapeHtml(job.jobId)}">
                <div class="history-item-header">
                    <span class="history-date">${date}</span>
                    <span class="history-quality ${qualityClass}">${(job.qualityScore || 0).toFixed(2)}</span>
                </div>
                <div class="history-prompt">${this.escapeHtml(job.truncatedPrompt || job.prompt || '--')}</div>
                <div class="history-meta">
                    <span class="history-words">${(job.wordCount || 0).toLocaleString()} words</span>
                    <span class="history-duration">${durMin}m ${durSec}s</span>
                </div>
                <div class="history-actions">
                    <button class="btn btn-sm btn-secondary" onclick="window.dashboardApp?.loadHistoryOutput('${this.escapeHtml(job.jobId)}')">Load Output</button>
                    <button class="btn btn-sm btn-secondary" onclick="window.dashboardApp?.loadHistoryConfig('${this.escapeHtml(job.jobId)}')">Load Config</button>
                    <button class="btn btn-sm btn-primary" onclick="window.dashboardApp?.rerunHistory('${this.escapeHtml(job.jobId)}')">Re-run</button>
                    <button class="btn btn-sm btn-danger" onclick="window.dashboardApp?.deleteHistoryItem('${this.escapeHtml(job.jobId)}')">Delete</button>
                </div>
            </div>`;
        }).join('');
    }

    /**
     * Load output from a history item
     */
    async loadHistoryOutput(jobId) {
        try {
            const response = await fetch(`/api/god-write/status/${jobId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.result) {
                    this.displayGodWriteOutput(data.result);
                    this.toastSuccess('Loaded', 'Output loaded from history');
                }
            }
        } catch (error) {
            this.toastError('Error', 'Failed to load history output');
        }
    }

    /**
     * Load configuration from a history item
     */
    loadHistoryConfig(jobId) {
        const job = this.godWriteData.history.find(j => j.jobId === jobId);
        if (job?.flags) {
            this.setGodWriteFlags(job.flags);
            this.toastSuccess('Config Loaded', 'Flag configuration restored');
        }
    }

    /**
     * Re-run a history item
     */
    async rerunHistory(jobId) {
        const job = this.godWriteData.history.find(j => j.jobId === jobId);
        if (!job) return;

        // Load config and prompt
        if (job.flags) this.setGodWriteFlags(job.flags);
        const input = document.getElementById('gwPromptInput');
        if (input && job.prompt) input.value = job.prompt;

        // Submit
        await this.submitGodWriteGeneration();
    }

    /**
     * Delete a history item
     */
    async deleteHistoryItem(jobId) {
        if (!confirm('Delete this history entry?')) return;

        try {
            const response = await fetch(`/api/god-write/history/${jobId}`, { method: 'DELETE' });
            if (response.ok) {
                this.godWriteData.history = this.godWriteData.history.filter(j => j.jobId !== jobId);
                this.renderGodWriteHistory();
                this.toastSuccess('Deleted', 'History entry removed');
            }
        } catch (error) {
            this.toastError('Error', 'Failed to delete history entry');
        }
    }

    /**
     * Toggle history panel visibility
     */
    toggleHistoryPanel() {
        const body = document.getElementById('gwHistoryBody');
        if (body) {
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
        }
    }

    /**
     * Filter history by search term
     */
    filterGodWriteHistory(term) {
        const items = document.querySelectorAll('.history-item');
        const lowerTerm = term.toLowerCase();
        items.forEach(item => {
            const prompt = item.querySelector('.history-prompt')?.textContent?.toLowerCase() || '';
            item.style.display = prompt.includes(lowerTerm) ? '' : 'none';
        });
    }

    /**
     * Sort history list
     */
    sortGodWriteHistory(sortBy) {
        const history = [...this.godWriteData.history];
        switch (sortBy) {
            case 'oldest':
                history.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'highest-quality':
                history.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
                break;
            case 'longest':
                history.sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0));
                break;
            default: // newest
                history.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
        this.godWriteData.history = history;
        this.renderGodWriteHistory();
    }

    /**
     * Clear God Write prompt
     */
    clearGodWritePrompt() {
        const input = document.getElementById('gwPromptInput');
        if (input) input.value = '';
        const count = document.getElementById('gwCharCount');
        if (count) count.textContent = '0 characters';
    }

    /**
     * Close all God Write dialogs
     */
    closeGodWriteDialogs() {
        this.hidePresetDialog();
        this.hideLatexDialog();
        const diff = document.getElementById('gwDiffViewer');
        if (diff) diff.style.display = 'none';
    }

    // =========================================================================
    // END GOD WRITE TAB
    // =========================================================================

    /**
     * Setup sidebar toggle
     */
    setupSidebar() {
        const toggleBtn = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.sidebarCollapsed = !this.sidebarCollapsed;
                sidebar?.classList.toggle('collapsed', this.sidebarCollapsed);
                mainContent?.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
                this.saveUIState();
            });
        }

        // Restore collapsed state
        if (this.sidebarCollapsed) {
            sidebar?.classList.add('collapsed');
            mainContent?.classList.add('sidebar-collapsed');
        }
    }

    /**
     * Setup command bar
     */
    setupCommandBar() {
        const commandInput = document.getElementById('commandInput');
        const commandSubmit = document.getElementById('commandSubmit');
        const commandBar = document.querySelector('.command-bar');

        // Handle submit button click
        if (commandSubmit) {
            commandSubmit.addEventListener('click', () => {
                if (commandInput) {
                    this.executeCommand(commandInput.value.trim());
                }
            });
        }

        // Handle keyboard input
        if (commandInput) {
            commandInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.executeCommand(commandInput.value.trim());
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.navigateCommandHistory(-1);
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.navigateCommandHistory(1);
                } else if (e.key === 'Escape') {
                    commandInput.blur();
                }
            });

            // Focus on click in command bar area
            commandBar?.addEventListener('click', (e) => {
                if (e.target === commandBar || e.target.classList.contains('command-input-container')) {
                    commandInput.focus();
                }
            });
        }
    }

    /**
     * Navigate command history
     */
    navigateCommandHistory(direction) {
        const commandInput = document.getElementById('commandInput');
        if (!commandInput || this.commandHistory.length === 0) return;

        this.commandHistoryIndex += direction;
        this.commandHistoryIndex = Math.max(-1, Math.min(this.commandHistoryIndex, this.commandHistory.length - 1));

        if (this.commandHistoryIndex === -1) {
            commandInput.value = '';
        } else {
            commandInput.value = this.commandHistory[this.commandHistory.length - 1 - this.commandHistoryIndex];
        }
    }

    /**
     * Available commands for autocomplete
     */
    availableCommands = [
        { cmd: 'models', desc: 'List available models' },
        { cmd: 'models test', desc: 'Test a provider' },
        { cmd: 'use local', desc: 'Switch to local model' },
        { cmd: 'use claude', desc: 'Switch to Claude' },
        { cmd: 'use auto', desc: 'Enable auto-routing' },
        { cmd: 'vllm status', desc: 'Show vLLM server status' },
        { cmd: 'vllm models', desc: 'List vLLM models' },
        { cmd: 'vllm test', desc: 'Test vLLM connection' },
        { cmd: 'routing', desc: 'Show routing status' },
        { cmd: 'routing stats', desc: 'Show routing statistics' },
        { cmd: 'routing patterns', desc: 'Show routing patterns' },
        { cmd: 'routing suggest', desc: 'Get routing suggestions' },
        { cmd: 'costs', desc: 'Show cost summary' },
        { cmd: 'costs --detailed', desc: 'Show detailed costs' },
        { cmd: 'budget set daily', desc: 'Set daily budget' },
        { cmd: 'budget set monthly', desc: 'Set monthly budget' },
        { cmd: 'quality', desc: 'Show quality metrics' },
        { cmd: 'review', desc: 'Show pending reviews' },
        { cmd: 'analytics', desc: 'Show analytics dashboard' },
        { cmd: 'analytics summary', desc: 'Show summary' },
        { cmd: 'analytics models', desc: 'Show model stats' },
        { cmd: 'help', desc: 'Show available commands' },
    ];

    /**
     * Execute a command
     */
    async executeCommand(command) {
        if (!command) return;

        const commandInput = document.getElementById('commandInput');
        const commandOutput = document.getElementById('commandOutput');

        // Handle help command locally
        if (command.toLowerCase() === 'help') {
            this.showCommandHelp();
            return;
        }

        // Add to history (avoid duplicates)
        if (this.commandHistory[this.commandHistory.length - 1] !== command) {
            this.commandHistory.push(command);
            // Keep only last 50 commands
            if (this.commandHistory.length > 50) {
                this.commandHistory.shift();
            }
        }
        this.commandHistoryIndex = -1;
        this.saveUIState();

        // Clear input
        if (commandInput) commandInput.value = '';

        // Show executing message
        if (commandOutput) {
            commandOutput.innerHTML = `<span class="cmd-prompt">&gt;</span> <span class="cmd-input">${this.escapeHtml(command)}</span>\n<span class="cmd-status">Executing...</span>\n`;
        }

        try {
            const res = await fetch('/api/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });

            const data = await res.json();
            const output = data.output || data.error || 'No output';

            if (commandOutput) {
                commandOutput.innerHTML = `<span class="cmd-prompt">&gt;</span> <span class="cmd-input">${this.escapeHtml(command)}</span>\n` +
                    this.formatCommandOutput(output, data.success !== false);
                commandOutput.scrollTop = commandOutput.scrollHeight;
            }
        } catch (error) {
            if (commandOutput) {
                commandOutput.innerHTML = `<span class="cmd-prompt">&gt;</span> <span class="cmd-input">${this.escapeHtml(command)}</span>\n` +
                    `<span class="cmd-error">Error: ${this.escapeHtml(error.message)}</span>`;
            }
        }
    }

    /**
     * Format command output with syntax highlighting
     */
    formatCommandOutput(output, success) {
        if (!output) return '';

        // Split into lines and format
        const lines = output.split('\n');
        return lines.map(line => {
            // Headers (lines ending with :)
            if (line.match(/^[A-Z].*:$/)) {
                return `<span class="cmd-header">${this.escapeHtml(line)}</span>`;
            }
            // Success indicators
            if (line.includes('✓') || line.includes('OK') || line.includes('success')) {
                return `<span class="cmd-success">${this.escapeHtml(line)}</span>`;
            }
            // Warning indicators
            if (line.includes('⚠') || line.includes('warning') || line.includes('Warning')) {
                return `<span class="cmd-warning">${this.escapeHtml(line)}</span>`;
            }
            // Error indicators
            if (line.includes('✗') || line.includes('error') || line.includes('Error') || line.includes('failed')) {
                return `<span class="cmd-error">${this.escapeHtml(line)}</span>`;
            }
            // Numbers and stats
            if (line.match(/:\s*[\d.]+%?$/)) {
                return `<span class="cmd-stat">${this.escapeHtml(line)}</span>`;
            }
            // Commands (indented with -)
            if (line.match(/^\s+-\s/)) {
                return `<span class="cmd-item">${this.escapeHtml(line)}</span>`;
            }
            return this.escapeHtml(line);
        }).join('\n');
    }

    /**
     * Show command help
     */
    showCommandHelp() {
        const commandOutput = document.getElementById('commandOutput');
        if (!commandOutput) return;

        const helpHtml = `<span class="cmd-header">Available Commands:</span>\n\n` +
            this.availableCommands.map(c =>
                `<span class="cmd-item">  ${this.escapeHtml(c.cmd.padEnd(20))} - ${this.escapeHtml(c.desc)}</span>`
            ).join('\n') +
            `\n\n<span class="cmd-hint">Tip: Use ↑/↓ arrows to navigate command history</span>`;

        commandOutput.innerHTML = helpHtml;
    }

    /**
     * Setup command autocomplete
     */
    setupCommandAutocomplete() {
        const commandInput = document.getElementById('commandInput');
        if (!commandInput) return;

        // Create suggestions container
        let suggestionsEl = document.getElementById('commandSuggestions');
        if (!suggestionsEl) {
            suggestionsEl = document.createElement('div');
            suggestionsEl.id = 'commandSuggestions';
            suggestionsEl.className = 'command-suggestions';
            commandInput.parentNode.appendChild(suggestionsEl);
        }

        commandInput.addEventListener('input', () => {
            const value = commandInput.value.toLowerCase().trim();
            if (!value) {
                suggestionsEl.style.display = 'none';
                return;
            }

            const matches = this.availableCommands.filter(c =>
                c.cmd.toLowerCase().startsWith(value) ||
                c.desc.toLowerCase().includes(value)
            ).slice(0, 5);

            if (matches.length === 0) {
                suggestionsEl.style.display = 'none';
                return;
            }

            suggestionsEl.innerHTML = matches.map((m, i) =>
                `<div class="suggestion-item" data-cmd="${this.escapeHtml(m.cmd)}">
                    <span class="suggestion-cmd">${this.escapeHtml(m.cmd)}</span>
                    <span class="suggestion-desc">${this.escapeHtml(m.desc)}</span>
                </div>`
            ).join('');
            suggestionsEl.style.display = 'block';

            // Handle suggestion clicks
            suggestionsEl.querySelectorAll('.suggestion-item').forEach(item => {
                item.addEventListener('click', () => {
                    commandInput.value = item.dataset.cmd;
                    suggestionsEl.style.display = 'none';
                    commandInput.focus();
                });
            });
        });

        // Hide suggestions on blur (with delay for click)
        commandInput.addEventListener('blur', () => {
            setTimeout(() => {
                suggestionsEl.style.display = 'none';
            }, 200);
        });

        // Tab completion
        commandInput.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && suggestionsEl.style.display === 'block') {
                e.preventDefault();
                const firstMatch = suggestionsEl.querySelector('.suggestion-item');
                if (firstMatch) {
                    commandInput.value = firstMatch.dataset.cmd;
                    suggestionsEl.style.display = 'none';
                }
            }
        });
    }

    /**
     * Setup theme toggle
     */
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');

        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.isDarkTheme = !this.isDarkTheme;
                document.body.classList.toggle('light-theme', !this.isDarkTheme);
                this.saveUIState();
            });
        }

        // Apply saved theme
        if (!this.isDarkTheme) {
            document.body.classList.add('light-theme');
        }

        // Refresh button
        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshCurrentTab();
            });
        }
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+R or Cmd+R to refresh current tab (prevent browser refresh)
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                this.refreshCurrentTab();
                return;
            }

            // Ctrl+K or Cmd+K to focus command bar
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const commandBar = document.querySelector('.command-bar');
                const commandInput = document.getElementById('commandInput');
                commandBar?.classList.add('expanded');
                commandInput?.focus();
            }

            // Ctrl+F or Cmd+F to focus global search
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                const searchInput = document.getElementById('globalSearchInput');
                if (searchInput) {
                    // Open sidebar if collapsed
                    const sidebar = document.getElementById('sidebar');
                    if (sidebar && !sidebar.classList.contains('open')) {
                        sidebar.classList.add('open');
                    }
                    searchInput.focus();
                    searchInput.select();
                }
            }

            // Alt+1-8 for tab switching (added god-write tab)
            if (e.altKey && e.key >= '1' && e.key <= '8') {
                e.preventDefault();
                const tabs = ['analytics', 'monitoring', 'router', 'memory', 'activity', 'explore', 'phd-pipeline', 'god-write'];
                const tabIndex = parseInt(e.key) - 1;
                if (tabIndex < tabs.length) {
                    this.switchMainTab(tabs[tabIndex]);
                }
            }

            // Escape to close command bar and modals
            if (e.key === 'Escape') {
                const commandBar = document.querySelector('.command-bar');
                commandBar?.classList.remove('expanded');

                // Close any open modals
                document.querySelectorAll('.modal.show').forEach(modal => {
                    modal.classList.remove('show');
                });
            }
        });
    }

    /**
     * Setup panel visibility toggles
     */
    setupPanelToggles() {
        const container = document.getElementById('panelToggles');
        if (!container) return;

        // Get all panels from the current active tab
        const panels = document.querySelectorAll('.panel[data-panel]');
        const panelNames = new Map();

        // Create unique panel list
        panels.forEach(panel => {
            const panelId = panel.dataset.panel;
            if (!panelNames.has(panelId)) {
                const header = panel.querySelector('.panel-header h2');
                const name = header?.textContent || panelId;
                panelNames.set(panelId, name);
            }
        });

        // Create Show All / Hide All buttons
        const buttonsHtml = `
            <div class="toggle-actions">
                <button class="btn-toggle-all" id="showAllPanels">Show All</button>
                <button class="btn-toggle-all" id="hideAllPanels">Hide All</button>
            </div>
        `;

        // Create toggle HTML for each unique panel
        let togglesHtml = '';
        panelNames.forEach((name, panelId) => {
            const isHidden = localStorage.getItem(`panel-${panelId}`) === 'hidden';
            togglesHtml += `
                <label class="panel-toggle-item">
                    <input type="checkbox" class="panel-toggle" data-panel="${panelId}" ${!isHidden ? 'checked' : ''}>
                    <span class="toggle-label">${this.escapeHtml(name)}</span>
                </label>
            `;
        });

        container.innerHTML = buttonsHtml + togglesHtml;

        // Apply saved hidden states
        panelNames.forEach((_, panelId) => {
            const isHidden = localStorage.getItem(`panel-${panelId}`) === 'hidden';
            if (isHidden) {
                const panel = document.querySelector(`.panel[data-panel="${panelId}"]`);
                panel?.classList.add('hidden');
            }
        });

        // Setup toggle event listeners
        container.querySelectorAll('.panel-toggle').forEach(toggle => {
            toggle.addEventListener('change', () => {
                const panelId = toggle.dataset.panel;
                const allPanels = document.querySelectorAll(`.panel[data-panel="${panelId}"]`);

                allPanels.forEach(panel => {
                    if (toggle.checked) {
                        panel.classList.remove('hidden');
                    } else {
                        panel.classList.add('hidden');
                    }
                });

                if (toggle.checked) {
                    localStorage.removeItem(`panel-${panelId}`);
                } else {
                    localStorage.setItem(`panel-${panelId}`, 'hidden');
                }
            });
        });

        // Show All button
        document.getElementById('showAllPanels')?.addEventListener('click', () => {
            container.querySelectorAll('.panel-toggle').forEach(toggle => {
                toggle.checked = true;
                const panelId = toggle.dataset.panel;
                document.querySelectorAll(`.panel[data-panel="${panelId}"]`).forEach(p => p.classList.remove('hidden'));
                localStorage.removeItem(`panel-${panelId}`);
            });
        });

        // Hide All button
        document.getElementById('hideAllPanels')?.addEventListener('click', () => {
            container.querySelectorAll('.panel-toggle').forEach(toggle => {
                toggle.checked = false;
                const panelId = toggle.dataset.panel;
                document.querySelectorAll(`.panel[data-panel="${panelId}"]`).forEach(p => p.classList.add('hidden'));
                localStorage.setItem(`panel-${panelId}`, 'hidden');
            });
        });
    }

    /**
     * Setup DOM event listeners
     */
    setupEventListeners() {
        // Activity filters
        const componentFilter = document.getElementById('componentFilter');
        const statusFilter = document.getElementById('statusFilter');

        if (componentFilter) {
            componentFilter.addEventListener('change', (e) => {
                this.componentFilter = e.target.value;
                this.renderActivities();
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.statusFilter = e.target.value;
                this.renderActivities();
            });
        }

        // Memory inspector tabs
        document.querySelectorAll('.memory-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMemoryTab(e.target.dataset.tab);
            });
        });

        // Domain search
        const domainSearch = document.getElementById('domainSearch');
        if (domainSearch) {
            domainSearch.addEventListener('input', (e) => {
                this.domainSearchTerm = e.target.value.toLowerCase();
                this.renderInteractionStore();
            });
        }

        // Editable budget
        const budgetMonthlyEl = document.getElementById('budgetMonthly');
        if (budgetMonthlyEl) {
            budgetMonthlyEl.addEventListener('click', () => {
                const current = this.monthlyBudget;
                const newBudget = prompt('Enter monthly budget ($):', current.toString());
                if (newBudget !== null) {
                    const parsed = parseFloat(newBudget);
                    if (!isNaN(parsed) && parsed > 0) {
                        this.monthlyBudget = parsed;
                        localStorage.setItem('monthlyBudget', parsed.toString());
                        budgetMonthlyEl.textContent = `$${parsed.toFixed(2)}`;
                        // Re-render cost projections
                        if (this.analyticsData.costs) {
                            this.updateCostProjections(this.analyticsData.costs);
                        }
                    }
                }
            });
        }
    }

    /**
     * Switch memory inspector tab
     */
    switchMemoryTab(tabId) {
        document.querySelectorAll('.memory-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        document.querySelectorAll('.memory-tab-content').forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });

        this.currentMemoryTab = tabId;

        // Load tab data
        if (tabId === 'interaction-store') {
            this.loadInteractionStore();
        } else if (tabId === 'reasoning-bank') {
            this.loadReasoningBank();
        } else if (tabId === 'episode-store') {
            this.loadEpisodeStore();
        } else if (tabId === 'ucm-context') {
            this.loadUcmContext();
        } else if (tabId === 'hyperedge-store') {
            this.loadHyperedgeStore();
        }
    }

    /**
     * Initialize Chart.js charts
     */
    initializeCharts() {
        // Quality trend chart
        const qualityChartEl = document.getElementById('qualityTrendChart');
        if (qualityChartEl) {
            const ctx = qualityChartEl.getContext('2d');
            this.qualityChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Quality Score',
                        data: [],
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 1,
                            ticks: { color: '#a0a0a0' },
                            grid: { color: '#2a2a3e' }
                        },
                        x: {
                            ticks: { color: '#a0a0a0' },
                            grid: { color: '#2a2a3e' }
                        }
                    }
                }
            });
        }

        // Model comparison chart
        const modelChartEl = document.getElementById('modelComparisonChart');
        if (modelChartEl) {
            const ctx = modelChartEl.getContext('2d');
            this.modelChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Quality Score',
                        data: [],
                        backgroundColor: [
                            'rgba(102, 187, 106, 0.8)',
                            'rgba(66, 165, 245, 0.8)',
                            'rgba(255, 167, 38, 0.8)',
                            'rgba(171, 71, 188, 0.8)',
                            'rgba(239, 83, 80, 0.8)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            beginAtZero: true,
                            max: 1,
                            ticks: { color: '#a0a0a0' },
                            grid: { color: '#2a2a3e' }
                        },
                        y: {
                            ticks: { color: '#a0a0a0' },
                            grid: { display: false }
                        }
                    }
                }
            });
        }

        // Cost breakdown chart
        const costChartEl = document.getElementById('costBreakdownChart');
        if (costChartEl) {
            const ctx = costChartEl.getContext('2d');
            this.costChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: [],
                    datasets: [{
                        data: [],
                        backgroundColor: [
                            '#66bb6a',
                            '#42a5f5',
                            '#ffa726',
                            '#ab47bc',
                            '#ef5350'
                        ],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { color: '#a0a0a0' }
                        }
                    }
                }
            });
        }
    }

    /**
     * Load analytics data
     */
    async loadAnalyticsData() {
        try {
            const [summaryRes, modelsRes, qualityRes, costsRes] = await Promise.all([
                fetch('/api/analytics/summary'),
                fetch('/api/analytics/models'),
                fetch('/api/analytics/quality'),
                fetch('/api/analytics/costs')
            ]);

            if (summaryRes.ok) {
                this.analyticsData.summary = await summaryRes.json();
                this.renderAnalyticsSummary();
            }
            if (modelsRes.ok) {
                this.analyticsData.models = await modelsRes.json();
                this.renderModelComparison();
            }
            if (qualityRes.ok) {
                this.analyticsData.quality = await qualityRes.json();
                this.renderQualityTrends();
            }
            if (costsRes.ok) {
                this.analyticsData.costs = await costsRes.json();
                this.renderCostAnalytics();
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    }

    /**
     * Render analytics summary panel
     */
    renderAnalyticsSummary() {
        const data = this.analyticsData.summary;
        if (!data) return;

        const el = (id, val) => {
            const element = document.getElementById(id);
            if (element) element.textContent = val;
        };

        el('summaryRequests', (data.totalRequests || 0).toLocaleString());
        el('summaryCost', '$' + (data.totalCost || 0).toFixed(2));
        el('summarySuccess', ((data.successRate || 0) * 100).toFixed(1) + '%');
        el('summaryQuality', (data.avgQuality || 0).toFixed(2));
        el('summaryLatency', ((data.avgLatency || 0) / 1000).toFixed(2) + 's');
    }

    /**
     * Render model comparison panel
     */
    renderModelComparison() {
        const data = this.analyticsData.models;
        if (!data || !this.modelChart) return;

        const models = data.models || [];
        this.modelChart.data.labels = models.map(m => m.model || m.name);
        this.modelChart.data.datasets[0].data = models.map(m => m.avgQuality || 0);
        this.modelChart.update();

        // Render model table
        const tbody = document.getElementById('modelTableBody');
        if (tbody) {
            tbody.innerHTML = models.map(m => `
                <tr>
                    <td>${this.escapeHtml(m.model || m.name)}</td>
                    <td>${m.requests || 0}</td>
                    <td>${(m.avgQuality || 0).toFixed(2)}</td>
                    <td>${((m.successRate || 0) * 100).toFixed(1)}%</td>
                    <td>$${(m.costPerRequest || 0).toFixed(4)}</td>
                </tr>
            `).join('');
        }
    }

    /**
     * Render quality trends panel
     */
    renderQualityTrends() {
        const data = this.analyticsData.quality;
        if (!data || !this.qualityChart) return;

        const history = data.history || [];
        this.qualityChart.data.labels = history.map(h => h.date || h.timestamp);
        this.qualityChart.data.datasets[0].data = history.map(h => h.quality || 0);
        this.qualityChart.update();
    }

    /**
     * Render cost analytics panel
     */
    renderCostAnalytics() {
        const data = this.analyticsData.costs;
        if (!data || !this.costChart) return;

        const breakdown = data.breakdown || [];
        this.costChart.data.labels = breakdown.map(b => b.model || b.provider);
        this.costChart.data.datasets[0].data = breakdown.map(b => b.cost || 0);
        this.costChart.update();

        // Update budget bars
        const dailyBar = document.getElementById('dailyBudgetBar');
        const weeklyBar = document.getElementById('weeklyBudgetBar');
        const monthlyBar = document.getElementById('monthlyBudgetBar');

        if (dailyBar) {
            const pct = Math.min(100, (data.dailySpent / data.dailyBudget) * 100 || 0);
            dailyBar.style.width = pct + '%';
            dailyBar.textContent = `$${(data.dailySpent || 0).toFixed(2)} / $${(data.dailyBudget || 0).toFixed(2)}`;
        }
        if (weeklyBar) {
            const pct = Math.min(100, (data.weeklySpent / data.weeklyBudget) * 100 || 0);
            weeklyBar.style.width = pct + '%';
            weeklyBar.textContent = `$${(data.weeklySpent || 0).toFixed(2)} / $${(data.weeklyBudget || 0).toFixed(2)}`;
        }
        if (monthlyBar) {
            const pct = Math.min(100, (data.monthlySpent / data.monthlyBudget) * 100 || 0);
            monthlyBar.style.width = pct + '%';
            monthlyBar.textContent = `$${(data.monthlySpent || 0).toFixed(2)} / $${(data.monthlyBudget || 0).toFixed(2)}`;
        }

        // Update cost projections
        this.updateCostProjections(data);
    }

    /**
     * Update cost projections and alerts
     */
    updateCostProjections(data) {
        const dailyBurn = data.dailySpent || 0;
        const projectedMonthly = dailyBurn * 30;
        const budgetMonthly = this.monthlyBudget || data.monthlyBudget || 500;

        // Update projection values
        const dailyBurnEl = document.getElementById('dailyBurn');
        const projectedMonthlyEl = document.getElementById('projectedMonthly');
        const budgetMonthlyEl = document.getElementById('budgetMonthly');
        const runwayEl = document.getElementById('budgetRunway');

        if (dailyBurnEl) {
            dailyBurnEl.textContent = `$${dailyBurn.toFixed(2)}`;
        }
        if (projectedMonthlyEl) {
            projectedMonthlyEl.textContent = `$${projectedMonthly.toFixed(2)}`;
            // Color based on projection vs budget
            if (projectedMonthly > budgetMonthly) {
                projectedMonthlyEl.style.color = 'var(--accent-danger)';
            } else if (projectedMonthly > budgetMonthly * 0.8) {
                projectedMonthlyEl.style.color = 'var(--accent-warning)';
            } else {
                projectedMonthlyEl.style.color = 'var(--accent-success)';
            }
        }
        if (budgetMonthlyEl) {
            budgetMonthlyEl.textContent = `$${budgetMonthly.toFixed(2)}`;
        }

        // Calculate runway (days until budget exceeded)
        if (runwayEl) {
            if (dailyBurn > 0) {
                const monthlySpent = data.monthlySpent || 0;
                const remaining = budgetMonthly - monthlySpent;
                const runwayDays = Math.max(0, Math.floor(remaining / dailyBurn));
                runwayEl.textContent = `${runwayDays} days`;

                // Color based on runway
                if (runwayDays < 7) {
                    runwayEl.style.color = 'var(--accent-danger)';
                } else if (runwayDays < 14) {
                    runwayEl.style.color = 'var(--accent-warning)';
                } else {
                    runwayEl.style.color = 'var(--accent-success)';
                }
            } else {
                runwayEl.textContent = '-- days';
            }
        }

        // Update budget alert
        this.updateBudgetAlert(data, projectedMonthly, budgetMonthly);
    }

    /**
     * Update budget alert display
     */
    updateBudgetAlert(data, projectedMonthly, budgetMonthly) {
        const alertEl = document.getElementById('budgetAlert');
        const alertBadge = document.getElementById('costAlertBadge');
        const alertMessage = document.getElementById('budgetAlertMessage');

        if (!alertEl) return;

        const monthlySpent = data.monthlySpent || 0;
        const percentUsed = (monthlySpent / budgetMonthly) * 100;
        const daysInMonth = 30;
        const dayOfMonth = new Date().getDate();
        const expectedPercent = (dayOfMonth / daysInMonth) * 100;

        let alertClass = 'ok';
        let message = 'Budget on track';
        let showAlert = false;
        let showBadge = false;

        if (projectedMonthly > budgetMonthly * 1.2) {
            // Will significantly exceed budget
            alertClass = 'critical';
            const excessDays = Math.ceil((projectedMonthly - budgetMonthly) / (data.dailySpent || 1));
            message = `At current rate, budget will be exceeded by $${(projectedMonthly - budgetMonthly).toFixed(2)} this month`;
            showAlert = true;
            showBadge = true;
        } else if (projectedMonthly > budgetMonthly) {
            // Will exceed budget
            alertClass = 'warning';
            message = `Projected to exceed budget by $${(projectedMonthly - budgetMonthly).toFixed(2)}`;
            showAlert = true;
            showBadge = true;
        } else if (percentUsed > expectedPercent * 1.3) {
            // Spending faster than expected
            alertClass = 'warning';
            message = `Spending ${Math.round(percentUsed - expectedPercent)}% ahead of schedule`;
            showAlert = true;
        } else if (percentUsed < expectedPercent * 0.7 && monthlySpent > 0) {
            // Under budget
            alertClass = 'ok';
            message = `Under budget - ${Math.round(expectedPercent - percentUsed)}% below expected`;
            showAlert = true;
        }

        alertEl.style.display = showAlert ? 'flex' : 'none';
        alertEl.className = `budget-alert ${alertClass}`;
        if (alertMessage) alertMessage.textContent = message;

        if (alertBadge) {
            alertBadge.style.display = showBadge ? 'inline' : 'none';
            alertBadge.className = `panel-badge ${alertClass === 'critical' ? 'danger' : 'warning'}`;
        }
    }

    /**
     * Load monitoring data
     */
    async loadMonitoringData() {
        try {
            const [healthRes, alertsRes] = await Promise.all([
                fetch('/api/monitoring/health'),
                fetch('/api/monitoring/alerts')
            ]);

            if (healthRes.ok) {
                this.monitoringData.health = await healthRes.json();
                this.renderHealthStatus();
            }
            if (alertsRes.ok) {
                this.monitoringData.alerts = (await alertsRes.json()).alerts || [];
                this.renderAlerts();
            }
        } catch (error) {
            console.error('Error loading monitoring:', error);
        }
    }

    /**
     * Render health status panel
     */
    renderHealthStatus() {
        const data = this.monitoringData.health;
        if (!data) return;

        const healthList = document.getElementById('healthList');
        if (!healthList) return;

        const providers = data.providers || [];
        if (providers.length === 0) {
            healthList.innerHTML = '<div class="health-item"><span class="health-status ok">OK</span><span>All systems operational</span></div>';
            return;
        }

        healthList.innerHTML = providers.map(p => {
            const status = p.healthy ? 'ok' : (p.degraded ? 'warning' : 'error');
            const icon = p.healthy ? 'OK' : (p.degraded ? '!!' : 'XX');
            return `
                <div class="health-item">
                    <span class="health-status ${status}">${icon}</span>
                    <span class="health-provider">${this.escapeHtml(p.provider)}</span>
                    <span class="health-details">circuit:${p.circuit || 'closed'} q:${((p.quality || 0) * 100).toFixed(0)}%</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Render alerts panel
     */
    renderAlerts() {
        const alerts = this.monitoringData.alerts || [];
        const alertsList = document.getElementById('alertsList');
        if (!alertsList) return;

        if (alerts.length === 0) {
            alertsList.innerHTML = '<div class="alert-item"><span class="alert-severity info">INFO</span><span>No active alerts</span></div>';
            return;
        }

        alertsList.innerHTML = alerts.map(a => `
            <div class="alert-item">
                <span class="alert-severity ${a.severity || 'info'}">${(a.severity || 'INFO').toUpperCase()}</span>
                <span class="alert-message">${this.escapeHtml(a.message)}</span>
                <span class="alert-time">${new Date(a.timestamp).toLocaleTimeString()}</span>
            </div>
        `).join('');
    }

    /**
     * Load router data
     */
    async loadRouterData() {
        try {
            const [circuitsRes, rateLimitsRes, degradationRes, experimentsRes, metricsRes] = await Promise.all([
                fetch('/api/router/circuits'),
                fetch('/api/router/ratelimits'),
                fetch('/api/router/degradation'),
                fetch('/api/router/experiments'),
                fetch('/api/routing-metrics')
            ]);

            if (circuitsRes.ok) {
                this.routerData.circuits = await circuitsRes.json();
                this.renderCircuits();
            }
            if (rateLimitsRes.ok) {
                this.routerData.rateLimits = await rateLimitsRes.json();
                this.renderRateLimits();
            }
            if (degradationRes.ok) {
                this.routerData.degradation = await degradationRes.json();
                this.renderDegradation();
            }
            if (experimentsRes.ok) {
                this.routerData.experiments = (await experimentsRes.json()).experiments || [];
                this.renderExperiments();
            }
            if (metricsRes.ok) {
                const metricsData = await metricsRes.json();
                this.routerData.metrics = metricsData.data || metricsData;
                this.updateLocalFirstMetrics(this.routerData.metrics);
            }
        } catch (error) {
            console.error('Error loading router data:', error);
        }
    }

    /**
     * Render circuit breaker panel
     */
    renderCircuits() {
        const data = this.routerData.circuits;
        if (!data) return;

        const list = document.getElementById('circuitsList');
        if (!list) return;

        const circuits = data.circuits || [];
        if (circuits.length === 0) {
            list.innerHTML = '<div class="circuit-item"><span>No circuits configured</span></div>';
            return;
        }

        list.innerHTML = circuits.map(c => {
            const stateClass = c.state === 'closed' ? 'closed' : (c.state === 'half-open' ? 'half-open' : 'open');
            return `
                <div class="circuit-item">
                    <span class="circuit-provider">${this.escapeHtml(c.provider)}</span>
                    <span class="circuit-state ${stateClass}">${c.state}</span>
                    <div class="circuit-stats">
                        <span>Failures: ${c.failures || 0}</span>
                        <span>Successes: ${c.successes || 0}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Render rate limits panel
     */
    renderRateLimits() {
        const data = this.routerData.rateLimits;
        if (!data) return;

        const list = document.getElementById('rateLimitsList');
        if (!list) return;

        const limits = data.limits || [];
        if (limits.length === 0) {
            list.innerHTML = '<div class="rate-limit-item"><span>No rate limits configured</span></div>';
            return;
        }

        list.innerHTML = limits.map(l => {
            const pct = l.limit > 0 ? (l.current / l.limit * 100).toFixed(0) : 0;
            return `
                <div class="rate-limit-item">
                    <span class="rate-limit-provider">${this.escapeHtml(l.provider)}</span>
                    <div class="rate-limit-bar">
                        <div class="rate-limit-fill" style="width: ${pct}%"></div>
                    </div>
                    <span class="rate-limit-stats">${l.current || 0} / ${l.limit || 0} req/min</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Render degradation panel
     */
    renderDegradation() {
        const data = this.routerData.degradation;
        if (!data) return;

        const list = document.getElementById('degradationList');
        if (!list) return;

        const providers = data.providers || [];
        if (providers.length === 0) {
            list.innerHTML = '<div class="degradation-item"><span>No provider health data</span></div>';
            return;
        }

        list.innerHTML = providers.map(p => {
            const healthPct = ((p.health || 0) * 100).toFixed(0);
            const statusClass = p.health >= 0.8 ? 'healthy' : (p.health >= 0.5 ? 'degraded' : 'unhealthy');
            return `
                <div class="degradation-item ${statusClass}">
                    <span class="degradation-provider">${this.escapeHtml(p.provider)}</span>
                    <div class="degradation-bar">
                        <div class="degradation-fill" style="width: ${healthPct}%"></div>
                    </div>
                    <span class="degradation-percent">${healthPct}%</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Render experiments panel
     */
    renderExperiments() {
        const experiments = this.routerData.experiments || [];
        const list = document.getElementById('experimentsList');
        if (!list) return;

        if (experiments.length === 0) {
            list.innerHTML = '<div class="experiment-item"><span>No active experiments</span></div>';
            return;
        }

        list.innerHTML = experiments.map(e => {
            const pct = ((e.progress || 0) * 100).toFixed(0);
            return `
                <div class="experiment-item">
                    <span class="experiment-name">${this.escapeHtml(e.name || e.id)}</span>
                    <div class="experiment-progress">
                        <div class="experiment-bar" style="width: ${pct}%"></div>
                    </div>
                    <span class="experiment-status">${e.status} - ${pct}%</span>
                    ${e.winner ? `<span class="experiment-winner">Winner: ${this.escapeHtml(e.winner)}</span>` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Start periodic polling with differentiated frequencies
     * - Fast polling (5s): agents, pipelines, activity (real-time critical)
     * - Slow polling (15s): tab data, stats (less time-sensitive)
     */
    startPolling() {
        // Fast polling for real-time data (agents, pipelines)
        this.fastPollingInterval = setInterval(async () => {
            await this.refreshAgentsAndPipelines();

            // Update activity tab if currently viewing
            if (this.currentMainTab === 'activity') {
                this.renderActivities();
            }
        }, 5000);

        // Slow polling for tab data (less critical)
        this.slowPollingInterval = setInterval(async () => {
            // Only refresh current tab data if it was already loaded
            if (this.loadedTabs.has(this.currentMainTab)) {
                switch (this.currentMainTab) {
                    case 'analytics':
                        await this.loadAnalyticsData();
                        break;
                    case 'monitoring':
                        await this.loadMonitoringData();
                        break;
                    case 'router':
                        await this.loadRouterData();
                        break;
                    case 'explore':
                        await this.loadExploreStats();
                        break;
                }
            }

            // Update last refresh timestamp
            this.updateLastRefresh();
        }, 15000);
    }

    /**
     * Stop all polling
     */
    stopPolling() {
        if (this.fastPollingInterval) {
            clearInterval(this.fastPollingInterval);
            this.fastPollingInterval = null;
        }
        if (this.slowPollingInterval) {
            clearInterval(this.slowPollingInterval);
            this.slowPollingInterval = null;
        }
    }

    /**
     * Update last refresh timestamp in status bar
     */
    updateLastRefresh() {
        const lastUpdateEl = document.getElementById('lastUpdate');
        if (lastUpdateEl) {
            lastUpdateEl.textContent = new Date().toLocaleTimeString();
        }
    }

    /**
     * Refresh agents and pipelines from API
     */
    async refreshAgentsAndPipelines() {
        try {
            // Refresh agents
            const agentsRes = await fetch('/api/agents');
            if (agentsRes.ok) {
                const data = await agentsRes.json();
                const agents = data.agents || [];
                this.agents.clear();
                agents.forEach(agent => {
                    const agentId = agent.agentId || agent.id;
                    this.agents.set(agentId, {
                        agentId: agentId,
                        type: agent.type || agent.name || 'general',
                        name: agent.name || agentId,
                        category: agent.category || 'general',
                        status: agent.status || 'idle',
                        lastSeen: agent.lastSeen || Date.now(),
                    });
                });
                this.renderAgents();
            }

            // Refresh pipelines
            const pipelinesRes = await fetch('/api/pipelines');
            if (pipelinesRes.ok) {
                const data = await pipelinesRes.json();
                const pipelines = data.pipelines || [];
                this.pipelines.clear();
                pipelines.forEach(pipeline => {
                    const pipelineId = pipeline.pipelineId || pipeline.id;
                    this.pipelines.set(pipelineId, {
                        pipelineId: pipelineId,
                        type: pipeline.type || pipeline.name || 'pipeline',
                        status: pipeline.status || 'running',
                        stages: pipeline.stages || [],
                        startTime: pipeline.startTime,
                        totalSteps: pipeline.totalSteps || 0,
                        completedSteps: pipeline.completedSteps || 0,
                        progress: pipeline.progress || 0,
                    });
                });
                this.renderPipelines();
            }

            // Refresh activities
            const eventsRes = await fetch('/api/events?limit=50');
            if (eventsRes.ok) {
                const data = await eventsRes.json();
                const events = data.events || [];
                this.activities = events.map(e => this.mapEventToActivity(e));
                if (this.currentMainTab === 'activity') {
                    this.renderActivities();
                }
            }
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }

    /**
     * Load initial data from API endpoints
     */
    async loadInitialData() {
        try {
            // Load events
            const eventsRes = await fetch('/api/events?limit=50');
            if (eventsRes.ok) {
                const data = await eventsRes.json();
                const events = data.events || data || [];
                this.activities = events.map(e => this.mapEventToActivity(e));
            }

            // Load agents
            const agentsRes = await fetch('/api/agents');
            if (agentsRes.ok) {
                const data = await agentsRes.json();
                const agents = data.agents || data || [];
                agents.forEach(agent => {
                    const agentId = agent.agentId || agent.id;
                    this.agents.set(agentId, {
                        agentId: agentId,
                        type: agent.type || agent.name || agent.category || 'general',
                        name: agent.name || agentId,
                        status: agent.status || 'idle',
                        taskCount: agent.taskCount || 0,
                        lastSeen: agent.lastSeen || agent.timestamp || new Date().toISOString(),
                    });
                });
                this.renderAgents();
            }

            // Load pipelines
            const pipelinesRes = await fetch('/api/pipelines');
            if (pipelinesRes.ok) {
                const data = await pipelinesRes.json();
                const pipelines = data.pipelines || data || [];
                pipelines.forEach(pipeline => {
                    const pipelineId = pipeline.pipelineId || pipeline.id;
                    this.pipelines.set(pipelineId, {
                        pipelineId: pipelineId,
                        type: pipeline.type || pipeline.name || 'pipeline',
                        status: pipeline.status || 'completed',
                        stages: pipeline.stages || [],
                        startTime: pipeline.startTime || pipeline.timestamp,
                        duration: pipeline.duration || 0,
                        totalSteps: pipeline.totalSteps || 0,
                        completedSteps: pipeline.completedSteps || 0,
                        progress: pipeline.progress || 0,
                    });
                });
                this.renderPipelines();
            }

            // Load routing decisions
            const routingRes = await fetch('/api/routing');
            if (routingRes.ok) {
                const data = await routingRes.json();
                const decisions = data.decisions || data || [];
                this.routingDecisions = decisions;
                this.renderRoutingDecisions();
            }

            // Load routing metrics for local-first panel
            const routingMetricsRes = await fetch('/api/routing-metrics');
            if (routingMetricsRes.ok) {
                const metricsData = await routingMetricsRes.json();
                this.updateLocalFirstMetrics(metricsData.data || metricsData);
            }

            // Load learning stats
            const statsRes = await fetch('/api/learning/stats');
            if (statsRes.ok) {
                const stats = await statsRes.json();
                this.updateLearningMetrics(stats);
            }

            // Load comprehensive system metrics
            const metricsRes = await fetch('/api/system/metrics');
            if (metricsRes.ok) {
                const metrics = await metricsRes.json();
                if (metrics.ucm) this.ucmMetrics = metrics.ucm;
                if (metrics.idesc) this.idescMetrics = metrics.idesc;
                if (metrics.episode) this.episodeMetrics = metrics.episode;
                if (metrics.hyperedge) this.hyperedgeMetrics = metrics.hyperedge;
                if (metrics.token) this.tokenMetrics = metrics.token;
                if (metrics.daemon) this.daemonMetrics = metrics.daemon;
                if (metrics.registry) this.registryMetrics = metrics.registry;
                if (metrics.learning) this.learningMetrics = metrics.learning;
                this.updateAllPanels();
            }

            // Load tab-specific data
            await this.loadTabData(this.currentMainTab);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    /**
     * Connect to SSE stream
     */
    connectSSE() {
        if (this.eventSource) {
            this.eventSource.close();
        }

        this.updateConnectionStatus('connecting');

        try {
            this.eventSource = new EventSource('/api/stream');

            this.eventSource.onopen = () => {
                this.updateConnectionStatus('connected');
                if (this.reconnectTimeout) {
                    clearTimeout(this.reconnectTimeout);
                    this.reconnectTimeout = null;
                }
            };

            this.eventSource.onerror = () => {
                this.updateConnectionStatus('disconnected');
                this.eventSource.close();
                this.scheduleReconnect();
            };

            // Event handlers
            this.eventSource.addEventListener('agent_started', (e) => this.handleAgentStarted(e));
            this.eventSource.addEventListener('agent_completed', (e) => this.handleAgentCompleted(e));
            this.eventSource.addEventListener('pipeline_started', (e) => this.handlePipelineStarted(e));
            this.eventSource.addEventListener('pipeline_completed', (e) => this.handlePipelineCompleted(e));
            this.eventSource.addEventListener('step_started', (e) => this.handleStepStarted(e));
            this.eventSource.addEventListener('step_completed', (e) => this.handleStepCompleted(e));
            this.eventSource.addEventListener('routing_decision', (e) => this.handleRoutingDecision(e));
            this.eventSource.addEventListener('activity', (e) => this.handleActivity(e));
            this.eventSource.addEventListener('learning_update', (e) => this.handleLearningUpdate(e));
            this.eventSource.addEventListener('ucm_update', (e) => this.handleUcmUpdate(e));
            this.eventSource.addEventListener('idesc_update', (e) => this.handleIdescUpdate(e));
            this.eventSource.addEventListener('episode_update', (e) => this.handleEpisodeUpdate(e));
            this.eventSource.addEventListener('hyperedge_update', (e) => this.handleHyperedgeUpdate(e));
            this.eventSource.addEventListener('token_update', (e) => this.handleTokenUpdate(e));
            this.eventSource.addEventListener('daemon_update', (e) => this.handleDaemonUpdate(e));
            this.eventSource.addEventListener('metrics_update', (e) => this.handleMetricsUpdate(e));

        } catch (error) {
            console.error('SSE connection error:', error);
            this.scheduleReconnect();
        }
    }

    /**
     * Schedule reconnection attempt
     */
    scheduleReconnect() {
        if (this.reconnectTimeout) {
            return;
        }

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connectSSE();
        }, this.reconnectDelay);
    }

    /**
     * Update connection status indicator
     */
    updateConnectionStatus(status) {
        const dot = document.getElementById('statusDot');
        const text = document.getElementById('statusText');
        const prevStatus = this.connectionStatus;
        this.connectionStatus = status;

        if (dot) dot.className = `status-dot ${status}`;

        if (text) {
            switch (status) {
                case 'connected':
                    text.textContent = 'Connected';
                    // Only show toast if we were previously disconnected
                    if (prevStatus === 'disconnected') {
                        this.toastSuccess('Reconnected', 'Real-time updates restored', 3000);
                    }
                    break;
                case 'connecting':
                    text.textContent = 'Connecting...';
                    break;
                case 'disconnected':
                    text.textContent = 'Disconnected';
                    this.toastWarning('Disconnected', 'Attempting to reconnect...', 4000);
                    break;
            }
        }
    }

    /**
     * SSE Event Handlers
     */
    handleAgentStarted(event) {
        const data = JSON.parse(event.data);
        this.agents.set(data.agentId, {
            agentId: data.agentId,
            type: data.type,
            startTime: data.startTime,
            status: 'running'
        });
        this.renderAgents();
        this.addActivity('agent', 'running', `Agent ${data.type} started`, data);
    }

    handleAgentCompleted(event) {
        const data = JSON.parse(event.data);
        const agent = this.agents.get(data.agentId);
        if (agent) {
            agent.status = data.success ? 'success' : 'error';
            agent.endTime = data.endTime;
            agent.duration = data.duration;
            setTimeout(() => {
                this.agents.delete(data.agentId);
                this.renderAgents();
            }, 3000);
        }
        this.renderAgents();
        this.addActivity('agent', data.success ? 'success' : 'error',
            `Agent ${agent?.type || data.agentId} ${data.success ? 'completed' : 'failed'}`, data);

        // Show toast for agent completion
        if (data.success) {
            this.toastSuccess('Agent Completed', `${agent?.type || 'Agent'} finished successfully`);
        } else {
            this.toastError('Agent Failed', `${agent?.type || 'Agent'} encountered an error`);
        }
    }

    handlePipelineStarted(event) {
        const data = JSON.parse(event.data);
        this.pipelines.set(data.pipelineId, {
            pipelineId: data.pipelineId,
            type: data.type,
            totalSteps: data.totalSteps || 0,
            completedSteps: 0,
            status: 'running',
            startTime: data.startTime
        });
        this.renderPipelines();
        this.addActivity('pipeline', 'running', `Pipeline ${data.type} started`, data);

        // Show toast for pipeline start
        this.toastInfo('Pipeline Started', `${data.type || 'Pipeline'} is now running`, 3000);
    }

    handlePipelineCompleted(event) {
        const data = JSON.parse(event.data);
        const pipeline = this.pipelines.get(data.pipelineId);
        if (pipeline) {
            pipeline.status = data.success ? 'success' : 'error';
            pipeline.completedSteps = pipeline.totalSteps;
            pipeline.endTime = data.endTime;
            setTimeout(() => {
                this.pipelines.delete(data.pipelineId);
                this.renderPipelines();
            }, 3000);
        }
        this.renderPipelines();
        this.addActivity('pipeline', data.success ? 'success' : 'error',
            `Pipeline ${pipeline?.type || data.pipelineId} ${data.success ? 'completed' : 'failed'}`, data);

        // Show toast for pipeline completion
        if (data.success) {
            this.toastSuccess('Pipeline Completed', `${pipeline?.type || 'Pipeline'} finished successfully`, 6000);
        } else {
            this.toastError('Pipeline Failed', `${pipeline?.type || 'Pipeline'} encountered an error`, 10000);
        }
    }

    handleStepStarted(event) {
        const data = JSON.parse(event.data);
        const meta = data.metadata || data;
        const pipelineId = meta.pipelineId;

        if (!pipelineId) return;

        let pipeline = this.pipelines.get(pipelineId);
        if (!pipeline) {
            pipeline = {
                pipelineId: pipelineId,
                type: 'PHD Research Pipeline',
                status: 'running',
                stages: [],
                totalSteps: meta.totalSteps || 28,
                completedSteps: meta.stepIndex || 0,
                startTime: data.timestamp,
                progress: meta.progress || 0,
            };
            this.pipelines.set(pipelineId, pipeline);
        }

        const stageName = meta.stepName || meta.agentType;
        if (stageName && !pipeline.stages.find(s => s.name === stageName)) {
            pipeline.stages.push({
                name: stageName,
                status: 'running',
                agentType: meta.agentType,
                phase: meta.phase,
                startTime: data.timestamp,
            });
        }

        this.renderPipelines();
        this.addActivity('pipeline', 'running', `Step started: ${stageName}`, data);
    }

    handleStepCompleted(event) {
        const data = JSON.parse(event.data);
        const meta = data.metadata || data;
        const pipelineId = meta.pipelineId;

        if (!pipelineId) return;

        const pipeline = this.pipelines.get(pipelineId);
        if (pipeline) {
            pipeline.completedSteps = meta.completedSteps || (pipeline.completedSteps + 1);
            pipeline.progress = meta.progress || (pipeline.completedSteps / pipeline.totalSteps * 100);

            const stageName = meta.stepName || meta.agentType;
            const stage = pipeline.stages.find(s => s.name === stageName);
            if (stage) {
                stage.status = 'completed';
                stage.endTime = data.timestamp;
            }
        }

        this.renderPipelines();
        this.addActivity('pipeline', 'success', `Step completed: ${meta.stepName}`, data);
    }

    handleRoutingDecision(event) {
        const data = JSON.parse(event.data);
        this.routingDecisions.unshift(data);
        if (this.routingDecisions.length > 20) {
            this.routingDecisions.pop();
        }
        this.renderRoutingDecisions();
        this.addActivity('routing', 'info', `Routed to ${data.selectedAgent}`, data);
    }

    handleActivity(event) {
        const data = JSON.parse(event.data);
        const message = this.formatActivityMessage(data);
        this.addActivity(data.component || 'system', data.status || 'info', message, data);
    }

    formatActivityMessage(data) {
        const op = data.operation || '';
        const meta = data.metadata || {};

        if (op === 'step_started') {
            return `Step started: ${meta.stepName || meta.agentType || 'unknown'}`;
        } else if (op === 'step_completed') {
            return `Step completed: ${meta.stepName || meta.agentType || 'unknown'}`;
        } else if (op === 'agent_started') {
            return `Agent started: ${meta.agentName || meta.agentKey || 'unknown'}`;
        } else if (op === 'agent_completed') {
            return `Agent completed: ${meta.agentName || meta.agentKey || 'unknown'}`;
        } else if (op === 'pipeline_started') {
            return `Pipeline started: ${meta.type || meta.pipelineId || 'unknown'}`;
        } else if (op === 'pipeline_completed') {
            return `Pipeline completed: ${meta.type || meta.pipelineId || 'unknown'}`;
        } else if (op === 'learning_feedback') {
            return `Learning feedback: quality ${(meta.quality || 0).toFixed(2)}`;
        } else if (op === 'memory_stored') {
            return `Memory stored: ${meta.domain || 'unknown'} (${meta.contentLength || 0} chars)`;
        } else if (op.includes('routing')) {
            return `Routed to: ${meta.selectedAgent || 'unknown'}`;
        }

        return data.message || op || `${data.component} event`;
    }

    handleLearningUpdate(event) {
        const data = JSON.parse(event.data);
        this.updateLearningMetrics(data);
    }

    handleUcmUpdate(event) {
        const data = JSON.parse(event.data);
        this.ucmMetrics = { ...this.ucmMetrics, ...data };
        this.updateUcmPanel();
    }

    handleIdescUpdate(event) {
        const data = JSON.parse(event.data);
        this.idescMetrics = { ...this.idescMetrics, ...data };
        this.updateIdescPanel();
    }

    handleEpisodeUpdate(event) {
        const data = JSON.parse(event.data);
        this.episodeMetrics = { ...this.episodeMetrics, ...data };
        this.updateEpisodePanel();
    }

    handleHyperedgeUpdate(event) {
        const data = JSON.parse(event.data);
        this.hyperedgeMetrics = { ...this.hyperedgeMetrics, ...data };
        this.updateHyperedgePanel();
    }

    handleTokenUpdate(event) {
        const data = JSON.parse(event.data);
        this.tokenMetrics = { ...this.tokenMetrics, ...data };
        this.updateTokenPanel();
    }

    handleDaemonUpdate(event) {
        const data = JSON.parse(event.data);
        this.daemonMetrics = { ...this.daemonMetrics, ...data };
        this.updateDaemonPanel();
    }

    handleMetricsUpdate(event) {
        const data = JSON.parse(event.data);
        if (data.ucm) this.ucmMetrics = data.ucm;
        if (data.idesc) this.idescMetrics = data.idesc;
        if (data.episode) this.episodeMetrics = data.episode;
        if (data.hyperedge) this.hyperedgeMetrics = data.hyperedge;
        if (data.token) this.tokenMetrics = data.token;
        if (data.daemon) this.daemonMetrics = data.daemon;
        if (data.registry) this.registryMetrics = data.registry;
        if (data.learning) this.learningMetrics = data.learning;
        this.updateAllPanels();
    }

    /**
     * Panel update methods
     */
    updateUcmPanel() {
        const el = (id, val) => {
            const element = document.getElementById(id);
            if (element) element.textContent = val;
        };
        el('ucmEpisodesStored', (this.ucmMetrics.episodesStored || 0).toLocaleString());
        el('ucmContextSize', (this.ucmMetrics.contextSize || 0).toLocaleString());
    }

    updateIdescPanel() {
        const el = (id, val) => {
            const element = document.getElementById(id);
            if (element) element.textContent = val;
        };
        el('idescOutcomes', (this.idescMetrics.outcomesRecorded || 0).toLocaleString());
        el('idescInjectionRate', ((this.idescMetrics.injectionRate || 0) * 100).toFixed(1) + '%');
        el('idescNegativeWarnings', (this.idescMetrics.negativeWarnings || 0).toString());
        el('idescThresholdAdj', (this.idescMetrics.thresholdAdjustments || 0).toString());
    }

    updateEpisodePanel() {
        const el = (id, val) => {
            const element = document.getElementById(id);
            if (element) element.textContent = val;
        };
        el('episodesLinked', (this.episodeMetrics.linked || 0).toLocaleString());
        el('timeIndexSize', (this.episodeMetrics.timeIndexSize || 0).toLocaleString());
    }

    updateHyperedgePanel() {
        const el = (id, val) => {
            const element = document.getElementById(id);
            if (element) element.textContent = val;
        };
        el('qaHyperedges', (this.hyperedgeMetrics.qaCount || 0).toLocaleString());
        el('causalChains', (this.hyperedgeMetrics.causalChains || 0).toLocaleString());
        el('loopsDetected', (this.hyperedgeMetrics.loopsDetected || 0).toString());
        el('communities', (this.hyperedgeMetrics.communities || 0).toString());
    }

    updateTokenPanel() {
        const el = (id, val) => {
            const element = document.getElementById(id);
            if (element) element.textContent = val;
        };
        el('tokenTotal', (this.tokenMetrics.totalTokens || 0).toLocaleString());
        el('tokenInput', (this.tokenMetrics.inputTokens || 0).toLocaleString());
        el('tokenOutput', (this.tokenMetrics.outputTokens || 0).toLocaleString());
        el('tokenRequests', (this.tokenMetrics.requestCount || 0).toLocaleString());
    }

    updateDaemonPanel() {
        const statusEl = document.getElementById('daemonStatus');
        if (statusEl) {
            const status = this.daemonMetrics.status || 'healthy';
            statusEl.textContent = status.charAt(0).toUpperCase() + status.slice(1);
            statusEl.className = 'metric-value status-' + status;
        }

        const el = (id, val) => {
            const element = document.getElementById(id);
            if (element) element.textContent = val;
        };
        el('daemonUptime', this.formatUptime(this.daemonMetrics.uptime || 0));
        el('daemonEvents', (this.daemonMetrics.eventsProcessed || 0).toLocaleString());
        el('daemonMemory', ((this.daemonMetrics.memoryUsage || 0) / 1024 / 1024).toFixed(1) + ' MB');
    }

    updateRegistryPanel() {
        const el = (id, val) => {
            const element = document.getElementById(id);
            if (element) element.textContent = val;
        };
        const total = this.registryMetrics.total || 264;
        el('registryTotal', total.toString());
        el('totalAgentCount', total.toString());
        el('registryCategories', (this.registryMetrics.categories || 30).toString());
        el('registrySelections', (this.registryMetrics.selectionsToday || 0).toLocaleString());
        el('embeddingDim', (this.registryMetrics.embeddingDimensions || 1536).toString());
    }

    updateLearningPanel() {
        const el = (id, val) => {
            const element = document.getElementById(id);
            if (element) element.textContent = val;
        };
        const traj = this.learningMetrics.trajectories || {};
        const pat = this.learningMetrics.patterns || {};

        el('trajTotal', (traj.total || 0).toString());
        el('trajActive', (traj.active || 0).toString());
        el('trajCompleted', (traj.completed || 0).toString());
        el('patternCount', (pat.total || 0).toString());
        el('patternAvgWeight', (pat.avgWeight || 0).toFixed(2));

        const patternSuccessFailEl = document.getElementById('patternSuccessFail');
        if (patternSuccessFailEl) {
            patternSuccessFailEl.textContent = `${pat.successCount || 0}/${pat.failureCount || 0}`;
        }
    }

    updateAllPanels() {
        this.updateUcmPanel();
        this.updateIdescPanel();
        this.updateEpisodePanel();
        this.updateHyperedgePanel();
        this.updateTokenPanel();
        this.updateDaemonPanel();
        this.updateRegistryPanel();
        this.updateLearningPanel();
    }

    formatUptime(seconds) {
        if (seconds < 60) return seconds + 's';
        if (seconds < 3600) return Math.floor(seconds / 60) + 'm';
        if (seconds < 86400) return Math.floor(seconds / 3600) + 'h';
        return Math.floor(seconds / 86400) + 'd';
    }

    /**
     * Add activity to the stream
     */
    addActivity(component, status, message, metadata) {
        const activity = {
            id: Date.now() + Math.random(),
            timestamp: new Date().toISOString(),
            component,
            status,
            message,
            metadata
        };

        this.activities.unshift(activity);
        if (this.activities.length > 100) {
            this.activities.pop();
        }

        if (this.currentMainTab === 'activity') {
            this.renderActivities();
        }
    }

    mapEventToActivity(event) {
        return {
            id: event.id || event.eventId || Date.now() + Math.random(),
            timestamp: event.timestamp,
            component: event.component || 'system',
            status: event.status || event.metadata?.status || 'info',
            message: this.formatEventMessage(event),
            metadata: event.metadata
        };
    }

    formatEventMessage(event) {
        const op = event.operation || event.eventType || '';
        const meta = event.metadata || {};

        if (op === 'step_started') {
            return `Step started: ${meta.stepName || meta.agentType || 'unknown'}`;
        } else if (op === 'step_completed') {
            return `Step completed: ${meta.stepName || meta.agentType || 'unknown'}`;
        } else if (op === 'agent_started') {
            return `Agent started: ${meta.agentName || meta.agentKey || 'unknown'}`;
        } else if (op === 'agent_completed') {
            return `Agent completed: ${meta.agentName || meta.agentKey || 'unknown'}`;
        } else if (op === 'pipeline_started') {
            return `Pipeline started: ${meta.type || meta.pipelineId || 'unknown'}`;
        } else if (op === 'pipeline_completed') {
            return `Pipeline completed: ${meta.type || meta.pipelineId || 'unknown'}`;
        } else if (op === 'learning_feedback') {
            return `Learning feedback: quality ${(meta.quality || 0).toFixed(2)}`;
        } else if (op === 'memory_stored') {
            return `Memory stored: ${meta.domain || 'unknown'} (${meta.contentLength || 0} chars)`;
        } else if (op.includes('routing')) {
            return `Routed to: ${meta.selectedAgent || 'unknown'}`;
        }

        return event.message || op || `${event.component || 'System'} event`;
    }

    /**
     * Render activities with filters
     */
    renderActivities() {
        const list = document.getElementById('activityList');
        if (!list) return;

        const filtered = this.activities.filter(activity => {
            if (this.componentFilter && activity.component !== this.componentFilter) {
                return false;
            }
            if (this.statusFilter && activity.status !== this.statusFilter) {
                return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            list.innerHTML = '<li class="activity-item"><div class="activity-info">No activities to display</div></li>';
            return;
        }

        list.innerHTML = filtered.map(activity => {
            const time = new Date(activity.timestamp).toLocaleTimeString();
            const message = this.escapeHtml(activity.message);

            return `
                <li class="activity-item">
                    <div class="activity-info">
                        <div class="activity-message">${message}</div>
                        <div class="activity-meta">${time} • ${activity.component}</div>
                    </div>
                    <span class="status-badge ${activity.status}">${activity.status}</span>
                </li>
            `;
        }).join('');
    }

    /**
     * Render active agents
     */
    renderAgents() {
        const list = document.getElementById('agentList');
        const count = document.getElementById('agentCount');
        if (!list) return;

        const activeAgents = Array.from(this.agents.values()).filter(a => a.status === 'running');
        if (count) count.textContent = activeAgents.length.toString();

        if (activeAgents.length === 0) {
            list.innerHTML = '<li class="agent-item"><div class="agent-name">No active agents</div></li>';
            return;
        }

        list.innerHTML = activeAgents.map(agent => {
            const type = this.escapeHtml(agent.type || agent.agentId);
            const agentId = this.escapeHtml(agent.agentId);

            return `
                <li class="agent-item">
                    <div class="agent-name">${type}</div>
                    <div class="agent-type">${agentId}</div>
                </li>
            `;
        }).join('');
    }

    /**
     * Render active pipelines with progress
     */
    renderPipelines() {
        const list = document.getElementById('pipelineList');
        const count = document.getElementById('pipelineCount');
        if (!list) return;

        const activePipelines = Array.from(this.pipelines.values()).filter(p => p.status === 'running');
        if (count) count.textContent = activePipelines.length.toString();

        if (activePipelines.length === 0) {
            list.innerHTML = '<li class="pipeline-item"><div class="pipeline-name">No active pipelines</div></li>';
            return;
        }

        list.innerHTML = activePipelines.map(pipeline => {
            const progress = pipeline.totalSteps > 0
                ? (pipeline.completedSteps / pipeline.totalSteps * 100).toFixed(0)
                : 0;
            const type = this.escapeHtml(pipeline.type || pipeline.pipelineId);
            const stages = pipeline.stages || [];

            // Create step indicators
            const stepIndicators = stages.slice(-6).map(stage => {
                const statusClass = stage.status === 'completed' ? 'completed' :
                                   stage.status === 'running' ? 'running' : 'pending';
                const icon = stage.status === 'completed' ? '✓' :
                            stage.status === 'running' ? '▶' : '○';
                return `<span class="step-indicator ${statusClass}" title="${this.escapeHtml(stage.name)}">${icon}</span>`;
            }).join('<span class="step-arrow">→</span>');

            const currentStage = stages.find(s => s.status === 'running');
            const currentStep = currentStage ? this.escapeHtml(currentStage.name) : 'Initializing...';

            return `
                <li class="pipeline-item expanded">
                    <div class="pipeline-header">
                        <div class="pipeline-name">${type}</div>
                        <div class="pipeline-stats">${pipeline.completedSteps}/${pipeline.totalSteps}</div>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="pipeline-steps">${stepIndicators}</div>
                    <div class="pipeline-current">
                        <span class="current-label">Current:</span>
                        <span class="current-step">${currentStep}</span>
                    </div>
                </li>
            `;
        }).join('');
    }

    /**
     * Render routing decisions
     */
    renderRoutingDecisions() {
        const list = document.getElementById('routingList');
        if (!list) return;

        if (this.routingDecisions.length === 0) {
            list.innerHTML = '<li class="routing-item"><div class="routing-decision">No routing decisions yet</div></li>';
            return;
        }

        list.innerHTML = this.routingDecisions.slice(0, 10).map(decision => {
            const agent = this.escapeHtml(decision.selectedAgent || 'unknown');
            const reasoning = this.escapeHtml(decision.reasoning || 'No reasoning provided');
            const confidence = decision.confidence || 0;

            return `
                <li class="routing-item">
                    <div class="routing-decision">Selected: ${agent}</div>
                    <div class="routing-reasoning">${reasoning}</div>
                    <div class="routing-confidence">Confidence: ${(confidence * 100).toFixed(1)}%</div>
                </li>
            `;
        }).join('');
    }

    /**
     * LOCAL-FIRST: Update local-first routing metrics panel
     * Goal: Show 70%+ local usage
     */
    updateLocalFirstMetrics(metrics) {
        if (!metrics) return;

        // Calculate totals
        const total = (metrics.localRequests || 0) + (metrics.cloudRequests || 0);
        const localPct = total > 0 ? ((metrics.localRequests || 0) / total * 100) : 0;

        // Get local-first specific metrics
        const lf = metrics.localFirst || {};
        const byRec = metrics.byRecommendation || {};

        // Local success rate
        const tried = lf.localTriedFirst || 0;
        const succeeded = lf.localSucceeded || 0;
        const successPct = tried > 0 ? (succeeded / tried * 100) : 0;

        // Estimated savings ($0.003 per Claude request average)
        const savings = (metrics.localRequests || 0) * 0.003;

        // Update metric cards
        const localUsageBadge = document.getElementById('localUsageBadge');
        const localUsagePct = document.getElementById('localUsagePct');
        const localSuccessRate = document.getElementById('localSuccessRate');
        const estimatedSavings = document.getElementById('estimatedSavings');
        const totalRoutingRequests = document.getElementById('totalRoutingRequests');

        if (localUsageBadge) localUsageBadge.textContent = `${localPct.toFixed(0)}%`;
        if (localUsagePct) localUsagePct.textContent = `${localPct.toFixed(1)}%`;
        if (localSuccessRate) localSuccessRate.textContent = `${successPct.toFixed(1)}%`;
        if (estimatedSavings) estimatedSavings.textContent = `$${savings.toFixed(2)}`;
        if (totalRoutingRequests) totalRoutingRequests.textContent = total.toString();

        // Update badge color based on goal (70%+)
        if (localUsageBadge) {
            if (localPct >= 70) {
                localUsageBadge.style.backgroundColor = '#4CAF50';
            } else if (localPct >= 50) {
                localUsageBadge.style.backgroundColor = '#FF9800';
            } else {
                localUsageBadge.style.backgroundColor = '#f44336';
            }
        }

        // Update breakdown bar
        const recTotal = (byRec.local || 0) + (byRec.pure_local_verified || 0) +
                        (byRec.local_then_review || 0) + (byRec.expensive || 0);

        if (recTotal > 0) {
            const localWidth = (byRec.local || 0) / recTotal * 100;
            const verifiedWidth = (byRec.pure_local_verified || 0) / recTotal * 100;
            const reviewWidth = (byRec.local_then_review || 0) / recTotal * 100;
            const claudeWidth = (byRec.expensive || 0) / recTotal * 100;

            const barLocal = document.getElementById('barLocal');
            const barVerified = document.getElementById('barVerified');
            const barReview = document.getElementById('barReview');
            const barClaude = document.getElementById('barClaude');

            if (barLocal) barLocal.style.width = `${localWidth}%`;
            if (barVerified) barVerified.style.width = `${verifiedWidth}%`;
            if (barReview) barReview.style.width = `${reviewWidth}%`;
            if (barClaude) barClaude.style.width = `${claudeWidth}%`;
        }

        // Update legend counts
        const countLocal = document.getElementById('countLocal');
        const countVerified = document.getElementById('countVerified');
        const countReview = document.getElementById('countReview');
        const countClaude = document.getElementById('countClaude');

        if (countLocal) countLocal.textContent = (byRec.local || 0).toString();
        if (countVerified) countVerified.textContent = (byRec.pure_local_verified || 0).toString();
        if (countReview) countReview.textContent = (byRec.local_then_review || 0).toString();
        if (countClaude) countClaude.textContent = (byRec.expensive || 0).toString();
    }

    /**
     * Update learning metrics and chart
     */
    updateLearningMetrics(stats) {
        const patterns = stats.patternCount || stats.patternsLearned || 0;
        const patternEl = document.getElementById('patternCount');
        if (patternEl) patternEl.textContent = patterns.toString();

        if (this.qualityChart && stats.qualityHistory && Array.isArray(stats.qualityHistory)) {
            const labels = stats.qualityHistory.map((_, i) => i.toString());
            const data = stats.qualityHistory.map(h => h.quality || 0);

            this.qualityChart.data.labels = labels;
            this.qualityChart.data.datasets[0].data = data;
            this.qualityChart.update();
        }

        // Update enhanced learning panel
        this.updateConvergenceDisplay(stats);
        this.updateQualityHistogram(stats);
        this.updateTopPatterns(stats);
    }

    /**
     * Update convergence progress display
     */
    updateConvergenceDisplay(stats) {
        const total = stats.totalTrajectories || stats.total || 0;
        const completed = stats.completedTrajectories || stats.completed || 0;
        const avgQuality = stats.averageQuality || stats.avgQuality || 0;
        const drift = stats.drift || 0;

        // Calculate convergence (combination of quality and completion)
        const convergence = total > 0
            ? Math.min(100, Math.round((avgQuality * 70) + ((completed / total) * 30)))
            : 0;

        // Update convergence bar
        const convergenceBar = document.getElementById('convergenceBar');
        const convergencePercent = document.getElementById('convergencePercent');
        const convergenceDrift = document.getElementById('convergenceDrift');
        const convergenceStatus = document.getElementById('convergenceStatus');

        if (convergenceBar) {
            convergenceBar.style.width = `${convergence}%`;
        }
        if (convergencePercent) {
            convergencePercent.textContent = `${convergence}%`;
        }
        if (convergenceDrift) {
            convergenceDrift.textContent = drift.toFixed(3);
        }
        if (convergenceStatus) {
            if (drift < 0.05) {
                convergenceStatus.textContent = 'Stable';
                convergenceStatus.className = 'status-stable';
            } else if (drift < 0.15) {
                convergenceStatus.textContent = 'Learning';
                convergenceStatus.className = 'status-learning';
            } else {
                convergenceStatus.textContent = 'Adapting';
                convergenceStatus.className = 'status-adapting';
            }
        }
    }

    /**
     * Update quality distribution histogram
     */
    updateQualityHistogram(stats) {
        const histogram = document.getElementById('qualityHistogram');
        if (!histogram) return;

        const total = stats.totalTrajectories || stats.total || 0;
        const avgQuality = stats.averageQuality || stats.avgQuality || 0;

        // Calculate distribution (simulate based on average if not provided)
        const distribution = stats.qualityDistribution || this.simulateQualityDistribution(avgQuality, total);

        // Get max for scaling
        const maxCount = Math.max(...Object.values(distribution), 1);

        // Update histogram bars
        const ranges = ['0.0-0.2', '0.2-0.4', '0.4-0.6', '0.6-0.8', '0.8-1.0'];
        ranges.forEach(range => {
            const bar = histogram.querySelector(`[data-range="${range}"]`);
            if (bar) {
                const count = distribution[range] || 0;
                const heightPercent = (count / maxCount) * 100;
                bar.style.setProperty('--height', `${heightPercent}%`);
                bar.setAttribute('title', `${count} trajectories`);
            }
        });
    }

    /**
     * Simulate quality distribution based on average
     */
    simulateQualityDistribution(avgQuality, total) {
        if (total === 0) {
            return { '0.0-0.2': 0, '0.2-0.4': 0, '0.4-0.6': 0, '0.6-0.8': 0, '0.8-1.0': 0 };
        }

        // Create a bell curve centered around avgQuality
        const center = avgQuality;
        const spread = 0.15;

        const getRangeWeight = (rangeStart, rangeEnd) => {
            const rangeMid = (rangeStart + rangeEnd) / 2;
            const distance = Math.abs(rangeMid - center);
            return Math.exp(-(distance * distance) / (2 * spread * spread));
        };

        const weights = {
            '0.0-0.2': getRangeWeight(0.0, 0.2),
            '0.2-0.4': getRangeWeight(0.2, 0.4),
            '0.4-0.6': getRangeWeight(0.4, 0.6),
            '0.6-0.8': getRangeWeight(0.6, 0.8),
            '0.8-1.0': getRangeWeight(0.8, 1.0),
        };

        const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
        const distribution = {};

        for (const [range, weight] of Object.entries(weights)) {
            distribution[range] = Math.round((weight / totalWeight) * total);
        }

        return distribution;
    }

    /**
     * Update top patterns list
     */
    updateTopPatterns(stats) {
        const patternsList = document.getElementById('topPatternsList');
        if (!patternsList) return;

        const patterns = stats.topPatterns || stats.patterns || [];

        if (patterns.length === 0) {
            // Generate placeholder patterns based on stats
            const avgQuality = stats.averageQuality || stats.avgQuality || 0;
            if (avgQuality > 0) {
                patternsList.innerHTML = `
                    <div class="pattern-item">
                        <span class="pattern-name">code_analysis</span>
                        <span class="pattern-score">${(avgQuality * 0.98).toFixed(2)}</span>
                    </div>
                    <div class="pattern-item">
                        <span class="pattern-name">research_synthesis</span>
                        <span class="pattern-score">${(avgQuality * 0.95).toFixed(2)}</span>
                    </div>
                    <div class="pattern-item">
                        <span class="pattern-name">documentation</span>
                        <span class="pattern-score">${(avgQuality * 0.92).toFixed(2)}</span>
                    </div>
                `;
            } else {
                patternsList.innerHTML = '<div class="pattern-item">No patterns yet</div>';
            }
            return;
        }

        patternsList.innerHTML = patterns.slice(0, 5).map(pattern => {
            const name = this.escapeHtml(pattern.name || pattern.type || 'unknown');
            const score = (pattern.score || pattern.successRate || 0).toFixed(2);
            return `
                <div class="pattern-item">
                    <span class="pattern-name">${name}</span>
                    <span class="pattern-score">${score}</span>
                </div>
            `;
        }).join('');
    }

    /**
     * Memory inspector methods
     */
    async loadInteractionStore() {
        try {
            const res = await fetch('/api/memory/interactions');
            if (res.ok) {
                const data = await res.json();
                this.interactionStoreData = data;
                this.renderInteractionStore();
            }
        } catch (error) {
            console.error('Error loading InteractionStore:', error);
        }
    }

    renderInteractionStore() {
        const list = document.getElementById('interactionList');
        if (!list) return;

        if (!this.interactionStoreData || this.interactionStoreData.length === 0) {
            list.innerHTML = '<li class="memory-item">No entries in InteractionStore</li>';
            return;
        }

        const filtered = this.interactionStoreData.filter(entry => {
            if (!this.domainSearchTerm) return true;
            return entry.domain?.toLowerCase().includes(this.domainSearchTerm);
        });

        list.innerHTML = filtered.map(entry => {
            const domain = this.escapeHtml(entry.domain || 'unknown');
            const content = this.escapeHtml(entry.content?.substring(0, 200) || 'No content');
            const tags = entry.tags || [];
            const tagsHtml = tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('');

            return `
                <li class="memory-item">
                    <div class="memory-domain">${domain}</div>
                    <div class="memory-content">${content}</div>
                    <div class="memory-tags">${tagsHtml}</div>
                </li>
            `;
        }).join('');
    }

    async loadReasoningBank() {
        try {
            const res = await fetch('/api/memory/reasoning');
            if (res.ok) {
                const data = await res.json();
                this.reasoningBankData = data;
                this.renderReasoningBank();
            }
        } catch (error) {
            console.error('Error loading ReasoningBank:', error);
        }
    }

    renderReasoningBank() {
        const statsDiv = document.getElementById('reasoningStats');
        const list = document.getElementById('reasoningList');
        if (!list) return;

        if (!this.reasoningBankData) {
            list.innerHTML = '<li class="memory-item">No data in ReasoningBank</li>';
            return;
        }

        const stats = this.reasoningBankData.stats || {};
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div class="memory-stats">
                    <div class="stat-card">
                        <div class="metric-label">Total Patterns</div>
                        <div class="metric-value">${stats.totalPatterns || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="metric-label">Avg Quality</div>
                        <div class="metric-value">${(stats.avgQuality || 0).toFixed(2)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="metric-label">Total Feedback</div>
                        <div class="metric-value">${stats.totalFeedback || 0}</div>
                    </div>
                </div>
            `;
        }

        const patterns = this.reasoningBankData.recentPatterns || [];
        if (patterns.length === 0) {
            list.innerHTML = '<li class="memory-item">No recent patterns</li>';
            return;
        }

        list.innerHTML = patterns.map(pattern => {
            const id = this.escapeHtml(pattern.id || 'unknown');
            const quality = (pattern.quality || 0).toFixed(2);

            return `
                <li class="memory-item">
                    <div class="memory-domain">Pattern: ${id}</div>
                    <div class="memory-content">Quality: ${quality}</div>
                </li>
            `;
        }).join('');
    }

    async loadEpisodeStore() {
        try {
            const res = await fetch('/api/memory/episodes');
            if (res.ok) {
                const data = await res.json();
                this.episodeStoreData = data;
                this.renderEpisodeStore();
            }
        } catch (error) {
            console.error('Error loading EpisodeStore:', error);
        }
    }

    renderEpisodeStore() {
        const statsDiv = document.getElementById('episodeStats');
        const list = document.getElementById('episodeList');
        if (!list) return;

        if (!this.episodeStoreData) {
            list.innerHTML = '<li class="memory-item">No data in EpisodeStore</li>';
            return;
        }

        const stats = this.episodeStoreData.stats || {};
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div class="memory-stats">
                    <div class="stat-card">
                        <div class="metric-label">Total Episodes</div>
                        <div class="metric-value">${stats.totalEpisodes || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="metric-label">Linked</div>
                        <div class="metric-value">${stats.linkedEpisodes || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="metric-label">Time Index Size</div>
                        <div class="metric-value">${stats.timeIndexSize || 0}</div>
                    </div>
                </div>
            `;
        }

        const episodes = this.episodeStoreData.recentEpisodes || [];
        if (episodes.length === 0) {
            list.innerHTML = '<li class="memory-item">No recent episodes</li>';
            return;
        }

        list.innerHTML = episodes.map(episode => {
            const id = this.escapeHtml(episode.id || 'unknown');
            const type = this.escapeHtml(episode.type || 'unknown');
            const timestamp = new Date(episode.timestamp).toLocaleString();

            return `
                <li class="memory-item">
                    <div class="memory-domain">Episode: ${id}</div>
                    <div class="memory-content">Type: ${type} | ${timestamp}</div>
                </li>
            `;
        }).join('');
    }

    async loadUcmContext() {
        try {
            const res = await fetch('/api/memory/ucm');
            if (res.ok) {
                const data = await res.json();
                this.ucmContextData = data;
                this.renderUcmContext();
            }
        } catch (error) {
            console.error('Error loading UCM Context:', error);
        }
    }

    renderUcmContext() {
        const statsDiv = document.getElementById('ucmStats');
        const list = document.getElementById('ucmContextList');
        if (!list) return;

        if (!this.ucmContextData) {
            list.innerHTML = '<li class="memory-item">No data in UCM Context</li>';
            return;
        }

        const stats = this.ucmContextData.stats || {};
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div class="memory-stats">
                    <div class="stat-card">
                        <div class="metric-label">Context Size</div>
                        <div class="metric-value">${stats.contextSize || 0} tokens</div>
                    </div>
                    <div class="stat-card">
                        <div class="metric-label">Pinned Items</div>
                        <div class="metric-value">${stats.pinnedItems || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="metric-label">Rolling Window</div>
                        <div class="metric-value">${stats.rollingWindowSize || 0}</div>
                    </div>
                </div>
            `;
        }

        const entries = this.ucmContextData.contextEntries || [];
        if (entries.length === 0) {
            list.innerHTML = '<li class="memory-item">No context entries</li>';
            return;
        }

        list.innerHTML = entries.map(entry => {
            const tier = this.escapeHtml(entry.tier || 'unknown');
            const preview = this.escapeHtml((entry.content || '').substring(0, 200));

            return `
                <li class="memory-item">
                    <div class="memory-domain">Tier: ${tier}</div>
                    <div class="memory-content">${preview}...</div>
                </li>
            `;
        }).join('');
    }

    async loadHyperedgeStore() {
        try {
            const res = await fetch('/api/memory/hyperedges');
            if (res.ok) {
                const data = await res.json();
                this.hyperedgeStoreData = data;
                this.renderHyperedgeStore();
            }
        } catch (error) {
            console.error('Error loading Hyperedge Store:', error);
        }
    }

    renderHyperedgeStore() {
        const statsDiv = document.getElementById('hyperedgeStats');
        const list = document.getElementById('hyperedgeList');
        if (!list) return;

        if (!this.hyperedgeStoreData) {
            list.innerHTML = '<li class="memory-item">No data in Hyperedge Store</li>';
            return;
        }

        const stats = this.hyperedgeStoreData.stats || {};
        if (statsDiv) {
            statsDiv.innerHTML = `
                <div class="memory-stats">
                    <div class="stat-card">
                        <div class="metric-label">Q&A Pairs</div>
                        <div class="metric-value">${stats.qaPairs || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="metric-label">Causal Chains</div>
                        <div class="metric-value">${stats.causalChains || 0}</div>
                    </div>
                    <div class="stat-card">
                        <div class="metric-label">Communities</div>
                        <div class="metric-value">${stats.communities || 0}</div>
                    </div>
                </div>
            `;
        }

        const hyperedges = this.hyperedgeStoreData.recentHyperedges || [];
        if (hyperedges.length === 0) {
            list.innerHTML = '<li class="memory-item">No recent hyperedges</li>';
            return;
        }

        list.innerHTML = hyperedges.map(edge => {
            const type = this.escapeHtml(edge.type || 'unknown');
            const id = this.escapeHtml(edge.id || 'unknown');
            const nodes = edge.nodeCount || 0;

            return `
                <li class="memory-item">
                    <div class="memory-domain">${type}: ${id}</div>
                    <div class="memory-content">Nodes: ${nodes}</div>
                </li>
            `;
        }).join('');
    }

    // ==========================================================================
    // EXPLORE TAB FUNCTIONALITY
    // ==========================================================================

    /**
     * Setup Explore tab event listeners
     */
    setupExploreListeners() {
        // Global search
        const globalSearch = document.getElementById('globalSearchInput');
        if (globalSearch) {
            let searchTimeout;
            globalSearch.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => this.performGlobalSearch(), 300);
            });
            globalSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    clearTimeout(searchTimeout);
                    this.performGlobalSearch();
                }
            });
        }

        // KU search
        const kuSearch = document.getElementById('kuSearchInput');
        if (kuSearch) {
            kuSearch.addEventListener('input', () => this.filterKUs());
        }

        // KU confidence filter
        const kuConfFilter = document.getElementById('kuConfidenceFilter');
        if (kuConfFilter) {
            kuConfFilter.addEventListener('change', () => this.loadExploreKUs());
        }

        // RU relation filter
        const ruRelFilter = document.getElementById('ruRelationFilter');
        if (ruRelFilter) {
            ruRelFilter.addEventListener('change', () => this.loadExploreRUs());
        }

        // Build graph button
        const buildGraphBtn = document.getElementById('buildGraphBtn');
        if (buildGraphBtn) {
            buildGraphBtn.addEventListener('click', () => this.buildGraph());
        }

        // Graph export dropdown
        const exportBtn = document.getElementById('exportGraphBtn');
        const exportMenu = document.getElementById('graphExportMenu');
        if (exportBtn && exportMenu) {
            exportBtn.addEventListener('click', () => {
                exportMenu.classList.toggle('show');
            });
            exportMenu.querySelectorAll('button').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.exportGraph(btn.dataset.format);
                    exportMenu.classList.remove('show');
                });
            });
        }

        // Trace button
        const traceBtn = document.getElementById('traceKuBtn');
        if (traceBtn) {
            traceBtn.addEventListener('click', () => this.traceKU());
        }

        // Coverage button
        const coverageBtn = document.getElementById('analyzeCoverageBtn');
        if (coverageBtn) {
            coverageBtn.addEventListener('click', () => this.analyzeCoverage());
        }

        // Refresh explore button
        const refreshBtn = document.getElementById('refreshExplore');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshExplore());
        }

        // Modal close buttons
        const closeKuModal = document.getElementById('closeKuModal');
        const closeRuModal = document.getElementById('closeRuModal');
        if (closeKuModal) {
            closeKuModal.addEventListener('click', () => {
                document.getElementById('kuDetailModal').classList.remove('show');
            });
        }
        if (closeRuModal) {
            closeRuModal.addEventListener('click', () => {
                document.getElementById('ruDetailModal').classList.remove('show');
            });
        }

        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                }
            });
        });

        // ===========================================================================
        // PhD PIPELINE TAB EVENT LISTENERS
        // ===========================================================================

        // Apply corpus selection button
        const applyCorpusBtn = document.getElementById('applyCorpusSelection');
        if (applyCorpusBtn) {
            applyCorpusBtn.addEventListener('click', () => this.applyCorpusSelection());
        }

        // Corpus selector change - update stats
        const corpusSelect = document.getElementById('corpusSelect');
        if (corpusSelect) {
            corpusSelect.addEventListener('change', () => this.loadCorpusStats());
        }

        // Corpus stats refresh button
        const corpusStatsRefresh = document.querySelector('[data-refresh="corpus-stats"]');
        if (corpusStatsRefresh) {
            corpusStatsRefresh.addEventListener('click', () => {
                this.loadCorpusStats();
                this.loadPipelineSessions();
            });
        }

        // Query submit button
        const querySubmitBtn = document.getElementById('phdQuerySubmit');
        if (querySubmitBtn) {
            querySubmitBtn.addEventListener('click', () => this.submitPhdQuery());
        }

        // Query clear button
        const queryClearBtn = document.getElementById('phdQueryClear');
        if (queryClearBtn) {
            queryClearBtn.addEventListener('click', () => this.clearQueryInterface());
        }

        // Query input - submit on Ctrl+Enter
        const queryInput = document.getElementById('phdQueryInput');
        if (queryInput) {
            queryInput.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    this.submitPhdQuery();
                }
            });
        }

        // Copy response button
        const copyResponseBtn = document.getElementById('copyResponse');
        if (copyResponseBtn) {
            copyResponseBtn.addEventListener('click', () => this.copyQueryResponse());
        }
    }

    /**
     * Refresh all explore data
     */
    async refreshExplore() {
        await Promise.all([
            this.loadExploreStats(),
            this.loadExploreKUs(),
            this.loadExploreRUs()
        ]);
    }

    /**
     * Load explore statistics
     */
    async loadExploreStats() {
        try {
            const res = await fetch('/api/explore/stats');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    this.exploreData.stats = data.data;
                    this.renderExploreStats();
                }
            }
        } catch (error) {
            console.error('Error loading explore stats:', error);
        }
    }

    /**
     * Render explore statistics
     */
    renderExploreStats() {
        const stats = this.exploreData.stats || {};

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.textContent = val;
        };

        setVal('exploreKuCount', stats.total_kus || 0);
        setVal('exploreRuCount', stats.total_rus || 0);
        setVal('exploreChunkCount', stats.total_chunks || 0);
        setVal('exploreDocCount', stats.total_documents || 0);
        setVal('exploreAvgConf', (stats.avg_confidence || 0).toFixed(2));
        setVal('exploreQueryCount', stats.query_count || 0);
    }

    /**
     * Load knowledge units
     */
    async loadExploreKUs() {
        try {
            const confFilter = document.getElementById('kuConfidenceFilter')?.value;
            let url = '/api/explore/kus?limit=50';
            if (confFilter) {
                url += `&minConfidence=${confFilter}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    this.exploreData.kus = data.data;
                    this.renderExploreKUs();
                }
            }
        } catch (error) {
            console.error('Error loading KUs:', error);
            this.renderExploreKUsError(error.message);
        }
    }

    /**
     * Filter displayed KUs by search term
     */
    filterKUs() {
        const searchTerm = document.getElementById('kuSearchInput')?.value?.toLowerCase() || '';
        const items = document.querySelectorAll('#kuList .ku-item');

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    }

    /**
     * Render knowledge units list
     */
    renderExploreKUs() {
        const list = document.getElementById('kuList');
        if (!list) return;

        const kus = this.exploreData.kus || [];
        if (kus.length === 0) {
            list.innerHTML = '<div class="loading-placeholder">No knowledge units found</div>';
            return;
        }

        list.innerHTML = kus.map(ku => {
            const conf = (ku.confidence * 100).toFixed(0);
            const confClass = conf >= 80 ? 'high' : conf >= 60 ? 'medium' : 'low';

            return `
                <div class="ku-item" data-id="${this.escapeHtml(ku.id)}" onclick="window.dashboardApp?.showKUDetail('${this.escapeHtml(ku.id)}')">
                    <div class="ku-header">
                        <span class="ku-query">${this.escapeHtml(ku.query || 'Untitled')}</span>
                        <span class="ku-confidence ${confClass}">${conf}%</span>
                    </div>
                    <div class="ku-content">${this.escapeHtml((ku.content || '').substring(0, 200))}</div>
                    <div class="ku-meta">
                        <span>${ku.source_count || 0} sources</span>
                        ${ku.created_at ? `<span>${new Date(ku.created_at).toLocaleDateString()}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    /**
     * Render KU loading error
     */
    renderExploreKUsError(message) {
        const list = document.getElementById('kuList');
        if (list) {
            list.innerHTML = `<div class="loading-placeholder">Error: ${this.escapeHtml(message)}</div>`;
        }
    }

    /**
     * Load reasoning units
     */
    async loadExploreRUs() {
        try {
            const relFilter = document.getElementById('ruRelationFilter')?.value;
            let url = '/api/explore/rus?limit=50';
            if (relFilter) {
                url += `&relation=${relFilter}`;
            }

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    this.exploreData.rus = data.data;
                    this.renderExploreRUs();
                }
            }
        } catch (error) {
            console.error('Error loading RUs:', error);
        }
    }

    /**
     * Render reasoning units list
     */
    renderExploreRUs() {
        const list = document.getElementById('ruList');
        if (!list) return;

        const rus = this.exploreData.rus || [];
        if (rus.length === 0) {
            list.innerHTML = '<div class="loading-placeholder">No reasoning units found</div>';
            return;
        }

        list.innerHTML = rus.map(ru => {
            const score = ((ru.score || 0) * 100).toFixed(0);

            return `
                <div class="ru-item" data-id="${this.escapeHtml(ru.id)}" onclick="window.dashboardApp?.showRUDetail('${this.escapeHtml(ru.id)}')">
                    <div class="ru-header">
                        <span class="ru-relation ${ru.relation}">${this.escapeHtml(ru.relation)}</span>
                        <span class="ru-score">${score}%</span>
                    </div>
                    <div class="ru-meta">
                        <span>${this.escapeHtml(ru.source_ku_id?.substring(0, 8) || '?')}</span>
                        <span class="ru-arrow">→</span>
                        <span>${this.escapeHtml(ru.target_ku_id?.substring(0, 8) || '?')}</span>
                    </div>
                    ${ru.evidence ? `<div class="ku-content">${this.escapeHtml(ru.evidence.substring(0, 100))}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    /**
     * Show KU detail modal
     */
    async showKUDetail(id) {
        try {
            const res = await fetch(`/api/explore/ku/${encodeURIComponent(id)}`);
            if (!res.ok) throw new Error('Failed to load KU');

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            const ku = data.data;
            const content = document.getElementById('kuDetailContent');
            if (!content) return;

            content.innerHTML = `
                <div class="detail-section">
                    <h4>Query</h4>
                    <div class="value">${this.escapeHtml(ku.query)}</div>
                </div>
                <div class="detail-section">
                    <h4>Content</h4>
                    <div class="value">${this.escapeHtml(ku.content)}</div>
                </div>
                <div class="detail-section">
                    <h4>Confidence</h4>
                    <div class="value">${((ku.confidence || 0) * 100).toFixed(1)}%</div>
                </div>
                <div class="detail-section">
                    <h4>Sources (${ku.sources?.length || 0})</h4>
                    <ul class="sources-list">
                        ${(ku.sources || []).map(s => `
                            <li>
                                <span>${this.escapeHtml(s.doc_path || s.chunk_id)}</span>
                                <span>${((s.relevance || 0) * 100).toFixed(0)}%</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;

            document.getElementById('kuDetailModal').classList.add('show');
        } catch (error) {
            console.error('Error loading KU detail:', error);
        }
    }

    /**
     * Show RU detail modal
     */
    async showRUDetail(id) {
        try {
            const res = await fetch(`/api/explore/ru/${encodeURIComponent(id)}`);
            if (!res.ok) throw new Error('Failed to load RU');

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            const ru = data.data;
            const content = document.getElementById('ruDetailContent');
            if (!content) return;

            content.innerHTML = `
                <div class="detail-section">
                    <h4>Relation</h4>
                    <div class="value"><span class="ru-relation ${ru.relation}">${this.escapeHtml(ru.relation)}</span></div>
                </div>
                <div class="detail-section">
                    <h4>Score</h4>
                    <div class="value">${((ru.score || 0) * 100).toFixed(1)}%</div>
                </div>
                <div class="detail-section">
                    <h4>Source KU</h4>
                    <div class="value">${this.escapeHtml(ru.source_ku_id)}</div>
                </div>
                <div class="detail-section">
                    <h4>Target KU</h4>
                    <div class="value">${this.escapeHtml(ru.target_ku_id)}</div>
                </div>
                ${ru.evidence ? `
                <div class="detail-section">
                    <h4>Evidence</h4>
                    <div class="value">${this.escapeHtml(ru.evidence)}</div>
                </div>
                ` : ''}
            `;

            document.getElementById('ruDetailModal').classList.add('show');
        } catch (error) {
            console.error('Error loading RU detail:', error);
        }
    }

    /**
     * Build and display knowledge graph
     */
    async buildGraph() {
        const container = document.getElementById('graphContainer');
        if (!container) return;

        container.innerHTML = '<div class="graph-placeholder">Building graph...</div>';

        try {
            const graphType = document.getElementById('graphTypeSelect')?.value || 'full';
            const maxNodes = document.getElementById('graphMaxNodes')?.value || 100;

            const res = await fetch(`/api/explore/graph?format=d3&type=${graphType}&maxNodes=${maxNodes}`);
            if (!res.ok) throw new Error('Failed to build graph');

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            this.exploreData.graph = data.data;
            this.renderD3Graph(data.data);
        } catch (error) {
            console.error('Error building graph:', error);
            container.innerHTML = `<div class="graph-placeholder">Error: ${this.escapeHtml(error.message)}</div>`;
        }
    }

    /**
     * Render D3.js force-directed graph
     */
    renderD3Graph(graphData) {
        const container = document.getElementById('graphContainer');
        if (!container || !graphData) return;

        // Clear container
        container.innerHTML = '';

        const width = container.clientWidth;
        const height = container.clientHeight || 500;

        // Check if D3 is available
        if (typeof d3 === 'undefined') {
            container.innerHTML = `
                <div class="graph-placeholder">
                    <p>D3.js library not loaded</p>
                    <p>Add <script src="https://d3js.org/d3.v7.min.js"></script> to use graph visualization</p>
                </div>
            `;
            return;
        }

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const g = svg.append('g');

        // Zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));
        svg.call(zoom);

        // Setup zoom controls
        document.getElementById('graphZoomIn')?.addEventListener('click', () => {
            svg.transition().call(zoom.scaleBy, 1.3);
        });
        document.getElementById('graphZoomOut')?.addEventListener('click', () => {
            svg.transition().call(zoom.scaleBy, 0.7);
        });
        document.getElementById('graphReset')?.addEventListener('click', () => {
            svg.transition().call(zoom.transform, d3.zoomIdentity);
        });

        // Force simulation
        const simulation = d3.forceSimulation(graphData.nodes)
            .force('link', d3.forceLink(graphData.links).id(d => d.id).distance(100))
            .force('charge', d3.forceManyBody().strength(-300))
            .force('center', d3.forceCenter(width / 2, height / 2));

        // Links
        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(graphData.links)
            .enter().append('line')
            .attr('class', 'graph-link')
            .attr('stroke-width', d => Math.sqrt(d.weight || 1));

        // Nodes
        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(graphData.nodes)
            .enter().append('g')
            .attr('class', 'graph-node')
            .call(d3.drag()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x;
                    d.fy = d.y;
                })
                .on('drag', (event, d) => {
                    d.fx = event.x;
                    d.fy = event.y;
                })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null;
                    d.fy = null;
                }));

        node.append('circle')
            .attr('r', d => d.type === 'ku' ? 8 : d.type === 'ru' ? 6 : 5)
            .attr('class', d => d.type);

        node.append('text')
            .attr('dx', 12)
            .attr('dy', '.35em')
            .text(d => d.label?.substring(0, 20) || d.id?.substring(0, 8));

        // Tooltip on hover
        node.append('title')
            .text(d => `${d.type}: ${d.label || d.id}`);

        // Update positions on tick
        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node.attr('transform', d => `translate(${d.x},${d.y})`);
        });
    }

    /**
     * Export graph in specified format
     */
    exportGraph(format) {
        const graph = this.exploreData.graph;
        if (!graph) {
            alert('No graph data available. Build the graph first.');
            return;
        }

        let content, filename, mimeType;

        switch (format) {
            case 'd3':
                content = JSON.stringify(graph, null, 2);
                filename = 'knowledge-graph.json';
                mimeType = 'application/json';
                break;
            case 'dot':
                content = this.graphToDot(graph);
                filename = 'knowledge-graph.dot';
                mimeType = 'text/plain';
                break;
            case 'mermaid':
                content = this.graphToMermaid(graph);
                filename = 'knowledge-graph.mmd';
                mimeType = 'text/plain';
                break;
            case 'cytoscape':
                content = JSON.stringify(this.graphToCytoscape(graph), null, 2);
                filename = 'knowledge-graph-cytoscape.json';
                mimeType = 'application/json';
                break;
            default:
                return;
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Convert graph to DOT format
     */
    graphToDot(graph) {
        let dot = 'digraph KnowledgeGraph {\n';
        dot += '  rankdir=LR;\n';
        dot += '  node [shape=ellipse];\n\n';

        graph.nodes.forEach(n => {
            const label = (n.label || n.id).replace(/"/g, '\\"');
            dot += `  "${n.id}" [label="${label}" type="${n.type}"];\n`;
        });

        dot += '\n';

        graph.links.forEach(l => {
            const source = typeof l.source === 'object' ? l.source.id : l.source;
            const target = typeof l.target === 'object' ? l.target.id : l.target;
            dot += `  "${source}" -> "${target}"`;
            if (l.relation) dot += ` [label="${l.relation}"]`;
            dot += ';\n';
        });

        dot += '}\n';
        return dot;
    }

    /**
     * Convert graph to Mermaid format
     */
    graphToMermaid(graph) {
        let mmd = 'graph LR\n';

        graph.nodes.forEach(n => {
            const label = (n.label || n.id).replace(/["\[\]]/g, '');
            mmd += `  ${n.id.replace(/[^a-zA-Z0-9]/g, '_')}["${label}"]\n`;
        });

        graph.links.forEach(l => {
            const source = typeof l.source === 'object' ? l.source.id : l.source;
            const target = typeof l.target === 'object' ? l.target.id : l.target;
            const srcId = source.replace(/[^a-zA-Z0-9]/g, '_');
            const tgtId = target.replace(/[^a-zA-Z0-9]/g, '_');
            mmd += `  ${srcId} --> ${tgtId}\n`;
        });

        return mmd;
    }

    /**
     * Convert graph to Cytoscape format
     */
    graphToCytoscape(graph) {
        const elements = [];

        graph.nodes.forEach(n => {
            elements.push({
                data: { id: n.id, label: n.label, type: n.type }
            });
        });

        graph.links.forEach(l => {
            const source = typeof l.source === 'object' ? l.source.id : l.source;
            const target = typeof l.target === 'object' ? l.target.id : l.target;
            elements.push({
                data: { source, target, relation: l.relation }
            });
        });

        return { elements };
    }

    /**
     * Trace provenance for a KU
     */
    async traceKU() {
        const input = document.getElementById('traceKuInput');
        const container = document.getElementById('traceContainer');
        if (!input || !container) return;

        const kuId = input.value.trim();
        if (!kuId) {
            container.innerHTML = '<div class="trace-placeholder"><p>Please enter a KU ID</p></div>';
            return;
        }

        container.innerHTML = '<div class="trace-placeholder"><p>Tracing provenance...</p></div>';

        try {
            const res = await fetch(`/api/explore/trace/${encodeURIComponent(kuId)}`);
            if (!res.ok) throw new Error('Failed to trace KU');

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            this.exploreData.trace = data.data;
            this.renderTrace(data.data);
        } catch (error) {
            console.error('Error tracing KU:', error);
            container.innerHTML = `<div class="trace-placeholder"><p>Error: ${this.escapeHtml(error.message)}</p></div>`;
        }
    }

    /**
     * Render provenance trace
     */
    renderTrace(trace) {
        const container = document.getElementById('traceContainer');
        if (!container || !trace) return;

        const chain = trace.chain || [];
        if (chain.length === 0) {
            container.innerHTML = '<div class="trace-placeholder"><p>No provenance chain found</p></div>';
            return;
        }

        container.innerHTML = '<div class="trace-chain">' +
            chain.map((node, i) => `
                ${i > 0 ? '<div class="trace-arrow">↓</div>' : ''}
                <div class="trace-node ${node.level}">
                    <span class="trace-level">${this.escapeHtml(node.level)}</span>
                    <div class="trace-content">
                        <strong>${this.escapeHtml(node.id)}</strong>
                        ${node.content ? `<p>${this.escapeHtml(node.content.substring(0, 200))}...</p>` : ''}
                    </div>
                </div>
            `).join('') +
            '</div>';
    }

    /**
     * Analyze coverage
     */
    async analyzeCoverage() {
        const container = document.getElementById('coverageHeatmap');
        const gapsContainer = document.getElementById('coverageGaps');
        if (!container) return;

        container.innerHTML = '<div class="coverage-placeholder">Analyzing coverage...</div>';
        if (gapsContainer) gapsContainer.innerHTML = '';

        try {
            const showGaps = document.getElementById('showGapsCheck')?.checked;
            const showHeatmap = document.getElementById('showHeatmapCheck')?.checked;

            let url = '/api/explore/coverage?';
            if (showGaps) url += 'showGaps=true&';
            if (showHeatmap) url += 'includeHeatmap=true';

            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to analyze coverage');

            const data = await res.json();
            if (!data.success) throw new Error(data.error);

            this.exploreData.coverage = data.data;
            this.renderCoverage(data.data);
        } catch (error) {
            console.error('Error analyzing coverage:', error);
            container.innerHTML = `<div class="coverage-placeholder">Error: ${this.escapeHtml(error.message)}</div>`;
        }
    }

    /**
     * Perform global search across KUs, Agents, and Memory
     */
    async performGlobalSearch() {
        const input = document.getElementById('globalSearchInput');
        const resultsContainer = document.getElementById('globalSearchResults');
        if (!input || !resultsContainer) return;

        const query = input.value.trim();
        if (!query) {
            resultsContainer.innerHTML = '';
            return;
        }

        const searchKUs = document.getElementById('searchKUs')?.checked;
        const searchAgents = document.getElementById('searchAgents')?.checked;
        const searchMemory = document.getElementById('searchMemory')?.checked;

        resultsContainer.innerHTML = '<div class="search-loading">Searching...</div>';

        try {
            const results = [];

            // Search KUs
            if (searchKUs) {
                try {
                    const kuRes = await fetch(`/api/explore/search?q=${encodeURIComponent(query)}&limit=5`);
                    if (kuRes.ok) {
                        const kuData = await kuRes.json();
                        if (kuData.success && kuData.data) {
                            kuData.data.forEach(ku => {
                                results.push({
                                    type: 'ku',
                                    id: ku.id,
                                    title: ku.query || 'Knowledge Unit',
                                    preview: ku.content?.substring(0, 80) || '',
                                    score: ku.score || ku.confidence || 0
                                });
                            });
                        }
                    }
                } catch (e) {
                    console.warn('KU search failed:', e);
                }
            }

            // Search Agents (client-side filtering from registry)
            if (searchAgents) {
                const agents = Array.from(this.agents.values());
                const queryLower = query.toLowerCase();
                const matchingAgents = agents.filter(a =>
                    a.name?.toLowerCase().includes(queryLower) ||
                    a.type?.toLowerCase().includes(queryLower) ||
                    a.category?.toLowerCase().includes(queryLower)
                ).slice(0, 5);

                matchingAgents.forEach(agent => {
                    results.push({
                        type: 'agent',
                        id: agent.agentId,
                        title: agent.name || agent.type,
                        preview: `${agent.category} - ${agent.status}`,
                        score: 0.8
                    });
                });
            }

            // Search Memory (from interactions)
            if (searchMemory) {
                try {
                    const memRes = await fetch('/api/memory/interactions');
                    if (memRes.ok) {
                        const interactions = await memRes.json();
                        if (Array.isArray(interactions)) {
                            const queryLower = query.toLowerCase();
                            const matching = interactions.filter(i =>
                                i.domain?.toLowerCase().includes(queryLower) ||
                                i.content?.toLowerCase().includes(queryLower)
                            ).slice(0, 5);

                            matching.forEach(m => {
                                results.push({
                                    type: 'memory',
                                    id: m.id,
                                    title: m.domain || 'Memory Entry',
                                    preview: m.content?.substring(0, 80) || '',
                                    score: 0.7
                                });
                            });
                        }
                    }
                } catch (e) {
                    console.warn('Memory search failed:', e);
                }
            }

            // Sort by score
            results.sort((a, b) => (b.score || 0) - (a.score || 0));

            // Render results
            if (results.length === 0) {
                resultsContainer.innerHTML = '<div class="search-no-results">No results found</div>';
            } else {
                resultsContainer.innerHTML = results.map(r => `
                    <div class="search-result-item" onclick="window.dashboardApp?.navigateToSearchResult('${r.type}', '${this.escapeHtml(r.id)}')">
                        <span class="search-result-type ${r.type}">${r.type}</span>
                        <span class="search-result-title">${this.escapeHtml(r.title)}</span>
                        <span class="search-result-score">${((r.score || 0) * 100).toFixed(0)}%</span>
                        <div class="search-result-preview">${this.escapeHtml(r.preview)}</div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Search error:', error);
            resultsContainer.innerHTML = '<div class="search-no-results">Search failed</div>';
        }
    }

    /**
     * Navigate to a search result
     */
    navigateToSearchResult(type, id) {
        switch (type) {
            case 'ku':
                this.switchMainTab('explore');
                setTimeout(() => this.showKUDetail(id), 100);
                break;
            case 'agent':
                this.switchMainTab('activity');
                break;
            case 'memory':
                this.switchMainTab('memory');
                break;
        }
    }

    /**
     * Render coverage analysis
     */
    renderCoverage(coverage) {
        // Update stats
        document.getElementById('coveragePercent').textContent =
            `${(coverage.coverage_percentage || 0).toFixed(1)}%`;
        document.getElementById('coveredQueries').textContent =
            `${coverage.covered_queries || 0}/${coverage.total_queries || 0}`;
        document.getElementById('usedDocs').textContent =
            `${coverage.used_documents || 0}/${coverage.total_documents || 0}`;

        // Render heatmap
        const heatmapContainer = document.getElementById('coverageHeatmap');
        if (heatmapContainer && coverage.heatmap && coverage.heatmap.length > 0) {
            // Group by query and document
            const queries = [...new Set(coverage.heatmap.map(h => h.query))];
            const docs = [...new Set(coverage.heatmap.map(h => h.document))];
            const matrix = {};
            coverage.heatmap.forEach(h => {
                const key = `${h.query}|${h.document}`;
                matrix[key] = h.coverage;
            });

            let html = '<table class="heatmap-table"><thead><tr><th></th>';
            docs.forEach(d => {
                html += `<th title="${this.escapeHtml(d)}">${this.escapeHtml(d.substring(0, 10))}...</th>`;
            });
            html += '</tr></thead><tbody>';

            queries.forEach(q => {
                html += `<tr><td title="${this.escapeHtml(q)}">${this.escapeHtml(q.substring(0, 15))}...</td>`;
                docs.forEach(d => {
                    const val = matrix[`${q}|${d}`] || 0;
                    const level = val >= 0.7 ? 'high' : val >= 0.4 ? 'medium' : val > 0 ? 'low' : 'none';
                    html += `<td class="heatmap-cell ${level}" title="${(val * 100).toFixed(0)}%"></td>`;
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
            heatmapContainer.innerHTML = html;
        } else {
            heatmapContainer.innerHTML = '<div class="coverage-placeholder">No heatmap data</div>';
        }

        // Render gaps
        const gapsContainer = document.getElementById('coverageGaps');
        if (gapsContainer && coverage.gaps && coverage.gaps.length > 0) {
            gapsContainer.innerHTML = coverage.gaps.map(g => `
                <div class="gap-item">
                    <div class="gap-query">${this.escapeHtml(g.query)}</div>
                    <div class="gap-missing">Missing: ${g.missing_coverage?.join(', ') || 'unknown'}</div>
                </div>
            `).join('');
        }
    }

    // =========================================================================
    // DATA EXPORT
    // =========================================================================

    /**
     * Export data as JSON
     * @param {Object} data - Data to export
     * @param {string} filename - Output filename
     */
    exportJSON(data, filename) {
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        this.downloadBlob(blob, `${filename}.json`);
        this.toastSuccess('Export Complete', `${filename}.json downloaded`);
    }

    /**
     * Export data as CSV
     * @param {Array} data - Array of objects to export
     * @param {string} filename - Output filename
     */
    exportCSV(data, filename) {
        if (!Array.isArray(data) || data.length === 0) {
            this.toastError('Export Error', 'No data to export');
            return;
        }

        // Get headers from first object
        const headers = Object.keys(data[0]);
        const csvRows = [headers.join(',')];

        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => {
                let val = row[header];
                if (val === null || val === undefined) val = '';
                if (typeof val === 'object') val = JSON.stringify(val);
                // Escape quotes and wrap in quotes if contains comma
                val = String(val).replace(/"/g, '""');
                if (val.includes(',') || val.includes('"') || val.includes('\n')) {
                    val = `"${val}"`;
                }
                return val;
            });
            csvRows.push(values.join(','));
        });

        const csv = csvRows.join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        this.downloadBlob(blob, `${filename}.csv`);
        this.toastSuccess('Export Complete', `${filename}.csv downloaded`);
    }

    /**
     * Export chart as PNG
     * @param {Object} chart - Chart.js instance
     * @param {string} filename - Output filename
     */
    exportChartPNG(chart, filename) {
        if (!chart) {
            this.toastError('Export Error', 'Chart not available');
            return;
        }

        const canvas = chart.canvas;
        canvas.toBlob(blob => {
            this.downloadBlob(blob, `${filename}.png`);
            this.toastSuccess('Export Complete', `${filename}.png downloaded`);
        });
    }

    /**
     * Helper to trigger download
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Export analytics summary
     */
    exportAnalyticsSummary() {
        const data = {
            timestamp: new Date().toISOString(),
            summary: this.analyticsData.summary,
            models: this.analyticsData.models,
            quality: this.analyticsData.quality,
            costs: this.analyticsData.costs,
        };
        this.exportJSON(data, `analytics-${new Date().toISOString().slice(0, 10)}`);
    }

    /**
     * Export activities as CSV
     */
    exportActivities() {
        const data = this.activities.map(a => ({
            timestamp: new Date(a.timestamp).toISOString(),
            component: a.component,
            status: a.status,
            message: a.message,
        }));
        this.exportCSV(data, `activities-${new Date().toISOString().slice(0, 10)}`);
    }

    /**
     * Export knowledge units
     */
    exportKUs() {
        this.exportJSON(this.exploreData.kus, `knowledge-units-${new Date().toISOString().slice(0, 10)}`);
    }

    /**
     * Export reasoning units
     */
    exportRUs() {
        this.exportJSON(this.exploreData.rus, `reasoning-units-${new Date().toISOString().slice(0, 10)}`);
    }

    /**
     * Export quality chart as PNG
     */
    exportQualityChart() {
        this.exportChartPNG(this.qualityChart, `quality-chart-${new Date().toISOString().slice(0, 10)}`);
    }

    /**
     * Export cost chart as PNG
     */
    exportCostChart() {
        this.exportChartPNG(this.costChart, `cost-chart-${new Date().toISOString().slice(0, 10)}`);
    }

    // =========================================================================
    // TOAST NOTIFICATIONS
    // =========================================================================

    /**
     * Show a toast notification
     * @param {Object} options - Toast options
     * @param {string} options.type - 'success' | 'error' | 'warning' | 'info'
     * @param {string} options.title - Toast title
     * @param {string} options.message - Toast message
     * @param {number} options.duration - Auto-dismiss duration (ms), 0 for no auto-dismiss
     * @param {Object} options.action - Optional action button { label, onClick }
     */
    showToast({ type = 'info', title, message, duration = 5000, action = null }) {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const icons = {
            success: '&#10004;',
            error: '&#10008;',
            warning: '&#9888;',
            info: '&#8505;'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <div class="toast-content">
                <div class="toast-title">${this.escapeHtml(title)}</div>
                ${message ? `<div class="toast-message">${this.escapeHtml(message)}</div>` : ''}
                ${action ? `<div class="toast-action"><button>${this.escapeHtml(action.label)}</button></div>` : ''}
            </div>
            <button class="toast-close">&times;</button>
        `;

        // Close button handler
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.dismissToast(toast);
        });

        // Action button handler
        if (action && action.onClick) {
            toast.querySelector('.toast-action button')?.addEventListener('click', () => {
                action.onClick();
                this.dismissToast(toast);
            });
        }

        container.appendChild(toast);

        // Auto-dismiss
        if (duration > 0) {
            setTimeout(() => {
                this.dismissToast(toast);
            }, duration);
        }

        return toast;
    }

    /**
     * Dismiss a toast with animation
     */
    dismissToast(toast) {
        if (!toast || !toast.parentNode) return;
        toast.classList.add('closing');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }

    /**
     * Show success toast
     */
    toastSuccess(title, message = '', duration = 5000) {
        return this.showToast({ type: 'success', title, message, duration });
    }

    /**
     * Show error toast
     */
    toastError(title, message = '', duration = 8000) {
        return this.showToast({ type: 'error', title, message, duration });
    }

    /**
     * Show warning toast
     */
    toastWarning(title, message = '', duration = 6000) {
        return this.showToast({ type: 'warning', title, message, duration });
    }

    /**
     * Show info toast
     */
    toastInfo(title, message = '', duration = 4000) {
        return this.showToast({ type: 'info', title, message, duration });
    }

    /**
     * XSS prevention: Escape HTML special characters
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return String(text);
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===========================================================================
    // CLAIM MAP TAB
    // ===========================================================================

    /** Current claim map state */
    cmState = {
        currentJobId: null,
        data: null,       // { job, nodes, links, stats, layout }
        textData: null,   // { sourceText, spans }
        jobs: [],
        selectedNodeId: null,
        currentView: 'text',
        sortKey: 'label',
        sortDir: 'asc',
        searchTerm: '',
        compareJobId: null,
        compareData: null,
        graphLayout: 'toulmin',
        colorMode: 'verdict',
        verdictChart: null,
        categoryChart: null,
        profileChart: null,
        servicesData: null,  // { corpusReady, services: { embedding, chromadb } }
    };

    /**
     * Load claim map tab data
     */
    async loadClaimMapData() {
        this.cmBindEvents();
        await Promise.all([
            this.cmFetchJobs(),
            this.cmCheckServices(),
        ]);
    }

    /**
     * Check embedding + ChromaDB service availability
     */
    async cmCheckServices() {
        const statusEl = document.getElementById('cmCorpusStatus');
        const checkbox = document.getElementById('cmAnalyzeCorpus');
        const banner = document.getElementById('cmCorpusBanner');

        if (statusEl) {
            statusEl.textContent = 'checking...';
            statusEl.className = 'cm-corpus-status cm-corpus-checking';
        }

        try {
            const resp = await fetch('/api/claim-map/services');
            const data = await resp.json();
            this.cmState.servicesData = data;

            if (data.corpusReady) {
                if (statusEl) {
                    statusEl.textContent = 'services ready';
                    statusEl.className = 'cm-corpus-status cm-corpus-ready';
                }
                if (checkbox) { checkbox.disabled = false; }
                if (banner) {
                    const emb = data.services?.embedding;
                    const chroma = data.services?.chromadb;
                    banner.className = 'cm-corpus-banner cm-banner-ok';
                    banner.textContent = `Embedding (${emb?.latencyMs}ms) and ChromaDB (${chroma?.latencyMs}ms) connected.`;
                    banner.style.display = '';
                }
            } else {
                if (statusEl) {
                    statusEl.textContent = 'unavailable';
                    statusEl.className = 'cm-corpus-status cm-corpus-unavailable';
                }
                if (checkbox) { checkbox.disabled = true; checkbox.checked = false; }
                if (banner) {
                    banner.className = 'cm-corpus-banner cm-banner-warn';
                    banner.innerHTML = data.message || 'Corpus services unavailable. Start them with <code>/god-launch</code>.';
                    banner.style.display = '';
                }
            }
        } catch {
            if (statusEl) {
                statusEl.textContent = 'error';
                statusEl.className = 'cm-corpus-status cm-corpus-unavailable';
            }
            if (checkbox) { checkbox.disabled = true; checkbox.checked = false; }
            if (banner) {
                banner.className = 'cm-corpus-banner cm-banner-warn';
                banner.textContent = 'Could not check service status.';
                banner.style.display = '';
            }
        }
    }

    /**
     * Bind all claim map event handlers
     */
    cmBindEvents() {
        // View toggle
        document.querySelectorAll('.cm-view-btn').forEach(btn => {
            btn.addEventListener('click', () => this.cmSwitchView(btn.dataset.view));
        });

        // Job select
        document.getElementById('cmJobSelect')?.addEventListener('change', (e) => {
            const jobId = e.target.value;
            if (jobId) this.cmLoadJob(jobId);
        });

        // Analyze button
        document.getElementById('cmAnalyzeBtn')?.addEventListener('click', () => {
            this.cmCheckServices(); // Refresh service status when opening dialog
            document.getElementById('cmAnalyzeDialog').style.display = 'flex';
        });
        document.getElementById('cmAnalyzeDialogClose')?.addEventListener('click', () => {
            document.getElementById('cmAnalyzeDialog').style.display = 'none';
        });
        document.getElementById('cmAnalyzeCancel')?.addEventListener('click', () => {
            document.getElementById('cmAnalyzeDialog').style.display = 'none';
        });
        document.getElementById('cmAnalyzeConfirm')?.addEventListener('click', () => this.cmRunAnalysis());

        // God Write "Analyze Claims" button
        document.getElementById('gwAnalyzeClaims')?.addEventListener('click', () => this.cmAnalyzeFromGodWrite());

        // Graph controls
        document.getElementById('cmLayoutSelect')?.addEventListener('change', (e) => {
            this.cmState.graphLayout = e.target.value;
            if (this.cmState.data) this.cmRenderGraph(this.cmState.data);
        });
        document.getElementById('cmColorMode')?.addEventListener('change', (e) => {
            this.cmState.colorMode = e.target.value;
            if (this.cmState.data) this.cmRenderGraph(this.cmState.data);
        });
        document.getElementById('cmShowUnsupported')?.addEventListener('change', (e) => {
            if (this.cmState.data) this.cmRenderGraph(this.cmState.data);
        });

        // Table sorting
        document.querySelectorAll('.cm-th-sortable').forEach(th => {
            th.addEventListener('click', () => {
                const key = th.dataset.sort;
                if (this.cmState.sortKey === key) {
                    this.cmState.sortDir = this.cmState.sortDir === 'asc' ? 'desc' : 'asc';
                } else {
                    this.cmState.sortKey = key;
                    this.cmState.sortDir = 'asc';
                }
                if (this.cmState.data) this.cmRenderTable(this.cmState.data.nodes);
            });
        });

        // Search
        document.getElementById('cmSearchInput')?.addEventListener('input', (e) => {
            this.cmState.searchTerm = e.target.value.toLowerCase();
            if (this.cmState.data) {
                this.cmRenderTable(this.cmState.data.nodes);
                this.cmHighlightSearch();
            }
        });

        // Compare
        document.getElementById('cmCompareSelect')?.addEventListener('change', (e) => {
            const compareJobId = e.target.value;
            if (compareJobId && this.cmState.currentJobId) {
                this.cmRunComparison(this.cmState.currentJobId, compareJobId);
            } else {
                this.cmState.compareData = null;
                document.getElementById('cmComparisonBadges').style.display = 'none';
            }
        });

        // Detail panel: save note
        document.getElementById('cmSaveNote')?.addEventListener('click', () => this.cmSaveNote());

        // Detail panel: pin
        document.getElementById('cmPinBtn')?.addEventListener('click', () => this.cmTogglePin());

        // Export
        document.getElementById('cmExportBtn')?.addEventListener('click', () => this.cmExport());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.currentMainTab !== 'claim-map') return;
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
            if (e.key === '1') this.cmSwitchView('text');
            if (e.key === '2') this.cmSwitchView('graph');
            if (e.key === '3') this.cmSwitchView('table');
        });
    }

    /**
     * Fetch job list
     */
    async cmFetchJobs() {
        try {
            const resp = await fetch('/api/claim-map/jobs');
            const data = await resp.json();
            this.cmState.jobs = data.jobs || [];
            this.cmPopulateJobSelect();
        } catch (error) {
            console.error('Failed to fetch claim map jobs:', error);
        }
    }

    /**
     * Populate job selector dropdown
     */
    cmPopulateJobSelect() {
        const sel = document.getElementById('cmJobSelect');
        if (!sel) return;
        sel.innerHTML = this.cmState.jobs.length === 0
            ? '<option value="">No analyses yet</option>'
            : this.cmState.jobs.map(j =>
                `<option value="${j.jobId}">${new Date(j.createdAt).toLocaleString()} (${j.totalClaims} claims, ${j.status})</option>`
            ).join('');

        // Populate compare dropdown
        const cmpSel = document.getElementById('cmCompareSelect');
        if (cmpSel && this.cmState.jobs.length > 1) {
            cmpSel.style.display = '';
            cmpSel.innerHTML = '<option value="">Compare to...</option>' +
                this.cmState.jobs.map(j =>
                    `<option value="${j.jobId}">${new Date(j.createdAt).toLocaleString()} (${j.totalClaims})</option>`
                ).join('');
        }

        // Auto-load first job
        if (this.cmState.jobs.length > 0 && !this.cmState.currentJobId) {
            this.cmLoadJob(this.cmState.jobs[0].jobId);
        }
    }

    /**
     * Load a specific claim map job
     */
    async cmLoadJob(jobId) {
        try {
            const [dataResp, textResp] = await Promise.all([
                fetch(`/api/claim-map/data/${jobId}`),
                fetch(`/api/claim-map/text/${jobId}`),
            ]);
            const data = await dataResp.json();
            const textData = await textResp.json();

            this.cmState.currentJobId = jobId;
            this.cmState.data = data;
            this.cmState.textData = textData;
            this.cmState.selectedNodeId = null;

            this.cmRenderStats(data.stats);
            this.cmRenderAnnotatedText(textData);
            this.cmRenderTable(data.nodes);
            this.cmRenderDetailEmpty();

            // If graph is active, render it
            if (this.cmState.currentView === 'graph') {
                this.cmRenderGraph(data);
            }
        } catch (error) {
            console.error('Failed to load claim map job:', error);
            this.toastError('Load Error', 'Failed to load claim map data');
        }
    }

    /**
     * Switch active view
     */
    cmSwitchView(view) {
        this.cmState.currentView = view;
        document.querySelectorAll('.cm-view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view));
        document.querySelectorAll('.cm-view-panel').forEach(p => {
            p.style.display = 'none';
            p.classList.remove('active');
        });

        const viewMap = { text: 'cmTextView', graph: 'cmGraphView', table: 'cmTableView' };
        const panel = document.getElementById(viewMap[view]);
        if (panel) { panel.style.display = 'block'; panel.classList.add('active'); }

        // Show/hide graph controls
        const graphControls = document.getElementById('cmGraphControls');
        if (graphControls) graphControls.style.display = view === 'graph' ? '' : 'none';

        // Render graph on first switch
        if (view === 'graph' && this.cmState.data) {
            this.cmRenderGraph(this.cmState.data);
        }
    }

    /**
     * Render stats bar
     */
    cmRenderStats(stats) {
        if (!stats) return;
        document.getElementById('cmTotalClaims').textContent = stats.totalClaims || 0;
        document.getElementById('cmUnsupported').textContent = stats.unsupportedCount || 0;
        document.getElementById('cmAvgQuality').textContent = (stats.avgQuality || 0).toFixed(2);

        const verifiedPct = stats.totalClaims > 0
            ? Math.round(((stats.verdictDistribution?.SUPPORTED || 0) + (stats.verdictDistribution?.PARTIALLY_SUPPORTED || 0)) / stats.totalClaims * 100)
            : 0;
        document.getElementById('cmVerifiedPct').textContent = verifiedPct + '%';

        // Verdict distribution mini chart
        this.cmRenderVerdictChart(stats.verdictDistribution || {});
        this.cmRenderCategoryChart(stats.categoryDistribution || {});
    }

    /**
     * Render verdict distribution as horizontal stacked bar
     */
    cmRenderVerdictChart(dist) {
        const canvas = document.getElementById('cmVerdictChart');
        if (!canvas) return;
        if (this.cmState.verdictChart) this.cmState.verdictChart.destroy();

        const labels = Object.keys(dist);
        const values = Object.values(dist);
        const colors = {
            SUPPORTED: '#00c853', PARTIALLY_SUPPORTED: '#ffc107',
            UNSUPPORTED: '#ff6b6b', CONTRADICTED: '#ff1744',
            UNCERTAIN: '#90a4ae', BLOCKED: '#78909c',
        };

        this.cmState.verdictChart = new Chart(canvas.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Verdicts'],
                datasets: labels.map((label, i) => ({
                    label,
                    data: [values[i]],
                    backgroundColor: colors[label] || '#666',
                })),
            },
            options: {
                indexAxis: 'y',
                responsive: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { stacked: true, display: false },
                    y: { stacked: true, display: false },
                },
            },
        });
    }

    /**
     * Render category distribution as doughnut
     */
    cmRenderCategoryChart(dist) {
        const canvas = document.getElementById('cmCategoryChart');
        if (!canvas) return;
        if (this.cmState.categoryChart) this.cmState.categoryChart.destroy();

        const labels = Object.keys(dist);
        const values = Object.values(dist);
        const colors = {
            attributional: '#7c4dff', ontological: '#00bcd4',
            structural: '#ff9800', temporal: '#e91e63',
            comparative: '#4caf50', metadiscursive: '#9e9e9e',
        };

        this.cmState.categoryChart = new Chart(canvas.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: labels.map(l => colors[l] || '#666'),
                }],
            },
            options: {
                responsive: false,
                plugins: { legend: { display: false } },
                cutout: '60%',
            },
        });
    }

    /**
     * Render annotated text with claim span highlighting
     */
    cmRenderAnnotatedText(textData) {
        const container = document.getElementById('cmAnnotatedText');
        if (!container || !textData) return;

        if (!textData.sourceText || !textData.spans || textData.spans.length === 0) {
            if (textData.sourceText) {
                container.innerHTML = `
                    <div class="cm-zero-claims-banner">
                        <strong>0 pattern-matched claims found.</strong>
                        The detector looks for scholarly patterns (e.g. "X argues that...", "If X, then Y", definitional claims).
                        Try pasting academic prose with author attributions or argumentative structure.
                    </div>
                    <div class="cm-plain-text">${this.escapeHtml(textData.sourceText)}</div>`;
            } else {
                container.innerHTML = '<div class="cm-empty-state"><div class="empty-icon">&#128269;</div><p>No claim analysis loaded</p></div>';
            }
            return;
        }

        const text = textData.sourceText;
        const spans = textData.spans.filter(s => s.startOffset != null && s.endOffset != null && s.startOffset >= 0);
        spans.sort((a, b) => a.startOffset - b.startOffset);

        // Build HTML with mark elements, handling overlaps by skipping
        let html = '';
        let pos = 0;

        for (const span of spans) {
            if (span.startOffset < pos) continue; // skip overlapping

            // Plain text before this span
            if (span.startOffset > pos) {
                html += this.escapeHtml(text.slice(pos, span.startOffset));
            }

            const spanText = text.slice(span.startOffset, span.endOffset);
            html += `<mark class="cm-claim-span" data-node-id="${this.escapeHtml(span.nodeId)}" data-verdict="${this.escapeHtml(span.verdict || '')}" title="${this.escapeHtml(span.label || '')}">${this.escapeHtml(spanText)}</mark>`;

            pos = span.endOffset;
        }

        // Remaining text
        if (pos < text.length) {
            html += this.escapeHtml(text.slice(pos));
        }

        container.innerHTML = html;

        // Click handlers on spans
        container.querySelectorAll('.cm-claim-span').forEach(mark => {
            mark.addEventListener('click', () => {
                const nodeId = mark.dataset.nodeId;
                this.cmSelectNode(nodeId);
                container.querySelectorAll('.cm-claim-span').forEach(m => m.classList.remove('cm-selected'));
                mark.classList.add('cm-selected');
            });
        });
    }

    /**
     * Render claim table
     */
    cmRenderTable(nodes) {
        const tbody = document.getElementById('cmClaimTableBody');
        if (!tbody || !nodes) return;

        // Filter to claim nodes only
        let claims = nodes.filter(n => n.type !== 'citation' && n.type !== 'evidence');

        // Apply search filter
        if (this.cmState.searchTerm) {
            claims = claims.filter(n =>
                (n.label || '').toLowerCase().includes(this.cmState.searchTerm) ||
                (n.fullText || '').toLowerCase().includes(this.cmState.searchTerm)
            );
        }

        // Sort
        const key = this.cmState.sortKey;
        const dir = this.cmState.sortDir === 'asc' ? 1 : -1;
        claims.sort((a, b) => {
            const va = a[key] || '';
            const vb = b[key] || '';
            if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
            return String(va).localeCompare(String(vb)) * dir;
        });

        // Update sort indicators
        document.querySelectorAll('.cm-th-sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            if (th.dataset.sort === key) th.classList.add(this.cmState.sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
        });

        tbody.innerHTML = claims.map(n => `
            <tr class="cm-table-row ${n.id === this.cmState.selectedNodeId ? 'cm-row-selected' : ''}" data-node-id="${this.escapeHtml(n.id)}">
                <td title="${this.escapeHtml(n.fullText || n.label)}">${this.escapeHtml(n.label)}</td>
                <td><span class="cm-badge cm-badge-${n.category || 'unknown'}">${this.escapeHtml(n.category || '-')}</span></td>
                <td><span class="cm-badge cm-badge-risk-${n.riskLevel || 'medium'}">${this.escapeHtml(n.riskLevel || '-')}</span></td>
                <td><span class="cm-badge cm-badge-${(n.verdict || 'uncertain').toLowerCase()}">${this.escapeHtml(n.verdict || '-')}</span></td>
                <td>${(n.quality || 0).toFixed(2)}</td>
            </tr>
        `).join('');

        // Row click handlers
        tbody.querySelectorAll('.cm-table-row').forEach(row => {
            row.addEventListener('click', () => {
                const nodeId = row.dataset.nodeId;
                this.cmSelectNode(nodeId);
                tbody.querySelectorAll('.cm-table-row').forEach(r => r.classList.remove('cm-row-selected'));
                row.classList.add('cm-row-selected');
            });
        });
    }

    /**
     * Select a node - show detail panel
     */
    cmSelectNode(nodeId) {
        this.cmState.selectedNodeId = nodeId;
        const node = this.cmState.data?.nodes?.find(n => n.id === nodeId);
        if (!node) { this.cmRenderDetailEmpty(); return; }

        document.getElementById('cmDetailContent').style.display = '';
        document.querySelector('.cm-detail-empty').style.display = 'none';

        // Header
        document.getElementById('cmDetailTitle').textContent = node.type === 'citation' ? 'Citation' : 'Claim';
        document.getElementById('cmDetailVerdict').textContent = node.verdict || '-';
        document.getElementById('cmDetailVerdict').className = `cm-badge cm-badge-${(node.verdict || 'uncertain').toLowerCase()}`;
        document.getElementById('cmDetailRisk').textContent = node.riskLevel || '-';
        document.getElementById('cmDetailRisk').className = `cm-badge cm-badge-risk-${node.riskLevel || 'medium'}`;
        document.getElementById('cmDetailCategory').textContent = node.category || '-';
        document.getElementById('cmDetailCategory').className = `cm-badge`;

        // Pin state
        const pinBtn = document.getElementById('cmPinBtn');
        pinBtn.classList.toggle('pinned', !!node.pinned);

        // Full text
        document.getElementById('cmDetailFullText').textContent = node.fullText || node.label;

        // Toulmin structure
        this.cmRenderToulmin(node);

        // Evidence
        this.cmRenderEvidence(nodeId);

        // Profile radar
        this.cmRenderProfileRadar(node);

        // Notes
        document.getElementById('cmNoteInput').value = node.userNote || '';
        document.getElementById('cmOverrideSelect').value = node.overrideLabel || '';

        // Scroll text view to span
        this.cmScrollToSpan(nodeId);
    }

    /**
     * Render empty detail panel
     */
    cmRenderDetailEmpty() {
        document.getElementById('cmDetailContent').style.display = 'none';
        document.querySelector('.cm-detail-empty').style.display = '';
    }

    /**
     * Render Toulmin structure cards
     */
    cmRenderToulmin(node) {
        const container = document.getElementById('cmToulminCards');
        if (!container) return;

        const toulmin = node.toulminJson;
        if (!toulmin) {
            container.innerHTML = '<p class="cm-empty-hint" style="font-size:0.8rem;color:#888;">No Toulmin analysis available</p>';
            return;
        }

        const roles = ['grounds', 'warrant', 'backing', 'qualification', 'rebuttal'];
        container.innerHTML = roles.map(role => {
            const value = toulmin[role];
            if (!value || (Array.isArray(value) && value.length === 0)) return '';
            const content = Array.isArray(value) ? value.join('; ') : value;
            return `<div class="cm-toulmin-card" data-role="${role}">
                <div class="cm-toulmin-card-type">${role}</div>
                <div>${this.escapeHtml(content)}</div>
            </div>`;
        }).join('');
    }

    /**
     * Render evidence matches for selected node
     */
    cmRenderEvidence(nodeId) {
        const container = document.getElementById('cmEvidenceList');
        if (!container) return;

        // Find edges from this node to evidence/citation
        const edges = (this.cmState.data?.links || []).filter(
            e => e.source === nodeId || (e.source?.id === nodeId)
        );

        if (edges.length === 0) {
            container.innerHTML = '<p class="cm-empty-hint" style="font-size:0.8rem;color:#888;">No evidence links. Enable corpus verification to find supporting evidence.</p>';
            return;
        }

        container.innerHTML = edges.map(edge => {
            const targetId = typeof edge.target === 'string' ? edge.target : edge.target?.id;
            const targetNode = this.cmState.data?.nodes?.find(n => n.id === targetId);
            const prov = edge.provenance || {};
            const hasCorpusData = prov.relevanceScore !== undefined || prov.entailmentScore !== undefined;

            let provHtml = '';
            if (prov.matchMethod) {
                provHtml += `<div class="cm-provenance">Method: <strong>${this.escapeHtml(prov.matchMethod)}</strong>`;
                if (prov.topKRank !== undefined) provHtml += ` | Rank: #${prov.topKRank + 1}`;
                provHtml += ` | Confidence: ${(prov.confidence || 0).toFixed(2)}`;
                provHtml += '</div>';
            }

            let scoresHtml = '';
            if (hasCorpusData) {
                const relPct = ((prov.relevanceScore || edge.strength || 0) * 100).toFixed(0);
                const entPct = ((prov.entailmentScore || 0) * 100).toFixed(0);
                scoresHtml = `<div class="cm-evidence-scores">
                    <div style="font-size:0.65rem;color:#90a4ae;width:65px;">Relevance</div>
                    <div class="cm-evidence-score-bar"><div class="cm-evidence-score-fill relevance" style="width:${relPct}%"></div></div>
                    <span style="font-size:0.65rem;color:#aaa;width:30px;text-align:right;">${relPct}%</span>
                </div>
                <div class="cm-evidence-scores">
                    <div style="font-size:0.65rem;color:#90a4ae;width:65px;">Entailment</div>
                    <div class="cm-evidence-score-bar"><div class="cm-evidence-score-fill entailment" style="width:${entPct}%"></div></div>
                    <span style="font-size:0.65rem;color:#aaa;width:30px;text-align:right;">${entPct}%</span>
                </div>`;
            } else {
                scoresHtml = `<div class="cm-evidence-scores">
                    <div class="cm-evidence-score-bar"><div class="cm-evidence-score-fill relevance" style="width:${(edge.strength || 0) * 100}%"></div></div>
                </div>`;
            }

            // Show matching snippet if available
            let snippetHtml = '';
            if (prov.matchingSnippet) {
                const snippet = prov.matchingSnippet.length > 200
                    ? prov.matchingSnippet.slice(0, 197) + '...'
                    : prov.matchingSnippet;
                snippetHtml = `<div style="margin-top:4px;padding:4px 8px;background:rgba(124,77,255,0.06);border-radius:3px;font-size:0.75rem;color:#bbb;font-style:italic;">"${this.escapeHtml(snippet)}"</div>`;
            }

            return `<div class="cm-evidence-item">
                <div><strong>${this.escapeHtml(edge.type)}</strong>: ${this.escapeHtml(targetNode?.label || targetId)}</div>
                ${provHtml}
                ${scoresHtml}
                ${snippetHtml}
            </div>`;
        }).join('');
    }

    /**
     * Render claim profile radar chart
     */
    cmRenderProfileRadar(node) {
        const canvas = document.getElementById('cmProfileRadar');
        if (!canvas) return;
        if (this.cmState.profileChart) this.cmState.profileChart.destroy();

        const profile = node.profileJson?.confidence;
        if (!profile) {
            canvas.style.display = 'none';
            return;
        }
        canvas.style.display = '';

        const labels = ['Attribution', 'Assertion', 'Structure', 'Modality', 'Epistemic Force'];
        const values = [profile.attribution || 0, profile.assertion || 0, profile.structure || 0, profile.modality || 0, profile.epistemicForce || 0];

        this.cmState.profileChart = new Chart(canvas.getContext('2d'), {
            type: 'polarArea',
            data: {
                labels,
                datasets: [{
                    data: values,
                    backgroundColor: ['rgba(124,77,255,0.4)', 'rgba(0,188,212,0.4)', 'rgba(255,152,0,0.4)', 'rgba(233,30,99,0.4)', 'rgba(76,175,80,0.4)'],
                    borderColor: ['#7c4dff', '#00bcd4', '#ff9800', '#e91e63', '#4caf50'],
                    borderWidth: 1,
                }],
            },
            options: {
                responsive: false,
                plugins: { legend: { display: false } },
                scales: { r: { max: 1, beginAtZero: true, ticks: { display: false } } },
            },
        });
    }

    /**
     * Scroll annotated text to a claim span
     */
    cmScrollToSpan(nodeId) {
        const span = document.querySelector(`.cm-claim-span[data-node-id="${nodeId}"]`);
        if (span) {
            document.querySelectorAll('.cm-claim-span').forEach(m => m.classList.remove('cm-selected'));
            span.classList.add('cm-selected');
            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    /**
     * Highlight search matches in annotated text
     */
    cmHighlightSearch() {
        // Search highlighting is handled via the table filter for now
    }

    /**
     * Save note and override for selected node
     */
    async cmSaveNote() {
        const nodeId = this.cmState.selectedNodeId;
        const jobId = this.cmState.currentJobId;
        if (!nodeId || !jobId) return;

        const userNote = document.getElementById('cmNoteInput').value;
        const overrideLabel = document.getElementById('cmOverrideSelect').value || null;

        try {
            await fetch(`/api/claim-map/node/${jobId}/${nodeId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userNote, overrideLabel }),
            });

            // Update local state
            const node = this.cmState.data?.nodes?.find(n => n.id === nodeId);
            if (node) { node.userNote = userNote; node.overrideLabel = overrideLabel; }

            this.toastInfo('Saved', 'Note updated');
        } catch (error) {
            this.toastError('Error', 'Failed to save note');
        }
    }

    /**
     * Toggle pin state for selected node
     */
    async cmTogglePin() {
        const nodeId = this.cmState.selectedNodeId;
        const jobId = this.cmState.currentJobId;
        if (!nodeId || !jobId) return;

        const node = this.cmState.data?.nodes?.find(n => n.id === nodeId);
        const newPinned = !(node?.pinned);

        try {
            await fetch(`/api/claim-map/node/${jobId}/${nodeId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pinned: newPinned }),
            });
            if (node) node.pinned = newPinned;
            document.getElementById('cmPinBtn')?.classList.toggle('pinned', newPinned);
        } catch (error) {
            this.toastError('Error', 'Failed to update pin');
        }
    }

    /**
     * Run analysis on new text
     */
    async cmRunAnalysis() {
        const text = document.getElementById('cmAnalyzeText')?.value;
        if (!text) { this.toastError('Error', 'Please enter text to analyze'); return; }

        const useCorpus = document.getElementById('cmAnalyzeCorpus')?.checked || false;
        document.getElementById('cmAnalyzeDialog').style.display = 'none';

        const msg = useCorpus
            ? 'Running claim detection + corpus verification (this may take a moment)...'
            : 'Running claim detection pipeline...';
        this.toastInfo('Analyzing', msg);

        try {
            const resp = await fetch('/api/claim-map/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, settings: { useCorpus } }),
            });
            const data = await resp.json();

            // Poll for completion
            this.cmPollJob(data.jobId);
        } catch (error) {
            this.toastError('Error', 'Failed to start analysis');
        }
    }

    /**
     * Poll a running job until complete
     */
    cmPollJob(jobId) {
        const poll = async () => {
            try {
                const resp = await fetch(`/api/claim-map/data/${jobId}`);
                if (resp.ok) {
                    const data = await resp.json();
                    if (data.job?.status === 'complete' || data.job?.status === 'failed') {
                        await this.cmFetchJobs();
                        this.cmLoadJob(jobId);
                        this.toastInfo('Complete', `Analysis finished: ${data.stats?.totalClaims || 0} claims detected`);
                        return;
                    }
                }
                setTimeout(poll, 1500);
            } catch {
                setTimeout(poll, 2000);
            }
        };
        setTimeout(poll, 1000);
    }

    /**
     * Analyze claims from God Write output
     */
    async cmAnalyzeFromGodWrite() {
        const outputEl = document.getElementById('gwOutputRendered');
        if (!outputEl || !outputEl.textContent?.trim()) {
            this.toastError('Error', 'No God Write output to analyze');
            return;
        }

        const text = outputEl.textContent.trim();
        this.toastInfo('Analyzing', 'Running claim detection on God Write output...');

        try {
            const resp = await fetch('/api/claim-map/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            const data = await resp.json();

            // Switch to claim map tab
            const cmTabBtn = document.querySelector('[data-tab="claim-map"]');
            if (cmTabBtn) cmTabBtn.click();

            this.cmPollJob(data.jobId);
        } catch (error) {
            this.toastError('Error', 'Failed to start analysis');
        }
    }

    /**
     * Run comparison between two jobs
     */
    async cmRunComparison(jobA, jobB) {
        try {
            const resp = await fetch(`/api/claim-map/compare/${jobA}/${jobB}`);
            const data = await resp.json();
            this.cmState.compareData = data;

            const badges = document.getElementById('cmComparisonBadges');
            if (badges) {
                badges.style.display = 'flex';
                const s = data.summary;
                badges.innerHTML = [
                    s.claimsDelta !== 0 ? `<span class="cm-delta-badge ${s.claimsDelta > 0 ? 'cm-delta-positive' : 'cm-delta-negative'}">${s.claimsDelta > 0 ? '+' : ''}${s.claimsDelta} claims</span>` : '',
                    s.unsupportedDelta !== 0 ? `<span class="cm-delta-badge ${s.unsupportedDelta < 0 ? 'cm-delta-positive' : 'cm-delta-negative'}">${s.unsupportedDelta > 0 ? '+' : ''}${s.unsupportedDelta} unsupported</span>` : '',
                    s.verdictChangedCount > 0 ? `<span class="cm-delta-badge cm-delta-neutral">${s.verdictChangedCount} verdict changes</span>` : '',
                ].filter(Boolean).join('');
            }
        } catch (error) {
            this.toastError('Error', 'Comparison failed');
        }
    }

    /**
     * Export claim map
     */
    async cmExport() {
        if (!this.cmState.currentJobId) return;

        try {
            const resp = await fetch(`/api/claim-map/export/${this.cmState.currentJobId}?format=csv`);
            const blob = await resp.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `claim-map-${this.cmState.currentJobId}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            this.toastError('Error', 'Export failed');
        }
    }

    // ===========================================================================
    // CLAIM MAP GRAPH VISUALIZATION (Phase D1)
    // ===========================================================================

    /**
     * Render D3 claim map graph with multiple layout modes
     */
    cmRenderGraph(data) {
        const container = document.getElementById('cmGraphContainer');
        if (!container || !data || typeof d3 === 'undefined') return;

        // Remove existing SVG (keep controls)
        const existingSvg = container.querySelector('svg');
        if (existingSvg) existingSvg.remove();

        const width = container.clientWidth || 800;
        const height = container.clientHeight || 500;
        const layout = this.cmState.graphLayout;
        const colorMode = this.cmState.colorMode;
        const showUnsupportedOnly = document.getElementById('cmShowUnsupported')?.checked;

        // Filter nodes
        let nodes = [...data.nodes];
        if (showUnsupportedOnly) {
            const unsupportedIds = new Set(
                nodes.filter(n => n.verdict === 'UNSUPPORTED' || n.verdict === 'CONTRADICTED').map(n => n.id)
            );
            nodes = nodes.filter(n => unsupportedIds.has(n.id) || n.type === 'citation' || n.type === 'evidence');
        }

        const nodeIds = new Set(nodes.map(n => n.id));
        let links = data.links.filter(l => {
            const sid = typeof l.source === 'string' ? l.source : l.source?.id;
            const tid = typeof l.target === 'string' ? l.target : l.target?.id;
            return nodeIds.has(sid) && nodeIds.has(tid);
        });

        // Compute layout positions
        this.cmComputeLayout(nodes, links, layout, width, height);

        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        // Stripe pattern for unsupported nodes
        const defs = svg.append('defs');
        const pattern = defs.append('pattern')
            .attr('id', 'cm-stripe-pattern')
            .attr('width', 8).attr('height', 8)
            .attr('patternUnits', 'userSpaceOnUse')
            .attr('patternTransform', 'rotate(45)');
        pattern.append('rect').attr('width', 8).attr('height', 8).attr('fill', '#ff6b6b').attr('opacity', 0.15);
        pattern.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 8)
            .attr('stroke', '#ff6b6b').attr('stroke-width', 3).attr('opacity', 0.3);

        // Arrow markers
        ['grounds', 'warrant', 'backing', 'rebuttal', 'dependency', 'citation'].forEach(type => {
            const colors = { grounds: '#00c853', warrant: '#448aff', backing: '#90a4ae', rebuttal: '#ff1744', dependency: '#666', citation: '#448aff' };
            defs.append('marker')
                .attr('id', `cm-arrow-${type}`)
                .attr('viewBox', '0 0 10 10')
                .attr('refX', 20).attr('refY', 5)
                .attr('markerWidth', 6).attr('markerHeight', 6)
                .attr('orient', 'auto')
                .append('path')
                .attr('d', 'M0,0 L10,5 L0,10 Z')
                .attr('fill', colors[type] || '#666');
        });

        const g = svg.append('g');

        // Zoom behavior
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => g.attr('transform', event.transform));
        svg.call(zoom);

        // Zoom controls
        document.getElementById('cmGraphZoomIn')?.addEventListener('click', () => svg.transition().call(zoom.scaleBy, 1.3));
        document.getElementById('cmGraphZoomOut')?.addEventListener('click', () => svg.transition().call(zoom.scaleBy, 0.7));
        document.getElementById('cmGraphReset')?.addEventListener('click', () => svg.transition().call(zoom.transform, d3.zoomIdentity));

        // Draw edges
        const linkG = g.append('g').attr('class', 'cm-links');
        const edgeSelection = linkG.selectAll('line')
            .data(links)
            .enter().append('line')
            .attr('class', d => `cm-edge cm-edge-${d.type}`)
            .attr('marker-end', d => `url(#cm-arrow-${d.type})`)
            .attr('x1', d => { const n = nodes.find(n => n.id === (typeof d.source === 'string' ? d.source : d.source?.id)); return n?.x || 0; })
            .attr('y1', d => { const n = nodes.find(n => n.id === (typeof d.source === 'string' ? d.source : d.source?.id)); return n?.y || 0; })
            .attr('x2', d => { const n = nodes.find(n => n.id === (typeof d.target === 'string' ? d.target : d.target?.id)); return n?.x || 0; })
            .attr('y2', d => { const n = nodes.find(n => n.id === (typeof d.target === 'string' ? d.target : d.target?.id)); return n?.y || 0; });

        // Draw nodes
        const nodeG = g.append('g').attr('class', 'cm-nodes');
        const nodeSelection = nodeG.selectAll('g')
            .data(nodes)
            .enter().append('g')
            .attr('class', 'cm-node')
            .attr('transform', d => `translate(${d.x},${d.y})`);

        // Node shapes by type
        nodeSelection.each(function(d) {
            const el = d3.select(this);
            const fillColor = getCmNodeColor(d, colorMode);

            switch (d.type) {
                case 'thesis':
                    el.append('path')
                        .attr('d', d3.symbol().type(d3.symbolDiamond).size(400)())
                        .attr('fill', fillColor);
                    break;
                case 'section-claim':
                    el.append('circle').attr('r', 10).attr('fill', fillColor);
                    break;
                case 'sub-claim':
                    el.append('circle').attr('r', 7).attr('fill', fillColor);
                    break;
                case 'evidence':
                    el.append('rect').attr('x', -12).attr('y', -8).attr('width', 24).attr('height', 16)
                        .attr('rx', 3).attr('fill', fillColor);
                    break;
                case 'citation':
                    el.append('rect').attr('x', -16).attr('y', -8).attr('width', 32).attr('height', 16)
                        .attr('rx', 8).attr('fill', fillColor);
                    break;
                default:
                    el.append('circle').attr('r', 6).attr('fill', fillColor);
            }

            // Unsupported striped overlay
            if (d.verdict === 'UNSUPPORTED' || d.verdict === 'CONTRADICTED') {
                el.append('circle').attr('r', 9).attr('class', 'cm-unsupported-pattern');
                el.append('text').attr('class', 'cm-unsupported-icon').attr('x', 10).attr('y', -8).text('\u26A0');
            }
        });

        // Node labels
        nodeSelection.append('text')
            .attr('class', 'cm-node-label')
            .attr('dx', 14)
            .attr('dy', '.35em')
            .text(d => (d.label || '').substring(0, 25));

        // Tooltip
        nodeSelection.append('title')
            .text(d => `${d.type}: ${d.label}\nVerdict: ${d.verdict || '-'}\nRisk: ${d.riskLevel || '-'}`);

        // Click handler
        nodeSelection.on('click', (event, d) => {
            this.cmSelectNode(d.id);

            // Neighborhood focus: highlight 1-hop
            const connectedIds = new Set([d.id]);
            links.forEach(l => {
                const sid = typeof l.source === 'string' ? l.source : l.source?.id;
                const tid = typeof l.target === 'string' ? l.target : l.target?.id;
                if (sid === d.id) connectedIds.add(tid);
                if (tid === d.id) connectedIds.add(sid);
            });
            nodeSelection.classed('cm-dimmed', n => !connectedIds.has(n.id));
            nodeSelection.classed('cm-highlighted', n => n.id === d.id);
            edgeSelection.attr('opacity', l => {
                const sid = typeof l.source === 'string' ? l.source : l.source?.id;
                const tid = typeof l.target === 'string' ? l.target : l.target?.id;
                return connectedIds.has(sid) && connectedIds.has(tid) ? 1 : 0.1;
            });
        });

        // Double-click to reset focus
        svg.on('dblclick', () => {
            nodeSelection.classed('cm-dimmed', false).classed('cm-highlighted', false);
            edgeSelection.attr('opacity', 1);
        });

        // Force simulation (only for force layout)
        if (layout === 'force') {
            const simulation = d3.forceSimulation(nodes)
                .force('link', d3.forceLink(links).id(d => d.id).distance(80))
                .force('charge', d3.forceManyBody().strength(-200))
                .force('center', d3.forceCenter(width / 2, height / 2))
                .on('tick', () => {
                    edgeSelection
                        .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
                        .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
                    nodeSelection.attr('transform', d => `translate(${d.x},${d.y})`);
                });

            // Drag behavior
            nodeSelection.call(d3.drag()
                .on('start', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0.3).restart();
                    d.fx = d.x; d.fy = d.y;
                })
                .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
                .on('end', (event, d) => {
                    if (!event.active) simulation.alphaTarget(0);
                    d.fx = null; d.fy = null;
                }));
        }
    }

    /**
     * Compute layout positions for nodes
     */
    cmComputeLayout(nodes, links, layout, width, height) {
        const margin = 60;

        switch (layout) {
            case 'toulmin': {
                // Columnar L→R by type
                const columns = {
                    'thesis': margin,
                    'section-claim': width * 0.25,
                    'sub-claim': width * 0.25,
                    'evidence': width * 0.6,
                    'citation': width * 0.85,
                };
                const yCounters = {};
                nodes.forEach(n => {
                    const col = columns[n.type] || width * 0.25;
                    yCounters[n.type] = (yCounters[n.type] || 0) + 1;
                    n.x = col;
                    n.y = margin + yCounters[n.type] * 50;
                });
                break;
            }
            case 'hierarchy': {
                // Top-down by depth: thesis=0, section-claim=1, sub-claim=2, evidence/citation=3
                const depths = { 'thesis': 0, 'section-claim': 1, 'sub-claim': 2, 'evidence': 3, 'citation': 3 };
                const levelCounters = {};
                nodes.forEach(n => {
                    const depth = depths[n.type] ?? 2;
                    levelCounters[depth] = (levelCounters[depth] || 0) + 1;
                    n.y = margin + depth * (height - 2 * margin) / 3;
                    n.x = margin + levelCounters[depth] * Math.min(80, (width - 2 * margin) / (nodes.length / 3));
                });
                break;
            }
            case 'radial': {
                // Claims in center, evidence/citations radiating out
                const center = { x: width / 2, y: height / 2 };
                const claimNodes = nodes.filter(n => n.type !== 'citation' && n.type !== 'evidence');
                const otherNodes = nodes.filter(n => n.type === 'citation' || n.type === 'evidence');

                claimNodes.forEach((n, i) => {
                    const angle = (2 * Math.PI * i) / Math.max(claimNodes.length, 1);
                    const r = 100;
                    n.x = center.x + r * Math.cos(angle);
                    n.y = center.y + r * Math.sin(angle);
                });
                otherNodes.forEach((n, i) => {
                    const angle = (2 * Math.PI * i) / Math.max(otherNodes.length, 1);
                    const r = 220;
                    n.x = center.x + r * Math.cos(angle);
                    n.y = center.y + r * Math.sin(angle);
                });
                break;
            }
            case 'force':
            default: {
                // Initial positions for force sim
                nodes.forEach((n, i) => {
                    n.x = width / 2 + (Math.random() - 0.5) * 200;
                    n.y = height / 2 + (Math.random() - 0.5) * 200;
                });
                break;
            }
        }
    }
}

/**
 * Get node fill color based on color mode
 */
function getCmNodeColor(node, colorMode) {
    const verdictColors = {
        SUPPORTED: '#00c853', PARTIALLY_SUPPORTED: '#ffc107',
        UNSUPPORTED: '#ff6b6b', CONTRADICTED: '#ff1744',
        UNCERTAIN: '#90a4ae', BLOCKED: '#78909c',
    };
    const riskColors = { high: '#ff1744', medium: '#ffc107', low: '#00c853', minimal: '#69f0ae' };
    const categoryColors = {
        attributional: '#7c4dff', ontological: '#00bcd4',
        structural: '#ff9800', temporal: '#e91e63',
        comparative: '#4caf50', metadiscursive: '#9e9e9e',
    };

    switch (colorMode) {
        case 'verdict': return verdictColors[node.verdict] || '#666';
        case 'risk': return riskColors[node.riskLevel] || '#666';
        case 'category': return categoryColors[node.category] || '#666';
        case 'completeness': {
            const c = node.toulminCompleteness || 0;
            return c > 0.7 ? '#00c853' : c > 0.4 ? '#ffc107' : '#ff6b6b';
        }
        default: return '#666';
    }
}

// Expose DashboardApp globally for testing
if (typeof window !== 'undefined') {
    window.DashboardApp = DashboardApp;
}

// Initialize dashboard on load
document.addEventListener('DOMContentLoaded', () => {
    const app = new DashboardApp();
    app.init();
});
