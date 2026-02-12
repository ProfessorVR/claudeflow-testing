/**
 * Reciprocal Rank Fusion (RRF) - Result Fusion Algorithm
 *
 * Implements RRF for combining results from multiple retrieval systems
 * (e.g., BM25 sparse search + semantic dense search).
 *
 * RRF Formula:
 * RRF_score(d) = Σ 1 / (k + rank_i(d))
 *
 * Where:
 * - d = document
 * - rank_i(d) = rank of document d in retrieval system i (1-indexed)
 * - k = constant (typically 60) to reduce impact of high ranks
 *
 * RRF is effective because it:
 * 1. Doesn't require score normalization across systems
 * 2. Down-weights lower-ranked results naturally
 * 3. Favors documents that appear in multiple systems
 * 4. Is robust to differences in score distributions
 *
 * Reference:
 * Cormack, G. V., Clarke, C. L., & Buettcher, S. (2009).
 * "Reciprocal rank fusion outperforms condorcet and individual rank learning methods"
 *
 * @module fusion
 */

// ============================================================================
// Types
// ============================================================================

/**
 * Ranked result from a retrieval system
 */
export interface RankedResult {
  /** Document ID */
  id: string;
  /** Relevance score from the retrieval system */
  score: number;
  /** Document content */
  content: string;
  /** Source metadata */
  source: string;
  /** Original rank (1-indexed) */
  rank?: number;
}

/**
 * Fused result with combined scoring
 */
export interface FusedResult {
  /** Document ID */
  id: string;
  /** RRF combined score */
  rrfScore: number;
  /** Individual scores from each system */
  systemScores: Map<string, number>;
  /** Individual ranks from each system (1-indexed) */
  systemRanks: Map<string, number>;
  /** Document content */
  content: string;
  /** Source metadata */
  source: string;
}

/**
 * RRF configuration
 */
export interface RRFConfig {
  /**
   * RRF constant k (default: 60)
   * Higher values reduce the impact of high ranks
   */
  k?: number;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: Required<RRFConfig> = {
  k: 60,
};

// ============================================================================
// Reciprocal Rank Fusion Functions
// ============================================================================

/**
 * Fuse results from multiple retrieval systems using RRF
 *
 * @param rankedLists - Map of system name to ranked results
 * @param config - RRF configuration
 * @returns Array of fused results sorted by RRF score
 *
 * @example
 * ```typescript
 * const bm25Results = bm25Index.search("phantasia aristotle", 10);
 * const semanticResults = await coldAccessor.search("phantasia aristotle", 10);
 *
 * const fused = fuseResults({
 *   bm25: bm25Results,
 *   semantic: semanticResults
 * });
 * ```
 */
export function fuseResults(
  rankedLists: Record<string, RankedResult[]>,
  config: RRFConfig = {}
): FusedResult[] {
  const { k } = { ...DEFAULT_CONFIG, ...config };

  // Build a map of document ID to fused result
  const fusedMap = new Map<string, FusedResult>();

  // Process each retrieval system
  for (const [systemName, results] of Object.entries(rankedLists)) {
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const rank = i + 1; // 1-indexed rank

      // Get or create fused result
      let fused = fusedMap.get(result.id);
      if (!fused) {
        fused = {
          id: result.id,
          rrfScore: 0,
          systemScores: new Map(),
          systemRanks: new Map(),
          content: result.content,
          source: result.source,
        };
        fusedMap.set(result.id, fused);
      }

      // Add RRF contribution from this system
      const rrfContribution = 1 / (k + rank);
      fused.rrfScore += rrfContribution;

      // Store individual system score and rank
      fused.systemScores.set(systemName, result.score);
      fused.systemRanks.set(systemName, rank);
    }
  }

  // Convert to array and sort by RRF score
  const fusedResults = Array.from(fusedMap.values());
  fusedResults.sort((a, b) => b.rrfScore - a.rrfScore);

  return fusedResults;
}

/**
 * Fuse exactly two result lists (optimized path)
 *
 * @param list1 - First ranked list
 * @param list2 - Second ranked list
 * @param config - RRF configuration
 * @returns Array of fused results sorted by RRF score
 */
export function fuseTwoLists(
  list1: RankedResult[],
  list2: RankedResult[],
  config: RRFConfig = {}
): FusedResult[] {
  return fuseResults({ list1, list2 }, config);
}

/**
 * Compute RRF score for a document given its ranks in multiple systems
 *
 * @param ranks - Array of ranks (1-indexed) from different systems
 * @param k - RRF constant (default: 60)
 * @returns RRF score
 *
 * @example
 * ```typescript
 * // Document ranked 1st in BM25, 3rd in semantic search
 * const score = computeRRFScore([1, 3]);
 * // score = 1/(60+1) + 1/(60+3) = 0.0164 + 0.0159 = 0.0323
 * ```
 */
