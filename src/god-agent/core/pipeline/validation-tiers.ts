/**
 * Tiered Validation System for PhD Pipeline
 * PHASE-2-002 - Implement Tiered Validation System
 *
 * Provides three levels of validation:
 * - Tier 1 (Per-Agent): Lightweight schema validation after each agent
 * - Tier 2 (Phase Boundary): Cross-agent consistency at phase transitions
 * - Tier 3 (Chapter Complete): Full Quality Gauntlet validation
 *
 * Part of PhD Pipeline Effectiveness Improvement Plan
 * Implementation Plan Reference: phd-pipeline-implementation-plan.md
 */

import {
  validateAgentOutput,
  type SchemaValidationResult,
  type AgentKey,
  isValidAgentKey,
  getExpectedFields,
} from './agent-schemas.js';
import { getAgentsByPhase } from './phd-pipeline-config.js';
import type { IAgentConfig } from './pipeline-types.js';
import type { GauntletResult } from '../../cli/quality/quality-gauntlet.js';
import { createDefaultGauntlet, createStrictGauntlet } from '../../cli/quality/quality-gauntlet.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Validation tier levels
 */
export enum ValidationTier {
  /** Lightweight per-agent validation */
  AGENT = 1,

  /** Cross-agent consistency at phase boundary */
  PHASE = 2,

  /** Full gauntlet at chapter completion */
  CHAPTER = 3,
}

/**
 * Configuration for the tiered validation system
 */
export interface ValidationConfig {
  /** Which tiers to enable */
  enabledTiers: ValidationTier[];

  /** Maximum retry attempts for Tier 1 failures */
  tier1MaxRetries: number;

  /** Whether to fail fast on Tier 2 errors */
  tier2FailFast: boolean;

  /** Gauntlet configuration for Tier 3 */
  tier3GauntletConfig: 'default' | 'strict' | 'draft';

  /** Whether to log validation results */
  logResults: boolean;

  /** Whether to treat warnings as errors */
  strictMode: boolean;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Which tier this validation was from */
  tier: ValidationTier;

  /** Whether validation passed */
  passed: boolean;

  /** List of errors found */
  errors: string[];

  /** List of warnings (non-blocking) */
  warnings: string[];

  /** Whether this failure can be retried */
  retryable: boolean;

  /** Guidance for revision if failed */
  revisionGuidance?: string;

  /** Detailed breakdown by component */
  details?: Record<string, SchemaValidationResult>;

  /** Timestamp of validation */
  timestamp: string;

  /** Duration in milliseconds */
  durationMs: number;
}

/**
 * Phase consistency check result
 */
export interface PhaseConsistencyResult {
  /** Phase ID that was checked */
  phaseId: number;

  /** Whether all agents have outputs */
  allAgentsComplete: boolean;

  /** Missing agent outputs */
  missingAgents: string[];

  /** Cross-agent inconsistencies */
  inconsistencies: Array<{
    agentA: string;
    agentB: string;
    issue: string;
  }>;

  /** Unmet dependencies */
  unmetDependencies: Array<{
    agent: string;
    missingDep: string;
  }>;
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default validation configuration
 */
export const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  enabledTiers: [ValidationTier.AGENT, ValidationTier.PHASE, ValidationTier.CHAPTER],
  tier1MaxRetries: 2,
  tier2FailFast: false,
  tier3GauntletConfig: 'default',
  logResults: true,
  strictMode: false,
};

// ============================================================================
// TieredValidator Class
// ============================================================================

/**
 * Tiered validation system for PhD Pipeline
 *
 * Provides progressive validation at three levels:
 * 1. Per-agent output schema validation
 * 2. Cross-agent consistency at phase boundaries
 * 3. Full Quality Gauntlet for completed chapters
 */
