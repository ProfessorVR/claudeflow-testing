/**
 * Shared retrieval utility functions.
 *
 * Extracted from ICPPipelineAdapter (Phase 8.2A) to deduplicate logic
 * that was independently re-implemented in:
 *   - WritePipelineOrchestrator (private methods)
 *   - ICPPipelineAdapter (standalone exported functions)
 *
 * Canonical implementations live here. Both modules now import from this file.
 *
 * Functions:
 *   - investigateV1()          — local string analysis of v1 draft output
 *   - trimChunkContent()       — intelligent chunk trimming preserving high-value sentences
 *   - reorderChunksForAttention() — "lost in the middle" mitigation
 *   - enforceSourceDiversity() — per-work cap on retrieved chunks
 *   - validateRetrievalCoverage() — verify key authors have sufficient chunks
 *
 * @module retrieval-utils
 */

import type { ContextChunk } from '../../retrieval/types.js';
import { GOLD_STANDARD_CONFIG } from '../../universal/gold-standard-config.js';
import {
  loadDomainConfig,
  buildAuthorPattern,
  buildConceptPattern,
} from '../../universal/domain-config.js';

// =============================================================================
// TYPES
// =============================================================================

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

// =============================================================================
// FUNCTIONS
// =============================================================================

/**
 * Investigate v1 output for faithfulness issues using local string analysis only.
 * Returns a structured investigation result with issues and a prevention plan.
 * Cost: ~0ms (no LLM calls). All checks are regex/string-based.
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
 * 3. Argument-dense sentences (domain key terms)
 * 4. Remove OCR artifacts, headers, boilerplate
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
