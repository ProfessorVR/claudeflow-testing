/**
 * Test Runner
 *
 * Implements TIER-2.1: Intelligent Model Router - Phase 5.3
 *
 * Provides deterministic test execution for verifying generated code:
 * - Supports multiple test frameworks (vitest, jest, pytest, etc.)
 * - Parses test output to extract pass/fail counts
 * - Runs affected tests based on changed files
 * - Configurable timeout and retry logic
 */

import { exec, spawn } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// ===== TYPES =====

/**
 * Test framework detection result
 */
export type TestFramework =
  | 'vitest'
  | 'jest'
  | 'mocha'
  | 'pytest'
  | 'go'
  | 'cargo'
  | 'npm'
  | 'unknown';

/**
 * Result of running tests
 */
export interface TestRunResult {
  /** Whether all tests passed */
  passed: boolean;
  /** Number of tests run */
  testsRun: number;
  /** Number of tests passed */
  testsPassed: number;
  /** Number of tests failed */
  testsFailed: number;
  /** Number of tests skipped */
  testsSkipped: number;
  /** Raw test output */
  output: string;
  /** Execution time in milliseconds */
  executionTimeMs: number;
  /** Names of failed tests */
  failedTests: string[];
  /** Exit code of test process */
  exitCode: number;
  /** Test framework used */
  framework: TestFramework;
  /** Error message if execution failed */
  error?: string;
}

/**
 * Options for running tests
 */
export interface TestRunOptions {
  /** Working directory */
  cwd?: string;
  /** Test command override */
  command?: string;
  /** Files affected by changes (for targeted testing) */
  affectedFiles?: string[];
  /** Timeout in milliseconds */
  timeout?: number;
  /** Environment variables */
  env?: Record<string, string>;
  /** Number of retries on failure */
  retries?: number;
  /** Run tests in watch mode */
  watch?: boolean;
  /** Only run tests matching pattern */
  pattern?: string;
  /** Skip test framework detection */
  skipDetection?: boolean;
  /** Force specific framework (for output parsing) */
  framework?: TestFramework;
}

/**
 * Test runner configuration
 */
export interface TestRunnerConfig {
  /** Default working directory */
  defaultCwd?: string;
  /** Default timeout in milliseconds */
  defaultTimeout?: number;
  /** Default test command */
  defaultCommand?: string;
  /** Framework-specific commands */
  frameworkCommands?: Partial<Record<TestFramework, string>>;
}

// ===== TEST RUNNER =====

/**
 * Runs tests and parses results
 */
export class TestRunner {
  private readonly config: Required<TestRunnerConfig>;

  constructor(config: TestRunnerConfig = {}) {
    this.config = {
      defaultCwd: config.defaultCwd ?? process.cwd(),
      defaultTimeout: config.defaultTimeout ?? 60000,
      defaultCommand: config.defaultCommand ?? 'npm test',
      frameworkCommands: {
        vitest: 'npx vitest run',
        jest: 'npx jest',
        mocha: 'npx mocha',
        pytest: 'pytest',
        go: 'go test ./...',
        cargo: 'cargo test',
        npm: 'npm test',
        ...config.frameworkCommands,
      },
    };
  }

  /**
   * Run tests and return results
   */
  async runTests(options: TestRunOptions = {}): Promise<TestRunResult> {
    const startTime = Date.now();
    const cwd = options.cwd ?? this.config.defaultCwd;
    const timeout = options.timeout ?? this.config.defaultTimeout;

    // Determine framework: explicit > detect > skip = unknown
    const framework = options.framework
      ?? (options.skipDetection ? 'unknown' : await this.detectFramework(cwd));

    // Build command
    const command = this.buildCommand(options, framework);

    // Run tests with retry logic
    const retries = options.retries ?? 0;
    let lastResult: TestRunResult | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      lastResult = await this.executeTests(command, cwd, timeout, framework, startTime);

      if (lastResult.passed) {
        return lastResult;
      }
    }

