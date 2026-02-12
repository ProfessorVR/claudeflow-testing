/**
 * TieredContextManager - Hierarchical context compression for large documents
 *
 * Implements a three-tier context management system to handle large dissertation
 * documents that would otherwise exceed context window limits.
 *
 * Architecture:
 * =============
 *
 * Tier 1 (Hot): Current section context (~50k tokens max)
 *   - Section-specific content being written
 *   - Immediately relevant prior arguments
 *   - Active style injection
 *   - Critical terminology for current section
 *
 * Tier 2 (Warm): Chapter-level summaries (~20k tokens)
 *   - Compressed chapter summaries (not full text)
 *   - Key thesis statements
 *   - Critical terminology definitions
 *   - Cross-chapter argument threads
 *
 * Tier 3 (Cold): On-demand RAG retrieval (variable)
 *   - Full dissertation stored for semantic search
 *   - Citation suggestions retrieved as needed
 *   - Only pulled when specifically referenced
 *
 * Usage:
 * ======
 * ```typescript
 * const tieredManager = new TieredContextManager({
 *   tier1MaxTokens: 50000,
 *   tier2MaxTokens: 20000,
 * });
 *
 * // Build tiered context for a specific section
 * const tiered = await tieredManager.buildTieredContext(3, 'Section 3.2');
 *
 * // Generate prompt within token budget
 * const prompt = tieredManager.buildPromptWithBudget(tiered, 60000);
 * ```
 */

import { type ChapterContext } from './chapter-context-aggregator.js';
import { type GlossaryTerm } from './dissertation-context-manager.js';
import {
  AgentDBColdContextAccessor,
  createInitializedAgentDBColdAccessor,
  type AgentDBColdAccessorConfig,
} from './agentdb-cold-accessor.js';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Configuration for each tier
 */
export interface TierConfig {
  /** Maximum tokens for this tier */
  maxTokens: number;
  /** Compression ratio when content exceeds limits (e.g., 0.5 = 50% of original) */
  compressionRatio: number;
  /** What content type to prioritize for retention */
  retentionPriority: 'thesis' | 'arguments' | 'citations' | 'definitions';
}

/**
 * Complete tiered context structure
 */
export interface TieredContext {
  /** Tier 1: Hot context for immediate use */
  tier1Hot: HotContext;
  /** Tier 2: Warm context with compressed summaries */
  tier2Warm: WarmContext;
  /** Tier 3: Cold context accessor for on-demand retrieval */
  tier3ColdAccessor: ColdContextAccessor;
}

/**
 * Tier 1: Hot context - immediately relevant content
 */
export interface HotContext {
  /** Current section being written */
  currentSection: string;
  /** Relevant arguments from prior chapters, compressed */
  relevantArguments: CompressedArgument[];
  /** Style injection content */
  styleInjection: string;
  /** Terms immediately relevant to this section */
  immediateTerms: Map<string, string>;
  /** Current token count for this tier */
  tokenCount: number;
}

/**
 * Tier 2: Warm context - chapter-level compressed information
 */
export interface WarmContext {
  /** Compressed summaries by chapter number */
  chapterSummaries: Map<number, CompressedSummary>;
  /** Key thesis statements from the dissertation */
  thesisStatements: string[];
  /** Critical terms that must be used consistently */
  criticalTerms: Map<string, string>;
  /** Current token count for this tier */
  tokenCount: number;
}

/**
 * Tier 3: Cold context accessor for on-demand retrieval
 * This interface allows for different backend implementations (in-memory, AgentDB, etc.)
 */
export interface ColdContextAccessor {
  /** Semantic search across the full dissertation */
  search(query: string, topK?: number): Promise<RetrievedChunk[]>;
  /** Get a specific citation by source ID */
  getCitation(sourceId: string): Promise<string | null>;
  /** Get full section content on demand */
  getFullSection(chapterNum: number, sectionName: string): Promise<string | null>;
}

/**
 * Compressed argument representation
 */
export interface CompressedArgument {
  /** Unique identifier for tracking */
  id: string;
  /** Compressed statement - core claim only */
  statement: string;
  /** Chapter where this argument appears */
  chapter: number;
  /** Count of supporting evidence (not the evidence itself) */
  evidenceCount: number;
  /** Status of the argument */
  status: 'introduced' | 'developed' | 'concluded';
}

