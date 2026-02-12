/**
 * RevisionOrchestrator - Handles iterative refinement until quality thresholds are met
 *
 * The orchestrator manages the revision loop:
 * 1. Run quality gauntlet
 * 2. If issues found, generate revision request
 * 3. Agent performs revision
 * 4. Repeat until quality met or max iterations reached
 *
 * Features:
 * - Maximum iteration limit to prevent infinite loops
 * - Issue tracking across iterations
 * - Revision prompt generation
 * - History tracking for debugging
 */

import { v4 as uuidv4 } from 'uuid';
import {
  QualityGauntlet,
  type GauntletResult,
} from './quality-gauntlet.js';
import type {
  QualityIssue,
  QualityEvaluationContext,
} from './quality-stage.js';

// ============================================================================
// Revision Types
// ============================================================================

/**
 * Request for a revision pass
 */
export interface RevisionRequest {
  /** Unique request ID */
  requestId: string;

  /** Chapter being revised */
  chapterId: number;

  /** Issues to address in this revision */
  issues: QualityIssue[];

  /** Current text to revise */
  originalText: string;

  /** Specific guidance for the revision */
  revisionGuidance: string;

  /** Current iteration number (1-indexed) */
  iteration: number;

  /** Score from previous evaluation */
  previousScore: number;

  /** Issues that were fixed in previous iterations */
  previouslyResolvedIssues: string[];
}

/**
 * Result from a revision pass
 */
export interface RevisionResult {
  /** Whether the revision was successful */
  success: boolean;

  /** The revised text */
  revisedText: string;

  /** IDs of issues resolved in this revision */
  resolvedIssues: string[];

  /** Issues still remaining after revision */
  remainingIssues: QualityIssue[];

  /** Current iteration number */
  iteration: number;

  /** Quality score after revision */
  newScore: number;

  /** Time taken for this revision in ms */
  durationMs: number;
}

/**
 * Final result from the refinement process
 */
export interface RefinementResult {
  /** Final text after all revisions */
  finalText: string;

  /** Number of iterations performed */
  iterations: number;

  /** Whether quality thresholds were met */
  passed: boolean;

  /** Final quality score */
  finalScore: number;

  /** Complete revision history */
  history: RevisionResult[];

  /** Issues that were never resolved */
  unresolvedIssues: QualityIssue[];

  /** Total time for entire refinement process */
  totalDurationMs: number;

  /** Final gauntlet result */
  finalGauntletResult: GauntletResult;
}

/**
 * Interactive review decision from user
 */
export interface InteractiveReviewDecision {
  /** Whether to continue with revision */
  continue: boolean;
  /** Optional modified text (if user made manual edits) */
  modifiedText?: string;
  /** Optional specific issues to focus on (by ID) */
  focusIssues?: string[];
  /** Whether to skip certain issues */
  skipIssues?: string[];
  /** Additional guidance for the revision */
  additionalGuidance?: string;
}

/**
 * Context provided to interactive review callback
 */
export interface InteractiveReviewContext {
  /** Current iteration number */
  iteration: number;
  /** Current quality score */
  currentScore: number;
  /** Previous score (for comparison) */
  previousScore: number;
  /** Current text */
  currentText: string;
  /** Issues found */
  issues: QualityIssue[];
  /** Full gauntlet result */
  gauntletResult: GauntletResult;
  /** Revision history so far */
  history: RevisionResult[];
}

/**
 * Configuration for the revision orchestrator
 */
export interface RevisionOrchestratorConfig {
  /** Maximum number of revision iterations (default: 3) */
  maxIterations: number;

  /** Minimum score improvement required to continue (default: 0.02) */
  minScoreImprovement: number;

  /** Whether to apply auto-fixes before each revision (default: true) */
  applyAutoFixes: boolean;

  /** Whether to focus on critical/major issues only (default: false) */
  prioritizeSeverity: boolean;

  /** Maximum issues to include in revision prompt (default: 20) */
  maxIssuesInPrompt: number;

