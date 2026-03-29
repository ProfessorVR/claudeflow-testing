/**
 * RetrievalStage — Phase 1 of the writing pipeline.
 *
 * Extracted from WritePipelineOrchestrator (Phase 8.1) to deduplicate
 * the ~600 lines of retrieval logic shared between write() and writeV2().
 *
 * Responsibilities:
 * - Multi-query semantic retrieval (Phase 1a)
 * - Primary-author-aware supplementation (Phase 1b)
 * - Title-targeted retrieval (Phase 1b+)
 * - Source diversity enforcement (Phase 1c)
 * - Chunk trimming and attention reordering (Phase 1d-e)
 * - Coverage validation (Phase 1f)
 * - Knowledge unit loading
 * - Structural reasoning edge loading
 * - CorpusConstraint building
 * - Per-section constraint derivation
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import type { ContextChunk, RetrievalOptions } from '../../retrieval/types.js';
import type { CorpusConstraint, CorpusSource } from '../../core/writing/index.js';
import { buildCorpusConstraint } from '../../core/writing/index.js';
import type { SmartRetrievalLayer } from '../../retrieval/smart-retrieval-layer.js';
import type { RetrievalResult } from './stage-types.js';
import type { PipelineContext } from './stage-types.js';
import { recordDegraded, recordWarning } from './stage-types.js';
import { GOLD_STANDARD_CONFIG } from '../gold-standard-config.js';
import {
  loadDomainConfig,
  getDomainKeywords,
  extractWorkReferences,
} from '../domain-config.js';
import {
  trimChunkContent,
  enforceSourceDiversity,
  reorderChunksForAttention,
  validateRetrievalCoverage,
} from '../../core/composition/retrieval-utils.js';

// =============================================================================
// TYPES
// =============================================================================

/** Dependencies injected from the orchestrator. */
export interface RetrievalStageDeps {
  smartRetrieval: SmartRetrievalLayer | null;
  /** Decompose topic into semantic keyword queries for embedding search. */
  extractSemanticRetrievalQueries: (topic: string) => string[];
  /** Extract all named authors from the prompt. */
  extractPrimaryAuthors: (topic: string) => string[];
  /** Extract authors mentioned 2+ times (key authors). */
  extractKeyAuthors: (topic: string) => string[];
  /** Extract section headings / retrieval queries from the topic. */
  extractRetrievalQueries: (topic: string) => string[];
  /** Build per-section citation constraints from section headings and primary authors. */
  buildSectionConstraints: (subsections: string[], primaryAuthors: string[]) => string[];
  /** Load corpus manifest with caching. */
  cachedLoadCorpusManifest: (opts?: { collections?: string[] }) => Promise<CorpusSource[]>;
  /** Diagnostic logger — writes only in whitelistMode. */
  goldLog: (msg: string) => void;
}

/** Typed options for the retrieval stage (subset of write() options). */
export interface RetrievalStageOptions {
  whitelistMode?: boolean;
  corpusChunkCount?: number;
  corpusCollections?: string[];
  corpusMinRelevance?: number;
  length?: 'short' | 'medium' | 'long' | 'comprehensive';
}

// =============================================================================
// IMPLEMENTATION
// =============================================================================

/**
 * Run the retrieval stage: multi-query retrieval, diversity enforcement,
 * knowledge/edge loading, and corpus constraint building.
 *
 * Returns a RetrievalResult containing everything the drafting stage needs.
 * The seenIds set is explicitly returned (UNIV-C3 fix) so supplemental
 * retrieval in later stages can avoid duplicates.
 */
