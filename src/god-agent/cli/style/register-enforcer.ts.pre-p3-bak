/**
 * Register Enforcer - Academic Register Consistency
 *
 * Phase I Enhancement (Task #10) - Ensures consistent academic register:
 * 1. Detect informal language (contractions, colloquialisms, slang)
 * 2. Identify register shifts within text
 * 3. Suggest formal alternatives
 * 4. Calculate register consistency score
 *
 * Academic registers supported:
 * - formal: Academic papers, dissertations, peer-reviewed articles
 * - semi-formal: Technical documentation, professional reports
 * - informal: Blog posts, casual explanations (flagged in academic context)
 *
 * @module register-enforcer
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Register level
 */
export type RegisterLevel = 'formal' | 'semi-formal' | 'informal';

/**
 * Register violation type
 */
export type ViolationType =
  | 'contraction'           // don't, can't, it's
  | 'colloquialism'         // kind of, a lot, stuff
  | 'slang'                 // cool, awesome, gonna
  | 'first_person'          // I, me, my (when inappropriate)
  | 'second_person'         // you, your
  | 'hedging_casual'        // basically, sort of, like
  | 'intensifier_casual'    // really, very, totally
  | 'sentence_fragment'     // incomplete sentences
  | 'rhetorical_question'   // Questions used rhetorically
  | 'exclamation'           // Exclamation marks
  | 'conjunction_start'     // But, And, So at sentence start
  | 'phrasal_verb';         // Get up, put off, figure out

/**
 * Register violation
 */
export interface RegisterViolation {
  /** Type of violation */
  type: ViolationType;
  /** The problematic text */
  text: string;
  /** Start position in source */
  position: number;
  /** Detected register level */
  detectedRegister: RegisterLevel;
  /** Expected register level */
  expectedRegister: RegisterLevel;
  /** Suggested formal alternatives */
  suggestions: string[];
  /** Severity (0-1, higher = more informal) */
  severity: number;
  /** Surrounding context */
  context: string;
}

/**
 * Register analysis result
 */
export interface RegisterAnalysis {
  /** Overall register consistency score (0-1) */
  consistencyScore: number;
  /** Dominant register detected */
  dominantRegister: RegisterLevel;
  /** Target/expected register */
  targetRegister: RegisterLevel;
  /** All violations found */
  violations: RegisterViolation[];
  /** Violations by type */
  violationsByType: Record<ViolationType, number>;
  /** Register distribution (percentage of text at each level) */
  registerDistribution: Record<RegisterLevel, number>;
  /** Analysis metadata */
  metadata: {
    wordCount: number;
    sentenceCount: number;
    analysisTimeMs: number;
  };
}

/**
 * Register enforcer configuration
 */
