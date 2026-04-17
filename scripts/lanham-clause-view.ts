#!/usr/bin/env npx tsx
/**
 * Clause-view dev tool — pretty-prints clause parse trees.
 * Usage:
 *   echo "If you have waited, you know the cost." | npx tsx scripts/lanham-clause-view.ts
 *   npx tsx scripts/lanham-clause-view.ts "If you have waited, you know the cost."
 */
import { LanhamClauseParser } from '../src/god-agent/cli/style/lanham-clause-parser.js';
import { createEnPosBackend } from '../src/god-agent/cli/style/lanham-shared.js';
import { extractClauseFeatures } from '../src/god-agent/cli/style/lanham-clause-features.js';

const backend = createEnPosBackend();
if (!backend) { console.error('en-pos backend unavailable'); process.exit(1); }
const parser = new LanhamClauseParser({ backend });

async function main() {
  let text = process.argv.slice(2).join(' ');
  if (!text) {
    // Read from stdin
    const chunks: string[] = [];
    for await (const chunk of process.stdin) chunks.push(chunk.toString());
    text = chunks.join('');
  }
  if (!text.trim()) { console.error('No input text'); process.exit(1); }

  const doc = parser.parseDocument(text.trim());
  const features = extractClauseFeatures(doc);

  console.log('=== CLAUSE PARSE TREE ===\n');

  for (const s of doc.sentences) {
    console.log(`Sentence [${s.sentenceId}]: "${s.sentenceText.slice(0, 80)}${s.sentenceText.length > 80 ? '...' : ''}"`);
    console.log(`  Tokens: ${s.tokens.length} | Clauses: ${s.clauses.length} | Matrix: ${s.matrixClauseId || 'none'}`);
    console.log('');

    // Print clause tree with indentation by depth
    for (const c of s.clauses) {
      const indent = '  ' + '  '.repeat(c.depth);
      const spanText = s.tokens.slice(c.span.start, c.span.end).map(t => t.text).join(' ');
      const isMatrix = c.id === s.matrixClauseId ? ' ★' : '';
      const intro = c.introducedBy ? ` [intro: "${c.introducedBy}"]` : '';
      const verb = c.headVerbToken !== undefined ? ` [verb: token ${c.headVerbToken} "${s.tokens[c.headVerbToken]?.text}"]` : '';

      console.log(`${indent}${c.id} (${c.role}) depth=${c.depth} conf=${c.confidence.toFixed(2)} finite=${c.finite}${isMatrix}`);
      console.log(`${indent}  → ${c.relationToParent} to ${c.parentClauseId || 'ROOT'}${intro}${verb}`);
      console.log(`${indent}  "${spanText}"`);
    }

    if (s.coordinationGroups.length > 0) {
      console.log(`  Coordination: ${s.coordinationGroups.map(g => '[' + g.join(', ') + ']').join(' ')}`);
    }
    if (s.diagnostics.length > 0) {
      console.log(`  Diagnostics:`);
      for (const d of s.diagnostics) console.log(`    - ${d}`);
    }
    console.log('');
  }

  // Document-level features
  console.log('=== CLAUSE-DERIVED FEATURES ===\n');
  console.log(`  hasClauseData:         ${features.hasClauseData}`);
  console.log(`  parseConfidence:       ${features.parseConfidence.toFixed(3)}`);
  console.log(`  coordinateClauseRate:  ${features.coordinateClauseRate.toFixed(3)}`);
  console.log(`  subordinateClauseRate: ${features.subordinateClauseRate.toFixed(3)}`);
  console.log(`  subordinationDepthMean:${features.subordinationDepthMean.toFixed(3)}`);
  console.log(`  maxSubordinationDepth: ${features.maxSubordinationDepth}`);
  console.log(`  finiteClauseCount:     ${features.finiteClauseCount}`);
  console.log(`  preMainSubordinateRate:${features.preMainSubordinateRate.toFixed(3)}`);
  console.log(`  matrixDelayMean:       ${features.matrixDelayMean.toFixed(3)}`);
}

main().catch(e => { console.error(e); process.exit(1); });
