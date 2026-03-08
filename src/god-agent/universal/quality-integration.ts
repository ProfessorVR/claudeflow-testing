/**
 * Quality Integration - Bridge between Universal Agent and Quality Gauntlet
 *
 * This module integrates the PhD pipeline's quality gauntlet system into
 * the universal agent's write() method, enabling automatic quality validation
 * and iterative revision for god-write outputs.
 *
 * Features:
 * - Automatic quality validation with 0.85 threshold
 * - Iterative revision loop (up to 3 attempts)
 * - Quality metrics logging to trajectory for learning
 * - Graceful degradation if quality gauntlet fails
 * - Compatible with existing universal agent architecture
 *
 * Integration Points:
 * - UniversalAgent.write() - Main entry point
 * - TrajectoryBridge - Quality metrics logging
 * - TaskExecutor - Revision execution
 *
 * Usage:
 * ```typescript
 * const integration = new QualityIntegration(agent);
 * const result = await integration.validateAndRevise(content, {
 *   topic,
 *   style,
 *   format,
 *   trajectoryId
 * });
 * ```
 */

import {
  QualityGauntlet,
  RevisionOrchestrator,
  createDefaultGauntlet,
  createDefaultOrchestrator,
  type GauntletResult,
  type RevisionRequest,
  type RefinementResult,
} from '../cli/quality/index.js';
import type { UniversalAgent } from './universal-agent.js';
import {
  HumanVerifier,
  createHumanVerifier,
  type HumanVerificationOptions,
  type VerificationDecision,
  type ReviewContext,
} from '../__experimental__/human-verification.js';

// ============================================================================
// Quality Integration Types
// ============================================================================

/**
 * Options for quality validation
 */
export interface QualityValidationOptions {
  /** Topic being written about */
  topic: string;

  /** Writing style */
  style: 'academic' | 'professional' | 'casual' | 'technical';

  /** Output format */
  format: 'essay' | 'report' | 'article' | 'paper';

  /** Trajectory ID for learning */
  trajectoryId?: string;

  /** Override quality threshold (default: 0.85) */
  qualityThreshold?: number;

  /** Override max revision attempts (default: 3) */
  maxRevisions?: number;

  /** Whether to enable quality validation (default: true) */
  enabled?: boolean;

  /** Corpus chunks for claim verification (passed to gauntlet context) */
  corpusChunks?: unknown[];

  /** Known corpus authors for claim verification */
  knownAuthors?: string[];

  /** Human verification options for interactive review */
  humanVerification?: HumanVerificationOptions;
}

/**
 * Result from quality validation and revision
 */
export interface QualityValidationResult {
  /** Final content after validation/revision */
  content: string;

  /** Whether quality threshold was met */
  passed: boolean;

  /** Final quality score (0-1) */
  qualityScore: number;

  /** Number of revision iterations performed */
  revisionIterations: number;

  /** Detailed gauntlet result */
  gauntletResult: GauntletResult;

  /** Quality metrics for learning */
  metrics: QualityMetrics;

  /** Whether any revisions were attempted */
  wasRevised: boolean;
}

/**
 * Quality metrics for trajectory logging
 */
export interface QualityMetrics {
  /** Overall quality score (0-1) */
  overallScore: number;

  /** Individual stage scores */
  stageScores: {
    argumentCoherence: number;
    citationCompleteness: number;
    styleConsistency: number;
    factualAccuracy: number;
  };

  /** Issue counts by severity */
  issueCounts: {
    critical: number;
    major: number;
    minor: number;
  };

  /** Auto-fixable issue count */
  autoFixableCount: number;

  /** Revision iterations performed */
  revisionIterations: number;

  /** Whether threshold was met */
  passed: boolean;
}

// ============================================================================
// Quality Integration Class
// ============================================================================

/**
 * Integrates quality gauntlet validation into universal agent write operations
 */
export class QualityIntegration {
  private gauntlet: QualityGauntlet;
  private orchestrator: RevisionOrchestrator;
  private humanVerifier: HumanVerifier;

  /** Default quality threshold for passing */
  static readonly DEFAULT_THRESHOLD = 0.85;

  /** Default max revision attempts */
  static readonly DEFAULT_MAX_REVISIONS = 3;

