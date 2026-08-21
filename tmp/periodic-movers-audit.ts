/**
 * Passage-level audit: inspect the largest periodic movers under the
 * matrixDelay-replaces-leftBranch ensemble variant.
 */
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';
import { AdvancedLanhamAnalyzer } from '../src/god-agent/cli/style/advanced-lanham-analyzer.js';
import { LanhamClauseParser } from '../src/god-agent/cli/style/lanham-clause-parser.js';
import { createEnPosBackend } from '../src/god-agent/cli/style/lanham-shared.js';
import { extractClauseFeatures, computePeriodicSignals } from '../src/god-agent/cli/style/lanham-clause-features.js';

interface GoldEntry { id: string; genre: string; text: string; labels: Record<string, string>; }

async function main() {
  const gold: GoldEntry[] = readFileSync(resolve(process.cwd(), 'tests/calibration/lanham-gold-set.jsonl'), 'utf-8')
    .split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

  const t2 = new AdvancedLanhamAnalyzer('general');
  const backend = createEnPosBackend()!;
  const parser = new LanhamClauseParser({ backend });

  const results = await Promise.all(gold.map(async entry => {
    const m2 = await t2.fullAnalysis(entry.text);
    const clauseDoc = parser.parseDocument(entry.text);
    const features = extractClauseFeatures(clauseDoc);

    return {
      id: entry.id,
      gold: entry.labels.periodicRunning,
      t2Score: m2.periodicRunningRatio,
      matrixDelay: features.matrixDelayMean,
      preMainSubord: features.preMainSubordinateRate,
      maxDepth: features.maxSubordinationDepth,
      finiteCount: features.finiteClauseCount,
      sentCount: clauseDoc.sentences.length,
      diagnostics: clauseDoc.sentences.flatMap(s => s.diagnostics),
      matrixIds: clauseDoc.sentences.map(s => s.matrixClauseId).filter(Boolean),
    };
  }));

  // Sort by how different the clause-derived view is from the gold label
  const ORD: Record<string, number> = { 'predominantly periodic': 0, 'mixed': 1, 'predominantly running': 2 };

  console.log('=== PERIODIC LARGEST MOVERS AUDIT ===\n');
  console.log('Inspecting top 8 passages where clause-parser matrixDelay differs most from gold expectation.\n');

  // Sort by |matrixDelay - expected| where expected is derived from gold label
  const scored = results.map(r => {
    const goldOrd = ORD[r.gold] ?? 1;
    // Expected matrixDelay: periodic → high delay (close to 1), running → low delay (close to 0)
    const expectedDelay = goldOrd === 0 ? 0.8 : goldOrd === 2 ? 0.2 : 0.5;
    const mismatch = Math.abs(r.matrixDelay - expectedDelay);
    return { ...r, expectedDelay, mismatch };
  }).sort((a, b) => b.mismatch - a.mismatch);

  for (const r of scored.slice(0, 8)) {
    const direction = r.matrixDelay > r.expectedDelay ? 'parser thinks MORE periodic' : 'parser thinks MORE running';
    console.log(`${r.id}`);
    console.log(`  Gold: ${r.gold} | T2 score: ${r.t2Score.toFixed(3)} | MatrixDelay: ${r.matrixDelay.toFixed(3)} (expected ~${r.expectedDelay})`);
    console.log(`  ${direction}`);
    console.log(`  Clause stats: ${r.finiteCount} finite, depth ${r.maxDepth}, preMain ${r.preMainSubord.toFixed(1)}, ${r.sentCount} sentences`);
    if (r.diagnostics.length > 0) {
      console.log(`  Diagnostics: ${r.diagnostics.slice(0, 3).join('; ')}`);
    }
    console.log('');
  }
}

main().catch(e => { console.error(e); process.exit(1); });
