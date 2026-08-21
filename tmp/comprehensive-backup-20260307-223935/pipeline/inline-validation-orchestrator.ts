/**
 * InlineValidationOrchestrator - Coordinates Chunked Generation with Validation Gates
 *
 * Orchestrates paragraph-by-paragraph generation with inline validation.
 * Each paragraph is validated BEFORE being added to the output document.
 *
 * Part of the Inline Citation Enforcement Architecture (Phase 3).
 */

import { CitationLookupTool, type CorpusRetriever } from './citation-lookup-tool.js';
import { InlineClaimValidator, type GeneratedUnit, type InlineValidationResult, type InlineValidationConfig } from './inline-claim-validator.js';
import { QuotationFidelityValidator, type QuotationFidelityValidationResult, type QuotationFidelityResult } from './quotation-fidelity-validator.js';
import { CcvTier1Gate, type CcvTier1Config, type Tier1EvaluationResult, type Tier1Artifacts } from './ccv-tier1-gate.js';
import type { DetectedClaim } from './claim-detector.js';
import type { ContextChunk } from './corpus-constraint-builder.js';
import type { CorpusSource } from './writing-generator.js';
import { createComponentLogger } from '../observability/logger.js';

const logger = createComponentLogger('InlineValidationOrchestrator');

/**
 * A generation unit (outline item)
 */
export interface GenerationUnit {
  /** Unit type */
  type: 'introduction' | 'paragraph' | 'claim' | 'argument' | 'evidence' | 'transition' | 'conclusion' | 'synthesis';
  /** What this unit should accomplish */
  intent: string;
  /** Key topics/concepts to address */
  topics: string[];
  /** Suggested length in words */
  targetWords?: number;
  /** Required sources (must cite these) */
  requiredSources?: string[];
  /** Section this belongs to */
  section?: string;
}

/**
 * A validated and accepted unit
 */
export interface ValidatedUnit {
  /** The generated content */
  content: string;
  /** The original generation unit */
  unit: GenerationUnit;
  /** Citations used */
  citations: Array<{
    author: string;
    year?: number;
    page?: number;
  }>;
  /** Quotes used */
  quotes: Array<{
    text: string;
    author: string;
  }>;
  /** Validation result */
  validationResult: InlineValidationResult;
  /** Number of attempts before passing */
  attempts: number;
  /** CCV Tier 1 evaluation result (if Tier 1 enabled) */
  tier1Result?: Tier1EvaluationResult;
  /** CCV Tier 1 artifacts for cross-tier reuse */
  tier1Artifacts?: Tier1Artifacts;
}

/**
 * Configuration for inline generation
 */
export interface InlineGenerationConfig {
  /** Maximum retries per unit */
  maxRetriesPerUnit: number;
  /** Validation strictness */
  validationStrictness: InlineValidationConfig['strictness'];
  /** Enable citation lookup tool */
  enableCitationLookupTool: boolean;
  /** Model to use */
  model: string;
  /** Temperature for generation */
  temperature: number;
  /** Maximum tokens per unit */
  maxTokensPerUnit: number;
  /** Style prompt to inject */
  stylePrompt?: string;
  /** Minimum quotation fidelity threshold (default: 0.95 = 95%) */
  minQuotationFidelity?: number;
  /** Whether to reject content with non-verbatim quotes (default: true) */
  rejectNonVerbatimQuotes?: boolean;
  /** Enable CCV Tier 1 inline claim detection and enforcement */
  enableCcvTier1?: boolean;
  /** CCV Tier 1 configuration */
  ccvTier1Config?: Partial<CcvTier1Config>;
}

/**
 * Quotation fidelity summary for a validated unit
 */
export interface QuotationFidelitySummary {
  /** Total quotes in the unit */
  totalQuotes: number;
  /** Verbatim quotes (>= threshold) */
  verbatimQuotes: number;
  /** Non-verbatim quotes (< threshold) */
  nonVerbatimQuotes: number;
  /** Borderline quotes (WARN tier — layout artifact candidates) */
  borderlineQuotes: number;
  /** Fidelity rate (verbatim / total) */
  fidelityRate: number;
  /** Count of exact matches (raw similarity >= 0.95) */
  verbatimMatchCount: number;
  /** Count of matches requiring layout normalization */
  normalizedMatchCount: number;
  /** % exact verbatim (raw >= 0.95) — higher = cleaner corpus */
  verbatimRate: number;
  /** % normalized-only — higher = more OCR-dirty corpus */
  normalizedRate: number;
  /** Count of borderline matches (norm >= 0.90, raw >= 0.75) */
  borderlineCount: number;
  /** Count of failed matches (below all thresholds or unmatched) */
  failCount: number;
  /** % borderline — early warning for corpus degradation */
  borderlineRate: number;
  /** Non-verbatim quote details with corrections */
  nonVerbatimDetails: Array<{
    /** Original quote text */
    quote: string;
    /** Similarity score (0-1) */
    similarity: number;
    /** Suggested correction from corpus */
    suggestedCorrection?: string;
    /** Line number in content */
    line?: number;
  }>;
  /** Borderline quote details (WARN tier) */
  borderlineDetails: Array<{
    /** Original quote text */
    quote: string;
    /** Raw similarity score */
    rawSimilarity: number;
    /** Normalized similarity score */
    normalizedSimilarity: number;
    /** Line number in content */
    line?: number;
  }>;
  /** Whether fidelity passed threshold */
  passed: boolean;
}

