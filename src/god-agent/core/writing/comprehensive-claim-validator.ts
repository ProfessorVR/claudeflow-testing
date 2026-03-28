/**
 * Comprehensive Claim Validator (Phase D)
 *
 * Orchestrates the complete claim validation pipeline:
 * 1. ClaimDetector - Extract and classify claims from text
 * 2. ClaimDecomposer - Break composite claims into atomic units
 * 3. ClaimVerifier - Verify claims against corpus with four-class verdicts
 *
 * Integrates with the inline validation system for per-paragraph validation
 * during generation, providing comprehensive hallucination prevention.
 */

import { ClaimDetector, DetectedClaim, DetectionContext, ClaimDetectorOptions } from './claim-detector.js';
import { ClaimDecomposer, AtomicClaim, DecompositionResult, DecomposerOptions } from './claim-decomposer.js';
import {
  ClaimVerifier,
  VerificationResult,
  CompositeVerificationResult,
  VerifierOptions,
  VerificationVerdict,
  CorpusRetriever,
} from './claim-verifier.js';
import type { ContextChunk } from './corpus-constraint-builder.js';
import type { CorpusSource } from './writing-generator.js';
import { ClaimProfile, RiskLevel, createDefaultProfile, StructureType, AttributionType, AssertionType, ModalityType } from './claim-profile.js';

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Configuration for comprehensive validation
 */
export interface ComprehensiveValidationConfig {
  /** Enable claim detection */
  enableDetection: boolean;
  /** Enable claim decomposition */
  enableDecomposition: boolean;
  /** Enable claim verification */
  enableVerification: boolean;

  /** Risk threshold for triggering verification (claims at or above this level) */
  riskThreshold: RiskLevel;

  /** Maximum claims to process per paragraph */
  maxClaimsPerParagraph: number;

  /** Whether to skip already-cited claims */
  skipCitedClaims: boolean;

  /** Whether to use LLM for semantic decomposition */
  useLLMDecomposition: boolean;

  /** Options for individual components */
  detectorOptions?: Partial<ClaimDetectorOptions>;
  decomposerOptions?: Partial<DecomposerOptions>;
  verifierOptions?: Partial<VerifierOptions>;

  /** Strict mode - fail on any unsupported claim */
  strictMode: boolean;

  /** Generate suggestions for unsupported claims */
  generateSuggestions: boolean;

  /** Timeout for LLM operations (ms) */
  llmTimeout: number;

  /** Corpus chunks for verification (optional, can also be passed per-validation) */
  corpusChunks?: ContextChunk[];

  /** Corpus sources for verification (optional) */
  corpusSources?: CorpusSource[];
}

/**
 * Result of validating a single claim through the full pipeline
 */
export interface ClaimValidationResult {
  /** Original detected claim */
  claim: DetectedClaim;

  /** Atomic units after decomposition (if decomposed) */
  atomicClaims?: AtomicClaim[];

  /** Verification results for atomic claims */
  atomicVerifications?: VerificationResult[];

  /** Overall verification result for the claim */
  verification: VerificationResult;

  /** Whether this claim requires a citation */
  requiresCitation: boolean;

  /** Whether the claim passed validation */
  passed: boolean;

  /** Suggestions for fixing issues */
  suggestions: string[];

  /** Processing metadata */
  metadata: {
    wasDecomposed: boolean;
    decompositionStrategy?: string;
    processingTimeMs: number;
    skipped: boolean;
    skipReason?: string;
  };
}

/**
 * Result of validating an entire paragraph
 */
export interface ParagraphValidationResult {
  /** Original paragraph text */
  text: string;

  /** All detected claims */
  detectedClaims: DetectedClaim[];

  /** Validation results for each claim */
  claimResults: ClaimValidationResult[];

  /** Overall paragraph verdict */
  verdict: ParagraphVerdict;

  /** Summary statistics */
  statistics: ValidationStatistics;

  /** High-level issues to address */
  issues: ValidationIssue[];

  /** Processing metadata */
  metadata: {
    processingTimeMs: number;
    claimsProcessed: number;
    claimsSkipped: number;
    decompositionsPerformed: number;
  };
}

/**
 * Possible verdicts for a paragraph
 */
