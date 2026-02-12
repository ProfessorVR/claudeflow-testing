/**
 * Anthropic Writing Generator (SPEC-WRT-001)
 *
 * LLM-based writing generation using Anthropic's Claude API.
 * Integrates with TIER-2.1 Intelligent Model Router for cost/quality tracking.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { IWritingGenerator, IWriteRequest, IWriteResult, RegionalTransformationMetadata, CorpusConstraint, CorpusSource } from './writing-generator.js';
import type { StyleProfileManager } from '../../universal/style-profile.js';
import { SpellingTransformer } from '../../universal/spelling-transformer.js';
import { GrammarTransformer } from '../../universal/grammar-transformer.js';
import type { RegionalSettings } from '../../universal/style-analyzer.js';

// TIER-2.1: Intelligent Model Router imports
import {
  getBudgetEnforcer,
  getCostTracker,
  getQualityScorer,
  recordCompletedRequest,
  type TaskType,
  type Complexity,
} from '../router/index.js';

/**
 * Configuration options for AnthropicWritingGenerator
 */
export interface IWritingGeneratorConfig {
  /** Enable router cost/quality tracking (default: true) */
  enableRouterTracking?: boolean;
  /** Block on budget exceeded (default: false - continue with warning) */
  blockOnBudgetExceeded?: boolean;
  /** Model to use (default: claude-3-5-sonnet-20241022) */
  model?: string;
  /** Verbose logging */
  verbose?: boolean;
}

export class AnthropicWritingGenerator implements IWritingGenerator {
  private client: Anthropic;
  private styleManager?: StyleProfileManager;
  private model: string;
  private config: Required<IWritingGeneratorConfig>;

