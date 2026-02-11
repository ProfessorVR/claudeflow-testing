/**
 * InlineClaimValidator - Validation Gate for Paragraph-Level Generation
 *
 * Validates individual claims/paragraphs against corpus BEFORE they are
 * appended to the output document. This is the critical gate that prevents
 * hallucinations from entering the final output.
 *
 * Part of the Inline Citation Enforcement Architecture (Phase 2).
 */

import { CitationValidator, type ValidationResult, type ValidationOptions } from './citation-validator.js';
import { QuotationFidelityValidator, type QuotationFidelityValidationResult, type QuotationFidelityOptions } from './quotation-fidelity-validator.js';
import { ClaimGroundingValidator, type ClaimGroundingValidationResult } from './claim-grounding-validator.js';
import { buildCorpusConstraint, type ContextChunk } from './corpus-constraint-builder.js';
import type { CorpusSource, CorpusConstraint } from './writing-generator.js';
import { createComponentLogger } from '../observability/logger.js';

const logger = createComponentLogger('InlineClaimValidator');

/**
 * Generated content unit (paragraph, claim block, etc.)
 */
export interface GeneratedUnit {
  /** The generated text content */
  content: string;
  /** Intended purpose of this unit */
  intent: string;
  /** Unit type */
  type: 'paragraph' | 'claim' | 'argument' | 'evidence' | 'transition' | 'synthesis';
  /** Citations explicitly declared by the generator */
  declaredCitations?: Array<{
    author: string;
    year?: number;
    page?: number;
  }>;
  /** Quotes explicitly declared by the generator */
  declaredQuotes?: Array<{
    text: string;
    author: string;
    page?: number;
  }>;
}

/**
 * Configuration for inline validation
 */
export interface InlineValidationConfig {
  /** Strictness level */
  strictness: 'strict' | 'moderate' | 'lenient';
  /** Minimum pass rate for citations (default: 1.0 for strict, 0.9 for moderate, 0.8 for lenient) */
  minCitationPassRate?: number;
  /** Minimum quote fidelity rate (default: 0.95) */
  minQuoteFidelityRate?: number;
  /** Minimum claim grounding rate (default: 0.8) */
  minClaimGroundingRate?: number;
  /** Whether to require page numbers for citations */
  requirePageNumbers?: boolean;
  /** Whether to validate quotes for verbatim accuracy */
  validateQuoteFidelity?: boolean;
  /** Whether to validate claims for grounding */
  validateClaimGrounding?: boolean;
}

/**
 * Result of inline validation
 */
export interface InlineValidationResult {
  /** Whether the unit passed all validation gates */
  passed: boolean;
  /** Overall score (0-1) */
  overallScore: number;

  /** Citation validation results */
  citationResults: {
    /** Total citations found */
    total: number;
    /** Valid citations */
    valid: number;
    /** Hallucinated citations */
    hallucinated: string[];
    /** Citations missing page numbers */
    missingPageNumbers: string[];
    /** Pass rate */
    passRate: number;
  };

  /** Quote validation results */
  quoteResults: {
    /** Total quotes found */
    total: number;
    /** Verbatim quotes */
    verbatim: number;
    /** Non-verbatim quotes with details */
    nonVerbatim: Array<{
      quote: string;
      similarity: number;
      correction?: string;
    }>;
    /** Fidelity rate */
    fidelityRate: number;
  };

  /** Claim grounding results */
  claimResults: {
    /** Total claims analyzed */
    total: number;
    /** Grounded claims */
    grounded: number;
    /** Ungrounded claims with reasons */
    ungrounded: Array<{
      claim: string;
      author: string;
      reason: string;
    }>;
    /** Grounding rate */
    groundingRate: number;
  };

  /** Specific issues found */
  issues: ValidationIssue[];

  /** Feedback for regeneration if failed */
  feedback: string[];

  /** Detailed validation data for debugging */
  details: {
    citationValidation?: ValidationResult;
    quoteFidelityValidation?: QuotationFidelityValidationResult;
    claimGroundingValidation?: ClaimGroundingValidationResult;
  };
}

/**
 * A validation issue
 */
export interface ValidationIssue {
  /** Issue severity */
  severity: 'critical' | 'major' | 'minor';
  /** Issue category */
  category: 'citation' | 'quote' | 'claim' | 'grounding';
  /** Issue message */
  message: string;
  /** Suggestion for fixing */
  suggestion?: string;
}

/**
 * Default thresholds by strictness level
 */
