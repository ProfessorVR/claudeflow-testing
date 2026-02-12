/**
 * ChapterContextAggregator - Extract and aggregate key information after each chapter
 *
 * Implements cross-chapter context threading for the PhD Pipeline to maintain
 * coherent dissertation narrative across chapters.
 *
 * Responsibilities:
 * - Extract key arguments from chapter text
 * - Extract defined terms and their first appearances
 * - Detect forward and backward references to other chapters
 * - Extract themes and topics covered
 * - Generate summaries for context injection into subsequent agents
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Represents the extracted context from a single chapter
 */
export interface ChapterContext {
  /** Chapter number (1-indexed) */
  chapterId: number;
  /** Chapter title */
  chapterTitle: string;

  /** Key claims made in this chapter */
  keyArguments: Array<{
    id: string;
    statement: string;
    type: 'introduced' | 'developed' | 'concluded';
    supportingEvidence: string[];
  }>;

  /** Terms defined in this chapter */
  definedTerms: Array<{
    term: string;
    definition: string;
    firstMentionParagraph: number;
  }>;

  /** References to future chapters */
  forwardReferences: Array<{
    targetChapter: number;
    claim: string;
    validated: boolean;
  }>;

  /** References to prior chapters */
  backwardReferences: Array<{
    sourceChapter: number;
    claim: string;
  }>;

  /** Themes and topics covered */
  themes: string[];

  /** Summary for context injection */
  summary: string;

  /** Extraction timestamp */
  extractedAt: number;
}

/**
 * Patterns for detecting argument-related language
 */
const ARGUMENT_PATTERNS = {
  /** Patterns indicating a new argument is being introduced */
  introduction: [
    /\bthis\s+(?:paper|chapter|dissertation|study|research)\s+argues?\s+that\b/gi,
    /\bthe\s+central\s+(?:argument|thesis|claim)\s+(?:is|holds)\s+that\b/gi,
    /\bwe\s+(?:propose|argue|contend|suggest)\s+that\b/gi,
    /\bI\s+(?:propose|argue|contend|suggest)\s+that\b/gi,
    /\bit\s+(?:is\s+)?(?:proposed|argued|contended|suggested)\s+(?:here\s+)?that\b/gi,
    /\bthe\s+thesis\s+(?:of\s+this\s+(?:chapter|dissertation))?\s+is\s+that\b/gi,
    /\bthis\s+(?:section|chapter)\s+introduces\s+(?:the\s+(?:concept|idea|notion)\s+(?:of|that))?\b/gi,
  ],

  /** Patterns indicating development of an existing argument */
  development: [
    /\b(?:building|expanding)\s+(?:on|upon)\s+(?:this|the\s+previous)\s+(?:argument|point|analysis)\b/gi,
    /\b(?:furthermore|moreover|additionally)\s*,?\s+(?:this|the)\s+(?:analysis|argument)\b/gi,
    /\bthis\s+(?:evidence|finding)\s+(?:supports|reinforces|strengthens)\s+(?:the\s+)?(?:argument|claim)\b/gi,
    /\bas\s+(?:demonstrated|shown|established)\s+(?:above|earlier|previously)\b/gi,
    /\bextending\s+(?:this|the)\s+(?:analysis|argument|discussion)\b/gi,
  ],

  /** Patterns indicating conclusion of an argument */
  conclusion: [
    /\b(?:in\s+)?conclusion\s*,?\s+(?:this|the)\s+(?:chapter|analysis|study)\s+(?:has\s+)?(?:demonstrated|shown|established)\b/gi,
    /\bthus\s*,?\s+(?:this|the)\s+(?:argument|analysis)\s+(?:demonstrates|shows|establishes)\b/gi,
    /\btherefore\s*,?\s+(?:it\s+(?:is|can\s+be)\s+)?(?:concluded|argued|demonstrated)\s+that\b/gi,
    /\bto\s+summarise\s*,?\s+(?:the\s+)?(?:key|main|central)\s+(?:argument|finding|contribution)\s+is\b/gi,
    /\bthis\s+(?:chapter|section)\s+has\s+(?:demonstrated|shown|established|argued)\s+that\b/gi,
  ],
};

/**
 * Patterns for detecting term definitions
 */
