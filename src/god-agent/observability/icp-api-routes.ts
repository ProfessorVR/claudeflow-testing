/**
 * ICP API Routes — REST endpoints for Interactive Composition Pipeline
 *
 * Provides session management, evidence retrieval, verification,
 * binding, generation, and export endpoints.
 *
 * @module icp-api-routes
 */

import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import type {
  ICPSession,
  SourceScopeSpec,
  VerificationStatus,
  OCRPatch,
  PatchReasonTag,
  ClaimBinding,
  SupportKind,
  ExportPackage,
  QuoteSpan,
} from '../core/composition/icp-types.js';
import { createICPSession, emitSessionEvent } from '../core/composition/icp-types.js';
import {
  emitVerificationEvent,
  emitRetrievalEvent,
  emitPatchEvent,
} from '../core/composition/icp-session-events.js';
import { createComponentLogger } from '../core/observability/logger.js';
import { PromptDecomposer } from '../core/composition/prompt-decomposer.js';
import { FacetedRetrieval } from '../retrieval/faceted-retrieval.js';
import { QuoteRanker } from '../core/composition/quote-ranker.js';
import { AutoVerifier } from '../core/composition/auto-verifier.js';
import { SmartRetrievalLayer } from '../retrieval/smart-retrieval-layer.js';
import { StyleProfileManager } from '../universal/style-profile.js';
import { ICPProviderFactory, type ICPFactoryResult } from '../core/composition/icp-provider-factory.js';
import {
  buildGoldStandardPrompt,
  type GoldStandardPromptOptions,
} from '../universal/gold-standard-prompt-builder.js';
import { GOLD_STANDARD_CONFIG } from '../universal/gold-standard-config.js';
import { loadDomainConfig } from '../universal/domain-config.js';
import { ICPOrchestrator } from '../core/composition/icp-orchestrator.js';

// Load .env for ANTHROPIC_API_KEY (Fix 26: shell may have truncated key; .env has full 108-char key)
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      // Always prefer .env value — shell may have truncated API keys
      if (value) {
        process.env[key] = value;
      }
    }
  }
} catch { /* env loading is best-effort */ }

const log = createComponentLogger('ICP-API');

let _styleManager: StyleProfileManager | null = null;
function getStyleManager(): StyleProfileManager {
  if (!_styleManager) {
    _styleManager = new StyleProfileManager();
  }
  return _styleManager;
}

