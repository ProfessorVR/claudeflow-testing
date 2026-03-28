/**
 * Tool Executor with Safety Guards
 *
 * Executes tool calls from LLMs with comprehensive safety measures:
 * - Rate limiting
 * - Token budget enforcement
 * - Result size limits
 * - Error handling
 * - Execution tracking
 *
 * @module tool-executor
 */

import {
  type ToolCall,
  validateToolCall,
  getToolDefinition,
} from './tool-definitions.js';
import {
  type ExecutedToolResult,
  type TypedToolResult,
  type SearchDissertationResult,
  type GetCitationResult,
  type GetFullSectionResult,
  type ListAvailableSourcesResult,
  type SourceListItem,
  type ToolExecutionStats,
  type SearchResultItem,
} from './tool-result-types.js';
import { type TieredContext, type RetrievedChunk } from '../../context/tiered-context-manager.js';

/**
 * Configuration for tool executor safety guards
 */
export interface ToolExecutorConfig {
  /** Maximum results per search (prevents huge retrievals) */
  maxResultsPerSearch: number;
  /** Maximum characters per retrieved chunk */
  maxChunkSize: number;
  /** Maximum characters for full section retrieval */
  maxSectionSize: number;
  /** Minimum relevance score to include results */
  relevanceThreshold: number;
  /** Maximum tool calls per second (rate limiting) */
  maxRetrievalsPerSecond: number;
  /** Maximum total retrievals per session */
  maxTotalRetrievals: number;
  /** Timeout for individual tool execution (ms) */
  executionTimeoutMs: number;
}

/**
 * Default safe configuration
 */
export const DEFAULT_EXECUTOR_CONFIG: ToolExecutorConfig = {
  maxResultsPerSearch: 10,
  maxChunkSize: 2000,
  maxSectionSize: 5000,
  relevanceThreshold: 0.7,
  maxRetrievalsPerSecond: 10,
  maxTotalRetrievals: 50,
  executionTimeoutMs: 30000,
};

/**
 * Mock citation database — TEST ONLY.
 * Not used in production paths. Retained for unit test fixtures.
 */
const MOCK_CITATIONS: Record<string, GetCitationResult> = {
  'heidegger-being-time-1962': {
    citation:
      'Heidegger, M. (1962). Being and Time (J. Macquarrie & E. Robinson, Trans.). Harper & Row.',
    sourceId: 'heidegger-being-time-1962',
    author: 'Heidegger, Martin',
    year: 1962,
    title: 'Being and Time',
    publisher: 'Harper & Row',
    type: 'primary',
    abstract:
      "Heidegger's fundamental ontology investigating the question of Being through the analytic of Dasein.",
  },
  'aristotle-de-anima': {
    citation:
      'Aristotle. (1984). De Anima. In J. Barnes (Ed.), The Complete Works of Aristotle (Vol. 1). Princeton University Press.',
    sourceId: 'aristotle-de-anima',
    author: 'Aristotle',
    year: -350,
    title: 'De Anima',
    publisher: 'Princeton University Press',
    type: 'primary',
    abstract:
      "Aristotle's treatise on the soul, covering perception, imagination (phantasia), and intellect.",
  },
  'husserl-time-consciousness-1991': {
    citation:
      'Husserl, E. (1991). On the Phenomenology of the Consciousness of Internal Time (1893-1917) (J. B. Brough, Trans.). Kluwer Academic Publishers.',
    sourceId: 'husserl-time-consciousness-1991',
    author: 'Husserl, Edmund',
    year: 1991,
    title: 'On the Phenomenology of the Consciousness of Internal Time',
    publisher: 'Kluwer Academic Publishers',
    type: 'primary',
    abstract:
      "Husserl's analysis of time-consciousness, retention, protention, and the living present.",
  },
};

/**
 * Tool Executor with comprehensive safety guards
 */
export class ToolExecutor {
  private tieredContext: TieredContext;
  private config: ToolExecutorConfig;
  private executionCount: Map<string, number> = new Map();
  private totalExecutions: number = 0;
  private lastExecutionTime: number = 0;
  private totalTokensRetrieved: number = 0;
  private totalExecutionTimeMs: number = 0;
  private failedExecutions: number = 0;

  constructor(
    tieredContext: TieredContext,
    config: Partial<ToolExecutorConfig> = {}
  ) {
    this.tieredContext = tieredContext;
    this.config = { ...DEFAULT_EXECUTOR_CONFIG, ...config };
  }

