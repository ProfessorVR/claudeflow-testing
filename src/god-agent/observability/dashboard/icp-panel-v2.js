/**
 * ICP Dashboard V2 — Unified 4-Panel Workflow
 *
 * Panels: Prompt → Evidence → Quality → Export
 * Depth modes: Express (auto-verify, skip review) / Standard / Full (advanced drawer)
 * Backend: POST /adapter/generate/:sessionId with mode='full'|'from-evidence'
 *
 * @module icp-panel-v2
 */

/* global icpFetch, icpPost, escapeHtml, safeAttr, showICPError, icpConnectWebSocket,
   icpWsSubscribe, icpHandleWsEvent, icpLoadPdfPage, icpLoadPdfMeta, icpPdfZoom,
   icpPdfZoomReset, icpPdfFitWidth, icpApplyPdfZoom, icpPdfToggleFullscreen,
   icpPdfCurrentZoom, icpPdfIsFullscreen, icpEditFormat, icpEditJoinHyphen,
   icpEditCopyFromRichText */

// =============================================================================
// STATE
// =============================================================================

const v2 = {
  sessionId: null,
  session: null,
  depth: 'standard',
  panel: 'prompt',
  phase: 'idle',
  subProgress: '',
  creating: false,
  selectedQuotes: new Set(),
};

// =============================================================================
// HELPERS
// =============================================================================

function v2Fetch(path, opts = {}) {
  return icpFetch(path, opts);
}

function v2Post(path, body) {
  return icpPost(path, body);
}

function v2SaveState() {
  try {
    localStorage.setItem('icp-v2-depth', v2.depth);
    localStorage.setItem('icp-v2-panel', v2.panel);
  } catch { /* best-effort */ }
}

function v2LoadState() {
  try {
    v2.depth = localStorage.getItem('icp-v2-depth') || 'standard';
    v2.panel = localStorage.getItem('icp-v2-panel') || 'prompt';
  } catch { /* best-effort */ }
}

// =============================================================================
// INITIALIZATION
// =============================================================================

// eslint-disable-next-line no-unused-vars
function initV2Panel(container) {
  v2LoadState();

  container.innerHTML = `
    <div class="v2-root">
      <div class="v2-header">
        <h2>ICP Pipeline V2</h2>
        <div class="v2-session-controls">
          <select id="v2-session-select" onchange="v2SelectSession(this.value)">
            <option value="">Select session...</option>
          </select>
          <button class="btn btn-sm btn-secondary" onclick="v2LoadSessions()">Refresh</button>
        </div>
      </div>

      <div id="v2-progress-bar" class="v2-progress-bar"></div>

      <div class="v2-nav">
        <button class="v2-nav-btn active" data-panel="prompt" onclick="v2SwitchPanel('prompt')">Prompt</button>
        <button class="v2-nav-btn" data-panel="evidence" onclick="v2SwitchPanel('evidence')">Evidence</button>
        <button class="v2-nav-btn" data-panel="quality" onclick="v2SwitchPanel('quality')">Quality</button>
        <button class="v2-nav-btn" data-panel="export" onclick="v2SwitchPanel('export')">Export</button>
      </div>

      <div id="v2-panel-content" class="v2-panel-content"></div>

      <div id="v2-advanced-drawer" class="v2-advanced-drawer" style="display:none;">
        <div class="v2-drawer-header" onclick="v2ToggleDrawer()">
          <span>Advanced Diagnostics</span>
          <span id="v2-drawer-arrow">&#9660;</span>
        </div>
        <div id="v2-drawer-body" class="v2-drawer-body" style="display:none;"></div>
      </div>

      <div id="v2-footer" class="v2-footer"></div>
    </div>
  `;

  v2RenderProgressBar();
  v2LoadSessions();
  v2SwitchPanel(v2.panel);

  // Show advanced drawer by default in Full mode
  if (v2.depth === 'full') {
    document.getElementById('v2-advanced-drawer').style.display = '';
  }
}

// =============================================================================
// SESSION MANAGEMENT
// =============================================================================

async function v2LoadSessions() {
  try {
    const data = await v2Fetch('/sessions');
    const select = document.getElementById('v2-session-select');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Select session...</option>';
    for (const s of (data.sessions || [])) {
      const opt = document.createElement('option');
      opt.value = s.sessionId;
      opt.textContent = `${s.sessionId.slice(0, 8)}... (${s.quoteCount || 0} quotes)`;
      select.appendChild(opt);
    }
    if (current) select.value = current;
  } catch { /* ignore */ }
}

async function v2SelectSession(sessionId) {
  if (!sessionId) return;
  try {
    const data = await v2Fetch(`/session/${sessionId}`);
    v2.sessionId = sessionId;
    v2.session = data.session;
    v2.phase = v2.session.quality_gates ? 'complete' : (v2.session.quote_spans?.length > 0 ? 'reviewing' : 'idle');
    v2SwitchPanel(v2.panel);
  } catch (err) {
    showICPError('Failed to load session: ' + err.message);
  }
}

async function v2RefreshSession() {
  if (v2.sessionId) await v2SelectSession(v2.sessionId);
}

// =============================================================================
// PROGRESS BAR
// =============================================================================

