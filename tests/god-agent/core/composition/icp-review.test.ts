/**
 * Tests for ICP Deterministic Review (Phase 3.3)
 *
 * Tests the atom-level review functions added to citation-enforcer.ts
 */

import { describe, it, expect } from 'vitest';
import {
  reviewICPContent,
  type MappedSentence,
  type ICPReviewOptions,
} from '../../../../src/god-agent/core/writing/citation-enforcer.js';

// =============================================================================
// HELPERS
// =============================================================================

function makeSentence(overrides: Partial<MappedSentence> = {}): MappedSentence {
  return {
    sentence_id: 's1',
    paragraph_id: 'p1',
    text: 'Aristotle defines phantasia as a movement.',
    supports_atoms: ['atom_1'],
    ...overrides,
  };
}

function makeDefaultOptions(overrides: Partial<ICPReviewOptions> = {}): ICPReviewOptions {
  return {
    allAtomIds: ['atom_1', 'atom_2'],
    allFacetIds: ['facet_1'],
    atomToFacet: new Map([['atom_1', 'facet_1'], ['atom_2', 'facet_1']]),
    atomToQuotes: new Map([['atom_1', ['q1']]]),
    approvedQuotes: new Map([['q1', 'phantasia as a movement']]),
    sentences: [
      makeSentence({ sentence_id: 's1', supports_atoms: ['atom_1'] }),
      makeSentence({ sentence_id: 's2', supports_atoms: ['atom_2'], text: 'This movement results from perception.' }),
    ],
    ...overrides,
  };
}

// =============================================================================
// TESTS
// =============================================================================

