const fs = require('fs');

// Read the output file and extract the first valid JSON object
const raw = fs.readFileSync('tmp/test-msd-v1-output.json', 'utf-8');

// Find the first complete JSON object by looking for matching braces
let depth = 0;
let start = -1;
let end = -1;
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === '{') {
    if (depth === 0) start = i;
    depth++;
  } else if (raw[i] === '}') {
    depth--;
    if (depth === 0) { end = i + 1; break; }
  }
}

if (start === -1 || end === -1) {
  console.log('No valid JSON found');
  process.exit(1);
}

const d = JSON.parse(raw.substring(start, end));
console.log('=== MSD V1 TEST RESULTS (with chunk trimming + reordering) ===\n');
console.log('Success:', d.success);
console.log('Quality score:', d.qualityScore);
console.log('Word count:', d.wordCount);

const r = d.result || {};
const content = r.content || '';
console.log('Content length:', content.length, 'chars');

// Split into main text and appendix
const appendixIdx = content.indexOf('## VALIDATION') !== -1 ? content.indexOf('## VALIDATION') : content.indexOf('### 1. Claim');
const mainText = appendixIdx > 0 ? content.substring(0, appendixIdx) : content;
const mainWords = mainText.split(/\s+/).filter(Boolean).length;
console.log('Main text words:', mainWords);
console.log('Has validation appendix:', appendixIdx > 0 ? 'YES' : 'NO');

// Count quotations
const quotes = [...mainText.matchAll(/"([^"]{10,})"/g)];
const smartQuotes = [...mainText.matchAll(/\u201c([^\u201d]{10,})\u201d/g)];
console.log('Direct quotations:', quotes.length + smartQuotes.length);

// Count unique authors cited
const citations = [...mainText.matchAll(/\(([^)]+)\)/g)].map(m => m[1]);
const authorCites = citations.filter(c => c.includes(',') || c.includes('*'));
const authors = new Set();
for (const c of authorCites) {
  const author = c.split(',')[0].replace(/[(*]/g, '').trim();
  if (author.length > 2 && !/^\d/.test(author)) authors.add(author);
}
console.log('Unique authors cited:', authors.size, '→', [...authors].join(', '));

// Count total citations
const titlePageCites = citations.filter(c => c.includes('*') || c.includes('p.'));
console.log('Total citations (with title/page):', titlePageCites.length);

// Sentence analysis
const sentences = mainText.split(/[.!?]+/).filter(s => s.trim().length > 10);
const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
const long = lengths.filter(l => l >= 30).length;
console.log(`\nSentence analysis: avg ${avg.toFixed(1)} words, ${((long/lengths.length)*100).toFixed(0)}% long (30+)`);

// Transition analysis
const transitions = ['thus', 'indeed', 'hence', 'accordingly', 'specifically', 'subsequently', 'similarly'];
const found = [];
for (const t of transitions) {
  const count = (mainText.toLowerCase().match(new RegExp('\\b' + t + '\\b', 'g')) || []).length;
  if (count > 0) found.push(`${t}(${count})`);
}
console.log('Transitions:', found.join(', '));

// Check for phantom (Hawhee 2011)
const hawhee = (mainText.match(/Hawhee/g) || []).length;
console.log('Phantom "Hawhee" references:', hawhee);

// Section word counts
console.log('\nSection word counts:');
const sections = mainText.split(/## \d+\./);
for (let i = 1; i < sections.length; i++) {
  const heading = sections[i].split('\n')[0].trim();
  const words = sections[i].split(/\s+/).filter(Boolean).length;
  console.log(`  Section ${i}: ${heading} — ${words} words`);
}

// Comparison table
console.log('\n=== COMPARISON ===');
console.log('| Metric | Gold Standard | Previous v1 | Previous v2 | MSD v1 (trimmed) |');
console.log('|--------|:-----------:|:-----------:|:-----------:|:----------------:|');
console.log(`| Prose Words | 3,116 | 2,097 | 1,936 | **${mainWords.toLocaleString()}** |`);
console.log(`| Quotations | 4 | 0 | 13 | **${quotes.length + smartQuotes.length}** |`);
console.log(`| Authors | 3 | 7 | 7 | **${authors.size}** |`);
console.log(`| Quality | 73.2% | 75.3% | 79.9% | **${d.qualityScore ? (d.qualityScore * 100).toFixed(1) + '%' : 'N/A'}** |`);
console.log(`| Prompt Size | 27,183 | 66,885 | 66,885 | **19,379** |`);
console.log(`| Input Tokens | ~7K | ~17K | ~17K | **5,632** |`);

// Save main content for further analysis
fs.writeFileSync('tmp/test-msd-v1-content.md', content);
console.log('\nContent saved to tmp/test-msd-v1-content.md');
