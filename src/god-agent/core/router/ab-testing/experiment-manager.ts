/**
 * A/B Testing Experiment Manager
 *
 * Implements Phase 6.2: A/B Testing Between Models
 *
 * Provides:
 * - Experiment lifecycle management
 * - Task assignment to treatment groups
 * - Paired outcome recording
 * - Automatic completion detection
 * - Results caching and retrieval
 */

import { randomUUID } from 'crypto';
import type {
  ExperimentConfig,
  ExperimentState,
  ExperimentStatus,
  ExperimentSummary,
  ExperimentResults,
  PairedOutcome,
  ModelOutcome,
  Winner,
  CreateExperimentInput,
  ExperimentQuery,
  ExperimentEvent,
  ExperimentEventHandler,
} from './types.js';
import {
  StatisticalAnalyzer,
  getStatisticalAnalyzer,
} from './statistical-analyzer.js';
import type { TaskType, Complexity, ProviderType } from '../router-types.js';

// ===== CONFIGURATION =====

/**
 * Configuration for the experiment manager
 */
export interface ExperimentManagerConfig {
  /** Maximum experiments to store */
  maxExperiments?: number;
  /** Maximum outcomes per experiment */
  maxOutcomesPerExperiment?: number;
  /** Auto-complete when max samples reached */
  autoComplete?: boolean;
  /** Perform interim analysis every N samples */
  interimAnalysisInterval?: number;
  /** Persist experiments to storage */
  persist?: boolean;
  /** Storage path for persistence */
  storagePath?: string;
}

const DEFAULT_CONFIG: Required<ExperimentManagerConfig> = {
  maxExperiments: 100,
  maxOutcomesPerExperiment: 10000,
  autoComplete: true,
  interimAnalysisInterval: 25,
  persist: false,
  storagePath: '.god-agent/experiments.json',
};

const DEFAULT_EXPERIMENT_SETTINGS = {
  samplingRate: 100,
  minSamplesPerModel: 25,
  significanceLevel: 0.05,
};

// ===== EXPERIMENT MANAGER =====

/**
 * Manages A/B testing experiments
 */
export class ExperimentManager {
  private readonly config: Required<ExperimentManagerConfig>;
  private readonly analyzer: StatisticalAnalyzer;
  private readonly experiments: Map<string, ExperimentState> = new Map();
  private readonly outcomes: Map<string, PairedOutcome[]> = new Map();
  private readonly eventHandlers: Set<ExperimentEventHandler> = new Set();

  constructor(
    config: ExperimentManagerConfig = {},
    analyzer?: StatisticalAnalyzer
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.analyzer = analyzer ?? getStatisticalAnalyzer();
  }

  // ===== EXPERIMENT LIFECYCLE =====

  /**
   * Create a new experiment
   */
  createExperiment(input: CreateExperimentInput): ExperimentState {
    const id = randomUUID();
    const now = new Date();

    const config: ExperimentConfig = {
      id,
      name: input.name,
      description: input.description,
      modelA: input.modelA,
      modelB: input.modelB,
      taskTypes: input.taskTypes ?? [],
      complexities: input.complexities ?? [],
      samplingRate: input.samplingRate ?? DEFAULT_EXPERIMENT_SETTINGS.samplingRate,
      minSamplesPerModel: input.minSamplesPerModel ?? DEFAULT_EXPERIMENT_SETTINGS.minSamplesPerModel,
      maxSamples: input.maxSamples,
      significanceLevel: input.significanceLevel ?? DEFAULT_EXPERIMENT_SETTINGS.significanceLevel,
      createdAt: now,
      endDate: input.endDate,
      tags: input.tags ?? [],
    };

    const state: ExperimentState = {
      config,
      status: 'draft',
      totalTasksSeen: 0,
      modelASamples: 0,
      modelBSamples: 0,
      lastActivity: now,
      statusChangedAt: now,
    };

    this.experiments.set(id, state);
    this.outcomes.set(id, []);

    this.emit({
      type: 'experiment_created',
      experimentId: id,
      timestamp: now,
      data: { name: config.name, modelA: config.modelA, modelB: config.modelB },
    });

    return state;
  }