/**
 * Compressed chapter summary
 */
export interface CompressedSummary {
  /** Chapter number */
  chapterNumber: number;
  /** Chapter title */
  title: string;
  /** Key points (max 5 bullet points) */
  keyPoints: string[];
  /** Token count for this summary */
  tokenCount: number;
}

/**
 * Retrieved chunk from cold storage
 */
export interface RetrievedChunk {
  /** The content retrieved */
  content: string;
  /** Source identifier (e.g., "Chapter 3, Section 2") */
  source: string;
  /** Relevance score from semantic search (0-1) */
  relevanceScore: number;
}

/**
 * Configuration for TieredContextManager
 */
export interface TieredContextManagerConfig {
  /** Maximum tokens for Tier 1 (Hot) - default 50000 */
  tier1MaxTokens?: number;
  /** Maximum tokens for Tier 2 (Warm) - default 20000 */
  tier2MaxTokens?: number;
  /** Characters per token for estimation - default 4 */
  charsPerToken?: number;
  /** Maximum key points per chapter summary - default 5 */
  maxKeyPointsPerChapter?: number;
  /** Maximum arguments to include in hot context - default 10 */
  maxHotArguments?: number;
  /** Maximum terms in hot context - default 15 */
  maxHotTerms?: number;
  /** Maximum terms in warm context - default 30 */
  maxWarmTerms?: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<TieredContextManagerConfig> = {
  tier1MaxTokens: 50000,
  tier2MaxTokens: 20000,
  charsPerToken: 4,
  maxKeyPointsPerChapter: 5,
  maxHotArguments: 10,
  maxHotTerms: 15,
  maxWarmTerms: 30,
};

// ============================================================================
// In-Memory Cold Context Accessor (Mock Implementation)
// ============================================================================

/**
 * In-memory implementation of ColdContextAccessor for testing
 * In production, this would be replaced with AgentDB or another vector store
 */
export class InMemoryColdContextAccessor implements ColdContextAccessor {
  private chapters: Map<number, string> = new Map();
  private sections: Map<string, string> = new Map();
  private citations: Map<string, string> = new Map();

  /**
   * Add a chapter to the cold storage
   */
  addChapter(chapterNum: number, content: string): void {
    this.chapters.set(chapterNum, content);
  }

  /**
   * Add a section to the cold storage
   */
  addSection(chapterNum: number, sectionName: string, content: string): void {
    const key = `${chapterNum}:${sectionName}`;
    this.sections.set(key, content);
  }

  /**
   * Add a citation to the cold storage
   */
  addCitation(sourceId: string, citation: string): void {
    this.citations.set(sourceId, citation);
  }

  /**
   * Search across stored content (simple substring match for mock)
   */
  async search(query: string, topK: number = 5): Promise<RetrievedChunk[]> {
    const results: RetrievedChunk[] = [];
    const queryLower = query.toLowerCase();

    // Search in chapters
    for (const [chapterNum, content] of this.chapters.entries()) {
      if (content.toLowerCase().includes(queryLower)) {
        // Extract relevant paragraph
        const paragraphs = content.split(/\n\n+/);
        for (const para of paragraphs) {
          if (para.toLowerCase().includes(queryLower)) {
            results.push({
              content: para.substring(0, 500),
              source: `Chapter ${chapterNum}`,
              relevanceScore: this.calculateSimpleRelevance(para, query),
            });
          }
        }
      }
    }

    // Search in sections
    for (const [key, content] of this.sections.entries()) {
      if (content.toLowerCase().includes(queryLower)) {
        const [chapterNum, sectionName] = key.split(':');
        results.push({
          content: content.substring(0, 500),
          source: `Chapter ${chapterNum}, ${sectionName}`,
          relevanceScore: this.calculateSimpleRelevance(content, query),
        });
      }
    }

    // Sort by relevance and return top K
    return results
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, topK);
  }

  /**
   * Get a citation by source ID
   */
  async getCitation(sourceId: string): Promise<string | null> {
    return this.citations.get(sourceId) ?? null;
  }

