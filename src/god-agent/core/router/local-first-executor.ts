/**
 * Local-First Executor
 *
 * Implements TIER-2.1: Intelligent Model Router - Phase 5.3
 *
 * Execution Pipeline:
 *   1. Assess risk using RiskClassifier
 *   2. Route to local (vLLM) or expensive (Claude) based on risk
 *   3. For local: generate → test → Claude review
 *   4. If tests fail: Claude fixes
 *   5. Track timeline and results
 *
 * Flow:
 *   User Request
 *       │
 *       ▼
 *   Risk Assessment
 *       │
 *       ├─── High Risk ──────────────► Claude Direct
 *       │
 *       └─── Low/Medium Risk
 *                 │
 *                 ▼
 *            vLLM Generate
 *                 │
 *                 ▼
 *            Run Tests ◄────────────────────────┐
 *                 │                              │
 *                 ├─── Pass ──► Claude Review ──┤
 *                 │                   │          │
 *                 │              Approve? ───────┤
 *                 │                   │     No   │
 *                 │                   ▼          │
 *                 │                 Done         │
 *                 │                              │
 *                 └─── Fail ──► Claude Fix ──────┘
 */

import type { ProviderType, LLMResponse, CompletionOptions } from './router-types.js';
import {
  RiskClassifier,
  getRiskClassifier,
  type RiskAssessment,
  type RiskContext,
  type RouteRecommendation,
} from './risk-classifier.js';

// ===== TYPES =====

/**
 * Result of a local-first execution
 */
export interface LocalFirstResult {
  /** Whether execution succeeded */
  success: boolean;
  /** Generated output */
  output: string;
  /** Which model generated the output */
  generatedBy: 'local' | 'claude';
  /** Which model reviewed (if any) */
  reviewedBy?: 'claude';
  /** Whether tests passed */
  testsPassed: boolean | null;
  /** Number of generation/fix iterations */
  iterations: number;
  /** Risk assessment that led to routing */
  riskAssessment: RiskAssessment;
  /** Execution timeline in milliseconds */
  timeline: {
    riskAssessment: number;
    localGeneration?: number;
    testExecution?: number;
    claudeReview?: number;
    claudeFix?: number;
    claudeDirect?: number;
    total: number;
  };
  /** Any errors encountered */
  errors: string[];
  /** Diff between original and generated (for review) */
  diff?: string;
}

/**
 * Options for local-first execution
 */
export interface LocalFirstOptions {
  /** Maximum iterations for test-fix loop */
  maxIterations?: number;
  /** Whether to run tests after generation */
  runTests?: boolean;
  /** Whether to require Claude review for local output */
  requireReview?: boolean;
  /** Number of review passes */
  reviewPasses?: number;
  /** Test command to run */
  testCommand?: string;
  /** Files affected by the change */
  affectedFiles?: string[];
  /** Original content for diff generation */
  originalContent?: string;
  /** Risk context for assessment */
  riskContext?: RiskContext;
  /** Completion options for LLM calls */
  completionOptions?: CompletionOptions;
  /** Force a specific route (bypass risk assessment) */
  forceRoute?: RouteRecommendation;
}

/**
 * Test execution result
 */
export interface TestResult {
  /** Whether all tests passed */
  passed: boolean;
  /** Number of tests run */
  testsRun: number;
  /** Number of tests passed */
  testsPassed: number;
  /** Number of tests failed */
  testsFailed: number;
  /** Test output */
  output: string;
  /** Execution time in ms */
  executionTimeMs: number;
  /** Failed test names */
  failedTests: string[];
}

/**
 * Review result from Claude
 */
export interface ReviewResult {
  /** Whether the output is approved */
  approved: boolean;
  /** Review feedback */
  feedback: string;
  /** Suggested improvements */
  suggestions: string[];
  /** Issues found */
  issues: string[];
  /** Confidence in approval (0-1) */
  confidence: number;
}

/**
 * Provider interface for LLM calls
 */
export interface ExecutorProvider {
  /** Generate completion */
  complete(prompt: string, options?: CompletionOptions): Promise<LLMResponse>;
  /** Provider type */
  readonly provider: ProviderType;
  /** Model identifier */
  readonly model: string;
}

/**
 * Test runner interface
 */
export interface TestRunner {
  /** Run tests and return results */
  runTests(testCommand?: string, affectedFiles?: string[]): Promise<TestResult>;
}

/**
 * Diff generator interface
 */
