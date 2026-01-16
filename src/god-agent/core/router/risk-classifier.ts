/**
 * Risk-Based Task Classifier
 *
 * Implements TIER-2.1: Intelligent Model Router - Phase 5.2
 *
 * Routes based on the principle:
 *   if cost_of_being_wrong > cost_of_thinking:
 *     use_expensive_model()  # Claude
 *   else:
 *     use_cheap_model() + verification  # vLLM + tests
 *
 * Evaluates:
 * - Risk level: How costly if the model is wrong
 * - Feedback speed: How fast we can verify the result
 * - Reversibility: How easy to undo the change
 * - Verification method: How to validate output
 */

import type {
  TaskType,
  Complexity,
  RiskLevel,
  TaskClassification,
} from './router-types.js';

// ===== RISK ASSESSMENT TYPES =====

/**
 * How quickly we can get feedback on whether the output is correct
 */
export type FeedbackSpeed = 'instant' | 'fast' | 'slow' | 'very_slow';

/**
 * How easy it is to reverse a change if wrong
 */
export type Reversibility = 'easy' | 'moderate' | 'difficult' | 'catastrophic';

/**
 * Method to verify the output
 */
export type VerificationMethod = 'tests' | 'diff_review' | 'manual' | 'none';

/**
 * Recommended routing destination
 *
 * LOCAL-FIRST STRATEGY:
 * - 'local': Pure local execution, no Claude review needed
 * - 'pure_local_verified': Pure local when tests pass (trust tests mode)
 * - 'local_then_review': Local execution with Claude review
 * - 'expensive': Claude only (high-risk tasks)
 */
export type RouteRecommendation = 'local' | 'pure_local_verified' | 'expensive' | 'local_then_review';

/**
 * Complete risk assessment for a task
 */
export interface RiskAssessment {
  /** Overall risk level */
  riskLevel: RiskLevel;
  /** How fast we can get feedback */
  feedbackSpeed: FeedbackSpeed;
  /** How easy to reverse if wrong */
  reversibility: Reversibility;
  /** Method to verify output */
  verificationMethod: VerificationMethod;
  /** Recommended routing */
  recommendedRoute: RouteRecommendation;
  /** Reasoning for the assessment */
  reason: string;
  /** Confidence in this assessment (0-1) */
  confidence: number;
  /** Signals that led to this assessment */
  signals: string[];
}

/**
 * Context for risk assessment
 */
export interface RiskContext {
  /** Task classification from TaskClassifier */
  classification?: TaskClassification;
  /** Whether tests exist for affected code */
  hasTests?: boolean;
  /** Whether this is production code */
  isProduction?: boolean;
  /** Number of files affected */
  filesAffected?: number;
  /** Whether this modifies public API */
  modifiesPublicApi?: boolean;
  /** Whether this involves security-sensitive code */
  securitySensitive?: boolean;
  /** Whether this is a fix for a failing test */
  isTestFix?: boolean;
  /** Previous routing outcomes for similar patterns */
  previousOutcomes?: {
    pattern: string;
    successRate: number;
    sampleCount: number;
  };
}

// ===== RISK PATTERNS =====

/**
 * High-risk patterns - require expensive model (Claude)
 * Cost of being wrong exceeds cost of thinking
 */
