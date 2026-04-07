/**
 * Corpus Index Provider
 *
 * Loads the pre-compiled corpus index (compiled-index.json) and provides
 * topic-relevant ontology nodes, cross-pipeline hooks, and tension edges
 * for injection into writing prompts. Also provides query expansion
 * via canonical ontology terms.
 */

import * as fs from 'fs';
import * as path from 'path';

// ---- Types ----

export interface OntologyNode {
  name: string;
  greek?: string;
  transliteration?: string;
  translation?: string;
  definition?: string;
  type?: string;
  units?: string[];
  text?: string;
  aliases?: string[];
  centralityTier?: string;
}

interface CrossPipelineHook {
  id: string;
  sourceText?: string;
  sourceConcept?: string;
  targetText?: string;
  targetConcept?: string;
  title?: string;
  bridge?: string;
  relevance?: string;
  tag?: string;
}

interface TensionEdge {
  id?: string;
  text?: string;
  nodeA: string;
  nodeB: string;
  dependencyRelation?: string;
  conflictRelation?: string;
  description: string;
  units?: string[];
}

interface CompiledIndex {
  builtAt: string;
  ontologyNodes: OntologyNode[];
  crossPipelineHooks: CrossPipelineHook[];
  tensionEdges: TensionEdge[];
  canonicalTerms: string[];
}

export interface CorpusIndexContext {
  ontologyLines: string[];
  hookLines: string[];
  tensionLines: string[];
}

export interface QueryExpansion {
  semanticTerms: string[];
  keywordTerms: string[];
}

// ---- Module-level cache with mtime invalidation (H-03) ----

let cachedIndex: CompiledIndex | null = null;
let cachedIndexPath: string | null = null;
let cachedIndexMtimeMs = 0;

function loadCompiledIndex(indexPath?: string): CompiledIndex | null {
  const resolvedPath = indexPath || path.join(process.cwd(), 'corpus', 'index', 'compiled-index.json');
  try {
    if (!fs.existsSync(resolvedPath)) return null;
    const mtimeMs = fs.statSync(resolvedPath).mtimeMs;
    if (cachedIndex && cachedIndexPath === resolvedPath && mtimeMs === cachedIndexMtimeMs) {
      return cachedIndex;
    }
    cachedIndex = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    cachedIndexPath = resolvedPath;
    cachedIndexMtimeMs = mtimeMs;
    return cachedIndex;
  } catch {
    return null;
  }
}

// ---- Scoring ----

function scoreCandidate(topicTerms: string[], searchText: string): number {
  // Term frequency count — no candidate-length normalization
  let score = 0;
  const lower = searchText.toLowerCase();
  for (const t of topicTerms) {
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = lower.match(re);
    if (matches) score += matches.length;
  }
  return score;
}

// ---- Public API ----

export function loadCorpusIndexContext(topic: string, options?: {
  indexPath?: string;
  maxOntologyNodes?: number;
  maxHooks?: number;
  maxTensionEdges?: number;
}): CorpusIndexContext {
  const maxNodes = options?.maxOntologyNodes ?? 12;
  const maxHooks = options?.maxHooks ?? 3;
  const maxTensions = options?.maxTensionEdges ?? 5;

  const index = loadCompiledIndex(options?.indexPath);
  if (!index) return { ontologyLines: [], hookLines: [], tensionLines: [] };

  const topicTerms = topic.toLowerCase().split(/\s+/).filter(t => t.length >= 4);
  if (topicTerms.length === 0) return { ontologyLines: [], hookLines: [], tensionLines: [] };

  // Score and rank ontology nodes
  const scoredNodes = index.ontologyNodes.map(node => {
    const searchText = [
      node.name, node.greek, node.transliteration, node.definition,
      ...(node.aliases || []),
    ].filter(Boolean).join(' ');
    return { node, score: scoreCandidate(topicTerms, searchText) };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, maxNodes);

  const ontologyLines = scoredNodes.map(({ node }) => {
    const greekPart = node.greek ? `**${node.greek}**` : `**${node.name}**`;
    const translitPart = node.transliteration && node.transliteration !== node.name
      ? ` (${node.transliteration})` : '';
    const defPart = node.definition ? `: ${node.definition.slice(0, 200)}` : '';
    const unitsPart = node.units?.length ? ` [${node.units.slice(0, 5).join(', ')}]` : '';
    return `- ${greekPart}${translitPart}${defPart}${unitsPart}`;
  });

  // Score and rank hooks
  const scoredHooks = index.crossPipelineHooks.map(hook => {
    const searchText = [
      hook.sourceConcept, hook.targetConcept, hook.bridge, hook.title,
    ].filter(Boolean).join(' ');
    return { hook, score: scoreCandidate(topicTerms, searchText) };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, maxHooks);

  const hookLines = scoredHooks.map(({ hook }) => {
    const src = hook.sourceConcept || '?';
    const tgt = hook.targetConcept || '?';
    const srcText = hook.sourceText || '';
    const tgtText = hook.targetText || '';
    const bridgeSnippet = hook.bridge ? ` — ${hook.bridge.slice(0, 150)}` : '';
    return `- HOOK [${srcText} → ${tgtText}]: ${src} ↔ ${tgt}${bridgeSnippet} [${hook.tag || 'INTERP-high'}]`;
  });

  // Score and rank tensions
  const scoredTensions = index.tensionEdges.map(te => {
    const searchText = [te.nodeA, te.nodeB, te.description].filter(Boolean).join(' ');
    return { te, score: scoreCandidate(topicTerms, searchText) };
  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, maxTensions);

  const tensionLines = scoredTensions.map(({ te }) => {
    const id = te.id || 'T?';
    const descSnippet = te.description ? te.description.slice(0, 200) : '';
    const unitsPart = te.units?.length ? ` [${te.units.join(', ')}]` : '';
    return `- TENSION [${id}]: ${te.nodeA} ↔ ${te.nodeB} — ${descSnippet}${unitsPart}`;
  });

  return { ontologyLines, hookLines, tensionLines };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function expandQueryWithOntology(
  query: string,
  ontologyNodes: OntologyNode[]
): QueryExpansion {
  const queryLower = query.toLowerCase();
  const semanticSet = new Set<string>();
  const keywordSet = new Set<string>();

  for (const node of ontologyNodes) {
    const allTerms = [node.name, node.transliteration, ...(node.aliases || [])]
      .filter((t): t is string => !!t && t.length >= 4);
    const matched = allTerms.some(t => {
      try {
        const re = new RegExp('\\b' + escapeRegex(t) + '\\b', 'i');
        return re.test(query);
      } catch { return false; }
    });

    if (matched) {
      [node.name, node.transliteration].forEach(t => {
        if (t && t.length >= 4 && !queryLower.includes(t.toLowerCase())) {
          semanticSet.add(t);
        }
      });
      if (node.greek && !queryLower.includes(node.greek.toLowerCase())) {
        keywordSet.add(node.greek);
      }
    }
  }

  return { semanticTerms: [...semanticSet], keywordTerms: [...keywordSet] };
}

/** Get raw compiled index for direct access (e.g., query expansion) */
export function getCompiledIndex(indexPath?: string): CompiledIndex | null {
  return loadCompiledIndex(indexPath);
}
