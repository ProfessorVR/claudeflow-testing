/**
 * QualityGauntlet - Orchestrates multiple quality stages for chapter evaluation
 *
 * The gauntlet runs all quality stages in sequence, aggregates results,
 * and determines if the chapter meets publication-ready quality thresholds.
 *
 * Features:
 * - Configurable stage ordering and weights
 * - Weighted overall score calculation
 * - Critical issue identification
 * - Revision guidance generation
 * - Auto-fix application for supported issues
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  QualityStage,
  QualityStageResult,
  QualityIssue,
  QualityEvaluationContext,
  QualityIssueSeverity,
} from './quality-stage.js';
import { sortIssuesBySeverity, countIssuesBySeverity } from './quality-stage.js';
import { CitationVerifier } from './stages/citation-verifier.js';
import { QuotationFidelityStage } from './stages/quotation-fidelity-stage.js';
import { ToulminEnforcer } from './stages/toulmin-enforcer.js';
import { ArgumentCoherenceChecker } from './stages/argument-coherence-checker.js';
import { CitationCompletenessVerifier } from './stages/citation-completeness-verifier.js';
import { CitationDensityChecker } from './stages/citation-density-checker.js';
import { StyleConsistencyValidator } from './stages/style-consistency-validator.js';
import { FactualAccuracyAuditor } from './stages/factual-accuracy-auditor.js';
import { ClaimVerificationStage } from './stages/claim-verification-stage.js';

// ============================================================================
// Gauntlet Result Types
// ============================================================================

/**
 * Complete result from running the quality gauntlet
 */
export interface GauntletResult {
  /** Unique ID for this gauntlet run */
  runId: string;

  /** Whether the chapter passed all quality thresholds */
  passed: boolean;

  /** Weighted overall quality score (0-1) */
  overallScore: number;

  /** Results from each quality stage */
  stageResults: QualityStageResult[];

  /** Critical issues that must be addressed */
  criticalIssues: QualityIssue[];

  /** All issues found across all stages */
  allIssues: QualityIssue[];

  /** Whether revision is required to meet quality standards */
  revisionRequired: boolean;

  /** Specific guidance for revision */
  revisionGuidance: string;

  /** Summary statistics */
  summary: {
    totalIssues: number;
    criticalCount: number;
    majorCount: number;
    minorCount: number;
    autoFixableCount: number;
    stagesPassed: number;
    totalStages: number;
  };

  /** Execution metadata */
  metadata: {
    chapterId: number;
    evaluationTimeMs: number;
    timestamp: string;
  };
}

/**
 * Configuration for the quality gauntlet
 */
export interface GauntletConfig {
  /** Overall threshold (0-1) for passing the gauntlet */
  overallThreshold: number;

  /** Whether to stop on first critical issue */
  stopOnCritical: boolean;

  /** Whether to run stages in parallel */
  parallel: boolean;

  /** Custom stage order (by stage name) */
  stageOrder?: string[];

  /** Stage-specific threshold overrides */
  thresholdOverrides?: Record<string, number>;

  /** Stage-specific weight overrides */
  weightOverrides?: Record<string, number>;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: GauntletConfig = {
  overallThreshold: 0.80,
  stopOnCritical: false,
  parallel: true,  // Enable parallel execution by default for performance
  stageOrder: undefined,
  thresholdOverrides: undefined,
  weightOverrides: undefined,
};

// ============================================================================
// QualityGauntlet Class
// ============================================================================

/**
 * Cache entry for stage results
 */
interface CacheEntry {
  result: QualityStageResult;
  timestamp: number;
}

/**
 * Orchestrates multiple quality stages to evaluate chapter quality
 *
 * Performance optimizations:
 * - Parallel stage execution (3-5x faster)
 * - Result caching (avoids re-running on unchanged content)
 * - Lazy stage initialization
 */
export class QualityGauntlet {
  private stages: QualityStage[];
  private config: GauntletConfig;

