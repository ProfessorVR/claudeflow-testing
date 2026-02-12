/**
 * PhilosophicalCoherenceChecker - Extended quality stage for dissertation-specific
 * philosophical argument evaluation
 *
 * Extends ArgumentCoherenceChecker with:
 * - Term consistency tracking across chapters
 * - Phenomenological vocabulary drift detection
 * - Cross-chapter argument thread verification
 * - Greek/Latin term definition consistency
 * - Philosophical framework alignment checking
 *
 * Part of the PhD Pipeline quality assurance system.
 */

import {
  ArgumentCoherenceChecker,
} from './argument-coherence-checker.js';
import {
  BaseQualityStage,
  type QualityStageResult,
  type QualityIssue,
  type QualityEvaluationContext,
  countIssuesBySeverity,
} from '../quality-stage.js';

// ============================================================================
// Term Definition Types
// ============================================================================

/**
 * Definition of a philosophical term tracked across chapters
 */
export interface TermDefinition {
  /** The term being defined */
  term: string;
  /** Chapter where first defined */
  definedInChapter: number;
  /** Paragraph index of definition */
  definedInParagraph: number;
  /** The definition text */
  definition: string;
  /** Greek/Latin original if applicable */
  originalLanguageTerm?: string;
  /** Alternative translations encountered */
  alternativeTranslations: string[];
  /** Contexts where this term is used */
  usageContexts: Array<{
    chapterId: number;
    paragraphIndex: number;
    sentence: string;
    meaningConsistent: boolean;
  }>;
}

/**
 * Phenomenological vocabulary configuration
 */
export interface PhenomenologicalVocabulary {
  /** Heideggerian terms */
  heideggerian: Set<string>;
  /** Husserlian terms */
  husserlian: Set<string>;
  /** Merleau-Ponty terms */
  merleauPonty: Set<string>;
  /** Aristotelian terms */
  aristotelian: Set<string>;
  /** Custom terms specific to the dissertation */
  custom: Set<string>;
}

/**
 * Argument thread tracked across chapters
 */
export interface ArgumentThread {
  /** Unique identifier for this thread */
  id: string;
  /** Main claim of this thread */
  mainClaim: string;
  /** Chapter where thread started */
  startChapter: number;
  /** Chapters where this thread appears */
  appearingInChapters: number[];
  /** Key terms associated with this thread */
  associatedTerms: string[];
  /** Status of the thread */
  status: 'open' | 'resolved' | 'abandoned';
  /** Resolution if completed */
  resolution?: {
    chapterId: number;
    paragraphIndex: number;
    resolutionText: string;
  };
}

/**
 * Configuration for the philosophical coherence checker
 */
export interface PhilosophicalCoherenceConfig {
  /** Whether to enforce strict term consistency */
  strictTermConsistency: boolean;
  /** Maximum allowed phenomenological drift score */
  maxPhenomenologicalDrift: number;
  /** Require explicit definitions for Greek terms */
  requireGreekDefinitions: boolean;
  /** Check argument thread resolution */
  checkThreadResolution: boolean;
  /** Custom phenomenological vocabulary */
  customVocabulary?: Partial<PhenomenologicalVocabulary>;
}

// ============================================================================
// Default Phenomenological Vocabulary
// ============================================================================

const DEFAULT_HEIDEGGERIAN_TERMS = new Set([
  'dasein', 'sein', 'seiendes', 'zuhandenheit', 'vorhandenheit',
  'befindlichkeit', 'stimmung', 'sorge', 'angst', 'geworfenheit',
  'entwurf', 'lichtung', 'unheimlichkeit', 'eigentlichkeit',
  'uneigentlichkeit', 'zeitlichkeit', 'geschichtlichkeit',
  'in-der-welt-sein', 'mitsein', 'mitdasein', 'das man',
  'rede', 'gerede', 'verstehen', 'auslegung', 'being-in-the-world',
  'thrownness', 'projection', 'fallenness', 'care', 'anxiety',
  'authenticity', 'inauthenticity', 'temporality', 'historicity',
]);

