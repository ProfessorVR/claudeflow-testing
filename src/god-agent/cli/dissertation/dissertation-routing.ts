/**
 * Dissertation Routing Configuration
 *
 * Configures SoNA routes and patterns for PhD Pipeline dissertation tasks.
 * Extends the base router with dissertation-specific task types and routing rules.
 *
 * Task Categories:
 * - dissertation_writing: Main chapter/section writing
 * - philosophical_analysis: Argument analysis, term definition, exegesis
 * - literature_review: Source synthesis, citation integration
 * - style_refinement: Style consistency, tone adjustment
 * - quality_revision: Quality gauntlet revision cycles
 */

import { TaskType as PatternTaskType } from '../../core/reasoning/pattern-types.js';
import type {
  RoutingRule,
  Complexity,
  RiskLevel,
  TaskType as RouterTaskType,
} from '../../core/router/router-types.js';

// ============================================================================
// Dissertation Task Types
// ============================================================================

/**
 * Extended task types for dissertation writing
 * Maps to existing TaskType enum where possible
 */
export enum DissertationTaskType {
  /** Main chapter/section content generation */
  CHAPTER_WRITING = 'chapter_writing',
  /** Philosophical argument analysis and construction */
  PHILOSOPHICAL_ANALYSIS = 'philosophical_analysis',
  /** Literature synthesis and source integration */
  LITERATURE_REVIEW = 'literature_review',
  /** Style consistency and refinement */
  STYLE_REFINEMENT = 'style_refinement',
  /** Quality revision based on gauntlet feedback */
  QUALITY_REVISION = 'quality_revision',
  /** Greek/Latin term definition and exegesis */
  TERM_EXEGESIS = 'term_exegesis',
  /** Phenomenological description writing */
  PHENOMENOLOGICAL_DESCRIPTION = 'phenomenological_description',
  /** Argument thread development */
  ARGUMENT_DEVELOPMENT = 'argument_development',
  /** Citation verification and integration */
  CITATION_INTEGRATION = 'citation_integration',
  /** Section transition writing */
  TRANSITION_WRITING = 'transition_writing',
}

/**
 * Map dissertation tasks to base PatternTaskType for pattern matching
 */
export const DISSERTATION_TO_BASE_TASK: Record<DissertationTaskType, PatternTaskType> = {
  [DissertationTaskType.CHAPTER_WRITING]: PatternTaskType.DOCUMENTATION,
  [DissertationTaskType.PHILOSOPHICAL_ANALYSIS]: PatternTaskType.ANALYSIS,
  [DissertationTaskType.LITERATURE_REVIEW]: PatternTaskType.ANALYSIS,
  [DissertationTaskType.STYLE_REFINEMENT]: PatternTaskType.REFACTORING,
  [DissertationTaskType.QUALITY_REVISION]: PatternTaskType.REFACTORING,
  [DissertationTaskType.TERM_EXEGESIS]: PatternTaskType.ANALYSIS,
  [DissertationTaskType.PHENOMENOLOGICAL_DESCRIPTION]: PatternTaskType.DOCUMENTATION,
  [DissertationTaskType.ARGUMENT_DEVELOPMENT]: PatternTaskType.PLANNING,
  [DissertationTaskType.CITATION_INTEGRATION]: PatternTaskType.DOCUMENTATION,
  [DissertationTaskType.TRANSITION_WRITING]: PatternTaskType.DOCUMENTATION,
};

// ============================================================================
// Dissertation Routing Rules
// ============================================================================

/**
 * Complexity assessment for dissertation tasks
 */
export interface DissertationComplexity {
  /** Base complexity level */
  level: Complexity;
  /** Word count estimate */
  estimatedWords: number;
  /** Number of sources required */
  sourcesRequired: number;
  /** Technical depth required */
  technicalDepth: 'surface' | 'moderate' | 'deep';
  /** Philosophical sophistication */
  philosophicalSophistication: 'basic' | 'intermediate' | 'advanced';
}

