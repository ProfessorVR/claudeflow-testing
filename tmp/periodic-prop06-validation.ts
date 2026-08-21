/**
 * Validate "proportion delay > 0.6" aggregator against genre gates + full axis check.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { LanhamClauseParser } from '../src/god-agent/cli/style/lanham-clause-parser.js';
import { createEnPosBackend, clamp, splitSentences, suspensionMarkerDensity } from '../src/god-agent/cli/style/lanham-shared.js';
import { computePeriodicSignals } from '../src/god-agent/cli/style/lanham-clause-features.js';

interface GoldEntry { id: string; genre: string; text: string; labels: Record<string, string>; }
const ORD: Record<string, number> = { 'predominantly periodic': 0, 'mixed': 1, 'predominantly running': 2 };
const GENRE_MAP: Record<string, string> = {
  'academic-humanities': 'Academic', 'academic-social-science': 'Academic', 'academic-sciences': 'Academic',
  'legal': 'Legal', 'political': 'Political', 'literary-fiction': 'Literary Fiction',
  'narrative-nonfiction': 'Narrative Nonfiction', 'literary-criticism': 'Literary Criticism',
  'journalism': 'Journalism', 'polemical': 'Polemical', 'religious': 'Religious',
  'textbook': 'Textbook', 'military': 'Military', 'personal-correspondence': 'Personal Correspondence',
};

function spearmanRho(x: number[], y: number[]): number {
  if (x.length !== y.length || x.length < 2) return 0;
  const n = x.length;
  function rank(arr: number[]): number[] {
    const sorted = arr.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
    const ranks = new Array(n);
    let i = 0;
    while (i < n) { let j = i; while (j < n - 1 && sorted[j + 1].v === sorted[j].v) j++; const avg = (i + j) / 2 + 1; for (let k = i; k <= j; k++) ranks[sorted[k].i] = avg; i = j + 1; }
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

  const data = gold.map(entry => {
    const clauseDoc = parser.parseDocument(entry.text);
    const delays: number[] = [];
    for (const sent of clauseDoc.sentences) delays.push(computePeriodicSignals(sent).leftBranchIndex);

    const sentences = splitSentences(entry.text);
    const suspRunning = 1 - clamp(suspensionMarkerDensity(sentences) / 0.3);
    const avgSentLen = sentences.reduce((s, sent) => s + sent.split(/\s+/).length, 0) / (sentences.length || 1);
    const shortSentSignal = clamp((15 - avgSentLen) / 10);

    const propAbove06 = delays.length > 0 ? delays.filter(d => d > 0.6).length / delays.length : 0;
    const propRunning = 1 - propAbove06;

    const ensembleScore = clamp(propRunning * 0.45 + suspRunning * 0.30 + shortSentSignal * 0.25);

    return { entry, goldOrd: ORD[entry.labels.periodicRunning] ?? 1, ensembleScore, genre: GENRE_MAP[entry.genre] || entry.genre };
  });

  const goldOrds = data.map(d => d.goldOrd);
  const scores = data.map(d => d.ensembleScore);
  const overallMono = spearmanRho(goldOrds, scores);

  console.log('=== PROPORTION > 0.6 ENSEMBLE VALIDATION ===\n');
  console.log(`Overall mono: ${overallMono.toFixed(3)} (current: 0.512, baseline: 0.479)`);
  console.log(`Δ from current: ${(overallMono - 0.512 >= 0 ? '+' : '') + (overallMono - 0.512).toFixed(3)}`);
  console.log('');

  // Genre-stratified check (n >= 3)
  const genreGroups = new Map<string, typeof data>();
  for (const d of data) {
    if (!genreGroups.has(d.genre)) genreGroups.set(d.genre, []);
    genreGroups.get(d.genre)!.push(d);
  }

  console.log('Genre-stratified (n >= 3):');
  let anyGenreDegraded = false;
  for (const [genre, entries] of genreGroups) {
    if (entries.length < 3) continue;
    const gOrds = entries.map(e => e.goldOrd);
    const gScores = entries.map(e => e.ensembleScore);
    const gMono = spearmanRho(gOrds, gScores);
    console.log(`  ${genre.padEnd(25)} n=${entries.length} mono=${gMono.toFixed(3)}`);
    // We don't have per-genre baselines for the new aggregator, so just report
  }

  console.log('');
  console.log(`Recalibration gate: no regression >0.02 from current 0.512`);
  console.log(`Result: ${overallMono >= 0.512 - 0.02 ? 'PASS' : 'FAIL'} (${overallMono.toFixed(3)} vs threshold ${(0.512 - 0.02).toFixed(3)})`);
  console.log(`Improvement: ${overallMono > 0.512 + 0.02 ? 'EXCEEDS +0.02 gate' : 'within noise'}`);
}

main().catch(e => { console.error(e); process.exit(1); });
