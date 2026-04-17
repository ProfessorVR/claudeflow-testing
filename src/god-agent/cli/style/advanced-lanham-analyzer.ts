/**
 * AdvancedLanhamAnalyzer - Tier 2 deep analysis implementation
 *
 * Delegates high-confidence axes (noun/verb, register) to the heuristic
 * LanhamProseAnalyzer and overrides low/medium-confidence axes with deeper
 * clause-level syntactic, semantic, and phonemic analysis.
 *
 * Upgrades:
 *   periodic/running:       LOW  -> MEDIUM  (clause-level suspension analysis)
 *   parataxis/hypotaxis:    MEDIUM -> HIGH  (nesting depth + implicit subordination)
 *   opacity:                MEDIUM -> MEDIUM (composite: self-ref + sound + tacit + genre-break)
 *   tacitPatterns:          MEDIUM -> MEDIUM (semantic chiasmus/antithesis)
 *
 * Pure TypeScript -- no external NLP libraries or LLM calls.
 */
import type { LanhamProseMetrics } from '../../universal/style-analyzer.js';
import type { ILanhamAnalyzer } from './lanham-analyzer-interface.js';
import { LanhamProseAnalyzer } from './lanham-prose-analyzer.js';
import { LanhamClauseParser } from './lanham-clause-parser.js';
import { GENRE_THRESHOLDS, type Genre, type LanhamThresholdConfig } from './lanham-style-policy.js';
import {
  tokenize, splitSentences, clamp, roughStem, getContentWords,
  tagPOS, isThatSubordinator, isFiniteVerbTag,
  assessSubordinationEvidence,
  suspensionMarkerDensity, splitClausesConservative,
  createEnPosBackend,
  COMMON_VERBS, COORDINATING_CONJ, SUBORDINATING_CONJ, FORMAL_MARKERS,
  META_LINGUISTIC_MARKERS, PREPOSITIONS,
} from './lanham-shared.js';
import {
  extractClauseFeatures,
  computeParataxisFromClauses,
  computePeriodicFromClauses,
  type ClauseDerivedFeatures,
} from './lanham-clause-features.js';

// ── Tier-2 only constants ───────────────────────────────────────────────────

/** Words whose presence signals relative clauses */
const RELATIVE_PRONOUNS = new Set(['who', 'whom', 'whose', 'which', 'that']);

/** Self-referential markers: text discussing its own linguistic form or medium.
 *  "this argument" is NOT self-referential — it refers to logical content.
 *  Only match patterns that explicitly foreground the text's own language/style. */
const SELF_REFERENTIAL_MARKERS = [
  /\b(I|we|one) (use|employ|adopt|choose|invoke|deploy) (the|this|that|a) (term|word|phrase|language|rhetoric|register|metaphor|trope)\b/gi,
  /\b(this|the) (passage|sentence|paragraph|section|text|prose|phrasing|diction|syntax)\b/gi,
  /\bmy (use|choice|deployment|phrasing|formulation) of (the |this |that )?(word|term|phrase|language)\b/gi,
  /\bto put (it|this|the point)\b/gi,
  /\b(strictly|loosely|technically|figuratively|literally|metaphorically) speaking\b/gi,
  /\b(scare quotes|quotation marks|emphasis)\b/gi,
];

/** Semantic opposition pairs for antithesis detection */
const SEMANTIC_OPPOSITIONS: [string, string][] = [
  ['not', 'but'], ['rather', 'than'], ['neither', 'nor'],
  ['less', 'more'], ['few', 'many'], ['old', 'new'],
  ['light', 'dark'], ['life', 'death'], ['presence', 'absence'],
  ['begin', 'end'], ['rise', 'fall'], ['first', 'last'],
  ['inner', 'outer'], ['public', 'private'], ['theory', 'practice'],
  ['form', 'content'], ['subject', 'object'], ['cause', 'effect'],
  ['whole', 'part'], ['abstract', 'concrete'], ['general', 'particular'],
  ['unity', 'plurality'], ['being', 'becoming'], ['static', 'dynamic'],
  ['freedom', 'constraint'], ['order', 'chaos'], ['truth', 'falsehood'],
  ['visible', 'invisible'], ['finite', 'infinite'], ['temporal', 'eternal'],
];

/** Informal markers (for genre-break detection).
 *  Excludes words common in academic prose (actually, really, just, like)
 *  to prevent false genre-break triggers in philosophical writing. */
const INFORMAL_MARKERS = new Set([
  'okay', 'ok', 'yeah', 'nope', 'stuff', 'pretty',
  'totally', 'anyway', 'anyways',
  'gonna', 'wanna', 'gotta', 'kinda', 'sorta',
]);

// ── Phoneme mapping for sub-word sound analysis ─────────────────────────────

/**
 * Map leading graphemes to approximate phonemic classes.
 * Used for consonance/assonance detection beyond initial-letter alliteration.
 */
const VOWEL_SOUNDS: Record<string, string> = {
  'a': 'A', 'ai': 'AY', 'ay': 'AY', 'au': 'AW', 'aw': 'AW',
  'e': 'E', 'ea': 'EE', 'ee': 'EE', 'ei': 'AY', 'ey': 'AY',
  'i': 'I', 'ie': 'EE', 'igh': 'EYE',
  'o': 'O', 'oa': 'OH', 'oo': 'OO', 'ou': 'OW', 'ow': 'OW', 'oi': 'OY', 'oy': 'OY',
  'u': 'U', 'ue': 'OO', 'ui': 'OO',
};

const CONSONANT_CLUSTERS: Record<string, string> = {
  'ph': 'F', 'gh': 'G', 'ch': 'CH', 'sh': 'SH', 'th': 'TH',
  'wh': 'W', 'ck': 'K', 'ng': 'NG', 'nk': 'NK',
  'qu': 'KW', 'wr': 'R', 'kn': 'N', 'gn': 'N',
};

/**
 * Extract approximate vowel-sound sequence from a word.
 * Returns an array of phonemic vowel labels.
 */
function extractVowelSounds(word: string): string[] {
  const w = word.toLowerCase();
  const sounds: string[] = [];
  let i = 0;
  while (i < w.length) {
    // Try 3-char, 2-char, 1-char vowel digraphs
    const tri = w.slice(i, i + 3);
    const di = w.slice(i, i + 2);
    const ch = w[i];
    if (VOWEL_SOUNDS[tri]) {
      sounds.push(VOWEL_SOUNDS[tri]);
      i += 3;
    } else if (VOWEL_SOUNDS[di]) {
      sounds.push(VOWEL_SOUNDS[di]);
      i += 2;
    } else if (VOWEL_SOUNDS[ch]) {
      sounds.push(VOWEL_SOUNDS[ch]);
      i += 1;
    } else {
      i += 1;
    }
  }
  return sounds;
}

