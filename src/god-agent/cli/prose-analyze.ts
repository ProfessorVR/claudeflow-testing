#!/usr/bin/env node
/**
 * prose-analyze CLI command
 * Analyzes a text file using Lanham's descriptive prose framework.
 *
 * Usage:
 *   npx god-agent prose-analyze path/to/file.md [--genre academic] [--verbose]
 */

import { Command } from 'commander';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { LanhamProseAnalyzer } from './style/lanham-prose-analyzer.js';
import type { Genre } from './style/lanham-style-policy.js';
import type { LanhamProseMetrics } from '../universal/style-analyzer.js';

const VALID_GENRES: Genre[] = ['academic', 'legal', 'narrative', 'journalistic', 'technical', 'general'];

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function countSentences(text: string): number {
  return (text.match(/[.!?]+/g) || []).length || 1;
}

function formatMinimal(filePath: string, text: string, metrics: LanhamProseMetrics): string {
  const words = countWords(text);
  const sentences = countSentences(text);
  const lines: string[] = [];

  lines.push('=== LANHAM PROSE ANALYSIS ===');
  lines.push(`File: ${filePath} (${words} words, ${sentences} sentences)`);
  lines.push('');

  // Noun/Verb
  lines.push(`  Noun/Verb:       ${metrics.labels.nounVerb} — ${metrics.explanations.nounVerb}`);

  // Architecture (parataxis/hypotaxis)
  lines.push(`  Architecture:    ${metrics.labels.parataxisHypotaxis} — ${metrics.explanations.parataxisHypotaxis}`);

  // Sentence Shape (periodic/running)
  lines.push(`  Sentence Shape:  ${metrics.labels.periodicRunning} — ${metrics.explanations.periodicRunning}`);

  // Voice
  lines.push(`  Voice:           ${metrics.labels.voice} — ${metrics.explanations.voice}`);

  // Register
  const registerLabel = `${metrics.labels.primaryRegister}${metrics.labels.registerMixed ? ' (mixed)' : ''}`;
  lines.push(`  Register:        ${registerLabel} — ${metrics.explanations.register}`);

  // Opacity
  lines.push(`  Opacity:         ${metrics.labels.opacity} — ${metrics.explanations.opacity}`);

  // Tacit Patterns
  const tacitSummary = metrics.explanations.tacitPatterns || 'none detected';
  lines.push(`  Tacit Patterns:  ${tacitSummary}`);

  return lines.join('\n');
}