describe('ICP Deterministic Review', () => {
  describe('Claim coverage', () => {
    it('should pass when all atoms are covered', () => {
      const opts = makeDefaultOptions();
      const content = 'Aristotle defines phantasia as a movement. This movement results from perception.';

      const result = reviewICPContent(content, opts);

      expect(result.coverage.atoms_covered).toBe(2);
      expect(result.coverage.atoms_total).toBe(2);
    });

    it('should fail when an atom is uncovered', () => {
      const opts = makeDefaultOptions({
        sentences: [
          makeSentence({ sentence_id: 's1', supports_atoms: ['atom_1'] }),
          // atom_2 is not covered by any sentence
        ],
      });
      const content = 'Aristotle defines phantasia as a movement.';

      const result = reviewICPContent(content, opts);

      expect(result.passed).toBe(false);
      expect(result.coverage.atoms_covered).toBe(1);
      const uncovered = result.failures.filter(
        f => f.class === 'binding_error' && f.description.includes('atom_2'),
      );
      expect(uncovered.length).toBe(1);
    });
  });

  describe('Orphan sentence detection', () => {
    it('should flag sentences without atom mappings', () => {
      const opts = makeDefaultOptions({
        sentences: [
          makeSentence({ sentence_id: 's1', supports_atoms: ['atom_1'] }),
          makeSentence({ sentence_id: 's2', supports_atoms: ['atom_2'] }),
          makeSentence({ sentence_id: 's3', supports_atoms: [], text: 'Orphan sentence.' }),
        ],
      });
      const content = 'Test content.';

      const result = reviewICPContent(content, opts);

      expect(result.coverage.orphan_sentences).toBe(1);
      const orphans = result.failures.filter(
        f => f.sentence_id === 's3' && f.description.includes('Orphan'),
      );
      expect(orphans.length).toBe(1);
    });
  });

  describe('Multi-claim sentence detection', () => {
    it('should flag sentences with more than 3 atom mappings', () => {
      const opts = makeDefaultOptions({
        allAtomIds: ['a1', 'a2', 'a3', 'a4'],
        allFacetIds: ['f1'],
        atomToFacet: new Map([['a1', 'f1'], ['a2', 'f1'], ['a3', 'f1'], ['a4', 'f1']]),
        sentences: [
          makeSentence({
            sentence_id: 's1',
            supports_atoms: ['a1', 'a2', 'a3', 'a4'],
            text: 'Overloaded sentence.',
          }),
        ],
      });
      const content = 'Test.';

      const result = reviewICPContent(content, opts);

      expect(result.coverage.multi_claim_sentences).toBe(1);
    });

    it('should not flag sentences with 3 or fewer atom mappings', () => {
      const opts = makeDefaultOptions({
        allAtomIds: ['a1', 'a2', 'a3'],
        allFacetIds: ['f1'],
        atomToFacet: new Map([['a1', 'f1'], ['a2', 'f1'], ['a3', 'f1']]),
        sentences: [
          makeSentence({
            sentence_id: 's1',
            supports_atoms: ['a1', 'a2', 'a3'],
          }),
        ],
      });
      const content = 'Test.';

      const result = reviewICPContent(content, opts);

      expect(result.coverage.multi_claim_sentences).toBe(0);
    });
  });

  describe('Facet coverage', () => {
    it('should track facet coverage through atom mappings', () => {
      const opts = makeDefaultOptions({
        allFacetIds: ['f1', 'f2'],
        atomToFacet: new Map([['atom_1', 'f1'], ['atom_2', 'f2']]),
        sentences: [
          makeSentence({ sentence_id: 's1', supports_atoms: ['atom_1'] }),
          makeSentence({ sentence_id: 's2', supports_atoms: ['atom_2'] }),
        ],
      });
      const content = 'Test.';

      const result = reviewICPContent(content, opts);

      expect(result.coverage.facets_covered).toBe(2);
      expect(result.coverage.facets_total).toBe(2);
    });

    it('should flag uncovered facets', () => {
      const opts = makeDefaultOptions({
        allFacetIds: ['f1', 'f2'],
        atomToFacet: new Map([['atom_1', 'f1'], ['atom_2', 'f2']]),
        sentences: [
          makeSentence({ sentence_id: 's1', supports_atoms: ['atom_1'] }),
          // atom_2 (facet f2) not covered
        ],
      });
      const content = 'Test.';

      const result = reviewICPContent(content, opts);

      expect(result.coverage.facets_covered).toBe(1);
      const uncovered = result.failures.filter(
        f => f.description.includes('Facet not covered: f2'),
      );
      expect(uncovered.length).toBe(1);
    });
  });

  describe('Quote fidelity against clean_text', () => {
    it('should pass when quoted text matches approved quotes', () => {
      const content = 'Aristotle states "phantasia as a movement" in the work.';
      const opts = makeDefaultOptions({
        approvedQuotes: new Map([['q1', 'phantasia as a movement resulting from perception']]),
      });

      const result = reviewICPContent(content, opts);

      // "phantasia as a movement" is contained in the approved quote
      const quoteFails = result.failures.filter(
        f => f.description.includes('not found in approved quotes'),
      );
      expect(quoteFails.length).toBe(0);
    });

    it('should flag quoted text not in approved quotes', () => {
      const content = 'As he states, "the soul is the form of the body" in this passage.';
      const opts = makeDefaultOptions({
        approvedQuotes: new Map([['q1', 'phantasia as a movement']]),
      });

      const result = reviewICPContent(content, opts);

      const quoteFails = result.failures.filter(
        f => f.description.includes('not found in approved quotes'),
      );
      expect(quoteFails.length).toBeGreaterThan(0);
    });

    it('should skip very short quoted text (< 10 chars)', () => {
      const content = 'The "soul" is central to the argument.';
      const opts = makeDefaultOptions({
        approvedQuotes: new Map<string, string>(),
      });

      const result = reviewICPContent(content, opts);

      // "soul" is too short to flag
      const quoteFails = result.failures.filter(
        f => f.description.includes('not found in approved quotes'),
      );
      expect(quoteFails.length).toBe(0);
    });
  });

  describe('Atom reference validation', () => {
    it('should flag atom references outside the plan', () => {
      const opts = makeDefaultOptions({
        allAtomIds: ['atom_1', 'atom_2'],
        sentences: [
          makeSentence({ sentence_id: 's1', supports_atoms: ['atom_1'] }),
          makeSentence({ sentence_id: 's2', supports_atoms: ['atom_999'] }), // Not in plan
        ],
      });
      const content = 'Test.';

      const result = reviewICPContent(content, opts);

      const outsidePlan = result.failures.filter(
        f => f.description.includes('atom not in plan'),
      );
      expect(outsidePlan.length).toBe(1);
    });
  });

  describe('Full pass scenario', () => {
    it('should pass with complete coverage and valid quotes', () => {
      const content =
        'Aristotle defines "phantasia as a movement" in his work. This faculty mediates perception.';
      const opts = makeDefaultOptions({
        allAtomIds: ['a1', 'a2'],
        allFacetIds: ['f1'],
        atomToFacet: new Map([['a1', 'f1'], ['a2', 'f1']]),
        atomToQuotes: new Map([['a1', ['q1']]]),
        approvedQuotes: new Map([['q1', 'phantasia as a movement']]),
        sentences: [
          makeSentence({ sentence_id: 's1', supports_atoms: ['a1'] }),
          makeSentence({ sentence_id: 's2', supports_atoms: ['a2'], text: 'This faculty mediates.' }),
        ],
      });

      const result = reviewICPContent(content, opts);

      expect(result.passed).toBe(true);
      expect(result.failures.length).toBe(0);
      expect(result.coverage.atoms_covered).toBe(2);
      expect(result.coverage.facets_covered).toBe(1);
      expect(result.coverage.orphan_sentences).toBe(0);
      expect(result.coverage.multi_claim_sentences).toBe(0);
    });
  });
});
