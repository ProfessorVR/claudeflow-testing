/**
 * Test alternative passage-level aggregators for matrixDelay.
 * Addresses the dilution problem: mixed passages average away periodic sentences.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { LanhamClauseParser } from '../src/god-agent/cli/style/lanham-clause-parser.js';
import { createEnPosBackend, clamp, splitSentences, suspensionMarkerDensity } from '../src/god-agent/cli/style/lanham-shared.js';
import { computePeriodicSignals } from '../src/god-agent/cli/style/lanham-clause-features.js';

interface GoldEntry { id: string; text: string; labels: Record<string, string>; }
const ORD: Record<string, number> = { 'predominantly periodic': 0, 'mixed': 1, 'predominantly running': 2 };

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
      const avg = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) ranks[sorted[k].i] = avg;
      i = j + 1;
    }
    return ranks;
  }
  const rx = rank(x), ry = rank(y);
  return 1 - (6 * rx.reduce((s, r, i) => s + (r - ry[i]) ** 2, 0)) / (n * (n * n - 1));
}

async function main() {
  const gold: GoldEntry[] = readFileSync(resolve(process.cwd(), 'tests/calibration/lanham-gold-set.jsonl'), 'utf-8')
    .split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

  const backend = createEnPosBackend()!;
  const parser = new LanhamClauseParser({ backend });

  // Compute per-sentence delays for each passage
  const data = gold.map(entry => {
    const clauseDoc = parser.parseDocument(entry.text);
    const sentenceDelays: number[] = [];
    for (const sent of clauseDoc.sentences) {
      const signals = computePeriodicSignals(sent);
      sentenceDelays.push(signals.leftBranchIndex); // 0 = running, 1 = periodic
    }

    // Also compute suspension + sentence length signals for the ensemble
    const sentences = splitSentences(entry.text);
    const suspMarkers = suspensionMarkerDensity(sentences);
    const suspRunning = 1 - clamp(suspMarkers / 0.3);
    const avgSentLen = sentences.reduce((s, sent) => s + sent.split(/\s+/).length, 0) / (sentences.length || 1);
    const shortSentSignal = clamp((15 - avgSentLen) / 10);

    return {
      id: entry.id,
      goldOrd: ORD[entry.labels.periodicRunning] ?? 1,
      goldLabel: entry.labels.periodicRunning,
      sentenceDelays,
      suspRunning,
      shortSentSignal,
    };
  });

  const goldOrds = data.map(d => d.goldOrd);

  // Aggregation variants
  const aggregators: Array<{ name: string; compute: (delays: number[]) => number }> = [
    {
      name: 'Mean delay (current)',
      compute: delays => delays.length > 0 ? delays.reduce((a, b) => a + b) / delays.length : 0.5,
    },
    {
      name: 'Max delay',
      compute: delays => delays.length > 0 ? Math.max(...delays) : 0.5,
    },
    {
      name: 'Top-2 mean delay',
      compute: delays => {
        if (delays.length === 0) return 0.5;
        const sorted = [...delays].sort((a, b) => b - a);
        const top = sorted.slice(0, 2);
        return top.reduce((a, b) => a + b) / top.length;
      },
    },
    {
      name: 'Proportion delay > 0.5',
      compute: delays => delays.length > 0 ? delays.filter(d => d > 0.5).length / delays.length : 0,
    },
    {
      name: 'Proportion delay > 0.6',
      compute: delays => delays.length > 0 ? delays.filter(d => d > 0.6).length / delays.length : 0,
    },
    {
      name: '75th percentile delay',
      compute: delays => {
        if (delays.length === 0) return 0.5;
        const sorted = [...delays].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length * 0.75)] ?? 0.5;
      },
    },
  ];

  console.log('=== PERIODIC AGGREGATION VARIANTS ===\n');
  console.log('Testing different ways to summarize sentence-level matrixDelay at passage level.\n');
  console.log('Variant'.padEnd(30), 'Solo Mono'.padEnd(12), 'Ensemble Mono'.padEnd(14), 'Δ from current');
  console.log('-'.repeat(72));

  const currentEnsembleMono = 0.512; // current production

  for (const agg of aggregators) {
    // Solo monotonicity (aggregator alone)
    const soloScores = data.map(d => 1 - agg.compute(d.sentenceDelays)); // invert: higher = more running
    const soloMono = spearmanRho(goldOrds, soloScores);

    // Ensemble monotonicity (aggregator * 0.45 + susp * 0.30 + sentLen * 0.25)
    const ensembleScores = data.map(d => {
      const delayRunning = 1 - agg.compute(d.sentenceDelays);
      return clamp(delayRunning * 0.45 + d.suspRunning * 0.30 + d.shortSentSignal * 0.25);
    });
    const ensembleMono = spearmanRho(goldOrds, ensembleScores);

    const delta = ensembleMono - currentEnsembleMono;
    console.log(
      agg.name.padEnd(30),
      soloMono.toFixed(3).padEnd(12),
      ensembleMono.toFixed(3).padEnd(14),
      (delta >= 0 ? '+' : '') + delta.toFixed(3),
    );
  }

  // Show the problematic passages under best variant
  console.log('\n=== AUDIT: Brougham + Gettysburg under each aggregator ===\n');
  const auditIds = ['lanham_ch2_brougham', 'lanham_ch7_gettysburg', 'lanham_ch5_fedregister', 'lanham_ch8_churchill'];
  for (const id of auditIds) {
    const d = data.find(x => x.id === id);
    if (!d) continue;
    console.log(`${id} (gold: ${d.goldLabel}, ${d.sentenceDelays.length} sentences):`);
    console.log(`  Per-sentence delays: ${d.sentenceDelays.map(x => x.toFixed(2)).join(', ')}`);
    for (const agg of aggregators) {
      const val = agg.compute(d.sentenceDelays);
      console.log(`  ${agg.name.padEnd(28)} = ${val.toFixed(3)}`);
    }
    console.log('');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
