/**
 * Corpus Integration - Integrates CorpusValidator into the quality pipeline
 *
 * This module bridges the CorpusValidator with the quality gauntlet system,
 * providing a pre-stage validation check that ensures all citations exist
 * in the ingested corpus before proceeding with section completion.
 */

import {
  CorpusValidator,
  corpusValidator,
  createCorpusValidator,
} from './corpus-validator.js';
import type {
  CorpusSource,
  CorpusValidationReport,
  CitationValidationResult,
  CitationLocation,
} from './corpus-validator.js';
import type { QualityIssue, QualityIssueType } from './quality-stage.js';

// ============================================================================
// Corpus Validation Stage Result
// ============================================================================

/**
 * Result from running corpus validation as a quality stage
 */
export interface CorpusValidationStageResult {
  stageName: 'CorpusValidation';
  passed: boolean;
  /** Coverage score (0-1) */
  score: number;
  /** Quality issues for invalid citations */
  issues: QualityIssue[];
  /** Number of valid citations */
  validCitations: number;
  /** Number of invalid citations */
  invalidCitations: number;
  /** Coverage rate (0-1) */
  coverageRate: number;
  /** Detailed validation report */
  report: CorpusValidationReport;
  /** Execution time in milliseconds */
  evaluationTimeMs?: number;
}

// ============================================================================
// Corpus Validation Stage
// ============================================================================

/**
 * Run corpus validation as a quality stage
 *
 * This function validates all citations in the content against the corpus
 * and returns results in a format compatible with the quality gauntlet.
 *
 * @param content - The content to validate
 * @param options - Validation options
 * @returns Corpus validation stage result
 */
export async function runCorpusValidationStage(
  content: string,
  options: {
    /** Allow external sources (bypasses validation) */
    allowExternal?: boolean;
    /** Minimum coverage threshold (default 1.0) */
    threshold?: number;
    /** Chapter ID for issue location */
    chapterId?: number;
  } = {}
): Promise<CorpusValidationStageResult> {
  const startTime = Date.now();
  const { chapterId = 1 } = options;

  const { passed, report, errorMessage } = await corpusValidator.enforceCorpusOnly(
    content,
    options
  );

  // Convert invalid citations to QualityIssue format
  const issues: QualityIssue[] = report.invalid.map((inv, idx) =>
    createCorpusIssue(inv, idx, chapterId)
  );

  return {
    stageName: 'CorpusValidation',
    passed,
    score: report.coverageRate,
    issues,
    validCitations: report.validCitations,
    invalidCitations: report.invalidCitations,
    coverageRate: report.coverageRate,
    report,
    evaluationTimeMs: Date.now() - startTime,
  };
}

/**
 * Create a QualityIssue from a CitationValidationResult
 */
function createCorpusIssue(
  inv: CitationValidationResult,
  index: number,
  chapterId: number
): QualityIssue {
  const suggestion =
    inv.similarSources.length > 0
      ? `Consider using: ${inv.similarSources
          .map((s) => `${s.author} - ${s.title}`)
          .join(' or ')}`
      : 'Verify source exists in corpus or use --allow-external flag';

  return {
    id: `corpus-${index}-${Date.now().toString(36)}`,
    type: 'missing-source' as QualityIssueType,
    severity: 'critical',
    location: {
      chapterId,
      paragraphIndex: 0, // Would need paragraph detection for accuracy
      startOffset: inv.location.charStart,
      endOffset: inv.location.charEnd,
    },
    description: `Citation not found in corpus: "${inv.citation}" by ${inv.extractedAuthor}`,
    suggestion,
    autoFixable: false,
    contextSnippet: inv.location.excerpt,
    confidence: 1 - inv.confidence, // Higher confidence in the issue when lower match confidence
  };
}

// ============================================================================
// Pre-Stage Validation
// ============================================================================

/**
 * Options for pre-stage corpus validation
 */
export interface CorpusPreStageOptions {
  /** Allow external sources */
  allowExternal?: boolean;
  /** Minimum coverage threshold */
  threshold?: number;
  /** Whether to throw on validation failure */
  throwOnFailure?: boolean;
  /** Chapter ID for context */
  chapterId?: number;
}

/**
 * Run corpus validation as a pre-stage check before the main quality gauntlet
 *
 * This is the recommended entry point for integrating corpus validation
 * into the section completion workflow.
 *
 * @param content - Content to validate
 * @param options - Validation options
 * @returns Validation result with pass/fail status
 */
export async function runCorpusPreStage(
  content: string,
  options: CorpusPreStageOptions = {}
): Promise<{
  passed: boolean;
  result: CorpusValidationStageResult;
  errorMessage?: string;
}> {
  const { throwOnFailure = false, ...validationOptions } = options;

  const result = await runCorpusValidationStage(content, validationOptions);

  if (!result.passed && throwOnFailure) {
    const errorMessage = formatValidationError(result);
    throw new CorpusValidationError(errorMessage, result);
  }

  return {
    passed: result.passed,
    result,
    errorMessage: result.passed ? undefined : formatValidationError(result),
  };
}

/**
 * Format validation errors for display
 */
function formatValidationError(result: CorpusValidationStageResult): string {
  const lines = [
    `CORPUS VALIDATION FAILED: ${result.invalidCitations} of ${result.validCitations + result.invalidCitations} citations not found in corpus.`,
    '',
    'Invalid citations:',
    ...result.issues.map(
      (issue) => `  - ${issue.description}`
    ),
    '',
    'Suggestions:',
    ...result.report.suggestions,
    '',
    'To proceed with external sources, use --allow-external flag.',
  ];

  return lines.join('\n');
}

// ============================================================================
// Error Class
// ============================================================================

/**
 * Error thrown when corpus validation fails and throwOnFailure is true
 */
export class CorpusValidationError extends Error {
  constructor(
    message: string,
    public readonly result: CorpusValidationStageResult
  ) {
    super(message);
    this.name = 'CorpusValidationError';
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Quick check if content has any citations at all
 */
export async function hasCitations(content: string): Promise<boolean> {
  await corpusValidator.initialize();
  const citations = corpusValidator.extractCitations(content);
  return citations.length > 0;
}

/**
 * Get citation count without full validation
 */
export async function getCitationCount(content: string): Promise<number> {
  await corpusValidator.initialize();
  const citations = corpusValidator.extractCitations(content);
  return citations.length;
}

/**
 * Get available corpus sources for reference
 */
export async function getAvailableCorpusSources(): Promise<CorpusSource[]> {
  await corpusValidator.initialize();
  return corpusValidator.getAvailableSources();
}

/**
 * Generate a markdown summary of available corpus sources
 */
export async function generateCorpusSummaryMarkdown(): Promise<string> {
  await corpusValidator.initialize();
  return corpusValidator.generateCorpusSummary();
}

/**
 * Search corpus by author
 */
export async function searchCorpusByAuthor(
  authorQuery: string
): Promise<CorpusSource[]> {
  await corpusValidator.initialize();
  return corpusValidator.searchByAuthor(authorQuery);
}

/**
 * Search corpus by title
 */
export async function searchCorpusByTitle(
  titleQuery: string
): Promise<CorpusSource[]> {
  await corpusValidator.initialize();
  return corpusValidator.searchByTitle(titleQuery);
}

// ============================================================================
// Exports
// ============================================================================

export {
  CorpusValidator,
  corpusValidator,
  createCorpusValidator,
  type CorpusSource,
  type CorpusValidationReport,
  type CitationValidationResult,
  type CitationLocation,
};
