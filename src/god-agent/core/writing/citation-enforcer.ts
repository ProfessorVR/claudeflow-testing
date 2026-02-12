/**
 * Citation Enforcer (Phase 4: Active Citation Enforcement + Phase 7: Quotation Fidelity)
 *
 * Converts citation checking from read-only to active prevention.
 * This component intercepts content BEFORE output and enforces:
 * 1. Corpus-only citations (Phase 4)
 * 2. Verbatim quotations (Phase 7)
 */

import type { CorpusConstraint, CorpusSource } from './writing-generator.js';
import { CitationValidator, type ValidationResult, type ValidationOptions } from './citation-validator.js';
import { buildCorpusConstraint, type ContextChunk } from './corpus-constraint-builder.js';
import {
  QuotationFidelityValidator,
  type QuotationFidelityValidationResult,
  type QuotationFidelityResult,
  type QuotationFidelityOptions,
} from './quotation-fidelity-validator.js';
import {
  ClaimGroundingValidator,
  type ClaimGroundingValidationResult,
  type ClaimGroundingOptions,
} from './claim-grounding-validator.js';

/**
 * Enforcement action taken
 */
export type EnforcementAction = 'pass' | 'corrected' | 'rejected' | 'warning';

/**
 * Result of enforcement
 */
export interface EnforcementResult {
  /** Action taken */
  action: EnforcementAction;
  /** Content after enforcement (may be corrected) */
  content: string;
  /** Original content before enforcement */
  originalContent: string;
  /** Validation results */
  validation: ValidationResult;
  /** Number of corrections made */
  correctionsCount: number;
  /** Number of citations missing page numbers */
  missingPageNumbersCount: number;
  /** Whether content passed enforcement */
  passed: boolean;
  /** Detailed report */
  report: string;
  /** Citations that were corrected */
  correctedCitations: Array<{
    original: string;
    replacement: string;
    line: number;
  }>;
  /** Phase 7: Quotation fidelity validation results */
  quotationFidelity?: QuotationFidelityValidationResult;
  /** Phase 7: Number of quotations corrected to be verbatim */
  quotationsCorrectionsCount?: number;
  /** Phase 8: Claim grounding validation results */
  claimGrounding?: ClaimGroundingValidationResult;
  /** Phase 8: Number of ungrounded claims (fabricated attributions) */
  ungroundedClaimsCount?: number;
}

/**
 * Enforcement configuration
 */
export interface EnforcementConfig {
  /** Mode: 'strict' rejects on failure, 'auto-correct' attempts fixes, 'warn' only warns */
  mode: 'strict' | 'auto-correct' | 'warn';
  /** Minimum pass rate to accept content (default: 0.9 = 90%) */
  minPassRate: number;
  /** Maximum hallucinations allowed before rejection (default: 3) */
  maxHallucinations: number;
  /** Placeholder for unfixable citations */
  placeholder: string;
  /** Whether to include detailed report in output */
  includeReport: boolean;
  /** Phase 7: Enable quotation fidelity validation (default: true) */
  enableQuotationFidelity?: boolean;
  /** Phase 7: Minimum similarity for verbatim quotations (default: 0.95) */
  quotationMinSimilarity?: number;
  /** Phase 7: Whether to auto-correct non-verbatim quotations (default: true) */
  autoCorrectQuotations?: boolean;
  /** Phase 8: Enable claim grounding validation (default: true) */
  enableClaimGrounding?: boolean;
  /** Phase 8: Minimum topic overlap score for grounded claims (default: 0.3) */
  claimMinTopicOverlap?: number;
  /** Phase 8: Maximum ungrounded claims before rejection (default: 2) */
  maxUngroundedClaims?: number;
}

const DEFAULT_CONFIG: EnforcementConfig = {
  mode: 'auto-correct',
  minPassRate: 0.9,
  maxHallucinations: 3,
  placeholder: '[CITATION NEEDED]',
  includeReport: true,
  enableQuotationFidelity: true,
  quotationMinSimilarity: 0.95,
  autoCorrectQuotations: true,
  enableClaimGrounding: true,
  claimMinTopicOverlap: 0.3,
  maxUngroundedClaims: 2,
};

