/**
 * Tests for WritingContractBuilder — Verified Quotes to WritingContract
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  WritingContractBuilder,
  type ContractBuildResult,
  type CoverageGap,
} from '../../../../src/god-agent/core/writing/writing-contract-builder.js';
import type {
  QuoteSpan,
  Facet,
  ClaimAtom,
  ClaimBinding,
  FacetCoverageRequirement,
  SectionOutlineEntry,
  EvidenceStrictness,
} from '../../../../src/god-agent/core/composition/icp-types.js';

// =============================================================================
// HELPERS
// =============================================================================

function makeSpan(overrides: Partial<QuoteSpan> = {}): QuoteSpan {
  return {
    quote_id: 'q-1',
    text_fingerprint: 'fp-1',
    span_fingerprint: 'sfp-1',
    doc_id: 'doc-1',
    page: 42,
    source_kind: 'CORPUS',
    clean_text_range: [0, 100],
    clean_range_hash: 'hash-1',
    patch_epoch: 0,
    normalization_policy_version: '1.0.0',
    text: 'Phantasia is a movement arising from sense perception.',
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

function makeFacet(overrides: Partial<Facet> = {}): Facet {
  return {
    facet_id: 'facet-1',
    name: 'Phantasia Definition',
    description: 'How Aristotle defines phantasia',
    facet_role: 'core',
    strictness_override: 'strict',
    evidence_policy_for_kind: new Map(),
    archived: false,
    ...overrides,
  };
}

function makeAtom(overrides: Partial<ClaimAtom> = {}): ClaimAtom {
  return {
    atom_id: 'atom-1',
    atom_version_id: 1,
    display_text: 'Phantasia is perception-based',
    semantic_text: 'phantasia perception',
    modality: 'asserted',
    kind: 'corpus_claim',
    parent_claim_id: 'C1',
    evidence_mode: 'DIRECT_QUOTE',
    bound_quote_ids: ['q-1'],
    facet_id: 'facet-1',
    ...overrides,
  };
}

function makeBinding(overrides: Partial<ClaimBinding> = {}): ClaimBinding {
  return {
    binding_id: 'bind-1',
    claim_id: 'C1',
    atom_ids: ['atom-1'],
    quote_ids: ['q-1'],
    support_kind: 'DIRECT_QUOTE',
    staleness_status: 'current',
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('WritingContractBuilder', () => {
  let builder: WritingContractBuilder;

  beforeEach(() => {
    builder = new WritingContractBuilder();
  });

  // ===========================================================================
  // 1. Contract from verified quotes
  // ===========================================================================

  describe('build() — basic contract creation', () => {
    it('should produce a contract with thesis, scope, audience, and section outline', () => {
      const facet = makeFacet();
      const atom = makeAtom({ facet_id: facet.facet_id });
      const span = makeSpan({ verification_status: 'human_verified' });
      const binding = makeBinding({
        atom_ids: [atom.atom_id],
        quote_ids: [span.quote_id],
        support_kind: 'DIRECT_QUOTE',
      });

      const result = builder.build(
        'Phantasia is perception-based',
        'De Anima III.3',
        [facet],
        [span],
        [atom],
        [binding],
      );

      expect(result.contract.thesis).toBe('Phantasia is perception-based');
      expect(result.contract.scope).toBe('De Anima III.3');
      expect(result.contract.audience).toBe('academic');
      expect(result.contract.section_outline.length).toBeGreaterThan(0);
    });

    it('should select required_quotations from direct_quote bindings with verified spans', () => {
      const span = makeSpan({ quote_id: 'q-direct', verification_status: 'auto_verified' });
      const paraphraseSpan = makeSpan({
        quote_id: 'q-para',
        verification_status: 'auto_verified',
      });
      const facet = makeFacet({ strictness_override: 'permissive' });
      const atom = makeAtom({ facet_id: facet.facet_id });
      const directBinding = makeBinding({
        binding_id: 'b-direct',
        atom_ids: [atom.atom_id],
        quote_ids: ['q-direct'],
        support_kind: 'DIRECT_QUOTE',
      });
      const paraBinding = makeBinding({
        binding_id: 'b-para',
        atom_ids: [atom.atom_id],
        quote_ids: ['q-para'],
        support_kind: 'PARAPHRASE',
      });

      const result = builder.build(
        'Thesis',
        'Scope',
        [facet],
        [span, paraphraseSpan],
        [atom],
        [directBinding, paraBinding],
      );

      const requiredIds = result.contract.required_quotations.map(q => q.quote_id);
      expect(requiredIds).toContain('q-direct');
      expect(requiredIds).not.toContain('q-para');
    });

    it('should not include unverified spans in required_quotations', () => {
      const span = makeSpan({ quote_id: 'q-flagged', verification_status: 'flagged' });
      const facet = makeFacet({ strictness_override: 'permissive' });
      const atom = makeAtom({ facet_id: facet.facet_id });
      const binding = makeBinding({
        atom_ids: [atom.atom_id],
        quote_ids: ['q-flagged'],
        support_kind: 'DIRECT_QUOTE',
      });

      const result = builder.build(
        'Thesis',
        'Scope',
        [facet],
        [span],
        [atom],
        [binding],
      );

      expect(result.contract.required_quotations).toHaveLength(0);
    });
  });

  // ===========================================================================
  // 2. Coverage gap detection
  // ===========================================================================

  describe('coverage gap detection', () => {
    it('should report missing_evidence gap when facet has zero verified spans (strict mode)', () => {
      const facet = makeFacet({ facet_id: 'f-empty', strictness_override: 'strict' });

      const result = builder.build(
        'Thesis',
        'Scope',
        [facet],
        [], // no spans at all
        [],
        [],
      );

      expect(result.coverage_gaps.length).toBeGreaterThan(0);
      const missingGap = result.coverage_gaps.find(
        g => g.facet_id === 'f-empty' && g.gap_type === 'missing_evidence',
      );
      expect(missingGap).toBeDefined();
    });

    it('should report below_threshold gap when verified span count is below requirement', () => {
      const facet = makeFacet({ facet_id: 'f-low', strictness_override: 'strict' });
      // strict requires min 2 verified spans; provide only 1
      const atom = makeAtom({ facet_id: 'f-low' });
      const span = makeSpan({ quote_id: 'q-1', doc_id: 'doc-1', verification_status: 'auto_verified' });
      const binding = makeBinding({
        atom_ids: [atom.atom_id],
        quote_ids: [span.quote_id],
      });

      const result = builder.build(
        'Thesis',
        'Scope',
        [facet],
        [span],
        [atom],
        [binding],
      );

      const belowGap = result.coverage_gaps.find(
        g => g.facet_id === 'f-low' && g.gap_type === 'below_threshold',
      );
      expect(belowGap).toBeDefined();
    });

    it('should report single_source gap when all spans come from one document (strict mode)', () => {
      const facet = makeFacet({ facet_id: 'f-single', strictness_override: 'strict' });
      const atom = makeAtom({ facet_id: 'f-single', atom_id: 'a-s' });
      // Two verified spans but from same doc
      const span1 = makeSpan({ quote_id: 'q-1', doc_id: 'doc-same', verification_status: 'auto_verified' });
      const span2 = makeSpan({ quote_id: 'q-2', doc_id: 'doc-same', verification_status: 'human_verified' });
      const binding = makeBinding({
        atom_ids: ['a-s'],
        quote_ids: ['q-1', 'q-2'],
      });

      const result = builder.build(
        'Thesis',
        'Scope',
        [facet],
        [span1, span2],
        [atom],
        [binding],
      );

      const singleSourceGap = result.coverage_gaps.find(
        g => g.facet_id === 'f-single' && g.gap_type === 'single_source',
      );
      expect(singleSourceGap).toBeDefined();
    });

    it('should report no gaps when permissive strictness is used', () => {
      const facet = makeFacet({
        facet_id: 'f-perm',
        strictness_override: 'permissive',
      });

      const result = builder.build(
        'Thesis',
        'Scope',
        [facet],
        [], // no spans
        [],
        [],
      );

      // Permissive has min 0 for everything, so no gap should be reported
      const gapsForFacet = result.coverage_gaps.filter(g => g.facet_id === 'f-perm');
      expect(gapsForFacet).toHaveLength(0);
    });
  });

  // ===========================================================================
  // 3. Section outline
  // ===========================================================================

  describe('section outline', () => {
    it('should create one section per active facet', () => {
      const f1 = makeFacet({
        facet_id: 'f1',
        name: 'Core Facet',
        facet_role: 'core',
        strictness_override: 'permissive',
      });
      const f2 = makeFacet({
        facet_id: 'f2',
        name: 'Supporting Facet',
        facet_role: 'supporting',
        strictness_override: 'permissive',
      });

      const result = builder.build('Thesis', 'Scope', [f1, f2], [], [], []);

      expect(result.contract.section_outline).toHaveLength(2);
    });

    it('should order sections: core first, then supporting, then exploratory', () => {
      const fExplore = makeFacet({
        facet_id: 'f-explore',
        name: 'Exploratory',
        facet_role: 'exploratory',
        strictness_override: 'permissive',
      });
      const fCore = makeFacet({
        facet_id: 'f-core',
        name: 'Core',
        facet_role: 'core',
        strictness_override: 'permissive',
      });
      const fSupp = makeFacet({
        facet_id: 'f-supp',
        name: 'Supporting',
        facet_role: 'supporting',
        strictness_override: 'permissive',
      });

      // Pass in non-sorted order
      const result = builder.build(
        'Thesis',
        'Scope',
        [fExplore, fCore, fSupp],
        [],
        [],
        [],
      );

      const titles = result.contract.section_outline.map(s => s.title);
      expect(titles).toEqual(['Core', 'Supporting', 'Exploratory']);
    });

    it('should skip archived facets in the section outline', () => {
      const active = makeFacet({
        facet_id: 'f-active',
        name: 'Active',
        strictness_override: 'permissive',
      });
      const archived = makeFacet({
        facet_id: 'f-archived',
        name: 'Archived',
        archived: true,
        strictness_override: 'permissive',
      });

      const result = builder.build('Thesis', 'Scope', [active, archived], [], [], []);

      expect(result.contract.section_outline).toHaveLength(1);
      expect(result.contract.section_outline[0].title).toBe('Active');
    });

    it('should set paragraph_count_estimate from config', () => {
      const customBuilder = new WritingContractBuilder({ paragraphsPerFacet: 5 });
      const facet = makeFacet({ strictness_override: 'permissive' });

      const result = customBuilder.build('Thesis', 'Scope', [facet], [], [], []);

      expect(result.contract.section_outline[0].paragraph_count_estimate).toBe(5);
    });
  });

  // ===========================================================================
  // 4. Strictness thresholds
  // ===========================================================================

  describe('strictness thresholds', () => {
    it('strict should require min 2 verified spans and 2 distinct docs', () => {
      const facet = makeFacet({ strictness_override: 'strict' });

      const result = builder.build('Thesis', 'Scope', [facet], [], [], []);

      const req = result.contract.facet_requirements.get(facet.facet_id);
      expect(req).toBeDefined();
      expect(req!.min_verified_spans).toBe(2);
      expect(req!.min_distinct_documents).toBe(2);
      expect(req!.strictness).toBe('strict');
    });

    it('moderate should require min 1 verified span and 1 distinct doc', () => {
      const facet = makeFacet({ strictness_override: 'moderate' });

      const result = builder.build('Thesis', 'Scope', [facet], [], [], []);

      const req = result.contract.facet_requirements.get(facet.facet_id);
      expect(req).toBeDefined();
      expect(req!.min_verified_spans).toBe(1);
      expect(req!.min_distinct_documents).toBe(1);
      expect(req!.strictness).toBe('moderate');
    });

    it('permissive should require 0 verified spans', () => {
      const facet = makeFacet({ strictness_override: 'permissive' });

      const result = builder.build('Thesis', 'Scope', [facet], [], [], []);

      const req = result.contract.facet_requirements.get(facet.facet_id);
      expect(req).toBeDefined();
      expect(req!.min_verified_spans).toBe(0);
      expect(req!.min_distinct_documents).toBe(0);
      expect(req!.strictness).toBe('permissive');
    });

    it('strict core facet should require min 1 definitional span', () => {
      const facet = makeFacet({
        strictness_override: 'strict',
        facet_role: 'core',
      });

      const result = builder.build('Thesis', 'Scope', [facet], [], [], []);

      const req = result.contract.facet_requirements.get(facet.facet_id);
      expect(req!.min_definitional_spans).toBe(1);
    });

    it('strict non-core facet should require 0 definitional spans', () => {
      const facet = makeFacet({
        strictness_override: 'strict',
        facet_role: 'supporting',
      });

      const result = builder.build('Thesis', 'Scope', [facet], [], [], []);

      const req = result.contract.facet_requirements.get(facet.facet_id);
      expect(req!.min_definitional_spans).toBe(0);
    });
  });

  // ===========================================================================
  // 5. Empty facets
  // ===========================================================================

  describe('empty facets', () => {
    it('should produce a valid contract with no facets', () => {
      const result = builder.build('Thesis', 'Scope', [], [], [], []);

      expect(result.contract.thesis).toBe('Thesis');
      expect(result.contract.section_outline).toHaveLength(0);
      expect(result.contract.required_quotations).toHaveLength(0);
      expect(result.coverage_gaps).toHaveLength(0);
      expect(result.block_reasons).toHaveLength(0);
    });
  });

  // ===========================================================================
  // 6. Block reasons
  // ===========================================================================

  describe('block reasons', () => {
    it('should include block reason when strict facet has missing evidence gap', () => {
      const facet = makeFacet({ facet_id: 'f-strict', strictness_override: 'strict' });

      const result = builder.build('Thesis', 'Scope', [facet], [], [], []);

      expect(result.block_reasons.length).toBeGreaterThan(0);
      const block = result.block_reasons.find(b => b.facet_id === 'f-strict');
      expect(block).toBeDefined();
      expect(block!.rule_id).toBe('strict_coverage');
      expect(block!.minimal_remediations.length).toBeGreaterThan(0);
    });

    it('should not include block reason for moderate facet with missing evidence', () => {
      const facet = makeFacet({
        facet_id: 'f-mod',
        strictness_override: 'moderate',
      });

      const result = builder.build('Thesis', 'Scope', [facet], [], [], []);

      const modBlock = result.block_reasons.find(b => b.facet_id === 'f-mod');
      expect(modBlock).toBeUndefined();
    });
  });

  // ===========================================================================
  // 7. Complete pipeline — full data flow
  // ===========================================================================

  describe('complete pipeline', () => {
    it('should produce zero coverage gaps when facet has sufficient evidence from multiple docs', () => {
      const facet = makeFacet({ facet_id: 'f-full', strictness_override: 'strict', facet_role: 'supporting' });
      const atom = makeAtom({ atom_id: 'a-full', facet_id: 'f-full' });
      // Two verified spans from two different documents
      const span1 = makeSpan({
        quote_id: 'q-1',
        doc_id: 'doc-1',
        verification_status: 'auto_verified',
      });
      const span2 = makeSpan({
        quote_id: 'q-2',
        doc_id: 'doc-2',
        verification_status: 'human_verified',
      });
      const binding = makeBinding({
        atom_ids: ['a-full'],
        quote_ids: ['q-1', 'q-2'],
      });

      const result = builder.build(
        'Thesis',
        'Scope',
        [facet],
        [span1, span2],
        [atom],
        [binding],
      );

      const facetGaps = result.coverage_gaps.filter(g => g.facet_id === 'f-full');
      expect(facetGaps).toHaveLength(0);
      expect(result.block_reasons).toHaveLength(0);
    });
  });

  // ===========================================================================
  // 8. Facet with no strictness override (defaults to strict)
  // ===========================================================================

  describe('default strictness', () => {
    it('should default to strict when strictness_override is undefined', () => {
      const facet = makeFacet({
        facet_id: 'f-default',
        strictness_override: undefined,
      });

      const result = builder.build('Thesis', 'Scope', [facet], [], [], []);

      // Should behave as strict (requirement = 2 verified spans)
      const req = result.contract.facet_requirements.get('f-default');
      expect(req).toBeDefined();
      expect(req!.strictness).toBe('strict');
      expect(req!.min_verified_spans).toBe(2);
    });
  });

  // ===========================================================================
  // 9. Custom audience
  // ===========================================================================

  describe('custom audience', () => {
    it('should use defaultAudience from config', () => {
      const customBuilder = new WritingContractBuilder({
        defaultAudience: 'general',
      });
      const facet = makeFacet({ strictness_override: 'permissive' });

      const result = customBuilder.build('Thesis', 'Scope', [facet], [], [], []);

      expect(result.contract.audience).toBe('general');
    });
  });

  // ===========================================================================
  // 10. No definitional span gap for core facets in strict mode
  // ===========================================================================

  describe('definitional span detection', () => {
    it('should detect no_definitional_span gap when core strict facet lacks definitional text', () => {
      const facet = makeFacet({
        facet_id: 'f-nodef',
        facet_role: 'core',
        strictness_override: 'strict',
      });
      const atom = makeAtom({ atom_id: 'a-nodef', facet_id: 'f-nodef' });
      // Two verified spans from different docs, but no definitional text (no "is"/"defines" etc.)
      const span1 = makeSpan({
        quote_id: 'q-1',
        doc_id: 'doc-1',
        verification_status: 'auto_verified',
        text: 'Phantasia operates through perception and memory.',
      });
      const span2 = makeSpan({
        quote_id: 'q-2',
        doc_id: 'doc-2',
        verification_status: 'human_verified',
        text: 'The soul apprehends through phantasia.',
      });
      const binding = makeBinding({
        atom_ids: ['a-nodef'],
        quote_ids: ['q-1', 'q-2'],
      });

      const result = builder.build(
        'Thesis',
        'Scope',
        [facet],
        [span1, span2],
        [atom],
        [binding],
      );

      const defGap = result.coverage_gaps.find(
        g => g.facet_id === 'f-nodef' && g.gap_type === 'no_definitional_span',
      );
      expect(defGap).toBeDefined();
    });

    it('should not flag no_definitional_span when span contains definitional language', () => {
      const facet = makeFacet({
        facet_id: 'f-hasdef',
        facet_role: 'core',
        strictness_override: 'strict',
      });
      const atom = makeAtom({ atom_id: 'a-hasdef', facet_id: 'f-hasdef' });
      const span1 = makeSpan({
        quote_id: 'q-def',
        doc_id: 'doc-1',
        verification_status: 'auto_verified',
        text: 'Phantasia is a movement resulting from sense perception.',
      });
      const span2 = makeSpan({
        quote_id: 'q-extra',
        doc_id: 'doc-2',
        verification_status: 'human_verified',
        text: 'This means phantasia arises from sensation.',
      });
      const binding = makeBinding({
        atom_ids: ['a-hasdef'],
        quote_ids: ['q-def', 'q-extra'],
      });

      const result = builder.build(
        'Thesis',
        'Scope',
        [facet],
        [span1, span2],
        [atom],
        [binding],
      );

      const defGap = result.coverage_gaps.find(
        g => g.facet_id === 'f-hasdef' && g.gap_type === 'no_definitional_span',
      );
      expect(defGap).toBeUndefined();
    });
  });
});
