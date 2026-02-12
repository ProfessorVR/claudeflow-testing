#!/usr/bin/env node
/**
 * PhD Pipeline CLI - Guided orchestration tool
 * Implements REQ-PIPE-001 through REQ-PIPE-007
 */

import { Command } from 'commander';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs/promises';
import { StyleProfileManager } from '../universal/style-profile.js';
import type { StoredStyleProfile } from '../universal/style-profile.js';
import { SessionManager } from './session-manager.js';
import type {
  InitOptions,
  InitResponse,
  NextOptions,
  NextResponse,
  CompleteOptions,
  CompleteResponse,
  StatusOptions,
  StatusResponse,
  ListOptions,
  ListResponse,
  SessionListItem,
  ResumeOptions,
  ResumeResponse,
  AbortOptions,
  AbortResponse,
  ProgressInfo,
  CompletionSummary,
  AgentDetails,
  ErrorResponse,
  PipelineSession,
} from './cli-types.js';
import { AgentMismatchError } from './cli-types.js';
import { getPhaseName } from './cli-types.js';
import {
  PHASE_1_5_AGENT_COUNT,
  PHASE_6_START_INDEX,
  PHASE_7_AGENT_COUNT,
  STATIC_PHASE_7_START_INDEX
} from './cli-types.js';
import { PipelineConfigLoader } from './pipeline-loader.js';
import type { AgentConfig } from './pipeline-loader.js';

// Import 46-agent configuration from phd-pipeline-config (TASK-CONFIG-002)
// These provide the canonical agent definitions and utility functions
import {
  PHD_AGENTS,
  PHD_PHASES,
  DEFAULT_CONFIG,
  getAgentByKey as getConfigAgentByKey,
  getAgentsByPhase as getConfigAgentsByPhase,
  getAgentIndex as getConfigAgentIndex,
  getAgentByIndex as getConfigAgentByIndex,
  validateConfiguration,
  getTotalAgentCount,
  getPhaseById,
  getAgentFilePath,
  type AgentConfig as PhdAgentConfig,
  type SessionState as PhdSessionState,
  type PhaseDefinition,
} from './phd-pipeline-config.js';
import { StyleInjector } from './style-injector.js';
import { SessionNotFoundError, SessionCorruptedError, SessionExpiredError, updateCoverageGrade, initializeToolPermissions, analyzeQueryIntent, QueryIntent } from './session-manager.js';
import { DynamicAgentGenerator } from './dynamic-agent-generator.js';
import { ChapterStructureLoader } from './chapter-structure-loader.js';
import { getUCMClient } from './ucm-daemon-client.js';
import { PhdPipelineAdapter } from '../core/ucm/adapters/phd-pipeline-adapter.js';
import { SocketClient } from '../observability/socket-client.js';
import { FinalStageOrchestrator, PROGRESS_MILESTONES } from './final-stage/index.js';
import type { FinalStageOptions, FinalStageResult, ProgressReport, FinalStageState } from './final-stage/index.js';
import type { IActivityEvent } from '../observability/types.js';
// Cross-chapter context management for dissertation coherence
import { DissertationContextManager } from './context/index.js';
import type { DissertationValidationReport } from './context/index.js';
// Multi-pass quality gauntlet for publication-ready dissertation output
import {
  QualityGauntlet,
  RevisionOrchestrator,
  ProvenanceLedger,
  createDefaultGauntlet,
  createDefaultOrchestrator,
  type GauntletResult,
  type RefinementResult,
} from './quality/index.js';
// Implements RULE-025, RULE-028, RULE-031: SonaEngine integration for trajectory tracking
import { createProductionSonaEngine } from '../core/learning/sona-engine.js';
import type { SonaEngine } from '../core/learning/sona-engine.js';
import type { TrajectoryID } from '../core/learning/sona-types.js';
// Paragraph-level feedback learning for style improvement
import {
  FeedbackIntegration,
  createFeedbackIntegration,
  type DriftAnalysis,
  type FeedbackProcessingResult,
} from './feedback/index.js';
import { DeepStyleAnalyzer } from './style/deep-style-analyzer.js';
// Dissertation-native features for defense prep, progress tracking, committee simulation
import {
  DissertationProgressTracker,
  CommitteeSimulator,
  DefensePreparationGenerator,
  InstitutionalComplianceChecker,
  createDissertationSuiteWithCompliance,
  exportDefensePreparation,
  type DissertationConfig,
  type DefenseConfig,
  type CommitteeMember,
  type ComplianceReport,
} from './dissertation/index.js';
// Import PhDQualityCalculator for discriminating quality assessment (RULE-033, RULE-034)
import { calculatePhDQuality, createQualityContext } from './phd-quality-calculator.js';

// Lazy-initialized socket client for event emission
let socketClient: SocketClient | null = null;

// Lazy-initialized SonaEngine for trajectory tracking (RULE-031)
let sonaEngine: SonaEngine | null = null;
// Active trajectory map: sessionId -> Map<agentKey -> trajectoryId>
const activeTrajectories: Map<string, Map<string, TrajectoryID>> = new Map();

// Cross-chapter context managers by session ID
// Provides dissertation-wide context for writing agents
const dissertationContextManagers: Map<string, DissertationContextManager> = new Map();

// Quality gauntlets and provenance ledgers by session ID
// Enables iterative quality refinement for each chapter
const qualityGauntlets: Map<string, QualityGauntlet> = new Map();
const provenanceLedgers: Map<string, ProvenanceLedger> = new Map();

// Paragraph-level feedback integration by session ID
// Enables fine-grained style learning from user corrections
const feedbackIntegrations: Map<string, FeedbackIntegration> = new Map();

// ============================================================================
// PHD PIPELINE CONFIGURATION CONSTANTS (TASK-CONFIG-002)
// ============================================================================

/**
 * Expected total agent count from phd-pipeline-config.ts
 * Used for validation and progress calculations
 * IMPORTANT: This is 46 agents (not 43 from the old incorrect mapping)
 */
const PHD_PIPELINE_AGENT_COUNT = getTotalAgentCount(); // 46 agents

/**
 * Validate pipeline configuration at module load
 * Ensures PHD_AGENTS and PHD_PHASES are consistent
 */
try {
  validateConfiguration();
  // Log validation success to stderr (not stdout to avoid JSON parsing issues)
  if (process.env.PHD_CLI_DEBUG) {
    console.error(`[PHD-CLI] Pipeline configuration validated: ${PHD_PIPELINE_AGENT_COUNT} agents across ${PHD_PHASES.length} phases`);
  }
} catch (configError) {
  // Configuration validation failed - this is a critical error
  console.error(`[PHD-CLI] CRITICAL: Pipeline configuration validation failed: ${configError}`);
  // Don't exit here - let the CLI continue and fail gracefully if needed
}

// ============================================================================
// TASK-CLI-004: MEMORY INTEGRATION HELPERS
// ============================================================================
// Implements RULE-021: Session must persist to `.phd-sessions/` and support resume
// Implements RULE-025: Memory syntax with positional format for claude-flow
// Memory operations use `npx claude-flow memory` commands

/**
 * Store data to claude-flow memory system.
 * Non-blocking operation - errors are logged but don't fail the pipeline.
 *
 * @param key - Memory key (e.g., 'session/{sessionId}', 'research/agent/output')
 * @param value - JSON-serializable value to store
 * @param namespace - Memory namespace (default: 'project/research')
 * @returns Promise<boolean> - true if stored successfully
 *
 * Implements RULE-025: Uses positional format for memory operations
 */
async function storeToMemory(
  key: string,
  value: unknown,
  namespace: string = DEFAULT_CONFIG.memoryNamespace
): Promise<boolean> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const jsonValue = JSON.stringify(value);
    // Escape single quotes in JSON for shell safety
    const escapedValue = jsonValue.replace(/'/g, "'\\''");

    const command = `npx claude-flow memory store "${key}" '${escapedValue}' --namespace "${namespace}"`;

    if (process.env.PHD_CLI_DEBUG) {
      console.error(`[MEMORY] Storing: ${key} (${jsonValue.length} bytes)`);
    }

    await execAsync(command, {
      timeout: 10000, // 10 second timeout
      cwd: process.cwd(),
    });

    if (process.env.PHD_CLI_DEBUG) {
      console.error(`[MEMORY] Stored successfully: ${key}`);
    }

    return true;
  } catch (error) {
    // Non-blocking - log but don't fail
    console.error(`[MEMORY] Failed to store ${key}: ${error}`);
    return false;
  }
}

/**
 * Retrieve data from claude-flow memory system.
 *
 * @param key - Memory key to retrieve
 * @param namespace - Memory namespace (default: 'project/research')
 * @returns Promise<unknown | null> - Retrieved value or null if not found
 */
async function retrieveFromMemory(
  key: string,
  namespace: string = DEFAULT_CONFIG.memoryNamespace
): Promise<unknown | null> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const command = `npx claude-flow memory retrieve "${key}" --namespace "${namespace}"`;

    const { stdout } = await execAsync(command, {
      timeout: 10000,
      cwd: process.cwd(),
    });

    if (!stdout || stdout.trim() === '') {
      return null;
    }

    return JSON.parse(stdout.trim());
  } catch (error) {
    // Not found or error - return null
    if (process.env.PHD_CLI_DEBUG) {
      console.error(`[MEMORY] Failed to retrieve ${key}: ${error}`);
    }
    return null;
  }
}

/**
 * Build session state object for memory storage.
 * Creates a SessionState-compatible object from PipelineSession.
 *
 * @param session - Pipeline session from SessionManager
 * @returns SessionState for memory storage
 */
function buildSessionStateForMemory(session: {
  sessionId: string;
  query: string;
  currentPhase: number;
  currentAgentIndex: number;
  completedAgents: string[];
  startTime: number;
  lastActivityTime: number;
  status: string;
  dataSourceMode?: 'external' | 'local' | 'hybrid';

}): PhdSessionState {
  return {
    sessionId: session.sessionId,
    topic: session.query,
    dataSourceMode: session.dataSourceMode,
    currentPhase: session.currentPhase,
    currentAgentIndex: session.currentAgentIndex,
    completedAgents: [...session.completedAgents],
    startedAt: new Date(session.startTime).toISOString(),
    lastActivityAt: new Date(session.lastActivityTime).toISOString(),
    status: session.status as PhdSessionState['status'],
  };
}

// ============================================================================
// CROSS-CHAPTER CONTEXT MANAGEMENT HELPERS
// ============================================================================
// Implements cross-chapter context threading for dissertation coherence
// Tracks arguments, forward references, and term definitions across chapters

/**
 * Get or create a DissertationContextManager for a session.
 * Manages cross-chapter context for dissertation coherence.
 *
 * @param sessionId - The session ID
 * @param storagePath - Path to session storage directory
 * @param title - Dissertation title (used when creating new manager)
 * @returns DissertationContextManager instance
 */
async function getOrCreateContextManager(
  sessionId: string,
  storagePath: string,
  title: string = 'Untitled Dissertation'
): Promise<DissertationContextManager> {
  let manager = dissertationContextManagers.get(sessionId);

  if (!manager) {
    manager = new DissertationContextManager(sessionId, storagePath, title);
    // Try to load existing context
    await manager.load().catch(() => {
      // INTENTIONAL: No existing context file is expected on first run
    });
    dissertationContextManagers.set(sessionId, manager);
  }

  return manager;
}

/**
 * Record chapter completion and extract context.
 * Called after each chapter is written to track cross-chapter coherence.
 *
 * @param sessionId - The session ID
 * @param chapterNumber - Chapter number that was completed
 * @param chapterText - Full text of the completed chapter
 * @param chapterTitle - Optional chapter title
 */
async function recordChapterCompletion(
  sessionId: string,
  chapterNumber: number,
  chapterText: string,
  chapterTitle?: string
): Promise<void> {
  const manager = dissertationContextManagers.get(sessionId);
  if (!manager) {
    if (process.env.PHD_CLI_DEBUG) {
      console.error(`[CONTEXT] No context manager found for session ${sessionId}`);
    }
    return;
  }

  try {
    await manager.onChapterComplete(chapterNumber, chapterText, chapterTitle);
    if (process.env.PHD_CLI_DEBUG) {
      console.error(`[CONTEXT] Chapter ${chapterNumber} context extracted and stored`);
    }
  } catch (error) {
    console.error(`[CONTEXT] Failed to record chapter ${chapterNumber} context: ${error}`);
  }
}

/**
 * Build context prompt for a writing agent.
 * Provides prior chapter context, argument threads, and forward reference promises.
 *
 * @param sessionId - The session ID
 * @param chapterNumber - Chapter being written
 * @returns Context string to inject into agent prompt, or empty string if unavailable
 */
function buildChapterContextPrompt(
  sessionId: string,
  chapterNumber: number
): string {
  const manager = dissertationContextManagers.get(sessionId);
  if (!manager) {
    return '';
  }

  try {
    return manager.buildContextForChapter(chapterNumber, {
      includeSummaries: true,
      includeThreadStatus: true,
      includeGlossary: true,
      includeForwardPromises: true,
      maxLength: 12000, // Keep context reasonable for token budget
    });
  } catch (error) {
    console.error(`[CONTEXT] Failed to build context for chapter ${chapterNumber}: ${error}`);
    return '';
  }
}

/**
 * Validate dissertation consistency across all chapters.
 * Called after all chapters are written to check for coherence issues.
 *
 * @param sessionId - The session ID
 * @returns Validation report or null if manager not found
 */
async function validateDissertationCoherence(
  sessionId: string
): Promise<DissertationValidationReport | null> {
  const manager = dissertationContextManagers.get(sessionId);
  if (!manager) {
    return null;
  }

  try {
    const report = manager.validateDissertationConsistency();

    // Log summary
    if (process.env.PHD_CLI_DEBUG || !report.valid) {
      console.error(`[CONTEXT] Dissertation validation: ${report.valid ? 'PASSED' : 'FAILED'}`);
      console.error(`[CONTEXT] Total issues: ${report.totalIssues}`);
      console.error(`[CONTEXT] Coherence score: ${(report.coherenceScore * 100).toFixed(0)}%`);

      if (report.recommendations.length > 0) {
        console.error('[CONTEXT] Recommendations:');
        for (const rec of report.recommendations) {
          console.error(`  - ${rec}`);
        }
      }
    }

    return report;
  } catch (error) {
    console.error(`[CONTEXT] Failed to validate dissertation: ${error}`);
    return null;
  }
}

/**
 * Set the main thesis for dissertation context tracking.
 *
 * @param sessionId - The session ID
 * @param thesis - The main thesis statement
 */
function setMainThesis(sessionId: string, thesis: string): void {
  const manager = dissertationContextManagers.get(sessionId);
  if (manager) {
    manager.setMainThesis(thesis);
  }
}

/**
 * Clean up context manager for a session (e.g., on session abort or completion).
 *
 * @param sessionId - The session ID
 */
function cleanupContextManager(sessionId: string): void {
  dissertationContextManagers.delete(sessionId);
}

// ============================================================================
// QUALITY GAUNTLET INTEGRATION - Multi-Pass Quality Assurance
// ============================================================================

/**
 * Initialize quality gauntlet and provenance ledger for a session.
 * Called during session initialization for PhD pipeline.
 *
 * @param sessionId - The session ID
 */
function initializeQualityGauntlet(sessionId: string): void {
  if (!qualityGauntlets.has(sessionId)) {
    qualityGauntlets.set(sessionId, createDefaultGauntlet());
    provenanceLedgers.set(sessionId, new ProvenanceLedger());

    if (process.env.PHD_CLI_DEBUG) {
      console.error(`[QUALITY] Quality gauntlet initialized for session ${sessionId}`);
    }
  }
}

/**
 * Run quality gauntlet on completed chapter text.
 * Returns quality assessment and determines if revision is needed.
 *
 * @param sessionId - The session ID
 * @param chapterNumber - Chapter number (1-indexed)
 * @param chapterText - Full text of the chapter
 * @param styleProfile - Optional style profile for consistency checking
 * @returns Gauntlet result with quality metrics and issues
 */
async function runChapterQualityGauntlet(
  sessionId: string,
  chapterNumber: number,
  chapterText: string,
  styleProfile?: unknown
): Promise<GauntletResult | null> {
  const gauntlet = qualityGauntlets.get(sessionId);
  if (!gauntlet) {
    if (process.env.PHD_CLI_DEBUG) {
      console.error(`[QUALITY] No gauntlet found for session ${sessionId}`);
    }
    return null;
  }

  const ledger = provenanceLedgers.get(sessionId);

  try {
    const result = await gauntlet.runGauntlet(chapterText, chapterNumber, {
      styleProfile,
      provenanceLedger: ledger,
    });

    // Log quality summary
    if (process.env.PHD_CLI_DEBUG || !result.passed) {
      console.error(`[QUALITY] Chapter ${chapterNumber} evaluation:`);
      console.error(`  Overall score: ${(result.overallScore * 100).toFixed(1)}%`);
      console.error(`  Passed: ${result.passed}`);
      console.error(`  Issues: ${result.summary.totalIssues} (${result.summary.criticalCount} critical, ${result.summary.majorCount} major)`);

      if (result.stageResults.length > 0) {
        console.error('  Stage scores:');
        for (const stage of result.stageResults) {
          const status = stage.passed ? 'PASS' : 'FAIL';
          console.error(`    - ${stage.stageName}: ${(stage.score * 100).toFixed(1)}% [${status}]`);
        }
      }
    }

    // Track provenance for claims detected in the chapter
    if (ledger) {
      const claims = ledger.detectClaims(chapterText);
      for (const claim of claims) {
        if (claim.needsCitation) {
          ledger.addEntry({
            claimText: claim.text,
            chapterId: chapterNumber,
            paragraphIndex: claim.paragraphIndex,
            sourceType: 'ungrounded', // Will be updated when citations are verified
            sourceId: '',
            sourceReference: '',
            confidence: 0,
            verified: false,
          });
        }
      }
    }

    return result;
  } catch (error) {
    console.error(`[QUALITY] Failed to evaluate chapter ${chapterNumber}: ${error}`);
    return null;
  }
}

// ============================================================================
// TASK-EMBED-HEALTH-001: EMBEDDING SERVICE HEALTH CHECK
// ============================================================================
// DESC episodic memory requires the embedding service at localhost:8000
// This health check warns users early if the service is unavailable

/**
 * Check if the embedding service is available at localhost:8000
 *
 * TASK-EMBED-HEALTH-001: Startup health check for embedding service.
 * DESC episodic memory requires the embedding service to function.
 *
 * @returns Promise<boolean> true if service is available
 */
async function checkEmbeddingServiceHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const response = await fetch('http://localhost:8000/', {
      signal: controller.signal,
      method: 'GET',
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      // api-embedder2.py returns {status: "online", model: "...", database_items: N}
      return data.status === 'online';
    }
    return false;
  } catch {
    // Network error, timeout, or service not running
    return false;
  }
}

/**
 * Determine if chapter text needs revision based on quality gauntlet results.
 * Uses configurable thresholds and considers critical issues.
 *
 * @param result - Gauntlet result from quality evaluation
 * @returns True if revision is needed
 */
function needsRevision(result: GauntletResult): boolean {
  // Always revise if there are critical issues
  if (result.summary.criticalCount > 0) {
    return true;
  }

  // Check overall threshold (default 80%)
  if (!result.passed) {
    return true;
  }

  // Check for too many major issues
  if (result.summary.majorCount > 10) {
    return true;
  }

  return false;
}

/**
 * Get revision guidance for a chapter based on quality issues.
 *
 * @param sessionId - The session ID
 * @param result - Gauntlet result from quality evaluation
 * @returns Revision guidance string
 */
function getChapterRevisionGuidance(
  _sessionId: string,
  result: GauntletResult
): string {
  return result.revisionGuidance;
}

/**
 * Get provenance audit report for the session.
 *
 * @param sessionId - The session ID
 * @returns Audit report string
 */
function getProvenanceAuditReport(sessionId: string): string {
  const ledger = provenanceLedgers.get(sessionId);
  if (!ledger) {
    return 'No provenance ledger found for this session.';
  }

  return ledger.generateAuditReport();
}

/**
 * Save quality artifacts for a session to disk.
 *
 * @param sessionId - The session ID
 * @param basePath - Base path for session storage
 */
async function saveQualityArtifacts(sessionId: string, basePath: string): Promise<void> {
  const ledger = provenanceLedgers.get(sessionId);
  if (ledger) {
    const ledgerPath = path.join(basePath, `.phd-sessions/${sessionId}/provenance-ledger.json`);
    await ledger.save(ledgerPath);

    if (process.env.PHD_CLI_DEBUG) {
      console.error(`[QUALITY] Provenance ledger saved: ${ledgerPath}`);
    }
  }
}

/**
 * Load quality artifacts for a session from disk.
 *
 * @param sessionId - The session ID
 * @param basePath - Base path for session storage
 */
async function loadQualityArtifacts(sessionId: string, basePath: string): Promise<void> {
  // Initialize gauntlet if not exists
  initializeQualityGauntlet(sessionId);

  const ledger = provenanceLedgers.get(sessionId);
  if (ledger) {
    const ledgerPath = path.join(basePath, `.phd-sessions/${sessionId}/provenance-ledger.json`);
    try {
      await ledger.load(ledgerPath);

      if (process.env.PHD_CLI_DEBUG) {
        console.error(`[QUALITY] Provenance ledger loaded: ${ledgerPath}`);
      }
    } catch {
      // File may not exist yet
    }
  }
}

/**
 * Clean up quality artifacts for a session.
 *
 * @param sessionId - The session ID
 */
function cleanupQualityArtifacts(sessionId: string): void {
  qualityGauntlets.delete(sessionId);
  provenanceLedgers.delete(sessionId);
}

/**
 * Display embedding service health warning if service is unavailable
 *
 * TASK-EMBED-HEALTH-001: Clear warning message with fix instructions.
 * Uses ANSI colors for visibility in terminal.
 *
 * @param verbose - Whether to display verbose output
 * @returns Promise<{ available: boolean; warned: boolean }> Health check result
 */
async function checkAndWarnEmbeddingService(verbose: boolean): Promise<{ available: boolean; warned: boolean }> {
  const isAvailable = await checkEmbeddingServiceHealth();

  if (!isAvailable) {
    console.error('\n\x1b[33m========================================\x1b[0m');
    console.error('\x1b[33m  WARNING: Embedding Service Unavailable\x1b[0m');
    console.error('\x1b[33m========================================\x1b[0m');
    console.error('\x1b[31mEmbedding service not running at localhost:8000\x1b[0m');
    console.error('DESC episodic memory will NOT work.');
    console.error('PhD Pipeline agents will not have access to learned patterns.');
    console.error('');
    console.error('To start the embedding service:');
    console.error('  \x1b[36m./embedding-api/api-embed.sh start\x1b[0m');
    console.error('');
    console.error('To check status:');
    console.error('  \x1b[36m./embedding-api/api-embed.sh status\x1b[0m');
    console.error('\x1b[33m========================================\x1b[0m\n');
    return { available: false, warned: true };
  }

  if (verbose) {
    console.error('[PHD-CLI] Embedding service: online');
  }

  return { available: true, warned: false };
}

// ============================================================================
// TASK-CLI-001: AGENT FILE VALIDATION
// ============================================================================
// Implements RULE-018: Agent Key Validity - all agent keys must have corresponding .md files
// Implements RULE-001: Complete implementation with proper error handling
// Implements RULE-005: Actionable error messages (what failed, why, how to fix)

/**
 * Result of agent file validation.
 * Contains detailed information about which agent files exist and which are missing.
 */
export interface AgentValidationResult {
  /** Whether all agent files passed validation */
  valid: boolean;
  /** Total number of agents in PHD_AGENTS configuration */
  totalAgents: number;
  /** Number of agent files found on disk */
  foundAgents: number;
  /** Agent keys whose .md files are missing */
  missingAgents: string[];
  /** Agent keys whose .md files exist but are empty or malformed */
  invalidAgents: string[];
  /** Directory where agent files are expected */
  agentsDirectory: string;
  /** Detailed error messages for each issue */
  errors: string[];
}

/**
 * Validate that all 46 agent .md files exist in the agents directory.
 * Implements RULE-018: Agent Key Validity - all agent keys must have corresponding .md files.
 *
 * @returns Promise<AgentValidationResult> - Detailed validation results
 *
 * Validation checks:
 * 1. Each agent in PHD_AGENTS has a corresponding .md file at ${DEFAULT_CONFIG.agentsDirectory}/${agent.file}
 * 2. Each .md file is non-empty (at least 100 bytes - reasonable minimum for agent definition)
 * 3. Each .md file contains valid content (starts with # or ---)
 *
 * @example
 * const result = await validateAgentFiles();
 * if (!result.valid) {
 *   console.error('Missing agents:', result.missingAgents);
 *   process.exit(1);
 * }
 */

// ============================================================================
// PHASE 9 (REPORT / ANSWER) INTEGRATION HELPERS
// ============================================================================
// Local mode: always run REPORT + ANSWER (single-shot)
// Hybrid mode: run REPORT first; ANSWER optional depending on coverage
// External mode: no Phase 9 execution here (preserve legacy behavior)

type Phase9CoverageGrade = "NONE" | "LOW" | "MED" | "HIGH";

function safeJsonParse<T = unknown>(s: string, context: string): T {
  try {
    return JSON.parse(s) as T;
  } catch (e) {
    throw new Error(`[PHASE9] Failed to parse JSON from ${context}: ${(e as Error).message}`);
  }
}

async function execFileJson(
  executable: string,
  args: string[],
  opts: { cwd: string; timeoutMs: number }
): Promise<unknown> {
  const { execFile } = await import("child_process");
  const { promisify } = await import("util");
  const execFileAsync = promisify(execFile);

  const { stdout } = await execFileAsync(executable, args, {
    cwd: opts.cwd,
    timeout: opts.timeoutMs,
    maxBuffer: 50 * 1024 * 1024, // guard for large JSON
  });

  if (!stdout || stdout.trim() === "") {
    throw new Error(`[PHASE9] No stdout returned from ${executable} ${args.join(" ")}`);
  }
  return safeJsonParse(stdout.trim(), `${path.basename(args[0] || "")}`);
}

function phase9DirForSession(session: { researchDir?: string; slug?: string; query: string }): string {
  const slug = session.slug || generateSlug(session.query);
  const researchDir = session.researchDir || path.join(process.cwd(), "docs/research", slug);
  return path.join(researchDir, "phase9");
}

async function writeJsonArtifact(filePath: string, obj: unknown): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(obj, null, 2), "utf-8");
}

function getCoverageGrade(reportJson: any): Phase9CoverageGrade {
  const g = reportJson?.coverage_summary?.coverage_grade;
  if (g === "NONE" || g === "LOW" || g === "MED" || g === "HIGH") return g;
  // Safe fallback if schema changes
  return "LOW";
}

async function runPhase9Report(query: string): Promise<unknown> {
  const repoRoot = process.cwd();
  const script = path.join(repoRoot, "scripts", "interaction", "report.py");
  return execFileJson("python3", [script, "--query", query, "--format", "json"], { cwd: repoRoot, timeoutMs: 120_000 });
}

async function runPhase9Answer(query: string): Promise<unknown> {
  const repoRoot = process.cwd();
  const script = path.join(repoRoot, "scripts", "interaction", "answer.py");
  return execFileJson("python3", [script, "--query", query, "--format", "json"], { cwd: repoRoot, timeoutMs: 180_000 });
}

function buildHybridPolicyBlock(args: {
  sessionId: string;
  slug: string;
  reportPath: string;
  answerPath?: string;
  coverage: Phase9CoverageGrade;
  queryIntent?: QueryIntent;
}): string {
  const { sessionId, slug, reportPath, answerPath, coverage, queryIntent } = args;

  // GAP-H03: Determine if external tools are allowed based on coverage OR query intent
  const lowCoverage = (coverage === "LOW" || coverage === "NONE");
  const intentTriggered = queryIntent?.recencyRequired ||
    (queryIntent?.outsideCorpusDomains && queryIntent.outsideCorpusDomains.length > 0);
  const allowExternal = lowCoverage || intentTriggered;

  // Build explanation text
  let allowExternalText: string;
  if (lowCoverage) {
    allowExternalText = "External tools are permitted because local coverage is LOW/NONE.";
  } else if (intentTriggered) {
    const reasons: string[] = [];
    if (queryIntent?.recencyRequired) {
      const markers = queryIntent.temporalMarkers?.length
        ? `(detected: ${queryIntent.temporalMarkers.join(', ')})`
        : '';
      reasons.push(`recency requirement ${markers}`);
    }
    if (queryIntent?.outsideCorpusDomains?.length) {
      reasons.push(`outside-corpus domains (${queryIntent.outsideCorpusDomains.join(', ')})`);
    }
    allowExternalText = `External tools are permitted despite HIGH coverage due to: ${reasons.join('; ')}.`;
  } else {
    allowExternalText = "External tools are NOT permitted unless you can justify recency/outside-corpus needs.";
  }

  return [
    "",
    "## MODE POLICY (hybrid: local-first)",
    `- Session: ${sessionId}`,
    `- Topic slug: ${slug}`,
    `- Phase 9 local REPORT coverage: ${coverage}`,
    `- Local artifacts:`,
    `  - report: ${reportPath}`,
    answerPath ? `  - answer: ${answerPath}` : `  - answer: (not generated; coverage too low or deferred)`,
    "",
    "### Hard rules",
    "- You MUST consult the local REPORT first and treat it as authoritative for what exists in the corpus.",
    `- ${allowExternalText}`,
    "- If you use any external material, you MUST label it as external provenance (URL/source) and separate it from local provenance.",
    "",
    "### Fallback trigger (external)",
    "- Only use external sources if:",
    "  - coverage is LOW or NONE, OR",
    "  - the query requires recency/current events, OR",
    "  - the user explicitly requests outside-corpus material.",
    "",
  ].join("\n");
}


