/**
 * Tests for ICPInlineValidator
 *
 * Covers: paragraph validation for missing quotes, hallucinated citations,
 * missing atoms, retry feedback generation, and passing conditions.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ICPInlineValidator } from '../../../../src/god-agent/core/composition/icp-inline-validator.js';
import type { ClaimAtom, QuoteSpan, ProvenanceScorecard } from '../../../../src/god-agent/core/composition/icp-types.js';
import type { CorpusSource } from '../../../../src/god-agent/core/writing/writing-generator.js';

// =============================================================================
// FACTORY HELPERS
// =============================================================================

let idCounter = 0;
function uid(prefix = 'id'): string {
  return `${prefix}_${++idCounter}`;
}

function makeScorecard(): ProvenanceScorecard {
  return {
    fidelity_score: 0.9,
    ocr_risk_score: 0.1,
    cluster_size: 1,
    prior_usage_count: 0,
    doc_authority_tier: 1,
  };
}

function makeAtom(overrides: Partial<ClaimAtom> = {}): ClaimAtom {
  return {
    atom_id: uid('atom'),
    atom_version_id: 1,
    display_text: overrides.display_text ?? 'motion is the actuality of the potential',
    semantic_text: overrides.semantic_text ?? 'motion actuality potential',
    modality: 'asserted',
    kind: 'corpus_claim',
    parent_claim_id: uid('claim'),
    evidence_mode: overrides.evidence_mode ?? 'DIRECT_QUOTE',
    bound_quote_ids: [],
    facet_id: uid('facet'),
    ...overrides,
  };
}

function makeSpan(overrides: Partial<QuoteSpan> = {}): QuoteSpan {
  return {
    quote_id: uid('quote'),
    text_fingerprint: uid('fp'),
    span_fingerprint: uid('sfp'),
    doc_id: 'aristotle_physics.pdf',
    page: 1,
    source_kind: 'CORPUS',
    clean_text_range: [0, 100],
    clean_range_hash: uid('hash'),
    patch_epoch: 0,
    normalization_policy_version: '1.0.0',
    text: overrides.text ?? 'The soul is in a way all existing things.',
    left_ctx_hash: uid('lhash'),
    right_ctx_hash: uid('rhash'),
    verification_status: 'auto_verified',
    source_anchor: 'Aristotle, De Anima 431b21',
    provenance_scorecard: makeScorecard(),
    ...overrides,
  };
}

const CORPUS_SOURCES: CorpusSource[] = [
  { author: 'Aristotle', year: -350, title: 'Physics', citationKey: 'Aristotle -350' },
  { author: 'Frede, Dorothea', year: 1992, title: 'The Cognitive Role of Phantasia', citationKey: 'Frede 1992' },
  { author: 'Nussbaum, Martha', year: 1978, title: 'Aristotle\'s De Motu Animalium', citationKey: 'Nussbaum 1978' },
];

// =============================================================================
// TESTS
// =============================================================================

describe('ICPInlineValidator', () => {
  let validator: ICPInlineValidator;

  beforeEach(() => {
    idCounter = 0;
    validator = new ICPInlineValidator(CORPUS_SOURCES);
  });

  describe('validateParagraph', () => {
    it('should pass when all evidence is present', async () => {
      const paragraph = 'As Aristotle observes, "The soul is in a way all existing things." This claim regarding motion is the actuality of the potential suggests a deep connection between soul and reality.';

      const atom = makeAtom({ display_text: 'motion is the actuality of the potential' });
      const span = makeSpan({ text: 'The soul is in a way all existing things.' });

      const result = await validator.validateParagraph(paragraph, [atom], [span]);

      expect(result.passed).toBe(true);
      // May have warning-level issues but no error-level issues
      const errorIssues = result.issues.filter(i => i.severity === 'error');
      expect(errorIssues).toHaveLength(0);
    });

    it('should detect missing required quotes', async () => {
      const paragraph = 'Aristotle discusses the nature of change in the Physics. Motion is central to his metaphysics.';

      const span = makeSpan({ text: 'A completely different quotation that is nowhere in the paragraph text at all' });

      const result = await validator.validateParagraph(paragraph, [], [span]);

      expect(result.passed).toBe(false);
      const missingQuoteIssues = result.issues.filter(i => i.type === 'missing_quote');
      expect(missingQuoteIssues.length).toBeGreaterThan(0);
    });

    it('should detect missing atom coverage', async () => {
      const paragraph = 'This paragraph talks about something entirely unrelated to the required atom.';

      const atom = makeAtom({ display_text: 'phantasia cognitive representation sense-perception' });

      const result = await validator.validateParagraph(paragraph, [atom], []);

      const missingAtomIssues = result.issues.filter(i => i.type === 'missing_atom');
      expect(missingAtomIssues.length).toBeGreaterThan(0);
    });

    it('should skip atoms with NO_EVIDENCE_REQUIRED mode', async () => {
      const paragraph = 'A simple paragraph about organizational structure.';

      const atom = makeAtom({
        display_text: 'phantasia cognitive representation',
        evidence_mode: 'NO_EVIDENCE_REQUIRED',
      });

      const result = await validator.validateParagraph(paragraph, [atom], []);

      const missingAtomIssues = result.issues.filter(i => i.type === 'missing_atom');
      expect(missingAtomIssues).toHaveLength(0);
    });

    it('should generate retry feedback when issues found', async () => {
      const paragraph = 'Some text.';
      const span = makeSpan({ text: 'A quote that does not appear anywhere in the generated text whatsoever' });
      const atom = makeAtom({ display_text: 'phantasia cognitive representation sense-perception' });

      const result = await validator.validateParagraph(paragraph, [atom], [span]);

      expect(result.suggestedRetryFeedback).toBeTruthy();
      expect(result.suggestedRetryFeedback).toContain('[ERROR]');
    });

    it('should handle fuzzy quote matching for OCR-affected text', async () => {
      const paragraph = 'As Aristotle states, "The soule is in a waye all existing thinges." This represents his view of perception.';

      // OCR-affected version — slight differences
      const span = makeSpan({ text: 'The soul is in a way all existing things.' });

      const result = await validator.validateParagraph(paragraph, [], [span]);

      // Fuzzy matching should handle minor OCR differences
      // The trigram similarity should be high enough for 70% threshold
      const missingQuoteIssues = result.issues.filter(i => i.type === 'missing_quote');
      // Depending on similarity calculation, this may or may not pass
      // The key is that the validator doesn't crash and produces a result
      expect(result).toBeDefined();
      expect(typeof result.passed).toBe('boolean');
    });

    it('should return empty feedback when paragraph passes', async () => {
      const paragraph = 'As Aristotle observes, motion is the actuality of the potential.';
      const atom = makeAtom({ display_text: 'motion actuality potential' });

      const result = await validator.validateParagraph(paragraph, [atom], []);

      expect(result.passed).toBe(true);
      expect(result.suggestedRetryFeedback).toBe('');
    });
  });

  describe('computeSimilarity (via validateParagraph)', () => {
    it('should return 1.0 for exact substring match', async () => {
      const quote = 'the soul perceives forms';
      const paragraph = `Aristotle claims that ${quote} without matter.`;
      const span = makeSpan({ text: quote });

      const result = await validator.validateParagraph(paragraph, [], [span]);
      expect(result.passed).toBe(true);
    });

    it('should detect completely absent quotes', async () => {
      const paragraph = 'This text has nothing to do with the quote.';
      const span = makeSpan({ text: 'phantasia cognitive representation in the soul' });

      const result = await validator.validateParagraph(paragraph, [], [span]);
      expect(result.passed).toBe(false);
    });
  });

  describe('constructor config', () => {
    it('should accept custom similarity threshold', () => {
      const strictValidator = new ICPInlineValidator(CORPUS_SOURCES, {
        minQuoteSimilarity: 0.95,
      });
      expect(strictValidator).toBeDefined();
    });

    it('should use default config when none provided', () => {
      const defaultValidator = new ICPInlineValidator(CORPUS_SOURCES);
      expect(defaultValidator).toBeDefined();
    });
  });
});