/**
 * Result of inline generation
 */
export interface InlineGenerationResult {
  /** The assembled document */
  document: string;
  /** All validated units */
  units: ValidatedUnit[];
  /** Overall statistics */
  stats: {
    totalUnits: number;
    passedFirstAttempt: number;
    passedAfterRetry: number;
    failed: number;
    totalAttempts: number;
    avgAttemptsPerUnit: number;
  };
  /** Units that failed all retries */
  failedUnits: Array<{
    unit: GenerationUnit;
    lastValidationResult: InlineValidationResult;
    quotationFidelity?: QuotationFidelitySummary;
    placeholder: string;
  }>;
  /** Whether all units passed */
  allPassed: boolean;
  /** Overall quality score */
  qualityScore: number;
  /** CCV Tier 1 aggregate statistics (if Tier 1 enabled) */
  claimDetection?: {
    totalClaims: number;
    claimsRequiringCitation: number;
    claimsMissingCitation: number;
    compositeClaimsDecomposed: number;
    averageClaimsPerParagraph: number;
    riskDistribution: Record<string, number>;
  };
  /** Aggregate quotation fidelity across all units */
  quotationFidelity: {
    totalQuotes: number;
    verbatimQuotes: number;
    nonVerbatimQuotes: number;
    borderlineQuotes: number;
    overallFidelityRate: number;
    /** Exact matches (raw >= 0.95) — no normalization needed */
    verbatimMatchCount: number;
    /** Matches requiring layout normalization (norm >= 0.95, raw < 0.95) */
    normalizedMatchCount: number;
    /** % verbatim — higher = cleaner corpus */
    verbatimRate: number;
    /** % normalized-only — higher = more OCR artifacts */
    normalizedRate: number;
    /** Count of borderline matches across all units */
    borderlineCount: number;
    /** Count of failed matches across all units */
    failCount: number;
    /** % borderline — early warning for corpus degradation */
    borderlineRate: number;
    /** All non-verbatim quotes with corrections */
    nonVerbatimDetails: Array<{
      unitIndex: number;
      quote: string;
      similarity: number;
      suggestedCorrection?: string;
    }>;
    /** All borderline quotes (WARN tier) */
    borderlineDetails: Array<{
      unitIndex: number;
      quote: string;
      rawSimilarity: number;
      normalizedSimilarity: number;
    }>;
  };
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: InlineGenerationConfig = {
  maxRetriesPerUnit: 3,
  validationStrictness: 'moderate',
  enableCitationLookupTool: true,
  model: 'claude-sonnet-4-20250514',
  temperature: 0.7,
  maxTokensPerUnit: 1500,
  minQuotationFidelity: 0.70, // 70% similarity required (lowered from 95% for OCR corpus text)
  rejectNonVerbatimQuotes: true, // Reject content with paraphrased quotes
};

/**
 * InlineValidationOrchestrator
 *
 * Coordinates paragraph-by-paragraph generation with inline validation gates.
 */
/**
 * Function signature for LLM generation (backed by Claude Code CLI or Anthropic API).
 */
export type GenerateFn = (prompt: string, systemPrompt: string) => Promise<string>;

export class InlineValidationOrchestrator {
  private generateFn: GenerateFn;
  private citationTool: CitationLookupTool;
  private validator: InlineClaimValidator;
  private quotationFidelityValidator: QuotationFidelityValidator;
  private ccvTier1Gate: CcvTier1Gate | null;
  private previousClaims: DetectedClaim[];
  private corpusChunks: ContextChunk[];
  private corpusSources: CorpusSource[];
  private config: InlineGenerationConfig;