function v2RenderProgressBar() {
  const bar = document.getElementById('v2-progress-bar');
  if (!bar) return;

  const phases = [
    { id: 'prepare', label: 'Prepare', panel: 'prompt' },
    { id: 'review', label: 'Review', panel: 'evidence' },
    { id: 'validate', label: 'Validate', panel: 'quality' },
    { id: 'export', label: 'Export', panel: 'export' },
  ];

  const phaseOrder = { idle: -1, preparing: 0, reviewing: 1, validating: 2, exporting: 3, complete: 4, error: -1 };
  const currentIdx = phaseOrder[v2.phase] ?? -1;

  bar.innerHTML = phases.map((p, i) => {
    let cls = 'v2-phase-pending';
    let icon = '&#9675;'; // ○
    if (i < currentIdx) { cls = 'v2-phase-done'; icon = '&#10003;'; } // ✓
    else if (i === currentIdx) { cls = 'v2-phase-active'; icon = '&#9679;'; } // ●

    const clickable = i < currentIdx ? `onclick="v2SwitchPanel('${p.panel}')" style="cursor:pointer;"` : '';
    return `<div class="v2-phase ${cls}" ${clickable}>
      <span class="v2-phase-icon">${icon}</span>
      <span class="v2-phase-label">${p.label}</span>
    </div>
    ${i < phases.length - 1 ? '<div class="v2-phase-connector"></div>' : ''}`;
  }).join('');

  // Sub-progress text
  if (v2.subProgress) {
    bar.innerHTML += `<div class="v2-sub-progress">${escapeHtml(v2.subProgress)}</div>`;
  }
}

function v2UpdatePhase(phase, subText) {
  v2.phase = phase;
  v2.subProgress = subText || '';
  v2RenderProgressBar();
}

// =============================================================================
// PANEL NAVIGATION
// =============================================================================

function v2SwitchPanel(panel) {
  v2.panel = panel;
  v2SaveState();

  // Update nav buttons
  document.querySelectorAll('.v2-nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.panel === panel);
  });

  const container = document.getElementById('v2-panel-content');
  if (!container) return;

  const renderers = {
    prompt: v2RenderPromptPanel,
    evidence: v2RenderEvidencePanel,
    quality: v2RenderQualityPanel,
    export: v2RenderExportPanel,
  };

  const render = renderers[panel];
  if (render) {
    render(container);
  } else {
    container.innerHTML = '<div class="v2-empty">Unknown panel</div>';
  }

  v2RenderFooter();
  v2RenderProgressBar();

  // Show/hide advanced drawer
  const drawer = document.getElementById('v2-advanced-drawer');
  if (drawer) {
    drawer.style.display = (v2.depth === 'full' && v2.session) ? '' : 'none';
  }
}

// =============================================================================
// FOOTER NAVIGATION
// =============================================================================

function v2RenderFooter() {
  const footer = document.getElementById('v2-footer');
  if (!footer) return;

  const buttons = [];

  if (v2.panel === 'evidence' && v2.session) {
    const verified = (v2.session.quote_spans || []).filter(s =>
      s.verification_status === 'auto_verified' ||
      s.verification_status === 'human_verified' ||
      s.verification_status === 'human_corrected'
    ).length;
    const disabled = verified === 0 ? 'disabled' : '';
    buttons.push(`<button class="btn btn-primary v2-footer-btn" onclick="v2ProceedToQuality()" ${disabled}>
      Proceed to Quality Gates &rarr; <small>(${verified} verified quotes)</small>
    </button>`);
  }

  if (v2.panel === 'quality' && v2.session) {
    const hasGates = !!v2.session.quality_gates;
    buttons.push(`<button class="btn btn-primary v2-footer-btn" onclick="v2ProceedToExport()" ${hasGates ? '' : 'disabled'}>
      Proceed to Export &rarr;
    </button>`);
  }

  footer.innerHTML = buttons.length > 0
    ? `<div class="v2-footer-bar">${buttons.join('')}</div>`
    : '';
}

// =============================================================================
// PANEL 0: PROMPT
// =============================================================================

