/**
 * ICP Dashboard Panels — Interactive Composition Pipeline UI
 *
 * Self-contained module that adds ICP functionality to the dashboard.
 * Panels: Prompt, Evidence Workbench, Binding Builder,
 * Stress Test Console, Paragraph Planner, Evidence Heatmap,
 * Corpus Diff, Facet Editor, Export.
 */

// =============================================================================
// STATE
// =============================================================================

const icpState = {
  currentSessionId: null,
  sessions: [],
  activePanel: 'prompt',
  session: null,
  refreshInterval: null,
  creating: false,
  pipelineStages: null,
};

// =============================================================================
// API HELPERS
// =============================================================================

async function icpFetch(path, options = {}) {
  const resp = await fetch(`/api/icp${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: resp.statusText }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  return resp.json();
}

async function icpPost(path, body) {
  return icpFetch(path, { method: 'POST', body: JSON.stringify(body) });
}

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initialize the ICP tab in the dashboard.
 * Call this from app.js when ICP tab is activated.
 */
function initICPPanel(container) {
  container.innerHTML = `
    <div class="icp-root">
      <div class="icp-header">
        <h2>Interactive Composition Pipeline</h2>
        <div class="icp-session-controls">
          <select id="icp-session-select" onchange="icpSelectSession(this.value)">
            <option value="">Select session...</option>
          </select>
          <button onclick="icpSwitchPanel('prompt')" class="btn btn-primary">New Session</button>
          <button onclick="icpRefreshSession()" class="btn btn-secondary">Refresh</button>
        </div>
      </div>

      <div class="icp-nav">
        <button class="icp-nav-btn active" data-panel="prompt" onclick="icpSwitchPanel('prompt')">Prompt</button>
        <button class="icp-nav-btn" data-panel="evidence" onclick="icpSwitchPanel('evidence')">Evidence</button>
        <button class="icp-nav-btn" data-panel="binding" onclick="icpSwitchPanel('binding')">Binding</button>
        <button class="icp-nav-btn" data-panel="stress" onclick="icpSwitchPanel('stress')">Stress Test</button>
        <button class="icp-nav-btn" data-panel="planner" onclick="icpSwitchPanel('planner')">Planner</button>
        <button class="icp-nav-btn" data-panel="heatmap" onclick="icpSwitchPanel('heatmap')">Heatmap</button>
        <button class="icp-nav-btn" data-panel="diff" onclick="icpSwitchPanel('diff')">Corpus Diff</button>
        <button class="icp-nav-btn" data-panel="facets" onclick="icpSwitchPanel('facets')">Facets</button>
        <button class="icp-nav-btn" data-panel="quality" onclick="icpSwitchPanel('quality')">Quality</button>
        <button class="icp-nav-btn" data-panel="export" onclick="icpSwitchPanel('export')">Export</button>
        <button class="icp-nav-btn" data-panel="events" onclick="icpSwitchPanel('events')">Events</button>
      </div>

      <div id="icp-panel-content" class="icp-panel-content">
      </div>
    </div>
  `;

  loadICPSessions();
  // Render the Prompt panel immediately (no session needed)
  icpSwitchPanel('prompt');
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

async function loadICPSessions() {
  try {
    const data = await icpFetch('/sessions');
    icpState.sessions = data.sessions || [];

    const select = document.getElementById('icp-session-select');
    if (!select) return;

    select.innerHTML = '<option value="">Select session...</option>';
    icpState.sessions.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.sessionId;
      opt.textContent = `${s.sessionId.slice(0, 8)}... (${s.quoteCount} quotes, ${s.atomCount} atoms)`;
      if (s.sessionId === icpState.currentSessionId) opt.selected = true;
      select.appendChild(opt);
    });
  } catch (err) {
    console.warn('Failed to load ICP sessions:', err.message);
  }
}

async function icpSelectSession(sessionId) {
  if (!sessionId) return;
  icpState.currentSessionId = sessionId;

  try {
    const data = await icpFetch(`/session/${sessionId}`);
    icpState.session = data.session;
    icpSwitchPanel(icpState.activePanel);
  } catch (err) {
    showICPError('Failed to load session: ' + err.message);
  }
}

async function icpCreateSession() {
  if (icpState.creating) return;

  const promptEl = document.getElementById('icp-prompt-input');
  const prompt = promptEl?.value?.trim();
  if (!prompt) {
    showICPError('Enter a research prompt before running.');
    return;
  }

  // Read optional source scope settings from the form
  const modeEl = document.getElementById('icp-source-mode');
  const mode = modeEl?.value || 'corpus';
  const minRelEl = document.getElementById('icp-min-relevance');
  const minRelevance = minRelEl ? parseFloat(minRelEl.value) || 0.5 : 0.5;
  const maxChunksEl = document.getElementById('icp-max-chunks');
  const maxChunks = maxChunksEl ? parseInt(maxChunksEl.value) || 20 : 20;

  const sourceScope = {
    mode,
    corpus_config: { collections: [], min_relevance: minRelevance, max_chunks: maxChunks },
    doc_authority_policy: { version: '1.0.0', tiers: { peer_reviewed_journal: 1, edited_volume_chapter: 2, monograph: 2, web_source: 4 } },
  };

  const styleEl = document.getElementById('icp-style-profile');
  const styleProfileId = styleEl?.value || undefined;

  const corpusFolderEl = document.getElementById('icp-corpus-folder');
  const corpusFolder = corpusFolderEl?.value || undefined;
  const draftCategoryEl = document.getElementById('icp-draft-category');
  const draftCategory = draftCategoryEl?.value || undefined;
  const wordCountEl = document.getElementById('icp-word-count');
  const desiredWordCount = wordCountEl?.value || undefined;

  icpState.creating = true;
  icpState.pipelineStages = null;
  const runBtn = document.getElementById('icp-run-btn');
  const statusEl = document.getElementById('icp-pipeline-status');
  if (runBtn) { runBtn.disabled = true; runBtn.textContent = 'Running pipeline...'; }
  if (statusEl) { statusEl.innerHTML = '<span class="pipeline-running">Decomposing prompt, retrieving evidence, verifying quotes...</span>'; }

  try {
    const data = await icpPost('/session', { prompt, sourceScope, styleProfileId, corpusFolder, draftCategory, desiredWordCount });
    icpState.currentSessionId = data.sessionId;
    icpState.session = data.session;
    icpState.pipelineStages = data.pipeline_stages || null;
    await loadICPSessions();
    icpSwitchPanel('evidence');
  } catch (err) {
    showICPError('Failed to create session: ' + err.message);
  } finally {
    icpState.creating = false;
    if (runBtn) { runBtn.disabled = false; runBtn.textContent = 'Run Pipeline'; }
    if (statusEl) { statusEl.innerHTML = ''; }
  }
}

// =============================================================================
// PANEL 0: PROMPT
// =============================================================================

function renderPromptPanel(container) {
  const session = icpState.session;
  const existingPrompt = session?.prompt_spec?.original_prompt || '';

  container.innerHTML = `
    <div class="icp-prompt-panel">
      <h3>Research Prompt</h3>
      <p class="icp-prompt-desc">Define your research question below, configure source settings, and run the pipeline to generate evidence-first prose.</p>

      <div class="icp-prompt-form">
        <label for="icp-prompt-input" class="icp-tip" data-tip="The research question or topic that drives evidence retrieval and prose generation.">Prompt</label>
        <textarea id="icp-prompt-input" class="icp-prompt-textarea" rows="6"
                  placeholder="e.g., Analyze the role of phantasia in Aristotle's De Anima, focusing on its relationship to perception, imagination, and practical reasoning."
        >${existingPrompt ? escapeHtml(existingPrompt) : ''}</textarea>

        <div class="icp-prompt-options">
          <div class="icp-prompt-option">
            <label for="icp-source-mode" class="icp-tip" data-tip="Where evidence is sourced from. Corpus uses only local ingested documents. Hybrid adds external search. External uses web sources only.">Source Mode</label>
            <select id="icp-source-mode">
              <option value="corpus" selected>Corpus (local sources only)</option>
              <option value="hybrid">Hybrid (corpus + external)</option>
              <option value="external">External</option>
            </select>
          </div>
          <div class="icp-prompt-option">
            <label for="icp-min-relevance" class="icp-tip" data-tip="Minimum cosine similarity threshold (0&ndash;1) for retrieved chunks. Higher values return fewer but more relevant results.">Min Relevance</label>
            <input type="number" id="icp-min-relevance" value="0.5" min="0" max="1" step="0.05" />
          </div>
          <div class="icp-prompt-option">
            <label for="icp-max-chunks" class="icp-tip" data-tip="Maximum number of corpus chunks to retrieve per facet. More chunks provide broader evidence but increase processing time.">Max Chunks</label>
            <input type="number" id="icp-max-chunks" value="20" min="1" max="100" step="1" />
          </div>
        </div>

        <div class="icp-prompt-options icp-prompt-options-row2">
          <div class="icp-prompt-option">
            <label for="icp-corpus-folder" class="icp-tip" data-tip="Restrict retrieval to a specific corpus subfolder. Use this to scope evidence to a single topic area (e.g., rhetorical_ontology).">Corpus Folder</label>
            <select id="icp-corpus-folder">
              <option value="">All folders</option>
            </select>
          </div>
          <div class="icp-prompt-option">
            <label for="icp-draft-category" class="icp-tip" data-tip="The type of document to generate. Section produces a focused dissertation section. Chapter generates a full chapter. Paper/Essay/Article follow their respective academic conventions.">Draft Category</label>
            <select id="icp-draft-category">
              <option value="section" selected>Section</option>
              <option value="chapter">Chapter</option>
              <option value="paper">Paper</option>
              <option value="essay">Essay</option>
              <option value="article">Article</option>
              <option value="report">Report</option>
            </select>
          </div>
          <div class="icp-prompt-option">
            <label for="icp-word-count" class="icp-tip" data-tip="Target word count range for the generated draft. Longer outputs include more detail and supporting evidence. Short is best for focused arguments; Comprehensive for full sections.">Word Count</label>
            <select id="icp-word-count">
              <option value="500-1000">Short (500-1,000)</option>
              <option value="1000-2000" selected>Medium (1,000-2,000)</option>
              <option value="2000-4000">Long (2,000-4,000)</option>
              <option value="4000-8000">Comprehensive (4,000-8,000)</option>
            </select>
          </div>
        </div>

        <div class="icp-style-selector">
          <label for="icp-style-profile" class="icp-tip" data-tip="The trained writing style profile applied during generation. Controls sentence length, formality, transitions, passive voice ratio, and citation style.">Style Profile:</label>
          <select id="icp-style-profile">
            <option value="">Active Profile (default)</option>
          </select>
        </div>

        <div class="icp-prompt-actions">
          <button id="icp-run-btn" onclick="icpCreateSession()" class="btn btn-primary btn-run">Run Pipeline</button>
          <div id="icp-pipeline-status" class="icp-pipeline-status"></div>
        </div>
      </div>

      ${session ? `
        <div class="icp-prompt-session-info">
          <h4>Current Session</h4>
          <div class="session-info-grid">
            <span class="session-info-label">ID:</span>
            <span class="session-info-value">${escapeHtml(session.session_id)}</span>
            <span class="session-info-label">Facets:</span>
            <span class="session-info-value">${(session.facets || []).length}</span>
            <span class="session-info-label">Quotes:</span>
            <span class="session-info-value">${(session.quote_spans || []).length}</span>
            <span class="session-info-label">Atoms:</span>
            <span class="session-info-value">${(session.atoms || []).length}</span>
            <span class="session-info-label">Events:</span>
            <span class="session-info-value">${(session.event_log || []).length}</span>
            <span class="session-info-label">Style:</span>
            <span class="session-info-value">${session.style_profile_id || 'none'}</span>
            <span class="session-info-label">Corpus:</span>
            <span class="session-info-value">${session.corpus_folder || 'all'}</span>
            <span class="session-info-label">Category:</span>
            <span class="session-info-value">${session.draft_category || 'section'}</span>
            <span class="session-info-label">Words:</span>
            <span class="session-info-value">${session.desired_word_count || 'default'}</span>
          </div>
          ${icpState.pipelineStages ? `
            <div class="icp-pipeline-results">
              <h5>Pipeline Stages</h5>
              ${icpState.pipelineStages.map(s => `
                <div class="pipeline-stage-row stage-${s.status}">
                  <span class="stage-icon">${s.status === 'completed' ? '\u2713' : s.status === 'failed' ? '\u2717' : '\u2014'}</span>
                  <span class="stage-name">${escapeHtml(s.stage)}</span>
                  <span class="stage-detail">${escapeHtml(s.detail || '')}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}
          <button onclick="icpSwitchPanel('evidence')" class="btn btn-secondary" style="margin-top:12px">View Evidence</button>
        </div>
      ` : ''}
    </div>
  `;

  icpLoadStyleProfiles();
  icpLoadCorpusFolders();
}

async function icpRefreshSession() {
  if (icpState.currentSessionId) {
    await icpSelectSession(icpState.currentSessionId);
  }
}

async function icpLoadStyleProfiles() {
  try {
    const data = await fetch('/api/god-write/profiles').then(r => r.json());
    const select = document.getElementById('icp-style-profile');
    if (!select || !data.profiles) return;
    for (const p of data.profiles) {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name}${p.active ? ' (active)' : ''}`;
      if (p.active) opt.selected = true;
      select.appendChild(opt);
    }
  } catch { /* profiles endpoint unavailable */ }
}

async function icpLoadCorpusFolders() {
  try {
    const data = await icpFetch('/corpus-folders');
    const select = document.getElementById('icp-corpus-folder');
    if (!select || !data.folders) return;
    for (const folder of data.folders) {
      const opt = document.createElement('option');
      opt.value = folder;
      opt.textContent = folder;
      select.appendChild(opt);
    }
  } catch { /* corpus folders endpoint unavailable */ }
}

// =============================================================================
// PANEL SWITCHING
// =============================================================================

function icpSwitchPanel(panel) {
  icpState.activePanel = panel;

  // Update nav buttons
  document.querySelectorAll('.icp-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.panel === panel);
  });

  const content = document.getElementById('icp-panel-content');
  if (!content) return;

  // Prompt panel is always accessible (doesn't need a session)
  if (panel === 'prompt') {
    renderPromptPanel(content);
    return;
  }

  if (!icpState.session) {
    content.innerHTML = '<div class="icp-empty-state">Select or create a session to begin.</div>';
    return;
  }

  const renderers = {
    evidence: renderEvidencePanel,
    binding: renderBindingPanel,
    stress: renderStressPanel,
    planner: renderPlannerPanel,
    heatmap: renderHeatmapPanel,
    diff: renderDiffPanel,
    facets: renderFacetPanel,
    quality: renderQualityPanel,
    export: renderExportPanel,
    events: renderEventsPanel,
  };

  const renderer = renderers[panel];
  if (renderer) {
    renderer(content, icpState.session);
  } else {
    content.innerHTML = `<div class="icp-empty-state">Panel "${escapeHtml(panel)}" not implemented.</div>`;
  }
}

