/**
 * PhilosophicalConceptTracker - Cross-section concept awareness
 *
 * Phase 2 Enhancement #3:
 * - Tracks major philosophical concepts across dissertation sections
 * - Monitors concept introduction, development, and synthesis
 * - Validates concept usage has adequate groundwork
 * - Maps inter-concept relationships
 * - Supports multiple philosophical traditions (continental, analytic, classical)
 *
 * Target: 85%+ concept detection accuracy, <5 false positives per chapter
 */

// ============================================================================
// Types
// ============================================================================

export interface ConceptLocation {
  chapterId: number;
  paragraphIndex: number;
  sentenceIndex?: number;
  position: number;
}

export interface ConceptDefinition {
  text: string;
  location: ConceptLocation;
  definitionType: 'formal' | 'stipulative' | 'operational' | 'ostensive';
  isAuthorDefinition: boolean;
}

export interface ConceptUsage {
  location: ConceptLocation;
  usageType: 'definition' | 'application' | 'analysis' | 'synthesis' | 'reference';
  context: string;
}

export interface PhilosophicalConcept {
  name: string;
  normalizedName: string; // Lowercase, canonical form
  tradition: 'continental' | 'analytic' | 'pragmatist' | 'classical' | 'unknown';

  // Lifecycle tracking
  firstIntroduced: ConceptLocation;
  definitions: ConceptDefinition[];
  usages: ConceptUsage[];

  // Relationships
  relatedConcepts: string[];
  synthesizedFrom: string[]; // For compound concepts
  synthesizesInto: string[]; // Concepts built from this one

  // Metadata
  isKeyTerm: boolean;
  isTechnicalTerm: boolean;
  isOriginalContribution: boolean;
}

export interface GroundworkCheck {
  hasAdequateGroundwork: boolean;
  missingElements: string[];
  recommendations: string[];
  severity: 'critical' | 'major' | 'minor' | 'none';
}

export interface SynthesisValidation {
  isValid: boolean;
  missingConcepts: string[];
  establishedConcepts: string[];
  recommendations: string[];
}

export interface ConceptMilestone {
  type: 'introduction' | 'definition' | 'elaboration' | 'synthesis' | 'application';
  location: ConceptLocation;
  description: string;
}

export interface ConceptTimeline {
  concept: string;
  milestones: ConceptMilestone[];
  developmentPattern: 'progressive' | 'circular' | 'scattered' | 'coherent';
}

export interface ConsistencyCheck {
  isConsistent: boolean;
  contradictions: Array<{ def1: ConceptDefinition; def2: ConceptDefinition }>;
  recommendation: string;
}

export interface ConceptTrackerConfig {
  enableConceptGraph: boolean;
  minConceptMentions: number; // Threshold for "key term"
  trackSynthesis: boolean;
  traditions: ('continental' | 'analytic' | 'pragmatist' | 'classical')[];
}

// ============================================================================
// Pattern Constants
// ============================================================================

/**
 * Continental philosophy patterns (Heideggerian, phenomenological)
 */
const CONTINENTAL_CONCEPT_PATTERNS = [
  // Heideggerian terms
  /\b(Dasein|Sein|Seiendes|Zuhandenheit|Vorhandenheit)\b/,
  /\b(Befindlichkeit|Stimmung|Sorge|Angst)\b/,
  /\b(Geworfenheit|Entwurf|Lichtung)\b/,

  // Phenomenological terms
  /\b(phenomenon|phenomenology|intentionality)\b/i,
  /\b(lived\s+experience|life-world|horizon)\b/i,
  /\b(bracketing|epoché|reduction)\b/i,
  /\b(embodiment|being-in-the-world)\b/i,

  // French theory
  /\b(différance|trace|supplement|simulacrum)\b/i,
];

/**
 * Analytic philosophy patterns
 */
const ANALYTIC_CONCEPT_PATTERNS = [
  // Logical/semantic terms
  /\b(reference|sense|denotation|connotation)\b/i,
  /\b(truth-condition|satisfaction-condition)\b/i,
  /\b(proposition|predicate|quantifier)\b/i,

  // Philosophy of mind
  /\b(qualia|intentionality|supervenience)\b/i,
  /\b(functionalism|identity-theory)\b/i,
  /\b(mental\s+state|propositional\s+attitude)\b/i,
];

