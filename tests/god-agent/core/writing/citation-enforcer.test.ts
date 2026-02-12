/**
 * Tests for Citation Enforcer (Phase 4: Active Citation Enforcement)
 */

import { describe, it, expect } from 'vitest';
import {
  CitationEnforcer,
  createEnforcerFromChunks,
  type EnforcementAction,
  type EnforcementConfig,
} from '../../../../src/god-agent/core/writing/citation-enforcer.js';
import type { CorpusConstraint, CorpusSource } from '../../../../src/god-agent/core/writing/writing-generator.js';
import type { ContextChunk } from '../../../../src/god-agent/core/writing/corpus-constraint-builder.js';

describe('Citation Enforcer', () => {
  const testSources: CorpusSource[] = [
    { author: 'Frede, Dorothea', year: 1992, title: 'The Cognitive Role of Phantasia', citationKey: 'Frede 1992' },
    { author: 'Caston, Victor', year: 1996, title: 'Why Aristotle Needs Imagination', citationKey: 'Caston 1996' },
    { author: 'Nussbaum, Martha', year: 1978, title: 'The Role of Phantasia', citationKey: 'Nussbaum 1978' },
    { author: 'Heidegger, Martin', year: 1927, title: 'Being and Time', citationKey: 'Heidegger 1927' },
  ];

  const testConstraint: CorpusConstraint = {
    sources: testSources,
    enforcement: 'strict',
    missingCitationPlaceholder: '[CITATION NEEDED]',
  };

  describe('enforce - pass mode', () => {
    it('should pass content with all valid citations', async () => {
      const enforcer = new CitationEnforcer(testConstraint);
      const content = 'Frede (1992) argues that phantasia is essential.';

      const result = await enforcer.enforce(content);

      expect(result.action).toBe('pass');
      expect(result.passed).toBe(true);
      expect(result.correctionsCount).toBe(0);
      expect(result.content).toBe(content);
    });

    it('should pass content with no citations', async () => {
      const enforcer = new CitationEnforcer(testConstraint);
      const content = 'This is a general statement about philosophy.';

      const result = await enforcer.enforce(content);

      expect(result.action).toBe('pass');
      expect(result.passed).toBe(true);
    });
  });

  describe('enforce - auto-correct mode', () => {
    it('should correct fixable hallucinated citations', async () => {
      const enforcer = new CitationEnforcer(testConstraint, {
        mode: 'auto-correct',
        minPassRate: 0.9,
        maxHallucinations: 3,
        placeholder: '[CITATION NEEDED]',
        includeReport: true,
      });
      const content = 'Frede (2010) argues that phantasia is essential.';

      const result = await enforcer.enforce(content);

      expect(result.action).toBe('corrected');
      expect(result.correctionsCount).toBe(1);
      expect(result.correctedCitations.length).toBe(1);
      expect(result.content).toContain('1992');
      expect(result.content).not.toContain('2010');
    });

    it('should use placeholder for unfixable citations', async () => {
      const enforcer = new CitationEnforcer(testConstraint, {
        mode: 'auto-correct',
        placeholder: '[CITATION NEEDED]',
      });
      const content = 'Jones (2020) provides an analysis.';

      const result = await enforcer.enforce(content);

      expect(result.action).toBe('corrected');
      expect(result.content).toContain('[CITATION NEEDED]');
    });

    it('should preserve original content in result', async () => {
      const enforcer = new CitationEnforcer(testConstraint, {
        mode: 'auto-correct',
      });
      const content = 'Jones (2020) provides an analysis.';

      const result = await enforcer.enforce(content);

      expect(result.originalContent).toBe(content);
    });
  });

  describe('enforce - strict mode', () => {
    it('should reject content with too many hallucinations', async () => {
      const enforcer = new CitationEnforcer(testConstraint, {
        mode: 'strict',
        maxHallucinations: 1,
      });
      const content = `
        Jones (2020) provides analysis.
        Smith (2019) disagrees.
        Brown (2021) offers a third view.
      `;

      const result = await enforcer.enforce(content);

      expect(result.action).toBe('rejected');
      expect(result.passed).toBe(false);
      expect(result.content).toBe('');
    });

    it('should warn when under hallucination threshold', async () => {
      const enforcer = new CitationEnforcer(testConstraint, {
        mode: 'strict',
        maxHallucinations: 5,
      });
      const content = 'Jones (2020) and Frede (1992) provide analysis.';

      const result = await enforcer.enforce(content);

      expect(result.action).toBe('warning');
      expect(result.passed).toBe(false);
    });
  });

  describe('enforce - warn mode', () => {
    it('should add warning comments to content', async () => {
      const enforcer = new CitationEnforcer(testConstraint, {
        mode: 'warn',
      });
      const content = 'Jones (2020) provides analysis.';

      const result = await enforcer.enforce(content);

      expect(result.action).toBe('warning');
      expect(result.content).toContain('CITATION WARNINGS');
      expect(result.content).toContain('Jones');
    });

    it('should calculate pass rate correctly', async () => {
      const enforcer = new CitationEnforcer(testConstraint, {
        mode: 'warn',
        minPassRate: 0.5,
      });
      const content = 'Frede (1992) and Jones (2020) discuss this.';

      const result = await enforcer.enforce(content);

      expect(result.validation.passRate).toBeCloseTo(0.5, 1);
    });
  });

  describe('enforcement report', () => {
    it('should generate detailed report', async () => {
      const enforcer = new CitationEnforcer(testConstraint, {
        mode: 'auto-correct',
        includeReport: true,
      });
      const content = 'Jones (2020) provides analysis. Frede (1992) agrees.';

      const result = await enforcer.enforce(content);

      expect(result.report).toBeDefined();
      expect(result.report).toContain('Citation Enforcement Report');
      expect(result.report).toContain('Action:');
      expect(result.report).toContain('Pass Rate:');
    });

    it('should list hallucinated citations in report', async () => {
      const enforcer = new CitationEnforcer(testConstraint, {
        mode: 'warn',
        includeReport: true,
      });
      const content = 'Jones (2020) provides analysis.';

      const result = await enforcer.enforce(content);

      expect(result.report).toContain('Hallucinated Citations');
      expect(result.report).toContain('Jones');
    });

    it('should list valid citations in report', async () => {
      const enforcer = new CitationEnforcer(testConstraint, {
        mode: 'auto-correct',
        includeReport: true,
      });
      const content = 'Frede (1992) provides analysis.';

      const result = await enforcer.enforce(content);

      expect(result.report).toContain('Valid Citations');
      expect(result.report).toContain('Frede');
    });
  });

  describe('getAvailableSources', () => {
    it('should return available corpus sources', () => {
      const enforcer = new CitationEnforcer(testConstraint);

      const sources = enforcer.getAvailableSources();

      expect(sources.length).toBe(4);
      expect(sources.some(s => s.author === 'Frede, Dorothea')).toBe(true);
    });
  });

  describe('isValidCitation', () => {
    it('should return true for valid citations', async () => {
      const enforcer = new CitationEnforcer(testConstraint);

      const valid = await enforcer.isValidCitation('(Frede 1992)');

      expect(valid).toBe(true);
    });

    it('should return false for invalid citations', async () => {
      const enforcer = new CitationEnforcer(testConstraint);

      const valid = await enforcer.isValidCitation('(Smith 2020)');

      expect(valid).toBe(false);
    });
  });

  describe('createEnforcerFromChunks', () => {
    it('should create enforcer from corpus chunks', () => {
      const chunks: ContextChunk[] = [
        {
          content: 'Phantasia is discussed...',
          relevanceScore: 0.85,
          metadata: {
            author: 'Frede, Dorothea',
            year: 1992,
            title: 'The Cognitive Role of Phantasia',
          },
        },
      ];

      const enforcer = createEnforcerFromChunks(chunks);

      expect(enforcer).toBeDefined();
      expect(enforcer.getAvailableSources().length).toBeGreaterThan(0);
    });

    it('should apply custom config', () => {
      const chunks: ContextChunk[] = [
        {
          content: 'Test content',
          relevanceScore: 0.8,
          metadata: {
            author: 'Test, Author',
            year: 2020,
            title: 'Test Article',
          },
        },
      ];

      const enforcer = createEnforcerFromChunks(chunks, {
        mode: 'strict',
        maxHallucinations: 0,
      });

      expect(enforcer).toBeDefined();
    });
  });
});
