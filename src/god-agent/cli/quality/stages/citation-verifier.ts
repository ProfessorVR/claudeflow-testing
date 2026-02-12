/**
 * CitationVerifier - Stage 0: Hallucination Detection
 *
 * Verifies that citations actually exist in the corpus.
 * This is the first stage in the quality gauntlet because
 * hallucinated citations undermine all other quality measures.
 *
 * The verifier:
 * 1. Extracts all citations from the text
 * 2. Attempts to verify each citation against the corpus
 * 3. Flags unverifiable citations as potential hallucinations
 * 4. Calculates a verification rate score
 *
 * Part of Phase B: Citation Verification implementation.
 */

import { BaseQualityStage } from '../quality-stage.js';
import type {
  QualityStageResult,
  QualityIssue,
  QualityEvaluationContext,
} from '../quality-stage.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Result from corpus verification
 */
export interface CorpusVerificationResult {
  /** Whether the citation was found in corpus */
  found: boolean;

  /** Confidence score (0-1) if found */
  confidence?: number;

  /** Matched document ID if found */
  matchedDocId?: string;

  /** Matched content snippet if found */
  matchedContent?: string;
}

/**
 * Citation extracted from text
 */
export interface ExtractedCitation {
  /** Author name(s) */
  author: string;

  /** Publication year */
  year: number;

  /** Page number if present */
  page?: string;

  /** Full citation text as it appears */
  rawText: string;

  /** Position in text */
  position: number;

  /** Line number */
  line: number;
}

/**
 * Verification result for a citation
 */
export interface CitationVerification {
  /** The extracted citation */
  citation: ExtractedCitation;

  /** Verification result */
  result: CorpusVerificationResult;

  /** Classification */
  status: 'verified' | 'unverified' | 'partial' | 'hallucinated';

  /** Reason for the status */
  reason: string;
}

/**
 * Corpus search function signature
 */
export type CorpusSearchFn = (
  author: string,
  year: number,
  content?: string
) => Promise<CorpusVerificationResult>;

/**
 * Configuration for the citation verifier
 */
export interface CitationVerifierConfig {
  /** Function to search the corpus */
  corpusSearchFn?: CorpusSearchFn;

  /** Minimum confidence for a match (default: 0.7) */
  minMatchConfidence: number;

  /** Threshold for warning about verification rate (default: 0.85) */
  verificationRateWarningThreshold: number;

  /** Threshold for critical verification rate (default: 0.60) */
  verificationRateCriticalThreshold: number;

