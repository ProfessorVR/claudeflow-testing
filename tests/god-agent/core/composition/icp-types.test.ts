/**
 * Tests for ICP Type Definitions and Helper Functions
 */

import { describe, it, expect } from 'vitest';
import {
  computeTrustTier,
  defaultEvidenceMode,
  defaultEvidenceRequirement,
  createICPSession,
  emitSessionEvent,
  VERIFIED_STATUSES,
  DEFAULT_TRUST_TIER_POLICY,
  DEFAULT_NORMALIZATION_POLICY,
  type QuoteSpan,
  type PromptSpec,
  type SourceScopeSpec,
  type Facet,
  type ICPSession,
} from '../../../../src/god-agent/core/composition/icp-types.js';

// =============================================================================
// HELPERS
// =============================================================================

function makeSpan(overrides: Partial<QuoteSpan> = {}): QuoteSpan {
  return {
    quote_id: 'test-quote-1',
    text_fingerprint: 'fp-1',
    span_fingerprint: 'sfp-1',
    doc_id: 'doc-1',
    page: 42,
    source_kind: 'CORPUS',
    clean_text_range: [0, 100],
    clean_range_hash: 'hash-1',
    patch_epoch: 0,
    normalization_policy_version: '1.0.0',
    text: 'Aristotle defines phantasia as a movement resulting from sense perception.',
    left_ctx_hash: 'lhash',
    right_ctx_hash: 'rhash',
    verification_status: 'auto_verified',
    provenance_scorecard: {
      fidelity_score: 0.9,
      ocr_risk_score: 0.1,
      cluster_size: 1,
      prior_usage_count: 0,
      doc_authority_tier: 1,
    },
    ...overrides,
  };
}

function makePromptSpec(): PromptSpec {
  return {
    original_prompt: 'Test prompt',
    research_questions: ['What is phantasia?'],
    required_facets: [],
    optional_facets: [],
    retrieval_lexicon: new Map(),
    success_criteria: new Map(),
  };
}