let _factoryResult: ICPFactoryResult | null = null;
async function getFactoryResult(): Promise<ICPFactoryResult> {
  if (!_factoryResult) {
    _factoryResult = await ICPProviderFactory.create(new SmartRetrievalLayer(), {
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return _factoryResult;
}

// =============================================================================
// SESSION STORE (in-memory for MVP)
// =============================================================================

const sessions = new Map<string, ICPSession>();

let _orchestrator: ICPOrchestrator | null = null;
async function getOrchestrator(): Promise<ICPOrchestrator> {
  if (!_orchestrator) {
    const factory = await getFactoryResult();
    _orchestrator = new ICPOrchestrator(factory.deps, factory.orchestratorConfig);
  }
  return _orchestrator;
}

// Diagnostic: check factory state (temporary)
const _envKeyLength = process.env.ANTHROPIC_API_KEY?.length ?? 0;
log.info('ICP API routes loaded', { envKeyLength: _envKeyLength, cwd: process.cwd() });

/**
 * Get a session or return 404.
 */
function getSession(sessionId: string, res: Response): ICPSession | null {
  const session = sessions.get(sessionId);
  if (!session) {
    res.status(404).json({ error: 'Session not found', sessionId });
    return null;
  }
  return session;
}

// =============================================================================
// SERIALIZATION HELPERS
// =============================================================================

/**
 * Serialize an ICPSession for JSON transport.
 * Maps and Sets must be converted to arrays/objects.
 */
function serializeSession(session: ICPSession): Record<string, unknown> {
  // Serialize PromptSpec Maps to objects
  const promptSpec = {
    ...session.prompt_spec,
    retrieval_lexicon: Object.fromEntries(session.prompt_spec.retrieval_lexicon),
    success_criteria: Object.fromEntries(session.prompt_spec.success_criteria),
  };

  // Serialize facets (evidence_policy_for_kind is a Map)
  const facets = session.facets.map(f => ({
    ...f,
    evidence_policy_for_kind: Object.fromEntries(f.evidence_policy_for_kind),
  }));

  return {
    session_id: session.session_id,
    prompt_spec: promptSpec,
    source_scope: session.source_scope,
    facets,
    quote_spans: session.quote_spans,
    atoms: session.atoms,
    bindings: session.bindings,
    hypothesis_claims: session.hypothesis_claims,
    paragraph_plan: session.paragraph_plan,
    paragraph_ledger: session.paragraph_ledger,
    sentence_scopes: session.sentence_scopes,
    generated_text: Object.fromEntries(session.generated_text),
    review_results: session.review_results,
    stress_test_report: session.stress_test_report,
    writing_contract: session.writing_contract,
    active_quote_set: session.active_quote_set
      ? {
          quotes: session.active_quote_set.quotes,
          pinned: Array.from(session.active_quote_set.pinned),
          boosted: Array.from(session.active_quote_set.boosted),
          demoted: Array.from(session.active_quote_set.demoted),
          excluded: Array.from(session.active_quote_set.excluded),
        }
      : undefined,
    claim_map: session.claim_map,
    run_manifest: session.run_manifest,
    event_log: session.event_log,
    atom_migrations: session.atom_migrations,
    facet_migrations: session.facet_migrations,
    canonical_registry_snapshot: session.canonical_registry_snapshot
      ? {
          ...session.canonical_registry_snapshot,
          verified_canonical_spans: Object.fromEntries(
            session.canonical_registry_snapshot.verified_canonical_spans,
          ),
        }
      : undefined,
    revision: session.revision,
    created_at: session.created_at,
    updated_at: session.updated_at,
    style_profile_id: session.style_profile_id,
    style_prompt: session.style_prompt,
    desired_word_count: session.desired_word_count,
    draft_category: session.draft_category,
    corpus_folder: session.corpus_folder,
    quality_gates: session.quality_gates,
    pipeline_phase: session.pipeline_phase,
    investigation_results: session.investigation_results,
    section_summaries: session.section_summaries,
    trajectory_id: session.trajectory_id,
    adapter_config: session.adapter_config,
    corrected_text: session.corrected_text ? Object.fromEntries(session.corrected_text) : undefined,
  };
}

// =============================================================================
// ROUTE FACTORY
// =============================================================================

/**
 * Create the ICP API router.
 * Mount at `/api/icp` in the parent express app.
 * @param options Optional server reference for WebSocket streaming + abort
 */
export interface ICPRouterOptions {
  server?: {
    createICPEmitter(sessionId: string): (event: string, data: unknown) => void;
    createICPAbortController(sessionId: string): AbortSignal;
    cleanupICPAbortController(sessionId: string): void;
  };
}

export function createICPRouter(options?: ICPRouterOptions): Router {
  const router = Router();

  // =========================================================================
  // DIAGNOSTICS (temporary)
  // =========================================================================

  router.get('/diagnostics', async (_req: Request, res: Response) => {
    try {
      const factory = await getFactoryResult();
      // Quick test: raw HTTPS fetch to Anthropic
      let testResult = 'not_tested';
      try {
        const testResp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY || '',
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Say OK' }],
          }),
        });
        const body = await testResp.text();
        testResult = `status=${testResp.status}, body=${body.slice(0, 200)}`;
      } catch (testErr: any) {
        testResult = `fetch_error: ${testErr.message}, cause: ${testErr.cause?.message ?? 'none'}`;
      }
      res.json({
        envKeyLength: process.env.ANTHROPIC_API_KEY?.length ?? 0,
        cwd: process.cwd(),
        availableBackends: factory.availableBackends,
        routerType: factory.router?.constructor?.name,
        hasDecomposer: !!factory.deps.llmDecomposer,
        hasGeneration: !!factory.deps.generationProvider,
        testCall: testResult,
      });
    } catch (err: any) {
      res.json({ error: err.message, envKeyLength: process.env.ANTHROPIC_API_KEY?.length ?? 0 });
    }
  });

  // =========================================================================
  // CORPUS FOLDER DISCOVERY
  // =========================================================================

  /**
   * GET /api/icp/corpus-folders — List available corpus subfolders
   */
  router.get('/corpus-folders', async (_req: Request, res: Response) => {
    try {
      const chromaUrl = process.env.CHROMA_URL || 'http://localhost:8001';
      const folders = new Set<string>();

      try {
        const colResp = await fetch(
          `${chromaUrl}/api/v2/tenants/default_tenant/databases/default_database/collections`,
          { signal: AbortSignal.timeout(5000) },
        );
        if (!colResp.ok) throw new Error(`Collections list: HTTP ${colResp.status}`);
        const collections = await colResp.json() as Array<{ id: string; name: string }>;
        const kc = collections.find(c => c.name === 'knowledge_chunks');
        if (!kc) throw new Error('knowledge_chunks collection not found');

        // Sample first 200 chunks for collection metadata
        const getResp = await fetch(
          `${chromaUrl}/api/v2/tenants/default_tenant/databases/default_database/collections/${kc.id}/get`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limit: 200, include: ['metadatas'] }),
            signal: AbortSignal.timeout(10000),
          },
        );
        if (!getResp.ok) throw new Error(`Get metadatas: HTTP ${getResp.status}`);
        const data = await getResp.json() as { metadatas?: Array<Record<string, unknown>> };
        for (const meta of data.metadatas || []) {
          if (meta?.collection && typeof meta.collection === 'string') {
            folders.add(meta.collection);
          }
        }

        // Collections are clustered — sample the tail too if only 1 found
        if (folders.size <= 1) {
          const countResp = await fetch(
            `${chromaUrl}/api/v2/tenants/default_tenant/databases/default_database/collections/${kc.id}/count`,
            { signal: AbortSignal.timeout(5000) },
          );
          if (countResp.ok) {
            const total = await countResp.json() as number;
            if (total > 200) {
              const tailResp = await fetch(
                `${chromaUrl}/api/v2/tenants/default_tenant/databases/default_database/collections/${kc.id}/get`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ limit: 200, offset: Math.max(0, total - 200), include: ['metadatas'] }),
                  signal: AbortSignal.timeout(10000),
                },
              );
              if (tailResp.ok) {
                const tailData = await tailResp.json() as { metadatas?: Array<Record<string, unknown>> };
                for (const meta of tailData.metadatas || []) {
                  if (meta?.collection && typeof meta.collection === 'string') {
                    folders.add(meta.collection);
                  }
                }
              }
              // Also sample middle
              if (folders.size <= 2 && total > 600) {
                const midResp = await fetch(
                  `${chromaUrl}/api/v2/tenants/default_tenant/databases/default_database/collections/${kc.id}/get`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ limit: 200, offset: Math.floor(total / 2), include: ['metadatas'] }),
                    signal: AbortSignal.timeout(10000),
                  },
                );
                if (midResp.ok) {
                  const midData = await midResp.json() as { metadatas?: Array<Record<string, unknown>> };
                  for (const meta of midData.metadatas || []) {
                    if (meta?.collection && typeof meta.collection === 'string') {
                      folders.add(meta.collection);
                    }
                  }
                }
              }
            }
          }
        }
      } catch (chromaErr: any) {
        log.warn('ChromaDB corpus folder discovery failed, falling back to filesystem', { error: chromaErr.message });
        const corpusDir = path.join(process.cwd(), 'corpus');
        if (fs.existsSync(corpusDir)) {
          const entries = fs.readdirSync(corpusDir, { withFileTypes: true });
          for (const e of entries) {
            if (e.isDirectory()) folders.add(e.name);
          }
        }
      }

      res.json({ folders: [...folders].sort() });
    } catch (error: any) {
      log.error('Failed to list corpus folders', error);
      res.status(500).json({ error: 'Failed to list corpus folders', details: error.message });
    }
  });

  // =========================================================================
  // DOCUMENT LOOKUP & PDF PAGE RENDERING
  // =========================================================================

  // Cache manifest lookups: doc_id → manifest entry
  let _manifestCache: Map<string, Record<string, unknown>> | null = null;
  function loadManifest(): Map<string, Record<string, unknown>> {
    if (_manifestCache) return _manifestCache;
    _manifestCache = new Map();
    const manifestPath = path.join(process.cwd(), 'scripts', 'ingest', 'manifest.jsonl');
    if (!fs.existsSync(manifestPath)) return _manifestCache;
    const lines = fs.readFileSync(manifestPath, 'utf-8').split('\n').filter(l => l.trim());
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.doc_id) _manifestCache.set(entry.doc_id, entry);
      } catch { /* skip malformed lines */ }
    }
    return _manifestCache;
  }

  /**
   * GET /api/icp/doc-info/:docId — Resolve doc_id to document metadata
   */
  router.get('/doc-info/:docId', (_req: Request, res: Response) => {
    try {
      const manifest = loadManifest();
      const entry = manifest.get(_req.params.docId);
      if (!entry) {
        res.status(404).json({ error: 'Document not found in manifest', docId: _req.params.docId });
        return;
      }
      res.json({
        doc_id: entry.doc_id,
        path_rel: entry.path_rel,
        collection: entry.collection,
        meta: entry.meta,
        chunks: entry.chunks,
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to look up document', details: error.message });
    }
  });

  /**
   * GET /api/icp/pdf-page/:docId/:page — Render a PDF page as PNG image
   * Optional query param: ?highlight=text — highlights matching text on the page
   */
  router.get('/pdf-page/:docId/:page', async (req: Request, res: Response) => {
    try {
      const manifest = loadManifest();
      const entry = manifest.get(req.params.docId);
      if (!entry) {
        res.status(404).json({ error: 'Document not found', docId: req.params.docId });
        return;
      }

      const pdfPath = path.join(process.cwd(), 'corpus', entry.path_rel as string);
      if (!fs.existsSync(pdfPath)) {
        res.status(404).json({ error: 'PDF file not found', path: entry.path_rel });
        return;
      }

      const pageNum = parseInt(req.params.page, 10);
      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({ error: 'Invalid page number' });
        return;
      }

      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const os = await import('os');
      const execFileAsync = promisify(execFile);

      const highlightText = typeof req.query.highlight === 'string' ? req.query.highlight : '';
      const bboxesParam = typeof req.query.bboxes === 'string' ? req.query.bboxes : '';
      const tmpOutput = path.join(os.tmpdir(), `icp-pdf-${req.params.docId}-${pageNum}-${Date.now()}.png`);

      if (highlightText) {
        // Use PyMuPDF to render with highlighted text (searches adjacent pages too)
        // Falls back to chunk-level bboxes (light blue) if text search fails
        const scriptPath = path.join(process.cwd(), 'scripts', 'pdf', 'highlight-page.py');
        const scriptArgs = [
          scriptPath, pdfPath, String(pageNum), tmpOutput, highlightText, '300',
        ];
        if (bboxesParam) {
          scriptArgs.push('--fallback-bboxes', bboxesParam);
        }
        const { stdout } = await execFileAsync('python3', scriptArgs, { timeout: 20000 });
        // If text was found on an adjacent page, include that info in a header
        const foundMatch = stdout.match(/FOUND_ON_PAGE:(\d+)/);
        if (foundMatch) {
          res.setHeader('X-ICP-Actual-Page', foundMatch[1]);
        }
        // Forward match type: 'text', 'bbox-fallback', or 'none'
        const matchType = stdout.includes('MATCH_TYPE:text') ? 'text'
          : stdout.includes('MATCH_TYPE:bbox-fallback') ? 'bbox-fallback'
          : 'none';
        res.setHeader('X-ICP-Match-Type', matchType);
      } else {
        // Use pdftoppm for plain rendering (no highlight)
        const tmpPrefix = path.join(os.tmpdir(), `icp-pdf-${req.params.docId}-${pageNum}`);
        await execFileAsync('pdftoppm', [
          '-png', '-f', String(pageNum), '-l', String(pageNum),
          '-r', '300', pdfPath, tmpPrefix,
        ], { timeout: 15000 });

        // pdftoppm creates files like prefix-005.png (zero-padded page number)
        let pngPath = '';
        for (const pad of [
          String(pageNum).padStart(1, '0'),
          String(pageNum).padStart(2, '0'),
          String(pageNum).padStart(3, '0'),
          String(pageNum).padStart(4, '0'),
        ]) {
          const candidate = `${tmpPrefix}-${pad}.png`;
          if (fs.existsSync(candidate)) { pngPath = candidate; break; }
        }
        if (!pngPath) {
          const dir = path.dirname(tmpPrefix);
          const base = path.basename(tmpPrefix);
          const files = fs.readdirSync(dir).filter(f => f.startsWith(base) && f.endsWith('.png'));
          if (files.length > 0) pngPath = path.join(dir, files[0]);
        }
        if (!pngPath) {
          res.status(500).json({ error: 'PDF page rendering produced no output' });
          return;
        }
        // Rename to standardized path for consistent cleanup below
        fs.renameSync(pngPath, tmpOutput);
      }

      if (!fs.existsSync(tmpOutput)) {
        res.status(500).json({ error: 'PDF page rendering produced no output' });
        return;
      }

      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      const pngData = fs.readFileSync(tmpOutput);
      fs.unlinkSync(tmpOutput); // Clean up
      res.send(pngData);
    } catch (error: any) {
      log.error('Failed to render PDF page', error);
      res.status(500).json({ error: 'Failed to render PDF page', details: error.message });
    }
  });

  /**
   * GET /api/icp/pdf-meta/:docId/:page — Extract rich text formatting + footnotes from a PDF page
   * Query params: ?quote=text — the quote text to extract formatting for
   * Returns: { rich_text?: { html, spans }, footnotes?: [{ marker, text }] }
   */
  router.get('/pdf-meta/:docId/:page', async (req: Request, res: Response) => {
    try {
      const manifest = loadManifest();
      const entry = manifest.get(req.params.docId);
      if (!entry) {
        res.status(404).json({ error: 'Document not found', docId: req.params.docId });
        return;
      }

      const pdfPath = path.join(process.cwd(), 'corpus', entry.path_rel as string);
      if (!fs.existsSync(pdfPath)) {
        res.status(404).json({ error: 'PDF file not found', path: entry.path_rel });
        return;
      }

      const pageNum = parseInt(req.params.page, 10);
      if (isNaN(pageNum) || pageNum < 1) {
        res.status(400).json({ error: 'Invalid page number' });
        return;
      }

      const quoteText = typeof req.query.quote === 'string' ? req.query.quote : '';
      if (!quoteText) {
        res.status(400).json({ error: 'Missing quote query parameter' });
        return;
      }

      const { execFile } = await import('child_process');
      const { promisify } = await import('util');
      const os = await import('os');
      const execFileAsync = promisify(execFile);

      const scriptPath = path.join(process.cwd(), 'scripts', 'pdf', 'highlight-page.py');
      // Use /dev/null as output since we only want metadata, not the image
      const tmpOutput = path.join(os.tmpdir(), `icp-pdf-meta-${Date.now()}.png`);
      const { stdout } = await execFileAsync('python3', [
        scriptPath, pdfPath, String(pageNum), tmpOutput, quoteText, '150', '--extract-meta',
      ], { timeout: 20000 });

      // Clean up temp image
      try { fs.unlinkSync(tmpOutput); } catch { /* ignore */ }

      // Parse META: JSON from stdout
      const metaMatch = stdout.match(/META:(.+)/);
      if (metaMatch) {
        const meta = JSON.parse(metaMatch[1]);
        res.json(meta);
      } else {
        res.json({});
      }
    } catch (error: any) {
      log.error('Failed to extract PDF metadata', error);
      res.status(500).json({ error: 'Failed to extract PDF metadata', details: error.message });
    }
  });

  // =========================================================================
  // SESSION ENDPOINTS
  // =========================================================================

  /**
   * POST /api/icp/session — Create a new ICP session and run evidence pipeline
   * Body: { prompt: string, sourceScope?: SourceScopeSpec }
   *
   * Runs stages 1-4 of the ICP pipeline:
   *   1. Prompt decomposition → facets + PromptSpec
   *   2. Faceted retrieval → QuoteSpans
   *   3. Canonicalization + ranking → deduplicated ranked spans
   *   4. Auto-verification → verification statuses
   *
   * Graceful degradation: if embedding/ChromaDB services are unavailable,
   * returns the session with empty evidence + pipeline_stages showing failures.
   */
  router.post('/session', async (req: Request, res: Response) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({ error: 'Request body required' });
        return;
      }
      const { prompt, sourceScope, styleProfileId, desiredWordCount, draftCategory, corpusFolder } = req.body;

      if (!prompt || typeof prompt !== 'string') {
        res.status(400).json({ error: 'Missing required field: prompt' });
        return;
      }

      const sessionId = randomUUID();
      const scope: SourceScopeSpec = sourceScope || {
        mode: 'corpus' as const,
        corpus_config: { collections: [], min_relevance: 0.6, max_chunks: 20 },
        doc_authority_policy: {
          version: '1.0.0',
          tiers: { peer_reviewed_journal: 1, edited_volume_chapter: 2, monograph: 2, web_source: 4 },
        },
      };

      // Inject corpus folder into collections for folder-scoped retrieval
      if (corpusFolder && typeof corpusFolder === 'string') {
        if (!scope.corpus_config) {
          scope.corpus_config = { collections: [], min_relevance: 0.6, max_chunks: 20 };
        }
        scope.corpus_config.collections = [corpusFolder];
      }

      // Track pipeline stage outcomes
      const pipelineStages: Array<{ stage: string; status: 'completed' | 'failed' | 'skipped'; detail?: string }> = [];

      // --- Stage 1: Prompt Decomposition ---
      let factory: ICPFactoryResult | null = null;
      let promptSpec;
      try {
        factory = await getFactoryResult();
        const decomposer = new PromptDecomposer(factory.deps.retrieval, factory.deps.llmDecomposer);
        promptSpec = await decomposer.decompose(prompt);
        pipelineStages.push({ stage: 'decompose', status: 'completed', detail: `${promptSpec.required_facets.length} required, ${promptSpec.optional_facets.length} optional facets` });
      } catch (decomposeErr: any) {
        log.warn('Pipeline stage 1 (decompose) failed, using minimal PromptSpec', { error: decomposeErr.message });
        // Fallback to minimal PromptSpec
        const lexicon = new Map<string, string[]>();
        lexicon.set('default', prompt.split(/\s+/).filter((w: string) => w.length > 3));
        const criteria = new Map<string, string>();
        criteria.set('default', `Address: ${prompt}`);
        promptSpec = {
          original_prompt: prompt,
          research_questions: [prompt],
          required_facets: [],
          optional_facets: [],
          retrieval_lexicon: lexicon,
          success_criteria: criteria,
        };
        pipelineStages.push({ stage: 'decompose', status: 'failed', detail: decomposeErr.message });
      }

      const session = createICPSession(sessionId, promptSpec, scope);
      sessions.set(sessionId, session);

      // Store generation metadata
      if (desiredWordCount) session.desired_word_count = desiredWordCount;
      if (draftCategory) session.draft_category = draftCategory;
      if (corpusFolder) session.corpus_folder = corpusFolder;

      // --- Style Profile Loading ---
      try {
        const mgr = getStyleManager();
        const stylePromptText = mgr.generateStylePrompt(styleProfileId || undefined);
        if (stylePromptText) {
          session.style_profile_id = styleProfileId || mgr.getActiveProfile()?.metadata.id;
          session.style_prompt = stylePromptText;
          pipelineStages.push({ stage: 'style', status: 'completed', detail: `Profile: ${session.style_profile_id}` });
        } else {
          pipelineStages.push({ stage: 'style', status: 'skipped', detail: 'No active style profile' });
        }
      } catch (styleErr: any) {
        log.warn('Style profile loading failed', { error: styleErr.message });
        pipelineStages.push({ stage: 'style', status: 'failed', detail: styleErr.message });
      }

      // --- Stage 2: Faceted Retrieval ---
      try {
        if (!factory) factory = await getFactoryResult();
        const facetedRetrieval = new FacetedRetrieval(factory.deps.retrieval);
        const retrievalResults = await facetedRetrieval.retrieveForAllFacets(promptSpec, scope);
        for (const result of retrievalResults) {
          session.quote_spans.push(...result.spans);
          emitRetrievalEvent(session, result.facet_id, result.spans.length);
        }
        pipelineStages.push({ stage: 'retrieve', status: 'completed', detail: `${session.quote_spans.length} spans from ${retrievalResults.length} facets` });
      } catch (retrieveErr: any) {
        log.warn('Pipeline stage 2 (retrieve) failed', { error: retrieveErr.message });
        pipelineStages.push({ stage: 'retrieve', status: 'failed', detail: retrieveErr.message });
      }

      // --- Stage 3: Canonicalization + Ranking ---
      if (session.quote_spans.length > 0) {
        try {
          const ranker = new QuoteRanker();
          const { ranked, activeSet } = ranker.canonicalizeAndRank(
            session.quote_spans,
            session.facets,
          );
          session.quote_spans = ranked;
          session.active_quote_set = activeSet;
          pipelineStages.push({ stage: 'rank', status: 'completed', detail: `${ranked.length} ranked spans` });
        } catch (rankErr: any) {
          log.warn('Pipeline stage 3 (rank) failed', { error: rankErr.message });
          pipelineStages.push({ stage: 'rank', status: 'failed', detail: rankErr.message });
        }
      } else {
        pipelineStages.push({ stage: 'rank', status: 'skipped', detail: 'No spans to rank' });
      }

      // --- Stage 4: Auto-Verification ---
      if (session.quote_spans.length > 0) {
        try {
          if (!factory) factory = await getFactoryResult();
          const verifier = new AutoVerifier(factory.orchestratorConfig.autoVerifierConfig);
          const spansByDoc = new Map<string, QuoteSpan[]>();
          for (const span of session.quote_spans) {
            if (!spansByDoc.has(span.doc_id)) spansByDoc.set(span.doc_id, []);
            spansByDoc.get(span.doc_id)!.push(span);
          }
          let verifiedCount = 0;
          for (const [_docId, docSpans] of spansByDoc) {
            const cleanText = docSpans.map(s => s.text).join(' ');
            const results = await verifier.verifyBatch(docSpans, cleanText, session.canonical_registry_snapshot);
            verifier.applyResults(docSpans, results);
            for (const [quoteId, result] of results) {
              emitVerificationEvent(session, quoteId, result.recommended_status);
              if (result.recommended_status === 'auto_verified') verifiedCount++;
            }
          }
          pipelineStages.push({ stage: 'verify', status: 'completed', detail: `${verifiedCount}/${session.quote_spans.length} auto-verified` });
        } catch (verifyErr: any) {
          log.warn('Pipeline stage 4 (verify) failed', { error: verifyErr.message });
          pipelineStages.push({ stage: 'verify', status: 'failed', detail: verifyErr.message });
        }
      } else {
        pipelineStages.push({ stage: 'verify', status: 'skipped', detail: 'No spans to verify' });
      }

      log.info('Created ICP session with pipeline', {
        sessionId,
        facets: session.facets.length,
        spans: session.quote_spans.length,
        stages: pipelineStages.map(s => `${s.stage}:${s.status}`).join(', '),
      });

      res.status(201).json({
        sessionId,
        session: serializeSession(session),
        pipeline_stages: pipelineStages,
      });
    } catch (error: any) {
      log.error('Failed to create ICP session', error);
      res.status(500).json({ error: 'Failed to create session', details: error.message });
    }
  });

  /**
   * GET /api/icp/session/:sessionId — Get full session state
   */
  router.get('/session/:sessionId', (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      res.json({
        session: serializeSession(session),
      });
    } catch (error: any) {
      log.error('Failed to get ICP session', error);
      res.status(500).json({ error: 'Failed to get session', details: error.message });
    }
  });

  /**
   * GET /api/icp/sessions — List all sessions (summary view)
   */
  router.get('/sessions', (_req: Request, res: Response) => {
    try {
      const summaries: Array<{
        sessionId: string;
        prompt: string;
        facetCount: number;
        quoteCount: number;
        atomCount: number;
        eventCount: number;
        hasGeneratedText: boolean;
      }> = [];

      sessions.forEach((session, sessionId) => {
        summaries.push({
          sessionId,
          prompt: session.prompt_spec.original_prompt.slice(0, 100),
          facetCount: session.facets.length,
          quoteCount: session.quote_spans.length,
          atomCount: session.atoms.length,
          eventCount: session.event_log.length,
          hasGeneratedText: session.generated_text.size > 0,
        });
      });

      res.json({ sessions: summaries });
    } catch (error: any) {
      log.error('Failed to list ICP sessions', error);
      res.status(500).json({ error: 'Failed to list sessions', details: error.message });
    }
  });

  /**
   * DELETE /api/icp/session/:sessionId — Delete a session
   */
  router.delete('/session/:sessionId', (req: Request, res: Response) => {
    try {
      const deleted = sessions.delete(req.params.sessionId);
      if (!deleted) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }
      res.json({ deleted: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete session', details: error.message });
    }
  });

  // =========================================================================
  // EVIDENCE ENDPOINTS
  // =========================================================================

  /**
   * POST /api/icp/retrieve/:sessionId — Trigger faceted retrieval
   * Body: { facetIds?: string[] }
   *
   * Re-runs retrieval for the session (or specific facets), adding new spans.
   * Also runs canonicalization + auto-verification on new spans.
   */
  router.post('/retrieve/:sessionId', async (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      const factory = await getFactoryResult();
      const facetedRetrieval = new FacetedRetrieval(factory.deps.retrieval);
      const retrievalResults = await facetedRetrieval.retrieveForAllFacets(
        session.prompt_spec,
        session.source_scope,
      );

      const newSpans: QuoteSpan[] = [];
      for (const result of retrievalResults) {
        newSpans.push(...result.spans);
        emitRetrievalEvent(session, result.facet_id, result.spans.length);
      }

      // Deduplicate: only add spans not already in the session
      const existingFingerprints = new Set(session.quote_spans.map(s => s.span_fingerprint));
      const uniqueNewSpans = newSpans.filter(s => !existingFingerprints.has(s.span_fingerprint));
      session.quote_spans.push(...uniqueNewSpans);

      // Re-rank all spans
      if (session.quote_spans.length > 0) {
        const ranker = new QuoteRanker();
        const { ranked, activeSet } = ranker.canonicalizeAndRank(
          session.quote_spans,
          session.facets,
        );
        session.quote_spans = ranked;
        session.active_quote_set = activeSet;
      }

      // Auto-verify new spans
      if (uniqueNewSpans.length > 0) {
        const verifier = new AutoVerifier(factory.orchestratorConfig.autoVerifierConfig);
        const spansByDoc = new Map<string, QuoteSpan[]>();
        for (const span of uniqueNewSpans) {
          if (!spansByDoc.has(span.doc_id)) spansByDoc.set(span.doc_id, []);
          spansByDoc.get(span.doc_id)!.push(span);
        }
        for (const [_docId, docSpans] of spansByDoc) {
          const cleanText = docSpans.map(s => s.text).join(' ');
          const results = await verifier.verifyBatch(docSpans, cleanText, session.canonical_registry_snapshot);
          verifier.applyResults(docSpans, results);
          for (const [quoteId, result] of results) {
            emitVerificationEvent(session, quoteId, result.recommended_status);
          }
        }
      }

      res.json({
        sessionId: req.params.sessionId,
        quote_spans: session.quote_spans,
        total: session.quote_spans.length,
        new_spans: uniqueNewSpans.length,
      });
    } catch (error: any) {
      log.error('Failed to retrieve', error);
      res.status(500).json({ error: 'Failed to retrieve', details: error.message });
    }
  });

  /**
   * POST /api/icp/verify — Update verification status
   * Body: { sessionId: string, quoteId: string, status: VerificationStatus, correctedText?: string }
   */
  router.post('/verify', (req: Request, res: Response) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({ error: 'Request body required' });
        return;
      }
      const { sessionId, quoteId, status, correctedText } = req.body;

      if (!sessionId || !quoteId || !status) {
        res.status(400).json({ error: 'Missing required fields: sessionId, quoteId, status' });
        return;
      }

      const session = sessions.get(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found', sessionId });
        return;
      }

      // Find the span
      const span = session.quote_spans.find(
        s => s.quote_id === quoteId || s.span_fingerprint === quoteId,
      );
      if (!span) {
        res.status(404).json({ error: 'Quote span not found', quoteId });
        return;
      }

      // Update status
      const validStatuses: VerificationStatus[] = [
        'auto_verified', 'human_verified', 'human_corrected',
        'stale_verified', 'flagged', 'auto_rejected', 'rejected',
      ];
      if (!validStatuses.includes(status)) {
        res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
        return;
      }

      span.verification_status = status;
      if (correctedText && status === 'human_corrected') {
        span.text = correctedText;
      }

      emitVerificationEvent(session, span.quote_id, status, 'user');

      res.json({
        quoteId: span.quote_id,
        span_fingerprint: span.span_fingerprint,
        canonical_fingerprint: span.canonical_fingerprint,
        status: span.verification_status,
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to verify', details: error.message });
    }
  });

  /**
   * POST /api/icp/patch — Submit OCR patch
   * Body: { sessionId: string, docId: string, beforeText: string, afterText: string, reasonTag: PatchReasonTag }
   */
  router.post('/patch', (req: Request, res: Response) => {
    try {
      if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({ error: 'Request body required' });
        return;
      }
      const { sessionId, docId, beforeText, afterText, reasonTag } = req.body;

      if (!sessionId || !docId || !beforeText || !afterText) {
        res.status(400).json({ error: 'Missing required fields: sessionId, docId, beforeText, afterText' });
        return;
      }

      const session = sessions.get(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found', sessionId });
        return;
      }

      const patch: OCRPatch = {
        patch_id: randomUUID(),
        doc_id: docId,
        page: req.body.page || 0,
        before_range: req.body.beforeRange || [0, beforeText.length] as [number, number],
        after_range: req.body.afterRange || [0, afterText.length] as [number, number],
        before_hash: '',
        after_hash: '',
        before_text: beforeText,
        after_text: afterText,
        reason_tag: (reasonTag as PatchReasonTag) || 'other',
        timestamp: new Date().toISOString(),
        author: 'user',
      };

      // Store patch in session event log via proper emitter
      emitPatchEvent(session, patch.patch_id, docId, []);

      res.status(201).json({
        patch,
        message: 'Patch recorded',
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to apply patch', details: error.message });
    }
  });

  // =========================================================================
  // BINDING ENDPOINTS
  // =========================================================================

  /**
   * POST /api/icp/bind/:sessionId — Create or modify ClaimBinding
   * Body: { atomIds: string[], quoteIds: string[], supportKind: SupportKind, warrantNote?: string }
   */
  router.post('/bind/:sessionId', (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      if (!req.body || typeof req.body !== 'object') {
        res.status(400).json({ error: 'Request body required' });
        return;
      }
      const { atomIds, quoteIds, supportKind, warrantNote } = req.body;

      if (!atomIds?.length || !quoteIds?.length || !supportKind) {
        res.status(400).json({ error: 'Missing required fields: atomIds, quoteIds, supportKind' });
        return;
      }

      const validSupportKinds: SupportKind[] = [
        'DIRECT_QUOTE', 'PARAPHRASE', 'INFERENCE',
      ];
      if (!validSupportKinds.includes(supportKind)) {
        res.status(400).json({
          error: `Invalid supportKind. Must be one of: ${validSupportKinds.join(', ')}`,
        });
        return;
      }

      const binding: ClaimBinding = {
        binding_id: randomUUID(),
        claim_id: '', // Will be derived from atoms
        atom_ids: atomIds,
        quote_ids: quoteIds,
        support_kind: supportKind as SupportKind,
        warrant_note: warrantNote || '',
        staleness_status: 'current',
      };

      session.bindings.push(binding);

      // Update atom bound_quote_ids
      for (const atom of session.atoms) {
        if (atomIds.includes(atom.atom_id)) {
          atom.bound_quote_ids.push(...quoteIds);
        }
      }

      res.status(201).json({ binding });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create binding', details: error.message });
    }
  });

  /**
   * DELETE /api/icp/bind/:sessionId/:bindingId — Remove a binding
   */
  router.delete('/bind/:sessionId/:bindingId', (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      const idx = session.bindings.findIndex(b => b.binding_id === req.params.bindingId);
      if (idx === -1) {
        res.status(404).json({ error: 'Binding not found' });
        return;
      }

      session.bindings.splice(idx, 1);
      res.json({ deleted: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete binding', details: error.message });
    }
  });

  // =========================================================================
  // PIPELINE STAGE ENDPOINTS
  // =========================================================================

  /**
   * POST /api/icp/stress-test/:sessionId — Trigger stress test
   */
  router.post('/stress-test/:sessionId', (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      // Return existing stress test report or indicate not yet run
      if (session.stress_test_report) {
        res.json({ report: session.stress_test_report });
      } else {
        res.json({
          message: 'Stress test not yet run. Use the full pipeline to trigger.',
          atoms: session.atoms.length,
          bindings: session.bindings.length,
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to run stress test', details: error.message });
    }
  });

  /**
   * POST /api/icp/generate/:sessionId — Trigger constrained generation
   */
  router.post('/generate/:sessionId', (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      // Return current generated text or indicate not yet generated
      if (session.generated_text.size > 0) {
        const text: Record<string, string> = {};
        session.generated_text.forEach((v, k) => { text[k] = v; });
        res.json({
          paragraphs: text,
          paragraphCount: session.generated_text.size,
          totalSentences: session.sentence_scopes.length,
          styleProfileId: session.style_profile_id,
          styleApplied: !!session.style_prompt,
        });
      } else {
        res.json({
          message: 'Text not yet generated. Use the full pipeline to trigger.',
          plan: session.paragraph_plan,
          styleProfileId: session.style_profile_id,
          styleApplied: !!session.style_prompt,
        });
      }
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to generate', details: error.message });
    }
  });

  // =========================================================================
  // GOLD STANDARD PROMPT BUILDER (unified with CLI pipeline)
  // =========================================================================

  /**
   * POST /api/icp/build-gold-prompt/:sessionId — Build a gold-standard prompt
   *
   * Uses the SAME buildGoldStandardPrompt() as the CLI pipeline, ensuring
   * identical MLA citation rules, style profile injection, grounding constraints,
   * source diversity requirements, and structural relationships.
   *
   * Body params (all optional — sensible defaults from session):
   *   - wordTarget: string (e.g., "3,000-3,500")
   *   - subsections: string[] (section titles; auto-derived from topic if omitted)
   *   - knowledgeUnits: string[]
   *   - structuralEdges: string[]
   *   - preventionPlan: { blacklistedAuthors, strengthenedConstraints, underCitedSources, overCitedSources }
   *   - sectionConstraints: string[]
   */
  router.post('/build-gold-prompt/:sessionId', async (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      const {
        wordTarget = session.desired_word_count || '3,000-3,500',
        subsections,
        knowledgeUnits = [],
        structuralEdges = [],
        preventionPlan,
        sectionConstraints = [],
      } = req.body || {};

      // Convert session quote_spans to ContextChunk format for the prompt builder
      const chunks = session.quote_spans.map((span, idx) => {
        const pageNum = Array.isArray(span.page) ? span.page[0] : (span.page ?? 0);
        const pageEnd = Array.isArray(span.page) ? span.page[1] : pageNum;
        return {
          id: span.quote_id || `chunk-${idx}`,
          content: span.text,
          relevanceScore: span.auto_confidence ?? 0.5,
          metadata: {
            author: span.doc_id.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Unknown',
            title: span.doc_id.split('/').pop()?.replace(/\.[^.]+$/, '') || 'Unknown',
            year: 0,
            page_start: pageNum,
            page_end: pageEnd,
            chunk_id: span.quote_id || `chunk-${idx}`,
          },
        };
      }) as any[];

      // Derive subsections from topic if not provided
      let finalSubsections = subsections;
      if (!finalSubsections || finalSubsections.length === 0) {
        // Try to extract from the prompt text (numbered lines or markdown headings)
        const lines = session.prompt_spec.original_prompt.split('\n').map((l: string) => l.trim()).filter(Boolean);
        finalSubsections = lines
          .filter((l: string) => /^\d+\.\s+/.test(l))
          .map((l: string) => l.replace(/^\d+\.\s+/, '').trim());
        if (finalSubsections.length === 0) {
          finalSubsections = lines
            .filter((l: string) => /^#{1,3}\s+/.test(l))
            .map((l: string) => l.replace(/^#{1,3}\s+/, '').trim());
        }
      }

      // Load reasoning edges if not provided
      let finalEdges = structuralEdges;
      if (finalEdges.length === 0) {
        try {
          const edgePath = path.join(process.cwd(), 'god-reason', 'reasoning.jsonl');
          if (fs.existsSync(edgePath)) {
            const edgeLines = fs.readFileSync(edgePath, 'utf-8').split('\n').filter(Boolean);
            const allEdges = edgeLines.map((l: string) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
            const topicLower = session.prompt_spec.original_prompt.toLowerCase();
            const topicTerms = topicLower.split(/\s+/).filter((t: string) => t.length > 3);
            const relevantEdges = allEdges.filter((e: any) => {
              const src = (e.source || '').toLowerCase().replace(/_/g, ' ');
              const tgt = (e.target || '').toLowerCase().replace(/_/g, ' ');
              return topicTerms.some((t: string) => src.includes(t) || tgt.includes(t) || t.includes(src) || t.includes(tgt));
            });
            relevantEdges.sort((a: any, b: any) => (b.corroboration_score || 1) - (a.corroboration_score || 1));
            finalEdges = relevantEdges.slice(0, 30).map((e: any) =>
              `- ${e.source} ${(e.relation || 'relates_to').toUpperCase()} ${e.target}` +
              (e.pipeline ? ` (${e.pipeline})` : '') +
              (e.corroboration_score && e.corroboration_score > 1 ? ` [corroborated]` : '')
            );
          }
        } catch { /* edge loading is best-effort */ }
      }

      // Load knowledge units if not provided
      let finalKUs = knowledgeUnits;
      if (finalKUs.length === 0) {
        try {
          const kuPath = path.join(process.cwd(), 'god-learn', 'knowledge.jsonl');
          if (fs.existsSync(kuPath)) {
            const kuLines = fs.readFileSync(kuPath, 'utf-8').split('\n').filter(Boolean);
            finalKUs = kuLines.slice(0, 10).map((l: string) => {
              try {
                const ku = JSON.parse(l);
                return `- [${ku.id}] ${ku.claim || ku.content || ''}`;
              } catch { return ''; }
            }).filter(Boolean);
          }
        } catch { /* KU loading is best-effort */ }
      }

      const promptOptions: GoldStandardPromptOptions = {
        topic: session.prompt_spec.original_prompt,
        subsections: finalSubsections,
        chunks,
        knowledgeUnits: finalKUs,
        structuralEdges: finalEdges,
        stylePrompt: session.style_prompt || '',
        wordTarget,
        preventionPlan,
        sectionConstraints,
      };

      const prompt = buildGoldStandardPrompt(promptOptions);

      res.json({
        prompt,
        metadata: {
          wordTarget,
          sectionCount: finalSubsections.length,
          chunkCount: chunks.length,
          knowledgeUnitCount: finalKUs.length,
          structuralEdgeCount: finalEdges.length,
          styleProfileApplied: !!session.style_prompt,
          promptLength: prompt.length,
          estimatedTokens: Math.ceil(prompt.length / 4),
        },
      });
    } catch (error: any) {
      log.error('Failed to build gold standard prompt', error);
      res.status(500).json({ error: 'Failed to build prompt', details: error.message });
    }
  });

  // =========================================================================
  // EXPORT ENDPOINTS
  // =========================================================================

  /**
   * POST /api/icp/export/:sessionId — Generate ExportPackage
   */
  router.post('/export/:sessionId', (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      // Assemble final prose from generated paragraphs
      const orderedParagraphs = session.paragraph_plan
        .sort((a, b) => a.paragraph_order - b.paragraph_order)
        .map(p => session.generated_text.get(p.paragraph_id))
        .filter((text): text is string => !!text);

      const finalProse = orderedParagraphs.join('\n\n');

      // Build evidence ledger as formatted string
      const ledgerLines = session.bindings.map(b =>
        `[${b.binding_id}] atoms:${b.atom_ids.join(',')} quotes:${b.quote_ids.join(',')} (${b.support_kind})`,
      );

      // Build methodology trace as formatted string
      const traceLines = session.event_log
        .filter(e => e.user_visible)
        .map(e => `[${e.ts}] ${e.actor}/${e.action}: ${e.payload_summary}`);

      // Serialize prompt_spec Maps for JSON export
      const serializedPromptSpec = {
        ...session.prompt_spec,
        retrieval_lexicon: Object.fromEntries(session.prompt_spec.retrieval_lexicon),
        success_criteria: Object.fromEntries(session.prompt_spec.success_criteria),
      };

      const exportPackage: ExportPackage = {
        final_prose: finalProse,
        endnotes: '',
        bibliography: '',
        claim_map_appendix: '',
        evidence_ledger: ledgerLines.join('\n'),
        paragraph_ledger: session.paragraph_ledger || { items: [], ledger_hash: '' },
        run_manifest: session.run_manifest || {
          run_id: randomUUID(),
          created_at: new Date().toISOString(),
          prompt_spec: serializedPromptSpec as any,
          source_scope: session.source_scope,
          corpus_hash: '',
          patch_epoch: 0,
          bindings: session.bindings,
          hypothesis_claims: session.hypothesis_claims,
          event_log_snapshot: session.event_log,
          atom_migrations_snapshot: session.atom_migrations,
          facet_migrations_snapshot: session.facet_migrations,
          policy_archive: { policy_refs: [] },
        },
        methodology_trace: traceLines.join('\n'),
      };

      res.json({
        export: exportPackage,
        quality_gates: session.quality_gates,
        review_results: session.review_results ? {
          passed: session.review_results.passed,
          failures: session.review_results.failures?.length ?? 0,
          claim_coverage: session.review_results.claim_coverage,
        } : undefined,
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to export', details: error.message });
    }
  });

  // =========================================================================
  // DIFF AND EVENTS ENDPOINTS
  // =========================================================================

  /**
   * GET /api/icp/events/:sessionId — Get session event log
   * Query: ?userVisible=true to filter to user-visible events
   */
  router.get('/events/:sessionId', (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      let events = session.event_log;
      if (req.query.userVisible === 'true') {
        events = events.filter(e => e.user_visible);
      }
      if (req.query.category) {
        events = events.filter(e => e.category === req.query.category);
      }

      res.json({
        sessionId: req.params.sessionId,
        events,
        total: events.length,
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get events', details: error.message });
    }
  });

  /**
   * GET /api/icp/corpus-diff/:runId1/:runId2 — Corpus version diff
   */
  router.get('/corpus-diff/:runId1/:runId2', (req: Request, res: Response) => {
    try {
      // MVP: return placeholder diff structure
      res.json({
        run1: req.params.runId1,
        run2: req.params.runId2,
        stale_bindings: [],
        affected_spans: [],
        impacted_claims: [],
        message: 'Corpus diff requires RunManifest comparison — implement with persistent storage',
      });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to compute diff', details: error.message });
    }
  });

  /**
   * GET /api/icp/facets/:sessionId — Get facets with coverage stats
   */
  router.get('/facets/:sessionId', (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      const facetsWithCoverage = session.facets.map(facet => {
        const facetAtoms = session.atoms.filter(a => a.facet_id === facet.facet_id);
        const boundAtoms = facetAtoms.filter(a => a.bound_quote_ids.length > 0);
        const verifiedSpans = session.quote_spans.filter(
          s => s.verification_status === 'auto_verified' ||
               s.verification_status === 'human_verified' ||
               s.verification_status === 'human_corrected',
        );

        return {
          ...facet,
          coverage: {
            atoms_total: facetAtoms.length,
            atoms_bound: boundAtoms.length,
            verified_spans: verifiedSpans.length,
          },
        };
      });

      res.json({ facets: facetsWithCoverage });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to get facets', details: error.message });
    }
  });

  /**
   * PUT /api/icp/facets/:sessionId/:facetId — Update facet settings
   * Body: { name?, description?, facet_role?, strictness_override?, allow_adds_atoms? }
   */
  router.put('/facets/:sessionId/:facetId', (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      const facet = session.facets.find(f => f.facet_id === req.params.facetId);
      if (!facet) {
        res.status(404).json({ error: 'Facet not found' });
        return;
      }

      const { name, description, facet_role, strictness_override, allow_adds_atoms } = req.body;
      if (name !== undefined) facet.name = name;
      if (description !== undefined) facet.description = description;
      if (facet_role !== undefined) facet.facet_role = facet_role;
      if (strictness_override !== undefined) facet.strictness_override = strictness_override;
      if (allow_adds_atoms !== undefined) facet.allow_adds_atoms = allow_adds_atoms;

      res.json({ facet });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update facet', details: error.message });
    }
  });

  // ===========================================================================
  // PIPELINE ENDPOINTS (migrated from ICPPipelineAdapter → ICPOrchestrator)
  // Quality gates: CitationEnforcer, author scrubbing, APA stripping,
  //   endnote leak stripping, prose sanitization (2-pass), quality gauntlet,
  //   endnote generation — all enforced in ICPOrchestrator.run()
  // ===========================================================================

  /**
   * POST /api/icp/adapter/generate/:sessionId — Run full ICP pipeline
   *
   * Runs the ICPOrchestrator 11-stage pipeline:
   *   decomposition → retrieval → verification → binding → generation →
   *   citation enforcement → author scrubbing → APA/endnote stripping →
   *   sanitization (2-pass) → quality gauntlet → endnotes → export
   */
  router.post('/adapter/generate/:sessionId', async (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      const orchestrator = await getOrchestrator();
      const prompt = session.prompt_spec.original_prompt || '';
      const sourceScope = session.source_scope;

      const result = await orchestrator.run(prompt, sourceScope);

      // Merge pipeline results into existing session
      session.generated_text = result.session.generated_text;
      session.quality_gates = result.session.quality_gates;
      session.review_results = result.session.review_results;
      session.quote_spans = result.session.quote_spans;
      session.atoms = result.session.atoms;
      session.bindings = result.session.bindings;
      session.paragraph_plan = result.session.paragraph_plan;
      session.paragraph_ledger = result.session.paragraph_ledger;
      session.sentence_scopes = result.session.sentence_scopes;
      session.run_manifest = result.session.run_manifest;
      session.event_log = result.session.event_log;
      (session as any).pipeline_phase = 'GENERATED';

      res.json({
        sessionId: req.params.sessionId,
        pipeline_phase: 'GENERATED',
        generated_text: Object.fromEntries(session.generated_text),
        quality_gates: session.quality_gates,
        review_results: session.review_results,
        success: result.success,
        block_reasons: result.blockReasons,
      });
    } catch (error: any) {
      log.error('Pipeline generate failed', error);
      res.status(500).json({ error: 'Pipeline generation failed', details: error.message });
    }
  });

  /**
   * POST /api/icp/adapter/regenerate/:sessionId — Re-run pipeline
   * Re-runs the full ICP pipeline for the same prompt.
   */
  router.post('/adapter/regenerate/:sessionId', async (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      const orchestrator = await getOrchestrator();
      const prompt = session.prompt_spec.original_prompt || '';
      const sourceScope = session.source_scope;

      const result = await orchestrator.run(prompt, sourceScope);

      // Merge regenerated results
      session.generated_text = result.session.generated_text;
      session.quality_gates = result.session.quality_gates;
      session.review_results = result.session.review_results;
      session.quote_spans = result.session.quote_spans;
      session.atoms = result.session.atoms;
      session.bindings = result.session.bindings;
      session.paragraph_plan = result.session.paragraph_plan;
      session.run_manifest = result.session.run_manifest;
      (session as any).pipeline_phase = 'REGENERATED';

      res.json({
        sessionId: req.params.sessionId,
        pipeline_phase: 'REGENERATED',
        generated_text: Object.fromEntries(session.generated_text),
        quality_gates: session.quality_gates,
      });
    } catch (error: any) {
      log.error('Pipeline regenerate failed', error);
      res.status(500).json({ error: 'Pipeline regeneration failed', details: error.message });
    }
  });

  /**
   * POST /api/icp/adapter/validate/:sessionId — Return quality gate results
   * Quality gates are now applied during generation via ICPOrchestrator.run().
   * This endpoint returns the already-computed gate results.
   */
  router.post('/adapter/validate/:sessionId', async (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      res.json({
        sessionId: req.params.sessionId,
        pipeline_phase: (session as any).pipeline_phase ?? session.pipeline_phase,
        quality_gates: session.quality_gates,
        generated_text: Object.fromEntries(session.generated_text),
      });
    } catch (error: any) {
      log.error('Validate query failed', error);
      res.status(500).json({ error: 'Validation query failed', details: error.message });
    }
  });

  /**
   * POST /api/icp/adapter/feedback/:sessionId — Submit user feedback
   * Body: { correctedText?: Record<string, string> }
   */
  router.post('/adapter/feedback/:sessionId', async (req: Request, res: Response) => {
    try {
      const session = getSession(req.params.sessionId, res);
      if (!session) return;

      if (req.body?.correctedText) {
        session.corrected_text = new Map(Object.entries(req.body.correctedText));
      }

      emitSessionEvent(session, {
        ts: new Date().toISOString(),
        actor: 'user',
        action: 'review_fail',
        payload_summary: 'User submitted feedback',
        affected_ids: [],
        severity: 'info',
        user_visible: true,
        category: 'generation',
      });

      res.json({
        sessionId: req.params.sessionId,
        trajectory_id: session.trajectory_id,
        message: 'Feedback submitted',
      });
    } catch (error: any) {
      log.error('Feedback failed', error);
      res.status(500).json({ error: 'Feedback submission failed', details: error.message });
    }
  });

  /**
   * GET /api/icp/adapter/cost-estimate — Estimate token cost for ICP pipeline
   * Query: sectionCount (default: 5)
   */
  router.get('/adapter/cost-estimate', (req: Request, res: Response) => {
    try {
      const sectionCount = parseInt(
        typeof req.query.sectionCount === 'string' ? req.query.sectionCount : '5', 10,
      );

      // Anthropic pricing (per million tokens, as of 2026-03)
      const model = 'claude-sonnet-4-5-20250929';
      const inputPricePerMillion = 3.0;
      const outputPricePerMillion = 15.0;

      const stages = [
        { name: 'Decomposition', estimatedTokens: 2000,
          estimatedCost: (2000 * inputPricePerMillion) / 1_000_000 },
        { name: 'Retrieval', estimatedTokens: 0, estimatedCost: 0 },
        { name: 'Verification', estimatedTokens: 3000,
          estimatedCost: (3000 * inputPricePerMillion) / 1_000_000 },
        { name: `Generation (${sectionCount} sections)`,
          estimatedTokens: (4000 + 6000) * sectionCount,
          estimatedCost: ((4000 * inputPricePerMillion + 6000 * outputPricePerMillion) / 1_000_000) * sectionCount },
        { name: 'Quality Gates', estimatedTokens: 0, estimatedCost: 0 },
      ];

      const totalTokens = stages.reduce((sum, s) => sum + s.estimatedTokens, 0);
      const totalCost = stages.reduce((sum, s) => sum + s.estimatedCost, 0);

      res.json({ estimate: { stages, totalTokens, totalCost, model } });
    } catch (error: any) {
      res.status(500).json({ error: 'Cost estimation failed', details: error.message });
    }
  });

  /**
   * GET /api/icp/adapter/config-defaults — Get pipeline defaults
   */
  router.get('/adapter/config-defaults', (_req: Request, res: Response) => {
    res.json({
      defaults: {
        autoVerifyOnly: true,
        defaultAtomsMode: 'analytics',
        defaultReverseCheckMode: 'warn',
      },
    });
  });

  return router;
}

/**
 * Get the session store for testing.
 */
export function getSessionStore(): Map<string, ICPSession> {
  return sessions;
}

/**
 * Clear all sessions (for testing).
 */
export function clearSessionStore(): void {
  sessions.clear();
}