  /**
   * Get full section content
   */
  async getFullSection(chapterNum: number, sectionName: string): Promise<string | null> {
    const key = `${chapterNum}:${sectionName}`;
    return this.sections.get(key) ?? null;
  }

  /**
   * Simple relevance calculation based on term frequency
   */
  private calculateSimpleRelevance(content: string, query: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    let matches = 0;

    for (const term of queryTerms) {
      if (contentLower.includes(term)) {
        matches++;
      }
    }

    return matches / queryTerms.length;
  }

  /**
   * Clear all stored content
   */
  clear(): void {
    this.chapters.clear();
    this.sections.clear();
    this.citations.clear();
  }
}

// ============================================================================
// TieredContextManager Class
// ============================================================================

/**
 * TieredContextManager - Manages hierarchical context compression
 *
 * This class coordinates the three-tier context system:
 * - Tier 1 (Hot): Current section context for immediate use
 * - Tier 2 (Warm): Chapter summaries and critical information
 * - Tier 3 (Cold): Full content for on-demand retrieval
 */
export class TieredContextManager {
  private readonly config: Required<TieredContextManagerConfig>;
  private chapterContexts: Map<number, ChapterContext> = new Map();
  private glossary: Map<string, GlossaryTerm> = new Map();
  private mainThesis: string = '';
  private subTheses: string[] = [];
  private coldAccessor: ColdContextAccessor;

  /**
   * Create a new TieredContextManager
   *
   * @param config - Configuration options
   * @param coldAccessor - Optional custom cold context accessor (defaults to in-memory)
   */
  constructor(
    config: TieredContextManagerConfig = {},
    coldAccessor?: ColdContextAccessor
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.coldAccessor = coldAccessor ?? new InMemoryColdContextAccessor();
  }

  // ==========================================================================
  // Data Ingestion Methods
  // ==========================================================================

  /**
   * Add a chapter context to the manager
   */
  addChapterContext(context: ChapterContext): void {
    this.chapterContexts.set(context.chapterId, context);

    // If using in-memory cold accessor, also store there
    if (this.coldAccessor instanceof InMemoryColdContextAccessor) {
      // Store full chapter content if available in summary
      this.coldAccessor.addChapter(context.chapterId, context.summary);
    }
  }

  /**
   * Add multiple chapter contexts
   */
  addChapterContexts(contexts: ChapterContext[]): void {
    for (const context of contexts) {
      this.addChapterContext(context);
    }
  }

  /**
   * Set the glossary terms
   */
  setGlossary(glossary: Map<string, GlossaryTerm>): void {
    this.glossary = new Map(glossary);
  }

  /**
   * Set the main thesis
   */
  setMainThesis(thesis: string): void {
    this.mainThesis = thesis;
  }

  /**
   * Set sub-theses
   */
  setSubTheses(theses: string[]): void {
    this.subTheses = [...theses];
  }

  /**
   * Set a custom cold context accessor
   */
  setColdAccessor(accessor: ColdContextAccessor): void {
    this.coldAccessor = accessor;
  }

  /**
   * Get the current cold context accessor
   *
   * This is useful for directly adding content to an AgentDBColdContextAccessor.
   *
   * @returns The current cold context accessor
   */
  getColdAccessor(): ColdContextAccessor {
    return this.coldAccessor;
  }

  // ==========================================================================
  // Core Methods
  // ==========================================================================

  /**
   * Build tiered context for a specific chapter and section
   *
   * This is the main entry point for generating a tiered context structure
   * that can be used for prompt generation.
   *
   * @param chapterNumber - The chapter being written
   * @param sectionName - The specific section within the chapter
   * @returns TieredContext structure with hot, warm, and cold tiers
   */
  async buildTieredContext(
    chapterNumber: number,
    sectionName: string
  ): Promise<TieredContext> {
    // Get all prior chapter contexts
    const priorContexts = Array.from(this.chapterContexts.values())
      .filter(c => c.chapterId < chapterNumber)
      .sort((a, b) => a.chapterId - b.chapterId);

    // Build Tier 2 (Warm) first - this feeds into Tier 1
    const tier2Warm = this.buildWarmContext(priorContexts);

    // Build Tier 1 (Hot) with section-specific focus
    const tier1Hot = this.promoteToHot(tier2Warm, sectionName, chapterNumber);

    // Tier 3 uses the configured accessor
    const tier3ColdAccessor = this.coldAccessor;

    return {
      tier1Hot,
      tier2Warm,
      tier3ColdAccessor,
    };
  }

