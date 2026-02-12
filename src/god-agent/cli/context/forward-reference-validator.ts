/**
 * ForwardReferenceValidator - Validate that forward references are fulfilled
 *
 * Implements forward reference validation for the PhD Pipeline to ensure
 * that promises made in earlier chapters are fulfilled in later chapters.
 *
 * Responsibilities:
 * - Extract forward references from chapter text
 * - Validate references against actual chapter content
 * - Generate mismatch reports
 * - Check introduction promises against all chapters
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Represents a forward reference from one chapter to another
 */
export interface ForwardReference {
  /** Unique reference ID */
  id: string;
  /** Chapter number where the reference was made */
  sourceChapter: number;
  /** Chapter number being referenced */
  targetChapter: number;
  /** What the source chapter claims the target will discuss */
  claim: string;
  /** What the target chapter actually says (populated after validation) */
  actualContent: string;
  /** Whether the reference has been validated as fulfilled */
  validated: boolean;
  /** Notes from validation */
  validationNotes: string;
  /** Confidence score (0-1) of the validation */
  validationConfidence?: number;
  /** Timestamp of validation */
  validatedAt?: number;
}

/**
 * Result of validating a single reference
 */
export interface ValidationResult {
  /** The reference that was validated */
  reference: ForwardReference;
  /** Whether the reference is fulfilled */
  fulfilled: boolean;
  /** Confidence score (0-1) */
  confidence: number;
  /** Detailed explanation */
  explanation: string;
  /** Matched content from target chapter */
  matchedContent?: string;
  /** Suggestions for addressing unfulfilled references */
  suggestions?: string[];
}

/**
 * Report from validating all references
 */
export interface ValidationReport {
  /** Total references validated */
  totalReferences: number;
  /** Number of fulfilled references */
  fulfilledCount: number;
  /** Number of unfulfilled references */
  unfulfilledCount: number;
  /** Number of partially fulfilled references */
  partialCount: number;
  /** Overall fulfillment rate */
  fulfillmentRate: number;
  /** Individual validation results */
  results: ValidationResult[];
  /** Summary of issues by chapter */
  issuesByChapter: Map<number, ValidationResult[]>;
  /** Generated at timestamp */
  generatedAt: number;
}

/**
 * Patterns for extracting forward references
 */
const FORWARD_PATTERNS = [
  // "Chapter N will discuss/examine/explore X"
  {
    pattern: /[Cc]hapter\s+(\d+)\s+will\s+(discuss|examine|explore|analyse|analyze|address|consider|present|outline|describe)\s+([^.]+)/g,
    claimExtractor: (match: RegExpMatchArray) => ({
      targetChapter: parseInt(match[1], 10),
      verb: match[2],
      claim: `${match[2]} ${match[3].trim()}`,
    }),
  },
  // "This will be discussed in Chapter N"
  {
    pattern: /([^.]+)\s+will\s+be\s+(discussed|examined|explored|analysed|analyzed|addressed|considered|presented)\s+(?:further\s+)?in\s+[Cc]hapter\s+(\d+)/gi,
    claimExtractor: (match: RegExpMatchArray) => ({
      targetChapter: parseInt(match[3], 10),
      verb: match[2],
      claim: `${match[2]} ${match[1].trim()}`,
    }),
  },
  // "As we shall see in Chapter N, X"
  {
    pattern: /[Aa]s\s+(?:we\s+)?(?:shall|will)\s+see\s+in\s+[Cc]hapter\s+(\d+)\s*,\s*([^.]+)/g,
    claimExtractor: (match: RegExpMatchArray) => ({
      targetChapter: parseInt(match[1], 10),
      verb: 'demonstrate',
      claim: match[2].trim(),
    }),
  },
  // "Chapter N provides/offers/presents X"
  {
    pattern: /[Cc]hapter\s+(\d+)\s+(provides|offers|presents|contains|includes|gives)\s+([^.]+)/g,
    claimExtractor: (match: RegExpMatchArray) => ({
      targetChapter: parseInt(match[1], 10),
      verb: match[2],
      claim: `${match[2]} ${match[3].trim()}`,
    }),
  },
  // "See Chapter N for X"
  {
    pattern: /[Ss]ee\s+[Cc]hapter\s+(\d+)\s+for\s+(?:a\s+)?(?:detailed\s+|more\s+)?([^.]+)/g,
    claimExtractor: (match: RegExpMatchArray) => ({
      targetChapter: parseInt(match[1], 10),
      verb: 'provide',
      claim: match[2].trim(),
    }),
  },
  // "The next chapter will X" (requires chapter number context)
  {
    pattern: /[Tt]he\s+(?:next|following)\s+chapter\s+will\s+(discuss|examine|explore|analyse|analyze|address|consider|present|outline|describe)\s+([^.]+)/g,
    claimExtractor: (match: RegExpMatchArray) => ({
      targetChapter: -1, // Needs context
      verb: match[1],
      claim: `${match[1]} ${match[2].trim()}`,
    }),
  },
];

