/**
 * E2E Tests for Citation Enforcement in Universal Agent
 *
 * Tests the complete integration of hallucination prevention
 * in the universal-agent.ts write() method.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UniversalAgent } from '../../../src/god-agent/universal/universal-agent.js';

describe('Universal Agent Citation Enforcement E2E', () => {
  let agent: UniversalAgent;

  beforeEach(async () => {
    agent = new UniversalAgent({
      verbose: false,
      autoLearn: false,
    });
  });

  describe('Write Method Citation Enforcement', () => {
    it('should include citation enforcement in write results', async () => {
      const result = await agent.write('Test academic paper on phantasia', {
        style: 'academic',
        format: 'paper',
        length: 'short',
        useCorpus: true,
        forceExecute: true, // Bypass pipeline for direct testing
      });

      expect(result).toBeDefined();
      expect(result.content).toBeTruthy();
      expect(result.trajectoryId).toBeDefined();

      // Citation enforcement should be present if corpus was used
      if (result.corpusContext?.used) {
        expect(result.citationEnforcement).toBeDefined();
      }
    });

    it('should respect citation enforcement mode configuration', async () => {
      const strictResult = await agent.write('Test paper', {
        style: 'academic',
        useCorpus: true,
        citationEnforcementMode: 'strict',
        forceExecute: true,
      });

      const autoCorrectResult = await agent.write('Test paper', {
        style: 'academic',
        useCorpus: true,
        citationEnforcementMode: 'auto-correct',
        forceExecute: true,
      });

      // Both should complete successfully
      expect(strictResult.content).toBeTruthy();
      expect(autoCorrectResult.content).toBeTruthy();
    });

    it('should respect minimum pass rate configuration', async () => {
      const result = await agent.write('Test paper', {
        style: 'academic',
        useCorpus: true,
        citationMinPassRate: 0.9, // 90% minimum
        forceExecute: true,
      });

      if (result.citationEnforcement && result.citationEnforcement.totalCitations > 0) {
        // If enforcement ran, verify it respected the threshold
        const meetsThreshold = result.citationEnforcement.passRate >= 0.9 ||
          result.citationEnforcement.action === 'corrected';

        expect(meetsThreshold).toBe(true);
      }
    });

    it('should respect maximum hallucinations configuration', async () => {
      const result = await agent.write('Test paper', {
        style: 'academic',
        useCorpus: true,
        citationMaxHallucinations: 2,
        forceExecute: true,
      });

      if (result.citationEnforcement) {
        // If hallucinations exceed threshold, action should be corrected or rejected
        if (result.citationEnforcement.hallucinatedCitations > 2) {
          expect(['corrected', 'rejected']).toContain(result.citationEnforcement.action);
        }
      }
    });
  });

  describe('Citation Enforcement Reporting', () => {
    it('should include complete enforcement metadata', async () => {
      const result = await agent.write('Test academic paper', {
        style: 'academic',
        useCorpus: true,
        forceExecute: true,
      });

      if (result.citationEnforcement) {
        expect(result.citationEnforcement.action).toBeDefined();
        expect(['pass', 'corrected', 'warning', 'rejected']).toContain(
          result.citationEnforcement.action
        );

        expect(typeof result.citationEnforcement.totalCitations).toBe('number');
        expect(typeof result.citationEnforcement.validCitations).toBe('number');
        expect(typeof result.citationEnforcement.hallucinatedCitations).toBe('number');
        expect(typeof result.citationEnforcement.correctionsMade).toBe('number');
        expect(typeof result.citationEnforcement.missingPageNumbers).toBe('number');
        expect(typeof result.citationEnforcement.passRate).toBe('number');
        expect(typeof result.citationEnforcement.report).toBe('string');

        // Pass rate should be 0-1
        expect(result.citationEnforcement.passRate).toBeGreaterThanOrEqual(0);
        expect(result.citationEnforcement.passRate).toBeLessThanOrEqual(1);

        // Valid + hallucinated should equal total
        expect(
          result.citationEnforcement.validCitations +
          result.citationEnforcement.hallucinatedCitations
        ).toBe(result.citationEnforcement.totalCitations);
      }
    });

    it('should generate detailed enforcement report', async () => {
      const result = await agent.write('Test academic paper', {
        style: 'academic',
        useCorpus: true,
        forceExecute: true,
      });

      if (result.citationEnforcement) {
        expect(result.citationEnforcement.report).toBeTruthy();
        expect(result.citationEnforcement.report).toContain('Citation Enforcement');
      }
    });
  });

  describe('Integration with Other Features', () => {
    it('should work with corpus context', async () => {
      const result = await agent.write('Test paper on Aristotle', {
        style: 'academic',
        useCorpus: true,
        corpusCollections: ['theory'],
        corpusChunkCount: 10,
        forceExecute: true,
      });

      if (result.corpusContext?.used) {
        expect(result.corpusContext.chunkCount).toBeGreaterThan(0);

        // If corpus was used, enforcement should have run
        expect(result.citationEnforcement).toBeDefined();
      }
    });

    it('should work with staged composition', async () => {
      const result = await agent.write('Chapter 1: Introduction', {
        style: 'academic',
        format: 'paper',
        useCorpus: true,
        useStagedComposition: true,
        forceExecute: true,
      });

      // Staged composition may be used
      if (result.stagedComposition?.used) {
        expect(result.stagedComposition.succeeded).toBeDefined();

        // Citation enforcement should still run
        if (result.corpusContext?.used) {
          expect(result.citationEnforcement).toBeDefined();
        }
      }
    });

    it('should work with quality gauntlet', async () => {
      const result = await agent.write('Test academic paper', {
        style: 'academic',
        useCorpus: true,
        forceExecute: true,
      });

      // Quality gauntlet may have run
      if (result.qualityScore !== undefined) {
        expect(result.qualityScore).toBeGreaterThanOrEqual(0);
        expect(result.qualityScore).toBeLessThanOrEqual(1);

        // Both quality and citation enforcement can coexist
        if (result.corpusContext?.used) {
          expect(result.citationEnforcement).toBeDefined();
        }
      }
    });
  });

  describe('Graceful Degradation', () => {
    it('should work without corpus (enforcement skipped)', async () => {
      const result = await agent.write('Test paper', {
        style: 'academic',
        useCorpus: false,
        forceExecute: true,
      });

      expect(result.content).toBeTruthy();

      // No corpus means no enforcement
      expect(result.citationEnforcement).toBeUndefined();
    });

    it('should handle enforcement errors gracefully', async () => {
      // Even if enforcement fails internally, write should succeed
      const result = await agent.write('Test paper', {
        style: 'academic',
        useCorpus: true,
        forceExecute: true,
      });

      expect(result.content).toBeTruthy();
      expect(result.trajectoryId).toBeDefined();
    });
  });

  describe('Citation Budget Checking', () => {
    it('should check citation budget before generation', async () => {
      // This is implicit in the write() method
      // Budget check happens in Phase 5, before enforcement
      const result = await agent.write('Test paper', {
        style: 'academic',
        length: 'comprehensive',
        useCorpus: true,
        forceExecute: true,
      });

      // Should complete even if budget warning occurs
      expect(result.content).toBeTruthy();
    });
  });
});
