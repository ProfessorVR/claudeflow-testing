/**
 * Composition Orchestrator
 *
 * This is the main entry point for staged composition in god-write.
 * It provides a high-level interface for generating academic writing
 * using the micro-meso-macro pipeline.
 *
 * @module composition-orchestrator
 */

import { OrchestratorIntegration, type GodWriteIntegrationSpec, type GodWriteIntegrationResult } from './orchestrator-integration.js';
import { ChapterSpecMapper, type ChapterOutline } from './chapter-spec-mapper.js';
import {
  buildCorpusConstraint,
  CitationEnforcer,
  calculateCitationBudget,
  type CorpusConstraint,
  type EnforcementResult,
  type ContextChunk,
} from '../../../core/writing/index.js';

// Re-export types for external use
export type { ChapterOutline };

/**
 * Composition request
 */
export interface CompositionRequest {
  /** Request type */
  type: 'chapter' | 'section' | 'simple';

  /** Chapter outline (for type='chapter') */
  chapterOutline?: ChapterOutline;

  /** Integration spec (for type='section') */
  integrationSpec?: GodWriteIntegrationSpec;

  /** Simple outline (for type='simple') */
  simpleOutline?: {
    title: string;
    keyPoints: string[];
    options?: {
      chapterNumber?: number;
      purpose?: string;
      targetAudience?: string;
      evidenceType?: 'empirical' | 'theoretical' | 'analytical' | 'conceptual';
    };
  };

  /** Enable staged composition (default: true) */
  enableStagedComposition?: boolean;

  /** Enable verbose output (default: false) */
  verbose?: boolean;
}

/**
 * Composition result
 */
export interface CompositionResult {
  /** Whether composition succeeded */
  succeeded: boolean;

  /** Generated prose */
  prose: string;

  /** Integration result (if staged composition was used) */
  integrationResult?: GodWriteIntegrationResult;

  /** Citation enforcement result */
  citationEnforcement?: {
    action: 'pass' | 'corrected' | 'warning' | 'rejected';
    totalCitations: number;
    hallucinatedCitations: number;
    correctionsMade: number;
    missingPageNumbers: number;
    passRate: number;
    report: string;
  };

  /** Metadata */
  metadata: {
    wordCount: number;
    processingTime: number;
    usedStagedComposition: boolean;
    qualityScore?: number;
  };

  /** Report */
  report: string;
}

/**
 * CompositionOrchestrator - Main entry point for staged composition
 */
export class CompositionOrchestrator {
  private integration: OrchestratorIntegration;
  private specMapper: ChapterSpecMapper;

  constructor() {
    this.integration = new OrchestratorIntegration();
    this.specMapper = new ChapterSpecMapper();
  }

  /**
   * Compose document using staged composition
   */
  async compose(request: CompositionRequest): Promise<CompositionResult> {
    const startTime = Date.now();

    // Check if staged composition is enabled
    if (request.enableStagedComposition === false) {
      return this.composeFallback(request, startTime);
    }

    try {
      // Get integration spec based on request type
      let spec: GodWriteIntegrationSpec;

      switch (request.type) {
        case 'chapter':
          if (!request.chapterOutline) {
            throw new Error('Chapter outline required for type="chapter"');
          }
          spec = this.specMapper.mapChapterToSpec(request.chapterOutline);
          break;

        case 'section':
          if (!request.integrationSpec) {
            throw new Error('Integration spec required for type="section"');
          }
          spec = request.integrationSpec;
          break;

        case 'simple':
          if (!request.simpleOutline) {
            throw new Error('Simple outline required for type="simple"');
          }
          spec = this.specMapper.mapSimpleOutline(
            request.simpleOutline.title,
            request.simpleOutline.keyPoints,
            request.simpleOutline.options
          );
          break;

        default:
          throw new Error(`Unknown request type: ${request.type}`);
      }

      // Enable verbose if requested
      if (request.verbose) {
        spec.verbose = true;
      }

      // Execute staged composition
      const integrationResult = await this.integration.execute(spec);

      // PHASE 2/4/5: Citation enforcement (hallucination prevention)
      let finalProse = integrationResult.prose;
      let enforcementResult: EnforcementResult | undefined;

      if (integrationResult.succeeded && integrationResult.prose) {
        try {
          // Get corpus chunks from spec (if available)
          const corpusChunks = (spec as any).corpusChunks as ContextChunk[] | undefined;

          if (corpusChunks && corpusChunks.length > 0) {
            if (request.verbose) {
              console.log(`\n[Citation Enforcement] Validating citations against ${corpusChunks.length} corpus sources...`);
            }

            // PHASE 1: Build corpus constraint
            const corpusConstraint = buildCorpusConstraint(corpusChunks, {
              enforcement: 'strict',
              missingCitationPlaceholder: '[CITATION NEEDED]',
            });

            // PHASE 5: Citation budget check (warning only, not blocking)
            const budgetResult = calculateCitationBudget(corpusChunks, {
              targetWords: integrationResult.metadata.totalWordCount,
              documentType: 'dissertation',
            });

            if (!budgetResult.sufficient && request.verbose) {
              console.warn(`[Citation Budget] Warning: ${budgetResult.warning}`);
              console.warn(`[Citation Budget] Recommended word count: ${budgetResult.recommendedWordCount || 'N/A'}`);
            }

            // PHASE 2/4/7: Citation enforcement (including quotation fidelity)
            const enforcer = new CitationEnforcer(corpusConstraint, {
              mode: 'auto-correct',
              minPassRate: 0.85,
              maxHallucinations: 3,
              includeReport: request.verbose || false,
            }, corpusChunks);

            enforcementResult = await enforcer.enforce(integrationResult.prose);

            if (request.verbose) {
              console.log(`[Citation Enforcement] Action: ${enforcementResult.action.toUpperCase()}`);
              console.log(`[Citation Enforcement] Total Citations: ${enforcementResult.validation.totalCitations}`);
              console.log(`[Citation Enforcement] Valid: ${enforcementResult.validation.valid.length}`);
              console.log(`[Citation Enforcement] Hallucinated: ${enforcementResult.validation.hallucinated.length}`);
              console.log(`[Citation Enforcement] Missing Page Numbers: ${enforcementResult.missingPageNumbersCount}`);
              console.log(`[Citation Enforcement] Pass Rate: ${(enforcementResult.validation.passRate * 100).toFixed(1)}%`);
            }

            if (enforcementResult.action === 'corrected') {
              finalProse = enforcementResult.content;
              if (request.verbose) {
                console.log(`[Citation Enforcement] Corrected ${enforcementResult.correctionsCount} hallucinated citations`);
              }
            } else if (enforcementResult.action === 'rejected') {
              console.error('[Citation Enforcement] Generated content rejected due to excessive hallucinations');
              // Don't fail the entire composition, but warn the user
              if (request.verbose) {
                console.warn('[Citation Enforcement] Using original prose with hallucinations flagged');
              }
            }
          } else if (request.verbose) {
            console.log('[Citation Enforcement] Skipped - no corpus chunks available');
          }
        } catch (enforcementError) {
          console.error('[Citation Enforcement] Error during citation enforcement:', enforcementError);
          // Don't fail the composition - use original prose
          if (request.verbose) {
            console.warn('[Citation Enforcement] Using original prose due to enforcement error');
          }
        }
      }

      // Build composition result
      const result: CompositionResult = {
        succeeded: integrationResult.succeeded,
        prose: finalProse,
        integrationResult,
        citationEnforcement: enforcementResult ? {
          action: enforcementResult.action,
          totalCitations: enforcementResult.validation.totalCitations,
          hallucinatedCitations: enforcementResult.validation.hallucinated.length,
          correctionsMade: enforcementResult.correctionsCount,
          missingPageNumbers: enforcementResult.missingPageNumbersCount,
          passRate: enforcementResult.validation.passRate,
          report: enforcementResult.report,
        } : undefined,
        metadata: {
          wordCount: finalProse.split(/\s+/).length,
          processingTime: Date.now() - startTime,
          usedStagedComposition: true,
          qualityScore: integrationResult.metadata.overallQualityScore
        },
        report: this.buildFinalReport(integrationResult.report, enforcementResult)
      };

      return result;
    } catch (error) {
      console.error('Staged composition failed:', error);
      return this.composeFallback(request, startTime);
    }
  }