export interface DiffGenerator {
  /** Generate diff between original and new content */
  generateDiff(original: string, modified: string): string;
}

// ===== EXECUTOR CONFIGURATION =====

/**
 * Configuration for LocalFirstExecutor
 */
export interface LocalFirstExecutorConfig {
  /** Local model provider (vLLM) */
  localProvider?: ExecutorProvider;
  /** Expensive model provider (Claude) */
  expensiveProvider?: ExecutorProvider;
  /** Test runner */
  testRunner?: TestRunner;
  /** Diff generator */
  diffGenerator?: DiffGenerator;
  /** Risk classifier */
  riskClassifier?: RiskClassifier;
  /** Default options */
  defaultOptions?: Partial<LocalFirstOptions>;
}

// ===== DEFAULT IMPLEMENTATIONS =====

/**
 * Default test runner (mock - for actual implementation, integrate with test framework)
 */
export class DefaultTestRunner implements TestRunner {
  async runTests(_testCommand?: string, _affectedFiles?: string[]): Promise<TestResult> {
    // In a real implementation, this would:
    // 1. Run the test command (e.g., npm test, pytest)
    // 2. Parse the output to extract pass/fail counts
    // 3. Return structured results
    return {
      passed: true,
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      output: 'No tests configured',
      executionTimeMs: 0,
      failedTests: [],
    };
  }
}

/**
 * Default diff generator
 */
export class DefaultDiffGenerator implements DiffGenerator {
  generateDiff(original: string, modified: string): string {
    if (!original) return `+++ New content\n${modified}`;
    if (!modified) return `--- Removed content\n${original}`;

    // Simple line-by-line diff
    const originalLines = original.split('\n');
    const modifiedLines = modified.split('\n');
    const diff: string[] = [];

    const maxLines = Math.max(originalLines.length, modifiedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const origLine = originalLines[i];
      const modLine = modifiedLines[i];

      if (origLine === modLine) {
        diff.push(`  ${origLine ?? ''}`);
      } else if (origLine === undefined) {
        diff.push(`+ ${modLine}`);
      } else if (modLine === undefined) {
        diff.push(`- ${origLine}`);
      } else {
        diff.push(`- ${origLine}`);
        diff.push(`+ ${modLine}`);
      }
    }

    return diff.join('\n');
  }
}

// ===== LOCAL-FIRST EXECUTOR =====

/**
 * Internal type for resolved options (required fields with optional ones allowed undefined)
 */
type ResolvedOptions = {
  maxIterations: number;
  runTests: boolean;
  requireReview: boolean;
  reviewPasses: number;
  testCommand: string | undefined;
  affectedFiles: string[] | undefined;
  originalContent: string | undefined;
  riskContext: RiskContext | undefined;
  completionOptions: CompletionOptions | undefined;
  forceRoute: RouteRecommendation | undefined;
};

/**
 * Executes tasks using local-first strategy with Claude fallback
 */
export class LocalFirstExecutor {
  private readonly config: Required<LocalFirstExecutorConfig>;
  private readonly defaultOptions: ResolvedOptions;

  constructor(config: LocalFirstExecutorConfig = {}) {
    this.config = {
      localProvider: config.localProvider ?? null as unknown as ExecutorProvider,
      expensiveProvider: config.expensiveProvider ?? null as unknown as ExecutorProvider,
      testRunner: config.testRunner ?? new DefaultTestRunner(),
      diffGenerator: config.diffGenerator ?? new DefaultDiffGenerator(),
      riskClassifier: config.riskClassifier ?? getRiskClassifier(),
      defaultOptions: config.defaultOptions ?? {},
    };

    this.defaultOptions = {
      maxIterations: 2,
      runTests: true,
      requireReview: true,
      reviewPasses: 1,
      testCommand: undefined,
      affectedFiles: undefined,
      originalContent: undefined,
      riskContext: undefined,
      completionOptions: undefined,
      forceRoute: undefined,
      ...this.config.defaultOptions,
    };
  }

  /**
   * Execute a task using local-first strategy
   */
  async execute(prompt: string, options: LocalFirstOptions = {}): Promise<LocalFirstResult> {
    const opts = { ...this.defaultOptions, ...options };
    const startTime = Date.now();
    const errors: string[] = [];
    const timeline: LocalFirstResult['timeline'] = {
      riskAssessment: 0,
      total: 0,
    };

    // Step 1: Assess risk
    const riskStart = Date.now();
    const riskAssessment = this.config.riskClassifier.assess(prompt, opts.riskContext);
    timeline.riskAssessment = Date.now() - riskStart;

    // Determine route (force or from assessment)
    const route = opts.forceRoute ?? riskAssessment.recommendedRoute;

    // Step 2: Route based on risk
    if (route === 'expensive') {
      return this.executeWithExpensiveModel(prompt, opts, riskAssessment, timeline, startTime);
    }

    // Local or local_then_review
    return this.executeWithLocalModel(prompt, opts, riskAssessment, route, timeline, startTime, errors);
  }