const DEFAULT_HUSSERLIAN_TERMS = new Set([
  'epoché', 'bracketing', 'eidetic', 'noesis', 'noema',
  'intentionality', 'phenomenological reduction', 'transcendental ego',
  'lifeworld', 'lebenswelt', 'intersubjectivity', 'constitution',
  'apodictic', 'adumbration', 'fulfillment', 'evidence',
  'horizon', 'retention', 'protention', 'synthesis',
]);

const DEFAULT_MERLEAU_PONTY_TERMS = new Set([
  'flesh', 'chiasm', 'reversibility', 'embodiment', 'motor intentionality',
  'body schema', 'lived body', 'corps propre', 'intercorporeity',
  'operative intentionality', 'motor significance', 'habit body',
  'anonymous existence', 'phenomenal field', 'perceptual faith',
]);

const DEFAULT_ARISTOTELIAN_TERMS = new Set([
  'phantasia', 'aisthēsis', 'aisthesis', 'pathos', 'pathē', 'pathe',
  'logos', 'nous', 'psychē', 'psyche', 'psuchē', 'psuche',
  'eidos', 'ousia', 'energeia', 'dynamis', 'entelecheia',
  'archē', 'arche', 'telos', 'physis', 'technē', 'techne',
  'epistēmē', 'episteme', 'doxa', 'alētheia', 'aletheia',
  'hēdonē', 'hedone', 'eudaimonia', 'aretē', 'arete',
  'phronēsis', 'phronesis', 'sophia', 'theōria', 'theoria',
  'praxis', 'poiēsis', 'poiesis', 'hexis', 'hylomorphism',
  'katharsis', 'catharsis', 'mimēsis', 'mimesis',
  'to ti ēn einai', 'to ti en einai', 'qua',
]);

// ============================================================================
// Pattern Constants
// ============================================================================

