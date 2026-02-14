/**
 * Quote Ranker — Hierarchical Canonicalization + Ranking + Budget
 *
 * Canonicalization strategy:
 *   1. Anchor-first: group by (work_id, anchor_range) when available
 *   2. Text-first: cluster by clean_text 7-gram Jaccard for spans >= threshold
 *   3. Short-span fallback: hash-based for spans < threshold
 *   4. Embeddings: secondary signal only (split/confirm, never create)
 *
 * @module quote-ranker
 */

import { createHash } from 'crypto';
import type {
  QuoteSpan,
  QuoteRankSpec,
  ActiveQuoteSet,
  QuoteBudgetPlan,
  Facet,
  ClaimBinding,
  NormalizationPolicy,
} from './icp-types.js';
import {
  DEFAULT_QUOTE_RANK_SPEC,
  DEFAULT_NORMALIZATION_POLICY,
} from './icp-types.js';
import { normalizeText, sha256 } from './quote-span-staleness.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface QuoteRankerConfig {
  /** Minimum char length for text-first canonicalization (below → hash-based) */
  shortSpanThreshold?: number;
  /** N-gram size for text clustering */
  ngramSize?: number;
  /** Jaccard similarity threshold for clustering */
  jaccardThreshold?: number;
  /** Normalization policy */
  normalizationPolicy?: NormalizationPolicy;
  /** Ranking weights */
  rankSpec?: QuoteRankSpec;
}

const DEFAULT_CONFIG: Required<QuoteRankerConfig> = {
  shortSpanThreshold: 60,
  ngramSize: 7,
  jaccardThreshold: 0.6,
  normalizationPolicy: DEFAULT_NORMALIZATION_POLICY,
  rankSpec: DEFAULT_QUOTE_RANK_SPEC,
};

// =============================================================================
// CANONICAL CLUSTER
// =============================================================================

export interface CanonicalCluster {
  canonical_span_id: string;
  representative: QuoteSpan;
  aliases: QuoteSpan[];
  method: 'anchor' | 'text_ngram' | 'hash_fallback';
}

// =============================================================================
// QUOTE RANKER
// =============================================================================

export class QuoteRanker {
  private readonly config: Required<QuoteRankerConfig>;