export async function runRetrievalStage(
  topic: string,
  options: RetrievalStageOptions,
  deps: RetrievalStageDeps,
  ctx: PipelineContext,
): Promise<RetrievalResult> {
  const { goldLog } = deps;

  let corpusChunks: ContextChunk[] = [];
  let corpusConstraint: CorpusConstraint | null = null;
  let primaryAuthors: string[] = [];
  let knowledgeUnitLines: string[] = [];
  let structuralEdgeLines: string[] = [];
  let sectionConstraints: string[] = [];
  let subsections: string[] = [];
  let primaryUnderCoverage: string[] | undefined;
  const seenIds = new Set<string>();

  if (!options.whitelistMode) {
    // Non-whitelist mode: return empty retrieval result
    return buildResult({
      corpusChunks, corpusConstraint, primaryAuthors, knowledgeUnitLines,
      structuralEdgeLines, sectionConstraints, subsections, primaryUnderCoverage,
      seenIds, options,
    });
  }

  goldLog('Multi-query retrieval + style + single-shot generation...');

  try {
    // ===== Phase 1a: Multi-query semantic retrieval =====
    subsections = deps.extractSemanticRetrievalQueries(topic);
    const targetChunks = options.corpusChunkCount ?? GOLD_STANDARD_CONFIG.targetChunks;
    const retrievalOpts: RetrievalOptions = {
      collections: options.corpusCollections || [],
      minRelevance: options.corpusMinRelevance ?? 0.0,
      diversityBoost: true,
      rerank: true,
    };

    if (deps.smartRetrieval) {
      const allChunks: ContextChunk[] = [];
      const addChunks = (chunks: ContextChunk[]) => {
        for (const c of chunks) {
          const id = c.metadata.chunk_id || `${c.metadata.source_id}:${c.metadata.page_start}`;
          if (!seenIds.has(id)) { seenIds.add(id); allChunks.push(c); }
        }
      };

      goldLog(`Phase 1a: Multi-query retrieval: ${subsections.length} semantic queries`);
      const perQueryMax = Math.ceil(targetChunks / Math.max(subsections.length, 1)) + 5;

      for (const sq of subsections) {
        try {
          const chunks = await deps.smartRetrieval.retrieveContext(sq, {
            ...retrievalOpts, maxChunks: perQueryMax,
          });
          addChunks(chunks);
        } catch (e) {
          recordWarning(ctx, 'retrieval', `Sub-query failed for "${sq}": ${e}`);
        }
      }

      // ===== Phase 1b: Primary-author supplementation =====
      primaryAuthors = deps.extractPrimaryAuthors(topic);
      const keyAuthors = primaryAuthors.length > 0 ? primaryAuthors : deps.extractKeyAuthors(topic);
      if (keyAuthors.length > 0) {
        goldLog(`Phase 1b: Source-targeted supplementation for: ${keyAuthors.join(', ')}`);
        for (const author of keyAuthors.slice(0, 3)) {
          try {
            const authorChunks = await deps.smartRetrieval.retrieveContext(topic.substring(0, 300), {
              ...retrievalOpts, maxChunks: 16, whereFilter: { author_raw: { $eq: author } },
            });
            addChunks(authorChunks);
            if (authorChunks.length < 4) {
              const looseChunks = await deps.smartRetrieval.retrieveContext(
                `${author} ${topic.substring(0, 100)}`, { ...retrievalOpts, maxChunks: 10 }
              );
              addChunks(looseChunks.filter(c => (c.metadata.author || '').toLowerCase().includes(author.toLowerCase())));
            }
          } catch (e) {
            recordWarning(ctx, 'retrieval', `${author} supplementation failed: ${e}`);
          }
        }
      }

      // ===== Phase 1b+: Title-targeted retrieval (Fix 68) =====
      const workRefs = extractWorkReferences(topic, loadDomainConfig());
      if (workRefs.length > 0) {
        goldLog(`Phase 1b+: Title-targeted retrieval for ${workRefs.length} referenced work(s)`);
        for (const { titleRaw, mentions } of workRefs) {
          try {
            const shortQuery = `${titleRaw.split(/[-:(]/)[0].trim()} ${topic.substring(0, 150)}`;
            const titleChunks = await deps.smartRetrieval.retrieveContext(shortQuery, {
              ...retrievalOpts, minRelevance: 0.0,
              maxChunks: Math.min(4 + mentions * 2, 12),
              whereFilter: { title_raw: { $eq: titleRaw } },
            });
            addChunks(titleChunks);
          } catch (e) {
            recordWarning(ctx, 'retrieval', `"${titleRaw}" title retrieval failed: ${e}`);
          }
        }
      }

      // ===== Phase 1c: Source diversity enforcement =====
      corpusChunks = enforceSourceDiversity(allChunks, { maxPerSource: 8, targetTotal: targetChunks });

      // ===== Phase 1d: Chunk trimming =====
      for (const chunk of corpusChunks) {
        if (chunk.content) chunk.content = trimChunkContent(chunk.content, GOLD_STANDARD_CONFIG.chunkTrimTarget);
      }

      // ===== Phase 1e: Attention reordering =====
      corpusChunks = reorderChunksForAttention(corpusChunks);

      // ===== Phase 1f: Coverage validation + supplementation =====
      const coverage = validateRetrievalCoverage(topic, corpusChunks, 2);
      if (coverage.missingAuthors.length > 0 || coverage.weakAuthors.length > 0) {
        for (const author of [...coverage.missingAuthors, ...coverage.weakAuthors]) {
          try {
            const authorChunks = await deps.smartRetrieval.retrieveContext(
              `${author} ${topic.substring(0, 150)}`,
              { ...retrievalOpts, maxChunks: 8, whereFilter: { author_raw: { $eq: author } } }
            );
            for (const c of authorChunks) {
              const id = c.metadata.chunk_id || `${c.metadata.source_id}:${c.metadata.page_start}`;
              if (!seenIds.has(id)) {
                seenIds.add(id);
                if (c.content) c.content = trimChunkContent(c.content, GOLD_STANDARD_CONFIG.chunkTrimTarget);
                corpusChunks.push(c);
              }
            }
          } catch (e) {
            recordWarning(ctx, 'retrieval', `${author} coverage retrieval failed: ${e}`);
          }
        }
      }

      // Primary ratio check
      if (primaryAuthors.length > 0) {
        const primaryLower = primaryAuthors.map(a => a.toLowerCase());
        const primaryChunkCount = corpusChunks.filter(c =>
          primaryLower.some(pa => (c.metadata.author || '').toLowerCase().includes(pa))
        ).length;
        const primaryRatio = corpusChunks.length > 0 ? primaryChunkCount / corpusChunks.length : 0;
        if (primaryRatio < GOLD_STANDARD_CONFIG.primaryRatioThreshold) {
          primaryUnderCoverage = primaryAuthors.filter(author => {
            const count = corpusChunks.filter(c =>
              (c.metadata.author || '').toLowerCase().includes(author.toLowerCase())
            ).length;
            return count < 2;
          });
        }
      }
    } else {
      recordDegraded(ctx, 'retrieval', 'No smartRetrieval available');
    }

    // ===== Knowledge units =====
    try {
      const kuPath = path.join(process.cwd(), 'god-learn', 'knowledge.jsonl');
      if (fs.existsSync(kuPath)) {
        const lines = fs.readFileSync(kuPath, 'utf-8').split('\n').filter(Boolean);
        const allKUs = lines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
        const topicLower = topic.toLowerCase();
        const domainKeywords = getDomainKeywords(loadDomainConfig());
        const relevantDomains = domainKeywords.filter(d => topicLower.includes(d));
        const relevant = allKUs.filter((ku: any) =>
          relevantDomains.some(d => (ku.claim || ku.content || '').toLowerCase().includes(d))
        );
        knowledgeUnitLines = (relevant.length > 0 ? relevant : allKUs)
          .slice(0, 10)
          .map((ku: any) => `- ${ku.claim || ku.content} (${ku.source || 'corpus'})`);
      }
    } catch (e) {
      recordWarning(ctx, 'retrieval', `Knowledge unit loading failed: ${e}`);
    }

    // ===== Structural reasoning edges =====
    try {
      const edgePath = path.join(process.cwd(), 'god-reason', 'reasoning.jsonl');
      if (fs.existsSync(edgePath)) {
        const edgeLines = fs.readFileSync(edgePath, 'utf-8').split('\n').filter(Boolean);
        const allEdges = edgeLines.map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
        const topicTerms = topic.toLowerCase().split(/\s+/).filter(t => t.length > 3);
        const relevantEdges = allEdges.filter((e: any) => {
          const src = (e.source || '').toLowerCase();
          const tgt = (e.target || '').toLowerCase();
          return topicTerms.some(t => src.includes(t) || tgt.includes(t) || t.includes(src) || t.includes(tgt));
        });
        relevantEdges.sort((a: any, b: any) => {
          const scoreDiff = (b.corroboration_score || 1) - (a.corroboration_score || 1);
          if (scoreDiff !== 0) return scoreDiff;
          return (b.generation_epoch || 0) - (a.generation_epoch || 0);
        });
        structuralEdgeLines = relevantEdges.slice(0, 30).map((e: any) =>
          `- ${e.source} ${(e.relation || 'relates_to').toUpperCase()} ${e.target}` +
          (e.pipeline ? ` (${e.pipeline})` : '') +
          (e.corroboration_score && e.corroboration_score > 1 ? ` [corroborated]` : '')
        );
      }
    } catch (e) {
      recordWarning(ctx, 'retrieval', `Structural edge loading failed: ${e}`);
    }

    // ===== Section constraints =====
    const allSubsections = deps.extractRetrievalQueries(topic);
    sectionConstraints = deps.buildSectionConstraints(allSubsections, primaryAuthors);

    // ===== Corpus constraint =====
    if (corpusChunks.length > 0) {
      const additionalSources = await deps.cachedLoadCorpusManifest({
        collections: options.corpusCollections?.length ? options.corpusCollections : undefined,
      }).catch(() => [] as CorpusSource[]);
      corpusConstraint = buildCorpusConstraint(corpusChunks, {
        enforcement: 'strict', missingCitationPlaceholder: '', minRelevance: 0.0, additionalSources,
      });
    } else {
      const manifestSources = await deps.cachedLoadCorpusManifest({
        collections: options.corpusCollections?.length ? options.corpusCollections : undefined,
      }).catch(() => [] as CorpusSource[]);
      if (manifestSources.length > 0) {
        corpusConstraint = { sources: manifestSources, enforcement: 'strict', missingCitationPlaceholder: '' };
      }
    }

  } catch (error) {
    recordDegraded(ctx, 'retrieval', `Whitelist mode setup failed: ${error}`);
  }

  return buildResult({
    corpusChunks, corpusConstraint, primaryAuthors, knowledgeUnitLines,
    structuralEdgeLines, sectionConstraints, subsections, primaryUnderCoverage,
    seenIds, options,
  });
}