export interface RegisterEnforcerConfig {
  /** Target register level (default: 'formal') */
  targetRegister?: RegisterLevel;
  /** Allow first person in appropriate contexts */
  allowFirstPerson?: boolean;
  /** Allow rhetorical questions */
  allowRhetoricalQuestions?: boolean;
  /** Minimum severity to report (0-1, default: 0.3) */
  minSeverity?: number;
  /** Context window for surrounding text (default: 50 chars) */
  contextWindow?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<RegisterEnforcerConfig> = {
  targetRegister: 'formal',
  allowFirstPerson: false,
  allowRhetoricalQuestions: false,
  minSeverity: 0.3,
  contextWindow: 50,
};

/**
 * Contractions and their formal expansions
 */
const CONTRACTIONS: Record<string, string> = {
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "can't": "cannot",
  "couldn't": "could not",
  "won't": "will not",
  "wouldn't": "would not",
  "shouldn't": "should not",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
  "haven't": "have not",
  "hasn't": "has not",
  "hadn't": "had not",
  "it's": "it is",
  "that's": "that is",
  "there's": "there is",
  "what's": "what is",
  "who's": "who is",
  "he's": "he is",
  "she's": "she is",
  "let's": "let us",
  "I'm": "I am",
  "you're": "you are",
  "we're": "we are",
  "they're": "they are",
  "I've": "I have",
  "you've": "you have",
  "we've": "we have",
  "they've": "they have",
  "I'd": "I would",
  "you'd": "you would",
  "he'd": "he would",
  "she'd": "she would",
  "we'd": "we would",
  "they'd": "they would",
  "I'll": "I will",
  "you'll": "you will",
  "he'll": "he will",
  "she'll": "she will",
  "we'll": "we will",
  "they'll": "they will",
};

/**
 * Colloquialisms and formal alternatives
 */
const COLLOQUIALISMS: Record<string, string[]> = {
  'a lot': ['significantly', 'considerably', 'substantially', 'numerous'],
  'lots of': ['many', 'numerous', 'substantial', 'considerable'],
  'kind of': ['somewhat', 'to some extent', 'partially', 'rather'],
  'sort of': ['somewhat', 'to some degree', 'partially', 'rather'],
  'stuff': ['material', 'content', 'elements', 'items', 'matters'],
  'things': ['elements', 'factors', 'aspects', 'components', 'items'],
  'get': ['obtain', 'acquire', 'receive', 'become'],
  'got': ['obtained', 'acquired', 'received', 'became'],
  'big': ['significant', 'substantial', 'considerable', 'major'],
  'small': ['minor', 'limited', 'modest', 'negligible'],
  'good': ['effective', 'beneficial', 'positive', 'advantageous'],
  'bad': ['negative', 'detrimental', 'adverse', 'unfavorable'],
  'show': ['demonstrate', 'illustrate', 'indicate', 'reveal'],
  'shows': ['demonstrates', 'illustrates', 'indicates', 'reveals'],
  'use': ['utilize', 'employ', 'apply'],
  'used': ['utilized', 'employed', 'applied'],
  'make': ['create', 'construct', 'produce', 'generate'],
  'made': ['created', 'constructed', 'produced', 'generated'],
  'find out': ['determine', 'ascertain', 'discover', 'establish'],
  'look at': ['examine', 'analyze', 'investigate', 'consider'],
  'look into': ['investigate', 'examine', 'explore', 'analyze'],
  'go over': ['review', 'examine', 'analyze'],
  'come up with': ['develop', 'devise', 'formulate', 'propose'],
  'figure out': ['determine', 'ascertain', 'resolve', 'deduce'],
  'point out': ['indicate', 'highlight', 'emphasize', 'note'],
  'set up': ['establish', 'configure', 'arrange', 'organize'],
  'carry out': ['conduct', 'perform', 'execute', 'implement'],
  'bring up': ['raise', 'introduce', 'mention', 'address'],
  'deal with': ['address', 'handle', 'manage', 'process'],
  'put together': ['assemble', 'compile', 'compose', 'construct'],
  'take into account': ['consider', 'account for'],
};

/**
 * Slang and informal expressions
 */
const SLANG: Record<string, string[]> = {
  'cool': ['impressive', 'interesting', 'notable', 'appealing'],
  'awesome': ['remarkable', 'impressive', 'excellent', 'outstanding'],
  'great': ['significant', 'considerable', 'notable', 'substantial'],
  'nice': ['pleasant', 'agreeable', 'satisfactory', 'appropriate'],
  'okay': ['acceptable', 'adequate', 'satisfactory', 'appropriate'],
  'ok': ['acceptable', 'adequate', 'satisfactory', 'appropriate'],
  'pretty much': ['essentially', 'largely', 'primarily', 'mostly'],
  'gonna': ['going to', 'will'],
  'wanna': ['want to', 'wish to', 'desire to'],
  'gotta': ['have to', 'must', 'need to'],
  'kinda': ['somewhat', 'rather', 'to some extent'],
  'sorta': ['somewhat', 'rather', 'to some degree'],
  'yeah': ['yes', 'indeed', 'certainly'],
  'nope': ['no', 'not'],
  'yep': ['yes', 'indeed', 'certainly'],
  'anyways': ['regardless', 'nevertheless', 'in any case'],
  'anywheres': ['anywhere'],
  'nowheres': ['nowhere'],
  'gonna': ['going to'],
};

/**
 * Casual hedging expressions
 */
const CASUAL_HEDGES: Record<string, string[]> = {
  'basically': ['fundamentally', 'essentially', 'primarily'],
  'actually': ['in fact', 'indeed', 'in reality'],
  'literally': ['precisely', 'exactly', 'strictly'],
  'obviously': ['evidently', 'clearly', 'apparently'],
  'honestly': ['candidly', 'frankly', 'in truth'],
  'like': [],  // Often used as filler, should be removed
  'you know': [],  // Filler, should be removed
  'I mean': [],  // Filler, should be removed
  'I guess': ['perhaps', 'possibly', 'it appears that'],
  'I think': ['it appears', 'evidence suggests', 'one might argue'],
  'I feel': ['it seems', 'it appears', 'evidence suggests'],
  'I believe': ['evidence suggests', 'it appears', 'research indicates'],
};

/**
 * Casual intensifiers
 */
const CASUAL_INTENSIFIERS: Record<string, string[]> = {
  'really': ['significantly', 'notably', 'considerably'],
  'very': ['highly', 'considerably', 'notably'],
  'totally': ['completely', 'entirely', 'wholly'],
  'absolutely': ['completely', 'entirely', 'wholly'],
  'super': ['highly', 'extremely', 'exceptionally'],
  'incredibly': ['remarkably', 'exceptionally', 'notably'],
  'amazingly': ['remarkably', 'notably', 'surprisingly'],
  'extremely': ['highly', 'notably', 'considerably'],
};

/**
 * Phrasal verbs and formal alternatives
 */
const PHRASAL_VERBS: Record<string, string[]> = {
  'put off': ['postpone', 'defer', 'delay'],
  'put up with': ['tolerate', 'endure', 'accept'],
  'give up': ['abandon', 'relinquish', 'surrender'],
  'break down': ['analyze', 'decompose', 'categorize'],
  'look up': ['research', 'investigate', 'search'],
  'pick up': ['acquire', 'learn', 'obtain'],
  'turn out': ['prove', 'result', 'emerge'],
  'turn down': ['reject', 'decline', 'refuse'],
  'take over': ['assume control of', 'acquire', 'succeed'],
  'take up': ['adopt', 'pursue', 'occupy'],
  'go through': ['examine', 'experience', 'review'],
  'go on': ['continue', 'proceed', 'persist'],
  'come across': ['encounter', 'discover', 'find'],
  'come out': ['emerge', 'result', 'be published'],
  'find out': ['discover', 'determine', 'ascertain'],
  'work out': ['calculate', 'resolve', 'develop'],
  'make up': ['constitute', 'compose', 'fabricate'],
  'bring about': ['cause', 'produce', 'generate'],
  'carry on': ['continue', 'proceed', 'persist'],
  'keep up': ['maintain', 'sustain', 'continue'],
  'hold up': ['support', 'sustain', 'delay'],
  'end up': ['ultimately', 'eventually result in'],
  'leave out': ['omit', 'exclude', 'disregard'],
  'think over': ['consider', 'contemplate', 'evaluate'],
  'talk about': ['discuss', 'address', 'examine'],
};

/**
 * Second person patterns
 */
const SECOND_PERSON_PATTERNS: RegExp[] = [
  /\byou\b/gi,
  /\byour\b/gi,
  /\byours\b/gi,
  /\byourself\b/gi,
  /\byourselves\b/gi,
];

/**
 * First person patterns (potentially informal in academic writing)
 */
const FIRST_PERSON_PATTERNS: RegExp[] = [
  /\bI\b/g,
  /\bme\b/gi,
  /\bmy\b/gi,
  /\bmine\b/gi,
  /\bmyself\b/gi,
];

/**
 * Conjunction starts (informal at sentence beginning)
 */
const CONJUNCTION_STARTS: string[] = [
  'But', 'And', 'So', 'Or', 'Yet', 'Because', 'Also',
];

// ============================================================================
// RegisterEnforcer Class
// ============================================================================

/**
 * Register Enforcer - Ensures consistent academic register
 */
export class RegisterEnforcer {
  private config: Required<RegisterEnforcerConfig>;

