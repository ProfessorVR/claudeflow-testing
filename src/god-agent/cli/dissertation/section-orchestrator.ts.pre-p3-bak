/**
 * SectionOrchestrator - Orchestrates dissertation section completion
 *
 * Implements HIGH-IMPACT #2 from phd-pipeline-improvement-proposal.md:
 * - Combines DissertationContextManager + StyleInjector + QualityGauntlet + Corpus
 * - Provides CLI interface for /god-complete-section command
 * - Manages iterative refinement until publication-ready quality
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { parseArgs } from 'util';

// Context management
import {
  DissertationContextManager,
  type ContextBuildOptions,
  type TieredContextBuildOptions,
} from '../context/dissertation-context-manager.js';

// Tiered context support
import {
  TieredContextManager,
  type TieredContext,
  type ColdContextAccessor,
  createAgentDBTieredContextManager,
  AgentDBColdContextAccessor,
} from '../context/tiered-context-manager.js';

// Style injection
import { StyleInjector } from '../style-injector.js';
import { StyleProfileManager } from '../../universal/style-profile.js';

// Quality validation
import {
  QualityGauntlet,
  createDefaultGauntlet,
  type GauntletResult,
  type GauntletConfig,
} from '../quality/quality-gauntlet.js';

import {
  RevisionOrchestrator,
  createDefaultOrchestrator,
  type RevisionRequest,
  type RefinementResult,
} from '../quality/revision-orchestrator.js';

// Corpus integration
import {
  CorpusCitationConnector,
  getCorpusCitationConnector,
  type CorpusSuggestion,
} from '../quality/corpus-citation-connector.js';

// Corpus validation (Priority 1 - Mandatory corpus-only enforcement)
import {
  corpusValidator,
  type CorpusValidationReport,
} from '../quality/corpus-validator.js';

// Phase 4: Smart Retrieval Layer for multi-source corpus retrieval
import {
  SmartRetrievalLayer,
  type ContextChunk,
  type RetrievalOptions,
} from '../../retrieval/index.js';

// Human verification
import {
  HumanVerifier,
  createHumanVerifier,
  type HumanVerificationOptions,
  type VerificationDecision,
  type ReviewContext,
} from '../../__experimental__/human-verification.js';

// Satisfaction tracking
import {
  SatisfactionTracker,
  createSatisfactionTracker,
  type SatisfactionOptions,
  type SatisfactionRating,
} from '../../__experimental__/satisfaction-tracker.js';

// Feedback learning
import {
  FeedbackIntegration,
  type FeedbackInput,
  type FeedbackProcessingResult,
} from '../feedback/feedback-integration.js';

// Provenance tracking
import {
  ProvenanceLedger,
  type ProvenanceEntry,
  type ProvenanceValidation,
  type DetectedClaim,
} from '../quality/provenance-ledger.js';

// Endnote generation
import {
  EndnoteGenerator,
  createEndnoteGenerator,
  type EndnoteGeneratorConfig,
  type EndnoteGenerationResult,
  type CorpusSearchFn,
} from '../quality/endnote-generator.js';

// Citation hallucination prevention (Phases 1, 2, 4, 5)
import {
  buildCorpusConstraint,
  CitationEnforcer,
  calculateCitationBudget,
  type CorpusConstraint,
  type EnforcementResult,
} from '../../core/writing/index.js';

// Error recovery
import {
  ErrorRecoveryManager,
  createErrorRecoveryManager,
  type SectionCheckpoint,
  type RecoveryOptions,
} from './error-recovery.js';

// Prompt templates for testing
import {
  buildPromptWithStyle,
  type PromptStyle,
  type PromptParams,
} from './prompt-templates.js';

// ============================================================================
// Types
// ============================================================================

export interface SectionCompletionConfig {
  /** Chapter number (1-indexed) */
  chapter: number;
  /** Section name/topic */
  section: string;
  /** Target word count */
  targetWords?: number;
  /** Style profile ID to use */
  styleProfileId?: string;
  /** Maximum revision iterations */
  maxIterations?: number;
  /** Quality threshold (0-1) */
  qualityThreshold?: number;
  /** Whether to query corpus for suggestions */
  useCorpus?: boolean;
  /** Custom context build options */
  contextOptions?: ContextBuildOptions;
  /**
   * Use tiered context compression for large documents.
   * Enables Hot/Warm/Cold tier system with AgentDB backing.
   */
  useTieredContext?: boolean;
  /**
   * Token budget for tiered context (only used if useTieredContext is true).
   * Default: 60000
   */
  tokenBudget?: number;
  /**
   * Use AgentDB for cold tier semantic search.
   * Provides true vector similarity search vs simple keyword matching.
   */
  useAgentDB?: boolean;

  /**
   * Use hybrid retrieval (BM25 + Semantic Search with RRF fusion)
   * Combines keyword matching with semantic search for better coverage.
   * Requires useAgentDB to be enabled.
   */
  useHybridRetrieval?: boolean;

  /**
   * Retrieval mode: 'hybrid', 'semantic-only', 'bm25-only'
   * Default: 'hybrid' (when useHybridRetrieval is enabled)
   */
  retrievalMode?: 'hybrid' | 'semantic-only' | 'bm25-only';

  /**
   * BM25 configuration overrides
   */
  bm25Config?: {
    k1?: number;
    b?: number;
    persistencePath?: string;
  };

  // ========== NEW FEATURES FROM GOD-WRITE INTEGRATION ==========

  /** Enable human verification between iterations */
  enableHumanVerification?: boolean;
  /** Human verification options */
  humanVerificationOptions?: HumanVerificationOptions;

  /** Enable satisfaction tracking after completion */
  enableSatisfactionTracking?: boolean;
  /** Satisfaction tracking options */
  satisfactionOptions?: SatisfactionOptions;

  /** Enable feedback learning integration */
  enableFeedbackLearning?: boolean;

  /** Enable provenance ledger for claim tracking */
  enableProvenanceLedger?: boolean;

  // ========== ENDNOTE GENERATION ==========

  /**
   * Enable endnote generation with supporting quotations
   * When enabled, generates endnotes after each citation with
   * additional supporting quotations from the corpus.
   */
  enableEndnotes?: boolean;

  /**
   * Endnote generation configuration
   */
  endnoteConfig?: Partial<EndnoteGeneratorConfig>;

  /**
   * Prompt style variation to use (for testing)
   * Options: 'baseline', 'concise', 'example-driven', 'conversational',
   *          'constraint-heavy', 'minimal', 'question-based', 'iterative'
   */
  promptStyle?: string;

  /**
   * Use local vLLM model instead of Claude API
   * Connects to http://localhost:8002 (default vLLM port)
   */
  useLocalModel?: boolean;

  /**
   * vLLM base URL (default: http://localhost:8002)
   */
  vllmBaseUrl?: string;

  // ========== PHASE 3: AUTONOMOUS RETRIEVAL ==========

  /**
   * Enable autonomous retrieval (LLM calls tools during generation)
   * When enabled, replaces manual context loading with on-demand retrieval.
   */
  enableAutonomousRetrieval?: boolean;

  /**
   * LLM client to use for autonomous retrieval
   * Options: 'claude', 'openai', 'vllm', 'auto'
   * Default: 'auto' (detects from environment)
   */
  llmClient?: 'claude' | 'openai' | 'vllm' | 'auto';

  /**
   * Maximum retrieval rounds (default: 5)
   * Each round allows LLM to call tools and get results
   */
  maxRetrievalRounds?: number;

  /**
   * Maximum context tokens for autonomous retrieval (default: 180000)
   */
  autonomousContextTokens?: number;

  // ========== PHASE 4: MULTI-SOURCE RETRIEVAL ==========

  /**
   * Enable multi-source corpus retrieval using SmartRetrievalLayer.
   * Retrieves context from multiple corpus collections (notes, theory, empirical).
   */
  useMultiSourceRetrieval?: boolean;

  /**
   * Target corpus collections for retrieval.
   * Default: ['notes', 'theory', 'empirical']
   */
  corpusCollections?: string[];

  /**
   * Number of chunks to retrieve per collection.
   * Default: 10
   */
  chunksPerCollection?: number;

  /**
   * Minimum relevance threshold for corpus chunks.
   * Default: 0.75
   */
  corpusMinRelevance?: number;

  /**
   * Load chapter context to extract existing goals/structure.
   * Helps maintain coherence with previous sections.
   */
  loadChapterContext?: boolean;

  /**
   * Enable coherence checking against existing chapter content.
   * Validates terminology and style consistency.
   */
  enableCoherenceCheck?: boolean;
}

export interface SectionContext {
  /** Dissertation context string for chapter */
  dissertationContext: string;
  /** Style profile prompt */
  stylePrompt: string;
  /** Corpus source suggestions */
  corpusSuggestions: CorpusSuggestion[];
  /** Combined generation prompt */
  generationPrompt: string;
  /** Metadata about context */
  metadata: {
    chapter: number;
    section: string;
    contextLength: number;
    styleProfileId: string | null;
    corpusSuggestionsCount: number;
    timestamp: string;
  };
  /** Tiered context mode info (only present when tiered mode is enabled) */
  tieredMode?: boolean;
  /** Token budget used (only present when tiered mode is enabled) */
  tokenBudget?: number;
  /** Statistics about tiered context compression */
  contextStats?: {
    tier1HotTokens: number;
    tier2WarmTokens: number;
    tier3ColdAvailable: boolean;
    totalTokens: number;
    compressionRatio: number;
  };
  /** Tier 1 hot context details (only present when tiered mode is enabled) */
  tier1Hot?: {
    currentSection: string;
    relevantArguments: Array<{
      id: string;
      statement: string;
      chapter: number;
      status: string;
    }>;
    immediateTerms: Record<string, string>;
  };
  /** Tier 2 warm context details (only present when tiered mode is enabled) */
  tier2Warm?: {
    chapterSummaries: Record<number, { title: string; keyPoints: string[] }>;
    thesisStatements: string[];
    criticalTerms: Record<string, string>;
  };
  /** Tier 3 cold accessor info (only present when tiered mode is enabled) */
  tier3ColdAccessor?: {
    type: 'InMemory' | 'AgentDB' | 'Hybrid';
    totalChunks: number;
    embeddingAvailable: boolean;
    bm25IndexSize?: number;
    retrievalMode?: 'hybrid' | 'semantic-only' | 'bm25-only';
  };

  // ========== PHASE 4: MULTI-SOURCE RETRIEVAL CONTEXT ==========

  /** Multi-source retrieval mode (only present when useMultiSourceRetrieval is enabled) */
  multiSourceMode?: boolean;

  /** Retrieved context chunks organized by collection */
  retrievedChunks?: {
    notes: ContextChunk[];
    theory: ContextChunk[];
    empirical: ContextChunk[];
    chapter: ContextChunk[];
  };

  /** Chapter context information (only present when loadChapterContext is enabled) */
  chapterContext?: {
    chapterNumber: number;
    chapterGoals: string[];
    keyTerminology: Record<string, string>;
    styleCharacteristics: string[];
    existingSections: Array<{ title: string; summary: string }>;
  };

  /** Statistics about multi-source retrieval */
  retrievalStats?: {
    notesCount: number;
    theoryCount: number;
    empiricalCount: number;
    chapterCount: number;
    totalChunks: number;
    avgRelevance: number;
    collections: string[];
  };
}

