/**
 * Task Classifier for Intelligent Model Router
 *
 * Implements TIER-2.1: Intelligent Model Router
 *
 * Analyzes prompts to determine:
 * - Task type (code_edit, reasoning, writing, refactor, research, debug, test)
 * - Complexity (simple, medium, complex)
 * - Risk level (low, medium, high)
 *
 * Performance target: <5ms per classification
 */

import type {
  TaskType,
  Complexity,
  RiskLevel,
  TaskClassification,
  ClassificationSignals,
} from './router-types.js';

// ===== SIGNAL PATTERNS =====

/**
 * Keywords that indicate task type
 */
const TASK_TYPE_KEYWORDS: Record<TaskType, string[]> = {
  code_edit: [
    'edit', 'change', 'modify', 'update', 'fix', 'add', 'remove', 'delete',
    'implement', 'create', 'write', 'move', 'rename', 'replace', 'insert',
  ],
  reasoning: [
    'why', 'explain', 'analyze', 'compare', 'design', 'evaluate', 'assess',
    'think', 'reason', 'understand', 'consider', 'what if', 'should',
  ],
  writing: [
    'write', 'document', 'spec', 'readme', 'report', 'describe', 'draft',
    'compose', 'author', 'article', 'blog', 'documentation',
  ],
  refactor: [
    'refactor', 'restructure', 'reorganize', 'clean up', 'cleanup', 'simplify',
    'optimize', 'improve', 'modernize', 'migrate', 'extract', 'split',
  ],
  research: [
    'research', 'find', 'search', 'look up', 'investigate', 'explore',
    'discover', 'learn', 'understand', 'study', 'review',
  ],
  debug: [
    'debug', 'troubleshoot', 'diagnose', 'trace', 'inspect', 'investigate',
    'find bug', 'fix error', 'resolve issue', 'why is', 'not working',
  ],
  test: [
    'test', 'testing', 'unit test', 'integration test', 'e2e', 'spec',
    'coverage', 'mock', 'stub', 'assertion', 'expect',
  ],
  unknown: [],
};

/**
 * Patterns that indicate complexity
 */
const COMPLEXITY_SIGNALS = {
  simple: {
    keywords: ['simple', 'quick', 'small', 'minor', 'typo', 'trivial', 'easy'],
    filePatterns: ['single file', 'one file', 'this file', 'just'],
    estimatedFiles: [1, 2],
    estimatedLines: [0, 50],
  },
  medium: {
    keywords: ['feature', 'component', 'module', 'several', 'few', 'some'],
    filePatterns: ['files', 'components', 'modules'],
    estimatedFiles: [2, 5],
    estimatedLines: [50, 200],
  },
  complex: {
    keywords: [
      'architecture', 'system', 'entire', 'all', 'major', 'significant',
      'comprehensive', 'complete', 'full', 'overhaul', 'redesign',
    ],
    filePatterns: ['codebase', 'project', 'application', 'across'],
    estimatedFiles: [5, Infinity],
    estimatedLines: [200, Infinity],
  },
};

/**
 * Patterns that indicate risk level
 */
const RISK_SIGNALS = {
  high: [
    'production', 'database', 'migration', 'auth', 'security', 'payment',
    'credential', 'secret', 'key', 'token', 'password', 'delete all',
    'drop', 'truncate', 'breaking change', 'api change', 'schema change',
  ],
  medium: [
    'api', 'endpoint', 'interface', 'public', 'external', 'integration',
    'dependency', 'upgrade', 'version', 'config', 'environment',
  ],
  low: [
    'internal', 'private', 'local', 'test', 'mock', 'stub', 'example',
    'documentation', 'comment', 'readme', 'typo', 'formatting',
  ],
};

/**
 * File patterns that indicate scope
 */
const SCOPE_PATTERNS = {
  single_file: [
    /this file/i,
    /in (the )?file/i,
    /\.(ts|js|py|go|rs|java|rb|tsx|jsx)$/i,
    /just (the|this|one)/i,
  ],
  multi_file: [
    /files/i,
    /components/i,
    /modules/i,
    /several/i,
    /few/i,
    /some/i,
    /across/i,
  ],
  architectural: [
    /architecture/i,
    /system/i,
    /codebase/i,
    /project/i,
    /application/i,
    /entire/i,
    /all/i,
    /redesign/i,
    /overhaul/i,
  ],
};

// ===== TASK CLASSIFIER =====

/**
 * Configuration for TaskClassifier
 */
export interface TaskClassifierConfig {
  /** Custom keyword mappings */
  customKeywords?: Partial<Record<TaskType, string[]>>;
  /** Default task type when unknown */
  defaultTaskType?: TaskType;
  /** Minimum confidence threshold */
  minConfidence?: number;
}

/**
 * Classifies tasks for intelligent routing
 */