  /**
   * Compress a chapter context to a warm summary
   *
   * Reduces full chapter context to key points only, suitable for
   * Tier 2 warm storage.
   *
   * @param chapterContext - Full chapter context
   * @returns Compressed summary
   */
  compressToWarm(chapterContext: ChapterContext): CompressedSummary {
    // Extract key points from arguments
    const keyPoints: string[] = [];

    // Get main arguments (introduced or concluded)
    const mainArguments = chapterContext.keyArguments
      .filter(arg => arg.type === 'introduced' || arg.type === 'concluded')
      .slice(0, this.config.maxKeyPointsPerChapter);

    for (const arg of mainArguments) {
      // Compress to first 100 characters
      const point = arg.statement.length > 100
        ? arg.statement.substring(0, 97) + '...'
        : arg.statement;
      keyPoints.push(point);
    }

    // If we have room, add theme-based points
    if (keyPoints.length < this.config.maxKeyPointsPerChapter) {
      for (const theme of chapterContext.themes.slice(0, 2)) {
        if (keyPoints.length >= this.config.maxKeyPointsPerChapter) break;
        keyPoints.push(`Addresses ${theme} theme`);
      }
    }

    // Ensure we have at least one key point
    if (keyPoints.length === 0 && chapterContext.summary) {
      keyPoints.push(chapterContext.summary.substring(0, 100));
    }

    const summary: CompressedSummary = {
      chapterNumber: chapterContext.chapterId,
      title: chapterContext.chapterTitle,
      keyPoints,
      tokenCount: this.estimateTokens(
        chapterContext.chapterTitle + keyPoints.join(' ')
      ),
    };

    return summary;
  }

  /**
   * Promote warm context to hot for a specific section
   *
   * Selects the most relevant content from warm context for
   * immediate use in the current section.
   *
   * @param warmContext - Tier 2 warm context
   * @param section - Current section name
   * @param chapterNumber - Current chapter number
   * @returns Hot context for Tier 1
   */
  promoteToHot(
    warmContext: WarmContext,
    section: string,
    chapterNumber: number
  ): HotContext {
    // Start with empty hot context
    const hot: HotContext = {
      currentSection: section,
      relevantArguments: [],
      styleInjection: '',
      immediateTerms: new Map(),
      tokenCount: 0,
    };

    // Get the most recent chapter's arguments (most relevant)
    const recentChapters = Array.from(this.chapterContexts.values())
      .filter(c => c.chapterId < chapterNumber)
      .sort((a, b) => b.chapterId - a.chapterId) // Most recent first
      .slice(0, 3); // Only last 3 chapters

    // Collect compressed arguments
    for (const chapter of recentChapters) {
      for (const arg of chapter.keyArguments) {
        if (hot.relevantArguments.length >= this.config.maxHotArguments) break;

        hot.relevantArguments.push({
          id: arg.id,
          statement: arg.statement.substring(0, 150),
          chapter: chapter.chapterId,
          evidenceCount: arg.supportingEvidence.length,
          status: arg.type,
        });
      }
    }

    // Select most relevant terms from warm context
    let termCount = 0;
    for (const [term, definition] of warmContext.criticalTerms) {
      if (termCount >= this.config.maxHotTerms) break;
      hot.immediateTerms.set(term, definition);
      termCount++;
    }

    // Build style injection from thesis
    if (this.mainThesis) {
      hot.styleInjection = `Main thesis: ${this.mainThesis}\n`;
    }

    // Calculate token count
    hot.tokenCount = this.calculateHotTokenCount(hot);

    return hot;
  }

