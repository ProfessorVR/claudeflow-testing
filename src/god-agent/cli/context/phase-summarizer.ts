/**
 * Phase Summarizer - PHASE-4-002
 *
 * Implements automatic summarization of context at pipeline phase boundaries
 * to prevent context window exhaustion.
 *
 * Summarization Strategy:
 * - Preserve key outputs and decisions from each phase
 * - Discard intermediate reasoning and verbose outputs
 * - Target 5:1 to 10:1 compression ratio
 * - Maintain semantic coherence for downstream phases
 */

import { EventEmitter } from 'events';
import { ContextHealthMonitor } from './context-health-monitor.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Phase summary result
 */
export interface PhaseSummary {
  /** Phase that was summarized */
  readonly phaseId: number;

  /** Compressed summary of phase outputs */
  readonly summary: string;

  /** Key decisions made during this phase */
  readonly keyDecisions: string[];

  /** Artifacts to carry forward (named outputs) */
  readonly artifacts: Record<string, string>;

  /** Original token count (estimated) */
  readonly originalTokens: number;

  /** Compressed token count (estimated) */
  readonly compressedTokens: number;

  /** Compression ratio achieved */
  readonly compressionRatio: number;

  /** Timestamp of summarization */
  readonly timestamp: string;

  /** Agent outputs that were summarized */
  readonly agentsSummarized: string[];
}

/**
 * Summarization configuration
 */
export interface PhaseSummarizerConfig {
  /** Target compression ratio (default: 10) */
  targetCompression?: number;

  /** Maximum summary length in characters (default: 5000) */
  maxSummaryLength?: number;

  /** Characters per token for estimation (default: 4) */
  charsPerToken?: number;

  /** Preserve these keys from agent outputs verbatim */
  preserveKeys?: string[];

  /** Custom summarization function (for LLM integration) */
  summarizeFn?: (text: string, targetLength: number) => Promise<string>;
}

/**
 * Phase-specific summarization hints
 */
export interface PhaseSummarizationHints {
  /** Important keys to preserve from this phase */
  preserveKeys: string[];

  /** Keys that can be discarded (verbose/intermediate) */
  discardKeys: string[];

  /** Summary prompt template for this phase */
  summaryPrompt?: string;
}

/**
 * Summarization event
 */
