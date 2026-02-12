/**
 * TransitionPatternMapper - Maps section, paragraph, and chapter transition patterns
 * Extracts how the author transitions between ideas, paragraphs, and major sections
 */

/**
 * Section-level transition patterns
 */
export interface SectionTransitions {
  /** How sections typically begin */
  openers: string[];
  /** How sections typically end */
  closers: string[];
  /** Phrases used to bridge between sections */
  bridgingPhrases: string[];
  /** Average section length in paragraphs */
  avgSectionLength: number;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Paragraph-level transition patterns
 */
export interface ParagraphTransitions {
  /** Common topic sentence patterns */
  topicSentencePatterns: string[];
  /** Additive connectors (moreover, furthermore) */
  connectors: string[];
  /** Contrastive connectors (however, on the other hand) */
  contrastConnectors: string[];
  /** Sequence markers (first, next, finally) */
  sequenceMarkers: string[];
  /** Causal connectors (therefore, as a result) */
  causalConnectors: string[];
  /** Example introducers (for instance, specifically) */
  exampleConnectors: string[];
  /** Average paragraph length in sentences */
  avgParagraphLength: number;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Chapter-level transition patterns
 */
export interface ChapterTransitions {
  /** How chapters typically begin */
  chapterOpenings: string[];
  /** How chapters typically conclude */
  chapterClosings: string[];
  /** Preview phrases for upcoming chapters */
  previewPhrases: string[];
  /** Review phrases referencing previous chapters */
  reviewPhrases: string[];
  /** Cross-reference patterns */
  crossReferences: string[];
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Complete transition pattern profile
 */
export interface TransitionPatterns {
  sectionTransitions: SectionTransitions;
  paragraphTransitions: ParagraphTransitions;
  chapterTransitions: ChapterTransitions;
  /** Overall confidence in analysis */
  overallConfidence: number;
  /** Number of transitions detected */
  transitionsDetected: number;
}

// Section opener patterns
const SECTION_OPENER_PATTERNS = [
  /^(this\s+(section|part|chapter)\s+(examines?|explores?|discusses?|addresses?|considers?|analyzes?|presents?))/i,
  /^(in\s+this\s+(section|part|chapter),?\s+(i|we|the\s+\w+))/i,
  /^(the\s+following\s+(section|discussion|analysis)\s+(presents?|examines?|explores?))/i,
  /^(having\s+(established|examined|discussed|considered))/i,
  /^(building\s+on\s+(the\s+)?(previous|preceding)\s+(section|discussion|analysis))/i,
  /^(we\s+now\s+turn\s+(our\s+attention\s+)?to)/i,
  /^(i\s+now\s+turn\s+to)/i,
  /^(turning\s+(now\s+)?to)/i,
  /^(attention\s+now\s+shifts\s+to)/i,
  /^(this\s+brings\s+us\s+to)/i,
];

// Section closer patterns
const SECTION_CLOSER_PATTERNS = [
  /^(in\s+(summary|conclusion|sum))/i,
  /^(to\s+(summarize|conclude|sum\s+up))/i,
  /^(this\s+(section|discussion|analysis)\s+has\s+(shown|demonstrated|established|revealed))/i,
  /^(having\s+(established|shown|demonstrated|discussed)\s+that)/i,
  /^(the\s+(foregoing|preceding)\s+(discussion|analysis|examination)\s+(has\s+)?(shown|demonstrates?))/i,
  /^(as\s+(this\s+)?(section|discussion|analysis)\s+has\s+(shown|demonstrated))/i,
  /^(these\s+(findings?|observations?|points?)\s+(suggest|indicate|demonstrate))/i,
  /^(taken\s+together)/i,
];

// Section bridging patterns
const SECTION_BRIDGING_PATTERNS = [
  /(with\s+this\s+(foundation|understanding|background)\s+(in\s+place|established))/i,
  /(having\s+(laid|established)\s+(the\s+)?groundwork)/i,
  /(this\s+sets\s+the\s+stage\s+for)/i,
  /(this\s+(provides|offers|establishes)\s+(the\s+)?(foundation|basis|framework)\s+for)/i,
  /(against\s+this\s+(backdrop|background))/i,
  /(with\s+these\s+(considerations?|points?|observations?)\s+in\s+mind)/i,
  /(armed\s+with\s+this\s+(understanding|knowledge|insight))/i,
];

// Additive connectors
const ADDITIVE_CONNECTOR_PATTERNS = [
  /^(moreover)/i,
  /^(furthermore)/i,
  /^(in\s+addition)/i,
  /^(additionally)/i,
  /^(also)/i,
  /^(similarly)/i,
  /^(likewise)/i,
  /^(in\s+the\s+same\s+vein)/i,
  /^(along\s+these\s+lines)/i,
  /^(equally\s+important)/i,
  /^(what\s+is\s+more)/i,
  /^(not\s+only\s+that)/i,
  /^(beyond\s+this)/i,
];

// Contrastive connectors
const CONTRASTIVE_CONNECTOR_PATTERNS = [
  /^(however)/i,
  /^(nevertheless)/i,
  /^(nonetheless)/i,
  /^(yet)/i,
  /^(but)/i,
  /^(conversely)/i,
  /^(on\s+the\s+other\s+hand)/i,
  /^(in\s+contrast)/i,
  /^(by\s+contrast)/i,
  /^(on\s+the\s+contrary)/i,
  /^(alternatively)/i,
  /^(whereas)/i,
  /^(while)/i,
  /^(although)/i,
  /^(despite\s+this)/i,
  /^(notwithstanding)/i,
  /^(that\s+said)/i,
];

// Sequence markers
const SEQUENCE_MARKER_PATTERNS = [
  /^(first(ly)?)/i,
  /^(second(ly)?)/i,
  /^(third(ly)?)/i,
  /^(fourth(ly)?)/i,
  /^(fifth(ly)?)/i,
  /^(next)/i,
  /^(then)/i,
  /^(subsequently)/i,
  /^(afterwards?)/i,
  /^(finally)/i,
  /^(lastly)/i,
  /^(to\s+begin\s+with)/i,
  /^(in\s+the\s+first\s+(place|instance))/i,
  /^(at\s+the\s+outset)/i,
  /^(initially)/i,
  /^(following\s+this)/i,
  /^(at\s+this\s+(point|stage))/i,
];

// Causal connectors
const CAUSAL_CONNECTOR_PATTERNS = [
  /^(therefore)/i,
  /^(thus)/i,
  /^(hence)/i,
  /^(consequently)/i,
  /^(as\s+a\s+result)/i,
  /^(accordingly)/i,
  /^(for\s+this\s+reason)/i,
  /^(it\s+follows\s+that)/i,
  /^(because\s+of\s+this)/i,
  /^(this\s+(means|implies|suggests)\s+that)/i,
  /^(given\s+this)/i,
  /^(in\s+light\s+of\s+this)/i,
];

// Example connectors
const EXAMPLE_CONNECTOR_PATTERNS = [
  /^(for\s+(example|instance))/i,
  /^(specifically)/i,
  /^(in\s+particular)/i,
  /^(notably)/i,
  /^(to\s+illustrate)/i,
  /^(consider)/i,
  /^(take,?\s+for\s+(example|instance))/i,
  /^(a\s+(case|good\s+example)\s+in\s+point)/i,
  /^(as\s+an\s+(illustration|example))/i,
];

// Chapter opening patterns
const CHAPTER_OPENING_PATTERNS = [
  /^(this\s+chapter\s+(examines?|explores?|investigates?|addresses?|considers?|analyzes?|presents?|introduces?|develops?))/i,
  /^(in\s+this\s+chapter,?\s+(i|we))/i,
  /^(the\s+(present|current)\s+chapter)/i,
  /^(chapter\s+\d+\s+(examines?|explores?|addresses?))/i,
  /^(the\s+(aim|purpose|goal|objective)\s+of\s+this\s+chapter\s+is)/i,
  /^(this\s+chapter\s+(begins|opens|starts)\s+(by|with))/i,
  /^(the\s+chapter\s+is\s+organized\s+as\s+follows)/i,
  /^(the\s+chapter\s+proceeds\s+(as\s+follows|in\s+\w+\s+(parts|sections)))/i,
];

// Chapter closing patterns
const CHAPTER_CLOSING_PATTERNS = [
  /^(this\s+chapter\s+has\s+(shown|demonstrated|established|argued|explored|examined))/i,
  /^(in\s+this\s+chapter,?\s+(i|we)\s+have)/i,
  /^(the\s+(foregoing|preceding)\s+(discussion|analysis|chapter)\s+has)/i,
  /^(to\s+(conclude|summarize)\s+this\s+chapter)/i,
  /^(in\s+(conclusion|summary|closing))/i,
  /^(the\s+(main|key|central)\s+(argument|finding|contribution)\s+of\s+this\s+chapter)/i,
  /^(this\s+chapter\s+concludes\s+by)/i,
];

// Preview phrases (next chapter)
const PREVIEW_PHRASE_PATTERNS = [
  /^(the\s+next\s+chapter\s+will)/i,
  /^(in\s+the\s+(next|following)\s+chapter)/i,
  /^(chapter\s+\d+\s+will)/i,
  /^(the\s+(following|subsequent)\s+chapter\s+(addresses?|examines?|explores?|turns\s+to))/i,
  /^(we\s+will\s+(return|turn)\s+to\s+this\s+(in|point))/i,
  /^(this\s+(issue|question|topic)\s+will\s+be\s+(addressed|examined|explored)\s+(further\s+)?in\s+chapter)/i,
  /^(i\s+will\s+(explore|examine|address|discuss)\s+this\s+(further\s+)?in)/i,
];

// Review phrases (previous chapter)
const REVIEW_PHRASE_PATTERNS = [
  /^(as\s+(discussed|shown|demonstrated|argued|noted)\s+in\s+(the\s+)?(previous|preceding)\s+chapter)/i,
  /^(recall\s+(from\s+)?(chapter|the\s+previous))/i,
  /^(in\s+(chapter|the\s+previous\s+chapter),?\s+(i|we)\s+(showed|demonstrated|argued))/i,
  /^(as\s+chapter\s+\d+\s+(showed|demonstrated|established))/i,
  /^(building\s+on\s+(chapter|the\s+previous\s+chapter))/i,
  /^(drawing\s+on\s+(the\s+)?analysis\s+(in|from)\s+(the\s+)?(previous|preceding))/i,
  /^(the\s+(previous|preceding)\s+chapter\s+(established|showed|demonstrated))/i,
];

// Cross-reference patterns
const CROSS_REFERENCE_PATTERNS = [
  /\(see\s+(chapter|section)\s+\d+\)/i,
  /\(see\s+also\s+(chapter|section)\s+\d+\)/i,
  /(as\s+noted\s+in\s+(chapter|section)\s+\d+)/i,
  /(discussed\s+(in|above|below|earlier|later|in\s+chapter))/i,
  /((return|refer)\s+to\s+this\s+(point|issue|topic)\s+in)/i,
  /(will\s+be\s+(discussed|examined|explored)\s+(further\s+)?(in|below))/i,
];

/**
 * Maps transition patterns from academic text
 */
export class TransitionPatternMapper {
  private minTextLength = 100;

