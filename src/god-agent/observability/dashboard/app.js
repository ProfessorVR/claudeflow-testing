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

        // Metrics
        this.ucmMetrics = {};
        this.idescMetrics = {};
        this.episodeMetrics = {};
        this.hyperedgeMetrics = {};
        this.tokenMetrics = {};
        this.daemonMetrics = {};
        this.registryMetrics = { total: 264, categories: 30 };
        this.learningMetrics = { trajectories: {}, patterns: {} };

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
    }

    /**
     * Initialize the dashboard
     */
    async init() {
        this.loadUIState();
        this.setupMainTabs();
        this.setupSidebar();
        this.setupCommandBar();
        this.setupThemeToggle();
        this.setupKeyboardShortcuts();
        this.setupPanelToggles();
        this.setupEventListeners();
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
     * Load data for a specific tab
     */
    async loadTabData(tabId) {
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
                this.loadInteractionStore();
                break;
            case 'activity':
                this.renderActivities();
                break;
        }
    }

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
        const commandOutput = document.getElementById('commandOutput');
        const commandBarToggle = document.getElementById('commandBarToggle');
        const commandBar = document.querySelector('.command-bar');

        if (commandBarToggle && commandBar) {
            commandBarToggle.addEventListener('click', () => {
                commandBar.classList.toggle('expanded');
                if (commandBar.classList.contains('expanded')) {
                    commandInput?.focus();
                }
            });
        }

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
                    commandBar?.classList.remove('expanded');
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
     * Execute a command
     */
    async executeCommand(command) {
        if (!command) return;

        const commandInput = document.getElementById('commandInput');
        const commandOutput = document.getElementById('commandOutput');

        // Add to history
        this.commandHistory.push(command);
        this.commandHistoryIndex = -1;
        this.saveUIState();

        // Clear input
        if (commandInput) commandInput.value = '';

        // Show executing message
        if (commandOutput) {
            commandOutput.textContent = `> ${command}\nExecuting...\n`;
        }

        try {
            const res = await fetch('/api/command', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ command })
            });

            const data = await res.json();

            if (commandOutput) {
                commandOutput.textContent = `> ${command}\n${data.output || data.error || 'No output'}`;
                commandOutput.scrollTop = commandOutput.scrollHeight;
            }
        } catch (error) {
            if (commandOutput) {
                commandOutput.textContent = `> ${command}\nError: ${error.message}`;
            }
        }
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
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+K or Cmd+K to focus command bar
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                const commandBar = document.querySelector('.command-bar');
                const commandInput = document.getElementById('commandInput');
                commandBar?.classList.add('expanded');
                commandInput?.focus();
            }

            // 1-5 for tab switching
            if (e.altKey && e.key >= '1' && e.key <= '5') {
                e.preventDefault();
                const tabs = ['analytics', 'monitoring', 'router', 'memory', 'activity'];
                const tabIndex = parseInt(e.key) - 1;
                if (tabIndex < tabs.length) {
                    this.switchMainTab(tabs[tabIndex]);
                }
            }

            // Escape to close command bar
            if (e.key === 'Escape') {
                const commandBar = document.querySelector('.command-bar');
                commandBar?.classList.remove('expanded');
            }
        });
    }

    /**
     * Setup panel visibility toggles
     */
    setupPanelToggles() {
        const panelToggles = document.querySelectorAll('.panel-toggle');

        panelToggles.forEach(toggle => {
            const panelId = toggle.dataset.panel;

            // Load saved state
            const isHidden = localStorage.getItem(`panel-${panelId}`) === 'hidden';
            toggle.checked = !isHidden;

            if (isHidden) {
                const panel = document.getElementById(panelId);
                panel?.classList.add('hidden');
            }

            toggle.addEventListener('change', () => {
                const panel = document.getElementById(panelId);
                if (toggle.checked) {
                    panel?.classList.remove('hidden');
                    localStorage.removeItem(`panel-${panelId}`);
                } else {
                    panel?.classList.add('hidden');
                    localStorage.setItem(`panel-${panelId}`, 'hidden');
                }
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
            const [circuitsRes, rateLimitsRes, degradationRes, experimentsRes] = await Promise.all([
                fetch('/api/router/circuits'),
                fetch('/api/router/ratelimits'),
                fetch('/api/router/degradation'),
                fetch('/api/router/experiments')
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
     * Start periodic polling for agents and pipelines
     */
    startPolling() {
        this.pollingInterval = setInterval(async () => {
            await this.refreshAgentsAndPipelines();

            // Refresh current tab data
            if (this.currentMainTab === 'analytics') {
                await this.loadAnalyticsData();
            } else if (this.currentMainTab === 'monitoring') {
                await this.loadMonitoringData();
            } else if (this.currentMainTab === 'router') {
                await this.loadRouterData();
            }
        }, 5000);
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

        if (dot) dot.className = `status-dot ${status}`;

        if (text) {
            switch (status) {
                case 'connected':
                    text.textContent = 'Connected';
                    break;
                case 'connecting':
                    text.textContent = 'Connecting...';
                    break;
                case 'disconnected':
                    text.textContent = 'Disconnected';
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

            return `
                <li class="pipeline-item">
                    <div class="pipeline-name">${type}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="pipeline-stats">${pipeline.completedSteps} / ${pipeline.totalSteps} steps</div>
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

    /**
     * XSS prevention: Escape HTML special characters
     */
    escapeHtml(text) {
        if (typeof text !== 'string') return String(text);
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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