  /**
   * Start an experiment
   */
  startExperiment(experimentId: string): ExperimentState {
    const state = this.getExperimentState(experimentId);
    if (!state) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    if (state.status !== 'draft' && state.status !== 'paused') {
      throw new Error(`Cannot start experiment in status: ${state.status}`);
    }

    const now = new Date();
    state.status = 'running';
    state.statusChangedAt = now;
    state.lastActivity = now;
    if (!state.config.startedAt) {
      state.config.startedAt = now;
    }

    this.emit({
      type: 'experiment_started',
      experimentId,
      timestamp: now,
      data: {},
    });

    return state;
  }

  /**
   * Pause an experiment
   */
  pauseExperiment(experimentId: string): ExperimentState {
    const state = this.getExperimentState(experimentId);
    if (!state) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    if (state.status !== 'running') {
      throw new Error(`Cannot pause experiment in status: ${state.status}`);
    }

    const now = new Date();
    state.status = 'paused';
    state.statusChangedAt = now;
    state.lastActivity = now;

    this.emit({
      type: 'experiment_paused',
      experimentId,
      timestamp: now,
      data: {},
    });

    return state;
  }

  /**
   * Resume a paused experiment
   */
  resumeExperiment(experimentId: string): ExperimentState {
    return this.startExperiment(experimentId);
  }

  /**
   * Complete an experiment and calculate results
   */
  completeExperiment(experimentId: string): ExperimentResults {
    const state = this.getExperimentState(experimentId);
    if (!state) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    const outcomes = this.outcomes.get(experimentId) ?? [];
    const results = this.analyzer.analyze(
      experimentId,
      outcomes,
      { significanceLevel: state.config.significanceLevel }
    );

    const now = new Date();
    state.status = 'completed';
    state.statusChangedAt = now;
    state.lastActivity = now;
    state.results = results;

    this.emit({
      type: 'experiment_completed',
      experimentId,
      timestamp: now,
      data: { winner: results.winner, confidence: results.confidence },
    });

    return results;
  }

  /**
   * Cancel an experiment
   */
  cancelExperiment(experimentId: string, reason?: string): ExperimentState {
    const state = this.getExperimentState(experimentId);
    if (!state) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    if (state.status === 'completed') {
      throw new Error('Cannot cancel a completed experiment');
    }

    const now = new Date();
    state.status = 'cancelled';
    state.statusChangedAt = now;
    state.lastActivity = now;
    if (reason) {
      state.lastError = reason;
    }

    this.emit({
      type: 'experiment_cancelled',
      experimentId,
      timestamp: now,
      data: { reason },
    });

    return state;
  }

  /**
   * Delete an experiment
   */
  deleteExperiment(experimentId: string): boolean {
    const exists = this.experiments.has(experimentId);
    this.experiments.delete(experimentId);
    this.outcomes.delete(experimentId);
    return exists;
  }

  // ===== TASK ASSIGNMENT =====

