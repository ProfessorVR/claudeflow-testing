/**
 * Intelligent Model Router - Type Definitions
 *
 * Implements TIER-2.1: Intelligent Model Router
 *
 * Provides:
 * - LLM provider interface for multi-model support
 * - Task classification types for routing decisions
 * - Routing configuration and decision types
 * - Cost and quality tracking types
 * - Audit and review types
 */

// ===== TASK CLASSIFICATION =====

/**
 * Types of tasks that can be classified for routing
 */
export type TaskType =
  | 'code_edit'
  | 'reasoning'
  | 'writing'
  | 'refactor'
  | 'research'
  | 'debug'
  | 'test'
  | 'unknown';

/**
 * Complexity levels for task classification
 */
export type Complexity = 'simple' | 'medium' | 'complex';

/**
 * Risk levels for task classification
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/**
 * Result of task classification
 */
export interface TaskClassification {
  /** The type of task identified */
  type: TaskType;
  /** Estimated complexity */
  complexity: Complexity;
  /** Risk level of the task */
  riskLevel: RiskLevel;
  /** Signals that led to this classification */
  signals: string[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Estimated number of files affected */
  estimatedFiles?: number;
  /** Estimated lines of change */
  estimatedLines?: number;
}

/**
 * Signals used for task classification
 */
export interface ClassificationSignals {
  /** Keywords found in the prompt */
  keywords: string[];
  /** File patterns detected */
  filePatterns: string[];
  /** Code patterns detected */
  codePatterns: string[];
  /** Estimated scope */
  scope: 'single_file' | 'multi_file' | 'architectural';
}

// ===== LLM PROVIDER =====

/**
 * Supported LLM provider types
 */
export type ProviderType = 'anthropic' | 'openai' | 'ollama' | 'vllm' | 'custom';

/**
 * Model capability types
 */
export type ModelCapability =
  | 'code'
  | 'reasoning'
  | 'research'
  | 'writing'
  | 'refactor'
  | 'debug'
  | 'test';

/**
 * Options for LLM completion requests
 */
export interface CompletionOptions {
  /** System prompt to use */
  systemPrompt?: string;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Temperature for generation (0-1) */
  temperature?: number;
  /** Stop sequences */
  stopSequences?: string[];
  /** Request timeout in ms */
  timeout?: number;
  /** Whether to stream the response */
  stream?: boolean;
}

/**
 * Response from an LLM completion
 */
export interface LLMResponse {
  /** The generated content */
  content: string;
  /** Model that generated the response */
  model: string;
  /** Provider that handled the request */
  provider: ProviderType;
  /** Token usage statistics */
  usage: TokenUsage;
  /** Response latency in ms */
  latencyMs: number;
  /** Whether the response was truncated */
  truncated: boolean;
  /** Stop reason if applicable */
  stopReason?: 'max_tokens' | 'stop_sequence' | 'end_turn';
}

/**
 * Token usage statistics
 */
export interface TokenUsage {
  /** Input tokens consumed */
  inputTokens: number;
  /** Output tokens generated */
  outputTokens: number;
  /** Total tokens */
  totalTokens: number;
}

/**
 * Cost breakdown for a request
 */
export interface CostBreakdown {
  /** Cost for input tokens in USD */
  inputCost: number;
  /** Cost for output tokens in USD */
  outputCost: number;
  /** Total cost in USD */
  totalCost: number;
}

/**
 * LLM Provider interface
 * All model providers must implement this interface
 */
export interface ILLMProvider {
  /** Unique identifier for this provider instance */
  readonly id: string;
  /** Provider type */
  readonly provider: ProviderType;
  /** Model identifier */
  readonly model: string;
  /** Capabilities this provider supports */
  readonly capabilities: ModelCapability[];
  /** Maximum complexity this provider can handle */
  readonly maxComplexity: Complexity;

  /**
   * Complete a prompt with this provider
   */
  complete(prompt: string, options?: CompletionOptions): Promise<LLMResponse>;

  /**
   * Stream a completion (optional)
   */
  stream?(prompt: string, options?: CompletionOptions): AsyncIterable<string>;

  /**
   * Check if this provider is currently available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get cost for a given number of tokens
   */
  getCost(inputTokens: number, outputTokens: number): CostBreakdown;

