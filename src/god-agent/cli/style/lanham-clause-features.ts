/**
 * lanham-clause-features.ts — Extract Lanham-relevant features from clause parse documents.
 *
 * Phase 3 of the clause parser plan: clause-derived feature extraction.
 * Consumers: parataxis (shadow mode) and periodic (ensemble blend) in Tier 2.
 *
 * Design:
 * - hasClauseData guards all downstream consumers: when false, numeric fields are zero
 * - parseConfidence aggregates matrix-resolution confidence, coverage, and low-confidence ratio
 * - computeParataxisFromClauses and computePeriodicFromClauses produce 0-1 scores
 *   using the same conventions as existing Tier 2 axes
 */

import type { ClauseParseDocument, SentenceClauseParse, ClauseNode } from './lanham-clause-types.js';
import { clamp } from './lanham-shared.js';

// ── Feature interface ───────────────────────────────────────────────────────

export interface ClauseDerivedFeatures {
  /** False when clause parser backend is unavailable or returned empty parses.
   *  When false, all numeric fields are zero and must NOT be used for scoring. */
  hasClauseData: boolean;
  /** Document-level confidence in the clause parse (0-1). */
  parseConfidence: number;
  coordinateClauseRate: number;
  subordinateClauseRate: number;
  subordinationDepthMean: number;
  maxSubordinationDepth: number;
  finiteClauseCount: number;
  preMainSubordinateRate: number;
  matrixDelayMean: number;
}

// ── Subordinate roles for classification ────────────────────────────────────

const SUBORDINATE_ROLES = new Set(['adverbial-subordinate', 'relative', 'complement']);

// ── Main feature extraction ─────────────────────────────────────────────────

/**
 * Extract Lanham-relevant features from a clause parse document.
 * Returns hasClauseData = true when at least one finite clause was parsed.
 */
export function extractClauseFeatures(doc: ClauseParseDocument): ClauseDerivedFeatures {
  const empty: ClauseDerivedFeatures = {
    hasClauseData: false,
    parseConfidence: 0,
    coordinateClauseRate: 0,
    subordinateClauseRate: 0,
    subordinationDepthMean: 0,
    maxSubordinationDepth: 0,
    finiteClauseCount: 0,
    preMainSubordinateRate: 0,
    matrixDelayMean: 0,
  };

  if (doc.sentences.length === 0) return empty;

  let totalCoordinate = 0;
  let totalSubordinate = 0;
  let totalFinite = 0;
  let totalDepth = 0;
  let maxDepth = 0;
  let totalPreMainSubord = 0;
  let totalMatrixDelay = 0;
  let sentencesWithMatrix = 0;

  // For parseConfidence
  let totalMatrixConfidence = 0;
  let sentencesWithNonNullMatrix = 0;
  let lowConfidenceClauses = 0;
  let totalClauses = 0;

  for (const sent of doc.sentences) {
    for (const clause of sent.clauses) {
      totalClauses++;

      if (clause.confidence < 0.5) {
        lowConfidenceClauses++;
      }

      if (clause.role === 'coordinate') {
        totalCoordinate++;
      }

      if (SUBORDINATE_ROLES.has(clause.role)) {
        totalSubordinate++;
      }

      if (clause.finite) {
        totalFinite++;
      }

      totalDepth += clause.depth;
      if (clause.depth > maxDepth) {
        maxDepth = clause.depth;
      }
    }

    // Matrix clause analysis
    if (sent.matrixClauseId) {
      sentencesWithNonNullMatrix++;
      const matrixClause = sent.clauses.find(c => c.id === sent.matrixClauseId);
      if (matrixClause) {
        totalMatrixConfidence += matrixClause.confidence;
        sentencesWithMatrix++;

        // Pre-main subordinate count: subordinate clauses that end before matrix span start
        const preMainCount = sent.clauses.filter(c =>
          SUBORDINATE_ROLES.has(c.role) &&
          c.span.end <= matrixClause.span.start
        ).length;
        totalPreMainSubord += preMainCount;

        // Matrix delay: compute from periodic signals
        const periodic = computePeriodicSignals(sent);
        totalMatrixDelay += periodic.leftBranchIndex;
      }
    }
  }

  if (totalFinite === 0) return empty;

  const sentCount = doc.sentences.length;
  const totalClassified = totalCoordinate + totalSubordinate;

  // Parse confidence: composite of three signals
  const avgMatrixConfidence = sentencesWithMatrix > 0
    ? totalMatrixConfidence / sentencesWithMatrix
    : 0;
  const matrixCoverage = sentencesWithNonNullMatrix / sentCount;
  const lowConfidenceRatio = totalClauses > 0
    ? lowConfidenceClauses / totalClauses
    : 1;
  const parseConfidence = clamp(
    avgMatrixConfidence * 0.4 +
    matrixCoverage * 0.4 +
    (1 - lowConfidenceRatio) * 0.2
  );

  return {
    hasClauseData: true,
    parseConfidence,
    coordinateClauseRate: totalClassified > 0
      ? totalCoordinate / totalClassified
      : 0, // no coordinate or subordinate clauses = zero rate, not neutral 0.5
    subordinateClauseRate: totalClassified > 0
      ? totalSubordinate / totalClassified
      : 0, // no coordinate or subordinate clauses = zero rate, not neutral 0.5
    subordinationDepthMean: totalClauses > 0
      ? totalDepth / totalClauses
      : 0,
    maxSubordinationDepth: maxDepth,
    finiteClauseCount: totalFinite,
    preMainSubordinateRate: sentCount > 0
      ? totalPreMainSubord / sentCount
      : 0,
    matrixDelayMean: sentencesWithMatrix > 0
      ? totalMatrixDelay / sentencesWithMatrix
      : 0.5,
  };
}