// =============================================================================
// PANEL 1: EVIDENCE WORKBENCH
// =============================================================================

function renderEvidencePanel(container, session) {
  const spans = session.quote_spans || [];
  const facets = session.facets || [];

  const statusColors = {
    auto_verified: '#4caf50',
    human_verified: '#2196f3',
    human_corrected: '#ff9800',
    flagged: '#ff5722',
    auto_rejected: '#f44336',
    rejected: '#9e9e9e',
    stale_verified: '#ffeb3b',
  };

  // Count verification statuses
  const statusCounts = {};
  spans.forEach(s => { statusCounts[s.verification_status] = (statusCounts[s.verification_status] || 0) + 1; });

  // Build pipeline summary banner
  const stages = icpState.pipelineStages;
  const pipelineBanner = stages ? `
    <div class="icp-pipeline-banner">
      ${stages.map(s => `<span class="pipeline-badge badge-${s.status}" title="${escapeHtml(s.detail || '')}">${escapeHtml(s.stage)}: ${s.status}</span>`).join('')}
      <span class="pipeline-summary">${facets.length} facets, ${spans.length} quotes${statusCounts.auto_verified ? ` (${statusCounts.auto_verified} verified)` : ''}</span>
    </div>
  ` : (spans.length > 0 ? `
    <div class="icp-pipeline-banner">
      <span class="pipeline-summary">${facets.length} facets, ${spans.length} quotes${statusCounts.auto_verified ? ` (${statusCounts.auto_verified} verified)` : ''}</span>
    </div>
  ` : '');

  container.innerHTML = `
    ${pipelineBanner}
    <div class="icp-evidence-grid">
      <div class="icp-facet-col">
        <h3>Facets</h3>
        ${facets.length === 0 ? '<p class="muted">No facets yet. Run the pipeline from the Prompt tab.</p>' : ''}
        ${facets.map(f => `
          <div class="icp-facet-card ${f.archived ? 'archived' : ''}">
            <div class="facet-name">${escapeHtml(f.name)}</div>
            <div class="facet-role badge-${f.facet_role}">${f.facet_role}</div>
            <div class="facet-strictness">${f.strictness_override || 'inherit'}</div>
          </div>
        `).join('')}
      </div>

      <div class="icp-quotes-col">
        <h3>Quote Spans (${spans.length})</h3>
        <div class="icp-filter-row">
          <select id="icp-status-filter" onchange="icpFilterQuotes()">
            <option value="">All statuses</option>
            <option value="auto_verified">Auto-verified</option>
            <option value="human_verified">Human-verified</option>
            <option value="flagged">Flagged</option>
            <option value="auto_rejected">Auto-rejected</option>
          </select>
          <select id="icp-quote-limit" onchange="icpFilterQuotes()">
            <option value="10">Top 10</option>
            <option value="25" selected>Top 25</option>
            <option value="50">Top 50</option>
            <option value="0">All</option>
          </select>
        </div>
        <div id="icp-quote-list">
          ${[...spans].sort((a, b) => (b.auto_confidence ?? 0) - (a.auto_confidence ?? 0)).map((s, idx) => `
            <div class="icp-quote-card" data-status="${s.verification_status}" data-rank="${idx}"
                 data-quote-id="${safeAttr(s.quote_id)}"
                 onclick="icpOpenQuoteDetail('${safeAttr(s.quote_id)}')"
                 style="cursor:pointer">
              <div class="quote-status-badge status-${safeAttr(s.verification_status)}" style="background:${statusColors[s.verification_status] || '#666'}">${escapeHtml(s.verification_status)}</div>
              <div class="quote-text">"${escapeHtml((s.text || '').slice(0, 200))}${s.text?.length > 200 ? '...' : ''}"</div>
              <div class="quote-meta">
                <span>Doc: ${s.doc_id?.slice(0, 12) || 'unknown'}</span>
                <span>Page: ${s.page || '?'}</span>
                ${s.auto_confidence != null ? `<span>Confidence: ${(s.auto_confidence * 100).toFixed(0)}%</span>` : ''}
              </div>
              <div class="quote-actions" onclick="event.stopPropagation()">
                <button onclick="icpVerifyQuote('${safeAttr(s.quote_id)}', 'human_verified')" class="btn-sm btn-verify">Verify</button>
                <button onclick="icpVerifyQuote('${safeAttr(s.quote_id)}', 'rejected')" class="btn-sm btn-reject">Reject</button>
                <button onclick="icpVerifyQuote('${safeAttr(s.quote_id)}', 'flagged')" class="btn-sm btn-flag">Flag</button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

function icpFilterQuotes() {
  const statusFilter = document.getElementById('icp-status-filter')?.value || '';
  const limitVal = parseInt(document.getElementById('icp-quote-limit')?.value || '0', 10);
  let shown = 0;
  document.querySelectorAll('.icp-quote-card').forEach(card => {
    const matchesStatus = !statusFilter || card.dataset.status === statusFilter;
    const withinLimit = limitVal === 0 || shown < limitVal;
    if (matchesStatus && withinLimit) {
      card.style.display = '';
      shown++;
    } else {
      card.style.display = 'none';
    }
  });
}

async function icpVerifyQuote(quoteId, status) {
  try {
    await icpPost('/verify', {
      sessionId: icpState.currentSessionId,
      quoteId,
      status,
    });
    await icpRefreshSession();
  } catch (err) {
    showICPError('Verification failed: ' + err.message);
  }
}

// =============================================================================
// PDF ZOOM / FULLSCREEN STATE
// =============================================================================
var icpPdfCurrentZoom = 1.0;
var icpPdfIsFullscreen = false;

// =============================================================================
// QUOTE DETAIL MODAL
// =============================================================================

function icpOpenQuoteDetail(quoteId) {
  try {
    // Reset zoom/fullscreen state for new modal
    icpPdfCurrentZoom = 1.0;
    icpPdfIsFullscreen = false;

    var session = icpState.session;
    if (!session) {
      showICPError('No active session');
      return;
    }

    var spans = session.quote_spans || [];
    var span = null;
    for (var i = 0; i < spans.length; i++) {
      if (spans[i].quote_id === quoteId) { span = spans[i]; break; }
    }
    if (!span) {
      showICPError('Quote not found: ' + quoteId);
      return;
    }

    var page = Array.isArray(span.page) ? span.page[0] : (span.page || 1);

    // Remove existing modal if any (and clean up its key handler)
    var existing = document.getElementById('icp-quote-modal');
    if (existing) {
      if (existing._keyHandler) document.removeEventListener('keydown', existing._keyHandler);
      existing.parentNode.removeChild(existing);
    }

    // Build modal DOM synchronously — no async, no await, no promises
    var modal = document.createElement('div');
    modal.id = 'icp-quote-modal';
    modal.className = 'icp-modal-overlay';
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        if (modal._keyHandler) document.removeEventListener('keydown', modal._keyHandler);
        modal.parentNode.removeChild(modal);
      }
    });

    // Keyboard shortcuts for zoom/fullscreen
    modal._keyHandler = function(e) {
      if (e.key === 'Escape') {
        if (icpPdfIsFullscreen) { icpPdfToggleFullscreen(); e.preventDefault(); }
        else { modal.parentNode.removeChild(modal); document.removeEventListener('keydown', modal._keyHandler); }
      } else if (e.key === '+' || e.key === '=') { icpPdfZoom(0.25); e.preventDefault(); }
      else if (e.key === '-') { icpPdfZoom(-0.25); e.preventDefault(); }
      else if (e.key === '0') { icpPdfZoomReset(); e.preventDefault(); }
    };
    document.addEventListener('keydown', modal._keyHandler);

    var spanText = span.text || '';
    var docId = span.doc_id || '';
    var spanQuoteId = safeAttr(span.quote_id);
    var spanDocId = safeAttr(docId);
    var spanStatus = safeAttr(span.verification_status || 'unknown');
    var docLabel = docId.slice(0, 16);

    var html = '';
    html += '<div class="icp-modal-content">';
    html += '  <div class="icp-modal-header">';
    html += '    <h3>Quote Detail</h3>';
    html += '    <button class="icp-modal-close" onclick="var m=document.getElementById(\'icp-quote-modal\');if(m){if(m._keyHandler)document.removeEventListener(\'keydown\',m._keyHandler);m.parentNode.removeChild(m)}">&times;</button>';
    html += '  </div>';
    html += '  <div class="icp-modal-body">';
    html += '    <div class="icp-modal-split">';
    html += '      <div class="icp-modal-left">';
    html += '        <div class="icp-modal-section">';
    html += '          <label>Status</label>';
    html += '          <span class="quote-status-badge status-' + spanStatus + '">' + escapeHtml(span.verification_status || 'unknown') + '</span>';
    if (span.auto_confidence != null) {
      html += '          <span class="quote-detail-confidence">Confidence: ' + (span.auto_confidence * 100).toFixed(0) + '%</span>';
    }
    html += '        </div>';
    html += '        <div class="icp-modal-section">';
    html += '          <label>Source</label>';
    html += '          <div id="icp-quote-doc-source" class="quote-detail-source">' + escapeHtml(docLabel) + '</div>';
    html += '          <div class="quote-detail-page">Page ' + page + (span.source_anchor ? ' (' + escapeHtml(span.source_anchor) + ')' : '') + '</div>';
    html += '        </div>';
    html += '        <div class="icp-modal-section">';
    html += '          <label>Full Quote <span id="icp-richtext-badge" class="icp-richtext-badge" style="display:none">formatted</span></label>';
    html += '          <div class="quote-detail-fulltext" id="icp-quote-fulltext">' + escapeHtml(spanText) + '</div>';
    html += '        </div>';
    html += '        <div class="icp-modal-section" id="icp-footnotes-section" style="display:none">';
    html += '          <label>Footnotes / Endnotes</label>';
    html += '          <div class="icp-footnotes-content" id="icp-footnotes-content"></div>';
    html += '        </div>';
    html += '        <div class="icp-modal-section icp-ocr-correction">';
    html += '          <label>OCR Correction</label>';
    html += '          <div class="icp-edit-toolbar" id="icp-edit-toolbar">';
    html += '            <button onclick="icpEditFormat(\'italic\')" class="btn btn-sm icp-edit-btn" title="Italic (Ctrl+I)"><i>I</i></button>';
    html += '            <button onclick="icpEditFormat(\'bold\')" class="btn btn-sm icp-edit-btn" title="Bold (Ctrl+B)"><b>B</b></button>';
    html += '            <button onclick="icpEditFormat(\'superscript\')" class="btn btn-sm icp-edit-btn" title="Superscript">x<sup>2</sup></button>';
    html += '            <button onclick="icpEditFormat(\'subscript\')" class="btn btn-sm icp-edit-btn" title="Subscript">x<sub>2</sub></button>';
    html += '            <span class="icp-pdf-toolbar-sep"></span>';
    html += '            <button onclick="icpEditFormat(\'removeFormat\')" class="btn btn-sm icp-edit-btn" title="Remove formatting">T&#x0336;</button>';
    html += '            <button onclick="icpEditJoinHyphen()" class="btn btn-sm icp-edit-btn" title="Join hyphenated word">a-b</button>';
    html += '            <span class="icp-pdf-toolbar-sep"></span>';
    html += '            <button onclick="icpEditCopyFromRichText()" class="btn btn-sm icp-edit-btn" title="Copy formatted text from Full Quote above">&#x2B07; Copy Rich</button>';
    html += '          </div>';
    html += '          <div id="icp-quote-correction" class="icp-quote-editor" contenteditable="true" spellcheck="true">' + escapeHtml(spanText) + '</div>';
    html += '          <div class="icp-modal-actions">';
    html += '            <button onclick="icpCorrectQuote(\'' + spanQuoteId + '\')" class="btn btn-primary btn-sm">Save Correction</button>';
    html += '            <button onclick="icpVerifyFromModal(\'' + spanQuoteId + '\', \'human_verified\')" class="btn btn-sm btn-verify">Verify as Correct</button>';
    html += '            <button onclick="icpVerifyFromModal(\'' + spanQuoteId + '\', \'flagged\')" class="btn btn-sm btn-flag">Flag</button>';
    html += '          </div>';
    html += '        </div>';
    html += '      </div>';
    html += '      <div class="icp-modal-right">';
    html += '        <div class="icp-pdf-toolbar">';
    html += '          <label>PDF Page ' + page + '</label>';
    html += '          <div class="icp-pdf-toolbar-actions">';
    html += '            <button onclick="icpPdfZoom(-0.25)" class="btn btn-sm" title="Zoom out">&#x2212;</button>';
    html += '            <span id="icp-pdf-zoom-label" class="icp-pdf-zoom-label">100%</span>';
    html += '            <button onclick="icpPdfZoom(0.25)" class="btn btn-sm" title="Zoom in">+</button>';
    html += '            <button onclick="icpPdfZoomReset()" class="btn btn-sm" title="Reset zoom">1:1</button>';
    html += '            <button onclick="icpPdfFitWidth()" class="btn btn-sm" title="Fit to width">Fit</button>';
    html += '            <span class="icp-pdf-toolbar-sep"></span>';
    html += '            <button onclick="icpPdfToggleFullscreen()" class="btn btn-sm icp-pdf-fullscreen-btn" id="icp-pdf-fullscreen-btn" title="Toggle fullscreen">&#x26F6;</button>';
    html += '          </div>';
    html += '        </div>';
    html += '        <div class="icp-pdf-viewer" id="icp-pdf-viewer">';
    html += '          <div class="icp-pdf-loading">Loading PDF page...</div>';
    html += '        </div>';
    html += '        <div class="icp-pdf-nav">';
    html += '          <button onclick="icpPdfPageNav(\'' + spanDocId + '\', ' + (page - 1) + ')" class="btn btn-sm"' + (page <= 1 ? ' disabled' : '') + '>Prev</button>';
    html += '          <span id="icp-pdf-page-label">Page ' + page + '</span>';
    html += '          <button onclick="icpPdfPageNav(\'' + spanDocId + '\', ' + (page + 1) + ')" class="btn btn-sm">Next</button>';
    html += '        </div>';
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    modal.innerHTML = html;
    document.body.appendChild(modal);

    // Load doc info asynchronously (updates source label once available)
    icpFetch('/doc-info/' + encodeURIComponent(docId)).then(function(docInfo) {
      var src = document.getElementById('icp-quote-doc-source');
      if (src && docInfo) {
        var label = ((docInfo.meta && docInfo.meta.author_raw) || '') + ' - ' + ((docInfo.meta && docInfo.meta.title_raw) || docInfo.path_rel || '');
        src.textContent = label.trim() || docId;
      }
    }).catch(function() { /* doc info unavailable */ });

    // Load the PDF page image with highlighted quote text
    icpLoadPdfPage(docId, page, spanText);

    // Load rich text formatting + footnotes asynchronously
    icpLoadPdfMeta(docId, page, spanText);
  } catch (err) {
    showICPError('Quote detail error: ' + (err && err.message ? err.message : String(err)));
  }
}