const HIGH_RISK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Diagnosis - slow feedback, requires deep understanding
  { pattern: /why.*(fail|break|wrong|issue)/i, reason: 'Diagnosis requires deep understanding' },
  { pattern: /root cause/i, reason: 'Root cause analysis is complex reasoning' },
  { pattern: /diagnos(e|is|tic)/i, reason: 'Diagnostic tasks need careful analysis' },
  { pattern: /debug.*complex/i, reason: 'Complex debugging requires reasoning' },

  // Architecture - very slow feedback (weeks to discover if wrong)
  { pattern: /architect(ure)?/i, reason: 'Architecture decisions have long-term impact' },
  { pattern: /design.*system/i, reason: 'System design is high-stakes' },
  { pattern: /(api.*design|design.*api)/i, reason: 'API design affects consumers' },
  { pattern: /schema.*design/i, reason: 'Schema changes are hard to reverse' },
  { pattern: /data.*model/i, reason: 'Data modeling has lasting consequences' },

  // Security - catastrophic if wrong
  { pattern: /security/i, reason: 'Security code must be correct' },
  { pattern: /auth(entication|orization)?/i, reason: 'Auth code is security-critical' },
  { pattern: /permission/i, reason: 'Permission handling is security-sensitive' },
  { pattern: /credential/i, reason: 'Credential handling is critical' },
  { pattern: /encrypt/i, reason: 'Encryption must be implemented correctly' },
  { pattern: /vulnerabilit/i, reason: 'Vulnerability fixes require expertise' },
  { pattern: /sql.?inject/i, reason: 'SQL injection prevention is critical' },
  { pattern: /xss|cross.?site/i, reason: 'XSS prevention is critical' },
  { pattern: /input.?valid.*prevent/i, reason: 'Security validation is critical' },

  // Cross-cutting changes - hard to verify
  { pattern: /refactor.*across/i, reason: 'Cross-cutting refactors are risky' },
  { pattern: /cross.?cutting/i, reason: 'Cross-cutting concerns need careful handling' },
  { pattern: /breaking.*change/i, reason: 'Breaking changes affect consumers' },

  // Decision-making - requires judgment
  { pattern: /decide|should\s+(we|i)/i, reason: 'Decisions require judgment' },
  { pattern: /which.*approach/i, reason: 'Approach selection needs reasoning' },
  { pattern: /best.*way/i, reason: 'Best practices require experience' },
  { pattern: /trade.?off/i, reason: 'Trade-off analysis is complex' },

  // Production impact
  { pattern: /production/i, reason: 'Production changes are high-stakes' },
  { pattern: /deploy/i, reason: 'Deployment changes need careful review' },
  { pattern: /migration/i, reason: 'Migrations are hard to reverse' },
];

/**
 * Low-risk patterns - can use local model + verification
 * Fast feedback loop, easily reversible
 *
 * LOCAL-FIRST STRATEGY: Expanded patterns to maximize local vLLM usage
 * Any task matching these patterns goes directly to local model without Claude review
 */
