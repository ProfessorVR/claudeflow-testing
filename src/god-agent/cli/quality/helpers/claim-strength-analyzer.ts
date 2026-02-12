/**
 * ClaimStrengthAnalyzer - Context-aware claim strength evaluation
 *
 * Phase 2 Enhancement #2:
 * - Tracks argumentative buildup across paragraphs
 * - Calculates cumulative evidence support for claims
 * - Determines when strong claim language is warranted vs. when hedging is needed
 * - Allows strong claims after extensive prior argumentation
 *
 * Target: Reduce claim strength false positives from ~15 to <5
 */

// ============================================================================
// Types
// ============================================================================

export interface ArgumentContext {
  paragraphIndex: number;
  evidenceItems: string[];
  supportingClaims: string[];
  cumulativeScore: number;
  citationCount: number;
}

export interface Premise {
  paragraphIndex: number;
  text: string;
  type: 'major' | 'minor' | 'assumption';
}

export interface Evidence {
  paragraphIndex: number;
  text: string;
  strength: 'weak' | 'moderate' | 'strong';
  hasCitation: boolean;
}

export interface Conclusion {
  paragraphIndex: number;
  text: string;
  supportScore: number;
}

export interface ArgumentChain {
  topic: string;
  premises: Premise[];
  evidence: Evidence[];
  intermediateConclusions: Conclusion[];
  supportScore: number; // 0-1 scale
}

export interface SupportScore {
  score: number; // 0-1 scale
  evidenceCount: number;
  citationCount: number;
  premiseCount: number;
  chain: ArgumentChain | null;
}

export interface ClaimStrengthEvaluation {
  isWarranted: boolean;
  suggestedStrength: 'strong' | 'moderate' | 'hedged';
  supportScore: number;
  reason: string;
  recommendation?: string;
}

export interface ClaimStrengthConfig {
  strongClaimThreshold: number; // Default: 0.7 (70% support)
  moderateClaimThreshold: number; // Default: 0.4
  strictMode: boolean;
  // Phase 2 Optimization: Position-aware thresholds
  openingClaimThreshold: number; // Default: 0.8 (higher bar for opening claims)
  midArgumentThreshold: number; // Default: 0.6 (medium bar for mid-argument)
  culminationThreshold: number; // Default: 0.5 (lower bar for culminating conclusions)
}

export interface ParagraphAnalysis {
  index: number;
  text: string;
  sentences: string[];
  hasEvidence: boolean;
  hasClaim: boolean;
  citationCount: number;
}

// ============================================================================
// Pattern Constants
// ============================================================================

/**
 * Strong claim language patterns that require high support
 */
const STRONG_CLAIM_PATTERNS = [
  { pattern: /\b(clearly)\b/i, strength: 'strong' as const },
  { pattern: /\b(obviously)\b/i, strength: 'strong' as const },
  { pattern: /\b(undoubtedly)\b/i, strength: 'strong' as const },
  { pattern: /\b(unquestionably)\b/i, strength: 'strong' as const },
  { pattern: /\b(certainly)\b/i, strength: 'strong' as const },
  { pattern: /\b(definitively)\b/i, strength: 'strong' as const },
  { pattern: /\b(unmistakably)\b/i, strength: 'strong' as const },
  { pattern: /\b(it\s+is\s+(clear|evident|obvious)\s+that)\b/i, strength: 'strong' as const },
  { pattern: /\b(demonstrates?\s+beyond\s+doubt)\b/i, strength: 'strong' as const },
  { pattern: /\b(there\s+is\s+no\s+doubt)\b/i, strength: 'strong' as const },
  { pattern: /\b(indisputably)\b/i, strength: 'strong' as const },
  { pattern: /\b(incontrovertibly)\b/i, strength: 'strong' as const },
];

/**
 * Evidence accumulation markers indicating buildup
 */