/**
 * Extract approximate consonant-sound sequence from a word.
 * Returns an array of phonemic consonant labels.
 */
function extractConsonantSounds(word: string): string[] {
  const w = word.toLowerCase();
  const sounds: string[] = [];
  let i = 0;
  while (i < w.length) {
    const di = w.slice(i, i + 2);
    const ch = w[i];
    if (CONSONANT_CLUSTERS[di]) {
      sounds.push(CONSONANT_CLUSTERS[di]);
      i += 2;
    } else if (/[bcdfghjklmnpqrstvwxyz]/.test(ch)) {
      sounds.push(ch.toUpperCase());
      i += 1;
    } else {
      i += 1;
    }
  }
  return sounds;
}

// ── Clause splitting ────────────────────────────────────────────────────────

/** Split a sentence into clauses at commas, semicolons, colons, and dashes */
function splitClauses(sentence: string): string[] {
  return sentence
    .split(/\s*[,;:\u2014—–-]+\s*/)
    .map(c => c.trim())
    .filter(c => c.length > 0 && c.split(/\s+/).length >= 2);
}

// ── POS heuristic ───────────────────────────────────────────────────────────

type POSTag = 'N' | 'V' | 'ADJ' | 'ADV' | 'DET' | 'PREP' | 'CONJ' | 'PRON' | 'OTHER';

const DETERMINERS = new Set(['the', 'a', 'an', 'this', 'that', 'these', 'those', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'some', 'any', 'no', 'every', 'each', 'all', 'both', 'few', 'many', 'much', 'several']);
// 'that', 'this', 'these', 'those' removed — they overlap with DETERMINERS,
// which is checked first in heuristicPOS(). Keeping them here would be dead code.
const PRONOUNS = new Set(['i', 'me', 'my', 'mine', 'we', 'us', 'our', 'ours', 'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers', 'it', 'its', 'they', 'them', 'their', 'theirs', 'who', 'whom', 'whose', 'which', 'what', 'one', 'ones', 'self', 'myself', 'yourself', 'himself', 'herself', 'itself', 'ourselves', 'themselves']);
const ADJ_SUFFIXES = ['ful', 'less', 'ous', 'ive', 'able', 'ible', 'ical', 'ial', 'ent', 'ant'];
const ADV_SUFFIXES = ['ly'];

