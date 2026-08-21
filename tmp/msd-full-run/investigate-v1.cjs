const fs = require('fs');
const content = fs.readFileSync('tmp/msd-full-run/v1-content.md', 'utf-8');

// Separate main text from appendix
const markers = ['## VALIDATION', '### 1. Claim', '---\n\n##'];
let mainText = content;
let appendix = '';
for (const m of markers) {
  const idx = content.indexOf(m);
  if (idx > 500) { mainText = content.substring(0, idx); appendix = content.substring(idx); break; }
}
const mainWords = mainText.replace(/^#.*$/gm, '').split(/\s+/).filter(Boolean).length;

const report = { issues: [], strengths: [], metrics: {} };

// I1: Quotation check
const quotes = [...mainText.matchAll(/"([^"]{10,})"/g)];
const smartQuotes = [...mainText.matchAll(/\u201c([^\u201d]{10,})\u201d/g)];
const totalQuotes = quotes.length + smartQuotes.length;
report.metrics.quotations = totalQuotes;
if (totalQuotes < 3) report.issues.push({ id: 'I1', severity: 'HIGH', desc: `Only ${totalQuotes} direct quotations (need ≥3)` });
else report.strengths.push(`${totalQuotes} direct quotations (exceeds minimum)`);

// I2: Citation format check
const citations = [...mainText.matchAll(/\(([^)]+)\)/g)].map(m => m[1]);
const withPage = citations.filter(c => /p\.\s*\d|pp\.\s*\d/i.test(c));
const withoutPage = citations.filter(c => (c.includes('*') || c.includes(',')) && !/p\.\s*\d|pp\.\s*\d/i.test(c) && c.length > 5);
report.metrics.totalCitations = citations.length;
report.metrics.citationsWithPage = withPage.length;
report.metrics.citationsWithoutPage = withoutPage.length;
if (withoutPage.length > 3) report.issues.push({ id: 'I2', severity: 'MEDIUM', desc: `${withoutPage.length} citations missing page numbers`, examples: withoutPage.slice(0, 3) });
else report.strengths.push('Most citations have page numbers');

// I3: Source diversity
const knownAuthors = ['Aristotle', 'Heidegger', 'Rickert', 'Burke', 'O\'Gorman', 'Bowin', 'Gibson', 'O\'Connor', 'Multiple Authors', 'White', 'Hawhee', 'Papachristou', 'Nussbaum', 'Caston', 'Frede'];
const foundAuthors = new Set();
for (const a of knownAuthors) { if (mainText.includes(a)) foundAuthors.add(a); }
report.metrics.authorsCited = foundAuthors.size;
report.metrics.authors = [...foundAuthors];
if (foundAuthors.size < 4) report.issues.push({ id: 'I3', severity: 'HIGH', desc: `Only ${foundAuthors.size} authors cited (need ≥4)` });
else report.strengths.push(`${foundAuthors.size} authors cited: ${[...foundAuthors].join(', ')}`);

