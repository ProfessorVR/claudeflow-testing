/**
 * Quality Integration - Bridge between Universal Agent and Quality Gauntlet
 *
 * This module integrates the PhD pipeline's quality gauntlet system into
 * the universal agent's write() method, enabling automatic quality validation
 * and iterative revision for god-write outputs.
 *
 * Features:
 * - Automatic quality validation with 0.85 threshold
 * - Iterative revision loop (up to 3 attempts)
 * - Quality metrics logging to trajectory for learning
 * - Graceful degradation if quality gauntlet fails
 * - Compatible with existing universal agent architecture
 *
 * Integration Points:
 * - UniversalAgent.write() - Main entry point
 * - TrajectoryBridge - Quality metrics logging
 * - TaskExecutor - Revision execution
 *
 * Usage:
 * ```typescript
 * const integration = new QualityIntegration(agent);
 * const result = await integration.validateAndRevise(content, {
 *   topic,
 *   style,
 *   format,
 *   trajectoryId
 * });
 * ```
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  QualityGauntlet,
  RevisionOrchestrator,
  createDefaultGauntlet,
  createDefaultOrchestrator,
  type GauntletResult,
  type RevisionRequest,
  type RefinementResult,
} from '../cli/quality/index.js';
import type { UniversalAgent } from './universal-agent.js';
import {
  HumanVerifier,
  createHumanVerifier,
  type HumanVerificationOptions,
  type VerificationDecision,
  type ReviewContext,
} from '../__experimental__/human-verification.js';
import { type ReasoningEdge } from '../retrieval/types.js';
import { loadReasoningEdgesSync } from '../shared/jsonl-loaders.js';

// ============================================================================
// Quality Integration Types
// ============================================================================

/**
 * Options for quality validation
 */
export interface QualityValidationOptions {
  /** Topic being written about */
  topic: string;

  /** Writing style */
  style: 'academic' | 'professional' | 'casual' | 'technical';

  /** Output format */
  format: 'essay' | 'report' | 'article' | 'paper';

  /** Trajectory ID for learning */
  trajectoryId?: string;

  /** Override quality threshold (default: 0.85) */
  qualityThreshold?: number;

  /** Override max revision attempts (default: 3) */
  maxRevisions?: number;

  /** Whether to enable quality validation (default: true) */
  enabled?: boolean;

  /** Corpus chunks for claim verification (passed to gauntlet context) */
  corpusChunks?: unknown[];

  /** Known corpus authors for claim verification */
  knownAuthors?: string[];

  /** Human verification options for interactive review */
  humanVerification?: HumanVerificationOptions;
}

/**
 * Result from quality validation and revision
 */
export interface QualityValidationResult {
  /** Final content after validation/revision */
  content: string;

  /** Whether quality threshold was met */
  passed: boolean;

  /** Final quality score (0-1) */
  qualityScore: number;

  /** Number of revision iterations performed */
  revisionIterations: number;

  /** Detailed gauntlet result */
  gauntletResult: GauntletResult;

  /** Quality metrics for learning */
  metrics: QualityMetrics;

  /** Whether any revisions were attempted */
  wasRevised: boolean;
}

/**
 * Quality metrics for trajectory logging
 */
export interface QualityMetrics {
  /** Overall quality score (0-1) */
  overallScore: number;

  /** Individual stage scores */
  stageScores: {
    argumentCoherence: number;
    citationCompleteness: number;
    styleConsistency: number;
    factualAccuracy: number;
  };

  /** Issue counts by severity */
  issueCounts: {
    critical: number;
    major: number;
    minor: number;
  };

  /** Auto-fixable issue count */
  autoFixableCount: number;

  /** Revision iterations performed */
  revisionIterations: number;

  /** Whether threshold was met */
  passed: boolean;
}

// ============================================================================
// Edge Coherence Validation
// ============================================================================

// ReasoningEdge imported from ../retrieval/types.js (shared Zod-validated schema)

/** Derivation values used for contradiction severity tiering */
type DerivationTier = 'manual' | 'llm' | 'phase7' | 'bridge' | 'unknown';
const VALID_DERIVATIONS = new Set<DerivationTier>(['manual', 'llm', 'phase7', 'bridge']);

function toDerivationTier(d: string | undefined): DerivationTier {
  const lower = (d ?? 'unknown').toLowerCase();
  return VALID_DERIVATIONS.has(lower as DerivationTier) ? lower as DerivationTier : 'unknown';
}

/**
 * Structured contradiction detail with provenance derivation tier
 */
export interface EdgeContradiction {
  description: string;
  expectedRelation: string;
  foundAssertion: string;
  derivation: DerivationTier;
}

/**
 * Result from edge-based coherence validation
 */
export interface EdgeCoherenceResult {
  /** Score from 0.0 (many contradictions) to 1.0 (no contradictions) */
  score: number;
  /** Structured contradiction details with provenance derivation */
  contradictions: EdgeContradiction[];
  /** Total relationship assertions detected in the text */
  assertionsFound: number;
  /** Total edges loaded from the knowledge base */
  edgesLoaded: number;
}

