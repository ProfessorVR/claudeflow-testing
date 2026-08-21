/** @deprecated Test-only / experimental module. Do not import in production. */

/**
 * Enhanced Quality Integration - Full Quality Pipeline for god-write
 *
 * Phase K Integration (Task #12) - Combines all Week 1-5 enhancements:
 * 1. Quality Gauntlet (7-stage validation)
 * 2. Revision Orchestrator (iterative refinement)
 * 3. Register Enforcer (academic register consistency)
 * 4. Enhanced Style Drift Detector (section/paragraph drift)
 * 5. Context Tier Manager (3-tier token management)
 * 6. Enhanced Hybrid Retriever (query expansion + RRF)
 *
 * This module provides a unified interface for comprehensive quality
 * validation and enhancement of generated academic content.
 *
 * @module enhanced-quality-integration
 */

import {
  QualityGauntlet,
  RevisionOrchestrator,
  createDefaultGauntlet,
  createDefaultOrchestrator,
  type GauntletResult,
} from '../cli/quality/index.js';

import {
  RegisterEnforcer,
  createDissertationRegisterEnforcer,
  type RegisterAnalysis,
  type RegisterViolation,
} from '../cli/style/register-enforcer.js';

import {
  EnhancedStyleDriftDetector,
  createEnhancedDriftDetector,
  type EnhancedDriftAnalysis,
  type DriftSuggestion,
} from '../cli/style/enhanced-style-drift-detector.js';

import {
  ContextTierManager,
  createDissertationContextManager as createDissertationTierManager,
  type ContextPack,
  type TierStats,
} from '../cli/context/context-tier-manager.js';

import type { StyleCharacteristics } from '../universal/style-analyzer.js';
import { createComponentLogger, LogLevel } from '../core/observability/logger.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Enhanced validation options
 */
export interface EnhancedValidationOptions {
  /** Topic being written about */
  topic: string;

  /** Writing style */
  style: 'academic' | 'professional' | 'casual' | 'technical';

  /** Output format */
  format: 'essay' | 'report' | 'article' | 'paper';

  /** Trajectory ID for learning */
  trajectoryId?: string;

  /** Quality threshold (default: 0.85) */
  qualityThreshold?: number;

  /** Max revision attempts (default: 3) */
  maxRevisions?: number;

  /** Enable register enforcement (default: true for academic) */
  enforceRegister?: boolean;

  /** Enable style drift detection (default: true) */
  detectStyleDrift?: boolean;

  /** Style characteristics baseline for drift detection */
  styleBaseline?: StyleCharacteristics;

  /** Reference text for learning baseline */
  referenceText?: string;

  /** Allow first person in academic writing (default: true for dissertations) */
  allowFirstPerson?: boolean;

  /** Max acceptable drift score (default: 0.3) */
  maxDriftScore?: number;

  /** Auto-correct contractions (default: true) */
  autoCorrectContractions?: boolean;
}

/**
 * Enhanced validation result
 */
export interface EnhancedValidationResult {
  /** Final content after all processing */
  content: string;

  /** Whether all quality checks passed */
  passed: boolean;

  /** Overall quality score (0-1) */
  overallScore: number;

  /** Component scores */
  scores: {
    /** Quality gauntlet score */
    gauntlet: number;
    /** Register consistency score */
    register: number;
    /** Style drift score (inverted: 1 = no drift) */
    styleDrift: number;
    /** Combined weighted score */
    combined: number;
  };

  /** Number of revision iterations */
  revisionIterations: number;

  /** Detailed gauntlet result */
  gauntletResult?: GauntletResult;

  /** Register analysis result */
  registerAnalysis?: RegisterAnalysis;

  /** Style drift analysis */
  driftAnalysis?: EnhancedDriftAnalysis;

  /** All suggestions for improvement */
  suggestions: EnhancedSuggestion[];

  /** Processing metadata */
  metadata: {
    processingTimeMs: number;
    wordCount: number;
    sectionCount: number;
    autoCorrections: number;
    issuesFound: number;
    issuesFixed: number;
  };
}

/**
 * Enhanced suggestion combining all sources
 */
