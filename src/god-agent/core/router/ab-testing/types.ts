/**
 * A/B Testing Types
 *
 * Implements Phase 6.2: A/B Testing Between Models
 *
 * Provides type definitions for:
 * - Experiment configuration and state
 * - Paired test execution
 * - Statistical analysis results
 */

import type { TaskType, Complexity, ProviderType } from '../router-types.js';

// ===== EXPERIMENT STATUS =====

/**
 * Status of an A/B test experiment
 */
export type ExperimentStatus =
  | 'draft'      // Created but not started
  | 'running'    // Actively collecting data
  | 'paused'     // Temporarily stopped
  | 'completed'  // Finished with results
  | 'cancelled'  // Terminated early
  | 'failed';    // Error during execution

/**
 * Winner determination
 */
export type Winner = 'model_a' | 'model_b' | 'tie' | 'inconclusive';

// ===== EXPERIMENT CONFIGURATION =====

/**
 * Configuration for an A/B test experiment
 */
export interface ExperimentConfig {
  /** Unique experiment ID */
  id: string;
  /** Human-readable name */
  name: string;
  /** Description of what's being tested */
  description?: string;

  // Models to compare
  /** First model (control) */
  modelA: string;
  /** Second model (treatment) */
  modelB: string;

  // Targeting
  /** Task types to include (empty = all) */
  taskTypes?: TaskType[];
  /** Complexity levels to include (empty = all) */
  complexities?: Complexity[];
  /** Percentage of matching tasks to include (0-100) */
  samplingRate: number;

  // Sample size
  /** Minimum samples per model before analysis */
  minSamplesPerModel: number;
  /** Maximum total samples (experiment auto-completes) */
  maxSamples?: number;

  // Statistical settings
  /** Significance level (default 0.05 = 95% confidence) */
  significanceLevel: number;
  /** Minimum effect size to detect */
  minEffectSize?: number;
  /** Statistical power (default 0.8 = 80%) */
  statisticalPower?: number;

  // Timing
  /** When the experiment was created */
  createdAt: Date;
  /** When the experiment started */
  startedAt?: Date;
  /** When to auto-stop (optional) */
  endDate?: Date;

  /** Creator of the experiment */
  createdBy?: string;
  /** Tags for organization */
  tags?: string[];
}

// ===== EXPERIMENT STATE =====

/**
 * Runtime state of an experiment
 */
export interface ExperimentState {
  /** Experiment configuration */
  config: ExperimentConfig;
  /** Current status */
  status: ExperimentStatus;

  // Counters
  /** Total tasks seen matching criteria */
  totalTasksSeen: number;
  /** Tasks assigned to model A */
  modelASamples: number;
  /** Tasks assigned to model B */
  modelBSamples: number;

  // Timing
  /** Last activity timestamp */
  lastActivity: Date;
  /** When status last changed */
  statusChangedAt: Date;

  // Error tracking
  /** Last error if status is 'failed' */
  lastError?: string;

  // Results (populated when completed)
  /** Final analysis results */
  results?: ExperimentResults;
}

// ===== PAIRED OUTCOME =====

/**
 * Outcome from a paired test (same task run on both models)
 */
export interface PairedOutcome {
  /** Unique outcome ID */
  id: string;
  /** Experiment ID */
  experimentId: string;
  /** Task hash for grouping */
  taskHash: string;
  /** Original prompt (truncated) */
  promptSummary: string;
  /** Task type */
  taskType: TaskType;
  /** Complexity */
  complexity: Complexity;
  /** Timestamp */
  timestamp: Date;

  // Model A results
  modelAResult: ModelOutcome;
  // Model B results
  modelBResult: ModelOutcome;

  // Comparison
  /** Which model performed better on this task */
  winner: Winner;
  /** Quality score difference (A - B) */
  qualityDelta: number;
  /** Response time difference in ms (A - B) */
  latencyDelta: number;
  /** Cost difference in USD (A - B) */
  costDelta: number;
}

/**
 * Single model outcome within a paired test
 */
export interface ModelOutcome {
  /** Model ID */
  model: string;
  /** Provider type */
  provider: ProviderType;

  // Quality metrics
  /** Whether task completed successfully */
  success: boolean;
  /** User rating if available */
  userRating?: 1 | 2 | 3 | 4 | 5;
  /** Whether user accepted result */
  userAccepted?: boolean;
  /** Whether tests passed */
  testsPass?: boolean;

  // Performance metrics
  /** Response time in ms */
  latencyMs: number;
  /** Total tokens used */
  tokensUsed: number;
  /** Cost in USD */
  cost: number;

  // Error if failed
  error?: string;
}

// ===== STATISTICAL RESULTS =====

/**
 * Statistical analysis results
 */
export interface StatisticalResults {
  // Sample sizes
  /** Samples for model A */
  nA: number;
  /** Samples for model B */
  nB: number;

  // Descriptive stats for quality
  /** Mean quality score for model A */
  meanQualityA: number;
  /** Mean quality score for model B */
  meanQualityB: number;
  /** Standard deviation for model A */
  stdQualityA: number;
  /** Standard deviation for model B */
  stdQualityB: number;

