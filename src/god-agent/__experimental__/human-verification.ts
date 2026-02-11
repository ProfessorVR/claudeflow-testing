/** @deprecated Test-only / experimental module. Do not import in production. */

/**
 * Human Verification Support - Interactive review prompts for quality gauntlet
 *
 * This module provides human-in-the-loop verification during the quality gauntlet
 * revision process, allowing users to:
 * - Review quality issues between iterations
 * - Provide guidance for revisions
 * - Accept current version early
 * - Skip specific issues
 *
 * Reference: src/god-agent/cli/final-stage/final-stage-orchestrator.ts (lines 150-200)
 *
 * Integration Points:
 * - QualityIntegration.validateAndRevise() - Add review prompts between iterations
 * - RevisionOrchestrator - Inject user guidance into revision loop
 *
 * Usage:
 * ```typescript
 * const verifier = new HumanVerifier();
 * const decision = await verifier.promptReview(gauntletResult, iteration);
 * if (decision.action === 'accept') {
 *   return currentContent;
 * }
 * ```
 */

import * as readline from 'readline';
import type { GauntletResult } from '../cli/quality/index.js';
import { createComponentLogger, ConsoleLogHandler, LogLevel } from '../core/observability/index.js';

const logger = createComponentLogger('HumanVerification', {
  minLevel: LogLevel.INFO,
  handlers: [new ConsoleLogHandler()]
});

// ============================================================================
// Types
// ============================================================================

/**
 * Actions user can take during verification
 */
export type VerificationAction =
  | 'continue'      // Continue with automatic revision
  | 'skip'          // Skip certain issues
  | 'accept'        // Accept current version
  | 'guidance'      // Provide custom guidance
  | 'abort';        // Abort the revision process

/**
 * User decision from review prompt
 */
export interface VerificationDecision {
  /** Action to take */
  action: VerificationAction;

  /** Issues to skip (for 'skip' action) */
  skipIssueIds?: string[];

  /** Custom guidance (for 'guidance' action) */
  customGuidance?: string;

  /** Whether to disable further prompts */
  disablePrompts?: boolean;
}

/**
 * Options for human verification
 */
export interface HumanVerificationOptions {
  /** Enable interactive prompts (default: true) */
  enabled?: boolean;

  /** Auto-accept after N iterations (default: undefined = never) */
  autoAcceptAfterIterations?: number;

  /** Prompt timeout in milliseconds (default: undefined = no timeout) */
  promptTimeout?: number;

  /** Default action on timeout (default: 'continue') */
  timeoutAction?: VerificationAction;
}

/**
 * Review context provided to user
 */
export interface ReviewContext {
  /** Current iteration number */
  iteration: number;

  /** Maximum iterations allowed */
  maxIterations: number;

  /** Current quality score (0-1) */
  currentScore: number;

  /** Target quality threshold */
  targetThreshold: number;

  /** Previous score (for comparison) */
  previousScore?: number;

  /** Gauntlet result with issues */
  gauntletResult: GauntletResult;

  /** Content being reviewed */
  content: string;
}

// ============================================================================
// Human Verifier Class
// ============================================================================

/**
 * Handles human verification during quality revision loop
 */
export class HumanVerifier {
  private options: Required<HumanVerificationOptions>;
  private promptsDisabled = false;