// Patterns for detecting term definitions
const TERM_DEFINITION_PATTERNS = [
  /\b(\w+)\s+(?:is|refers?\s+to|means?|denotes?|signifies?)\s+["']?([^"'.]+)["']?/gi,
  /\b(?:by|the\s+term)\s+["']?(\w+)["']?\s+(?:I|we)\s+(?:mean|understand|refer\s+to)\s+(.+?)(?:\.|$)/gi,
  /\bdefine[sd]?\s+["']?(\w+)["']?\s+as\s+(.+?)(?:\.|$)/gi,
  /\b(\w+)\s*(?:—|--|-)\s*(?:that\s+is(?:,|\s)|i\.?e\.?,?)\s*(.+?)(?:\.|$)/gi,
];

// Patterns for Greek term usage
const GREEK_TERM_USAGE_PATTERNS = [
  /\b(phantasia|aisth[ēe]sis|pathos|path[ēe]|logos|nous|psych[ēe]|eidos|ousia)\b/gi,
  /\b(energ[ei]a|dynamis|entelecheia|arch[ēe]|telos|physis|techn[ēe])\b/gi,
  /\b(epist[ēe]m[ēe]|doxa|al[ēe]theia|h[ēe]don[ēe]|eudaimonia|aret[ēe])\b/gi,
  /\b(phron[ēe]sis|sophia|the[ōo]ria|praxis|poi[ēe]sis|hexis|katharsis|mim[ēe]sis)\b/gi,
];

// Patterns for phenomenological framework markers
const PHENOMENOLOGICAL_FRAMEWORK_PATTERNS = {
  heideggerian: [
    /\b(Heidegger(?:ian)?|Being\s+and\s+Time|Sein\s+und\s+Zeit)\b/i,
    /\b(the\s+question\s+of\s+Being|fundamental\s+ontology)\b/i,
    /\b(existential\s+analytic|hermeneutic\s+phenomenology)\b/i,
  ],
  husserlian: [
    /\b(Husserl(?:ian)?|transcendental\s+phenomenology)\b/i,
    /\b(phenomenological\s+(?:method|reduction|epoché))\b/i,
    /\b(eidetic\s+(?:reduction|variation|intuition))\b/i,
  ],
  aristotelian: [
    /\b(Aristotel(?:ian|e['']s)?|De\s+Anima|Nicomachean\s+Ethics)\b/i,
    /\b(hylomorphi(?:sm|c)|substance\s+ontology)\b/i,
    /\b(virtue\s+(?:theory|ethics)|practical\s+wisdom)\b/i,
  ],
};

// ============================================================================
// PhilosophicalCoherenceChecker Class
// ============================================================================

/**
 * Extended quality stage for dissertation-specific philosophical coherence
 * Uses composition with ArgumentCoherenceChecker for base evaluation
 */
export class PhilosophicalCoherenceChecker extends BaseQualityStage {
  readonly name = 'philosophical-coherence';
  readonly weight = 0.35;
  readonly threshold = 0.70;

  /** Base argument coherence checker (composition) */
  private baseChecker: ArgumentCoherenceChecker;

  /** Term definitions tracked across chapters */
  private termDefinitions: Map<string, TermDefinition> = new Map();

  /** Phenomenological vocabulary configuration */
  private phenomenologicalVocabulary: PhenomenologicalVocabulary;

  /** Argument threads tracked across chapters */
  private argumentThreads: Map<string, ArgumentThread> = new Map();

  /** Configuration */
  private config: PhilosophicalCoherenceConfig;

  constructor(config: Partial<PhilosophicalCoherenceConfig> = {}) {
    super();
    this.baseChecker = new ArgumentCoherenceChecker();

    this.config = {
      strictTermConsistency: config.strictTermConsistency ?? true,
      maxPhenomenologicalDrift: config.maxPhenomenologicalDrift ?? 0.3,
      requireGreekDefinitions: config.requireGreekDefinitions ?? true,
      checkThreadResolution: config.checkThreadResolution ?? true,
      customVocabulary: config.customVocabulary,
    };

    // Initialize phenomenological vocabulary
    this.phenomenologicalVocabulary = {
      heideggerian: config.customVocabulary?.heideggerian ?? DEFAULT_HEIDEGGERIAN_TERMS,
      husserlian: config.customVocabulary?.husserlian ?? DEFAULT_HUSSERLIAN_TERMS,
      merleauPonty: config.customVocabulary?.merleauPonty ?? DEFAULT_MERLEAU_PONTY_TERMS,
      aristotelian: config.customVocabulary?.aristotelian ?? DEFAULT_ARISTOTELIAN_TERMS,
      custom: config.customVocabulary?.custom ?? new Set(),
    };
  }

  /**
   * Evaluate chapter text for philosophical coherence
   * Runs base ArgumentCoherenceChecker evaluation plus philosophical-specific checks
   */
  async evaluate(
    chapterText: string,
    chapterId: number,
    context?: QualityEvaluationContext
  ): Promise<QualityStageResult> {
    const startTime = Date.now();

    // Run base argument coherence evaluation using composition
    const baseResult = await this.baseChecker.evaluate(chapterText, chapterId, context);

    // Additional philosophical coherence checks
    const philosophicalIssues: QualityIssue[] = [];
    const philosophicalMetrics: Record<string, number> = {};
    const philosophicalSuggestions: string[] = [];

    // Extract term definitions from this chapter
    this.extractTermDefinitions(chapterText, chapterId);

    // Check term consistency
    const termIssues = this.checkTermConsistency(chapterText, chapterId);
    philosophicalIssues.push(...termIssues);

    // Check Greek term definitions
    if (this.config.requireGreekDefinitions) {
      const greekIssues = this.checkGreekTermDefinitions(chapterText, chapterId);
      philosophicalIssues.push(...greekIssues);
    }

    // Check phenomenological drift
    const driftResult = this.checkPhenomenologicalDrift(chapterText, chapterId);
    philosophicalIssues.push(...driftResult.issues);
    philosophicalMetrics['phenomenologicalDriftScore'] = driftResult.driftScore;
    philosophicalMetrics['dominantFramework'] = this.frameworkToNumber(driftResult.dominantFramework);

    // Check argument thread continuity (if context has previous chapters)
    if (context?.previousChapters && this.config.checkThreadResolution) {
      const threadIssues = this.checkArgumentThreads(chapterText, chapterId, context.previousChapters);
      philosophicalIssues.push(...threadIssues);
    }

    // Check cross-chapter consistency (if context has previous chapters)
    if (context?.previousChapters) {
      const crossChapterIssues = this.checkCrossChapterConsistency(
        chapterText,
        chapterId,
        context.previousChapters
      );
      philosophicalIssues.push(...crossChapterIssues);
    }

    // Calculate philosophical-specific metrics
    philosophicalMetrics['uniqueTermsDefined'] = this.termDefinitions.size;
    philosophicalMetrics['greekTermsUsed'] = this.countGreekTerms(chapterText);
    philosophicalMetrics['argumentThreadsActive'] = Array.from(this.argumentThreads.values())
      .filter(t => t.status === 'open').length;

    // Generate philosophical-specific suggestions
    if (driftResult.driftScore > this.config.maxPhenomenologicalDrift) {
      philosophicalSuggestions.push(
        `Phenomenological vocabulary shows drift (score: ${driftResult.driftScore.toFixed(2)}). ` +
        `Consider maintaining consistency with the ${driftResult.dominantFramework} framework ` +
        `or explicitly signal framework transitions.`
      );
    }

    const undefinedGreekTerms = this.findUndefinedGreekTerms(chapterText);
    if (undefinedGreekTerms.length > 0) {
      philosophicalSuggestions.push(
        `Greek terms used without explicit definition: ${undefinedGreekTerms.slice(0, 5).join(', ')}. ` +
        `Consider providing definitions or translations on first use.`
      );
    }

    // Combine results
    const combinedIssues = [...baseResult.issues, ...philosophicalIssues];
    const combinedMetrics = { ...baseResult.metrics, ...philosophicalMetrics };
    const combinedSuggestions = [...baseResult.suggestions, ...philosophicalSuggestions];

    // Calculate combined score
    const { critical, major, minor } = countIssuesBySeverity(combinedIssues);
    const totalElements = (baseResult.metrics['paragraphCount'] || 1) +
      this.termDefinitions.size +
      this.argumentThreads.size;
    const score = this.calculateScore(critical, major, minor, totalElements);

    const passed = score >= this.threshold;

    return {
      stageName: this.name,
      passed,
      score,
      issues: combinedIssues,
      metrics: combinedMetrics,
      suggestions: combinedSuggestions,
      evaluationTimeMs: Date.now() - startTime,
    };
  }

  // ============================================================================
  // Term Definition Methods
  // ============================================================================

  /**
   * Extract term definitions from chapter text
   */
  private extractTermDefinitions(text: string, chapterId: number): void {
    const paragraphs = this.extractParagraphs(text);

    for (let paragraphIndex = 0; paragraphIndex < paragraphs.length; paragraphIndex++) {
      const paragraph = paragraphs[paragraphIndex];

      for (const pattern of TERM_DEFINITION_PATTERNS) {
        // Reset lastIndex for global patterns
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(paragraph)) !== null) {
          const term = match[1].toLowerCase().trim();
          const definition = match[2].trim();

          if (term.length > 2 && definition.length > 5) {
            // Check if term already exists
            const existingDef = this.termDefinitions.get(term);

            if (existingDef) {
              // Add as alternative if definition differs
              if (!this.definitionsMatch(existingDef.definition, definition)) {
                existingDef.alternativeTranslations.push(definition);
              }
            } else {
              // Create new term definition
              this.termDefinitions.set(term, {
                term,
                definedInChapter: chapterId,
                definedInParagraph: paragraphIndex,
                definition,
                alternativeTranslations: [],
                usageContexts: [],
              });
            }
          }
        }
      }
    }
  }

  /**
   * Check if two definitions are semantically similar
   */
  private definitionsMatch(def1: string, def2: string): boolean {
    const normalize = (s: string) => s.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .sort()
      .join(' ');

    const n1 = normalize(def1);
    const n2 = normalize(def2);

    // Check for significant word overlap
    const words1 = new Set(n1.split(' '));
    const words2 = new Set(n2.split(' '));
    const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size > 0.5;
  }

  /**
   * Check term consistency across the chapter
   */
  private checkTermConsistency(text: string, chapterId: number): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;
    const paragraphs = this.extractParagraphs(text);

    // Check each defined term for consistent usage
    for (const [term, definition] of Array.from(this.termDefinitions.entries())) {
      const termPattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');

      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        const matches = paragraph.match(termPattern);

        if (matches && i !== definition.definedInParagraph) {
          // Check if usage is consistent with definition
          const usageContext = this.extractUsageContext(paragraph, term);

          if (usageContext && !this.isConsistentUsage(definition, usageContext)) {
            // Track inconsistent usage
            definition.usageContexts.push({
              chapterId,
              paragraphIndex: i,
              sentence: usageContext,
              meaningConsistent: false,
            });

            if (this.config.strictTermConsistency) {
              issues.push({
                id: this.generateIssueId('argument', issueIndex++),
                type: 'coherence',
                severity: 'major',
                location: {
                  chapterId,
                  paragraphIndex: i,
                },
                description: `Term "${term}" used inconsistently with its definition in paragraph ${definition.definedInParagraph + 1}`,
                suggestion: `Ensure "${term}" is used consistently as: ${definition.definition.substring(0, 100)}...`,
                autoFixable: false,
                contextSnippet: usageContext.substring(0, 150),
              });
            }
          } else {
            // Track consistent usage
            definition.usageContexts.push({
              chapterId,
              paragraphIndex: i,
              sentence: usageContext || '',
              meaningConsistent: true,
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Extract the sentence context around a term usage
   */
  private extractUsageContext(text: string, term: string): string | null {
    const sentences = this.extractSentences(text);
    const termPattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');

    for (const sentence of sentences) {
      if (termPattern.test(sentence)) {
        return sentence;
      }
    }

    return null;
  }

  /**
   * Check if term usage is consistent with its definition
   */
  private isConsistentUsage(definition: TermDefinition, context: string): boolean {
    // Simple heuristic: check if context uses definition-related words
    const defWords = definition.definition.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3);

    const contextWords = context.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/);

    const overlap = defWords.filter(w => contextWords.includes(w)).length;

    // Allow if at least 20% of definition words appear in context
    return overlap >= Math.max(1, defWords.length * 0.2);
  }

  // ============================================================================
  // Greek Term Methods
  // ============================================================================

  /**
   * Check that Greek terms are properly defined
   */
  private checkGreekTermDefinitions(text: string, chapterId: number): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;
    const paragraphs = this.extractParagraphs(text);

    const undefinedTerms = new Map<string, number>(); // term -> first paragraph

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];

      for (const pattern of GREEK_TERM_USAGE_PATTERNS) {
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(paragraph)) !== null) {
          const term = match[1].toLowerCase();

          // Check if term is defined
          if (!this.termDefinitions.has(term) && !undefinedTerms.has(term)) {
            undefinedTerms.set(term, i);
          }
        }
      }
    }

    // Create issues for undefined Greek terms (first use)
    for (const [term, paragraphIndex] of Array.from(undefinedTerms.entries())) {
      issues.push({
        id: this.generateIssueId('argument', issueIndex++),
        type: 'argument',
        severity: 'minor',
        location: {
          chapterId,
          paragraphIndex,
        },
        description: `Greek term "${term}" used without explicit definition`,
        suggestion: `Define "${term}" on first use, e.g., "${term} (Greek: [original], meaning [translation])"`,
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Count Greek terms used in text
   */
  private countGreekTerms(text: string): number {
    const terms = new Set<string>();
    const lowerText = text.toLowerCase();

    for (const term of Array.from(this.phenomenologicalVocabulary.aristotelian)) {
      if (lowerText.includes(term)) {
        terms.add(term);
      }
    }

    return terms.size;
  }

  /**
   * Find Greek terms used without definition
   */
  private findUndefinedGreekTerms(text: string): string[] {
    const undefined: string[] = [];
    const lowerText = text.toLowerCase();

    for (const term of Array.from(this.phenomenologicalVocabulary.aristotelian)) {
      if (lowerText.includes(term) && !this.termDefinitions.has(term)) {
        undefined.push(term);
      }
    }

    return undefined;
  }

  // ============================================================================
  // Phenomenological Drift Methods
  // ============================================================================

  /**
   * Check for phenomenological vocabulary drift
   */
  private checkPhenomenologicalDrift(
    text: string,
    chapterId: number
  ): { issues: QualityIssue[]; driftScore: number; dominantFramework: string } {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;
    const lowerText = text.toLowerCase();

    // Count terms from each framework
    const frameworkCounts = {
      heideggerian: 0,
      husserlian: 0,
      merleauPonty: 0,
      aristotelian: 0,
    };

    for (const term of Array.from(this.phenomenologicalVocabulary.heideggerian)) {
      if (lowerText.includes(term)) frameworkCounts.heideggerian++;
    }
    for (const term of Array.from(this.phenomenologicalVocabulary.husserlian)) {
      if (lowerText.includes(term)) frameworkCounts.husserlian++;
    }
    for (const term of Array.from(this.phenomenologicalVocabulary.merleauPonty)) {
      if (lowerText.includes(term)) frameworkCounts.merleauPonty++;
    }
    for (const term of Array.from(this.phenomenologicalVocabulary.aristotelian)) {
      if (lowerText.includes(term)) frameworkCounts.aristotelian++;
    }

    // Determine dominant framework
    const totalCount = Object.values(frameworkCounts).reduce((a, b) => a + b, 0);
    if (totalCount === 0) {
      return { issues: [], driftScore: 0, dominantFramework: 'none' };
    }

    const sortedFrameworks = Object.entries(frameworkCounts)
      .sort(([, a], [, b]) => b - a);

    const dominantFramework = sortedFrameworks[0][0];
    const dominantCount = sortedFrameworks[0][1];

    // Calculate drift score (0 = no drift, 1 = maximum drift)
    const dominantRatio = dominantCount / totalCount;
    const driftScore = 1 - dominantRatio;

    // Check for significant drift (using secondary frameworks heavily)
    if (driftScore > this.config.maxPhenomenologicalDrift) {
      const paragraphs = this.extractParagraphs(text);

      // Find paragraphs with mixed vocabulary
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i].toLowerCase();
        const frameworksInParagraph: string[] = [];

        if (this.hasFrameworkTerms(paragraph, this.phenomenologicalVocabulary.heideggerian)) {
          frameworksInParagraph.push('Heideggerian');
        }
        if (this.hasFrameworkTerms(paragraph, this.phenomenologicalVocabulary.husserlian)) {
          frameworksInParagraph.push('Husserlian');
        }
        if (this.hasFrameworkTerms(paragraph, this.phenomenologicalVocabulary.aristotelian)) {
          frameworksInParagraph.push('Aristotelian');
        }

        if (frameworksInParagraph.length > 1) {
          issues.push({
            id: this.generateIssueId('coherence', issueIndex++),
            type: 'coherence',
            severity: 'minor',
            location: {
              chapterId,
              paragraphIndex: i,
            },
            description: `Mixed phenomenological frameworks in single paragraph: ${frameworksInParagraph.join(', ')}`,
            suggestion: 'Consider using terms from a single framework per paragraph, or explicitly acknowledge the interdisciplinary approach',
            autoFixable: false,
            contextSnippet: paragraphs[i].substring(0, 150),
          });
        }
      }
    }

    return { issues, driftScore, dominantFramework };
  }

  /**
   * Check if text contains terms from a specific framework
   */
  private hasFrameworkTerms(text: string, vocabulary: Set<string>): boolean {
    for (const term of Array.from(vocabulary)) {
      if (text.includes(term)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Convert framework name to number for metrics
   */
  private frameworkToNumber(framework: string): number {
    const mapping: Record<string, number> = {
      heideggerian: 1,
      husserlian: 2,
      merleauPonty: 3,
      aristotelian: 4,
      none: 0,
    };
    return mapping[framework] ?? 0;
  }

  // ============================================================================
  // Argument Thread Methods
  // ============================================================================

  /**
   * Check argument thread continuity across chapters
   */
  private checkArgumentThreads(
    text: string,
    chapterId: number,
    previousChapters: Map<number, string>
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Track new argument threads in this chapter
    this.extractArgumentThreads(text, chapterId);

    // Check for abandoned threads
    for (const [threadId, thread] of Array.from(this.argumentThreads.entries())) {
      if (thread.status === 'open' && thread.startChapter < chapterId) {
        // Check if thread is referenced in this chapter
        const isReferenced = this.isThreadReferencedInChapter(thread, text);

        if (!isReferenced) {
          // Check chapter gap
          const lastChapter = Math.max(...thread.appearingInChapters);
          const gap = chapterId - lastChapter;

          if (gap > 2) {
            issues.push({
              id: this.generateIssueId('coherence', issueIndex++),
              type: 'coherence',
              severity: gap > 3 ? 'major' : 'minor',
              location: { chapterId },
              description: `Argument thread "${thread.mainClaim.substring(0, 50)}..." not referenced since chapter ${lastChapter}`,
              suggestion: 'Either resolve this argument thread or reference it to maintain continuity',
              autoFixable: false,
            });
          }
        } else {
          // Update thread with this chapter
          thread.appearingInChapters.push(chapterId);
        }
      }
    }

    return issues;
  }

  /**
   * Extract argument threads from chapter text
   */
  private extractArgumentThreads(text: string, chapterId: number): void {
    const paragraphs = this.extractParagraphs(text);

    // Patterns for identifying argument thread starters
    const threadStartPatterns = [
      /\b(I\s+(?:will\s+)?argue\s+that)\s+(.+?)(?:\.|$)/gi,
      /\b(my\s+(?:central\s+)?(?:argument|thesis|claim)\s+is\s+that)\s+(.+?)(?:\.|$)/gi,
      /\b(this\s+(?:chapter|section)\s+(?:will\s+)?(?:demonstrates?|shows?|argues?)\s+that)\s+(.+?)(?:\.|$)/gi,
    ];

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];

      for (const pattern of threadStartPatterns) {
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(paragraph)) !== null) {
          const claim = match[2].trim();
          const threadId = this.generateThreadId(claim);

          if (!this.argumentThreads.has(threadId)) {
            this.argumentThreads.set(threadId, {
              id: threadId,
              mainClaim: claim,
              startChapter: chapterId,
              appearingInChapters: [chapterId],
              associatedTerms: this.extractKeyTerms(claim),
              status: 'open',
            });
          }
        }
      }
    }
  }

  /**
   * Generate a unique ID for an argument thread
   */
  private generateThreadId(claim: string): string {
    const keyTerms = this.extractKeyTerms(claim).sort().join('_');
    return `thread_${keyTerms.substring(0, 50)}`;
  }

  /**
   * Extract key terms from a claim
   */
  private extractKeyTerms(text: string): string[] {
    const stopwords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'are', 'was', 'were', 'that',
      'this', 'these', 'those', 'it', 'its', 'they', 'we', 'our', 'will', 'can',
    ]);

    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 3 && !stopwords.has(w));
  }

  /**
   * Check if an argument thread is referenced in the chapter
   */
  private isThreadReferencedInChapter(thread: ArgumentThread, text: string): boolean {
    const lowerText = text.toLowerCase();

    // Check for key terms from the thread
    const foundTerms = thread.associatedTerms.filter(term => lowerText.includes(term));

    // Require at least 2 key terms to consider it referenced
    return foundTerms.length >= Math.min(2, thread.associatedTerms.length);
  }

  // ============================================================================
  // Cross-Chapter Consistency Methods
  // ============================================================================

  /**
   * Check cross-chapter consistency
   */
  private checkCrossChapterConsistency(
    text: string,
    chapterId: number,
    previousChapters: Map<number, string>
  ): QualityIssue[] {
    const issues: QualityIssue[] = [];
    let issueIndex = 0;

    // Check for contradictory claims with previous chapters
    const currentClaims = this.extractClaims(text);

    for (const [prevChapterId, prevText] of Array.from(previousChapters.entries())) {
      if (prevChapterId >= chapterId) continue;

      const prevClaims = this.extractClaims(prevText);

      for (const currentClaim of currentClaims) {
        for (const prevClaim of prevClaims) {
          if (this.claimsContradict(currentClaim, prevClaim)) {
            issues.push({
              id: this.generateIssueId('argument', issueIndex++),
              type: 'argument',
              severity: 'critical',
              location: { chapterId },
              description: `Potential contradiction with claim in chapter ${prevChapterId}`,
              suggestion: 'Review and reconcile these potentially contradictory claims',
              autoFixable: false,
              contextSnippet: `Current: "${currentClaim.text.substring(0, 80)}..." vs Ch${prevChapterId}: "${prevClaim.text.substring(0, 80)}..."`,
            });
          }
        }
      }
    }

    return issues;
  }

  /**
   * Extract claims from text
   */
  private extractClaims(text: string): Array<{ text: string; type: string }> {
    const claims: Array<{ text: string; type: string }> = [];
    const sentences = this.extractSentences(text);

    const claimPatterns = [
      { pattern: /\b(I\s+argue\s+that)\s+(.+)/i, type: 'main' },
      { pattern: /\b(this\s+(?:shows?|demonstrates?|proves?)\s+that)\s+(.+)/i, type: 'conclusion' },
      { pattern: /\b(it\s+is\s+(?:clear|evident|obvious)\s+that)\s+(.+)/i, type: 'strong' },
    ];

    for (const sentence of sentences) {
      for (const { pattern, type } of claimPatterns) {
        if (pattern.test(sentence)) {
          claims.push({ text: sentence, type });
        }
      }
    }

    return claims;
  }

  /**
   * Check if two claims contradict each other
   */
  private claimsContradict(
    claim1: { text: string; type: string },
    claim2: { text: string; type: string }
  ): boolean {
    // Simple contradiction detection based on negation and key terms
    const c1Lower = claim1.text.toLowerCase();
    const c2Lower = claim2.text.toLowerCase();

    const c1Terms = this.extractKeyTerms(c1Lower);
    const c2Terms = this.extractKeyTerms(c2Lower);

    // Check for significant term overlap
    const commonTerms = c1Terms.filter(t => c2Terms.includes(t));
    if (commonTerms.length < 2) return false;

    // Check for negation patterns
    const negationPatterns = [
      { positive: /\bis\b/, negative: /\bis\s+not\b/ },
      { positive: /\bcan\b/, negative: /\bcannot\b/ },
      { positive: /\balways\b/, negative: /\bnever\b/ },
      { positive: /\ball\b/, negative: /\bnone\b|\bno\b/ },
      { positive: /\bsupport/, negative: /\b(refute|contradict)/ },
    ];

    for (const { positive, negative } of negationPatterns) {
      if ((positive.test(c1Lower) && negative.test(c2Lower)) ||
          (negative.test(c1Lower) && positive.test(c2Lower))) {
        return true;
      }
    }

    return false;
  }

  // ============================================================================
  // Public Methods for External Access
  // ============================================================================

  /**
   * Get all tracked term definitions
   */
  getTermDefinitions(): Map<string, TermDefinition> {
    return new Map(this.termDefinitions);
  }

  /**
   * Get all tracked argument threads
   */
  getArgumentThreads(): Map<string, ArgumentThread> {
    return new Map(this.argumentThreads);
  }

  /**
   * Add a term definition manually
   */
  addTermDefinition(term: string, definition: Omit<TermDefinition, 'term'>): void {
    this.termDefinitions.set(term.toLowerCase(), {
      term: term.toLowerCase(),
      ...definition,
    });
  }

  /**
   * Mark an argument thread as resolved
   */
  resolveArgumentThread(
    threadId: string,
    resolution: ArgumentThread['resolution']
  ): boolean {
    const thread = this.argumentThreads.get(threadId);
    if (thread) {
      thread.status = 'resolved';
      thread.resolution = resolution;
      return true;
    }
    return false;
  }

  /**
   * Reset internal state (for testing or new document analysis)
   */
  reset(): void {
    this.termDefinitions.clear();
    this.argumentThreads.clear();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a default philosophical coherence checker
 */
export function createDefaultPhilosophicalChecker(): PhilosophicalCoherenceChecker {
  return new PhilosophicalCoherenceChecker();
}

/**
 * Create a strict philosophical coherence checker
 */
export function createStrictPhilosophicalChecker(): PhilosophicalCoherenceChecker {
  return new PhilosophicalCoherenceChecker({
    strictTermConsistency: true,
    maxPhenomenologicalDrift: 0.2,
    requireGreekDefinitions: true,
    checkThreadResolution: true,
  });
}

/**
 * Create a lenient philosophical coherence checker (for early drafts)
 */
export function createDraftPhilosophicalChecker(): PhilosophicalCoherenceChecker {
  return new PhilosophicalCoherenceChecker({
    strictTermConsistency: false,
    maxPhenomenologicalDrift: 0.5,
    requireGreekDefinitions: false,
    checkThreadResolution: false,
  });
}