/**
 * Citation Enforcer
 *
 * Active enforcement layer that ensures all citations in output
 * are verified against the corpus. Can auto-correct or reject
 * content based on hallucination severity.
 *
 * Phase 7 Integration: Also validates that direct quotations
 * match corpus sources verbatim.
 *
 * Phase 8 Integration: Also validates that paraphrased claims
 * are actually grounded in the author's corpus content.
 */
export class CitationEnforcer {
  private validator: CitationValidator;
  private config: EnforcementConfig;
  private corpusSources: CorpusSource[];
  private corpusChunks: ContextChunk[];
  private quotationValidator?: QuotationFidelityValidator;
  private claimGroundingValidator?: ClaimGroundingValidator;

  constructor(
    constraint: CorpusConstraint,
    config: Partial<EnforcementConfig> = {},
    corpusChunks: ContextChunk[] = []
  ) {
    this.validator = new CitationValidator(constraint);
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.corpusSources = constraint.sources;
    this.corpusChunks = corpusChunks;

    // Initialize quotation fidelity validator if enabled
    if (this.config.enableQuotationFidelity && corpusChunks.length > 0) {
      this.quotationValidator = new QuotationFidelityValidator(
        this.corpusSources,
        corpusChunks,
        {
          minSimilarity: this.config.quotationMinSimilarity,
          suggestCorrections: this.config.autoCorrectQuotations,
        }
      );
    }

    // Initialize claim grounding validator if enabled
    if (this.config.enableClaimGrounding && corpusChunks.length > 0) {
      this.claimGroundingValidator = new ClaimGroundingValidator(
        this.corpusSources,
        corpusChunks,
        {
          minTopicOverlap: this.config.claimMinTopicOverlap,
          suggestAlternatives: true,
        }
      );
    }
  }

