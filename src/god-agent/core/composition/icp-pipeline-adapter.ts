/**
 * ICP Pipeline Adapter — composes god-write CLI utilities for dashboard use.
 *
 * This adapter does NOT modify any existing god-write files. It imports their
 * exported utilities and re-implements private WritePipelineOrchestrator methods
 * as standalone exported functions.
 *
 * Re-implemented (private on WritePipelineOrchestrator):
 *   - investigateV1()
 *   - trimChunkContent()
 *   - reorderChunksForAttention()
 *   - enforceSourceDiversity()
 *   - validateRetrievalCoverage()
 *
 * @module icp-pipeline-adapter
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';

import type { ContextChunk } from '../../retrieval/types.js';
import type {
  ICPSession,
  QualityGateResults,
} from './icp-types.js';
import type { CorpusConstraint } from '../writing/writing-generator.js';
import type { ModelRouterConfig } from './model-router.js';
import type { DomainConfig } from '../../universal/domain-config.js';
// Type-only imports not needed — function signatures handle typing internally

import { GOLD_STANDARD_CONFIG } from '../../universal/gold-standard-config.js';
import {
  buildRollingContextSectionPrompt,
  buildGoldStandardPrompt,
  assignSourcesToSections,
  buildGoldStandardChunkBlock,
} from '../../universal/gold-standard-prompt-builder.js';
import {
  scrubNonCorpusAuthors,
  stripBareApaParentheticals,
  buildCorpusSourcesFromChunks,
} from '../../universal/author-scrubber.js';
import {
  loadDomainConfig,
  buildAuthorPattern,
  buildConceptPattern,
} from '../../universal/domain-config.js';
import { stripEndnoteLeaks } from '../../universal/quality-integration.js';
import { ProseSanitizer } from '../../cli/composition/prose-sanitizer.js';
import { SmartRetrievalLayer } from '../../retrieval/smart-retrieval-layer.js';
import { ModelRouter } from './model-router.js';
import { emitSessionEvent } from './icp-types.js';

// Re-export for consumer convenience
export type { ContextChunk };
export { GOLD_STANDARD_CONFIG };

// =============================================================================
// INTERFACES
// =============================================================================

export interface ICPAdapterConfig {
  multiStepDrafting: boolean;
  rollingContext: boolean;
  chunkOptimization: boolean;
  kgBoosting: boolean;
  knowledgeUnits: boolean;
  structuralEdges: boolean;
  authorScrubbing: boolean;
  conclusionSummaries: boolean;
  inlineValidation: boolean;
  qualityGauntlet: boolean;
  revisionLoop: boolean;
  pageContextExpansion: boolean;
  groundingStrictness: 'strict' | 'moderate' | 'permissive';
  costTier: 'high' | 'low';
  // Advanced settings (from GOLD_STANDARD_CONFIG defaults)
  chunkTrimTarget: number;
  sharedPoolSize: number;
  rollingContextWindowSize: number;
  sectionWordTarget: number;
  conclusionWordTarget: number;
  maxChunksPerSource: number;
  relevanceFloor: number;
  overCitationThreshold: number;
  tokenBudgetCeiling: number;
  downgradeTokenTrigger: number;
}

export interface InvestigationResult {
  issues: Array<{ type: string; severity: 'critical' | 'major' | 'minor'; detail: string }>;
  preventionPlan: {
    blacklistedAuthors: string[];
    strengthenedConstraints: string[];
    underCitedSources: string[];
    overCitedSources: string[];
  };
  stats: {
    wordCount: number;
    sectionCount: number;
    citationCount: number;
    quotationCount: number;
    claimsWithoutCitation: number;
    factualClaimsWithoutCitation: number;
    interpretiveClaimsWithoutCitation: number;
    uniqueAuthors: string[];
    sectionWordCounts: Array<{ heading: string; words: number }>;
  };
}

export interface CostEstimate {
  stages: Array<{ name: string; estimatedTokens: number; estimatedCost: number }>;
  totalTokens: number;
  totalCost: number;
  model: string;
}

export interface CitationTracker {
  authorsCitedSoFar: string[];
  authorsNotYetCited: string[];
  authorCitationCounts: Record<string, number>;
  totalCitationCount: number;
  totalQuotationCount: number;
}

export type PipelinePhase =
  | 'CREATED'
  | 'DECOMPOSED'
  | 'RETRIEVED'
  | 'VERIFIED'
  | 'BOUND'
  | 'GENERATED'
  | 'PARTIALLY_GENERATED'
  | 'INVESTIGATED'
  | 'REGENERATED'
  | 'VALIDATED'
  | 'EXPORTED';

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

export function getDefaultAdapterConfig(): ICPAdapterConfig {
  return {
    multiStepDrafting: true,
    rollingContext: true,
    chunkOptimization: true,
    kgBoosting: false,
    knowledgeUnits: true,
    structuralEdges: true,
    authorScrubbing: true,
    conclusionSummaries: true,
    inlineValidation: false,
    qualityGauntlet: false,
    revisionLoop: false,
    pageContextExpansion: false,
    groundingStrictness: 'strict',
    costTier: 'high',
    chunkTrimTarget: GOLD_STANDARD_CONFIG.chunkTrimTarget,
    sharedPoolSize: GOLD_STANDARD_CONFIG.rollingContextSharedPoolSize,
    rollingContextWindowSize: GOLD_STANDARD_CONFIG.rollingContextWindowSize,
    sectionWordTarget: GOLD_STANDARD_CONFIG.rollingContextSectionWords,
    conclusionWordTarget: GOLD_STANDARD_CONFIG.rollingContextConclusionWords,
    maxChunksPerSource: GOLD_STANDARD_CONFIG.maxChunksPerSource,
    relevanceFloor: GOLD_STANDARD_CONFIG.relevanceFloor,
    overCitationThreshold: GOLD_STANDARD_CONFIG.overCitationThreshold,
    tokenBudgetCeiling: 12000,
    downgradeTokenTrigger: 10500,
  };
}

// =============================================================================
// RE-IMPLEMENTED PRIVATE METHODS (standalone exported functions)
// =============================================================================

/**
 * Investigate v1 output for faithfulness issues using local string analysis only.
 * Returns a structured investigation result with issues and a prevention plan.
 * Cost: ~0ms (no LLM calls). All checks are regex/string-based.
 *
 * Re-implemented from WritePipelineOrchestrator.investigateV1 (lines 1404-1645).
 */
