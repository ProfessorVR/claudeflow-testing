/**
 * QuotationFidelityStage - Quality stage wrapper for QuotationFidelityValidator
 *
 * Integrates the quotation fidelity validator into the Quality Gauntlet pipeline.
 * Ensures all direct quotations match corpus sources verbatim.
 *
 * This stage is CRITICAL for academic integrity - it catches:
 * - Paraphrased text presented as direct quotes
 * - Translation mismatches between quote and corpus
 * - Fabricated quotes not found in any corpus source
 */

import {
  BaseQualityStage,
  type QualityStageResult,
  type QualityIssue,
  type QualityEvaluationContext,
  type IssueLocation,
} from '../quality-stage.js';
import {
  QuotationFidelityValidator,
  type QuotationFidelityOptions,
} from '../../../core/writing/quotation-fidelity-validator.js';
import {
  detectTranslationMismatch,
  type TranslationMismatch,
} from '../../../core/writing/translation-detector.js';

/**
 * Configuration options for the quotation fidelity stage
 */
export interface QuotationFidelityStageOptions {
  /** Minimum similarity score to consider verbatim (default: 0.95) */
  minSimilarity?: number;
  /** Whether to check for translation mismatches (default: true) */
  checkTranslations?: boolean;
  /** Whether non-verbatim quotes should be critical or major issues (default: 'major') */
  nonVerbatimSeverity?: 'critical' | 'major';
  /** Whether unmatched quotes should be critical (default: true) */
  unmatchedIsCritical?: boolean;
}

const DEFAULT_OPTIONS: Required<QuotationFidelityStageOptions> = {
  minSimilarity: parseFloat(process.env.QUOTE_FIDELITY_THRESHOLD || '0.95'),
  checkTranslations: true,
  nonVerbatimSeverity: 'major',
  unmatchedIsCritical: true,
};

/**
 * Quality stage for validating quotation fidelity against corpus sources
 */
export class QuotationFidelityStage extends BaseQualityStage {
  /** Stage name for identification */
  readonly name = 'quotation-fidelity';

  /** Weight in overall quality score (15% - important for academic integrity) */
  readonly weight = 0.15;

  /** Threshold for passing this stage (90% fidelity required) */
  readonly threshold = 0.90;

  private options: Required<QuotationFidelityStageOptions>;

  /** Store corrections for auto-fix */
  private corrections: Map<string, string> = new Map();

