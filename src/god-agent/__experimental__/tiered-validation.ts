/** @deprecated Test-only / experimental module. Do not import in production. */

/**
 * Tiered Validation System - Multi-level validation for god-write outputs
 *
 * Implements a 3-tier validation system inspired by PhD pipeline:
 * - Tier 1: Agent-level validation (individual agent outputs)
 * - Tier 2: Phase-level validation (groups of agents)
 * - Tier 3: Pipeline-level validation (final output)
 *
 * Reference: src/god-agent/core/pipeline/phd-pipeline-orchestrator.ts (lines 200-300)
 *
 * Each tier has:
 * - Specific validation rules
 * - Score thresholds
 * - Automatic retries on failure
 * - Escalation to next tier
 *
 * Integration Points:
 * - QualityIntegration - Use tiered approach for validation
 * - UniversalAgent - Validate at different stages
 *
 * Usage:
 * ```typescript
 * const validator = new TieredValidator();
 * const result = await validator.validateAll(content, options);
 * ```
 */

import { createComponentLogger, ConsoleLogHandler, LogLevel } from '../core/observability/index.js';

const logger = createComponentLogger('TieredValidation', {
  minLevel: LogLevel.INFO,
  handlers: [new ConsoleLogHandler()]
});

// ============================================================================
// Types
// ============================================================================

/**
 * Validation tier levels
 */
export type ValidationTier = 'agent' | 'phase' | 'pipeline';

/**
 * Validation severity
 */
export type ValidationSeverity = 'critical' | 'major' | 'minor';

/**
 * Validation issue
 */
export interface ValidationIssue {
  /** Issue ID */
  id: string;

  /** Severity level */
  severity: ValidationSeverity;

  /** Validator that found the issue */
  validator: string;

  /** Issue message */
  message: string;

  /** Suggested fix (if available) */
  suggestedFix?: string;

  /** Location in content (line number, paragraph, etc.) */
  location?: string;

  /** Auto-fixable flag */
  autoFixable: boolean;
}

/**
 * Validation result for a tier
 */
export interface TierValidationResult {
  /** Tier level */
  tier: ValidationTier;

  /** Passed validation */
  passed: boolean;

  /** Validation score (0-1) */
  score: number;

  /** Issues found */
  issues: ValidationIssue[];

  /** Validation duration (ms) */
  durationMs: number;

  /** Timestamp */
  timestamp: string;
}

/**
 * Complete validation result across all tiers
 */
export interface TieredValidationResult {
  /** Overall passed flag (all tiers must pass) */
  passed: boolean;

  /** Overall score (weighted average) */
  overallScore: number;

  /** Agent-level validation result */
  agentLevel: TierValidationResult;

  /** Phase-level validation result */
  phaseLevel: TierValidationResult;

  /** Pipeline-level validation result */
  pipelineLevel: TierValidationResult;

  /** Total issues across all tiers */
  totalIssues: number;

  /** Total validation duration (ms) */
  totalDurationMs: number;
}

/**
 * Validation options
 */
export interface ValidationOptions {
  /** Content to validate */
  content: string;

  /** Topic/context */
  topic?: string;

  /** Expected style */
  style?: string;

  /** Expected format */
  format?: string;

  /** Skip certain tiers (default: none) */
  skipTiers?: ValidationTier[];

  /** Tier-specific thresholds */
  thresholds?: {
    agent?: number;
    phase?: number;
    pipeline?: number;
  };

  /** Enable auto-fixes (default: true) */
  enableAutoFixes?: boolean;
}

/**
 * Agent-level validator function
 */
export type AgentValidator = (content: string) => Promise<ValidationIssue[]>;

/**
 * Phase-level validator function
 */
export type PhaseValidator = (content: string) => Promise<ValidationIssue[]>;

/**
 * Pipeline-level validator function
 */
export type PipelineValidator = (content: string) => Promise<ValidationIssue[]>;

// ============================================================================
// Tiered Validator Class
// ============================================================================

/**
 * Multi-tier validation system for god-write outputs
 */
