/**
 * lanham-shared.ts - Shared constants and utility functions for Lanham analyzers
 *
 * Extracted from lanham-prose-analyzer.ts (Tier 1) and advanced-lanham-analyzer.ts (Tier 2)
 * to eliminate ~450 lines of duplication. Tier 1 versions are canonical.
 *
 * PURE REFACTOR: zero behavioral changes.
 */

// ── POS Tagging (Plan v2 Phase B backbone) ──────────────────────────────────

import { createRequire } from 'module';

let _TagClass: any = null;
function getTagClass(): any {
  if (_TagClass === null) {
    try {
      // en-pos is a CJS module; use createRequire for ESM compatibility
      const require_ = createRequire(import.meta.url);
      const enpos = require_('en-pos');
      _TagClass = enpos.Tag;
    } catch {
      // Graceful fallback: if en-pos is not installed, tagPOS returns empty array
      _TagClass = undefined;
    }
  }
  return _TagClass;
}

export interface POSToken {
  word: string;
  tag: string; // Penn Treebank tags: NN, VBD, DT, WDT, IN, JJ, RB, VBZ, VBP, VBG, VBN, MD, etc.
}

/**
 * POS-tag an array of words using en-pos (96.43% Penn Treebank accuracy).
 * Returns empty array if en-pos is not available.
 */
export function tagPOS(words: string[]): POSToken[] {
  const TagCls = getTagClass();
  if (!TagCls || words.length === 0) return [];
  try {
    const tags: string[] = new TagCls(words).initial().smooth().tags;
    return words.map((word, i) => ({ word, tag: tags[i] || 'NN' }));
  } catch {
    return [];
  }
}

// ── Clause parser backend adapter ────────────────────────────────────────────

import type { ClauseParserBackend } from './lanham-clause-parser.js';

/**
 * Create a ClauseParserBackend using the existing en-pos POS tagger.
 * parse() returns undefined — no dependency parser on day one.
 */
export function createEnPosBackend(): ClauseParserBackend | null {
  const TagCls = getTagClass();
  if (!TagCls) return null;

  return {
    tag(tokens: string[]): Array<{ pos: string; lemma?: string }> {
      if (tokens.length === 0) return [];
      try {
        const tags: string[] = new TagCls(tokens).initial().smooth().tags;
        return tokens.map((_, i) => ({ pos: tags[i] || 'NN' }));
      } catch {
        return tokens.map(() => ({ pos: 'NN' }));
      }
    },
    // parse() intentionally undefined — POS-only backend for now
  };
}

/**
 * Check if a POS tag represents a finite verb (not a participle or infinitive).
 * Finite: VBZ (3sg present), VBP (non-3sg present), VBD (past), MD (modal)
 * Non-finite: VBG (gerund/participle), VBN (past participle), VB (base/infinitive)
 */
export function isFiniteVerbTag(tag: string): boolean {
  return tag === 'VBZ' || tag === 'VBP' || tag === 'VBD' || tag === 'MD';
}

/**
 * Check if a POS tag represents any verb form.
 */
export function isVerbTag(tag: string): boolean {
  return tag === 'VB' || tag === 'VBD' || tag === 'VBG' || tag === 'VBN' || tag === 'VBP' || tag === 'VBZ' || tag === 'MD';
}

/**
 * Check if "that" at a given POS tag is a subordination signal.
 * WDT = relative pronoun ("the book that fell") → subordination
 * IN = complementizer ("he said that") → subordination
 * DT = demonstrative ("that book") → NOT subordination
 */
export function isThatSubordinator(tag: string): boolean {
  return tag === 'WDT' || tag === 'IN';
}

// ── Constants ────────────────────────────────────────────────────────────────

export const BE_VERBS = new Set(['is', 'are', 'was', 'were', 'been', 'being', 'am']);