export class TaskClassifier {
  private readonly config: Required<TaskClassifierConfig>;

  constructor(config: TaskClassifierConfig = {}) {
    this.config = {
      customKeywords: config.customKeywords ?? {},
      defaultTaskType: config.defaultTaskType ?? 'code_edit',
      minConfidence: config.minConfidence ?? 0.3,
    };
  }

  /**
   * Classify a task based on the prompt
   */
  classify(prompt: string, context?: ClassificationContext): TaskClassification {
    const normalizedPrompt = prompt.toLowerCase();
    const signals = this.extractSignals(normalizedPrompt);

    const type = this.classifyType(normalizedPrompt, signals);
    const complexity = this.classifyComplexity(normalizedPrompt, signals, context);
    const riskLevel = this.classifyRisk(normalizedPrompt, context);
    const confidence = this.calculateConfidence(signals, type, complexity);

    return {
      type,
      complexity,
      riskLevel,
      signals: signals.keywords,
      confidence,
      estimatedFiles: this.estimateFiles(complexity, signals),
      estimatedLines: this.estimateLines(complexity, signals),
    };
  }

  /**
   * Extract classification signals from prompt
   */
  private extractSignals(prompt: string): ClassificationSignals {
    const keywords: string[] = [];
    const filePatterns: string[] = [];
    const codePatterns: string[] = [];
    let scope: 'single_file' | 'multi_file' | 'architectural' = 'single_file';

    // Extract keywords
    for (const [taskType, typeKeywords] of Object.entries(TASK_TYPE_KEYWORDS)) {
      for (const keyword of typeKeywords) {
        if (prompt.includes(keyword)) {
          keywords.push(keyword);
        }
      }
    }

    // Check for custom keywords
    for (const [, customKeywords] of Object.entries(this.config.customKeywords)) {
      if (customKeywords) {
        for (const keyword of customKeywords) {
          if (prompt.includes(keyword.toLowerCase())) {
            keywords.push(keyword);
          }
        }
      }
    }

    // Detect file patterns
    const fileMatch = prompt.match(/\.(ts|js|py|go|rs|java|rb|tsx|jsx|vue|svelte|css|scss|html|json|yaml|yml|md)(\s|$)/gi);
    if (fileMatch) {
      filePatterns.push(...fileMatch.map(m => m.trim()));
    }

    // Detect code patterns
    if (prompt.match(/function|class|interface|type|const|let|var|import|export/i)) {
      codePatterns.push('code_syntax');
    }
    if (prompt.match(/```[\s\S]*```/)) {
      codePatterns.push('code_block');
    }

    // Determine scope
    for (const [scopeType, patterns] of Object.entries(SCOPE_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(prompt)) {
          scope = scopeType as typeof scope;
          break;
        }
      }
      if (scope !== 'single_file') break;
    }

