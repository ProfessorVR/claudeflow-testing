/**
 * Orchestrator Integration
 *
 * This module integrates the PassOrchestrator with god-write, providing
 * a bridge between the staged composition pipeline and the god-write
 * command system.
 *
 * @module orchestrator-integration
 */

import { PassOrchestrator, type PassOrchestrationSpec, type PassOrchestrationResult } from '../passes/pass-orchestrator.js';
import { SIRToProseRenderer, type ProseRenderSpec } from './sir-to-prose.js';
import type { MicroPassSpec } from '../passes/micro-pass.js';

/**
 * God-write integration specification
 */
export interface GodWriteIntegrationSpec {
  /** Document type (chapter, section, paper) */
  documentType: 'chapter' | 'section' | 'paper' | 'article';

  /** Document purpose */
  documentPurpose: string;

  /** Target audience */
  targetAudience: string;

  /** Chapter/section structure */
  structure: DocumentStructure;

  /** Quality thresholds (optional, uses defaults if not provided) */
  thresholds?: {
    toulminCompleteness?: number;
    coherence?: number;
    significance?: number;
    stakes?: number;
  };

  /** Style profile */
  styleProfile?: any;

  /** Enable verbose output */
  verbose?: boolean;
}

/**
 * Document structure
 */
export interface DocumentStructure {
  /** Document ID */
  documentId: string;

  /** Document title */
  title: string;

  /** Sections */
  sections: SectionStructure[];
}

/**
 * Section structure
 */
export interface SectionStructure {
  /** Section ID */
  sectionId: string;

  /** Section title */
  title: string;

  /** Section thesis */
  thesis: string;

  /** Subsections */
  subsections: SubsectionStructure[];
}

/**
 * Subsection structure
 */
export interface SubsectionStructure {
  /** Subsection ID */
  subsectionId: string;

  /** Subsection title */
  title?: string;

  /** Subsection thesis */
  thesis: string;

  /** Target claims to establish */
  targetClaims: {
    statement: string;
    evidenceType: 'empirical' | 'theoretical' | 'analytical' | 'conceptual';
    minEvidence: number;
    requiresRebuttal: boolean;
  }[];

  /** Input assumptions */
  inputAssumptions?: {
    requiredClaims: string[];
    requiredConcepts: string[];
  };

  /** Word count target */
  wordCountTarget?: {
    min: number;
    max: number;
  };
}

/**
 * Integration result
 */
export interface GodWriteIntegrationResult {
  /** Whether integration succeeded */
  succeeded: boolean;

  /** Orchestration result */
  orchestrationResult: PassOrchestrationResult;

  /** Rendered prose */
  prose: string;

  /** Document metadata */
  metadata: IntegrationMetadata;

  /** Comprehensive report */
  report: string;
}

/**
 * Integration metadata
 */
export interface IntegrationMetadata {
  /** Total word count */
  totalWordCount: number;

  /** Subsections processed */
  subsectionsProcessed: number;

  /** Sections integrated */
  sectionsIntegrated: number;

  /** Document synthesized */
  documentSynthesized: boolean;

  /** Overall quality score */
  overallQualityScore: number;

  /** Total processing time (ms) */
  totalProcessingTime: number;
}

/**
 * OrchestratorIntegration - Bridges PassOrchestrator and god-write
 */
export class OrchestratorIntegration {
  private orchestrator: PassOrchestrator;
  private proseRenderer: SIRToProseRenderer;

  constructor() {
    this.orchestrator = new PassOrchestrator();
    this.proseRenderer = new SIRToProseRenderer();
  }

