/**
 * Writing Contract Builder
 *
 * Takes verified quotes grouped by facet and produces a WritingContract
 * with coverage gap surfacing and profile-driven strictness thresholds.
 *
 * @module writing-contract-builder
 */

import type {
  WritingContract,
  QuoteSpan,
  Facet,
  ClaimBinding,
  ClaimAtom,
  FacetCoverageRequirement,
  SectionOutlineEntry,
  EvidenceStrictness,
  EvidenceScarcityWarning,
  BlockReason,
} from '../composition/icp-types.js';
import { VERIFIED_STATUSES } from '../composition/icp-types.js';

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface WritingContractBuilderConfig {
  /** Estimated paragraphs per facet */
  paragraphsPerFacet?: number;
  /** Default audience */
  defaultAudience?: string;
}

const DEFAULT_CONFIG: Required<WritingContractBuilderConfig> = {
  paragraphsPerFacet: 3,
  defaultAudience: 'academic',
};

// =============================================================================
// CONTRACT BUILD RESULT
// =============================================================================

export interface ContractBuildResult {
  contract: WritingContract;
  coverage_gaps: CoverageGap[];
  scarcity_warnings: EvidenceScarcityWarning[];
  block_reasons: BlockReason[];
}

export interface CoverageGap {
  facet_id: string;
  facet_name: string;
  gap_type: 'missing_evidence' | 'below_threshold' | 'no_definitional_span' | 'single_source';
  details: string;
}

// =============================================================================
// WRITING CONTRACT BUILDER
// =============================================================================

export class WritingContractBuilder {
  private readonly config: Required<WritingContractBuilderConfig>;

