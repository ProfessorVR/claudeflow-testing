/**
 * ContinuityChecker - Chapter and Section Continuity Validation
 *
 * Validates that:
 * 1. All chapter references point to existing chapters
 * 2. Forward promises are tracked and fulfilled
 * 3. Terms introduced are properly defined
 * 4. Cross-references are consistent
 */

// Chapter structure definition
export interface ChapterDefinition {
  number: number;
  title: string;
  sections: string[];
  status: 'planned' | 'in-progress' | 'complete';
  wordCount?: number;
}

// Reference to another chapter/section
export interface ChapterReference {
  sourceChapter: number;
  sourceSection?: string;
  targetChapter: number;
  targetSection?: string;
  referenceType: 'forward' | 'backward' | 'same';
  referenceText: string;
  lineNumber: number;
  charStart: number;
  charEnd: number;
}

// Forward promise (e.g., "Chapter 3 will discuss...")
export interface ForwardPromise {
  id: string;
  promisedIn: number;           // Chapter where promise made
  promisedChapter: number;      // Chapter where it should be fulfilled
  promisedTopic: string;        // What was promised
  lineNumber: number;
  fulfilled: boolean;
  fulfilledIn?: number;         // Chapter where fulfilled
  fulfilledLine?: number;
}

// Term definition tracking
export interface TermDefinition {
  term: string;
  definedIn: number;            // Chapter where defined
  lineNumber: number;
  definition?: string;          // Actual definition text
  usedIn: number[];             // Chapters where used
}

// Validation result
export interface ContinuityValidationResult {
  valid: boolean;

  // Reference validation
  validReferences: ChapterReference[];
  invalidReferences: ChapterReference[];

  // Promise tracking
  fulfilledPromises: ForwardPromise[];
  unfulfilledPromises: ForwardPromise[];

  // Term tracking
  definedTerms: TermDefinition[];
  undefinedTerms: string[];     // Terms used but not defined

  // Issues
  issues: ContinuityIssue[];

  // Can proceed with generation?
  canProceed: boolean;
}

export interface ContinuityIssue {
  type: 'invalid-reference' | 'unfulfilled-promise' | 'undefined-term' | 'circular-reference';
  severity: 'critical' | 'major' | 'minor';
  message: string;
  lineNumber: number;
  suggestion: string;
}

// Patterns for detecting references
const CHAPTER_REF_PATTERNS = [
  // "Chapter 3", "chapter 3", "Ch. 3"
  /(?:Chapter|Ch\.?)\s*(\d+)/gi,

  // "in the previous chapter", "the next chapter"
  /(?:the\s+)?(previous|next|following|preceding)\s+chapter/gi,

  // "Section 2.3", "section 2.3"
  /(?:Section|Sec\.?)\s*(\d+(?:\.\d+)?)/gi,

  // "as discussed in Chapter 2", "will be explored in Chapter 4"
  /(?:discussed|explored|examined|analyzed|presented)\s+in\s+(?:Chapter|Ch\.?)\s*(\d+)/gi,
];

// Patterns for forward promises
const PROMISE_PATTERNS = [
  // "Chapter 3 will discuss..."
  /(?:Chapter|Ch\.?)\s*(\d+)\s+will\s+(discuss|explore|examine|analyze|present|address)\s+(.+?)(?:\.|$)/gi,

  // "This will be addressed in Chapter 4"
  /(?:will be|shall be)\s+(addressed|discussed|explored|examined)\s+in\s+(?:Chapter|Ch\.?)\s*(\d+)/gi,

  // "See Chapter 5 for..."
  /See\s+(?:Chapter|Ch\.?)\s*(\d+)\s+for\s+(.+?)(?:\.|$)/gi,
];

// Technical terms (Greek, Latin, German philosophical terms)
const TECHNICAL_TERM_PATTERNS = [
  // Greek terms with transliteration
  /\*([a-z]+)\*\s*\(([^)]+)\)/gi,

  // Italicized terms: *phantasia*, *Stimmung*
  /\*([A-Za-z]+)\*/g,

  // Terms with explicit definition markers
  /([A-Za-z]+)\s*(?:means|refers to|is defined as|denotes)\s+(.+?)(?:\.|,|;)/gi,
];

export class ContinuityChecker {
  private chapters: Map<number, ChapterDefinition> = new Map();
  private forwardPromises: ForwardPromise[] = [];
  private termDefinitions: Map<string, TermDefinition> = new Map();