export function investigateV1(
  v1Content: string,
  chunks: ContextChunk[],
  manifestAuthors: string[],
): InvestigationResult {
  const issues: Array<{ type: string; severity: 'critical' | 'major' | 'minor'; detail: string }> = [];
  const mainText = v1Content.split(/^#+ *validation appendix/im)[0] || v1Content;
  const words = mainText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // --- Citation extraction ---
  const citationPattern = /\(([^)]+?,\s*\*[^*]+\*[^)]*)\)|(?:As\s+|According\s+to\s+)(\w[\w\s]*?)\s+(?:observes|argues|maintains|suggests|notes|contends|emphasizes|demonstrates)\s+in\s+\*([^*]+)\*/gi;
  const rawCitations: Array<{ author: string; raw: string }> = [];
  let match: RegExpExecArray | null;
  const citRegex = new RegExp(citationPattern.source, citationPattern.flags);
  while ((match = citRegex.exec(mainText)) !== null) {
    const raw = match[0];
    const author = (match[1] || match[2] || '').split(',')[0].trim();
    if (author) rawCitations.push({ author, raw });
  }

  // --- Quotation extraction ---
  const quotations: string[] = [];
  const quoteRegex = /[""\u201c]([^""\u201d]{15,})[""\u201d]/g;
  while ((match = quoteRegex.exec(mainText)) !== null) {
    quotations.push(match[1]);
  }

  // --- Section analysis ---
  const sectionRegex = /^#{1,3}\s+\d*\.?\s*(.+)$/gm;
  const sectionHeadings: Array<{ heading: string; startIdx: number }> = [];
  while ((match = sectionRegex.exec(mainText)) !== null) {
    sectionHeadings.push({ heading: match[1].trim(), startIdx: match.index });
  }
  const sectionWordCounts: Array<{ heading: string; words: number }> = [];
  for (let i = 0; i < sectionHeadings.length; i++) {
    const start = sectionHeadings[i].startIdx;
    const end = i + 1 < sectionHeadings.length ? sectionHeadings[i + 1].startIdx : mainText.length;
    const sectionText = mainText.substring(start, end);
    const sectionWords = sectionText.trim().split(/\s+/).filter(Boolean).length;
    sectionWordCounts.push({ heading: sectionHeadings[i].heading, words: sectionWords });
  }

  // --- Build manifest author set (normalized, diacritics stripped) ---
  const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const manifestAuthorSet = new Set(manifestAuthors.map(a => stripDiacritics(a.toLowerCase().trim())));
  const chunkAuthorSet = new Set(
    chunks.map(c => stripDiacritics((c.metadata.author || '').toLowerCase().trim())).filter(Boolean),
  );

  // --- Check 1: Citations whose author is not in manifest ---
  const citedAuthors = new Set<string>();
  const hallucinated: string[] = [];
  for (const cit of rawCitations) {
    const authorLower = stripDiacritics(cit.author.toLowerCase().trim());
    citedAuthors.add(authorLower);
    const inManifest = [...manifestAuthorSet].some(ma => ma.includes(authorLower) || authorLower.includes(ma));
    const inChunks = [...chunkAuthorSet].some(ca => ca.includes(authorLower) || authorLower.includes(ca));
    if (!inManifest && !inChunks) {
      hallucinated.push(cit.author);
      issues.push({
        type: 'hallucinated-citation',
        severity: 'critical',
        detail: `Author "${cit.author}" not found in corpus manifest or retrieved chunks: ${cit.raw.substring(0, 80)}`,
      });
    }
  }

  // --- Check 2: Quotations not found verbatim in any chunk ---
  for (const quote of quotations) {
    const normalizedQuote = quote.replace(/\s+/g, ' ').toLowerCase().trim();
    const foundInChunk = chunks.some(c => {
      const normalizedContent = (c.content || '').replace(/\s+/g, ' ').toLowerCase();
      if (normalizedContent.includes(normalizedQuote)) return true;
      if (normalizedQuote.length > 40) {
        const prefix = normalizedQuote.substring(0, 40);
        return normalizedContent.includes(prefix);
      }
      return false;
    });
    if (!foundInChunk) {
      issues.push({
        type: 'phantom-quotation',
        severity: 'critical',
        detail: `Quotation not found in any chunk: "${quote.substring(0, 60)}..."`,
      });
    }
  }

  // --- Check 3: Claims without nearby citation (factual vs interpretive split) ---
  let factualClaimsWithoutCitation = 0;
  let interpretiveClaimsWithoutCitation = 0;
  const sentences = mainText.split(/(?<=[.!?])\s+(?=[A-Z""\u201c])/);
  const factualPattern = /\b(?:defines?|is defined as|states? that|argues? that|maintains? that|contends? that|asserts? that|according to \w|as \w+ (?:observes?|notes?|argues?|maintains?|suggests?|claims?))\b/i;
  const interpretivePattern = /^\s*(?:thus|accordingly|hence|therefore|this suggests|it follows|in this sense|consequently|in other words)\b/i;
  for (const sentence of sentences) {
    const sentenceWords = sentence.trim().split(/\s+/).length;
    if (sentenceWords > 20) {
      const idx = mainText.indexOf(sentence);
      const window = mainText.substring(idx, idx + sentence.length + 200);
      const hasCitation = /\([^)]*,\s*\*[^*]+\*[^)]*\)/.test(window) ||
        /(?:As|According to)\s+\w/.test(sentence);
      if (!hasCitation) {
        if (factualPattern.test(sentence)) {
          factualClaimsWithoutCitation++;
          issues.push({
            type: 'uncited-factual-claim',
            severity: 'major',
            detail: `Factual claim without citation: "${sentence.substring(0, 60)}..."`,
          });
        } else if (!interpretivePattern.test(sentence)) {
          interpretiveClaimsWithoutCitation++;
          issues.push({
            type: 'uncited-claim',
            severity: 'minor',
            detail: `Long sentence without nearby citation: "${sentence.substring(0, 60)}..."`,
          });
        }
      }
    }
  }
  const claimsWithoutCitation = factualClaimsWithoutCitation + interpretiveClaimsWithoutCitation;

  // --- Check 4: Source balance ---
  const authorCitationCounts = new Map<string, number>();
  for (const cit of rawCitations) {
    const key = cit.author.toLowerCase();
    authorCitationCounts.set(key, (authorCitationCounts.get(key) || 0) + 1);
  }
  const totalCitations = rawCitations.length;
  const overCited: string[] = [];
  const underCited: string[] = [];
  for (const [author, count] of authorCitationCounts) {
    if (totalCitations > 0 && count / totalCitations > GOLD_STANDARD_CONFIG.overCitationThreshold) {
      overCited.push(author);
      issues.push({
        type: 'over-cited-source',
        severity: 'major',
        detail: `"${author}" accounts for ${count}/${totalCitations} citations (${((count / totalCitations) * 100).toFixed(0)}%)`,
      });
    }
  }
  for (const chunkAuthor of chunkAuthorSet) {
    if (!citedAuthors.has(chunkAuthor) && chunkAuthor !== 'unknown') {
      underCited.push(chunkAuthor);
      issues.push({
        type: 'under-cited-source',
        severity: 'minor',
        detail: `Chunk author "${chunkAuthor}" has 0 citations despite being in retrieved set`,
      });
    }
  }

  // --- Check 5: Section word counts ---
  for (const section of sectionWordCounts) {
    if (section.words < GOLD_STANDARD_CONFIG.minSectionWords) {
      issues.push({
        type: 'short-section',
        severity: 'major',
        detail: `Section "${section.heading}" has only ${section.words} words (minimum: ${GOLD_STANDARD_CONFIG.minSectionWords})`,
      });
    }
  }

  // --- Check 6: Overall word count ---
  if (wordCount < 2500) {
    issues.push({
      type: 'insufficient-word-count',
      severity: 'major',
      detail: `Main text is only ${wordCount} words (target: 3,000-3,500)`,
    });
  }

  // --- Build prevention plan ---
  const uniqueHallucinated = [...new Set(hallucinated)];
  const strengthened: string[] = [];
  if (uniqueHallucinated.length > 0) {
    strengthened.push(`Do NOT cite the following authors/works (they are NOT in your corpus): ${uniqueHallucinated.join(', ')}`);
  }
  if (issues.some(i => i.type === 'phantom-quotation')) {
    strengthened.push('EVERY quotation in quotation marks MUST appear VERBATIM in a corpus chunk. If unsure, paraphrase instead.');
  }
  if (issues.some(i => i.type === 'insufficient-word-count')) {
    strengthened.push(`Write AT LEAST 3,000 words of main text. Current v1 was only ${wordCount} words.`);
  }
  for (const section of sectionWordCounts) {
    if (section.words < GOLD_STANDARD_CONFIG.minSectionWords) {
      strengthened.push(`Section "${section.heading}" MUST be at least ${GOLD_STANDARD_CONFIG.minSectionWords} words (was ${section.words} in v1).`);
    }
  }
  if (underCited.length > 0) {
    strengthened.push(`Deliberately cite these under-represented sources: ${underCited.slice(0, 5).join(', ')}`);
  }
  if (factualClaimsWithoutCitation > 0) {
    strengthened.push(`${factualClaimsWithoutCitation} factual attributions lacked citations in v1. Every "X argues/defines/states" sentence MUST include a citation.`);
  }

  return {
    issues,
    preventionPlan: {
      blacklistedAuthors: uniqueHallucinated,
      strengthenedConstraints: strengthened,
      underCitedSources: underCited,
      overCitedSources: overCited,
    },
    stats: {
      wordCount,
      sectionCount: sectionHeadings.length,
      citationCount: totalCitations,
      quotationCount: quotations.length,
      claimsWithoutCitation,
      factualClaimsWithoutCitation,
      interpretiveClaimsWithoutCitation,
      uniqueAuthors: [...citedAuthors],
      sectionWordCounts,
    },
  };
}

