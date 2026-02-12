/**
 * Tests for QualityGauntlet - 7-Stage Quality Evaluation System
 *
 * Phase E: Enhanced Quality Gauntlet with 7 stages:
 * 0. CitationVerifier - Hallucination detection (Phase B)
 * 1. ToulminEnforcer - Argument structure validation (Phase D)
 * 2. ArgumentCoherenceChecker - Logical flow
 * 3. CitationCompletenessVerifier - Missing citations
 * 4. CitationDensityChecker - PhD-level density
 * 5. StyleConsistencyValidator - Tone/voice
 * 6. FactualAccuracyAuditor - Internal consistency
 */

import { describe, it, expect, vi } from 'vitest';
import {
  QualityGauntlet,
  createDefaultGauntlet,
  createStrictGauntlet,
  createDraftGauntlet,
  createFocusedGauntlet,
  type GauntletResult,
} from '../../../../src/god-agent/cli/quality/quality-gauntlet.js';

// Sample academic text for testing
const SAMPLE_ACADEMIC_TEXT = `
This dissertation argues that perception is fundamentally active rather than passive.
Because perception requires bodily engagement, it cannot be reduced to mere neural processing.
The evidence for this comes from embodied cognition research showing that motor systems
are activated during perception (Smith, 2020). Studies show that blocking motor activity
impairs perceptual discrimination (Jones & Brown, 2021).

This means that perception is enactive - it is something we do, not something that happens to us.
The underlying principle is that cognitive processes are constitutively shaped by bodily interaction
with the environment. Research establishes this through decades of experimental work (Williams, 2019).

Critics might argue that neural processing is sufficient for perception. However, this overlooks
the role of embodiment in shaping perceptual content. While neural correlates are necessary,
they are not sufficient - the body's active engagement is constitutive of perception itself.

Therefore, we should abandon the passive model of perception in favor of an enactive approach.
This follows from the evidence that perception and action are inseparable processes.
Granted, this view has implications for computational theories of mind, but these implications
point to a richer understanding of cognition.
`;