export class TieredValidator {
  private config: ValidationConfig;
  private agentOutputs: Map<string, unknown> = new Map();
  private phaseCompletionStatus: Map<number, boolean> = new Map();

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  }

  // ==========================================================================
  // Tier 1: Per-Agent Validation
  // ==========================================================================

  /**
   * Run Tier 1 validation on a single agent's output
   *
   * @param agentKey - The agent's key identifier
   * @param output - The agent's output to validate
   * @returns Validation result
   */
  validateAgentOutput(agentKey: string, output: unknown): ValidationResult {
    const startTime = Date.now();

    // Check if tier is enabled
    if (!this.isTierEnabled(ValidationTier.AGENT)) {
      return this.createPassResult(ValidationTier.AGENT, startTime);
    }

    // Validate against schema
    const schemaResult = validateAgentOutput(agentKey, output);

    // Store output for phase validation
    this.agentOutputs.set(agentKey, output);

    // Convert to validation result
    const errors = [...schemaResult.errors];
    const warnings = [...schemaResult.warnings];

    // In strict mode, warnings become errors
    if (this.config.strictMode && warnings.length > 0) {
      errors.push(...warnings.map(w => `[Strict] ${w}`));
      warnings.length = 0;
    }

    const passed = errors.length === 0;

    return {
      tier: ValidationTier.AGENT,
      passed,
      errors,
      warnings,
      retryable: true, // Tier 1 failures are always retryable
      revisionGuidance: passed ? undefined : this.generateTier1Guidance(agentKey, errors),
      details: { [agentKey]: schemaResult },
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Generate revision guidance for Tier 1 failures
   */
  private generateTier1Guidance(agentKey: string, errors: string[]): string {
    const expectedFields = isValidAgentKey(agentKey)
      ? getExpectedFields(agentKey as AgentKey)
      : [];

    const lines = [
      `Agent '${agentKey}' output validation failed.`,
      '',
      'Errors found:',
      ...errors.map(e => `  - ${e}`),
      '',
      'Expected output structure:',
      ...expectedFields.map(f => `  - ${f}`),
      '',
      'Please ensure the agent returns all required fields with valid values.',
    ];

    return lines.join('\n');
  }

  // ==========================================================================
  // Tier 2: Phase Boundary Validation
  // ==========================================================================

  /**
   * Run Tier 2 validation at phase boundary
   *
   * @param phaseId - The phase ID that just completed
   * @param agentOutputs - Map of agent key to output for this phase
   * @returns Validation result
   */
  validatePhaseCompletion(
    phaseId: number,
    agentOutputs: Map<string, unknown>
  ): ValidationResult {
    const startTime = Date.now();

    // Check if tier is enabled
    if (!this.isTierEnabled(ValidationTier.PHASE)) {
      return this.createPassResult(ValidationTier.PHASE, startTime);
    }

    // Update stored outputs
    for (const [key, output] of agentOutputs) {
      this.agentOutputs.set(key, output);
    }

    // Get expected agents for this phase
    const phaseAgents = getAgentsByPhase(phaseId);
    const consistency = this.checkPhaseConsistency(phaseId, phaseAgents, agentOutputs);

    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for missing agents
    if (!consistency.allAgentsComplete) {
      if (this.config.tier2FailFast) {
        errors.push(`Phase ${phaseId} incomplete: missing agents ${consistency.missingAgents.join(', ')}`);
      } else {
        warnings.push(`Phase ${phaseId} incomplete: missing agents ${consistency.missingAgents.join(', ')}`);
      }
    }

    // Check for inconsistencies
    for (const inc of consistency.inconsistencies) {
      errors.push(`Inconsistency between ${inc.agentA} and ${inc.agentB}: ${inc.issue}`);
    }

    // Check for unmet dependencies
    for (const dep of consistency.unmetDependencies) {
      errors.push(`Agent ${dep.agent} missing dependency: ${dep.missingDep}`);
    }

    // Mark phase as complete if passed
    const passed = errors.length === 0;
    if (passed) {
      this.phaseCompletionStatus.set(phaseId, true);
    }

    return {
      tier: ValidationTier.PHASE,
      passed,
      errors,
      warnings,
      retryable: false, // Phase failures need rollback, not retry
      revisionGuidance: passed ? undefined : this.generateTier2Guidance(phaseId, consistency),
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Check phase consistency
   */
  private checkPhaseConsistency(
    phaseId: number,
    phaseAgents: IAgentConfig[],
    outputs: Map<string, unknown>
  ): PhaseConsistencyResult {
    const missingAgents: string[] = [];
    const inconsistencies: PhaseConsistencyResult['inconsistencies'] = [];
    const unmetDependencies: PhaseConsistencyResult['unmetDependencies'] = [];

    // Check each agent in the phase
    for (const agent of phaseAgents) {
      // Check if output exists
      if (!outputs.has(agent.key) && !this.agentOutputs.has(agent.key)) {
        missingAgents.push(agent.key);
        continue;
      }

      // Check dependencies
      for (const depId of agent.dependencies) {
        const depAgent = phaseAgents.find(a => a.id === depId);
        if (depAgent && !outputs.has(depAgent.key) && !this.agentOutputs.has(depAgent.key)) {
          unmetDependencies.push({
            agent: agent.key,
            missingDep: depAgent.key,
          });
        }
      }
    }

    // Cross-agent consistency checks
    // Example: Check that dependency mapper output is consistent with component designer
    if (outputs.has('component-designer') && outputs.has('dependency-mapper')) {
      const components = outputs.get('component-designer') as Record<string, unknown>;
      const dependencies = outputs.get('dependency-mapper') as Record<string, unknown>;

      if (components && dependencies) {
        // Verify component IDs in dependency graph exist in component specs
        // This is a simplified check - real implementation would be more thorough
        const componentSpecs = (components as any).component_specs;
        const depGraph = (dependencies as any).dependency_graph;

        if (Array.isArray(componentSpecs) && depGraph?.nodes) {
          const componentIds = new Set(componentSpecs.map((c: any) => c.id || c.name));
          const graphNodes = new Set(depGraph.nodes);

          for (const node of graphNodes) {
            if (!componentIds.has(node) && typeof node === 'string' && !node.startsWith('external_')) {
              inconsistencies.push({
                agentA: 'component-designer',
                agentB: 'dependency-mapper',
                issue: `Node '${node}' in dependency graph not found in component specs`,
              });
            }
          }
        }
      }
    }

    return {
      phaseId,
      allAgentsComplete: missingAgents.length === 0,
      missingAgents,
      inconsistencies,
      unmetDependencies,
    };
  }

  /**
   * Generate revision guidance for Tier 2 failures
   */
  private generateTier2Guidance(phaseId: number, consistency: PhaseConsistencyResult): string {
    const lines = [
      `Phase ${phaseId} validation failed.`,
      '',
    ];

    if (consistency.missingAgents.length > 0) {
      lines.push('Missing agent outputs:');
      lines.push(...consistency.missingAgents.map(a => `  - ${a}`));
      lines.push('');
    }

    if (consistency.inconsistencies.length > 0) {
      lines.push('Cross-agent inconsistencies:');
      for (const inc of consistency.inconsistencies) {
        lines.push(`  - ${inc.agentA} vs ${inc.agentB}: ${inc.issue}`);
      }
      lines.push('');
    }

    if (consistency.unmetDependencies.length > 0) {
      lines.push('Unmet dependencies:');
      for (const dep of consistency.unmetDependencies) {
        lines.push(`  - ${dep.agent} requires ${dep.missingDep}`);
      }
      lines.push('');
    }

    lines.push('Consider rolling back to the start of this phase and re-running affected agents.');

    return lines.join('\n');
  }

  // ==========================================================================
  // Tier 3: Chapter Validation (Full Gauntlet)
  // ==========================================================================

  /**
   * Run Tier 3 validation (full Quality Gauntlet) on a completed chapter
   *
   * @param chapterText - The full text of the chapter
   * @param chapterId - The chapter number
   * @returns Validation result
   */
  async validateChapter(chapterText: string, chapterId: number): Promise<ValidationResult> {
    const startTime = Date.now();

    // Check if tier is enabled
    if (!this.isTierEnabled(ValidationTier.CHAPTER)) {
      return this.createPassResult(ValidationTier.CHAPTER, startTime);
    }

    // Create appropriate gauntlet based on config
    const gauntlet = this.config.tier3GauntletConfig === 'strict'
      ? createStrictGauntlet()
      : createDefaultGauntlet();

    // Run the gauntlet
    try {
      const gauntletResult: GauntletResult = await gauntlet.runGauntlet(chapterText, chapterId);

      const passed = !gauntletResult.revisionRequired;
      const errors: string[] = [];
      const warnings: string[] = [];

      // Extract errors from gauntlet issues
      for (const issue of gauntletResult.allIssues) {
        if (issue.severity === 'critical' || issue.severity === 'major') {
          errors.push(`[${issue.type}] ${issue.description}`);
        } else {
          warnings.push(`[${issue.type}] ${issue.description}`);
        }
      }

      return {
        tier: ValidationTier.CHAPTER,
        passed,
        errors,
        warnings,
        retryable: false,
        revisionGuidance: passed ? undefined : this.generateTier3Guidance(gauntletResult),
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        tier: ValidationTier.CHAPTER,
        passed: false,
        errors: [`Gauntlet execution failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        retryable: true,
        timestamp: new Date().toISOString(),
        durationMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Generate revision guidance for Tier 3 failures
   */
  private generateTier3Guidance(gauntletResult: GauntletResult): string {
    const lines = [
      'Chapter failed Quality Gauntlet validation.',
      '',
      `Overall Score: ${(gauntletResult.overallScore * 100).toFixed(1)}%`,
      '',
      'Stage Results:',
    ];

    for (const stage of gauntletResult.stageResults) {
      const status = stage.passed ? '✓' : '✗';
      lines.push(`  ${status} ${stage.stageName}: ${(stage.score * 100).toFixed(1)}%`);
    }

    if (gauntletResult.allIssues.length > 0) {
      lines.push('');
      lines.push('Issues to address:');
      for (const issue of gauntletResult.allIssues.slice(0, 10)) {
        lines.push(`  - [${issue.severity.toUpperCase()}] ${issue.description}`);
        if (issue.suggestion) {
          lines.push(`    Suggestion: ${issue.suggestion}`);
        }
      }

      if (gauntletResult.allIssues.length > 10) {
        lines.push(`  ... and ${gauntletResult.allIssues.length - 10} more issues`);
      }
    }

    return lines.join('\n');
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Check if a validation tier is enabled
   */
  private isTierEnabled(tier: ValidationTier): boolean {
    return this.config.enabledTiers.includes(tier);
  }

  /**
   * Create a passing result (for disabled tiers)
   */
  private createPassResult(tier: ValidationTier, startTime: number): ValidationResult {
    return {
      tier,
      passed: true,
      errors: [],
      warnings: [],
      retryable: false,
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): ValidationConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  /**
   * Clear stored agent outputs (for new pipeline run)
   */
  reset(): void {
    this.agentOutputs.clear();
    this.phaseCompletionStatus.clear();
  }

  /**
   * Get stored agent output
   */
  getAgentOutput(agentKey: string): unknown {
    return this.agentOutputs.get(agentKey);
  }

  /**
   * Check if phase has been validated
   */
  isPhaseComplete(phaseId: number): boolean {
    return this.phaseCompletionStatus.get(phaseId) ?? false;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a tiered validator with default settings
 */
export function createTieredValidator(): TieredValidator {
  return new TieredValidator();
}

/**
 * Create a strict tiered validator
 */
export function createStrictTieredValidator(): TieredValidator {
  return new TieredValidator({
    enabledTiers: [ValidationTier.AGENT, ValidationTier.PHASE, ValidationTier.CHAPTER],
    tier1MaxRetries: 3,
    tier2FailFast: true,
    tier3GauntletConfig: 'strict',
    logResults: true,
    strictMode: true,
  });
}

/**
 * Create a lightweight tiered validator (Tier 1 only)
 */
export function createLightweightValidator(): TieredValidator {
  return new TieredValidator({
    enabledTiers: [ValidationTier.AGENT],
    tier1MaxRetries: 1,
    tier2FailFast: false,
    tier3GauntletConfig: 'default',
    logResults: false,
    strictMode: false,
  });
}