// I4: Phantom citations (non-corpus authors referenced as citations)
const phantomPatterns = [/Hawhee\s*\(?2011\)?/g, /Hawhee\s*,/g, /Modrak/g, /Nussbaum\s*\(/g];
const phantoms = [];
for (const p of phantomPatterns) {
  const m = mainText.match(p);
  if (m) phantoms.push(...m);
}
report.metrics.phantomCitations = phantoms.length;
if (phantoms.length > 0) report.issues.push({ id: 'I4', severity: 'HIGH', desc: `${phantoms.length} phantom citation(s): ${phantoms.join(', ')}` });
else report.strengths.push('Zero phantom citations');

// I5: Sentence length distribution
const sentences = mainText.split(/[.!?]+/).filter(s => s.trim().length > 10);
const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
const longPct = lengths.filter(l => l >= 30).length / lengths.length;
report.metrics.avgSentenceLen = Math.round(avgLen * 10) / 10;
report.metrics.longSentencePct = Math.round(longPct * 100);
if (avgLen < 25) report.issues.push({ id: 'I5', severity: 'MEDIUM', desc: `Avg sentence length ${avgLen.toFixed(1)} words (target: 31.2)` });

// I6: Transition variety
const transitions = { thus: 0, indeed: 0, hence: 0, accordingly: 0, specifically: 0, subsequently: 0, similarly: 0 };
for (const t of Object.keys(transitions)) {
  transitions[t] = (mainText.toLowerCase().match(new RegExp('\\\\b' + t + '\\\\b', 'g')) || []).length;
}
// Fix regex for node
for (const t of Object.keys(transitions)) {
  const re = new RegExp('\\b' + t + '\\b', 'gi');
  transitions[t] = (mainText.match(re) || []).length;
}
const usedTransitions = Object.entries(transitions).filter(([,c]) => c > 0);
report.metrics.transitionTypes = usedTransitions.length;
report.metrics.transitions = Object.fromEntries(usedTransitions);
if (usedTransitions.length < 4) report.issues.push({ id: 'I6', severity: 'LOW', desc: `Only ${usedTransitions.length} transition types (target: 7)` });

// I7: Word count
report.metrics.mainTextWords = mainWords;
report.metrics.totalWords = content.split(/\s+/).filter(Boolean).length;
if (mainWords < 2500) report.issues.push({ id: 'I7', severity: 'MEDIUM', desc: `Main text ${mainWords} words (target: 3,000-3,500)` });

// I8: Section balance
const sectionPattern = /## \d+\./g;
const sectionStarts = [];
let match;
while ((match = sectionPattern.exec(mainText)) !== null) sectionStarts.push(match.index);
if (sectionStarts.length > 0) {
  const sectionTexts = [];
  for (let i = 0; i < sectionStarts.length; i++) {
    const end = i + 1 < sectionStarts.length ? sectionStarts[i + 1] : mainText.length;
    sectionTexts.push(mainText.substring(sectionStarts[i], end));
  }
  report.metrics.sectionWordCounts = sectionTexts.map(s => {
    const heading = s.split('\n')[0].trim();
    const words = s.split(/\s+/).filter(Boolean).length;
    return { heading, words };
  });
}

// Write report
const reportStr = JSON.stringify(report, null, 2);
fs.writeFileSync('tmp/msd-full-run/v1-investigation.json', reportStr);

// Print summary
console.log('=== PHASE 3: V1 INVESTIGATION REPORT ===\n');
console.log('METRICS:');
console.log(`  Words: ${mainWords} main / ${report.metrics.totalWords} total`);
console.log(`  Quotations: ${totalQuotes}`);
console.log(`  Authors: ${foundAuthors.size} (${[...foundAuthors].join(', ')})`);
console.log(`  Avg sentence length: ${avgLen.toFixed(1)} words`);
console.log(`  Long sentences: ${report.metrics.longSentencePct}%`);
console.log(`  Transitions: ${usedTransitions.map(([t,c]) => `${t}(${c})`).join(', ')}`);
console.log(`  Phantom citations: ${phantoms.length}`);

if (report.issues.length > 0) {
  console.log('\nISSUES:');
  for (const issue of report.issues) {
    console.log(`  [${issue.severity}] ${issue.id}: ${issue.desc}`);
    if (issue.examples) console.log(`    Examples: ${issue.examples.join(' | ')}`);
  }
}

console.log('\nSTRENGTHS:');
for (const s of report.strengths) console.log(`  + ${s}`);

if (report.metrics.sectionWordCounts) {
  console.log('\nSECTION WORD COUNTS:');
  for (const s of report.metrics.sectionWordCounts) {
    const flag = s.words < 200 ? ' ⚠️ SHORT' : s.words > 500 ? ' ✓ LONG' : '';
    console.log(`  ${s.heading} — ${s.words} words${flag}`);
  }
}