/**
 * Relationship patterns to detect in generated text.
 * Each entry maps a textual verb phrase to the canonical relation type it implies.
 */
const RELATION_PATTERNS: { pattern: RegExp; relation: string }[] = [
  { pattern: /(\w[\w\s-]*?)\s+depends\s+on\s+(\w[\w\s-]*)/gi, relation: 'depends_on' },
  { pattern: /(\w[\w\s-]*?)\s+presupposes\s+(\w[\w\s-]*)/gi, relation: 'presupposes' },
  { pattern: /(\w[\w\s-]*?)\s+contrasts\s+with\s+(\w[\w\s-]*)/gi, relation: 'contrasts_with' },
  { pattern: /(\w[\w\s-]*?)\s+is\s+contrasted\s+with\s+(\w[\w\s-]*)/gi, relation: 'contrasts_with' },
  { pattern: /(\w[\w\s-]*?)\s+explains\s+(\w[\w\s-]*)/gi, relation: 'explains' },
  { pattern: /(\w[\w\s-]*?)\s+refines\s+(\w[\w\s-]*)/gi, relation: 'refines' },
  { pattern: /(\w[\w\s-]*?)\s+completes\s+(\w[\w\s-]*)/gi, relation: 'completes' },
  { pattern: /(\w[\w\s-]*?)\s+operationalizes\s+(\w[\w\s-]*)/gi, relation: 'operationalizes' },
  { pattern: /(\w[\w\s-]*?)\s+is\s+the\s+meaning\s+of\s+(\w[\w\s-]*)/gi, relation: 'is_meaning_of' },
];

/**
 * Relation pairs that are considered contradictory when one is asserted but
 * the other is the known edge. The key is the asserted relation, the value
 * is a set of known relations that would constitute a contradiction.
 */
const CONTRADICTORY_RELATIONS: Record<string, Set<string>> = {
  depends_on: new Set(['contrasts_with', 'independent_of']),
  contrasts_with: new Set(['depends_on', 'presupposes', 'explains', 'refines', 'completes']),
  presupposes: new Set(['contrasts_with', 'independent_of']),
  explains: new Set(['contrasts_with']),
  refines: new Set(['contrasts_with']),
  completes: new Set(['contrasts_with']),
  operationalizes: new Set(['contrasts_with']),
};

/** Module-level edge cache — loaded once, reused across all calls */
/**
 * Load reasoning edges via shared loader (Zod-validated, mtime-cached).
 * Lowercases source/relation/target for coherence matching.
 */
function loadReasoningEdges(projectRoot?: string): ReasoningEdge[] {
  try {
    const edges = loadReasoningEdgesSync(projectRoot);
    // Lowercase for coherence matching (this module compares against text patterns)
    for (const edge of edges) {
      edge.source = edge.source.toLowerCase();
      edge.relation = edge.relation.toLowerCase();
      edge.target = edge.target.toLowerCase();
    }
    return edges;
  } catch {
    return [];
  }
}

/**
 * Build a lookup key for an edge (source → target)
 */
function edgeKey(source: string, target: string): string {
  return `${source.toLowerCase()}::${target.toLowerCase()}`;
}

/**
 * Normalize a concept term extracted from text for matching against edges.
 * Strips articles, trims whitespace, lowercases, and replaces spaces with underscores.
 */
function normalizeConcept(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '')
    .trim()
    .replace(/\s+/g, '_');
}

/**
 * Validate generated text for coherence against known reasoning edges.
 *
 * Extracts relationship assertions from prose using pattern matching and checks
 * each against the loaded edge graph. If the text asserts a relationship that
 * contradicts a known edge (e.g., text says "A depends on B" but edges record
 * "A contrasts_with B"), it is flagged as a contradiction.
 *
 * @param text - The generated text to validate
 * @param projectRoot - Project root for locating reasoning.jsonl (defaults to cwd)
 * @returns EdgeCoherenceResult with score and contradiction details
 */
