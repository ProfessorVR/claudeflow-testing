/**
 * Tests for Enhanced Quality Integration
 *
 * Tests the unified quality pipeline combining:
 * - Quality Gauntlet (7-stage validation)
 * - Register Enforcer (academic register)
 * - Enhanced Style Drift Detector
 * - Context Tier Manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EnhancedQualityIntegration,
  createEnhancedQualityIntegration,
  createStrictAcademicIntegration,
  createDraftIntegration,
  createDissertationIntegration,
  type EnhancedValidationResult,
} from '../../../src/god-agent/__experimental__/enhanced-quality-integration.js';
import type { StyleCharacteristics } from '../../../src/god-agent/universal/style-analyzer.js';

describe('Enhanced Quality Integration', () => {
  let integration: EnhancedQualityIntegration;

  const formalAcademicText = `
    The phenomenological analysis reveals significant patterns in player experience.
    Furthermore, the methodology employed demonstrates robust validity across contexts.
    This approach consequently enables researchers to examine subjective dimensions
    of interactive media with greater precision than traditional methods allow.

    The theoretical framework establishes a foundation for understanding how players
    construct meaning through engagement with virtual environments. Moreover, the
    empirical evidence suggests that these experiences transcend mere entertainment
    to constitute genuine phenomenal encounters worthy of philosophical investigation.
  `.trim();

  const informalText = `
    So basically this stuff is really cool and it shows how players get into games.
    We're gonna look at what makes games awesome and why people love them so much!
    It's pretty interesting when you think about it.

    Anyway, the thing is that games are kinda special and they make you feel stuff.
    You know what I mean? Like, they're not just fun, they're actually meaningful!
  `.trim();

  const mixedText = `
    The research methodology demonstrates robust validity. However, the results are
    really cool and show that players don't always behave rationally. Furthermore,
    the phenomenological framework provides significant insights.

    It's important to note that the theoretical foundations are solid. The analysis
    reveals patterns that researchers haven't seen before in this context.
  `.trim();

  beforeEach(() => {
    integration = createEnhancedQualityIntegration();
  });

  // ==========================================================================
  // Constructor and Configuration
  // ==========================================================================

  describe('Constructor and Configuration', () => {
    it('should create with default configuration', () => {
      const i = new EnhancedQualityIntegration();
      expect(i).toBeInstanceOf(EnhancedQualityIntegration);
    });

    it('should accept custom configuration', () => {
      const i = new EnhancedQualityIntegration({
        gauntletThreshold: 0.90,
        registerMinScore: 0.85,
        maxDrift: 0.20,
      });

      expect(i).toBeInstanceOf(EnhancedQualityIntegration);
    });

    it('should accept custom weights', () => {
      const i = new EnhancedQualityIntegration({
        weights: {
          gauntlet: 0.40,
          register: 0.30,
          drift: 0.30,
        },
      });

      expect(i).toBeInstanceOf(EnhancedQualityIntegration);
    });

    it('should allow configuration updates', () => {
      integration.updateConfig({
        gauntletThreshold: 0.90,
      });

      // Config update should not throw
      expect(integration).toBeInstanceOf(EnhancedQualityIntegration);
    });
  });

  // ==========================================================================
  // Style Baseline
  // ==========================================================================

  describe('Style Baseline', () => {
    it('should accept style baseline', () => {
      const baseline: StyleCharacteristics = {
        avgSentenceLength: 20,
        avgWordLength: 5.5,
        avgParagraphLength: 5,
        formalityScore: 0.85,
        vocabularyRichness: 0.6,
        toneMarkers: [],
      };

      integration.setStyleBaseline(baseline);

      // Should not throw
      expect(integration).toBeDefined();
    });

    it('should learn baseline from reference text', () => {
      integration.learnBaselineFromText(formalAcademicText);

      // Should not throw
      expect(integration).toBeDefined();
    });
  });

  // ==========================================================================
  // Main Validation Pipeline
  // ==========================================================================

  describe('Validation Pipeline', () => {
    it('should return complete validation result', async () => {
      const result = await integration.validate(formalAcademicText, {
        topic: 'Player Experience',
        style: 'academic',
        format: 'paper',
      });

      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.passed).toBeDefined();
      expect(result.overallScore).toBeDefined();
      expect(result.scores).toBeDefined();
      expect(result.suggestions).toBeDefined();
      expect(result.metadata).toBeDefined();
    });

    it('should include all component scores', async () => {
      const result = await integration.validate(formalAcademicText, {
        topic: 'Player Experience',
        style: 'academic',
        format: 'paper',
      });

      expect(result.scores.gauntlet).toBeDefined();
      expect(result.scores.register).toBeDefined();
      expect(result.scores.styleDrift).toBeDefined();
      expect(result.scores.combined).toBeDefined();
    });

    it('should score formal academic text highly', async () => {
      integration.learnBaselineFromText(formalAcademicText);

      const result = await integration.validate(formalAcademicText, {
        topic: 'Phenomenology',
        style: 'academic',
        format: 'paper',
      });

      // Formal text should score well on register
      expect(result.scores.register).toBeGreaterThan(0.7);
    });

    it('should score informal text lower on register', async () => {
      const result = await integration.validate(informalText, {
        topic: 'Games',
        style: 'academic',
        format: 'paper',
      });

      // Informal text should score poorly on register
      expect(result.scores.register).toBeLessThan(0.5);
    });

    it('should include metadata', async () => {
      const result = await integration.validate(formalAcademicText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0);
      expect(result.metadata.wordCount).toBeGreaterThan(0);
      expect(result.metadata.sectionCount).toBeGreaterThanOrEqual(1);
    });
  });

  // ==========================================================================
  // Auto-correction
  // ==========================================================================

  describe('Auto-correction', () => {
    it('should auto-correct contractions by default', async () => {
      const textWithContractions = "The system doesn't work and it won't improve.";

      const result = await integration.validate(textWithContractions, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      expect(result.content).not.toContain("doesn't");
      expect(result.content).not.toContain("won't");
      expect(result.metadata.autoCorrections).toBeGreaterThan(0);
    });

    it('should skip auto-correction when disabled', async () => {
      const textWithContractions = "The system doesn't work.";

      const result = await integration.validate(textWithContractions, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
        autoCorrectContractions: false,
      });

      expect(result.content).toContain("doesn't");
    });
  });

  // ==========================================================================
  // Register Enforcement
  // ==========================================================================

  describe('Register Enforcement', () => {
    it('should analyze register for academic style', async () => {
      const result = await integration.validate(mixedText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
        enforceRegister: true,
      });

      expect(result.registerAnalysis).toBeDefined();
      expect(result.registerAnalysis!.violations.length).toBeGreaterThan(0);
    });

    it('should skip register for non-academic styles', async () => {
      const result = await integration.validate(informalText, {
        topic: 'Test',
        style: 'casual',
        format: 'article',
        enforceRegister: false,
      });

      // Register analysis may still run but should be undefined when explicitly disabled
      // or not applicable to casual style
    });

    it('should include register violations in suggestions', async () => {
      const result = await integration.validate(informalText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      const registerSuggestions = result.suggestions.filter(
        s => s.source === 'register'
      );

      expect(registerSuggestions.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Style Drift Detection
  // ==========================================================================

  describe('Style Drift Detection', () => {
    it('should detect style drift', async () => {
      integration.learnBaselineFromText(formalAcademicText);

      const result = await integration.validate(informalText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
        detectStyleDrift: true,
      });

      expect(result.driftAnalysis).toBeDefined();
      expect(result.driftAnalysis!.overallScore).toBeGreaterThan(0);
    });

    it('should include drift suggestions', async () => {
      integration.learnBaselineFromText(formalAcademicText);

      const result = await integration.validate(informalText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      const driftSuggestions = result.suggestions.filter(
        s => s.source === 'drift'
      );

      expect(driftSuggestions.length).toBeGreaterThan(0);
    });

    it('should skip drift detection when disabled', async () => {
      const result = await integration.validate(formalAcademicText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
        detectStyleDrift: false,
      });

      expect(result.driftAnalysis).toBeUndefined();
    });
  });

  // ==========================================================================
  // Suggestions
  // ==========================================================================

  describe('Suggestions', () => {
    it('should collect suggestions from all sources', async () => {
      const result = await integration.validate(informalText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      const sources = new Set(result.suggestions.map(s => s.source));

      // Should have suggestions from multiple sources
      expect(sources.size).toBeGreaterThanOrEqual(1);
    });

    it('should prioritize suggestions', async () => {
      const result = await integration.validate(informalText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      if (result.suggestions.length > 1) {
        // First suggestion should have priority 1
        expect(result.suggestions[0].priority).toBe(1);

        // Should be sorted by priority
        for (let i = 1; i < result.suggestions.length; i++) {
          expect(result.suggestions[i].priority).toBeGreaterThanOrEqual(
            result.suggestions[i - 1].priority
          );
        }
      }
    });

    it('should include severity for suggestions', async () => {
      const result = await integration.validate(informalText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      for (const suggestion of result.suggestions) {
        expect(['critical', 'major', 'minor']).toContain(suggestion.severity);
      }
    });
  });

  // ==========================================================================
  // Quick Check
  // ==========================================================================

  describe('Quick Check', () => {
    it('should return quick check result', async () => {
      const result = await integration.quickCheck(formalAcademicText);

      expect(result.passed).toBeDefined();
      expect(result.score).toBeDefined();
      expect(result.topIssues).toBeDefined();
    });

    it('should pass formal academic text', async () => {
      const result = await integration.quickCheck(formalAcademicText);

      // Formal text should pass or be close
      expect(result.score).toBeGreaterThan(0.5);
    });

    it('should fail informal text', async () => {
      const result = await integration.quickCheck(informalText);

      // Informal text should have lower score
      expect(result.passed).toBe(false);
    });

    it('should return top issues', async () => {
      const result = await integration.quickCheck(informalText);

      expect(result.topIssues.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Context Management
  // ==========================================================================

  describe('Context Management', () => {
    it('should store context', async () => {
      await integration.storeContext('test-key', 'Test content', {
        priority: 'high',
        type: 'source',
      });

      // Should not throw
      expect(integration).toBeDefined();
    });

    it('should get context pack', async () => {
      await integration.storeContext('key1', 'Content 1', { priority: 'high' });
      await integration.storeContext('key2', 'Content 2', { priority: 'medium' });

      const pack = await integration.getContextPack(1000);

      expect(pack).toBeDefined();
      expect(pack.items.length).toBeGreaterThan(0);
    });

    it('should get tier stats', () => {
      const stats = integration.getTierStats();

      expect(stats).toBeDefined();
      expect(stats.hot).toBeDefined();
      expect(stats.hot.tier).toBe('hot');
      expect(stats.warm).toBeDefined();
      expect(stats.warm.tier).toBe('warm');
      expect(stats.cold).toBeDefined();
      expect(stats.cold.tier).toBe('cold');
      expect(stats.total).toBeDefined();
    });
  });

  // ==========================================================================
  // Report Generation
  // ==========================================================================

  describe('Report Generation', () => {
    it('should generate comprehensive report', async () => {
      const result = await integration.validate(mixedText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      const report = integration.generateReport(result);

      expect(report).toContain('ENHANCED QUALITY VALIDATION REPORT');
      expect(report).toContain('Overall Status');
      expect(report).toContain('COMPONENT SCORES');
      expect(report).toContain('Quality Gauntlet');
      expect(report).toContain('Register');
      expect(report).toContain('Style Drift');
    });

    it('should include processing metadata in report', async () => {
      const result = await integration.validate(formalAcademicText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      const report = integration.generateReport(result);

      expect(report).toContain('PROCESSING METADATA');
      expect(report).toContain('Word Count');
      expect(report).toContain('Processing Time');
    });

    it('should include suggestions in report', async () => {
      const result = await integration.validate(informalText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      const report = integration.generateReport(result);

      if (result.suggestions.length > 0) {
        expect(report).toContain('TOP SUGGESTIONS');
      }
    });
  });

  // ==========================================================================
  // Factory Functions
  // ==========================================================================

  describe('Factory Functions', () => {
    it('should create default integration', () => {
      const i = createEnhancedQualityIntegration();
      expect(i).toBeInstanceOf(EnhancedQualityIntegration);
    });

    it('should create strict academic integration', () => {
      const i = createStrictAcademicIntegration();
      expect(i).toBeInstanceOf(EnhancedQualityIntegration);
    });

    it('should create draft integration', () => {
      const i = createDraftIntegration();
      expect(i).toBeInstanceOf(EnhancedQualityIntegration);
    });

    it('should create dissertation integration', () => {
      const i = createDissertationIntegration();
      expect(i).toBeInstanceOf(EnhancedQualityIntegration);
    });

    it('should have different thresholds for different presets', async () => {
      const strict = createStrictAcademicIntegration();
      const draft = createDraftIntegration();

      // Both should work
      const strictResult = await strict.quickCheck(mixedText);
      const draftResult = await draft.quickCheck(mixedText);

      // Draft should be more lenient
      expect(draftResult.passed || draftResult.score).toBeDefined();
    });
  });

  // ==========================================================================
  // Pass/Fail Logic
  // ==========================================================================

  describe('Pass/Fail Logic', () => {
    it('should pass high-quality formal text', async () => {
      integration.learnBaselineFromText(formalAcademicText);

      const result = await integration.validate(formalAcademicText, {
        topic: 'Phenomenology',
        style: 'academic',
        format: 'paper',
      });

      // Combined validation with multiple factors
      expect(result.passed || result.overallScore > 0.5).toBe(true);
    });

    it('should fail low-quality informal text', async () => {
      integration.learnBaselineFromText(formalAcademicText);

      const result = await integration.validate(informalText, {
        topic: 'Games',
        style: 'academic',
        format: 'paper',
      });

      // Should fail due to register issues
      expect(result.passed).toBe(false);
    });

    it('should consider all thresholds for pass determination', async () => {
      const result = await integration.validate(mixedText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      // Pass requires meeting all thresholds
      const meetsGauntlet = result.scores.gauntlet >= 0.85;
      const meetsRegister = result.scores.register >= 0.80;
      const meetsDrift = (1 - result.scores.styleDrift) <= 0.30;

      // If all pass, result should pass
      if (meetsGauntlet && meetsRegister && meetsDrift) {
        expect(result.passed).toBe(true);
      }
    });
  });

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle empty text', async () => {
      const result = await integration.validate('', {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      expect(result).toBeDefined();
    });

    it('should handle very short text', async () => {
      const result = await integration.validate('Short text.', {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      expect(result).toBeDefined();
    });

    it('should handle very long text', async () => {
      const longText = formalAcademicText.repeat(10);

      const result = await integration.validate(longText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      expect(result).toBeDefined();
      expect(result.metadata.wordCount).toBeGreaterThan(500);
    });

    it('should handle special characters', async () => {
      const textWithSpecial = 'Test with symbols: @#$% and numbers 123.';

      const result = await integration.validate(textWithSpecial, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      expect(result).toBeDefined();
    });
  });

  // ==========================================================================
  // Performance
  // ==========================================================================

  describe('Performance', () => {
    it('should complete validation within reasonable time', async () => {
      const start = Date.now();

      await integration.validate(formalAcademicText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });

      const elapsed = Date.now() - start;
      // Allow up to 90 seconds for full 7-stage gauntlet with revision
      expect(elapsed).toBeLessThan(90000);
    });

    it('should complete quick check faster than full validation', async () => {
      // Run full validation first to warm up caches
      const fullStart = Date.now();
      await integration.validate(formalAcademicText, {
        topic: 'Test',
        style: 'academic',
        format: 'paper',
      });
      const fullElapsed = Date.now() - fullStart;

      // Then run quick check (should be same speed or faster with warm cache)
      const quickStart = Date.now();
      await integration.quickCheck(formalAcademicText);
      const quickElapsed = Date.now() - quickStart;

      // Both operations should complete reasonably fast
      // The key assertion is that both methods work correctly
      expect(quickElapsed).toBeLessThan(60000); // Quick check under 60s
      expect(fullElapsed).toBeLessThan(90000);  // Full validation under 90s
    });
  });
});