  /**
   * Execute directly with expensive model (Claude)
   */
  private async executeWithExpensiveModel(
    prompt: string,
    opts: ResolvedOptions,
    riskAssessment: RiskAssessment,
    timeline: LocalFirstResult['timeline'],
    startTime: number
  ): Promise<LocalFirstResult> {
    if (!this.config.expensiveProvider) {
      return this.createErrorResult(
        'No expensive provider configured',
        riskAssessment,
        timeline,
        startTime
      );
    }

    const claudeStart = Date.now();
    try {
      const response = await this.config.expensiveProvider.complete(prompt, opts.completionOptions);
      timeline.claudeDirect = Date.now() - claudeStart;
      timeline.total = Date.now() - startTime;

      return {
        success: true,
        output: response.content,
        generatedBy: 'claude',
        testsPassed: null,
        iterations: 1,
        riskAssessment,
        timeline,
        errors: [],
      };
    } catch (error) {
      timeline.claudeDirect = Date.now() - claudeStart;
      timeline.total = Date.now() - startTime;

      return this.createErrorResult(
        `Claude execution failed: ${error instanceof Error ? error.message : String(error)}`,
        riskAssessment,
        timeline,
        startTime
      );
    }
  }

  /**
   * Execute with local model, then test and review
   */
  private async executeWithLocalModel(
    prompt: string,
    opts: ResolvedOptions,
    riskAssessment: RiskAssessment,
    route: RouteRecommendation,
    timeline: LocalFirstResult['timeline'],
    startTime: number,
    errors: string[]
  ): Promise<LocalFirstResult> {
    if (!this.config.localProvider) {
      // Fallback to expensive if no local provider
      if (this.config.expensiveProvider) {
        return this.executeWithExpensiveModel(prompt, opts, riskAssessment, timeline, startTime);
      }
      return this.createErrorResult('No providers configured', riskAssessment, timeline, startTime);
    }

    let output = '';
    let testsPassed: boolean | null = null;
    let iterations = 0;
    let diff: string | undefined;

    // Generation loop
    for (let i = 0; i < opts.maxIterations; i++) {
      iterations++;

      // Generate with local model
      const genStart = Date.now();
      try {
        const response = await this.config.localProvider.complete(
          i === 0 ? prompt : this.buildFixPrompt(prompt, output, errors),
          opts.completionOptions
        );
        output = response.content;
        timeline.localGeneration = (timeline.localGeneration ?? 0) + (Date.now() - genStart);
      } catch (error) {
        errors.push(`Local generation failed: ${error instanceof Error ? error.message : String(error)}`);
        continue;
      }

      // Generate diff
      if (opts.originalContent) {
        diff = this.config.diffGenerator.generateDiff(opts.originalContent, output);
      }

      // Run tests if enabled
      if (opts.runTests) {
        const testStart = Date.now();
        const testResult = await this.config.testRunner.runTests(opts.testCommand, opts.affectedFiles);
        timeline.testExecution = (timeline.testExecution ?? 0) + (Date.now() - testStart);
        testsPassed = testResult.passed;

        if (!testResult.passed) {
          errors.push(`Tests failed: ${testResult.failedTests.join(', ')}`);

          // If we have more iterations, try to fix with Claude
          if (i < opts.maxIterations - 1 && this.config.expensiveProvider) {
            const fixStart = Date.now();
            try {
              const fixResponse = await this.config.expensiveProvider.complete(
                this.buildTestFixPrompt(prompt, output, testResult),
                opts.completionOptions
              );
              output = fixResponse.content;
              timeline.claudeFix = (timeline.claudeFix ?? 0) + (Date.now() - fixStart);
            } catch {
              // Continue to next iteration
            }
          }
          continue;
        }
      }

      // Tests passed (or not run), check if review is required
      if (route === 'local_then_review' && opts.requireReview && this.config.expensiveProvider) {
        const reviewStart = Date.now();
        const reviewResult = await this.reviewWithClaude(prompt, output, diff);
        timeline.claudeReview = (timeline.claudeReview ?? 0) + (Date.now() - reviewStart);

        if (!reviewResult.approved) {
          errors.push(`Review rejected: ${reviewResult.feedback}`);

          // Try to fix based on review feedback
          if (i < opts.maxIterations - 1) {
            const fixStart = Date.now();
            try {
              const fixResponse = await this.config.expensiveProvider.complete(
                this.buildReviewFixPrompt(prompt, output, reviewResult),
                opts.completionOptions
              );
              output = fixResponse.content;
              timeline.claudeFix = (timeline.claudeFix ?? 0) + (Date.now() - fixStart);
            } catch {
              // Continue with current output
            }
          }
          continue;
        }

        // Review approved
        timeline.total = Date.now() - startTime;
        return {
          success: true,
          output,
          generatedBy: 'local',
          reviewedBy: 'claude',
          testsPassed,
          iterations,
          riskAssessment,
          timeline,
          errors,
          diff,
        };
      }

      // No review required or local-only route
      timeline.total = Date.now() - startTime;
      return {
        success: true,
        output,
        generatedBy: 'local',
        testsPassed,
        iterations,
        riskAssessment,
        timeline,
        errors,
        diff,
      };
    }

    // Max iterations reached without success
    timeline.total = Date.now() - startTime;
    return {
      success: false,
      output,
      generatedBy: 'local',
      testsPassed,
      iterations,
      riskAssessment,
      timeline,
      errors,
      diff,
    };
  }

