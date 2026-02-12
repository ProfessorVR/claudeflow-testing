/**
 * Risk Classifier Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router - Phase 5.2
 * Risk-based routing classification
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  RiskClassifier,
  getRiskClassifier,
  resetRiskClassifier,
  initializeRiskClassifier,
  assessTaskRisk,
  shouldUseExpensiveModel,
  canUseLocalModel,
  describeRiskAssessment,
  getRouteDisplay,
  type RiskAssessment,
  type RiskContext,
} from '../../../../src/god-agent/core/router/risk-classifier.js';

describe('RiskClassifier', () => {
  beforeEach(() => {
    resetRiskClassifier();
  });

  afterEach(() => {
    resetRiskClassifier();
  });

  describe('High-Risk Pattern Detection', () => {
    it('should identify diagnosis tasks as high-risk', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Why is this failing? Find the root cause.');

      expect(assessment.riskLevel).toBe('high');
      expect(assessment.recommendedRoute).toBe('expensive');
      // The first matching pattern determines the reason
      expect(assessment.reason.toLowerCase()).toMatch(/diagnos|root cause|understanding/);
    });

    it('should identify architecture tasks as high-risk', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Design the system architecture for the new feature');

      expect(assessment.riskLevel).toBe('high');
      expect(assessment.recommendedRoute).toBe('expensive');
    });

    it('should identify security tasks as high-risk', () => {
      const classifier = new RiskClassifier();

      const prompts = [
        'Implement authentication for the API',
        'Fix the security vulnerability',
        'Add permission checks to the endpoint',
        'Handle credential storage securely',
      ];

      for (const prompt of prompts) {
        const assessment = classifier.assess(prompt);
        expect(assessment.riskLevel).toBe('high');
        expect(assessment.recommendedRoute).toBe('expensive');
      }
    });

    it('should identify cross-cutting refactors as high-risk', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Refactor across all modules to use the new pattern');

      expect(assessment.riskLevel).toBe('high');
      expect(assessment.recommendedRoute).toBe('expensive');
    });

    it('should identify decision-making as high-risk', () => {
      const classifier = new RiskClassifier();

      const prompts = [
        'Should we use Redux or Context for state management?',
        'Which approach is better for this use case?',
        'Decide between REST and GraphQL',
      ];

      for (const prompt of prompts) {
        const assessment = classifier.assess(prompt);
        expect(assessment.riskLevel).toBe('high');
      }
    });

    it('should identify production changes as high-risk', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Update the production database schema');

      expect(assessment.riskLevel).toBe('high');
      expect(assessment.recommendedRoute).toBe('expensive');
    });

    it('should identify API design as high-risk', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Design the API for the new user service');

      expect(assessment.riskLevel).toBe('high');
      expect(assessment.signals.some(s => s.includes('high_risk_pattern'))).toBe(true);
    });
  });

  describe('Low-Risk Pattern Detection', () => {
    it('should identify function implementation as low-risk', () => {
      const classifier = new RiskClassifier();

      const prompts = [
        'Implement a function to calculate the sum',
        'Write a function that parses JSON',
        'Create a function to validate email',
      ];

      for (const prompt of prompts) {
        const assessment = classifier.assess(prompt);
        expect(assessment.riskLevel).toBe('low');
        expect(assessment.recommendedRoute).toBe('local');
        expect(assessment.verificationMethod).toBe('tests');
      }
    });

    it('should identify test fixes as low-risk', () => {
      const classifier = new RiskClassifier();

      const prompts = [
        'Fix the failing test for UserService',
        'Make the test pass by updating the mock',
        'Update the test to match new behavior',
      ];

      for (const prompt of prompts) {
        const assessment = classifier.assess(prompt);
        expect(assessment.riskLevel).toBe('low');
        expect(assessment.feedbackSpeed).toBe('instant');
      }
    });

    it('should identify logging additions as low-risk', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Add logging to the payment handler');

      expect(assessment.riskLevel).toBe('low');
      expect(assessment.verificationMethod).toBe('diff_review');
    });

    it('should identify formatting tasks as low-risk', () => {
      const classifier = new RiskClassifier();

      const prompts = [
        'Format the code according to style guide',
        'Fix lint errors in the file',
        'Fix the typo in the variable name',
      ];

      for (const prompt of prompts) {
        const assessment = classifier.assess(prompt);
        expect(assessment.riskLevel).toBe('low');
        expect(assessment.reversibility).toBe('easy');
      }
    });

    it('should identify type additions as low-risk', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Add type annotations to the function');

      expect(assessment.riskLevel).toBe('low');
      expect(assessment.verificationMethod).toBe('tests');
    });
  });

  describe('Medium-Risk Pattern Detection', () => {
    it('should identify refactoring as medium-risk', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Refactor the UserService class');

      expect(assessment.riskLevel).toBe('medium');
      expect(assessment.recommendedRoute).toBe('local_then_review');
    });

    it('should identify feature work as medium-risk', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Add a new feature for user profiles');

      expect(assessment.riskLevel).toBe('medium');
      expect(assessment.recommendedRoute).toBe('local_then_review');
    });

    it('should identify endpoint additions as medium-risk', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Add a new endpoint for fetching orders');

      expect(assessment.riskLevel).toBe('medium');
    });
  });

  describe('Context-Based Assessment', () => {
    it('should escalate to high-risk for production context', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Add a simple logging statement', {
        isProduction: true,
      });

      expect(assessment.riskLevel).toBe('high');
      expect(assessment.recommendedRoute).toBe('expensive');
      expect(assessment.signals).toContain('production_context');
    });

    it('should escalate to high-risk for security-sensitive context', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Update the helper function', {
        securitySensitive: true,
      });

      expect(assessment.riskLevel).toBe('high');
      expect(assessment.signals).toContain('security_sensitive');
    });

    it('should use tests for verification when hasTests is true', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Update the component', {
        hasTests: true,
      });

      expect(assessment.verificationMethod).toBe('tests');
      expect(assessment.feedbackSpeed).toBe('fast');
    });

    it('should treat test fix context as low-risk', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Fix the code to make tests pass', {
        isTestFix: true,
      });

      expect(assessment.riskLevel).toBe('low');
      expect(assessment.verificationMethod).toBe('tests');
    });

    it('should consider previous outcomes for routing', () => {
      const classifier = new RiskClassifier();

      const highSuccessAssessment = classifier.assess('Generate some code', {
        previousOutcomes: {
          pattern: 'code_generation',
          successRate: 0.85,
          sampleCount: 10,
        },
      });

      expect(highSuccessAssessment.riskLevel).toBe('medium');
      expect(highSuccessAssessment.signals.some(s => s.includes('historical_success'))).toBe(true);

      const lowSuccessAssessment = classifier.assess('Generate some code', {
        previousOutcomes: {
          pattern: 'code_generation',
          successRate: 0.50,
          sampleCount: 10,
        },
      });

      // Local-first strategy is more aggressive - 50% success rate is now medium risk
      expect(lowSuccessAssessment.riskLevel).toBe('medium');
      expect(lowSuccessAssessment.signals.some(s => s.includes('historical_success'))).toBe(true);
    });

    it('should require minimum samples for historical routing', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Generate some code', {
        previousOutcomes: {
          pattern: 'code_generation',
          successRate: 0.50,
          sampleCount: 3, // Below threshold
        },
      });

      // Should not use historical data with insufficient samples
      expect(assessment.signals).not.toContain(expect.stringContaining('historical'));
    });

    it('should consider classification complexity', () => {
      const classifier = new RiskClassifier();

      const complexAssessment = classifier.assess('Do something', {
        classification: {
          type: 'code_edit',
          complexity: 'complex',
          riskLevel: 'high',
          signals: [],
          confidence: 0.8,
        },
      });

      expect(complexAssessment.riskLevel).toBe('high');
      expect(complexAssessment.signals).toContain('complex_classification');
    });
  });

  describe('Configuration Options', () => {
    it('should respect escalateProduction setting', () => {
      const classifier = new RiskClassifier({
        escalateProduction: false,
      });

      const assessment = classifier.assess('Add logging', {
        isProduction: true,
      });

      // Should not auto-escalate when disabled
      expect(assessment.riskLevel).toBe('low'); // Logging is low-risk
    });

    it('should respect minPatternSuccessRate threshold', () => {
      const classifier = new RiskClassifier({
        minPatternSuccessRate: 0.80,
      });

      const assessment = classifier.assess('Generate code', {
        previousOutcomes: {
          pattern: 'test',
          successRate: 0.75, // Above default 0.70, below custom 0.80
          sampleCount: 10,
        },
      });

      expect(assessment.riskLevel).toBe('high');
    });

    it('should accept custom high-risk patterns', () => {
      const classifier = new RiskClassifier({
        customHighRiskPatterns: [
          { pattern: /custom_risky/i, reason: 'Custom risk pattern' },
        ],
      });

      const assessment = classifier.assess('Do something custom_risky here');

      expect(assessment.riskLevel).toBe('high');
      expect(assessment.reason).toContain('Custom risk pattern');
    });

    it('should accept custom low-risk patterns', () => {
      const classifier = new RiskClassifier({
        customLowRiskPatterns: [
          { pattern: /custom_safe/i, reason: 'Custom safe pattern', verification: 'tests' },
        ],
      });

      const assessment = classifier.assess('Do something custom_safe here');

      expect(assessment.riskLevel).toBe('low');
      expect(assessment.verificationMethod).toBe('tests');
    });
  });

  describe('Utility Methods', () => {
    it('should check if expensive model is needed', () => {
      const classifier = new RiskClassifier();

      expect(classifier.shouldUseExpensiveModel('Design the architecture')).toBe(true);
      expect(classifier.shouldUseExpensiveModel('Fix the typo')).toBe(false);
    });

    it('should check if local model can be used', () => {
      const classifier = new RiskClassifier();

      expect(classifier.canUseLocalModel('Fix the typo')).toBe(true);
      expect(classifier.canUseLocalModel('Design the architecture')).toBe(false);
    });

    it('should get verification method', () => {
      const classifier = new RiskClassifier();

      expect(classifier.getVerificationMethod('Fix the failing test')).toBe('tests');
      expect(classifier.getVerificationMethod('Add a comment')).toBe('diff_review');
    });
  });

  describe('Assessment Properties', () => {
    it('should include all required properties', () => {
      const classifier = new RiskClassifier();
      const assessment = classifier.assess('Fix the test');

      expect(assessment).toHaveProperty('riskLevel');
      expect(assessment).toHaveProperty('feedbackSpeed');
      expect(assessment).toHaveProperty('reversibility');
      expect(assessment).toHaveProperty('verificationMethod');
      expect(assessment).toHaveProperty('recommendedRoute');
      expect(assessment).toHaveProperty('reason');
      expect(assessment).toHaveProperty('confidence');
      expect(assessment).toHaveProperty('signals');
    });

    it('should have confidence between 0 and 1', () => {
      const classifier = new RiskClassifier();

      const prompts = [
        'Fix the test',
        'Design the architecture',
        'Add logging',
        'Implement authentication',
      ];

      for (const prompt of prompts) {
        const assessment = classifier.assess(prompt);
        expect(assessment.confidence).toBeGreaterThanOrEqual(0);
        expect(assessment.confidence).toBeLessThanOrEqual(1);
      }
    });

    it('should include relevant signals', () => {
      const classifier = new RiskClassifier();

      const assessment = classifier.assess('Implement authentication', {
        isProduction: true,
        hasTests: true,
      });

      expect(assessment.signals.length).toBeGreaterThan(0);
    });
  });
});

describe('Singleton Pattern', () => {
  beforeEach(() => {
    resetRiskClassifier();
  });

  afterEach(() => {
    resetRiskClassifier();
  });

  it('should return same instance', () => {
    const instance1 = getRiskClassifier();
    const instance2 = getRiskClassifier();
    expect(instance1).toBe(instance2);
  });

  it('should reset singleton', () => {
    const instance1 = getRiskClassifier();
    resetRiskClassifier();
    const instance2 = getRiskClassifier();
    expect(instance1).not.toBe(instance2);
  });

  it('should initialize with config', () => {
    const instance = initializeRiskClassifier({
      escalateProduction: false,
    });

    const assessment = instance.assess('Add logging', { isProduction: true });
    expect(assessment.riskLevel).toBe('low'); // Not escalated
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    resetRiskClassifier();
  });

  describe('assessTaskRisk', () => {
    it('should assess risk without creating instance', () => {
      const assessment = assessTaskRisk('Fix the failing test');

      expect(assessment.riskLevel).toBe('low');
      expect(assessment.recommendedRoute).toBe('local');
    });
  });

  describe('shouldUseExpensiveModel', () => {
    it('should check if expensive model is needed', () => {
      expect(shouldUseExpensiveModel('Design the architecture')).toBe(true);
      expect(shouldUseExpensiveModel('Fix typo')).toBe(false);
    });
  });

  describe('canUseLocalModel', () => {
    it('should check if local model can be used', () => {
      expect(canUseLocalModel('Implement a helper function')).toBe(true);
      expect(canUseLocalModel('Why is this breaking?')).toBe(false);
    });
  });

  describe('describeRiskAssessment', () => {
    it('should describe assessment in human-readable form', () => {
      const lowRisk: RiskAssessment = {
        riskLevel: 'low',
        feedbackSpeed: 'instant',
        reversibility: 'easy',
        verificationMethod: 'tests',
        recommendedRoute: 'local',
        reason: 'Test',
        confidence: 0.8,
        signals: [],
      };

      const description = describeRiskAssessment(lowRisk);
      expect(description).toContain('low risk');
      expect(description).toContain('Local');
    });

    it('should describe expensive route', () => {
      const highRisk: RiskAssessment = {
        riskLevel: 'high',
        feedbackSpeed: 'slow',
        reversibility: 'difficult',
        verificationMethod: 'manual',
        recommendedRoute: 'expensive',
        reason: 'Test',
        confidence: 0.9,
        signals: [],
      };

      const description = describeRiskAssessment(highRisk);
      expect(description).toContain('Claude');
    });

    it('should describe local_then_review route', () => {
      const mediumRisk: RiskAssessment = {
        riskLevel: 'medium',
        feedbackSpeed: 'fast',
        reversibility: 'moderate',
        verificationMethod: 'diff_review',
        recommendedRoute: 'local_then_review',
        reason: 'Test',
        confidence: 0.7,
        signals: [],
      };

      const description = describeRiskAssessment(mediumRisk);
      expect(description).toContain('review');
    });
  });

  describe('getRouteDisplay', () => {
    it('should return emoji display for routes', () => {
      expect(getRouteDisplay({ recommendedRoute: 'local' } as RiskAssessment)).toContain('Local');
      expect(getRouteDisplay({ recommendedRoute: 'expensive' } as RiskAssessment)).toContain('Claude');
      expect(getRouteDisplay({ recommendedRoute: 'local_then_review' } as RiskAssessment)).toContain('Review');
    });
  });
});

describe('Routing Philosophy', () => {
  beforeEach(() => {
    resetRiskClassifier();
  });

  it('should route code generation to local', () => {
    const assessment = assessTaskRisk('Write a function to calculate factorial');

    expect(assessment.recommendedRoute).toBe('local');
    expect(assessment.verificationMethod).toBe('tests');
  });

  it('should route diagnosis to expensive', () => {
    const assessment = assessTaskRisk('Why is the database connection failing intermittently?');

    expect(assessment.recommendedRoute).toBe('expensive');
  });

  it('should route test fixes to local with instant feedback', () => {
    const assessment = assessTaskRisk('Fix the failing unit test for calculateTotal');

    expect(assessment.recommendedRoute).toBe('local');
    expect(assessment.feedbackSpeed).toBe('instant');
  });

  it('should route architecture decisions to expensive', () => {
    const assessment = assessTaskRisk('How should we structure the microservices?');

    expect(assessment.recommendedRoute).toBe('expensive');
    expect(assessment.feedbackSpeed).toBe('slow');
  });

  it('should route simple refactoring to local (local-first strategy)', () => {
    const assessment = assessTaskRisk('Extract this method into a separate function');

    // Local-first strategy routes low-risk refactoring to pure local
    expect(assessment.recommendedRoute).toBe('local');
  });

  it('should route security code to expensive', () => {
    const assessment = assessTaskRisk('Add input validation to prevent SQL injection');

    expect(assessment.recommendedRoute).toBe('expensive');
    expect(assessment.riskLevel).toBe('high');
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    resetRiskClassifier();
  });

  it('should handle empty prompt', () => {
    const assessment = assessTaskRisk('');

    expect(assessment).toBeDefined();
    expect(assessment.riskLevel).toBeDefined();
  });

  it('should handle very long prompt', () => {
    const longPrompt = 'Fix the bug '.repeat(1000);
    const assessment = assessTaskRisk(longPrompt);

    expect(assessment).toBeDefined();
  });

  it('should handle mixed signals', () => {
    // Both high and low risk signals
    const assessment = assessTaskRisk('Fix the security vulnerability in the test file');

    // High-risk should take precedence
    expect(assessment.riskLevel).toBe('high');
  });

  it('should handle unicode characters', () => {
    const assessment = assessTaskRisk('修复测试中的错误');

    expect(assessment).toBeDefined();
    expect(assessment.riskLevel).toBeDefined();
  });

  it('should default to local for ambiguous prompts (local-first strategy)', () => {
    const assessment = assessTaskRisk('Do something with the code');

    // Local-first strategy routes ambiguous prompts to pure local
    expect(assessment.recommendedRoute).toBe('local');
  });
});

describe('Performance', () => {
  it('should assess within 5ms', () => {
    const classifier = new RiskClassifier();
    const prompts = [
      'Design the architecture',
      'Fix the test',
      'Implement authentication',
      'Add logging',
    ];

    for (const prompt of prompts) {
      const start = performance.now();
      classifier.assess(prompt);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(5);
    }
  });
});
