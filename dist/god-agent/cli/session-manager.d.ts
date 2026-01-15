/**
 * SessionManager - Handles pipeline session persistence
 * Implements REQ-PIPE-020, REQ-PIPE-021, REQ-PIPE-022, REQ-PIPE-023
 */
import type { PipelineSession, SessionStatus, DataSourceMode, ToolPermissions, QueryIntent, ToolUsageEntry, PromotedKU, LLMCallEntry, LLMCallPurpose } from './cli-types.js';
/**
 * SessionManager class for pipeline session persistence
 */
export declare class SessionManager {
    private sessionDir;
    constructor(baseDir?: string);
    /**
     * Create new session object with initial state
     * [REQ-PIPE-020, REQ-PIPE-021, REQ-PIPE-023]
     */
    createSession(sessionId: string, query: string, styleProfileId: string, pipelineId: string, dataSourceMode?: DataSourceMode): PipelineSession;
    /**
     * Save session to disk with atomic write pattern
     * Uses temp file + rename to prevent corruption
     * [REQ-PIPE-020]
     */
    saveSession(session: PipelineSession): Promise<void>;
    /**
     * Load session from disk with validation
     * [REQ-PIPE-020]
     */
    loadSession(sessionId: string): Promise<PipelineSession>;
    /**
     * Check if session exists on disk
     */
    sessionExists(sessionId: string): Promise<boolean>;
    /**
     * Check if session has expired (inactive > 24 hours)
     * [REQ-PIPE-022]
     */
    isSessionExpired(session: PipelineSession): boolean;
    /**
     * Update session's lastActivityTime
     * Used by next command to keep session alive
     * [REQ-PIPE-002]
     */
    updateActivity(session: PipelineSession): Promise<void>;
    /**
     * Get sessions active within last N days
     * Default: 7 days for list command
     */
    listSessions(options?: {
        includeAll?: boolean;
        maxAgeDays?: number;
    }): Promise<PipelineSession[]>;
    /**
     * Update session status
     */
    updateStatus(session: PipelineSession, status: SessionStatus): Promise<void>;
    /**
     * Delete a session
     */
    deleteSession(sessionId: string): Promise<void>;
    /**
     * Get most recently active session
     */
    getMostRecentSession(): Promise<PipelineSession | null>;
    /**
     * Get session directory path
     */
    getSessionDirectory(): string;
    /**
     * Helper: Get session file path
     */
    private getSessionPath;
    /**
     * Helper: Ensure session directory exists
     */
    private ensureSessionDirectory;
    /**
     * Helper: Validate session structure
     */
    private validateSession;
    /**
     * Helper: Sleep utility for retry delay
     */
    private sleep;
}
/**
 * Session not found error
 */
export declare class SessionNotFoundError extends Error {
    readonly sessionId: string;
    constructor(sessionId: string);
}
/**
 * Session corrupted error (invalid JSON)
 */
export declare class SessionCorruptedError extends Error {
    readonly sessionId: string;
    constructor(sessionId: string);
}
/**
 * Session persist error (disk write failure)
 */
export declare class SessionPersistError extends Error {
    readonly session: PipelineSession;
    constructor(message: string, session: PipelineSession);
}
/**
 * Session expired error
 */
export declare class SessionExpiredError extends Error {
    readonly sessionId: string;
    constructor(sessionId: string);
}
/**
 * Resolve tool permissions based on data source mode, coverage grade, and query intent.
 * Implements the programmatic tool gate for local/hybrid/external modes.
 *
 * GAP-H01: Programmatic tool gate implementation
 *
 * @param dataSourceMode - The research mode policy (local, hybrid, external)
 * @param coverageGrade - Coverage grade from Phase 9 REPORT (NONE, LOW, MED, HIGH)
 * @param queryIntent - Analyzed query intent for hybrid decisions
 * @returns ToolPermissions object indicating which tools are allowed
 */
export declare function resolveToolPermissions(dataSourceMode: DataSourceMode, coverageGrade?: 'NONE' | 'LOW' | 'MED' | 'HIGH', queryIntent?: QueryIntent): ToolPermissions;
/**
 * Analyze query intent to determine if external tools are needed.
 * Used in hybrid mode to make intelligent decisions about tool usage.
 *
 * GAP-H03: Query intent analyzer implementation
 *
 * @param query - The research query to analyze
 * @returns QueryIntent object with analysis results
 */