  /**
   * Test connectivity to this provider
   */
  testConnection(): Promise<boolean>;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  /** Provider type */
  provider: ProviderType;
  /** Model to use */
  model: string;
  /** API key (for cloud providers) */
  apiKey?: string;
  /** Base URL (for custom/local providers) */
  baseUrl?: string;
  /** Capabilities this model supports */
  capabilities: ModelCapability[];
  /** Maximum complexity level */
  maxComplexity: Complexity;
  /** Priority (lower = preferred) */
  priority: number;
  /** Cost per 1M input tokens in USD */
  inputCostPer1M: number;
  /** Cost per 1M output tokens in USD */
  outputCostPer1M: number;
  /** Request timeout in ms */
  timeout?: number;
  /** Whether this provider is enabled */
  enabled?: boolean;
}

// ===== ROUTING =====

/**
 * Result of a routing decision
 */
export interface RoutingDecision {
  /** Selected model ID */
  selectedModel: string;
  /** Selected provider type */
  selectedProvider: ProviderType;
  /** Reason for this selection */
  reason: string;
  /** Fallback chain if primary fails */
  fallbackChain: string[];
  /** Whether this was a manual override */
  wasOverride: boolean;
  /** Whether the task should be blocked (too complex, no suitable model) */
  blocked: boolean;
  /** Block reason if blocked */
  blockReason?: string;
  /** Task classification used for routing */
  classification: TaskClassification;
  /** Timestamp of decision */
  timestamp: Date;
}

/**
 * Routing rule configuration
 */
export interface RoutingRule {
  /** Task type this rule applies to */
  task?: TaskType;
  /** Complexity this rule applies to */
  complexity?: Complexity;
  /** Risk level this rule applies to */
  riskLevel?: RiskLevel;
  /** Ordered list of model IDs to try */
  route: string[];
  /** Whether to block if all models unavailable */
  blockIfUnavailable?: boolean;
}

/**
 * Router configuration
 */
export interface RouterConfig {
  /** Available models */
  models: Record<string, ProviderConfig>;
  /** Routing rules */
  routingRules: RoutingRule[];
  /** Cost tracking configuration */
  costTracking?: CostTrackingConfig;
  /** Default model for unknown tasks */
  defaultModel?: string;
  /** Whether to enable adaptive routing based on quality */
  adaptiveRouting?: boolean;
}

// ===== COST TRACKING =====

/**
 * Cost tracking configuration
 */
export interface CostTrackingConfig {
  /** Whether cost tracking is enabled */
  enabled: boolean;
  /** Budget limits */
  budgets?: BudgetLimits;
  /** Alert thresholds */
  alerts?: AlertConfig[];
}

/**
 * Budget limits
 */
export interface BudgetLimits {
  /** Daily budget in USD */
  daily?: number;
  /** Weekly budget in USD */
  weekly?: number;
  /** Monthly budget in USD */
  monthly?: number;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  /** Percentage of budget at which to alert */
  at: number;
  /** Action to take */
  action: 'warn' | 'fallback_to_local' | 'block';
}

/**
 * Cost record for a single request
 */
export interface CostRecord {
  /** Unique ID */
  id: string;
  /** Timestamp */
  timestamp: Date;
  /** Model used */
  model: string;
  /** Provider type */
  provider: ProviderType;
  /** Token usage */
  usage: TokenUsage;
  /** Cost breakdown */
  cost: CostBreakdown;
  /** Task type */
  taskType: TaskType;
}

/**
 * Aggregated cost statistics
 */
export interface CostStats {
  /** Period start */
  periodStart: Date;
  /** Period end */
  periodEnd: Date;
  /** Total cost in USD */
  totalCost: number;
  /** Cost by model */
  byModel: Record<string, number>;
  /** Cost by task type */
  byTaskType: Record<TaskType, number>;
  /** Total tokens used */
  totalTokens: number;
  /** Request count */
  requestCount: number;
  /** Budget status */
  budgetStatus: {
    daily: { used: number; limit?: number; percentage?: number };
    weekly: { used: number; limit?: number; percentage?: number };
    monthly: { used: number; limit?: number; percentage?: number };
  };
}

// ===== QUALITY SCORING =====

/**
 * Quality score for a response
 */
export interface QualityScore {
  /** Unique ID */
  id: string;
  /** Timestamp */
  timestamp: Date;
  /** Model used */
  model: string;
  /** Provider type */
  provider: ProviderType;
  /** Task type */
  taskType: TaskType;
  /** Task complexity */
  complexity: Complexity;
  /** Response latency in ms */
  responseTime: number;
  /** Tokens used */
  tokensUsed: number;
  /** User rating (1-5) */
  userRating: 1 | 2 | 3 | 4 | 5 | null;
  /** Whether user accepted the response */
  userAccepted: boolean;
  /** Whether user reverted the changes */
  userReverted: boolean;
  /** Whether tests pass (for code tasks) */
  testsPass: boolean | null;
  /** Number of lint errors introduced */
  lintErrors: number | null;
  /** Build success status */
  buildSuccess: boolean | null;
}

/**
 * Aggregated quality statistics for a model
 */
export interface ModelQualityStats {
  /** Model ID */
  model: string;
  /** Provider type */
  provider: ProviderType;
  /** Number of samples */
  sampleCount: number;
  /** Average user rating */
  averageRating: number | null;
  /** Acceptance rate (0-1) */
  acceptanceRate: number;
  /** Revert rate (0-1) */
  revertRate: number;
  /** Test pass rate (0-1) */
  testPassRate: number | null;
  /** Average response time in ms */
  averageResponseTime: number;
  /** Quality by task type */
  byTaskType: Record<TaskType, {
    sampleCount: number;
    averageRating: number | null;
    acceptanceRate: number;
  }>;
  /** Quality by complexity */
  byComplexity: Record<Complexity, {
    sampleCount: number;
    averageRating: number | null;
    acceptanceRate: number;
  }>;
}

// ===== AUDIT & REVIEW =====

/**
 * Review status for an audit entry
 */
export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'fixed';

/**
 * Audit entry for a non-Claude change
 */
export interface AuditEntry {
  /** Unique ID */
  id: string;
  /** Timestamp */
  timestamp: Date;
  /** Task type */
  taskType: TaskType;
  /** Task complexity */
  complexity: Complexity;
  /** Original prompt */
  originalPrompt: string;
  /** Model that handled the request */
  actualModel: string;
  /** Provider type */
  provider: ProviderType;
  /** Reason for routing to this model */
  routingReason: string;
  /** Files modified */
  filesModified: string[];
  /** Summary of changes */
  diffSummary: string;
  /** Full diff (git-style) */
  fullDiff: string;
  /** Review status */
  reviewStatus: ReviewStatus;
  /** Who reviewed (if reviewed) */
  reviewedBy: string | null;
  /** Review timestamp */
  reviewedAt: Date | null;
  /** Review notes */
  reviewNotes: string | null;
}

/**
 * Review queue statistics
 */
export interface ReviewQueueStats {
  /** Total pending reviews */
  pending: number;
  /** Pending high-risk reviews */
  pendingHighRisk: number;
  /** Reviews by model */
  byModel: Record<string, number>;
  /** Reviews by status */
  byStatus: Record<ReviewStatus, number>;
  /** Oldest pending review */
  oldestPending: Date | null;
}

// ===== EVENTS =====

/**
 * Event types for the router
 */
export type RouterEventType =
  | 'routing_decision'
  | 'provider_unavailable'
  | 'fallback_triggered'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'quality_recorded'
  | 'audit_created'
  | 'review_completed';

/**
 * Router event
 */
export interface RouterEvent {
  /** Event type */
  type: RouterEventType;
  /** Timestamp */
  timestamp: Date;
  /** Event data */
  data: Record<string, unknown>;
}

/**
 * Event handler for router events
 */
export type RouterEventHandler = (event: RouterEvent) => void;

// ===== ERRORS =====

/**
 * Base router error
 */
export class RouterError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'RouterError';
  }
}

