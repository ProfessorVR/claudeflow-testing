/**
 * Tests for Test Runner
 *
 * Tests the deterministic test execution with:
 * - Framework detection
 * - Output parsing
 * - Command building
 * - Result aggregation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  TestRunner,
  getTestRunner,
  resetTestRunner,
  initializeTestRunner,
  runTests,
  summarizeTestResult,
  allTestsPassed,
  getFrameworkName,
  type TestRunResult,
  type TestFramework,
} from '../../../../src/god-agent/core/router/test-runner.js';

// ===== MOCK CHILD PROCESS =====

// Mock the child_process module
vi.mock('child_process', () => {
  const mockSpawn = vi.fn();
  const mockExec = vi.fn();
  return {
    spawn: mockSpawn,
    exec: mockExec,
  };
});

import { spawn, exec } from 'child_process';
import { EventEmitter } from 'events';

function createMockProcess(
  stdout: string,
  stderr: string = '',
  exitCode: number = 0,
  delay: number = 10
): EventEmitter & { stdout: EventEmitter; stderr: EventEmitter } {
  const proc = new EventEmitter() as EventEmitter & {
    stdout: EventEmitter;
    stderr: EventEmitter;
    kill: () => void;
  };
  proc.stdout = new EventEmitter();
  proc.stderr = new EventEmitter();
  proc.kill = vi.fn();

  setTimeout(() => {
    if (stdout) proc.stdout.emit('data', Buffer.from(stdout));
    if (stderr) proc.stderr.emit('data', Buffer.from(stderr));
    proc.emit('close', exitCode);
  }, delay);

  return proc;
}

// ===== TESTS =====

describe('TestRunner', () => {
  beforeEach(() => {
    resetTestRunner();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create with default configuration', () => {
      const runner = new TestRunner();
      expect(runner).toBeDefined();
    });

    it('should create with custom configuration', () => {
      const runner = new TestRunner({
        defaultCwd: '/custom/path',
        defaultTimeout: 30000,
        defaultCommand: 'custom test',
      });
      expect(runner).toBeDefined();
    });

    it('should accept framework-specific commands', () => {
      const runner = new TestRunner({
        frameworkCommands: {
          vitest: 'npm run test:unit',
          jest: 'npm run test:jest',
        },
      });
      expect(runner).toBeDefined();
    });
  });

  describe('Framework Detection', () => {
    it('should detect vitest from config file', async () => {
      (exec as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (_cmd: string, _opts: unknown, callback?: (err: Error | null, result: { stdout: string }) => void) => {
          if (callback) {
            callback(null, { stdout: 'vitest.config.ts' });
          }
          return { stdout: '', stderr: '' };
        }
      );

      const runner = new TestRunner();
      const framework = await runner.detectFramework('/project');
      expect(framework).toBe('vitest');
    });

    it('should detect jest from config file', async () => {
      (exec as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (_cmd: string, _opts: unknown, callback?: (err: Error | null, result: { stdout: string }) => void) => {
          if (callback) {
            callback(null, { stdout: 'jest.config.js' });
          }
          return { stdout: '', stderr: '' };
        }
      );

      const runner = new TestRunner();
      const framework = await runner.detectFramework('/project');
      expect(framework).toBe('jest');
    });

    it('should detect pytest from config file', async () => {
      (exec as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (_cmd: string, _opts: unknown, callback?: (err: Error | null, result: { stdout: string }) => void) => {
          if (callback) {
            callback(null, { stdout: 'pytest.ini' });
          }
          return { stdout: '', stderr: '' };
        }
      );

      const runner = new TestRunner();
      const framework = await runner.detectFramework('/project');
      expect(framework).toBe('pytest');
    });

    it('should detect go from go.mod', async () => {
      (exec as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (_cmd: string, _opts: unknown, callback?: (err: Error | null, result: { stdout: string }) => void) => {
          if (callback) {
            callback(null, { stdout: 'go.mod' });
          }
          return { stdout: '', stderr: '' };
        }
      );

      const runner = new TestRunner();
      const framework = await runner.detectFramework('/project');
      expect(framework).toBe('go');
    });

    it('should detect cargo from Cargo.toml', async () => {
      (exec as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (_cmd: string, _opts: unknown, callback?: (err: Error | null, result: { stdout: string }) => void) => {
          if (callback) {
            callback(null, { stdout: 'Cargo.toml' });
          }
          return { stdout: '', stderr: '' };
        }
      );

      const runner = new TestRunner();
      const framework = await runner.detectFramework('/project');
      expect(framework).toBe('cargo');
    });

    it('should fallback to npm when package.json present', async () => {
      (exec as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (_cmd: string, _opts: unknown, callback?: (err: Error | null, result: { stdout: string }) => void) => {
          if (callback) {
            callback(null, { stdout: 'package.json' });
          }
          return { stdout: '', stderr: '' };
        }
      );

      const runner = new TestRunner();
      const framework = await runner.detectFramework('/project');
      expect(framework).toBe('npm');
    });

    it('should return unknown when detection fails', async () => {
      (exec as unknown as ReturnType<typeof vi.fn>).mockImplementation(
        (_cmd: string, _opts: unknown, callback?: (err: Error | null, result: { stdout: string }) => void) => {
          if (callback) {
            callback(new Error('ls failed'), { stdout: '' });
          }
          return { stdout: '', stderr: '' };
        }
      );

      const runner = new TestRunner();
      const framework = await runner.detectFramework('/project');
      expect(framework).toBe('unknown');
    });
  });

  describe('Output Parsing - Vitest', () => {
    it('should parse vitest passing output', async () => {
      const vitestOutput = `
 ✓ tests/example.test.ts (5)
   ✓ Example Suite (5)

 Test Files  1 passed (1)
      Tests  5 passed (5)
   Start at  10:00:00
   Duration  1.23s
`;

      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockProcess(vitestOutput, '', 0)
      );

      const runner = new TestRunner();
      const result = await runner.runTests({ framework: 'vitest' });

      expect(result.passed).toBe(true);
      expect(result.testsPassed).toBe(5);
      expect(result.testsFailed).toBe(0);
    });

    it('should parse vitest failing output', async () => {
      const vitestOutput = `
 FAIL  tests/example.test.ts > Example Suite > should work
 ✓ tests/example.test.ts (4)
 ✗ tests/example.test.ts (1)

 Test Files  1 failed (1)
      Tests  4 passed | 1 failed (5)
   Duration  1.50s
`;

      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockProcess(vitestOutput, '', 1)
      );

      const runner = new TestRunner();
      const result = await runner.runTests({ framework: 'vitest' });

      expect(result.passed).toBe(false);
      expect(result.testsPassed).toBe(4);
      expect(result.testsFailed).toBe(1);
    });
  });

  describe('Output Parsing - Jest', () => {
    it('should parse jest passing output', async () => {
      const jestOutput = `
PASS  tests/example.test.js
  Example Suite
    ✓ should work (5 ms)
    ✓ should also work (3 ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
Snapshots:   0 total
Time:        2.5 s
`;

      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockProcess(jestOutput, '', 0)
      );

      const runner = new TestRunner();
      const result = await runner.runTests({ framework: 'jest' });

      expect(result.passed).toBe(true);
    });
  });

  describe('Output Parsing - pytest', () => {
    it('should parse pytest passing output', async () => {
      const pytestOutput = `
============================= test session starts =============================
collected 10 items

tests/test_example.py ..........                                        [100%]

============================== 10 passed in 1.23s ==============================
`;

      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockProcess(pytestOutput, '', 0)
      );

      const runner = new TestRunner();
      const result = await runner.runTests({ framework: 'pytest' });

      expect(result.passed).toBe(true);
      expect(result.testsPassed).toBe(10);
    });

    it('should parse pytest failing output', async () => {
      const pytestOutput = `
============================= test session starts =============================
collected 10 items

tests/test_example.py ........F.                                        [100%]

FAILED tests/test_example.py::test_something

============================== 1 failed, 9 passed in 1.50s =====================
`;

      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockProcess(pytestOutput, '', 1)
      );

      const runner = new TestRunner();
      const result = await runner.runTests({ framework: 'pytest' });

      expect(result.passed).toBe(false);
      expect(result.testsPassed).toBe(9);
      expect(result.testsFailed).toBe(1);
    });
  });

  describe('Output Parsing - Go', () => {
    it('should parse go test passing output', async () => {
      const goOutput = `
=== RUN   TestExample
--- PASS: TestExample (0.00s)
=== RUN   TestAnother
--- PASS: TestAnother (0.01s)
PASS
ok      example.com/pkg    0.123s
`;

      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockProcess(goOutput, '', 0)
      );

      const runner = new TestRunner();
      const result = await runner.runTests({ framework: 'go' });

      expect(result.passed).toBe(true);
    });

    it('should parse go test failing output', async () => {
      const goOutput = `
=== RUN   TestExample
--- PASS: TestExample (0.00s)
=== RUN   TestFailing
--- FAIL: TestFailing (0.01s)
FAIL
FAIL    example.com/pkg    0.123s
`;

      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockProcess(goOutput, '', 1)
      );

      const runner = new TestRunner();
      const result = await runner.runTests({ framework: 'go' });

      expect(result.passed).toBe(false);
      expect(result.failedTests).toContain('TestFailing');
    });
  });

  describe('Output Parsing - Cargo', () => {
    it('should parse cargo test passing output', async () => {
      const cargoOutput = `
running 5 tests
test tests::test_one ... ok
test tests::test_two ... ok
test tests::test_three ... ok
test tests::test_four ... ok
test tests::test_five ... ok

test result: ok. 5 passed; 0 failed; 0 ignored
`;

      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockProcess(cargoOutput, '', 0)
      );

      const runner = new TestRunner();
      const result = await runner.runTests({ framework: 'cargo' });

      expect(result.passed).toBe(true);
      expect(result.testsPassed).toBe(5);
    });

    it('should parse cargo test failing output', async () => {
      const cargoOutput = `
running 5 tests
test tests::test_one ... ok
test tests::test_two ... FAILED
test tests::test_three ... ok

test result: FAILED. 2 passed; 1 failed; 0 ignored
`;

      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockProcess(cargoOutput, '', 1)
      );

      const runner = new TestRunner();
      const result = await runner.runTests({ framework: 'cargo' });

      expect(result.passed).toBe(false);
      expect(result.testsFailed).toBe(1);
      expect(result.failedTests).toContain('tests::test_two');
    });
  });

  describe('Error Handling', () => {
    it('should handle spawn error', async () => {
      const proc = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter;
        stderr: EventEmitter;
      };
      proc.stdout = new EventEmitter();
      proc.stderr = new EventEmitter();

      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(proc);

      setTimeout(() => {
        proc.emit('error', new Error('Command not found'));
      }, 10);

      const runner = new TestRunner();
      const result = await runner.runTests({ skipDetection: true });

      expect(result.passed).toBe(false);
      expect(result.error).toContain('Command not found');
    });

    it('should handle timeout', async () => {
      const proc = new EventEmitter() as EventEmitter & {
        stdout: EventEmitter;
        stderr: EventEmitter;
        kill: () => void;
      };
      proc.stdout = new EventEmitter();
      proc.stderr = new EventEmitter();
      proc.kill = vi.fn();

      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(proc);

      const runner = new TestRunner();
      const result = await runner.runTests({
        skipDetection: true,
        timeout: 50,
      });

      expect(result.passed).toBe(false);
      expect(result.error).toContain('timed out');
      expect(result.exitCode).toBe(124);
    });
  });

  describe('Command Building', () => {
    it('should add pattern filter for vitest', async () => {
      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockProcess('Tests  1 passed (1)', '', 0)
      );

      const runner = new TestRunner({
        frameworkCommands: { vitest: 'npx vitest run' },
      });

      await runner.runTests({
        command: 'npx vitest run',
        pattern: 'test_name',
        framework: 'vitest',
      });

      // spawn splits the command string on spaces, so "-t \"test_name\"" becomes separate args
      expect(spawn).toHaveBeenCalledWith(
        'npx',
        expect.arrayContaining(['vitest', 'run', '-t']),
        expect.any(Object)
      );
    });
  });

  describe('runTestsForFiles', () => {
    it('should run tests for specific files', async () => {
      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockProcess('Tests  1 passed (1)', '', 0)
      );

      const runner = new TestRunner();
      const result = await runner.runTestsForFiles(
        ['src/example.ts'],
        { skipDetection: true }
      );

      expect(result).toBeDefined();
    });
  });
});

describe('Singleton Functions', () => {
  beforeEach(() => {
    resetTestRunner();
    vi.clearAllMocks();
  });

  it('getTestRunner should return same instance', () => {
    const runner1 = getTestRunner();
    const runner2 = getTestRunner();
    expect(runner1).toBe(runner2);
  });

  it('getTestRunner with config should create new instance', () => {
    const runner1 = getTestRunner();
    const runner2 = getTestRunner({ defaultTimeout: 30000 });
    expect(runner1).not.toBe(runner2);
  });

  it('initializeTestRunner should create configured instance', () => {
    const runner = initializeTestRunner({ defaultTimeout: 30000 });
    expect(runner).toBeDefined();
    expect(getTestRunner()).toBe(runner);
  });

  it('resetTestRunner should clear instance', () => {
    const runner1 = getTestRunner();
    resetTestRunner();
    const runner2 = getTestRunner();
    expect(runner1).not.toBe(runner2);
  });
});

describe('Utility Functions', () => {
  beforeEach(() => {
    resetTestRunner();
    vi.clearAllMocks();
  });

  describe('runTests (standalone function)', () => {
    it('should run tests with provided config', async () => {
      (spawn as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
        createMockProcess('Tests  5 passed (5)', '', 0)
      );

      const result = await runTests(
        { skipDetection: true },
        { defaultCommand: 'npm test' }
      );

      expect(result).toBeDefined();
    });
  });

  describe('summarizeTestResult', () => {
    it('should format passing result', () => {
      const result: TestRunResult = {
        passed: true,
        testsRun: 10,
        testsPassed: 10,
        testsFailed: 0,
        testsSkipped: 0,
        output: '',
        executionTimeMs: 1234,
        failedTests: [],
        exitCode: 0,
        framework: 'vitest',
      };

      const summary = summarizeTestResult(result);
      expect(summary).toContain('10/10 passed');
      expect(summary).toContain('1234ms');
    });

    it('should format failing result with test names', () => {
      const result: TestRunResult = {
        passed: false,
        testsRun: 10,
        testsPassed: 8,
        testsFailed: 2,
        testsSkipped: 0,
        output: '',
        executionTimeMs: 1500,
        failedTests: ['test1', 'test2'],
        exitCode: 1,
        framework: 'vitest',
      };

      const summary = summarizeTestResult(result);
      expect(summary).toContain('8/10 passed');
      expect(summary).toContain('2 failed');
      expect(summary).toContain('test1');
      expect(summary).toContain('test2');
    });

    it('should include skipped count', () => {
      const result: TestRunResult = {
        passed: true,
        testsRun: 10,
        testsPassed: 8,
        testsFailed: 0,
        testsSkipped: 2,
        output: '',
        executionTimeMs: 1000,
        failedTests: [],
        exitCode: 0,
        framework: 'vitest',
      };

      const summary = summarizeTestResult(result);
      expect(summary).toContain('2 skipped');
    });
  });

  describe('allTestsPassed', () => {
    it('should return true when all tests pass', () => {
      const result: TestRunResult = {
        passed: true,
        testsRun: 10,
        testsPassed: 10,
        testsFailed: 0,
        testsSkipped: 0,
        output: '',
        executionTimeMs: 1000,
        failedTests: [],
        exitCode: 0,
        framework: 'vitest',
      };

      expect(allTestsPassed(result)).toBe(true);
    });

    it('should return false when tests fail', () => {
      const result: TestRunResult = {
        passed: false,
        testsRun: 10,
        testsPassed: 9,
        testsFailed: 1,
        testsSkipped: 0,
        output: '',
        executionTimeMs: 1000,
        failedTests: ['test1'],
        exitCode: 1,
        framework: 'vitest',
      };

      expect(allTestsPassed(result)).toBe(false);
    });

    it('should return false when exit code non-zero', () => {
      const result: TestRunResult = {
        passed: false,
        testsRun: 0,
        testsPassed: 0,
        testsFailed: 0,
        testsSkipped: 0,
        output: '',
        executionTimeMs: 1000,
        failedTests: [],
        exitCode: 1,
        framework: 'vitest',
      };

      expect(allTestsPassed(result)).toBe(false);
    });
  });

  describe('getFrameworkName', () => {
    it('should return display names for frameworks', () => {
      expect(getFrameworkName('vitest')).toBe('Vitest');
      expect(getFrameworkName('jest')).toBe('Jest');
      expect(getFrameworkName('mocha')).toBe('Mocha');
      expect(getFrameworkName('pytest')).toBe('pytest');
      expect(getFrameworkName('go')).toBe('Go Test');
      expect(getFrameworkName('cargo')).toBe('Cargo Test');
      expect(getFrameworkName('npm')).toBe('npm test');
      expect(getFrameworkName('unknown')).toBe('Unknown');
    });
  });
});
