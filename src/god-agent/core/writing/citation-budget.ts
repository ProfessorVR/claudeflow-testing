/**
 * Citation Budget System (Phase 5: Citation Budget)
 *
 * Calculates and enforces citation budgets based on corpus retrieval.
 * Prevents over-citation scenarios where the LLM would need to hallucinate
 * because there aren't enough corpus sources to support all claims.
 */

import type { CorpusSource } from './writing-generator.js';
import type { ContextChunk } from './corpus-constraint-builder.js';

/**
 * Citation budget calculation result
 */
export interface CitationBudgetResult {
  /** Expected number of citations for target word count */
  expectedCitations: number;
  /** Maximum citations supportable by retrieved corpus */
  maxSupportableCitations: number;
  /** Deficit (how many citations short) */
  deficit: number;
  /** Whether budget is sufficient */
  sufficient: boolean;
  /** Warning message if deficit exists */
  warning: string | null;
  /** Recommendations for addressing deficit */
  recommendations: string[];
  /** Detailed breakdown */
  breakdown: {
    /** Target word count */
    targetWords: number;
    /** Citation density (citations per 100 words) */
    citationDensity: number;
    /** Unique sources available */
    uniqueSources: number;
    /** Average citations per source */
    citationsPerSource: number;
  };
}

/**
 * Citation budget options
 */
export interface CitationBudgetOptions {
  /** Target word count for the document */
  targetWords: number;
  /** Citation density (citations per 100 words, default: 0.67 = 1 per 150 words) */
  citationDensity?: number;
  /** Average citations supportable per corpus chunk (default: 2.5) */
  citationsPerChunk?: number;
  /** Document type affects expected density */
  documentType?: 'dissertation' | 'paper' | 'essay' | 'report';
  /** Whether to include primary source references (ancient texts) */
  includePrimarySources?: boolean;
}

/**
 * Document type citation densities (citations per 100 words)
 */
const DOCUMENT_TYPE_DENSITIES: Record<string, number> = {
  dissertation: 0.8,  // ~1 citation per 125 words
  paper: 0.67,        // ~1 citation per 150 words
  essay: 0.5,         // ~1 citation per 200 words
  report: 0.4,        // ~1 citation per 250 words
};

/**
 * Calculate citation budget based on corpus and target length
 *
 * @param chunks - Retrieved corpus chunks
 * @param options - Budget calculation options
 * @returns Budget result with recommendations
 */
export function calculateCitationBudget(
  chunks: ContextChunk[],
  options: CitationBudgetOptions
): CitationBudgetResult {
  const {
    targetWords,
    citationDensity = DOCUMENT_TYPE_DENSITIES[options.documentType || 'paper'],
    citationsPerChunk = 2.5,
    includePrimarySources = true,
  } = options;

  // Calculate unique sources from chunks
  const uniqueSources = new Set<string>();
  for (const chunk of chunks) {
    if (chunk.metadata.author && chunk.metadata.year) {
      uniqueSources.add(`${chunk.metadata.author}_${chunk.metadata.year}`);
    }
  }

  // Calculate expected citations
  const expectedCitations = Math.ceil((targetWords / 100) * citationDensity);

  // Calculate max supportable citations
  // Each unique source can support multiple citations (quotes, paraphrases, references)
  const maxSupportableCitations = Math.floor(uniqueSources.size * citationsPerChunk);

  // Calculate deficit
  const deficit = Math.max(0, expectedCitations - maxSupportableCitations);
  const sufficient = deficit === 0;

  // Generate warning if deficit exists
  let warning: string | null = null;
  if (deficit > 0) {
    warning = `Citation budget deficit: Need ~${expectedCitations} citations but corpus only supports ~${maxSupportableCitations}. ` +
      `${deficit} citations would need to be hallucinated or omitted.`;
  }

  // Generate recommendations
  const recommendations: string[] = [];
  if (deficit > 0) {
    recommendations.push(
      `Retrieve ${Math.ceil(deficit / citationsPerChunk)} more corpus chunks to support all citations`
    );
    recommendations.push(
      `Reduce target word count to ~${Math.floor(maxSupportableCitations / citationDensity * 100)} words`
    );
    recommendations.push(
      `Use more citations per source (synthesis, multiple quotes from same source)`
    );
    recommendations.push(
      `Include [CITATION NEEDED] placeholders for claims requiring unavailable sources`
    );
  }

  return {
    expectedCitations,
    maxSupportableCitations,
    deficit,
    sufficient,
    warning,
    recommendations,
    breakdown: {
      targetWords,
      citationDensity,
      uniqueSources: uniqueSources.size,
      citationsPerSource: citationsPerChunk,
    },
  };
}

/**
 * Calculate budget from corpus sources directly
 */