function icpLoadPdfPage(docId, page, highlightText) {
  var viewer = document.getElementById('icp-pdf-viewer');
  var label = document.getElementById('icp-pdf-page-label');
  if (!viewer) return;

  viewer.innerHTML = '<div class="icp-pdf-loading">Loading PDF page...</div>';
  if (label) label.textContent = 'Page ' + page;

  var url = '/api/icp/pdf-page/' + encodeURIComponent(docId) + '/' + page;
  if (highlightText) {
    url += '?highlight=' + encodeURIComponent(highlightText);
  }

  // Use fetch so we can read the X-ICP-Actual-Page header
  fetch(url).then(function(resp) {
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    // If the highlight was found on a different page, update the label
    var actualPage = resp.headers.get('X-ICP-Actual-Page');
    if (actualPage && label) {
      label.textContent = 'Page ' + actualPage + ' (text found here, requested ' + page + ')';
    }
    return resp.blob();
  }).then(function(blob) {
    var img = new Image();
    img.className = 'icp-pdf-page-img';
    img.alt = 'PDF page ' + page;
    img.onload = function() {
      URL.revokeObjectURL(img.src);
      // Re-apply current zoom level after image loads
      icpApplyPdfZoom();
    };
    img.src = URL.createObjectURL(blob);
    viewer.innerHTML = '';
    viewer.appendChild(img);
  }).catch(function() {
    viewer.innerHTML = '<div class="icp-pdf-error">Could not load PDF page.</div>';
  });
}

