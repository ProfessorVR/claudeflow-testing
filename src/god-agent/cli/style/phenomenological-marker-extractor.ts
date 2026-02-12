/**
 * PhenomenologicalMarkerExtractor - Detects phenomenological discourse patterns
 *
 * Implements MEDIUM #1 from phd-pipeline-improvement-proposal.md:
 * - Detect Heideggerian vocabulary (being-in-the-world, thrownness, etc.)
 * - Identify Aristotelian philosophical terminology
 * - Track Greek term usage patterns
 * - Analyze phenomenological discourse levels
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Heideggerian vocabulary categories
 */
export interface HeideggerianaVocabulary {
  /** Dasein-related terms (being-in-the-world, thrownness, etc.) */
  daseinLanguage: MatchedTerm[];
  /** Temporality markers (ecstatic unity, primordial, etc.) */
  temporalityMarkers: MatchedTerm[];
  /** Disclosure vocabulary (disclosed, revealed, opened up, etc.) */
  disclosureVocabulary: MatchedTerm[];
  /** Mood/Stimmung vocabulary (attunement, Befindlichkeit, etc.) */
  moodVocabulary: MatchedTerm[];
  /** Authenticity markers (eigentlich, uneigentlich, etc.) */
  authenticityMarkers: MatchedTerm[];
  /** Overall confidence in Heideggerian patterns (0-1) */
  confidence: number;
}

/**
 * Aristotelian philosophical vocabulary
 */
export interface AristotelianVocabulary {
  /** Soul/psyche terms */
  psycheTerms: MatchedTerm[];
  /** Perception/sensation terms (aisthēsis, etc.) */
  perceptionTerms: MatchedTerm[];
  /** Imagination/phantasia terms */
  phantasiaTerms: MatchedTerm[];
  /** Emotion/pathos terms */
  pathosTerms: MatchedTerm[];
  /** Memory terms (mnēmē, etc.) */
  memoryTerms: MatchedTerm[];
  /** Movement/kinesis terms */
  movementTerms: MatchedTerm[];
  /** Overall confidence in Aristotelian patterns (0-1) */
  confidence: number;
}

/**
 * Greek term usage patterns
 */
export interface GreekTermPatterns {
  /** How Greek terms are transliterated */
  transliterationStyle: 'italicized' | 'parenthetical' | 'inline' | 'mixed';
  /** Where definitions are placed */
  definitionPlacement: 'first-use' | 'footnote' | 'glossary' | 'inline' | 'mixed';
  /** Frequently used Greek terms with counts */
  frequentTerms: Map<string, number>;
  /** All detected Greek terms with context */
  detectedTerms: GreekTermInstance[];
  /** Overall confidence (0-1) */
  confidence: number;
}

/**
 * A matched term with location and context
 */
export interface MatchedTerm {
  /** The term as found */
  term: string;
  /** Normalized/canonical form */
  canonical: string;
  /** Character position in text */
  position: number;
  /** Surrounding context (50 chars each side) */
  context: string;
  /** How the term is used */
  usageType: 'definition' | 'reference' | 'discussion' | 'quotation';
}

/**
 * A Greek term instance with transliteration info
 */
export interface GreekTermInstance {
  /** Original term as written */
  original: string;
  /** Greek/transliterated form */
  greek: string;
  /** English translation if provided */
  translation?: string;
  /** Position in text */
  position: number;
  /** Whether italicized */
  isItalicized: boolean;
  /** Whether has inline definition */
  hasDefinition: boolean;
}

/**
 * Complete phenomenological marker patterns
 */
export interface PhenomenologicalMarkerPatterns {
  /** Heideggerian vocabulary patterns */
  heideggerian: HeideggerianaVocabulary;
  /** Aristotelian vocabulary patterns */
  aristotelian: AristotelianVocabulary;
  /** Greek term usage patterns */
  greekTerms: GreekTermPatterns;
  /** Phenomenological discourse level markers */
  discourseLevel: {
    /** Ontological vs ontic markers */
    ontologicalMarkers: string[];
    onticMarkers: string[];
    /** Level mixing instances (potential issues) */
    levelMixing: Array<{ position: number; context: string; issue: string }>;
  };
  /** Overall confidence (0-1) */
  overallConfidence: number;
  /** Number of text segments analyzed */
  segmentsAnalyzed: number;
}

// ============================================================================
// Vocabulary Dictionaries
// ============================================================================

