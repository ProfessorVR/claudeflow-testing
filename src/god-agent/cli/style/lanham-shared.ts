/**
 * lanham-shared.ts - Shared constants and utility functions for Lanham analyzers
 *
 * Extracted from lanham-prose-analyzer.ts (Tier 1) and advanced-lanham-analyzer.ts (Tier 2)
 * to eliminate ~450 lines of duplication. Tier 1 versions are canonical.
 *
 * PURE REFACTOR: zero behavioral changes.
 */

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

/** Content-level opacity signals: prose ABOUT language, form, style, or rhetoric */
export const OPACITY_CONTENT_MARKERS = [
  /\b(prose|syntax|sentence|paragraph|diction|style|rhetoric|rhythm|cadence)\b/gi,
  /\b(language|discourse|text|narrative form|literary form|formal properties)\b/gi,
  /\b(metaphor|figure|trope|irony|allusion|echo|register|voice)\b.*\b(itself|here|this|own)\b/gi,
  /\b(reading|writing|composing|phrasing)\b.*\b(as|itself|own|practice)\b/gi,
  /\b(sound|acoustic|phonetic|alliterat|assonan|rhythm)\b/gi,
  /\b(foreground|self-conscious|self-referent|draws attention to)\b/gi,
];

export const PERSONALITY_MARKERS = [
  /\bI (believe|think|argue|contend|suggest|maintain|hold)\b/gi,
  /\b(my|our) (view|position|argument|contention|claim)\b/gi,
  /\bit (seems|appears) (to me|clear|evident)\b/gi,
  /\b(crucially|importantly|strikingly|remarkably|notably)\b/gi,
  /\b(indeed|surely|certainly|undoubtedly|plainly)\b/gi,
  // Rhetorical/oratorical markers (broadened for voiced non-first-person prose)
  /\bwe (shall|will|must|can|cannot)\b/gi,
  /\blet us\b/gi,
  /\b(never|always|forever)\b/gi,
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
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
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

export function isNominalization(word: string): boolean {
  const w = word.toLowerCase();
  if (w.length < 6) return false;
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