const EVIDENCE_ACCUMULATION_MARKERS = [
  /\b(moreover)\b/i,
  /\b(furthermore)\b/i,
  /\b(additionally)\b/i,
  /\b(in\s+addition)\b/i,
  /\b(building\s+on\s+this)\b/i,
  /\b(this\s+is\s+further\s+supported\s+by)\b/i,
  /\b(compounding\s+this)\b/i,
  /\b(adding\s+to\s+this)\b/i,
  /\b(what\s+is\s+more)\b/i,
];

/**
 * Culminating conclusion markers indicating synthesis
 */
const CONCLUSION_MARKERS = [
  /\b(therefore)\b/i,
  /\b(thus)\b/i,
  /\b(hence)\b/i,
  /\b(in\s+conclusion)\b/i,
  /\b(we\s+can\s+now\s+(conclude|see|understand))\b/i,
  /\b(this\s+(establishes?|proves?)\s+that)\b/i,
  /\b(the\s+cumulative\s+evidence)\b/i,
  /\b(taken\s+together)\b/i,
  /\b(in\s+sum)\b/i,
  /\b(it\s+follows\s+that)\b/i,
];

/**
 * Evidence indicator patterns
 */
const EVIDENCE_PATTERNS = [
  /\b(evidence\s+(for|shows?|demonstrates?))\b/i,
  /\b(data\s+(shows?|demonstrates?|indicates?))\b/i,
  /\b(research\s+(shows?|demonstrates?|finds?))\b/i,
  /\b(studies\s+(show|demonstrate|indicate|find))\b/i,
  /\b(for\s+(example|instance))\b/i,
  /\b(as\s+demonstrated\s+by)\b/i,
  /\b(according\s+to)\b/i,
  /\b(\(\s*\d{4}\s*\))/i, // Citation year
  /\b(\w+\s+et\s+al\.)/i, // et al. citation
];

/**
 * Citation patterns to count supporting citations
 */
const CITATION_PATTERNS = [
  /\([^)]*\d{4}[^)]*\)/g, // (Author, 2020) or (2020)
  /\[\d+\]/g, // [1], [2]
  /\w+\s+et\s+al\./gi, // Author et al.
];

// ============================================================================
// ClaimStrengthAnalyzer Class
// ============================================================================

/**
 * Analyzes claim strength in context of argumentative buildup
 */
export class ClaimStrengthAnalyzer {
  private argumentChains: Map<string, ArgumentChain> = new Map();
  private evidenceAccumulation: Map<number, ArgumentContext> = new Map();
  private config: ClaimStrengthConfig;

  constructor(config?: Partial<ClaimStrengthConfig>) {
    this.config = {
      strongClaimThreshold: 0.7,
      moderateClaimThreshold: 0.4,
      strictMode: false,
      // Phase 2 Optimization: Position-aware defaults
      openingClaimThreshold: 0.8, // Higher bar for opening claims (little buildup)
      midArgumentThreshold: 0.6, // Medium bar for mid-argument claims
      culminationThreshold: 0.5, // Lower bar for culminating conclusions (lots of buildup)
      ...config,
    };
  }

  /**
   * Analyze chapter to build argument chains
   * Call this before evaluating individual claims
   */
  analyzeChapter(paragraphAnalyses: ParagraphAnalysis[]): void {
    // Build evidence accumulation context for each paragraph
    for (let i = 0; i < paragraphAnalyses.length; i++) {
      const analysis = paragraphAnalyses[i];

      // Look back up to 5 paragraphs for evidence
      const lookbackStart = Math.max(0, i - 5);
      const priorParagraphs = paragraphAnalyses.slice(lookbackStart, i);

      // Count evidence items from prior paragraphs
      const evidenceItems: string[] = [];
      const supportingClaims: string[] = [];
      let citationCount = 0;

      for (const priorAnalysis of priorParagraphs) {
        if (priorAnalysis.hasEvidence) {
          evidenceItems.push(priorAnalysis.text);
        }
        if (priorAnalysis.hasClaim) {
          supportingClaims.push(priorAnalysis.text);
        }
        citationCount += priorAnalysis.citationCount;
      }

      // Calculate cumulative support score
      const cumulativeScore = this.calculateCumulativeScore(
        evidenceItems.length,
        supportingClaims.length,
        citationCount,
        priorParagraphs.length
      );

      // Store context
      this.evidenceAccumulation.set(i, {
        paragraphIndex: i,
        evidenceItems,
        supportingClaims,
        cumulativeScore,
        citationCount,
      });
    }
  }

