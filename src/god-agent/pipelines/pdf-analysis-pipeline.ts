/**
 * Hybrid PDF Analysis Pipeline
 * Combines automated AI processing (Option 5) with manual control (Option 4)
 */

import { promises as fs } from 'fs';
import { join, dirname, basename } from 'path';
import { execSync } from 'child_process';
import {
  AnalysisConfig,
  AnalysisResult,
  AnalysisCheckpoint,
  Chunk,
  ChunkAnalysis,
  PDFMetadata,
  PreprocessOptions,
  ReviewableChunks,
  PipelineProgress,
} from './pdf-analysis-types.js';
import { SmartRetrievalLayer, type ContextChunk } from '../retrieval/index.js';

export class PDFAnalysisPipeline {
  private checkpointDir: string;
  private progressCallback?: (progress: PipelineProgress) => void;
  private retrieval: SmartRetrievalLayer;

  constructor(checkpointDir: string = './.pdf-analysis-checkpoints') {
    this.checkpointDir = checkpointDir;
    this.retrieval = new SmartRetrievalLayer();
  }

  /**
   * Set callback for progress updates
   */
  onProgress(callback: (progress: PipelineProgress) => void): void {
    this.progressCallback = callback;
  }

  private reportProgress(progress: PipelineProgress): void {
    if (this.progressCallback) {
      this.progressCallback(progress);
    }
  }

  /**
   * AUTO MODE: Fully automated analysis
   */
  async auto(pdfPath: string, objective: string, config?: Partial<AnalysisConfig>): Promise<AnalysisResult> {
    this.reportProgress({
      phase: 'preprocessing',
      totalChunks: 0,
      message: 'Starting automated analysis...',
      percentage: 0,
    });

    const fullConfig: AnalysisConfig = {
      mode: 'auto',
      objective,
      pagesPerChunk: config?.pagesPerChunk || 30,
      saveCheckpoints: config?.saveCheckpoints ?? true,
      ...config,
    };

    // Step 1: Preprocess
    const chunks = await this.preprocess(pdfPath, {
      pagesPerChunk: fullConfig.pagesPerChunk,
      verbose: false,
    });

    this.reportProgress({
      phase: 'preprocessing',
      totalChunks: chunks.length,
      message: `Preprocessed into ${chunks.length} chunks`,
      percentage: 10,
    });

    // Step 2: Analyze all chunks
    const analyses: ChunkAnalysis[] = [];
    for (let i = 0; i < chunks.length; i++) {
      this.reportProgress({
        phase: 'analysis',
        currentChunk: i,
        totalChunks: chunks.length,
        message: `Analyzing chunk ${i + 1}/${chunks.length}...`,
        percentage: 10 + (70 * (i / chunks.length)),
      });

      // Use corpus-aware analysis if enabled
      const analysis = fullConfig.useCorpus
        ? await this.analyzeChunkWithContext(chunks[i], objective, fullConfig, analyses)
        : await this.analyzeChunk(chunks[i], objective, analyses);
      analyses.push(analysis);

      // Save checkpoint
      if (fullConfig.saveCheckpoints) {
        await this.saveCheckpoint({
          sessionId: `auto-${Date.now()}`,
          pdfPath,
          objective,
          mode: 'auto',
          currentChunk: i,
          totalChunks: chunks.length,
          completedAnalyses: analyses,
          timestamp: new Date().toISOString(),
          canResume: true,
        });
      }
    }

    this.reportProgress({
      phase: 'synthesis',
      totalChunks: chunks.length,
      message: 'Synthesizing findings...',
      percentage: 85,
    });

    // Step 3: Synthesize
    const synthesis = await this.synthesize(analyses, objective);

    this.reportProgress({
      phase: 'complete',
      totalChunks: chunks.length,
      message: 'Analysis complete!',
      percentage: 100,
    });

    return {
      objective,
      pdfPath,
      totalChunks: chunks.length,
      analyzedChunks: analyses.length,
      skippedChunks: [],
      chunkAnalyses: analyses,
      synthesis,
      timestamp: new Date().toISOString(),
      mode: 'auto',
    };
  }

