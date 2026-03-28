/**
 * Corpus Constraint Builder (Phase 1: Hallucination Prevention)
 *
 * Converts retrieval chunks to citation constraints that prevent LLM hallucinations.
 * This is the critical bridge between corpus retrieval and writing generation.
 */

import { readFile } from 'fs/promises';
import { resolve } from 'path';
import type { CorpusConstraint, CorpusSource } from './writing-generator.js';
import { createComponentLogger } from '../observability/logger.js';

const logger = createComponentLogger('CorpusConstraintBuilder');

/**
 * Context chunk from retrieval layer (matches SmartRetrievalLayer output)
 *
 * Note: This interface is designed to be compatible with both the retrieval layer's
 * ContextChunk type and simpler chunk representations.
 */
// Canonical ContextChunk from retrieval/types — single source of truth.
import type { ContextChunk } from '../../retrieval/types.js';
export type { ContextChunk };

/**
 * Options for building corpus constraints
 */
export interface CorpusConstraintOptions {
  /** Enforcement level (default: 'strict') */
  enforcement?: 'strict' | 'warn' | 'off';
  /** Placeholder for missing citations (default: '[CITATION NEEDED]') */
  missingCitationPlaceholder?: string;
  /** Minimum relevance score to include source (default: 0.5) */
  minRelevance?: number;
  /** Additional manual sources to include */
  additionalSources?: CorpusSource[];
}

/**
 * Build a corpus constraint from retrieval chunks
 *
 * This function:
 * 1. Deduplicates sources by author+year+title
 * 2. Merges page ranges from multiple chunks of the same source
 * 3. Generates citation keys for easy reference
 * 4. Returns a constraint object ready for the writing generator
 *
 * @param chunks - Context chunks from retrieval
 * @param options - Configuration options
 * @returns CorpusConstraint for writing generator
 */
export function buildCorpusConstraint(
  chunks: ContextChunk[],
  options: CorpusConstraintOptions = {}
): CorpusConstraint {
  const {
    enforcement = 'strict',
    missingCitationPlaceholder = '[CITATION NEEDED]',
    minRelevance = 0.5,
    additionalSources = [],
  } = options;

  // Filter by relevance
  const relevantChunks = chunks.filter(c => c.relevanceScore >= minRelevance);

  // Deduplicate and merge sources
  const sourceMap = new Map<string, CorpusSource & { pageRanges: Array<[number, number]> }>();

  for (const chunk of relevantChunks) {
    const { author, year, title, page_start, page_end, docId } = chunk.metadata;

    // Skip chunks without author/year (can't be cited)
    if (!author || !year) continue;

    const key = `${author}_${year}_${title || 'unknown'}`;

    if (!sourceMap.has(key)) {
      sourceMap.set(key, {
        author,
        year,
        title: title || 'Unknown Title',
        docId,
        citationKey: generateCitationKey(author, year),
        pageRanges: [],
      });
    }

    // Add page range if available
    const source = sourceMap.get(key)!;
    if (page_start !== undefined) {
      const end = page_end ?? page_start;
      source.pageRanges.push([page_start, end]);
    }
  }

  // Convert to CorpusSource array with merged page ranges
  const sources: CorpusSource[] = Array.from(sourceMap.values()).map(source => {
    const mergedPages = mergePageRanges(source.pageRanges);
    return {
      author: source.author,
      year: source.year,
      title: source.title,
      pages: mergedPages.length > 0 ? formatPageRanges(mergedPages) : undefined,
      docId: source.docId,
      citationKey: source.citationKey,
    };
  });

  // Add additional manual sources
  for (const additionalSource of additionalSources) {
    // Check for duplicates
    const exists = sources.some(
      s => s.author === additionalSource.author && s.year === additionalSource.year
    );
    if (!exists) {
      sources.push({
        ...additionalSource,
        citationKey: additionalSource.citationKey || generateCitationKey(additionalSource.author, additionalSource.year),
      });
    }
  }

  // Sort by author name for consistent ordering
  sources.sort((a, b) => a.author.localeCompare(b.author));

  return {
    sources,
    enforcement,
    missingCitationPlaceholder,
  };
}

/**
 * Generate a citation key from author and year
 * e.g., "Frede, Dorothea" + 1992 => "Frede 1992"
 */
function generateCitationKey(author: string, year: number): string {
  // Extract last name (first part before comma, or first word)
  let lastName: string;
  if (author.includes(',')) {
    lastName = author.split(',')[0].trim();
  } else {
    // Handle "First Last" format
    const parts = author.split(' ');
    lastName = parts[parts.length - 1];
  }
  return `${lastName} ${year}`;
}

/**
 * Merge overlapping or adjacent page ranges
 * e.g., [[1,5], [3,8], [15,20]] => [[1,8], [15,20]]
 */