function v2RenderPromptPanel(container) {
  const depth = v2.depth;
  const btnLabel = depth === 'express' ? 'Run Full Pipeline' : 'Prepare Evidence';
  const btnDisabled = v2.creating ? 'disabled' : '';

  container.innerHTML = `
    <div class="v2-prompt-panel">
      <div class="v2-depth-selector">
        <label class="v2-depth-card ${depth === 'express' ? 'selected' : ''}" onclick="v2SetDepth('express')">
          <input type="radio" name="v2-depth" value="express" ${depth === 'express' ? 'checked' : ''}>
          <strong>Express</strong>
          <span>Auto-verify, skip review. One click to export.</span>
        </label>
        <label class="v2-depth-card ${depth === 'standard' ? 'selected' : ''}" onclick="v2SetDepth('standard')">
          <input type="radio" name="v2-depth" value="standard" ${depth === 'standard' ? 'checked' : ''}>
          <strong>Standard</strong>
          <span>Review evidence before generating.</span>
        </label>
        <label class="v2-depth-card ${depth === 'full' ? 'selected' : ''}" onclick="v2SetDepth('full')">
          <input type="radio" name="v2-depth" value="full" ${depth === 'full' ? 'checked' : ''}>
          <strong>Full</strong>
          <span>All panels, advanced diagnostics.</span>
        </label>
      </div>

      <div class="v2-form-group">
        <label for="v2-prompt">Research Question / Topic</label>
        <textarea id="v2-prompt" class="v2-textarea" rows="5" placeholder="Enter your research topic or thesis question...">${v2.session?.prompt_spec?.original_prompt || ''}</textarea>
      </div>

      <div class="v2-options-grid">
        <div class="v2-form-group">
          <label for="v2-source-mode">Source Mode</label>
          <select id="v2-source-mode">
            <option value="corpus" selected>Corpus Only</option>
            <option value="hybrid">Hybrid</option>
            <option value="external">External</option>
          </select>
        </div>
        <div class="v2-form-group">
          <label for="v2-min-relevance">Min Relevance</label>
          <input type="number" id="v2-min-relevance" value="0.5" min="0" max="1" step="0.05">
        </div>
        <div class="v2-form-group">
          <label for="v2-max-chunks">Max Chunks</label>
          <input type="number" id="v2-max-chunks" value="20" min="1" max="100">
        </div>
        <div class="v2-form-group">
          <label for="v2-word-count">Word Count Target</label>
          <select id="v2-word-count">
            <option value="1000-2000">1,000-2,000</option>
            <option value="2000-2500">2,000-2,500</option>
            <option value="3000-3500" selected>3,000-3,500</option>
            <option value="4000-5000">4,000-5,000</option>
          </select>
        </div>
        <div class="v2-form-group">
          <label for="v2-draft-category">Draft Category</label>
          <select id="v2-draft-category">
            <option value="section" selected>Section</option>
            <option value="chapter">Chapter</option>
            <option value="paper">Paper</option>
            <option value="essay">Essay</option>
          </select>
        </div>
      </div>

      <div class="v2-actions">
        <button class="btn btn-primary v2-run-btn" onclick="v2RunPipeline()" ${btnDisabled}>
          &#9654; ${btnLabel}
        </button>
        ${depth !== 'express' ? '<button class="btn btn-secondary" onclick="v2RunToEvidenceOnly()">Run to Evidence Only</button>' : ''}
      </div>

      <div id="v2-pipeline-status" class="v2-status"></div>

      ${v2.session ? v2RenderSessionInfo() : ''}
    </div>
  `;
}

function v2RenderSessionInfo() {
  const s = v2.session;
  if (!s) return '';
  return `
    <div class="v2-session-info">
      <h4>Current Session</h4>
      <div class="v2-info-grid">
        <div><strong>ID:</strong> ${s.session_id?.slice(0, 12) || 'N/A'}</div>
        <div><strong>Facets:</strong> ${s.facets?.length || 0}</div>
        <div><strong>Quotes:</strong> ${s.quote_spans?.length || 0}</div>
        <div><strong>Phase:</strong> ${(s.pipeline_phase || v2.phase).toUpperCase()}</div>
      </div>
    </div>
  `;
}

function v2SetDepth(mode) {
  v2.depth = mode;
  v2SaveState();
  v2SwitchPanel('prompt');
}

// =============================================================================
// PIPELINE EXECUTION
// =============================================================================

async function v2RunPipeline() {
  const prompt = document.getElementById('v2-prompt')?.value?.trim();
  if (!prompt) { showICPError('Enter a research topic.'); return; }

  v2.creating = true;
  v2UpdatePhase('preparing', 'Creating session...');
  v2SwitchPanel('prompt'); // re-render to disable button

  const statusEl = document.getElementById('v2-pipeline-status');
  if (statusEl) statusEl.textContent = 'Creating session and retrieving evidence...';

  try {
    // Stage 1: Create session (runs stages 1-4: decompose, retrieve, rank, verify)
    const sourceMode = document.getElementById('v2-source-mode')?.value || 'corpus';
    const minRel = parseFloat(document.getElementById('v2-min-relevance')?.value || '0.5');
    const maxChunks = parseInt(document.getElementById('v2-max-chunks')?.value || '20', 10);
    const wordCount = document.getElementById('v2-word-count')?.value || '3000-3500';
    const draftCategory = document.getElementById('v2-draft-category')?.value || 'section';

    const createData = await v2Post('/session', {
      prompt,
      sourceScope: {
        mode: sourceMode,
        corpus_config: { collections: [], min_relevance: minRel, max_chunks: maxChunks },
        doc_authority_policy: { version: '1.0.0', tiers: { peer_reviewed_journal: 1, edited_volume_chapter: 2, monograph: 2, web_source: 4 } },
      },
      desiredWordCount: wordCount,
      draftCategory,
    });

    v2.sessionId = createData.sessionId;
    v2.session = createData.session;

    // Update session dropdown
    const select = document.getElementById('v2-session-select');
    if (select) {
      const opt = document.createElement('option');
      opt.value = createData.sessionId;
      opt.textContent = `${createData.sessionId.slice(0, 8)}... (new)`;
      opt.selected = true;
      select.appendChild(opt);
    }

    if (v2.depth === 'express') {
      // Express: auto-verify >= 0.85, reject < 0.85, then generate
      v2UpdatePhase('preparing', 'Auto-verifying evidence...');
      await v2ExpressAutoVerify();

      // Check if any evidence survived
      const verified = v2.session.quote_spans.filter(s =>
        s.verification_status === 'auto_verified' || s.verification_status === 'human_verified'
      );

      if (verified.length === 0) {
        throw new Error('Insufficient evidence — no quotes met the 0.85 confidence threshold. Switch to Standard mode for manual review.');
      }

      // Generate from evidence
      v2UpdatePhase('validating', 'Generating and validating...');
      await v2GenerateFromEvidence();
      v2UpdatePhase('complete', '');
      v2.creating = false;
      v2SwitchPanel('export');
    } else {
      // Standard/Full: land on Evidence panel
      v2UpdatePhase('reviewing', '');
      v2.creating = false;
      v2SwitchPanel('evidence');
    }
  } catch (err) {
    v2.creating = false;
    v2UpdatePhase('error', err.message);
    if (statusEl) statusEl.textContent = 'Error: ' + err.message;
    showICPError(err.message);
    v2SwitchPanel('prompt');
  }
}