/**
 * Trim a chunk's content to ~targetChars while preserving the most valuable parts:
 * 1. Sentences containing direct quotations (text in quotation marks)
 * 2. Sentences with page references or citation markers
 * 3. Argument-dense sentences (philosophical key terms)
 * 4. Remove OCR artifacts, headers, boilerplate
 *
 * Re-implemented from WritePipelineOrchestrator.trimChunkContent (lines 545-602).
 */
export function trimChunkContent(
  content: string,
  targetChars: number = GOLD_STANDARD_CONFIG.chunkTrimTarget,
): string {
  if (content.length <= targetChars) return content;

  const sentences = content
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z""\u201c])/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (sentences.length === 0) return content.substring(0, targetChars);

  const conceptPattern = buildConceptPattern(loadDomainConfig());
  const scored = sentences.map((s, idx) => {
    let score = 0;
    if (/[""\u201c\u201d]/.test(s)) score += 3;
    if (/\bp\.?\s*\d|pp\.\s*\d/i.test(s)) score += 2;
    const termMatches = s.match(conceptPattern);
    if (termMatches) score += Math.min(termMatches.length, 3);
    if (/\b(argues|observes|maintains|contends|suggests|demonstrates|emphasizes|notes)\b/i.test(s)) score += 1;
    if (/^[A-Z\s]{10,}$/.test(s)) score -= 5;
    if (/^\d+\s*$/.test(s)) score -= 5;
    if (/^(chapter|section|part)\s+\d/i.test(s)) score -= 3;
    return { sentence: s, score, originalIdx: idx };
  });

  scored.sort((a, b) => b.score - a.score);

  const selected: { sentence: string; score: number; originalIdx: number }[] = [];
  let currentLength = 0;

  for (const item of scored) {
    if (currentLength + item.sentence.length + 1 > targetChars) {
      if (selected.length === 0) {
        selected.push({ ...item, sentence: item.sentence.substring(0, targetChars) });
      }
      break;
    }
    selected.push(item);
    currentLength += item.sentence.length + 1;
  }

  selected.sort((a, b) => a.originalIdx - b.originalIdx);

  return selected.map(s => s.sentence).join(' ');
}

/**
 * Reorder chunks to mitigate the "lost in the middle" effect.
 * Places highest-relevance chunks at start and end, medium in middle.
 *
 * Re-implemented from WritePipelineOrchestrator.reorderChunksForAttention (lines 612-627).
 */
export function reorderChunksForAttention(chunks: ContextChunk[]): ContextChunk[] {
  if (chunks.length <= 3) return chunks;

  const sorted = [...chunks].sort((a, b) => b.relevanceScore - a.relevanceScore);

  const third = Math.ceil(sorted.length / 3);
  const top = sorted.slice(0, third);
  const mid = sorted.slice(third, third * 2);
  const bottom = sorted.slice(third * 2);

  return [...top, ...bottom, ...mid];
}

/**
 * Enforce source diversity in retrieved chunks.
 * Relevance-first selection with per-work cap (author|title key).
 *
 * Re-implemented from WritePipelineOrchestrator.enforceSourceDiversity (lines 482-520).
 */
export function enforceSourceDiversity(
  chunks: ContextChunk[],
  options: { maxPerSource?: number; targetTotal?: number } = {},
): ContextChunk[] {
  const maxPerSource = options.maxPerSource ?? GOLD_STANDARD_CONFIG.maxChunksPerSource;
  const targetTotal = options.targetTotal ?? GOLD_STANDARD_CONFIG.targetTotalChunks;

  const sorted = [...chunks].sort((a, b) => b.relevanceScore - a.relevanceScore);

  const workCounts = new Map<string, number>();
  const result: ContextChunk[] = [];

  for (const chunk of sorted) {
    if (result.length >= targetTotal) break;
    const workKey = `${chunk.metadata.author || 'Unknown'}|${chunk.metadata.title || 'Unknown'}`;
    const count = workCounts.get(workKey) || 0;
    if (count < maxPerSource) {
      result.push(chunk);
      workCounts.set(workKey, count + 1);
    }
  }

  if (result.length < targetTotal) {
    const resultIds = new Set(result.map(c => c.chunkId || `${c.metadata.author}:${c.metadata.page_start}`));
    for (const chunk of sorted) {
      if (result.length >= targetTotal) break;
      const id = chunk.chunkId || `${chunk.metadata.author}:${chunk.metadata.page_start}`;
      if (!resultIds.has(id)) {
        result.push(chunk);
      }
    }
  }

  return result;
}

/**
 * Validate retrieval coverage: check that key authors mentioned in the topic
 * have sufficient chunks in the retrieved set.
 *
 * Re-implemented from WritePipelineOrchestrator.validateRetrievalCoverage (lines 1651-1693).
 */
