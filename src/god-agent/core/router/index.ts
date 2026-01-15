/**
 * Intelligent Model Router Module
 *
 * Implements TIER-2.1: Intelligent Model Router
 *
 * Provides:
 * - Multi-model routing based on task classification
 * - Capability-based model selection
 * - Cost tracking and budget enforcement
 * - Quality scoring and adaptive routing
 * - Audit logging for non-Claude changes
 *
 * Architecture:
 * - TaskClassifier: Analyzes prompts for task type/complexity
 * - CapabilityRouter: Routes to appropriate model
 * - LLMProviderFactory: Manages provider instances
 * - CostTracker: Tracks spending per model
 * - QualityScorer: Tracks response quality
 * - AuditLogger: Logs non-Claude changes
 */

// ===== TYPES =====

export type {
  // Task Classification
  TaskType,
  Complexity,
  RiskLevel,
  TaskClassification,
  ClassificationSignals,

  // LLM Provider
  ProviderType,
  ModelCapability,
  CompletionOptions,
  LLMResponse,
  TokenUsage,
  CostBreakdown,
  ILLMProvider,
  ProviderConfig,

  // Routing
  RoutingDecision,
  RoutingRule,
  RouterConfig,

  // Cost Tracking
  CostTrackingConfig,
  BudgetLimits,
  AlertConfig,
  CostRecord,
  CostStats,

  // Quality Scoring
  QualityScore,
  ModelQualityStats,

  // Audit & Review
  ReviewStatus,
  AuditEntry,
  ReviewQueueStats,

  // Events
  RouterEventType,
  RouterEvent,
  RouterEventHandler,
} from './router-types.js';

// ===== ERROR CLASSES =====

export {
  RouterError,
  ProviderUnavailableError,
  NoSuitableModelError,
  BudgetExceededError,
  TaskBlockedError,
} from './router-types.js';

// ===== TASK CLASSIFIER =====

export {
  TaskClassifier,
  getTaskClassifier,
  resetTaskClassifier,
  classifyTask,
  isSuitableForComplexity,
  describeClassification,
} from './task-classifier.js';

export type {
  TaskClassifierConfig,
  ClassificationContext,
} from './task-classifier.js';

// ===== LLM PROVIDER =====

export {
  BaseLLMProvider,
  MockLLMProvider,
  calculateCost,
  formatCost,
  estimateTokenCount,
  validateCompletionOptions,
} from './llm-provider.js';

// ===== CAPABILITY ROUTER =====

export {
  CapabilityRouter,
  getCapabilityRouter,
  initializeRouter,
  resetCapabilityRouter,
  createRoutingDecision,
  isRoutingSuccessful,
  getRoutingDecisionSummary,
} from './capability-router.js';

export type {
  CapabilityRouterConfig,
  RouteOptions,
} from './capability-router.js';

// ===== ROUTER CONFIGURATION =====

export {
  DEFAULT_ROUTER_CONFIG,
  DEFAULT_MODEL_CONFIGS,
  DEFAULT_ROUTING_RULES,
  CONFIG_PATHS,
  loadRouterConfig,
  validateRouterConfig,
  createMinimalConfig,
  createDefaultConfig,
  getModelConfig,
  listModelIds,
} from './router-config.js';

export type {
  ValidationResult,
} from './router-config.js';
