/**
 * Agent Schemas Tests
 * PHASE-2-001 - Agent Output Schema Validation
 *
 * Tests for:
 * - Schema validation for all 48 agents
 * - Required field validation
 * - Type checking
 * - Custom validators for critical agents
 * - Schema registry functions
 */

import { describe, it, expect } from 'vitest';
import {
  validateAgentOutput,
  isValidAgentKey,
  getExpectedFields,
  getAllAgentKeys,
  type StepBackAnalyzerOutput,
  type TechnicalWriterOutput,
  type AdversarialReviewerOutput,
  type FinalSynthesizerOutput,
  type SchemaValidationResult,
} from '../../../../src/god-agent/core/pipeline/agent-schemas.js';

describe('Agent Schemas', () => {
  describe('validateAgentOutput', () => {
    describe('Step-Back Analyzer (Agent 1)', () => {
      it('should validate valid output', () => {
        const validOutput: StepBackAnalyzerOutput = {
          high_level_framing: 'Problem involves understanding X',
          key_questions: ['What is X?', 'How does X work?'],
          success_criteria: ['Understand X', 'Document findings'],
        };

        const result = validateAgentOutput('step-back-analyzer', validOutput);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject empty high_level_framing', () => {
        const invalidOutput = {
          high_level_framing: '',
          key_questions: ['What is X?'],
          success_criteria: ['Understand X'],
        };

        const result = validateAgentOutput('step-back-analyzer', invalidOutput);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('high_level_framing must be a non-empty string');
      });

      it('should reject empty key_questions array', () => {
        const invalidOutput = {
          high_level_framing: 'Problem involves X',
          key_questions: [],
          success_criteria: ['Understand X'],
        };

        const result = validateAgentOutput('step-back-analyzer', invalidOutput);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('key_questions must be a non-empty array');
      });

      it('should reject missing success_criteria', () => {
        const invalidOutput = {
          high_level_framing: 'Problem involves X',
          key_questions: ['What is X?'],
        };

        const result = validateAgentOutput('step-back-analyzer', invalidOutput);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('success_criteria must be a non-empty array');
      });

      it('should reject non-object output', () => {
        const result = validateAgentOutput('step-back-analyzer', 'not an object');
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('Output must be an object');
      });
    });

    describe('Technical Writer (Agent 26)', () => {
      it('should validate valid output', () => {
        const validOutput: TechnicalWriterOutput = {
          technical_document: 'This is the full technical document content...',
          methodology_section: 'The methodology employed...',
        };

        const result = validateAgentOutput('technical-writer', validOutput);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it('should reject empty technical_document', () => {
        const invalidOutput = {
          technical_document: '',
          methodology_section: 'Valid methodology',
        };

        const result = validateAgentOutput('technical-writer', invalidOutput);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('technical_document must be a non-empty string');
      });
    });

    describe('Adversarial Reviewer (Agent 33)', () => {
      it('should validate valid output', () => {
        const validOutput: AdversarialReviewerOutput = {
          attack_vectors: [{ vector: 'Data poisoning', severity: 'high', mitigation: 'Input validation' }],
          weaknesses: ['Limited scope'],
          counterarguments: ['Alternative interpretation'],
        };

        const result = validateAgentOutput('adversarial-reviewer', validOutput);
        expect(result.valid).toBe(true);
      });

      it('should warn when no attack vectors found', () => {
        const output = {
          attack_vectors: [],
          weaknesses: ['Limited scope'],
          counterarguments: ['Alternative interpretation'],
        };

        const result = validateAgentOutput('adversarial-reviewer', output);
        expect(result.valid).toBe(true); // Empty is valid but warns
        expect(result.warnings).toContain('No attack vectors identified - consider if this is complete');
      });

      it('should reject missing arrays', () => {
        const invalidOutput = {
          attack_vectors: 'not an array',
          weaknesses: ['Limited'],
          counterarguments: ['Alt'],
        };

        const result = validateAgentOutput('adversarial-reviewer', invalidOutput);
        expect(result.valid).toBe(false);
        expect(result.errors).toContain('attack_vectors must be an array');
      });
    });

    describe('Final Synthesizer (Agent 47)', () => {
      it('should validate valid output', () => {
        const validOutput: FinalSynthesizerOutput = {
          qa_synthesis: {
            overall_quality: 0.85,
            critical_issues: [],
            warnings: ['Minor formatting'],
            passed_checks: 14,
            failed_checks: 0,
          },
          final_recommendations: ['Proceed to publication'],
          go_no_go_decision: 'go',
        };

        const result = validateAgentOutput('final-synthesizer', validOutput);
        expect(result.valid).toBe(true);
      });

      it('should reject invalid go_no_go_decision', () => {
        const invalidOutput = {
          qa_synthesis: { overall_quality: 0.85 },
          final_recommendations: [],
          go_no_go_decision: 'maybe',
        };

        const result = validateAgentOutput('final-synthesizer', invalidOutput);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.includes('go_no_go_decision'))).toBe(true);
      });

      it('should reject missing qa_synthesis', () => {
        const invalidOutput = {
          final_recommendations: [],
          go_no_go_decision: 'go',
        };

        const result = validateAgentOutput('final-synthesizer', invalidOutput);
        expect(result.valid).toBe(false);
      });
    });

    describe('Generic Validation', () => {
      it('should use generic validation for agents without custom validators', () => {
        const output = {
          assumptions_list: [{ assumption: 'Test', importance: 'high', verifiable: true }],
          preconditions: ['Pre 1'],
          boundary_conditions: ['Bound 1'],
        };

        const result = validateAgentOutput('assumption-identifier', output);
        // Generic validation only warns about missing fields, doesn't error
        expect(result.errors).toHaveLength(0);
      });

      it('should warn about missing expected fields', () => {
        const output = {
          assumptions_list: [],
          // Missing: preconditions, boundary_conditions
        };

        const result = validateAgentOutput('assumption-identifier', output);
        expect(result.warnings.some(w => w.includes('preconditions'))).toBe(true);
        expect(result.warnings.some(w => w.includes('boundary_conditions'))).toBe(true);
      });
    });

    describe('Unknown Agent', () => {
      it('should warn for unknown agent keys', () => {
        const result = validateAgentOutput('unknown-agent', { foo: 'bar' });
        expect(result.errors).toHaveLength(0);
        expect(result.warnings).toContain('Unknown agent key: unknown-agent');
      });
    });
  });

  describe('isValidAgentKey', () => {
    it('should return true for valid agent keys', () => {
      expect(isValidAgentKey('step-back-analyzer')).toBe(true);
      expect(isValidAgentKey('technical-writer')).toBe(true);
      expect(isValidAgentKey('sign-off-approver')).toBe(true);
    });

    it('should return false for invalid agent keys', () => {
      expect(isValidAgentKey('unknown-agent')).toBe(false);
      expect(isValidAgentKey('')).toBe(false);
      expect(isValidAgentKey('step_back_analyzer')).toBe(false); // Wrong format
    });
  });

  describe('getExpectedFields', () => {
    it('should return expected fields for step-back-analyzer', () => {
      const fields = getExpectedFields('step-back-analyzer');
      expect(fields).toContain('high_level_framing');
      expect(fields).toContain('key_questions');
      expect(fields).toContain('success_criteria');
    });

    it('should return expected fields for technical-writer', () => {
      const fields = getExpectedFields('technical-writer');
      expect(fields).toContain('technical_document');
      expect(fields).toContain('methodology_section');
    });

    it('should return expected fields for final-synthesizer', () => {
      const fields = getExpectedFields('final-synthesizer');
      expect(fields).toContain('qa_synthesis');
      expect(fields).toContain('final_recommendations');
      expect(fields).toContain('go_no_go_decision');
    });
  });

  describe('getAllAgentKeys', () => {
    it('should return all 48 agent keys', () => {
      const keys = getAllAgentKeys();
      expect(keys.length).toBe(48);
    });

    it('should include agents from all phases', () => {
      const keys = getAllAgentKeys();

      // Phase 1
      expect(keys).toContain('step-back-analyzer');
      expect(keys).toContain('constraint-extractor');

      // Phase 2
      expect(keys).toContain('literature-reviewer');
      expect(keys).toContain('edge-case-hunter');

      // Phase 3
      expect(keys).toContain('framework-builder');
      expect(keys).toContain('contradiction-analyzer');

      // Phase 4
      expect(keys).toContain('cross-validator');
      expect(keys).toContain('trade-off-analyzer');

      // Phase 5
      expect(keys).toContain('algorithm-designer');
      expect(keys).toContain('performance-estimator');

      // Phase 6
      expect(keys).toContain('technical-writer');
      expect(keys).toContain('abstract-writer');

      // Phase 7
      expect(keys).toContain('adversarial-reviewer');
      expect(keys).toContain('sign-off-approver');
    });
  });
});