export type ParagraphVerdict =
  | 'FULLY_SUPPORTED'      // All claims verified
  | 'MOSTLY_SUPPORTED'     // >80% claims verified
  | 'PARTIALLY_SUPPORTED'  // 50-80% claims verified
  | 'WEAKLY_SUPPORTED'     // <50% claims verified
  | 'UNSUPPORTED'          // No claims verified
  | 'CONTAINS_CONTRADICTIONS' // At least one contradiction found
  | 'NEEDS_REVIEW';        // Mixed or uncertain results

/**
 * Statistics for validation
 */
export interface ValidationStatistics {
  totalClaims: number;
  supported: number;
  partiallySupported: number;
  unsupported: number;
  contradicted: number;
  uncertain: number;
  skipped: number;

  /** Claims by risk level */
  byRiskLevel: Record<RiskLevel, number>;

  /** Claims requiring citations */
  requiresCitation: number;

  /** Claims with citations provided */
  hasCitation: number;

  /** Support percentage (0-1) */
  supportRatio: number;
}

/**
 * Issue identified during validation
 */
export interface ValidationIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: ValidationIssueType;
  message: string;
  claimIndex: number;
  suggestion?: string;
  affectedText: string;
}

export type ValidationIssueType =
  | 'unsupported_claim'
  | 'contradicted_claim'
  | 'missing_citation'
  | 'weak_evidence'
  | 'uncertain_verification'
  | 'decomposition_failed'
  | 'verification_failed';

/**
 * Context for validation (from inline validation system)
 */
export interface ValidationContext {
  /** Available corpus chunks for verification */
  corpusChunks: ContextChunk[];

  /** Section context */
  sectionTitle?: string;
  chapterTitle?: string;

  /** Previous paragraphs for context */
  previousParagraphs?: string[];

  /** Key terms and their definitions */
  termDefinitions?: Map<string, string>;

  /** Known authors in scope */
  knownAuthors?: string[];

  /** LLM client for semantic operations */
  llmClient?: LLMClient;
}

/**
 * Simple LLM client interface for semantic operations
 */
export interface LLMClient {
  complete(prompt: string, options?: { maxTokens?: number; temperature?: number }): Promise<string>;
}

// =============================================================================
// Default Configuration
// =============================================================================

export const DEFAULT_COMPREHENSIVE_CONFIG: ComprehensiveValidationConfig = {
  enableDetection: true,
  enableDecomposition: true,
  enableVerification: true,
  riskThreshold: 'medium',
  maxClaimsPerParagraph: 20,
  skipCitedClaims: false,
  useLLMDecomposition: false,
  strictMode: false,
  generateSuggestions: true,
  llmTimeout: 30000,
};

// =============================================================================
// ComprehensiveClaimValidator Class
// =============================================================================

/**
 * Orchestrates complete claim validation pipeline
 */
export class ComprehensiveClaimValidator {
  private detector: ClaimDetector;
  private decomposer: ClaimDecomposer;
  private verifier: ClaimVerifier;
  private config: ComprehensiveValidationConfig;

  constructor(config: Partial<ComprehensiveValidationConfig> = {}) {
    this.config = { ...DEFAULT_COMPREHENSIVE_CONFIG, ...config };

    // Initialize components
    this.detector = new ClaimDetector(this.config.detectorOptions);
    this.decomposer = new ClaimDecomposer(this.config.decomposerOptions);

    // Create simple in-memory retriever for verification
    const corpusChunks = this.config.corpusChunks ?? [];
    const corpusSources = this.config.corpusSources ?? [];
    const simpleRetriever: CorpusRetriever = {
      async search(query: string, options?: { topK?: number; author?: string }) {
        const filtered = options?.author
          ? corpusChunks.filter(c => c.metadata?.author === options.author)
          : corpusChunks;
        return filtered.slice(0, options?.topK ?? 10);
      },
    };

    this.verifier = new ClaimVerifier(
      simpleRetriever,
      corpusChunks,
      corpusSources,
      this.config.verifierOptions
    );
  }

