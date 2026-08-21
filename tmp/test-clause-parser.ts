import { LanhamClauseParser } from '../src/god-agent/cli/style/lanham-clause-parser.js';
import { createEnPosBackend } from '../src/god-agent/cli/style/lanham-shared.js';

const backend = createEnPosBackend();
if (!backend) { console.error('Backend unavailable'); process.exit(1); }

const parser = new LanhamClauseParser({ backend, debug: true });

const tests = [
  'He walked in and sat down.',
  'If you have waited, and if you have watched, you know the cost.',
  'The implementation of the assessment framework represents a significant development.',
  'He came, and when the bell rang, he left.',
  'He bought apples, oranges, bananas, and grapes.',
];

for (const text of tests) {
  console.log('---');
  console.log('INPUT:', text);
  const doc = parser.parseDocument(text);
  const s = doc.sentences[0];
  if (!s) { console.log('  (no parse)'); continue; }
  console.log('  Tokens:', s.tokens.length);
  console.log('  Clauses:', s.clauses.length);
  for (const c of s.clauses) {
    const spanText = s.tokens.slice(c.span.start, c.span.end).map(t => t.text).join(' ');
    console.log(`    ${c.id} [${c.role}] depth=${c.depth} conf=${c.confidence.toFixed(2)} finite=${c.finite} parent=${c.parentClauseId || 'ROOT'}`);
    console.log(`      "${spanText}"`);
  }
  console.log('  Matrix:', s.matrixClauseId);
  console.log('  CoordGroups:', JSON.stringify(s.coordinationGroups));
  if (s.diagnostics.length > 0) console.log('  Diagnostics:', s.diagnostics);
}