  /**
   * Enforce citation constraints on content
   *
   * @param content - Generated content to check
   * @returns Enforcement result with potentially corrected content
   */
  async enforce(content: string): Promise<EnforcementResult> {
    const validationOptions: ValidationOptions = {
      suggestReplacements: this.config.mode === 'auto-correct',
      placeholder: this.config.placeholder,
    };

    // Phase 4: Validate citations
    const validation = await this.validator.validate(content, validationOptions);

    // Phase 7: Validate quotation fidelity
    let quotationFidelity: QuotationFidelityValidationResult | undefined;
    let quotationCorrectedContent = content;
    let quotationsCorrectionsCount = 0;

    if (this.quotationValidator) {
      quotationFidelity = await this.quotationValidator.validate(content);

      // Auto-correct non-verbatim quotations if enabled
      if (this.config.autoCorrectQuotations && quotationFidelity.nonVerbatim.length > 0) {
        const correctionResult = this.correctNonVerbatimQuotations(
          content,
          quotationFidelity.nonVerbatim
        );
        quotationCorrectedContent = correctionResult.content;
        quotationsCorrectionsCount = correctionResult.correctionsCount;
      }
    }

    // Use quotation-corrected content for citation enforcement
    content = quotationCorrectedContent;

    // Phase 8: Validate claim grounding (paraphrase verification)
    let claimGrounding: ClaimGroundingValidationResult | undefined;
    let ungroundedClaimsCount = 0;

    if (this.claimGroundingValidator) {
      claimGrounding = await this.claimGroundingValidator.validate(content);
      ungroundedClaimsCount = claimGrounding.ungrounded.length;

      // In strict mode, reject if too many ungrounded claims
      if (this.config.mode === 'strict' &&
          ungroundedClaimsCount > (this.config.maxUngroundedClaims || 2)) {
        return {
          action: 'rejected',
          content: '',
          originalContent: content,
          validation,
          correctionsCount: 0,
          missingPageNumbersCount: validation.missingPageNumbers.length,
          passed: false,
          report: this.generateReport('rejected', validation, [], quotationFidelity, claimGrounding),
          correctedCitations: [],
          quotationFidelity,
          quotationsCorrectionsCount,
          claimGrounding,
          ungroundedClaimsCount,
        };
      }
    }

    // Determine action based on mode and results
    if (validation.hallucinated.length === 0) {
      // All citations valid - check quotation fidelity and claim grounding
      const quotationPassed = !quotationFidelity || quotationFidelity.fidelityRate >= 0.95;
      const claimsPassed = !claimGrounding || claimGrounding.groundingRate >= 0.8;
      const allPassed = quotationPassed && claimsPassed;

      // Determine appropriate action
      let action: EnforcementAction = 'pass';
      if (!allPassed) {
        action = ungroundedClaimsCount > 0 ? 'warning' : 'corrected';
      }

      return {
        action,
        content,
        originalContent: content,
        validation,
        correctionsCount: quotationsCorrectionsCount,
        missingPageNumbersCount: validation.missingPageNumbers.length,
        passed: allPassed,
        report: this.generateReport(action, validation, [], quotationFidelity, claimGrounding),
        correctedCitations: [],
        quotationFidelity,
        quotationsCorrectionsCount,
        claimGrounding,
        ungroundedClaimsCount,
      };
    }

    // Handle based on mode
    let result: EnforcementResult;
    switch (this.config.mode) {
      case 'strict':
        result = this.handleStrict(content, validation, quotationFidelity, claimGrounding);
        break;

      case 'auto-correct':
        result = await this.handleAutoCorrect(content, validation, validationOptions, quotationFidelity, claimGrounding);
        break;

      case 'warn':
        result = this.handleWarn(content, validation, quotationFidelity, claimGrounding);
        break;

      default:
        result = await this.handleAutoCorrect(content, validation, validationOptions, quotationFidelity, claimGrounding);
    }

    // Add quotation fidelity and claim grounding results to the result
    result.quotationFidelity = quotationFidelity;
    result.quotationsCorrectionsCount = quotationsCorrectionsCount;
    result.claimGrounding = claimGrounding;
    result.ungroundedClaimsCount = ungroundedClaimsCount;

    return result;
  }

  /**
   * Strict mode: Reject content with any hallucinations
   */
  private handleStrict(
    content: string,
    validation: ValidationResult,
    quotationFidelity?: QuotationFidelityValidationResult,
    claimGrounding?: ClaimGroundingValidationResult
  ): EnforcementResult {
    const hallucinatedCount = validation.hallucinated.length;

    if (hallucinatedCount > this.config.maxHallucinations) {
      return {
        action: 'rejected',
        content: '', // Reject entirely
        originalContent: content,
        validation,
        correctionsCount: 0,
        missingPageNumbersCount: validation.missingPageNumbers.length,
        passed: false,
        report: this.generateReport('rejected', validation, [], quotationFidelity, claimGrounding),
        correctedCitations: [],
      };
    }

    // Under threshold but still has issues - warn
    return {
      action: 'warning',
      content,
      originalContent: content,
      validation,
      correctionsCount: 0,
      missingPageNumbersCount: validation.missingPageNumbers.length,
      passed: false,
      report: this.generateReport('warning', validation, [], quotationFidelity, claimGrounding),
      correctedCitations: [],
    };
  }

