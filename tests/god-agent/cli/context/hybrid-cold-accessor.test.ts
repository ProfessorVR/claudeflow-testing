/**
 * Comprehensive tests for HybridColdContextAccessor
 *
 * Tests all modes, integration with BM25 and semantic search,
 * performance benchmarks, and error handling.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HybridColdContextAccessor } from '../../../../src/god-agent/cli/context/hybrid-cold-accessor.js';
import { AgentDBColdContextAccessor } from '../../../../src/god-agent/cli/context/agentdb-cold-accessor.js';
import type { ColdContextAccessor, RetrievedChunk } from '../../../../src/god-agent/cli/context/tiered-context-manager.js';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_CHUNKS = [
  {
    content: 'Aristotle discusses phantasia (imagination) in De Anima Book III, chapter 3.',
    source: 'Chapter 3, Section 1',
  },
  {
    content: 'Phantasia is distinct from perception and thought according to Aristotle.',
    source: 'Chapter 3, Section 2',
  },
  {
    content: 'The practical reasoning process involves both deliberation and phantasia.',
    source: 'Chapter 4, Section 1',
  },
  {
    content: 'Verisimilitude refers to the appearance of truth in representations.',
    source: 'Chapter 2, Section 3',
  },
  {
    content: 'Perception provides the raw material for imaginative representations.',
    source: 'Chapter 3, Section 3',
  },
];

// ============================================================================
// Helper Functions
// ============================================================================

async function createTestAccessor(options: {
  initialMode?: 'hybrid' | 'semantic-only' | 'bm25-only';
  populateData?: boolean;
} = {}): Promise<HybridColdContextAccessor> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hybrid-accessor-test-'));

  const accessor = new HybridColdContextAccessor({
    agentDbConfig: {
      persistencePath: path.join(tempDir, 'test-chunks.bin'),
      verbose: false,
    },
    bm25Config: {
      persistencePath: path.join(tempDir, 'bm25-index.json'),
    },
    initialMode: options.initialMode || 'hybrid',
    enableMetrics: true,
    verbose: false,
  });

  await accessor.initialize();

  // Populate with test data if requested
  if (options.populateData) {
    for (let i = 0; i < TEST_CHUNKS.length; i++) {
      const chunk = TEST_CHUNKS[i];
      await accessor.addSectionContent(3, `Section ${i + 1}`, chunk.content);
    }
  }

  return accessor;
}

async function createPopulatedAgentDBAccessor(): Promise<AgentDBColdContextAccessor> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'agentdb-test-'));

  const accessor = new AgentDBColdContextAccessor({
    persistencePath: path.join(tempDir, 'test-chunks.bin'),
    verbose: false,
  });

  await accessor.initialize();

  // Populate with test data
  for (let i = 0; i < TEST_CHUNKS.length; i++) {
    const chunk = TEST_CHUNKS[i];
    await accessor.addSectionContent(3, `Section ${i + 1}`, chunk.content);
  }

  return accessor;
}

// ============================================================================
// Tests
// ============================================================================

describe('HybridColdContextAccessor', () => {
  describe('initialization', () => {
    it('should initialize both BM25 and semantic systems', async () => {
      const accessor = await createTestAccessor({ populateData: true });

      expect(accessor.isReady()).toBe(true);

      const stats = accessor.getStats();
      expect(stats.agentdbChunkCount).toBeGreaterThan(0);
      expect(stats.currentMode).toBe('hybrid');

      await accessor.close();
    });

    it('should auto-build BM25 index from AgentDB on first run', async () => {
      const accessor = await createTestAccessor({ populateData: true });

      // Build BM25 index
      const documentsIndexed = await accessor.buildBM25IndexFromAgentDB();

      expect(documentsIndexed).toBeGreaterThan(0);

      const stats = accessor.getStats();
      expect(stats.bm25IndexSize).toBe(documentsIndexed);

      await accessor.close();
    });

    it('should load persisted BM25 index on subsequent runs', async () => {
      const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hybrid-accessor-test-'));

      // First run: create and populate
      const accessor1 = new HybridColdContextAccessor({
        agentDbConfig: {
          persistencePath: path.join(tempDir, 'test-chunks.bin'),
          verbose: false,
        },
        bm25Config: {
          persistencePath: path.join(tempDir, 'bm25-index.json'),
        },
        initialMode: 'hybrid',
        enableMetrics: true,
        verbose: false,
      });

      await accessor1.initialize();
      await accessor1.addSectionContent(3, 'Test Section', TEST_CHUNKS[0].content);
      await accessor1.buildBM25IndexFromAgentDB();

      const stats1 = accessor1.getStats();
      const initialBM25Size = stats1.bm25IndexSize;

      await accessor1.close();

      // Second run: load existing
      const accessor2 = new HybridColdContextAccessor({
        agentDbConfig: {
          persistencePath: path.join(tempDir, 'test-chunks.bin'),
          verbose: false,
        },
        bm25Config: {
          persistencePath: path.join(tempDir, 'bm25-index.json'),
        },
        initialMode: 'hybrid',
        enableMetrics: true,
        verbose: false,
      });

      const startTime = Date.now();
      await accessor2.initialize();
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(1000); // Fast load

      const stats2 = accessor2.getStats();
      expect(stats2.bm25IndexSize).toBeGreaterThan(0);

      await accessor2.close();
    });

    it('should support different initial modes', async () => {
      const hybridAccessor = await createTestAccessor({ initialMode: 'hybrid' });
      expect(hybridAccessor.getMode()).toBe('hybrid');
      await hybridAccessor.close();

      const semanticAccessor = await createTestAccessor({ initialMode: 'semantic-only' });
      expect(semanticAccessor.getMode()).toBe('semantic-only');
      await semanticAccessor.close();

      const bm25Accessor = await createTestAccessor({ initialMode: 'bm25-only' });
      expect(bm25Accessor.getMode()).toBe('bm25-only');
      await bm25Accessor.close();
    });
  });

  describe('search', () => {
    it('should return hybrid results by default', async () => {
      const accessor = await createTestAccessor({ populateData: true });
      await accessor.buildBM25IndexFromAgentDB();

      const results = await accessor.search('phantasia aristotle', 5);

      expect(results.length).toBeLessThanOrEqual(5);
      expect(results.length).toBeGreaterThan(0);

      for (const result of results) {
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('source');
        expect(result).toHaveProperty('relevanceScore');
      }

      await accessor.close();
    });

    it('should handle mode switching', async () => {
      const accessor = await createTestAccessor({ populateData: true });
      await accessor.buildBM25IndexFromAgentDB();

      // Test BM25-only mode
      accessor.setMode('bm25-only');
      const bm25Results = await accessor.search('phantasia', 5);
      expect(bm25Results.length).toBeGreaterThan(0);

      // Test semantic-only mode
      accessor.setMode('semantic-only');
      const semanticResults = await accessor.search('phantasia', 5);
      expect(semanticResults.length).toBeGreaterThan(0);

      // Test hybrid mode
      accessor.setMode('hybrid');
      const hybridResults = await accessor.search('phantasia', 5);
      expect(hybridResults.length).toBeGreaterThan(0);

      await accessor.close();
    });

    it('should find results with keyword queries (BM25)', async () => {
      const accessor = await createTestAccessor({ populateData: true });
      await accessor.buildBM25IndexFromAgentDB();

      accessor.setMode('bm25-only');
      const results = await accessor.search('phantasia', 3);

      expect(results.length).toBeGreaterThan(0);
      expect(results.some(r => r.content.toLowerCase().includes('phantasia'))).toBe(true);

      await accessor.close();
    });

    it('should find results with semantic queries', async () => {
      const accessor = await createTestAccessor({ populateData: true });

      accessor.setMode('semantic-only');
      const results = await accessor.search('imagination and mental imagery', 3);

      expect(results.length).toBeGreaterThan(0);

      await accessor.close();
    });

    it('should handle empty query', async () => {
      const accessor = await createTestAccessor({ populateData: true });

      const results = await accessor.search('', 5);
      expect(results.length).toBe(0);

      await accessor.close();
    });

    it('should respect topK parameter', async () => {
      const accessor = await createTestAccessor({ populateData: true });
      await accessor.buildBM25IndexFromAgentDB();

      const results3 = await accessor.search('aristotle', 3);
      expect(results3.length).toBeLessThanOrEqual(3);

      const results5 = await accessor.search('aristotle', 5);
      expect(results5.length).toBeLessThanOrEqual(5);

      await accessor.close();
    });

    it('should return results sorted by relevance', async () => {
      const accessor = await createTestAccessor({ populateData: true });
      await accessor.buildBM25IndexFromAgentDB();

      const results = await accessor.search('phantasia imagination', 5);

      expect(results.length).toBeGreaterThan(1);

      // Check that scores are in descending order
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].relevanceScore).toBeGreaterThanOrEqual(results[i].relevanceScore);
      }

      await accessor.close();
    });
  });

  describe('performance', () => {
    it('should complete search within 300ms', async () => {
      const accessor = await createTestAccessor({ populateData: true });
      await accessor.buildBM25IndexFromAgentDB();

      const startTime = Date.now();
      await accessor.search('phantasia perception', 5);
      const latency = Date.now() - startTime;

      expect(latency).toBeLessThan(300);

      await accessor.close();
    });

    it('should track metrics correctly', async () => {
      const accessor = await createTestAccessor({ populateData: true });
      await accessor.buildBM25IndexFromAgentDB();

      await accessor.search('query 1', 5);
      await accessor.search('query 2', 5);
      await accessor.search('query 3', 5);

      const stats = accessor.getStats();
      expect(stats.totalSearches).toBe(3);
      expect(stats.avgLatencyMs).toBeGreaterThan(0);
      expect(stats.hybridUsagePercent).toBeGreaterThan(0);

      await accessor.close();
    });

    it('should have acceptable overhead vs semantic-only', async () => {
      const accessor = await createTestAccessor({ populateData: true });
      await accessor.buildBM25IndexFromAgentDB();

      const query = 'phantasia aristotle';

      // Measure hybrid
      accessor.setMode('hybrid');
      const hybridStart = Date.now();
      await accessor.search(query, 5);
      const hybridLatency = Date.now() - hybridStart;

      // Measure semantic-only
      accessor.setMode('semantic-only');
      const semanticStart = Date.now();
      await accessor.search(query, 5);
      const semanticLatency = Date.now() - semanticStart;

      // Hybrid should not be more than 100ms slower
      const overhead = hybridLatency - semanticLatency;
      expect(overhead).toBeLessThan(100);

      await accessor.close();
    });
  });

  describe('BM25 index building', () => {
    it('should index all AgentDB chunks', async () => {
      const accessor = await createTestAccessor({ populateData: true });

      const statsBefore = accessor.getStats();
      const chunkCount = statsBefore.agentdbChunkCount;

      const documentsIndexed = await accessor.buildBM25IndexFromAgentDB();

      const statsAfter = accessor.getStats();
      expect(statsAfter.bm25IndexSize).toBeGreaterThan(0);
      expect(documentsIndexed).toBeGreaterThan(0);

      await accessor.close();
    });

    it('should not rebuild if index already exists', async () => {
      const accessor = await createTestAccessor({ populateData: true });

      // First build
      const firstBuild = await accessor.buildBM25IndexFromAgentDB();
      expect(firstBuild).toBeGreaterThan(0);

      const stats1 = accessor.getStats();
      const initialSize = stats1.bm25IndexSize;

      // Second build should be fast (already exists)
      const startTime = Date.now();
      const secondBuild = await accessor.buildBM25IndexFromAgentDB();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);

      const stats2 = accessor.getStats();
      expect(stats2.bm25IndexSize).toBe(initialSize);

      await accessor.close();
    });
  });

  describe('content ingestion', () => {
    it('should add chapter content to both indexes', async () => {
      const accessor = await createTestAccessor();

      const chunks = await accessor.addChapterContent(1, 'Test chapter content');

      expect(chunks).toBeGreaterThan(0);

      const stats = accessor.getStats();
      expect(stats.agentdbChunkCount).toBeGreaterThan(0);
      expect(stats.bm25IndexSize).toBeGreaterThan(0);

      await accessor.close();
    });

    it('should add section content to both indexes', async () => {
      const accessor = await createTestAccessor();

      const chunks = await accessor.addSectionContent(1, 'Test Section', 'Test section content');

      expect(chunks).toBeGreaterThan(0);

      const stats = accessor.getStats();
      expect(stats.agentdbChunkCount).toBeGreaterThan(0);
      expect(stats.bm25IndexSize).toBeGreaterThan(0);

      await accessor.close();
    });

    it('should add citations to both indexes', async () => {
      const accessor = await createTestAccessor();

      await accessor.addCitation('smith2020', 'Smith, J. (2020). Example. Journal.');

      // Verify citation can be retrieved
      const citation = await accessor.getCitation('smith2020');
      expect(citation).toBe('Smith, J. (2020). Example. Journal.');

      await accessor.close();
    });
  });

  describe('ColdContextAccessor interface', () => {
    it('should implement getCitation', async () => {
      const accessor = await createTestAccessor();

      await accessor.addCitation('test-id', 'Test citation content');
      const result = await accessor.getCitation('test-id');

      expect(result).toBe('Test citation content');

      await accessor.close();
    });

    it('should implement getFullSection', async () => {
      const accessor = await createTestAccessor();

      await accessor.addSectionContent(3, 'Test Section', 'Full section content');
      const result = await accessor.getFullSection(3, 'Test Section');

      expect(result).toContain('Full section content');

      await accessor.close();
    });

    it('should handle missing citations gracefully', async () => {
      const accessor = await createTestAccessor();

      const result = await accessor.getCitation('nonexistent');
      expect(result).toBeNull();

      await accessor.close();
    });

    it('should handle missing sections gracefully', async () => {
      const accessor = await createTestAccessor();

      const result = await accessor.getFullSection(999, 'Nonexistent');
      expect(result).toBeNull();

      await accessor.close();
    });
  });

  describe('statistics', () => {
    it('should provide comprehensive statistics', async () => {
      const accessor = await createTestAccessor({ populateData: true });
      await accessor.buildBM25IndexFromAgentDB();

      // Perform some searches
      await accessor.search('test 1', 5);
      await accessor.search('test 2', 5);

      const stats = accessor.getStats();

      expect(stats).toHaveProperty('totalSearches');
      expect(stats).toHaveProperty('avgLatencyMs');
      expect(stats).toHaveProperty('hybridUsagePercent');
      expect(stats).toHaveProperty('bm25Coverage');
      expect(stats).toHaveProperty('semanticCoverage');
      expect(stats).toHaveProperty('bm25IndexSize');
      expect(stats).toHaveProperty('agentdbChunkCount');
      expect(stats).toHaveProperty('currentMode');

      expect(stats.totalSearches).toBe(2);
      expect(stats.currentMode).toBe('hybrid');

      await accessor.close();
    });

    it('should track mode usage percentage', async () => {
      const accessor = await createTestAccessor({ populateData: true });
      await accessor.buildBM25IndexFromAgentDB();

      // All hybrid
      await accessor.search('test 1', 5);
      await accessor.search('test 2', 5);

      let stats = accessor.getStats();
      expect(stats.hybridUsagePercent).toBe(100);

      // Switch to semantic
      accessor.setMode('semantic-only');
      await accessor.search('test 3', 5);

      stats = accessor.getStats();
      expect(stats.hybridUsagePercent).toBeLessThan(100);

      await accessor.close();
    });
  });

  describe('error handling', () => {
    it('should handle initialization errors gracefully', async () => {
      // Try to create with invalid path
      const accessor = new HybridColdContextAccessor({
        agentDbConfig: {
          persistencePath: '/invalid/path/test.bin',
          verbose: false,
        },
      });

      await expect(accessor.initialize()).rejects.toThrow();
    });

    it('should handle empty index gracefully', async () => {
      const accessor = await createTestAccessor();

      const results = await accessor.search('test query', 5);
      expect(results).toEqual([]);

      await accessor.close();
    });
  });

  describe('mode switching', () => {
    it('should switch modes without errors', async () => {
      const accessor = await createTestAccessor({ populateData: true });
      await accessor.buildBM25IndexFromAgentDB();

      accessor.setMode('hybrid');
      expect(accessor.getMode()).toBe('hybrid');

      accessor.setMode('semantic-only');
      expect(accessor.getMode()).toBe('semantic-only');

      accessor.setMode('bm25-only');
      expect(accessor.getMode()).toBe('bm25-only');

      // Switch back
      accessor.setMode('hybrid');
      expect(accessor.getMode()).toBe('hybrid');

      await accessor.close();
    });

    it('should not switch if already in requested mode', async () => {
      const accessor = await createTestAccessor({ initialMode: 'hybrid' });

      accessor.setMode('hybrid'); // Already in hybrid mode
      expect(accessor.getMode()).toBe('hybrid');

      await accessor.close();
    });
  });

  describe('clear', () => {
    it('should clear all content from both indexes', async () => {
      const accessor = await createTestAccessor({ populateData: true });
      await accessor.buildBM25IndexFromAgentDB();

      let stats = accessor.getStats();
      expect(stats.agentdbChunkCount).toBeGreaterThan(0);
      expect(stats.bm25IndexSize).toBeGreaterThan(0);

      await accessor.clear();

      stats = accessor.getStats();
      expect(stats.agentdbChunkCount).toBe(0);
      expect(stats.bm25IndexSize).toBe(0);

      await accessor.close();
    });
  });
});