async function v2RunToEvidenceOnly() {
  // Same as Standard mode run — just creates session and lands on Evidence
  const prevDepth = v2.depth;
  v2.depth = 'standard';
  await v2RunPipeline();
  v2.depth = prevDepth;
}

async function v2ExpressAutoVerify() {
  if (!v2.session?.quote_spans) return;

  for (const span of v2.session.quote_spans) {
    const confidence = span.auto_confidence ?? 0;
    const newStatus = confidence >= 0.85 ? 'auto_verified' : 'rejected';

    if (span.verification_status !== newStatus) {
      try {
        await v2Post('/verify', {
          sessionId: v2.sessionId,
          quoteId: span.quote_id,
          status: newStatus,
        });
        span.verification_status = newStatus;
      } catch { /* best-effort */ }
    }
  }
}

async function v2GenerateFromEvidence() {
  const data = await v2Post(`/adapter/generate/${v2.sessionId}`, { mode: 'from-evidence' });
  // Refresh session to get updated data
  await v2RefreshSession();
  return data;
}

async function v2GenerateFull() {
  const data = await v2Post(`/adapter/generate/${v2.sessionId}`, { mode: 'full' });
  await v2RefreshSession();
  return data;
}

// =============================================================================
// PANEL 1: EVIDENCE
// =============================================================================

function v2RenderEvidencePanel(container) {
  const session = v2.session;
  if (!session) {
    container.innerHTML = '<div class="v2-empty">No session loaded. Go to Prompt to start.</div>';
    return;
  }

  const spans = session.quote_spans || [];
  const verified = spans.filter(s => ['auto_verified', 'human_verified', 'human_corrected'].includes(s.verification_status));
  const pending = spans.filter(s => s.verification_status === 'flagged');
  const rejected = spans.filter(s => ['auto_rejected', 'rejected'].includes(s.verification_status));

  container.innerHTML = `
    <div class="v2-evidence-panel">
      <div class="v2-evidence-toolbar">
        <div class="v2-toolbar-left">
          <button class="btn btn-sm btn-secondary" onclick="v2SelectAllQuotes()">Select All</button>
          <button class="btn btn-sm btn-secondary" onclick="v2DeselectAllQuotes()">Deselect All</button>
          <button class="btn btn-sm btn-verify" onclick="v2VerifySelected()">Verify Selected</button>
          <button class="btn btn-sm btn-reject" onclick="v2RejectSelected()">Reject Selected</button>
          <button class="btn btn-sm" onclick="v2VerifyAllAutoVerified()" style="background:#1565c0;">Verify All Auto-verified</button>
        </div>
        <div class="v2-toolbar-right">
          <select id="v2-evidence-filter" onchange="v2FilterEvidence()">
            <option value="all">All (${spans.length})</option>
            <option value="verified">Verified (${verified.length})</option>
            <option value="pending">Pending (${pending.length})</option>
            <option value="rejected">Rejected (${rejected.length})</option>
          </select>
          <select id="v2-evidence-sort" onchange="v2SortEvidence()">
            <option value="confidence">By Confidence</option>
            <option value="source">By Source</option>
            <option value="page">By Page</option>
          </select>
        </div>
      </div>

      <div class="v2-evidence-counts">
        <span class="v2-count-verified">${verified.length} verified</span>
        <span class="v2-count-pending">${pending.length} pending</span>
        <span class="v2-count-rejected">${rejected.length} rejected</span>
      </div>

      <div id="v2-evidence-cards" class="v2-evidence-cards">
        ${v2RenderEvidenceCards(spans)}
      </div>
    </div>
  `;

  v2.selectedQuotes.clear();
}

function v2RenderEvidenceCards(spans) {
  const sorted = [...spans].sort((a, b) => (b.auto_confidence || 0) - (a.auto_confidence || 0));

  return sorted.map(span => {
    const status = span.verification_status || 'flagged';
    const confidence = ((span.auto_confidence || 0) * 100).toFixed(0);
    const statusColors = {
      auto_verified: '#4caf50', human_verified: '#2196f3', human_corrected: '#ff9800',
      flagged: '#ff5722', auto_rejected: '#f44336', rejected: '#9e9e9e', stale_verified: '#ffeb3b',
    };
    const color = statusColors[status] || '#666';
    const text = (span.text || '').slice(0, 200) + (span.text?.length > 200 ? '...' : '');
    const docId = (span.doc_id || '').slice(0, 15);
    const page = typeof span.page === 'number' ? span.page : (span.page?.[0] || '?');

    return `<div class="v2-quote-card" data-quote-id="${safeAttr(span.quote_id)}" data-status="${status}">
      <div class="v2-quote-header">
        <input type="checkbox" class="v2-quote-checkbox" data-quote-id="${safeAttr(span.quote_id)}"
               onchange="v2ToggleQuoteSelect('${safeAttr(span.quote_id)}', this.checked)">
        <span class="v2-status-badge" style="background:${color};">${status.replace(/_/g, ' ')}</span>
        <span class="v2-confidence">${confidence}%</span>
      </div>
      <div class="v2-quote-text" onclick="v2OpenProvenance('${safeAttr(span.quote_id)}')">${escapeHtml(text)}</div>
      <div class="v2-quote-meta">
        <span>${escapeHtml(docId)}</span> &middot; <span>p. ${page}</span>
      </div>
      <div class="v2-quote-actions">
        <button class="btn btn-sm btn-verify" onclick="v2VerifyQuote('${safeAttr(span.quote_id)}', 'human_verified')">Verify</button>
        <button class="btn btn-sm btn-reject" onclick="v2VerifyQuote('${safeAttr(span.quote_id)}', 'rejected')">Reject</button>
        <button class="btn btn-sm btn-flag" onclick="v2VerifyQuote('${safeAttr(span.quote_id)}', 'flagged')">Flag</button>
      </div>
    </div>`;
  }).join('');
}

