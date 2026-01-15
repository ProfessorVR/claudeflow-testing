/**
 * Auto Mode Selector - ML-Based Automatic Reasoning Mode Selection
 * TIER-2.4 - Mode Selection Auto-Pilot
 *
 * Extends the heuristic-based ExtendedModeSelector with:
 * - Learning from past mode selection outcomes
 * - Pattern-based prediction using SONA-style weights
 * - Automatic threshold tuning based on success metrics
 * - Context-aware mode boosting
 *
 * Selection latency: <10ms (including learning updates)
 *
 * @module god-agent/core/reasoning/auto-mode-selector
 */

import {
  ExtendedModeSelector,
  ExtendedModeSelectorConfig,
  ExtendedModeSelectionResult
} from './extended-mode-selector.js';
import { ModeSelectionRequest } from './mode-selector.js';
import {
  ReasoningMode
} from './reasoning-types.js';
import {
  AdvancedReasoningMode,
  AllReasoningModes
} from './advanced-reasoning-types.js';
import { createServiceLogger } from '../observability/logger.js';

// Service logger
const log = createServiceLogger('auto-mode-selector');

// ==================== Types ====================

/**
 * Mode outcome feedback
 */
export interface IModeOutcome {
  /** The query that was processed */
  query: string;

  /** The mode that was selected */
  selectedMode: AllReasoningModes;

  /** Quality score of the result (0.0-1.0) */
  quality: number;

  /** Latency of the reasoning in ms */
  latencyMs?: number;

  /** Whether the user was satisfied (if known) */
  userSatisfied?: boolean;

  /** Context hash for pattern matching */
  contextHash?: string;

  /** Timestamp of the outcome */
  timestamp: number;
}

/**
 * Learned mode weight entry
 */
export interface IModeWeight {
  /** Mode identifier */
  mode: AllReasoningModes;

  /** Pattern key (query features hash) */
  patternKey: string;

  /** Weight value (-1.0 to 1.0) */
  weight: number;

  /** Number of updates */
  updateCount: number;

  /** Average quality when this mode was selected */
  averageQuality: number;

  /** Last update timestamp */
  lastUpdated: number;
}

/**
 * Auto mode selector statistics
 */
export interface IAutoModeStats {
  /** Total selections made */
  totalSelections: number;

  /** Selections by mode */
  selectionsByMode: Record<string, number>;

  /** Average quality by mode */
  qualityByMode: Record<string, number>;

  /** Mode weights count */
  totalWeights: number;

  /** Learning rate */
  learningRate: number;

  /** Boost factor */
  boostFactor: number;

  /** Auto mode usage rate */
  autoModeUsageRate: number;

  /** Last updated */
  lastUpdated: number;
}

/**
 * Auto mode selector configuration
 */
export interface IAutoModeSelectorConfig extends ExtendedModeSelectorConfig {
  /** Learning rate for weight updates (default: 0.1) */
  learningRate?: number;

  /** Decay rate for old patterns (default: 0.999) */
  decayRate?: number;

  /** Minimum samples before learning (default: 10) */
  minSamplesForLearning?: number;

  /** Maximum stored patterns (default: 10000) */
  maxPatterns?: number;

  /** Boost factor for learned weights (default: 0.3) */
  boostFactor?: number;

  /** Enable auto threshold tuning (default: true) */
  autoTuneThresholds?: boolean;

  /** Quality threshold for positive feedback (default: 0.7) */
  positiveQualityThreshold?: number;

  /** Quality threshold for negative feedback (default: 0.4) */
  negativeQualityThreshold?: number;
}

// ==================== Default Configuration ====================

const DEFAULT_AUTO_CONFIG: Required<IAutoModeSelectorConfig> = {
  // Core selector thresholds
  patternMatchThreshold: 0.6,
  causalInferenceThreshold: 0.6,
  contextualThreshold: 0.6,
  hybridThreshold: 0.15,
  causalKeywords: [],

  // Extended selector thresholds
  analogicalThreshold: 0.6,
  abductiveThreshold: 0.6,
  counterfactualThreshold: 0.6,
  decompositionThreshold: 0.6,
  adversarialThreshold: 0.6,
  temporalThreshold: 0.6,
  constraintBasedThreshold: 0.6,
  firstPrinciplesThreshold: 0.6,

  // Auto mode selector config
  learningRate: 0.1,
  decayRate: 0.999,
  minSamplesForLearning: 10,
  maxPatterns: 10000,
  boostFactor: 0.3,
  autoTuneThresholds: true,
  positiveQualityThreshold: 0.7,
  negativeQualityThreshold: 0.4,
};

