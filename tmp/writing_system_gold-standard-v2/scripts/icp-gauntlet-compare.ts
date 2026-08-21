#!/usr/bin/env npx tsx
/**
 * ICP Gauntlet Comparison — Run A/B prose through the Quality Gauntlet
 *
 * Reads the saved A/B comparison files and runs both through the full
 * 9-stage QualityGauntlet WITH corpus context (chunks from ChromaDB +
 * sources from manifest), then produces a side-by-side comparative report.
 *
 * Usage: cd /home/dalton/projects/claudeflow-testing && npx tsx scripts/icp-gauntlet-compare.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { QualityGauntlet, type GauntletResult } from '../src/god-agent/cli/quality/quality-gauntlet.js';
import { SmartRetrievalLayer } from '../src/god-agent/retrieval/smart-retrieval-layer.js';
import type { QualityEvaluationContext } from '../src/god-agent/cli/quality/quality-stage.js';

// =============================================================================
// ENV LOADER
// =============================================================================

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (value) process.env[key] = value;
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function extractProse(filePath: string): string {
  const content = fs.readFileSync(filePath, 'utf-8');
  // Prose starts after the first "---" line and ends before the endnotes/bibliography or EOF
  const parts = content.split('\n---\n');
  if (parts.length < 2) return content;

  let prose = parts.slice(1).join('\n---\n').trim();

  // Strip endnotes section if present
  const endnotesIdx = prose.indexOf('\n## Endnotes\n');
  if (endnotesIdx !== -1) {
    prose = prose.slice(0, endnotesIdx).trim();
  }
  // Also strip trailing hash IDs (orphaned bibliography IDs)
  prose = prose.replace(/\n[0-9a-f]{16}\n?/g, '').trim();

  return prose;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function bar(score: number, width: number = 20): string {
  const filled = Math.round(score * width);
  return '[' + '#'.repeat(filled) + '-'.repeat(width - filled) + ']';
}

function pct(score: number): string {
  return (score * 100).toFixed(1) + '%';
}

function delta(a: number, b: number): string {
  const diff = b - a;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${(diff * 100).toFixed(1)}pp`;
}

/**
 * Load corpus sources from manifest.jsonl
 */