  constructor(
    generateFn: GenerateFn,
    retriever: CorpusRetriever,
    corpusChunks: ContextChunk[],
    corpusSources: CorpusSource[],
    config: Partial<InlineGenerationConfig> = {}
  ) {
    this.generateFn = generateFn;
    this.corpusChunks = corpusChunks;
    this.corpusSources = corpusSources;
    this.config = { ...DEFAULT_CONFIG, ...config };

    // Initialize citation lookup tool
    this.citationTool = new CitationLookupTool(
      retriever,
      corpusSources,
      corpusChunks
    );

    // Initialize inline claim validator
    // Note: Both claim grounding and quote fidelity are disabled in the inline validator
    // because they are O(n*m*k) with large corpus chunk sets. The orchestrator performs
    // its own optimized quotation fidelity check (Step 3) which is sufficient.
    // Claim grounding is reserved for post-hoc validation on the full document.
    this.validator = new InlineClaimValidator(
      corpusSources,
      corpusChunks,
      {
        strictness: this.config.validationStrictness,
        validateQuoteFidelity: false,
        validateClaimGrounding: false,
      }
    );

    // Initialize dedicated quotation fidelity validator with strict threshold
    // Note: ContextChunk types differ slightly between modules, but are structurally compatible
    this.quotationFidelityValidator = new QuotationFidelityValidator(
      corpusSources,
      corpusChunks as ContextChunk[],
      {
        minSimilarity: this.config.minQuotationFidelity ?? 0.95,
        suggestCorrections: true,
      }
    );

    // Initialize CCV Tier 1 gate (enabled by default)
    // Precedence: explicit env disable > config > default (true)
    const envVar = (process.env.CCV_TIER1_ACTIVE ?? '').toLowerCase().trim();
    const envDisabled = envVar === 'false' || envVar === '0';
    const tier1Enabled = envDisabled
      ? false
      : (this.config.enableCcvTier1 ?? true);

    // Log activation decision for debuggability
    const tier1Reason = envDisabled
      ? `env CCV_TIER1_ACTIVE=${process.env.CCV_TIER1_ACTIVE}`
      : this.config.enableCcvTier1 !== undefined
        ? `config enableCcvTier1=${this.config.enableCcvTier1}`
        : 'default (enabled)';
    logger.info(`CCV Tier1 ${tier1Enabled ? 'ON' : 'OFF'} (${tier1Reason})`);

    if (tier1Enabled) {
      this.ccvTier1Gate = new CcvTier1Gate({
        strictness: this.config.validationStrictness as 'strict' | 'moderate' | 'lenient',
        ...this.config.ccvTier1Config,
      });
    } else {
      this.ccvTier1Gate = null;
    }

    this.previousClaims = [];
  }