// ── Periodic signals from a single sentence parse ───────────────────────────

export interface PeriodicSignals {
  /** 0 = verb at token 0 (running), 1 = verb at end (periodic) */
  leftBranchIndex: number;
  /** Count of subordinate clauses ending before the matrix span start */
  preMainSubordinateCount: number;
}

/**
 * Compute periodic-style signals from a single sentence clause parse.
 * leftBranchIndex: headVerbToken / totalContentTokens (0 = running, 1 = periodic).
 * preMainSubordinateCount: subordinate clauses ending before the matrix clause span start.
 */
export function computePeriodicSignals(parse: SentenceClauseParse): PeriodicSignals {
  const matrixClause = parse.clauses.find(c => c.id === parse.matrixClauseId);

  if (!matrixClause || parse.tokens.length === 0) {
    return { leftBranchIndex: 0.5, preMainSubordinateCount: 0 };
  }

  // Left-branch index: position of matrix head verb relative to total content tokens
  const contentTokens = parse.tokens.filter(t => /\w/.test(t.text));
  const totalContentTokens = contentTokens.length;

  let leftBranchIndex = 0.5; // neutral fallback
  if (matrixClause.headVerbToken !== undefined && totalContentTokens > 1) {
    // Find the position of the head verb among content tokens
    const verbContentPos = contentTokens.findIndex(t => t.i === matrixClause.headVerbToken);
    if (verbContentPos >= 0) {
      leftBranchIndex = verbContentPos / (totalContentTokens - 1);
    }
  }

  // Pre-main subordinate count: subordinate clauses ending before matrix span start
  const preMainSubordinateCount = parse.clauses.filter(c =>
    SUBORDINATE_ROLES.has(c.role) &&
    c.span.end <= matrixClause.span.start
  ).length;

  return { leftBranchIndex, preMainSubordinateCount };
}

// ── Parataxis score from clause features ────────────────────────────────────

/**
 * Compute a parataxis/hypotaxis ratio from clause-derived features.
 * 0 = purely paratactic, 1 = purely hypotactic.
 * Matches the convention of the existing Tier 2 parataxisHypotaxisRatio.
 *
 * Formula:
 * - Hypotactic signals (push toward 1): subordinateClauseRate, depth signals, preMainSubordRate
 * - Paratactic signals (push toward 0): coordinateClauseRate, high finiteClauseCount with zero subordination
 */
export function computeParataxisFromClauses(f: ClauseDerivedFeatures): number {
  if (!f.hasClauseData) return 0.5;

  // Hypotactic component: weighted combination of subordination signals
  const subordSignal = f.subordinateClauseRate * 0.50;
  const depthSignal = clamp(f.subordinationDepthMean / 3) * 0.20 +
                      clamp(f.maxSubordinationDepth / 4) * 0.05;
  const preMainSignal = clamp(f.preMainSubordinateRate) * 0.10;
  const hypotacticScore = subordSignal + depthSignal + preMainSignal;

  // Paratactic component: coordination dominance + finite clauses without subordination
  const coordSignal = f.coordinateClauseRate * 0.50;
  const flatStructureBonus = f.subordinateClauseRate < 0.1 && f.finiteClauseCount > 2
    ? 0.10
    : 0;
  const paratacticScore = coordSignal + flatStructureBonus;

  // Net ratio: hypotactic pushes toward 1, paratactic pushes toward 0
  // Balanced when both are roughly equal
  const raw = hypotacticScore - paratacticScore + 0.5;
  return clamp(raw);
}

// ── Periodic score from clause features ─────────────────────────────────────

/**
 * Compute a periodic/running ratio from clause-derived features.
 * 0 = purely periodic, 1 = purely running.
 * Matches the convention of the existing Tier 2 periodicRunningRatio.
 *
 * Uses matrixDelayMean (0 = verb early = running, 1 = verb late = periodic),
 * preMainSubordinateRate (high = periodic), and subordinationDepthMean (high = periodic).
 */
export function computePeriodicFromClauses(f: ClauseDerivedFeatures): number {
  if (!f.hasClauseData) return 0.5;

  // matrixDelayMean is 0 = running (verb early), 1 = periodic (verb late)
  // Invert so higher = more running (matches output convention)
  const matrixRunning = 1 - clamp(f.matrixDelayMean);

  // preMainSubordinateRate: high = periodic, invert for running convention
  const preMainRunning = 1 - clamp(f.preMainSubordinateRate);

  // subordinationDepthMean: deeper = more periodic, invert for running
  const depthRunning = 1 - clamp(f.subordinationDepthMean / 3);

  // Weighted ensemble
  return clamp(
    matrixRunning * 0.50 +
    preMainRunning * 0.30 +
    depthRunning * 0.20
  );
}
