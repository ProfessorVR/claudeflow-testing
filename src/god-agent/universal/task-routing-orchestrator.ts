/**
 * TaskRoutingOrchestrator - Task routing, execution, and pipeline management
 *
 * Extracted from UniversalAgent (Phase 4b, SEAM-6).
 * Handles DAI-003 intelligent task routing, executeTaskDefault, and pipeline execution.
 */

import type { AgentRegistry } from '../core/agents/index.js';
import type { IAgentSelectionResult, IStructuredTask } from '../core/agents/index.js';
import { TaskExecutor } from '../core/agents/index.js';
import type {
  PipelineExecutor,
  IPipelineDefinition,
  DAI002PipelineOptions,
  DAI002PipelineResult,
} from '../core/pipeline/index.js';
import type {
  TaskAnalyzer,
  RoutingEngine,
  PipelineGenerator,
  RoutingLearner,
  ConfirmationHandler,
  IRoutingResult,
  IGeneratedPipeline,
  IRoutingFeedback,
} from '../core/routing/index.js';
import {
  getHookExecutor,
  type IHookContext,
  type IPostToolUseContext,
  type IHookChainResult,
} from '../core/hooks/index.js';
import type { ILLMProvider, CompletionRequest } from '../core/providers/index.js';
import { trackLocalFirstDecision } from '../core/router/index.js';
import { assessQuality, type QualityInteraction } from './quality-estimator.js';
import type { AgentMode, TaskExecutionResult, ITaskOptions, ITaskResult } from './universal-agent.js';

export interface TaskRoutingDeps {
  agentRegistry: AgentRegistry;
  taskAnalyzer: TaskAnalyzer;
  routingEngine: RoutingEngine;
  pipelineGenerator: PipelineGenerator;
  pipelineExecutor: PipelineExecutor;
  confirmationHandler: ConfirmationHandler;
  taskExecutor: TaskExecutor;
  routingLearner: RoutingLearner;
  vllmProvider: ILLMProvider | null;
  claudeProvider: ILLMProvider | null;
  modelRouterEnabled: boolean;
  config: { verbose: boolean; autoStoreThreshold: number };
  generateId: () => string;
  log: (...args: unknown[]) => void;
  ensureInitialized: () => Promise<void>;
  injectDESCEpisodes: (
    description: string,
    context?: { command?: string; mode?: AgentMode }
  ) => Promise<{ augmentedPrompt: string }>;
  storeDESCEpisode: (
    input: string,
    output: string,
    metadata?: { command?: string; mode?: AgentMode; quality?: number }
  ) => Promise<void>;
}

export class TaskRoutingOrchestrator {
  constructor(private deps: TaskRoutingDeps) {}