export interface SummarizationEvent {
  type: 'phase_summarized' | 'compression_complete';
  phaseId: number;
  originalTokens: number;
  compressedTokens: number;
  compressionRatio: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: Required<Omit<PhaseSummarizerConfig, 'summarizeFn'>> = {
  targetCompression: 10,
  maxSummaryLength: 5000,
  charsPerToken: 4,
  preserveKeys: [
    // Always preserve these output keys
    'high_level_framing',
    'key_questions',
    'success_criteria',
    'thesis_statement',
    'chapter_outline',
    'key_arguments',
    'methodology_summary',
    'findings_summary',
    'recommendations',
    'go_no_go_decision',
    'final_recommendations',
  ],
};

/**
 * Phase-specific hints for what to preserve/discard
 */
const PHASE_HINTS: Record<number, PhaseSummarizationHints> = {
  1: {
    // Foundation & Framing
    preserveKeys: ['high_level_framing', 'key_questions', 'success_criteria', 'research_gaps'],
    discardKeys: ['raw_search_results', 'intermediate_analysis', 'debug_info'],
    summaryPrompt: 'Summarize the foundational framework, key research questions, and success criteria.',
  },
  2: {
    // Deep Research
    preserveKeys: ['literature_synthesis', 'theoretical_framework', 'key_sources', 'methodology_options'],
    discardKeys: ['full_citations', 'detailed_notes', 'search_queries'],
    summaryPrompt: 'Summarize the literature review findings, theoretical framework, and methodology choices.',
  },
  3: {
    // Synthesis & Structuring
    preserveKeys: ['chapter_outline', 'argument_structure', 'evidence_mapping', 'logical_flow'],
    discardKeys: ['draft_outlines', 'alternative_structures', 'brainstorming_notes'],
    summaryPrompt: 'Summarize the dissertation structure, argument flow, and evidence organization.',
  },
  4: {
    // Writing
    preserveKeys: ['chapter_content', 'key_arguments', 'transitions', 'citation_summary'],
    discardKeys: ['drafts', 'revision_notes', 'inline_comments'],
    summaryPrompt: 'Summarize the chapter content, key arguments made, and citation usage.',
  },
  5: {
    // Quality Assurance
    preserveKeys: ['quality_scores', 'issues_found', 'revision_guidance', 'validation_status'],
    discardKeys: ['detailed_checks', 'intermediate_scores', 'debug_output'],
    summaryPrompt: 'Summarize the quality assessment results, issues found, and recommended revisions.',
  },
  6: {
    // Revision
    preserveKeys: ['revisions_made', 'improvement_summary', 'final_scores'],
    discardKeys: ['revision_history', 'diff_details', 'iteration_logs'],
    summaryPrompt: 'Summarize the revisions made and quality improvements achieved.',
  },
  7: {
    // Finalization
    preserveKeys: ['final_chapter', 'metadata', 'completion_status'],
    discardKeys: ['formatting_logs', 'export_details'],
    summaryPrompt: 'Summarize the final chapter status and any remaining notes.',
  },
};

// ============================================================================
// Phase Summarizer Class
// ============================================================================

/**
 * Phase Summarizer
 *
 * Compresses phase outputs while preserving semantic meaning and key decisions.
 */
export class PhaseSummarizer extends EventEmitter {
  private readonly config: Required<Omit<PhaseSummarizerConfig, 'summarizeFn'>> & Pick<PhaseSummarizerConfig, 'summarizeFn'>;
  private readonly contextMonitor?: ContextHealthMonitor;

  constructor(
    config: PhaseSummarizerConfig = {},
    contextMonitor?: ContextHealthMonitor
  ) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.contextMonitor = contextMonitor;
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Summarize a completed phase
   * @param phaseId - Phase number (1-7)
   * @param agentOutputs - All outputs from phase agents
   * @param targetCompression - Override target compression ratio
   * @returns Compressed phase summary
   */
  async summarize(
    phaseId: number,
    agentOutputs: Map<string, unknown>,
    targetCompression?: number
  ): Promise<PhaseSummary> {
    const compression = targetCompression ?? this.config.targetCompression;
    const hints = PHASE_HINTS[phaseId] ?? {
      preserveKeys: this.config.preserveKeys,
      discardKeys: [],
    };

    // Calculate original size
    const originalText = this.serializeOutputs(agentOutputs);
    const originalTokens = this.estimateTokens(originalText);

    // Extract key artifacts to preserve
    const artifacts = this.extractArtifacts(agentOutputs, hints.preserveKeys);

    // Extract key decisions
    const keyDecisions = this.extractKeyDecisions(agentOutputs, phaseId);

    // Build summary
    let summary: string;
    if (this.config.summarizeFn) {
      // Use custom summarization (e.g., LLM)
      const targetLength = Math.floor(originalText.length / compression);
      summary = await this.config.summarizeFn(originalText, targetLength);
    } else {
      // Use built-in extractive summarization
      summary = this.buildExtractSummary(agentOutputs, hints, compression);
    }

    // Ensure summary doesn't exceed max length
    if (summary.length > this.config.maxSummaryLength) {
      summary = summary.slice(0, this.config.maxSummaryLength) + '...';
    }

    const compressedTokens = this.estimateTokens(summary);
    const compressionRatio = originalTokens / Math.max(1, compressedTokens);

    const result: PhaseSummary = {
      phaseId,
      summary,
      keyDecisions,
      artifacts,
      originalTokens,
      compressedTokens,
      compressionRatio,
      timestamp: new Date().toISOString(),
      agentsSummarized: Array.from(agentOutputs.keys()),
    };

    // Emit event
    this.emit('phase_summarized', {
      type: 'phase_summarized',
      phaseId,
      originalTokens,
      compressedTokens,
      compressionRatio,
    } as SummarizationEvent);

    return result;
  }

