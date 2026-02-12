/**
 * Context Tier Manager - 3-Tier Context Management System
 *
 * Manages context across three tiers for optimal token usage:
 * - Hot Tier: In-memory, fastest access, limited capacity (10K tokens)
 * - Warm Tier: Cache layer, medium access, larger capacity (50K tokens)
 * - Cold Tier: Persistent storage, slowest access, unlimited capacity
 *
 * Phase G Implementation (Task #8):
 * - Automatic tier promotion/demotion based on access patterns
 * - LRU eviction within tiers
 * - On-demand retrieval from lower tiers
 * - Token budget management across all tiers
 *
 * Usage:
 * ```typescript
 * const tierManager = new ContextTierManager();
 *
 * // Store content in appropriate tier
 * tierManager.store('key1', content, { priority: 'high' });
 *
 * // Retrieve content (auto-promotes to hot tier)
 * const content = await tierManager.retrieve('key1');
 *
 * // Get content that fits within token budget
 * const contextPack = await tierManager.getContextPack(8000);
 * ```
 */

import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import { join } from 'path';
import { createComponentLogger, ConsoleLogHandler, LogLevel } from '../../core/observability/index.js';

const logger = createComponentLogger('ContextTierManager', {
  minLevel: LogLevel.INFO,
  handlers: [new ConsoleLogHandler()]
});

// ============================================================================
// Types
// ============================================================================

/**
 * Context tier levels
 */
export type ContextTier = 'hot' | 'warm' | 'cold';

/**
 * Content priority for storage decisions
 */
export type ContentPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Content type for categorization
 */
export type ContentType = 'source' | 'citation' | 'definition' | 'example' | 'context' | 'style' | 'other';

/**
 * Stored content item
 */
export interface ContextItem {
  /** Unique key */
  key: string;

  /** Content text */
  content: string;

  /** Estimated token count */
  tokens: number;

  /** Content type */
  type: ContentType;

  /** Priority level */
  priority: ContentPriority;

  /** Current tier */
  tier: ContextTier;

  /** Access count (for LRU) */
  accessCount: number;

  /** Last access timestamp */
  lastAccess: number;

  /** Creation timestamp */
  created: number;

  /** Content hash for deduplication */
  hash: string;

  /** Optional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Tier configuration
 */
export interface TierConfig {
  /** Maximum tokens for this tier */
  maxTokens: number;

  /** Eviction threshold (when to start evicting) */
  evictionThreshold: number;

  /** Target usage after eviction */
  targetUsage: number;
}

/**
 * Context Tier Manager configuration
 */
export interface ContextTierManagerConfig {
  /** Hot tier config */
  hotTier: TierConfig;

  /** Warm tier config */
  warmTier: TierConfig;

  /** Cold storage path */
  coldStoragePath: string;

  /** Enable automatic tier promotion */
  autoPromote: boolean;

  /** Access count threshold for promotion */
  promotionThreshold: number;

  /** Time threshold for demotion (ms since last access) */
  demotionTimeThreshold: number;
}

/**
 * Tier statistics
 */
export interface TierStats {
  tier: ContextTier;
  itemCount: number;
  tokenCount: number;
  maxTokens: number;
  usagePercentage: number;
  oldestAccess: number | null;
  newestAccess: number | null;
}

/**
 * Context pack - content retrieved within token budget
 */
export interface ContextPack {
  /** Items included in the pack */
  items: ContextItem[];

  /** Total tokens in pack */
  totalTokens: number;

  /** Token budget used */
  budgetUsed: number;

  /** Items that didn't fit */
  excluded: number;

  /** Retrieval sources */
  sources: {
    hot: number;
    warm: number;
    cold: number;
  };
}

/**
 * Storage options
 */
export interface StoreOptions {
  /** Content priority */
  priority?: ContentPriority;

  /** Content type */
  type?: ContentType;

  /** Force specific tier */
  forceTier?: ContextTier;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: ContextTierManagerConfig = {
  hotTier: {
    maxTokens: 10000,
    evictionThreshold: 0.90,
    targetUsage: 0.70,
  },
  warmTier: {
    maxTokens: 50000,
    evictionThreshold: 0.85,
    targetUsage: 0.60,
  },
  coldStoragePath: '.god-agent/context-cold',
  autoPromote: true,
  promotionThreshold: 3,
  demotionTimeThreshold: 300000, // 5 minutes
};

// ============================================================================
// Context Tier Manager Class
// ============================================================================

/**
 * Manages context across three tiers for optimal token usage
 */
export class ContextTierManager {
  private config: ContextTierManagerConfig;
  private hotTier: Map<string, ContextItem> = new Map();
  private warmTier: Map<string, ContextItem> = new Map();
  private coldIndex: Map<string, { path: string; tokens: number; hash: string }> = new Map();
  private hotTokens = 0;
  private warmTokens = 0;
  private initialized = false;

