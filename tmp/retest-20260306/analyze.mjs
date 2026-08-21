const {default: fs} = await import('fs');
const raw = fs.readFileSync('tmp/gold-timeline/v1-output.json', 'utf-8');
const contentMatch = raw.match(/"content":\s*"((?:[^"\\]|\\.)*)"/s);
if (!contentMatch) { console.log('No content found'); process.exit(1); }
const text = contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
const words = text.split(/\s+/).filter(Boolean).length;
console.log('Total words:', words);

const mainIdx = text.indexOf('## VALIDATION APPENDIX');
const mainText = mainIdx > 0 ? text.substring(0, mainIdx) : text;
const mainWords = mainText.split(/\s+/).filter(Boolean).length;
console.log('Main prose words:', mainWords);

const cites = [...mainText.matchAll(/\(([^)]+?),\s*\*/g)].map(m => m[1].trim());
const uniqueSources = new Set(cites);
console.log('Unique sources cited:', uniqueSources.size, ':', [...uniqueSources]);

const quotes = [...mainText.matchAll(/"[^"]{15,}"/g)];
console.log('Direct quotations:', quotes.length);

const sentences = mainText.split(/[.!?]+/).filter(s => s.trim().length > 10);
const avgLen = sentences.reduce((sum, s) => sum + s.split(/\s+/).filter(Boolean).length, 0) / sentences.length;
console.log('Avg sentence length:', avgLen.toFixed(1));
console.log('Quality score:', raw.match(/"qualityScore":\s*([\d.]+)/)?.[1]);
