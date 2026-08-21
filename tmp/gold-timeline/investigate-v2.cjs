const fs = require('fs');
const text = fs.readFileSync('tmp/gold-timeline/v2-content.md', 'utf-8');
const mainIdx = text.indexOf('---\n\n## VALIDATION');
const mainText = mainIdx > 0 ? text.substring(0, mainIdx) : text;

console.log('=== V1 INVESTIGATION REPORT ===\n');

// 1. Quotation check - are there ANY direct quotations with quotation marks?
const quoteMatches = [...mainText.matchAll(/"([^"]{10,})"/g)];
const smartMatches = [...mainText.matchAll(/\u201c([^\u201d]{10,})\u201d/g)];
console.log('## 1. DIRECT QUOTATIONS');
console.log('Regular quotes found:', quoteMatches.length);
console.log('Smart quotes found:', smartMatches.length);
if (quoteMatches.length === 0 && smartMatches.length === 0) {
  console.log('>>> CRITICAL ISSUE: ZERO direct quotations in the prose.');
  console.log('    The gold standard v1 had quotations (one was a phantom).');
  console.log('    This output paraphrases everything instead of quoting verbatim.\n');
}

// 2. Check for phantom/unverifiable claims
console.log('\n## 2. CITATION FORMAT CHECK');
const citations = [...mainText.matchAll(/\(([^)]+)\)/g)].map(m => m[1]);
const titlePageCites = citations.filter(c => c.includes('*'));
const nonTitlePage = citations.filter(c => !c.includes('*') && !c.match(/^\d/));
console.log('Title-page format citations (Author, *Title*, p. X):', titlePageCites.length);
console.log('Non-standard citations:', nonTitlePage.length);
for (const c of nonTitlePage) {
  if (c.length > 10) console.log('  >', c);
}

// 3. Check for missing page numbers
console.log('\n## 3. PAGE NUMBER CHECK');
const noPgCites = titlePageCites.filter(c => !c.includes('p.') && !c.includes('pp.'));
console.log('Citations missing page numbers:', noPgCites.length);
for (const c of noPgCites) console.log('  >', c);

// 4. Sentence length distribution
console.log('\n## 4. SENTENCE LENGTH (NO STYLE PROFILE)');
const sentences = mainText.split(/[.!?]+/).filter(s => s.trim().length > 10);
const lengths = sentences.map(s => s.split(/\s+/).filter(Boolean).length);
const short = lengths.filter(l => l < 15).length;
const medium = lengths.filter(l => l >= 15 && l < 30).length;
const long = lengths.filter(l => l >= 30).length;
const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
console.log(`Short (<15): ${short} (${(short/lengths.length*100).toFixed(0)}%)`);
console.log(`Medium (15-29): ${medium} (${(medium/lengths.length*100).toFixed(0)}%)`);
console.log(`Long (30+): ${long} (${(long/lengths.length*100).toFixed(0)}%)`);
console.log(`Average: ${avg.toFixed(1)} words`);
console.log('Gold standard profile target: avg 31 words, 52% long');

// 5. Transition words
console.log('\n## 5. TRANSITION ANALYSIS');
const transitions = ['thus', 'indeed', 'hence', 'accordingly', 'specifically', 'subsequently', 'similarly'];
for (const t of transitions) {
  const count = (mainText.toLowerCase().match(new RegExp('\\b' + t + '\\b', 'g')) || []).length;
  if (count > 0) console.log(`  "${t}": ${count}`);
}

// 6. Passive voice estimate
console.log('\n## 6. PASSIVE VOICE');
const passiveMatches = (mainText.match(/\b(is|are|was|were|been|being)\s+(not\s+)?\w+ed\b/g) || []);
console.log('Approximate passive constructions:', passiveMatches.length);

// 7. Em-dashes
console.log('\n## 7. CHARACTERISTIC FEATURES');
const emDashes = (mainText.match(/—/g) || []).length;
console.log('Em-dashes:', emDashes);
const weConstructions = (mainText.match(/\bwe\b/gi) || []).length;
console.log('"We" constructions:', weConstructions);

// 8. Broken text / artifacts
console.log('\n## 8. ARTIFACTS / BROKEN TEXT');
const brokenLines = mainText.split('\n').filter(l =>
  l.includes('[') || l.includes('(Hawhee 2011)') || l.match(/\d\)\.\s/) ||
  l.includes('4).') || l.match(/\s{3,}/)
);
for (const l of brokenLines) {
  const snippet = l.substring(0, 200);
  if (snippet.trim()) console.log('  ARTIFACT:', snippet);
}

// 9. Section word counts
console.log('\n## 9. SECTION WORD COUNTS');
const sections = mainText.split(/## \d+\./);
for (let i = 1; i < sections.length; i++) {
  const heading = sections[i].split('\n')[0].trim();
  const words = sections[i].split(/\s+/).filter(Boolean).length;
  console.log(`  Section ${i}: ${heading} — ${words} words`);
}