    return lastResult ?? this.createEmptyResult(framework, startTime);
  }

  /**
   * Run tests for specific files
   */
  async runTestsForFiles(
    files: string[],
    options: TestRunOptions = {}
  ): Promise<TestRunResult> {
    return this.runTests({
      ...options,
      affectedFiles: files,
    });
  }

  /**
   * Detect test framework from project files
   */
  async detectFramework(cwd: string): Promise<TestFramework> {
    try {
      const { stdout } = await execAsync('ls -la', { cwd });

      // Check for config files
      if (stdout.includes('vitest.config')) return 'vitest';
      if (stdout.includes('jest.config')) return 'jest';
      if (stdout.includes('.mocharc') || stdout.includes('mocha.opts')) return 'mocha';
      if (stdout.includes('pytest.ini') || stdout.includes('pyproject.toml')) return 'pytest';
      if (stdout.includes('go.mod')) return 'go';
      if (stdout.includes('Cargo.toml')) return 'cargo';
      if (stdout.includes('package.json')) return 'npm';

      return 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Build the test command
   */
  private buildCommand(options: TestRunOptions, framework: TestFramework): string {
    // Use explicit command if provided
    if (options.command) {
      return this.appendOptions(options.command, options);
    }

    // Get framework-specific command
    const baseCommand = this.config.frameworkCommands[framework] ?? this.config.defaultCommand;
    return this.appendOptions(baseCommand, options);
  }

  /**
   * Append options to command
   */
  private appendOptions(command: string, options: TestRunOptions): string {
    let cmd = command;

    // Add pattern filter
    if (options.pattern) {
      if (cmd.includes('vitest') || cmd.includes('jest')) {
        cmd += ` -t "${options.pattern}"`;
      } else if (cmd.includes('pytest')) {
        cmd += ` -k "${options.pattern}"`;
      } else if (cmd.includes('go test')) {
        cmd += ` -run "${options.pattern}"`;
      }
    }

    // Add affected files
    if (options.affectedFiles && options.affectedFiles.length > 0) {
      const files = options.affectedFiles.join(' ');
      if (cmd.includes('vitest') || cmd.includes('jest')) {
        cmd += ` --findRelatedTests ${files}`;
      } else if (cmd.includes('pytest')) {
        cmd += ` ${files}`;
      }
    }

    return cmd;
  }

  /**
   * Execute tests and parse output
   */
  private async executeTests(
    command: string,
    cwd: string,
    timeout: number,
    framework: TestFramework,
    startTime: number
  ): Promise<TestRunResult> {
    return new Promise((resolve) => {
      const parts = command.split(' ');
      const cmd = parts[0];
      const args = parts.slice(1);

      let output = '';
      let exitCode = 0;

      const child = spawn(cmd, args, {
        cwd,
        shell: true,
        env: { ...process.env, CI: 'true', FORCE_COLOR: '0' },
      });

      const timeoutId = setTimeout(() => {
        child.kill('SIGTERM');
        resolve({
          passed: false,
          testsRun: 0,
          testsPassed: 0,
          testsFailed: 0,
          testsSkipped: 0,
          output: output + '\n[Timeout exceeded]',
          executionTimeMs: Date.now() - startTime,
          failedTests: [],
          exitCode: 124,
          framework,
          error: `Test execution timed out after ${timeout}ms`,
        });
      }, timeout);

      child.stdout?.on('data', (data) => {
        output += data.toString();
      });

      child.stderr?.on('data', (data) => {
        output += data.toString();
      });

      child.on('error', (error) => {
        clearTimeout(timeoutId);
        resolve({
          passed: false,
          testsRun: 0,
          testsPassed: 0,
          testsFailed: 0,
          testsSkipped: 0,
          output,
          executionTimeMs: Date.now() - startTime,
          failedTests: [],
          exitCode: 1,
          framework,
          error: error.message,
        });
      });

      child.on('close', (code) => {
        clearTimeout(timeoutId);
        exitCode = code ?? 0;
        const parsed = this.parseOutput(output, framework);

        resolve({
          passed: exitCode === 0 && parsed.testsFailed === 0,
          testsRun: parsed.testsRun,
          testsPassed: parsed.testsPassed,
          testsFailed: parsed.testsFailed,
          testsSkipped: parsed.testsSkipped,
          output,
          executionTimeMs: Date.now() - startTime,
          failedTests: parsed.failedTests,
          exitCode,
          framework,
        });
      });
    });
  }

  /**
   * Parse test output based on framework
   */
  private parseOutput(output: string, framework: TestFramework): {
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    testsSkipped: number;
    failedTests: string[];
  } {
    switch (framework) {
      case 'vitest':
        return this.parseVitestOutput(output);
      case 'jest':
        return this.parseJestOutput(output);
      case 'pytest':
        return this.parsePytestOutput(output);
      case 'go':
        return this.parseGoOutput(output);
      case 'cargo':
        return this.parseCargoOutput(output);
      default:
        return this.parseGenericOutput(output);
    }
  }

  /**
   * Parse Vitest output
   */
  private parseVitestOutput(output: string): {
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    testsSkipped: number;
    failedTests: string[];
  } {
    const failedTests: string[] = [];

    // Match: Tests  X passed | Y failed
    const testsMatch = output.match(/Tests\s+(\d+)\s+passed[^|]*\|\s*(\d+)\s+failed/);
    // Match: Tests  X passed (Y)
    const passedOnlyMatch = output.match(/Tests\s+(\d+)\s+passed/);
    // Match skipped
    const skippedMatch = output.match(/(\d+)\s+skipped/);

    // Extract failed test names
    const failedMatches = output.matchAll(/FAIL\s+(.+?)(?:\s+\[|$)/gm);
    for (const match of failedMatches) {
      failedTests.push(match[1].trim());
    }

    if (testsMatch) {
      const passed = parseInt(testsMatch[1], 10);
      const failed = parseInt(testsMatch[2], 10);
      const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;
      return {
        testsRun: passed + failed + skipped,
        testsPassed: passed,
        testsFailed: failed,
        testsSkipped: skipped,
        failedTests,
      };
    }

    if (passedOnlyMatch) {
      const passed = parseInt(passedOnlyMatch[1], 10);
      const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;
      return {
        testsRun: passed + skipped,
        testsPassed: passed,
        testsFailed: 0,
        testsSkipped: skipped,
        failedTests,
      };
    }

    return { testsRun: 0, testsPassed: 0, testsFailed: 0, testsSkipped: 0, failedTests };
  }

  /**
   * Parse Jest output
   */
  private parseJestOutput(output: string): {
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    testsSkipped: number;
    failedTests: string[];
  } {
    const failedTests: string[] = [];

    // Match: Tests: X passed, Y failed, Z total
    const testsMatch = output.match(/Tests:\s+(\d+)\s+passed,?\s*(\d+)?\s*failed?,?\s*(\d+)?\s*skipped?,?\s*(\d+)\s+total/i);

    // Extract failed test names
    const failedMatches = output.matchAll(/FAIL\s+(.+?)$/gm);
    for (const match of failedMatches) {
      failedTests.push(match[1].trim());
    }

    if (testsMatch) {
      const passed = parseInt(testsMatch[1], 10) || 0;
      const failed = parseInt(testsMatch[2], 10) || 0;
      const skipped = parseInt(testsMatch[3], 10) || 0;
      const total = parseInt(testsMatch[4], 10) || passed + failed + skipped;
      return {
        testsRun: total,
        testsPassed: passed,
        testsFailed: failed,
        testsSkipped: skipped,
        failedTests,
      };
    }

    return { testsRun: 0, testsPassed: 0, testsFailed: 0, testsSkipped: 0, failedTests };
  }

  /**
   * Parse pytest output
   */
  private parsePytestOutput(output: string): {
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    testsSkipped: number;
    failedTests: string[];
  } {
    const failedTests: string[] = [];

    // pytest can output in different orders: "X passed, Y failed" or "Y failed, X passed"
    // Match passed count
    const passedMatch = output.match(/(\d+)\s+passed/i);
    // Match failed count
    const failedCountMatch = output.match(/(\d+)\s+failed/i);
    // Match skipped count
    const skippedMatch = output.match(/(\d+)\s+skipped/i);

    // Extract failed test names
    const failedMatches = output.matchAll(/FAILED\s+(.+?)::/gm);
    for (const match of failedMatches) {
      failedTests.push(match[1].trim());
    }

    const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
    const failed = failedCountMatch ? parseInt(failedCountMatch[1], 10) : 0;
    const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;

    if (passed > 0 || failed > 0 || skipped > 0) {
      return {
        testsRun: passed + failed + skipped,
        testsPassed: passed,
        testsFailed: failed,
        testsSkipped: skipped,
        failedTests,
      };
    }

    return { testsRun: 0, testsPassed: 0, testsFailed: 0, testsSkipped: 0, failedTests };
  }

  /**
   * Parse Go test output
   */
  private parseGoOutput(output: string): {
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    testsSkipped: number;
    failedTests: string[];
  } {
    const failedTests: string[] = [];
    let passed = 0;
    let failed = 0;

    // Count ok/FAIL packages
    const okMatches = output.match(/^ok\s+/gm);
    const failMatches = output.match(/^FAIL\s+/gm);

    passed = okMatches?.length ?? 0;
    failed = failMatches?.length ?? 0;

    // Extract failed test names
    const testFailMatches = output.matchAll(/--- FAIL:\s+(\S+)/gm);
    for (const match of testFailMatches) {
      failedTests.push(match[1].trim());
    }

    return {
      testsRun: passed + failed,
      testsPassed: passed,
      testsFailed: failed,
      testsSkipped: 0,
      failedTests,
    };
  }

  /**
   * Parse Cargo test output
   */
  private parseCargoOutput(output: string): {
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    testsSkipped: number;
    failedTests: string[];
  } {
    const failedTests: string[] = [];

    // Match: test result: ok. X passed; Y failed; Z ignored
    const resultsMatch = output.match(/test result:.*?(\d+)\s+passed;\s*(\d+)\s+failed;\s*(\d+)\s+ignored/i);

    // Extract failed test names
    const failedMatches = output.matchAll(/test\s+(.+?)\s+\.\.\.\s+FAILED/gm);
    for (const match of failedMatches) {
      failedTests.push(match[1].trim());
    }

    if (resultsMatch) {
      const passed = parseInt(resultsMatch[1], 10) || 0;
      const failed = parseInt(resultsMatch[2], 10) || 0;
      const skipped = parseInt(resultsMatch[3], 10) || 0;
      return {
        testsRun: passed + failed + skipped,
        testsPassed: passed,
        testsFailed: failed,
        testsSkipped: skipped,
        failedTests,
      };
    }

    return { testsRun: 0, testsPassed: 0, testsFailed: 0, testsSkipped: 0, failedTests };
  }

  /**
   * Parse generic test output
   */
  private parseGenericOutput(output: string): {
    testsRun: number;
    testsPassed: number;
    testsFailed: number;
    testsSkipped: number;
    failedTests: string[];
  } {
    const failedTests: string[] = [];

    // Try to find common patterns
    const passedMatch = output.match(/(\d+)\s+(?:tests?\s+)?pass(?:ed|ing)?/i);
    const failedMatch = output.match(/(\d+)\s+(?:tests?\s+)?fail(?:ed|ing)?/i);
    const skippedMatch = output.match(/(\d+)\s+(?:tests?\s+)?skip(?:ped)?/i);

    const passed = passedMatch ? parseInt(passedMatch[1], 10) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1], 10) : 0;
    const skipped = skippedMatch ? parseInt(skippedMatch[1], 10) : 0;

    return {
      testsRun: passed + failed + skipped,
      testsPassed: passed,
      testsFailed: failed,
      testsSkipped: skipped,
      failedTests,
    };
  }

  /**
   * Create empty result
   */
  private createEmptyResult(framework: TestFramework, startTime: number): TestRunResult {
    return {
      passed: true,
      testsRun: 0,
      testsPassed: 0,
      testsFailed: 0,
      testsSkipped: 0,
      output: '',
      executionTimeMs: Date.now() - startTime,
      failedTests: [],
      exitCode: 0,
      framework,
    };
  }
}

