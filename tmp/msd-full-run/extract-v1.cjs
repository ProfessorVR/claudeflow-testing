const fs = require('fs');
const raw = fs.readFileSync('tmp/msd-full-run/phase3-v1-output.json', 'utf-8');
let depth = 0, start = -1, end = -1;
for (let i = 0; i < raw.length; i++) {
  if (raw[i] === '{') { if (depth === 0) start = i; depth++; }
  else if (raw[i] === '}') { depth--; if (depth === 0) { end = i + 1; break; } }
}
const d = JSON.parse(raw.substring(start, end));
const content = (d.result || {}).content || '';
fs.writeFileSync('tmp/msd-full-run/v1-content.md', content);
console.log('v1 content extracted:', content.split(/\s+/).filter(Boolean).length, 'words,', content.length, 'chars');
console.log('Quality score:', d.qualityScore);