    return { keywords, filePatterns, codePatterns, scope };
  }

  /**
   * Classify task type
   */
  private classifyType(prompt: string, signals: ClassificationSignals): TaskType {
    const scores: Record<TaskType, number> = {
      code_edit: 0,
      reasoning: 0,
      writing: 0,
      refactor: 0,
      research: 0,
      debug: 0,
      test: 0,
      unknown: 0,
    };

    // Score based on keywords
    for (const [taskType, keywords] of Object.entries(TASK_TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (prompt.includes(keyword)) {
          scores[taskType as TaskType] += 1;
        }
      }
    }

    // Boost based on code patterns
    if (signals.codePatterns.length > 0) {
      scores.code_edit += 0.5;
    }

    // Boost based on file patterns
    if (signals.filePatterns.length > 0) {
      scores.code_edit += 0.5;
    }

    // Find highest scoring type
    let maxScore = 0;
    let maxType: TaskType = this.config.defaultTaskType;

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore && type !== 'unknown') {
        maxScore = score;
        maxType = type as TaskType;
      }
    }

    return maxScore > 0 ? maxType : this.config.defaultTaskType;
  }

  /**
   * Classify complexity
   */
  private classifyComplexity(
    prompt: string,
    signals: ClassificationSignals,
    context?: ClassificationContext
  ): Complexity {
    let simpleScore = 0;
    let mediumScore = 0;
    let complexScore = 0;

    // Score based on keywords
    for (const keyword of COMPLEXITY_SIGNALS.simple.keywords) {
      if (prompt.includes(keyword)) simpleScore += 1;
    }
    for (const keyword of COMPLEXITY_SIGNALS.medium.keywords) {
      if (prompt.includes(keyword)) mediumScore += 1;
    }
    for (const keyword of COMPLEXITY_SIGNALS.complex.keywords) {
      if (prompt.includes(keyword)) complexScore += 1;
    }

    // Score based on scope
    switch (signals.scope) {
      case 'single_file':
        simpleScore += 2;
        break;
      case 'multi_file':
        mediumScore += 2;
        break;
      case 'architectural':
        complexScore += 3;
        break;
    }

    // Consider context if provided
    if (context?.filesAffected) {
      if (context.filesAffected <= 2) simpleScore += 2;
      else if (context.filesAffected <= 5) mediumScore += 2;
      else complexScore += 2;
    }

    if (context?.estimatedLines) {
      if (context.estimatedLines <= 50) simpleScore += 1;
      else if (context.estimatedLines <= 200) mediumScore += 1;
      else complexScore += 1;
    }

    // Determine complexity
    if (complexScore > mediumScore && complexScore > simpleScore) {
      return 'complex';
    } else if (mediumScore > simpleScore) {
      return 'medium';
    }
    return 'simple';
  }

  /**
   * Classify risk level
   */
  private classifyRisk(prompt: string, context?: ClassificationContext): RiskLevel {
    // Check for high-risk signals
    for (const signal of RISK_SIGNALS.high) {
      if (prompt.includes(signal)) {
        return 'high';
      }
    }

    // Context-based risk
    if (context?.isProduction) {
      return 'high';
    }

    // Check for medium-risk signals
    for (const signal of RISK_SIGNALS.medium) {
      if (prompt.includes(signal)) {
        return 'medium';
      }
    }

    // Check for low-risk signals (boost confidence in low risk)
    for (const signal of RISK_SIGNALS.low) {
      if (prompt.includes(signal)) {
        return 'low';
      }
    }

    // Default to medium if no clear signals
    return 'medium';
  }

  /**
   * Calculate confidence in classification
   */
  private calculateConfidence(
    signals: ClassificationSignals,
    type: TaskType,
    complexity: Complexity
  ): number {
    let confidence = 0.5; // Base confidence

    // Boost for matching keywords
    const matchingKeywords = signals.keywords.filter(
      k => TASK_TYPE_KEYWORDS[type]?.includes(k)
    );
    confidence += matchingKeywords.length * 0.1;

    // Boost for code patterns when code task
    if (type === 'code_edit' && signals.codePatterns.length > 0) {
      confidence += 0.15;
    }

    // Boost for file patterns
    if (signals.filePatterns.length > 0) {
      confidence += 0.1;
    }

    // Boost for clear scope signals
    if (signals.scope !== 'single_file') {
      confidence += 0.1;
    }

    // Cap at 1.0
    return Math.min(confidence, 1.0);
  }

  /**
   * Estimate number of files affected
   */
  private estimateFiles(complexity: Complexity, signals: ClassificationSignals): number {
    switch (complexity) {
      case 'simple':
        return signals.filePatterns.length || 1;
      case 'medium':
        return Math.max(signals.filePatterns.length, 3);
      case 'complex':
        return Math.max(signals.filePatterns.length, 6);
    }
  }

  /**
   * Estimate lines of change
   */
  private estimateLines(complexity: Complexity, _signals: ClassificationSignals): number {
    switch (complexity) {
      case 'simple':
        return 25;
      case 'medium':
        return 100;
      case 'complex':
        return 300;
    }
  }
}

/**
 * Additional context for classification
 */
export interface ClassificationContext {
  /** Number of files that will be affected */
  filesAffected?: number;
  /** Estimated lines of change */
  estimatedLines?: number;
  /** Whether this affects production */
  isProduction?: boolean;
  /** Previous task classifications in session */
  previousTasks?: TaskClassification[];
}

// ===== SINGLETON =====

let classifierInstance: TaskClassifier | null = null;

/**
 * Get or create the singleton TaskClassifier instance
 */
export function getTaskClassifier(config?: TaskClassifierConfig): TaskClassifier {
  if (!classifierInstance || config) {
    classifierInstance = new TaskClassifier(config);
  }
  return classifierInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetTaskClassifier(): void {
  classifierInstance = null;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Quick classify without creating instance
 */
export function classifyTask(
  prompt: string,
  context?: ClassificationContext
): TaskClassification {
  return getTaskClassifier().classify(prompt, context);
}

/**
 * Check if a task is suitable for a given complexity level
 */
export function isSuitableForComplexity(
  classification: TaskClassification,
  maxComplexity: Complexity
): boolean {
  const complexityOrder: Complexity[] = ['simple', 'medium', 'complex'];
  const taskIndex = complexityOrder.indexOf(classification.complexity);
  const maxIndex = complexityOrder.indexOf(maxComplexity);
  return taskIndex <= maxIndex;
}

/**
 * Get a human-readable description of the classification
 */
export function describeClassification(classification: TaskClassification): string {
  const { type, complexity, riskLevel, confidence } = classification;
  return `${complexity} ${type} task (${riskLevel} risk, ${Math.round(confidence * 100)}% confidence)`;
}