/**
 * Provider unavailable error
 */
export class ProviderUnavailableError extends RouterError {
  constructor(providerId: string, reason?: string) {
    super(
      `Provider ${providerId} is unavailable${reason ? `: ${reason}` : ''}`,
      'PROVIDER_UNAVAILABLE',
      { providerId, reason }
    );
    this.name = 'ProviderUnavailableError';
  }
}

/**
 * No suitable model error
 */
export class NoSuitableModelError extends RouterError {
  constructor(taskType: TaskType, complexity: Complexity) {
    super(
      `No suitable model found for ${complexity} ${taskType} task`,
      'NO_SUITABLE_MODEL',
      { taskType, complexity }
    );
    this.name = 'NoSuitableModelError';
  }
}

/**
 * Budget exceeded error
 */
export class BudgetExceededError extends RouterError {
  constructor(period: 'daily' | 'weekly' | 'monthly', used: number, limit: number) {
    super(
      `${period} budget exceeded: $${used.toFixed(2)} / $${limit.toFixed(2)}`,
      'BUDGET_EXCEEDED',
      { period, used, limit }
    );
    this.name = 'BudgetExceededError';
  }
}

/**
 * Task blocked error
 */
export class TaskBlockedError extends RouterError {
  constructor(reason: string) {
    super(
      `Task blocked: ${reason}`,
      'TASK_BLOCKED',
      { reason }
    );
    this.name = 'TaskBlockedError';
  }
}
