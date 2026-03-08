/**
 * GoldStandardConfig — Centralized magic numbers for the writing pipeline.
 *
 * These values were tuned against the gold-standard output and should be
 * adjusted deliberately (not scattered as inline literals).
 */

export const GOLD_STANDARD_CONFIG = Object.freeze({
  /** Target character length per trimmed chunk (gold standard averaged ~450). */
  chunkTrimTarget: 450,

  /** Default number of corpus chunks to retrieve. */
  targetChunks: 28,

  /** Maximum chunks from a single source (source diversity). */
  maxChunksPerSource: 8,

  /** Total chunk target after diversity enforcement. */
  targetTotalChunks: 35,

  /** Minimum relevance score for a chunk to count as "available". */
  relevanceFloor: 0.25,

  /** If primary-author ratio falls below this, attempt supplementation. */
  primaryRatioThreshold: 0.3,

  /** Minimum word count per section. */
  minSectionWords: 350,

  /** Maximum characters for corpus context block (~15K tokens). */
  maxCorpusBlockChars: 60000,

  /** Over-citation threshold — if one source exceeds this ratio, flag it. */
  overCitationThreshold: 0.4,

  /** Max tokens for Opus generation (gold standard needs ~6K words + appendix). */
  opusMaxTokens: 16384,
});

export type GoldStandardConfig = typeof GOLD_STANDARD_CONFIG;
