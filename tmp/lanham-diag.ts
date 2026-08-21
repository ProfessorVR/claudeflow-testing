import { readFileSync } from 'fs';
import { LanhamProseAnalyzer } from '../src/god-agent/cli/style/lanham-prose-analyzer.js';

interface GoldEntry {
  id: string;
  genre: string;
  text: string;
  labels: {
    nounVerb: string;
    parataxisHypotaxis: string;
    periodicRunning: string;
    voice: string;
    primaryRegister: string;
    opacity: string;
  };
}

const gold: GoldEntry[] = readFileSync('tests/calibration/lanham-gold-set.jsonl', 'utf-8')
  .trim().split('\n').map(l => JSON.parse(l));

const analyzer = new LanhamProseAnalyzer('academic');

console.log('=== Parataxis/Hypotaxis Diagnostic ===\n');
console.log('ID'.padEnd(16), 'Ratio'.padEnd(8), 'Generated'.padEnd(28), 'Gold'.padEnd(28), 'Match');
console.log('-'.repeat(95));

let paraHits = 0;
let opacHits = 0;

for (const entry of gold) {
  const m = await analyzer.fullAnalysis(entry.text);

  const paraMatch = entry.labels.parataxisHypotaxis === m.labels.parataxisHypotaxis;
  if (paraMatch) paraHits++;

  console.log(
    entry.id.padEnd(16),
    m.parataxisHypotaxisRatio.toFixed(3).padEnd(8),
    m.labels.parataxisHypotaxis.padEnd(28),
    entry.labels.parataxisHypotaxis.padEnd(28),
    paraMatch ? 'OK' : 'MISS',
  );
}

console.log(`\nParataxis accuracy: ${paraHits}/${gold.length} (${(paraHits/gold.length*100).toFixed(0)}%)`);

console.log('\n=== Opacity Diagnostic ===\n');
console.log('ID'.padEnd(16), 'Score'.padEnd(8), 'Generated'.padEnd(18), 'Gold'.padEnd(18), 'Match');
console.log('-'.repeat(75));

for (const entry of gold) {
  const m = await analyzer.fullAnalysis(entry.text);

  const opacMatch = entry.labels.opacity === m.labels.opacity;
  if (opacMatch) opacHits++;

  console.log(
    entry.id.padEnd(16),
    m.opacityScore.toFixed(3).padEnd(8),
    m.labels.opacity.padEnd(18),
    entry.labels.opacity.padEnd(18),
    opacMatch ? 'OK' : 'MISS',
  );
}

console.log(`\nOpacity accuracy: ${opacHits}/${gold.length} (${(opacHits/gold.length*100).toFixed(0)}%)`);

// Detailed parataxis breakdown on worst misses
console.log('\n=== Parataxis Misses Detail ===\n');
for (const entry of gold) {
  const m = await analyzer.fullAnalysis(entry.text);
  if (entry.labels.parataxisHypotaxis !== m.labels.parataxisHypotaxis) {
    console.log(`${entry.id}: gold=${entry.labels.parataxisHypotaxis}, got=${m.labels.parataxisHypotaxis}`);
    console.log(`  ratio=${m.parataxisHypotaxisRatio.toFixed(3)} coordDensity=${m.coordinatingConjunctionDensity.toFixed(4)} subordDensity=${m.subordinatingConjunctionDensity.toFixed(4)}`);
    // Count actual conjunctions
    const words = entry.text.toLowerCase().split(/\s+/);
    const coords = words.filter(w => ['and', 'but', 'or', 'nor', 'for', 'yet', 'so'].includes(w.replace(/[^a-z]/g, '')));
    const subs = words.filter(w => ['although', 'because', 'since', 'unless', 'while', 'whereas', 'when', 'where', 'if', 'though', 'after', 'before', 'until'].includes(w.replace(/[^a-z]/g, '')));
    console.log(`  Raw counts: coordinating=${coords.length} subordinating=${subs.length} total_words=${words.length}`);
    console.log(`  First 50 words: "${entry.text.split(/\s+/).slice(0, 50).join(' ')}..."\n`);
  }
}
