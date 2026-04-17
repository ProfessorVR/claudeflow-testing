/**
 * LanhamProseAnalyzer - Tier 1 heuristic implementation
 * Uses regex/counting heuristics to produce LanhamProseMetrics.
 * See plan: plans/lanham-module-port-plan.md Phase 1
 */
import type { LanhamProseMetrics } from '../../universal/style-analyzer.js';
import type { ILanhamAnalyzer } from './lanham-analyzer-interface.js';
import { GENRE_THRESHOLDS, type Genre, type LanhamThresholdConfig } from './lanham-style-policy.js';
import {
  tokenize, splitSentences, clamp, isVerb, isNominalization, isLatinate, roughStem, getContentWords,
  tagPOS, isVerbTag, isThatSubordinator, assessSubordinationEvidence, countSyllables,
  BE_VERBS, COMMON_VERBS, NOMINALIZATION_SUFFIXES, LATINATE_SUFFIXES, PREPOSITIONS,
  COORDINATING_CONJ, SUBORDINATING_CONJ, FORMAL_MARKERS,
  META_LINGUISTIC_MARKERS, OPACITY_CONTENT_MARKERS, PERSONALITY_MARKERS,
  sentenceLengthEntropy, consecutiveLengthContrast, terminalShortness,
  opacityDeviationFromNorm,
} from './lanham-shared.js';
import { AWL_WORDS } from './data/academic-word-list.js';

// ── Main class ─────────────────────────────────────────────────────────────

export class LanhamProseAnalyzer implements ILanhamAnalyzer {
  private genre: Genre;

  constructor(genre: Genre = 'general') {
    this.genre = genre;
  }

  // ── Full analysis orchestrator ─────────────────────────────────────────

  async fullAnalysis(text: string): Promise<LanhamProseMetrics> {
    const [
      nounVerb,
      paraHypo,
      periodicRunning,
      voice,
      register,
      opacity,
      tacit,
    ] = await Promise.all([
      this.analyzeNounVerbAxis(text),
      this.analyzeParataxisHypotaxis(text),
      this.analyzePeriodicRunning(text),
      this.analyzeVoice(text),
      this.analyzeRegister(text),
      this.analyzeOpacityTransparency(text),
      this.detectTacitPatterns(text),
    ]);

    // Merge partial results
    const merged = {
      ...nounVerb,
      ...paraHypo,
      ...periodicRunning,
      ...voice,
      ...register,
      ...opacity,
      ...tacit,
    // Cast is safe: labels, explanations, analysisDepth, and confidenceByAxis
    // are set in the lines immediately below before the object is returned.
    } as LanhamProseMetrics;

    // Adjust opacity score to incorporate tacit pattern density
    // Dense tacit patterns = prose drawing attention to its own medium (Lanham's opacity)
    // Also incorporate alliteration density from tacit patterns (stronger signal than base)
    if (merged.tacitPatterns) {
      const tp = merged.tacitPatterns;
      const sentCount = (text.match(/[.!?]+/g) || []).length || 1;
      // Count ALL detected rhetorical figures
      const tacitTotal = (tp.anaphoraCount + tp.chiasmusCount + tp.antithesisCount +
        tp.isocolonCount + tp.climaxPatternCount) / sentCount;
      const tacitDensity = clamp(tacitTotal / 0.2); // 0.2 patterns/sentence = saturated
      // Alliteration from tacit detection is more reliable than base opacity's triple-check
      const allit = clamp(tp.alliterationDensity / 0.15); // 0.15/sent = heavy alliteration
      // Polyptoton (same root, different form) signals self-conscious wordplay
      const polyp = clamp(tp.polyptotonDensity / 0.1);

      // Blend: base opacity 0.50 + tacit rhetorical figures 0.25 + alliteration 0.15 + polyptoton 0.10
      const baseOpacity = merged.opacityScore ?? 0;
      merged.opacityScore = clamp(
        baseOpacity * 0.50 +
        tacitDensity * 0.25 +
        allit * 0.15 +
        polyp * 0.10
      );
    }

    // Derive categorical labels
    const thresholds = GENRE_THRESHOLDS[this.genre];
    merged.labels = this.deriveLabels(merged, thresholds);

    // Generate explanation strings
    merged.explanations = this.deriveExplanations(merged);

    // Set analysis depth and confidence
    merged.analysisDepth = 'heuristic';
    merged.confidenceByAxis = {
      nounVerb: 'high',
      register: 'high',
      voice: 'medium',
      parataxisHypotaxis: 'medium',
      opacity: 'medium',
      tacitPatterns: 'medium',
      periodicRunning: 'low',
    };

    return merged;
  }