  constructor(config: RegisterEnforcerConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };
  }

  // ==========================================================================
  // Main Analysis
  // ==========================================================================

  /**
   * Analyze text for register consistency
   */
  analyze(text: string): RegisterAnalysis {
    const startTime = Date.now();

    const violations: RegisterViolation[] = [];

    // Detect all violation types
    violations.push(...this.detectContractions(text));
    violations.push(...this.detectColloquialisms(text));
    violations.push(...this.detectSlang(text));
    violations.push(...this.detectCasualHedges(text));
    violations.push(...this.detectCasualIntensifiers(text));
    violations.push(...this.detectPhrasalVerbs(text));
    violations.push(...this.detectSecondPerson(text));
    violations.push(...this.detectConjunctionStarts(text));
    violations.push(...this.detectExclamations(text));
    violations.push(...this.detectRhetoricalQuestions(text));

    if (!this.config.allowFirstPerson) {
      violations.push(...this.detectFirstPerson(text));
    }

    // Filter by minimum severity
    const filteredViolations = violations.filter(
      v => v.severity >= this.config.minSeverity
    );

    // Sort by position
    filteredViolations.sort((a, b) => a.position - b.position);

    // Calculate statistics
    const violationsByType = this.groupViolationsByType(filteredViolations);
    const registerDistribution = this.calculateRegisterDistribution(text, filteredViolations);
    const dominantRegister = this.determineDominantRegister(registerDistribution);
    const consistencyScore = this.calculateConsistencyScore(text, filteredViolations);

    const wordCount = this.countWords(text);
    const sentenceCount = this.countSentences(text);

    return {
      consistencyScore,
      dominantRegister,
      targetRegister: this.config.targetRegister,
      violations: filteredViolations,
      violationsByType,
      registerDistribution,
      metadata: {
        wordCount,
        sentenceCount,
        analysisTimeMs: Date.now() - startTime,
      },
    };
  }