export function validateEdgeCoherence(
  text: string,
  projectRoot?: string
): EdgeCoherenceResult {
  const edges = loadReasoningEdges(projectRoot);

  if (edges.length === 0) {
    return { score: 1.0, contradictions: [], assertionsFound: 0, edgesLoaded: 0 };
  }

  // Build lookup maps: (source::target) → edges grouped by key
  const edgeMap = new Map<string, Set<string>>();
  const edgeLookup = new Map<string, ReasoningEdge[]>();
  for (const edge of edges) {
    const key = edgeKey(edge.source, edge.target);
    if (!edgeMap.has(key)) {
      edgeMap.set(key, new Set());
      edgeLookup.set(key, []);
    }
    edgeMap.get(key)!.add(edge.relation);
    edgeLookup.get(key)!.push(edge);
  }

  // Extract assertions from text
  interface Assertion {
    source: string;
    relation: string;
    target: string;
    rawMatch: string;
  }

  const assertions: Assertion[] = [];

  for (const { pattern, relation } of RELATION_PATTERNS) {
    // Reset regex state for each scan
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const source = normalizeConcept(match[1]);
      const target = normalizeConcept(match[2]);

      // Only consider assertions where at least one term appears as an edge node
      const key = edgeKey(source, target);
      const reverseKey = edgeKey(target, source);
      if (edgeMap.has(key) || edgeMap.has(reverseKey)) {
        assertions.push({
          source,
          relation,
          target,
          rawMatch: match[0].trim(),
        });
      }
    }
  }

  // Check each assertion for contradictions
  const contradictions: EdgeContradiction[] = [];

  for (const assertion of assertions) {
    const key = edgeKey(assertion.source, assertion.target);
    const knownRelations = edgeMap.get(key);

    if (knownRelations) {
      // Check if the asserted relation contradicts any known relation
      const contradictorySet = CONTRADICTORY_RELATIONS[assertion.relation];
      if (contradictorySet) {
        const knownArr = Array.from(knownRelations);
        for (let i = 0; i < knownArr.length; i++) {
          const known = knownArr[i];
          if (contradictorySet.has(known)) {
            // Find the matching edge to extract derivation
            const matchingEdge = (edgeLookup.get(key) ?? []).find(e => e.relation === known);
            contradictions.push({
              description: `text asserts "${assertion.rawMatch}" (${assertion.relation}) but edge records "${assertion.source} ${known} ${assertion.target}"`,
              expectedRelation: `${assertion.source} ${known} ${assertion.target}`,
              foundAssertion: assertion.rawMatch,
              derivation: toDerivationTier(matchingEdge?.derivation),
            });
          }
        }
      }
    }

    // Also check the reverse direction — if text says "A depends_on B" but
    // edges record "B contrasts_with A", that is still a contradiction
    const reverseKey = edgeKey(assertion.target, assertion.source);
    const reverseRelations = edgeMap.get(reverseKey);

    if (reverseRelations) {
      const contradictorySet = CONTRADICTORY_RELATIONS[assertion.relation];
      if (contradictorySet) {
        const reverseArr = Array.from(reverseRelations);
        for (let i = 0; i < reverseArr.length; i++) {
          const known = reverseArr[i];
          if (contradictorySet.has(known)) {
            // Find the matching edge to extract derivation
            const matchingEdge = (edgeLookup.get(reverseKey) ?? []).find(e => e.relation === known);
            contradictions.push({
              description: `text asserts "${assertion.rawMatch}" (${assertion.relation}) but edge records "${assertion.target} ${known} ${assertion.source}"`,
              expectedRelation: `${assertion.target} ${known} ${assertion.source}`,
              foundAssertion: assertion.rawMatch,
              derivation: toDerivationTier(matchingEdge?.derivation),
            });
          }
        }
      }
    }
  }

  // Score: 1.0 if no contradictions, decreasing with more contradictions
  // Each contradiction deducts 0.15, floor at 0.0
  const penalty = Math.min(contradictions.length * 0.15, 1.0);
  const score = Math.max(1.0 - penalty, 0.0);

  return {
    score,
    contradictions,
    assertionsFound: assertions.length,
    edgesLoaded: edges.length,
  };
}

/**
 * Clear the edge cache (delegates to shared loader)
 */
export function clearEdgeCache(): void {
  const { clearJSONLCaches } = require('../shared/jsonl-loaders.js');
  clearJSONLCaches();
}

// ============================================================================
// Bbox Citation Page Validation
// ============================================================================

export interface BboxCitationValidationResult {
  validatedCount: number;
  mismatchCount: number;
  mismatches: Array<{
    citedPage: number;
    availablePages: number[];
    sourceTitle: string;
    citationSnippet: string;
  }>;
  score: number;
}

/**
 * Validate that cited page numbers in the text match pages available in the
 * corpus chunks' bbox metadata. Catches phantom page citations that cannot
 * be traced back to any ingested source material.
 *
 * @param text - Generated text containing citations with page numbers
 * @param corpusChunks - Corpus chunks with metadata (title, bboxes, page_start/end)
 * @returns Validation result with mismatch details and penalty score
 */
