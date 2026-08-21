const fs = require('fs');
const raw = fs.readFileSync('tmp/test-msd-v2-content.md', 'utf-8');

// Find main text (before validation appendix or --- separator)
let mainText = raw;
const markers = ['## VALIDATION', '### 1. Claim', '---\n\n## VALIDATION'];
for (const m of markers) {
  const idx = raw.indexOf(m);
  if (idx > 500) { mainText = raw.substring(0, idx); break; }
}

// Clean count of main text words
const mainWords = mainText.replace(/^#.*$/gm, '').split(/\s+/).filter(Boolean).length;
console.log('Main text words (cleaned):', mainWords);
console.log('Total document words:', raw.split(/\s+/).filter(Boolean).length);

// Better quotation detection
const quotes = [...mainText.matchAll(/"([^"]{10,})"/g)];
const smartQuotes = [...mainText.matchAll(/\u201c([^\u201d]{10,})\u201d/g)];
console.log('Quotations in main text:', quotes.length + smartQuotes.length);

// Better author detection — look for known corpus authors only
const knownAuthors = ['Aristotle', 'Heidegger', 'Rickert', 'Burke', 'O\'Gorman', 'Bowin', 'Gibson', 'O\'Connor', 'Wong', 'Hawhee', 'Multiple Authors', 'White', 'Papachristou', 'Nussbaum', 'Caston', 'Frede', 'Gonzalez'];
const found = new Set();
for (const a of knownAuthors) {
  if (mainText.includes(a)) found.add(a);
}
console.log('Actual authors cited:', found.size, '→', [...found].join(', '));

// Phantom citations
const hawhee = (mainText.match(/Hawhee\s*\d{4}/g) || []).length;
const hawheeMention = (mainText.match(/Hawhee/g) || []).length;
console.log('Hawhee mentions:', hawheeMention, '(phantom citation form:', hawhee, ')');

// Style metrics
const sentences = mainText.split(/[.!?]+/).filter(s => s.trim().length > 10);
const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
const long = lengths.filter(l => l >= 30).length;
console.log(`Avg sentence length: ${avg.toFixed(1)} (target: 31.2)`);
console.log(`Long sentence %: ${((long/lengths.length)*100).toFixed(0)}% (target: 51.6%)`);

const transitions = ['thus', 'indeed', 'hence', 'accordingly', 'specifically', 'subsequently', 'similarly'];
const tFound = [];
for (const t of transitions) {
  const count = (mainText.toLowerCase().match(new RegExp('\\b' + t + '\\b', 'g')) || []).length;
  if (count > 0) tFound.push(`${t}(${count})`);
}
console.log(`Transitions: ${tFound.length} types → ${tFound.join(', ')}`);

// First 200 chars of text
const firstPara = mainText.split('\n').filter(l => l.trim().length > 50)[0] || '';
console.log('\nOpening:', firstPara.substring(0, 250));
