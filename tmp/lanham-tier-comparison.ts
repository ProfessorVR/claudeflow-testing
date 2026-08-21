/**
 * Lanham Tier 1 vs Tier 2 — Full Comparison
 * Runs both LanhamProseAnalyzer (Tier 1) and AdvancedLanhamAnalyzer (Tier 2)
 * against the 40-entry authoritative gold set. Outputs structured JSON to stdout.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';
import { AdvancedLanhamAnalyzer } from '../src/god-agent/cli/style/advanced-lanham-analyzer.js';
import type { LanhamProseMetrics } from '../src/god-agent/universal/style-analyzer.js';

// ── Types ────────────────────────────────────────────────────────────────────

interface GoldEntry {
  id: string;
  genre: string;
  text: string;
  labels: {
    nounVerb: string;
    parataxisHypotaxis: string;
    periodicRunning: string;
    voice: string;
    primaryRegister: string;
    opacity: string;
  };
  source: string;
  notes: string;
}

interface EntryResult {
  id: string;
  genre: string;
  gold: GoldEntry['labels'];
  tier1: {
    labels: Record<string, string>;
    scores: Record<string, number>;
  };
  tier2: {
    labels: Record<string, string>;
    scores: Record<string, number>;
  };
}

// ── Ordinal maps ─────────────────────────────────────────────────────────────

const ORDINALS: Record<string, Record<string, number>> = {
  nounVerb: { 'predominantly noun-style': 0, 'balanced': 1, 'predominantly verb-style': 2 },
  parataxisHypotaxis: { 'predominantly paratactic': 0, 'mixed': 1, 'predominantly hypotactic': 2 },
  periodicRunning: { 'predominantly periodic': 0, 'mixed': 1, 'predominantly running': 2 },
  voice: { 'unvoiced': 0, 'moderate voice': 1, 'strongly voiced': 2 },
  primaryRegister: { 'low': 0, 'middle': 1, 'mixed': 1.5, 'high': 2 },
  opacity: { 'transparent': 0, 'mixed opacity': 1, 'opaque': 2 },
};

const AXIS_SCORE_MAP: Record<string, keyof LanhamProseMetrics> = {
  nounVerb: 'nounVerbRatio',
  parataxisHypotaxis: 'parataxisHypotaxisRatio',
  periodicRunning: 'periodicRunningRatio',
  voice: 'voiceScore',
  primaryRegister: 'registerMarkednessScore',
  opacity: 'opacityScore',
};

const AXIS_LABEL_MAP: Record<string, keyof LanhamProseMetrics['labels']> = {
  nounVerb: 'nounVerb',
  parataxisHypotaxis: 'parataxisHypotaxis',
  periodicRunning: 'periodicRunning',
  voice: 'voice',
  primaryRegister: 'primaryRegister',
  opacity: 'opacity',
};

const GOLD_LABEL_MAP: Record<string, keyof GoldEntry['labels']> = {
  nounVerb: 'nounVerb',
  parataxisHypotaxis: 'parataxisHypotaxis',
  periodicRunning: 'periodicRunning',
  voice: 'voice',
  primaryRegister: 'primaryRegister',
  opacity: 'opacity',
};

// ── Spearman ─────────────────────────────────────────────────────────────────

function spearmanRho(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;
  function rank(arr: number[]): number[] {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(n);
    let i = 0;
    while (i < n) {
      let j = i;
      while (j < n - 1 && sorted[j + 1].v === sorted[j].v) j++;
      const avgRank = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) ranks[sorted[k].i] = avgRank;
      i = j + 1;
    }
    return ranks;
  }
  const rx = rank(x);
  const ry = rank(y);
  const dSq = rx.reduce((s, r, i) => s + (r - ry[i]) ** 2, 0);
  return 1 - (6 * dSq) / (n * (n * n - 1));
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const goldPath = resolve(process.cwd(), 'tests/calibration/lanham-gold-set.jsonl');
  const raw = readFileSync(goldPath, 'utf-8');
  const entries: GoldEntry[] = raw.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

  const tier1 = new LanhamProseAnalyzer('general');
  const tier2 = new AdvancedLanhamAnalyzer('general');

  const results: EntryResult[] = [];

  for (const entry of entries) {
    const [m1, m2] = await Promise.all([
      tier1.fullAnalysis(entry.text),
      tier2.fullAnalysis(entry.text),
    ]);

    results.push({
      id: entry.id,
      genre: entry.genre,
      gold: entry.labels,
      tier1: {
        labels: {
          nounVerb: m1.labels.nounVerb,
          parataxisHypotaxis: m1.labels.parataxisHypotaxis,
          periodicRunning: m1.labels.periodicRunning,
          voice: m1.labels.voice,
          primaryRegister: m1.labels.primaryRegister,
          opacity: m1.labels.opacity,
        },
        scores: {
          nounVerbRatio: m1.nounVerbRatio,
          parataxisHypotaxisRatio: m1.parataxisHypotaxisRatio,
          periodicRunningRatio: m1.periodicRunningRatio,
          voiceScore: m1.voiceScore,
          registerMarkednessScore: m1.registerMarkednessScore,
          opacityScore: m1.opacityScore,
          nominalizationDensity: m1.nominalizationDensity,
          beVerbRatio: m1.beVerbRatio,
          prepositionalPhraseDensity: m1.prepositionalPhraseDensity,
          latinateGermanicRatio: m1.latinateGermanicRatio,
          dynamicRange: m1.dynamicRange,
          selfConsciousnessScore: m1.selfConsciousnessScore,
        },
      },
      tier2: {
        labels: {
          nounVerb: m2.labels.nounVerb,
          parataxisHypotaxis: m2.labels.parataxisHypotaxis,
          periodicRunning: m2.labels.periodicRunning,
          voice: m2.labels.voice,
          primaryRegister: m2.labels.primaryRegister,
          opacity: m2.labels.opacity,
        },
        scores: {
          nounVerbRatio: m2.nounVerbRatio,
          parataxisHypotaxisRatio: m2.parataxisHypotaxisRatio,
          periodicRunningRatio: m2.periodicRunningRatio,
          voiceScore: m2.voiceScore,
          registerMarkednessScore: m2.registerMarkednessScore,
          opacityScore: m2.opacityScore,
          nominalizationDensity: m2.nominalizationDensity,
          beVerbRatio: m2.beVerbRatio,
          prepositionalPhraseDensity: m2.prepositionalPhraseDensity,
          latinateGermanicRatio: m2.latinateGermanicRatio,
          dynamicRange: m2.dynamicRange,
          selfConsciousnessScore: m2.selfConsciousnessScore,
        },
      },
    });
  }

  // ── Per-axis aggregate stats ───────────────────────────────────────────────

  const axes = Object.keys(ORDINALS);
  const axisStats: Record<string, {
    tier1Agreement: number;
    tier2Agreement: number;
    tier1Monotonicity: number;
    tier2Monotonicity: number;
    tier1Mismatches: string[];
    tier2Mismatches: string[];
    labelDifferences: string[];
    scoreDeltaAvg: number;
    scoreDeltaMax: number;
    scoreDeltaEntries: { id: string; t1: number; t2: number; delta: number }[];
  }> = {};

  for (const axis of axes) {
    let t1Match = 0, t2Match = 0;
    const t1Mismatches: string[] = [];
    const t2Mismatches: string[] = [];
    const labelDiffs: string[] = [];
    const goldOrds: number[] = [];
    const t1Scores: number[] = [];
    const t2Scores: number[] = [];
    const scoreDeltaEntries: { id: string; t1: number; t2: number; delta: number }[] = [];

    for (const r of results) {
      const goldLabel = r.gold[GOLD_LABEL_MAP[axis]];
      const t1Label = r.tier1.labels[axis];
      const t2Label = r.tier2.labels[axis];

      if (t1Label === goldLabel) t1Match++;
      else t1Mismatches.push(`${r.id}: gold="${goldLabel}" t1="${t1Label}"`);

      if (t2Label === goldLabel) t2Match++;
      else t2Mismatches.push(`${r.id}: gold="${goldLabel}" t2="${t2Label}"`);

      if (t1Label !== t2Label) {
        labelDiffs.push(`${r.id}: t1="${t1Label}" t2="${t2Label}" gold="${goldLabel}"`);
      }

      const scoreKey = AXIS_SCORE_MAP[axis] as string;
      const t1Score = r.tier1.scores[scoreKey.replace('Ratio', 'Ratio').replace('Score', 'Score')] ?? 0;
      const t2Score = r.tier2.scores[scoreKey.replace('Ratio', 'Ratio').replace('Score', 'Score')] ?? 0;

      // Fix: use the actual score key names from the results
      const t1S = (r.tier1.scores as Record<string, number>)[scoreKey] ?? 0;
      const t2S = (r.tier2.scores as Record<string, number>)[scoreKey] ?? 0;

      const goldOrd = ORDINALS[axis][goldLabel];
      if (goldOrd !== undefined) {
        goldOrds.push(goldOrd);
        t1Scores.push(t1S);
        t2Scores.push(t2S);
      }

      scoreDeltaEntries.push({ id: r.id, t1: t1S, t2: t2S, delta: t2S - t1S });
    }

    const n = results.length;
    const deltas = scoreDeltaEntries.map(e => Math.abs(e.delta));

    axisStats[axis] = {
      tier1Agreement: t1Match / n,
      tier2Agreement: t2Match / n,
      tier1Monotonicity: spearmanRho(goldOrds, t1Scores),
      tier2Monotonicity: spearmanRho(goldOrds, t2Scores),
      tier1Mismatches: t1Mismatches,
      tier2Mismatches: t2Mismatches,
      labelDifferences: labelDiffs,
      scoreDeltaAvg: deltas.reduce((a, b) => a + b, 0) / deltas.length,
      scoreDeltaMax: Math.max(...deltas),
      scoreDeltaEntries: scoreDeltaEntries.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)),
    };
  }

  // Output complete report as JSON
  console.log(JSON.stringify({
    totalEntries: results.length,
    axisStats,
    perEntry: results,
  }, null, 2));
}

main().catch(e => { console.error(e); process.exit(1); });