// =============================================================================
// INTERNAL HELPERS
// =============================================================================

function buildResult(args: {
  corpusChunks: ContextChunk[];
  corpusConstraint: CorpusConstraint | null;
  primaryAuthors: string[];
  knowledgeUnitLines: string[];
  structuralEdgeLines: string[];
  sectionConstraints: string[];
  subsections: string[];
  primaryUnderCoverage: string[] | undefined;
  seenIds: Set<string>;
  options: RetrievalStageOptions;
}): RetrievalResult {
  const { corpusChunks, options } = args;
  const length = options.length ?? 'medium';

  const citations = corpusChunks.map(chunk =>
    `${chunk.metadata.author} (${chunk.metadata.year}), p.${chunk.metadata.page_start}`
  );
  const corpusContextInfo = {
    used: corpusChunks.length > 0,
    chunkCount: corpusChunks.length,
    collections: options.corpusCollections || [],
    citations: Array.from(new Set(citations)),
  };

  const wordTarget = length === 'comprehensive' || (!length && options.whitelistMode) ? '3,000-3,500' :
                length === 'long' ? '2,000-2,500' :
                length === 'medium' ? '1,500-2,000' : '800-1,000';

  return {
    chunks: corpusChunks,
    corpusConstraint: args.corpusConstraint,
    corpusContextInfo,
    primaryAuthors: args.primaryAuthors,
    knowledgeUnits: args.knowledgeUnitLines,
    structuralEdges: args.structuralEdgeLines,
    stylePrompt: '', // Set by caller (style profile loading is not part of retrieval)
    sectionConstraints: args.sectionConstraints,
    subsections: args.subsections,
    wordTarget,
    seenIds: args.seenIds,
    primaryUnderCoverage: args.primaryUnderCoverage,
  };
}
