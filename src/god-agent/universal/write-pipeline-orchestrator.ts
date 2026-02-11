/**
 * WritePipelineOrchestrator - Write pipeline, corpus integration, and content generation
 *
 * Extracted from UniversalAgent (Phase 4c, SEAM-1).
 * Contains write(), corpus helpers, generation helpers, and content pipeline.
 */

import type { SmartRetrievalLayer, ContextChunk, RetrievalOptions } from '../retrieval/index.js';
import type { QualityIntegration, QualityValidationOptions, QualityValidationResult } from './quality-integration.js';
import type { ProseSanitizer, SanitizationResult, ArtifactViolation } from '../cli/composition/prose-sanitizer.js';
import type { StyleProfileManager, StoredStyleProfile } from './style-profile.js';
import type { StyleCharacteristics } from './style-analyzer.js';
import type { TrajectoryBridge } from './trajectory-bridge.js';
import type { IEmbeddingProvider } from '../core/memory/types.js';
import type { InteractionStore } from './interaction-store.js';
import type {
  IWritingGenerator,
  CorpusConstraint,
  CitationBudgetResult,
  InlineGenerationResult,
  GenerationUnit,
  CorpusSource,
  CorpusRetriever,
  InlineGenerationConfig,
  ValidationResult,
  EnforcementResult,
} from '../core/writing/index.js';
import {
  AnthropicWritingGenerator,
  buildCorpusConstraint,
  loadCorpusManifest,
  calculateCitationBudget,
  quickBudgetCheck,
  CitationValidator,
  createValidatorFromChunks,
  CitationEnforcer,
  createEnforcerFromChunks,
  InlineValidationOrchestrator,
  createInlineValidationOrchestrator,
} from '../core/writing/index.js';
import {
  compositionOrchestrator,
  type ChapterOutline,
  type CompositionResult,
} from '../cli/composition/synthesis/composition-orchestrator.js';
import {
  generateEndnotes,
  type EndnoteGenerationResult,
  type EndnoteGeneratorConfig,
  type CorpusSearchFn,
} from '../cli/quality/endnote-generator.js';
import { ProvenanceLedger } from '../cli/quality/provenance-ledger.js';
import {
  getSourceVerificationLayer,
  type VerificationSummary,
  type AcquisitionSuggestion,
} from '../cli/quality/source-verification-layer.js';
import {
  MissingSourceAcquisitionLayer,
  getMissingSourceAcquisitionLayer,
  type AcquisitionResult,
} from '../cli/quality/missing-source-acquisition.js';
import { scrubNonCorpusAuthors, buildCorpusSourcesFromChunks } from './author-scrubber.js';
import { estimateQuality, assessQuality, type QualityInteraction } from './quality-estimator.js';
import type { AgentMode, WriteResult, TaskExecutionResult, IWriteTaskPreparation } from './universal-agent.js';
import type { IAgentSelectionResult } from '../core/agents/index.js';
import { ClaudeCodeExecutor, type ICodeExecutionRequest } from '../core/executor/index.js';

export interface WritePipelineDeps {
  smartRetrieval: SmartRetrievalLayer | null;
  qualityIntegration: QualityIntegration | null;
  proseSanitizer: ProseSanitizer;
  styleProfileManager: StyleProfileManager | undefined;
  trajectoryBridge: TrajectoryBridge | null;
  writingGenerator: IWritingGenerator | null;
  interactionStore: InteractionStore;
  config: {
    verbose: boolean;
    autoLearn: boolean;
    autoStoreThreshold: number;
  };
  log: (...args: unknown[]) => void;
  ensureInitialized: () => Promise<void>;
  embed: (text: string) => Promise<Float32Array>;
  generateId: () => string;
  injectDESCEpisodes: (
    description: string,
    context?: { command?: string; mode?: AgentMode }
  ) => Promise<{ augmentedPrompt: string }>;
  storeDESCEpisode: (
    input: string,
    output: string,
    metadata?: { command?: string; mode?: AgentMode; quality?: number }
  ) => Promise<void>;
  maybeStorePattern: (entry: { content: string; type: string; domain: string; tags: string[] }) => Promise<unknown>;
  retrieveRelevant: (query: string, mode: AgentMode, k?: number) => Promise<unknown[]>;
  extractTags: (text: string) => string[];
  executeTaskDefault: (
    agentSelection: { selection: IAgentSelectionResult; prompt: string; context?: string },
    taskExecutionFn?: (agentType: string, prompt: string, options?: { timeout?: number }) => Promise<string>,
    options?: { trajectoryId?: string; forceExecute?: boolean }
  ) => Promise<TaskExecutionResult>;
}

export class WritePipelineOrchestrator {
  constructor(private deps: WritePipelineDeps) {}

  // ===== Corpus Constraint Prompt Builder =====

  private buildCorpusConstraintPromptText(constraint: CorpusConstraint): string {
    if (constraint.sources.length === 0) {
      return '';
    }

    const isStrict = constraint.enforcement === 'strict';
    const placeholder = constraint.missingCitationPlaceholder || '[CITATION NEEDED]';

    // Group sources by type
    const primarySources: typeof constraint.sources = [];
    const secondarySources: typeof constraint.sources = [];

    for (const source of constraint.sources) {
      const isPrimary =
        source.author.includes('Aristotle') ||
        source.author.includes('Heidegger') ||
        source.author.includes('Plato') ||
        source.title.includes('De Anima') ||
        source.title.includes('Being and Time') ||
        source.title.includes('Rhetoric');

      if (isPrimary) {
        primarySources.push(source);
      } else {
        secondarySources.push(source);
      }
    }

    let prompt = `
## CORPUS-ONLY CITATION CONSTRAINT (${isStrict ? 'MANDATORY' : 'RECOMMENDED'})

You may ${isStrict ? 'ONLY' : 'preferably'} cite from the following verified sources:`;

    if (primarySources.length > 0) {
      prompt += `

### Primary Sources
${primarySources.map(s => `- ${s.author} (${s.year > 0 ? s.year : 'c. ' + Math.abs(s.year) + ' BCE'}). "${s.title}"${s.pages ? ` [Pages: ${s.pages}]` : ''}${s.citationKey ? ` — Cite as: (${s.citationKey})` : ''}`).join('\n')}`;
    }

    if (secondarySources.length > 0) {
      prompt += `

### Secondary Scholarship
${secondarySources.map(s => `- ${s.author} (${s.year}). "${s.title}"${s.pages ? ` [Pages: ${s.pages}]` : ''}${s.citationKey ? ` — Cite as: (${s.citationKey})` : ''}`).join('\n')}`;
    }

    prompt += `

### Citation Rules (MANDATORY — ZERO TOLERANCE FOR EXTERNAL SOURCES)
1. **EVERY citation MUST include page numbers**: Use format (Author Year, p. X) or (Author Year, pp. X-Y)
2. ${isStrict ? '**ABSOLUTE RULE: Do NOT cite, reference, discuss, or mention ANY scholar not in the list above.** This includes authors you know from your training data. If an author is not listed above, they do not exist for this task.' : 'Prefer citations from this list'}
3. ${isStrict ? 'Do NOT fabricate page numbers - only cite pages from corpus chunks you have access to' : 'Use verified page numbers when available'}
4. Do NOT combine authors who do not co-author in this list
5. Do NOT cite works by listed authors other than those specified above (e.g., if "Gross, Uncomfortable Situations" is listed, do NOT cite "Gross, Secret History of Emotion")
6. ${isStrict ? 'If a corpus chunk MENTIONS another scholar (e.g., "Modrak argues..."), do NOT cite that scholar — cite the AUTHOR of the chunk instead (e.g., cite O\'Gorman who wrote the chunk, not Modrak who is discussed in it)' : 'If you need a source not listed, write "' + placeholder + '" instead of fabricating'}
7. If you cannot determine the page number, write "[PAGE NEEDED]" after the citation
8. ${isStrict ? '**ANY mention of a non-listed author will cause automatic rejection.** Do not write "As X argues" or "X\'s account" unless X is in the list above.' : ''}

### Citation Format Examples
- Direct quote: "quoted text" (Frede 1992, p. 283)
- Paraphrase: As Frede argues (1992, pp. 280-285), phantasia...
- Multiple pages: (Heidegger 1927, pp. 134-137)
- Primary source: (Aristotle, De Anima, 427b14-16)

${isStrict ? '**Citations without page numbers will be flagged and may result in rejection. References to non-listed authors will be stripped from the output.**' : 'Unverified citations will be flagged for review.'}`;

    return prompt;
  }