function heuristicPOS(word: string): POSTag {
  const w = word.toLowerCase().replace(/[^a-z']/g, '');
  if (!w) return 'OTHER';
  if (DETERMINERS.has(w)) return 'DET';
  if (PRONOUNS.has(w)) return 'PRON';
  if (PREPOSITIONS.has(w)) return 'PREP';
  if (COORDINATING_CONJ.has(w) || SUBORDINATING_CONJ.has(w)) return 'CONJ';
  if (COMMON_VERBS.has(w)) return 'V';
  // Morphological heuristics
  if (ADV_SUFFIXES.some(s => w.endsWith(s) && w.length > s.length + 3)) return 'ADV';
  if (ADJ_SUFFIXES.some(s => w.endsWith(s) && w.length > s.length + 2)) return 'ADJ';
  if (/^[a-z]+(ed|ing|es)$/.test(w) && w.length > 4) return 'V';
  if (/^[a-z]+(tion|sion|ment|ness|ity|ence|ance|ism)$/.test(w) && w.length > 5) return 'N';
  // Default: treat as noun (most open-class words in English)
  return 'N';
}

function tagSentence(sentence: string): Array<{ word: string; tag: POSTag }> {
  return sentence
    .split(/\s+/)
    .filter(w => w.length > 0)
    .map(w => ({ word: w, tag: heuristicPOS(w) }));
}

// ── Main class ──────────────────────────────────────────────────────────────

export class AdvancedLanhamAnalyzer implements ILanhamAnalyzer {
  private heuristic: LanhamProseAnalyzer;
  private clauseParser: LanhamClauseParser | null;
  private genre: Genre;

  constructor(genre: Genre = 'general') {
    this.genre = genre;
    this.heuristic = new LanhamProseAnalyzer(genre);
    // Clause parser for structural analysis (shadow mode for parataxis, ensemble for periodic)
    const backend = createEnPosBackend();
    this.clauseParser = backend ? new LanhamClauseParser({ backend }) : null;
  }

  // ── Full analysis orchestrator ─────────────────────────────────────────

  async fullAnalysis(text: string): Promise<LanhamProseMetrics> {
    // Step 1: Run the full heuristic analysis as our baseline
    const baseline = await this.heuristic.fullAnalysis(text);

    // Step 2: Run deep analysis for low/medium-confidence axes in parallel.
    // Opacity is delegated to Tier 1 (baseline) — the deep 4-signal composite
    // produces worse discrimination than Tier 1's simpler meta-linguistic heuristic.
    const [deepPeriodic, deepParaHypo, deepTacit] = await Promise.all([
      this.analyzePeriodicRunning(text),
      this.analyzeParataxisHypotaxis(text),
      this.detectTacitPatterns(text),
    ]);

    // Step 3: Override the baseline with deep results
    // Opacity and register are NOT overridden — delegated to Tier 1 heuristic.
    const merged: LanhamProseMetrics = {
      ...baseline,
      // Override periodic/running
      periodicRunningRatio: deepPeriodic.periodicRunningRatio ?? baseline.periodicRunningRatio,
      preMainVerbClauseCount: deepPeriodic.preMainVerbClauseCount ?? baseline.preMainVerbClauseCount,
      // Override parataxis/hypotaxis
      parataxisHypotaxisRatio: deepParaHypo.parataxisHypotaxisRatio ?? baseline.parataxisHypotaxisRatio,
      coordinatingConjunctionDensity: deepParaHypo.coordinatingConjunctionDensity ?? baseline.coordinatingConjunctionDensity,
      subordinatingConjunctionDensity: deepParaHypo.subordinatingConjunctionDensity ?? baseline.subordinatingConjunctionDensity,
      // Opacity: keep baseline (Tier 1) — deep composite has negative monotonicity
      // Register: keep baseline (Tier 1) — already high confidence
      // Override tacit patterns
      tacitPatterns: deepTacit.tacitPatterns ?? baseline.tacitPatterns,
    };

    // Step 4: Re-derive labels using the deep values
    const thresholds = GENRE_THRESHOLDS[this.genre];
    merged.labels = this.deriveLabels(merged, thresholds);

    // Step 5: Re-derive explanations with updated values
    merged.explanations = this.deriveExplanations(merged);

    // Step 6: Set analysis depth and confidence markers
    merged.analysisDepth = 'hybrid';
    merged.confidenceByAxis = {
      nounVerb: 'high',           // delegated to heuristic
      register: 'high',           // delegated to heuristic
      parataxisHypotaxis: 'high', // upgraded
      periodicRunning: 'medium',  // upgraded from low
      voice: 'medium',            // delegated to heuristic
      opacity: 'medium',          // upgraded
      tacitPatterns: 'medium',    // upgraded
    };

    return merged;
  }

  // ── Delegated axes (pass-through to heuristic) ─────────────────────────

  async analyzeNounVerbAxis(text: string): Promise<Partial<LanhamProseMetrics>> {
    return this.heuristic.analyzeNounVerbAxis(text);
  }

  async analyzeVoice(text: string): Promise<Partial<LanhamProseMetrics>> {
    return this.heuristic.analyzeVoice(text);
  }

  async analyzeRegister(text: string): Promise<Partial<LanhamProseMetrics>> {
    return this.heuristic.analyzeRegister(text);
  }

  // ── Deep Axis: Periodic/Running (Phase E Ensemble) ──────────────────────
  //
  // Ensemble of four complementary signals:
  //   E1. Left-branching index: POS-informed main verb word position / sentence length
  //   E2. Conservative clause splitter: clause-level verb position (fewer false splits)
  //   E3. Suspension marker density: structural markers of periodic construction
  //   E4. Sentence length signal: short average biases toward running style
  //
  // 0 = pure periodic, 1 = pure running (matches downstream convention)

  async analyzePeriodicRunning(text: string): Promise<Partial<LanhamProseMetrics>> {
    const sentences = splitSentences(text);
    if (sentences.length === 0) {
      return { periodicRunningRatio: 0.5, preMainVerbClauseCount: 0 };
    }

    // E1: Left-branching index — position of first finite verb / sentence length
    let totalLeftBranch = 0;
    let totalPreMainClauses = 0;

    for (const sent of sentences) {
      const sentWords = sent.split(/\s+/).filter(w => w.length > 0);
      if (sentWords.length < 3) {
        totalLeftBranch += 1; // very short = running
        continue;
      }

      const sentPOS = tagPOS(sentWords);
      let mainVerbPos = sentWords.length; // default: end (periodic)
      let inSubordinate = false;

      for (let i = 0; i < sentPOS.length; i++) {
        const w = sentPOS[i].word.toLowerCase().replace(/[^a-z']/g, '');
        const tag = sentPOS[i].tag;

        // Track subordinate clause entry
        if (SUBORDINATING_CONJ.has(w) || (w === 'that' && isThatSubordinator(tag))) {
          inSubordinate = true;
          continue;
        }
        // Exit subordinate at comma or coordinating conjunction
        if (inSubordinate && (sentPOS[i].word.endsWith(',') || COORDINATING_CONJ.has(w))) {
          inSubordinate = false;
          continue;
        }

        // Skip participles at start (participial phrases = periodic signal, not main verb)
        if (i < 3 && (tag === 'VBG' || tag === 'VBN')) continue;

        // First finite verb outside subordinate clause = main verb
        if (!inSubordinate && isFiniteVerbTag(tag)) {
          mainVerbPos = i;
          break;
        }
      }

      totalLeftBranch += sentWords.length > 0 ? mainVerbPos / sentWords.length : 0.5;

      // E2: Count pre-main-verb clauses using conservative splitter
      const conservClauses = splitClausesConservative(sent);
      let preMainCount = 0;
      for (let ci = 0; ci < conservClauses.length; ci++) {
        const cWords = conservClauses[ci].split(/\s+/).filter(w => w.length > 0);
        const cPOS = tagPOS(cWords);
        const firstWord = cWords[0]?.toLowerCase().replace(/[^a-z']/g, '') || '';
        if (cPOS.some(t => isFiniteVerbTag(t.tag)) && !SUBORDINATING_CONJ.has(firstWord)) {
          preMainCount = ci;
          break;
        }
      }
      totalPreMainClauses += preMainCount;
    }

    const avgLeftBranch = totalLeftBranch / sentences.length; // 0=verbs at start (running), 1=verbs at end (periodic)

    // E3: Suspension marker density (from lanham-shared D5)
    const suspMarkers = suspensionMarkerDensity(sentences);

    // E4: Sentence length signal — short avg = running tendency
    const avgSentLen = sentences.reduce((s, sent) => s + sent.split(/\s+/).length, 0) / sentences.length;
    const shortSentSignal = clamp((15 - avgSentLen) / 10); // <15 words avg = running lean

    // E4: Ensemble combination
    // Left-branching index: already 0=running (verb at start), 1=periodic (verb at end)
    // Invert so higher = more running (matches output convention)
    const leftBranchRunning = 1 - avgLeftBranch;
    // Suspension markers: invert so 0=lots of markers (periodic), 1=no markers (running)
    const suspRunning = 1 - clamp(suspMarkers / 0.3); // 0.3 markers/sent = saturated periodic

    // Clause-derived periodic signal: matrixDelay replaces leftBranch in the ensemble.
    // Ablation experiment C/G showed: matrixDelay as leftBranch replacement → 0.512 mono
    // (+0.033 over baseline 0.479). Correlation between leftBranch and matrixDelay is only
    // 0.29, meaning they measure genuinely different aspects of verb position.
    // matrixDelay uses the clause parser's two-pass matrix resolution, which is more
    // structurally aware than the POS-only left-branching index.
    let clauseMatrixDelay = leftBranchRunning; // fallback to leftBranch if parser unavailable
    if (this.clauseParser) {
      const clauseDoc = this.clauseParser.parseDocument(text);
      const clauseFeatures = extractClauseFeatures(clauseDoc);
      if (clauseFeatures.hasClauseData) {
        // matrixDelayMean: 0 = verb early (running), 1 = verb late (periodic)
        // Invert so higher = more running (matches output convention)
        clauseMatrixDelay = 1 - clamp(clauseFeatures.matrixDelayMean);
      }
    }

    // 3-signal ensemble with clause-derived matrixDelay replacing leftBranch
    // Validated: 0.512 mono (+0.033 over pre-clause baseline 0.479)
    const periodicRunningRatio = clamp(
      clauseMatrixDelay * 0.45 +
      suspRunning * 0.30 +
      shortSentSignal * 0.25
    );

    const preMainVerbClauseCount = sentences.length > 0
      ? totalPreMainClauses / sentences.length
      : 0;

    return {
      periodicRunningRatio,
      preMainVerbClauseCount,
    };
  }

  // ── Deep Axis: Parataxis/Hypotaxis ─────────────────────────────────────
  //
  // Beyond conjunction counting:
  //   1. Classify conjunctions as coordinating vs subordinating
  //   2. Detect implicit subordination: relative clauses (who/which/that + verb),
  //      participial phrases (-ing/-ed at clause boundaries)
  //   3. Measure nesting depth: maximum levels of subordination per sentence
  //   4. Score: weighted ratio of subordinating structures to total connectives

  async analyzeParataxisHypotaxis(text: string): Promise<Partial<LanhamProseMetrics>> {
    const words = tokenize(text);
    const sentences = splitSentences(text);
    const wordCount = words.length || 1;

    let coordCount = 0;
    let subordCount = 0;

    // Explicit conjunction counting (baseline)
    for (const w of words) {
      if (COORDINATING_CONJ.has(w)) coordCount++;
      if (SUBORDINATING_CONJ.has(w)) subordCount++;
    }

    // B3: POS-aware relative clause detection with "that" disambiguation
    let relativeClauses = 0;
    for (const sent of sentences) {
      const sentRawWords = sent.split(/\s+/).filter(w => w.length > 0);
      const sentPOS = tagPOS(sentRawWords);
      const sentWords = sentRawWords.map(w => w.toLowerCase().replace(/[^a-z']/g, ''));

      for (let i = 0; i < sentWords.length - 1; i++) {
        const w = sentWords[i];
        if (RELATIVE_PRONOUNS.has(w)) {
          // "that" requires POS disambiguation: only WDT/IN count as subordination
          if (w === 'that') {
            const posTag = sentPOS[i]?.tag || 'DT';
            if (!isThatSubordinator(posTag)) continue; // skip demonstrative "that"
          }
          // Check if followed (within 3 words) by a verb
          const lookahead = sentWords.slice(i + 1, i + 4);
          const hasVerb = lookahead.some(lw => COMMON_VERBS.has(lw) || (/^[a-z]+(ed|es|ing)$/.test(lw) && lw.length > 4));
          if (hasVerb) {
            relativeClauses++;
          }
        }
      }
    }

    // Detect participial phrases at clause boundaries (-ing/-ed after punctuation)
    let participialPhrases = 0;
    for (const sent of sentences) {
      const clauses = splitClauses(sent);
      for (let ci = 1; ci < clauses.length; ci++) {
        const firstWord = (clauses[ci].split(/\s+/)[0] || '').toLowerCase();
        if (/^[a-z]+(ing|ed)$/.test(firstWord) && firstWord.length > 4) {
          participialPhrases++;
        }
      }
    }

    // Measure nesting depth: count maximum levels of subordination per sentence
    let totalMaxNesting = 0;
    for (const sent of sentences) {
      let nestingDepth = 0;
      let maxNesting = 0;
      const sentWords = sent.split(/\s+/).map(w => w.toLowerCase().replace(/[^a-z']/g, ''));

      for (const w of sentWords) {
        if (SUBORDINATING_CONJ.has(w) || RELATIVE_PRONOUNS.has(w)) {
          nestingDepth++;
          if (nestingDepth > maxNesting) maxNesting = nestingDepth;
        }
        // Commas can signal clause boundary exits (crude but useful)
      }
      totalMaxNesting += maxNesting;
    }
    const avgMaxNesting = sentences.length > 0 ? totalMaxNesting / sentences.length : 0;

    // PLAN v2 A2: Graded evidence ladder for subordination weighting.
    // Uses canonical assessSubordinationEvidence() helper from lanham-shared.ts.
    const evidence = assessSubordinationEvidence(subordCount, relativeClauses, participialPhrases);
    const totalConnectives = coordCount + evidence.weightedTotal;

    const baseRatio = totalConnectives > 0
      ? evidence.weightedTotal / totalConnectives
      : 0.5;

    // Nesting depth bonus: reduced from 0.15 to 0.08, conditional on >=1 high-confidence cue
    const nestingBonus = evidence.nestingBonusAllowed
      ? clamp(avgMaxNesting / 3) * 0.08
      : 0;

    const parataxisHypotaxisRatio = clamp(baseRatio + nestingBonus);

    // Report densities using weighted evidence
    const coordinatingConjunctionDensity = coordCount / wordCount;
    const subordinatingConjunctionDensity = evidence.weightedTotal / wordCount;

    // Clause-derived parataxis (shadow mode — computed but not used for score)
    if (this.clauseParser) {
      const clauseDoc = this.clauseParser.parseDocument(text);
      const clauseFeatures = extractClauseFeatures(clauseDoc);
      if (clauseFeatures.hasClauseData) {
        const clauseParataxis = computeParataxisFromClauses(clauseFeatures);
        // Shadow: logged for calibration comparison, not blended into score
        // To activate: update AXIS_OWNERSHIP.parataxisHypotaxis.scoreSource to 'tier2'
      }
    }

    return {
      parataxisHypotaxisRatio,
      coordinatingConjunctionDensity,
      subordinatingConjunctionDensity,
    };
  }

  // ── Deep Axis: Opacity/Transparency ────────────────────────────────────
  //
  // Composite of four signals:
  //   1. Self-consciousness: meta-linguistic references + semantic self-reference
  //   2. Sound patterning: internal rhyme, assonance, consonance (phonemic, not initial)
  //   3. Tacit pattern density: from deep tacit pattern detection
  //   4. Genre-breaking: sudden register shifts = AT (attention-to-medium) moments

  /**
   * Deep opacity analysis — NOT called by fullAnalysis() (opacity is delegated to Tier 1
   * because the deep 4-signal composite produces worse monotonicity than the simpler heuristic).
   * Retained for interface compliance and potential future use.
   */
  async analyzeOpacityTransparency(
    text: string,
    cachedTacit?: Partial<LanhamProseMetrics>,
  ): Promise<Partial<LanhamProseMetrics>> {
    const sentences = splitSentences(text);
    const sentenceCount = sentences.length || 1;
    const words = tokenize(text);
    const contentWords = getContentWords(words);

    // --- Signal 1: Self-consciousness (meta-linguistic + semantic self-reference) ---
    let metaLinguisticCount = 0;
    for (const pat of META_LINGUISTIC_MARKERS) {
      const matches = text.match(pat);
      if (matches) metaLinguisticCount += matches.length;
    }

    let selfReferenceCount = 0;
    for (const pat of SELF_REFERENTIAL_MARKERS) {
      const matches = text.match(pat);
      if (matches) selfReferenceCount += matches.length;
    }

    const selfConsciousnessScore = clamp(
      (metaLinguisticCount + selfReferenceCount) / sentenceCount / 0.15,
    );

    // --- Signal 2: Sound patterning (phonemic level) ---

    // 2a: Assonance -- shared vowel sounds in nearby content words
    let assonanceHits = 0;
    for (let i = 0; i < contentWords.length - 1; i++) {
      const v1 = extractVowelSounds(contentWords[i]);
      const v2 = extractVowelSounds(contentWords[i + 1]);
      // Check for shared stressed vowel (first vowel as proxy for stress)
      if (v1.length > 0 && v2.length > 0 && v1[0] === v2[0]) {
        assonanceHits++;
      }
    }

    // 2b: Consonance -- shared consonant sounds at word endings
    let consonanceHits = 0;
    for (let i = 0; i < contentWords.length - 1; i++) {
      const c1 = extractConsonantSounds(contentWords[i]);
      const c2 = extractConsonantSounds(contentWords[i + 1]);
      if (c1.length > 0 && c2.length > 0 && c1[c1.length - 1] === c2[c2.length - 1]) {
        consonanceHits++;
      }
    }

    // 2c: Internal rhyme -- words within the same sentence sharing end-sounds
    let internalRhymeHits = 0;
    for (const sent of sentences) {
      const sentContentWords = getContentWords(tokenize(sent));
      for (let i = 0; i < sentContentWords.length - 1; i++) {
        for (let j = i + 1; j < Math.min(i + 6, sentContentWords.length); j++) {
          const w1 = sentContentWords[i];
          const w2 = sentContentWords[j];
          // Rhyme heuristic: shared ending of 3+ characters (not same word)
          if (w1 !== w2 && w1.length >= 4 && w2.length >= 4 &&
              w1.slice(-3) === w2.slice(-3)) {
            internalRhymeHits++;
          }
        }
      }
    }

    // 2d: Initial alliteration (carried over from heuristic for completeness)
    let alliterationHits = 0;
    for (let i = 0; i < contentWords.length - 2; i++) {
      const a = contentWords[i][0];
      const b = contentWords[i + 1]?.[0];
      const c = contentWords[i + 2]?.[0];
      if (a && a === b && b === c) alliterationHits++;
    }

    // Composite sound density: normalize each component by sentence count
    const soundDensity = clamp(
      (alliterationHits / sentenceCount / 0.3) * 0.25 +
      (assonanceHits / (contentWords.length || 1) / 0.3) * 0.25 +
      (consonanceHits / (contentWords.length || 1) / 0.3) * 0.25 +
      (internalRhymeHits / sentenceCount / 0.5) * 0.25,
    );

    // --- Signal 3: Tacit pattern density as opacity signal ---
    // BUG FIX #3: Reuse cached tacit result if provided, avoiding double computation
    const tacitResult = cachedTacit ?? await this.detectTacitPatterns(text);
    const tp = tacitResult.tacitPatterns;
    let tacitDensity = 0;
    if (tp) {
      const tacitTotal = (tp.anaphoraCount + tp.chiasmusCount + tp.antithesisCount +
        tp.isocolonCount + tp.climaxPatternCount) / sentenceCount;
      tacitDensity = clamp(tacitTotal / 0.3);
    }

    // --- Signal 4: Genre-breaking moments ---
    // Detect sudden register shifts: formal word followed by informal, or vice versa
    let genreBreakCount = 0;
    for (let i = 0; i < words.length - 1; i++) {
      const curr = words[i];
      const next = words[i + 1];
      if (!curr || !next) continue;
      const currFormal = FORMAL_MARKERS.has(curr);
      const nextInformal = INFORMAL_MARKERS.has(next);
      const currInformal = INFORMAL_MARKERS.has(curr);
      const nextFormal = FORMAL_MARKERS.has(next);
      if ((currFormal && nextInformal) || (currInformal && nextFormal)) {
        genreBreakCount++;
      }
    }
    // Also detect sentence-level register shifts
    let prevSentenceRegister: 'formal' | 'informal' | 'neutral' = 'neutral';
    for (const sent of sentences) {
      const sentWords = tokenize(sent);
      let formalHits = 0;
      let informalHits = 0;
      for (const w of sentWords) {
        if (FORMAL_MARKERS.has(w)) formalHits++;
        if (INFORMAL_MARKERS.has(w)) informalHits++;
      }
      const sentRegister: 'formal' | 'informal' | 'neutral' =
        formalHits > informalHits + 1 ? 'formal' :
        informalHits > formalHits + 1 ? 'informal' : 'neutral';

      if ((prevSentenceRegister === 'formal' && sentRegister === 'informal') ||
          (prevSentenceRegister === 'informal' && sentRegister === 'formal')) {
        genreBreakCount++;
      }
      prevSentenceRegister = sentRegister;
    }
    const genreBreakScore = clamp(genreBreakCount / sentenceCount / 0.1);

    // --- Composite opacity score ---
    // Gated approach: sound patterns and genre-breaking only amplify opacity
    // when self-consciousness or tacit density already indicates the prose
    // is drawing attention to its own medium. Without that gate, English's
    // natural sound patterns produce a ~0.3-0.5 baseline that drowns the signal.
    const baseOpacity = clamp(selfConsciousnessScore * 0.5 + tacitDensity * 0.3);
    const amplifier = baseOpacity > 0.15
      ? soundDensity * 0.15 + genreBreakScore * 0.05
      : 0; // sound/genre-break only contribute when base signals are present
    const opacityScore = clamp(baseOpacity + amplifier);

    return {
      opacityScore,
      selfConsciousnessScore,
    };
  }

  // ── Deep Axis: Tacit Patterns ──────────────────────────────────────────
  //
  // Upgrades chiasmus and antithesis detection from token-level to semantic:
  //   - Chiasmus: POS-based reversal (N-V-N reversed to N-V-N) + stem reversal
  //   - Antithesis: balanced clause-length symmetry + semantic opposition markers
  //
  // Other patterns (alliteration, polyptoton, anaphora, isocolon, climax) use
  // the heuristic implementations which are already adequate.

  async detectTacitPatterns(text: string): Promise<Partial<LanhamProseMetrics>> {
    const words = tokenize(text);
    const sentences = splitSentences(text);
    const contentWords = getContentWords(words);
    const sentenceCount = sentences.length || 1;

    // --- Alliteration (from heuristic -- adequate) ---
    let alliterationCount = 0;
    for (let i = 0; i < contentWords.length - 2; i++) {
      const a = contentWords[i][0];
      const b = contentWords[i + 1]?.[0];
      const c = contentWords[i + 2]?.[0];
      if (a && a === b && b === c && /[bcdfghjklmnpqrstvwxyz]/.test(a)) {
        alliterationCount++;
      }
    }
    const alliterationDensity = alliterationCount / sentenceCount;

    // --- Polyptoton (from heuristic -- adequate) ---
    let polyptotonCount = 0;
    const stems = contentWords.map(roughStem);
    for (let i = 0; i < stems.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 8, stems.length); j++) {
        if (stems[i] === stems[j] && contentWords[i] !== contentWords[j] && stems[i].length > 3) {
          polyptotonCount++;
          break;
        }
      }
    }
    const polyptotonDensity = polyptotonCount / sentenceCount;

    // --- Chiasmus: semantic + POS-based reversal detection ---
    let chiasmusCount = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      const s1 = sentences[i];
      const s2 = sentences[i + 1];

      // Method 1: Stem-based reversal (from heuristic, kept for recall)
      const s1Stems = tokenize(s1).map(roughStem).filter(s => s.length > 3);
      const s2Stems = tokenize(s2).map(roughStem).filter(s => s.length > 3);

      let foundStemChiasmus = false;
      for (let a = 0; a < s1Stems.length - 1 && !foundStemChiasmus; a++) {
        for (let b = a + 1; b < Math.min(a + 5, s1Stems.length) && !foundStemChiasmus; b++) {
          const stemA = s1Stems[a];
          const stemB = s1Stems[b];
          if (stemA === stemB) continue;
          const idxB = s2Stems.indexOf(stemB);
          if (idxB >= 0) {
            const idxA = s2Stems.indexOf(stemA, idxB + 1);
            if (idxA > idxB) {
              chiasmusCount++;
              foundStemChiasmus = true;
            }
          }
        }
      }

      // Method 2: POS-based reversal (new -- detect N-V-N reversed to N-V-N patterns)
      if (!foundStemChiasmus) {
        const tags1 = tagSentence(s1);
        const tags2 = tagSentence(s2);

        // Extract POS trigrams and check for reversal
        const trigrams1 = extractPOSTrigrams(tags1);
        const trigrams2 = extractPOSTrigrams(tags2);

        for (const t1 of trigrams1) {
          for (const t2 of trigrams2) {
            // Check if POS pattern is reversed: e.g., N-V-ADJ in s1 maps to ADJ-V-N in s2
            if (t1.pattern[0] === t2.pattern[2] &&
                t1.pattern[1] === t2.pattern[1] &&
                t1.pattern[2] === t2.pattern[0] &&
                t1.pattern[0] !== t1.pattern[2]) {
              chiasmusCount++;
              break;
            }
          }
          if (chiasmusCount > i + 1) break; // limit overcounting
        }
      }
    }

    // Also check within single sentences (clauses separated by semicolons/colons)
    for (const sent of sentences) {
      const clauses = sent.split(/\s*[;:]\s*/).filter(c => c.trim().length > 0 && c.split(/\s+/).length >= 3);
      if (clauses.length < 2) continue;

      for (let ci = 0; ci < clauses.length - 1; ci++) {
        const tags1 = tagSentence(clauses[ci]);
        const tags2 = tagSentence(clauses[ci + 1]);
        const stems1 = tokenize(clauses[ci]).map(roughStem).filter(s => s.length > 3);
        const stems2 = tokenize(clauses[ci + 1]).map(roughStem).filter(s => s.length > 3);

        // Stem reversal within clause pairs
        for (let a = 0; a < stems1.length - 1; a++) {
          for (let b = a + 1; b < Math.min(a + 4, stems1.length); b++) {
            if (stems1[a] === stems1[b]) continue;
            const idxB = stems2.indexOf(stems1[b]);
            if (idxB >= 0) {
              const idxA = stems2.indexOf(stems1[a], idxB + 1);
              if (idxA > idxB) {
                chiasmusCount++;
                break;
              }
            }
          }
        }
      }
    }

    // --- Antithesis: semantic opposition + balanced clause structure ---
    let antithesisCount = 0;

    // Method 1: Explicit opposition pairs with proximity check (improved from heuristic)
    const textLower = text.toLowerCase();
    for (const [a, b] of SEMANTIC_OPPOSITIONS) {
      const re = new RegExp(`\\b${a}\\b[^.]{1,60}\\b${b}\\b`, 'gi');
      const matches = textLower.match(re);
      if (matches) antithesisCount += matches.length;
    }

    // Method 2: Balanced antithetical structures (ABAB) using clause-length symmetry
    // + opposition markers (not/but/yet/however)
    const oppositionMarkers = /\b(not|but|yet|however|rather|instead|whereas|while|although)\b/i;
    for (const sent of sentences) {
      const clauses = splitClauses(sent);
      if (clauses.length < 2) continue;

      for (let ci = 0; ci < clauses.length - 1; ci++) {
        const c1 = clauses[ci];
        const c2 = clauses[ci + 1];
        const len1 = c1.split(/\s+/).length;
        const len2 = c2.split(/\s+/).length;
        const maxLen = Math.max(len1, len2);

        // Balanced length (within 30%) + opposition marker in the junction
        if (maxLen > 3 && Math.abs(len1 - len2) / maxLen <= 0.30) {
          // Check if there is an opposition marker at the boundary
          const hasOpposition = oppositionMarkers.test(c2.split(/\s+/)[0] || '') ||
                                oppositionMarkers.test(c1.split(/\s+/).slice(-1)[0] || '');
          if (hasOpposition) {
            antithesisCount++;
          }
        }
      }
    }

    // --- Anaphora (from heuristic -- adequate) ---
    let anaphoraCount = 0;
    for (let i = 0; i < sentences.length - 2; i++) {
      const open1 = sentences[i].split(/\s+/).slice(0, 3).join(' ').toLowerCase();
      const open2 = sentences[i + 1].split(/\s+/).slice(0, 3).join(' ').toLowerCase();
      const open3 = sentences[i + 2].split(/\s+/).slice(0, 3).join(' ').toLowerCase();
      if (open1 === open2 && open2 === open3 && open1.length > 4) {
        anaphoraCount++;
      }
    }

    // --- Isocolon (from heuristic -- adequate) ---
    let isocolonCount = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      const len1 = sentences[i].split(/\s+/).length;
      const len2 = sentences[i + 1].split(/\s+/).length;
      const maxLen = Math.max(len1, len2);
      if (maxLen > 0 && Math.abs(len1 - len2) / maxLen <= 0.20) {
        if (i + 2 < sentences.length) {
          const len3 = sentences[i + 2].split(/\s+/).length;
          if (Math.abs(len2 - len3) / Math.max(len2, len3) <= 0.20) {
            isocolonCount++;
          }
        }
      }
    }

    // --- Climax pattern (from heuristic -- adequate) ---
    let climaxPatternCount = 0;
    for (let i = 0; i < sentences.length - 2; i++) {
      const l1 = sentences[i].split(/\s+/).length;
      const l2 = sentences[i + 1].split(/\s+/).length;
      const l3 = sentences[i + 2].split(/\s+/).length;
      if (l1 < l2 && l2 < l3 && (l3 - l1) >= 5) {
        climaxPatternCount++;
      }
    }

    return {
      tacitPatterns: {
        alliterationDensity,
        polyptotonDensity,
        chiasmusCount,
        antithesisCount,
        anaphoraCount,
        isocolonCount,
        climaxPatternCount,
      },
    };
  }

  // ── Label derivation (mirrors heuristic tier with bug fixes) ──────────

  private deriveLabels(
    m: Partial<LanhamProseMetrics>,
    t: LanhamThresholdConfig,
  ): LanhamProseMetrics['labels'] {
    const nvr = m.nounVerbRatio ?? 0.5;
    const phr = m.parataxisHypotaxisRatio ?? 0.5;
    const prr = m.periodicRunningRatio ?? 0.5;
    const vs = m.voiceScore ?? 0.5;
    const os = m.opacityScore ?? 0.5;

    // PLAN v2 FIX A1: Align Tier 2 register labels with Tier 1's rms-based approach.
    // The previous lgr-based path was catastrophically broken: observed lgr range 0.000–0.216
    // against general genre thresholds lowToMiddle=0.25 caused ALL passages to label "low."
    // The registerMarkednessScore (rms) is a directional composite (0=low, 0.5=middle, 1=high)
    // that already incorporates Latinate ratio, polysyllabic density, formal markers, sentence
    // length, and word length — making it a better label discriminator than raw lgr alone.
    const rms = m.registerMarkednessScore ?? 0.5;
    let primaryRegister: 'high' | 'middle' | 'low' | 'mixed';
    let registerMixed = false;
    if (rms >= 0.62) {
      primaryRegister = 'high';
    } else if (rms <= 0.38) {
      primaryRegister = 'low';
    } else {
      primaryRegister = 'middle';
    }

    // Noun/verb label: standard band-based derivation
    let nounVerb: 'predominantly noun-style' | 'balanced' | 'predominantly verb-style';
    if (nvr < t.nounVerb.lowBand) {
      nounVerb = 'predominantly noun-style';
    } else if (nvr > t.nounVerb.highBand) {
      nounVerb = 'predominantly verb-style';
    } else {
      nounVerb = 'balanced';
    }

    // BUG FIX #2: Signal-based noun-style override (ported from Tier 1).
    // When the classic Lanham noun-style triad (nominalization + be-verbs + PP piling)
    // all exceed genre-specific thresholds, override "balanced" to
    // "predominantly noun-style".
    if (nounVerb === 'balanced' && t.nounStyleOverride) {
      const nso = t.nounStyleOverride;
      const nomDensity = m.nominalizationDensity ?? 0;
      const beRatio = m.beVerbRatio ?? 0;
      const ppDensity = m.prepositionalPhraseDensity ?? 0;
      if (nomDensity > nso.nominalizationDensity
        && beRatio > nso.beVerbRatio
        && ppDensity > nso.prepositionalPhraseDensity) {
        nounVerb = 'predominantly noun-style';
      }
    }

    return {
      nounVerb,
      parataxisHypotaxis: phr < t.parataxisHypotaxis.lowBand
        ? 'predominantly paratactic'
        : phr > t.parataxisHypotaxis.highBand
          ? 'predominantly hypotactic'
          : 'mixed',
      periodicRunning: prr < t.periodicRunning.lowBand
        ? 'predominantly periodic'
        : prr > t.periodicRunning.highBand
          ? 'predominantly running'
          : 'mixed',
      voice: vs < t.voice.lowBand
        ? 'unvoiced'
        : vs > t.voice.highBand
          ? 'strongly voiced'
          : 'moderate voice',
      primaryRegister,
      registerMixed,
      opacity: os < t.opacity.lowBand
        ? 'transparent'
        : os > t.opacity.highBand
          ? 'opaque'
          : 'mixed opacity',
    };
  }

  // ── Explanation generation ─────────────────────────────────────────────

  private deriveExplanations(m: LanhamProseMetrics): LanhamProseMetrics['explanations'] {
    const nvr = m.nounVerbRatio;
    const phr = m.parataxisHypotaxisRatio;
    const prr = m.periodicRunningRatio;
    const vs = m.voiceScore;
    const lgr = m.latinateGermanicRatio;
    const rms = m.registerMarkednessScore;
    const os = m.opacityScore;
    const tp = m.tacitPatterns;

    // Noun/Verb
    let nounVerbExpl: string;
    if (nvr < 0.35) {
      nounVerbExpl = `Heavy nominalization (${m.nominalizationDensity.toFixed(1)}/100 words) and be-verb reliance (${(m.beVerbRatio * 100).toFixed(0)}%) create a dense, noun-heavy texture with ${m.prepositionalPhraseDensity.toFixed(1)} prepositional phrases per sentence.`;
    } else if (nvr > 0.65) {
      nounVerbExpl = `Active verb choices dominate with low nominalization (${m.nominalizationDensity.toFixed(1)}/100 words), producing a dynamic, action-oriented prose rhythm.`;
    } else {
      nounVerbExpl = `Balanced noun-verb ratio with moderate nominalization (${m.nominalizationDensity.toFixed(1)}/100 words) and ${m.prepositionalPhraseDensity.toFixed(1)} prepositional phrases per sentence.`;
    }

    // Parataxis/Hypotaxis (upgraded explanation)
    let paraExpl: string;
    if (phr < 0.35) {
      paraExpl = `Predominantly paratactic: coordinate structures (and/but/or) link independent clauses with minimal subordination or embedding.`;
    } else if (phr > 0.65) {
      paraExpl = `Densely hypotactic: frequent subordination via explicit subordinators, relative clauses, and participial phrases. Clause nesting creates multi-layered sentence architectures.`;
    } else {
      paraExpl = `Mixed coordination and subordination. Explicit subordinators interleave with relative clauses and participial phrases, producing varied clause relationships.`;
    }

    // Periodic/Running (upgraded explanation)
    let perExpl: string;
    if (prr < 0.35) {
      perExpl = `Periodic architecture: main predication is systematically delayed behind introductory clauses and modifiers (avg ${m.preMainVerbClauseCount.toFixed(1)} pre-verb clauses). Clause-level analysis confirms genuine syntactic suspension.`;
    } else if (prr > 0.65) {
      perExpl = `Running style: sentences deliver their main clause early and accumulate trailing modifiers, qualifications, and extensions.`;
    } else {
      perExpl = `Mixed sentence architecture: periodic suspension and running delivery alternate at roughly equal frequency (avg ${m.preMainVerbClauseCount.toFixed(1)} pre-verb clauses).`;
    }

    // Voice
    let voiceExpl: string;
    if (vs < 0.30) {
      voiceExpl = `Effaced authorial presence with minimal rhythmic variety (dynamic range ${m.dynamicRange.toFixed(2)}). The prose foregrounds content over personality.`;
    } else if (vs > 0.70) {
      voiceExpl = `Strongly voiced: high rhythmic variety (dynamic range ${m.dynamicRange.toFixed(2)}) combined with conspicuous authorial presence and personality markers.`;
    } else {
      voiceExpl = `Moderate voice: some rhythmic variety (dynamic range ${m.dynamicRange.toFixed(2)}) with intermittent personality markers.`;
    }

    // Register
    let regExpl: string;
    if (rms < 0.25) {
      regExpl = `Unmarked middle register — neither notably formal nor informal. Latinate ratio ${(lgr * 100).toFixed(0)}%.`;
    } else if (lgr > 0.55) {
      regExpl = `High register marked by Latinate vocabulary (${(lgr * 100).toFixed(0)}% ratio) and formal diction. Markedness ${(rms * 100).toFixed(0)}%.`;
    } else if (lgr < 0.35) {
      regExpl = `Low register with predominantly Germanic/short vocabulary (${((1 - lgr) * 100).toFixed(0)}% non-Latinate). Markedness ${(rms * 100).toFixed(0)}%.`;
    } else {
      regExpl = `Mixed register oscillating between formal and informal poles. Latinate ratio ${(lgr * 100).toFixed(0)}%, markedness ${(rms * 100).toFixed(0)}%.`;
    }

    // Opacity (upgraded explanation)
    let opaExpl: string;
    if (os < 0.25) {
      opaExpl = `Transparent prose: minimal self-consciousness, sound patterning, or register play. Language operates as a clear window onto content.`;
    } else if (os > 0.60) {
      opaExpl = `Opaque prose: self-conscious attention to language (meta-linguistic markers, semantic self-reference), phonemic patterning (assonance, consonance, internal rhyme), tacit persuasion figures, and register shifts foreground the medium.`;
    } else {
      opaExpl = `Mixed opacity: intermittent self-conscious passages, moderate sound patterning, and occasional tacit figures amid predominantly transparent prose.`;
    }

    // Tacit patterns summary
    const tacitParts: string[] = [];
    if (tp.alliterationDensity > 0.1) tacitParts.push(`alliteration (${tp.alliterationDensity.toFixed(2)}/sent)`);
    if (tp.polyptotonDensity > 0.05) tacitParts.push(`polyptoton (${tp.polyptotonDensity.toFixed(2)}/sent)`);
    if (tp.chiasmusCount > 0) tacitParts.push(`chiasmus (${tp.chiasmusCount}; stem + POS reversal)`);
    if (tp.antithesisCount > 0) tacitParts.push(`antithesis (${tp.antithesisCount}; semantic opposition + balanced clauses)`);
    if (tp.anaphoraCount > 0) tacitParts.push(`anaphora (${tp.anaphoraCount})`);
    if (tp.isocolonCount > 0) tacitParts.push(`isocolon (${tp.isocolonCount})`);
    if (tp.climaxPatternCount > 0) tacitParts.push(`climax patterns (${tp.climaxPatternCount})`);
    const tacitExpl = tacitParts.length > 0
      ? `Detected tacit persuasion figures (deep analysis): ${tacitParts.join('; ')}.`
      : 'No tacit persuasion figures detected at the deep analysis threshold.';

    return {
      nounVerb: nounVerbExpl,
      parataxisHypotaxis: paraExpl,
      periodicRunning: perExpl,
      voice: voiceExpl,
      register: regExpl,
      opacity: opaExpl,
      tacitPatterns: tacitExpl,
    };
  }
}

// ── Internal helpers ────────────────────────────────────────────────────────

interface POSTrigram {
  pattern: [POSTag, POSTag, POSTag];
  words: [string, string, string];
}

/** Extract POS trigrams from a tagged sentence (for chiasmus detection) */
function extractPOSTrigrams(tagged: Array<{ word: string; tag: POSTag }>): POSTrigram[] {
  const trigrams: POSTrigram[] = [];
  // Only consider content-bearing POS: N, V, ADJ, ADV
  const contentTags = new Set<POSTag>(['N', 'V', 'ADJ', 'ADV']);
  const filtered = tagged.filter(t => contentTags.has(t.tag));

  for (let i = 0; i < filtered.length - 2; i++) {
    trigrams.push({
      pattern: [filtered[i].tag, filtered[i + 1].tag, filtered[i + 2].tag],
      words: [filtered[i].word, filtered[i + 1].word, filtered[i + 2].word],
    });
  }
  return trigrams;
}