export const COMMON_VERBS = new Set([
  'is', 'are', 'was', 'were', 'been', 'being', 'am',
  'have', 'has', 'had', 'do', 'does', 'did',
  'say', 'said', 'says', 'make', 'made', 'makes',
  'go', 'goes', 'went', 'gone', 'take', 'took', 'taken',
  'come', 'came', 'give', 'gave', 'given',
  'find', 'found', 'think', 'thought', 'know', 'knew', 'known',
  'get', 'got', 'gotten', 'see', 'saw', 'seen',
  'want', 'wanted', 'use', 'used', 'tell', 'told',
  'ask', 'asked', 'work', 'worked', 'seem', 'seemed',
  'try', 'tried', 'leave', 'left', 'call', 'called',
  'need', 'needed', 'become', 'became', 'keep', 'kept',
  'let', 'begin', 'began', 'begun', 'show', 'showed', 'shown',
  'hear', 'heard', 'play', 'played', 'run', 'ran',
  'move', 'moved', 'live', 'lived', 'believe', 'believed',
  'bring', 'brought', 'happen', 'happened', 'write', 'wrote', 'written',
  'provide', 'provided', 'sit', 'sat', 'stand', 'stood',
  'lose', 'lost', 'pay', 'paid', 'meet', 'met',
  'include', 'included', 'continue', 'continued',
  'set', 'learn', 'learned', 'change', 'changed',
  'lead', 'led', 'understand', 'understood', 'watch', 'watched',
  'follow', 'followed', 'stop', 'stopped', 'create', 'created',
  'speak', 'spoke', 'spoken', 'read', 'allow', 'allowed',
  'add', 'added', 'grow', 'grew', 'grown', 'open', 'opened',
  'walk', 'walked', 'win', 'won', 'offer', 'offered',
  'remember', 'remembered', 'consider', 'considered',
  'appear', 'appeared', 'buy', 'bought', 'serve', 'served',
  'die', 'died', 'send', 'sent', 'build', 'built',
  'stay', 'stayed', 'fall', 'fell', 'fallen', 'cut',
  'reach', 'reached', 'kill', 'killed', 'remain', 'remained',
  'suggest', 'suggested', 'raise', 'raised', 'pass', 'passed',
  'sell', 'sold', 'require', 'required', 'report', 'reported',
  'decide', 'decided', 'pull', 'pulled', 'develop', 'developed',
  'argues', 'argue', 'argued', 'contends', 'contend', 'contended',
  'claims', 'claim', 'claimed', 'asserts', 'assert', 'asserted',
  'maintains', 'maintain', 'maintained', 'observes', 'observe', 'observed',
  'notes', 'note', 'noted', 'suggests', 'indicates', 'indicate', 'indicated',
  'demonstrates', 'demonstrate', 'demonstrated',
  'reveals', 'reveal', 'revealed', 'establishes', 'establish', 'established',
  'examines', 'examine', 'examined', 'explores', 'explore', 'explored',
  'analyzes', 'analyze', 'analyzed', 'investigates', 'investigate', 'investigated',
]);

export const NOMINALIZATION_SUFFIXES = ['tion', 'sion', 'ment', 'ness', 'ity', 'ence', 'ance', 'ism', 'ure'];

export const LATINATE_SUFFIXES = [
  'tion', 'sion', 'ment', 'ance', 'ence', 'ity', 'ous',
  'ive', 'able', 'ible', 'al', 'ual',
];

export const PREPOSITIONS = new Set([
  'of', 'in', 'to', 'for', 'with', 'on', 'at', 'from', 'by',
  'about', 'as', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'under', 'along', 'until',
  'without', 'toward', 'towards', 'upon', 'across', 'against',
  'among', 'behind', 'beyond', 'within', 'throughout', 'beside',
  'besides', 'despite', 'concerning', 'regarding', 'per', 'via',
]);

export const COORDINATING_CONJ = new Set(['and', 'but', 'or', 'nor', 'for', 'yet', 'so']);

