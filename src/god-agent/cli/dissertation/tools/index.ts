/**
 * Autonomous Retrieval Tools for god-complete-section
 *
 * This module exports all tool-related functionality for enabling
 * LLMs to autonomously retrieve content from Tier 3 cold storage
 * during dissertation section generation.
 *
 * @module tools
 *
 * @example
 * ```typescript
 * import {
 *   DISSERTATION_TOOLS,
 *   ToolExecutor,
 *   formatResultForPrompt,
 *   toClaudeFormat
 * } from './tools';
 *
 * // Create executor with tiered context
 * const executor = new ToolExecutor(tieredContext);
 *
 * // Execute a tool call from LLM
 * const result = await executor.execute({
 *   id: 'call_123',
 *   name: 'searchDissertation',
 *   arguments: { query: 'phantasia temporal synthesis' }
 * });
 *
 * // Format result for prompt injection
 * const formatted = formatResultForPrompt(result);
 * ```
 */

// ============================================================================
// Tool Definitions
// ============================================================================

export {
  // Core tool definitions
  DISSERTATION_TOOLS,

  // Type definitions
  type ToolDefinition,
  type ToolParameter,
  type ToolCall,

  // Utility functions
  getToolDefinition,
  validateToolCall,
  toClaudeFormat,
  toOpenAIFormat,
  getToolNames,
} from './tool-definitions.js';

// ============================================================================
// Tool Result Types
// ============================================================================

export {
  // Result types
  type SearchResultItem,
  type SearchDissertationResult,
  type GetCitationResult,
  type GetFullSectionResult,
  type SourceListItem,
  type ListAvailableSourcesResult,
  type TypedToolResult,
  type ToolResultData,
  type ExecutedToolResult,
  type ToolExecutionStats,

  // Type guards
  isSearchResult,
  isCitationResult,
  isSectionResult,
  isSourcesResult,

  // Formatting
  formatResultForPrompt,
  estimateResultTokens,
} from './tool-result-types.js';

// ============================================================================
// Tool Executor
// ============================================================================

export {
  // Main executor class
  ToolExecutor,

  // Configuration
  type ToolExecutorConfig,
  DEFAULT_EXECUTOR_CONFIG,

  // Factory function
  createToolExecutor,
} from './tool-executor.js';

// ============================================================================
// Retrieval Orchestrator (Phase 2)
// ============================================================================

export {
  // Main orchestrator class
  RetrievalOrchestrator,

  // Configuration
  type RetrievalOrchestratorConfig,
  DEFAULT_ORCHESTRATOR_CONFIG,

  // Types
  type LLMResponse,
  type LLMClient,
  type GenerateOptions,
  type GenerationResult,
  type OrchestrationStats,

  // Factory function
  createRetrievalOrchestrator,
} from './retrieval-orchestrator.js';

// ============================================================================
// LLM Clients (Phase 2)
// ============================================================================

export {
  // Client classes
  ClaudeClient,
  OpenAIClient,

  // Factory functions
  createClaudeClient,
  createOpenAIClient,
  createVLLMClient,
  createAutoClient,
} from './llm-clients.js';