const LOW_RISK_PATTERNS: Array<{ pattern: RegExp; reason: string; verification: VerificationMethod }> = [
  // ===== IMPLEMENTATION WITH TESTS =====
  { pattern: /implement.*function/i, reason: 'Function implementation can be tested', verification: 'tests' },
  { pattern: /write.*function/i, reason: 'New function can be tested', verification: 'tests' },
  { pattern: /create.*function/i, reason: 'Function creation is testable', verification: 'tests' },
  { pattern: /add.*method/i, reason: 'Method addition is testable', verification: 'tests' },
  { pattern: /add.*function/i, reason: 'Function addition is testable', verification: 'tests' },
  { pattern: /simple.*function/i, reason: 'Simple functions are straightforward', verification: 'tests' },
  { pattern: /helper.*function/i, reason: 'Helper functions are isolated', verification: 'tests' },
  { pattern: /utility.*function/i, reason: 'Utility functions are isolated', verification: 'tests' },

  // ===== TEST-RELATED (INSTANT VERIFICATION) =====
  { pattern: /fix.*test/i, reason: 'Test fix verified instantly', verification: 'tests' },
  { pattern: /test.*fail/i, reason: 'Failing test provides verification', verification: 'tests' },
  { pattern: /make.*test.*pass/i, reason: 'Test provides verification', verification: 'tests' },
  { pattern: /update.*test/i, reason: 'Test changes are self-verifying', verification: 'tests' },
  { pattern: /add.*test/i, reason: 'Adding tests is self-verifying', verification: 'tests' },
  { pattern: /write.*test/i, reason: 'Writing tests is self-verifying', verification: 'tests' },
  { pattern: /unit.*test/i, reason: 'Unit tests verify themselves', verification: 'tests' },
  { pattern: /test.*case/i, reason: 'Test cases are self-verifying', verification: 'tests' },
  { pattern: /spec.*file/i, reason: 'Spec files are self-verifying', verification: 'tests' },

  // ===== SIMPLE REFACTORING (EASY TO VERIFY) =====
  { pattern: /rename/i, reason: 'Renaming is easily verified', verification: 'tests' },
  { pattern: /extract.*(method|function|variable|constant)/i, reason: 'Extraction is testable', verification: 'tests' },
  { pattern: /inline/i, reason: 'Inlining is testable', verification: 'tests' },
  { pattern: /move.*(to|into)/i, reason: 'Moving code is testable', verification: 'tests' },
  { pattern: /reorganize/i, reason: 'Reorganization is diff-reviewable', verification: 'diff_review' },

  // ===== SIMPLE ADDITIONS =====
  { pattern: /add.*logging/i, reason: 'Logging is low-risk', verification: 'diff_review' },
  { pattern: /add.*comment/i, reason: 'Comments are easily reviewed', verification: 'diff_review' },
  { pattern: /add.*docstring/i, reason: 'Documentation is low-risk', verification: 'diff_review' },
  { pattern: /add.*import/i, reason: 'Import additions are compiler-checked', verification: 'tests' },
  { pattern: /add.*export/i, reason: 'Export additions are compiler-checked', verification: 'tests' },

  // ===== FORMATTING/STYLE =====
  { pattern: /format/i, reason: 'Formatting is easily verified', verification: 'diff_review' },
  { pattern: /lint/i, reason: 'Linting is automated', verification: 'tests' },
  { pattern: /style/i, reason: 'Style changes are visible', verification: 'diff_review' },
  { pattern: /typo/i, reason: 'Typo fixes are simple', verification: 'diff_review' },
  { pattern: /spelling/i, reason: 'Spelling fixes are simple', verification: 'diff_review' },
  { pattern: /prettie?r/i, reason: 'Prettier formatting is automated', verification: 'tests' },

  // ===== TYPE ADDITIONS =====
  { pattern: /add.*type/i, reason: 'Type additions are checked by compiler', verification: 'tests' },
  { pattern: /type.*annotation/i, reason: 'Type annotations are verified by TSC', verification: 'tests' },
  { pattern: /add.*interface/i, reason: 'Interface additions are type-checked', verification: 'tests' },

  // ===== INTERFACE IMPLEMENTATION =====
  { pattern: /implement.*interface/i, reason: 'Interface impl is type-checked', verification: 'tests' },

  // ===== SAFE MODIFICATIONS =====
  { pattern: /update.*message/i, reason: 'Message updates are low-risk', verification: 'diff_review' },
  { pattern: /update.*text/i, reason: 'Text updates are low-risk', verification: 'diff_review' },
  { pattern: /update.*label/i, reason: 'Label updates are low-risk', verification: 'diff_review' },
  { pattern: /update.*string/i, reason: 'String updates are low-risk', verification: 'diff_review' },
  { pattern: /change.*message/i, reason: 'Message changes are low-risk', verification: 'diff_review' },
  { pattern: /remove.*unused/i, reason: 'Removing unused code is safe', verification: 'tests' },
  { pattern: /delete.*unused/i, reason: 'Deleting unused code is safe', verification: 'tests' },
  { pattern: /clean.*up/i, reason: 'Cleanup is testable', verification: 'tests' },
  { pattern: /null.*check/i, reason: 'Null checks are safe additions', verification: 'tests' },
  { pattern: /undefined.*check/i, reason: 'Undefined checks are safe', verification: 'tests' },
  { pattern: /add.*validation/i, reason: 'Validation additions are testable', verification: 'tests' },
  { pattern: /add.*error.*handling/i, reason: 'Error handling is testable', verification: 'tests' },
  { pattern: /add.*try.*catch/i, reason: 'Try-catch is testable', verification: 'tests' },

  // ===== CONFIG UPDATES =====
  { pattern: /update.*config/i, reason: 'Config updates are low-risk', verification: 'diff_review' },
  { pattern: /change.*setting/i, reason: 'Setting changes are visible', verification: 'diff_review' },
  { pattern: /update.*constant/i, reason: 'Constant updates are visible', verification: 'diff_review' },
  { pattern: /change.*constant/i, reason: 'Constant changes are visible', verification: 'diff_review' },
  { pattern: /update.*default/i, reason: 'Default value updates are visible', verification: 'diff_review' },
  { pattern: /environment.*variable/i, reason: 'Env var changes are visible', verification: 'diff_review' },

  // ===== DOCUMENTATION =====
  { pattern: /update.*readme/i, reason: 'README updates are diff-reviewable', verification: 'diff_review' },
  { pattern: /update.*doc/i, reason: 'Documentation updates are reviewable', verification: 'diff_review' },
  { pattern: /add.*jsdoc/i, reason: 'JSDoc is easily reviewed', verification: 'diff_review' },
  { pattern: /update.*changelog/i, reason: 'Changelog updates are reviewable', verification: 'diff_review' },

  // ===== SIMPLE BUG FIXES =====
  { pattern: /fix.*bug/i, reason: 'Bug fixes are testable', verification: 'tests' },
  { pattern: /bug.*fix/i, reason: 'Bug fixes are testable', verification: 'tests' },
  { pattern: /fix.*error/i, reason: 'Error fixes are testable', verification: 'tests' },
  { pattern: /fix.*issue/i, reason: 'Issue fixes are testable', verification: 'tests' },
  { pattern: /fix.*typo/i, reason: 'Typo fixes are simple', verification: 'diff_review' },
  { pattern: /quick.*fix/i, reason: 'Quick fixes are testable', verification: 'tests' },
  { pattern: /hotfix/i, reason: 'Hotfixes are testable', verification: 'tests' },

  // ===== SIMPLE GETTERS/SETTERS =====
  { pattern: /getter/i, reason: 'Getters are simple and testable', verification: 'tests' },
  { pattern: /setter/i, reason: 'Setters are simple and testable', verification: 'tests' },
  { pattern: /accessor/i, reason: 'Accessors are simple and testable', verification: 'tests' },

  // ===== SIMPLE CALCULATIONS =====
  { pattern: /calculate/i, reason: 'Calculations are testable', verification: 'tests' },
  { pattern: /compute/i, reason: 'Computations are testable', verification: 'tests' },
  { pattern: /sum|average|total/i, reason: 'Math operations are testable', verification: 'tests' },
];