function loadCorpusSources(): Array<{ author: string; year: number; title: string; docId?: string }> {
  const manifestPath = path.resolve(process.cwd(), 'scripts/ingest/manifest.jsonl');
  if (!fs.existsSync(manifestPath)) {
    console.warn('WARNING: manifest.jsonl not found, corpusSources will be empty');
    return [];
  }

  const sources: Array<{ author: string; year: number; title: string; docId?: string }> = [];
  const lines = fs.readFileSync(manifestPath, 'utf-8').split('\n').filter(l => l.trim());

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.meta) {
        sources.push({
          author: entry.meta.author_raw || 'Unknown',
          year: entry.meta.year || 0,
          title: entry.meta.title_raw || entry.path_rel || '',
          docId: entry.doc_id,
        });
      }
    } catch {
      // skip malformed lines
    }
  }

  return sources;
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  console.log('============================================================');
  console.log('  ICP QUALITY GAUNTLET — A/B COMPARATIVE REPORT (w/ corpus)');
  console.log('============================================================\n');

  // -------------------------------------------------------------------------
  // 1. Find A/B files
  // -------------------------------------------------------------------------
  const tmpDir = path.resolve(process.cwd(), 'tmp');
  const files = fs.readdirSync(tmpDir).filter(f => f.startsWith('ab-'));
  const aFiles = files.filter(f => f.startsWith('ab-A-basic-')).sort().reverse();
  const bFiles = files.filter(f => f.startsWith('ab-B-enriched-')).sort().reverse();

  if (aFiles.length === 0 || bFiles.length === 0) {
    console.error('ERROR: A/B comparison files not found in tmp/');
    process.exit(1);
  }

  const pathA = path.join(tmpDir, aFiles[0]);
  const pathB = path.join(tmpDir, bFiles[0]);

  console.log(`Version A: ${aFiles[0]}`);
  console.log(`Version B: ${bFiles[0]}\n`);

  // Extract prose
  const proseA = extractProse(pathA);
  const proseB = extractProse(pathB);

  console.log(`Words A: ${countWords(proseA)}`);
  console.log(`Words B: ${countWords(proseB)}\n`);

  // -------------------------------------------------------------------------
  // 2. Retrieve corpus chunks from ChromaDB
  // -------------------------------------------------------------------------
  console.log('Retrieving corpus chunks from ChromaDB...');

  // Verify embedding service
  try {
    const embRes = await fetch('http://localhost:8000/');
    const embStatus = await embRes.json() as any;
    console.log(`  Embedding: ${embStatus.status} (${embStatus.model})`);
  } catch {
    console.error('ERROR: Embedding service not reachable at :8000. Run /god-launch first.');
    process.exit(1);
  }

  const retrieval = new SmartRetrievalLayer({
    chromaUrl: 'http://localhost:8001',
    embeddingUrl: 'http://localhost:8000',
    collectionName: 'knowledge_chunks',
    defaultMaxChunks: 60,
    defaultMinRelevance: 0.30,
    corpusFolder: 'rhetorical_ontology',
  });

  // Retrieve chunks relevant to the prompt topic
  const query = `Aristotle phantasia imagination De Anima perception thought psychology of action Heidegger`;
  const corpusChunks = await retrieval.retrieveContext(query, {
    collections: ['rhetorical_ontology'],
    maxChunks: 60,
    minRelevance: 0.30,
  });

  console.log(`  Retrieved ${corpusChunks.length} corpus chunks`);
  if (corpusChunks.length > 0) {
    const authors = [...new Set(corpusChunks.map(c => c.metadata?.author).filter(Boolean))];
    console.log(`  Authors represented: ${authors.join(', ')}`);
    const scores = corpusChunks.map(c => c.relevanceScore);
    console.log(`  Relevance range: ${Math.min(...scores).toFixed(3)} - ${Math.max(...scores).toFixed(3)}`);
  }

  // -------------------------------------------------------------------------
  // 3. Load corpus sources from manifest
  // -------------------------------------------------------------------------
  const corpusSources = loadCorpusSources();
  console.log(`  Loaded ${corpusSources.length} corpus sources from manifest`);

  // Extract known authors
  const knownAuthors = [...new Set([
    ...corpusChunks.map(c => c.metadata?.author).filter(Boolean) as string[],
    ...corpusSources.map(s => s.author).filter(a => a !== 'Unknown'),
  ])];
  console.log(`  Known authors: ${knownAuthors.length}\n`);

  // -------------------------------------------------------------------------
  // 4. Build evaluation context
  // -------------------------------------------------------------------------
  const evalContext: QualityEvaluationContext = {
    corpusChunks,
    corpusSources,
    knownAuthors,
  };

  // -------------------------------------------------------------------------
  // 5. Run both through the gauntlet WITH corpus context
  // -------------------------------------------------------------------------
  const gauntlet = new QualityGauntlet();
  const stageNames = gauntlet.getStageNames();
  console.log(`Running ${stageNames.length} quality stages: ${stageNames.join(', ')}\n`);

  console.log('Running gauntlet on Version A (Basic) with corpus context...');
  const startA = Date.now();
  const resultA = await gauntlet.runGauntlet(proseA, 1, evalContext);
  const timeA = Date.now() - startA;
  console.log(`  Done in ${timeA}ms — overall: ${pct(resultA.overallScore)}, passed: ${resultA.passed}\n`);

  // Clear cache so B gets fresh evaluation
  gauntlet.clearCache();

  console.log('Running gauntlet on Version B (Enriched) with corpus context...');
  const startB = Date.now();
  const resultB = await gauntlet.runGauntlet(proseB, 1, evalContext);
  const timeB = Date.now() - startB;
  console.log(`  Done in ${timeB}ms — overall: ${pct(resultB.overallScore)}, passed: ${resultB.passed}\n`);

  // ==========================================================================
  // COMPARATIVE REPORT
  // ==========================================================================

  console.log('\n' + '='.repeat(72));
  console.log('  COMPARATIVE QUALITY REPORT (with corpus context)');
  console.log('='.repeat(72) + '\n');

  // Overall scores
  console.log('OVERALL SCORES');
  console.log('─'.repeat(60));
  console.log(`  A (Basic):    ${pct(resultA.overallScore)}  ${bar(resultA.overallScore)}  ${resultA.passed ? 'PASS' : 'FAIL'}`);
  console.log(`  B (Enriched): ${pct(resultB.overallScore)}  ${bar(resultB.overallScore)}  ${resultB.passed ? 'PASS' : 'FAIL'}`);
  console.log(`  Delta:        ${delta(resultA.overallScore, resultB.overallScore)}`);
  console.log();

  // Stage-by-stage comparison
  console.log('STAGE-BY-STAGE COMPARISON');
  console.log('─'.repeat(72));
  console.log(`${'Stage'.padEnd(28)} ${'A Score'.padEnd(10)} ${'B Score'.padEnd(10)} ${'Delta'.padEnd(10)} Winner`);
  console.log('─'.repeat(72));

  let aWins = 0;
  let bWins = 0;
  let ties = 0;

  for (const stageName of stageNames) {
    const stageA = resultA.stageResults.find(s => s.stageName === stageName);
    const stageB = resultB.stageResults.find(s => s.stageName === stageName);

    const scoreA = stageA?.score ?? 0;
    const scoreB = stageB?.score ?? 0;
    const d = delta(scoreA, scoreB);

    let winner: string;
    if (Math.abs(scoreA - scoreB) < 0.005) {
      winner = 'TIE';
      ties++;
    } else if (scoreB > scoreA) {
      winner = 'B >';
      bWins++;
    } else {
      winner = '< A';
      aWins++;
    }

    console.log(
      `  ${stageName.padEnd(26)} ${pct(scoreA).padEnd(10)} ${pct(scoreB).padEnd(10)} ${d.padEnd(10)} ${winner}`
    );
  }

  console.log('─'.repeat(72));
  console.log(`  Stage wins:  A=${aWins}  B=${bWins}  Ties=${ties}`);
  console.log();

  // Issue comparison
  console.log('ISSUE SUMMARY');
  console.log('─'.repeat(60));
  console.log(`${''.padEnd(22)} ${'A (Basic)'.padEnd(14)} ${'B (Enriched)'.padEnd(14)}`);
  console.log(`  Total issues:       ${String(resultA.summary.totalIssues).padEnd(14)} ${resultB.summary.totalIssues}`);
  console.log(`  Critical:           ${String(resultA.summary.criticalCount).padEnd(14)} ${resultB.summary.criticalCount}`);
  console.log(`  Major:              ${String(resultA.summary.majorCount).padEnd(14)} ${resultB.summary.majorCount}`);
  console.log(`  Minor:              ${String(resultA.summary.minorCount).padEnd(14)} ${resultB.summary.minorCount}`);
  console.log(`  Auto-fixable:       ${String(resultA.summary.autoFixableCount).padEnd(14)} ${resultB.summary.autoFixableCount}`);
  console.log(`  Stages passed:      ${resultA.summary.stagesPassed}/${resultA.summary.totalStages}`.padEnd(36) +
    `${resultB.summary.stagesPassed}/${resultB.summary.totalStages}`);
  console.log();

  // Per-stage issue breakdown
  console.log('PER-STAGE ISSUE BREAKDOWN');
  console.log('─'.repeat(72));
  console.log(`${'Stage'.padEnd(28)} ${'A Issues'.padEnd(12)} ${'B Issues'.padEnd(12)} ${'A Pass'.padEnd(8)} ${'B Pass'.padEnd(8)}`);
  console.log('─'.repeat(72));

  for (const stageName of stageNames) {
    const stageA = resultA.stageResults.find(s => s.stageName === stageName);
    const stageB = resultB.stageResults.find(s => s.stageName === stageName);

    const issuesA = stageA?.issues?.length ?? 0;
    const issuesB = stageB?.issues?.length ?? 0;
    const passA = stageA?.passed ? 'YES' : 'NO';
    const passB = stageB?.passed ? 'YES' : 'NO';

    console.log(
      `  ${stageName.padEnd(26)} ${String(issuesA).padEnd(12)} ${String(issuesB).padEnd(12)} ${passA.padEnd(8)} ${passB.padEnd(8)}`
    );
  }
  console.log();

  // Claim verification details
  const cvA = resultA.stageResults.find(s => s.stageName === 'claim-verification');
  const cvB = resultB.stageResults.find(s => s.stageName === 'claim-verification');
  if (cvA || cvB) {
    console.log('CLAIM VERIFICATION DETAIL');
    console.log('─'.repeat(60));
    const mA = (cvA as any)?.metrics ?? {};
    const mB = (cvB as any)?.metrics ?? {};
    console.log(`${''.padEnd(26)} ${'A (Basic)'.padEnd(14)} ${'B (Enriched)'.padEnd(14)}`);
    console.log(`  Total claims:       ${String(mA.totalClaims ?? '-').padEnd(14)} ${mB.totalClaims ?? '-'}`);
    console.log(`  Supported:          ${String(mA.supportedClaims ?? '-').padEnd(14)} ${mB.supportedClaims ?? '-'}`);
    console.log(`  Partially supported:${String(mA.partiallySupportedClaims ?? '-').padEnd(14)} ${mB.partiallySupportedClaims ?? '-'}`);
    console.log(`  Unsupported:        ${String(mA.unsupportedClaims ?? '-').padEnd(14)} ${mB.unsupportedClaims ?? '-'}`);
    console.log(`  Contradicted:       ${String(mA.contradictedClaims ?? '-').padEnd(14)} ${mB.contradictedClaims ?? '-'}`);
    console.log(`  Uncertain:          ${String(mA.uncertainClaims ?? '-').padEnd(14)} ${mB.uncertainClaims ?? '-'}`);
    console.log(`  Blocked:            ${String(mA.blockedClaims ?? '-').padEnd(14)} ${mB.blockedClaims ?? '-'}`);
    console.log(`  Overall health:     ${typeof mA.overallHealth === 'number' ? pct(mA.overallHealth).padEnd(14) : '-'.padEnd(14)} ${typeof mB.overallHealth === 'number' ? pct(mB.overallHealth) : '-'}`);
    console.log();
  }

  // Critical issues detail
  if (resultA.criticalIssues.length > 0 || resultB.criticalIssues.length > 0) {
    console.log('CRITICAL ISSUES');
    console.log('─'.repeat(60));

    if (resultA.criticalIssues.length > 0) {
      console.log(`\n  Version A (${resultA.criticalIssues.length} critical):`);
      for (const issue of resultA.criticalIssues.slice(0, 10)) {
        const loc = issue.location.paragraphIndex !== undefined
          ? `P${issue.location.paragraphIndex + 1}`
          : 'General';
        console.log(`    [${loc}] ${issue.type}: ${issue.description.slice(0, 120)}`);
      }
    }

    if (resultB.criticalIssues.length > 0) {
      console.log(`\n  Version B (${resultB.criticalIssues.length} critical):`);
      for (const issue of resultB.criticalIssues.slice(0, 10)) {
        const loc = issue.location.paragraphIndex !== undefined
          ? `P${issue.location.paragraphIndex + 1}`
          : 'General';
        console.log(`    [${loc}] ${issue.type}: ${issue.description.slice(0, 120)}`);
      }
    }
    console.log();
  }

  // Qualitative comparison
  console.log('─'.repeat(72));
  console.log('  VERDICT');
  console.log('─'.repeat(72));

  const scoreDiff = resultB.overallScore - resultA.overallScore;
  if (Math.abs(scoreDiff) < 0.01) {
    console.log('  Result: STATISTICAL TIE — enrichment shows no measurable quality difference');
  } else if (scoreDiff > 0) {
    console.log(`  Result: VERSION B (ENRICHED) WINS by ${delta(resultA.overallScore, resultB.overallScore)}`);
    console.log(`  The enriched superprompt produces measurably higher quality output.`);
  } else {
    console.log(`  Result: VERSION A (BASIC) WINS by ${delta(resultB.overallScore, resultA.overallScore)}`);
    console.log(`  The basic superprompt outperforms the enriched version.`);
  }
  console.log();

  // Save full report
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const reportPath = path.join(tmpDir, `gauntlet-comparison-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    corpusContext: {
      chunksRetrieved: corpusChunks.length,
      corpusSources: corpusSources.length,
      knownAuthors: knownAuthors.length,
    },
    versions: {
      A: { file: aFiles[0], words: countWords(proseA) },
      B: { file: bFiles[0], words: countWords(proseB) },
    },
    overall: {
      A: { score: resultA.overallScore, passed: resultA.passed },
      B: { score: resultB.overallScore, passed: resultB.passed },
      delta: scoreDiff,
    },
    stages: stageNames.map(name => ({
      name,
      A: resultA.stageResults.find(s => s.stageName === name),
      B: resultB.stageResults.find(s => s.stageName === name),
    })),
    issues: {
      A: resultA.summary,
      B: resultB.summary,
    },
    criticalIssues: {
      A: resultA.criticalIssues,
      B: resultB.criticalIssues,
    },
  }, null, 2));

  console.log(`Full report saved: ${reportPath}`);
  console.log('\nDone.');
}

main().catch(err => {
  console.error('Gauntlet comparison failed:', err);
  process.exit(1);
});