// Evidence actions
function v2ToggleQuoteSelect(quoteId, checked) {
  if (checked) v2.selectedQuotes.add(quoteId);
  else v2.selectedQuotes.delete(quoteId);
}

function v2SelectAllQuotes() {
  document.querySelectorAll('.v2-quote-checkbox').forEach(cb => {
    cb.checked = true;
    v2.selectedQuotes.add(cb.dataset.quoteId);
  });
}

function v2DeselectAllQuotes() {
  document.querySelectorAll('.v2-quote-checkbox').forEach(cb => { cb.checked = false; });
  v2.selectedQuotes.clear();
}

async function v2VerifySelected() {
  if (v2.selectedQuotes.size === 0) { showICPError('No quotes selected.'); return; }
  for (const qid of v2.selectedQuotes) {
    await v2VerifyQuote(qid, 'human_verified');
  }
  v2.selectedQuotes.clear();
  await v2RefreshSession();
  v2SwitchPanel('evidence');
}

async function v2RejectSelected() {
  if (v2.selectedQuotes.size === 0) { showICPError('No quotes selected.'); return; }
  for (const qid of v2.selectedQuotes) {
    await v2VerifyQuote(qid, 'rejected');
  }
  v2.selectedQuotes.clear();
  await v2RefreshSession();
  v2SwitchPanel('evidence');
}

async function v2VerifyAllAutoVerified() {
  if (!v2.session?.quote_spans) return;
  const autoVerified = v2.session.quote_spans.filter(s =>
    s.verification_status === 'auto_verified' && (s.auto_confidence || 0) >= 0.85
  );
  if (autoVerified.length === 0) { showICPError('No auto-verified quotes above 0.85 threshold.'); return; }

  for (const span of autoVerified) {
    await v2VerifyQuote(span.quote_id, 'human_verified');
  }
  await v2RefreshSession();
  v2SwitchPanel('evidence');
}

async function v2VerifyQuote(quoteId, status) {
  try {
    await v2Post('/verify', { sessionId: v2.sessionId, quoteId, status });
    // Update local state
    if (v2.session?.quote_spans) {
      const span = v2.session.quote_spans.find(s => s.quote_id === quoteId);
      if (span) span.verification_status = status;
    }
  } catch (err) {
    showICPError('Verify failed: ' + err.message);
  }
}

function v2FilterEvidence() {
  const filter = document.getElementById('v2-evidence-filter')?.value || 'all';
  document.querySelectorAll('.v2-quote-card').forEach(card => {
    const status = card.dataset.status;
    let show = true;
    if (filter === 'verified') show = ['auto_verified', 'human_verified', 'human_corrected'].includes(status);
    else if (filter === 'pending') show = status === 'flagged';
    else if (filter === 'rejected') show = ['auto_rejected', 'rejected'].includes(status);
    card.style.display = show ? '' : 'none';
  });
}

function v2SortEvidence() {
  // Re-render with new sort
  if (!v2.session) return;
  const sort = document.getElementById('v2-evidence-sort')?.value || 'confidence';
  const spans = [...(v2.session.quote_spans || [])];

  if (sort === 'confidence') spans.sort((a, b) => (b.auto_confidence || 0) - (a.auto_confidence || 0));
  else if (sort === 'source') spans.sort((a, b) => (a.doc_id || '').localeCompare(b.doc_id || ''));
  else if (sort === 'page') {
    spans.sort((a, b) => {
      const pa = typeof a.page === 'number' ? a.page : a.page?.[0] || 0;
      const pb = typeof b.page === 'number' ? b.page : b.page?.[0] || 0;
      return pa - pb;
    });
  }

  const cardsEl = document.getElementById('v2-evidence-cards');
  if (cardsEl) cardsEl.innerHTML = v2RenderEvidenceCards(spans);
}

// =============================================================================
// PROCEED TO QUALITY (Standard/Full mode generation trigger)
// =============================================================================

async function v2ProceedToQuality() {
  v2UpdatePhase('validating', 'Generating text and running quality gates...');
  v2SwitchPanel('quality');

  try {
    await v2GenerateFromEvidence();
    v2UpdatePhase('complete', '');
    v2SwitchPanel('quality');
  } catch (err) {
    v2UpdatePhase('error', err.message);
    showICPError('Generation failed: ' + err.message);
  }
}

