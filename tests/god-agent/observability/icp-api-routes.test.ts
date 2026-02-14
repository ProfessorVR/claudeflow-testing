/**
 * ICP API Routes — Unit Tests
 *
 * Tests for session management, evidence verification, binding operations,
 * export generation, event filtering, and facet management in the
 * Interactive Composition Pipeline API.
 *
 * Tests operate directly against the in-memory session store without HTTP,
 * exercising the exported helpers (getSessionStore, clearSessionStore)
 * and the createICPSession factory from icp-types.
 *
 * @module tests/observability/icp-api-routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import http from 'http';

// Mock pipeline components — they have their own dedicated test suites (510 tests).
// API route tests should focus on route handling, not pipeline internals.
vi.mock('../../../src/god-agent/retrieval/smart-retrieval-layer.js', () => ({
  SmartRetrievalLayer: vi.fn().mockImplementation(() => ({
    retrieveContext: vi.fn().mockRejectedValue(new Error('No ChromaDB in tests')),
  })),
}));

vi.mock('../../../src/god-agent/core/composition/prompt-decomposer.js', () => ({
  PromptDecomposer: vi.fn().mockImplementation(() => ({
    decompose: vi.fn().mockRejectedValue(new Error('Mocked: decomposer skipped in route tests')),
  })),
}));

vi.mock('../../../src/god-agent/retrieval/faceted-retrieval.js', () => ({
  FacetedRetrieval: vi.fn().mockImplementation(() => ({
    retrieveForAllFacets: vi.fn().mockResolvedValue([]),
  })),
}));

vi.mock('../../../src/god-agent/core/composition/quote-ranker.js', () => ({
  QuoteRanker: vi.fn().mockImplementation(() => ({
    canonicalizeAndRank: vi.fn().mockImplementation((spans: any[]) => ({
      clusters: [],
      ranked: spans,
      activeSet: { spans: new Set(spans.map((s: any) => s.quote_id)), version: 1, metadata: {} },
    })),
  })),
}));

vi.mock('../../../src/god-agent/core/composition/auto-verifier.js', () => ({
  AutoVerifier: vi.fn().mockImplementation(() => ({
    verifyBatch: vi.fn().mockReturnValue(new Map()),
    applyResults: vi.fn(),
  })),
}));

import {
  createICPRouter,
  getSessionStore,
  clearSessionStore,
} from '../../../src/god-agent/observability/icp-api-routes.js';
import {
  createICPSession,
  emitSessionEvent,
} from '../../../src/god-agent/core/composition/icp-types.js';
import type {
  ICPSession,
  PromptSpec,
  SourceScopeSpec,
  QuoteSpan,
  ClaimAtom,
  ClaimBinding,
  Facet,
  ICPSessionEvent,
  ParagraphPlanEntry,
} from '../../../src/god-agent/core/composition/icp-types.js';

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Create a minimal PromptSpec for testing.
 */
function makePromptSpec(prompt: string): PromptSpec {
  const lexicon = new Map<string, string[]>();
  lexicon.set('default', prompt.split(/\s+/).filter(w => w.length > 3));
  const criteria = new Map<string, string>();
  criteria.set('default', `Address: ${prompt}`);

  return {
    original_prompt: prompt,
    research_questions: [prompt],
    required_facets: [],
    optional_facets: [],
    retrieval_lexicon: lexicon,
    success_criteria: criteria,
  };
}

/**
 * Create a minimal SourceScopeSpec for testing.
 */
function makeSourceScope(): SourceScopeSpec {
  return {
    mode: 'corpus',
    corpus_config: { collections: [], min_relevance: 0.5, max_chunks: 20 },
    doc_authority_policy: {
      version: '1.0.0',
      tiers: { peer_reviewed_journal: 1, edited_volume_chapter: 2 },
    },
  };
}

/**
 * Create a test session and register it in the store.
 * Returns the session and its ID.
 */
function seedSession(prompt = 'Test prompt for unit tests'): { session: ICPSession; sessionId: string } {
  const sessionId = `test-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const session = createICPSession(sessionId, makePromptSpec(prompt), makeSourceScope());
  getSessionStore().set(sessionId, session);
  return { session, sessionId };
}

/**
 * Create a minimal QuoteSpan for testing.
 */
function makeQuoteSpan(overrides: Partial<QuoteSpan> = {}): QuoteSpan {
  const quoteId = overrides.quote_id ?? `quote-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    quote_id: quoteId,
    text_fingerprint: `fp-${quoteId}`,
    span_fingerprint: `span-fp-${quoteId}`,
    canonical_fingerprint: `canon-fp-${quoteId}`,
    doc_id: 'doc-001',
    page: 42,
    source_kind: 'CORPUS',
    clean_text_range: [0, 100],
    clean_range_hash: 'hash-abc',
    patch_epoch: 0,
    normalization_policy_version: '1.0.0',
    text: 'Aristotle argues that phantasia is a distinct faculty of the soul.',
    left_ctx_hash: 'left-hash',
    right_ctx_hash: 'right-hash',
    verification_status: 'auto_verified',
    provenance_scorecard: {
      fidelity_score: 0.95,
      ocr_risk_score: 0.1,
      cluster_size: 1,
      prior_usage_count: 0,
      doc_authority_tier: 1,
    },
    ...overrides,
  };
}

/**
 * Create a minimal ClaimAtom for testing.
 */
function makeAtom(overrides: Partial<ClaimAtom> = {}): ClaimAtom {
  const atomId = overrides.atom_id ?? `atom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    atom_id: atomId,
    atom_version_id: 1,
    display_text: 'Phantasia is a distinct faculty',
    semantic_text: 'phantasia is distinct faculty',
    modality: 'asserted',
    kind: 'corpus_claim',
    parent_claim_id: 'claim-001',
    evidence_mode: 'DIRECT_QUOTE',
    bound_quote_ids: [],
    facet_id: 'facet-001',
    ...overrides,
  };
}

/**
 * Create a minimal Facet for testing.
 */
function makeFacet(overrides: Partial<Facet> = {}): Facet {
  const facetId = overrides.facet_id ?? `facet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    facet_id: facetId,
    name: 'Test Facet',
    description: 'A facet used for testing',
    facet_role: 'core',
    evidence_policy_for_kind: new Map(),
    archived: false,
    ...overrides,
  };
}

/**
 * Create a minimal ICPSessionEvent for testing.
 */
function makeEvent(overrides: Partial<ICPSessionEvent> = {}): ICPSessionEvent {
  return {
    ts: new Date().toISOString(),
    actor: 'system',
    action: 'retrieve',
    payload_summary: 'Test event',
    affected_ids: [],
    session_revision: 1,
    severity: 'info',
    user_visible: true,
    category: 'evidence',
    ...overrides,
  };
}

/**
 * Send a request to the test Express app and return the parsed response.
 * Uses Node's built-in http module instead of supertest.
 */
function createTestApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/icp', createICPRouter());
  return app;
}

async function sendRequest(
  app: express.Application,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: Record<string, unknown>,
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (!addr || typeof addr === 'string') {
        server.close();
        reject(new Error('Failed to get server address'));
        return;
      }

      const port = addr.port;
      const payload = body ? JSON.stringify(body) : undefined;
      const options: http.RequestOptions = {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          server.close();
          let parsed: any;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode ?? 0, body: parsed });
        });
      });

      req.on('error', (err) => {
        server.close();
        reject(err);
      });

      if (payload) {
        req.write(payload);
      }
      req.end();
    });
  });
}

// =============================================================================
// TESTS
// =============================================================================

describe('ICP API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    clearSessionStore();
    app = createTestApp();
  });

  // ===========================================================================
  // 1. getSessionStore and clearSessionStore
  // ===========================================================================

  describe('getSessionStore / clearSessionStore', () => {
    it('should return the session Map', () => {
      const store = getSessionStore();
      expect(store).toBeInstanceOf(Map);
      expect(store.size).toBe(0);
    });

    it('should clear all sessions from the store', () => {
      const store = getSessionStore();
      const { sessionId } = seedSession();
      expect(store.size).toBe(1);

      clearSessionStore();
      expect(store.size).toBe(0);
      expect(store.has(sessionId)).toBe(false);
    });

    it('should be safe to call clearSessionStore on empty store', () => {
      expect(() => clearSessionStore()).not.toThrow();
      expect(getSessionStore().size).toBe(0);
    });
  });

  // ===========================================================================
  // 2. POST /session — session creation
  // ===========================================================================

  describe('POST /api/icp/session', () => {
    it('should create a session and store it', async () => {
      const res = await sendRequest(app, 'POST', '/api/icp/session', {
        prompt: 'Analyze the role of phantasia in Aristotle',
      });

      expect(res.status).toBe(201);
      expect(res.body.sessionId).toBeDefined();
      expect(typeof res.body.sessionId).toBe('string');
      expect(res.body.session).toBeDefined();
      expect(res.body.session.prompt_spec.original_prompt).toBe(
        'Analyze the role of phantasia in Aristotle',
      );

      // Verify it was actually stored
      const store = getSessionStore();
      expect(store.has(res.body.sessionId)).toBe(true);
    });

    it('should reject request with missing prompt', async () => {
      const res = await sendRequest(app, 'POST', '/api/icp/session', {});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('prompt');
    });

    it('should reject request with non-string prompt', async () => {
      const res = await sendRequest(app, 'POST', '/api/icp/session', {
        prompt: 12345 as any,
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('prompt');
    });

    it('should use provided sourceScope when given', async () => {
      const customScope: SourceScopeSpec = {
        mode: 'hybrid',
        corpus_config: { collections: ['aristotle'], min_relevance: 0.7, max_chunks: 50 },
        doc_authority_policy: { version: '2.0.0', tiers: { monograph: 1 } },
      };

      const res = await sendRequest(app, 'POST', '/api/icp/session', {
        prompt: 'Test with custom scope',
        sourceScope: customScope,
      });

      expect(res.status).toBe(201);
      const session = getSessionStore().get(res.body.sessionId)!;
      expect(session.source_scope.mode).toBe('hybrid');
      expect(session.source_scope.corpus_config?.min_relevance).toBe(0.7);
    });

    it('should populate retrieval_lexicon from prompt words longer than 3 chars', async () => {
      const res = await sendRequest(app, 'POST', '/api/icp/session', {
        prompt: 'The cat is on the mat today',
      });

      expect(res.status).toBe(201);
      const session = getSessionStore().get(res.body.sessionId)!;
      const defaultLexicon = session.prompt_spec.retrieval_lexicon.get('default');
      expect(defaultLexicon).toBeDefined();
      // "The" (3 chars) should be excluded, "today" (5) included
      expect(defaultLexicon).not.toContain('The');
      expect(defaultLexicon).not.toContain('cat');
      expect(defaultLexicon).not.toContain('the');
      expect(defaultLexicon).toContain('today');
    });
  });

  // ===========================================================================
  // 3. GET /session/:sessionId — session retrieval
  // ===========================================================================

  describe('GET /api/icp/session/:sessionId', () => {
    it('should return serialized session for valid ID', async () => {
      const { sessionId, session } = seedSession('Retrieve this session');

      const res = await sendRequest(app, 'GET', `/api/icp/session/${sessionId}`);

      expect(res.status).toBe(200);
      expect(res.body.session).toBeDefined();
      expect(res.body.session.session_id).toBe(sessionId);
      expect(res.body.session.prompt_spec.original_prompt).toBe('Retrieve this session');
    });

    it('should return 404 for non-existent session', async () => {
      const res = await sendRequest(app, 'GET', '/api/icp/session/nonexistent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Session not found');
    });

    it('should serialize Maps to plain objects', async () => {
      const { sessionId, session } = seedSession();
      session.generated_text.set('para-1', 'First paragraph text');
      session.generated_text.set('para-2', 'Second paragraph text');

      const res = await sendRequest(app, 'GET', `/api/icp/session/${sessionId}`);

      expect(res.status).toBe(200);
      // generated_text should be a plain object, not a Map
      expect(res.body.session.generated_text).toEqual({
        'para-1': 'First paragraph text',
        'para-2': 'Second paragraph text',
      });
    });

    it('should serialize retrieval_lexicon and success_criteria Maps', async () => {
      const { sessionId } = seedSession('Lexicon test');

      const res = await sendRequest(app, 'GET', `/api/icp/session/${sessionId}`);

      expect(res.status).toBe(200);
      // retrieval_lexicon should be a plain object with 'default' key
      expect(res.body.session.prompt_spec.retrieval_lexicon).toBeDefined();
      expect(typeof res.body.session.prompt_spec.retrieval_lexicon).toBe('object');
      expect(res.body.session.prompt_spec.retrieval_lexicon.default).toBeDefined();
      // success_criteria
      expect(typeof res.body.session.prompt_spec.success_criteria).toBe('object');
    });

    it('should serialize active_quote_set Sets to arrays', async () => {
      const { sessionId, session } = seedSession();
      const span = makeQuoteSpan({ quote_id: 'qs-1' });
      session.active_quote_set = {
        quotes: [span],
        pinned: new Set(['qs-1']),
        boosted: new Set(),
        demoted: new Set(['qs-2']),
        excluded: new Set(['qs-3']),
      };

      const res = await sendRequest(app, 'GET', `/api/icp/session/${sessionId}`);

      expect(res.status).toBe(200);
      const aqs = res.body.session.active_quote_set;
      expect(Array.isArray(aqs.pinned)).toBe(true);
      expect(aqs.pinned).toContain('qs-1');
      expect(Array.isArray(aqs.demoted)).toBe(true);
      expect(aqs.demoted).toContain('qs-2');
      expect(Array.isArray(aqs.excluded)).toBe(true);
      expect(aqs.excluded).toContain('qs-3');
    });
  });

  // ===========================================================================
  // 4. GET /sessions — list all sessions
  // ===========================================================================

  describe('GET /api/icp/sessions', () => {
    it('should return empty list when no sessions exist', async () => {
      const res = await sendRequest(app, 'GET', '/api/icp/sessions');

      expect(res.status).toBe(200);
      expect(res.body.sessions).toEqual([]);
    });

    it('should return summary of all sessions', async () => {
      const { sessionId: id1, session: s1 } = seedSession('First prompt');
      const { sessionId: id2, session: s2 } = seedSession('Second prompt');

      // Add some data to s1
      s1.quote_spans.push(makeQuoteSpan());
      s1.atoms.push(makeAtom());
      s1.event_log.push(makeEvent());

      const res = await sendRequest(app, 'GET', '/api/icp/sessions');

      expect(res.status).toBe(200);
      expect(res.body.sessions).toHaveLength(2);

      const summary1 = res.body.sessions.find((s: any) => s.sessionId === id1);
      expect(summary1).toBeDefined();
      expect(summary1.prompt).toBe('First prompt');
      expect(summary1.quoteCount).toBe(1);
      expect(summary1.atomCount).toBe(1);
      expect(summary1.eventCount).toBe(1);
      expect(summary1.hasGeneratedText).toBe(false);

      const summary2 = res.body.sessions.find((s: any) => s.sessionId === id2);
      expect(summary2).toBeDefined();
      expect(summary2.prompt).toBe('Second prompt');
      expect(summary2.quoteCount).toBe(0);
    });

    it('should truncate prompt to 100 characters in summary', async () => {
      const longPrompt = 'A'.repeat(200);
      seedSession(longPrompt);

      const res = await sendRequest(app, 'GET', '/api/icp/sessions');

      expect(res.status).toBe(200);
      expect(res.body.sessions[0].prompt).toHaveLength(100);
    });

    it('should report hasGeneratedText correctly', async () => {
      const { session } = seedSession();
      session.generated_text.set('p1', 'Some text');

      const res = await sendRequest(app, 'GET', '/api/icp/sessions');

      expect(res.body.sessions[0].hasGeneratedText).toBe(true);
    });
  });

  // ===========================================================================
  // 5. DELETE /session/:sessionId
  // ===========================================================================

  describe('DELETE /api/icp/session/:sessionId', () => {
    it('should delete an existing session', async () => {
      const { sessionId } = seedSession();

      const res = await sendRequest(app, 'DELETE', `/api/icp/session/${sessionId}`);

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
      expect(getSessionStore().has(sessionId)).toBe(false);
    });

    it('should return 404 for non-existent session', async () => {
      const res = await sendRequest(app, 'DELETE', '/api/icp/session/no-such-session');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Session not found');
    });
  });

  // ===========================================================================
  // 6. POST /retrieve/:sessionId
  // ===========================================================================

  describe('POST /api/icp/retrieve/:sessionId', () => {
    it('should return current quote spans for valid session', async () => {
      const { sessionId, session } = seedSession();
      const span1 = makeQuoteSpan({ quote_id: 'q1' });
      const span2 = makeQuoteSpan({ quote_id: 'q2' });
      session.quote_spans.push(span1, span2);

      const res = await sendRequest(app, 'POST', `/api/icp/retrieve/${sessionId}`, {});

      expect(res.status).toBe(200);
      expect(res.body.sessionId).toBe(sessionId);
      expect(res.body.quote_spans).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('should return 404 for non-existent session', async () => {
      const res = await sendRequest(app, 'POST', '/api/icp/retrieve/missing-session', {});

      expect(res.status).toBe(404);
    });

    it('should accept optional facetIds filter', async () => {
      const { sessionId, session } = seedSession();
      session.quote_spans.push(makeQuoteSpan({ quote_id: 'q1' }));

      const res = await sendRequest(app, 'POST', `/api/icp/retrieve/${sessionId}`, {
        facetIds: ['facet-001'],
      });

      expect(res.status).toBe(200);
      // Current MVP implementation returns all spans regardless of facetIds
      expect(res.body.quote_spans).toHaveLength(1);
    });
  });

  // ===========================================================================
  // 7. POST /verify — update verification status
  // ===========================================================================

  describe('POST /api/icp/verify', () => {
    it('should update quote verification status', async () => {
      const { sessionId, session } = seedSession();
      const span = makeQuoteSpan({ quote_id: 'verify-q1', verification_status: 'auto_verified' });
      session.quote_spans.push(span);

      const res = await sendRequest(app, 'POST', '/api/icp/verify', {
        sessionId,
        quoteId: 'verify-q1',
        status: 'human_verified',
      });

      expect(res.status).toBe(200);
      expect(res.body.quoteId).toBe('verify-q1');
      expect(res.body.status).toBe('human_verified');
      // Verify the in-memory span was updated
      expect(session.quote_spans[0].verification_status).toBe('human_verified');
    });

    it('should find quote by span_fingerprint as fallback', async () => {
      const { sessionId, session } = seedSession();
      const span = makeQuoteSpan({
        quote_id: 'q-uuid',
        span_fingerprint: 'my-span-fp',
      });
      session.quote_spans.push(span);

      const res = await sendRequest(app, 'POST', '/api/icp/verify', {
        sessionId,
        quoteId: 'my-span-fp',
        status: 'human_verified',
      });

      expect(res.status).toBe(200);
      expect(res.body.quoteId).toBe('q-uuid');
    });

    it('should apply correctedText when status is human_corrected', async () => {
      const { sessionId, session } = seedSession();
      const span = makeQuoteSpan({ quote_id: 'correct-q1', text: 'Original text with typo' });
      session.quote_spans.push(span);

      const res = await sendRequest(app, 'POST', '/api/icp/verify', {
        sessionId,
        quoteId: 'correct-q1',
        status: 'human_corrected',
        correctedText: 'Corrected text without typo',
      });

      expect(res.status).toBe(200);
      expect(session.quote_spans[0].text).toBe('Corrected text without typo');
      expect(session.quote_spans[0].verification_status).toBe('human_corrected');
    });

    it('should not apply correctedText for non-corrected statuses', async () => {
      const { sessionId, session } = seedSession();
      const originalText = 'Original text';
      const span = makeQuoteSpan({ quote_id: 'no-correct-q1', text: originalText });
      session.quote_spans.push(span);

      const res = await sendRequest(app, 'POST', '/api/icp/verify', {
        sessionId,
        quoteId: 'no-correct-q1',
        status: 'human_verified',
        correctedText: 'This should not be applied',
      });

      expect(res.status).toBe(200);
      expect(session.quote_spans[0].text).toBe(originalText);
    });

    it('should return 400 for missing fields', async () => {
      const res = await sendRequest(app, 'POST', '/api/icp/verify', {
        sessionId: 'x',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required fields');
    });

    it('should return 404 for non-existent session', async () => {
      const res = await sendRequest(app, 'POST', '/api/icp/verify', {
        sessionId: 'no-session',
        quoteId: 'q1',
        status: 'human_verified',
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Session not found');
    });

    it('should return 404 for non-existent quote', async () => {
      const { sessionId } = seedSession();

      const res = await sendRequest(app, 'POST', '/api/icp/verify', {
        sessionId,
        quoteId: 'nonexistent-quote',
        status: 'human_verified',
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Quote span not found');
    });

    it('should reject invalid verification status', async () => {
      const { sessionId, session } = seedSession();
      session.quote_spans.push(makeQuoteSpan({ quote_id: 'q-invalid' }));

      const res = await sendRequest(app, 'POST', '/api/icp/verify', {
        sessionId,
        quoteId: 'q-invalid',
        status: 'totally_bogus_status',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid status');
    });

    it('should emit a verification event to the session event log', async () => {
      const { sessionId, session } = seedSession();
      session.quote_spans.push(makeQuoteSpan({ quote_id: 'q-event-test' }));

      await sendRequest(app, 'POST', '/api/icp/verify', {
        sessionId,
        quoteId: 'q-event-test',
        status: 'human_verified',
      });

      const verifyEvents = session.event_log.filter(e => e.action === 'verify');
      expect(verifyEvents.length).toBeGreaterThanOrEqual(1);
      expect(verifyEvents[0].payload_summary).toContain('q-event-test');
      expect(verifyEvents[0].category).toBe('verification');
    });
  });

  // ===========================================================================
  // 8. POST /patch — submit OCR patch
  // ===========================================================================

  describe('POST /api/icp/patch', () => {
    it('should create a patch and emit event', async () => {
      const { sessionId, session } = seedSession();

      const res = await sendRequest(app, 'POST', '/api/icp/patch', {
        sessionId,
        docId: 'doc-aristotle-01',
        beforeText: 'phantasla',
        afterText: 'phantasia',
        reasonTag: 'diacritic',
      });

      expect(res.status).toBe(201);
      expect(res.body.patch).toBeDefined();
      expect(res.body.patch.doc_id).toBe('doc-aristotle-01');
      expect(res.body.patch.before_text).toBe('phantasla');
      expect(res.body.patch.after_text).toBe('phantasia');
      expect(res.body.patch.reason_tag).toBe('diacritic');
      expect(res.body.patch.patch_id).toBeDefined();
      expect(res.body.message).toBe('Patch recorded');

      // Verify event was emitted
      const patchEvents = session.event_log.filter(e => e.action === 'patch');
      expect(patchEvents.length).toBe(1);
      expect(patchEvents[0].category).toBe('staleness');
    });

    it('should return 400 for missing required fields', async () => {
      const { sessionId } = seedSession();

      const res = await sendRequest(app, 'POST', '/api/icp/patch', {
        sessionId,
        docId: 'doc-01',
        // missing beforeText and afterText
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required fields');
    });

    it('should return 404 for non-existent session', async () => {
      const res = await sendRequest(app, 'POST', '/api/icp/patch', {
        sessionId: 'no-session',
        docId: 'doc-01',
        beforeText: 'before',
        afterText: 'after',
      });

      expect(res.status).toBe(404);
    });

    it('should default reasonTag to "other" when not provided', async () => {
      const { sessionId } = seedSession();

      const res = await sendRequest(app, 'POST', '/api/icp/patch', {
        sessionId,
        docId: 'doc-02',
        beforeText: 'before',
        afterText: 'after',
      });

      expect(res.status).toBe(201);
      expect(res.body.patch.reason_tag).toBe('other');
    });
  });

  // ===========================================================================
  // 9. POST /bind/:sessionId — create binding
  // ===========================================================================

  describe('POST /api/icp/bind/:sessionId', () => {
    it('should create a binding and add to session', async () => {
      const { sessionId, session } = seedSession();
      const atom = makeAtom({ atom_id: 'a1', bound_quote_ids: [] });
      session.atoms.push(atom);
      session.quote_spans.push(makeQuoteSpan({ quote_id: 'q1' }));

      const res = await sendRequest(app, 'POST', `/api/icp/bind/${sessionId}`, {
        atomIds: ['a1'],
        quoteIds: ['q1'],
        supportKind: 'DIRECT_QUOTE',
        warrantNote: 'Directly quoted from De Anima',
      });

      expect(res.status).toBe(201);
      expect(res.body.binding).toBeDefined();
      expect(res.body.binding.binding_id).toBeDefined();
      expect(res.body.binding.atom_ids).toEqual(['a1']);
      expect(res.body.binding.quote_ids).toEqual(['q1']);
      expect(res.body.binding.support_kind).toBe('DIRECT_QUOTE');
      expect(res.body.binding.warrant_note).toBe('Directly quoted from De Anima');
      expect(res.body.binding.staleness_status).toBe('current');

      // Verify binding was added to session
      expect(session.bindings).toHaveLength(1);

      // Verify atom.bound_quote_ids was updated
      expect(atom.bound_quote_ids).toContain('q1');
    });

    it('should update multiple atoms bound_quote_ids', async () => {
      const { sessionId, session } = seedSession();
      const atom1 = makeAtom({ atom_id: 'a1', bound_quote_ids: [] });
      const atom2 = makeAtom({ atom_id: 'a2', bound_quote_ids: ['existing-q'] });
      session.atoms.push(atom1, atom2);

      await sendRequest(app, 'POST', `/api/icp/bind/${sessionId}`, {
        atomIds: ['a1', 'a2'],
        quoteIds: ['q1', 'q2'],
        supportKind: 'PARAPHRASE',
      });

      expect(atom1.bound_quote_ids).toEqual(['q1', 'q2']);
      expect(atom2.bound_quote_ids).toEqual(['existing-q', 'q1', 'q2']);
    });

    it('should return 400 for missing required fields', async () => {
      const { sessionId } = seedSession();

      const res = await sendRequest(app, 'POST', `/api/icp/bind/${sessionId}`, {
        atomIds: ['a1'],
        // missing quoteIds and supportKind
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required fields');
    });

    it('should return 400 for empty arrays', async () => {
      const { sessionId } = seedSession();

      const res = await sendRequest(app, 'POST', `/api/icp/bind/${sessionId}`, {
        atomIds: [],
        quoteIds: ['q1'],
        supportKind: 'DIRECT_QUOTE',
      });

      expect(res.status).toBe(400);
    });

    it('should return 404 for non-existent session', async () => {
      const res = await sendRequest(app, 'POST', '/api/icp/bind/missing-session', {
        atomIds: ['a1'],
        quoteIds: ['q1'],
        supportKind: 'DIRECT_QUOTE',
      });

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // 10. DELETE /bind/:sessionId/:bindingId
  // ===========================================================================

  describe('DELETE /api/icp/bind/:sessionId/:bindingId', () => {
    it('should remove binding from session', async () => {
      const { sessionId, session } = seedSession();
      const binding: ClaimBinding = {
        binding_id: 'binding-to-delete',
        claim_id: 'claim-1',
        atom_ids: ['a1'],
        quote_ids: ['q1'],
        support_kind: 'DIRECT_QUOTE',
        staleness_status: 'current',
      };
      session.bindings.push(binding);

      const res = await sendRequest(
        app,
        'DELETE',
        `/api/icp/bind/${sessionId}/binding-to-delete`,
      );

      expect(res.status).toBe(200);
      expect(res.body.deleted).toBe(true);
      expect(session.bindings).toHaveLength(0);
    });

    it('should return 404 for non-existent binding', async () => {
      const { sessionId } = seedSession();

      const res = await sendRequest(
        app,
        'DELETE',
        `/api/icp/bind/${sessionId}/no-such-binding`,
      );

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Binding not found');
    });

    it('should return 404 for non-existent session', async () => {
      const res = await sendRequest(
        app,
        'DELETE',
        '/api/icp/bind/missing-session/binding-1',
      );

      expect(res.status).toBe(404);
    });

    it('should only remove the targeted binding from multiple bindings', async () => {
      const { sessionId, session } = seedSession();
      session.bindings.push(
        { binding_id: 'b1', claim_id: '', atom_ids: [], quote_ids: [], support_kind: 'DIRECT_QUOTE', staleness_status: 'current' },
        { binding_id: 'b2', claim_id: '', atom_ids: [], quote_ids: [], support_kind: 'PARAPHRASE', staleness_status: 'current' },
        { binding_id: 'b3', claim_id: '', atom_ids: [], quote_ids: [], support_kind: 'INFERENCE', staleness_status: 'current' },
      );

      await sendRequest(app, 'DELETE', `/api/icp/bind/${sessionId}/b2`);

      expect(session.bindings).toHaveLength(2);
      expect(session.bindings.map(b => b.binding_id)).toEqual(['b1', 'b3']);
    });
  });

  // ===========================================================================
  // 11. POST /stress-test/:sessionId
  // ===========================================================================

  describe('POST /api/icp/stress-test/:sessionId', () => {
    it('should return message when no stress test has been run', async () => {
      const { sessionId, session } = seedSession();
      session.atoms.push(makeAtom());
      session.bindings.push({
        binding_id: 'b1', claim_id: '', atom_ids: ['a1'],
        quote_ids: ['q1'], support_kind: 'DIRECT_QUOTE', staleness_status: 'current',
      });

      const res = await sendRequest(app, 'POST', `/api/icp/stress-test/${sessionId}`, {});

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('not yet run');
      expect(res.body.atoms).toBe(1);
      expect(res.body.bindings).toBe(1);
    });

    it('should return existing stress test report when available', async () => {
      const { sessionId, session } = seedSession();
      session.stress_test_report = {
        atom_results: [],
        summary: { total_tested: 5, passed: 4, warned: 1, failed: 0, demoted: 0 },
      };

      const res = await sendRequest(app, 'POST', `/api/icp/stress-test/${sessionId}`, {});

      expect(res.status).toBe(200);
      expect(res.body.report).toBeDefined();
      expect(res.body.report.summary.total_tested).toBe(5);
    });

    it('should return 404 for non-existent session', async () => {
      const res = await sendRequest(app, 'POST', '/api/icp/stress-test/missing', {});

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // 12. POST /generate/:sessionId
  // ===========================================================================

  describe('POST /api/icp/generate/:sessionId', () => {
    it('should return message when no text has been generated', async () => {
      const { sessionId, session } = seedSession();
      session.paragraph_plan.push({
        paragraph_id: 'p1',
        paragraph_order: 0,
        atom_ids: ['a1'],
        required_quotes: ['q1'],
      });

      const res = await sendRequest(app, 'POST', `/api/icp/generate/${sessionId}`, {});

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('not yet generated');
      expect(res.body.plan).toBeDefined();
    });

    it('should return generated paragraphs when text exists', async () => {
      const { sessionId, session } = seedSession();
      session.generated_text.set('para-1', 'First paragraph.');
      session.generated_text.set('para-2', 'Second paragraph.');
      session.sentence_scopes.push({
        sentence_id: 's1',
        paragraph_id: 'para-1',
        sentence_order: 0,
        supports_atoms: ['a1'],
        text: 'First paragraph.',
      });

      const res = await sendRequest(app, 'POST', `/api/icp/generate/${sessionId}`, {});

      expect(res.status).toBe(200);
      expect(res.body.paragraphs).toEqual({
        'para-1': 'First paragraph.',
        'para-2': 'Second paragraph.',
      });
      expect(res.body.paragraphCount).toBe(2);
      expect(res.body.totalSentences).toBe(1);
    });

    it('should return 404 for non-existent session', async () => {
      const res = await sendRequest(app, 'POST', '/api/icp/generate/missing', {});

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // 13. POST /export/:sessionId — generate ExportPackage
  // ===========================================================================

  describe('POST /api/icp/export/:sessionId', () => {
    it('should produce an ExportPackage with string fields', async () => {
      const { sessionId, session } = seedSession();

      // Set up paragraph plan and generated text
      session.paragraph_plan.push(
        { paragraph_id: 'p1', paragraph_order: 0, atom_ids: ['a1'], required_quotes: [] },
        { paragraph_id: 'p2', paragraph_order: 1, atom_ids: ['a2'], required_quotes: [] },
      );
      session.generated_text.set('p1', 'First paragraph of the essay.');
      session.generated_text.set('p2', 'Second paragraph with evidence.');

      // Add bindings for evidence ledger
      session.bindings.push({
        binding_id: 'b1',
        claim_id: 'c1',
        atom_ids: ['a1'],
        quote_ids: ['q1'],
        support_kind: 'DIRECT_QUOTE',
        staleness_status: 'current',
      });

      // Add user-visible event for methodology trace
      session.event_log.push(makeEvent({
        action: 'retrieve',
        actor: 'system',
        payload_summary: 'Retrieved 5 spans for facet-001',
        user_visible: true,
      }));

      const res = await sendRequest(app, 'POST', `/api/icp/export/${sessionId}`, {});

      expect(res.status).toBe(200);
      const pkg = res.body.export;
      expect(pkg).toBeDefined();

      // final_prose should join paragraphs in order
      expect(pkg.final_prose).toContain('First paragraph of the essay.');
      expect(pkg.final_prose).toContain('Second paragraph with evidence.');

      // evidence_ledger should contain binding info
      expect(pkg.evidence_ledger).toContain('b1');
      expect(pkg.evidence_ledger).toContain('DIRECT_QUOTE');

      // methodology_trace should contain user-visible events
      expect(pkg.methodology_trace).toContain('Retrieved 5 spans');

      // All required string fields should exist
      expect(typeof pkg.endnotes).toBe('string');
      expect(typeof pkg.bibliography).toBe('string');
      expect(typeof pkg.evidence_ledger).toBe('string');
      expect(typeof pkg.methodology_trace).toBe('string');
      expect(typeof pkg.final_prose).toBe('string');
    });

    it('should order paragraphs by paragraph_order', async () => {
      const { sessionId, session } = seedSession();

      // Add paragraphs in reverse order
      session.paragraph_plan.push(
        { paragraph_id: 'p-last', paragraph_order: 2, atom_ids: [], required_quotes: [] },
        { paragraph_id: 'p-first', paragraph_order: 0, atom_ids: [], required_quotes: [] },
        { paragraph_id: 'p-middle', paragraph_order: 1, atom_ids: [], required_quotes: [] },
      );
      session.generated_text.set('p-first', 'FIRST');
      session.generated_text.set('p-middle', 'MIDDLE');
      session.generated_text.set('p-last', 'LAST');

      const res = await sendRequest(app, 'POST', `/api/icp/export/${sessionId}`, {});

      expect(res.status).toBe(200);
      const prose = res.body.export.final_prose;
      const firstIdx = prose.indexOf('FIRST');
      const middleIdx = prose.indexOf('MIDDLE');
      const lastIdx = prose.indexOf('LAST');
      expect(firstIdx).toBeLessThan(middleIdx);
      expect(middleIdx).toBeLessThan(lastIdx);
    });

    it('should handle empty generated text gracefully', async () => {
      const { sessionId } = seedSession();

      const res = await sendRequest(app, 'POST', `/api/icp/export/${sessionId}`, {});

      expect(res.status).toBe(200);
      expect(res.body.export.final_prose).toBe('');
    });

    it('should exclude non-user-visible events from methodology trace', async () => {
      const { sessionId, session } = seedSession();
      session.event_log.push(
        makeEvent({ user_visible: true, payload_summary: 'VISIBLE event' }),
        makeEvent({ user_visible: false, payload_summary: 'HIDDEN event' }),
      );

      const res = await sendRequest(app, 'POST', `/api/icp/export/${sessionId}`, {});

      expect(res.body.export.methodology_trace).toContain('VISIBLE event');
      expect(res.body.export.methodology_trace).not.toContain('HIDDEN event');
    });

    it('should return 404 for non-existent session', async () => {
      const res = await sendRequest(app, 'POST', '/api/icp/export/missing', {});

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // 14. GET /events/:sessionId — event log with filtering
  // ===========================================================================

  describe('GET /api/icp/events/:sessionId', () => {
    it('should return all events for a session', async () => {
      const { sessionId, session } = seedSession();
      session.event_log.push(
        makeEvent({ action: 'retrieve', payload_summary: 'Event 1' }),
        makeEvent({ action: 'verify', payload_summary: 'Event 2' }),
        makeEvent({ action: 'bind', payload_summary: 'Event 3' }),
      );

      const res = await sendRequest(app, 'GET', `/api/icp/events/${sessionId}`);

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(3);
      expect(res.body.total).toBe(3);
      expect(res.body.sessionId).toBe(sessionId);
    });

    it('should filter by userVisible=true', async () => {
      const { sessionId, session } = seedSession();
      session.event_log.push(
        makeEvent({ user_visible: true, payload_summary: 'Visible' }),
        makeEvent({ user_visible: false, payload_summary: 'Hidden' }),
        makeEvent({ user_visible: true, payload_summary: 'Also visible' }),
      );

      const res = await sendRequest(
        app,
        'GET',
        `/api/icp/events/${sessionId}?userVisible=true`,
      );

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(2);
      expect(res.body.events.every((e: any) => e.user_visible)).toBe(true);
    });

    it('should filter by category', async () => {
      const { sessionId, session } = seedSession();
      session.event_log.push(
        makeEvent({ category: 'evidence', payload_summary: 'evidence-1' }),
        makeEvent({ category: 'generation', payload_summary: 'gen-1' }),
        makeEvent({ category: 'evidence', payload_summary: 'evidence-2' }),
        makeEvent({ category: 'verification', payload_summary: 'verify-1' }),
      );

      const res = await sendRequest(
        app,
        'GET',
        `/api/icp/events/${sessionId}?category=evidence`,
      );

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(2);
      expect(res.body.events.every((e: any) => e.category === 'evidence')).toBe(true);
    });

    it('should combine userVisible and category filters', async () => {
      const { sessionId, session } = seedSession();
      session.event_log.push(
        makeEvent({ category: 'evidence', user_visible: true }),
        makeEvent({ category: 'evidence', user_visible: false }),
        makeEvent({ category: 'generation', user_visible: true }),
      );

      const res = await sendRequest(
        app,
        'GET',
        `/api/icp/events/${sessionId}?userVisible=true&category=evidence`,
      );

      expect(res.status).toBe(200);
      expect(res.body.events).toHaveLength(1);
    });

    it('should return empty array for session with no events', async () => {
      const { sessionId } = seedSession();

      const res = await sendRequest(app, 'GET', `/api/icp/events/${sessionId}`);

      expect(res.status).toBe(200);
      expect(res.body.events).toEqual([]);
      expect(res.body.total).toBe(0);
    });

    it('should return 404 for non-existent session', async () => {
      const res = await sendRequest(app, 'GET', '/api/icp/events/missing');

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // 15. GET /corpus-diff/:runId1/:runId2
  // ===========================================================================

  describe('GET /api/icp/corpus-diff/:runId1/:runId2', () => {
    it('should return placeholder diff structure', async () => {
      const res = await sendRequest(app, 'GET', '/api/icp/corpus-diff/run-a/run-b');

      expect(res.status).toBe(200);
      expect(res.body.run1).toBe('run-a');
      expect(res.body.run2).toBe('run-b');
      expect(res.body.stale_bindings).toEqual([]);
      expect(res.body.affected_spans).toEqual([]);
      expect(res.body.impacted_claims).toEqual([]);
      expect(res.body.message).toContain('Corpus diff');
    });
  });

  // ===========================================================================
  // 16. GET /facets/:sessionId — facets with coverage stats
  // ===========================================================================

  describe('GET /api/icp/facets/:sessionId', () => {
    it('should return facets with coverage statistics', async () => {
      const { sessionId, session } = seedSession();

      const facet = makeFacet({ facet_id: 'f1', name: 'Phantasia Analysis' });
      session.facets.push(facet);

      // Add atoms for this facet
      session.atoms.push(
        makeAtom({ atom_id: 'a1', facet_id: 'f1', bound_quote_ids: ['q1'] }),
        makeAtom({ atom_id: 'a2', facet_id: 'f1', bound_quote_ids: [] }),
        makeAtom({ atom_id: 'a3', facet_id: 'f1', bound_quote_ids: ['q2', 'q3'] }),
      );

      // Add verified spans
      session.quote_spans.push(
        makeQuoteSpan({ quote_id: 'q1', verification_status: 'human_verified' }),
        makeQuoteSpan({ quote_id: 'q2', verification_status: 'auto_verified' }),
        makeQuoteSpan({ quote_id: 'q3', verification_status: 'flagged' }),
      );

      const res = await sendRequest(app, 'GET', `/api/icp/facets/${sessionId}`);

      expect(res.status).toBe(200);
      expect(res.body.facets).toHaveLength(1);

      const f = res.body.facets[0];
      expect(f.facet_id).toBe('f1');
      expect(f.name).toBe('Phantasia Analysis');
      expect(f.coverage.atoms_total).toBe(3);
      expect(f.coverage.atoms_bound).toBe(2); // a1 and a3 have bound quotes
      expect(f.coverage.verified_spans).toBe(2); // human_verified + auto_verified (not flagged)
    });

    it('should return empty facets array for session with no facets', async () => {
      const { sessionId } = seedSession();

      const res = await sendRequest(app, 'GET', `/api/icp/facets/${sessionId}`);

      expect(res.status).toBe(200);
      expect(res.body.facets).toEqual([]);
    });

    it('should include human_corrected in verified count', async () => {
      const { sessionId, session } = seedSession();
      session.facets.push(makeFacet({ facet_id: 'f1' }));
      session.quote_spans.push(
        makeQuoteSpan({ verification_status: 'human_corrected' }),
      );

      const res = await sendRequest(app, 'GET', `/api/icp/facets/${sessionId}`);

      expect(res.body.facets[0].coverage.verified_spans).toBe(1);
    });

    it('should return 404 for non-existent session', async () => {
      const res = await sendRequest(app, 'GET', '/api/icp/facets/missing');

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // 17. PUT /facets/:sessionId/:facetId — update facet settings
  // ===========================================================================

  describe('PUT /api/icp/facets/:sessionId/:facetId', () => {
    it('should update facet name and description', async () => {
      const { sessionId, session } = seedSession();
      const facet = makeFacet({ facet_id: 'f1', name: 'Original', description: 'Original desc' });
      session.facets.push(facet);

      const res = await sendRequest(app, 'PUT', `/api/icp/facets/${sessionId}/f1`, {
        name: 'Updated Name',
        description: 'Updated description',
      });

      expect(res.status).toBe(200);
      expect(res.body.facet.name).toBe('Updated Name');
      expect(res.body.facet.description).toBe('Updated description');
      // Verify in-memory state
      expect(session.facets[0].name).toBe('Updated Name');
    });

    it('should update facet_role', async () => {
      const { sessionId, session } = seedSession();
      session.facets.push(makeFacet({ facet_id: 'f1', facet_role: 'core' }));

      const res = await sendRequest(app, 'PUT', `/api/icp/facets/${sessionId}/f1`, {
        facet_role: 'exploratory',
      });

      expect(res.status).toBe(200);
      expect(session.facets[0].facet_role).toBe('exploratory');
    });

    it('should update strictness_override', async () => {
      const { sessionId, session } = seedSession();
      session.facets.push(makeFacet({ facet_id: 'f1' }));

      const res = await sendRequest(app, 'PUT', `/api/icp/facets/${sessionId}/f1`, {
        strictness_override: 'permissive',
      });

      expect(res.status).toBe(200);
      expect(session.facets[0].strictness_override).toBe('permissive');
    });

    it('should update allow_adds_atoms', async () => {
      const { sessionId, session } = seedSession();
      session.facets.push(makeFacet({ facet_id: 'f1' }));

      const res = await sendRequest(app, 'PUT', `/api/icp/facets/${sessionId}/f1`, {
        allow_adds_atoms: true,
      });

      expect(res.status).toBe(200);
      expect(session.facets[0].allow_adds_atoms).toBe(true);
    });

    it('should not modify unspecified fields', async () => {
      const { sessionId, session } = seedSession();
      session.facets.push(makeFacet({
        facet_id: 'f1',
        name: 'Keep This',
        description: 'Keep This Too',
        facet_role: 'core',
      }));

      const res = await sendRequest(app, 'PUT', `/api/icp/facets/${sessionId}/f1`, {
        name: 'Changed',
      });

      expect(res.status).toBe(200);
      expect(session.facets[0].name).toBe('Changed');
      expect(session.facets[0].description).toBe('Keep This Too');
      expect(session.facets[0].facet_role).toBe('core');
    });

    it('should return 404 for non-existent facet', async () => {
      const { sessionId } = seedSession();

      const res = await sendRequest(app, 'PUT', `/api/icp/facets/${sessionId}/no-facet`, {
        name: 'New Name',
      });

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Facet not found');
    });

    it('should return 404 for non-existent session', async () => {
      const res = await sendRequest(app, 'PUT', '/api/icp/facets/missing/f1', {
        name: 'New Name',
      });

      expect(res.status).toBe(404);
    });
  });

  // ===========================================================================
  // 18. createICPSession factory
  // ===========================================================================

  describe('createICPSession', () => {
    it('should create session with correct defaults', () => {
      const promptSpec = makePromptSpec('Test');
      const scope = makeSourceScope();
      const session = createICPSession('test-id', promptSpec, scope);

      expect(session.session_id).toBe('test-id');
      expect(session.prompt_spec).toBe(promptSpec);
      expect(session.source_scope).toBe(scope);
      expect(session.facets).toEqual([]);
      expect(session.quote_spans).toEqual([]);
      expect(session.bindings).toEqual([]);
      expect(session.hypothesis_claims).toEqual([]);
      expect(session.paragraph_plan).toEqual([]);
      expect(session.generated_text).toBeInstanceOf(Map);
      expect(session.generated_text.size).toBe(0);
      expect(session.event_log).toEqual([]);
      expect(session.atom_migrations).toEqual([]);
      expect(session.facet_migrations).toEqual([]);
      expect(session.atoms).toEqual([]);
      expect(session.sentence_scopes).toEqual([]);
      expect(session.revision).toBe(0);
      expect(session.created_at).toBeDefined();
      expect(session.updated_at).toBeDefined();
    });

    it('should merge required_facets and optional_facets into facets array', () => {
      const reqFacet = makeFacet({ facet_id: 'req-1', name: 'Required' });
      const optFacet = makeFacet({ facet_id: 'opt-1', name: 'Optional' });
      const promptSpec = {
        ...makePromptSpec('Test'),
        required_facets: [reqFacet],
        optional_facets: [optFacet],
      };

      const session = createICPSession('id', promptSpec, makeSourceScope());

      expect(session.facets).toHaveLength(2);
      expect(session.facets[0].facet_id).toBe('req-1');
      expect(session.facets[1].facet_id).toBe('opt-1');
    });
  });

  // ===========================================================================
  // 19. Serialization edge cases
  // ===========================================================================

  describe('Serialization edge cases', () => {
    it('should handle canonical_registry_snapshot with Map', async () => {
      const { sessionId, session } = seedSession();
      session.canonical_registry_snapshot = {
        snapshot_hash: 'abc123',
        captured_at: new Date().toISOString(),
        verified_canonical_spans: new Map([
          ['span-1', { verification_status: 'human_verified' as const, usage_count: 3, authority_tier: 1 }],
        ]),
      };

      const res = await sendRequest(app, 'GET', `/api/icp/session/${sessionId}`);

      expect(res.status).toBe(200);
      const snapshot = res.body.session.canonical_registry_snapshot;
      expect(snapshot.snapshot_hash).toBe('abc123');
      expect(snapshot.verified_canonical_spans['span-1']).toBeDefined();
      expect(snapshot.verified_canonical_spans['span-1'].usage_count).toBe(3);
    });

    it('should handle facet evidence_policy_for_kind Map serialization', async () => {
      const { sessionId, session } = seedSession();
      const facet = makeFacet({ facet_id: 'f1' });
      facet.evidence_policy_for_kind.set('corpus_claim', 'required');
      facet.evidence_policy_for_kind.set('interpretive_move', 'not_required');
      session.facets.push(facet);

      const res = await sendRequest(app, 'GET', `/api/icp/session/${sessionId}`);

      expect(res.status).toBe(200);
      const serializedFacet = res.body.session.facets[0];
      expect(serializedFacet.evidence_policy_for_kind).toEqual({
        corpus_claim: 'required',
        interpretive_move: 'not_required',
      });
    });

    it('should handle undefined active_quote_set', async () => {
      const { sessionId } = seedSession();

      const res = await sendRequest(app, 'GET', `/api/icp/session/${sessionId}`);

      expect(res.status).toBe(200);
      expect(res.body.session.active_quote_set).toBeUndefined();
    });

    it('should handle undefined canonical_registry_snapshot', async () => {
      const { sessionId } = seedSession();

      const res = await sendRequest(app, 'GET', `/api/icp/session/${sessionId}`);

      expect(res.status).toBe(200);
      expect(res.body.session.canonical_registry_snapshot).toBeUndefined();
    });
  });

  // ===========================================================================
  // 20. emitSessionEvent
  // ===========================================================================

  describe('emitSessionEvent', () => {
    it('should increment revision and append event', () => {
      const session = createICPSession('s1', makePromptSpec('Test'), makeSourceScope());
      expect(session.revision).toBe(0);
      expect(session.event_log).toHaveLength(0);

      emitSessionEvent(session, {
        ts: new Date().toISOString(),
        actor: 'system',
        action: 'retrieve',
        payload_summary: 'Test event',
        affected_ids: ['a1'],
        severity: 'info',
        user_visible: true,
        category: 'evidence',
      });

      expect(session.revision).toBe(1);
      expect(session.event_log).toHaveLength(1);
      expect(session.event_log[0].session_revision).toBe(1);
    });

    it('should update session updated_at timestamp', () => {
      const session = createICPSession('s1', makePromptSpec('Test'), makeSourceScope());
      const originalUpdatedAt = session.updated_at;

      // Small delay to ensure timestamp difference
      const before = new Date().toISOString();
      emitSessionEvent(session, {
        ts: new Date().toISOString(),
        actor: 'user',
        action: 'verify',
        payload_summary: 'Verified something',
        affected_ids: [],
        severity: 'info',
        user_visible: true,
        category: 'verification',
      });

      expect(session.updated_at).toBeDefined();
      // updated_at should be at least as recent as before
      expect(new Date(session.updated_at).getTime()).toBeGreaterThanOrEqual(
        new Date(before).getTime(),
      );
    });

    it('should increment revision monotonically across multiple events', () => {
      const session = createICPSession('s1', makePromptSpec('Test'), makeSourceScope());

      for (let i = 0; i < 5; i++) {
        emitSessionEvent(session, {
          ts: new Date().toISOString(),
          actor: 'system',
          action: 'retrieve',
          payload_summary: `Event ${i}`,
          affected_ids: [],
          severity: 'info',
          user_visible: true,
          category: 'evidence',
        });
      }

      expect(session.revision).toBe(5);
      expect(session.event_log).toHaveLength(5);
      for (let i = 0; i < 5; i++) {
        expect(session.event_log[i].session_revision).toBe(i + 1);
      }
    });
  });

  // ===========================================================================
  // 21. Multiple sessions isolation
  // ===========================================================================

  describe('Session isolation', () => {
    it('should maintain independent sessions', async () => {
      const { sessionId: id1, session: s1 } = seedSession('Session 1');
      const { sessionId: id2, session: s2 } = seedSession('Session 2');

      s1.quote_spans.push(makeQuoteSpan({ quote_id: 'q-s1' }));
      s2.atoms.push(makeAtom({ atom_id: 'a-s2' }));

      const res1 = await sendRequest(app, 'GET', `/api/icp/session/${id1}`);
      const res2 = await sendRequest(app, 'GET', `/api/icp/session/${id2}`);

      expect(res1.body.session.quote_spans).toHaveLength(1);
      expect(res1.body.session.atoms).toHaveLength(0);
      expect(res2.body.session.quote_spans).toHaveLength(0);
      expect(res2.body.session.atoms).toHaveLength(1);
    });

    it('should not affect other sessions when one is deleted', async () => {
      const { sessionId: id1 } = seedSession('Keep');
      const { sessionId: id2 } = seedSession('Delete');

      await sendRequest(app, 'DELETE', `/api/icp/session/${id2}`);

      expect(getSessionStore().has(id1)).toBe(true);
      expect(getSessionStore().has(id2)).toBe(false);
    });
  });

  // ===========================================================================
  // 22. Verification status acceptance
  // ===========================================================================

  describe('Verification status values', () => {
    const validStatuses = [
      'auto_verified',
      'human_verified',
      'human_corrected',
      'stale_verified',
      'flagged',
      'auto_rejected',
      'rejected',
    ];

    for (const status of validStatuses) {
      it(`should accept verification status: ${status}`, async () => {
        const { sessionId, session } = seedSession();
        session.quote_spans.push(makeQuoteSpan({ quote_id: 'q-status-test' }));

        const res = await sendRequest(app, 'POST', '/api/icp/verify', {
          sessionId,
          quoteId: 'q-status-test',
          status,
        });

        expect(res.status).toBe(200);
        expect(res.body.status).toBe(status);
      });
    }
  });
});
