/**
 * Parataxis hybrid experiments: Tier 1 base + clause-derived supplements.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { LanhamProseAnalyzer } from '../../src/god-agent/cli/style/lanham-prose-analyzer.js';
import { LanhamClauseParser } from '../../src/god-agent/cli/style/lanham-clause-parser.js';
import { createEnPosBackend, clamp } from '../../src/god-agent/cli/style/lanham-shared.js';
import { extractClauseFeatures } from '../../src/god-agent/cli/style/lanham-clause-features.js';

interface GoldEntry { id: string; genre: string; text: string; labels: Record<string, string>; }
const ORD: Record<string, number> = { 'predominantly paratactic': 0, 'mixed': 1, 'predominantly hypotactic': 2 };

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

  const analyzer = new LanhamProseAnalyzer('general');
  const backend = createEnPosBackend()!;
  const parser = new LanhamClauseParser({ backend });

  // Compute T1 parataxis + clause features for all passages
  const data = await Promise.all(gold.map(async entry => {
    const t1 = await analyzer.fullAnalysis(entry.text);
    const clauseDoc = parser.parseDocument(entry.text);
    const cf = extractClauseFeatures(clauseDoc);
    return {
      entry,
      goldOrd: ORD[entry.labels.parataxisHypotaxis] ?? 1,
      t1Parataxis: t1.parataxisHypotaxisRatio,
      clauseDepth: clamp(cf.subordinationDepthMean / 2),
      maxDepth: cf.maxSubordinationDepth,
      coordGroupDensity: cf.coordinateClauseRate,
      subordinateRate: cf.subordinateClauseRate,
    };
  }));

  const goldOrds = data.map(d => d.goldOrd);
  const baseline = spearmanRho(goldOrds, data.map(d => d.t1Parataxis));

  console.log('=== PARATAXIS HYBRID EXPERIMENTS ===\n');
  console.log(`Tier 1 baseline: ${baseline.toFixed(3)} mono\n`);

  // Experiments
  type Experiment = { name: string; compute: (d: typeof data[0]) => number };
  const experiments: Experiment[] = [
    { name: 'Baseline (Tier 1 only)', compute: d => d.t1Parataxis },
    // Additive
    { name: 'F: T1*0.80 + depthPenalty*0.20', compute: d => clamp(d.t1Parataxis * 0.80 + d.clauseDepth * 0.20) },
    { name: 'G: T1*0.80 + condCoord*0.20', compute: d => {
      const condCoord = d.maxDepth <= 1 ? clamp(d.coordGroupDensity / 0.5) : clamp(d.coordGroupDensity / 0.5) * 0.3;
      return clamp(d.t1Parataxis * 0.80 + (1 - condCoord) * 0.20); // invert: high coord = low (paratactic)
    }},
    { name: 'H: T1*0.70 + depth*0.15 + condCoord*0.15', compute: d => {
      const condCoord = d.maxDepth <= 1 ? clamp(d.coordGroupDensity / 0.5) : clamp(d.coordGroupDensity / 0.5) * 0.3;
      return clamp(d.t1Parataxis * 0.70 + d.clauseDepth * 0.15 + (1 - condCoord) * 0.15);
    }},
    // Corrective
    { name: 'I: T1 + (depth-0.5)*0.30', compute: d => clamp(d.t1Parataxis + (d.clauseDepth - 0.5) * 0.30) },
    { name: 'J: T1 + (depth-0.5)*0.20 + (condCoord-0.5)*0.15', compute: d => {
      const condCoord = d.maxDepth <= 1 ? clamp(d.coordGroupDensity / 0.5) : clamp(d.coordGroupDensity / 0.5) * 0.3;
      return clamp(d.t1Parataxis + (d.clauseDepth - 0.5) * 0.20 + ((1 - condCoord) - 0.5) * 0.15);
    }},
    // Depth penalty only (simple)
    { name: 'K: T1*0.85 + depth*0.15', compute: d => clamp(d.t1Parataxis * 0.85 + d.clauseDepth * 0.15) },
    // Corrective depth only, stronger
    { name: 'L: T1 + (depth-0.5)*0.40', compute: d => clamp(d.t1Parataxis + (d.clauseDepth - 0.5) * 0.40) },
  ];

  console.log('Experiment'.padEnd(48), 'Mono'.padEnd(10), 'Δ');
  console.log('-'.repeat(70));

  for (const exp of experiments) {
    const scores = data.map(d => exp.compute(d));
    const mono = spearmanRho(goldOrds, scores);
    const delta = mono - baseline;
    console.log(exp.name.padEnd(48), mono.toFixed(3).padEnd(10), (delta >= 0 ? '+' : '') + delta.toFixed(3));
  }

  console.log('\nPromotion gate: need ≥0.428 (+0.05 over baseline 0.378)');
}

main().catch(e => { console.error(e); process.exit(1); });
