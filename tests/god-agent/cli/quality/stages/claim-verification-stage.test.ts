/**
 * Tests for ClaimVerificationStage - Quality Gauntlet Stage 8
 *
 * CCV Phase C entailment verification as a gauntlet stage.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  ClaimVerificationStage,
  createClaimVerificationStage,
  createStrictClaimVerificationStage,
  createDraftClaimVerificationStage,
} from '../../../../../src/god-agent/cli/quality/stages/claim-verification-stage.js';
import type { QualityStageResult, QualityEvaluationContext } from '../../../../../src/god-agent/cli/quality/quality-stage.js';

describe('ClaimVerificationStage', () => {
  let stage: ClaimVerificationStage;

  beforeEach(() => {
    stage = new ClaimVerificationStage();
  });

  describe('interface compliance', () => {
    it('should have correct name', () => {
      expect(stage.name).toBe('claim-verification');
    });

    it('should have weight of 0.07', () => {
      expect(stage.weight).toBe(0.07);
    });

    it('should have threshold of 0.60', () => {
      expect(stage.threshold).toBe(0.60);
    });

    it('should not support auto-fix', () => {
      const issue = {
        id: 'test',
        type: 'factual' as const,
        severity: 'critical' as const,
        location: { chapterId: 1 },
        description: 'test',
        suggestion: 'test',
        autoFixable: false,
      };
      expect(stage.canAutoFix(issue)).toBe(false);
    });

    it('should return text unchanged for autoFix', () => {
      const text = 'Some text.';
      const issue = {
        id: 'test',
        type: 'factual' as const,
        severity: 'critical' as const,
        location: { chapterId: 1 },
        description: 'test',
        suggestion: 'test',
        autoFixable: false,
      };
      expect(stage.autoFix(text, issue)).toBe(text);
    });
  });

  describe('evaluate', () => {
    it('should return perfect score for empty text', async () => {
      const result = await stage.evaluate('', 1);

      expect(result.passed).toBe(true);
      expect(result.score).toBe(1.0);
      expect(result.issues).toHaveLength(0);
    });

    it('should evaluate academic text and return stage result', async () => {
      const text = `Aristotle argues that phantasia is a faculty of the soul. This capacity mediates between perception and thought, enabling practical reasoning.

Heidegger suggests that Stimmung functions as an ontological disclosure. Mood is not merely a psychological state but reveals the fundamental structure of being-in-the-world.`;

      const result = await stage.evaluate(text, 1);

      expect(result.stageName).toBe('claim-verification');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
      expect(result.passed).toBeDefined();
      expect(result.issues).toBeDefined();
      expect(result.metrics).toBeDefined();
    });

    it('should include correct metrics', async () => {
      const text = 'A simple academic paragraph with a claim about philosophy.';
      const result = await stage.evaluate(text, 1);

      expect(result.metrics).toHaveProperty('totalClaims');
      expect(result.metrics).toHaveProperty('paragraphsChecked');
      expect(result.metrics).toHaveProperty('processingTimeMs');
    });

    it('should handle context with corpus data', async () => {
      const text = 'Aristotle argues that the soul is the form of the body.';
      const context: QualityEvaluationContext = {
        corpusChunks: [],
        corpusSources: [],
        knownAuthors: ['Aristotle'],
      };

      const result = await stage.evaluate(text, 1, context);

      expect(result.stageName).toBe('claim-verification');
      expect(result.score).toBeDefined();
    });
  });

  describe('factory functions', () => {
    it('should create default stage', () => {
      const s = createClaimVerificationStage();
      expect(s.name).toBe('claim-verification');
    });

    it('should create strict stage', () => {
      const s = createStrictClaimVerificationStage();
      expect(s.name).toBe('claim-verification');
    });

    it('should create draft stage', () => {
      const s = createDraftClaimVerificationStage();
      expect(s.name).toBe('claim-verification');
    });

    it('should create with custom config', () => {
      const s = createClaimVerificationStage({
        riskThreshold: 'high',
        minSupportRatio: 0.80,
      });
      expect(s.name).toBe('claim-verification');
    });
  });

  describe('BLOCKED verdict handling', () => {
    it('should treat BLOCKED claims as minor coherence issues', async () => {
      // BLOCKED verdicts should be 'minor' severity and 'coherence' type
      // This is tested indirectly through evaluate - BLOCKED claims with
      // unresolved referents should not fail the stage
      const text = 'This view suggests that the process is essential.';
      const result = await stage.evaluate(text, 1);

      // Any BLOCKED issues should be minor
      const blockedIssues = result.issues.filter(i =>
        i.description.includes('Unresolved referent')
      );
      for (const issue of blockedIssues) {
        expect(issue.severity).toBe('minor');
        expect(issue.type).toBe('coherence');
      }
    });
  });

  describe('score calculation', () => {
    it('should produce score between 0 and 1', async () => {
      const text = 'Aristotle argues that phantasia mediates deliberation. Heidegger suggests Stimmung reveals being.';
      const result = await stage.evaluate(text, 1);

      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });
});

describe('QualityGauntlet integration', () => {
  it('should be importable from stages index', async () => {
    const { ClaimVerificationStage } = await import(
      '../../../../../src/god-agent/cli/quality/stages/index.js'
    );
    expect(ClaimVerificationStage).toBeDefined();
  });

  it('should be importable from quality index', async () => {
    const { ClaimVerificationStage } = await import(
      '../../../../../src/god-agent/cli/quality/index.js'
    );
    expect(ClaimVerificationStage).toBeDefined();
  });
});