  /**
   * Execute a tool call with safety guards
   */
  async execute(toolCall: ToolCall): Promise<ExecutedToolResult> {
    const startTime = Date.now();

    try {
      // Validate tool call
      const validation = validateToolCall(toolCall);
      if (!validation.valid) {
        throw new Error(`Invalid tool call: ${validation.errors.join(', ')}`);
      }

      // Check total execution limit
      if (this.totalExecutions >= this.config.maxTotalRetrievals) {
        throw new Error(
          `Maximum total retrievals (${this.config.maxTotalRetrievals}) exceeded`
        );
      }

      // Apply rate limiting
      await this.enforceRateLimit();

      // Execute with timeout
      const result = await this.executeWithTimeout(toolCall);

      const executionTimeMs = Date.now() - startTime;
      const tokenCount = this.estimateResultTokens(result);

      // Track execution
      this.trackExecution(toolCall.name, executionTimeMs, tokenCount, true);

      return {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        result,
        executionTimeMs,
        tokenCount,
        success: true,
      };
    } catch (error) {
      const executionTimeMs = Date.now() - startTime;
      this.trackExecution(toolCall.name, executionTimeMs, 0, false);

      return {
        toolCallId: toolCall.id,
        toolName: toolCall.name,
        result: { tool: toolCall.name as any, data: null },
        executionTimeMs,
        tokenCount: 0,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute tool with timeout protection
   */
  private async executeWithTimeout(toolCall: ToolCall): Promise<TypedToolResult> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error('Tool execution timeout')),
        this.config.executionTimeoutMs
      );
    });

    const executionPromise = this.executeToolByName(toolCall);

    return Promise.race([executionPromise, timeoutPromise]);
  }

  /**
   * Route tool call to appropriate executor
   */
  private async executeToolByName(toolCall: ToolCall): Promise<TypedToolResult> {
    switch (toolCall.name) {
      case 'searchDissertation':
        return this.executeSearchDissertation(toolCall.arguments);
      case 'getCitation':
        return this.executeGetCitation(toolCall.arguments);
      case 'getFullSection':
        return this.executeGetFullSection(toolCall.arguments);
      case 'listAvailableSources':
        return this.executeListAvailableSources(toolCall.arguments);
      default:
        throw new Error(`Unknown tool: ${toolCall.name}`);
    }
  }

  /**
   * Execute searchDissertation tool
   */
  private async executeSearchDissertation(
    args: Record<string, unknown>
  ): Promise<TypedToolResult> {
    const query = args.query as string;
    const topK = Math.min(
      (args.topK as number) || 5,
      this.config.maxResultsPerSearch
    );
    const chapters = args.chapters as number[] | undefined;
    const minRelevance = (args.minRelevance as number) || this.config.relevanceThreshold;

    const startTime = Date.now();

    // Search Tier 3 cold accessor
    let results: RetrievedChunk[];
    try {
      results = await this.tieredContext.tier3ColdAccessor.search(query, topK * 2);
    } catch (error) {
      // Fallback to empty results if search fails
      results = [];
    }

    // Filter by chapters if specified
    let filteredResults = results;
    if (chapters && chapters.length > 0) {
      filteredResults = results.filter((r) => {
        const chapterNum = this.extractChapterNumber(r.source);
        return chapters.includes(chapterNum);
      });
    }

    // Filter by relevance threshold
    filteredResults = filteredResults.filter(
      (r) => r.relevanceScore >= minRelevance
    );

    // Limit results and truncate content
    const limitedResults = filteredResults.slice(0, topK);

    const searchResults: SearchResultItem[] = limitedResults.map((r) => ({
      content: this.truncateContent(r.content, this.config.maxChunkSize),
      source: r.source,
      chapter: this.extractChapterNumber(r.source),
      section: this.extractSectionName(r.source),
      relevanceScore: r.relevanceScore,
      tokenCount: this.estimateTokens(r.content),
    }));

    const data: SearchDissertationResult = {
      results: searchResults,
      totalMatches: filteredResults.length,
      query,
      executionTimeMs: Date.now() - startTime,
    };

    return { tool: 'searchDissertation', data };
  }

  /**
   * Execute getCitation tool
   */
  private async executeGetCitation(
    args: Record<string, unknown>
  ): Promise<TypedToolResult> {
    const sourceId = args.sourceId as string;
    const includeAbstract = (args.includeAbstract as boolean) ?? true;

    // Try Tier 3 cold accessor first
    let citationStr: string | null = null;
    try {
      citationStr = await this.tieredContext.tier3ColdAccessor.getCitation(sourceId);
    } catch {
      // Fall through to mock
    }

    // Use real corpus citation; mock citations are for testing only
    const citation = this.parseCitationString(citationStr, sourceId);

    if (!citation) {
      return { tool: 'getCitation', data: null };
    }

    // Remove abstract if not requested
    const result: GetCitationResult = { ...citation };
    if (!includeAbstract) {
      delete result.abstract;
    }

    return { tool: 'getCitation', data: result };
  }

  /**
   * Execute getFullSection tool
   */
  private async executeGetFullSection(
    args: Record<string, unknown>
  ): Promise<TypedToolResult> {
    const chapter = args.chapter as number;
    const sectionName = args.sectionName as string;
    const maxLength = Math.min(
      (args.maxLength as number) || this.config.maxSectionSize,
      this.config.maxSectionSize
    );

    // Try Tier 3 cold accessor
    let content: string | null = null;
    try {
      content = await this.tieredContext.tier3ColdAccessor.getFullSection(
        chapter,
        sectionName
      );
    } catch {
      // Fall through to null
    }

    if (!content) {
      return { tool: 'getFullSection', data: null };
    }

    const truncated = content.length > maxLength;
    const originalLength = content.length;
    const truncatedContent = truncated
      ? content.substring(0, maxLength - 3) + '...'
      : content;

    const data: GetFullSectionResult = {
      content: truncatedContent,
      chapter,
      sectionName,
      wordCount: this.countWords(truncatedContent),
      tokenCount: this.estimateTokens(truncatedContent),
      summary: content.substring(0, 200) + '...',
      truncated,
      ...(truncated && { originalLength }),
    };

    return { tool: 'getFullSection', data };
  }

  /**
   * Execute listAvailableSources tool
   */
  private async executeListAvailableSources(
    args: Record<string, unknown>
  ): Promise<TypedToolResult> {
    const filter = args.filter as string | undefined;
    const typeFilter = (args.type as 'primary' | 'secondary' | 'all') || 'all';
    const limit = (args.limit as number) || 20;

    // ColdContextAccessor has no list/metadata API — RetrievedChunk only contains
    // content + source + relevanceScore, not the structured fields SourceListItem needs.
    // Return empty until a proper corpus listing API is added.
    let sources: SourceListItem[] = [];

    // Apply type filter
    if (typeFilter !== 'all') {
      sources = sources.filter((s) => s.type === typeFilter);
    }

    // Apply text filter
    if (filter) {
      const filterLower = filter.toLowerCase();
      sources = sources.filter(
        (s) =>
          s.author.toLowerCase().includes(filterLower) ||
          s.title.toLowerCase().includes(filterLower) ||
          String(s.year).includes(filter)
      );
    }

    // Apply limit
    const limitedSources = sources.slice(0, limit);

    const data: ListAvailableSourcesResult = {
      sources: limitedSources,
      totalCount: sources.length,
      filter,
      typeFilter,
    };

    return { tool: 'listAvailableSources', data };
  }

  /**
   * Enforce rate limiting between executions
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const minInterval = 1000 / this.config.maxRetrievalsPerSecond;
    const timeSinceLastExecution = now - this.lastExecutionTime;

    if (timeSinceLastExecution < minInterval) {
      const waitTime = minInterval - timeSinceLastExecution;
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastExecutionTime = Date.now();
  }

  /**
   * Track execution statistics
   */
  private trackExecution(
    toolName: string,
    executionTimeMs: number,
    tokenCount: number,
    success: boolean
  ): void {
    const count = this.executionCount.get(toolName) || 0;
    this.executionCount.set(toolName, count + 1);
    this.totalExecutions++;
    this.totalTokensRetrieved += tokenCount;
    this.totalExecutionTimeMs += executionTimeMs;
    if (!success) {
      this.failedExecutions++;
    }
  }

  /**
   * Get execution statistics
   */
  getStats(): ToolExecutionStats {
    return {
      totalExecutions: this.totalExecutions,
      executionsByTool: Object.fromEntries(this.executionCount),
      totalTokensRetrieved: this.totalTokensRetrieved,
      totalExecutionTimeMs: this.totalExecutionTimeMs,
      failedExecutions: this.failedExecutions,
    };
  }

  /**
   * Reset execution statistics
   */
  resetStats(): void {
    this.executionCount.clear();
    this.totalExecutions = 0;
    this.totalTokensRetrieved = 0;
    this.totalExecutionTimeMs = 0;
    this.failedExecutions = 0;
  }

  // ========================================================================
  // Helper Methods
  // ========================================================================

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private estimateResultTokens(result: TypedToolResult): number {
    const jsonStr = JSON.stringify(result);
    return this.estimateTokens(jsonStr);
  }

  private truncateContent(content: string, maxSize: number): string {
    if (content.length <= maxSize) return content;
    return content.substring(0, maxSize - 3) + '...';
  }

  private extractChapterNumber(source: string): number {
    const match = source.match(/Chapter\s*(\d+)/i);
    return match ? parseInt(match[1]) : 0;
  }

  private extractSectionName(source: string): string {
    const match = source.match(/Section\s*["']?([^"',]+)/i);
    return match ? match[1].trim() : '';
  }

  private countWords(text: string): number {
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }

  private parseCitationString(
    citationStr: string | null,
    sourceId: string
  ): GetCitationResult | null {
    if (!citationStr) return null;

    // Basic parsing - in production would be more sophisticated
    const authorMatch = citationStr.match(/^([^(]+)\s*\(/);
    const yearMatch = citationStr.match(/\((\d{4})\)/);
    const titleMatch = citationStr.match(/\.\s*([^.]+)\./);

    return {
      citation: citationStr,
      sourceId,
      author: authorMatch ? authorMatch[1].trim() : 'Unknown',
      year: yearMatch ? parseInt(yearMatch[1]) : 0,
      title: titleMatch ? titleMatch[1].trim() : 'Unknown',
      type: 'secondary',
    };
  }
}

/**
 * Create a new tool executor with default configuration
 */
export function createToolExecutor(
  tieredContext: TieredContext,
  config?: Partial<ToolExecutorConfig>
): ToolExecutor {
  return new ToolExecutor(tieredContext, config);
}