  /**
   * Validate a paragraph through the complete pipeline
   */
  async validateParagraph(
    text: string,
    context: ValidationContext
  ): Promise<ParagraphValidationResult> {
    const startTime = Date.now();

    // Phase 1: Detect claims
    const detectionContext: DetectionContext = {
      knownAuthors: context.knownAuthors,
    };

    const detectedClaims = this.config.enableDetection
      ? await this.detector.detectClaims(text, detectionContext)
      : [];

    // Process each claim
    const claimResults: ClaimValidationResult[] = [];
    let claimsSkipped = 0;
    let decompositionsPerformed = 0;

    const claimsToProcess = detectedClaims.slice(0, this.config.maxClaimsPerParagraph);

    for (const claim of claimsToProcess) {
      const claimResult = await this.validateSingleClaim(claim, context);
      claimResults.push(claimResult);

      if (claimResult.metadata.skipped) {
        claimsSkipped++;
      }
      if (claimResult.metadata.wasDecomposed) {
        decompositionsPerformed++;
      }
    }

    // Calculate statistics
    const statistics = this.calculateStatistics(claimResults);

    // Determine paragraph verdict
    const verdict = this.determineParagraphVerdict(statistics, claimResults);

    // Collect issues
    const issues = this.collectIssues(claimResults);

    return {
      text,
      detectedClaims,
      claimResults,
      verdict,
      statistics,
      issues,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        claimsProcessed: claimResults.length,
        claimsSkipped,
        decompositionsPerformed,
      },
    };
  }

  /**
   * Validate a single claim through the pipeline
   */
  async validateSingleClaim(
    claim: DetectedClaim,
    context: ValidationContext
  ): Promise<ClaimValidationResult> {
    const startTime = Date.now();

    // Check if should skip
    const skipResult = this.shouldSkipClaim(claim);
    if (skipResult.skip) {
      return {
        claim,
        verification: this.createSkippedVerification(claim),
        requiresCitation: this.claimRequiresCitation(claim),
        passed: true,
        suggestions: [],
        metadata: {
          wasDecomposed: false,
          processingTimeMs: Date.now() - startTime,
          skipped: true,
          skipReason: skipResult.reason,
        },
      };
    }

    // Phase 2: Decompose if enabled and claim is composite
    let atomicClaims: AtomicClaim[] | undefined;
    let decompositionStrategy: string | undefined;

    if (this.config.enableDecomposition && this.isCompositeClaim(claim)) {
      const decomposition = this.config.useLLMDecomposition && context.llmClient
        ? await this.decomposer.dynamicDecompose(claim, async (_atomic: AtomicClaim) => {
            const result = await this.verifier.verify(_atomic);
            return result.confidence;
          })
        : await this.decomposer.decompose(claim);

      if (decomposition.atomicClaims.length > 1) {
        atomicClaims = decomposition.atomicClaims;
        decompositionStrategy = decomposition.decompositionStrategy;
      }
    }

    // Phase 3: Verify claim(s)
    let verification: VerificationResult;
    let atomicVerifications: Array<{ atomic: AtomicClaim; result: VerificationResult }> | undefined;

    if (this.config.enableVerification) {
      if (atomicClaims && atomicClaims.length > 1) {
        // Verify decomposed claims
        const compositeResult = await this.verifier.verifyWithDecomposition(claim);
        verification = {
          verdict: compositeResult.aggregatedVerdict,
          confidence: compositeResult.overallConfidence,
          evidence: [],
          reasoning: compositeResult.combinedReasoning,
          suggestions: [],
          metrics: { chunksSearched: 0, potentialMatches: 0, timeTakenMs: 0, authorConstrained: false },
        };
        atomicVerifications = compositeResult.atomicResults;
      } else {
        // Verify single claim
        verification = await this.verifier.verify(claim);
      }
    } else {
      verification = this.createUnverifiedResult(claim);
    }

    // Determine if passed
    const requiresCitation = this.claimRequiresCitation(claim);
    const passed = this.claimPassed(verification, requiresCitation, claim);

    // Generate suggestions
    const extractedVerifications = atomicVerifications?.map(v => v.result);
    const suggestions = this.config.generateSuggestions
      ? this.generateClaimSuggestions(claim, verification, extractedVerifications)
      : [];

    return {
      claim,
      atomicClaims,
      atomicVerifications: extractedVerifications,
      verification,
      requiresCitation,
      passed,
      suggestions,
      metadata: {
        wasDecomposed: !!atomicClaims && atomicClaims.length > 1,
        decompositionStrategy,
        processingTimeMs: Date.now() - startTime,
        skipped: false,
      },
    };
  }

  /**
   * Quick validation - detection and risk assessment only (no corpus lookup)
   */
  async quickValidate(text: string, context?: Partial<DetectionContext>): Promise<{
    claims: DetectedClaim[];
    highRiskClaims: DetectedClaim[];
    citationNeeded: DetectedClaim[];
  }> {
    const claims = await this.detector.detectClaims(text, context);

    const highRiskClaims = claims.filter(c =>
      c.riskLevel === 'critical' || c.riskLevel === 'high'
    );

    const citationNeeded = claims.filter(c => this.claimRequiresCitation(c));

    return { claims, highRiskClaims, citationNeeded };
  }

  /**
   * Batch validate multiple paragraphs
   */
  async validateParagraphs(
    paragraphs: string[],
    context: ValidationContext
  ): Promise<{
    results: ParagraphValidationResult[];
    summary: BatchValidationSummary;
  }> {
    const results: ParagraphValidationResult[] = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraphContext: ValidationContext = {
        ...context,
        previousParagraphs: paragraphs.slice(0, i),
      };

      const result = await this.validateParagraph(paragraphs[i], paragraphContext);
      results.push(result);
    }

    const summary = this.createBatchSummary(results);

    return { results, summary };
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  private shouldSkipClaim(claim: DetectedClaim): { skip: boolean; reason?: string } {
    // Skip claims below risk threshold
    const riskOrder: RiskLevel[] = ['low', 'medium', 'high', 'critical'];
    const claimRiskIndex = riskOrder.indexOf(claim.riskLevel);
    const thresholdIndex = riskOrder.indexOf(this.config.riskThreshold);

    if (claimRiskIndex < thresholdIndex) {
      return { skip: true, reason: `Risk level ${claim.riskLevel} below threshold ${this.config.riskThreshold}` };
    }

    // Skip already-cited claims if configured
    if (this.config.skipCitedClaims && this.hasCitation(claim)) {
      return { skip: true, reason: 'Claim already has citation' };
    }

    return { skip: false };
  }

  private hasCitation(claim: DetectedClaim): boolean {
    // Check if claim text contains citation markers
    const citationPatterns = [
      /\([^)]+\d{4}[a-z]?\)/,  // (Author 2020)
      /\[\d+\]/,               // [1]
      /\{[^}]+\}/,             // {citation}
      /as .+ (argues|observes|notes|suggests|states|maintains)/i,
    ];

    return citationPatterns.some(p => p.test(claim.text));
  }

  private isCompositeClaim(claim: DetectedClaim): boolean {
    // Check structure axis
    if (claim.profile.structure.type === StructureType.CONJUNCTIVE ||
        claim.profile.structure.type === StructureType.INFERENTIAL) {
      return true;
    }

    // Check for conjunctions
    const conjunctionPattern = /\b(however|moreover|furthermore|additionally|while|whereas|although|therefore|thus|hence|consequently)\b/i;
    return conjunctionPattern.test(claim.text);
  }

  private claimRequiresCitation(claim: DetectedClaim): boolean {
    // Attributed claims need citation verification
    if (claim.profile.attribution.type !== AttributionType.NONE) {
      return true;
    }

    // High-risk claims need citations
    if (claim.riskLevel === 'critical' || claim.riskLevel === 'high') {
      return true;
    }

    // Factual assertions need citations
    if (claim.profile.assertion.type === AssertionType.FACTUAL) {
      return true;
    }

    // Modal and dependency claims need citations
    if (claim.profile.assertion.type === AssertionType.MODAL ||
        claim.profile.assertion.type === AssertionType.DEPENDENCY) {
      return true;
    }

    return false;
  }

  private claimPassed(
    verification: VerificationResult,
    requiresCitation: boolean,
    claim: DetectedClaim
  ): boolean {
    // Contradicted claims always fail
    if (verification.verdict === 'CONTRADICTED') {
      return false;
    }

    // In strict mode, only SUPPORTED passes
    if (this.config.strictMode) {
      return verification.verdict === 'SUPPORTED';
    }

    // For claims requiring citation, SUPPORTED or PARTIALLY_SUPPORTED passes
    if (requiresCitation) {
      return verification.verdict === 'SUPPORTED' ||
             verification.verdict === 'PARTIALLY_SUPPORTED';
    }

    // For low-risk claims, UNCERTAIN is acceptable
    if (claim.riskLevel === 'low') {
      return verification.verdict !== 'UNSUPPORTED';
    }

    return verification.verdict === 'SUPPORTED' ||
           verification.verdict === 'PARTIALLY_SUPPORTED';
  }

  private createSkippedVerification(claim: DetectedClaim): VerificationResult {
    return {
      verdict: 'UNCERTAIN',
      confidence: 0,
      evidence: [],
      reasoning: 'Claim was skipped based on configuration',
      metrics: {
        chunksSearched: 0,
        potentialMatches: 0,
        timeTakenMs: 0,
        authorConstrained: false,
      },
    };
  }

  private createUnverifiedResult(claim: DetectedClaim): VerificationResult {
    return {
      verdict: 'UNCERTAIN',
      confidence: 0,
      evidence: [],
      reasoning: 'Verification disabled',
      metrics: {
        chunksSearched: 0,
        potentialMatches: 0,
        timeTakenMs: 0,
        authorConstrained: false,
      },
    };
  }

  private generateClaimSuggestions(
    claim: DetectedClaim,
    verification: VerificationResult,
    atomicVerifications?: VerificationResult[]
  ): string[] {
    const suggestions: string[] = [];

    switch (verification.verdict) {
      case 'UNSUPPORTED':
        suggestions.push('Consider adding a citation from your corpus to support this claim.');
        if (claim.profile.assertion.type === AssertionType.FACTUAL) {
          suggestions.push('Rephrase as a tentative or interpretive claim if no source available.');
        }
        break;

      case 'CONTRADICTED':
        suggestions.push('This claim contradicts evidence in your corpus. Review and revise.');
        if (verification.evidence.length > 0) {
          const source = verification.evidence[0].chunk.metadata?.source ?? verification.evidence[0].matchingSnippet;
          suggestions.push(`Contradicting evidence found in: ${source}`);
        }
        break;

      case 'PARTIALLY_SUPPORTED':
        suggestions.push('Some aspects of this claim are supported, but others need verification.');
        if (atomicVerifications) {
          const unsupported = atomicVerifications.filter(v =>
            v.verdict === 'UNSUPPORTED' || v.verdict === 'UNCERTAIN'
          );
          if (unsupported.length > 0) {
            suggestions.push(`${unsupported.length} sub-claim(s) need additional support.`);
          }
        }
        break;

      case 'UNCERTAIN':
        suggestions.push('Unable to verify this claim against available corpus.');
        if (this.claimRequiresCitation(claim)) {
          suggestions.push('Add an explicit citation to ensure proper attribution.');
        }
        break;
    }

    // Add claim-type specific suggestions
    if (claim.profile.attribution.type === AttributionType.DIRECT) {
      suggestions.push('Ensure quoted text matches source exactly.');
    }

    if (claim.profile.modality.type === ModalityType.ASSERTED) {
      suggestions.push('Strong modal claims (must, necessarily) require strong evidence.');
    }

    return suggestions;
  }

  private calculateStatistics(results: ClaimValidationResult[]): ValidationStatistics {
    const stats: ValidationStatistics = {
      totalClaims: results.length,
      supported: 0,
      partiallySupported: 0,
      unsupported: 0,
      contradicted: 0,
      uncertain: 0,
      skipped: 0,
      byRiskLevel: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      },
      requiresCitation: 0,
      hasCitation: 0,
      supportRatio: 0,
    };

    for (const result of results) {
      // Count by verdict
      if (result.metadata.skipped) {
        stats.skipped++;
      } else {
        switch (result.verification.verdict) {
          case 'SUPPORTED': stats.supported++; break;
          case 'PARTIALLY_SUPPORTED': stats.partiallySupported++; break;
          case 'UNSUPPORTED': stats.unsupported++; break;
          case 'CONTRADICTED': stats.contradicted++; break;
          case 'UNCERTAIN': stats.uncertain++; break;
          case 'BLOCKED': stats.skipped++; break;
        }
      }

      // Count by risk level
      stats.byRiskLevel[result.claim.riskLevel]++;

      // Count citation status
      if (result.requiresCitation) {
        stats.requiresCitation++;
      }
      if (this.hasCitation(result.claim)) {
        stats.hasCitation++;
      }
    }

    // Calculate support ratio
    const verifiedClaims = stats.totalClaims - stats.skipped - stats.uncertain;
    if (verifiedClaims > 0) {
      stats.supportRatio = (stats.supported + stats.partiallySupported * 0.5) / verifiedClaims;
    }

    // If all claims are uncertain, flag for review rather than defaulting to 0 support
    if (stats.uncertain === stats.totalClaims && stats.totalClaims > 0) {
      stats.supportRatio = -1; // Sentinel: all claims uncertain, needs manual review
    }

    return stats;
  }

  private determineParagraphVerdict(
    stats: ValidationStatistics,
    results: ClaimValidationResult[]
  ): ParagraphVerdict {
    // Check for contradictions
    if (stats.contradicted > 0) {
      return 'CONTAINS_CONTRADICTIONS';
    }

    // No verified claims
    if (stats.totalClaims === 0 || stats.totalClaims === stats.skipped) {
      return 'FULLY_SUPPORTED'; // Nothing to verify
    }

    // Calculate effective support
    const verifiableClaims = stats.totalClaims - stats.skipped;
    if (verifiableClaims === 0) {
      return 'FULLY_SUPPORTED';
    }

    // High uncertainty
    if (stats.uncertain > verifiableClaims * 0.5) {
      return 'NEEDS_REVIEW';
    }

    // Calculate support percentage
    const supportPercentage = stats.supportRatio;

    if (supportPercentage >= 0.95) {
      return 'FULLY_SUPPORTED';
    } else if (supportPercentage >= 0.8) {
      return 'MOSTLY_SUPPORTED';
    } else if (supportPercentage >= 0.5) {
      return 'PARTIALLY_SUPPORTED';
    } else if (supportPercentage > 0) {
      return 'WEAKLY_SUPPORTED';
    } else {
      return 'UNSUPPORTED';
    }
  }

  private collectIssues(results: ClaimValidationResult[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    for (let i = 0; i < results.length; i++) {
      const result = results[i];

      if (result.metadata.skipped) continue;

      const verdict = result.verification.verdict;

      if (verdict === 'CONTRADICTED') {
        issues.push({
          severity: 'critical',
          type: 'contradicted_claim',
          message: 'Claim contradicts evidence in corpus',
          claimIndex: i,
          suggestion: result.suggestions[0],
          affectedText: result.claim.text,
        });
      } else if (verdict === 'UNSUPPORTED' && result.requiresCitation) {
        issues.push({
          severity: 'high',
          type: 'unsupported_claim',
          message: 'Claim requires citation but no supporting evidence found',
          claimIndex: i,
          suggestion: result.suggestions[0],
          affectedText: result.claim.text,
        });
      } else if (verdict === 'UNSUPPORTED') {
        issues.push({
          severity: 'medium',
          type: 'unsupported_claim',
          message: 'Claim not supported by corpus',
          claimIndex: i,
          suggestion: result.suggestions[0],
          affectedText: result.claim.text,
        });
      } else if (result.requiresCitation && !this.hasCitation(result.claim)) {
        issues.push({
          severity: 'medium',
          type: 'missing_citation',
          message: 'Claim should have explicit citation',
          claimIndex: i,
          suggestion: 'Add citation to support this claim',
          affectedText: result.claim.text,
        });
      } else if (verdict === 'PARTIALLY_SUPPORTED') {
        issues.push({
          severity: 'low',
          type: 'weak_evidence',
          message: 'Claim only partially supported',
          claimIndex: i,
          suggestion: result.suggestions[0],
          affectedText: result.claim.text,
        });
      } else if (verdict === 'UNCERTAIN') {
        issues.push({
          severity: 'low',
          type: 'uncertain_verification',
          message: 'Unable to verify claim',
          claimIndex: i,
          suggestion: result.suggestions[0],
          affectedText: result.claim.text,
        });
      }
    }

    // Sort by severity
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    return issues;
  }

  private createBatchSummary(results: ParagraphValidationResult[]): BatchValidationSummary {
    const verdictCounts: Record<ParagraphVerdict, number> = {
      'FULLY_SUPPORTED': 0,
      'MOSTLY_SUPPORTED': 0,
      'PARTIALLY_SUPPORTED': 0,
      'WEAKLY_SUPPORTED': 0,
      'UNSUPPORTED': 0,
      'CONTAINS_CONTRADICTIONS': 0,
      'NEEDS_REVIEW': 0,
    };

    let totalClaims = 0;
    let totalIssues = 0;
    let criticalIssues = 0;

    for (const result of results) {
      verdictCounts[result.verdict]++;
      totalClaims += result.statistics.totalClaims;
      totalIssues += result.issues.length;
      criticalIssues += result.issues.filter(i => i.severity === 'critical').length;
    }

    // Calculate overall health
    const passedParagraphs = verdictCounts['FULLY_SUPPORTED'] + verdictCounts['MOSTLY_SUPPORTED'];
    const overallHealth = results.length > 0 ? passedParagraphs / results.length : 1;

    return {
      paragraphCount: results.length,
      verdictCounts,
      totalClaims,
      totalIssues,
      criticalIssues,
      overallHealth,
      recommendation: this.generateBatchRecommendation(overallHealth, criticalIssues),
    };
  }

  private generateBatchRecommendation(health: number, criticalIssues: number): string {
    if (criticalIssues > 0) {
      return `CRITICAL: ${criticalIssues} contradiction(s) found. Review and revise before proceeding.`;
    }

    if (health >= 0.9) {
      return 'Validation passed. Minor improvements may enhance quality.';
    } else if (health >= 0.7) {
      return 'Mostly validated. Review medium-severity issues before finalizing.';
    } else if (health >= 0.5) {
      return 'Partial validation. Significant revision needed to meet quality standards.';
    } else {
      return 'Validation failed. Major revision required. Consider reviewing corpus coverage.';
    }
  }

  // ===========================================================================
  // Configuration Methods
  // ===========================================================================

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ComprehensiveValidationConfig>): void {
    this.config = { ...this.config, ...config };

    // Reinitialize components if their options changed
    if (config.detectorOptions) {
      this.detector = new ClaimDetector({ ...this.config.detectorOptions });
    }
    if (config.decomposerOptions) {
      this.decomposer = new ClaimDecomposer({ ...this.config.decomposerOptions });
    }
    if (config.verifierOptions) {
      const corpusChunks = this.config.corpusChunks ?? [];
      const corpusSources = this.config.corpusSources ?? [];
      const simpleRetriever: CorpusRetriever = {
        async search(query: string, options?: { topK?: number; author?: string }) {
          const filtered = options?.author
            ? corpusChunks.filter(c => c.metadata?.author === options.author)
            : corpusChunks;
          return filtered.slice(0, options?.topK ?? 10);
        },
      };
      this.verifier = new ClaimVerifier(
        simpleRetriever,
        corpusChunks,
        corpusSources,
        { ...this.config.verifierOptions }
      );
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): ComprehensiveValidationConfig {
    return { ...this.config };
  }

  /**
   * Get component instances for direct access
   */
  getComponents(): {
    detector: ClaimDetector;
    decomposer: ClaimDecomposer;
    verifier: ClaimVerifier;
  } {
    return {
      detector: this.detector,
      decomposer: this.decomposer,
      verifier: this.verifier,
    };
  }
}