function icpPdfPageNav(docId, page) {
  if (page < 1) return;
  icpLoadPdfPage(docId, page);
}

function icpPdfZoom(delta) {
  icpPdfCurrentZoom = Math.max(0.25, Math.min(5.0, icpPdfCurrentZoom + delta));
  icpApplyPdfZoom();
}

function icpPdfZoomReset() {
  icpPdfCurrentZoom = 1.0;
  icpApplyPdfZoom();
}

function icpPdfFitWidth() {
  var viewer = document.getElementById('icp-pdf-viewer');
  var img = viewer && viewer.querySelector('.icp-pdf-page-img');
  if (!viewer || !img) return;
  // Calculate scale to fit image natural width into viewer width
  var viewerWidth = viewer.clientWidth - 16; // minus padding
  var imgNatural = img.naturalWidth || img.width;
  if (imgNatural > 0) {
    icpPdfCurrentZoom = viewerWidth / imgNatural;
  }
  icpApplyPdfZoom();
}

function icpApplyPdfZoom() {
  var viewer = document.getElementById('icp-pdf-viewer');
  var img = viewer && viewer.querySelector('.icp-pdf-page-img');
  var label = document.getElementById('icp-pdf-zoom-label');
  if (img) {
    img.style.maxWidth = 'none';
    img.style.width = (icpPdfCurrentZoom * 100) + '%';
    img.style.transformOrigin = 'top left';
  }
  if (label) {
    label.textContent = Math.round(icpPdfCurrentZoom * 100) + '%';
  }
}

function icpPdfToggleFullscreen() {
  var modal = document.getElementById('icp-quote-modal');
  var content = modal && modal.querySelector('.icp-modal-content');
  var left = modal && modal.querySelector('.icp-modal-left');
  var right = modal && modal.querySelector('.icp-modal-right');
  var btn = document.getElementById('icp-pdf-fullscreen-btn');
  if (!content || !right) return;

  icpPdfIsFullscreen = !icpPdfIsFullscreen;

  if (icpPdfIsFullscreen) {
    content.classList.add('icp-pdf-fullscreen-mode');
    if (left) left.style.display = 'none';
    right.style.flex = '1';
    if (btn) btn.innerHTML = '&#x2716;'; // X icon to exit
    if (btn) btn.title = 'Exit fullscreen';
  } else {
    content.classList.remove('icp-pdf-fullscreen-mode');
    if (left) left.style.display = '';
    right.style.flex = '';
    if (btn) btn.innerHTML = '&#x26F6;'; // Fullscreen icon
    if (btn) btn.title = 'Toggle fullscreen';
  }
}