  /**
   * Quick check if text is acceptable
   */
  isAcceptable(text: string, minScore: number = 0.8): boolean {
    const analysis = this.analyze(text);
    return analysis.consistencyScore >= minScore;
  }

  /**
   * Get suggestions for fixing all violations
   */
  getSuggestions(text: string): Array<{
    original: string;
    replacement: string;
    position: number;
    type: ViolationType;
  }> {
    const analysis = this.analyze(text);
    return analysis.violations
      .filter(v => v.suggestions.length > 0)
      .map(v => ({
        original: v.text,
        replacement: v.suggestions[0],
        position: v.position,
        type: v.type,
      }));
  }

  /**
   * Auto-correct obvious violations
   */
  autoCorrect(text: string): { corrected: string; corrections: number } {
    let corrected = text;
    let corrections = 0;

    // Expand contractions
    for (const [contraction, expansion] of Object.entries(CONTRACTIONS)) {
      const regex = new RegExp(`\\b${this.escapeRegex(contraction)}\\b`, 'gi');
      const matches = corrected.match(regex);
      if (matches) {
        corrected = corrected.replace(regex, expansion);
        corrections += matches.length;
      }
    }

    return { corrected, corrections };
  }

  // ==========================================================================
  // Detection Methods
  // ==========================================================================