/**
 * Medium-risk patterns - local with Claude review
 */
const MEDIUM_RISK_PATTERNS: Array<{ pattern: RegExp; reason: string }> = [
  // Refactoring - needs review but testable
  { pattern: /refactor/i, reason: 'Refactoring needs review but has tests' },
  { pattern: /extract.*function/i, reason: 'Extraction is testable with review' },
  { pattern: /split.*file/i, reason: 'File splitting needs verification' },

  // Feature work
  { pattern: /feature/i, reason: 'Features need review' },
  { pattern: /component/i, reason: 'Components need review' },

  // API changes (non-breaking)
  { pattern: /add.*endpoint/i, reason: 'New endpoints need review' },
  { pattern: /update.*api/i, reason: 'API updates need review' },
];

// ===== RISK CLASSIFIER =====

/**
 * Configuration for RiskClassifier
 */
export interface RiskClassifierConfig {
  /** Trust test results for verification */
  trustTests?: boolean;
  /** Always escalate production code */
  escalateProduction?: boolean;
  /** Minimum success rate to trust local for pattern */
  minPatternSuccessRate?: number;
  /** Custom high-risk patterns */
  customHighRiskPatterns?: Array<{ pattern: RegExp; reason: string }>;
  /** Custom low-risk patterns */
  customLowRiskPatterns?: Array<{ pattern: RegExp; reason: string; verification: VerificationMethod }>;
}

/**
 * Risk-based task classifier for intelligent routing
 */
export class RiskClassifier {
  private readonly config: Required<RiskClassifierConfig>;

  constructor(config: RiskClassifierConfig = {}) {
    this.config = {
      trustTests: config.trustTests ?? true,
      escalateProduction: config.escalateProduction ?? true,
      minPatternSuccessRate: config.minPatternSuccessRate ?? 0.50,
      customHighRiskPatterns: config.customHighRiskPatterns ?? [],
      customLowRiskPatterns: config.customLowRiskPatterns ?? [],
    };
  }

