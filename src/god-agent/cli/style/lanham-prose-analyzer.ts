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
  BE_VERBS, COMMON_VERBS, NOMINALIZATION_SUFFIXES, LATINATE_SUFFIXES, PREPOSITIONS,
  COORDINATING_CONJ, SUBORDINATING_CONJ, FORMAL_MARKERS,
  META_LINGUISTIC_MARKERS, OPACITY_CONTENT_MARKERS, PERSONALITY_MARKERS,
} from './lanham-shared.js';

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
    } as LanhamProseMetrics;

    // Adjust opacity score to incorporate tacit pattern density
    // Dense tacit patterns = prose drawing attention to its own medium (Lanham's opacity)
    if (merged.tacitPatterns) {
      const tp = merged.tacitPatterns;
      const sentCount = (text.match(/[.!?]+/g) || []).length || 1;
      const tacitTotal = (tp.anaphoraCount + tp.chiasmusCount + tp.antithesisCount +
        tp.isocolonCount + tp.climaxPatternCount) / sentCount;
      const tacitDensity = Math.min(tacitTotal / 0.3, 1); // normalize: 0.3 patterns/sentence = max
      // Revised formula: self-consciousness 0.4 + sound 0.3 + tacit patterns 0.3
      const baseOpacity = merged.opacityScore ?? 0;
      const selfConsc = merged.selfConsciousnessScore ?? 0;
      const soundContrib = (baseOpacity - selfConsc * 0.6) / 0.4; // recover sound component
      merged.opacityScore = Math.min(1, Math.max(0,
        selfConsc * 0.4 + Math.max(0, soundContrib) * 0.3 + tacitDensity * 0.3));
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

    let verbCount = 0;
    let nounStyleCount = 0; // nominalizations + prepositional phrases signal noun-heavy style
    let beVerbCount = 0;

    for (const w of words) {
      if (isVerb(w)) {
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
    // High nominalization + high be-verb + high prep phrases = noun-heavy (low ratio)
    const nounSignal = clamp(nominalizationDensity / 8, 0, 1); // 8% is very noun-heavy
    const verbSignal = clamp(verbCount / wordCount / 0.18, 0, 1); // ~18% verbs is very verb-active
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

    // Implicit subordination signals (relative clauses, complement clauses)
    // "that/which/who/whom" followed by a verb pattern = subordinate clause
    const relativeClausePattern = /\b(that|which|who|whom|whose|where|whereby)\b\s+\w+/gi;
    const relativeMatches = text.match(relativeClausePattern) || [];
    // Filter out demonstrative "that" (followed by a noun, not a verb)
    // Heuristic: "that the/a/an/this" is a complement clause; "that + verb-like" is a relative clause
    const implicitSubordCount = relativeMatches.length;

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

    // Combine explicit and implicit subordination
    const effectiveSubord = subordCount + implicitSubordCount * 0.7; // weight implicit slightly less
    const hypotaxisBoost = clamp(ppNestingDensity / 0.5) * 0.15; // nesting adds up to 0.15

    const coordinatingConjunctionDensity = coordCount / wordCount;
    const subordinatingConjunctionDensity = (subordCount + implicitSubordCount) / wordCount;

    // Higher subordination = more hypotactic (1), more coordination = more paratactic (0)
    const totalConj = coordCount + effectiveSubord;
    let parataxisHypotaxisRatio = totalConj > 0
      ? clamp(effectiveSubord / totalConj + hypotaxisBoost)
      : clamp(0.5 + hypotaxisBoost); // neutral baseline + nesting boost

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

      if (startsWithSubord || startsWithParticiple || earlyCommas > lateCommas) {
        periodicSignals++;
        if (startsWithSubord || startsWithParticiple) totalPreMainClauses++;
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

    // Voice score: dynamic range is the primary signal (Lanham: prose that rewards reading aloud)
    // Personality markers are secondary; many voiced passages use third-person or collective voice
    const voiceScore = clamp(
      dynamicRange * 0.65 + clamp(personalityDensity / 0.3) * 0.35,
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

    // Register markedness: distance from middle register
    // High register signals: latinate words, long sentences, formal markers, no contractions
    // Low register signals: short words, contractions, short sentences
    const highSignal = clamp(latinateGermanicRatio * 0.4 + formalDensity * 10 * 0.3 + clamp(mean / 30) * 0.3);
    const lowSignal = clamp(contractionRate * 10 * 0.5 + clamp(1 - mean / 20) * 0.5);

    // Markedness: how far from neutral center (either pole dominates)
    const registerMarkednessScore = clamp(Math.abs(highSignal - lowSignal));

    return {
      latinateGermanicRatio,
      registerMarkednessScore,
    };
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

    // Opacity = weighted combination:
    //   meta-linguistic (0.35): "the word X", "so-called", "as it were"
    //   content-level (0.40): prose discussing language/form/style/rhetoric
    //   sound patterns (0.25): alliteration foregrounding the medium
    // Opacity remains a SOFT OBSERVATION axis — it must NOT drive drift or regeneration.
    const opacityScore = clamp(
      metaLingDensity * 0.35 +
      contentOpacityDensity * 0.40 +
      soundDensity * 0.25
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
      const re = new RegExp(`\\b${a}\\b[^.]{1,40}\\b${b}\\b`, 'gi');
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

    // Register label: uses genre-specific bands from policy (lanham-style-policy.ts)
    const lgr = m.latinateGermanicRatio ?? 0.5;
    const rms = m.registerMarkednessScore ?? 0;
    const regBands = t.register;
    let primaryRegister: 'high' | 'middle' | 'low' | 'mixed';
    let registerMixed = false;
    if (rms < 0.25) {
      // Low markedness: route by Latinate ratio against genre-specific boundaries
      if (lgr >= regBands.middleToHigh) {
        primaryRegister = 'high';
      } else if (lgr >= regBands.lowToMiddle) {
        primaryRegister = 'middle';
      } else {
        primaryRegister = 'low';
      }
    } else {
      // Marked prose: use same genre-specific boundaries for primary register.
      // "Mixed" only when markedness is very high (>0.5) AND ratio is in the middle band,
      // indicating genuine register fluctuation within the text.
      if (lgr >= regBands.middleToHigh) {
        primaryRegister = 'high';
      } else if (lgr < regBands.lowToMiddle) {
        primaryRegister = 'low';
      } else if (rms > 0.5) {
        // High markedness + middle-band Latinate = genuine register mixing
        primaryRegister = 'mixed';
        registerMixed = true;
      } else {
        // Moderate markedness + middle-band Latinate = middle register
        primaryRegister = 'middle';
      }
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