export function validateRetrievalCoverage(
  topic: string,
  chunks: ContextChunk[],
  minChunksPerAuthor: number = 2,
): { missingAuthors: string[]; weakAuthors: string[]; coverageReport: string[] } {
  const authorPattern = buildAuthorPattern(loadDomainConfig());
  const topicAuthors = new Set<string>();
  for (const m of Array.from(topic.matchAll(authorPattern))) {
    topicAuthors.add(m[0].charAt(0).toUpperCase() + m[0].slice(1).toLowerCase());
  }

  const chunkCounts = new Map<string, number>();
  for (const chunk of chunks) {
    const author = (chunk.metadata.author || '').toLowerCase().trim();
    if (author) chunkCounts.set(author, (chunkCounts.get(author) || 0) + 1);
  }

  const missingAuthors: string[] = [];
  const weakAuthors: string[] = [];
  const coverageReport: string[] = [];

  for (const author of topicAuthors) {
    const authorLower = author.toLowerCase();
    const matchingCount = [...chunkCounts.entries()]
      .filter(([ca]) => ca.includes(authorLower) || authorLower.includes(ca))
      .reduce((sum, [, count]) => sum + count, 0);

    if (matchingCount === 0) {
      missingAuthors.push(author);
      coverageReport.push(`  MISSING ${author}: 0 chunks (will attempt targeted retrieval)`);
    } else if (matchingCount < minChunksPerAuthor) {
      weakAuthors.push(author);
      coverageReport.push(`  WEAK ${author}: ${matchingCount} chunk(s) (min: ${minChunksPerAuthor})`);
    } else {
      coverageReport.push(`  OK ${author}: ${matchingCount} chunks`);
    }
  }

  return { missingAuthors, weakAuthors, coverageReport };
}

// =============================================================================
// MANIFEST / KNOWLEDGE UNIT / EDGE LOADERS
// =============================================================================

interface ManifestEntry {
  author?: string;
  title?: string;
  year?: number;
  docId?: string;
  [key: string]: unknown;
}

/**
 * Load manifest.jsonl line by line. Returns a Map<docId, entry>.
 * Caches for 60 seconds.
 */
async function loadManifest(
  cache: { data: Map<string, ManifestEntry>; timestamp: number } | null,
): Promise<{ data: Map<string, ManifestEntry>; timestamp: number }> {
  if (cache && Date.now() - cache.timestamp < 60_000) {
    return cache;
  }

  const manifestPath = path.join(process.cwd(), 'scripts', 'ingest', 'manifest.jsonl');
  const data = new Map<string, ManifestEntry>();

  try {
    const fileStream = fs.createReadStream(manifestPath, 'utf-8');
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    for await (const line of rl) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const entry = JSON.parse(trimmed) as ManifestEntry;
        const id = (entry.docId as string) || `${entry.author}_${entry.title}`;
        data.set(id, entry);
      } catch {
        // Skip malformed lines
      }
    }
  } catch {
    process.stderr.write(`[ICPAdapter] Could not load manifest from ${manifestPath}\n`);
  }

  return { data, timestamp: Date.now() };
}

/**
 * Load knowledge units from god-learn/knowledge.jsonl.
 */
function loadKnowledgeUnits(): string[] {
  const kuPath = path.join(process.cwd(), 'god-learn', 'knowledge.jsonl');
  try {
    const raw = fs.readFileSync(kuPath, 'utf-8');
    const lines = raw.split('\n').filter(l => l.trim());
    return lines.map(line => {
      try {
        const ku = JSON.parse(line);
        return `KU-${ku.id || '?'}: ${ku.claim || ku.summary || JSON.stringify(ku)}`;
      } catch {
        return line;
      }
    });
  } catch {
    return [];
  }
}

/**
 * Load structural edges from god-reason/reasoning.jsonl.
 */
function loadStructuralEdges(): string[] {
  const edgePath = path.join(process.cwd(), 'god-reason', 'reasoning.jsonl');
  try {
    const raw = fs.readFileSync(edgePath, 'utf-8');
    const lines = raw.split('\n').filter(l => l.trim());
    // Only return high-confidence edges
    const edges: string[] = [];
    for (const line of lines) {
      try {
        const edge = JSON.parse(line);
        if ((edge.confidence ?? edge.score ?? 1) >= 0.6) {
          const label = edge.relation || edge.type || 'relates-to';
          edges.push(`${edge.source || '?'} --[${label}]--> ${edge.target || '?'}`);
        }
      } catch {
        // Skip malformed
      }
    }
    return edges;
  } catch {
    return [];
  }
}

// =============================================================================
// GROUNDING CONSTRAINTS
// =============================================================================

function buildGroundingConstraints(
  strictness: 'strict' | 'moderate' | 'permissive',
  chunks: ContextChunk[],
  preventionPlan?: InvestigationResult['preventionPlan'],
): string {
  const uniqueAuthors = new Set(chunks.map(c => c.metadata.author || 'Unknown'));
  const authorList = [...uniqueAuthors].join(', ');

  let block = `## CRITICAL CONSTRAINTS\n\n`;

  if (strictness === 'strict') {
    block += `### ZERO-TOLERANCE Grounding Rules\n`;
    block += `- ONLY quote and cite from the corpus chunks below.\n`;
    block += `- NEVER introduce any author names not in the corpus chunks.\n`;
    block += `- NEVER fabricate quotations — every quoted string MUST appear verbatim in a chunk.\n`;
    block += `- Every non-trivial claim MUST be backed by a citation.\n`;
    block += `- Available corpus authors: ${authorList}\n`;
  } else if (strictness === 'moderate') {
    block += `### Grounding Rules\n`;
    block += `- Prefer citations from the corpus chunks below.\n`;
    block += `- Do not introduce authors not in the corpus without strong justification.\n`;
    block += `- Every factual claim should be backed by a citation.\n`;
    block += `- Available corpus authors: ${authorList}\n`;
  } else {
    block += `### Grounding Guidelines\n`;
    block += `- Use the corpus chunks below as primary sources.\n`;
    block += `- Additional scholarly references are acceptable if clearly marked.\n`;
    block += `- Available corpus authors: ${authorList}\n`;
  }

  if (preventionPlan?.blacklistedAuthors?.length) {
    block += `\n**BLACKLISTED AUTHORS (DO NOT CITE):** ${preventionPlan.blacklistedAuthors.join(', ')}\n`;
  }
  if (preventionPlan?.strengthenedConstraints?.length) {
    block += `\n**CONSTRAINTS FROM V1 INVESTIGATION:**\n${preventionPlan.strengthenedConstraints.map(c => `- ${c}`).join('\n')}\n`;
  }

  block += `\n### Citation Format\n`;
  block += `- (Author, *Title*, p. X) — MLA-influenced, title in italics\n`;
  block += `- Signal-phrase: As Author observes in *Title*, "quotation" (p. X)\n`;
  block += `- NEVER use APA-style (Author Year)\n`;

  return block;
}

// =============================================================================
// CITATION TRACKING HELPERS
// =============================================================================

function createCitationTracker(chunks: ContextChunk[]): CitationTracker {
  const allAuthors = [...new Set(
    chunks.map(c => c.metadata.author || 'Unknown').filter(a => a !== 'Unknown'),
  )];

  return {
    authorsCitedSoFar: [],
    authorsNotYetCited: [...allAuthors],
    authorCitationCounts: {},
    totalCitationCount: 0,
    totalQuotationCount: 0,
  };
}