async function validateAgentFiles(): Promise<AgentValidationResult> {
  const fs = await import('fs/promises');
  const pathModule = await import('path');

  const result: AgentValidationResult = {
    valid: true,
    totalAgents: PHD_AGENTS.length,
    foundAgents: 0,
    missingAgents: [],
    invalidAgents: [],
    agentsDirectory: DEFAULT_CONFIG.agentsDirectory,
    errors: [],
  };

  // Resolve agents directory relative to project root
  const agentsDir = pathModule.resolve(process.cwd(), DEFAULT_CONFIG.agentsDirectory);

  // Check if agents directory exists
  try {
    const dirStat = await fs.stat(agentsDir);
    if (!dirStat.isDirectory()) {
      result.valid = false;
      result.errors.push(
        `[RULE-018] Agents path exists but is not a directory: ${agentsDir}. ` +
        `Expected a directory containing ${PHD_AGENTS.length} agent .md files.`
      );
      return result;
    }
  } catch (err) {
    result.valid = false;
    result.errors.push(
      `[RULE-018] Agents directory not found: ${agentsDir}. ` +
      `Create the directory and add agent .md files, or verify the path in DEFAULT_CONFIG.agentsDirectory.`
    );
    return result;
  }

  // Validate each agent file
  for (const agent of PHD_AGENTS) {
    const filePath = pathModule.join(agentsDir, agent.file);

    try {
      const stat = await fs.stat(filePath);

      if (!stat.isFile()) {
        result.invalidAgents.push(agent.key);
        result.errors.push(
          `[RULE-018] Agent "${agent.key}": Path exists but is not a file: ${filePath}`
        );
        continue;
      }

      // Check file size - agent files should have meaningful content
      const MIN_AGENT_FILE_SIZE = 100; // bytes - reasonable minimum for agent definition
      if (stat.size < MIN_AGENT_FILE_SIZE) {
        result.invalidAgents.push(agent.key);
        result.errors.push(
          `[RULE-018] Agent "${agent.key}": File is too small (${stat.size} bytes). ` +
          `Expected at least ${MIN_AGENT_FILE_SIZE} bytes for a valid agent definition. ` +
          `File: ${filePath}`
        );
        continue;
      }

      // Read first 256 bytes to validate content structure
      const handle = await fs.open(filePath, 'r');
      const buffer = Buffer.alloc(256);
      await handle.read(buffer, 0, 256, 0);
      await handle.close();

      const header = buffer.toString('utf-8').trim();

      // Agent files should start with markdown heading or YAML frontmatter
      if (!header.startsWith('#') && !header.startsWith('---')) {
        result.invalidAgents.push(agent.key);
        result.errors.push(
          `[RULE-018] Agent "${agent.key}": File does not start with valid markdown (# heading) ` +
          `or YAML frontmatter (---). File may be corrupted or have incorrect format. ` +
          `File: ${filePath}`
        );
        continue;
      }

      // File passed all checks
      result.foundAgents++;

    } catch (err) {
      // File does not exist
      result.missingAgents.push(agent.key);
      result.errors.push(
        `[RULE-018] Agent "${agent.key}": File not found at expected path: ${filePath}. ` +
        `Create the file or update the agent.file property in PHD_AGENTS configuration.`
      );
    }
  }

  // Set overall validity
  if (result.missingAgents.length > 0 || result.invalidAgents.length > 0) {
    result.valid = false;
  }

  return result;
}

// ============================================================================
// TASK-CLI-002: BUILD AGENT PROMPT FUNCTIONS
// ============================================================================
// Implements RULE-020: Complete 5-part prompts for PhD Pipeline subagents
// Implements RULE-012: TASK COMPLETION SUMMARY format
// Implements RULE-013: Workflow context with Agent #N/46, Previous, Next
// Implements RULE-025: Memory syntax with positional format
// Implements RULE-010: Single Responsibility - each helper under 50 lines

/**
 * Result of building an agent prompt with the 5-part template.
 * Contains the complete prompt along with metadata for tracing.
 */
export interface PromptBuildResult {
  /** The complete 5-part prompt string */
  prompt: string;
  /** Agent key (e.g., 'self-ask-decomposer') */
  agentKey: string;
  /** Human-readable agent name */
  agentDisplayName: string;
  /** Phase number (1-7) */
  phase: number;
  /** Memory keys to retrieve from previous agents */
  memoryRetrievalKeys: string[];
  /** Memory key to store this agent's output */
  memoryStorageKey: string;
  /** Word count of the generated prompt */
  wordCount: number;
}

/**
 * Extended session interface for prompt building operations.
 * Includes topic and session details needed for prompt generation.
 */
interface IPromptBuildSession {
  sessionId: string;
  query: string;
  currentPhase: number;
  currentAgentIndex: number;
  completedAgents: string[];
  dynamicPhase6Agents?: Array<{ key: string; phase: number }>;
  dynamicTotalAgents?: number;
}

/**
 * Phase 9 report data structure for injection into agent prompts.
 * GAP-A03: Enables agents to make informed decisions about local vs external sources.
 */
interface Phase9ReportData {
  coverage_summary?: {
    coverage_grade?: string;
    gaps?: string[];
  };
  retrieval?: {
    stats?: {
      n_returned?: number;
      distinct_docs?: number;
    };
  };
  knowledge_units?: {
    hits?: unknown[];
  };
  reasoning_edges?: {
    stats?: {
      n_hits?: number;
    };
  };
}

/**
 * Build the YOUR TASK section of the 5-part prompt.
 * Contains agent-specific task from the .md file with research context.
 *
 * GAP-A03: Now includes Phase 9 report injection for local/hybrid modes.
 *
 * @param agent - Agent configuration from PHD_AGENTS
 * @param session - Current pipeline session
 * @param agentFileContent - Content read from the agent's .md file
 * @param phase9Report - Optional Phase 9 report data for coverage context
 * @returns Formatted YOUR TASK section string
 *
 * Implements RULE-020: Section 1 of 5-part prompt
 */
function buildYourTaskSection(
  agent: PhdAgentConfig,
  session: IPromptBuildSession,
  agentFileContent: string,
  phase9Report?: Phase9ReportData
): string {
  let taskSection = `## YOUR TASK

${agentFileContent.trim()}

---
**Research Topic**: ${session.query}
**Session ID**: ${session.sessionId}
`;

  // GAP-A03: Inject Phase 9 coverage data for local/hybrid modes
  const dataSourceMode = (session as { dataSourceMode?: string }).dataSourceMode;
  if (phase9Report && dataSourceMode && dataSourceMode !== 'external') {
    const coverage = phase9Report.coverage_summary || {};
    const retrieval = phase9Report.retrieval?.stats || {};
    const kuHits = phase9Report.knowledge_units?.hits?.length || 0;
    const edgeHits = phase9Report.reasoning_edges?.stats?.n_hits || 0;
    const gaps = coverage.gaps || [];

    taskSection += `
---
## LOCAL CORPUS COVERAGE (Phase 9 REPORT)

| Metric | Value |
|--------|-------|
| Coverage Grade | **${coverage.coverage_grade || 'UNKNOWN'}** |
| Retrieved Chunks | ${retrieval.n_returned || 0} |
| Distinct Documents | ${retrieval.distinct_docs || 0} |
| Knowledge Units | ${kuHits} |
| Reasoning Edges | ${edgeHits} |

**Identified Gaps**:
${gaps.length > 0 ? gaps.map((g: string) => `- ${g}`).join('\n') : '- None identified'}

**Mode Policy**: ${dataSourceMode === 'local' ? 'LOCAL ONLY - No external tools permitted. Work exclusively with corpus data.' : 'HYBRID - External tools permitted with justification. Prefer local sources.'}
`;
  }

  return taskSection;
}

/**
 * Build the WORKFLOW CONTEXT section of the 5-part prompt.
 * Shows agent position, phase info, and adjacent agents.
 *
 * @param agent - Agent configuration from PHD_AGENTS
 * @param session - Current pipeline session
 * @param agentIndex - 0-based index of current agent
 * @returns Formatted WORKFLOW CONTEXT section string
 *
 * Implements RULE-013: Agent #N/46, Previous, Next format
 * Implements RULE-020: Section 2 of 5-part prompt
 */
function buildWorkflowContextSection(
  agent: PhdAgentConfig,
  session: IPromptBuildSession,
  agentIndex: number
): string {
  const totalAgents = session.dynamicTotalAgents || PHD_PIPELINE_AGENT_COUNT;
  const phase = PHD_PHASES.find(p => p.id === agent.phase);
  const phaseName = phase?.name || getPhaseName(agent.phase);

  // Get previous agent info
  let previousAgentInfo = 'None (First Agent)';
  if (agentIndex > 0) {
    const prevAgent = getConfigAgentByIndex(agentIndex - 1);
    if (prevAgent) {
      previousAgentInfo = `${prevAgent.displayName} (${prevAgent.key})`;
    }
  }

  // Get next agent info
  let nextAgentInfo = 'Final Agent - Proceed to Phase 8';
  if (agentIndex < totalAgents - 1) {
    const nextAgent = getConfigAgentByIndex(agentIndex + 1);
    if (nextAgent) {
      nextAgentInfo = `${nextAgent.displayName} (${nextAgent.key})`;
    }
  }

  const workflowSection = `## WORKFLOW CONTEXT

**Agent**: ${agent.displayName} (Agent #${agentIndex + 1}/${totalAgents})
**Phase**: ${phaseName} (Phase ${agent.phase}/7)
**Previous Agent**: ${previousAgentInfo}
**Next Agent**: ${nextAgentInfo}
`;

  return workflowSection;
}

/**
 * Build the MEMORY RETRIEVAL section of the 5-part prompt.
 * Lists commands to retrieve data from previous agents.
 *
 * @param agent - Agent configuration with memoryKeys
 * @returns Formatted MEMORY RETRIEVAL section string
 *
 * Implements RULE-025: Memory syntax with positional format
 * Implements RULE-020: Section 3 of 5-part prompt
 */
function buildMemoryRetrievalSection(agent: PhdAgentConfig): string {
  const namespace = DEFAULT_CONFIG.memoryNamespace;

  // Build retrieval commands for each memory key the agent depends on
  const retrievalCommands = agent.memoryKeys
    .map(key => `npx claude-flow memory retrieve "${key}" --namespace "${namespace}"`)
    .join('\n');

  const memorySection = `## MEMORY RETRIEVAL

Retrieve these keys from previous agents:
\`\`\`bash
${retrievalCommands || '# No memory dependencies for this agent'}
\`\`\`
`;

  return memorySection;
}

/**
 * Build the MEMORY STORAGE section of the 5-part prompt.
 * Shows the command to store this agent's outputs.
 *
 * @param agent - Agent configuration with memoryKeys
 * @returns Formatted MEMORY STORAGE section string
 *
 * Implements RULE-025: Memory syntax with positional format
 * Implements RULE-020: Section 4 of 5-part prompt
 */
function buildMemoryStorageSection(agent: PhdAgentConfig): string {
  const namespace = DEFAULT_CONFIG.memoryNamespace;
  const storageKey = agent.memoryKeys[0] || `research/output/${agent.key}`;

  const storageSection = `## MEMORY STORAGE

Store your outputs to:
\`\`\`bash
npx claude-flow memory store "${storageKey}" '<your-json-output>' --namespace "${namespace}"
\`\`\`

**Expected Outputs**: ${agent.outputArtifacts.join(', ') || 'No specific artifacts'}
`;

  return storageSection;
}

/**
 * Build the TASK COMPLETION SUMMARY section of the 5-part prompt.
 * Defines the required output format for agent completion.
 *
 * @param agent - Agent configuration
 * @param session - Current pipeline session
 * @param nextAgentKey - Key of the next agent (or completion message)
 * @returns Formatted TASK COMPLETION SUMMARY section string
 *
 * Implements RULE-012: TASK COMPLETION SUMMARY format exactly as specified
 * Implements RULE-020: Section 5 of 5-part prompt
 */
function buildCompletionSummarySection(
  agent: PhdAgentConfig,
  session: IPromptBuildSession,
  nextAgentKey: string
): string {
  const completionSection = `## TASK COMPLETION SUMMARY

When complete, output:
\`\`\`
=== TASK COMPLETION SUMMARY ===
Agent: ${agent.key}
Status: COMPLETE | BLOCKED
Phase: ${agent.phase}
Session: ${session.sessionId}

**What I Did**: [1-2 sentence summary of work completed]

**Files Created/Modified**:
- \`path/to/file\` - Brief description

**Key Findings**: [If applicable - important discoveries or decisions made]

**Memory Stored**: ${agent.memoryKeys[0] || `research/output/${agent.key}`}

**Next Agent Guidance**: [Brief hint for ${nextAgentKey} about context they need]
=== END SUMMARY ===
\`\`\`
`;

  return completionSection;
}

/**
 * Build complete 5-part prompt for a PhD Pipeline agent.
 * Assembles all sections per RULE-020 Constitution compliance.
 *
 * @param agent - Agent configuration from PHD_AGENTS
 * @param session - Current pipeline session with topic and state
 * @param agentFileContent - Content read from agent's .md file
 * @returns PromptBuildResult with complete prompt and metadata
 *
 * Implements RULE-020: All 5 required sections must be present
 * Implements RULE-010: Single Responsibility - orchestrates helpers
 *
 * @example
 * const result = await buildAgentPrompt(agent, session, fileContent);
 * console.log(result.prompt);
 * console.log(`Word count: ${result.wordCount}`);
 */
async function buildAgentPrompt(
  agent: PhdAgentConfig,
  session: IPromptBuildSession,
  agentFileContent: string,
  phase9Report?: Phase9ReportData
): Promise<PromptBuildResult> {
  // Get agent index for workflow context
  const agentIndex = getConfigAgentIndex(agent.key);
  const totalAgents = session.dynamicTotalAgents || PHD_PIPELINE_AGENT_COUNT;

  // Determine next agent key for completion section
  let nextAgentKey = 'Phase 8 Orchestration';
  if (agentIndex < totalAgents - 1) {
    const nextAgent = getConfigAgentByIndex(agentIndex + 1);
    if (nextAgent) {
      nextAgentKey = nextAgent.key;
    }
  }

  // GAP-A03: Build all 5 sections per RULE-020, passing phase9Report for coverage injection
  const yourTaskSection = buildYourTaskSection(agent, session, agentFileContent, phase9Report);
  const workflowContextSection = buildWorkflowContextSection(agent, session, agentIndex);
  const memoryRetrievalSection = buildMemoryRetrievalSection(agent);
  const memoryStorageSection = buildMemoryStorageSection(agent);
  const completionSummarySection = buildCompletionSummarySection(agent, session, nextAgentKey);

  // Assemble complete prompt
  const completePrompt = [
    yourTaskSection,
    workflowContextSection,
    memoryRetrievalSection,
    memoryStorageSection,
    completionSummarySection,
  ].join('\n---\n\n');

  // Calculate word count
  const wordCount = completePrompt.split(/\s+/).filter(word => word.length > 0).length;

  // Build result with metadata
  const result: PromptBuildResult = {
    prompt: completePrompt,
    agentKey: agent.key,
    agentDisplayName: agent.displayName,
    phase: agent.phase,
    memoryRetrievalKeys: [...agent.memoryKeys],
    memoryStorageKey: agent.memoryKeys[0] || `research/output/${agent.key}`,
    wordCount,
  };

  return result;
}

// ============================================================================
// TASK-CLI-003: GET NEXT AGENT FUNCTION
// ============================================================================
// Implements RULE-015: 99.9% Sequential execution - only return next agent in sequence
// Implements RULE-005: Actionable error messages (what failed, why, how to fix)
// Implements RULE-001: Complete implementation with proper error handling

/**
 * Result of getting the next agent in the pipeline.
 * Contains complete agent configuration, generated prompt, and metadata.
 *
 * This is the canonical return type for getNextAgent() and provides
 * all information needed to execute the next agent step.
 */
export interface NextAgentResult {
  /** Agent configuration from PHD_AGENTS */
  agent: PhdAgentConfig;

  /** Complete 5-part prompt generated by buildAgentPrompt() */
  prompt: string;

  /** 0-based index of this agent in the pipeline (0-45 for 46 agents) */
  agentIndex: number;

  /** Total number of agents in the pipeline (46 for standard, may vary with dynamic Phase 6) */
  totalAgents: number;

  /** Phase definition for this agent's phase */
  phase: PhaseDefinition;

  /** True if this is the last agent in the pipeline */
  isLastAgent: boolean;

  /** Full path to the agent's .md file */
  agentFilePath: string;
}

/**
 * Error thrown when an agent file cannot be found.
 * Provides actionable error message per RULE-005.
 */
export class AgentFileNotFoundError extends Error {
  constructor(
    public readonly agentKey: string,
    public readonly filePath: string,
    public readonly agentsDirectory: string
  ) {
    super(
      `[RULE-018] Agent file not found for "${agentKey}". ` +
      `Expected file at: ${filePath}. ` +
      `To fix: Create the file at ${filePath} OR verify agent.file property in PHD_AGENTS configuration. ` +
      `Agents directory: ${agentsDirectory}`
    );
    this.name = 'AgentFileNotFoundError';
  }
}

/**
 * Error thrown when prompt building fails.
 * Wraps underlying error with context per RULE-005.
 */
export class PromptBuildError extends Error {
  constructor(
    public readonly agentKey: string,
    public readonly phase: number,
    public readonly cause: Error
  ) {
    super(
      `[RULE-020] Failed to build prompt for agent "${agentKey}" (Phase ${phase}). ` +
      `Cause: ${cause.message}. ` +
      `To debug: Check agent file content, session state, and memory configuration.`
    );
    this.name = 'PromptBuildError';
  }
}

/**
 * Get the next agent to execute in the PhD Pipeline.
 * Implements RULE-015: Sequential execution - only returns next agent in sequence.
 *
 * @param session - Current pipeline session with state
 * @param options - Optional configuration for verbose logging
 * @returns NextAgentResult with agent config and prompt, or null if pipeline complete
 *
 * @throws {AgentFileNotFoundError} If agent .md file doesn't exist (RULE-005)
 * @throws {PromptBuildError} If prompt building fails (RULE-005)
 *
 * Pipeline Completion:
 * - Returns null when session.currentAgentIndex >= PHD_AGENTS.length (46)
 * - This indicates Phase 7 is complete and Phase 8 finalization should begin
 *
 * @example
 * const result = await getNextAgent(session, { verbose: true });
 * if (result === null) {
 *   console.log('Pipeline complete - proceed to Phase 8');
 * } else {
 *   console.log(`Next agent: ${result.agent.displayName}`);
 *   console.log(`Prompt length: ${result.prompt.length} chars`);
 * }
 */
async function getNextAgent(
  session: IPhdSession,
  options: { verbose?: boolean } = {}
): Promise<NextAgentResult | null> {
  const fs = await import('fs/promises');
  const pathModule = await import('path');

  // Determine total agents (dynamic if available, else static 46)
  const totalAgents = session.dynamicTotalAgents || PHD_PIPELINE_AGENT_COUNT;

  // RULE-015: Sequential check - if index >= total, pipeline is complete
  if (session.currentAgentIndex >= totalAgents) {
    if (options.verbose) {
      console.error(`[getNextAgent] Pipeline complete: currentAgentIndex (${session.currentAgentIndex}) >= totalAgents (${totalAgents})`);
    }
    return null;
  }

  // Get current agent index
  const agentIndex = session.currentAgentIndex;

  // Handle dynamic Phase 6 agents vs static agents
  let agent: PhdAgentConfig;

  if (session.dynamicPhase6Agents && session.dynamicPhase6Agents.length > 0) {
    // Dynamic agent routing for Phase 6
    const phase6End = PHASE_6_START_INDEX + session.dynamicPhase6Agents.length - 1;

    if (agentIndex < PHASE_6_START_INDEX) {
      // Phase 1-5: use static agent from PHD_AGENTS
      const staticAgent = getConfigAgentByIndex(agentIndex);
      if (!staticAgent) {
        throw new Error(
          `[RULE-018] Invalid agent index ${agentIndex}. ` +
          `Expected index in range [0, ${PHASE_1_5_AGENT_COUNT - 1}] for Phases 1-5.`
        );
      }
      agent = staticAgent;
    } else if (agentIndex <= phase6End) {
      // Phase 6: use dynamic agent
      const phase6Index = agentIndex - PHASE_6_START_INDEX;
      const dynamicAgent = session.dynamicPhase6Agents[phase6Index];
      if (!dynamicAgent) {
        throw new Error(
          `[RULE-018] Invalid Phase 6 agent index ${phase6Index}. ` +
          `Expected index in range [0, ${session.dynamicPhase6Agents.length - 1}].`
        );
      }
      // Convert dynamic agent to PhdAgentConfig format
      agent = {
        key: dynamicAgent.key,
        displayName: dynamicAgent.key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
        phase: 6,
        file: `${dynamicAgent.key}.md`,
        memoryKeys: [`research/writing/${dynamicAgent.key}`],
        outputArtifacts: [`${dynamicAgent.key}.md`],
        toolDependency: {
          canRunLocalOnly: true,
          requiresExternalTools: false,
          externalToolsUsed: [],
          toolUsageNotes: 'Dynamic Phase 6 agent - writing only'
        }
      };
    } else {
      // Phase 7: map to static agents
      const phase7Offset = agentIndex - (phase6End + 1);
      const staticIndex = STATIC_PHASE_7_START_INDEX + phase7Offset;
      const staticAgent = getConfigAgentByIndex(staticIndex);
      if (!staticAgent) {
        throw new Error(
          `[RULE-018] Invalid Phase 7 agent index. Offset ${phase7Offset} from static index ${staticIndex} is out of bounds.`
        );
      }
      agent = staticAgent;
    }
  } else {
    // No dynamic agents - use standard PHD_AGENTS array
    const staticAgent = getConfigAgentByIndex(agentIndex);
    if (!staticAgent) {
      throw new Error(
        `[RULE-018] Invalid agent index ${agentIndex}. ` +
        `Expected index in range [0, ${PHD_PIPELINE_AGENT_COUNT - 1}].`
      );
    }
    agent = staticAgent;
  }

  if (options.verbose) {
    console.error(`[getNextAgent] Agent ${agentIndex + 1}/${totalAgents}: ${agent.key} (Phase ${agent.phase})`);
  }

  // Get phase definition
  const phase = getPhaseById(agent.phase);
  if (!phase) {
    throw new Error(
      `[RULE-019] Agent "${agent.key}" has invalid phase ${agent.phase}. ` +
      `Expected phase in range [1, 7]. Check PHD_AGENTS configuration.`
    );
  }

  // Build agent file path and read content
  const agentsDir = pathModule.resolve(process.cwd(), DEFAULT_CONFIG.agentsDirectory);
  const agentFilePath = pathModule.join(agentsDir, agent.file);

  let agentFileContent: string;
  try {
    agentFileContent = await fs.readFile(agentFilePath, 'utf-8');

    if (options.verbose) {
      console.error(`[getNextAgent] Read agent file: ${agentFilePath} (${agentFileContent.length} bytes)`);
    }
  } catch (err) {
    // RULE-005: Actionable error message
    throw new AgentFileNotFoundError(agent.key, agentFilePath, agentsDir);
  }

  // Build prompt session context
  const promptSession: IPromptBuildSession & { dataSourceMode?: string } = {
    sessionId: session.sessionId,
    query: (session as unknown as { query: string }).query || '',
    currentPhase: session.currentPhase,
    currentAgentIndex: session.currentAgentIndex,
    completedAgents: [...session.completedAgents],
    dynamicPhase6Agents: session.dynamicPhase6Agents,
    dynamicTotalAgents: session.dynamicTotalAgents,
    dataSourceMode: (session as unknown as { dataSourceMode?: string }).dataSourceMode,
  };

  // GAP-A03: Extract Phase 9 report data if available for local/hybrid modes
  const sessionWithPhase9 = session as unknown as { __phase9?: { report?: Phase9ReportData } };
  const phase9Report = sessionWithPhase9.__phase9?.report;

  // Build complete 5-part prompt using buildAgentPrompt
  let promptResult: PromptBuildResult;
  try {
    promptResult = await buildAgentPrompt(agent, promptSession, agentFileContent, phase9Report);

    if (options.verbose) {
      console.error(`[getNextAgent] Built prompt: ${promptResult.wordCount} words`);
    }
  } catch (err) {
    // RULE-005: Wrap error with context
    throw new PromptBuildError(agent.key, agent.phase, err instanceof Error ? err : new Error(String(err)));
  }

  // Calculate if this is the last agent
  const isLastAgent = agentIndex >= totalAgents - 1;

  if (options.verbose && isLastAgent) {
    console.error(`[getNextAgent] This is the LAST agent in the pipeline`);
  }

  // Return complete NextAgentResult
  return {
    agent,
    prompt: promptResult.prompt,
    agentIndex,
    totalAgents,
    phase,
    isLastAgent,
    agentFilePath,
  };
}

// ============================================================================
// TASK-CONFIG-003: PHASE VALIDATION FUNCTIONS
// ============================================================================
// Implements RULE-019: All 46 agents must be assigned to exactly one phase (1-7)
// Implements RULE-022: Phase N must complete before Phase N+1 begins
// Implements RULE-015: 99.9% sequential execution within phases

/**
 * Phase progress information returned by getPhaseProgress
 */
interface PhaseProgress {
  /** Number of agents completed in this phase */
  completed: number;
  /** Total number of agents in this phase */
  total: number;
  /** Percentage complete (0-100) */
  percentage: number;
  /** Array of completed agent keys in this phase */
  completedAgents: string[];
  /** Array of remaining agent keys in this phase */
  remainingAgents: string[];
}

/**
 * Extended session interface for phase-aware operations
 * Mirrors PipelineSession but typed for phase validation functions
 */
interface IPhdSession {
  sessionId: string;
  currentPhase: number;
  currentAgentIndex: number;
  completedAgents: string[];
  dynamicPhase6Agents?: Array<{ key: string; phase: number }>;
  dynamicTotalAgents?: number;
}

/**
 * Validate phase transition is allowed
 * Implements RULE-022: Phase N must complete before Phase N+1 begins
 *
 * @param currentPhase - Current phase number (1-7)
 * @param nextPhase - Target phase number to transition to
 * @returns true if transition is valid, false otherwise
 *
 * Valid transitions:
 * - Same phase (currentPhase === nextPhase): always allowed
 * - Next phase (nextPhase === currentPhase + 1): allowed (will be validated by isPhaseComplete)
 * - Skip phases (nextPhase > currentPhase + 1): NOT allowed (violates RULE-022)
 * - Previous phases (nextPhase < currentPhase): NOT allowed (no backward transitions)
 */
function validatePhaseTransition(currentPhase: number, nextPhase: number): boolean {
  // Validate phase ranges (1-7 for main phases, 8 for finalization)
  if (currentPhase < 1 || currentPhase > 8) {
    console.error(`[PHASE-VALIDATION] Invalid current phase: ${currentPhase}`);
    return false;
  }

  if (nextPhase < 1 || nextPhase > 8) {
    console.error(`[PHASE-VALIDATION] Invalid next phase: ${nextPhase}`);
    return false;
  }

  // Same phase transition is always valid
  if (currentPhase === nextPhase) {
    return true;
  }

  // Only allow forward transition by exactly one phase (RULE-022)
  if (nextPhase === currentPhase + 1) {
    return true;
  }

  // Disallow backward transitions and phase skipping
  if (nextPhase < currentPhase) {
    console.error(`[PHASE-VALIDATION] Backward transition not allowed: Phase ${currentPhase} -> ${nextPhase}`);
    return false;
  }

  if (nextPhase > currentPhase + 1) {
    console.error(`[PHASE-VALIDATION] Phase skipping not allowed (RULE-022): Phase ${currentPhase} -> ${nextPhase}`);
    return false;
  }

  return false;
}

/**
 * Check if all agents in a specific phase are complete
 * Implements RULE-022: Phase N must complete before Phase N+1 begins
 *
 * @param session - Pipeline session with completion state
 * @param phaseId - Phase number to check (1-7)
 * @returns true if all agents in the phase have completed
 */
function isPhaseComplete(session: IPhdSession, phaseId: number): boolean {
  // Validate phase ID
  if (phaseId < 1 || phaseId > 7) {
    console.error(`[PHASE-VALIDATION] Invalid phase ID: ${phaseId}`);
    return false;
  }

  // Get agents for the specified phase
  const phaseAgents = getCanonicalAgentsByPhase(phaseId);

  // Handle dynamic Phase 6 agents
  if (phaseId === 6 && session.dynamicPhase6Agents && session.dynamicPhase6Agents.length > 0) {
    // For dynamic Phase 6, check if all dynamic agents are completed
    const phase6AgentKeys = session.dynamicPhase6Agents.map(a => a.key);
    const completedSet = new Set(session.completedAgents);

    for (const agentKey of phase6AgentKeys) {
      if (!completedSet.has(agentKey)) {
        return false;
      }
    }
    return true;
  }

  // Check if all phase agents are in completedAgents
  const completedSet = new Set(session.completedAgents);

  for (const agent of phaseAgents) {
    if (!completedSet.has(agent.key)) {
      return false;
    }
  }

  return true;
}

/**
 * Get agent configurations for the current phase of a session
 * Supports both static (Phases 1-5, 7) and dynamic (Phase 6) agents
 *
 * @param session - Pipeline session with current phase info
 * @returns Array of AgentConfig objects for the current phase
 */
function getCurrentPhaseAgents(session: IPhdSession): PhdAgentConfig[] {
  const currentPhase = session.currentPhase;

  // Validate phase
  if (currentPhase < 1 || currentPhase > 7) {
    console.error(`[PHASE-VALIDATION] Invalid current phase: ${currentPhase}`);
    return [];
  }

  // Handle dynamic Phase 6 agents
  if (currentPhase === 6 && session.dynamicPhase6Agents && session.dynamicPhase6Agents.length > 0) {
    // Convert dynamic agents to PhdAgentConfig format
    return session.dynamicPhase6Agents.map((dynamicAgent) => ({
      key: dynamicAgent.key,
      displayName: dynamicAgent.key.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      phase: 6,
      file: `${dynamicAgent.key}.md`,
      memoryKeys: [`research/writing/${dynamicAgent.key}`],
      outputArtifacts: [`${dynamicAgent.key}.md`],
      toolDependency: {
        canRunLocalOnly: true,
        requiresExternalTools: false,
        externalToolsUsed: [],
        toolUsageNotes: 'Dynamic Phase 6 agent - writing only'
      }
    }));
  }

  // Get static agents for the phase
  const staticAgents = getCanonicalAgentsByPhase(currentPhase);

  // Convert readonly array to mutable (for return type compatibility)
  return [...staticAgents];
}

/**
 * Get detailed progress information for a specific phase
 * Shows completed vs remaining agents with percentage
 *
 * @param session - Pipeline session with completion state
 * @param phaseId - Phase number to get progress for (1-7)
 * @returns PhaseProgress object with completion details
 */