export const SUBORDINATING_CONJ = new Set([
  'although', 'because', 'since', 'unless', 'while', 'whereas',
  'when', 'where', 'if', 'though', 'after', 'before', 'until',
  'once', 'whenever', 'wherever', 'whether', 'provided', 'supposing',
  'inasmuch', 'insofar', 'notwithstanding', 'albeit', 'lest',
]);

export const FORMAL_MARKERS = new Set([
  'furthermore', 'moreover', 'nevertheless', 'notwithstanding',
  'consequently', 'subsequently', 'henceforth', 'whereby', 'wherein',
  'therein', 'thereof', 'herein', 'aforementioned', 'heretofore',
  'thus', 'hence', 'accordingly', 'indeed', 'nonetheless',
]);

// WARNING: These regexes use the /g flag. Only use with .match() or .matchAll().
// Never use with .test() or .exec() — the lastIndex state persists between calls.

/** Tier 1 fixed version: genuine meta-linguistic references only (no concept/notion) */
export const META_LINGUISTIC_MARKERS = [
  // Genuine meta-linguistic references: prose commenting on its own language
  /\bthe (word|term|phrase|expression|name|label|designation)\b/gi,
  /\bso[- ]called\b/gi,
  /\bqua\b/gi,
  /\bin (the )?(sense|way) (that|in which)\b/gi,
  /\bwhat (we|I) (mean|call|term)\b/gi,
  /\bas (it were|such)\b/gi,
  /\bin other words\b/gi,
  /\bthat is to say\b/gi,
];

// WARNING: These regexes use the /g flag. Only use with .match() or .matchAll().
// Never use with .test() or .exec() — the lastIndex state persists between calls.

/** Content-level opacity signals: prose ABOUT language, form, style, or rhetoric */
export const OPACITY_CONTENT_MARKERS = [
  /\b(prose|syntax|sentence|paragraph|diction|style|rhetoric|rhythm|cadence)\b/gi,
  /\b(language|discourse|text|narrative form|literary form|formal properties)\b/gi,
  /\b(metaphor|figure|trope|irony|allusion|echo|register|voice)\b.*\b(itself|here|this|own)\b/gi,
  /\b(reading|writing|composing|phrasing)\b.*\b(as|itself|own|practice)\b/gi,
  /\b(sound|acoustic|phonetic|alliterat|assonan|rhythm)\b/gi,
  /\b(foreground|self-conscious|self-referent|draws attention to)\b/gi,
];

// WARNING: These regexes use the /g flag. Only use with .match() or .matchAll().
// Never use with .test() or .exec() — the lastIndex state persists between calls.
export const PERSONALITY_MARKERS = [
  /\bI (believe|think|argue|contend|suggest|maintain|hold)\b/gi,
  /\b(my|our) (view|position|argument|contention|claim)\b/gi,
  /\bit (seems|appears) (to me|clear|evident)\b/gi,
  /\b(crucially|importantly|strikingly|remarkably|notably)\b/gi,
  /\b(indeed|surely|certainly|undoubtedly|plainly)\b/gi,
  // Rhetorical/oratorical markers (broadened for voiced non-first-person prose)
  /\bwe (shall|will|must|can|cannot)\b/gi,
  /\blet us\b/gi,
  /\b(never|always|forever)\b\s+\b(shall|will|must|can|cannot|again|forget)\b/gi,
  /\b(hear me|listen|mark my words|remember)\b/gi,
  /\b(she|he) (breathed|listened|watched|felt|saw|heard|tasted|smelled)\b/gi,
];

// ── Utility functions ────────────────────────────────────────────────────────

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

export function splitSentences(text: string): string[] {
  return text
    .replace(/\|/g, '<<PIPE>>')
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.replace(/<<PIPE>>/g, '|').trim())
    .filter(s => s.length > 0 && s.split(/\s+/).length > 2);
}

export function clamp(v: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, v));
}

export function isVerb(word: string): boolean {
  const w = word.toLowerCase();
  if (COMMON_VERBS.has(w)) return true;
  // Heuristic: regular past tense / present participle / 3rd-person-s
  if (/^[a-z]+(ed|ing|es)$/.test(w) && w.length > 4) return true;
  return false;
}