function updateCitationTracker(tracker: CitationTracker, sectionText: string): void {
  // Extract citations from section
  const citRegex = /\(([^)]+?,\s*\*[^*]+\*[^)]*)\)|(?:As\s+|According\s+to\s+)(\w[\w\s]*?)\s+(?:observes|argues|maintains|suggests|notes|contends|emphasizes|demonstrates)\s+in\s+\*([^*]+)\*/gi;
  let match: RegExpExecArray | null;

  while ((match = citRegex.exec(sectionText)) !== null) {
    const author = (match[1] || match[2] || '').split(',')[0].trim().toLowerCase();
    if (!author) continue;

    tracker.totalCitationCount++;
    tracker.authorCitationCounts[author] = (tracker.authorCitationCounts[author] || 0) + 1;

    if (!tracker.authorsCitedSoFar.includes(author)) {
      tracker.authorsCitedSoFar.push(author);
      tracker.authorsNotYetCited = tracker.authorsNotYetCited.filter(
        a => a.toLowerCase() !== author,
      );
    }
  }

  // Count quotations
  const quoteRegex = /[""\u201c]([^""\u201d]{15,})[""\u201d]/g;
  while (quoteRegex.exec(sectionText) !== null) {
    tracker.totalQuotationCount++;
  }
}

// =============================================================================
// ICP PIPELINE ADAPTER
// =============================================================================

export class ICPPipelineAdapter {
  private modelRouter: ModelRouter;
  private retrieval: SmartRetrievalLayer;
  private sanitizer: ProseSanitizer;
  private domainConfig: DomainConfig;
  private manifestCache: { data: Map<string, ManifestEntry>; timestamp: number } | null = null;

  constructor(config?: Partial<ModelRouterConfig>) {
    this.modelRouter = new ModelRouter(config);
    this.retrieval = new SmartRetrievalLayer();
    this.sanitizer = new ProseSanitizer();
    this.domainConfig = loadDomainConfig();
  }

  // ---------------------------------------------------------------------------
  // RETRIEVE — populate session.quote_spans with corpus chunks
  // ---------------------------------------------------------------------------

  async retrieve(session: ICPSession, config: ICPAdapterConfig): Promise<void> {
    const topic = session.prompt_spec.original_prompt || (session as any)._topic || '';
    if (!topic) {
      throw new Error('Session has no topic or thesis in prompt_spec');
    }

    // Retrieve chunks via SmartRetrievalLayer
    const rawChunks = await this.retrieval.retrieveContext(topic, {
      maxChunks: GOLD_STANDARD_CONFIG.targetChunks,
      minRelevance: config.relevanceFloor,
    });

    // Apply source diversity
    let chunks = enforceSourceDiversity(rawChunks, {
      maxPerSource: config.maxChunksPerSource,
    });

    // Apply chunk optimization if enabled
    if (config.chunkOptimization) {
      chunks = chunks.map(c => ({
        ...c,
        content: trimChunkContent(c.content, config.chunkTrimTarget),
      }));
      chunks = reorderChunksForAttention(chunks);
    }

    // Validate retrieval coverage
    const coverage = validateRetrievalCoverage(topic, chunks);
    if (coverage.missingAuthors.length > 0) {
      process.stderr.write(
        `[ICPAdapter] Missing authors in retrieval: ${coverage.missingAuthors.join(', ')}\n`,
      );
    }

    // Store chunks as quote_spans on session (adapting ContextChunk to QuoteSpan shape)
    // The adapter stores the raw ContextChunk[] in a transient field for generation
    (session as any)._adapterChunks = chunks;
    (session as any)._coverageReport = coverage;

    emitSessionEvent(session, {
      ts: new Date().toISOString(),
      actor: 'system',
      action: 'retrieve',
      payload_summary: `Retrieved ${chunks.length} chunks from ${new Set(chunks.map(c => c.metadata.author)).size} sources`,
      affected_ids: chunks.map(c => c.chunkId || 'unknown'),
      severity: 'info',
      user_visible: true,
      category: 'evidence',
    });
  }

  // ---------------------------------------------------------------------------
  // GENERATE — produce text via single-pass or rolling context
  // ---------------------------------------------------------------------------

  async generate(
    session: ICPSession,
    config: ICPAdapterConfig,
    wsEmit?: (event: string, data: any) => void,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    const chunks: ContextChunk[] = (session as any)._adapterChunks || [];
    if (chunks.length === 0) {
      throw new Error('No chunks available — run retrieve() first');
    }

    const topic = session.prompt_spec.original_prompt || (session as any)._topic || '';
    const subsections = (session.facets || []).map(f => f.name || f.description || '');
    const stylePrompt = session.style_prompt || '';
    const wordTarget = session.desired_word_count || '3,000-3,500';

    // Load manifest for investigation
    this.manifestCache = await loadManifest(this.manifestCache);
    const manifestAuthors = [...this.manifestCache.data.values()]
      .map(e => e.author || '')
      .filter(Boolean);

    // Load KUs and edges if enabled
    const knowledgeUnits = config.knowledgeUnits ? loadKnowledgeUnits() : [];
    const structuralEdges = config.structuralEdges ? loadStructuralEdges() : [];

    if (config.multiStepDrafting && !config.rollingContext) {
      // --- SINGLE-PASS with multi-step: generate v1, investigate, store ---
      await this.generateSinglePass(
        session, config, topic, subsections, chunks,
        knowledgeUnits, structuralEdges, stylePrompt, wordTarget,
        manifestAuthors, wsEmit,
      );
    } else if (config.rollingContext) {
      // --- ROLLING CONTEXT: section-by-section generation ---
      await this.generateRollingContext(
        session, config, topic, subsections, chunks,
        knowledgeUnits, structuralEdges, stylePrompt,
        manifestAuthors, wsEmit,
      );
    } else {
      // --- BASIC SINGLE-PASS (no investigation) ---
      await this.generateBasic(
        session, config, topic, subsections, chunks,
        knowledgeUnits, structuralEdges, stylePrompt, wordTarget,
        wsEmit,
      );
    }
  }

  private async generateBasic(
    session: ICPSession,
    config: ICPAdapterConfig,
    topic: string,
    subsections: string[],
    chunks: ContextChunk[],
    knowledgeUnits: string[],
    structuralEdges: string[],
    stylePrompt: string,
    wordTarget: string,
    wsEmit?: (event: string, data: any) => void,
  ): Promise<void> {
    const prompt = buildGoldStandardPrompt({
      topic,
      subsections,
      chunks,
      knowledgeUnits,
      structuralEdges,
      stylePrompt,
      wordTarget,
    });

    wsEmit?.('generation-started', { mode: 'single-pass', sectionCount: subsections.length });

    const response = await this.modelRouter.call({
      systemPrompt: buildGroundingConstraints(config.groundingStrictness, chunks),
      userPrompt: prompt,
      maxTokens: GOLD_STANDARD_CONFIG.opusMaxTokens,
      costTier: config.costTier,
    });

    session.generated_text.set('full', response.content);
    (session as any)._pipelinePhase = 'GENERATED' as PipelinePhase;

    emitSessionEvent(session, {
      ts: new Date().toISOString(),
      actor: 'llm',
      action: 'generate',
      payload_summary: `Single-pass generation complete (${response.usage.outputTokens} tokens)`,
      affected_ids: [],
      severity: 'info',
      user_visible: true,
      category: 'generation',
    });

    wsEmit?.('generation-complete', {
      mode: 'single-pass',
      tokens: response.usage.outputTokens,
      wordCount: response.content.split(/\s+/).length,
    });
  }