function icpLoadPdfMeta(docId, page, quoteText) {
  if (!quoteText) return;

  var url = '/api/icp/pdf-meta/' + encodeURIComponent(docId) + '/' + page
    + '?quote=' + encodeURIComponent(quoteText);

  fetch(url).then(function(resp) {
    if (!resp.ok) return null;
    return resp.json();
  }).then(function(meta) {
    if (!meta) return;

    // Update the quote display with rich text (preserving formatting)
    if (meta.rich_text && meta.rich_text.html) {
      var fullTextEl = document.getElementById('icp-quote-fulltext');
      var badge = document.getElementById('icp-richtext-badge');
      var editor = document.getElementById('icp-quote-correction');
      if (fullTextEl) {
        fullTextEl.innerHTML = meta.rich_text.html;
        fullTextEl.classList.add('icp-richtext-active');
      }
      if (editor) {
        editor.innerHTML = meta.rich_text.html;
      }
      if (badge) badge.style.display = 'inline';
    }

    // Display footnotes if present
    if (meta.footnotes && meta.footnotes.length > 0) {
      var section = document.getElementById('icp-footnotes-section');
      var content = document.getElementById('icp-footnotes-content');
      if (section && content) {
        var notesHtml = '';
        for (var i = 0; i < meta.footnotes.length; i++) {
          var note = meta.footnotes[i];
          notesHtml += '<div class="icp-footnote-entry">';
          notesHtml += '  <span class="icp-footnote-marker">' + escapeHtml(note.marker) + '</span>';
          notesHtml += '  <span class="icp-footnote-text">' + escapeHtml(note.text) + '</span>';
          notesHtml += '</div>';
        }
        content.innerHTML = notesHtml;
        section.style.display = '';
      }
    }
  }).catch(function() {
    // Non-fatal — metadata extraction is optional
  });
}

function icpEditFormat(command) {
  // Focus the editor to ensure execCommand targets it
  var editor = document.getElementById('icp-quote-correction');
  if (editor) editor.focus();
  document.execCommand(command, false, null);
}

function icpEditJoinHyphen() {
  // Find selected text or scan for hyphen patterns and join them
  var editor = document.getElementById('icp-quote-correction');
  if (!editor) return;

  var sel = window.getSelection();
  if (sel && sel.rangeCount > 0 && !sel.isCollapsed) {
    // If user selected text with a hyphen, join it
    var text = sel.toString();
    var joined = text.replace(/(\w)-\s*\n?\s*([a-z])/g, '$1$2');
    if (joined !== text) {
      document.execCommand('insertText', false, joined);
      return;
    }
  }

  // Otherwise, scan entire editor and fix all hyphenated line breaks
  var html = editor.innerHTML;
  var fixed = html.replace(/(\w)-\s+([a-z])/g, '$1$2');
  fixed = fixed.replace(/(\w)-<br\s*\/?>([a-z])/g, '$1$2');
  if (fixed !== html) {
    editor.innerHTML = fixed;
  }
}

function icpEditCopyFromRichText() {
  var source = document.getElementById('icp-quote-fulltext');
  var editor = document.getElementById('icp-quote-correction');
  if (source && editor) {
    editor.innerHTML = source.innerHTML;
  }
}

async function icpCorrectQuote(quoteId) {
  const editor = document.getElementById('icp-quote-correction');
  // Get plain text for the correction (strip HTML tags)
  const correctedText = editor?.innerText?.trim();
  if (!correctedText) return;
  // Also capture rich HTML for display fidelity
  const correctedHtml = editor?.innerHTML?.trim();

  try {
    await icpPost('/verify', {
      sessionId: icpState.currentSessionId,
      quoteId,
      status: 'human_corrected',
      correctedText,
    });
    // Also submit as OCR patch for tracking
    const span = (icpState.session?.quote_spans || []).find(s => s.quote_id === quoteId);
    if (span) {
      await icpPost('/patch', {
        sessionId: icpState.currentSessionId,
        docId: span.doc_id,
        beforeText: span.text,
        afterText: correctedText,
        page: Array.isArray(span.page) ? span.page[0] : span.page,
        reasonTag: 'ocr_error',
      });
    }
    document.getElementById('icp-quote-modal')?.remove();
    await icpRefreshSession();
  } catch (err) {
    showICPError('Correction failed: ' + err.message);
  }
}

async function icpVerifyFromModal(quoteId, status) {
  try {
    await icpPost('/verify', {
      sessionId: icpState.currentSessionId,
      quoteId,
      status,
    });
    document.getElementById('icp-quote-modal')?.remove();
    await icpRefreshSession();
  } catch (err) {
    showICPError('Verification failed: ' + err.message);
  }
}

// =============================================================================
// PANEL 2: BINDING BUILDER
// =============================================================================

function renderBindingPanel(container, session) {
  const atoms = session.atoms || [];
  const bindings = session.bindings || [];
  const spans = session.quote_spans || [];

  container.innerHTML = `
    <div class="icp-binding-grid">
      <div class="icp-atoms-col">
        <h3>Atoms (${atoms.length})</h3>
        ${atoms.map(a => `
          <div class="icp-atom-card ${a.bound_quote_ids?.length > 0 ? 'bound' : 'unbound'}">
            <div class="atom-kind badge-${a.kind}">${a.kind}</div>
            <div class="atom-modality">${a.modality}</div>
            <div class="atom-text">${escapeHtml((a.display_text || a.semantic_text || '').slice(0, 100))}</div>
            <div class="atom-evidence">${a.evidence_mode}</div>
            <div class="atom-quotes">${a.bound_quote_ids?.length || 0} quotes bound</div>
          </div>
        `).join('') || '<p class="muted">No atoms yet</p>'}
      </div>

      <div class="icp-bindings-col">
        <h3>Bindings (${bindings.length})</h3>
        ${bindings.map(b => `
          <div class="icp-binding-card">
            <div class="binding-kind">${b.support_kind}</div>
            <div class="binding-atoms">Atoms: ${b.atom_ids.join(', ').slice(0, 40)}</div>
            <div class="binding-quotes">Quotes: ${b.quote_ids.length}</div>
            ${b.warrant_note ? `<div class="binding-warrant">${escapeHtml(b.warrant_note)}</div>` : ''}
            <button onclick="icpDeleteBinding('${safeAttr(b.binding_id)}')" class="btn-sm btn-reject">Remove</button>
          </div>
        `).join('') || '<p class="muted">No bindings yet</p>'}
      </div>

      <div class="icp-avail-quotes-col">
        <h3>Available Quotes</h3>
        ${spans.filter(s => ['auto_verified','human_verified','human_corrected'].includes(s.verification_status)).map(s => `
          <div class="icp-mini-quote">
            <div class="quote-text-sm">"${escapeHtml((s.text || '').slice(0, 80))}..."</div>
            <div class="quote-id-sm">${s.quote_id?.slice(0, 8)}</div>
          </div>
        `).join('') || '<p class="muted">No verified quotes</p>'}
      </div>
    </div>
  `;
}

async function icpDeleteBinding(bindingId) {
  try {
    await icpFetch(`/bind/${icpState.currentSessionId}/${bindingId}`, { method: 'DELETE' });
    await icpRefreshSession();
  } catch (err) {
    showICPError('Delete binding failed: ' + err.message);
  }
}

// =============================================================================
// PANEL 4: STRESS TEST CONSOLE
// =============================================================================

