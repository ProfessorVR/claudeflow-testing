/**
 * Quality Stage Base Interfaces
 *
 * Defines the core interfaces for the multi-pass quality gauntlet system.
 * Each quality stage evaluates a specific aspect of chapter quality and
 * can suggest or automatically apply fixes.
 *
 * Part of the PhD Pipeline quality assurance system.
 */

// ============================================================================
// Quality Issue Types
// ============================================================================

/**
 * Types of quality issues that can be detected
 */
export type QualityIssueType =
  | 'argument'        // Logical flow, claim-evidence structure
  | 'citation'        // Missing citations, format issues
  | 'style'           // Tone, vocabulary, consistency
  | 'factual'         // Internal consistency, accuracy
  | 'structure'       // Organization, section flow
  | 'coherence'       // Cross-paragraph/section consistency
  | 'missing-source'; // Source not in corpus (requires acquisition)

/**
 * Severity levels for quality issues
 */
export type QualityIssueSeverity = 'critical' | 'major' | 'minor';

/**
 * Location of an issue within a chapter
 */
export interface IssueLocation {
  /** Chapter ID (1-indexed) */
  chapterId: number;
  /** Paragraph index within the chapter (0-indexed) */
  paragraphIndex?: number;
  /** Character offset from paragraph start */
  startOffset?: number;
  /** Character offset for end of issue */
  endOffset?: number;
  /** Section identifier (e.g., "2.1") */
  sectionId?: string;
}

/**
 * A single quality issue detected in the text
 */
export interface QualityIssue {
  /** Unique identifier for this issue */
  id: string;
  /** Type of issue */
  type: QualityIssueType;
  /** Severity level */
  severity: QualityIssueSeverity;
  /** Location within the chapter */
  location: IssueLocation;
  /** Human-readable description of the issue */
  description: string;
  /** Suggested fix or improvement */
  suggestion: string;
  /** Whether this issue can be automatically fixed */
  autoFixable: boolean;
  /** Optional context snippet showing the problem */
  contextSnippet?: string;
  /** Confidence score (0-1) for issue detection */
  confidence?: number;
}

// ============================================================================
// Quality Stage Result Types
// ============================================================================

/**
 * Result from evaluating a single quality stage
 */
export interface QualityStageResult {
  /** Name of the quality stage */
  stageName: string;
  /** Whether the chapter passed this stage */
  passed: boolean;
  /** Quality score (0-1 scale) */
  score: number;
  /** Issues detected by this stage */
  issues: QualityIssue[];
  /** Detailed metrics from the evaluation */
  metrics: Record<string, number>;
  /** General suggestions for improvement */
  suggestions: string[];
  /** Time taken for evaluation in milliseconds */
  evaluationTimeMs?: number;
}

// ============================================================================
// Quality Stage Interface
// ============================================================================

/**
 * Context passed to quality stages during evaluation
 */
export interface QualityEvaluationContext {
  /** Style profile for consistency checking */
  styleProfile?: unknown;
  /** Knowledge base for factual verification */
  knowledgeBase?: unknown;
  /** Previously written chapters for cross-reference checking */
  previousChapters?: Map<number, string>;
  /** Chapter structure definition */
  chapterStructure?: unknown;
  /** Provenance ledger for citation tracking */
  provenanceLedger?: unknown;
  /** Phase 2: Philosophical concept tracker for cross-section awareness */
  conceptTracker?: unknown; // PhilosophicalConceptTracker type (avoid circular dependency)
  /** Additional context data */
  [key: string]: unknown;
}

/**
 * Interface that all quality stages must implement
 */
export interface QualityStage {
  /** Unique name for this stage */
  readonly name: string;

  /** Weight for weighted scoring (should sum to 1.0 across all stages) */
  readonly weight: number;

  /** Minimum score required to pass this stage */
  readonly threshold: number;

  /**
   * Evaluate chapter text for quality issues
   *
   * @param chapterText - Full text of the chapter
   * @param chapterId - Chapter number (1-indexed)
   * @param context - Optional evaluation context
   * @returns Quality stage result with score and issues
   */
  evaluate(
    chapterText: string,
    chapterId: number,
    context?: QualityEvaluationContext
  ): Promise<QualityStageResult>;

  /**
   * Check if an issue can be automatically fixed by this stage
   *
   * @param issue - The quality issue to check
   * @returns True if the issue can be auto-fixed
   */
  canAutoFix(issue: QualityIssue): boolean;

