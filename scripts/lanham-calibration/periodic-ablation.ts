/**
 * Periodic ablation experiments: test clause-derived signals against
 * the existing 3-signal ensemble on the 40-passage gold set.
 *
 * Exposes all 5 periodic signals, normalizes, correlates, and runs
 * leave-one-in, leave-one-out, and combination experiments.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { LanhamProseAnalyzer } from '../../src/god-agent/cli/style/lanham-prose-analyzer.js';
import { LanhamClauseParser } from '../../src/god-agent/cli/style/lanham-clause-parser.js';
import { createEnPosBackend, splitSentences, clamp, suspensionMarkerDensity, tagPOS, isFiniteVerbTag, isThatSubordinator } from '../../src/god-agent/cli/style/lanham-shared.js';
import { extractClauseFeatures } from '../../src/god-agent/cli/style/lanham-clause-features.js';
import { SUBORDINATING_CONJ, COORDINATING_CONJ } from '../../src/god-agent/cli/style/lanham-shared.js';

interface GoldEntry { id: string; genre: string; text: string; labels: Record<string, string>; }
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

function minMaxNorm(vals: number[]): number[] {
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  return vals.map(v => (v - min) / range);
}

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b) / n;
  const my = y.reduce((a, b) => a + b) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    num += (x[i] - mx) * (y[i] - my);
    dx += (x[i] - mx) ** 2;
    dy += (y[i] - my) ** 2;
  }
  return dx && dy ? num / Math.sqrt(dx * dy) : 0;
}

// ── Extract periodic signals per passage ─────────────────────────────────────

interface PeriodicSignals {
  leftBranchRunning: number;
  suspRunning: number;
  shortSentSignal: number;
  clauseMatrixDelay: number;
  clausePreMainSubord: number;
}

function extractPeriodicSignals(text: string, parser: LanhamClauseParser): PeriodicSignals {
  const sentences = splitSentences(text);
  if (sentences.length === 0) return { leftBranchRunning: 0.5, suspRunning: 0.5, shortSentSignal: 0.5, clauseMatrixDelay: 0.5, clausePreMainSubord: 0.5 };

  // Left-branching index (same logic as Tier 2 periodic ensemble)
  let totalLeftBranch = 0;
  for (const sent of sentences) {
    const sentWords = sent.split(/\s+/).filter((w: string) => w.length > 0);
    if (sentWords.length < 3) { totalLeftBranch += 1; continue; }
    const sentPOS = tagPOS(sentWords);
    let mainVerbPos = sentWords.length;
    let inSubordinate = false;
    for (let i = 0; i < sentPOS.length; i++) {
      const w = sentPOS[i].word.toLowerCase().replace(/[^a-z']/g, '');
      const tag = sentPOS[i].tag;
      if (SUBORDINATING_CONJ.has(w) || (w === 'that' && isThatSubordinator(tag))) { inSubordinate = true; continue; }
      if (inSubordinate && (sentPOS[i].word.endsWith(',') || COORDINATING_CONJ.has(w))) { inSubordinate = false; continue; }
      if (i < 3 && (tag === 'VBG' || tag === 'VBN')) continue;
      if (!inSubordinate && isFiniteVerbTag(tag)) { mainVerbPos = i; break; }
    }
    totalLeftBranch += sentWords.length > 0 ? mainVerbPos / sentWords.length : 0.5;
  }
  const leftBranchRunning = 1 - (totalLeftBranch / sentences.length);

  // Suspension markers
  const suspMarkers = suspensionMarkerDensity(sentences);
  const suspRunning = 1 - clamp(suspMarkers / 0.3);

  // Short sentence signal
  const avgSentLen = sentences.reduce((s: number, sent: string) => s + sent.split(/\s+/).length, 0) / sentences.length;
  const shortSentSignal = clamp((15 - avgSentLen) / 10);

  // Clause-derived signals
  const clauseDoc = parser.parseDocument(text);
  const clauseFeatures = extractClauseFeatures(clauseDoc);
  const clauseMatrixDelay = clauseFeatures.hasClauseData ? (1 - clamp(clauseFeatures.matrixDelayMean)) : 0.5;
  const clausePreMainSubord = clauseFeatures.hasClauseData ? (1 - clamp(clauseFeatures.preMainSubordinateRate)) : 0.5;

  return { leftBranchRunning, suspRunning, shortSentSignal, clauseMatrixDelay, clausePreMainSubord };
}

async function main() {
  const gold: GoldEntry[] = readFileSync(resolve(process.cwd(), 'tests/calibration/lanham-gold-set.jsonl'), 'utf-8')
    .split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

  const backend = createEnPosBackend()!;
  const parser = new LanhamClauseParser({ backend });

  // Compute signals for all passages
  const data = gold.map(entry => ({
    entry,
    goldOrd: ORD[entry.labels.periodicRunning] ?? 1,
    signals: extractPeriodicSignals(entry.text, parser),
  }));

  const goldOrds = data.map(d => d.goldOrd);
  const names = ['leftBranchRunning', 'suspRunning', 'shortSentSignal', 'clauseMatrixDelay', 'clausePreMainSubord'] as const;
  const signalArrays: Record<string, number[]> = {};
  for (const n of names) signalArrays[n] = data.map(d => d.signals[n]);

  // ── Step 2: Pairwise correlations ──────────────────────────────────────────
  console.log('=== PAIRWISE CORRELATIONS ===\n');
  console.log(''.padEnd(22), ...names.map(n => n.slice(0, 10).padEnd(12)));
  for (const a of names) {
    const row = [a.padEnd(22)];
    for (const b of names) {
      const r = pearson(signalArrays[a], signalArrays[b]);
      row.push(r.toFixed(2).padEnd(12));
    }
    console.log(row.join(''));
  }

  // ── Step 3: Ablation experiments ───────────────────────────────────────────
  console.log('\n=== PERIODIC ABLATION EXPERIMENTS ===\n');

  // Also test normalized versions
  const normSignals: Record<string, number[]> = {};
  for (const n of names) normSignals[n] = minMaxNorm(signalArrays[n]);

  type Weights = Record<string, number>;
  const experiments: Array<{ name: string; weights: Weights }> = [
    { name: 'Baseline (0.45/0.30/0.25)', weights: { leftBranchRunning: 0.45, suspRunning: 0.30, shortSentSignal: 0.25 } },
    // Leave-one-in
    { name: 'A: matrixDelay solo', weights: { clauseMatrixDelay: 1.0 } },
    { name: 'B: preMainSubord solo', weights: { clausePreMainSubord: 1.0 } },
    // Leave-one-out
    { name: 'C: drop leftBranch + matrixDelay', weights: { clauseMatrixDelay: 0.45, suspRunning: 0.30, shortSentSignal: 0.25 } },
    { name: 'D: drop susp + matrixDelay', weights: { leftBranchRunning: 0.45, clauseMatrixDelay: 0.30, shortSentSignal: 0.25 } },
    { name: 'E: drop sentLen + preMainSubord', weights: { leftBranchRunning: 0.45, suspRunning: 0.30, clausePreMainSubord: 0.25 } },
    // Combinations
    { name: 'F: matrixDelay added (no preMain)', weights: { leftBranchRunning: 0.25, suspRunning: 0.25, clauseMatrixDelay: 0.35, shortSentSignal: 0.15 } },
    { name: 'G: matrixDelay replaces leftBranch', weights: { clauseMatrixDelay: 0.45, suspRunning: 0.30, shortSentSignal: 0.25 } },
    { name: 'H: both clause, low weight', weights: { leftBranchRunning: 0.30, suspRunning: 0.20, clauseMatrixDelay: 0.20, clausePreMainSubord: 0.10, shortSentSignal: 0.20 } },
  ];

  console.log('Experiment'.padEnd(40), 'Raw Mono'.padEnd(12), 'Norm Mono'.padEnd(12), 'Δ Raw'.padEnd(10), 'Δ Norm');
  console.log('-'.repeat(85));

  const baseline = 0.479;
  const results: Array<{ name: string; rawMono: number; normMono: number }> = [];

  for (const exp of experiments) {
    // Raw signals
    const rawScores = data.map((d, i) => {
      let score = 0;
      for (const [sig, w] of Object.entries(exp.weights)) {
        score += (signalArrays[sig]?.[i] ?? 0.5) * w;
      }
      return clamp(score);
    });
    const rawMono = spearmanRho(goldOrds, rawScores);

    // Normalized signals
    const normScores = data.map((d, i) => {
      let score = 0;
      for (const [sig, w] of Object.entries(exp.weights)) {
        score += (normSignals[sig]?.[i] ?? 0.5) * w;
      }
      return clamp(score);
    });
    const normMono = spearmanRho(goldOrds, normScores);

    results.push({ name: exp.name, rawMono, normMono });

    const dRaw = rawMono - baseline;
    const dNorm = normMono - baseline;
    console.log(
      exp.name.padEnd(40),
      rawMono.toFixed(3).padEnd(12),
      normMono.toFixed(3).padEnd(12),
      ((dRaw >= 0 ? '+' : '') + dRaw.toFixed(3)).padEnd(10),
      (dNorm >= 0 ? '+' : '') + dNorm.toFixed(3),
    );
  }

  // Best variant
  console.log('');
  const best = results.slice(1).sort((a, b) => Math.max(b.rawMono, b.normMono) - Math.max(a.rawMono, a.normMono))[0];
  if (best) {
    const bestMono = Math.max(best.rawMono, best.normMono);
    console.log(`Best: "${best.name}" at ${bestMono.toFixed(3)} (Δ ${(bestMono - baseline >= 0 ? '+' : '') + (bestMono - baseline).toFixed(3)} from baseline ${baseline})`);
    console.log(bestMono > baseline + 0.02 ? 'CANDIDATE FOR ADOPTION (exceeds +0.02 gate)' : 'BELOW ADOPTION THRESHOLD (+0.02)');
  }

  // ── Largest movers for best variant ────────────────────────────────────────
  if (best) {
    const bestExp = experiments.find(e => e.name === best.name)!;
    const baselineScores = data.map((d, i) => {
      return clamp(signalArrays.leftBranchRunning[i] * 0.45 + signalArrays.suspRunning[i] * 0.30 + signalArrays.shortSentSignal[i] * 0.25);
    });
    const bestScores = data.map((d, i) => {
      let s = 0;
      for (const [sig, w] of Object.entries(bestExp.weights)) s += (signalArrays[sig]?.[i] ?? 0.5) * w;
      return clamp(s);
    });

    const movers = data.map((d, i) => ({
      id: d.entry.id,
      gold: d.entry.labels.periodicRunning,
      baseScore: baselineScores[i],
      bestScore: bestScores[i],
      delta: Math.abs(bestScores[i] - baselineScores[i]),
    })).sort((a, b) => b.delta - a.delta).slice(0, 8);

    console.log('\n=== LARGEST MOVERS (best variant vs baseline) ===\n');
    for (const m of movers) {
      console.log(`  ${m.id.padEnd(35)} gold=${m.gold.padEnd(25)} base=${m.baseScore.toFixed(3)} best=${m.bestScore.toFixed(3)} Δ=${m.delta.toFixed(3)}`);
    }
  }
}

main().catch(e => { console.error(e); process.exit(1); });