export interface SectionCompletionResult {
  /** Whether completion succeeded */
  success: boolean;
  /** Final section content */
  content?: string;
  /** Content with endnote markers (if endnotes enabled) */
  contentWithEndnotes?: string;
  /** Formatted endnotes section (if endnotes enabled) */
  endnotesSection?: string;
  /** Endnote generation result */
  endnoteResult?: EndnoteGenerationResult;
  /** Quality gauntlet result */
  qualityResult?: GauntletResult;
  /** Number of revision iterations */
  iterations: number;
  /** Context that was used */
  context: SectionContext;
  /** Error message if failed */
  error?: string;
  /** Remaining issues if quality threshold not met */
  remainingIssues?: string[];
}

// ============================================================================
// SectionOrchestrator Class
// ============================================================================

export class SectionOrchestrator {
  private projectRoot: string;
  private contextManager: DissertationContextManager;
  private styleInjector: StyleInjector;
  private styleManager: StyleProfileManager;
  private gauntlet: QualityGauntlet;
  private revisionOrchestrator: RevisionOrchestrator;
  private corpusConnector: CorpusCitationConnector;

  // Phase 4: Smart Retrieval Layer for multi-source retrieval
  private smartRetrieval: SmartRetrievalLayer;

  // New features from god-write integration
  private humanVerifier: HumanVerifier;
  private satisfactionTracker: SatisfactionTracker;
  private feedbackIntegration?: FeedbackIntegration;
  private provenanceLedger: ProvenanceLedger;
  private errorRecovery: ErrorRecoveryManager;

  // Endnote generation
  private endnoteGenerator?: EndnoteGenerator;

  // Tracking for session metadata
  private sessionId: string;
  private satisfactionRatings: Map<string, SatisfactionRating> = new Map();

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
    // Context manager needs sessionId and storagePath
    this.sessionId = `section-orchestrator-${Date.now()}`;
    const storagePath = path.join(this.projectRoot, '.god-agent');
    this.contextManager = new DissertationContextManager(this.sessionId, storagePath);
    this.styleInjector = new StyleInjector(this.projectRoot);
    this.styleManager = new StyleProfileManager(this.projectRoot);
    this.gauntlet = createDefaultGauntlet();
    this.revisionOrchestrator = createDefaultOrchestrator(this.gauntlet);
    this.corpusConnector = getCorpusCitationConnector(this.projectRoot);

    // Phase 4: Initialize Smart Retrieval Layer for multi-source corpus retrieval
    this.smartRetrieval = new SmartRetrievalLayer();

