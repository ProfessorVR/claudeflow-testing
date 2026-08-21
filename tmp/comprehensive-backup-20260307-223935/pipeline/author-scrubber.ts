/**
 * AuthorScrubber - Scrub non-corpus author references from generated content
 *
 * Extracted from UniversalAgent (Tranche E-01, SEAM-3).
 * Pure functions with zero side effects.
 *
 * Fix 25: After citation enforcement removes formal citations, informal references
 * like "Modrak's account" or "Drawing on Roark" may remain. This module scans
 * for signal-phrase patterns referencing authors NOT in the corpus constraint
 * whitelist and removes the containing sentences.
 */

import type { CorpusConstraint, CorpusSource } from '../core/writing/index.js';
import type { ContextChunk } from '../retrieval/index.js';

export interface ScrubResult {
  content: string;
  removedCount: number;
  removedAuthors: string[];
  contexts: Record<string, string[]>;
}

/**
 * Scrub non-corpus author references from final content.
 *
 * Scans for signal-phrase patterns referencing authors NOT in
 * the corpus constraint whitelist and removes the containing sentences.
 */
export function scrubNonCorpusAuthors(
  content: string,
  constraint: CorpusConstraint
): ScrubResult {
  // Build set of allowed author last names (normalized)
  const allowedAuthors = new Set<string>();
  for (const source of constraint.sources) {
    // Extract last name from various formats
    const lastName = source.author.includes(',')
      ? source.author.split(',')[0].trim().toLowerCase()
      : source.author.split(/\s+/).pop()?.toLowerCase() || '';
    if (lastName) allowedAuthors.add(lastName);

    // Also add first word for single-name authors like "Aristotle"
    const firstWord = source.author.split(/[\s,]+/)[0].toLowerCase();
    if (firstWord) allowedAuthors.add(firstWord);
  }

  // Common non-author words that match capitalized patterns but aren't authors
  const falsePositives = new Set([
    'the', 'this', 'that', 'these', 'those', 'however', 'moreover',
    'furthermore', 'indeed', 'thus', 'hence', 'yet', 'still', 'also',
    'chapter', 'section', 'part', 'book', 'volume', 'figure', 'table',
    'greek', 'latin', 'english', 'german', 'french', 'ancient', 'modern',
    'western', 'european', 'aristotelian', 'heideggerian', 'platonic',
    'phenomenological', 'rhetorical', 'de', 'anima', 'rhetoric',
    'being', 'time', 'soul', 'phantasia', 'stimmung', 'dasein', 'logos',
  ]);

  // Fix 30: Expanded signal phrase patterns for broader scholarly attribution coverage
  const verbList = 'argues?|observes?|notes?|states?|maintains?|suggests?|contends?|claims?|emphasize[sd]?|explains?|demonstrates?|shows?|remarks?|writes?|proposes?|develops?|articulates?|characterizes?|distinguishes?|advances?|interprets?|critiques?|identifies?|establishes?|recognizes?|acknowledges?|theorizes?|posits?|holds?|defends?|elaborates?|outlines?|highlights?|underscores?|describes?|explores?|examines?|considers?|asserts?|insists?|reveals?|documents?|presents?|illustrates?|formulates?';
  const nounList = 'account|analysis|reading|interpretation|argument|view|theory|claim|framework|approach|position|treatment|discussion|taxonomy|classification|model|concept|distinction|insight|observation|formulation|critique|contribution|definition|thesis|proposal|scheme|typology|ontology|epistemology|phenomenology|methodology';

  const authorSignalPatterns = [
    // "As Author argues/observes/notes..."
    new RegExp(`\\bAs\\s+([A-Z][a-z']+(?:\\s+[A-Z][a-z']+)?)\\s+(?:${verbList})\\b`, 'g'),
    // "Author argues/observes/notes that..."
    new RegExp(`\\b([A-Z][a-z']+(?:\\s+[A-Z][a-z']+)?)\\s+(?:${verbList})\\s+(?:that|how|why|whether)\\b`, 'g'),
    // "Author has shown/has demonstrated..."
    new RegExp(`\\b([A-Z][a-z']+(?:\\s+[A-Z][a-z']+)?)\\s+has\\s+(?:shown|demonstrated|argued|suggested|noted|observed|proposed|established|maintained|claimed|illustrated)\\b`, 'g'),
    // "Author's account/analysis/reading..."
    new RegExp(`\\b([A-Z][a-z']+(?:\\s+[A-Z][a-z']+)?)'s\\s+(?:${nounList})\\b`, 'g'),
    // "according to Author" or "following Author" or "drawing on Author"
    /\b(?:according\s+to|following|drawing\s+on|building\s+on|inspired\s+by|indebted\s+to)\s+([A-Z][a-z']+(?:\s+[A-Z][a-z']+)?)\b/gi,
    // "the work/account of Author"
    new RegExp(`\\b(?:the\\s+(?:work|${nounList})\\s+(?:of|in|by))\\s+([A-Z][a-z']+(?:\\s+[A-Z][a-z']+)?)\\b`, 'gi'),
  ];

  const removedAuthors = new Set<string>();
  const contexts: Record<string, string[]> = {};
  let removedCount = 0;

  // Split into sentences for targeted removal
  const sentences = content.split(/(?<=[.!?])\s+/);
  const cleanSentences: string[] = [];

  for (const sentence of sentences) {
    let hasExternalAuthor = false;

    for (const pattern of authorSignalPatterns) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(sentence)) !== null) {
        const authorName = match[1]?.trim();
        if (!authorName) continue;

        const normalized = authorName.split(/\s+/).pop()?.toLowerCase() || '';
        // Check if this is NOT an allowed corpus author and NOT a false positive
        if (normalized && !allowedAuthors.has(normalized) && !falsePositives.has(normalized)) {
          hasExternalAuthor = true;
          removedAuthors.add(authorName);
          removedCount++;

          // Collect context snippets (first 2 per author for diagnostics)
          if (!contexts[authorName]) contexts[authorName] = [];
          if (contexts[authorName].length < 2) {
            contexts[authorName].push(sentence.slice(0, 120));
          }
        }
      }
    }

    if (!hasExternalAuthor) {
      cleanSentences.push(sentence);
    }
  }

  return {
    content: cleanSentences.join(' '),
    removedCount,
    removedAuthors: Array.from(removedAuthors),
    contexts,
  };
}

/**
 * Build CorpusSource array from context chunks for inline validation.
 * Phase 11: Inline Citation Enforcement
 */
export function buildCorpusSourcesFromChunks(chunks: ContextChunk[]): CorpusSource[] {
  // Group chunks by author+year+title to build unique sources
  const sourceMap = new Map<string, CorpusSource>();

  for (const chunk of chunks) {
    const { author, year, title } = chunk.metadata;
    if (!author) continue;

    const key = `${author}_${year || 'nd'}_${title || 'unknown'}`;

    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        author,
        year: year ?? 0,
        title: title || 'Unknown Title',
        citationKey: `${author.split(/[,\s]+/)[0]}_${year || 'nd'}`,
      });
    }
  }

  return Array.from(sourceMap.values());
}
