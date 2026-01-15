/**
 * Anthropic Writing Generator (SPEC-WRT-001)
 *
 * LLM-based writing generation using Anthropic's Claude API.
 * Integrates with TIER-2.1 Intelligent Model Router for cost/quality tracking.
 */
import type { IWritingGenerator, IWriteRequest, IWriteResult } from './writing-generator.js';
import type { StyleProfileManager } from '../../universal/style-profile.js';
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
export declare class AnthropicWritingGenerator implements IWritingGenerator {
    private client;
    private styleManager?;
    private model;
    private config;
    constructor(apiKey?: string, styleManager?: StyleProfileManager, config?: IWritingGeneratorConfig);
    generate(request: IWriteRequest): Promise<IWriteResult>;
    generateSection(heading: string, context: string, style?: string): Promise<string>;
    getSupportedStyles(): string[];
    /**
     * Build system prompt with style profile integration
     */
    private buildSystemPrompt;
    /**
     * Build style prompt addition from profile characteristics
     */
    private buildStylePromptAddition;
    /**
     * Build user prompt from request
     */
    private buildUserPrompt;
    /**
     * Extract text content from Anthropic message response
     */
    private extractContent;
    /**
     * Estimate token count from word count
     */
    private estimateTokens;
    /**
     * Count words in text
     */
    private countWords;
    /**
     * Assess quality of generated content
     */
    private assessQuality;
    /**
     * Apply regional transformations (UK/US English spelling and grammar)
     * @param text - Text to transform
     * @param regional - Regional settings from style profile
     * @returns Transformed text and metadata
     */
    private applyRegionalTransformations;
    /**
     * Count spelling changes between original and transformed text
     * @param original - Original text
     * @param transformed - Transformed text
     * @returns Number of words that changed
     */
    private countSpellingChanges;
    /**
     * Check if budget allows execution
     */
    private checkBudget;
    /**
     * Determine complexity of the writing request
     */
    private determineComplexity;
    /**
     * Record execution metrics to router
     */
    private recordExecution;
}
//# sourceMappingURL=anthropic-writing-generator.d.ts.map