  /**
   * Build a prompt string within a specified token budget
   *
   * Intelligently combines tiers to create a prompt that fits
   * within the specified token limit.
   *
   * @param tiered - The tiered context structure
   * @param budget - Maximum tokens for the output
   * @returns Formatted prompt string
   */
  buildPromptWithBudget(tiered: TieredContext, budget: number): string {
    const sections: string[] = [];
    let remainingBudget = budget;

    // Header (minimal overhead)
    const header = '# DISSERTATION CONTEXT\n\n';
    sections.push(header);
    remainingBudget -= this.estimateTokens(header);

    // Always include Tier 1 Hot (highest priority)
    const hotSection = this.formatHotContext(tiered.tier1Hot);
    const hotTokens = this.estimateTokens(hotSection);

    if (hotTokens <= remainingBudget) {
      sections.push(hotSection);
      remainingBudget -= hotTokens;
    } else {
      // If hot context exceeds budget, truncate it
      const truncatedHot = this.truncateToTokens(hotSection, remainingBudget);
      sections.push(truncatedHot);
      remainingBudget = 0;
    }

    // Include Tier 2 Warm if we have budget
    if (remainingBudget > 1000) {
      const warmSection = this.formatWarmContext(tiered.tier2Warm, remainingBudget);
      sections.push(warmSection);
      remainingBudget -= this.estimateTokens(warmSection);
    }

    // Add retrieval hint if we have cold storage
    if (remainingBudget > 100) {
      sections.push('\n---\n*Additional context available via retrieval if needed.*\n');
    }

    return sections.join('\n');
  }

  /**
   * Estimate token count for a string
   *
   * Uses a simple character-based estimation (4 chars per token by default).
   *
   * @param text - Text to estimate
   * @returns Estimated token count
   */
  estimateTokens(text: string): number {
    return Math.ceil(text.length / this.config.charsPerToken);
  }

  // ==========================================================================
  // Private Helper Methods
  // ==========================================================================

  /**
   * Build Tier 2 warm context from chapter contexts
   */
  private buildWarmContext(priorContexts: ChapterContext[]): WarmContext {
    const warm: WarmContext = {
      chapterSummaries: new Map(),
      thesisStatements: [],
      criticalTerms: new Map(),
      tokenCount: 0,
    };

    // Compress each chapter
    for (const context of priorContexts) {
      const summary = this.compressToWarm(context);
      warm.chapterSummaries.set(context.chapterId, summary);
      warm.tokenCount += summary.tokenCount;
    }

    // Add thesis statements
    if (this.mainThesis) {
      warm.thesisStatements.push(this.mainThesis);
    }
    warm.thesisStatements.push(...this.subTheses.slice(0, 5));

    // Collect critical terms (limit to max)
    let termCount = 0;
    for (const [key, term] of this.glossary) {
      if (termCount >= this.config.maxWarmTerms) break;
      warm.criticalTerms.set(term.term, term.definition.substring(0, 100));
      termCount++;
    }

    // Update token count
    warm.tokenCount += this.estimateTokens(warm.thesisStatements.join(' '));
    warm.tokenCount += this.estimateTokens(
      Array.from(warm.criticalTerms.values()).join(' ')
    );

    // Enforce tier max
    if (warm.tokenCount > this.config.tier2MaxTokens) {
      this.compressWarmContext(warm);
    }

    return warm;
  }

  /**
   * Compress warm context to fit within limits
   */
  private compressWarmContext(warm: WarmContext): void {
    // First, reduce key points per chapter
    for (const [chapterNum, summary] of warm.chapterSummaries) {
      if (summary.keyPoints.length > 3) {
        summary.keyPoints = summary.keyPoints.slice(0, 3);
        summary.tokenCount = this.estimateTokens(
          summary.title + summary.keyPoints.join(' ')
        );
      }
    }

    // Recalculate total
    warm.tokenCount = 0;
    for (const summary of warm.chapterSummaries.values()) {
      warm.tokenCount += summary.tokenCount;
    }
    warm.tokenCount += this.estimateTokens(warm.thesisStatements.join(' '));
    warm.tokenCount += this.estimateTokens(
      Array.from(warm.criticalTerms.values()).join(' ')
    );

    // If still too large, remove oldest chapter summaries
    if (warm.tokenCount > this.config.tier2MaxTokens) {
      const chapters = Array.from(warm.chapterSummaries.keys()).sort((a, b) => a - b);
      while (warm.tokenCount > this.config.tier2MaxTokens && chapters.length > 2) {
        const oldest = chapters.shift()!;
        const removed = warm.chapterSummaries.get(oldest);
        warm.chapterSummaries.delete(oldest);
        if (removed) {
          warm.tokenCount -= removed.tokenCount;
        }
      }
    }
  }