function getPhaseProgress(session: IPhdSession, phaseId: number): PhaseProgress {
  // Default empty result for invalid phases
  if (phaseId < 1 || phaseId > 7) {
    return {
      completed: 0,
      total: 0,
      percentage: 0,
      completedAgents: [],
      remainingAgents: [],
    };
  }

  // Get all agents for this phase
  let phaseAgentKeys: string[];

  if (phaseId === 6 && session.dynamicPhase6Agents && session.dynamicPhase6Agents.length > 0) {
    // Use dynamic Phase 6 agents
    phaseAgentKeys = session.dynamicPhase6Agents.map(a => a.key);
  } else {
    // Use static agents from PHD_PHASES
    const phaseAgents = getCanonicalAgentsByPhase(phaseId);
    phaseAgentKeys = phaseAgents.map(a => a.key);
  }

  // Build completion sets
  const completedSet = new Set(session.completedAgents);
  const completedInPhase: string[] = [];
  const remainingInPhase: string[] = [];

  for (const agentKey of phaseAgentKeys) {
    if (completedSet.has(agentKey)) {
      completedInPhase.push(agentKey);
    } else {
      remainingInPhase.push(agentKey);
    }
  }

  const total = phaseAgentKeys.length;
  const completed = completedInPhase.length;
  const percentage = total > 0 ? Math.round((completed / total) * 1000) / 10 : 0;

  return {
    completed,
    total,
    percentage,
    completedAgents: completedInPhase,
    remainingAgents: remainingInPhase,
  };
}

/**
 * Get progress information for all phases
 * Returns array of phase progress for display in status command
 *
 * @param session - Pipeline session with completion state
 * @returns Array of PhaseProgress objects indexed by phase (0-6 for phases 1-7)
 */
function getAllPhaseProgress(session: IPhdSession): Array<{ phaseId: number; phaseName: string; progress: PhaseProgress }> {
  const results: Array<{ phaseId: number; phaseName: string; progress: PhaseProgress }> = [];

  for (let phaseId = 1; phaseId <= 7; phaseId++) {
    const phase = PHD_PHASES.find(p => p.id === phaseId);
    const progress = getPhaseProgress(session, phaseId);

    results.push({
      phaseId,
      phaseName: phase?.name || getPhaseName(phaseId),
      progress,
    });
  }

  return results;
}

/**
 * Determine the phase for a given agent index
 * Handles both static and dynamic agent configurations
 *
 * @param agentIndex - 0-based agent index
 * @param session - Optional session for dynamic Phase 6 handling
 * @returns Phase number (1-7) for the agent
 */
function getPhaseForAgentIndex(agentIndex: number, session?: IPhdSession): number {
  // Handle dynamic Phase 6 scenario
  if (session?.dynamicPhase6Agents && session.dynamicPhase6Agents.length > 0) {
    const phase6End = PHASE_6_START_INDEX + session.dynamicPhase6Agents.length - 1;

    if (agentIndex < PHASE_6_START_INDEX) {
      // Phase 1-5: use static lookup
      const agent = getConfigAgentByIndex(agentIndex);
      return agent?.phase ?? 1;
    } else if (agentIndex <= phase6End) {
      // Phase 6: dynamic agents
      return 6;
    } else {
      // Phase 7: validation agents
      return 7;
    }
  }

  // Static configuration: direct lookup
  const agent = getConfigAgentByIndex(agentIndex);
  return agent?.phase ?? 1;
}

/**
 * Check if the session is ready for Phase 8 (final orchestration)
 * Phase 8 runs synthesis across all outputs after Phase 7 completion
 *
 * @param session - Pipeline session to check
 * @returns true if all Phase 1-7 agents are complete and Phase 8 can begin
 */
function isReadyForPhase8(session: IPhdSession): boolean {
  // All phases 1-7 must be complete
  for (let phaseId = 1; phaseId <= 7; phaseId++) {
    if (!isPhaseComplete(session, phaseId)) {
      return false;
    }
  }

  return true;
}

/**
 * Get canonical agent configuration by key from PHD_AGENTS (46 agents)
 * This is the preferred lookup method for agent metadata
 * @param key - Agent key (e.g., 'self-ask-decomposer')
 * @returns PhdAgentConfig from the canonical 46-agent configuration, or undefined
 */
function getCanonicalAgentByKey(key: string): PhdAgentConfig | undefined {
  return getConfigAgentByKey(key);
}

/**
 * Get canonical agents for a specific phase from PHD_AGENTS (46 agents)
 * @param phaseId - Phase number (1-7)
 * @returns Array of PhdAgentConfig for the specified phase
 */
function getCanonicalAgentsByPhase(phaseId: number): readonly PhdAgentConfig[] {
  return getConfigAgentsByPhase(phaseId);
}

/**
 * Get index of an agent in the canonical PHD_AGENTS array (46 agents)
 * @param key - Agent key to look up
 * @returns 0-based index or -1 if not found
 */
function getCanonicalAgentIndex(key: string): number {
  return getConfigAgentIndex(key);
}

/**
 * Check if an agent key exists in the canonical PHD_AGENTS configuration
 * @param key - Agent key to validate
 * @returns true if the agent exists in the 46-agent configuration
 */
function isValidCanonicalAgent(key: string): boolean {
  return getConfigAgentByKey(key) !== undefined;
}

/**
 * Get or initialize SonaEngine instance (lazy initialization)
 * Implements RULE-008: All learning data MUST persist to SQLite
 * Implements RULE-031: TrajectoryTracker MUST receive injected SonaEngine reference
 */
function getSonaEngine(): SonaEngine | null {
  if (!sonaEngine) {
    try {
      // Use production factory to ensure persistence (RULE-008, RULE-074)
      sonaEngine = createProductionSonaEngine({
        learningRate: 0.01,
        trackPerformance: true,
      });
      if (sonaEngine.isPersistenceEnabled()) {
        console.error('[PHD-CLI] SonaEngine initialized with persistence enabled');
      } else {
        console.error('[PHD-CLI] Warning: SonaEngine persistence not enabled');
      }
    } catch (error) {
      console.error(`[PHD-CLI] Failed to initialize SonaEngine: ${error}`);
      return null;
    }
  }
  return sonaEngine;
}

/**
 * Create trajectory for agent execution start
 * Implements RULE-025: TrajectoryTracker MUST call SonaEngine.createTrajectoryWithId()
 * @param sessionId - Pipeline session ID
 * @param agentKey - Agent being executed
 * @param agentIndex - Agent index in pipeline
 * @param query - Original research query
 * @returns TrajectoryID if created, null otherwise
 */
function createAgentTrajectory(
  sessionId: string,
  agentKey: string,
  agentIndex: number,
  query: string
): TrajectoryID | null {
  const engine = getSonaEngine();
  if (!engine) return null;

  try {
    // Generate trajectory ID: phd-{sessionId}-{agentIndex}-{agentKey}
    const trajectoryId: TrajectoryID = `phd-${sessionId.slice(0, 8)}-${agentIndex}-${agentKey}`;
    const route = `phd.pipeline.${agentKey}`;
    const patterns: string[] = [`agent:${agentKey}`, `phase:${Math.floor(agentIndex / 10) + 1}`];
    const context: string[] = [sessionId, query.slice(0, 100)];

    // Create trajectory with explicit ID (RULE-025)
    engine.createTrajectoryWithId(trajectoryId, route, patterns, context);

    // Store in active trajectories map for feedback later
    if (!activeTrajectories.has(sessionId)) {
      activeTrajectories.set(sessionId, new Map());
    }
    activeTrajectories.get(sessionId)!.set(agentKey, trajectoryId);

    return trajectoryId;
  } catch (error) {
    console.error(`[PHD-CLI] Failed to create trajectory for ${agentKey}: ${error}`);
    return null;
  }
}

/**
 * Record feedback for completed agent
 * Implements RULE-028: All feedback MUST be persisted before acknowledgment
 * @param sessionId - Pipeline session ID
 * @param agentKey - Agent that completed
 * @param output - Agent output (for quality assessment)
 * @param phase - Pipeline phase the agent belongs to (for context-aware quality)
 * @returns Promise<boolean> - true if feedback recorded
 */
async function recordAgentFeedback(
  sessionId: string,
  agentKey: string,
  output: unknown,
  phase?: number,
  agentIndex?: number
): Promise<boolean> {
  const engine = getSonaEngine();
  if (!engine) return false;

  // Get trajectory ID from active map (fast path)
  let trajectoryId: TrajectoryID | undefined;
  const sessionTrajectories = activeTrajectories.get(sessionId);
  if (sessionTrajectories) {
    trajectoryId = sessionTrajectories.get(agentKey);
  }

  // FIX: If not in memory map (e.g., after CLI restart), reconstruct the ID
  // Trajectory ID pattern: phd-{sessionId.slice(0,8)}-{agentIndex}-{agentKey}
  if (!trajectoryId && agentIndex !== undefined) {
    trajectoryId = `phd-${sessionId.slice(0, 8)}-${agentIndex}-${agentKey}` as TrajectoryID;
    console.error(`[PHD-CLI] Reconstructed trajectory ID: ${trajectoryId}`);

    // Verify trajectory exists in database before providing feedback
    if (!engine.hasTrajectoryInStorage(trajectoryId)) {
      console.error(`[PHD-CLI] Trajectory ${trajectoryId} not found in database`);
      return false;
    }
  }

  if (!trajectoryId) {
    console.error(`[PHD-CLI] No trajectory found for agent ${agentKey} (no agentIndex provided for reconstruction)`);
    return false;
  }

  try {
    // Calculate quality using PhDQualityCalculator with context (RULE-033, RULE-034)
    const context = createQualityContext(agentKey, phase);
    const quality = calculatePhDQuality(output, context);

    // Record feedback (RULE-028: persist before acknowledgment)
    await engine.provideFeedback(trajectoryId, quality, {
      skipAutoSave: false, // Ensure immediate persistence
    });

    // Remove from active trajectories after feedback (only if present in map)
    if (sessionTrajectories) {
      sessionTrajectories.delete(agentKey);
      if (sessionTrajectories.size === 0) {
        activeTrajectories.delete(sessionId);
      }
    }

    console.error(`[PHD-CLI] Recorded feedback for ${agentKey}: quality=${quality.toFixed(2)}`);
    return true;
  } catch (error) {
    console.error(`[PHD-CLI] Failed to record feedback for ${agentKey}: ${error}`);
    return false;
  }
}

/**
 * Assess output quality for feedback
 * Implements RULE-033, RULE-034: Quality assessment on results
 * @deprecated Use calculatePhDQuality with createQualityContext for context-aware scoring
 * @param output - The output to assess
 * @param agentKey - Optional agent key for context-aware scoring
 * @param phase - Optional phase number for context-aware scoring
 * @returns Quality score between 0.30 and 0.95
 */
function assessOutputQuality(output: unknown, agentKey?: string, phase?: number): number {
  // Delegate to PhDQualityCalculator for discriminating quality assessment
  const context = agentKey ? createQualityContext(agentKey, phase) : undefined;
  return calculatePhDQuality(output, context);
}

/**
 * Pattern insight from past learnings
 * Implements RULE-031: Use learned patterns to improve behavior
 */
interface PatternInsight {
  patternId: string;
  weight: number;
  description: string;
}

/**
 * Query top-weighted patterns for an agent route
 * Implements RULE-031: TrajectoryTracker integration with SonaEngine
 * @param agentKey - Agent key to query patterns for
 * @param limit - Maximum patterns to return (default 3)
 * @returns Array of pattern insights sorted by weight
 */
async function getTopPatternsForAgent(
  agentKey: string,
  limit: number = 3
): Promise<PatternInsight[]> {
  const engine = getSonaEngine();
  if (!engine) return [];

  try {
    const route = `phd.pipeline.${agentKey}`;
    const weightsWithIds = await engine.getWeightsWithIds(route);

    if (weightsWithIds.length === 0) {
      return [];
    }

    // Sort by weight descending, take top N
    const sorted = weightsWithIds
      .filter(w => w.weight > 0) // Only positive weights (successful patterns)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, limit);

    // Get pattern details
    const patterns = engine.getPatterns();
    const patternMap = new Map(patterns.map(p => [p.id, p]));

    return sorted.map(({ patternId, weight }) => {
      const pattern = patternMap.get(patternId);
      return {
        patternId,
        weight,
        description: pattern?.metadata?.description ||
                     pattern?.metadata?.domain ||
                     `Pattern from ${patternId}`,
      };
    });
  } catch (error) {
    console.error(`[PHD-CLI] Failed to query patterns for ${agentKey}: ${error}`);
    return [];
  }
}

/**
 * Format pattern insights for prompt injection
 * Implements RULE-031: Close the learning loop by using past patterns
 * @param patterns - Pattern insights to format
 * @returns Formatted string for prompt injection
 */
function formatPatternsForPrompt(patterns: PatternInsight[]): string {
  if (patterns.length === 0) {
    return '';
  }

  const lines = [
    '\n## LEARNED PATTERNS (from past successful executions)',
    'The following patterns have been learned from high-quality past outputs:',
    '',
  ];

  patterns.forEach((p, i) => {
    const confidence = Math.round(p.weight * 100);
    lines.push(`${i + 1}. **${p.patternId}** (confidence: ${confidence}%)`);
    lines.push(`   ${p.description}`);
    lines.push('');
  });

  lines.push('Consider these patterns when executing your task.\n');

  return lines.join('\n');
}

/**
 * Auto-complete orphaned trajectories from previous agents
 * Implements RULE-028-AUTO: Ensure no trajectories get stuck in "active" state
 *
 * This function is called at the start of commandNext() to auto-complete any
 * trajectories that were created but never had feedback recorded (e.g., due to
 * process interruption or commandComplete() not being called).
 *
 * @param sessionId - Pipeline session ID
 * @param researchDir - Directory where agent outputs are stored
 * @param previousAgentIndex - The agent index that just completed (current - 1)
 * @param query - Original research query for context
 * @returns Number of trajectories auto-completed
 */
async function autoCompleteOrphanedTrajectories(
  sessionId: string,
  researchDir: string,
  previousAgentIndex: number,
  query: string
): Promise<number> {
  const engine = getSonaEngine();
  if (!engine) return 0;

  // Get active trajectories for this session
  const sessionTrajectories = activeTrajectories.get(sessionId);
  if (!sessionTrajectories || sessionTrajectories.size === 0) {
    return 0;
  }

  let completedCount = 0;
  const trajectoriesList = Array.from(sessionTrajectories.entries());

  for (const [agentKey, trajectoryId] of trajectoriesList) {
    try {
      // Try to find output file for this agent
      const outputResult = await tryReadAgentOutput(researchDir, previousAgentIndex, agentKey);

      let quality: number;
      let output: unknown;

      if (outputResult) {
        // Output file exists - calculate quality based on content
        output = {
          status: 'auto-completed',
          content: outputResult.content,
          output_file: outputResult.outputPath,
          auto_captured: true,
          word_count: outputResult.content.split(/\s+/).length,
        };

        // Calculate quality using PhDQualityCalculator with context
        // Estimate phase from agent index (roughly 10 agents per phase for phases 1-5)
        const estimatedPhase = Math.min(7, Math.floor(previousAgentIndex / 10) + 1);
        const context = createQualityContext(agentKey, estimatedPhase);
        quality = calculatePhDQuality(output, context);

        console.error(`[Auto-Complete] Found output for ${agentKey}: ${outputResult.outputPath} (quality: ${quality.toFixed(2)})`);
      } else {
        // No output file found - assign minimum quality for incomplete work
        output = {
          status: 'auto-completed-no-output',
          auto_captured: false,
          reason: 'No output file found during auto-completion',
        };
        quality = 0.30; // Minimum quality for missing output

        console.error(`[Auto-Complete] No output found for ${agentKey}, using minimum quality: ${quality.toFixed(2)}`);
      }

      // Record feedback with skipAutoSave: false to ensure persistence (RULE-028)
      await engine.provideFeedback(trajectoryId, quality, {
        skipAutoSave: false,
      });

      // Remove from active trajectories after feedback
      sessionTrajectories.delete(agentKey);
      completedCount++;

      console.error(`[Auto-Complete] Completed orphaned trajectory ${trajectoryId} for ${agentKey} with quality=${quality.toFixed(2)}`);
    } catch (error) {
      console.error(`[Auto-Complete] Failed to auto-complete trajectory for ${agentKey}: ${error}`);
      // Continue with other trajectories even if one fails
    }
  }

  // Clean up session entry if no more active trajectories
  if (sessionTrajectories.size === 0) {
    activeTrajectories.delete(sessionId);
  }

  if (completedCount > 0) {
    console.error(`[Auto-Complete] Auto-completed ${completedCount} orphaned trajectories for session ${sessionId.slice(0, 8)}`);
  }

  return completedCount;
}

async function getSocketClient(): Promise<SocketClient | null> {
  if (!socketClient) {
    try {
      socketClient = new SocketClient({ verbose: false });
      await socketClient.connect();
    } catch {
      // INTENTIONAL: Non-blocking - observability socket connection is optional for CLI operation
      return null;
    }
  }
  return socketClient;
}

function emitPipelineEvent(event: Omit<IActivityEvent, 'id' | 'timestamp'>): void {
  getSocketClient().then(client => {
    if (!client) return;
    try {
      const fullEvent: IActivityEvent = {
        id: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
        ...event,
      };
      client.send(fullEvent);
    } catch { /* INTENTIONAL: Best-effort event emission - observability failures must not block CLI */ }
  });
}

const program = new Command();

program
  .name('phd-cli')
  .description('PhD Pipeline CLI-guided orchestration tool')
  .version('1.0.0');

// ============================================================================
// TASK-CLI-001: validate-agents command
// ============================================================================

/**
 * CLI options interface for validate-agents command
 */
interface ValidateAgentsOptions {
  /** Output as JSON (default: true) */
  json?: boolean;
  /** Enable verbose logging */
  verbose?: boolean;
}

/**
 * validate-agents command - Validate all 46 agent .md files exist
 * [RULE-018] Agent Key Validity - all agent keys must have corresponding .md files
 *
 * Usage: phd-cli validate-agents [--verbose] [--json]
 *
 * Exit codes:
 * - 0: All agent files valid
 * - 1: One or more agent files missing or invalid
 */
