const fs = require('fs');
const raw = fs.readFileSync('tmp/gold-timeline/v2-output.json', 'utf-8');
const m = raw.match(/"content":\s*"((?:[^"\\]|\\.)*)"/s);
if (!m) { console.log('no content match'); process.exit(0); }
const text = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
fs.writeFileSync('tmp/gold-timeline/v2-content.md', text);
console.log('Extracted', text.split(/\s+/).filter(Boolean).length, 'words to v2-content.md');