export declare function analyzeQueryIntent(query: string): QueryIntent;
/**
 * Create a tool usage entry for the audit log.
 *
 * GAP-H04: Tool usage logging implementation
 *
 * @param agentKey - The agent that used the tool
 * @param tool - The tool that was used (webSearch, webFetch, perplexity)
 * @param justification - Why the tool was used
 * @param coverageGrade - Coverage grade at the time of usage
 * @returns ToolUsageEntry for the audit log
 */
export declare function createToolUsageEntry(agentKey: string, tool: string, justification: string, coverageGrade: string): ToolUsageEntry;
/**
 * Add a tool usage entry to a session's audit log.
 * Mutates the session in place and returns it.
 *
 * @param session - The pipeline session to update
 * @param entry - The tool usage entry to add
 * @returns The updated session
 */
export declare function logToolUsage(session: PipelineSession, entry: ToolUsageEntry): PipelineSession;
/**
 * Check if a specific tool is allowed for the current session.
 *
 * @param session - The pipeline session
 * @param tool - The tool to check (webSearch, webFetch, perplexity)
 * @returns true if tool is allowed, false otherwise
 */
export declare function isToolAllowed(session: PipelineSession, tool: 'webSearch' | 'webFetch' | 'perplexity'): boolean;
/**
 * Initialize tool permissions for a session based on its data source mode.
 * Called during session creation or when dataSourceMode changes.
 *
 * @param session - The pipeline session to initialize
 * @returns The session with toolPermissions set
 */
export declare function initializeToolPermissions(session: PipelineSession): PipelineSession;
/**
 * Update session coverage grade (called after Phase 9 REPORT).
 * Re-resolves tool permissions based on new coverage information.
 *
 * @param session - The pipeline session to update
 * @param coverageGrade - The new coverage grade from Phase 9 REPORT
 * @returns The session with updated coverage and permissions
 */
export declare function updateCoverageGrade(session: PipelineSession, coverageGrade: 'NONE' | 'LOW' | 'MED' | 'HIGH'): PipelineSession;
/**
 * Promote high-confidence Knowledge Units from Phase 9 REPORT to session context.
 *
 * GAP-L02: Local KU promotion implementation
 *
 * @param session - The pipeline session to update
 * @param phase9Report - The Phase 9 REPORT JSON object
 * @param threshold - Minimum confidence threshold (default: 0.7)
 * @returns The session with promotedKUs populated
 */
export declare function promoteKnowledgeUnits(session: PipelineSession, phase9Report: Record<string, unknown>, threshold?: number): PipelineSession;
/**
 * Format promoted KUs for agent prompt injection.
 *
 * @param promotedKUs - Array of promoted Knowledge Units
 * @returns Formatted markdown string for prompt injection
 */
export declare function formatPromotedKUsForPrompt(promotedKUs: PromotedKU[]): string;
/**
 * Initialize KU promotion settings for a session.
 *
 * @param session - The pipeline session
 * @param enabled - Whether to enable KU promotion
 * @param threshold - Confidence threshold (optional)
 * @returns The session with KU promotion settings
 */
export declare function initializeKUPromotion(session: PipelineSession, enabled: boolean, threshold?: number): PipelineSession;
/**
 * Create an LLM call entry for the audit log.
 *
 * GAP-LLM02: LLM call logging implementation
 *
 * @param agentKey - The agent making the call
 * @param model - The model being used
 * @param purpose - The purpose of the LLM call
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @param durationMs - Duration of the call in milliseconds
 * @param success - Whether the call succeeded
 * @param error - Error message if failed
 * @returns LLMCallEntry for the audit log
 */
export declare function createLLMCallEntry(agentKey: string, model: string, purpose: LLMCallPurpose, inputTokens: number, outputTokens: number, durationMs: number, success: boolean, error?: string): LLMCallEntry;
/**
 * Log an LLM call to the session audit trail.
 *
 * GAP-LLM02: LLM call logging implementation
 *
 * @param session - The pipeline session to update
 * @param entry - The LLM call entry to add
 * @returns The updated session with warning if knowledge_retrieval purpose used
 */
export declare function logLLMCall(session: PipelineSession, entry: LLMCallEntry): {
    session: PipelineSession;
    warning?: string;
};
/**
 * Get LLM usage summary for reporting.
 *
 * @param session - The pipeline session
 * @returns Formatted usage summary
 */
export declare function getLLMUsageSummary(session: PipelineSession): string;
/**
 * Check if LLM usage is within acceptable boundaries.
 *
 * @param session - The pipeline session
 * @returns Object with isValid flag and violations list
 */
export declare function validateLLMBoundaries(session: PipelineSession): {
    isValid: boolean;
    violations: string[];
};
//# sourceMappingURL=session-manager.d.ts.map