  constructor(config: WritingContractBuilderConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Build a writing contract from facets, spans, atoms, and bindings.
   */
  build(
    thesis: string,
    scope: string,
    facets: Facet[],
    spans: QuoteSpan[],
    atoms: ClaimAtom[],
    bindings: ClaimBinding[],
  ): ContractBuildResult {
    const coverageGaps: CoverageGap[] = [];
    const scarcityWarnings: EvidenceScarcityWarning[] = [];
    const blockReasons: BlockReason[] = [];

    // Group spans by facet
    const spansByFacet = this.groupSpansByFacet(spans, atoms, bindings, facets);

    // Build coverage requirements per facet
    const facetRequirements = new Map<string, FacetCoverageRequirement>();
    for (const facet of facets) {
      if (facet.archived) continue;
      const strictness = facet.strictness_override ?? 'strict';
      const requirement = this.buildCoverageRequirement(facet, strictness);
      facetRequirements.set(facet.facet_id, requirement);

      // Check coverage
      const facetSpans = spansByFacet.get(facet.facet_id) ?? [];
      const gaps = this.checkCoverage(facet, facetSpans, requirement);
      coverageGaps.push(...gaps);

      // Check if strict mode blocks generation
      if (strictness === 'strict' && gaps.some(g => g.gap_type === 'missing_evidence')) {
        blockReasons.push({
          action: 'generate',
          facet_id: facet.facet_id,
          rule_id: 'strict_coverage',
          required_state: `>= ${requirement.min_verified_spans} verified spans`,
          observed_state: `${facetSpans.filter(s => VERIFIED_STATUSES.has(s.verification_status)).length} verified spans`,
          minimal_remediations: [
            'Retrieve more evidence for this facet',
            'Verify existing flagged quotes',
            `Relax facet "${facet.name}" to moderate`,
          ],
        });
      }
    }

    // Select required quotations (pinned, high-value)
    const requiredQuotations = this.selectRequiredQuotations(spans, bindings);

    // Build section outline
    const sectionOutline = this.buildSectionOutline(facets);

    const contract: WritingContract = {
      thesis,
      scope,
      required_quotations: requiredQuotations,
      audience: this.config.defaultAudience,
      section_outline: sectionOutline,
      facet_requirements: facetRequirements,
    };

    return {
      contract,
      coverage_gaps: coverageGaps,
      scarcity_warnings: scarcityWarnings,
      block_reasons: blockReasons,
    };
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  /**
   * Group spans by facet through the atom→binding→quote chain.
   */
  private groupSpansByFacet(
    spans: QuoteSpan[],
    atoms: ClaimAtom[],
    bindings: ClaimBinding[],
    facets: Facet[],
  ): Map<string, QuoteSpan[]> {
    const result = new Map<string, QuoteSpan[]>();

    // Build atom→facet mapping
    const atomFacetMap = new Map<string, string>();
    for (const atom of atoms) {
      atomFacetMap.set(atom.atom_id, atom.facet_id);
    }

    // Build quote→facets mapping through bindings
    const quoteFacets = new Map<string, Set<string>>();
    for (const binding of bindings) {
      const facetIds = new Set<string>();
      for (const atomId of binding.atom_ids) {
        const facetId = atomFacetMap.get(atomId);
        if (facetId) facetIds.add(facetId);
      }
      for (const quoteId of binding.quote_ids) {
        if (!quoteFacets.has(quoteId)) {
          quoteFacets.set(quoteId, new Set());
        }
        for (const fid of facetIds) {
          quoteFacets.get(quoteId)!.add(fid);
        }
      }
    }

    // Group spans
    for (const span of spans) {
      const facetIds = quoteFacets.get(span.quote_id) ?? new Set();
      for (const facetId of facetIds) {
        if (!result.has(facetId)) {
          result.set(facetId, []);
        }
        result.get(facetId)!.push(span);
      }
    }

    return result;
  }

  /**
   * Build coverage requirement for a facet based on strictness.
   */
  private buildCoverageRequirement(
    facet: Facet,
    strictness: EvidenceStrictness,
  ): FacetCoverageRequirement {
    switch (strictness) {
      case 'strict':
        return {
          facet_id: facet.facet_id,
          min_verified_spans: 2,
          min_definitional_spans: facet.facet_role === 'core' ? 1 : 0,
          min_distinct_documents: 2,
          strictness: 'strict',
        };
      case 'moderate':
        return {
          facet_id: facet.facet_id,
          min_verified_spans: 1,
          min_definitional_spans: 0,
          min_distinct_documents: 1,
          strictness: 'moderate',
        };
      case 'permissive':
        return {
          facet_id: facet.facet_id,
          min_verified_spans: 0,
          min_definitional_spans: 0,
          min_distinct_documents: 0,
          strictness: 'permissive',
        };
    }
  }

  /**
   * Check coverage for a facet against its requirement.
   */
  private checkCoverage(
    facet: Facet,
    spans: QuoteSpan[],
    requirement: FacetCoverageRequirement,
  ): CoverageGap[] {
    const gaps: CoverageGap[] = [];
    const verified = spans.filter(s => VERIFIED_STATUSES.has(s.verification_status));
    const docs = new Set(verified.map(s => s.doc_id));
    const definitional = verified.filter(s =>
      /\b(is|are|means?|defines?|denotes?)\b/i.test(s.text),
    );

    if (verified.length < requirement.min_verified_spans) {
      gaps.push({
        facet_id: facet.facet_id,
        facet_name: facet.name,
        gap_type: verified.length === 0 ? 'missing_evidence' : 'below_threshold',
        details: `${verified.length}/${requirement.min_verified_spans} verified spans`,
      });
    }

    if (definitional.length < requirement.min_definitional_spans) {
      gaps.push({
        facet_id: facet.facet_id,
        facet_name: facet.name,
        gap_type: 'no_definitional_span',
        details: `${definitional.length}/${requirement.min_definitional_spans} definitional spans`,
      });
    }

    if (docs.size < requirement.min_distinct_documents) {
      gaps.push({
        facet_id: facet.facet_id,
        facet_name: facet.name,
        gap_type: 'single_source',
        details: `${docs.size}/${requirement.min_distinct_documents} distinct documents`,
      });
    }

    return gaps;
  }

  /**
   * Select required quotations (those that must appear in final text).
   */
  private selectRequiredQuotations(
    spans: QuoteSpan[],
    bindings: ClaimBinding[],
  ): QuoteSpan[] {
    // Required: direct_quote bindings with verified spans
    const directQuoteIds = new Set(
      bindings
        .filter(b => b.support_kind === 'DIRECT_QUOTE')
        .flatMap(b => b.quote_ids),
    );

    return spans.filter(
      s => directQuoteIds.has(s.quote_id) && VERIFIED_STATUSES.has(s.verification_status),
    );
  }

  /**
   * Build section outline from facets.
   */
  private buildSectionOutline(facets: Facet[]): SectionOutlineEntry[] {
    const activeFacets = facets.filter(f => !f.archived);

    // Core facets first, then supporting, then exploratory
    const sorted = [...activeFacets].sort((a, b) => {
      const roleOrder = { core: 0, supporting: 1, exploratory: 2 };
      return (roleOrder[a.facet_role] ?? 2) - (roleOrder[b.facet_role] ?? 2);
    });

    return sorted.map((facet, index) => ({
      section_id: `section-${index + 1}`,
      title: facet.name,
      facet_ids: [facet.facet_id],
      paragraph_count_estimate: this.config.paragraphsPerFacet,
    }));
  }
}