  /**
   * Detect contractions
   */
  private detectContractions(text: string): RegisterViolation[] {
    const violations: RegisterViolation[] = [];

    for (const [contraction, expansion] of Object.entries(CONTRACTIONS)) {
      const regex = new RegExp(`\\b${this.escapeRegex(contraction)}\\b`, 'gi');
      let match;

      while ((match = regex.exec(text)) !== null) {
        violations.push({
          type: 'contraction',
          text: match[0],
          position: match.index,
          detectedRegister: 'informal',
          expectedRegister: this.config.targetRegister,
          suggestions: [expansion],
          severity: 0.7,
          context: this.extractContext(text, match.index, match[0].length),
        });
      }
    }

    return violations;
  }

  /**
   * Detect colloquialisms
   */
  private detectColloquialisms(text: string): RegisterViolation[] {
    return this.detectPatterns(text, COLLOQUIALISMS, 'colloquialism', 0.6);
  }

  /**
   * Detect slang
   */
  private detectSlang(text: string): RegisterViolation[] {
    return this.detectPatterns(text, SLANG, 'slang', 0.9);
  }

  /**
   * Detect casual hedging
   */
  private detectCasualHedges(text: string): RegisterViolation[] {
    return this.detectPatterns(text, CASUAL_HEDGES, 'hedging_casual', 0.5);
  }

  /**
   * Detect casual intensifiers
   */
  private detectCasualIntensifiers(text: string): RegisterViolation[] {
    return this.detectPatterns(text, CASUAL_INTENSIFIERS, 'intensifier_casual', 0.4);
  }

  /**
   * Detect phrasal verbs
   */
  private detectPhrasalVerbs(text: string): RegisterViolation[] {
    return this.detectPatterns(text, PHRASAL_VERBS, 'phrasal_verb', 0.5);
  }

  /**
   * Helper to detect patterns
   */
  private detectPatterns(
    text: string,
    patterns: Record<string, string[]>,
    type: ViolationType,
    severity: number
  ): RegisterViolation[] {
    const violations: RegisterViolation[] = [];

    for (const [pattern, suggestions] of Object.entries(patterns)) {
      const regex = new RegExp(`\\b${this.escapeRegex(pattern)}\\b`, 'gi');
      let match;

      while ((match = regex.exec(text)) !== null) {
        violations.push({
          type,
          text: match[0],
          position: match.index,
          detectedRegister: 'informal',
          expectedRegister: this.config.targetRegister,
          suggestions: suggestions.slice(0, 3),
          severity,
          context: this.extractContext(text, match.index, match[0].length),
        });
      }
    }

    return violations;
  }