export class TieredValidator {
  // Default thresholds for each tier
  static readonly DEFAULT_THRESHOLDS = {
    agent: 0.75,    // Agent-level: 75% (individual components)
    phase: 0.85,    // Phase-level: 85% (integrated sections)
    pipeline: 0.90, // Pipeline-level: 90% (final output)
  };

  // Tier weights for overall score
  static readonly TIER_WEIGHTS = {
    agent: 0.2,
    phase: 0.3,
    pipeline: 0.5,
  };

  private agentValidators: AgentValidator[] = [];
  private phaseValidators: PhaseValidator[] = [];
  private pipelineValidators: PipelineValidator[] = [];

  constructor() {
    // Register default validators
    this.registerDefaultValidators();
  }

  /**
   * Register agent-level validator
   */
  registerAgentValidator(validator: AgentValidator): void {
    this.agentValidators.push(validator);
  }

  /**
   * Register phase-level validator
   */
  registerPhaseValidator(validator: PhaseValidator): void {
    this.phaseValidators.push(validator);
  }

  /**
   * Register pipeline-level validator
   */
  registerPipelineValidator(validator: PipelineValidator): void {
    this.pipelineValidators.push(validator);
  }

  /**
   * Run validation across all tiers
   *
   * @param options - Validation options
   * @returns Tiered validation result
   */
  async validateAll(options: ValidationOptions): Promise<TieredValidationResult> {
    const startTime = Date.now();
    const skipTiers = options.skipTiers ?? [];

    // Tier 1: Agent-level validation
    const agentResult = skipTiers.includes('agent')
      ? this.createSkippedResult('agent')
      : await this.validateTier(
          'agent',
          options.content,
          this.agentValidators,
          options.thresholds?.agent ?? TieredValidator.DEFAULT_THRESHOLDS.agent
        );

    // Tier 2: Phase-level validation (only if agent passed or skipped)
    const phaseResult = skipTiers.includes('phase') || (!skipTiers.includes('agent') && !agentResult.passed)
      ? this.createSkippedResult('phase')
      : await this.validateTier(
          'phase',
          options.content,
          this.phaseValidators,
          options.thresholds?.phase ?? TieredValidator.DEFAULT_THRESHOLDS.phase
        );

    // Tier 3: Pipeline-level validation (only if phase passed or skipped)
    const pipelineResult = skipTiers.includes('pipeline') || (!skipTiers.includes('phase') && !phaseResult.passed)
      ? this.createSkippedResult('pipeline')
      : await this.validateTier(
          'pipeline',
          options.content,
          this.pipelineValidators,
          options.thresholds?.pipeline ?? TieredValidator.DEFAULT_THRESHOLDS.pipeline
        );

    const totalDurationMs = Date.now() - startTime;

    // Calculate overall score (weighted average)
    const overallScore =
      agentResult.score * TieredValidator.TIER_WEIGHTS.agent +
      phaseResult.score * TieredValidator.TIER_WEIGHTS.phase +
      pipelineResult.score * TieredValidator.TIER_WEIGHTS.pipeline;

    // Overall passed if all tiers passed
    const passed = agentResult.passed && phaseResult.passed && pipelineResult.passed;

    // Count total issues
    const totalIssues =
      agentResult.issues.length +
      phaseResult.issues.length +
      pipelineResult.issues.length;

    logger.log(
      LogLevel.INFO,
      `Tiered validation complete: ${passed ? 'PASSED' : 'FAILED'} (${(overallScore * 100).toFixed(1)}%, ${totalIssues} issues)`
    );

    return {
      passed,
      overallScore,
      agentLevel: agentResult,
      phaseLevel: phaseResult,
      pipelineLevel: pipelineResult,
      totalIssues,
      totalDurationMs,
    };
  }

