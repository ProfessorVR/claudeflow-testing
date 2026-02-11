/**
 * Tests for Tiered Validation System
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TieredValidator,
  createTieredValidator,
  type ValidationOptions,
} from '../../../src/god-agent/__experimental__/tiered-validation.js';

describe('TieredValidator', () => {
  let validator: TieredValidator;

  beforeEach(() => {
    validator = createTieredValidator();
  });

  describe('Constructor', () => {
    it('should create validator with defaults', () => {
      expect(validator).toBeInstanceOf(TieredValidator);
    });

    it('should have correct default thresholds', () => {
      expect(TieredValidator.DEFAULT_THRESHOLDS.agent).toBe(0.75);
      expect(TieredValidator.DEFAULT_THRESHOLDS.phase).toBe(0.85);
      expect(TieredValidator.DEFAULT_THRESHOLDS.pipeline).toBe(0.90);
    });

    it('should have correct tier weights', () => {
      expect(TieredValidator.TIER_WEIGHTS.agent).toBe(0.2);
      expect(TieredValidator.TIER_WEIGHTS.phase).toBe(0.3);
      expect(TieredValidator.TIER_WEIGHTS.pipeline).toBe(0.5);
    });
  });

  describe('validateAll', () => {
    it('should validate short content', async () => {
      const options: ValidationOptions = {
        content: 'Test content that is too short.',
      };

      const result = await validator.validateAll(options);
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('overallScore');
      expect(result).toHaveProperty('agentLevel');
      expect(result).toHaveProperty('phaseLevel');
      expect(result).toHaveProperty('pipelineLevel');
    });

    it('should validate medium content', async () => {
      const content = Array(5).fill('This is a test paragraph with sufficient content. ').join('\n\n');
      const options: ValidationOptions = { content };

      const result = await validator.validateAll(options);
      expect(result.passed).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
    });

    it('should validate long content', async () => {
      const paragraphs = Array(10).fill(0).map((_, i) =>
        `Paragraph ${i + 1}. This is a well-structured paragraph with sufficient content to demonstrate proper validation. However, we need to ensure that the content meets all quality criteria.`
      );
      const content = paragraphs.join('\n\n');

      const options: ValidationOptions = { content };
      const result = await validator.validateAll(options);

      expect(result.totalIssues).toBeGreaterThanOrEqual(0);
      expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should respect skipTiers option', async () => {
      const options: ValidationOptions = {
        content: 'Test content.',
        skipTiers: ['phase', 'pipeline'],
      };

      const result = await validator.validateAll(options);
      expect(result.agentLevel.passed).toBeDefined();
      expect(result.phaseLevel.score).toBe(1.0); // Skipped = passed
      expect(result.pipelineLevel.score).toBe(1.0); // Skipped = passed
    });

    it('should apply custom thresholds', async () => {
      const options: ValidationOptions = {
        content: 'Test content.',
        thresholds: {
          agent: 0.5,
          phase: 0.6,
          pipeline: 0.7,
        },
      };

      const result = await validator.validateAll(options);
      expect(result).toHaveProperty('passed');
    });
  });

  describe('formatValidationReport', () => {
    it('should format validation report', async () => {
      const options: ValidationOptions = {
        content: 'Test content.',
      };

      const result = await validator.validateAll(options);
      const report = TieredValidator.formatValidationReport(result);

      expect(report).toContain('TIERED VALIDATION REPORT');
      expect(report).toContain('Overall Status');
      expect(report).toContain('Tier 1: Agent-Level');
      expect(report).toContain('Tier 2: Phase-Level');
      expect(report).toContain('Tier 3: Pipeline-Level');
    });
  });

  describe('Custom Validators', () => {
    it('should allow registering custom agent validators', () => {
      validator.registerAgentValidator(async (content) => {
        return content.length < 50 ? [{
          id: 'custom-1',
          severity: 'minor',
          validator: 'custom',
          message: 'Custom issue',
          autoFixable: false,
        }] : [];
      });

      expect(validator).toBeInstanceOf(TieredValidator);
    });

    it('should allow registering custom phase validators', () => {
      validator.registerPhaseValidator(async (_content) => []);
      expect(validator).toBeInstanceOf(TieredValidator);
    });

    it('should allow registering custom pipeline validators', () => {
      validator.registerPipelineValidator(async (_content) => []);
      expect(validator).toBeInstanceOf(TieredValidator);
    });
  });
});