  /**
   * Execute a task using the default execution strategy with hooks and providers.
   *
   * Supports local-first routing (vLLM -> Claude -> Task tool fallback),
   * pre/post hook execution, and quality assessment.
   */
  async executeTaskDefault(
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
    const startTime = Date.now();
    const agent = agentSelection.selection.selected;
    const taskType = agentSelection.selection.analysis.taskType || 'unknown';
    const agentType = agent.frontmatter?.type ?? agent.category;
    const toolName = 'Task';

    const sessionId = this.deps.generateId();
    const trajectoryId = options?.trajectoryId;

    const hookExecutor = getHookExecutor();

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

    let preHookResult: IHookChainResult | undefined;
    let modifiedInput = agentSelection.prompt;
    try {
      preHookResult = await hookExecutor.executePreToolUseHooks(preHookContext);

      this.deps.log(`TASK-HOOK-006: preToolUseHooks executed`, {
        hooksExecuted: preHookResult.results.length,
        allSucceeded: preHookResult.allSucceeded,
        chainStopped: preHookResult.chainStopped,
        durationMs: preHookResult.totalDurationMs,
        trajectoryId,
      });

      if (preHookResult.chainStopped) {
        const stoppedBy = preHookResult.stoppedByHook ?? 'unknown';
        const stopReason = preHookResult.results.find(r => r.hookId === stoppedBy)?.result?.stopReason ?? 'Hook stopped execution';
        this.deps.log(`TASK-HOOK-006: Execution stopped by hook '${stoppedBy}': ${stopReason}`);

        return {
          result: `Task execution blocked by hook: ${stopReason}`,
          success: false,
          taskType,
          agentId: agent.key,
          durationMs: Date.now() - startTime,
          error: `Hook '${stoppedBy}' blocked execution: ${stopReason}`,
        };
      }

      if (preHookResult.finalInput !== undefined && typeof preHookResult.finalInput === 'object') {
        const finalInput = preHookResult.finalInput as { prompt?: string };
        if (finalInput.prompt) {
          modifiedInput = finalInput.prompt;
          this.deps.log(`TASK-HOOK-006: Hook modified prompt (DESC injection applied)`);
        }
      }
    } catch (hookError) {
      this.deps.log(`TASK-HOOK-006: preToolUseHooks error (continuing): ${hookError}`);
    }

    try {
      let result: string;
      let executionSuccess = true;

      const shouldUseProviders = (this.deps.modelRouterEnabled || options?.forceExecute) && (this.deps.vllmProvider || this.deps.claudeProvider) && !taskExecutionFn;

      if (shouldUseProviders) {
        this.deps.log(options?.forceExecute ? 'FORCE_EXECUTE: Using providers for direct execution' : 'LOCAL-FIRST: Attempting routed execution with providers');

        try {
          if (this.deps.vllmProvider) {
            this.deps.log('LOCAL-FIRST: Trying vLLM provider');
            const completionRequest: CompletionRequest = {
              prompt: modifiedInput,
              maxTokens: 4096,
              temperature: 0.7,
            };

            const response = await this.deps.vllmProvider.complete(completionRequest);

            if (response.success && response.text) {
              this.deps.log(`LOCAL-FIRST: vLLM succeeded (${response.latencyMs}ms)`);
              result = response.text;

              this.deps.log('LOCAL-FIRST: Successfully executed with vLLM');

              trackLocalFirstDecision('pure_local_verified', {
                triedLocal: true,
                localSucceeded: true,
                fellBackToClaude: false,
              });

              const durationMs = Date.now() - startTime;
              const qualityInteraction: QualityInteraction = {
                id: sessionId,
                mode: taskType as AgentMode,
                input: agentSelection.prompt,
                output: result,
                timestamp: Date.now(),
              };
              const qualityAssessment = assessQuality(qualityInteraction, this.deps.config.autoStoreThreshold);

              this.deps.log(`LOCAL-FIRST: Quality score ${qualityAssessment.score.toFixed(3)}`);

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

            this.deps.log(`LOCAL-FIRST: vLLM failed or returned empty, falling back to Claude`);
          }

          if (this.deps.claudeProvider) {
            this.deps.log('LOCAL-FIRST: Falling back to Claude provider');
            const completionRequest: CompletionRequest = {
              prompt: modifiedInput,
              maxTokens: 4096,
              temperature: 0.7,
            };

            const response = await this.deps.claudeProvider.complete(completionRequest);

            if (response.success && response.text) {
              this.deps.log(`LOCAL-FIRST: Claude succeeded (${response.latencyMs}ms)`);
              result = response.text;

              this.deps.log('LOCAL-FIRST: Fallback to Claude successful');

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
              const qualityAssessment = assessQuality(qualityInteraction, this.deps.config.autoStoreThreshold);

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

          this.deps.log('LOCAL-FIRST: All providers failed, falling back');
        } catch (providerError) {
          this.deps.log(`LOCAL-FIRST: Provider execution error: ${providerError}, falling back`);
        }
      }

      if (taskExecutionFn) {
        result = await taskExecutionFn(
          agentType,
          modifiedInput,
          { timeout: 120000 }
        );
      } else {
        const executionResult = await this.deps.taskExecutor.execute(
          agent,
          modifiedInput,
          async (_agentType: string, prompt: string, execOptions?: { timeout?: number }) => {
            const structuredTask: IStructuredTask = this.deps.taskExecutor.buildStructuredTask(
              agent,
              prompt,
              { timeout: execOptions?.timeout, trajectoryId }
            );

            if (this.deps.config.verbose) {
              console.log('\n================================================================================');
              console.log('CLAUDE_CODE_TASK_START');
              console.log('================================================================================');
              console.log(JSON.stringify(structuredTask, null, 2));
              console.log('================================================================================');
              console.log('CLAUDE_CODE_TASK_END');
              console.log('================================================================================\n');
            }

            this.deps.log(`TASK-EXEC-001: Structured task output for Claude Code execution`, {
              taskId: structuredTask.taskId,
              agentType: structuredTask.agentType,
              agentKey: structuredTask.agentKey,
              promptLength: prompt.length,
            });

            return `[TASK_QUEUED:${structuredTask.taskId}] Execute via Claude Code Task tool with subagent_type="${structuredTask.agentType}"`;
          },
          { context: agentSelection.context }
        );
        result = executionResult.output;
      }

      const durationMs = Date.now() - startTime;

      const qualityInteraction: QualityInteraction = {
        id: sessionId,
        mode: taskType as AgentMode,
        input: agentSelection.prompt,
        output: result,
        timestamp: Date.now(),
      };
      const qualityAssessment = assessQuality(qualityInteraction, this.deps.config.autoStoreThreshold);
      const qualityScore = qualityAssessment.score;

      this.deps.log(`TASK-HOOK-006: Quality assessment`, {
        qualityScore: qualityScore.toFixed(3),
        meetsThreshold: qualityAssessment.meetsThreshold,
        threshold: this.deps.config.autoStoreThreshold,
        trajectoryId,
        sessionId,
      });

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

      try {
        const postHookResult = await hookExecutor.executePostToolUseHooks(postHookContext);

        this.deps.log(`TASK-HOOK-006: postToolUseHooks executed`, {
          hooksExecuted: postHookResult.results.length,
          allSucceeded: postHookResult.allSucceeded,
          durationMs: postHookResult.totalDurationMs,
          trajectoryId,
          qualityScore: qualityScore.toFixed(3),
        });
      } catch (hookError) {
        this.deps.log(`TASK-HOOK-006: postToolUseHooks error (continuing): ${hookError}`);
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
      this.deps.log(`TASK-LEARN-007: Task execution failed: ${errorMessage}`);

      try {
        const postHookContext: IPostToolUseContext = {
          toolName,
          toolInput: preHookContext.toolInput,
          toolOutput: {
            result: errorMessage,
            success: false,
            error: errorMessage,
            qualityScore: 0,
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

        this.deps.log(`TASK-HOOK-006: postToolUseHooks executed (failure path)`, {
          hooksExecuted: postHookResult.results.length,
          trajectoryId,
          qualityScore: 0,
        });
      } catch (hookError) {
        this.deps.log(`TASK-HOOK-006: postToolUseHooks error on failure path: ${hookError}`);
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

  /**
   * Execute a multi-agent sequential pipeline (DAI-002)
   */
  async runPipeline(
    pipeline: IPipelineDefinition,
    options: DAI002PipelineOptions = {}
  ): Promise<DAI002PipelineResult> {
    await this.deps.ensureInitialized();

    this.deps.log(`DAI-002: Starting pipeline '${pipeline.name}' with ${pipeline.agents.length} steps`);

    try {
      const result = await this.deps.pipelineExecutor.execute(pipeline, options);

      if (result.status === 'completed') {
        this.deps.log(`DAI-002: Pipeline '${pipeline.name}' completed successfully`);
        this.deps.log(`  - Steps: ${result.steps.length}/${pipeline.agents.length}`);
        this.deps.log(`  - Overall quality: ${result.overallQuality.toFixed(2)}`);
        this.deps.log(`  - Duration: ${result.totalDuration}ms`);
      } else {
        this.deps.log(`DAI-002: Pipeline '${pipeline.name}' failed at step ${result.steps.length}`);
        if (result.error) {
          this.deps.log(`  - Error: ${result.error.message}`);
        }
      }

      return result;
    } catch (error) {
      this.deps.log(`DAI-002: Pipeline '${pipeline.name}' threw error: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Execute task with intelligent routing (DAI-003)
   */
  async task(description: string, options: ITaskOptions = {}): Promise<ITaskResult> {
    await this.deps.ensureInitialized();

    const startTime = Date.now();
    let routing: IRoutingResult;
    let pipeline: IGeneratedPipeline | undefined;
    let agentUsed: string;
    let result: string;

    // DESC: Inject prior solutions before processing
    const descResult = await this.deps.injectDESCEpisodes(description, { command: 'god-task', mode: 'general' });
    const augmentedDescription = descResult.augmentedPrompt;

    // Step 1: Check for explicit agent override FIRST
    if (options.agent) {
      this.deps.log(`DAI-003 task(): Using explicit agent override: ${options.agent}`);

      const agentDef = this.deps.agentRegistry.getByKey(options.agent);
      if (!agentDef) {
        throw new Error(`Agent '${options.agent}' not found in registry`);
      }

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
        routingId: this.deps.generateId(),
      };
      agentUsed = options.agent;
    } else {
      // Step 2: Analyze the task
      this.deps.log(`DAI-003 task(): Analyzing task...`);
      const analysis = await this.deps.taskAnalyzer.analyze(augmentedDescription);

      // Step 3: Route via RoutingEngine
      this.deps.log(`DAI-003 task(): Routing via RoutingEngine...`);
      routing = await this.deps.routingEngine.route(analysis);
      agentUsed = routing.selectedAgent;

      this.deps.log(`DAI-003 task(): Routed to '${agentUsed}' (confidence: ${routing.confidence.toFixed(2)})`);
      if (routing.isColdStart) {
        this.deps.log(`  ${routing.coldStartIndicator}`);
      }

      // Step 4: Check if multi-step task (pipeline generation)
      if (analysis.isMultiStep) {
        this.deps.log(`DAI-003 task(): Multi-step task detected, generating pipeline...`);
        try {
          pipeline = await this.deps.pipelineGenerator.generate(description);
          this.deps.log(`DAI-003 task(): Pipeline generated with ${pipeline.stages.length} stages`);
        } catch (error) {
          this.deps.log(`Warning: Pipeline generation failed: ${error}. Falling back to single-step execution.`);
          pipeline = undefined;
        }
      }
    }

    // Step 5: Handle low-confidence confirmation
    if (!options.skipConfirmation && routing.requiresConfirmation) {
      this.deps.log(`DAI-003 task(): Low confidence (${routing.confidence.toFixed(2)}), requesting confirmation...`);

      try {
        const confirmation = await this.deps.confirmationHandler.requestConfirmation(routing);

        if (confirmation.selectedKey !== routing.selectedAgent && !confirmation.wasCancelled) {
          this.deps.log(`DAI-003 task(): User overrode to agent: ${confirmation.selectedKey}`);
          agentUsed = confirmation.selectedKey;

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
        this.deps.log(`Warning: Confirmation failed: ${error}. Proceeding with original routing.`);
      }
    }

    // Step 6: Execute the task
    let executionSuccess = true;
    let executionError: string | undefined;

    try {
      if (pipeline) {
        this.deps.log(`DAI-003 task(): Executing pipeline with ${pipeline.stages.length} stages...`);

        const pipelineDefinition: IPipelineDefinition = {
          name: `DAI-003: ${description.substring(0, 50)}`,
          description: description,
          sequential: true,
          agents: pipeline.stages.map((stage) => ({
            agentKey: stage.agentKey,
            task: stage.taskSegment,
            outputDomain: stage.outputDomain,
            outputTags: ['dai-003', stage.agentKey],
            timeout: 60000,
          })),
        };

        const pipelineResult = await this.deps.pipelineExecutor.execute(pipelineDefinition);

        if (pipelineResult.status === 'failed') {
          executionSuccess = false;
          executionError = pipelineResult.error?.message;
          result = `Pipeline execution failed: ${pipelineResult.error?.message ?? 'Unknown error'}`;
        } else {
          result = `Pipeline completed successfully. ${pipelineResult.steps.length}/${pipeline.stages.length} stages completed.`;
        }
      } else {
        this.deps.log(`DAI-003 task(): Executing task with agent '${agentUsed}'...`);

        const agent = this.deps.agentRegistry.getByKey(agentUsed);
        if (!agent) {
          throw new Error(`Agent '${agentUsed}' not found in registry`);
        }

        const taskTrajectoryId = `traj-task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const executionResult = await this.deps.taskExecutor.execute(
          agent,
          description,
          async (_agentType: string, prompt: string, execOptions?: { timeout?: number }) => {
            const structuredTask: IStructuredTask = this.deps.taskExecutor.buildStructuredTask(
              agent,
              prompt,
              { timeout: execOptions?.timeout, trajectoryId: taskTrajectoryId }
            );

            if (this.deps.config.verbose) {
              console.log('\n================================================================================');
              console.log('CLAUDE_CODE_TASK_START');
              console.log('================================================================================');
              console.log(JSON.stringify(structuredTask, null, 2));
              console.log('================================================================================');
              console.log('CLAUDE_CODE_TASK_END');
              console.log('================================================================================\n');
            }

            this.deps.log(`DAI-003 task(): Structured task output for Claude Code`, {
              taskId: structuredTask.taskId,
              agentType: structuredTask.agentType,
              agentKey: structuredTask.agentKey,
            });

            return `[TASK_QUEUED:${structuredTask.taskId}] Execute via Claude Code Task tool with subagent_type="${structuredTask.agentType}"`;
          }
        );
        result = executionResult.output;
      }
    } catch (error) {
      executionSuccess = false;
      executionError = error instanceof Error ? error.message : String(error);
      result = `Task execution failed: ${executionError}`;
      this.deps.log(`DAI-003 task(): Execution failed: ${executionError}`);
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

      await this.deps.routingLearner.processFeedback(feedback);
      this.deps.log(`DAI-003 task(): Feedback submitted to RoutingLearner`);
    } catch (error) {
      this.deps.log(`Warning: Failed to submit routing feedback: ${error}`);
    }

    // DESC: Store episode for future learning
    if (executionSuccess) {
      this.deps.storeDESCEpisode(description, result, {
        command: 'god-task',
        mode: 'general',
        quality: 0.8,
      }).catch(err => this.deps.log(`DESC: Background storage error: ${err}`));
    }

    return {
      result,
      routing,
      pipeline,
      executionTimeMs,
      agentUsed,
    };
  }
}
