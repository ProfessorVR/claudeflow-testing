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

// ===== RISK CLASSIFIER =====

export {
  RiskClassifier,
  getRiskClassifier,
  resetRiskClassifier,
  initializeRiskClassifier,
  assessTaskRisk,
  shouldUseExpensiveModel,
  canUseLocalModel,
  describeRiskAssessment,
  getRouteDisplay,
} from './risk-classifier.js';

export type {
  FeedbackSpeed,
  Reversibility,
  VerificationMethod,
  RouteRecommendation,
  RiskAssessment,
  RiskContext,
  RiskClassifierConfig,
} from './risk-classifier.js';

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
  // Routing metrics
  getRoutingMetrics,
  resetRoutingMetrics,
} from './capability-router.js';

export type {
  CapabilityRouterConfig,
  RouteOptions,
  RoutingMetrics,
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

// ===== PROVIDERS =====

export {
  // Anthropic
  AnthropicProvider,
  createAnthropicProvider,
  createAllAnthropicProviders,
  isAnthropicConfigured,
  listAnthropicModels,
  ANTHROPIC_MODELS,

  // OpenAI
  OpenAIProvider,
  createOpenAIProvider,
  createAllOpenAIProviders,
  isOpenAIConfigured,
  listOpenAIModels,
  getBestReasoningModel,
  getBestCodeModel,
  getCostEffectiveModel,
  OPENAI_MODELS,

  // Ollama
  OllamaProvider,
  createOllamaProvider,
  createAllOllamaProviders,
  isOllamaConfigured,
  listOllamaModels,
  getBestOllamaCodeModel,
  getEfficientLocalModel,
  isModelPulled,
  OLLAMA_MODELS,

  // vLLM
  VLLMProvider,
  createVLLMProvider,
  createAllVLLMProviders,
  isVLLMConfigured,
  isVLLMEnvConfigured,
  listVLLMModels,
  getBestLocalCodeModel,
  getVLLMStatus,
  VLLM_MODELS,

  // Factory
  LLMProviderFactory,
  getProviderFactory,
  initializeProviderFactory,
  resetProviderFactory,
  createProviderById,
  getProviderType,
  listAllModelIds,
  getModelInfo,
  getConfiguredProviders,
} from './providers/index.js';

export type {
  AnthropicProviderConfig,
  AnthropicModelKey,
  OpenAIProviderConfig,
  OpenAIModelKey,
  OllamaProviderConfig,
  OllamaModelKey,
  VLLMProviderConfig,
  VLLMModelKey,
  ProviderFactoryConfig,
} from './providers/index.js';

// ===== AUDIT SYSTEM =====

export type {
  // Audit Types
  ReviewPriority,
  FileModification,
  AuditEntrySummary,
  AuditFilter,
  ReviewResult,
  AuditEventType,
  AuditEvent,
  AuditEventHandler,
  AuditConfig,
  RollbackOptions,
  RollbackResult,
  CreateAuditEntryInput,
  UpdateAuditEntryInput,
} from './audit-types.js';

export {
  // Audit Logger
  AuditLogger,
  getAuditLogger,
  initializeAuditLogger,
  resetAuditLogger,
  createFileModification,
  generateDiffSummary,
  generateFullDiff,
  formatAuditEntry,
} from './audit-logger.js';

export {
  // Review Queue
  ReviewQueue,
  getReviewQueue,
  resetReviewQueue,
  executeReviewCommand,
} from './review-queue.js';

export type {
  ReviewQueueConfig,
  ReviewCommand,
} from './review-queue.js';

// ===== COST TRACKING =====

export {
  CostTracker,
  getCostTracker,
  initializeCostTracker,
  resetCostTracker,
  formatCostString,
  estimateMonthlyFromDaily,
  calculateAverageCostPerRequest,
} from './cost-tracker.js';

export type {
  CostTrackerConfig,
} from './cost-tracker.js';

// ===== QUALITY SCORING =====

export {
  QualityScorer,
  getQualityScorer,
  initializeQualityScorer,
  resetQualityScorer,
} from './quality-scorer.js';

export type {
  QualityScorerConfig,
  QualityScoreInput,
} from './quality-scorer.js';

// ===== BUDGET ENFORCEMENT =====

export {
  BudgetEnforcer,
  getBudgetEnforcer,
  initializeBudgetEnforcer,
  resetBudgetEnforcer,
} from './budget-enforcer.js';

export type {
  BudgetEnforcerConfig,
  EnforcementResult,
  PreRequestCheck,
} from './budget-enforcer.js';

// ===== CLI COMMANDS =====

export {
  // Session state
  getSessionState,
  resetSessionState,
  setLastResponseId,

  // Model commands
  listModels,
  testModelConnection,
  testProvider,
  useModel,

  // Routing commands
  showRoutingStatus,
  suggestOptimizations,

  // Cost commands
  showCosts,
  setBudget,
  clearBudget,

  // Quality commands
  rateLastResponse,
  showQuality,
  showModelQuality,

  // Review commands
  showReviews,
  showReviewStats,

  // Analytics commands
  showAnalytics,

  // Command execution
  executeRouterCommand,

  // Integration helpers
  getModelForRequest,
  recordCompletedRequest,
} from './router-commands.js';

// ===== LOCAL-FIRST EXECUTOR =====

export {
  LocalFirstExecutor,
  getLocalFirstExecutor,
  resetLocalFirstExecutor,
  initializeLocalFirstExecutor,
  executeLocalFirst,
  summarizeExecution,
  formatTimeline,
  DefaultTestRunner,
  DefaultDiffGenerator,
} from './local-first-executor.js';

export type {
  LocalFirstResult,
  LocalFirstOptions,
  TestResult,
  ReviewResult as LocalReviewResult,
  ExecutorProvider,
  TestRunner as LocalTestRunner,
  DiffGenerator,
  LocalFirstExecutorConfig,
} from './local-first-executor.js';

// ===== DIFF REVIEWER =====

export {
  DiffReviewer,
  getDiffReviewer,
  resetDiffReviewer,
  initializeDiffReviewer,
  reviewDiff,
  summarizeReview,
  formatIssues,
  hasBlockingIssues,
  getIssuesBySeverity,
} from './diff-reviewer.js';

export type {
  IssueSeverity,
  IssueCategory,
  ReviewIssue,
  DiffReviewResult,
  ReviewContext,
  DiffReviewOptions,
  DiffReviewProvider,
  DiffReviewerConfig,
} from './diff-reviewer.js';

// ===== TEST RUNNER =====

export {
  TestRunner,
  getTestRunner,
  resetTestRunner,
  initializeTestRunner,
  runTests,
  summarizeTestResult,
  allTestsPassed,
  getFrameworkName,
} from './test-runner.js';

export type {
  TestFramework,
  TestRunResult,
  TestRunOptions,
  TestRunnerConfig,
} from './test-runner.js';

// ===== OUTCOME TRACKER =====

export {
  OutcomeTracker,
  getOutcomeTracker,
  resetOutcomeTracker,
  initializeOutcomeTracker,
  recordOutcome,
  shouldEscalatePattern,
  getPatternSuccessRate,
  formatOutcome,
  formatPatternStats,
  formatTrackerStats,
} from './outcome-tracker.js';

export type {
  RoutedTo,
  OutcomeStatus,
  RoutingOutcome,
  PatternStats,
  TrackerStats,
  RecordOutcomeInput,
  OutcomeQuery,
  OutcomeTrackerConfig,
} from './outcome-tracker.js';

// ===== ROUTING OPTIMIZER =====

export {
  RoutingOptimizer,
  getRoutingOptimizer,
  resetRoutingOptimizer,
  initializeRoutingOptimizer,
  getOptimizedRoute,
  getOptimizationSuggestions,
  formatSuggestion,
  formatReport,
  formatSummary,
} from './routing-optimizer.js';

export type {
  SuggestionPriority,
  RuleChangeType,
  RoutingRuleSuggestion,
  OptimizationReport,
  CostAnalysis,
  QualityAnalysis,
  RoutingOptimizerConfig,
} from './routing-optimizer.js';

// ===== ADAPTIVE ROUTER (Phase 6.1) =====

export {
  AdaptiveRouter,
  getAdaptiveRouter,
  initializeAdaptiveRouter,
  resetAdaptiveRouter,
  formatModelScore,
  formatAdaptiveRanking,
} from './adaptive-router.js';

export type {
  AdaptiveRouterConfig,
  ModelScore,
  AdaptiveRanking,
} from './adaptive-router.js';

// ===== A/B TESTING (Phase 6.2) =====

export {
  // Statistical Analysis
  StatisticalAnalyzer,
  getStatisticalAnalyzer,
  initializeStatisticalAnalyzer,
  resetStatisticalAnalyzer,

  // Experiment Management
  ExperimentManager,
  getExperimentManager,
  initializeExperimentManager,
  resetExperimentManager,
} from './ab-testing/index.js';

export type {
  // Status & Control
  ExperimentStatus,
  Winner,
  ExperimentEventType,

  // Configuration
  ExperimentConfig,
  CreateExperimentInput,
  AnalysisOptions,
  ExperimentQuery,

  // State & Outcomes
  ExperimentState,
  PairedOutcome,
  ModelOutcome,

  // Results
  StatisticalResults,
  ExperimentResults,
  MetricComparison,
  ExperimentSummary,

  // Events
  ExperimentEvent,
  ExperimentEventHandler,
} from './ab-testing/index.js';

// ===== COST OPTIMIZER (Phase 6.3) =====

export {
  CostOptimizer,
  getCostOptimizer,
  initializeCostOptimizer,
  resetCostOptimizer,
  formatRecommendation,
  formatParetoAnalysis,
  formatOptimizationReport,
} from './cost-optimizer.js';

export type {
  ModelCostQuality,
  ParetoPoint,
  SwitchRecommendation,
  ParetoAnalysis,
  CostOptimizationReport,
  CostOptimizerConfig,
} from './cost-optimizer.js';

// ===== ANALYTICS (Phase 6.4) =====

export {
  // Metrics Store
  MetricsStore,
  getMetricsStore,
  initializeMetricsStore,
  resetMetricsStore,
  getBucketKey,
  getBucketFromKey,
  getCurrentBucket,

  // Analytics Engine
  AnalyticsEngine,
  getAnalyticsEngine,
  initializeAnalyticsEngine,
  resetAnalyticsEngine,
  formatDashboardSummary,
  formatModelComparison,
  formatAlerts,
} from './analytics/index.js';

export type {
  // Time Periods
  TimePeriod,
  TimeBucket,

  // Metrics
  MetricPoint,
  MetricSeries,
  AggregatedMetric,
  StoredMetric,
  RollupConfig,

  // Model & Task Metrics
  ModelMetrics,
  TaskTypeMetrics,

  // Dashboard Data
  DashboardSummary,
  DashboardData,
  ModelComparison,
  QualityTrends,
  CostAnalytics,
  RequestVolume,

  // Queries
  AnalyticsQuery,
  AnalyticsResult,

  // Alerts
  AnalyticsAlert,
  AlertConfig as AnalyticsAlertConfig,

  // Config
  MetricsStoreConfig,
  AnalyticsEngineConfig,
} from './analytics/index.js';

// ===== RATE LIMITING (Phase 7.1) =====

export {
  RateLimiter,
  RateLimiterManager,
  getRateLimiterManager,
  initializeRateLimiter,
  resetRateLimiter,
  formatRateLimitStatus,
  formatAllRateLimitStatus,
  DEFAULT_RATE_LIMITS,
} from './rate-limiter.js';

export type {
  RateLimitConfig,
  RateLimitStatus,
  RateLimitResult,
  RateLimiterManagerConfig,
} from './rate-limiter.js';

// ===== RETRY HANDLING (Phase 7.1) =====

export {
  RetryHandler,
  RetryBudgetManager,
  classifyError,
  isRetryableError,
  getSuggestedDelay,
  withRetry,
  withRetryPreset,
  withRetryWrapper,
  getRetryBudgetManager,
  resetRetryBudgetManager,
  formatRetryResult,
  DEFAULT_RETRY_CONFIG,
  RETRY_PRESETS,
} from './retry-handler.js';

export type {
  RetryableErrorType,
  NonRetryableErrorType,
  ErrorType,
  RetryConfig,
  RetryResult,
  RetryAttempt,
  RetryBudget,
} from './retry-handler.js';

// ===== CIRCUIT BREAKER (Phase 7.2) =====

export {
  CircuitBreaker,
  CircuitBreakerManager,
  getCircuitBreakerManager,
  initializeCircuitBreaker,
  resetCircuitBreaker,
  formatCircuitStatus,
  formatAllCircuitStatus,
  getCircuitHealthSummary,
  DEFAULT_CIRCUIT_CONFIG,
  CIRCUIT_PRESETS,
} from './circuit-breaker.js';

export type {
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerStatus,
  CircuitEventType,
  CircuitEvent,
  CircuitBreakerResult,
  CircuitBreakerManagerConfig,
} from './circuit-breaker.js';

// ===== GRACEFUL DEGRADATION (Phase 7.3) =====

export {
  DegradationManager,
  getDegradationManager,
  initializeDegradation,
  resetDegradation,
  formatProviderHealth,
  formatDegradationDecision,
  formatAllProviderHealth,
  getHealthSummary,
  DEFAULT_DEGRADATION_CONFIG,
} from './graceful-degradation.js';

export type {
  HealthStatus,
  DegradationLevel,
  ProviderHealth,
  FallbackChain,
  DegradationDecision,
  DegradationConfig,
  CachedResponse,
} from './graceful-degradation.js';

// ===== MONITORING AND ALERTING (Phase 7.4) =====

export {
  MonitoringSystem,
  getMonitoringSystem,
  initializeMonitoring,
  resetMonitoring,
  formatAlert,
  formatMonitoringAlerts,
  formatHealthCheck,
  getAlertSummary,
  DEFAULT_MONITORING_CONFIG,
  DEFAULT_ALERT_DEFINITIONS,
} from './monitoring.js';

export type {
  AlertSeverity,
  AlertCategory,
  AlertState,
  AlertDefinition,
  Alert,
  HealthCheckResult,
  MonitoringMetric,
  MonitoringEventType,
  MonitoringEvent,
  MonitoringConfig,
} from './monitoring.js';