// ==================== Auto Mode Selector ====================

/**
 * AutoModeSelector - ML-based automatic reasoning mode selection
 *
 * Learns from past outcomes to improve mode selection over time.
 * Combines heuristic-based scoring with learned pattern weights.
 */
export class AutoModeSelector {
  private baseSelector: ExtendedModeSelector;
  private config: Required<IAutoModeSelectorConfig>;
  private modeWeights: Map<string, IModeWeight> = new Map();
  private outcomes: IModeOutcome[] = [];
  private selectionCounts: Map<AllReasoningModes, number> = new Map();
  private qualitySums: Map<AllReasoningModes, number> = new Map();
  private initialized: boolean = false;

  constructor(config: IAutoModeSelectorConfig = {}) {
    this.config = { ...DEFAULT_AUTO_CONFIG, ...config };
    this.baseSelector = new ExtendedModeSelector(this.config);

    log.info('Auto mode selector initialized', {
      learningRate: this.config.learningRate,
      boostFactor: this.config.boostFactor,
      maxPatterns: this.config.maxPatterns,
    });
  }

  /**
   * Initialize the auto mode selector
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    // Initialize mode tracking maps
    for (const mode of this.getAllModes()) {
      this.selectionCounts.set(mode, 0);
      this.qualitySums.set(mode, 0);
    }

    this.initialized = true;
    log.info('Auto mode selector ready');
  }

  /**
   * Select optimal reasoning mode with learning-enhanced scoring
   *
   * @param request The reasoning request to analyze
   * @returns Extended mode selection result with learning boost
   */
  async selectMode(request: ModeSelectionRequest): Promise<ExtendedModeSelectionResult> {
    // Get base selection from heuristic selector
    const baseResult = await this.baseSelector.selectMode(request);

    // If explicit mode requested, use it directly
    if (request.type !== undefined) {
      return baseResult;
    }

    // Check if we have enough samples for learning
    if (this.outcomes.length < this.config.minSamplesForLearning) {
      // Track selection for future learning
      this.trackSelection(baseResult.mode);
      return baseResult;
    }

    // Calculate pattern key for the query
    const patternKey = this.calculatePatternKey(request.query);

    // Get learned boosts for each mode
    const learnedBoosts = this.getLearnedBoosts(patternKey);

    // Apply boosts to all scores
    const boostedScores = { ...baseResult.allScores };
    for (const [mode, boost] of Object.entries(learnedBoosts)) {
      const modeKey = mode as keyof typeof boostedScores;
      if (modeKey in boostedScores) {
        // Apply boost with clamping
        boostedScores[modeKey] = Math.max(0, Math.min(1,
          boostedScores[modeKey] + boost * this.config.boostFactor
        ));
      }
    }

    // Find highest boosted score
    const allModes = this.getAllModes().filter(m => m !== ReasoningMode.HYBRID);
    let bestMode = baseResult.mode;
    let bestScore = baseResult.confidence;

    for (const mode of allModes) {
      const score = this.getModeScore(mode, boostedScores);
      if (score > bestScore) {
        bestScore = score;
        bestMode = mode;
      }
    }

    // Track selection
    this.trackSelection(bestMode);

    // Check if we should use hybrid
    const sortedScores = allModes
      .map(m => this.getModeScore(m, boostedScores))
      .sort((a, b) => b - a);

    if (sortedScores.length >= 2) {
      const gap = sortedScores[0] - sortedScores[1];
      if (sortedScores[0] > 0.4 && gap < this.config.hybridThreshold) {
        bestMode = ReasoningMode.HYBRID;
        bestScore = sortedScores[0];
      }
    }

    log.debug('Mode selection with learning', {
      query: request.query.substring(0, 50),
      baseMode: baseResult.mode,
      selectedMode: bestMode,
      baseConfidence: baseResult.confidence,
      boostedConfidence: bestScore,
    });

    return {
      mode: bestMode,
      confidence: bestScore,
      reasoning: `ML-enhanced: ${baseResult.reasoning}`,
      allScores: boostedScores,
    };
  }