  /**
   * Build a context-reduced input for the next phase
   * @param previousSummaries - Summaries from previous phases
   * @param currentPhaseInputs - New inputs for current phase
   * @returns Combined context string
   */
  buildPhaseContext(
    previousSummaries: PhaseSummary[],
    currentPhaseInputs: Record<string, unknown>
  ): string {
    const sections: string[] = [];

    // Add previous phase summaries
    if (previousSummaries.length > 0) {
      sections.push('## Previous Phase Summaries\n');

      for (const summary of previousSummaries) {
        sections.push(`### Phase ${summary.phaseId} Summary`);
        sections.push(summary.summary);
        sections.push('');

        if (summary.keyDecisions.length > 0) {
          sections.push('**Key Decisions:**');
          for (const decision of summary.keyDecisions) {
            sections.push(`- ${decision}`);
          }
          sections.push('');
        }

        // Include critical artifacts
        const criticalArtifacts = Object.entries(summary.artifacts)
          .filter(([key]) => this.config.preserveKeys.includes(key))
          .slice(0, 5);  // Limit to top 5

        if (criticalArtifacts.length > 0) {
          sections.push('**Key Artifacts:**');
          for (const [key, value] of criticalArtifacts) {
            const truncated = value.length > 500 ? value.slice(0, 500) + '...' : value;
            sections.push(`- ${key}: ${truncated}`);
          }
          sections.push('');
        }
      }
    }

    // Add current phase inputs
    sections.push('## Current Phase Inputs\n');
    sections.push(JSON.stringify(currentPhaseInputs, null, 2));

    return sections.join('\n');
  }

  /**
   * Get recommended compression based on context health
   */
  getRecommendedCompression(): number {
    if (!this.contextMonitor) {
      return this.config.targetCompression;
    }

    const health = this.contextMonitor.getHealth();

    if (health.status === 'critical') {
      return 15;  // Aggressive compression
    } else if (health.status === 'warning') {
      return 10;  // Standard compression
    }
    return 5;  // Light compression
  }

  /**
   * Format phase summary for display
   */
  formatSummary(summary: PhaseSummary): string {
    const lines: string[] = [
      `=== Phase ${summary.phaseId} Summary ===`,
      '',
      `Compression: ${summary.originalTokens.toLocaleString()} -> ${summary.compressedTokens.toLocaleString()} tokens (${summary.compressionRatio.toFixed(1)}:1)`,
      `Agents: ${summary.agentsSummarized.join(', ')}`,
      '',
      '--- Summary ---',
      summary.summary,
      '',
    ];

    if (summary.keyDecisions.length > 0) {
      lines.push('--- Key Decisions ---');
      for (const decision of summary.keyDecisions) {
        lines.push(`  - ${decision}`);
      }
      lines.push('');
    }

    if (Object.keys(summary.artifacts).length > 0) {
      lines.push('--- Preserved Artifacts ---');
      for (const key of Object.keys(summary.artifacts)) {
        lines.push(`  - ${key}`);
      }
    }

    return lines.join('\n');
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / this.config.charsPerToken);
  }

  private serializeOutputs(outputs: Map<string, unknown>): string {
    const obj = Object.fromEntries(outputs);
    return JSON.stringify(obj, null, 2);
  }

  private extractArtifacts(
    outputs: Map<string, unknown>,
    preserveKeys: string[]
  ): Record<string, string> {
    const artifacts: Record<string, string> = {};

    for (const [agentKey, output] of outputs) {
      if (typeof output !== 'object' || output === null) {
        continue;
      }

      const outputObj = output as Record<string, unknown>;

      for (const key of preserveKeys) {
        if (key in outputObj) {
          const value = outputObj[key];
          const strValue = typeof value === 'string' ? value : JSON.stringify(value);
          artifacts[`${agentKey}.${key}`] = strValue;
        }
      }
    }

    return artifacts;
  }