/**
 * Heideggerian vocabulary patterns
 */
const HEIDEGGERIAN_PATTERNS = {
  daseinLanguage: [
    /\bbeing[- ]in[- ]the[- ]world\b/gi,
    /\bDasein\b/g,
    /\bthrownness\b/gi,
    /\bGeworfenheit\b/g,
    /\bfacticity\b/gi,
    /\bexistentiell?\b/gi,
    /\bexistential\b/gi,
    /\bbeing[- ]towards[- ]death\b/gi,
    /\bSein[- ]zum[- ]Tode\b/g,
    /\bconcern\b/gi,  // Besorgen
    /\bsolicitude\b/gi,  // Fürsorge
    /\bcaring\b/gi,  // Sorge
    /\bthe anyone\b/gi,  // das Man
    /\bdas Man\b/g,
    /\bfalling\b/gi,  // Verfallenheit
    /\bVerfallenheit\b/g,
  ],
  temporalityMarkers: [
    /\becstatic\s+(?:unity|temporality)\b/gi,
    /\bprimordial\s+(?:time|temporality)\b/gi,
    /\bZeitlichkeit\b/g,
    /\btemporal(?:ity|izing)\b/gi,
    /\becstases?\b/gi,
    /\bfuture[- ]as[- ]coming[- ]towards\b/gi,
    /\bhaving[- ]been\b/gi,
    /\bpresent[- ]at[- ]hand\b/gi,
    /\bready[- ]to[- ]hand\b/gi,
    /\bVorhandenheit\b/g,
    /\bZuhandenheit\b/g,
    /\bmoment\s+of\s+vision\b/gi,
    /\bAugenblick\b/g,
  ],
  disclosureVocabulary: [
    /\bdisclosed\b/gi,
    /\bdisclosure\b/gi,
    /\bErschlossenheit\b/g,
    /\brevealed\b/gi,
    /\bunconcealed\b/gi,
    /\bunconcealment\b/gi,
    /\baletheia\b/gi,
    /\bopened\s+up\b/gi,
    /\blighting\b/gi,
    /\bLichtung\b/g,
    /\bclearing\b/gi,
    /\bworld[- ]disclosure\b/gi,
  ],
  moodVocabulary: [
    /\battunement\b/gi,
    /\bStimmung\b/g,
    /\bBefindlichkeit\b/g,
    /\bstate[- ]of[- ]mind\b/gi,
    /\bfindingness\b/gi,
    /\banxiety\b/gi,  // Angst
    /\bAngst\b/g,
    /\bboredom\b/gi,
    /\bLangeweile\b/g,
    /\bfear\s+(?:as\s+)?mood\b/gi,
    /\bFurcht\b/g,
    /\baffective\s+disclosure\b/gi,
  ],
  authenticityMarkers: [
    /\bauthentic(?:ity|ally)?\b/gi,
    /\beigentlich\b/g,
    /\binauthentic(?:ity|ally)?\b/gi,
    /\buneigentlich\b/g,
    /\bownmost\b/gi,
    /\bresoluteness\b/gi,
    /\bEntschlossenheit\b/g,
    /\bcall\s+of\s+conscience\b/gi,
    /\bGewissen\b/g,
  ],
};

/**
 * Aristotelian vocabulary patterns
 */