export function validateCitationPagesWithBbox(
  text: string,
  corpusChunks: Array<{ metadata: Record<string, any>; relevanceScore?: number }>
): BboxCitationValidationResult {
  const titlePageMap = new Map<string, Set<number>>();

  // Build lookup: title -> available pages from bbox data
  for (const chunk of corpusChunks) {
    const title = (chunk.metadata.title_raw || chunk.metadata.title || '').toLowerCase();
    if (!title) continue;

    if (!titlePageMap.has(title)) titlePageMap.set(title, new Set());
    const pages = titlePageMap.get(title)!;

    // From bbox data
    if (chunk.metadata.has_bboxes && chunk.metadata.bboxes) {
      try {
        const bboxes = typeof chunk.metadata.bboxes === 'string'
          ? JSON.parse(chunk.metadata.bboxes) : chunk.metadata.bboxes;
        for (const bb of bboxes) {
          if (bb.page_num != null) pages.add(Number(bb.page_num));
        }
      } catch { /* skip malformed bbox */ }
    }

    // Fallback: page_start / page_end
    if (chunk.metadata.page_start != null) pages.add(Number(chunk.metadata.page_start));
    if (chunk.metadata.page_end != null) pages.add(Number(chunk.metadata.page_end));
  }

  // Extract citations from text
  const citationRegex = /\(([^)]*?),\s*\*([^*]+)\*[^)]*?pp?\.\s*(\d+)(?:\s*[-\u2013]\s*(\d+))?\)/g;
  let match;
  let validatedCount = 0;
  const mismatches: BboxCitationValidationResult['mismatches'] = [];

  while ((match = citationRegex.exec(text)) !== null) {
    const citedTitle = match[2].toLowerCase().trim();
    const citedPage = parseInt(match[3], 10);
    const snippet = match[0].slice(0, 80);

    // Find matching title in our lookup
    let matchedTitle: string | null = null;
    const titleKeys = Array.from(titlePageMap.keys());
    for (let ti = 0; ti < titleKeys.length; ti++) {
      const title = titleKeys[ti];
      if (title.includes(citedTitle) || citedTitle.includes(title)) {
        matchedTitle = title;
        break;
      }
    }

    if (!matchedTitle) continue; // Title not in corpus, skip

    const availablePages = titlePageMap.get(matchedTitle)!;
    if (availablePages.size === 0) continue; // No page data

    validatedCount++;
    if (!availablePages.has(citedPage)) {
      // Check range: page might be between page_start and page_end
      const pagesArr = Array.from(availablePages).sort((a, b) => a - b);
      const inRange = pagesArr.some((p, i) =>
        i + 1 < pagesArr.length && citedPage >= p && citedPage <= pagesArr[i + 1]
      );
      if (!inRange) {
        mismatches.push({
          citedPage,
          availablePages: pagesArr,
          sourceTitle: citedTitle,
          citationSnippet: snippet,
        });
      }
    }
  }

  const mismatchCount = mismatches.length;
  const score = Math.max(0, 1.0 - mismatchCount * 0.1);

  return { validatedCount, mismatchCount, mismatches, score };
}

// ============================================================================
// Endnote Leak Detection
// ============================================================================

/**
 * Section delimiter patterns that mark the boundary between main body and
 * endnotes/appendix sections. Content after the first match is preserved as-is.
 */
const ENDNOTE_SECTION_DELIMITERS = [
  /^#+\s*ENDNOTES?\b/mi,
  /^#+\s*VALIDATION\s+APPENDIX\b/mi,
  /^#+\s*Notes\b/mi,
  /^---\s*\n\s*##\s*Endnotes?\b/mi,
];

/**
 * Strip endnote reference artifacts that leak into the main text body during
 * multi-step generation.
 *
 * Targets three categories of leaks:
 *   1. Explicit endnote markers: [EN1], [EN2], etc.
 *   2. Standalone superscript unicode numbers: superscript digits not part of words
 *   3. Standalone numeric references: [1], [2], etc. that are NOT part of
 *      citation parentheticals like (Author, *Title*, p. 1)
 *
 * Only the main body (before the first endnote/appendix delimiter) is cleaned.
 * The endnotes section itself is left untouched.
 *
 * @param text - Full document text (may include endnotes section)
 * @returns Cleaned text with endnote leak artifacts removed
 */