program
  .command('validate-agents')
  .description('Validate all 46 agent .md files exist in the agents directory')
  .option('--verbose', 'Enable verbose logging')
  .option('--json', 'Output as JSON (default: true)', true)
  .action(async (options: ValidateAgentsOptions) => {
    try {
      const result = await validateAgentFiles();

      if (options.verbose) {
        console.error(`[PHD-CLI] Validating agent files in: ${result.agentsDirectory}`);
        console.error(`[PHD-CLI] Total agents in configuration: ${result.totalAgents}`);
      }

      // Always output JSON for programmatic consumption
      console.log(JSON.stringify({
        valid: result.valid,
        totalAgents: result.totalAgents,
        foundAgents: result.foundAgents,
        missingAgents: result.missingAgents,
        invalidAgents: result.invalidAgents,
        agentsDirectory: result.agentsDirectory,
        errors: result.errors,
        summary: result.valid
          ? `All ${result.totalAgents} agent files validated successfully`
          : `Validation failed: ${result.missingAgents.length} missing, ${result.invalidAgents.length} invalid`
      }, null, 2));

      // Exit with appropriate code
      process.exit(result.valid ? 0 : 1);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * init command - Initialize new pipeline session
 * [REQ-PIPE-001]
 */
program
  .command('init <query>')
  .description('Initialize new pipeline session')
  .option('--style-profile <id>', 'Style profile ID to use')
  .option('--config <path>', 'Custom pipeline config path')
  .option(
    '--data-source <mode>',
    'Research mode: external|local|hybrid (default: external)'
  )
  .option('--verbose', 'Enable verbose logging')
  .option('--json', 'Output as JSON (default: true)', true)
  .action(async (query: string, options: InitOptions) => {
    try {
      const response = await commandInit(query, options);
      console.log(JSON.stringify(response, null, 2));
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Execute init command
 * [REQ-PIPE-001, REQ-PIPE-011, REQ-PIPE-020, REQ-PIPE-021, REQ-PIPE-023]
 * [RULE-018] Agent Key Validity - validates all agent files before session creation
 */
async function commandInit(
  query: string,
  options: InitOptions,
  sessionBasePath?: string
): Promise<InitResponse> {
  // Normalize and validate data source mode (default external)
  const rawMode = (options as unknown as { dataSource?: string }).dataSource;
  const dataSourceMode = (rawMode ?? 'external') as 'external' | 'local' | 'hybrid';

  if (!['external', 'local', 'hybrid'].includes(dataSourceMode)) {
    throw new Error(`Invalid --data-source value: ${rawMode}. Must be external|local|hybrid`);
  }

  // [RULE-018] Validate agent files before proceeding (EXCEPT local mode)
  // Local mode is Phase 9 only and must not require the 46-agent pipeline to exist.
  let agentValidation: { valid: boolean; foundAgents: number; totalAgents: number; agentsDirectory: string; missingAgents: string[]; invalidAgents: string[]; errors: string[] } | null = null;

  if (dataSourceMode !== "local") {
    agentValidation = await validateAgentFiles();
    if (!agentValidation.valid) {
      const missingCount = agentValidation.missingAgents.length;
      const invalidCount = agentValidation.invalidAgents.length;
      const errorDetail = agentValidation.errors.slice(0, 5).join('\n'); // Show first 5 errors

      throw new Error(
        `[RULE-018] Agent file validation failed: ${missingCount} missing, ${invalidCount} invalid.\n` +
        `Agents directory: ${agentValidation.agentsDirectory}\n` +
        `Missing agents: ${agentValidation.missingAgents.slice(0, 10).join(', ')}${missingCount > 10 ? ` ... and ${missingCount - 10} more` : ''}\n` +
        `Invalid agents: ${agentValidation.invalidAgents.slice(0, 10).join(', ')}${invalidCount > 10 ? ` ... and ${invalidCount - 10} more` : ''}\n` +
        `First errors:\n${errorDetail}\n` +
        `Run 'phd-cli validate-agents' for full details.\n` +
        `Fix: Ensure all agent .md files exist in ${agentValidation.agentsDirectory}/`
      );
    }

    if (options.verbose) {
      console.error(`[PHD-CLI] Agent file validation passed: ${agentValidation.foundAgents}/${agentValidation.totalAgents} agents verified`);
    }
  } else if (options.verbose) {
    console.error(`[PHD-CLI] Local mode: skipping 46-agent validation (Phase 9 only)`);
  }

  // TASK-EMBED-HEALTH-001: Check embedding service health at pipeline init
  // This warns users early if DESC episodic memory won't work
  // Non-blocking: pipeline continues but without DESC capabilities
  await checkAndWarnEmbeddingService(options.verbose || false);

  // [REQ-PIPE-001] Validate query
  if (!query || query.trim() === '') {
    throw new Error('Query cannot be empty');
  }

  // [REQ-PIPE-023] Generate UUID v4 session ID
  const sessionId = uuidv4();

  // Generate pipeline ID from query hash
  const pipelineId = generatePipelineId(query);

  // [REQ-PIPE-011] Determine style profile
  const styleProfileId = await determineStyleProfile(options.styleProfile);
  const styleProfile = await loadStyleProfile(styleProfileId);

  // [REQ-PIPE-020] Create and persist session using SessionManager
  const sessionManager = sessionBasePath ? new SessionManager(sessionBasePath) : new SessionManager();

  // Create session object [REQ-PIPE-021]
  const slug = generateSlug(query);
  const session = sessionManager.createSession(
    sessionId,
    query,
    styleProfile.metadata.id,
    pipelineId,
    dataSourceMode
  );
  session.slug = slug;
  session.researchDir = path.join(process.cwd(), 'docs/research', slug);

  // Persist to disk with atomic write pattern [RULE-021]
  await sessionManager.saveSession(session);

  // =========================================================================
  // CROSS-CHAPTER CONTEXT INITIALIZATION
  // =========================================================================
  // Initialize context manager for tracking dissertation coherence
  // Context is stored in .phd-sessions/{sessionId}/context/
  const contextStoragePath = path.join(sessionManager.getSessionDirectory(), sessionId);
  const contextManager = await getOrCreateContextManager(
    sessionId,
    contextStoragePath,
    query // Use query as initial title
  );

  // Store context manager reference for the session
  if (options.verbose) {
    console.error(`[CONTEXT] Initialized DissertationContextManager for session ${sessionId}`);
  }

    // =========================================================================
  // PHASE 9 INTEGRATION (local + hybrid)
  // =========================================================================
  // local: REPORT + ANSWER, then return a "virtual agent" (single-shot)
  // hybrid: REPORT first (always), ANSWER optional, then continue normal pipeline

  const slugForPhase9 = session.slug || generateSlug(query);
  const phase9Dir = phase9DirForSession({ researchDir: session.researchDir, slug: slugForPhase9, query });

  if (dataSourceMode === "local" || dataSourceMode === "hybrid") {
    const reportJson = await runPhase9Report(query);
    const reportPath = path.join(phase9Dir, "report.json");
    await writeJsonArtifact(reportPath, reportJson);

    // Store local report snapshot to memory (non-blocking)
    storeToMemory(`session/${sessionId}/phase9/report`, reportJson).catch(() => {});

    const coverage = getCoverageGrade(reportJson as any);

    // GAP-H01: Update session with coverage grade and resolve tool permissions
    updateCoverageGrade(session, coverage);
    initializeToolPermissions(session);

    // Save session with updated coverage and permissions
    await sessionManager.saveSession(session);

    let answerJson: unknown | null = null;
    let answerPath: string | undefined;

    if (dataSourceMode === "local" || coverage === "HIGH" || coverage === "MED") {
      answerJson = await runPhase9Answer(query);
      answerPath = path.join(phase9Dir, "answer.json");
      await writeJsonArtifact(answerPath, answerJson);

      storeToMemory(`session/${sessionId}/phase9/answer`, answerJson).catch(() => {});
    }

    // LOCAL MODE: stop here (single-shot) and return a virtual agent response
    if (dataSourceMode === "local") {
      const virtualPrompt = [
        "# Phase 9 (local) — ANSWER (local-only)",
        "",
        "This session is running in **local** mode. External tools are prohibited.",
        "Phase 9 artifacts have been generated (read-only):",
        `- report: ${reportPath}`,
        answerPath ? `- answer: ${answerPath}` : "- answer: (missing)",
        "",
        "Next steps:",
        "- Read the JSON artifacts on disk (or retrieve via claude-flow memory keys).",
        "- If coverage is LOW/NONE and you need external research, re-run in hybrid or external mode.",
        "",
        "Memory keys:",
        `- session/${sessionId}/phase9/report`,
        `- session/${sessionId}/phase9/answer`,
        "",
      ].join("\n");

      const phase9Agent: AgentDetails = {
        index: 0,
        key: "phase9-local-answer",
        name: "Phase 9 Local Answer",
        phase: 0,
        phaseName: "Phase 9 (local)",
        prompt: virtualPrompt,
        dependencies: [],
        timeout: 120000,
        critical: true,
        expectedOutputs: ["phase9/report.json", "phase9/answer.json"],
      };

      return {
        sessionId,
        pipelineId,
        query,
        dataSourceMode,
        styleProfile: {
          id: styleProfile.metadata.id,
          name: styleProfile.metadata.name,
          languageVariant: "default",
        },
        totalAgents: 1,
        agent: phase9Agent,
      };
    }

    // HYBRID MODE: continue normal pipeline, but inject strict policy + coverage into prompt later
    // We stash these values for prompt augmentation below.
    (session as any).__phase9 = { reportPath, answerPath, coverage, slug: slugForPhase9 };
  }


  // TASK-CLI-004: Log pipeline initialization with 46 agent count
  console.error(`[PHD-CLI] Pipeline initialized with ${PHD_PIPELINE_AGENT_COUNT} agents across ${PHD_PHASES.length} phases`);

  if (options.verbose) {
    console.error(`[DEBUG] Session created: ${sessionId}`);
    console.error(`[DEBUG] Style profile: ${styleProfile.metadata.name}`);
    console.error(`[DEBUG] Session saved to: ${sessionManager.getSessionDirectory()}`);
  }

  // TASK-CLI-004: Store initial session state to memory [RULE-021, RULE-025]
  // This enables cross-session persistence and resume capabilities
  const initialSessionState = buildSessionStateForMemory(session);
  const sessionMemoryKey = `session/${sessionId}`;

  // Store session state asynchronously (non-blocking)
  storeToMemory(sessionMemoryKey, initialSessionState).then((stored) => {
    if (stored && options.verbose) {
      console.error(`[MEMORY] Session state stored: ${sessionMemoryKey}`);
    }
  });

  // Also store session index for lookup by topic
  const sessionIndexKey = `session/index/${slug}`;
  storeToMemory(sessionIndexKey, {
    sessionId,
    topic: query,
    dataSourceMode,
    createdAt: new Date().toISOString(),
    status: 'running',
  }).catch(() => {
    // Silent fail for index storage
  });

  // Load first agent from pipeline config (always use project root, not session path)
  // sessionBasePath is only for session storage, not for agent definitions
  const pipelineLoader = new PipelineConfigLoader(process.cwd());
  const styleInjector = new StyleInjector(process.cwd());

  const firstAgentConfig = await pipelineLoader.getAgentByIndex(0);
  const pipelineConfig = await pipelineLoader.loadPipelineConfig();
  const totalAgentCount = pipelineConfig.agents.length;

  // Build prompt with style injection (Phase 6 only), query injection, and output context
  let prompt = await styleInjector.buildAgentPrompt(
    firstAgentConfig,
    styleProfile.metadata.id,
    query,
    { researchDir: session.researchDir!, agentIndex: 0, agentKey: firstAgentConfig.key },
    dataSourceMode
  );

  // If hybrid mode ran Phase 9 REPORT already, inject strict local-first policy + artifact pointers
  if (dataSourceMode === "hybrid" && (session as any).__phase9) {
    const p9 = (session as any).__phase9 as { reportPath: string; answerPath?: string; coverage: Phase9CoverageGrade; slug: string };
    // GAP-H03: Pass query intent to prompt builder for recency/outside-corpus detection
    const queryIntent = session.queryIntent || analyzeQueryIntent(query);
    prompt += buildHybridPolicyBlock({
      sessionId,
      slug: p9.slug,
      reportPath: p9.reportPath,
      answerPath: p9.answerPath,
      coverage: p9.coverage,
      queryIntent,
    });
  }



  // Build first agent details using pipeline loader (not hardcoded)
  const firstAgent: AgentDetails = {
    index: 0,
    key: firstAgentConfig.key,
    name: firstAgentConfig.name,
    phase: firstAgentConfig.phase,
    phaseName: getPhaseName(firstAgentConfig.phase),
    prompt,
    dependencies: firstAgentConfig.dependencies,
    timeout: firstAgentConfig.timeout,
    critical: firstAgentConfig.critical,
    expectedOutputs: firstAgentConfig.expectedOutputs
  };

  return {
    sessionId,
    pipelineId,
    query,
    dataSourceMode,
    styleProfile: {
      id: styleProfile.metadata.id,
      name: styleProfile.metadata.name,
      languageVariant: "default",
    },
    totalAgents: totalAgentCount,
    agent: firstAgent,
  };
}


/**
 * Determine which style profile to use
 * [REQ-PIPE-011]
 */
async function determineStyleProfile(profileId?: string): Promise<string> {
  // If profile ID provided, use it
  if (profileId) {
    return profileId;
  }

  // Otherwise, get active profile
  try {
    const spm = new StyleProfileManager();
    const activeProfile = spm.getActiveProfile();

    if (activeProfile) {
      return activeProfile.metadata.id;
    }
  } catch {
    // INTENTIONAL: StyleProfileManager may not have profiles yet - fallback to default is valid
  }

  // Fall back to a default identifier
  return 'default-academic';
}

/**
 * Load style profile by ID
 */
async function loadStyleProfile(profileId: string): Promise<StoredStyleProfile> {
  try {
    const spm = new StyleProfileManager();

    // Try to get specified profile
    const profile = spm.getProfile(profileId);
    if (profile) {
      return profile;
    }

    // Try active profile
    const activeProfile = spm.getActiveProfile();
    if (activeProfile) {
      return activeProfile;
    }
  } catch {
    // INTENTIONAL: StyleProfileManager may fail if no profiles exist - fallback to default profile
  }

  // Return minimal default profile
  return {
    metadata: {
      id: 'default-academic',
      name: 'Default Academic',
      description: 'Default UK English academic style',
      sourceType: 'text',
      sourceCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      tags: ['academic', 'uk-english']
    },
    characteristics: {
      sentences: {
        averageLength: 25,
        lengthVariance: 8,
        shortSentenceRatio: 0.15,
        mediumSentenceRatio: 0.65,
        longSentenceRatio: 0.2,
        complexSentenceRatio: 0.3
      },
      vocabulary: {
        uniqueWordRatio: 0.7,
        averageWordLength: 5.5,
        academicWordRatio: 0.15,
        technicalTermDensity: 0.1,
        latinateWordRatio: 0.2,
        contractionUsage: 0.02
      },
      structure: {
        paragraphLengthAvg: 150,
        transitionWordDensity: 0.12,
        passiveVoiceRatio: 0.25,
        firstPersonUsage: 0.05,
        thirdPersonUsage: 0.4,
        questionFrequency: 0.02,
        listUsage: 0.05
      },
      tone: {
        formalityScore: 0.85,
        objectivityScore: 0.9,
        hedgingFrequency: 0.1,
        assertivenessScore: 0.6,
        emotionalTone: 0.1
      },
      samplePhrases: [],
      commonTransitions: ['however', 'therefore', 'moreover', 'furthermore'],
      openingPatterns: [],
      citationStyle: 'APA',
      regional: {
        languageVariant: 'en-GB',
        spellingRules: [],
        grammarRules: [],
        dateFormat: 'DD/MM/YYYY',
        primaryQuoteMark: "'"
      }
    },
    sampleTexts: []
  };
}

/**
 * Generate pipeline ID from query
 */
function generatePipelineId(query: string): string {
  // Simple hash-based ID generation
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    const char = query.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `pipeline-${Math.abs(hash).toString(16)}`;
}

/**
 * Generate research folder slug from query
 */
function generateSlug(query: string): string {
  return query
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50);
}

/**
 * Get expected output path for an agent
 * [REQ-PIPE-025] Consistent file naming: {index:02d}-{agent-key}.md
 */
function getExpectedOutputPath(researchDir: string, agentIndex: number, agentKey: string): string {
  const paddedIndex = String(agentIndex).padStart(2, '0');
  return path.join(researchDir, `${paddedIndex}-${agentKey}.md`);
}

/**
 * Try to find and read agent output file with fallback paths
 * [REQ-PIPE-026] Auto-capture output from expected locations
 */
async function tryReadAgentOutput(
  researchDir: string,
  agentIndex: number,
  agentKey: string
): Promise<{ content: string; outputPath: string } | null> {
  const fs = await import('fs/promises');

  // Transform agent key to common file name patterns
  const baseKey = agentKey.replace(/-/g, '-');
  const keyWithoutSuffix = agentKey
    .replace(/-analyst$/, '')
    .replace(/-analyzer$/, '')
    .replace(/-hunter$/, '')
    .replace(/-manager$/, '')
    .replace(/-definer$/, '');

  // Priority order of paths to check
  const pathsToTry = [
    // Standard numbered path: 00-agent-key.md
    getExpectedOutputPath(researchDir, agentIndex, agentKey),
    // Unnumbered: agent-key.md
    path.join(researchDir, `${agentKey}.md`),
    // Common variations: *-analysis.md, *-tiers.md, etc.
    path.join(researchDir, `${keyWithoutSuffix}-analysis.md`),
    path.join(researchDir, `${keyWithoutSuffix}-tiers.md`),
    path.join(researchDir, `${keyWithoutSuffix}s.md`),
    path.join(researchDir, `${keyWithoutSuffix}.md`),
    // Legacy patterns from fourth-turning
    path.join(researchDir, `${baseKey}-analysis.md`),
    path.join(researchDir, 'risk-analysis-fmea.md'), // specific risk-analyst fallback
    // In synthesis subfolder (legacy)
    path.join(researchDir, 'synthesis', `${String(agentIndex).padStart(2, '0')}-${agentKey}.md`),
    path.join(researchDir, 'synthesis', `${agentKey}.md`),
    path.join(researchDir, 'synthesis', `${keyWithoutSuffix}.md`),
  ];

  for (const filePath of pathsToTry) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return { content, outputPath: filePath };
    } catch {
      // INTENTIONAL: File doesn't exist at this path - try next location in search order
    }
  }

  return null;
}


// ============================================================================
// TASK-PIPE-004: Next Command
// ============================================================================

/**
 * next command - Get next agent details for session
 * [REQ-PIPE-002]
 */
program
  .command('next <session-id>')
  .description('Get next agent details for session')
  .option('--json', 'Output as JSON (default: true)', true)
  .option('--verbose', 'Enable verbose logging')
  .action(async (sessionId: string, options: NextOptions) => {
    try {
      const response = await commandNext(sessionId, options);
      console.log(JSON.stringify(response, null, 2));
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Execute next command
 * [REQ-PIPE-002]
 *
 * @param sessionId - Session ID to get next agent for
 * @param options - Command options
 * @param sessionBasePath - Optional base path for session storage (for testing)
 */
async function commandNext(
  sessionId: string,
  options: NextOptions,
  sessionBasePath?: string
): Promise<NextResponse> {
  const sessionManager = sessionBasePath ? new SessionManager(sessionBasePath) : new SessionManager();
  const pipelineLoader = new PipelineConfigLoader();
  const styleInjector = new StyleInjector();
  const dynamicGenerator = new DynamicAgentGenerator();
  const structureLoader = new ChapterStructureLoader();

  // [REQ-PIPE-002] Load session from disk
  const session = await sessionManager.loadSession(sessionId);

    // LOCAL MODE: Phase 9 is single-shot; no pipeline advancement
  if (session.dataSourceMode === "local") {
    const duration = Date.now() - session.startTime;

    const summary: CompletionSummary = {
      duration,
      agentsCompleted: session.completedAgents.length,
      errors: session.errors.length,
    };

    return {
      sessionId: session.sessionId,
      status: "complete",
      progress: {
        completed: 1,
        total: 1,
        percentage: 100,
        currentPhase: 0,
        phaseName: "Phase 9 (local)",
      },
      summary,
    };
  }


  // Check session not expired
  if (sessionManager.isSessionExpired(session)) {
    throw new SessionExpiredError(sessionId);
  }

  // [RULE-028-AUTO] Auto-complete orphaned trajectories from previous agents
  // This ensures no trajectories get stuck in "active" state without quality scores
  // Must run before processing the next phase to close the learning loop
  if (session.currentAgentIndex > 0) {
    const researchDir = session.researchDir ||
      path.join(process.cwd(), 'docs/research', session.slug || generateSlug(session.query));
    const previousAgentIndex = session.currentAgentIndex - 1;

    const autoCompletedCount = await autoCompleteOrphanedTrajectories(
      sessionId,
      researchDir,
      previousAgentIndex,
      session.query
    );

    if (autoCompletedCount > 0 && options.verbose) {
      console.error(`[RULE-028-AUTO] Auto-completed ${autoCompletedCount} orphaned trajectory(ies)`);
    }
  }

  // Load static pipeline config (for legacy compatibility)
  const staticConfig = await pipelineLoader.loadPipelineConfig();

  // CRITICAL: Detect Phase 6 entry and generate dynamic agents [DYNAMIC-001, DYNAMIC-002]
  if (!session.dynamicPhase6Agents && session.currentAgentIndex >= PHASE_6_START_INDEX) {
    const slug = session.slug || generateSlug(session.query);

    try {
      // Load locked chapter structure [DYNAMIC-002]
      const chapterStructure = await structureLoader.loadChapterStructure(slug);

      // Generate dynamic Phase 6 agents [DYNAMIC-001, DYNAMIC-004]
      const styleChars = styleInjector.getStyleCharacteristics(session.styleProfileId);
      const phase6Agents = await dynamicGenerator.generatePhase6Agents(
        chapterStructure,
        styleChars,
        slug
      );

      // Calculate total [DYNAMIC-007]
      const dynamicTotal = PHASE_1_5_AGENT_COUNT + phase6Agents.length + PHASE_7_AGENT_COUNT;

      // Store in session
      session.slug = slug;
      session.chapterStructure = chapterStructure;
      session.dynamicPhase6Agents = phase6Agents;
      session.dynamicTotalAgents = dynamicTotal;

      await sessionManager.saveSession(session);

      if (options.verbose) {
        console.error(`[DEBUG] Generated ${phase6Agents.length} dynamic Phase 6 agents`);
        console.error(`[DEBUG] Total agents: ${dynamicTotal}`);
      }
    } catch (error) {
      // Chapter structure not ready - fall back to static agents
      if (options.verbose) {
        console.error(`[DEBUG] Chapter structure not found, using static agents: ${error}`);
      }
    }
  }

  // Determine total agents (dynamic if available, else static)
  const totalAgents = session.dynamicTotalAgents || staticConfig.agents.length;

  if (options.verbose) {
    console.error(`[DEBUG] Session: ${sessionId}`);
    console.error(`[DEBUG] Current agent index: ${session.currentAgentIndex}`);
    console.error(`[DEBUG] Total agents: ${totalAgents}`);
    console.error(`[DEBUG] Using dynamic agents: ${!!session.dynamicPhase6Agents}`);
  }

  // =========================================================================
  // TASK-CLI-003: Use getNextAgent() for agent resolution and prompt building
  // Implements RULE-015: Sequential execution via getNextAgent()
  // =========================================================================

  // Build session interface for getNextAgent
  const phdSession: IPhdSession = {
    sessionId: session.sessionId,
    currentPhase: session.currentPhase,
    currentAgentIndex: session.currentAgentIndex,
    completedAgents: [...session.completedAgents],
    dynamicPhase6Agents: session.dynamicPhase6Agents,
    dynamicTotalAgents: session.dynamicTotalAgents,
  };

  // Add query property to session for prompt building
  (phdSession as unknown as { query: string }).query = session.query;

  // Call getNextAgent() to get agent config and prompt
  const nextAgentResult = await getNextAgent(phdSession, { verbose: options.verbose });

  // Check if pipeline is complete (getNextAgent returns null)
  if (nextAgentResult === null) {
    const duration = Date.now() - session.startTime;
    const summary: CompletionSummary = {
      duration,
      agentsCompleted: session.completedAgents.length,
      errors: session.errors.length
    };

    return {
      sessionId: session.sessionId,
      status: 'complete',
      progress: {
        completed: totalAgents,
        total: totalAgents,
        percentage: 100,
        currentPhase: 7,
        phaseName: getPhaseName(7)
      },
      summary
    };
  }

  // Extract agent config from NextAgentResult
  const { agent: phdAgent, prompt: basePrompt, agentIndex, phase, isLastAgent, agentFilePath } = nextAgentResult;

  // Convert PhdAgentConfig to legacy AgentConfig for compatibility with existing code
  // This maintains backward compatibility with styleInjector and other components
  const agentConfig: AgentConfig = {
    key: phdAgent.key,
    name: phdAgent.displayName,
    phase: phdAgent.phase,
    order: agentIndex,
    description: '',
    dependencies: [],
    timeout: 600000,
    critical: false,
    expectedOutputs: [...phdAgent.outputArtifacts],
    inputs: [],
    outputs: [...phdAgent.outputArtifacts],
  };

  if (options.verbose) {
    console.error(`[TASK-CLI-003] Using getNextAgent() result:`);
    console.error(`  - Agent: ${phdAgent.displayName} (${phdAgent.key})`);
    console.error(`  - Phase: ${phase.name} (Phase ${phase.id})`);
    console.error(`  - Index: ${agentIndex + 1}/${totalAgents}`);
    console.error(`  - Agent File: ${agentFilePath}`);
    console.error(`  - Is Last Agent: ${isLastAgent}`);
  }

  // Use the prompt from getNextAgent() which already includes the 5-part template
  // The basePrompt includes: YOUR TASK, WORKFLOW CONTEXT, MEMORY RETRIEVAL, MEMORY STORAGE, TASK COMPLETION SUMMARY
  let prompt = basePrompt;

  // [UCM-DESC] Inject prior solutions from DESC episodic memory
  // Use PhdPipelineAdapter for phase-aware window sizes (RULE-010 to RULE-014)
  let descInjectionResult: { episodesUsed: number; episodeIds: string[]; windowSize: number } = { episodesUsed: 0, episodeIds: [], windowSize: 3 };
  try {
    const ucmClient = getUCMClient();
    if (await ucmClient.isHealthy()) {
      // Use PhdPipelineAdapter to get phase-aware window size
      const pipelineAdapter = new PhdPipelineAdapter();
      const phaseName = getPhaseName(agentConfig.phase);

      // Map numeric phase to adapter's phase detection context
      // Phase 1: Foundation -> planning (2 messages, RULE-011)
      // Phase 2: Discovery -> research (3 messages, RULE-012)
      // Phase 3-5: Architecture/Synthesis/Design -> default (3 messages, RULE-010)
      // Phase 6: Writing -> writing (5 messages, RULE-013)
      // Phase 7: Validation -> qa (10 messages, RULE-014)
      const phaseContext = {
        pipelineName: 'phd-pipeline',
        agentId: agentConfig.key,
        phase: phaseName.toLowerCase(),
        task: session.query
      };

      const windowSize = pipelineAdapter.getWindowSize(phaseContext);

      const injection = await ucmClient.injectSolutions(prompt, {
        threshold: 0.80, // Per task requirements
        maxEpisodes: windowSize,
        agentType: agentConfig.key,
        metadata: {
          sessionId: session.sessionId,
          phase: agentConfig.phase,
          phaseName,
          agentIndex: session.currentAgentIndex,
          totalAgents,
          windowSize, // Include for traceability
        },
      });

      if (injection.episodesUsed > 0) {
        prompt = injection.augmentedPrompt;
        descInjectionResult = {
          episodesUsed: injection.episodesUsed,
          episodeIds: injection.episodeIds,
          windowSize
        };

        if (options.verbose) {
          console.error(`[UCM-DESC] Injected ${injection.episodesUsed} prior solutions for ${agentConfig.key} (window: ${windowSize}, phase: ${phaseName})`);
        }
      } else if (options.verbose) {
        console.error(`[UCM-DESC] No matching episodes found for ${agentConfig.key} (window: ${windowSize}, phase: ${phaseName})`);
      }
    }
  } catch (error) {
    // DESC injection is optional - continue without it (graceful fallback)
    if (options.verbose) {
      console.error(`[UCM-DESC] Injection skipped: ${error}`);
    }
  }

  // [SONA-PATTERNS] Inject learned patterns from past successful executions
  // Queries SonaEngine for top-weighted patterns and appends to prompt
  let patternsInjectionResult: { patternsUsed: number; patternIds: string[]; totalWeight: number } = { patternsUsed: 0, patternIds: [], totalWeight: 0 };
  try {
    const patterns = await getTopPatternsForAgent(agentConfig.key, 3);
    if (patterns.length > 0) {
      const patternsPrompt = formatPatternsForPrompt(patterns);
      prompt = prompt + patternsPrompt;
      patternsInjectionResult = {
        patternsUsed: patterns.length,
        patternIds: patterns.map(p => p.patternId),
        totalWeight: patterns.reduce((sum, p) => sum + p.weight, 0),
      };

      if (options.verbose) {
        console.error(`[SONA-PATTERNS] Injected ${patterns.length} learned patterns for ${agentConfig.key} (total weight: ${patternsInjectionResult.totalWeight.toFixed(2)})`);
      }
    } else if (options.verbose) {
      console.error(`[SONA-PATTERNS] No learned patterns found for ${agentConfig.key}`);
    }
  } catch (error) {
    // Pattern injection is optional - continue without it (graceful fallback)
    if (options.verbose) {
      console.error(`[SONA-PATTERNS] Injection skipped: ${error}`);
    }
  }

  // Build AgentDetails using data from getNextAgent() result (TASK-CLI-003)
  const agentDetails: AgentDetails = {
    index: agentIndex,  // From nextAgentResult
    key: agentConfig.key,
    name: agentConfig.name,
    phase: phase.id,  // From nextAgentResult.phase
    phaseName: phase.name,  // From nextAgentResult.phase
    prompt,
    dependencies: agentConfig.dependencies,
    timeout: agentConfig.timeout,
    critical: agentConfig.critical,
    expectedOutputs: agentConfig.expectedOutputs
  };

  // Calculate progress using data from getNextAgent() result
  const progress: ProgressInfo = {
    completed: session.completedAgents.length,
    total: nextAgentResult.totalAgents,  // From nextAgentResult
    percentage: Math.round((session.completedAgents.length / nextAgentResult.totalAgents) * 1000) / 10,
    currentPhase: phase.id,  // From nextAgentResult.phase
    phaseName: phase.name  // From nextAgentResult.phase
  };

  // Update session activity time
  await sessionManager.updateActivity(session);

  // [RULE-025] Create trajectory for agent execution tracking
  const trajectoryId = createAgentTrajectory(
    session.sessionId,
    agentConfig.key,
    session.currentAgentIndex,
    session.query
  );
  if (trajectoryId) {
    console.error(`[PHD-CLI] Created trajectory ${trajectoryId} for ${agentConfig.key}`);
  }

  // Emit step_started event for dashboard observability
  emitPipelineEvent({
    component: 'pipeline',
    operation: 'step_started',
    status: 'running',
    metadata: {
      pipelineId: session.pipelineId,
      stepId: `step_${session.pipelineId}_${session.currentAgentIndex}`,
      stepName: agentConfig.key,
      stepIndex: session.currentAgentIndex,
      agentType: agentConfig.key,
      phase: getPhaseName(agentConfig.phase),
      totalSteps: totalAgents,
      progress: progress.percentage,
    },
  });

  if (options.verbose) {
    console.error(`[DEBUG] Next agent: ${agentConfig.key}`);
    console.error(`[DEBUG] Phase: ${agentConfig.phase} (${getPhaseName(agentConfig.phase)})`);
    console.error(`[DEBUG] Progress: ${progress.percentage}%`);
  }

  return {
    sessionId: session.sessionId,
    status: 'next',
    progress,
    agent: agentDetails,
    desc: descInjectionResult.episodesUsed > 0 ? {
      episodesInjected: descInjectionResult.episodesUsed,
      episodeIds: descInjectionResult.episodeIds,
      windowSize: descInjectionResult.windowSize,
    } : undefined,
    patterns: patternsInjectionResult.patternsUsed > 0 ? {
      patternsInjected: patternsInjectionResult.patternsUsed,
      patternIds: patternsInjectionResult.patternIds,
      totalWeight: patternsInjectionResult.totalWeight,
    } : undefined,
  };
}

// ============================================================================
// TASK-PIPE-005: Complete Command
// ============================================================================

/**
 * complete command - Mark agent as complete and optionally store output
 * [REQ-PIPE-003, REQ-PIPE-024]
 */
program
  .command('complete <session-id> <agent-key>')
  .description('Mark agent as complete and optionally store output')
  .option('--result <json>', 'Agent output as JSON string')
  .option('--file <path>', 'Agent output from file')
  .option('--force', 'Mark complete even without output (not recommended)')
  .option('--json', 'Output as JSON (default: true)', true)
  .action(async (sessionId: string, agentKey: string, options: CompleteOptions) => {
    try {
      const response = await commandComplete(sessionId, agentKey, options);
      console.log(JSON.stringify(response, null, 2));
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Execute complete command
 * [REQ-PIPE-003, REQ-PIPE-024]
 *
 * @param sessionId - Session ID to update
 * @param agentKey - Agent key being completed
 * @param options - Command options
 * @param sessionBasePath - Optional base path for session storage (for testing)
 */
async function commandComplete(
  sessionId: string,
  agentKey: string,
  options: CompleteOptions,
  sessionBasePath?: string
): Promise<CompleteResponse> {
  const sessionManager = sessionBasePath ? new SessionManager(sessionBasePath) : new SessionManager();
  const pipelineLoader = new PipelineConfigLoader();

  // Load session
  const session = await sessionManager.loadSession(sessionId);

  // Check not expired
  if (sessionManager.isSessionExpired(session)) {
    throw new SessionExpiredError(sessionId);
  }

  // Load static pipeline config
  const pipelineConfig = await pipelineLoader.loadPipelineConfig();

  // Determine total agents (dynamic if available, else static)
  const totalAgents = session.dynamicTotalAgents || pipelineConfig.agents.length;

  // Check if pipeline already complete
  if (session.currentAgentIndex >= totalAgents) {
    throw new Error('Pipeline already complete');
  }

  // Get current agent key using dynamic routing [DYNAMIC-004]
  let expectedAgentKey: string;

  if (session.dynamicPhase6Agents) {
    const phase6End = PHASE_6_START_INDEX + session.dynamicPhase6Agents.length - 1;

    if (session.currentAgentIndex < PHASE_6_START_INDEX) {
      // Phase 1-5: use static agent
      const staticAgent = pipelineConfig.agents[session.currentAgentIndex];
      expectedAgentKey = staticAgent?.key || '';
    } else if (session.currentAgentIndex <= phase6End) {
      // Phase 6: use dynamic agent
      const phase6Index = session.currentAgentIndex - PHASE_6_START_INDEX;
      const dynamicAgent = session.dynamicPhase6Agents[phase6Index];
      expectedAgentKey = dynamicAgent?.key || '';
    } else {
      // Phase 7: map to static agents
      const phase7Offset = session.currentAgentIndex - (phase6End + 1);
      const staticIndex = STATIC_PHASE_7_START_INDEX + phase7Offset;
      const staticAgent = await pipelineLoader.getAgentByIndex(staticIndex);
      expectedAgentKey = staticAgent?.key || '';
    }
  } else {
    // No dynamic agents, use static
    const staticAgent = pipelineConfig.agents[session.currentAgentIndex];
    expectedAgentKey = staticAgent?.key || '';
  }

  if (!expectedAgentKey) {
    throw new Error('Pipeline already complete');
  }

  // [REQ-PIPE-003] Validate agent-key matches current agent
  if (expectedAgentKey !== agentKey) {
    throw new AgentMismatchError(expectedAgentKey, agentKey);
  }

  // [REQ-PIPE-024] Parse and store output if provided
  let output: unknown = null;

  if (options.result) {
    try {
      output = JSON.parse(options.result);
    } catch {
      // INTENTIONAL: JSON parse error - still complete agent, but warn user (logged via console.error)
      console.error(JSON.stringify({
        warning: 'Invalid JSON in --result parameter; agent marked complete without output'
      }));
    }
  } else if (options.file) {
    const fs = await import('fs/promises');
    try {
      const content = await fs.readFile(options.file, 'utf-8');
      try {
        output = JSON.parse(content);
      } catch {
        // INTENTIONAL: JSON parse error in file - warn user but still complete agent
        console.error(JSON.stringify({
          warning: 'Invalid JSON in file; agent marked complete without output'
        }));
      }
    } catch (err) {
      console.error(JSON.stringify({
        warning: `Could not read file ${options.file}; agent marked complete without output`
      }));
    }
  }

  // [REQ-PIPE-026] Auto-read output from expected location if not explicitly provided
  if (output === null) {
    // Compute researchDir from session or generate from slug
    const researchDir = session.researchDir ||
      path.join(process.cwd(), 'docs/research', session.slug || generateSlug(session.query));

    // Store researchDir in session if not already set (for legacy sessions)
    if (!session.researchDir) {
      session.researchDir = researchDir;
    }

    const autoRead = await tryReadAgentOutput(researchDir, session.currentAgentIndex, agentKey);
    if (autoRead) {
      output = {
        status: 'complete',
        content: autoRead.content,
        output_file: autoRead.outputPath,
        auto_captured: true,
        word_count: autoRead.content.split(/\s+/).length,
      };
      console.error(JSON.stringify({
        info: `[REQ-PIPE-026] Auto-captured output from: ${autoRead.outputPath}`
      }));
    } else {
      console.error(JSON.stringify({
        warning: `[REQ-PIPE-026] No output file found for ${agentKey} at index ${session.currentAgentIndex}`
      }));
    }
  }

  // Update session state - ONLY mark complete if output was captured
  // [BUG-FIX-001] Prevent state/file desync by requiring output verification
  if (output === null && !options.force) {
    // Output is required unless --force flag is used
    throw new Error(
      `[PIPELINE-ERROR] Agent "${agentKey}" cannot be marked complete: no output captured.\n` +
      `Expected output file at index ${session.currentAgentIndex} or via --result/--file options.\n` +
      `Use --force to mark complete without output (not recommended).`
    );
  }

  session.completedAgents.push(agentKey);

  if (output !== null) {
    session.agentOutputs[agentKey] = output;
  } else {
    // Log warning when --force is used without output
    console.error(JSON.stringify({
      warning: `[BUG-FIX-001] Agent "${agentKey}" marked complete without output (--force used)`
    }));
  }

  // TASK-CLI-004: Get agent config for memory key lookup
  // Uses canonical PHD_AGENTS configuration for 46-agent pipeline
  const completedAgentConfig = getCanonicalAgentByKey(agentKey);
  const agentMemoryKey = completedAgentConfig?.memoryKeys[0] || `research/output/${agentKey}`;

  // TASK-CLI-004: Store agent completion data to memory [RULE-025]
  // Store using the agent's configured memoryKey for retrieval by subsequent agents
  if (output !== null) {
    const agentCompletionData = {
      agentKey,
      phase: session.currentPhase,
      completedAt: new Date().toISOString(),
      sessionId: session.sessionId,
      output,
      outputSummary: typeof output === 'object' && output !== null
        ? (output as Record<string, unknown>).summary || (output as Record<string, unknown>).result || 'Completed'
        : String(output).substring(0, 200),
    };

    // Store to agent's memory key (non-blocking)
    storeToMemory(agentMemoryKey, agentCompletionData).then((stored) => {
      if (stored) {
        console.error(`[MEMORY] Agent output stored: ${agentMemoryKey}`);
      }
    });

    // Also store to agent-specific completion key for task completion tracking
    const completionKey = `completion/${session.sessionId}/${agentKey}`;
    storeToMemory(completionKey, {
      status: 'complete',
      agentKey,
      agentIndex: session.currentAgentIndex,
      phase: session.currentPhase,
      timestamp: Date.now(),
    }).catch(() => {
      // Silent fail for completion tracking
    });
  }

  // TASK-CONFIG-003: Track current phase BEFORE incrementing
  const previousPhase = session.currentPhase;

  // Increment to next agent
  session.currentAgentIndex += 1;

  // TASK-CONFIG-003: Calculate next phase with validation
  let nextPhase = session.currentPhase;

  // Update phase based on new index using dynamic routing
  if (session.currentAgentIndex < totalAgents) {
    if (session.dynamicPhase6Agents) {
      const phase6End = PHASE_6_START_INDEX + session.dynamicPhase6Agents.length - 1;

      if (session.currentAgentIndex < PHASE_6_START_INDEX) {
        const nextAgent = pipelineConfig.agents[session.currentAgentIndex];
        nextPhase = nextAgent?.phase || session.currentPhase;
      } else if (session.currentAgentIndex <= phase6End) {
        nextPhase = 6; // Writing phase
      } else {
        nextPhase = 7; // Validation phase
      }
    } else if (session.currentAgentIndex < pipelineConfig.agents.length) {
      const nextAgent = pipelineConfig.agents[session.currentAgentIndex];
      nextPhase = nextAgent?.phase || session.currentPhase;
    }
  }

  // TASK-CONFIG-003: Validate phase transition (RULE-022)
  // Phase transitions must be sequential - no skipping phases
  if (nextPhase !== previousPhase) {
    // Validate the transition is allowed
    if (!validatePhaseTransition(previousPhase, nextPhase)) {
      console.error(`[PHASE-VALIDATION] WARNING: Invalid phase transition detected (${previousPhase} -> ${nextPhase})`);
      // In production, this should not happen as agents are ordered by phase
      // Log but continue - don't throw to avoid breaking the pipeline
    }

    // TASK-CONFIG-003: Verify current phase is complete before transitioning (RULE-022)
    if (!isPhaseComplete(session, previousPhase)) {
      console.error(`[PHASE-VALIDATION] WARNING: Phase ${previousPhase} incomplete, but transitioning to Phase ${nextPhase}`);
      // Log progress for debugging
      const progress = getPhaseProgress(session, previousPhase);
      console.error(`[PHASE-VALIDATION] Phase ${previousPhase} progress: ${progress.completed}/${progress.total} (${progress.percentage}%)`);
      console.error(`[PHASE-VALIDATION] Remaining in Phase ${previousPhase}: ${progress.remainingAgents.join(', ')}`);
    } else {
      console.error(`[PHASE-VALIDATION] Phase ${previousPhase} complete. Transitioning to Phase ${nextPhase}.`);
    }
  }

  // Apply the validated phase
  session.currentPhase = nextPhase;

  // Update activity time
  session.lastActivityTime = Date.now();

  // Persist updated session
  await sessionManager.saveSession(session);

  // [RULE-028] Record feedback for completed agent BEFORE acknowledgment
  // Pass previousPhase for context-aware quality assessment (RULE-033, RULE-034)
  // Pass agentIndex for trajectory ID reconstruction after CLI restart
  const completedAgentIndex = session.currentAgentIndex - 1;
  const feedbackRecorded = await recordAgentFeedback(
    session.sessionId,
    agentKey,
    output,
    previousPhase,
    completedAgentIndex
  );
  if (feedbackRecorded) {
    console.error(`[PHD-CLI] Feedback persisted for ${agentKey}`);
  }

  // Emit step_completed event for dashboard observability
  emitPipelineEvent({
    component: 'pipeline',
    operation: 'step_completed',
    status: 'success',
    durationMs: Date.now() - session.lastActivityTime,
    metadata: {
      pipelineId: session.pipelineId,
      stepId: `step_${session.pipelineId}_${session.currentAgentIndex - 1}`,
      stepName: agentKey,
      agentType: agentKey,
      phase: getPhaseName(session.currentPhase),
      completedSteps: session.completedAgents.length,
      totalSteps: totalAgents,
      progress: Math.round((session.completedAgents.length / totalAgents) * 100),
    },
  });

  // [UCM-DESC] Store completed agent result as episode for future retrieval
  if (output !== null && typeof output === 'object') {
    try {
      const ucmClient = getUCMClient();
      if (await ucmClient.isHealthy()) {
        // Extract answer text from output (look for common summary fields)
        const outputObj = output as Record<string, unknown>;
        let answerText = '';

        if (typeof outputObj.summary === 'string') {
          answerText = outputObj.summary;
        } else if (typeof outputObj.result === 'string') {
          answerText = outputObj.result;
        } else if (typeof outputObj.output === 'string') {
          answerText = outputObj.output;
        } else if (typeof outputObj.content === 'string') {
          answerText = outputObj.content;
        } else {
          // Use JSON representation as answer
          answerText = JSON.stringify(output, null, 2);
        }

        // Get the original prompt from the current agent
        const agentConfig = session.dynamicPhase6Agents
          ? (session.currentAgentIndex - 1 < PHASE_6_START_INDEX
              ? pipelineConfig.agents[session.currentAgentIndex - 1]
              : session.dynamicPhase6Agents[session.currentAgentIndex - 1 - PHASE_6_START_INDEX])
          : pipelineConfig.agents[session.currentAgentIndex - 1];

        const queryText = agentConfig
          ? `Agent: ${agentConfig.name}\nPhase: ${getPhaseName(agentConfig.phase)}\nTask: ${session.query}`
          : `Agent: ${agentKey}\nTask: ${session.query}`;

        await ucmClient.storeEpisode(queryText, answerText, {
          sessionId: session.sessionId,
          agentKey,
          phase: session.currentPhase,
          pipelineId: session.pipelineId,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      // DESC storage is optional - continue without it
      console.error(`[UCM-DESC] Failed to store episode: ${error}`);
    }
  }

  // Determine next agent key (if any) using dynamic routing
  let nextAgentKey: string | undefined;

  if (session.currentAgentIndex < totalAgents) {
    if (session.dynamicPhase6Agents) {
      const phase6End = PHASE_6_START_INDEX + session.dynamicPhase6Agents.length - 1;

      if (session.currentAgentIndex < PHASE_6_START_INDEX) {
        nextAgentKey = pipelineConfig.agents[session.currentAgentIndex]?.key;
      } else if (session.currentAgentIndex <= phase6End) {
        const phase6Index = session.currentAgentIndex - PHASE_6_START_INDEX;
        nextAgentKey = session.dynamicPhase6Agents[phase6Index]?.key;
      } else {
        const phase7Offset = session.currentAgentIndex - (phase6End + 1);
        const staticIndex = STATIC_PHASE_7_START_INDEX + phase7Offset;
        const staticAgent = await pipelineLoader.getAgentByIndex(staticIndex);
        nextAgentKey = staticAgent?.key;
      }
    } else if (session.currentAgentIndex < pipelineConfig.agents.length) {
      nextAgentKey = pipelineConfig.agents[session.currentAgentIndex]?.key;
    }
  }

  // [PHASE-8-AUTO] Check if pipeline is complete and trigger Phase 8 automatically
  // TASK-CONFIG-003: Use isReadyForPhase8 for proper validation
  const pipelineComplete = !nextAgentKey && session.currentAgentIndex >= totalAgents;
  const readyForPhase8 = isReadyForPhase8(session);

  if (pipelineComplete) {
    // TASK-CONFIG-003: Verify all phases are complete before triggering Phase 8
    if (!readyForPhase8) {
      console.error('[PHASE-VALIDATION] WARNING: Pipeline marked complete but not all phases verified complete');
      // Log which phases are incomplete
      for (let phaseId = 1; phaseId <= 7; phaseId++) {
        if (!isPhaseComplete(session, phaseId)) {
          const progress = getPhaseProgress(session, phaseId);
          console.error(`[PHASE-VALIDATION] Phase ${phaseId} incomplete: ${progress.completed}/${progress.total}`);
        }
      }
    }

    console.error('[Pipeline] All Phase 1-7 agents complete. Triggering Phase 8 (finalize)...');

    // TASK-CLI-004: Update session for Phase 8 triggering [RULE-021]
    session.lastActivityTime = Date.now();
    await sessionManager.saveSession(session);

    // TASK-CLI-004: Store session state update to memory before Phase 8
    // Build new object with phase8 status (PhdSessionState has readonly properties)
    const phase8SessionState: PhdSessionState = {
      ...buildSessionStateForMemory(session),
      status: 'phase8',
    };
    const sessionMemoryKey = `session/${session.sessionId}`;
    storeToMemory(sessionMemoryKey, phase8SessionState).then((stored) => {
      if (stored) {
        console.error(`[MEMORY] Session status updated to phase8: ${sessionMemoryKey}`);
      }
    });

    // Emit pipeline completion event
    emitPipelineEvent({
      component: 'pipeline',
      operation: 'phases_1_7_complete',
      status: 'success',
      metadata: {
        pipelineId: session.pipelineId,
        completedAgents: session.completedAgents.length,
        totalAgents,
        triggeringPhase8: true,
      },
    });

    // Extract slug from session (stored during init)
    const slug = session.slug || session.pipelineId;

    // [PHASE-8-AUTO-FIX] Execute Phase 8 FULLY AUTOMATICALLY
    // RULE-022: Phase 7 → Phase 8 automatic with full execution
    // Calls execute() which runs: MAPPING → WRITING → COMBINING → VALIDATING → COMPLETED
    // Cross-chapter context tracking enabled via sessionId
    try {
      const phase8Result = await executePhase8Automatically(slug, session.styleProfileId, session.sessionId);

      if (phase8Result.success) {
        console.error('[Phase 8] COMPLETED AUTOMATICALLY');
        console.error(`[Phase 8] Chapters generated: ${phase8Result.chaptersGenerated}`);
        console.error(`[Phase 8] Total words: ${phase8Result.totalWords}`);
        console.error(`[Phase 8] Final paper: ${phase8Result.outputPath}`);

        return {
          success: true,
          nextAgent: nextAgentKey,
          pipelineComplete,
          phase8Triggered: true,
          phase8Completed: true,
          phase8Result: {
            outputPath: phase8Result.outputPath,
            chaptersGenerated: phase8Result.chaptersGenerated,
            totalWords: phase8Result.totalWords,
            totalCitations: phase8Result.totalCitations
          }
        };
      } else {
        console.error(`[Phase 8] Automatic execution failed. Warnings: ${phase8Result.warnings.join(', ')}`);
        console.error('[Phase 8] Run manually: npx tsx src/god-agent/cli/phd-cli.ts finalize --slug ' + slug);
      }
    } catch (error) {
      console.error(`[Phase 8] Automatic execution failed: ${error}`);
      console.error('[Phase 8] Run manually: npx tsx src/god-agent/cli/phd-cli.ts finalize --slug ' + slug);
    }
  }

  return {
    success: true,
    nextAgent: nextAgentKey,
    pipelineComplete,
    phase8Triggered: pipelineComplete
  };
}

/**
 * Prepare Phase 8 for Claude Code execution
 * Returns Phase8PrepareResult with prompts for Claude Code Task tool
 * Called SYNCHRONOUSLY so prompts are included in the pipeline response
 *
 * @param slug - Research session slug
 * @param styleProfileId - Optional style profile ID
 * @returns Phase8PrepareResult with chapter prompts for Claude Code
 */
async function preparePhase8ForClaudeCode(
  slug: string,
  styleProfileId?: string
): Promise<import('./final-stage/types.js').Phase8PrepareResult> {
  console.error(`[Phase 8] Preparing for Claude Code execution: ${slug}`);
  console.error('[Phase 8] Using ClaudeFlow methodology with DYNAMIC agents per chapter');

  const basePath = process.cwd();
  const orchestrator = new FinalStageOrchestrator(basePath, slug);

  // Set up progress callback
  orchestrator.onProgress((report: ProgressReport) => {
    const progress = report.total > 0 ? Math.round((report.current / report.total) * 100) : 0;
    console.error(`[Phase 8] ${report.phase}: ${report.message} (${progress}%)`);
  });

  // Call prepareForClaudeCode which:
  // - Scans research outputs
  // - Summarizes sources
  // - Maps to chapters
  // - Generates 4-part ClaudeFlow prompts
  // - Uses DYNAMIC agent assignment from dissertation-architect
  const result = await orchestrator.prepareForClaudeCode({
    force: false,
    verbose: false,
    threshold: 0.30,
    styleProfileId,
  });

  if (result.success) {
    // Write prompts to file as backup
    const promptsFilePath = path.join(basePath, 'docs', 'research', slug, 'phase8-prompts.json');
    await fs.mkdir(path.dirname(promptsFilePath), { recursive: true });
    await fs.writeFile(promptsFilePath, JSON.stringify(result, null, 2), 'utf-8');
    console.error(`[Phase 8] Prompts also saved to: ${promptsFilePath}`);
  }

  return result;
}

/**
 * Execute Phase 8 FULLY AUTOMATICALLY without manual Task tool intervention
 * [PHASE-8-AUTO-FIX] Implements RULE-022: Phase 7 → Phase 8 automatic
 *
 * This function calls the full execute() pipeline which:
 * - INITIALIZING: Loads chapter structure and style profile
 * - SCANNING: Scans for research output files from phases 1-7
 * - SUMMARIZING: Extracts summaries from all agent outputs
 * - MAPPING: Maps sources to chapters semantically
 * - WRITING: Writes all chapters using the ChapterWriterAgent
 * - COMBINING: Combines chapters into final paper via PaperCombiner
 * - VALIDATING: Validates the combined output
 * - COMPLETED: Final paper written to output path
 *
 * @param slug - Research session slug
 * @param styleProfileId - Optional style profile ID
 * @returns FinalStageResult with outputPath to final combined paper
 */
async function executePhase8Automatically(
  slug: string,
  styleProfileId?: string,
  sessionId?: string
): Promise<import('./final-stage/types.js').FinalStageResult> {
  console.error(`[Phase 8] AUTOMATIC EXECUTION starting for: ${slug}`);
  console.error('[Phase 8] State machine: MAPPING → WRITING → COMBINING → VALIDATING → COMPLETED');

  const basePath = process.cwd();
  const orchestrator = new FinalStageOrchestrator(basePath, slug);

  // Set up progress callback for real-time updates
  orchestrator.onProgress((report: ProgressReport) => {
    const progress = report.total > 0 ? Math.round((report.current / report.total) * 100) : 0;
    console.error(`[Phase 8] ${report.phase}: ${report.message} (${progress}%)`);
  });

  // Set up context management for cross-chapter coherence
  // This tracks arguments, forward references, and term definitions
  if (sessionId) {
    const sessionManager = new SessionManager();
    const contextStoragePath = path.join(sessionManager.getSessionDirectory(), sessionId);

    // Initialize or load context manager
    const contextManager = await getOrCreateContextManager(
      sessionId,
      contextStoragePath,
      slug // Use slug as title placeholder
    );

    // Register chapter completion callback for context extraction
    orchestrator.onChapterComplete(async (chapterNumber, chapterContent, chapterTitle) => {
      console.error(`[CONTEXT] Extracting context from Chapter ${chapterNumber}`);
      await contextManager.onChapterComplete(chapterNumber, chapterContent, chapterTitle);
    });

    console.error('[Phase 8] Cross-chapter context tracking enabled');
  }

  // Call execute() which runs the FULL pipeline including WRITING and COMBINING
  // This produces the final combined paper automatically
  const result = await orchestrator.execute({
    force: false,
    verbose: process.env.PHD_CLI_DEBUG === 'true',
    threshold: 0.30,
    sequential: true, // RULE-015: Sequential execution
    styleProfileId,
  });

  if (result.success && result.outputPath) {
    console.error(`[Phase 8] AUTOMATIC EXECUTION COMPLETE`);
    console.error(`[Phase 8] Final paper: ${result.outputPath}`);
    console.error(`[Phase 8] Total words: ${result.totalWords}`);
    console.error(`[Phase 8] Chapters: ${result.chaptersGenerated}`);

    // Run dissertation coherence validation
    if (sessionId) {
      console.error('[Phase 8] Running dissertation coherence validation...');
      const validationReport = await validateDissertationCoherence(sessionId);
      if (validationReport) {
        console.error(`[Phase 8] Coherence score: ${(validationReport.coherenceScore * 100).toFixed(0)}%`);
        if (validationReport.totalIssues > 0) {
          console.error(`[Phase 8] Total coherence issues: ${validationReport.totalIssues}`);
        }
      }
    }
  }

  return result;
}

/**
 * Trigger Phase 8 finalize after pipeline completion (LEGACY - kept for backward compatibility)
 * [PHASE-8-AUTO] Automatic integration with main pipeline
 *
 * @param slug - Research session slug
 * @param styleProfileId - Optional style profile ID
 * @deprecated Use executePhase8Automatically() for full auto execution
 */
async function triggerPhase8Finalize(slug: string, styleProfileId?: string): Promise<void> {
  console.error(`[Phase 8] Starting Claude Code preparation for: ${slug}`);
  console.error('[Phase 8] Using ClaudeFlow methodology with DYNAMIC agents per chapter');

  const basePath = process.cwd();
  const orchestrator = new FinalStageOrchestrator(basePath, slug);

  // Set up progress callback
  orchestrator.onProgress((report: ProgressReport) => {
    const progress = report.total > 0 ? Math.round((report.current / report.total) * 100) : 0;
    console.error(`[Phase 8] ${report.phase}: ${report.message} (${progress}%)`);
  });

  try {
    // Use prepareForClaudeCode() which:
    // - Uses DYNAMIC agent assignment from dissertation-architect structure
    // - Generates 4-part ClaudeFlow prompts
    // - Returns Phase8PrepareResult for Claude Code Task tool execution
    const result = await orchestrator.prepareForClaudeCode({
      force: false, // Don't overwrite existing final output
      verbose: false,
      threshold: 0.30,
      styleProfileId,
    });

    if (result.success) {
      console.error('[Phase 8] SUCCESS: Preparation complete for Claude Code');
      console.error(`[Phase 8] Total chapters: ${result.totalChapters}`);
      console.error('[Phase 8] DYNAMIC agents assigned per chapter:');
      result.chapterPrompts.forEach(cp => {
        console.error(`  - Chapter ${cp.chapterNumber} (${cp.chapterTitle}): ${cp.subagentType}`);
      });

      // Write prepared prompts to file for Claude Code to consume
      const promptsFilePath = path.join(basePath, 'docs', 'research', slug, 'phase8-prompts.json');
      await fs.mkdir(path.dirname(promptsFilePath), { recursive: true });
      await fs.writeFile(promptsFilePath, JSON.stringify(result, null, 2), 'utf-8');
      console.error(`[Phase 8] Prompts written to: ${promptsFilePath}`);

      // TASK-CLI-004: Store phase 8 prep state to memory [RULE-021]
      const prepData = {
        sessionSlug: slug,
        status: 'phase8_prepared',
        preparedAt: new Date().toISOString(),
        promptsFilePath,
        totalChapters: result.totalChapters,
        agentsAssigned: result.chapterPrompts.map(cp => ({
          chapter: cp.chapterNumber,
          agent: cp.subagentType
        })),
        memoryNamespace: result.memoryNamespace,
        phase8Ready: true,
      };
      storeToMemory(`session/${slug}/phase8prep`, prepData).then((stored) => {
        if (stored) {
          console.error(`[MEMORY] Phase 8 preparation state stored for: ${slug}`);
        }
      });

      // TASK-CLI-004: Update session status to "phase8_ready" in memory
      storeToMemory(`session/${slug}`, {
        status: 'phase8_ready',
        preparedAt: new Date().toISOString(),
        phase8PromptsPath: promptsFilePath,
      }).then((stored) => {
        if (stored) {
          console.error(`[MEMORY] Session status updated to phase8_ready: ${slug}`);
        }
      });

      // Emit Phase 8 preparation event
      emitPipelineEvent({
        component: 'pipeline',
        operation: 'phase8_prepared_for_claude_code',
        status: 'success',
        metadata: {
          slug,
          promptsFilePath,
          totalChapters: result.totalChapters,
          dynamicAgents: true,
        },
      });

      console.error('');
      console.error('====================================================================');
      console.error('PHASE 8 READY FOR CLAUDE CODE TASK TOOL EXECUTION');
      console.error('====================================================================');
      console.error(`Prompts file: ${promptsFilePath}`);
      console.error('');
      console.error('Execute in Claude Code with SEQUENTIAL chapter processing:');
      console.error('For each chapter in phase8-prompts.json.chapterPrompts:');
      console.error('  1. Task(subagent_type=chapterPrompts[i].subagentType, prompt=chapterPrompts[i].prompt)');
      console.error('  2. Wait for completion before starting next chapter');
      console.error('  3. Verify output written to chapterPrompts[i].outputPath');
      console.error('====================================================================');
    } else {
      console.error(`[Phase 8] FAILED: ${result.errors?.join(', ')}`);
      console.error(`[Phase 8] Warnings: ${result.warnings?.join(', ')}`);

      // TASK-CLI-004: Store failure state to memory
      storeToMemory(`session/${slug}/phase8prep`, {
        sessionSlug: slug,
        status: 'failed',
        failedAt: new Date().toISOString(),
        errors: result.errors,
        warnings: result.warnings,
        phase8Ready: false,
      }).then((stored) => {
        if (stored) {
          console.error(`[MEMORY] Phase 8 failure state stored for: ${slug}`);
        }
      });
    }
  } catch (error) {
    console.error(`[Phase 8] Error during preparation:`, error);
    throw error;
  }
}

// ============================================================================
// TASK-PIPE-006: Status/List/Resume/Abort Commands
// ============================================================================

/**
 * status command - Show detailed session progress
 * [REQ-PIPE-004]
 */
program
  .command('status <session-id>')
  .description('Show detailed session progress')
  .option('--json', 'Output as JSON (default: true)', true)
  .action(async (sessionId: string, options: StatusOptions) => {
    try {
      const response = await commandStatus(sessionId, options);
      console.log(JSON.stringify(response, null, 2));
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Extended status response with phase-by-phase progress
 * TASK-CONFIG-003: Enhanced phase progress reporting
 */
interface ExtendedStatusResponse extends StatusResponse {
  /** Phase-by-phase progress breakdown (TASK-CONFIG-003) */
  phaseProgress?: Array<{
    phaseId: number;
    phaseName: string;
    progress: PhaseProgress;
    isComplete: boolean;
    isCurrent: boolean;
  }>;
  /** Remaining agents in current phase */
  remainingInCurrentPhase?: string[];
  /** Ready for Phase 8 finalization */
  readyForPhase8?: boolean;
}

/**
 * Execute status command
 * [REQ-PIPE-004]
 * TASK-CONFIG-003: Enhanced with phase-by-phase progress reporting
 *
 * @param sessionId - Session ID to get status for
 * @param options - Command options
 * @param sessionBasePath - Optional base path for session storage (for testing)
 */
async function commandStatus(
  sessionId: string,
  options: StatusOptions,
  sessionBasePath?: string
): Promise<ExtendedStatusResponse> {
  const sessionManager = sessionBasePath ? new SessionManager(sessionBasePath) : new SessionManager();
  const pipelineLoader = new PipelineConfigLoader();

  // Load session
  const session = await sessionManager.loadSession(sessionId);

  // Load pipeline config
  const pipelineConfig = await pipelineLoader.loadPipelineConfig();

  // Determine total agents (dynamic if available, else static)
  const totalAgents = session.dynamicTotalAgents || pipelineConfig.agents.length;

  // Get current agent based on dynamic routing (TASK-CONFIG-003)
  let currentAgentConfig: AgentConfig | null = null;

  if (session.currentAgentIndex < totalAgents) {
    if (session.dynamicPhase6Agents) {
      const phase6End = PHASE_6_START_INDEX + session.dynamicPhase6Agents.length - 1;

      if (session.currentAgentIndex < PHASE_6_START_INDEX) {
        // Phase 1-5: use static agent
        currentAgentConfig = pipelineConfig.agents[session.currentAgentIndex];
      } else if (session.currentAgentIndex <= phase6End) {
        // Phase 6: use dynamic agent
        const phase6Index = session.currentAgentIndex - PHASE_6_START_INDEX;
        const dynamicAgent = session.dynamicPhase6Agents[phase6Index];
        currentAgentConfig = {
          ...dynamicAgent,
          order: session.currentAgentIndex,
          description: '',
          inputs: [],
          outputs: dynamicAgent.expectedOutputs || []
        };
      } else {
        // Phase 7: map to static agents
        const phase7Offset = session.currentAgentIndex - (phase6End + 1);
        const staticIndex = STATIC_PHASE_7_START_INDEX + phase7Offset;
        currentAgentConfig = pipelineConfig.agents[staticIndex];
      }
    } else {
      // No dynamic agents, use static
      currentAgentConfig = pipelineConfig.agents[session.currentAgentIndex];
    }
  }

  // Build current agent details (simplified for status)
  const currentAgent: AgentDetails = currentAgentConfig ? {
    index: session.currentAgentIndex,
    key: currentAgentConfig.key,
    name: currentAgentConfig.name,
    phase: currentAgentConfig.phase,
    phaseName: getPhaseName(currentAgentConfig.phase),
    prompt: '', // Not needed for status
    dependencies: currentAgentConfig.dependencies,
    timeout: currentAgentConfig.timeout,
    critical: currentAgentConfig.critical,
    expectedOutputs: currentAgentConfig.expectedOutputs
  } : {
    index: totalAgents,
    key: 'complete',
    name: 'Pipeline Complete',
    phase: 7,
    phaseName: getPhaseName(7),
    prompt: '',
    dependencies: [],
    timeout: 0,
    critical: false,
    expectedOutputs: []
  };

  // Calculate progress
  const completed = session.completedAgents.length;
  const percentage = Math.round((completed / totalAgents) * 1000) / 10;

  // Calculate elapsed time
  const elapsedTime = Date.now() - session.startTime;

  // Truncate query for display (200 chars)
  const displayQuery = session.query.length > 200
    ? session.query.substring(0, 197) + '...'
    : session.query;

  // TASK-CONFIG-003: Build phase-by-phase progress
  const allPhaseProgress = getAllPhaseProgress(session);
  const phaseProgressWithStatus = allPhaseProgress.map(({ phaseId, phaseName, progress }) => ({
    phaseId,
    phaseName,
    progress,
    isComplete: isPhaseComplete(session, phaseId),
    isCurrent: phaseId === session.currentPhase,
  }));

  // Get remaining agents in current phase
  const currentPhaseProgress = getPhaseProgress(session, session.currentPhase);
  const remainingInCurrentPhase = currentPhaseProgress.remainingAgents;

  // Check if ready for Phase 8
  const readyForPhase8 = isReadyForPhase8(session);

  return {
    sessionId: session.sessionId,
    pipelineId: session.pipelineId,
    query: displayQuery,
    status: session.status,
    currentPhase: currentAgent.phase,
    phaseName: currentAgent.phaseName,
    currentAgent,
    progress: {
      completed,
      total: totalAgents,
      percentage
    },
    startTime: session.startTime,
    lastActivityTime: session.lastActivityTime,
    elapsedTime,
    errors: session.errors,
    // TASK-CONFIG-003: Phase progress reporting
    phaseProgress: phaseProgressWithStatus,
    remainingInCurrentPhase,
    readyForPhase8,
  };
}

/**
 * list command - List all active/recent sessions
 * [REQ-PIPE-005]
 */
program
  .command('list')
  .description('List all active/recent sessions')
  .option('--all', 'Include completed/expired sessions')
  .option('--json', 'Output as JSON (default: true)', true)
  .action(async (options: ListOptions) => {
    try {
      const response = await commandList(options);
      console.log(JSON.stringify(response, null, 2));
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Execute list command
 * [REQ-PIPE-005]
 *
 * @param options - Command options
 * @param sessionBasePath - Optional base path for session storage (for testing)
 */
async function commandList(
  options: ListOptions,
  sessionBasePath?: string
): Promise<ListResponse> {
  const sessionManager = sessionBasePath ? new SessionManager(sessionBasePath) : new SessionManager();

  // Get sessions - SessionManager.listSessions already filters by default
  const sessions = await sessionManager.listSessions({
    includeAll: options.all,
    maxAgeDays: options.all ? 365 : 7 // 7 days default, 1 year if --all
  });

  // Map to session list items
  const sessionItems: SessionListItem[] = sessions.map(session => ({
    sessionId: session.sessionId,
    pipelineId: session.pipelineId,
    query: session.query.length > 50
      ? session.query.substring(0, 47) + '...'
      : session.query,
    status: session.status,
    progress: Math.round((session.completedAgents.length / PHD_PIPELINE_AGENT_COUNT) * 1000) / 10, // 46 agents from phd-pipeline-config
    startTime: session.startTime,
    lastActivityTime: session.lastActivityTime
  }));

  return {
    sessions: sessionItems,
    total: sessionItems.length
  };
}

/**
 * resume command - Resume interrupted session
 * [REQ-PIPE-006]
 */
program
  .command('resume <session-id>')
  .description('Resume interrupted session')
  .option('--json', 'Output as JSON (default: true)', true)
  .action(async (sessionId: string, options: ResumeOptions) => {
    try {
      const response = await commandResume(sessionId, options);
      console.log(JSON.stringify(response, null, 2));
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Execute resume command
 * [REQ-PIPE-006]
 *
 * @param sessionId - Session ID to resume
 * @param options - Command options
 * @param sessionBasePath - Optional base path for session storage (for testing)
 */
async function commandResume(
  sessionId: string,
  options: ResumeOptions,
  sessionBasePath?: string
): Promise<ResumeResponse> {
  const sessionManager = sessionBasePath ? new SessionManager(sessionBasePath) : new SessionManager();
  const pipelineLoader = new PipelineConfigLoader();
  const styleInjector = new StyleInjector();
  const dynamicGenerator = new DynamicAgentGenerator();
  const structureLoader = new ChapterStructureLoader();

  // Load session
  const session = await sessionManager.loadSession(sessionId);

  // Check not expired
  if (sessionManager.isSessionExpired(session)) {
    throw new SessionExpiredError(sessionId);
  }

  // Load static pipeline config
  const staticConfig = await pipelineLoader.loadPipelineConfig();

  // CRITICAL: Detect Phase 6 entry and generate dynamic agents [DYNAMIC-001, DYNAMIC-002]
  if (!session.dynamicPhase6Agents && session.currentAgentIndex >= PHASE_6_START_INDEX) {
    const slug = session.slug || generateSlug(session.query);

    try {
      // Load locked chapter structure [DYNAMIC-002]
      const chapterStructure = await structureLoader.loadChapterStructure(slug);

      // Generate dynamic Phase 6 agents [DYNAMIC-001, DYNAMIC-004]
      const styleChars = styleInjector.getStyleCharacteristics(session.styleProfileId);
      const phase6Agents = await dynamicGenerator.generatePhase6Agents(
        chapterStructure,
        styleChars,
        slug
      );

      // Calculate total [DYNAMIC-007]
      const dynamicTotal = PHASE_1_5_AGENT_COUNT + phase6Agents.length + PHASE_7_AGENT_COUNT;

      // Store in session
      session.slug = slug;
      session.chapterStructure = chapterStructure;
      session.dynamicPhase6Agents = phase6Agents;
      session.dynamicTotalAgents = dynamicTotal;

      await sessionManager.saveSession(session);
    } catch (error) {
      // Chapter structure not ready - fall back to static agents
      // Silent fallback for resume
    }
  }

  // Determine total agents (dynamic if available, else static)
  const totalAgents = session.dynamicTotalAgents || staticConfig.agents.length;

  // Check if pipeline is complete
  if (session.currentAgentIndex >= totalAgents) {
    throw new Error('Pipeline already complete, cannot resume');
  }

  // Get appropriate agent based on current index
  let agentConfig: AgentConfig;

  if (session.dynamicPhase6Agents) {
    const phase6End = PHASE_6_START_INDEX + session.dynamicPhase6Agents.length - 1;

    if (session.currentAgentIndex < PHASE_6_START_INDEX) {
      // Phase 1-5: use static agent
      agentConfig = await pipelineLoader.getAgentByIndex(session.currentAgentIndex);
    } else if (session.currentAgentIndex <= phase6End) {
      // Phase 6: use dynamic agent [DYNAMIC-004]
      const phase6Index = session.currentAgentIndex - PHASE_6_START_INDEX;
      const dynamicAgent = session.dynamicPhase6Agents[phase6Index];
      // Convert DynamicAgentDetails to AgentConfig
      agentConfig = {
        ...dynamicAgent,
        order: session.currentAgentIndex,
        description: dynamicAgent.prompt || '',
        inputs: [],
        outputs: dynamicAgent.expectedOutputs || []
      };
    } else {
      // Phase 7: map to static agents
      const phase7Offset = session.currentAgentIndex - (phase6End + 1);
      const staticIndex = STATIC_PHASE_7_START_INDEX + phase7Offset;
      agentConfig = await pipelineLoader.getAgentByIndex(staticIndex);
    }
  } else {
    // No dynamic agents, use static
    agentConfig = await pipelineLoader.getAgentByIndex(session.currentAgentIndex);
  }

  // Compute researchDir (handle legacy sessions without it)
  const researchDir = session.researchDir ||
    path.join(process.cwd(), 'docs/research', session.slug || generateSlug(session.query));

  // Build prompt with style injection, query injection, and output context
// Build prompt with style injection, query injection, and output context
  const prompt = await styleInjector.buildAgentPrompt(
    agentConfig,
    session.styleProfileId,
    session.query,
    { researchDir, agentIndex: session.currentAgentIndex, agentKey: agentConfig.key },
    session.dataSourceMode ?? "external"
  );



  // Build agent details
  const agentDetails: AgentDetails = {
    index: session.currentAgentIndex,
    key: agentConfig.key,
    name: agentConfig.name,
    phase: agentConfig.phase,
    phaseName: getPhaseName(agentConfig.phase),
    prompt,
    dependencies: agentConfig.dependencies,
    timeout: agentConfig.timeout,
    critical: agentConfig.critical,
    expectedOutputs: agentConfig.expectedOutputs
  };

  // Calculate progress
  const progress = {
    completed: session.completedAgents.length,
    total: totalAgents,
    percentage: Math.round((session.completedAgents.length / totalAgents) * 1000) / 10
  };

  // Update activity time
  await sessionManager.updateActivity(session);

  return {
    sessionId: session.sessionId,
    resumed: true,
    agent: agentDetails,
    progress
  };
}

/**
 * abort command - Cancel session
 * [REQ-PIPE-007]
 */
program
  .command('abort <session-id>')
  .description('Cancel session and clean up')
  .option('--force', 'Force abort without confirmation')
  .option('--json', 'Output as JSON (default: true)', true)
  .action(async (sessionId: string, options: AbortOptions) => {
    try {
      const response = await commandAbort(sessionId, options);
      console.log(JSON.stringify(response, null, 2));
      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * Execute abort command
 * [REQ-PIPE-007]
 *
 * @param sessionId - Session ID to abort
 * @param options - Command options
 * @param sessionBasePath - Optional base path for session storage (for testing)
 */
async function commandAbort(
  sessionId: string,
  options: AbortOptions,
  sessionBasePath?: string
): Promise<AbortResponse> {
  const sessionManager = sessionBasePath ? new SessionManager(sessionBasePath) : new SessionManager();

  // Load session
  const session = await sessionManager.loadSession(sessionId);

  // Store completed count before update
  const completedCount = session.completedAgents.length;

  // Update session status to failed
  await sessionManager.updateStatus(session, 'failed');

  return {
    sessionId: session.sessionId,
    aborted: true,
    finalStatus: 'failed',
    completedAgents: completedCount
  };
}

// ============================================================================
// PARAGRAPH-LEVEL FEEDBACK COMMANDS
// Enables fine-grained style learning from user corrections
// ============================================================================

/**
 * CLI options interface for phd-feedback command
 */
interface FeedbackOptions {
  session: string;
  chapter: number;
  paragraph: number;
  correction?: string;
  soundsLikeMe?: string;  // 'true' or 'false' as string from CLI
  issueType?: string;
  issueDescription?: string;
  json?: boolean;
}

/**
 * CLI options interface for phd-learn command
 */
interface LearnOptions {
  session: string;
  json?: boolean;
  verbose?: boolean;
}

/**
 * CLI options interface for phd-drift command
 */
interface DriftOptions {
  session: string;
  chapter?: number;
  json?: boolean;
  verbose?: boolean;
}

/**
 * Get or create FeedbackIntegration for a session
 */
async function getOrCreateFeedbackIntegration(
  sessionId: string,
  sessionStoragePath: string,
  styleProfileId: string
): Promise<FeedbackIntegration> {
  let integration = feedbackIntegrations.get(sessionId);

  if (!integration) {
    // Load style profile for drift detection
    const styleManager = new StyleProfileManager();
    const profile = styleManager.getProfile(styleProfileId);

    // Analyze to get DeepStyleCharacteristics
    const deepAnalyzer = new DeepStyleAnalyzer();
    let deepStyle = deepAnalyzer.analyzeText('');  // Empty analysis as fallback

    if (profile?.characteristics) {
      // If profile has deep style characteristics, use them directly
      // Otherwise create from sample phrases
      const samplePhrases = profile.characteristics.samplePhrases ?? [];
      if (samplePhrases.length > 0) {
        // Join sample phrases to create representative text for analysis
        const sampleText = samplePhrases.join('. ');
        deepStyle = deepAnalyzer.analyzeText(sampleText);
      }
    }

    // Create feedback integration
    integration = createFeedbackIntegration(
      deepStyle,
      styleManager,
      sessionStoragePath,
      styleProfileId
    );

    await integration.initialize(sessionId);
    feedbackIntegrations.set(sessionId, integration);
  }

  return integration;
}

/**
 * phd-feedback command - Capture paragraph-level feedback
 * Captures user corrections and "sounds like me" feedback
 */
program
  .command('phd-feedback')
  .description('Capture feedback for a paragraph in the session')
  .requiredOption('--session <id>', 'Session ID')
  .requiredOption('--chapter <num>', 'Chapter number', parseInt)
  .requiredOption('--paragraph <idx>', 'Paragraph index', parseInt)
  .option('--correction <text>', 'User-corrected text')
  .option('--sounds-like-me <bool>', 'Does this sound like you? (true/false)')
  .option('--issue-type <type>', 'Issue type: word_choice, sentence_structure, tone, argument_style, citation_style, transition, other')
  .option('--issue-description <desc>', 'Description of the issue')
  .option('--json', 'Output as JSON (default: true)', true)
  .action(async (options: FeedbackOptions) => {
    try {
      const sessionManager = new SessionManager();
      const session = await sessionManager.loadSession(options.session);

      if (!session.researchDir) {
        throw new Error('Session has no research directory set');
      }

      // Get feedback integration
      const integration = await getOrCreateFeedbackIntegration(
        session.sessionId,
        path.dirname(sessionManager.getSessionDirectory()),
        session.styleProfileId
      );

      // Read the generated paragraph from the chapter file
      // Convention: chapter files are in {researchDir}/chapters/chapter-{num}.md
      const chapterPath = path.join(session.researchDir, 'chapters', `chapter-${options.chapter}.md`);
      let chapterContent: string;
      try {
        chapterContent = await fs.readFile(chapterPath, 'utf-8');
      } catch {
        throw new Error(`Chapter file not found: ${chapterPath}`);
      }

      // Extract the paragraph
      const paragraphs = chapterContent.split(/\n\n+/).filter(p => p.trim().length > 50);
      if (options.paragraph >= paragraphs.length) {
        throw new Error(`Paragraph index ${options.paragraph} out of range (0-${paragraphs.length - 1})`);
      }

      const generatedText = paragraphs[options.paragraph];

      // Build issues array if provided
      const issues = options.issueType ? [{
        type: options.issueType as 'word_choice' | 'sentence_structure' | 'tone' | 'argument_style' | 'citation_style' | 'transition' | 'other',
        description: options.issueDescription || '',
        originalSnippet: generatedText.substring(0, 100),
        correctedSnippet: options.correction?.substring(0, 100),
      }] : undefined;

      // Determine soundsLikeMe
      const soundsLikeMe = options.soundsLikeMe === 'true' ||
        (options.soundsLikeMe === undefined && !options.correction);

      // Capture the feedback
      await integration.captureFeedback(
        options.chapter,
        options.paragraph,
        generatedText,
        {
          soundsLikeMe,
          correction: options.correction,
          issues,
        }
      );

      const stats = integration.getStats();

      console.log(JSON.stringify({
        success: true,
        sessionId: session.sessionId,
        chapter: options.chapter,
        paragraph: options.paragraph,
        feedbackCaptured: true,
        soundsLikeMe,
        hasCorrection: !!options.correction,
        stats: {
          totalFeedback: stats.totalFeedback,
          contrastivePairs: stats.contrastivePairs,
          soundsLikeMeRatio: stats.soundsLikeMeRatio,
        }
      }, null, 2));

      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * phd-learn command - Process pending feedback and update style
 * Applies learned patterns from user corrections to improve style matching
 */
program
  .command('phd-learn')
  .description('Process pending feedback and learn style patterns')
  .requiredOption('--session <id>', 'Session ID')
  .option('--json', 'Output as JSON (default: true)', true)
  .option('--verbose', 'Enable verbose logging')
  .action(async (options: LearnOptions) => {
    try {
      const sessionManager = new SessionManager();
      const session = await sessionManager.loadSession(options.session);

      // Get feedback integration
      const integration = await getOrCreateFeedbackIntegration(
        session.sessionId,
        path.dirname(sessionManager.getSessionDirectory()),
        session.styleProfileId
      );

      if (options.verbose) {
        const stats = integration.getStats();
        console.error(`[PHD-LEARN] Session: ${session.sessionId}`);
        console.error(`[PHD-LEARN] Total feedback items: ${stats.totalFeedback}`);
        console.error(`[PHD-LEARN] Pending for processing: ${stats.totalFeedback - stats.processedCount}`);
      }

      // Process pending feedback
      const result = await integration.processPendingFeedback();

      if (options.verbose) {
        console.error(`[PHD-LEARN] Processed ${result.feedbackProcessed} feedback items`);
        console.error(`[PHD-LEARN] Learned ${result.patternsLearned} patterns`);
        console.error(`[PHD-LEARN] Style updated: ${result.styleUpdated}`);
      }

      // Get consistent patterns learned
      const consistentPatterns = integration.getConsistentPatterns();
      const antiPatterns = integration.getAntiPatterns();

      console.log(JSON.stringify({
        success: true,
        sessionId: session.sessionId,
        result: {
          feedbackProcessed: result.feedbackProcessed,
          patternsLearned: result.patternsLearned,
          styleUpdated: result.styleUpdated,
        },
        patterns: {
          consistent: consistentPatterns.slice(0, 10),
          antiPatterns: antiPatterns.slice(0, 10),
        },
        stats: integration.getStats(),
      }, null, 2));

      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * phd-drift command - Check style drift for current session
 * Analyzes generated text for deviation from user's style profile
 */
program
  .command('phd-drift')
  .description('Check style drift for session or specific chapter')
  .requiredOption('--session <id>', 'Session ID')
  .option('--chapter <num>', 'Specific chapter number to analyze', parseInt)
  .option('--json', 'Output as JSON (default: true)', true)
  .option('--verbose', 'Enable verbose logging')
  .action(async (options: DriftOptions) => {
    try {
      const sessionManager = new SessionManager();
      const session = await sessionManager.loadSession(options.session);

      if (!session.researchDir) {
        throw new Error('Session has no research directory set');
      }

      // Get feedback integration
      const integration = await getOrCreateFeedbackIntegration(
        session.sessionId,
        path.dirname(sessionManager.getSessionDirectory()),
        session.styleProfileId
      );

      if (options.chapter !== undefined) {
        // Analyze specific chapter
        const chapterPath = path.join(session.researchDir, 'chapters', `chapter-${options.chapter}.md`);
        let chapterContent: string;
        try {
          chapterContent = await fs.readFile(chapterPath, 'utf-8');
        } catch {
          throw new Error(`Chapter file not found: ${chapterPath}`);
        }

        const analysis = integration.analyzeChapterDrift(chapterContent);

        if (options.verbose) {
          console.error(`[PHD-DRIFT] Analyzing chapter ${options.chapter}`);
          console.error(`[PHD-DRIFT] Overall drift: ${(analysis.overallDrift * 100).toFixed(1)}%`);
          console.error(`[PHD-DRIFT] Worst paragraphs: ${analysis.worstParagraphs.join(', ') || 'none'}`);
        }

        console.log(JSON.stringify({
          success: true,
          sessionId: session.sessionId,
          chapter: options.chapter,
          analysis: {
            overallDrift: analysis.overallDrift,
            overallDriftPercent: `${(analysis.overallDrift * 100).toFixed(1)}%`,
            worstParagraphs: analysis.worstParagraphs,
            suggestions: analysis.suggestions,
          },
          alertLevel: analysis.overallDrift < 0.2 ? 'none' :
                      analysis.overallDrift < 0.4 ? 'minor' :
                      analysis.overallDrift < 0.6 ? 'moderate' : 'significant',
        }, null, 2));
      } else {
        // Analyze session overall
        const sessionAnalysis = integration.getDriftAnalysisForSession();

        if (options.verbose) {
          console.error(`[PHD-DRIFT] Session: ${session.sessionId}`);
          console.error(`[PHD-DRIFT] Total paragraphs analyzed: ${sessionAnalysis.totalParagraphs}`);
          console.error(`[PHD-DRIFT] Paragraphs with drift: ${sessionAnalysis.driftingParagraphs}`);
          console.error(`[PHD-DRIFT] Alert level: ${sessionAnalysis.alertLevel}`);
        }

        console.log(JSON.stringify({
          success: true,
          sessionId: session.sessionId,
          analysis: {
            totalParagraphs: sessionAnalysis.totalParagraphs,
            driftingParagraphs: sessionAnalysis.driftingParagraphs,
            averageDrift: sessionAnalysis.averageDrift,
            averageDriftPercent: `${(sessionAnalysis.averageDrift * 100).toFixed(1)}%`,
            alertLevel: sessionAnalysis.alertLevel,
          },
          stats: integration.getStats(),
        }, null, 2));
      }

      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

/**
 * phd-feedback-stats command - Get feedback statistics for a session
 */
program
  .command('phd-feedback-stats')
  .description('Get feedback and learning statistics for a session')
  .requiredOption('--session <id>', 'Session ID')
  .option('--json', 'Output as JSON (default: true)', true)
  .action(async (options: { session: string; json?: boolean }) => {
    try {
      const sessionManager = new SessionManager();
      const session = await sessionManager.loadSession(options.session);

      // Get feedback integration
      const integration = await getOrCreateFeedbackIntegration(
        session.sessionId,
        path.dirname(sessionManager.getSessionDirectory()),
        session.styleProfileId
      );

      const stats = integration.getStats();
      const commonIssues = integration.getMostCommonIssues();
      const consistentPatterns = integration.getConsistentPatterns().slice(0, 15);
      const antiPatterns = integration.getAntiPatterns().slice(0, 10);

      // Generate enhanced prompt preview
      const enhancedPrompt = await integration.getEnhancedStylePrompt();

      console.log(JSON.stringify({
        success: true,
        sessionId: session.sessionId,
        stats,
        commonIssues,
        patterns: {
          consistent: consistentPatterns,
          antiPatterns,
        },
        enhancedPromptPreview: enhancedPrompt.substring(0, 500) + (enhancedPrompt.length > 500 ? '...' : ''),
        enhancedPromptLength: enhancedPrompt.length,
      }, null, 2));

      process.exit(0);
    } catch (error) {
      handleError(error);
    }
  });

// ============================================================================
// TASK-003: Finalize Command (Phase 8 Final Assembly)
// ============================================================================

/**
 * CLI options interface for finalize command
 */
interface FinalizeCliOptions {
  slug: string;
  force?: boolean;
  dryRun?: boolean;
  threshold?: string;
  verbose?: boolean;
  sequential?: boolean;
  skipValidation?: boolean;
  /** Generate synthesis prompts for Claude Code instead of writing chapters */
  generatePrompts?: boolean;
  /** Style profile ID to use (overrides session lookup) */
  styleProfile?: string;
  /** Generate PDF from existing synthesized chapters (skips prompt generation) */
  generatePdf?: boolean;
}

/**
 * finalize command - Run Phase 8 final paper assembly
 * [REQ-PIPE-008] Per SPEC-FUNC-001 Section 3.1, CONSTITUTION Appendix B
 * Aliases: final, phase8
 */
program
  .command('finalize')
  .alias('final')
  .alias('phase8')
  .description('Run Phase 8 final paper assembly - generates dissertation from research outputs')
  .requiredOption('--slug <slug>', 'Research task slug (directory name)')
  .option('--force', 'Overwrite existing final/ outputs', false)
  .option('--dry-run', 'Preview mapping without generating chapters', false)
  .option('--threshold <n>', 'Semantic matching threshold 0-1 (default: 0.30)', '0.30')
  .option('--verbose', 'Enable detailed logging', false)
  .option('--sequential', 'Write chapters sequentially (safer, slower)', false)
  .option('--skip-validation', 'Skip quality validation (debug only)', false)
  .option('--generate-prompts', 'Output synthesis prompts for Claude Code agents', false)
  .option('--generate-pdf', 'Generate PDF from existing synthesized chapters', false)
  .option('--style-profile <id>', 'Style profile ID to use (overrides session lookup)')
  .action(async (options: FinalizeCliOptions) => {
    try {
      const basePath = process.cwd();
      const researchDir = path.join(basePath, 'docs', 'research', options.slug);
      const finalDir = path.join(researchDir, 'final');
      const archiveDir = path.join(researchDir, 'final-archive');

      // If --generate-prompts is set, output synthesis prompts for Claude Code
      if (options.generatePrompts) {
        const prompts = await commandGeneratePrompts(options);
        // Output prompts as JSON for Claude Code to consume
        console.log(JSON.stringify({
          success: true,
          mode: 'generate-prompts',
          totalPrompts: prompts.length,
          prompts: prompts.map(p => ({
            chapterNumber: p.chapterNumber,
            chapterTitle: p.chapterTitle,
            wordTarget: p.wordTarget,
            sections: p.sections,
            styleProfileId: p.styleProfileId,
            outputPath: p.outputPath,
            agentType: p.agentType,
            prompt: p.prompt
          }))
        }, null, 2));
        process.exit(0);
        return;
      }

      // Check for existing synthesized chapters (in archive or final/chapters)
      const findSynthesizedChapters = async (): Promise<string | null> => {
        // First check archive for most recent synthesized chapters
        try {
          const archiveExists = await fs.stat(archiveDir).then(() => true).catch(() => false);
          if (archiveExists) {
            const archiveDirs = await fs.readdir(archiveDir);
            // Sort by date descending (most recent first)
            const sortedDirs = archiveDirs.sort().reverse();
            for (const dir of sortedDirs) {
              const chaptersPath = path.join(archiveDir, dir, 'chapters');
              try {
                const files = await fs.readdir(chaptersPath);
                const chapterFiles = files.filter(f => f.startsWith('chapter-') && f.endsWith('.md'));
                if (chapterFiles.length >= 8) {
                  console.error(`[Phase 8] Found ${chapterFiles.length} synthesized chapters in archive: ${dir}`);
                  return chaptersPath;
                }
              } catch { /* continue */ }
            }
          }
        } catch { /* no archive */ }

        // Check final/chapters for chapter-X.md files (synthesized format)
        const finalChaptersPath = path.join(finalDir, 'chapters');
        try {
          const files = await fs.readdir(finalChaptersPath);
          const synthChapterFiles = files.filter(f => f.startsWith('chapter-') && f.endsWith('.md'));
          if (synthChapterFiles.length >= 8) {
            console.error(`[Phase 8] Found ${synthChapterFiles.length} synthesized chapters in final/chapters`);
            return finalChaptersPath;
          }
        } catch { /* no final/chapters */ }

        return null;
      };

      // If --generate-pdf OR checking for existing chapters
      const synthesizedChaptersPath = await findSynthesizedChapters();

      if (options.generatePdf || synthesizedChaptersPath) {
        if (!synthesizedChaptersPath) {
          console.error('[Phase 8] ERROR: No synthesized chapters found. Run Claude Code agents first.');
          console.error('[Phase 8] Use: npx tsx src/god-agent/cli/phd-cli.ts finalize --slug ' + options.slug);
          process.exit(2);
          return;
        }

        // Generate PDF from synthesized chapters
        console.error(`[Phase 8] Generating PDF from synthesized chapters...`);

        // Read all chapter files and combine
        const chapterFiles = (await fs.readdir(synthesizedChaptersPath))
          .filter(f => f.startsWith('chapter-') && f.endsWith('.md'))
          .sort((a, b) => {
            const numA = parseInt(a.match(/chapter-(\d+)/)?.[1] || '0');
            const numB = parseInt(b.match(/chapter-(\d+)/)?.[1] || '0');
            return numA - numB;
          });

        let combinedContent = '';
        let totalWords = 0;

        for (const file of chapterFiles) {
          const content = await fs.readFile(path.join(synthesizedChaptersPath, file), 'utf-8');
          combinedContent += content + '\n\n';
          totalWords += content.split(/\s+/).length;
        }

        // Write combined markdown
        await fs.mkdir(finalDir, { recursive: true });
        const finalPaperPath = path.join(finalDir, 'final-paper.md');
        await fs.writeFile(finalPaperPath, combinedContent, 'utf-8');
        console.error(`[Phase 8] Combined paper written: ${finalPaperPath} (${totalWords} words)`);

        // Convert to HTML using pandoc
        const htmlPath = path.join(finalDir, 'final-paper.html');
        const pdfPath = path.join(finalDir, 'final-paper.pdf');

        try {
          const { execSync } = await import('child_process');
          execSync(`pandoc "${finalPaperPath}" -o "${htmlPath}" --standalone --toc --metadata title="Research Paper"`, {
            stdio: ['pipe', 'pipe', 'pipe']
          });
          console.error(`[Phase 8] HTML generated: ${htmlPath}`);

          // Try to generate PDF using playwright
          try {
            const playwrightScript = path.join(basePath, 'scripts', 'html-to-pdf.mjs');
            execSync(`node "${playwrightScript}" "${htmlPath}" "${pdfPath}"`, {
              stdio: ['pipe', 'pipe', 'pipe']
            });
            console.error(`[Phase 8] PDF generated: ${pdfPath}`);
          } catch (pdfErr) {
            console.error(`[Phase 8] PDF generation failed (playwright not available), HTML output available`);
          }
        } catch (pandocErr) {
          console.error(`[Phase 8] Pandoc conversion failed, markdown output available`);
        }

        console.log(JSON.stringify({
          success: true,
          mode: 'generate-pdf',
          outputPath: pdfPath,
          markdownPath: finalPaperPath,
          totalWords,
          chaptersProcessed: chapterFiles.length
        }, null, 2));
        process.exit(0);
        return;
      }

      // DEFAULT: Prepare prompts for Claude Code LLM synthesis
      // This outputs phase8-prompts.json for Claude Code Task tool execution
      console.error('[Phase 8] No synthesized chapters found. Generating synthesis prompts...');
      const result = await commandPrepareForClaudeCode(options);
      // Output Phase8PrepareResult as JSON for Claude Code Task tool execution
      console.log(JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      handleFinalizeError(error);
    }
  });

/**
 * Format duration in human-readable form
 */
function formatDuration(ms: number): string {
  if (ms < 0) return 'unknown';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Create a simple progress bar
 */
function createProgressBar(progress: number, width: number = 20): string {
  const filled = Math.floor((progress / 100) * width);
  const empty = width - filled;
  return '[' + '='.repeat(filled) + (filled < width ? '>' : '') + ' '.repeat(Math.max(0, empty - 1)) + ']';
}

/**
 * Execute finalize command
 * [REQ-PIPE-008] Per SPEC-FUNC-001 Section 3.1
 *
 * Exit Codes per CONSTITUTION Appendix B:
 * 0 - SUCCESS: All phases completed successfully
 * 1 - GENERAL_ERROR: Unspecified error
 * 2 - MISSING_FILES: Required input files missing
 * 3 - TOKEN_OVERFLOW: Context limit exceeded
 * 4 - MAPPING_FAILURE: Chapter with zero sources
 * 5 - VALIDATION_FAILURE: Output quality validation failed
 * 6 - SECURITY_VIOLATION: SE-xxx rule violated
 * 7 - CONSTITUTION_VIOLATION: Critical DI-xxx or FS-xxx rule violated
 *
 * @param cliOptions - Command line options
 * @returns FinalStageResult with output details
 */
async function commandFinalize(cliOptions: FinalizeCliOptions): Promise<FinalStageResult> {
  const basePath = process.cwd();

  // Parse threshold (string from CLI to number)
  const threshold = parseFloat(cliOptions.threshold ?? '0.30');
  if (isNaN(threshold) || threshold < 0 || threshold > 1) {
    throw new Error('Threshold must be a number between 0 and 1');
  }

  // Create orchestrator
  const orchestrator = new FinalStageOrchestrator(basePath, cliOptions.slug);

  // Track last phase for progress display
  let lastPhase = '';
  let phaseStartTime = Date.now();

  // Set up progress callback [EX-004]
  orchestrator.onProgress((report: ProgressReport) => {
    // Detect phase change
    if (report.phase !== lastPhase) {
      if (lastPhase && cliOptions.verbose) {
        // Print phase completion
        const phaseDuration = Date.now() - phaseStartTime;
        console.error(`  Completed in ${formatDuration(phaseDuration)}`);
        console.error('');
      }
      lastPhase = report.phase;
      phaseStartTime = Date.now();

      // Print new phase header
      if (cliOptions.verbose) {
        console.error(`Phase: ${report.phase}`);
      }
    }

    if (cliOptions.verbose) {
      // Verbose mode: detailed output per SPEC-FUNC-001 Section 4.3
      const progressStr = report.current >= 0 && report.total >= 0
        ? ` (${report.current}/${report.total})`
        : '';

      // Calculate phase progress percentage
      let phaseProgress = 0;
      if (report.current >= 0 && report.total > 0) {
        phaseProgress = Math.round((report.current / report.total) * 100);
      }

      // Calculate overall progress using milestones (for future use in estimated time)
      const milestone = PROGRESS_MILESTONES[report.phase as FinalStageState];
      if (milestone) {
        const phaseRange = milestone.end - milestone.start;
        // Could be used for estimated remaining time calculation
        const _overallProgress = milestone.start + (phaseRange * (phaseProgress / 100));
        void _overallProgress; // Suppress unused warning
      }

      const progressBar = createProgressBar(phaseProgress);
      const elapsed = formatDuration(report.elapsedMs);

      console.error(`  ${progressBar} ${phaseProgress}%${progressStr}`);
      console.error(`  ${report.message}`);
      console.error(`  Elapsed: ${elapsed}`);
    } else {
      // Simple mode: just dots
      process.stdout.write('.');
    }
  });

  // Build orchestrator options
  const options: FinalStageOptions = {
    force: cliOptions.force ?? false,
    dryRun: cliOptions.dryRun ?? false,
    threshold,
    verbose: cliOptions.verbose ?? false,
    sequential: cliOptions.sequential ?? false,
    skipValidation: cliOptions.skipValidation ?? false
  };

  // Emit pipeline event for observability
  emitPipelineEvent({
    component: 'pipeline',
    operation: 'phase8_started',
    status: 'running',
    metadata: {
      slug: cliOptions.slug,
      options: {
        force: options.force,
        dryRun: options.dryRun,
        threshold: options.threshold,
        sequential: options.sequential
      }
    }
  });

  // Execute Phase 8
  const result = await orchestrator.execute(options);

  // Emit completion event
  emitPipelineEvent({
    component: 'pipeline',
    operation: 'phase8_completed',
    status: result.success ? 'success' : 'error',
    metadata: {
      slug: cliOptions.slug,
      success: result.success,
      exitCode: result.exitCode,
      chaptersGenerated: result.chaptersGenerated,
      totalWords: result.totalWords,
      totalCitations: result.totalCitations,
      warningCount: result.warnings.length,
      errorCount: result.errors.length
    }
  });

  // Verbose output for success/failure
  if (cliOptions.verbose) {
    console.error(''); // Newline after progress dots

    if (result.success) {
      console.error('='.repeat(60));
      console.error('[SUCCESS] Final paper generated');
      console.error('='.repeat(60));
      console.error('');
      console.error(`  Output: ${result.outputPath}`);
      console.error(`  Total words: ${result.totalWords?.toLocaleString() ?? 0}`);
      console.error(`  Total citations: ${result.totalCitations ?? 0}`);
      console.error(`  Chapters generated: ${result.chaptersGenerated}`);

      // Show phase timings
      const phaseTimings = orchestrator.getPhaseTimings();
      if (Object.keys(phaseTimings).length > 0) {
        console.error('');
        console.error('Phase Timings:');
        for (const [key, value] of Object.entries(phaseTimings)) {
          if (key.endsWith('_duration')) {
            const phaseName = key.replace('_duration', '');
            console.error(`  ${phaseName}: ${formatDuration(value)}`);
          }
        }
      }

      // Show token usage
      const tokenBudget = orchestrator.getTokenBudget();
      if (tokenBudget) {
        console.error('');
        console.error(`Token Usage: ${tokenBudget.total.used.toLocaleString()} / ${tokenBudget.total.budget.toLocaleString()} (${tokenBudget.total.utilization})`);
      }

      if (result.warnings.length > 0) {
        console.error('');
        console.error(`Warnings (${result.warnings.length}):`);
        for (const warning of result.warnings) {
          console.error(`  - ${warning}`);
        }
      }
    } else {
      console.error('='.repeat(60));
      console.error(`[FAILED] Exit code: ${result.exitCode}`);
      console.error('='.repeat(60));
      for (const err of result.errors) {
        console.error(`  Error: ${err}`);
      }
    }
  } else if (!cliOptions.verbose) {
    // End the dots line for non-verbose mode
    console.log('');
  }

  return result;
}

/**
 * Generate synthesis prompts for Claude Code to spawn chapter-synthesizer agents
 *
 * This is the PREFERRED method for high-quality chapter generation.
 * Instead of basic concatenation, it outputs prompts that Claude Code
 * uses to spawn the chapter-synthesizer agent for each chapter.
 *
 * @param cliOptions - Command line options
 * @returns Array of synthesis prompts for Claude Code Task tool
 */
async function commandGeneratePrompts(
  cliOptions: FinalizeCliOptions
): Promise<import('./final-stage/chapter-writer-agent.js').ChapterSynthesisPrompt[]> {
  const basePath = process.cwd();
  const threshold = parseFloat(cliOptions.threshold ?? '0.30');

  if (isNaN(threshold) || threshold < 0 || threshold > 1) {
    throw new Error('Threshold must be a number between 0 and 1');
  }

  console.error('[Phase 8 - Generate Prompts] Initializing...');

  // Find session to get style profile ID
  const sessionManager = new SessionManager();
  const sessions = await sessionManager.listSessions();
  const matchingSession = sessions.find(
    (s: { slug?: string; query?: string; styleProfileId?: string }) =>
      s.slug === cliOptions.slug ||
      s.query?.toLowerCase().includes(cliOptions.slug.toLowerCase().replace(/-/g, ' '))
  );

  // Use explicitly passed style profile, or fall back to session lookup
  const styleProfileId = cliOptions.styleProfile || matchingSession?.styleProfileId;
  if (styleProfileId) {
    const source = cliOptions.styleProfile ? 'CLI option' : 'session';
    console.error(`[Phase 8] Using style profile: ${styleProfileId} (from ${source})`);
  } else {
    console.error('[Phase 8] WARNING: No style profile found - using UK English defaults');
  }

  // Create orchestrator (styleProfileId passed to execute())
  const orchestrator = new FinalStageOrchestrator(
    basePath,
    cliOptions.slug
  );

  // Initialize and run scanning/mapping phases
  console.error('[Phase 8] Scanning and mapping research outputs...');
  // Run dry-run mode which executes SCANNING -> SUMMARIZING -> MAPPING phases
  // This populates the cached structure, summaries, and mapping
  const dryRunResult = await orchestrator.execute({
    dryRun: true,
    force: cliOptions.force ?? false,
    verbose: cliOptions.verbose ?? false,
    threshold,
    styleProfileId
  });

  if (!dryRunResult.success) {
    throw new Error(`Dry run failed: ${dryRunResult.errors?.join(', ') || 'unknown error'}`);
  }

  // Get the internal data we need
  const structure = orchestrator.getChapterStructure();
  const summaries = orchestrator.getSummaries();
  const mapping = orchestrator.getMapping();

  if (!structure || !summaries || !mapping) {
    throw new Error('Failed to initialize - missing structure, summaries, or mapping');
  }

  // Generate synthesis prompts
  console.error(`[Phase 8] Generating ${structure.totalChapters} synthesis prompts...`);
  const prompts = await orchestrator.generateSynthesisPrompts(structure, summaries, mapping);

  console.error('[Phase 8] Prompts generated successfully');
  console.error('');
  console.error('Use these prompts with Claude Code Task tool to spawn chapter-synthesizer agents.');

  return prompts;
}

/**
 * Prepare Phase 8 for Claude Code Task tool execution
 * Uses DYNAMIC agent assignment from dissertation-architect structure
 *
 * Per ClaudeFlow methodology from /docs2/claudeflow.md:
 * - 4-part prompt pattern (YOUR TASK, WORKFLOW CONTEXT, MEMORY RETRIEVAL, MEMORY STORAGE)
 * - 99.9% sequential execution (one chapter at a time)
 * - Each chapter uses its specialized writing agent from dissertation structure
 *
 * @param cliOptions - CLI options including slug and threshold
 * @returns Phase8PrepareResult with prompts for Claude Code Task tool execution
 */
async function commandPrepareForClaudeCode(
  cliOptions: FinalizeCliOptions
): Promise<import('./final-stage/types.js').Phase8PrepareResult> {
  const basePath = process.cwd();
  const threshold = parseFloat(cliOptions.threshold ?? '0.30');

  if (isNaN(threshold) || threshold < 0 || threshold > 1) {
    return {
      success: false,
      slug: cliOptions.slug,
      basePath,
      finalOutputDir: '',
      totalChapters: 0,
      chapterPrompts: [],
      scanSummary: { totalFiles: 0, foundFiles: 0, missingFiles: [] },
      mappingSummary: { algorithm: '', threshold: 0, orphanedSources: [], coverage: 0 },
      errors: ['Threshold must be a number between 0 and 1'],
      warnings: [],
      memoryNamespace: '',
      executionInstructions: ''
    };
  }

  console.error('[Phase 8 - Claude Code Prep] Initializing with DYNAMIC agent assignment...');

  // Find session to get style profile ID
  const sessionManager = new SessionManager();
  const sessions = await sessionManager.listSessions();
  const matchingSession = sessions.find(
    (s: { slug?: string; query?: string; styleProfileId?: string }) =>
      s.slug === cliOptions.slug ||
      s.query?.toLowerCase().includes(cliOptions.slug.toLowerCase().replace(/-/g, ' '))
  );

  // Use explicitly passed style profile, or fall back to session lookup
  const styleProfileId = cliOptions.styleProfile || matchingSession?.styleProfileId;
  if (styleProfileId) {
    const source = cliOptions.styleProfile ? 'CLI option' : 'session';
    console.error(`[Phase 8] Using style profile: ${styleProfileId} (from ${source})`);
  } else {
    console.error('[Phase 8] WARNING: No style profile found - using UK English defaults');
  }

  // Create orchestrator
  const orchestrator = new FinalStageOrchestrator(
    basePath,
    cliOptions.slug
  );

  // Set up progress callback
  orchestrator.onProgress((report: ProgressReport) => {
    const progress = report.total > 0 ? Math.round((report.current / report.total) * 100) : 0;
    console.error(`[Phase 8] ${report.phase}: ${report.message} (${progress}%)`);
  });

  console.error('[Phase 8] Preparing for Claude Code with DYNAMIC agents per chapter...');
  console.error('[Phase 8] Each chapter will use its assigned specialized agent from dissertation structure');

  // Call the new prepareForClaudeCode method which:
  // - Scans research outputs
  // - Summarizes sources
  // - Maps to chapters
  // - Generates 4-part ClaudeFlow prompts
  // - Uses DYNAMIC agent assignment from dissertation-architect
  const result = await orchestrator.prepareForClaudeCode({
    force: cliOptions.force ?? false,
    verbose: cliOptions.verbose ?? false,
    threshold,
    styleProfileId
  });

  if (result.success) {
    console.error('[Phase 8] Preparation complete!');
    console.error(`[Phase 8] Total chapters: ${result.totalChapters}`);
    console.error('[Phase 8] DYNAMIC agents assigned per chapter:');
    result.chapterPrompts.forEach(cp => {
      console.error(`  - Chapter ${cp.chapterNumber} (${cp.chapterTitle}): ${cp.subagentType}`);
    });

    // Write prompts to file for Claude Code to consume
    const promptsFilePath = path.join(basePath, 'docs', 'research', cliOptions.slug, 'phase8-prompts.json');
    await fs.mkdir(path.dirname(promptsFilePath), { recursive: true });
    await fs.writeFile(promptsFilePath, JSON.stringify(result, null, 2), 'utf-8');
    console.error(`[Phase 8] Prompts written to: ${promptsFilePath}`);
    console.error('');
    console.error('[Phase 8] Use Claude Code Task tool to execute chapters SEQUENTIALLY');
  } else {
    console.error('[Phase 8] Preparation FAILED');
    result.errors.forEach(err => console.error(`  ERROR: ${err}`));
  }

  return result;
}

/**
 * Handle finalize command errors with appropriate exit codes
 * Per CONSTITUTION Appendix B
 */
function handleFinalizeError(error: unknown): never {
  const err = error as Error;

  // Map error messages to exit codes per CONSTITUTION Appendix B
  let exitCode = 1; // Default: GENERAL_ERROR

  if (err.message.includes('Security') || err.message.includes('Invalid research slug')) {
    exitCode = 6; // SECURITY_VIOLATION
  } else if (err.message.includes('not found') || err.message.includes('missing')) {
    exitCode = 2; // MISSING_FILES
  } else if (err.message.includes('Token') || err.message.includes('overflow')) {
    exitCode = 3; // TOKEN_OVERFLOW
  } else if (err.message.includes('mapping') || err.message.includes('zero sources')) {
    exitCode = 4; // MAPPING_FAILURE
  } else if (err.message.includes('validation') || err.message.includes('quality')) {
    exitCode = 5; // VALIDATION_FAILURE
  } else if (err.message.includes('Constitution') || err.message.includes('DI-') || err.message.includes('FS-')) {
    exitCode = 7; // CONSTITUTION_VIOLATION
  }

  console.error(JSON.stringify({
    error: err.message,
    exitCode,
    suggestion: exitCode === 2
      ? 'Ensure research directory exists with 05-chapter-structure.md'
      : exitCode === 6
      ? 'Slug must be lowercase alphanumeric with dashes only'
      : 'Check logs for details'
  }));

  process.exit(exitCode);
}

/**
 * Handle CLI errors
 */
function handleError(error: unknown): never {
  const err = error as Error;

  // Handle specific error types
  if (err instanceof SessionNotFoundError) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }

  if (err instanceof SessionExpiredError) {
    console.error(JSON.stringify({ error: err.message }));
    process.exit(1);
  }

  if (err instanceof SessionCorruptedError) {
    console.error(JSON.stringify({
      error: err.message,
      suggestion: 'Delete session file manually or use phd-cli abort <session-id>'
    }));
    process.exit(1);
  }

  if (err instanceof AgentMismatchError) {
    console.error(JSON.stringify({
      error: err.message,
      expected: err.expected,
      got: err.got,
      suggestion: 'Use phd-cli status <session-id> to verify current agent'
    }));
    process.exit(1);
  }

  // Unknown error
  const response: ErrorResponse = {
    error: err.message
  };
  console.error(JSON.stringify(response));
  process.exit(1);
}

// ============================================================================
// DISSERTATION-NATIVE FEATURES
// Implements progress tracking, committee simulation, defense preparation,
// and institutional compliance validation
// ============================================================================

// Maps to store dissertation components by session ID
const dissertationTrackers: Map<string, DissertationProgressTracker> = new Map();
const committeeSimulators: Map<string, CommitteeSimulator> = new Map();

/**
 * Get or create a progress tracker for a session
 */
async function getOrCreateProgressTracker(sessionId: string): Promise<DissertationProgressTracker> {
  if (!dissertationTrackers.has(sessionId)) {
    const tracker = new DissertationProgressTracker(sessionId);
    // Try to load existing data
    if (await tracker.exists()) {
      await tracker.load();
    }
    dissertationTrackers.set(sessionId, tracker);
  }
  return dissertationTrackers.get(sessionId)!;
}

/**
 * Get or create a committee simulator for a session
 */
function getOrCreateCommitteeSimulator(sessionId: string): CommitteeSimulator {
  if (!committeeSimulators.has(sessionId)) {
    const simulator = new CommitteeSimulator();
    simulator.addDefaultRoles();
    committeeSimulators.set(sessionId, simulator);
  }
  return committeeSimulators.get(sessionId)!;
}

/**
 * phd-progress command - Track dissertation progress and milestones
 */
program
  .command('phd-progress <session-id>')
  .description('Track dissertation progress and milestones')
  .option('--init', 'Initialize progress tracking for the session')
  .option('--title <title>', 'Dissertation title (for init)')
  .option('--student <name>', 'Student name (for init)')
  .option('--program <program>', 'Degree program (for init)')
  .option('--advisor <name>', 'Advisor name (for init)')
  .option('--committee <names>', 'Committee members, comma-separated (for init)')
  .option('--milestone <name>', 'Add or complete a milestone')
  .option('--complete', 'Mark the milestone as complete')
  .option('--chapter <num>', 'Update chapter progress')
  .option('--status <status>', 'Chapter status: not_started, drafting, review, revision, approved')
  .option('--words <count>', 'Chapter word count')
  .option('--report', 'Generate progress report')
  .option('--agenda', 'Generate advisor meeting agenda')
  .option('--timeline', 'Generate timeline visualization')
  .option('--json', 'Output as JSON')
  .action(async (sessionId: string, options: {
    init?: boolean;
    title?: string;
    student?: string;
    program?: string;
    advisor?: string;
    committee?: string;
    milestone?: string;
    complete?: boolean;
    chapter?: string;
    status?: string;
    words?: string;
    report?: boolean;
    agenda?: boolean;
    timeline?: boolean;
    json?: boolean;
  }) => {
    try {
      const tracker = await getOrCreateProgressTracker(sessionId);

      // Initialize if requested
      if (options.init) {
        const config: DissertationConfig = {
          title: options.title || 'Untitled Dissertation',
          studentName: options.student || 'Student',
          program: options.program || 'PhD',
          advisorName: options.advisor || 'Advisor',
          committeeMembers: options.committee?.split(',').map(s => s.trim()) || []
        };
        tracker.initialize(config);
        await tracker.save();

        if (options.json) {
          console.log(JSON.stringify({ success: true, action: 'initialized', sessionId }));
        } else {
          console.log('Dissertation progress tracking initialized.');
        }
        return;
      }

      // Add/complete milestone
      if (options.milestone) {
        const progress = tracker.getProgress();
        const existing = progress.milestones.find(m =>
          m.name.toLowerCase() === options.milestone!.toLowerCase()
        );

        if (existing) {
          if (options.complete) {
            tracker.completeMilestone(existing.id);
            await tracker.save();
            if (options.json) {
              console.log(JSON.stringify({ success: true, action: 'milestone_completed', milestone: existing.name }));
            } else {
              console.log(`Milestone completed: ${existing.name}`);
            }
          } else {
            tracker.updateMilestoneStatus(existing.id, 'in_progress');
            await tracker.save();
            if (options.json) {
              console.log(JSON.stringify({ success: true, action: 'milestone_started', milestone: existing.name }));
            } else {
              console.log(`Milestone started: ${existing.name}`);
            }
          }
        } else {
          const id = tracker.addMilestone({
            name: options.milestone,
            type: 'custom',
            status: options.complete ? 'completed' : 'in_progress',
            dependencies: [],
            notes: '',
            attachments: [],
            completedDate: options.complete ? new Date() : undefined
          });
          await tracker.save();
          if (options.json) {
            console.log(JSON.stringify({ success: true, action: 'milestone_added', id, name: options.milestone }));
          } else {
            console.log(`Milestone added: ${options.milestone}`);
          }
        }
        return;
      }

      // Update chapter
      if (options.chapter) {
        const chapterNum = parseInt(options.chapter, 10);
        const update: { status?: string; wordCount?: number } = {};

        if (options.status) {
          update.status = options.status;
        }
        if (options.words) {
          update.wordCount = parseInt(options.words, 10);
        }

        tracker.updateChapter(chapterNum, update as never);
        await tracker.save();

        if (options.json) {
          console.log(JSON.stringify({ success: true, action: 'chapter_updated', chapter: chapterNum, ...update }));
        } else {
          console.log(`Chapter ${chapterNum} updated.`);
        }
        return;
      }

      // Generate reports
      if (options.report) {
        const report = tracker.generateProgressReport();
        if (options.json) {
          console.log(JSON.stringify({ success: true, report }));
        } else {
          console.log(report);
        }
        return;
      }

      if (options.agenda) {
        const agenda = tracker.generateAdvisorMeetingAgenda();
        if (options.json) {
          console.log(JSON.stringify({ success: true, agenda }));
        } else {
          console.log(agenda);
        }
        return;
      }

      if (options.timeline) {
        const timeline = tracker.generateTimelineVisualization();
        if (options.json) {
          console.log(JSON.stringify({ success: true, timeline }));
        } else {
          console.log(timeline);
        }
        return;
      }

      // Default: show summary
      const progress = tracker.getProgress();
      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          sessionId,
          title: progress.title,
          overallProgress: progress.overallProgress,
          totalWordCount: progress.totalWordCount,
          chapters: progress.chapters.length,
          milestones: progress.milestones.length,
          completedMilestones: progress.milestones.filter(m => m.status === 'completed').length
        }));
      } else {
        console.log(`Dissertation: ${progress.title || 'Not initialized'}`);
        console.log(`Progress: ${progress.overallProgress}%`);
        console.log(`Word Count: ${progress.totalWordCount.toLocaleString()}`);
        console.log(`Chapters: ${progress.chapters.length}`);
        console.log(`Milestones: ${progress.milestones.filter(m => m.status === 'completed').length}/${progress.milestones.length} completed`);
      }
    } catch (error) {
      handleError(error);
    }
  });

/**
 * phd-committee command - Simulate committee perspectives and questions
 */
program
  .command('phd-committee <session-id>')
  .description('Simulate committee perspectives and generate anticipated questions')
  .option('--setup', 'Set up committee with default roles')
  .option('--add-member <name>', 'Add a committee member')
  .option('--role <role>', 'Member role: chair, advisor, methodologist, theorist, external, reader')
  .option('--questions', 'Generate questions')
  .option('--chapter <num>', 'Generate questions for specific chapter')
  .option('--count <n>', 'Number of questions to generate', '10')
  .option('--review', 'Simulate full committee review')
  .option('--critical', 'Generate critical/challenging questions only')
  .option('--export', 'Export question bank')
  .option('--json', 'Output as JSON')
  .action(async (sessionId: string, options: {
    setup?: boolean;
    addMember?: string;
    role?: string;
    questions?: boolean;
    chapter?: string;
    count?: string;
    review?: boolean;
    critical?: boolean;
    export?: boolean;
    json?: boolean;
  }) => {
    try {
      const simulator = getOrCreateCommitteeSimulator(sessionId);
      const sessionManager = new SessionManager();
      const session = await sessionManager.loadSession(sessionId);

      // Setup with default roles
      if (options.setup) {
        simulator.addDefaultRoles();
        if (options.json) {
          console.log(JSON.stringify({
            success: true,
            action: 'setup',
            committee: simulator.getCommittee().map(m => ({ name: m.name, role: m.role }))
          }));
        } else {
          console.log('Committee set up with default roles:');
          for (const member of simulator.getCommittee()) {
            console.log(`  - ${member.name} (${member.role})`);
          }
        }
        return;
      }

      // Add member
      if (options.addMember) {
        const member: CommitteeMember = {
          name: options.addMember,
          role: (options.role as CommitteeMember['role']) || 'reader',
          expertise: [],
          focusAreas: [],
          questionStyle: 'probing',
          personalityTraits: []
        };
        simulator.addMember(member);
        if (options.json) {
          console.log(JSON.stringify({ success: true, action: 'member_added', member }));
        } else {
          console.log(`Added committee member: ${member.name} (${member.role})`);
        }
        return;
      }

      // Generate questions
      if (options.questions || options.chapter) {
        const count = parseInt(options.count || '10', 10);

        // Load chapter content if available
        let chapterContent = '';
        if (session.researchDir && options.chapter) {
          try {
            const chapterPath = path.join(session.researchDir, `chapter-${options.chapter}.md`);
            chapterContent = await fs.readFile(chapterPath, 'utf-8');
          } catch {
            // Chapter file not found, use empty content
            chapterContent = '';
          }
        }

        const questions = options.chapter
          ? simulator.generateQuestions(chapterContent, parseInt(options.chapter, 10), count)
          : simulator.generateDefenseQuestions(chapterContent || session.query, count);

        simulator.storeQuestions(questions);

        if (options.json) {
          console.log(JSON.stringify({ success: true, questions }));
        } else {
          console.log(`Generated ${questions.length} anticipated questions:\n`);
          for (const q of questions) {
            console.log(`Q: ${q.question}`);
            console.log(`   From: ${q.askedBy} (${q.role}) - ${q.difficulty}`);
            console.log(`   Suggested response: ${q.suggestedResponse}`);
            console.log('');
          }
        }
        return;
      }

      // Critical questions
      if (options.critical) {
        const questions = simulator.generateCriticalQuestions();
        simulator.storeQuestions(questions);

        if (options.json) {
          console.log(JSON.stringify({ success: true, questions }));
        } else {
          console.log('Most challenging anticipated questions:\n');
          for (const q of questions) {
            console.log(`Q: ${q.question}`);
            console.log(`   From: ${q.askedBy} (${q.role})`);
            console.log(`   Suggested response: ${q.suggestedResponse}`);
            console.log('');
          }
        }
        return;
      }

      // Full review
      if (options.review) {
        // Build chapters map from session if available
        const chaptersMap = new Map<number, string>();
        if (session.researchDir) {
          // Try to load available chapters
          for (let i = 1; i <= 10; i++) {
            try {
              const chapterPath = path.join(session.researchDir, `chapter-${i}.md`);
              const content = await fs.readFile(chapterPath, 'utf-8');
              chaptersMap.set(i, content);
            } catch {
              // Chapter not found, skip
            }
          }
        }

        const review = simulator.simulateCommitteeReview(chaptersMap);

        if (options.json) {
          console.log(JSON.stringify({ success: true, review }));
        } else {
          console.log('Committee Review Simulation\n');
          console.log(`Overall Assessment: ${review.overallAssessment.toUpperCase()}`);
          console.log('\nCommon Themes:');
          for (const theme of review.commonThemes) {
            console.log(`  - ${theme}`);
          }
          console.log('\nCritical Issues:');
          for (const issue of review.criticalIssues) {
            console.log(`  - ${issue}`);
          }
          console.log('\nRevision Priorities:');
          for (const priority of review.revisionPriorities.slice(0, 5)) {
            console.log(`  ${priority}`);
          }
        }
        return;
      }

      // Export question bank
      if (options.export) {
        const exported = simulator.exportQuestionBank();
        if (options.json) {
          console.log(JSON.stringify({ success: true, questionBank: exported }));
        } else {
          console.log(exported);
        }
        return;
      }

      // Default: show committee
      const committee = simulator.getCommittee();
      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          sessionId,
          committeeSize: committee.length,
          committee: committee.map(m => ({ name: m.name, role: m.role })),
          questionsStored: simulator.getQuestionBank().length
        }));
      } else {
        console.log('Committee Members:');
        for (const member of committee) {
          console.log(`  - ${member.name} (${member.role})`);
        }
        console.log(`\nQuestions in bank: ${simulator.getQuestionBank().length}`);
      }
    } catch (error) {
      handleError(error);
    }
  });

/**
 * phd-defense command - Generate defense preparation materials
 */
program
  .command('phd-defense <session-id>')
  .description('Generate defense preparation materials')
  .option('--generate', 'Generate complete defense package')
  .option('--questions', 'Generate anticipated questions')
  .option('--slides', 'Generate slide deck outline')
  .option('--opening', 'Generate opening statement')
  .option('--closing', 'Generate closing statement')
  .option('--cheatsheet', 'Generate key points cheat sheet')
  .option('--timing', 'Generate timing guide')
  .option('--total-time <minutes>', 'Total defense time in minutes', '45')
  .option('--qa-time <minutes>', 'Q&A time in minutes', '20')
  .option('--output <path>', 'Output file path for defense package')
  .option('--json', 'Output as JSON')
  .action(async (sessionId: string, options: {
    generate?: boolean;
    questions?: boolean;
    slides?: boolean;
    opening?: boolean;
    closing?: boolean;
    cheatsheet?: boolean;
    timing?: boolean;
    totalTime?: string;
    qaTime?: string;
    output?: string;
    json?: boolean;
  }) => {
    try {
      const simulator = getOrCreateCommitteeSimulator(sessionId);
      const generator = new DefensePreparationGenerator(simulator);
      const sessionManager = new SessionManager();
      const session = await sessionManager.loadSession(sessionId);

      // Build chapters map from session
      const chaptersMap = new Map<number, string>();
      if (session.researchDir) {
        for (let i = 1; i <= 10; i++) {
          try {
            const chapterPath = path.join(session.researchDir, `chapter-${i}.md`);
            const content = await fs.readFile(chapterPath, 'utf-8');
            chaptersMap.set(i, content);
          } catch {
            // Chapter not found, skip
          }
        }
      }

      const config: DefenseConfig = {
        totalTime: parseInt(options.totalTime || '45', 10),
        questionTime: parseInt(options.qaTime || '20', 10),
        includeChallenging: true
      };

      // Generate complete package
      if (options.generate) {
        const prep = await generator.generateDefensePackage(chaptersMap, config);

        if (options.output) {
          const outputPath = path.resolve(options.output);
          const content = exportDefensePreparation(prep);
          await fs.writeFile(outputPath, content, 'utf-8');
          if (options.json) {
            console.log(JSON.stringify({ success: true, outputPath, questionsCount: prep.anticipatedQuestions.length, slidesCount: prep.summarySlides.slides.length }));
          } else {
            console.log(`Defense preparation package written to: ${outputPath}`);
          }
        } else {
          if (options.json) {
            console.log(JSON.stringify({ success: true, preparation: prep }));
          } else {
            console.log(exportDefensePreparation(prep));
          }
        }
        return;
      }

      // Generate questions only
      if (options.questions) {
        const prep = await generator.generateDefensePackage(chaptersMap, config);
        if (options.json) {
          console.log(JSON.stringify({ success: true, questions: prep.anticipatedQuestions }));
        } else {
          console.log('Anticipated Defense Questions\n');
          for (const q of prep.anticipatedQuestions) {
            console.log(`Q: ${q.question}`);
            console.log(`   From: ${q.askedBy} - ${q.difficulty}`);
            console.log('');
          }
        }
        return;
      }

      // Generate slides only
      if (options.slides) {
        const slides = generator.generateSummarySlides(chaptersMap, config.totalTime - config.questionTime);
        if (options.json) {
          console.log(JSON.stringify({ success: true, slides }));
        } else {
          console.log(`Slide Deck: ${slides.title}\n`);
          console.log(`Total Duration: ${slides.totalDuration} minutes\n`);
          for (const slide of slides.slides) {
            console.log(`Slide ${slide.number}: ${slide.title} (${slide.duration} min)`);
            for (const bullet of slide.bulletPoints) {
              console.log(`  - ${bullet}`);
            }
            console.log('');
          }
        }
        return;
      }

      // Generate opening statement
      if (options.opening) {
        const abstract = chaptersMap.get(1)?.slice(0, 2000) || '';
        const opening = generator.generateOpeningStatement(abstract);
        if (options.json) {
          console.log(JSON.stringify({ success: true, openingStatement: opening }));
        } else {
          console.log(opening);
        }
        return;
      }

      // Generate closing statement
      if (options.closing) {
        const lastChapter = chaptersMap.get(chaptersMap.size) || '';
        const closing = generator.generateClosingStatement(lastChapter);
        if (options.json) {
          console.log(JSON.stringify({ success: true, closingStatement: closing }));
        } else {
          console.log(closing);
        }
        return;
      }

      // Generate cheat sheet
      if (options.cheatsheet) {
        const cheatsheet = generator.generateCheatSheet(chaptersMap);
        if (options.json) {
          console.log(JSON.stringify({ success: true, cheatSheet: cheatsheet }));
        } else {
          console.log(cheatsheet);
        }
        return;
      }

      // Generate timing guide
      if (options.timing) {
        const slides = generator.generateSummarySlides(chaptersMap, config.totalTime - config.questionTime);
        const timing = generator.generateTimingGuide(slides);
        if (options.json) {
          console.log(JSON.stringify({ success: true, timingGuide: timing }));
        } else {
          console.log(timing);
        }
        return;
      }

      // Default: show available options
      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          sessionId,
          availableChapters: chaptersMap.size,
          commands: ['--generate', '--questions', '--slides', '--opening', '--closing', '--cheatsheet', '--timing']
        }));
      } else {
        console.log('Defense Preparation Generator');
        console.log(`Session: ${sessionId}`);
        console.log(`Available chapters: ${chaptersMap.size}`);
        console.log('\nUse one of the following options:');
        console.log('  --generate    Generate complete defense package');
        console.log('  --questions   Generate anticipated questions');
        console.log('  --slides      Generate slide deck outline');
        console.log('  --opening     Generate opening statement');
        console.log('  --closing     Generate closing statement');
        console.log('  --cheatsheet  Generate key points cheat sheet');
        console.log('  --timing      Generate timing guide');
      }
    } catch (error) {
      handleError(error);
    }
  });

/**
 * phd-compliance command - Check institutional compliance
 */
program
  .command('phd-compliance <session-id>')
  .description('Check dissertation compliance with institutional requirements')
  .option('--check', 'Run compliance check')
  .option('--institution <name>', 'Institution template to use', 'generic-us-doctoral')
  .option('--checklist', 'Generate submission checklist')
  .option('--list-institutions', 'List available institution templates')
  .option('--deadlines', 'Show upcoming deadlines')
  .option('--add-deadline <name>', 'Add a deadline')
  .option('--date <date>', 'Deadline date (YYYY-MM-DD)')
  .option('--export', 'Export compliance report')
  .option('--output <path>', 'Output file path')
  .option('--json', 'Output as JSON')
  .action(async (sessionId: string, options: {
    check?: boolean;
    institution?: string;
    checklist?: boolean;
    listInstitutions?: boolean;
    deadlines?: boolean;
    addDeadline?: string;
    date?: string;
    export?: boolean;
    output?: string;
    json?: boolean;
  }) => {
    try {
      // List available institutions
      if (options.listInstitutions) {
        const institutions = InstitutionalComplianceChecker.listAvailableInstitutions();
        if (options.json) {
          console.log(JSON.stringify({ success: true, institutions }));
        } else {
          console.log('Available institution templates:');
          for (const inst of institutions) {
            console.log(`  - ${inst}`);
          }
        }
        return;
      }

      // Load requirements for the institution
      const requirements = InstitutionalComplianceChecker.loadInstitution(options.institution || 'generic-us-doctoral');
      const checker = new InstitutionalComplianceChecker(requirements);

      // Add deadline
      if (options.addDeadline && options.date) {
        const date = new Date(options.date);
        checker.addDeadline(options.addDeadline, date);
        if (options.json) {
          console.log(JSON.stringify({ success: true, action: 'deadline_added', name: options.addDeadline, date: options.date }));
        } else {
          console.log(`Deadline added: ${options.addDeadline} on ${options.date}`);
        }
        return;
      }

      // Show deadlines
      if (options.deadlines) {
        const deadlines = checker.getUpcomingDeadlines();
        if (options.json) {
          console.log(JSON.stringify({ success: true, deadlines }));
        } else {
          console.log('Upcoming Deadlines:');
          for (const d of deadlines) {
            const status = d.isOverdue ? 'OVERDUE' : `${d.daysRemaining} days`;
            console.log(`  - ${d.name}: ${d.date.toLocaleDateString()} (${status})`);
          }
        }
        return;
      }

      // Generate checklist
      if (options.checklist) {
        const checklist = checker.generateSubmissionChecklist();
        if (options.output) {
          await fs.writeFile(path.resolve(options.output), checklist, 'utf-8');
          if (options.json) {
            console.log(JSON.stringify({ success: true, outputPath: options.output }));
          } else {
            console.log(`Checklist written to: ${options.output}`);
          }
        } else {
          if (options.json) {
            console.log(JSON.stringify({ success: true, checklist }));
          } else {
            console.log(checklist);
          }
        }
        return;
      }

      // Run compliance check
      if (options.check) {
        const sessionManager = new SessionManager();
        const session = await sessionManager.loadSession(sessionId);

        // Build content maps
        const chapters = new Map<number, string>();
        const frontMatter = new Map<string, string>();
        const backMatter = new Map<string, string>();

        if (session.researchDir) {
          // Load chapters
          for (let i = 1; i <= 10; i++) {
            try {
              const chapterPath = path.join(session.researchDir, `chapter-${i}.md`);
              const content = await fs.readFile(chapterPath, 'utf-8');
              chapters.set(i, content);
            } catch {
              // Chapter not found
            }
          }

          // Try to load front/back matter
          const frontMatterFiles = ['abstract.md', 'title-page.md', 'acknowledgments.md'];
          for (const file of frontMatterFiles) {
            try {
              const content = await fs.readFile(path.join(session.researchDir, file), 'utf-8');
              frontMatter.set(file.replace('.md', ''), content);
            } catch {
              // File not found
            }
          }

          const backMatterFiles = ['references.md', 'appendices.md'];
          for (const file of backMatterFiles) {
            try {
              const content = await fs.readFile(path.join(session.researchDir, file), 'utf-8');
              backMatter.set(file.replace('.md', ''), content);
            } catch {
              // File not found
            }
          }
        }

        const report = checker.validateDissertation(chapters, frontMatter, backMatter);

        if (options.export || options.output) {
          const exported = checker.exportComplianceReport(report);
          if (options.output) {
            await fs.writeFile(path.resolve(options.output), exported, 'utf-8');
            if (options.json) {
              console.log(JSON.stringify({ success: true, outputPath: options.output, passed: report.passed, score: report.score }));
            } else {
              console.log(`Compliance report written to: ${options.output}`);
            }
          } else {
            if (options.json) {
              console.log(JSON.stringify({ success: true, report }));
            } else {
              console.log(exported);
            }
          }
        } else {
          if (options.json) {
            console.log(JSON.stringify({ success: true, report }));
          } else {
            console.log(`Compliance Check for: ${requirements.institution}`);
            console.log(`Status: ${report.passed ? 'PASSED' : 'NEEDS ATTENTION'}`);
            console.log(`Score: ${report.score}/100`);
            console.log(`\nIssues: ${report.issues.length}`);
            const errors = report.issues.filter(i => i.severity === 'error');
            const warnings = report.issues.filter(i => i.severity === 'warning');
            console.log(`  Errors: ${errors.length}`);
            console.log(`  Warnings: ${warnings.length}`);

            if (errors.length > 0) {
              console.log('\nErrors (must fix):');
              for (const err of errors.slice(0, 5)) {
                console.log(`  - ${err.location}: ${err.description}`);
              }
            }
          }
        }
        return;
      }

      // Default: show requirements summary
      const reqs = checker.getRequirements();
      if (options.json) {
        console.log(JSON.stringify({ success: true, requirements: reqs }));
      } else {
        console.log(`Institution: ${reqs.institution}`);
        console.log(`Degree: ${reqs.degree.toUpperCase()}`);
        console.log(`Citation Style: ${reqs.citationStyle.toUpperCase()}`);
        console.log(`\nFormatting:`);
        console.log(`  Font: ${reqs.formatting.font}, ${reqs.formatting.fontSize}pt`);
        console.log(`  Line Spacing: ${reqs.formatting.lineSpacing}`);
        console.log(`\nUse --check to validate dissertation or --checklist to generate submission checklist`);
      }
    } catch (error) {
      handleError(error);
    }
  });

// ============================================================================
// PHD-COMPLETE-SECTION COMMAND
// ============================================================================
// Completes unfinished dissertation sections using knowledge from the corpus
// Implements section analysis, knowledge retrieval, and citation generation

/**
 * Options for the phd-complete-section command
 */
interface CompleteSectionOptions {
  /** Path to input file containing the incomplete section */
  input?: string;
  /** Inline text for short sections */
  inline?: string;
  /** Corpus to search for knowledge (default: rhetorical_ontology) */
  corpus?: string;
  /** Style profile to apply */
  style?: string;
  /** Output file path (default: stdout) */
  output?: string;
  /** Output as JSON */
  json?: boolean;
}

/**
 * Represents an incomplete subsection detected in the input
 */
interface IncompleteSubsection {
  /** The header text (e.g., "2.3.1 Phantasia in Aristotle's Rhetoric") */
  header: string;
  /** Line number where the header appears */
  lineNumber: number;
  /** Reason why it's considered incomplete */
  reason: 'todo_marker' | 'empty' | 'placeholder' | 'too_short';
  /** Any existing content after the header */
  existingContent: string;
  /** Start index in the original text */
  startIndex: number;
  /** End index in the original text (where next header starts or end of text) */
  endIndex: number;
}

/**
 * Knowledge unit from the corpus
 */
interface KnowledgeUnit {
  id: string;
  claim: string;
  sources: Array<{
    author: string;
    title: string;
    path_rel: string;
    pages: string;
    chunk_id?: string;
  }>;
  confidence: 'high' | 'medium' | 'low';
  tags: string[];
}

/**
 * Result of completing a subsection
 */
interface SubsectionCompletion {
  /** Original header */
  header: string;
  /** Generated content */
  content: string;
  /** Citations used */
  citations: Array<{
    author: string;
    year: string;
    page: string;
    kuId: string;
  }>;
  /** Knowledge units used */
  knowledgeUnitsUsed: string[];
}

/**
 * Full result of section completion
 */
interface SectionCompletionResult {
  /** Original input text */
  originalText: string;
  /** Completed text with AI-generated content */
  completedText: string;
  /** Details about each completed subsection */
  completions: SubsectionCompletion[];
  /** Total citations added */
  totalCitations: number;
  /** Sources used */
  sourcesUsed: string[];
  /** Corpus that was searched */
  corpus: string;
  /** Style profile applied (if any) */
  styleProfile?: string;
}

/**
 * Parse the section text to identify incomplete subsections.
 * Looks for:
 * - Headers followed by TODO markers
 * - Headers with no content or very short content
 * - Placeholder text like "[Complete this section]"
 *
 * @param text - The markdown section text
 * @returns Array of incomplete subsections detected
 */
function analyzeSection(text: string): IncompleteSubsection[] {
  const lines = text.split('\n');
  const incompleteSubsections: IncompleteSubsection[] = [];

  // Regex to match markdown headers (##, ###, ####, etc.)
  const headerRegex = /^(#{1,6})\s+(.+)$/;

  // Patterns indicating incompleteness
  const todoPatterns = [
    /TODO/i,
    /\[TODO\]/i,
    /\[Complete\s+this/i,
    /\[Fill\s+in/i,
    /\[Add\s+content/i,
    /\[Placeholder\]/i,
    /TBD/i,
    /FIXME/i,
  ];

  const placeholderPatterns = [
    /^\s*\[.*\]\s*$/,
    /^\s*\.{3,}\s*$/,
    /^\s*\?\?\?\s*$/,
  ];

  let currentHeader: { text: string; lineNumber: number; startIndex: number } | null = null;
  let currentContent: string[] = [];
  let charIndex = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headerMatch = line.match(headerRegex);

    if (headerMatch) {
      // Process previous section if there was one
      if (currentHeader) {
        const content = currentContent.join('\n').trim();
        const endIndex = charIndex;

        // Check if the section is incomplete
        let reason: IncompleteSubsection['reason'] | null = null;

        // Check for TODO markers in header or content
        const fullText = currentHeader.text + ' ' + content;
        if (todoPatterns.some(p => p.test(fullText))) {
          reason = 'todo_marker';
        }
        // Check if content is empty
        else if (content.length === 0) {
          reason = 'empty';
        }
        // Check for placeholder patterns
        else if (content.split('\n').every(l => !l.trim() || placeholderPatterns.some(p => p.test(l)))) {
          reason = 'placeholder';
        }
        // Check if content is too short (less than 100 chars of actual content)
        else if (content.replace(/\s+/g, ' ').length < 100) {
          reason = 'too_short';
        }

        if (reason) {
          incompleteSubsections.push({
            header: currentHeader.text,
            lineNumber: currentHeader.lineNumber,
            reason,
            existingContent: content,
            startIndex: currentHeader.startIndex,
            endIndex,
          });
        }
      }

      // Start new section
      currentHeader = {
        text: headerMatch[2].trim(),
        lineNumber: i + 1,
        startIndex: charIndex,
      };
      currentContent = [];
    } else if (currentHeader) {
      currentContent.push(line);
    }

    charIndex += line.length + 1; // +1 for newline
  }

  // Process the last section
  if (currentHeader) {
    const content = currentContent.join('\n').trim();
    let reason: IncompleteSubsection['reason'] | null = null;

    const fullText = currentHeader.text + ' ' + content;
    if (todoPatterns.some(p => p.test(fullText))) {
      reason = 'todo_marker';
    } else if (content.length === 0) {
      reason = 'empty';
    } else if (content.split('\n').every(l => !l.trim() || placeholderPatterns.some(p => p.test(l)))) {
      reason = 'placeholder';
    } else if (content.replace(/\s+/g, ' ').length < 100) {
      reason = 'too_short';
    }

    if (reason) {
      incompleteSubsections.push({
        header: currentHeader.text,
        lineNumber: currentHeader.lineNumber,
        reason,
        existingContent: content,
        startIndex: currentHeader.startIndex,
        endIndex: text.length,
      });
    }
  }

  return incompleteSubsections;
}

/**
 * Search the knowledge base for relevant knowledge units.
 *
 * @param query - Search query (typically derived from subsection header)
 * @param corpus - Corpus to filter by (e.g., "rhetorical_ontology")
 * @param limit - Maximum number of results
 * @returns Array of matching knowledge units
 */
async function searchKnowledgeBase(
  query: string,
  corpus?: string,
  limit: number = 5
): Promise<KnowledgeUnit[]> {
  const knowledgePath = path.join(process.cwd(), 'god-learn', 'knowledge.jsonl');

  try {
    const content = await fs.readFile(knowledgePath, 'utf-8');
    const allKUs: KnowledgeUnit[] = content
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try {
          return JSON.parse(line) as KnowledgeUnit;
        } catch {
          return null;
        }
      })
      .filter((ku): ku is KnowledgeUnit => ku !== null);

    // Extract keywords from query
    const queryLower = query.toLowerCase();
    const keywords = queryLower
      .split(/\s+/)
      .filter(w => w.length > 2)
      .filter(w => !['the', 'and', 'for', 'this', 'that', 'with', 'from'].includes(w));

    // Score and filter knowledge units
    const scored = allKUs
      .filter(ku => {
        // Filter by corpus if specified
        if (corpus && ku.sources && ku.sources.length > 0) {
          return ku.sources.some(s => s.path_rel && s.path_rel.includes(corpus));
        }
        return true;
      })
      .map(ku => {
        const claim = (ku.claim || '').toLowerCase();
        let score = 0;

        // Score based on keyword matches
        for (const keyword of keywords) {
          if (claim.includes(keyword)) {
            score += 1;
            // Bonus for exact word match
            if (new RegExp(`\\b${keyword}\\b`).test(claim)) {
              score += 0.5;
            }
          }
        }

        // Bonus for high confidence
        if (ku.confidence === 'high') {
          score *= 1.2;
        } else if (ku.confidence === 'low') {
          score *= 0.8;
        }

        return { ku, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.ku);

    return scored;
  } catch (error) {
    if (process.env.PHD_CLI_DEBUG) {
      console.error(`[COMPLETE-SECTION] Failed to read knowledge base: ${error}`);
    }
    return [];
  }
}

/**
 * Extract citation information from a knowledge unit source.
 *
 * @param source - Source object from a knowledge unit
 * @returns Formatted citation object
 */
function extractCitation(source: KnowledgeUnit['sources'][0]): {
  author: string;
  year: string;
  page: string;
} {
  // Extract year from title or path (e.g., "_(2011)_" or "_(2014)_")
  const yearMatch = source.title?.match(/\((\d{4})\)/) ||
    source.path_rel?.match(/\((\d{4})\)/);
  const year = yearMatch ? yearMatch[1] : 'n.d.';

  // Extract last name from author (handle "Last, First" format)
  let author = source.author || 'Unknown';
  if (author.includes(',')) {
    author = author.split(',')[0].trim();
  } else if (author.includes(' ')) {
    // Assume "First Last" format, take the last word
    const parts = author.split(' ');
    author = parts[parts.length - 1];
  }

  // Format pages
  const page = source.pages || '';

  return { author, year, page };
}

/**
 * Generate completion text for an incomplete subsection.
 *
 * @param subsection - The incomplete subsection to complete
 * @param knowledgeUnits - Relevant knowledge units from the corpus
 * @param styleProfile - Optional style profile for voice/tone matching
 * @returns Completed subsection with content and citations
 */
function generateSubsectionCompletion(
  subsection: IncompleteSubsection,
  knowledgeUnits: KnowledgeUnit[],
  _styleProfile?: StoredStyleProfile
): SubsectionCompletion {
  const citations: SubsectionCompletion['citations'] = [];
  const paragraphs: string[] = [];
  const usedKuIds: string[] = [];

  if (knowledgeUnits.length === 0) {
    // No knowledge units found - generate a placeholder note
    paragraphs.push(
      `*Note: No relevant knowledge units found in the corpus for this subsection. ` +
      `Consider adding relevant sources to the corpus or refining the subsection topic.*`
    );
  } else {
    // Build narrative from knowledge units
    // Group by source author for coherent narrative flow
    const byAuthor = new Map<string, KnowledgeUnit[]>();
    for (const ku of knowledgeUnits) {
      const author = ku.sources?.[0]?.author || 'Unknown';
      if (!byAuthor.has(author)) {
        byAuthor.set(author, []);
      }
      byAuthor.get(author)!.push(ku);
    }

    // Generate introductory sentence based on the header topic
    const topicWords = subsection.header.toLowerCase().split(/\s+/).slice(0, 5).join(' ');
    paragraphs.push(
      `This section examines the scholarly discourse surrounding ${topicWords}, ` +
      `drawing on key primary and secondary sources from the corpus.`
    );

    // Add content from each author grouping
    for (const [author, kus] of byAuthor) {
      for (const ku of kus) {
        const source = ku.sources?.[0];
        if (!source) continue;

        const citation = extractCitation(source);
        usedKuIds.push(ku.id);

        // Format the claim as a quotation or paraphrase
        let text: string;
        if (ku.claim.length < 200) {
          // Short claims can be quoted directly
          text = `As ${citation.author} (${citation.year}) observes, "${ku.claim}"`;
          if (citation.page) {
            text += ` (p. ${citation.page})`;
          }
          text += '.';
        } else {
          // Longer claims should be paraphrased with citation
          text = `${citation.author} (${citation.year}) argues that ${ku.claim.substring(0, 150)}...`;
          if (citation.page) {
            text += ` (p. ${citation.page})`;
          }
        }

        paragraphs.push(text);

        citations.push({
          author: citation.author,
          year: citation.year,
          page: citation.page,
          kuId: ku.id,
        });
      }
    }

    // Add a transitional/synthesizing sentence if we have multiple sources
    if (citations.length > 1) {
      const authorList = [...new Set(citations.map(c => c.author))];
      if (authorList.length > 1) {
        paragraphs.push(
          `These perspectives from ${authorList.join(', ')} collectively illuminate ` +
          `the multifaceted nature of ${topicWords} within the broader scholarly conversation.`
        );
      }
    }
  }

  const content = paragraphs.join('\n\n');

  return {
    header: subsection.header,
    content,
    citations,
    knowledgeUnitsUsed: usedKuIds,
  };
}

/**
 * Build the completed section text with all completions inserted.
 *
 * @param originalText - Original section text
 * @param incompleteSubsections - Detected incomplete subsections
 * @param completions - Generated completions for each subsection
 * @returns Complete section text with AI-generated content marked
 */
function buildCompletedText(
  originalText: string,
  incompleteSubsections: IncompleteSubsection[],
  completions: SubsectionCompletion[]
): string {
  // Sort subsections by start index in reverse order (so we can insert from end to start)
  const sortedSubsections = [...incompleteSubsections].sort((a, b) => b.startIndex - a.startIndex);

  let result = originalText;

  for (let i = 0; i < sortedSubsections.length; i++) {
    const subsection = sortedSubsections[i];
    const completion = completions.find(c => c.header === subsection.header);

    if (!completion) continue;

    // Find the position after the header line
    const lines = result.split('\n');
    let lineIndex = -1;
    let charCount = 0;

    for (let j = 0; j < lines.length; j++) {
      if (charCount >= subsection.startIndex && lines[j].includes(subsection.header)) {
        lineIndex = j;
        break;
      }
      charCount += lines[j].length + 1;
    }

    if (lineIndex === -1) continue;

    // Build the replacement text
    const headerLine = lines[lineIndex];
    const completionBlock = [
      headerLine,
      '<!-- AI-COMPLETED -->',
      '',
      completion.content,
      '',
    ].join('\n');

    // Find end of current subsection content
    let endLineIndex = lineIndex + 1;
    const headerRegex = /^#{1,6}\s+/;
    while (endLineIndex < lines.length && !headerRegex.test(lines[endLineIndex])) {
      endLineIndex++;
    }

    // Replace the subsection
    const newLines = [
      ...lines.slice(0, lineIndex),
      completionBlock,
      ...lines.slice(endLineIndex),
    ];

    result = newLines.join('\n');
  }

  return result;
}

/**
 * Format the completion summary for output.
 *
 * @param result - The section completion result
 * @returns Formatted summary string
 */
function formatCompletionSummary(result: SectionCompletionResult): string {
  const uniqueSources = [...new Set(result.sourcesUsed)];

  const lines = [
    '',
    '---',
    '**Completion Summary**',
    `- Subsections completed: ${result.completions.length}`,
    `- Citations added: ${result.totalCitations}`,
    `- Sources used: ${uniqueSources.join(', ') || 'None'}`,
    `- Corpus: ${result.corpus}`,
  ];

  if (result.styleProfile) {
    lines.push(`- Style profile: ${result.styleProfile}`);
  }

  return lines.join('\n');
}

/**
 * Main function to complete an incomplete dissertation section.
 *
 * @param inputText - The incomplete section text
 * @param options - Completion options
 * @returns Section completion result
 */
async function completeSection(
  inputText: string,
  options: {
    corpus?: string;
    styleProfile?: StoredStyleProfile;
  }
): Promise<SectionCompletionResult> {
  const corpus = options.corpus || 'rhetorical_ontology';

  // Step 1: Analyze the section to find incomplete subsections
  const incompleteSubsections = analyzeSection(inputText);

  if (incompleteSubsections.length === 0) {
    return {
      originalText: inputText,
      completedText: inputText,
      completions: [],
      totalCitations: 0,
      sourcesUsed: [],
      corpus,
      styleProfile: options.styleProfile?.metadata.name,
    };
  }

  // Step 2: For each incomplete subsection, search for relevant knowledge
  const completions: SubsectionCompletion[] = [];
  const allSourcesUsed: string[] = [];
  let totalCitations = 0;

  for (const subsection of incompleteSubsections) {
    // Build search query from header
    const query = subsection.header
      .replace(/^\d+(\.\d+)*\s*/, '') // Remove section numbers
      .trim();

    // Search knowledge base
    const knowledgeUnits = await searchKnowledgeBase(query, corpus, 5);

    // Generate completion
    const completion = generateSubsectionCompletion(
      subsection,
      knowledgeUnits,
      options.styleProfile
    );

    completions.push(completion);
    totalCitations += completion.citations.length;

    // Track sources used
    for (const citation of completion.citations) {
      const sourceKey = `${citation.author} (${citation.year})`;
      if (!allSourcesUsed.includes(sourceKey)) {
        allSourcesUsed.push(sourceKey);
      }
    }
  }

  // Step 3: Build the completed text
  const completedText = buildCompletedText(inputText, incompleteSubsections, completions);

  return {
    originalText: inputText,
    completedText,
    completions,
    totalCitations,
    sourcesUsed: allSourcesUsed,
    corpus,
    styleProfile: options.styleProfile?.metadata.name,
  };
}

/**
 * Read input text from various sources (file, inline, or stdin).
 *
 * @param options - Command options with input, inline, or neither (stdin)
 * @returns The input text
 */
async function readInputText(options: CompleteSectionOptions): Promise<string> {
  // Option 1: Read from file
  if (options.input) {
    const inputPath = path.resolve(options.input);
    try {
      return await fs.readFile(inputPath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read input file: ${options.input}. ${(error as Error).message}`);
    }
  }

  // Option 2: Use inline text
  if (options.inline) {
    return options.inline;
  }

  // Option 3: Read from stdin
  console.error('Paste your dissertation section (Ctrl+D when done):');

  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf-8');

    process.stdin.on('readable', () => {
      let chunk: string | null;
      while ((chunk = process.stdin.read() as string | null) !== null) {
        data += chunk;
      }
    });

    process.stdin.on('end', () => {
      if (!data.trim()) {
        reject(new Error('No input provided. Use --input <file>, --inline "text", or paste text to stdin.'));
      } else {
        resolve(data);
      }
    });

    process.stdin.on('error', (err) => {
      reject(new Error(`Failed to read from stdin: ${err.message}`));
    });

    // Set a timeout for interactive input
    setTimeout(() => {
      if (!data.trim()) {
        reject(new Error('Input timeout. Use --input <file> or --inline "text" for non-interactive mode.'));
      }
    }, 60000); // 60 second timeout
  });
}

/**
 * phd-complete-section command
 *
 * Completes unfinished dissertation sections using knowledge from the corpus.
 *
 * Usage:
 *   ./scripts/god phd-complete-section --corpus rhetorical_ontology --input section.md
 *   ./scripts/god phd-complete-section --corpus rhetorical_ontology --inline "## Section Title\n\nTODO: Complete this"
 *   ./scripts/god phd-complete-section --corpus rhetorical_ontology  (prompts for stdin)
 */
program
  .command('phd-complete-section')
  .description('Complete unfinished dissertation sections using knowledge from the corpus')
  .option('--input <file>', 'Path to input file containing the incomplete section')
  .option('--inline <text>', 'Inline text for short sections')
  .option('--corpus <name>', 'Corpus to search for knowledge (default: rhetorical_ontology)', 'rhetorical_ontology')
  .option('--style <profile>', 'Style profile name to apply')
  .option('--output <file>', 'Output file path (default: stdout)')
  .option('--json', 'Output result as JSON')
  .action(async (options: CompleteSectionOptions) => {
    try {
      // Read input text
      const inputText = await readInputText(options);

      if (!inputText.trim()) {
        console.error(JSON.stringify({
          success: false,
          error: 'No input text provided',
        }));
        process.exit(1);
      }

      // Load style profile if specified
      let styleProfile: StoredStyleProfile | undefined;
      if (options.style) {
        try {
          const styleManager = new StyleProfileManager();
          styleProfile = styleManager.getProfile(options.style) ?? undefined;
          if (!styleProfile) {
            console.error(`[WARN] Style profile '${options.style}' not found. Proceeding without style.`);
          }
        } catch (error) {
          console.error(`[WARN] Failed to load style profile: ${(error as Error).message}`);
        }
      }

      // Perform section completion
      const result = await completeSection(inputText, {
        corpus: options.corpus || 'rhetorical_ontology',
        styleProfile,
      });

      // Format output
      if (options.json) {
        const output = {
          success: true,
          result: {
            completedText: result.completedText,
            subsectionsCompleted: result.completions.length,
            totalCitations: result.totalCitations,
            sourcesUsed: result.sourcesUsed,
            corpus: result.corpus,
            styleProfile: result.styleProfile,
            completions: result.completions.map(c => ({
              header: c.header,
              citationCount: c.citations.length,
              knowledgeUnitsUsed: c.knowledgeUnitsUsed.length,
            })),
          },
        };

        if (options.output) {
          await fs.writeFile(path.resolve(options.output), JSON.stringify(output, null, 2), 'utf-8');
          console.log(JSON.stringify({ success: true, outputPath: options.output }));
        } else {
          console.log(JSON.stringify(output, null, 2));
        }
      } else {
        // Format human-readable output
        const output = result.completedText + formatCompletionSummary(result);

        if (options.output) {
          await fs.writeFile(path.resolve(options.output), output, 'utf-8');
          console.log(`Completed section written to: ${options.output}`);
          console.log(`  - Subsections completed: ${result.completions.length}`);
          console.log(`  - Citations added: ${result.totalCitations}`);
        } else {
          console.log(output);
        }
      }
    } catch (error) {
      if (options.json) {
        console.error(JSON.stringify({
          success: false,
          error: (error as Error).message,
        }));
      } else {
        console.error(`Error: ${(error as Error).message}`);
      }
      process.exit(1);
    }
  });

// ============================================================================
// PHASE-3-001: User Satisfaction Rating Command
// ============================================================================

import {
  addUserSatisfactionRating,
  getUserSatisfactionRating,
  getAllUserSatisfactionRatings,
  calculateSatisfactionStats,
  formatSatisfactionStats,
} from './session-manager.js';

import { SATISFACTION_SCORE_LABELS, type SatisfactionScore } from './cli-types.js';

/**
 * Options for the rate-satisfaction command
 */
interface RateSatisfactionOptions {
  /** Session ID (uses active session if not specified) */
  session?: string;
  /** Chapter ID to rate */
  chapter: string;
  /** "Sounds like me" score (1-5) */
  soundsLikeMe: string;
  /** Quality satisfaction score (1-5) */
  quality: string;
  /** Would use as-is */
  useAsIs?: boolean;
  /** Optional feedback */
  feedback?: string;
  /** Output as JSON */
  json?: boolean;
}

/**
 * rate-satisfaction command - Collect user satisfaction ratings for chapters
 * PHASE-3-001: User Rating Interface
 */
program
  .command('rate-satisfaction')
  .alias('rate')
  .description('Provide user satisfaction rating for a chapter')
  .option('--session <id>', 'Session ID (uses active session if not specified)')
  .requiredOption('--chapter <num>', 'Chapter number to rate')
  .requiredOption('--sounds-like-me <score>', '"Sounds like me" score (1-5)')
  .requiredOption('--quality <score>', 'Quality satisfaction score (1-5)')
  .option('--use-as-is', 'Would use this chapter as-is', false)
  .option('--feedback <text>', 'Optional free-text feedback')
  .option('--json', 'Output as JSON', false)
  .action(async (options: RateSatisfactionOptions) => {
    try {
      const sessionManager = new SessionManager();

      // Get session
      let session: PipelineSession | null;
      if (options.session) {
        session = await sessionManager.loadSession(options.session);
      } else {
        session = await sessionManager.getMostRecentSession();
      }

      if (!session) {
        throw new Error(options.session
          ? `Session not found: ${options.session}`
          : 'No active session. Use --session <id> to specify a session.');
      }

      // Parse and validate scores
      const soundsLikeMeScore = parseInt(options.soundsLikeMe, 10) as SatisfactionScore;
      const qualityScore = parseInt(options.quality, 10) as SatisfactionScore;
      const chapterId = parseInt(options.chapter, 10);

      if (soundsLikeMeScore < 1 || soundsLikeMeScore > 5) {
        throw new Error('--sounds-like-me must be between 1 and 5');
      }
      if (qualityScore < 1 || qualityScore > 5) {
        throw new Error('--quality must be between 1 and 5');
      }
      if (isNaN(chapterId) || chapterId < 1) {
        throw new Error('--chapter must be a positive integer');
      }

      // Add rating
      addUserSatisfactionRating(
        session,
        chapterId,
        soundsLikeMeScore,
        qualityScore,
        options.useAsIs ?? false,
        options.feedback
      );

      // Save session
      await sessionManager.saveSession(session);

      // Get updated stats
      const stats = calculateSatisfactionStats(session);

      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          rating: {
            chapterId,
            soundsLikeMeScore,
            qualityScore,
            useAsIs: options.useAsIs ?? false,
            feedback: options.feedback,
          },
          stats,
        }));
      } else {
        console.log(`Rating saved for Chapter ${chapterId}:`);
        console.log(`  "Sounds Like Me": ${soundsLikeMeScore}/5 - ${SATISFACTION_SCORE_LABELS[soundsLikeMeScore]}`);
        console.log(`  Quality: ${qualityScore}/5`);
        console.log(`  Would Use As-Is: ${options.useAsIs ? 'Yes' : 'No'}`);
        if (options.feedback) {
          console.log(`  Feedback: ${options.feedback}`);
        }
        console.log('\n' + formatSatisfactionStats(stats));
      }
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({
          success: false,
          error: (error as Error).message,
        }));
      } else {
        console.error(`Error: ${(error as Error).message}`);
      }
      process.exit(1);
    }
  });

/**
 * satisfaction-status command - View user satisfaction ratings
 */
program
  .command('satisfaction-status')
  .alias('sat-status')
  .description('View user satisfaction ratings for a session')
  .option('--session <id>', 'Session ID (uses active session if not specified)')
  .option('--json', 'Output as JSON', false)
  .action(async (options: { session?: string; json?: boolean }) => {
    try {
      const sessionManager = new SessionManager();

      // Get session
      let session: PipelineSession | null;
      if (options.session) {
        session = await sessionManager.loadSession(options.session);
      } else {
        session = await sessionManager.getMostRecentSession();
      }

      if (!session) {
        throw new Error(options.session
          ? `Session not found: ${options.session}`
          : 'No active session. Use --session <id> to specify a session.');
      }

      const ratings = getAllUserSatisfactionRatings(session);
      const stats = calculateSatisfactionStats(session);

      if (options.json) {
        console.log(JSON.stringify({
          success: true,
          sessionId: session.sessionId,
          ratings,
          stats,
        }));
      } else {
        console.log(`User Satisfaction Ratings for Session ${session.sessionId}\n`);

        if (ratings.length === 0) {
          console.log('No ratings collected yet.\n');
          console.log('Use "phd rate-satisfaction --chapter <num> --sounds-like-me <1-5> --quality <1-5>" to add ratings.');
        } else {
          console.log('Ratings by Chapter:');
          for (const rating of ratings) {
            console.log(`\n  Chapter ${rating.chapterId}:`);
            console.log(`    "Sounds Like Me": ${rating.soundsLikeMeScore}/5`);
            console.log(`    Quality: ${rating.qualitySatisfactionScore}/5`);
            console.log(`    Would Use As-Is: ${rating.wouldUseAsIs ? 'Yes' : 'No'}`);
            if (rating.feedback) {
              console.log(`    Feedback: ${rating.feedback}`);
            }
            console.log(`    Rated: ${rating.timestamp}`);
          }
          console.log('\n' + formatSatisfactionStats(stats));
        }
      }
    } catch (error) {
      if (options.json) {
        console.log(JSON.stringify({
          success: false,
          error: (error as Error).message,
        }));
      } else {
        console.error(`Error: ${(error as Error).message}`);
      }
      process.exit(1);
    }
  });

// Export for testing
export {
  commandInit,
  commandNext,
  commandComplete,
  commandStatus,
  commandList,
  commandResume,
  commandAbort,
  commandFinalize,
  determineStyleProfile,
  loadStyleProfile,
  generatePipelineId,
  generateSlug,
  // Re-export phd-pipeline-config utilities for external use (TASK-CONFIG-002)
  PHD_PIPELINE_AGENT_COUNT,
  getCanonicalAgentByKey,
  getCanonicalAgentsByPhase,
  getCanonicalAgentIndex,
  isValidCanonicalAgent,
  // TASK-CONFIG-003: Phase validation functions for external use
  validatePhaseTransition,
  isPhaseComplete,
  getCurrentPhaseAgents,
  getPhaseProgress,
  getAllPhaseProgress,
  getPhaseForAgentIndex,
  isReadyForPhase8,
  // TASK-CLI-001: Agent file validation for external use
  validateAgentFiles,
  // TASK-CLI-003: getNextAgent function export
  // Note: AgentFileNotFoundError, PromptBuildError are already exported as 'export class'
  // Note: NextAgentResult is already exported as 'export interface'
  getNextAgent,
  // Paragraph-level feedback learning
  getOrCreateFeedbackIntegration,
  feedbackIntegrations,
  // Dissertation-native features
  getOrCreateProgressTracker,
  getOrCreateCommitteeSimulator,
  dissertationTrackers,
  // Section completion utilities
  analyzeSection,
  searchKnowledgeBase,
  completeSection,
  committeeSimulators,
};

// TASK-CONFIG-003: Export phase-related types
// Note: AgentValidationResult is already exported with its interface declaration (line 121)
export type { PhaseProgress, IPhdSession, ExtendedStatusResponse };

// Re-export canonical configuration for consumers (TASK-CONFIG-002)
export {
  PHD_AGENTS,
  PHD_PHASES,
  DEFAULT_CONFIG,
} from './phd-pipeline-config.js';

// Run if called directly (not when imported as a module)
// Check if this is the main module using import.meta.url
const isMainModule = process.argv[1] &&
  (process.argv[1].endsWith('phd-cli.ts') ||
   process.argv[1].endsWith('phd-cli.js') ||
   process.argv[1].includes('phd-cli'));

if (isMainModule) {
  program.parse(process.argv);
}