  /**
   * Record the outcome of a mode selection for learning
   *
   * @param outcome The outcome to record
   */
  recordOutcome(outcome: IModeOutcome): void {
    // Add to outcomes
    this.outcomes.push(outcome);

    // Update mode statistics
    const currentCount = this.selectionCounts.get(outcome.selectedMode) || 0;
    const currentSum = this.qualitySums.get(outcome.selectedMode) || 0;
    this.selectionCounts.set(outcome.selectedMode, currentCount + 1);
    this.qualitySums.set(outcome.selectedMode, currentSum + outcome.quality);

    // Calculate pattern key
    const patternKey = this.calculatePatternKey(outcome.query);

    // Update mode weights
    this.updateModeWeight(patternKey, outcome);

    // Prune old patterns if needed
    if (this.modeWeights.size > this.config.maxPatterns) {
      this.prunePatterns();
    }

    // Auto-tune thresholds if enabled
    if (this.config.autoTuneThresholds) {
      this.tuneThresholds();
    }

    log.debug('Outcome recorded', {
      mode: outcome.selectedMode,
      quality: outcome.quality,
      patternKey,
      totalOutcomes: this.outcomes.length,
    });
  }

  /**
   * Get statistics about the auto mode selector
   *
   * @returns Auto mode statistics
   */
  getStats(): IAutoModeStats {
    const selectionsByMode: Record<string, number> = {};
    const qualityByMode: Record<string, number> = {};

    for (const mode of this.getAllModes()) {
      const count = this.selectionCounts.get(mode) || 0;
      const sum = this.qualitySums.get(mode) || 0;
      selectionsByMode[mode] = count;
      qualityByMode[mode] = count > 0 ? sum / count : 0;
    }

    const totalSelections = Object.values(selectionsByMode).reduce((a, b) => a + b, 0);
    const autoModeSelections = this.outcomes.filter(o =>
      o.quality >= this.config.positiveQualityThreshold
    ).length;

    return {
      totalSelections,
      selectionsByMode,
      qualityByMode,
      totalWeights: this.modeWeights.size,
      learningRate: this.config.learningRate,
      boostFactor: this.config.boostFactor,
      autoModeUsageRate: totalSelections > 0 ? autoModeSelections / totalSelections : 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Reset all learned weights
   */
  reset(): void {
    this.modeWeights.clear();
    this.outcomes = [];

    for (const mode of this.getAllModes()) {
      this.selectionCounts.set(mode, 0);
      this.qualitySums.set(mode, 0);
    }

    log.info('Auto mode selector reset');
  }

  /**
   * Export learned weights for persistence
   *
   * @returns Serialized weights
   */
  exportWeights(): IModeWeight[] {
    return Array.from(this.modeWeights.values());
  }

  /**
   * Import learned weights from persistence
   *
   * @param weights Serialized weights to import
   */
  importWeights(weights: IModeWeight[]): void {
    this.modeWeights.clear();
    for (const weight of weights) {
      const key = `${weight.mode}:${weight.patternKey}`;
      this.modeWeights.set(key, weight);
    }

    log.info('Imported weights', { count: weights.length });
  }

  // ==================== Private Methods ====================

  /**
   * Calculate a pattern key from query features
   */
  private calculatePatternKey(query: string): string {
    const features: string[] = [];
    const queryLower = query.toLowerCase();

    // Extract key features for pattern matching
    if (queryLower.length < 50) features.push('short');
    else if (queryLower.length < 150) features.push('medium');
    else features.push('long');

    // Question type
    if (queryLower.startsWith('why')) features.push('why');
    if (queryLower.startsWith('how')) features.push('how');
    if (queryLower.startsWith('what')) features.push('what');
    if (queryLower.includes('?')) features.push('question');

    // Content indicators
    if (/\b(code|function|class|implement)\b/i.test(query)) features.push('code');
    if (/\b(debug|fix|error|bug)\b/i.test(query)) features.push('debug');
    if (/\b(explain|understand|describe)\b/i.test(query)) features.push('explain');
    if (/\b(compare|versus|vs)\b/i.test(query)) features.push('compare');
    if (/\b(if|when|then)\b/i.test(query)) features.push('conditional');
    if (/\b(step|first|then|next)\b/i.test(query)) features.push('sequential');

    // Complexity indicators
    const wordCount = query.split(/\s+/).length;
    if (wordCount > 50) features.push('complex');
    if ((query.match(/,/g) || []).length >= 3) features.push('list');

    return features.sort().join(':');
  }

  /**
   * Get learned boosts for a pattern
   */
  private getLearnedBoosts(patternKey: string): Record<string, number> {
    const boosts: Record<string, number> = {};

    for (const mode of this.getAllModes()) {
      const key = `${mode}:${patternKey}`;
      const weight = this.modeWeights.get(key);

      if (weight) {
        boosts[mode] = weight.weight;
      } else {
        boosts[mode] = 0;
      }
    }

    return boosts;
  }

  /**
   * Update mode weight based on outcome
   */
  private updateModeWeight(patternKey: string, outcome: IModeOutcome): void {
    const key = `${outcome.selectedMode}:${patternKey}`;

    // Calculate reward (-1 to 1) based on quality
    let reward = 0;
    if (outcome.quality >= this.config.positiveQualityThreshold) {
      reward = (outcome.quality - this.config.positiveQualityThreshold) /
               (1 - this.config.positiveQualityThreshold);
    } else if (outcome.quality <= this.config.negativeQualityThreshold) {
      reward = (outcome.quality - this.config.negativeQualityThreshold) /
               this.config.negativeQualityThreshold;
    }

    const existing = this.modeWeights.get(key);

    if (existing) {
      // Exponential moving average update
      const newWeight = existing.weight * this.config.decayRate +
                       reward * this.config.learningRate;
      const newQuality = (existing.averageQuality * existing.updateCount + outcome.quality) /
                        (existing.updateCount + 1);

      this.modeWeights.set(key, {
        ...existing,
        weight: Math.max(-1, Math.min(1, newWeight)),
        updateCount: existing.updateCount + 1,
        averageQuality: newQuality,
        lastUpdated: Date.now(),
      });
    } else {
      // Create new weight entry
      this.modeWeights.set(key, {
        mode: outcome.selectedMode,
        patternKey,
        weight: reward * this.config.learningRate,
        updateCount: 1,
        averageQuality: outcome.quality,
        lastUpdated: Date.now(),
      });
    }
  }

  /**
   * Prune old and low-value patterns
   */
  private prunePatterns(): void {
    if (this.modeWeights.size <= this.config.maxPatterns * 0.9) {
      return;
    }

    const entries = Array.from(this.modeWeights.entries());

    // Score entries: lower is more prunable
    const now = Date.now();
    const scored = entries.map(([key, weight]) => {
      const recencyFactor = Math.exp(-(now - weight.lastUpdated) / (7 * 24 * 60 * 60 * 1000)); // 1 week decay
      const valueFactor = Math.abs(weight.weight) * weight.updateCount;
      const score = recencyFactor * valueFactor;
      return { key, score };
    });

    // Sort by score ascending (most prunable first)
    scored.sort((a, b) => a.score - b.score);

    // Prune 10% of entries
    const toPrune = Math.floor(this.config.maxPatterns * 0.1);
    for (let i = 0; i < toPrune && i < scored.length; i++) {
      this.modeWeights.delete(scored[i].key);
    }

    log.info('Pruned patterns', { pruned: toPrune, remaining: this.modeWeights.size });
  }

  /**
   * Auto-tune thresholds based on performance
   */
  private tuneThresholds(): void {
    // Only tune every 100 outcomes
    if (this.outcomes.length % 100 !== 0) return;

    const recentOutcomes = this.outcomes.slice(-100);

    for (const mode of this.getAllModes()) {
      const modeOutcomes = recentOutcomes.filter(o => o.selectedMode === mode);
      if (modeOutcomes.length < 5) continue;

      const avgQuality = modeOutcomes.reduce((sum, o) => sum + o.quality, 0) / modeOutcomes.length;

      // If average quality is low, reduce usage by increasing threshold
      // If average quality is high, encourage usage by decreasing threshold
      const thresholdKey = this.getModeThresholdKey(mode);
      if (thresholdKey && thresholdKey in this.config) {
        const currentThreshold = (this.config as any)[thresholdKey] as number;
        let newThreshold = currentThreshold;

        if (avgQuality < 0.5) {
          newThreshold = Math.min(0.9, currentThreshold + 0.02);
        } else if (avgQuality > 0.8) {
          newThreshold = Math.max(0.3, currentThreshold - 0.01);
        }

        if (newThreshold !== currentThreshold) {
          (this.config as any)[thresholdKey] = newThreshold;
          log.debug('Threshold tuned', { mode, oldThreshold: currentThreshold, newThreshold });
        }
      }
    }
  }

  /**
   * Get threshold key for a mode
   */
  private getModeThresholdKey(mode: AllReasoningModes): string | null {
    const mapping: Partial<Record<AllReasoningModes, string>> = {
      [ReasoningMode.PATTERN_MATCH]: 'patternMatchThreshold',
      [ReasoningMode.CAUSAL_INFERENCE]: 'causalInferenceThreshold',
      [ReasoningMode.CONTEXTUAL]: 'contextualThreshold',
      [AdvancedReasoningMode.ANALOGICAL]: 'analogicalThreshold',
      [AdvancedReasoningMode.ABDUCTIVE]: 'abductiveThreshold',
      [AdvancedReasoningMode.COUNTERFACTUAL]: 'counterfactualThreshold',
      [AdvancedReasoningMode.DECOMPOSITION]: 'decompositionThreshold',
      [AdvancedReasoningMode.ADVERSARIAL]: 'adversarialThreshold',
      [AdvancedReasoningMode.TEMPORAL]: 'temporalThreshold',
      [AdvancedReasoningMode.CONSTRAINT_BASED]: 'constraintBasedThreshold',
      [AdvancedReasoningMode.FIRST_PRINCIPLES]: 'firstPrinciplesThreshold',
    };
    return mapping[mode] ?? null;
  }

  /**
   * Track a mode selection
   */
  private trackSelection(mode: AllReasoningModes): void {
    const count = this.selectionCounts.get(mode) || 0;
    this.selectionCounts.set(mode, count + 1);
  }

  /**
   * Get mode score from boosted scores
   */
  private getModeScore(mode: AllReasoningModes, scores: any): number {
    switch (mode) {
      case ReasoningMode.PATTERN_MATCH: return scores.patternMatch;
      case ReasoningMode.CAUSAL_INFERENCE: return scores.causalInference;
      case ReasoningMode.CONTEXTUAL: return scores.contextual;
      case AdvancedReasoningMode.ANALOGICAL: return scores.analogical;
      case AdvancedReasoningMode.ABDUCTIVE: return scores.abductive;
      case AdvancedReasoningMode.COUNTERFACTUAL: return scores.counterfactual;
      case AdvancedReasoningMode.DECOMPOSITION: return scores.decomposition;
      case AdvancedReasoningMode.ADVERSARIAL: return scores.adversarial;
      case AdvancedReasoningMode.TEMPORAL: return scores.temporal;
      case AdvancedReasoningMode.CONSTRAINT_BASED: return scores.constraintBased;
      case AdvancedReasoningMode.FIRST_PRINCIPLES: return scores.firstPrinciples;
      default: return 0;
    }
  }

  /**
   * Get all reasoning modes
   */
  private getAllModes(): AllReasoningModes[] {
    return [
      ReasoningMode.PATTERN_MATCH,
      ReasoningMode.CAUSAL_INFERENCE,
      ReasoningMode.CONTEXTUAL,
      ReasoningMode.HYBRID,
      AdvancedReasoningMode.ANALOGICAL,
      AdvancedReasoningMode.ABDUCTIVE,
      AdvancedReasoningMode.COUNTERFACTUAL,
      AdvancedReasoningMode.DECOMPOSITION,
      AdvancedReasoningMode.ADVERSARIAL,
      AdvancedReasoningMode.TEMPORAL,
      AdvancedReasoningMode.CONSTRAINT_BASED,
      AdvancedReasoningMode.FIRST_PRINCIPLES,
    ];
  }
}

// ==================== Singleton Instance ====================

let autoModeSelectorInstance: AutoModeSelector | null = null;

/**
 * Get the global auto mode selector instance
 */
export function getAutoModeSelector(config?: IAutoModeSelectorConfig): AutoModeSelector {
  if (!autoModeSelectorInstance) {
    autoModeSelectorInstance = new AutoModeSelector(config);
  }
  return autoModeSelectorInstance;
}

/**
 * Reset the global auto mode selector instance
 */
export function resetAutoModeSelector(): void {
  if (autoModeSelectorInstance) {
    autoModeSelectorInstance.reset();
    autoModeSelectorInstance = null;
  }
}
