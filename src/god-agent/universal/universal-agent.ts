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
  type IPipelineDefinition,
  type IPipelineExecutorConfig,
  type DAI002PipelineResult,
  type DAI002PipelineOptions,
} from '../core/pipeline/index.js';

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
  pipeline?: { steps: string[]; agents: string[] };
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
  pipeline?: { steps: string[]; agents: string[] };

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
    this.pipelineExecutor = createPipelineExecutor(
      {
        agentRegistry: this.agentRegistry,
        agentSelector: this.agentSelector,
        interactionStore: this.interactionStore,
        reasoningBank: reasoningBank ?? undefined,
      },
      {
        verbose: this.config.verbose,
        enableLearning: true,
      }
    );
    this.log('DAI-002: PipelineExecutor initialized - Sequential multi-agent pipelines enabled');

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
    await this.capabilityIndex.initialize();

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

    // MEM-001: Initialize memory client for multi-process memory access
    // Client will auto-start daemon if not running (autoStart: true by default)
    try {
      this.memoryClient = getMemoryClient(
        this.config.storageDir.replace('/universal', ''),
        { verbose: this.config.verbose, autoStart: true }
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

  // ==================== TASK-LEARN-007: Default Task Execution ====================

  /**
   * Default Task execution function for ask() method
   *
   * TASK-LEARN-007: Implements the default execution path when executeTask=true
   * but no custom taskExecutionFn is provided.
   *
   * TASK-HOOK-006: Wires HookExecutor for pre/post Tool Use hooks
   * CONSTITUTION COMPLIANCE:
   * - RULE-033: DESC context MUST be injected into every Task-style tool call (via preToolUseHooks)
   * - RULE-035: All agent results MUST be assessed for quality with 0.5 threshold
   * - RULE-036: Task hook outputs MUST include quality assessment scores
   *
   * Uses TaskExecutor.execute() which wraps the Task() abstraction with:
   * - Prompt building from agent definition
   * - Error handling with AgentExecutionError
   * - Observability events (agent_started, agent_completed, agent_failed)
   * - Duration tracking
   * - Pre/post hook execution (TASK-HOOK-006)
   *
   * Per RULE-024: Quality on RESULT (supports Task execution to get result)
   *
   * @param agentSelection - The result from selectAgentForTask()
   * @param taskExecutionFn - Optional custom execution function
   * @param options - Optional execution options including trajectoryId
   * @returns TaskExecutionResult with result, success status, and duration
   */
  private async executeTaskDefault(
    agentSelection: {
      selection: IAgentSelectionResult;
      prompt: string;
      context?: string;
    },
    taskExecutionFn?: (agentType: string, prompt: string, options?: { timeout?: number }) => Promise<string>,
    options?: {
      /** Trajectory ID for quality tracking (RULE-036) */
      trajectoryId?: string;
      /** Force direct execution, bypassing Task tool (for testing) */
      forceExecute?: boolean;
    }
  ): Promise<TaskExecutionResult> {
    const startTime = Date.now();
    const agent = agentSelection.selection.selected;
    const taskType = agentSelection.selection.analysis.taskType || 'unknown';
    const agentType = agent.frontmatter?.type ?? agent.category;
    const toolName = 'Task'; // All Task-style operations use this tool name

    // TASK-HOOK-006: Generate session ID for hook tracking
    const sessionId = this.generateId();
    const trajectoryId = options?.trajectoryId;

    // TASK-HOOK-006: Get the hook executor singleton
    const hookExecutor = getHookExecutor();

    // TASK-HOOK-006: Build pre-tool-use hook context
    // RULE-033: DESC context injection happens here via auto-injection hook
    const preHookContext: IHookContext = {
      toolName,
      toolInput: {
        agentType,
        prompt: agentSelection.prompt,
        context: agentSelection.context,
        taskType,
        agentKey: agent.key,
      },
      sessionId,
      trajectoryId,
      timestamp: Date.now(),
      metadata: {
        source: 'UniversalAgent.executeTaskDefault',
        agentCategory: agent.category,
      },
    };

    // TASK-HOOK-006: Execute preToolUse hooks BEFORE task execution
    // This triggers DESC context injection (RULE-033) and other pre-execution hooks
    let preHookResult: IHookChainResult | undefined;
    let modifiedInput = agentSelection.prompt;
    try {
      preHookResult = await hookExecutor.executePreToolUseHooks(preHookContext);

      // Log hook execution for observability
      this.log(`TASK-HOOK-006: preToolUseHooks executed`, {
        hooksExecuted: preHookResult.results.length,
        allSucceeded: preHookResult.allSucceeded,
        chainStopped: preHookResult.chainStopped,
        durationMs: preHookResult.totalDurationMs,
        trajectoryId,
      });

      // Check if a hook stopped execution (e.g., validation failure)
      if (preHookResult.chainStopped) {
        const stoppedBy = preHookResult.stoppedByHook ?? 'unknown';
        const stopReason = preHookResult.results.find(r => r.hookId === stoppedBy)?.result?.stopReason ?? 'Hook stopped execution';
        this.log(`TASK-HOOK-006: Execution stopped by hook '${stoppedBy}': ${stopReason}`);

        return {
          result: `Task execution blocked by hook: ${stopReason}`,
          success: false,
          taskType,
          agentId: agent.key,
          durationMs: Date.now() - startTime,
          error: `Hook '${stoppedBy}' blocked execution: ${stopReason}`,
        };
      }

      // Apply any modified input from hooks (e.g., DESC context injection)
      if (preHookResult.finalInput !== undefined && typeof preHookResult.finalInput === 'object') {
        const finalInput = preHookResult.finalInput as { prompt?: string };
        if (finalInput.prompt) {
          modifiedInput = finalInput.prompt;
          this.log(`TASK-HOOK-006: Hook modified prompt (DESC injection applied)`);
        }
      }
    } catch (hookError) {
      // Hooks should not crash main execution - log and continue
      this.log(`TASK-HOOK-006: preToolUseHooks error (continuing): ${hookError}`);
    }

    try {
      let result: string;
      let executionSuccess = true;

      // NEW: Local-First Routing - Try to execute directly with providers
      // If providers are initialized and routing is enabled, use them first
      // FORCE_EXECUTE: Also use providers when forceExecute is true (for testing)
      const shouldUseProviders = (this.modelRouterEnabled || options?.forceExecute) && (this.vllmProvider || this.claudeProvider) && !taskExecutionFn;

      if (shouldUseProviders) {
        this.log(options?.forceExecute ? 'FORCE_EXECUTE: Using providers for direct execution' : 'LOCAL-FIRST: Attempting routed execution with providers');

        try {
          // Try vLLM first (local)
          if (this.vllmProvider) {
            this.log('LOCAL-FIRST: Trying vLLM provider');
            const completionRequest: CompletionRequest = {
              prompt: modifiedInput,
              maxTokens: 4096,
              temperature: 0.7,
            };

            const response = await this.vllmProvider.complete(completionRequest);

            if (response.success && response.text) {
              this.log(`LOCAL-FIRST: vLLM succeeded (${response.latencyMs}ms)`);
              result = response.text;

              // Track successful local execution in metrics
              this.log('LOCAL-FIRST: Successfully executed with vLLM');

              // Record metrics for dashboard
              trackLocalFirstDecision('pure_local_verified', {
                triedLocal: true,
                localSucceeded: true,
                fellBackToClaude: false,
              });

              // Skip Task tool execution - we got result from local model
              const durationMs = Date.now() - startTime;
              const qualityInteraction: QualityInteraction = {
                id: sessionId,
                mode: taskType as AgentMode,
                input: agentSelection.prompt,
                output: result,
                timestamp: Date.now(),
              };
              const qualityAssessment = assessQuality(qualityInteraction, this.config.autoStoreThreshold);

              this.log(`LOCAL-FIRST: Quality score ${qualityAssessment.score.toFixed(3)}`);

              return {
                result,
                success: true,
                taskType,
                agentId: agent.key,
                durationMs,
                metadata: {
                  provider: 'vllm',
                  localFirst: true,
                  qualityScore: qualityAssessment.score,
                },
              };
            }

            this.log(`LOCAL-FIRST: vLLM failed or returned empty, falling back to Claude`);
          }

          // Fallback to Claude if vLLM failed or unavailable
          if (this.claudeProvider) {
            this.log('LOCAL-FIRST: Falling back to Claude provider');
            const completionRequest: CompletionRequest = {
              prompt: modifiedInput,
              maxTokens: 4096,
              temperature: 0.7,
            };

            const response = await this.claudeProvider.complete(completionRequest);

            if (response.success && response.text) {
              this.log(`LOCAL-FIRST: Claude succeeded (${response.latencyMs}ms)`);
              result = response.text;

              // Track fallback to cloud
              this.log('LOCAL-FIRST: Fallback to Claude successful');

              // Record metrics for dashboard
              trackLocalFirstDecision('local_then_review', {
                triedLocal: true,
                localSucceeded: false,
                fellBackToClaude: true,
              });

              const durationMs = Date.now() - startTime;
              const qualityInteraction: QualityInteraction = {
                id: sessionId,
                mode: taskType as AgentMode,
                input: agentSelection.prompt,
                output: result,
                timestamp: Date.now(),
              };
              const qualityAssessment = assessQuality(qualityInteraction, this.config.autoStoreThreshold);

              return {
                result,
                success: true,
                taskType,
                agentId: agent.key,
                durationMs,
                metadata: {
                  provider: 'claude',
                  localFirst: false,
                  fallback: true,
                  qualityScore: qualityAssessment.score,
                },
              };
            }
          }

          // Both providers failed - fall through to custom function or Task tool
          this.log('LOCAL-FIRST: All providers failed, falling back');
        } catch (providerError) {
          this.log(`LOCAL-FIRST: Provider execution error: ${providerError}, falling back`);
        }
      }

      if (taskExecutionFn) {
        // Use custom execution function if provided
        result = await taskExecutionFn(
          agentType,
          modifiedInput,
          { timeout: 120000 }
        );
      } else {
        // Implements [REQ-EXEC-001]: No external API calls - output structured task for Claude Code
        // Implements [REQ-EXEC-002]: Return Task for Claude Code Execution
        // Implements [REQ-EXEC-003]: Integrate with Claude Code Task Tool
        const executionResult = await this.taskExecutor.execute(
          agent,
          modifiedInput,
          async (_agentType: string, prompt: string, options?: { timeout?: number }) => {
            // Implements [REQ-EXEC-002]: Build structured task for Claude Code
            const structuredTask: IStructuredTask = this.taskExecutor.buildStructuredTask(
              agent,
              prompt,
              { timeout: options?.timeout, trajectoryId }
            );

            // Implements [REQ-EXEC-003]: Output task as JSON for Claude Code Task tool
            // The markers allow Claude Code to parse the task specification
            // Only output markers when verbose=true (not in --json mode) to avoid corrupting JSON output
            if (this.config.verbose) {
              console.log('\n================================================================================');
              console.log('CLAUDE_CODE_TASK_START');
              console.log('================================================================================');
              console.log(JSON.stringify(structuredTask, null, 2));
              console.log('================================================================================');
              console.log('CLAUDE_CODE_TASK_END');
              console.log('================================================================================\n');
            }

            this.log(`TASK-EXEC-001: Structured task output for Claude Code execution`, {
              taskId: structuredTask.taskId,
              agentType: structuredTask.agentType,
              agentKey: structuredTask.agentKey,
              promptLength: prompt.length,
            });

            // Implements [REQ-EXEC-005]: Return prompt for learning integration
            // The actual result will come from Claude Code executing the task
            return `[TASK_QUEUED:${structuredTask.taskId}] Execute via Claude Code Task tool with subagent_type="${structuredTask.agentType}"`;
          },
          { context: agentSelection.context }
        );
        result = executionResult.output;
      }

      const durationMs = Date.now() - startTime;

      // TASK-HOOK-006: Calculate quality score for the result
      // RULE-035: Quality threshold is 0.5
      // RULE-036: Quality scores MUST be logged with trajectoryId
      const qualityInteraction: QualityInteraction = {
        id: sessionId,
        mode: taskType as AgentMode,
        input: agentSelection.prompt,
        output: result,
        timestamp: Date.now(),
      };
      const qualityAssessment = assessQuality(qualityInteraction, this.config.autoStoreThreshold);
      const qualityScore = qualityAssessment.score;

      // RULE-036: Log quality score with trajectoryId
      this.log(`TASK-HOOK-006: Quality assessment`, {
        qualityScore: qualityScore.toFixed(3),
        meetsThreshold: qualityAssessment.meetsThreshold,
        threshold: this.config.autoStoreThreshold,
        trajectoryId,
        sessionId,
      });

      // TASK-HOOK-006: Build post-tool-use hook context
      const postHookContext: IPostToolUseContext = {
        toolName,
        toolInput: preHookContext.toolInput,
        toolOutput: {
          result,
          success: executionSuccess,
          qualityScore,
          meetsThreshold: qualityAssessment.meetsThreshold,
        },
        sessionId,
        trajectoryId,
        timestamp: Date.now(),
        executionDurationMs: durationMs,
        executionSuccess,
        metadata: {
          source: 'UniversalAgent.executeTaskDefault',
          agentCategory: agent.category,
          qualityScore,
          qualityMeetsThreshold: qualityAssessment.meetsThreshold,
        },
      };

      // TASK-HOOK-006: Execute postToolUse hooks AFTER task execution
      // This triggers quality assessment and result capture hooks
      try {
        const postHookResult = await hookExecutor.executePostToolUseHooks(postHookContext);

        // Log hook execution for observability (RULE-036 compliance)
        this.log(`TASK-HOOK-006: postToolUseHooks executed`, {
          hooksExecuted: postHookResult.results.length,
          allSucceeded: postHookResult.allSucceeded,
          durationMs: postHookResult.totalDurationMs,
          trajectoryId,
          qualityScore: qualityScore.toFixed(3),
        });
      } catch (hookError) {
        // Hooks should not crash main execution - log and continue
        this.log(`TASK-HOOK-006: postToolUseHooks error (continuing): ${hookError}`);
      }

      return {
        result,
        success: true,
        taskType,
        agentId: agent.key,
        durationMs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const durationMs = Date.now() - startTime;
      this.log(`TASK-LEARN-007: Task execution failed: ${errorMessage}`);

      // TASK-HOOK-006: Execute postToolUse hooks even on failure
      // This ensures quality assessment hooks can record failures
      try {
        const postHookContext: IPostToolUseContext = {
          toolName,
          toolInput: preHookContext.toolInput,
          toolOutput: {
            result: errorMessage,
            success: false,
            error: errorMessage,
            qualityScore: 0, // Failed tasks get 0 quality
          },
          sessionId,
          trajectoryId,
          timestamp: Date.now(),
          executionDurationMs: durationMs,
          executionSuccess: false,
          metadata: {
            source: 'UniversalAgent.executeTaskDefault',
            agentCategory: agent.category,
            error: errorMessage,
            qualityScore: 0,
          },
        };

        const postHookResult = await hookExecutor.executePostToolUseHooks(postHookContext);

        this.log(`TASK-HOOK-006: postToolUseHooks executed (failure path)`, {
          hooksExecuted: postHookResult.results.length,
          trajectoryId,
          qualityScore: 0,
        });
      } catch (hookError) {
        this.log(`TASK-HOOK-006: postToolUseHooks error on failure path: ${hookError}`);
      }

      return {
        result: errorMessage,
        success: false,
        taskType,
        agentId: agent.key,
        durationMs,
        error: errorMessage,
      };
    }
  }

  // ==================== DAI-002: Pipeline Execution ====================

  /**
   * Execute a multi-agent sequential pipeline (DAI-002)
   *
   * Pipelines are executed strictly sequentially with memory coordination
   * between steps via InteractionStore. Each step waits for the previous
   * step to complete before starting.
   *
   * RULE-004: Sequential execution (no Promise.all)
   * RULE-005: Memory coordination via InteractionStore
   * RULE-006: DAI-001 AgentSelector integration
   * RULE-007: Forward-looking prompts with workflow context
   *
   * @param pipeline - Pipeline definition with agents, steps, and config
   * @param options - Optional execution options (stepExecutor, overrides)
   * @returns Pipeline execution result with step results and quality metrics
   *
   * @example
   * ```typescript
   * const pipeline: IPipelineDefinition = {
   *   name: 'API Feature Pipeline',
   *   sequential: true,
   *   agents: [
   *     {
   *       agentKey: 'backend-dev',
   *       task: 'Implement the API endpoints',
   *       outputDomain: 'project/api',
   *       outputTags: ['endpoints', 'schema'],
   *     },
   *     {
   *       agentKey: 'tester',
   *       task: 'Write integration tests',
   *       inputDomain: 'project/api',
   *       inputTags: ['endpoints'],
   *       outputDomain: 'project/tests',
   *       outputTags: ['integration', 'api'],
   *     },
   *   ],
   * };
   *
   * const result = await agent.runPipeline(pipeline);
   * console.log(`Pipeline ${result.success ? 'succeeded' : 'failed'}`);
   * console.log(`Overall quality: ${result.overallQuality}`);
   * ```
   */
  async runPipeline(
    pipeline: IPipelineDefinition,
    options: DAI002PipelineOptions = {}
  ): Promise<DAI002PipelineResult> {
    await this.ensureInitialized();

    this.log(`DAI-002: Starting pipeline '${pipeline.name}' with ${pipeline.agents.length} steps`);

    try {
      const result = await this.pipelineExecutor.execute(pipeline, options);

      if (result.status === 'completed') {
        this.log(`DAI-002: Pipeline '${pipeline.name}' completed successfully`);
        this.log(`  - Steps: ${result.steps.length}/${pipeline.agents.length}`);
        this.log(`  - Overall quality: ${result.overallQuality.toFixed(2)}`);
        this.log(`  - Duration: ${result.totalDuration}ms`);
      } else {
        this.log(`DAI-002: Pipeline '${pipeline.name}' failed at step ${result.steps.length}`);
        if (result.error) {
          this.log(`  - Error: ${result.error.message}`);
        }
      }

      return result;
    } catch (error) {
      this.log(`DAI-002: Pipeline '${pipeline.name}' threw error: ${(error as Error).message}`);
      throw error;
    }
  }

  // ==================== DAI-003: Intelligent Task Routing ====================

  /**
   * Execute task with intelligent routing (DAI-003)
   *
   * This method:
   * 1. Analyzes the task to determine domain, complexity, and requirements
   * 2. Routes to best agent automatically (or uses explicit override)
   * 3. Detects multi-step tasks and generates pipelines
   * 4. Handles low-confidence decisions with confirmation flow
   * 5. Executes via TaskExecutor or PipelineExecutor
   * 6. Submits feedback to RoutingLearner for continuous improvement
   *
   * @param description - Natural language task description
   * @param options - Optional settings (explicit agent, skip confirmation)
   * @returns Task result with routing metadata and execution info
   *
   * @example
   * ```typescript
   * // Automatic routing
   * const result = await agent.task('Write unit tests for the authentication module');
   * console.log(`Routed to: ${result.routing.selectedAgent}`);
   * console.log(`Confidence: ${result.routing.confidence}`);
   *
   * // Explicit agent override
   * const result = await agent.task('Implement feature X', { agent: 'backend-dev' });
   *
   * // Multi-step task (generates pipeline)
   * const result = await agent.task('Research API design, then implement endpoints, then write tests');
   * console.log(`Pipeline: ${result.pipeline?.stages.length} stages`);
   * ```
   */
  async task(description: string, options: ITaskOptions = {}): Promise<ITaskResult> {
    await this.ensureInitialized();

    const startTime = Date.now();
    let routing: IRoutingResult;
    let pipeline: IGeneratedPipeline | undefined;
    let agentUsed: string;
    let result: string;

    // DESC: Inject prior solutions before processing (RULE-010: window size 3)
    const descResult = await this.injectDESCEpisodes(description, { command: 'god-task', mode: 'general' });
    const augmentedDescription = descResult.augmentedPrompt;

    // Step 1: Check for explicit agent override FIRST (skip analysis if provided)
    if (options.agent) {
      this.log(`DAI-003 task(): Using explicit agent override: ${options.agent}`);

      // Validate the agent exists early (fail fast)
      const agentDef = this.agentRegistry.getByKey(options.agent);
      if (!agentDef) {
        throw new Error(`Agent '${options.agent}' not found in registry`);
      }

      // Create a bypass routing result
      routing = {
        selectedAgent: options.agent,
        selectedAgentName: agentDef.frontmatter.name || options.agent,
        confidence: 1.0,
        usedPreference: true,
        coldStartPhase: 'learned',
        isColdStart: false,
        factors: [{
          name: 'explicit_override',
          weight: 1.0,
          score: 1.0,
          description: 'User explicitly specified agent',
        }],
        explanation: `Using explicitly specified agent: ${options.agent}`,
        alternatives: [],
        requiresConfirmation: false,
        confirmationLevel: 'auto',
        routedAt: Date.now(),
        routingTimeMs: 0,
        routingId: this.generateId(),
      };
      agentUsed = options.agent;
    } else {
      // Step 2: Analyze the task (only when routing is needed, use augmented description)
      this.log(`DAI-003 task(): Analyzing task...`);
      const analysis = await this.taskAnalyzer.analyze(augmentedDescription);

      // Step 3: Route via RoutingEngine
      this.log(`DAI-003 task(): Routing via RoutingEngine...`);
      routing = await this.routingEngine.route(analysis);
      agentUsed = routing.selectedAgent;

      this.log(`DAI-003 task(): Routed to '${agentUsed}' (confidence: ${routing.confidence.toFixed(2)})`);
      if (routing.isColdStart) {
        this.log(`  ${routing.coldStartIndicator}`);
      }

      // Step 4: Check if multi-step task (pipeline generation)
      if (analysis.isMultiStep) {
        this.log(`DAI-003 task(): Multi-step task detected, generating pipeline...`);
        try {
          pipeline = await this.pipelineGenerator.generate(description);
          this.log(`DAI-003 task(): Pipeline generated with ${pipeline.stages.length} stages`);
        } catch (error) {
          this.log(`Warning: Pipeline generation failed: ${error}. Falling back to single-step execution.`);
          pipeline = undefined;
        }
      }
    }

    // Step 5: Handle low-confidence confirmation (unless skipped)
    if (!options.skipConfirmation && routing.requiresConfirmation) {
      this.log(`DAI-003 task(): Low confidence (${routing.confidence.toFixed(2)}), requesting confirmation...`);

      try {
        const confirmation = await this.confirmationHandler.requestConfirmation(routing);

        // Check if user selected a different agent
        if (confirmation.selectedKey !== routing.selectedAgent && !confirmation.wasCancelled) {
          this.log(`DAI-003 task(): User overrode to agent: ${confirmation.selectedKey}`);
          agentUsed = confirmation.selectedKey;

          // Update routing result to reflect override
          routing = {
            ...routing,
            selectedAgent: confirmation.selectedKey,
            selectedAgentName: confirmation.selectedKey,
            usedPreference: true,
          };
        } else if (confirmation.wasCancelled) {
          throw new Error('Task cancelled by user during confirmation');
        }
      } catch (error) {
        this.log(`Warning: Confirmation failed: ${error}. Proceeding with original routing.`);
      }
    }

    // Step 6: Execute the task
    let executionSuccess = true;
    let executionError: string | undefined;

    try {
      if (pipeline) {
        // Execute via PipelineExecutor for multi-step tasks
        this.log(`DAI-003 task(): Executing pipeline with ${pipeline.stages.length} stages...`);
        
        // Convert IGeneratedPipeline to IPipelineDefinition
        const pipelineDefinition: IPipelineDefinition = {
          name: `DAI-003: ${description.substring(0, 50)}`,
          description: description,
          sequential: true,
          agents: pipeline.stages.map((stage, index) => ({
            agentKey: stage.agentKey,
            task: stage.taskSegment,
            outputDomain: stage.outputDomain,
            outputTags: ['dai-003', stage.agentKey],
            timeout: 60000,
          })),
        };
        
        const pipelineResult = await this.pipelineExecutor.execute(pipelineDefinition);

        if (pipelineResult.status === 'failed') {
          executionSuccess = false;
          executionError = pipelineResult.error?.message;
          result = `Pipeline execution failed: ${pipelineResult.error?.message ?? 'Unknown error'}`;
        } else {
          result = `Pipeline completed successfully. ${pipelineResult.steps.length}/${pipeline.stages.length} stages completed.`;
        }
      } else {
        // Execute via TaskExecutor for single-step tasks
        this.log(`DAI-003 task(): Executing task with agent '${agentUsed}'...`);

        // Get agent from registry
        const agent = this.agentRegistry.getByKey(agentUsed);
        if (!agent) {
          throw new Error(`Agent '${agentUsed}' not found in registry`);
        }

        // Implements [REQ-EXEC-001]: No external API calls - output structured task for Claude Code
        // Implements [REQ-EXEC-002]: Return Task for Claude Code Execution
        // Implements [REQ-EXEC-003]: Integrate with Claude Code Task Tool
        // Per RULE-033: Quality MUST be assessed on Task() RESULT, not prompt
        // TaskExecutor.execute() emits agent_started, agent_completed, agent_failed events
        const taskTrajectoryId = `traj-task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const executionResult = await this.taskExecutor.execute(
          agent,
          description,
          async (_agentType: string, prompt: string, options?: { timeout?: number }) => {
            // Implements [REQ-EXEC-002]: Build structured task for Claude Code
            const structuredTask: IStructuredTask = this.taskExecutor.buildStructuredTask(
              agent,
              prompt,
              { timeout: options?.timeout, trajectoryId: taskTrajectoryId }
            );

            // Implements [REQ-EXEC-003]: Output task as JSON for Claude Code Task tool
            // Only output markers when verbose=true (not in --json mode) to avoid corrupting JSON output
            if (this.config.verbose) {
              console.log('\n================================================================================');
              console.log('CLAUDE_CODE_TASK_START');
              console.log('================================================================================');
              console.log(JSON.stringify(structuredTask, null, 2));
              console.log('================================================================================');
              console.log('CLAUDE_CODE_TASK_END');
              console.log('================================================================================\n');
            }

            this.log(`DAI-003 task(): Structured task output for Claude Code`, {
              taskId: structuredTask.taskId,
              agentType: structuredTask.agentType,
              agentKey: structuredTask.agentKey,
            });

            // Implements [REQ-EXEC-005]: Return message for learning integration
            return `[TASK_QUEUED:${structuredTask.taskId}] Execute via Claude Code Task tool with subagent_type="${structuredTask.agentType}"`;
          }
        );
        result = executionResult.output;
      }
    } catch (error) {
      executionSuccess = false;
      executionError = error instanceof Error ? error.message : String(error);
      result = `Task execution failed: ${executionError}`;
      this.log(`DAI-003 task(): Execution failed: ${executionError}`);
    }

    const executionTimeMs = Date.now() - startTime;

    // Step 7: Submit feedback to RoutingLearner
    try {
      const feedback: IRoutingFeedback = {
        routingId: routing.routingId,
        task: description,
        selectedAgent: routing.selectedAgent,
        success: executionSuccess,
        executionTimeMs,
        userOverrideAgent: options.agent || (routing.usedPreference ? agentUsed : undefined),
        errorMessage: executionError,
        userAbandoned: false,
        completedStages: pipeline ? pipeline.stages.length : undefined,
        totalStages: pipeline ? pipeline.stages.length : undefined,
        feedbackAt: Date.now(),
      };

      await this.routingLearner.processFeedback(feedback);
      this.log(`DAI-003 task(): Feedback submitted to RoutingLearner`);
    } catch (error) {
      this.log(`Warning: Failed to submit routing feedback: ${error}`);
    }

    // DESC: Store episode for future learning (non-blocking, only if successful)
    if (executionSuccess) {
      this.storeDESCEpisode(description, result, {
        command: 'god-task',
        mode: 'general',
        quality: 0.8, // Tasks that complete successfully get a good quality score
      }).catch(err => this.log(`DESC: Background storage error: ${err}`));
    }

    return {
      result,
      routing,
      pipeline,
      executionTimeMs,
      agentUsed,
    };
  }

  // ==================== Main Interface ====================

  /**
   * Universal ask - routes to appropriate mode and learns
   *
   * Overloaded signatures:
   * - ask(input): Promise<string> - Simple output (backward compatible)
   * - ask(input, { returnResult: true }): Promise<AskResult> - Full result with trajectoryId
   */

  /**
   * Build corpus constraint prompt text for hallucination prevention (Phase 1)
   *
   * Creates an explicit whitelist of allowed sources that gets injected into the prompt.
   * This is CRITICAL for preventing the LLM from citing sources not in the corpus.
   *
   * @param constraint - The corpus constraint with verified sources
   * @returns Formatted prompt text block
   * @private
   */
  private buildCorpusConstraintPromptText(constraint: CorpusConstraint): string {
    if (constraint.sources.length === 0) {
      return '';
    }

    const isStrict = constraint.enforcement === 'strict';
    const placeholder = constraint.missingCitationPlaceholder || '[CITATION NEEDED]';

    // Group sources by type
    const primarySources: typeof constraint.sources = [];
    const secondarySources: typeof constraint.sources = [];

    for (const source of constraint.sources) {
      const isPrimary =
        source.author.includes('Aristotle') ||
        source.author.includes('Heidegger') ||
        source.author.includes('Plato') ||
        source.title.includes('De Anima') ||
        source.title.includes('Being and Time') ||
        source.title.includes('Rhetoric');

      if (isPrimary) {
        primarySources.push(source);
      } else {
        secondarySources.push(source);
      }
    }

    let prompt = `
## CORPUS-ONLY CITATION CONSTRAINT (${isStrict ? 'MANDATORY' : 'RECOMMENDED'})

You may ${isStrict ? 'ONLY' : 'preferably'} cite from the following verified sources:`;

    if (primarySources.length > 0) {
      prompt += `

### Primary Sources
${primarySources.map(s => `- ${s.author} (${s.year > 0 ? s.year : 'c. ' + Math.abs(s.year) + ' BCE'}). "${s.title}"${s.pages ? ` [Pages: ${s.pages}]` : ''}${s.citationKey ? ` — Cite as: (${s.citationKey})` : ''}`).join('\n')}`;
    }

    if (secondarySources.length > 0) {
      prompt += `

### Secondary Scholarship
${secondarySources.map(s => `- ${s.author} (${s.year}). "${s.title}"${s.pages ? ` [Pages: ${s.pages}]` : ''}${s.citationKey ? ` — Cite as: (${s.citationKey})` : ''}`).join('\n')}`;
    }

    prompt += `

### Citation Rules (MANDATORY — ZERO TOLERANCE FOR EXTERNAL SOURCES)
1. **EVERY citation MUST include page numbers**: Use format (Author Year, p. X) or (Author Year, pp. X-Y)
2. ${isStrict ? '**ABSOLUTE RULE: Do NOT cite, reference, discuss, or mention ANY scholar not in the list above.** This includes authors you know from your training data. If an author is not listed above, they do not exist for this task.' : 'Prefer citations from this list'}
3. ${isStrict ? 'Do NOT fabricate page numbers - only cite pages from corpus chunks you have access to' : 'Use verified page numbers when available'}
4. Do NOT combine authors who do not co-author in this list
5. Do NOT cite works by listed authors other than those specified above (e.g., if "Gross, Uncomfortable Situations" is listed, do NOT cite "Gross, Secret History of Emotion")
6. ${isStrict ? 'If a corpus chunk MENTIONS another scholar (e.g., "Modrak argues..."), do NOT cite that scholar — cite the AUTHOR of the chunk instead (e.g., cite O\'Gorman who wrote the chunk, not Modrak who is discussed in it)' : 'If you need a source not listed, write "' + placeholder + '" instead of fabricating'}
7. If you cannot determine the page number, write "[PAGE NEEDED]" after the citation
8. ${isStrict ? '**ANY mention of a non-listed author will cause automatic rejection.** Do not write "As X argues" or "X\'s account" unless X is in the list above.' : ''}

### Citation Format Examples
- Direct quote: "quoted text" (Frede 1992, p. 283)
- Paraphrase: As Frede argues (1992, pp. 280-285), phantasia...
- Multiple pages: (Heidegger 1927, pp. 134-137)
- Primary source: (Aristotle, De Anima, 427b14-16)

${isStrict ? '**Citations without page numbers will be flagged and may result in rejection. References to non-listed authors will be stripped from the output.**' : 'Unverified citations will be flagged for review.'}`;

    return prompt;
  }

  /**
   * Build a formatted block of corpus chunk text for injection into the generation prompt.
   * This provides the agent with actual source material to cite from, enabling
   * verbatim quotations and grounded claims. Chunks are grouped by source and
   * capped at ~15K tokens to stay within context budgets.
   * @private
   */
  private buildCorpusContextBlock(chunks: ContextChunk[]): string {
    if (chunks.length === 0) return '';

    // Group chunks by source for readability
    const bySource = new Map<string, ContextChunk[]>();
    for (const chunk of chunks) {
      const key = `${chunk.metadata.author} - ${chunk.metadata.title} (${chunk.metadata.year})`;
      if (!bySource.has(key)) bySource.set(key, []);
      bySource.get(key)!.push(chunk);
    }

    let block = `\n## CORPUS SOURCE MATERIAL\n\nThe following are excerpts from the ingested scholarly corpus (OCR-processed). You MUST ground your citations in this material.\n\n**IMPORTANT instructions for using these chunks:**\n- These chunks are raw OCR output and may contain formatting artifacts (running headers, page numbers, line breaks, author names at page tops, etc.)\n- When citing, paraphrase the scholarly content in your own words and cite with (Author Year, p. X)\n- When directly quoting, extract ONLY the meaningful scholarly text — strip out OCR artifacts like page headers, running titles, or stray numbers\n- Never quote raw OCR artifacts like "JOHN SMITH 30 The following..." — instead quote the actual content: "The following..."\n- Use the page numbers from the [Chunk N] metadata, not numbers found within the OCR text\n`;

    let chunkNumber = 1;
    let totalChars = block.length;
    const MAX_CHARS = 60000; // ~15K tokens budget for corpus context

    for (const [sourceKey, sourceChunks] of bySource) {
      const header = `\n### ${sourceKey}\n`;
      totalChars += header.length;
      if (totalChars > MAX_CHARS) break;
      block += header;

      for (const chunk of sourceChunks) {
        const pages = chunk.metadata.page_start === chunk.metadata.page_end
          ? `p. ${chunk.metadata.page_start}`
          : `pp. ${chunk.metadata.page_start}-${chunk.metadata.page_end}`;
        const entry = `\n**[Chunk ${chunkNumber}]** (${pages}):\n${chunk.content}\n`;
        totalChars += entry.length;
        if (totalChars > MAX_CHARS) {
          block += `\n*[Remaining chunks truncated to stay within context budget]*\n`;
          return block;
        }
        block += entry;
        chunkNumber++;
      }
    }

    block += `\n---\n**Total corpus chunks provided: ${chunkNumber - 1}**\n`;
    return block;
  }

  /**
   * Generate content via Claude Code CLI (uses Claude subscription, not API key).
   * Falls back to direct Anthropic API if claude CLI is not available.
   */
  private async generateViaClaudeCode(prompt: string, options?: {
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
  }): Promise<string> {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    const args = ['-p', '--no-input'];
    if (options?.model) args.push('--model', options.model);
    if (options?.systemPrompt) args.push('--system-prompt', options.systemPrompt);
    // --allowedTools "" disables all tools (pure text generation)
    args.push('--allowedTools', '');
    args.push(prompt);

    try {
      const { stdout } = await execFileAsync('claude', args, {
        maxBuffer: 10 * 1024 * 1024,  // 10MB
        timeout: 300000,  // 5 min
        env: { ...process.env },
      });
      return stdout.trim();
    } catch (error: any) {
      // If claude CLI not found, fall back to direct API
      if (error.code === 'ENOENT') {
        this.log('claude CLI not found, falling back to Anthropic API...');
        return this.generateViaAnthropicAPI(prompt, options);
      }
      throw error;
    }
  }

  /**
   * Fallback: Direct Anthropic API call (requires ANTHROPIC_API_KEY)
   */
  private async generateViaAnthropicAPI(prompt: string, options?: {
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
  }): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Neither claude CLI nor ANTHROPIC_API_KEY available for generation');
    }
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });
    const messages: Array<{ role: 'user'; content: string }> = [{ role: 'user', content: prompt }];
    const response = await client.messages.create({
      model: options?.model || 'claude-sonnet-4-20250514',
      max_tokens: options?.maxTokens || 8192,
      ...(options?.systemPrompt ? { system: options.systemPrompt } : {}),
      messages,
    });
    return response.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n\n');
  }

  /**
   * Generate mock academic content for testing purposes
   * Used when forceExecute is true and providers are not available
   * @private
   */
  private generateMockAcademicContent(
    topic: string,
    style: string,
    length: string,
    corpusChunks: ContextChunk[]
  ): string {
    const wordCounts = {
      short: 500,
      medium: 1000,
      long: 2000,
      comprehensive: 2500,
    };
    const targetWords = wordCounts[length as keyof typeof wordCounts] || 1000;

    // Build content with corpus citations if available
    let content = `# ${topic}\n\n`;

    if (corpusChunks.length > 0) {
      content += `## Introduction\n\n`;
      content += `This section examines ${topic.toLowerCase()}, drawing on recent scholarship and theoretical frameworks. `;
      content += `Building on the work of ${corpusChunks[0]?.metadata.author || 'key scholars'} (${corpusChunks[0]?.metadata.year || '2020'}), `;
      content += `we explore the conceptual foundations and implications of this topic.\n\n`;

      content += `## Theoretical Framework\n\n`;
      content += corpusChunks.slice(0, 3).map((chunk, i) => {
        return `${chunk.content.slice(0, 200)}... (${chunk.metadata.author}, ${chunk.metadata.year}, p.${chunk.metadata.page_start})`;
      }).join('\n\n');

      content += `\n\n## Analysis\n\n`;
      content += `The literature reveals multiple perspectives on ${topic.toLowerCase()}. `;
    } else {
      content += `This section provides a comprehensive examination of ${topic.toLowerCase()}. `;
    }

    // Pad to target word count
    const currentWords = content.split(/\s+/).length;
    if (currentWords < targetWords) {
      const fillerParagraph = `Furthermore, this analysis considers the broader implications and contextual factors that shape our understanding. ` +
        `The theoretical underpinnings draw from multiple disciplinary perspectives, including philosophical, empirical, and applied approaches. ` +
        `Each perspective contributes unique insights that enrich our comprehensive understanding of the phenomenon. `;

      const paragraphsNeeded = Math.ceil((targetWords - currentWords) / fillerParagraph.split(/\s+/).length);
      for (let i = 0; i < paragraphsNeeded; i++) {
        content += `\n\n${fillerParagraph}`;
      }
    }

    content += `\n\n## Conclusion\n\n`;
    content += `This examination of ${topic.toLowerCase()} demonstrates the complexity and significance of the topic. `;
    content += `Future research should continue to explore these dimensions in greater depth.`;

    return content;
  }

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
    let pipeline: { steps: string[]; agents: string[] } | undefined;
    if (isPipeline) {
      // Extract pipeline info if available
      pipeline = {
        steps: ['analyze', 'implement', 'test'],
        agents: [agent.key],
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

  /**
   * Write mode - generate documents with style learning
   *
   * @param topic - The topic to write about
   * @param options - Writing options including style profile
   * @param options.styleProfileId - ID of a learned style profile to use
   * @param options.useActiveStyleProfile - Use the currently active style profile
   */
  async write(topic: string, options: {
    style?: 'academic' | 'professional' | 'casual' | 'technical';
    length?: 'short' | 'medium' | 'long' | 'comprehensive';
    format?: 'essay' | 'report' | 'article' | 'paper';
    /** Use a specific learned style profile by ID */
    styleProfileId?: string;
    /** Use the currently active style profile (default: true if one is set) */
    useActiveStyleProfile?: boolean;
    /** Phase 3: Use corpus for source-grounded content generation */
    useCorpus?: boolean;
    /** Phase 3: Target specific corpus collections */
    corpusCollections?: string[];
    /** Phase 3: Number of corpus chunks to retrieve (default: 15) */
    corpusChunkCount?: number;
    /** Phase 3: Minimum relevance for corpus chunks (default: 0.75) */
    corpusMinRelevance?: number;
    /** Phase 5: Use staged composition system (auto-detected for chapters/sections) */
    useStagedComposition?: boolean;
    /** Phase 5: Chapter outline for staged composition */
    chapterOutline?: ChapterOutline;
    /** Force direct execution, bypassing pipeline detection (for testing) */
    forceExecute?: boolean;
    /** Enable endnote generation with supporting quotations (requires useCorpus) */
    enableEndnotes?: boolean;
    /** Maximum supporting quotations per endnote (default: 3) */
    maxQuotationsPerEndnote?: number;
    /** Minimum relevance threshold for endnote quotations (default: 0.65) */
    minEndnoteRelevance?: number;
    /** Source Verification: Verify all citations exist in corpus */
    verifySources?: boolean;
    /** Source Acquisition: Automatically acquire missing sources */
    acquireMissing?: boolean;
    /** Download directory for acquired sources (default: ./corpus/downloads) */
    downloadDir?: string;
    /** Citation Enforcement: Mode for hallucination prevention (default: 'auto-correct') */
    citationEnforcementMode?: 'strict' | 'auto-correct' | 'warn';
    /** Citation Enforcement: Minimum pass rate for citations (default: 0.85) */
    citationMinPassRate?: number;
    /** Citation Enforcement: Maximum hallucinations allowed (default: 3) */
    citationMaxHallucinations?: number;
    /** Phase 11: Use inline validation during generation (prevents hallucinations DURING generation, not after) */
    useInlineValidation?: boolean;
    /** Phase 11: Inline validation strictness level (default: 'moderate') */
    inlineValidationStrictness?: 'strict' | 'moderate' | 'lenient';
    /** Phase 11: Maximum retry attempts per paragraph (default: 3) */
    inlineMaxRetriesPerUnit?: number;
    /** Phase 11: Enable citation lookup tool-use during generation (default: true) */
    inlineEnableCitationLookup?: boolean;
    /** Phase 11: Minimum corpus chunks required to auto-enable inline validation (default: 3) */
    inlineMinChunks?: number;
    /** Data source mode: 'corpus' = retrieved chunks only, 'hybrid' = chunks + manifest, 'external' = no constraint */
    dataSourceMode?: 'corpus' | 'hybrid' | 'external';
  } = {}): Promise<WriteResult> {
    await this.ensureInitialized();

    // Fix 27: Resolve data source mode and enforce corpus-only invariants
    const dataSourceMode = options.dataSourceMode ?? 'hybrid';
    const resolved = { ...options };

    if (dataSourceMode === 'corpus') {
      // Hard error on explicit invariant violations (catches UI bugs early)
      if (resolved.acquireMissing) {
        throw new Error(
          'Corpus-only mode forbids acquireMissing. ' +
          'Set dataSourceMode to "hybrid" or "external" to acquire missing sources.'
        );
      }

      // Force corpus-only invariants for unspecified options
      resolved.useCorpus = true;
      resolved.acquireMissing = false;
      resolved.verifySources = true;
      resolved.citationEnforcementMode = 'strict';
      resolved.citationMaxHallucinations = 0;

      this.log(`🔒 Corpus-only mode: enforcing strict citation constraints`);
    }

    // Apply resolved options so all downstream code uses enforced values
    options = resolved;

    // DESC: Inject prior solutions before processing (RULE-010: window size 3)
    const descResult = await this.injectDESCEpisodes(topic, { command: 'god-write', mode: 'write' });
    const augmentedTopic = descResult.augmentedPrompt;

    // Fix 10: Skip DAI-001 agent selection for write() — it picks wrong agents
    // (e.g., system-designer for academic topics) and injects irrelevant instructions.
    // Instead, build a clean write-specific prompt from writing instructions + topic.
    const style = options.style ?? 'professional';
    const length = options.length ?? 'medium';
    const format = options.format ?? 'article';

    // Get style prompt from learned profile if available
    let stylePrompt: string | null = null;
    if (this.styleProfileManager) {
      if (options.styleProfileId) {
        stylePrompt = this.styleProfileManager.generateStylePrompt(options.styleProfileId);
      } else if (options.useActiveStyleProfile !== false) {
        stylePrompt = this.styleProfileManager.generateStylePrompt();
      }
    }

    // Build writing instructions with style, format, length, and style profile
    const writingInstructions = this.buildWritingInstructions(style, format, length, stylePrompt);

    // Build clean prompt: writing instructions + topic only (no agent selection noise)
    const writePrompt = `${writingInstructions}\n\n## Topic\n${augmentedTopic}`;

    // Wrap in agentSelection-like structure for compatibility with downstream code
    const agentSelection = {
      selection: {
        selected: { key: 'academic-writer', category: 'writing' },
        candidates: [],
        analysis: { taskType: 'write' },
      },
      prompt: writePrompt,
      context: undefined as string | undefined,
    };
    this.log(`write() prompt built: style=${style}, format=${format}, length=${length}, styleProfile=${!!stylePrompt}`);

    // Create trajectory for learning (FR-11)
    let trajectoryId: string | undefined;
    if (this.trajectoryBridge) {
      try {
        const embedding = await this.embed(topic);
        const trajectory = await this.trajectoryBridge.createTrajectoryFromInteraction(
          topic, 'write', embedding
        );
        trajectoryId = trajectory.trajectoryId;
      } catch (error) {
        this.log(`Warning: Trajectory creation failed in write(): ${error}`);
      }
    }

    // Get relevant knowledge (existing InteractionStore)
    const knowledge = await this.retrieveRelevant(topic, 'write');

    // Phase 3: Retrieve corpus context if enabled
    let corpusChunks: ContextChunk[] = [];
    let corpusContextInfo = {
      used: false,
      chunkCount: 0,
      collections: [] as string[],
      citations: [] as string[],
    };

    if (options.useCorpus) {
      try {
        this.log('Retrieving corpus context for source-grounded generation...');
        corpusChunks = await this.smartRetrieval.retrieveContext(topic, {
          collections: options.corpusCollections || [],
          maxChunks: options.corpusChunkCount ?? 15,
          minRelevance: options.corpusMinRelevance ?? 0.75,
          diversityBoost: true,
          rerank: true,
        });

        // Build citation list
        const citations = corpusChunks.map(chunk =>
          `${chunk.metadata.author} (${chunk.metadata.year}), p.${chunk.metadata.page_start}`
        );

        corpusContextInfo = {
          used: true,
          chunkCount: corpusChunks.length,
          collections: options.corpusCollections || [],
          citations: Array.from(new Set(citations)), // Deduplicate
        };

        this.log(`📚 Retrieved ${corpusChunks.length} corpus chunks from corpus`);
      } catch (error) {
        this.log(`Warning: Corpus retrieval failed: ${error}`);
        // Continue without corpus (graceful degradation)
      }
    }

    // Phase 1: Build corpus constraint for hallucination prevention
    // This creates an explicit whitelist of sources that the LLM can cite
    let corpusConstraint: CorpusConstraint | undefined;
    if (corpusChunks.length > 0) {
      try {
        // Fix 26: Mode-aware whitelist construction.
        // corpus-only: whitelist = retrieved chunks ONLY (no manifest widening)
        // hybrid: whitelist = retrieved chunks + collection-filtered manifest
        // external: no constraint
        const additionalSources = dataSourceMode === 'corpus'
          ? []
          : await loadCorpusManifest({
              collections: options.corpusCollections?.length ? options.corpusCollections : undefined,
            });

        corpusConstraint = buildCorpusConstraint(corpusChunks, {
          enforcement: 'strict',
          missingCitationPlaceholder: '[CITATION NEEDED]',
          minRelevance: 0.5,
          additionalSources,
        });

        this.log(`🔒 Corpus constraint built: ${corpusConstraint.sources.length} verified sources`);

        // Inject corpus constraint into the agent prompt
        // This is CRITICAL for preventing hallucinations
        const constraintPrompt = this.buildCorpusConstraintPromptText(corpusConstraint);

        // Inject actual corpus chunk TEXT so the agent has source material to cite from.
        // This is what enables verbatim quotations and grounded claims.
        const corpusContextBlock = this.buildCorpusContextBlock(corpusChunks);

        agentSelection.prompt = `${agentSelection.prompt}\n\n${constraintPrompt}\n\n${corpusContextBlock}`;
        this.log(`🔒 Corpus constraint + ${corpusChunks.length} chunk texts injected into agent prompt`);
      } catch (error) {
        this.log(`Warning: Failed to build corpus constraint: ${error}`);
        // Continue without constraint (less optimal but functional)
      }
    }

    // Phase 5: Citation Budget Check (pre-generation)
    // Verify we have enough corpus sources to support target word count
    let citationBudgetResult: CitationBudgetResult | undefined;
    if (corpusChunks.length > 0) {
      try {
        // Estimate target word count based on length parameter
        const targetWords = length === 'comprehensive' ? 3500 :
                           length === 'long' ? 2500 :
                           length === 'medium' ? 1500 : 800;

        citationBudgetResult = calculateCitationBudget(corpusChunks, {
          targetWords,
          documentType: format === 'paper' ? 'dissertation' : 'paper',
        });

        if (citationBudgetResult.sufficient) {
          this.log(`📊 Citation budget: ${citationBudgetResult.maxSupportableCitations} citations available for ${targetWords} words ✓`);
        } else {
          this.log(`⚠️ Citation budget warning: ${citationBudgetResult.warning}`);
          // Log recommendations
          for (const rec of citationBudgetResult.recommendations.slice(0, 2)) {
            this.log(`   → ${rec}`);
          }
        }
      } catch (error) {
        this.log(`Warning: Citation budget check failed: ${error}`);
        // Continue without budget check (graceful degradation)
      }
    }

    // Fix 28: Fail-fast on insufficient corpus chunks in corpus-only mode.
    // Prevents "write 1500 words with 3 chunks → hallucinate citations" failure mode.
    if (dataSourceMode === 'corpus') {
      const minByLength: Record<string, number> = {
        short: 4,
        medium: 8,
        long: 14,
        comprehensive: 20,
      };

      // If user explicitly set corpusChunkCount, trust their judgment as an override
      const lengthKey = options.length ?? 'medium';
      const minRequired = options.corpusChunkCount ?? minByLength[lengthKey] ?? 8;
      const actualChunks = corpusChunks.length;

      if (actualChunks < minRequired) {
        throw new Error(
          `Corpus-only mode requires at least ${minRequired} chunks for length="${lengthKey}"; ` +
          `got ${actualChunks}. Options:\n` +
          `  - Broaden collections (current: ${(options.corpusCollections || []).join(', ') || 'all'})\n` +
          `  - Lower --corpus-relevance (current: ${options.corpusMinRelevance ?? 0.75})\n` +
          `  - Reduce --length\n` +
          `  - Set --corpus-chunks ${actualChunks} to explicitly accept low coverage`
        );
      }

      this.log(`✓ Corpus coverage check: ${actualChunks} chunks >= ${minRequired} required for length="${lengthKey}"`);
    }

    // =========================================================================
    // Phase 11: INLINE VALIDATION - Prevent hallucinations DURING generation
    // This is the NEW approach that validates citations paragraph-by-paragraph
    // as content is generated, rather than fixing them POST-HOC
    // =========================================================================
    let inlineValidationResult: InlineGenerationResult | undefined;
    let usedInlineValidation = false;

    // Inline validation: auto-enable when sufficient corpus context exists
    // Precedence: explicit user option > auto-enable based on corpus availability
    const minChunksForInline = options.inlineMinChunks ?? 3;
    const hasUsableCorpus = corpusChunks.length >= minChunksForInline;
    const uniqueSources = new Set(corpusChunks.map(c => c.metadata?.author ?? c.metadata?.source_id ?? 'unknown')).size;
    const shouldUseInlineValidation = options.useInlineValidation ?? hasUsableCorpus;

    // Log activation decision for debuggability
    const inlineReason = options.useInlineValidation === false
      ? 'user opt-out'
      : options.useInlineValidation === true
        ? 'user opt-in'
        : hasUsableCorpus
          ? `auto (chunks=${corpusChunks.length} >= ${minChunksForInline}, sources=${uniqueSources})`
          : `auto-skip (chunks=${corpusChunks.length} < ${minChunksForInline})`;
    this.log(`[InlineValidation] ${shouldUseInlineValidation && hasUsableCorpus ? 'ON' : 'OFF'} (${inlineReason}${options.forceExecute ? ', forceExecute override' : ''})`);
    universalLogger.debug( `[write() pipeline] InlineValidation=${shouldUseInlineValidation && hasUsableCorpus ? 'ON' : 'OFF'} (${inlineReason})`);

    if (shouldUseInlineValidation && hasUsableCorpus && !options.forceExecute) {
      try {
        this.log('🔬 Phase 11: Using inline validation for hallucination prevention DURING generation...');
        universalLogger.debug( '[write() pipeline] Entering inline validation...');
        usedInlineValidation = true;

        // Build corpus sources from chunks
        const corpusSources: CorpusSource[] = buildCorpusSourcesFromChunks(corpusChunks);

        // Create retriever function for citation lookup
        const retriever: CorpusRetriever = async (query: string, opts: { maxChunks: number; minRelevance: number }) => {
          return this.smartRetrieval.retrieveContext(query, {
            maxChunks: opts.maxChunks,
            minRelevance: opts.minRelevance,
            collections: options.corpusCollections || [],
          });
        };

        // Get style prompt if available
        let stylePrompt: string | undefined;
        if (this.styleProfileManager) {
          if (options.styleProfileId) {
            stylePrompt = this.styleProfileManager.generateStylePrompt(options.styleProfileId) ?? undefined;
          } else if (options.useActiveStyleProfile !== false) {
            stylePrompt = this.styleProfileManager.generateStylePrompt() ?? undefined;
          }
        }

        // Create inline validation orchestrator with Claude Code CLI generation
        const inlineGenerateFn = async (prompt: string, systemPrompt: string) => {
          return this.generateViaClaudeCode(prompt, { model: 'sonnet', systemPrompt });
        };
        const orchestrator = createInlineValidationOrchestrator(
          inlineGenerateFn,
          retriever,
          corpusChunks,
          corpusSources,
          {
            maxRetriesPerUnit: options.inlineMaxRetriesPerUnit ?? 3,
            validationStrictness: options.inlineValidationStrictness ?? 'moderate',
            enableCitationLookupTool: options.inlineEnableCitationLookup ?? true,
            // CCV Tier 1 enabled by default in orchestrator constructor;
            // env var CCV_TIER1_ACTIVE=false|0 can override
            model: 'claude-sonnet-4-20250514',
            temperature: 0.7,
            maxTokensPerUnit: 1500,
            stylePrompt,
          }
        );

        // Build outline from topic
        const targetWords = length === 'comprehensive' ? 3500 :
                           length === 'long' ? 2500 :
                           length === 'medium' ? 1500 : 800;
        const wordsPerSection = Math.floor(targetWords / 5); // ~5 sections

        const outline = InlineValidationOrchestrator.createBasicOutline(
          topic,
          this.extractKeyPointsFromTopic(topic),
          wordsPerSection
        );

        this.log(`🔬 Inline generation: ${outline.length} units, ~${wordsPerSection} words each`);

        // Generate with inline validation
        inlineValidationResult = await orchestrator.generateWithInlineValidation(
          topic,
          outline,
          agentSelection.prompt // Include agent context as system prompt
        );

        this.log(
          `🔬 Inline validation complete: ${inlineValidationResult.stats.passedFirstAttempt}/${inlineValidationResult.stats.totalUnits} passed first attempt, ` +
          `${inlineValidationResult.stats.passedAfterRetry} after retry, ${inlineValidationResult.stats.failed} failed, ` +
          `quality=${(inlineValidationResult.qualityScore * 100).toFixed(1)}%`
        );

        // If inline validation produced content, skip regular execution
        if (inlineValidationResult.document.length > 0) {
          // Skip to the return, but first do prose sanitization and other post-processing
        }
      } catch (error) {
        universalLogger.warn( `[write() pipeline] Inline validation FAILED: ${error}`);
        this.log(`Warning: Inline validation failed, falling back to regular execution: ${error}`);
        usedInlineValidation = false;
        inlineValidationResult = undefined;
        // Continue with regular execution (graceful degradation)
      }
    }

    // Initialize content variable
    let content: string;

    // If inline validation was successful, use that content
    if (usedInlineValidation && inlineValidationResult && inlineValidationResult.document.length > 0) {
      content = inlineValidationResult.document;
      universalLogger.debug( `[write() pipeline] Using INLINE VALIDATION content (${content.split(/\s+/).length} words)`);
      this.log(`Using inline-validated content (${content.split(/\s+/).length} words)`);
    } else {
      universalLogger.debug( `[write() pipeline] Using DIRECT API path (inline=${usedInlineValidation}, docLen=${inlineValidationResult?.document?.length ?? 'N/A'})`);
      // Direct LLM execution for write() with --execute flag.
      // Uses Anthropic API directly instead of executeTaskDefault() which returns [TASK_QUEUED].
      // This ensures the full pipeline (corpus constraint, quality gauntlet, enforcement) runs
      // on actual generated content, not a task placeholder.

      if (options.forceExecute) {
        // FORCE_EXECUTE: Generate mock content for testing
        const mockContent = this.generateMockAcademicContent(topic, style, length, corpusChunks);
        this.log('FORCE_EXECUTE: Generated mock content for testing', {
          wordCount: mockContent.split(/\s+/).length,
          style,
          length
        });
        content = mockContent;
      } else {
        // Generate via Claude Code CLI (uses Claude subscription, not API key)
        try {
          this.log('write() direct execution: Generating via Claude Code CLI...');
          universalLogger.debug( '[write() pipeline] Claude Code execution: starting...');

          content = await this.generateViaClaudeCode(agentSelection.prompt, {
            model: 'sonnet',
          });

          this.log(`write() Claude Code execution: Got ${content.split(/\s+/).length} words`);
          universalLogger.debug( `[write() pipeline] Claude Code execution: Got ${content.split(/\s+/).length} words`);
        } catch (apiError) {
          this.log(`write() Claude Code execution failed: ${apiError}, falling back to task queuing`);
          universalLogger.warn( `[write() pipeline] Claude Code execution FAILED: ${apiError}`);

          // Fallback: try executeTaskDefault (will return [TASK_QUEUED] but at least won't crash)
          const executionResult = await this.executeTaskDefault(agentSelection, undefined, {
            trajectoryId,
            forceExecute: options.forceExecute
          });
          content = executionResult.success ? executionResult.result : agentSelection.prompt;
        }
      }
    }

    // Phase A: Prose Sanitization - Remove research artifacts for publication-ready output
    // Target: 100% clean rate (zero tolerance for artifacts like Q1:, Confidence:, [SYNTHESIS NEEDED])
    let sanitizationResult: SanitizationResult | undefined;
    try {
      this.log('Phase A: Running prose sanitization...');
      sanitizationResult = await this.proseSanitizer.sanitize(content);

      // Replace content with sanitized version
      content = sanitizationResult.sanitized;

      if (sanitizationResult.artifactCount > 0) {
        this.log(
          `Prose sanitization: removed ${sanitizationResult.artifactCount} artifacts, ` +
          `cleanRate=${(sanitizationResult.cleanRate * 100).toFixed(1)}%`
        );

        // Log specific violations for debugging
        for (const violation of sanitizationResult.violations.slice(0, 5)) {
          this.log(`  - Removed "${violation.text}" at line ${violation.line}`);
        }
        if (sanitizationResult.violations.length > 5) {
          this.log(`  ... and ${sanitizationResult.violations.length - 5} more`);
        }
      } else {
        this.log('Prose sanitization: content is artifact-free');
      }
    } catch (error) {
      this.log(`Warning: Prose sanitization failed, using original content: ${error}`);
      // Continue without sanitization (graceful degradation)
    }

    // Quality Gauntlet: Validate and revise content if needed (0.85 threshold, up to 3 iterations)
    let qualityValidation: QualityValidationResult | undefined;
    universalLogger.debug( `[write() pipeline] Quality gauntlet: qualityIntegration=${!!this.qualityIntegration}`);
    if (this.qualityIntegration) {
      try {
        universalLogger.debug( '[write() pipeline] Running quality gauntlet...');
        this.log('Running quality gauntlet validation...');
        qualityValidation = await this.qualityIntegration.validateAndRevise(content, {
          topic,
          style,
          format,
          trajectoryId,
          enabled: true, // Always enabled for god-write
          corpusChunks: corpusChunks.length > 0 ? corpusChunks : undefined,
          knownAuthors: corpusConstraint?.allowedSources?.map((s: any) => s.author).filter(Boolean) ?? [],
        });

        // Use validated/revised content
        content = qualityValidation.content;

        this.log(
          `Quality gauntlet complete: score=${qualityValidation.qualityScore.toFixed(2)}, ` +
          `passed=${qualityValidation.passed}, revisions=${qualityValidation.revisionIterations}`
        );
      } catch (error) {
        universalLogger.warn( `[write() pipeline] Quality gauntlet FAILED: ${error}`);
        this.log(`Warning: Quality validation failed, using original content: ${error}`);
      }
    }

    // Phase 2 & 4: Citation Validation and Enforcement (post-generation)
    // This catches and corrects any hallucinated citations that slipped through
    let citationEnforcementResult: EnforcementResult | undefined;
    universalLogger.debug( `[write() pipeline] Citation enforcement: corpusConstraint=${!!corpusConstraint}, chunks=${corpusChunks.length}`);
    if (corpusConstraint && corpusChunks.length > 0) {
      try {
        universalLogger.debug( '[write() pipeline] Running citation enforcement...');
        this.log('🔍 Phase 2/4: Running citation enforcement...');

        // Create enforcer from corpus constraint with configurable options
        const enforcer = new CitationEnforcer(corpusConstraint, {
          mode: options.citationEnforcementMode || 'auto-correct',  // Configurable enforcement mode
          minPassRate: options.citationMinPassRate ?? 0.85,          // Configurable minimum pass rate
          maxHallucinations: options.citationMaxHallucinations ?? 3, // Configurable max hallucinations
          placeholder: '',  // Fix 19: Remove hallucinated citations entirely instead of leaving [CITATION NEEDED] markers
          includeReport: true,
        }, corpusChunks); // Phase 7: Enable quotation fidelity validation

        // Enforce citations on generated content
        citationEnforcementResult = await enforcer.enforce(content);

        if (citationEnforcementResult.action === 'pass') {
          this.log(`✅ Citation enforcement: All ${citationEnforcementResult.validation.totalCitations} citations verified`);
        } else if (citationEnforcementResult.action === 'corrected') {
          this.log(
            `🔧 Citation enforcement: Corrected ${citationEnforcementResult.correctionsCount} citations, ` +
            `pass rate ${(citationEnforcementResult.validation.passRate * 100).toFixed(1)}%`
          );
          // Use corrected content
          content = citationEnforcementResult.content;
        } else if (citationEnforcementResult.action === 'warning') {
          this.log(
            `⚠️ Citation enforcement warning: ${citationEnforcementResult.validation.hallucinated.length} ` +
            `hallucinated citations detected`
          );
          // Keep content but log warnings
          for (const h of citationEnforcementResult.validation.hallucinated.slice(0, 3)) {
            this.log(`   - Line ${h.citation.line}: "${h.citation.raw}" - ${h.reason}`);
          }
        } else if (citationEnforcementResult.action === 'rejected') {
          this.log(`❌ Citation enforcement: Content rejected due to excessive hallucinations`);
          // In production, might want to regenerate or flag for human review
        }
      } catch (error) {
        this.log(`Warning: Citation enforcement failed: ${error}`);
        // Continue without enforcement (graceful degradation)
      }
    }

    // Fix 18: Second sanitizer pass after citation enforcement
    // Citation enforcement may insert markers or leave artifacts that need cleanup
    if (citationEnforcementResult && citationEnforcementResult.action !== 'pass') {
      try {
        const postEnforcementSanitize = await this.proseSanitizer.sanitize(content);
        if (postEnforcementSanitize.artifactCount > 0) {
          content = postEnforcementSanitize.sanitized;
          this.log(`Post-enforcement sanitization: removed ${postEnforcementSanitize.artifactCount} additional artifacts`);
        }
      } catch (error) {
        this.log(`Warning: Post-enforcement sanitization failed: ${error}`);
      }
    }

    // Fix 25/30: Post-enforcement non-corpus author scrubbing
    // Final safety net: remove any remaining references to non-corpus authors
    // that slipped through inline validation and citation enforcement.
    // In corpus-only mode, this is fail-closed (throws instead of silently scrubbing).
    if (corpusConstraint && corpusConstraint.sources.length > 0) {
      try {
        const scrubResult = scrubNonCorpusAuthors(content, corpusConstraint);
        if (scrubResult.removedCount > 0) {
          if (dataSourceMode === 'corpus') {
            // Corpus-only: fail-closed with diagnostic report
            const report = scrubResult.removedAuthors
              .slice(0, 3)
              .map(name => {
                const snippets = scrubResult.contexts[name]?.slice(0, 2).join('; ') || 'context unavailable';
                return `  - "${name}" (${snippets})`;
              })
              .join('\n');

            throw new Error(
              `Corpus-only mode: ${scrubResult.removedCount} non-corpus author reference(s) detected after enforcement.\n` +
              `Authors found:\n${report}\n` +
              `This indicates insufficient corpus coverage. Options:\n` +
              `  - Increase --corpus-chunks to retrieve more source material\n` +
              `  - Lower --corpus-relevance to broaden retrieval\n` +
              `  - Reduce --length to require less content`
            );
          } else {
            // Hybrid/external: scrub silently (existing behavior)
            content = scrubResult.content;
            this.log(`🧹 Author scrub: removed ${scrubResult.removedCount} non-corpus author references (${scrubResult.removedAuthors.join(', ')})`);
          }
        }
      } catch (error) {
        // Re-throw corpus-only mode errors; swallow scrubber failures in other modes
        if (error instanceof Error && error.message.startsWith('Corpus-only mode:')) throw error;
        this.log(`Warning: Non-corpus author scrubbing failed: ${error}`);
      }
    }

    // Phase 5: Staged Composition System Integration
    // Auto-detect if staged composition should be used
    let compositionMetadata: {
      used: boolean;
      succeeded?: boolean;
      wordCount?: number;
      qualityScore?: number;
      processingTime?: number;
    } = { used: false };

    const shouldUseStagedComposition =
      options.useStagedComposition ||
      (options.chapterOutline !== undefined) ||
      (format === 'paper' && length === 'comprehensive') ||
      /chapter|section/i.test(topic);

    if (shouldUseStagedComposition && !options.forceExecute) {
      try {
        this.log('Phase 5: Using staged composition system...');

        let compositionResult: CompositionResult;

        if (options.chapterOutline) {
          // User provided explicit chapter outline
          compositionResult = await compositionOrchestrator.composeChapter(
            options.chapterOutline,
            true // verbose
          );
        } else {
          // Auto-generate simple outline from topic
          const keyPoints = this.extractKeyPointsFromTopic(topic);
          compositionResult = await compositionOrchestrator.composeSimple(
            topic,
            keyPoints,
            {
              chapterNumber: 1,
              purpose: `Generate ${format} on ${topic}`,
              evidenceType: style === 'academic' ? 'theoretical' : 'analytical',
              verbose: true,
            }
          );
        }

        if (compositionResult.succeeded) {
          // Use composed content
          content = compositionResult.prose;
          compositionMetadata = {
            used: true,
            succeeded: true,
            wordCount: compositionResult.metadata.wordCount,
            qualityScore: compositionResult.metadata.qualityScore,
            processingTime: compositionResult.metadata.processingTime,
          };

          this.log(
            `Staged composition complete: ` +
            `wordCount=${compositionMetadata.wordCount}, ` +
            `quality=${compositionMetadata.qualityScore?.toFixed(2)}`
          );
        } else {
          // Composition failed, keep original content
          compositionMetadata = { used: true, succeeded: false };
          this.log('Staged composition failed, using original content');
        }
      } catch (error) {
        this.log(`Warning: Staged composition failed: ${error}`);
        compositionMetadata = { used: true, succeeded: false };
        // Continue with original content (graceful degradation)
      }
    }

    // Endnote Generation: Add supporting quotations from corpus
    let endnotesMetadata: {
      generated: boolean;
      count: number;
      supportingQuotationsCount: number;
      enhancedContent?: string;
      endnotesSection?: string;
    } = { generated: false, count: 0, supportingQuotationsCount: 0 };

    if (options.enableEndnotes && corpusContextInfo.used && this.smartRetrieval) {
      try {
        this.log('Generating endnotes with supporting quotations...');

        // Create corpus search function using smart retrieval layer
        const corpusSearch: CorpusSearchFn = async (query: string, limit: number) => {
          const chunks = await this.smartRetrieval.retrieveContext(query, {
            maxChunks: limit,
            collections: corpusContextInfo.collections,
            minRelevance: 0.65,
          });

          return chunks.map(chunk => ({
            id: chunk.id,
            text: chunk.text,
            metadata: {
              author: chunk.metadata?.author,
              title: chunk.metadata?.title,
              year: chunk.metadata?.year,
              pageRef: chunk.metadata?.pageRef,
              docId: chunk.metadata?.docId,
            },
            score: chunk.relevance,
          }));
        };

        // Create provenance ledger for tracking
        const provenanceLedger = new ProvenanceLedger();

        // Generate endnotes
        const endnoteConfig: Partial<EndnoteGeneratorConfig> = {
          maxQuotationsPerEndnote: options.maxQuotationsPerEndnote ?? 3,
          minRelevanceThreshold: options.minEndnoteRelevance ?? 0.65,
          includeSameSource: true,
          includeDifferentSources: true,
          maxQuotationLength: 500,
          formatStyle: 'numeric',
          generateInlineMarkers: true,
        };

        const endnoteResult = await generateEndnotes(content, corpusSearch, {
          config: endnoteConfig,
          provenanceLedger,
        });

        // Update content with endnotes
        if (endnoteResult.endnotes.length > 0) {
          content = endnoteResult.contentWithMarkers + '\n\n' + endnoteResult.endnotesSection;
          endnotesMetadata = {
            generated: true,
            count: endnoteResult.stats.totalEndnotes,
            supportingQuotationsCount: endnoteResult.stats.totalSupportingQuotations,
            enhancedContent: endnoteResult.contentWithMarkers,
            endnotesSection: endnoteResult.endnotesSection,
          };

          this.log(
            `Endnotes generated: ${endnotesMetadata.count} endnotes, ` +
            `${endnotesMetadata.supportingQuotationsCount} supporting quotations`
          );
        } else {
          this.log('No endnotes generated (no citations found)');
        }
      } catch (error) {
        this.log(`Warning: Endnote generation failed: ${error}`);
        // Continue with original content (graceful degradation)
      }
    }

    // Source Verification and Acquisition (post-generation hook)
    let sourceVerificationResult: {
      verified: boolean;
      summary?: VerificationSummary;
      acquisitionResults?: AcquisitionResult[];
    } = { verified: false };

    if (options.verifySources) {
      try {
        this.log('Verifying sources against corpus...');
        const sourceVerifier = getSourceVerificationLayer();
        const extractedCitations = sourceVerifier.extractCitations(content);
        const verificationSummary = await sourceVerifier.verifyCitationsAgainstCorpus(extractedCitations);

        sourceVerificationResult.verified = true;
        sourceVerificationResult.summary = verificationSummary;

        this.log(
          `Source verification complete: ${verificationSummary.foundInCorpus}/${verificationSummary.totalCitations} ` +
          `found in corpus, ${verificationSummary.missingFromCorpus} missing`
        );

        // Automatic source acquisition if enabled and sources are missing
        if (options.acquireMissing && verificationSummary.missingFromCorpus > 0) {
          this.log('Acquiring missing sources...');
          const acquisitionLayer = getMissingSourceAcquisitionLayer();

          // Configure download directory if provided
          if (options.downloadDir) {
            // Create new instance with custom config
            const customAcquisitionLayer = new MissingSourceAcquisitionLayer({
              downloadDir: options.downloadDir,
              autoDownload: true,
              verbose: true,
            });
            sourceVerificationResult.acquisitionResults = await customAcquisitionLayer.acquireSources(
              verificationSummary.missingSources
            );
          } else {
            sourceVerificationResult.acquisitionResults = await acquisitionLayer.acquireSources(
              verificationSummary.missingSources
            );
          }

          const downloaded = sourceVerificationResult.acquisitionResults.filter(r => r.status === 'downloaded').length;
          const linkProvided = sourceVerificationResult.acquisitionResults.filter(r => r.status === 'link_provided').length;

          this.log(
            `Source acquisition complete: ${downloaded} downloaded, ${linkProvided} links provided`
          );
        }
      } catch (error) {
        this.log(`Warning: Source verification failed: ${error}`);
        // Continue without verification (graceful degradation)
      }
    }

    // Store successful writing patterns
    await this.maybeStorePattern({
      content: `${format} on ${topic}`,
      type: 'example',
      domain: 'writing',
      tags: [style, format, ...this.extractTags(topic)],
    });

    // Auto-feedback if trajectory exists (FR-11)
    // Use quality gauntlet score if available, otherwise estimate
    let writeQuality = qualityValidation?.qualityScore ?? 0.7;
    if (!qualityValidation && this.config.autoLearn) {
      writeQuality = estimateQuality({
        id: trajectoryId ?? 'unknown',
        mode: 'write',
        input: topic,
        output: content,
        timestamp: Date.now(),
      });
    }

    if (this.config.autoLearn && this.trajectoryBridge && trajectoryId) {
      if (writeQuality >= this.config.autoStoreThreshold) {
        try {
          await this.trajectoryBridge.submitFeedback(trajectoryId, writeQuality, { implicit: true });
          this.log(`Write auto-feedback: quality=${writeQuality.toFixed(2)}`);
        } catch (error) {
          this.log(`Warning: Write auto-feedback failed: ${error}`);
        }
      }
    }

    // DESC: Store episode for future learning (non-blocking)
    this.storeDESCEpisode(topic, content, {
      command: 'god-write',
      mode: 'write',
      quality: writeQuality,
    }).catch(err => this.log(`DESC: Background storage error: ${err}`));

    return {
      topic,
      content,
      style,
      sources: knowledge.map(k => k.id),
      wordCount: content.split(/\s+/).length,
      trajectoryId,
      // Include quality metrics if validation was performed
      qualityMetrics: qualityValidation?.metrics,
      qualityScore: qualityValidation?.qualityScore,
      revisionIterations: qualityValidation?.revisionIterations ?? 0,
      // Phase 3: Include corpus context information
      corpusContext: corpusContextInfo.used ? corpusContextInfo : undefined,
      // Phase 5: Include staged composition metadata
      stagedComposition: compositionMetadata.used ? compositionMetadata : undefined,
      // Include endnotes metadata if generated
      endnotes: endnotesMetadata.generated ? endnotesMetadata : undefined,
      // Include source verification results if performed
      sourceVerification: sourceVerificationResult.verified ? {
        verified: true,
        totalCitations: sourceVerificationResult.summary?.totalCitations ?? 0,
        foundInCorpus: sourceVerificationResult.summary?.foundInCorpus ?? 0,
        missingFromCorpus: sourceVerificationResult.summary?.missingFromCorpus ?? 0,
        missingSources: (sourceVerificationResult.summary?.missingSources ?? []).map(s => ({
          author: s.author,
          title: s.title,
          type: s.type,
        })),
        acquisitionResults: sourceVerificationResult.acquisitionResults?.map(r => ({
          source: r.source,
          status: r.status,
          downloadPath: r.downloadPath,
          accessUrls: r.accessUrls,
        })),
      } : undefined,
      // Phase A: Include prose sanitization results
      proseSanitization: sanitizationResult ? {
        sanitized: true,
        artifactsRemoved: sanitizationResult.artifactCount,
        cleanRate: sanitizationResult.cleanRate,
        violations: sanitizationResult.violations.map(v => ({
          type: v.type,
          text: v.text,
          line: v.line,
        })),
      } : undefined,
      // Phase 2/4: Citation enforcement results
      citationEnforcement: citationEnforcementResult ? {
        action: citationEnforcementResult.action,
        totalCitations: citationEnforcementResult.validation.totalCitations,
        validCitations: citationEnforcementResult.validation.valid.length,
        hallucinatedCitations: citationEnforcementResult.validation.hallucinated.length,
        correctionsMade: citationEnforcementResult.correctionsCount,
        missingPageNumbers: citationEnforcementResult.missingPageNumbersCount,
        passRate: citationEnforcementResult.validation.passRate,
        report: citationEnforcementResult.report,
      } : undefined,
      // Phase 5: Citation budget results
      citationBudget: citationBudgetResult ? {
        expectedCitations: citationBudgetResult.expectedCitations,
        maxSupportableCitations: citationBudgetResult.maxSupportableCitations,
        deficit: citationBudgetResult.deficit,
        sufficient: citationBudgetResult.sufficient,
        warning: citationBudgetResult.warning,
      } : undefined,
      // Phase 11: Inline validation results
      inlineValidation: usedInlineValidation && inlineValidationResult ? {
        used: true,
        allPassed: inlineValidationResult.allPassed,
        qualityScore: inlineValidationResult.qualityScore,
        totalUnits: inlineValidationResult.stats.totalUnits,
        passedFirstAttempt: inlineValidationResult.stats.passedFirstAttempt,
        passedAfterRetry: inlineValidationResult.stats.passedAfterRetry,
        failedUnits: inlineValidationResult.stats.failed,
        totalAttempts: inlineValidationResult.stats.totalAttempts,
        avgAttemptsPerUnit: inlineValidationResult.stats.avgAttemptsPerUnit,
        failedUnitDetails: inlineValidationResult.failedUnits.map(f => ({
          type: f.unit.type,
          intent: f.unit.intent,
          lastScore: f.lastValidationResult.overallScore,
          issues: f.lastValidationResult.issues.map(i => i.message),
        })),
      } : undefined,
    };
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
  async feedback(
    id: string,
    rating: number,
    options: {
      useful?: boolean;
      notes?: string;
      /** Set true if id is a trajectoryId instead of interactionId */
      isTrajectoryId?: boolean;
    } = {}
  ): Promise<FeedbackResult> {
    let trajectoryId: string | undefined;
    let interaction: Interaction | undefined;

    if (options.isTrajectoryId) {
      // Direct trajectory ID provided
      trajectoryId = id;
    } else {
      // Look up interaction by ID
      interaction = this.interactionStore.get(id);
      if (!interaction) {
        this.log(`Warning: Interaction ${id} not found`);
        return { weightUpdates: 0, patternCreated: false };
      }
      trajectoryId = interaction.trajectoryId;
    }

    const feedbackData = {
      rating,
      useful: options.useful ?? rating > 0.5,
      notes: options.notes,
    };

    // Update feedback in store if we have an interaction
    if (interaction) {
      this.interactionStore.updateFeedback(id, feedbackData);
    }

    // Submit to SonaEngine via TrajectoryBridge (FR-11)
    let feedbackResult: FeedbackResult = { weightUpdates: 0, patternCreated: false };
    if (this.trajectoryBridge && trajectoryId) {
      try {
        feedbackResult = await this.trajectoryBridge.submitFeedback(
          trajectoryId,
          rating,
          { notes: options.notes }
        );
        this.log(`SonaEngine feedback: trajectory=${trajectoryId}, rating=${rating.toFixed(2)}, patternCreated=${feedbackResult.patternCreated}`);
      } catch (error) {
        this.log(`Warning: SonaEngine feedback failed: ${error}`);
      }
    }

    // Legacy learning from this feedback
    if (interaction) {
      if (rating > this.config.autoStoreThreshold) {
        await this.reinforcePattern(interaction);
      } else if (rating < 0.3) {
        await this.weakenPattern(interaction);
      }
    }

    this.log(`Feedback recorded: ${rating} for ${id}`);
    return feedbackResult;
  }

  /**
   * Learn from successful interaction
   */
  private async learnFromInteraction(interaction: Interaction): Promise<void> {
    // Auto-detect quality based on interaction characteristics
    const implicitQuality = this.assessQuality(interaction);

    if (implicitQuality > this.config.autoStoreThreshold) {
      await this.storeKnowledge({
        content: `${interaction.input} -> ${interaction.output}`,
        type: 'pattern',
        domain: interaction.mode,
        tags: this.extractTags(interaction.input),
      });

      this.log(`Auto-learned from interaction: ${interaction.id}`);
    }
  }

  /**
   * Reinforce a successful pattern
   */
  private async reinforcePattern(interaction: Interaction): Promise<void> {
    const embedding = interaction.embedding ?? await this.embed(interaction.input);

    // Query to find the pattern that was used
    const results = await this.agent.query(embedding, { k: 1 });

    if (results.patterns.length > 0) {
      await this.agent.learn({
        queryId: results.queryId,
        patternId: results.patterns[0].id,
        verdict: 'positive',
        score: interaction.feedback?.rating ?? 0.9,
      });

      // Track success
      const key = results.patterns[0].id;
      this.successfulPatterns.set(key, (this.successfulPatterns.get(key) ?? 0) + 1);
    }
  }

  /**
   * Weaken an unsuccessful pattern
   */
  private async weakenPattern(interaction: Interaction): Promise<void> {
    const embedding = interaction.embedding ?? await this.embed(interaction.input);

    const results = await this.agent.query(embedding, { k: 1 });

    if (results.patterns.length > 0) {
      await this.agent.learn({
        queryId: results.queryId,
        patternId: results.patterns[0].id,
        verdict: 'negative',
        score: interaction.feedback?.rating ?? 0.1,
      });
    }
  }

  // ==================== Knowledge Management ====================

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



  private assessQuality(interaction: Interaction): number {
    // Heuristic quality assessment
    let quality = 0.5;

    // Longer, detailed outputs tend to be higher quality
    if (interaction.output.length > 500) quality += 0.1;
    if (interaction.output.length > 1000) quality += 0.1;

    // Structured output (code, lists) tends to be useful
    if (interaction.output.includes('```')) quality += 0.1;
    if (interaction.output.includes('\n-')) quality += 0.05;

    return Math.min(quality, 1.0);
  }

  private extractTags(text: string): string[] {
    // Extract meaningful tags from text
    const words = text.toLowerCase().split(/\W+/);
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while', 'although', 'though', 'after', 'before', 'when', 'whenever', 'where', 'wherever', 'whether', 'which', 'while', 'who', 'whoever', 'whom', 'whose', 'why', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'this', 'that', 'these', 'those', 'am']);

    return words
      .filter(w => w.length > 3 && !stopWords.has(w))
      .slice(0, 10);
  }

  /**
   * Extract key points from topic for staged composition
   * Attempts to parse structured content (numbered lists, bullet points)
   * or generates key points from topic analysis
   */
  private extractKeyPointsFromTopic(topic: string): string[] {
    // Try to extract numbered or bulleted lists
    const numberedPattern = /^\d+\.\s+(.+)$/gm;
    const bulletPattern = /^[•\-\*]\s+(.+)$/gm;

    const numberedMatches = Array.from(topic.matchAll(numberedPattern));
    if (numberedMatches.length > 0) {
      return numberedMatches.map(m => m[1].trim()).slice(0, 5);
    }

    const bulletMatches = Array.from(topic.matchAll(bulletPattern));
    if (bulletMatches.length > 0) {
      return bulletMatches.map(m => m[1].trim()).slice(0, 5);
    }

    // Split by sentences and take first 3-5 as key points
    const sentences = topic.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    if (sentences.length >= 2) {
      return sentences.slice(0, Math.min(5, sentences.length));
    }

    // Fallback: generate generic key points from topic
    return [
      `Understanding the core concepts of ${topic}`,
      `Analyzing the implications and applications`,
      `Synthesizing the key findings and conclusions`,
    ];
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
   * Force save current state (call periodically for safety)
   */
  async saveState(): Promise<void> {
    await this.savePersistedState();
  }
}

// ==================== Singleton Export ====================

export const universalAgent = new UniversalAgent();