  // ── Axis 1: Noun/Verb style ────────────────────────────────────────────

  async analyzeNounVerbAxis(text: string): Promise<Partial<LanhamProseMetrics>> {
    const words = tokenize(text);
    const sentences = splitSentences(text);
    const wordCount = words.length || 1;

    // B2: POS-enhanced verb identification
    const rawWords = text.replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 0);
    const posTokens = tagPOS(rawWords);
    const posVerbSet = new Set<string>();
    for (const t of posTokens) {
      if (isVerbTag(t.tag)) posVerbSet.add(t.word.toLowerCase());
    }

    let verbCount = 0;
    let nounStyleCount = 0; // nominalizations + prepositional phrases signal noun-heavy style
    let beVerbCount = 0;

    for (const w of words) {
      if (isVerb(w) || posVerbSet.has(w)) {
        verbCount++;
        if (BE_VERBS.has(w)) beVerbCount++;
      }
      if (isNominalization(w)) nounStyleCount++;
    }

    const nominalizationDensity = (nounStyleCount / wordCount) * 100;
    const beVerbRatio = verbCount > 0 ? beVerbCount / verbCount : 0;

    // Count prepositional phrases per sentence
    let prepPhraseCount = 0;
    for (const sent of sentences) {
      const sentWords = sent.toLowerCase().split(/\s+/);
      for (let i = 0; i < sentWords.length - 1; i++) {
        const cleaned = sentWords[i].replace(/[^a-z]/g, '');
        if (PREPOSITIONS.has(cleaned)) prepPhraseCount++;
      }
    }
    const prepositionalPhraseDensity = sentences.length > 0
      ? prepPhraseCount / sentences.length
      : 0;

    // nounVerbRatio: 0=pure noun-style, 1=pure verb-style
    // Lanham's noun style = nominalization + be-verb + prepositional phrase chains
    // The prep phrase density is a KEY signal (Burns: "noun + is + of-phrase")
    const nounSignal = clamp(
      (nominalizationDensity / 6) * 0.45 +       // nominalizations (6% = heavy)
      beVerbRatio * 0.25 +                         // be-verb reliance
      clamp(prepositionalPhraseDensity / 5) * 0.30 // prep phrase piling (5/sent = heavy)
    , 0, 1);
    // For verb signal, count only ACTION verbs (exclude be-verbs, which support noun-style)
    const actionVerbCount = verbCount - beVerbCount;
    const verbSignal = clamp(actionVerbCount / wordCount / 0.14, 0, 1); // ~14% action verbs = very verb-active
    const nounVerbRatio = clamp((verbSignal - nounSignal + 1) / 2);