  constructor(apiKey?: string, styleManager?: StyleProfileManager, config?: IWritingGeneratorConfig) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error(
        'ANTHROPIC_API_KEY not configured. Set environment variable or pass to constructor.'
      );
    }
    this.client = new Anthropic({ apiKey: key });
    this.styleManager = styleManager;
    this.model = config?.model ?? 'claude-3-5-sonnet-20241022';
    this.config = {
      enableRouterTracking: config?.enableRouterTracking ?? true,
      blockOnBudgetExceeded: config?.blockOnBudgetExceeded ?? false,
      model: this.model,
      verbose: config?.verbose ?? false,
    };
  }

  async generate(request: IWriteRequest): Promise<IWriteResult> {
    const startTime = Date.now();

    // TIER-2.1: Check budget before execution
    if (this.config.enableRouterTracking) {
      const budgetCheck = this.checkBudget();
      if (!budgetCheck.allowed) {
        if (this.config.blockOnBudgetExceeded) {
          throw new Error(`Budget exceeded: ${budgetCheck.reason}`);
        }
        if (this.config.verbose) {
          console.warn(`[WritingGenerator] Budget warning: ${budgetCheck.reason}`);
        }
      }
    }

    // Build system prompt with style
    const systemPrompt = await this.buildSystemPrompt(request);

    // Build user prompt
    const userPrompt = this.buildUserPrompt(request);

    // Generate content
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: this.estimateTokens(request.maxLength || 2000),
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    let content = this.extractContent(response);
    const latencyMs = Date.now() - startTime;

    // Apply regional transformations if style profile has regional settings
    let regionalTransformations: RegionalTransformationMetadata | undefined;
    if (request.style && this.styleManager) {
      const profile = await this.styleManager.getProfile(request.style);
      if (profile?.characteristics.regional) {
        const transformResult = this.applyRegionalTransformations(
          content,
          profile.characteristics.regional
        );
        content = transformResult.transformed;
        regionalTransformations = transformResult.metadata;
      }
    }

    const qualityScore = await this.assessQuality(content, request);
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    // TIER-2.1: Record cost and quality after execution
    if (this.config.enableRouterTracking) {
      this.recordExecution(
        'writing' as TaskType,
        this.determineComplexity(request),
        latencyMs,
        inputTokens,
        outputTokens,
        qualityScore >= 0.7 // considered successful if quality >= 70%
      );
    }

    return {
      content,
      wordCount: this.countWords(content),
      qualityScore,
      metadata: {
        model: this.model,
        tokensUsed: inputTokens + outputTokens,
        latencyMs,
        styleApplied: !!request.style,
        regionalTransformations,
      },
    };
  }

  async generateSection(heading: string, context: string, style?: string): Promise<string> {
    const startTime = Date.now();

    // TIER-2.1: Check budget before execution
    if (this.config.enableRouterTracking) {
      const budgetCheck = this.checkBudget();
      if (!budgetCheck.allowed) {
        if (this.config.blockOnBudgetExceeded) {
          throw new Error(`Budget exceeded: ${budgetCheck.reason}`);
        }
        if (this.config.verbose) {
          console.warn(`[WritingGenerator] Budget warning: ${budgetCheck.reason}`);
        }
      }
    }

    let systemPrompt = `You are a professional writer. Generate complete, coherent section content.`;

    // Apply style if provided
    if (style && this.styleManager) {
      const profile = await this.styleManager.getProfile(style);
      if (profile) {
        systemPrompt += this.buildStylePromptAddition(profile);
      }
    }

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Write a complete section for: ${heading}\n\nContext: ${context}\n\nWrite only the section content, no placeholder text.`,
        },
      ],
    });

    const latencyMs = Date.now() - startTime;
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    // TIER-2.1: Record cost and quality after execution
    if (this.config.enableRouterTracking) {
      this.recordExecution(
        'writing' as TaskType,
        'simple', // Section generation is typically simple
        latencyMs,
        inputTokens,
        outputTokens,
        true // Section generation succeeds if we get a response
      );
    }

    return this.extractContent(response);
  }

  getSupportedStyles(): string[] {
    return this.styleManager?.listProfiles().map(p => p.name) ?? [];
  }

  /**
   * Build system prompt with style profile integration and corpus constraint
   */
  private async buildSystemPrompt(request: IWriteRequest): Promise<string> {
    let prompt = `You are a professional writer creating high-quality content.
Your task is to generate complete, coherent, well-structured content.

Guidelines:
- Write complete paragraphs, not outlines or placeholders
- Use clear transitions between sections
- Maintain consistent tone throughout
- Support claims with reasoning
- Use markdown formatting appropriately`;

    // Apply style profile if specified
    if (request.style && this.styleManager) {
      const profile = await this.styleManager.getProfile(request.style);
      if (profile) {
        prompt += this.buildStylePromptAddition(profile);
      }
    }

    // PHASE 1: Apply corpus constraint for hallucination prevention
    if (request.corpusConstraint && request.corpusConstraint.enforcement !== 'off') {
      prompt += this.buildCorpusConstraintPrompt(request.corpusConstraint);
    }

    return prompt;
  }

  /**
   * Build corpus constraint prompt section for hallucination prevention (Phase 1)
   *
   * This creates an explicit whitelist of allowed sources that the LLM must use.
   * Sources not in this list should not be cited.
   */
  private buildCorpusConstraintPrompt(constraint: CorpusConstraint): string {
    if (constraint.sources.length === 0) {
      return '';
    }

    const isStrict = constraint.enforcement === 'strict';
    const placeholder = constraint.missingCitationPlaceholder || '[CITATION NEEDED]';

    // Group sources by type for better organization
    const primarySources: CorpusSource[] = [];
    const secondarySources: CorpusSource[] = [];

    for (const source of constraint.sources) {
      // Heuristic: primary sources are ancient authors or "Being and Time" etc.
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

    let corpusPrompt = `

## CORPUS-ONLY CITATION CONSTRAINT (${isStrict ? 'MANDATORY' : 'RECOMMENDED'})

You may ${isStrict ? 'ONLY' : 'preferably'} cite from the following verified sources:`;

    if (primarySources.length > 0) {
      corpusPrompt += `

### Primary Sources
${primarySources.map(s => this.formatSourceEntry(s)).join('\n')}`;
    }

    if (secondarySources.length > 0) {
      corpusPrompt += `

### Secondary Scholarship
${secondarySources.map(s => this.formatSourceEntry(s)).join('\n')}`;
    }

    corpusPrompt += `

### Citation Rules
1. ${isStrict ? 'Do NOT invent citations not in this list' : 'Prefer citations from this list'}
2. ${isStrict ? 'Do NOT fabricate page numbers outside the ranges shown' : 'Use verified page numbers when available'}
3. Do NOT combine authors who do not co-author in this list
4. Do NOT cite works by listed authors other than those specified above
5. If you need a source not listed, write "${placeholder}" instead of fabricating

${isStrict ? 'Violation of these rules constitutes academic misconduct and will result in rejection.' : 'Unverified citations will be flagged for review.'}`;

    return corpusPrompt;
  }

  /**
   * Format a single corpus source entry for the constraint prompt
   */
  private formatSourceEntry(source: CorpusSource): string {
    let entry = `- ${source.author} (${source.year}). "${source.title}"`;
    if (source.pages) {
      entry += ` [Pages: ${source.pages}]`;
    }
    if (source.citationKey) {
      entry += ` — Cite as: (${source.citationKey})`;
    }
    return entry;
  }

  /**
   * Build style prompt addition from profile characteristics
   */
  private buildStylePromptAddition(profile: any): string {
    let addition = `\n\nStyle Profile: ${profile.metadata.name}`;

    const chars = profile.characteristics;
    const characteristics: string[] = [];

    // Sentence metrics
    if (chars.sentences && chars.sentences.averageLength) {
      characteristics.push(
        `Sentence length: avg ${chars.sentences.averageLength.toFixed(1)} words`
      );
    }

    // Vocabulary metrics
    if (chars.vocabulary) {
      characteristics.push(
        `Vocabulary complexity: ${chars.vocabulary.uniqueWordRatio.toFixed(2)}`
      );
    }

    // Tone metrics
    if (chars.tone) {
      const formality = chars.tone.formalityScore > 0.6 ? 'formal' : 'casual';
      characteristics.push(`Tone: ${formality}`);
    }

    // Common transitions
    if (chars.commonTransitions && chars.commonTransitions.length > 0) {
      characteristics.push(
        `Common transitions: ${chars.commonTransitions.slice(0, 5).join(', ')}`
      );
    }

    if (characteristics.length > 0) {
      addition += `\n\nWriting characteristics to emulate:\n${characteristics.map(c => `- ${c}`).join('\n')}`;
    }

    return addition;
  }

  /**
   * Build user prompt from request
   */
  private buildUserPrompt(request: IWriteRequest): string {
    let prompt = `Write a complete document with the following specifications:

Title: ${request.title}
Description: ${request.description}`;

    if (request.outline && request.outline.length > 0) {
      prompt += `\n\nStructure (follow this outline):
${request.outline.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
    }

    if (request.context) {
      prompt += `\n\nRelevant Context:
${request.context}`;
    }

    if (request.maxLength) {
      prompt += `\n\nTarget length: approximately ${request.maxLength} words`;
    }

    if (request.tone) {
      prompt += `\n\nTone: ${request.tone}`;
    }

    prompt += `\n\nIMPORTANT: Generate complete, publication-ready content. Do not use placeholders like "[content here]" or "TODO".`;

    return prompt;
  }

  /**
   * Extract text content from Anthropic message response
   */
  private extractContent(response: Anthropic.Message): string {
    return response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as Anthropic.TextBlock).text)
      .join('\n');
  }

  /**
   * Estimate token count from word count
   */
  private estimateTokens(words: number): number {
    // Rough estimate: 1 word ≈ 1.5 tokens
    // Cap at 8000 tokens for safety
    return Math.min(Math.ceil(words * 1.5), 8000);
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.split(/\s+/).filter((w) => w.length > 0).length;
  }

  /**
   * Assess quality of generated content
   */
  private async assessQuality(content: string, request: IWriteRequest): Promise<number> {
    let score = 0;
    const words = this.countWords(content);

    // 1. Length appropriateness (0.2)
    const targetWords = request.maxLength || 1000;
    const lengthRatio = words / targetWords;
    if (lengthRatio >= 0.8 && lengthRatio <= 1.2) {
      score += 0.2;
    } else if (lengthRatio >= 0.5 && lengthRatio <= 1.5) {
      score += 0.1;
    }

    // 2. No placeholder text (0.3) - CRITICAL
    const placeholderPatterns = /\[.*?here\]|\[.*?content\]|TODO|PLACEHOLDER|\[Generated.*?\]/gi;
    if (!placeholderPatterns.test(content)) {
      score += 0.3;
    }

    // 3. Has proper structure (0.2)
    // Check for headers
    if (content.includes('# ') || content.includes('## ')) {
      score += 0.1;
    }
    // Check for multiple paragraphs
    if (content.split('\n\n').length >= 3) {
      score += 0.1;
    }

    // 4. Coherent paragraphs (0.2)
    const paragraphs = content.split('\n\n').filter((p) => p.trim().length > 50);
    if (paragraphs.length >= 2) {
      score += 0.2;
    }

    // 5. Title present (0.1)
    if (content.toLowerCase().includes(request.title.toLowerCase().substring(0, 20))) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Apply regional transformations (UK/US English spelling and grammar)
   * @param text - Text to transform
   * @param regional - Regional settings from style profile
   * @returns Transformed text and metadata
   */
  private applyRegionalTransformations(
    text: string,
    regional: RegionalSettings
  ): { transformed: string; metadata: RegionalTransformationMetadata } {
    const variant = regional.languageVariant === 'auto' ? 'en-GB' : regional.languageVariant;

    if (variant === 'en-US') {
      return {
        transformed: text,
        metadata: { variant: 'en-US', spellingChanges: 0, grammarChanges: 0, rulesApplied: [] }
      };
    }

    // Apply spelling transformation
    const spellingTransformer = new SpellingTransformer(variant);
    const spellingResult = spellingTransformer.transform(text);
    const spellingChanges = this.countSpellingChanges(text, spellingResult);

    // Apply grammar transformation (preserving quotes)
    const grammarTransformer = new GrammarTransformer(variant);
    const grammarResult = grammarTransformer.transform(spellingResult, {
      preserveQuotes: true,
      categories: ['past-participle', 'preposition']
    });

    console.log(`[WritingGenerator] Applied UK transformations: ${spellingChanges} spelling, ${grammarResult.changeCount} grammar`);

    return {
      transformed: grammarResult.transformed,
      metadata: {
        variant,
        spellingChanges,
        grammarChanges: grammarResult.changeCount,
        rulesApplied: grammarResult.rulesApplied
      }
    };
  }

  /**
   * Count spelling changes between original and transformed text
   * @param original - Original text
   * @param transformed - Transformed text
   * @returns Number of words that changed
   */
  private countSpellingChanges(original: string, transformed: string): number {
    const originalWords = original.toLowerCase().split(/\s+/);
    const transformedWords = transformed.toLowerCase().split(/\s+/);
    let changes = 0;
    for (let i = 0; i < originalWords.length && i < transformedWords.length; i++) {
      if (originalWords[i] !== transformedWords[i]) changes++;
    }
    return changes;
  }

  // ========================================================================
  // TIER-2.1: Router Integration Methods
  // ========================================================================

  /**
   * Check if budget allows execution
   */
  private checkBudget(): { allowed: boolean; reason?: string } {
    try {
      const enforcer = getBudgetEnforcer();
      const result = enforcer.checkRequest(this.model);
      return { allowed: result.allowed, reason: result.reason };
    } catch {
      // Router not initialized - allow execution
      return { allowed: true };
    }
  }

  /**
   * Determine complexity of the writing request
   */
  private determineComplexity(request: IWriteRequest): Complexity {
    const wordTarget = request.maxLength ?? 1000;
    const hasOutline = (request.outline?.length ?? 0) > 0;
    const hasContext = !!request.context;
    const hasStyle = !!request.style;

    // Complex: long documents, multiple sections, style requirements
    if (wordTarget > 3000 || (hasOutline && (request.outline?.length ?? 0) > 5)) {
      return 'complex';
    }

    // Medium: moderate length or has styling/context
    if (wordTarget > 1000 || hasContext || hasStyle) {
      return 'medium';
    }

    return 'simple';
  }

  /**
   * Record execution metrics to router
   */
  private recordExecution(
    taskType: TaskType,
    complexity: Complexity,
    durationMs: number,
    inputTokens: number,
    outputTokens: number,
    success: boolean
  ): string | undefined {
    try {
      // Approximate costs for Claude Sonnet (per 1M tokens)
      const inputCostPer1M = 3.0;
      const outputCostPer1M = 15.0;
      const inputCost = (inputTokens / 1_000_000) * inputCostPer1M;
      const outputCost = (outputTokens / 1_000_000) * outputCostPer1M;

      // Record the completed request using the router utility
      const scoreId = recordCompletedRequest(
        this.model,
        'anthropic',
        taskType,
        complexity,
        durationMs, // responseTime
        inputTokens + outputTokens, // tokensUsed
        inputTokens,
        outputTokens,
        inputCost,
        outputCost,
        success // accepted
      );

      if (this.config.verbose) {
        console.log(`[WritingGenerator] Recorded: model=${this.model}, tokens=${inputTokens + outputTokens}, scoreId=${scoreId}`);
      }

      return scoreId;
    } catch {
      // Router not initialized - skip recording
      return undefined;
    }
  }
}