  /**
   * HYBRID MODE: AI automation with manual checkpoints
   */
  async hybrid(pdfPath: string, objective: string, config?: Partial<AnalysisConfig>): Promise<AnalysisResult> {
    const fullConfig: AnalysisConfig = {
      mode: 'hybrid',
      objective,
      pagesPerChunk: config?.pagesPerChunk || 30,
      reviewBeforeAnalysis: config?.reviewBeforeAnalysis ?? true,
      saveCheckpoints: config?.saveCheckpoints ?? true,
      skipChunks: config?.skipChunks || [],
      ...config,
    };

    this.reportProgress({
      phase: 'preprocessing',
      totalChunks: 0,
      message: 'Starting hybrid analysis...',
      percentage: 0,
    });

    // Step 1: Preprocess with review
    const reviewable = await this.preprocessWithReview(pdfPath, {
      pagesPerChunk: fullConfig.pagesPerChunk,
    });

    this.reportProgress({
      phase: 'preprocessing',
      totalChunks: reviewable.chunks.length,
      message: `Preprocessed into ${reviewable.chunks.length} chunks (review available)`,
      percentage: 10,
    });

    // Step 2: Analyze with overrides
    const skipList = fullConfig.skipChunks || [];
    const analyses = await this.analyzeWithOverride(
      reviewable.chunks,
      objective,
      skipList,
      fullConfig.saveCheckpoints ? pdfPath : undefined,
      fullConfig
    );

    this.reportProgress({
      phase: 'synthesis',
      totalChunks: reviewable.chunks.length,
      message: 'Synthesizing findings...',
      percentage: 85,
    });

    // Step 3: Synthesize with optional input
    const synthesis = await this.synthesizeWithInput(analyses, objective);

    this.reportProgress({
      phase: 'complete',
      totalChunks: reviewable.chunks.length,
      message: 'Hybrid analysis complete!',
      percentage: 100,
    });

    return {
      objective,
      pdfPath,
      totalChunks: reviewable.chunks.length,
      analyzedChunks: analyses.length,
      skippedChunks: skipList,
      chunkAnalyses: analyses,
      synthesis,
      timestamp: new Date().toISOString(),
      mode: 'hybrid',
    };
  }

  /**
   * MANUAL MODE: Complete control at each step
   */
  manual = {
    preprocess: async (pdfPath: string, options?: PreprocessOptions): Promise<Chunk[]> => {
      return this.preprocess(pdfPath, options);
    },

    analyzeChunk: async (chunk: Chunk, objective: string, context?: ChunkAnalysis[]): Promise<ChunkAnalysis> => {
      return this.analyzeChunk(chunk, objective, context);
    },

    synthesize: async (analyses: ChunkAnalysis[], objective: string, userNotes?: string): Promise<string> => {
      return this.synthesize(analyses, objective, userNotes);
    },
  };

  /**
   * Preprocess PDF into chunks
   */
  private async preprocess(pdfPath: string, options?: PreprocessOptions): Promise<Chunk[]> {
    const outputDir = options?.outputDir || join(dirname(pdfPath), '.pdf-chunks', basename(pdfPath, '.pdf'));
    const pagesPerChunk = options?.pagesPerChunk || 30;

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Run preprocessing script
    const scriptPath = join(process.cwd(), 'scripts/pdf/preprocess.sh');
    const cmd = `bash "${scriptPath}" "${pdfPath}" "${outputDir}" --pages-per-chunk ${pagesPerChunk}`;

    execSync(cmd, { stdio: options?.verbose ? 'inherit' : 'pipe' });

    // Load chunks
    return this.loadChunks(outputDir);
  }

  /**
   * Preprocess with AI review suggestions
   */
  private async preprocessWithReview(pdfPath: string, options?: PreprocessOptions): Promise<ReviewableChunks> {
    const chunks = await this.preprocess(pdfPath, options);
    const metadataPath = join(dirname(chunks[0].filename), '..', 'metadata.json');
    const metadata: PDFMetadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    // AI suggests which chunks to skip/prioritize
    const suggestions = this.suggestChunkStrategy(chunks, metadata);

    return {
      metadata,
      chunks,
      suggestions,
    };
  }

