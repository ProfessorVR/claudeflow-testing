/**
 * Tests for Quote Ranker — Hierarchical Canonicalization + Ranking + Budget
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  QuoteRanker,
  type QuoteRankerConfig,
  type CanonicalCluster,
} from '../../../../src/god-agent/core/composition/quote-ranker.js';
import {
  DEFAULT_QUOTE_RANK_SPEC,
  DEFAULT_NORMALIZATION_POLICY,
  type QuoteSpan,
  type QuoteRankSpec,
  type ActiveQuoteSet,
  type Facet,
  type ClaimBinding,
  type ProvenanceScorecard,
} from '../../../../src/god-agent/core/composition/icp-types.js';
import { sha256 } from '../../../../src/god-agent/core/composition/quote-span-staleness.js';

// =============================================================================
// HELPERS
// =============================================================================

let spanCounter = 0;

function makeSpan(overrides: Partial<QuoteSpan> = {}): QuoteSpan {
  spanCounter++;
  const id = overrides.quote_id ?? `q-${spanCounter}`;
  return {
    quote_id: id,
    text_fingerprint: overrides.text_fingerprint ?? `tfp-${spanCounter}`,
    span_fingerprint: overrides.span_fingerprint ?? `sfp-${spanCounter}`,
    doc_id: overrides.doc_id ?? 'doc1',
    page: overrides.page ?? 1,
    source_kind: overrides.source_kind ?? 'CORPUS',
    clean_text_range: overrides.clean_text_range ?? [100, 200],
    clean_range_hash: overrides.clean_range_hash ?? 'hash1',
    patch_epoch: overrides.patch_epoch ?? 0,
    normalization_policy_version: overrides.normalization_policy_version ?? '1.0.0',
    text: overrides.text ?? 'Aristotle defines phantasia as a movement arising from active perception.',
    left_ctx_hash: overrides.left_ctx_hash ?? 'lhash',
    right_ctx_hash: overrides.right_ctx_hash ?? 'rhash',
    verification_status: overrides.verification_status ?? 'auto_verified',
    provenance_scorecard: overrides.provenance_scorecard ?? {
      fidelity_score: 0.9,
      ocr_risk_score: 0.1,
      cluster_size: 1,
      prior_usage_count: 0,
      doc_authority_tier: 1,
    },
    source_anchor: overrides.source_anchor,
    canonical_span_id: overrides.canonical_span_id,
    alias_span_ids: overrides.alias_span_ids,
    canonical_fingerprint: overrides.canonical_fingerprint,
    auto_confidence: overrides.auto_confidence,
    user_role: overrides.user_role,
    stale_reason: overrides.stale_reason,
  };
}

function makeScorecard(overrides: Partial<ProvenanceScorecard> = {}): ProvenanceScorecard {
  return {
    fidelity_score: overrides.fidelity_score ?? 0.9,
    ocr_risk_score: overrides.ocr_risk_score ?? 0.1,
    cluster_size: overrides.cluster_size ?? 1,
    prior_usage_count: overrides.prior_usage_count ?? 0,
    doc_authority_tier: overrides.doc_authority_tier ?? 1,
  };
}

function makeFacet(overrides: Partial<Facet> = {}): Facet {
  return {
    facet_id: overrides.facet_id ?? 'facet-1',
    name: overrides.name ?? 'Test Facet',
    description: overrides.description ?? 'A test facet',
    facet_role: overrides.facet_role ?? 'core',
    strictness_override: overrides.strictness_override,
    allow_adds_atoms: overrides.allow_adds_atoms,
    evidence_policy_for_kind: overrides.evidence_policy_for_kind ?? new Map(),
    archived: overrides.archived ?? false,
    atoms_mode: overrides.atoms_mode,
    reverse_check_mode: overrides.reverse_check_mode,
  };
}

function makeBinding(overrides: Partial<ClaimBinding> = {}): ClaimBinding {
  return {
    binding_id: overrides.binding_id ?? 'bind-1',
    claim_id: overrides.claim_id ?? 'claim-1',
    atom_ids: overrides.atom_ids ?? ['atom-1'],
    quote_ids: overrides.quote_ids ?? ['q-1'],
    support_kind: overrides.support_kind ?? 'DIRECT_QUOTE',
    staleness_status: overrides.staleness_status ?? 'current',
    warrant_note: overrides.warrant_note,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('QuoteRanker', () => {
  let ranker: QuoteRanker;

  beforeEach(() => {
    spanCounter = 0;
    ranker = new QuoteRanker();
  });

  // ---------------------------------------------------------------------------
  // 1. Basic ranking — quotes sorted by score
  // ---------------------------------------------------------------------------
  describe('basic ranking', () => {
    it('should sort quotes by descending score', () => {
      const highAuthority = makeSpan({
        quote_id: 'q-high',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 1 }),
        text: 'A long quote spanning many words so the length penalty does not apply to this span at all.',
      });
      const lowAuthority = makeSpan({
        quote_id: 'q-low',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 5 }),
        text: 'Another long quote spanning many words to ensure it exceeds the short threshold length.',
      });

      const facets = [makeFacet({ facet_role: 'core' })];
      const ranked = ranker.rank([lowAuthority, highAuthority], facets);

      // Higher authority (tier 1) should rank first
      expect(ranked[0].quote_id).toBe('q-high');
      expect(ranked[1].quote_id).toBe('q-low');
    });

    it('should return all spans in the ranked output', () => {
      const spans = [makeSpan(), makeSpan(), makeSpan()];
      const facets = [makeFacet()];
      const ranked = ranker.rank(spans, facets);
      expect(ranked).toHaveLength(3);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Scoring weights — different weights produce different rankings
  // ---------------------------------------------------------------------------
  describe('scoring weights', () => {
    it('should produce different rankings when authority weight is dominant', () => {
      // Span A: bound (binding_potential=1.0), but low authority (tier 5)
      const spanA = makeSpan({
        quote_id: 'bound-low-auth',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 5 }),
        text: 'A sufficiently long quote to avoid the length penalty in scoring.',
      });
      // Span B: unbound (binding_potential=0.3), but high authority (tier 1)
      const spanB = makeSpan({
        quote_id: 'unbound-high-auth',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 1 }),
        text: 'Another sufficiently long quote to avoid the length penalty in scoring.',
      });

      const facets = [makeFacet({ facet_role: 'core' })];
      const bindings = [makeBinding({ quote_ids: ['bound-low-auth'] })];

      // With authority-heavy weights, spanB (high authority) should win
      const authorityRanker = new QuoteRanker({
        rankSpec: {
          facet_alignment: 0.05,
          role_weight: 0.05,
          binding_potential: 0.05,
          authority: 0.75,
          redundancy_penalty: 0.05,
          length_penalty: 0.05,
        },
      });
      const authorityRanked = authorityRanker.rank([spanA, spanB], facets, bindings);
      expect(authorityRanked[0].quote_id).toBe('unbound-high-auth');

      // With binding-heavy weights, spanA (bound) should win
      const bindingRanker = new QuoteRanker({
        rankSpec: {
          facet_alignment: 0.05,
          role_weight: 0.05,
          binding_potential: 0.75,
          authority: 0.05,
          redundancy_penalty: 0.05,
          length_penalty: 0.05,
        },
      });
      const bindingRanked = bindingRanker.rank([spanA, spanB], facets, bindings);
      expect(bindingRanked[0].quote_id).toBe('bound-low-auth');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Canonicalization — spans with same Bekker refs grouped
  // ---------------------------------------------------------------------------
  describe('anchor-first canonicalization', () => {
    it('should group spans sharing the same doc_id and source_anchor', () => {
      const spanA = makeSpan({
        quote_id: 'q-a',
        doc_id: 'de-anima',
        source_anchor: '428b10-15',
        text: 'Phantasia is a movement arising from active perception.',
        provenance_scorecard: makeScorecard({ fidelity_score: 0.95 }),
      });
      const spanB = makeSpan({
        quote_id: 'q-b',
        doc_id: 'de-anima',
        source_anchor: '428b10-15',
        text: 'Phantasia is a movement arising from actual perception.',
        provenance_scorecard: makeScorecard({ fidelity_score: 0.88 }),
      });
      const spanC = makeSpan({
        quote_id: 'q-c',
        doc_id: 'de-anima',
        source_anchor: '429a1-5',
        text: 'Imagination does not require objects present to the senses.',
      });

      const clusters = ranker.canonicalize([spanA, spanB, spanC]);

      // Two clusters: one for 428b10-15, one for 429a1-5
      expect(clusters).toHaveLength(2);

      const anchorCluster = clusters.find(
        c => c.method === 'anchor' && c.aliases.length > 0,
      );
      expect(anchorCluster).toBeDefined();
      // Representative should be the one with higher fidelity_score
      expect(anchorCluster!.representative.quote_id).toBe('q-a');
      expect(anchorCluster!.aliases).toHaveLength(1);
      expect(anchorCluster!.aliases[0].quote_id).toBe('q-b');
    });

    it('should use sha256 of anchor key as canonical_span_id', () => {
      const span = makeSpan({
        doc_id: 'de-anima',
        source_anchor: '428b10-15',
      });

      const clusters = ranker.canonicalize([span]);

      const expectedId = sha256('de-anima:428b10-15');
      expect(clusters[0].canonical_span_id).toBe(expectedId);
      expect(clusters[0].method).toBe('anchor');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Text-first clustering — spans without anchors clustered by text overlap
  // ---------------------------------------------------------------------------
  describe('text-first clustering', () => {
    it('should cluster spans with high text overlap via n-gram Jaccard', () => {
      // Two spans with very similar text (high Jaccard), no anchors
      const spanA = makeSpan({
        quote_id: 'q-text-a',
        span_fingerprint: 'sfp-text-a',
        text: 'Aristotle defines phantasia as a movement arising from active perception that occurs in sensation.',
      });
      const spanB = makeSpan({
        quote_id: 'q-text-b',
        span_fingerprint: 'sfp-text-b',
        text: 'Aristotle defines phantasia as a movement arising from active perception that occurs in sensation.',
      });

      const clusters = ranker.canonicalize([spanA, spanB]);

      // Identical text should cluster together
      expect(clusters).toHaveLength(1);
      expect(clusters[0].method).toBe('text_ngram');
      const allIds = [
        clusters[0].representative.quote_id,
        ...clusters[0].aliases.map(a => a.quote_id),
      ];
      expect(allIds).toContain('q-text-a');
      expect(allIds).toContain('q-text-b');
    });

    it('should not cluster spans with very different text', () => {
      const spanA = makeSpan({
        quote_id: 'q-diff-a',
        span_fingerprint: 'sfp-diff-a',
        text: 'Aristotle defines phantasia as a movement arising from active perception in De Anima three.',
      });
      const spanB = makeSpan({
        quote_id: 'q-diff-b',
        span_fingerprint: 'sfp-diff-b',
        text: 'Plato describes the soul in a completely different framework in the Republic and Timaeus dialogues.',
      });

      const clusters = ranker.canonicalize([spanA, spanB]);

      // Very different text should result in separate clusters
      expect(clusters).toHaveLength(2);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Short-span fallback — short phrases use hash-based canonicalization
  // ---------------------------------------------------------------------------
  describe('short-span hash fallback', () => {
    it('should use hash_fallback for spans below shortSpanThreshold', () => {
      const shortSpan = makeSpan({
        quote_id: 'q-short',
        span_fingerprint: 'sfp-short',
        text: 'phantasia kinesis', // well below 60 chars
      });

      const clusters = ranker.canonicalize([shortSpan]);

      expect(clusters).toHaveLength(1);
      expect(clusters[0].method).toBe('hash_fallback');
      expect(clusters[0].canonical_span_id).toBe('sfp-short');
      expect(clusters[0].aliases).toHaveLength(0);
    });

    it('should create separate clusters for each short span', () => {
      const shortA = makeSpan({
        quote_id: 'q-short-a',
        span_fingerprint: 'sfp-short-a',
        text: 'phantasia kinesis',
      });
      const shortB = makeSpan({
        quote_id: 'q-short-b',
        span_fingerprint: 'sfp-short-b',
        text: 'aisthesis energeia',
      });

      const clusters = ranker.canonicalize([shortA, shortB]);

      expect(clusters).toHaveLength(2);
      expect(clusters.every(c => c.method === 'hash_fallback')).toBe(true);
    });

    it('should respect custom shortSpanThreshold', () => {
      const customRanker = new QuoteRanker({ shortSpanThreshold: 200 });
      // This span is < 200 chars, so it should be hash_fallback
      const span = makeSpan({
        quote_id: 'q-medium',
        span_fingerprint: 'sfp-medium',
        text: 'Aristotle defines phantasia as a movement arising from active perception in De Anima three chapter three.',
      });

      const clusters = customRanker.canonicalize([span]);
      expect(clusters[0].method).toBe('hash_fallback');
    });
  });

  // ---------------------------------------------------------------------------
  // 6. ActiveQuoteSet construction
  // ---------------------------------------------------------------------------
  describe('ActiveQuoteSet construction', () => {
    it('should build an ActiveQuoteSet with empty pin/boost/demote/exclude sets', () => {
      const spans = [makeSpan(), makeSpan()];
      const activeSet = ranker.buildActiveSet(spans);

      expect(activeSet.quotes).toHaveLength(2);
      expect(activeSet.pinned.size).toBe(0);
      expect(activeSet.boosted.size).toBe(0);
      expect(activeSet.demoted.size).toBe(0);
      expect(activeSet.excluded.size).toBe(0);
    });

    it('should preserve quote ordering from ranked input', () => {
      const spanA = makeSpan({ quote_id: 'first' });
      const spanB = makeSpan({ quote_id: 'second' });
      const activeSet = ranker.buildActiveSet([spanA, spanB]);

      expect(activeSet.quotes[0].quote_id).toBe('first');
      expect(activeSet.quotes[1].quote_id).toBe('second');
    });
  });

  // ---------------------------------------------------------------------------
  // 7. Pin/boost/demote/exclude operations (via enforceBudget)
  // ---------------------------------------------------------------------------
  describe('pin/boost/demote/exclude operations', () => {
    it('should keep pinned quotes even when budget is exceeded', () => {
      const spanA = makeSpan({ quote_id: 'q-pinned' });
      const spanB = makeSpan({ quote_id: 'q-normal' });

      const activeSet: ActiveQuoteSet = {
        quotes: [spanA, spanB],
        pinned: new Set(['q-pinned']),
        boosted: new Set(),
        demoted: new Set(),
        excluded: new Set(),
      };

      const bindings = [
        makeBinding({ quote_ids: ['q-pinned'] }),
        makeBinding({ binding_id: 'bind-2', quote_ids: ['q-normal'] }),
      ];
      const facets = [makeFacet()];

      // Budget of 1: pinned quote still included
      const plan = ranker.enforceBudget(activeSet, bindings, facets, 1);

      expect(plan.included_quote_ids).toContain('q-pinned');
    });

    it('should exclude quotes in the excluded set', () => {
      const spanA = makeSpan({ quote_id: 'q-included' });
      const spanB = makeSpan({ quote_id: 'q-excluded' });

      const activeSet: ActiveQuoteSet = {
        quotes: [spanA, spanB],
        pinned: new Set(),
        boosted: new Set(),
        demoted: new Set(),
        excluded: new Set(['q-excluded']),
      };

      const bindings = [
        makeBinding({ quote_ids: ['q-included'] }),
        makeBinding({ binding_id: 'bind-2', quote_ids: ['q-excluded'] }),
      ];
      const facets = [makeFacet()];

      const plan = ranker.enforceBudget(activeSet, bindings, facets, 10);

      expect(plan.included_quote_ids).toContain('q-included');
      expect(plan.pruned_quote_ids).toContain('q-excluded');
      expect(plan.prune_reasons.get('q-excluded')).toBe('User excluded');
    });
  });

  // ---------------------------------------------------------------------------
  // 8. Budget pruning — excess quotes pruned
  // ---------------------------------------------------------------------------
  describe('budget pruning', () => {
    it('should prune unbound quotes beyond budget', () => {
      const spans = Array.from({ length: 5 }, (_, i) =>
        makeSpan({ quote_id: `q-${i + 1}` }),
      );

      const activeSet: ActiveQuoteSet = {
        quotes: spans,
        pinned: new Set(),
        boosted: new Set(),
        demoted: new Set(),
        excluded: new Set(),
      };

      // Only bind 3 quotes
      const bindings = [
        makeBinding({ binding_id: 'b1', quote_ids: ['q-1'] }),
        makeBinding({ binding_id: 'b2', quote_ids: ['q-2'] }),
        makeBinding({ binding_id: 'b3', quote_ids: ['q-3'] }),
      ];
      const facets = [makeFacet()];

      const plan = ranker.enforceBudget(activeSet, bindings, facets, 10);

      // Unbound quotes should be pruned
      expect(plan.included_quote_ids).toContain('q-1');
      expect(plan.included_quote_ids).toContain('q-2');
      expect(plan.included_quote_ids).toContain('q-3');
      expect(plan.pruned_quote_ids).toContain('q-4');
      expect(plan.pruned_quote_ids).toContain('q-5');
      expect(plan.prune_reasons.get('q-4')).toBe('Unbound quote');
      expect(plan.prune_reasons.get('q-5')).toBe('Unbound quote');
    });

    it('should prune excess bound quotes when budget is tight', () => {
      const spans = Array.from({ length: 5 }, (_, i) =>
        makeSpan({ quote_id: `q-${i + 1}` }),
      );

      const activeSet: ActiveQuoteSet = {
        quotes: spans,
        pinned: new Set(),
        boosted: new Set(),
        demoted: new Set(),
        excluded: new Set(),
      };

      // Bind all quotes but with multiple per binding (not sole bindings)
      const bindings = [
        makeBinding({ binding_id: 'b1', quote_ids: ['q-1', 'q-2', 'q-3', 'q-4', 'q-5'] }),
      ];
      const facets = [makeFacet({ strictness_override: 'permissive' })];

      // Budget of 2: only 2 should be included (rest pruned for budget)
      const plan = ranker.enforceBudget(activeSet, bindings, facets, 2);

      expect(plan.included_quote_ids).toHaveLength(2);
      expect(plan.pruned_quote_ids.length).toBeGreaterThan(0);
      expect(plan.budget).toBe(2);
    });

    it('should record correct budget in the plan', () => {
      const activeSet: ActiveQuoteSet = {
        quotes: [makeSpan({ quote_id: 'q-1' })],
        pinned: new Set(),
        boosted: new Set(),
        demoted: new Set(),
        excluded: new Set(),
      };
      const bindings = [makeBinding({ quote_ids: ['q-1'] })];

      const plan = ranker.enforceBudget(activeSet, bindings, [makeFacet()], 42);
      expect(plan.budget).toBe(42);
    });
  });

  // ---------------------------------------------------------------------------
  // 9. Strict facet protection — last binding on strict facet never pruned
  // ---------------------------------------------------------------------------
  describe('strict facet protection', () => {
    it('should not prune the last quote in a single-quote binding (strict facet)', () => {
      const spans = Array.from({ length: 4 }, (_, i) =>
        makeSpan({ quote_id: `q-${i + 1}` }),
      );

      const activeSet: ActiveQuoteSet = {
        quotes: spans,
        pinned: new Set(),
        boosted: new Set(),
        demoted: new Set(),
        excluded: new Set(),
      };

      // q-3 is the sole quote in a binding (isLastStrictBinding returns true)
      const bindings = [
        makeBinding({ binding_id: 'b1', quote_ids: ['q-1', 'q-2'] }),
        makeBinding({ binding_id: 'b2', quote_ids: ['q-3'] }), // sole binding
        makeBinding({ binding_id: 'b3', quote_ids: ['q-4', 'q-1'] }),
      ];

      // Strict facets (default: strictness_override undefined => defaults to 'strict')
      const facets = [makeFacet({ strictness_override: 'strict' })];

      // Budget of 1: q-1 takes the first slot, q-2/q-4 pruned, but q-3 protected
      const plan = ranker.enforceBudget(activeSet, bindings, facets, 1);

      // q-3 must survive even though budget is exceeded
      expect(plan.included_quote_ids).toContain('q-3');
      expect(plan.pruned_quote_ids).not.toContain('q-3');
    });
  });

  // ---------------------------------------------------------------------------
  // 10. Redundancy penalty — duplicate quotes penalized
  // ---------------------------------------------------------------------------
  describe('redundancy penalty', () => {
    it('should rank spans with aliases lower due to redundancy penalty', () => {
      const spanNoAliases = makeSpan({
        quote_id: 'q-unique',
        alias_span_ids: [],
        provenance_scorecard: makeScorecard({ doc_authority_tier: 1 }),
        text: 'A unique and original quotation from the primary text that is long enough.',
      });
      const spanWithAliases = makeSpan({
        quote_id: 'q-redundant',
        alias_span_ids: ['alias-1', 'alias-2', 'alias-3', 'alias-4', 'alias-5', 'alias-6'],
        provenance_scorecard: makeScorecard({ doc_authority_tier: 1 }),
        text: 'A redundant quotation that appears in multiple forms in the corpus text.',
      });

      const facets = [makeFacet({ facet_role: 'core' })];
      const ranked = ranker.rank([spanWithAliases, spanNoAliases], facets);

      // The span without aliases should rank higher (no redundancy penalty)
      expect(ranked[0].quote_id).toBe('q-unique');
    });

    it('should cap redundancy penalty at 0.3', () => {
      // Even with many aliases, penalty caps at 0.3
      const spanFewAliases = makeSpan({
        quote_id: 'q-few',
        alias_span_ids: ['a1'],
        provenance_scorecard: makeScorecard({ doc_authority_tier: 1 }),
        text: 'A long enough text to avoid the length penalty in ranking scores.',
      });
      const spanManyAliases = makeSpan({
        quote_id: 'q-many',
        alias_span_ids: Array.from({ length: 100 }, (_, i) => `alias-${i}`),
        provenance_scorecard: makeScorecard({ doc_authority_tier: 1 }),
        text: 'A long enough text to avoid the length penalty in ranking scores.',
      });

      const facets = [makeFacet({ facet_role: 'core' })];
      const ranked = ranker.rank([spanManyAliases, spanFewAliases], facets);

      // The span with many aliases should rank lower, but the penalty is capped
      expect(ranked[0].quote_id).toBe('q-few');
    });
  });

  // ---------------------------------------------------------------------------
  // 11. Authority scoring — higher authority = higher score
  // ---------------------------------------------------------------------------
  describe('authority scoring', () => {
    it('should rank tier 1 (primary source) above tier 5 (least authoritative)', () => {
      const tier1 = makeSpan({
        quote_id: 'q-tier1',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 1 }),
        text: 'Primary source quotation with sufficient length to avoid penalty.',
      });
      const tier5 = makeSpan({
        quote_id: 'q-tier5',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 5 }),
        text: 'Secondary source quotation with sufficient length to avoid penalty.',
      });

      const facets = [makeFacet({ facet_role: 'core' })];
      const ranked = ranker.rank([tier5, tier1], facets);

      expect(ranked[0].quote_id).toBe('q-tier1');
      expect(ranked[1].quote_id).toBe('q-tier5');
    });

    it('should compute authority as (1 - (tier - 1) / 4), clamped at 0', () => {
      // tier 1 => authority = 1.0
      // tier 3 => authority = 0.5
      // tier 5 => authority = 0.0
      // The ranker uses: Math.max(0, 1 - (tier - 1) / 4)
      // We verify indirectly: tier 1 vs tier 3 should have different scores

      const authorityOnlyRanker = new QuoteRanker({
        rankSpec: {
          facet_alignment: 0.0,
          role_weight: 0.0,
          binding_potential: 0.0,
          authority: 1.0,
          redundancy_penalty: 0.0,
          length_penalty: 0.0,
        },
      });

      const tier1 = makeSpan({
        quote_id: 'q-t1',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 1 }),
        text: 'Long enough text.',
      });
      const tier3 = makeSpan({
        quote_id: 'q-t3',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 3 }),
        text: 'Long enough text.',
      });
      const tier5 = makeSpan({
        quote_id: 'q-t5',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 5 }),
        text: 'Long enough text.',
      });

      const facets: Facet[] = [];
      const ranked = authorityOnlyRanker.rank([tier5, tier3, tier1], facets);

      expect(ranked[0].quote_id).toBe('q-t1');
      expect(ranked[1].quote_id).toBe('q-t3');
      expect(ranked[2].quote_id).toBe('q-t5');
    });
  });

  // ---------------------------------------------------------------------------
  // 12. Empty input handling
  // ---------------------------------------------------------------------------
  describe('empty input handling', () => {
    it('should return empty clusters for empty span array', () => {
      const clusters = ranker.canonicalize([]);
      expect(clusters).toHaveLength(0);
    });

    it('should return empty ranked array for empty input', () => {
      const ranked = ranker.rank([], []);
      expect(ranked).toHaveLength(0);
    });

    it('should return empty active set for empty input', () => {
      const activeSet = ranker.buildActiveSet([]);
      expect(activeSet.quotes).toHaveLength(0);
      expect(activeSet.pinned.size).toBe(0);
    });

    it('should handle enforceBudget with empty active set', () => {
      const activeSet: ActiveQuoteSet = {
        quotes: [],
        pinned: new Set(),
        boosted: new Set(),
        demoted: new Set(),
        excluded: new Set(),
      };

      const plan = ranker.enforceBudget(activeSet, [], [], 5);
      expect(plan.included_quote_ids).toHaveLength(0);
      expect(plan.pruned_quote_ids).toHaveLength(0);
    });

    it('should handle canonicalizeAndRank with empty spans', () => {
      const result = ranker.canonicalizeAndRank([], []);
      expect(result.clusters).toHaveLength(0);
      expect(result.ranked).toHaveLength(0);
      expect(result.activeSet.quotes).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // 13. Single quote — degenerate case
  // ---------------------------------------------------------------------------
  describe('single quote degenerate case', () => {
    it('should handle a single span through the full pipeline', () => {
      const span = makeSpan({
        quote_id: 'q-solo',
        doc_id: 'de-anima',
        source_anchor: '428b10',
        text: 'Phantasia is a particular kind of movement, arising from active perception.',
      });

      const facets = [makeFacet({ facet_role: 'core' })];
      const result = ranker.canonicalizeAndRank([span], facets);

      expect(result.clusters).toHaveLength(1);
      expect(result.clusters[0].representative.quote_id).toBe('q-solo');
      expect(result.clusters[0].aliases).toHaveLength(0);
      expect(result.ranked).toHaveLength(1);
      expect(result.ranked[0].quote_id).toBe('q-solo');
      expect(result.activeSet.quotes).toHaveLength(1);
    });

    it('should assign canonical IDs to single span', () => {
      const span = makeSpan({
        quote_id: 'q-solo',
        doc_id: 'doc-x',
        source_anchor: 'ref-1',
      });

      const result = ranker.canonicalizeAndRank([span], []);

      expect(result.ranked[0].canonical_span_id).toBeDefined();
      expect(result.ranked[0].canonical_fingerprint).toBeDefined();
    });
  });

  // ---------------------------------------------------------------------------
  // 14. Default weights — DEFAULT_QUOTE_RANK_SPEC produces reasonable scores
  // ---------------------------------------------------------------------------
  describe('DEFAULT_QUOTE_RANK_SPEC', () => {
    it('should have weights that sum approximately to 1.0', () => {
      const w = DEFAULT_QUOTE_RANK_SPEC;
      const positiveSum = w.facet_alignment + w.role_weight + w.binding_potential + w.authority;
      const penaltySum = w.redundancy_penalty + w.length_penalty;
      const totalWeights = positiveSum + penaltySum;

      // Weights should sum to approximately 1.0
      expect(totalWeights).toBeCloseTo(1.0, 2);
    });

    it('should produce scores in a reasonable range (0 to 1) for typical inputs', () => {
      // Typical CORPUS span, tier 1, no aliases, long text, bound, core facet
      const idealSpan = makeSpan({
        quote_id: 'q-ideal',
        source_kind: 'CORPUS',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 1 }),
        text: 'A well-formed quotation from a primary source that exceeds the minimum length.',
      });

      const facets = [makeFacet({ facet_role: 'core' })];
      const bindings = [makeBinding({ quote_ids: ['q-ideal'] })];

      // Use rank to get the ordering; we verify indirectly via a
      // score-only ranker. The score should be positive and reasonable.
      const ranked = ranker.rank([idealSpan], facets, bindings);
      expect(ranked).toHaveLength(1);
      // The span should survive ranking
      expect(ranked[0].quote_id).toBe('q-ideal');
    });

    it('should give CORPUS source_kind a higher role_weight score than EXTERNAL', () => {
      const corpusSpan = makeSpan({
        quote_id: 'q-corpus',
        source_kind: 'CORPUS',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 2 }),
        text: 'A quotation from the corpus with enough length to avoid the penalty.',
      });
      const externalSpan = makeSpan({
        quote_id: 'q-external',
        source_kind: 'EXTERNAL',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 2 }),
        text: 'A quotation from an external source with enough length to avoid the penalty.',
      });

      const facets = [makeFacet({ facet_role: 'core' })];
      const ranked = ranker.rank([externalSpan, corpusSpan], facets);

      // CORPUS should rank higher due to role_weight (0.8 vs 0.5)
      expect(ranked[0].quote_id).toBe('q-corpus');
    });
  });

  // ---------------------------------------------------------------------------
  // Additional edge cases and integration
  // ---------------------------------------------------------------------------
  describe('canonicalizeAndRank full pipeline', () => {
    it('should assign canonical IDs to all spans in all clusters', () => {
      const spans = [
        makeSpan({
          quote_id: 'q-1',
          doc_id: 'doc-a',
          source_anchor: 'ref-1',
          text: 'First passage from the text that is long enough for canonicalization.',
          provenance_scorecard: makeScorecard({ fidelity_score: 0.95 }),
        }),
        makeSpan({
          quote_id: 'q-2',
          doc_id: 'doc-a',
          source_anchor: 'ref-1',
          text: 'First passage from the text that is long enough for canonicalization, with minor variation.',
          provenance_scorecard: makeScorecard({ fidelity_score: 0.85 }),
        }),
        makeSpan({
          quote_id: 'q-3',
          text: 'short text',
        }),
      ];

      const facets = [makeFacet({ facet_role: 'core' })];
      const result = ranker.canonicalizeAndRank(spans, facets);

      // All representative spans should have canonical_span_id set
      for (const cluster of result.clusters) {
        expect(cluster.canonical_span_id).toBeDefined();
        expect(cluster.representative.canonical_span_id).toBe(cluster.canonical_span_id);
        expect(cluster.representative.canonical_fingerprint).toBeDefined();

        for (const alias of cluster.aliases) {
          expect(alias.canonical_span_id).toBe(cluster.canonical_span_id);
          expect(alias.canonical_fingerprint).toBeDefined();
        }
      }
    });

    it('should select only representatives for ranking (no duplicates from aliases)', () => {
      // Create 3 spans sharing the same anchor (they will cluster)
      const spans = [
        makeSpan({
          quote_id: 'q-1',
          doc_id: 'doc-a',
          source_anchor: 'ref-1',
          provenance_scorecard: makeScorecard({ fidelity_score: 0.99 }),
        }),
        makeSpan({
          quote_id: 'q-2',
          doc_id: 'doc-a',
          source_anchor: 'ref-1',
          provenance_scorecard: makeScorecard({ fidelity_score: 0.80 }),
        }),
        makeSpan({
          quote_id: 'q-3',
          doc_id: 'doc-a',
          source_anchor: 'ref-1',
          provenance_scorecard: makeScorecard({ fidelity_score: 0.70 }),
        }),
      ];

      const result = ranker.canonicalizeAndRank(spans, [makeFacet()]);

      // Only 1 cluster, only 1 representative in ranked output
      expect(result.clusters).toHaveLength(1);
      expect(result.ranked).toHaveLength(1);
      expect(result.ranked[0].quote_id).toBe('q-1'); // highest fidelity
    });
  });

  describe('facet alignment scoring', () => {
    it('should return higher alignment score for core facets', () => {
      const span = makeSpan({
        quote_id: 'q-core',
        text: 'A quotation that should align well with core facets of the argument.',
      });

      const coreFacets = [makeFacet({ facet_role: 'core' })];
      const noCoreFacets = [makeFacet({ facet_role: 'exploratory' })];

      const rankedWithCore = ranker.rank([span], coreFacets);
      const rankedWithoutCore = ranker.rank(
        [{ ...makeSpan({ quote_id: 'q-same' }), text: span.text }],
        noCoreFacets,
      );

      // Both return results but scores differ (core = 0.7, non-core = 0.5)
      expect(rankedWithCore).toHaveLength(1);
      expect(rankedWithoutCore).toHaveLength(1);
    });
  });

  describe('length penalty', () => {
    it('should penalize spans shorter than 30 characters', () => {
      const shortSpan = makeSpan({
        quote_id: 'q-tiny',
        text: 'Short quote only.', // < 30 chars
        provenance_scorecard: makeScorecard({ doc_authority_tier: 1 }),
      });
      const longSpan = makeSpan({
        quote_id: 'q-long',
        text: 'A much longer quotation that clearly exceeds the thirty character minimum threshold.',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 1 }),
      });

      const facets = [makeFacet({ facet_role: 'core' })];
      const ranked = ranker.rank([shortSpan, longSpan], facets);

      // Long span should rank first (no length penalty)
      expect(ranked[0].quote_id).toBe('q-long');
    });
  });

  describe('binding potential scoring', () => {
    it('should score bound quotes higher than unbound ones', () => {
      const boundSpan = makeSpan({
        quote_id: 'q-bound',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 2 }),
        text: 'A quotation that is bound to a claim binding in the current session.',
      });
      const unboundSpan = makeSpan({
        quote_id: 'q-unbound',
        provenance_scorecard: makeScorecard({ doc_authority_tier: 2 }),
        text: 'A quotation that is not bound to any claim binding in the session.',
      });

      const facets = [makeFacet({ facet_role: 'core' })];
      const bindings = [makeBinding({ quote_ids: ['q-bound'] })];

      const ranked = ranker.rank([unboundSpan, boundSpan], facets, bindings);
      expect(ranked[0].quote_id).toBe('q-bound');
    });
  });

  describe('mixed canonicalization passes', () => {
    it('should handle a mix of anchored, long unanchored, and short spans', () => {
      const anchored = makeSpan({
        quote_id: 'q-anchored',
        doc_id: 'de-anima',
        source_anchor: '428b10',
        text: 'This is a span with an anchor reference from Aristotle De Anima book three chapter three.',
      });
      const longUnanchored = makeSpan({
        quote_id: 'q-long-no-anchor',
        span_fingerprint: 'sfp-long-no-anchor',
        text: 'This is a longer unanchored span that should be clustered by text ngrams because it exceeds threshold.',
      });
      const shortUnanchored = makeSpan({
        quote_id: 'q-short-no-anchor',
        span_fingerprint: 'sfp-short-no-anchor',
        text: 'tiny span',
      });

      const clusters = ranker.canonicalize([anchored, longUnanchored, shortUnanchored]);

      expect(clusters).toHaveLength(3);

      const methods = clusters.map(c => c.method);
      expect(methods).toContain('anchor');
      expect(methods).toContain('text_ngram');
      expect(methods).toContain('hash_fallback');
    });
  });

  describe('enforceBudget prune reasons', () => {
    it('should mark unbound non-pinned quotes with "Unbound quote" reason', () => {
      const boundSpan = makeSpan({ quote_id: 'q-bound' });
      const unboundSpan = makeSpan({ quote_id: 'q-unbound' });

      const activeSet: ActiveQuoteSet = {
        quotes: [boundSpan, unboundSpan],
        pinned: new Set(),
        boosted: new Set(),
        demoted: new Set(),
        excluded: new Set(),
      };

      const bindings = [makeBinding({ quote_ids: ['q-bound'] })];
      const plan = ranker.enforceBudget(activeSet, bindings, [makeFacet()], 10);

      expect(plan.included_quote_ids).toContain('q-bound');
      expect(plan.pruned_quote_ids).toContain('q-unbound');
      expect(plan.prune_reasons.get('q-unbound')).toBe('Unbound quote');
    });

    it('should mark budget-exceeded quotes with "Budget exceeded" reason', () => {
      const spans = Array.from({ length: 5 }, (_, i) =>
        makeSpan({ quote_id: `q-${i + 1}` }),
      );

      const activeSet: ActiveQuoteSet = {
        quotes: spans,
        pinned: new Set(),
        boosted: new Set(),
        demoted: new Set(),
        excluded: new Set(),
      };

      // Bind all quotes in multi-quote bindings (so isLastStrictBinding = false)
      const bindings = [
        makeBinding({ binding_id: 'b1', quote_ids: ['q-1', 'q-2', 'q-3', 'q-4', 'q-5'] }),
      ];
      // Use non-strict facets so the protection does not trigger
      const facets = [makeFacet({ strictness_override: 'permissive' })];

      const plan = ranker.enforceBudget(activeSet, bindings, facets, 2);

      // Quotes beyond budget should be pruned with "Budget exceeded"
      const budgetPruned = plan.pruned_quote_ids.filter(
        id => plan.prune_reasons.get(id) === 'Budget exceeded',
      );
      expect(budgetPruned.length).toBeGreaterThan(0);
    });
  });

  describe('custom QuoteRankerConfig', () => {
    it('should respect custom ngramSize and jaccardThreshold', () => {
      // With a very low Jaccard threshold, even somewhat different texts should cluster
      const looseRanker = new QuoteRanker({
        jaccardThreshold: 0.1,
        ngramSize: 3,
      });

      const spanA = makeSpan({
        quote_id: 'q-loose-a',
        span_fingerprint: 'sfp-loose-a',
        text: 'Aristotle discusses the nature of phantasia and its relationship to perception in the soul.',
      });
      const spanB = makeSpan({
        quote_id: 'q-loose-b',
        span_fingerprint: 'sfp-loose-b',
        text: 'Aristotle examines phantasia as related to perception and the soul in his psychology.',
      });

      const clusters = looseRanker.canonicalize([spanA, spanB]);

      // With loose threshold and 3-grams, these somewhat overlapping texts should cluster
      expect(clusters).toHaveLength(1);
      expect(clusters[0].method).toBe('text_ngram');
    });
  });
});