/**
 * Keywords that indicate topic coverage
 */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  methodology: [
    'method', 'methodology', 'approach', 'procedure', 'technique', 'design',
    'data collection', 'sampling', 'analysis', 'instrument', 'measure'
  ],
  theory: [
    'theory', 'theoretical', 'framework', 'model', 'concept', 'construct',
    'hypothesis', 'proposition', 'assumption', 'principle'
  ],
  results: [
    'result', 'finding', 'outcome', 'data', 'evidence', 'analysis',
    'statistical', 'significant', 'correlation', 'pattern'
  ],
  discussion: [
    'discussion', 'interpretation', 'implication', 'meaning', 'significance',
    'contribution', 'limitation', 'future research'
  ],
  literature: [
    'literature', 'review', 'scholarship', 'research', 'study', 'debate',
    'perspective', 'argument', 'critique', 'gap'
  ],
};

/**
 * ForwardReferenceValidator tracks and validates forward references
 */
export class ForwardReferenceValidator {
  /** All tracked forward references */
  references: ForwardReference[];

  constructor() {
    this.references = [];
  }

  /**
   * Extract forward references from a chapter's text
   *
   * @param chapterText - The full text of the chapter
   * @param chapterNumber - The chapter number (source)
   * @returns Array of extracted forward references
   */
  extractForwardReferences(
    chapterText: string,
    chapterNumber: number
  ): ForwardReference[] {
    const extracted: ForwardReference[] = [];
    const seen = new Set<string>();

    for (const { pattern, claimExtractor } of FORWARD_PATTERNS) {
      // Reset pattern state
      pattern.lastIndex = 0;

      let match: RegExpExecArray | null;
      while ((match = pattern.exec(chapterText)) !== null) {
        const { targetChapter, claim } = claimExtractor(match);

        // Handle "next chapter" references
        const actualTarget = targetChapter === -1 ? chapterNumber + 1 : targetChapter;

        // Skip self-references or backward references
        if (actualTarget <= chapterNumber) continue;

        // Deduplicate by target chapter + claim prefix
        const key = `${actualTarget}:${claim.substring(0, 50).toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);

        const reference: ForwardReference = {
          id: `ref_${uuidv4().substring(0, 8)}`,
          sourceChapter: chapterNumber,
          targetChapter: actualTarget,
          claim: claim.substring(0, 300),
          actualContent: '',
          validated: false,
          validationNotes: '',
        };

        extracted.push(reference);
        this.references.push(reference);
      }
    }

    return extracted;
  }

  /**
   * Validate a single reference against target chapter content
   *
   * @param ref - The forward reference to validate
   * @param targetChapterText - The full text of the target chapter
   * @returns Validation result
   */
  validateReference(
    ref: ForwardReference,
    targetChapterText: string
  ): ValidationResult {
    // Extract key terms from the claim
    const claimTerms = this.extractKeyTerms(ref.claim);

    // Search for coverage of these terms in target chapter
    const { matches, coverage, confidence } = this.findClaimCoverage(
      claimTerms,
      targetChapterText
    );

    // Determine fulfillment status
    const fulfilled = confidence >= 0.6;
    const partial = confidence >= 0.3 && confidence < 0.6;

    // Update reference
    ref.validated = true;
    ref.validatedAt = Date.now();
    ref.validationConfidence = confidence;

    if (matches.length > 0) {
      ref.actualContent = matches[0].substring(0, 500);
    }

    let explanation: string;
    let suggestions: string[] | undefined;

    if (fulfilled) {
      explanation = `The claim "${ref.claim.substring(0, 100)}..." is fulfilled in Chapter ${ref.targetChapter}. ` +
        `Found ${matches.length} relevant passage(s) covering the promised content.`;
      ref.validationNotes = 'Fulfilled';
    } else if (partial) {
      explanation = `The claim "${ref.claim.substring(0, 100)}..." is partially addressed in Chapter ${ref.targetChapter}. ` +
        `Some related content found but may not fully address the promise.`;
      ref.validationNotes = 'Partially fulfilled';
      suggestions = [
        `Review Chapter ${ref.targetChapter} to ensure the following is covered: "${ref.claim}"`,
        `Consider adding more explicit treatment of this topic`,
      ];
    } else {
      explanation = `The claim "${ref.claim.substring(0, 100)}..." does not appear to be fulfilled in Chapter ${ref.targetChapter}. ` +
        `No significant coverage of the promised content was found.`;
      ref.validationNotes = 'Not fulfilled';
      suggestions = [
        `Add content to Chapter ${ref.targetChapter} that addresses: "${ref.claim}"`,
        `Or revise Chapter ${ref.sourceChapter} to remove or modify this forward reference`,
        `Consider whether this content belongs in a different chapter`,
      ];
    }

    return {
      reference: ref,
      fulfilled,
      confidence,
      explanation,
      matchedContent: matches[0],
      suggestions,
    };
  }

  /**
   * Validate all references against actual chapter content
   *
   * @param chapters - Map of chapter number to chapter text
   * @returns Comprehensive validation report
   */
  validateAllReferences(chapters: Map<number, string>): ValidationReport {
    const results: ValidationResult[] = [];
    let fulfilledCount = 0;
    let partialCount = 0;
    let unfulfilledCount = 0;
    const issuesByChapter = new Map<number, ValidationResult[]>();

    for (const ref of this.references) {
      const targetText = chapters.get(ref.targetChapter);

      if (!targetText) {
        // Target chapter not available yet
        const result: ValidationResult = {
          reference: ref,
          fulfilled: false,
          confidence: 0,
          explanation: `Target Chapter ${ref.targetChapter} not yet written or available`,
          suggestions: [`Ensure Chapter ${ref.targetChapter} addresses: "${ref.claim}"`],
        };
        results.push(result);
        unfulfilledCount++;

        // Track by chapter
        if (!issuesByChapter.has(ref.targetChapter)) {
          issuesByChapter.set(ref.targetChapter, []);
        }
        issuesByChapter.get(ref.targetChapter)!.push(result);

        continue;
      }

      const result = this.validateReference(ref, targetText);
      results.push(result);

      if (result.fulfilled) {
        fulfilledCount++;
      } else if (result.confidence >= 0.3) {
        partialCount++;
        // Track issues
        if (!issuesByChapter.has(ref.targetChapter)) {
          issuesByChapter.set(ref.targetChapter, []);
        }
        issuesByChapter.get(ref.targetChapter)!.push(result);
      } else {
        unfulfilledCount++;
        // Track issues
        if (!issuesByChapter.has(ref.targetChapter)) {
          issuesByChapter.set(ref.targetChapter, []);
        }
        issuesByChapter.get(ref.targetChapter)!.push(result);
      }
    }

    const totalReferences = this.references.length;
    const fulfillmentRate = totalReferences > 0
      ? (fulfilledCount + partialCount * 0.5) / totalReferences
      : 1;

    return {
      totalReferences,
      fulfilledCount,
      unfulfilledCount,
      partialCount,
      fulfillmentRate,
      results,
      issuesByChapter,
      generatedAt: Date.now(),
    };
  }

  /**
   * Check if introduction promises are fulfilled across all chapters
   *
   * @param introText - Text of the introduction/Chapter 1
   * @param chapters - Map of chapter number to chapter text
   * @returns Validation report for introduction promises
   */
  async checkIntroductionPromises(
    introText: string,
    chapters: Map<number, string>
  ): Promise<ValidationReport> {
    // Extract references from introduction
    const introRefs = this.extractForwardReferences(introText, 1);

    // Validate each reference
    const results: ValidationResult[] = [];
    let fulfilledCount = 0;
    let partialCount = 0;
    let unfulfilledCount = 0;
    const issuesByChapter = new Map<number, ValidationResult[]>();

    for (const ref of introRefs) {
      const targetText = chapters.get(ref.targetChapter);

      if (!targetText) {
        const result: ValidationResult = {
          reference: ref,
          fulfilled: false,
          confidence: 0,
          explanation: `Introduction promises Chapter ${ref.targetChapter} will address "${ref.claim}", but this chapter is not available`,
          suggestions: [
            `Ensure Chapter ${ref.targetChapter} exists and covers: "${ref.claim}"`,
          ],
        };
        results.push(result);
        unfulfilledCount++;
        continue;
      }

      const result = this.validateReference(ref, targetText);

      // Enhance explanation for introduction promises
      if (!result.fulfilled) {
        result.explanation = `INTRODUCTION PROMISE UNFULFILLED: ${result.explanation}`;
        result.suggestions = [
          `The introduction promises readers will find this content. This is a critical issue.`,
          ...(result.suggestions || []),
        ];
      }

      results.push(result);

      if (result.fulfilled) {
        fulfilledCount++;
      } else if (result.confidence >= 0.3) {
        partialCount++;
        if (!issuesByChapter.has(ref.targetChapter)) {
          issuesByChapter.set(ref.targetChapter, []);
        }
        issuesByChapter.get(ref.targetChapter)!.push(result);
      } else {
        unfulfilledCount++;
        if (!issuesByChapter.has(ref.targetChapter)) {
          issuesByChapter.set(ref.targetChapter, []);
        }
        issuesByChapter.get(ref.targetChapter)!.push(result);
      }
    }

    const totalReferences = introRefs.length;
    const fulfillmentRate = totalReferences > 0
      ? (fulfilledCount + partialCount * 0.5) / totalReferences
      : 1;

    return {
      totalReferences,
      fulfilledCount,
      unfulfilledCount,
      partialCount,
      fulfillmentRate,
      results,
      issuesByChapter,
      generatedAt: Date.now(),
    };
  }

  /**
   * Generate a human-readable mismatch report
   *
   * @returns Formatted markdown report
   */
  generateMismatchReport(): string {
    const unvalidated = this.references.filter(r => !r.validated);
    const unfulfilled = this.references.filter(
      r => r.validated && r.validationNotes !== 'Fulfilled'
    );

    if (unfulfilled.length === 0 && unvalidated.length === 0) {
      return `## Forward Reference Report\n\nAll ${this.references.length} forward references have been validated and fulfilled.\n`;
    }

    const sections: string[] = [];
    sections.push('## Forward Reference Mismatch Report');
    sections.push('');

    // Summary
    sections.push('### Summary');
    sections.push('');
    sections.push(`| Status | Count |`);
    sections.push(`|--------|-------|`);
    sections.push(`| Total References | ${this.references.length} |`);
    sections.push(`| Fulfilled | ${this.references.filter(r => r.validationNotes === 'Fulfilled').length} |`);
    sections.push(`| Partially Fulfilled | ${this.references.filter(r => r.validationNotes === 'Partially fulfilled').length} |`);
    sections.push(`| Not Fulfilled | ${this.references.filter(r => r.validationNotes === 'Not fulfilled').length} |`);
    sections.push(`| Pending Validation | ${unvalidated.length} |`);
    sections.push('');

    // Unfulfilled references grouped by target chapter
    if (unfulfilled.length > 0) {
      sections.push('### Unfulfilled References');
      sections.push('');

      // Group by target chapter
      const byTarget = new Map<number, ForwardReference[]>();
      for (const ref of unfulfilled) {
        if (!byTarget.has(ref.targetChapter)) {
          byTarget.set(ref.targetChapter, []);
        }
        byTarget.get(ref.targetChapter)!.push(ref);
      }

      for (const [targetChapter, refs] of byTarget) {
        sections.push(`#### Chapter ${targetChapter} - Missing Content`);
        sections.push('');
        for (const ref of refs) {
          sections.push(`- **From Chapter ${ref.sourceChapter}**: "${ref.claim}"`);
          sections.push(`  - Status: ${ref.validationNotes}`);
          if (ref.validationConfidence !== undefined) {
            sections.push(`  - Confidence: ${(ref.validationConfidence * 100).toFixed(0)}%`);
          }
        }
        sections.push('');
      }
    }

    // Pending validation
    if (unvalidated.length > 0) {
      sections.push('### Pending Validation');
      sections.push('');
      sections.push('These references have not yet been validated (target chapters may not exist yet):');
      sections.push('');
      for (const ref of unvalidated) {
        sections.push(`- Ch.${ref.sourceChapter} -> Ch.${ref.targetChapter}: "${ref.claim}"`);
      }
      sections.push('');
    }

    // Recommendations
    sections.push('### Recommendations');
    sections.push('');
    if (unfulfilled.length > 0) {
      sections.push('1. Review each unfulfilled reference and either:');
      sections.push('   - Add the promised content to the target chapter');
      sections.push('   - Revise the source chapter to remove/modify the promise');
      sections.push('');
    }
    if (unvalidated.length > 0) {
      sections.push('2. Complete remaining chapters to enable full validation');
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Get references targeting a specific chapter
   *
   * @param targetChapter - Chapter number
   * @returns Array of references targeting that chapter
   */
  getReferencesForChapter(targetChapter: number): ForwardReference[] {
    return this.references.filter(r => r.targetChapter === targetChapter);
  }

  /**
   * Get unfulfilled references
   */
  getUnfulfilledReferences(): ForwardReference[] {
    return this.references.filter(
      r => r.validated && r.validationNotes !== 'Fulfilled'
    );
  }

  /**
   * Clear all references (for reset)
   */
  clear(): void {
    this.references = [];
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Extract key terms from a claim
   */
  private extractKeyTerms(claim: string): string[] {
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'this', 'that', 'these', 'those', 'it', 'its', 'will', 'be', 'have',
      'has', 'had', 'do', 'does', 'did', 'more', 'detailed', 'further',
    ]);

    // Also include verb forms
    const verbs = new Set([
      'discuss', 'examine', 'explore', 'analyse', 'analyze', 'address',
      'consider', 'present', 'outline', 'describe', 'provide', 'offer',
    ]);

    const words = claim
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
      .filter(w => !stopwords.has(w))
      .filter(w => !verbs.has(w));

    return words;
  }

  /**
   * Find coverage of claim terms in target text
   */
  private findClaimCoverage(
    claimTerms: string[],
    targetText: string
  ): { matches: string[]; coverage: number; confidence: number } {
    if (claimTerms.length === 0) {
      return { matches: [], coverage: 0, confidence: 0 };
    }

    const targetLower = targetText.toLowerCase();
    const paragraphs = targetText.split(/\n\n+/);

    // Count how many terms appear in the target
    let termsFound = 0;
    const foundTerms: string[] = [];

    for (const term of claimTerms) {
      if (targetLower.includes(term)) {
        termsFound++;
        foundTerms.push(term);
      }
    }

    // Find paragraphs that contain multiple claim terms
    const relevantParagraphs: string[] = [];
    for (const para of paragraphs) {
      const paraLower = para.toLowerCase();
      let paraTermCount = 0;
      for (const term of foundTerms) {
        if (paraLower.includes(term)) {
          paraTermCount++;
        }
      }
      // Paragraph is relevant if it contains at least 30% of found terms
      if (paraTermCount >= Math.max(1, foundTerms.length * 0.3)) {
        relevantParagraphs.push(para);
      }
    }

    // Calculate coverage
    const termCoverage = termsFound / claimTerms.length;

    // Calculate confidence based on term coverage and paragraph matches
    const paragraphBonus = Math.min(0.2, relevantParagraphs.length * 0.05);
    const confidence = Math.min(1, termCoverage * 0.8 + paragraphBonus);

    return {
      matches: relevantParagraphs.slice(0, 3),
      coverage: termCoverage,
      confidence,
    };
  }
}