const STRICTNESS_THRESHOLDS: Record<InlineValidationConfig['strictness'], {
  minCitationPassRate: number;
  minQuoteFidelityRate: number;
  minClaimGroundingRate: number;
  overallPassThreshold: number;
}> = {
  strict: {
    minCitationPassRate: 1.0,
    minQuoteFidelityRate: 0.95,
    minClaimGroundingRate: 0.9,
    overallPassThreshold: 0.95,
  },
  moderate: {
    minCitationPassRate: 0.9,
    minQuoteFidelityRate: 0.9,
    minClaimGroundingRate: 0.8,
    overallPassThreshold: 0.85,
  },
  lenient: {
    minCitationPassRate: 0.8,
    minQuoteFidelityRate: 0.8,
    minClaimGroundingRate: 0.7,
    overallPassThreshold: 0.75,
  },
};

/**
 * InlineClaimValidator
 *
 * Validates generated content units BEFORE they are appended to output.
 * This is the critical gate that prevents hallucinations.
 */
export class InlineClaimValidator {
  private citationValidator: CitationValidator;
  private quoteValidator: QuotationFidelityValidator | null = null;
  private groundingValidator: ClaimGroundingValidator | null = null;
  private config: InlineValidationConfig;
  private thresholds: typeof STRICTNESS_THRESHOLDS['strict'];
  private corpusSources: CorpusSource[];
  private corpusChunks: ContextChunk[];

  constructor(
    corpusSources: CorpusSource[],
    corpusChunks: ContextChunk[],
    config: InlineValidationConfig
  ) {
    this.corpusSources = corpusSources;
    this.corpusChunks = corpusChunks;
    this.config = config;
    this.thresholds = STRICTNESS_THRESHOLDS[config.strictness];

    // Build corpus constraint from chunks
    const constraint = buildCorpusConstraint(corpusChunks, { enforcement: 'strict' });

    // Initialize citation validator (always enabled)
    this.citationValidator = new CitationValidator(constraint);

    // Initialize quote fidelity validator if enabled
    if (config.validateQuoteFidelity !== false) {
      this.quoteValidator = new QuotationFidelityValidator(corpusSources, corpusChunks);
    }

    // Initialize claim grounding validator if enabled
    if (config.validateClaimGrounding !== false) {
      this.groundingValidator = new ClaimGroundingValidator(corpusSources, corpusChunks);
    }
  }

