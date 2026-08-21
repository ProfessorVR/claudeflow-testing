import { LanhamClauseParser } from '../src/god-agent/cli/style/lanham-clause-parser.js';
import { createEnPosBackend } from '../src/god-agent/cli/style/lanham-shared.js';

const backend = createEnPosBackend()!;
const parser = new LanhamClauseParser({ backend });

const tests = [
  {
    name: 'Holmes periodic (if...if...if...you know)',
    text: 'If you have been in line, if you have watched the enemy, if you have waited through the night, you know the cost.',
  },
  {
    name: 'Running style (subject-verb first)',
    text: 'The old man sat in the chair and looked at the sea. The sea was blue and flat. He drank his coffee and it was good.',
  },
  {
    name: 'Hemingway polysyndeton',
    text: 'And he ran and he jumped and he fell and he got up again and he kept going and he never stopped.',
  },
  {
    name: 'Legal periodic',
    text: 'Notwithstanding any provision of this Agreement to the contrary, in the event that the Borrower shall fail to make any payment when due, the Lender shall be entitled to exercise all remedies.',
  },
  {
    name: 'Simple declarative',
    text: 'The data was analyzed by the team. The results were published in the journal.',
  },
];

for (const t of tests) {
  console.log('='.repeat(70));
  console.log(t.name);
  const doc = parser.parseDocument(t.text);
  for (const s of doc.sentences) {
    console.log(`\n  Sentence: "${s.sentenceText.slice(0, 60)}..."`);
    console.log(`  Clauses: ${s.clauses.length}, Matrix: ${s.matrixClauseId}`);
    for (const c of s.clauses) {
      const text = s.tokens.slice(c.span.start, c.span.end).map(tk => tk.text).join(' ');
      const isMatrix = c.id === s.matrixClauseId ? ' ★MATRIX' : '';
      console.log(`    ${c.id} [${c.role}] d=${c.depth} conf=${c.confidence.toFixed(2)}${isMatrix}`);
      console.log(`      "${text.slice(0, 50)}${text.length > 50 ? '...' : ''}"`);
    }
    if (s.diagnostics.length) console.log(`  Diag: ${s.diagnostics.join('; ')}`);
    if (s.coordinationGroups.length) console.log(`  Coord: ${JSON.stringify(s.coordinationGroups)}`);

    // Compute periodic signal: matrix verb position / sentence length
    if (s.matrixClauseId) {
      const matrix = s.clauses.find(c => c.id === s.matrixClauseId);
      if (matrix?.headVerbToken !== undefined) {
        const totalTokens = s.tokens.filter(tk => /\w/.test(tk.text)).length;
        const delay = matrix.headVerbToken / (totalTokens || 1);
        console.log(`  Matrix delay: ${delay.toFixed(2)} (verb at token ${matrix.headVerbToken}/${totalTokens})`);
      }
    }
  }
  console.log('');
}