  private extractKeyDecisions(
    outputs: Map<string, unknown>,
    phaseId: number
  ): string[] {
    const decisions: string[] = [];

    // Look for decision-related keys in outputs
    const decisionKeys = [
      'decision', 'decisions', 'key_decision', 'key_decisions',
      'recommendation', 'recommendations', 'choice', 'choices',
      'selected', 'approved', 'verdict', 'conclusion',
    ];

    for (const [agentKey, output] of outputs) {
      if (typeof output !== 'object' || output === null) {
        continue;
      }

      const outputObj = output as Record<string, unknown>;

      for (const key of decisionKeys) {
        if (key in outputObj) {
          const value = outputObj[key];
          if (typeof value === 'string') {
            decisions.push(`[${agentKey}] ${value}`);
          } else if (Array.isArray(value)) {
            for (const item of value.slice(0, 3)) {
              if (typeof item === 'string') {
                decisions.push(`[${agentKey}] ${item}`);
              }
            }
          }
        }
      }
    }

    // Add phase-specific summary if found
    const hints = PHASE_HINTS[phaseId];
    if (hints?.summaryPrompt) {
      // This would be enhanced with LLM summarization
    }

    return decisions.slice(0, 10);  // Limit to 10 key decisions
  }

  private buildExtractSummary(
    outputs: Map<string, unknown>,
    hints: PhaseSummarizationHints,
    compression: number
  ): string {
    const sections: string[] = [];

    // Add preserved content
    for (const [agentKey, output] of outputs) {
      if (typeof output !== 'object' || output === null) {
        continue;
      }

      const outputObj = output as Record<string, unknown>;
      const agentPreserved: string[] = [];

      // Extract preserved keys
      for (const key of hints.preserveKeys) {
        if (key in outputObj) {
          const value = outputObj[key];
          let strValue = typeof value === 'string' ? value : JSON.stringify(value);

          // Truncate if too long
          const maxPerKey = Math.floor(this.config.maxSummaryLength / (hints.preserveKeys.length * 2));
          if (strValue.length > maxPerKey) {
            strValue = strValue.slice(0, maxPerKey) + '...';
          }

          agentPreserved.push(`**${key}**: ${strValue}`);
        }
      }

      if (agentPreserved.length > 0) {
        sections.push(`### ${agentKey}`);
        sections.push(agentPreserved.join('\n\n'));
        sections.push('');
      }
    }

    // If no preserved content found, do basic extraction
    if (sections.length === 0) {
      for (const [agentKey, output] of outputs) {
        const str = typeof output === 'string' ? output : JSON.stringify(output);
        const truncated = str.slice(0, 500);
        sections.push(`### ${agentKey}\n${truncated}...`);
      }
    }

    return sections.join('\n');
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a phase summarizer with default settings
 */
export function createPhaseSummarizer(
  config?: PhaseSummarizerConfig,
  contextMonitor?: ContextHealthMonitor
): PhaseSummarizer {
  return new PhaseSummarizer(config, contextMonitor);
}

/**
 * Create a summarizer optimized for aggressive compression
 */
export function createAggressiveSummarizer(
  contextMonitor?: ContextHealthMonitor
): PhaseSummarizer {
  return new PhaseSummarizer(
    {
      targetCompression: 15,
      maxSummaryLength: 3000,
    },
    contextMonitor
  );
}

/**
 * Create a summarizer that preserves more detail
 */
export function createDetailedSummarizer(
  contextMonitor?: ContextHealthMonitor
): PhaseSummarizer {
  return new PhaseSummarizer(
    {
      targetCompression: 5,
      maxSummaryLength: 10000,
    },
    contextMonitor
  );
}
