/**
 * Retrieval Orchestrator - Main autonomous retrieval loop
 *
 * Orchestrates the iterative retrieval-generation loop where:
 * 1. LLM generates content with tool access
 * 2. LLM calls tools to retrieve needed content
 * 3. Tool results are injected into prompt
 * 4. Loop continues until generation complete
 *
 * @module retrieval-orchestrator
 */

import {
  ToolExecutor,
  type ToolExecutorConfig,
} from './tool-executor.js';
import { type ToolCall, DISSERTATION_TOOLS } from './tool-definitions.js';
import {
  type ExecutedToolResult,
  formatResultForPrompt,
} from './tool-result-types.js';
import type { TieredContext } from '../../context/tiered-context-manager.js';

/**
 * LLM response with potential tool calls
 */
export interface LLMResponse {
  /** Generated text content */
  content: string;
  /** Tool calls requested by LLM (if any) */
  toolCalls?: ToolCall[];
  /** Why generation stopped */
  stopReason: 'end_turn' | 'tool_calls' | 'max_tokens' | 'stop_sequence';
  /** Token usage statistics */
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
}

/**
 * LLM client interface for generation
 */
export interface LLMClient {
  /**
   * Generate content with optional tool access
   */
  generate(prompt: string, options: GenerateOptions): Promise<LLMResponse>;
}

/**
 * Options for LLM generation
 */
export interface GenerateOptions {
  /** Available tools (if any) */
  tools?: unknown[];
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for sampling */
  temperature?: number;
  /** Model to use */
  model?: string;
}

/**
 * Complete generation result with statistics
 */
export interface GenerationResult {
  /** Final generated content */
  content: string;
  /** Number of retrieval rounds executed */
  retrievalRounds: number;
  /** Total tokens retrieved from Tier 3 */
  totalRetrievalTokens: number;
  /** All tool executions */
  executedTools: ExecutedToolResult[];
  /** Total generation time in milliseconds */
  totalTimeMs: number;
  /** Token usage statistics */
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  /** Whether generation completed successfully */
  success: boolean;
  /** Error message if failed */
  error?: string;
}

/**
 * Configuration for retrieval orchestrator
 */
export interface RetrievalOrchestratorConfig {
  /** Maximum retrieval rounds (prevents infinite loops) */
  maxRetrievalRounds: number;
  /** Maximum context tokens (enforces budget) */
  maxContextTokens: number;
  /** Maximum output tokens per generation */
  maxOutputTokens: number;
  /** Token buffer reserved for generation */
  tokenBufferForGeneration: number;
  /** Tool executor configuration */
  toolExecutorConfig?: Partial<ToolExecutorConfig>;
}

/**
 * Default orchestrator configuration
 */
export const DEFAULT_ORCHESTRATOR_CONFIG: RetrievalOrchestratorConfig = {
  maxRetrievalRounds: 5,
  maxContextTokens: 180000,
  maxOutputTokens: 4000,
  tokenBufferForGeneration: 20000,
};

/**
 * Orchestrates autonomous retrieval during generation
 */
export class RetrievalOrchestrator {
  private toolExecutor: ToolExecutor;
  private config: RetrievalOrchestratorConfig;
  private retrievalRounds: number = 0;
  private totalRetrievalTokens: number = 0;
  private executedTools: ExecutedToolResult[] = [];