function renderStressPanel(container, session) {
  const report = session.stress_test_report;

  if (!report) {
    container.innerHTML = `
      <div class="icp-stress-console">
        <h3>Stress Test Console</h3>
        <p class="muted">No stress test has been run yet.</p>
        <p>Atoms: ${(session.atoms || []).length} | Bindings: ${(session.bindings || []).length}</p>
        <button onclick="icpRunStressTest()" class="btn btn-primary">Run Stress Test</button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="icp-stress-console">
      <h3>Stress Test Results</h3>
      <div class="stress-summary">
        <div class="stress-stat">
          <span class="stat-label">Tested</span>
          <span class="stat-value">${report.summary?.total_tested || 0}</span>
        </div>
        <div class="stress-stat stat-pass">
          <span class="stat-label">Passed</span>
          <span class="stat-value">${report.summary?.passed || 0}</span>
        </div>
        <div class="stress-stat stat-fail">
          <span class="stat-label">Failed</span>
          <span class="stat-value">${report.summary?.failed || 0}</span>
        </div>
        <div class="stress-stat stat-demote">
          <span class="stat-label">Demoted</span>
          <span class="stat-value">${report.summary?.demoted || 0}</span>
        </div>
      </div>

      <h4>Results</h4>
      <div class="stress-results">
        ${(report.results || []).map(r => `
          <div class="stress-result-card ${r.passed ? 'passed' : 'failed'}">
            <span class="result-atom">${r.atom_id?.slice(0, 8) || '?'}</span>
            <span class="result-verdict">${r.verdict || 'unknown'}</span>
            <span class="result-reason">${escapeHtml(r.reason || '')}</span>
          </div>
        `).join('') || '<p class="muted">No results</p>'}
      </div>
    </div>
  `;
}

async function icpRunStressTest() {
  try {
    const data = await icpPost(`/stress-test/${icpState.currentSessionId}`, {});
    await icpRefreshSession();
  } catch (err) {
    showICPError('Stress test failed: ' + err.message);
  }
}

// =============================================================================
// PANEL 5: PARAGRAPH PLANNER
// =============================================================================

function renderPlannerPanel(container, session) {
  const plan = session.paragraph_plan || [];
  const atoms = session.atoms || [];
  const ledger = session.paragraph_ledger?.items || [];

  const totalAtoms = atoms.length;
  const coveredAtomIds = new Set();
  plan.forEach(p => (p.atom_ids || []).forEach(id => coveredAtomIds.add(id)));

  container.innerHTML = `
    <div class="icp-planner">
      <h3>Paragraph Plan</h3>
      <div class="planner-coverage">
        <span>Atoms covered: ${coveredAtomIds.size} / ${totalAtoms}</span>
        <div class="coverage-bar">
          <div class="coverage-fill" style="width:${totalAtoms > 0 ? (coveredAtomIds.size / totalAtoms * 100) : 0}%"></div>
        </div>
      </div>

      <div class="planner-paragraphs">
        ${plan.map((p, i) => {
          const ledgerEntry = ledger.find(l => l.paragraph_id === p.paragraph_id);
          return `
            <div class="icp-plan-card">
              <div class="plan-order">P${i + 1}</div>
              <div class="plan-atoms">
                Atoms: ${(p.atom_ids || []).length}
                ${(p.atom_ids || []).map(id => `<span class="atom-chip">${id.slice(0, 6)}</span>`).join('')}
              </div>
              <div class="plan-quotes">
                Required quotes: ${(p.required_quotes || []).length}
              </div>
              ${ledgerEntry ? `
                <div class="plan-ledger">
                  Coverage: ${ledgerEntry.coverage_stats?.atoms_covered || 0}/${ledgerEntry.coverage_stats?.atoms_total || 0}
                  | Drift flags: ${(ledgerEntry.drift_flags || []).length}
                </div>
              ` : ''}
            </div>
          `;
        }).join('') || '<p class="muted">No paragraph plan yet</p>'}
      </div>
    </div>
  `;
}

// =============================================================================
// PANEL 6: EVIDENCE HEATMAP
// =============================================================================

function renderHeatmapPanel(container, session) {
  const plan = session.paragraph_plan || [];
  const generatedText = session.generated_text || {};
  const scopes = session.sentence_scopes || [];

  container.innerHTML = `
    <div class="icp-heatmap">
      <h3>Evidence Heatmap</h3>
      <p class="muted">Color intensity indicates evidence density per paragraph.</p>

      <div class="heatmap-prose">
        ${plan.sort((a, b) => a.paragraph_order - b.paragraph_order).map((p, i) => {
          const text = generatedText[p.paragraph_id] || '';
          const atomCount = (p.atom_ids || []).length;
          const quoteCount = (p.required_quotes || []).length;
          const density = Math.min(1, (atomCount + quoteCount) / 6);

          // Green = well-supported, red = thin
          const hue = density > 0.5 ? 120 : density > 0.2 ? 45 : 0;
          const bg = `hsla(${hue}, 70%, 90%, ${0.3 + density * 0.5})`;

          return `
            <div class="heatmap-paragraph" style="background:${bg}; border-left: 4px solid hsl(${hue}, 70%, 50%)">
              <div class="heatmap-label">P${i + 1} — ${atomCount} atoms, ${quoteCount} quotes</div>
              <div class="heatmap-text">${escapeHtml(text.slice(0, 300))}${text.length > 300 ? '...' : ''}</div>
            </div>
          `;
        }).join('') || '<p class="muted">No generated text yet</p>'}
      </div>
    </div>
  `;
}

// =============================================================================
// PANEL 7: CORPUS DIFF
// =============================================================================

function renderDiffPanel(container, session) {
  container.innerHTML = `
    <div class="icp-diff">
      <h3>Corpus Version Diff</h3>
      <p class="muted">Compare two runs to see what changed in the corpus.</p>
      <div class="diff-controls">
        <input type="text" id="diff-run1" placeholder="Run ID 1" />
        <input type="text" id="diff-run2" placeholder="Run ID 2" />
        <button onclick="icpRunDiff()" class="btn btn-primary">Compare</button>
      </div>
      <div id="diff-results"></div>
    </div>
  `;
}

async function icpRunDiff() {
  const run1 = document.getElementById('diff-run1')?.value;
  const run2 = document.getElementById('diff-run2')?.value;
  if (!run1 || !run2) { showICPError('Enter both run IDs'); return; }

  try {
    const data = await icpFetch(`/corpus-diff/${run1}/${run2}`);
    document.getElementById('diff-results').innerHTML = `
      <pre>${escapeHtml(JSON.stringify(data, null, 2))}</pre>
    `;
  } catch (err) {
    showICPError('Diff failed: ' + err.message);
  }
}

// =============================================================================
// PANEL 8: FACET EDITOR
// =============================================================================

function renderFacetPanel(container, session) {
  const facets = session.facets || [];

  container.innerHTML = `
    <div class="icp-facet-editor">
      <h3>Facet Contract Editor</h3>
      <div class="facet-list">
        ${facets.map(f => `
          <div class="icp-facet-edit-card ${f.archived ? 'archived' : ''}">
            <div class="facet-edit-header">
              <input type="text" value="${escapeHtml(f.name)}" class="facet-name-input"
                     onchange="icpUpdateFacet('${safeAttr(f.facet_id)}', 'name', this.value)" />
              <select onchange="icpUpdateFacet('${safeAttr(f.facet_id)}', 'facet_role', this.value)">
                <option value="core" ${f.facet_role === 'core' ? 'selected' : ''}>Core</option>
                <option value="supporting" ${f.facet_role === 'supporting' ? 'selected' : ''}>Supporting</option>
                <option value="exploratory" ${f.facet_role === 'exploratory' ? 'selected' : ''}>Exploratory</option>
              </select>
              <select onchange="icpUpdateFacet('${safeAttr(f.facet_id)}', 'strictness_override', this.value || undefined)">
                <option value="" ${!f.strictness_override ? 'selected' : ''}>Inherit</option>
                <option value="strict" ${f.strictness_override === 'strict' ? 'selected' : ''}>Strict</option>
                <option value="moderate" ${f.strictness_override === 'moderate' ? 'selected' : ''}>Moderate</option>
                <option value="permissive" ${f.strictness_override === 'permissive' ? 'selected' : ''}>Permissive</option>
              </select>
            </div>
            <textarea class="facet-desc-input"
                      onchange="icpUpdateFacet('${safeAttr(f.facet_id)}', 'description', this.value)"
            >${escapeHtml(f.description)}</textarea>
            <label>
              <input type="checkbox" ${f.allow_adds_atoms ? 'checked' : ''}
                     onchange="icpUpdateFacet('${safeAttr(f.facet_id)}', 'allow_adds_atoms', this.checked)" />
              Allow adds_atoms
            </label>
          </div>
        `).join('') || '<p class="muted">No facets yet</p>'}
      </div>
    </div>
  `;
}

async function icpUpdateFacet(facetId, field, value) {
  try {
    await icpFetch(`/facets/${icpState.currentSessionId}/${facetId}`, {
      method: 'PUT',
      body: JSON.stringify({ [field]: value }),
    });
    await icpRefreshSession();
  } catch (err) {
    showICPError('Update failed: ' + err.message);
  }
}

// =============================================================================
// PANEL 9: QUALITY GATES
// =============================================================================

function renderQualityPanel(container, session) {
  const qg = session.quality_gates;
  const review = session.review_results;

  if (!qg && !review) {
    container.innerHTML = `
      <div class="icp-quality">
        <h3>Quality Gates</h3>
        <p class="muted">No quality gate results yet. Run the full pipeline to generate quality assessments.</p>
        <div class="quality-info">
          <p>Quality gates include:</p>
          <ul>
            <li>Citation enforcement (hallucination detection + correction)</li>
            <li>Quality gauntlet (7-stage evaluation)</li>
            <li>Prose sanitization (artifact removal)</li>
            <li>Endnote generation</li>
            <li>Bibliography building</li>
            <li>Style profile injection</li>
          </ul>
        </div>
      </div>
    `;
    return;
  }

  const overallPassed = review?.passed ?? true;

  // Citation enforcement section
  const ce = qg?.citation_enforcement;
  const ceHtml = ce ? `
    <div class="quality-card ${ce.passed ? 'quality-pass' : 'quality-fail'}">
      <div class="quality-card-header">
        <span class="quality-icon">${ce.passed ? '\u2713' : '\u2717'}</span>
        <h4>Citation Enforcement</h4>
        <span class="quality-badge ${ce.passed ? 'badge-pass' : 'badge-fail'}">${ce.passed ? 'PASSED' : 'FAILED'}</span>
      </div>
      <div class="quality-card-body">
        <div class="quality-stats">
          <div class="quality-stat">
            <span class="stat-val">${ce.action}</span>
            <span class="stat-lbl">Action</span>
          </div>
          <div class="quality-stat">
            <span class="stat-val">${ce.total_citations}</span>
            <span class="stat-lbl">Citations</span>
          </div>
          <div class="quality-stat">
            <span class="stat-val">${ce.corrections}</span>
            <span class="stat-lbl">Corrections</span>
          </div>
          <div class="quality-stat ${ce.hallucinations_caught > 0 ? 'stat-warn' : ''}">
            <span class="stat-val">${ce.hallucinations_caught}</span>
            <span class="stat-lbl">Hallucinations</span>
          </div>
        </div>
      </div>
    </div>
  ` : `
    <div class="quality-card quality-na">
      <div class="quality-card-header">
        <span class="quality-icon">\u2014</span>
        <h4>Citation Enforcement</h4>
        <span class="quality-badge badge-na">N/A</span>
      </div>
      <div class="quality-card-body"><p class="muted">No corpus constraint available for citation enforcement.</p></div>
    </div>
  `;

  // Quality gauntlet section
  const g = qg?.gauntlet;
  const scoreColor = g ? (g.overall_score >= 0.7 ? '#4caf50' : g.overall_score >= 0.5 ? '#ff9800' : '#f44336') : '#666';
  const gauntletHtml = g ? `
    <div class="quality-card ${g.passed ? 'quality-pass' : 'quality-fail'}">
      <div class="quality-card-header">
        <span class="quality-icon">${g.passed ? '\u2713' : '\u2717'}</span>
        <h4>Quality Gauntlet</h4>
        <span class="quality-badge ${g.passed ? 'badge-pass' : 'badge-fail'}">${g.passed ? 'PASSED' : 'FAILED'}</span>
      </div>
      <div class="quality-card-body">
        <div class="quality-score-ring">
          <div class="score-circle" style="border-color: ${scoreColor}">
            <span class="score-number" style="color: ${scoreColor}">${(g.overall_score * 100).toFixed(0)}</span>
            <span class="score-unit">%</span>
          </div>
          <div class="score-label">Overall Score</div>
        </div>
        <div class="quality-stats">
          <div class="quality-stat">
            <span class="stat-val">${g.stages_passed}/${g.total_stages}</span>
            <span class="stat-lbl">Stages Passed</span>
          </div>
          <div class="quality-stat ${g.critical_issues > 0 ? 'stat-warn' : ''}">
            <span class="stat-val">${g.critical_issues}</span>
            <span class="stat-lbl">Critical Issues</span>
          </div>
          <div class="quality-stat">
            <span class="stat-val">${g.revision_required ? 'Yes' : 'No'}</span>
            <span class="stat-lbl">Revision Required</span>
          </div>
        </div>
        ${(g.stage_results && g.stage_results.length > 0) ? `
          <div class="gauntlet-stages">
            <h5>Stage Results</h5>
            ${g.stage_results.map(s => `
              <div class="gauntlet-stage-row">
                <span class="stage-pass-icon">${s.passed ? '\u2713' : '\u2717'}</span>
                <span class="stage-bar-name">${escapeHtml(s.name)}</span>
                <div class="stage-bar-track">
                  <div class="stage-bar-fill" style="width:${(s.score * 100).toFixed(0)}%;background:${s.score >= 0.7 ? '#4caf50' : s.score >= 0.5 ? '#ff9800' : '#f44336'}"></div>
                </div>
                <span class="stage-bar-score">${(s.score * 100).toFixed(0)}%</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  ` : `
    <div class="quality-card quality-na">
      <div class="quality-card-header">
        <span class="quality-icon">\u2014</span>
        <h4>Quality Gauntlet</h4>
        <span class="quality-badge badge-na">N/A</span>
      </div>
      <div class="quality-card-body"><p class="muted">Quality gauntlet has not been run.</p></div>
    </div>
  `;

  // Sanitization section
  const san = qg?.sanitization;
  const sanitizationHtml = san ? `
    <div class="quality-card quality-pass">
      <div class="quality-card-header">
        <span class="quality-icon">\u2713</span>
        <h4>Prose Sanitization</h4>
        <span class="quality-badge badge-pass">APPLIED</span>
      </div>
      <div class="quality-card-body">
        <div class="quality-stats">
          <div class="quality-stat">
            <span class="stat-val">${san.passes}</span>
            <span class="stat-lbl">Sanitizer Passes</span>
          </div>
          <div class="quality-stat">
            <span class="stat-val">${san.artifacts_removed}</span>
            <span class="stat-lbl">Artifacts Removed</span>
          </div>
        </div>
        <p class="quality-note">Removes LLM meta-text, [CITATION NEEDED] placeholders, [GENERATION FAILED] markers, and duplicate paragraphs.</p>
      </div>
    </div>
  ` : '';

  // Style profile section
  const style = qg?.style_profile;
  const styleHtml = style ? `
    <div class="quality-card quality-pass">
      <div class="quality-card-header">
        <span class="quality-icon">\u2713</span>
        <h4>Style Profile</h4>
        <span class="quality-badge badge-pass">INJECTED</span>
      </div>
      <div class="quality-card-body">
        <div class="quality-stats">
          <div class="quality-stat">
            <span class="stat-val">${escapeHtml(style.id)}</span>
            <span class="stat-lbl">Profile ID</span>
          </div>
          <div class="quality-stat">
            <span class="stat-val">${style.applied ? 'Yes' : 'No'}</span>
            <span class="stat-lbl">Applied</span>
          </div>
        </div>
      </div>
    </div>
  ` : (session.style_profile_id ? `
    <div class="quality-card quality-pass">
      <div class="quality-card-header">
        <span class="quality-icon">\u2713</span>
        <h4>Style Profile</h4>
        <span class="quality-badge badge-pass">ACTIVE</span>
      </div>
      <div class="quality-card-body"><p>Profile: ${escapeHtml(session.style_profile_id)}</p></div>
    </div>
  ` : '');

  // Endnotes + bibliography section
  const endnotes = qg?.endnotes;
  const bib = qg?.bibliography;
  const endnotesHtml = (endnotes || bib) ? `
    <div class="quality-card quality-pass">
      <div class="quality-card-header">
        <span class="quality-icon">\u2713</span>
        <h4>Endnotes & Bibliography</h4>
        <span class="quality-badge badge-pass">GENERATED</span>
      </div>
      <div class="quality-card-body">
        <div class="quality-stats">
          ${endnotes ? `
            <div class="quality-stat">
              <span class="stat-val">${endnotes.total}</span>
              <span class="stat-lbl">Endnotes</span>
            </div>
            <div class="quality-stat">
              <span class="stat-val">${endnotes.sources_used.length}</span>
              <span class="stat-lbl">Sources Used</span>
            </div>
          ` : ''}
          ${bib ? `
            <div class="quality-stat">
              <span class="stat-val">${bib.sources_count}</span>
              <span class="stat-lbl">Bibliography Entries</span>
            </div>
          ` : ''}
        </div>
        ${endnotes && endnotes.sources_used.length > 0 ? `
          <div class="quality-source-list">
            <h5>Sources</h5>
            ${endnotes.sources_used.map(s => `<span class="source-chip">${escapeHtml(s)}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    </div>
  ` : '';

  // Checkpoints section
  const checkpoints = qg?.checkpoints;
  const checkpointsHtml = checkpoints && checkpoints.length > 0 ? `
    <div class="quality-card quality-pass">
      <div class="quality-card-header">
        <span class="quality-icon">\u2713</span>
        <h4>Checkpoints</h4>
        <span class="quality-badge badge-pass">${checkpoints.length} SAVED</span>
      </div>
      <div class="quality-card-body">
        <div class="checkpoint-timeline">
          ${checkpoints.map((cp, i) => `
            <div class="checkpoint-item">
              <span class="checkpoint-dot"></span>
              <span class="checkpoint-label">${escapeHtml(cp.replace(/_/g, ' '))}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  ` : '';

  // Review results (claim coverage)
  const coverage = review?.claim_coverage;
  const reviewHtml = coverage ? `
    <div class="quality-card ${review.passed ? 'quality-pass' : 'quality-fail'}">
      <div class="quality-card-header">
        <span class="quality-icon">${review.passed ? '\u2713' : '\u2717'}</span>
        <h4>Review Results</h4>
        <span class="quality-badge ${review.passed ? 'badge-pass' : 'badge-fail'}">${review.passed ? 'PASSED' : 'FAILED'}</span>
      </div>
      <div class="quality-card-body">
        <div class="quality-stats">
          <div class="quality-stat">
            <span class="stat-val">${coverage.mapped_sentences}/${coverage.total_sentences}</span>
            <span class="stat-lbl">Sentences Mapped</span>
          </div>
          <div class="quality-stat ${coverage.orphan_sentences?.length > 0 ? 'stat-warn' : ''}">
            <span class="stat-val">${coverage.orphan_sentences?.length ?? 0}</span>
            <span class="stat-lbl">Orphan Sentences</span>
          </div>
        </div>
      </div>
    </div>
  ` : '';

  container.innerHTML = `
    <div class="icp-quality">
      <div class="quality-header">
        <h3>Quality Gates</h3>
        <span class="quality-overall ${overallPassed ? 'overall-pass' : 'overall-fail'}">
          ${overallPassed ? '\u2713 All gates passed' : '\u2717 Some gates failed'}
        </span>
      </div>
      <div class="quality-grid">
        ${ceHtml}
        ${gauntletHtml}
        ${sanitizationHtml}
        ${styleHtml}
        ${endnotesHtml}
        ${checkpointsHtml}
        ${reviewHtml}
      </div>
    </div>
  `;
}

// =============================================================================
// PANEL 10: EXPORT
// =============================================================================

function renderExportPanel(container, session) {
  const hasText = Object.keys(session.generated_text || {}).length > 0;
  const manifest = session.run_manifest;
  const qg = session.quality_gates;

  // Quality gate summary for export header
  const qgSummary = qg ? `
    <div class="export-quality-summary">
      <h4>Quality Gate Status</h4>
      <div class="export-quality-badges">
        ${qg.citation_enforcement ? `<span class="export-qg-badge ${qg.citation_enforcement.passed ? 'qg-pass' : 'qg-fail'}">Citations: ${qg.citation_enforcement.passed ? 'OK' : 'FAIL'}</span>` : ''}
        ${qg.gauntlet ? `<span class="export-qg-badge ${qg.gauntlet.passed ? 'qg-pass' : 'qg-fail'}">Gauntlet: ${(qg.gauntlet.overall_score * 100).toFixed(0)}%</span>` : ''}
        ${qg.sanitization ? `<span class="export-qg-badge qg-pass">Sanitized (${qg.sanitization.passes}x)</span>` : ''}
        ${qg.style_profile ? `<span class="export-qg-badge qg-pass">Style: ${escapeHtml(qg.style_profile.id)}</span>` : ''}
        ${qg.endnotes ? `<span class="export-qg-badge qg-pass">${qg.endnotes.total} Endnotes</span>` : ''}
        ${qg.bibliography ? `<span class="export-qg-badge qg-pass">${qg.bibliography.sources_count} Sources</span>` : ''}
      </div>
    </div>
  ` : '';

  container.innerHTML = `
    <div class="icp-export">
      <h3>Export</h3>
      ${qgSummary}
      ${!hasText ? '<p class="muted">No generated text to export. Run the pipeline first.</p>' : `
        <div class="export-controls">
          <button onclick="icpExport()" class="btn btn-primary">Generate Export Package</button>
        </div>
      `}
      ${manifest ? `
        <div class="export-manifest">
          <h4>Run Manifest</h4>
          <div class="manifest-meta">
            <span>Run ID: ${manifest.run_id}</span>
            <span>Created: ${manifest.created_at}</span>
          </div>
        </div>
      ` : ''}
      <div id="export-result"></div>
    </div>
  `;
}

async function icpExport() {
  try {
    const data = await icpPost(`/export/${icpState.currentSessionId}`, {});
    const result = document.getElementById('export-result');
    if (result && data.export) {
      const prose = data.export.final_prose || '(empty)';
      const endnotes = data.export.endnotes || '';
      const bibliography = data.export.bibliography || '';
      const qg = data.quality_gates;

      result.innerHTML = `
        <h4>Final Prose</h4>
        <div class="export-prose">${escapeHtml(prose)}</div>
        ${endnotes ? `
          <h4>Endnotes</h4>
          <div class="export-endnotes">${escapeHtml(endnotes)}</div>
        ` : ''}
        ${bibliography ? `
          <h4>Bibliography</h4>
          <div class="export-bibliography">${escapeHtml(bibliography)}</div>
        ` : ''}
        <h4>Evidence Ledger (${(data.export.evidence_ledger || '').split('\n').filter(Boolean).length} bindings)</h4>
        <h4>Methodology Trace (${(data.export.methodology_trace || '').split('\n').filter(Boolean).length} events)</h4>
        ${qg ? `
          <div class="export-quality-detail">
            <h4>Quality Gate Summary</h4>
            <div class="export-quality-badges">
              ${qg.citation_enforcement ? `<span class="export-qg-badge ${qg.citation_enforcement.passed ? 'qg-pass' : 'qg-fail'}">Citations: ${qg.citation_enforcement.passed ? 'Passed' : 'Failed'} (${qg.citation_enforcement.corrections} corrections, ${qg.citation_enforcement.hallucinations_caught} hallucinations caught)</span>` : ''}
              ${qg.gauntlet ? `<span class="export-qg-badge ${qg.gauntlet.passed ? 'qg-pass' : 'qg-fail'}">Gauntlet: ${(qg.gauntlet.overall_score * 100).toFixed(0)}% (${qg.gauntlet.stages_passed}/${qg.gauntlet.total_stages} stages)</span>` : ''}
            </div>
          </div>
        ` : ''}
        <button onclick="icpDownloadExport()" class="btn btn-secondary">Download as JSON</button>
      `;
      window._lastExport = data.export;
    }
  } catch (err) {
    showICPError('Export failed: ' + err.message);
  }
}

function icpDownloadExport() {
  if (!window._lastExport) return;
  const blob = new Blob([JSON.stringify(window._lastExport, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `icp-export-${icpState.currentSessionId?.slice(0, 8) || 'unknown'}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// =============================================================================
// PANEL 10: EVENTS LOG
// =============================================================================

function renderEventsPanel(container, session) {
  const events = session.event_log || [];

  container.innerHTML = `
    <div class="icp-events">
      <h3>Session Events (${events.length})</h3>
      <div class="events-filter">
        <label><input type="checkbox" id="events-user-only" onchange="icpFilterEvents()" /> User-visible only</label>
        <select id="events-category-filter" onchange="icpFilterEvents()">
          <option value="">All categories</option>
          <option value="evidence">Evidence</option>
          <option value="policy">Policy</option>
          <option value="generation">Generation</option>
          <option value="staleness">Staleness</option>
          <option value="verification">Verification</option>
          <option value="export">Export</option>
        </select>
      </div>
      <div id="events-list" class="events-list">
        ${events.map(e => `
          <div class="event-entry" data-visible="${e.user_visible}" data-category="${e.category}">
            <span class="event-time">${new Date(e.ts).toLocaleTimeString()}</span>
            <span class="event-actor badge-${safeAttr(e.actor)}">${escapeHtml(e.actor)}</span>
            <span class="event-action">${escapeHtml(e.action)}</span>
            <span class="event-severity badge-severity-${safeAttr(e.severity)}">${escapeHtml(e.severity)}</span>
            <span class="event-summary">${escapeHtml(e.payload_summary)}</span>
          </div>
        `).join('') || '<p class="muted">No events yet</p>'}
      </div>
    </div>
  `;
}

function icpFilterEvents() {
  const userOnly = document.getElementById('events-user-only')?.checked;
  const category = document.getElementById('events-category-filter')?.value || '';

  document.querySelectorAll('.event-entry').forEach(entry => {
    let show = true;
    if (userOnly && entry.dataset.visible !== 'true') show = false;
    if (category && entry.dataset.category !== category) show = false;
    entry.style.display = show ? '' : 'none';
  });
}

// =============================================================================
// UTILITIES
// =============================================================================

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function safeAttr(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/'/g, '&#39;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showICPError(msg) {
  console.error('[ICP]', msg);
  // Show a brief toast notification
  const toast = document.createElement('div');
  toast.className = 'icp-toast error';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