  /**
   * Execute staged composition for god-write
   */
  async execute(spec: GodWriteIntegrationSpec): Promise<GodWriteIntegrationResult> {
    const startTime = Date.now();

    if (spec.verbose) {
      console.log('═'.repeat(80));
      console.log('GOD-WRITE STAGED COMPOSITION INTEGRATION');
      console.log('═'.repeat(80));
      console.log('');
    }

    // Step 1: Convert god-write spec to orchestration spec
    if (spec.verbose) console.log('Step 1: Converting to orchestration specification...');
    const orchestrationSpec = this.convertToOrchestrationSpec(spec);

    // Step 2: Execute orchestration pipeline
    if (spec.verbose) console.log('Step 2: Executing micro-meso-macro pipeline...');
    const orchestrationResult = await this.orchestrator.execute(orchestrationSpec);

    if (!orchestrationResult.succeeded) {
      return {
        succeeded: false,
        orchestrationResult,
        prose: '',
        metadata: {
          totalWordCount: 0,
          subsectionsProcessed: orchestrationResult.microResults.size,
          sectionsIntegrated: orchestrationResult.mesoResults.size,
          documentSynthesized: false,
          overallQualityScore: 0,
          totalProcessingTime: Date.now() - startTime
        },
        report: this.generateFailureReport(orchestrationResult)
      };
    }

    // Step 3: Render SIR to prose
    if (spec.verbose) console.log('Step 3: Rendering SIR to prose...');
    const prose = await this.renderToProse(orchestrationResult, spec);

    // Step 4: Calculate metadata
    const metadata = this.calculateMetadata(
      orchestrationResult,
      prose,
      Date.now() - startTime
    );

    // Step 5: Generate comprehensive report
    const report = this.generateSuccessReport(
      orchestrationResult,
      metadata,
      spec
    );

    if (spec.verbose) {
      console.log('');
      console.log('✅ Staged composition completed successfully');
      console.log('');
    }

    return {
      succeeded: true,
      orchestrationResult,
      prose,
      metadata,
      report
    };
  }

  /**
   * Convert god-write spec to orchestration spec
   */
  private convertToOrchestrationSpec(
    spec: GodWriteIntegrationSpec
  ): PassOrchestrationSpec {
    // Build micro specs from subsections
    const microSpecs: MicroPassSpec[] = [];

    for (const section of spec.structure.sections) {
      for (const subsection of section.subsections) {
        microSpecs.push({
          subsectionId: subsection.subsectionId,
          thesis: subsection.thesis,
          targetClaims: subsection.targetClaims.map((tc, i) => ({
            id: `${subsection.subsectionId}-claim-${i + 1}`,
            statement: tc.statement,
            evidenceType: tc.evidenceType,
            minEvidence: tc.minEvidence,
            requiresRebuttal: tc.requiresRebuttal
          })),
          inputAssumptions: subsection.inputAssumptions || {
            requiredClaims: [],
            requiredConcepts: []
          },
          outputTarget: {
            minWordCount: subsection.wordCountTarget?.min || 300,
            maxWordCount: subsection.wordCountTarget?.max || 500,
            targetClaimCount: subsection.targetClaims.length
          }
        });
      }
    }

    // Build section grouping
    const sectionGrouping = new Map<string, string[]>();
    for (const section of spec.structure.sections) {
      const subsectionIds = section.subsections.map(s => s.subsectionId);
      sectionGrouping.set(section.sectionId, subsectionIds);
    }

    // Build macro goals
    const macroGoals = {
      documentPurpose: spec.documentPurpose,
      targetAudience: spec.targetAudience,
      targetSignificance: spec.thresholds?.significance || 0.85,
      targetStakes: spec.thresholds?.stakes || 0.85,
      targetArchitectonics: 0.90
    };

    return {
      documentId: spec.structure.documentId,
      microSpecs,
      sectionGrouping,
      macroGoals
    };
  }