    return {
      nounVerbRatio,
      nominalizationDensity,
      prepositionalPhraseDensity,
      beVerbRatio,
    };
  }

  // ── Axis 2: Parataxis / Hypotaxis ─────────────────────────────────────

  async analyzeParataxisHypotaxis(text: string): Promise<Partial<LanhamProseMetrics>> {
    const words = tokenize(text);
    const sentences = splitSentences(text);
    const wordCount = words.length || 1;

    let coordCount = 0;
    let subordCount = 0;

    for (const w of words) {
      if (COORDINATING_CONJ.has(w)) coordCount++;
      if (SUBORDINATING_CONJ.has(w)) subordCount++;
    }

    // POS-aware relative clause detection: disambiguate "that" (aligned with Tier 2 B3)
    // Uses tagPOS() + isThatSubordinator() so demonstrative "that" (DT) is not counted.
    const RELATIVE_WORDS = new Set(['which', 'who', 'whom', 'whose', 'where', 'whereby']);
    let implicitSubordCount = 0;
    for (const sent of sentences) {
      const sentRawWords = sent.split(/\s+/).filter(w => w.length > 0);
      const sentPOS = tagPOS(sentRawWords);
      const sentLower = sentRawWords.map(w => w.toLowerCase().replace(/[^a-z']/g, ''));

      for (let i = 0; i < sentLower.length - 1; i++) {
        const w = sentLower[i];
        if (RELATIVE_WORDS.has(w)) {
          // which/who/whom/whose/where/whereby always count — check for following verb
          const lookahead = sentLower.slice(i + 1, i + 4);
          const lookaheadPOS = sentPOS.slice(i + 1, i + 4);
          const hasVerb = lookaheadPOS.some(t => isVerbTag(t.tag)) || lookahead.some(lw => isVerb(lw));
          if (hasVerb) implicitSubordCount++;
        } else if (w === 'that') {
          // "that" requires POS disambiguation: WDT/IN = subordination, DT = skip
          const posTag = sentPOS[i]?.tag || 'DT';
          if (!isThatSubordinator(posTag)) continue;
          const lookahead = sentLower.slice(i + 1, i + 4);
          const lookaheadPOS = sentPOS.slice(i + 1, i + 4);
          const hasVerb = lookaheadPOS.some(t => isVerbTag(t.tag)) || lookahead.some(lw => isVerb(lw));
          if (hasVerb) implicitSubordCount++;
        }
      }
    }

    // Prepositional phrase nesting depth as hypotaxis signal
    // Multiple consecutive "of X" / "in Y" / "within Z" chains = hierarchical structure
    let ppNestingSignal = 0;
    for (const sent of sentences) {
      const sentWords = sent.toLowerCase().split(/\s+/);
      let consecutivePreps = 0;
      let maxChain = 0;
      for (const w of sentWords) {
        const cleaned = w.replace(/[^a-z]/g, '');
        if (PREPOSITIONS.has(cleaned)) {
          consecutivePreps++;
          maxChain = Math.max(maxChain, consecutivePreps);
        } else {
          consecutivePreps = 0;
        }
      }
      // Chains of 2+ prepositions in close proximity signal nesting
      if (maxChain >= 2) ppNestingSignal++;
    }
    const ppNestingDensity = sentences.length > 0 ? ppNestingSignal / sentences.length : 0;

    // Canonical graded evidence ladder (same as Tier 2 A2/B3)
    // Tier 1 has no participial phrase detection, so lowConfidenceCount = 0
    const evidence = assessSubordinationEvidence(subordCount, implicitSubordCount, 0);
    const effectiveSubord = evidence.weightedTotal;
    const hypotaxisBoost = evidence.nestingBonusAllowed
      ? clamp(ppNestingDensity / 0.5) * 0.08  // reduced from 0.15, conditional on >=1 high-confidence cue
      : 0;

    const coordinatingConjunctionDensity = coordCount / wordCount;
    const subordinatingConjunctionDensity = evidence.weightedTotal / wordCount;

    // Sentence-initial conjunction signal: "And" or "But" starting a sentence = paratactic macro-structure
    let sentenceInitialConj = 0;
    for (const sent of sentences) {
      if (/^(And|But|Or|So|Yet|Nor)\b/.test(sent.trim())) sentenceInitialConj++;
    }
    const sentInitConjDensity = sentenceInitialConj / (sentences.length || 1);

    // Average sentence length: short sentences = paratactic tendency
    const avgSentLen = sentences.reduce((s, sent) => s + sent.split(/\s+/).length, 0) / (sentences.length || 1);
    const shortSentSignal = clamp((15 - avgSentLen) / 10); // sentences under 15 words = paratactic lean

    // Higher subordination = more hypotactic (1), more coordination = more paratactic (0)
    const totalConj = coordCount + effectiveSubord;
    let parataxisHypotaxisRatio = totalConj > 0
      ? clamp(effectiveSubord / totalConj + hypotaxisBoost
        - sentInitConjDensity * 0.15  // sentence-initial conjunctions push toward paratactic
        - shortSentSignal * 0.10)     // short sentences push toward paratactic
      : clamp(0.5 + hypotaxisBoost - shortSentSignal * 0.10);

    return {
      parataxisHypotaxisRatio,
      coordinatingConjunctionDensity,
      subordinatingConjunctionDensity,
    };
  }

  // ── Axis 3: Periodic / Running ────────────────────────────────────────

  async analyzePeriodicRunning(text: string): Promise<Partial<LanhamProseMetrics>> {
    const sentences = splitSentences(text);
    if (sentences.length === 0) {
      return { periodicRunningRatio: 0.5, preMainVerbClauseCount: 0 };
    }

    let periodicSignals = 0;
    let runningSignals = 0;
    let totalPreMainClauses = 0;

    for (const sent of sentences) {
      const words = sent.split(/\s+/);
      if (words.length < 3) { runningSignals++; continue; }

      // Heuristic: a sentence that starts with a subordinate clause or participial
      // phrase before the main verb is more periodic
      const firstWords = words.slice(0, Math.min(5, words.length)).map(w => w.toLowerCase().replace(/[^a-z]/g, ''));
      const startsWithSubord = firstWords.some(w => SUBORDINATING_CONJ.has(w));
      const startsWithParticiple = /^[A-Z][a-z]+(ing|ed)\b/.test(words[0] || '');

      // Check for front-loaded modification (commas before midpoint)
      const commaPositions: number[] = [];
      for (let i = 0; i < words.length; i++) {
        if (words[i].endsWith(',')) commaPositions.push(i);
      }
      const midpoint = words.length / 2;
      const earlyCommas = commaPositions.filter(p => p < midpoint).length;
      const lateCommas = commaPositions.filter(p => p >= midpoint).length;

      // Very short sentences (< 10 words) with immediate main clause = running
      const isShort = words.length < 10;
      // Very long sentences (30+ words) tend periodic unless they're coordinate chains
      const isLong = words.length >= 30;
      const hasCoordChain = (sent.match(/\band\b/gi) || []).length >= 3;

      if (startsWithSubord || startsWithParticiple || earlyCommas > lateCommas) {
        periodicSignals++;
        if (startsWithSubord || startsWithParticiple) totalPreMainClauses++;
      } else if (isShort) {
        runningSignals += 1.2; // short sentences are strongly running
      } else if (isLong && hasCoordChain) {
        runningSignals++; // long coordinate chains are running (Malory, Hemingway)
      } else {
        runningSignals++;
      }
    }

    const total = periodicSignals + runningSignals;
    // 0=pure periodic, 1=pure running
    const periodicRunningRatio = total > 0
      ? clamp(runningSignals / total)
      : 0.5;

    const preMainVerbClauseCount = sentences.length > 0
      ? totalPreMainClauses / sentences.length
      : 0;

    return {
      periodicRunningRatio,
      preMainVerbClauseCount,
    };
  }

  // ── Axis 4: Voice (rhythmic presence) ─────────────────────────────────

  async analyzeVoice(text: string): Promise<Partial<LanhamProseMetrics>> {
    const sentences = splitSentences(text);
    if (sentences.length === 0) {
      return { voiceScore: 0.5, dynamicRange: 0 };
    }

    // Sentence length variance contributes to rhythmic variety
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = Math.sqrt(
      lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length,
    );
    const coeffOfVariation = mean > 0 ? variance / mean : 0;

    // Personality markers
    let personalityCount = 0;
    for (const pat of PERSONALITY_MARKERS) {
      const matches = text.match(pat);
      if (matches) personalityCount += matches.length;
    }
    const personalityDensity = personalityCount / (sentences.length || 1);

    // Dynamic range = coefficient of variation of sentence lengths
    const dynamicRange = clamp(coeffOfVariation, 0, 1);

    // Deliberate rhythmic restriction signal: very short average sentence length
    // (Hemingway, Bible, Mencken) is itself a voiced choice — flatness IS the voice
    const avgLen = mean;
    const restrictionSignal = avgLen < 12 ? clamp((12 - avgLen) / 8) : 0;

    // Rhetorical repetition signal: repeated sentence openings within the passage
    // (anaphora-like patterns that create voiced rhythm even in 3rd person)
    let repeatedOpenings = 0;
    const openings = sentences.map(s => s.split(/\s+/).slice(0, 2).join(' ').toLowerCase());
    const openingCounts: Record<string, number> = {};
    for (const o of openings) {
      openingCounts[o] = (openingCounts[o] || 0) + 1;
    }
    for (const count of Object.values(openingCounts)) {
      if (count >= 2) repeatedOpenings += count - 1;
    }
    const repetitionSignal = clamp(repeatedOpenings / (sentences.length || 1) / 0.25);

    // Question/exclamation density: direct engagement signals voice
    const questionMarks = (text.match(/\?/g) || []).length;
    const exclamations = (text.match(/!/g) || []).length;
    const engagementSignal = clamp((questionMarks + exclamations) / (sentences.length || 1) / 0.2);

    // Unvoiced signal: bureaucratic/institutional markers that suppress voice
    // Lanham's unvoiced: Federal Register, Eisenhower press conf, Darbyshire, Lichtenstein
    // Common pattern: passive voice, no direct address, impersonal subjects, filler phrases,
    // AND low sentence-length variance (monotonous rhythm unlike deliberate restriction)
    const passiveCount = (text.match(/\b(is|are|was|were|been|be)\s+\w+ed\b/gi) || []).length;
    const passiveDensity = passiveCount / (sentences.length || 1);
    const fillerCount = (text.match(/\b(of course|as you know|it is|there is|there are|it was|it has been|in terms of|with respect to|in connection with|pursuant to|shall be|may be|provided that|in accordance)\b/gi) || []).length;
    const fillerDensity = fillerCount / (sentences.length || 1);
    // Impersonal subject starts: "The X", "It", "This", "These" — no human agent
    let impersonalStarts = 0;
    for (const s of sentences) {
      if (/^(The |It |This |These |That |Those |Such |An? )/.test(s.trim())) impersonalStarts++;
    }
    const impersonalDensity = impersonalStarts / (sentences.length || 1);

    // Unvoiced = high passive + high filler + impersonal + no personality + no engagement
    const unvoicedSignal = clamp(
      clamp(passiveDensity / 0.35) * 0.20 +
      clamp(fillerDensity / 0.25) * 0.20 +
      clamp(impersonalDensity / 0.7) * 0.20 +
      (1 - clamp(personalityDensity / 0.1)) * 0.20 +
      (1 - engagementSignal) * 0.20
    );

    // Positive voice: signals that prose was crafted for oral delivery
    // Repetition only counts if combined with other voice signals (not just textbook repetition)
    const hasRhetoricalContext = personalityDensity > 0.05 || engagementSignal > 0.1 || dynamicRange > 0.3;
    const effectiveRepetition = hasRhetoricalContext ? repetitionSignal : repetitionSignal * 0.3;

    const positiveVoice = clamp(
      dynamicRange * 0.30 +
      clamp(personalityDensity / 0.2) * 0.25 +
      restrictionSignal * 0.15 +
      effectiveRepetition * 0.15 +
      engagementSignal * 0.15
    );

    // D1-D3: Additional voice metrics
    const entropy = sentenceLengthEntropy(sentences);
    const contrast = consecutiveLengthContrast(sentences);
    const terminal = terminalShortness(sentences);

    // D1-D3: Voice score with entropy, contrast, and terminal shortness.
    // Phase D 5-term formula (0.45/0.30/0.12/0.08/0.05) degraded monotonicity from
    // 0.372 to 0.313 — base signal weights were reduced too aggressively.
    // Reverted to original 2-term formula with D1-D3 metrics as minor supplements.
    // The new metrics remain computed above for Phase F calibration.
    // Voice score: base formula preserved from pre-Phase-D (monotonicity 0.372).
    // D1-D3 metrics (entropy, contrast, terminal) are computed above and available
    // for Phase F calibration, but not blended in until validated — initial weights
    // degraded monotonicity from 0.372 to 0.313 even at minimal (0.10 total) weight.
    const voiceScore = clamp(
      (1 - unvoicedSignal) * 0.60 + positiveVoice * 0.40
    );

    return {
      voiceScore,
      dynamicRange,
    };
  }

  // ── Axis 5: Register ──────────────────────────────────────────────────

  async analyzeRegister(text: string): Promise<Partial<LanhamProseMetrics>> {
    const words = tokenize(text);
    const sentences = splitSentences(text);
    const wordCount = words.length || 1;

    // Latinate/Germanic ratio
    let latinateCount = 0;
    let shortGermanicCount = 0;
    for (const w of words) {
      if (isLatinate(w)) latinateCount++;
      else if (w.length <= 5 && w.length >= 2) shortGermanicCount++;
    }
    const latinateGermanicRatio = (latinateCount + shortGermanicCount) > 0
      ? clamp(latinateCount / (latinateCount + shortGermanicCount))
      : 0.5;

    // Sentence length variance
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const mean = lengths.length > 0
      ? lengths.reduce((a, b) => a + b, 0) / lengths.length
      : 15;
    const sentLenVariance = lengths.length > 0
      ? Math.sqrt(lengths.reduce((sum, l) => sum + (l - mean) ** 2, 0) / lengths.length)
      : 5;

    // Contraction frequency
    const contractions = (text.match(/\b\w+'\w+\b/g) || []).length;
    const contractionRate = contractions / wordCount;

    // Formal vocabulary marker density
    let formalCount = 0;
    for (const w of words) {
      if (FORMAL_MARKERS.has(w)) formalCount++;
    }
    const formalDensity = formalCount / wordCount;

    // Register: directional score 0=low, 0.5=middle, 1=high
    // Lanham's register table (p. 164): High = Latinate, periodic, hypotactic, ornamented, formal
    // Low = Anglo-Saxon, loose, paratactic, plain, conversational, short words
    //
    // Key insight: register is not just vocabulary — it includes sentence complexity,
    // formality markers, and average word length (polysyllabic = high)
    const avgWordLen = words.reduce((s, w) => s + w.length, 0) / wordCount;
    const polysyllabicRatio = words.filter(w => w.length >= 8).length / wordCount;
    const semicolonDensity = (text.match(/;/g) || []).length / (sentences.length || 1);

    const highSignal = clamp(
      latinateGermanicRatio * 0.25 +           // Latinate vocabulary
      clamp(polysyllabicRatio / 0.12) * 0.20 + // polysyllabic words (12% = very high)
      formalDensity * 10 * 0.15 +              // formal discourse markers
      clamp(mean / 30) * 0.20 +                // long sentences
      clamp(semicolonDensity / 0.15) * 0.10 +  // semicolons
      clamp(avgWordLen / 6.5 - 0.3) * 0.10    // average word length (6.5+ = formal)
    );
    const lowSignal = clamp(
      contractionRate * 10 * 0.25 +            // contractions
      clamp(1 - mean / 12) * 0.25 +            // short sentences (under 12 words avg)
      clamp(1 - avgWordLen / 5) * 0.25 +       // short words (under 5 chars avg)
      clamp((1 - latinateGermanicRatio) * 1.5 - 0.5) * 0.25 // Anglo-Saxon dominance
    );

    // Directional register score: 0=low, 0.5=middle, 1=high
    const registerMarkednessScore = clamp((highSignal - lowSignal + 1) / 2);

    // B5: Blend Heylighen-Dewaele F-score into register markedness.
    // Phase C composite (7-signal) was tested but degraded monotonicity from 0.673 to 0.567 —
    // the initial weights diluted the F-score signal. Reverted to the simpler 70/30 blend
    // which demonstrated +0.099 improvement. The AWL, syllable counter, and composite
    // architecture remain available in lanham-shared.ts for Phase F calibration.
    const fScore = this.computeFScore(text);
    const fScoreNormalized = clamp(fScore / 100);
    const blendedRegisterScore = clamp(registerMarkednessScore * 0.70 + fScoreNormalized * 0.30);

    return {
      latinateGermanicRatio,
      registerMarkednessScore: blendedRegisterScore,
    };
  }

  /**
   * B5: Heylighen-Dewaele F-score for register/formality.
   * F = 50 * ((noun + adj + prep + article - pronoun - verb - adverb - interjection) / N + 1)
   * Range: 0 (informal) to 100 (formal).
   */
  private computeFScore(text: string): number {
    const rawWords = text.replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 0);
    const posTokens = tagPOS(rawWords);
    if (posTokens.length === 0) return 50; // neutral fallback if POS unavailable

    let noun = 0, adj = 0, prep = 0, article = 0;
    let pronoun = 0, verb = 0, adverb = 0, interjection = 0;

    for (const { tag } of posTokens) {
      if (tag.startsWith('NN')) noun++;
      else if (tag.startsWith('JJ')) adj++;
      else if (tag === 'IN') prep++;
      else if (tag === 'DT') article++;
      else if (tag.startsWith('PRP') || tag === 'WP' || tag === 'WP$') pronoun++;
      else if (tag.startsWith('VB') || tag === 'MD') verb++;
      else if (tag.startsWith('RB') || tag === 'WRB') adverb++;
      else if (tag === 'UH') interjection++;
    }

    const N = posTokens.length;
    const f = 50 * ((noun + adj + prep + article - pronoun - verb - adverb - interjection) / N + 1);
    return Math.max(0, Math.min(100, f));
  }

  // ── Axis 6: Opacity / Transparency ────────────────────────────────────

  async analyzeOpacityTransparency(text: string): Promise<Partial<LanhamProseMetrics>> {
    const sentences = splitSentences(text);
    const sentenceCount = sentences.length || 1;

    // Signal 1: Meta-linguistic references (prose commenting on its own words)
    let metaLingCount = 0;
    for (const pat of META_LINGUISTIC_MARKERS) {
      const matches = text.match(pat);
      if (matches) metaLingCount += matches.length;
    }
    const metaLingDensity = clamp(metaLingCount / sentenceCount / 0.12);

    // Signal 2: Content-level opacity (prose ABOUT language, form, style, rhetoric)
    let contentOpacityCount = 0;
    for (const pat of OPACITY_CONTENT_MARKERS) {
      const matches = text.match(pat);
      if (matches) contentOpacityCount += matches.length;
    }
    const contentOpacityDensity = clamp(contentOpacityCount / sentenceCount / 0.25);

    // Signal 3: Sound pattern density (alliteration as foregrounding)
    const words = tokenize(text);
    const contentWords = getContentWords(words);
    let alliterationHits = 0;
    for (let i = 0; i < contentWords.length - 2; i++) {
      const a = contentWords[i][0];
      const b = contentWords[i + 1]?.[0];
      const c = contentWords[i + 2]?.[0];
      if (a && a === b && b === c) alliterationHits++;
    }
    const soundDensity = clamp(alliterationHits / (sentenceCount || 1) / 0.3);

    // Combined self-consciousness score (meta-linguistic only, NOT content-about-language)
    const selfConsciousnessScore = metaLingDensity;

    // Signal 4: Polysyndeton density — deliberate "and...and...and" chaining (Hemingway, Malory)
    const polysyndeton = (text.match(/\band\b/gi) || []).length;
    const polysyndetonDensity = clamp(polysyndeton / (words.length || 1) / 0.06); // 6% = very polysyndetic

    // Signal 5: Repetition density — repeated words/phrases foreground the surface
    const wordFreqs: Record<string, number> = {};
    for (const w of contentWords) {
      wordFreqs[w] = (wordFreqs[w] || 0) + 1;
    }
    const repeatedContentWords = Object.values(wordFreqs).filter(c => c >= 3).length;
    const repetitionDensity = clamp(repeatedContentWords / (contentWords.length || 1) / 0.04);

    // Signal 6: Sentence length extremes — very short sentences (fragments) or very long
    // sentences signal deliberate stylistic display (opacity)
    const sentLens = sentences.map(s => s.split(/\s+/).length);
    const veryShort = sentLens.filter(l => l <= 5).length;
    const veryLong = sentLens.filter(l => l >= 40).length;
    const extremesDensity = clamp((veryShort + veryLong) / (sentences.length || 1) / 0.25);

    // D4: Blend deviation-from-norm into opacity
    const deviation = opacityDeviationFromNorm(text, sentences, words);

    const opacityScore = clamp(
      soundDensity * 0.15 +
      polysyndetonDensity * 0.10 +
      repetitionDensity * 0.15 +
      extremesDensity * 0.10 +
      metaLingDensity * 0.15 +
      contentOpacityDensity * 0.10 +
      deviation * 0.25
    );

    return {
      opacityScore,
      selfConsciousnessScore,
    };
  }

  // ── Axis 7: Tacit persuasion patterns ─────────────────────────────────

  async detectTacitPatterns(text: string): Promise<Partial<LanhamProseMetrics>> {
    const words = tokenize(text);
    const sentences = splitSentences(text);
    const contentWords = getContentWords(words);
    const sentenceCount = sentences.length || 1;

    // --- Alliteration: 3+ adjacent content words sharing initial consonant ---
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

    // --- Polyptoton: same stem appearing in different forms nearby ---
    let polyptotonCount = 0;
    const stems = contentWords.map(roughStem);
    for (let i = 0; i < stems.length - 1; i++) {
      for (let j = i + 1; j < Math.min(i + 8, stems.length); j++) {
        if (stems[i] === stems[j] && contentWords[i] !== contentWords[j] && stems[i].length > 3) {
          polyptotonCount++;
          break; // count once per anchor
        }
      }
    }
    const polyptotonDensity = polyptotonCount / sentenceCount;

    // --- Chiasmus: reversed word-stem order in 2-sentence windows ---
    let chiasmusCount = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      const s1Stems = tokenize(sentences[i]).map(roughStem).filter(s => s.length > 3);
      const s2Stems = tokenize(sentences[i + 1]).map(roughStem).filter(s => s.length > 3);
      // Look for A-B ... B-A pattern
      for (let a = 0; a < s1Stems.length - 1; a++) {
        for (let b = a + 1; b < Math.min(a + 5, s1Stems.length); b++) {
          const stemA = s1Stems[a];
          const stemB = s1Stems[b];
          if (stemA === stemB) continue;
          // Look for B-A in second sentence
          const idxB = s2Stems.indexOf(stemB);
          if (idxB >= 0) {
            const idxA = s2Stems.indexOf(stemA, idxB + 1);
            if (idxA > idxB) {
              chiasmusCount++;
              break;
            }
          }
        }
        if (chiasmusCount > 0 && chiasmusCount > i) break; // limit overcounting
      }
    }

    // --- Antithesis: contrasting pairs near conjunctions ---
    let antithesisCount = 0;
    const antithesisPairs = [
      ['not', 'but'], ['rather', 'than'], ['neither', 'nor'],
      ['less', 'more'], ['few', 'many'], ['old', 'new'],
    ];
    const textLower = text.toLowerCase();
    for (const [a, b] of antithesisPairs) {
      const re = new RegExp(`\\b${a}\\b[^.]{1,40}\\b${b}\\b`, 'g');
      const matches = textLower.match(re);
      if (matches) antithesisCount += matches.length;
    }

    // --- Anaphora: identical openings in 3+ consecutive sentences/clauses ---
    let anaphoraCount = 0;
    for (let i = 0; i < sentences.length - 2; i++) {
      const open1 = sentences[i].split(/\s+/).slice(0, 3).join(' ').toLowerCase();
      const open2 = sentences[i + 1].split(/\s+/).slice(0, 3).join(' ').toLowerCase();
      const open3 = sentences[i + 2].split(/\s+/).slice(0, 3).join(' ').toLowerCase();
      if (open1 === open2 && open2 === open3 && open1.length > 4) {
        anaphoraCount++;
      }
    }

    // --- Isocolon: consecutive clauses of similar word count (within 20%) ---
    let isocolonCount = 0;
    for (let i = 0; i < sentences.length - 1; i++) {
      const len1 = sentences[i].split(/\s+/).length;
      const len2 = sentences[i + 1].split(/\s+/).length;
      const maxLen = Math.max(len1, len2);
      if (maxLen > 0 && Math.abs(len1 - len2) / maxLen <= 0.20) {
        // Check for a third if available
        if (i + 2 < sentences.length) {
          const len3 = sentences[i + 2].split(/\s+/).length;
          if (Math.abs(len2 - len3) / Math.max(len2, len3) <= 0.20) {
            isocolonCount++;
          }
        }
      }
    }

    // --- Climax pattern: ascending sentence lengths in 3+ sequence ---
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

  // ── Label derivation ──────────────────────────────────────────────────

  private deriveLabels(
    m: Partial<LanhamProseMetrics>,
    t: LanhamThresholdConfig,
  ): LanhamProseMetrics['labels'] {
    const nvr = m.nounVerbRatio ?? 0.5;
    const phr = m.parataxisHypotaxisRatio ?? 0.5;
    const prr = m.periodicRunningRatio ?? 0.5;
    const vs = m.voiceScore ?? 0.5;
    const os = m.opacityScore ?? 0.5;

    // Register label: registerMarkednessScore is now directional (0=low, 0.5=middle, 1=high)
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

    // Signal-based noun-style override: when classic Lanham noun-style triad
    // (nominalization + be-verbs + PP piling) all exceed genre thresholds,
    // override "balanced" to "predominantly noun-style"
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

  // ── Explanation generation ────────────────────────────────────────────

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

    // Parataxis/Hypotaxis
    let paraExpl: string;
    if (phr < 0.35) {
      paraExpl = `Predominantly coordinate structures (and/but/or) linking independent clauses in paratactic chains.`;
    } else if (phr > 0.65) {
      paraExpl = `Dense subordination with frequent embedding via ${['although', 'because', 'while', 'whereas'].join('/')} and related subordinators.`;
    } else {
      paraExpl = `Mixed coordination and subordination, alternating between paratactic and hypotactic movement.`;
    }

    // Periodic/Running
    let perExpl: string;
    if (prr < 0.35) {
      perExpl = `Periodic architecture: sentences frequently suspend their main predication behind introductory clauses and modifiers (avg ${m.preMainVerbClauseCount.toFixed(1)} pre-verb clauses).`;
    } else if (prr > 0.65) {
      perExpl = `Running style: sentences deliver their main clause early and accumulate trailing modifiers and qualifications.`;
    } else {
      perExpl = `Mixed sentence architecture with both periodic suspension and running delivery.`;
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

    // Opacity
    let opaExpl: string;
    if (os < 0.25) {
      opaExpl = `Transparent prose: minimal self-consciousness or meta-linguistic play. Language operates as a clear window onto content.`;
    } else if (os > 0.60) {
      opaExpl = `Opaque prose: frequent self-conscious attention to language itself — meta-linguistic markers, sound patterning, and rhetorical display foreground the medium.`;
    } else {
      opaExpl = `Mixed opacity: occasional self-conscious passages amid predominantly transparent prose.`;
    }

    // Tacit patterns summary
    const tacitParts: string[] = [];
    if (tp.alliterationDensity > 0.1) tacitParts.push(`alliteration (${tp.alliterationDensity.toFixed(2)}/sent)`);
    if (tp.polyptotonDensity > 0.05) tacitParts.push(`polyptoton (${tp.polyptotonDensity.toFixed(2)}/sent)`);
    if (tp.chiasmusCount > 0) tacitParts.push(`chiasmus (${tp.chiasmusCount})`);
    if (tp.antithesisCount > 0) tacitParts.push(`antithesis (${tp.antithesisCount})`);
    if (tp.anaphoraCount > 0) tacitParts.push(`anaphora (${tp.anaphoraCount})`);
    if (tp.isocolonCount > 0) tacitParts.push(`isocolon (${tp.isocolonCount})`);
    if (tp.climaxPatternCount > 0) tacitParts.push(`climax patterns (${tp.climaxPatternCount})`);
    const tacitExpl = tacitParts.length > 0
      ? `Detected tacit persuasion figures: ${tacitParts.join('; ')}.`
      : '';

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