  /**
   * Create a new QualityIntegration
   *
   * @param agent - Universal agent instance (for accessing revision capabilities)
   * @param humanVerificationOptions - Options for human-in-the-loop verification
   */
  constructor(
    private agent: UniversalAgent,
    humanVerificationOptions?: HumanVerificationOptions
  ) {
    // Create gauntlet with custom threshold for god-write
    this.gauntlet = createDefaultGauntlet();
    this.gauntlet.updateConfig({
      overallThreshold: QualityIntegration.DEFAULT_THRESHOLD,
    });

    // Create orchestrator with god-write optimized settings
    this.orchestrator = createDefaultOrchestrator(this.gauntlet);
    this.orchestrator.updateConfig({
      maxIterations: QualityIntegration.DEFAULT_MAX_REVISIONS,
      minScoreImprovement: 0.02, // Continue revising if improving by at least 2%
      applyAutoFixes: true, // Auto-fix simple issues
      prioritizeSeverity: false, // Address all issue types
      maxIssuesInPrompt: 20, // Limit issues to avoid overwhelming revision
    });

    // Create human verifier for interactive review
    this.humanVerifier = createHumanVerifier(humanVerificationOptions);
  }

  /**
   * Validate content and perform iterative revision if needed
   *
   * @param content - Generated content to validate
   * @param options - Validation options
   * @returns Validation result with potentially revised content
   */
  async validateAndRevise(
    content: string,
    options: QualityValidationOptions
  ): Promise<QualityValidationResult> {
    // Check if validation is enabled
    if (options.enabled === false) {
      return this.createBypassResult(content);
    }

    // Save base config for restoration in finally block
    const baseThreshold = QualityIntegration.DEFAULT_THRESHOLD;
    const baseMaxRevisions = QualityIntegration.DEFAULT_MAX_REVISIONS;

    try {
      // Apply per-request overrides (restored after call via finally block)
      if (options.qualityThreshold !== undefined) {
        this.gauntlet.updateConfig({
          overallThreshold: options.qualityThreshold,
        });
      }
      if (options.maxRevisions !== undefined) {
        this.orchestrator.updateConfig({
          maxIterations: options.maxRevisions,
        });
      }

      // Build gauntlet context with corpus chunks for claim verification
      const gauntletContext = {
        corpusChunks: options.corpusChunks ?? [],
        knownAuthors: options.knownAuthors ?? [],
      };

      // Run initial quality evaluation
      const initialResult = await this.gauntlet.runGauntlet(content, 1, gauntletContext);

      // Log initial quality metrics
      this.logQualityMetrics(initialResult, options.trajectoryId, 0);

      // If already passing, return immediately
      if (initialResult.passed) {
        return this.createSuccessResult(content, initialResult, 0);
      }

      // Need revision - run iterative refinement with human verification
      let currentContent = content;
      let currentResult = initialResult;
      let iteration = 0;
      const threshold = options.qualityThreshold ?? QualityIntegration.DEFAULT_THRESHOLD;
      const maxIterations = options.maxRevisions ?? QualityIntegration.DEFAULT_MAX_REVISIONS;

      // Reset human verifier for new write operation
      this.humanVerifier.resetPrompts();

      while (iteration < maxIterations && !currentResult.passed) {
        iteration++;

        // Human verification check (if enabled via options)
        if (options.humanVerification?.enabled && this.humanVerifier.shouldPrompt(iteration, currentResult.overallScore, threshold)) {
          const reviewContext: ReviewContext = {
            iteration,
            maxIterations,
            currentScore: currentResult.overallScore,
            targetThreshold: threshold,
            previousScore: iteration > 1 ? currentResult.overallScore : undefined,
            gauntletResult: currentResult,
            content: currentContent,
          };

          const decision = await this.humanVerifier.promptReview(reviewContext);

          // Handle user decision
          switch (decision.action) {
            case 'accept':
              // User accepted current version - return immediately
              return this.createSuccessResult(currentContent, currentResult, iteration);

            case 'abort':
              // User aborted - return error result
              return this.createErrorResult(currentContent, new Error('User aborted revision'));

            case 'guidance':
              // User provided custom guidance - use it in revision prompt
              if (decision.customGuidance) {
                this.log(`Using custom guidance: ${decision.customGuidance}`);
              }
              break;

            case 'skip':
              // User wants to skip certain issues - filter them out
              if (decision.skipIssueIds && decision.skipIssueIds.length > 0) {
                this.log(`Skipping ${decision.skipIssueIds.length} issues`);
                // Note: Issue filtering would need to be implemented in orchestrator
              }
              break;

            case 'continue':
            default:
              // Continue with automatic revision
              break;
          }
        }

        // Create revision request
        const revisionRequest: RevisionRequest = {
          originalText: currentContent,
          iteration,
          previousScore: currentResult.overallScore,
          issues: currentResult.stageResults.flatMap(s => s.issues),
          targetThreshold: threshold,
        };

        // Build revision prompt
        const revisionPrompt = this.buildRevisionPrompt(
          revisionRequest,
          options.topic,
          options.style,
          options.format
        );

        // Execute revision via universal agent
        const revisedContent = await this.executeRevision(revisionPrompt, options);

        // Re-evaluate quality
        const newResult = await this.gauntlet.runGauntlet(revisedContent, iteration + 1, gauntletContext);

        // Log quality metrics
        this.logQualityMetrics(newResult, options.trajectoryId, iteration);

        // Check for improvement
        if (newResult.overallScore <= currentResult.overallScore + 0.02) {
          // No significant improvement - stop revising
          this.log('No significant improvement, stopping revisions');
          break;
        }

        // Update current state
        currentContent = revisedContent;
        currentResult = newResult;
      }

      // Return final result
      return {
        content: currentContent,
        passed: currentResult.passed,
        qualityScore: currentResult.overallScore,
        revisionIterations: iteration,
        gauntletResult: currentResult,
        metrics: this.extractMetrics(currentResult, iteration),
        wasRevised: iteration > 0,
      };
    } catch (error) {
      // Graceful degradation - if quality gauntlet fails, return original content
      this.logError('Quality validation failed, using original content', error);
      return this.createErrorResult(content, error);
    } finally {
      // Restore base config so per-request overrides don't leak
      this.gauntlet.updateConfig({ overallThreshold: baseThreshold });
      this.orchestrator.updateConfig({ maxIterations: baseMaxRevisions });
    }
  }

