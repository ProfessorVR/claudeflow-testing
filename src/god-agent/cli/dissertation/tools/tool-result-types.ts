/**
 * Type-Safe Result Types for Dissertation Tools
 *
 * Defines strongly-typed result structures for each tool,
 * ensuring type safety throughout the retrieval pipeline.
 *
 * @module tool-result-types
 */

/**
 * A single search result from searchDissertation
 */
export interface SearchResultItem {
  /** Retrieved passage content */
  content: string;
  /** Source identifier (e.g., "Chapter 3, Section 2") */
  source: string;
  /** Chapter number where passage was found */
  chapter: number;
  /** Section name where passage was found */
  section: string;
  /** Relevance score from semantic search (0-1) */
  relevanceScore: number;
  /** Estimated token count of content */
  tokenCount: number;
  /** Highlight snippet showing query match */
  highlight?: string;
}

/**
 * Result from searchDissertation tool
 */
export interface SearchDissertationResult {
  /** Array of matching passages */
  results: SearchResultItem[];
  /** Total matches found (may exceed returned results) */
  totalMatches: number;
  /** Query that was executed */
  query: string;
  /** Search execution time in milliseconds */
  executionTimeMs: number;
}

/**
 * Result from getCitation tool
 */
export interface GetCitationResult {
  /** Full APA-formatted citation */
  citation: string;
  /** Unique source identifier */
  sourceId: string;
  /** Author name(s) */
  author: string;
  /** Publication year */
  year: number;
  /** Title of work */
  title: string;
  /** Publisher (if applicable) */
  publisher?: string;
  /** Page range if specific section cited */
  pageRange?: string;
  /** Abstract or key excerpt */
  abstract?: string;
  /** Source type */
  type: 'primary' | 'secondary';
  /** DOI if available */
  doi?: string;
}

/**
 * Result from getFullSection tool
 */
export interface GetFullSectionResult {
  /** Complete section content */
  content: string;
  /** Chapter number */
  chapter: number;
  /** Section name */
  sectionName: string;
  /** Word count of content */
  wordCount: number;
  /** Estimated token count */
  tokenCount: number;
  /** Brief summary (first 200 chars) */
  summary: string;
  /** Whether content was truncated */
  truncated: boolean;
  /** Original length if truncated */
  originalLength?: number;
}

/**
 * A single source from listAvailableSources
 */
export interface SourceListItem {
  /** Unique source identifier for getCitation */
  sourceId: string;
  /** Author name(s) */
  author: string;
  /** Title of work */
  title: string;
  /** Publication year */
  year: number;
  /** Source type */
  type: 'primary' | 'secondary';
  /** Short description if available */
  description?: string;
}

/**
 * Result from listAvailableSources tool
 */
export interface ListAvailableSourcesResult {
  /** Array of available sources */
  sources: SourceListItem[];
  /** Total sources matching filter */
  totalCount: number;
  /** Filter that was applied */
  filter?: string;
  /** Source type filter */
  typeFilter: 'primary' | 'secondary' | 'all';
}

/**
 * Union type representing all possible tool results
 */
export type ToolResultData =
  | SearchDissertationResult
  | GetCitationResult
  | GetFullSectionResult
  | ListAvailableSourcesResult
  | null;

/**
 * Discriminated union for type-safe tool result handling
 */
export type TypedToolResult =
  | { tool: 'searchDissertation'; data: SearchDissertationResult }
  | { tool: 'getCitation'; data: GetCitationResult | null }
  | { tool: 'getFullSection'; data: GetFullSectionResult | null }
  | { tool: 'listAvailableSources'; data: ListAvailableSourcesResult };

/**
 * Complete tool execution result with metadata
 */
