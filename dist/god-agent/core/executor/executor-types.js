/**
 * Default executor configuration
 */
export const DEFAULT_EXECUTOR_CONFIG = {
    defaultTimeoutMs: 30000,
    maxTaskLength: 10240,
    verbose: false,
    cwd: process.cwd(),
    workingDirectory: process.cwd(),
    hookTimeout: 5000,
    maxRetries: 2,
    retryDelay: 1000,
    enableHooks: true,
    timeout: 60000,
    defaultAgentType: 'coder',
    executionMode: 'live',
    outputFormat: 'json',
    // TIER-2.1: Router defaults
    enableRouterTracking: true,
    blockOnBudgetExceeded: false,
};
//# sourceMappingURL=executor-types.js.map