const NOM_EXCLUSIONS = new Set([
  'question', 'fortune', 'nature', 'culture', 'adventure', 'furniture',
  'picture', 'mixture', 'creature', 'structure', 'feature', 'future',
  'capture', 'lecture', 'gesture', 'posture', 'moisture', 'nation',
  'station', 'fashion', 'passion', 'version', 'tension', 'mention',
  'attention', 'position', 'condition', 'tradition', 'opinion',
  'religion', 'region', 'union', 'lesson', 'reason', 'season', 'person',
]);

export function isNominalization(word: string): boolean {
  const w = word.toLowerCase();
  if (w.length < 6) return false;
  if (NOM_EXCLUSIONS.has(w)) return false;
  return NOMINALIZATION_SUFFIXES.some(s => w.endsWith(s));
}

export function isLatinate(word: string): boolean {
  const w = word.toLowerCase();
  if (w.length < 5) return false;
  return LATINATE_SUFFIXES.some(s => w.endsWith(s));
}

/** Rough stem: strip common suffixes for comparison */
export function roughStem(word: string): string {
  let w = word.toLowerCase();
  const suffixes = ['tion', 'sion', 'ment', 'ness', 'ity', 'ence', 'ance', 'ing', 'ed', 'ly', 'er', 'est', 'ous', 'ive', 'al', 'es', 's'];
  for (const s of suffixes) {
    if (w.length > s.length + 3 && w.endsWith(s)) {
      w = w.slice(0, -s.length);
      break;
    }
  }
  return w;
}

export function getContentWords(words: string[]): string[] {
  const STOP = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'shall', 'should', 'may', 'might', 'can', 'could', 'not', 'no', 'nor',
    'so', 'yet', 'this', 'that', 'these', 'those', 'it', 'its', 'he', 'she',
    'they', 'we', 'i', 'you', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
    'his', 'our', 'their', 'which', 'who', 'whom', 'what', 'if', 'then',
    'than', 'as', 'up', 'about', 'into', 'through', 'after', 'before',
  ]);
  return words.filter(w => !STOP.has(w.toLowerCase()) && w.length > 2);
}

// ── Subordination evidence assessment (Plan v2 A2 / B3 canonical rule) ──────

export interface SubordinationEvidence {
  /** High-confidence cues: explicit subordinators + POS-confirmed relative pronouns */
  highConfidenceCount: number;
  /** Low-confidence cues: participial patterns without POS confirmation */
  lowConfidenceCount: number;
  /** Weighted total: high * 1.0 + low * 0.3 */
  weightedTotal: number;
  /** Whether nesting bonus is allowed (requires >=1 high-confidence cue) */
  nestingBonusAllowed: boolean;
}

/**
 * Graded evidence ladder for subordination weighting.
 * Single canonical rule used by both Phase A heuristic and Phase B POS-aware paths.
 *
 * - High-confidence (1.0x): explicit SUBORDINATING_CONJ or POS-confirmed WDT/IN "that"
 * - Low-confidence (0.3x): participial patterns (-ing/-ed at clause boundaries)
 * - Nesting bonus: only allowed when >=1 high-confidence cue exists in the sentence
 *
 * @param explicitSubordCount - Count of explicit subordinating conjunctions
 * @param relativeClauses - Count of detected relative clauses (heuristic or POS-confirmed)
 * @param participialPhrases - Count of participial phrase patterns
 */
export function assessSubordinationEvidence(
  explicitSubordCount: number,
  relativeClauses: number,
  participialPhrases: number,
): SubordinationEvidence {
  const highConfidenceCount = explicitSubordCount + relativeClauses;
  const lowConfidenceCount = participialPhrases;
  const weightedTotal = highConfidenceCount * 1.0 + lowConfidenceCount * 0.3;
  const nestingBonusAllowed = highConfidenceCount >= 1;

  return {
    highConfidenceCount,
    lowConfidenceCount,
    weightedTotal,
    nestingBonusAllowed,
  };
}