  /**
   * Render orchestration result to prose
   */
  private async renderToProse(
    orchestrationResult: PassOrchestrationResult,
    spec: GodWriteIntegrationSpec
  ): Promise<string> {
    const sections: string[] = [];

    // Render introduction
    if (orchestrationResult.macroResult.introduction) {
      sections.push(`# ${spec.structure.title}\n\n${orchestrationResult.macroResult.introduction.content}`);
    }

    // Render body sections
    for (const bodySection of orchestrationResult.macroResult.bodySections) {
      const mesoResult = orchestrationResult.mesoResults.get(bodySection.id);
      if (!mesoResult) continue;

      // Find section structure
      const sectionStructure = spec.structure.sections.find(s => s.sectionId === bodySection.id);
      const sectionTitle = sectionStructure?.title || bodySection.id;

      // Render section
      const proseSpec: ProseRenderSpec = {
        claimMap: mesoResult.integratedClaimMap,
        conceptLedger: mesoResult.integratedConceptLedger,
        transitions: mesoResult.transitions,
        style: {
          academicStyle: 'formal',
          citationStyle: 'APA',
          paragraphDensity: 'moderate',
          useFirstPerson: false,
          includeHedging: true
        },
        styleProfile: spec.styleProfile?.name
      };

      const rendered = await this.proseRenderer.render(proseSpec);
      sections.push(`## ${sectionTitle}\n\n${rendered.prose}`);
    }

    // Render conclusion
    if (orchestrationResult.macroResult.conclusion) {
      sections.push(`## Conclusion\n\n${orchestrationResult.macroResult.conclusion.content}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Calculate integration metadata
   */
  private calculateMetadata(
    orchestrationResult: PassOrchestrationResult,
    prose: string,
    totalProcessingTime: number
  ): IntegrationMetadata {
    const words = prose.split(/\s+/).filter(w => w.length > 0);

    // Calculate overall quality score
    const overallQualityScore = (
      orchestrationResult.metadata.microPassSuccessRate * 0.3 +
      orchestrationResult.metadata.mesoPassSuccessRate * 0.3 +
      (orchestrationResult.metadata.macroPassSucceeded ? 1.0 : 0) * 0.4
    );

    return {
      totalWordCount: words.length,
      subsectionsProcessed: orchestrationResult.metadata.subsectionsGenerated,
      sectionsIntegrated: orchestrationResult.metadata.sectionsIntegrated,
      documentSynthesized: orchestrationResult.metadata.documentSynthesized,
      overallQualityScore,
      totalProcessingTime
    };
  }

  /**
   * Generate success report
   */
  private generateSuccessReport(
    orchestrationResult: PassOrchestrationResult,
    metadata: IntegrationMetadata,
    spec: GodWriteIntegrationSpec
  ): string {
    const lines: string[] = [];

    lines.push('═'.repeat(80));
    lines.push('GOD-WRITE STAGED COMPOSITION - SUCCESS REPORT');
    lines.push('═'.repeat(80));
    lines.push('');

    // Document info
    lines.push('DOCUMENT:');
    lines.push(`  Title: ${spec.structure.title}`);
    lines.push(`  Type: ${spec.documentType}`);
    lines.push(`  Word count: ${metadata.totalWordCount}`);
    lines.push('');

    // Quality metrics
    lines.push('QUALITY METRICS:');
    lines.push(`  Overall quality score: ${(metadata.overallQualityScore * 100).toFixed(1)}%`);
    lines.push(`  Micro pass success: ${(orchestrationResult.metadata.microPassSuccessRate * 100).toFixed(1)}%`);
    lines.push(`  Meso pass success: ${(orchestrationResult.metadata.mesoPassSuccessRate * 100).toFixed(1)}%`);
    lines.push(`  Macro pass: ${orchestrationResult.metadata.macroPassSucceeded ? 'SUCCEEDED' : 'FAILED'}`);
    lines.push(`  Rework rate: ${(orchestrationResult.metadata.reworkRate * 100).toFixed(1)}%`);
    lines.push('');

    // Processing metrics
    lines.push('PROCESSING:');
    lines.push(`  Subsections processed: ${metadata.subsectionsProcessed}`);
    lines.push(`  Sections integrated: ${metadata.sectionsIntegrated}`);
    lines.push(`  Total time: ${metadata.totalProcessingTime}ms`);
    lines.push('');

    // Include orchestration report
    lines.push(orchestrationResult.report);

    return lines.join('\n');
  }

  /**
   * Generate failure report
   */
  private generateFailureReport(
    orchestrationResult: PassOrchestrationResult
  ): string {
    const lines: string[] = [];

    lines.push('═'.repeat(80));
    lines.push('GOD-WRITE STAGED COMPOSITION - FAILURE REPORT');
    lines.push('═'.repeat(80));
    lines.push('');

    lines.push('❌ ORCHESTRATION FAILED');
    lines.push('');

    lines.push('FAILURE REASONS:');
    if (orchestrationResult.metadata.microPassSuccessRate < 0.85) {
      lines.push(`  • Micro pass success rate too low: ${(orchestrationResult.metadata.microPassSuccessRate * 100).toFixed(1)}% (required: ≥85%)`);
    }
    if (orchestrationResult.metadata.mesoPassSuccessRate < 0.85) {
      lines.push(`  • Meso pass success rate too low: ${(orchestrationResult.metadata.mesoPassSuccessRate * 100).toFixed(1)}% (required: ≥85%)`);
    }
    if (!orchestrationResult.metadata.macroPassSucceeded) {
      lines.push(`  • Macro pass failed`);
    }
    if (orchestrationResult.metadata.reworkRate >= 0.10) {
      lines.push(`  • Rework rate too high: ${(orchestrationResult.metadata.reworkRate * 100).toFixed(1)}% (max: <10%)`);
    }
    lines.push('');

    lines.push(orchestrationResult.report);

    return lines.join('\n');
  }
}