function mergePageRanges(ranges: Array<[number, number]>): Array<[number, number]> {
  if (ranges.length === 0) return [];

  // Sort by start page
  const sorted = [...ranges].sort((a, b) => a[0] - b[0]);

  const merged: Array<[number, number]> = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    // If overlapping or adjacent (within 1 page), merge
    if (current[0] <= last[1] + 1) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Format page ranges as a string
 * e.g., [[1,8], [15,20]] => "1-8, 15-20"
 */
function formatPageRanges(ranges: Array<[number, number]>): string {
  return ranges
    .map(([start, end]) => (start === end ? `${start}` : `${start}-${end}`))
    .join(', ');
}

/**
 * Manifest entry structure from scripts/ingest/manifest.jsonl
 */
interface ManifestEntry {
  collection: string;
  doc_id: string;
  status: string;
  meta: {
    author_raw: string | null;
    title_raw: string | null;
    year: number | null;
  };
}

/**
 * Options for loading corpus manifest
 */
export interface LoadManifestOptions {
  /** Filter to specific collections (e.g., ['rhetorical_ontology']) */
  collections?: string[];
  /** Custom path to manifest.jsonl (default: scripts/ingest/manifest.jsonl) */
  manifestPath?: string;
}

/** Default manifest path relative to project root */
const DEFAULT_MANIFEST_PATH = 'scripts/ingest/manifest.jsonl';

/**
 * Load corpus sources from the real manifest.jsonl file.
 *
 * Reads scripts/ingest/manifest.jsonl (JSONL format), maps each entry
 * to a CorpusSource, and optionally filters by collection.
 * Falls back to an empty array with a warning if the file cannot be read.
 */
export async function loadCorpusManifest(options?: LoadManifestOptions): Promise<CorpusSource[]> {
  const manifestPath = options?.manifestPath
    ?? resolve(process.cwd(), DEFAULT_MANIFEST_PATH);

  let rawContent: string;
  try {
    rawContent = await readFile(manifestPath, 'utf-8');
  } catch (err) {
    logger.warn(`Cannot read manifest at ${manifestPath}`, { error_message: String(err) });
    return [];
  }

  const sources: CorpusSource[] = [];
  const lines = rawContent.split('\n').filter(line => line.trim().length > 0);

  for (const line of lines) {
    let entry: ManifestEntry;
    try {
      entry = JSON.parse(line);
    } catch {
      continue; // skip malformed lines
    }

    // Skip entries without author
    if (!entry.meta?.author_raw) continue;

    // Skip failed ingestions
    if (entry.status !== 'ok') continue;

    // Apply collection filter if specified
    if (options?.collections && options.collections.length > 0) {
      if (!options.collections.includes(entry.collection)) continue;
    }

    const author = entry.meta.author_raw;
    const year = entry.meta.year ?? undefined;
    const title = entry.meta.title_raw ?? 'Unknown Title';

    sources.push({
      author,
      year: year ?? 0,
      title,
      docId: entry.doc_id,
      citationKey: generateCitationKey(author, year ?? 0),
    });
  }

  // Deduplicate by author+year+title (same source may appear as multiple files)
  const seen = new Set<string>();
  const deduped = sources.filter(s => {
    const key = `${s.author}_${s.year}_${s.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return deduped;
}

/**
 * Validate that a citation matches a corpus source
 *
 * @param citation - Citation text to validate (e.g., "Frede 1992" or "Frede, 285")
 * @param sources - List of valid corpus sources
 * @returns Match result with details
 */
export function validateCitation(
  citation: string,
  sources: CorpusSource[]
): { valid: boolean; matchedSource?: CorpusSource; reason?: string } {
  // Normalize citation
  const normalized = citation.toLowerCase().trim();

  // Try to extract author and year
  const authorYearMatch = normalized.match(/([a-z']+)[,\s]+(\d{4}|\d+)/i);
  const authorOnlyMatch = normalized.match(/^\(?([a-z']+)/i);

  if (authorYearMatch) {
    const [, authorPart, yearOrPage] = authorYearMatch;
    const year = parseInt(yearOrPage, 10);

    // Check if this matches any source
    for (const source of sources) {
      const sourceLastName = source.citationKey?.split(' ')[0]?.toLowerCase() ||
        source.author.split(',')[0].toLowerCase();

      const isSubstringMatch = sourceLastName.includes(authorPart) || authorPart.includes(sourceLastName);
      if (authorPart.length < 4 ? sourceLastName === authorPart : isSubstringMatch) {
        // If year is 4 digits, validate it matches
        if (yearOrPage.length === 4) {
          if (source.year == null || source.year === 0 || Math.abs(source.year) === year || source.year === year) {
            return { valid: true, matchedSource: source };
          }
        } else {
          // It's probably a page number, which is fine
          return { valid: true, matchedSource: source };
        }
      }
    }

    return {
      valid: false,
      reason: `No corpus source found matching "${authorPart}" with year ${year}`,
    };
  }

  if (authorOnlyMatch) {
    const authorPart = authorOnlyMatch[1].toLowerCase();

    for (const source of sources) {
      const sourceLastName = source.citationKey?.split(' ')[0]?.toLowerCase() ||
        source.author.split(',')[0].toLowerCase();

      const isSubstringMatch = sourceLastName.includes(authorPart) || authorPart.includes(sourceLastName);
      if (authorPart.length < 4 ? sourceLastName === authorPart : isSubstringMatch) {
        return { valid: true, matchedSource: source };
      }
    }

    return {
      valid: false,
      reason: `No corpus source found matching author "${authorPart}"`,
    };
  }

  return {
    valid: false,
    reason: `Could not parse citation: "${citation}"`,
  };
}
