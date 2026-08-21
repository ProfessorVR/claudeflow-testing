/**
 * E5: Grid search for periodic ensemble weights.
 * Tests multiple weight distributions against gold set.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { AdvancedLanhamAnalyzer } from '../src/god-agent/cli/style/advanced-lanham-analyzer.js';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';

interface GoldEntry {
  id: string; genre: string; text: string;
  labels: { periodicRunning: string; [k: string]: string };
}

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
      const avgRank = (i + j) / 2 + 1;
      for (let k = i; k <= j; k++) ranks[sorted[k].i] = avgRank;
      i = j + 1;
    }
    return ranks;
  }
  const rx = rank(x); const ry = rank(y);
  return 1 - (6 * rx.reduce((s, r, i) => s + (r - ry[i]) ** 2, 0)) / (n * (n * n - 1));
}

async function main() {
  const entries: GoldEntry[] = readFileSync(resolve(process.cwd(), 'tests/calibration/lanham-gold-set.jsonl'), 'utf-8')
    .split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

  const t1 = new LanhamProseAnalyzer('general');
  const t2 = new AdvancedLanhamAnalyzer('general');

  // Run both tiers on all entries
  const results = await Promise.all(entries.map(async e => ({
    entry: e,
    t1: await t1.fullAnalysis(e.text),
    t2: await t2.fullAnalysis(e.text),
  })));

  // Compute Tier 1 baseline
  const goldOrds = results.map(r => ORD[r.entry.labels.periodicRunning]).filter(v => v !== undefined);
  const t1Scores = results.map(r => r.t1.periodicRunningRatio);
  const t2Scores = results.map(r => r.t2.periodicRunningRatio);

  const t1Mono = spearmanRho(goldOrds, t1Scores);
  const t2Mono = spearmanRho(goldOrds, t2Scores);

  let t1Match = 0, t2Match = 0;
  for (const r of results) {
    if (r.t1.labels.periodicRunning === r.entry.labels.periodicRunning) t1Match++;
    if (r.t2.labels.periodicRunning === r.entry.labels.periodicRunning) t2Match++;
  }

  console.log('=== E5: PERIODIC ENSEMBLE RESULTS ===');
  console.log(`Tier 1: agreement=${(t1Match/results.length*100).toFixed(1)}%  mono=${t1Mono.toFixed(3)}`);
  console.log(`Tier 2 (ensemble): agreement=${(t2Match/results.length*100).toFixed(1)}%  mono=${t2Mono.toFixed(3)}`);
  console.log('');

  // Show per-entry comparison where tiers disagree with gold
  console.log('T2 LABEL DETAILS:');
  for (const r of results) {
    const gold = r.entry.labels.periodicRunning;
    const t1l = r.t1.labels.periodicRunning;
    const t2l = r.t2.labels.periodicRunning;
    if (t1l !== gold || t2l !== gold) {
      const t1ok = t1l === gold ? 'OK' : 'WRONG';
      const t2ok = t2l === gold ? 'OK' : 'WRONG';
      console.log(`  ${r.entry.id.padEnd(35)} gold=${gold.padEnd(25)} T1=${t1l.padEnd(25)}[${t1ok}]  T2=${t2l.padEnd(25)}[${t2ok}]`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