  /**
   * Validate a single generated unit
   */
  async validateUnit(
    unit: GeneratedUnit,
    expectedEvidence?: ContextChunk[]
  ): Promise<InlineValidationResult> {
    const issues: ValidationIssue[] = [];
    const feedback: string[] = [];
    const details: InlineValidationResult['details'] = {};

    // === Citation Validation ===
    logger.debug(`Starting citation validation on ${unit.content.length} chars...`);
    const citationOptions: ValidationOptions = {
      suggestReplacements: true,
      requirePageNumbers: this.config.requirePageNumbers ?? (this.config.strictness === 'strict'),
    };
    const citationValidation = await this.citationValidator.validate(unit.content, citationOptions);
    logger.info(`Citation validation complete: ${citationValidation.totalCitations} citations`);
    details.citationValidation = citationValidation;

    const citationResults = {
      total: citationValidation.totalCitations,
      valid: citationValidation.valid.length,
      hallucinated: citationValidation.hallucinated.map(h =>
        `${h.citation.author || 'Unknown'} (${h.citation.year || 'n.d.'}): ${h.reason || 'not in corpus'}`
      ),
      missingPageNumbers: citationValidation.missingPageNumbers.map(m =>
        `${m.citation.author || 'Unknown'} (${m.citation.year || 'n.d.'})`
      ),
      passRate: citationValidation.passRate,
    };

    // Add citation issues
    for (const hallucinated of citationValidation.hallucinated) {
      issues.push({
        severity: 'critical',
        category: 'citation',
        message: `Hallucinated citation: ${hallucinated.citation.author || 'Unknown'} (${hallucinated.citation.year || 'n.d.'})`,
        suggestion: hallucinated.suggestion
          ? `Replace with: ${hallucinated.suggestion.formatted}`
          : 'Remove this citation or find corpus evidence',
      });
      feedback.push(`CITATION ERROR: "${hallucinated.citation.raw}" is not in the corpus. ${
        hallucinated.suggestion
          ? `Consider using ${hallucinated.suggestion.source.author} (${hallucinated.suggestion.source.year}) instead.`
          : 'Remove this citation.'
      }`);
    }

    // === Quote Fidelity Validation ===
    let quoteResults = {
      total: 0,
      verbatim: 0,
      nonVerbatim: [] as Array<{ quote: string; similarity: number; correction?: string }>,
      fidelityRate: 1.0,
    };

    if (this.quoteValidator) {
      logger.debug(`Starting quote fidelity validation...`);
      const quoteOptions: QuotationFidelityOptions = {
        minSimilarity: this.thresholds.minQuoteFidelityRate,
        suggestCorrections: true,
      };
      const quoteFidelityValidation = await this.quoteValidator.validate(unit.content);
      logger.info(`Quote fidelity complete: ${quoteFidelityValidation.totalQuotations} quotations`);
      details.quoteFidelityValidation = quoteFidelityValidation;

      quoteResults = {
        total: quoteFidelityValidation.totalQuotations,
        verbatim: quoteFidelityValidation.verbatim.length,
        nonVerbatim: quoteFidelityValidation.nonVerbatim.map(nv => ({
          quote: nv.quotation.text.slice(0, 50) + '...',
          similarity: nv.similarityScore,
          correction: nv.suggestedCorrection,
        })),
        fidelityRate: quoteFidelityValidation.fidelityRate,
      };

      // Add quote issues
      for (const nonVerbatim of quoteFidelityValidation.nonVerbatim) {
        const severity = nonVerbatim.similarityScore < 0.7 ? 'critical' : 'major';
        issues.push({
          severity,
          category: 'quote',
          message: `Non-verbatim quotation (${(nonVerbatim.similarityScore * 100).toFixed(0)}% match): "${nonVerbatim.quotation.text.slice(0, 40)}..."`,
          suggestion: nonVerbatim.suggestedCorrection
            ? `Correct quote: "${nonVerbatim.suggestedCorrection.slice(0, 60)}..."`
            : 'Verify quote against corpus source',
        });
        feedback.push(`QUOTE ERROR: The quote "${nonVerbatim.quotation.text.slice(0, 40)}..." is only ${(nonVerbatim.similarityScore * 100).toFixed(0)}% match to corpus. ${
          nonVerbatim.suggestedCorrection
            ? `Use: "${nonVerbatim.suggestedCorrection.slice(0, 50)}..."`
            : 'Check original source.'
        }`);
      }
    }

    // === Claim Grounding Validation ===
    let claimResults = {
      total: 0,
      grounded: 0,
      ungrounded: [] as Array<{ claim: string; author: string; reason: string }>,
      groundingRate: 1.0,
    };

    if (this.groundingValidator) {
      logger.debug(`Starting claim grounding validation...`);
      const claimGroundingValidation = await this.groundingValidator.validate(unit.content);
      logger.info(`Claim grounding complete: ${claimGroundingValidation.totalClaims} claims`);
      details.claimGroundingValidation = claimGroundingValidation;

      claimResults = {
        total: claimGroundingValidation.totalClaims,
        grounded: claimGroundingValidation.grounded?.length || 0,
        ungrounded: (claimGroundingValidation.ungrounded || []).map(ug => ({
          claim: (ug.claim?.fullText || 'unknown claim').slice(0, 50) + '...',
          author: ug.claim?.author || 'Unknown',
          reason: ug.reason || 'No supporting evidence in corpus',
        })),
        groundingRate: claimGroundingValidation.groundingRate,
      };

      // Add claim issues
      for (const ungrounded of (claimGroundingValidation.ungrounded || [])) {
        issues.push({
          severity: 'major',
          category: 'claim',
          message: `Ungrounded claim attributed to ${ungrounded.claim?.author || 'Unknown'}: "${(ungrounded.claim?.fullText || 'unknown').slice(0, 40)}..."`,
          suggestion: ungrounded.suggestedAlternative || 'Remove attribution or find corpus evidence',
        });
        feedback.push(`CLAIM ERROR: The claim "${(ungrounded.claim?.fullText || 'unknown').slice(0, 40)}..." attributed to ${ungrounded.claim?.author || 'this author'} is not supported by their corpus text.`);
      }
    }

    // === Calculate Overall Score ===
    const weights = {
      citation: 0.5,
      quote: 0.3,
      grounding: 0.2,
    };

    const overallScore = (
      citationResults.passRate * weights.citation +
      quoteResults.fidelityRate * weights.quote +
      claimResults.groundingRate * weights.grounding
    );

    // === Determine Pass/Fail ===
    const citationPassed = citationResults.passRate >= this.thresholds.minCitationPassRate;
    const quotePassed = quoteResults.fidelityRate >= this.thresholds.minQuoteFidelityRate;
    const groundingPassed = claimResults.groundingRate >= this.thresholds.minClaimGroundingRate;
    const overallPassed = overallScore >= this.thresholds.overallPassThreshold;

    // Strict mode: all must pass
    // Moderate mode: overall must pass
    // Lenient mode: citations must pass at minimum
    let passed: boolean;
    switch (this.config.strictness) {
      case 'strict':
        passed = citationPassed && quotePassed && groundingPassed;
        break;
      case 'moderate':
        passed = citationPassed && overallPassed;
        break;
      case 'lenient':
        passed = citationResults.hallucinated.length === 0; // No hallucinations allowed even in lenient
        break;
    }

    // Add summary feedback
    if (!passed) {
      feedback.unshift(`VALIDATION FAILED (${this.config.strictness} mode): Score ${(overallScore * 100).toFixed(1)}% < ${(this.thresholds.overallPassThreshold * 100).toFixed(1)}% threshold`);
      feedback.push('Please regenerate this paragraph addressing the issues above.');
    }

    return {
      passed,
      overallScore,
      citationResults,
      quoteResults,
      claimResults,
      issues,
      feedback,
      details,
    };
  }

