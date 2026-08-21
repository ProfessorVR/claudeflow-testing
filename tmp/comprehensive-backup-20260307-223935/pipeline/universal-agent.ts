/**
 * Universal Self-Learning God Agent
 *
 * A unified interface that makes the God Agent do EVERYTHING:
 * - Coding with pattern learning
 * - Research with knowledge accumulation
 * - Writing with style adaptation
 * - Self-learning from every interaction
 *
 * Every operation automatically:
 * 1. Stores successful patterns
 * 2. Learns from feedback (explicit or implicit)
 * 3. Improves retrieval weights over time
 * 4. Builds domain knowledge continuously
 */

import { GodAgent } from '../core/god-agent.js';
import type { QueryResult } from '../core/god-agent.js';
import { InteractionStore } from './interaction-store.js';
import type { ISonaConfig } from '../core/learning/sona-types.js';
import { TrajectoryBridge, type FeedbackResult } from './trajectory-bridge.js';
import { estimateQuality, assessQuality, type QualityInteraction } from './quality-estimator.js';
import { StyleProfileManager, type StoredStyleProfile, type StyleProfileMetadata } from './style-profile.js';
import type { StyleCharacteristics } from './style-analyzer.js';
import {
  ClaudeCodeExecutor,
  type ICodeExecutionRequest
} from '../core/executor/index.js';
import { EmbeddingProviderFactory } from '../core/memory/embedding-provider.js';
import type { IEmbeddingProvider } from '../core/memory/types.js';
import {
  AnthropicWritingGenerator,
  type IWritingGenerator,
  buildCorpusConstraint,
  loadCorpusManifest,
  type CorpusConstraint,
  // Phase 2: Pre-generation citation validation
  CitationValidator,
  createValidatorFromChunks,
  type ValidationResult,
  // Phase 4: Active citation enforcement
  CitationEnforcer,
  createEnforcerFromChunks,
  type EnforcementResult,
  // Phase 5: Citation budget system
  calculateCitationBudget,
  quickBudgetCheck,
  type CitationBudgetResult,
  // Phase 11: Inline Citation Enforcement (Hallucination Prevention DURING Generation)
  InlineValidationOrchestrator,
  createInlineValidationOrchestrator,
  type InlineGenerationConfig,
  type InlineGenerationResult,
  type GenerationUnit,
  type CorpusSource,
  type CorpusRetriever,
} from '../core/writing/index.js';
import { HybridSearchProvider, type IWebSearchProvider } from '../core/search/index.js';
import { createComponentLogger, ConsoleLogHandler, LogLevel } from '../core/observability/index.js';

const universalLogger = createComponentLogger('UniversalAgent', {
  minLevel: LogLevel.INFO,
  handlers: [new ConsoleLogHandler()]
});

// DESC: Episode injection for prior solutions (RULE-010: default window size 3)
import { UCMDaemonClient, getUCMClient } from '../cli/ucm-daemon-client.js';

// DAEMON-003: Core daemon client for EpisodeStore/GraphDB IPC
import { CoreDaemonClient, getCoreDaemonClient } from '../cli/core-daemon-client.js';

// DAI-001: Dynamic Agent Integration
import {
  AgentRegistry,
  AgentSelector,
  TaskExecutor,
  type IAgentSelectionResult,
  type ITaskExecutionResult,
  type IStructuredTask,
} from '../core/agents/index.js';

// DAI-002: Multi-Agent Sequential Pipeline Orchestration
import {
  PipelineExecutor,
  createPipelineExecutor,
  createLeannContextService,
  LeannContextService,
  type IPipelineDefinition,
  type IPipelineExecutorConfig,
  type DAI002PipelineResult,
  type DAI002PipelineOptions,
} from '../core/pipeline/index.js';

// LEANN: Semantic search adapter for context service initialization
import { createLEANNAdapter } from '../core/search/adapters/leann-adapter.js';

// LEANN: DualCodeEmbeddingProvider for optimized code search (NLP + Code fusion)
import {
  createDualCodeEmbeddingProvider,
  createLEANNEmbedder,
  type DualCodeEmbeddingProvider
} from '../core/search/dual-code-embedding.js';

// TASK-PIPELINE-FIX: Import CommandTaskBridge for sophisticated task complexity analysis
// Replaces weak regex-based isPipelineTask() with scoring-based analysis
import {
  CommandTaskBridge,
  DEFAULT_PIPELINE_THRESHOLD,
  type IComplexityAnalysis,
} from '../core/pipeline/command-task-bridge.js';

// DAI-003: Intelligent Task Routing
import {
  TaskAnalyzer,
  CapabilityIndex,
  RoutingEngine,
  PipelineGenerator,
  RoutingLearner,
  ConfirmationHandler,
  FailureClassifier,
  type IRoutingResult,
  type IGeneratedPipeline,
  type IRoutingFeedback,
} from '../core/routing/index.js';

// Quality Gauntlet Integration for god-write
import {
  createQualityIntegration,
  type QualityIntegration,
  type QualityValidationOptions,
  type QualityValidationResult,
} from './quality-integration.js';

// Phase 3: Smart Retrieval Layer for corpus-aware content generation
import {
  SmartRetrievalLayer,
  type ContextChunk,
  type RetrievalOptions,
} from '../retrieval/index.js';

// Extracted modules (Tranche E)
import { scrubNonCorpusAuthors, buildCorpusSourcesFromChunks } from './author-scrubber.js';
import { DESCEpisodeManager } from './desc-episode-manager.js';
import { StyleProfileFacade } from './style-profile-facade.js';
import { collectStats } from './stats-collector.js';
import { KnowledgeManager } from './knowledge-manager.js';
import { LearningFeedbackManager } from './learning-feedback-manager.js';
import { TaskRoutingOrchestrator } from './task-routing-orchestrator.js';
import { WritePipelineOrchestrator } from './write-pipeline-orchestrator.js';

// Phase 5: Staged Composition System Integration
import {
  compositionOrchestrator,
  type ChapterOutline,
  type CompositionResult,
} from '../cli/composition/synthesis/composition-orchestrator.js';

// Phase A: Prose Sanitization for artifact-free academic writing
import {
  ProseSanitizer,
  type SanitizationResult,
  type ArtifactViolation,
} from '../cli/composition/prose-sanitizer.js';

// Endnote Generation Integration
import {
  generateEndnotes,
  type EndnoteGenerationResult,
  type EndnoteGeneratorConfig,
  type CorpusSearchFn,
} from '../cli/quality/endnote-generator.js';
import { ProvenanceLedger } from '../cli/quality/provenance-ledger.js';

// Source Verification and Acquisition Integration
import {
  SourceVerificationLayer,
  getSourceVerificationLayer,
  type VerificationSummary,
  type AcquisitionSuggestion,
} from '../cli/quality/source-verification-layer.js';
import {
  MissingSourceAcquisitionLayer,
  getMissingSourceAcquisitionLayer,
  type AcquisitionResult,
} from '../cli/quality/missing-source-acquisition.js';

// TIER-2.1: Intelligent Model Router
import {
  CapabilityRouter,
  getCapabilityRouter,
  initializeRouter,
  resetCapabilityRouter,
  initializeProviderFactory,
  getProviderFactory,
  initializeCostTracker,
  initializeQualityScorer,
  initializeBudgetEnforcer,
  initializeAuditLogger,
  getModelForRequest,
  recordCompletedRequest,
  loadRouterConfig,
  DEFAULT_ROUTER_CONFIG,
  getLocalFirstMetricsSummary,
  trackLocalFirstDecision,
  type RouterConfig,
  type CapabilityRouterConfig,
  type TaskType,
  type Complexity,
  type ProviderType,
} from '../core/router/index.js';

// Provider integration for local-first routing
import {
  type ILLMProvider,
  type CompletionRequest,
  type CompletionResponse,
  VLLMProvider,
  ClaudeProvider,
} from '../core/providers/index.js';

// MEM-001: Multi-Process Memory System
import {
  MemoryClient,
  getMemoryClient,
  type IStoreKnowledgeParams,
} from '../core/memory-server/index.js';

// TASK-HOOK-006: Hook Executor for pre/post Tool Use hooks
// CONSTITUTION COMPLIANCE: RULE-033 (DESC context injection), RULE-035 (quality threshold 0.5), RULE-036 (quality scores)
import {
  getHookExecutor,
  type IHookContext,
  type IPostToolUseContext,
  type IHookChainResult,
} from '../core/hooks/index.js';

// TASK-PREP-003: Coding Pipeline DAG generation imports
// Implements [REQ-PREP-003]: Dynamic import from command-task-bridge.ts
import {
  CODING_PIPELINE_MAPPINGS,
  getAgentsForPhase,
  buildPipelineDAG,
} from '../core/pipeline/command-task-bridge.js';

import {
  PHASE_ORDER,
  CHECKPOINT_PHASES,
  CODING_MEMORY_NAMESPACE,
  type CodingPipelinePhase,
  type IPipelineExecutionConfig,
  type IPipelineExecutionResult,
  type IAgentMapping,
} from '../core/pipeline/types.js';

import {
  CodingPipelineOrchestrator,
  createOrchestrator,
  type IOrchestratorDependencies,
  type IOrchestratorConfig,
  type IStepExecutor,
} from '../core/pipeline/coding-pipeline-orchestrator.js';

// ClaudeCodeStepExecutor removed - coding pipeline uses CLI-based execution like PhD pipeline

// TASK-CHUNK-003: Knowledge chunking for OpenAI token limit compliance
// CONSTITUTION COMPLIANCE: RULE-064 (symmetric chunking), RULE-008 (SQLite persistence)
import {
  KnowledgeChunker,
  type KnowledgeChunk,
} from './knowledge-chunker.js';

// ==================== Types ====================

export type AgentMode = 'code' | 'research' | 'write' | 'general';

export interface UniversalConfig {
  /** Enable automatic learning from all interactions */
  autoLearn?: boolean;
  /** Minimum quality threshold for auto-storing patterns (default: 0.5 per RULE-035) */
  autoStoreThreshold?: number;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Default mode */
  defaultMode?: AgentMode;
  /** Learning rate for weight updates */
  learningRate?: number;
  /** Enable web search for research mode */
  enableWebSearch?: boolean;
  /** Enable persistent storage (default: true) */
  enablePersistence?: boolean;
  /** Storage directory (default: .agentdb/universal) */
  storageDir?: string;
  /** Enable DESC episode injection for prior solutions (default: true) */
  enableDESC?: boolean;
  /** DESC similarity threshold for episode matching (default: 0.80) */
  descThreshold?: number;
  /** DESC maximum episodes to inject (default: 3 per RULE-010) */
  descMaxEpisodes?: number;
  /** Enable Core Daemon for EpisodeStore/GraphDB IPC (default: true) */
  enableCoreDaemon?: boolean;

  // TIER-2.1: Intelligent Model Router Configuration
  /** Enable model router for intelligent model selection (default: true) */
  enableModelRouter?: boolean;
  /** Router configuration for model capabilities and rules */
  routerConfig?: Partial<RouterConfig>;
  /** Daily budget limit in USD (default: undefined = no limit) */
  dailyBudget?: number;
  /** Weekly budget limit in USD (default: undefined = no limit) */
  weeklyBudget?: number;
  /** Monthly budget limit in USD (default: undefined = no limit) */
  monthlyBudget?: number;
  /** Fallback models when budget exceeded (default: ['deepseek-coder-local', 'qwen-local']) */
  fallbackModels?: string[];
}

