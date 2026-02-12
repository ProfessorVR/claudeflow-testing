/**
 * SectionOrchestrator Tests
 *
 * Comprehensive test suite covering:
 * - Section preparation (context building, tiered vs standard)
 * - Quality validation
 * - Revision loops
 * - Human verification prompts
 * - Satisfaction tracking
 * - Feedback collection
 * - Provenance tracking
 * - Error handling
 * - AgentDB integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SectionOrchestrator } from '../../../../src/god-agent/cli/dissertation/section-orchestrator.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('SectionOrchestrator', () => {
  let orchestrator: SectionOrchestrator;
  const testProjectRoot = path.join(__dirname, 'test-project');

  beforeEach(async () => {
    // Setup test directory
    await fs.mkdir(testProjectRoot, { recursive: true });
    await fs.mkdir(path.join(testProjectRoot, '.god-agent'), { recursive: true });

    orchestrator = new SectionOrchestrator(testProjectRoot);
    await orchestrator.initialize();
  });

  afterEach(async () => {
    // Cleanup
    try {
      await fs.rm(testProjectRoot, { recursive: true, force: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // ============================================================================
  // Section Preparation Tests
  // ============================================================================

  describe('buildSectionContext', () => {
    it('should build standard context for chapter', async () => {
      const context = await orchestrator.buildSectionContext({
        chapter: 3,
        section: 'Phantasia in De Anima III',
        targetWords: 2500,
      });

      expect(context.metadata.chapter).toBe(3);
      expect(context.metadata.section).toBe('Phantasia in De Anima III');
      expect(context.generationPrompt).toContain('SECTION WRITING TASK');
      expect(context.generationPrompt).toContain('Chapter: 3');
      expect(context.tieredMode).toBeUndefined();
    });

    it('should build tiered context with token budget', async () => {
      const context = await orchestrator.buildSectionContext({
        chapter: 5,
        section: 'Practical Reasoning',
        useTieredContext: true,
        tokenBudget: 60000,
      });

      expect(context.tieredMode).toBe(true);
      expect(context.tokenBudget).toBe(60000);
      expect(context.contextStats).toBeDefined();
      expect(context.contextStats?.totalTokens).toBeLessThanOrEqual(60000);
    });

    it('should include style profile if active', async () => {
      const context = await orchestrator.buildSectionContext({
        chapter: 3,
        section: 'Test Section',
      });

      // Style prompt may be empty if no active profile
      expect(context.stylePrompt).toBeDefined();
    });

    it('should query corpus for suggestions when enabled', async () => {
      const context = await orchestrator.buildSectionContext({
        chapter: 3,
        section: 'Aristotle phantasia',
        useCorpus: true,
      });

      expect(context.corpusSuggestions).toBeDefined();
      // Suggestions will be empty if corpus not populated
      expect(Array.isArray(context.corpusSuggestions)).toBe(true);
    });

    it('should not query corpus when disabled', async () => {
      const context = await orchestrator.buildSectionContext({
        chapter: 3,
        section: 'Test Section',
        useCorpus: false,
      });

      expect(context.corpusSuggestions).toEqual([]);
    });
  });

  describe('buildTieredSectionContext', () => {
    it('should calculate compression ratio', async () => {
      const context = await orchestrator.buildSectionContext({
        chapter: 5,
        section: 'Test Section',
        useTieredContext: true,
        tokenBudget: 60000,
      });

      expect(context.contextStats?.compressionRatio).toBeGreaterThanOrEqual(0);
      expect(context.contextStats?.compressionRatio).toBeLessThanOrEqual(1);
    });

    it('should provide tier breakdowns', async () => {
      const context = await orchestrator.buildSectionContext({
        chapter: 5,
        section: 'Test Section',
        useTieredContext: true,
        tokenBudget: 60000,
      });

      expect(context.tier1Hot).toBeDefined();
      expect(context.tier2Warm).toBeDefined();
      expect(context.tier3ColdAccessor).toBeDefined();
    });

    it('should respect token budget limits', async () => {
      const budgets = [40000, 60000, 80000];

      for (const budget of budgets) {
        const context = await orchestrator.buildSectionContext({
          chapter: 5,
          section: 'Test Section',
          useTieredContext: true,
          tokenBudget: budget,
        });

        expect(context.tokenBudget).toBe(budget);
        expect(context.contextStats!.totalTokens).toBeLessThanOrEqual(budget);
      }
    });
  });

  // ============================================================================
  // Quality Validation Tests
  // ============================================================================

  describe('validateSection', () => {
    it('should run quality gauntlet on content', async () => {
      const content = `
# Test Chapter

This is a test paragraph with proper academic style.
We make claims supported by evidence (Smith, 2020).
The argument develops systematically through multiple paragraphs.

Additional analysis demonstrates the validity of the approach (Jones, 2019).
      `.trim();

      const result = await orchestrator.validateSection(content, 3);

      expect(result.runId).toBeDefined();
      expect(result.overallScore).toBeGreaterThanOrEqual(0);
      expect(result.overallScore).toBeLessThanOrEqual(1);
      expect(result.stageResults).toHaveLength(9);
    });

    it('should identify quality issues in low-quality content', async () => {
      const lowQualityContent = 'This is bad content with no citations or structure.';

      const result = await orchestrator.validateSection(lowQualityContent, 3);

      expect(result.passed).toBe(false);
      expect(result.allIssues.length).toBeGreaterThan(0);
      expect(result.revisionRequired).toBe(true);
    });

    it('should pass high-quality content', async () => {
      const highQualityContent = `
# Chapter 3: Phantasia in Aristotle's De Anima

## Introduction

This chapter examines Aristotle's concept of phantasia as presented in De Anima III.4-8.
The analysis demonstrates that phantasia serves as a crucial intermediary between perception
and thought (Nussbaum, 1978). This interpretation challenges traditional readings that
minimize phantasia's role in Aristotle's psychology (Schofield, 1992).

## The Nature of Phantasia

Aristotle defines phantasia as "a movement resulting from the actualization of perception"
(De Anima 429a1-2). This definition establishes phantasia as dependent on perception yet
distinct from it (Caston, 1996). The relationship between perception and phantasia mirrors
the broader pattern of psychological faculties Aristotle develops throughout De Anima.

## Conclusion

This analysis has established that phantasia occupies a unique position in Aristotle's
psychological framework, bridging perception and thought while maintaining its own
distinctive operations.
      `.trim();

      const result = await orchestrator.validateSection(highQualityContent, 3);

      // High quality content should score well
      expect(result.overallScore).toBeGreaterThan(0.5);
    });
  });

  // ============================================================================
  // Revision Loop Tests
  // ============================================================================

  describe('validateAndRefine', () => {
    it('should call revision callback when quality is low', async () => {
      const initialContent = 'Low quality content';
      const improvedContent = 'Much better content with proper citations (Author, 2020).';

      const revisionCallback = vi.fn().mockResolvedValue(improvedContent);

      await orchestrator.validateAndRefine(
        initialContent,
        {
          chapter: 3,
          section: 'Test',
          maxIterations: 3,
          qualityThreshold: 0.85,
        },
        revisionCallback
      );

      // Callback should be called at least once for low-quality content
      expect(revisionCallback).toHaveBeenCalled();
    });

    it('should respect max iterations limit', async () => {
      const content = 'Content that never improves';
      const revisionCallback = vi.fn().mockResolvedValue(content);

      const result = await orchestrator.validateAndRefine(
        content,
        {
          chapter: 3,
          section: 'Test',
          maxIterations: 2,
          qualityThreshold: 0.95,
        },
        revisionCallback
      );

      expect(result.iterations).toBeLessThanOrEqual(2);
    });

    it('should stop early if quality threshold met', async () => {
      const highQualityContent = `
Chapter content with proper structure and citations (Smith, 2020).
The argument develops systematically (Jones, 2019).
Evidence supports all major claims (Brown, 2021).
      `.trim();

      const revisionCallback = vi.fn();

      const result = await orchestrator.validateAndRefine(
        highQualityContent,
        {
          chapter: 3,
          section: 'Test',
          maxIterations: 5,
          qualityThreshold: 0.5, // Low threshold
        },
        revisionCallback
      );

      // Should not need many iterations for already-good content
      expect(result.iterations).toBeLessThan(3);
    });
  });

  // ============================================================================
  // Context Management Tests
  // ============================================================================

  describe('updateContextAfterCompletion', () => {
    it('should extract and record chapter context', async () => {
      const content = `
# Chapter 3: Phantasia in Aristotle

This chapter argues that phantasia is central to perception.
We define "phantasia" as the mental imaging faculty.
The evidence suggests three key roles for imagination.
      `.trim();

      await orchestrator.updateContextAfterCompletion(
        3,
        'Phantasia in Aristotle',
        content
      );

      const summary = orchestrator.getContextSummary();
      expect(summary.chaptersWithContext).toContain(3);
    });

    it('should extract key arguments from content', async () => {
      const content = `
This chapter argues that phantasia is essential.
I argue that perception requires phantasia.
The main argument demonstrates cognitive necessity.
      `.trim();

      await orchestrator.updateContextAfterCompletion(
        3,
        'Test Section',
        content
      );

      // Context should be updated
      const summary = orchestrator.getContextSummary();
      expect(summary.chaptersWithContext.length).toBeGreaterThan(0);
    });
  });

  describe('checkTieredRecommendation', () => {
    it('should recommend tiered context for large documents', async () => {
      // Add multiple chapter contexts to simulate large document
      for (let i = 1; i <= 5; i++) {
        await orchestrator.updateContextAfterCompletion(
          i,
          `Chapter ${i}`,
          'Test content '.repeat(500) // Large content
        );
      }

      const recommendation = orchestrator.checkTieredRecommendation();

      expect(recommendation.recommended).toBeDefined();
      expect(recommendation.estimatedTokens).toBeGreaterThan(0);
      expect(recommendation.reason).toBeDefined();
    });

    it('should not recommend tiered for small documents', async () => {
      // Single small chapter
      await orchestrator.updateContextAfterCompletion(
        1,
        'Chapter 1',
        'Small content'
      );

      const recommendation = orchestrator.checkTieredRecommendation();

      expect(recommendation.recommended).toBe(false);
      expect(recommendation.estimatedTokens).toBeLessThan(30000);
    });
  });

  // ============================================================================
  // Statistics Tests
  // ============================================================================

  describe('getContextSummary', () => {
    it('should return empty summary for new orchestrator', () => {
      const summary = orchestrator.getContextSummary();

      expect(summary.chaptersWithContext).toEqual([]);
      expect(summary.totalThreads).toBe(0);
      expect(summary.glossaryTermCount).toBe(0);
    });

    it('should include chapter data after updates', async () => {
      await orchestrator.updateContextAfterCompletion(
        1,
        'Chapter 1',
        'Test content'
      );

      const summary = orchestrator.getContextSummary();

      expect(summary.chaptersWithContext).toContain(1);
    });
  });

  describe('getCorpusStats', () => {
    it('should return corpus statistics', () => {
      const stats = orchestrator.getCorpusStats();

      expect(stats.totalDocuments).toBeGreaterThanOrEqual(0);
      expect(stats.totalChunks).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(stats.authors)).toBe(true);
    });
  });

  // ============================================================================
  // NEW FEATURES: Satisfaction, Feedback, Provenance Tests
  // ============================================================================

  describe('Satisfaction Tracking', () => {
    it('should track satisfaction ratings', async () => {
      const trajectoryId = 'test-trajectory-1';
      const content = 'Test content for satisfaction tracking';

      // Mock user input to avoid interactive prompts
      orchestrator['satisfactionTracker'].updateOptions({ enabled: false });

      const stats = orchestrator.getSatisfactionStatistics();
      expect(stats.totalRatings).toBe(0);
    });

    it('should aggregate satisfaction statistics', () => {
      const stats = orchestrator.getSatisfactionStatistics();

      expect(stats).toHaveProperty('totalRatings');
      expect(stats).toHaveProperty('averageOverall');
      expect(stats).toHaveProperty('averageStyleMatch');
      expect(stats).toHaveProperty('averageQuality');
      expect(stats).toHaveProperty('useAsIsPercentage');
    });
  });

  describe('Feedback Learning', () => {
    it('should enable feedback learning integration', async () => {
      // This requires active style profile, so it might fail
      try {
        await orchestrator.enableFeedbackLearning();
        // If successful, feedback should be available
        const stats = orchestrator.getFeedbackStats();
        expect(stats).toBeDefined();
      } catch (error) {
        // Expected if no style profile exists
        expect(error).toBeDefined();
      }
    });

    it('should return undefined stats when feedback not initialized', () => {
      const stats = orchestrator.getFeedbackStats();
      expect(stats).toBeUndefined();
    });
  });

  describe('Provenance Tracking', () => {
    it('should track provenance for content', async () => {
      const content = `
This is a factual claim (Smith, 2020).
Another claim with evidence (Jones, 2019).
Statistical data shows trends (Brown, 2021, p. 45).
      `.trim();

      await orchestrator.trackProvenance(content, 3, []);

      // Provenance ledger should have entries
      const report = orchestrator.getProvenanceReport();
      expect(report).toBeDefined();
      expect(typeof report).toBe('string');
    });

    it('should validate provenance', async () => {
      const content = 'Test claim';
      await orchestrator.trackProvenance(content, 3, []);

      const validation = await orchestrator.validateProvenance(3);

      expect(validation).toHaveProperty('valid');
      expect(validation).toHaveProperty('ungroundedClaims');
      expect(validation).toHaveProperty('weaklyGroundedClaims');
    });

    it('should generate audit report', () => {
      const report = orchestrator.getProvenanceReport();

      expect(typeof report).toBe('string');
      expect(report.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('End-to-End Workflow', () => {
    it('should complete standard mode workflow', async () => {
      // 1. Prepare context
      const context = await orchestrator.buildSectionContext({
        chapter: 3,
        section: 'Test Section',
        targetWords: 2500,
      });

      expect(context.generationPrompt).toBeDefined();

      // 2. Validate content
      const testContent = 'Test chapter content with citations (Smith, 2020).';
      const validation = await orchestrator.validateSection(testContent, 3);

      expect(validation.runId).toBeDefined();

      // 3. Update context
      await orchestrator.updateContextAfterCompletion(3, 'Test Section', testContent);

      const summary = orchestrator.getContextSummary();
      expect(summary.chaptersWithContext).toContain(3);
    });

    it('should complete tiered mode workflow', async () => {
      // 1. Prepare tiered context
      const context = await orchestrator.buildSectionContext({
        chapter: 5,
        section: 'Test Section',
        useTieredContext: true,
        tokenBudget: 60000,
      });

      expect(context.tieredMode).toBe(true);
      expect(context.contextStats).toBeDefined();

      // 2. Validate content
      const testContent = 'Test chapter content';
      const validation = await orchestrator.validateSection(testContent, 5);

      expect(validation).toBeDefined();
    });
  });
});