  /**
   * Quick validation for citations only (faster)
   */
  async validateCitationsOnly(content: string): Promise<{
    passed: boolean;
    hallucinated: string[];
    passRate: number;
  }> {
    const result = await this.citationValidator.validate(content);
    return {
      passed: result.passRate >= this.thresholds.minCitationPassRate && result.hallucinated.length === 0,
      hallucinated: result.hallucinated.map(h => h.citation.raw),
      passRate: result.passRate,
    };
  }

  /**
   * Format validation result for regeneration prompt
   */
  formatFeedbackForRegeneration(result: InlineValidationResult): string {
    if (result.passed) {
      return ''; // No feedback needed
    }

    const lines: string[] = [
      '## Validation Feedback - Please Address These Issues:',
      '',
    ];

    // Critical issues first
    const critical = result.issues.filter(i => i.severity === 'critical');
    if (critical.length > 0) {
      lines.push('### CRITICAL ISSUES (Must Fix):');
      for (const issue of critical) {
        lines.push(`- ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`  → ${issue.suggestion}`);
        }
      }
      lines.push('');
    }

    // Major issues
    const major = result.issues.filter(i => i.severity === 'major');
    if (major.length > 0) {
      lines.push('### Major Issues:');
      for (const issue of major) {
        lines.push(`- ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`  → ${issue.suggestion}`);
        }
      }
      lines.push('');
    }

    // Summary stats
    lines.push('### Validation Summary:');
    lines.push(`- Citations: ${result.citationResults.valid}/${result.citationResults.total} valid (${(result.citationResults.passRate * 100).toFixed(0)}%)`);
    lines.push(`- Quotes: ${result.quoteResults.verbatim}/${result.quoteResults.total} verbatim (${(result.quoteResults.fidelityRate * 100).toFixed(0)}%)`);
    lines.push(`- Claims: ${result.claimResults.grounded}/${result.claimResults.total} grounded (${(result.claimResults.groundingRate * 100).toFixed(0)}%)`);
    lines.push(`- Overall: ${(result.overallScore * 100).toFixed(1)}%`);
    lines.push('');
    lines.push('Please regenerate this paragraph addressing the issues above.');

    return lines.join('\n');
  }

  /**
   * Get available corpus authors
   */
  getAvailableAuthors(): string[] {
    const authors = new Set<string>();
    for (const source of this.corpusSources) {
      authors.add(source.author);
    }
    for (const chunk of this.corpusChunks) {
      if (chunk.metadata.author) {
        authors.add(chunk.metadata.author);
      }
    }
    return Array.from(authors);
  }
}

/**
 * Create an InlineClaimValidator from corpus data
 */
export function createInlineClaimValidator(
  corpusSources: CorpusSource[],
  corpusChunks: ContextChunk[],
  strictness: InlineValidationConfig['strictness'] = 'moderate'
): InlineClaimValidator {
  return new InlineClaimValidator(corpusSources, corpusChunks, {
    strictness,
    validateQuoteFidelity: true,
    validateClaimGrounding: true,
  });
}
