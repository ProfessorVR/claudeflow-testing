/**
 * Pass Orchestrator - Coordinates micro-meso-macro passes
 *
 * This orchestrator coordinates the complete three-pass pipeline:
 * 1. Micro pass - Generate subsections (claim-chains)
 * 2. Meso pass - Integrate subsections into sections
 * 3. Macro pass - Synthesize sections into document
 *
 * @module pass-orchestrator
 */

import { MicroPass, type MicroPassSpec, type MicroPassResult } from './micro-pass.js';
import { MesoPass, type MesoPassSpec, type MesoPassResult } from './meso-pass.js';
import { MacroPass, type MacroPassSpec, type MacroPassResult } from './macro-pass.js';

/**
 * Orchestration specification
 */
export interface PassOrchestrationSpec {
  /** Document identifier */
  documentId: string;

  /** Micro pass specifications */
  microSpecs: MicroPassSpec[];

  /** Grouping of subsections into sections */
  sectionGrouping: Map<string, string[]>; // sectionId -> subsectionIds

  /** Macro pass goals */
  macroGoals: {
    documentPurpose: string;
    targetAudience: string;
    targetSignificance: number;
    targetStakes: number;
    targetArchitectonics: number;
  };
}

/**
 * Orchestration result
 */
export interface PassOrchestrationResult {
  /** Whether orchestration succeeded */
  succeeded: boolean;

  /** Micro pass results */
  microResults: Map<string, MicroPassResult>;

  /** Meso pass results */
  mesoResults: Map<string, MesoPassResult>;

  /** Macro pass result */
  macroResult: MacroPassResult;

  /** Orchestration metadata */
  metadata: OrchestrationMetadata;

  /** Comprehensive report */
  report: string;
}

/**
 * Orchestration metadata
 */
export interface OrchestrationMetadata {
  /** Subsections generated */
  subsectionsGenerated: number;

  /** Sections integrated */
  sectionsIntegrated: number;

  /** Document synthesized */
  documentSynthesized: boolean;

  /** Micro pass success rate */
  microPassSuccessRate: number;

  /** Meso pass success rate */
  mesoPassSuccessRate: number;

  /** Macro pass succeeded */
  macroPassSucceeded: boolean;

  /** Rework iterations */
  reworkIterations: number;

  /** Rework rate */
  reworkRate: number;

  /** Total processing time (ms) */
  totalProcessingTime: number;
}

/**
 * PassOrchestrator - Coordinates micro-meso-macro pipeline
 */
export class PassOrchestrator {
  private microPass: MicroPass;
  private mesoPass: MesoPass;
  private macroPass: MacroPass;

  constructor() {
    this.microPass = new MicroPass();
    this.mesoPass = new MesoPass();
    this.macroPass = new MacroPass();
  }

  /**
   * Execute complete micro-meso-macro pipeline
   */
  async execute(spec: PassOrchestrationSpec): Promise<PassOrchestrationResult> {
    const startTime = Date.now();
    let reworkIterations = 0;

    // Phase 1: Execute all micro passes (subsections)
    console.log('Phase 1: Executing micro passes (subsection generation)...');
    const { microResults, microSuccessRate, microRework } = await this.executeMicroPasses(spec.microSpecs);
    reworkIterations += microRework;
    console.log(`  ✓ Generated ${microResults.size} subsections (${(microSuccessRate * 100).toFixed(0)}% success rate)`);

    // Phase 2: Execute meso passes (section integration)
    console.log('Phase 2: Executing meso passes (section integration)...');
    const { mesoResults, mesoSuccessRate, mesoRework } = await this.executeMesoPasses(
      microResults,
      spec.sectionGrouping
    );
    reworkIterations += mesoRework;
    console.log(`  ✓ Integrated ${mesoResults.size} sections (${(mesoSuccessRate * 100).toFixed(0)}% success rate)`);

    // Phase 3: Execute macro pass (document synthesis)
    console.log('Phase 3: Executing macro pass (document synthesis)...');
    const { macroResult, macroRework } = await this.executeMacroPass(
      mesoResults,
      spec.macroGoals,
      spec.documentId
    );
    reworkIterations += macroRework;
    console.log(`  ✓ Synthesized document (${macroResult.succeeded ? 'SUCCEEDED' : 'FAILED'})`);

    // Calculate metadata
    const metadata = this.calculateMetadata(
      microResults,
      mesoResults,
      macroResult,
      reworkIterations,
      spec.microSpecs.length,
      Date.now() - startTime
    );

    // Determine overall success
    const succeeded = this.determineOverallSuccess(metadata);

    // Generate comprehensive report
    const report = this.generateComprehensiveReport(
      microResults,
      mesoResults,
      macroResult,
      metadata,
      succeeded
    );

    return {
      succeeded,
      microResults,
      mesoResults,
      macroResult,
      metadata,
      report
    };
  }