export function stripEndnoteLeaks(text: string): string {
  if (!text) return text;

  // Find the earliest section delimiter to split main body from endnotes
  let splitIndex = text.length;
  for (const delimiter of ENDNOTE_SECTION_DELIMITERS) {
    const match = delimiter.exec(text);
    if (match && match.index < splitIndex) {
      splitIndex = match.index;
    }
  }

  let mainBody = text.substring(0, splitIndex);
  const endnotesSection = text.substring(splitIndex);

  // 1. Remove explicit endnote markers: [EN1], [EN2], [EN14], etc.
  mainBody = mainBody.replace(/\[EN\d+\]/g, '');

  // 2. Remove standalone superscript unicode digits that look like endnote markers.
  //    Only match when preceded by punctuation, closing quotes/brackets, or whitespace
  //    (NOT directly after word characters, to avoid stripping legitimate uses like
  //    chemical formulas or mathematical notation).
  //    Superscript digits: \u2070(0), \u00B9(1), \u00B2(2), \u00B3(3), \u2074-\u2079(4-9)
  const superscriptDigits = '[\u2070\u00B9\u00B2\u00B3\u2074\u2075\u2076\u2077\u2078\u2079]';
  const superscriptPattern = new RegExp(
    `(?<=[.,;:!?)"'\\]\\*\\u201D\\u2019])${superscriptDigits}+(?=\\s|[.,;:!?\\-\\u2014]|$)`,
    'gm'
  );
  mainBody = mainBody.replace(superscriptPattern, '');

  // 3. Remove standalone numeric references [1], [2], etc. that are NOT part of
  //    citation format. We consider a reference "standalone" if it is NOT immediately
  //    preceded by text patterns like "p. ", "pp. ", ", " inside a parenthetical,
  //    or other citation-like context.
  //
  //    Strategy: match [N] where N is 1-3 digits, but only if the preceding context
  //    does NOT look like a page reference or citation continuation.
  mainBody = mainBody.replace(
    /(?<!\bp\.?\s*)(?<!\bpp\.?\s*)(?<!,\s*)(?<![\w*])\[(\d{1,3})\](?!\()/g,
    (match, digits, offset) => {
      // Additional safety check: if this appears inside a parenthetical citation
      // like (Author, *Title*, [1]), preserve it.
      // Look back up to 80 chars for an opening parenthesis without a closing one.
      const lookback = mainBody.substring(Math.max(0, offset - 80), offset);
      const lastOpen = lookback.lastIndexOf('(');
      const lastClose = lookback.lastIndexOf(')');
      if (lastOpen > lastClose) {
        // We're inside a parenthetical — this might be a legitimate citation reference
        return match;
      }

      // If the digit is very large (> 50), it's unlikely to be an endnote marker;
      // could be a legitimate reference like "[100]" in a list or code.
      const num = parseInt(digits, 10);
      if (num > 50) {
        return match;
      }

      return '';
    }
  );

  // Clean up artifacts from removal: double spaces, spaces before punctuation
  mainBody = mainBody.replace(/  +/g, ' ');
  mainBody = mainBody.replace(/ ([.,;:!?])/g, '$1');
  // Remove lines that became empty after stripping (but preserve intentional blank lines)
  mainBody = mainBody.replace(/\n[ \t]+\n/g, '\n\n');

  return mainBody + endnotesSection;
}

// ============================================================================
// Quality Integration Class
// ============================================================================

/**
 * Integrates quality gauntlet validation into universal agent write operations
 */
export class QualityIntegration {
  private gauntlet: QualityGauntlet;
  private orchestrator: RevisionOrchestrator;
  private humanVerifier: HumanVerifier;

  /** Default quality threshold for passing */
  static readonly DEFAULT_THRESHOLD = 0.85;

  /** Default max revision attempts */
  static readonly DEFAULT_MAX_REVISIONS = 3;

  /**
   * Create a new QualityIntegration
   *
   * @param agent - Universal agent instance (for accessing revision capabilities)
   * @param humanVerificationOptions - Options for human-in-the-loop verification
   */
  constructor(
    private agent: UniversalAgent,
    humanVerificationOptions?: HumanVerificationOptions
  ) {
    // Create gauntlet with custom threshold for god-write
    this.gauntlet = createDefaultGauntlet();
    this.gauntlet.updateConfig({
      overallThreshold: QualityIntegration.DEFAULT_THRESHOLD,
    });

    // Create orchestrator with god-write optimized settings
    this.orchestrator = createDefaultOrchestrator(this.gauntlet);
    this.orchestrator.updateConfig({
      maxIterations: QualityIntegration.DEFAULT_MAX_REVISIONS,
      minScoreImprovement: 0.02, // Continue revising if improving by at least 2%
      applyAutoFixes: true, // Auto-fix simple issues
      prioritizeSeverity: false, // Address all issue types
      maxIssuesInPrompt: 20, // Limit issues to avoid overwhelming revision
    });

    // Create human verifier for interactive review
    this.humanVerifier = createHumanVerifier(humanVerificationOptions);
  }

  /**
   * Validate content and perform iterative revision if needed
   *
   * @param content - Generated content to validate
   * @param options - Validation options
   * @returns Validation result with potentially revised content
   */
  async validateAndRevise(
    content: string,
    options: QualityValidationOptions
  ): Promise<QualityValidationResult> {
    // Check if validation is enabled
    if (options.enabled === false) {
      return this.createBypassResult(content);
    }

    // Save base config for restoration in finally block
    const baseThreshold = QualityIntegration.DEFAULT_THRESHOLD;
    const baseMaxRevisions = QualityIntegration.DEFAULT_MAX_REVISIONS;

    try {
      // Apply per-request overrides (restored after call via finally block)
      if (options.qualityThreshold !== undefined) {
        this.gauntlet.updateConfig({
          overallThreshold: options.qualityThreshold,
        });
      }
      if (options.maxRevisions !== undefined) {
        this.orchestrator.updateConfig({
          maxIterations: options.maxRevisions,
        });
      }

      // Build gauntlet context with corpus chunks for claim verification
      const gauntletContext = {
        corpusChunks: options.corpusChunks ?? [],
        knownAuthors: options.knownAuthors ?? [],
      };

      // Run initial quality evaluation
      const initialResult = await this.gauntlet.runGauntlet(content, 1, gauntletContext);

      // Log initial quality metrics
      this.logQualityMetrics(initialResult, options.trajectoryId, 0);

      // Run edge coherence check — provenance-tiered enforcement
      let edgeRevisionInstructions: string[] = [];
      try {
        const edgeResult = validateEdgeCoherence(content);
        if (edgeResult.edgesLoaded > 0 && edgeResult.contradictions.length > 0) {
          for (const contradiction of edgeResult.contradictions) {
            if (contradiction.derivation === 'manual' || contradiction.derivation === 'bridge') {
              // HARD FAILURE — manual/bridge edges are hand-verified gold standard
              edgeRevisionInstructions.push(
                `MANDATORY CORRECTION: The text contradicts a verified scholarly relationship: ${contradiction.description}. ` +
                `The corpus analysis establishes: ${contradiction.expectedRelation}. Amend the relevant passage.`
              );
              console.error(`[QualityIntegration] HARD edge contradiction (${contradiction.derivation}): ${contradiction.description}`);
            } else if (contradiction.derivation === 'llm') {
              // SOFT FAILURE — 0.10 penalty per LLM contradiction to factual-accuracy
              console.error(`[QualityIntegration] Soft edge contradiction (llm): ${contradiction.description}`);
            } else {
              // ADVISORY — Phase 7 auto-derived edges are heuristic, log only
              console.error(`[QualityIntegration] Advisory edge note (${contradiction.derivation}): ${contradiction.description}`);
            }
          }

          // Apply LLM-edge soft penalty
          const llmContradictions = edgeResult.contradictions.filter(c => c.derivation === 'llm').length;
          if (llmContradictions > 0) {
            const penalty = Math.min(0.30, llmContradictions * 0.10);
            for (const sr of initialResult.stageResults) {
              if (sr.stageName === 'factual-accuracy') {
                (sr as any).score = Math.max(0, sr.score - penalty);
              }
            }
            console.error(`[QualityIntegration] LLM-edge penalty: ${penalty.toFixed(2)} applied to factual-accuracy`);
          }

          // If manual/bridge contradictions found, force revision
          if (edgeRevisionInstructions.length > 0) {
            (initialResult as any).passed = false;
            (initialResult as any).edgeRevisionInstructions = edgeRevisionInstructions;
          }
        }
      } catch {
        // Edge coherence is optional — never block the pipeline on infrastructure failure
      }

      // Bbox citation page validation
      try {
        if (options.corpusChunks && options.corpusChunks.length > 0) {
          const bboxResult = validateCitationPagesWithBbox(content, options.corpusChunks as any);
          if (bboxResult.mismatchCount > 0) {
            const penalty = Math.min(0.30, bboxResult.mismatchCount * 0.1);
            for (const sr of initialResult.stageResults) {
              if (sr.stageName === 'citation-completeness') {
                (sr as any).score = Math.max(0, sr.score - penalty);
              }
            }
            console.error(
              `[QualityIntegration] Bbox validation: ${bboxResult.mismatchCount} page mismatch(es), ` +
              `penalty=${penalty.toFixed(2)} on citation-completeness`
            );
            for (const m of bboxResult.mismatches) {
              console.error(`  - cited p.${m.citedPage} in "${m.sourceTitle}", available: [${m.availablePages.slice(0, 10).join(', ')}]`);
            }
          }
        }
      } catch {
        // Bbox validation is optional
      }

      // If already passing, return immediately
      if (initialResult.passed) {
        return this.createSuccessResult(content, initialResult, 0);
      }

      // Need revision - run iterative refinement with human verification
      let currentContent = content;
      let currentResult = initialResult;
      let iteration = 0;
      const threshold = options.qualityThreshold ?? QualityIntegration.DEFAULT_THRESHOLD;
      const maxIterations = options.maxRevisions ?? QualityIntegration.DEFAULT_MAX_REVISIONS;
      const preRevisionContent = content;

      // Reset human verifier for new write operation
      this.humanVerifier.resetPrompts();

      while (iteration < maxIterations && !currentResult.passed) {
        iteration++;

        // Human verification check (if enabled via options)
        if (options.humanVerification?.enabled && this.humanVerifier.shouldPrompt(iteration, currentResult.overallScore, threshold)) {
          const reviewContext: ReviewContext = {
            iteration,
            maxIterations,
            currentScore: currentResult.overallScore,
            targetThreshold: threshold,
            previousScore: iteration > 1 ? currentResult.overallScore : undefined,
            gauntletResult: currentResult,
            content: currentContent,
          };

          const decision = await this.humanVerifier.promptReview(reviewContext);

          // Handle user decision
          switch (decision.action) {
            case 'accept':
              // User accepted current version - return immediately
              return this.createSuccessResult(currentContent, currentResult, iteration);

            case 'abort':
              // User aborted - return error result
              return this.createErrorResult(currentContent, new Error('User aborted revision'));

            case 'guidance':
              // User provided custom guidance - use it in revision prompt
              if (decision.customGuidance) {
                this.log(`Using custom guidance: ${decision.customGuidance}`);
              }
              break;

            case 'skip':
              // User wants to skip certain issues - filter them out
              if (decision.skipIssueIds && decision.skipIssueIds.length > 0) {
                this.log(`Skipping ${decision.skipIssueIds.length} issues`);
                // Note: Issue filtering would need to be implemented in orchestrator
              }
              break;

            case 'continue':
            default:
              // Continue with automatic revision
              break;
          }
        }

        // Create revision request
        const revisionRequest: RevisionRequest = {
          originalText: currentContent,
          iteration,
          previousScore: currentResult.overallScore,
          issues: currentResult.stageResults.flatMap(s => s.issues),
          targetThreshold: threshold,
        };

        // Build revision prompt
        let revisionPrompt = this.buildRevisionPrompt(
          revisionRequest,
          options.topic,
          options.style,
          options.format
        );

        // Prepend mandatory edge corrections if present
        if ((currentResult as any).edgeRevisionInstructions?.length > 0) {
          revisionPrompt = `## MANDATORY EDGE CORRECTIONS\n\n` +
            (currentResult as any).edgeRevisionInstructions.join('\n') + '\n\n' +
            revisionPrompt;
        }

        // Execute revision via universal agent
        const revisedContent = await this.executeRevision(revisionPrompt, options);

        // Re-evaluate quality
        const newResult = await this.gauntlet.runGauntlet(revisedContent, iteration + 1, gauntletContext);

        // Log quality metrics
        this.logQualityMetrics(newResult, options.trajectoryId, iteration);

        // Check for improvement
        if (newResult.overallScore <= currentResult.overallScore + 0.02) {
          // No significant improvement - stop revising
          this.log('No significant improvement, stopping revisions');
          break;
        }

        // Update current state
        currentContent = revisedContent;
        currentResult = newResult;
      }

      // Max-retry exhaustion: revert to attempt 0 if manual edge contradictions unresolved
      if ((currentResult as any).edgeRevisionInstructions?.length > 0 && !currentResult.passed) {
        currentContent = preRevisionContent;
        // Inject HTML comments at contradiction sites
        for (const instruction of (currentResult as any).edgeRevisionInstructions) {
          currentContent += `\n\n<!-- EDGE CONTRADICTION UNRESOLVED: ${instruction} -->\n`;
        }
        console.error(`[QualityIntegration] Max-retry exhaustion: reverted to attempt 0 with ${(currentResult as any).edgeRevisionInstructions.length} unresolved contradiction(s)`);
      }

      // Return final result
      return {
        content: currentContent,
        passed: currentResult.passed,
        qualityScore: currentResult.overallScore,
        revisionIterations: iteration,
        gauntletResult: currentResult,
        metrics: this.extractMetrics(currentResult, iteration),
        wasRevised: iteration > 0,
      };
    } catch (error) {
      // Fix 72: Log full error details — previously silent, making 0.5 scores undiagnosable
      console.error('[QualityIntegration] Gauntlet threw error:', error);
      if (error instanceof Error) {
        console.error('[QualityIntegration] Stack:', error.stack);
      }
      // Graceful degradation - if quality gauntlet fails, return original content
      this.logError('Quality validation failed, using original content', error);
      return this.createErrorResult(content, error);
    } finally {
      // Restore base config so per-request overrides don't leak
      this.gauntlet.updateConfig({ overallThreshold: baseThreshold });
      this.orchestrator.updateConfig({ maxIterations: baseMaxRevisions });
    }
  }

  /**
   * Get quality metrics from content without revision
   * (useful for analysis/learning)
   */
  async evaluateQuality(content: string): Promise<QualityMetrics> {
    try {
      const result = await this.gauntlet.runGauntlet(content, 1);
      return this.extractMetrics(result, 0);
    } catch (error) {
      this.logError('Quality evaluation failed', error);
      return this.createDefaultMetrics();
    }
  }

  /**
   * Validate generated text for coherence against known reasoning edges.
   *
   * This is a lightweight, non-LLM check that pattern-matches relationship
   * assertions in the text (e.g., "X depends on Y") and flags any that
   * contradict edges in god-reason/reasoning.jsonl.
   *
   * Can be called independently of the main gauntlet flow.
   *
   * @param text - Generated text to check
   * @param projectRoot - Project root for locating reasoning.jsonl
   * @returns EdgeCoherenceResult with score and contradiction list
   */
  validateEdgeCoherence(text: string, projectRoot?: string): EdgeCoherenceResult {
    return validateEdgeCoherence(text, projectRoot);
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Build revision prompt with context from universal agent
   */
  private buildRevisionPrompt(
    request: RevisionRequest,
    topic: string,
    style: string,
    format: string
  ): string {
    const basePrompt = this.orchestrator.buildRevisionPrompt(request);

    // Enhance with universal agent context
    const enhancedPrompt = `
# REVISION REQUEST FOR: ${topic}

**Style:** ${style}
**Format:** ${format}
**Iteration:** ${request.iteration} of ${this.orchestrator.getConfig().maxIterations}
**Current Score:** ${(request.previousScore * 100).toFixed(1)}%

${basePrompt}

## ORIGINAL TEXT TO REVISE

${request.originalText}

---

Return ONLY the complete revised text. Do not include explanations or meta-commentary.
`;

    return enhancedPrompt;
  }

  /**
   * Execute revision via universal agent's task execution
   */
  private async executeRevision(
    prompt: string,
    options: QualityValidationOptions
  ): Promise<string> {
    // Access private method via type assertion (internal integration)
    const agentAny = this.agent as any;

    // Use the agent's selectAgentForTask to get appropriate revision agent
    const agentSelection = await agentAny.selectAgentForTask(
      `Revise content: ${options.topic}`
    );

    // Override prompt with revision-specific instructions
    const revisionSelection = {
      ...agentSelection,
      prompt,
    };

    // Execute via TaskExecutor
    const result = await agentAny.executeTaskDefault(
      revisionSelection,
      undefined,
      { trajectoryId: options.trajectoryId }
    );

    if (!result.success) {
      this.logError('Revision execution failed', new Error(result.error || 'Unknown error'));
      return prompt; // Fallback to original if revision fails
    }

    return result.result || prompt;
  }

  /**
   * Extract quality metrics from gauntlet result
   */
  private extractMetrics(
    result: GauntletResult,
    iterations: number
  ): QualityMetrics {
    // Extract individual stage scores
    const stageScores = {
      argumentCoherence: 0,
      citationCompleteness: 0,
      styleConsistency: 0,
      factualAccuracy: 0,
    };

    for (const stage of result.stageResults) {
      switch (stage.stageName) {
        case 'argument-coherence':
          stageScores.argumentCoherence = stage.score;
          break;
        case 'citation-completeness':
          stageScores.citationCompleteness = stage.score;
          break;
        case 'style-consistency':
          stageScores.styleConsistency = stage.score;
          break;
        case 'factual-accuracy':
          stageScores.factualAccuracy = stage.score;
          break;
      }
    }

    return {
      overallScore: result.overallScore,
      stageScores,
      issueCounts: {
        critical: result.summary.criticalCount,
        major: result.summary.majorCount,
        minor: result.summary.minorCount,
      },
      autoFixableCount: result.summary.autoFixableCount,
      revisionIterations: iterations,
      passed: result.passed,
    };
  }

  /**
   * Log quality metrics to trajectory for learning
   */
  private logQualityMetrics(
    result: GauntletResult,
    trajectoryId: string | undefined,
    iterations: number
  ): void {
    if (!trajectoryId) return;

    const metrics = this.extractMetrics(result, iterations);

    // Access trajectory bridge via agent (if available)
    const agentAny = this.agent as any;
    if (agentAny.trajectoryBridge) {
      try {
        // Store quality metrics as trajectory metadata
        agentAny.trajectoryBridge.storeMetadata(trajectoryId, {
          qualityMetrics: metrics,
          qualityGauntletRun: {
            runId: result.runId,
            score: result.overallScore,
            passed: result.passed,
            iterations,
            timestamp: result.metadata.timestamp,
          },
        }).catch((err: Error) => {
          this.logError('Failed to store quality metrics', err);
        });
      } catch (error) {
        this.logError('Failed to access trajectory bridge', error);
      }
    }
  }

  /**
   * Create success result (passed initial evaluation)
   */
  private createSuccessResult(
    content: string,
    result: GauntletResult,
    iterations: number
  ): QualityValidationResult {
    return {
      content,
      passed: true,
      qualityScore: result.overallScore,
      revisionIterations: iterations,
      gauntletResult: result,
      metrics: this.extractMetrics(result, iterations),
      wasRevised: iterations > 0,
    };
  }

  /**
   * Create refinement result (after revisions)
   */
  private createRefinementResult(
    result: RefinementResult
  ): QualityValidationResult {
    return {
      content: result.finalText,
      passed: result.passed,
      qualityScore: result.finalScore,
      revisionIterations: result.iterations,
      gauntletResult: result.finalGauntletResult,
      metrics: this.extractMetrics(result.finalGauntletResult, result.iterations),
      wasRevised: result.iterations > 0,
    };
  }

  /**
   * Create bypass result (validation disabled)
   */
  private createBypassResult(content: string): QualityValidationResult {
    return {
      content,
      passed: true,
      qualityScore: 1.0,
      revisionIterations: 0,
      gauntletResult: null as any, // Bypassed
      metrics: this.createDefaultMetrics(),
      wasRevised: false,
    };
  }

  /**
   * Create error result (graceful degradation)
   */
  private createErrorResult(content: string, error: unknown): QualityValidationResult {
    return {
      content, // Return original content
      passed: false,
      qualityScore: 0.5, // Unknown quality
      revisionIterations: 0,
      gauntletResult: null as any, // Error occurred
      metrics: this.createDefaultMetrics(),
      wasRevised: false,
    };
  }

  /**
   * Create default metrics (for errors/bypasses)
   */
  private createDefaultMetrics(): QualityMetrics {
    return {
      overallScore: 0.5,
      stageScores: {
        argumentCoherence: 0.5,
        citationCompleteness: 0.5,
        styleConsistency: 0.5,
        factualAccuracy: 0.5,
      },
      issueCounts: {
        critical: 0,
        major: 0,
        minor: 0,
      },
      autoFixableCount: 0,
      revisionIterations: 0,
      passed: false,
    };
  }

  /**
   * Log error (uses agent's logger if available)
   */
  private logError(message: string, error: unknown): void {
    const agentAny = this.agent as any;
    if (agentAny.log) {
      agentAny.log(`[QualityIntegration] ${message}: ${error}`);
    } else {
      console.error(`[QualityIntegration] ${message}:`, error);
    }
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create quality integration for universal agent
 */
export function createQualityIntegration(agent: UniversalAgent): QualityIntegration {
  return new QualityIntegration(agent);
}
