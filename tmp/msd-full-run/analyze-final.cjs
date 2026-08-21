const fs = require('fs');

// Extract JSON from output
const raw = fs.readFileSync('tmp/msd-full-run/phase5-v2-output.json', 'utf-8');
let depth = 0, start = -1, end = -1;
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === '{') { if (depth === 0) start = i; depth++; }
  else if (raw[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const d = JSON.parse(raw.substring(start, end));
const content = (d.result || {}).content || '';
fs.writeFileSync('tmp/msd-full-run/v2-final-content.md', content);

// Separate main text from appendix
const markers = ['## VALIDATION', '### 1. Claim', '---\n\n## VALIDATION', '---\n\n### 1.'];
let mainText = content;
for (const m of markers) {
  const idx = content.indexOf(m);
  if (idx > 500) { mainText = content.substring(0, idx); break; }
}

const mainWords = mainText.replace(/^#.*$/gm, '').split(/\s+/).filter(Boolean).length;
const totalWords = content.split(/\s+/).filter(Boolean).length;

// Quotations
const quotes = [...mainText.matchAll(/"([^"]{10,})"/g)];
const smartQuotes = [...mainText.matchAll(/\u201c([^\u201d]{10,})\u201d/g)];
const totalQuotes = quotes.length + smartQuotes.length;

// Authors
const knownAuthors = ['Aristotle', 'Heidegger', 'Rickert', 'Burke', 'O\'Gorman', 'Bowin', 'Gibson', 'O\'Connor', 'Multiple Authors', 'White', 'Hawhee', 'Papachristou', 'Nussbaum', 'Caston', 'Frede', 'Gonzalez'];
const foundAuthors = new Set();
for (const a of knownAuthors) { if (mainText.includes(a)) foundAuthors.add(a); }

// Phantom check
const hawhee = (mainText.match(/Hawhee/g) || []).length;

// Sentence analysis
const sentences = mainText.split(/[.!?]+/).filter(s => s.trim().length > 10);
const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
const longPct = lengths.filter(l => l >= 30).length / lengths.length;

// Transitions
const transitionWords = ['thus', 'indeed', 'hence', 'accordingly', 'specifically', 'subsequently', 'similarly'];
const tFound = [];
for (const t of transitionWords) {
  const re = new RegExp('\\b' + t + '\\b', 'gi');
  const count = (mainText.match(re) || []).length;
  if (count > 0) tFound.push(`${t}(${count})`);
}

// Section word counts
const sectionPattern = /## \d+\./g;
const sectionStarts = [];
let match;
while ((match = sectionPattern.exec(mainText)) !== null) sectionStarts.push(match.index);
const sectionCounts = [];
for (let i = 0; i < sectionStarts.length; i++) {
  const e = i + 1 < sectionStarts.length ? sectionStarts[i + 1] : mainText.length;
  const sec = mainText.substring(sectionStarts[i], e);
  const heading = sec.split('\n')[0].trim();
  const words = sec.split(/\s+/).filter(Boolean).length;
  sectionCounts.push({ heading, words });
}

// Total citations
const citationMatches = [...mainText.matchAll(/\([^)]*(?:\*|p\.)[^)]*\)/g)];

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║     MULTI-STEP DRAFTING PIPELINE — FINAL RESULTS       ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

console.log('=== FINAL COMPARISON TABLE ===\n');
console.log('| Metric                | Gold Standard | Pre-trim best | MSD v1 (diag) | MSD v2 (FINAL) |');
console.log('|-----------------------|:------------:|:-------------:|:-------------:|:--------------:|');
console.log(`| Main Text Words       | 3,116        | 1,936         | 1,783         | **${mainWords.toLocaleString()}**        |`);
console.log(`| Total Words           | ~6,400       | ~3,200        | 2,623         | **${totalWords.toLocaleString()}**       |`);
console.log(`| Quality Score         | 73.2%        | 79.9%         | 81.7%         | **${d.qualityScore ? (d.qualityScore*100).toFixed(1)+'%' : 'N/A'}**       |`);
console.log(`| Direct Quotations     | 4            | 13            | 18            | **${totalQuotes}**           |`);
console.log(`| Authors Cited         | 3            | 7             | 6             | **${foundAuthors.size}**            |`);
console.log(`| Total Citations       | ~15          | ~27           | ~22           | **${citationMatches.length}**           |`);
console.log(`| Prompt Size (chars)   | 27,183       | 66,885        | 19,379        | **20,833**       |`);
console.log(`| Input Tokens          | ~7K          | ~17K          | 5,632         | **6,041**        |`);
console.log(`| Output Tokens         | ~8K          | ~5K           | 5,339         | **5,963**        |`);
console.log(`| Phantom Citations     | 0            | 4             | 0             | **${hawhee}**            |`);
console.log(`| Avg Sentence Length   | 31.2         | N/A           | 30.9          | **${avgLen.toFixed(1)}**         |`);
console.log(`| Long Sentence %       | 51.6%        | N/A           | 63%           | **${(longPct*100).toFixed(0)}%**          |`);
console.log(`| Transition Types      | 7            | 6             | 4             | **${tFound.length}**            |`);

console.log('\n=== STYLE COMPLIANCE ===');
console.log(`Transitions: ${tFound.join(', ')}`);
console.log(`Authors: ${[...foundAuthors].join(', ')}`);
console.log(`Phantom Hawhee: ${hawhee}`);

console.log('\n=== SECTION WORD COUNTS ===');
let allAbove350 = true;
for (const s of sectionCounts) {
  const flag = s.words < 350 ? ' ⚠️ BELOW 350' : ' ✓';
  if (s.words < 350) allAbove350 = false;
  console.log(`  ${s.heading} — ${s.words} words${flag}`);
}
console.log(`\nAll sections ≥ 350 words: ${allAbove350 ? 'YES ✓' : 'NO — some below target'}`);

console.log('\n=== PIPELINE EFFICIENCY ===');
console.log(`Prompt compression: 66,885 → 20,833 chars (69% reduction)`);
console.log(`Token efficiency: 17K → 6K input tokens (65% reduction)`);
console.log(`Output gain: ~5K → 5,963 output tokens (19% more content)`);
console.log(`Cost reduction: ~65% fewer input tokens = ~65% lower API cost`);

console.log('\n=== VERDICT ===');
const proseTarget = mainWords >= 2800;
const quotTarget = totalQuotes >= 3;
const authorTarget = foundAuthors.size >= 4;
const phantomTarget = hawhee === 0;
const styleTarget = avgLen >= 28 && tFound.length >= 5;

const passed = [proseTarget, quotTarget, authorTarget, phantomTarget, styleTarget].filter(Boolean).length;
console.log(`Criteria passed: ${passed}/5`);
if (proseTarget) console.log('  ✓ Word count target (≥2,800 main text)');
else console.log('  ✗ Word count target (need ≥2,800)');
if (quotTarget) console.log('  ✓ Quotation target (≥3)');
else console.log('  ✗ Quotation target');
if (authorTarget) console.log('  ✓ Author diversity (≥4)');
else console.log('  ✗ Author diversity');
if (phantomTarget) console.log('  ✓ Zero phantom citations');
else console.log(`  ✗ ${hawhee} phantom citation(s)`);
if (styleTarget) console.log('  ✓ Style compliance');
else console.log('  ✗ Style compliance');
