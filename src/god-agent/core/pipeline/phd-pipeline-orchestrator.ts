/**
 * PhD Pipeline Orchestrator
 * TASK-PHD-001 - 48-Agent PhD Pipeline
 *
 * Orchestrates execution of 48-agent PhD research pipeline:
 * - Phase-by-phase sequential execution
 * - Topological sort for agent ordering within phases
 * - Dependency tracking and input gathering
 * - Critical agent validation
 * - Integration with Shadow Vector tracking
 */

import {
  type IPipelineConfig,
  type IAgentConfig,
  type IPhaseConfig,
  type IPipelineState,
  type IPipelineProgress,
  type IAgentExecutionRecord,
  type AgentId,
  PipelineConfigError,
  CriticalAgentError,
  createPipelineState,
  generatePipelineId,
  isCriticalAgent,
  PHASE_NAMES,
} from './pipeline-types.js';
import { SocketClient } from '../../observability/socket-client.js';
import type { IActivityEvent } from '../../observability/types.js';
import {
  TieredValidator,
  createTieredValidator,
  ValidationTier,
  type ValidationResult,
  type ValidationConfig,
} from './validation-tiers.js';
import {
  ContextHealthMonitor,
  createClaudeContextMonitor,
  type ContextHealth,
  type ContextHealthEvent,
} from '../../cli/context/context-health-monitor.js';
import {
  PhaseSummarizer,
  createPhaseSummarizer,
  type PhaseSummary,
} from '../../cli/context/phase-summarizer.js';
import {
  buildCorpusConstraint,
  CitationEnforcer,
  calculateCitationBudget,
  type CorpusConstraint,
  type EnforcementResult,
  type ContextChunk,
} from '../writing/index.js';

// ==================== Agent Executor Interface ====================

/**
 * Interface for executing agents (allows mocking in tests)
 */
export interface IAgentExecutor {
  /**
   * Execute an agent with given inputs
   */
  execute(
    agentKey: string,
    inputs: Record<string, unknown>,
    timeout: number
  ): Promise<Record<string, unknown>>;
}

/**
 * Interface for shadow vector tracking
 */
export interface IShadowTracker {
  /**
   * Record agent execution
   */
  record(execution: IAgentExecutionRecord): Promise<void>;
}

// ==================== Orchestrator Class ====================

/**
 * Context monitoring configuration (PHASE-4-001)
 */
export interface ContextMonitoringConfig {
  /** Enable context health monitoring (default: true) */
  enabled?: boolean;

  /** Maximum tokens in context window (default: 200000) */
  maxTokens?: number;

  /** Enable automatic summarization at phase boundaries (default: true) */
  autoSummarize?: boolean;

  /** Target compression ratio for summarization (default: 10) */
  targetCompression?: number;
}

/**
 * PhD Pipeline Orchestrator - manages 48-agent research pipeline
 */
export class PhDPipelineOrchestrator {
  private config: IPipelineConfig;
  private executor: IAgentExecutor;
  private tracker?: IShadowTracker;
  private state: IPipelineState | null = null;
  private verbose: boolean;
  private socketClient: SocketClient | null = null;
  private validator: TieredValidator;

  // Context management (PHASE-4-001/002)
  private contextMonitor: ContextHealthMonitor;
  private phaseSummarizer: PhaseSummarizer;
  private phaseSummaries: PhaseSummary[] = [];
  private contextMonitoringEnabled: boolean;
  private autoSummarizeEnabled: boolean;

  constructor(
    config: IPipelineConfig,
    executor: IAgentExecutor,
    options: {
      tracker?: IShadowTracker;
      verbose?: boolean;
      validationConfig?: Partial<ValidationConfig>;
      contextConfig?: ContextMonitoringConfig;
    } = {}
  ) {
    this.config = config;
    this.executor = executor;
    this.tracker = options.tracker;
    this.verbose = options.verbose ?? false;
    this.validator = createTieredValidator();

    // Apply custom validation config if provided
    if (options.validationConfig) {
      this.validator.updateConfig(options.validationConfig);
    }

    // Initialize context monitoring (PHASE-4-001)
    const contextConfig = options.contextConfig ?? {};
    this.contextMonitoringEnabled = contextConfig.enabled ?? true;
    this.autoSummarizeEnabled = contextConfig.autoSummarize ?? true;

    this.contextMonitor = createClaudeContextMonitor();
    if (contextConfig.maxTokens) {
      this.contextMonitor = new ContextHealthMonitor({
        maxTokens: contextConfig.maxTokens,
      });
    }

    this.phaseSummarizer = createPhaseSummarizer(
      { targetCompression: contextConfig.targetCompression ?? 10 },
      this.contextMonitor
    );

    // Subscribe to context health events
    this.setupContextEventHandlers();

    this.validateConfig();
    this.initSocketClient();
  }

