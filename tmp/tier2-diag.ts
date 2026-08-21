import { readFileSync } from 'fs';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';
import { AdvancedLanhamAnalyzer } from '../src/god-agent/cli/style/advanced-lanham-analyzer.js';

const gold = readFileSync('tests/calibration/lanham-gold-set.jsonl', 'utf-8')
  .trim().split('\n').map(l => JSON.parse(l));

const t1 = new LanhamProseAnalyzer('academic');
const t2 = new AdvancedLanhamAnalyzer('academic');

console.log('=== Raw Score Comparison: Tier 1 vs Tier 2 ===\n');
console.log('Focus: register + voice (should be IDENTICAL since Tier 2 delegates)\n');

console.log(
  'ID'.padEnd(16),
  'T1_lgr'.padEnd(8), 'T2_lgr'.padEnd(8), 'lgr_diff'.padEnd(9),
  'T1_rms'.padEnd(8), 'T2_rms'.padEnd(8), 'rms_diff'.padEnd(9),
  'T1_reg'.padEnd(8), 'T2_reg'.padEnd(8), 'reg_match'.padEnd(10),
  'T1_vs'.padEnd(8), 'T2_vs'.padEnd(8), 'T1_voice'.padEnd(18), 'T2_voice'.padEnd(18),
);
console.log('-'.repeat(150));

for (const entry of gold) {
  const m1 = await t1.fullAnalysis(entry.text);
  const m2 = await t2.fullAnalysis(entry.text);

  const lgrDiff = Math.abs(m1.latinateGermanicRatio - m2.latinateGermanicRatio);
  const rmsDiff = Math.abs(m1.registerMarkednessScore - m2.registerMarkednessScore);
  const regMatch = m1.labels.primaryRegister === m2.labels.primaryRegister;
  const voiceMatch = m1.labels.voice === m2.labels.voice;

  console.log(
    entry.id.padEnd(16),
    m1.latinateGermanicRatio.toFixed(3).padEnd(8),
    m2.latinateGermanicRatio.toFixed(3).padEnd(8),
    (lgrDiff > 0.001 ? `**${lgrDiff.toFixed(3)}**` : lgrDiff.toFixed(3)).padEnd(9),
    m1.registerMarkednessScore.toFixed(3).padEnd(8),
    m2.registerMarkednessScore.toFixed(3).padEnd(8),
    (rmsDiff > 0.001 ? `**${rmsDiff.toFixed(3)}**` : rmsDiff.toFixed(3)).padEnd(9),
    m1.labels.primaryRegister.padEnd(8),
    m2.labels.primaryRegister.padEnd(8),
    (regMatch ? 'OK' : 'MISMATCH').padEnd(10),
    m1.voiceScore.toFixed(3).padEnd(8),
    m2.voiceScore.toFixed(3).padEnd(8),
    m1.labels.voice.padEnd(18),
    m2.labels.voice.padEnd(18),
  );
}