  /**
   * Calculate token count for hot context
   */
  private calculateHotTokenCount(hot: HotContext): number {
    let count = 0;

    count += this.estimateTokens(hot.currentSection);
    count += this.estimateTokens(hot.styleInjection);

    for (const arg of hot.relevantArguments) {
      count += this.estimateTokens(arg.statement);
    }

    for (const def of hot.immediateTerms.values()) {
      count += this.estimateTokens(def);
    }

    return count;
  }

  /**
   * Format hot context as a prompt section
   */
  private formatHotContext(hot: HotContext): string {
    const sections: string[] = [];

    sections.push('## IMMEDIATE CONTEXT\n');

    // Current section
    if (hot.currentSection) {
      sections.push(`**Writing**: ${hot.currentSection}\n`);
    }

    // Style injection
    if (hot.styleInjection) {
      sections.push('### Thesis Guidance');
      sections.push(hot.styleInjection);
    }

    // Relevant arguments
    if (hot.relevantArguments.length > 0) {
      sections.push('### Active Arguments');
      sections.push('Continue or address these arguments:\n');

      for (const arg of hot.relevantArguments) {
        const status = arg.status === 'introduced' ? 'Active' :
                       arg.status === 'developed' ? 'Developing' : 'Concluded';
        sections.push(`- **Ch.${arg.chapter}** [${status}]: ${arg.statement}`);
      }
      sections.push('');
    }

    // Immediate terms
    if (hot.immediateTerms.size > 0) {
      sections.push('### Key Terms (Use Consistently)');
      for (const [term, definition] of hot.immediateTerms) {
        sections.push(`- **${term}**: ${definition}`);
      }
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Format warm context as a prompt section
   */
  private formatWarmContext(warm: WarmContext, maxTokens: number): string {
    const sections: string[] = [];
    let tokenCount = 0;

    sections.push('## DISSERTATION OVERVIEW\n');
    tokenCount += this.estimateTokens(sections[0]);

    // Thesis statements
    if (warm.thesisStatements.length > 0 && tokenCount < maxTokens - 500) {
      sections.push('### Thesis');
      for (const thesis of warm.thesisStatements) {
        const line = `- ${thesis}`;
        const lineTokens = this.estimateTokens(line);
        if (tokenCount + lineTokens > maxTokens) break;
        sections.push(line);
        tokenCount += lineTokens;
      }
      sections.push('');
    }

    // Chapter summaries
    if (warm.chapterSummaries.size > 0 && tokenCount < maxTokens - 500) {
      sections.push('### Prior Chapters');

      for (const [chapterNum, summary] of warm.chapterSummaries) {
        const header = `**Chapter ${chapterNum}: ${summary.title}**`;
        const headerTokens = this.estimateTokens(header);

        if (tokenCount + headerTokens > maxTokens) break;

        sections.push(header);
        tokenCount += headerTokens;

        for (const point of summary.keyPoints) {
          const line = `  - ${point}`;
          const lineTokens = this.estimateTokens(line);
          if (tokenCount + lineTokens > maxTokens) break;
          sections.push(line);
          tokenCount += lineTokens;
        }
        sections.push('');
      }
    }

    return sections.join('\n');
  }

  /**
   * Truncate text to fit within a token limit
   */
  private truncateToTokens(text: string, maxTokens: number): string {
    const maxChars = maxTokens * this.config.charsPerToken;
    if (text.length <= maxChars) return text;

    return text.substring(0, maxChars - 3) + '...';
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get current tier statistics
   */
  getStats(): {
    chaptersLoaded: number;
    glossaryTerms: number;
    hasThesis: boolean;
    estimatedWarmTokens: number;
  } {
    const contexts = Array.from(this.chapterContexts.values());
    const warm = this.buildWarmContext(contexts);

    return {
      chaptersLoaded: this.chapterContexts.size,
      glossaryTerms: this.glossary.size,
      hasThesis: !!this.mainThesis,
      estimatedWarmTokens: warm.tokenCount,
    };
  }

  /**
   * Clear all loaded content
   */
  clear(): void {
    this.chapterContexts.clear();
    this.glossary.clear();
    this.mainThesis = '';
    this.subTheses = [];

    if (this.coldAccessor instanceof InMemoryColdContextAccessor) {
      this.coldAccessor.clear();
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a TieredContextManager with default configuration
 */
export function createTieredContextManager(
  config?: TieredContextManagerConfig
): TieredContextManager {
  return new TieredContextManager(config);
}

/**
 * Create a TieredContextManager optimized for Claude's context window
 */
export function createClaudeTieredContextManager(): TieredContextManager {
  return new TieredContextManager({
    tier1MaxTokens: 50000,  // Hot: 50k tokens
    tier2MaxTokens: 20000,  // Warm: 20k tokens
    charsPerToken: 4,
  });
}

/**
 * Create a TieredContextManager for smaller context windows
 */
export function createSmallContextTieredManager(): TieredContextManager {
  return new TieredContextManager({
    tier1MaxTokens: 15000,
    tier2MaxTokens: 8000,
    maxKeyPointsPerChapter: 3,
    maxHotArguments: 5,
    maxHotTerms: 10,
    maxWarmTerms: 15,
  });
}

// ============================================================================
// AgentDB-backed Factory Functions
// ============================================================================

/**
 * Configuration for AgentDB-backed TieredContextManager
 */
export interface AgentDBTieredContextManagerConfig extends TieredContextManagerConfig {
  /** AgentDB cold accessor configuration */
  agentDbConfig?: AgentDBColdAccessorConfig;
}

/**
 * Create a TieredContextManager with AgentDB-backed cold storage
 *
 * This factory function creates a TieredContextManager that uses AgentDB
 * (VectorDB + HNSW) for true semantic search in the cold tier. This is
 * recommended for production use with large dissertations.
 *
 * Note: The returned manager is fully initialized and ready to use.
 * The AgentDB accessor will automatically fall back to keyword search
 * if the embedding service is unavailable.
 *
 * Usage:
 * ```typescript
 * const manager = await createAgentDBTieredContextManager({
 *   tier1MaxTokens: 50000,
 *   agentDbConfig: {
 *     persistencePath: '.agentdb/my-dissertation.bin',
 *   },
 * });
 *
 * // Add content to cold storage
 * const accessor = manager.getColdAccessor() as AgentDBColdContextAccessor;
 * await accessor.addChapterContent(1, chapterText);
 *
 * // Build tiered context (will use semantic search in cold tier)
 * const tiered = await manager.buildTieredContext(2, 'Section 2.1');
 * ```
 *
 * @param config - Configuration options
 * @returns Initialized TieredContextManager with AgentDB cold storage
 */
export async function createAgentDBTieredContextManager(
  config?: AgentDBTieredContextManagerConfig
): Promise<TieredContextManager> {
  // Create and initialize the AgentDB cold accessor
  const accessor = await createInitializedAgentDBColdAccessor(config?.agentDbConfig);

  // Create the TieredContextManager with the AgentDB accessor
  const manager = new TieredContextManager(config, accessor);

  return manager;
}

/**
 * Create an AgentDB-backed TieredContextManager optimized for Claude's context window
 *
 * Combines Claude-optimized tier settings with AgentDB semantic search.
 *
 * @param agentDbConfig - Optional AgentDB configuration overrides
 * @returns Initialized TieredContextManager
 */
export async function createClaudeAgentDBTieredContextManager(
  agentDbConfig?: AgentDBColdAccessorConfig
): Promise<TieredContextManager> {
  return createAgentDBTieredContextManager({
    tier1MaxTokens: 50000,
    tier2MaxTokens: 20000,
    charsPerToken: 4,
    agentDbConfig,
  });
}

// Re-export AgentDB types for convenience
export { AgentDBColdContextAccessor, type AgentDBColdAccessorConfig };
