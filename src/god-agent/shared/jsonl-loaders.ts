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

/**
 * Clear all caches. Useful for testing.
 */
export function clearJSONLCaches(): void {
  _kuCache = null;
  _edgeCache = null;
}