const ARISTOTELIAN_PATTERNS = {
  psycheTerms: [
    /\bpsych[eē]\b/gi,
    /\bψυχή\b/g,
    /\bsoul\b/gi,
    /\bform\s+of\s+the\s+body\b/gi,
    /\bfirst\s+actuality\b/gi,
    /\bentelecheia\b/gi,
    /\bἐντελέχεια\b/g,
  ],
  perceptionTerms: [
    /\baisth[eē]sis\b/gi,
    /\bαἴσθησις\b/g,
    /\bsensation\b/gi,
    /\bperception\b/gi,
    /\bsense[- ]?perception\b/gi,
    /\bsensible(?:s)?\b/gi,
    /\baisth[eē]t(?:a|on)\b/gi,
    /\bcommon\s+sense\b/gi,
    /\bkoin[eē]\s+aisth[eē]sis\b/gi,
    /\bproper\s+sensibles?\b/gi,
  ],
  phantasiaTerms: [
    /\bphantasia\b/gi,
    /\bφαντασία\b/g,
    /\bimagination\b/gi,
    /\bphantasma(?:ta)?\b/gi,
    /\bφάντασμα(?:τα)?\b/g,
    /\bmental\s+image\b/gi,
    /\bappearance\b/gi,
    /\bphainetai\b/gi,
    /\bφαίνεται\b/g,
  ],
  pathosTerms: [
    /\bpathos\b/gi,
    /\bpath[eē]\b/gi,
    /\bπάθος\b/g,
    /\bemotion\b/gi,
    /\bpassion\b/gi,
    /\baffection\b/gi,
    /\bundergoing\b/gi,
    /\borexis\b/gi,
    /\bὄρεξις\b/g,
    /\bdesire\b/gi,
    /\bappetite\b/gi,
    /\bepithumia\b/gi,
    /\bἐπιθυμία\b/g,
    /\bthumos\b/gi,
    /\bθυμός\b/g,
  ],
  memoryTerms: [
    /\bmn[eē]m[eē]\b/gi,
    /\bμνήμη\b/g,
    /\bmemory\b/gi,
    /\brecollection\b/gi,
    /\banamnesis\b/gi,
    /\bἀνάμνησις\b/g,
    /\beik[oō]n\b/gi,
    /\bεἰκών\b/g,
    /\blikeness\b/gi,
  ],
  movementTerms: [
    /\bkin[eē]sis\b/gi,
    /\bκίνησις\b/g,
    /\bmovement\b/gi,
    /\bmotion\b/gi,
    /\bchange\b/gi,
    /\bmetabol[eē]\b/gi,
    /\bactuality\b/gi,
    /\benergeia\b/gi,
    /\bἐνέργεια\b/g,
    /\bpotentiality\b/gi,
    /\bdunamis\b/gi,
    /\bδύναμις\b/g,
  ],
};

/**
 * Greek term detection patterns
 */
const GREEK_TERM_PATTERNS = [
  // Transliterated Greek with various spellings
  /\b(?:phantasia|phantasma|aisth[eē]sis|mn[eē]m[eē]|psych[eē]|pathos|path[eē]|kin[eē]sis|nous|logos|eidos|hyl[eē]|morph[eē]|orexis|epithumia|thumos|dunamis|energeia|entelecheia|eik[oō]n|phainomenon|aletheia)\b/gi,
  // Italicized terms (markdown)
  /\*([a-z]+[eē]?[a-z]*)\*/gi,
  // Greek script
  /[\u0370-\u03FF\u1F00-\u1FFF]+/g,
  // Parenthetical translations
  /\((?:Greek|Gk\.?):\s*([^)]+)\)/gi,
];

/**
 * Ontological vs ontic discourse markers
 */
const DISCOURSE_LEVEL_PATTERNS = {
  ontological: [
    /\bontological(?:ly)?\b/gi,
    /\bexistential(?:ly)?\b/gi,
    /\bstructure\s+of\s+being\b/gi,
    /\bcondition\s+of\s+(?:the\s+)?possibility\b/gi,
    /\ba\s+priori\b/gi,
    /\btranscendental\b/gi,
    /\bfundamental\s+ontology\b/gi,
    /\bBeing\s+(?:itself|as\s+such)\b/g,  // capital B
  ],
  ontic: [
    /\bontic(?:ally)?\b/gi,
    /\bpsychological(?:ly)?\b/gi,
    /\bempirical(?:ly)?\b/gi,
    /\bfactual(?:ly)?\b/gi,
    /\bparticular\s+being\b/gi,
    /\bentities\b/gi,
    /\bbeings\b/gi,  // lowercase b
  ],
};

// ============================================================================
// PhenomenologicalMarkerExtractor Class
// ============================================================================

export class PhenomenologicalMarkerExtractor {
  /**
   * Extract phenomenological markers from text
   */
  extractFromText(text: string): PhenomenologicalMarkerPatterns {
    const heideggerian = this.extractHeideggerian(text);
    const aristotelian = this.extractAristotelian(text);
    const greekTerms = this.extractGreekTermPatterns(text);
    const discourseLevel = this.analyzeDiscourseLevel(text);

    // Calculate overall confidence
    const overallConfidence = this.calculateOverallConfidence(
      heideggerian,
      aristotelian,
      greekTerms
    );

    return {
      heideggerian,
      aristotelian,
      greekTerms,
      discourseLevel,
      overallConfidence,
      segmentsAnalyzed: 1,
    };
  }

