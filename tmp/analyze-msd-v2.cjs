const fs = require('fs');

const raw = fs.readFileSync('tmp/test-msd-v2-output.json', 'utf-8');
let depth = 0, start = -1, end = -1;
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === '{') { if (depth === 0) start = i; depth++; }
  else if (raw[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const d = JSON.parse(raw.substring(start, end));
const r = d.result || {};
const content = r.content || '';

const appendixIdx = content.indexOf('## VALIDATION') !== -1 ? content.indexOf('## VALIDATION') : content.indexOf('### 1. Claim');
const mainText = appendixIdx > 0 ? content.substring(0, appendixIdx) : content;
const mainWords = mainText.split(/\s+/).filter(Boolean).length;
const totalWords = content.split(/\s+/).filter(Boolean).length;

const quotes = [...mainText.matchAll(/"([^"]{10,})"/g)];
const smartQuotes = [...mainText.matchAll(/\u201c([^\u201d]{10,})\u201d/g)];

const citations = [...mainText.matchAll(/\(([^)]+)\)/g)].map(m => m[1]);
const authors = new Set();
for (const c of citations) {
  const author = c.split(',')[0].replace(/[(*]/g, '').trim();
  if (author.length > 2 && !/^\d/.test(author) && !/^e\.g/.test(author) && !/^for /.test(author)) authors.add(author);
}

const sentences = mainText.split(/[.!?]+/).filter(s => s.trim().length > 10);
const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
const long = lengths.filter(l => l >= 30).length;

const transitions = ['thus', 'indeed', 'hence', 'accordingly', 'specifically', 'subsequently', 'similarly'];
const found = [];
for (const t of transitions) {
  const count = (mainText.toLowerCase().match(new RegExp('\\b' + t + '\\b', 'g')) || []).length;
  if (count > 0) found.push(`${t}(${count})`);
}

const hawhee = (mainText.match(/Hawhee/g) || []).length;

console.log('=== MSD v2 RESULTS (chunk trimming + reordering + style) ===\n');
console.log('Quality score:', d.qualityScore ? (d.qualityScore * 100).toFixed(1) + '%' : 'N/A');
console.log('Main text words:', mainWords);
console.log('Total words (incl appendix):', totalWords);
console.log('Quotations:', quotes.length + smartQuotes.length);
console.log('Authors cited:', authors.size, '→', [...authors].join(', '));
console.log('Avg sentence length:', avg.toFixed(1), 'words');
console.log('Long sentences (30+):', ((long/lengths.length)*100).toFixed(0) + '%');
console.log('Transitions:', found.join(', '));
console.log('Phantom Hawhee refs:', hawhee);

console.log('\n=== FINAL COMPARISON TABLE ===');
console.log('| Metric | Gold Std | Pre-trim v1 | Pre-trim v2 | MSD v1 | MSD v2 (final) |');
console.log('|--------|:-------:|:-----------:|:-----------:|:------:|:--------------:|');
console.log(`| Main Text Words | 3,116 | 2,097 | 1,936 | 1,988 | **${mainWords.toLocaleString()}** |`);
console.log(`| Total Words | ~6,400 | ~3,400 | ~3,200 | 2,929 | **${totalWords.toLocaleString()}** |`);
console.log(`| Quality Score | 73.2% | 75.3% | 79.9% | 81.3% | **${d.qualityScore ? (d.qualityScore * 100).toFixed(1) + '%' : 'N/A'}** |`);
console.log(`| Quotations | 4 | 0 | 13 | 16 | **${quotes.length + smartQuotes.length}** |`);
console.log(`| Authors Cited | 3 | 7 | 7 | 9 | **${authors.size}** |`);
console.log(`| Prompt Size | 27,183 | 66,885 | 66,885 | 19,379 | **20,409** |`);
console.log(`| Input Tokens | ~7K | ~17K | ~17K | 5,632 | **5,908** |`);
console.log(`| Phantom Citations | 0 | 0 | 4 | 0 | **${hawhee}** |`);
console.log(`| Avg Sentence Len | 31.2 | N/A | N/A | 29.7 | **${avg.toFixed(1)}** |`);
console.log(`| Long Sentence % | 51.6% | N/A | N/A | 47% | **${((long/lengths.length)*100).toFixed(0)}%** |`);
console.log(`| Transitions | 7 types | 2 | 6 | 3 | **${found.length}** |`);

fs.writeFileSync('tmp/test-msd-v2-content.md', content);
console.log('\nContent saved to tmp/test-msd-v2-content.md');
