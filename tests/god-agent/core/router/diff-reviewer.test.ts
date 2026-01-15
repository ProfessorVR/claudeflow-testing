/**
 * Tests for Diff Reviewer
 *
 * Tests the Claude-powered diff review system with:
 * - Review parsing
 * - Issue classification
 * - Multi-pass review
 * - Approval logic
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DiffReviewer,
  getDiffReviewer,
  resetDiffReviewer,
  initializeDiffReviewer,
  reviewDiff,
  summarizeReview,
  formatIssues,
  hasBlockingIssues,
  getIssuesBySeverity,
  type DiffReviewResult,
  type ReviewIssue,
  type DiffReviewProvider,
  type DiffReviewOptions,
} from '../../../../src/god-agent/core/router/diff-reviewer.js';
import type { LLMResponse } from '../../../../src/god-agent/core/router/router-types.js';

// ===== MOCK PROVIDER =====

function createMockProvider(response: string | ((prompt: string) => string)): DiffReviewProvider {
  return {
    provider: 'anthropic',
    model: 'claude-3-opus',
    complete: vi.fn().mockImplementation(async (prompt: string): Promise<LLMResponse> => {
      const content = typeof response === 'function' ? response(prompt) : response;
      return {
        content,
        model: 'claude-3-opus',
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        latencyMs: 100,
      };
    }),
  };
}

function createApprovalResponse(
  approved: boolean,
  confidence: number,
  options: {
    feedback?: string;
    issues?: string[];
    suggestions?: string[];
    strengths?: string[];
  } = {}
): string {
  const {
    feedback = approved ? 'Code looks good' : 'Needs improvement',
    issues = [],
    suggestions = [],
    strengths = [],
  } = options;

  return `APPROVED: ${approved ? 'yes' : 'no'}
CONFIDENCE: ${confidence}
FEEDBACK: ${feedback}

STRENGTHS:
${strengths.length > 0 ? strengths.map(s => `- ${s}`).join('\n') : 'none'}

ISSUES:
${issues.length > 0 ? issues.map(i => `- ${i}`).join('\n') : 'none'}

SUGGESTIONS:
${suggestions.length > 0 ? suggestions.map(s => `- ${s}`).join('\n') : 'none'}`;
}

// ===== TESTS =====

describe('DiffReviewer', () => {
  beforeEach(() => {
    resetDiffReviewer();
  });

  describe('Constructor and Configuration', () => {
    it('should create with default configuration', () => {
      const reviewer = new DiffReviewer();
      expect(reviewer).toBeDefined();
      expect(reviewer.hasProvider()).toBe(false);
    });

    it('should create with custom provider', () => {
      const provider = createMockProvider('response');
      const reviewer = new DiffReviewer({ provider });
      expect(reviewer.hasProvider()).toBe(true);
    });

    it('should use default options from config', () => {
      const reviewer = new DiffReviewer({
        defaultOptions: {
          passes: 2,
          minConfidence: 0.8,
        },
      });
      expect(reviewer).toBeDefined();
    });
  });

  describe('Review Approval', () => {
    it('should approve when Claude approves with high confidence', async () => {
      const provider = createMockProvider(createApprovalResponse(true, 0.9));
      const reviewer = new DiffReviewer({ provider });

      const result = await reviewer.review('old code', 'new code');

      expect(result.approved).toBe(true);
      expect(result.confidence).toBe(0.9);
    });

    it('should reject when Claude rejects', async () => {
      const provider = createMockProvider(createApprovalResponse(false, 0.8, {
        feedback: 'Security issue found',
        issues: ['[critical:security] SQL injection vulnerability | line 5 | use parameterized queries'],
      }));
      const reviewer = new DiffReviewer({ provider });

      const result = await reviewer.review('old code', 'new code');

      expect(result.approved).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should reject when confidence below threshold', async () => {
      const provider = createMockProvider(createApprovalResponse(true, 0.5));
      const reviewer = new DiffReviewer({
        provider,
        defaultOptions: { minConfidence: 0.7 },
      });

      const result = await reviewer.review('old code', 'new code');

      expect(result.approved).toBe(false);
    });

    it('should reject when blocking issues found even if approved', async () => {
      const provider = createMockProvider(createApprovalResponse(true, 0.9, {
        issues: ['[critical:security] Major security flaw | line 10 | fix it'],
      }));
      const reviewer = new DiffReviewer({ provider });

      const result = await reviewer.review('old code', 'new code');

      expect(result.approved).toBe(false);
      expect(hasBlockingIssues(result)).toBe(true);
    });
  });

  describe('Issue Parsing', () => {
    it('should parse issue severity and category', async () => {
      const provider = createMockProvider(createApprovalResponse(false, 0.6, {
        issues: [
          '[critical:security] SQL injection | line 5 | use prepared statements',
          '[major:correctness] Logic error | line 10 | fix condition',
          '[minor:style] Inconsistent naming | line 15 | rename variable',
          '[suggestion:maintainability] Consider extracting method | none | none',
        ],
      }));
      const reviewer = new DiffReviewer({ provider });

      const result = await reviewer.review('old', 'new');

      expect(result.issues.length).toBe(4);
      expect(result.issues[0].severity).toBe('critical');
      expect(result.issues[0].category).toBe('security');
      expect(result.issues[1].severity).toBe('major');
      expect(result.issues[2].severity).toBe('minor');
      expect(result.issues[3].severity).toBe('suggestion');
    });

    it('should parse issue location and suggestion', async () => {
      const provider = createMockProvider(createApprovalResponse(false, 0.5, {
        issues: ['[major:correctness] Missing null check | line 42 | add null guard'],
      }));
      const reviewer = new DiffReviewer({ provider });

      const result = await reviewer.review('old', 'new');

      expect(result.issues[0].location).toBe('line 42');
      expect(result.issues[0].suggestion).toBe('add null guard');
    });

    it('should handle issues without location', async () => {
      const provider = createMockProvider(createApprovalResponse(false, 0.5, {
        issues: ['[minor:style] General code smell | none | refactor'],
      }));
      const reviewer = new DiffReviewer({ provider });

      const result = await reviewer.review('old', 'new');

      expect(result.issues[0].location).toBeUndefined();
      expect(result.issues[0].suggestion).toBe('refactor');
    });

    it('should handle malformed issues gracefully', async () => {
      const provider = createMockProvider(createApprovalResponse(false, 0.5, {
        issues: ['This is not formatted correctly'],
      }));
      const reviewer = new DiffReviewer({ provider });

      const result = await reviewer.review('old', 'new');

      expect(result.issues.length).toBe(1);
      expect(result.issues[0].severity).toBe('minor');
      expect(result.issues[0].category).toBe('other');
    });
  });

  describe('Multi-Pass Review', () => {
    it('should perform multiple review passes', async () => {
      const provider = createMockProvider(createApprovalResponse(true, 0.9));
      const reviewer = new DiffReviewer({
        provider,
        defaultOptions: { passes: 2 },
      });

      const result = await reviewer.review('old', 'new');

      expect(provider.complete).toHaveBeenCalledTimes(2);
      expect(result.passNumber).toBe(2);
    });

    it('should stop early if rejected', async () => {
      let callCount = 0;
      const provider = createMockProvider(() => {
        callCount++;
        return createApprovalResponse(false, 0.4, {
          issues: ['[major:correctness] Error | line 1 | fix'],
        });
      });
      const reviewer = new DiffReviewer({
        provider,
        defaultOptions: { passes: 3 },
      });

      const result = await reviewer.review('old', 'new');

      expect(callCount).toBe(1);
      expect(result.approved).toBe(false);
    });
  });

  describe('Context Integration', () => {
    it('should include original prompt in review', async () => {
      const provider = createMockProvider(createApprovalResponse(true, 0.9));
      const reviewer = new DiffReviewer({ provider });

      await reviewer.review('old', 'new', {
        context: {
          originalPrompt: 'Add error handling',
        },
      });

      expect(provider.complete).toHaveBeenCalledWith(
        expect.stringContaining('Add error handling'),
        undefined
      );
    });

    it('should include language in review', async () => {
      const provider = createMockProvider(createApprovalResponse(true, 0.9));
      const reviewer = new DiffReviewer({ provider });

      await reviewer.review('old', 'new', {
        context: {
          language: 'TypeScript',
        },
      });

      expect(provider.complete).toHaveBeenCalledWith(
        expect.stringContaining('TypeScript'),
        undefined
      );
    });

    it('should include focus areas in review', async () => {
      const provider = createMockProvider(createApprovalResponse(true, 0.9));
      const reviewer = new DiffReviewer({ provider });

      await reviewer.review('old', 'new', {
        context: {
          focusAreas: ['security', 'performance'],
        },
      });

      expect(provider.complete).toHaveBeenCalledWith(
        expect.stringContaining('security'),
        undefined
      );
    });
  });

  describe('Error Handling', () => {
    it('should auto-approve when no provider configured', async () => {
      const reviewer = new DiffReviewer();
      const result = await reviewer.review('old', 'new');

      expect(result.approved).toBe(true);
      expect(result.feedback).toContain('no reviewer configured');
    });

    it('should handle provider failure gracefully', async () => {
      const provider: DiffReviewProvider = {
        provider: 'anthropic',
        model: 'claude-3-opus',
        complete: vi.fn().mockRejectedValue(new Error('API Error')),
      };
      const reviewer = new DiffReviewer({ provider });

      const result = await reviewer.review('old', 'new', { autoApprove: true });

      expect(result.approved).toBe(true);
      expect(result.confidence).toBe(0.3);
      expect(result.feedback).toContain('Review failed');
    });
  });

  describe('Diff Generation', () => {
    it('should handle new content', async () => {
      const provider = createMockProvider((prompt) => {
        expect(prompt).toContain('+++');
        return createApprovalResponse(true, 0.9);
      });
      const reviewer = new DiffReviewer({ provider });

      await reviewer.review('', 'new content');
    });

    it('should handle removed content', async () => {
      const provider = createMockProvider((prompt) => {
        expect(prompt).toContain('---');
        return createApprovalResponse(true, 0.9);
      });
      const reviewer = new DiffReviewer({ provider });

      await reviewer.review('old content', '');
    });

    it('should show changes in diff', async () => {
      const provider = createMockProvider((prompt) => {
        expect(prompt).toContain('- old');
        expect(prompt).toContain('+ new');
        return createApprovalResponse(true, 0.9);
      });
      const reviewer = new DiffReviewer({ provider });

      await reviewer.review('old', 'new');
    });
  });

  describe('reviewDiff (pre-generated diff)', () => {
    it('should review pre-generated diff', async () => {
      const provider = createMockProvider(createApprovalResponse(true, 0.9));
      const reviewer = new DiffReviewer({ provider });

      const result = await reviewer.reviewDiff('- old\n+ new');

      expect(result.approved).toBe(true);
      expect(provider.complete).toHaveBeenCalledWith(
        expect.stringContaining('- old'),
        undefined
      );
    });
  });

  describe('Provider Management', () => {
    it('should allow setting provider after construction', () => {
      const reviewer = new DiffReviewer();
      expect(reviewer.hasProvider()).toBe(false);

      const provider = createMockProvider('response');
      reviewer.setProvider(provider);
      expect(reviewer.hasProvider()).toBe(true);
    });
  });
});

describe('Singleton Functions', () => {
  beforeEach(() => {
    resetDiffReviewer();
  });

  it('getDiffReviewer should return same instance', () => {
    const reviewer1 = getDiffReviewer();
    const reviewer2 = getDiffReviewer();
    expect(reviewer1).toBe(reviewer2);
  });

  it('getDiffReviewer with config should create new instance', () => {
    const reviewer1 = getDiffReviewer();
    const provider = createMockProvider('response');
    const reviewer2 = getDiffReviewer({ provider });
    expect(reviewer1).not.toBe(reviewer2);
  });

  it('initializeDiffReviewer should create configured instance', () => {
    const provider = createMockProvider('response');
    const reviewer = initializeDiffReviewer({ provider });
    expect(reviewer.hasProvider()).toBe(true);
    expect(getDiffReviewer()).toBe(reviewer);
  });

  it('resetDiffReviewer should clear instance', () => {
    const reviewer1 = getDiffReviewer();
    resetDiffReviewer();
    const reviewer2 = getDiffReviewer();
    expect(reviewer1).not.toBe(reviewer2);
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    resetDiffReviewer();
  });

  describe('reviewDiff (standalone function)', () => {
    it('should review with provided config', async () => {
      const provider = createMockProvider(createApprovalResponse(true, 0.9));
      const result = await reviewDiff('old', 'new', {}, { provider });

      expect(result.approved).toBe(true);
    });
  });

  describe('summarizeReview', () => {
    it('should format approved review', () => {
      const result: DiffReviewResult = {
        approved: true,
        feedback: 'Good',
        confidence: 0.95,
        issues: [],
        suggestions: [],
        strengths: [],
        reviewTimeMs: 100,
        passNumber: 1,
      };

      const summary = summarizeReview(result);
      expect(summary).toContain('Approved');
      expect(summary).toContain('95%');
    });

    it('should format rejected review with issues', () => {
      const result: DiffReviewResult = {
        approved: false,
        feedback: 'Bad',
        confidence: 0.4,
        issues: [
          { id: '1', severity: 'critical', category: 'security', description: 'SQL injection' },
          { id: '2', severity: 'major', category: 'correctness', description: 'Logic error' },
          { id: '3', severity: 'minor', category: 'style', description: 'Naming' },
        ],
        suggestions: [],
        strengths: [],
        reviewTimeMs: 100,
        passNumber: 1,
      };

      const summary = summarizeReview(result);
      expect(summary).toContain('Rejected');
      expect(summary).toContain('1 critical');
      expect(summary).toContain('1 major');
      expect(summary).toContain('1 minor');
    });
  });

  describe('formatIssues', () => {
    it('should format issues for display', () => {
      const issues: ReviewIssue[] = [
        {
          id: '1',
          severity: 'critical',
          category: 'security',
          description: 'SQL injection vulnerability',
          location: 'line 42',
          suggestion: 'Use parameterized queries',
        },
      ];

      const formatted = formatIssues(issues);
      expect(formatted).toContain('CRITICAL');
      expect(formatted).toContain('security');
      expect(formatted).toContain('SQL injection');
      expect(formatted).toContain('line 42');
      expect(formatted).toContain('parameterized queries');
    });

    it('should handle empty issues', () => {
      const formatted = formatIssues([]);
      expect(formatted).toBe('No issues found');
    });
  });

  describe('hasBlockingIssues', () => {
    it('should return true for critical issues', () => {
      const result: DiffReviewResult = {
        approved: true,
        feedback: '',
        confidence: 0.9,
        issues: [{ id: '1', severity: 'critical', category: 'security', description: 'Bad' }],
        suggestions: [],
        strengths: [],
        reviewTimeMs: 100,
        passNumber: 1,
      };

      expect(hasBlockingIssues(result)).toBe(true);
    });

    it('should return true for major issues', () => {
      const result: DiffReviewResult = {
        approved: true,
        feedback: '',
        confidence: 0.9,
        issues: [{ id: '1', severity: 'major', category: 'correctness', description: 'Error' }],
        suggestions: [],
        strengths: [],
        reviewTimeMs: 100,
        passNumber: 1,
      };

      expect(hasBlockingIssues(result)).toBe(true);
    });

    it('should return false for only minor issues', () => {
      const result: DiffReviewResult = {
        approved: true,
        feedback: '',
        confidence: 0.9,
        issues: [{ id: '1', severity: 'minor', category: 'style', description: 'Style' }],
        suggestions: [],
        strengths: [],
        reviewTimeMs: 100,
        passNumber: 1,
      };

      expect(hasBlockingIssues(result)).toBe(false);
    });
  });

  describe('getIssuesBySeverity', () => {
    it('should filter issues by severity', () => {
      const result: DiffReviewResult = {
        approved: false,
        feedback: '',
        confidence: 0.5,
        issues: [
          { id: '1', severity: 'critical', category: 'security', description: 'A' },
          { id: '2', severity: 'major', category: 'correctness', description: 'B' },
          { id: '3', severity: 'critical', category: 'security', description: 'C' },
        ],
        suggestions: [],
        strengths: [],
        reviewTimeMs: 100,
        passNumber: 1,
      };

      const critical = getIssuesBySeverity(result, 'critical');
      expect(critical.length).toBe(2);
      expect(critical[0].description).toBe('A');
      expect(critical[1].description).toBe('C');
    });
  });
});