  /**
   * Attempt to automatically fix an issue in the text
   *
   * @param text - Original chapter text
   * @param issue - Issue to fix
   * @returns Modified text with fix applied
   */
  autoFix(text: string, issue: QualityIssue): string;
}

// ============================================================================
// Quality Stage Base Class
// ============================================================================

/**
 * Abstract base class for quality stages providing common functionality
 */
export abstract class BaseQualityStage implements QualityStage {
  abstract readonly name: string;
  abstract readonly weight: number;
  abstract readonly threshold: number;

  /**
   * Evaluate chapter text - must be implemented by subclasses
   */
  abstract evaluate(
    chapterText: string,
    chapterId: number,
    context?: QualityEvaluationContext
  ): Promise<QualityStageResult>;

  /**
   * Default implementation - no auto-fix capability
   */
  canAutoFix(_issue: QualityIssue): boolean {
    return false;
  }

  /**
   * Default implementation - returns text unchanged
   */
  autoFix(text: string, _issue: QualityIssue): string {
    return text;
  }

  /**
   * Generate a unique issue ID
   */
  protected generateIssueId(type: QualityIssueType, index: number): string {
    return `${this.name}_${type}_${index}_${Date.now().toString(36)}`;
  }

  /**
   * Extract paragraphs from chapter text
   */
  protected extractParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  /**
   * Extract sentences from text
   */
  protected extractSentences(text: string): string[] {
    return text
      .replace(/([.!?])\s+/g, '$1|SPLIT|')
      .split('|SPLIT|')
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }

  /**
   * Calculate word count for text
   */
  protected wordCount(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Create a context snippet around a position
   */
  protected createContextSnippet(
    text: string,
    position: number,
    windowSize: number = 50
  ): string {
    const start = Math.max(0, position - windowSize);
    const end = Math.min(text.length, position + windowSize);
    let snippet = text.substring(start, end);

    if (start > 0) snippet = '...' + snippet;
    if (end < text.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Calculate score from issue counts
   * Uses exponential decay based on severity
   */
  protected calculateScore(
    criticalCount: number,
    majorCount: number,
    minorCount: number,
    totalElements: number
  ): number {
    if (totalElements === 0) return 1.0;

    // Severity weights
    const criticalWeight = 0.3;
    const majorWeight = 0.15;
    const minorWeight = 0.05;

    // Calculate penalty
    const penalty =
      (criticalCount * criticalWeight +
        majorCount * majorWeight +
        minorCount * minorWeight) /
      totalElements;

    // Score with minimum of 0
    return Math.max(0, 1 - penalty);
  }

  /**
   * Create a base result structure
   */
  protected createBaseResult(
    passed: boolean,
    score: number,
    issues: QualityIssue[] = [],
    metrics: Record<string, number> = {},
    suggestions: string[] = []
  ): QualityStageResult {
    return {
      stageName: this.name,
      passed,
      score,
      issues,
      metrics,
      suggestions,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Sort issues by severity (critical first, then major, then minor)
 */
export function sortIssuesBySeverity(issues: QualityIssue[]): QualityIssue[] {
  const severityOrder: Record<QualityIssueSeverity, number> = {
    critical: 0,
    major: 1,
    minor: 2,
  };

  return [...issues].sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

/**
 * Filter issues by severity
 */
export function filterIssuesBySeverity(
  issues: QualityIssue[],
  severity: QualityIssueSeverity
): QualityIssue[] {
  return issues.filter(i => i.severity === severity);
}

/**
 * Filter issues by type
 */
export function filterIssuesByType(
  issues: QualityIssue[],
  type: QualityIssueType
): QualityIssue[] {
  return issues.filter(i => i.type === type);
}

/**
 * Get auto-fixable issues only
 */
export function getAutoFixableIssues(issues: QualityIssue[]): QualityIssue[] {
  return issues.filter(i => i.autoFixable);
}

/**
 * Count issues by severity
 */
export function countIssuesBySeverity(
  issues: QualityIssue[]
): Record<QualityIssueSeverity, number> {
  return {
    critical: issues.filter(i => i.severity === 'critical').length,
    major: issues.filter(i => i.severity === 'major').length,
    minor: issues.filter(i => i.severity === 'minor').length,
  };
}