/**
 * Classical philosophy patterns (Greek/Latin)
 */
const CLASSICAL_CONCEPT_PATTERNS = [
  // Greek terms (transliterated)
  /\b(phantasia|aisth[ēe]sis|nous|psych[ēe])\b/i,
  /\b(eidos|ousia|energ[ei]a|dynamis)\b/i,
  /\b(arche|telos|physis|techne|episteme|doxa)\b/i,
  /\b(h[ēe]don[ēe]|eudaimonia|aret[ēe]|phronesis|sophia)\b/i,

  // Latin terms
  /\b(a\s+priori|a\s+posteriori|per\s+se|qua)\b/i,
  /\b(sui\s+generis|prima\s+facie|res\s+cogitans)\b/i,
];

/**
 * Pragmatist philosophy patterns
 */
const PRAGMATIST_CONCEPT_PATTERNS = [
  /\b(experience|inquiry|habit|belief)\b/i,
  /\b(practical\s+consequence|pragmatic\s+maxim)\b/i,
  /\b(instrumentalism|pragmatism)\b/i,
];

/**
 * Definition detection patterns
 */
const DEFINITION_PATTERNS = [
  // Formal definitions
  { pattern: /\b(is\s+defined\s+as)\b/i, type: 'formal' as const },
  { pattern: /\b(means?|refers?\s+to)\b/i, type: 'formal' as const },

  // Stipulative definitions (author's own)
  { pattern: /\b(i\s+(define|term|call|designate)\s+([""']?\w+[""']?)\s+as)\b/i, type: 'stipulative' as const },
  { pattern: /\b(by\s+([""']?\w+[""']?),?\s+i\s+mean)\b/i, type: 'stipulative' as const },

  // Operational definitions
  { pattern: /\b(can\s+be\s+understood\s+as)\b/i, type: 'operational' as const },
  { pattern: /\b(operates\s+as|functions\s+as)\b/i, type: 'operational' as const },

  // Ostensive definitions
  { pattern: /\b(for\s+example|such\s+as|like)\b/i, type: 'ostensive' as const },
];

/**
 * Synthesis detection patterns (compound concepts)
 */
const SYNTHESIS_PATTERNS = [
  // Hyphenated compound concepts
  /\b([a-z]+(?:-[a-z]+){1,3})\b/i,

  // Explicit synthesis markers
  /\b(co-constitution|inter-relation|mutual-implication)\b/i,
  /\b(brings?\s+together|synthesizes?|integrates?|combines?)\b/i,
  /\b(the\s+(\w+)-(\w+)\s+relationship)\b/i,
];

// ============================================================================
// PhilosophicalConceptTracker Class
// ============================================================================

/**
 * Tracks philosophical concepts across dissertation for coherence validation
 */
export class PhilosophicalConceptTracker {
  private concepts: Map<string, PhilosophicalConcept> = new Map();
  private config: ConceptTrackerConfig;
  private chapterTexts: Map<number, string> = new Map();

  constructor(config?: Partial<ConceptTrackerConfig>) {
    this.config = {
      enableConceptGraph: true,
      minConceptMentions: 3,
      trackSynthesis: true,
      traditions: ['continental', 'analytic', 'classical', 'pragmatist'],
      ...config,
    };
  }

  /**
   * Extract concepts from chapter text
   * Call this for each chapter to build the concept database
   */
  extractConcepts(chapterText: string, chapterId: number): PhilosophicalConcept[] {
    // Store chapter text for later reference
    this.chapterTexts.set(chapterId, chapterText);

    const extractedConcepts: PhilosophicalConcept[] = [];
    const paragraphs = this.extractParagraphs(chapterText);

    for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
      const paragraph = paragraphs[pIndex];

      // Extract concepts by tradition
      const concepts = this.extractConceptsFromParagraph(
        paragraph,
        pIndex,
        chapterId
      );

      for (const concept of concepts) {
        const normalized = concept.normalizedName;

        if (this.concepts.has(normalized)) {
          // Update existing concept
          const existing = this.concepts.get(normalized)!;
          existing.usages.push({
            location: concept.firstIntroduced,
            usageType: 'reference',
            context: paragraph.substring(0, 200),
          });
        } else {
          // Add new concept
          this.concepts.set(normalized, concept);
          extractedConcepts.push(concept);
        }
      }
    }

