/**
 * F5: Weight optimization + threshold calibration for Lanham axes.
 *
 * Hard dataset separation:
 *   - Trains ONLY on data/expansion-labels.jsonl (expansion set)
 *   - Validates ONLY on data/gold-holdout.jsonl (40 authoritative passages)
 *   - Assertion guard: no gold ID may appear in training/test
 *
 * Usage:
 *   npx tsx scripts/lanham-calibration/weight-optimizer.ts
 *
 * Outputs: src/god-agent/cli/style/data/lanham-calibrated-weights.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { LanhamProseAnalyzer } from '../../src/god-agent/cli/style/lanham-prose-analyzer.js';
import type { LanhamProseMetrics } from '../../src/god-agent/universal/style-analyzer.js';

// ── Types ────────────────────────────────────────────────────────────────────

interface ExpansionLabel {
  id: string;
  genre: string;
  claude_labels: Record<string, string>;
  claude_confidence: Record<string, number>;
  error?: string;
}

interface GoldEntry {
  id: string;
  genre: string;
  text: string;
  labels: Record<string, string>;
}

interface CorpusEntry {
  id: string;
  genre: string;
  text: string;
}

interface AxisConfig {
  name: string;
  scoreField: keyof LanhamProseMetrics;
  labelField: keyof LanhamProseMetrics['labels'];
  ordinalMap: Record<string, number>;
  signalExtractor?: (metrics: LanhamProseMetrics) => number[];
  signalNames?: string[];
}

// ── Ordinal maps ─────────────────────────────────────────────────────────────

const AXIS_CONFIGS: AxisConfig[] = [
  {
    name: 'nounVerb',
    scoreField: 'nounVerbRatio',
    labelField: 'nounVerb',
    ordinalMap: { 'predominantly noun-style': 0, 'balanced': 1, 'predominantly verb-style': 2 },
  },
  {
    name: 'parataxisHypotaxis',
    scoreField: 'parataxisHypotaxisRatio',
    labelField: 'parataxisHypotaxis',
    ordinalMap: { 'predominantly paratactic': 0, 'mixed': 1, 'predominantly hypotactic': 2 },
  },
  {
    name: 'periodicRunning',
    scoreField: 'periodicRunningRatio',
    labelField: 'periodicRunning',
    ordinalMap: { 'predominantly periodic': 0, 'mixed': 1, 'predominantly running': 2 },
  },
  {
    name: 'voice',
    scoreField: 'voiceScore',
    labelField: 'voice',
    ordinalMap: { 'unvoiced': 0, 'moderate voice': 1, 'strongly voiced': 2 },
  },
  {
    name: 'primaryRegister',
    scoreField: 'registerMarkednessScore',
    labelField: 'primaryRegister',
    ordinalMap: { 'low': 0, 'middle': 1, 'mixed': 1.5, 'high': 2 },
  },
  {
    name: 'opacity',
    scoreField: 'opacityScore',
    labelField: 'opacity',
    ordinalMap: { 'transparent': 0, 'mixed opacity': 1, 'opaque': 2 },
  },
];

// ── Statistical helpers ──────────────────────────────────────────────────────

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
  return 1 - (6 * rx.reduce((s, r, i) => s + (r - ry[i]) ** 2, 0)) / (n * (n * n - 1));
}

function categoricalAgreement(predicted: string[], gold: string[]): number {
  let match = 0;
  for (let i = 0; i < predicted.length; i++) {
    if (predicted[i] === gold[i]) match++;
  }
  return match / predicted.length;
}

// ── Threshold fitting ────────────────────────────────────────────────────────

interface ThresholdResult {
  lowBand: number;
  highBand: number;
  agreement: number;
}

function fitThresholds(
  scores: number[],
  goldLabels: string[],
  ordinalMap: Record<string, number>,
): ThresholdResult {
  // Get the label names in ordinal order
  const orderedLabels = Object.entries(ordinalMap)
    .sort((a, b) => a[1] - b[1])
    .map(e => e[0]);

  if (orderedLabels.length < 3) {
    return { lowBand: 0.33, highBand: 0.67, agreement: 0 };
  }

  const lowLabel = orderedLabels[0];
  const highLabel = orderedLabels[orderedLabels.length - 1];

  let bestAgreement = 0;
  let bestLow = 0.33;
  let bestHigh = 0.67;

  // Grid search over threshold pairs
  for (let low = 0.10; low <= 0.60; low += 0.02) {
    for (let high = low + 0.05; high <= 0.90; high += 0.02) {
      let matches = 0;
      for (let i = 0; i < scores.length; i++) {
        let predicted: string;
        if (scores[i] < low) predicted = lowLabel;
        else if (scores[i] > high) predicted = highLabel;
        else predicted = orderedLabels[1]; // middle label

        if (predicted === goldLabels[i]) matches++;
      }
      const agreement = matches / scores.length;
      if (agreement > bestAgreement) {
        bestAgreement = agreement;
        bestLow = low;
        bestHigh = high;
      }
    }
  }

  return { lowBand: bestLow, highBand: bestHigh, agreement: bestAgreement };
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const expansionLabelsPath = resolve(process.cwd(), 'data/expansion-labels.jsonl');
  const expansionCorpusPath = resolve(process.cwd(), 'data/expansion-corpus.jsonl');
  const goldPath = resolve(process.cwd(), 'data/gold-holdout.jsonl');
  const goldFallbackPath = resolve(process.cwd(), 'tests/calibration/lanham-gold-set.jsonl');
  const outputPath = resolve(process.cwd(), 'src/god-agent/cli/style/data/lanham-calibrated-weights.json');

  // Load expansion labels
  const expansionLabels: ExpansionLabel[] = readFileSync(expansionLabelsPath, 'utf-8')
    .split('\n').filter(l => l.trim())
    .map(l => JSON.parse(l))
    .filter((e: ExpansionLabel) => !e.error && Object.keys(e.claude_labels).length > 0);

  // Load expansion corpus (for text)
  const corpusMap = new Map<string, CorpusEntry>();
  readFileSync(expansionCorpusPath, 'utf-8')
    .split('\n').filter(l => l.trim())
    .map(l => JSON.parse(l) as CorpusEntry)
    .forEach(e => corpusMap.set(e.id, e));

  // Load gold holdout
  const goldHoldoutPath = existsSync(goldPath) ? goldPath : goldFallbackPath;
  const goldEntries: GoldEntry[] = readFileSync(goldHoldoutPath, 'utf-8')
    .split('\n').filter(l => l.trim())
    .map(l => JSON.parse(l));

  // ASSERTION GUARD: no gold ID in expansion set
  const goldIds = new Set(goldEntries.map(e => e.id));
  for (const el of expansionLabels) {
    if (goldIds.has(el.id)) {
      console.error(`FATAL: Gold set ID "${el.id}" found in expansion labels. Aborting.`);
      process.exit(1);
    }
  }

  console.log('=== F5: Weight Optimization ===');
  console.log(`Expansion labels: ${expansionLabels.length} (valid)`);
  console.log(`Gold holdout: ${goldEntries.length} (validation only)`);
  console.log('');

  // Split expansion 80/20 stratified by genre
  const byGenre = new Map<string, ExpansionLabel[]>();
  for (const el of expansionLabels) {
    if (!byGenre.has(el.genre)) byGenre.set(el.genre, []);
    byGenre.get(el.genre)!.push(el);
  }

  const trainSet: ExpansionLabel[] = [];
  const testSet: ExpansionLabel[] = [];

  for (const [genre, entries] of byGenre) {
    // Shuffle deterministically
    const shuffled = [...entries].sort((a, b) => a.id.localeCompare(b.id));
    const splitIdx = Math.floor(shuffled.length * 0.8);
    trainSet.push(...shuffled.slice(0, splitIdx));
    testSet.push(...shuffled.slice(splitIdx));
  }

  console.log(`Train: ${trainSet.length}, Test: ${testSet.length}`);

  // Run Tier 1 analysis on all expansion passages
  const analyzer = new LanhamProseAnalyzer('general');
  console.log('Running Tier 1 analysis on expansion set...');

  const metricsMap = new Map<string, LanhamProseMetrics>();
  for (const el of [...trainSet, ...testSet]) {
    const corpus = corpusMap.get(el.id);
    if (!corpus) continue;
    const metrics = await analyzer.fullAnalysis(corpus.text);
    metricsMap.set(el.id, metrics);
  }

  console.log(`Analyzed: ${metricsMap.size} passages`);
  console.log('');

  // ── Per-axis threshold fitting ──────────────────────────────────────────

  const results: Record<string, {
    trainMono: number;
    testMono: number;
    trainAgreement: number;
    testAgreement: number;
    thresholds: ThresholdResult;
  }> = {};

  for (const axis of AXIS_CONFIGS) {
    console.log(`--- ${axis.name} ---`);

    // Collect train data
    const trainScores: number[] = [];
    const trainOrds: number[] = [];
    const trainGoldLabels: string[] = [];

    for (const el of trainSet) {
      const metrics = metricsMap.get(el.id);
      const label = el.claude_labels[axis.name];
      if (!metrics || !label) continue;
      const ord = axis.ordinalMap[label];
      if (ord === undefined) continue;

      const score = metrics[axis.scoreField] as number;
      trainScores.push(score);
      trainOrds.push(ord);
      trainGoldLabels.push(label);
    }

    // Collect test data
    const testScores: number[] = [];
    const testOrds: number[] = [];
    const testGoldLabels: string[] = [];

    for (const el of testSet) {
      const metrics = metricsMap.get(el.id);
      const label = el.claude_labels[axis.name];
      if (!metrics || !label) continue;
      const ord = axis.ordinalMap[label];
      if (ord === undefined) continue;

      const score = metrics[axis.scoreField] as number;
      testScores.push(score);
      testOrds.push(ord);
      testGoldLabels.push(label);
    }

    // Monotonicity
    const trainMono = spearmanRho(trainOrds, trainScores);
    const testMono = spearmanRho(testOrds, testScores);

    // Fit thresholds on training set
    const thresholds = fitThresholds(trainScores, trainGoldLabels, axis.ordinalMap);

    // Validate thresholds on test set
    const orderedLabels = Object.entries(axis.ordinalMap)
      .sort((a, b) => a[1] - b[1])
      .map(e => e[0]);
    const lowLabel = orderedLabels[0];
    const highLabel = orderedLabels[orderedLabels.length - 1];
    const midLabel = orderedLabels[1];

    const testPredictions = testScores.map(s =>
      s < thresholds.lowBand ? lowLabel : s > thresholds.highBand ? highLabel : midLabel
    );
    const testAgreement = categoricalAgreement(testPredictions, testGoldLabels);

    results[axis.name] = {
      trainMono,
      testMono,
      trainAgreement: thresholds.agreement,
      testAgreement,
      thresholds,
    };

    console.log(`  Train mono: ${trainMono.toFixed(3)}, Test mono: ${testMono.toFixed(3)} (gap: ${Math.abs(trainMono - testMono).toFixed(3)})`);
    console.log(`  Train agree: ${(thresholds.agreement * 100).toFixed(1)}%, Test agree: ${(testAgreement * 100).toFixed(1)}%`);
    console.log(`  Thresholds: low=${thresholds.lowBand.toFixed(2)}, high=${thresholds.highBand.toFixed(2)}`);

    // Length sensitivity check
    const shortPassages = trainSet.filter(el => {
      const c = corpusMap.get(el.id);
      return c && c.text.split(/\s+/).length < 150;
    });
    const longPassages = trainSet.filter(el => {
      const c = corpusMap.get(el.id);
      return c && c.text.split(/\s+/).length > 300;
    });

    if (shortPassages.length >= 5 && longPassages.length >= 5) {
      const shortPreds = shortPassages.map(el => {
        const m = metricsMap.get(el.id);
        if (!m) return '';
        const s = m[axis.scoreField] as number;
        return s < thresholds.lowBand ? lowLabel : s > thresholds.highBand ? highLabel : midLabel;
      });
      const shortGold = shortPassages.map(el => el.claude_labels[axis.name] || '');
      const shortAgree = categoricalAgreement(shortPreds, shortGold);

      const longPreds = longPassages.map(el => {
        const m = metricsMap.get(el.id);
        if (!m) return '';
        const s = m[axis.scoreField] as number;
        return s < thresholds.lowBand ? lowLabel : s > thresholds.highBand ? highLabel : midLabel;
      });
      const longGold = longPassages.map(el => el.claude_labels[axis.name] || '');
      const longAgree = categoricalAgreement(longPreds, longGold);

      if (shortAgree < longAgree - 0.15) {
        console.log(`  LENGTH SENSITIVITY: short=${(shortAgree * 100).toFixed(1)}% vs long=${(longAgree * 100).toFixed(1)}% (>15% gap)`);
      }
    }

    console.log('');
  }

  // ── Gold holdout validation ─────────────────────────────────────────────

  console.log('=== Gold Holdout Validation ===');
  console.log('Running analysis on 40 authoritative passages...');

  const goldMetrics: Array<{ entry: GoldEntry; metrics: LanhamProseMetrics }> = [];
  for (const entry of goldEntries) {
    const metrics = await analyzer.fullAnalysis(entry.text);
    goldMetrics.push({ entry, metrics });
  }

  const holdoutResults: Record<string, {
    monotonicity: number;
    agreement: number;
    baseline_mono: number;
  }> = {};

  // Pre-Phase-F baselines
  const baselines: Record<string, number> = {
    nounVerb: 0.732,
    parataxisHypotaxis: 0.372,
    periodicRunning: 0.349,
    voice: 0.372,
    primaryRegister: 0.673,
    opacity: 0.192,
  };

  for (const axis of AXIS_CONFIGS) {
    const goldOrds: number[] = [];
    const goldScores: number[] = [];
    const goldPredLabels: string[] = [];
    const goldTrueLabels: string[] = [];

    const orderedLabels = Object.entries(axis.ordinalMap)
      .sort((a, b) => a[1] - b[1])
      .map(e => e[0]);
    const lowLabel = orderedLabels[0];
    const highLabel = orderedLabels[orderedLabels.length - 1];
    const midLabel = orderedLabels[1];

    const thresh = results[axis.name]?.thresholds;

    for (const { entry, metrics } of goldMetrics) {
      const goldLabel = entry.labels[axis.labelField as string];
      const ord = axis.ordinalMap[goldLabel];
      if (ord === undefined) continue;

      const score = metrics[axis.scoreField] as number;
      goldOrds.push(ord);
      goldScores.push(score);
      goldTrueLabels.push(goldLabel);

      if (thresh) {
        const pred = score < thresh.lowBand ? lowLabel : score > thresh.highBand ? highLabel : midLabel;
        goldPredLabels.push(pred);
      }
    }

    const mono = spearmanRho(goldOrds, goldScores);
    const agree = thresh ? categoricalAgreement(goldPredLabels, goldTrueLabels) : 0;
    const baselineMono = baselines[axis.name] || 0;

    holdoutResults[axis.name] = {
      monotonicity: mono,
      agreement: agree,
      baseline_mono: baselineMono,
    };

    const monoChange = mono - baselineMono;
    const monoStatus = monoChange >= 0.03 ? 'IMPROVED' : monoChange >= -0.02 ? 'STABLE' : 'DEGRADED';
    console.log(`  ${axis.name.padEnd(22)} mono=${mono.toFixed(3)} (Δ${monoChange >= 0 ? '+' : ''}${monoChange.toFixed(3)}) agree=${(agree * 100).toFixed(1)}% [${monoStatus}]`);
  }

  // Pass criteria
  const improved = Object.values(holdoutResults).filter(r => r.monotonicity - r.baseline_mono >= 0.03).length;
  const degraded = Object.values(holdoutResults).filter(r => r.monotonicity - r.baseline_mono < -0.02).length;

  console.log('');
  console.log(`Axes improved ≥0.03: ${improved}/6 (need ≥3)`);
  console.log(`Axes degraded >0.02: ${degraded}/6 (need 0)`);

  const passed = improved >= 3 && degraded === 0;
  console.log(`Overall: ${passed ? 'PASS' : 'FAIL'}`);

  // Write output
  const config = {
    calibrationDate: new Date().toISOString().split('T')[0],
    expansionSetSize: expansionLabels.length,
    goldSetSize: goldEntries.length,
    trainSize: trainSet.length,
    testSize: testSet.length,
    passed,
    axes: {} as Record<string, any>,
  };

  for (const axis of AXIS_CONFIGS) {
    const r = results[axis.name];
    const h = holdoutResults[axis.name];
    config.axes[axis.name] = {
      thresholds: r?.thresholds ? { lowBand: r.thresholds.lowBand, highBand: r.thresholds.highBand } : null,
      trainMono: r?.trainMono,
      testMono: r?.testMono,
      trainAgreement: r?.trainAgreement,
      testAgreement: r?.testAgreement,
      holdoutMono: h?.monotonicity,
      holdoutAgreement: h?.agreement,
      baselineMono: h?.baseline_mono,
    };
  }

  writeFileSync(outputPath, JSON.stringify(config, null, 2));
  console.log(`\nConfig written to: ${outputPath}`);
}

main().catch(e => { console.error(e); process.exit(1); });
