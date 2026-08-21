/**
 * Faceted Retrieval — Per-Facet Evidence Retrieval with Span Extraction
 *
 * Retrieves evidence organized by facets using SmartRetrievalLayer.
 * Implements two-phase SourceAdmissionPolicy enforcement:
 *   Phase 1 (candidate): allows quotes into verification pool
 *   Phase 2 (eligible): enforced at binding time (in claim-atom-binder)
 *
 * @module faceted-retrieval
 */

import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import type { ContextChunk, RetrievalOptions } from './types.js';
import type { SmartRetrievalLayer } from './smart-retrieval-layer.js';
import type {
  Facet,
  QuoteSpan,
  SourceScopeSpec,
  SourceAdmissionPolicy,
  SourceKind,
  EvidenceStrictness,
  EvidenceScarcityWarning,
  NormalizationPolicy,
  ProvenanceScorecard,
  VerificationStatus,
  PromptSpec,
} from '../core/composition/icp-types.js';
import {
  DEFAULT_NORMALIZATION_POLICY,
} from '../core/composition/icp-types.js';
import {
  normalizeText,
  sha256,
  computeTextFingerprint,
  computeSpanFingerprint,
  computeContextHash,
} from '../core/composition/quote-span-staleness.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface FacetedRetrievalConfig {
  /** Max chunks per facet */
  maxChunksPerFacet?: number;
  /** Min relevance threshold */
  minRelevance?: number;
  /** Context window size for span extraction (chars around sentence) */
  contextWindowChars?: number;
  /** Normalization policy */
  normalizationPolicy?: NormalizationPolicy;
}

const DEFAULT_CONFIG: Required<FacetedRetrievalConfig> = {
  maxChunksPerFacet: 15,
  minRelevance: 0.6,
  contextWindowChars: 40,
  normalizationPolicy: DEFAULT_NORMALIZATION_POLICY,
};

// =============================================================================
// FACET RETRIEVAL RESULT
// =============================================================================

export interface FacetRetrievalResult {
  facet_id: string;
  /** Quote spans extracted from this facet's retrieval */
  spans: QuoteSpan[];
  /** Raw chunks retrieved (for context) */
  chunks: ContextChunk[];
  /** Coverage stats */
  coverage: FacetCoverage;
  /** Scarcity warnings */
  scarcity_warnings: EvidenceScarcityWarning[];
}

export interface FacetCoverage {
  total_spans: number;
  verified_span_count: number;
  definitional_span_count: number;
  distinct_documents: number;
}

// =============================================================================
// FACETED RETRIEVAL ENGINE
// =============================================================================

export class FacetedRetrieval {
  private readonly retrieval: SmartRetrievalLayer;
  private readonly config: Required<FacetedRetrievalConfig>;