const DEFINITION_PATTERNS = [
  // "X is defined as Y"
  /['"]?([A-Z][a-z]+(?:\s+[a-z]+){0,3})['"]?\s+is\s+defined\s+as\s+["']?([^.]+)["']?/gi,
  // "X, which refers to Y"
  /['"]?([A-Z][a-z]+(?:\s+[a-z]+){0,3})['"]?\s*,\s*which\s+refers\s+to\s+([^,]+)/gi,
  // "By X, we mean Y"
  /[Bb]y\s+['"]?([A-Z][a-z]+(?:\s+[a-z]+){0,3})['"]?\s*,\s*(?:we\s+mean|I\s+mean|is\s+meant)\s+([^.]+)/gi,
  // "X (hereafter referred to as Y)"
  /([A-Z][a-z]+(?:\s+[a-z]+){0,5})\s+\((?:hereafter\s+)?(?:referred\s+to\s+as|termed|called)\s+['"]?([^)]+)['"]?\)/gi,
  // "The term X refers to Y"
  /[Tt]he\s+term\s+['"]?([A-Za-z]+(?:\s+[a-z]+){0,3})['"]?\s+refers\s+to\s+([^.]+)/gi,
  // Definition with colon: "Key concept: definition"
  /([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+){0,3}):\s+([A-Z][^.]+\.)/g,
];

/**
 * Patterns for detecting forward references
 */
const FORWARD_REFERENCE_PATTERNS = [
  // "Chapter N will discuss/examine/explore X"
  /[Cc]hapter\s+(\d+)\s+will\s+(?:discuss|examine|explore|analyse|analyze|address|consider)\s+([^.]+)/g,
  // "This will be discussed in Chapter N"
  /(?:this|these|the\s+\w+)\s+will\s+be\s+(?:discussed|examined|explored|analysed|analyzed|addressed)\s+(?:further\s+)?in\s+[Cc]hapter\s+(\d+)/gi,
  // "As we shall see in Chapter N"
  /[Aa]s\s+(?:we\s+)?(?:shall|will)\s+see\s+in\s+[Cc]hapter\s+(\d+)\s*,?\s*([^.]*)/g,
  // "Chapter N addresses this"
  /[Cc]hapter\s+(\d+)\s+(?:addresses|explores|examines|analyses|analyzes)\s+(?:this|these|the)\s+([^.]+)/g,
  // "See Chapter N for X"
  /[Ss]ee\s+[Cc]hapter\s+(\d+)\s+for\s+([^.]+)/g,
];

/**
 * Patterns for detecting backward references
 */
const BACKWARD_REFERENCE_PATTERNS = [
  // "As discussed in Chapter N"
  /[Aa]s\s+(?:discussed|shown|demonstrated|established|argued)\s+in\s+[Cc]hapter\s+(\d+)\s*,?\s*([^.]*)?/g,
  // "Recall from Chapter N that X"
  /[Rr]ecall\s+from\s+[Cc]hapter\s+(\d+)\s+that\s+([^.]+)/g,
  // "Building on Chapter N's analysis"
  /[Bb]uilding\s+on\s+[Cc]hapter\s+(\d+)['s]*\s+(?:analysis|discussion|findings?|arguments?)\s*,?\s*([^.]*)?/g,
  // "Chapter N established that X"
  /[Cc]hapter\s+(\d+)\s+(?:established|demonstrated|showed|argued)\s+that\s+([^.]+)/g,
  // "(see Chapter N)"
  /\(see\s+[Cc]hapter\s+(\d+)(?:\s+for\s+([^)]+))?\)/g,
];

/**
 * Theme extraction keywords by category
 */
const THEME_KEYWORDS: Record<string, string[]> = {
  methodology: [
    'methodology', 'method', 'approach', 'framework', 'design', 'procedure',
    'technique', 'strategy', 'protocol', 'paradigm', 'instrument'
  ],
  theory: [
    'theory', 'theoretical', 'conceptual', 'model', 'construct', 'hypothesis',
    'proposition', 'axiom', 'principle', 'postulate'
  ],
  empirical: [
    'empirical', 'data', 'evidence', 'finding', 'result', 'observation',
    'measurement', 'experiment', 'study', 'analysis', 'sample'
  ],
  literature: [
    'literature', 'review', 'scholarship', 'research', 'study', 'debate',
    'discourse', 'critique', 'perspective', 'tradition'
  ],
  application: [
    'application', 'implementation', 'practice', 'case study', 'example',
    'illustration', 'demonstration', 'instantiation'
  ],
  critique: [
    'critique', 'criticism', 'limitation', 'weakness', 'challenge', 'problem',
    'gap', 'shortcoming', 'deficiency', 'issue'
  ],
};

/**
 * ChapterContextAggregator extracts and aggregates key information from chapter text
 */
export class ChapterContextAggregator {
  /**
   * Extract comprehensive context from a chapter's text
   *
   * @param chapterText - The full text of the chapter
   * @param chapterNumber - The chapter number (1-indexed)
   * @param chapterTitle - Optional chapter title (extracted from text if not provided)
   * @returns ChapterContext with all extracted information
   */
  extractContext(
    chapterText: string,
    chapterNumber: number,
    chapterTitle?: string
  ): ChapterContext {
    // Extract title from text if not provided
    const title = chapterTitle || this.extractTitle(chapterText, chapterNumber);

    // Extract all components
    const keyArguments = this.extractKeyArguments(chapterText);
    const definedTerms = this.extractDefinedTerms(chapterText);
    const forwardReferences = this.detectForwardReferences(chapterText);
    const backwardReferences = this.detectBackwardReferences(chapterText);
    const themes = this.extractThemes(chapterText);
    const summary = this.generateSummary(chapterText, keyArguments, themes);

    return {
      chapterId: chapterNumber,
      chapterTitle: title,
      keyArguments,
      definedTerms,
      forwardReferences,
      backwardReferences,
      themes,
      summary,
      extractedAt: Date.now(),
    };
  }

  /**
   * Build a context summary prompt for writing agents
   *
   * @param upToChapter - Build context up to (but not including) this chapter
   * @param contexts - Array of ChapterContext objects for prior chapters
   * @returns Formatted string for injection into agent prompts
   */
  buildContextSummaryForAgent(
    upToChapter: number,
    contexts: ChapterContext[]
  ): string {
    // Filter to only chapters before the target
    const priorContexts = contexts
      .filter(c => c.chapterId < upToChapter)
      .sort((a, b) => a.chapterId - b.chapterId);

    if (priorContexts.length === 0) {
      return this.buildFirstChapterContext();
    }

    const sections: string[] = [];

    // Header
    sections.push('## CROSS-CHAPTER CONTEXT');
    sections.push('');
    sections.push(`You are writing Chapter ${upToChapter}. The following context from prior chapters MUST inform your writing.`);
    sections.push('');

    // Prior chapter summaries
    sections.push('### Prior Chapter Summaries');
    sections.push('');
    for (const ctx of priorContexts) {
      sections.push(`**Chapter ${ctx.chapterId}: ${ctx.chapterTitle}**`);
      sections.push(ctx.summary);
      sections.push('');
    }

    // Active argument threads
    const activeArguments = this.collectActiveArguments(priorContexts);
    if (activeArguments.length > 0) {
      sections.push('### Active Argument Threads');
      sections.push('');
      sections.push('These arguments have been introduced and may need development or conclusion:');
      sections.push('');
      for (const arg of activeArguments) {
        sections.push(`- **${arg.id}** (${arg.type} in Ch.${arg.sourceChapter}): ${arg.statement}`);
      }
      sections.push('');
    }

    // Defined terms glossary
    const allTerms = this.collectDefinedTerms(priorContexts);
    if (allTerms.length > 0) {
      sections.push('### Defined Terms (Use Consistently)');
      sections.push('');
      for (const term of allTerms.slice(0, 15)) { // Limit to most important
        sections.push(`- **${term.term}** (Ch.${term.sourceChapter}): ${term.definition}`);
      }
      sections.push('');
    }

    // Forward reference promises
    const pendingPromises = this.collectForwardReferencePromises(priorContexts, upToChapter);
    if (pendingPromises.length > 0) {
      sections.push('### Forward Reference Promises to Fulfill');
      sections.push('');
      sections.push('Prior chapters made these promises about this chapter that MUST be addressed:');
      sections.push('');
      for (const promise of pendingPromises) {
        sections.push(`- Ch.${promise.sourceChapter} promised: "${promise.claim}"`);
      }
      sections.push('');
    }

    // Key themes to maintain
    const dominantThemes = this.identifyDominantThemes(priorContexts);
    if (dominantThemes.length > 0) {
      sections.push('### Dissertation Themes (Maintain Consistency)');
      sections.push('');
      sections.push(`Primary themes: ${dominantThemes.join(', ')}`);
      sections.push('');
    }

    return sections.join('\n');
  }

  /**
   * Extract key arguments from chapter text
   */
  extractKeyArguments(text: string): ChapterContext['keyArguments'] {
    const arguments_: ChapterContext['keyArguments'] = [];

    // Split into paragraphs for context
    const paragraphs = text.split(/\n\n+/);

    // Check introduction patterns
    for (const pattern of ARGUMENT_PATTERNS.introduction) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const statement = this.extractStatementFromMatch(text, match);
        if (statement && statement.length > 20) {
          arguments_.push({
            id: `arg_${uuidv4().substring(0, 8)}`,
            statement: statement.substring(0, 300),
            type: 'introduced',
            supportingEvidence: this.findSupportingEvidence(text, match.index || 0),
          });
        }
      }
    }

    // Check development patterns
    for (const pattern of ARGUMENT_PATTERNS.development) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const statement = this.extractStatementFromMatch(text, match);
        if (statement && statement.length > 20) {
          arguments_.push({
            id: `arg_${uuidv4().substring(0, 8)}`,
            statement: statement.substring(0, 300),
            type: 'developed',
            supportingEvidence: this.findSupportingEvidence(text, match.index || 0),
          });
        }
      }
    }

    // Check conclusion patterns
    for (const pattern of ARGUMENT_PATTERNS.conclusion) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const statement = this.extractStatementFromMatch(text, match);
        if (statement && statement.length > 20) {
          arguments_.push({
            id: `arg_${uuidv4().substring(0, 8)}`,
            statement: statement.substring(0, 300),
            type: 'concluded',
            supportingEvidence: this.findSupportingEvidence(text, match.index || 0),
          });
        }
      }
    }

    // Deduplicate by similar statements
    return this.deduplicateArguments(arguments_);
  }

  /**
   * Extract defined terms from chapter text
   */
  extractDefinedTerms(text: string): ChapterContext['definedTerms'] {
    const terms: ChapterContext['definedTerms'] = [];
    const seenTerms = new Set<string>();

    // Split into paragraphs to track first mention
    const paragraphs = text.split(/\n\n+/);

    for (const pattern of DEFINITION_PATTERNS) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const term = (match[1] || '').trim();
        const definition = (match[2] || '').trim();

        // Skip if term is too short, too long, or already seen
        if (term.length < 2 || term.length > 50 || seenTerms.has(term.toLowerCase())) {
          continue;
        }

        // Skip common words that aren't really definitions
        if (this.isCommonWord(term)) {
          continue;
        }

        // Find first paragraph containing this term
        const firstParagraph = paragraphs.findIndex(p =>
          p.toLowerCase().includes(term.toLowerCase())
        );

        seenTerms.add(term.toLowerCase());
        terms.push({
          term,
          definition: definition.substring(0, 200),
          firstMentionParagraph: firstParagraph >= 0 ? firstParagraph + 1 : 1,
        });
      }
    }

    return terms;
  }

  /**
   * Detect forward references to later chapters
   */
  detectForwardReferences(text: string): ChapterContext['forwardReferences'] {
    const references: ChapterContext['forwardReferences'] = [];

    for (const pattern of FORWARD_REFERENCE_PATTERNS) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const targetChapter = parseInt(match[1], 10);
        const claim = (match[2] || '').trim();

        if (!isNaN(targetChapter) && targetChapter > 0) {
          references.push({
            targetChapter,
            claim: claim || `Referenced in forward context`,
            validated: false, // Will be validated later
          });
        }
      }
    }

    // Deduplicate by target chapter + similar claim
    const seen = new Set<string>();
    return references.filter(ref => {
      const key = `${ref.targetChapter}:${ref.claim.substring(0, 50)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Detect backward references to earlier chapters
   */
  detectBackwardReferences(text: string): ChapterContext['backwardReferences'] {
    const references: ChapterContext['backwardReferences'] = [];

    for (const pattern of BACKWARD_REFERENCE_PATTERNS) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const sourceChapter = parseInt(match[1], 10);
        const claim = (match[2] || '').trim();

        if (!isNaN(sourceChapter) && sourceChapter > 0) {
          references.push({
            sourceChapter,
            claim: claim || `Referenced from earlier chapter`,
          });
        }
      }
    }

    // Deduplicate
    const seen = new Set<string>();
    return references.filter(ref => {
      const key = `${ref.sourceChapter}:${ref.claim.substring(0, 50)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Extract themes from chapter text
   */
  extractThemes(text: string): string[] {
    const themeCounts: Record<string, number> = {};
    const textLower = text.toLowerCase();

    // Count keyword occurrences per theme
    for (const [theme, keywords] of Object.entries(THEME_KEYWORDS)) {
      let count = 0;
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = textLower.match(regex);
        count += matches ? matches.length : 0;
      }
      themeCounts[theme] = count;
    }

    // Sort by count and return top themes
    const sortedThemes = Object.entries(themeCounts)
      .filter(([_, count]) => count > 3) // Minimum threshold
      .sort((a, b) => b[1] - a[1])
      .map(([theme, _]) => theme);

    return sortedThemes.slice(0, 5);
  }

  // ============================================
  // Private Helper Methods
  // ============================================

  /**
   * Extract chapter title from text
   */
  private extractTitle(text: string, chapterNumber: number): string {
    // Try to find markdown heading
    const headingMatch = text.match(/^#\s+(?:Chapter\s+\d+[.:]\s*)?(.+)$/m);
    if (headingMatch) {
      return headingMatch[1].trim();
    }

    // Try to find "Chapter N: Title" format
    const chapterTitleMatch = text.match(new RegExp(`Chapter\\s+${chapterNumber}[.:]\\s*(.+)`, 'i'));
    if (chapterTitleMatch) {
      return chapterTitleMatch[1].trim();
    }

    return `Chapter ${chapterNumber}`;
  }

  /**
   * Extract full statement from regex match position
   */
  private extractStatementFromMatch(text: string, match: RegExpMatchArray): string {
    const startIndex = match.index || 0;

    // Find sentence boundaries
    const before = text.substring(Math.max(0, startIndex - 100), startIndex);
    const after = text.substring(startIndex, Math.min(text.length, startIndex + 500));

    // Find start of sentence
    const sentenceStartMatch = before.match(/[.!?]\s+([A-Z])/g);
    const sentenceStart = sentenceStartMatch
      ? before.lastIndexOf(sentenceStartMatch[sentenceStartMatch.length - 1]) + 2
      : 0;

    // Find end of sentence
    const sentenceEndMatch = after.match(/[.!?]/);
    const sentenceEnd = sentenceEndMatch ? sentenceEndMatch.index! + 1 : after.length;

    // Combine
    const fullSentence = before.substring(sentenceStart) + after.substring(0, sentenceEnd);

    return fullSentence.trim();
  }

  /**
   * Find supporting evidence near an argument
   */
  private findSupportingEvidence(text: string, matchIndex: number): string[] {
    const evidence: string[] = [];

    // Look for citations nearby
    const nearbyText = text.substring(matchIndex, Math.min(text.length, matchIndex + 1000));
    const citationMatches = nearbyText.matchAll(/\(([A-Z][a-z]+(?:\s+(?:et\s+al\.))?(?:\s*[&,]\s*[A-Z][a-z]+)*),?\s*(\d{4})\)/g);

    for (const match of citationMatches) {
      evidence.push(`${match[1]}, ${match[2]}`);
      if (evidence.length >= 3) break;
    }

    return evidence;
  }

  /**
   * Deduplicate arguments by similar statements
   */
  private deduplicateArguments(
    arguments_: ChapterContext['keyArguments']
  ): ChapterContext['keyArguments'] {
    const seen = new Set<string>();
    return arguments_.filter(arg => {
      // Normalize statement for comparison
      const normalized = arg.statement
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .substring(0, 100);

      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  /**
   * Check if a term is a common word that shouldn't be treated as a definition
   */
  private isCommonWord(term: string): boolean {
    const commonWords = new Set([
      'the', 'this', 'that', 'these', 'those', 'what', 'which', 'who', 'whom',
      'when', 'where', 'why', 'how', 'first', 'second', 'third', 'last',
      'one', 'two', 'three', 'four', 'five', 'next', 'previous', 'chapter',
      'section', 'figure', 'table', 'example', 'note', 'important', 'key',
    ]);
    return commonWords.has(term.toLowerCase());
  }

  /**
   * Generate a summary from chapter content
   */
  private generateSummary(
    text: string,
    arguments_: ChapterContext['keyArguments'],
    themes: string[]
  ): string {
    const summaryParts: string[] = [];

    // Add main arguments
    const mainArguments = arguments_.filter(a => a.type === 'introduced' || a.type === 'concluded');
    if (mainArguments.length > 0) {
      const topArg = mainArguments[0];
      summaryParts.push(`Main argument: ${topArg.statement.substring(0, 150)}`);
    }

    // Add themes
    if (themes.length > 0) {
      summaryParts.push(`Key themes: ${themes.slice(0, 3).join(', ')}`);
    }

    // Add word count estimate
    const wordCount = text.split(/\s+/).length;
    summaryParts.push(`Approximately ${wordCount.toLocaleString()} words.`);

    return summaryParts.join('. ');
  }

  /**
   * Build context for the first chapter (no prior context)
   */
  private buildFirstChapterContext(): string {
    return `## CROSS-CHAPTER CONTEXT

This is Chapter 1, the opening chapter. As the first chapter:

1. **Establish Foundation**: Introduce the research topic, problem, and significance
2. **Define Key Terms**: Clearly define any technical terms you introduce
3. **Set Up Threads**: Arguments introduced here should be developed in later chapters
4. **Make Forward References**: If you mention topics to be discussed later, note which chapters
5. **Maintain Consistency**: Terms and concepts defined here become the dissertation's vocabulary

Remember: The introduction sets the tone and framework for the entire dissertation.
`;
  }

  /**
   * Collect active arguments from prior chapters
   */
  private collectActiveArguments(
    contexts: ChapterContext[]
  ): Array<{ id: string; statement: string; type: string; sourceChapter: number }> {
    const active: Array<{ id: string; statement: string; type: string; sourceChapter: number }> = [];

    for (const ctx of contexts) {
      for (const arg of ctx.keyArguments) {
        if (arg.type === 'introduced' || arg.type === 'developed') {
          active.push({
            id: arg.id,
            statement: arg.statement,
            type: arg.type,
            sourceChapter: ctx.chapterId,
          });
        }
      }
    }

    // Limit to most recent/important
    return active.slice(-10);
  }

  /**
   * Collect defined terms from prior chapters
   */
  private collectDefinedTerms(
    contexts: ChapterContext[]
  ): Array<{ term: string; definition: string; sourceChapter: number }> {
    const terms: Array<{ term: string; definition: string; sourceChapter: number }> = [];
    const seenTerms = new Set<string>();

    for (const ctx of contexts) {
      for (const term of ctx.definedTerms) {
        if (!seenTerms.has(term.term.toLowerCase())) {
          seenTerms.add(term.term.toLowerCase());
          terms.push({
            term: term.term,
            definition: term.definition,
            sourceChapter: ctx.chapterId,
          });
        }
      }
    }

    return terms;
  }

  /**
   * Collect forward reference promises that target a specific chapter
   */
  private collectForwardReferencePromises(
    contexts: ChapterContext[],
    targetChapter: number
  ): Array<{ sourceChapter: number; claim: string }> {
    const promises: Array<{ sourceChapter: number; claim: string }> = [];

    for (const ctx of contexts) {
      for (const ref of ctx.forwardReferences) {
        if (ref.targetChapter === targetChapter) {
          promises.push({
            sourceChapter: ctx.chapterId,
            claim: ref.claim,
          });
        }
      }
    }

    return promises;
  }

  /**
   * Identify dominant themes across chapters
   */
  private identifyDominantThemes(contexts: ChapterContext[]): string[] {
    const themeCounts: Record<string, number> = {};

    for (const ctx of contexts) {
      for (const theme of ctx.themes) {
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      }
    }

    return Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([theme, _]) => theme);
  }
}