export interface ExecutedToolResult {
  /** Tool call ID from LLM */
  toolCallId: string;
  /** Tool that was executed */
  toolName: string;
  /** Typed result data */
  result: TypedToolResult;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Estimated tokens in result */
  tokenCount: number;
  /** Whether execution succeeded */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Aggregated statistics for all tool executions
 */
export interface ToolExecutionStats {
  /** Total number of tool executions */
  totalExecutions: number;
  /** Executions by tool name */
  executionsByTool: Record<string, number>;
  /** Total tokens retrieved */
  totalTokensRetrieved: number;
  /** Total execution time in milliseconds */
  totalExecutionTimeMs: number;
  /** Average relevance score (for searches) */
  averageRelevance?: number;
  /** Number of failed executions */
  failedExecutions: number;
}

/**
 * Type guard for SearchDissertationResult
 */
export function isSearchResult(
  result: TypedToolResult
): result is { tool: 'searchDissertation'; data: SearchDissertationResult } {
  return result.tool === 'searchDissertation';
}

/**
 * Type guard for GetCitationResult
 */
export function isCitationResult(
  result: TypedToolResult
): result is { tool: 'getCitation'; data: GetCitationResult | null } {
  return result.tool === 'getCitation';
}

/**
 * Type guard for GetFullSectionResult
 */
export function isSectionResult(
  result: TypedToolResult
): result is { tool: 'getFullSection'; data: GetFullSectionResult | null } {
  return result.tool === 'getFullSection';
}

/**
 * Type guard for ListAvailableSourcesResult
 */
export function isSourcesResult(
  result: TypedToolResult
): result is { tool: 'listAvailableSources'; data: ListAvailableSourcesResult } {
  return result.tool === 'listAvailableSources';
}

/**
 * Format tool result for prompt injection
 */
export function formatResultForPrompt(result: ExecutedToolResult): string {
  if (!result.success) {
    return `**Tool: ${result.toolName}** (error)\nError: ${result.error}`;
  }

  const { result: typedResult } = result;

  if (isSearchResult(typedResult)) {
    return formatSearchResultForPrompt(typedResult.data);
  }

  if (isCitationResult(typedResult)) {
    return formatCitationResultForPrompt(typedResult.data);
  }

  if (isSectionResult(typedResult)) {
    return formatSectionResultForPrompt(typedResult.data);
  }

  if (isSourcesResult(typedResult)) {
    return formatSourcesResultForPrompt(typedResult.data);
  }

  return JSON.stringify(result, null, 2);
}

function formatSearchResultForPrompt(data: SearchDissertationResult): string {
  if (data.results.length === 0) {
    return `**Search Results:** No relevant passages found for "${data.query}".`;
  }

  const formatted = data.results
    .map(
      (r, i) =>
        `**Result ${i + 1}** (${r.source}, relevance: ${r.relevanceScore.toFixed(2)})\n${r.content}`
    )
    .join('\n\n');

  return `**Search Results for "${data.query}":** (${data.totalMatches} matches found)\n\n${formatted}`;
}

function formatCitationResultForPrompt(
  data: GetCitationResult | null
): string {
  if (!data) {
    return `**Citation:** Not found in corpus.`;
  }

  let result = `**Citation:**\n${data.citation}`;

  if (data.pageRange) {
    result += `\nPage Range: ${data.pageRange}`;
  }

  if (data.abstract) {
    result += `\n\nAbstract: ${data.abstract}`;
  }

  return result;
}

function formatSectionResultForPrompt(
  data: GetFullSectionResult | null
): string {
  if (!data) {
    return `**Section:** Not found.`;
  }

  let result = `**Section: Chapter ${data.chapter}, ${data.sectionName}** (${data.wordCount} words)`;

  if (data.truncated) {
    result += ` [truncated from ${data.originalLength} chars]`;
  }

  result += `\n\n${data.content}`;

  return result;
}

function formatSourcesResultForPrompt(data: ListAvailableSourcesResult): string {
  if (data.sources.length === 0) {
    return `**Available Sources:** No sources match the filter.`;
  }

  const sources = data.sources
    .map((s) => `- ${s.author} (${s.year}). *${s.title}* [${s.sourceId}]`)
    .join('\n');

  return `**Available Sources (${data.totalCount} total):**\n\n${sources}`;
}

/**
 * Estimate token count for any tool result
 */
export function estimateResultTokens(result: ExecutedToolResult): number {
  const jsonStr = JSON.stringify(result);
  return Math.ceil(jsonStr.length / 4);
}