  /**
   * Detect second person usage
   */
  private detectSecondPerson(text: string): RegisterViolation[] {
    const violations: RegisterViolation[] = [];

    for (const pattern of SECOND_PERSON_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(text)) !== null) {
        // Skip if in quotation
        if (this.isInQuotation(text, match.index)) continue;

        violations.push({
          type: 'second_person',
          text: match[0],
          position: match.index,
          detectedRegister: 'informal',
          expectedRegister: this.config.targetRegister,
          suggestions: ['one', 'the reader', 'researchers'],
          severity: 0.6,
          context: this.extractContext(text, match.index, match[0].length),
        });
      }
    }

    return violations;
  }

  /**
   * Detect first person usage
   */
  private detectFirstPerson(text: string): RegisterViolation[] {
    const violations: RegisterViolation[] = [];

    for (const pattern of FIRST_PERSON_PATTERNS) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(text)) !== null) {
        // Skip if in quotation
        if (this.isInQuotation(text, match.index)) continue;

        violations.push({
          type: 'first_person',
          text: match[0],
          position: match.index,
          detectedRegister: 'semi-formal',
          expectedRegister: this.config.targetRegister,
          suggestions: ['this study', 'the author', 'we', 'one'],
          severity: 0.4,
          context: this.extractContext(text, match.index, match[0].length),
        });
      }
    }

    return violations;
  }

  /**
   * Detect conjunction starts
   */
  private detectConjunctionStarts(text: string): RegisterViolation[] {
    const violations: RegisterViolation[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let position = 0;

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      for (const conj of CONJUNCTION_STARTS) {
        if (trimmed.startsWith(conj + ' ') || trimmed.startsWith(conj + ',')) {
          violations.push({
            type: 'conjunction_start',
            text: conj,
            position: position + trimmed.indexOf(conj),
            detectedRegister: 'informal',
            expectedRegister: this.config.targetRegister,
            suggestions: [
              `However, ${trimmed.slice(conj.length + 1)}`,
              `Furthermore, ${trimmed.slice(conj.length + 1)}`,
              `Additionally, ${trimmed.slice(conj.length + 1)}`,
            ],
            severity: 0.3,
            context: this.extractContext(text, position, sentence.length),
          });
          break;
        }
      }
      position += sentence.length + 1;
    }

    return violations;
  }

  /**
   * Detect exclamation marks
   */
  private detectExclamations(text: string): RegisterViolation[] {
    const violations: RegisterViolation[] = [];
    const regex = /[^.!?]*!/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Skip if the exclamation mark (end of match) is in quotation
      const exclamationPos = match.index + match[0].length - 1;
      if (this.isInQuotation(text, exclamationPos)) continue;

      violations.push({
        type: 'exclamation',
        text: match[0].trim(),
        position: match.index,
        detectedRegister: 'informal',
        expectedRegister: this.config.targetRegister,
        suggestions: [match[0].replace('!', '.')],
        severity: 0.5,
        context: this.extractContext(text, match.index, match[0].length),
      });
    }

    return violations;
  }

  /**
   * Detect rhetorical questions
   */
  private detectRhetoricalQuestions(text: string): RegisterViolation[] {
    if (this.config.allowRhetoricalQuestions) return [];

    const violations: RegisterViolation[] = [];
    const regex = /[^.!?]*\?/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Skip if the question mark (end of match) is in quotation
      const questionPos = match.index + match[0].length - 1;
      if (this.isInQuotation(text, questionPos)) continue;

      // Check if it looks like a rhetorical question (not a genuine research question)
      const question = match[0].trim();
      const isResearchQuestion =
        question.toLowerCase().includes('research question') ||
        question.toLowerCase().includes('rq') ||
        question.toLowerCase().startsWith('what is the impact') ||
        question.toLowerCase().startsWith('how does');

      if (!isResearchQuestion) {
        violations.push({
          type: 'rhetorical_question',
          text: question,
          position: match.index,
          detectedRegister: 'semi-formal',
          expectedRegister: this.config.targetRegister,
          suggestions: ['Consider rephrasing as a declarative statement.'],
          severity: 0.4,
          context: this.extractContext(text, match.index, match[0].length),
        });
      }
    }

    return violations;
  }

  // ==========================================================================
  // Calculation Methods
  // ==========================================================================

  /**
   * Group violations by type
   */
  private groupViolationsByType(
    violations: RegisterViolation[]
  ): Record<ViolationType, number> {
    const result: Record<ViolationType, number> = {
      contraction: 0,
      colloquialism: 0,
      slang: 0,
      first_person: 0,
      second_person: 0,
      hedging_casual: 0,
      intensifier_casual: 0,
      sentence_fragment: 0,
      rhetorical_question: 0,
      exclamation: 0,
      conjunction_start: 0,
      phrasal_verb: 0,
    };

    for (const v of violations) {
      result[v.type]++;
    }

    return result;
  }

  /**
   * Calculate register distribution
   */
  private calculateRegisterDistribution(
    text: string,
    violations: RegisterViolation[]
  ): Record<RegisterLevel, number> {
    const wordCount = this.countWords(text);
    if (wordCount === 0) {
      return { formal: 1, 'semi-formal': 0, informal: 0 };
    }

    // Count words in each register based on violations
    let informalWords = 0;
    let semiFormalWords = 0;

    for (const v of violations) {
      const words = this.countWords(v.text);
      if (v.detectedRegister === 'informal') {
        informalWords += words;
      } else if (v.detectedRegister === 'semi-formal') {
        semiFormalWords += words;
      }
    }

    const informalRatio = informalWords / wordCount;
    const semiFormalRatio = semiFormalWords / wordCount;
    const formalRatio = Math.max(0, 1 - informalRatio - semiFormalRatio);

    return {
      formal: Math.round(formalRatio * 100) / 100,
      'semi-formal': Math.round(semiFormalRatio * 100) / 100,
      informal: Math.round(informalRatio * 100) / 100,
    };
  }

  /**
   * Determine dominant register
   */
  private determineDominantRegister(
    distribution: Record<RegisterLevel, number>
  ): RegisterLevel {
    if (distribution.informal > 0.2) return 'informal';
    if (distribution['semi-formal'] > 0.3) return 'semi-formal';
    return 'formal';
  }

  /**
   * Calculate consistency score
   */
  private calculateConsistencyScore(
    text: string,
    violations: RegisterViolation[]
  ): number {
    const wordCount = this.countWords(text);
    if (wordCount === 0) return 1;

    // Base penalty per violation, weighted by severity
    let totalPenalty = 0;
    for (const v of violations) {
      totalPenalty += v.severity * (this.countWords(v.text) / wordCount);
    }

    // Additional penalty for register shifts (high variety of violation types)
    const violationTypes = new Set(violations.map(v => v.type)).size;
    const shiftPenalty = (violationTypes / 12) * 0.1; // Max 10% penalty for many types

    const score = Math.max(0, 1 - totalPenalty * 5 - shiftPenalty);
    return Math.round(score * 100) / 100;
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Extract context around a position
   */
  private extractContext(text: string, position: number, length: number): string {
    const window = this.config.contextWindow;
    const start = Math.max(0, position - window);
    const end = Math.min(text.length, position + length + window);
    return text.slice(start, end).replace(/\s+/g, ' ');
  }

  /**
   * Check if position is within a quotation
   */
  private isInQuotation(text: string, position: number): boolean {
    const beforeText = text.slice(0, position);
    const doubleQuotes = (beforeText.match(/"/g) || []).length;
    const singleQuotes = (beforeText.match(/'/g) || []).length;
    return doubleQuotes % 2 === 1 || singleQuotes % 2 === 1;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length;
  }

  /**
   * Count sentences in text
   */
  private countSentences(text: string): number {
    return (text.match(/[.!?]+/g) || []).length || 1;
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a register enforcer with default settings
 */
export function createRegisterEnforcer(
  config?: RegisterEnforcerConfig
): RegisterEnforcer {
  return new RegisterEnforcer(config);
}

/**
 * Create a strict academic register enforcer
 */
export function createStrictRegisterEnforcer(): RegisterEnforcer {
  return new RegisterEnforcer({
    targetRegister: 'formal',
    allowFirstPerson: false,
    allowRhetoricalQuestions: false,
    minSeverity: 0.2,
  });
}

/**
 * Create a permissive register enforcer (semi-formal OK)
 */
export function createPermissiveRegisterEnforcer(): RegisterEnforcer {
  return new RegisterEnforcer({
    targetRegister: 'semi-formal',
    allowFirstPerson: true,
    allowRhetoricalQuestions: true,
    minSeverity: 0.5,
  });
}

/**
 * Create a dissertation register enforcer (first person sometimes OK)
 */
export function createDissertationRegisterEnforcer(): RegisterEnforcer {
  return new RegisterEnforcer({
    targetRegister: 'formal',
    allowFirstPerson: true,  // "I argue" is common in dissertations
    allowRhetoricalQuestions: false,
    minSeverity: 0.3,
  });
}