  /**
   * Review output with Claude
   */
  private async reviewWithClaude(
    originalPrompt: string,
    output: string,
    diff?: string
  ): Promise<ReviewResult> {
    if (!this.config.expensiveProvider) {
      return {
        approved: true,
        feedback: 'No reviewer configured, auto-approved',
        suggestions: [],
        issues: [],
        confidence: 0.5,
      };
    }

    const reviewPrompt = `You are reviewing code generated by a local AI model.

Original Request:
${originalPrompt}

Generated Output:
${output}

${diff ? `Diff:\n${diff}\n` : ''}

Please review and respond in this exact format:
APPROVED: [yes/no]
CONFIDENCE: [0.0-1.0]
FEEDBACK: [brief overall feedback]
ISSUES: [comma-separated list of issues, or "none"]
SUGGESTIONS: [comma-separated list of improvements, or "none"]`;

    try {
      const response = await this.config.expensiveProvider.complete(reviewPrompt);
      return this.parseReviewResponse(response.content);
    } catch {
      return {
        approved: true,
        feedback: 'Review failed, auto-approved with low confidence',
        suggestions: [],
        issues: [],
        confidence: 0.3,
      };
    }
  }

  /**
   * Parse Claude's review response
   */
  private parseReviewResponse(response: string): ReviewResult {
    const approvedMatch = response.match(/APPROVED:\s*(yes|no)/i);
    const confidenceMatch = response.match(/CONFIDENCE:\s*([\d.]+)/);
    const feedbackMatch = response.match(/FEEDBACK:\s*(.+?)(?=\n|ISSUES|SUGGESTIONS|$)/s);
    const issuesMatch = response.match(/ISSUES:\s*(.+?)(?=\n|SUGGESTIONS|$)/s);
    const suggestionsMatch = response.match(/SUGGESTIONS:\s*(.+?)$/s);

    const approved = approvedMatch?.[1]?.toLowerCase() === 'yes';
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0.5;
    const feedback = feedbackMatch?.[1]?.trim() ?? 'No feedback provided';

    const parseList = (match: RegExpMatchArray | null): string[] => {
      if (!match || match[1].toLowerCase().trim() === 'none') return [];
      return match[1].split(',').map(s => s.trim()).filter(Boolean);
    };

    return {
      approved,
      feedback,
      suggestions: parseList(suggestionsMatch),
      issues: parseList(issuesMatch),
      confidence,
    };
  }

  /**
   * Build prompt for fixing based on errors
   */
  private buildFixPrompt(originalPrompt: string, previousOutput: string, errors: string[]): string {
    return `The previous attempt had issues. Please fix them.

Original Request:
${originalPrompt}

Previous Output:
${previousOutput}

Errors:
${errors.join('\n')}

Please provide a corrected version.`;
  }

