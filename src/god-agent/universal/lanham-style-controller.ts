/**
 * LanhamStyleController — facade for all Lanham pipeline logic.
 *
 * The orchestrator calls this controller; it never imports the analyzer
 * or agent directly. This keeps the 3,700+ line orchestrator as a
 * coordinator, not a style-engine kitchen sink.
 */

import type { LanhamProseMetrics } from './style-analyzer.js';
import type { LanhamStyleTarget } from './stages/stage-types.js';
import { LanhamProseAnalyzer } from '../cli/style/lanham-prose-analyzer.js';
import { AdvancedLanhamAnalyzer } from '../cli/style/advanced-lanham-analyzer.js';
import type { ILanhamAnalyzer } from '../cli/style/lanham-analyzer-interface.js';
import type { Genre } from '../cli/style/lanham-style-policy.js';

// ============================================================================
// Config
// ============================================================================

export interface LanhamControllerConfig {
  analyzerTier: 'heuristic' | 'deep' | 'auto';  // default: 'heuristic'
  genre: Genre;
  targetMetrics?: LanhamProseMetrics;
  lanhamStyleTarget?: LanhamStyleTarget;
  regenerationConfig?: RegenerationConfig;
}

interface RegenerationConfig {
  enabled: boolean;
  hardConstraintAxes: string[];
  firmGuidanceAxes: string[];
  requireLabelChange: boolean;
}

const DEFAULT_REGEN_CONFIG: RegenerationConfig = {
  enabled: true,
  hardConstraintAxes: ['nounVerb', 'primaryRegister'],
  firmGuidanceAxes: ['voice'],
  requireLabelChange: true,
};

// ============================================================================
// Helpers
// ============================================================================

function getLabelForAxis(metrics: LanhamProseMetrics, axis: string): string | null {
  switch (axis) {
    case 'nounVerb': return metrics.labels.nounVerb;
    case 'primaryRegister': return metrics.labels.primaryRegister;
    case 'voice': return metrics.labels.voice;
    case 'parataxisHypotaxis': return metrics.labels.parataxisHypotaxis;
    case 'periodicRunning': return metrics.labels.periodicRunning;
    case 'opacity': return metrics.labels.opacity;
    default: return null;
  }
}

function isDriftAwayFromTarget(
  axis: string,
  generatedLabel: string,
  targetLabel: string,
  _previousLabel?: string,
): boolean {
  if (generatedLabel === targetLabel) return false;
  if (axis === 'primaryRegister') return true;

  if (axis === 'nounVerb') {
    const scale: Record<string, number> = {
      'predominantly noun-style': 0, 'balanced': 1, 'predominantly verb-style': 2,
    };
    const genPos = scale[generatedLabel] ?? 1;
    const tgtPos = scale[targetLabel] ?? 1;
    const prevPos = _previousLabel != null ? (scale[_previousLabel] ?? 1) : genPos;
    return Math.abs(genPos - tgtPos) >= Math.abs(prevPos - tgtPos);
  }

  if (axis === 'voice') {
    const scale: Record<string, number> = {
      'unvoiced': 0, 'moderate voice': 1, 'strongly voiced': 2,
    };
    const genPos = scale[generatedLabel] ?? 1;
    const tgtPos = scale[targetLabel] ?? 1;
    const prevPos = _previousLabel != null ? (scale[_previousLabel] ?? 1) : genPos;
    return Math.abs(genPos - tgtPos) >= Math.abs(prevPos - tgtPos);
  }

  return true;
}

// ============================================================================
// Controller
// ============================================================================

export class LanhamStyleController {
  private analyzer: ILanhamAnalyzer;
  private targetMetrics: LanhamProseMetrics | undefined;
  private lanhamStyleTarget: LanhamStyleTarget | undefined;
  private regenConfig: RegenerationConfig;

  constructor(config: LanhamControllerConfig) {
    const tier = config.analyzerTier ?? 'heuristic';
    if (tier === 'deep' || (tier === 'auto' && (config.genre === 'academic' || config.genre === 'legal'))) {
      this.analyzer = new AdvancedLanhamAnalyzer(config.genre);
    } else {
      this.analyzer = new LanhamProseAnalyzer(config.genre);
    }
    this.targetMetrics = config.targetMetrics;
    this.lanhamStyleTarget = config.lanhamStyleTarget;
    this.regenConfig = config.regenerationConfig ?? DEFAULT_REGEN_CONFIG;
  }