  /**
   * Generate document with inline validation
   */
  async generateWithInlineValidation(
    topic: string,
    outline: GenerationUnit[],
    systemPrompt?: string
  ): Promise<InlineGenerationResult> {
    const validatedUnits: ValidatedUnit[] = [];
    const failedUnits: InlineGenerationResult['failedUnits'] = [];
    let totalAttempts = 0;
    let passedFirstAttempt = 0;
    let passedAfterRetry = 0;

    // Track aggregate quotation fidelity
    const aggregateQuotationFidelity: InlineGenerationResult['quotationFidelity'] = {
      totalQuotes: 0,
      verbatimQuotes: 0,
      nonVerbatimQuotes: 0,
      borderlineQuotes: 0,
      overallFidelityRate: 1.0,
      verbatimMatchCount: 0,
      normalizedMatchCount: 0,
      verbatimRate: 1.0,
      normalizedRate: 0,
      borderlineCount: 0,
      failCount: 0,
      borderlineRate: 0,
      nonVerbatimDetails: [],
      borderlineDetails: [],
    };

    // Build base system prompt
    const baseSystemPrompt = this.buildSystemPrompt(topic, systemPrompt);

    // Generate each unit
    for (let i = 0; i < outline.length; i++) {
      const unit = outline[i];
      logger.info(`[Unit ${i + 1}/${outline.length}] Type: ${unit.type}, Intent: ${unit.intent.slice(0, 60)}...`);
      const priorContext = this.buildPriorContext(validatedUnits);

      let attempts = 0;
      let validated: ValidatedUnit | null = null;
      let lastValidationResult: InlineValidationResult | null = null;
      let lastQuotationFidelity: QuotationFidelitySummary | null = null;
      let lastGeneratedContent: string | null = null; // Track last generated content for recovery
      let feedbackHistory: string[] = [];

      while (!validated && attempts < this.config.maxRetriesPerUnit) {
        attempts++;
        totalAttempts++;
        logger.debug(`Attempt ${attempts}/${this.config.maxRetriesPerUnit}...`);

        try {
          // Step 1: Generate unit with tool-use
          logger.debug(`Step 1: Generating with API (model: ${this.config.model})...`);
          const generated = await this.generateUnit(
            unit,
            priorContext,
            baseSystemPrompt,
            feedbackHistory
          );

          logger.debug(`Step 1 complete: ${generated.content.length} chars, ${generated.citations.length} citations, ${generated.quotes.length} quotes`);
          lastGeneratedContent = generated.content; // Track for recovery

          // Step 1.5: CCV Tier 1 Claim Detection & Enforcement (if enabled)
          let tier1Result: Tier1EvaluationResult | undefined;
          if (this.ccvTier1Gate) {
            logger.debug(`Step 1.5: CCV Tier 1 claim detection...`);
            tier1Result = await this.ccvTier1Gate.evaluate(
              generated.content,
              generated.citations,
              {
                knownAuthors: this.validator.getAvailableAuthors(),
                previousClaims: this.previousClaims,
                paragraphIndex: i,
              }
            );
            logger.info(`Step 1.5 complete: ${tier1Result.stats.totalClaims} claims, ${tier1Result.stats.claimsMissingCitation} missing citations, passed=${tier1Result.passed}`);

            // Track claims across paragraphs for attribution inheritance
            if (tier1Result.claims.length > 0) {
              this.previousClaims = [...this.previousClaims, ...tier1Result.claims];
            }
          }

          // Step 2: Validate citations BEFORE accepting
          logger.debug(`Step 2: Validating citations...`);
          const generatedUnit: GeneratedUnit = {
            content: generated.content,
            intent: unit.intent,
            type: unit.type === 'introduction' || unit.type === 'conclusion' ? 'paragraph' : unit.type,
          };

          const validation = await this.validator.validateUnit(generatedUnit);
          lastValidationResult = validation;
          logger.info(`Step 2 complete: passed=${validation.passed}, score=${(validation.overallScore * 100).toFixed(1)}%`);

          // Step 3: Perform explicit quotation fidelity validation
          logger.debug(`Step 3: Checking quotation fidelity...`);
          const quoteFidelityResult = await this.quotationFidelityValidator.validate(generated.content);
          const quoteFidelitySummary = this.buildQuotationFidelitySummary(quoteFidelityResult);
          lastQuotationFidelity = quoteFidelitySummary;
          logger.info(`Step 3 complete: ${quoteFidelitySummary.totalQuotes} quotes — ${quoteFidelitySummary.verbatimMatchCount} verbatim (${(quoteFidelitySummary.verbatimRate * 100).toFixed(0)}%), ${quoteFidelitySummary.normalizedMatchCount} normalized-only (${(quoteFidelitySummary.normalizedRate * 100).toFixed(0)}%), ${quoteFidelitySummary.borderlineCount} borderline (${(quoteFidelitySummary.borderlineRate * 100).toFixed(0)}%), ${quoteFidelitySummary.failCount} fail`);

          // Step 4: Check if quotation fidelity passes the threshold
          const quoteFidelityPassed = this.checkQuotationFidelity(quoteFidelitySummary);
          logger.info(`Step 4: Quote fidelity ${quoteFidelityPassed ? 'PASSED' : 'FAILED'}, citation validation ${validation.passed ? 'PASSED' : 'FAILED'}`);

          // Determine overall pass: citation validation + quote fidelity + Tier 1
          const tier1Passed = tier1Result ? tier1Result.passed : true;
          const overallPassed = validation.passed && quoteFidelityPassed && tier1Passed;

          if (overallPassed) {
            logger.info(`Unit ${i + 1} PASSED on attempt ${attempts}`);

            // Step 5 (Rev 2): Persist Tier 1 artifacts for cross-tier reuse
            const tier1Artifacts = tier1Result && this.ccvTier1Gate
              ? this.ccvTier1Gate.createArtifacts(tier1Result, i)
              : undefined;

            validated = {
              content: generated.content,
              unit,
              citations: generated.citations,
              quotes: generated.quotes,
              validationResult: validation,
              attempts,
              tier1Result,
              tier1Artifacts,
            };

            // Update aggregate quotation stats
            aggregateQuotationFidelity.totalQuotes += quoteFidelitySummary.totalQuotes;
            aggregateQuotationFidelity.verbatimQuotes += quoteFidelitySummary.verbatimQuotes;
            aggregateQuotationFidelity.nonVerbatimQuotes += quoteFidelitySummary.nonVerbatimQuotes;
            aggregateQuotationFidelity.borderlineQuotes += quoteFidelitySummary.borderlineQuotes;
            aggregateQuotationFidelity.verbatimMatchCount += quoteFidelitySummary.verbatimMatchCount;
            aggregateQuotationFidelity.normalizedMatchCount += quoteFidelitySummary.normalizedMatchCount;
            aggregateQuotationFidelity.borderlineCount += quoteFidelitySummary.borderlineCount;
            aggregateQuotationFidelity.failCount += quoteFidelitySummary.failCount;
            for (const bl of quoteFidelitySummary.borderlineDetails) {
              aggregateQuotationFidelity.borderlineDetails.push({
                unitIndex: i,
                quote: bl.quote,
                rawSimilarity: bl.rawSimilarity,
                normalizedSimilarity: bl.normalizedSimilarity,
              });
            }

            if (attempts === 1) {
              passedFirstAttempt++;
            } else {
              passedAfterRetry++;
            }
          } else {
            // Build feedback for retry - include Tier 1, validation, and quote fidelity feedback
            const combinedFeedback: string[] = [];

            // Prepend Tier 1 feedback (most specific/actionable)
            if (tier1Result && !tier1Result.passed && tier1Result.feedback) {
              combinedFeedback.push(tier1Result.feedback);
            }

            if (!validation.passed) {
              combinedFeedback.push(this.validator.formatFeedbackForRegeneration(validation));
            }

            if (!quoteFidelityPassed) {
              combinedFeedback.push(this.formatQuoteFidelityFeedback(quoteFidelitySummary));
            }

            feedbackHistory.push(combinedFeedback.join('\n\n'));
          }
        } catch (error) {
          logger.error(`Error generating unit ${i + 1}`, error);
          feedbackHistory.push(`Generation error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
        }
      }

      if (validated) {
        validatedUnits.push(validated);
      } else if (lastGeneratedContent && lastValidationResult && lastValidationResult.overallScore >= 0.8
        // Fix 24: Do NOT recover units with hallucinated (non-corpus) citations.
        // Only recover if the failure was due to quotation fidelity, claim grounding, or Tier 1 —
        // NOT because the LLM cited external sources. External source citations are the #1 user complaint.
        && (lastValidationResult.citationResults?.hallucinated?.length ?? 0) === 0) {
        // Recovery: If validation score is high (>=0.8) but failed on quote fidelity or Tier 1,
        // use the generated content instead of a placeholder. The post-generation pipeline
        // (quality gauntlet, citation enforcement) will catch remaining issues.
        logger.info(`Recovering unit ${i + 1} (validationScore=${(lastValidationResult.overallScore * 100).toFixed(0)}% >= 80%, 0 hallucinated)`);
        validatedUnits.push({
          content: lastGeneratedContent,
          unit,
          citations: [],
          quotes: [],
          validationResult: lastValidationResult,
          attempts,
        });
        // Still track as "failed" for stats but content is preserved
        const placeholder = this.createPlaceholder(unit, lastValidationResult);
        failedUnits.push({
          unit,
          lastValidationResult: lastValidationResult!,
          quotationFidelity: lastQuotationFidelity ?? undefined,
          placeholder,
        });
      } else {
        // Create placeholder for truly failed unit
        // Fix 21: Handle null lastValidationResult (e.g. API error before validation ran)
        const fallbackValidation: InlineValidationResult = lastValidationResult ?? {
          passed: false,
          overallScore: 0,
          citationResults: { total: 0, valid: 0, hallucinated: [], missingPageNumbers: [], passRate: 0 },
          quoteResults: { total: 0, verbatim: 0, nonVerbatim: [], fidelityRate: 1.0 },
          claimResults: { total: 0, grounded: 0, ungrounded: [], groundingRate: 1.0 },
          issues: [],
          feedback: ['Generation failed before validation could run'],
          details: {},
        };
        const placeholder = this.createPlaceholder(unit, fallbackValidation);

        // Track non-verbatim and borderline quotes from failed units
        if (lastQuotationFidelity) {
          for (const detail of lastQuotationFidelity.nonVerbatimDetails) {
            aggregateQuotationFidelity.nonVerbatimDetails.push({
              unitIndex: i,
              quote: detail.quote,
              similarity: detail.similarity,
              suggestedCorrection: detail.suggestedCorrection,
            });
          }
          for (const bl of lastQuotationFidelity.borderlineDetails) {
            aggregateQuotationFidelity.borderlineDetails.push({
              unitIndex: i,
              quote: bl.quote,
              rawSimilarity: bl.rawSimilarity,
              normalizedSimilarity: bl.normalizedSimilarity,
            });
          }
          aggregateQuotationFidelity.totalQuotes += lastQuotationFidelity.totalQuotes;
          aggregateQuotationFidelity.nonVerbatimQuotes += lastQuotationFidelity.nonVerbatimQuotes;
          aggregateQuotationFidelity.borderlineQuotes += lastQuotationFidelity.borderlineQuotes;
        }

        failedUnits.push({
          unit,
          lastValidationResult: fallbackValidation,
          quotationFidelity: lastQuotationFidelity ?? undefined,
          placeholder,
        });
        // Add placeholder to output so document structure is maintained
        validatedUnits.push({
          content: placeholder,
          unit,
          citations: [],
          quotes: [],
          validationResult: fallbackValidation,
          attempts,
        });
      }
    }

    // Assemble document
    const document = this.assembleDocument(validatedUnits);

    // Calculate quality score (handle null validation results)
    const qualityScore = validatedUnits.length > 0
      ? validatedUnits.reduce(
          (sum, u) => sum + (u.validationResult?.overallScore ?? 0),
          0
        ) / validatedUnits.length
      : 0;

    // Calculate overall fidelity rate and verbatim/normalized split
    aggregateQuotationFidelity.overallFidelityRate =
      aggregateQuotationFidelity.totalQuotes > 0
        ? aggregateQuotationFidelity.verbatimQuotes / aggregateQuotationFidelity.totalQuotes
        : 1.0;
    aggregateQuotationFidelity.verbatimRate =
      aggregateQuotationFidelity.totalQuotes > 0
        ? aggregateQuotationFidelity.verbatimMatchCount / aggregateQuotationFidelity.totalQuotes
        : 1.0;
    aggregateQuotationFidelity.normalizedRate =
      aggregateQuotationFidelity.totalQuotes > 0
        ? aggregateQuotationFidelity.normalizedMatchCount / aggregateQuotationFidelity.totalQuotes
        : 0;
    aggregateQuotationFidelity.borderlineRate =
      aggregateQuotationFidelity.totalQuotes > 0
        ? aggregateQuotationFidelity.borderlineCount / aggregateQuotationFidelity.totalQuotes
        : 0;

    // Aggregate CCV Tier 1 statistics
    let claimDetection: InlineGenerationResult['claimDetection'];
    if (this.ccvTier1Gate) {
      const unitsWithTier1 = validatedUnits.filter(u => u.tier1Result);
      const totalClaims = unitsWithTier1.reduce((sum, u) => sum + (u.tier1Result?.stats.totalClaims ?? 0), 0);
      const claimsRequiringCitation = unitsWithTier1.reduce((sum, u) => sum + (u.tier1Result?.stats.claimsRequiringCitation ?? 0), 0);
      const claimsMissingCitation = unitsWithTier1.reduce((sum, u) => sum + (u.tier1Result?.stats.claimsMissingCitation ?? 0), 0);
      const compositeClaimsDecomposed = unitsWithTier1.reduce((sum, u) => sum + (u.tier1Result?.stats.compositeClaimsDecomposed ?? 0), 0);

      const riskDistribution: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
      for (const u of unitsWithTier1) {
        if (u.tier1Result) {
          for (const [risk, count] of Object.entries(u.tier1Result.stats.claimsByRisk)) {
            riskDistribution[risk] = (riskDistribution[risk] ?? 0) + count;
          }
        }
      }

      claimDetection = {
        totalClaims,
        claimsRequiringCitation,
        claimsMissingCitation,
        compositeClaimsDecomposed,
        averageClaimsPerParagraph: unitsWithTier1.length > 0 ? totalClaims / unitsWithTier1.length : 0,
        riskDistribution,
      };
    }

    return {
      document,
      units: validatedUnits,
      stats: {
        totalUnits: outline.length,
        passedFirstAttempt,
        passedAfterRetry,
        failed: failedUnits.length,
        totalAttempts,
        avgAttemptsPerUnit: totalAttempts / outline.length,
      },
      failedUnits,
      allPassed: failedUnits.length === 0,
      qualityScore,
      claimDetection,
      quotationFidelity: aggregateQuotationFidelity,
    };
  }

  /**
   * Generate a single unit via pre-fetched citation context + single-shot generation.
   * Replaces the previous agentic tool-use loop — citation evidence is now baked into the prompt.
   */
  private async generateUnit(
    unit: GenerationUnit,
    priorContext: string,
    systemPrompt: string,
    feedbackHistory: string[]
  ): Promise<{
    content: string;
    citations: Array<{ author: string; year?: number; page?: number }>;
    quotes: Array<{ text: string; author: string }>;
  }> {
    const userPrompt = this.buildUnitPrompt(unit, priorContext, feedbackHistory);

    // Pre-fetch citation context for this unit's topics
    const citations: Array<{ author: string; year?: number; page?: number }> = [];
    const quotes: Array<{ text: string; author: string }> = [];

    let citationContext = '';
    if (this.config.enableCitationLookupTool) {
      logger.debug(`[Prefetch] Looking up citations for ${unit.topics.length} topics...`);
      const results: string[] = [];
      for (const topic of unit.topics.slice(0, 3)) {
        const result = await this.citationTool.lookup({ query: topic, claimType: 'factual', maxResults: 5 });
        results.push(this.citationTool.formatForLLM(result));

        // Track pre-fetched citations and quotes
        for (const citation of result.citations) {
          citations.push({ author: citation.author, year: citation.year ?? undefined });
        }
        for (const quote of result.relevantQuotes) {
          quotes.push({ text: quote.text, author: quote.source.author });
        }
      }
      citationContext = results.join('\n\n');
      logger.debug(`[Prefetch] Got ${citations.length} citations, ${quotes.length} quotes`);
    }

    // Build full prompt with citation context baked in
    const fullPrompt = citationContext
      ? `${userPrompt}\n\n## Pre-fetched Citation Evidence\nUse the following corpus evidence to support your arguments with EXACT quotes:\n\n${citationContext}`
      : userPrompt;

    // Single-shot generation via generateFn (Claude Code CLI or Anthropic API)
    logger.debug(`[Generate] Single-shot generation via generateFn...`);
    const content = await this.generateFn(fullPrompt, systemPrompt);
    logger.debug(`[Generate] Got ${content.length} chars`);

    // Extract any additional citations from the generated content (post-hoc)
    const extractedCitations = this.extractCitationsFromContent(content);
    for (const c of extractedCitations) {
      if (!citations.some(existing => existing.author === c.author)) {
        citations.push(c);
      }
    }

    return { content, citations, quotes };
  }

  /**
   * Extract author citations from generated text (post-hoc).
   * Matches patterns like "Author (YYYY)" or "Author (YYYY, p. N)".
   */
  private extractCitationsFromContent(content: string): Array<{ author: string; year?: number; page?: number }> {
    const results: Array<{ author: string; year?: number; page?: number }> = [];
    const pattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\((\d{4})(?:,\s*p\.?\s*(\d+))?\)/g;
    let match;
    while ((match = pattern.exec(content)) !== null) {
      results.push({
        author: match[1],
        year: parseInt(match[2], 10),
        page: match[3] ? parseInt(match[3], 10) : undefined,
      });
    }
    return results;
  }

  /**
   * Build system prompt for generation
   */
  private buildSystemPrompt(topic: string, customPrompt?: string): string {
    const lines: string[] = [];

    lines.push('You are an expert academic writer generating scholarly content.');
    lines.push('');
    lines.push('## Critical Rules (ZERO TOLERANCE — violations cause automatic rejection):');
    lines.push('1. ALWAYS use the citation_lookup tool before citing any author');
    lines.push('2. ONLY cite authors listed in "Available Corpus Authors" below. Do NOT cite ANY other scholar, even if you know them from training data.');
    lines.push('3. If a corpus chunk MENTIONS another scholar (e.g., "Modrak argues..."), cite the CHUNK AUTHOR (e.g., O\'Gorman), NOT the mentioned scholar.');
    lines.push('4. Use EXACT quotes from the corpus - do not paraphrase quotes');
    lines.push('5. Every attributed claim must be supported by corpus evidence');
    lines.push('6. If you cannot find corpus evidence, make the argument in your own voice WITHOUT attributing it to any scholar');
    lines.push('7. NEVER write "As X argues" or "X maintains" unless X is in the Available Corpus Authors list');
    lines.push('');
    lines.push(`## Topic: ${topic}`);
    lines.push('');

    if (this.config.stylePrompt) {
      lines.push('## Style Guidelines:');
      lines.push(this.config.stylePrompt);
      lines.push('');
    }

    lines.push('## Available Corpus Authors:');
    const authors = this.validator.getAvailableAuthors();
    for (const author of authors.slice(0, 20)) {
      lines.push(`- ${author}`);
    }
    if (authors.length > 20) {
      lines.push(`... and ${authors.length - 20} more`);
    }
    lines.push('');

    if (customPrompt) {
      lines.push('## Additional Instructions:');
      lines.push(customPrompt);
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Build prompt for a specific unit
   */
  private buildUnitPrompt(
    unit: GenerationUnit,
    priorContext: string,
    feedbackHistory: string[]
  ): string {
    const lines: string[] = [];

    lines.push(`## Generate: ${unit.type.toUpperCase()}`);
    lines.push('');
    lines.push(`**Intent:** ${unit.intent}`);
    lines.push('');

    if (unit.topics.length > 0) {
      lines.push(`**Key Topics:** ${unit.topics.join(', ')}`);
      lines.push('');
    }

    if (unit.targetWords) {
      lines.push(`**Target Length:** ~${unit.targetWords} words`);
      lines.push('');
    }

    if (unit.requiredSources && unit.requiredSources.length > 0) {
      lines.push(`**Must Cite:** ${unit.requiredSources.join(', ')}`);
      lines.push('');
    }

    if (priorContext) {
      lines.push('## Prior Content (for context and continuity):');
      lines.push('');
      lines.push(priorContext);
      lines.push('');
    }

    if (feedbackHistory.length > 0) {
      lines.push('## IMPORTANT - Previous Attempt Failed Validation:');
      lines.push('');
      lines.push(feedbackHistory[feedbackHistory.length - 1]);
      lines.push('');
      lines.push('Please address ALL issues above in your regeneration.');
      lines.push('');
    }

    lines.push('## Instructions:');
    lines.push('1. First use citation_lookup to find relevant evidence for your claims');
    lines.push('2. Write the paragraph using ONLY citations returned by citation_lookup');
    lines.push('3. Use exact quotes from the corpus - do not paraphrase');
    lines.push('4. Ensure smooth transitions and academic tone');
    lines.push('');
    lines.push('Now generate the content:');

    return lines.join('\n');
  }

  /**
   * Build context from prior validated units
   */
  private buildPriorContext(validatedUnits: ValidatedUnit[]): string {
    if (validatedUnits.length === 0) return '';

    // Take last 2-3 paragraphs for context
    const recentUnits = validatedUnits.slice(-3);
    const context = recentUnits.map(u => u.content).join('\n\n');

    // Truncate if too long
    if (context.length > 2000) {
      return '...' + context.slice(-2000);
    }

    return context;
  }

  /**
   * Create placeholder for failed unit
   */
  private createPlaceholder(
    unit: GenerationUnit,
    validationResult: InlineValidationResult | null
  ): string {
    const lines: string[] = [];
    lines.push(`[GENERATION FAILED: ${unit.type}]`);
    lines.push(`Intent: ${unit.intent}`);

    if (validationResult) {
      lines.push(`Last validation score: ${(validationResult.overallScore * 100).toFixed(1)}%`);
      const criticalIssues = validationResult.issues.filter(i => i.severity === 'critical');
      if (criticalIssues.length > 0) {
        lines.push(`Critical issues: ${criticalIssues.map(i => i.message).join('; ')}`);
      }
    }

    lines.push('[REQUIRES MANUAL REVIEW]');
    return lines.join('\n');
  }

  /**
   * Assemble document from validated units
   */
  private assembleDocument(units: ValidatedUnit[]): string {
    return units.map(u => u.content).join('\n\n');
  }

  /**
   * Build a quotation fidelity summary from validation result
   */
  private buildQuotationFidelitySummary(
    result: QuotationFidelityValidationResult
  ): QuotationFidelitySummary {
    const threshold = this.config.minQuotationFidelity ?? 0.95;

    return {
      totalQuotes: result.totalQuotations,
      verbatimQuotes: result.verbatim.length,
      nonVerbatimQuotes: result.nonVerbatim.length + result.unmatched.length,
      borderlineQuotes: result.borderline.length,
      fidelityRate: result.fidelityRate,
      verbatimMatchCount: result.verbatimMatchCount,
      normalizedMatchCount: result.normalizedMatchCount,
      verbatimRate: result.verbatimRate,
      normalizedRate: result.normalizedRate,
      borderlineCount: result.borderlineCount,
      failCount: result.failCount,
      borderlineRate: result.borderlineRate,
      nonVerbatimDetails: [
        ...result.nonVerbatim.map((nv) => ({
          quote: nv.quotation.text,
          similarity: nv.similarityScore,
          suggestedCorrection: nv.suggestedCorrection,
          line: nv.quotation.line,
        })),
        ...result.unmatched.map((um) => ({
          quote: um.quotation.text,
          similarity: 0,
          suggestedCorrection: undefined,
          line: um.quotation.line,
        })),
      ],
      borderlineDetails: result.borderline.map((bl) => ({
        quote: bl.quotation.text,
        rawSimilarity: bl.similarityScore,
        normalizedSimilarity: bl.normalizedSimilarityScore ?? bl.similarityScore,
        line: bl.quotation.line,
      })),
      passed: result.fidelityRate >= threshold,
    };
  }

  /**
   * Check if quotation fidelity passes the configured threshold
   *
   * Fix 17: Count borderline quotes (similarity >= threshold) as passing.
   * With OCR corpus text, 95% verbatim match is unrealistic because corpus
   * chunks contain page headers, running titles, and OCR artifacts. A 70%
   * threshold ensures the scholarly content is faithfully represented while
   * tolerating OCR noise in the source text.
   */
  private checkQuotationFidelity(summary: QuotationFidelitySummary): boolean {
    // If no quotes, pass by default
    if (summary.totalQuotes === 0) {
      return true;
    }

    // If rejection of non-verbatim quotes is disabled, pass
    if (!this.config.rejectNonVerbatimQuotes) {
      return true;
    }

    const threshold = this.config.minQuotationFidelity ?? 0.70;

    // Count verbatim + borderline as passing (borderline = between threshold and 0.95)
    const passingQuotes = summary.verbatimMatchCount + summary.borderlineCount;
    const passingRate = summary.totalQuotes > 0 ? passingQuotes / summary.totalQuotes : 1;

    // Pass if >= 70% of quotes are at least borderline-accurate
    return passingRate >= 0.70;
  }

  /**
   * Format quotation fidelity feedback for regeneration
   */
  private formatQuoteFidelityFeedback(summary: QuotationFidelitySummary): string {
    const threshold = this.config.minQuotationFidelity ?? 0.95;
    const lines: string[] = [];

    lines.push('## QUOTATION FIDELITY ERRORS - Non-Verbatim Quotes Detected');
    lines.push('');
    lines.push(`Your content contains ${summary.nonVerbatimQuotes} quote(s) that do not match the corpus verbatim.`);
    lines.push(`Required similarity threshold: ${(threshold * 100).toFixed(0)}%`);
    lines.push('');
    lines.push('### Non-Verbatim Quotes:');
    lines.push('');

    for (const detail of summary.nonVerbatimDetails) {
      const truncatedQuote = detail.quote.length > 60
        ? detail.quote.slice(0, 60) + '...'
        : detail.quote;

      lines.push(`- **Quote** (${(detail.similarity * 100).toFixed(0)}% match): "${truncatedQuote}"`);

      if (detail.suggestedCorrection) {
        const truncatedCorrection = detail.suggestedCorrection.length > 80
          ? detail.suggestedCorrection.slice(0, 80) + '...'
          : detail.suggestedCorrection;
        lines.push(`  **CORRECT TEXT from corpus**: "${truncatedCorrection}"`);
      } else {
        lines.push('  **No matching corpus text found** - remove this quote or verify source');
      }
      lines.push('');
    }

    lines.push('### Instructions:');
    lines.push('1. Use the citation_lookup tool to find the EXACT text from the corpus');
    lines.push('2. Copy quotes VERBATIM from the corpus - do not paraphrase');
    lines.push('3. If you cannot find an exact quote, paraphrase without quotation marks');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Create an outline from a topic
   */
  static createBasicOutline(
    topic: string,
    sections: string[],
    wordsPerSection: number = 300
  ): GenerationUnit[] {
    const outline: GenerationUnit[] = [];

    // Introduction
    outline.push({
      type: 'introduction',
      intent: `Introduce the topic: ${topic}. Establish the significance and preview the main arguments.`,
      topics: sections.slice(0, 3),
      targetWords: wordsPerSection,
    });

    // Body sections
    for (const section of sections) {
      outline.push({
        type: 'paragraph',
        intent: `Develop the argument about: ${section}`,
        topics: [section],
        targetWords: wordsPerSection,
        section,
      });
    }

    // Conclusion
    outline.push({
      type: 'conclusion',
      intent: `Synthesize the arguments and conclude: ${topic}`,
      topics: sections,
      targetWords: wordsPerSection,
    });

    return outline;
  }
}

/**
 * Create an InlineValidationOrchestrator
 */
export function createInlineValidationOrchestrator(
  generateFn: GenerateFn,
  retriever: CorpusRetriever,
  corpusChunks: ContextChunk[],
  corpusSources: CorpusSource[],
  config?: Partial<InlineGenerationConfig>
): InlineValidationOrchestrator {
  return new InlineValidationOrchestrator(
    generateFn,
    retriever,
    corpusChunks,
    corpusSources,
    config
  );
}
