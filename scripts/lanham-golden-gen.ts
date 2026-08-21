/**
 * Golden-test generator for the Rust Lanham analyzer port.
 * Runs the canonical TS functions on fixture texts and writes the expected
 * outputs to lanham-rs/tests/, so the Rust port can assert byte-for-byte parity.
 *
 *   npx tsx scripts/lanham-golden-gen.ts
 */
import {
  tokenize, splitSentences,
  isVerb, isNominalization, isLatinate, roughStem, getContentWords,
} from '../src/god-agent/cli/style/lanham-shared.js';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';
import { writeFileSync, mkdirSync } from 'node:fs';

const TEXTS = [
  "Boredom, in Heidegger's account, does not denote a merely psychological inconvenience; it discloses something more radical.",
  "In the third book of the De Anima, Aristotle situates phantasia between perception and thought, and this position proves decisive.",
  "Virtual environments pose a genuine challenge. They are not real, yet they are experienced as real, and this paradox is the crux.",
  "Short. Two words. A slightly longer sentence with more than two words follows here.",
  "Well-formed hyphenated words and don't-style contractions should survive tokenization intact.",
];

const golden = TEXTS.map((text) => ({
  text,
  tokens: tokenize(text),
  sentences: splitSentences(text),
}));

const dir = '/home/dalton/projects/lanham-rs/tests';
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/golden_foundation.json`, JSON.stringify(golden, null, 2));

// Lexical helpers: edge-case word list exercising verb/nominalization/latinate/stem/stopword logic.
const WORDS = [
  'running', 'walked', 'goes', 'argues', 'establishes', 'the', 'is', 'consideration', 'nation',
  'structure', 'establishment', 'happiness', 'beautiful', 'active', 'possible', 'logical', 'cat',
  'phantasia', 'perception', 'wrote', 'understood', 'it', 'development',
];
const lexical = {
  words: WORDS,
  isVerb: WORDS.map(isVerb),
  isNominalization: WORDS.map(isNominalization),
  isLatinate: WORDS.map(isLatinate),
  roughStem: WORDS.map(roughStem),
  contentWords: getContentWords(WORDS),
};
writeFileSync(`${dir}/golden_lexical.json`, JSON.stringify(lexical, null, 2));

// Axis outputs from the canonical analyzer (POS-free axes; latinateGermanicRatio is fully POS-free).
// NOTE: run with en-pos hidden so these reflect the POS-free L2 target the Rust port reproduces.
const analyzer = new LanhamProseAnalyzer('academic');
const axes: any[] = [];
for (const text of TEXTS) {
  const reg = await analyzer.analyzeRegister(text);
  const nv = await analyzer.analyzeNounVerbAxis(text);
  const pp = await analyzer.analyzeParataxisHypotaxis(text);
  const vo = await analyzer.analyzeVoice(text);
  const per = await analyzer.analyzePeriodicRunning(text);
  axes.push({
    text,
    latinateGermanicRatio: reg.latinateGermanicRatio,
    nounVerbRatio: nv.nounVerbRatio,
    nominalizationDensity: nv.nominalizationDensity,
    prepositionalPhraseDensity: nv.prepositionalPhraseDensity,
    beVerbRatio: nv.beVerbRatio,
    parataxisHypotaxisRatio: pp.parataxisHypotaxisRatio,
    coordinatingConjunctionDensity: pp.coordinatingConjunctionDensity,
    subordinatingConjunctionDensity: pp.subordinatingConjunctionDensity,
    periodicRunningRatio: per.periodicRunningRatio,
    preMainVerbClauseCount: per.preMainVerbClauseCount,
    voiceScore: vo.voiceScore,
    dynamicRange: vo.dynamicRange,
    registerMarkednessScore: reg.registerMarkednessScore,
  });
}
writeFileSync(`${dir}/golden_axes.json`, JSON.stringify(axes, null, 2));

// Full analysis = complete lanhamMetrics + labels (POS-free target, en-pos hidden).
const full: any[] = [];
for (const text of TEXTS) {
  const m: any = await analyzer.fullAnalysis(text);
  full.push({
    text,
    nounVerbRatio: m.nounVerbRatio, nominalizationDensity: m.nominalizationDensity,
    prepositionalPhraseDensity: m.prepositionalPhraseDensity, beVerbRatio: m.beVerbRatio,
    parataxisHypotaxisRatio: m.parataxisHypotaxisRatio,
    coordinatingConjunctionDensity: m.coordinatingConjunctionDensity,
    subordinatingConjunctionDensity: m.subordinatingConjunctionDensity,
    periodicRunningRatio: m.periodicRunningRatio, preMainVerbClauseCount: m.preMainVerbClauseCount,
    voiceScore: m.voiceScore, dynamicRange: m.dynamicRange,
    latinateGermanicRatio: m.latinateGermanicRatio, registerMarkednessScore: m.registerMarkednessScore,
    opacityScore: m.opacityScore, selfConsciousnessScore: m.selfConsciousnessScore,
    tacitPatterns: m.tacitPatterns, labels: m.labels,
  });
}
writeFileSync(`${dir}/golden_full.json`, JSON.stringify(full, null, 2));

console.log(`wrote ${golden.length} foundation + ${WORDS.length} lexical + ${axes.length} axis fixtures -> ${dir}`);