function v2ProceedToExport() {
  // Check for failing gates
  const gates = v2.session?.quality_gates || {};
  const failing = [];
  if (gates.gauntlet && !gates.gauntlet.passed) failing.push('Quality Gauntlet');
  if (gates.citation_enforcement && !gates.citation_enforcement.passed) failing.push('Citation Enforcement');

  if (failing.length > 0) {
    const proceed = confirm(
      `The following quality gates are failing:\n\n- ${failing.join('\n- ')}\n\nProceed to Export anyway? (Override will be logged)`
    );
    if (!proceed) return;

    // Log override
    if (v2.session) {
      v2Post('/adapter/feedback/' + v2.sessionId, {}).catch(() => {});
    }
  }

  v2UpdatePhase('exporting', '');
  v2SwitchPanel('export');
}

// =============================================================================
// PANEL 2: QUALITY
// =============================================================================

function v2RenderQualityPanel(container) {
  const session = v2.session;
  if (!session) {
    container.innerHTML = '<div class="v2-empty">No session loaded.</div>';
    return;
  }

  const gates = session.quality_gates || {};
  const hasGates = Object.keys(gates).length > 0;

  if (!hasGates) {
    container.innerHTML = `
      <div class="v2-quality-panel">
        <div class="v2-empty">
          Quality gates not yet computed. ${v2.phase === 'validating' ? 'Generating...' : 'Run the pipeline from Evidence to see results.'}
        </div>
        ${v2.phase === 'validating' ? '<div class="v2-spinner"></div>' : ''}
      </div>
    `;
    return;
  }

  const gateCards = [];

  // Citation Enforcement
  if (gates.citation_enforcement) {
    const g = gates.citation_enforcement;
    gateCards.push(v2GateCard('Citation Enforcement', g.passed, [
      `Action: ${g.action || 'N/A'}`,
      `Total citations: ${g.total_citations || 0}`,
      `Corrections: ${g.corrections || 0}`,
      `Hallucinations caught: ${g.hallucinations_caught || 0}`,
    ]));
  }

  // Quality Gauntlet
  if (gates.gauntlet) {
    const g = gates.gauntlet;
    const score = ((g.overall_score || 0) * 100).toFixed(0);
    const stages = (g.stage_results || []).map(s =>
      `<div class="v2-gauntlet-stage">
        <span>${escapeHtml(s.name)}</span>
        <div class="v2-stage-bar"><div class="v2-stage-fill" style="width:${(s.score * 100).toFixed(0)}%;background:${s.passed ? '#4caf50' : '#f44336'};"></div></div>
        <span>${(s.score * 100).toFixed(0)}%</span>
      </div>`
    ).join('');

    gateCards.push(v2GateCard(`Quality Gauntlet (${score}%)`, g.passed, [
      `Stages: ${g.stages_passed || 0}/${g.total_stages || 0}`,
      `Critical issues: ${g.critical_issues || 0}`,
      `Revision required: ${g.revision_required ? 'Yes' : 'No'}`,
    ], stages));
  }

  // Sanitization
  if (gates.sanitization) {
    gateCards.push(v2GateCard('Prose Sanitization', true, [
      `Artifacts removed: ${gates.sanitization.artifacts_removed || 0}`,
      `Passes: ${gates.sanitization.passes || 0}`,
    ]));
  }

  // Endnotes
  if (gates.endnotes) {
    gateCards.push(v2GateCard('Endnotes', true, [
      `Total: ${gates.endnotes.total || 0}`,
      `Sources: ${(gates.endnotes.sources_used || []).length}`,
    ]));
  }

  // Author Scrubbing
  if (gates.author_scrubbing) {
    gateCards.push(v2GateCard('Author Scrubbing', gates.author_scrubbing.removedCount === 0, [
      `Removed: ${gates.author_scrubbing.removedCount || 0}`,
      `Authors: ${(gates.author_scrubbing.removedAuthors || []).join(', ') || 'None'}`,
    ]));
  }

  // APA Stripping
  if (gates.apa_stripping) {
    gateCards.push(v2GateCard('APA Citation Stripping', true, [
      `Stripped: ${gates.apa_stripping.strippedCount || 0}`,
    ]));
  }

  // Investigation traces (merged from old Investigation panel)
  let investigationHtml = '';
  if (session.investigation_results) {
    const inv = session.investigation_results;
    investigationHtml = `
      <div class="v2-investigation-section">
        <h4 onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? '' : 'none';"
            style="cursor:pointer;">
          Investigation Traces &#9660;
        </h4>
        <div style="display:none;">
          ${inv.issues ? `<p>${inv.issues.length} issues found (${(inv.issues.filter(i => i.severity === 'critical') || []).length} critical)</p>` : ''}
          ${inv.preventionPlan?.blacklistedAuthors?.length ? `<p><strong>Blacklisted:</strong> ${inv.preventionPlan.blacklistedAuthors.join(', ')}</p>` : ''}
          ${inv.preventionPlan?.strengthenedConstraints?.length ? `<ul>${inv.preventionPlan.strengthenedConstraints.map(c => `<li>${escapeHtml(c)}</li>`).join('')}</ul>` : ''}
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="v2-quality-panel">
      <div class="v2-quality-grid">
        ${gateCards.join('')}
      </div>
      ${investigationHtml}
    </div>
  `;
}

function v2GateCard(name, passed, stats, expandedContent) {
  const icon = passed === true ? '&#10003;' : passed === false ? '&#10007;' : '&mdash;';
  const cls = passed === true ? 'v2-gate-pass' : passed === false ? 'v2-gate-fail' : 'v2-gate-na';
  const badge = passed === true ? 'PASSED' : passed === false ? 'FAILED' : 'N/A';

  return `<div class="v2-gate-card ${cls}">
    <div class="v2-gate-header">
      <span class="v2-gate-icon">${icon}</span>
      <span class="v2-gate-name">${escapeHtml(name)}</span>
      <span class="v2-gate-badge">${badge}</span>
    </div>
    <div class="v2-gate-stats">
      ${stats.map(s => `<div>${escapeHtml(s)}</div>`).join('')}
    </div>
    ${expandedContent ? `<div class="v2-gate-expanded">${expandedContent}</div>` : ''}
  </div>`;
}

// =============================================================================
// PANEL 3: EXPORT
// =============================================================================

function v2RenderExportPanel(container) {
  const session = v2.session;
  if (!session) {
    container.innerHTML = '<div class="v2-empty">No session loaded.</div>';
    return;
  }

  const genText = session.generated_text;
  let prose = '';
  if (genText instanceof Map) {
    prose = genText.get('full') || [...genText.values()].join('\n\n');
  } else if (genText && typeof genText === 'object') {
    prose = genText.full || Object.values(genText).join('\n\n');
  }

  if (!prose) {
    container.innerHTML = '<div class="v2-empty">No generated text yet. Run the pipeline first.</div>';
    return;
  }

  const wordCount = prose.split(/\s+/).filter(Boolean).length;

  // Simple markdown rendering (headers, bold, italic, paragraphs)
  const rendered = prose
    .replace(/^## (.+)$/gm, '<h3>$1</h3>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^/, '<p>').replace(/$/, '</p>');

  container.innerHTML = `
    <div class="v2-export-panel">
      <div class="v2-export-meta">
        <span><strong>${wordCount.toLocaleString()}</strong> words</span>
        ${session.quality_gates?.gauntlet ? `<span>Quality: <strong>${((session.quality_gates.gauntlet.overall_score || 0) * 100).toFixed(0)}%</strong></span>` : ''}
      </div>

      <div class="v2-export-actions">
        <button class="btn btn-primary" onclick="v2CopyExport()">Copy to Clipboard</button>
        <button class="btn btn-secondary" onclick="v2DownloadExport()">Download .md</button>
        <button class="btn btn-secondary" onclick="v2ModifyAndRegenerate()">Modify &amp; Regenerate</button>
        <button class="btn btn-secondary" onclick="v2StartOver()">Start Over</button>
      </div>

      <div class="v2-export-prose">${rendered}</div>

      <p class="v2-export-note">Paste into your document editor for formatting. LaTeX/DOCX export coming in V3.</p>
    </div>
  `;
}

function v2CopyExport() {
  const genText = v2.session?.generated_text;
  let prose = '';
  if (genText instanceof Map) prose = genText.get('full') || '';
  else if (genText) prose = genText.full || '';

  navigator.clipboard.writeText(prose).then(() => {
    showICPError('Copied to clipboard!'); // reuse toast (it's green-ish enough)
  }).catch(() => showICPError('Copy failed.'));
}

function v2DownloadExport() {
  const genText = v2.session?.generated_text;
  let prose = '';
  if (genText instanceof Map) prose = genText.get('full') || '';
  else if (genText) prose = genText.full || '';

  const blob = new Blob([prose], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `icp-export-${v2.sessionId?.slice(0, 8) || 'draft'}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function v2ModifyAndRegenerate() {
  // Return to Evidence (Standard/Full) or Prompt (Express), reset pipeline phases
  v2UpdatePhase('reviewing', '');
  if (v2.depth === 'express') {
    v2SwitchPanel('prompt');
  } else {
    v2SwitchPanel('evidence');
  }
}

function v2StartOver() {
  if (!confirm('Start a new session? The current session will be preserved but you will create a new one.')) return;
  v2.sessionId = null;
  v2.session = null;
  v2.phase = 'idle';
  v2.subProgress = '';
  v2.selectedQuotes.clear();
  v2SwitchPanel('prompt');
}

// =============================================================================
// PROVENANCE VIEWER
// =============================================================================

function v2OpenProvenance(quoteId) {
  if (!v2.session?.quote_spans) return;
  const span = v2.session.quote_spans.find(s => s.quote_id === quoteId);
  if (!span) return;

  // Reuse V1's quote detail modal (icpOpenQuoteDetail) if available
  if (typeof icpOpenQuoteDetail === 'function') {
    // Temporarily set V1 state so the modal works
    if (typeof icpState !== 'undefined') {
      icpState.currentSessionId = v2.sessionId;
      icpState.session = v2.session;
    }
    icpOpenQuoteDetail(quoteId);
    return;
  }

  // Fallback: simple provenance modal
  const page = typeof span.page === 'number' ? span.page : span.page?.[0] || 1;
  const docId = span.doc_id || '';

  const modal = document.createElement('div');
  modal.className = 'v2-provenance-overlay';
  modal.innerHTML = `
    <div class="v2-provenance-modal">
      <div class="v2-provenance-header">
        <h3>Source Provenance</h3>
        <button onclick="this.closest('.v2-provenance-overlay').remove()">&#10005;</button>
      </div>
      <div class="v2-provenance-body">
        <div class="v2-provenance-left">
          <div id="v2-provenance-pdf" class="v2-provenance-pdf">Loading PDF...</div>
        </div>
        <div class="v2-provenance-right">
          <div class="v2-provenance-status">
            <span class="v2-status-badge" style="background:${span.verification_status === 'human_verified' ? '#2196f3' : '#4caf50'};">
              ${(span.verification_status || '').replace(/_/g, ' ')}
            </span>
            <span>${((span.auto_confidence || 0) * 100).toFixed(0)}% confidence</span>
          </div>
          <div class="v2-provenance-quote">${escapeHtml(span.text || '')}</div>
          <div class="v2-provenance-meta">
            <div><strong>Document:</strong> ${escapeHtml(docId)}</div>
            <div><strong>Page:</strong> ${page}</div>
            ${span.source_anchor ? `<div><strong>Anchor:</strong> ${escapeHtml(span.source_anchor)}</div>` : ''}
          </div>
        </div>
      </div>
    </div>
  `;

  modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', handler); }
  });

  document.body.appendChild(modal);

  // Load PDF page
  const highlight = encodeURIComponent(span.text?.slice(0, 150) || '');
  fetch(`/api/icp/pdf-page/${encodeURIComponent(docId)}/${page}?highlight=${highlight}`)
    .then(r => r.ok ? r.blob() : Promise.reject(new Error('PDF load failed')))
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const pdfEl = document.getElementById('v2-provenance-pdf');
      if (pdfEl) pdfEl.innerHTML = `<img src="${url}" style="width:100%;" alt="PDF page ${page}">`;
    })
    .catch(() => {
      const pdfEl = document.getElementById('v2-provenance-pdf');
      if (pdfEl) pdfEl.innerHTML = '<div class="v2-empty">PDF not available</div>';
    });
}

// =============================================================================
// ADVANCED DRAWER
// =============================================================================

function v2ToggleDrawer() {
  const body = document.getElementById('v2-drawer-body');
  const arrow = document.getElementById('v2-drawer-arrow');
  if (!body) return;

  if (body.style.display === 'none') {
    body.style.display = '';
    if (arrow) arrow.innerHTML = '&#9650;';
    v2RenderAdvancedDrawer();
  } else {
    body.style.display = 'none';
    if (arrow) arrow.innerHTML = '&#9660;';
  }
}

function v2RenderAdvancedDrawer() {
  const body = document.getElementById('v2-drawer-body');
  if (!body || !v2.session) return;

  const s = v2.session;

  body.innerHTML = `
    <div class="v2-drawer-tabs">
      <button class="v2-drawer-tab active" onclick="v2ShowDrawerTab('binding', this)">Binding</button>
      <button class="v2-drawer-tab" onclick="v2ShowDrawerTab('stress', this)">Stress Test</button>
      <button class="v2-drawer-tab" onclick="v2ShowDrawerTab('planner', this)">Planner</button>
      <button class="v2-drawer-tab" onclick="v2ShowDrawerTab('heatmap', this)">Heatmap</button>
    </div>
    <div id="v2-drawer-content" class="v2-drawer-content">
      ${v2DrawerTab('binding', s)}
    </div>
  `;
}

function v2ShowDrawerTab(tab, btn) {
  document.querySelectorAll('.v2-drawer-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const content = document.getElementById('v2-drawer-content');
  if (content && v2.session) content.innerHTML = v2DrawerTab(tab, v2.session);
}

function v2DrawerTab(tab, session) {
  switch (tab) {
    case 'binding':
      return `<div class="v2-drawer-info">
        <p><strong>Bindings:</strong> ${session.bindings?.length || 0}</p>
        <p><strong>Atoms:</strong> ${session.atoms?.length || 0}</p>
        ${(session.bindings || []).slice(0, 10).map(b =>
          `<div class="v2-mini-card">Binding ${(b.binding_id || '').slice(0, 8)}: ${b.atom_ids?.length || 0} atoms, ${b.quote_ids?.length || 0} quotes (${b.support_kind})</div>`
        ).join('')}
        ${(session.bindings?.length || 0) > 10 ? `<div class="muted">...and ${session.bindings.length - 10} more</div>` : ''}
      </div>`;

    case 'stress':
      const report = session.stress_test_report;
      if (!report) return '<div class="v2-drawer-info">No stress test data available.</div>';
      return `<div class="v2-drawer-info">
        <p>Tested: ${report.summary?.total_tested || 0} | Passed: ${report.summary?.passed || 0} | Failed: ${report.summary?.failed || 0}</p>
      </div>`;

    case 'planner':
      const plan = session.paragraph_plan || [];
      if (plan.length === 0) return '<div class="v2-drawer-info">No paragraph plan available.</div>';
      return `<div class="v2-drawer-info">
        ${plan.map((p, i) => `<div class="v2-mini-card">P${i + 1}: ${p.atom_ids?.length || 0} atoms, ${p.required_quotes?.length || 0} quotes</div>`).join('')}
      </div>`;

    case 'heatmap':
      return '<div class="v2-drawer-info">Heatmap visualization requires generation data. Available after quality gate completion.</div>';

    default:
      return '<div class="v2-drawer-info">Unknown tab.</div>';
  }
}
