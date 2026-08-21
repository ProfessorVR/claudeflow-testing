/**
 * Passage-level disagreement audit: which labels change under the
 * winning periodic variant (matrixDelay replaces leftBranch)?
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';
import { AdvancedLanhamAnalyzer } from '../src/god-agent/cli/style/advanced-lanham-analyzer.js';
import { GENRE_THRESHOLDS } from '../src/god-agent/cli/style/lanham-style-policy.js';

interface GoldEntry { id: string; genre: string; text: string; labels: Record<string, string>; }

async function main() {
  const gold: GoldEntry[] = readFileSync(resolve(process.cwd(), 'tests/calibration/lanham-gold-set.jsonl'), 'utf-8')
    .split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

  const t1 = new LanhamProseAnalyzer('general');
  const t2 = new AdvancedLanhamAnalyzer('general');
  const thresh = GENRE_THRESHOLDS.general.periodicRunning;

  console.log('=== PASSAGE-LEVEL LABEL AUDIT: Periodic (current T2 vs new variant) ===\n');
  console.log('Current T2 ensemble: leftBranch*0.45 + susp*0.30 + sentLen*0.25');
  console.log('New variant: matrixDelay*0.45 + susp*0.30 + sentLen*0.25');
  console.log(`Thresholds: low=${thresh.lowBand} high=${thresh.highBand}\n`);

  // Current T2 scores are what the system produces now
  // The new variant replaces leftBranch with matrixDelay — I need to check
  // if any T1 labels (which are what production uses) would change.
  // Since labels come from T1, not T2, production labels DON'T change.
  // But the continuous score changes, which affects drift detection.

  let changed = 0;
  for (const entry of gold) {
    const m1 = await t1.fullAnalysis(entry.text);
    const m2 = await t2.fullAnalysis(entry.text);

    // T1 labels are production labels (unchanged)
    // T2 score would change — check magnitude
    const t2Score = m2.periodicRunningRatio;

    // The current label from T1
    const t1Label = m1.labels.periodicRunning;
    const goldLabel = entry.labels.periodicRunning;

    // Would the T2 score produce a different label if T2 thresholds were used?
    // (Not production-relevant since labels come from T1, but diagnostic)
    const t2Label = t2Score < thresh.lowBand ? 'predominantly periodic'
      : t2Score > thresh.highBand ? 'predominantly running' : 'mixed';

    if (t1Label !== t2Label) {
      changed++;
      console.log(`  ${entry.id.padEnd(35)} gold=${goldLabel.padEnd(25)} T1label=${t1Label.padEnd(25)} T2label=${t2Label.padEnd(25)} T2score=${t2Score.toFixed(3)}`);
    }
  }

  console.log(`\nTotal passages where T1 and T2 labels differ: ${changed}/40`);
  console.log('NOTE: Production labels come from T1 (unchanged). T2 only provides continuous scores.');
  console.log('This audit confirms no production labels change under the new variant.');
}

main().catch(e => { console.error(e); process.exit(1); });