  private async generateSinglePass(
    session: ICPSession,
    config: ICPAdapterConfig,
    topic: string,
    subsections: string[],
    chunks: ContextChunk[],
    knowledgeUnits: string[],
    structuralEdges: string[],
    stylePrompt: string,
    wordTarget: string,
    manifestAuthors: string[],
    wsEmit?: (event: string, data: any) => void,
  ): Promise<void> {
    // Step 1: Generate v1 draft
    wsEmit?.('generation-started', { mode: 'multi-step', phase: 'v1', sectionCount: subsections.length });

    const prompt = buildGoldStandardPrompt({
      topic,
      subsections,
      chunks,
      knowledgeUnits,
      structuralEdges,
      stylePrompt,
      wordTarget,
    });

    const v1Response = await this.modelRouter.call({
      systemPrompt: buildGroundingConstraints(config.groundingStrictness, chunks),
      userPrompt: prompt,
      maxTokens: GOLD_STANDARD_CONFIG.opusMaxTokens,
      costTier: config.costTier,
    });

    session.generated_text.set('v1', v1Response.content);
    (session as any)._pipelinePhase = 'GENERATED' as PipelinePhase;

    wsEmit?.('generation-v1-complete', {
      tokens: v1Response.usage.outputTokens,
      wordCount: v1Response.content.split(/\s+/).length,
    });

    // Step 2: Investigate v1
    const investigation = investigateV1(v1Response.content, chunks, manifestAuthors);
    (session as any)._investigationResult = investigation;
    (session as any)._pipelinePhase = 'INVESTIGATED' as PipelinePhase;

    emitSessionEvent(session, {
      ts: new Date().toISOString(),
      actor: 'system',
      action: 'generate',
      payload_summary: `V1 investigation: ${investigation.issues.length} issues (${investigation.issues.filter(i => i.severity === 'critical').length} critical)`,
      affected_ids: [],
      severity: investigation.issues.some(i => i.severity === 'critical') ? 'warn' : 'info',
      user_visible: true,
      category: 'generation',
    });

    wsEmit?.('investigation-complete', {
      issueCount: investigation.issues.length,
      criticalCount: investigation.issues.filter(i => i.severity === 'critical').length,
      stats: investigation.stats,
      preventionPlan: investigation.preventionPlan,
    });

    // Store v1 as full output (regenerateV2 replaces if called)
    session.generated_text.set('full', v1Response.content);
  }

  private async generateRollingContext(
    session: ICPSession,
    config: ICPAdapterConfig,
    topic: string,
    subsections: string[],
    chunks: ContextChunk[],
    knowledgeUnits: string[],
    structuralEdges: string[],
    stylePrompt: string,
    manifestAuthors: string[],
    wsEmit?: (event: string, data: any) => void,
  ): Promise<void> {
    // If multiStepDrafting is on, generate v1 first for investigation
    let preventionPlan: InvestigationResult['preventionPlan'] | undefined;

    if (config.multiStepDrafting) {
      wsEmit?.('generation-started', { mode: 'rolling-context+multi-step', phase: 'v1' });

      const v1Prompt = buildGoldStandardPrompt({
        topic,
        subsections,
        chunks,
        knowledgeUnits,
        structuralEdges,
        stylePrompt,
        wordTarget: '3,000-3,500',
      });

      const v1Response = await this.modelRouter.call({
        systemPrompt: buildGroundingConstraints(config.groundingStrictness, chunks),
        userPrompt: v1Prompt,
        maxTokens: GOLD_STANDARD_CONFIG.opusMaxTokens,
        costTier: config.costTier,
      });

      session.generated_text.set('v1', v1Response.content);

      const investigation = investigateV1(v1Response.content, chunks, manifestAuthors);
      (session as any)._investigationResult = investigation;
      preventionPlan = investigation.preventionPlan;

      wsEmit?.('investigation-complete', {
        issueCount: investigation.issues.length,
        criticalCount: investigation.issues.filter(i => i.severity === 'critical').length,
        stats: investigation.stats,
      });
    }

    wsEmit?.('generation-started', {
      mode: 'rolling-context',
      phase: 'v2',
      sectionCount: subsections.length,
    });

    // Assign sources to sections
    const sectionSources = assignSourcesToSections(subsections, chunks);

    // Build shared pool (top N highest-relevance chunks available to all sections)
    const sortedByRelevance = [...chunks].sort((a, b) => b.relevanceScore - a.relevanceScore);
    const sharedPool = sortedByRelevance.slice(0, config.sharedPoolSize);

    // Citation tracker
    const tracker = createCitationTracker(chunks);

    // Section generation state
    const sectionTexts: string[] = [];
    const sectionSummaries: string[] = [];
    let cumulativeTokens = 0;

    for (let i = 0; i < subsections.length; i++) {
      // Check for abort signal at each section boundary
      if (abortSignal?.aborted) {
        session.pipeline_phase = 'PARTIALLY_GENERATED' as any;
        wsEmit?.('abort-acknowledged', {
          completedSections: i,
          totalSections: subsections.length,
          phase: 'PARTIALLY_GENERATED',
        });
        // Save what we have
        session.section_summaries = sectionSummaries;
        const genMap = new Map<string, string>();
        sectionTexts.forEach((text, idx) => genMap.set(`section-${idx}`, text));
        session.generated_text = genMap;
        return;
      }

      const isConclusion = i === subsections.length - 1 && config.conclusionSummaries;
      const sectionWordTarget = isConclusion
        ? String(config.conclusionWordTarget)
        : String(config.sectionWordTarget);

      // Build section-specific chunks: assigned sources + shared pool (de-duped)
      const assignedChunkAuthors = sectionSources.get(i) || [];
      const sectionChunks = this.selectSectionChunks(
        chunks, sharedPool, assignedChunkAuthors, tracker, config,
      );

      // Build prior sections text (sliding window)
      const windowStart = Math.max(0, i - config.rollingContextWindowSize);
      let priorSectionsText = '';
      for (let j = windowStart; j < i; j++) {
        // For COLD sections (outside window), use summaries; WARM sections use full text
        const isCold = j < i - config.rollingContextWindowSize;
        if (isCold && sectionSummaries[j]) {
          priorSectionsText += `### Section ${j + 1} (summary): ${sectionSummaries[j]}\n\n`;
        } else if (sectionTexts[j]) {
          priorSectionsText += `### Section ${j + 1}: ${subsections[j]}\n\n${sectionTexts[j]}\n\n`;
        }
      }

      // Dynamic token budget check
      if (cumulativeTokens > config.downgradeTokenTrigger) {
        process.stderr.write(
          `[ICPAdapter] Token budget warning: ${cumulativeTokens} tokens used (ceiling: ${config.tokenBudgetCeiling})\n`,
        );
      }

      // Build section-specific constraint
      const sectionConstraint = assignedChunkAuthors.length > 0
        ? `Prioritize citations from: ${assignedChunkAuthors.join(', ')}`
        : undefined;

      const sectionPrompt = buildRollingContextSectionPrompt({
        topic,
        globalOutline: subsections,
        currentSectionIndex: i,
        currentSectionHeading: subsections[i],
        sectionWordTarget,
        chunks: sectionChunks,
        knowledgeUnits,
        structuralEdges,
        stylePrompt,
        preventionPlan,
        priorSectionsText,
        priorSectionSummaries: isConclusion ? sectionSummaries : undefined,
        citationTracker: tracker,
        isConclusion,
        nextSectionHeading: i + 1 < subsections.length ? subsections[i + 1] : undefined,
        sectionConstraint,
      });

      const response = await this.modelRouter.call({
        systemPrompt: '',
        userPrompt: sectionPrompt,
        maxTokens: GOLD_STANDARD_CONFIG.rollingContextMaxTokens,
        costTier: config.costTier,
      });

      sectionTexts.push(response.content);
      cumulativeTokens += response.usage.inputTokens + response.usage.outputTokens;

      // Update citation tracker
      updateCitationTracker(tracker, response.content);

      // Generate COLD summary for tiered compression (if conclusionSummaries enabled)
      if (config.conclusionSummaries && !isConclusion) {
        try {
          const summaryResponse = await this.modelRouter.call({
            systemPrompt: 'Summarize the following section in exactly one sentence (max 50 words). Focus on the core argument.',
            userPrompt: response.content,
            maxTokens: 100,
            costTier: 'low',
          });
          sectionSummaries.push(summaryResponse.content.trim());
        } catch {
          // Fallback: first sentence
          const firstSentence = response.content.split(/(?<=[.!?])\s+/)[0] || '';
          sectionSummaries.push(firstSentence.substring(0, 100));
        }
      } else {
        sectionSummaries.push('');
      }

      session.generated_text.set(`section-${i}`, response.content);
      (session as any)._pipelinePhase = 'PARTIALLY_GENERATED' as PipelinePhase;

      wsEmit?.('section-complete', {
        sectionIndex: i,
        heading: subsections[i],
        wordCount: response.content.split(/\s+/).length,
        tokens: response.usage.outputTokens,
        citationTracker: { ...tracker },
        isConclusion,
        progress: ((i + 1) / subsections.length * 100).toFixed(0) + '%',
      });
    }

    // Assemble full text
    const fullText = subsections.map((heading, i) => {
      return `## ${i + 1}. ${heading}\n\n${sectionTexts[i] || ''}`;
    }).join('\n\n');

    session.generated_text.set('full', fullText);
    (session as any)._pipelinePhase = 'GENERATED' as PipelinePhase;
    (session as any)._citationTracker = tracker;

    emitSessionEvent(session, {
      ts: new Date().toISOString(),
      actor: 'llm',
      action: 'generate',
      payload_summary: `Rolling context generation complete: ${subsections.length} sections, ${cumulativeTokens} total tokens`,
      affected_ids: [],
      severity: 'info',
      user_visible: true,
      category: 'generation',
    });

    wsEmit?.('generation-complete', {
      mode: 'rolling-context',
      sectionCount: subsections.length,
      totalTokens: cumulativeTokens,
      wordCount: fullText.split(/\s+/).length,
      citationTracker: tracker,
    });
  }

