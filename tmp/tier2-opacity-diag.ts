import { readFileSync } from 'fs';
import { AdvancedLanhamAnalyzer } from '../src/god-agent/cli/style/advanced-lanham-analyzer.js';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';

const gold = readFileSync('tests/calibration/lanham-gold-set.jsonl', 'utf-8')
  .trim().split('\n').map(l => JSON.parse(l));

const t1 = new LanhamProseAnalyzer('academic');
const t2 = new AdvancedLanhamAnalyzer('academic');

console.log('=== Opacity Score Comparison ===\n');
console.log(
  'ID'.padEnd(16),
  'Gold'.padEnd(15),
  'T1_score'.padEnd(10), 'T1_label'.padEnd(15),
  'T2_score'.padEnd(10), 'T2_label'.padEnd(15),
  'Better',
);
console.log('-'.repeat(95));

// label ordinal for correlation
const ord: Record<string, number> = { 'transparent': 0, 'mixed opacity': 1, 'opaque': 2 };

for (const e of gold) {
  const m1 = await t1.fullAnalysis(e.text);
  const m2 = await t2.fullAnalysis(e.text);

  const goldOrd = ord[e.labels.opacity] ?? 1;
  const t1Match = e.labels.opacity === m1.labels.opacity;
  const t2Match = e.labels.opacity === m2.labels.opacity;

  // Which is closer to correct ordering?
  const t1Dist = Math.abs(m1.opacityScore - (goldOrd / 2)); // normalized gold to [0,1]
  const t2Dist = Math.abs(m2.opacityScore - (goldOrd / 2));
  const better = t1Match && !t2Match ? 'T1' : !t1Match && t2Match ? 'T2' : t1Match && t2Match ? 'both' : 'neither';

  console.log(
    e.id.padEnd(16),
    e.labels.opacity.padEnd(15),
    m1.opacityScore.toFixed(3).padEnd(10), m1.labels.opacity.padEnd(15),
    m2.opacityScore.toFixed(3).padEnd(10), m2.labels.opacity.padEnd(15),
    better,
  );
}