  // ===== Corpus Context Block Builder =====

  private buildCorpusContextBlock(chunks: ContextChunk[]): string {
    if (chunks.length === 0) return '';

    // Group chunks by source for readability
    const bySource = new Map<string, ContextChunk[]>();
    for (const chunk of chunks) {
      const key = `${chunk.metadata.author} - ${chunk.metadata.title} (${chunk.metadata.year})`;
      if (!bySource.has(key)) bySource.set(key, []);
      bySource.get(key)!.push(chunk);
    }

    let block = `\n## CORPUS SOURCE MATERIAL\n\nThe following are excerpts from the ingested scholarly corpus (OCR-processed). You MUST ground your citations in this material.\n\n**IMPORTANT instructions for using these chunks:**\n- These chunks are raw OCR output and may contain formatting artifacts (running headers, page numbers, line breaks, author names at page tops, etc.)\n- When citing, paraphrase the scholarly content in your own words and cite with (Author Year, p. X)\n- When directly quoting, extract ONLY the meaningful scholarly text — strip out OCR artifacts like page headers, running titles, or stray numbers\n- Never quote raw OCR artifacts like "JOHN SMITH 30 The following..." — instead quote the actual content: "The following..."\n- Use the page numbers from the [Chunk N] metadata, not numbers found within the OCR text\n`;

    let chunkNumber = 1;
    let totalChars = block.length;
    const MAX_CHARS = 60000; // ~15K tokens budget for corpus context

    for (const [sourceKey, sourceChunks] of bySource) {
      const header = `\n### ${sourceKey}\n`;
      totalChars += header.length;
      if (totalChars > MAX_CHARS) break;
      block += header;

      for (const chunk of sourceChunks) {
        const pages = chunk.metadata.page_start === chunk.metadata.page_end
          ? `p. ${chunk.metadata.page_start}`
          : `pp. ${chunk.metadata.page_start}-${chunk.metadata.page_end}`;
        const entry = `\n**[Chunk ${chunkNumber}]** (${pages}):\n${chunk.content}\n`;
        totalChars += entry.length;
        if (totalChars > MAX_CHARS) {
          block += `\n*[Remaining chunks truncated to stay within context budget]*\n`;
          return block;
        }
        block += entry;
        chunkNumber++;
      }
    }

    block += `\n---\n**Total corpus chunks provided: ${chunkNumber - 1}**\n`;
    return block;
  }

  // ===== Claude Code Generation =====

  private async generateViaClaudeCode(prompt: string, options?: {
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
  }): Promise<string> {
    const { execFile } = await import('child_process');
    const { promisify } = await import('util');
    const execFileAsync = promisify(execFile);

    const args = ['-p', '--no-input'];
    if (options?.model) args.push('--model', options.model);
    if (options?.systemPrompt) args.push('--system-prompt', options.systemPrompt);
    // --allowedTools "" disables all tools (pure text generation)
    args.push('--allowedTools', '');
    args.push(prompt);

    try {
      const { stdout } = await execFileAsync('claude', args, {
        maxBuffer: 10 * 1024 * 1024,  // 10MB
        timeout: 300000,  // 5 min
        env: { ...process.env },
      });
      return stdout.trim();
    } catch (error: any) {
      // If claude CLI not found, fall back to direct API
      if (error.code === 'ENOENT') {
        this.deps.log('claude CLI not found, falling back to Anthropic API...');
        return this.generateViaAnthropicAPI(prompt, options);
      }
      throw error;
    }
  }

  // ===== Anthropic API Generation =====

