/**
 * Audit Logger Tests
 *
 * Tests for TIER-2.1: Intelligent Model Router - Audit Layer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AuditLogger,
  getAuditLogger,
  initializeAuditLogger,
  resetAuditLogger,
  createFileModification,
  generateDiffSummary,
  generateFullDiff,
  formatAuditEntry,
} from '../../../../src/god-agent/core/router/audit-logger.js';
import type {
  CreateAuditEntryInput,
  FileModification,
  AuditEntry,
  ReviewStatus,
} from '../../../../src/god-agent/core/router/audit-types.js';

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
      },
    ],
    diffSummary: '1 file changed, 5 insertions(+), 3 deletions(-)',
    fullDiff: '@@ -10,3 +10,5 @@\n-old line\n+new line',
    tags: ['bug-fix'],
    ...overrides,
  };
}

describe('AuditLogger', () => {
  let logger: AuditLogger;

  beforeEach(() => {
    resetAuditLogger();
    logger = new AuditLogger({ enabled: true, storage: 'memory' });
  });

  afterEach(() => {
    resetAuditLogger();
  });

  describe('Audit Decision', () => {
    it('should audit non-Anthropic providers by default', () => {
      expect(logger.shouldAudit('openai')).toBe(true);
      expect(logger.shouldAudit('ollama')).toBe(true);
      expect(logger.shouldAudit('custom')).toBe(true);
    });

    it('should not audit Anthropic by default', () => {
      expect(logger.shouldAudit('anthropic')).toBe(false);
    });

    it('should respect neverAudit config', () => {
      const customLogger = new AuditLogger({
        enabled: true,
        neverAudit: ['openai', 'ollama'],
      });

      expect(customLogger.shouldAudit('openai')).toBe(false);
      expect(customLogger.shouldAudit('ollama')).toBe(false);
    });

    it('should respect alwaysAudit config', () => {
      const customLogger = new AuditLogger({
        enabled: true,
        alwaysAudit: ['anthropic'],
        neverAudit: [],
      });

      expect(customLogger.shouldAudit('anthropic')).toBe(true);
    });

    it('should not audit when disabled', () => {
      const disabledLogger = new AuditLogger({ enabled: false });

      expect(disabledLogger.shouldAudit('openai')).toBe(false);
      expect(disabledLogger.shouldAudit('ollama')).toBe(false);
    });

    it('should skip specified task types', () => {
      const customLogger = new AuditLogger({
        enabled: true,
        skipTaskTypes: ['research', 'writing'],
      });

      expect(customLogger.shouldAudit('openai', 'research')).toBe(false);
      expect(customLogger.shouldAudit('openai', 'writing')).toBe(false);
      expect(customLogger.shouldAudit('openai', 'code_edit')).toBe(true);
    });
  });

  describe('Entry Creation', () => {
    it('should create an audit entry', async () => {
      const input = createMockEntryInput();
      const entry = await logger.createEntry(input);

      expect(entry.id).toBeDefined();
      expect(entry.timestamp).toBeInstanceOf(Date);
      expect(entry.reviewStatus).toBe('pending');
      expect(entry.provider).toBe('openai');
      expect(entry.modelName).toBe('GPT-4o');
    });

    it('should assign ID and timestamp', async () => {
      const entry = await logger.createEntry(createMockEntryInput());

      expect(entry.id.length).toBeGreaterThan(0);
      expect(entry.timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });

    it('should calculate priority based on risk', async () => {
      const highRisk = await logger.createEntry(
        createMockEntryInput({ riskLevel: 'high', complexity: 'complex' })
      );
      const lowRisk = await logger.createEntry(
        createMockEntryInput({ riskLevel: 'low', complexity: 'simple' })
      );

      // High risk should have higher priority
      const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
      expect(priorityOrder[highRisk.priority]).toBeGreaterThanOrEqual(
        priorityOrder[lowRisk.priority]
      );
    });

    it('should calculate priority based on file count', async () => {
      const manyFiles = await logger.createEntry(
        createMockEntryInput({
          filesModified: Array(10).fill(null).map((_, i) => ({
            filePath: `src/file${i}.ts`,
            modificationType: 'modified' as const,
            linesAdded: 10,
            linesRemoved: 5,
            diff: '+added',
          })),
        })
      );

      expect(['high', 'critical']).toContain(manyFiles.priority);
    });

    it('should store entry for retrieval', async () => {
      const entry = await logger.createEntry(createMockEntryInput());
      const retrieved = logger.getEntry(entry.id);

      expect(retrieved).toEqual(entry);
    });
  });

  describe('Entry Update', () => {
    it('should update entry fields', async () => {
      const entry = await logger.createEntry(createMockEntryInput());

      const updated = await logger.updateEntry(entry.id, {
        reviewStatus: 'approved',
        reviewedBy: 'user',
        reviewNotes: 'Looks good',
      });

      expect(updated?.reviewStatus).toBe('approved');
      expect(updated?.reviewedBy).toBe('user');
      expect(updated?.reviewNotes).toBe('Looks good');
    });

    it('should return null for non-existent entry', async () => {
      const result = await logger.updateEntry('non-existent', {
        reviewStatus: 'approved',
      });

      expect(result).toBeNull();
    });

    it('should update reviewedAt timestamp', async () => {
      const entry = await logger.createEntry(createMockEntryInput());
      const reviewedAt = new Date();

      await logger.updateEntry(entry.id, {
        reviewStatus: 'approved',
        reviewedAt,
      });

      const updated = logger.getEntry(entry.id);
      expect(updated?.reviewedAt).toEqual(reviewedAt);
    });
  });

  describe('Entry Query', () => {
    beforeEach(async () => {
      // Create various entries
      await logger.createEntry(createMockEntryInput({
        provider: 'openai',
        taskType: 'code_edit',
        riskLevel: 'low',
      }));
      await logger.createEntry(createMockEntryInput({
        provider: 'ollama',
        taskType: 'refactor',
        riskLevel: 'high',
      }));
      await logger.createEntry(createMockEntryInput({
        provider: 'openai',
        taskType: 'debug',
        riskLevel: 'medium',
      }));
    });

    it('should query by provider', () => {
      const openaiEntries = logger.queryEntries({ provider: 'openai' });
      expect(openaiEntries).toHaveLength(2);
      expect(openaiEntries.every(e => e.provider === 'openai')).toBe(true);
    });

    it('should query by task type', () => {
      const refactorEntries = logger.queryEntries({ taskType: 'refactor' });
      expect(refactorEntries).toHaveLength(1);
      expect(refactorEntries[0].taskType).toBe('refactor');
    });

    it('should query by status', async () => {
      const entries = logger.queryEntries({});
      await logger.updateEntry(entries[0].id, { reviewStatus: 'approved' });

      const pending = logger.queryEntries({ status: 'pending' });
      const approved = logger.queryEntries({ status: 'approved' });

      expect(pending).toHaveLength(2);
      expect(approved).toHaveLength(1);
    });

    it('should query with multiple filters', () => {
      const results = logger.queryEntries({
        provider: 'openai',
        taskType: 'code_edit',
      });

      expect(results).toHaveLength(1);
      expect(results[0].provider).toBe('openai');
      expect(results[0].taskType).toBe('code_edit');
    });

    it('should apply limit', () => {
      const results = logger.queryEntries({ limit: 2 });
      expect(results).toHaveLength(2);
    });

    it('should apply offset', () => {
      const all = logger.queryEntries({});
      const withOffset = logger.queryEntries({ offset: 1 });

      expect(withOffset).toHaveLength(all.length - 1);
    });

    it('should sort by timestamp', () => {
      const desc = logger.queryEntries({ sortBy: 'timestamp', sortOrder: 'desc' });
      const asc = logger.queryEntries({ sortBy: 'timestamp', sortOrder: 'asc' });

      expect(desc[0].timestamp.getTime()).toBeGreaterThanOrEqual(
        desc[desc.length - 1].timestamp.getTime()
      );
      expect(asc[0].timestamp.getTime()).toBeLessThanOrEqual(
        asc[asc.length - 1].timestamp.getTime()
      );
    });

    it('should search in prompt text', async () => {
      await logger.createEntry(createMockEntryInput({
        originalPrompt: 'Fix the authentication bug in JWT validation',
      }));

      const results = logger.queryEntries({ searchText: 'JWT' });
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].originalPrompt).toContain('JWT');
    });
  });

  describe('Queue Statistics', () => {
    beforeEach(async () => {
      await logger.createEntry(createMockEntryInput({ riskLevel: 'high' }));
      await logger.createEntry(createMockEntryInput({ riskLevel: 'low' }));
      await logger.createEntry(createMockEntryInput({ provider: 'ollama' }));
    });

    it('should return total entry count', () => {
      const stats = logger.getQueueStats();
      expect(stats.totalEntries).toBe(3);
    });

    it('should count by status', () => {
      const stats = logger.getQueueStats();
      expect(stats.byStatus.pending).toBe(3);
      expect(stats.byStatus.approved).toBe(0);
    });

    it('should count by provider', () => {
      const stats = logger.getQueueStats();
      expect(stats.byProvider.openai).toBe(2);
      expect(stats.byProvider.ollama).toBe(1);
    });

    it('should count files and lines', () => {
      const stats = logger.getQueueStats();
      expect(stats.totalFilesModified).toBe(3); // 1 file per entry
      expect(stats.totalLinesChanged).toBeGreaterThan(0);
    });

    it('should track oldest pending', async () => {
      const stats = logger.getQueueStats();
      expect(stats.oldestPending).toBeInstanceOf(Date);
    });
  });

  describe('Event Handling', () => {
    it('should emit entry_created event', async () => {
      const handler = vi.fn();
      logger.on('entry_created', handler);

      await logger.createEntry(createMockEntryInput());

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].type).toBe('entry_created');
    });

    it('should emit entry_updated event', async () => {
      const handler = vi.fn();
      logger.on('entry_updated', handler);

      const entry = await logger.createEntry(createMockEntryInput());
      await logger.updateEntry(entry.id, { reviewStatus: 'approved' });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].type).toBe('entry_updated');
    });

    it('should remove event handler', async () => {
      const handler = vi.fn();
      logger.on('entry_created', handler);
      logger.off('entry_created', handler);

      await logger.createEntry(createMockEntryInput());

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('Session Management', () => {
    it('should track session ID', () => {
      const sessionId = logger.getSessionId();
      expect(sessionId).toBeDefined();
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should allow setting session ID', () => {
      logger.setSessionId('custom-session');
      expect(logger.getSessionId()).toBe('custom-session');
    });
  });

  describe('Export/Import', () => {
    it('should export to JSON', async () => {
      await logger.createEntry(createMockEntryInput());
      await logger.createEntry(createMockEntryInput());

      const json = logger.exportToJson();
      const parsed = JSON.parse(json);

      expect(parsed).toHaveLength(2);
    });

    it('should import from JSON', async () => {
      const entry = await logger.createEntry(createMockEntryInput());
      const json = logger.exportToJson();

      logger.clear();
      expect(logger.getEntry(entry.id)).toBeUndefined();

      const imported = logger.importFromJson(json);
      expect(imported).toBe(1);
      expect(logger.getEntry(entry.id)).toBeDefined();
    });
  });
});

describe('Singleton Pattern', () => {
  beforeEach(() => {
    resetAuditLogger();
  });

  afterEach(() => {
    resetAuditLogger();
  });

  it('should return same instance', () => {
    const logger1 = getAuditLogger();
    const logger2 = getAuditLogger();
    expect(logger1).toBe(logger2);
  });

  it('should reset singleton', () => {
    const logger1 = getAuditLogger();
    resetAuditLogger();
    const logger2 = getAuditLogger();
    expect(logger1).not.toBe(logger2);
  });
});

describe('Utility Functions', () => {
  describe('createFileModification', () => {
    it('should create file modification from diff', () => {
      const diff = `@@ -10,3 +10,5 @@
-old line 1
-old line 2
+new line 1
+new line 2
+new line 3`;

      const mod = createFileModification('src/file.ts', diff, 'modified');

      expect(mod.filePath).toBe('src/file.ts');
      expect(mod.modificationType).toBe('modified');
      expect(mod.linesAdded).toBe(3);
      expect(mod.linesRemoved).toBe(2);
      expect(mod.diff).toBe(diff);
    });

    it('should handle empty diff', () => {
      const mod = createFileModification('src/empty.ts', '', 'created');

      expect(mod.linesAdded).toBe(0);
      expect(mod.linesRemoved).toBe(0);
    });
  });

  describe('generateDiffSummary', () => {
    it('should generate summary from file modifications', () => {
      const files: FileModification[] = [
        {
          filePath: 'src/a.ts',
          modificationType: 'modified',
          linesAdded: 10,
          linesRemoved: 5,
          diff: '',
        },
        {
          filePath: 'src/b.ts',
          modificationType: 'created',
          linesAdded: 20,
          linesRemoved: 0,
          diff: '',
        },
      ];

      const summary = generateDiffSummary(files);

      expect(summary).toContain('2 file(s) changed');
      expect(summary).toContain('30 insertion(s)');
      expect(summary).toContain('5 deletion(s)');
      expect(summary).toContain('[MOD] src/a.ts');
      expect(summary).toContain('[NEW] src/b.ts');
    });
  });

  describe('generateFullDiff', () => {
    it('should combine all diffs', () => {
      const files: FileModification[] = [
        { filePath: 'a.ts', modificationType: 'modified', linesAdded: 1, linesRemoved: 0, diff: 'diff a' },
        { filePath: 'b.ts', modificationType: 'modified', linesAdded: 1, linesRemoved: 0, diff: 'diff b' },
      ];

      const fullDiff = generateFullDiff(files);

      expect(fullDiff).toContain('diff a');
      expect(fullDiff).toContain('diff b');
    });
  });

  describe('formatAuditEntry', () => {
    it('should format entry for display', async () => {
      const logger = new AuditLogger({ enabled: true, storage: 'memory' });
      const entry = await logger.createEntry(createMockEntryInput());

      const formatted = formatAuditEntry(entry);

      expect(formatted).toContain(entry.id);
      expect(formatted).toContain('GPT-4o');
      expect(formatted).toContain('code_edit');
      expect(formatted).toContain('pending');
    });
  });
});