  /**
   * Optional interactive review callback - called after each evaluation
   * to allow user review before proceeding with next revision.
   * Return { continue: false } to stop the revision loop early.
   */
  interactiveReviewCallback?: (
    context: InteractiveReviewContext
  ) => Promise<InteractiveReviewDecision>;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: RevisionOrchestratorConfig = {
  maxIterations: 3,
  minScoreImprovement: 0.02,
  applyAutoFixes: true,
  prioritizeSeverity: false,
  maxIssuesInPrompt: 20,
};

// ============================================================================
// RevisionOrchestrator Class
// ============================================================================

/**
 * Orchestrates iterative chapter refinement
 */
export class RevisionOrchestrator {
  private gauntlet: QualityGauntlet;
  private config: RevisionOrchestratorConfig;

  /**
   * Create a new RevisionOrchestrator
   *
   * @param gauntlet - Quality gauntlet to use for evaluation
   * @param config - Configuration options
   */
  constructor(
    gauntlet: QualityGauntlet,
    config?: Partial<RevisionOrchestratorConfig>
  ) {
    this.gauntlet = gauntlet;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Iteratively refine chapter text until quality threshold met or max iterations reached
   *
   * @param chapterText - Initial chapter text
   * @param chapterId - Chapter number
   * @param revisionCallback - Callback that performs the actual revision
   * @param context - Optional evaluation context
   * @returns Final refinement result
   */
  async refineUntilQuality(
    chapterText: string,
    chapterId: number,
    revisionCallback: (request: RevisionRequest) => Promise<string>,
    context?: QualityEvaluationContext
  ): Promise<RefinementResult> {
    const startTime = Date.now();
    const history: RevisionResult[] = [];
    let currentText = chapterText;
    let iteration = 0;
    let previousScore = 0;
    const resolvedIssueIds = new Set<string>();

    // Initial evaluation
    let gauntletResult = await this.gauntlet.runGauntlet(currentText, chapterId, context);

    // If already passing, return immediately
    if (gauntletResult.passed) {
      return {
        finalText: currentText,
        iterations: 0,
        passed: true,
        finalScore: gauntletResult.overallScore,
        history: [],
        unresolvedIssues: [],
        totalDurationMs: Date.now() - startTime,
        finalGauntletResult: gauntletResult,
      };
    }

    // Interactive review before starting revisions (if callback provided)
    if (this.config.interactiveReviewCallback) {
      const decision = await this.config.interactiveReviewCallback({
        iteration: 0,
        currentScore: gauntletResult.overallScore,
        previousScore: 0,
        currentText,
        issues: gauntletResult.allIssues,
        gauntletResult,
        history: [],
      });

      if (!decision.continue) {
        // User decided to stop before any revisions
        return {
          finalText: decision.modifiedText || currentText,
          iterations: 0,
          passed: false,
          finalScore: gauntletResult.overallScore,
          history: [],
          unresolvedIssues: gauntletResult.allIssues,
          totalDurationMs: Date.now() - startTime,
          finalGauntletResult: gauntletResult,
        };
      }

      // Apply any user modifications
      if (decision.modifiedText) {
        currentText = decision.modifiedText;
        gauntletResult = await this.gauntlet.runGauntlet(currentText, chapterId, context);
        if (gauntletResult.passed) {
          return {
            finalText: currentText,
            iterations: 0,
            passed: true,
            finalScore: gauntletResult.overallScore,
            history: [],
            unresolvedIssues: [],
            totalDurationMs: Date.now() - startTime,
            finalGauntletResult: gauntletResult,
          };
        }
      }
    }

    // Track issues to skip (from interactive decisions)
    const skipIssueIds = new Set<string>();

    // Revision loop
    while (iteration < this.config.maxIterations && gauntletResult.revisionRequired) {
      iteration++;
      const iterationStart = Date.now();

      // Apply auto-fixes first if enabled
      if (this.config.applyAutoFixes && gauntletResult.allIssues.some(i => i.autoFixable)) {
        const { text: autoFixed, fixedCount } = await this.gauntlet.applyAutoFixes(
          currentText,
          gauntletResult.allIssues
        );

        if (fixedCount > 0) {
          currentText = autoFixed;

          // Re-evaluate after auto-fixes
          gauntletResult = await this.gauntlet.runGauntlet(currentText, chapterId, context);

          // If auto-fixes were enough, we're done
          if (gauntletResult.passed) {
            history.push({
              success: true,
              revisedText: currentText,
              resolvedIssues: gauntletResult.allIssues
                .filter(i => i.autoFixable)
                .map(i => i.id),
              remainingIssues: gauntletResult.allIssues,
              iteration,
              newScore: gauntletResult.overallScore,
              durationMs: Date.now() - iterationStart,
            });

            break;
          }
        }
      }

      // Create revision request
      const request = this.createRevisionRequest(
        chapterId,
        currentText,
        gauntletResult,
        iteration,
        previousScore,
        Array.from(resolvedIssueIds)
      );

      // Call the revision callback (this is where the actual AI revision happens)
      const revisedText = await revisionCallback(request);

      // Evaluate revised text
      previousScore = gauntletResult.overallScore;
      gauntletResult = await this.gauntlet.runGauntlet(revisedText, chapterId, context);

      // Track resolved issues
      const previousIssueIds = new Set(request.issues.map(i => i.id));
      const remainingIssueIds = new Set(gauntletResult.allIssues.map(i => i.id));

      const newlyResolved = Array.from(previousIssueIds).filter(
        id => !remainingIssueIds.has(id)
      );
      newlyResolved.forEach(id => resolvedIssueIds.add(id));

      // Record result
      const revisionResult: RevisionResult = {
        success: gauntletResult.overallScore > previousScore,
        revisedText,
        resolvedIssues: newlyResolved,
        remainingIssues: gauntletResult.allIssues,
        iteration,
        newScore: gauntletResult.overallScore,
        durationMs: Date.now() - iterationStart,
      };

      history.push(revisionResult);
      currentText = revisedText;

      // Interactive review after each revision (if callback provided and not yet passed)
      if (this.config.interactiveReviewCallback && !gauntletResult.passed) {
        const decision = await this.config.interactiveReviewCallback({
          iteration,
          currentScore: gauntletResult.overallScore,
          previousScore,
          currentText,
          issues: gauntletResult.allIssues,
          gauntletResult,
          history,
        });

        if (!decision.continue) {
          // User decided to stop
          break;
        }

        // Apply any user modifications
        if (decision.modifiedText) {
          currentText = decision.modifiedText;
          gauntletResult = await this.gauntlet.runGauntlet(currentText, chapterId, context);
          if (gauntletResult.passed) {
            break;
          }
        }

        // Track skipped issues
        if (decision.skipIssues) {
          decision.skipIssues.forEach(id => skipIssueIds.add(id));
        }
      }

      // Check for minimum improvement
      const improvement = gauntletResult.overallScore - previousScore;
      if (improvement < this.config.minScoreImprovement && iteration > 1) {
        // Not making meaningful progress, stop
        break;
      }

      // If passed, stop
      if (gauntletResult.passed) {
        break;
      }
    }

    return {
      finalText: currentText,
      iterations: iteration,
      passed: gauntletResult.passed,
      finalScore: gauntletResult.overallScore,
      history,
      unresolvedIssues: gauntletResult.allIssues.filter(
        i => i.severity === 'critical' || i.severity === 'major'
      ),
      totalDurationMs: Date.now() - startTime,
      finalGauntletResult: gauntletResult,
    };
  }

  /**
   * Perform a single revision pass
   *
   * @param request - Revision request
   * @param revisionCallback - Callback that performs the revision
   * @param context - Optional evaluation context
   * @returns Revision result
   */
  async performRevision(
    request: RevisionRequest,
    revisionCallback: (request: RevisionRequest) => Promise<string>,
    context?: QualityEvaluationContext
  ): Promise<RevisionResult> {
    const startTime = Date.now();

    // Call the revision callback
    const revisedText = await revisionCallback(request);

    // Evaluate revised text
    const gauntletResult = await this.gauntlet.runGauntlet(
      revisedText,
      request.chapterId,
      context
    );

    // Determine resolved issues
    const previousIssueIds = new Set(request.issues.map(i => i.id));
    const remainingIssueIds = new Set(gauntletResult.allIssues.map(i => i.id));

    const resolvedIssues = Array.from(previousIssueIds).filter(
      id => !remainingIssueIds.has(id)
    );

    return {
      success: gauntletResult.overallScore > request.previousScore,
      revisedText,
      resolvedIssues,
      remainingIssues: gauntletResult.allIssues,
      iteration: request.iteration,
      newScore: gauntletResult.overallScore,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Build a revision prompt for the writing agent
   *
   * @param request - Revision request
   * @returns Formatted prompt string
   */
  buildRevisionPrompt(request: RevisionRequest): string {
    const sections: string[] = [];

    sections.push('# CHAPTER REVISION REQUEST');
    sections.push('');
    sections.push(`**Chapter:** ${request.chapterId}`);
    sections.push(`**Iteration:** ${request.iteration} of ${this.config.maxIterations}`);
    sections.push(`**Current Score:** ${(request.previousScore * 100).toFixed(1)}%`);
    sections.push('');

    sections.push('## REVISION OBJECTIVE');
    sections.push('');
    sections.push('Revise the chapter text to address the following quality issues.');
    sections.push('Focus on substantive improvements while maintaining the original');
    sections.push('argument structure and content coverage.');
    sections.push('');

    // Critical issues
    const critical = request.issues.filter(i => i.severity === 'critical');
    if (critical.length > 0) {
      sections.push('## CRITICAL ISSUES (Must Fix)');
      sections.push('');
      for (const issue of critical) {
        sections.push(this.formatIssueForPrompt(issue));
      }
      sections.push('');
    }

    // Major issues
    const major = request.issues.filter(i => i.severity === 'major');
    if (major.length > 0) {
      sections.push('## MAJOR ISSUES (Should Fix)');
      sections.push('');
      const majorToShow = major.slice(0, this.config.maxIssuesInPrompt - critical.length);
      for (const issue of majorToShow) {
        sections.push(this.formatIssueForPrompt(issue));
      }
      if (major.length > majorToShow.length) {
        sections.push(`... and ${major.length - majorToShow.length} more major issues`);
      }
      sections.push('');
    }

    // Minor issues (summary only)
    const minor = request.issues.filter(i => i.severity === 'minor');
    if (minor.length > 0 && !this.config.prioritizeSeverity) {
      sections.push('## MINOR ISSUES (Consider Fixing)');
      sections.push('');
      sections.push(`${minor.length} minor issues detected. Focus on these after`);
      sections.push('addressing critical and major issues:');

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

    // Specific guidance
    if (request.revisionGuidance) {
      sections.push('## SPECIFIC GUIDANCE');
      sections.push('');
      sections.push(request.revisionGuidance);
      sections.push('');
    }

    // Previously resolved
    if (request.previouslyResolvedIssues.length > 0) {
      sections.push('## PROGRESS');
      sections.push('');
      sections.push(`${request.previouslyResolvedIssues.length} issues resolved in previous iterations.`);
      sections.push('Continue building on this progress.');
      sections.push('');
    }

    // Instructions
    sections.push('## INSTRUCTIONS');
    sections.push('');
    sections.push('1. Address all CRITICAL issues - these block publication');
    sections.push('2. Address as many MAJOR issues as possible');
    sections.push('3. Maintain the overall chapter structure and argument flow');
    sections.push('4. Preserve all citations and references');
    sections.push('5. Keep the academic tone consistent');
    sections.push('6. Do not significantly reduce content length');
    sections.push('');
    sections.push('Return the complete revised chapter text.');

    return sections.join('\n');
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RevisionOrchestratorConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RevisionOrchestratorConfig {
    return { ...this.config };
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Create a revision request from gauntlet results
   */
  private createRevisionRequest(
    chapterId: number,
    text: string,
    gauntletResult: GauntletResult,
    iteration: number,
    previousScore: number,
    previouslyResolvedIssues: string[]
  ): RevisionRequest {
    // Filter and prioritize issues
    let issues = gauntletResult.allIssues;

    if (this.config.prioritizeSeverity) {
      issues = issues.filter(i => i.severity === 'critical' || i.severity === 'major');
    }

    // Limit issues in prompt
    if (issues.length > this.config.maxIssuesInPrompt) {
      // Prioritize by severity
      const critical = issues.filter(i => i.severity === 'critical');
      const major = issues.filter(i => i.severity === 'major');
      const minor = issues.filter(i => i.severity === 'minor');

      issues = [
        ...critical,
        ...major.slice(0, this.config.maxIssuesInPrompt - critical.length),
      ];

      if (issues.length < this.config.maxIssuesInPrompt) {
        issues.push(
          ...minor.slice(0, this.config.maxIssuesInPrompt - issues.length)
        );
      }
    }

    return {
      requestId: uuidv4(),
      chapterId,
      issues,
      originalText: text,
      revisionGuidance: gauntletResult.revisionGuidance,
      iteration,
      previousScore,
      previouslyResolvedIssues,
    };
  }

  /**
   * Format an issue for inclusion in revision prompt
   */
  private formatIssueForPrompt(issue: QualityIssue): string {
    const lines: string[] = [];

    const location = issue.location.paragraphIndex !== undefined
      ? `[Paragraph ${issue.location.paragraphIndex + 1}]`
      : '[General]';

    lines.push(`### ${issue.type.toUpperCase()} ${location}`);
    lines.push(`**Problem:** ${issue.description}`);
    lines.push(`**Solution:** ${issue.suggestion}`);

    if (issue.contextSnippet) {
      lines.push(`**Context:** "${issue.contextSnippet.substring(0, 100)}..."`);
    }

    // Add specialized guidance for Toulmin issues
    if (this.isToulminIssue(issue)) {
      lines.push('');
      lines.push(this.generateToulminGuidance(issue));
    }

    lines.push('');

    return lines.join('\n');
  }

  /**
   * Check if an issue is a Toulmin-specific argument issue
   */
  private isToulminIssue(issue: QualityIssue): boolean {
    const toulminKeywords = [
      'claim', 'grounds', 'warrant', 'backing', 'qualifier', 'rebuttal',
      'toulmin', 'argument structure', 'missing warrant', 'missing backing',
      'explicit claim', 'support evidence'
    ];

    const description = issue.description.toLowerCase();
    return issue.type === 'argument' &&
      toulminKeywords.some(keyword => description.includes(keyword));
  }

  /**
   * Generate specialized guidance for Toulmin-related issues
   */
  private generateToulminGuidance(issue: QualityIssue): string {
    const description = issue.description.toLowerCase();

    // Detect which Toulmin element is missing
    if (description.includes('warrant') || description.includes('connection')) {
      return `**Toulmin Guidance:** Add an explicit warrant that explains WHY the evidence supports the claim. Use phrases like "This matters because...", "This demonstrates that...", or "The significance of this is...". The warrant should make the logical connection explicit.`;
    }

    if (description.includes('backing')) {
      return `**Toulmin Guidance:** Strengthen the warrant with backing - cite theoretical frameworks, established principles, or methodological justifications that establish the warrant's authority. Use phrases like "According to [theory/scholar]...", "Building on the established principle that...", or "As methodologically demonstrated by...".`;
    }

    if (description.includes('claim') || description.includes('thesis')) {
      return `**Toulmin Guidance:** Make the central claim explicit and specific. A strong claim should be contestable, specific, and significant. Avoid hedging that weakens the claim, but include appropriate academic qualifiers where needed.`;
    }

    if (description.includes('grounds') || description.includes('evidence')) {
      return `**Toulmin Guidance:** Provide specific evidence (data, examples, citations) that supports the claim. Each piece of evidence should be directly relevant to the claim and properly cited. Aim for multiple sources per major claim.`;
    }

    if (description.includes('qualifier')) {
      return `**Toulmin Guidance:** Add appropriate qualifiers to indicate the scope and certainty of the claim. Academic writing requires precision about when claims apply. Use phrases like "In most cases...", "Under conditions of...", or "For this population...".`;
    }

    if (description.includes('rebuttal') || description.includes('counter')) {
      return `**Toulmin Guidance:** Address potential counterarguments or limitations. Acknowledge conditions under which the argument might not hold. This strengthens the argument by demonstrating awareness of its boundaries.`;
    }

    // General Toulmin guidance
    return `**Toulmin Guidance:** Ensure the argument follows the Toulmin structure: CLAIM (what you're arguing) → GROUNDS (evidence/data) → WARRANT (why the evidence supports the claim) → BACKING (support for the warrant) → QUALIFIER (scope/certainty) → REBUTTAL (exceptions/counters).`;
  }

  /**
   * Generate specialized revision guidance for specific issue types
   *
   * @param issues - All issues from gauntlet evaluation
   * @returns Specialized guidance string
   */
  generateSpecializedGuidance(issues: QualityIssue[]): string {
    const sections: string[] = [];

    // Count issues by type
    const argumentIssues = issues.filter(i => i.type === 'argument');
    const citationIssues = issues.filter(i => i.type === 'citation');
    const styleIssues = issues.filter(i => i.type === 'style');
    const factualIssues = issues.filter(i => i.type === 'factual');

    // Generate specialized guidance for prominent issue types
    if (argumentIssues.length >= 3) {
      sections.push('## ARGUMENT STRUCTURE FOCUS');
      sections.push('');
      sections.push('Multiple argument structure issues detected. Apply the Toulmin model:');
      sections.push('');
      sections.push('1. **Every major claim** needs explicit grounds (evidence)');
      sections.push('2. **Every evidence-claim link** needs a warrant (reasoning why)');
      sections.push('3. **Strong warrants** need backing (theoretical support)');
      sections.push('4. **Academic claims** should include qualifiers (scope limitations)');
      sections.push('5. **Robust arguments** address potential rebuttals');
      sections.push('');
      sections.push('Pattern: "X [evidence]. This demonstrates Y [warrant] because Z [backing]."');
      sections.push('');
    }

    if (citationIssues.length >= 5) {
      sections.push('## CITATION DENSITY FOCUS');
      sections.push('');
      sections.push('Significant citation gaps detected. Academic standards require:');
      sections.push('');
      sections.push('1. **15+ citations** per major section');
      sections.push('2. **Every substantive claim** must have citation support');
      sections.push('3. **Primary sources** from peer-reviewed literature');
      sections.push('4. **APA 7th edition** format (Author, Year)');
      sections.push('5. **Corpus verification** - all citations must exist in corpus');
      sections.push('');
    }

    if (styleIssues.length >= 3) {
      sections.push('## STYLE CONSISTENCY FOCUS');
      sections.push('');
      sections.push('Style inconsistencies detected. Maintain:');
      sections.push('');
      sections.push('1. **No contractions** (don\'t → do not)');
      sections.push('2. **Formal register** throughout');
      sections.push('3. **Consistent terminology** for key concepts');
      sections.push('4. **Appropriate hedging** for claims');
      sections.push('5. **Paragraph structure** (topic sentence → evidence → analysis)');
      sections.push('');
    }

    if (factualIssues.length >= 2) {
      sections.push('## FACTUAL CONSISTENCY FOCUS');
      sections.push('');
      sections.push('Internal consistency issues detected. Verify:');
      sections.push('');
      sections.push('1. **Cross-reference** all cited data/statistics');
      sections.push('2. **Consistent dates** and publication years');
      sections.push('3. **Author names** spelled consistently');
      sections.push('4. **Terminology** used consistently throughout');
      sections.push('5. **Self-consistency** with earlier/later sections');
      sections.push('');
    }

    return sections.join('\n');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a revision orchestrator with default settings
 */
export function createDefaultOrchestrator(gauntlet: QualityGauntlet): RevisionOrchestrator {
  return new RevisionOrchestrator(gauntlet);
}

/**
 * Create a strict orchestrator (more iterations, higher standards)
 */
export function createStrictOrchestrator(gauntlet: QualityGauntlet): RevisionOrchestrator {
  return new RevisionOrchestrator(gauntlet, {
    maxIterations: 5,
    minScoreImprovement: 0.01,
    prioritizeSeverity: false,
    maxIssuesInPrompt: 30,
  });
}

/**
 * Create a fast orchestrator (fewer iterations)
 */
export function createFastOrchestrator(gauntlet: QualityGauntlet): RevisionOrchestrator {
  return new RevisionOrchestrator(gauntlet, {
    maxIterations: 2,
    minScoreImprovement: 0.05,
    prioritizeSeverity: true,
    maxIssuesInPrompt: 10,
  });
}

/**
 * Create an interactive orchestrator with user review between iterations
 *
 * @param gauntlet - Quality gauntlet to use
 * @param reviewCallback - Callback invoked after each evaluation for user review
 * @returns Interactive revision orchestrator
 */
export function createInteractiveOrchestrator(
  gauntlet: QualityGauntlet,
  reviewCallback: (context: InteractiveReviewContext) => Promise<InteractiveReviewDecision>
): RevisionOrchestrator {
  return new RevisionOrchestrator(gauntlet, {
    maxIterations: 5, // Allow more iterations since user is guiding
    minScoreImprovement: 0.01, // Lower threshold since user may accept smaller gains
    applyAutoFixes: true,
    prioritizeSeverity: false,
    maxIssuesInPrompt: 30,
    interactiveReviewCallback: reviewCallback,
  });
}