  // Performance: Stage result cache
  private stageCache: Map<string, CacheEntry> = new Map();
  private maxCacheSize = 100;  // Max cached results
  private cacheTTL = 5 * 60 * 1000; // 5 minute TTL

  /**
   * Create a new QualityGauntlet
   *
   * @param stages - Quality stages to run (uses default stages if not provided)
   * @param config - Configuration options
   */
  constructor(
    stages?: QualityStage[],
    config?: Partial<GauntletConfig>
  ) {
    this.stages = stages || this.createDefaultStages();
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Apply weight overrides
    if (this.config.weightOverrides) {
      for (const stage of this.stages) {
        if (this.config.weightOverrides[stage.name] !== undefined) {
          // Note: This requires stages to have mutable weight property
          // In practice, we'd need to wrap stages or use a different approach
        }
      }
    }

    // Reorder stages if specified
    if (this.config.stageOrder) {
      this.stages = this.reorderStages(this.stages, this.config.stageOrder);
    }

    // Validate weights sum to approximately 1
    this.validateWeights();
  }

  /**
   * Run the complete quality gauntlet on chapter text
   *
   * Performance optimization: supports parallel execution of independent stages
   *
   * @param chapterText - Full text of the chapter
   * @param chapterId - Chapter number (1-indexed)
   * @param context - Optional evaluation context
   * @returns Complete gauntlet result
   */
  async runGauntlet(
    chapterText: string,
    chapterId: number,
    context?: QualityEvaluationContext
  ): Promise<GauntletResult> {
    const startTime = Date.now();
    const runId = uuidv4();

    let stageResults: QualityStageResult[];
    let allIssues: QualityIssue[] = [];
    let criticalFound = false;

    // Run stages in parallel or sequential based on config
    if (this.config.parallel && !this.config.stopOnCritical) {
      // Parallel execution - run all stages concurrently
      stageResults = await this.runStagesParallel(chapterText, chapterId, context);
      for (const result of stageResults) {
        allIssues.push(...result.issues);
        if (result.issues.some(i => i.severity === 'critical')) {
          criticalFound = true;
        }
      }
    } else {
      // Sequential execution - original behavior
      stageResults = [];
      for (const stage of this.stages) {
        if (this.config.stopOnCritical && criticalFound) {
          break;
        }

        const result = await this.runStage(stage.name, chapterText, chapterId, context);
        stageResults.push(result);
        allIssues.push(...result.issues);

        // Check for critical issues
        if (result.issues.some(i => i.severity === 'critical')) {
          criticalFound = true;
        }
      }
    }

    // Sort all issues by severity
    const sortedIssues = sortIssuesBySeverity(allIssues);
    const criticalIssues = sortedIssues.filter(i => i.severity === 'critical');

    // Calculate overall score
    const overallScore = this.calculateOverallScore(stageResults);

    // Determine if revision is required
    const revisionRequired =
      overallScore < this.config.overallThreshold ||
      criticalIssues.length > 0;

    // Generate revision guidance
    const revisionGuidance = this.generateRevisionGuidance(sortedIssues);

    // Calculate summary statistics
    const { critical, major, minor } = countIssuesBySeverity(sortedIssues);
    const autoFixableCount = sortedIssues.filter(i => i.autoFixable).length;
    const stagesPassed = stageResults.filter(r => r.passed).length;

    const passed =
      overallScore >= this.config.overallThreshold &&
      criticalIssues.length === 0 &&
      stagesPassed === this.stages.length;

    return {
      runId,
      passed,
      overallScore,
      stageResults,
      criticalIssues,
      allIssues: sortedIssues,
      revisionRequired,
      revisionGuidance,
      summary: {
        totalIssues: sortedIssues.length,
        criticalCount: critical,
        majorCount: major,
        minorCount: minor,
        autoFixableCount,
        stagesPassed,
        totalStages: this.stages.length,
      },
      metadata: {
        chapterId,
        evaluationTimeMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Run a specific quality stage by name
   *
   * @param stageName - Name of the stage to run
   * @param chapterText - Chapter text to evaluate
   * @param chapterId - Chapter number
   * @param context - Optional evaluation context
   * @returns Stage result
   */
  async runStage(
    stageName: string,
    chapterText: string,
    chapterId: number,
    context?: QualityEvaluationContext
  ): Promise<QualityStageResult> {
    const stage = this.stages.find(s => s.name === stageName);

    if (!stage) {
      throw new Error(`Quality stage "${stageName}" not found`);
    }

    return stage.evaluate(chapterText, chapterId, context);
  }

  /**
   * Calculate weighted overall score from stage results
   */
  calculateOverallScore(results: QualityStageResult[]): number {
    if (results.length === 0) return 0;

    let weightedSum = 0;
    let totalWeight = 0;

    for (const result of results) {
      const stage = this.stages.find(s => s.name === result.stageName);
      const weight = this.config.weightOverrides?.[result.stageName] ?? stage?.weight ?? 0.25;

      weightedSum += result.score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * Generate revision guidance from issues
   */
  generateRevisionGuidance(issues: QualityIssue[]): string {
    if (issues.length === 0) {
      return 'No revisions required. Chapter meets quality standards.';
    }

    const sections: string[] = [];

    sections.push('# REVISION GUIDANCE');
    sections.push('');

    // Critical issues first
    const critical = issues.filter(i => i.severity === 'critical');
    if (critical.length > 0) {
      sections.push('## CRITICAL ISSUES (Must Fix)');
      sections.push('');
      for (const issue of critical) {
        sections.push(this.formatIssueGuidance(issue, true));
      }
      sections.push('');
    }

    // Major issues
    const major = issues.filter(i => i.severity === 'major');
    if (major.length > 0) {
      sections.push('## MAJOR ISSUES (Should Fix)');
      sections.push('');
      for (const issue of major.slice(0, 10)) { // Limit to top 10
        sections.push(this.formatIssueGuidance(issue, false));
      }
      if (major.length > 10) {
        sections.push(`... and ${major.length - 10} more major issues`);
      }
      sections.push('');
    }

    // Minor issues summary
    const minor = issues.filter(i => i.severity === 'minor');
    if (minor.length > 0) {
      sections.push('## MINOR ISSUES (Consider Fixing)');
      sections.push('');
      sections.push(`${minor.length} minor issues detected. Key categories:`);

      // Group by type
      const byType = new Map<string, number>();
      for (const issue of minor) {
        byType.set(issue.type, (byType.get(issue.type) || 0) + 1);
      }

      for (const [type, count] of byType) {
        sections.push(`- ${type}: ${count} issue(s)`);
      }
      sections.push('');
    }

    // Priority actions
    sections.push('## PRIORITY ACTIONS');
    sections.push('');
    sections.push(this.generatePriorityActions(issues));

    return sections.join('\n');
  }

  /**
   * Apply auto-fixes where possible
   *
   * @param text - Original chapter text
   * @param issues - Issues to potentially fix
   * @returns Modified text and count of fixes applied
   */
  async applyAutoFixes(
    text: string,
    issues: QualityIssue[]
  ): Promise<{ text: string; fixedCount: number }> {
    let result = text;
    let fixedCount = 0;

    // Sort issues by position (descending) to avoid offset issues
    const sortedIssues = [...issues]
      .filter(i => i.autoFixable)
      .sort((a, b) => {
        const posA = a.location.startOffset ?? 0;
        const posB = b.location.startOffset ?? 0;
        return posB - posA;
      });

    for (const issue of sortedIssues) {
      // Find the stage that can fix this issue
      for (const stage of this.stages) {
        if (stage.canAutoFix(issue)) {
          const fixed = stage.autoFix(result, issue);
          if (fixed !== result) {
            result = fixed;
            fixedCount++;
          }
          break;
        }
      }
    }

    return { text: result, fixedCount };
  }

  /**
   * Get list of stage names
   */
  getStageNames(): string[] {
    return this.stages.map(s => s.name);
  }

  /**
   * Get stage by name
   */
  getStage(name: string): QualityStage | undefined {
    return this.stages.find(s => s.name === name);
  }

  /**
   * Update gauntlet configuration
   */
  updateConfig(config: Partial<GauntletConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Run all stages in parallel for maximum performance
   *
   * Performance: ~3-5x faster than sequential execution for 7 stages
   * Note: Cannot use stopOnCritical with parallel execution
   */
  private async runStagesParallel(
    chapterText: string,
    chapterId: number,
    context?: QualityEvaluationContext
  ): Promise<QualityStageResult[]> {
    const promises = this.stages.map(stage =>
      this.runStageWithCache(stage.name, chapterText, chapterId, context)
    );

    return Promise.all(promises);
  }

  /**
   * Run a stage with caching for performance
   *
   * Caches results based on content hash to avoid re-running
   * stages on unchanged content during iterative revision.
   */
  private async runStageWithCache(
    stageName: string,
    chapterText: string,
    chapterId: number,
    context?: QualityEvaluationContext
  ): Promise<QualityStageResult> {
    const cacheKey = this.getCacheKey(stageName, chapterText, chapterId);

    // Check cache
    const cached = this.stageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.result;
    }

    // Run stage
    const result = await this.runStage(stageName, chapterText, chapterId, context);

    // Cache result
    this.stageCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });

    // Prune old cache entries if cache is too large
    if (this.stageCache.size > this.maxCacheSize) {
      this.pruneCache();
    }

    return result;
  }

  /**
   * Generate cache key for a stage/content combination
   */
  private getCacheKey(stageName: string, content: string, chapterId: number): string {
    // Use simple hash for performance
    let hash = 0;
    for (let i = 0; i < Math.min(content.length, 10000); i++) {
      hash = ((hash << 5) - hash) + content.charCodeAt(i);
      hash |= 0; // Convert to 32-bit integer
    }
    return `${stageName}:${chapterId}:${hash}:${content.length}`;
  }

  /**
   * Prune oldest cache entries
   */
  private pruneCache(): void {
    const entries = Array.from(this.stageCache.entries());
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    // Remove oldest half
    const toRemove = Math.floor(entries.length / 2);
    for (let i = 0; i < toRemove; i++) {
      this.stageCache.delete(entries[i][0]);
    }
  }

  /**
   * Clear the stage result cache
   */
  clearCache(): void {
    this.stageCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; ttlMs: number } {
    return {
      size: this.stageCache.size,
      maxSize: this.maxCacheSize,
      ttlMs: this.cacheTTL
    };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Create default quality stages
   *
   * Stages (9 total):
   * 0. CitationVerifier (0.08) - Hallucination detection (author in corpus)
   * 1. QuotationFidelityStage (0.10) - Quotation verbatim check
   * 2. ToulminEnforcer (0.08) - Argument structure validation (reduced for expository writing)
   * 3. ArgumentCoherenceChecker (0.15) - Logical flow, claim-evidence structure
   * 4. CitationCompletenessVerifier (0.15) - Missing citations, format issues
   * 5. CitationDensityChecker (0.10) - PhD-level citation density (15+ per section)
   * 6. StyleConsistencyValidator (0.12) - Tone, vocabulary, consistency
   * 7. FactualAccuracyAuditor (0.10) - Internal consistency, accuracy
   * 8. ClaimVerificationStage (0.07) - CCV Phase C entailment verification
   *
   * Total weight: 1.00
   */
  private createDefaultStages(): QualityStage[] {
    return [
      new CitationVerifier(),          // Stage 0: Citation existence (author in corpus)
      new QuotationFidelityStage(),    // Stage 1: Quotation verbatim check
      new ToulminEnforcer(),           // Stage 2: Toulmin argument structure
      new ArgumentCoherenceChecker(),  // Stage 3: Argument coherence
      new CitationCompletenessVerifier(), // Stage 4: Citation completeness
      new CitationDensityChecker(),    // Stage 5: Citation density
      new StyleConsistencyValidator(), // Stage 6: Style consistency
      new FactualAccuracyAuditor(),    // Stage 7: Factual accuracy
      new ClaimVerificationStage(),    // Stage 8: CCV Phase C claim verification
    ];
  }

  /**
   * Reorder stages based on specified order
   */
  private reorderStages(stages: QualityStage[], order: string[]): QualityStage[] {
    const stageMap = new Map(stages.map(s => [s.name, s]));
    const ordered: QualityStage[] = [];

    // Add stages in specified order
    for (const name of order) {
      const stage = stageMap.get(name);
      if (stage) {
        ordered.push(stage);
        stageMap.delete(name);
      }
    }

    // Add remaining stages
    for (const stage of stageMap.values()) {
      ordered.push(stage);
    }

    return ordered;
  }

  /**
   * Validate that stage weights sum to approximately 1
   */
  private validateWeights(): void {
    const totalWeight = this.stages.reduce((sum, s) => sum + s.weight, 0);

    if (Math.abs(totalWeight - 1.0) > 0.01) {
      console.warn(
        `[QualityGauntlet] Stage weights sum to ${totalWeight.toFixed(2)}, not 1.0. ` +
        'Scores will be normalized.'
      );
    }
  }

  /**
   * Format a single issue as guidance
   */
  private formatIssueGuidance(issue: QualityIssue, detailed: boolean): string {
    const lines: string[] = [];

    const location = issue.location.paragraphIndex !== undefined
      ? `Paragraph ${issue.location.paragraphIndex + 1}`
      : 'General';

    lines.push(`### [${issue.type.toUpperCase()}] ${location}`);
    lines.push(`**Issue:** ${issue.description}`);
    lines.push(`**Fix:** ${issue.suggestion}`);

    if (detailed && issue.contextSnippet) {
      lines.push(`**Context:** "${issue.contextSnippet}"`);
    }

    if (issue.autoFixable) {
      lines.push(`*[Auto-fixable]*`);
    }

    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate prioritized action list
   */
  private generatePriorityActions(issues: QualityIssue[]): string {
    const actions: string[] = [];
    const { critical, major, minor } = countIssuesBySeverity(issues);

    // Count by type
    const byType = new Map<string, { critical: number; major: number }>();
    for (const issue of issues) {
      const existing = byType.get(issue.type) || { critical: 0, major: 0 };
      if (issue.severity === 'critical') existing.critical++;
      if (issue.severity === 'major') existing.major++;
      byType.set(issue.type, existing);
    }

    let priority = 1;

    // Generate prioritized actions
    actions.push(`${priority++}. **Address all critical issues immediately** - these prevent publication`);

    if (byType.get('citation')?.critical || byType.get('citation')?.major) {
      actions.push(`${priority++}. **Verify all citations** - uncited claims and missing sources identified`);
    }

    if (byType.get('coherence')?.critical || byType.get('coherence')?.major) {
      actions.push(`${priority++}. **Improve Toulmin argument structure** - ensure claims have grounds (evidence) and warrants (reasoning)`);
    }

    if (byType.get('argument')?.critical || byType.get('argument')?.major) {
      actions.push(`${priority++}. **Strengthen argument flow** - ensure logical progression and claim-evidence connections`);
    }

    if (byType.get('style')?.major) {
      actions.push(`${priority++}. **Review style consistency** - tone and formality variations detected`);
    }

    if (byType.get('factual')?.critical || byType.get('factual')?.major) {
      actions.push(`${priority++}. **Check factual accuracy** - inconsistencies or errors identified`);
    }

    const autoFixable = issues.filter(i => i.autoFixable).length;
    if (autoFixable > 0) {
      actions.push(`${priority++}. **Apply auto-fixes** - ${autoFixable} issues can be automatically corrected`);
    }

    return actions.join('\n');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a quality gauntlet with default configuration
 */
export function createDefaultGauntlet(): QualityGauntlet {
  return new QualityGauntlet();
}

/**
 * Create a strict quality gauntlet (higher thresholds)
 */
export function createStrictGauntlet(): QualityGauntlet {
  return new QualityGauntlet(undefined, {
    overallThreshold: 0.90,
    stopOnCritical: true,
    thresholdOverrides: {
      'citation-verifier': 0.90,
      'toulmin-enforcer': 0.85,
      'argument-coherence': 0.85,
      'citation-completeness': 0.90,
      'citation-density': 0.80,
      'style-consistency': 0.80,
      'factual-accuracy': 0.95,
      'claim-verification': 0.70,
    },
  });
}

/**
 * Create a lenient quality gauntlet (lower thresholds for drafts)
 */
export function createDraftGauntlet(): QualityGauntlet {
  return new QualityGauntlet(undefined, {
    overallThreshold: 0.60,
    stopOnCritical: false,
    thresholdOverrides: {
      'citation-verifier': 0.50,
      'toulmin-enforcer': 0.50,
      'argument-coherence': 0.60,
      'citation-completeness': 0.65,
      'citation-density': 0.50,
      'style-consistency': 0.55,
      'factual-accuracy': 0.70,
      'claim-verification': 0.40,
    },
  });
}

/**
 * Create a performance-optimized quality gauntlet
 *
 * Features:
 * - Parallel stage execution (3-5x faster)
 * - Result caching enabled
 * - Lower thresholds for faster iteration
 *
 * Target: < 30s p95 latency
 */
export function createPerformanceGauntlet(): QualityGauntlet {
  return new QualityGauntlet(undefined, {
    parallel: true,
    stopOnCritical: false,
    overallThreshold: 0.75,  // Slightly lower for faster feedback
  });
}

/**
 * Create a gauntlet focused on specific quality aspects
 */
export function createFocusedGauntlet(
  focus: 'argument' | 'citation' | 'style' | 'factual' | 'toulmin'
): QualityGauntlet {
  const weightOverrides: Record<string, number> = {
    'citation-verifier': 0.08,
    'quotation-fidelity': 0.10,
    'toulmin-enforcer': 0.13,
    'argument-coherence': 0.15,
    'citation-completeness': 0.15,
    'citation-density': 0.10,
    'style-consistency': 0.12,
    'factual-accuracy': 0.10,
    'claim-verification': 0.07,
  };

  // Increase weight of focused aspect
  switch (focus) {
    case 'argument':
      weightOverrides['toulmin-enforcer'] = 0.25;
      weightOverrides['argument-coherence'] = 0.30;
      weightOverrides['citation-completeness'] = 0.10;
      weightOverrides['citation-density'] = 0.07;
      weightOverrides['style-consistency'] = 0.08;
      weightOverrides['factual-accuracy'] = 0.08;
      weightOverrides['claim-verification'] = 0.05;
      break;
    case 'citation':
      weightOverrides['citation-verifier'] = 0.15;
      weightOverrides['toulmin-enforcer'] = 0.06;
      weightOverrides['argument-coherence'] = 0.08;
      weightOverrides['citation-completeness'] = 0.25;
      weightOverrides['citation-density'] = 0.18;
      weightOverrides['style-consistency'] = 0.05;
      weightOverrides['factual-accuracy'] = 0.05;
      weightOverrides['claim-verification'] = 0.10;
      break;
    case 'style':
      weightOverrides['citation-verifier'] = 0.06;
      weightOverrides['toulmin-enforcer'] = 0.08;
      weightOverrides['argument-coherence'] = 0.10;
      weightOverrides['citation-completeness'] = 0.08;
      weightOverrides['citation-density'] = 0.06;
      weightOverrides['style-consistency'] = 0.40;
      weightOverrides['factual-accuracy'] = 0.08;
      weightOverrides['claim-verification'] = 0.04;
      break;
    case 'factual':
      weightOverrides['citation-verifier'] = 0.10;
      weightOverrides['toulmin-enforcer'] = 0.08;
      weightOverrides['argument-coherence'] = 0.10;
      weightOverrides['citation-completeness'] = 0.10;
      weightOverrides['citation-density'] = 0.06;
      weightOverrides['style-consistency'] = 0.06;
      weightOverrides['factual-accuracy'] = 0.30;
      weightOverrides['claim-verification'] = 0.12;
      break;
    case 'toulmin':
      weightOverrides['citation-verifier'] = 0.06;
      weightOverrides['toulmin-enforcer'] = 0.35;
      weightOverrides['argument-coherence'] = 0.18;
      weightOverrides['citation-completeness'] = 0.08;
      weightOverrides['citation-density'] = 0.06;
      weightOverrides['style-consistency'] = 0.07;
      weightOverrides['factual-accuracy'] = 0.06;
      weightOverrides['claim-verification'] = 0.06;
      break;
  }

  return new QualityGauntlet(undefined, { weightOverrides });
}

// ============================================================================
// Enhanced Report Generation (Priority 2)
// ============================================================================

import {
  type EnhancedQualityReport,
  type EnhancedQualityStageResult,
  type EnhancedQualityIssue,
  enhanceStageResult,
  buildIssueLocationIndex,
  generateLocationReport,
} from './enhanced-types.js';

/**
 * Generate an EnhancedQualityReport from a GauntletResult.
 * Includes precise location tracking for all issues.
 *
 * @param result - Standard gauntlet result
 * @param content - Original content for location extraction
 * @returns Enhanced quality report with location tracking
 */
export function generateEnhancedReport(
  result: GauntletResult,
  content: string
): EnhancedQualityReport {
  // Enhance each stage result
  const enhancedStageResults: EnhancedQualityStageResult[] = result.stageResults.map(
    (stageResult) => enhanceStageResult(stageResult, content)
  );

  // Collect all enhanced issues
  const allIssues: EnhancedQualityIssue[] = enhancedStageResults.flatMap(
    (s) => s.issues
  );

  // Sort by severity (critical first)
  const sortedIssues = allIssues.sort((a, b) => {
    const severityOrder = { critical: 0, major: 1, minor: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const criticalIssues = sortedIssues.filter((i) => i.severity === 'critical');

  // Build location index
  const issueLocations = buildIssueLocationIndex(sortedIssues);

  return {
    runId: result.runId,
    timestamp: result.metadata.timestamp,
    passed: result.passed,
    overallScore: result.overallScore,
    stageResults: enhancedStageResults,
    allIssues: sortedIssues,
    criticalIssues,
    summary: result.summary,
    revisionRequired: result.revisionRequired,
    revisionGuidance: result.revisionGuidance,
    issueLocations,
  };
}

/**
 * Run the gauntlet and return an enhanced report with location tracking.
 *
 * @param gauntlet - QualityGauntlet instance
 * @param chapterText - Text to evaluate
 * @param chapterId - Chapter number
 * @param context - Optional evaluation context
 * @returns Enhanced quality report
 */
export async function runEnhancedGauntlet(
  gauntlet: QualityGauntlet,
  chapterText: string,
  chapterId: number,
  context?: QualityEvaluationContext
): Promise<EnhancedQualityReport> {
  const result = await gauntlet.runGauntlet(chapterText, chapterId, context);
  return generateEnhancedReport(result, chapterText);
}

/**
 * Generate a markdown report from an enhanced quality report.
 *
 * @param report - Enhanced quality report
 * @returns Formatted markdown string
 */
export function formatEnhancedReport(report: EnhancedQualityReport): string {
  return generateLocationReport(report.allIssues, {
    includeAutoFix: true,
    includeExcerpts: true,
    maxIssuesPerSeverity: 30,
  });
}