  /**
   * Calculate cumulative support score
   * Returns score 0-1 based on evidence, claims, and citations
   */
  private calculateCumulativeScore(
    evidenceCount: number,
    claimCount: number,
    citationCount: number,
    paragraphCount: number
  ): number {
    if (paragraphCount === 0) return 0;

    // Normalize counts (cap at reasonable maximums)
    const normalizedEvidence = Math.min(evidenceCount / 5, 1); // Max 5 evidence items
    const normalizedClaims = Math.min(claimCount / 3, 1); // Max 3 supporting claims
    const normalizedCitations = Math.min(citationCount / 4, 1); // Max 4 citations

    // Weighted combination
    const score =
      normalizedEvidence * 0.4 +
      normalizedCitations * 0.3 +
      normalizedClaims * 0.2 +
      (paragraphCount >= 3 ? 0.1 : 0); // Bonus for sustained argument

    return Math.min(score, 1);
  }

  /**
   * Calculate evidence support for a claim at given position
   */
  calculateSupportScore(
    paragraphIndex: number,
    claimText: string
  ): SupportScore {
    const context = this.evidenceAccumulation.get(paragraphIndex);

    if (!context) {
      return {
        score: 0,
        evidenceCount: 0,
        citationCount: 0,
        premiseCount: 0,
        chain: null,
      };
    }

    return {
      score: context.cumulativeScore,
      evidenceCount: context.evidenceItems.length,
      citationCount: context.citationCount,
      premiseCount: context.supportingClaims.length,
      chain: null, // Could build full chain if needed
    };
  }