  /**
   * Analyze chunks with ability to skip specific ones
   */
  private async analyzeWithOverride(
    chunks: Chunk[],
    objective: string,
    skipList: number[],
    checkpointPath?: string,
    config?: AnalysisConfig
  ): Promise<ChunkAnalysis[]> {
    const analyses: ChunkAnalysis[] = [];

    for (let i = 0; i < chunks.length; i++) {
      if (skipList.includes(i)) {
        this.reportProgress({
          phase: 'analysis',
          currentChunk: i,
          totalChunks: chunks.length,
          message: `Skipping chunk ${i} (user override)`,
          percentage: 10 + (70 * (i / chunks.length)),
        });
        continue;
      }

      this.reportProgress({
        phase: 'analysis',
        currentChunk: i,
        totalChunks: chunks.length,
        message: `Analyzing chunk ${i + 1}/${chunks.length}...`,
        percentage: 10 + (70 * (i / chunks.length)),
      });

      // Use corpus-aware analysis if enabled and config provided
      const analysis = config && config.useCorpus
        ? await this.analyzeChunkWithContext(chunks[i], objective, config, analyses)
        : await this.analyzeChunk(chunks[i], objective, analyses);
      analyses.push(analysis);

      // Save checkpoint if path provided
      if (checkpointPath) {
        await this.saveCheckpoint({
          sessionId: `hybrid-${Date.now()}`,
          pdfPath: checkpointPath,
          objective,
          mode: 'hybrid',
          currentChunk: i,
          totalChunks: chunks.length,
          completedAnalyses: analyses,
          timestamp: new Date().toISOString(),
          canResume: true,
        });
      }
    }

    return analyses;
  }

  /**
   * Synthesize with optional user input
   */
  private async synthesizeWithInput(
    analyses: ChunkAnalysis[],
    objective: string,
    userNotes?: string
  ): Promise<string> {
    return this.synthesize(analyses, objective, userNotes);
  }

  /**
   * Load chunks from preprocessed directory
   */
  private async loadChunks(outputDir: string): Promise<Chunk[]> {
    const metadataPath = join(outputDir, 'metadata.json');
    const metadata: PDFMetadata = JSON.parse(await fs.readFile(metadataPath, 'utf-8'));

    const chunks: Chunk[] = [];
    for (const chunkMeta of metadata.chunks) {
      const chunkPath = join(outputDir, chunkMeta.filename);
      const content = await fs.readFile(chunkPath, 'utf-8');

      chunks.push({
        id: chunkMeta.chunk_id,
        filename: chunkPath,
        content,
        lines: chunkMeta.lines,
        estimatedPages: chunkMeta.estimated_pages,
        metadata: { ...chunkMeta },
      });
    }

    return chunks;
  }