/**
 * Risk assessment for dissertation tasks
 */
export interface DissertationRisk {
  /** Base risk level */
  level: RiskLevel;
  /** Potential for style drift */
  styleDriftRisk: number;
  /** Potential for argument inconsistency */
  argumentInconsistencyRisk: number;
  /** Citation requirement risk */
  citationRisk: number;
  /** Cross-chapter consistency risk */
  crossChapterRisk: number;
}

/**
 * Dissertation-specific routing rule
 */
export interface DissertationRoutingRule {
  /** Task type this rule applies to */
  taskType: DissertationTaskType;
  /** Complexity condition (optional) */
  complexity?: Complexity;
  /** Priority order of models to use */
  route: string[];
  /** Whether to require style injection */
  requireStyleInjection: boolean;
  /** Whether to require quality gauntlet */
  requireQualityGauntlet: boolean;
  /** Maximum iterations for revision */
  maxRevisionIterations: number;
  /** Minimum quality score threshold */
  qualityThreshold: number;
}

/**
 * Default dissertation routing rules
 * LOCAL FIRST: Prioritize local vLLM for drafts, cloud for final polish
 */
export const DEFAULT_DISSERTATION_ROUTING_RULES: DissertationRoutingRule[] = [
  // === CHAPTER WRITING ===
  {
    taskType: DissertationTaskType.CHAPTER_WRITING,
    complexity: 'simple',
    route: ['qwen2.5-coder-32b', 'claude-sonnet'],
    requireStyleInjection: true,
    requireQualityGauntlet: true,
    maxRevisionIterations: 3,
    qualityThreshold: 0.80,
  },
  {
    taskType: DissertationTaskType.CHAPTER_WRITING,
    complexity: 'medium',
    route: ['qwen2.5-coder-32b', 'claude-sonnet'],
    requireStyleInjection: true,
    requireQualityGauntlet: true,
    maxRevisionIterations: 4,
    qualityThreshold: 0.85,
  },
  {
    taskType: DissertationTaskType.CHAPTER_WRITING,
    complexity: 'complex',
    route: ['claude-sonnet', 'qwen2.5-coder-32b'],
    requireStyleInjection: true,
    requireQualityGauntlet: true,
    maxRevisionIterations: 5,
    qualityThreshold: 0.90,
  },

  // === PHILOSOPHICAL ANALYSIS ===
  {
    taskType: DissertationTaskType.PHILOSOPHICAL_ANALYSIS,
    complexity: 'simple',
    route: ['qwen2.5-coder-32b', 'claude-sonnet'],
    requireStyleInjection: true,
    requireQualityGauntlet: true,
    maxRevisionIterations: 3,
    qualityThreshold: 0.80,
  },
  {
    taskType: DissertationTaskType.PHILOSOPHICAL_ANALYSIS,
    complexity: 'medium',
    route: ['claude-sonnet', 'qwen2.5-coder-32b'],
    requireStyleInjection: true,
    requireQualityGauntlet: true,
    maxRevisionIterations: 4,
    qualityThreshold: 0.85,
  },
  {
    taskType: DissertationTaskType.PHILOSOPHICAL_ANALYSIS,
    complexity: 'complex',
    route: ['claude-sonnet'],
    requireStyleInjection: true,
    requireQualityGauntlet: true,
    maxRevisionIterations: 5,
    qualityThreshold: 0.90,
  },

  // === LITERATURE REVIEW ===
  {
    taskType: DissertationTaskType.LITERATURE_REVIEW,
    route: ['qwen2.5-coder-32b', 'claude-sonnet'],
    requireStyleInjection: true,
    requireQualityGauntlet: true,
    maxRevisionIterations: 4,
    qualityThreshold: 0.85,
  },

  // === STYLE REFINEMENT ===
  {
    taskType: DissertationTaskType.STYLE_REFINEMENT,
    route: ['claude-sonnet', 'qwen2.5-coder-32b'],
    requireStyleInjection: true,
    requireQualityGauntlet: false,
    maxRevisionIterations: 2,
    qualityThreshold: 0.90,
  },

  // === QUALITY REVISION ===
  {
    taskType: DissertationTaskType.QUALITY_REVISION,
    route: ['claude-sonnet', 'qwen2.5-coder-32b'],
    requireStyleInjection: true,
    requireQualityGauntlet: true,
    maxRevisionIterations: 3,
    qualityThreshold: 0.85,
  },

  // === TERM EXEGESIS ===
  {
    taskType: DissertationTaskType.TERM_EXEGESIS,
    route: ['claude-sonnet', 'qwen2.5-coder-32b'],
    requireStyleInjection: true,
    requireQualityGauntlet: true,
    maxRevisionIterations: 3,
    qualityThreshold: 0.90,
  },

  // === PHENOMENOLOGICAL DESCRIPTION ===
  {
    taskType: DissertationTaskType.PHENOMENOLOGICAL_DESCRIPTION,
    route: ['claude-sonnet', 'qwen2.5-coder-32b'],
    requireStyleInjection: true,
    requireQualityGauntlet: true,
    maxRevisionIterations: 4,
    qualityThreshold: 0.85,
  },

  // === ARGUMENT DEVELOPMENT ===
  {
    taskType: DissertationTaskType.ARGUMENT_DEVELOPMENT,
    route: ['claude-sonnet', 'qwen2.5-coder-32b'],
    requireStyleInjection: true,
    requireQualityGauntlet: true,
    maxRevisionIterations: 4,
    qualityThreshold: 0.85,
  },

  // === CITATION INTEGRATION ===
  {
    taskType: DissertationTaskType.CITATION_INTEGRATION,
    route: ['qwen2.5-coder-32b', 'claude-sonnet'],
    requireStyleInjection: false,
    requireQualityGauntlet: true,
    maxRevisionIterations: 2,
    qualityThreshold: 0.95,
  },

  // === TRANSITION WRITING ===
  {
    taskType: DissertationTaskType.TRANSITION_WRITING,
    route: ['qwen2.5-coder-32b', 'claude-sonnet'],
    requireStyleInjection: true,
    requireQualityGauntlet: false,
    maxRevisionIterations: 2,
    qualityThreshold: 0.80,
  },
];