/**
 * C4: Heuristic syllable counter (vowel-cluster method, ~85% accuracy).
 * Used for polysyllabic ratio in register scoring.
 */
export function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 2) return 1;

  let count = 0;
  let prevVowel = false;

  for (let i = 0; i < w.length; i++) {
    const isVowel = /[aeiouy]/.test(w[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }

  // Silent final -e
  if (w.endsWith('e') && !w.endsWith('le') && count > 1) count--;
  // Common diphthongs that reduce count
  if (/tion$/.test(w) || /sion$/.test(w)) count = Math.max(1, count);
  // -le after consonant adds a syllable (already counted by vowel method usually)

  return Math.max(1, count);
}

// ── Phase D: Voice metrics, opacity norm profile, suspension markers ────────

/**
 * D1: Shannon entropy over quantized sentence lengths.
 * High entropy = varied rhythm = voiced. Low entropy = monotonous = unvoiced.
 * Returns normalized value in [0, 1].
 */
export function sentenceLengthEntropy(sentences: string[]): number {
  if (sentences.length < 2) return 0;

  const bins = [5, 10, 15, 20, 30, 50, Infinity]; // bin upper bounds
  const counts = new Array(bins.length).fill(0);

  for (const s of sentences) {
    const len = s.split(/\s+/).length;
    for (let i = 0; i < bins.length; i++) {
      if (len <= bins[i]) { counts[i]++; break; }
    }
  }

  const total = sentences.length;
  let entropy = 0;
  for (const c of counts) {
    if (c > 0) {
      const p = c / total;
      entropy -= p * Math.log2(p);
    }
  }

  // Normalize by max possible entropy (log2 of number of bins)
  const maxEntropy = Math.log2(bins.length);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

/**
 * D2: Consecutive sentence length contrast.
 * Average of |len(s_i) - len(s_{i+1})| / max(len(s_i), len(s_{i+1})) across adjacent pairs.
 */
export function consecutiveLengthContrast(sentences: string[]): number {
  if (sentences.length < 2) return 0;

  let totalContrast = 0;
  const lengths = sentences.map(s => s.split(/\s+/).length);

  for (let i = 0; i < lengths.length - 1; i++) {
    const maxLen = Math.max(lengths[i], lengths[i + 1]);
    if (maxLen > 0) {
      totalContrast += Math.abs(lengths[i] - lengths[i + 1]) / maxLen;
    }
  }

  return totalContrast / (lengths.length - 1);
}

/**
 * D3: Terminal shortness detection.
 * Returns 1 if the final 1-2 sentences are < 50% of the passage mean length, 0 otherwise.
 */
export function terminalShortness(sentences: string[]): number {
  if (sentences.length < 3) return 0;

  const lengths = sentences.map(s => s.split(/\s+/).length);
  const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const threshold = mean * 0.5;

  const lastLen = lengths[lengths.length - 1];
  const secondLastLen = lengths[lengths.length - 2];

  if (lastLen < threshold) return 1;
  if (secondLastLen < threshold && lastLen < mean) return 0.5;
  return 0;
}

/**
 * D4: Compute feature vector for opacity deviation-from-norm calculation.
 * Returns [avgSentLen, avgWordLen, punctuationDensity, functionWordRatio].
 */
export function opacityFeatureVector(text: string, sentences: string[], words: string[]): number[] {
  const wordCount = words.length || 1;
  const avgSentLen = sentences.length > 0
    ? sentences.reduce((s, sent) => s + sent.split(/\s+/).length, 0) / sentences.length
    : 15;
  const avgWordLen = words.reduce((s, w) => s + w.length, 0) / wordCount;
  const punctCount = (text.match(/[,;:!?\-—–]/g) || []).length;
  const punctDensity = punctCount / wordCount;

  const FUNCTION_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'shall', 'should', 'may', 'might', 'can', 'could', 'not', 'no',
    'this', 'that', 'these', 'those', 'it', 'its',
  ]);
  let funcCount = 0;
  for (const w of words) {
    if (FUNCTION_WORDS.has(w)) funcCount++;
  }
  const funcRatio = funcCount / wordCount;

  return [avgSentLen, avgWordLen, punctDensity, funcRatio];
}