  constructor(
    private tieredContext: TieredContext,
    config: Partial<RetrievalOrchestratorConfig> = {}
  ) {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };
    this.toolExecutor = new ToolExecutor(
      tieredContext,
      config.toolExecutorConfig
    );
  }

  /**
   * Generate content with autonomous retrieval
   *
   * Main orchestration loop:
   * 1. Generate with tools available
   * 2. Execute any tool calls
   * 3. Inject results into prompt
   * 4. Continue until done or max rounds
   */
  async generateWithRetrieval(
    initialPrompt: string,
    llmClient: LLMClient,
    options: Partial<GenerateOptions> = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    let currentPrompt = initialPrompt;
    let response: LLMResponse | undefined;
    let success = true;
    let error: string | undefined;

    // Reset state
    this.retrievalRounds = 0;
    this.totalRetrievalTokens = 0;
    this.executedTools = [];

    try {
      // Main retrieval loop
      do {
        // Check maximum rounds
        if (this.retrievalRounds >= this.config.maxRetrievalRounds) {
          console.warn(
            `[RetrievalOrchestrator] Reached maximum retrieval rounds (${this.config.maxRetrievalRounds})`
          );
          break;
        }

        // Generate with tool access
        response = await llmClient.generate(currentPrompt, {
          tools: DISSERTATION_TOOLS,
          maxTokens: options.maxTokens || this.config.maxOutputTokens,
          temperature: options.temperature || 0.7,
          model: options.model,
        });

        // Check if LLM requested tool calls
        if (response.toolCalls && response.toolCalls.length > 0) {
          this.retrievalRounds++;

          console.log(
            `[RetrievalOrchestrator] Round ${this.retrievalRounds}: Executing ${response.toolCalls.length} tool(s)`
          );

          // Execute all tool calls in parallel
          const toolResults = await Promise.all(
            response.toolCalls.map((tc) => this.toolExecutor.execute(tc))
          );

          this.executedTools.push(...toolResults);

          // Calculate retrieval tokens
          const retrievalTokens = toolResults.reduce(
            (sum, r) => sum + r.tokenCount,
            0
          );
          this.totalRetrievalTokens += retrievalTokens;

          // Check token budget
          if (this.exceedsTokenBudget(currentPrompt, retrievalTokens)) {
            console.warn(
              '[RetrievalOrchestrator] Token budget exceeded, stopping retrieval'
            );
            break;
          }

          // Append tool results to prompt
          currentPrompt = this.appendToolResults(currentPrompt, toolResults);

          console.log(
            `[RetrievalOrchestrator] Retrieved ${retrievalTokens} tokens (total: ${this.totalRetrievalTokens})`
          );
        }
      } while (
        response?.toolCalls &&
        response.toolCalls.length > 0 &&
        this.retrievalRounds < this.config.maxRetrievalRounds
      );

      // If we exited the loop due to tool calls, make a final generation pass
      // This ensures Claude writes content instead of just requesting more tools
      if (response?.toolCalls && response.toolCalls.length > 0) {
        console.log(
          '[RetrievalOrchestrator] Making final generation pass (no tools available)'
        );

        // Append instruction to write using retrieved context
        const finalPrompt = `${currentPrompt}

You have retrieved sufficient context. Now write the complete section as requested in the original task. Do not request any more tools - use the context you have gathered to write comprehensive, well-cited content.`;

        // Generate without tool access to force content generation
        response = await llmClient.generate(finalPrompt, {
          tools: undefined, // No tools available - must write
          maxTokens: options.maxTokens || this.config.maxOutputTokens,
          temperature: options.temperature || 0.7,
          model: options.model,
        });
      }
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : String(err);
      console.error('[RetrievalOrchestrator] Generation failed:', error);

      // Create dummy response if error occurred before first response
      response = {
        content: '',
        stopReason: 'end_turn',
        usage: { inputTokens: 0, outputTokens: 0 },
      };
    }

    const totalTimeMs = Date.now() - startTime;

    return {
      content: response?.content ?? '',
      retrievalRounds: this.retrievalRounds,
      totalRetrievalTokens: this.totalRetrievalTokens,
      executedTools: this.executedTools,
      totalTimeMs,
      usage: response?.usage ?? { inputTokens: 0, outputTokens: 0 },
      success,
      error,
    };
  }

  /**
   * Check if adding retrieval would exceed token budget
   */
  private exceedsTokenBudget(
    currentPrompt: string,
    additionalTokens: number
  ): boolean {
    const currentTokens = this.estimateTokens(currentPrompt);
    const projectedTotal = currentTokens + additionalTokens;

    // Leave buffer for generation
    const maxAllowed =
      this.config.maxContextTokens - this.config.tokenBufferForGeneration;

    return projectedTotal > maxAllowed;
  }

  /**
   * Append tool results to prompt
   */
  private appendToolResults(
    prompt: string,
    results: ExecutedToolResult[]
  ): string {
    const formattedResults = results
      .map((r) => formatResultForPrompt(r))
      .join('\n\n');

    return `${prompt}\n\n## Retrieved Context:\n\n${formattedResults}`;
  }

  /**
   * Estimate token count for text
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Get orchestration statistics
   */
  getStats(): OrchestrationStats {
    return {
      retrievalRounds: this.retrievalRounds,
      totalRetrievalTokens: this.totalRetrievalTokens,
      toolExecutionStats: this.toolExecutor.getStats(),
      executedTools: this.executedTools.length,
      averageTokensPerRound:
        this.retrievalRounds > 0
          ? this.totalRetrievalTokens / this.retrievalRounds
          : 0,
    };
  }

  /**
   * Reset orchestrator state
   */
  reset(): void {
    this.retrievalRounds = 0;
    this.totalRetrievalTokens = 0;
    this.executedTools = [];
    this.toolExecutor.resetStats();
  }
}

/**
 * Orchestration statistics
 */
export interface OrchestrationStats {
  /** Number of retrieval rounds executed */
  retrievalRounds: number;
  /** Total tokens retrieved */
  totalRetrievalTokens: number;
  /** Tool execution statistics */
  toolExecutionStats: {
    totalExecutions: number;
    executionsByTool: Record<string, number>;
    totalTokensRetrieved: number;
    totalExecutionTimeMs: number;
    failedExecutions: number;
  };
  /** Total tool executions */
  executedTools: number;
  /** Average tokens per round */
  averageTokensPerRound: number;
}

/**
 * Create a retrieval orchestrator with default configuration
 */
export function createRetrievalOrchestrator(
  tieredContext: TieredContext,
  config?: Partial<RetrievalOrchestratorConfig>
): RetrievalOrchestrator {
  return new RetrievalOrchestrator(tieredContext, config);
}
