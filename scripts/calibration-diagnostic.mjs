import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mod = await import('../src/god-agent/cli/style/lanham-prose-analyzer.ts');
const { LanhamProseAnalyzer } = mod;

const goldPath = resolve(__dirname, '../tests/calibration/lanham-gold-set.jsonl');
const raw = readFileSync(goldPath, 'utf-8');
const entries = raw.split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

const analyzer = new LanhamProseAnalyzer('general');

const NV_ORD = { 'predominantly noun-style': 0, 'balanced': 1, 'predominantly verb-style': 2 };
const VO_ORD = { 'unvoiced': 0, 'moderate voice': 1, 'strongly voiced': 2 };
const RE_ORD = { 'low': 0, 'middle': 1, 'mixed': 1, 'high': 2 };
const OP_ORD = { 'transparent': 0, 'mixed opacity': 1, 'opaque': 2 };

const rows = [];
for (const entry of entries) {
  const m = await analyzer.fullAnalysis(entry.text);
  rows.push({ id: entry.id, m, g: entry.labels });
}

// Print per-axis sorted diagnostics
const PH_ORD = { 'predominantly paratactic': 0, 'mixed': 1, 'predominantly hypotactic': 2 };
const PR_ORD = { 'predominantly periodic': 0, 'mixed': 1, 'predominantly running': 2 };

for (const [axis, ord, scoreFn] of [
  ['nounVerb', NV_ORD, m => m.nounVerbRatio],
  ['voice', VO_ORD, m => m.voiceScore],
  ['register', RE_ORD, m => m.registerMarkednessScore],
  ['opacity', OP_ORD, m => m.opacityScore],
  ['parataxis', PH_ORD, m => m.parataxisHypotaxisRatio],
  ['periodicRunning', PR_ORD, m => m.periodicRunningRatio],
]) {
  console.log(`\n=== ${axis} (sorted by analyzer score) ===`);
  const sorted = [...rows].sort((a, b) => scoreFn(a.m) - scoreFn(b.m));
  for (const r of sorted) {
    const score = scoreFn(r.m);
    const goldKey = axis === 'register' ? 'primaryRegister' : axis === 'parataxis' ? 'parataxisHypotaxis' : axis;
    const goldVal = ord[r.g[goldKey]] ?? '?';
    const match = (goldVal === 0 && score < 0.4) || (goldVal === 1 && score >= 0.35 && score <= 0.65) || (goldVal === 2 && score > 0.6) ? ' ' : 'X';
    console.log(`  ${score.toFixed(3)}  gold=${goldVal}  ${match}  ${r.id}`);
  }
}