function makeSourceScope(): SourceScopeSpec {
  return {
    mode: 'corpus',
    doc_authority_policy: { version: '1.0.0', tiers: {} },
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('ICP Types', () => {

  describe('VERIFIED_STATUSES', () => {
    it('should include auto_verified, human_verified, human_corrected', () => {
      expect(VERIFIED_STATUSES.has('auto_verified')).toBe(true);
      expect(VERIFIED_STATUSES.has('human_verified')).toBe(true);
      expect(VERIFIED_STATUSES.has('human_corrected')).toBe(true);
    });

    it('should exclude stale_verified, flagged, auto_rejected, rejected', () => {
      expect(VERIFIED_STATUSES.has('stale_verified')).toBe(false);
      expect(VERIFIED_STATUSES.has('flagged')).toBe(false);
      expect(VERIFIED_STATUSES.has('auto_rejected')).toBe(false);
      expect(VERIFIED_STATUSES.has('rejected')).toBe(false);
    });
  });

  describe('computeTrustTier', () => {
    it('should return gold for verified high-authority span', () => {
      const span = makeSpan({
        verification_status: 'human_verified',
        text: 'A'.repeat(200),
      });
      const tier = computeTrustTier(span, DEFAULT_TRUST_TIER_POLICY);
      expect(tier).toBe('gold');
    });

    it('should return red for stale_verified span', () => {
      const span = makeSpan({ verification_status: 'stale_verified' });
      const tier = computeTrustTier(span, DEFAULT_TRUST_TIER_POLICY);
      expect(tier).toBe('red');
    });

    it('should return red for flagged span', () => {
      const span = makeSpan({ verification_status: 'flagged' });
      const tier = computeTrustTier(span, DEFAULT_TRUST_TIER_POLICY);
      expect(tier).toBe('red');
    });

    it('should return red for rejected span', () => {
      const span = makeSpan({ verification_status: 'rejected' });
      const tier = computeTrustTier(span, DEFAULT_TRUST_TIER_POLICY);
      expect(tier).toBe('red');
    });

    it('should return lower tier for low-authority source', () => {
      const goldSpan = makeSpan({
        verification_status: 'human_verified',
        text: 'A'.repeat(200),
        provenance_scorecard: {
          fidelity_score: 0.9,
          ocr_risk_score: 0.1,
          cluster_size: 1,
          prior_usage_count: 0,
          doc_authority_tier: 1,
        },
      });
      const lowAuthSpan = makeSpan({
        verification_status: 'human_verified',
        text: 'A'.repeat(200),
        provenance_scorecard: {
          fidelity_score: 0.9,
          ocr_risk_score: 0.1,
          cluster_size: 1,
          prior_usage_count: 0,
          doc_authority_tier: 4,
        },
      });
      const goldTier = computeTrustTier(goldSpan, DEFAULT_TRUST_TIER_POLICY);
      const lowTier = computeTrustTier(lowAuthSpan, DEFAULT_TRUST_TIER_POLICY);
      expect(goldTier).toBe('gold');
      // Low authority should not be gold
      expect(lowTier === 'gold').toBe(false);
    });
  });

  describe('defaultEvidenceMode', () => {
    it('should return DIRECT_QUOTE for corpus_claim', () => {
      expect(defaultEvidenceMode('corpus_claim')).toBe('DIRECT_QUOTE');
    });

    it('should return NO_EVIDENCE_REQUIRED for method', () => {
      expect(defaultEvidenceMode('method')).toBe('NO_EVIDENCE_REQUIRED');
    });

    it('should return NO_EVIDENCE_REQUIRED for organization', () => {
      expect(defaultEvidenceMode('organization')).toBe('NO_EVIDENCE_REQUIRED');
    });

    it('should return PARAPHRASE_SUPPORTED for interpretive_move', () => {
      expect(defaultEvidenceMode('interpretive_move')).toBe('PARAPHRASE_SUPPORTED');
    });
  });

  describe('defaultEvidenceRequirement', () => {
    it('should require evidence for corpus_claim in all strictness levels', () => {
      expect(defaultEvidenceRequirement('corpus_claim', 'strict')).toBe('required');
      expect(defaultEvidenceRequirement('corpus_claim', 'moderate')).toBe('required');
      expect(defaultEvidenceRequirement('corpus_claim', 'permissive')).toBe('required');
    });

    it('should require evidence for interpretive_move only in strict', () => {
      expect(defaultEvidenceRequirement('interpretive_move', 'strict')).toBe('required_in_strict');
      expect(defaultEvidenceRequirement('interpretive_move', 'moderate')).toBe('not_required');
    });

    it('should not require evidence for method/organization', () => {
      expect(defaultEvidenceRequirement('method', 'strict')).toBe('not_required');
      expect(defaultEvidenceRequirement('organization', 'strict')).toBe('not_required');
    });
  });

  describe('createICPSession', () => {
    it('should create a session with correct initial state', () => {
      const promptSpec = makePromptSpec();
      const sourceScope = makeSourceScope();
      const session = createICPSession('test-session', promptSpec, sourceScope);

      expect(session.session_id).toBe('test-session');
      expect(session.quote_spans).toEqual([]);
      expect(session.bindings).toEqual([]);
      expect(session.hypothesis_claims).toEqual([]);
      expect(session.event_log).toEqual([]);
      expect(session.revision).toBe(0);
    });
  });

  describe('emitSessionEvent', () => {
    it('should increment session revision and append event', () => {
      const session = createICPSession('test', makePromptSpec(), makeSourceScope());

      emitSessionEvent(session, {
        ts: new Date().toISOString(),
        actor: 'system',
        action: 'retrieve',
        payload_summary: 'Test event',
        affected_ids: [],
        severity: 'info',
        user_visible: true,
        category: 'evidence',
      });

      expect(session.revision).toBe(1);
      expect(session.event_log.length).toBe(1);
      expect(session.event_log[0].session_revision).toBe(1);

      emitSessionEvent(session, {
        ts: new Date().toISOString(),
        actor: 'user',
        action: 'verify',
        payload_summary: 'Second event',
        affected_ids: [],
        severity: 'info',
        user_visible: false,
        category: 'verification',
      });

      expect(session.revision).toBe(2);
      expect(session.event_log.length).toBe(2);
      expect(session.event_log[1].session_revision).toBe(2);
    });
  });
});