// ===== SINGLETON =====

let runnerInstance: TestRunner | null = null;

/**
 * Get or create the singleton TestRunner instance
 */
export function getTestRunner(config?: TestRunnerConfig): TestRunner {
  if (!runnerInstance || config) {
    runnerInstance = new TestRunner(config);
  }
  return runnerInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetTestRunner(): void {
  runnerInstance = null;
}

/**
 * Initialize the runner with configuration
 */
export function initializeTestRunner(config: TestRunnerConfig): TestRunner {
  runnerInstance = new TestRunner(config);
  return runnerInstance;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Quick run tests without creating instance
 */
export async function runTests(
  options?: TestRunOptions,
  config?: TestRunnerConfig
): Promise<TestRunResult> {
  const runner = config ? new TestRunner(config) : getTestRunner();
  return runner.runTests(options);
}

/**
 * Get human-readable test summary
 */
export function summarizeTestResult(result: TestRunResult): string {
  const status = result.passed ? '✓' : '✗';
  const counts = `${result.testsPassed}/${result.testsRun} passed`;
  const time = `${result.executionTimeMs}ms`;

  let summary = `${status} Tests: ${counts} (${time})`;

  if (result.testsFailed > 0) {
    summary += ` - ${result.testsFailed} failed`;
    if (result.failedTests.length > 0 && result.failedTests.length <= 3) {
      summary += `: ${result.failedTests.join(', ')}`;
    }
  }

  if (result.testsSkipped > 0) {
    summary += ` (${result.testsSkipped} skipped)`;
  }

  return summary;
}

/**
 * Check if result indicates all tests passed
 */
export function allTestsPassed(result: TestRunResult): boolean {
  return result.passed && result.testsFailed === 0 && result.exitCode === 0;
}

/**
 * Get framework display name
 */
export function getFrameworkName(framework: TestFramework): string {
  const names: Record<TestFramework, string> = {
    vitest: 'Vitest',
    jest: 'Jest',
    mocha: 'Mocha',
    pytest: 'pytest',
    go: 'Go Test',
    cargo: 'Cargo Test',
    npm: 'npm test',
    unknown: 'Unknown',
  };
  return names[framework];
}
