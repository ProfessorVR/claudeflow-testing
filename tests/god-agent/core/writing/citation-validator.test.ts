/**
 * Tests for Citation Validator (Phase 2: Pre-Generation Citation Validation)
 */

import { describe, it, expect } from 'vitest';
import {
  CitationValidator,
  createValidatorFromChunks,
  type ExtractedCitation,
} from '../../../../src/god-agent/core/writing/citation-validator.js';
import type { CorpusConstraint, CorpusSource } from '../../../../src/god-agent/core/writing/writing-generator.js';
import type { ContextChunk } from '../../../../src/god-agent/core/writing/corpus-constraint-builder.js';

describe('Citation Validator', () => {
  const testSources: CorpusSource[] = [
    { author: 'Frede, Dorothea', year: 1992, title: 'The Cognitive Role of Phantasia', citationKey: 'Frede 1992' },
    { author: 'Caston, Victor', year: 1996, title: 'Why Aristotle Needs Imagination', citationKey: 'Caston 1996' },
    { author: 'Nussbaum, Martha', year: 1978, title: 'The Role of Phantasia', citationKey: 'Nussbaum 1978' },
    { author: 'Heidegger, Martin', year: 1927, title: 'Being and Time', citationKey: 'Heidegger 1927' },
    { author: 'Aristotle', year: -350, title: 'De Anima', citationKey: 'Aristotle, De Anima' },
  ];

  const testConstraint: CorpusConstraint = {
    sources: testSources,
    enforcement: 'strict',
    missingCitationPlaceholder: '[CITATION NEEDED]',
  };

  describe('extractCitations', () => {
    it('should extract parenthetical citations (Author Year)', () => {
      const validator = new CitationValidator(testConstraint);
      const text = 'Phantasia plays a key role (Frede 1992) in Aristotle\'s psychology.';

      const citations = validator.extractCitations(text);

      expect(citations.length).toBe(1);
      expect(citations[0].author).toBe('Frede');
      expect(citations[0].year).toBe(1992);
    });

    it('should extract citations with page numbers', () => {
      const validator = new CitationValidator(testConstraint);
      const text = 'As Caston argues (Caston 1996, p. 45), imagination is necessary.';

      const citations = validator.extractCitations(text);

      // Matches both the signal phrase "As Caston argues" and the APA "(Caston 1996, p. 45)"
      expect(citations.length).toBe(2);
      // The APA citation should have full year/page details
      const apaCitation = citations.find(c => c.year === 1996);
      expect(apaCitation).toBeDefined();
      expect(apaCitation!.author).toBe('Caston');
      expect(apaCitation!.page).toBe(45);
    });

    it('should extract in-text citations', () => {
      const validator = new CitationValidator(testConstraint);
      const text = 'Nussbaum (1978) provides an insightful analysis.';

      const citations = validator.extractCitations(text);

      expect(citations.length).toBe(1);
      expect(citations[0].author).toBe('Nussbaum');
      expect(citations[0].year).toBe(1978);
    });

    it('should extract multiple citations', () => {
      const validator = new CitationValidator(testConstraint);
      // Use separate parenthetical citations rather than semicolon-separated
      const text = 'Several scholars (Frede 1992) and others (Caston 1996) have discussed this topic.';

      const citations = validator.extractCitations(text);

      expect(citations.length).toBe(2);
    });

    it('should extract citations with "et al."', () => {
      const validator = new CitationValidator(testConstraint);
      const text = 'According to Smith et al. (2020), this is important.';

      const citations = validator.extractCitations(text);

      expect(citations.length).toBe(1);
      expect(citations[0].author).toContain('Smith');
    });

    it('should record correct line numbers', () => {
      const validator = new CitationValidator(testConstraint);
      const text = 'First line.\nSecond line (Frede 1992).\nThird line.';

      const citations = validator.extractCitations(text);

      expect(citations.length).toBe(1);
      expect(citations[0].line).toBe(2);
    });
  });

  describe('validate', () => {
    it('should validate correct citations', async () => {
      const validator = new CitationValidator(testConstraint);
      const content = 'Phantasia is important (Frede 1992) for understanding Aristotle.';

      const result = await validator.validate(content);

      expect(result.valid.length).toBe(1);
      expect(result.hallucinated.length).toBe(0);
      expect(result.passRate).toBe(1);
    });

    it('should detect hallucinated citations', async () => {
      const validator = new CitationValidator(testConstraint);
      const content = 'According to Smith (2023), this is important.';

      const result = await validator.validate(content);

      expect(result.valid.length).toBe(0);
      expect(result.hallucinated.length).toBe(1);
      expect(result.hallucinated[0].reason).toContain('No corpus source found');
    });

    it('should detect wrong year for correct author', async () => {
      const validator = new CitationValidator(testConstraint);
      const content = 'Frede (2010) argues that imagination is key.';

      const result = await validator.validate(content);

      expect(result.hallucinated.length).toBe(1);
      expect(result.hallucinated[0].reason).toContain('year');
    });

    it('should handle mixed valid and invalid citations', async () => {
      const validator = new CitationValidator(testConstraint);
      const content = `
        Frede (1992) provides a foundational analysis.
        Smith (2023) offers a different perspective.
        Caston (1996) agrees with this interpretation.
      `;

      const result = await validator.validate(content);

      expect(result.valid.length).toBe(2);
      expect(result.hallucinated.length).toBe(1);
      expect(result.passRate).toBeCloseTo(0.67, 1);
    });

    it('should provide suggestions for replacements', async () => {
      const validator = new CitationValidator(testConstraint);
      const content = 'Frede (2010) argues that imagination is key.';

      const result = await validator.validate(content, { suggestReplacements: true });

      expect(result.hallucinated.length).toBe(1);
      expect(result.hallucinated[0].suggestion).toBeDefined();
      expect(result.hallucinated[0].suggestion?.formatted).toContain('Frede');
      expect(result.hallucinated[0].suggestion?.formatted).toContain('1992');
    });
  });

  describe('correct', () => {
    it('should replace hallucinated citations with suggestions', async () => {
      const validator = new CitationValidator(testConstraint);
      const content = 'Frede (2010) argues that imagination is key.';

      const result = await validator.correct(content, { suggestReplacements: true });

      expect(result.corrections).toBe(1);
      expect(result.corrected).toContain('1992');
      expect(result.corrected).not.toContain('2010');
    });

    it('should use placeholder for unfixable citations', async () => {
      const validator = new CitationValidator(testConstraint);
      const content = 'According to Jones (2020), this is the case.';

      const result = await validator.correct(content, {
        suggestReplacements: true,
        placeholder: '[CITATION NEEDED]',
      });

      expect(result.corrections).toBe(1);
      expect(result.corrected).toContain('[CITATION NEEDED]');
    });

    it('should preserve valid citations', async () => {
      const validator = new CitationValidator(testConstraint);
      const content = 'Frede (1992) and Smith (2020) discuss this topic.';

      const result = await validator.correct(content, { suggestReplacements: true });

      expect(result.corrected).toContain('Frede (1992)');
    });
  });

  describe('createValidatorFromChunks', () => {
    it('should create validator from corpus chunks', () => {
      const chunks: ContextChunk[] = [
        {
          content: 'Phantasia is discussed in De Anima...',
          relevanceScore: 0.85,
          metadata: {
            author: 'Frede, Dorothea',
            year: 1992,
            title: 'The Cognitive Role of Phantasia',
          },
        },
        {
          content: 'Aristotle defines imagination...',
          relevanceScore: 0.9,
          metadata: {
            author: 'Caston, Victor',
            year: 1996,
            title: 'Why Aristotle Needs Imagination',
          },
        },
      ];

      const validator = createValidatorFromChunks(chunks);

      expect(validator).toBeDefined();
    });
  });
});