  constructor(options: HumanVerificationOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      autoAcceptAfterIterations: options.autoAcceptAfterIterations ?? Infinity,
      promptTimeout: options.promptTimeout ?? 0,
      timeoutAction: options.timeoutAction ?? 'continue',
    };
  }

  /**
   * Update verification options
   */
  updateOptions(options: Partial<HumanVerificationOptions>): void {
    this.options = { ...this.options, ...options };
  }

  /**
   * Prompt user for review decision
   *
   * @param context - Review context with current state
   * @returns User's verification decision
   */
  async promptReview(context: ReviewContext): Promise<VerificationDecision> {
    // Check if verification is disabled
    if (!this.options.enabled || this.promptsDisabled) {
      return { action: 'continue' };
    }

    // Auto-accept after max iterations
    if (context.iteration >= this.options.autoAcceptAfterIterations) {
      logger.log(
        LogLevel.INFO,
        `Auto-accepting after ${this.options.autoAcceptAfterIterations} iterations`
      );
      return { action: 'accept' };
    }

    // Display review information
    this.displayReviewInfo(context);

    // Prompt for action with timeout
    const decision = await this.promptForAction(context);

    // Handle disable prompts flag
    if (decision.disablePrompts) {
      this.promptsDisabled = true;
      logger.log(LogLevel.INFO, 'Future verification prompts disabled');
    }

    return decision;
  }

  /**
   * Display review information to user
   */
  private displayReviewInfo(context: ReviewContext): void {
    console.log('\n' + '='.repeat(80));
    console.log('QUALITY REVIEW REQUIRED');
    console.log('='.repeat(80));
    console.log(`Iteration: ${context.iteration}/${context.maxIterations}`);
    console.log(`Current Score: ${(context.currentScore * 100).toFixed(1)}%`);
    console.log(`Target Threshold: ${(context.targetThreshold * 100).toFixed(1)}%`);

    if (context.previousScore !== undefined) {
      const improvement = ((context.currentScore - context.previousScore) * 100).toFixed(1);
      console.log(`Improvement: ${improvement > '0' ? '+' : ''}${improvement}%`);
    }

    console.log('\nIssues Found:');
    this.displayIssues(context.gauntletResult);

    console.log('\nContent Preview (first 500 chars):');
    console.log(context.content.slice(0, 500) + '...');
    console.log();
  }

  /**
   * Display quality issues in a user-friendly format
   */
  private displayIssues(result: GauntletResult): void {
    const { summary, stageResults } = result;

    console.log(`  Critical: ${summary.criticalCount}`);
    console.log(`  Major: ${summary.majorCount}`);
    console.log(`  Minor: ${summary.minorCount}`);

    // Show stage-specific issues
    for (const stage of stageResults) {
      if (stage.issues.length > 0) {
        console.log(`\n  ${stage.stageName}:`);
        for (const issue of stage.issues.slice(0, 5)) { // Show first 5 issues
          console.log(`    - [${issue.severity}] ${issue.message}`);
        }
        if (stage.issues.length > 5) {
          console.log(`    ... and ${stage.issues.length - 5} more`);
        }
      }
    }
  }

  /**
   * Prompt user for action
   */
  private async promptForAction(context: ReviewContext): Promise<VerificationDecision> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      let timeoutId: NodeJS.Timeout | undefined;

      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        rl.close();
      };

      // Setup timeout if configured
      if (this.options.promptTimeout > 0) {
        timeoutId = setTimeout(() => {
          cleanup();
          logger.log(LogLevel.INFO, `Prompt timeout - defaulting to '${this.options.timeoutAction}'`);
          resolve({ action: this.options.timeoutAction });
        }, this.options.promptTimeout);
      }

      console.log('Actions:');
      console.log('  [c]ontinue  - Continue with automatic revision');
      console.log('  [a]ccept    - Accept current version (stop revisions)');
      console.log('  [g]uidance  - Provide custom guidance for revision');
      console.log('  [s]kip      - Skip specific issues');
      console.log('  [q]uit      - Abort revision process');
      console.log('  [d]isable   - Continue and disable future prompts');
      console.log();

      rl.question('Your choice: ', async (answer) => {
        cleanup();

        const choice = answer.toLowerCase().trim();

        switch (choice) {
          case 'c':
          case 'continue':
            resolve({ action: 'continue' });
            break;

          case 'a':
          case 'accept':
            resolve({ action: 'accept' });
            break;

          case 'g':
          case 'guidance':
            const guidance = await this.promptForGuidance();
            resolve({ action: 'guidance', customGuidance: guidance });
            break;

          case 's':
          case 'skip':
            const skipIds = await this.promptForSkipIssues(context.gauntletResult);
            resolve({ action: 'skip', skipIssueIds: skipIds });
            break;

          case 'q':
          case 'quit':
            resolve({ action: 'abort' });
            break;

          case 'd':
          case 'disable':
            resolve({ action: 'continue', disablePrompts: true });
            break;

          default:
            console.log('Invalid choice, defaulting to continue');
            resolve({ action: 'continue' });
            break;
        }
      });
    });
  }

  /**
   * Prompt user for custom guidance
   */
  private async promptForGuidance(): Promise<string> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise((resolve) => {
      console.log('\nEnter your guidance for the revision:');
      rl.question('> ', (guidance) => {
        rl.close();
        resolve(guidance.trim());
      });
    });
  }

  /**
   * Prompt user to select issues to skip
   */
  private async promptForSkipIssues(result: GauntletResult): Promise<string[]> {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Collect all issues with IDs
    const allIssues: Array<{ id: string; stage: string; message: string; severity: string }> = [];
    for (const stage of result.stageResults) {
      for (const issue of stage.issues) {
        allIssues.push({
          id: `${stage.stageName}-${allIssues.length}`,
          stage: stage.stageName,
          message: issue.message,
          severity: issue.severity,
        });
      }
    }

    if (allIssues.length === 0) {
      console.log('No issues to skip.');
      rl.close();
      return [];
    }

    return new Promise((resolve) => {
      console.log('\nIssues (enter numbers to skip, comma-separated):');
      allIssues.forEach((issue, idx) => {
        console.log(`  ${idx + 1}. [${issue.severity}] ${issue.stage}: ${issue.message}`);
      });

      rl.question('\nSkip issues (e.g., 1,3,5): ', (answer) => {
        rl.close();

        const numbers = answer
          .split(',')
          .map(n => parseInt(n.trim(), 10))
          .filter(n => !isNaN(n) && n > 0 && n <= allIssues.length);

        const skipIds = numbers.map(n => allIssues[n - 1].id);
        console.log(`Skipping ${skipIds.length} issues`);

        resolve(skipIds);
      });
    });
  }

  /**
   * Check if prompts should be shown based on current state
   */
  shouldPrompt(iteration: number, score: number, threshold: number): boolean {
    // Don't prompt if disabled
    if (!this.options.enabled || this.promptsDisabled) {
      return false;
    }

    // Don't prompt on first iteration (let auto-revision try first)
    if (iteration === 0) {
      return false;
    }

    // Don't prompt if already passed threshold
    if (score >= threshold) {
      return false;
    }

    // Don't prompt if auto-accept iteration reached
    if (iteration >= this.options.autoAcceptAfterIterations) {
      return false;
    }

    return true;
  }

  /**
   * Re-enable prompts (useful for new write() operations)
   */
  resetPrompts(): void {
    this.promptsDisabled = false;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a human verifier with default options
 */
export function createHumanVerifier(options?: HumanVerificationOptions): HumanVerifier {
  return new HumanVerifier(options);
}

/**
 * Create a non-interactive verifier (always continues)
 */
export function createNonInteractiveVerifier(): HumanVerifier {
  return new HumanVerifier({ enabled: false });
}