  /**
   * Extract Heideggerian vocabulary patterns
   */
  private extractHeideggerian(text: string): HeideggerianaVocabulary {
    const daseinLanguage = this.findTerms(text, HEIDEGGERIAN_PATTERNS.daseinLanguage, 'dasein');
    const temporalityMarkers = this.findTerms(text, HEIDEGGERIAN_PATTERNS.temporalityMarkers, 'temporality');
    const disclosureVocabulary = this.findTerms(text, HEIDEGGERIAN_PATTERNS.disclosureVocabulary, 'disclosure');
    const moodVocabulary = this.findTerms(text, HEIDEGGERIAN_PATTERNS.moodVocabulary, 'mood');
    const authenticityMarkers = this.findTerms(text, HEIDEGGERIAN_PATTERNS.authenticityMarkers, 'authenticity');

    const totalTerms = daseinLanguage.length + temporalityMarkers.length +
      disclosureVocabulary.length + moodVocabulary.length + authenticityMarkers.length;

    // Confidence based on variety and density
    const varietyScore = [
      daseinLanguage.length > 0 ? 1 : 0,
      temporalityMarkers.length > 0 ? 1 : 0,
      disclosureVocabulary.length > 0 ? 1 : 0,
      moodVocabulary.length > 0 ? 1 : 0,
      authenticityMarkers.length > 0 ? 1 : 0,
    ].reduce((a, b) => a + b, 0) / 5;

    const densityScore = Math.min(1, totalTerms / 20);
    const confidence = (varietyScore * 0.6 + densityScore * 0.4);

    return {
      daseinLanguage,
      temporalityMarkers,
      disclosureVocabulary,
      moodVocabulary,
      authenticityMarkers,
      confidence,
    };
  }

  /**
   * Extract Aristotelian vocabulary patterns
   */
  private extractAristotelian(text: string): AristotelianVocabulary {
    const psycheTerms = this.findTerms(text, ARISTOTELIAN_PATTERNS.psycheTerms, 'psyche');
    const perceptionTerms = this.findTerms(text, ARISTOTELIAN_PATTERNS.perceptionTerms, 'perception');
    const phantasiaTerms = this.findTerms(text, ARISTOTELIAN_PATTERNS.phantasiaTerms, 'phantasia');
    const pathosTerms = this.findTerms(text, ARISTOTELIAN_PATTERNS.pathosTerms, 'pathos');
    const memoryTerms = this.findTerms(text, ARISTOTELIAN_PATTERNS.memoryTerms, 'memory');
    const movementTerms = this.findTerms(text, ARISTOTELIAN_PATTERNS.movementTerms, 'movement');

    const totalTerms = psycheTerms.length + perceptionTerms.length +
      phantasiaTerms.length + pathosTerms.length + memoryTerms.length + movementTerms.length;

    // Confidence based on variety and density
    const varietyScore = [
      psycheTerms.length > 0 ? 1 : 0,
      perceptionTerms.length > 0 ? 1 : 0,
      phantasiaTerms.length > 0 ? 1 : 0,
      pathosTerms.length > 0 ? 1 : 0,
      memoryTerms.length > 0 ? 1 : 0,
      movementTerms.length > 0 ? 1 : 0,
    ].reduce((a, b) => a + b, 0) / 6;

    const densityScore = Math.min(1, totalTerms / 25);
    const confidence = (varietyScore * 0.6 + densityScore * 0.4);

    return {
      psycheTerms,
      perceptionTerms,
      phantasiaTerms,
      pathosTerms,
      memoryTerms,
      movementTerms,
      confidence,
    };
  }