// ============================================================================
// Dissertation Router
// ============================================================================

/**
 * Configuration for dissertation routing
 */
export interface DissertationRoutingConfig {
  /** Routing rules */
  rules: DissertationRoutingRule[];
  /** Default model for unknown tasks */
  defaultModel: string;
  /** Whether to enable style injection globally */
  enableStyleInjection: boolean;
  /** Whether to enable quality gauntlet globally */
  enableQualityGauntlet: boolean;
  /** Global quality threshold */
  globalQualityThreshold: number;
  /** Maximum global revision iterations */
  maxGlobalRevisions: number;
}

/**
 * Default dissertation routing configuration
 */
export const DEFAULT_DISSERTATION_ROUTING_CONFIG: DissertationRoutingConfig = {
  rules: DEFAULT_DISSERTATION_ROUTING_RULES,
  defaultModel: 'qwen2.5-coder-32b',
  enableStyleInjection: true,
  enableQualityGauntlet: true,
  globalQualityThreshold: 0.85,
  maxGlobalRevisions: 5,
};

/**
 * Router for dissertation-specific tasks
 */
export class DissertationRouter {
  private config: DissertationRoutingConfig;
  private taskHistory: Map<string, {
    taskType: DissertationTaskType;
    model: string;
    quality: number;
    success: boolean;
  }[]> = new Map();

  constructor(config: Partial<DissertationRoutingConfig> = {}) {
    this.config = {
      ...DEFAULT_DISSERTATION_ROUTING_CONFIG,
      ...config,
      rules: config.rules ?? DEFAULT_DISSERTATION_ROUTING_RULES,
    };
  }