  constructor(config: QuoteRankerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Full pipeline: canonicalize → rank → build active set.
   */
  canonicalizeAndRank(
    spans: QuoteSpan[],
    facets: Facet[],
    bindings?: ClaimBinding[],
  ): { clusters: CanonicalCluster[]; ranked: QuoteSpan[]; activeSet: ActiveQuoteSet } {
    // Step 1: Canonicalize
    const clusters = this.canonicalize(spans);

    // Step 2: Assign canonical IDs
    this.assignCanonicalIds(clusters);

    // Step 3: Get representative spans
    const representatives = clusters.map(c => c.representative);

    // Step 4: Rank
    const ranked = this.rank(representatives, facets, bindings);

    // Step 5: Build active set
    const activeSet = this.buildActiveSet(ranked);

    return { clusters, ranked, activeSet };
  }

  /**
   * Hierarchical canonicalization.
   */
  canonicalize(spans: QuoteSpan[]): CanonicalCluster[] {
    const clusters: CanonicalCluster[] = [];
    const assigned = new Set<string>();

    // Pass 1: Anchor-first (preferred when available)
    const anchorGroups = new Map<string, QuoteSpan[]>();
    for (const span of spans) {
      if (span.source_anchor && !assigned.has(span.quote_id)) {
        const anchorKey = `${span.doc_id}:${span.source_anchor}`;
        if (!anchorGroups.has(anchorKey)) {
          anchorGroups.set(anchorKey, []);
        }
        anchorGroups.get(anchorKey)!.push(span);
      }
    }

    for (const [anchorKey, group] of anchorGroups) {
      if (group.length > 0) {
        const sorted = this.sortByFidelity(group);
        const representative = sorted[0];
        const aliases = sorted.slice(1);
        for (const s of group) assigned.add(s.quote_id);

        clusters.push({
          canonical_span_id: sha256(anchorKey),
          representative,
          aliases,
          method: 'anchor',
        });
      }
    }

    // Pass 2: Text-first for long spans (>= threshold)
    const unassignedLong = spans.filter(
      s => !assigned.has(s.quote_id) &&
           normalizeText(s.text, this.config.normalizationPolicy).length >= this.config.shortSpanThreshold,
    );

    const textClusters = this.clusterByNgrams(unassignedLong);
    for (const group of textClusters) {
      const sorted = this.sortByFidelity(group);
      const representative = sorted[0];
      const aliases = sorted.slice(1);
      for (const s of group) assigned.add(s.quote_id);

      const clusterKey = group.map(s => s.span_fingerprint).sort().join(':');
      clusters.push({
        canonical_span_id: sha256(clusterKey),
        representative,
        aliases,
        method: 'text_ngram',
      });
    }

    // Pass 3: Hash-based fallback for short spans
    const unassignedShort = spans.filter(s => !assigned.has(s.quote_id));
    for (const span of unassignedShort) {
      assigned.add(span.quote_id);
      clusters.push({
        canonical_span_id: span.span_fingerprint,
        representative: span,
        aliases: [],
        method: 'hash_fallback',
      });
    }

    return clusters;
  }

  /**
   * Assign canonical fingerprints to spans after canonicalization.
   */
  private assignCanonicalIds(clusters: CanonicalCluster[]): void {
    for (const cluster of clusters) {
      const allSpans = [cluster.representative, ...cluster.aliases];
      for (const span of allSpans) {
        span.canonical_span_id = cluster.canonical_span_id;
        span.alias_span_ids = cluster.aliases.map(a => a.span_fingerprint);
        // Compute canonical fingerprint
        span.canonical_fingerprint = sha256(
          span.doc_id + cluster.canonical_span_id + span.text_fingerprint,
        );
      }
    }
  }

  /**
   * Rank spans by scoring criteria.
   */
  rank(
    spans: QuoteSpan[],
    facets: Facet[],
    bindings?: ClaimBinding[],
  ): QuoteSpan[] {
    const w = this.config.rankSpec;
    const boundQuoteIds = new Set(
      (bindings ?? []).flatMap(b => b.quote_ids),
    );

    const scored = spans.map(span => {
      const facetAlign = this.scoreFacetAlignment(span, facets);
      const roleWeight = this.scoreRoleWeight(span);
      const bindingPotential = boundQuoteIds.has(span.quote_id) ? 1.0 : 0.3;
      const authority = Math.max(0, 1 - (span.provenance_scorecard.doc_authority_tier - 1) / 4);
      const redundancy = span.alias_span_ids?.length
        ? Math.min(0.3, span.alias_span_ids.length * 0.05)
        : 0;
      const lengthPenalty = span.text.length < 30 ? 0.2 : 0;

      const score =
        facetAlign * w.facet_alignment +
        roleWeight * w.role_weight +
        bindingPotential * w.binding_potential +
        authority * w.authority -
        redundancy * w.redundancy_penalty -
        lengthPenalty * w.length_penalty;

      return { span, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.map(s => s.span);
  }

  /**
   * Build ActiveQuoteSet from ranked spans.
   */
  buildActiveSet(rankedSpans: QuoteSpan[]): ActiveQuoteSet {
    return {
      quotes: rankedSpans,
      pinned: new Set(),
      boosted: new Set(),
      demoted: new Set(),
      excluded: new Set(),
    };
  }

  /**
   * Enforce budget post-binding: prune unused/redundant bindings.
   * HARD INVARIANT: never prune the last binding that satisfies a strict facet threshold.
   */
  enforceBudget(
    activeSet: ActiveQuoteSet,
    bindings: ClaimBinding[],
    facets: Facet[],
    budget: number,
  ): QuoteBudgetPlan {
    const boundQuoteIds = new Set(bindings.flatMap(b => b.quote_ids));
    const pinnedIds = activeSet.pinned;

    const included: string[] = [];
    const pruned: string[] = [];
    const pruneReasons = new Map<string, string>();

    for (const span of activeSet.quotes) {
      if (included.length >= budget && !pinnedIds.has(span.quote_id)) {
        // Check: is this the last binding for a strict facet?
        if (!this.isLastStrictBinding(span.quote_id, bindings, facets)) {
          pruned.push(span.quote_id);
          pruneReasons.set(span.quote_id, 'Budget exceeded');
          continue;
        }
      }

      if (activeSet.excluded.has(span.quote_id)) {
        pruned.push(span.quote_id);
        pruneReasons.set(span.quote_id, 'User excluded');
        continue;
      }

      if (!boundQuoteIds.has(span.quote_id) && !pinnedIds.has(span.quote_id)) {
        pruned.push(span.quote_id);
        pruneReasons.set(span.quote_id, 'Unbound quote');
        continue;
      }

      included.push(span.quote_id);
    }

    return {
      included_quote_ids: included,
      pruned_quote_ids: pruned,
      prune_reasons: pruneReasons,
      budget,
    };
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Cluster spans by 7-gram Jaccard/containment similarity.
   */
  private clusterByNgrams(spans: QuoteSpan[]): QuoteSpan[][] {
    if (spans.length === 0) return [];

    const policy = this.config.normalizationPolicy;
    const n = this.config.ngramSize;

    // Build n-gram sets
    const ngramSets = spans.map(span => {
      const normalized = normalizeText(span.text, policy).toLowerCase();
      return this.extractNgrams(normalized, n);
    });

    // Greedy clustering: assign each span to the first cluster with high overlap
    const clusters: QuoteSpan[][] = [];
    const clusterNgrams: Set<string>[] = [];
    const assigned = new Set<number>();

    for (let i = 0; i < spans.length; i++) {
      if (assigned.has(i)) continue;

      let bestCluster = -1;
      let bestScore = 0;

      for (let c = 0; c < clusters.length; c++) {
        const sim = this.jaccardSimilarity(ngramSets[i], clusterNgrams[c]);
        if (sim > bestScore && sim >= this.config.jaccardThreshold) {
          bestScore = sim;
          bestCluster = c;
        }
      }

      if (bestCluster >= 0) {
        clusters[bestCluster].push(spans[i]);
        // Merge ngrams
        for (const ng of ngramSets[i]) {
          clusterNgrams[bestCluster].add(ng);
        }
        assigned.add(i);
      } else {
        // New cluster
        clusters.push([spans[i]]);
        clusterNgrams.push(new Set(ngramSets[i]));
        assigned.add(i);
      }
    }

    return clusters;
  }

  /**
   * Extract character n-grams from text.
   */
  private extractNgrams(text: string, n: number): Set<string> {
    const ngrams = new Set<string>();
    for (let i = 0; i <= text.length - n; i++) {
      ngrams.add(text.slice(i, i + n));
    }
    return ngrams;
  }

  /**
   * Compute Jaccard similarity between two sets.
   */
  private jaccardSimilarity(a: Set<string>, b: Set<string>): number {
    let intersection = 0;
    for (const item of a) {
      if (b.has(item)) intersection++;
    }
    const union = a.size + b.size - intersection;
    return union === 0 ? 0 : intersection / union;
  }

  /**
   * Sort spans by fidelity score (highest first).
   */
  private sortByFidelity(spans: QuoteSpan[]): QuoteSpan[] {
    return [...spans].sort(
      (a, b) => b.provenance_scorecard.fidelity_score - a.provenance_scorecard.fidelity_score,
    );
  }

  /**
   * Score facet alignment for a span.
   */
  private scoreFacetAlignment(span: QuoteSpan, facets: Facet[]): number {
    // Simple: does the span's doc appear in a core facet's expected domain?
    // For now, return a neutral score — will be enhanced with retrieval metadata
    const coreFacets = facets.filter(f => f.facet_role === 'core');
    return coreFacets.length > 0 ? 0.7 : 0.5;
  }

  /**
   * Score role weight based on source kind and authority.
   */
  private scoreRoleWeight(span: QuoteSpan): number {
    if (span.source_kind === 'CORPUS') return 0.8;
    return 0.5;
  }

  /**
   * Check if a quote is the last binding for a strict facet.
   */
  private isLastStrictBinding(
    quoteId: string,
    bindings: ClaimBinding[],
    facets: Facet[],
  ): boolean {
    const strictFacetIds = new Set(
      facets
        .filter(f => (f.strictness_override ?? 'strict') === 'strict')
        .map(f => f.facet_id),
    );

    // Check if removing this quote would leave any strict facet below threshold
    for (const binding of bindings) {
      if (!binding.quote_ids.includes(quoteId)) continue;
      // If this is the only quote in a binding, check if binding is for a strict facet
      if (binding.quote_ids.length === 1) {
        // Would need atom→facet mapping to fully check; conservative: keep it
        return true;
      }
    }
    return false;
  }
}