  /**
   * Set up context health event handlers (PHASE-4-001)
   */
  private setupContextEventHandlers(): void {
    if (!this.contextMonitoringEnabled) return;

    this.contextMonitor.on('status_change', (event: ContextHealthEvent) => {
      if (this.verbose) {
        console.log(`[PhD Pipeline] Context health: ${event.previousStatus} -> ${event.currentStatus}`);
      }

      this.emitEvent({
        component: 'context',
        operation: 'health_changed',
        status: event.currentStatus === 'critical' ? 'warning' : 'success',
        metadata: {
          pipelineId: this.state?.pipelineId,
          previousStatus: event.previousStatus,
          currentStatus: event.currentStatus,
          utilization: event.health.utilization,
          currentTokens: event.health.currentTokens,
          recommendation: event.health.recommendation,
        },
      });
    });

    this.contextMonitor.on('threshold_crossed', (event: ContextHealthEvent) => {
      if (event.currentStatus === 'critical' && this.verbose) {
        console.warn(`[PhD Pipeline] CRITICAL: Context utilization at ${event.health.utilization.toFixed(1)}%`);
        console.warn(`[PhD Pipeline] ${event.health.recommendation}`);
      }
    });
  }

  /**
   * Initialize socket client for observability events
   */
  private async initSocketClient(): Promise<void> {
    try {
      this.socketClient = new SocketClient({ verbose: false });
      await this.socketClient.connect();
    } catch {
      // INTENTIONAL: Non-blocking - observability is optional, pipeline works without it
      if (this.verbose) {
        console.debug('[PhD Pipeline] Socket client initialization failed (observability disabled)');
      }
    }
  }