  constructor(
    retrieval: SmartRetrievalLayer,
    config: FacetedRetrievalConfig = {},
  ) {
    this.retrieval = retrieval;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Retrieve evidence for all facets in a PromptSpec.
   */
  async retrieveForAllFacets(
    promptSpec: PromptSpec,
    sourceScope: SourceScopeSpec,
    admissionPolicy?: SourceAdmissionPolicy,
  ): Promise<FacetRetrievalResult[]> {
    const results: FacetRetrievalResult[] = [];

    const allFacets = [...promptSpec.required_facets, ...promptSpec.optional_facets];

    for (const facet of allFacets) {
      const terms = promptSpec.retrieval_lexicon.get(facet.facet_id) ?? [];
      const result = await this.retrieveForFacet(
        facet,
        terms,
        sourceScope,
        admissionPolicy,
      );
      results.push(result);
    }

    return results;
  }

  /**
   * Retrieve evidence for a single facet.
   *
   * Uses SourceScopeSpec.corpus_config for collection filtering,
   * relevance thresholds, and chunk limits. Employs hybrid search
   * (semantic + keyword) with per-collection parallel retrieval.
   */
  async retrieveForFacet(
    facet: Facet,
    retrievalTerms: string[],
    sourceScope: SourceScopeSpec,
    admissionPolicy?: SourceAdmissionPolicy,
  ): Promise<FacetRetrievalResult> {
    const query = this.buildSemanticQuery(facet, retrievalTerms);
    const corpusConfig = sourceScope.corpus_config;
    const minRelevance = corpusConfig?.min_relevance ?? this.config.minRelevance;
    const maxChunks = corpusConfig?.max_chunks ?? this.config.maxChunksPerFacet;
    const collections = corpusConfig?.collections;

    // Retrieve chunks using hybrid search with per-collection parallel retrieval
    let chunks: ContextChunk[];

    if (collections && collections.length > 0) {
      // Per-collection parallel retrieval (mirrors SectionOrchestrator pattern)
      const chunksPerCollection = Math.ceil(maxChunks / collections.length);
      const retrievalPromises = collections.map(async (collection) => {
        try {
          return await this.retrieval.hybridSearch(
            query,
            retrievalTerms,
            { semantic: 0.7, keyword: 0.3 },
            {
              maxChunks: chunksPerCollection,
              minRelevance,
              collections: [collection],
              diversityBoost: true,
            },
          );
        } catch {
          // Individual collection failure is non-fatal
          return [];
        }
      });
      const allResults = await Promise.all(retrievalPromises);
      // Flatten, deduplicate by docId+page, sort by relevance, limit
      const flatResults = allResults.flat();
      const seen = new Set<string>();
      chunks = flatResults
        .filter(chunk => {
          const key = `${chunk.docId}:${chunk.metadata.page_start}`;
          if (seen.has(key)) return false;
          seen.add(key);
          return chunk.relevanceScore >= minRelevance;
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxChunks);
    } else {
      // Fallback: hybrid search without collection filtering
      try {
        chunks = await this.retrieval.hybridSearch(
          query,
          retrievalTerms,
          { semantic: 0.7, keyword: 0.3 },
          {
            maxChunks,
            minRelevance,
            diversityBoost: true,
          },
        );
        chunks = chunks
          .filter(c => c.relevanceScore >= minRelevance)
          .slice(0, maxChunks);
      } catch {
        // Final fallback: basic semantic search
        chunks = await this.retrieval.retrieveContext(query, {
          maxChunks,
          minRelevance,
        });
      }
    }

    // Extract spans from chunks (sentence-level)
    const spans: QuoteSpan[] = [];
    for (const chunk of chunks) {
      const extracted = this.extractSpansFromChunk(chunk, facet, retrievalTerms);
      // Apply candidate-phase admission if policy exists
      const admitted = admissionPolicy
        ? this.applyCandidateAdmission(extracted, facet, admissionPolicy)
        : extracted;
      spans.push(...admitted);
    }

    // Compute coverage
    const coverage = this.computeCoverage(spans);

    // Check for scarcity
    const scarcityWarnings = this.checkScarcity(
      facet,
      coverage,
      facet.strictness_override ?? 'strict',
    );

    return {
      facet_id: facet.facet_id,
      spans,
      chunks,
      coverage,
      scarcity_warnings: scarcityWarnings,
    };
  }

  /**
   * Extract QuoteSpans from a ContextChunk at sentence level.
   */
  private extractSpansFromChunk(
    chunk: ContextChunk,
    facet: Facet,
    retrievalTerms: string[],
  ): QuoteSpan[] {
    const text = chunk.clean_text ?? chunk.content;
    const sourceKind: SourceKind = chunk.source_kind ?? 'CORPUS';
    const policy = this.config.normalizationPolicy;

    // Split into sentences
    const sentences = this.splitIntoSentences(text);
    const spans: QuoteSpan[] = [];

    for (const sentence of sentences) {
      // All sentences from semantically-matched chunks are candidates.
      // Semantic search already ensures chunk relevance; verification (Stage 4)
      // and ranking (Stage 3) handle quality filtering downstream.

      // Compute fingerprints
      const textFingerprint = computeTextFingerprint(sentence.text, policy);
      const leftCtxHash = this.computeSentenceContextHash(
        text,
        sentence.start,
        sentence.end,
        'left',
        policy,
      );
      const rightCtxHash = this.computeSentenceContextHash(
        text,
        sentence.start,
        sentence.end,
        'right',
        policy,
      );
      const spanFingerprint = computeSpanFingerprint(
        chunk.docId,
        textFingerprint,
        leftCtxHash,
        rightCtxHash,
      );

      const span: QuoteSpan = {
        quote_id: randomUUID(),
        text_fingerprint: textFingerprint,
        span_fingerprint: spanFingerprint,
        doc_id: chunk.docId,
        page: chunk.metadata.page_start,
        source_kind: sourceKind,
        clean_text_range: [sentence.start, sentence.end],
        clean_range_hash: sha256(text.slice(sentence.start, sentence.end)),
        patch_epoch: 0,
        normalization_policy_version: policy.version,
        text: sentence.text,
        left_ctx_hash: leftCtxHash,
        right_ctx_hash: rightCtxHash,
        verification_status: 'flagged',
        provenance_scorecard: this.buildProvenanceScorecard(chunk, sentence.text),
      };

      if (chunk.metadata.page_start) {
        span.source_anchor = `p. ${chunk.metadata.page_start}`;
      }

      spans.push(span);
    }

    return spans;
  }

  /**
   * Split text into sentences with position tracking.
   */
  private splitIntoSentences(text: string): Array<{ text: string; start: number; end: number }> {
    const results: Array<{ text: string; start: number; end: number }> = [];

    // Simple sentence splitting: split on period/question/exclamation
    // followed by space and uppercase, or end of string
    const sentencePattern = /[^.!?]*[.!?]+(?:\s+|$)/g;
    let match: RegExpExecArray | null;

    while ((match = sentencePattern.exec(text)) !== null) {
      const sentenceText = match[0].trim();
      if (sentenceText.length >= 20) {
        results.push({
          text: sentenceText,
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }

    // If no sentences found, use the whole text
    if (results.length === 0 && text.trim().length >= 20) {
      results.push({ text: text.trim(), start: 0, end: text.length });
    }

    return results;
  }

  /**
   * Check if a sentence is relevant to facet retrieval terms.
   */
  private isRelevantToFacet(sentence: string, terms: string[]): boolean {
    const lower = sentence.toLowerCase();
    // At least one term present
    return terms.some(term => lower.includes(term.toLowerCase()));
  }

  /**
   * Build a natural language query from facet metadata for semantic search.
   * Uses the facet description (rich semantic signal) when available,
   * falling back to name + terms for keyword-extracted facets.
   */
  private buildSemanticQuery(facet: Facet, retrievalTerms: string[]): string {
    // Prefer description: it contains a natural language research question
    // that produces a semantically rich embedding
    if (facet.description && facet.description.length > 30) {
      return facet.description;
    }
    // Fall back to structured query: "facet name: term1, term2, term3"
    if (facet.name && retrievalTerms.length > 0) {
      return `${facet.name}: ${retrievalTerms.join(', ')}`;
    }
    // Last resort: space-joined terms (original behavior)
    return retrievalTerms.join(' ');
  }

  /**
   * Compute context hash for a sentence within chunk text.
   */
  private computeSentenceContextHash(
    chunkText: string,
    sentenceStart: number,
    sentenceEnd: number,
    side: 'left' | 'right',
    policy: NormalizationPolicy,
  ): string {
    return computeContextHash(
      chunkText,
      [sentenceStart, sentenceEnd],
      side,
      policy,
      this.config.contextWindowChars,
    );
  }

  /**
   * Build ProvenanceScorecard for a quote span.
   */
  private buildProvenanceScorecard(
    chunk: ContextChunk,
    quoteText: string,
  ): ProvenanceScorecard {
    return {
      fidelity_score: chunk.relevanceScore,
      ocr_risk_score: this.estimateOCRRisk(quoteText),
      cluster_size: 1,
      prior_usage_count: 0,
      doc_authority_tier: this.estimateAuthorityTier(chunk),
    };
  }

  /**
   * Estimate OCR risk from text characteristics.
   */
  private estimateOCRRisk(text: string): number {
    let risk = 0;

    // Check for common OCR artifacts
    if (/[ﬁﬂﬃﬄ]/.test(text)) risk += 0.2; // Ligatures
    if (/\w-\s*\n\s*\w/.test(text)) risk += 0.15; // Hyphenated line breaks
    if (/[^\x20-\x7E\u00C0-\u024F\u0370-\u03FF]/.test(text)) risk += 0.1; // Unusual chars
    if (text.length < 30) risk += 0.1; // Short quotes are riskier

    return Math.min(1.0, risk);
  }

  /**
   * Estimate authority tier from chunk metadata.
   */
  private estimateAuthorityTier(chunk: ContextChunk): number {
    const collection = chunk.metadata.collection?.toLowerCase() ?? '';
    if (collection.includes('primary') || collection.includes('ancient')) return 1;
    if (collection.includes('peer') || collection.includes('journal')) return 1;
    if (collection.includes('monograph') || collection.includes('book')) return 2;
    if (collection.includes('conference')) return 3;
    return 2; // Default to monograph tier
  }

  /**
   * Apply candidate-phase admission rules.
   * This is the minimal bar to reach the verification UI.
   */
  private applyCandidateAdmission(
    spans: QuoteSpan[],
    facet: Facet,
    policy: SourceAdmissionPolicy,
  ): QuoteSpan[] {
    const strictness = facet.strictness_override ?? 'strict';

    return spans.filter(span => {
      const rules = policy.candidate_rules.filter(
        r => r.source_kind === span.source_kind && r.strictness === strictness,
      );

      if (rules.length === 0) {
        // No matching rule — default: allow corpus, allow external if not auto_rejected
        if (span.source_kind === 'CORPUS') return true;
        return span.verification_status !== 'auto_rejected';
      }

      // Check if span meets candidate rules
      return rules.some(rule => {
        if (rule.min_authority_tier !== undefined) {
          if (span.provenance_scorecard.doc_authority_tier > rule.min_authority_tier) {
            return false;
          }
        }
        // Candidate phase doesn't check verification status strictly
        // (spans haven't been verified yet)
        return true;
      });
    });
  }

  /**
   * Compute coverage stats for a set of spans.
   */
  private computeCoverage(spans: QuoteSpan[]): FacetCoverage {
    const docs = new Set(spans.map(s => s.doc_id));
    const verified = spans.filter(s =>
      s.verification_status === 'auto_verified' ||
      s.verification_status === 'human_verified' ||
      s.verification_status === 'human_corrected',
    );

    // Heuristic: definitional spans contain "is" or "means" or "defines"
    const definitional = spans.filter(s =>
      /\b(is|are|means?|defines?|denotes?|refers?\s+to)\b/i.test(s.text),
    );

    return {
      total_spans: spans.length,
      verified_span_count: verified.length,
      definitional_span_count: definitional.length,
      distinct_documents: docs.size,
    };
  }

  /**
   * Check for evidence scarcity and emit warnings.
   */
  private checkScarcity(
    facet: Facet,
    coverage: FacetCoverage,
    strictness: EvidenceStrictness,
  ): EvidenceScarcityWarning[] {
    const warnings: EvidenceScarcityWarning[] = [];

    if (coverage.total_spans === 0) {
      warnings.push({
        facet_id: facet.facet_id,
        warning_type: 'low_span_count',
        details: `Facet "${facet.name}" has no evidence spans`,
      });
      return warnings;
    }

    if (strictness === 'strict') {
      if (coverage.total_spans < 2) {
        warnings.push({
          facet_id: facet.facet_id,
          warning_type: 'low_span_count',
          details: `Facet "${facet.name}" has only ${coverage.total_spans} span(s); strict mode requires >= 2`,
        });
      }

      if (coverage.definitional_span_count === 0 && facet.facet_role === 'core') {
        warnings.push({
          facet_id: facet.facet_id,
          warning_type: 'no_definitional_spans',
          details: `Core facet "${facet.name}" has no definitional spans`,
        });
      }

      if (coverage.distinct_documents < 2) {
        warnings.push({
          facet_id: facet.facet_id,
          warning_type: 'single_document',
          details: `Facet "${facet.name}" sources from only ${coverage.distinct_documents} document(s); strict mode requires >= 2`,
        });
      }
    }

    return warnings;
  }
}
