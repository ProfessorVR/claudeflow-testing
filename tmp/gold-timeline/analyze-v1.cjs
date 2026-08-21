const fs = require('fs');
const raw = fs.readFileSync('tmp/gold-timeline/v1-output.json', 'utf-8');
const m = raw.match(/"content":\s*"((?:[^"\\]|\\.)*)"/s);
if (!m) { console.log('no content match'); process.exit(0); }
const text = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');

// Split at validation appendix
const mainIdx = text.indexOf('## VALIDATION APPENDIX') || text.indexOf('## Validation Appendix') || text.indexOf('---\n\n##');
const mainText = mainIdx > 0 ? text.substring(0, mainIdx) : text;
const mainWords = mainText.split(/\s+/).filter(Boolean).length;

console.log('Total words:', text.split(/\s+/).filter(Boolean).length);
console.log('Main prose words:', mainWords);

// Citations (Author, *Title*)
const cites = [...mainText.matchAll(/\(([^)]+?),\s*\*/g)].map(m => m[1].trim());
const uniqueAuthors = new Set(cites);
console.log('Unique authors cited (title-page):', uniqueAuthors.size, ':', [...uniqueAuthors]);

// Signal phrase citations
const signal = [...mainText.matchAll(/(?:As|For|In)\s+(\w+(?:\s+\w+)?)\s+(?:observes?|argues?|suggests?|notes?|maintains?|contends?|explains?|writes?|states?|emphasizes?|describes?|articulates?)/g)].map(m => m[1]);
console.log('Signal-phrase authors:', new Set(signal).size, ':', [...new Set(signal)]);

// Quotations - try both regular and smart quotes
const regQuotes = [...mainText.matchAll(/"[^"]{15,}"/g)];
const smartQuotes = [...mainText.matchAll(/\u201c[^\u201d]{15,}\u201d/g)];
console.log('Regular-quote quotations (15+ chars):', regQuotes.length);
console.log('Smart-quote quotations (15+ chars):', smartQuotes.length);

// Also check for any quoted text using escaped quotes in the raw JSON
const rawQuotes = [...raw.matchAll(/\\?"[^"\\]{15,}\\?"/g)];
// Count lines containing quotation marks in the main text
let quotedLines = 0;
for (const line of mainText.split('\n')) {
  if ((line.match(/"/g) || []).length >= 2) quotedLines++;
}
console.log('Lines with 2+ quote marks:', quotedLines);

// Avg sentence length
const sentences = mainText.split(/[.!?]+/).filter(s => s.trim().length > 10);
const avgLen = sentences.reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0) / sentences.length;
console.log('Avg sentence length:', avgLen.toFixed(1));

// Quality score
const qMatch = raw.match(/"qualityScore":\s*([\d.]+)/);
console.log('Quality score:', qMatch ? qMatch[1] : 'N/A');

// Print first 3000 chars of main text for manual review
console.log('\n=== FIRST 3000 CHARS OF PROSE ===');
console.log(mainText.substring(0, 3000));