  /** Run full analysis on generated text, return metrics. */
  async analyze(text: string): Promise<LanhamProseMetrics> {
    return this.analyzer.fullAnalysis(text);
  }

  /**
   * Compare generated metrics against target, return tiered drift advisory (or null).
   * Only reports drift on hard-constraint and firm-guidance axes.
   */
  computeLanhamDrift(
    generated: LanhamProseMetrics,
    target: LanhamProseMetrics | undefined,
  ): string | null {
    if (!target) return null;

    const warnings: string[] = [];

    if (generated.labels.nounVerb !== target.labels.nounVerb) {
      if (generated.labels.nounVerb === 'predominantly noun-style') {
        warnings.push('drifted toward noun-style with heavy nominalization. Prefer active verbs; convert "the X of Y" to verb form');
      } else if (generated.labels.nounVerb === 'predominantly verb-style' && target.labels.nounVerb !== 'predominantly verb-style') {
        warnings.push('drifted toward verb-style beyond target. Consider more analytical nominalization for precision');
      }
    }

    if (generated.labels.primaryRegister !== target.labels.primaryRegister) {
      warnings.push(`register shifted from ${target.labels.primaryRegister} to ${generated.labels.primaryRegister}`);
    }

    if (generated.labels.voice === 'unvoiced' && target.labels.voice === 'strongly voiced') {
      warnings.push('voice dropped significantly. Vary sentence length and rhythm; allow the prose to breathe');
    }

    if (warnings.length === 0) return null;
    return `STYLE ADVISORY: The previous section ${warnings.join('; ')}. For the next section, correct these drift patterns.`;
  }