  /**
   * Auto-correct mode: Attempt to fix hallucinated citations
   */
  private async handleAutoCorrect(
    content: string,
    validation: ValidationResult,
    options: ValidationOptions,
    quotationFidelity?: QuotationFidelityValidationResult,
    claimGrounding?: ClaimGroundingValidationResult
  ): Promise<EnforcementResult> {
    const correctionResult = await this.validator.correct(content, options);
    const correctedCitations: EnforcementResult['correctedCitations'] = [];

    // Track what was corrected
    for (const h of validation.hallucinated) {
      correctedCitations.push({
        original: h.citation.raw,
        replacement: h.suggestion?.formatted || this.config.placeholder,
        line: h.citation.line,
      });
    }

    // Re-validate corrected content
    const revalidation = await this.validator.validate(correctionResult.corrected, options);

    // Check if correction was sufficient
    const passed = revalidation.passRate >= this.config.minPassRate &&
      revalidation.hallucinated.length <= this.config.maxHallucinations;

    return {
      action: 'corrected',
      content: correctionResult.corrected,
      originalContent: content,
      validation: revalidation,
      correctionsCount: correctionResult.corrections,
      missingPageNumbersCount: revalidation.missingPageNumbers.length,
      passed,
      report: this.generateReport('corrected', revalidation, correctedCitations, quotationFidelity, claimGrounding),
      correctedCitations,
    };
  }

  /**
   * Warn mode: Pass through but include warnings
   */
  private handleWarn(
    content: string,
    validation: ValidationResult,
    quotationFidelity?: QuotationFidelityValidationResult,
    claimGrounding?: ClaimGroundingValidationResult
  ): EnforcementResult {
    // Add warning comments to content
    let warningContent = content;

    if (validation.hallucinated.length > 0) {
      const warnings = validation.hallucinated
        .map(h => `- Line ${h.citation.line}: "${h.citation.raw}" - ${h.reason}`)
        .join('\n');

      warningContent = `<!-- CITATION WARNINGS:\n${warnings}\n-->\n\n${content}`;
    }

    return {
      action: 'warning',
      content: warningContent,
      originalContent: content,
      validation,
      correctionsCount: 0,
      missingPageNumbersCount: validation.missingPageNumbers.length,
      passed: validation.passRate >= this.config.minPassRate,
      report: this.generateReport('warning', validation, [], quotationFidelity, claimGrounding),
      correctedCitations: [],
    };
  }