// Transparent norm centroid — computed from gold set transparent passages
// (Federal Register, Pittsburgh textbook, Darbyshire, Lichtenstein)
// Z-score normalization stats computed over full 40-passage gold set.
// These are hardcoded after one-time computation; update if gold set changes.
const TRANSPARENT_NORM = {
  centroid: [22.5, 4.8, 0.045, 0.48],    // avg of transparent passages
  goldMean: [24.0, 4.7, 0.055, 0.46],     // mean over full gold set
  goldStd:  [10.0, 0.6, 0.025, 0.05],     // std over full gold set
};

/**
 * D4: Compute Z-score normalized Euclidean distance from transparent norm.
 * Higher distance = more opaque (in either direction: extreme simplicity or complexity).
 */
export function opacityDeviationFromNorm(text: string, sentences: string[], words: string[]): number {
  const features = opacityFeatureVector(text, sentences, words);
  const { centroid, goldMean, goldStd } = TRANSPARENT_NORM;

  let distSq = 0;
  for (let i = 0; i < features.length; i++) {
    const std = goldStd[i] || 1;
    const zFeature = (features[i] - goldMean[i]) / std;
    const zCentroid = (centroid[i] - goldMean[i]) / std;
    distSq += (zFeature - zCentroid) ** 2;
  }

  // Normalize: typical distances range 0-5; clamp to [0, 1]
  return Math.min(1, Math.sqrt(distSq) / 4);
}

/**
 * D5: Suspension marker detection for periodic sentence identification.
 * Returns density of suspension markers per sentence.
 */
export function suspensionMarkerDensity(sentences: string[]): number {
  if (sentences.length === 0) return 0;

  let markerCount = 0;
  for (const sent of sentences) {
    const trimmed = sent.trim();
    // Conditional openers
    if (/^(If|When|Should|Were|Had|Provided that|Unless|Although|While|Whereas|Whenever|Wherever)\b/i.test(trimmed)) {
      markerCount++;
      continue;
    }
    // Participial openers (word ending in -ing or -ed followed by a comma within first 6 words)
    const firstWords = trimmed.split(/\s+/).slice(0, 6).join(' ');
    if (/^[A-Z][a-z]+(ing|ed)\b[^.]*,/.test(firstWords)) {
      markerCount++;
      continue;
    }
    // Correlative suspensions
    if (/\bnot only\b.*\bbut also\b/i.test(sent) || /\bneither\b.*\bnor\b/i.test(sent) || /\bwhether\b.*\bor\b/i.test(sent)) {
      markerCount++;
      continue;
    }
  }

  return markerCount / sentences.length;
}

/**
 * E2: Conservative clause splitter for periodic/running ensemble.
 * Only splits at unambiguous clause boundaries:
 *   - Semicolons and colons (always clause boundaries)
 *   - Commas followed by coordinating conjunctions (", and", ", but", etc.)
 * Does NOT split at bare commas (could be list or parenthetical commas).
 */
export function splitClausesConservative(sentence: string): string[] {
  // Split at semicolons and colons
  let parts = sentence.split(/\s*[;:]\s*/).filter(p => p.trim().length > 0);

  // Further split at commas followed by coordinating conjunctions
  const result: string[] = [];
  for (const part of parts) {
    const subParts = part.split(/,\s*(?=(?:and|but|or|so|yet|nor)\b)/i);
    for (const sp of subParts) {
      const trimmed = sp.trim();
      if (trimmed.length > 0 && trimmed.split(/\s+/).length >= 2) {
        result.push(trimmed);
      }
    }
  }

  return result.length > 0 ? result : [sentence.trim()].filter(s => s.length > 0);
}