  constructor(options: QuotationFidelityStageOptions = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Evaluate quotation fidelity in the given content
   */
  async evaluate(
    content: string,
    chapterId: number,
    context?: QualityEvaluationContext
  ): Promise<QualityStageResult> {
    const issues: QualityIssue[] = [];
    const metrics: Record<string, number> = {};
    const suggestions: string[] = [];

    // Clear previous corrections
    this.corrections.clear();

    // Extract corpus sources and chunks from context with type safety
    const rawCorpusSources = context?.corpusSources;
    const rawCorpusChunks = context?.corpusChunks;

    // Type-check and default to empty arrays
    const corpusSources = Array.isArray(rawCorpusSources) ? rawCorpusSources : [];
    const corpusChunks = Array.isArray(rawCorpusChunks) ? rawCorpusChunks : [];

    // If no corpus data provided, we can't validate
    if (corpusSources.length === 0 && corpusChunks.length === 0) {
      return this.createBaseResult(
        true, // Pass if no corpus to check against
        1.0,
        [{
          id: this.generateIssueId('citation', 0),
          type: 'citation',
          severity: 'minor',
          location: { chapterId },
          description: 'No corpus data provided for quotation fidelity validation',
          suggestion: 'Provide corpusSources and corpusChunks in evaluation context',
          autoFixable: false,
          contextSnippet: 'Skipping quotation fidelity check',
        }],
        { skipped: 1, reason: 1 },
        ['Provide corpus data for quotation fidelity validation']
      );
    }

    // Create validator with options
    const validatorOptions: QuotationFidelityOptions = {
      minSimilarity: this.options.minSimilarity,
      ignoreCase: true,
      ignorePunctuation: false,
      suggestCorrections: true,
      citationSearchRadius: 200,
    };

    const validator = new QuotationFidelityValidator(
      corpusSources,
      corpusChunks,
      validatorOptions
    );

    // Run validation
    const result = await validator.validate(content);

    // Track metrics
    metrics.totalQuotations = result.totalQuotations;
    metrics.verbatimCount = result.verbatim.length;
    metrics.nonVerbatimCount = result.nonVerbatim.length;
    metrics.unmatchedCount = result.unmatched.length;
    metrics.fidelityRate = result.fidelityRate;
    metrics.minSimilarityThreshold = this.options.minSimilarity;

    // Process non-verbatim quotations
    let issueIndex = 0;
    for (const nv of result.nonVerbatim) {
      const issueId = this.generateIssueId('citation', issueIndex++);

      // Check for translation mismatches
      let translationMismatches: TranslationMismatch[] = [];
      if (this.options.checkTranslations && nv.corpusText) {
        translationMismatches = detectTranslationMismatch(nv.quotation.text, nv.corpusText);
      }

      const hasTranslationMismatch = translationMismatches.length > 0;

      // Build location
      const location: IssueLocation = {
        chapterId,
        paragraphIndex: this.findParagraphIndex(content, nv.quotation.line),
        startOffset: nv.quotation.position,
      };

      // Store correction for auto-fix if available
      if (nv.suggestedCorrection && !hasTranslationMismatch) {
        this.corrections.set(issueId, nv.suggestedCorrection);
      }

      issues.push({
        id: issueId,
        type: 'citation',
        severity: this.options.nonVerbatimSeverity,
        location,
        description: hasTranslationMismatch
          ? `Non-verbatim quotation (translation mismatch) at line ${nv.quotation.line}`
          : `Non-verbatim quotation at line ${nv.quotation.line} (${Math.round(nv.similarityScore * 100)}% match)`,
        suggestion: this.buildSuggestion(nv, translationMismatches),
        autoFixable: !!nv.suggestedCorrection && !hasTranslationMismatch,
        contextSnippet: `"${this.truncate(nv.quotation.text, 80)}"`,
        confidence: nv.similarityScore,
      });
    }

    // Process unmatched quotations (more serious)
    for (const um of result.unmatched) {
      const issueId = this.generateIssueId('citation', issueIndex++);

      const location: IssueLocation = {
        chapterId,
        paragraphIndex: this.findParagraphIndex(content, um.quotation.line),
        startOffset: um.quotation.position,
      };

      issues.push({
        id: issueId,
        type: 'citation',
        severity: this.options.unmatchedIsCritical ? 'critical' : 'major',
        location,
        description: `Quotation has no matching corpus source at line ${um.quotation.line}`,
        suggestion: um.quotation.associatedCitation
          ? `Verify citation (${um.quotation.associatedCitation.author || 'unknown'}) exists in corpus, or convert to paraphrase`
          : 'Add citation or convert to paraphrase. Only quote from corpus sources.',
        autoFixable: false,
        contextSnippet: `"${this.truncate(um.quotation.text, 80)}"`,
      });
    }

    // Build suggestions
    if (result.nonVerbatim.length > 0) {
      suggestions.push(`${result.nonVerbatim.length} quotation(s) differ from corpus text - verify against original sources`);
    }
    if (result.unmatched.length > 0) {
      suggestions.push(`${result.unmatched.length} quotation(s) have no corpus match - only quote from ingested sources`);
    }
    if (result.fidelityRate < this.threshold) {
      suggestions.push(`Fidelity rate ${Math.round(result.fidelityRate * 100)}% is below ${Math.round(this.threshold * 100)}% threshold`);
    }

    // Calculate score
    const score = result.fidelityRate;
    const passed = score >= this.threshold && result.unmatched.length === 0;

    return this.createBaseResult(passed, score, issues, metrics, suggestions);
  }

  /**
   * Check if an issue can be automatically fixed
   */
  canAutoFix(issue: QualityIssue): boolean {
    return issue.autoFixable && this.corrections.has(issue.id);
  }

  /**
   * Attempt to automatically fix an issue
   */
  autoFix(text: string, issue: QualityIssue): string {
    if (!this.canAutoFix(issue)) {
      return text;
    }

    const correction = this.corrections.get(issue.id);
    if (!correction || !issue.contextSnippet) {
      return text;
    }

    // Extract the original quote from context snippet (it's wrapped in quotes)
    const originalMatch = issue.contextSnippet.match(/^"(.+)"$/);
    if (!originalMatch) {
      return text;
    }

    const originalQuote = originalMatch[1];

    // Replace the original quote with the correction
    // We need to be careful to only replace the exact quote in quotes
    const quotedOriginal = `"${originalQuote}"`;
    const quotedCorrection = `"${correction}"`;

    if (text.includes(quotedOriginal)) {
      return text.replace(quotedOriginal, quotedCorrection);
    }

    // Try with smart quotes
    const smartQuotedOriginal = `"${originalQuote}"`;
    const smartQuotedCorrection = `"${correction}"`;

    if (text.includes(smartQuotedOriginal)) {
      return text.replace(smartQuotedOriginal, smartQuotedCorrection);
    }

    return text;
  }

  /**
   * Build suggestion text for non-verbatim quotation
   */
  private buildSuggestion(
    result: { suggestedCorrection?: string; corpusText?: string; similarityScore: number },
    translationMismatches: TranslationMismatch[]
  ): string {
    const parts: string[] = [];

    if (translationMismatches.length > 0) {
      const mismatch = translationMismatches[0];
      parts.push(
        `Translation mismatch: "${mismatch.quotedTerm}" should be "${mismatch.corpusTerm}" ` +
        `(both translate ${mismatch.originalTerm})`
      );
    }

    if (result.suggestedCorrection) {
      parts.push(`Corpus text: "${this.truncate(result.suggestedCorrection, 100)}"`);
    } else if (result.corpusText) {
      parts.push(`Similar corpus text found (${Math.round(result.similarityScore * 100)}% match)`);
    }

    if (parts.length === 0) {
      parts.push('Verify quotation against corpus source');
    }

    return parts.join('. ');
  }

  /**
   * Find paragraph index for a given line number
   */
  private findParagraphIndex(content: string, lineNumber: number): number {
    const lines = content.split('\n');
    let paragraphIndex = 0;
    let currentLine = 1;

    for (const line of lines) {
      if (currentLine >= lineNumber) {
        break;
      }
      if (line.trim() === '') {
        paragraphIndex++;
      }
      currentLine++;
    }

    return paragraphIndex;
  }

  /**
   * Truncate text for display
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }
}

/**
 * Factory function for creating the stage with custom options
 */
export function createQuotationFidelityStage(
  options?: QuotationFidelityStageOptions
): QuotationFidelityStage {
  return new QuotationFidelityStage(options);
}
