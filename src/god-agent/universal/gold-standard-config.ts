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

  // ---- Rolling Context Generation ----

  /** Number of prior sections to include in the sliding window. */
  rollingContextWindowSize: 2,

  /** Target words per rolling section (Opus sweet spot). */
  rollingContextSectionWords: 700,

  /** Target words for the conclusion section. */
  rollingContextConclusionWords: 200,

  /** Max output tokens per rolling section API call. */
  rollingContextMaxTokens: 2048,

  /** Number of top-relevance chunks in the shared pool (available to every section). */
  rollingContextSharedPoolSize: 5,

  /** Max corpus chunks per section prompt. */
  rollingContextMaxChunksPerSection: 10,

  /** Use Haiku 50-word summaries for conclusion context (vs raw prior text). */
  rollingContextUseSummaries: true,

  /** Deprioritize a shared-pool chunk after its author reaches this many citations. */
  rollingContextSharedPoolMaxCitations: 3,
});

export type GoldStandardConfig = typeof GOLD_STANDARD_CONFIG;

/**
 * SubsectionDefaults — Defaults for subsection-mode generation.
 *
 * Subsection-mode targets single-block LaTeX output at 400-1500 words,
 * unlike GOLD_STANDARD_CONFIG which targets 3000-3500 word multi-section
 * full-document output. Used by the --subsection-mode CLI flag and the
 * `buildSubsectionPrompt` prompt builder.
 */
export const SUBSECTION_DEFAULTS = Object.freeze({
  /** Minimum acceptable word count as fraction of wordTarget (e.g., 0.85 of 700 = 595). */
  totalMinRatio: 0.85,

  /** Section-words minimum as fraction of wordTarget (single-block subsections; this is effectively a floor on the whole output). */
  minSectionRatio: 0.5,

  /** Default verbatim-quotation target derived as floor(wordTarget / quotationsPerWords). */
  quotationsPerWords: 350,

  /** Max output tokens per subsection-mode API call (Opus; lower than gold standard's 16K because subsections are smaller). */
  subsectionMaxTokens: 4096,

  /** Default minimum relevance floor for corpus chunks in subsection-mode (slightly stricter than gold-standard's 0.25). */
  minRelevanceFloor: 0.45,
});

export type SubsectionDefaults = typeof SUBSECTION_DEFAULTS;