    // Extract definitions
    this.extractDefinitions(chapterText, chapterId);

    // Track synthesis patterns if enabled
    if (this.config.trackSynthesis) {
      this.extractSynthesis(chapterText, chapterId);
    }

    return extractedConcepts;
  }

  /**
   * Extract concepts from a single paragraph
   */
  private extractConceptsFromParagraph(
    paragraph: string,
    paragraphIndex: number,
    chapterId: number
  ): PhilosophicalConcept[] {
    const concepts: PhilosophicalConcept[] = [];
    const position = 0; // Simplified - could track exact position

    // Check each tradition's patterns
    for (const tradition of this.config.traditions) {
      const patterns = this.getPatternsByTradition(tradition);

      for (const pattern of patterns) {
        const matches = paragraph.matchAll(new RegExp(pattern.source, 'gi'));

        for (const match of matches) {
          const name = match[0];
          const normalized = name.toLowerCase().trim();

          // Check if already extracted in this pass
          if (concepts.some(c => c.normalizedName === normalized)) {
            continue;
          }

          concepts.push({
            name,
            normalizedName: normalized,
            tradition,
            firstIntroduced: { chapterId, paragraphIndex, position },
            definitions: [],
            usages: [],
            relatedConcepts: [],
            synthesizedFrom: [],
            synthesizesInto: [],
            isKeyTerm: false,
            isTechnicalTerm: true,
            isOriginalContribution: false,
          });
        }
      }
    }

    // Extract general technical terms (hyphenated, quoted)
    const technicalTerms = this.extractTechnicalTerms(paragraph, paragraphIndex, chapterId);
    concepts.push(...technicalTerms);

    return concepts;
  }

  /**
   * Get patterns by philosophical tradition
   */
  private getPatternsByTradition(
    tradition: 'continental' | 'analytic' | 'pragmatist' | 'classical'
  ): RegExp[] {
    switch (tradition) {
      case 'continental':
        return CONTINENTAL_CONCEPT_PATTERNS;
      case 'analytic':
        return ANALYTIC_CONCEPT_PATTERNS;
      case 'classical':
        return CLASSICAL_CONCEPT_PATTERNS;
      case 'pragmatist':
        return PRAGMATIST_CONCEPT_PATTERNS;
      default:
        return [];
    }
  }

  /**
   * Extract technical terms (hyphenated, compound, quoted)
   */
  private extractTechnicalTerms(
    paragraph: string,
    paragraphIndex: number,
    chapterId: number
  ): PhilosophicalConcept[] {
    const terms: PhilosophicalConcept[] = [];

    // Hyphenated terms
    const hyphenatedMatches = paragraph.matchAll(/\b([a-z]+-[a-z]+(?:-[a-z]+)?)\b/gi);
    for (const match of hyphenatedMatches) {
      const name = match[1];
      const normalized = name.toLowerCase().trim();

      terms.push({
        name,
        normalizedName: normalized,
        tradition: 'unknown',
        firstIntroduced: { chapterId, paragraphIndex, position: match.index || 0 },
        definitions: [],
        usages: [],
        relatedConcepts: [],
        synthesizedFrom: [],
        synthesizesInto: [],
        isKeyTerm: false,
        isTechnicalTerm: true,
        isOriginalContribution: false,
      });
    }

    // Terms in scare quotes (but not standard quotes around sentences)
    const quotedMatches = paragraph.matchAll(/["']([^"']{1,30})["']/g);
    for (const match of quotedMatches) {
      const name = match[1];

      // Skip if it looks like a sentence
      if (/^[A-Z].*[.!?]$/.test(name)) continue;

      const normalized = name.toLowerCase().trim();

      terms.push({
        name,
        normalizedName: normalized,
        tradition: 'unknown',
        firstIntroduced: { chapterId, paragraphIndex, position: match.index || 0 },
        definitions: [],
        usages: [],
        relatedConcepts: [],
        synthesizedFrom: [],
        synthesizesInto: [],
        isKeyTerm: false,
        isTechnicalTerm: true,
        isOriginalContribution: false,
      });
    }

    return terms;
  }

  /**
   * Extract definitions from chapter text
   */
  private extractDefinitions(chapterText: string, chapterId: number): void {
    const paragraphs = this.extractParagraphs(chapterText);

    for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
      const paragraph = paragraphs[pIndex];

      for (const { pattern, type } of DEFINITION_PATTERNS) {
        const matches = paragraph.matchAll(new RegExp(pattern.source, 'gi'));

        for (const match of matches) {
          // Extract the term being defined
          const context = paragraph.substring(
            Math.max(0, (match.index || 0) - 50),
            Math.min(paragraph.length, (match.index || 0) + match[0].length + 100)
          );

          // Try to find the concept being defined
          const termMatch = context.match(/["']([^"']+)["']|^([A-Za-z-]+)\s+(?:is|means?)/);
          if (termMatch) {
            const term = (termMatch[1] || termMatch[2]).toLowerCase().trim();

            if (this.concepts.has(term)) {
              const concept = this.concepts.get(term)!;
              concept.definitions.push({
                text: context,
                location: { chapterId, paragraphIndex: pIndex, position: match.index || 0 },
                definitionType: type,
                isAuthorDefinition: /\b(i\s+(define|term|call))\b/i.test(context),
              });

              if (/\b(i\s+(define|term|call))\b/i.test(context)) {
                concept.isOriginalContribution = true;
              }
            }
          }
        }
      }
    }
  }

  /**
   * Extract synthesis patterns (compound concepts)
   */
  private extractSynthesis(chapterText: string, chapterId: number): void {
    const paragraphs = this.extractParagraphs(chapterText);

    for (let pIndex = 0; pIndex < paragraphs.length; pIndex++) {
      const paragraph = paragraphs[pIndex];

      for (const pattern of SYNTHESIS_PATTERNS) {
        const matches = paragraph.matchAll(new RegExp(pattern.source, 'gi'));

        for (const match of matches) {
          const synthesizedTerm = match[0].toLowerCase().trim();

          // Try to identify constituent concepts
          const constituents = synthesizedTerm.split(/[-\s]+/);

          if (constituents.length >= 2) {
            // Check if constituents are tracked concepts
            const establishedConstituents = constituents.filter(c =>
              this.concepts.has(c.toLowerCase())
            );

            if (establishedConstituents.length >= 1) {
              // Track synthesis relationship
              if (this.concepts.has(synthesizedTerm)) {
                const concept = this.concepts.get(synthesizedTerm)!;
                concept.synthesizedFrom = constituents.map(c => c.toLowerCase());
              }

              // Update constituent concepts
              for (const constituent of establishedConstituents) {
                const concept = this.concepts.get(constituent.toLowerCase());
                if (concept) {
                  if (!concept.synthesizesInto.includes(synthesizedTerm)) {
                    concept.synthesizesInto.push(synthesizedTerm);
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  /**
   * Track concept usage across chapters
   */
  trackConceptUsage(
    concept: string,
    chapterId: number,
    paragraphIndex: number,
    context: string
  ): void {
    const normalized = concept.toLowerCase().trim();

    if (this.concepts.has(normalized)) {
      const conceptObj = this.concepts.get(normalized)!;
      conceptObj.usages.push({
        location: { chapterId, paragraphIndex, position: 0 },
        usageType: 'reference',
        context: context.substring(0, 200),
      });
    }
  }

  /**
   * Check if concept has adequate groundwork before use
   */
  checkConceptGroundwork(
    concept: string,
    currentChapterId: number
  ): GroundworkCheck {
    const normalized = concept.toLowerCase().trim();
    const conceptObj = this.concepts.get(normalized);

    if (!conceptObj) {
      return {
        hasAdequateGroundwork: false,
        missingElements: ['Concept not introduced'],
        recommendations: [
          `Introduce and define "${concept}" before using it in arguments`,
        ],
        severity: 'major',
      };
    }

    // Check if concept was introduced in a prior chapter
    if (conceptObj.firstIntroduced.chapterId > currentChapterId) {
      return {
        hasAdequateGroundwork: false,
        missingElements: ['Concept used before introduction'],
        recommendations: [
          `Move introduction of "${concept}" to earlier chapter or provide definition here`,
        ],
        severity: 'critical',
      };
    }

    // Check if concept has a definition
    if (conceptObj.definitions.length === 0 && !conceptObj.isKeyTerm) {
      return {
        hasAdequateGroundwork: false,
        missingElements: ['No explicit definition provided'],
        recommendations: [
          `Provide a definition for "${concept}" when first introduced`,
        ],
        severity: 'minor',
      };
    }

    return {
      hasAdequateGroundwork: true,
      missingElements: [],
      recommendations: [],
      severity: 'none',
    };
  }

  /**
   * Validate concept synthesis (combining multiple concepts)
   */
  validateSynthesis(
    synthesizedTerm: string,
    constituentConcepts: string[],
    location: ConceptLocation
  ): SynthesisValidation {
    const missingConcepts: string[] = [];
    const establishedConcepts: string[] = [];

    for (const constituent of constituentConcepts) {
      const normalized = constituent.toLowerCase().trim();

      if (this.concepts.has(normalized)) {
        const concept = this.concepts.get(normalized)!;

        // Check if introduced before synthesis point
        if (
          concept.firstIntroduced.chapterId < location.chapterId ||
          (concept.firstIntroduced.chapterId === location.chapterId &&
            concept.firstIntroduced.paragraphIndex < location.paragraphIndex)
        ) {
          establishedConcepts.push(constituent);
        } else {
          missingConcepts.push(constituent);
        }
      } else {
        missingConcepts.push(constituent);
      }
    }

    const isValid = missingConcepts.length === 0;

    return {
      isValid,
      missingConcepts,
      establishedConcepts,
      recommendations: isValid
        ? []
        : [
            `Introduce ${missingConcepts.join(', ')} before synthesizing into "${synthesizedTerm}"`,
          ],
    };
  }

  /**
   * Get concept development timeline
   */
  getConceptTimeline(concept: string): ConceptTimeline {
    const normalized = concept.toLowerCase().trim();
    const conceptObj = this.concepts.get(normalized);

    if (!conceptObj) {
      return {
        concept,
        milestones: [],
        developmentPattern: 'scattered',
      };
    }

    const milestones: ConceptMilestone[] = [];

    // Introduction
    milestones.push({
      type: 'introduction',
      location: conceptObj.firstIntroduced,
      description: `First mention of ${concept}`,
    });

    // Definitions
    for (const def of conceptObj.definitions) {
      milestones.push({
        type: 'definition',
        location: def.location,
        description: `${def.definitionType} definition`,
      });
    }

    // Synthesis
    if (conceptObj.synthesizesInto.length > 0) {
      milestones.push({
        type: 'synthesis',
        location: conceptObj.firstIntroduced, // Simplified
        description: `Synthesized into ${conceptObj.synthesizesInto.join(', ')}`,
      });
    }

    // Determine development pattern
    const pattern = this.analyzeDevelopmentPattern(milestones);

    return {
      concept,
      milestones,
      developmentPattern: pattern,
    };
  }

  /**
   * Analyze concept development pattern
   */
  private analyzeDevelopmentPattern(
    milestones: ConceptMilestone[]
  ): 'progressive' | 'circular' | 'scattered' | 'coherent' {
    if (milestones.length < 2) return 'scattered';

    // Check if milestones are in logical order (intro -> def -> elaboration -> synthesis)
    const types = milestones.map(m => m.type);
    const expectedOrder = ['introduction', 'definition', 'elaboration', 'synthesis', 'application'];

    let orderScore = 0;
    for (let i = 0; i < types.length - 1; i++) {
      const currentIndex = expectedOrder.indexOf(types[i]);
      const nextIndex = expectedOrder.indexOf(types[i + 1]);

      if (nextIndex >= currentIndex) {
        orderScore++;
      }
    }

    const orderRatio = orderScore / (types.length - 1);

    if (orderRatio > 0.8) return 'progressive';
    if (orderRatio > 0.5) return 'coherent';
    return 'scattered';
  }

  /**
   * Check for contradictory definitions
   */
  checkDefinitionConsistency(concept: string): ConsistencyCheck {
    const normalized = concept.toLowerCase().trim();
    const conceptObj = this.concepts.get(normalized);

    if (!conceptObj || conceptObj.definitions.length < 2) {
      return {
        isConsistent: true,
        contradictions: [],
        recommendation: '',
      };
    }

    // Simple consistency check - look for contradictory keywords
    const contradictions: Array<{ def1: ConceptDefinition; def2: ConceptDefinition }> = [];

    for (let i = 0; i < conceptObj.definitions.length; i++) {
      for (let j = i + 1; j < conceptObj.definitions.length; j++) {
        const def1 = conceptObj.definitions[i];
        const def2 = conceptObj.definitions[j];

        // Check for obvious contradictions (simplified)
        if (this.hasContradictoryLanguage(def1.text, def2.text)) {
          contradictions.push({ def1, def2 });
        }
      }
    }

    return {
      isConsistent: contradictions.length === 0,
      contradictions,
      recommendation:
        contradictions.length > 0
          ? `Resolve contradictory definitions of "${concept}" or clarify that you are using the term in multiple senses`
          : '',
    };
  }

  /**
   * Check if two definitions have contradictory language
   */
  private hasContradictoryLanguage(text1: string, text2: string): boolean {
    const contradictionPairs = [
      ['always', 'never'],
      ['all', 'none'],
      ['necessary', 'impossible'],
      ['true', 'false'],
    ];

    for (const [word1, word2] of contradictionPairs) {
      const hasWord1 = new RegExp(`\\b${word1}\\b`, 'i').test(text1);
      const hasWord2 = new RegExp(`\\b${word2}\\b`, 'i').test(text2);

      if (hasWord1 && hasWord2) {
        return true;
      }
    }

    return false;
  }

  /**
   * Extract paragraphs from text
   */
  private extractParagraphs(text: string): string[] {
    return text
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);
  }

  /**
   * Mark key terms based on usage frequency
   */
  updateKeyTerms(): void {
    for (const [_, concept] of this.concepts) {
      if (concept.usages.length >= this.config.minConceptMentions) {
        concept.isKeyTerm = true;
      }
    }
  }

  /**
   * Get all concepts
   */
  getAllConcepts(): PhilosophicalConcept[] {
    return Array.from(this.concepts.values());
  }

  /**
   * Get concepts by tradition
   */
  getConceptsByTradition(tradition: PhilosophicalConcept['tradition']): PhilosophicalConcept[] {
    return Array.from(this.concepts.values()).filter(c => c.tradition === tradition);
  }

  /**
   * Get key terms only
   */
  getKeyTerms(): PhilosophicalConcept[] {
    return Array.from(this.concepts.values()).filter(c => c.isKeyTerm);
  }

  /**
   * Get statistics
   */
  getStats(): {
    totalConcepts: number;
    keyTerms: number;
    originalContributions: number;
    synthesizedConcepts: number;
    conceptsByTradition: Record<string, number>;
  } {
    const concepts = Array.from(this.concepts.values());

    const conceptsByTradition: Record<string, number> = {};
    for (const concept of concepts) {
      conceptsByTradition[concept.tradition] = (conceptsByTradition[concept.tradition] || 0) + 1;
    }

    return {
      totalConcepts: concepts.length,
      keyTerms: concepts.filter(c => c.isKeyTerm).length,
      originalContributions: concepts.filter(c => c.isOriginalContribution).length,
      synthesizedConcepts: concepts.filter(c => c.synthesizedFrom.length > 0).length,
      conceptsByTradition,
    };
  }

  /**
   * Reset state
   */
  reset(): void {
    this.concepts.clear();
    this.chapterTexts.clear();
  }
}