  /**
   * Assess risk for a task
   */
  assess(prompt: string, context: RiskContext = {}): RiskAssessment {
    const normalizedPrompt = prompt.toLowerCase();
    const signals: string[] = [];

    // Check for explicit production context
    if (context.isProduction && this.config.escalateProduction) {
      signals.push('production_context');
      return this.createHighRiskAssessment(
        'Production code requires careful review',
        signals,
        context
      );
    }

    // Check for security-sensitive context
    if (context.securitySensitive) {
      signals.push('security_sensitive');
      return this.createHighRiskAssessment(
        'Security-sensitive code requires expert review',
        signals,
        context
      );
    }

    // Check high-risk patterns first
    const highRiskMatch = this.matchPatterns(
      normalizedPrompt,
      [...HIGH_RISK_PATTERNS, ...this.config.customHighRiskPatterns]
    );
    if (highRiskMatch) {
      signals.push(`high_risk_pattern: ${highRiskMatch.reason}`);
      return this.createHighRiskAssessment(highRiskMatch.reason, signals, context);
    }

    // Check low-risk patterns
    const lowRiskMatch = this.matchLowRiskPatterns(
      normalizedPrompt,
      [...LOW_RISK_PATTERNS, ...this.config.customLowRiskPatterns]
    );
    if (lowRiskMatch) {
      signals.push(`low_risk_pattern: ${lowRiskMatch.reason}`);
      return this.createLowRiskAssessment(
        lowRiskMatch.reason,
        lowRiskMatch.verification,
        signals,
        context
      );
    }

    // Check medium-risk patterns
    const mediumRiskMatch = this.matchPatterns(normalizedPrompt, MEDIUM_RISK_PATTERNS);
    if (mediumRiskMatch) {
      signals.push(`medium_risk_pattern: ${mediumRiskMatch.reason}`);
      return this.createMediumRiskAssessment(mediumRiskMatch.reason, signals, context);
    }

    // Check test fix context
    if (context.isTestFix) {
      signals.push('test_fix_context');
      return this.createLowRiskAssessment(
        'Test fix with instant verification',
        'tests',
        signals,
        context
      );
    }

    // LOCAL-FIRST: Trust tests mode - when tests exist and pass, go pure local
    // This is the key optimization: test-backed code changes don't need Claude review
    if (context.hasTests && this.config.trustTests) {
      signals.push('has_tests_trust_mode');
      return this.createPureLocalVerifiedAssessment(
        'Tests provide verification - pure local sufficient',
        signals,
        context
      );
    }

    // Check previous outcomes for similar patterns
    if (context.previousOutcomes) {
      const { successRate, sampleCount } = context.previousOutcomes;
      if (sampleCount >= 5) {
        if (successRate >= this.config.minPatternSuccessRate) {
          signals.push(`historical_success: ${Math.round(successRate * 100)}%`);
          return this.createMediumRiskAssessment(
            `Historical success rate ${Math.round(successRate * 100)}%`,
            signals,
            context
          );
        } else {
          signals.push(`historical_failure: ${Math.round(successRate * 100)}%`);
          return this.createHighRiskAssessment(
            `Low historical success rate ${Math.round(successRate * 100)}%`,
            signals,
            context
          );
        }
      }
    }

    // Consider classification complexity
    if (context.classification) {
      const { complexity, riskLevel: classifiedRisk } = context.classification;

      if (complexity === 'complex' || classifiedRisk === 'high') {
        signals.push('complex_classification');
        return this.createHighRiskAssessment(
          'Complex task requires expert model',
          signals,
          context
        );
      }

      if (complexity === 'simple' && classifiedRisk === 'low') {
        signals.push('simple_classification');
        return this.createMediumRiskAssessment(
          'Simple task with low classified risk',
          signals,
          context
        );
      }
    }

    // Default to low risk (local-first approach)
    // Changed from medium risk to maximize local model usage
    signals.push('default_assessment');
    return this.createLowRiskAssessment(
      'No strong signals, defaulting to pure local (local-first)',
      'diff_review',
      signals,
      context
    );
  }

  /**
   * Quick check if task should use expensive model
   */
  shouldUseExpensiveModel(prompt: string, context: RiskContext = {}): boolean {
    const assessment = this.assess(prompt, context);
    return assessment.recommendedRoute === 'expensive';
  }

  /**
   * Quick check if task can use local model
   */
  canUseLocalModel(prompt: string, context: RiskContext = {}): boolean {
    const assessment = this.assess(prompt, context);
    return assessment.recommendedRoute === 'local' || assessment.recommendedRoute === 'local_then_review';
  }

  /**
   * Get verification method for a task
   */
  getVerificationMethod(prompt: string, context: RiskContext = {}): VerificationMethod {
    return this.assess(prompt, context).verificationMethod;
  }

  // ===== PRIVATE METHODS =====

  private matchPatterns(
    prompt: string,
    patterns: Array<{ pattern: RegExp; reason: string }>
  ): { pattern: RegExp; reason: string } | null {
    for (const p of patterns) {
      if (p.pattern.test(prompt)) {
        return p;
      }
    }
    return null;
  }

  private matchLowRiskPatterns(
    prompt: string,
    patterns: Array<{ pattern: RegExp; reason: string; verification: VerificationMethod }>
  ): { pattern: RegExp; reason: string; verification: VerificationMethod } | null {
    for (const p of patterns) {
      if (p.pattern.test(prompt)) {
        return p;
      }
    }
    return null;
  }

  private createHighRiskAssessment(
    reason: string,
    signals: string[],
    context: RiskContext
  ): RiskAssessment {
    return {
      riskLevel: 'high',
      feedbackSpeed: 'slow',
      reversibility: 'difficult',
      verificationMethod: 'manual',
      recommendedRoute: 'expensive',
      reason,
      confidence: this.calculateConfidence(signals, context),
      signals,
    };
  }

