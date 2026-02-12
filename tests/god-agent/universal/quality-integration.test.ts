/**
 * Quality Integration Tests
 *
 * Tests for the quality gauntlet integration in universal agent's god-write
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  QualityIntegration,
  createQualityIntegration,
  type QualityValidationOptions,
  type QualityValidationResult,
} from '../../../src/god-agent/universal/quality-integration.js';
import type { UniversalAgent } from '../../../src/god-agent/universal/universal-agent.js';

describe('QualityIntegration', () => {
  let mockAgent: Partial<UniversalAgent>;
  let qualityIntegration: QualityIntegration;

  beforeEach(() => {
    // Create mock universal agent
    mockAgent = {
      log: vi.fn(),
    } as any;

    qualityIntegration = new QualityIntegration(mockAgent as UniversalAgent);
  });

  describe('validateAndRevise', () => {
    it('should return bypassed result when validation is disabled', async () => {
      const content = 'Test content';
      const options: QualityValidationOptions = {
        topic: 'Test topic',
        style: 'academic',
        format: 'essay',
        enabled: false,
      };

      const result = await qualityIntegration.validateAndRevise(content, options);

      expect(result.content).toBe(content);
      expect(result.passed).toBe(true);
      expect(result.qualityScore).toBe(1.0);
      expect(result.revisionIterations).toBe(0);
      expect(result.wasRevised).toBe(false);
    });

    it('should handle quality gauntlet errors gracefully', async () => {
      // Mock agent with failing quality gauntlet
      const content = 'Test content that will fail validation';
      const options: QualityValidationOptions = {
        topic: 'Test topic',
        style: 'academic',
        format: 'essay',
        enabled: true,
      };

      // The quality gauntlet will likely fail on this trivial content
      // But it should return the original content gracefully
      const result = await qualityIntegration.validateAndRevise(content, options);

      expect(result.content).toBeDefined();
      expect(result.qualityScore).toBeGreaterThanOrEqual(0);
      expect(result.qualityScore).toBeLessThanOrEqual(1);
    });
  });

  describe('evaluateQuality', () => {
    it('should evaluate content quality without revision', async () => {
      const content = `
# Academic Essay on Machine Learning

Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed. This revolutionary approach has transformed various industries and continues to shape the future of technology.

## Core Concepts

Machine learning algorithms build mathematical models based on sample data, known as training data, to make predictions or decisions. The fundamental principle involves pattern recognition and computational learning theory.

## Applications

The applications of machine learning span multiple domains including healthcare, finance, and autonomous systems. These implementations demonstrate the versatility and power of adaptive algorithms.

## Conclusion

As machine learning continues to evolve, its impact on society becomes increasingly significant, warranting careful consideration of both its benefits and ethical implications.
      `.trim();

      const metrics = await qualityIntegration.evaluateQuality(content);

      expect(metrics).toBeDefined();
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(metrics.overallScore).toBeLessThanOrEqual(1);
      expect(metrics.stageScores).toBeDefined();
      expect(metrics.stageScores.argumentCoherence).toBeGreaterThanOrEqual(0);
      expect(metrics.issueCounts).toBeDefined();
    });
  });

  describe('createQualityIntegration', () => {
    it('should create quality integration instance', () => {
      const integration = createQualityIntegration(mockAgent as UniversalAgent);
      expect(integration).toBeInstanceOf(QualityIntegration);
    });
  });

  describe('Quality Metrics', () => {
    it('should include all expected metric fields', async () => {
      const content = 'Test content';
      const options: QualityValidationOptions = {
        topic: 'Test',
        style: 'academic',
        format: 'essay',
        enabled: false, // Bypass to check default metrics
      };

      const result = await qualityIntegration.validateAndRevise(content, options);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.overallScore).toBeDefined();
      expect(result.metrics.stageScores).toBeDefined();
      expect(result.metrics.stageScores.argumentCoherence).toBeDefined();
      expect(result.metrics.stageScores.citationCompleteness).toBeDefined();
      expect(result.metrics.stageScores.styleConsistency).toBeDefined();
      expect(result.metrics.stageScores.factualAccuracy).toBeDefined();
      expect(result.metrics.issueCounts).toBeDefined();
      expect(result.metrics.issueCounts.critical).toBeDefined();
      expect(result.metrics.issueCounts.major).toBeDefined();
      expect(result.metrics.issueCounts.minor).toBeDefined();
    });
  });

  describe('Default Configuration', () => {
    it('should use 0.85 as default quality threshold', () => {
      expect(QualityIntegration.DEFAULT_THRESHOLD).toBe(0.85);
    });

    it('should use 3 as default max revisions', () => {
      expect(QualityIntegration.DEFAULT_MAX_REVISIONS).toBe(3);
    });
  });

  describe('Custom Configuration', () => {
    it('should accept custom quality threshold', async () => {
      const content = 'Test content';
      const options: QualityValidationOptions = {
        topic: 'Test',
        style: 'academic',
        format: 'essay',
        qualityThreshold: 0.95, // Higher than default
        enabled: true,
      };

      // Should not throw
      await expect(
        qualityIntegration.validateAndRevise(content, options)
      ).resolves.toBeDefined();
    });

    it('should accept custom max revisions', async () => {
      const content = 'Test content';
      const options: QualityValidationOptions = {
        topic: 'Test',
        style: 'academic',
        format: 'essay',
        maxRevisions: 5, // More than default
        enabled: true,
      };

      // Should not throw
      await expect(
        qualityIntegration.validateAndRevise(content, options)
      ).resolves.toBeDefined();
    });
  });
});