export function computeRRFScore(ranks: number[], k: number = 60): number {
  return ranks.reduce((sum, rank) => sum + 1 / (k + rank), 0);
}

/**
 * Normalize RRF scores to [0, 1] range
 *
 * @param results - Fused results
 * @returns Results with normalized RRF scores
 */
export function normalizeRRFScores(results: FusedResult[]): FusedResult[] {
  if (results.length === 0) {
    return results;
  }

  // Find max score
  const maxScore = Math.max(...results.map(r => r.rrfScore));

  if (maxScore === 0) {
    return results;
  }

  // Normalize
  return results.map(result => ({
    ...result,
    rrfScore: result.rrfScore / maxScore,
  }));
}

/**
 * Filter fused results to return only top-K
 *
 * @param results - Fused results
 * @param topK - Number of results to keep
 * @returns Top-K results
 */
export function topKResults(results: FusedResult[], topK: number): FusedResult[] {
  return results.slice(0, topK);
}

/**
 * Analyze fusion statistics
 *
 * @param results - Fused results
 * @returns Statistics about the fusion
 */
export function analyzeFusion(results: FusedResult[]): {
  totalResults: number;
  uniqueSystems: Set<string>;
  avgSystemsPerDoc: number;
  singleSystemDocs: number;
  multiSystemDocs: number;
  scoreDistribution: {
    min: number;
    max: number;
    avg: number;
    median: number;
  };
} {
  if (results.length === 0) {
    return {
      totalResults: 0,
      uniqueSystems: new Set(),
      avgSystemsPerDoc: 0,
      singleSystemDocs: 0,
      multiSystemDocs: 0,
      scoreDistribution: { min: 0, max: 0, avg: 0, median: 0 },
    };
  }

  // Collect all system names
  const allSystems = new Set<string>();
  for (const result of results) {
    for (const system of result.systemRanks.keys()) {
      allSystems.add(system);
    }
  }

  // Count documents by number of systems
  let totalSystems = 0;
  let singleSystemDocs = 0;
  let multiSystemDocs = 0;

  for (const result of results) {
    const numSystems = result.systemRanks.size;
    totalSystems += numSystems;

    if (numSystems === 1) {
      singleSystemDocs++;
    } else {
      multiSystemDocs++;
    }
  }

  const avgSystemsPerDoc = totalSystems / results.length;

  // Score distribution
  const scores = results.map(r => r.rrfScore).sort((a, b) => a - b);
  const min = scores[0];
  const max = scores[scores.length - 1];
  const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const median = scores[Math.floor(scores.length / 2)];

  return {
    totalResults: results.length,
    uniqueSystems: allSystems,
    avgSystemsPerDoc,
    singleSystemDocs,
    multiSystemDocs,
    scoreDistribution: { min, max, avg, median },
  };
}

/**
 * Convert fused result to a simple ranked result (for backward compatibility)
 *
 * @param fused - Fused result
 * @returns Ranked result with RRF score as the score
 */
export function fusedToRanked(fused: FusedResult): RankedResult {
  return {
    id: fused.id,
    score: fused.rrfScore,
    content: fused.content,
    source: fused.source,
  };
}

/**
 * Convert array of fused results to ranked results
 *
 * @param fusedResults - Array of fused results
 * @returns Array of ranked results
 */
export function fusedArrayToRanked(fusedResults: FusedResult[]): RankedResult[] {
  return fusedResults.map(fusedToRanked);
}

// ============================================================================
// Visualization Helpers (for debugging)
// ============================================================================

/**
 * Format fusion results for debugging
 *
 * @param results - Fused results
 * @param topN - Number of results to format (default: 10)
 * @returns Formatted string
 */
export function formatFusionResults(results: FusedResult[], topN: number = 10): string {
  const lines: string[] = [];
  lines.push('=== RRF Fusion Results ===');
  lines.push('');

  for (let i = 0; i < Math.min(topN, results.length); i++) {
    const result = results[i];
    lines.push(`${i + 1}. [RRF: ${result.rrfScore.toFixed(4)}] ${result.source}`);

    // Show individual system contributions
    const systems: string[] = [];
    for (const [system, rank] of result.systemRanks.entries()) {
      const score = result.systemScores.get(system) || 0;
      systems.push(`${system}: rank=${rank}, score=${score.toFixed(3)}`);
    }
    lines.push(`   Systems: ${systems.join(', ')}`);

    // Show content preview
    const preview = result.content.substring(0, 100).replace(/\n/g, ' ');
    lines.push(`   Preview: ${preview}...`);
    lines.push('');
  }

  return lines.join('\n');
}