  private createMediumRiskAssessment(
    reason: string,
    signals: string[],
    context: RiskContext
  ): RiskAssessment {
    const hasTests = context.hasTests && this.config.trustTests;
    return {
      riskLevel: 'medium',
      feedbackSpeed: hasTests ? 'fast' : 'slow',
      reversibility: 'moderate',
      verificationMethod: hasTests ? 'tests' : 'diff_review',
      recommendedRoute: 'local_then_review',
      reason,
      confidence: this.calculateConfidence(signals, context),
      signals,
    };
  }

  /**
   * LOCAL-FIRST: Create assessment for pure local execution when tests verify correctness
   * This is the trust-tests mode that skips Claude review entirely
   */
  private createPureLocalVerifiedAssessment(
    reason: string,
    signals: string[],
    context: RiskContext
  ): RiskAssessment {
    return {
      riskLevel: 'low',
      feedbackSpeed: 'instant',
      reversibility: 'easy',
      verificationMethod: 'tests',
      recommendedRoute: 'pure_local_verified',
      reason,
      confidence: this.calculateConfidence(signals, context) + 0.1, // Boost confidence when tests exist
      signals,
    };
  }

  private createLowRiskAssessment(
    reason: string,
    verification: VerificationMethod,
    signals: string[],
    context: RiskContext
  ): RiskAssessment {
    const feedbackSpeed: FeedbackSpeed = verification === 'tests' ? 'instant' : 'fast';
    return {
      riskLevel: 'low',
      feedbackSpeed,
      reversibility: 'easy',
      verificationMethod: verification,
      recommendedRoute: 'local',
      reason,
      confidence: this.calculateConfidence(signals, context),
      signals,
    };
  }

  private calculateConfidence(signals: string[], context: RiskContext): number {
    let confidence = 0.5;

    // More signals = higher confidence
    confidence += Math.min(signals.length * 0.1, 0.3);

    // Context boosts confidence
    if (context.hasTests !== undefined) confidence += 0.05;
    if (context.isProduction !== undefined) confidence += 0.1;
    if (context.securitySensitive !== undefined) confidence += 0.1;
    if (context.previousOutcomes) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }
}

// ===== SINGLETON =====

let riskClassifierInstance: RiskClassifier | null = null;

/**
 * Get or create the singleton RiskClassifier instance
 */
export function getRiskClassifier(config?: RiskClassifierConfig): RiskClassifier {
  if (!riskClassifierInstance || config) {
    riskClassifierInstance = new RiskClassifier(config);
  }
  return riskClassifierInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetRiskClassifier(): void {
  riskClassifierInstance = null;
}

/**
 * Initialize the risk classifier with configuration
 */
export function initializeRiskClassifier(config: RiskClassifierConfig): RiskClassifier {
  riskClassifierInstance = new RiskClassifier(config);
  return riskClassifierInstance;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Quick assess without creating instance
 */
export function assessTaskRisk(prompt: string, context?: RiskContext): RiskAssessment {
  return getRiskClassifier().assess(prompt, context);
}

/**
 * Check if task should use expensive model
 */
export function shouldUseExpensiveModel(prompt: string, context?: RiskContext): boolean {
  return getRiskClassifier().shouldUseExpensiveModel(prompt, context);
}

/**
 * Check if task can use local model
 */
export function canUseLocalModel(prompt: string, context?: RiskContext): boolean {
  return getRiskClassifier().canUseLocalModel(prompt, context);
}

/**
 * Get human-readable description of risk assessment
 */
export function describeRiskAssessment(assessment: RiskAssessment): string {
  const routeMap: Record<RouteRecommendation, string> = {
    expensive: 'Claude (expensive)',
    local: 'Local (vLLM)',
    pure_local_verified: 'Local (test verified)',
    local_then_review: 'Local + Claude review',
  };
  const route = routeMap[assessment.recommendedRoute];

  return `${assessment.riskLevel} risk → ${route} (${assessment.feedbackSpeed} feedback, ${assessment.reversibility} reversal)`;
}

/**
 * Get route recommendation for display
 */
export function getRouteDisplay(assessment: RiskAssessment): string {
  switch (assessment.recommendedRoute) {
    case 'local':
      return '🏠 Local Model';
    case 'pure_local_verified':
      return '🏠✅ Local (Test Verified)';
    case 'expensive':
      return '🧠 Claude';
    case 'local_then_review':
      return '🏠→🧠 Local + Review';
  }
}