  /**
   * Extract Greek term usage patterns
   */
  private extractGreekTermPatterns(text: string): GreekTermPatterns {
    const detectedTerms: GreekTermInstance[] = [];
    const frequentTerms = new Map<string, number>();

    // Find all Greek/transliterated terms
    for (const pattern of GREEK_TERM_PATTERNS) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        const term = match[1] || match[0];
        const normalized = term.toLowerCase().replace(/[ēē]/g, 'e').replace(/[ōō]/g, 'o');

        // Count frequency
        frequentTerms.set(normalized, (frequentTerms.get(normalized) || 0) + 1);

        // Check context for definition
        const position = match.index || 0;
        const contextStart = Math.max(0, position - 50);
        const contextEnd = Math.min(text.length, position + term.length + 100);
        const context = text.substring(contextStart, contextEnd);

        const hasDefinition = /(?:means|refers to|is defined as|denotes|i\.e\.|that is)/i.test(context);
        const isItalicized = text.substring(position - 1, position) === '*' ||
                            /[a-z]/.test(term) && !/[A-Z]/.test(term);

        detectedTerms.push({
          original: match[0],
          greek: term,
          translation: this.extractTranslation(context, term),
          position,
          isItalicized,
          hasDefinition,
        });
      }
    }

    // Determine transliteration style
    const italicizedCount = detectedTerms.filter(t => t.isItalicized).length;
    const totalCount = detectedTerms.length;
    let transliterationStyle: GreekTermPatterns['transliterationStyle'] = 'mixed';
    if (totalCount > 0) {
      const italicRatio = italicizedCount / totalCount;
      if (italicRatio > 0.8) transliterationStyle = 'italicized';
      else if (italicRatio < 0.2) transliterationStyle = 'inline';
    }

    // Determine definition placement
    const withDef = detectedTerms.filter(t => t.hasDefinition).length;
    let definitionPlacement: GreekTermPatterns['definitionPlacement'] = 'mixed';
    if (totalCount > 0) {
      const defRatio = withDef / totalCount;
      if (defRatio > 0.6) definitionPlacement = 'inline';
      else if (defRatio < 0.2) definitionPlacement = 'first-use';
    }

    const confidence = Math.min(1, totalCount / 15);

    return {
      transliterationStyle,
      definitionPlacement,
      frequentTerms,
      detectedTerms,
      confidence,
    };
  }

  /**
   * Analyze discourse level (ontological vs ontic)
   */
  private analyzeDiscourseLevel(text: string): PhenomenologicalMarkerPatterns['discourseLevel'] {
    const ontologicalMarkers: string[] = [];
    const onticMarkers: string[] = [];
    const levelMixing: Array<{ position: number; context: string; issue: string }> = [];

    // Find ontological markers
    for (const pattern of DISCOURSE_LEVEL_PATTERNS.ontological) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        if (!ontologicalMarkers.includes(match[0].toLowerCase())) {
          ontologicalMarkers.push(match[0].toLowerCase());
        }
      }
    }

    // Find ontic markers
    for (const pattern of DISCOURSE_LEVEL_PATTERNS.ontic) {
      const matches = Array.from(text.matchAll(pattern));
      for (const match of matches) {
        if (!onticMarkers.includes(match[0].toLowerCase())) {
          onticMarkers.push(match[0].toLowerCase());
        }
      }
    }

    // Detect potential level mixing (both types in same paragraph)
    const paragraphs = text.split(/\n\n+/);
    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      const hasOntological = DISCOURSE_LEVEL_PATTERNS.ontological.some(p => p.test(para));
      const hasOntic = DISCOURSE_LEVEL_PATTERNS.ontic.some(p => p.test(para));

      if (hasOntological && hasOntic) {
        // Potential level mixing - may be intentional bridge or error
        const position = text.indexOf(para);
        levelMixing.push({
          position,
          context: para.substring(0, 150),
          issue: 'Paragraph contains both ontological and ontic discourse markers - verify intentional bridging',
        });
      }
    }

    return {
      ontologicalMarkers,
      onticMarkers,
      levelMixing,
    };
  }

  /**
   * Find terms matching patterns
   */
  private findTerms(
    text: string,
    patterns: RegExp[],
    category: string
  ): MatchedTerm[] {
    const terms: MatchedTerm[] = [];
    const seen = new Set<string>();

    for (const pattern of patterns) {
      // Reset pattern state
      pattern.lastIndex = 0;
      const matches = Array.from(text.matchAll(pattern));

      for (const match of matches) {
        const term = match[0];
        const position = match.index || 0;
        const key = `${term.toLowerCase()}-${position}`;

        if (seen.has(key)) continue;
        seen.add(key);

        const contextStart = Math.max(0, position - 50);
        const contextEnd = Math.min(text.length, position + term.length + 50);
        const context = text.substring(contextStart, contextEnd);

        terms.push({
          term,
          canonical: this.canonicalize(term, category),
          position,
          context,
          usageType: this.determineUsageType(context, term),
        });
      }
    }

    return terms;
  }

  /**
   * Canonicalize a term
   */
  private canonicalize(term: string, category: string): string {
    const lower = term.toLowerCase()
      .replace(/[ēē]/g, 'e')
      .replace(/[ōō]/g, 'o')
      .replace(/[- ]/g, '-');
    return lower;
  }

  /**
   * Determine how a term is being used
   */
  private determineUsageType(context: string, term: string): MatchedTerm['usageType'] {
    if (/["'""]/.test(context) && context.indexOf(term) > context.indexOf('"')) {
      return 'quotation';
    }
    if (/(?:means|is defined as|refers to|i\.e\.|denotes)/i.test(context)) {
      return 'definition';
    }
    if (/(?:according to|argues|claims|holds)/i.test(context)) {
      return 'discussion';
    }
    return 'reference';
  }

  /**
   * Extract translation from context
   */
  private extractTranslation(context: string, term: string): string | undefined {
    // Look for patterns like "phantasia (imagination)" or "imagination, phantasia"
    const patterns = [
      new RegExp(`${term}\\s*\\(([^)]+)\\)`, 'i'),
      new RegExp(`([^,]+),\\s*${term}`, 'i'),
      new RegExp(`${term}\\s*(?:means|i\\.e\\.|that is)\\s+["']?([^"',]+)`, 'i'),
    ];

    for (const pattern of patterns) {
      const match = context.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return undefined;
  }

  /**
   * Calculate overall confidence
   */
  private calculateOverallConfidence(
    heideggerian: HeideggerianaVocabulary,
    aristotelian: AristotelianVocabulary,
    greekTerms: GreekTermPatterns
  ): number {
    return (
      heideggerian.confidence * 0.35 +
      aristotelian.confidence * 0.35 +
      greekTerms.confidence * 0.30
    );
  }

  /**
   * Merge multiple pattern analyses
   */
  mergePatterns(patterns: PhenomenologicalMarkerPatterns[]): PhenomenologicalMarkerPatterns {
    if (patterns.length === 0) {
      return this.extractFromText('');
    }
    if (patterns.length === 1) {
      return patterns[0];
    }

    // Merge Heideggerian
    const mergedHeideggerian: HeideggerianaVocabulary = {
      daseinLanguage: this.mergeTerms(patterns.map(p => p.heideggerian.daseinLanguage)),
      temporalityMarkers: this.mergeTerms(patterns.map(p => p.heideggerian.temporalityMarkers)),
      disclosureVocabulary: this.mergeTerms(patterns.map(p => p.heideggerian.disclosureVocabulary)),
      moodVocabulary: this.mergeTerms(patterns.map(p => p.heideggerian.moodVocabulary)),
      authenticityMarkers: this.mergeTerms(patterns.map(p => p.heideggerian.authenticityMarkers)),
      confidence: this.average(patterns.map(p => p.heideggerian.confidence)),
    };

    // Merge Aristotelian
    const mergedAristotelian: AristotelianVocabulary = {
      psycheTerms: this.mergeTerms(patterns.map(p => p.aristotelian.psycheTerms)),
      perceptionTerms: this.mergeTerms(patterns.map(p => p.aristotelian.perceptionTerms)),
      phantasiaTerms: this.mergeTerms(patterns.map(p => p.aristotelian.phantasiaTerms)),
      pathosTerms: this.mergeTerms(patterns.map(p => p.aristotelian.pathosTerms)),
      memoryTerms: this.mergeTerms(patterns.map(p => p.aristotelian.memoryTerms)),
      movementTerms: this.mergeTerms(patterns.map(p => p.aristotelian.movementTerms)),
      confidence: this.average(patterns.map(p => p.aristotelian.confidence)),
    };

    // Merge Greek terms
    const mergedFrequentTerms = new Map<string, number>();
    for (const p of patterns) {
      for (const [term, count] of Array.from(p.greekTerms.frequentTerms.entries())) {
        mergedFrequentTerms.set(term, (mergedFrequentTerms.get(term) || 0) + count);
      }
    }

    const mergedGreekTerms: GreekTermPatterns = {
      transliterationStyle: patterns[0].greekTerms.transliterationStyle,
      definitionPlacement: patterns[0].greekTerms.definitionPlacement,
      frequentTerms: mergedFrequentTerms,
      detectedTerms: patterns.flatMap(p => p.greekTerms.detectedTerms),
      confidence: this.average(patterns.map(p => p.greekTerms.confidence)),
    };

    // Merge discourse level
    const mergedDiscourseLevel = {
      ontologicalMarkers: Array.from(new Set(patterns.flatMap(p => p.discourseLevel.ontologicalMarkers))),
      onticMarkers: Array.from(new Set(patterns.flatMap(p => p.discourseLevel.onticMarkers))),
      levelMixing: patterns.flatMap(p => p.discourseLevel.levelMixing),
    };

    return {
      heideggerian: mergedHeideggerian,
      aristotelian: mergedAristotelian,
      greekTerms: mergedGreekTerms,
      discourseLevel: mergedDiscourseLevel,
      overallConfidence: this.average(patterns.map(p => p.overallConfidence)),
      segmentsAnalyzed: patterns.reduce((sum, p) => sum + p.segmentsAnalyzed, 0),
    };
  }

  /**
   * Generate prompt section for style injection
   */
  generatePromptSection(patterns: PhenomenologicalMarkerPatterns): string {
    const parts: string[] = [];

    parts.push('### Phenomenological Discourse Conventions');
    parts.push('');

    // Heideggerian vocabulary
    if (patterns.heideggerian.confidence > 0.2) {
      parts.push('**Heideggerian Vocabulary:**');
      if (patterns.heideggerian.daseinLanguage.length > 0) {
        const terms = Array.from(new Set(patterns.heideggerian.daseinLanguage.map(t => t.canonical))).slice(0, 5);
        parts.push(`- Dasein terms: ${terms.join(', ')}`);
      }
      if (patterns.heideggerian.moodVocabulary.length > 0) {
        const terms = Array.from(new Set(patterns.heideggerian.moodVocabulary.map(t => t.canonical))).slice(0, 5);
        parts.push(`- Mood/Stimmung terms: ${terms.join(', ')}`);
      }
      if (patterns.heideggerian.temporalityMarkers.length > 0) {
        const terms = Array.from(new Set(patterns.heideggerian.temporalityMarkers.map(t => t.canonical))).slice(0, 5);
        parts.push(`- Temporality terms: ${terms.join(', ')}`);
      }
      parts.push('');
    }

    // Aristotelian vocabulary
    if (patterns.aristotelian.confidence > 0.2) {
      parts.push('**Aristotelian Vocabulary:**');
      if (patterns.aristotelian.phantasiaTerms.length > 0) {
        const terms = Array.from(new Set(patterns.aristotelian.phantasiaTerms.map(t => t.canonical))).slice(0, 5);
        parts.push(`- Phantasia terms: ${terms.join(', ')}`);
      }
      if (patterns.aristotelian.pathosTerms.length > 0) {
        const terms = Array.from(new Set(patterns.aristotelian.pathosTerms.map(t => t.canonical))).slice(0, 5);
        parts.push(`- Pathos/emotion terms: ${terms.join(', ')}`);
      }
      if (patterns.aristotelian.perceptionTerms.length > 0) {
        const terms = Array.from(new Set(patterns.aristotelian.perceptionTerms.map(t => t.canonical))).slice(0, 5);
        parts.push(`- Perception terms: ${terms.join(', ')}`);
      }
      parts.push('');
    }

    // Greek term conventions
    if (patterns.greekTerms.confidence > 0.2) {
      parts.push('**Greek Term Conventions:**');
      parts.push(`- Transliteration style: ${patterns.greekTerms.transliterationStyle}`);
      parts.push(`- Definition placement: ${patterns.greekTerms.definitionPlacement}`);

      const topTerms = Array.from(patterns.greekTerms.frequentTerms.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
      if (topTerms.length > 0) {
        parts.push(`- Frequent terms: ${topTerms.map(([t, c]) => `*${t}* (${c}x)`).join(', ')}`);
      }
      parts.push('');
    }

    // Discourse level guidance
    if (patterns.discourseLevel.ontologicalMarkers.length > 0 ||
        patterns.discourseLevel.onticMarkers.length > 0) {
      parts.push('**Discourse Level Guidance:**');
      parts.push('- Distinguish clearly between ontological (existential structures) and ontic (empirical psychological) claims');
      parts.push('- When bridging levels, make the transition explicit');
      parts.push('');
    }

    return parts.join('\n');
  }

  // Helper methods

  private mergeTerms(termArrays: MatchedTerm[][]): MatchedTerm[] {
    const all = termArrays.flat();
    const unique = new Map<string, MatchedTerm>();
    for (const term of all) {
      if (!unique.has(term.canonical)) {
        unique.set(term.canonical, term);
      }
    }
    return Array.from(unique.values());
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}