  /**
   * Analyze chunk with corpus context (when useCorpus is enabled)
   */
  private async analyzeChunkWithContext(
    chunk: Chunk,
    objective: string,
    config: AnalysisConfig,
    previousAnalyses?: ChunkAnalysis[]
  ): Promise<ChunkAnalysis> {
    let corpusContext: ContextChunk[] = [];
    let corpusContextInfo = { used: false, chunkCount: 0, collections: [] as string[] };

    // Retrieve relevant context from corpus if enabled
    if (config.useCorpus) {
      try {
        const chunkPreview = chunk.content.slice(0, 500); // First 500 chars for context query
        corpusContext = await this.retrieval.retrieveContext(
          `${objective}\n\n${chunkPreview}`,
          {
            collections: config.targetCollections || [],
            maxChunks: config.contextChunks || 10,
            minRelevance: 0.75,
            diversityBoost: true,
            rerank: true,
          }
        );

        corpusContextInfo = {
          used: true,
          chunkCount: corpusContext.length,
          collections: config.targetCollections || [],
        };

        this.reportProgress({
          phase: 'analysis',
          currentChunk: chunk.id,
          totalChunks: 0,
          message: `📚 Retrieved ${corpusContext.length} context chunks from corpus`,
          percentage: 0,
        });
      } catch (error) {
        console.warn(`Warning: Failed to retrieve corpus context: ${error}`);
        // Continue without corpus context (graceful degradation)
      }
    }

    // Build enriched prompt with corpus context
    const prompt = this.buildEnrichedPrompt(chunk, objective, corpusContext, previousAnalyses);

    // This would call the God Agent - for now, return mock structure
    // In real implementation, use: npx tsx src/god-agent/universal/cli.ts ask
    const analysis = `[Analysis of chunk ${chunk.id} with ${corpusContext.length} corpus chunks would go here - integrate with God Agent CLI]`;
    const keyFindings = [
      `Finding 1 from chunk ${chunk.id}`,
      `Finding 2 from chunk ${chunk.id}`,
      `Finding 3 from chunk ${chunk.id}`,
    ];

    return {
      chunkId: chunk.id,
      filename: chunk.filename,
      analysis,
      keyFindings,
      timestamp: new Date().toISOString(),
      corpusContext: corpusContextInfo,
    };
  }

  /**
   * Build enriched prompt with corpus context
   */
  private buildEnrichedPrompt(
    chunk: Chunk,
    objective: string,
    corpusContext: ContextChunk[],
    previousAnalyses?: ChunkAnalysis[]
  ): string {
    let prompt = `Analyze this PDF chunk with the following objective: ${objective}\n\n`;

    // Add corpus context if available
    if (corpusContext.length > 0) {
      prompt += `RELEVANT CONTEXT FROM CORPUS:\n`;
      corpusContext.forEach((ctx, i) => {
        prompt += `\n[${i + 1}] ${ctx.metadata.author} (${ctx.metadata.year}), p.${ctx.metadata.page_start}\n`;
        prompt += `Collection: ${ctx.metadata.collection}\n`;
        prompt += `Relevance: ${ctx.relevanceScore.toFixed(2)}\n`;
        prompt += `${ctx.content.slice(0, 400)}...\n`;
      });
      prompt += `\n`;
    }

    // Add context from previous chunks
    if (previousAnalyses && previousAnalyses.length > 0) {
      const recentContext = previousAnalyses.slice(-2); // Last 2 chunks for context
      prompt += `Context from previous chunks:\n`;
      recentContext.forEach((prev) => {
        prompt += `- Chunk ${prev.chunkId}: ${prev.keyFindings.join(', ')}\n`;
      });
      prompt += `\n`;
    }

    prompt += `Chunk ${chunk.id} (Pages ${chunk.estimatedPages})\n\n`;
    prompt += `CHUNK TO ANALYZE:\n${chunk.content}\n\n`;
    prompt += `Please provide:\n`;
    prompt += `1. A concise analysis focusing on the objective\n`;
    prompt += `2. Key findings (3-5 bullet points)\n`;
    prompt += `3. Any important quotes or data\n`;

    if (corpusContext.length > 0) {
      prompt += `4. How this chunk relates to the corpus context provided above\n`;
    }

    return prompt;
  }