  private async generateViaAnthropicAPI(prompt: string, options?: {
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
  }): Promise<string> {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Neither claude CLI nor ANTHROPIC_API_KEY available for generation');
    }
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    const client = new Anthropic({ apiKey });
    const messages: Array<{ role: 'user'; content: string }> = [{ role: 'user', content: prompt }];
    const response = await client.messages.create({
      model: options?.model || 'claude-sonnet-4-20250514',
      max_tokens: options?.maxTokens || 8192,
      ...(options?.systemPrompt ? { system: options.systemPrompt } : {}),
      messages,
    });
    return response.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n\n');
  }

  // ===== Mock Academic Content =====

  private generateMockAcademicContent(
    topic: string,
    style: string,
    length: string,
    corpusChunks: ContextChunk[]
  ): string {
    const wordCounts = {
      short: 500,
      medium: 1000,
      long: 2000,
      comprehensive: 2500,
    };
    const targetWords = wordCounts[length as keyof typeof wordCounts] || 1000;

    // Build content with corpus citations if available
    let content = `# ${topic}\n\n`;

    if (corpusChunks.length > 0) {
      content += `## Introduction\n\n`;
      content += `This section examines ${topic.toLowerCase()}, drawing on recent scholarship and theoretical frameworks. `;
      content += `Building on the work of ${corpusChunks[0]?.metadata.author || 'key scholars'} (${corpusChunks[0]?.metadata.year || '2020'}), `;
      content += `we explore the conceptual foundations and implications of this topic.\n\n`;

      content += `## Theoretical Framework\n\n`;
      content += corpusChunks.slice(0, 3).map((chunk, i) => {
        return `${chunk.content.slice(0, 200)}... (${chunk.metadata.author}, ${chunk.metadata.year}, p.${chunk.metadata.page_start})`;
      }).join('\n\n');

      content += `\n\n## Analysis\n\n`;
      content += `The literature reveals multiple perspectives on ${topic.toLowerCase()}. `;
    } else {
      content += `This section provides a comprehensive examination of ${topic.toLowerCase()}. `;
    }

    // Pad to target word count
    const currentWords = content.split(/\s+/).length;
    if (currentWords < targetWords) {
      const fillerParagraph = `Furthermore, this analysis considers the broader implications and contextual factors that shape our understanding. ` +
        `The theoretical underpinnings draw from multiple disciplinary perspectives, including philosophical, empirical, and applied approaches. ` +
        `Each perspective contributes unique insights that enrich our comprehensive understanding of the phenomenon. `;

      const paragraphsNeeded = Math.ceil((targetWords - currentWords) / fillerParagraph.split(/\s+/).length);
      for (let i = 0; i < paragraphsNeeded; i++) {
        content += `\n\n${fillerParagraph}`;
      }
    }

    content += `\n\n## Conclusion\n\n`;
    content += `This examination of ${topic.toLowerCase()} demonstrates the complexity and significance of the topic. `;
    content += `Future research should continue to explore these dimensions in greater depth.`;

    return content;
  }

  // ===== Writing Instructions Builder =====

  private buildWritingInstructions(
    style: 'academic' | 'professional' | 'casual' | 'technical',
    format: 'essay' | 'report' | 'article' | 'paper',
    length: 'short' | 'medium' | 'long' | 'comprehensive',
    stylePrompt: string | null
  ): string {
    const lengthGuide: Record<string, string> = {
      short: '500-800 words',
      medium: '1000-2000 words',
      long: '2500-4000 words',
      comprehensive: '5000+ words with sections',
    };

    const styleGuide: Record<string, string> = {
      academic: 'formal tone, citations where appropriate, objective analysis',
      professional: 'clear and concise, business-appropriate, actionable insights',
      casual: 'conversational tone, engaging, accessible language',
      technical: 'precise terminology, detailed explanations, code examples where relevant',
    };

    const formatGuide: Record<string, string> = {
      essay: 'introduction, body paragraphs with clear thesis, conclusion',
      report: 'executive summary, findings, analysis, recommendations',
      article: 'headline, lead paragraph, supporting sections, conclusion',
      paper: 'abstract, introduction, methodology, results, discussion, conclusion',
    };

    let instructions = `## Writing Instructions

**Style**: ${style} - ${styleGuide[style]}
**Format**: ${format} - ${formatGuide[format]}
**Length**: ${length} - ${lengthGuide[length]}`;

    if (stylePrompt) {
      instructions += `\n\n## Style Profile\n${stylePrompt}`;
    }

    return instructions;
  }

  // ===== Pipeline Detection =====

  private isPipelineWritingTask(topic: string, format: string): boolean {
    // Complex document formats that benefit from pipeline
    const complexFormats = ['paper', 'report'];
    if (complexFormats.includes(format)) {
      // Check for complexity indicators in topic
      const complexityIndicators = [
        /dissertation/i,
        /thesis/i,
        /multi.chapter/i,
        /comprehensive.*research/i,
        /full.*analysis/i,
        /in.depth.*study/i,
        /complete.*guide/i,
      ];
      if (complexityIndicators.some(pattern => pattern.test(topic))) {
        return true;
      }
    }

    // Long-form content indicators
    const longFormIndicators = [
      /book/i,
      /manuscript/i,
      /whitepaper/i,
      /research.*paper/i,
    ];
    return longFormIndicators.some(pattern => pattern.test(topic));
  }

  // ===== Key Points Extraction =====

  private extractKeyPointsFromTopic(topic: string): string[] {
    // Try to extract numbered or bulleted lists
    const numberedPattern = /^\d+\.\s+(.+)$/gm;
    const bulletPattern = /^[•\-\*]\s+(.+)$/gm;

    const numberedMatches = Array.from(topic.matchAll(numberedPattern));
    if (numberedMatches.length > 0) {
      return numberedMatches.map(m => m[1].trim()).slice(0, 5);
    }

    const bulletMatches = Array.from(topic.matchAll(bulletPattern));
    if (bulletMatches.length > 0) {
      return bulletMatches.map(m => m[1].trim()).slice(0, 5);
    }

    // Split by sentences and take first 3-5 as key points
    const sentences = topic.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    if (sentences.length >= 2) {
      return sentences.slice(0, Math.min(5, sentences.length));
    }

    // Fallback: generate generic key points from topic
    return [
      `Understanding the core concepts of ${topic}`,
      `Analyzing the implications and applications`,
      `Synthesizing the key findings and conclusions`,
    ];
  }

  // ===== Main Write Pipeline =====

  async write(topic: string, options: {
    style?: 'academic' | 'professional' | 'casual' | 'technical';
    length?: 'short' | 'medium' | 'long' | 'comprehensive';
    format?: 'essay' | 'report' | 'article' | 'paper';
    /** Use a specific learned style profile by ID */
    styleProfileId?: string;
    /** Use the currently active style profile (default: true if one is set) */
    useActiveStyleProfile?: boolean;
    /** Phase 3: Use corpus for source-grounded content generation */
    useCorpus?: boolean;
    /** Phase 3: Target specific corpus collections */
    corpusCollections?: string[];
    /** Phase 3: Number of corpus chunks to retrieve (default: 15) */
    corpusChunkCount?: number;
    /** Phase 3: Minimum relevance for corpus chunks (default: 0.75) */
    corpusMinRelevance?: number;
    /** Phase 5: Use staged composition system (auto-detected for chapters/sections) */
    useStagedComposition?: boolean;
    /** Phase 5: Chapter outline for staged composition */
    chapterOutline?: ChapterOutline;
    /** Force direct execution, bypassing pipeline detection (for testing) */
    forceExecute?: boolean;
    /** Enable endnote generation with supporting quotations (requires useCorpus) */
    enableEndnotes?: boolean;
    /** Maximum supporting quotations per endnote (default: 3) */
    maxQuotationsPerEndnote?: number;
    /** Minimum relevance threshold for endnote quotations (default: 0.65) */
    minEndnoteRelevance?: number;
    /** Source Verification: Verify all citations exist in corpus */
    verifySources?: boolean;
    /** Source Acquisition: Automatically acquire missing sources */
    acquireMissing?: boolean;
    /** Download directory for acquired sources (default: ./corpus/downloads) */
    downloadDir?: string;
    /** Citation Enforcement: Mode for hallucination prevention (default: 'auto-correct') */
    citationEnforcementMode?: 'strict' | 'auto-correct' | 'warn';
    /** Citation Enforcement: Minimum pass rate for citations (default: 0.85) */
    citationMinPassRate?: number;
    /** Citation Enforcement: Maximum hallucinations allowed (default: 3) */
    citationMaxHallucinations?: number;
    /** Phase 11: Use inline validation during generation (prevents hallucinations DURING generation, not after) */
    useInlineValidation?: boolean;
    /** Phase 11: Inline validation strictness level (default: 'moderate') */
    inlineValidationStrictness?: 'strict' | 'moderate' | 'lenient';
    /** Phase 11: Maximum retry attempts per paragraph (default: 3) */
    inlineMaxRetriesPerUnit?: number;
    /** Phase 11: Enable citation lookup tool-use during generation (default: true) */
    inlineEnableCitationLookup?: boolean;
    /** Phase 11: Minimum corpus chunks required to auto-enable inline validation (default: 3) */
    inlineMinChunks?: number;
    /** Data source mode: 'corpus' = retrieved chunks only, 'hybrid' = chunks + manifest, 'external' = no constraint */
    dataSourceMode?: 'corpus' | 'hybrid' | 'external';
  } = {}): Promise<WriteResult> {
    await this.deps.ensureInitialized();

    // Fix 27: Resolve data source mode and enforce corpus-only invariants
    const dataSourceMode = options.dataSourceMode ?? 'hybrid';
    const resolved = { ...options };

    if (dataSourceMode === 'corpus') {
      // Hard error on explicit invariant violations (catches UI bugs early)
      if (resolved.acquireMissing) {
        throw new Error(
          'Corpus-only mode forbids acquireMissing. ' +
          'Set dataSourceMode to "hybrid" or "external" to acquire missing sources.'
        );
      }

      // Force corpus-only invariants for unspecified options
      resolved.useCorpus = true;
      resolved.acquireMissing = false;
      resolved.verifySources = true;
      resolved.citationEnforcementMode = 'strict';
      resolved.citationMaxHallucinations = 0;

      this.deps.log(`🔒 Corpus-only mode: enforcing strict citation constraints`);
    }

    // Apply resolved options so all downstream code uses enforced values
    options = resolved;

    // DESC: Inject prior solutions before processing (RULE-010: window size 3)
    const descResult = await this.deps.injectDESCEpisodes(topic, { command: 'god-write', mode: 'write' });
    const augmentedTopic = descResult.augmentedPrompt;

    // Fix 10: Skip DAI-001 agent selection for write() — it picks wrong agents
    // (e.g., system-designer for academic topics) and injects irrelevant instructions.
    // Instead, build a clean write-specific prompt from writing instructions + topic.
    const style = options.style ?? 'professional';
    const length = options.length ?? 'medium';
    const format = options.format ?? 'article';

    // Get style prompt from learned profile if available
    let stylePrompt: string | null = null;
    if (this.deps.styleProfileManager) {
      if (options.styleProfileId) {
        stylePrompt = this.deps.styleProfileManager.generateStylePrompt(options.styleProfileId);
      } else if (options.useActiveStyleProfile !== false) {
        stylePrompt = this.deps.styleProfileManager.generateStylePrompt();
      }
    }

    // Build writing instructions with style, format, length, and style profile
    const writingInstructions = this.buildWritingInstructions(style, format, length, stylePrompt);

    // Build clean prompt: writing instructions + topic only (no agent selection noise)
    const writePrompt = `${writingInstructions}\n\n## Topic\n${augmentedTopic}`;

    // Wrap in agentSelection-like structure for compatibility with downstream code
    const agentSelection = {
      selection: {
        selected: { key: 'academic-writer', category: 'writing' },
        candidates: [],
        analysis: { taskType: 'write' },
      },
      prompt: writePrompt,
      context: undefined as string | undefined,
    };
    this.deps.log(`write() prompt built: style=${style}, format=${format}, length=${length}, styleProfile=${!!stylePrompt}`);

    // Create trajectory for learning (FR-11)
    let trajectoryId: string | undefined;
    if (this.deps.trajectoryBridge) {
      try {
        const embedding = await this.deps.embed(topic);
        const trajectory = await this.deps.trajectoryBridge.createTrajectoryFromInteraction(
          topic, 'write', embedding
        );
        trajectoryId = trajectory.trajectoryId;
      } catch (error) {
        this.deps.log(`Warning: Trajectory creation failed in write(): ${error}`);
      }
    }

    // Get relevant knowledge (existing InteractionStore)
    const knowledge = await this.deps.retrieveRelevant(topic, 'write');

    // Phase 3: Retrieve corpus context if enabled
    let corpusChunks: ContextChunk[] = [];
    let corpusContextInfo = {
      used: false,
      chunkCount: 0,
      collections: [] as string[],
      citations: [] as string[],
    };

    if (options.useCorpus) {
      try {
        this.deps.log('Retrieving corpus context for source-grounded generation...');
        corpusChunks = await this.deps.smartRetrieval!.retrieveContext(topic, {
          collections: options.corpusCollections || [],
          maxChunks: options.corpusChunkCount ?? 15,
          minRelevance: options.corpusMinRelevance ?? 0.75,
          diversityBoost: true,
          rerank: true,
        });

        // Build citation list
        const citations = corpusChunks.map(chunk =>
          `${chunk.metadata.author} (${chunk.metadata.year}), p.${chunk.metadata.page_start}`
        );

        corpusContextInfo = {
          used: true,
          chunkCount: corpusChunks.length,
          collections: options.corpusCollections || [],
          citations: Array.from(new Set(citations)), // Deduplicate
        };

        this.deps.log(`📚 Retrieved ${corpusChunks.length} corpus chunks from corpus`);
      } catch (error) {
        this.deps.log(`Warning: Corpus retrieval failed: ${error}`);
        // Continue without corpus (graceful degradation)
      }
    }

    // Phase 1: Build corpus constraint for hallucination prevention
    // This creates an explicit whitelist of sources that the LLM can cite
    let corpusConstraint: CorpusConstraint | undefined;
    if (corpusChunks.length > 0) {
      try {
        // Fix 26: Mode-aware whitelist construction.
        // corpus-only: whitelist = retrieved chunks ONLY (no manifest widening)
        // hybrid: whitelist = retrieved chunks + collection-filtered manifest
        // external: no constraint
        const additionalSources = dataSourceMode === 'corpus'
          ? []
          : await loadCorpusManifest({
              collections: options.corpusCollections?.length ? options.corpusCollections : undefined,
            });

        corpusConstraint = buildCorpusConstraint(corpusChunks, {
          enforcement: 'strict',
          missingCitationPlaceholder: '[CITATION NEEDED]',
          minRelevance: 0.5,
          additionalSources,
        });

        this.deps.log(`🔒 Corpus constraint built: ${corpusConstraint.sources.length} verified sources`);

        // Inject corpus constraint into the agent prompt
        // This is CRITICAL for preventing hallucinations
        const constraintPrompt = this.buildCorpusConstraintPromptText(corpusConstraint);

        // Inject actual corpus chunk TEXT so the agent has source material to cite from.
        // This is what enables verbatim quotations and grounded claims.
        const corpusContextBlock = this.buildCorpusContextBlock(corpusChunks);

        agentSelection.prompt = `${agentSelection.prompt}\n\n${constraintPrompt}\n\n${corpusContextBlock}`;
        this.deps.log(`🔒 Corpus constraint + ${corpusChunks.length} chunk texts injected into agent prompt`);
      } catch (error) {
        this.deps.log(`Warning: Failed to build corpus constraint: ${error}`);
        // Continue without constraint (less optimal but functional)
      }
    }

    // Phase 5: Citation Budget Check (pre-generation)
    // Verify we have enough corpus sources to support target word count
    let citationBudgetResult: CitationBudgetResult | undefined;
    if (corpusChunks.length > 0) {
      try {
        // Estimate target word count based on length parameter
        const targetWords = length === 'comprehensive' ? 3500 :
                           length === 'long' ? 2500 :
                           length === 'medium' ? 1500 : 800;

        citationBudgetResult = calculateCitationBudget(corpusChunks, {
          targetWords,
          documentType: format === 'paper' ? 'dissertation' : 'paper',
        });

        if (citationBudgetResult.sufficient) {
          this.deps.log(`📊 Citation budget: ${citationBudgetResult.maxSupportableCitations} citations available for ${targetWords} words ✓`);
        } else {
          this.deps.log(`⚠️ Citation budget warning: ${citationBudgetResult.warning}`);
          // Log recommendations
          for (const rec of citationBudgetResult.recommendations.slice(0, 2)) {
            this.deps.log(`   → ${rec}`);
          }
        }
      } catch (error) {
        this.deps.log(`Warning: Citation budget check failed: ${error}`);
        // Continue without budget check (graceful degradation)
      }
    }

    // Fix 28: Fail-fast on insufficient corpus chunks in corpus-only mode.
    // Prevents "write 1500 words with 3 chunks → hallucinate citations" failure mode.
    if (dataSourceMode === 'corpus') {
      const minByLength: Record<string, number> = {
        short: 4,
        medium: 8,
        long: 14,
        comprehensive: 20,
      };

      // If user explicitly set corpusChunkCount, trust their judgment as an override
      const lengthKey = options.length ?? 'medium';
      const minRequired = options.corpusChunkCount ?? minByLength[lengthKey] ?? 8;
      const actualChunks = corpusChunks.length;

      if (actualChunks < minRequired) {
        throw new Error(
          `Corpus-only mode requires at least ${minRequired} chunks for length="${lengthKey}"; ` +
          `got ${actualChunks}. Options:\n` +
          `  - Broaden collections (current: ${(options.corpusCollections || []).join(', ') || 'all'})\n` +
          `  - Lower --corpus-relevance (current: ${options.corpusMinRelevance ?? 0.75})\n` +
          `  - Reduce --length\n` +
          `  - Set --corpus-chunks ${actualChunks} to explicitly accept low coverage`
        );
      }

      this.deps.log(`✓ Corpus coverage check: ${actualChunks} chunks >= ${minRequired} required for length="${lengthKey}"`);
    }

    // =========================================================================
    // Phase 11: INLINE VALIDATION - Prevent hallucinations DURING generation
    // This is the NEW approach that validates citations paragraph-by-paragraph
    // as content is generated, rather than fixing them POST-HOC
    // =========================================================================
    let inlineValidationResult: InlineGenerationResult | undefined;
    let usedInlineValidation = false;

    // Inline validation: auto-enable when sufficient corpus context exists
    // Precedence: explicit user option > auto-enable based on corpus availability
    const minChunksForInline = options.inlineMinChunks ?? 3;
    const hasUsableCorpus = corpusChunks.length >= minChunksForInline;
    const uniqueSources = new Set(corpusChunks.map(c => c.metadata?.author ?? c.metadata?.source_id ?? 'unknown')).size;
    const shouldUseInlineValidation = options.useInlineValidation ?? hasUsableCorpus;

    // Log activation decision for debuggability
    const inlineReason = options.useInlineValidation === false
      ? 'user opt-out'
      : options.useInlineValidation === true
        ? 'user opt-in'
        : hasUsableCorpus
          ? `auto (chunks=${corpusChunks.length} >= ${minChunksForInline}, sources=${uniqueSources})`
          : `auto-skip (chunks=${corpusChunks.length} < ${minChunksForInline})`;
    this.deps.log(`[InlineValidation] ${shouldUseInlineValidation && hasUsableCorpus ? 'ON' : 'OFF'} (${inlineReason}${options.forceExecute ? ', forceExecute override' : ''})`);
    this.deps.log( `[write() pipeline] InlineValidation=${shouldUseInlineValidation && hasUsableCorpus ? 'ON' : 'OFF'} (${inlineReason})`);

    if (shouldUseInlineValidation && hasUsableCorpus && !options.forceExecute) {
      try {
        this.deps.log('🔬 Phase 11: Using inline validation for hallucination prevention DURING generation...');
        this.deps.log( '[write() pipeline] Entering inline validation...');
        usedInlineValidation = true;

        // Build corpus sources from chunks
        const corpusSources: CorpusSource[] = buildCorpusSourcesFromChunks(corpusChunks);

        // Create retriever function for citation lookup
        const retriever: CorpusRetriever = async (query: string, opts: { maxChunks: number; minRelevance: number }) => {
          return this.deps.smartRetrieval!.retrieveContext(query, {
            maxChunks: opts.maxChunks,
            minRelevance: opts.minRelevance,
            collections: options.corpusCollections || [],
          });
        };

        // Get style prompt if available
        let stylePrompt: string | undefined;
        if (this.deps.styleProfileManager) {
          if (options.styleProfileId) {
            stylePrompt = this.deps.styleProfileManager.generateStylePrompt(options.styleProfileId) ?? undefined;
          } else if (options.useActiveStyleProfile !== false) {
            stylePrompt = this.deps.styleProfileManager.generateStylePrompt() ?? undefined;
          }
        }

        // Create inline validation orchestrator with Claude Code CLI generation
        const inlineGenerateFn = async (prompt: string, systemPrompt: string) => {
          return this.generateViaClaudeCode(prompt, { model: 'sonnet', systemPrompt });
        };
        const orchestrator = createInlineValidationOrchestrator(
          inlineGenerateFn,
          retriever,
          corpusChunks,
          corpusSources,
          {
            maxRetriesPerUnit: options.inlineMaxRetriesPerUnit ?? 3,
            validationStrictness: options.inlineValidationStrictness ?? 'moderate',
            enableCitationLookupTool: options.inlineEnableCitationLookup ?? true,
            // CCV Tier 1 enabled by default in orchestrator constructor;
            // env var CCV_TIER1_ACTIVE=false|0 can override
            model: 'claude-sonnet-4-20250514',
            temperature: 0.7,
            maxTokensPerUnit: 1500,
            stylePrompt,
          }
        );

        // Build outline from topic
        const targetWords = length === 'comprehensive' ? 3500 :
                           length === 'long' ? 2500 :
                           length === 'medium' ? 1500 : 800;
        const wordsPerSection = Math.floor(targetWords / 5); // ~5 sections

        const outline = InlineValidationOrchestrator.createBasicOutline(
          topic,
          this.extractKeyPointsFromTopic(topic),
          wordsPerSection
        );

        this.deps.log(`🔬 Inline generation: ${outline.length} units, ~${wordsPerSection} words each`);

        // Generate with inline validation
        inlineValidationResult = await orchestrator.generateWithInlineValidation(
          topic,
          outline,
          agentSelection.prompt // Include agent context as system prompt
        );

        this.deps.log(
          `🔬 Inline validation complete: ${inlineValidationResult.stats.passedFirstAttempt}/${inlineValidationResult.stats.totalUnits} passed first attempt, ` +
          `${inlineValidationResult.stats.passedAfterRetry} after retry, ${inlineValidationResult.stats.failed} failed, ` +
          `quality=${(inlineValidationResult.qualityScore * 100).toFixed(1)}%`
        );

        // If inline validation produced content, skip regular execution
        if (inlineValidationResult.document.length > 0) {
          // Skip to the return, but first do prose sanitization and other post-processing
        }
      } catch (error) {
        this.deps.log( `[write() pipeline] Inline validation FAILED: ${error}`);
        this.deps.log(`Warning: Inline validation failed, falling back to regular execution: ${error}`);
        usedInlineValidation = false;
        inlineValidationResult = undefined;
        // Continue with regular execution (graceful degradation)
      }
    }

    // Initialize content variable
    let content: string;

    // If inline validation was successful, use that content
    if (usedInlineValidation && inlineValidationResult && inlineValidationResult.document.length > 0) {
      content = inlineValidationResult.document;
      this.deps.log( `[write() pipeline] Using INLINE VALIDATION content (${content.split(/\s+/).length} words)`);
      this.deps.log(`Using inline-validated content (${content.split(/\s+/).length} words)`);
    } else {
      this.deps.log( `[write() pipeline] Using DIRECT API path (inline=${usedInlineValidation}, docLen=${inlineValidationResult?.document?.length ?? 'N/A'})`);
      // Direct LLM execution for write() with --execute flag.
      // Uses Anthropic API directly instead of executeTaskDefault() which returns [TASK_QUEUED].
      // This ensures the full pipeline (corpus constraint, quality gauntlet, enforcement) runs
      // on actual generated content, not a task placeholder.

      if (options.forceExecute) {
        // FORCE_EXECUTE: Generate mock content for testing
        const mockContent = this.generateMockAcademicContent(topic, style, length, corpusChunks);
        this.deps.log('FORCE_EXECUTE: Generated mock content for testing', {
          wordCount: mockContent.split(/\s+/).length,
          style,
          length
        });
        content = mockContent;
      } else {
        // Generate via Claude Code CLI (uses Claude subscription, not API key)
        try {
          this.deps.log('write() direct execution: Generating via Claude Code CLI...');
          this.deps.log( '[write() pipeline] Claude Code execution: starting...');

          content = await this.generateViaClaudeCode(agentSelection.prompt, {
            model: 'sonnet',
          });

          this.deps.log(`write() Claude Code execution: Got ${content.split(/\s+/).length} words`);
          this.deps.log( `[write() pipeline] Claude Code execution: Got ${content.split(/\s+/).length} words`);
        } catch (apiError) {
          this.deps.log(`write() Claude Code execution failed: ${apiError}, falling back to task queuing`);
          this.deps.log( `[write() pipeline] Claude Code execution FAILED: ${apiError}`);

          // Fallback: try executeTaskDefault (will return [TASK_QUEUED] but at least won't crash)
          const executionResult = await this.deps.executeTaskDefault(agentSelection, undefined, {
            trajectoryId,
            forceExecute: options.forceExecute
          });
          content = executionResult.success ? executionResult.result : agentSelection.prompt;
        }
      }
    }

    // Phase A: Prose Sanitization - Remove research artifacts for publication-ready output
    // Target: 100% clean rate (zero tolerance for artifacts like Q1:, Confidence:, [SYNTHESIS NEEDED])
    let sanitizationResult: SanitizationResult | undefined;
    try {
      this.deps.log('Phase A: Running prose sanitization...');
      sanitizationResult = await this.deps.proseSanitizer.sanitize(content);

      // Replace content with sanitized version
      content = sanitizationResult.sanitized;

      if (sanitizationResult.artifactCount > 0) {
        this.deps.log(
          `Prose sanitization: removed ${sanitizationResult.artifactCount} artifacts, ` +
          `cleanRate=${(sanitizationResult.cleanRate * 100).toFixed(1)}%`
        );

        // Log specific violations for debugging
        for (const violation of sanitizationResult.violations.slice(0, 5)) {
          this.deps.log(`  - Removed "${violation.text}" at line ${violation.line}`);
        }
        if (sanitizationResult.violations.length > 5) {
          this.deps.log(`  ... and ${sanitizationResult.violations.length - 5} more`);
        }
      } else {
        this.deps.log('Prose sanitization: content is artifact-free');
      }
    } catch (error) {
      this.deps.log(`Warning: Prose sanitization failed, using original content: ${error}`);
      // Continue without sanitization (graceful degradation)
    }

    // Quality Gauntlet: Validate and revise content if needed (0.85 threshold, up to 3 iterations)
    let qualityValidation: QualityValidationResult | undefined;
    this.deps.log( `[write() pipeline] Quality gauntlet: qualityIntegration=${!!this.deps.qualityIntegration}`);
    if (this.deps.qualityIntegration) {
      try {
        this.deps.log( '[write() pipeline] Running quality gauntlet...');
        this.deps.log('Running quality gauntlet validation...');
        qualityValidation = await this.deps.qualityIntegration.validateAndRevise(content, {
          topic,
          style,
          format,
          trajectoryId,
          enabled: true, // Always enabled for god-write
          corpusChunks: corpusChunks.length > 0 ? corpusChunks : undefined,
          knownAuthors: corpusConstraint?.allowedSources?.map((s: any) => s.author).filter(Boolean) ?? [],
        });

        // Use validated/revised content
        content = qualityValidation.content;

        this.deps.log(
          `Quality gauntlet complete: score=${qualityValidation.qualityScore.toFixed(2)}, ` +
          `passed=${qualityValidation.passed}, revisions=${qualityValidation.revisionIterations}`
        );
      } catch (error) {
        this.deps.log( `[write() pipeline] Quality gauntlet FAILED: ${error}`);
        this.deps.log(`Warning: Quality validation failed, using original content: ${error}`);
      }
    }

    // Phase 2 & 4: Citation Validation and Enforcement (post-generation)
    // This catches and corrects any hallucinated citations that slipped through
    let citationEnforcementResult: EnforcementResult | undefined;
    this.deps.log( `[write() pipeline] Citation enforcement: corpusConstraint=${!!corpusConstraint}, chunks=${corpusChunks.length}`);
    if (corpusConstraint && corpusChunks.length > 0) {
      try {
        this.deps.log( '[write() pipeline] Running citation enforcement...');
        this.deps.log('🔍 Phase 2/4: Running citation enforcement...');

        // Create enforcer from corpus constraint with configurable options
        const enforcer = new CitationEnforcer(corpusConstraint, {
          mode: options.citationEnforcementMode || 'auto-correct',  // Configurable enforcement mode
          minPassRate: options.citationMinPassRate ?? 0.85,          // Configurable minimum pass rate
          maxHallucinations: options.citationMaxHallucinations ?? 3, // Configurable max hallucinations
          placeholder: '',  // Fix 19: Remove hallucinated citations entirely instead of leaving [CITATION NEEDED] markers
          includeReport: true,
        }, corpusChunks); // Phase 7: Enable quotation fidelity validation

        // Enforce citations on generated content
        citationEnforcementResult = await enforcer.enforce(content);

        if (citationEnforcementResult.action === 'pass') {
          this.deps.log(`✅ Citation enforcement: All ${citationEnforcementResult.validation.totalCitations} citations verified`);
        } else if (citationEnforcementResult.action === 'corrected') {
          this.deps.log(
            `🔧 Citation enforcement: Corrected ${citationEnforcementResult.correctionsCount} citations, ` +
            `pass rate ${(citationEnforcementResult.validation.passRate * 100).toFixed(1)}%`
          );
          // Use corrected content
          content = citationEnforcementResult.content;
        } else if (citationEnforcementResult.action === 'warning') {
          this.deps.log(
            `⚠️ Citation enforcement warning: ${citationEnforcementResult.validation.hallucinated.length} ` +
            `hallucinated citations detected`
          );
          // Keep content but log warnings
          for (const h of citationEnforcementResult.validation.hallucinated.slice(0, 3)) {
            this.deps.log(`   - Line ${h.citation.line}: "${h.citation.raw}" - ${h.reason}`);
          }
        } else if (citationEnforcementResult.action === 'rejected') {
          this.deps.log(`❌ Citation enforcement: Content rejected due to excessive hallucinations`);
          // In production, might want to regenerate or flag for human review
        }
      } catch (error) {
        this.deps.log(`Warning: Citation enforcement failed: ${error}`);
        // Continue without enforcement (graceful degradation)
      }
    }

    // Fix 18: Second sanitizer pass after citation enforcement
    // Citation enforcement may insert markers or leave artifacts that need cleanup
    if (citationEnforcementResult && citationEnforcementResult.action !== 'pass') {
      try {
        const postEnforcementSanitize = await this.deps.proseSanitizer.sanitize(content);
        if (postEnforcementSanitize.artifactCount > 0) {
          content = postEnforcementSanitize.sanitized;
          this.deps.log(`Post-enforcement sanitization: removed ${postEnforcementSanitize.artifactCount} additional artifacts`);
        }
      } catch (error) {
        this.deps.log(`Warning: Post-enforcement sanitization failed: ${error}`);
      }
    }

    // Fix 25/30: Post-enforcement non-corpus author scrubbing
    // Final safety net: remove any remaining references to non-corpus authors
    // that slipped through inline validation and citation enforcement.
    // In corpus-only mode, this is fail-closed (throws instead of silently scrubbing).
    if (corpusConstraint && corpusConstraint.sources.length > 0) {
      try {
        const scrubResult = scrubNonCorpusAuthors(content, corpusConstraint);
        if (scrubResult.removedCount > 0) {
          if (dataSourceMode === 'corpus') {
            // Corpus-only: fail-closed with diagnostic report
            const report = scrubResult.removedAuthors
              .slice(0, 3)
              .map(name => {
                const snippets = scrubResult.contexts[name]?.slice(0, 2).join('; ') || 'context unavailable';
                return `  - "${name}" (${snippets})`;
              })
              .join('\n');

            throw new Error(
              `Corpus-only mode: ${scrubResult.removedCount} non-corpus author reference(s) detected after enforcement.\n` +
              `Authors found:\n${report}\n` +
              `This indicates insufficient corpus coverage. Options:\n` +
              `  - Increase --corpus-chunks to retrieve more source material\n` +
              `  - Lower --corpus-relevance to broaden retrieval\n` +
              `  - Reduce --length to require less content`
            );
          } else {
            // Hybrid/external: scrub silently (existing behavior)
            content = scrubResult.content;
            this.deps.log(`🧹 Author scrub: removed ${scrubResult.removedCount} non-corpus author references (${scrubResult.removedAuthors.join(', ')})`);
          }
        }
      } catch (error) {
        // Re-throw corpus-only mode errors; swallow scrubber failures in other modes
        if (error instanceof Error && error.message.startsWith('Corpus-only mode:')) throw error;
        this.deps.log(`Warning: Non-corpus author scrubbing failed: ${error}`);
      }
    }

    // Phase 5: Staged Composition System Integration
    // Auto-detect if staged composition should be used
    let compositionMetadata: {
      used: boolean;
      succeeded?: boolean;
      wordCount?: number;
      qualityScore?: number;
      processingTime?: number;
    } = { used: false };

    const shouldUseStagedComposition =
      options.useStagedComposition ||
      (options.chapterOutline !== undefined) ||
      (format === 'paper' && length === 'comprehensive') ||
      /chapter|section/i.test(topic);

    if (shouldUseStagedComposition && !options.forceExecute) {
      try {
        this.deps.log('Phase 5: Using staged composition system...');

        let compositionResult: CompositionResult;

        if (options.chapterOutline) {
          // User provided explicit chapter outline
          compositionResult = await compositionOrchestrator.composeChapter(
            options.chapterOutline,
            true // verbose
          );
        } else {
          // Auto-generate simple outline from topic
          const keyPoints = this.extractKeyPointsFromTopic(topic);
          compositionResult = await compositionOrchestrator.composeSimple(
            topic,
            keyPoints,
            {
              chapterNumber: 1,
              purpose: `Generate ${format} on ${topic}`,
              evidenceType: style === 'academic' ? 'theoretical' : 'analytical',
              verbose: true,
            }
          );
        }

        if (compositionResult.succeeded) {
          // Use composed content
          content = compositionResult.prose;
          compositionMetadata = {
            used: true,
            succeeded: true,
            wordCount: compositionResult.metadata.wordCount,
            qualityScore: compositionResult.metadata.qualityScore,
            processingTime: compositionResult.metadata.processingTime,
          };

          this.deps.log(
            `Staged composition complete: ` +
            `wordCount=${compositionMetadata.wordCount}, ` +
            `quality=${compositionMetadata.qualityScore?.toFixed(2)}`
          );
        } else {
          // Composition failed, keep original content
          compositionMetadata = { used: true, succeeded: false };
          this.deps.log('Staged composition failed, using original content');
        }
      } catch (error) {
        this.deps.log(`Warning: Staged composition failed: ${error}`);
        compositionMetadata = { used: true, succeeded: false };
        // Continue with original content (graceful degradation)
      }
    }

    // Endnote Generation: Add supporting quotations from corpus
    let endnotesMetadata: {
      generated: boolean;
      count: number;
      supportingQuotationsCount: number;
      enhancedContent?: string;
      endnotesSection?: string;
    } = { generated: false, count: 0, supportingQuotationsCount: 0 };

    if (options.enableEndnotes && corpusContextInfo.used && this.deps.smartRetrieval) {
      try {
        this.deps.log('Generating endnotes with supporting quotations...');

        // Create corpus search function using smart retrieval layer
        const corpusSearch: CorpusSearchFn = async (query: string, limit: number) => {
          const chunks = await this.deps.smartRetrieval!.retrieveContext(query, {
            maxChunks: limit,
            collections: corpusContextInfo.collections,
            minRelevance: 0.65,
          });

          return chunks.map(chunk => ({
            id: chunk.id,
            text: chunk.text,
            metadata: {
              author: chunk.metadata?.author,
              title: chunk.metadata?.title,
              year: chunk.metadata?.year,
              pageRef: chunk.metadata?.pageRef,
              docId: chunk.metadata?.docId,
            },
            score: chunk.relevance,
          }));
        };

        // Create provenance ledger for tracking
        const provenanceLedger = new ProvenanceLedger();

        // Generate endnotes
        const endnoteConfig: Partial<EndnoteGeneratorConfig> = {
          maxQuotationsPerEndnote: options.maxQuotationsPerEndnote ?? 3,
          minRelevanceThreshold: options.minEndnoteRelevance ?? 0.65,
          includeSameSource: true,
          includeDifferentSources: true,
          maxQuotationLength: 500,
          formatStyle: 'numeric',
          generateInlineMarkers: true,
        };

        const endnoteResult = await generateEndnotes(content, corpusSearch, {
          config: endnoteConfig,
          provenanceLedger,
        });

        // Update content with endnotes
        if (endnoteResult.endnotes.length > 0) {
          content = endnoteResult.contentWithMarkers + '\n\n' + endnoteResult.endnotesSection;
          endnotesMetadata = {
            generated: true,
            count: endnoteResult.stats.totalEndnotes,
            supportingQuotationsCount: endnoteResult.stats.totalSupportingQuotations,
            enhancedContent: endnoteResult.contentWithMarkers,
            endnotesSection: endnoteResult.endnotesSection,
          };

          this.deps.log(
            `Endnotes generated: ${endnotesMetadata.count} endnotes, ` +
            `${endnotesMetadata.supportingQuotationsCount} supporting quotations`
          );
        } else {
          this.deps.log('No endnotes generated (no citations found)');
        }
      } catch (error) {
        this.deps.log(`Warning: Endnote generation failed: ${error}`);
        // Continue with original content (graceful degradation)
      }
    }

    // Source Verification and Acquisition (post-generation hook)
    let sourceVerificationResult: {
      verified: boolean;
      summary?: VerificationSummary;
      acquisitionResults?: AcquisitionResult[];
    } = { verified: false };

    if (options.verifySources) {
      try {
        this.deps.log('Verifying sources against corpus...');
        const sourceVerifier = getSourceVerificationLayer();
        const extractedCitations = sourceVerifier.extractCitations(content);
        const verificationSummary = await sourceVerifier.verifyCitationsAgainstCorpus(extractedCitations);

        sourceVerificationResult.verified = true;
        sourceVerificationResult.summary = verificationSummary;

        this.deps.log(
          `Source verification complete: ${verificationSummary.foundInCorpus}/${verificationSummary.totalCitations} ` +
          `found in corpus, ${verificationSummary.missingFromCorpus} missing`
        );

        // Automatic source acquisition if enabled and sources are missing
        if (options.acquireMissing && verificationSummary.missingFromCorpus > 0) {
          this.deps.log('Acquiring missing sources...');
          const acquisitionLayer = getMissingSourceAcquisitionLayer();

          // Configure download directory if provided
          if (options.downloadDir) {
            // Create new instance with custom config
            const customAcquisitionLayer = new MissingSourceAcquisitionLayer({
              downloadDir: options.downloadDir,
              autoDownload: true,
              verbose: true,
            });
            sourceVerificationResult.acquisitionResults = await customAcquisitionLayer.acquireSources(
              verificationSummary.missingSources
            );
          } else {
            sourceVerificationResult.acquisitionResults = await acquisitionLayer.acquireSources(
              verificationSummary.missingSources
            );
          }

          const downloaded = sourceVerificationResult.acquisitionResults.filter(r => r.status === 'downloaded').length;
          const linkProvided = sourceVerificationResult.acquisitionResults.filter(r => r.status === 'link_provided').length;

          this.deps.log(
            `Source acquisition complete: ${downloaded} downloaded, ${linkProvided} links provided`
          );
        }
      } catch (error) {
        this.deps.log(`Warning: Source verification failed: ${error}`);
        // Continue without verification (graceful degradation)
      }
    }

    // Store successful writing patterns
    await this.deps.maybeStorePattern({
      content: `${format} on ${topic}`,
      type: 'example',
      domain: 'writing',
      tags: [style, format, ...this.deps.extractTags(topic)],
    });

    // Auto-feedback if trajectory exists (FR-11)
    // Use quality gauntlet score if available, otherwise estimate
    let writeQuality = qualityValidation?.qualityScore ?? 0.7;
    if (!qualityValidation && this.deps.config.autoLearn) {
      writeQuality = estimateQuality({
        id: trajectoryId ?? 'unknown',
        mode: 'write',
        input: topic,
        output: content,
        timestamp: Date.now(),
      });
    }

    if (this.deps.config.autoLearn && this.deps.trajectoryBridge && trajectoryId) {
      if (writeQuality >= this.deps.config.autoStoreThreshold) {
        try {
          await this.deps.trajectoryBridge.submitFeedback(trajectoryId, writeQuality, { implicit: true });
          this.deps.log(`Write auto-feedback: quality=${writeQuality.toFixed(2)}`);
        } catch (error) {
          this.deps.log(`Warning: Write auto-feedback failed: ${error}`);
        }
      }
    }

    // DESC: Store episode for future learning (non-blocking)
    this.deps.storeDESCEpisode(topic, content, {
      command: 'god-write',
      mode: 'write',
      quality: writeQuality,
    }).catch(err => this.deps.log(`DESC: Background storage error: ${err}`));

    return {
      topic,
      content,
      style,
      sources: knowledge.map(k => (k as { id?: string }).id ?? ''),
      wordCount: content.split(/\s+/).length,
      trajectoryId,
      // Include quality metrics if validation was performed
      qualityMetrics: qualityValidation?.metrics,
      qualityScore: qualityValidation?.qualityScore,
      revisionIterations: qualityValidation?.revisionIterations ?? 0,
      // Phase 3: Include corpus context information
      corpusContext: corpusContextInfo.used ? corpusContextInfo : undefined,
      // Phase 5: Include staged composition metadata
      stagedComposition: compositionMetadata.used ? compositionMetadata : undefined,
      // Include endnotes metadata if generated
      endnotes: endnotesMetadata.generated ? endnotesMetadata : undefined,
      // Include source verification results if performed
      sourceVerification: sourceVerificationResult.verified ? {
        verified: true,
        totalCitations: sourceVerificationResult.summary?.totalCitations ?? 0,
        foundInCorpus: sourceVerificationResult.summary?.foundInCorpus ?? 0,
        missingFromCorpus: sourceVerificationResult.summary?.missingFromCorpus ?? 0,
        missingSources: (sourceVerificationResult.summary?.missingSources ?? []).map(s => ({
          author: s.author,
          title: s.title,
          type: s.type,
        })),
        acquisitionResults: sourceVerificationResult.acquisitionResults?.map(r => ({
          source: r.source,
          status: r.status,
          downloadPath: r.downloadPath,
          accessUrls: r.accessUrls,
        })),
      } : undefined,
      // Phase A: Include prose sanitization results
      proseSanitization: sanitizationResult ? {
        sanitized: true,
        artifactsRemoved: sanitizationResult.artifactCount,
        cleanRate: sanitizationResult.cleanRate,
        violations: sanitizationResult.violations.map(v => ({
          type: v.type,
          text: v.text,
          line: v.line,
        })),
      } : undefined,
      // Phase 2/4: Citation enforcement results
      citationEnforcement: citationEnforcementResult ? {
        action: citationEnforcementResult.action,
        totalCitations: citationEnforcementResult.validation.totalCitations,
        validCitations: citationEnforcementResult.validation.valid.length,
        hallucinatedCitations: citationEnforcementResult.validation.hallucinated.length,
        correctionsMade: citationEnforcementResult.correctionsCount,
        missingPageNumbers: citationEnforcementResult.missingPageNumbersCount,
        passRate: citationEnforcementResult.validation.passRate,
        report: citationEnforcementResult.report,
      } : undefined,
      // Phase 5: Citation budget results
      citationBudget: citationBudgetResult ? {
        expectedCitations: citationBudgetResult.expectedCitations,
        maxSupportableCitations: citationBudgetResult.maxSupportableCitations,
        deficit: citationBudgetResult.deficit,
        sufficient: citationBudgetResult.sufficient,
        warning: citationBudgetResult.warning,
      } : undefined,
      // Phase 11: Inline validation results
      inlineValidation: usedInlineValidation && inlineValidationResult ? {
        used: true,
        allPassed: inlineValidationResult.allPassed,
        qualityScore: inlineValidationResult.qualityScore,
        totalUnits: inlineValidationResult.stats.totalUnits,
        passedFirstAttempt: inlineValidationResult.stats.passedFirstAttempt,
        passedAfterRetry: inlineValidationResult.stats.passedAfterRetry,
        failedUnits: inlineValidationResult.stats.failed,
        totalAttempts: inlineValidationResult.stats.totalAttempts,
        avgAttemptsPerUnit: inlineValidationResult.stats.avgAttemptsPerUnit,
        failedUnitDetails: inlineValidationResult.failedUnits.map(f => ({
          type: f.unit.type,
          intent: f.unit.intent,
          lastScore: f.lastValidationResult.overallScore,
          issues: f.lastValidationResult.issues.map(i => i.message),
        })),
      } : undefined,
    };
  }

}
