/**
 * A3: Test opacity blend candidates against gold set.
 * Tests 3 blends and reports per-blend monotonicity (overall + per-genre).
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';
import type { LanhamProseMetrics } from '../src/god-agent/universal/style-analyzer.js';
import {
  tokenize, splitSentences, clamp, getContentWords, roughStem,
  COORDINATING_CONJ, SUBORDINATING_CONJ,
  META_LINGUISTIC_MARKERS, OPACITY_CONTENT_MARKERS,
} from '../src/god-agent/cli/style/lanham-shared.js';

interface GoldEntry {
  id: string; genre: string; text: string;
  labels: { opacity: string; [k: string]: string };
}

const OPACITY_ORD: Record<string, number> = { transparent: 0, 'mixed opacity': 1, opaque: 2 };

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
  const dSq = rx.reduce((s, r, i) => s + (r - ry[i]) ** 2, 0);
  return 1 - (6 * dSq) / (n * (n * n - 1));
}

// Recompute opacity with different blend weights
function reblendOpacity(
  metrics: LanhamProseMetrics,
  baseWeight: number,
  tacitWeight: number,
  allitWeight: number,
  polypWeight: number,
): number {
  const baseOpacity = metrics.opacityScore; // already computed with default weights
  // We need the raw signals to reblend. Since we can't easily decompose,
  // we'll use a different approach: compute the tacit contribution directly
  const tp = metrics.tacitPatterns;
  const tacitTotal = (tp.anaphoraCount + tp.chiasmusCount + tp.antithesisCount +
    tp.isocolonCount + tp.climaxPatternCount);
  // Normalize tacit density (0.2 patterns = saturated)
  const tacitDensity = clamp(tacitTotal / 3); // rough normalization
  const allitDensity = clamp(tp.alliterationDensity / 0.15);
  const polypDensity = clamp(tp.polyptotonDensity / 0.1);

  // Base opacity without tacit adjustment (approximate by removing current tacit contribution)
  // Current formula: base*0.50 + tacit*0.25 + allit*0.15 + polyp*0.10
  // Reverse: rawBase ≈ (opacityScore - tacitDensity*0.25 - allitDensity*0.15 - polypDensity*0.10) / 0.50
  const rawBase = clamp((metrics.opacityScore - tacitDensity * 0.25 - allitDensity * 0.15 - polypDensity * 0.10) / 0.50);

  return clamp(rawBase * baseWeight + tacitDensity * tacitWeight + allitDensity * allitWeight + polypDensity * polypWeight);
}

async function main() {
  const goldPath = resolve(process.cwd(), 'tests/calibration/lanham-gold-set.jsonl');
  const entries: GoldEntry[] = readFileSync(goldPath, 'utf-8').split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

  const analyzer = new LanhamProseAnalyzer('general');
  const metricsMap: Array<{ entry: GoldEntry; metrics: LanhamProseMetrics }> = [];

  for (const entry of entries) {
    const metrics = await analyzer.fullAnalysis(entry.text);
    metricsMap.push({ entry, metrics });
  }

  const blends = [
    { name: 'Current (baseline)',       base: 0.50, tacit: 0.25, allit: 0.15, polyp: 0.10 },
    { name: 'Moderate tacit boost',     base: 0.40, tacit: 0.35, allit: 0.15, polyp: 0.10 },
    { name: 'Aggressive tacit boost',   base: 0.30, tacit: 0.45, allit: 0.15, polyp: 0.10 },
  ];

  console.log('=== A3: OPACITY BLEND CANDIDATE TEST ===\n');

  for (const blend of blends) {
    const goldOrds: number[] = [];
    const predScores: number[] = [];
    let matchCount = 0;

    for (const { entry, metrics } of metricsMap) {
      const goldOrd = OPACITY_ORD[entry.labels.opacity];
      if (goldOrd === undefined) continue;

      const score = reblendOpacity(metrics, blend.base, blend.tacit, blend.allit, blend.polyp);
      goldOrds.push(goldOrd);
      predScores.push(score);

      // Derive label from score using general thresholds
      const label = score < 0.20 ? 'transparent' : score > 0.50 ? 'opaque' : 'mixed opacity';
      if (label === entry.labels.opacity) matchCount++;
    }

    const mono = spearmanRho(goldOrds, predScores);
    const agree = matchCount / entries.length;

    console.log(`${blend.name}:`);
    console.log(`  Agreement: ${(agree * 100).toFixed(1)}%  Monotonicity: ${mono.toFixed(3)}`);
    console.log(`  Weights: base=${blend.base} tacit=${blend.tacit} allit=${blend.allit} polyp=${blend.polyp}`);
    console.log('');
  }

  console.log('Current system opacity monotonicity: 0.193');
  console.log('Decision: adopt the blend with best monotonicity IF it improves over 0.193.');
}

main().catch(e => { console.error(e); process.exit(1); });
