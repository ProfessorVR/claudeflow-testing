import { readFileSync } from 'fs';
import { AdvancedLanhamAnalyzer } from '../src/god-agent/cli/style/advanced-lanham-analyzer.js';
import type { LanhamProseMetrics } from '../src/god-agent/universal/style-analyzer.js';

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
}

const gold: GoldEntry[] = readFileSync('tests/calibration/lanham-gold-set.jsonl', 'utf-8')
  .trim().split('\n').map(l => JSON.parse(l));

const analyzer = new AdvancedLanhamAnalyzer('academic');

// Axis configs matching calibration test
const axes = [
  { name: 'nounVerb', field: 'nounVerbRatio', labelField: 'nounVerb', tier: 'HARD', target: 0.85 },
  { name: 'register', field: 'latinateGermanicRatio', labelField: 'primaryRegister', tier: 'HARD', target: 0.85 },
  { name: 'voice', field: 'voiceScore', labelField: 'voice', tier: 'FIRM', target: 0.75 },
  { name: 'parataxisHypotaxis', field: 'parataxisHypotaxisRatio', labelField: 'parataxisHypotaxis', tier: 'SOFT', target: 0.70 },
  { name: 'opacity', field: 'opacityScore', labelField: 'opacity', tier: 'SOFT', target: 0.70 },
  { name: 'periodicRunning', field: 'periodicRunningRatio', labelField: 'periodicRunning', tier: 'INFO', target: 0.65 },
];

// Spearman rank correlation
function spearmanRank(values: number[]): number[] {
  const indexed = values.map((v, i) => ({ v, i }));
  indexed.sort((a, b) => a.v - b.v);
  const ranks = new Array(values.length);
  for (let i = 0; i < indexed.length; i++) {
    ranks[indexed[i].i] = i + 1;
  }
  return ranks;
}

function spearmanCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  const rx = spearmanRank(x);
  const ry = spearmanRank(y);
  let d2sum = 0;
  for (let i = 0; i < n; i++) {
    d2sum += (rx[i] - ry[i]) ** 2;
  }
  return 1 - (6 * d2sum) / (n * (n * n - 1));
}

// Label to ordinal mapping for monotonicity
const labelOrdinals: Record<string, Record<string, number>> = {
  nounVerb: { 'predominantly noun-style': 0, 'balanced': 1, 'predominantly verb-style': 2 },
  parataxisHypotaxis: { 'predominantly paratactic': 0, 'mixed': 1, 'predominantly hypotactic': 2 },
  periodicRunning: { 'predominantly periodic': 0, 'mixed': 1, 'predominantly running': 2 },
  voice: { 'unvoiced': 0, 'moderate voice': 1, 'strongly voiced': 2 },
  primaryRegister: { 'low': 0, 'middle': 1, 'high': 2, 'mixed': 1.5 },
  opacity: { 'transparent': 0, 'mixed opacity': 1, 'opaque': 2 },
};

async function main() {
  console.log('=== Tier 2 (AdvancedLanhamAnalyzer) Calibration ===\n');

  const results: Array<{ entry: GoldEntry; metrics: LanhamProseMetrics }> = [];
  const startTime = Date.now();

  for (const entry of gold) {
    const metrics = await analyzer.fullAnalysis(entry.text);
    results.push({ entry, metrics });
  }

  const elapsed = Date.now() - startTime;
  console.log(`Analysis complete: ${gold.length} passages in ${elapsed}ms (${(elapsed / gold.length).toFixed(1)}ms/passage)\n`);

  // Per-axis accuracy + monotonicity
  console.log('Axis'.padEnd(22), 'Tier'.padEnd(6), 'Accuracy'.padEnd(10), 'Monotonicity'.padEnd(14), 'Target'.padEnd(8), 'Status');
  console.log('-'.repeat(75));

  for (const axis of axes) {
    let hits = 0;
    const goldOrdinals: number[] = [];
    const genScores: number[] = [];

    for (const { entry, metrics } of results) {
      const goldLabel = (entry.labels as Record<string, string>)[axis.labelField];
      const genLabel = (metrics.labels as Record<string, string>)[axis.labelField];
      if (goldLabel === genLabel) hits++;

      const ordMap = labelOrdinals[axis.labelField] || labelOrdinals[axis.name];
      goldOrdinals.push(ordMap[goldLabel] ?? 1);
      genScores.push((metrics as Record<string, any>)[axis.field] ?? 0);
    }

    const accuracy = hits / gold.length;
    const mono = spearmanCorrelation(goldOrdinals, genScores);
    const pass = mono >= axis.target;

    console.log(
      axis.name.padEnd(22),
      axis.tier.padEnd(6),
      `${hits}/${gold.length} (${(accuracy * 100).toFixed(0)}%)`.padEnd(10),
      mono.toFixed(3).padEnd(14),
      axis.target.toFixed(2).padEnd(8),
      pass ? 'PASS' : 'FAIL',
    );
  }

  // Per-passage detail for misses
  console.log('\n=== Label Mismatches ===\n');
  for (const { entry, metrics } of results) {
    const misses: string[] = [];
    for (const axis of axes) {
      const goldLabel = (entry.labels as Record<string, string>)[axis.labelField];
      const genLabel = (metrics.labels as Record<string, string>)[axis.labelField];
      if (goldLabel !== genLabel) {
        misses.push(`${axis.name}: gold=${goldLabel} got=${genLabel}`);
      }
    }
    if (misses.length > 0) {
      console.log(`${entry.id}: ${misses.join(', ')}`);
    }
  }
}

main().catch(console.error);
