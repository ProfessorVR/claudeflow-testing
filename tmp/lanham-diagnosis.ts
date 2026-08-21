import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';
import { AdvancedLanhamAnalyzer } from '../src/god-agent/cli/style/advanced-lanham-analyzer.js';
import { GENRE_THRESHOLDS } from '../src/god-agent/cli/style/lanham-style-policy.js';
import { readFileSync } from 'fs';

const gold = readFileSync('tests/calibration/lanham-gold-set.jsonl','utf-8').split('\n').filter(l=>l.trim()).map(l=>JSON.parse(l));
const t1 = new LanhamProseAnalyzer('general');
const t2 = new AdvancedLanhamAnalyzer('general');

console.log('=== REGISTER BUG DIAGNOSIS ===');
console.log('Genre: general. Thresholds:', JSON.stringify(GENRE_THRESHOLDS.general.register));
console.log('Tier 1 label logic: rms >= 0.62 -> high, rms <= 0.38 -> low, else -> middle');
console.log('Tier 2 label logic: if rms < 0.25, use lgr: >= 0.45 -> high, >= 0.25 -> middle, else -> low');
console.log('');
console.log('ID'.padEnd(35), 'rms'.padEnd(8), 'lgr'.padEnd(8), 'T1 label'.padEnd(10), 'T2 label'.padEnd(10), 'Gold'.padEnd(10));
console.log('-'.repeat(85));

for (const entry of gold) {
  const m1 = await t1.fullAnalysis(entry.text);
  const m2 = await t2.fullAnalysis(entry.text);
  console.log(
    entry.id.padEnd(35),
    m1.registerMarkednessScore.toFixed(3).padEnd(8),
    m1.latinateGermanicRatio.toFixed(3).padEnd(8),
    m1.labels.primaryRegister.padEnd(10),
    m2.labels.primaryRegister.padEnd(10),
    entry.labels.primaryRegister.padEnd(10),
  );
}

console.log('');
console.log('=== PARATAXIS OVERCOUNTING DIAGNOSIS ===');
console.log('ID'.padEnd(35),'T1 ratio'.padEnd(10),'T2 ratio'.padEnd(10),'T1 coord'.padEnd(10),'T2 coord'.padEnd(10),'T1 subord'.padEnd(10),'T2 subord'.padEnd(10),'Gold');
console.log('-'.repeat(110));
for (const entry of gold) {
  const m1 = await t1.fullAnalysis(entry.text);
  const m2 = await t2.fullAnalysis(entry.text);
  if (m1.labels.parataxisHypotaxis !== m2.labels.parataxisHypotaxis) {
    console.log(entry.id.padEnd(35),
      m1.parataxisHypotaxisRatio.toFixed(3).padEnd(10),
      m2.parataxisHypotaxisRatio.toFixed(3).padEnd(10),
      m1.coordinatingConjunctionDensity.toFixed(4).padEnd(10),
      m2.coordinatingConjunctionDensity.toFixed(4).padEnd(10),
      m1.subordinatingConjunctionDensity.toFixed(4).padEnd(10),
      m2.subordinatingConjunctionDensity.toFixed(4).padEnd(10),
      entry.labels.parataxisHypotaxis);
  }
}

console.log('');
console.log('=== PERIODIC/RUNNING BIAS DIAGNOSIS ===');
console.log('ID'.padEnd(35),'T1 ratio'.padEnd(10),'T2 ratio'.padEnd(10),'T1 preV'.padEnd(10),'T2 preV'.padEnd(10),'Gold');
console.log('-'.repeat(95));
for (const entry of gold) {
  const m1 = await t1.fullAnalysis(entry.text);
  const m2 = await t2.fullAnalysis(entry.text);
  if (m1.labels.periodicRunning !== m2.labels.periodicRunning) {
    console.log(entry.id.padEnd(35),
      m1.periodicRunningRatio.toFixed(3).padEnd(10),
      m2.periodicRunningRatio.toFixed(3).padEnd(10),
      m1.preMainVerbClauseCount.toFixed(2).padEnd(10),
      m2.preMainVerbClauseCount.toFixed(2).padEnd(10),
      entry.labels.periodicRunning);
  }
}