  /**
   * Emit event to observability daemon
   */
  private emitEvent(event: Omit<IActivityEvent, 'id' | 'timestamp'>): void {
    if (!this.socketClient) return;

    try {
      const fullEvent: IActivityEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        ...event,
      };
      this.socketClient.send(fullEvent);
    } catch {
      // INTENTIONAL: Non-blocking - event emission failures must not affect pipeline execution
    }
  }

  // ==================== Configuration Validation ====================

  /**
   * Validate pipeline configuration
   */
  private validateConfig(): void {
    if (this.verbose) {
      console.log('[PhD Pipeline] Validating configuration...');
    }

    // 1. Check agent count
    if (this.config.agents.length !== this.config.pipeline.totalAgents) {
      throw new PipelineConfigError(
        `Agent count mismatch: expected ${this.config.pipeline.totalAgents}, got ${this.config.agents.length}`,
        'INVALID_AGENT_COUNT'
      );
    }

    // 2. Check phase count
    if (this.config.phases.length !== this.config.pipeline.phases) {
      throw new PipelineConfigError(
        `Phase count mismatch: expected ${this.config.pipeline.phases}, got ${this.config.phases.length}`,
        'INVALID_PHASE_COUNT'
      );
    }

    // 3. Validate dependency graph (must be DAG)
    this.validateDAG();

    // 4. Check all agents have required fields
    for (const agent of this.config.agents) {
      if (!agent.id || !agent.key || !agent.name || !agent.phase) {
        throw new PipelineConfigError(
          `Invalid agent config missing required fields: id=${agent.id}`,
          'INVALID_AGENT_CONFIG'
        );
      }
    }

    // 5. Verify phase agent assignments match
    for (const phase of this.config.phases) {
      for (const agentId of phase.agents) {
        const agent = this.config.agents.find(a => a.id === agentId);
        if (!agent) {
          throw new PipelineConfigError(
            `Phase ${phase.id} references non-existent agent ${agentId}`,
            'PHASE_MISMATCH'
          );
        }
        if (agent.phase !== phase.id) {
          throw new PipelineConfigError(
            `Agent ${agentId} is in phase ${agent.phase} but listed in phase ${phase.id}`,
            'PHASE_MISMATCH'
          );
        }
      }
    }

    if (this.verbose) {
      console.log('[PhD Pipeline] Configuration valid ✓');
    }
  }

  /**
   * Validate dependency graph is a DAG (no cycles)
   */
  private validateDAG(): void {
    // Build adjacency list
    const graph = new Map<AgentId, AgentId[]>();
    for (const agent of this.config.agents) {
      graph.set(agent.id, agent.dependencies);
    }

    // DFS-based cycle detection
    const visited = new Set<AgentId>();
    const recStack = new Set<AgentId>();

    const hasCycle = (nodeId: AgentId, path: AgentId[]): AgentId[] | null => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const deps = graph.get(nodeId) || [];
      for (const depId of deps) {
        if (!visited.has(depId)) {
          const cycle = hasCycle(depId, [...path, nodeId]);
          if (cycle) return cycle;
        } else if (recStack.has(depId)) {
          return [...path, nodeId, depId]; // Cycle found
        }
      }

      recStack.delete(nodeId);
      return null;
    };

    for (const agent of this.config.agents) {
      if (!visited.has(agent.id)) {
        const cycle = hasCycle(agent.id, []);
        if (cycle) {
          throw new PipelineConfigError(
            `Circular dependency detected: ${cycle.join(' → ')}`,
            'CIRCULAR_DEPENDENCY'
          );
        }
      }
    }

    if (this.verbose) {
      console.log('[PhD Pipeline] Dependency graph is acyclic (DAG) ✓');
    }
  }

  // ==================== Execution ====================

  /**
   * Execute the full pipeline
   */
  async execute(problemStatement: string): Promise<IPipelineState> {
    if (this.verbose) {
      console.log('[PhD Pipeline] Starting execution...');
    }

    // Reset validator and context monitor for new pipeline run
    this.validator.reset();
    this.contextMonitor.reset();
    this.phaseSummaries = [];

    this.state = createPipelineState(generatePipelineId());
    this.state.status = 'running';

    // Emit pipeline_started event
    this.emitEvent({
      component: 'pipeline',
      operation: 'pipeline_started',
      status: 'running',
      metadata: {
        pipelineId: this.state.pipelineId,
        name: this.config.pipeline.name,
        taskType: 'research',
        totalSteps: this.config.pipeline.totalAgents,
        steps: this.config.agents.map(a => a.key),
      },
    });

    try {
      // Execute each phase sequentially
      for (const phase of this.config.phases) {
        if (this.verbose) {
          console.log(`[PhD Pipeline] Executing Phase ${phase.id}: ${phase.name}`);
        }
        await this.executePhase(phase, problemStatement);

        // Run Tier 2 phase validation at phase boundary
        await this.validatePhaseCompletion(phase);

        this.state.currentPhase = phase.id + 1;
      }

      this.state.status = 'completed';
      this.state.endTime = Date.now();

      // Emit pipeline_completed event
      this.emitEvent({
        component: 'pipeline',
        operation: 'pipeline_completed',
        status: 'success',
        durationMs: this.state.endTime - this.state.startTime,
        metadata: {
          pipelineId: this.state.pipelineId,
          name: this.config.pipeline.name,
          totalSteps: this.config.pipeline.totalAgents,
          completedSteps: this.state.completedAgents.size,
          progress: 100,
        },
      });

      if (this.verbose) {
        console.log('[PhD Pipeline] Execution completed successfully');
      }

    } catch (error) {
      this.state.status = 'failed';
      this.state.endTime = Date.now();

      // Emit pipeline_failed event
      this.emitEvent({
        component: 'pipeline',
        operation: 'pipeline_failed',
        status: 'error',
        durationMs: this.state.endTime - this.state.startTime,
        metadata: {
          pipelineId: this.state.pipelineId,
          name: this.config.pipeline.name,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      if (this.verbose) {
        console.error('[PhD Pipeline] Execution failed:', error);
      }

      // RULE-070: Re-throw with pipeline context
      throw new Error(
        `PhD Pipeline "${this.config.pipeline.name}" (id: ${this.state.pipelineId}) failed at phase ${this.state.currentPhase}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error }
      );
    }

    return this.state;
  }

  /**
   * Execute a single phase
   */
  private async executePhase(phase: IPhaseConfig, problemStatement: string): Promise<void> {
    const phaseAgents = this.config.agents.filter(a => phase.agents.includes(a.id));

    // Determine execution order using topological sort
    const executionOrder = this.topologicalSort(phaseAgents);

    if (this.verbose) {
      console.log(`[PhD Pipeline] Phase ${phase.id} execution order: ${executionOrder.map(a => a.key).join(' → ')}`);
    }

    // Execute agents in order
    for (const agent of executionOrder) {
      await this.executeAgent(agent, problemStatement);
    }
  }

  /**
   * Validate phase completion using Tier 2 validation
   */
  private async validatePhaseCompletion(phase: IPhaseConfig): Promise<void> {
    if (this.verbose) {
      console.log(`[PhD Pipeline] Running Tier 2 validation for Phase ${phase.id}`);
    }

    // Gather phase agent outputs
    const phaseAgentOutputs = new Map<string, unknown>();
    for (const agentId of phase.agents) {
      const agent = this.config.agents.find(a => a.id === agentId);
      if (agent) {
        const output = this.state!.agentOutputs.get(agentId);
        if (output) {
          phaseAgentOutputs.set(agent.key, output);
        }
      }
    }

    // Run Tier 2 validation
    const validationResult = this.validator.validatePhaseCompletion(phase.id, phaseAgentOutputs);

    // Emit validation event
    this.emitEvent({
      component: 'validation',
      operation: 'phase_validated',
      status: validationResult.passed ? 'success' : 'warning',
      durationMs: validationResult.durationMs,
      metadata: {
        pipelineId: this.state!.pipelineId,
        phaseId: phase.id,
        phaseName: phase.name,
        tier: ValidationTier.PHASE,
        passed: validationResult.passed,
        errors: validationResult.errors,
        warnings: validationResult.warnings,
      },
    });

    if (!validationResult.passed) {
      if (this.verbose) {
        console.warn(`[PhD Pipeline] Phase ${phase.id} validation failed:`);
        for (const error of validationResult.errors) {
          console.warn(`  - ${error}`);
        }
      }

      // Log warnings too
      for (const warning of validationResult.warnings) {
        if (this.verbose) {
          console.warn(`[PhD Pipeline] Phase ${phase.id} warning: ${warning}`);
        }
      }

      // Phase failures are not retryable - throw if errors exist
      if (validationResult.errors.length > 0) {
        throw new Error(
          `Phase ${phase.id} (${phase.name}) validation failed: ${validationResult.errors.join('; ')}`
        );
      }
    } else if (this.verbose) {
      console.log(`[PhD Pipeline] Phase ${phase.id} validation passed ✓`);
    }

    // Context management at phase boundary (PHASE-4-002)
    await this.handlePhaseContextManagement(phase, phaseAgentOutputs);
  }

  /**
   * Handle context management at phase boundary (PHASE-4-002)
   * Summarizes phase outputs if context health requires it
   */
  private async handlePhaseContextManagement(
    phase: IPhaseConfig,
    phaseAgentOutputs: Map<string, unknown>
  ): Promise<void> {
    if (!this.contextMonitoringEnabled) return;

    const health = this.contextMonitor.getHealth();

    // Log context health at phase boundary
    if (this.verbose) {
      console.log(`[PhD Pipeline] Phase ${phase.id} context health: ${health.status} (${health.utilization.toFixed(1)}%)`);
    }

    // Emit context health event
    this.emitEvent({
      component: 'context',
      operation: 'phase_boundary',
      status: health.status === 'healthy' ? 'success' : 'warning',
      metadata: {
        pipelineId: this.state!.pipelineId,
        phaseId: phase.id,
        phaseName: phase.name,
        status: health.status,
        utilization: health.utilization,
        currentTokens: health.currentTokens,
        maxTokens: health.maxTokens,
        remainingTokens: this.contextMonitor.getRemainingCapacity(),
      },
    });

    // Check if summarization is needed
    const shouldSummarize = this.autoSummarizeEnabled && (
      this.contextMonitor.needsSummarization() ||
      (health.status === 'warning' && phase.id < this.config.phases.length)
    );

    if (shouldSummarize) {
      if (this.verbose) {
        console.log(`[PhD Pipeline] Summarizing Phase ${phase.id} to reduce context...`);
      }

      try {
        // Get recommended compression based on health
        const compression = this.phaseSummarizer.getRecommendedCompression();

        // Summarize the phase
        const summary = await this.phaseSummarizer.summarize(
          phase.id,
          phaseAgentOutputs,
          compression
        );

        this.phaseSummaries.push(summary);

        // Reset context with preserved summary
        const contextSummary = this.phaseSummarizer.buildPhaseContext(
          this.phaseSummaries,
          {}
        );
        this.contextMonitor.resetWithPreserved(contextSummary, `phases-1-${phase.id}-summary`);

        // Emit summarization event
        this.emitEvent({
          component: 'context',
          operation: 'phase_summarized',
          status: 'success',
          durationMs: 0,
          metadata: {
            pipelineId: this.state!.pipelineId,
            phaseId: phase.id,
            originalTokens: summary.originalTokens,
            compressedTokens: summary.compressedTokens,
            compressionRatio: summary.compressionRatio,
            agentsSummarized: summary.agentsSummarized.length,
          },
        });

        if (this.verbose) {
          console.log(
            `[PhD Pipeline] Phase ${phase.id} summarized: ${summary.originalTokens.toLocaleString()} -> ${summary.compressedTokens.toLocaleString()} tokens (${summary.compressionRatio.toFixed(1)}:1)`
          );
        }
      } catch (error) {
        // Non-fatal - log and continue
        if (this.verbose) {
          console.warn(`[PhD Pipeline] Phase summarization failed (non-fatal):`, error);
        }
      }
    }
  }

  /**
   * Topological sort of agents within a phase
   */
  private topologicalSort(agents: IAgentConfig[]): IAgentConfig[] {
    const sorted: IAgentConfig[] = [];
    const visited = new Set<AgentId>();
    const agentMap = new Map(agents.map(a => [a.id, a]));

    const visit = (agentId: AgentId) => {
      if (visited.has(agentId)) return;
      visited.add(agentId);

      const agent = agentMap.get(agentId);
      if (!agent) return;

      // Visit dependencies first (but only within this phase)
      for (const depId of agent.dependencies) {
        if (agentMap.has(depId)) {
          visit(depId);
        }
      }

      sorted.push(agent);
    };

    for (const agent of agents) {
      visit(agent.id);
    }

    return sorted;
  }

  /**
   * Execute a single agent with validation-triggered retry (PHASE-2-003/004)
   */
  private async executeAgent(agent: IAgentConfig, problemStatement: string): Promise<void> {
    if (this.verbose) {
      console.log(`[PhD Pipeline] Executing agent #${agent.id}: ${agent.key}`);
    }

    const stepId = `step_${this.state!.pipelineId}_${agent.id}_${Math.random().toString(36).slice(2, 8)}`;
    const phaseName = PHASE_NAMES[agent.phase] || `Phase ${agent.phase}`;
    const maxRetries = this.validator.getConfig().tier1MaxRetries;

    // Create execution record
    const record: IAgentExecutionRecord = {
      agentId: agent.id,
      agentKey: agent.key,
      startTime: Date.now(),
      status: 'running',
      dependenciesSatisfied: agent.dependencies.filter(d => this.state!.completedAgents.has(d)),
    };

    this.state!.executionRecords.set(agent.id, record);

    // Emit step_started event
    this.emitEvent({
      component: 'pipeline',
      operation: 'step_started',
      status: 'running',
      metadata: {
        pipelineId: this.state!.pipelineId,
        stepId,
        stepName: agent.key,
        stepIndex: this.state!.completedAgents.size,
        agentType: agent.key,
        phase: phaseName,
        progress: (this.state!.completedAgents.size / this.config.pipeline.totalAgents) * 100,
      },
    });

    // Emit agent_started event for agent tracking
    this.emitEvent({
      component: 'agent',
      operation: 'agent_started',
      status: 'running',
      metadata: {
        executionId: `agent_${agent.key}_${stepId}`,
        agentKey: agent.key,
        agentName: agent.name,
        agentCategory: phaseName,
        pipelineId: this.state!.pipelineId,
        taskPreview: `Executing ${agent.name} for PhD research pipeline`,
      },
    });

    // Gather inputs from dependencies
    const inputs = this.gatherInputs(agent);
    inputs.problemStatement = problemStatement;

    let lastError: Error | null = null;
    let lastValidationResult: ValidationResult | null = null;
    let attempt = 0;

    // Validation-triggered retry loop (PHASE-2-004)
    while (attempt <= maxRetries) {
      try {
        // Execute agent (with revision guidance on retry)
        const enhancedInputs = attempt > 0 && lastValidationResult?.revisionGuidance
          ? { ...inputs, _revisionGuidance: lastValidationResult.revisionGuidance }
          : inputs;

        const output = await this.executor.execute(agent.key, enhancedInputs, agent.timeout);

        // Run Tier 1 validation on output (PHASE-2-003)
        const validationResult = this.validator.validateAgentOutput(agent.key, output);

        // Emit validation event
        this.emitEvent({
          component: 'validation',
          operation: 'agent_validated',
          status: validationResult.passed ? 'success' : 'warning',
          durationMs: validationResult.durationMs,
          metadata: {
            pipelineId: this.state!.pipelineId,
            stepId,
            agentKey: agent.key,
            tier: ValidationTier.AGENT,
            attempt: attempt + 1,
            passed: validationResult.passed,
            errors: validationResult.errors,
            warnings: validationResult.warnings,
          },
        });

        // Check validation result
        if (!validationResult.passed) {
          lastValidationResult = validationResult;

          if (this.verbose) {
            console.warn(
              `[PhD Pipeline] Agent #${agent.id} validation failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
              validationResult.errors
            );
          }

          // If retryable and more attempts available, continue loop
          if (validationResult.retryable && attempt < maxRetries) {
            attempt++;
            continue;
          }

          // Out of retries or not retryable - throw for critical agents
          if (isCriticalAgent(agent)) {
            throw new CriticalAgentError(
              agent,
              `Validation failed after ${attempt + 1} attempts: ${validationResult.errors.join('; ')}`
            );
          }

          // Non-critical agents: log warning and continue with partial output
          if (this.verbose) {
            console.warn(
              `[PhD Pipeline] Agent #${agent.id} validation failed but is non-critical - continuing`
            );
          }
        }

        // Validation passed (or non-critical agent with failed validation)

        // PHASE 2/4/5: Citation enforcement for writing agents (hallucination prevention)
        let finalOutput = output;
        const writingAgents = [
          'introduction-writer',
          'literature-review-writer',
          'methodology-writer',
          'results-writer',
          'discussion-writer',
          'conclusion-writer',
          'chapter-synthesizer',
          'abstract-writer',
        ];

        if (writingAgents.includes(agent.key) && output.content && typeof output.content === 'string') {
          try {
            // Get corpus chunks from inputs if available
            const corpusChunks = inputs.corpusChunks as ContextChunk[] | undefined;

            if (corpusChunks && corpusChunks.length > 0) {
              if (this.verbose) {
                console.log(`[Citation Enforcement] Validating citations for ${agent.key} against ${corpusChunks.length} corpus sources...`);
              }

              // PHASE 1: Build corpus constraint
              const corpusConstraint = buildCorpusConstraint(corpusChunks, {
                enforcement: 'strict',
                missingCitationPlaceholder: '[CITATION NEEDED]',
              });

              // PHASE 5: Citation budget check (warning only)
              const budgetResult = calculateCitationBudget(corpusChunks, {
                targetWords: output.content.split(/\s+/).length,
                documentType: 'dissertation',
              });

              if (!budgetResult.sufficient && this.verbose) {
                console.warn(`[Citation Budget] Warning for ${agent.key}: ${budgetResult.warning}`);
              }

              // PHASE 2/4/7: Citation enforcement (including quotation fidelity)
              const enforcer = new CitationEnforcer(corpusConstraint, {
                mode: 'auto-correct',
                minPassRate: 0.85,
                maxHallucinations: 3,
                includeReport: this.verbose,
              }, corpusChunks);

              const enforcementResult = await enforcer.enforce(output.content);

              if (this.verbose) {
                console.log(`[Citation Enforcement] ${agent.key}: Action=${enforcementResult.action}, Citations=${enforcementResult.validation.totalCitations}, Valid=${enforcementResult.validation.valid.length}, Hallucinated=${enforcementResult.validation.hallucinated.length}, PassRate=${(enforcementResult.validation.passRate * 100).toFixed(1)}%`);
              }

              if (enforcementResult.action === 'corrected') {
                finalOutput = { ...output, content: enforcementResult.content };
                if (this.verbose) {
                  console.log(`[Citation Enforcement] ${agent.key}: Corrected ${enforcementResult.correctionsCount} hallucinated citations`);
                }
              } else if (enforcementResult.action === 'rejected') {
                console.error(`[Citation Enforcement] ${agent.key}: Content rejected due to excessive hallucinations`);
                // Don't fail the agent, but log the warning
              }

              // Add enforcement metadata to output
              finalOutput = {
                ...finalOutput,
                citationEnforcement: {
                  action: enforcementResult.action,
                  totalCitations: enforcementResult.validation.totalCitations,
                  validCitations: enforcementResult.validation.valid.length,
                  hallucinatedCitations: enforcementResult.validation.hallucinated.length,
                  correctionsMade: enforcementResult.correctionsCount,
                  missingPageNumbers: enforcementResult.missingPageNumbersCount,
                  passRate: enforcementResult.validation.passRate,
                },
              };
            } else if (this.verbose) {
              console.log(`[Citation Enforcement] ${agent.key}: Skipped - no corpus chunks available`);
            }
          } catch (enforcementError) {
            console.error(`[Citation Enforcement] ${agent.key}: Error during enforcement:`, enforcementError);
            // Don't fail the agent - use original output
          }
        }

        // Update record
        record.endTime = Date.now();
        record.durationMs = record.endTime - record.startTime;
        record.status = 'success';
        record.output = finalOutput;

        // Store output
        this.state!.agentOutputs.set(agent.id, finalOutput);
        this.state!.completedAgents.add(agent.id);

        // Track context usage (PHASE-4-001)
        if (this.contextMonitoringEnabled) {
          this.contextMonitor.trackAgentExecution(agent.key, enhancedInputs, output);
        }

        const completedCount = this.state!.completedAgents.size;
        const progress = (completedCount / this.config.pipeline.totalAgents) * 100;

        // Emit step_completed event
        this.emitEvent({
          component: 'pipeline',
          operation: 'step_completed',
          status: 'success',
          durationMs: record.durationMs,
          metadata: {
            pipelineId: this.state!.pipelineId,
            stepId,
            stepName: agent.key,
            progress,
            completedSteps: completedCount,
            totalSteps: this.config.pipeline.totalAgents,
            validationAttempts: attempt + 1,
          },
        });

        // Emit agent_completed event for agent tracking
        this.emitEvent({
          component: 'agent',
          operation: 'agent_completed',
          status: 'success',
          durationMs: record.durationMs,
          metadata: {
            executionId: `agent_${agent.key}_${stepId}`,
            agentKey: agent.key,
            agentName: agent.name,
            agentCategory: phaseName,
            pipelineId: this.state!.pipelineId,
            outputPreview: 'Agent completed successfully',
            validationAttempts: attempt + 1,
          },
        });

        // Track in Shadow Vector
        if (this.tracker) {
          await this.tracker.record(record);
        }

        if (this.verbose) {
          console.log(
            `[PhD Pipeline] Agent #${agent.id} completed in ${record.durationMs}ms` +
              (attempt > 0 ? ` (after ${attempt + 1} attempts)` : '')
          );
        }

        return; // Success - exit the method

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // If this is already a CriticalAgentError, re-throw immediately
        if (error instanceof CriticalAgentError) {
          throw error;
        }

        // For execution errors (not validation), check if we should retry
        if (attempt < maxRetries) {
          if (this.verbose) {
            console.warn(
              `[PhD Pipeline] Agent #${agent.id} execution failed (attempt ${attempt + 1}/${maxRetries + 1}):`,
              lastError.message
            );
          }
          attempt++;
          continue;
        }

        // Out of retries - handle failure
        break;
      }
    }

    // All retries exhausted - record failure
    record.endTime = Date.now();
    record.durationMs = record.endTime - record.startTime;
    record.status = 'failed';
    record.error = lastError?.message ?? 'Unknown error';

    // Emit step_failed event
    this.emitEvent({
      component: 'pipeline',
      operation: 'step_failed',
      status: 'error',
      durationMs: record.durationMs,
      metadata: {
        pipelineId: this.state!.pipelineId,
        stepId,
        stepName: agent.key,
        error: record.error,
        attempts: attempt + 1,
      },
    });

    // Add to errors list
    this.state!.errors.push({
      agentId: agent.id,
      error: record.error,
    });

    // Track failure in Shadow Vector
    if (this.tracker) {
      await this.tracker.record(record);
    }

    // Critical agents halt the pipeline
    if (isCriticalAgent(agent)) {
      throw new CriticalAgentError(agent, lastError ?? 'Execution failed after retries');
    }

    if (this.verbose) {
      console.warn(`[PhD Pipeline] Agent #${agent.id} failed (non-critical): ${record.error}`);
    }
  }

  /**
   * Gather inputs from completed dependencies
   */
  private gatherInputs(agent: IAgentConfig): Record<string, unknown> {
    const inputs: Record<string, unknown> = {};

    for (const depId of agent.dependencies) {
      const depOutput = this.state!.agentOutputs.get(depId);
      if (depOutput) {
        // Merge dependency outputs into inputs
        Object.assign(inputs, depOutput);
      }
    }

    return inputs;
  }

  /**
   * Get the validator instance (for testing and configuration)
   */
  getValidator(): TieredValidator {
    return this.validator;
  }

  /**
   * Get the context health monitor (PHASE-4-001)
   */
  getContextMonitor(): ContextHealthMonitor {
    return this.contextMonitor;
  }

  /**
   * Get current context health (PHASE-4-001)
   */
  getContextHealth(): ContextHealth {
    return this.contextMonitor.getHealth();
  }

  /**
   * Get phase summaries generated during execution (PHASE-4-002)
   */
  getPhaseSummaries(): PhaseSummary[] {
    return [...this.phaseSummaries];
  }

  /**
   * Get context utilization breakdown by source
   */
  getContextBreakdown(): Array<{ source: string; tokens: number; percentage: number }> {
    return this.contextMonitor.getContentBreakdown();
  }

  // ==================== State & Progress ====================

  /**
   * Get current pipeline state
   */
  getState(): IPipelineState | null {
    return this.state;
  }

  /**
   * Get pipeline progress
   */
  getProgress(): IPipelineProgress | null {
    if (!this.state) return null;

    const completed = this.state.completedAgents.size;
    const total = this.config.pipeline.totalAgents;
    const elapsedMs = Date.now() - this.state.startTime;

    // Estimate remaining time based on average agent time
    let estimatedRemainingMs: number | undefined;
    if (completed > 0) {
      const avgTimePerAgent = elapsedMs / completed;
      estimatedRemainingMs = avgTimePerAgent * (total - completed);
    }

    return {
      completed,
      total,
      percentage: (completed / total) * 100,
      currentPhase: this.state.currentPhase,
      currentPhaseName: PHASE_NAMES[this.state.currentPhase] || 'Unknown',
      elapsedMs,
      estimatedRemainingMs,
    };
  }

  /**
   * Get agent output by ID
   */
  getAgentOutput(agentId: AgentId): Record<string, unknown> | undefined {
    return this.state?.agentOutputs.get(agentId);
  }

  /**
   * Get agent execution record
   */
  getAgentRecord(agentId: AgentId): IAgentExecutionRecord | undefined {
    return this.state?.executionRecords.get(agentId);
  }

  /**
   * Check if agent completed
   */
  isAgentCompleted(agentId: AgentId): boolean {
    return this.state?.completedAgents.has(agentId) ?? false;
  }

  // ==================== Configuration Access ====================

  /**
   * Get pipeline configuration
   */
  getConfig(): IPipelineConfig {
    return this.config;
  }

  /**
   * Get agent configuration by ID
   */
  getAgentConfig(agentId: AgentId): IAgentConfig | undefined {
    return this.config.agents.find(a => a.id === agentId);
  }

  /**
   * Get phase configuration by ID
   */
  getPhaseConfig(phaseId: number): IPhaseConfig | undefined {
    return this.config.phases.find(p => p.id === phaseId);
  }

  /**
   * Get all critical agents
   */
  getCriticalAgents(): IAgentConfig[] {
    return this.config.agents.filter(a => isCriticalAgent(a));
  }
}