  /**
   * Build prompt for fixing failed tests
   */
  private buildTestFixPrompt(originalPrompt: string, output: string, testResult: TestResult): string {
    return `The generated code failed tests. Please fix it.

Original Request:
${originalPrompt}

Generated Code:
${output}

Test Results:
- Tests Run: ${testResult.testsRun}
- Tests Passed: ${testResult.testsPassed}
- Tests Failed: ${testResult.testsFailed}
- Failed Tests: ${testResult.failedTests.join(', ')}

Test Output:
${testResult.output}

Please provide a corrected version that passes all tests.`;
  }

  /**
   * Build prompt for fixing based on review feedback
   */
  private buildReviewFixPrompt(
    originalPrompt: string,
    output: string,
    review: ReviewResult
  ): string {
    return `The generated code was rejected during review. Please address the feedback.

Original Request:
${originalPrompt}

Generated Code:
${output}

Review Feedback:
${review.feedback}

Issues:
${review.issues.length > 0 ? review.issues.join('\n') : 'None specified'}

Suggestions:
${review.suggestions.length > 0 ? review.suggestions.join('\n') : 'None specified'}

Please provide an improved version addressing these concerns.`;
  }

  /**
   * Create error result
   */
  private createErrorResult(
    error: string,
    riskAssessment: RiskAssessment,
    timeline: LocalFirstResult['timeline'],
    startTime: number
  ): LocalFirstResult {
    timeline.total = Date.now() - startTime;
    return {
      success: false,
      output: '',
      generatedBy: 'local',
      testsPassed: null,
      iterations: 0,
      riskAssessment,
      timeline,
      errors: [error],
    };
  }

  /**
   * Check if providers are configured
   */
  hasLocalProvider(): boolean {
    return !!this.config.localProvider;
  }

  hasExpensiveProvider(): boolean {
    return !!this.config.expensiveProvider;
  }

  /**
   * Set providers
   */
  setLocalProvider(provider: ExecutorProvider): void {
    (this.config as { localProvider: ExecutorProvider }).localProvider = provider;
  }

  setExpensiveProvider(provider: ExecutorProvider): void {
    (this.config as { expensiveProvider: ExecutorProvider }).expensiveProvider = provider;
  }
}

// ===== SINGLETON =====

let executorInstance: LocalFirstExecutor | null = null;

/**
 * Get or create the singleton LocalFirstExecutor instance
 */
export function getLocalFirstExecutor(config?: LocalFirstExecutorConfig): LocalFirstExecutor {
  if (!executorInstance || config) {
    executorInstance = new LocalFirstExecutor(config);
  }
  return executorInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetLocalFirstExecutor(): void {
  executorInstance = null;
}

/**
 * Initialize the executor with configuration
 */
export function initializeLocalFirstExecutor(config: LocalFirstExecutorConfig): LocalFirstExecutor {
  executorInstance = new LocalFirstExecutor(config);
  return executorInstance;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Quick execute without creating instance
 */
export async function executeLocalFirst(
  prompt: string,
  options?: LocalFirstOptions,
  config?: LocalFirstExecutorConfig
): Promise<LocalFirstResult> {
  const executor = config ? new LocalFirstExecutor(config) : getLocalFirstExecutor();
  return executor.execute(prompt, options);
}

/**
 * Get human-readable execution summary
 */
export function summarizeExecution(result: LocalFirstResult): string {
  const route = result.generatedBy === 'claude'
    ? 'Claude (direct)'
    : result.reviewedBy
      ? 'Local → Claude review'
      : 'Local';

  const status = result.success ? '✓' : '✗';
  const tests = result.testsPassed === null
    ? ''
    : result.testsPassed
      ? ', tests passed'
      : ', tests failed';

  return `${status} ${route} (${result.iterations} iter, ${result.timeline.total}ms${tests})`;
}

/**
 * Format timeline for display
 */
export function formatTimeline(timeline: LocalFirstResult['timeline']): string {
  const parts: string[] = [];

  if (timeline.riskAssessment > 0) parts.push(`Risk: ${timeline.riskAssessment}ms`);
  if (timeline.localGeneration) parts.push(`Local: ${timeline.localGeneration}ms`);
  if (timeline.testExecution) parts.push(`Tests: ${timeline.testExecution}ms`);
  if (timeline.claudeReview) parts.push(`Review: ${timeline.claudeReview}ms`);
  if (timeline.claudeFix) parts.push(`Fix: ${timeline.claudeFix}ms`);
  if (timeline.claudeDirect) parts.push(`Claude: ${timeline.claudeDirect}ms`);

  parts.push(`Total: ${timeline.total}ms`);

  return parts.join(' | ');
}