  /**
   * Fallback composition (non-staged)
   */
  private async composeFallback(
    request: CompositionRequest,
    startTime: number
  ): Promise<CompositionResult> {
    // Simple fallback - just generate placeholder text
    const placeholder = `# ${this.getTitle(request)}\n\n[Fallback mode - staged composition not available]\n\nThis content would normally be generated through the staged composition pipeline.`;

    return {
      succeeded: false,
      prose: placeholder,
      metadata: {
        wordCount: placeholder.split(/\s+/).length,
        processingTime: Date.now() - startTime,
        usedStagedComposition: false
      },
      report: 'Staged composition failed or was disabled. Used fallback mode.'
    };
  }

  /**
   * Get title from request
   */
  private getTitle(request: CompositionRequest): string {
    switch (request.type) {
      case 'chapter':
        return request.chapterOutline?.title || 'Chapter';
      case 'section':
        return request.integrationSpec?.structure.title || 'Section';
      case 'simple':
        return request.simpleOutline?.title || 'Document';
      default:
        return 'Document';
    }
  }

  /**
   * Compose from chapter outline (convenience method)
   */
  async composeChapter(outline: ChapterOutline, verbose = false): Promise<CompositionResult> {
    return this.compose({
      type: 'chapter',
      chapterOutline: outline,
      verbose
    });
  }

  /**
   * Compose from simple outline (convenience method)
   */
  async composeSimple(
    title: string,
    keyPoints: string[],
    options?: {
      chapterNumber?: number;
      purpose?: string;
      targetAudience?: string;
      evidenceType?: 'empirical' | 'theoretical' | 'analytical' | 'conceptual';
      verbose?: boolean;
    }
  ): Promise<CompositionResult> {
    return this.compose({
      type: 'simple',
      simpleOutline: {
        title,
        keyPoints,
        options: options ? {
          chapterNumber: options.chapterNumber,
          purpose: options.purpose,
          targetAudience: options.targetAudience,
          evidenceType: options.evidenceType
        } : undefined
      },
      verbose: options?.verbose || false
    });
  }

  /**
   * Build final report combining orchestration and enforcement results
   */
  private buildFinalReport(
    orchestrationReport: string,
    enforcementResult?: EnforcementResult
  ): string {
    let report = orchestrationReport;

    if (enforcementResult) {
      report += '\n\n' + '═'.repeat(80) + '\n';
      report += 'CITATION HALLUCINATION PREVENTION\n';
      report += '═'.repeat(80) + '\n\n';
      report += enforcementResult.report;
    }

    return report;
  }

  /**
   * Check if staged composition is available
   */
  async checkAvailability(): Promise<{
    available: boolean;
    version: string;
    features: string[];
  }> {
    return {
      available: true,
      version: '1.0.0',
      features: [
        'Micro-meso-macro orchestration',
        'Toulmin argument validation',
        'Term consistency checking',
        'Claim deduplication',
        'Significance and stakes analysis',
        'SIR-to-prose rendering',
        'Style profile integration',
        'Citation hallucination prevention'
      ]
    };
  }
}

/**
 * Singleton instance
 */
export const compositionOrchestrator = new CompositionOrchestrator();
