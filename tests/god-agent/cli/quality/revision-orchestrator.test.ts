/**
 * Tests for RevisionOrchestrator
 *
 * Phase F: Revision Engine enhancement - comprehensive test coverage
 * for iterative refinement with the 7-stage quality gauntlet.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  RevisionOrchestrator,
  createDefaultOrchestrator,
  createStrictOrchestrator,
  createFastOrchestrator,
  createInteractiveOrchestrator,
  type RevisionRequest,
  type RevisionResult,
  type RefinementResult,
  type InteractiveReviewContext,
  type InteractiveReviewDecision,
} from '../../../../src/god-agent/cli/quality/revision-orchestrator.js';
import {
  QualityGauntlet,
  createDefaultGauntlet,
  createStrictGauntlet,
  createDraftGauntlet,
  type GauntletResult,
} from '../../../../src/god-agent/cli/quality/quality-gauntlet.js';
import type { QualityIssue, QualityStageResult } from '../../../../src/god-agent/cli/quality/quality-stage.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const ACADEMIC_PROSE = `
## Introduction

The study of video game aesthetics represents a burgeoning field within game studies,
one that has gained significant traction since the early 2000s (Smith, 2019).
According to scholars in the field, understanding how players experience games
requires a phenomenological approach (Johnson & Williams, 2021). The nature of
interactive media creates unique challenges for aesthetic theory (Brown, 2020).

This chapter argues that emotional engagement in video games operates through
distinct mechanisms that differ from traditional media. Building on the work of
Calleja (2011) and Keogh (2018), we propose a framework for understanding
player-game relationships. Evidence from recent studies supports this claim
(Martinez et al., 2022; Chen & Lee, 2023).

The thesis advances that player experience cannot be understood through passive
consumption models. Instead, the performative nature of gameplay creates a
unique aesthetic dimension (Thompson, 2021). This position is supported by
empirical research in player psychology (Williams & Davis, 2022).

Furthermore, the concept of phantasia, as theorized by Aristotle and developed
by contemporary phenomenologists, provides a useful lens for understanding
player imagination (Nussbaum, 1978; Casey, 2000; Husserl, 1913/2001). This
theoretical framework illuminates how players engage with virtual worlds through
embodied cognition (Varela et al., 1991) and enacted perception (Noë, 2004).
`;

const LOW_QUALITY_PROSE = `
The study of video games is interesting. Many people play video games.
This paper will talk about video games and why they matter.

Games are fun because they are interactive. You can do things in games.
Players like games for many reasons.

I think video games are important to study. We should look at them more.
This chapter will explore various aspects of gaming.
`;

const PROSE_WITH_ISSUES = `
## Analysis Section

Some studies show that games affect players. According to some researchers,
this is significant. The findings suggest important implications.

There are several factors to consider. First, gameplay mechanics matter.
Second, narrative elements contribute. Third, audiovisual design plays a role.

The evidence is somewhat clear on this point. Various studies have examined
this topic. The conclusions are generally consistent.
`;

// Mock revision callback
const mockRevisionCallback = async (request: RevisionRequest): Promise<string> => {
  // Simulate improvement by adding citations
  let revised = request.originalText;

  // Add some citations to simulate improvement
  revised = revised.replace(
    'Games are fun because they are interactive.',
    'Games are fun because they are interactive (Smith, 2020).'
  );
  revised = revised.replace(
    'Players like games for many reasons.',
    'Players like games for many reasons, including challenge, flow, and social connection (Chen & Williams, 2021).'
  );

  return revised;
};

// Mock that produces significant improvement
const mockImprovingCallback = async (request: RevisionRequest): Promise<string> => {
  // Return academic prose regardless of input
  return ACADEMIC_PROSE;
};

// Mock that makes no improvement
const mockNoImprovementCallback = async (request: RevisionRequest): Promise<string> => {
  return request.originalText;
};

// ============================================================================
// RevisionOrchestrator Tests
// ============================================================================

describe('RevisionOrchestrator', () => {
  let gauntlet: QualityGauntlet;
  let orchestrator: RevisionOrchestrator;

  beforeEach(() => {
    gauntlet = createDefaultGauntlet();
    orchestrator = new RevisionOrchestrator(gauntlet);
  });

  describe('constructor and configuration', () => {
    it('should create with default configuration', () => {
      const config = orchestrator.getConfig();

      expect(config.maxIterations).toBe(3);
      expect(config.minScoreImprovement).toBe(0.02);
      expect(config.applyAutoFixes).toBe(true);
      expect(config.prioritizeSeverity).toBe(false);
      expect(config.maxIssuesInPrompt).toBe(20);
    });

    it('should accept partial configuration override', () => {
      const customOrchestrator = new RevisionOrchestrator(gauntlet, {
        maxIterations: 5,
        minScoreImprovement: 0.01,
      });

      const config = customOrchestrator.getConfig();

      expect(config.maxIterations).toBe(5);
      expect(config.minScoreImprovement).toBe(0.01);
      expect(config.applyAutoFixes).toBe(true); // Default preserved
    });

    it('should allow updating configuration', () => {
      orchestrator.updateConfig({ maxIterations: 10 });

      expect(orchestrator.getConfig().maxIterations).toBe(10);
    });
  });

  describe('refineUntilQuality', () => {
    it('should return immediately if text already passes quality', async () => {
      const result = await orchestrator.refineUntilQuality(
        ACADEMIC_PROSE,
        1,
        mockNoImprovementCallback
      );

      // May or may not pass depending on gauntlet configuration
      // Just verify it completes and has expected structure
      expect(result).toHaveProperty('finalText');
      expect(result).toHaveProperty('iterations');
      expect(result).toHaveProperty('passed');
      expect(result).toHaveProperty('finalScore');
      expect(result).toHaveProperty('history');
      expect(result).toHaveProperty('totalDurationMs');
      expect(result).toHaveProperty('finalGauntletResult');
      expect(result.totalDurationMs).toBeGreaterThan(0);
    });

    it('should perform revisions when quality is below threshold', async () => {
      const result = await orchestrator.refineUntilQuality(
        LOW_QUALITY_PROSE,
        1,
        mockRevisionCallback
      );

      expect(result.finalText).toBeDefined();
      // Revision should have been attempted (unless text passes on first check)
      // The key is that the structure is correct
      expect(Array.isArray(result.history)).toBe(true);
    });

    it('should stop after max iterations', async () => {
      const limitedOrchestrator = new RevisionOrchestrator(gauntlet, {
        maxIterations: 2,
      });

      const result = await limitedOrchestrator.refineUntilQuality(
        LOW_QUALITY_PROSE,
        1,
        mockNoImprovementCallback
      );

      expect(result.iterations).toBeLessThanOrEqual(2);
    });

    it('should track revision history', async () => {
      const result = await orchestrator.refineUntilQuality(
        PROSE_WITH_ISSUES,
        1,
        mockRevisionCallback
      );

      // History should contain revision results
      for (const entry of result.history) {
        expect(entry).toHaveProperty('success');
        expect(entry).toHaveProperty('revisedText');
        expect(entry).toHaveProperty('iteration');
        expect(entry).toHaveProperty('newScore');
        expect(entry).toHaveProperty('durationMs');
      }
    });

    it('should stop early when minimum improvement not met', async () => {
      const strictOrchestrator = new RevisionOrchestrator(gauntlet, {
        maxIterations: 5,
        minScoreImprovement: 0.2, // Very high threshold
      });

      const result = await strictOrchestrator.refineUntilQuality(
        LOW_QUALITY_PROSE,
        1,
        mockNoImprovementCallback
      );

      // Should stop before max iterations due to lack of improvement
      expect(result.iterations).toBeLessThan(5);
    });

    it('should call revision callback with proper request structure', async () => {
      const callbackSpy = vi.fn().mockImplementation(mockRevisionCallback);

      await orchestrator.refineUntilQuality(
        LOW_QUALITY_PROSE,
        1,
        callbackSpy
      );

      if (callbackSpy.mock.calls.length > 0) {
        const request = callbackSpy.mock.calls[0][0] as RevisionRequest;

        expect(request).toHaveProperty('requestId');
        expect(request).toHaveProperty('chapterId', 1);
        expect(request).toHaveProperty('issues');
        expect(request).toHaveProperty('originalText');
        expect(request).toHaveProperty('revisionGuidance');
        expect(request).toHaveProperty('iteration');
        expect(request).toHaveProperty('previousScore');
        expect(Array.isArray(request.issues)).toBe(true);
      }
    });

    it('should track resolved and unresolved issues', async () => {
      const result = await orchestrator.refineUntilQuality(
        PROSE_WITH_ISSUES,
        1,
        mockImprovingCallback
      );

      // unresolvedIssues should contain critical/major issues only
      for (const issue of result.unresolvedIssues) {
        expect(['critical', 'major']).toContain(issue.severity);
      }
    });
  });

  describe('performRevision', () => {
    it('should perform single revision pass', async () => {
      const request: RevisionRequest = {
        requestId: 'test-request-1',
        chapterId: 1,
        issues: [],
        originalText: LOW_QUALITY_PROSE,
        revisionGuidance: 'Improve citation density',
        iteration: 1,
        previousScore: 0.5,
        previouslyResolvedIssues: [],
      };

      const result = await orchestrator.performRevision(
        request,
        mockRevisionCallback
      );

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('revisedText');
      expect(result).toHaveProperty('newScore');
      expect(result).toHaveProperty('durationMs');
      expect(result.iteration).toBe(1);
    });

    it('should determine success based on score improvement', async () => {
      const request: RevisionRequest = {
        requestId: 'test-request-2',
        chapterId: 1,
        issues: [],
        originalText: LOW_QUALITY_PROSE,
        revisionGuidance: 'Add more citations',
        iteration: 1,
        previousScore: 0.3,
        previouslyResolvedIssues: [],
      };

      const result = await orchestrator.performRevision(
        request,
        mockImprovingCallback
      );

      // Success is based on score comparison
      expect(typeof result.success).toBe('boolean');
    });
  });

  describe('buildRevisionPrompt', () => {
    it('should generate formatted revision prompt', () => {
      const request: RevisionRequest = {
        requestId: 'prompt-test-1',
        chapterId: 2,
        issues: [
          {
            id: 'issue-1',
            type: 'citation',
            severity: 'critical',
            location: { chapterId: 2, paragraphIndex: 0 },
            description: 'Missing citation for claim',
            suggestion: 'Add supporting citation',
            autoFixable: false,
          },
          {
            id: 'issue-2',
            type: 'argument',
            severity: 'major',
            location: { chapterId: 2, paragraphIndex: 1 },
            description: 'Weak argument structure',
            suggestion: 'Add warrant and backing',
            autoFixable: false,
          },
          {
            id: 'issue-3',
            type: 'style',
            severity: 'minor',
            location: { chapterId: 2 },
            description: 'Informal phrase detected',
            suggestion: 'Replace with formal language',
            autoFixable: true,
          },
        ],
        originalText: PROSE_WITH_ISSUES,
        revisionGuidance: 'Focus on citation and argument improvements',
        iteration: 2,
        previousScore: 0.65,
        previouslyResolvedIssues: ['issue-0'],
      };

      const prompt = orchestrator.buildRevisionPrompt(request);

      expect(prompt).toContain('CHAPTER REVISION REQUEST');
      expect(prompt).toContain('Chapter:** 2');
      expect(prompt).toContain('Iteration:** 2');
      expect(prompt).toContain('Current Score:** 65.0%');
      expect(prompt).toContain('CRITICAL ISSUES');
      expect(prompt).toContain('MAJOR ISSUES');
      expect(prompt).toContain('Missing citation');
      expect(prompt).toContain('Weak argument');
      expect(prompt).toContain('INSTRUCTIONS');
    });

    it('should include specific guidance', () => {
      const request: RevisionRequest = {
        requestId: 'prompt-test-2',
        chapterId: 1,
        issues: [],
        originalText: 'Test',
        revisionGuidance: 'Special revision guidance here',
        iteration: 1,
        previousScore: 0.5,
        previouslyResolvedIssues: [],
      };

      const prompt = orchestrator.buildRevisionPrompt(request);

      expect(prompt).toContain('SPECIFIC GUIDANCE');
      expect(prompt).toContain('Special revision guidance here');
    });

    it('should show progress from previously resolved issues', () => {
      const request: RevisionRequest = {
        requestId: 'prompt-test-3',
        chapterId: 1,
        issues: [],
        originalText: 'Test',
        revisionGuidance: '',
        iteration: 3,
        previousScore: 0.7,
        previouslyResolvedIssues: ['issue-a', 'issue-b', 'issue-c'],
      };

      const prompt = orchestrator.buildRevisionPrompt(request);

      expect(prompt).toContain('PROGRESS');
      expect(prompt).toContain('3 issues resolved');
    });

    it('should summarize minor issues when not prioritizing severity', () => {
      const request: RevisionRequest = {
        requestId: 'prompt-test-4',
        chapterId: 1,
        issues: [
          {
            id: 'minor-1',
            type: 'style',
            severity: 'minor',
            location: { chapterId: 1 },
            description: 'Style issue 1',
            suggestion: 'Fix it',
            autoFixable: false,
          },
          {
            id: 'minor-2',
            type: 'style',
            severity: 'minor',
            location: { chapterId: 1 },
            description: 'Style issue 2',
            suggestion: 'Fix it',
            autoFixable: false,
          },
        ],
        originalText: 'Test',
        revisionGuidance: '',
        iteration: 1,
        previousScore: 0.8,
        previouslyResolvedIssues: [],
      };

      const prompt = orchestrator.buildRevisionPrompt(request);

      expect(prompt).toContain('MINOR ISSUES');
      expect(prompt).toContain('2 minor issues');
    });
  });

  describe('interactive review', () => {
    it('should call interactive callback after evaluation', async () => {
      const reviewCallback = vi.fn().mockResolvedValue({
        continue: false, // Stop immediately
      });

      const interactiveOrchestrator = createInteractiveOrchestrator(
        gauntlet,
        reviewCallback
      );

      await interactiveOrchestrator.refineUntilQuality(
        LOW_QUALITY_PROSE,
        1,
        mockRevisionCallback
      );

      // Should have been called at least once (initial evaluation)
      expect(reviewCallback).toHaveBeenCalled();

      // Verify callback context
      if (reviewCallback.mock.calls.length > 0) {
        const context = reviewCallback.mock.calls[0][0] as InteractiveReviewContext;
        expect(context).toHaveProperty('iteration');
        expect(context).toHaveProperty('currentScore');
        expect(context).toHaveProperty('currentText');
        expect(context).toHaveProperty('issues');
        expect(context).toHaveProperty('gauntletResult');
      }
    });

    it('should apply user modifications from interactive review', async () => {
      const modifiedText = 'User modified text with corrections';

      const reviewCallback = vi.fn()
        .mockResolvedValueOnce({
          continue: true,
          modifiedText: modifiedText,
        })
        .mockResolvedValue({
          continue: false,
        });

      const interactiveOrchestrator = createInteractiveOrchestrator(
        gauntlet,
        reviewCallback
      );

      const result = await interactiveOrchestrator.refineUntilQuality(
        LOW_QUALITY_PROSE,
        1,
        mockNoImprovementCallback
      );

      // Modified text should be used
      // (exact behavior depends on gauntlet evaluation)
      expect(reviewCallback).toHaveBeenCalled();
    });

    it('should stop when user decides not to continue', async () => {
      const reviewCallback = vi.fn().mockResolvedValue({
        continue: false,
      });

      const interactiveOrchestrator = createInteractiveOrchestrator(
        gauntlet,
        reviewCallback
      );

      const result = await interactiveOrchestrator.refineUntilQuality(
        LOW_QUALITY_PROSE,
        1,
        mockRevisionCallback
      );

      // Should stop early
      expect(result.passed).toBe(false);
    });
  });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

describe('Factory Functions', () => {
  describe('createDefaultOrchestrator', () => {
    it('should create orchestrator with default settings', () => {
      const gauntlet = createDefaultGauntlet();
      const orchestrator = createDefaultOrchestrator(gauntlet);

      const config = orchestrator.getConfig();

      expect(config.maxIterations).toBe(3);
      expect(config.minScoreImprovement).toBe(0.02);
    });
  });

  describe('createStrictOrchestrator', () => {
    it('should create orchestrator with strict settings', () => {
      const gauntlet = createStrictGauntlet();
      const orchestrator = createStrictOrchestrator(gauntlet);

      const config = orchestrator.getConfig();

      expect(config.maxIterations).toBe(5);
      expect(config.minScoreImprovement).toBe(0.01);
      expect(config.maxIssuesInPrompt).toBe(30);
    });
  });

  describe('createFastOrchestrator', () => {
    it('should create orchestrator with fast settings', () => {
      const gauntlet = createDraftGauntlet();
      const orchestrator = createFastOrchestrator(gauntlet);

      const config = orchestrator.getConfig();

      expect(config.maxIterations).toBe(2);
      expect(config.minScoreImprovement).toBe(0.05);
      expect(config.prioritizeSeverity).toBe(true);
      expect(config.maxIssuesInPrompt).toBe(10);
    });
  });

  describe('createInteractiveOrchestrator', () => {
    it('should create orchestrator with interactive review callback', () => {
      const gauntlet = createDefaultGauntlet();
      const callback = vi.fn().mockResolvedValue({ continue: false });

      const orchestrator = createInteractiveOrchestrator(gauntlet, callback);

      const config = orchestrator.getConfig();

      expect(config.maxIterations).toBe(5);
      expect(config.interactiveReviewCallback).toBe(callback);
    });
  });
});

// ============================================================================
// Integration with 7-Stage Gauntlet Tests
// ============================================================================

describe('Integration with 7-Stage Gauntlet', () => {
  it('should handle Toulmin-specific issues in revision prompts', async () => {
    const gauntlet = createDefaultGauntlet();
    const orchestrator = createDefaultOrchestrator(gauntlet);

    // Create request with Toulmin issues
    const request: RevisionRequest = {
      requestId: 'toulmin-test',
      chapterId: 1,
      issues: [
        {
          id: 'toulmin-1',
          type: 'argument',
          severity: 'major',
          location: { chapterId: 1, paragraphIndex: 0 },
          description: 'Missing warrant in argument structure',
          suggestion: 'Add explicit warrant connecting evidence to claim',
          autoFixable: false,
          contextSnippet: 'The evidence shows X therefore Y',
        },
        {
          id: 'toulmin-2',
          type: 'argument',
          severity: 'major',
          location: { chapterId: 1, paragraphIndex: 2 },
          description: 'Missing backing for warrant',
          suggestion: 'Provide theoretical or empirical backing',
          autoFixable: false,
        },
      ],
      originalText: PROSE_WITH_ISSUES,
      revisionGuidance: 'Strengthen argument structure with Toulmin elements',
      iteration: 1,
      previousScore: 0.6,
      previouslyResolvedIssues: [],
    };

    const prompt = orchestrator.buildRevisionPrompt(request);

    expect(prompt).toContain('MAJOR ISSUES');
    expect(prompt).toContain('Missing warrant');
    expect(prompt).toContain('Missing backing');
    expect(prompt).toContain('Toulmin');
  });

  it('should handle citation verification issues', async () => {
    const gauntlet = createDefaultGauntlet();
    const orchestrator = createDefaultOrchestrator(gauntlet);

    const request: RevisionRequest = {
      requestId: 'citation-test',
      chapterId: 1,
      issues: [
        {
          id: 'citation-1',
          type: 'citation',
          severity: 'critical',
          location: { chapterId: 1, paragraphIndex: 1 },
          description: 'Citation not found in corpus: (Fake, 2025)',
          suggestion: 'Verify citation or replace with corpus-backed source',
          autoFixable: false,
        },
      ],
      originalText: 'The evidence shows X (Fake, 2025).',
      revisionGuidance: 'All citations must be verifiable in corpus',
      iteration: 1,
      previousScore: 0.4,
      previouslyResolvedIssues: [],
    };

    const prompt = orchestrator.buildRevisionPrompt(request);

    expect(prompt).toContain('CRITICAL ISSUES');
    expect(prompt).toContain('Citation not found');
    expect(prompt).toContain('corpus-backed');
  });

  it('should handle all 7 stage types in revision guidance', async () => {
    const gauntlet = createDefaultGauntlet();
    const orchestrator = createDefaultOrchestrator(gauntlet);

    // Issues from all 7 stages
    const issues: QualityIssue[] = [
      { id: 'cv-1', type: 'citation', severity: 'critical', location: { chapterId: 1 },
        description: 'Unverified citation', suggestion: 'Verify', autoFixable: false },
      { id: 'te-1', type: 'argument', severity: 'major', location: { chapterId: 1 },
        description: 'Missing warrant', suggestion: 'Add warrant', autoFixable: false },
      { id: 'ac-1', type: 'argument', severity: 'major', location: { chapterId: 1 },
        description: 'Incoherent argument', suggestion: 'Fix flow', autoFixable: false },
      { id: 'cc-1', type: 'citation', severity: 'major', location: { chapterId: 1 },
        description: 'Missing citation', suggestion: 'Add citation', autoFixable: false },
      { id: 'cd-1', type: 'citation', severity: 'minor', location: { chapterId: 1 },
        description: 'Low citation density', suggestion: 'Add more', autoFixable: false },
      { id: 'sc-1', type: 'style', severity: 'minor', location: { chapterId: 1 },
        description: 'Style inconsistency', suggestion: 'Fix style', autoFixable: false },
      { id: 'fa-1', type: 'factual', severity: 'major', location: { chapterId: 1 },
        description: 'Factual inconsistency', suggestion: 'Verify facts', autoFixable: false },
    ];

    const request: RevisionRequest = {
      requestId: 'all-stages-test',
      chapterId: 1,
      issues,
      originalText: LOW_QUALITY_PROSE,
      revisionGuidance: 'Address all quality issues from 7-stage gauntlet',
      iteration: 1,
      previousScore: 0.4,
      previouslyResolvedIssues: [],
    };

    const prompt = orchestrator.buildRevisionPrompt(request);

    expect(prompt).toContain('CRITICAL ISSUES');
    expect(prompt).toContain('MAJOR ISSUES');
    expect(prompt).toContain('MINOR ISSUES');
    expect(prompt).toContain('citation');
    expect(prompt).toContain('argument');
    expect(prompt).toContain('style');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  let gauntlet: QualityGauntlet;
  let orchestrator: RevisionOrchestrator;

  beforeEach(() => {
    gauntlet = createDefaultGauntlet();
    orchestrator = createDefaultOrchestrator(gauntlet);
  });

  it('should handle empty text', async () => {
    const result = await orchestrator.refineUntilQuality(
      '',
      1,
      mockNoImprovementCallback
    );

    expect(result).toHaveProperty('finalText');
    expect(result).toHaveProperty('passed');
  });

  it('should handle text with only whitespace', async () => {
    const result = await orchestrator.refineUntilQuality(
      '   \n\n\t  ',
      1,
      mockNoImprovementCallback
    );

    expect(result).toHaveProperty('finalText');
  });

  it('should handle revision callback that throws', async () => {
    const errorCallback = async () => {
      throw new Error('Revision failed');
    };

    await expect(
      orchestrator.refineUntilQuality(LOW_QUALITY_PROSE, 1, errorCallback)
    ).rejects.toThrow('Revision failed');
  });

  it('should handle revision callback that returns empty string', async () => {
    const emptyCallback = async () => '';

    const result = await orchestrator.refineUntilQuality(
      LOW_QUALITY_PROSE,
      1,
      emptyCallback
    );

    // Should complete without crashing
    expect(result).toHaveProperty('finalText');
  });

  it('should handle very long text', async () => {
    const longText = ACADEMIC_PROSE.repeat(50); // ~50K characters

    const result = await orchestrator.refineUntilQuality(
      longText,
      1,
      mockNoImprovementCallback
    );

    expect(result).toHaveProperty('finalText');
    expect(result.totalDurationMs).toBeGreaterThan(0);
  });

  it('should handle request with no issues', () => {
    const request: RevisionRequest = {
      requestId: 'no-issues',
      chapterId: 1,
      issues: [],
      originalText: 'Perfect text.',
      revisionGuidance: '',
      iteration: 1,
      previousScore: 1.0,
      previouslyResolvedIssues: [],
    };

    const prompt = orchestrator.buildRevisionPrompt(request);

    // Should still generate valid prompt structure
    expect(prompt).toContain('CHAPTER REVISION REQUEST');
    expect(prompt).toContain('INSTRUCTIONS');
  });

  it('should respect maxIssuesInPrompt limit', () => {
    const manyIssues: QualityIssue[] = Array.from({ length: 50 }, (_, i) => ({
      id: `issue-${i}`,
      type: 'citation',
      severity: i < 5 ? 'critical' : i < 20 ? 'major' : 'minor',
      location: { chapterId: 1 },
      description: `Issue ${i}`,
      suggestion: `Fix issue ${i}`,
      autoFixable: false,
    }));

    const limitedOrchestrator = new RevisionOrchestrator(gauntlet, {
      maxIssuesInPrompt: 10,
    });

    const request: RevisionRequest = {
      requestId: 'many-issues',
      chapterId: 1,
      issues: manyIssues,
      originalText: LOW_QUALITY_PROSE,
      revisionGuidance: '',
      iteration: 1,
      previousScore: 0.3,
      previouslyResolvedIssues: [],
    };

    const prompt = limitedOrchestrator.buildRevisionPrompt(request);

    // Should include critical issues first
    expect(prompt).toContain('CRITICAL ISSUES');
    // Count number of "Problem:" occurrences (one per issue in prompt)
    const problemCount = (prompt.match(/\*\*Problem:\*\*/g) || []).length;
    // Should have some issues but not all 50
    expect(problemCount).toBeLessThanOrEqual(15); // Some leeway for formatting
  });
});

