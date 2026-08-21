#!/usr/bin/env npx tsx
/**
 * Prompt Builder CLI — Generate structured, validation-ready academic prompts.
 *
 * Usage:
 *   npx tsx scripts/build-prompt.ts \
 *     --prompt "Analyze Aristotle's understanding of motion and time..." \
 *     --corpus-folder rhetorical_ontology \
 *     --primary "Aristotle:Physics" "Aristotle:De Anima" \
 *     --secondary "Heidegger:Basic Concepts of Aristotelian Philosophy" \
 *     --strictness strict \
 *     --word-count 2000 \
 *     --category section \
 *     --output prompt.tex
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  buildPrompt,
  createDefaultConfig,
  applyStrictnessPreset,
  generateDefaultSections,
  STRICTNESS_PRESETS,
} from '../src/god-agent/core/composition/prompt-builder-engine.js';
import type { PromptBuilderConfig, PromptBuilderSection } from '../src/god-agent/core/composition/icp-types.js';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (value) process.env[key] = value;
  }
}

// =============================================================================
// ARGUMENT PARSING
// =============================================================================

function parseArgs(): {
  prompt: string;
  corpusFolder?: string;
  primary: Array<{ author: string; title: string }>;
  secondary: Array<{ author: string; title: string }>;
  strictness: string;
  wordCount: string;
  category: string;
  sections?: string;
  noAppendix: boolean;
  noGauntlet: boolean;
  format: string;
  output?: string;
  autoSections: boolean;
  help: boolean;
} {
  const args = process.argv.slice(2);
  const result: any = {
    prompt: '',
    primary: [],
    secondary: [],
    strictness: 'strict',
    wordCount: '2000',
    category: 'section',
    noAppendix: false,
    noGauntlet: false,
    format: 'tex',
    autoSections: false,
    help: false,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    switch (arg) {
      case '--help':
      case '-h':
        result.help = true;
        break;
      case '--prompt':
      case '-p':
        result.prompt = args[++i] || '';
        break;
      case '--corpus-folder':
        result.corpusFolder = args[++i];
        break;
      case '--primary':
        i++;
        while (i < args.length && !args[i].startsWith('--')) {
          result.primary.push(parseSource(args[i]));
          i++;
        }
        continue; // skip i++ at end
      case '--secondary':
        i++;
        while (i < args.length && !args[i].startsWith('--')) {
          result.secondary.push(parseSource(args[i]));
          i++;
        }
        continue;
      case '--strictness':
        result.strictness = args[++i] || 'strict';
        break;
      case '--word-count':
        result.wordCount = args[++i] || '2000';
        break;
      case '--category':
        result.category = args[++i] || 'section';
        break;
      case '--sections':
        result.sections = args[++i];
        break;
      case '--no-appendix':
        result.noAppendix = true;
        break;
      case '--no-gauntlet':
        result.noGauntlet = true;
        break;
      case '--format':
        result.format = args[++i] || 'tex';
        break;
      case '--output':
      case '-o':
        result.output = args[++i];
        break;
      case '--auto-sections':
        result.autoSections = true;
        break;
    }
    i++;
  }

  return result;
}

function parseSource(s: string): { author: string; title: string } {
  const parts = s.split(':');
  return {
    author: parts[0]?.trim() || '',
    title: parts.slice(1).join(':').trim() || '',
  };
}

function printUsage(): void {
  console.log(`
Prompt Builder CLI — Generate structured, validation-ready academic prompts.

USAGE:
  npx tsx scripts/build-prompt.ts --prompt "..." [OPTIONS]

OPTIONS:
  --prompt, -p         Research question (required)
  --corpus-folder      Corpus folder (e.g., rhetorical_ontology)
  --primary            Primary sources (Author:Title pairs, space-separated)
  --secondary          Secondary sources (Author:Title pairs, space-separated)
  --strictness         Preset: strict | moderate | permissive (default: strict)
  --word-count         Target word count (default: 2000)
  --category           Draft category: section | chapter | paper | essay | article | report
  --sections           Path to JSON file with manual section definitions
  --auto-sections      Auto-generate sections from prompt (heuristic)
  --no-appendix        Skip Validation Appendix
  --no-gauntlet        Skip Quality Gauntlet
  --format             Output format: tex | md | text (default: tex)
  --output, -o         Output file path (default: stdout)
  --help, -h           Show this help

EXAMPLES:
  npx tsx scripts/build-prompt.ts \\
    --prompt "Analyze Aristotle on motion and time" \\
    --strictness strict \\
    --primary "Aristotle:Physics" "Aristotle:De Anima" \\
    --secondary "Heidegger:Basic Concepts of Aristotelian Philosophy" \\
    --auto-sections \\
    --output prompt.tex
`);
}

// =============================================================================
// MAIN
// =============================================================================

function main(): void {
  const args = parseArgs();

  if (args.help) {
    printUsage();
    process.exit(0);
  }

  if (!args.prompt) {
    console.error('Error: --prompt is required. Use --help for usage.');
    process.exit(1);
  }

  // Build config
  let config: PromptBuilderConfig = {
    prompt: args.prompt,
    wordCount: args.wordCount,
    draftCategory: args.category as any,
    corpusFolder: args.corpusFolder,
    primarySources: args.primary,
    secondarySources: args.secondary,
    searchAll: true,
    strictness: { quotation: 'strict', citation: 'strict', unsupported_claims: 'strict' },
    includeValidationAppendix: !args.noAppendix,
    includeQualityGauntlet: !args.noGauntlet,
    outputFormat: args.format as any,
  };

  // Apply strictness preset
  if (args.strictness && STRICTNESS_PRESETS[args.strictness]) {
    config = applyStrictnessPreset(config, args.strictness);
  }

  // Load manual sections from JSON file
  if (args.sections) {
    try {
      const sectionsContent = fs.readFileSync(args.sections, 'utf-8');
      config.sections = JSON.parse(sectionsContent);
    } catch (err: any) {
      console.error(`Error reading sections file: ${err.message}`);
      process.exit(1);
    }
  }

  // Auto-generate sections if requested
  if (args.autoSections && (!config.sections || config.sections.length === 0)) {
    config.sections = generateDefaultSections(config.prompt, config.draftCategory);
  }

  // Build the prompt
  const result = buildPrompt(config);

  // Output
  if (args.output) {
    fs.writeFileSync(args.output, result.prompt, 'utf-8');
    console.log(`Prompt written to: ${args.output}`);
    console.log(`  Sections: ${result.metadata.sectionCount}`);
    console.log(`  Word count: ${result.metadata.wordCount}`);
    console.log(`  Primary sources: ${result.metadata.primarySourceCount}`);
    console.log(`  Secondary sources: ${result.metadata.secondarySourceCount}`);
    console.log(`  Strictness: ${JSON.stringify(result.strictness)}`);
  } else {
    // Output to stdout
    console.log(result.prompt);
  }
}

main();