  /**
   * Extract transition patterns from text
   * @param text - Academic text to analyze
   * @returns Transition patterns profile
   */
  extractFromText(text: string): TransitionPatterns {
    if (!text || text.length < this.minTextLength) {
      return this.createEmptyPatterns();
    }

    const sentences = this.extractSentences(text);
    const paragraphs = this.extractParagraphs(text);

    const sectionTransitions = this.extractSectionTransitions(sentences, paragraphs, text);
    const paragraphTransitions = this.extractParagraphTransitions(sentences, paragraphs, text);
    const chapterTransitions = this.extractChapterTransitions(sentences, text);

    const transitionsDetected =
      sectionTransitions.openers.length + sectionTransitions.closers.length +
      paragraphTransitions.connectors.length + paragraphTransitions.contrastConnectors.length +
      chapterTransitions.chapterOpenings.length + chapterTransitions.previewPhrases.length;

    const overallConfidence = this.calculateOverallConfidence(
      sectionTransitions,
      paragraphTransitions,
      chapterTransitions
    );

    return {
      sectionTransitions,
      paragraphTransitions,
      chapterTransitions,
      overallConfidence,
      transitionsDetected,
    };
  }

  /**
   * Extract transition patterns from multiple chapters
   * Useful for analyzing full dissertation structure
   * @param chapters - Array of chapter texts
   * @returns Combined transition patterns
   */
  extractFromMultipleChapters(chapters: string[]): TransitionPatterns {
    if (chapters.length === 0) {
      return this.createEmptyPatterns();
    }

    // Analyze each chapter
    const chapterPatterns = chapters.map(ch => this.extractFromText(ch));

    // Merge all patterns
    return this.mergePatterns(chapterPatterns);
  }