  /**
   * Generate detailed enforcement report
   */
  private generateReport(
    action: EnforcementAction,
    validation: ValidationResult,
    corrections: EnforcementResult['correctedCitations'],
    quotationFidelity?: QuotationFidelityValidationResult,
    claimGrounding?: ClaimGroundingValidationResult
  ): string {
    const lines: string[] = [
      '## Citation Enforcement Report',
      '',
      `**Action:** ${action.toUpperCase()}`,
      `**Total Citations:** ${validation.totalCitations}`,
      `**Valid:** ${validation.valid.length}`,
      `**Hallucinated:** ${validation.hallucinated.length}`,
      `**Missing Page Numbers:** ${validation.missingPageNumbers.length}`,
      `**Pass Rate:** ${(validation.passRate * 100).toFixed(1)}%`,
      '',
    ];

    // Phase 7: Quotation Fidelity Results
    if (quotationFidelity) {
      lines.push('### Quotation Fidelity (Phase 7)');
      lines.push('');
      lines.push(`**Total Quotations:** ${quotationFidelity.totalQuotations}`);
      lines.push(`**Verbatim (exact):** ${quotationFidelity.verbatimMatchCount} (${(quotationFidelity.verbatimRate * 100).toFixed(1)}%)`);
      lines.push(`**Normalized-only:** ${quotationFidelity.normalizedMatchCount} (${(quotationFidelity.normalizedRate * 100).toFixed(1)}%)`);
      lines.push(`**Borderline:** ${quotationFidelity.borderlineCount} (${(quotationFidelity.borderlineRate * 100).toFixed(1)}%)`);
      lines.push(`**Failed:** ${quotationFidelity.failCount}`);
      lines.push(`**Non-Verbatim:** ${quotationFidelity.nonVerbatim.length}`);
      lines.push(`**Unmatched:** ${quotationFidelity.unmatched.length}`);
      lines.push(`**Fidelity Rate:** ${(quotationFidelity.fidelityRate * 100).toFixed(1)}%`);
      lines.push('');

      if (quotationFidelity.nonVerbatim.length > 0) {
        lines.push('#### Non-Verbatim Quotations');
        lines.push('');
        for (const q of quotationFidelity.nonVerbatim.slice(0, 10)) {
          lines.push(`- **Line ${q.quotation.line}:** Similarity ${(q.similarityScore * 100).toFixed(1)}%`);
          lines.push(`  - Quoted: "${q.quotation.text.substring(0, 100)}${q.quotation.text.length > 100 ? '...' : ''}"`);
          if (q.corpusText) {
            lines.push(`  - Corpus: "${q.corpusText.substring(0, 100)}${q.corpusText.length > 100 ? '...' : ''}"`);
          }
          if (q.reason) {
            lines.push(`  - Reason: ${q.reason}`);
          }
        }
        if (quotationFidelity.nonVerbatim.length > 10) {
          lines.push(`- ... and ${quotationFidelity.nonVerbatim.length - 10} more`);
        }
        lines.push('');
      }

      if (quotationFidelity.unmatched.length > 0) {
        lines.push('#### Unmatched Quotations');
        lines.push('');
        for (const q of quotationFidelity.unmatched.slice(0, 5)) {
          lines.push(`- **Line ${q.quotation.line}:** "${q.quotation.text.substring(0, 100)}${q.quotation.text.length > 100 ? '...' : ''}"`);
          lines.push(`  - Reason: ${q.reason || 'No corpus match found'}`);
        }
        if (quotationFidelity.unmatched.length > 5) {
          lines.push(`- ... and ${quotationFidelity.unmatched.length - 5} more`);
        }
        lines.push('');
      }
    }

    // Phase 8: Claim Grounding Results
    if (claimGrounding) {
      lines.push('### Claim Grounding (Phase 8)');
      lines.push('');
      lines.push(`**Total Attributed Claims:** ${claimGrounding.totalClaims}`);
      lines.push(`**Grounded:** ${claimGrounding.grounded.length}`);
      lines.push(`**Ungrounded (FABRICATED):** ${claimGrounding.ungrounded.length}`);
      lines.push(`**Authors Without Corpus:** ${claimGrounding.noCorpusContent.length}`);
      lines.push(`**Grounding Rate:** ${(claimGrounding.groundingRate * 100).toFixed(1)}%`);
      lines.push('');

      if (claimGrounding.ungrounded.length > 0) {
        lines.push('#### ⚠️ FABRICATED ATTRIBUTIONS (Ungrounded Claims)');
        lines.push('');
        for (const c of claimGrounding.ungrounded.slice(0, 10)) {
          lines.push(`- **Line ${c.claim.line}:** "${c.claim.author}" - Topic overlap: ${(c.topicOverlapScore * 100).toFixed(1)}%`);
          lines.push(`  - Claim: "${c.claim.claimContent.substring(0, 100)}${c.claim.claimContent.length > 100 ? '...' : ''}"`);
          lines.push(`  - Reason: ${c.reason}`);
          if (c.suggestedAlternative) {
            lines.push(`  - **Suggestion:** ${c.suggestedAlternative}`);
          }
          lines.push(`  - Claim keywords: ${c.claimKeywords.slice(0, 5).join(', ')}`);
          lines.push(`  - Author corpus topics: ${c.authorCorpusKeywords.slice(0, 5).join(', ')}`);
        }
        if (claimGrounding.ungrounded.length > 10) {
          lines.push(`- ... and ${claimGrounding.ungrounded.length - 10} more`);
        }
        lines.push('');
      }

      if (claimGrounding.noCorpusContent.length > 0) {
        lines.push('#### Authors Without Corpus Content');
        lines.push('');
        for (const c of claimGrounding.noCorpusContent.slice(0, 5)) {
          lines.push(`- **Line ${c.claim.line}:** "${c.claim.author}" has no corpus chunks`);
          lines.push(`  - Consider removing this attribution or adding source to corpus`);
        }
        if (claimGrounding.noCorpusContent.length > 5) {
          lines.push(`- ... and ${claimGrounding.noCorpusContent.length - 5} more`);
        }
        lines.push('');
      }
    }

    if (validation.hallucinated.length > 0) {
      lines.push('### Hallucinated Citations');
      lines.push('');
      for (const h of validation.hallucinated) {
        lines.push(`- **Line ${h.citation.line}:** \`${h.citation.raw}\``);
        lines.push(`  - Reason: ${h.reason}`);
        if (h.suggestion) {
          lines.push(`  - Suggested: \`${h.suggestion.formatted}\``);
        }
      }
      lines.push('');
    }

    if (validation.missingPageNumbers.length > 0) {
      lines.push('### Citations Missing Page Numbers');
      lines.push('');
      for (const m of validation.missingPageNumbers.slice(0, 15)) {
        lines.push(`- **Line ${m.citation.line}:** \`${m.citation.raw}\` - needs page number`);
      }
      if (validation.missingPageNumbers.length > 15) {
        lines.push(`- ... and ${validation.missingPageNumbers.length - 15} more`);
      }
      lines.push('');
    }

    if (corrections.length > 0) {
      lines.push('### Corrections Made');
      lines.push('');
      for (const c of corrections) {
        lines.push(`- Line ${c.line}: \`${c.original}\` → \`${c.replacement}\``);
      }
      lines.push('');
    }

    if (validation.valid.length > 0 && this.config.includeReport) {
      lines.push('### Valid Citations');
      lines.push('');
      for (const v of validation.valid.slice(0, 10)) {
        const pageStatus = v.missingPageNumber ? ' ⚠️ (no page)' : '';
        lines.push(`- \`${v.citation.raw}\` ✓ (${v.matchedSource?.citationKey || 'matched'})${pageStatus}`);
      }
      if (validation.valid.length > 10) {
        lines.push(`- ... and ${validation.valid.length - 10} more`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Correct non-verbatim quotations to be verbatim with corpus sources
   */
  private correctNonVerbatimQuotations(
    content: string,
    nonVerbatimQuotations: QuotationFidelityResult[]
  ): { content: string; correctionsCount: number } {
    let correctedContent = content;
    let correctionsCount = 0;

    // Sort quotations by position (descending) to avoid offset issues during replacement
    const sortedQuotations = [...nonVerbatimQuotations].sort(
      (a, b) => b.quotation.position - a.quotation.position
    );

    for (const result of sortedQuotations) {
      if (!result.suggestedCorrection) {
        continue; // Skip if no correction available
      }

      const { quotation, suggestedCorrection } = result;

      // Find the quotation in content (with quotes)
      // The quotation.text is the text without quotes, we need to find it with quotes
      const quotedTextPattern = new RegExp(
        `["'"\u00AB]${this.escapeRegex(quotation.text)}["'"\u00BB]`,
        'g'
      );

      // Replace with corrected version
      const before = correctedContent;
      correctedContent = correctedContent.replace(
        quotedTextPattern,
        `"${suggestedCorrection}"`
      );

      if (before !== correctedContent) {
        correctionsCount++;
      }
    }

    return { content: correctedContent, correctionsCount };
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get available corpus sources for reference
   */
  getAvailableSources(): CorpusSource[] {
    return this.corpusSources;
  }

  /**
   * Check if a specific citation is valid
   */
  async isValidCitation(citation: string): Promise<boolean> {
    const testContent = `Test citation: ${citation}`;
    const validation = await this.validator.validate(testContent);
    return validation.valid.length > 0;
  }
}

/**
 * Create enforcer from corpus chunks
 */
export function createEnforcerFromChunks(
  chunks: ContextChunk[],
  config?: Partial<EnforcementConfig>,
  additionalSources?: CorpusSource[]
): CitationEnforcer {
  const constraint = buildCorpusConstraint(chunks, {
    enforcement: 'strict',
    additionalSources,
  });

  return new CitationEnforcer(constraint, config, chunks);
}