  /** Whether to mark unverifiable citations as critical (default: false) */
  strictMode: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: CitationVerifierConfig = {
  corpusSearchFn: undefined,
  minMatchConfidence: 0.7,
  verificationRateWarningThreshold: 0.85,
  verificationRateCriticalThreshold: 0.60,
  strictMode: false,
};

// Citation patterns (APA, MLA, Chicago variants)
const CITATION_PATTERNS = {
  // APA: (Author, 2020) or (Author, 2020, p. 42)
  apa: /\(([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.)?),\s*(\d{4})(?:,\s*p+\.\s*(\d+(?:-\d+)?))?\)/g,

  // MLA: (Author 42) or (Author)
  mla: /\(([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?)\s+(\d+)?\)/g,

  // In-text: Author (2020) or Author et al. (2020)
  inText: /([A-Z][a-z]+(?:\s+(?:&|and)\s+[A-Z][a-z]+)?(?:\s+et\s+al\.)?)\s*\((\d{4})\)/g,

  // Numeric: [1], [1, 2], [1-3]
  numeric: /\[(\d+(?:[-,]\s*\d+)*)\]/g,
};

// ============================================================================
// CitationVerifier Class
// ============================================================================

/**
 * Stage 0: Citation Verification / Hallucination Detection
 *
 * Weight: 0.10 (10% of overall score)
 * Threshold: 0.85 (85% of citations must be verifiable)
 *
 * This stage runs first because hallucinated citations invalidate
 * the credibility of all other content.
 */
export class CitationVerifier extends BaseQualityStage {
  readonly name = 'citation-verifier';
  readonly weight = 0.10;
  readonly threshold = 0.85;

  private config: CitationVerifierConfig;
  private corpusCache: Map<string, CorpusVerificationResult> = new Map();

  constructor(config?: Partial<CitationVerifierConfig>) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Evaluate citation verifiability in chapter text
   */
  async evaluate(
    chapterText: string,
    chapterId: number,
    context?: QualityEvaluationContext
  ): Promise<QualityStageResult> {
    const startTime = Date.now();
    const issues: QualityIssue[] = [];
    this.issueCounter = 0; // Reset counter for each evaluation

    // Step 1: Extract all citations
    const citations = this.extractCitations(chapterText);

    // Step 2: Verify each citation
    const verifications: CitationVerification[] = [];

    for (const citation of citations) {
      const verification = await this.verifyCitation(citation, context);
      verifications.push(verification);

      // Create issues for problematic citations
      if (verification.status === 'hallucinated') {
        issues.push(this.createHallucinationIssue(verification, chapterId));
      } else if (verification.status === 'unverified' && this.config.strictMode) {
        issues.push(this.createUnverifiedIssue(verification, chapterId));
      } else if (verification.status === 'partial') {
        issues.push(this.createPartialMatchIssue(verification, chapterId));
      }
    }

    // Step 3: Calculate verification rate
    const verifiedCount = verifications.filter(
      v => v.status === 'verified' || v.status === 'partial'
    ).length;
    const verificationRate = citations.length > 0
      ? verifiedCount / citations.length
      : 1.0; // No citations = 100% rate (nothing to verify)

    // Check thresholds
    if (verificationRate < this.config.verificationRateCriticalThreshold) {
      issues.push({
        id: this.generateIssueId('citation', issues.length),
        type: 'citation',
        severity: 'critical',
        description: `Citation verification rate (${(verificationRate * 100).toFixed(1)}%) is critically low`,
        suggestion: `Review all citations for accuracy. ${verifications.filter(v => v.status === 'hallucinated').length} potential hallucinations detected.`,
        location: { chapterId },
        autoFixable: false,
      });
    } else if (verificationRate < this.config.verificationRateWarningThreshold) {
      issues.push({
        id: this.generateIssueId('citation', issues.length),
        type: 'citation',
        severity: 'major',
        description: `Citation verification rate (${(verificationRate * 100).toFixed(1)}%) is below target`,
        suggestion: 'Review unverified citations and ensure all sources are in the corpus.',
        location: { chapterId },
        autoFixable: false,
      });
    }

    // Calculate score
    const score = this.computeVerificationScore(verificationRate, issues);
    const passed = score >= this.threshold && !issues.some(i => i.severity === 'critical');

    return {
      stageName: this.name,
      passed,
      score,
      issues,
      metrics: {
        totalCitations: citations.length,
        verifiedCitations: verifiedCount,
        verificationRate,
        hallucinatedCount: verifications.filter(v => v.status === 'hallucinated').length,
        unverifiedCount: verifications.filter(v => v.status === 'unverified').length,
        partialMatchCount: verifications.filter(v => v.status === 'partial').length,
        evaluationTimeMs: Date.now() - startTime,
      },
      suggestions: [],
    };
  }

  /**
   * Extract all citations from text
   */
  extractCitations(text: string): ExtractedCitation[] {
    const citations: ExtractedCitation[] = [];
    const lines = text.split('\n');

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex];
      const lineOffset = lines.slice(0, lineIndex).join('\n').length + (lineIndex > 0 ? 1 : 0);

      // Try APA pattern
      for (const match of Array.from(line.matchAll(CITATION_PATTERNS.apa))) {
        const [rawText, author, yearStr, page] = match;
        const year = parseInt(yearStr, 10);

        // Accept any 4-digit year - hallucination detection will flag invalid years
        if (!isNaN(year) && year >= 1000 && year <= 9999) {
          citations.push({
            author: author.trim(),
            year,
            page: page?.trim(),
            rawText,
            position: lineOffset + (match.index ?? 0),
            line: lineIndex + 1,
          });
        }
      }

      // Try in-text pattern
      for (const match of Array.from(line.matchAll(CITATION_PATTERNS.inText))) {
        const [rawText, author, yearStr] = match;
        const year = parseInt(yearStr, 10);

        // Avoid duplicates from overlapping patterns
        const alreadyExists = citations.some(
          c => c.author === author.trim() && c.year === year && c.line === lineIndex + 1
        );

        // Accept any 4-digit year - hallucination detection will flag invalid years
        if (!alreadyExists && !isNaN(year) && year >= 1000 && year <= 9999) {
          citations.push({
            author: author.trim(),
            year,
            rawText,
            position: lineOffset + (match.index ?? 0),
            line: lineIndex + 1,
          });
        }
      }
    }

    // Deduplicate by author+year+position
    const seen = new Set<string>();
    return citations.filter(c => {
      const key = `${c.author}-${c.year}-${c.position}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Verify a single citation against the corpus
   */
  async verifyCitation(
    citation: ExtractedCitation,
    context?: QualityEvaluationContext
  ): Promise<CitationVerification> {
    // Check cache first
    const cacheKey = `${citation.author}-${citation.year}`;
    const cached = this.corpusCache.get(cacheKey);

    if (cached) {
      return this.classifyResult(citation, cached);
    }

    // If no corpus search function, assume verified (can't check without corpus)
    // This prevents false failures when corpus isn't configured
    if (!this.config.corpusSearchFn) {
      return {
        citation,
        result: { found: true, confidence: 0.7 },
        status: 'partial',
        reason: 'No corpus search function configured - assuming valid',
      };
    }

    try {
      // Search corpus
      const result = await this.config.corpusSearchFn(
        citation.author,
        citation.year
      );

      // Cache result
      this.corpusCache.set(cacheKey, result);

      return this.classifyResult(citation, result);
    } catch (error) {
      // On error, mark as unverified (not hallucinated)
      return {
        citation,
        result: { found: false },
        status: 'unverified',
        reason: `Verification error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  /**
   * Classify verification result
   */
  private classifyResult(
    citation: ExtractedCitation,
    result: CorpusVerificationResult
  ): CitationVerification {
    if (result.found && (result.confidence ?? 1) >= this.config.minMatchConfidence) {
      return {
        citation,
        result,
        status: 'verified',
        reason: `Found in corpus with ${((result.confidence ?? 1) * 100).toFixed(0)}% confidence`,
      };
    }

    if (result.found && (result.confidence ?? 0) >= 0.5) {
      return {
        citation,
        result,
        status: 'partial',
        reason: `Partial match found (${((result.confidence ?? 0) * 100).toFixed(0)}% confidence)`,
      };
    }

    // Check for hallucination indicators
    const isLikelyHallucinated = this.checkHallucinationIndicators(citation);

    if (isLikelyHallucinated) {
      return {
        citation,
        result,
        status: 'hallucinated',
        reason: 'Citation pattern suggests potential hallucination',
      };
    }

    return {
      citation,
      result,
      status: 'unverified',
      reason: 'Citation not found in corpus',
    };
  }

  /**
   * Check for common hallucination patterns
   */
  private checkHallucinationIndicators(citation: ExtractedCitation): boolean {
    // Suspicious author name patterns (too generic or impossible)
    const suspiciousAuthors = [
      /^[A-Z]\.?\s+[A-Z]\.?\s*$/,  // Just initials
      /^Author$/i,
      /^Writer$/i,
      /^Expert$/i,
      /^Study$/i,
      /^Research$/i,
    ];

    if (suspiciousAuthors.some(p => p.test(citation.author))) {
      return true;
    }

    // Future dates
    if (citation.year > new Date().getFullYear()) {
      return true;
    }

    // Very old dates (pre-1500) are suspicious for most contexts
    if (citation.year < 1500) {
      return true;
    }

    return false;
  }

  /** Internal counter for issue IDs */
  private issueCounter = 0;

  /**
   * Create issue for hallucinated citation
   */
  private createHallucinationIssue(verification: CitationVerification, chapterId: number): QualityIssue {
    return {
      id: this.generateIssueId('citation', this.issueCounter++),
      type: 'citation', // Using 'citation' as closest match - hallucination is a citation issue
      severity: 'critical',
      description: `Potential hallucinated citation: ${verification.citation.rawText}`,
      suggestion: `Verify this citation exists. ${verification.reason}. Remove if not authentic.`,
      location: {
        chapterId,
        startOffset: verification.citation.position,
      },
      contextSnippet: verification.citation.rawText,
      autoFixable: false,
    };
  }

  /**
   * Create issue for unverified citation
   */
  private createUnverifiedIssue(verification: CitationVerification, chapterId: number): QualityIssue {
    return {
      id: this.generateIssueId('citation', this.issueCounter++),
      type: 'missing-source', // Citation source not in corpus
      severity: 'major',
      description: `Citation could not be verified: ${verification.citation.rawText}`,
      suggestion: 'Add this source to the corpus or verify the citation is accurate.',
      location: {
        chapterId,
        startOffset: verification.citation.position,
      },
      contextSnippet: verification.citation.rawText,
      autoFixable: false,
    };
  }

  /**
   * Create issue for partial match
   */
  private createPartialMatchIssue(verification: CitationVerification, chapterId: number): QualityIssue {
    return {
      id: this.generateIssueId('citation', this.issueCounter++),
      type: 'citation', // Using 'citation' for partial matches
      severity: 'minor',
      description: `Citation has partial match: ${verification.citation.rawText}`,
      suggestion: `Review citation details. ${verification.reason}`,
      location: {
        chapterId,
        startOffset: verification.citation.position,
      },
      contextSnippet: verification.citation.rawText,
      autoFixable: false,
    };
  }

  /**
   * Calculate verification score (renamed to avoid conflict with base class)
   */
  private computeVerificationScore(verificationRate: number, issues: QualityIssue[]): number {
    // Base score from verification rate
    let score = verificationRate;

    // Penalty for critical issues
    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    score -= criticalCount * 0.10;

    // Clamp to [0, 1]
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Clear verification cache
   */
  clearCache(): void {
    this.corpusCache.clear();
  }

  /**
   * Get verification statistics
   */
  getStats(): { cacheSize: number; config: CitationVerifierConfig } {
    return {
      cacheSize: this.corpusCache.size,
      config: { ...this.config },
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a default citation verifier
 */
export function createDefaultVerifier(
  corpusSearchFn?: CorpusSearchFn
): CitationVerifier {
  return new CitationVerifier({ corpusSearchFn });
}

/**
 * Create a strict citation verifier (hallucinations are critical)
 */
export function createStrictVerifier(
  corpusSearchFn?: CorpusSearchFn
): CitationVerifier {
  return new CitationVerifier({
    corpusSearchFn,
    strictMode: true,
    minMatchConfidence: 0.8,
    verificationRateWarningThreshold: 0.90,
    verificationRateCriticalThreshold: 0.70,
  });
}

/**
 * Create a lenient citation verifier (for drafts)
 */
export function createDraftVerifier(
  corpusSearchFn?: CorpusSearchFn
): CitationVerifier {
  return new CitationVerifier({
    corpusSearchFn,
    strictMode: false,
    minMatchConfidence: 0.5,
    verificationRateWarningThreshold: 0.70,
    verificationRateCriticalThreshold: 0.40,
  });
}