    // Initialize new features
    this.humanVerifier = createHumanVerifier();
    this.satisfactionTracker = createSatisfactionTracker(undefined, { enabled: false });
    this.provenanceLedger = new ProvenanceLedger();
    this.errorRecovery = createErrorRecoveryManager(this.projectRoot);
  }

  /**
   * Initialize - load persisted context
   */
  async initialize(): Promise<void> {
    // Initialize error recovery
    await this.errorRecovery.initialize();

    // Load context with error recovery
    await this.errorRecovery.withRetry(
      async () => {
        try {
          await this.contextManager.load();
        } catch (error) {
          // Context may not exist yet, that's fine
          console.error('[SectionOrchestrator] No existing context found, starting fresh');
        }
      },
      'context-initialization'
    );
  }

  /**
   * Phase 4: Load chapter context to extract existing goals/structure.
   * Helps maintain coherence by understanding what's already been written.
   */
  private async loadChapterContext(chapterNumber: number): Promise<SectionContext['chapterContext']> {
    try {
      // Extract chapter summary from context manager
      // Access chapters directly from context
      const allChapters = (this.contextManager as any).context.chapters;
      const currentChapterSummary = allChapters?.get(chapterNumber);

      if (!currentChapterSummary) {
        return undefined;
      }

      // Extract terminology from glossary relevant to this chapter
      const glossary = this.contextManager.getGlossaryTerms();
      const chapterTerms: Record<string, string> = {};

      // Filter glossary terms that were introduced or used in this chapter
      for (const term of Object.keys(glossary)) {
        const glossaryEntry = glossary[term];
        // Simple heuristic: if term appears in chapter summary, include it
        if (currentChapterSummary.summary?.includes(term)) {
          chapterTerms[term] = glossaryEntry.definition;
        }
      }

      // Extract existing sections from chapter summary
      const existingSections: Array<{ title: string; summary: string }> = [];
      // This would ideally come from stored chapter structure, but we'll use what's available
      if (currentChapterSummary.keyPoints) {
        existingSections.push(...currentChapterSummary.keyPoints.map((point: string) => ({
          title: point.split(':')[0] || point,
          summary: point,
        })));
      }

      return {
        chapterNumber,
        chapterGoals: currentChapterSummary.keyPoints || [],
        keyTerminology: chapterTerms,
        styleCharacteristics: [], // Could be extracted from style profile analysis
        existingSections,
      };
    } catch (error) {
      console.error('[SectionOrchestrator] Failed to load chapter context:', error);
      return undefined;
    }
  }

  /**
   * Phase 4: Perform multi-source corpus retrieval.
   * Retrieves context from notes, theory, empirical, and chapter collections.
   */
  private async performMultiSourceRetrieval(
    topic: string,
    config: {
      collections?: string[];
      chunksPerCollection?: number;
      minRelevance?: number;
    }
  ): Promise<{
    retrievedChunks: SectionContext['retrievedChunks'];
    stats: SectionContext['retrievalStats'];
  }> {
    const {
      collections = ['notes', 'theory', 'empirical'],
      chunksPerCollection = 10,
      minRelevance = 0.75,
    } = config;

    const retrievedChunks: SectionContext['retrievedChunks'] = {
      notes: [],
      theory: [],
      empirical: [],
      chapter: [],
    };

    let totalRelevance = 0;
    let totalChunks = 0;

    // Retrieve from each collection in parallel
    const retrievalPromises = collections.map(async (collection) => {
      try {
        const chunks = await this.smartRetrieval.retrieveContext(topic, {
          collections: [collection],
          maxChunks: chunksPerCollection,
          minRelevance,
          diversityBoost: true,
          rerank: true,
        });

        // Calculate average relevance for this collection
        chunks.forEach(chunk => {
          totalRelevance += chunk.relevanceScore;
          totalChunks++;
        });

        return { collection, chunks };
      } catch (error) {
        console.error(`[SectionOrchestrator] Failed to retrieve from ${collection}:`, error);
        return { collection, chunks: [] };
      }
    });

    const results = await Promise.all(retrievalPromises);

    // Organize results by collection
    results.forEach(({ collection, chunks }) => {
      if (collection === 'notes') {
        retrievedChunks.notes = chunks;
      } else if (collection === 'theory') {
        retrievedChunks.theory = chunks;
      } else if (collection === 'empirical') {
        retrievedChunks.empirical = chunks;
      } else if (collection === 'chapter') {
        retrievedChunks.chapter = chunks;
      }
    });

    const stats: SectionContext['retrievalStats'] = {
      notesCount: retrievedChunks.notes.length,
      theoryCount: retrievedChunks.theory.length,
      empiricalCount: retrievedChunks.empirical.length,
      chapterCount: retrievedChunks.chapter.length,
      totalChunks,
      avgRelevance: totalChunks > 0 ? totalRelevance / totalChunks : 0,
      collections,
    };

    return { retrievedChunks, stats };
  }

  /**
   * Build complete context for section generation
   */
  async buildSectionContext(config: SectionCompletionConfig): Promise<SectionContext> {
    const {
      chapter,
      section,
      targetWords = 2500,
      styleProfileId,
      useCorpus = true,
      contextOptions = {},
      useTieredContext = false,
      tokenBudget = 60000,
      useAgentDB = false,
    } = config;

    // 2. Get style prompt (needed for both modes)
    let stylePrompt = '';
    let activeProfileId: string | null = null;

    try {
      const activeProfile = this.styleManager.getActiveProfile();
      if (activeProfile) {
        activeProfileId = activeProfile.metadata.id;
        stylePrompt = this.styleManager.generateStylePrompt(activeProfile.metadata.id) || '';
      }
    } catch {
      // No active profile, use default
    }

    // Override with specified profile
    if (styleProfileId) {
      activeProfileId = styleProfileId;
      stylePrompt = this.styleManager.generateStylePrompt(styleProfileId) || stylePrompt;
    }

    // Branch based on tiered mode
    if (useTieredContext) {
      return this.buildTieredSectionContext({
        chapter,
        section,
        targetWords,
        stylePrompt,
        activeProfileId,
        tokenBudget,
        useAgentDB,
        useCorpus,
        promptStyle: config.promptStyle,
        useHybridRetrieval: config.useHybridRetrieval,
        retrievalMode: config.retrievalMode,
        bm25Config: config.bm25Config,
      });
    }

    // Standard mode: Build dissertation context
    const dissertationContext = this.contextManager.buildContextForChapter(
      chapter,
      {
        includeSummaries: true,
        includeThreadStatus: true,
        includeGlossary: true,
        includeForwardPromises: true,
        maxLength: 10000,
        ...contextOptions,
      }
    );

    // ========== PHASE 4: MULTI-SOURCE RETRIEVAL ==========

    // Load chapter context if requested
    let chapterContext: SectionContext['chapterContext'];
    if (config.loadChapterContext) {
      chapterContext = await this.loadChapterContext(chapter);
    }

    // Perform multi-source retrieval if enabled
    let retrievedChunks: SectionContext['retrievedChunks'];
    let retrievalStats: SectionContext['retrievalStats'];
    let multiSourceMode = false;

    if (config.useMultiSourceRetrieval) {
      multiSourceMode = true;
      const retrievalResult = await this.performMultiSourceRetrieval(
        `${section} ${this.contextManager.getMainThesis() || ''}`.trim(),
        {
          collections: config.corpusCollections,
          chunksPerCollection: config.chunksPerCollection,
          minRelevance: config.corpusMinRelevance,
        }
      );
      retrievedChunks = retrievalResult.retrievedChunks;
      retrievalStats = retrievalResult.stats;

      console.log(
        `[Phase 4] Multi-source retrieval complete: ${retrievalStats.totalChunks} chunks from ${retrievalStats.collections.length} collections`
      );
      console.log(
        `  - Notes: ${retrievalStats.notesCount}, Theory: ${retrievalStats.theoryCount}, Empirical: ${retrievalStats.empiricalCount}`
      );
    }

    // ========== ORIGINAL CORPUS RETRIEVAL (FALLBACK) ==========

    // Get corpus suggestions (legacy path - still available)
    let corpusSuggestions: CorpusSuggestion[] = [];
    if (useCorpus && !multiSourceMode) {
      try {
        corpusSuggestions = await this.corpusConnector.suggestSourcesForTopic(
          `${section} ${this.contextManager.getMainThesis() || ''}`.trim(),
          [] // No existing citations yet
        );
      } catch (error) {
        console.error('[SectionOrchestrator] Corpus query failed:', error);
      }
    }

    // Build generation prompt
    const generationPrompt = this.buildGenerationPrompt({
      chapter,
      section,
      targetWords,
      dissertationContext,
      stylePrompt,
      corpusSuggestions,
      promptStyle: config.promptStyle,
      // Phase 4: Include multi-source chunks
      retrievedChunks,
      chapterContext,
    });

    return {
      dissertationContext,
      stylePrompt,
      corpusSuggestions,
      generationPrompt,
      metadata: {
        chapter,
        section,
        contextLength: dissertationContext.length + stylePrompt.length,
        styleProfileId: activeProfileId,
        corpusSuggestionsCount: corpusSuggestions.length,
        timestamp: new Date().toISOString(),
      },
      // Phase 4: Include multi-source retrieval results
      multiSourceMode,
      retrievedChunks,
      chapterContext,
      retrievalStats,
    };
  }

  /**
   * Build tiered context for section generation (for large documents)
   */
  private async buildTieredSectionContext(params: {
    chapter: number;
    section: string;
    targetWords: number;
    stylePrompt: string;
    activeProfileId: string | null;
    tokenBudget: number;
    useAgentDB: boolean;
    useCorpus: boolean;
    promptStyle?: string;
    useHybridRetrieval?: boolean;
    retrievalMode?: 'hybrid' | 'semantic-only' | 'bm25-only';
    bm25Config?: {
      k1?: number;
      b?: number;
      persistencePath?: string;
    };
  }): Promise<SectionContext> {
    const {
      chapter,
      section,
      targetWords,
      stylePrompt,
      activeProfileId,
      tokenBudget,
      useAgentDB,
      useCorpus,
      promptStyle,
      useHybridRetrieval,
      retrievalMode,
      bm25Config,
    } = params;

    // Build tiered context using DissertationContextManager
    const tieredOptions: TieredContextBuildOptions = {
      tokenBudget,
      sectionName: section,
    };

    // If using AgentDB, create and configure the cold accessor
    let coldAccessorInfo: SectionContext['tier3ColdAccessor'];
    if (useAgentDB) {
      try {
        let accessor: ColdContextAccessor;

        if (useHybridRetrieval) {
          // Create hybrid accessor
          const { HybridColdContextAccessor } = await import('../context/hybrid-cold-accessor.js');
          const hybridAccessor = new HybridColdContextAccessor({
            agentDbConfig: {
              persistencePath: path.join(this.projectRoot, '.agentdb', 'dissertation-chunks.bin'),
              verbose: false,
            },
            bm25Config: {
              persistencePath: bm25Config?.persistencePath ||
                path.join(this.projectRoot, '.agentdb', 'bm25-index.json'),
              k1: bm25Config?.k1,
              b: bm25Config?.b,
            },
            initialMode: retrievalMode || 'hybrid',
            enableMetrics: true,
            verbose: false,
          });

          await hybridAccessor.initialize();

          // Auto-build BM25 index if needed
          await this.ensureBM25Index(hybridAccessor);

          accessor = hybridAccessor;

          const stats = hybridAccessor.getStats();
          coldAccessorInfo = {
            type: 'Hybrid',
            totalChunks: stats.agentdbChunkCount,
            embeddingAvailable: true,
            bm25IndexSize: stats.bm25IndexSize,
            retrievalMode: stats.currentMode,
          };
        } else {
          // Use standard semantic-only accessor (backward compat)
          const tieredManager = await createAgentDBTieredContextManager({
            tier1MaxTokens: Math.floor(tokenBudget * 0.7),
            tier2MaxTokens: Math.floor(tokenBudget * 0.25),
            agentDbConfig: {
              persistencePath: path.join(this.projectRoot, '.agentdb', 'dissertation-chunks.bin'),
              verbose: false,
            },
          });

          accessor = tieredManager.getColdAccessor();

          if (accessor instanceof AgentDBColdContextAccessor) {
            const stats = accessor.getStats();
            coldAccessorInfo = {
              type: 'AgentDB',
              totalChunks: stats.totalChunks,
              embeddingAvailable: stats.embeddingAvailable,
            };
          }
        }

        tieredOptions.coldAccessor = accessor;
      } catch (error) {
        console.error('[SectionOrchestrator] Cold accessor initialization failed, using in-memory:', error);
        coldAccessorInfo = {
          type: 'InMemory',
          totalChunks: 0,
          embeddingAvailable: false,
        };
      }
    } else {
      coldAccessorInfo = {
        type: 'InMemory',
        totalChunks: 0,
        embeddingAvailable: false,
      };
    }

    // Build the tiered context string
    const dissertationContext = await this.contextManager.buildTieredContextForChapter(
      chapter,
      tieredOptions
    );

    // Get the tiered context structure for detailed stats
    const tieredContext = await this.contextManager.getTieredContext(chapter, section, tieredOptions);

    // Calculate context stats
    const tier1HotTokens = tieredContext.tier1Hot.tokenCount;
    const tier2WarmTokens = tieredContext.tier2Warm.tokenCount;
    const totalTokens = tier1HotTokens + tier2WarmTokens;

    // Estimate original size for compression ratio
    const allChapterContexts = this.contextManager.getAllChapterContexts();
    let originalTokens = 0;
    for (const ctx of allChapterContexts) {
      originalTokens += Math.ceil(ctx.summary.length / 4);
      for (const arg of ctx.keyArguments) {
        originalTokens += Math.ceil(arg.statement.length / 4);
      }
    }
    const compressionRatio = originalTokens > 0 ? totalTokens / originalTokens : 1;

    // Get corpus suggestions (using semantic search if AgentDB is available)
    let corpusSuggestions: CorpusSuggestion[] = [];
    if (useCorpus) {
      try {
        // Try semantic search via cold accessor first
        if (coldAccessorInfo?.type === 'AgentDB' && tieredOptions.coldAccessor) {
          const searchResults = await tieredOptions.coldAccessor.search(
            `${section} ${this.contextManager.getMainThesis() || ''}`.trim(),
            5
          );
          // Convert search results to corpus suggestion format
          corpusSuggestions = searchResults.map((result, index) => ({
            author: 'Dissertation Corpus',
            title: result.source,
            year: undefined,
            relevanceScore: result.relevanceScore,
            relevantChunks: [{
              chunkId: `cold-${index}`,
              content: result.content,
              metadata: { pageStart: undefined, pageEnd: undefined },
            }],
          }));
        } else {
          // Fall back to standard corpus connector
          corpusSuggestions = await this.corpusConnector.suggestSourcesForTopic(
            `${section} ${this.contextManager.getMainThesis() || ''}`.trim(),
            []
          );
        }
      } catch (error) {
        console.error('[SectionOrchestrator] Corpus query failed:', error);
      }
    }

    // Build generation prompt with tiered context
    const generationPrompt = this.buildGenerationPrompt({
      chapter,
      section,
      targetWords,
      dissertationContext,
      stylePrompt,
      corpusSuggestions,
      promptStyle,
    });

    // Convert Maps to plain objects for JSON serialization
    const tier1HotData: SectionContext['tier1Hot'] = {
      currentSection: tieredContext.tier1Hot.currentSection,
      relevantArguments: tieredContext.tier1Hot.relevantArguments.map(arg => ({
        id: arg.id,
        statement: arg.statement,
        chapter: arg.chapter,
        status: arg.status,
      })),
      immediateTerms: Object.fromEntries(tieredContext.tier1Hot.immediateTerms),
    };

    const tier2WarmData: SectionContext['tier2Warm'] = {
      chapterSummaries: Object.fromEntries(
        Array.from(tieredContext.tier2Warm.chapterSummaries.entries()).map(([num, summary]) => [
          num,
          { title: summary.title, keyPoints: summary.keyPoints },
        ])
      ),
      thesisStatements: tieredContext.tier2Warm.thesisStatements,
      criticalTerms: Object.fromEntries(tieredContext.tier2Warm.criticalTerms),
    };

    return {
      dissertationContext,
      stylePrompt,
      corpusSuggestions,
      generationPrompt,
      metadata: {
        chapter,
        section,
        contextLength: dissertationContext.length + stylePrompt.length,
        styleProfileId: activeProfileId,
        corpusSuggestionsCount: corpusSuggestions.length,
        timestamp: new Date().toISOString(),
      },
      tieredMode: true,
      tokenBudget,
      contextStats: {
        tier1HotTokens,
        tier2WarmTokens,
        tier3ColdAvailable: coldAccessorInfo?.type === 'AgentDB',
        totalTokens,
        compressionRatio,
      },
      tier1Hot: tier1HotData,
      tier2Warm: tier2WarmData,
      tier3ColdAccessor: coldAccessorInfo,
    };
  }

  /**
   * Ensure BM25 index is populated with dissertation content
   *
   * Automatically builds the BM25 index from AgentDB if it's empty.
   */
  private async ensureBM25Index(accessor: any): Promise<void> {
    const stats = accessor.getStats();

    if (stats.bm25IndexSize === 0) {
      console.log('[SectionOrchestrator] Building BM25 index from AgentDB...');
      const startTime = Date.now();

      try {
        // Index all chunks from AgentDB into BM25
        await accessor.buildBM25IndexFromAgentDB();

        const duration = Date.now() - startTime;
        const newStats = accessor.getStats();
        console.log(
          `[SectionOrchestrator] BM25 index built in ${duration}ms (${newStats.bm25IndexSize} documents)`
        );
      } catch (error) {
        console.error('[SectionOrchestrator] Failed to build BM25 index:', error);
      }
    } else {
      console.log(`[SectionOrchestrator] BM25 index loaded (${stats.bm25IndexSize} documents)`);
    }
  }

  /**
   * Build the complete generation prompt
   */
  private buildGenerationPrompt(params: {
    chapter: number;
    section: string;
    targetWords: number;
    dissertationContext: string;
    stylePrompt: string;
    corpusSuggestions: CorpusSuggestion[];
    promptStyle?: string;
    // Phase 4: Multi-source retrieval
    retrievedChunks?: SectionContext['retrievedChunks'];
    chapterContext?: SectionContext['chapterContext'];
  }): string {
    const {
      chapter,
      section,
      targetWords,
      dissertationContext,
      stylePrompt,
      corpusSuggestions,
      promptStyle,
      retrievedChunks,
      chapterContext,
    } = params;

    // If prompt style is specified, use template
    if (promptStyle && promptStyle !== 'baseline') {
      const promptParams: PromptParams = {
        chapter,
        section,
        targetWords,
        dissertationContext,
        stylePrompt,
        corpusSuggestions,
      };
      return buildPromptWithStyle(promptStyle as PromptStyle, promptParams);
    }

    // Otherwise use baseline (original) prompt
    const sections: string[] = [];

    // Section requirements
    sections.push('# SECTION WRITING TASK');
    sections.push('');
    sections.push(`**Chapter:** ${chapter}`);
    sections.push(`**Section:** ${section}`);
    sections.push(`**Target Length:** ${targetWords} words`);
    sections.push('');

    // Dissertation context
    if (dissertationContext) {
      sections.push(dissertationContext);
      sections.push('');
    }

    // Style profile
    if (stylePrompt) {
      sections.push('# STYLE REQUIREMENTS');
      sections.push('');
      sections.push(stylePrompt);
      sections.push('');
    }

    // Corpus suggestions
    if (corpusSuggestions.length > 0) {
      sections.push('# SUGGESTED SOURCES FROM CORPUS');
      sections.push('');
      sections.push('The following sources from the project corpus are relevant to this section:');
      sections.push('');

      for (const suggestion of corpusSuggestions.slice(0, 5)) {
        sections.push(`## ${suggestion.author}${suggestion.year ? ` (${suggestion.year})` : ''}`);
        sections.push(`**Title:** ${suggestion.title}`);
        sections.push(`**Relevance Score:** ${Math.round(suggestion.relevanceScore * 100)}%`);
        sections.push('');

        if (suggestion.relevantChunks.length > 0) {
          sections.push('**Relevant excerpts:**');
          for (const chunk of suggestion.relevantChunks.slice(0, 2)) {
            const excerpt = chunk.content.substring(0, 300).trim();
            sections.push(`> ${excerpt}...`);
            if (chunk.metadata.pageStart) {
              sections.push(`> (p. ${chunk.metadata.pageStart}${chunk.metadata.pageEnd ? `-${chunk.metadata.pageEnd}` : ''})`);
            }
            sections.push('');
          }
        }
        sections.push('');
      }
    }

    // ========== PHASE 4: MULTI-SOURCE RETRIEVED CHUNKS ==========
    if (retrievedChunks) {
      const hasNotes = retrievedChunks.notes.length > 0;
      const hasTheory = retrievedChunks.theory.length > 0;
      const hasEmpirical = retrievedChunks.empirical.length > 0;
      const hasChapter = retrievedChunks.chapter.length > 0;

      if (hasNotes || hasTheory || hasEmpirical || hasChapter) {
        sections.push('# MULTI-SOURCE CORPUS CONTEXT');
        sections.push('');
        sections.push('The following context has been retrieved from multiple corpus collections:');
        sections.push('');

        // Notes collection
        if (hasNotes) {
          sections.push('## Research Notes');
          sections.push('');
          for (const chunk of retrievedChunks.notes.slice(0, 5)) {
            const excerpt = chunk.content.substring(0, 250).trim();
            sections.push(`> ${excerpt}...`);
            sections.push(`> **Source:** ${chunk.metadata.author || 'Unknown'} (Relevance: ${Math.round(chunk.relevanceScore * 100)}%)`);
            sections.push('');
          }
        }

        // Theory collection
        if (hasTheory) {
          sections.push('## Theoretical Framework');
          sections.push('');
          for (const chunk of retrievedChunks.theory.slice(0, 5)) {
            const excerpt = chunk.content.substring(0, 250).trim();
            sections.push(`> ${excerpt}...`);
            const citation = `${chunk.metadata.author} (${chunk.metadata.year})${chunk.metadata.page_start ? `, p.${chunk.metadata.page_start}` : ''}`;
            sections.push(`> **Citation:** ${citation} (Relevance: ${Math.round(chunk.relevanceScore * 100)}%)`);
            sections.push('');
          }
        }

        // Empirical collection
        if (hasEmpirical) {
          sections.push('## Empirical Evidence');
          sections.push('');
          for (const chunk of retrievedChunks.empirical.slice(0, 5)) {
            const excerpt = chunk.content.substring(0, 250).trim();
            sections.push(`> ${excerpt}...`);
            sections.push(`> **Source:** ${chunk.metadata.author || 'Case Study'} (Relevance: ${Math.round(chunk.relevanceScore * 100)}%)`);
            sections.push('');
          }
        }

        // Chapter collection
        if (hasChapter) {
          sections.push('## Related Chapter Content');
          sections.push('');
          for (const chunk of retrievedChunks.chapter.slice(0, 3)) {
            const excerpt = chunk.content.substring(0, 250).trim();
            sections.push(`> ${excerpt}...`);
            sections.push(`> **From:** Chapter ${chunk.metadata.chapter || '?'}`);
            sections.push('');
          }
        }
      }
    }

    // ========== PHASE 4: CHAPTER CONTEXT ==========
    if (chapterContext) {
      sections.push('# CHAPTER CONTEXT');
      sections.push('');
      sections.push(`This section belongs to Chapter ${chapterContext.chapterNumber}.`);
      sections.push('');

      if (chapterContext.chapterGoals.length > 0) {
        sections.push('**Chapter Goals:**');
        chapterContext.chapterGoals.forEach(goal => {
          sections.push(`- ${goal}`);
        });
        sections.push('');
      }

      if (Object.keys(chapterContext.keyTerminology).length > 0) {
        sections.push('**Key Terminology (to maintain consistency):**');
        Object.entries(chapterContext.keyTerminology).forEach(([term, definition]) => {
          sections.push(`- **${term}:** ${definition}`);
        });
        sections.push('');
      }

      if (chapterContext.existingSections.length > 0) {
        sections.push('**Existing Sections:**');
        chapterContext.existingSections.forEach(sec => {
          sections.push(`- ${sec.title}`);
        });
        sections.push('');
      }
    }

    // Writing instructions
    sections.push('# WRITING INSTRUCTIONS');
    sections.push('');
    sections.push('1. Write a scholarly section that advances the dissertation argument');
    sections.push('2. Integrate sources using proper academic citation (APA format)');
    sections.push('3. Maintain consistency with prior chapters (see context above)');
    sections.push('4. Follow the style profile strictly for voice and tone');
    sections.push('5. Define any new technical terms clearly');
    sections.push('6. Connect to the main thesis and relevant sub-theses');
    sections.push('7. Use transitions that link to prior and following sections');

    // Phase 4: Add coherence instruction
    if (chapterContext) {
      sections.push('8. Maintain terminological and stylistic coherence with existing chapter sections');
      sections.push('9. Build upon the chapter goals and arguments from prior sections');
    }

    sections.push('');
    sections.push('Output the complete section content only, without meta-commentary.');

    return sections.join('\n');
  }

  /**
   * Validate section content against quality gauntlet
   * Now includes corpus-only citation validation (Priority 1)
   */
  async validateSection(
    content: string,
    chapter: number,
    options?: {
      allowExternal?: boolean;
      corpusChunks?: any[];
      corpusSources?: string[];
    }
  ): Promise<GauntletResult & { corpusValidation?: CorpusValidationReport }> {
    // First, run corpus validation (corpus-only by default)
    const allowExternal = options?.allowExternal ?? false;

    await corpusValidator.initialize();
    const corpusReport = await corpusValidator.validateAllCitations(content);

    // Run the quality gauntlet
    const gauntletResult = await this.gauntlet.runGauntlet(content, chapter, {
      corpusChunks: options?.corpusChunks ?? [],
      corpusSources: options?.corpusSources ?? [],
      knownAuthors: (options?.corpusSources ?? []).map(s => s.split(' (')[0]),
    });

    // If corpus validation fails and external not allowed, add critical issues
    if (!allowExternal && corpusReport.invalidCitations > 0) {
      const corpusIssues = corpusReport.invalid.map((inv, idx) => ({
        id: `corpus-validation_${idx}`,
        type: 'citation' as const,
        severity: 'critical' as const,
        description: `Citation "${inv.citation}" not found in corpus`,
        suggestion: inv.similarSources.length > 0
          ? `Did you mean: ${inv.similarSources.map(s => `${s.author} (${s.year})`).join(' or ')}?`
          : 'Verify source exists in corpus or use --allow-external flag',
        location: {
          paragraphIndex: 0,
          lineNumber: inv.location.lineNumber,
        },
        contextSnippet: inv.location.excerpt,
        autoFixable: false,
        confidence: 1.0,
      }));

      // Add corpus issues to gauntlet result
      gauntletResult.allIssues = [...corpusIssues, ...gauntletResult.allIssues];
      gauntletResult.criticalIssues = [
        ...corpusIssues,
        ...gauntletResult.criticalIssues,
      ];

      // Fail if any corpus issues
      gauntletResult.passed = false;
      gauntletResult.revisionRequired = true;
      gauntletResult.revisionGuidance =
        `CORPUS VALIDATION FAILED: ${corpusReport.invalidCitations} citations not found in corpus.\n\n` +
        corpusReport.suggestions.join('\n') +
        '\n\n' + (gauntletResult.revisionGuidance || '');
    }

    return {
      ...gauntletResult,
      corpusValidation: corpusReport,
    };
  }

  /**
   * Run complete section generation with quality refinement
   *
   * Note: This method builds the context and prompt but does NOT execute
   * the actual generation (that requires Claude Task spawning from the command).
   * It's used for context preparation and post-generation validation.
   */
  async prepareForGeneration(
    config: SectionCompletionConfig
  ): Promise<SectionContext> {
    await this.initialize();
    return this.buildSectionContext(config);
  }

  /**
   * Validate and optionally trigger refinement
   */
  async validateAndRefine(
    content: string,
    config: SectionCompletionConfig,
    revisionCallback: (request: RevisionRequest) => Promise<string>
  ): Promise<RefinementResult> {
    const {
      chapter,
      maxIterations = 3,
      qualityThreshold = 0.85,
      enableHumanVerification = false,
      humanVerificationOptions,
    } = config;

    // Configure human verification if enabled
    if (enableHumanVerification && humanVerificationOptions) {
      this.humanVerifier.updateOptions(humanVerificationOptions);
    }

    // Configure revision orchestrator
    const customGauntlet = createDefaultGauntlet();
    const orchestrator = createDefaultOrchestrator(customGauntlet);

    // Add human verification callback if enabled
    if (enableHumanVerification) {
      // Wrap the revision callback with human verification
      const wrappedCallback = async (request: RevisionRequest): Promise<string> => {
        // Check if we should prompt for verification
        const iteration = 0; // This would need to be tracked by orchestrator
        const currentScore = request.gauntletResult?.overallScore ?? 0;

        if (this.humanVerifier.shouldPrompt(iteration, currentScore, qualityThreshold)) {
          const reviewContext: ReviewContext = {
            iteration,
            maxIterations,
            currentScore,
            targetThreshold: qualityThreshold,
            previousScore: undefined,
            gauntletResult: request.gauntletResult!,
            content: request.currentText,
          };

          const decision = await this.humanVerifier.promptReview(reviewContext);

          switch (decision.action) {
            case 'accept':
              // Return current text as-is to signal acceptance
              return request.currentText;
            case 'abort':
              throw new Error('Revision process aborted by user');
            case 'guidance':
              // Add custom guidance to revision prompt
              if (decision.customGuidance) {
                request.revisionGuidance += '\n\nUser Guidance:\n' + decision.customGuidance;
              }
              break;
            case 'skip':
              // Skip specific issues (would need orchestrator support)
              console.log('Skipping issues:', decision.skipIssueIds);
              break;
            case 'continue':
            default:
              // Continue with normal revision
              break;
          }
        }

        // Execute the actual revision
        return revisionCallback(request);
      };

      return orchestrator.refineUntilQuality(
        content,
        chapter,
        wrappedCallback,
        undefined // context
      );
    }

    // Standard flow without human verification
    return orchestrator.refineUntilQuality(
      content,
      chapter,
      revisionCallback,
      undefined // context
    );
  }

  /**
   * Update dissertation context after successful section completion
   */
  async updateContextAfterCompletion(
    chapter: number,
    section: string,
    content: string
  ): Promise<void> {
    // Extract and record key information from completed section
    // This is a simplified version - could be enhanced with NLP

    // Record chapter context (matches ChapterContext interface)
    this.contextManager.recordChapterContext({
      chapterId: chapter,
      chapterTitle: section,
      keyArguments: this.extractKeyArguments(content),
      definedTerms: this.extractDefinedTerms(content),
      forwardReferences: [],
      backwardReferences: [],
      themes: this.extractThemes(content),
      summary: this.extractSummary(content),
      extractedAt: Date.now(),
    });

    // Save context
    await this.contextManager.save();
  }

  // ============================================================================
  // NEW FEATURES: Satisfaction Tracking, Feedback Learning, Provenance
  // ============================================================================

  /**
   * Enable feedback learning integration
   */
  async enableFeedbackLearning(): Promise<void> {
    const styleProfile = this.styleManager.getActiveProfile();
    if (!styleProfile) {
      throw new Error('No active style profile found for feedback learning');
    }

    this.feedbackIntegration = new FeedbackIntegration(
      styleProfile.deepStyle,
      this.styleManager,
      path.join(this.projectRoot, '.god-agent', 'feedback'),
      styleProfile.metadata.id
    );

    await this.feedbackIntegration.initialize(this.sessionId);
  }

  /**
   * Collect satisfaction rating for a completed section
   */
  async collectSatisfactionRating(
    trajectoryId: string,
    content: string
  ): Promise<SatisfactionRating | undefined> {
    const rating = await this.satisfactionTracker.collectRating(trajectoryId, content);
    if (rating) {
      this.satisfactionRatings.set(trajectoryId, rating);
    }
    return rating;
  }

  /**
   * Capture paragraph-level feedback for learning
   */
  async captureSectionFeedback(
    chapterId: number,
    section: string,
    content: string,
    feedback: {
      soundsLikeMe: boolean;
      corrections?: Array<{
        paragraphIndex: number;
        original: string;
        corrected: string;
      }>;
      styleIssues?: Array<{
        paragraphIndex: number;
        issue: string;
      }>;
    }
  ): Promise<void> {
    if (!this.feedbackIntegration) {
      await this.enableFeedbackLearning();
    }

    const paragraphs = content.split(/\n\n+/);

    for (let i = 0; i < paragraphs.length; i++) {
      const correction = feedback.corrections?.find(c => c.paragraphIndex === i);
      const issues = feedback.styleIssues?.filter(si => si.paragraphIndex === i);

      if (correction || issues || !feedback.soundsLikeMe) {
        const feedbackInput: FeedbackInput = {
          soundsLikeMe: feedback.soundsLikeMe,
          correction: correction?.corrected,
          issues: issues?.map(i => ({
            type: 'style-mismatch' as const,
            description: i.issue,
            severity: 'medium' as const,
          })),
        };

        await this.feedbackIntegration!.captureFeedback(
          chapterId,
          i,
          paragraphs[i],
          feedbackInput
        );
      }
    }

    // Process accumulated feedback
    const result = await this.feedbackIntegration!.processPendingFeedback();
    console.log(`Processed ${result.feedbackProcessed} feedback items, learned ${result.patternsLearned} patterns`);
  }

  /**
   * Track provenance for claims in the section
   */
  async trackProvenance(
    content: string,
    chapterId: number,
    corpusSuggestions: CorpusSuggestion[]
  ): Promise<void> {
    // Detect claims in content
    const claims = this.provenanceLedger.detectClaims(content);

    // Link claims to sources
    for (const claim of claims) {
      // Try to find source in corpus suggestions
      const source = this.findSourceForClaim(claim, corpusSuggestions);

      this.provenanceLedger.addEntry({
        claimText: claim.text,
        chapterId,
        paragraphIndex: claim.paragraphIndex,
        sourceType: source ? 'local_chunk' : 'ungrounded',
        sourceId: source?.sourceId || 'unknown',
        sourceReference: source?.citation || '',
        confidence: source?.confidence || 0,
        verified: false,
      });
    }
  }

  /**
   * Validate provenance for a chapter
   */
  async validateProvenance(chapterId: number): Promise<ProvenanceValidation> {
    const validation = this.provenanceLedger.validateProvenance();

    if (!validation.valid) {
      console.warn(`Provenance issues in Chapter ${chapterId}:`);
      console.warn(`- Ungrounded claims: ${validation.ungroundedClaims.length}`);
      console.warn(`- Weakly grounded: ${validation.weaklyGroundedClaims.length}`);
    }

    return validation;
  }

  /**
   * Find source for a detected claim
   */
  private findSourceForClaim(
    claim: DetectedClaim,
    corpusSuggestions: CorpusSuggestion[]
  ): { sourceId: string; citation: string; confidence: number } | undefined {
    // Simple heuristic: find corpus suggestion with highest overlap
    let bestMatch: { sourceId: string; citation: string; confidence: number } | undefined;
    let bestScore = 0;

    for (const suggestion of corpusSuggestions) {
      for (const chunk of suggestion.relevantChunks) {
        const overlap = this.calculateTextOverlap(claim.text, chunk.content);
        if (overlap > bestScore && overlap > 0.3) {
          bestScore = overlap;
          bestMatch = {
            sourceId: chunk.chunkId,
            citation: `${suggestion.author}${suggestion.year ? ` (${suggestion.year})` : ''}`,
            confidence: overlap,
          };
        }
      }
    }

    return bestMatch;
  }

  /**
   * Calculate text overlap between claim and source
   */
  private calculateTextOverlap(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return union > 0 ? intersection / union : 0;
  }

  /**
   * Get satisfaction statistics
   */
  getSatisfactionStatistics(): {
    totalRatings: number;
    averageOverall: number;
    averageStyleMatch: number;
    averageQuality: number;
    useAsIsPercentage: number;
  } {
    const stats = this.satisfactionTracker.getStatistics();
    return {
      totalRatings: stats.totalRatings,
      averageOverall: stats.avgOverallScore,
      averageStyleMatch: stats.avgStyleMatchScore,
      averageQuality: stats.avgQualityScore,
      useAsIsPercentage: stats.useAsIsPercentage,
    };
  }

  /**
   * Get feedback learning statistics
   */
  getFeedbackStats(): {
    totalFeedback: number;
    processedCount: number;
    soundsLikeMeRatio: number;
    patternsLearned: number;
  } | undefined {
    return this.feedbackIntegration?.getStats();
  }

  /**
   * Get provenance report
   */
  getProvenanceReport(): string {
    return this.provenanceLedger.generateAuditReport();
  }

  // ============================================================================
  // ERROR RECOVERY METHODS
  // ============================================================================

  /**
   * Save checkpoint for current state
   */
  async saveCheckpoint(
    chapter: number,
    section: string,
    iteration: number,
    currentContent: string,
    context: SectionContext,
    gauntletResult?: GauntletResult
  ): Promise<void> {
    const checkpoint: SectionCheckpoint = {
      id: `checkpoint-${Date.now()}`,
      chapter,
      section,
      iteration,
      currentContent,
      context,
      gauntletResult,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
    };

    await this.errorRecovery.saveCheckpoint(checkpoint);
  }

  /**
   * Resume from checkpoint
   */
  async resumeFromCheckpoint(
    chapter: number,
    section: string
  ): Promise<SectionCheckpoint | null> {
    return this.errorRecovery.resumeFromCheckpoint(chapter, section, this.sessionId);
  }

  /**
   * List checkpoints for a chapter
   */
  async listCheckpoints(chapter: number): Promise<SectionCheckpoint[]> {
    return this.errorRecovery.listCheckpoints(chapter);
  }

  /**
   * Execute operation with retry logic
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    return this.errorRecovery.withRetry(operation, context);
  }

  /**
   * Get error recovery statistics
   */
  getErrorStats(): ReturnType<ErrorRecoveryManager['getErrorStats']> {
    return this.errorRecovery.getErrorStats();
  }

  /**
   * Generate error report
   */
  generateErrorReport(): string {
    return this.errorRecovery.generateErrorReport();
  }

  // Helper methods for content extraction

  private extractSummary(content: string): string {
    // Simple extraction: first paragraph or first 500 chars
    const paragraphs = content.split(/\n\n+/);
    return paragraphs[0]?.substring(0, 500) || '';
  }

  private extractKeyArguments(content: string): Array<{
    id: string;
    statement: string;
    type: 'introduced' | 'developed' | 'concluded';
    supportingEvidence: string[];
  }> {
    // Simple extraction: sentences starting with claim markers
    const claimMarkers = /(?:^|\. )(?:This (?:section|chapter|argument)|I argue|The (?:main|key|central) (?:point|argument|claim))[^.]+\./gi;
    const matches = content.match(claimMarkers) || [];
    return matches.slice(0, 5).map((m, i) => ({
      id: `arg_${i + 1}`,
      statement: m.trim(),
      type: 'introduced' as const,
      supportingEvidence: [],
    }));
  }

  private extractDefinedTerms(content: string): Array<{
    term: string;
    definition: string;
    firstMentionParagraph: number;
  }> {
    // Simple extraction: quoted terms or italicized terms
    const terms: Array<{ term: string; definition: string; firstMentionParagraph: number }> = [];
    const paragraphs = content.split(/\n\n+/);

    // Quoted terms with potential definitions
    const definitionPattern = /"([^"]+)"\s*(?:is|refers to|means|denotes)\s+([^.]+)\./gi;
    let match: RegExpExecArray | null;
    while ((match = definitionPattern.exec(content)) !== null) {
      const termText = match[1];
      const termParagraph = paragraphs.findIndex(p => p.includes(termText));
      terms.push({
        term: termText,
        definition: match[2].trim(),
        firstMentionParagraph: termParagraph >= 0 ? termParagraph : 0,
      });
    }

    return terms.slice(0, 10);
  }

  private extractThemes(content: string): string[] {
    // Simple extraction: look for section headers and key topic words
    const themes: string[] = [];

    // Markdown headers
    const headers = content.match(/^#+\s+(.+)$/gm) || [];
    themes.push(...headers.map(h => h.replace(/^#+\s+/, '')));

    return Array.from(new Set(themes)).slice(0, 10);
  }

  private extractCitations(content: string): string[] {
    // APA-style citations
    const citations = content.match(/\([A-Z][a-z]+(?:\s+(?:and|&)\s+[A-Z][a-z]+)*,\s*\d{4}[a-z]?(?:,\s*p+\.\s*[\d-]+)?\)/g) || [];
    return Array.from(new Set(citations));
  }

  /**
   * Generate endnotes with supporting quotations from corpus
   *
   * @param content - Generated section content
   * @param config - Optional endnote configuration
   */
  async generateEndnotes(
    content: string,
    config?: Partial<EndnoteGeneratorConfig>
  ): Promise<EndnoteGenerationResult> {
    // Initialize endnote generator if not already done
    if (!this.endnoteGenerator) {
      this.endnoteGenerator = createEndnoteGenerator(config);
    }

    // Create corpus search function using the smart retrieval layer
    const corpusSearch: CorpusSearchFn = async (query: string, limit: number) => {
      try {
        const results = await this.smartRetrieval.retrieveContext(query, {
          collections: ['notes', 'theory', 'empirical'],
          maxChunks: limit,
          minRelevance: config?.minRelevanceThreshold || 0.65,
        });

        return results.map(r => ({
          id: r.chunkId || `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          text: r.text,
          metadata: {
            author: r.source?.split(' - ')[0] || 'Unknown',
            title: r.source?.split(' - ')[1] || r.source || 'Unknown',
            year: undefined, // Extract from source if available
            pageRef: undefined,
            docId: r.docId,
          },
          score: r.relevanceScore,
        }));
      } catch (error) {
        console.error('[EndnoteGenerator] Corpus search failed:', error);
        return [];
      }
    };

    // Generate endnotes
    const result = await this.endnoteGenerator.generateEndnotes(
      content,
      corpusSearch,
      this.provenanceLedger
    );

    return result;
  }

  /**
   * Apply endnotes to generated content
   *
   * @param content - Original generated content
   * @param endnoteResult - Result from generateEndnotes
   * @returns Content with endnote markers and endnotes section appended
   */
  applyEndnotes(content: string, endnoteResult: EndnoteGenerationResult): string {
    // Return content with markers and endnotes section appended
    return endnoteResult.contentWithMarkers + '\n' + endnoteResult.endnotesSection;
  }

  /**
   * Get corpus statistics
   */
  getCorpusStats(): { totalDocuments: number; totalChunks: number; authors: string[] } {
    return this.corpusConnector.getCorpusStats();
  }

  /**
   * Get dissertation context summary
   */
  getContextSummary(): {
    title: string;
    mainThesis: string | null;
    chaptersWithContext: number[];
    totalThreads: number;
    glossaryTermCount: number;
  } {
    return {
      title: this.contextManager.getTitle(),
      mainThesis: this.contextManager.getMainThesis() || null,
      chaptersWithContext: this.contextManager.getChaptersWithContext(),
      totalThreads: this.contextManager.getActiveThreads().length,
      glossaryTermCount: this.contextManager.getGlossaryTerms().length,
    };
  }

  /**
   * Check if tiered context is recommended based on current document size
   */
  checkTieredRecommendation(): {
    recommended: boolean;
    estimatedTokens: number;
    reason: string;
  } {
    const shouldUseTiered = this.contextManager.shouldUseTieredContext();

    // Estimate tokens more precisely
    let totalChars = 0;
    const allContexts = this.contextManager.getAllChapterContexts();

    for (const ctx of allContexts) {
      totalChars += ctx.summary.length;
      for (const arg of ctx.keyArguments) {
        totalChars += arg.statement.length;
        for (const ev of arg.supportingEvidence) {
          totalChars += ev.length;
        }
      }
      for (const term of ctx.definedTerms) {
        totalChars += term.term.length + term.definition.length;
      }
    }

    // Add thesis and glossary
    const mainThesis = this.contextManager.getMainThesis();
    if (mainThesis) {
      totalChars += mainThesis.length;
    }

    for (const term of this.contextManager.getGlossaryTerms()) {
      totalChars += term.term.length + term.definition.length;
    }

    const estimatedTokens = Math.ceil(totalChars / 4);

    let reason: string;
    if (shouldUseTiered) {
      if (estimatedTokens > 50000) {
        reason = 'Large dissertation (>50k tokens). Tiered context strongly recommended with AgentDB.';
      } else {
        reason = 'Medium dissertation (>30k tokens). Tiered context recommended for better context management.';
      }
    } else {
      if (estimatedTokens < 10000) {
        reason = 'Small dissertation (<10k tokens). Standard context is sufficient.';
      } else {
        reason = 'Moderate dissertation size. Standard context works, tiered is optional.';
      }
    }

    return {
      recommended: shouldUseTiered,
      estimatedTokens,
      reason,
    };
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    return;
  }

  const command = args[0];

  switch (command) {
    case 'prepare':
    case 'complete':
      await handlePrepare(args.slice(1));
      break;
    case 'validate':
      await handleValidate(args.slice(1));
      break;
    case 'update-context':
      await handleUpdateContext(args.slice(1));
      break;
    case 'feedback':
      await handleFeedback(args.slice(1));
      break;
    case 'rate':
      await handleRate(args.slice(1));
      break;
    case 'stats':
      await handleStats(args.slice(1));
      break;
    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      process.exit(1);
  }
}

function printUsage(): void {
  console.log(`
SectionOrchestrator CLI - Dissertation section completion orchestration

USAGE:
  npx tsx section-orchestrator.ts <command> [options]

COMMANDS:
  prepare         Build context and generation prompt for a section
  complete        Alias for prepare (actual generation done via Task)
  validate        Validate section content against quality gauntlet
  update-context  Update dissertation context after completion
  feedback        Capture paragraph-level feedback for learning
  rate            Record satisfaction rating for a section
  stats           Show corpus and context statistics

STANDARD OPTIONS:
  --chapter <n>     Chapter number (required for prepare/validate)
  --section <name>  Section name/topic (required for prepare)
  --content <path>  Path to content file (for validate/update-context)
  --length <words>  Target word count (default: 2500)
  --style <id>      Style profile ID to use
  --json            Output as JSON

TIERED CONTEXT OPTIONS (for large documents):
  --tiered            Enable tiered context compression (Hot/Warm/Cold tiers)
  --token-budget <n>  Maximum tokens for context (default: 60000, requires --tiered)
  --use-agentdb       Use AgentDB for cold tier semantic search (requires --tiered)

HYBRID RETRIEVAL OPTIONS (Phase 1 - BM25 + Semantic Search):
  --hybrid-retrieval          Enable hybrid BM25 + semantic search (requires --use-agentdb)
  --retrieval-mode <mode>     Retrieval strategy: hybrid, semantic-only, bm25-only (default: hybrid)
  --bm25-k1 <float>           BM25 term frequency saturation parameter (default: 1.5)
  --bm25-b <float>            BM25 length normalization parameter (default: 0.75)

QUALITY ENHANCEMENT OPTIONS (from god-write integration):
  --interactive           Enable human verification between revision iterations
  --auto-accept-after <n> Auto-accept after N iterations (default: never)
  --enable-satisfaction   Enable satisfaction tracking after completion
  --enable-feedback       Enable feedback learning integration
  --enable-provenance     Enable provenance ledger for claim tracking

ENDNOTE GENERATION OPTIONS:
  --enable-endnotes              Generate endnotes with supporting quotations from corpus
  --max-quotations-per-endnote   Max supporting quotations per endnote (default: 3)
  --min-endnote-relevance        Minimum relevance threshold for quotations (default: 0.65)

PROMPT TESTING OPTIONS (for evaluating different prompt styles):
  --prompt-style <style>  Prompt variation: baseline, concise, example-driven,
                          conversational, constraint-heavy, minimal, question-based, iterative
  --use-local-model       Use local vLLM model (port 8002) instead of Claude API
  --vllm-url <url>        vLLM base URL (default: http://localhost:8002)

AUTONOMOUS RETRIEVAL OPTIONS (Phase 3 - LLM calls tools during generation):
  --autonomous-retrieval         Enable autonomous retrieval (replaces manual context loading)
  --llm-client <client>          LLM to use: claude, openai, vllm, auto (default: auto)
  --max-retrieval-rounds <n>     Max retrieval rounds (default: 5)
  --autonomous-context-tokens <n> Max context tokens (default: 180000)

STATS OPTIONS:
  --check-tiered      Check if tiered context is recommended for current document

EXAMPLES:
  # Standard mode
  npx tsx section-orchestrator.ts prepare --chapter 3 --section "Phantasia in De Anima III" --json

  # With interactive verification
  npx tsx section-orchestrator.ts prepare --chapter 3 --section "Phantasia" --interactive --json

  # Tiered mode with all quality features
  npx tsx section-orchestrator.ts complete --chapter 5 --section "Practical Reasoning" \\
    --tiered --token-budget 80000 --use-agentdb \\
    --interactive --enable-satisfaction --enable-feedback --enable-provenance --json

  # Phase 1: Hybrid retrieval (BM25 + Semantic)
  npx tsx section-orchestrator.ts complete --chapter 3 --section "Phantasia in De Anima III" \\
    --tiered --use-agentdb --hybrid-retrieval --json

  # Hybrid retrieval with custom BM25 parameters
  npx tsx section-orchestrator.ts complete --chapter 3 --section "Phantasia" \\
    --tiered --use-agentdb --hybrid-retrieval --retrieval-mode hybrid \\
    --bm25-k1 1.5 --bm25-b 0.75 --json

  # Phase 3: Autonomous retrieval with Claude
  npx tsx section-orchestrator.ts complete --chapter 3 --section "Temporal Synthesis" \\
    --autonomous-retrieval --llm-client claude --tiered --use-agentdb --json

  # Autonomous retrieval with local vLLM (zero cost)
  npx tsx section-orchestrator.ts complete --chapter 3 --section "Phantasia" \\
    --autonomous-retrieval --llm-client vllm --tiered --use-agentdb --json

  # Validate content
  npx tsx section-orchestrator.ts validate --chapter 3 --content ./output.md --json

  # Capture feedback
  npx tsx section-orchestrator.ts feedback --chapter 3 --section "Phantasia" \\
    --content ./output.md --correction-file ./corrections.json --json

  # Rate section
  npx tsx section-orchestrator.ts rate --chapter 3 --section "Phantasia" \\
    --overall 8 --style 9 --quality 8 --would-use true --json

  # Check if tiered context is recommended
  npx tsx section-orchestrator.ts stats --check-tiered
`);
}

/**
 * Execute autonomous generation with retrieval
 */
async function executeAutonomousGeneration(
  context: SectionContext,
  values: Record<string, unknown>
): Promise<void> {
  // Import autonomous retrieval components
  const {
    RetrievalOrchestrator,
    createClaudeClient,
    createOpenAIClient,
    createVLLMClient,
    createAutoClient,
  } = await import('./tools/index.js');

  // Build tiered context if available
  let tieredContext;
  if (context.tieredMode && context.tier1Hot && context.tier2Warm && context.tier3ColdAccessor) {
    tieredContext = {
      tier1Hot: context.tier1Hot,
      tier2Warm: context.tier2Warm,
      tier3ColdAccessor: context.tier3ColdAccessor,
    };
  } else {
    console.error('Error: Autonomous retrieval requires --tiered and --use-agentdb flags');
    process.exit(1);
  }

  // Create orchestrator
  const maxRetrievalRounds = values['max-retrieval-rounds']
    ? parseInt(values['max-retrieval-rounds'] as string, 10)
    : 5;
  const maxContextTokens = values['autonomous-context-tokens']
    ? parseInt(values['autonomous-context-tokens'] as string, 10)
    : 180000;

  const orchestrator = new RetrievalOrchestrator(tieredContext, {
    maxRetrievalRounds,
    maxContextTokens,
    maxOutputTokens: 12000, // Increased for multiple retrieval rounds
  });

  // Create LLM client
  const llmClientType = (values['llm-client'] as string) || 'auto';
  let llmClient;

  switch (llmClientType) {
    case 'claude':
      llmClient = createClaudeClient();
      break;
    case 'openai':
      llmClient = createOpenAIClient();
      break;
    case 'vllm':
      const vllmUrl = (values['vllm-url'] as string) || 'http://localhost:8002';
      llmClient = createVLLMClient(vllmUrl);
      break;
    case 'auto':
    default:
      llmClient = createAutoClient();
      break;
  }

  // Execute generation with retrieval
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Autonomous Retrieval Generation                      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  console.log(`Chapter: ${context.metadata.chapter}`);
  console.log(`Section: ${context.metadata.section}`);
  console.log(`LLM Client: ${llmClientType}`);
  console.log(`Max Rounds: ${maxRetrievalRounds}`);
  console.log(`Max Context Tokens: ${maxContextTokens.toLocaleString()}\n`);

  const startTime = Date.now();

  try {
    const result = await orchestrator.generateWithRetrieval(
      context.generationPrompt,
      llmClient,
      {
        maxTokens: 12000, // Increased to accommodate tool calls + content
        temperature: 0.7,
      }
    );

    const duration = Date.now() - startTime;

    // Generate endnotes if enabled
    let endnoteResult;
    if (values['enable-endnotes'] && result.success && result.content) {
      try {
        const orchestratorInstance = new SectionOrchestrator();
        await orchestratorInstance.initialize();
        endnoteResult = await orchestratorInstance.generateEndnotes(result.content, context.corpusSuggestions);

        if (endnoteResult.endnotes.length > 0) {
          // Apply endnotes to content
          result.content = orchestratorInstance.applyEndnotes(result.content, endnoteResult);
          console.log(`\n✅ Generated ${endnoteResult.endnotes.length} endnotes with ${endnoteResult.stats.totalSupportingQuotations} supporting quotations\n`);
        }
      } catch (error) {
        console.warn(`Warning: Endnote generation failed: ${error}`);
      }
    }

    // PHASE 2/4/5: Citation enforcement (hallucination prevention)
    let enforcementResult: EnforcementResult | undefined;
    if (result.success && result.content && context.corpusChunks && context.corpusChunks.length > 0) {
      try {
        console.log(`\n[Citation Enforcement] Validating citations against ${context.corpusChunks.length} corpus sources...`);

        // PHASE 1: Build corpus constraint
        const corpusConstraint = buildCorpusConstraint(context.corpusChunks, {
          enforcement: 'strict',
          missingCitationPlaceholder: '[CITATION NEEDED]',
        });

        // PHASE 5: Citation budget check (warning only)
        const budgetResult = calculateCitationBudget(context.corpusChunks, {
          targetWords: result.content.split(/\s+/).length,
          documentType: 'dissertation',
        });

        if (!budgetResult.sufficient) {
          console.warn(`[Citation Budget] Warning: ${budgetResult.warning}`);
        }

        // PHASE 2/4/7: Citation enforcement (including quotation fidelity)
        const enforcer = new CitationEnforcer(corpusConstraint, {
          mode: 'auto-correct',
          minPassRate: 0.85,
          maxHallucinations: 3,
          includeReport: true,
        }, context.corpusChunks);

        enforcementResult = await enforcer.enforce(result.content);

        console.log(`[Citation Enforcement] Action: ${enforcementResult.action.toUpperCase()}`);
        console.log(`[Citation Enforcement] Total Citations: ${enforcementResult.validation.totalCitations}`);
        console.log(`[Citation Enforcement] Valid: ${enforcementResult.validation.valid.length}`);
        console.log(`[Citation Enforcement] Hallucinated: ${enforcementResult.validation.hallucinated.length}`);
        console.log(`[Citation Enforcement] Missing Page Numbers: ${enforcementResult.missingPageNumbersCount}`);
        console.log(`[Citation Enforcement] Pass Rate: ${(enforcementResult.validation.passRate * 100).toFixed(1)}%`);

        if (enforcementResult.action === 'corrected') {
          result.content = enforcementResult.content;
          console.log(`[Citation Enforcement] ✅ Corrected ${enforcementResult.correctionsCount} hallucinated citations`);
        } else if (enforcementResult.action === 'rejected') {
          console.error('[Citation Enforcement] ⚠️  Generated content rejected due to excessive hallucinations');
          console.warn('[Citation Enforcement] Using original prose with hallucinations flagged');
        }
      } catch (enforcementError) {
        console.error('[Citation Enforcement] Error during citation enforcement:', enforcementError);
        console.warn('[Citation Enforcement] Using original content due to enforcement error');
      }
    } else if (result.success && result.content) {
      console.log('[Citation Enforcement] Skipped - no corpus chunks available');
    }

    // Output results
    if (values.json) {
      const output = {
        success: result.success,
        content: result.content,
        wordCount: result.content.split(/\s+/).length,
        retrievalRounds: result.retrievalRounds,
        totalRetrievalTokens: result.totalRetrievalTokens,
        toolsExecuted: result.executedTools.length,
        executedTools: result.executedTools,
        durationMs: duration,
        usage: result.usage,
        error: result.error,
        endnotes: endnoteResult ? {
          count: endnoteResult.stats.totalEndnotes,
          supportingQuotationsCount: endnoteResult.stats.totalSupportingQuotations,
          sourcesUsed: endnoteResult.stats.sourcesUsed,
        } : undefined,
        citationEnforcement: enforcementResult ? {
          action: enforcementResult.action,
          totalCitations: enforcementResult.validation.totalCitations,
          validCitations: enforcementResult.validation.valid.length,
          hallucinatedCitations: enforcementResult.validation.hallucinated.length,
          correctionsMade: enforcementResult.correctionsCount,
          missingPageNumbers: enforcementResult.missingPageNumbersCount,
          passRate: enforcementResult.validation.passRate,
        } : undefined,
      };
      console.log(JSON.stringify(output, null, 2));
    } else {
      console.log('\n' + '═'.repeat(60));
      console.log('Generation Complete');
      console.log('═'.repeat(60) + '\n');

      console.log(`Success: ${result.success ? '✅' : '❌'}`);
      console.log(`Words: ${result.content.split(/\s+/).length}`);
      console.log(`Retrieval Rounds: ${result.retrievalRounds}`);
      console.log(`Tokens Retrieved: ${result.totalRetrievalTokens.toLocaleString()}`);
      console.log(`Tools Executed: ${result.executedTools.length}`);
      console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
      console.log(`Input Tokens: ${result.usage.inputTokens.toLocaleString()}`);
      console.log(`Output Tokens: ${result.usage.outputTokens.toLocaleString()}`);

      if (result.executedTools.length > 0) {
        console.log('\nTool Executions:');
        const toolCounts = result.executedTools.reduce((acc, tool) => {
          acc[tool.toolName] = (acc[tool.toolName] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        Object.entries(toolCounts).forEach(([tool, count]) => {
          console.log(`  ${tool}: ${count}x`);
        });
      }

      if (enforcementResult) {
        console.log('\n' + '─'.repeat(60));
        console.log('Citation Enforcement');
        console.log('─'.repeat(60));
        console.log(`Action: ${enforcementResult.action}`);
        console.log(`Total Citations: ${enforcementResult.validation.totalCitations}`);
        console.log(`Valid Citations: ${enforcementResult.validation.valid.length}`);
        console.log(`Hallucinated: ${enforcementResult.validation.hallucinated.length}`);
        console.log(`Corrections Made: ${enforcementResult.correctionsCount}`);
        console.log(`Missing Page Numbers: ${enforcementResult.missingPageNumbersCount}`);
        console.log(`Pass Rate: ${(enforcementResult.validation.passRate * 100).toFixed(1)}%`);
      }

      console.log('\n' + '═'.repeat(60));
      console.log('Generated Content');
      console.log('═'.repeat(60) + '\n');
      console.log(result.content);

      if (result.error) {
        console.error('\nError:', result.error);
      }
    }
  } catch (error) {
    console.error('\n❌ Generation failed:');
    console.error(error);
    process.exit(1);
  }
}

async function handlePrepare(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      chapter: { type: 'string', short: 'c' },
      section: { type: 'string', short: 's' },
      length: { type: 'string', short: 'l' },
      style: { type: 'string' },
      json: { type: 'boolean' },
      tiered: { type: 'boolean' },
      'token-budget': { type: 'string' },
      'use-agentdb': { type: 'boolean' },
      // Hybrid retrieval options (Phase 1)
      'hybrid-retrieval': { type: 'boolean' },
      'retrieval-mode': { type: 'string' },
      'bm25-k1': { type: 'string' },
      'bm25-b': { type: 'string' },
      // New quality enhancement options
      'interactive': { type: 'boolean' },
      'auto-accept-after': { type: 'string' },
      'enable-satisfaction': { type: 'boolean' },
      'enable-feedback': { type: 'boolean' },
      'enable-provenance': { type: 'boolean' },
      // Endnote generation options
      'enable-endnotes': { type: 'boolean' },
      'max-quotations-per-endnote': { type: 'string' },
      'min-endnote-relevance': { type: 'string' },
      // Prompt testing options
      'prompt-style': { type: 'string' },
      'use-local-model': { type: 'boolean' },
      'vllm-url': { type: 'string' },
      // Autonomous retrieval options (Phase 3)
      'autonomous-retrieval': { type: 'boolean' },
      'llm-client': { type: 'string' },
      'max-retrieval-rounds': { type: 'string' },
      'autonomous-context-tokens': { type: 'string' },
    },
  });

  if (!values.chapter || !values.section) {
    console.error('Error: --chapter and --section are required');
    process.exit(1);
  }

  const useTieredContext = values.tiered === true;
  const tokenBudget = values['token-budget'] ? parseInt(values['token-budget'], 10) : 60000;
  const useAgentDB = values['use-agentdb'] === true;

  // Hybrid retrieval options
  const useHybridRetrieval = values['hybrid-retrieval'] === true;
  const retrievalMode = values['retrieval-mode'] as 'hybrid' | 'semantic-only' | 'bm25-only' | undefined;
  const bm25Config = {
    k1: values['bm25-k1'] ? parseFloat(values['bm25-k1'] as string) : undefined,
    b: values['bm25-b'] ? parseFloat(values['bm25-b'] as string) : undefined,
  };

  // Validate tiered options
  if ((values['token-budget'] || useAgentDB) && !useTieredContext) {
    console.error('Error: --token-budget and --use-agentdb require --tiered flag');
    process.exit(1);
  }

  // Validate hybrid retrieval options
  if (useHybridRetrieval && !useAgentDB) {
    console.error('Error: --hybrid-retrieval requires --use-agentdb flag');
    process.exit(1);
  }

  if (retrievalMode && !['hybrid', 'semantic-only', 'bm25-only'].includes(retrievalMode)) {
    console.error('Error: --retrieval-mode must be hybrid, semantic-only, or bm25-only');
    process.exit(1);
  }

  // Configure human verification options
  const humanVerificationOptions: HumanVerificationOptions | undefined =
    values.interactive ? {
      enabled: true,
      autoAcceptAfterIterations: values['auto-accept-after']
        ? parseInt(values['auto-accept-after'], 10)
        : undefined,
    } : undefined;

  // Configure satisfaction options
  const satisfactionOptions: SatisfactionOptions | undefined =
    values['enable-satisfaction'] ? {
      enabled: true,
      collectDetailedScores: true,
    } : undefined;

  const orchestrator = new SectionOrchestrator();
  await orchestrator.initialize();

  // Enable features based on flags
  if (values['enable-satisfaction']) {
    orchestrator['satisfactionTracker'].updateOptions({ enabled: true });
  }

  if (values['enable-feedback']) {
    await orchestrator.enableFeedbackLearning();
  }

  const context = await orchestrator.prepareForGeneration({
    chapter: parseInt(values.chapter, 10),
    section: values.section,
    targetWords: values.length ? parseInt(values.length, 10) : 2500,
    styleProfileId: values.style,
    useTieredContext,
    tokenBudget,
    useAgentDB,
    // Phase 1: Hybrid retrieval
    useHybridRetrieval,
    retrievalMode,
    bm25Config,
    enableHumanVerification: values.interactive === true,
    humanVerificationOptions,
    enableSatisfactionTracking: values['enable-satisfaction'] === true,
    satisfactionOptions,
    enableFeedbackLearning: values['enable-feedback'] === true,
    enableProvenanceLedger: values['enable-provenance'] === true,
    // Endnote generation
    enableEndnotes: values['enable-endnotes'] === true,
    endnoteConfig: {
      maxQuotationsPerEndnote: values['max-quotations-per-endnote']
        ? parseInt(values['max-quotations-per-endnote'], 10)
        : undefined,
      minRelevanceThreshold: values['min-endnote-relevance']
        ? parseFloat(values['min-endnote-relevance'])
        : undefined,
    },
    promptStyle: values['prompt-style'] as string | undefined,
    useLocalModel: values['use-local-model'] === true,
    vllmBaseUrl: values['vllm-url'] as string | undefined,
    // Phase 3: Autonomous retrieval
    enableAutonomousRetrieval: values['autonomous-retrieval'] === true,
    llmClient: values['llm-client'] as 'claude' | 'openai' | 'vllm' | 'auto' | undefined,
    maxRetrievalRounds: values['max-retrieval-rounds'] ? parseInt(values['max-retrieval-rounds'], 10) : undefined,
    autonomousContextTokens: values['autonomous-context-tokens'] ? parseInt(values['autonomous-context-tokens'], 10) : undefined,
  });

  // PHASE 3: Execute autonomous retrieval if enabled
  if (values['autonomous-retrieval'] === true) {
    await executeAutonomousGeneration(context, values);
    return; // Exit after generation
  }

  if (values.json) {
    // Build JSON output
    const output: Record<string, unknown> = {
      success: true,
      chapter: context.metadata.chapter,
      section: context.metadata.section,
      styleProfileId: context.metadata.styleProfileId,
      corpusSuggestionsCount: context.metadata.corpusSuggestionsCount,
      corpusSuggestions: context.corpusSuggestions.map(s => ({
        author: s.author,
        title: s.title,
        year: s.year,
        relevanceScore: s.relevanceScore,
      })),
      generationPromptLength: context.generationPrompt.length,
    };

    // Add tiered context info if applicable
    if (context.tieredMode) {
      output.tieredMode = true;
      output.tokenBudget = context.tokenBudget;
      output.contextStats = context.contextStats;
      output.tier1Hot = context.tier1Hot;
      output.tier2Warm = context.tier2Warm;
      output.tier3ColdAccessor = context.tier3ColdAccessor;
      // Truncate context for JSON output
      output.dissertationContext = context.dissertationContext.substring(0, 2000) + '...';
    } else {
      output.dissertationContext = context.dissertationContext.substring(0, 1000) + '...';
    }

    // Add prompt testing info if applicable
    if (values['prompt-style']) {
      output.promptStyle = values['prompt-style'];
    }
    if (values['use-local-model']) {
      output.useLocalModel = true;
      output.vllmBaseUrl = values['vllm-url'] || 'http://localhost:8002';
    }

    output.generationPrompt = context.generationPrompt;

    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log('=== Section Context Prepared ===');
    console.log(`Chapter: ${context.metadata.chapter}`);
    console.log(`Section: ${context.metadata.section}`);
    console.log(`Style Profile: ${context.metadata.styleProfileId || 'default'}`);
    console.log(`Corpus Suggestions: ${context.corpusSuggestions.length}`);

    if (context.tieredMode && context.contextStats) {
      console.log('');
      console.log('=== Tiered Context Stats ===');
      console.log(`Mode: Tiered (Hot/Warm/Cold)`);
      console.log(`Token Budget: ${context.tokenBudget}`);
      console.log(`Tier 1 (Hot) Tokens: ${context.contextStats.tier1HotTokens}`);
      console.log(`Tier 2 (Warm) Tokens: ${context.contextStats.tier2WarmTokens}`);
      console.log(`Tier 3 (Cold) Available: ${context.contextStats.tier3ColdAvailable}`);
      console.log(`Total Tokens: ${context.contextStats.totalTokens}`);
      console.log(`Compression Ratio: ${(context.contextStats.compressionRatio * 100).toFixed(1)}%`);

      if (context.tier3ColdAccessor) {
        console.log(`Cold Storage Type: ${context.tier3ColdAccessor.type}`);
        console.log(`Cold Storage Chunks: ${context.tier3ColdAccessor.totalChunks}`);
        console.log(`Embedding Available: ${context.tier3ColdAccessor.embeddingAvailable}`);
      }
    }

    console.log('');
    console.log(`Generation Prompt Length: ${context.generationPrompt.length} chars`);
    console.log('');
    console.log('=== Generation Prompt ===');
    console.log(context.generationPrompt);
  }
}

async function handleValidate(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      chapter: { type: 'string', short: 'c' },
      content: { type: 'string' },
      json: { type: 'boolean' },
    },
  });

  if (!values.chapter || !values.content) {
    console.error('Error: --chapter and --content are required');
    process.exit(1);
  }

  const contentPath = path.resolve(values.content);
  const content = await fs.readFile(contentPath, 'utf-8');

  const orchestrator = new SectionOrchestrator();
  const result = await orchestrator.validateSection(
    content,
    parseInt(values.chapter, 10)
  );

  if (values.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log('=== Quality Gauntlet Results ===');
    console.log(`Passed: ${result.passed}`);
    console.log(`Overall Score: ${Math.round(result.overallScore * 100)}%`);
    console.log(`Revision Required: ${result.revisionRequired}`);
    console.log('');
    console.log('=== Summary ===');
    console.log(`Total Issues: ${result.summary.totalIssues}`);
    console.log(`Critical: ${result.summary.criticalCount}`);
    console.log(`Major: ${result.summary.majorCount}`);
    console.log(`Minor: ${result.summary.minorCount}`);
    console.log(`Auto-fixable: ${result.summary.autoFixableCount}`);
    console.log('');
    if (result.revisionRequired) {
      console.log('=== Revision Guidance ===');
      console.log(result.revisionGuidance);
    }
  }
}

async function handleUpdateContext(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      chapter: { type: 'string', short: 'c' },
      section: { type: 'string', short: 's' },
      content: { type: 'string' },
      json: { type: 'boolean' },
    },
  });

  if (!values.chapter || !values.section || !values.content) {
    console.error('Error: --chapter, --section, and --content are required');
    process.exit(1);
  }

  const contentPath = path.resolve(values.content);
  const content = await fs.readFile(contentPath, 'utf-8');

  const orchestrator = new SectionOrchestrator();
  await orchestrator.initialize();
  await orchestrator.updateContextAfterCompletion(
    parseInt(values.chapter, 10),
    values.section,
    content
  );

  if (values.json) {
    console.log(JSON.stringify({
      success: true,
      chapter: parseInt(values.chapter, 10),
      section: values.section,
      contentLength: content.length,
      timestamp: new Date().toISOString(),
    }, null, 2));
  } else {
    console.log('Context updated successfully');
    console.log(`Chapter: ${values.chapter}`);
    console.log(`Section: ${values.section}`);
  }
}

async function handleFeedback(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      chapter: { type: 'string', short: 'c' },
      section: { type: 'string', short: 's' },
      content: { type: 'string' },
      'sounds-like-me': { type: 'boolean' },
      'correction-file': { type: 'string' },
      json: { type: 'boolean' },
    },
  });

  if (!values.chapter || !values.section || !values.content) {
    console.error('Error: --chapter, --section, and --content are required');
    process.exit(1);
  }

  const contentPath = path.resolve(values.content);
  const content = await fs.readFile(contentPath, 'utf-8');

  let corrections = [];
  if (values['correction-file']) {
    const correctionData = await fs.readFile(values['correction-file'], 'utf-8');
    corrections = JSON.parse(correctionData);
  }

  const orchestrator = new SectionOrchestrator();
  await orchestrator.initialize();

  await orchestrator.captureSectionFeedback(
    parseInt(values.chapter, 10),
    values.section,
    content,
    {
      soundsLikeMe: values['sounds-like-me'] ?? true,
      corrections,
    }
  );

  if (values.json) {
    console.log(JSON.stringify({
      success: true,
      chapter: parseInt(values.chapter, 10),
      section: values.section,
      timestamp: new Date().toISOString(),
    }, null, 2));
  } else {
    console.log('Feedback captured successfully');
  }
}

async function handleRate(args: string[]): Promise<void> {
  const { values } = parseArgs({
    args,
    options: {
      chapter: { type: 'string', short: 'c' },
      section: { type: 'string', short: 's' },
      overall: { type: 'string' },
      style: { type: 'string' },
      quality: { type: 'string' },
      'would-use': { type: 'boolean' },
      feedback: { type: 'string' },
      json: { type: 'boolean' },
    },
  });

  if (!values.chapter || !values.section) {
    console.error('Error: --chapter and --section are required');
    process.exit(1);
  }

  const trajectoryId = `${values.chapter}-${values.section}`;

  const rating: SatisfactionRating = {
    trajectoryId,
    overallScore: values.overall ? parseInt(values.overall, 10) / 10 : 0.8,
    styleMatchScore: values.style ? parseInt(values.style, 10) / 10 : undefined,
    qualityScore: values.quality ? parseInt(values.quality, 10) / 10 : undefined,
    wouldUseAsIs: values['would-use'] ?? false,
    feedback: values.feedback,
    timestamp: new Date().toISOString(),
  };

  if (values.json) {
    console.log(JSON.stringify({
      success: true,
      rating,
    }, null, 2));
  } else {
    console.log('=== Satisfaction Rating Recorded ===');
    console.log(`Chapter: ${values.chapter}`);
    console.log(`Section: ${values.section}`);
    console.log(`Overall Score: ${(rating.overallScore * 100).toFixed(1)}%`);
    if (rating.styleMatchScore) {
      console.log(`Style Match: ${(rating.styleMatchScore * 100).toFixed(1)}%`);
    }
    if (rating.qualityScore) {
      console.log(`Quality: ${(rating.qualityScore * 100).toFixed(1)}%`);
    }
    console.log(`Would Use As-Is: ${rating.wouldUseAsIs ? 'Yes' : 'No'}`);
  }
}

async function handleStats(args?: string[]): Promise<void> {
  const { values } = parseArgs({
    args: args || [],
    options: {
      'check-tiered': { type: 'boolean' },
      'show-satisfaction': { type: 'boolean' },
      'show-feedback': { type: 'boolean' },
      json: { type: 'boolean' },
    },
  });

  const orchestrator = new SectionOrchestrator();
  await orchestrator.initialize();

  const corpusStats = orchestrator.getCorpusStats();
  const contextSummary = orchestrator.getContextSummary();
  const tieredRecommendation = orchestrator.checkTieredRecommendation();

  // Get new feature stats
  const satisfactionStats = values['show-satisfaction'] ? orchestrator.getSatisfactionStatistics() : undefined;
  const feedbackStats = values['show-feedback'] ? orchestrator.getFeedbackStats() : undefined;

  if (values.json) {
    console.log(JSON.stringify({
      corpus: corpusStats,
      context: contextSummary,
      tieredContextRecommendation: tieredRecommendation,
      satisfaction: satisfactionStats,
      feedback: feedbackStats,
    }, null, 2));
    return;
  }

  console.log('=== Corpus Statistics ===');
  console.log(`Documents: ${corpusStats.totalDocuments}`);
  console.log(`Chunks: ${corpusStats.totalChunks}`);
  console.log(`Authors: ${corpusStats.authors.length}`);
  console.log('');
  console.log('=== Dissertation Context ===');
  console.log(`Title: ${contextSummary.title || '(not set)'}`);
  console.log(`Main Thesis: ${contextSummary.mainThesis ? contextSummary.mainThesis.substring(0, 100) + '...' : '(not set)'}`);
  console.log(`Chapters with Context: ${contextSummary.chaptersWithContext.join(', ') || 'none'}`);
  console.log(`Active Argument Threads: ${contextSummary.totalThreads}`);
  console.log(`Glossary Terms: ${contextSummary.glossaryTermCount}`);

  if (satisfactionStats) {
    console.log('');
    console.log('=== Satisfaction Statistics ===');
    console.log(`Total Ratings: ${satisfactionStats.totalRatings}`);
    console.log(`Average Overall: ${(satisfactionStats.averageOverall * 100).toFixed(1)}%`);
    console.log(`Average Style Match: ${(satisfactionStats.averageStyleMatch * 100).toFixed(1)}%`);
    console.log(`Average Quality: ${(satisfactionStats.averageQuality * 100).toFixed(1)}%`);
    console.log(`Would Use As-Is: ${satisfactionStats.useAsIsPercentage.toFixed(1)}%`);
  }

  if (feedbackStats) {
    console.log('');
    console.log('=== Feedback Learning Statistics ===');
    console.log(`Total Feedback: ${feedbackStats.totalFeedback}`);
    console.log(`Processed: ${feedbackStats.processedCount}`);
    console.log(`Sounds Like Me Ratio: ${(feedbackStats.soundsLikeMeRatio * 100).toFixed(1)}%`);
    console.log(`Patterns Learned: ${feedbackStats.patternsLearned}`);
  }

  if (values['check-tiered']) {
    console.log('');
    console.log('=== Tiered Context Recommendation ===');
    console.log(`Estimated Total Tokens: ${tieredRecommendation.estimatedTokens}`);
    console.log(`Tiered Context Recommended: ${tieredRecommendation.recommended ? 'YES' : 'NO'}`);
    console.log(`Reason: ${tieredRecommendation.reason}`);

    if (tieredRecommendation.recommended) {
      console.log('');
      console.log('Suggested command:');
      console.log('  npx tsx section-orchestrator.ts complete --chapter N --section "..." --tiered --json');
      console.log('');
      console.log('For large dissertations (5+ chapters), consider:');
      console.log('  --token-budget 80000 --use-agentdb');
    }
  }
}

// Run CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
}

export { main };