  /**
   * Get quality metrics from content without revision
   * (useful for analysis/learning)
   */
  async evaluateQuality(content: string): Promise<QualityMetrics> {
    try {
      const result = await this.gauntlet.runGauntlet(content, 1);
      return this.extractMetrics(result, 0);
    } catch (error) {
      this.logError('Quality evaluation failed', error);
      return this.createDefaultMetrics();
    }
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Build revision prompt with context from universal agent
   */
  private buildRevisionPrompt(
    request: RevisionRequest,
    topic: string,
    style: string,
    format: string
  ): string {
    const basePrompt = this.orchestrator.buildRevisionPrompt(request);

    // Enhance with universal agent context
    const enhancedPrompt = `
# REVISION REQUEST FOR: ${topic}

**Style:** ${style}
**Format:** ${format}
**Iteration:** ${request.iteration} of ${this.orchestrator.getConfig().maxIterations}
**Current Score:** ${(request.previousScore * 100).toFixed(1)}%

${basePrompt}

## ORIGINAL TEXT TO REVISE

${request.originalText}

---

Return ONLY the complete revised text. Do not include explanations or meta-commentary.
`;

    return enhancedPrompt;
  }

  /**
   * Execute revision via universal agent's task execution
   */
  private async executeRevision(
    prompt: string,
    options: QualityValidationOptions
  ): Promise<string> {
    // Access private method via type assertion (internal integration)
    const agentAny = this.agent as any;

    // Use the agent's selectAgentForTask to get appropriate revision agent
    const agentSelection = await agentAny.selectAgentForTask(
      `Revise content: ${options.topic}`
    );

    // Override prompt with revision-specific instructions
    const revisionSelection = {
      ...agentSelection,
      prompt,
    };

    // Execute via TaskExecutor
    const result = await agentAny.executeTaskDefault(
      revisionSelection,
      undefined,
      { trajectoryId: options.trajectoryId }
    );

    if (!result.success) {
      this.logError('Revision execution failed', new Error(result.error || 'Unknown error'));
      return prompt; // Fallback to original if revision fails
    }

    return result.result || prompt;
  }

  /**
   * Extract quality metrics from gauntlet result
   */
  private extractMetrics(
    result: GauntletResult,
    iterations: number
  ): QualityMetrics {
    // Extract individual stage scores
    const stageScores = {
      argumentCoherence: 0,
      citationCompleteness: 0,
      styleConsistency: 0,
      factualAccuracy: 0,
    };

    for (const stage of result.stageResults) {
      switch (stage.stageName) {
        case 'argument-coherence':
          stageScores.argumentCoherence = stage.score;
          break;
        case 'citation-completeness':
          stageScores.citationCompleteness = stage.score;
          break;
        case 'style-consistency':
          stageScores.styleConsistency = stage.score;
          break;
        case 'factual-accuracy':
          stageScores.factualAccuracy = stage.score;
          break;
      }
    }

    return {
      overallScore: result.overallScore,
      stageScores,
      issueCounts: {
        critical: result.summary.criticalCount,
        major: result.summary.majorCount,
        minor: result.summary.minorCount,
      },
      autoFixableCount: result.summary.autoFixableCount,
      revisionIterations: iterations,
      passed: result.passed,
    };
  }

  /**
   * Log quality metrics to trajectory for learning
   */
  private logQualityMetrics(
    result: GauntletResult,
    trajectoryId: string | undefined,
    iterations: number
  ): void {
    if (!trajectoryId) return;

    const metrics = this.extractMetrics(result, iterations);

    // Access trajectory bridge via agent (if available)
    const agentAny = this.agent as any;
    if (agentAny.trajectoryBridge) {
      try {
        // Store quality metrics as trajectory metadata
        agentAny.trajectoryBridge.storeMetadata(trajectoryId, {
          qualityMetrics: metrics,
          qualityGauntletRun: {
            runId: result.runId,
            score: result.overallScore,
            passed: result.passed,
            iterations,
            timestamp: result.metadata.timestamp,
          },
        }).catch((err: Error) => {
          this.logError('Failed to store quality metrics', err);
        });
      } catch (error) {
        this.logError('Failed to access trajectory bridge', error);
      }
    }
  }

  /**
   * Create success result (passed initial evaluation)
   */
  private createSuccessResult(
    content: string,
    result: GauntletResult,
    iterations: number
  ): QualityValidationResult {
    return {
      content,
      passed: true,
      qualityScore: result.overallScore,
      revisionIterations: iterations,
      gauntletResult: result,
      metrics: this.extractMetrics(result, iterations),
      wasRevised: iterations > 0,
    };
  }

  /**
   * Create refinement result (after revisions)
   */
  private createRefinementResult(
    result: RefinementResult
  ): QualityValidationResult {
    return {
      content: result.finalText,
      passed: result.passed,
      qualityScore: result.finalScore,
      revisionIterations: result.iterations,
      gauntletResult: result.finalGauntletResult,
      metrics: this.extractMetrics(result.finalGauntletResult, result.iterations),
      wasRevised: result.iterations > 0,
    };
  }

  /**
   * Create bypass result (validation disabled)
   */
  private createBypassResult(content: string): QualityValidationResult {
    return {
      content,
      passed: true,
      qualityScore: 1.0,
      revisionIterations: 0,
      gauntletResult: null as any, // Bypassed
      metrics: this.createDefaultMetrics(),
      wasRevised: false,
    };
  }

  /**
   * Create error result (graceful degradation)
   */
  private createErrorResult(content: string, error: unknown): QualityValidationResult {
    return {
      content, // Return original content
      passed: false,
      qualityScore: 0.5, // Unknown quality
      revisionIterations: 0,
      gauntletResult: null as any, // Error occurred
      metrics: this.createDefaultMetrics(),
      wasRevised: false,
    };
  }

  /**
   * Create default metrics (for errors/bypasses)
   */
  private createDefaultMetrics(): QualityMetrics {
    return {
      overallScore: 0.5,
      stageScores: {
        argumentCoherence: 0.5,
        citationCompleteness: 0.5,
        styleConsistency: 0.5,
        factualAccuracy: 0.5,
      },
      issueCounts: {
        critical: 0,
        major: 0,
        minor: 0,
      },
      autoFixableCount: 0,
      revisionIterations: 0,
      passed: false,
    };
  }

  /**
   * Log error (uses agent's logger if available)
   */
  private logError(message: string, error: unknown): void {
    const agentAny = this.agent as any;
    if (agentAny.log) {
      agentAny.log(`[QualityIntegration] ${message}: ${error}`);
    } else {
      console.error(`[QualityIntegration] ${message}:`, error);
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create quality integration for universal agent
 */
export function createQualityIntegration(agent: UniversalAgent): QualityIntegration {
  return new QualityIntegration(agent);
}