// =============================================================================
// Batch Validation Summary
// =============================================================================

export interface BatchValidationSummary {
  paragraphCount: number;
  verdictCounts: Record<ParagraphVerdict, number>;
  totalClaims: number;
  totalIssues: number;
  criticalIssues: number;
  overallHealth: number;
  recommendation: string;
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Create a comprehensive validator with default config
 */
export function createComprehensiveValidator(
  config?: Partial<ComprehensiveValidationConfig>
): ComprehensiveClaimValidator {
  return new ComprehensiveClaimValidator(config);
}

/**
 * Create a strict validator for academic writing
 */
export function createStrictAcademicValidator(): ComprehensiveClaimValidator {
  return new ComprehensiveClaimValidator({
    strictMode: true,
    riskThreshold: 'low',
    skipCitedClaims: false,
    enableDecomposition: true,
    enableVerification: true,
    generateSuggestions: true,
  });
}

/**
 * Create a lenient validator for drafts
 */
export function createDraftValidator(): ComprehensiveClaimValidator {
  return new ComprehensiveClaimValidator({
    strictMode: false,
    riskThreshold: 'high',
    skipCitedClaims: true,
    enableDecomposition: false,
    enableVerification: true,
    generateSuggestions: true,
  });
}

/**
 * Create a quick validator (detection only, no verification)
 */
export function createQuickValidator(): ComprehensiveClaimValidator {
  return new ComprehensiveClaimValidator({
    enableDetection: true,
    enableDecomposition: false,
    enableVerification: false,
    generateSuggestions: false,
  });
}
