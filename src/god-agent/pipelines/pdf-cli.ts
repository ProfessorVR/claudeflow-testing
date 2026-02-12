#!/usr/bin/env node
/**
 * CLI for Hybrid PDF Analysis System
 * Integrates with Claude Code /god-pdf-analyze skill
 */

import { Command } from 'commander';
import { PDFAnalysisPipeline } from './pdf-analysis-pipeline.js';
import { AnalysisConfig, PipelineProgress } from './pdf-analysis-types.js';
import { promises as fs } from 'fs';
import { join } from 'path';
import chalk from 'chalk';

const program = new Command();

program
  .name('god-pdf-analyze')
  .description('Hybrid PDF Analysis System (Option 4 + 5)')
  .version('1.0.0');

// Progress indicator
function showProgress(progress: PipelineProgress): void {
  const bar = '='.repeat(Math.floor(progress.percentage / 2));
  const empty = ' '.repeat(50 - bar.length);
  console.log(chalk.blue(`[${bar}${empty}] ${progress.percentage.toFixed(0)}% - ${progress.message}`));
}

// Main analyze command
program
  .argument('<pdf-path>', 'Path to PDF file')
  .option('--auto', 'Auto mode (fully automated)')
  .option('--manual', 'Manual mode (complete control)')
  .option('--hybrid', 'Hybrid mode (AI + manual control) [default]')
  .option('--objective <text>', 'Analysis objective')
  .option('--pages-per-chunk <number>', 'Pages per chunk', '30')
  .option('--page-range <range>', 'Page range (e.g., "1-50,100-150")')
  .option('--skip-chunks <ids>', 'Skip chunk IDs (comma-separated)')
  .option('--review', 'Pause for review between steps')
  .option('--no-checkpoints', 'Disable checkpoint saving')
  .option('--use-corpus', 'Use corpus for context-aware analysis')
  .option('--collections <list>', 'Target collections (comma-separated, e.g., "theory,empirical")')
  .option('--context-chunks <number>', 'Number of corpus chunks to retrieve', '10')
  .option('--verbose', 'Verbose output')
  .action(async (pdfPath: string, options: any) => {
    try {
      // Determine mode
      let mode: 'auto' | 'manual' | 'hybrid' = 'hybrid';
      if (options.auto) mode = 'auto';
      if (options.manual) mode = 'manual';

      // Validate inputs
      if ((mode === 'auto' || mode === 'hybrid') && !options.objective) {
        console.error(chalk.red('Error: --objective is required for auto and hybrid modes'));
        process.exit(1);
      }

      // Check PDF exists
      try {
        await fs.access(pdfPath);
      } catch {
        console.error(chalk.red(`Error: PDF file not found: ${pdfPath}`));
        process.exit(1);
      }

      console.log(chalk.cyan(`\n📄 Hybrid PDF Analysis System\n`));
      console.log(chalk.gray(`Mode: ${mode.toUpperCase()}`));
      console.log(chalk.gray(`PDF: ${pdfPath}`));
      if (options.objective) console.log(chalk.gray(`Objective: ${options.objective}\n`));

      // Initialize pipeline
      const pipeline = new PDFAnalysisPipeline();
      pipeline.onProgress(showProgress);

      // Build config
      const config: Partial<AnalysisConfig> = {
        pagesPerChunk: parseInt(options.pagesPerChunk, 10),
        pageRange: options.pageRange,
        skipChunks: options.skipChunks ? options.skipChunks.split(',').map((n: string) => parseInt(n, 10)) : [],
        reviewBeforeAnalysis: options.review,
        saveCheckpoints: options.checkpoints !== false,
        useCorpus: options.useCorpus || false,
        contextChunks: options.contextChunks ? parseInt(options.contextChunks, 10) : 10,
        targetCollections: options.collections ? options.collections.split(',').map((c: string) => c.trim()) : [],
      };

      // Show corpus settings if enabled
      if (config.useCorpus) {
        console.log(chalk.gray(`Corpus: Enabled (${config.contextChunks} chunks)`));
        if (config.targetCollections && config.targetCollections.length > 0) {
          console.log(chalk.gray(`Collections: ${config.targetCollections.join(', ')}`));
        }
        console.log('');
      }

      // Execute based on mode
      let result;

      if (mode === 'auto') {
        result = await pipeline.auto(pdfPath, options.objective, config);
      } else if (mode === 'hybrid') {
        result = await pipeline.hybrid(pdfPath, options.objective, config);
      } else {
        // Manual mode - provide instructions
        console.log(chalk.yellow('\n📝 Manual Mode - Available Commands:\n'));
        console.log('  1. Preprocess:');
        console.log(chalk.gray(`     bash scripts/pdf/preprocess.sh "${pdfPath}" ./output\n`));
        console.log('  2. Analyze chunk:');
        console.log(chalk.gray(`     bash scripts/pdf/analyze-chunk.sh ./output/chunk_aa "your objective"\n`));
        console.log('  3. Synthesize:');
        console.log(chalk.gray(`     /god-ask "Synthesize findings from chunks..."\n`));
        return;
      }

      // Display results
      console.log(chalk.green(`\n✅ Analysis Complete!\n`));
      console.log(chalk.cyan(`📊 Results Summary:`));
      console.log(chalk.gray(`   Total chunks: ${result.totalChunks}`));
      console.log(chalk.gray(`   Analyzed: ${result.analyzedChunks}`));
      console.log(chalk.gray(`   Skipped: ${result.skippedChunks.length}`));
      console.log(chalk.gray(`   Mode: ${result.mode}\n`));

      // Save results
      const resultsDir = join('.pdf-analysis-results', pdfPath.replace(/\//g, '_'));
      await fs.mkdir(resultsDir, { recursive: true });
      const resultPath = join(resultsDir, `analysis-${Date.now()}.json`);
      await fs.writeFile(resultPath, JSON.stringify(result, null, 2));

      console.log(chalk.cyan(`💾 Results saved to: ${resultPath}\n`));

      // Show synthesis preview
      if (result.synthesis) {
        console.log(chalk.cyan(`📝 Synthesis Preview:`));
        const preview = result.synthesis.substring(0, 300);
        console.log(chalk.gray(preview + '...\n'));
      }

      console.log(chalk.green(`🎉 Done!\n`));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`));
      if (options.verbose && error instanceof Error && error.stack) {
        console.error(chalk.gray(error.stack));
      }
      process.exit(1);
    }
  });

// List checkpoints
program
  .command('list-checkpoints')
  .description('List available checkpoints')
  .action(async () => {
    const pipeline = new PDFAnalysisPipeline();
    const checkpoints = await pipeline.listCheckpoints();

    if (checkpoints.length === 0) {
      console.log(chalk.yellow('No checkpoints found.'));
      return;
    }

    console.log(chalk.cyan(`\n📍 Available Checkpoints:\n`));
    checkpoints.forEach((cp, i) => {
      console.log(chalk.white(`${i + 1}. ${cp.sessionId}`));
      console.log(chalk.gray(`   PDF: ${cp.pdfPath}`));
      console.log(chalk.gray(`   Objective: ${cp.objective}`));
      console.log(chalk.gray(`   Progress: ${cp.currentChunk + 1}/${cp.totalChunks} chunks`));
      console.log(chalk.gray(`   Mode: ${cp.mode}`));
      console.log(chalk.gray(`   Timestamp: ${cp.timestamp}\n`));
    });
  });

// Resume checkpoint
program
  .command('resume')
  .argument('<session-id>', 'Session ID to resume')
  .description('Resume from checkpoint')
  .action(async (sessionId: string) => {
    try {
      console.log(chalk.cyan(`\n🔄 Resuming session: ${sessionId}\n`));

      const pipeline = new PDFAnalysisPipeline();
      pipeline.onProgress(showProgress);

      const result = await pipeline.resume(sessionId);

      if (!result) {
        console.error(chalk.red('Error: Checkpoint not found or cannot be resumed.'));
        process.exit(1);
      }

      console.log(chalk.green(`\n✅ Resumed and completed!\n`));
      console.log(chalk.gray(`Results: ${JSON.stringify(result, null, 2)}\n`));
    } catch (error) {
      console.error(chalk.red(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}\n`));
      process.exit(1);
    }
  });

program.parse();
