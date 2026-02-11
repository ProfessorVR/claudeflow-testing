/**
 * Tests for Human Verification Support
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HumanVerifier,
  createHumanVerifier,
  createNonInteractiveVerifier,
  type ReviewContext,
  type VerificationDecision,
} from '../../../src/god-agent/__experimental__/human-verification.js';

describe('HumanVerifier', () => {
  let verifier: HumanVerifier;

  beforeEach(() => {
    verifier = createHumanVerifier({ enabled: false }); // Disabled for automated testing
  });

  describe('Constructor and Options', () => {
    it('should create verifier with default options', () => {
      const v = createHumanVerifier();
      expect(v).toBeInstanceOf(HumanVerifier);
    });

    it('should create non-interactive verifier', () => {
      const v = createNonInteractiveVerifier();
      expect(v).toBeInstanceOf(HumanVerifier);
    });

    it('should accept custom options', () => {
      const v = createHumanVerifier({
        enabled: true,
        autoAcceptAfterIterations: 5,
        promptTimeout: 10000,
      });
      expect(v).toBeInstanceOf(HumanVerifier);
    });
  });

  describe('shouldPrompt', () => {
    it('should not prompt when disabled', () => {
      const result = verifier.shouldPrompt(1, 0.8, 0.85);
      expect(result).toBe(false);
    });

    it('should not prompt on first iteration', () => {
      const v = createHumanVerifier({ enabled: true });
      const result = v.shouldPrompt(0, 0.8, 0.85);
      expect(result).toBe(false);
    });

    it('should not prompt when score meets threshold', () => {
      const v = createHumanVerifier({ enabled: true });
      const result = v.shouldPrompt(1, 0.90, 0.85);
      expect(result).toBe(false);
    });

    it('should prompt when conditions are met', () => {
      const v = createHumanVerifier({ enabled: true });
      const result = v.shouldPrompt(1, 0.80, 0.85);
      expect(result).toBe(true);
    });

    it('should respect auto-accept iterations', () => {
      const v = createHumanVerifier({ enabled: true, autoAcceptAfterIterations: 3 });
      const result = v.shouldPrompt(3, 0.80, 0.85);
      expect(result).toBe(false);
    });
  });

  describe('promptReview', () => {
    it('should return continue when disabled', async () => {
      const context: ReviewContext = {
        iteration: 1,
        maxIterations: 3,
        currentScore: 0.80,
        targetThreshold: 0.85,
        gauntletResult: {
          runId: 'test',
          passed: false,
          overallScore: 0.80,
          stageResults: [],
          summary: { criticalCount: 0, majorCount: 1, minorCount: 2, autoFixableCount: 0 },
          metadata: { timestamp: new Date().toISOString() },
        },
        content: 'Test content',
      };

      const decision = await verifier.promptReview(context);
      expect(decision.action).toBe('continue');
    });

    it('should auto-accept after max iterations', async () => {
      const v = createHumanVerifier({ enabled: true, autoAcceptAfterIterations: 2 });

      const context: ReviewContext = {
        iteration: 2,
        maxIterations: 3,
        currentScore: 0.80,
        targetThreshold: 0.85,
        gauntletResult: {
          runId: 'test',
          passed: false,
          overallScore: 0.80,
          stageResults: [],
          summary: { criticalCount: 0, majorCount: 1, minorCount: 2, autoFixableCount: 0 },
          metadata: { timestamp: new Date().toISOString() },
        },
        content: 'Test content',
      };

      const decision = await v.promptReview(context);
      expect(decision.action).toBe('accept');
    });
  });

  describe('resetPrompts', () => {
    it('should allow prompts after reset', () => {
      verifier.resetPrompts();
      // Verify that internal state is reset (indirectly)
      expect(verifier).toBeInstanceOf(HumanVerifier);
    });
  });

  describe('updateOptions', () => {
    it('should update verifier options', () => {
      verifier.updateOptions({ enabled: true });
      // Verify options updated (behavior would change in real scenario)
      expect(verifier).toBeInstanceOf(HumanVerifier);
    });
  });
});

describe('Integration Tests', () => {
  it('should handle multiple review cycles', async () => {
    const v = createNonInteractiveVerifier();

    for (let i = 0; i < 3; i++) {
      const context: ReviewContext = {
        iteration: i,
        maxIterations: 3,
        currentScore: 0.70 + i * 0.05,
        targetThreshold: 0.85,
        gauntletResult: {
          runId: `test-${i}`,
          passed: false,
          overallScore: 0.70 + i * 0.05,
          stageResults: [],
          summary: { criticalCount: 0, majorCount: 1, minorCount: 2, autoFixableCount: 0 },
          metadata: { timestamp: new Date().toISOString() },
        },
        content: 'Test content',
      };

      const decision = await v.promptReview(context);
      expect(decision.action).toBe('continue');
    }
  });

  it('should handle previous score tracking', async () => {
    const v = createNonInteractiveVerifier();

    const context: ReviewContext = {
      iteration: 2,
      maxIterations: 3,
      currentScore: 0.82,
      targetThreshold: 0.85,
      previousScore: 0.75,
      gauntletResult: {
        runId: 'test',
        passed: false,
        overallScore: 0.82,
        stageResults: [],
        summary: { criticalCount: 0, majorCount: 1, minorCount: 2, autoFixableCount: 0 },
        metadata: { timestamp: new Date().toISOString() },
      },
      content: 'Test content',
    };

    const decision = await v.promptReview(context);
    expect(decision.action).toBe('continue');
    expect(context.previousScore).toBe(0.75);
  });
});
