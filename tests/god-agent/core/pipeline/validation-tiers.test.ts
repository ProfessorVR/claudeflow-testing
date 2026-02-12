/**
 * Tiered Validation System Tests
 * PHASE-2-002 - Tiered Validation System
 *
 * Tests for:
 * - Tier 1: Per-agent output validation
 * - Tier 2: Phase boundary validation
 * - Tier 3: Chapter gauntlet validation
 * - Configuration options
 * - Factory functions
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TieredValidator,
  createTieredValidator,
  createStrictTieredValidator,
  createLightweightValidator,
  ValidationTier,
  DEFAULT_VALIDATION_CONFIG,
  type ValidationConfig,
  type ValidationResult,
} from '../../../../src/god-agent/core/pipeline/validation-tiers.js';

describe('TieredValidator', () => {
  let validator: TieredValidator;

  beforeEach(() => {
    validator = new TieredValidator();
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const config = validator.getConfig();
      expect(config.enabledTiers).toEqual(DEFAULT_VALIDATION_CONFIG.enabledTiers);
      expect(config.tier1MaxRetries).toBe(DEFAULT_VALIDATION_CONFIG.tier1MaxRetries);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<ValidationConfig> = {
        tier1MaxRetries: 5,
        strictMode: true,
      };

      const customValidator = new TieredValidator(customConfig);
      const config = customValidator.getConfig();

      expect(config.tier1MaxRetries).toBe(5);
      expect(config.strictMode).toBe(true);
    });

    it('should update configuration', () => {
      validator.updateConfig({ tier1MaxRetries: 10 });
      expect(validator.getConfig().tier1MaxRetries).toBe(10);
    });
  });

  describe('Tier 1: Agent Output Validation', () => {
    it('should validate valid step-back-analyzer output', () => {
      const output = {
        high_level_framing: 'Problem involves understanding neural networks',
        key_questions: ['What is NN?', 'How to train?'],
        success_criteria: ['Understand architecture', 'Train model'],
      };

      const result = validator.validateAgentOutput('step-back-analyzer', output);
      expect(result.passed).toBe(true);
      expect(result.tier).toBe(ValidationTier.AGENT);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid step-back-analyzer output', () => {
      const output = {
        high_level_framing: '', // Empty string should fail
        key_questions: [],
        success_criteria: [],
      };

      const result = validator.validateAgentOutput('step-back-analyzer', output);
      expect(result.passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should mark Tier 1 failures as retryable', () => {
      const invalidOutput = { foo: 'bar' };
      const result = validator.validateAgentOutput('step-back-analyzer', invalidOutput);

      expect(result.passed).toBe(false);
      expect(result.retryable).toBe(true);
    });

    it('should generate revision guidance on failure', () => {
      const invalidOutput = {};
      const result = validator.validateAgentOutput('step-back-analyzer', invalidOutput);

      expect(result.revisionGuidance).toBeDefined();
      expect(result.revisionGuidance).toContain('step-back-analyzer');
    });

    it('should store agent outputs for later retrieval', () => {
      const output = {
        high_level_framing: 'Test framing',
        key_questions: ['Q1'],
        success_criteria: ['C1'],
      };

      validator.validateAgentOutput('step-back-analyzer', output);
      const stored = validator.getAgentOutput('step-back-analyzer');

      expect(stored).toBeDefined();
      expect((stored as any).high_level_framing).toBe('Test framing');
    });

    it('should skip validation when Tier 1 is disabled', () => {
      const disabledValidator = new TieredValidator({
        enabledTiers: [ValidationTier.PHASE, ValidationTier.CHAPTER],
      });

      const invalidOutput = {}; // Would normally fail
      const result = disabledValidator.validateAgentOutput('step-back-analyzer', invalidOutput);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should treat warnings as errors in strict mode', () => {
      const strictValidator = new TieredValidator({ strictMode: true });

      // Generic validation produces warnings for missing fields
      const partialOutput = { assumptions_list: [] };
      const result = strictValidator.validateAgentOutput('assumption-identifier', partialOutput);

      // In strict mode, warnings become errors
      expect(result.errors.some(e => e.includes('[Strict]'))).toBe(true);
    });
  });

  describe('Tier 2: Phase Boundary Validation', () => {
    it('should validate completed phase', () => {
      const agentOutputs = new Map<string, unknown>([
        ['step-back-analyzer', { high_level_framing: 'Test', key_questions: ['Q'], success_criteria: ['C'] }],
        ['assumption-identifier', { assumptions_list: [], preconditions: [], boundary_conditions: [] }],
        ['context-mapper', { domain_map: {}, related_fields: [], terminology: {} }],
        ['constraint-extractor', { constraint_list: [], must_haves: [], nice_to_haves: [] }],
      ]);

      const result = validator.validatePhaseCompletion(1, agentOutputs);

      expect(result.tier).toBe(ValidationTier.PHASE);
      expect(result.passed).toBe(true);
    });

    it('should detect missing agents', () => {
      const incompleteOutputs = new Map<string, unknown>([
        ['step-back-analyzer', { high_level_framing: 'Test', key_questions: ['Q'], success_criteria: ['C'] }],
        // Missing: assumption-identifier, context-mapper, constraint-extractor
      ]);

      const result = validator.validatePhaseCompletion(1, incompleteOutputs);

      // With default config (tier2FailFast: false), missing agents are warnings
      expect(result.warnings.some(w => w.includes('missing agents'))).toBe(true);
    });

    it('should fail fast when configured', () => {
      const failFastValidator = new TieredValidator({ tier2FailFast: true });

      const incompleteOutputs = new Map<string, unknown>([
        ['step-back-analyzer', { high_level_framing: 'Test', key_questions: ['Q'], success_criteria: ['C'] }],
      ]);

      const result = failFastValidator.validatePhaseCompletion(1, incompleteOutputs);

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('missing agents'))).toBe(true);
    });

    it('should mark phase as not retryable', () => {
      const incompleteOutputs = new Map<string, unknown>();
      const result = validator.validatePhaseCompletion(1, incompleteOutputs);

      expect(result.retryable).toBe(false);
    });

    it('should generate revision guidance on failure', () => {
      const failFastValidator = new TieredValidator({ tier2FailFast: true });
      const incompleteOutputs = new Map<string, unknown>();

      const result = failFastValidator.validatePhaseCompletion(1, incompleteOutputs);

      expect(result.revisionGuidance).toBeDefined();
      expect(result.revisionGuidance).toContain('Phase 1');
    });

    it('should track phase completion status', () => {
      const agentOutputs = new Map<string, unknown>([
        ['step-back-analyzer', { high_level_framing: 'T', key_questions: ['Q'], success_criteria: ['C'] }],
        ['assumption-identifier', { assumptions_list: [], preconditions: [], boundary_conditions: [] }],
        ['context-mapper', { domain_map: {}, related_fields: [], terminology: {} }],
        ['constraint-extractor', { constraint_list: [], must_haves: [], nice_to_haves: [] }],
      ]);

      validator.validatePhaseCompletion(1, agentOutputs);

      expect(validator.isPhaseComplete(1)).toBe(true);
      expect(validator.isPhaseComplete(2)).toBe(false);
    });
  });

  describe('Tier 3: Chapter Validation (Gauntlet)', () => {
    // Note: Full Tier 3 testing requires the Quality Gauntlet to be properly integrated
    // These tests verify the interface and basic behavior

    it('should skip validation when Tier 3 is disabled', async () => {
      const noTier3Validator = new TieredValidator({
        enabledTiers: [ValidationTier.AGENT, ValidationTier.PHASE],
      });

      const result = await noTier3Validator.validateChapter('Sample chapter text', 1);

      expect(result.passed).toBe(true);
      expect(result.tier).toBe(ValidationTier.CHAPTER);
      expect(result.errors).toHaveLength(0);
    });

    it('should return proper structure for chapter validation', async () => {
      // This test will hit the actual gauntlet - may timeout or fail depending on gauntlet implementation
      // For unit testing, we primarily verify the interface
      const validator = new TieredValidator({
        enabledTiers: [ValidationTier.CHAPTER],
        tier3GauntletConfig: 'default',
      });

      // Very short text to minimize gauntlet execution time
      const result = await validator.validateChapter('Short test.', 1);

      expect(result.tier).toBe(ValidationTier.CHAPTER);
      expect(typeof result.passed).toBe('boolean');
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(typeof result.timestamp).toBe('string');
      expect(typeof result.durationMs).toBe('number');
    });
  });

  describe('Reset', () => {
    it('should clear stored outputs on reset', () => {
      const output = {
        high_level_framing: 'Test',
        key_questions: ['Q'],
        success_criteria: ['C'],
      };

      validator.validateAgentOutput('step-back-analyzer', output);
      expect(validator.getAgentOutput('step-back-analyzer')).toBeDefined();

      validator.reset();
      expect(validator.getAgentOutput('step-back-analyzer')).toBeUndefined();
    });

    it('should clear phase completion status on reset', () => {
      const outputs = new Map<string, unknown>([
        ['step-back-analyzer', { high_level_framing: 'T', key_questions: ['Q'], success_criteria: ['C'] }],
        ['assumption-identifier', { assumptions_list: [], preconditions: [], boundary_conditions: [] }],
        ['context-mapper', { domain_map: {}, related_fields: [], terminology: {} }],
        ['constraint-extractor', { constraint_list: [], must_haves: [], nice_to_haves: [] }],
      ]);

      validator.validatePhaseCompletion(1, outputs);
      expect(validator.isPhaseComplete(1)).toBe(true);

      validator.reset();
      expect(validator.isPhaseComplete(1)).toBe(false);
    });
  });

  describe('Factory Functions', () => {
    it('createTieredValidator should create default validator', () => {
      const defaultValidator = createTieredValidator();
      const config = defaultValidator.getConfig();

      expect(config.enabledTiers).toEqual(DEFAULT_VALIDATION_CONFIG.enabledTiers);
      expect(config.strictMode).toBe(false);
    });

    it('createStrictTieredValidator should create strict validator', () => {
      const strictValidator = createStrictTieredValidator();
      const config = strictValidator.getConfig();

      expect(config.strictMode).toBe(true);
      expect(config.tier2FailFast).toBe(true);
      expect(config.tier3GauntletConfig).toBe('strict');
    });

    it('createLightweightValidator should create Tier 1 only validator', () => {
      const lightValidator = createLightweightValidator();
      const config = lightValidator.getConfig();

      expect(config.enabledTiers).toEqual([ValidationTier.AGENT]);
      expect(config.tier1MaxRetries).toBe(1);
    });
  });

  describe('Timing Metadata', () => {
    it('should track validation duration', () => {
      const output = {
        high_level_framing: 'Test',
        key_questions: ['Q'],
        success_criteria: ['C'],
      };

      const result = validator.validateAgentOutput('step-back-analyzer', output);

      expect(result.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.timestamp).toBeDefined();
    });

    it('should have valid ISO timestamp', () => {
      const output = {
        high_level_framing: 'Test',
        key_questions: ['Q'],
        success_criteria: ['C'],
      };

      const result = validator.validateAgentOutput('step-back-analyzer', output);
      const parsedDate = new Date(result.timestamp);

      expect(parsedDate.toString()).not.toBe('Invalid Date');
    });
  });
});