export function calculateBudgetFromSources(
  sources: CorpusSource[],
  options: CitationBudgetOptions
): CitationBudgetResult {
  const {
    targetWords,
    citationDensity = DOCUMENT_TYPE_DENSITIES[options.documentType || 'paper'],
    citationsPerChunk = 2.5,
  } = options;

  const expectedCitations = Math.ceil((targetWords / 100) * citationDensity);
  const maxSupportableCitations = Math.floor(sources.length * citationsPerChunk);
  const deficit = Math.max(0, expectedCitations - maxSupportableCitations);
  const sufficient = deficit === 0;

  let warning: string | null = null;
  if (deficit > 0) {
    warning = `Citation budget deficit: Need ~${expectedCitations} citations but only ${sources.length} sources available (supports ~${maxSupportableCitations} citations).`;
  }

  const recommendations: string[] = [];
  if (deficit > 0) {
    recommendations.push(`Add ${Math.ceil(deficit / citationsPerChunk)} more sources to corpus`);
    recommendations.push(`Reduce word count to ~${Math.floor(maxSupportableCitations / citationDensity * 100)} words`);
  }

  return {
    expectedCitations,
    maxSupportableCitations,
    deficit,
    sufficient,
    warning,
    recommendations,
    breakdown: {
      targetWords,
      citationDensity,
      uniqueSources: sources.length,
      citationsPerSource: citationsPerChunk,
    },
  };
}

/**
 * Suggest optimal word count for given corpus
 *
 * @param chunks - Retrieved corpus chunks
 * @param documentType - Type of document
 * @returns Recommended word count range
 */
export function suggestWordCount(
  chunks: ContextChunk[],
  documentType: 'dissertation' | 'paper' | 'essay' | 'report' = 'paper'
): {
  minimum: number;
  optimal: number;
  maximum: number;
  citationsSupported: number;
} {
  // Count unique sources
  const uniqueSources = new Set<string>();
  for (const chunk of chunks) {
    if (chunk.metadata.author && chunk.metadata.year) {
      uniqueSources.add(`${chunk.metadata.author}_${chunk.metadata.year}`);
    }
  }

  const citationsPerSource = 2.5;
  const citationsSupported = Math.floor(uniqueSources.size * citationsPerSource);
  const density = DOCUMENT_TYPE_DENSITIES[documentType];

  // Calculate word counts
  const optimal = Math.floor((citationsSupported / density) * 100);
  const minimum = Math.floor(optimal * 0.7); // Allow 30% fewer citations
  const maximum = Math.floor(optimal * 1.2); // Allow 20% more (some uncited claims ok)

  return {
    minimum,
    optimal,
    maximum,
    citationsSupported,
  };
}

/**
 * Check if content length is appropriate for corpus
 *
 * @param content - Generated content
 * @param chunks - Corpus chunks
 * @param documentType - Document type
 * @returns Assessment result
 */
export function assessContentLength(
  content: string,
  chunks: ContextChunk[],
  documentType: 'dissertation' | 'paper' | 'essay' | 'report' = 'paper'
): {
  wordCount: number;
  assessment: 'under' | 'optimal' | 'over';
  message: string;
  recommendation: string | null;
} {
  const wordCount = content.split(/\s+/).filter(w => w.length > 0).length;
  const suggested = suggestWordCount(chunks, documentType);

  let assessment: 'under' | 'optimal' | 'over';
  let message: string;
  let recommendation: string | null = null;

  if (wordCount < suggested.minimum) {
    assessment = 'under';
    message = `Content (${wordCount} words) is shorter than minimum (${suggested.minimum} words) for ${chunks.length} corpus chunks.`;
    recommendation = `Consider expanding to at least ${suggested.minimum} words to fully utilize available sources.`;
  } else if (wordCount > suggested.maximum) {
    assessment = 'over';
    message = `Content (${wordCount} words) exceeds maximum (${suggested.maximum} words) supportable by ${chunks.length} corpus chunks.`;
    recommendation = `Reduce to ~${suggested.optimal} words or retrieve ${Math.ceil((wordCount - suggested.maximum) / 150)} more sources.`;
  } else {
    assessment = 'optimal';
    message = `Content length (${wordCount} words) is appropriate for available corpus (${chunks.length} chunks).`;
  }

  return {
    wordCount,
    assessment,
    message,
    recommendation,
  };
}

/**
 * Budget check result for quick validation
 */
export interface BudgetCheckResult {
  passed: boolean;
  warning: string | null;
  deficit: number;
}

/**
 * Quick budget check before generation
 *
 * @param targetWords - Target word count
 * @param corpusChunkCount - Number of corpus chunks available
 * @param documentType - Document type
 * @returns Quick pass/fail result
 */
export function quickBudgetCheck(
  targetWords: number,
  corpusChunkCount: number,
  documentType: 'dissertation' | 'paper' | 'essay' | 'report' = 'paper'
): BudgetCheckResult {
  const density = DOCUMENT_TYPE_DENSITIES[documentType];
  const expectedCitations = Math.ceil((targetWords / 100) * density);

  // Estimate unique sources (assume ~60% of chunks are unique sources)
  const estimatedUniqueSources = Math.floor(corpusChunkCount * 0.6);
  const maxCitations = Math.floor(estimatedUniqueSources * 2.5);

  const deficit = Math.max(0, expectedCitations - maxCitations);

  return {
    passed: deficit === 0,
    warning: deficit > 0
      ? `May need ${deficit} more citations than corpus supports. Consider retrieving more sources.`
      : null,
    deficit,
  };
}