function formatVerbose(filePath: string, text: string, metrics: LanhamProseMetrics): string {
  const words = countWords(text);
  const sentences = countSentences(text);
  const lines: string[] = [];

  lines.push('=== LANHAM PROSE ANALYSIS (VERBOSE) ===');
  lines.push(`File: ${filePath} (${words} words, ${sentences} sentences)`);
  lines.push(`Analysis depth: ${metrics.analysisDepth}`);
  lines.push('');

  // Noun/Verb
  lines.push(`  Noun/Verb:       ${metrics.labels.nounVerb} — ${metrics.explanations.nounVerb}`);
  lines.push(`    nounVerbRatio:              ${metrics.nounVerbRatio.toFixed(3)}`);
  lines.push(`    nominalizationDensity:      ${metrics.nominalizationDensity.toFixed(2)}/100 words`);
  lines.push(`    prepositionalPhraseDensity: ${metrics.prepositionalPhraseDensity.toFixed(2)}/sentence`);
  lines.push(`    beVerbRatio:                ${(metrics.beVerbRatio * 100).toFixed(1)}%`);
  lines.push(`    confidence:                 ${metrics.confidenceByAxis.nounVerb}`);
  lines.push('');

  // Architecture
  lines.push(`  Architecture:    ${metrics.labels.parataxisHypotaxis} — ${metrics.explanations.parataxisHypotaxis}`);
  lines.push(`    parataxisHypotaxisRatio:       ${metrics.parataxisHypotaxisRatio.toFixed(3)}`);
  lines.push(`    coordinatingConjDensity:       ${metrics.coordinatingConjunctionDensity.toFixed(4)}`);
  lines.push(`    subordinatingConjDensity:      ${metrics.subordinatingConjunctionDensity.toFixed(4)}`);
  lines.push(`    confidence:                    ${metrics.confidenceByAxis.parataxisHypotaxis}`);
  lines.push('');

  // Sentence Shape
  lines.push(`  Sentence Shape:  ${metrics.labels.periodicRunning} — ${metrics.explanations.periodicRunning}`);
  lines.push(`    periodicRunningRatio:          ${metrics.periodicRunningRatio.toFixed(3)}`);
  lines.push(`    preMainVerbClauseCount:        ${metrics.preMainVerbClauseCount.toFixed(2)}`);
  lines.push(`    confidence:                    ${metrics.confidenceByAxis.periodicRunning}`);
  lines.push('');

  // Voice
  lines.push(`  Voice:           ${metrics.labels.voice} — ${metrics.explanations.voice}`);
  lines.push(`    voiceScore:                    ${metrics.voiceScore.toFixed(3)}`);
  lines.push(`    dynamicRange:                  ${metrics.dynamicRange.toFixed(3)}`);
  lines.push(`    confidence:                    ${metrics.confidenceByAxis.voice}`);
  lines.push('');

  // Register
  const registerLabel = `${metrics.labels.primaryRegister}${metrics.labels.registerMixed ? ' (mixed)' : ''}`;
  lines.push(`  Register:        ${registerLabel} — ${metrics.explanations.register}`);
  lines.push(`    latinateGermanicRatio:         ${metrics.latinateGermanicRatio.toFixed(3)}`);
  lines.push(`    registerMarkednessScore:       ${metrics.registerMarkednessScore.toFixed(3)}`);
  lines.push(`    confidence:                    ${metrics.confidenceByAxis.register}`);
  lines.push('');

  // Opacity
  lines.push(`  Opacity:         ${metrics.labels.opacity} — ${metrics.explanations.opacity}`);
  lines.push(`    opacityScore:                  ${metrics.opacityScore.toFixed(3)}`);
  lines.push(`    selfConsciousnessScore:        ${metrics.selfConsciousnessScore.toFixed(3)}`);
  lines.push(`    confidence:                    ${metrics.confidenceByAxis.opacity}`);
  lines.push('');

  // Tacit Patterns (full detail)
  const tp = metrics.tacitPatterns;
  const tacitSummary = metrics.explanations.tacitPatterns || 'none detected';
  lines.push(`  Tacit Patterns:  ${tacitSummary}`);
  lines.push(`    alliterationDensity:           ${tp.alliterationDensity.toFixed(3)}/sentence`);
  lines.push(`    polyptotonDensity:             ${tp.polyptotonDensity.toFixed(3)}/sentence`);
  lines.push(`    chiasmusCount:                 ${tp.chiasmusCount}`);
  lines.push(`    antithesisCount:               ${tp.antithesisCount}`);
  lines.push(`    anaphoraCount:                 ${tp.anaphoraCount}`);
  lines.push(`    isocolonCount:                 ${tp.isocolonCount}`);
  lines.push(`    climaxPatternCount:            ${tp.climaxPatternCount}`);
  lines.push(`    confidence:                    ${metrics.confidenceByAxis.tacitPatterns}`);

  return lines.join('\n');
}

// ── CLI definition ─────────────────────────────────────────────────────────

const program = new Command();

program
  .name('prose-analyze')
  .description('Analyze a text file using Lanham\'s descriptive prose framework')
  .version('1.0.0')
  .argument('<file>', 'Path to the text file to analyze')
  .option('-g, --genre <genre>', `Genre context (${VALID_GENRES.join(', ')})`, 'general')
  .option('-v, --verbose', 'Show numeric values, confidence markers, and full tacit pattern counts')
  .action(async (file: string, options: { genre: string; verbose?: boolean }) => {
    // Validate genre
    const genre = options.genre as Genre;
    if (!VALID_GENRES.includes(genre)) {
      console.error(`Error: invalid genre "${options.genre}". Valid genres: ${VALID_GENRES.join(', ')}`);
      process.exit(1);
    }

    // Resolve and validate file path
    const filePath = resolve(file);
    if (!existsSync(filePath)) {
      console.error(`Error: file not found: ${filePath}`);
      process.exit(1);
    }

    // Read file
    let text: string;
    try {
      text = readFileSync(filePath, 'utf-8');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`Error reading file: ${msg}`);
      process.exit(1);
    }

    if (text.trim().length === 0) {
      console.error('Error: file is empty');
      process.exit(1);
    }

    // Run analysis
    const analyzer = new LanhamProseAnalyzer(genre);
    const metrics = await analyzer.fullAnalysis(text);

    // Format and print
    if (options.verbose) {
      console.log(formatVerbose(filePath, text, metrics));
    } else {
      console.log(formatMinimal(filePath, text, metrics));
    }

    process.exit(0);
  });

program.parse();