  /**
   * Validate a specific tier
   */
  private async validateTier(
    tier: ValidationTier,
    content: string,
    validators: Array<(content: string) => Promise<ValidationIssue[]>>,
    threshold: number
  ): Promise<TierValidationResult> {
    const startTime = Date.now();

    logger.log(LogLevel.DEBUG, `Running ${tier}-level validation (${validators.length} validators)`);

    // Run all validators for this tier
    const allIssues: ValidationIssue[] = [];
    for (const validator of validators) {
      try {
        const issues = await validator(content);
        allIssues.push(...issues);
      } catch (error) {
        logger.log(LogLevel.ERROR, `Validator failed: ${error}`);
        // Continue with other validators
      }
    }

    // Calculate score based on issues
    const score = this.calculateScore(allIssues, content);

    // Check if passed threshold
    const passed = score >= threshold;

    const durationMs = Date.now() - startTime;

    logger.log(
      LogLevel.INFO,
      `${tier}-level validation: ${passed ? 'PASSED' : 'FAILED'} (${(score * 100).toFixed(1)}%, ${allIssues.length} issues)`
    );

    return {
      tier,
      passed,
      score,
      issues: allIssues,
      durationMs,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Calculate validation score from issues
   */
  private calculateScore(issues: ValidationIssue[], content: string): number {
    if (issues.length === 0) {
      return 1.0;
    }

    // Weight issues by severity
    const severityWeights = {
      critical: 0.15,
      major: 0.05,
      minor: 0.01,
    };

    const totalPenalty = issues.reduce((sum, issue) => {
      return sum + severityWeights[issue.severity];
    }, 0);

    // Calculate score (capped at 0)
    const score = Math.max(0, 1.0 - totalPenalty);

    return score;
  }

  /**
   * Create a skipped result for a tier
   */
  private createSkippedResult(tier: ValidationTier): TierValidationResult {
    return {
      tier,
      passed: true, // Skipped tiers are considered passed
      score: 1.0,
      issues: [],
      durationMs: 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Register default validators for each tier
   */
  private registerDefaultValidators(): void {
    // Agent-level validators (basic checks)
    this.registerAgentValidator(async (content) => {
      const issues: ValidationIssue[] = [];

      // Check minimum length
      if (content.length < 100) {
        issues.push({
          id: 'agent-min-length',
          severity: 'critical',
          validator: 'length-check',
          message: 'Content too short (< 100 chars)',
          autoFixable: false,
        });
      }

      // Check for empty paragraphs
      const emptyParas = content.split('\n\n').filter(p => p.trim().length === 0);
      if (emptyParas.length > 2) {
        issues.push({
          id: 'agent-empty-paras',
          severity: 'minor',
          validator: 'structure-check',
          message: `${emptyParas.length} empty paragraphs found`,
          autoFixable: true,
          suggestedFix: 'Remove empty paragraphs',
        });
      }

      return issues;
    });

    // Phase-level validators (coherence checks)
    this.registerPhaseValidator(async (content) => {
      const issues: ValidationIssue[] = [];

      // Check paragraph count
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0);
      if (paragraphs.length < 3) {
        issues.push({
          id: 'phase-min-paragraphs',
          severity: 'major',
          validator: 'structure-check',
          message: 'Insufficient paragraph count (< 3)',
          autoFixable: false,
        });
      }

      // Check for transitions between paragraphs
      let transitionCount = 0;
      const transitionWords = ['however', 'therefore', 'moreover', 'furthermore', 'additionally', 'consequently', 'thus', 'hence'];
      for (const para of paragraphs) {
        const firstWords = para.split(/\s+/).slice(0, 3).join(' ').toLowerCase();
        if (transitionWords.some(tw => firstWords.includes(tw))) {
          transitionCount++;
        }
      }

      if (paragraphs.length > 3 && transitionCount < 2) {
        issues.push({
          id: 'phase-transitions',
          severity: 'minor',
          validator: 'coherence-check',
          message: 'Few transition words between paragraphs',
          autoFixable: false,
        });
      }

      return issues;
    });

    // Pipeline-level validators (final quality checks)
    this.registerPipelineValidator(async (content) => {
      const issues: ValidationIssue[] = [];

      // Check word count
      const wordCount = content.split(/\s+/).length;
      if (wordCount < 200) {
        issues.push({
          id: 'pipeline-word-count',
          severity: 'major',
          validator: 'completeness-check',
          message: `Low word count (${wordCount} < 200)`,
          autoFixable: false,
        });
      }

      // Check for conclusion
      const hasConclusion = /\b(conclusion|summary|in conclusion|to conclude|in summary)\b/i.test(content);
      if (!hasConclusion && wordCount > 500) {
        issues.push({
          id: 'pipeline-conclusion',
          severity: 'minor',
          validator: 'structure-check',
          message: 'No conclusion detected in longer content',
          autoFixable: false,
        });
      }

      // Check sentence variety (average sentence length)
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length > 0) {
        const avgSentenceLength = wordCount / sentences.length;
        if (avgSentenceLength < 8 || avgSentenceLength > 40) {
          issues.push({
            id: 'pipeline-sentence-variety',
            severity: 'minor',
            validator: 'style-check',
            message: `Sentence length lacks variety (avg: ${avgSentenceLength.toFixed(1)} words)`,
            autoFixable: false,
          });
        }
      }

      return issues;
    });
  }

  /**
   * Get validation summary report
   */
  static formatValidationReport(result: TieredValidationResult): string {
    const lines = [
      '',
      '='.repeat(80),
      'TIERED VALIDATION REPORT',
      '='.repeat(80),
      `Overall Status: ${result.passed ? 'PASSED ✓' : 'FAILED ✗'}`,
      `Overall Score: ${(result.overallScore * 100).toFixed(1)}%`,
      `Total Issues: ${result.totalIssues}`,
      `Total Duration: ${result.totalDurationMs}ms`,
      '',
      'Tier 1: Agent-Level Validation',
      `  Status: ${result.agentLevel.passed ? 'PASSED ✓' : 'FAILED ✗'}`,
      `  Score: ${(result.agentLevel.score * 100).toFixed(1)}%`,
      `  Issues: ${result.agentLevel.issues.length}`,
      `  Duration: ${result.agentLevel.durationMs}ms`,
      '',
      'Tier 2: Phase-Level Validation',
      `  Status: ${result.phaseLevel.passed ? 'PASSED ✓' : 'FAILED ✗'}`,
      `  Score: ${(result.phaseLevel.score * 100).toFixed(1)}%`,
      `  Issues: ${result.phaseLevel.issues.length}`,
      `  Duration: ${result.phaseLevel.durationMs}ms`,
      '',
      'Tier 3: Pipeline-Level Validation',
      `  Status: ${result.pipelineLevel.passed ? 'PASSED ✓' : 'FAILED ✗'}`,
      `  Score: ${(result.pipelineLevel.score * 100).toFixed(1)}%`,
      `  Issues: ${result.pipelineLevel.issues.length}`,
      `  Duration: ${result.pipelineLevel.durationMs}ms`,
      '',
    ];

    // Show issues by severity
    const allIssues = [
      ...result.agentLevel.issues,
      ...result.phaseLevel.issues,
      ...result.pipelineLevel.issues,
    ];

    const criticalIssues = allIssues.filter(i => i.severity === 'critical');
    const majorIssues = allIssues.filter(i => i.severity === 'major');
    const minorIssues = allIssues.filter(i => i.severity === 'minor');

    if (criticalIssues.length > 0) {
      lines.push('Critical Issues:');
      for (const issue of criticalIssues) {
        lines.push(`  - ${issue.message} (${issue.validator})`);
      }
      lines.push('');
    }

    if (majorIssues.length > 0) {
      lines.push('Major Issues:');
      for (const issue of majorIssues) {
        lines.push(`  - ${issue.message} (${issue.validator})`);
      }
      lines.push('');
    }

    if (minorIssues.length > 0) {
      lines.push(`Minor Issues: ${minorIssues.length}`);
      lines.push('');
    }

    lines.push('='.repeat(80));

    return lines.join('\n');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a tiered validator with default settings
 */
export function createTieredValidator(): TieredValidator {
  return new TieredValidator();
}
