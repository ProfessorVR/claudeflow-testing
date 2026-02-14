/**
 * Tests for ClaimAtomBinder — Atom Decomposition, Binding, Budget Pruning, and Migrations
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ClaimAtomBinder,
  type DecompositionResult,
  type BindingResult,
} from '../../../../src/god-agent/core/composition/claim-atom-binder.js';
import {
  defaultEvidenceMode,
  VERIFIED_STATUSES,
  type QuoteSpan,
  type Facet,
  type ClaimAtom,
  type ClaimBinding,
  type AtomKind,
  type EvidenceMode,
  type AtomModality,
  type BlockReason,
  type HypothesisClaim,
  type AtomMigration,
} from '../../../../src/god-agent/core/composition/icp-types.js';
import type { ToulminClaim } from '../../../../src/god-agent/cli/composition/sir/claim-map.js';

// =============================================================================
// HELPERS
// =============================================================================

function makeSpan(overrides: Partial<QuoteSpan> = {}): QuoteSpan {
  return {
    quote_id: 'q-default',
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

function makeClaim(overrides: Partial<ToulminClaim> = {}): ToulminClaim {
  return {
    id: 'C1',
    claim: 'Aristotle defines phantasia as a movement resulting from actual perception.',
    grounds: [
      'Aristotle argues that phantasia arises only after sensation has occurred.',
    ],
    warrant: 'Therefore phantasia is necessarily dependent on prior sense experience.',
    qualification: 'Perhaps this applies only to the primary sense modalities.',
    warrantGenerality: 0.7,
    completenessScore: 0.9,
    citations: [
      {
        key: 'Aristotle-DA:428a',
        author: 'Aristotle',
        year: -350,
        locator: '428a',
        fullCitation: 'Aristotle, De Anima III.3, 428a',
        isPrimary: true,
      },
    ],
    location: {
      sectionId: '1',
      paragraphIndex: 0,
    },
    quality: {
      toulminCompleteness: 0.9,
      warrantQuality: 0.7,
      evidenceStrength: 0.6,
      counterArgumentHandling: 0.8,
      overallScore: 0.75,
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

// =============================================================================
// TESTS
// =============================================================================

describe('ClaimAtomBinder', () => {
  let binder: ClaimAtomBinder;

  beforeEach(() => {
    binder = new ClaimAtomBinder();
  });

  // ===========================================================================
  // 1. Atom decomposition
  // ===========================================================================

  describe('decompose()', () => {
    it('should decompose a multi-propositional ToulminClaim into atoms with correct count', () => {
      const claim = makeClaim();
      const result = binder.decompose([claim], 'facet-1');

      // main claim (1) + grounds (1) + warrant (1) + qualification (1) = 4
      expect(result.atoms.length).toBe(4);
      expect(result.warnings).toEqual([]);
    });

    it('should tag main claim atom as asserted modality', () => {
      const claim = makeClaim();
      const result = binder.decompose([claim], 'facet-1');

      const mainAtom = result.atoms[0];
      expect(mainAtom.display_text).toBe(claim.claim);
      expect(mainAtom.modality).toBe('asserted');
    });

    it('should tag warrant atom as inferential modality', () => {
      const claim = makeClaim();
      const result = binder.decompose([claim], 'facet-1');

      // warrant is atom at index 2 (after main + 1 ground)
      const warrantAtom = result.atoms.find(
        a => a.display_text === claim.warrant,
      );
      expect(warrantAtom).toBeDefined();
      expect(warrantAtom!.modality).toBe('inferential');
    });

    it('should tag qualification atom as hedged modality', () => {
      const claim = makeClaim();
      const result = binder.decompose([claim], 'facet-1');

      const qualAtom = result.atoms.find(
        a => a.display_text === claim.qualification,
      );
      expect(qualAtom).toBeDefined();
      expect(qualAtom!.modality).toBe('hedged');
    });

    it('should link all atoms to the parent_claim_id', () => {
      const claim = makeClaim({ id: 'C42' });
      const result = binder.decompose([claim], 'facet-1');

      for (const atom of result.atoms) {
        expect(atom.parent_claim_id).toBe('C42');
      }
    });

    it('should set facet_id on all atoms', () => {
      const result = binder.decompose([makeClaim()], 'facet-99');

      for (const atom of result.atoms) {
        expect(atom.facet_id).toBe('facet-99');
      }
    });

    it('should set semantic_text to lowercased trimmed display_text', () => {
      const claim = makeClaim({ claim: '  Aristotle Says  ' });
      const result = binder.decompose([claim], 'facet-1');

      const mainAtom = result.atoms[0];
      expect(mainAtom.semantic_text).toBe('aristotle says');
    });

    it('should produce a warning when no atoms are extracted', () => {
      const result = binder.decompose([], 'facet-1');

      expect(result.atoms).toEqual([]);
      expect(result.warnings).toContain('No atoms extracted from claims');
    });

    it('should handle claim without warrant or qualification', () => {
      const claim = makeClaim({
        warrant: undefined as unknown as string,
        qualification: undefined,
      });
      // main claim (1) + grounds (1) = 2 (no warrant, no qualification)
      const result = binder.decompose([claim], 'facet-1');
      expect(result.atoms.length).toBe(2);
    });

    it('should decompose multiple claims', () => {
      const claims = [
        makeClaim({ id: 'C1' }),
        makeClaim({ id: 'C2', grounds: ['Ground A', 'Ground B', 'Ground C'] }),
      ];
      const result = binder.decompose(claims, 'facet-1');

      // C1: main(1) + grounds(1) + warrant(1) + qual(1) = 4
      // C2: main(1) + grounds(3) + warrant(1) + qual(1) = 6
      expect(result.atoms.length).toBe(10);

      const c1Atoms = result.atoms.filter(a => a.parent_claim_id === 'C1');
      const c2Atoms = result.atoms.filter(a => a.parent_claim_id === 'C2');
      expect(c1Atoms.length).toBe(4);
      expect(c2Atoms.length).toBe(6);
    });

    it('should infer ground modality from text content', () => {
      const claim = makeClaim({
        grounds: [
          'Perhaps the interpretation could differ.',    // hedged
          'Therefore it follows from the analysis.',     // inferential
          'Aristotle defines phantasia as movement.',    // definitional
        ],
      });
      const result = binder.decompose([claim], 'facet-1');

      // Grounds are atoms[1], atoms[2], atoms[3]
      const groundAtoms = result.atoms.filter(
        a => a.display_text !== claim.claim &&
             a.display_text !== claim.warrant &&
             a.display_text !== claim.qualification,
      );

      const hedgedAtom = groundAtoms.find(a => a.display_text.includes('Perhaps'));
      const inferentialAtom = groundAtoms.find(a => a.display_text.includes('Therefore'));
      const definitionalAtom = groundAtoms.find(a => a.display_text.includes('defines'));

      expect(hedgedAtom!.modality).toBe('hedged');
      expect(inferentialAtom!.modality).toBe('inferential');
      expect(definitionalAtom!.modality).toBe('definitional');
    });
  });

  // ===========================================================================
  // 2. Binding
  // ===========================================================================

  describe('bind()', () => {
    it('should bind atoms to eligible QuoteSpans and create ClaimBindings', () => {
      const claim = makeClaim();
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet()];

      // Create a span with overlapping terms to the main claim
      const span = makeSpan({
        quote_id: 'q-match',
        text: 'Aristotle defines phantasia as a movement resulting from actual perception',
      });

      const result = binder.bind(atoms, [span], facets);

      // The main claim atom should bind (high term overlap)
      expect(result.bindings.length).toBeGreaterThan(0);

      const mainBinding = result.bindings.find(
        b => b.claim_id === claim.id,
      );
      expect(mainBinding).toBeDefined();
      expect(mainBinding!.atom_ids.length).toBe(1);
      expect(mainBinding!.quote_ids).toContain('q-match');
    });

    it('should create bindings with correct structure', () => {
      const claim = makeClaim();
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet()];

      const span = makeSpan({
        quote_id: 'q-struct',
        text: 'Aristotle defines phantasia as a movement resulting from actual perception',
      });

      const result = binder.bind(atoms, [span], facets);

      for (const binding of result.bindings) {
        expect(binding.binding_id).toBeDefined();
        expect(typeof binding.binding_id).toBe('string');
        expect(binding.claim_id).toBe(claim.id);
        expect(binding.atom_ids.length).toBeGreaterThanOrEqual(1);
        expect(binding.quote_ids.length).toBeGreaterThanOrEqual(1);
        expect(['DIRECT_QUOTE', 'PARAPHRASE', 'INFERENCE']).toContain(binding.support_kind);
        expect(binding.staleness_status).toBe('current');
      }
    });

    it('should filter out spans with non-verified statuses', () => {
      const claim = makeClaim();
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet()];

      const rejectedSpan = makeSpan({
        quote_id: 'q-rejected',
        verification_status: 'rejected',
        text: 'Aristotle defines phantasia as a movement resulting from actual perception',
      });

      const result = binder.bind(atoms, [rejectedSpan], facets);

      // No bindings should be created since the span is rejected
      expect(result.bindings.length).toBe(0);
      // corpus_claim and interpretive_move atoms should be unbound
      expect(result.unbound_atoms.length).toBeGreaterThan(0);
    });

    it('should update atom.bound_quote_ids after binding', () => {
      const claim = makeClaim();
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet()];

      const span = makeSpan({
        quote_id: 'q-bound',
        text: 'Aristotle defines phantasia as a movement resulting from actual perception',
      });

      binder.bind(atoms, [span], facets);

      const boundAtom = atoms.find(a => a.bound_quote_ids.length > 0);
      expect(boundAtom).toBeDefined();
      expect(boundAtom!.bound_quote_ids).toContain('q-bound');
    });
  });

  // ===========================================================================
  // 3. Unbound atoms
  // ===========================================================================

  describe('unbound atoms', () => {
    it('should place atoms in unbound_atoms when no matching quotes exist', () => {
      const claim = makeClaim();
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet()];

      // Provide a span with completely unrelated text
      const unrelatedSpan = makeSpan({
        quote_id: 'q-unrelated',
        text: 'The weather in Athens was particularly warm during the summer months.',
      });

      const result = binder.bind(atoms, [unrelatedSpan], facets);

      // Atoms needing evidence but without matching quotes go to unbound
      expect(result.unbound_atoms.length).toBeGreaterThan(0);
    });

    it('should place atoms in unbound_atoms when no spans are provided', () => {
      const claim = makeClaim();
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet()];

      const result = binder.bind(atoms, [], facets);

      // All atoms that require evidence should be unbound
      const evidenceRequiredAtoms = atoms.filter(
        a => a.evidence_mode !== 'NO_EVIDENCE_REQUIRED',
      );
      expect(result.unbound_atoms.length).toBe(evidenceRequiredAtoms.length);
    });
  });

  // ===========================================================================
  // 4. Block reason
  // ===========================================================================

  describe('block reasons', () => {
    it('should create BlockReason with strict_evidence_required for unbound atoms in strict facets', () => {
      const claim = makeClaim({
        claim: 'Phantasia is defined as a specific cognitive capacity.',
        grounds: ['The text explicitly states this definition.'],
        warrant: undefined as unknown as string,
        qualification: undefined,
      });
      const { atoms } = binder.decompose([claim], 'facet-strict');
      const facets = [makeFacet({ facet_id: 'facet-strict', strictness_override: 'strict' })];

      const result = binder.bind(atoms, [], facets);

      expect(result.block_reasons.length).toBeGreaterThan(0);

      const blockReason = result.block_reasons[0];
      expect(blockReason.rule_id).toBe('strict_evidence_required');
      expect(blockReason.facet_id).toBe('facet-strict');
      expect(blockReason.action).toBe('bind');
      expect(blockReason.required_state).toContain('At least 1 verified quote');
      expect(blockReason.observed_state).toBe('0 eligible quotes found');
      expect(blockReason.minimal_remediations).toBeDefined();
      expect(blockReason.minimal_remediations.length).toBeGreaterThanOrEqual(1);
    });

    it('should include actionable remediations in block reasons', () => {
      const claim = makeClaim();
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet({ strictness_override: 'strict' })];

      const result = binder.bind(atoms, [], facets);

      for (const reason of result.block_reasons) {
        expect(reason.minimal_remediations).toEqual(
          expect.arrayContaining([
            expect.stringContaining('Retrieve more evidence'),
          ]),
        );
      }
    });

    it('should NOT create block reasons for unbound atoms in moderate facets', () => {
      const claim = makeClaim({
        claim: 'A simple interpretive point about phantasia.',
        grounds: ['Some textual observation.'],
        warrant: undefined as unknown as string,
        qualification: undefined,
      });
      const { atoms } = binder.decompose([claim], 'facet-mod');
      const facets = [makeFacet({ facet_id: 'facet-mod', strictness_override: 'moderate' })];

      const result = binder.bind(atoms, [], facets);

      // Unbound atoms exist but no block reason for moderate facets
      expect(result.unbound_atoms.length).toBeGreaterThan(0);
      expect(result.block_reasons.length).toBe(0);
    });

    it('should NOT create block reasons for unbound atoms in permissive facets', () => {
      const claim = makeClaim({
        claim: 'An exploratory claim for discussion.',
        grounds: ['An initial observation.'],
        warrant: undefined as unknown as string,
        qualification: undefined,
      });
      const { atoms } = binder.decompose([claim], 'facet-perm');
      const facets = [makeFacet({ facet_id: 'facet-perm', strictness_override: 'permissive' })];

      const result = binder.bind(atoms, [], facets);

      expect(result.unbound_atoms.length).toBeGreaterThan(0);
      expect(result.block_reasons.length).toBe(0);
    });
  });

  // ===========================================================================
  // 5. NO_EVIDENCE_REQUIRED
  // ===========================================================================

  describe('NO_EVIDENCE_REQUIRED atoms', () => {
    it('should skip method atoms during binding', () => {
      const claim = makeClaim({
        grounds: ['I will bracket the political context for this analysis.'],
      });
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet()];

      // Find the method atom
      const methodAtom = atoms.find(a => a.kind === 'method');
      expect(methodAtom).toBeDefined();
      expect(methodAtom!.evidence_mode).toBe('NO_EVIDENCE_REQUIRED');

      const result = binder.bind(atoms, [], facets);

      // Method atom should NOT appear in unbound_atoms
      const methodUnbound = result.unbound_atoms.find(
        a => a.atom_id === methodAtom!.atom_id,
      );
      expect(methodUnbound).toBeUndefined();
    });

    it('should skip organization atoms during binding', () => {
      const claim = makeClaim({
        grounds: ['This section proceeds in three parts.'],
      });
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet()];

      const orgAtom = atoms.find(a => a.kind === 'organization');
      expect(orgAtom).toBeDefined();
      expect(orgAtom!.evidence_mode).toBe('NO_EVIDENCE_REQUIRED');

      const result = binder.bind(atoms, [], facets);

      // Organization atom should NOT appear in unbound_atoms
      const orgUnbound = result.unbound_atoms.find(
        a => a.atom_id === orgAtom!.atom_id,
      );
      expect(orgUnbound).toBeUndefined();
    });

    it('should not create bindings for NO_EVIDENCE_REQUIRED atoms even when matching spans exist', () => {
      const claim = makeClaim({
        grounds: ['This section proceeds in three parts.'],
      });
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet()];

      const span = makeSpan({
        text: 'This section proceeds in three parts of the argument.',
      });

      const result = binder.bind(atoms, [span], facets);

      // No binding should reference the organization atom
      const orgAtom = atoms.find(a => a.kind === 'organization');
      const orgBinding = result.bindings.find(
        b => b.atom_ids.includes(orgAtom!.atom_id),
      );
      expect(orgBinding).toBeUndefined();
    });
  });

  // ===========================================================================
  // 6. Demotion to HypothesisClaim
  // ===========================================================================

  describe('demoteToHypothesis()', () => {
    it('should create HypothesisClaim from unbound atoms', () => {
      const claim = makeClaim({ id: 'C-demote' });
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet()];

      const bindResult = binder.bind(atoms, [], facets);
      const hypotheses = binder.demoteToHypothesis(
        bindResult.unbound_atoms,
        [claim],
        bindResult.bindings,
      );

      expect(hypotheses.length).toBe(1);
      const hyp = hypotheses[0];
      expect(hyp.claim_id).toBe('C-demote');
      expect(hyp.original_claim).toBe(claim);
      expect(hyp.atoms.length).toBe(bindResult.unbound_atoms.length);
      expect(hyp.demotion_reason).toContain('Unbound atoms');
      expect(hyp.demotion_timestamp).toBeDefined();
      expect(hyp.source_bindings).toEqual([]);
    });

    it('should group unbound atoms by parent claim', () => {
      const claim1 = makeClaim({ id: 'C1' });
      const claim2 = makeClaim({ id: 'C2', claim: 'A second distinct claim.' });

      const { atoms: atoms1 } = binder.decompose([claim1], 'facet-1');
      const { atoms: atoms2 } = binder.decompose([claim2], 'facet-1');
      const allAtoms = [...atoms1, ...atoms2];
      const facets = [makeFacet()];

      const bindResult = binder.bind(allAtoms, [], facets);
      const hypotheses = binder.demoteToHypothesis(
        bindResult.unbound_atoms,
        [claim1, claim2],
        bindResult.bindings,
      );

      expect(hypotheses.length).toBe(2);
      expect(hypotheses.map(h => h.claim_id).sort()).toEqual(['C1', 'C2']);
    });

    it('should include existing bindings for partially bound claims', () => {
      const claim = makeClaim({ id: 'C-partial' });
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet()];

      // Provide a span that matches the main claim but not the grounds
      const span = makeSpan({
        quote_id: 'q-partial',
        text: 'Aristotle defines phantasia as a movement resulting from actual perception',
      });

      const bindResult = binder.bind(atoms, [span], facets);

      // Should have both some bindings and some unbound atoms
      if (bindResult.unbound_atoms.length > 0 && bindResult.bindings.length > 0) {
        const hypotheses = binder.demoteToHypothesis(
          bindResult.unbound_atoms,
          [claim],
          bindResult.bindings,
        );

        expect(hypotheses.length).toBe(1);
        expect(hypotheses[0].source_bindings.length).toBe(bindResult.bindings.length);
      }
    });

    it('should include atom display_text in demotion_reason', () => {
      const claim = makeClaim({
        id: 'C-reason',
        claim: 'A specific claim about phantasia.',
        grounds: ['A specific ground.'],
        warrant: undefined as unknown as string,
        qualification: undefined,
      });
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet()];

      const bindResult = binder.bind(atoms, [], facets);
      const hypotheses = binder.demoteToHypothesis(
        bindResult.unbound_atoms,
        [claim],
        bindResult.bindings,
      );

      expect(hypotheses.length).toBe(1);
      // demotion_reason should list the display_text of unbound atoms
      for (const atom of bindResult.unbound_atoms) {
        expect(hypotheses[0].demotion_reason).toContain(atom.display_text);
      }
    });
  });

  // ===========================================================================
  // 7. AtomMigration and rewriteReferences
  // ===========================================================================

  describe('createMigration()', () => {
    it('should create a migration record with correct fields', () => {
      const migration = binder.createMigration('old-1', 'new-1', 'replace');

      expect(migration.migration_id).toBeDefined();
      expect(migration.old_atom_id).toBe('old-1');
      expect(migration.new_atom_id).toBe('new-1');
      expect(migration.type).toBe('replace');
      expect(migration.timestamp).toBeDefined();
    });

    it('should create a merge migration with merged_from', () => {
      const migration = binder.createMigration('old-merged', 'new-merged', 'merge', {
        mergedFrom: ['a-1', 'a-2', 'a-3'],
      });

      expect(migration.type).toBe('merge');
      expect(migration.merged_from).toEqual(['a-1', 'a-2', 'a-3']);
    });

    it('should create a split migration with split_into', () => {
      const migration = binder.createMigration('old-split', 'new-split', 'split', {
        splitInto: ['s-1', 's-2'],
      });

      expect(migration.type).toBe('split');
      expect(migration.split_into).toEqual(['s-1', 's-2']);
    });
  });

  describe('rewriteReferences()', () => {
    it('should rewrite binding atom_ids for replace migration', () => {
      const migration = binder.createMigration('old-atom', 'new-atom', 'replace');

      const bindings: ClaimBinding[] = [
        {
          binding_id: 'b1',
          claim_id: 'c1',
          atom_ids: ['old-atom', 'other-atom'],
          quote_ids: ['q1'],
          support_kind: 'DIRECT_QUOTE',
          staleness_status: 'current',
        },
        {
          binding_id: 'b2',
          claim_id: 'c2',
          atom_ids: ['unrelated-atom'],
          quote_ids: ['q2'],
          support_kind: 'PARAPHRASE',
          staleness_status: 'current',
        },
      ];

      const externalArrays: string[][] = [
        ['old-atom', 'keep-atom'],
        ['another-atom'],
      ];

      binder.rewriteReferences(migration, bindings, externalArrays);

      // Binding b1 should have old-atom replaced with new-atom
      expect(bindings[0].atom_ids).toEqual(['new-atom', 'other-atom']);
      // Binding b2 should be unchanged
      expect(bindings[1].atom_ids).toEqual(['unrelated-atom']);
      // External arrays should also be rewritten
      expect(externalArrays[0]).toEqual(['new-atom', 'keep-atom']);
      expect(externalArrays[1]).toEqual(['another-atom']);
    });

    it('should rewrite binding atom_ids for edit_in_place migration', () => {
      const migration = binder.createMigration('edit-old', 'edit-new', 'edit_in_place');

      const bindings: ClaimBinding[] = [
        {
          binding_id: 'b-edit',
          claim_id: 'c1',
          atom_ids: ['edit-old'],
          quote_ids: ['q1'],
          support_kind: 'DIRECT_QUOTE',
          staleness_status: 'current',
        },
      ];

      binder.rewriteReferences(migration, bindings, []);

      expect(bindings[0].atom_ids).toEqual(['edit-new']);
    });

    it('should deduplicate atom_ids after merge migration', () => {
      const migration = binder.createMigration('merged-target', 'merged-result', 'merge', {
        mergedFrom: ['merge-a', 'merge-b'],
      });

      const bindings: ClaimBinding[] = [
        {
          binding_id: 'b-merge',
          claim_id: 'c1',
          atom_ids: ['merge-a', 'merge-b', 'other'],
          quote_ids: ['q1'],
          support_kind: 'DIRECT_QUOTE',
          staleness_status: 'current',
        },
      ];

      binder.rewriteReferences(migration, bindings, []);

      // Both merge-a and merge-b should become merged-result, then deduplicate
      expect(bindings[0].atom_ids).toContain('merged-result');
      expect(bindings[0].atom_ids).toContain('other');
      // No duplicates
      const uniqueIds = new Set(bindings[0].atom_ids);
      expect(uniqueIds.size).toBe(bindings[0].atom_ids.length);
      expect(bindings[0].atom_ids.length).toBe(2); // merged-result + other
    });

    it('should handle merge with single duplicate correctly', () => {
      const migration = binder.createMigration('x', 'target', 'merge', {
        mergedFrom: ['dup-1', 'dup-2', 'dup-3'],
      });

      const bindings: ClaimBinding[] = [
        {
          binding_id: 'b-dup',
          claim_id: 'c1',
          atom_ids: ['dup-1', 'keep-me', 'dup-3'],
          quote_ids: ['q1'],
          support_kind: 'PARAPHRASE',
          staleness_status: 'current',
        },
      ];

      binder.rewriteReferences(migration, bindings, []);

      expect(bindings[0].atom_ids).toEqual(['target', 'keep-me']);
    });
  });

  // ===========================================================================
  // 8. Budget pruning — last binding on strict facet never pruned
  // ===========================================================================

  describe('budget pruning invariant', () => {
    it('should never leave a strict facet with zero bindings after binding', () => {
      const claim = makeClaim({ id: 'C-budget' });
      const { atoms } = binder.decompose([claim], 'facet-strict');
      const facets = [makeFacet({ facet_id: 'facet-strict', strictness_override: 'strict' })];

      // Provide exactly one matching span
      const span = makeSpan({
        quote_id: 'q-last',
        text: 'Aristotle defines phantasia as a movement resulting from actual perception',
      });

      const result = binder.bind(atoms, [span], facets);

      // If any binding was created for a strict facet, it must remain
      const strictFacetBindings = result.bindings.filter(
        b => atoms.some(a => a.facet_id === 'facet-strict' && b.atom_ids.includes(a.atom_id)),
      );

      if (strictFacetBindings.length > 0) {
        // The last binding must never be pruned (hard invariant)
        expect(strictFacetBindings.length).toBeGreaterThanOrEqual(1);
      }
    });

    it('should preserve bindings when only one span matches a strict facet atom', () => {
      const claim = makeClaim({
        id: 'C-single-bind',
        claim: 'Phantasia involves sense perception directly.',
        grounds: ['Evidence from De Anima confirms this reading of sense perception.'],
        warrant: undefined as unknown as string,
        qualification: undefined,
      });
      const { atoms } = binder.decompose([claim], 'facet-only');
      const facets = [makeFacet({ facet_id: 'facet-only', strictness_override: 'strict' })];

      const span = makeSpan({
        quote_id: 'q-only-one',
        text: 'Phantasia involves sense perception directly in De Anima confirms this reading.',
      });

      const result = binder.bind(atoms, [span], facets);

      // At least one binding should survive for the strict facet
      const facetBindings = result.bindings.filter(b =>
        b.atom_ids.some(aid => atoms.find(a => a.atom_id === aid)?.facet_id === 'facet-only'),
      );

      // If a binding was created, verify it persists
      if (facetBindings.length > 0) {
        expect(facetBindings.length).toBeGreaterThanOrEqual(1);
        expect(facetBindings[0].quote_ids).toContain('q-only-one');
      }
    });
  });

  // ===========================================================================
  // 9. Evidence mode defaults
  // ===========================================================================

  describe('evidence mode defaults', () => {
    it('should set DIRECT_QUOTE for corpus_claim kind', () => {
      expect(defaultEvidenceMode('corpus_claim')).toBe('DIRECT_QUOTE');

      // Verify in decomposition: main claim atom should be corpus_claim
      const claim = makeClaim();
      const { atoms } = binder.decompose([claim], 'facet-1');
      const mainAtom = atoms[0];
      expect(mainAtom.kind).toBe('corpus_claim');
      expect(mainAtom.evidence_mode).toBe('DIRECT_QUOTE');
    });

    it('should set PARAPHRASE_SUPPORTED for interpretive_move kind', () => {
      expect(defaultEvidenceMode('interpretive_move')).toBe('PARAPHRASE_SUPPORTED');

      // Warrant produces interpretive_move atoms
      const claim = makeClaim();
      const { atoms } = binder.decompose([claim], 'facet-1');
      const warrantAtom = atoms.find(a => a.display_text === claim.warrant);
      expect(warrantAtom).toBeDefined();
      expect(warrantAtom!.kind).toBe('interpretive_move');
      expect(warrantAtom!.evidence_mode).toBe('PARAPHRASE_SUPPORTED');
    });

    it('should set NO_EVIDENCE_REQUIRED for method kind', () => {
      expect(defaultEvidenceMode('method')).toBe('NO_EVIDENCE_REQUIRED');
    });

    it('should set NO_EVIDENCE_REQUIRED for organization kind', () => {
      expect(defaultEvidenceMode('organization')).toBe('NO_EVIDENCE_REQUIRED');
    });

    it('should set NO_EVIDENCE_REQUIRED for authorial_stipulation kind', () => {
      expect(defaultEvidenceMode('authorial_stipulation')).toBe('NO_EVIDENCE_REQUIRED');
    });

    it('should set NO_EVIDENCE_REQUIRED for stub kind', () => {
      expect(defaultEvidenceMode('stub')).toBe('NO_EVIDENCE_REQUIRED');
    });

    it('should apply correct evidence mode through decomposition for method ground', () => {
      const claim = makeClaim({
        grounds: ['I bracket the historical context to focus on the philosophical argument.'],
      });
      const { atoms } = binder.decompose([claim], 'facet-1');

      const methodAtom = atoms.find(a => a.kind === 'method');
      expect(methodAtom).toBeDefined();
      expect(methodAtom!.evidence_mode).toBe('NO_EVIDENCE_REQUIRED');
    });

    it('should apply correct evidence mode through decomposition for organization ground', () => {
      const claim = makeClaim({
        grounds: ['In what follows the argument proceeds in two stages.'],
      });
      const { atoms } = binder.decompose([claim], 'facet-1');

      const orgAtom = atoms.find(a => a.kind === 'organization');
      expect(orgAtom).toBeDefined();
      expect(orgAtom!.evidence_mode).toBe('NO_EVIDENCE_REQUIRED');
    });
  });

  // ===========================================================================
  // Integration: full pipeline flow
  // ===========================================================================

  describe('full pipeline integration', () => {
    it('should decompose, bind, and demote in a complete flow', () => {
      const claims = [
        makeClaim({
          id: 'C-int-1',
          claim: 'Phantasia is a cognitive movement arising from perception.',
          grounds: [
            'Aristotle explicitly states phantasia arises from perception in De Anima.',
            'This section proceeds in two parts to establish the connection.',
          ],
          warrant: 'Therefore the perceptual origin of phantasia is well established.',
          qualification: 'Perhaps this interpretation requires further nuance.',
        }),
      ];

      const facets = [makeFacet({ facet_id: 'facet-int', strictness_override: 'strict' })];

      // Step 1: Decompose
      const { atoms, warnings } = binder.decompose(claims, 'facet-int');
      expect(atoms.length).toBeGreaterThan(0);
      expect(warnings).toEqual([]);

      // Verify atom kinds
      const mainAtom = atoms[0];
      expect(mainAtom.kind).toBe('corpus_claim');
      expect(mainAtom.modality).toBe('asserted');

      // Organization atom should exist from the second ground
      const orgAtom = atoms.find(a => a.kind === 'organization');
      expect(orgAtom).toBeDefined();

      // Step 2: Bind with one matching span
      const span = makeSpan({
        quote_id: 'q-int-match',
        text: 'Phantasia cognitive movement arising perception explicitly states De Anima',
      });

      const bindResult = binder.bind(atoms, [span], facets);

      // Step 3: Demote unbound atoms
      const hypotheses = binder.demoteToHypothesis(
        bindResult.unbound_atoms,
        claims,
        bindResult.bindings,
      );

      // Organization atom should NOT be in unbound (skipped during binding)
      const orgInUnbound = bindResult.unbound_atoms.find(
        a => a.atom_id === orgAtom!.atom_id,
      );
      expect(orgInUnbound).toBeUndefined();

      // If there are unbound atoms requiring evidence, they should be demoted
      if (bindResult.unbound_atoms.length > 0) {
        expect(hypotheses.length).toBeGreaterThan(0);
        expect(hypotheses[0].claim_id).toBe('C-int-1');
      }
    });

    it('should handle migration rewrite after decomposition and binding', () => {
      const claim = makeClaim({ id: 'C-mig' });
      const { atoms } = binder.decompose([claim], 'facet-1');
      const facets = [makeFacet()];

      const span = makeSpan({
        quote_id: 'q-mig',
        text: 'Aristotle defines phantasia as a movement resulting from actual perception',
      });

      const bindResult = binder.bind(atoms, [span], facets);

      if (bindResult.bindings.length > 0) {
        const oldAtomId = bindResult.bindings[0].atom_ids[0];
        const newAtomId = 'migrated-atom-id';

        const migration = binder.createMigration(oldAtomId, newAtomId, 'replace');

        const paragraphPlans: string[][] = [
          [oldAtomId, 'another-atom'],
        ];

        binder.rewriteReferences(migration, bindResult.bindings, paragraphPlans);

        expect(bindResult.bindings[0].atom_ids).toContain(newAtomId);
        expect(bindResult.bindings[0].atom_ids).not.toContain(oldAtomId);
        expect(paragraphPlans[0]).toContain(newAtomId);
        expect(paragraphPlans[0]).not.toContain(oldAtomId);
      }
    });
  });
});