  /**
   * Get routing decision for a dissertation task
   */
  getRoute(
    taskType: DissertationTaskType,
    complexity?: Complexity
  ): DissertationRoutingRule {
    // Find matching rule
    const matchingRule = this.config.rules.find(rule => {
      if (rule.taskType !== taskType) return false;
      if (rule.complexity && complexity && rule.complexity !== complexity) return false;
      return true;
    });

    if (matchingRule) {
      return matchingRule;
    }

    // Return default rule
    return {
      taskType,
      route: [this.config.defaultModel],
      requireStyleInjection: this.config.enableStyleInjection,
      requireQualityGauntlet: this.config.enableQualityGauntlet,
      maxRevisionIterations: this.config.maxGlobalRevisions,
      qualityThreshold: this.config.globalQualityThreshold,
    };
  }

  /**
   * Record task outcome for learning
   */
  recordOutcome(
    taskId: string,
    taskType: DissertationTaskType,
    model: string,
    quality: number,
    success: boolean
  ): void {
    const history = this.taskHistory.get(taskId) ?? [];
    history.push({ taskType, model, quality, success });
    this.taskHistory.set(taskId, history);
  }

  /**
   * Get success rate for a task type and model combination
   */
  getSuccessRate(taskType: DissertationTaskType, model: string): number {
    let total = 0;
    let successes = 0;

    for (const history of Array.from(this.taskHistory.values())) {
      for (const record of history) {
        if (record.taskType === taskType && record.model === model) {
          total++;
          if (record.success) successes++;
        }
      }
    }

    return total > 0 ? successes / total : 0.5; // Default to 0.5 for unknown
  }

  /**
   * Classify complexity of a dissertation task
   */
  classifyComplexity(
    wordCount: number,
    sourceCount: number,
    technicalTerms: number,
    crossReferences: number
  ): DissertationComplexity {
    // Calculate base complexity
    let level: Complexity = 'simple';
    let technicalDepth: 'surface' | 'moderate' | 'deep' = 'surface';
    let philosophicalSophistication: 'basic' | 'intermediate' | 'advanced' = 'basic';

    // Word count thresholds
    if (wordCount > 3000) level = 'complex';
    else if (wordCount > 1000) level = 'medium';

    // Source requirements
    if (sourceCount > 10) {
      if (level === 'simple') level = 'medium';
    }
    if (sourceCount > 20) level = 'complex';

    // Technical depth
    if (technicalTerms > 20) technicalDepth = 'deep';
    else if (technicalTerms > 5) technicalDepth = 'moderate';

    // Philosophical sophistication
    if (crossReferences > 10) philosophicalSophistication = 'advanced';
    else if (crossReferences > 3) philosophicalSophistication = 'intermediate';

    // Upgrade complexity based on depth
    if (technicalDepth === 'deep' || philosophicalSophistication === 'advanced') {
      if (level === 'simple') level = 'medium';
      else if (level === 'medium') level = 'complex';
    }

    return {
      level,
      estimatedWords: wordCount,
      sourcesRequired: sourceCount,
      technicalDepth,
      philosophicalSophistication,
    };
  }