  /**
   * Set the dissertation structure
   */
  setChapterStructure(chapters: ChapterDefinition[]): void {
    this.chapters.clear();
    for (const ch of chapters) {
      this.chapters.set(ch.number, ch);
    }
  }

  /**
   * Extract chapter references from content
   */
  extractChapterReferences(
    content: string,
    currentChapter: number
  ): ChapterReference[] {
    const references: ChapterReference[] = [];
    const lines = content.split('\n');
    let charOffset = 0;

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const lineNum = lineIdx + 1;

      for (const pattern of CHAPTER_REF_PATTERNS) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;

        while ((match = regex.exec(line)) !== null) {
          let targetChapter: number;

          // Handle relative references
          if (match[1] === 'previous' || match[1] === 'preceding') {
            targetChapter = currentChapter - 1;
          } else if (match[1] === 'next' || match[1] === 'following') {
            targetChapter = currentChapter + 1;
          } else {
            targetChapter = parseInt(match[1]);
          }

          const referenceType = targetChapter < currentChapter ? 'backward' :
                               targetChapter > currentChapter ? 'forward' : 'same';

          references.push({
            sourceChapter: currentChapter,
            targetChapter,
            referenceType,
            referenceText: match[0],
            lineNumber: lineNum,
            charStart: charOffset + match.index,
            charEnd: charOffset + match.index + match[0].length,
          });
        }
      }

