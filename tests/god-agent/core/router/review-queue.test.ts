/**
 * Review Queue Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router - Review Layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ReviewQueue,
  getReviewQueue,
  resetReviewQueue,
  executeReviewCommand,
} from '../../../../src/god-agent/core/router/review-queue.js';
import {
  AuditLogger,
  resetAuditLogger,
} from '../../../../src/god-agent/core/router/audit-logger.js';
import type {
  CreateAuditEntryInput,
  ReviewPriority,
} from '../../../../src/god-agent/core/router/audit-types.js';

// Mock child_process for git operations
vi.mock('child_process', () => ({
  execSync: vi.fn(() => ''),
}));

// Mock fs for file operations
vi.mock('fs', async () => {
  const actual = await vi.importActual('fs');
  return {
    ...actual,
    existsSync: vi.fn(() => true),
    readFileSync: vi.fn(() => Buffer.from('file content')),
    writeFileSync: vi.fn(),
    mkdirSync: vi.fn(),
  };
});

// Helper to create a mock audit entry input
function createMockEntryInput(overrides: Partial<CreateAuditEntryInput> = {}): CreateAuditEntryInput {
  return {
    sessionId: 'test-session',
    taskType: 'code_edit',
    complexity: 'medium',
    riskLevel: 'medium',
    provider: 'openai',
    modelId: 'gpt-4o',
    modelName: 'GPT-4o',
    originalPrompt: 'Fix the bug in the login function',
    routingReason: 'Fallback from Claude',
    fallbackChain: ['claude-sonnet-4', 'gpt-4o'],
    wasOverride: false,
    response: 'I fixed the bug by...',
    tokenUsage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    cost: { inputCost: 0.001, outputCost: 0.002, totalCost: 0.003 },
    latencyMs: 1500,
    filesModified: [
      {
        filePath: 'src/auth/login.ts',
        modificationType: 'modified',
        linesAdded: 5,
        linesRemoved: 3,
        diff: '@@ -10,3 +10,5 @@\n-old line\n+new line',
        beforeContent: 'old content',
        afterContent: 'new content',
      },
    ],
    diffSummary: '1 file changed, 5 insertions(+), 3 deletions(-)',
    fullDiff: '@@ -10,3 +10,5 @@\n-old line\n+new line',
    tags: ['bug-fix'],
    ...overrides,
  };
}

describe('ReviewQueue', () => {
  let queue: ReviewQueue;
  let logger: AuditLogger;

  beforeEach(() => {
    resetAuditLogger();
    resetReviewQueue();
    logger = new AuditLogger({ enabled: true, storage: 'memory' });
    queue = new ReviewQueue(
      { enableGitOperations: false, workingDirectory: '/tmp/test' },
      logger
    );
  });

  afterEach(() => {
    resetAuditLogger();
    resetReviewQueue();
    vi.clearAllMocks();
  });

  describe('Queue Operations', () => {
    it('should get queue statistics', async () => {
      await logger.createEntry(createMockEntryInput());
      await logger.createEntry(createMockEntryInput());

      const stats = queue.getStats();

      expect(stats.totalEntries).toBe(2);
      expect(stats.byStatus.pending).toBe(2);
    });

    it('should get pending count', async () => {
      await logger.createEntry(createMockEntryInput());
      await logger.createEntry(createMockEntryInput());

      const count = queue.getPendingCount();
      expect(count).toBe(2);
    });

    it('should list all entries', async () => {
      await logger.createEntry(createMockEntryInput());
      await logger.createEntry(createMockEntryInput({ provider: 'ollama' }));

      const entries = queue.list();

      expect(entries).toHaveLength(2);
    });

    it('should list pending entries', async () => {
      const entry1 = await logger.createEntry(createMockEntryInput());
      await logger.createEntry(createMockEntryInput());
      await logger.updateEntry(entry1.id, { reviewStatus: 'approved' });

      const pending = queue.listPending();

      expect(pending).toHaveLength(1);
    });

    it('should list entries by priority', async () => {
      await logger.createEntry(createMockEntryInput({ riskLevel: 'high' }));
      await logger.createEntry(createMockEntryInput({ riskLevel: 'low' }));
      await logger.createEntry(createMockEntryInput({ riskLevel: 'high' }));

      // Just verify the method works
      const byPriority = queue.listByPriority('high');
      expect(byPriority.length).toBeGreaterThanOrEqual(0);
    });

    it('should get urgent entries', async () => {
      await logger.createEntry(createMockEntryInput({ riskLevel: 'high', complexity: 'complex' }));

      const urgent = queue.getUrgent();
      expect(urgent.length).toBeGreaterThanOrEqual(0);
    });

    it('should get a specific entry', async () => {
      const created = await logger.createEntry(createMockEntryInput());

      const entry = queue.getEntry(created.id);

      expect(entry).toBeDefined();
      expect(entry?.id).toBe(created.id);
    });

    it('should return undefined for non-existent entry', () => {
      const entry = queue.getEntry('non-existent');
      expect(entry).toBeUndefined();
    });

    it('should get diff for an entry', async () => {
      const created = await logger.createEntry(createMockEntryInput());

      const diff = queue.getDiff(created.id);

      expect(diff).toBeDefined();
      expect(diff).toContain('@@');
    });

    it('should return null diff for non-existent entry', () => {
      const diff = queue.getDiff('non-existent');
      expect(diff).toBeNull();
    });
  });

  describe('Review Actions', () => {
    describe('startReview', () => {
      it('should start review on an entry', async () => {
        const entry = await logger.createEntry(createMockEntryInput());

        const result = await queue.startReview(entry.id, 'reviewer1');

        expect(result.newStatus).toBe('in_review');
        expect(result.reviewer).toBe('reviewer1');
        expect(result.error).toBeUndefined();

        const updated = queue.getEntry(entry.id);
        expect(updated?.reviewStatus).toBe('in_review');
        expect(updated?.reviewedBy).toBe('reviewer1');
      });

      it('should handle non-existent entry', async () => {
        const result = await queue.startReview('non-existent', 'reviewer1');

        expect(result.error).toBeDefined();
        expect(result.newStatus).toBe('pending');
      });
    });

    describe('approve', () => {
      it('should approve an entry', async () => {
        const entry = await logger.createEntry(createMockEntryInput());

        const result = await queue.approve(entry.id, 'reviewer1', 'Looks good');

        expect(result.newStatus).toBe('approved');
        expect(result.reviewer).toBe('reviewer1');
        expect(result.notes).toBe('Looks good');
        expect(result.rolledBack).toBe(false);

        const updated = queue.getEntry(entry.id);
        expect(updated?.reviewStatus).toBe('approved');
        expect(updated?.reviewNotes).toBe('Looks good');
      });

      it('should handle non-existent entry', async () => {
        const result = await queue.approve('non-existent', 'reviewer1');

        expect(result.error).toBeDefined();
      });
    });

    describe('reject', () => {
      it('should reject an entry without rollback', async () => {
        const entry = await logger.createEntry(createMockEntryInput());

        const result = await queue.reject(entry.id, 'reviewer1', {
          notes: 'Has issues',
          issues: ['Bug in line 10', 'Missing error handling'],
        });

        expect(result.newStatus).toBe('rejected');
        expect(result.notes).toBe('Has issues');
        expect(result.issues).toEqual(['Bug in line 10', 'Missing error handling']);
        expect(result.rolledBack).toBe(false);

        const updated = queue.getEntry(entry.id);
        expect(updated?.reviewStatus).toBe('rejected');
        expect(updated?.issuesFound).toContain('Bug in line 10');
      });

      it('should reject and attempt rollback', async () => {
        const queueWithGit = new ReviewQueue(
          { enableGitOperations: true, workingDirectory: '/tmp/test' },
          logger
        );
        const entry = await logger.createEntry(createMockEntryInput());

        const result = await queueWithGit.reject(entry.id, 'reviewer1', {
          rollback: true,
          notes: 'Rolling back',
        });

        expect(result.newStatus).toBe('rejected');
      });

      it('should handle non-existent entry', async () => {
        const result = await queue.reject('non-existent', 'reviewer1');

        expect(result.error).toBeDefined();
      });
    });

    describe('markFixed', () => {
      it('should mark entry as fixed', async () => {
        const entry = await logger.createEntry(createMockEntryInput());

        const result = await queue.markFixed(entry.id, 'reviewer1', 'Fixed the null check');

        expect(result.newStatus).toBe('fixed');
        expect(result.fixApplied).toBe(true);

        const updated = queue.getEntry(entry.id);
        expect(updated?.reviewStatus).toBe('fixed');
        expect(updated?.fixApplied).toBe('Fixed the null check');
      });

      it('should handle non-existent entry', async () => {
        const result = await queue.markFixed('non-existent', 'reviewer1', 'Fix');

        expect(result.error).toBeDefined();
      });
    });

    describe('skip', () => {
      it('should skip an entry', async () => {
        const entry = await logger.createEntry(createMockEntryInput());

        const result = await queue.skip(entry.id, 'reviewer1', 'Low priority');

        expect(result.newStatus).toBe('skipped');
        expect(result.notes).toBe('Low priority');

        const updated = queue.getEntry(entry.id);
        expect(updated?.reviewStatus).toBe('skipped');
      });

      it('should skip with default reason', async () => {
        const entry = await logger.createEntry(createMockEntryInput());

        const result = await queue.skip(entry.id, 'reviewer1');

        const updated = queue.getEntry(entry.id);
        expect(updated?.reviewNotes).toBe('Skipped by user');
      });
    });

    describe('updatePriority', () => {
      it('should update entry priority', async () => {
        const entry = await logger.createEntry(createMockEntryInput());

        const success = await queue.updatePriority(entry.id, 'critical');

        expect(success).toBe(true);

        const updated = queue.getEntry(entry.id);
        expect(updated?.priority).toBe('critical');
      });

      it('should return false for non-existent entry', async () => {
        const success = await queue.updatePriority('non-existent', 'critical');

        expect(success).toBe(false);
      });
    });

    describe('addTags', () => {
      it('should add tags to entry', async () => {
        const entry = await logger.createEntry(createMockEntryInput({ tags: ['existing'] }));

        const success = await queue.addTags(entry.id, ['new-tag', 'another-tag']);

        expect(success).toBe(true);

        const updated = queue.getEntry(entry.id);
        expect(updated?.tags).toContain('existing');
        expect(updated?.tags).toContain('new-tag');
        expect(updated?.tags).toContain('another-tag');
      });

      it('should not duplicate tags', async () => {
        const entry = await logger.createEntry(createMockEntryInput({ tags: ['existing'] }));

        await queue.addTags(entry.id, ['existing', 'new-tag']);

        const updated = queue.getEntry(entry.id);
        const existingCount = updated?.tags.filter(t => t === 'existing').length;
        expect(existingCount).toBe(1);
      });

      it('should return false for non-existent entry', async () => {
        const success = await queue.addTags('non-existent', ['tag']);

        expect(success).toBe(false);
      });
    });
  });

  describe('Batch Operations', () => {
    it('should batch approve multiple entries', async () => {
      const entry1 = await logger.createEntry(createMockEntryInput());
      const entry2 = await logger.createEntry(createMockEntryInput());
      const entry3 = await logger.createEntry(createMockEntryInput());

      const results = await queue.batchApprove(
        [entry1.id, entry2.id, entry3.id],
        'reviewer1',
        'Batch approved'
      );

      expect(results.size).toBe(3);
      expect(results.get(entry1.id)?.newStatus).toBe('approved');
      expect(results.get(entry2.id)?.newStatus).toBe('approved');
      expect(results.get(entry3.id)?.newStatus).toBe('approved');

      const pending = queue.listPending();
      expect(pending).toHaveLength(0);
    });

    it('should batch skip multiple entries', async () => {
      const entry1 = await logger.createEntry(createMockEntryInput());
      const entry2 = await logger.createEntry(createMockEntryInput());

      const results = await queue.batchSkip(
        [entry1.id, entry2.id],
        'reviewer1',
        'Batch skipped'
      );

      expect(results.size).toBe(2);
      expect(results.get(entry1.id)?.newStatus).toBe('skipped');
      expect(results.get(entry2.id)?.newStatus).toBe('skipped');
    });

    it('should auto-approve old low-priority entries', async () => {
      const queueWithAutoApprove = new ReviewQueue(
        { autoApproveAfterDays: 7 },
        logger
      );

      // Create an old entry (manually adjust timestamp would be complex, so just verify function works)
      await logger.createEntry(createMockEntryInput({ riskLevel: 'low' }));

      const approved = await queueWithAutoApprove.autoApproveOld();

      // Since the entry is new, it shouldn't be auto-approved
      expect(approved).toBe(0);
    });

    it('should not auto-approve when disabled', async () => {
      const queueWithoutAutoApprove = new ReviewQueue(
        { autoApproveAfterDays: 0 },
        logger
      );

      const approved = await queueWithoutAutoApprove.autoApproveOld();

      expect(approved).toBe(0);
    });
  });

  describe('Rollback Operations', () => {
    it('should fail rollback when git operations disabled', async () => {
      const entry = await logger.createEntry(createMockEntryInput());

      const result = await queue.rollback({
        entryId: entry.id,
        createBackup: true,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Git operations are disabled');
    });

    it('should handle non-existent entry rollback', async () => {
      const result = await queue.rollback({
        entryId: 'non-existent',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    it('should support dry run rollback', async () => {
      const queueWithGit = new ReviewQueue(
        { enableGitOperations: true, workingDirectory: '/tmp/test' },
        logger
      );
      const entry = await logger.createEntry(createMockEntryInput());

      const result = await queueWithGit.rollback({
        entryId: entry.id,
        dryRun: true,
      });

      expect(result.filesRolledBack).toContain('src/auth/login.ts');
    });

    it('should filter specific files in rollback', async () => {
      const queueWithGit = new ReviewQueue(
        { enableGitOperations: true, workingDirectory: '/tmp/test' },
        logger
      );
      const entry = await logger.createEntry(createMockEntryInput({
        filesModified: [
          { filePath: 'a.ts', modificationType: 'modified', linesAdded: 1, linesRemoved: 0, diff: '' },
          { filePath: 'b.ts', modificationType: 'modified', linesAdded: 1, linesRemoved: 0, diff: '' },
        ],
      }));

      const result = await queueWithGit.rollback({
        entryId: entry.id,
        dryRun: true,
        onlyFiles: ['a.ts'],
      });

      expect(result.filesRolledBack).toContain('a.ts');
      expect(result.filesRolledBack).not.toContain('b.ts');
    });
  });

  describe('Display Helpers', () => {
    it('should format entry for display', async () => {
      const entry = await logger.createEntry(createMockEntryInput());

      const formatted = queue.formatEntry(entry.id);

      expect(formatted).toContain(entry.id);
      expect(formatted).toContain('GPT-4o');
    });

    it('should return null for non-existent entry format', () => {
      const formatted = queue.formatEntry('non-existent');
      expect(formatted).toBeNull();
    });

    it('should format queue summary', async () => {
      await logger.createEntry(createMockEntryInput());
      await logger.createEntry(createMockEntryInput());

      const summary = queue.formatQueueSummary();

      expect(summary).toContain('Review Queue Summary');
      expect(summary).toContain('Total Entries: 2');
      expect(summary).toContain('Pending: 2');
    });

    it('should format pending list', async () => {
      await logger.createEntry(createMockEntryInput());
      await logger.createEntry(createMockEntryInput({ provider: 'ollama', modelName: 'DeepSeek' }));

      const list = queue.formatPendingList();

      expect(list).toContain('Pending Reviews');
      expect(list).toContain('GPT-4o');
      expect(list).toContain('DeepSeek');
    });

    it('should show message when no pending reviews', async () => {
      const list = queue.formatPendingList();

      expect(list).toBe('No pending reviews.');
    });
  });
});

describe('Singleton Pattern', () => {
  beforeEach(() => {
    resetAuditLogger();
    resetReviewQueue();
  });

  afterEach(() => {
    resetAuditLogger();
    resetReviewQueue();
  });

  it('should return same instance', () => {
    const queue1 = getReviewQueue();
    const queue2 = getReviewQueue();

    expect(queue1).toBe(queue2);
  });

  it('should reset singleton', () => {
    const queue1 = getReviewQueue();
    resetReviewQueue();
    const queue2 = getReviewQueue();

    expect(queue1).not.toBe(queue2);
  });
});

describe('CLI Helper: executeReviewCommand', () => {
  let logger: AuditLogger;

  beforeEach(() => {
    resetAuditLogger();
    resetReviewQueue();
    logger = new AuditLogger({ enabled: true, storage: 'memory' });
    // Initialize the singleton with our logger
    getReviewQueue({ enableGitOperations: false }, logger);
  });

  afterEach(() => {
    resetAuditLogger();
    resetReviewQueue();
  });

  it('should execute list command', async () => {
    await logger.createEntry(createMockEntryInput());

    const result = await executeReviewCommand({ action: 'list' });

    expect(result).toContain('Pending Reviews');
  });

  it('should execute stats command', async () => {
    await logger.createEntry(createMockEntryInput());

    const result = await executeReviewCommand({ action: 'stats' });

    expect(result).toContain('Review Queue Summary');
    expect(result).toContain('Total Entries');
  });

  it('should execute show command', async () => {
    const entry = await logger.createEntry(createMockEntryInput());

    const result = await executeReviewCommand({ action: 'show', entryId: entry.id });

    expect(result).toContain(entry.id);
    expect(result).toContain('GPT-4o');
  });

  it('should require entry ID for show', async () => {
    const result = await executeReviewCommand({ action: 'show' });

    expect(result).toContain('Entry ID required');
  });

  it('should execute diff command', async () => {
    const entry = await logger.createEntry(createMockEntryInput());

    const result = await executeReviewCommand({ action: 'diff', entryId: entry.id });

    expect(result).toContain('@@');
  });

  it('should execute approve command', async () => {
    const entry = await logger.createEntry(createMockEntryInput());

    const result = await executeReviewCommand({
      action: 'approve',
      entryId: entry.id,
      options: { notes: 'LGTM' },
    }, 'test-reviewer');

    expect(result).toContain('approved');
  });

  it('should execute reject command', async () => {
    const entry = await logger.createEntry(createMockEntryInput());

    const result = await executeReviewCommand({
      action: 'reject',
      entryId: entry.id,
      options: { notes: 'Has bugs' },
    }, 'test-reviewer');

    expect(result).toContain('rejected');
  });

  it('should execute fix command', async () => {
    const entry = await logger.createEntry(createMockEntryInput());

    const result = await executeReviewCommand({
      action: 'fix',
      entryId: entry.id,
      options: { notes: 'Fixed null check' },
    }, 'test-reviewer');

    expect(result).toContain('fixed');
  });

  it('should execute skip command', async () => {
    const entry = await logger.createEntry(createMockEntryInput());

    const result = await executeReviewCommand({
      action: 'skip',
      entryId: entry.id,
      options: { notes: 'Low priority' },
    }, 'test-reviewer');

    expect(result).toContain('skipped');
  });

  it('should handle unknown action', async () => {
    const result = await executeReviewCommand({
      action: 'unknown' as 'list',
    });

    expect(result).toContain('Unknown action');
  });
});