  constructor(config: Partial<ContextTierManagerConfig> = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      hotTier: { ...DEFAULT_CONFIG.hotTier, ...config.hotTier },
      warmTier: { ...DEFAULT_CONFIG.warmTier, ...config.warmTier },
    };
  }

  /**
   * Initialize the tier manager (load cold storage index)
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.config.coldStoragePath, { recursive: true });

      // Load cold storage index
      const indexPath = join(this.config.coldStoragePath, 'index.json');
      try {
        const indexData = await fs.readFile(indexPath, 'utf-8');
        const index = JSON.parse(indexData);
        for (const [key, value] of Object.entries(index)) {
          this.coldIndex.set(key, value as { path: string; tokens: number; hash: string });
        }
        logger.log(LogLevel.INFO, `Loaded ${this.coldIndex.size} cold storage entries`);
      } catch {
        // Index doesn't exist yet, that's fine
        logger.log(LogLevel.DEBUG, 'No existing cold storage index');
      }

      this.initialized = true;
    } catch (error) {
      logger.log(LogLevel.ERROR, `Failed to initialize: ${error}`);
      throw error;
    }
  }

  /**
   * Store content in the appropriate tier
   */
  async store(key: string, content: string, options: StoreOptions = {}): Promise<ContextItem> {
    await this.ensureInitialized();

    const tokens = this.estimateTokens(content);
    const hash = this.hashContent(content);
    const now = Date.now();

    // Check for duplicates
    const existing = await this.findByHash(hash);
    if (existing) {
      logger.log(LogLevel.DEBUG, `Duplicate content found: ${key} → ${existing.key}`);
      return existing;
    }

    const item: ContextItem = {
      key,
      content,
      tokens,
      type: options.type ?? 'other',
      priority: options.priority ?? 'medium',
      tier: options.forceTier ?? this.selectInitialTier(tokens, options.priority ?? 'medium'),
      accessCount: 0,
      lastAccess: now,
      created: now,
      hash,
      metadata: options.metadata,
    };

    // Store in appropriate tier
    await this.storeInTier(item);

    logger.log(LogLevel.DEBUG, `Stored ${key} in ${item.tier} tier (${tokens} tokens)`);

    return item;
  }

  /**
   * Retrieve content by key (auto-promotes to hot tier)
   */
  async retrieve(key: string): Promise<ContextItem | null> {
    await this.ensureInitialized();

    // Check hot tier first
    const hotItem = this.hotTier.get(key);
    if (hotItem) {
      this.recordAccess(hotItem);
      return hotItem;
    }

    // Check warm tier
    const warmItem = this.warmTier.get(key);
    if (warmItem) {
      this.recordAccess(warmItem);
      if (this.config.autoPromote) {
        await this.promoteToHot(warmItem);
      }
      return warmItem;
    }

    // Check cold tier
    const coldMeta = this.coldIndex.get(key);
    if (coldMeta) {
      const item = await this.loadFromCold(key, coldMeta);
      if (item) {
        this.recordAccess(item);
        if (this.config.autoPromote) {
          await this.promoteToWarm(item);
        }
        return item;
      }
    }

    return null;
  }

  /**
   * Retrieve multiple items by keys
   */
  async retrieveMany(keys: string[]): Promise<Map<string, ContextItem>> {
    const results = new Map<string, ContextItem>();

    for (const key of keys) {
      const item = await this.retrieve(key);
      if (item) {
        results.set(key, item);
      }
    }

    return results;
  }