  /**
   * Analyze a single chunk with context from previous analyses
   */
  private async analyzeChunk(chunk: Chunk, objective: string, previousAnalyses?: ChunkAnalysis[]): Promise<ChunkAnalysis> {
    // Build context from previous chunks
    let contextPrompt = '';
    if (previousAnalyses && previousAnalyses.length > 0) {
      const recentContext = previousAnalyses.slice(-2); // Last 2 chunks for context
      contextPrompt = '\n\nContext from previous chunks:\n';
      recentContext.forEach((prev) => {
        contextPrompt += `- Chunk ${prev.chunkId}: ${prev.keyFindings.join(', ')}\n`;
      });
    }

    const prompt = `Analyze this PDF chunk with the following objective: ${objective}

Chunk ${chunk.id} (Pages ${chunk.estimatedPages})${contextPrompt}

CHUNK CONTENT:
${chunk.content}

Please provide:
1. A concise analysis focusing on the objective
2. Key findings (3-5 bullet points)
3. Any important quotes or data`;

    // This would call the God Agent - for now, return mock structure
    // In real implementation, use: npx tsx src/god-agent/universal/cli.ts ask
    const analysis = `[Analysis of chunk ${chunk.id} would go here - integrate with God Agent CLI]`;
    const keyFindings = [
      `Finding 1 from chunk ${chunk.id}`,
      `Finding 2 from chunk ${chunk.id}`,
      `Finding 3 from chunk ${chunk.id}`,
    ];

    return {
      chunkId: chunk.id,
      filename: chunk.filename,
      analysis,
      keyFindings,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Synthesize all chunk analyses into final result
   */
  private async synthesize(analyses: ChunkAnalysis[], objective: string, userNotes?: string): Promise<string> {
    const allFindings = analyses.flatMap((a) => a.keyFindings);

    let synthesisPrompt = `Synthesize the following PDF analysis into a comprehensive summary.

Objective: ${objective}
Total chunks analyzed: ${analyses.length}

Key findings across all chunks:
${allFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}`;

    if (userNotes) {
      synthesisPrompt += `\n\nUser notes to incorporate:\n${userNotes}`;
    }

    synthesisPrompt += '\n\nProvide a well-structured synthesis that addresses the objective.';

    // This would call the God Agent - for now, return mock
    return `[Comprehensive synthesis of ${analyses.length} chunks would go here - integrate with God Agent CLI]`;
  }

  /**
   * AI suggests chunk strategy
   */
  private suggestChunkStrategy(chunks: Chunk[], metadata: PDFMetadata): ReviewableChunks['suggestions'] {
    // Simple heuristic: skip very short chunks, prioritize middle chunks
    const skip: number[] = [];
    const priority: number[] = [];

    chunks.forEach((chunk, i) => {
      if (chunk.lines < 50) {
        skip.push(i);
      } else if (i > chunks.length / 3 && i < (2 * chunks.length) / 3) {
        priority.push(i);
      }
    });

    return {
      skip,
      priority,
      reason: skip.length > 0
        ? `Suggested skipping ${skip.length} very short chunks. Prioritizing middle sections.`
        : 'All chunks contain substantial content.',
    };
  }

  /**
   * Save checkpoint for resuming
   */
  private async saveCheckpoint(checkpoint: AnalysisCheckpoint): Promise<void> {
    await fs.mkdir(this.checkpointDir, { recursive: true });
    const checkpointPath = join(this.checkpointDir, `${checkpoint.sessionId}.json`);
    await fs.writeFile(checkpointPath, JSON.stringify(checkpoint, null, 2));
  }

  /**
   * Load checkpoint
   */
  async loadCheckpoint(sessionId: string): Promise<AnalysisCheckpoint | null> {
    try {
      const checkpointPath = join(this.checkpointDir, `${sessionId}.json`);
      const data = await fs.readFile(checkpointPath, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Resume from checkpoint
   */
  async resume(sessionId: string): Promise<AnalysisResult | null> {
    const checkpoint = await this.loadCheckpoint(sessionId);
    if (!checkpoint || !checkpoint.canResume) {
      return null;
    }

    // Resume based on mode
    if (checkpoint.mode === 'auto') {
      return this.auto(checkpoint.pdfPath, checkpoint.objective, {
        saveCheckpoints: true,
      });
    } else if (checkpoint.mode === 'hybrid') {
      return this.hybrid(checkpoint.pdfPath, checkpoint.objective, {
        saveCheckpoints: true,
      });
    }

    return null;
  }

  /**
   * List available checkpoints
   */
  async listCheckpoints(): Promise<AnalysisCheckpoint[]> {
    try {
      const files = await fs.readdir(this.checkpointDir);
      const checkpoints: AnalysisCheckpoint[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(join(this.checkpointDir, file), 'utf-8');
          checkpoints.push(JSON.parse(data));
        }
      }

      return checkpoints.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch {
      return [];
    }
  }
}