  // Descriptive stats for success rate
  /** Success rate for model A */
  successRateA: number;
  /** Success rate for model B */
  successRateB: number;

  // Effect sizes
  /** Difference in means (A - B) */
  meanDifference: number;
  /** Cohen's d effect size */
  cohensD: number;

  // Statistical tests
  /** T-test p-value for quality difference */
  tTestPValue: number;
  /** Mann-Whitney U test p-value */
  mannWhitneyPValue: number;
  /** Chi-square p-value for success rates */
  chiSquarePValue: number;

  // Confidence intervals
  /** 95% CI for mean difference [lower, upper] */
  confidenceInterval: [number, number];

  // Interpretation
  /** Whether difference is statistically significant */
  isSignificant: boolean;
  /** Confidence level achieved */
  confidenceLevel: number;
  /** Power of the test */
  achievedPower: number;
}

/**
 * Complete experiment results
 */
export interface ExperimentResults {
  /** Experiment ID */
  experimentId: string;
  /** When analysis was performed */
  analyzedAt: Date;

  // Summary
  /** Winning model */
  winner: Winner;
  /** Recommendation based on results */
  recommendation: string;
  /** Overall confidence in result (0-1) */
  confidence: number;

  // Statistical results
  /** Full statistical analysis */
  statistics: StatisticalResults;

  // Comparisons
  /** Quality comparison */
  qualityComparison: MetricComparison;
  /** Latency comparison */
  latencyComparison: MetricComparison;
  /** Cost comparison */
  costComparison: MetricComparison;
  /** Success rate comparison */
  successRateComparison: MetricComparison;

  // Raw data
  /** All paired outcomes */
  pairedOutcomes: PairedOutcome[];
}

/**
 * Comparison for a single metric
 */
export interface MetricComparison {
  /** Metric name */
  metric: string;
  /** Model A value */
  valueA: number;
  /** Model B value */
  valueB: number;
  /** Difference (A - B) */
  difference: number;
  /** Percentage difference */
  percentDifference: number;
  /** Better model for this metric */
  better: 'model_a' | 'model_b' | 'tie';
  /** Whether difference is significant */
  isSignificant: boolean;
}

// ===== EXPERIMENT EVENTS =====

/**
 * Event types for experiment lifecycle
 */
export type ExperimentEventType =
  | 'experiment_created'
  | 'experiment_started'
  | 'experiment_paused'
  | 'experiment_resumed'
  | 'experiment_completed'
  | 'experiment_cancelled'
  | 'experiment_failed'
  | 'sample_recorded'
  | 'interim_analysis';

/**
 * Experiment event
 */
export interface ExperimentEvent {
  /** Event type */
  type: ExperimentEventType;
  /** Experiment ID */
  experimentId: string;
  /** Timestamp */
  timestamp: Date;
  /** Event data */
  data: Record<string, unknown>;
}

/**
 * Event handler for experiment events
 */
export type ExperimentEventHandler = (event: ExperimentEvent) => void;

// ===== ANALYSIS OPTIONS =====

/**
 * Options for statistical analysis
 */
export interface AnalysisOptions {
  /** Significance level (default 0.05) */
  significanceLevel?: number;
  /** Include interim results even if not conclusive */
  includeInterim?: boolean;
  /** Correct for multiple comparisons */
  bonferroniCorrection?: boolean;
}

// ===== QUERY TYPES =====

/**
 * Query options for experiments
 */
export interface ExperimentQuery {
  /** Filter by status */
  status?: ExperimentStatus[];
  /** Filter by model (either A or B) */
  model?: string;
  /** Filter by tag */
  tags?: string[];
  /** Created after */
  createdAfter?: Date;
  /** Created before */
  createdBefore?: Date;
  /** Limit results */
  limit?: number;
  /** Offset for pagination */
  offset?: number;
}

// ===== UTILITY TYPES =====

/**
 * Summary stats for quick display
 */
export interface ExperimentSummary {
  /** Experiment ID */
  id: string;
  /** Experiment name */
  name: string;
  /** Status */
  status: ExperimentStatus;
  /** Model A */
  modelA: string;
  /** Model B */
  modelB: string;
  /** Total samples */
  totalSamples: number;
  /** Current winner (may be inconclusive) */
  currentWinner: Winner;
  /** Progress percentage (0-100) */
  progress: number;
}

/**
 * Create experiment input
 */
export interface CreateExperimentInput {
  /** Experiment name */
  name: string;
  /** Description */
  description?: string;
  /** Model A */
  modelA: string;
  /** Model B */
  modelB: string;
  /** Task types to target */
  taskTypes?: TaskType[];
  /** Complexity levels to target */
  complexities?: Complexity[];
  /** Sampling rate (0-100) */
  samplingRate?: number;
  /** Minimum samples per model */
  minSamplesPerModel?: number;
  /** Maximum total samples */
  maxSamples?: number;
  /** Significance level */
  significanceLevel?: number;
  /** Auto-stop date */
  endDate?: Date;
  /** Tags */
  tags?: string[];
}