  /**
   * Run drift analysis + conditional regen. Returns original or regenerated content.
   * Non-fatal: all errors caught; returns original on failure.
   */
  async maybeRegenerateWithLanham(
    sectionContent: string,
    regenerateFn: (advisory: string) => Promise<string>,
  ): Promise<{
    content: string;
    regenerated: boolean;
    metrics: LanhamProseMetrics;
    triggeredAxes: string[];
    firmGuidanceAdvisory: string | null;
  }> {
    const target = this.targetMetrics;
    const stub = { regenerated: false, content: sectionContent, metrics: {} as LanhamProseMetrics, triggeredAxes: [] as string[], firmGuidanceAdvisory: null };

    if (!target || !this.regenConfig.enabled) {
      try {
        const metrics = await this.analyzer.fullAnalysis(sectionContent);
        return { ...stub, metrics };
      } catch {
        return stub;
      }
    }

    // Step 1: Analyze
    let generatedMetrics: LanhamProseMetrics;
    try {
      generatedMetrics = await this.analyzer.fullAnalysis(sectionContent);
    } catch {
      return stub;
    }

    // Step 2: Check hard-constraint axes
    const triggeredAxes: string[] = [];
    for (const axis of this.regenConfig.hardConstraintAxes) {
      const genLabel = getLabelForAxis(generatedMetrics, axis);
      const tgtLabel = getLabelForAxis(target, axis);
      if (genLabel == null || tgtLabel == null) continue;
      if (this.regenConfig.requireLabelChange && genLabel === tgtLabel) continue;
      if (isDriftAwayFromTarget(axis, genLabel, tgtLabel)) {
        triggeredAxes.push(axis);
      }
    }

    // Step 3: Check firm-guidance axes (advisory only)
    let firmGuidanceAdvisory: string | null = null;
    for (const axis of this.regenConfig.firmGuidanceAxes) {
      const genLabel = getLabelForAxis(generatedMetrics, axis);
      const tgtLabel = getLabelForAxis(target, axis);
      if (genLabel == null || tgtLabel == null) continue;
      if (axis === 'voice' && genLabel === 'unvoiced' && tgtLabel === 'strongly voiced') {
        firmGuidanceAdvisory = `FIRM GUIDANCE: voice dropped from target "${tgtLabel}" to "${genLabel}". Vary sentence length and rhythm for the next section.`;
      }
    }

    // Step 4: No hard-constraint triggers → return without regen
    if (triggeredAxes.length === 0) {
      return { regenerated: false, content: sectionContent, metrics: generatedMetrics, triggeredAxes: [], firmGuidanceAdvisory };
    }

    // Step 5: Build correction prompt and regenerate
    const correctionLines: string[] = [];
    correctionLines.push('REGENERATION REQUIRED — the previous draft drifted on hard-constraint style axes.');
    correctionLines.push('Correct the following issues while preserving the argumentative content:');
    correctionLines.push('');

    for (const axis of triggeredAxes) {
      const genLabel = getLabelForAxis(generatedMetrics, axis);
      const tgtLabel = getLabelForAxis(target, axis);
      if (axis === 'nounVerb') {
        correctionLines.push(`- Noun/Verb axis: generated "${genLabel}", target "${tgtLabel}". ${
          genLabel === 'predominantly noun-style'
            ? 'Convert nominalizations to active verbs; reduce "the X of Y" constructions.'
            : 'Use more analytical nominalization for precision and formality.'
        }`);
      } else if (axis === 'primaryRegister') {
        correctionLines.push(`- Register axis: generated "${genLabel}", target "${tgtLabel}". ${
          tgtLabel === 'high'
            ? 'Use more Latinate, formal vocabulary; maintain scholarly register.'
            : `Shift toward ${tgtLabel} register.`
        }`);
      } else {
        correctionLines.push(`- ${axis} axis: generated "${genLabel}", target "${tgtLabel}".`);
      }
    }

    // Include genre context from lanhamStyleTarget so the LLM knows what it's targeting
    if (this.lanhamStyleTarget) {
      correctionLines.push(`Genre context: ${this.lanhamStyleTarget.genre}. AT/THROUGH mode: ${this.lanhamStyleTarget.atThroughMode}.`);
    }

    // Append revision guidance if agent is available
    const revisionGuidance = await this.buildLanhamRevisionGuidance(sectionContent);
    if (revisionGuidance) {
      correctionLines.push('');
      correctionLines.push(revisionGuidance);
    }

    let regeneratedContent: string;
    try {
      regeneratedContent = await regenerateFn(correctionLines.join('\n'));
    } catch {
      return { regenerated: false, content: sectionContent, metrics: generatedMetrics, triggeredAxes, firmGuidanceAdvisory };
    }

    // Step 6: Re-analyze regenerated content (no further regen)
    let finalMetrics: LanhamProseMetrics;
    try {
      finalMetrics = await this.analyzer.fullAnalysis(regeneratedContent);
    } catch {
      finalMetrics = generatedMetrics;
    }

    return { regenerated: true, content: regeneratedContent, metrics: finalMetrics, triggeredAxes, firmGuidanceAdvisory };
  }

  /**
   * Invoke LanhamProseAnalyst in 'revise' mode, return formatted guidance block (or null).
   * Non-fatal: returns null if agent is unavailable or errors.
   */
  async buildLanhamRevisionGuidance(text: string): Promise<string | null> {
    try {
      // Dynamic import: non-fatal if agent module is unavailable
      const { LanhamProseAnalyst } = await import('../agents/lanham-prose-analyst.js');
      const agent = new LanhamProseAnalyst(this.analyzer);
      const result = await agent.analyze(text, 'revise');

      const pairs = result.revisionPairs ?? [];
      const instructions = result.orchestratorInstructions ?? [];
      if (pairs.length === 0 && instructions.length === 0) return null;

      const lines: string[] = [];
      lines.push('LANHAM REVISION GUIDANCE (from Prose Analyst Agent):');
      lines.push('');

      if (pairs.length > 0) {
        lines.push('REVISION PAIRS:');
        for (const pair of pairs) {
          lines.push(`  [${pair.axis}] "${pair.original}" \u2192 "${pair.revised}"`);
          lines.push(`    ${pair.explanation}`);
        }
        lines.push('');
      }

      if (instructions.length > 0) {
        lines.push('ORCHESTRATOR INSTRUCTIONS:');
        for (const inst of instructions) {
          lines.push(`  \u2022 ${inst}`);
        }
      }

      return lines.join('\n');
    } catch {
      return null;
    }
  }
}