  /**
   * Evaluate if strong claim language is warranted
   * Phase 2 Optimization: Position-aware and citation-density-aware thresholds
   */
  evaluateClaimStrength(
    claim: string,
    paragraphIndex: number,
    context: string,
    totalParagraphs?: number
  ): ClaimStrengthEvaluation {
    // Check if this is a strong claim
    const hasStrongLanguage = STRONG_CLAIM_PATTERNS.some(p =>
      p.pattern.test(claim)
    );

    if (!hasStrongLanguage) {
      // Not a strong claim - no evaluation needed
      return {
        isWarranted: true,
        suggestedStrength: 'moderate',
        supportScore: 0,
        reason: 'Claim uses moderate language',
      };
    }

    // Get support score
    const supportScore = this.calculateSupportScore(paragraphIndex, claim);

    // Phase 2: Determine claim position (opening/mid/culminating)
    const position = totalParagraphs
      ? this.detectClaimPosition(paragraphIndex, totalParagraphs)
      : 'developing';

    // Check if this is a culminating conclusion
    const isCulminatingConclusion = CONCLUSION_MARKERS.some(pattern =>
      pattern.test(context)
    );

    // Phase 2: Apply position-aware thresholds
    let threshold: number;
    if (isCulminatingConclusion || position === 'culminating') {
      threshold = this.config.culminationThreshold; // Lower bar (0.5)
    } else if (position === 'opening') {
      threshold = this.config.openingClaimThreshold; // Higher bar (0.8)
    } else {
      threshold = this.config.midArgumentThreshold; // Medium bar (0.6)
    }

    // Strict mode increases all thresholds
    if (this.config.strictMode) {
      threshold += 0.1;
    }

    // Phase 2: Citation density bonus
    const citationDensityBonus = this.calculateCitationDensityBonus(supportScore.citationCount);
    const adjustedScore = Math.min(supportScore.score + citationDensityBonus, 1.0);

    if (adjustedScore >= threshold) {
      // Strong language is warranted
      return {
        isWarranted: true,
        suggestedStrength: 'strong',
        supportScore: adjustedScore,
        reason: `Strong claim warranted (position: ${position}, support: ${adjustedScore.toFixed(2)}, threshold: ${threshold.toFixed(2)})`,
      };
    } else if (
      adjustedScore >= this.config.moderateClaimThreshold &&
      isCulminatingConclusion
    ) {
      // Moderate support but this is a conclusion - allow with caution
      return {
        isWarranted: true,
        suggestedStrength: 'moderate',
        supportScore: adjustedScore,
        reason: 'Culminating conclusion with moderate support',
        recommendation:
          'Consider slightly softening language to match support level',
      };
    } else if (adjustedScore >= this.config.moderateClaimThreshold) {
      // Moderate support - suggest softer language
      return {
        isWarranted: false,
        suggestedStrength: 'moderate',
        supportScore: adjustedScore,
        reason: `Support score (${adjustedScore.toFixed(2)}) below threshold for ${position} claims (${threshold.toFixed(2)})`,
        recommendation:
          'Soften language (e.g., "suggests" instead of "clearly shows") or add more evidence',
      };
    } else {
      // Low support - definitely needs hedging
      return {
        isWarranted: false,
        suggestedStrength: 'hedged',
        supportScore: adjustedScore,
        reason: `Insufficient support (${adjustedScore.toFixed(2)}) for strong ${position} claim`,
        recommendation:
          'Use hedging language (e.g., "may suggest", "appears to indicate") or provide substantial additional evidence',
      };
    }
  }

  /**
   * Calculate citation density bonus for support score
   * Phase 2 Optimization: Reward high citation density
   */
  private calculateCitationDensityBonus(citationCount: number): number {
    if (citationCount >= 4) return 0.1; // High density (+0.1)
    if (citationCount >= 2) return 0; // Medium density (no change)
    return -0.05; // Low density (-0.05)
  }

  /**
   * Detect claim position in argument flow
   */
  detectClaimPosition(
    paragraphIndex: number,
    totalParagraphs: number
  ): 'opening' | 'developing' | 'culminating' {
    const position = paragraphIndex / totalParagraphs;

    if (position < 0.25) {
      return 'opening';
    } else if (position > 0.75) {
      return 'culminating';
    } else {
      return 'developing';
    }
  }

  /**
   * Check if paragraph contains evidence accumulation markers
   */
  hasEvidenceAccumulation(text: string): boolean {
    return EVIDENCE_ACCUMULATION_MARKERS.some(pattern => pattern.test(text));
  }

  /**
   * Count citations in text
   */
  countCitations(text: string): number {
    let count = 0;

    for (const pattern of CITATION_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }

    return count;
  }

  /**
   * Check if text contains evidence markers
   */
  hasEvidence(text: string): boolean {
    return EVIDENCE_PATTERNS.some(pattern => pattern.test(text));
  }

  /**
   * Reset state for new chapter analysis
   */
  reset(): void {
    this.argumentChains.clear();
    this.evidenceAccumulation.clear();
  }

  /**
   * Get statistics about analyzed chapter
   */
  getStats(): {
    paragraphsAnalyzed: number;
    averageSupportScore: number;
    maxSupportScore: number;
  } {
    const scores = Array.from(this.evidenceAccumulation.values()).map(
      ctx => ctx.cumulativeScore
    );

    return {
      paragraphsAnalyzed: this.evidenceAccumulation.size,
      averageSupportScore:
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0,
      maxSupportScore: scores.length > 0 ? Math.max(...scores) : 0,
    };
  }
}