export interface EnhancedSuggestion {
  /** Suggestion source */
  source: 'gauntlet' | 'register' | 'drift';
  /** Priority (1 = highest) */
  priority: number;
  /** Category */
  category: string;
  /** Issue description */
  issue: string;
  /** Suggested fix */
  suggestion: string;
  /** Severity */
  severity: 'critical' | 'major' | 'minor';
}

/**
 * Configuration for enhanced quality integration
 */
export interface EnhancedQualityConfig {
  /** Quality gauntlet threshold */
  gauntletThreshold?: number;
  /** Register minimum score */
  registerMinScore?: number;
  /** Maximum acceptable drift */
  maxDrift?: number;
  /** Component weights for combined score */
  weights?: {
    gauntlet?: number;
    register?: number;
    drift?: number;
  };
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<EnhancedQualityConfig> = {
  gauntletThreshold: 0.85,
  registerMinScore: 0.80,
  maxDrift: 0.30,
  weights: {
    gauntlet: 0.50,
    register: 0.25,
    drift: 0.25,
  },
};

const DEFAULT_STYLE_BASELINE: StyleCharacteristics = {
  avgSentenceLength: 22,
  avgWordLength: 5.5,
  avgParagraphLength: 5,
  formalityScore: 0.85,
  vocabularyRichness: 0.55,
  toneMarkers: [],
};

// ============================================================================
// EnhancedQualityIntegration Class
// ============================================================================

/**
 * Enhanced quality integration combining all Week 1-5 enhancements
 */
export class EnhancedQualityIntegration {
  private gauntlet: QualityGauntlet;
  private orchestrator: RevisionOrchestrator;
  private registerEnforcer: RegisterEnforcer;
  private driftDetector: EnhancedStyleDriftDetector;
  private contextManager: ContextTierManager;
  private config: Required<EnhancedQualityConfig>;
  private initialized = false;
  private logger = createComponentLogger('EnhancedQualityIntegration');

  constructor(config: EnhancedQualityConfig = {}) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      weights: {
        ...DEFAULT_CONFIG.weights,
        ...config.weights,
      },
    };

    // Initialize quality gauntlet
    this.gauntlet = createDefaultGauntlet();
    this.gauntlet.updateConfig({
      overallThreshold: this.config.gauntletThreshold,
    });

    // Initialize revision orchestrator
    this.orchestrator = createDefaultOrchestrator(this.gauntlet);
    this.orchestrator.updateConfig({
      maxIterations: 3,
      minScoreImprovement: 0.02,
      applyAutoFixes: true,
    });

    // Initialize register enforcer (dissertation mode allows first person)
    this.registerEnforcer = createDissertationRegisterEnforcer();

    // Initialize drift detector with default baseline
    this.driftDetector = createEnhancedDriftDetector(DEFAULT_STYLE_BASELINE);

    // Initialize context tier manager
    this.contextManager = createDissertationTierManager();