  /**
   * Execute all micro passes
   */
  private async executeMicroPasses(
    specs: MicroPassSpec[]
  ): Promise<{
    microResults: Map<string, MicroPassResult>;
    microSuccessRate: number;
    microRework: number;
  }> {
    const results = new Map<string, MicroPassResult>();
    let successCount = 0;
    let reworkCount = 0;

    for (const spec of specs) {
      let result = await this.microPass.execute(spec);

      // Retry if failed (up to 2 retries)
      let retries = 0;
      while (!result.succeeded && retries < 2) {
        console.log(`  ⚠ Micro pass ${spec.subsectionId} failed, retrying...`);
        result = await this.microPass.execute(spec);
        retries++;
        reworkCount++;
      }

      results.set(spec.subsectionId, result);
      if (result.succeeded) successCount++;
    }

    return {
      microResults: results,
      microSuccessRate: successCount / specs.length,
      microRework: reworkCount
    };
  }

  /**
   * Execute meso passes
   */
  private async executeMesoPasses(
    microResults: Map<string, MicroPassResult>,
    sectionGrouping: Map<string, string[]>
  ): Promise<{
    mesoResults: Map<string, MesoPassResult>;
    mesoSuccessRate: number;
    mesoRework: number;
  }> {
    const results = new Map<string, MesoPassResult>();
    let successCount = 0;
    let reworkCount = 0;

    for (const [sectionId, subsectionIds] of sectionGrouping) {
      // Get subsection results
      const subsections = subsectionIds
        .map(id => microResults.get(id))
        .filter(r => r !== undefined) as MicroPassResult[];

      if (subsections.length === 0) {
        console.log(`  ⚠ No subsections found for section ${sectionId}, skipping...`);
        continue;
      }

      // Create meso spec
      const mesoSpec: MesoPassSpec = {
        sectionId,
        subsections,
        integrationGoals: {
          targetCoherence: 0.90,
          maxDuplication: 0.10,
          termConsistency: 0.95
        }
      };

      let result = await this.mesoPass.execute(mesoSpec);

      // Retry if failed (up to 2 retries)
      let retries = 0;
      while (!result.succeeded && retries < 2) {
        console.log(`  ⚠ Meso pass ${sectionId} failed, retrying...`);
        result = await this.mesoPass.execute(mesoSpec);
        retries++;
        reworkCount++;
      }

      results.set(sectionId, result);
      if (result.succeeded) successCount++;
    }

    return {
      mesoResults: results,
      mesoSuccessRate: sectionGrouping.size > 0 ? successCount / sectionGrouping.size : 0,
      mesoRework: reworkCount
    };
  }

  /**
   * Execute macro pass
   */
  private async executeMacroPass(
    mesoResults: Map<string, MesoPassResult>,
    macroGoals: PassOrchestrationSpec['macroGoals'],
    documentId: string
  ): Promise<{
    macroResult: MacroPassResult;
    macroRework: number;
  }> {
    const sections = Array.from(mesoResults.values());

    const macroSpec: MacroPassSpec = {
      chapterId: documentId,
      sections,
      synthesisGoals: {
        targetSignificance: macroGoals.targetSignificance,
        targetStakes: macroGoals.targetStakes,
        targetArchitectonics: macroGoals.targetArchitectonics
      },
      documentPurpose: macroGoals.documentPurpose,
      targetAudience: macroGoals.targetAudience
    };

    let result = await this.macroPass.execute(macroSpec);
    let reworkCount = 0;

    // Retry if failed (up to 2 retries)
    let retries = 0;
    while (!result.succeeded && retries < 2) {
      console.log(`  ⚠ Macro pass failed, retrying...`);
      result = await this.macroPass.execute(macroSpec);
      retries++;
      reworkCount++;
    }

    return {
      macroResult: result,
      macroRework: reworkCount
    };
  }