  /**
   * Select chunks for a specific section:
   * 1. Shared pool (de-prioritize if author already over-cited)
   * 2. Section-assigned source chunks
   * 3. Cap at rollingContextMaxChunksPerSection
   */
  private selectSectionChunks(
    allChunks: ContextChunk[],
    sharedPool: ContextChunk[],
    assignedAuthors: string[],
    tracker: CitationTracker,
    config: ICPAdapterConfig,
  ): ContextChunk[] {
    const maxPerSection = GOLD_STANDARD_CONFIG.rollingContextMaxChunksPerSection;
    const result: ContextChunk[] = [];
    const seen = new Set<string>();

    // Shared pool first (de-prioritize over-cited authors)
    const sortedShared = [...sharedPool].sort((a, b) => {
      const aCitations = tracker.authorCitationCounts[(a.metadata.author || '').toLowerCase()] || 0;
      const bCitations = tracker.authorCitationCounts[(b.metadata.author || '').toLowerCase()] || 0;
      const aOverCited = aCitations >= GOLD_STANDARD_CONFIG.rollingContextSharedPoolMaxCitations ? 1 : 0;
      const bOverCited = bCitations >= GOLD_STANDARD_CONFIG.rollingContextSharedPoolMaxCitations ? 1 : 0;
      if (aOverCited !== bOverCited) return aOverCited - bOverCited;
      return b.relevanceScore - a.relevanceScore;
    });

    for (const chunk of sortedShared) {
      if (result.length >= maxPerSection) break;
      const id = chunk.chunkId || `${chunk.metadata.author}:${chunk.metadata.page_start}`;
      if (!seen.has(id)) {
        result.push(chunk);
        seen.add(id);
      }
    }

    // Then section-assigned chunks
    if (assignedAuthors.length > 0) {
      const assignedLower = assignedAuthors.map(a => {
        // Extract author name from "Author, *Title*" format
        const match = a.match(/^([^,]+)/);
        return (match ? match[1] : a).toLowerCase().trim();
      });

      const sectionChunks = allChunks
        .filter(c => {
          const author = (c.metadata.author || '').toLowerCase();
          return assignedLower.some(a => author.includes(a) || a.includes(author));
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      for (const chunk of sectionChunks) {
        if (result.length >= maxPerSection) break;
        const id = chunk.chunkId || `${chunk.metadata.author}:${chunk.metadata.page_start}`;
        if (!seen.has(id)) {
          result.push(chunk);
          seen.add(id);
        }
      }
    }

    // Fill remaining slots with highest-relevance unchosen chunks
    if (result.length < maxPerSection) {
      const remaining = allChunks
        .filter(c => {
          const id = c.chunkId || `${c.metadata.author}:${c.metadata.page_start}`;
          return !seen.has(id);
        })
        .sort((a, b) => b.relevanceScore - a.relevanceScore);

      for (const chunk of remaining) {
        if (result.length >= maxPerSection) break;
        result.push(chunk);
      }
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // REGENERATE V2 — re-generate using investigation prevention plan
  // ---------------------------------------------------------------------------

  async regenerateV2(
    session: ICPSession,
    config: ICPAdapterConfig,
    wsEmit?: (event: string, data: any) => void,
    abortSignal?: AbortSignal,
  ): Promise<void> {
    const investigation: InvestigationResult | undefined = (session as any)._investigationResult;
    if (!investigation) {
      throw new Error('No investigation result — run generate() with multiStepDrafting first');
    }

    const chunks: ContextChunk[] = (session as any)._adapterChunks || [];
    const topic = session.prompt_spec.original_prompt || (session as any)._topic || '';
    const subsections = (session.facets || []).map(f => f.name || f.description || '');
    const stylePrompt = session.style_prompt || '';
    const wordTarget = session.desired_word_count || '3,000-3,500';

    const knowledgeUnits = config.knowledgeUnits ? loadKnowledgeUnits() : [];
    const structuralEdges = config.structuralEdges ? loadStructuralEdges() : [];

    wsEmit?.('regeneration-started', { mode: 'v2', issuesFromV1: investigation.issues.length });

    if (config.rollingContext) {
      // Rolling context v2 with prevention plan
      await this.generateRollingContext(
        session, config, topic, subsections, chunks,
        knowledgeUnits, structuralEdges, stylePrompt,
        [...(this.manifestCache?.data.values() ?? [])].map(e => e.author || '').filter(Boolean),
        wsEmit,
      );
    } else {
      // Single-pass v2 with prevention plan injected
      const prompt = buildGoldStandardPrompt({
        topic,
        subsections,
        chunks,
        knowledgeUnits,
        structuralEdges,
        stylePrompt,
        wordTarget,
        preventionPlan: investigation.preventionPlan,
      });

      const response = await this.modelRouter.call({
        systemPrompt: buildGroundingConstraints(config.groundingStrictness, chunks, investigation.preventionPlan),
        userPrompt: prompt,
        maxTokens: GOLD_STANDARD_CONFIG.opusMaxTokens,
        costTier: config.costTier,
      });

      session.generated_text.set('v2', response.content);
      session.generated_text.set('full', response.content);
      (session as any)._pipelinePhase = 'REGENERATED' as PipelinePhase;

      wsEmit?.('regeneration-complete', {
        tokens: response.usage.outputTokens,
        wordCount: response.content.split(/\s+/).length,
      });
    }

    emitSessionEvent(session, {
      ts: new Date().toISOString(),
      actor: 'llm',
      action: 'generate',
      payload_summary: 'V2 regeneration complete with prevention plan applied',
      affected_ids: [],
      severity: 'info',
      user_visible: true,
      category: 'generation',
    });
  }

  // ---------------------------------------------------------------------------
  // VALIDATE — run post-generation quality gates
  // ---------------------------------------------------------------------------

  async validate(session: ICPSession, config: ICPAdapterConfig): Promise<void> {
    const fullText = session.generated_text.get('full');
    if (!fullText) {
      throw new Error('No generated text to validate — run generate() first');
    }

    const chunks: ContextChunk[] = (session as any)._adapterChunks || [];
    const gates: QualityGateResults = {};
    let text = fullText;

    // Gate 1: Author scrubbing
    if (config.authorScrubbing) {
      const corpusSources = buildCorpusSourcesFromChunks(chunks);
      const constraint: CorpusConstraint = {
        sources: corpusSources,
        enforcement: config.groundingStrictness === 'permissive' ? 'warn' : 'strict',
      };

      const scrubResult = scrubNonCorpusAuthors(text, constraint);
      text = scrubResult.content;

      gates.citation_enforcement = {
        passed: scrubResult.removedCount === 0,
        action: scrubResult.removedCount > 0 ? 'scrubbed' : 'clean',
        corrections: scrubResult.removedCount,
        hallucinations_caught: scrubResult.removedAuthors.length,
        total_citations: 0, // Updated below
      };
    }

    // Gate 2: Strip bare APA parentheticals
    const apaResult = stripBareApaParentheticals(text);
    text = apaResult.content;
    if (gates.citation_enforcement) {
      gates.citation_enforcement.corrections += apaResult.strippedCount;
    }

    // Gate 3: Strip endnote leaks
    text = stripEndnoteLeaks(text);

    // Gate 4: Prose sanitization
    const sanitizeResult = await this.sanitizer.sanitize(text);
    text = sanitizeResult.sanitized;

    gates.sanitization = {
      artifacts_removed: sanitizeResult.artifactCount ?? 0,
      passes: 1,
    };

    // Gate 5: Second sanitizer pass (catches post-enforcement artifacts)
    const secondPass = await this.sanitizer.sanitize(text);
    text = secondPass.sanitized;
    if (gates.sanitization) {
      gates.sanitization.artifacts_removed += (secondPass.artifactCount ?? 0);
      gates.sanitization.passes = 2;
    }

    // Store validated text back
    session.generated_text.set('full', text);
    session.quality_gates = gates;
    (session as any)._pipelinePhase = 'VALIDATED' as PipelinePhase;

    emitSessionEvent(session, {
      ts: new Date().toISOString(),
      actor: 'system',
      action: 'generate',
      payload_summary: `Validation complete: ${JSON.stringify(gates)}`,
      affected_ids: [],
      severity: 'info',
      user_visible: true,
      category: 'generation',
    });
  }

  // ---------------------------------------------------------------------------
  // SUBMIT FEEDBACK — store user feedback on session
  // ---------------------------------------------------------------------------

  async submitFeedback(session: ICPSession): Promise<void> {
    emitSessionEvent(session, {
      ts: new Date().toISOString(),
      actor: 'user',
      action: 'review_fail',
      payload_summary: 'User submitted feedback',
      affected_ids: [],
      severity: 'info',
      user_visible: true,
      category: 'generation',
    });
  }

  // ---------------------------------------------------------------------------
  // ESTIMATE COST
  // ---------------------------------------------------------------------------

  estimateCost(config: ICPAdapterConfig, sectionCount: number): CostEstimate {
    const isRolling = config.rollingContext;
    const isMultiStep = config.multiStepDrafting;
    const model = config.costTier === 'high' ? 'claude-sonnet-4-5-20250929' : 'Qwen2.5-Coder-32B';

    // Anthropic pricing (per million tokens, as of 2026-03)
    const inputPricePerMillion = config.costTier === 'high' ? 3.0 : 0.0;
    const outputPricePerMillion = config.costTier === 'high' ? 15.0 : 0.0;

    const stages: CostEstimate['stages'] = [];

    // Retrieval — no LLM cost
    stages.push({ name: 'Retrieval', estimatedTokens: 0, estimatedCost: 0 });

    if (isMultiStep) {
      // V1 generation (single-pass)
      const v1InputTokens = 8000; // prompt + chunks
      const v1OutputTokens = 6000; // ~3000 words
      const v1Cost = (v1InputTokens * inputPricePerMillion + v1OutputTokens * outputPricePerMillion) / 1_000_000;
      stages.push({ name: 'V1 Draft', estimatedTokens: v1InputTokens + v1OutputTokens, estimatedCost: v1Cost });

      // Investigation — no LLM cost
      stages.push({ name: 'Investigation', estimatedTokens: 0, estimatedCost: 0 });
    }

    if (isRolling) {
      // Per-section generation
      const sectionInputTokens = 4000;
      const sectionOutputTokens = 1500;
      const perSectionCost = (sectionInputTokens * inputPricePerMillion + sectionOutputTokens * outputPricePerMillion) / 1_000_000;
      const totalSectionCost = perSectionCost * sectionCount;
      const totalSectionTokens = (sectionInputTokens + sectionOutputTokens) * sectionCount;
      stages.push({
        name: `Rolling Context (${sectionCount} sections)`,
        estimatedTokens: totalSectionTokens,
        estimatedCost: totalSectionCost,
      });

      // Summaries (Haiku, minimal cost)
      if (config.conclusionSummaries) {
        const summaryTokens = 200 * sectionCount;
        const summaryCost = (summaryTokens * 0.25) / 1_000_000; // Haiku pricing
        stages.push({ name: 'Section Summaries', estimatedTokens: summaryTokens, estimatedCost: summaryCost });
      }
    } else if (!isMultiStep) {
      // Basic single-pass
      const inputTokens = 8000;
      const outputTokens = 6000;
      const cost = (inputTokens * inputPricePerMillion + outputTokens * outputPricePerMillion) / 1_000_000;
      stages.push({ name: 'Single-Pass Generation', estimatedTokens: inputTokens + outputTokens, estimatedCost: cost });
    }

    // Validation — no LLM cost (all string-based)
    stages.push({ name: 'Validation', estimatedTokens: 0, estimatedCost: 0 });

    const totalTokens = stages.reduce((sum, s) => sum + s.estimatedTokens, 0);
    const totalCost = stages.reduce((sum, s) => sum + s.estimatedCost, 0);

    return { stages, totalTokens, totalCost, model };
  }
}
