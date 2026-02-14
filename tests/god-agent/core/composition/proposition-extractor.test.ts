/**
 * Tests for Proposition Extractor
 */

import { describe, it, expect } from 'vitest';
import { PropositionExtractor } from '../../../../src/god-agent/core/composition/proposition-extractor.js';
import type { DomainLexicon } from '../../../../src/god-agent/core/composition/icp-types.js';

// =============================================================================
// HELPERS
// =============================================================================

function makeSentences(
  texts: string[],
): Array<{ sentence_id: string; text: string }> {
  return texts.map((text, i) => ({
    sentence_id: `s${i + 1}`,
    text,
  }));
}

function makeMapping(entries: Array<[string, string[]]>): Map<string, string[]> {
  return new Map(entries);
}

// =============================================================================
// TESTS
// =============================================================================

describe('PropositionExtractor', () => {
  describe('BLOCK precision (test 12s)', () => {
    it('should BLOCK definitional "X is defined as Y" without mapped atom', () => {
      const extractor = new PropositionExtractor();
      const sentences = makeSentences([
        'Aristotle defines phantasia as a movement resulting from sense perception.',
      ]);
      const mapping = makeMapping([]); // No atoms mapped

      const results = extractor.extractPropositions(sentences, mapping);

      const blocks = results.filter(r => r.severity === 'BLOCK');
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should BLOCK "X refers to Y" without mapped atom', () => {
      const extractor = new PropositionExtractor();
      const sentences = makeSentences([
        'Phantasia refers to the faculty of imagination in Aristotle.',
      ]);
      const mapping = makeMapping([]);

      const results = extractor.extractPropositions(sentences, mapping);
      const blocks = results.filter(r => r.severity === 'BLOCK');
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should BLOCK "therefore" without mapped atom', () => {
      const extractor = new PropositionExtractor();
      const sentences = makeSentences([
        'Therefore phantasia cannot be reduced to sense perception.',
      ]);
      const mapping = makeMapping([]);

      const results = extractor.extractPropositions(sentences, mapping);
      const blocks = results.filter(r => r.severity === 'BLOCK');
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should BLOCK "must" (universal) without mapped atom', () => {
      const extractor = new PropositionExtractor();
      const sentences = makeSentences([
        'Phantasia must involve a residual sensory impression.',
      ]);
      const mapping = makeMapping([]);

      const results = extractor.extractPropositions(sentences, mapping);
      const blocks = results.filter(r => r.severity === 'BLOCK');
      expect(blocks.length).toBeGreaterThan(0);
    });

    it('should NOT BLOCK "must be noted" (allowlisted universal exception)', () => {
      const extractor = new PropositionExtractor();
      const sentences = makeSentences([
        'It must be noted that this interpretation has limitations.',
      ]);
      const mapping = makeMapping([]);

      const results = extractor.extractPropositions(sentences, mapping);
      const blocks = results.filter(r => r.severity === 'BLOCK');
      expect(blocks.length).toBe(0);
    });

    it('should classify rhetorical glue as OK (no propositions)', () => {
      const extractor = new PropositionExtractor();
      const sentences = makeSentences([
        'However, this warrants further investigation.',
        'In what follows, I examine the implications.',
        'Moreover, the evidence suggests a nuanced reading.',
        'Turning now to the second problem.',
      ]);
      const mapping = makeMapping([]);

      const results = extractor.extractPropositions(sentences, mapping);
      // Pure rhetorical glue should return no propositions
      expect(results.length).toBe(0);
    });

    it('should WARN on attribution patterns without mapped atom', () => {
      const extractor = new PropositionExtractor();
      const sentences = makeSentences([
        'Nussbaum argues that phantasia has a broader scope than typically assumed.',
      ]);
      const mapping = makeMapping([]);

      const results = extractor.extractPropositions(sentences, mapping);
      const warns = results.filter(r => r.severity === 'WARN');
      expect(warns.length).toBeGreaterThan(0);
    });

    it('should downgrade causal BLOCK to WARN when inside a hedge', () => {
      const extractor = new PropositionExtractor();
      const sentences = makeSentences([
        'Perhaps because the faculty involves residual motion, phantasia is unreliable.',
      ]);
      const mapping = makeMapping([]);

      const results = extractor.extractPropositions(sentences, mapping);
      // "because" inside "perhaps" → WARN, not BLOCK
      const blocks = results.filter(r => r.severity === 'BLOCK');
      const warns = results.filter(r => r.severity === 'WARN');
      expect(blocks.length).toBe(0);
      expect(warns.length).toBeGreaterThan(0);
    });

    it('should not flag sentences that already have atom mappings (below BLOCK)', () => {
      const extractor = new PropositionExtractor();
      const sentences = makeSentences([
        'Nussbaum argues that phantasia has a broader scope.',
      ]);
      // This sentence is mapped to an atom → attribution WARN should be suppressed
      const mapping = makeMapping([['s1', ['atom_1']]]);

      const results = extractor.extractPropositions(sentences, mapping);
      // Attribution is WARN, and sentence has atoms → should be suppressed
      expect(results.length).toBe(0);
    });

    it('should still BLOCK definitional patterns even with atom mappings', () => {
      const extractor = new PropositionExtractor();
      const sentences = makeSentences([
        'Phantasia is defined as the faculty of imaging by the Stoics.',
      ]);
      // Even with atoms mapped, BLOCK-level patterns stay flagged
      const mapping = makeMapping([['s1', ['atom_1']]]);

      const results = extractor.extractPropositions(sentences, mapping);
      const blocks = results.filter(r => r.severity === 'BLOCK');
      expect(blocks.length).toBeGreaterThan(0);
    });
  });

  describe('Domain lexicon integration (test 12k)', () => {
    it('should detect domain-specific definition markers', () => {
      const lexicon: DomainLexicon = {
        version: '1.0.0',
        definition_markers: ['ὁρίζει'],
        causal_markers: [],
        attribution_verbs: [],
        quantifiers: [],
        rhetorical_glue_additions: [],
      };

      const extractor = new PropositionExtractor(lexicon);
      const sentences = makeSentences([
        'Aristotle ὁρίζει phantasia as a residual movement.',
      ]);
      const mapping = makeMapping([]);

      const results = extractor.extractPropositions(sentences, mapping);
      const blocks = results.filter(r => r.severity === 'BLOCK');
      expect(blocks.length).toBeGreaterThan(0);
      expect(blocks[0].matched_pattern).toContain('domain:');
    });

    it('should allowlist domain rhetorical glue additions', () => {
      const lexicon: DomainLexicon = {
        version: '1.0.0',
        definition_markers: [],
        causal_markers: [],
        attribution_verbs: [],
        quantifiers: [],
        rhetorical_glue_additions: ['μέν...δέ', 'qua'],
      };

      const extractor = new PropositionExtractor(lexicon);
      const sentences = makeSentences([
        'The soul qua perceiver receives forms without matter.',
      ]);
      const mapping = makeMapping([]);

      const results = extractor.extractPropositions(sentences, mapping);
      // "qua" is domain rhetorical glue → no propositions
      expect(results.length).toBe(0);
    });

    it('should detect domain causal markers as WARN', () => {
      const lexicon: DomainLexicon = {
        version: '1.0.0',
        definition_markers: [],
        causal_markers: ['necessitates', 'grounds'],
        attribution_verbs: [],
        quantifiers: [],
        rhetorical_glue_additions: [],
      };

      const extractor = new PropositionExtractor(lexicon);
      const sentences = makeSentences([
        'This reading necessitates a reconsideration of the standard view.',
      ]);
      const mapping = makeMapping([]);

      const results = extractor.extractPropositions(sentences, mapping);
      const warns = results.filter(r => r.severity === 'WARN');
      expect(warns.length).toBeGreaterThan(0);
    });
  });

  describe('Deduplication', () => {
    it('should keep highest severity per predicate_type per sentence', () => {
      const extractor = new PropositionExtractor();
      // "therefore" matches both causal BLOCK
      const sentences = makeSentences([
        'Therefore this definition entails that phantasia cannot be mere perception.',
      ]);
      const mapping = makeMapping([]);

      const results = extractor.extractPropositions(sentences, mapping);

      // Should not have duplicate entries for the same predicate type
      const causalResults = results.filter(r => r.predicate_type === 'causal');
      // At most 1 causal entry per sentence after dedup
      expect(causalResults.length).toBeLessThanOrEqual(1);
    });
  });

  describe('Kind bypass prevention (test 12e)', () => {
    it('should detect causal justification even in method-like text', () => {
      const extractor = new PropositionExtractor();
      // "I bracket X because it is secondary" has causal pattern
      const sentences = makeSentences([
        'I bracket this distinction because it is secondary to the main argument.',
      ]);
      const mapping = makeMapping([]);

      const results = extractor.extractPropositions(sentences, mapping);
      // "because" should be detected as causal
      const causal = results.filter(r => r.predicate_type === 'causal');
      expect(causal.length).toBeGreaterThan(0);
    });
  });
});
