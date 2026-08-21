import { LanhamClauseParser, detectClauseCues, proposeClauseSpans } from '../src/god-agent/cli/style/lanham-clause-parser.js';
import { createEnPosBackend, tagPOS } from '../src/god-agent/cli/style/lanham-shared.js';

const backend = createEnPosBackend()!;
const text = 'If you have waited, and if you have watched, you know the cost.';

// Tokenize manually to see POS tags
const words = text.replace(/[^\w\s'-]/g, ' ').split(/\s+/).filter(w => w.length > 0);
const posTags = tagPOS(words);
console.log('POS tags:');
for (const t of posTags) console.log(`  ${t.word.padEnd(12)} ${t.tag}`);

// Now check what the parser's tokenizer produces
const parser = new LanhamClauseParser({ backend });
const doc = parser.parseDocument(text);
const s = doc.sentences[0];
console.log('\nParser tokens:');
for (const t of s.tokens) console.log(`  [${t.i}] ${t.text.padEnd(12)} ${t.pos}`);

const cues = detectClauseCues(s.tokens);
console.log('\nCues:');
for (const c of cues) console.log(`  token[${c.tokenIndex}] ${s.tokens[c.tokenIndex]?.text} → ${c.type} conf=${c.confidence}`);

const spans = proposeClauseSpans(s.tokens, cues);
console.log('\nProposed spans:');
for (const sp of spans) {
  const spanText = s.tokens.slice(sp.start, sp.end).map(t => t.text).join(' ');
  console.log(`  [${sp.start}-${sp.end}) trigger=${sp.trigger || 'none'} "${spanText}"`);
}
