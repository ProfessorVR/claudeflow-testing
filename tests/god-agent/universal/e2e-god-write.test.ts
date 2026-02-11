/**
 * End-to-End Integration Tests for god-write Features
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TieredValidator,
  createTieredValidator,
} from '../../../src/god-agent/__experimental__/tiered-validation.js';
import {
  ContextManager,
  createContextManager,
} from '../../../src/god-agent/universal/context-manager.js';
import {
  ProvenanceLedger,
  createProvenanceLedger,
} from '../../../src/god-agent/__experimental__/provenance-ledger.js';
import {
  StyleDriftDetector,
  createStyleDriftDetector,
} from '../../../src/god-agent/__experimental__/style-drift-detector.js';
import type { StyleCharacteristics } from '../../../src/god-agent/universal/style-analyzer.js';

describe('E2E: god-write Feature Integration', () => {
  describe('Complete Write Workflow', () => {
    it('should validate, track context, and check provenance', async () => {
      // Setup components
      const validator = createTieredValidator();
      const contextManager = createContextManager({ maxTokens: 50000 });
      const ledger = createProvenanceLedger();

      // Simulate a write operation
      const content = `
        Artificial intelligence has revolutionized natural language processing.
        Modern language models can understand context and generate human-like text.
        This capability has numerous applications in industry and research.
        However, challenges remain in ensuring ethical AI deployment.
      `.trim();

      // Track context usage
      const inputTokens = ContextManager.estimateTokens('Research AI and write about NLP');
      const outputTokens = ContextManager.estimateTokens(content);
      contextManager.trackUsage('write-1', 'write', inputTokens, outputTokens);

      // Validate content
      const validation = await validator.validateAll({ content });
      expect(validation).toHaveProperty('passed');
      expect(validation).toHaveProperty('overallScore');

      // Track provenance
      const sourceId = ledger.addSource({
        type: 'research',
        title: 'AI Research Paper',
        accessDate: new Date().toISOString(),
        confidence: 0.9,
      });

      ledger.addClaim(
        'AI has revolutionized NLP',
        { paragraph: 0, startChar: 0, endChar: 50 },
        [sourceId]
      );

      // Verify integration
      const health = contextManager.getHealth();
      expect(health.currentTokens).toBeGreaterThan(0);

      const completeness = ledger.getCitationCompleteness();
      expect(completeness).toBeGreaterThan(0);

      expect(validation.totalIssues).toBeGreaterThanOrEqual(0);
    });

    it('should handle multiple write operations with drift detection', async () => {
      const targetStyle: StyleCharacteristics = {
        avgSentenceLength: 15,
        avgWordLength: 5,
        avgParagraphLength: 4,
        formalityScore: 0.8,
        vocabularyRichness: 0.6,
        toneMarkers: [],
      };

      const driftDetector = createStyleDriftDetector(targetStyle);
      const contextManager = createContextManager();
      const validator = createTieredValidator();

      // Simulate multiple writes
      const writes = [
        'This is the first formal academic document about AI research.',
        'The second document continues the formal academic tone and style.',
        'A third document maintains consistency across all sections.',
      ];

      for (let i = 0; i < writes.length; i++) {
        const content = writes[i];

        // Track tokens
        contextManager.trackUsage(`write-${i}`, 'write', 100, 50);

        // Validate
        const validation = await validator.validateAll({ content });
        expect(validation.passed).toBeDefined();

        // Check drift
        const drift = await driftDetector.detectDrift(content, `doc-${i}`);
        expect(drift.score).toBeGreaterThanOrEqual(0);
        expect(drift.score).toBeLessThanOrEqual(1);
      }

      // Check overall health
      const health = contextManager.getHealth();
      expect(health.totalOperations).toBe(3);

      const avgDrift = driftDetector.getAverageDrift();
      expect(avgDrift).toBeGreaterThanOrEqual(0);
    });

    it('should handle context overflow scenario', async () => {
      const manager = createContextManager({ maxTokens: 1000 });

      // Fill context to warning level
      manager.trackUsage('op-1', 'write', 400, 200);
      manager.trackUsage('op-2', 'research', 200, 100);

      let health = manager.getHealth();
      expect(health.status).not.toBe('healthy'); // Could be warning or critical
      expect(health.needsSummarization).toBe(true);

      // Prune context
      manager.pruneContext('oldest-first', 0.5);

      health = manager.getHealth();
      expect(health.currentTokens).toBeLessThanOrEqual(500);
    });

    it('should integrate provenance with validation', async () => {
      const validator = createTieredValidator();
      const ledger = createProvenanceLedger();

      const content = `
        Machine learning algorithms require large datasets for training.
        Deep neural networks have shown remarkable performance.
        Transfer learning enables efficient model adaptation.
      `.trim();

      // Validate
      const validation = await validator.validateAll({ content });

      // Add provenance for each claim
      const sourceId = ledger.addSource({
        type: 'research',
        title: 'ML Research',
        accessDate: new Date().toISOString(),
        confidence: 0.85,
      });

      const sentences = content.split('.').filter(s => s.trim());
      sentences.forEach((sentence, i) => {
        ledger.addClaim(
          sentence.trim(),
          { paragraph: 0, sentence: i, startChar: 0, endChar: sentence.length },
          i < 2 ? [sourceId] : [] // Leave last one uncited
        );
      });

      // Check integration
      const completeness = ledger.getCitationCompleteness();
      expect(completeness).toBeGreaterThan(0.5); // 2/3 cited

      const uncited = ledger.getUncitedClaims();
      expect(uncited).toHaveLength(1);

      expect(validation.passed).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty content', async () => {
      const validator = createTieredValidator();
      const validation = await validator.validateAll({ content: '' });

      expect(validation.passed).toBeDefined();
      expect(validation.totalIssues).toBeGreaterThan(0); // Should have issues
    });

    it('should handle very long content', async () => {
      const validator = createTieredValidator();
      const content = Array(100).fill('This is a test sentence.').join(' ');

      const validation = await validator.validateAll({ content });
      expect(validation.passed).toBeDefined();
      expect(validation.totalDurationMs).toBeGreaterThanOrEqual(0);
    });

    it('should handle context reset', () => {
      const manager = createContextManager();

      manager.trackUsage('op-1', 'write', 1000, 500);
      manager.trackUsage('op-2', 'research', 500, 300);

      manager.reset();

      const health = manager.getHealth();
      expect(health.currentTokens).toBe(0);
      expect(health.totalOperations).toBe(0);
    });

    it('should handle ledger import/export', () => {
      const ledger = createProvenanceLedger();

      const sourceId = ledger.addSource({
        type: 'research',
        title: 'Test',
        accessDate: new Date().toISOString(),
        confidence: 0.9,
      });

      ledger.addClaim('Test claim', { paragraph: 0, startChar: 0, endChar: 10 }, [sourceId]);

      const exported = ledger.exportData();
      expect(exported.sources).toHaveLength(1);
      expect(exported.claims).toHaveLength(1);

      const newLedger = createProvenanceLedger();
      newLedger.importData(exported);

      expect(newLedger.getAllSources()).toHaveLength(1);
      expect(newLedger.getAllClaims()).toHaveLength(1);
    });
  });

  describe('Performance Tests', () => {
    it('should handle rapid validation calls', async () => {
      const validator = createTieredValidator();
      const content = 'Test content for performance validation.';

      const startTime = Date.now();

      const promises = Array(10).fill(0).map((_, i) =>
        validator.validateAll({ content: `${content} Version ${i}` })
      );

      const results = await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle large context tracking', () => {
      const manager = createContextManager({ maxTokens: 100000 });

      const startTime = Date.now();

      for (let i = 0; i < 1000; i++) {
        manager.trackUsage(`op-${i}`, 'write', 50, 30);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      const health = manager.getHealth();
      expect(health.totalOperations).toBe(1000);
      expect(duration).toBeLessThan(1000); // Should be fast
    });

    it('should handle large provenance graphs', () => {
      const ledger = createProvenanceLedger();

      // Create many sources and claims
      const sourceIds: string[] = [];
      for (let i = 0; i < 50; i++) {
        const sourceId = ledger.addSource({
          type: 'research',
          title: `Source ${i}`,
          accessDate: new Date().toISOString(),
          confidence: 0.8,
        });
        sourceIds.push(sourceId);
      }

      for (let i = 0; i < 100; i++) {
        const randomSources = sourceIds.slice(i % sourceIds.length, (i % sourceIds.length) + 3);
        ledger.addClaim(
          `Claim ${i}`,
          { paragraph: i, startChar: 0, endChar: 10 },
          randomSources
        );
      }

      const completeness = ledger.getCitationCompleteness();
      expect(completeness).toBeGreaterThan(0.5);

      const report = ledger.generateReport();
      expect(report).toContain('100');
    });
  });
});