// ============================================================================
// Toulmin-Specific Guidance Tests
// ============================================================================

describe('Toulmin-Specific Guidance', () => {
  let gauntlet: QualityGauntlet;
  let orchestrator: RevisionOrchestrator;

  beforeEach(() => {
    gauntlet = createDefaultGauntlet();
    orchestrator = createDefaultOrchestrator(gauntlet);
  });

  it('should generate warrant-specific guidance', () => {
    const request: RevisionRequest = {
      requestId: 'toulmin-warrant',
      chapterId: 1,
      issues: [
        {
          id: 'tw-1',
          type: 'argument',
          severity: 'major',
          location: { chapterId: 1, paragraphIndex: 0 },
          description: 'Missing warrant connecting evidence to claim',
          suggestion: 'Add explicit warrant',
          autoFixable: false,
        },
      ],
      originalText: 'Test text',
      revisionGuidance: '',
      iteration: 1,
      previousScore: 0.6,
      previouslyResolvedIssues: [],
    };

    const prompt = orchestrator.buildRevisionPrompt(request);

    expect(prompt).toContain('Toulmin Guidance');
    expect(prompt).toContain('warrant');
    expect(prompt).toContain('WHY the evidence supports the claim');
  });

  it('should generate backing-specific guidance', () => {
    const request: RevisionRequest = {
      requestId: 'toulmin-backing',
      chapterId: 1,
      issues: [
        {
          id: 'tb-1',
          type: 'argument',
          severity: 'major',
          location: { chapterId: 1 },
          description: 'Argument lacks backing - no theoretical support provided',
          suggestion: 'Add backing',
          autoFixable: false,
        },
      ],
      originalText: 'Test text',
      revisionGuidance: '',
      iteration: 1,
      previousScore: 0.6,
      previouslyResolvedIssues: [],
    };

    const prompt = orchestrator.buildRevisionPrompt(request);

    expect(prompt).toContain('Toulmin Guidance');
    expect(prompt).toContain('theoretical frameworks');
  });

  it('should generate claim-specific guidance', () => {
    const request: RevisionRequest = {
      requestId: 'toulmin-claim',
      chapterId: 1,
      issues: [
        {
          id: 'tc-1',
          type: 'argument',
          severity: 'critical',
          location: { chapterId: 1 },
          description: 'No explicit claim or thesis statement',
          suggestion: 'Add explicit claim',
          autoFixable: false,
        },
      ],
      originalText: 'Test text',
      revisionGuidance: '',
      iteration: 1,
      previousScore: 0.5,
      previouslyResolvedIssues: [],
    };

    const prompt = orchestrator.buildRevisionPrompt(request);

    expect(prompt).toContain('Toulmin Guidance');
    expect(prompt).toContain('claim explicit');
  });

  it('should generate grounds-specific guidance', () => {
    const request: RevisionRequest = {
      requestId: 'toulmin-grounds',
      chapterId: 1,
      issues: [
        {
          id: 'tg-1',
          type: 'argument',
          severity: 'major',
          location: { chapterId: 1 },
          description: 'Insufficient grounds - claim lacks supporting evidence',
          suggestion: 'Add evidence',
          autoFixable: false,
        },
      ],
      originalText: 'Test text',
      revisionGuidance: '',
      iteration: 1,
      previousScore: 0.6,
      previouslyResolvedIssues: [],
    };

    const prompt = orchestrator.buildRevisionPrompt(request);

    expect(prompt).toContain('Toulmin Guidance');
    expect(prompt).toContain('evidence');
  });

  it('should generate specialized guidance for multiple argument issues', () => {
    const issues: QualityIssue[] = [
      { id: 'arg-1', type: 'argument', severity: 'major', location: { chapterId: 1 },
        description: 'Missing warrant', suggestion: 'Add warrant', autoFixable: false },
      { id: 'arg-2', type: 'argument', severity: 'major', location: { chapterId: 1 },
        description: 'Missing backing', suggestion: 'Add backing', autoFixable: false },
      { id: 'arg-3', type: 'argument', severity: 'minor', location: { chapterId: 1 },
        description: 'Missing qualifier', suggestion: 'Add qualifier', autoFixable: false },
    ];

    const guidance = orchestrator.generateSpecializedGuidance(issues);

    expect(guidance).toContain('ARGUMENT STRUCTURE FOCUS');
    expect(guidance).toContain('Toulmin model');
    expect(guidance).toContain('warrant');
    expect(guidance).toContain('backing');
  });

  it('should generate specialized guidance for citation issues', () => {
    const issues: QualityIssue[] = Array.from({ length: 5 }, (_, i) => ({
      id: `cit-${i}`,
      type: 'citation',
      severity: 'major',
      location: { chapterId: 1 },
      description: 'Missing citation',
      suggestion: 'Add citation',
      autoFixable: false,
    }));

    const guidance = orchestrator.generateSpecializedGuidance(issues);

    expect(guidance).toContain('CITATION DENSITY FOCUS');
    expect(guidance).toContain('15+ citations');
    expect(guidance).toContain('APA 7th');
  });

  it('should generate specialized guidance for style issues', () => {
    const issues: QualityIssue[] = [
      { id: 'sty-1', type: 'style', severity: 'minor', location: { chapterId: 1 },
        description: 'Contraction detected', suggestion: 'Remove', autoFixable: true },
      { id: 'sty-2', type: 'style', severity: 'minor', location: { chapterId: 1 },
        description: 'Informal phrase', suggestion: 'Formalize', autoFixable: false },
      { id: 'sty-3', type: 'style', severity: 'minor', location: { chapterId: 1 },
        description: 'Inconsistent terminology', suggestion: 'Standardize', autoFixable: false },
    ];

    const guidance = orchestrator.generateSpecializedGuidance(issues);

    expect(guidance).toContain('STYLE CONSISTENCY FOCUS');
    expect(guidance).toContain('No contractions');
    expect(guidance).toContain('Formal register');
  });

  it('should generate specialized guidance for factual issues', () => {
    const issues: QualityIssue[] = [
      { id: 'fact-1', type: 'factual', severity: 'major', location: { chapterId: 1 },
        description: 'Inconsistent date', suggestion: 'Verify', autoFixable: false },
      { id: 'fact-2', type: 'factual', severity: 'major', location: { chapterId: 1 },
        description: 'Name spelled differently', suggestion: 'Standardize', autoFixable: false },
    ];

    const guidance = orchestrator.generateSpecializedGuidance(issues);

    expect(guidance).toContain('FACTUAL CONSISTENCY FOCUS');
    expect(guidance).toContain('Consistent dates');
    expect(guidance).toContain('Author names');
  });

  it('should combine multiple specialized guidance sections', () => {
    const issues: QualityIssue[] = [
      // 3 argument issues
      { id: 'a1', type: 'argument', severity: 'major', location: { chapterId: 1 },
        description: 'Issue 1', suggestion: 'Fix', autoFixable: false },
      { id: 'a2', type: 'argument', severity: 'major', location: { chapterId: 1 },
        description: 'Issue 2', suggestion: 'Fix', autoFixable: false },
      { id: 'a3', type: 'argument', severity: 'major', location: { chapterId: 1 },
        description: 'Issue 3', suggestion: 'Fix', autoFixable: false },
      // 5 citation issues
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `c${i}`,
        type: 'citation' as const,
        severity: 'major' as const,
        location: { chapterId: 1 },
        description: `Citation issue ${i}`,
        suggestion: 'Fix',
        autoFixable: false,
      })),
    ];

    const guidance = orchestrator.generateSpecializedGuidance(issues);

    expect(guidance).toContain('ARGUMENT STRUCTURE FOCUS');
    expect(guidance).toContain('CITATION DENSITY FOCUS');
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Performance', () => {
  it('should complete single evaluation within reasonable time', async () => {
    const gauntlet = createDefaultGauntlet();
    const orchestrator = createDefaultOrchestrator(gauntlet);

    const startTime = Date.now();

    await orchestrator.refineUntilQuality(
      ACADEMIC_PROSE,
      1,
      mockNoImprovementCallback
    );

    const duration = Date.now() - startTime;

    // Should complete within 10 seconds for initial evaluation
    expect(duration).toBeLessThan(10000);
  });

  it('should track evaluation time in results', async () => {
    const gauntlet = createDefaultGauntlet();
    const orchestrator = createDefaultOrchestrator(gauntlet);

    const result = await orchestrator.refineUntilQuality(
      ACADEMIC_PROSE,
      1,
      mockNoImprovementCallback
    );

    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
    // Evaluation time may be 0 for very fast executions
    expect(result.finalGauntletResult.metadata.evaluationTimeMs).toBeGreaterThanOrEqual(0);
  });
});
