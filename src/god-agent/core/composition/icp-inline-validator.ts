/**
 * ICP Inline Validator — Per-Paragraph Validation for Evidence-First Pipeline
 *
 * Validates each generated paragraph against its required evidence:
 *   1. Quote presence (fuzzy match, 70% threshold for OCR tolerance)
 *   2. Citation authors are in corpus sources
 *   3. Atom coverage (every required atom addressed)
 *
 * Designed as a thin adapter for ICP's evidence-first context.
 *
 * @module icp-inline-validator
 */

import type { ClaimAtom, QuoteSpan } from './icp-types.js';
import type { CorpusSource } from '../writing/writing-generator.js';

// =============================================================================
// TYPES
// =============================================================================

export interface ParagraphValidationResult {
  /** Whether the paragraph passed validation */
  passed: boolean;
  /** Specific issues found */
  issues: ValidationIssue[];
  /** Feedback string for LLM retry prompt */
  suggestedRetryFeedback: string;
}

export interface ValidationIssue {
  type: 'missing_quote' | 'hallucinated_citation' | 'missing_atom';
  description: string;
  severity: 'error' | 'warning';
}

export interface ICPInlineValidatorConfig {
  /** Minimum fuzzy match threshold for quotes (default: 0.70) */
  minQuoteSimilarity?: number;
  /** Maximum retries (informational only, actual retry handled by generator) */
  maxRetries?: number;
}

const DEFAULT_CONFIG: Required<ICPInlineValidatorConfig> = {
  minQuoteSimilarity: 0.70,
  maxRetries: 2,
};

// =============================================================================
// ICP INLINE VALIDATOR
// =============================================================================

export class ICPInlineValidator {
  private readonly config: Required<ICPInlineValidatorConfig>;
  private readonly corpusSources: CorpusSource[];

  constructor(
    corpusSources: CorpusSource[],
    config?: ICPInlineValidatorConfig,
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.corpusSources = corpusSources;
  }

  /**
   * Validate a single generated paragraph against its required evidence.
   */
  async validateParagraph(
    paragraphText: string,
    requiredAtoms: ClaimAtom[],
    requiredQuotes: QuoteSpan[],
  ): Promise<ParagraphValidationResult> {
    const issues: ValidationIssue[] = [];

    // 1. Check required quotes appear (fuzzy match)
    for (const quote of requiredQuotes) {
      const quoteText = quote.repaired_text ?? quote.text;
      const similarity = this.computeSimilarity(paragraphText, quoteText);
      if (similarity < this.config.minQuoteSimilarity) {
        issues.push({
          type: 'missing_quote',
          description: `Required quote not found: "${quoteText.slice(0, 60)}..." (similarity: ${(similarity * 100).toFixed(0)}%)`,
          severity: 'error',
        });
      }
    }

    // 2. Check citation authors are in corpus sources
    const citationPattern = /(?:As |According to |Following )?(\w[\w'-]*)\s+(?:argues|observes|suggests|states|maintains|notes|contends|claims|demonstrates|\(\d{4})/g;
    let match: RegExpExecArray | null;
    const allowedLastNames = new Set(
      this.corpusSources.map(s =>
        (s.citationKey ?? s.author).split(' ')[0].toLowerCase().replace(/[,.']/g, ''),
      ),
    );

    while ((match = citationPattern.exec(paragraphText)) !== null) {
      const authorName = match[1].toLowerCase().replace(/[,.']/g, '');
      if (authorName.length > 2 && !allowedLastNames.has(authorName)) {
        // Check if it's a common word (not an author name)
        const commonWords = new Set(['the', 'this', 'that', 'these', 'those', 'such', 'both', 'each', 'more', 'thus', 'also']);
        if (!commonWords.has(authorName)) {
          issues.push({
            type: 'hallucinated_citation',
            description: `Possible non-corpus author citation: "${match[1]}"`,
            severity: 'warning',
          });
        }
      }
    }

    // 3. Check atom coverage (each required atom should be addressed)
    for (const atom of requiredAtoms) {
      if (atom.evidence_mode === 'NO_EVIDENCE_REQUIRED') continue;

      const keywords = atom.display_text
        .toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3);

      const textLower = paragraphText.toLowerCase();
      const keywordHits = keywords.filter(kw => textLower.includes(kw));
      const coverage = keywords.length > 0 ? keywordHits.length / keywords.length : 1;

      if (coverage < 0.3) {
        issues.push({
          type: 'missing_atom',
          description: `Atom not addressed: "${atom.display_text.slice(0, 60)}..." (coverage: ${(coverage * 100).toFixed(0)}%)`,
          severity: 'warning',
        });
      }
    }

    // Build retry feedback
    const errorIssues = issues.filter(i => i.severity === 'error');
    const passed = errorIssues.length === 0;
    const suggestedRetryFeedback = issues.length > 0
      ? issues.map(i => `- [${i.severity.toUpperCase()}] ${i.description}`).join('\n')
      : '';

    return { passed, issues, suggestedRetryFeedback };
  }

  /**
   * Compute similarity between paragraph text and a target quote.
   * Uses character-level trigram overlap for fuzzy matching.
   */
  private computeSimilarity(text: string, quote: string): number {
    const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
    const normalizedQuote = quote.toLowerCase().replace(/\s+/g, ' ');

    // Check for substring containment first (exact or near-exact)
    if (normalizedText.includes(normalizedQuote)) return 1.0;

    // Trigram-based similarity
    const textTrigrams = this.getTrigrams(normalizedText);
    const quoteTrigrams = this.getTrigrams(normalizedQuote);

    if (quoteTrigrams.size === 0) return 0;

    let overlap = 0;
    for (const tri of quoteTrigrams) {
      if (textTrigrams.has(tri)) overlap++;
    }

    return overlap / quoteTrigrams.size;
  }

  private getTrigrams(text: string): Set<string> {
    const trigrams = new Set<string>();
    for (let i = 0; i <= text.length - 3; i++) {
      trigrams.add(text.slice(i, i + 3));
    }
    return trigrams;
  }
}