      charOffset += line.length + 1;
    }

    return references;
  }

  /**
   * Extract forward promises from content
   */
  extractForwardPromises(
    content: string,
    currentChapter: number
  ): ForwardPromise[] {
    const promises: ForwardPromise[] = [];
    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const lineNum = lineIdx + 1;

      for (const pattern of PROMISE_PATTERNS) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;

        while ((match = regex.exec(line)) !== null) {
          const promisedChapter = parseInt(match[1] || match[2]);
          const promisedTopic = match[3] || match[2] || match[0];

          if (promisedChapter > currentChapter) {
            promises.push({
              id: `promise-${currentChapter}-${promises.length}`,
              promisedIn: currentChapter,
              promisedChapter,
              promisedTopic: promisedTopic.trim(),
              lineNumber: lineNum,
              fulfilled: false,
            });
          }
        }
      }
    }

    return promises;
  }

  /**
   * Extract term definitions from content
   */
  extractTermDefinitions(
    content: string,
    currentChapter: number
  ): TermDefinition[] {
    const definitions: TermDefinition[] = [];
    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx];
      const lineNum = lineIdx + 1;

      for (const pattern of TECHNICAL_TERM_PATTERNS) {
        const regex = new RegExp(pattern.source, pattern.flags);
        let match;

        while ((match = regex.exec(line)) !== null) {
          const term = match[1].toLowerCase();
          const definition = match[2] || undefined;

          if (!this.termDefinitions.has(term)) {
            const termDef: TermDefinition = {
              term,
              definedIn: currentChapter,
              lineNumber: lineNum,
              definition,
              usedIn: [currentChapter],
            };

            definitions.push(termDef);
            this.termDefinitions.set(term, termDef);
          } else {
            // Term already defined, track usage
            const existing = this.termDefinitions.get(term)!;
            if (!existing.usedIn.includes(currentChapter)) {
              existing.usedIn.push(currentChapter);
            }
          }
        }
      }
    }

    return definitions;
  }

  /**
   * Validate chapter references
   */
  validateReferences(references: ChapterReference[]): {
    valid: ChapterReference[];
    invalid: ChapterReference[];
    issues: ContinuityIssue[];
  } {
    const valid: ChapterReference[] = [];
    const invalid: ChapterReference[] = [];
    const issues: ContinuityIssue[] = [];

    for (const ref of references) {
      const targetExists = this.chapters.has(ref.targetChapter);
      const targetComplete = targetExists &&
        this.chapters.get(ref.targetChapter)!.status === 'complete';

      if (ref.referenceType === 'backward') {
        // Backward references should point to completed chapters
        if (!targetExists) {
          invalid.push(ref);
          issues.push({
            type: 'invalid-reference',
            severity: 'critical',
            message: `Reference to non-existent Chapter ${ref.targetChapter}`,
            lineNumber: ref.lineNumber,
            suggestion: `Remove reference or add Chapter ${ref.targetChapter} to structure`,
          });
        } else if (!targetComplete) {
          invalid.push(ref);
          issues.push({
            type: 'invalid-reference',
            severity: 'major',
            message: `Reference to incomplete Chapter ${ref.targetChapter}`,
            lineNumber: ref.lineNumber,
            suggestion: `Complete Chapter ${ref.targetChapter} before referencing or mark as forward reference`,
          });
        } else {
          valid.push(ref);
        }
      } else if (ref.referenceType === 'forward') {
        // Forward references should point to planned chapters
        if (!targetExists) {
          invalid.push(ref);
          issues.push({
            type: 'invalid-reference',
            severity: 'major',
            message: `Forward reference to unplanned Chapter ${ref.targetChapter}`,
            lineNumber: ref.lineNumber,
            suggestion: `Add Chapter ${ref.targetChapter} to dissertation structure`,
          });
        } else {
          valid.push(ref);
        }
      } else {
        // Same chapter references are always valid
        valid.push(ref);
      }
    }

    return { valid, invalid, issues };
  }

  /**
   * Check if promises are fulfilled
   */
  checkPromiseFulfillment(
    chapterContent: string,
    chapterNumber: number
  ): { fulfilled: ForwardPromise[]; unfulfilled: ForwardPromise[] } {
    const fulfilled: ForwardPromise[] = [];
    const unfulfilled: ForwardPromise[] = [];
    const contentLower = chapterContent.toLowerCase();
    const lines = chapterContent.split('\n');

    for (const promise of this.forwardPromises) {
      if (promise.promisedChapter !== chapterNumber) continue;

      // Check if the promised topic is addressed
      const topicTerms = promise.promisedTopic
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 3);

      let matchCount = 0;
      let matchLine = 0;

      for (let i = 0; i < lines.length; i++) {
        const lineLower = lines[i].toLowerCase();
        const lineMatches = topicTerms.filter(t => lineLower.includes(t)).length;
        if (lineMatches > matchCount) {
          matchCount = lineMatches;
          matchLine = i + 1;
        }
      }

      const isFulfilled = matchCount >= Math.min(2, topicTerms.length);

      if (isFulfilled) {
        promise.fulfilled = true;
        promise.fulfilledIn = chapterNumber;
        promise.fulfilledLine = matchLine;
        fulfilled.push(promise);
      } else {
        unfulfilled.push(promise);
      }
    }

    return { fulfilled, unfulfilled };
  }

  /**
   * Pre-flight check before generating a chapter
   */
  preflightCheck(
    chapterNumber: number
  ): {
    canProceed: boolean;
    missingDependencies: string[];
    unresolvedPromises: string[];
    warnings: string[];
  } {
    const missingDependencies: string[] = [];
    const unresolvedPromises: string[] = [];
    const warnings: string[] = [];

    // Check that prior chapters exist and are complete
    for (let i = 1; i < chapterNumber; i++) {
      const chapter = this.chapters.get(i);
      if (!chapter) {
        missingDependencies.push(`Chapter ${i} does not exist in structure`);
      } else if (chapter.status !== 'complete') {
        missingDependencies.push(`Chapter ${i} is not complete (status: ${chapter.status})`);
      }
    }

    // Check for unfulfilled promises to this chapter
    const promisesToFulfill = this.forwardPromises.filter(
      p => p.promisedChapter === chapterNumber && !p.fulfilled
    );

    for (const promise of promisesToFulfill) {
      unresolvedPromises.push(
        `Chapter ${promise.promisedIn} promised: "${promise.promisedTopic}"`
      );
    }

    // Check current chapter exists in structure
    if (!this.chapters.has(chapterNumber)) {
      warnings.push(`Chapter ${chapterNumber} not found in dissertation structure`);
    }

    const canProceed = missingDependencies.length === 0;

    return {
      canProceed,
      missingDependencies,
      unresolvedPromises,
      warnings,
    };
  }

  /**
   * Full validation of content
   */
  validateContent(
    content: string,
    chapterNumber: number
  ): ContinuityValidationResult {
    // Extract all references and promises
    const references = this.extractChapterReferences(content, chapterNumber);
    const newPromises = this.extractForwardPromises(content, chapterNumber);
    const termDefs = this.extractTermDefinitions(content, chapterNumber);

    // Add new promises to tracker
    this.forwardPromises.push(...newPromises);

    // Validate references
    const refValidation = this.validateReferences(references);

    // Check promise fulfillment for this chapter
    const promiseCheck = this.checkPromiseFulfillment(content, chapterNumber);

    // Find undefined terms (used but not defined)
    const undefinedTerms: string[] = [];
    const technicalTerms = content.match(/\*([a-z]+)\*/gi) || [];

    for (const match of technicalTerms) {
      const term = match.replace(/\*/g, '').toLowerCase();
      if (!this.termDefinitions.has(term)) {
        undefinedTerms.push(term);
      }
    }

    // Compile all issues
    const issues: ContinuityIssue[] = [...refValidation.issues];

    // Add issues for unfulfilled promises
    for (const promise of promiseCheck.unfulfilled) {
      issues.push({
        type: 'unfulfilled-promise',
        severity: 'major',
        message: `Promise from Chapter ${promise.promisedIn} not fulfilled: "${promise.promisedTopic}"`,
        lineNumber: 0,
        suggestion: `Address "${promise.promisedTopic}" in this chapter`,
      });
    }

    // Add issues for undefined terms
    for (const term of undefinedTerms) {
      issues.push({
        type: 'undefined-term',
        severity: 'minor',
        message: `Technical term "${term}" used but not defined`,
        lineNumber: 0,
        suggestion: `Define *${term}* on first use or add to glossary`,
      });
    }

    const hasCritical = issues.some(i => i.severity === 'critical');

    return {
      valid: issues.length === 0,
      validReferences: refValidation.valid,
      invalidReferences: refValidation.invalid,
      fulfilledPromises: promiseCheck.fulfilled,
      unfulfilledPromises: promiseCheck.unfulfilled,
      definedTerms: termDefs,
      undefinedTerms,
      issues,
      canProceed: !hasCritical,
    };
  }

  /**
   * Add a promise manually
   */
  addPromise(promise: ForwardPromise): void {
    this.forwardPromises.push(promise);
  }

  /**
   * Get all tracked promises
   */
  getPromises(): ForwardPromise[] {
    return [...this.forwardPromises];
  }

  /**
   * Get all term definitions
   */
  getTermDefinitions(): TermDefinition[] {
    return Array.from(this.termDefinitions.values());
  }

  /**
   * Generate continuity report
   */
  generateReport(result: ContinuityValidationResult): string {
    const lines = [
      '# Chapter Continuity Report',
      '',
      `**Valid**: ${result.valid ? 'Yes' : 'No'}`,
      `**Can Proceed**: ${result.canProceed ? 'Yes' : 'No'}`,
      '',
      '## References',
      '',
      `- Valid references: ${result.validReferences.length}`,
      `- Invalid references: ${result.invalidReferences.length}`,
      '',
    ];

    if (result.invalidReferences.length > 0) {
      lines.push('### Invalid References');
      lines.push('');
      for (const ref of result.invalidReferences) {
        lines.push(`- Line ${ref.lineNumber}: "${ref.referenceText}" -> Chapter ${ref.targetChapter}`);
      }
      lines.push('');
    }

    lines.push('## Promises');
    lines.push('');
    lines.push(`- Fulfilled: ${result.fulfilledPromises.length}`);
    lines.push(`- Unfulfilled: ${result.unfulfilledPromises.length}`);
    lines.push('');

    if (result.unfulfilledPromises.length > 0) {
      lines.push('### Unfulfilled Promises');
      lines.push('');
      for (const promise of result.unfulfilledPromises) {
        lines.push(`- From Chapter ${promise.promisedIn}: "${promise.promisedTopic}"`);
      }
      lines.push('');
    }

    if (result.undefinedTerms.length > 0) {
      lines.push('## Undefined Terms');
      lines.push('');
      for (const term of result.undefinedTerms) {
        lines.push(`- *${term}*`);
      }
      lines.push('');
    }

    if (result.issues.length > 0) {
      lines.push('## Issues');
      lines.push('');
      for (const issue of result.issues) {
        const icon = issue.severity === 'critical' ? '[CRITICAL]' :
                     issue.severity === 'major' ? '[MAJOR]' : '[MINOR]';
        lines.push(`${icon} **${issue.severity.toUpperCase()}**: ${issue.message}`);
        lines.push(`   -> ${issue.suggestion}`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}

// Export singleton
export const continuityChecker = new ContinuityChecker();