  /**
   * Assess risk for a dissertation task
   */
  assessRisk(
    taskType: DissertationTaskType,
    complexity: DissertationComplexity,
    chapterNumber: number,
    isFirstDraft: boolean
  ): DissertationRisk {
    let level: RiskLevel = 'low';
    let styleDriftRisk = 0.2;
    let argumentInconsistencyRisk = 0.2;
    let citationRisk = 0.1;
    let crossChapterRisk = 0.1;

    // Task-specific risk adjustments
    switch (taskType) {
      case DissertationTaskType.PHILOSOPHICAL_ANALYSIS:
        argumentInconsistencyRisk = 0.4;
        if (complexity.philosophicalSophistication === 'advanced') {
          argumentInconsistencyRisk = 0.6;
        }
        break;

      case DissertationTaskType.TERM_EXEGESIS:
        argumentInconsistencyRisk = 0.5;
        styleDriftRisk = 0.3;
        break;

      case DissertationTaskType.PHENOMENOLOGICAL_DESCRIPTION:
        styleDriftRisk = 0.4;
        break;

      case DissertationTaskType.LITERATURE_REVIEW:
        citationRisk = 0.5;
        if (complexity.sourcesRequired > 15) {
          citationRisk = 0.7;
        }
        break;

      case DissertationTaskType.ARGUMENT_DEVELOPMENT:
        argumentInconsistencyRisk = 0.5;
        crossChapterRisk = 0.3;
        break;

      case DissertationTaskType.TRANSITION_WRITING:
        crossChapterRisk = 0.4;
        break;
    }

    // Chapter number affects cross-chapter risk
    if (chapterNumber > 3) {
      crossChapterRisk += 0.1 * (chapterNumber - 3);
    }

    // First draft is higher risk
    if (isFirstDraft) {
      styleDriftRisk += 0.1;
      argumentInconsistencyRisk += 0.1;
    }

    // Calculate overall risk level
    const avgRisk = (styleDriftRisk + argumentInconsistencyRisk + citationRisk + crossChapterRisk) / 4;
    if (avgRisk > 0.5) level = 'high';
    else if (avgRisk > 0.3) level = 'medium';

    return {
      level,
      styleDriftRisk,
      argumentInconsistencyRisk,
      citationRisk,
      crossChapterRisk,
    };
  }

  /**
   * Convert dissertation routing rules to base router format
   */
  toBaseRouterRules(): RoutingRule[] {
    const rules: RoutingRule[] = [];

    for (const rule of this.config.rules) {
      const baseTask = this.mapToBaseTask(rule.taskType);
      if (baseTask) {
        rules.push({
          task: baseTask,
          complexity: rule.complexity,
          route: rule.route,
        });
      }
    }

    return rules;
  }

  /**
   * Map dissertation task type to base router task type
   */
  private mapToBaseTask(taskType: DissertationTaskType): RouterTaskType {
    switch (taskType) {
      case DissertationTaskType.CHAPTER_WRITING:
      case DissertationTaskType.PHENOMENOLOGICAL_DESCRIPTION:
      case DissertationTaskType.TRANSITION_WRITING:
      case DissertationTaskType.CITATION_INTEGRATION:
        return 'writing';

      case DissertationTaskType.PHILOSOPHICAL_ANALYSIS:
      case DissertationTaskType.LITERATURE_REVIEW:
      case DissertationTaskType.TERM_EXEGESIS:
        return 'research';

      case DissertationTaskType.STYLE_REFINEMENT:
      case DissertationTaskType.QUALITY_REVISION:
        return 'refactor';

      case DissertationTaskType.ARGUMENT_DEVELOPMENT:
        return 'reasoning';

      default:
        return 'writing';
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create default dissertation router
 */
export function createDissertationRouter(): DissertationRouter {
  return new DissertationRouter();
}

/**
 * Create strict dissertation router (higher quality thresholds)
 */
export function createStrictDissertationRouter(): DissertationRouter {
  const strictRules = DEFAULT_DISSERTATION_ROUTING_RULES.map(rule => ({
    ...rule,
    qualityThreshold: Math.min(rule.qualityThreshold + 0.05, 0.95),
    maxRevisionIterations: rule.maxRevisionIterations + 1,
  }));

  return new DissertationRouter({
    rules: strictRules,
    globalQualityThreshold: 0.90,
  });
}

/**
 * Create draft dissertation router (lower quality thresholds for early drafts)
 */
export function createDraftDissertationRouter(): DissertationRouter {
  const draftRules = DEFAULT_DISSERTATION_ROUTING_RULES.map(rule => ({
    ...rule,
    qualityThreshold: Math.max(rule.qualityThreshold - 0.10, 0.70),
    maxRevisionIterations: Math.max(rule.maxRevisionIterations - 1, 2),
    requireQualityGauntlet: false,
  }));

  return new DissertationRouter({
    rules: draftRules,
    enableQualityGauntlet: false,
    globalQualityThreshold: 0.75,
  });
}
