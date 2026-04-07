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
import { readFile } from 'node:fs/promises';
import * as path from 'node:path';
import { loadKnowledgeUnitsSync, loadReasoningEdgesSync } from '../../shared/jsonl-loaders.js';
import type { ContextChunk, RetrievalOptions } from '../../retrieval/types.js';
import type { CorpusConstraint, CorpusSource } from '../../core/writing/index.js';
import { buildCorpusConstraint } from '../../core/writing/index.js';
import type { SmartRetrievalLayer } from '../../retrieval/smart-retrieval-layer.js';
import type { RetrievalResult } from './stage-types.js';
import type { PipelineContext } from './stage-types.js';
import { recordDegraded, recordWarning } from './stage-types.js';
import { loadCorpusIndexContext, expandQueryWithOntology, getCompiledIndex } from '../corpus-index-provider.js';
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
  /** Explicit word target override (e.g., '500-1000'). Takes precedence over length-derived default. */
  wordTarget?: string;
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
  let ontologyLines: string[] = [];
  let hookLines: string[] = [];
  let tensionLines: string[] = [];
  let sectionConstraints: string[] = [];
  let subsections: string[] = [];
  let primaryUnderCoverage: string[] | undefined;
  const seenIds = new Set<string>();

  if (!options.whitelistMode) {
    // Non-whitelist mode: return empty retrieval result
    return buildResult({
      corpusChunks, corpusConstraint, primaryAuthors, knowledgeUnitLines,
      structuralEdgeLines, ontologyLines: [], hookLines: [], tensionLines: [],
      sectionConstraints, subsections, primaryUnderCoverage,
      seenIds, options,
    });
  }

  goldLog('Multi-query retrieval + style + single-shot generation...');

  try {
    // ===== Phase 1a: Multi-query semantic retrieval =====
    subsections = deps.extractSemanticRetrievalQueries(topic);

    // Hybrid query expansion via corpus ontology
    let ontologyKeywordTerms: string[] = [];
    try {
      const compiledIdx = getCompiledIndex();
      if (compiledIdx) {
        for (let i = 0; i < subsections.length; i++) {
          const expansion = expandQueryWithOntology(subsections[i], compiledIdx.ontologyNodes);
          if (expansion.semanticTerms.length > 0) {
            subsections[i] = `${subsections[i]} ${expansion.semanticTerms.join(' ')}`;
            goldLog(`Query expanded: added ${expansion.semanticTerms.join(', ')}`);
          }
          ontologyKeywordTerms.push(...expansion.keywordTerms);
        }
        ontologyKeywordTerms = [...new Set(ontologyKeywordTerms)];
      }
    } catch { /* query expansion is non-critical */ }

    const targetChunks = options.corpusChunkCount ?? GOLD_STANDARD_CONFIG.targetChunks;
    const retrievalOpts: RetrievalOptions = {
      collections: options.corpusCollections || [],
      minRelevance: options.corpusMinRelevance ?? 0.0,
      diversityBoost: true,
      rerank: true,
      boostWithKG: true,
      maxHops: 2,
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

      // Supplemental keyword search for Greek/German terms from ontology
      if (ontologyKeywordTerms.length > 0 && deps.smartRetrieval) {
        for (const term of ontologyKeywordTerms.slice(0, 5)) {
          try {
            const kwChunks = await deps.smartRetrieval.retrieveContext(term, {
              ...retrievalOpts, maxChunks: 3,
            });
            kwChunks.forEach(c => {
              const id = c.metadata.chunk_id || `${c.metadata.source_id}:${c.metadata.page_start}`;
              if (!seenIds.has(id)) {
                c.relevanceScore = 0.85;
              }
            });
            addChunks(kwChunks);
            if (kwChunks.length > 0) goldLog(`Keyword expansion: "${term}" → ${kwChunks.length} chunks`);
          } catch { /* non-critical */ }
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

    // ===== Knowledge units (Zod-validated via shared loader) =====
    try {
      const allKUs = loadKnowledgeUnitsSync();
      if (allKUs.length > 0) {
        const topicLower = topic.toLowerCase();
        const domainKeywords = getDomainKeywords(loadDomainConfig());
        const relevantDomains = domainKeywords.filter(d => topicLower.includes(d));

        // Path 1: domain keyword match (existing)
        const relevantByKeyword = allKUs.filter((ku: any) =>
          relevantDomains.some(d => (ku.claim || ku.content || '').toLowerCase().includes(d))
        );

        // Path 2: domain label match (NEW)
        const primaryAuthorsLower = primaryAuthors.map(a => a.toLowerCase());
        const relevantByDomain = allKUs.filter((ku: any) => {
          const dom = (ku as any).domain || '';
          const domLower = dom.toLowerCase();
          return primaryAuthorsLower.some(a =>
            domLower.includes(a.split(',')[0].trim()) || a.includes(domLower.split('_')[0])
          );
        });

        // Merge and deduplicate
        const seenKuIds = new Set<string>();
        const allRelevant = [...relevantByKeyword, ...relevantByDomain].filter((ku: any) => {
          const id = ku.id || ku.claim;
          if (seenKuIds.has(id)) return false;
          seenKuIds.add(id);
          return true;
        });

        knowledgeUnitLines = (allRelevant.length > 0 ? allRelevant : allKUs)
          .slice(0, 15)
          .map((ku: any) => `- ${ku.claim || ku.content} (${ku.source || 'corpus'})`);

        // Pre-flight KU domain coverage check
        if (primaryAuthors.length > 0) {
          const domainCounts = new Map<string, number>();
          for (const ku of allKUs) {
            const d = (ku as any).domain || 'unknown';
            domainCounts.set(d, (domainCounts.get(d) || 0) + 1);
          }
          for (const author of primaryAuthors) {
            const authorLower = author.toLowerCase().split(',')[0].trim();
            const matchingDomain = [...domainCounts.entries()].find(([d]) =>
              d.toLowerCase().includes(authorLower) || authorLower.includes(d.split('_')[0])
            );
            const count = matchingDomain ? matchingDomain[1] : 0;
            if (count < 5) {
              console.error(
                `[retrieval] ⚠ Domain '${matchingDomain?.[0] || authorLower}' has critically low ` +
                `KU coverage (${count} unit${count !== 1 ? 's' : ''}). ` +
                `Run 'god-learn update --query "<${authorLower} concept>"' to improve quality.`
              );
              recordWarning(ctx, 'retrieval',
                `Low KU coverage for ${author}: ${count} units (recommend ≥20)`
              );
            }
          }
        }
      }
    } catch (e) {
      recordWarning(ctx, 'retrieval', `Knowledge unit loading failed: ${e}`);
    }

    // ===== Structural reasoning edges (Zod-validated via shared loader) =====
    try {
      const allEdges = loadReasoningEdgesSync();
      if (allEdges.length > 0) {
        const topicTerms = topic.toLowerCase().split(/\s+/).filter(t => t.length > 3);
        const relevantEdges = allEdges.filter((e: any) => {
          const src = (e.source || '').toLowerCase();
          const tgt = (e.target || '').toLowerCase();
          if (!src && !tgt) return false;
          return topicTerms.some(t => (src && src.includes(t)) || (tgt && tgt.includes(t)) || (src && t.includes(src)) || (tgt && t.includes(tgt)));
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

    // ===== Corpus index context =====
    try {
      const corpusCtx = loadCorpusIndexContext(topic, {
        maxOntologyNodes: 12,
        maxHooks: 3,
        maxTensionEdges: 5,
      });
      ontologyLines = corpusCtx.ontologyLines;
      hookLines = corpusCtx.hookLines;
      tensionLines = corpusCtx.tensionLines;
      if (ontologyLines.length > 0 || hookLines.length > 0 || tensionLines.length > 0) {
        goldLog(`Corpus index: ${ontologyLines.length} nodes, ${hookLines.length} hooks, ${tensionLines.length} tensions`);
      }
    } catch (e) {
      recordWarning(ctx, 'retrieval', `Corpus index loading failed: ${e}`);
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
    structuralEdgeLines, ontologyLines, hookLines, tensionLines,
    sectionConstraints, subsections, primaryUnderCoverage,
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
  ontologyLines: string[];
  hookLines: string[];
  tensionLines: string[];
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

  // Explicit --word-target overrides the length-derived default
  const wordTarget = options.wordTarget
    ? options.wordTarget
    : length === 'comprehensive' || (!length && options.whitelistMode) ? '3,000-3,500' :
      length === 'long' ? '2,000-2,500' :
      length === 'medium' ? '1,500-2,000' : '800-1,000';

  return {
    chunks: corpusChunks,
    corpusConstraint: args.corpusConstraint,
    corpusContextInfo,
    primaryAuthors: args.primaryAuthors,
    knowledgeUnits: args.knowledgeUnitLines,
    structuralEdges: args.structuralEdgeLines,
    ontologyLines: args.ontologyLines,
    hookLines: args.hookLines,
    tensionLines: args.tensionLines,
    stylePrompt: '', // Set by caller (style profile loading is not part of retrieval)
    sectionConstraints: args.sectionConstraints,
    subsections: args.subsections,
    wordTarget,
    seenIds: args.seenIds,
    primaryUnderCoverage: args.primaryUnderCoverage,
  };
}