  /**
   * Check if a task should be included in an experiment
   */
  shouldIncludeTask(
    experimentId: string,
    taskType: TaskType,
    complexity: Complexity
  ): boolean {
    const state = this.getExperimentState(experimentId);
    if (!state || state.status !== 'running') {
      return false;
    }

    const config = state.config;

    // Check task type filter
    if (config.taskTypes && config.taskTypes.length > 0) {
      if (!config.taskTypes.includes(taskType)) {
        return false;
      }
    }

    // Check complexity filter
    if (config.complexities && config.complexities.length > 0) {
      if (!config.complexities.includes(complexity)) {
        return false;
      }
    }

    // Check sampling rate
    if (config.samplingRate < 100) {
      if (Math.random() * 100 > config.samplingRate) {
        return false;
      }
    }

    // Check max samples
    if (config.maxSamples !== undefined) {
      const totalSamples = state.modelASamples + state.modelBSamples;
      if (totalSamples >= config.maxSamples) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get which model to assign for a task (randomized)
   */
  assignModel(experimentId: string): 'model_a' | 'model_b' | null {
    const state = this.getExperimentState(experimentId);
    if (!state || state.status !== 'running') {
      return null;
    }

    // Update task counter
    state.totalTasksSeen++;
    state.lastActivity = new Date();

    // Random assignment
    return Math.random() < 0.5 ? 'model_a' : 'model_b';
  }

  /**
   * Get the model ID for an assignment
   */
  getModelId(experimentId: string, assignment: 'model_a' | 'model_b'): string | null {
    const state = this.getExperimentState(experimentId);
    if (!state) return null;

    return assignment === 'model_a' ? state.config.modelA : state.config.modelB;
  }

  // ===== OUTCOME RECORDING =====

  /**
   * Record a paired outcome
   */
  recordOutcome(
    experimentId: string,
    promptSummary: string,
    taskType: TaskType,
    complexity: Complexity,
    modelAResult: ModelOutcome,
    modelBResult: ModelOutcome
  ): PairedOutcome {
    const state = this.getExperimentState(experimentId);
    if (!state) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    const outcomes = this.outcomes.get(experimentId) ?? [];

    // Determine winner for this pair
    const qualityA = this.calculateQuality(modelAResult);
    const qualityB = this.calculateQuality(modelBResult);
    let winner: Winner;
    if (Math.abs(qualityA - qualityB) < 0.01) {
      winner = 'tie';
    } else {
      winner = qualityA > qualityB ? 'model_a' : 'model_b';
    }

    const outcome: PairedOutcome = {
      id: randomUUID(),
      experimentId,
      taskHash: this.hashTask(promptSummary, taskType),
      promptSummary: promptSummary.slice(0, 200),
      taskType,
      complexity,
      timestamp: new Date(),
      modelAResult,
      modelBResult,
      winner,
      qualityDelta: qualityA - qualityB,
      latencyDelta: modelAResult.latencyMs - modelBResult.latencyMs,
      costDelta: modelAResult.cost - modelBResult.cost,
    };

    outcomes.push(outcome);
    this.outcomes.set(experimentId, outcomes);

    // Update counters
    state.modelASamples++;
    state.modelBSamples++;
    state.lastActivity = new Date();

    this.emit({
      type: 'sample_recorded',
      experimentId,
      timestamp: new Date(),
      data: { outcomeId: outcome.id, winner },
    });

    // Check for auto-complete
    this.checkAutoComplete(experimentId, state, outcomes);

    // Perform interim analysis if interval reached
    this.checkInterimAnalysis(experimentId, state, outcomes);

    return outcome;
  }

  /**
   * Record a single model outcome (for sequential testing)
   */
  recordSingleOutcome(
    experimentId: string,
    assignment: 'model_a' | 'model_b',
    promptSummary: string,
    taskType: TaskType,
    complexity: Complexity,
    result: ModelOutcome
  ): void {
    const state = this.getExperimentState(experimentId);
    if (!state) {
      throw new Error(`Experiment not found: ${experimentId}`);
    }

    // Update counters
    if (assignment === 'model_a') {
      state.modelASamples++;
    } else {
      state.modelBSamples++;
    }
    state.lastActivity = new Date();
  }

  // ===== QUERIES =====

  /**
   * Get experiment state
   */
  getExperimentState(experimentId: string): ExperimentState | null {
    return this.experiments.get(experimentId) ?? null;
  }

  /**
   * Get experiment by ID
   */
  getExperiment(experimentId: string): ExperimentState | null {
    return this.getExperimentState(experimentId);
  }

  /**
   * Get all experiments
   */
  getAllExperiments(): ExperimentState[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Query experiments
   */
  queryExperiments(query: ExperimentQuery = {}): ExperimentState[] {
    let results = Array.from(this.experiments.values());

    if (query.status && query.status.length > 0) {
      results = results.filter(e => query.status!.includes(e.status));
    }

    if (query.model) {
      results = results.filter(
        e => e.config.modelA === query.model || e.config.modelB === query.model
      );
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(e =>
        query.tags!.some(tag => e.config.tags?.includes(tag))
      );
    }

    if (query.createdAfter) {
      results = results.filter(e => e.config.createdAt >= query.createdAfter!);
    }

    if (query.createdBefore) {
      results = results.filter(e => e.config.createdAt <= query.createdBefore!);
    }

    // Sort by creation date descending
    results.sort((a, b) => b.config.createdAt.getTime() - a.config.createdAt.getTime());

    // Apply pagination
    const offset = query.offset ?? 0;
    const limit = query.limit ?? results.length;
    return results.slice(offset, offset + limit);
  }

  /**
   * Get running experiments
   */
  getRunningExperiments(): ExperimentState[] {
    return this.queryExperiments({ status: ['running'] });
  }

  /**
   * Get experiment outcomes
   */
  getOutcomes(experimentId: string): PairedOutcome[] {
    return this.outcomes.get(experimentId) ?? [];
  }

  /**
   * Get experiment results
   */
  getResults(experimentId: string): ExperimentResults | null {
    const state = this.getExperimentState(experimentId);
    if (!state) return null;

    if (state.results) {
      return state.results;
    }

    // Calculate results on demand
    const outcomes = this.outcomes.get(experimentId) ?? [];
    if (outcomes.length === 0) {
      return null;
    }

    return this.analyzer.analyze(
      experimentId,
      outcomes,
      { significanceLevel: state.config.significanceLevel }
    );
  }

  /**
   * Get experiment summary
   */
  getSummary(experimentId: string): ExperimentSummary | null {
    const state = this.getExperimentState(experimentId);
    if (!state) return null;

    const totalSamples = state.modelASamples + state.modelBSamples;
    const targetSamples = state.config.maxSamples ?? state.config.minSamplesPerModel * 2;
    const progress = Math.min(100, (totalSamples / targetSamples) * 100);

    // Determine current winner from outcomes
    const outcomes = this.outcomes.get(experimentId) ?? [];
    let currentWinner: Winner = 'inconclusive';
    if (outcomes.length > 0) {
      const aWins = outcomes.filter(o => o.winner === 'model_a').length;
      const bWins = outcomes.filter(o => o.winner === 'model_b').length;
      if (aWins > bWins * 1.2) currentWinner = 'model_a';
      else if (bWins > aWins * 1.2) currentWinner = 'model_b';
      else currentWinner = 'tie';
    }

    return {
      id: state.config.id,
      name: state.config.name,
      status: state.status,
      modelA: state.config.modelA,
      modelB: state.config.modelB,
      totalSamples,
      currentWinner,
      progress,
    };
  }

  /**
   * Get all summaries
   */
  getAllSummaries(): ExperimentSummary[] {
    return Array.from(this.experiments.keys())
      .map(id => this.getSummary(id))
      .filter((s): s is ExperimentSummary => s !== null);
  }

  // ===== EVENTS =====

  /**
   * Subscribe to experiment events
   */
  on(handler: ExperimentEventHandler): () => void {
    this.eventHandlers.add(handler);
    return () => this.eventHandlers.delete(handler);
  }

  // ===== PRIVATE =====

  /**
   * Calculate quality score for outcome
   */
  private calculateQuality(outcome: ModelOutcome): number {
    let score = 0;
    let weights = 0;

    // Base success
    if (outcome.success) score += 0.3;
    weights += 0.3;

    // User rating
    if (outcome.userRating !== undefined) {
      score += ((outcome.userRating - 1) / 4) * 0.3;
      weights += 0.3;
    }

    // User acceptance
    if (outcome.userAccepted !== undefined) {
      if (outcome.userAccepted) score += 0.25;
      weights += 0.25;
    }

    // Tests
    if (outcome.testsPass !== undefined) {
      if (outcome.testsPass) score += 0.15;
      weights += 0.15;
    }

    return weights > 0 ? score / weights : 0;
  }

  /**
   * Hash task for grouping
   */
  private hashTask(prompt: string, taskType: TaskType): string {
    const str = `${taskType}:${prompt.toLowerCase().slice(0, 100)}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }

  /**
   * Check if experiment should auto-complete
   */
  private checkAutoComplete(
    experimentId: string,
    state: ExperimentState,
    outcomes: PairedOutcome[]
  ): void {
    if (!this.config.autoComplete) return;

    const { maxSamples, minSamplesPerModel, endDate } = state.config;

    // Check max samples
    if (maxSamples !== undefined && outcomes.length >= maxSamples) {
      this.completeExperiment(experimentId);
      return;
    }

    // Check end date
    if (endDate !== undefined && new Date() >= endDate) {
      if (outcomes.length >= minSamplesPerModel * 2) {
        this.completeExperiment(experimentId);
      }
      return;
    }

    // Check if significance reached
    if (outcomes.length >= minSamplesPerModel * 2) {
      if (this.analyzer.hasReachedSignificance(outcomes, state.config.significanceLevel)) {
        this.completeExperiment(experimentId);
      }
    }
  }

  /**
   * Check if interim analysis should run
   */
  private checkInterimAnalysis(
    experimentId: string,
    state: ExperimentState,
    outcomes: PairedOutcome[]
  ): void {
    const interval = this.config.interimAnalysisInterval;
    if (outcomes.length % interval === 0 && outcomes.length > 0) {
      const interimResults = this.analyzer.interimAnalysis(experimentId, outcomes, {
        significanceLevel: state.config.significanceLevel,
        includeInterim: true,
      });

      this.emit({
        type: 'interim_analysis',
        experimentId,
        timestamp: new Date(),
        data: {
          samples: outcomes.length,
          currentWinner: interimResults.winner,
          confidence: interimResults.confidence,
        },
      });
    }
  }

  /**
   * Emit an event
   */
  private emit(event: ExperimentEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch {
        // Ignore handler errors
      }
    }
  }
}

// ===== SINGLETON =====

let managerInstance: ExperimentManager | null = null;

/**
 * Get or create the singleton ExperimentManager
 */
export function getExperimentManager(config?: ExperimentManagerConfig): ExperimentManager {
  if (!managerInstance) {
    managerInstance = new ExperimentManager(config);
  }
  return managerInstance;
}

/**
 * Initialize the experiment manager
 */
export function initializeExperimentManager(config: ExperimentManagerConfig): ExperimentManager {
  managerInstance = new ExperimentManager(config);
  return managerInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetExperimentManager(): void {
  managerInstance = null;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Create a quick A/B test
 */
export function createQuickTest(
  name: string,
  modelA: string,
  modelB: string,
  samples: number = 50
): ExperimentState {
  return getExperimentManager().createExperiment({
    name,
    modelA,
    modelB,
    minSamplesPerModel: Math.ceil(samples / 2),
    maxSamples: samples,
  });
}

/**
 * Format experiment status for display
 */
export function formatExperimentStatus(state: ExperimentState): string {
  const totalSamples = state.modelASamples + state.modelBSamples;
  const statusIcon = {
    draft: '\u{1F4DD}',
    running: '\u{25B6}\u{FE0F}',
    paused: '\u{23F8}\u{FE0F}',
    completed: '\u2705',
    cancelled: '\u274C',
    failed: '\u{1F6A8}',
  }[state.status];

  return `${statusIcon} ${state.config.name}: ${state.config.modelA} vs ${state.config.modelB} (${totalSamples} samples, ${state.status})`;
}

/**
 * Format experiment summary for display
 */
export function formatExperimentSummary(summary: ExperimentSummary): string {
  const winnerLabel = summary.currentWinner === 'model_a' ? summary.modelA :
                      summary.currentWinner === 'model_b' ? summary.modelB :
                      summary.currentWinner === 'tie' ? 'Tie' : 'TBD';

  return [
    `Experiment: ${summary.name}`,
    `Status: ${summary.status}`,
    `Models: ${summary.modelA} vs ${summary.modelB}`,
    `Samples: ${summary.totalSamples}`,
    `Progress: ${summary.progress.toFixed(1)}%`,
    `Current Leader: ${winnerLabel}`,
  ].join('\n');
}