  /**
   * Calculate orchestration metadata
   */
  private calculateMetadata(
    microResults: Map<string, MicroPassResult>,
    mesoResults: Map<string, MesoPassResult>,
    macroResult: MacroPassResult,
    reworkIterations: number,
    totalSubsections: number,
    totalProcessingTime: number
  ): OrchestrationMetadata {
    const microSuccesses = Array.from(microResults.values()).filter(r => r.succeeded).length;
    const microPassSuccessRate = microResults.size > 0 ? microSuccesses / microResults.size : 0;

    const mesoSuccesses = Array.from(mesoResults.values()).filter(r => r.succeeded).length;
    const mesoPassSuccessRate = mesoResults.size > 0 ? mesoSuccesses / mesoResults.size : 0;

    const reworkRate = totalSubsections > 0 ? reworkIterations / totalSubsections : 0;

    return {
      subsectionsGenerated: microResults.size,
      sectionsIntegrated: mesoResults.size,
      documentSynthesized: macroResult.succeeded,
      microPassSuccessRate,
      mesoPassSuccessRate,
      macroPassSucceeded: macroResult.succeeded,
      reworkIterations,
      reworkRate,
      totalProcessingTime
    };
  }

  /**
   * Determine overall success
   */
  private determineOverallSuccess(metadata: OrchestrationMetadata): boolean {
    return metadata.microPassSuccessRate >= 0.85 &&
           metadata.mesoPassSuccessRate >= 0.85 &&
           metadata.macroPassSucceeded &&
           metadata.reworkRate < 0.10; // < 10% rework rate
  }

  /**
   * Generate comprehensive report
   */
  private generateComprehensiveReport(
    microResults: Map<string, MicroPassResult>,
    mesoResults: Map<string, MesoPassResult>,
    macroResult: MacroPassResult,
    metadata: OrchestrationMetadata,
    succeeded: boolean
  ): string {
    const lines: string[] = [];

    lines.push('═'.repeat(80));
    lines.push('MICRO-MESO-MACRO ORCHESTRATION COMPREHENSIVE REPORT');
    lines.push('═'.repeat(80));
    lines.push('');

    // Overall summary
    lines.push('OVERALL ASSESSMENT:');
    lines.push(`  Status: ${succeeded ? '✅ SUCCEEDED' : '❌ FAILED'}`);
    lines.push(`  Subsections generated: ${metadata.subsectionsGenerated}`);
    lines.push(`  Sections integrated: ${metadata.sectionsIntegrated}`);
    lines.push(`  Document synthesized: ${metadata.documentSynthesized ? 'Yes' : 'No'}`);
    lines.push('');

    // Pass results
    lines.push('PASS RESULTS:');
    lines.push(`  Micro pass success rate: ${(metadata.microPassSuccessRate * 100).toFixed(1)}%`);
    lines.push(`  Meso pass success rate: ${(metadata.mesoPassSuccessRate * 100).toFixed(1)}%`);
    lines.push(`  Macro pass succeeded: ${metadata.macroPassSucceeded ? 'Yes' : 'No'}`);
    lines.push('');

    // Rework metrics
    lines.push('REWORK METRICS:');
    lines.push(`  Rework iterations: ${metadata.reworkIterations}`);
    lines.push(`  Rework rate: ${(metadata.reworkRate * 100).toFixed(1)}% (target: < 10%)`);
    lines.push('');

    // Processing time
    lines.push('PROCESSING TIME:');
    lines.push(`  Total: ${metadata.totalProcessingTime}ms`);
    lines.push('');

    // Detailed pass reports
    lines.push('═'.repeat(80));
    lines.push('DETAILED PASS REPORTS');
    lines.push('═'.repeat(80));
    lines.push('');

    // Sample micro pass report
    if (microResults.size > 0) {
      const firstMicro = Array.from(microResults.values())[0];
      lines.push('SAMPLE MICRO PASS:');
      lines.push(this.microPass.getDetailedReport(firstMicro));
      lines.push('');
    }

    // Sample meso pass report
    if (mesoResults.size > 0) {
      const firstMeso = Array.from(mesoResults.values())[0];
      lines.push('SAMPLE MESO PASS:');
      lines.push(this.mesoPass.getDetailedReport(firstMeso));
      lines.push('');
    }

    // Macro pass report
    lines.push('MACRO PASS:');
    lines.push(this.macroPass.getDetailedReport(macroResult));
    lines.push('');

    lines.push('═'.repeat(80));
    lines.push('END OF ORCHESTRATION REPORT');
    lines.push('═'.repeat(80));

    return lines.join('\n');
  }
}