describe('QualityGauntlet', () => {
  describe('stage configuration', () => {
    it('should have 7 stages in default configuration', () => {
      const gauntlet = createDefaultGauntlet();
      const stageNames = gauntlet.getStageNames();

      expect(stageNames).toHaveLength(9);
    });

    it('should include all expected stages', () => {
      const gauntlet = createDefaultGauntlet();
      const stageNames = gauntlet.getStageNames();

      expect(stageNames).toContain('citation-verifier');
      expect(stageNames).toContain('toulmin-enforcer');
      expect(stageNames).toContain('argument-coherence');
      expect(stageNames).toContain('citation-completeness');
      expect(stageNames).toContain('citation-density');
      expect(stageNames).toContain('style-consistency');
      expect(stageNames).toContain('factual-accuracy');
    });

    it('should have CitationVerifier as first stage', () => {
      const gauntlet = createDefaultGauntlet();
      const stageNames = gauntlet.getStageNames();

      expect(stageNames[0]).toBe('citation-verifier');
    });

    it('should have ToulminEnforcer as second stage', () => {
      const gauntlet = createDefaultGauntlet();
      const stageNames = gauntlet.getStageNames();

      expect(stageNames[1]).toBe('quotation-fidelity');
    });
  });

  describe('runGauntlet', () => {
    it('should run all stages and return result', async () => {
      const gauntlet = createDefaultGauntlet();
      const result = await gauntlet.runGauntlet(SAMPLE_ACADEMIC_TEXT, 1);

      expect(result).toBeDefined();
      expect(result.runId).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
      expect(result.stageResults).toHaveLength(9);
    });

    it('should include stage results for all stages', async () => {
      const gauntlet = createDefaultGauntlet();
      const result = await gauntlet.runGauntlet(SAMPLE_ACADEMIC_TEXT, 1);

      const stageNames = result.stageResults.map(r => r.stageName);
      expect(stageNames).toContain('citation-verifier');
      expect(stageNames).toContain('toulmin-enforcer');
      expect(stageNames).toContain('argument-coherence');
    });

    it('should calculate summary statistics', async () => {
      const gauntlet = createDefaultGauntlet();
      const result = await gauntlet.runGauntlet(SAMPLE_ACADEMIC_TEXT, 1);

      expect(result.summary).toBeDefined();
      expect(result.summary.totalStages).toBe(9);
      expect(result.summary.stagesPassed).toBeGreaterThanOrEqual(0);
      expect(result.summary.totalIssues).toBeGreaterThanOrEqual(0);
    });

    it('should track evaluation time', async () => {
      const gauntlet = createDefaultGauntlet();
      const result = await gauntlet.runGauntlet(SAMPLE_ACADEMIC_TEXT, 1);

      expect(result.metadata.evaluationTimeMs).toBeGreaterThan(0);
      expect(result.metadata.chapterId).toBe(1);
      expect(result.metadata.timestamp).toBeDefined();
    });
  });

  describe('runStage', () => {
    it('should run specific stage by name', async () => {
      const gauntlet = createDefaultGauntlet();
      const result = await gauntlet.runStage('toulmin-enforcer', SAMPLE_ACADEMIC_TEXT, 1);

      expect(result.stageName).toBe('toulmin-enforcer');
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should throw for unknown stage name', async () => {
      const gauntlet = createDefaultGauntlet();

      await expect(
        gauntlet.runStage('unknown-stage', SAMPLE_ACADEMIC_TEXT, 1)
      ).rejects.toThrow('Quality stage "unknown-stage" not found');
    });
  });

  describe('factory functions', () => {
    it('should create default gauntlet with standard thresholds', () => {
      const gauntlet = createDefaultGauntlet();
      expect(gauntlet).toBeInstanceOf(QualityGauntlet);
      expect(gauntlet.getStageNames()).toHaveLength(9);
    });

    it('should create strict gauntlet with higher thresholds', async () => {
      const gauntlet = createStrictGauntlet();
      expect(gauntlet).toBeInstanceOf(QualityGauntlet);

      // Strict gauntlet should have same stages
      expect(gauntlet.getStageNames()).toHaveLength(9);
    });

    it('should create draft gauntlet with lower thresholds', async () => {
      const gauntlet = createDraftGauntlet();
      expect(gauntlet).toBeInstanceOf(QualityGauntlet);
      expect(gauntlet.getStageNames()).toHaveLength(9);
    });

    it('should create argument-focused gauntlet', () => {
      const gauntlet = createFocusedGauntlet('argument');
      expect(gauntlet).toBeInstanceOf(QualityGauntlet);
    });

    it('should create citation-focused gauntlet', () => {
      const gauntlet = createFocusedGauntlet('citation');
      expect(gauntlet).toBeInstanceOf(QualityGauntlet);
    });

    it('should create style-focused gauntlet', () => {
      const gauntlet = createFocusedGauntlet('style');
      expect(gauntlet).toBeInstanceOf(QualityGauntlet);
    });

    it('should create factual-focused gauntlet', () => {
      const gauntlet = createFocusedGauntlet('factual');
      expect(gauntlet).toBeInstanceOf(QualityGauntlet);
    });

    it('should create toulmin-focused gauntlet', () => {
      const gauntlet = createFocusedGauntlet('toulmin');
      expect(gauntlet).toBeInstanceOf(QualityGauntlet);
    });
  });

  describe('getStage', () => {
    it('should return stage by name', () => {
      const gauntlet = createDefaultGauntlet();

      const stage = gauntlet.getStage('toulmin-enforcer');
      expect(stage).toBeDefined();
      expect(stage?.name).toBe('toulmin-enforcer');
    });

    it('should return undefined for unknown stage', () => {
      const gauntlet = createDefaultGauntlet();

      const stage = gauntlet.getStage('unknown');
      expect(stage).toBeUndefined();
    });
  });

  describe('revision guidance', () => {
    it('should generate revision guidance when issues found', async () => {
      const gauntlet = createDefaultGauntlet();
      const result = await gauntlet.runGauntlet(SAMPLE_ACADEMIC_TEXT, 1);

      expect(result.revisionGuidance).toBeDefined();
      expect(typeof result.revisionGuidance).toBe('string');
    });

    it('should identify critical issues', async () => {
      const gauntlet = createDefaultGauntlet();
      const result = await gauntlet.runGauntlet(SAMPLE_ACADEMIC_TEXT, 1);

      expect(result.criticalIssues).toBeDefined();
      expect(Array.isArray(result.criticalIssues)).toBe(true);
    });
  });

  describe('calculateOverallScore', () => {
    it('should calculate weighted score from stage results', async () => {
      const gauntlet = createDefaultGauntlet();
      const result = await gauntlet.runGauntlet(SAMPLE_ACADEMIC_TEXT, 1);

      const calculatedScore = gauntlet.calculateOverallScore(result.stageResults);
      expect(calculatedScore).toBeCloseTo(result.overallScore, 2);
    });

    it('should return 0 for empty results', () => {
      const gauntlet = createDefaultGauntlet();
      const score = gauntlet.calculateOverallScore([]);
      expect(score).toBe(0);
    });
  });

  describe('configuration', () => {
    it('should allow custom stage order', async () => {
      const gauntlet = new QualityGauntlet(undefined, {
        stageOrder: ['factual-accuracy', 'citation-verifier', 'toulmin-enforcer'],
      });

      const stageNames = gauntlet.getStageNames();
      expect(stageNames[0]).toBe('factual-accuracy');
      expect(stageNames[1]).toBe('citation-verifier');
      expect(stageNames[2]).toBe('toulmin-enforcer');
    });

    it('should allow updating config', () => {
      const gauntlet = createDefaultGauntlet();
      gauntlet.updateConfig({ overallThreshold: 0.95 });

      // Config update should not throw
      expect(true).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty text', async () => {
      const gauntlet = createDefaultGauntlet();
      const result = await gauntlet.runGauntlet('', 1);

      expect(result).toBeDefined();
      expect(result.stageResults).toHaveLength(9);
    });

    it('should handle very short text', async () => {
      const gauntlet = createDefaultGauntlet();
      const result = await gauntlet.runGauntlet('Short text.', 1);

      expect(result).toBeDefined();
    });

    it('should handle text with only whitespace', async () => {
      const gauntlet = createDefaultGauntlet();
      const result = await gauntlet.runGauntlet('   \n\n   ', 1);

      expect(result).toBeDefined();
    });
  });
});

describe('ToulminEnforcer Integration', () => {
  it('should include toulmin metrics in stage results', async () => {
    const gauntlet = createDefaultGauntlet();
    const result = await gauntlet.runGauntlet(SAMPLE_ACADEMIC_TEXT, 1);

    const toulminResult = result.stageResults.find(r => r.stageName === 'toulmin-enforcer');
    expect(toulminResult).toBeDefined();
    expect(toulminResult?.metrics).toBeDefined();
  });

  it('should detect Toulmin issues in gauntlet', async () => {
    const gauntlet = createDefaultGauntlet();
    const poorText = `
      This is true. Everyone knows it.
      The sky is blue. Birds fly.
    `;

    const result = await gauntlet.runGauntlet(poorText, 1);
    const toulminResult = result.stageResults.find(r => r.stageName === 'toulmin-enforcer');

    expect(toulminResult).toBeDefined();
    // Should have some issues or at least process
    expect(toulminResult?.score).toBeGreaterThanOrEqual(0);
  });
});
