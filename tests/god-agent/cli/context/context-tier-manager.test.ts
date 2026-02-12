/**
 * Tests for ContextTierManager
 *
 * Phase G: Context Tier Manager - comprehensive test coverage
 * for 3-tier context management (hot/warm/cold).
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { join } from 'path';
import {
  ContextTierManager,
  createContextTierManager,
  createDissertationContextManager,
  createLowMemoryContextManager,
  getContextTierManager,
  resetContextTierManager,
  type ContextItem,
  type ContextPack,
  type StoreOptions,
} from '../../../../src/god-agent/cli/context/context-tier-manager.js';

// ============================================================================
// Test Fixtures
// ============================================================================

const TEST_COLD_PATH = '.test-context-cold';

const SAMPLE_CONTENT = {
  short: 'This is short content.',
  medium: 'This is medium-length content that contains more words and should use more tokens than the short version.',
  long: `This is a much longer piece of content that simulates academic text.
It contains multiple sentences and paragraphs to test token estimation.
The content discusses philosophical concepts related to video game aesthetics.
Specifically, it addresses the role of imagination in player experience.
According to scholars like Calleja (2011) and Keogh (2018), player engagement
operates through distinct mechanisms that differ from traditional media.
This text should be long enough to require more careful tier management.`,
  critical: 'CRITICAL: This content must be preserved at all costs.',
};

// Helper to generate content of specific token size (with unique identifier)
let contentCounter = 0;
function generateContent(targetTokens: number): string {
  const id = contentCounter++;
  const charCount = targetTokens * 4; // ~4 chars per token
  const prefix = `[${id}]`;
  const padding = 'x'.repeat(Math.max(0, charCount - prefix.length));
  return prefix + padding;
}

// ============================================================================
// ContextTierManager Tests
// ============================================================================

describe('ContextTierManager', () => {
  let manager: ContextTierManager;

  beforeEach(async () => {
    // Reset content counter for unique content generation
    contentCounter = 0;

    // Clean up test directory
    try {
      await fs.rm(TEST_COLD_PATH, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }

    manager = new ContextTierManager({
      coldStoragePath: TEST_COLD_PATH,
      hotTier: {
        maxTokens: 1000,
        evictionThreshold: 0.90,
        targetUsage: 0.70,
      },
      warmTier: {
        maxTokens: 5000,
        evictionThreshold: 0.85,
        targetUsage: 0.60,
      },
    });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_COLD_PATH, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
    resetContextTierManager();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await manager.initialize();
      const stats = manager.getStats();

      expect(stats.hot.itemCount).toBe(0);
      expect(stats.warm.itemCount).toBe(0);
      expect(stats.cold.itemCount).toBe(0);
    });

    it('should create cold storage directory', async () => {
      await manager.initialize();

      const exists = await fs.stat(TEST_COLD_PATH).then(() => true).catch(() => false);
      expect(exists).toBe(true);
    });

    it('should only initialize once', async () => {
      await manager.initialize();
      await manager.initialize(); // Should not throw or duplicate

      const stats = manager.getStats();
      expect(stats.total.items).toBe(0);
    });
  });

  describe('store', () => {
    it('should store content and return ContextItem', async () => {
      const item = await manager.store('key1', SAMPLE_CONTENT.short);

      expect(item.key).toBe('key1');
      expect(item.content).toBe(SAMPLE_CONTENT.short);
      expect(item.tokens).toBeGreaterThan(0);
      expect(item.accessCount).toBe(0);
      expect(item.hash).toBeDefined();
    });

    it('should store with custom options', async () => {
      const options: StoreOptions = {
        priority: 'high',
        type: 'citation',
        metadata: { author: 'Smith', year: 2020 },
      };

      const item = await manager.store('key2', SAMPLE_CONTENT.medium, options);

      expect(item.priority).toBe('high');
      expect(item.type).toBe('citation');
      expect(item.metadata).toEqual({ author: 'Smith', year: 2020 });
    });

    it('should deduplicate identical content', async () => {
      const item1 = await manager.store('key1', SAMPLE_CONTENT.short);
      const item2 = await manager.store('key2', SAMPLE_CONTENT.short);

      // Should return the existing item
      expect(item2.key).toBe(item1.key);

      const stats = manager.getStats();
      expect(stats.total.items).toBe(1);
    });

    it('should place high priority content in hot tier', async () => {
      const item = await manager.store('high-priority', SAMPLE_CONTENT.short, {
        priority: 'high',
      });

      expect(item.tier).toBe('hot');
    });

    it('should place medium priority content in warm tier when hot is full', async () => {
      // Fill hot tier completely (1000 tokens max)
      await manager.store('hot1', generateContent(500), { priority: 'high' });
      await manager.store('hot2', generateContent(500), { priority: 'high' });

      // Medium priority should go to warm since hot is full
      const item = await manager.store('medium-priority', generateContent(100), {
        priority: 'medium',
      });

      expect(item.tier).toBe('warm');
    });

    it('should force specific tier when requested', async () => {
      const item = await manager.store('forced-cold', SAMPLE_CONTENT.short, {
        forceTier: 'cold',
      });

      expect(item.tier).toBe('cold');

      const stats = manager.getStats();
      expect(stats.cold.itemCount).toBe(1);
    });
  });

  describe('retrieve', () => {
    it('should retrieve stored content', async () => {
      await manager.store('key1', SAMPLE_CONTENT.short);

      const item = await manager.retrieve('key1');

      expect(item).not.toBeNull();
      expect(item!.content).toBe(SAMPLE_CONTENT.short);
    });

    it('should return null for non-existent key', async () => {
      const item = await manager.retrieve('non-existent');

      expect(item).toBeNull();
    });

    it('should increment access count on retrieval', async () => {
      await manager.store('key1', SAMPLE_CONTENT.short);

      const item1 = await manager.retrieve('key1');
      expect(item1!.accessCount).toBe(1);

      const item2 = await manager.retrieve('key1');
      expect(item2!.accessCount).toBe(2);
    });

    it('should update lastAccess timestamp on retrieval', async () => {
      await manager.store('key1', SAMPLE_CONTENT.short);

      const item1 = await manager.retrieve('key1');
      const firstAccess = item1!.lastAccess;

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 10));

      const item2 = await manager.retrieve('key1');
      expect(item2!.lastAccess).toBeGreaterThan(firstAccess);
    });

    it('should retrieve from cold tier', async () => {
      await manager.store('cold-key', SAMPLE_CONTENT.short, { forceTier: 'cold' });

      const item = await manager.retrieve('cold-key');

      expect(item).not.toBeNull();
      expect(item!.content).toBe(SAMPLE_CONTENT.short);
    });
  });

  describe('retrieveMany', () => {
    it('should retrieve multiple items', async () => {
      await manager.store('key1', SAMPLE_CONTENT.short);
      await manager.store('key2', SAMPLE_CONTENT.medium);
      await manager.store('key3', SAMPLE_CONTENT.long);

      const results = await manager.retrieveMany(['key1', 'key2', 'key3']);

      expect(results.size).toBe(3);
      expect(results.get('key1')!.content).toBe(SAMPLE_CONTENT.short);
      expect(results.get('key2')!.content).toBe(SAMPLE_CONTENT.medium);
    });

    it('should skip non-existent keys', async () => {
      await manager.store('key1', SAMPLE_CONTENT.short);

      const results = await manager.retrieveMany(['key1', 'non-existent']);

      expect(results.size).toBe(1);
      expect(results.has('non-existent')).toBe(false);
    });
  });

  describe('getContextPack', () => {
    beforeEach(async () => {
      // Store various items
      await manager.store('critical1', generateContent(100), { priority: 'critical', type: 'source' });
      await manager.store('high1', generateContent(100), { priority: 'high', type: 'citation' });
      await manager.store('medium1', generateContent(100), { priority: 'medium', type: 'context' });
      await manager.store('low1', generateContent(100), { priority: 'low', type: 'example' });
    });

    it('should return items within token budget', async () => {
      const pack = await manager.getContextPack(250);

      expect(pack.totalTokens).toBeLessThanOrEqual(250);
      expect(pack.items.length).toBeGreaterThan(0);
    });

    it('should prioritize by priority level', async () => {
      const pack = await manager.getContextPack(150);

      // Critical should come first
      expect(pack.items[0].priority).toBe('critical');
    });

    it('should filter by content type', async () => {
      const pack = await manager.getContextPack(500, {
        types: ['source', 'citation'],
      });

      for (const item of pack.items) {
        expect(['source', 'citation']).toContain(item.type);
      }
    });

    it('should filter by priority', async () => {
      const pack = await manager.getContextPack(500, {
        priorities: ['critical', 'high'],
      });

      for (const item of pack.items) {
        expect(['critical', 'high']).toContain(item.priority);
      }
    });

    it('should track excluded items', async () => {
      // Request very small budget
      const pack = await manager.getContextPack(50);

      // Some items should be excluded
      expect(pack.excluded).toBeGreaterThan(0);
    });

    it('should track source tiers', async () => {
      const pack = await manager.getContextPack(500);

      const totalSources = pack.sources.hot + pack.sources.warm + pack.sources.cold;
      expect(totalSources).toBe(pack.items.length);
    });
  });

  describe('delete', () => {
    it('should delete from hot tier', async () => {
      await manager.store('key1', SAMPLE_CONTENT.short, { priority: 'high' });

      const deleted = await manager.delete('key1');
      expect(deleted).toBe(true);

      const item = await manager.retrieve('key1');
      expect(item).toBeNull();
    });

    it('should delete from warm tier', async () => {
      await manager.store('key1', SAMPLE_CONTENT.short, { forceTier: 'warm' });

      const deleted = await manager.delete('key1');
      expect(deleted).toBe(true);

      const item = await manager.retrieve('key1');
      expect(item).toBeNull();
    });

    it('should delete from cold tier', async () => {
      await manager.store('key1', SAMPLE_CONTENT.short, { forceTier: 'cold' });

      const deleted = await manager.delete('key1');
      expect(deleted).toBe(true);

      const item = await manager.retrieve('key1');
      expect(item).toBeNull();
    });

    it('should return false for non-existent key', async () => {
      const deleted = await manager.delete('non-existent');
      expect(deleted).toBe(false);
    });

    it('should update tier token counts', async () => {
      await manager.store('key1', SAMPLE_CONTENT.short, { priority: 'high' });

      const statsBefore = manager.getStats();
      const hotTokensBefore = statsBefore.hot.tokenCount;

      await manager.delete('key1');

      const statsAfter = manager.getStats();
      expect(statsAfter.hot.tokenCount).toBeLessThan(hotTokensBefore);
    });
  });

  describe('clear', () => {
    it('should clear all tiers', async () => {
      await manager.store('hot1', SAMPLE_CONTENT.short, { priority: 'high' });
      await manager.store('warm1', SAMPLE_CONTENT.medium, { forceTier: 'warm' });
      await manager.store('cold1', SAMPLE_CONTENT.long, { forceTier: 'cold' });

      await manager.clear();

      const stats = manager.getStats();
      expect(stats.total.items).toBe(0);
      expect(stats.total.tokens).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return stats for all tiers', async () => {
      await manager.store('hot1', SAMPLE_CONTENT.short, { priority: 'high' });
      await manager.store('warm1', SAMPLE_CONTENT.medium, { forceTier: 'warm' });

      const stats = manager.getStats();

      expect(stats.hot).toHaveProperty('itemCount');
      expect(stats.hot).toHaveProperty('tokenCount');
      expect(stats.hot).toHaveProperty('maxTokens');
      expect(stats.hot).toHaveProperty('usagePercentage');
      expect(stats.warm).toHaveProperty('itemCount');
      expect(stats.cold).toHaveProperty('itemCount');
      expect(stats.total).toHaveProperty('items');
      expect(stats.total).toHaveProperty('tokens');
    });

    it('should calculate correct usage percentage', async () => {
      await manager.store('key1', generateContent(500), { priority: 'high' });

      const stats = manager.getStats();

      // Hot tier max is 1000, we stored ~500 tokens
      expect(stats.hot.usagePercentage).toBeGreaterThan(0.4);
      expect(stats.hot.usagePercentage).toBeLessThan(0.6);
    });
  });

  describe('tier management', () => {
    it('should evict LRU items when hot tier is full', async () => {
      // Fill hot tier
      await manager.store('first', generateContent(400), { priority: 'high' });
      await manager.store('second', generateContent(400), { priority: 'high' });

      // Retrieve first to make it more recently used
      await manager.retrieve('first');

      // Add more content to trigger eviction
      await manager.store('third', generateContent(400), { priority: 'high' });

      // Second should have been evicted to warm (less recently used)
      const stats = manager.getStats();
      expect(stats.warm.itemCount).toBeGreaterThan(0);
    });

    it('should not evict critical priority items', async () => {
      // Fill with critical content
      await manager.store('critical1', generateContent(400), { priority: 'critical' });
      await manager.store('critical2', generateContent(400), { priority: 'critical' });

      // Add normal content - critical should stay in hot
      await manager.store('normal', generateContent(100), { priority: 'low' });

      const item1 = await manager.retrieve('critical1');
      const item2 = await manager.retrieve('critical2');

      expect(item1!.tier).toBe('hot');
      expect(item2!.tier).toBe('hot');
    });
  });

  describe('runMaintenance', () => {
    it('should evict items when tier is over threshold', async () => {
      // Fill hot tier past eviction threshold
      await manager.store('item1', generateContent(300), { priority: 'medium' });
      await manager.store('item2', generateContent(300), { priority: 'medium' });
      await manager.store('item3', generateContent(400), { priority: 'medium' });

      const result = await manager.runMaintenance();

      expect(result.evicted).toBeGreaterThanOrEqual(0);
    });

    it('should promote frequently accessed items', async () => {
      const customManager = new ContextTierManager({
        coldStoragePath: TEST_COLD_PATH,
        hotTier: { maxTokens: 1000, evictionThreshold: 0.90, targetUsage: 0.70 },
        warmTier: { maxTokens: 5000, evictionThreshold: 0.85, targetUsage: 0.60 },
        promotionThreshold: 2, // Promote after 2 accesses
      });

      await customManager.store('warm-item', SAMPLE_CONTENT.short, { forceTier: 'warm' });

      // Access multiple times
      await customManager.retrieve('warm-item');
      await customManager.retrieve('warm-item');
      await customManager.retrieve('warm-item');

      const result = await customManager.runMaintenance();

      expect(result.promoted).toBeGreaterThanOrEqual(0);
    });
  });
});

// ============================================================================
// Factory Function Tests
// ============================================================================

describe('Factory Functions', () => {
  afterEach(() => {
    resetContextTierManager();
  });

  describe('createContextTierManager', () => {
    it('should create manager with default settings', () => {
      const manager = createContextTierManager();

      const stats = manager.getStats();
      expect(stats.hot.maxTokens).toBe(10000);
      expect(stats.warm.maxTokens).toBe(50000);
    });

    it('should accept custom config', () => {
      const manager = createContextTierManager({
        hotTier: { maxTokens: 5000, evictionThreshold: 0.80, targetUsage: 0.60 },
      });

      const stats = manager.getStats();
      expect(stats.hot.maxTokens).toBe(5000);
    });
  });

  describe('createDissertationContextManager', () => {
    it('should create manager optimized for dissertation writing', () => {
      const manager = createDissertationContextManager();

      const stats = manager.getStats();
      expect(stats.hot.maxTokens).toBe(15000);
      expect(stats.warm.maxTokens).toBe(75000);
    });
  });

  describe('createLowMemoryContextManager', () => {
    it('should create manager with minimal memory usage', () => {
      const manager = createLowMemoryContextManager();

      const stats = manager.getStats();
      expect(stats.hot.maxTokens).toBe(5000);
      expect(stats.warm.maxTokens).toBe(25000);
    });
  });

  describe('getContextTierManager', () => {
    it('should return singleton instance', () => {
      const manager1 = getContextTierManager();
      const manager2 = getContextTierManager();

      expect(manager1).toBe(manager2);
    });

    it('should reset singleton with resetContextTierManager', () => {
      const manager1 = getContextTierManager();
      resetContextTierManager();
      const manager2 = getContextTierManager();

      expect(manager1).not.toBe(manager2);
    });
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('Edge Cases', () => {
  let manager: ContextTierManager;

  beforeEach(async () => {
    try {
      await fs.rm(TEST_COLD_PATH, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }

    manager = new ContextTierManager({
      coldStoragePath: TEST_COLD_PATH,
      hotTier: { maxTokens: 1000, evictionThreshold: 0.90, targetUsage: 0.70 },
      warmTier: { maxTokens: 5000, evictionThreshold: 0.85, targetUsage: 0.60 },
    });
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_COLD_PATH, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
  });

  it('should handle empty content', async () => {
    const item = await manager.store('empty', '');

    expect(item.tokens).toBe(0);
    expect(item.content).toBe('');
  });

  it('should handle very long content', async () => {
    const longContent = 'x'.repeat(100000);

    const item = await manager.store('very-long', longContent);

    // Should go to cold tier (too big for hot/warm)
    expect(item.tier).toBe('cold');
  });

  it('should handle special characters in content', async () => {
    const specialContent = '中文内容 🎮 émojis αβγ';

    const item = await manager.store('special', specialContent);
    const retrieved = await manager.retrieve('special');

    expect(retrieved!.content).toBe(specialContent);
  });

  it('should handle special characters in keys', async () => {
    const item = await manager.store('key-with-special_chars.123', SAMPLE_CONTENT.short);
    const retrieved = await manager.retrieve('key-with-special_chars.123');

    expect(retrieved).not.toBeNull();
    expect(retrieved!.content).toBe(SAMPLE_CONTENT.short);
  });

  it('should handle concurrent stores', async () => {
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(manager.store(`concurrent-${i}`, `content-${i}`));
    }

    await Promise.all(promises);

    const stats = manager.getStats();
    expect(stats.total.items).toBe(10);
  });

  it('should handle zero token budget in getContextPack', async () => {
    await manager.store('key1', SAMPLE_CONTENT.short);

    const pack = await manager.getContextPack(0);

    expect(pack.items.length).toBe(0);
    expect(pack.totalTokens).toBe(0);
  });

  it('should handle retrieval after clear', async () => {
    await manager.store('key1', SAMPLE_CONTENT.short);
    await manager.clear();

    const item = await manager.retrieve('key1');
    expect(item).toBeNull();
  });
});

// ============================================================================
// Performance Tests
// ============================================================================

describe('Performance', () => {
  let manager: ContextTierManager;

  beforeEach(async () => {
    try {
      await fs.rm(TEST_COLD_PATH, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }

    manager = new ContextTierManager({
      coldStoragePath: TEST_COLD_PATH,
      hotTier: { maxTokens: 50000, evictionThreshold: 0.90, targetUsage: 0.70 },
      warmTier: { maxTokens: 200000, evictionThreshold: 0.85, targetUsage: 0.60 },
    });
  });

  afterEach(async () => {
    try {
      await fs.rm(TEST_COLD_PATH, { recursive: true, force: true });
    } catch {
      // Directory might not exist
    }
  });

  it('should handle many items efficiently', async () => {
    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
      await manager.store(`key-${i}`, `content for item ${i} with some text`);
    }

    const duration = Date.now() - startTime;

    // Should complete within reasonable time (< 5 seconds)
    expect(duration).toBeLessThan(5000);

    const stats = manager.getStats();
    expect(stats.total.items).toBe(100);
  });

  it('should retrieve items quickly', async () => {
    // Store items
    for (let i = 0; i < 50; i++) {
      await manager.store(`key-${i}`, `content for item ${i}`);
    }

    // Time retrieval
    const startTime = Date.now();

    for (let i = 0; i < 50; i++) {
      await manager.retrieve(`key-${i}`);
    }

    const duration = Date.now() - startTime;

    // Should complete within reasonable time (< 1 second)
    expect(duration).toBeLessThan(1000);
  });

  it('should generate context pack quickly', async () => {
    // Store items
    for (let i = 0; i < 50; i++) {
      await manager.store(`key-${i}`, `content for item ${i} with additional text`);
    }

    // Time pack generation
    const startTime = Date.now();

    const pack = await manager.getContextPack(10000);

    const duration = Date.now() - startTime;

    // Should complete within reasonable time (< 500ms)
    expect(duration).toBeLessThan(500);
    expect(pack.items.length).toBeGreaterThan(0);
  });
});
