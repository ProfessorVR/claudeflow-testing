/**
 * Stage I/O contracts for the v2 writing pipeline.
 *
 * Data flows: RetrievalStage → DraftingStage → ValidationStage
 * Each stage has a well-defined input/output contract.
 */

import type { ContextChunk } from '../../retrieval/types.js';
import type { CorpusConstraint, CorpusSource, EnforcementResult } from '../../core/writing/index.js';
import type { SanitizationResult } from '../../cli/composition/prose-sanitizer.js';
import type { QualityValidationResult } from '../quality-integration.js';
import type { Logger } from '../../retrieval/types.js';

// ============================================================
// Feature flag
// ============================================================

export type PipelineVersion = 'legacy' | 'v2';

export function getPipelineVersion(options: { pipelineVersion?: PipelineVersion }): PipelineVersion {
  // CLI flag overrides env var
  if (options.pipelineVersion) {
    if (options.pipelineVersion === 'legacy') {
      process.stderr.write(
        '[DEPRECATION] --pipeline-version legacy is deprecated and will be removed. ' +
        'The v2 staged pipeline (RetrievalStage → DraftingStage → ValidationStage) is now the default.\n'
      );
    }
    return options.pipelineVersion;
  }
  const env = process.env.WRITING_PIPELINE_VERSION;
  if (env === 'legacy') {
    process.stderr.write(
      '[DEPRECATION] WRITING_PIPELINE_VERSION=legacy is deprecated. ' +
      'Remove this env var to use the v2 pipeline (now default).\n'
    );
    return 'legacy';
  }
  if (env === 'v2') return 'v2';
  return 'v2';
}

// ============================================================
// PipelineContext — 3-tier error observability
// ============================================================

export interface PipelineEvent {
  stage: string;
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface PipelineContext {
  hardFailures: PipelineEvent[];
  degradedEvents: PipelineEvent[];
  warnings: PipelineEvent[];
  logger: Logger;
}

export type PipelineHealth = 'clean' | 'degraded' | 'failed';

export function computePipelineHealth(ctx: PipelineContext): PipelineHealth {
  if (ctx.hardFailures.length > 0) return 'failed';
  if (ctx.degradedEvents.length > 0) return 'degraded';
  return 'clean';
}

export function createPipelineContext(logger: Logger): PipelineContext {
  return {
    hardFailures: [],
    degradedEvents: [],
    warnings: [],
    logger,
  };
}

export function recordHardFailure(ctx: PipelineContext, stage: string, message: string, metadata?: Record<string, unknown>): void {
  ctx.hardFailures.push({ stage, message, timestamp: Date.now(), metadata });
  ctx.logger.error(`[${stage}] HARD FAILURE: ${message}`);
}

export function recordDegraded(ctx: PipelineContext, stage: string, message: string, metadata?: Record<string, unknown>): void {
  ctx.degradedEvents.push({ stage, message, timestamp: Date.now(), metadata });
  ctx.logger.warn(`[${stage}] DEGRADED: ${message}`);
}

export function recordWarning(ctx: PipelineContext, stage: string, message: string, metadata?: Record<string, unknown>): void {
  ctx.warnings.push({ stage, message, timestamp: Date.now(), metadata });
  ctx.logger.info(`[${stage}] WARNING: ${message}`);
}

// ============================================================
// Stage I/O contracts
// ============================================================

export interface RetrievalResult {
  chunks: ContextChunk[];
  corpusConstraint: CorpusConstraint | null;
  corpusContextInfo: {
    used: boolean;
    chunkCount: number;
    collections: string[];
    citations: string[];
  };
  primaryAuthors: string[];
  knowledgeUnits: string[];
  structuralEdges: string[];
  ontologyLines: string[];
  hookLines: string[];
  tensionLines: string[];
  stylePrompt: string;
  sectionConstraints: string[];
  subsections: string[];
  /** True when subsections were derived from explicit user-provided section headings. */
  hasExplicitHeadings: boolean;
  wordTarget: string;
  /** Chunk IDs seen during retrieval — prevents duplicates in supplemental passes */
  seenIds: Set<string>;
  preventionPlan?: {
    blacklistedAuthors: string[];
    strengthenedConstraints: string[];
    underCitedSources: string[];
    overCitedSources: string[];
  };
  multiStepV1Stats?: {
    wordCount: number;
    citationCount: number;
    quotationCount: number;
    claimsWithoutCitation: number;
    factualClaimsWithoutCitation: number;
    interpretiveClaimsWithoutCitation: number;
    uniqueAuthors: string[];
    issues: Array<{ type: string; severity: string; detail: string }>;
    qualityScore?: number;
  };
  primaryUnderCoverage?: string[];
}

export interface DraftingResult {
  content: string;
  generationMethod: 'claude-code' | 'anthropic-api' | 'inline-validation' | 'mock' | 'task-queued';
  inlineValidationResult?: {
    allPassed: boolean;
    qualityScore: number;
    stats: {
      totalUnits: number;
      passedFirstAttempt: number;
      passedAfterRetry: number;
      failed: number;
      totalAttempts: number;
      avgAttemptsPerUnit: number;
    };
    failedUnits: Array<{
      unit: { type: string; intent: string };
      lastValidationResult: {
        overallScore: number;
        issues: Array<{ message: string }>;
      };
    }>;
  };
}

export interface ValidationResult {
  content: string;
  qualityScore: number;
  bodyWordCount: number;
  pipelineHealth: PipelineHealth;
  sanitizationResult?: SanitizationResult;
  qualityValidation?: QualityValidationResult;
  citationEnforcement?: {
    action: string;
    totalCitations: number;
    validCitations: number;
    hallucinatedCitations: number;
    correctionsMade: number;
    missingPageNumbers: number;
    passRate: number;
    report?: string;
  };
  compositionMetadata?: {
    used: boolean;
    succeeded?: boolean;
    wordCount?: number;
    qualityScore?: number;
    processingTime?: number;
  };
  endnotesMetadata?: {
    generated: boolean;
    count: number;
    supportingQuotationsCount: number;
  };
  sourceVerification?: {
    verified: boolean;
    totalCitations?: number;
    foundInCorpus?: number;
    missingFromCorpus?: number;
  };
  multiStepDiagnostics?: {
    v1Diagnostics: RetrievalResult['multiStepV1Stats'];
    preventionPlan: RetrievalResult['preventionPlan'];
    v2Diagnostics: {
      blacklistedAuthorsUsedInV2: number;
      blacklistedAuthorsInMainText: number;
      blacklistedAuthorsInAppendix: number;
    };
  };
}
