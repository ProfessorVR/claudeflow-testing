/**
 * F4: Prepare inter-source validation materials.
 * Computes distribution comparisons and selects human review sample.
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

interface ExpansionLabel {
  id: string;
  genre: string;
  claude_labels: Record<string, string>;
  claude_confidence: Record<string, number>;
  claude_justifications: Record<string, string>;
  error?: string;
}

interface GoldEntry {
  id: string;
  genre: string;
  text: string;
  labels: Record<string, string>;
}

interface CorpusEntry {
  id: string;
  genre: string;
  text: string;
  source: string;
}

function main() {
  const labelsPath = resolve(process.cwd(), 'data/expansion-labels.jsonl');
  const goldPath = resolve(process.cwd(), 'data/gold-holdout.jsonl');
  const corpusPath = resolve(process.cwd(), 'data/expansion-corpus.jsonl');

  const labels: ExpansionLabel[] = readFileSync(labelsPath, 'utf-8')
    .split('\n').filter(l => l.trim()).map(l => JSON.parse(l))
    .filter((e: ExpansionLabel) => !e.error && Object.keys(e.claude_labels).length > 0);

  const gold: GoldEntry[] = readFileSync(goldPath, 'utf-8')
    .split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

  const corpus: CorpusEntry[] = readFileSync(corpusPath, 'utf-8')
    .split('\n').filter(l => l.trim()).map(l => JSON.parse(l));

  const corpusMap = new Map(corpus.map(c => [c.id, c]));

  const axes = ['nounVerb', 'parataxisHypotaxis', 'periodicRunning', 'voice', 'primaryRegister', 'opacity'];

  console.log(`=== F4: Inter-Source Validation ===`);
  console.log(`Valid expansion labels: ${labels.length}`);
  console.log(`Gold holdout: ${gold.length}`);
  console.log('');

  // === 1. Global distribution comparison ===
  console.log('=== GLOBAL DISTRIBUTION COMPARISON ===\n');
  for (const axis of axes) {
    const goldDist: Record<string, number> = {};
    const claudeDist: Record<string, number> = {};

    for (const g of gold) {
      const label = g.labels[axis] || '';
      goldDist[label] = (goldDist[label] || 0) + 1;
    }
    for (const el of labels) {
      const label = el.claude_labels[axis] || '';
      claudeDist[label] = (claudeDist[label] || 0) + 1;
    }

    const allLabels = [...new Set([...Object.keys(goldDist), ...Object.keys(claudeDist)])].sort();
    console.log(`${axis}:`);
    for (const label of allLabels) {
      const goldPct = ((goldDist[label] || 0) / gold.length * 100).toFixed(1);
      const claudePct = ((claudeDist[label] || 0) / labels.length * 100).toFixed(1);
      const diff = Math.abs(parseFloat(goldPct) - parseFloat(claudePct));
      const flag = diff > 15 ? ' *** MISMATCH' : '';
      console.log(`  ${label.padEnd(28)} gold=${goldPct.padStart(5)}%  claude=${claudePct.padStart(5)}%  Δ=${diff.toFixed(1)}%${flag}`);
    }
    console.log('');
  }

  // === 2. Per-genre distribution (n>=3 groups) ===
  console.log('=== PER-GENRE DISTRIBUTION (n>=3 groups) ===\n');
  const genreGroups = new Map<string, ExpansionLabel[]>();
  for (const el of labels) {
    if (!genreGroups.has(el.genre)) genreGroups.set(el.genre, []);
    genreGroups.get(el.genre)!.push(el);
  }

  const goldGenreGroups = new Map<string, GoldEntry[]>();
  for (const g of gold) {
    if (!goldGenreGroups.has(g.genre)) goldGenreGroups.set(g.genre, []);
    goldGenreGroups.get(g.genre)!.push(g);
  }

  for (const [genre, entries] of genreGroups) {
    if (entries.length < 3) continue;
    const goldEntries = goldGenreGroups.get(genre) || [];
    if (goldEntries.length < 2) continue; // need at least 2 gold for comparison

    console.log(`${genre} (expansion n=${entries.length}, gold n=${goldEntries.length}):`);
    for (const axis of ['voice', 'primaryRegister']) { // focus on strong axes
      const claudeLabels = entries.map(e => e.claude_labels[axis]).filter(Boolean);
      const goldLabels = goldEntries.map(e => e.labels[axis]).filter(Boolean);

      const claudeDist: Record<string, number> = {};
      for (const l of claudeLabels) claudeDist[l] = (claudeDist[l] || 0) + 1;

      const dist = Object.entries(claudeDist)
        .map(([l, c]) => `${l.slice(0, 15)}=${(c / claudeLabels.length * 100).toFixed(0)}%`)
        .join(', ');
      console.log(`  ${axis.padEnd(22)} ${dist}`);
    }
    console.log('');
  }

  // === 3. Select human review sample ===
  console.log('=== HUMAN REVIEW SAMPLE ===\n');

  // Base sample: 5 per genre bucket (stratified)
  const genreBuckets: Record<string, string[]> = {
    'academic': ['academic-humanities', 'academic-social-science', 'academic-sciences'],
    'legal': ['legal'],
    'literary': ['literary-fiction', 'literary-criticism'],
    'political': ['political-other', 'political-speeches'],
    'narrative': ['narrative-nonfiction', 'personal-correspondence', 'military'],
    'other': ['polemical', 'religious'],
  };

  const baseSample: ExpansionLabel[] = [];
  for (const [bucket, genres] of Object.entries(genreBuckets)) {
    const candidates = labels.filter(el => genres.includes(el.genre));
    // Prefer mixed-confidence passages
    const sorted = candidates.sort((a, b) => {
      const aVar = Object.values(a.claude_confidence).reduce((s, v) => s + Math.abs(v - 0.7), 0);
      const bVar = Object.values(b.claude_confidence).reduce((s, v) => s + Math.abs(v - 0.7), 0);
      return bVar - aVar; // higher variance = more informative
    });
    baseSample.push(...sorted.slice(0, 5));
  }

  // Axis-risk supplement
  const usedIds = new Set(baseSample.map(e => e.id));
  const supplement: ExpansionLabel[] = [];

  // Voice: low confidence or "moderate voice"
  const voiceRisk = labels
    .filter(el => !usedIds.has(el.id) && (el.claude_confidence.voice < 0.7 || el.claude_labels.voice === 'moderate voice'))
    .slice(0, 6);
  supplement.push(...voiceRisk);
  voiceRisk.forEach(e => usedIds.add(e.id));

  // Opacity: low confidence or "mixed opacity"
  const opacityRisk = labels
    .filter(el => !usedIds.has(el.id) && (el.claude_confidence.opacity < 0.7 || el.claude_labels.opacity === 'mixed opacity'))
    .slice(0, 6);
  supplement.push(...opacityRisk);
  opacityRisk.forEach(e => usedIds.add(e.id));

  // Parataxis: low confidence
  const paraRisk = labels
    .filter(el => !usedIds.has(el.id) && el.claude_confidence.parataxisHypotaxis < 0.7)
    .slice(0, 6);
  supplement.push(...paraRisk);

  const fullSample = [...baseSample, ...supplement];
  console.log(`Base sample: ${baseSample.length}`);
  console.log(`Axis-risk supplement: ${supplement.length} (voice=${voiceRisk.length}, opacity=${opacityRisk.length}, parataxis=${paraRisk.length})`);
  console.log(`Total review sample: ${fullSample.length}`);
  console.log('');

  // Write the review sample with passages for human evaluation
  const reviewOutput: Array<{
    id: string;
    genre: string;
    text: string;
    source: string;
    claude_labels: Record<string, string>;
    claude_confidence: Record<string, number>;
    claude_justifications: Record<string, string>;
    review_type: string;
  }> = [];

  for (const el of fullSample) {
    const c = corpusMap.get(el.id);
    reviewOutput.push({
      id: el.id,
      genre: el.genre,
      text: c?.text || '',
      source: c?.source || '',
      claude_labels: el.claude_labels,
      claude_confidence: el.claude_confidence,
      claude_justifications: el.claude_justifications,
      review_type: baseSample.includes(el) ? 'base' : 'axis-risk',
    });
  }

  const reviewPath = resolve(process.cwd(), 'data/human-review-sample.jsonl');
  writeFileSync(reviewPath, reviewOutput.map(e => JSON.stringify(e)).join('\n') + '\n');
  console.log(`Review sample written to: ${reviewPath}`);
  console.log('');

  // === 4. Confidence distribution ===
  console.log('=== CONFIDENCE DISTRIBUTION ===\n');
  for (const axis of axes) {
    const confs = labels.map(el => el.claude_confidence[axis]).filter(c => c !== undefined);
    const high = confs.filter(c => c >= 0.80).length;
    const med = confs.filter(c => c >= 0.60 && c < 0.80).length;
    const low = confs.filter(c => c < 0.60).length;
    const avg = confs.reduce((a, b) => a + b, 0) / confs.length;
    console.log(`${axis.padEnd(22)} avg=${avg.toFixed(2)} high(≥0.8)=${high} med(0.6-0.8)=${med} low(<0.6)=${low}`);
  }

  // === 5. Per-axis trust recommendation ===
  console.log('\n=== PER-AXIS TRUST RECOMMENDATION ===');
  console.log('(Based on F1 gate + F2.5 ablation + confidence distribution)\n');

  const trustLevels: Record<string, string> = {
    nounVerb: 'PARTIAL — F1 gate 3/5, low anchoring, moderate confidence',
    parataxisHypotaxis: 'EXCLUDE — F1 gate 1/5, HIGH anchoring (29%), Claude unreliable on structural axis',
    periodicRunning: 'EXCLUDE — F1 gate 2/5, low anchoring but poor accuracy on structural axis',
    voice: 'FULL TRUST — F1 gate 5/5, low anchoring, high confidence',
    primaryRegister: 'FULL TRUST — F1 gate 4/5, low anchoring, high confidence',
    opacity: 'EXCLUDE — F1 gate 3/5, HIGH anchoring (21%), reader-response axis unreliable',
  };

  for (const [axis, level] of Object.entries(trustLevels)) {
    console.log(`  ${axis.padEnd(22)} ${level}`);
  }
}

main();
