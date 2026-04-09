/**
 * Centralized JSONL Loaders — Single Source of Truth
 *
 * All KnowledgeUnit and ReasoningEdge loading MUST go through these functions.
 * Provides:
 *   - Zod validation at the parse boundary
 *   - mtime-based cache invalidation for long-running processes
 *   - Consistent confidence normalization (high→0.9, medium→0.6, low→0.3)
 *   - Dropped-line counting with stderr warnings
 *
 * Fixes: F-02, F-05, F-09, F-26, F-29, F-30
 */

import { readFileSync, statSync, existsSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  type KnowledgeUnit,
  type ReasoningEdge,
  parseKnowledgeUnit,
  parseReasoningEdge,
} from '../retrieval/types.js';

// ============================================================================
// Synchronous loaders with mtime cache (for module-level caches)
// ============================================================================

interface CachedData<T> {
  data: T[];
  path: string;
  mtimeMs: number;
}

let _kuCache: CachedData<KnowledgeUnit> | null = null;
let _edgeCache: CachedData<ReasoningEdge> | null = null;

/**
 * Load and validate KnowledgeUnits from god-learn/knowledge.jsonl.
 * Cached with mtime invalidation. Safe for long-running processes.
 */
export function loadKnowledgeUnitsSync(projectRoot?: string): KnowledgeUnit[] {
  const root = projectRoot ?? process.cwd();
  const kuPath = resolve(root, 'god-learn', 'knowledge.jsonl');

  if (!existsSync(kuPath)) return [];

  const mtimeMs = statSync(kuPath).mtimeMs;
  if (_kuCache && _kuCache.path === kuPath && _kuCache.mtimeMs === mtimeMs) {
    return _kuCache.data;
  }

  const raw = readFileSync(kuPath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const kus: KnowledgeUnit[] = [];
  let dropped = 0;

  for (const line of lines) {
    const ku = parseKnowledgeUnit(line);
    if (ku) {
      kus.push(ku);
    } else {
      dropped++;
    }
  }

  if (dropped > 0) {
    process.stderr.write(`[jsonl-loaders] KU: loaded ${kus.length}, dropped ${dropped} (validation failed)\n`);
  }

  _kuCache = { data: kus, path: kuPath, mtimeMs };
  return kus;
}

/**
 * Load and validate ReasoningEdges from god-reason/reasoning.jsonl.
 * Cached with mtime invalidation. Safe for long-running processes.
 */
export function loadReasoningEdgesSync(projectRoot?: string): ReasoningEdge[] {
  const root = projectRoot ?? process.cwd();
  const edgePath = resolve(root, 'god-reason', 'reasoning.jsonl');

  if (!existsSync(edgePath)) return [];

  const mtimeMs = statSync(edgePath).mtimeMs;
  if (_edgeCache && _edgeCache.path === edgePath && _edgeCache.mtimeMs === mtimeMs) {
    return _edgeCache.data;
  }

  const raw = readFileSync(edgePath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const edges: ReasoningEdge[] = [];
  let dropped = 0;

  for (const line of lines) {
    const edge = parseReasoningEdge(line);
    if (edge) {
      edges.push(edge);
    } else {
      dropped++;
    }
  }

  if (dropped > 0) {
    process.stderr.write(`[jsonl-loaders] Edges: loaded ${edges.length}, dropped ${dropped} (validation failed)\n`);
  }

  _edgeCache = { data: edges, path: edgePath, mtimeMs };
  return edges;
}

// ============================================================================
// Async loaders (for non-blocking contexts)
// ============================================================================

/**
 * Async version of loadKnowledgeUnitsSync. Uses the same cache.
 */
export async function loadKnowledgeUnitsAsync(projectRoot?: string): Promise<KnowledgeUnit[]> {
  const root = projectRoot ?? process.cwd();
  const kuPath = resolve(root, 'god-learn', 'knowledge.jsonl');

  if (!existsSync(kuPath)) return [];

  const mtimeMs = (await stat(kuPath)).mtimeMs;
  if (_kuCache && _kuCache.path === kuPath && _kuCache.mtimeMs === mtimeMs) {
    return _kuCache.data;
  }

  const raw = await readFile(kuPath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const kus: KnowledgeUnit[] = [];
  let dropped = 0;

  for (const line of lines) {
    const ku = parseKnowledgeUnit(line);
    if (ku) {
      kus.push(ku);
    } else {
      dropped++;
    }
  }

  if (dropped > 0) {
    process.stderr.write(`[jsonl-loaders] KU: loaded ${kus.length}, dropped ${dropped} (validation failed)\n`);
  }

  _kuCache = { data: kus, path: kuPath, mtimeMs };
  return kus;
}

/**
 * Async version of loadReasoningEdgesSync. Uses the same cache.
 */
export async function loadReasoningEdgesAsync(projectRoot?: string): Promise<ReasoningEdge[]> {
  const root = projectRoot ?? process.cwd();
  const edgePath = resolve(root, 'god-reason', 'reasoning.jsonl');

  if (!existsSync(edgePath)) return [];

  const mtimeMs = (await stat(edgePath)).mtimeMs;
  if (_edgeCache && _edgeCache.path === edgePath && _edgeCache.mtimeMs === mtimeMs) {
    return _edgeCache.data;
  }

  const raw = await readFile(edgePath, 'utf-8');
  const lines = raw.split('\n').filter(l => l.trim());
  const edges: ReasoningEdge[] = [];
  let dropped = 0;

  for (const line of lines) {
    const edge = parseReasoningEdge(line);
    if (edge) {
      edges.push(edge);
    } else {
      dropped++;
    }
  }

  if (dropped > 0) {
    process.stderr.write(`[jsonl-loaders] Edges: loaded ${edges.length}, dropped ${dropped} (validation failed)\n`);
  }

  _edgeCache = { data: edges, path: edgePath, mtimeMs };
  return edges;
}

// ============================================================================
// Compiled Index loader (centralized cache for compiled-index.json)
// ============================================================================

let _compiledIndexCache: { data: any; path: string; mtimeMs: number } | null = null;

/**
 * Load compiled-index.json with mtime-based caching.
 * Single source of truth — both cross-author-utils.ts and corpus-index-provider.ts
 * should delegate to this function instead of maintaining their own caches.
 */
export function loadCompiledIndex(projectRoot?: string): any | null {
  const root = projectRoot ?? process.cwd();
  const indexPath = resolve(root, 'corpus', 'index', 'compiled-index.json');

  try {
    if (!existsSync(indexPath)) return null;

    const mtimeMs = statSync(indexPath).mtimeMs;
    if (_compiledIndexCache && _compiledIndexCache.path === indexPath && _compiledIndexCache.mtimeMs === mtimeMs) {
      return _compiledIndexCache.data;
    }

    const raw = readFileSync(indexPath, 'utf-8');
    const parsed = JSON.parse(raw);

    _compiledIndexCache = { data: parsed, path: indexPath, mtimeMs };
    return parsed;
  } catch {
    return null;
  }
}

// ============================================================================
// Author-KU Index (H-09: O(1) author-scoped KU queries)
// ============================================================================

let _authorKUIndexCache: { data: Map<string, KnowledgeUnit[]>; mtimeMs: number } | null = null;

/**
 * Load knowledge.jsonl and group KUs by primary author (sources[0].author).
 * Cached with mtime invalidation keyed to knowledge.jsonl.
 * Returns Map<authorRaw, KnowledgeUnit[]> for O(1) author lookups.
 */
export function loadAuthorKUIndex(projectRoot?: string): Map<string, KnowledgeUnit[]> {
  const root = projectRoot ?? process.cwd();
  const kuPath = resolve(root, 'god-learn', 'knowledge.jsonl');

  // Check mtime — if unchanged, return cached index
  if (_authorKUIndexCache) {
    try {
      const mtimeMs = statSync(kuPath).mtimeMs;
      if (mtimeMs === _authorKUIndexCache.mtimeMs) {
        return _authorKUIndexCache.data;
      }
    } catch { /* file may not exist */ }
  }

  // Build the index from the flat KU array
  const kus = loadKnowledgeUnitsSync(projectRoot);
  const index = new Map<string, KnowledgeUnit[]>();

  for (const ku of kus) {
    const sources = (ku as any).sources;
    const author = (Array.isArray(sources) && sources.length > 0 && typeof sources[0]?.author === 'string')
      ? sources[0].author
      : 'Unknown';

    if (!index.has(author)) {
      index.set(author, []);
    }
    index.get(author)!.push(ku);
  }

  // Cache with mtime
  try {
    const mtimeMs = statSync(kuPath).mtimeMs;
    _authorKUIndexCache = { data: index, mtimeMs };
  } catch {
    _authorKUIndexCache = { data: index, mtimeMs: 0 };
  }

  return index;
}

/**
 * Get all KUs by a specific author, with manifest-based name resolution.
 * Normalizes the input (e.g., "heidegger" → "Heidegger, Martin") before lookup.
 */
export function getKUsByAuthor(author: string, projectRoot?: string): KnowledgeUnit[] {
  const index = loadAuthorKUIndex(projectRoot);
  const lower = author.toLowerCase().trim();

  // Direct match first
  if (index.has(author)) return index.get(author)!;

  // Case-insensitive match against all keys
  for (const [key, kus] of index.entries()) {
    if (key.toLowerCase() === lower) return kus;
    // Last-name match (e.g., "heidegger" matches "Heidegger, Martin")
    const commaIdx = key.indexOf(',');
    const lastName = commaIdx > 0 ? key.slice(0, commaIdx).toLowerCase() : key.toLowerCase();
    if (lastName === lower) return kus;
    // Nobiliary stripping (e.g., "uexkull" matches "von Uexkull, Jacob")
    const nobiliary = /^(von|de|van|di)\s+/i;
    if (nobiliary.test(key)) {
      const bare = key.replace(nobiliary, '');
      const bareLastName = bare.split(',')[0].toLowerCase().trim();
      if (bareLastName === lower) return kus;
    }
  }

  return [];
}

/**
 * Clear all caches. Useful for testing.
 */
export function clearJSONLCaches(): void {
  _kuCache = null;
  _edgeCache = null;
  _compiledIndexCache = null;
  _authorKUIndexCache = null;
}