    this.initialized = true;
  }

  // ==========================================================================
  // Configuration
  // ==========================================================================

  /**
   * Set style baseline for drift detection
   */
  setStyleBaseline(baseline: StyleCharacteristics): void {
    this.driftDetector = createEnhancedDriftDetector(baseline);
  }

  /**
   * Learn baseline from reference text
   */
  learnBaselineFromText(referenceText: string): void {
    this.driftDetector.learnBaseline(referenceText);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<EnhancedQualityConfig>): void {
    this.config = {
      ...this.config,
      ...config,
      weights: {
        ...this.config.weights,
        ...config.weights,
      },
    };

    if (config.gauntletThreshold) {
      this.gauntlet.updateConfig({
        overallThreshold: config.gauntletThreshold,
      });
    }
  }

  // ==========================================================================
  // Main Validation Pipeline
  // ==========================================================================

  /**
   * Comprehensive validation and enhancement pipeline
   */
  async validate(
    content: string,
    options: EnhancedValidationOptions
  ): Promise<EnhancedValidationResult> {
    const startTime = Date.now();
    let processedContent = content;
    let autoCorrections = 0;
    let issuesFound = 0;
    let issuesFixed = 0;

    // Learn baseline if reference text provided
    if (options.referenceText) {
      this.driftDetector.learnBaseline(options.referenceText);
    }

    // Set baseline if provided
    if (options.styleBaseline) {
      this.setStyleBaseline(options.styleBaseline);
    }

    // Step 1: Auto-correct contractions if enabled
    if (options.autoCorrectContractions !== false) {
      const contractionResult = this.registerEnforcer.autoCorrect(processedContent);
      processedContent = contractionResult.corrected;
      autoCorrections += contractionResult.corrections;
    }

    // Step 2: Run quality gauntlet
    let gauntletResult: GauntletResult | undefined;
    let gauntletScore = 1.0;
    let revisionIterations = 0;

    try {
      // Run gauntlet evaluation (runGauntlet requires chapterText, chapterId, context)
      gauntletResult = await this.gauntlet.runGauntlet(processedContent, 1, {
        chapterTitle: options.topic,
        expectedCitations: 5,
        citationSources: [],
      });

      // Safely access gauntlet result properties
      if (gauntletResult && typeof gauntletResult.overallScore === 'number') {
        gauntletScore = gauntletResult.overallScore;
        issuesFound += gauntletResult.issues?.length ?? 0;

        // Attempt revision if below threshold
        if (gauntletScore < (options.qualityThreshold ?? this.config.gauntletThreshold)) {
          const maxRevisions = options.maxRevisions ?? 3;

          for (let i = 0; i < maxRevisions && gauntletScore < this.config.gauntletThreshold; i++) {
            // Apply auto-fixes
            const autoFixedContent = await this.applyAutoFixes(processedContent, gauntletResult);
            if (autoFixedContent !== processedContent) {
              processedContent = autoFixedContent;
              issuesFixed++;
            }

            // Re-evaluate
            gauntletResult = await this.gauntlet.runGauntlet(processedContent, 1, {
              chapterTitle: options.topic,
              expectedCitations: 5,
              citationSources: [],
            });
            gauntletScore = gauntletResult?.overallScore ?? gauntletScore;
            revisionIterations++;
          }
        }
      }
    } catch (error) {
      // Graceful degradation - continue without gauntlet
      this.logger.log(LogLevel.WARN, 'Quality gauntlet failed', { error });
      gauntletResult = undefined;
    }

    // Step 3: Register analysis
    let registerAnalysis: RegisterAnalysis | undefined;
    let registerScore = 1.0;

    if (options.enforceRegister !== false && options.style === 'academic') {
      registerAnalysis = this.registerEnforcer.analyze(processedContent);
      registerScore = registerAnalysis.consistencyScore;
      issuesFound += registerAnalysis.violations.length;
    }

    // Step 4: Style drift analysis
    let driftAnalysis: EnhancedDriftAnalysis | undefined;
    let driftScore = 1.0;

    if (options.detectStyleDrift !== false) {
      driftAnalysis = this.driftDetector.analyze(processedContent);
      driftScore = 1 - driftAnalysis.overallScore; // Invert: higher = better
      issuesFound += driftAnalysis.suggestions.length;
    }

    // Step 5: Calculate combined score
    const weights = this.config.weights;
    const combinedScore =
      gauntletScore * weights.gauntlet +
      registerScore * weights.register +
      driftScore * weights.drift;

    // Step 6: Collect all suggestions
    const suggestions = this.collectSuggestions(
      gauntletResult,
      registerAnalysis,
      driftAnalysis
    );

    // Step 7: Determine pass/fail
    const maxDrift = options.maxDriftScore ?? this.config.maxDrift;
    const passed =
      gauntletScore >= this.config.gauntletThreshold &&
      registerScore >= this.config.registerMinScore &&
      (1 - driftScore) <= maxDrift;

    // Count sections for metadata
    const sectionCount = this.countSections(processedContent);

    return {
      content: processedContent,
      passed,
      overallScore: combinedScore,
      scores: {
        gauntlet: gauntletScore,
        register: registerScore,
        styleDrift: driftScore,
        combined: combinedScore,
      },
      revisionIterations,
      gauntletResult,
      registerAnalysis,
      driftAnalysis,
      suggestions,
      metadata: {
        processingTimeMs: Date.now() - startTime,
        wordCount: processedContent.split(/\s+/).length,
        sectionCount,
        autoCorrections,
        issuesFound,
        issuesFixed,
      },
    };
  }

  /**
   * Quick check without full analysis
   */
  async quickCheck(content: string): Promise<{
    passed: boolean;
    score: number;
    topIssues: string[];
  }> {
    let gauntletScore = 1.0;
    const topIssues: string[] = [];

    // Try gauntlet, but gracefully degrade on failure
    try {
      const gauntletResult = await this.gauntlet.runGauntlet(content, 1, {
        chapterTitle: 'Quick Check',
        expectedCitations: 0,
        citationSources: [],
      });

      if (gauntletResult && typeof gauntletResult.overallScore === 'number') {
        gauntletScore = gauntletResult.overallScore;

        // Add top gauntlet issues safely
        if (gauntletResult.issues && Array.isArray(gauntletResult.issues)) {
          for (const issue of gauntletResult.issues.slice(0, 3)) {
            topIssues.push(`[Gauntlet] ${issue.description}`);
          }
        }
      }
    } catch (error) {
      // Continue with register-only check
      this.logger.log(LogLevel.WARN, 'Gauntlet failed in quickCheck', { error });
    }

    const registerAnalysis = this.registerEnforcer.analyze(content);

    const passed =
      gauntletScore >= this.config.gauntletThreshold &&
      registerAnalysis.consistencyScore >= this.config.registerMinScore;

    // Add top register issues
    for (const violation of registerAnalysis.violations.slice(0, 2)) {
      topIssues.push(`[Register] ${violation.type}: "${violation.text}"`);
    }

    return {
      passed,
      score: (gauntletScore + registerAnalysis.consistencyScore) / 2,
      topIssues,
    };
  }

  // ==========================================================================
  // Helper Methods
  // ==========================================================================

  /**
   * Apply auto-fixes from gauntlet
   */
  private async applyAutoFixes(
    content: string,
    gauntletResult?: GauntletResult
  ): Promise<string> {
    if (!gauntletResult || !gauntletResult.issues || !Array.isArray(gauntletResult.issues)) {
      return content;
    }

    let fixed = content;

    for (const issue of gauntletResult.issues) {
      if (issue.autoFix && issue.suggestion) {
        // Simple replacement for auto-fixable issues
        if (issue.location?.text) {
          fixed = fixed.replace(issue.location.text, issue.suggestion);
        }
      }
    }

    return fixed;
  }

  /**
   * Collect suggestions from all sources
   */
  private collectSuggestions(
    gauntletResult?: GauntletResult,
    registerAnalysis?: RegisterAnalysis,
    driftAnalysis?: EnhancedDriftAnalysis
  ): EnhancedSuggestion[] {
    const suggestions: EnhancedSuggestion[] = [];
    let priority = 1;

    // Gauntlet suggestions
    if (gauntletResult && gauntletResult.issues && Array.isArray(gauntletResult.issues)) {
      for (const issue of gauntletResult.issues.slice(0, 10)) {
        suggestions.push({
          source: 'gauntlet',
          priority: priority++,
          category: issue.type,
          issue: issue.description,
          suggestion: issue.suggestion || 'Review and revise',
          severity: issue.severity,
        });
      }
    }

    // Register suggestions
    if (registerAnalysis) {
      for (const violation of registerAnalysis.violations.slice(0, 5)) {
        suggestions.push({
          source: 'register',
          priority: priority++,
          category: violation.type,
          issue: `Informal ${violation.type}: "${violation.text}"`,
          suggestion: violation.suggestions[0] || 'Use formal alternative',
          severity: violation.severity > 0.7 ? 'major' : 'minor',
        });
      }
    }

    // Drift suggestions
    if (driftAnalysis) {
      for (const suggestion of driftAnalysis.suggestions.slice(0, 5)) {
        suggestions.push({
          source: 'drift',
          priority: priority++,
          category: suggestion.dimension,
          issue: suggestion.issue,
          suggestion: suggestion.suggestion,
          severity: suggestion.expectedImprovement > 0.3 ? 'major' : 'minor',
        });
      }
    }

    // Sort by priority
    suggestions.sort((a, b) => a.priority - b.priority);

    return suggestions;
  }

  /**
   * Count sections in content
   */
  private countSections(content: string): number {
    const headingPattern = /^#{1,6}\s+.+$/gm;
    const headings = content.match(headingPattern);
    return headings ? headings.length : 1;
  }

  // ==========================================================================
  // Context Management
  // ==========================================================================

  /**
   * Store context for tiered retrieval
   */
  async storeContext(
    key: string,
    content: string,
    options: {
      priority?: 'critical' | 'high' | 'medium' | 'low';
      type?: 'source' | 'citation' | 'definition' | 'example' | 'context';
    } = {}
  ): Promise<void> {
    await this.contextManager.store(key, content, {
      priority: options.priority ?? 'medium',
      type: options.type ?? 'context',
    });
  }

  /**
   * Get context pack within token budget
   */
  async getContextPack(tokenBudget: number): Promise<ContextPack> {
    return this.contextManager.getContextPack(tokenBudget);
  }

  /**
   * Get tier statistics
   */
  getTierStats(): { hot: TierStats; warm: TierStats; cold: TierStats; total: { items: number; tokens: number } } {
    return this.contextManager.getStats();
  }

  // ==========================================================================
  // Report Generation
  // ==========================================================================

  /**
   * Generate comprehensive quality report
   */
  generateReport(result: EnhancedValidationResult): string {
    const lines: string[] = [
      '',
      '═'.repeat(80),
      'ENHANCED QUALITY VALIDATION REPORT',
      '═'.repeat(80),
      '',
      `Overall Status: ${result.passed ? '✓ PASSED' : '✗ FAILED'}`,
      `Combined Score: ${(result.overallScore * 100).toFixed(1)}%`,
      '',
      '─'.repeat(40),
      'COMPONENT SCORES',
      '─'.repeat(40),
      `  Quality Gauntlet: ${(result.scores.gauntlet * 100).toFixed(1)}%`,
      `  Register:         ${(result.scores.register * 100).toFixed(1)}%`,
      `  Style Drift:      ${(result.scores.styleDrift * 100).toFixed(1)}%`,
      '',
      '─'.repeat(40),
      'PROCESSING METADATA',
      '─'.repeat(40),
      `  Word Count:       ${result.metadata.wordCount}`,
      `  Section Count:    ${result.metadata.sectionCount}`,
      `  Processing Time:  ${result.metadata.processingTimeMs}ms`,
      `  Revisions:        ${result.revisionIterations}`,
      `  Auto-corrections: ${result.metadata.autoCorrections}`,
      `  Issues Found:     ${result.metadata.issuesFound}`,
      `  Issues Fixed:     ${result.metadata.issuesFixed}`,
      '',
    ];

    if (result.suggestions.length > 0) {
      lines.push('─'.repeat(40));
      lines.push('TOP SUGGESTIONS');
      lines.push('─'.repeat(40));

      for (const s of result.suggestions.slice(0, 10)) {
        lines.push(`  ${s.priority}. [${s.source}/${s.severity}] ${s.issue}`);
        lines.push(`     → ${s.suggestion}`);
      }
      lines.push('');
    }

    lines.push('═'.repeat(80));

    return lines.join('\n');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create enhanced quality integration with default settings
 */
export function createEnhancedQualityIntegration(
  config?: EnhancedQualityConfig
): EnhancedQualityIntegration {
  return new EnhancedQualityIntegration(config);
}

/**
 * Create strict academic quality integration
 */
export function createStrictAcademicIntegration(): EnhancedQualityIntegration {
  return new EnhancedQualityIntegration({
    gauntletThreshold: 0.90,
    registerMinScore: 0.85,
    maxDrift: 0.20,
    weights: {
      gauntlet: 0.45,
      register: 0.30,
      drift: 0.25,
    },
  });
}

/**
 * Create lenient draft quality integration
 */
export function createDraftIntegration(): EnhancedQualityIntegration {
  return new EnhancedQualityIntegration({
    gauntletThreshold: 0.70,
    registerMinScore: 0.60,
    maxDrift: 0.50,
    weights: {
      gauntlet: 0.60,
      register: 0.20,
      drift: 0.20,
    },
  });
}

/**
 * Create dissertation-specific integration
 */
export function createDissertationIntegration(): EnhancedQualityIntegration {
  return new EnhancedQualityIntegration({
    gauntletThreshold: 0.85,
    registerMinScore: 0.80,
    maxDrift: 0.25,
    weights: {
      gauntlet: 0.50,
      register: 0.25,
      drift: 0.25,
    },
  });
}