  /**
   * Get context pack within token budget
   */
  async getContextPack(
    tokenBudget: number,
    filter?: {
      types?: ContentType[];
      priorities?: ContentPriority[];
      minAccessCount?: number;
    }
  ): Promise<ContextPack> {
    await this.ensureInitialized();

    const pack: ContextPack = {
      items: [],
      totalTokens: 0,
      budgetUsed: tokenBudget,
      excluded: 0,
      sources: { hot: 0, warm: 0, cold: 0 },
    };

    // Collect and sort items by priority and access
    const candidates: ContextItem[] = [];

    // Hot tier items
    for (const item of this.hotTier.values()) {
      if (this.matchesFilter(item, filter)) {
        candidates.push(item);
      }
    }

    // Warm tier items
    for (const item of this.warmTier.values()) {
      if (this.matchesFilter(item, filter)) {
        candidates.push(item);
      }
    }

    // Sort by priority then access count
    candidates.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.accessCount - a.accessCount;
    });

    // Fill pack within budget
    for (const item of candidates) {
      if (pack.totalTokens + item.tokens <= tokenBudget) {
        pack.items.push(item);
        pack.totalTokens += item.tokens;
        pack.sources[item.tier]++;
        this.recordAccess(item);
      } else {
        pack.excluded++;
      }
    }

    logger.log(
      LogLevel.INFO,
      `Context pack: ${pack.items.length} items, ${pack.totalTokens}/${tokenBudget} tokens`
    );