  /**
   * Merge multiple transition pattern analyses
   * @param patterns - Array of patterns to merge
   * @returns Merged patterns
   */
  mergePatterns(patterns: TransitionPatterns[]): TransitionPatterns {
    if (patterns.length === 0) {
      return this.createEmptyPatterns();
    }

    if (patterns.length === 1) {
      return patterns[0];
    }

    return {
      sectionTransitions: this.mergeSectionTransitions(
        patterns.map(p => p.sectionTransitions)
      ),
      paragraphTransitions: this.mergeParagraphTransitions(
        patterns.map(p => p.paragraphTransitions)
      ),
      chapterTransitions: this.mergeChapterTransitions(
        patterns.map(p => p.chapterTransitions)
      ),
      overallConfidence: this.average(patterns.map(p => p.overallConfidence)),
      transitionsDetected: patterns.reduce((sum, p) => sum + p.transitionsDetected, 0),
    };
  }

  /**
   * Generate a prompt section for transition patterns
   * @param patterns - Transition patterns
   * @returns Formatted prompt string
   */
  generatePromptSection(patterns: TransitionPatterns): string {
    const parts: string[] = [];

    parts.push('Transition Patterns:');

    // Section transitions
    if (patterns.sectionTransitions.confidence > 0.3) {
      parts.push('\n  Section-Level Transitions:');
      if (patterns.sectionTransitions.openers.length > 0) {
        parts.push(`    - Section openers: ${patterns.sectionTransitions.openers.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.sectionTransitions.closers.length > 0) {
        parts.push(`    - Section closers: ${patterns.sectionTransitions.closers.slice(0, 3).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.sectionTransitions.bridgingPhrases.length > 0) {
        parts.push(`    - Bridging phrases: ${patterns.sectionTransitions.bridgingPhrases.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
    }

    // Paragraph transitions
    if (patterns.paragraphTransitions.confidence > 0.3) {
      parts.push('\n  Paragraph-Level Transitions:');
      if (patterns.paragraphTransitions.connectors.length > 0) {
        parts.push(`    - Additive: ${patterns.paragraphTransitions.connectors.slice(0, 5).join(', ')}`);
      }
      if (patterns.paragraphTransitions.contrastConnectors.length > 0) {
        parts.push(`    - Contrastive: ${patterns.paragraphTransitions.contrastConnectors.slice(0, 5).join(', ')}`);
      }
      if (patterns.paragraphTransitions.sequenceMarkers.length > 0) {
        parts.push(`    - Sequence: ${patterns.paragraphTransitions.sequenceMarkers.slice(0, 5).join(', ')}`);
      }
      if (patterns.paragraphTransitions.causalConnectors.length > 0) {
        parts.push(`    - Causal: ${patterns.paragraphTransitions.causalConnectors.slice(0, 4).join(', ')}`);
      }
      if (patterns.paragraphTransitions.exampleConnectors.length > 0) {
        parts.push(`    - Examples: ${patterns.paragraphTransitions.exampleConnectors.slice(0, 4).join(', ')}`);
      }
      if (patterns.paragraphTransitions.topicSentencePatterns.length > 0) {
        parts.push(`    - Topic sentence patterns: ${patterns.paragraphTransitions.topicSentencePatterns.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
    }

    // Chapter transitions
    if (patterns.chapterTransitions.confidence > 0.3) {
      parts.push('\n  Chapter-Level Transitions:');
      if (patterns.chapterTransitions.chapterOpenings.length > 0) {
        parts.push(`    - Chapter openings: ${patterns.chapterTransitions.chapterOpenings.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.chapterTransitions.chapterClosings.length > 0) {
        parts.push(`    - Chapter closings: ${patterns.chapterTransitions.chapterClosings.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.chapterTransitions.previewPhrases.length > 0) {
        parts.push(`    - Preview phrases: ${patterns.chapterTransitions.previewPhrases.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
      if (patterns.chapterTransitions.reviewPhrases.length > 0) {
        parts.push(`    - Review phrases: ${patterns.chapterTransitions.reviewPhrases.slice(0, 2).map(p => `"${p}"`).join(', ')}`);
      }
    }

    return parts.join('\n');
  }

  // Private extraction methods

  private extractSectionTransitions(sentences: string[], paragraphs: string[], text: string): SectionTransitions {
    const openers: string[] = [];
    const closers: string[] = [];
    const bridgingPhrases: string[] = [];

    // Look for section openers at paragraph starts
    for (const para of paragraphs) {
      const firstSentence = this.getFirstSentence(para);
      for (const pattern of SECTION_OPENER_PATTERNS) {
        const match = firstSentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!openers.includes(extracted)) {
            openers.push(extracted);
          }
        }
      }
    }

    // Look for section closers at paragraph ends
    for (const para of paragraphs) {
      const lastSentence = this.getLastSentence(para);
      for (const pattern of SECTION_CLOSER_PATTERNS) {
        const match = lastSentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!closers.includes(extracted)) {
            closers.push(extracted);
          }
        }
      }
    }

    // Look for bridging phrases
    for (const sentence of sentences) {
      for (const pattern of SECTION_BRIDGING_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!bridgingPhrases.includes(extracted)) {
            bridgingPhrases.push(extracted);
          }
        }
      }
    }

    // Calculate average section length (approximate by looking for headers or major breaks)
    const sectionBreaks = (text.match(/\n\s*#+\s+|\n\s*\*\*[^*]+\*\*\s*\n/g) || []).length;
    const avgSectionLength = sectionBreaks > 0 ? paragraphs.length / (sectionBreaks + 1) : paragraphs.length;

    const totalFound = openers.length + closers.length + bridgingPhrases.length;
    const confidence = Math.min(1, totalFound / 10);

    return {
      openers: openers.slice(0, 15),
      closers: closers.slice(0, 15),
      bridgingPhrases: bridgingPhrases.slice(0, 10),
      avgSectionLength,
      confidence,
    };
  }

  private extractParagraphTransitions(sentences: string[], paragraphs: string[], text: string): ParagraphTransitions {
    const topicSentencePatterns: string[] = [];
    const connectors: string[] = [];
    const contrastConnectors: string[] = [];
    const sequenceMarkers: string[] = [];
    const causalConnectors: string[] = [];
    const exampleConnectors: string[] = [];

    // Extract topic sentence patterns from paragraph openings
    for (const para of paragraphs) {
      const firstSentence = this.getFirstSentence(para);
      const firstFewWords = firstSentence.split(/\s+/).slice(0, 5).join(' ').toLowerCase();
      if (firstFewWords.length > 10 && !topicSentencePatterns.includes(firstFewWords)) {
        // Check if it starts with a transition word
        const startsWithTransition = [
          ...ADDITIVE_CONNECTOR_PATTERNS,
          ...CONTRASTIVE_CONNECTOR_PATTERNS,
          ...SEQUENCE_MARKER_PATTERNS,
        ].some(p => p.test(firstFewWords));

        if (startsWithTransition || topicSentencePatterns.length < 15) {
          topicSentencePatterns.push(firstFewWords);
        }
      }
    }

    // Extract connector types
    const extractConnectors = (patterns: RegExp[], target: string[]) => {
      for (const sentence of sentences) {
        for (const pattern of patterns) {
          const match = sentence.match(pattern);
          if (match) {
            const extracted = this.cleanPattern(match[0]);
            if (!target.includes(extracted)) {
              target.push(extracted);
            }
          }
        }
      }
    };

    extractConnectors(ADDITIVE_CONNECTOR_PATTERNS, connectors);
    extractConnectors(CONTRASTIVE_CONNECTOR_PATTERNS, contrastConnectors);
    extractConnectors(SEQUENCE_MARKER_PATTERNS, sequenceMarkers);
    extractConnectors(CAUSAL_CONNECTOR_PATTERNS, causalConnectors);
    extractConnectors(EXAMPLE_CONNECTOR_PATTERNS, exampleConnectors);

    // Calculate average paragraph length in sentences
    const sentencesPerPara = paragraphs.map(p => this.extractSentences(p).length);
    const avgParagraphLength = sentencesPerPara.length > 0
      ? sentencesPerPara.reduce((a, b) => a + b, 0) / sentencesPerPara.length
      : 4;

    const totalFound = connectors.length + contrastConnectors.length + sequenceMarkers.length;
    const confidence = Math.min(1, totalFound / 15);

    return {
      topicSentencePatterns: topicSentencePatterns.slice(0, 20),
      connectors: connectors.slice(0, 15),
      contrastConnectors: contrastConnectors.slice(0, 15),
      sequenceMarkers: sequenceMarkers.slice(0, 15),
      causalConnectors: causalConnectors.slice(0, 10),
      exampleConnectors: exampleConnectors.slice(0, 10),
      avgParagraphLength,
      confidence,
    };
  }

  private extractChapterTransitions(sentences: string[], text: string): ChapterTransitions {
    const chapterOpenings: string[] = [];
    const chapterClosings: string[] = [];
    const previewPhrases: string[] = [];
    const reviewPhrases: string[] = [];
    const crossReferences: string[] = [];

    // Extract chapter openings
    for (const sentence of sentences.slice(0, 20)) { // Check early sentences
      for (const pattern of CHAPTER_OPENING_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!chapterOpenings.includes(extracted)) {
            chapterOpenings.push(extracted);
          }
        }
      }
    }

    // Extract chapter closings (check later sentences)
    for (const sentence of sentences.slice(-30)) {
      for (const pattern of CHAPTER_CLOSING_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!chapterClosings.includes(extracted)) {
            chapterClosings.push(extracted);
          }
        }
      }
    }

    // Extract preview phrases
    for (const sentence of sentences) {
      for (const pattern of PREVIEW_PHRASE_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!previewPhrases.includes(extracted)) {
            previewPhrases.push(extracted);
          }
        }
      }
    }

    // Extract review phrases
    for (const sentence of sentences) {
      for (const pattern of REVIEW_PHRASE_PATTERNS) {
        const match = sentence.match(pattern);
        if (match) {
          const extracted = this.cleanPattern(match[0]);
          if (!reviewPhrases.includes(extracted)) {
            reviewPhrases.push(extracted);
          }
        }
      }
    }

    // Extract cross-references
    for (const pattern of CROSS_REFERENCE_PATTERNS) {
      const matches = text.matchAll(new RegExp(pattern.source, 'gi'));
      for (const match of matches) {
        const extracted = this.cleanPattern(match[0]);
        if (!crossReferences.includes(extracted)) {
          crossReferences.push(extracted);
        }
      }
    }

    const totalFound = chapterOpenings.length + chapterClosings.length + previewPhrases.length + reviewPhrases.length;
    const confidence = Math.min(1, totalFound / 8);

    return {
      chapterOpenings: chapterOpenings.slice(0, 10),
      chapterClosings: chapterClosings.slice(0, 10),
      previewPhrases: previewPhrases.slice(0, 10),
      reviewPhrases: reviewPhrases.slice(0, 10),
      crossReferences: crossReferences.slice(0, 10),
      confidence,
    };
  }

  // Helper methods

  private extractSentences(text: string): string[] {
    return text
      .replace(/([.!?])\s+/g, '$1|SPLIT|')
      .split('|SPLIT|')
      .map(s => s.trim())
      .filter(s => s.length > 10);
  }

  private extractParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 50);
  }

  private getFirstSentence(text: string): string {
    const match = text.match(/^[^.!?]+[.!?]/);
    return match ? match[0] : text.slice(0, 100);
  }

  private getLastSentence(text: string): string {
    const sentences = this.extractSentences(text);
    return sentences.length > 0 ? sentences[sentences.length - 1] : '';
  }

  private cleanPattern(pattern: string): string {
    return pattern
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
  }

  private calculateOverallConfidence(
    section: SectionTransitions,
    paragraph: ParagraphTransitions,
    chapter: ChapterTransitions
  ): number {
    return (section.confidence + paragraph.confidence + chapter.confidence) / 3;
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private mergeSectionTransitions(transitions: SectionTransitions[]): SectionTransitions {
    return {
      openers: this.mergeArrays(transitions.map(t => t.openers), 20),
      closers: this.mergeArrays(transitions.map(t => t.closers), 20),
      bridgingPhrases: this.mergeArrays(transitions.map(t => t.bridgingPhrases), 15),
      avgSectionLength: this.average(transitions.map(t => t.avgSectionLength)),
      confidence: this.average(transitions.map(t => t.confidence)),
    };
  }

  private mergeParagraphTransitions(transitions: ParagraphTransitions[]): ParagraphTransitions {
    return {
      topicSentencePatterns: this.mergeArrays(transitions.map(t => t.topicSentencePatterns), 25),
      connectors: this.mergeArrays(transitions.map(t => t.connectors), 20),
      contrastConnectors: this.mergeArrays(transitions.map(t => t.contrastConnectors), 20),
      sequenceMarkers: this.mergeArrays(transitions.map(t => t.sequenceMarkers), 20),
      causalConnectors: this.mergeArrays(transitions.map(t => t.causalConnectors), 15),
      exampleConnectors: this.mergeArrays(transitions.map(t => t.exampleConnectors), 15),
      avgParagraphLength: this.average(transitions.map(t => t.avgParagraphLength)),
      confidence: this.average(transitions.map(t => t.confidence)),
    };
  }

  private mergeChapterTransitions(transitions: ChapterTransitions[]): ChapterTransitions {
    return {
      chapterOpenings: this.mergeArrays(transitions.map(t => t.chapterOpenings), 15),
      chapterClosings: this.mergeArrays(transitions.map(t => t.chapterClosings), 15),
      previewPhrases: this.mergeArrays(transitions.map(t => t.previewPhrases), 15),
      reviewPhrases: this.mergeArrays(transitions.map(t => t.reviewPhrases), 15),
      crossReferences: this.mergeArrays(transitions.map(t => t.crossReferences), 15),
      confidence: this.average(transitions.map(t => t.confidence)),
    };
  }

  private mergeArrays(arrays: string[][], limit: number): string[] {
    const counts = new Map<string, number>();
    for (const arr of arrays) {
      for (const item of arr) {
        counts.set(item, (counts.get(item) || 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item);
  }

  private createEmptyPatterns(): TransitionPatterns {
    return {
      sectionTransitions: {
        openers: [],
        closers: [],
        bridgingPhrases: [],
        avgSectionLength: 0,
        confidence: 0,
      },
      paragraphTransitions: {
        topicSentencePatterns: [],
        connectors: [],
        contrastConnectors: [],
        sequenceMarkers: [],
        causalConnectors: [],
        exampleConnectors: [],
        avgParagraphLength: 0,
        confidence: 0,
      },
      chapterTransitions: {
        chapterOpenings: [],
        chapterClosings: [],
        previewPhrases: [],
        reviewPhrases: [],
        crossReferences: [],
        confidence: 0,
      },
      overallConfidence: 0,
      transitionsDetected: 0,
    };
  }
}
