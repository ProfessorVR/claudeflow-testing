#!/usr/bin/env node
/**
 * Enrich Style Profiles with Lanham Prose Metrics
 *
 * Reads .agentdb/universal/style-profiles.json and enriches any profile
 * that lacks lanhamMetrics by running LanhamProseAnalyzer (or AdvancedLanhamAnalyzer)
 * on its stored sampleTexts.
 *
 * Usage:
 *   node scripts/enrich-style-lanham.mjs
 *   node scripts/enrich-style-lanham.mjs --analyzer advanced
 */

import { LanhamProseAnalyzer, AdvancedLanhamAnalyzer, GENRE_DEFAULTS } from '../src/god-agent/cli/style/index.js';
import * as fs from 'fs';
import * as path from 'path';

// Parse CLI flags
let analyzerTier = 'heuristic';
for (let i = 2; i < process.argv.length; i++) {
  if (process.argv[i] === '--analyzer' && i + 1 < process.argv.length) {
    analyzerTier = process.argv[++i];
    if (!['heuristic', 'advanced'].includes(analyzerTier)) {
      console.error('Invalid --analyzer value:', analyzerTier, '(must be heuristic|advanced)');
      process.exit(1);
    }
  }
}

const profilesPath = path.resolve('.agentdb/universal/style-profiles.json');

if (!fs.existsSync(profilesPath)) {
  console.error('Profiles file not found:', profilesPath);
  process.exit(1);
}

console.log('=== Lanham Style Enrichment ===');
console.log('Profiles file:', profilesPath);
console.log('Analyzer tier:', analyzerTier);

const data = JSON.parse(fs.readFileSync(profilesPath, 'utf-8'));
const profiles = data.profiles || {};
const profileIds = Object.keys(profiles);

console.log('Total profiles:', profileIds.length);

const enriched = [];
const skipped = [];

for (const id of profileIds) {
  const profile = profiles[id];
  const name = profile.metadata?.name || id;

  // Skip if already has lanhamMetrics
  if (profile.characteristics?.lanhamMetrics) {
    console.log('\n  [SKIP]', name, '- already has lanhamMetrics');
    skipped.push({ id, name, reason: 'already enriched' });
    continue;
  }

  // Check for sampleTexts
  if (!profile.sampleTexts || profile.sampleTexts.length === 0) {
    console.warn('\n  [WARN]', name, '- no sampleTexts available, skipping');
    skipped.push({ id, name, reason: 'no sampleTexts' });
    continue;
  }

  console.log('\n  [ENRICH]', name, '(' + profile.sampleTexts.length + ' sample texts)');

  // Concatenate all sample texts
  const fullText = profile.sampleTexts.join('\n\n');

  if (fullText.trim().length < 100) {
    console.warn('    WARNING: Very short text (' + fullText.trim().length + ' chars), results may be unreliable');
  }

  // Instantiate analyzer — read genre from profile metadata, default to 'academic'
  const VALID_GENRES = ['academic', 'legal', 'narrative', 'journalistic', 'technical', 'general'];
  const genre = VALID_GENRES.includes(profile.metadata?.genre) ? profile.metadata.genre : 'academic';
  const analyzer = analyzerTier === 'advanced'
    ? new AdvancedLanhamAnalyzer(genre)
    : new LanhamProseAnalyzer(genre);

  try {
    const metrics = await analyzer.fullAnalysis(fullText);

    // Store on profile characteristics
    profile.characteristics.lanhamMetrics = metrics;

    // Store provenance on metadata
    profile.metadata.lanhamAnalyzerTier = analyzerTier;
    profile.metadata.lanhamEnrichedAt = Date.now();

    // Derive suggested Lanham target from genre defaults
    const genreKey = genre;
    const genreDefault = GENRE_DEFAULTS[genreKey];
    profile.metadata.suggestedLanhamTarget = {
      registerTarget: genreDefault.registerTarget,
      allowRegisterPlay: genreDefault.allowRegisterPlay,
      tacitPersuasionLevel: genreDefault.tacitPersuasionLevel,
      derivedFrom: genreKey,
    };

    enriched.push({ id, name });

    console.log('    Noun/Verb:    ', metrics.labels.nounVerb);
    console.log('    Architecture: ', metrics.labels.periodicRunning);
    console.log('    Connection:   ', metrics.labels.parataxisHypotaxis);
    console.log('    Voice:        ', metrics.labels.voice);
    console.log('    Register:     ', metrics.labels.primaryRegister + (metrics.labels.registerMixed ? ' (mixed)' : ''));
    console.log('    Opacity:      ', metrics.labels.opacity);
    console.log('    Depth:        ', metrics.analysisDepth);
  } catch (err) {
    console.error('    ERROR analyzing', name + ':', err.message || err);
    skipped.push({ id, name, reason: 'analysis error: ' + (err.message || err) });
  }
}

// Save updated profiles
if (enriched.length > 0) {
  fs.writeFileSync(profilesPath, JSON.stringify(data, null, 2));
  console.log('\n=== Saved ===');
} else {
  console.log('\n=== No changes ===');
}

console.log('\n=== Summary ===');
console.log('Enriched:', enriched.length);
if (enriched.length > 0) {
  for (const p of enriched) {
    console.log('  +', p.name, '(' + p.id + ')');
  }
}
console.log('Skipped:', skipped.length);
if (skipped.length > 0) {
  for (const p of skipped) {
    console.log('  -', p.name + ':', p.reason);
  }
}
console.log('\nDone.');