    return pack;
  }

  /**
   * Delete content by key
   */
  async delete(key: string): Promise<boolean> {
    await this.ensureInitialized();

    // Check and delete from hot tier
    const hotItem = this.hotTier.get(key);
    if (hotItem) {
      this.hotTier.delete(key);
      this.hotTokens -= hotItem.tokens;
      return true;
    }

    // Check and delete from warm tier
    const warmItem = this.warmTier.get(key);
    if (warmItem) {
      this.warmTier.delete(key);
      this.warmTokens -= warmItem.tokens;
      return true;
    }

    // Check and delete from cold tier
    const coldMeta = this.coldIndex.get(key);
    if (coldMeta) {
      try {
        await fs.unlink(coldMeta.path);
      } catch {
        // File might not exist
      }
      this.coldIndex.delete(key);
      await this.saveColdIndex();
      return true;
    }

    return false;
  }

  /**
   * Clear all tiers
   */
  async clear(): Promise<void> {
    this.hotTier.clear();
    this.warmTier.clear();
    this.hotTokens = 0;
    this.warmTokens = 0;

    // Clear cold storage
    try {
      const files = await fs.readdir(this.config.coldStoragePath);
      for (const file of files) {
        await fs.unlink(join(this.config.coldStoragePath, file));
      }
    } catch {
      // Directory might not exist
    }

    this.coldIndex.clear();

    logger.log(LogLevel.INFO, 'All tiers cleared');
  }

  /**
   * Get statistics for all tiers
   */
  getStats(): { hot: TierStats; warm: TierStats; cold: TierStats; total: { items: number; tokens: number } } {
    const hotStats = this.getTierStats('hot');
    const warmStats = this.getTierStats('warm');
    const coldStats = this.getTierStats('cold');

    return {
      hot: hotStats,
      warm: warmStats,
      cold: coldStats,
      total: {
        items: hotStats.itemCount + warmStats.itemCount + coldStats.itemCount,
        tokens: hotStats.tokenCount + warmStats.tokenCount + coldStats.tokenCount,
      },
    };
  }

  /**
   * Get statistics for a specific tier
   */
  getTierStats(tier: ContextTier): TierStats {
    let items: ContextItem[] = [];
    let maxTokens = 0;
    let tokenCount = 0;

    switch (tier) {
      case 'hot':
        items = Array.from(this.hotTier.values());
        maxTokens = this.config.hotTier.maxTokens;
        tokenCount = this.hotTokens;
        break;
      case 'warm':
        items = Array.from(this.warmTier.values());
        maxTokens = this.config.warmTier.maxTokens;
        tokenCount = this.warmTokens;
        break;
      case 'cold':
        tokenCount = Array.from(this.coldIndex.values()).reduce((sum, m) => sum + m.tokens, 0);
        maxTokens = Infinity;
        break;
    }

    const accessTimes = items.map(i => i.lastAccess).filter(t => t > 0);

    return {
      tier,
      itemCount: tier === 'cold' ? this.coldIndex.size : items.length,
      tokenCount,
      maxTokens,
      usagePercentage: maxTokens === Infinity ? 0 : tokenCount / maxTokens,
      oldestAccess: accessTimes.length > 0 ? Math.min(...accessTimes) : null,
      newestAccess: accessTimes.length > 0 ? Math.max(...accessTimes) : null,
    };
  }

  /**
   * Run maintenance (eviction, demotion)
   */
  async runMaintenance(): Promise<{ evicted: number; demoted: number; promoted: number }> {
    await this.ensureInitialized();

    const result = { evicted: 0, demoted: 0, promoted: 0 };
    const now = Date.now();

    // Hot tier maintenance
    if (this.hotTokens > this.config.hotTier.maxTokens * this.config.hotTier.evictionThreshold) {
      const targetTokens = this.config.hotTier.maxTokens * this.config.hotTier.targetUsage;
      result.evicted += await this.evictFromTier('hot', this.hotTokens - targetTokens);
    }

    // Warm tier maintenance
    if (this.warmTokens > this.config.warmTier.maxTokens * this.config.warmTier.evictionThreshold) {
      const targetTokens = this.config.warmTier.maxTokens * this.config.warmTier.targetUsage;
      result.evicted += await this.evictFromTier('warm', this.warmTokens - targetTokens);
    }

    // Demotion: Move stale items from hot to warm
    for (const item of this.hotTier.values()) {
      if (now - item.lastAccess > this.config.demotionTimeThreshold) {
        await this.demoteToWarm(item);
        result.demoted++;
      }
    }

    // Demotion: Move stale items from warm to cold
    for (const item of this.warmTier.values()) {
      if (now - item.lastAccess > this.config.demotionTimeThreshold * 2) {
        await this.demoteToCold(item);
        result.demoted++;
      }
    }

    // Promotion: Items with high access count
    for (const item of this.warmTier.values()) {
      if (item.accessCount >= this.config.promotionThreshold) {
        await this.promoteToHot(item);
        result.promoted++;
      }
    }

    logger.log(
      LogLevel.INFO,
      `Maintenance complete: evicted=${result.evicted}, demoted=${result.demoted}, promoted=${result.promoted}`
    );

    return result;
  }

  /**
   * Display tier status
   */
  displayStatus(): void {
    const stats = this.getStats();

    console.log('\n' + '='.repeat(80));
    console.log('CONTEXT TIER STATUS');
    console.log('='.repeat(80));

    console.log('\n📊 HOT TIER (In-Memory)');
    console.log(`   Items: ${stats.hot.itemCount}`);
    console.log(`   Tokens: ${stats.hot.tokenCount.toLocaleString()} / ${stats.hot.maxTokens.toLocaleString()}`);
    console.log(`   Usage: ${(stats.hot.usagePercentage * 100).toFixed(1)}%`);

    console.log('\n📦 WARM TIER (Cache)');
    console.log(`   Items: ${stats.warm.itemCount}`);
    console.log(`   Tokens: ${stats.warm.tokenCount.toLocaleString()} / ${stats.warm.maxTokens.toLocaleString()}`);
    console.log(`   Usage: ${(stats.warm.usagePercentage * 100).toFixed(1)}%`);

    console.log('\n❄️  COLD TIER (Persistent)');
    console.log(`   Items: ${stats.cold.itemCount}`);
    console.log(`   Tokens: ${stats.cold.tokenCount.toLocaleString()}`);

    console.log('\n📈 TOTAL');
    console.log(`   Items: ${stats.total.items}`);
    console.log(`   Tokens: ${stats.total.tokens.toLocaleString()}`);

    console.log('='.repeat(80) + '\n');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  private hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  private selectInitialTier(tokens: number, priority: ContentPriority): ContextTier {
    // Critical and high priority always try hot tier (will evict if needed)
    if (priority === 'critical' || priority === 'high') {
      // Check if item fits in hot tier (even if eviction needed)
      if (tokens <= this.config.hotTier.maxTokens) {
        return 'hot';
      }
    }

    // Medium priority starts in hot tier if space available, otherwise warm
    if (priority === 'medium') {
      if (this.hotTokens + tokens <= this.config.hotTier.maxTokens) {
        return 'hot';
      }
      if (this.warmTokens + tokens <= this.config.warmTier.maxTokens) {
        return 'warm';
      }
    }

    // Low priority starts in warm tier if space available
    if (priority === 'low') {
      if (this.warmTokens + tokens <= this.config.warmTier.maxTokens) {
        return 'warm';
      }
    }

    // Everything else goes to cold tier
    return 'cold';
  }

  private async storeInTier(item: ContextItem): Promise<void> {
    switch (item.tier) {
      case 'hot':
        await this.ensureHotCapacity(item.tokens);
        this.hotTier.set(item.key, item);
        this.hotTokens += item.tokens;
        break;

      case 'warm':
        await this.ensureWarmCapacity(item.tokens);
        this.warmTier.set(item.key, item);
        this.warmTokens += item.tokens;
        break;

      case 'cold':
        await this.storeToCold(item);
        break;
    }
  }

  private async ensureHotCapacity(tokensNeeded: number): Promise<void> {
    while (this.hotTokens + tokensNeeded > this.config.hotTier.maxTokens && this.hotTier.size > 0) {
      await this.evictLRUFromHot();
    }
  }

  private async ensureWarmCapacity(tokensNeeded: number): Promise<void> {
    while (this.warmTokens + tokensNeeded > this.config.warmTier.maxTokens && this.warmTier.size > 0) {
      await this.evictLRUFromWarm();
    }
  }

  private async evictLRUFromHot(): Promise<void> {
    let lruItem: ContextItem | null = null;
    let lruAccess = Infinity;

    for (const item of this.hotTier.values()) {
      if (item.lastAccess < lruAccess && item.priority !== 'critical') {
        lruItem = item;
        lruAccess = item.lastAccess;
      }
    }

    if (lruItem) {
      await this.demoteToWarm(lruItem);
    }
  }

  private async evictLRUFromWarm(): Promise<void> {
    let lruItem: ContextItem | null = null;
    let lruAccess = Infinity;

    for (const item of this.warmTier.values()) {
      if (item.lastAccess < lruAccess && item.priority !== 'critical') {
        lruItem = item;
        lruAccess = item.lastAccess;
      }
    }

    if (lruItem) {
      await this.demoteToCold(lruItem);
    }
  }

  private async evictFromTier(tier: 'hot' | 'warm', tokensToEvict: number): Promise<number> {
    let evicted = 0;
    let tokensRemoved = 0;
    const tierMap = tier === 'hot' ? this.hotTier : this.warmTier;

    // Sort by priority (low first) then by access time (oldest first)
    const items = Array.from(tierMap.values()).sort((a, b) => {
      const priorityOrder = { low: 0, medium: 1, high: 2, critical: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.lastAccess - b.lastAccess;
    });

    for (const item of items) {
      if (tokensRemoved >= tokensToEvict) break;
      if (item.priority === 'critical') continue;

      if (tier === 'hot') {
        await this.demoteToWarm(item);
      } else {
        await this.demoteToCold(item);
      }

      tokensRemoved += item.tokens;
      evicted++;
    }

    return evicted;
  }

  private async promoteToHot(item: ContextItem): Promise<void> {
    if (item.tier === 'hot') return;

    // Remove from current tier
    if (item.tier === 'warm') {
      this.warmTier.delete(item.key);
      this.warmTokens -= item.tokens;
    }

    // Add to hot tier
    await this.ensureHotCapacity(item.tokens);
    item.tier = 'hot';
    this.hotTier.set(item.key, item);
    this.hotTokens += item.tokens;

    logger.log(LogLevel.DEBUG, `Promoted ${item.key} to hot tier`);
  }

  private async promoteToWarm(item: ContextItem): Promise<void> {
    if (item.tier === 'hot' || item.tier === 'warm') return;

    // Remove from cold index
    this.coldIndex.delete(item.key);
    await this.saveColdIndex();

    // Add to warm tier
    await this.ensureWarmCapacity(item.tokens);
    item.tier = 'warm';
    this.warmTier.set(item.key, item);
    this.warmTokens += item.tokens;

    logger.log(LogLevel.DEBUG, `Promoted ${item.key} to warm tier`);
  }

  private async demoteToWarm(item: ContextItem): Promise<void> {
    if (item.tier !== 'hot') return;

    // Remove from hot tier
    this.hotTier.delete(item.key);
    this.hotTokens -= item.tokens;

    // Add to warm tier
    await this.ensureWarmCapacity(item.tokens);
    item.tier = 'warm';
    this.warmTier.set(item.key, item);
    this.warmTokens += item.tokens;

    logger.log(LogLevel.DEBUG, `Demoted ${item.key} to warm tier`);
  }

  private async demoteToCold(item: ContextItem): Promise<void> {
    if (item.tier === 'cold') return;

    // Remove from current tier
    if (item.tier === 'hot') {
      this.hotTier.delete(item.key);
      this.hotTokens -= item.tokens;
    } else if (item.tier === 'warm') {
      this.warmTier.delete(item.key);
      this.warmTokens -= item.tokens;
    }

    // Store to cold
    await this.storeToCold(item);

    logger.log(LogLevel.DEBUG, `Demoted ${item.key} to cold tier`);
  }

  private async storeToCold(item: ContextItem): Promise<void> {
    const filePath = join(this.config.coldStoragePath, `${item.key}.json`);

    item.tier = 'cold';
    await fs.writeFile(filePath, JSON.stringify(item, null, 2));

    this.coldIndex.set(item.key, {
      path: filePath,
      tokens: item.tokens,
      hash: item.hash,
    });

    await this.saveColdIndex();
  }

  private async loadFromCold(
    key: string,
    meta: { path: string; tokens: number; hash: string }
  ): Promise<ContextItem | null> {
    try {
      const data = await fs.readFile(meta.path, 'utf-8');
      return JSON.parse(data) as ContextItem;
    } catch (error) {
      logger.log(LogLevel.ERROR, `Failed to load ${key} from cold storage: ${error}`);
      return null;
    }
  }

  private async saveColdIndex(): Promise<void> {
    const indexPath = join(this.config.coldStoragePath, 'index.json');
    const index: Record<string, { path: string; tokens: number; hash: string }> = {};

    for (const [key, value] of this.coldIndex) {
      index[key] = value;
    }

    await fs.writeFile(indexPath, JSON.stringify(index, null, 2));
  }

  private async findByHash(hash: string): Promise<ContextItem | null> {
    // Check hot tier
    for (const item of this.hotTier.values()) {
      if (item.hash === hash) return item;
    }

    // Check warm tier
    for (const item of this.warmTier.values()) {
      if (item.hash === hash) return item;
    }

    // Check cold index
    for (const [key, meta] of this.coldIndex) {
      if (meta.hash === hash) {
        return this.loadFromCold(key, meta);
      }
    }

    return null;
  }

  private recordAccess(item: ContextItem): void {
    item.accessCount++;
    item.lastAccess = Date.now();
  }

  private matchesFilter(
    item: ContextItem,
    filter?: {
      types?: ContentType[];
      priorities?: ContentPriority[];
      minAccessCount?: number;
    }
  ): boolean {
    if (!filter) return true;

    if (filter.types && !filter.types.includes(item.type)) {
      return false;
    }

    if (filter.priorities && !filter.priorities.includes(item.priority)) {
      return false;
    }

    if (filter.minAccessCount !== undefined && item.accessCount < filter.minAccessCount) {
      return false;
    }

    return true;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a context tier manager with default settings
 */
export function createContextTierManager(config?: Partial<ContextTierManagerConfig>): ContextTierManager {
  return new ContextTierManager(config);
}

/**
 * Create a context tier manager optimized for dissertation writing
 */
export function createDissertationContextManager(): ContextTierManager {
  return new ContextTierManager({
    hotTier: {
      maxTokens: 15000,  // Larger hot tier for active writing
      evictionThreshold: 0.85,
      targetUsage: 0.65,
    },
    warmTier: {
      maxTokens: 75000,  // Larger warm tier for references
      evictionThreshold: 0.80,
      targetUsage: 0.55,
    },
    autoPromote: true,
    promotionThreshold: 2,  // Faster promotion for frequently used sources
    demotionTimeThreshold: 600000,  // 10 minutes
  });
}

/**
 * Create a context tier manager with minimal memory usage
 */
export function createLowMemoryContextManager(): ContextTierManager {
  return new ContextTierManager({
    hotTier: {
      maxTokens: 5000,
      evictionThreshold: 0.80,
      targetUsage: 0.50,
    },
    warmTier: {
      maxTokens: 25000,
      evictionThreshold: 0.75,
      targetUsage: 0.50,
    },
    autoPromote: false,  // Manual promotion only
    promotionThreshold: 5,
    demotionTimeThreshold: 120000,  // 2 minutes
  });
}

// ============================================================================
// Singleton Instance
// ============================================================================

let defaultInstance: ContextTierManager | null = null;

/**
 * Get the default context tier manager instance
 */
export function getContextTierManager(): ContextTierManager {
  if (!defaultInstance) {
    defaultInstance = createContextTierManager();
  }
  return defaultInstance;
}

/**
 * Reset the default instance (for testing)
 */
export function resetContextTierManager(): void {
  defaultInstance = null;
}