export interface Interaction {
  id: string;
  /** Trajectory ID for feedback tracking (links to SonaEngine) */
  trajectoryId?: string;
  mode: AgentMode;
  input: string;
  output: string;
  embedding?: Float32Array;
  timestamp: number;
  /** Patterns used from ReasoningBank during this interaction */
  patternsUsed?: string[];
  feedback?: {
    rating: number;  // 0-1
    useful: boolean;
    notes?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface KnowledgeEntry {
  id: string;
  content: string;
  type?: 'pattern' | 'fact' | 'procedure' | 'example' | 'insight';
  /** Optional category for classification (alternative to type) */
  category?: string;
  domain: string;
  tags: string[];
  quality: number;
  usageCount: number;
  lastUsed: number;
  createdAt: number;
  /** Optional source URL for web-sourced knowledge */
  source?: string;
}

export interface ResearchResult {
  query: string;
  findings: Array<{
    content: string;
    source: string;
    relevance: number;
    confidence: number;
  }>;
  synthesis: string;
  knowledgeStored: number;
  /** Trajectory ID for feedback (FR-11) */
  trajectoryId?: string;
}

export interface CodeResult {
  task: string;
  code: string;
  language: string;
  patterns_used: string[];
  explanation: string;
  learned: boolean;
  /** Trajectory ID for feedback (FR-11) */
  trajectoryId?: string;
}

export interface WriteResult {
  topic: string;
  content: string;
  style: string;
  sources: string[];
  wordCount: number;
  /** Body word count (main text only, excluding validation appendix) */
  bodyWordCount?: number;
  /** Trajectory ID for feedback (FR-11) */
  trajectoryId?: string;
  /** Quality metrics from quality gauntlet validation */
  qualityMetrics?: import('./quality-integration.js').QualityMetrics;
  /** Overall quality score (0-1) from quality gauntlet */
  qualityScore?: number;
  /** Number of revision iterations performed */
  revisionIterations?: number;
  /** Phase 3: Corpus context information */
  corpusContext?: {
    used: boolean;
    chunkCount: number;
    collections: string[];
    citations: string[];
    whitelistMode?: boolean;
  };
  /** Phase 5: Staged composition metadata */
  stagedComposition?: {
    used: boolean;
    succeeded?: boolean;
    wordCount?: number;
    qualityScore?: number;
    processingTime?: number;
  };
  /** Endnote generation metadata */
  endnotes?: {
    generated: boolean;
    count: number;
    supportingQuotationsCount: number;
    enhancedContent?: string;
    endnotesSection?: string;
  };
  /** Source verification results */
  sourceVerification?: {
    verified: boolean;
    totalCitations: number;
    foundInCorpus: number;
    missingFromCorpus: number;
    missingSources: Array<{
      author: string;
      title: string;
      type: 'open_access' | 'paywalled' | 'unknown' | 'in_corpus';
    }>;
    acquisitionResults?: Array<{
      source: string;
      status: 'downloaded' | 'link_provided' | 'not_found' | 'error';
      downloadPath?: string;
      accessUrls?: string[];
    }>;
  };
  /** Citation enforcement results (hallucination prevention) */
  citationEnforcement?: {
    action: 'pass' | 'corrected' | 'warning' | 'rejected';
    totalCitations: number;
    validCitations: number;
    hallucinatedCitations: number;
    correctionsMade: number;
    missingPageNumbers: number;
    passRate: number;
    report: string;
  };
  /** Phase A: Prose sanitization results (artifact removal) */
  proseSanitization?: {
    sanitized: boolean;
    artifactsRemoved: number;
    cleanRate: number;
    violations: Array<{
      type: string;
      text: string;
      line: number;
    }>;
  };
  /** Multi-step drafting diagnostics (v1→investigate→v2) */
  multiStepDiagnostics?: {
    v1Diagnostics: {
      wordCount: number;
      citationCount: number;
      quotationCount: number;
      claimsWithoutCitation: number;
      factualClaimsWithoutCitation: number;
      interpretiveClaimsWithoutCitation: number;
      uniqueAuthors: string[];
      issues: Array<{ type: string; severity: string; detail: string }>;
      qualityScore?: number;
    };
    preventionPlan: {
      blacklistedAuthors: string[];
      strengthenedConstraints: string[];
      underCitedSources: string[];
      overCitedSources: string[];
    };
    v2Diagnostics: {
      blacklistedAuthorsUsedInV2: number;
      blacklistedAuthorsInMainText: number;
      blacklistedAuthorsInAppendix: number;
    };
  };
  /** Pipeline health from v2 staged pipeline (clean/degraded/failed) */
  pipelineHealth?: 'clean' | 'degraded' | 'failed';
  /** Phase 11: Inline validation results (hallucination prevention DURING generation) */
  inlineValidation?: {
    used: boolean;
    allPassed: boolean;
    qualityScore: number;
    totalUnits: number;
    passedFirstAttempt: number;
    passedAfterRetry: number;
    failedUnits: number;
    totalAttempts: number;
    avgAttemptsPerUnit: number;
    failedUnitDetails: Array<{
      type: string;
      intent: string;
      lastScore: number;
      issues: string[];
    }>;
  };
}

/**
 * Options for ask() method
 */
export interface AskOptions {
  mode?: AgentMode;
  context?: string;
  learnFrom?: boolean;
  /** Return full result object instead of just output string */
  returnResult?: boolean;
  /**
   * TASK-LEARN-006: Execute Task() and capture result for quality assessment
   * When true, runs Task() execution and assesses quality on the RESULT (RULE-033)
   * When false, returns the prompt for manual execution (legacy behavior)
   * Default: false (backward compatible - TASK-LEARN-007 will enable by default)
   */
  executeTask?: boolean;
  /**
   * TASK-LEARN-006: Custom Task execution function
   * If provided, used to execute the Task() call
   * If not provided, a stub implementation returns the prompt (for TASK-LEARN-007)
   */
  taskExecutionFn?: (agentType: string, prompt: string, options?: { timeout?: number }) => Promise<string>;
  /**
   * TIER-2.1: Model override for intelligent model routing
   * Overrides the automatic model selection. Can be:
   * - Specific model ID: 'claude-sonnet', 'gpt-4o', 'deepseek-coder'
   * - Model alias: 'local', 'fast', 'cheap'
   */
  model?: string;
}

/**
 * Extended result from ask() when returnResult is true
 */
export interface AskResult {
  /** The generated output */
  output: string;
  /** Trajectory ID for feedback submission */
  trajectoryId?: string;
  /** Pattern IDs used from knowledge base */
  patternsUsed: string[];
  /** Auto-estimated quality score */
  qualityScore: number;
  /** Whether auto-feedback was submitted */
  autoFeedbackSubmitted: boolean;
  /** DAI-001: Selected agent key */
  selectedAgent?: string;
  /** DAI-001: Selected agent category */
  selectedAgentCategory?: string;
  /** DAI-001: Task type detected */
  taskType?: string;
  /** DAI-001: Built prompt for Task() execution */
  agentPrompt?: string;
  /** Interaction ID for reference */
  interactionId: string;
  /** DESC: Number of prior solution episodes injected (RULE-010) */
  descEpisodesInjected?: number;
  /**
   * TASK-LEARN-006: Whether Task() was executed and result captured (RULE-033)
   * true = quality assessed on Task() result
   * false = quality assessed on prompt (legacy, unreliable)
   */
  taskExecuted?: boolean;
  /**
   * TASK-LEARN-006: Content type that was assessed (RULE-036 compliance)
   * 'result' = Task() execution result (reliable)
   * 'prompt' = Agent prompt (unreliable, legacy)
   */
  assessedContentType?: 'result' | 'prompt';
}

/**
 * TASK-GODCODE-001: Code task preparation result for two-phase execution
 *
 * Implements [REQ-GODCODE-001]: CLI does NOT attempt task execution
 * Implements [REQ-GODCODE-002]: CLI returns builtPrompt in JSON
 * Implements [REQ-GODCODE-003]: CLI returns agentType for Task()
 *
 * Phase 1: CLI calls prepareCodeTask() -> returns this interface
 * Phase 2: Skill executes Task() with builtPrompt and agentType
 */
export interface ICodeTaskPreparation {
  /** Agent key from registry (DAI-001) */
  selectedAgent: string;
  /** Agent type for Task() subagent_type parameter */
  agentType: string;
  /** Agent category (e.g., "development", "analysis") */
  agentCategory: string;
  /** Full prompt with DESC injection for Task() execution */
  builtPrompt: string;
  /** Original user input task */
  userTask: string;
  /** Injected DESC episodes context (RULE-010) */
  descContext: string | null;
  /** Retrieved memory context from InteractionStore */
  memoryContext: string | null;
  /** Trajectory ID for learning feedback (FR-11) */
  trajectoryId: string | null;
  /** Whether this is a multi-agent pipeline task */
  isPipeline: boolean;
  /** Pipeline definition if isPipeline is true */
  pipeline?: { steps: string[]; agents: string[]; config?: import('../core/pipeline/types.js').IPipelineExecutionConfig };
  /** Detected or specified programming language */
  language?: string;
}

/**
 * TASK-GODWRITE-001: Write task preparation result for two-phase execution
 *
 * Implements [REQ-GODWRITE-001]: CLI does NOT attempt task execution
 * Implements [REQ-GODWRITE-002]: CLI returns builtPrompt in JSON
 * Implements [REQ-GODWRITE-003]: CLI returns agentType for Task()
 *
 * Phase 1: CLI calls prepareWriteTask() -> returns this interface
 * Phase 2: Skill executes Task() with builtPrompt and agentType
 */
export interface IWriteTaskPreparation {
  // ========== Core Fields (same as ICodeTaskPreparation) ==========

  /** Agent key from registry (DAI-001) */
  selectedAgent: string;

  /** Agent type for Task() subagent_type parameter */
  agentType: string;

  /** Agent category (e.g., "documentation", "writing") */
  agentCategory: string;

  /** Full prompt with DESC injection for Task() execution */
  builtPrompt: string;

  /** Original user input topic */
  userTask: string;

  /** Injected DESC episodes context (RULE-010) */
  descContext: string | null;

  /** Retrieved memory context from InteractionStore */
  memoryContext: string | null;

  /** Trajectory ID for learning feedback (FR-11) */
  trajectoryId: string | null;

  /** Whether this is a multi-agent pipeline task */
  isPipeline: boolean;

  /** Pipeline definition if isPipeline is true */
  pipeline?: { steps: string[]; agents: string[]; config?: import('../core/pipeline/types.js').IPipelineExecutionConfig };

  // ========== Writing-Specific Fields ==========

  /** Writing style (academic, professional, casual, technical) */
  style: 'academic' | 'professional' | 'casual' | 'technical';

  /** Document format (essay, report, article, paper) */
  format: 'essay' | 'report' | 'article' | 'paper';

  /** Content length (short, medium, long, comprehensive) */
  length: 'short' | 'medium' | 'long' | 'comprehensive';

  /** Style profile ID if using learned style (optional) */
  styleProfileId?: string;

  /** Whether a style profile was applied */
  styleProfileApplied: boolean;
}

/**
 * TASK-LEARN-007: Task execution result from default executor
 * Captures execution metadata for quality assessment and learning
 *
 * Per RULE-024: Quality on RESULT (supports Task execution to get result)
 */
export interface TaskExecutionResult {
  /** The task execution output */
  result: string;
  /** Whether execution succeeded */
  success: boolean;
  /** Task type detected from agent selection */
  taskType: string;
  /** Agent key that executed the task */
  agentId: string;
  /** Execution duration in milliseconds */
  durationMs: number;
  /** Error message if execution failed */
  error?: string;
  /** Optional metadata about execution (provider, routing, quality, etc.) */
  metadata?: Record<string, unknown>;
}

/**
 * Unified learning statistics combining all subsystems
 */
export interface UnifiedLearningStats {
  // Existing fields
  totalInteractions: number;
  knowledgeEntries: number;
  domainExpertise: Record<string, number>;
  topPatterns: Array<{ id: string; uses: number }>;

  // NEW from SonaEngine
  sonaMetrics?: {
    totalTrajectories: number;
    totalRoutes: number;
    averageQualityByRoute: Record<string, number>;
    improvementPercentage: Record<string, number>;
    currentDrift: number;
  };

  // NEW computed
  learningEffectiveness?: {
    baselineQuality: number;      // First 20 trajectories avg
    learnedQuality: number;       // Last 20 trajectories avg
    improvementPct: number;       // G3 requirement: 10-30%
    sampleSize: number;           // Number of trajectories used
  };

  // Persistence stats
  persistenceStats?: {
    highQualityCount: number;
    oldestInteraction: number | null;
    newestInteraction: number | null;
    lastSaved: string;
  };
}

// ==================== DAI-003: Task Routing Types ====================

/**
 * Options for task() method (DAI-003)
 */
export interface ITaskOptions {
  /** Explicit agent override (bypass routing) */
  agent?: string;
  /** Skip confirmation flow even for low confidence */
  skipConfirmation?: boolean;
}

/**
 * Result from task() method (DAI-003)
 */
export interface ITaskResult {
  /** Task execution result */
  result: string;
  /** Routing decision metadata */
  routing: IRoutingResult;
  /** Generated pipeline if multi-step task */
  pipeline?: IGeneratedPipeline;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Agent that was used */
  agentUsed: string;
}

// ==================== Universal Agent ====================

// Internal config type that makes most properties required but keeps budget values optional
type InternalUniversalConfig = Required<Omit<UniversalConfig, 'dailyBudget' | 'weeklyBudget' | 'monthlyBudget' | 'routerConfig'>> & {
  dailyBudget: number | undefined;
  weeklyBudget: number | undefined;
  monthlyBudget: number | undefined;
  routerConfig: Partial<RouterConfig>;
};

// Persistence path for LEANN vector index
const LEANN_PERSISTENCE_PATH = './vector_db_leann';

export class UniversalAgent {
  private agent: GodAgent;
  private config: InternalUniversalConfig;
  private interactionStore!: InteractionStore;
  private initialized = false;

  // Learning state
  private successfulPatterns: Map<string, number> = new Map(); // pattern -> success count
  private domainExpertise: Map<string, number> = new Map();    // domain -> knowledge count

  // Trajectory bridge for auto-feedback (FR-11)
  private trajectoryBridge?: TrajectoryBridge;

  // Style profile manager for learned writing styles
  private styleProfileManager?: StyleProfileManager;

  // Code executor for production-ready code (SPEC-EXE-001)
  private codeExecutor: ClaudeCodeExecutor;

  // Embedding provider for semantic embeddings (SPEC-EMB-002)
  private embeddingProvider!: IEmbeddingProvider;

  // Writing generator for LLM-based content creation (SPEC-WRT-001)
  // Null when ANTHROPIC_API_KEY not set (graceful degradation)
  private writingGenerator: IWritingGenerator | null = null;

  // Web search provider for research operations (SPEC-WEB-001)
  private webSearchProvider!: IWebSearchProvider;

  // Quality Gauntlet Integration for god-write validation
  private qualityIntegration?: QualityIntegration;

  // Phase A: Prose Sanitizer for artifact-free academic writing (100% clean rate target)
  private proseSanitizer: ProseSanitizer;

  // Phase 3: Smart Retrieval Layer for corpus-aware content generation
  private smartRetrieval: SmartRetrievalLayer;

  // DAI-001: Dynamic Agent Integration
  private agentRegistry!: AgentRegistry;
  private agentSelector!: AgentSelector;
  private taskExecutor!: TaskExecutor;

  // DAI-002: Multi-Agent Sequential Pipeline Orchestration
  private pipelineExecutor!: PipelineExecutor;

  // LEANN context service for semantic search (persistence-enabled)
  private leannContextService?: LeannContextService;

  // DAI-003: Intelligent Task Routing
  private taskAnalyzer!: TaskAnalyzer;
  private capabilityIndex!: CapabilityIndex;
  private routingEngine!: RoutingEngine;
  private pipelineGenerator!: PipelineGenerator;
  private routingLearner!: RoutingLearner;
  private confirmationHandler!: ConfirmationHandler;
  private failureClassifier!: FailureClassifier;

  // TIER-2.1: Intelligent Model Router
  private modelRouter!: CapabilityRouter;
  private modelRouterEnabled = false;

  // Provider instances for local-first routing
  private vllmProvider?: VLLMProvider;
  private claudeProvider?: ClaudeProvider;

  // MEM-001: Multi-Process Memory Client
  private memoryClient!: MemoryClient;

  // DESC: UCM Daemon client for episode injection (RULE-010)
  private ucmClient!: UCMDaemonClient;
  private descManager!: DESCEpisodeManager;
  private styleFacade!: StyleProfileFacade;
  private knowledgeMgr!: KnowledgeManager;
  private learningFeedbackMgr!: LearningFeedbackManager;
  private taskRouter!: TaskRoutingOrchestrator;
  private writePipeline!: WritePipelineOrchestrator;

  // DAEMON-003: Core Daemon client for EpisodeStore/GraphDB IPC
  private coreDaemonClient!: CoreDaemonClient;

  // TASK-CHUNK-003: Knowledge chunker for OpenAI token limit compliance
  // CONSTITUTION: RULE-064 (symmetric chunking)
  private knowledgeChunker!: KnowledgeChunker;

  constructor(config: UniversalConfig = {}) {
    const storageDir = config.storageDir ?? '.agentdb/universal';
    const enablePersistence = config.enablePersistence ?? true;

    // RULE-035: Feedback threshold MUST be 0.5
    this.config = {
      autoLearn: config.autoLearn ?? true,
      autoStoreThreshold: config.autoStoreThreshold ?? 0.5,
      verbose: config.verbose ?? false,
      defaultMode: config.defaultMode ?? 'general',
      learningRate: config.learningRate ?? 0.01,
      enableWebSearch: config.enableWebSearch ?? true,
      enablePersistence,
      storageDir,
      // DESC: Episode injection settings (RULE-010: default window size 3)
      enableDESC: config.enableDESC ?? true,
      descThreshold: config.descThreshold ?? 0.80,
      descMaxEpisodes: config.descMaxEpisodes ?? 3,
      // DAEMON-003: Core daemon for EpisodeStore/GraphDB IPC (default: enabled)
      // TASK-DAEMON-002: Core daemon RPC now implemented
      enableCoreDaemon: config.enableCoreDaemon ?? true,
      // TIER-2.1: Intelligent Model Router (default: enabled)
      enableModelRouter: config.enableModelRouter ?? true,
      routerConfig: config.routerConfig ?? {},
      dailyBudget: config.dailyBudget,
      weeklyBudget: config.weeklyBudget,
      monthlyBudget: config.monthlyBudget,
      fallbackModels: config.fallbackModels ?? ['deepseek-coder-local', 'qwen-local'],
    };

    // Configure GodAgent with persistence enabled
    this.agent = new GodAgent({
      enableObservability: true,
      verbose: this.config.verbose,
      // Layer 1: VectorDB persistence
      vectorDB: {
        persistencePath: `${storageDir}/vectors.bin`,
        autoSave: enablePersistence,
      },
      // Layer 1: GraphDB persistence
      graphDB: {
        dataDir: `${storageDir}/graphs`,
        enablePersistence,
      },
      // Layer 4: Learning persistence
      learning: {
        checkpointsDir: `${storageDir}/checkpoints`,
      } as Partial<ISonaConfig>,
    });

    // Initialize ClaudeCodeExecutor (SPEC-EXE-001)
    this.codeExecutor = new ClaudeCodeExecutor({ verbose: this.config.verbose });

    // Phase 3: Initialize smart retrieval layer for corpus-aware content generation
    this.smartRetrieval = new SmartRetrievalLayer();

    // Phase A: Initialize prose sanitizer for artifact-free academic writing
    this.proseSanitizer = new ProseSanitizer();
  }

  // ==================== Initialization ====================

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.log('Initializing Universal Self-Learning Agent...');

    // Ensure storage directory exists
    if (this.config.enablePersistence) {
      await this.ensureStorageDir();
    }

    const result = await this.agent.initialize();

    if (!result.success) {
      throw new Error(`Failed to initialize: ${result.warnings.join(', ')}`);
    }

    // Initialize interaction store with LRU caching
    // RULE-035: highQualityThreshold is pattern threshold (0.7), NOT feedback threshold
    this.interactionStore = new InteractionStore({
      storageDir: this.config.storageDir,
      maxInteractions: 1000,
      highQualityThreshold: 0.7,  // Pattern threshold per RULE-035
      rollingWindowDays: 7,
      persistCount: 100,
    });

    // Only load persisted interactions if persistence is enabled
    if (this.config.enablePersistence) {
      await this.interactionStore.load();
    }

    // Load persisted state
    if (this.config.enablePersistence) {
      await this.loadPersistedState();
    }

    // TASK-CHUNK-003: Initialize knowledge chunker for OpenAI token limit compliance
    // CONSTITUTION: RULE-064 (symmetric chunking), RULE-008 (SQLite persistence)
    this.knowledgeChunker = new KnowledgeChunker();
    this.log('KnowledgeChunker initialized - Chunking enabled');

    // Initialize TrajectoryBridge for auto-feedback (FR-11)
    const reasoningBank = this.agent.getReasoningBank();
    const sonaEngine = this.agent.getSonaEngine();
    if (reasoningBank && sonaEngine) {
      this.trajectoryBridge = new TrajectoryBridge(reasoningBank, sonaEngine);
      this.log('TrajectoryBridge initialized - Auto-feedback enabled');
    } else {
      this.log('Warning: ReasoningBank or SonaEngine not available - Auto-feedback disabled');
    }

    // Initialize StyleProfileManager for learned writing styles
    if (this.config.enablePersistence) {
      this.styleProfileManager = new StyleProfileManager(process.cwd());
      this.log('StyleProfileManager initialized - Style learning enabled');
    }
    this.styleFacade = new StyleProfileFacade(
      this.styleProfileManager,
      (msg: string) => this.log(msg),
      () => this.ensureInitialized()
    );

    // Initialize embedding provider (SPEC-EMB-002)
    this.embeddingProvider = await EmbeddingProviderFactory.getProvider();
    this.log(`Embedding provider: ${this.embeddingProvider.getProviderName?.() ?? 'unknown'}`);

    // Initialize KnowledgeManager (Tranche E-05)
    this.knowledgeMgr = new KnowledgeManager({
      agent: this.agent,
      knowledgeChunker: this.knowledgeChunker,
      interactionStore: this.interactionStore,
      domainExpertise: this.domainExpertise,
      embed: (text: string) => this.embed(text),
      generateId: () => this.generateId(),
      log: (msg: string) => this.log(msg),
      ensureInitialized: () => this.ensureInitialized(),
    });

    // Initialize LearningFeedbackManager (Tranche E-06)
    this.learningFeedbackMgr = new LearningFeedbackManager({
      interactionStore: this.interactionStore,
      trajectoryBridge: this.trajectoryBridge ?? null,
      agent: this.agent,
      successfulPatterns: this.successfulPatterns,
      autoStoreThreshold: this.config.autoStoreThreshold,
      embed: (text: string) => this.embed(text),
      storeKnowledge: (entry) => this.storeKnowledge(entry),
      log: (msg: string) => this.log(msg),
    });

    // Initialize writing generator (SPEC-WRT-001)
    this.writingGenerator = this.createWritingGenerator();
    this.log('Writing generator initialized - LLM-based content generation enabled');

    // Initialize web search provider (SPEC-WEB-001)
    this.webSearchProvider = new HybridSearchProvider({ verbose: this.config.verbose });
    this.log(`Web search provider: ${this.webSearchProvider.getAvailableSources().join(', ')}`);

    // Initialize quality gauntlet integration for god-write validation
    this.qualityIntegration = createQualityIntegration(this);
    this.log('Quality Gauntlet initialized - Auto-validation enabled for god-write (threshold: 0.85)');

    // DAI-001: Initialize dynamic agent system
    this.agentRegistry = new AgentRegistry({ basePath: '.claude/agents', verbose: this.config.verbose });
    await this.agentRegistry.initialize('.claude/agents');
    this.agentSelector = new AgentSelector(this.agentRegistry, { verbose: this.config.verbose });
    this.taskExecutor = new TaskExecutor({ verbose: this.config.verbose });
    this.log(`DAI-001: AgentRegistry initialized with ${this.agentRegistry.size} agents`);

    // DAI-002: Initialize multi-agent sequential pipeline executor
    // Note: reuses reasoningBank from TrajectoryBridge initialization above

    // Initialize LEANN semantic search for infinite context retrieval
    // PRD: Use DualCodeEmbeddingProvider for optimized code search (NLP + Code fusion)
    let leannContextService: ReturnType<typeof createLeannContextService> | undefined;
    let dualEmbeddingProvider: DualCodeEmbeddingProvider | undefined;
    try {
      leannContextService = createLeannContextService({
        defaultMaxResults: 10,
        minSimilarityThreshold: 0.5,
      });

      // Create DualCodeEmbeddingProvider for smart code/NLP embedding fusion
      // 40% NLP weight (understand query intent) + 60% code weight (understand structure)
      dualEmbeddingProvider = createDualCodeEmbeddingProvider({
        dimension: this.embeddingProvider.getDimensions?.() ?? 1536,
        nlpWeight: 0.4,
        codeWeight: 0.6,
        cacheEnabled: true,
        cacheMaxSize: 1000,
        provider: 'local', // Uses gte-Qwen2 underneath
      });

      // Create LEANN-compatible embedder using dual provider
      const embeddingDimension = dualEmbeddingProvider.getDimensions();
      const leannEmbedder = createLEANNEmbedder(dualEmbeddingProvider);

      // Track embedding failures to prevent silent corruption
      let embeddingFailures = 0;
      let embeddingAttempts = 0;
      const MAX_FAILURE_RATE = 0.3; // 30% failure rate threshold

      const leannAdapter = createLEANNAdapter(
        // Wrap with error handling and failure tracking
        async (text: string) => {
          embeddingAttempts++;
          try {
            const result = await leannEmbedder(text);
            return result;
          } catch (error) {
            embeddingFailures++;
            const failureRate = embeddingFailures / embeddingAttempts;

            // If failure rate exceeds threshold, propagate error to prevent index corruption
            if (failureRate > MAX_FAILURE_RATE && embeddingAttempts > 10) {
              console.error(`[LEANN] Embedding failure rate ${(failureRate * 100).toFixed(1)}% exceeds threshold, propagating error`);
              throw error;
            }

            // Below threshold: log error but allow graceful degradation with zero vector
            console.error(`[LEANN] DualCodeEmbedding failed (${embeddingFailures}/${embeddingAttempts} = ${(failureRate * 100).toFixed(1)}%): ${error}`);
            return new Float32Array(embeddingDimension);
          }
        },
        embeddingDimension
      );
      await leannContextService.initialize(leannAdapter);
      this.log(`LEANN: DualCodeEmbedding initialized (${embeddingDimension}D, 40% NLP + 60% Code fusion)`);

      // Store as class member for persistence during shutdown
      this.leannContextService = leannContextService;

      // Load persisted vectors if available
      try {
        const loaded = await leannContextService.load(LEANN_PERSISTENCE_PATH);
        if (loaded) {
          const vectorCount = leannContextService.getVectorCount();
          this.log(`LEANN: Loaded ${vectorCount} vectors from ${LEANN_PERSISTENCE_PATH}`);
        } else {
          this.log('LEANN: No persisted vectors found, starting fresh');
        }
      } catch (error) {
        this.log(`LEANN: Failed to load persisted vectors (non-fatal): ${error}`);
      }
    } catch (error) {
      this.log(`LEANN: Initialization failed (non-fatal): ${error}`);
      leannContextService = undefined;
      dualEmbeddingProvider = undefined;
    }

    this.pipelineExecutor = createPipelineExecutor(
      {
        agentRegistry: this.agentRegistry,
        agentSelector: this.agentSelector,
        interactionStore: this.interactionStore,
        reasoningBank: reasoningBank ?? undefined,
        leannContextService,
      },
      {
        verbose: this.config.verbose,
        enableLearning: true,
      }
    );
    this.log('DAI-002: PipelineExecutor initialized - Sequential multi-agent pipelines enabled');
    this.log('LEANN: Semantic context service ready for infinite context retrieval');

    // DAI-003: Initialize intelligent task routing system (AFTER agentRegistry)
    this.taskAnalyzer = new TaskAnalyzer({
      useLocalEmbedding: true,
      verbose: this.config.verbose,
    });

    this.capabilityIndex = new CapabilityIndex({
      agentsPath: '.claude/agents',
      useLocalEmbedding: true,
      freshnessThreshold: 24 * 60 * 60 * 1000, // 24h
      verbose: this.config.verbose,
    });
    try {
      await this.capabilityIndex.initialize();
    } catch (e) {
      this.log?.('[Routing] CapabilityIndex init failed (embedding service may be down), routing will use fallbacks');
    }

    this.failureClassifier = new FailureClassifier();

    this.routingEngine = new RoutingEngine({
      capabilityIndex: this.capabilityIndex,
      verbose: this.config.verbose,
    });

    this.pipelineGenerator = new PipelineGenerator({
      routingEngine: this.routingEngine,
      verbose: this.config.verbose,
    });

    this.routingLearner = new RoutingLearner({
      reasoningBank: reasoningBank,
      failureClassifier: this.failureClassifier,
      verbose: this.config.verbose,
    });

    this.confirmationHandler = new ConfirmationHandler({
      verbose: this.config.verbose,
    });

    this.log('DAI-003: Routing system initialized - Intelligent task routing enabled');

    // TIER-2.1: Initialize Intelligent Model Router
    if (this.config.enableModelRouter !== false) {
      try {
        // Initialize provider factory (uses default config if not specified)
        // This creates all providers (Anthropic, OpenAI, Ollama, vLLM) based on available API keys/servers
        await initializeProviderFactory({});
        const factory = getProviderFactory();

        // Initialize cost tracker with budgets
        initializeCostTracker({
          enabled: true,
          budgets: {
            daily: this.config.dailyBudget,
            weekly: this.config.weeklyBudget,
            monthly: this.config.monthlyBudget,
          },
        });

        // Initialize quality scorer
        initializeQualityScorer({ enabled: true });

        // Initialize budget enforcer
        initializeBudgetEnforcer({
          enabled: true,
          budgets: {
            daily: this.config.dailyBudget,
            weekly: this.config.weeklyBudget,
            monthly: this.config.monthlyBudget,
          },
          fallbackModels: this.config.fallbackModels ?? ['qwen2.5-coder-32b', 'deepseek-coder'],
          blockOnBudgetExceeded: false, // Use fallback instead of blocking
        });

        // Initialize audit logger
        initializeAuditLogger({
          enabled: true,
          storage: 'file',
          storagePath: `${this.config.storageDir}/audit`,
        });

        // Load router config with defaults (includes priority-based model configs and routing rules)
        // LOCAL-FIRST: vLLM models have priority 0, cloud models have priority 10+
        const routerConfig = loadRouterConfig();

        // Initialize capability router with proper config
        this.modelRouter = initializeRouter({
          routerConfig,
          adaptiveRouting: true,
        });

        // Register all providers from factory with the router
        // This connects the provider instances to the routing system
        const providers = factory.getAllProviders();
        for (const provider of providers) {
          this.modelRouter.registerProvider(provider);
        }

        // Initialize LLM providers for direct execution
        try {
          this.vllmProvider = new VLLMProvider({
            baseUrl: process.env.VLLM_BASE_URL || 'http://localhost:8002',
          });
          this.log('Provider: vLLM provider initialized');
        } catch (error) {
          this.log(`Provider: vLLM provider initialization failed: ${error}`);
        }

        try {
          if (process.env.ANTHROPIC_API_KEY) {
            this.claudeProvider = new ClaudeProvider({
              apiKey: process.env.ANTHROPIC_API_KEY,
            });
            this.log('Provider: Claude provider initialized');
          } else {
            this.log('Provider: Claude provider skipped (no API key)');
          }
        } catch (error) {
          this.log(`Provider: Claude provider initialization failed: ${error}`);
        }

        this.modelRouterEnabled = true;
        this.log(`TIER-2.1: Model router initialized with ${providers.length} providers - LOCAL-FIRST routing enabled`);
      } catch (error) {
        // Non-fatal: model router is optional enhancement
        this.log(`TIER-2.1: Model router initialization failed: ${error}`);
        this.modelRouterEnabled = false;
      }
    } else {
      this.log('TIER-2.1: Model router disabled');
    }

    // Phase 4b: TaskRoutingOrchestrator (SEAM-6)
    this.taskRouter = new TaskRoutingOrchestrator({
      agentRegistry: this.agentRegistry,
      taskAnalyzer: this.taskAnalyzer,
      routingEngine: this.routingEngine,
      pipelineGenerator: this.pipelineGenerator,
      pipelineExecutor: this.pipelineExecutor,
      confirmationHandler: this.confirmationHandler,
      taskExecutor: this.taskExecutor,
      routingLearner: this.routingLearner,
      vllmProvider: this.vllmProvider ?? null,
      claudeProvider: this.claudeProvider ?? null,
      modelRouterEnabled: this.modelRouterEnabled,
      config: this.config,
      generateId: () => this.generateId(),
      log: (...args: unknown[]) => this.log(...args),
      ensureInitialized: () => this.ensureInitialized(),
      injectDESCEpisodes: (desc, ctx) => this.injectDESCEpisodes(desc, ctx),
      storeDESCEpisode: (input, output, meta) => this.storeDESCEpisode(input, output, meta),
    });
    this.log('Phase 4b: TaskRoutingOrchestrator initialized');

    // Phase 4c: WritePipelineOrchestrator (SEAM-1)
    this.writePipeline = new WritePipelineOrchestrator({
      smartRetrieval: this.smartRetrieval ?? null,
      qualityIntegration: this.qualityIntegration ?? null,
      proseSanitizer: this.proseSanitizer,
      styleProfileManager: this.styleProfileManager,
      trajectoryBridge: this.trajectoryBridge ?? null,
      writingGenerator: this.writingGenerator ?? null,
      interactionStore: this.interactionStore,
      config: this.config,
      log: (...args: unknown[]) => this.log(...args),
      ensureInitialized: () => this.ensureInitialized(),
      embed: (text: string) => this.embed(text),
      generateId: () => this.generateId(),
      injectDESCEpisodes: (desc, ctx) => this.injectDESCEpisodes(desc, ctx),
      storeDESCEpisode: (input, output, meta) => this.storeDESCEpisode(input, output, meta),
      maybeStorePattern: (entry) => this.maybeStorePattern(entry as any),
      retrieveRelevant: (query, mode, k) => this.retrieveRelevant(query, mode, k),
      extractTags: (text) => this.extractTags(text),
      executeTaskDefault: (sel, fn, opts) => this.executeTaskDefault(sel, fn, opts),
    });
    this.log('Phase 4c: WritePipelineOrchestrator initialized');

    // MEM-001: Initialize memory client for multi-process memory access
    // Daemons are started externally via scripts/god-agent-start.sh (no auto-start)
    try {
      this.memoryClient = getMemoryClient(
        this.config.storageDir.replace('/universal', ''),
        { verbose: this.config.verbose, autoStart: false }
      );
      await this.memoryClient.connect();
      this.log('MEM-001: Memory client connected to daemon');
    } catch (error) {
      // Non-fatal: memory client is optional enhancement
      this.log(`MEM-001: Memory client initialization failed: ${error}`);
    }

    // DAEMON-003: Initialize Core Daemon client for EpisodeStore/GraphDB IPC
    if (this.config.enableCoreDaemon !== false) {
      try {
        this.coreDaemonClient = getCoreDaemonClient();
        const isHealthy = await this.coreDaemonClient.isHealthy();
        if (isHealthy) {
          this.log('DAEMON-003: Core daemon client connected');
        } else {
          this.log('DAEMON-003: Core daemon not healthy, will auto-start on first use');
        }
      } catch (error) {
        // Non-fatal: core daemon is optional enhancement
        this.log(`DAEMON-003: Core daemon client init failed: ${error}`);
        this.coreDaemonClient = getCoreDaemonClient();
      }
    }

    // DESC: Initialize UCM client for episode injection (RULE-010)
    if (this.config.enableDESC) {
      try {
        this.ucmClient = getUCMClient();
        const isHealthy = await this.ucmClient.isHealthy();
        if (isHealthy) {
          this.log(`DESC: UCM client initialized (threshold: ${this.config.descThreshold}, maxEpisodes: ${this.config.descMaxEpisodes})`);
        } else {
          this.log('DESC: UCM daemon not healthy, episode injection will attempt auto-start on first use');
        }
      } catch (error) {
        // Non-fatal: DESC is optional enhancement
        this.log(`DESC: UCM client initialization failed: ${error}`);
        this.ucmClient = getUCMClient(); // Still assign for potential later use
      }
    } else {
      this.log('DESC: Episode injection disabled');
    }

    // Initialize DESC episode manager (Tranche E-02)
    this.descManager = new DESCEpisodeManager(
      this.config,
      this.ucmClient ?? null,
      (msg: string) => this.log(msg)
    );

    this.log(`Runtime: ${result.runtime.type}`);
    this.log(`Persistence: ${this.config.enablePersistence ? 'enabled' : 'disabled'}`);
    this.log(`Storage: ${this.config.storageDir}`);
    this.log('Universal Agent ready - Learning enabled');

    this.initialized = true;
  }

  /**
   * Ensure storage directory exists
   */
  private async ensureStorageDir(): Promise<void> {
    const { mkdir } = await import('fs/promises');
    const dirs = [
      this.config.storageDir,
      `${this.config.storageDir}/graphs`,
      `${this.config.storageDir}/weights`,
      `${this.config.storageDir}/checkpoints`,
    ];
    for (const dir of dirs) {
      await mkdir(dir, { recursive: true }).catch(() => {});
    }
  }

  /**
   * Load persisted state from disk
   */
  private async loadPersistedState(): Promise<void> {
    const { readFile } = await import('fs/promises');
    const statePath = `${this.config.storageDir}/agent-state.json`;

    try {
      const data = await readFile(statePath, 'utf-8');
      const state = JSON.parse(data);

      // Restore local state
      this.successfulPatterns = new Map(Object.entries(state.successfulPatterns || {}));
      this.domainExpertise = new Map(Object.entries(state.domainExpertise || {}));

      // Note: Interactions now loaded via InteractionStore
      const storeStats = this.interactionStore.getStats();
      this.log(`Loaded state: ${this.successfulPatterns.size} patterns, ${this.domainExpertise.size} domains`);
      this.log(`Loaded: ${storeStats.totalInteractions} interactions, ${storeStats.knowledgeCount} knowledge entries`);
    } catch {
      // INTENTIONAL: No previous state found is expected on first run - starting fresh is valid
      this.log('No previous state found - starting fresh');
    }
  }

  /**
   * Save state to disk
   */
  private async savePersistedState(): Promise<void> {
    if (!this.config.enablePersistence) return;

    // Save interaction store
    await this.interactionStore.save();

    const { writeFile } = await import('fs/promises');
    const statePath = `${this.config.storageDir}/agent-state.json`;

    const storeStats = this.interactionStore.getStats();
    const state = {
      successfulPatterns: Object.fromEntries(this.successfulPatterns),
      domainExpertise: Object.fromEntries(this.domainExpertise),
      sessionKnowledgeCount: storeStats.knowledgeCount,
      interactionsCount: storeStats.totalInteractions,
      lastSaved: new Date().toISOString(),
    };

    await writeFile(statePath, JSON.stringify(state, null, 2));
    this.log(`State saved: ${this.successfulPatterns.size} patterns, ${this.domainExpertise.size} domains`);
  }

  /**
   * Create writing generator with Anthropic API (SPEC-WRT-001)
   * Returns null if ANTHROPIC_API_KEY not set (graceful degradation)
   */
  private createWritingGenerator(): IWritingGenerator | null {
    if (!process.env.ANTHROPIC_API_KEY) {
      this.log('Warning: ANTHROPIC_API_KEY not set - writing generation will be unavailable');
      return null;
    }
    return new AnthropicWritingGenerator(
      process.env.ANTHROPIC_API_KEY,
      this.styleProfileManager
    );
  }

  // ==================== DAI-001: Dynamic Agent Execution ====================

  /**
   * Execute task using dynamically selected agent (DAI-001)
   *
   * This method:
   * 1. Analyzes the task to determine best agent
   * 2. Builds prompt using TaskExecutor
   * 3. Returns the selection and prompt (for Task() execution)
   *
   * NOTE: Actual Task() execution is done by the caller (Claude Code CLI)
   * This method provides the selection + prompt building layer.
   */
  async selectAgentForTask(task: string): Promise<{
    selection: IAgentSelectionResult;
    prompt: string;
    context?: string;
  }> {
    await this.ensureInitialized();

    // Select best agent for task
    const selection = this.agentSelector.selectAgent(task);

    this.log(`DAI-001: Selected agent '${selection.selected.key}' for task`);
    this.log(`  Category: ${selection.selected.category}`);
    this.log(`  Task type: ${selection.analysis.taskType}`);
    this.log(`  Score: ${selection.candidates[0]?.score.toFixed(2)}`);

    // Gather memory context from InteractionStore
    const relevantKnowledge = this.interactionStore.getKnowledgeByDomain(
      `project/${selection.analysis.taskType}`
    );
    const context = relevantKnowledge.length > 0
      ? relevantKnowledge
          .slice(0, 5)
          .map(k => `- ${k.content.substring(0, 200)}`)
          .join('\n')
      : undefined;

    // Build the prompt
    const prompt = this.taskExecutor.buildPrompt(
      selection.selected,
      task,
      context
    );

    return {
      selection,
      prompt,
      context,
    };
  }

  /**
   * Get AgentRegistry for external access (DAI-001)
   */
  getAgentRegistry(): AgentRegistry {
    return this.agentRegistry;
  }

  /**
   * Get AgentSelector for external access (DAI-001)
   */
  getAgentSelector(): AgentSelector {
    return this.agentSelector;
  }

  /**
   * Get TaskExecutor for external access (DAI-001)
   */
  getTaskExecutor(): TaskExecutor {
    return this.taskExecutor;
  }

  /**
   * Get PipelineExecutor for external access (DAI-002)
   */
  getPipelineExecutor(): PipelineExecutor {
    return this.pipelineExecutor;
  }

  /**
   * Get MemoryClient for multi-process memory access (MEM-001)
   */
  getMemoryClient(): MemoryClient {
    return this.memoryClient;
  }

  /**
   * Get the model router for intelligent model selection (TIER-2.1)
   */
  getModelRouter(): CapabilityRouter | null {
    return this.modelRouterEnabled ? this.modelRouter : null;
  }

  /**
   * Check if model router is enabled and initialized
   */
  isModelRouterEnabled(): boolean {
    return this.modelRouterEnabled;
  }

  /**
   * Get the recommended model for a given task type and complexity
   * Uses the intelligent model router to select the best model based on:
   * - Task classification
   * - Model capabilities
   * - Budget constraints
   * - Quality history
   *
   * @param taskType - Type of task (code_edit, reasoning, writing, etc.)
   * @param complexity - Task complexity (simple, medium, complex)
   * @returns Model selection with provider info, or null if router not available
   */
  async getModelForTask(
    taskType?: TaskType,
    complexity?: Complexity
  ): Promise<{
    modelId: string;
    provider: ProviderType;
    reason: string;
    isFallback: boolean;
  } | null> {
    if (!this.modelRouterEnabled) {
      return null;
    }

    try {
      return await getModelForRequest(taskType, complexity);
    } catch (error) {
      this.log(`Model selection failed: ${error}`);
      return null;
    }
  }

  /**
   * Record a completed request for cost and quality tracking
   * Should be called after each LLM request completes
   */
  recordModelUsage(
    modelId: string,
    provider: ProviderType,
    taskType: TaskType,
    complexity: Complexity,
    responseTime: number,
    tokensUsed: number,
    inputTokens: number,
    outputTokens: number,
    inputCost: number,
    outputCost: number,
    userAccepted?: boolean
  ): string | null {
    if (!this.modelRouterEnabled) {
      return null;
    }

    try {
      return recordCompletedRequest(
        modelId,
        provider,
        taskType,
        complexity,
        responseTime,
        tokensUsed,
        inputTokens,
        outputTokens,
        inputCost,
        outputCost,
        userAccepted
      );
    } catch (error) {
      this.log(`Failed to record model usage: ${error}`);
      return null;
    }
  }

  // ==================== TASK-LEARN-007: Default Task Execution (delegates to TaskRoutingOrchestrator) ====================

  /** Delegate to TaskRoutingOrchestrator (Phase 4b, SEAM-6) */
  private async executeTaskDefault(
    agentSelection: {
      selection: IAgentSelectionResult;
      prompt: string;
      context?: string;
    },
    taskExecutionFn?: (agentType: string, prompt: string, options?: { timeout?: number }) => Promise<string>,
    options?: {
      trajectoryId?: string;
      forceExecute?: boolean;
    }
  ): Promise<TaskExecutionResult> {
    return this.taskRouter.executeTaskDefault(agentSelection, taskExecutionFn, options);
  }

  // ==================== DAI-002: Pipeline Execution (delegates to TaskRoutingOrchestrator) ====================

  /** Delegate to TaskRoutingOrchestrator (Phase 4b, SEAM-6) */
  async runPipeline(
    pipeline: IPipelineDefinition,
    options: DAI002PipelineOptions = {}
  ): Promise<DAI002PipelineResult> {
    return this.taskRouter.runPipeline(pipeline, options);
  }

  // ==================== DAI-003: Intelligent Task Routing (delegates to TaskRoutingOrchestrator) ====================

  /** Delegate to TaskRoutingOrchestrator (Phase 4b, SEAM-6) */
  async task(description: string, options: ITaskOptions = {}): Promise<ITaskResult> {
    return this.taskRouter.task(description, options);
  }

  // ==================== Main Interface ====================

  /**
   * Universal ask - routes to appropriate mode and learns
   *
   * Overloaded signatures:
   * - ask(input): Promise<string> - Simple output (backward compatible)
   * - ask(input, { returnResult: true }): Promise<AskResult> - Full result with trajectoryId
   */

  // SEAM-1: Helper methods moved to write-pipeline-orchestrator.ts

  async ask(input: string, options?: AskOptions & { returnResult?: false }): Promise<string>;
  async ask(input: string, options: AskOptions & { returnResult: true }): Promise<AskResult>;
  async ask(input: string, options: AskOptions = {}): Promise<string | AskResult> {
    await this.ensureInitialized();

    const interactionId = this.generateId();

    // DESC: Inject prior solutions before processing (RULE-010: window size 3)
    const descResult = await this.injectDESCEpisodes(input, { command: 'god-ask', mode: options.mode });
    const augmentedInput = descResult.augmentedPrompt;

    // DAI-001: Dynamic agent selection (use augmented input for better context)
    const agentSelection = await this.selectAgentForTask(augmentedInput);
    const mode = options.mode ?? (agentSelection.selection.analysis.taskType as AgentMode);

    this.log(`[${mode.toUpperCase()}] Processing: ${input.slice(0, 50)}...`);
    this.log(`DAI-001: Selected agent '${agentSelection.selection.selected.key}' (${agentSelection.selection.selected.category})`);

    // Get embedding for trajectory creation (use original input for embedding consistency)
    const embedding = await this.embed(input);

    // Create trajectory if bridge available (FR-11)
    let trajectoryId: string | undefined;
    let patternsUsed: string[] = [];

    if (this.trajectoryBridge) {
      try {
        const trajectory = await this.trajectoryBridge.createTrajectoryFromInteraction(
          input, mode, embedding
        );
        trajectoryId = trajectory.trajectoryId;
        patternsUsed = trajectory.patterns.map(p => p.patternId);
        this.log(`Trajectory created: ${trajectoryId} (${patternsUsed.length} patterns)`);
      } catch (error) {
        this.log(`Warning: Trajectory creation failed: ${error}`);
      }
    }

    // TASK-FIX-001: Determine output based on executeTask option (RULE-033)
    // BREAKING CHANGE: executeTask now defaults to TRUE (was false)
    // When executeTask=true (or undefined), execute Task() and assess quality on the RESULT
    // When executeTask=false (explicit), return prompt for manual execution (legacy)
    let output: string;
    let taskExecuted = false;
    let assessedContentType: 'result' | 'prompt' = 'prompt';

    if (options.executeTask !== false && options.taskExecutionFn) {
      // RULE-033: Execute Task() and capture result for quality assessment
      try {
        const agentType = agentSelection.selection.selected.frontmatter?.type
          ?? agentSelection.selection.selected.category;

        this.log(`TASK-LEARN-006: Executing Task() with agent '${agentType}'...`);
        output = await options.taskExecutionFn(
          agentType,
          agentSelection.prompt,
          { timeout: 120000 }
        );
        taskExecuted = true;
        assessedContentType = 'result';

        // RULE-036: Log what we're assessing
        this.log(`TASK-LEARN-006: Quality will be assessed on Task() RESULT`, {
          assessedContent: 'result',
          resultLength: output.length,
          hasCodeBlocks: output.includes('```'),
          hasTaskSummary: output.includes('TASK COMPLETION SUMMARY'),
        });
      } catch (error) {
        // Fallback to prompt on execution failure
        this.log(`TASK-LEARN-006: Task execution failed, falling back to prompt: ${error}`);
        output = agentSelection.prompt;
        assessedContentType = 'prompt';
      }
    } else if (options.executeTask !== false) {
      // TASK-FIX-001: Default path - executeTask=true or undefined (new default)
      // Use the default task executor implementation with ObservabilityBus events
      try {
        this.log(`TASK-LEARN-007: Using default task executor...`);
        // TASK-HOOK-006: Pass trajectoryId for hook quality tracking (RULE-036)
        const executionResult = await this.executeTaskDefault(agentSelection, undefined, { trajectoryId });

        if (executionResult.success) {
          output = executionResult.result;
          taskExecuted = true;
          assessedContentType = 'result';

          // RULE-036: Log what we're assessing
          this.log(`TASK-LEARN-007: Quality will be assessed on Task() RESULT`, {
            assessedContent: 'result',
            resultLength: output.length,
            durationMs: executionResult.durationMs,
            agentId: executionResult.agentId,
            taskType: executionResult.taskType,
          });
        } else {
          // Execution failed, fallback to prompt
          this.log(`TASK-LEARN-007: Default execution failed: ${executionResult.error}`);
          output = agentSelection.prompt;
          assessedContentType = 'prompt';
        }
      } catch (error) {
        // Unexpected error, fallback to prompt
        this.log(`TASK-LEARN-007: Unexpected error in default executor: ${error}`);
        output = agentSelection.prompt;
        assessedContentType = 'prompt';
      }
    } else {
      // TASK-FIX-001: Legacy path - ONLY reached when executeTask=false (explicit)
      // Return prompt for manual Task() execution
      // NOTE: Quality assessment on prompts is UNRELIABLE (prompts score ~0.30)
      output = agentSelection.prompt;
      assessedContentType = 'prompt';

      // RULE-036: Log warning about unreliable assessment
      this.log(`TASK-FIX-001: executeTask=false - Quality assessed on PROMPT (unreliable). Remove executeTask=false for accurate assessment.`);
    }

    // Record interaction with trajectory info
    const interaction: Interaction = {
      id: interactionId,
      trajectoryId,
      mode,
      input,
      output,
      embedding,
      patternsUsed,
      timestamp: Date.now(),
      metadata: {
        context: options.context,
        // TASK-LEARN-006: Track assessment metadata
        taskExecuted,
        assessedContentType,
      }
    };
    this.interactionStore.add(interaction);

    // Estimate quality for auto-feedback
    const qualityInteraction: QualityInteraction = {
      id: interactionId,
      mode,
      input,
      output,
      timestamp: interaction.timestamp,
    };
    const qualityAssessment = assessQuality(qualityInteraction, this.config.autoStoreThreshold);
    const qualityScore = qualityAssessment.score;

    // RULE-036: Log quality assessment details
    this.log(`TASK-LEARN-006: Quality assessment complete`, {
      score: qualityScore.toFixed(3),
      threshold: this.config.autoStoreThreshold,
      meetsThreshold: qualityAssessment.meetsThreshold,
      assessedOn: assessedContentType,
      willTriggerLearning: qualityAssessment.meetsThreshold && this.config.autoLearn,
    });

    // Auto-feedback if bridge available and quality meets threshold (FR-11)
    let autoFeedbackSubmitted = false;
    if (this.config.autoLearn && this.trajectoryBridge && trajectoryId && qualityAssessment.meetsThreshold) {
      try {
        const feedbackResult = await this.trajectoryBridge.submitFeedback(
          trajectoryId,
          qualityScore,
          { implicit: true }
        );
        autoFeedbackSubmitted = true;
        this.log(`Auto-feedback submitted: quality=${qualityScore.toFixed(2)}, patternCreated=${feedbackResult.patternCreated}`);
      } catch (error) {
        this.log(`Warning: Auto-feedback failed: ${error}`);
      }
    }

    // Legacy auto-learn if enabled
    if (this.config.autoLearn && options.learnFrom !== false) {
      await this.learnFromInteraction(interaction);
    }

    // DESC: Store episode for future learning (non-blocking)
    this.storeDESCEpisode(input, output, {
      command: 'god-ask',
      mode,
      quality: qualityScore,
    }).catch(err => this.log(`DESC: Background storage error: ${err}`));

    // Return based on options
    if (options.returnResult) {
      return {
        output,
        trajectoryId,
        patternsUsed,
        qualityScore,
        autoFeedbackSubmitted,
        interactionId,
        // DAI-001 fields
        selectedAgent: agentSelection.selection.selected.key,
        selectedAgentCategory: agentSelection.selection.selected.category,
        taskType: agentSelection.selection.analysis.taskType,
        agentPrompt: agentSelection.prompt,
        // DESC fields
        descEpisodesInjected: descResult.episodesUsed,
        // TASK-LEARN-006 fields (RULE-033, RULE-036)
        taskExecuted,
        assessedContentType,
      };
    }

    return output;
  }

  // ==================== Mode-Specific Processing ====================

  /**
   * TASK-GODCODE-001: Prepare code task for two-phase execution
   *
   * Implements [REQ-GODCODE-001]: CLI does NOT attempt task execution
   * Implements [REQ-GODCODE-002]: CLI returns builtPrompt in JSON
   * Implements [REQ-GODCODE-003]: CLI returns agentType for Task()
   * Implements [REQ-GODCODE-004]: Agent selection via AgentSelector (DAI-001)
   * Implements [REQ-GODCODE-005]: DESC episode injection (RULE-010)
   *
   * This method performs Phase 1 preparation:
   * 1. Injects DESC episodes for prior solutions (RULE-010: window size 3)
   * 2. Selects optimal agent via AgentSelector (DAI-001)
   * 3. Builds full prompt via TaskExecutor.buildPrompt()
   * 4. Creates trajectory for learning feedback (FR-11)
   * 5. Returns ICodeTaskPreparation (NO execution)
   *
   * Phase 2 execution happens in the /god-code skill via Task() tool.
   *
   * CONSTITUTION COMPLIANCE:
   * - RULE-001: All code references REQ-GODCODE-*
   * - RULE-003: Comments reference requirements
   * - RULE-010: DESC window size 3
   * - RULE-019: Real implementation, no scaffolding
   * - RULE-069: Proper try/catch for async operations
   *
   * @param task - The code task to prepare
   * @param options - Optional configuration (language, context)
   * @returns ICodeTaskPreparation with builtPrompt for Task() execution
   */
  async prepareCodeTask(task: string, options: {
    language?: string;
    context?: string;
    /** TIER-2.1: Model override for intelligent routing */
    model?: string;
    /** Coding pipeline: starting phase index */
    startPhase?: number;
    /** Coding pipeline: ending phase index */
    endPhase?: number;
  } = {}): Promise<ICodeTaskPreparation> {
    // Implements [REQ-GODCODE-006]: Ensure initialized before processing
    await this.ensureInitialized();

    // Implements [REQ-GODCODE-005]: DESC episode injection (RULE-010: window size 3)
    let descContext: string | null = null;
    let augmentedTask = task;
    try {
      const descResult = await this.injectDESCEpisodes(task, { command: 'god-code', mode: 'code' });
      augmentedTask = descResult.augmentedPrompt;
      if (descResult.episodesUsed > 0) {
        // Extract just the DESC portion (difference between augmented and original)
        descContext = augmentedTask.length > task.length
          ? augmentedTask.substring(0, augmentedTask.length - task.length).trim()
          : null;
        this.log(`TASK-GODCODE-001: DESC injected ${descResult.episodesUsed} episodes`);
      }
    } catch (error) {
      // Implements [REQ-GODCODE-007]: Graceful DESC failure handling
      this.log(`TASK-GODCODE-001: DESC injection failed (continuing): ${error}`);
    }

    // Implements [REQ-GODCODE-004]: Agent selection via AgentSelector (DAI-001)
    const agentSelection = await this.selectAgentForTask(augmentedTask);
    const agent = agentSelection.selection.selected;
    this.log(`TASK-GODCODE-001: Selected agent '${agent.key}' (${agent.category})`);

    // Implements [REQ-GODCODE-003]: Extract agentType for Task() subagent_type
    const agentType = agent.frontmatter?.type ?? agent.category;

    // Implements [REQ-GODCODE-008]: Create trajectory for learning feedback (FR-11)
    let trajectoryId: string | null = null;
    if (this.trajectoryBridge) {
      try {
        const embedding = await this.embed(task);
        const trajectory = await this.trajectoryBridge.createTrajectoryFromInteraction(
          task, 'code', embedding
        );
        trajectoryId = trajectory.trajectoryId;
        this.log(`TASK-GODCODE-001: Trajectory created: ${trajectoryId}`);
      } catch (error) {
        // Implements [REQ-GODCODE-007]: Graceful trajectory failure handling
        this.log(`TASK-GODCODE-001: Trajectory creation failed (continuing): ${error}`);
      }
    }

    // Implements [REQ-GODCODE-002]: Build full prompt via TaskExecutor.buildPrompt()
    const builtPrompt = this.taskExecutor.buildPrompt(
      agent,
      augmentedTask,
      agentSelection.context
    );

    // Check if this is a pipeline task (multi-agent)
    const isPipeline = this.isPipelineTask(task);
    let pipeline: { steps: string[]; agents: string[]; config?: import('../core/pipeline/types.js').IPipelineExecutionConfig } | undefined;
    if (isPipeline) {
      // TASK-PREP-003: Coding Pipeline DAG generation
      // Upstream logic wrapped as-is during merge; refactor to TaskRoutingOrchestrator after tests pass.
      const startIdx = options.startPhase ?? 0;
      const endIdx = options.endPhase ?? (PHASE_ORDER.length - 1);
      const activePhases = PHASE_ORDER.slice(startIdx, endIdx + 1);

      // Build agentsByPhase map for active phases
      const agentsByPhase = new Map<CodingPipelinePhase, IAgentMapping[]>();
      for (const phase of activePhases) {
        agentsByPhase.set(phase, getAgentsForPhase(phase));
      }

      // Collect all agent keys and steps for backward compatibility
      const allAgentKeys: string[] = [];
      for (const phase of activePhases) {
        const phaseAgents = agentsByPhase.get(phase) ?? [];
        for (const agentMapping of phaseAgents) {
          allAgentKeys.push(agentMapping.agentKey);
        }
      }

      // Build full DAG using buildPipelineDAG()
      const dag = buildPipelineDAG();

      // Build complete pipeline configuration
      const pipelineConfig: IPipelineExecutionConfig = {
        phases: activePhases,
        agentsByPhase,
        dag,
        memoryNamespace: CODING_MEMORY_NAMESPACE,
        checkpoints: CHECKPOINT_PHASES.filter(cp => activePhases.includes(cp)),
        startPhase: startIdx,
        endPhase: endIdx,
        taskText: task,
      };

      // Create pipeline object with backward compatibility
      pipeline = {
        steps: ['analyze', 'implement', 'test'],
        agents: [agent.key],
        config: pipelineConfig,
      };
    }

    // Implements [REQ-GODCODE-001]: Return preparation result (NO execution)
    return {
      selectedAgent: agent.key,
      agentType,
      agentCategory: agent.category,
      builtPrompt,
      userTask: task,
      descContext,
      memoryContext: agentSelection.context ?? null,
      trajectoryId,
      isPipeline,
      pipeline,
      language: options.language,
    };
  }

  /**
   * Execute the coding pipeline via CodingPipelineOrchestrator.
   *
   * Wires all dependencies (agentRegistry, sonaEngine, reasoningBank, etc.)
   * and delegates to the orchestrator for 7-phase execution with:
   * - Trajectory persistence (PRD Section 5.1)
   * - Sherlock forensic reviews (PRD Section 2.3)
   * - Embedding-backed pattern matching (PRD Section 8.1)
   *
   * @param pipelineConfig - Configuration from prepareCodeTask()
   * @param stepExecutor - Optional step executor for agent execution
   * @returns Pipeline execution result with XP, phases, and success status
   */
  async executePipeline(
    pipelineConfig: IPipelineExecutionConfig,
    stepExecutor?: IStepExecutor
  ): Promise<IPipelineExecutionResult> {
    await this.ensureInitialized();

    // Step executor should be provided externally if internal execution is needed
    // For CLI-based execution (like PhD pipeline), this method shouldn't be used
    if (!stepExecutor) {
      throw new Error(
        'executePipeline() requires a stepExecutor. ' +
        'For CLI-based execution, use coding-pipeline-cli.ts instead.'
      );
    }
    const resolvedExecutor = stepExecutor;

    const deps: IOrchestratorDependencies = {
      agentRegistry: this.agentRegistry,
      agentSelector: this.agentSelector,
      interactionStore: this.interactionStore,
      reasoningBank: this.agent.getReasoningBank() ?? undefined,
      sonaEngine: this.agent.getSonaEngine() ?? undefined,
      leannContextService: this.leannContextService ?? undefined,
      embeddingProvider: this.embeddingProvider ?? undefined,
      patternMatcher: this.agent.getPatternMatcher() ?? undefined,
    };

    const orchestrator = createOrchestrator(deps, {
      verbose: true,
      enableLearning: true,
      stepExecutor: resolvedExecutor,
    });

    return orchestrator.execute(pipelineConfig);
  }

  /**
   * TASK-GODWRITE-001: Prepare write task for two-phase execution
   *
   * Implements [REQ-GODWRITE-001]: CLI does NOT attempt task execution
   * Implements [REQ-GODWRITE-002]: CLI returns builtPrompt in JSON
   * Implements [REQ-GODWRITE-003]: CLI returns agentType for Task()
   * Implements [REQ-GODWRITE-004]: Agent selection via AgentSelector (DAI-001)
   * Implements [REQ-GODWRITE-005]: DESC episode injection (RULE-010)
   *
   * This method performs Phase 1 preparation:
   * 1. Injects DESC episodes for prior solutions (RULE-010: window size 3)
   * 2. Selects optimal agent via AgentSelector (DAI-001)
   * 3. Builds full prompt via TaskExecutor.buildPrompt()
   * 4. Creates trajectory for learning feedback (FR-11)
   * 5. Applies style profile if available (REQ-GODWRITE-009)
   * 6. Returns IWriteTaskPreparation (NO execution)
   *
   * Phase 2 execution happens in the /god-write skill via Task() tool.
   *
   * CONSTITUTION COMPLIANCE:
   * - RULE-001: All code references REQ-GODWRITE-*
   * - RULE-003: Comments reference requirements
   * - RULE-010: DESC window size 3
   * - RULE-019: Real implementation, no scaffolding
   * - RULE-069: Proper try/catch for async operations
   * - RULE-070: Errors logged with context before re-throwing
   *
   * @param topic - The writing topic
   * @param options - Writing options (style, format, length, styleProfileId)
   * @returns IWriteTaskPreparation with builtPrompt for Task() execution
   */
  async prepareWriteTask(topic: string, options: {
    style?: 'academic' | 'professional' | 'casual' | 'technical';
    format?: 'essay' | 'report' | 'article' | 'paper';
    length?: 'short' | 'medium' | 'long' | 'comprehensive';
    styleProfileId?: string;
    /** TIER-2.1: Model override for intelligent routing */
    model?: string;
  } = {}): Promise<IWriteTaskPreparation> {
    // Implements [REQ-GODWRITE-006]: Ensure initialized before processing
    await this.ensureInitialized();

    // Set defaults for writing options
    const style = options.style ?? 'professional';
    const format = options.format ?? 'article';
    const length = options.length ?? 'medium';

    // Implements [REQ-GODWRITE-005]: DESC episode injection (RULE-010: window size 3)
    let descContext: string | null = null;
    let augmentedTopic = topic;
    try {
      const descResult = await this.injectDESCEpisodes(topic, { command: 'god-write', mode: 'write' });
      augmentedTopic = descResult.augmentedPrompt;
      if (descResult.episodesUsed > 0) {
        // Extract just the DESC portion (difference between augmented and original)
        descContext = augmentedTopic.length > topic.length
          ? augmentedTopic.substring(0, augmentedTopic.length - topic.length).trim()
          : null;
        this.log(`TASK-GODWRITE-001: DESC injected ${descResult.episodesUsed} episodes`);
      }
    } catch (error) {
      // Implements [REQ-GODWRITE-007]: Graceful DESC failure handling
      // RULE-070: Log error with context before continuing
      this.log(`TASK-GODWRITE-001: DESC injection failed (continuing): ${error}`);
    }

    // Implements [REQ-GODWRITE-004]: Agent selection via AgentSelector (DAI-001)
    const agentSelection = await this.selectAgentForTask(augmentedTopic);
    const agent = agentSelection.selection.selected;
    this.log(`TASK-GODWRITE-001: Selected agent '${agent.key}' (${agent.category})`);

    // Implements [REQ-GODWRITE-003]: Extract agentType for Task() subagent_type
    const agentType = agent.frontmatter?.type ?? agent.category;

    // Implements [REQ-GODWRITE-008]: Create trajectory for learning feedback (FR-11)
    let trajectoryId: string | null = null;
    if (this.trajectoryBridge) {
      try {
        const embedding = await this.embed(topic);
        const trajectory = await this.trajectoryBridge.createTrajectoryFromInteraction(
          topic, 'write', embedding
        );
        trajectoryId = trajectory.trajectoryId;
        this.log(`TASK-GODWRITE-001: Trajectory created: ${trajectoryId}`);
      } catch (error) {
        // Implements [REQ-GODWRITE-007]: Graceful trajectory failure handling
        // RULE-070: Log error with context before continuing
        this.log(`TASK-GODWRITE-001: Trajectory creation failed (continuing): ${error}`);
      }
    }

    // Implements [REQ-GODWRITE-009]: Style profile integration
    let stylePrompt: string | null = null;
    let styleProfileApplied = false;
    if (this.styleProfileManager) {
      try {
        if (options.styleProfileId) {
          // Use specific style profile
          stylePrompt = this.styleProfileManager.generateStylePrompt(options.styleProfileId);
          styleProfileApplied = !!stylePrompt;
          if (styleProfileApplied) {
            this.log(`TASK-GODWRITE-001: Style profile '${options.styleProfileId}' applied`);
          }
        } else {
          // Try active style profile
          stylePrompt = this.styleProfileManager.generateStylePrompt();
          styleProfileApplied = !!stylePrompt;
          if (styleProfileApplied) {
            this.log(`TASK-GODWRITE-001: Active style profile applied`);
          }
        }
      } catch (error) {
        // RULE-070: Log error with context before continuing
        this.log(`TASK-GODWRITE-001: Style profile application failed (continuing): ${error}`);
      }
    }

    // Build writing instructions with style, format, and length
    const writingInstructions = this.buildWritingInstructions(style, format, length, stylePrompt);

    // Implements [REQ-GODWRITE-002]: Build full prompt via TaskExecutor.buildPrompt()
    const builtPrompt = this.taskExecutor.buildPrompt(
      agent,
      `${writingInstructions}\n\n## Topic\n${augmentedTopic}`,
      agentSelection.context
    );

    // Implements [REQ-GODWRITE-010]: Check if pipeline task (multi-chapter, complex docs)
    const isPipeline = this.isPipelineWritingTask(topic, format);
    let pipeline: { steps: string[]; agents: string[] } | undefined;
    if (isPipeline) {
      pipeline = {
        steps: ['research', 'outline', 'draft', 'review'],
        agents: [agent.key],
      };
      this.log(`TASK-GODWRITE-001: Pipeline task detected, ${pipeline.steps.length} steps defined`);
    }

    // Implements [REQ-GODWRITE-001]: Return preparation result (NO execution)
    return {
      selectedAgent: agent.key,
      agentType,
      agentCategory: agent.category,
      builtPrompt,
      userTask: topic,
      descContext,
      memoryContext: agentSelection.context ?? null,
      trajectoryId,
      isPipeline,
      pipeline,
      style,
      format,
      length,
      styleProfileId: options.styleProfileId,
      styleProfileApplied,
    };
  }

  /**
   * Build writing instructions with style, format, and length guidance
   * Used by prepareWriteTask() to construct the prompt
   *
   * @param style - Writing style (academic, professional, casual, technical)
   * @param format - Document format (essay, report, article, paper)
   * @param length - Content length (short, medium, long, comprehensive)
   * @param stylePrompt - Optional style profile prompt
   * @returns Formatted writing instructions string
   */
  private buildWritingInstructions(
    style: 'academic' | 'professional' | 'casual' | 'technical',
    format: 'essay' | 'report' | 'article' | 'paper',
    length: 'short' | 'medium' | 'long' | 'comprehensive',
    stylePrompt: string | null
  ): string {
    const lengthGuide: Record<string, string> = {
      short: '500-800 words',
      medium: '1000-2000 words',
      long: '2500-4000 words',
      comprehensive: '5000+ words with sections',
    };

    const styleGuide: Record<string, string> = {
      academic: 'formal tone, citations where appropriate, objective analysis',
      professional: 'clear and concise, business-appropriate, actionable insights',
      casual: 'conversational tone, engaging, accessible language',
      technical: 'precise terminology, detailed explanations, code examples where relevant',
    };

    const formatGuide: Record<string, string> = {
      essay: 'introduction, body paragraphs with clear thesis, conclusion',
      report: 'executive summary, findings, analysis, recommendations',
      article: 'headline, lead paragraph, supporting sections, conclusion',
      paper: 'abstract, introduction, methodology, results, discussion, conclusion',
    };

    let instructions = `## Writing Instructions

**Style**: ${style} - ${styleGuide[style]}
**Format**: ${format} - ${formatGuide[format]}
**Length**: ${length} - ${lengthGuide[length]}`;

    if (stylePrompt) {
      instructions += `\n\n## Style Profile\n${stylePrompt}`;
    }

    return instructions;
  }

  /**
   * Check if a writing task requires multi-agent pipeline execution
   * Used for complex documents like dissertations, multi-chapter works
   *
   * @param topic - The writing topic
   * @param format - The document format
   * @returns true if task benefits from pipeline execution
   */
  private isPipelineWritingTask(topic: string, format: string): boolean {
    // Complex document formats that benefit from pipeline
    const complexFormats = ['paper', 'report'];
    if (complexFormats.includes(format)) {
      // Check for complexity indicators in topic
      const complexityIndicators = [
        /dissertation/i,
        /thesis/i,
        /multi.chapter/i,
        /comprehensive.*research/i,
        /full.*analysis/i,
        /in.depth.*study/i,
        /complete.*guide/i,
      ];
      if (complexityIndicators.some(pattern => pattern.test(topic))) {
        return true;
      }
    }

    // Long-form content indicators
    const longFormIndicators = [
      /book/i,
      /manuscript/i,
      /whitepaper/i,
      /research.*paper/i,
    ];
    return longFormIndicators.some(pattern => pattern.test(topic));
  }

  /**
   * Check if a task requires multi-agent pipeline execution
   * @param task - The task description
   * @returns true if task benefits from pipeline execution
   */
  private isPipelineTask(task: string): boolean {
    const pipelineIndicators = [
      /implement.*and.*test/i,
      /create.*with.*validation/i,
      /build.*complete/i,
      /full.*implementation/i,
      /end.to.end/i,
      /multi.step/i,
      /comprehensive/i,
      /including.*tests/i,
    ];
    return pipelineIndicators.some(pattern => pattern.test(task));
  }

  /**
   * Code mode - write code with pattern learning
   */
  async code(task: string, options: {
    language?: string;
    context?: string;
    examples?: string[];
  } = {}): Promise<CodeResult> {
    await this.ensureInitialized();

    // DESC: Inject prior solutions before processing (RULE-010: window size 3)
    const descResult = await this.injectDESCEpisodes(task, { command: 'god-code', mode: 'code' });
    const augmentedTask = descResult.augmentedPrompt;

    // DAI-001: Dynamic agent selection for code tasks (use augmented task)
    const agentSelection = await this.selectAgentForTask(augmentedTask);
    this.log(`DAI-001 code(): Selected agent '${agentSelection.selection.selected.key}' (${agentSelection.selection.selected.category})`);

    // Create trajectory for learning (FR-11)
    let trajectoryId: string | undefined;
    if (this.trajectoryBridge) {
      try {
        const embedding = await this.embed(task);
        const trajectory = await this.trajectoryBridge.createTrajectoryFromInteraction(
          task, 'code', embedding
        );
        trajectoryId = trajectory.trajectoryId;
      } catch (error) {
        this.log(`Warning: Trajectory creation failed in code(): ${error}`);
      }
    }

    // Find relevant code patterns
    const patterns = await this.retrieveRelevant(task, 'code');

    // TASK-FIX-003: Execute via TaskExecutor with ObservabilityBus events
    // Per RULE-033: Quality MUST be assessed on Task() RESULT, not prompt
    // TASK-HOOK-006: Pass trajectoryId for hook quality tracking (RULE-036)
    const executionResult = await this.executeTaskDefault(agentSelection, undefined, { trajectoryId });
    const code = executionResult.success ? executionResult.result : agentSelection.prompt;
    if (!executionResult.success) {
      this.log(`TASK-FIX-003 code(): Execution failed, using prompt as fallback`);
    }

    // Store successful code patterns in InteractionStore
    await this.storeKnowledge({
      content: code,
      type: 'pattern',
      domain: options.language ?? 'typescript',
      tags: ['generated', 'code-pattern', ...this.extractTags(task)],
    });

    // Learn this pattern if it's new and useful
    const patternId = await this.maybeStorePattern({
      content: code,
      type: 'pattern',
      domain: options.language ?? 'code',
      tags: this.extractTags(task),
    });

    // Auto-feedback if trajectory exists (FR-11)
    if (this.config.autoLearn && this.trajectoryBridge && trajectoryId) {
      const quality = estimateQuality({
        id: trajectoryId,
        mode: 'code',
        input: task,
        output: code,
        timestamp: Date.now(),
      });
      if (quality >= this.config.autoStoreThreshold) {
        try {
          await this.trajectoryBridge.submitFeedback(trajectoryId, quality, { implicit: true });
          this.log(`Code auto-feedback: quality=${quality.toFixed(2)}`);
        } catch (error) {
          this.log(`Warning: Code auto-feedback failed: ${error}`);
        }
      }
    }

    // DESC: Store episode for future learning (non-blocking)
    const codeQuality = estimateQuality({
      id: trajectoryId ?? this.generateId(),
      mode: 'code',
      input: task,
      output: code,
      timestamp: Date.now(),
    });
    this.storeDESCEpisode(task, code, {
      command: 'god-code',
      mode: 'code',
      quality: codeQuality,
    }).catch(err => this.log(`DESC: Background storage error: ${err}`));

    return {
      task,
      code,
      language: options.language ?? 'typescript',
      patterns_used: patterns.map(p => p.id),
      explanation: `Generated code for: ${task}`,
      learned: !!patternId,
      trajectoryId,
    };
  }

  /**
   * Research mode - gather and synthesize knowledge
   * Automatically searches the web if knowledge base is insufficient
   */
  async research(query: string, options: {
    depth?: 'quick' | 'standard' | 'deep';
    sources?: string[];
    enableWebSearch?: boolean;
    /** Use a specific learned style profile for synthesis */
    styleProfileId?: string;
    /** Use the currently active style profile (default: true if one is set) */
    useActiveStyleProfile?: boolean;
  } = {}): Promise<ResearchResult> {
    await this.ensureInitialized();

    // DESC: Inject prior solutions before processing (RULE-010: window size 3)
    const descResult = await this.injectDESCEpisodes(query, { command: 'god-research', mode: 'research' });
    const augmentedQuery = descResult.augmentedPrompt;

    // DAI-001: Dynamic agent selection for research tasks (use augmented query)
    const agentSelection = await this.selectAgentForTask(augmentedQuery);
    this.log(`DAI-001 research(): Selected agent '${agentSelection.selection.selected.key}' (${agentSelection.selection.selected.category})`);

    const depth = options.depth ?? 'standard';
    const enableWebSearch = options.enableWebSearch ?? this.config.enableWebSearch;
    this.log(`Researching: ${query} (depth: ${depth}, webSearch: ${enableWebSearch})`);

    // Get style prompt from learned profile if available
    let _stylePrompt: string | null = null;
    if (this.styleProfileManager) {
      if (options.styleProfileId) {
        _stylePrompt = this.styleProfileManager.generateStylePrompt(options.styleProfileId);
      } else if (options.useActiveStyleProfile !== false) {
        _stylePrompt = this.styleProfileManager.generateStylePrompt();
      }
    }

    // Create trajectory for learning (FR-11)
    let trajectoryId: string | undefined;
    if (this.trajectoryBridge) {
      try {
        const embedding = await this.embed(query);
        const trajectory = await this.trajectoryBridge.createTrajectoryFromInteraction(
          query, 'research', embedding
        );
        trajectoryId = trajectory.trajectoryId;
      } catch (error) {
        this.log(`Warning: Trajectory creation failed in research(): ${error}`);
      }
    }

    // Get existing knowledge
    const existing = await this.retrieveRelevant(query, 'research');

    // Check if we have sufficient knowledge
    const hasGoodKnowledge = existing.length >= 3 && existing[0]?.similarity > 0.7;

    let findings: Array<{
      content: string;
      source: string;
      relevance: number;
      confidence: number;
    }> = [];

    // If knowledge base is insufficient and web search is enabled, search the web
    if (!hasGoodKnowledge && enableWebSearch) {
      this.log('Knowledge base insufficient - performing web search...');
      const webResults = await this.performWebSearch(query, depth);

      // Store web results in knowledge base for future use
      for (const result of webResults) {
        await this.storeKnowledge({
          content: result.content,
          type: 'fact',
          domain: 'research',
          tags: [...this.extractTags(query), 'web-search'],
          source: result.source,
        });
      }

      findings = webResults.map(r => ({
        content: r.content,
        source: r.source,
        relevance: r.relevance,
        confidence: r.confidence,
      }));

      this.log(`Web search returned ${webResults.length} results, stored in knowledge base`);
    } else {
      // Use existing knowledge
      findings = existing.map(k => ({
        content: String(k.content),
        source: 'knowledge_base',
        relevance: k.similarity,
        confidence: k.confidence,
      }));
    }

    // TASK-FIX-004: Execute via TaskExecutor with ObservabilityBus events
    // Per RULE-033: Quality MUST be assessed on Task() RESULT, not prompt
    // TASK-HOOK-006: Pass trajectoryId for hook quality tracking (RULE-036)
    const executionResult = await this.executeTaskDefault(agentSelection, undefined, { trajectoryId });
    const synthesis = executionResult.success ? executionResult.result : agentSelection.prompt;
    if (!executionResult.success) {
      this.log(`TASK-FIX-004 research(): Execution failed, using prompt as fallback`);
    }

    // Auto-feedback if trajectory exists (FR-11)
    let researchQuality = 0.7;
    if (this.config.autoLearn && this.trajectoryBridge && trajectoryId) {
      researchQuality = estimateQuality({
        id: trajectoryId,
        mode: 'research',
        input: query,
        output: synthesis,
        timestamp: Date.now(),
      });
      if (researchQuality >= this.config.autoStoreThreshold) {
        try {
          await this.trajectoryBridge.submitFeedback(trajectoryId, researchQuality, { implicit: true });
          this.log(`Research auto-feedback: quality=${researchQuality.toFixed(2)}`);
        } catch (error) {
          this.log(`Warning: Research auto-feedback failed: ${error}`);
        }
      }
    }

    // DESC: Store episode for future learning (non-blocking)
    this.storeDESCEpisode(query, synthesis, {
      command: 'god-research',
      mode: 'research',
      quality: researchQuality,
    }).catch(err => this.log(`DESC: Background storage error: ${err}`));

    return {
      query,
      findings,
      synthesis,
      knowledgeStored: findings.length,
      trajectoryId,
    };
  }

  /**
   * Perform web search using available search tools
   * SPEC-WEB-001: Hybrid search provider (WebSearch + Perplexity MCP)
   */
  private async performWebSearch(query: string, depth: 'quick' | 'standard' | 'deep'): Promise<Array<{
    content: string;
    source: string;
    relevance: number;
    confidence: number;
  }>> {
    if (!this.config.enableWebSearch) {
      this.log('Web search disabled in config');
      return [{
        content: `Web search is disabled. Enable it in config or manually add knowledge using /god-learn.`,
        source: 'system',
        relevance: 0,
        confidence: 0,
      }];
    }

    try {
      // Map 'standard' to 'medium' for the provider
      const providerDepth = depth === 'standard' ? 'medium' : depth;

      this.log(`Performing web search: "${query}" (depth: ${providerDepth})`);

      // Delegate to web search provider
      const results = await this.webSearchProvider.search(query, {
        depth: providerDepth,
        maxResults: 10,
      });

      // Store search results in InteractionStore for learning
      if (this.config.autoLearn && results.length > 0) {
        await this.storeKnowledge({
          content: JSON.stringify({
            query,
            depth: providerDepth,
            resultCount: results.length,
            timestamp: Date.now(),
          }),
          type: 'fact',
          domain: 'research/searches',
          tags: ['web-search', providerDepth, 'auto-stored'],
        });
      }

      // Transform ISearchResult to expected format
      return results.map(result => ({
        content: result.content,
        source: result.source,
        relevance: result.relevance,
        confidence: result.relevance, // Use relevance as confidence
      }));
    } catch (error) {
      this.log(`Web search failed: ${error}`, true);
      return [{
        content: `Web search failed: ${error}. Query: "${query}". Please try again or manually add knowledge using /god-learn.`,
        source: 'error',
        relevance: 0,
        confidence: 0,
      }];
    }
  }

  /** Delegate to WritePipelineOrchestrator (Phase 4c, SEAM-1) */
  async write(topic: string, options: {
    style?: 'academic' | 'professional' | 'casual' | 'technical';
    length?: 'short' | 'medium' | 'long' | 'comprehensive';
    format?: 'essay' | 'report' | 'article' | 'paper';
    styleProfileId?: string;
    useActiveStyleProfile?: boolean;
    useCorpus?: boolean;
    corpusCollections?: string[];
    corpusChunkCount?: number;
    corpusMinRelevance?: number;
    useStagedComposition?: boolean;
    chapterOutline?: ChapterOutline;
    forceExecute?: boolean;
    enableEndnotes?: boolean;
    maxQuotationsPerEndnote?: number;
    minEndnoteRelevance?: number;
    verifySources?: boolean;
    acquireMissing?: boolean;
    downloadDir?: string;
    citationEnforcementMode?: 'strict' | 'auto-correct' | 'warn';
    citationMinPassRate?: number;
    citationMaxHallucinations?: number;
    useInlineValidation?: boolean;
    inlineValidationStrictness?: 'strict' | 'moderate' | 'lenient';
    inlineMaxRetriesPerUnit?: number;
    inlineEnableCitationLookup?: boolean;
    inlineMinChunks?: number;
    dataSourceMode?: 'corpus' | 'hybrid' | 'external';
    whitelistMode?: boolean;
    multiStep?: boolean;
    nliVerify?: boolean;
    candidateSelection?: boolean;
    pipelineVersion?: 'legacy' | 'v2';
  } = {}): Promise<WriteResult> {
    return this.writePipeline.write(topic, options);
  }

  // ==================== Learning System ====================

  /**
   * Explicit feedback - improves future results via SonaEngine
   *
   * Can accept either an interactionId (looks up trajectoryId) or
   * a trajectoryId directly (with isTrajectoryId: true).
   *
   * @param id - Interaction ID or Trajectory ID
   * @param rating - Quality rating 0-1
   * @param options - Additional options
   * @returns FeedbackResult with weight updates and pattern creation info
   */
  // ==================== Learning & Feedback (delegates to LearningFeedbackManager, Tranche E-06) ====================

  async feedback(
    id: string,
    rating: number,
    options: { useful?: boolean; notes?: string; isTrajectoryId?: boolean } = {}
  ): Promise<FeedbackResult> {
    return this.learningFeedbackMgr.feedback(id, rating, options);
  }

  private async learnFromInteraction(interaction: Interaction): Promise<void> {
    return this.learningFeedbackMgr.learnFromInteraction(interaction);
  }

  // ==================== Knowledge Management (delegates to KnowledgeManager, Tranche E-05) ====================

  async storeKnowledge(entry: Omit<KnowledgeEntry, 'id' | 'quality' | 'usageCount' | 'lastUsed' | 'createdAt'>): Promise<string> {
    return this.knowledgeMgr.storeKnowledge(entry);
  }

  private async retrieveRelevant(
    query: string,
    _mode: AgentMode,
    k: number = 10
  ): Promise<Array<QueryResult['patterns'][0] & { content: unknown }>> {
    return this.knowledgeMgr.retrieveRelevant(query, _mode, k);
  }

  isChunkedEntry(entry: Record<string, unknown>): boolean {
    return this.knowledgeMgr.isChunkedEntry(entry);
  }

  async retrieveKnowledge(id: string): Promise<KnowledgeEntry | null> {
    return this.knowledgeMgr.retrieveKnowledge(id);
  }

  async getKnowledgeChunks(knowledgeId: string): Promise<KnowledgeChunk[]> {
    return this.knowledgeMgr.getKnowledgeChunks(knowledgeId);
  }

  async reconstructKnowledge(knowledgeId: string): Promise<string> {
    return this.knowledgeMgr.reconstructKnowledge(knowledgeId);
  }

  async queryKnowledge(
    query: string,
    options: { k?: number; minSimilarity?: number; domain?: string } = {}
  ): Promise<KnowledgeEntry[]> {
    return this.knowledgeMgr.queryKnowledge(query, options);
  }

  private async maybeStorePattern(entry: Omit<KnowledgeEntry, 'id' | 'quality' | 'usageCount' | 'lastUsed' | 'createdAt'>): Promise<string | null> {
    return this.knowledgeMgr.maybeStorePattern(entry);
  }

  private async updateUsageStats(patternId: string): Promise<void> {
    return this.knowledgeMgr.updateUsageStats(patternId);
  }

  // ==================== Helper Methods ====================

  // ==================== DESC Episode Injection ====================

  /** Delegate to DESCEpisodeManager (Tranche E-02) */
  private async injectDESCEpisodes(
    prompt: string,
    context?: { command?: string; mode?: AgentMode }
  ) {
    return this.descManager.injectEpisodes(prompt, context);
  }

  /** Delegate to DESCEpisodeManager (Tranche E-02) */
  private async storeDESCEpisode(
    queryText: string,
    answerText: string,
    context?: { command?: string; mode?: AgentMode; quality?: number }
  ) {
    return this.descManager.storeEpisode(queryText, answerText, context);
  }



  private extractTags(text: string): string[] {
    return this.learningFeedbackMgr.extractTags(text);
  }


  private async embed(text: string): Promise<Float32Array> {
    // Use real embedding provider from SPEC-EMB-001 (LocalEmbeddingProvider with all-mpnet-base-v2)
    // Provider already handles caching, normalization, error handling
    return this.embeddingProvider.embed(text);
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

  private log(...args: unknown[]): void {
    if (this.config.verbose) {
      universalLogger.debug(args.map(a => String(a)).join(' '));
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  // ==================== Style Profile Management (delegates to StyleProfileFacade) ====================

  async learnStyle(
    name: string,
    textSamples: string[],
    options: { description?: string; tags?: string[]; setAsActive?: boolean } = {}
  ): Promise<StoredStyleProfile | null> {
    return this.styleFacade.learnStyle(name, textSamples, options);
  }

  listStyleProfiles(): StyleProfileMetadata[] {
    return this.styleFacade.listProfiles();
  }

  async setActiveStyleProfile(profileId: string | null): Promise<boolean> {
    return this.styleFacade.setActiveProfile(profileId);
  }

  getActiveStyleProfile(): StoredStyleProfile | undefined {
    return this.styleFacade.getActiveProfile();
  }

  getStyleCharacteristics(profileId?: string): StyleCharacteristics | null {
    return this.styleFacade.getCharacteristics(profileId);
  }

  getStyleStats(): { totalProfiles: number; activeProfile: string | null; totalSourceDocuments: number } {
    return this.styleFacade.getStats();
  }

  getStyleProfileManager(): StyleProfileManager | undefined {
    return this.styleFacade.getManager();
  }

  // ==================== Stats & Status (delegates to StatsCollector) ====================

  getStats(): UnifiedLearningStats {
    return collectStats({
      getInteractionStoreStats: () => this.interactionStore.getStats(),
      getSuccessfulPatterns: () => this.successfulPatterns,
      getDomainExpertise: () => this.domainExpertise,
      getSonaEngine: () => this.agent.getSonaEngine?.() ?? null,
      log: (msg: string) => this.log(msg),
    });
  }

  /**
   * Get underlying God Agent status
   */
  getStatus() {
    return this.agent.getStatus();
  }

  /**
   * Shutdown - saves all state before closing
   */
  async shutdown(): Promise<void> {
    this.log('Shutting down Universal Agent...');

    // Save persisted state before shutdown
    if (this.config.enablePersistence) {
      await this.savePersistedState();
    }

    // Save LEANN vectors before shutdown
    if (this.leannContextService) {
      try {
        await this.leannContextService.save(LEANN_PERSISTENCE_PATH);
        const vectorCount = this.leannContextService.getVectorCount();
        this.log(`LEANN: Saved ${vectorCount} vectors to ${LEANN_PERSISTENCE_PATH}`);
      } catch (error) {
        this.log(`LEANN: Failed to save vectors: ${error}`);
      }
    }

    // MEM-001: Disconnect memory client (daemon keeps running for other processes)
    if (this.memoryClient?.isConnected()) {
      await this.memoryClient.disconnect();
      this.log('MEM-001: Memory client disconnected (daemon persists)');
    }

    await this.agent.shutdown();
    this.initialized = false;
    this.log('Universal Agent shutdown complete - state persisted');
  }

  /**
   * Get coding pipeline orchestrator with all dependencies wired
   * Used by coding-pipeline-cli.ts for stateful session management
   *
   * @returns Configured CodingPipelineOrchestrator instance
   */
  async getCodingOrchestrator(configOverride?: Partial<IOrchestratorConfig>): Promise<CodingPipelineOrchestrator> {
    await this.ensureInitialized();

    const deps: IOrchestratorDependencies = {
      agentRegistry: this.agentRegistry,
      agentSelector: this.agentSelector,
      interactionStore: this.interactionStore,
      reasoningBank: this.agent.getReasoningBank() ?? undefined,
      sonaEngine: this.agent.getSonaEngine() ?? undefined,
      leannContextService: this.leannContextService ?? undefined,
      embeddingProvider: this.embeddingProvider ?? undefined,
      patternMatcher: this.agent.getPatternMatcher() ?? undefined,
    };

    return createOrchestrator(deps, {
      verbose: true,
      enableLearning: true,
      ...configOverride,
    });
  }

  /**
   * Force save current state (call periodically for safety)
   */
  async saveState(): Promise<void> {
    await this.savePersistedState();
  }
}

// ==================== Singleton Export ====================

export const universalAgent = new UniversalAgent();
