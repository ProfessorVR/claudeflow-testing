/**
 * Cross-Author Bridge Utilities
 *
 * Shared utility for detecting active cross-pipeline interpretive bridges
 * and enforcing cross-author integration requirements. Used by:
 *  - gold-standard-prompt-builder.ts (Phase 1: mandatory bridge injection)
 *  - icp-orchestrator.ts (Phase 2: author-diverse retrieval enforcement)
 *  - quality-integration.ts (Phase 3: tension-aware quality gate)
 *
 * Loads corpus/index/compiled-index.json with mtime-based caching
 * (same pattern as shared/jsonl-loaders.ts).
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadCompiledIndex as loadCompiledIndexShared } from './jsonl-loaders.js';

// ---- Types ----

export interface CrossPipelineHook {
  id: string;
  sourceText?: string;
  sourceConcept?: string;
  targetText?: string;
  targetConcept?: string;
  title?: string;
  bridge?: string;
  relevance?: string;
  tag?: string;
  /** Derived at load time from sourceText (e.g., "Aristotle" from "Aristotle - De Anima") */
  sourceAuthor: string;
  /** Derived at load time from targetText */
  targetAuthor: string;
}

export interface TensionEdge {
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
  crossPipelineHooks: CrossPipelineHook[];
  tensionEdges: TensionEdge[];
  [key: string]: unknown;
}

// ---- Compiled index (delegates to shared loader in jsonl-loaders.ts) ----

// Track whether hooks have been author-derived for this cache generation
let _hooksDerivationDone = false;

// ---- Manifest-derived canonical tables (H-05) ----

interface ManifestCanonicalTables {
  /** Normalized last name / short name → full manifest author_raw */
  authorCanonical: Map<string, string>;
  /** Normalized alternate title → manifest title_raw */
  titleCanonical: Map<string, string>;
  /** Full author_raw → list of title_raw for that author */
  authorTitles: Map<string, string[]>;
  /** title_raw → authority tier ('primary' | 'secondary' | 'tertiary') */
  titleAuthority: Map<string, string>;
}

let _manifestCache: { data: ManifestCanonicalTables; path: string; mtimeMs: number } | null = null;

/**
 * Load manifest.jsonl and build canonical author/title lookup tables.
 * mtime-cached. Falls back gracefully if manifest doesn't exist.
 */
export function loadManifestCanonicals(projectRoot?: string): ManifestCanonicalTables {
  const root = projectRoot ?? process.cwd();
  const manifestPath = path.resolve(root, 'scripts', 'ingest', 'manifest.jsonl');

  // Return empty tables if manifest doesn't exist
  if (!fs.existsSync(manifestPath)) {
    return { authorCanonical: new Map(), titleCanonical: new Map(), authorTitles: new Map(), titleAuthority: new Map() };
  }

  const mtimeMs = fs.statSync(manifestPath).mtimeMs;
  if (_manifestCache && _manifestCache.path === manifestPath && _manifestCache.mtimeMs === mtimeMs) {
    return _manifestCache.data;
  }

  const authorCanonical = new Map<string, string>();
  const titleCanonical = new Map<string, string>();
  const authorTitles = new Map<string, string[]>();
  const titleAuthority = new Map<string, string>();

  const lines = fs.readFileSync(manifestPath, 'utf-8').split('\n').filter(l => l.trim());
  for (const line of lines) {
    try {
      const entry = JSON.parse(line);
      if (entry.status !== 'ok') continue;
      const meta = entry.meta || {};
      const authorRaw = meta.author_raw;
      const titleRaw = meta.title_raw;

      if (authorRaw) {
        // Map various normalized forms to the canonical author_raw
        const lower = authorRaw.toLowerCase().trim();
        authorCanonical.set(lower, authorRaw);

        // Last name only (before comma)
        const commaIdx = authorRaw.indexOf(',');
        if (commaIdx > 0) {
          const lastName = authorRaw.slice(0, commaIdx).trim().toLowerCase();
          // Only set if not already mapped (first author with that last name wins)
          if (!authorCanonical.has(lastName)) {
            authorCanonical.set(lastName, authorRaw);
          }
        } else {
          // Single-name author (e.g., "Aristotle")
          authorCanonical.set(lower, authorRaw);
        }

        // Strip nobiliary particles for alternate lookup
        const nobiliary = /^(von|de|van|di)\s+/i;
        if (nobiliary.test(lower)) {
          const bare = lower.replace(nobiliary, '');
          if (!authorCanonical.has(bare)) {
            authorCanonical.set(bare, authorRaw);
          }
          // Also map bare last name without first name (e.g., "uexkull" from "uexkull, jacob")
          const bareLastName = bare.split(',')[0].trim();
          if (bareLastName && !authorCanonical.has(bareLastName)) {
            authorCanonical.set(bareLastName, authorRaw);
          }
        }
      }

      if (titleRaw) {
        const titleLower = titleRaw.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
        titleCanonical.set(titleLower, titleRaw);

        // Common Latin/alternate title mappings derived from the manifest title
        // "On The Soul (De Anima)" → also map "de anima" → "On The Soul (De Anima)"
        const parenMatch = titleRaw.match(/\(([^)]+)\)/);
        if (parenMatch) {
          const altTitle = parenMatch[1].toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
          if (altTitle.length >= 4) {
            titleCanonical.set(altTitle, titleRaw);
          }
        }
      }

      // Store authority tier
      if (titleRaw && meta.authority_tier) {
        titleAuthority.set(titleRaw, meta.authority_tier);
      }

      // Build author → titles mapping
      if (authorRaw && titleRaw) {
        if (!authorTitles.has(authorRaw)) {
          authorTitles.set(authorRaw, []);
        }
        const titles = authorTitles.get(authorRaw)!;
        if (!titles.includes(titleRaw)) {
          titles.push(titleRaw);
        }
      }
    } catch { /* skip malformed lines */ }
  }

  _manifestCache = { data: { authorCanonical, titleCanonical, authorTitles, titleAuthority }, path: manifestPath, mtimeMs };
  return _manifestCache.data;
}

/**
 * Resolve an author name to its canonical manifest author_raw value.
 * Checks the manifest-derived table first, then falls back to static abbreviations.
 */
export function resolveAuthor(name: string, projectRoot?: string): string {
  if (!name) return 'Unknown';
  const manifest = loadManifestCanonicals(projectRoot);
  const lower = name.toLowerCase().trim();
  if (manifest.authorCanonical.has(lower)) return manifest.authorCanonical.get(lower)!;
  return name;
}

/**
 * Resolve a title to its canonical manifest title_raw value.
 * Handles Latin/alternate forms (De Anima → On The Soul (De Anima)).
 */
export function resolveTitle(title: string, projectRoot?: string): string {
  if (!title) return title;
  const manifest = loadManifestCanonicals(projectRoot);
  const lower = title.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  if (manifest.titleCanonical.has(lower)) return manifest.titleCanonical.get(lower)!;
  return title;
}

/**
 * Get all known titles for a given author from the manifest.
 */
export function getAuthorTitles(authorRaw: string, projectRoot?: string): string[] {
  const manifest = loadManifestCanonicals(projectRoot);
  return manifest.authorTitles.get(authorRaw) || [];
}

/**
 * Check if a SINGLE title belongs to an author. Private helper for isValidAuthorTitlePair.
 */
function checkSingleTitle(
  authorTitleList: string[],
  citedTitle: string,
  titleCanonical: Map<string, string>,
): boolean {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
  const citedNorm = normalize(citedTitle);
  if (!citedNorm) return false;

  for (const validTitle of authorTitleList) {
    const validNorm = normalize(validTitle);
    if (validNorm === citedNorm) return true;
    // Substring match with length guard: prevents long multi-work strings
    // from matching a short single title (e.g., "physics de anima and being and time"
    // should NOT match "physics" via substring). Require the shorter string to be
    // at least 50% the length of the longer string.
    const shorter = Math.min(validNorm.length, citedNorm.length);
    const longer = Math.max(validNorm.length, citedNorm.length);
    if (shorter >= longer * 0.5) {
      if (validNorm.includes(citedNorm) || citedNorm.includes(validNorm)) return true;
    }
  }

  const resolvedTitle = titleCanonical.get(citedNorm);
  if (resolvedTitle && authorTitleList.includes(resolvedTitle)) return true;

  return false;
}

/**
 * Check if an author-title pairing is valid in the corpus manifest.
 * Handles multi-work citations (e.g., "Physics; De Anima; Rhetoric")
 * with a three-step cascade:
 *   1. Exact match on full string
 *   2. Split on , and ; → strip leading "and" → validate each
 *   3. Conditional split on "and" (only if both halves are valid)
 */
export function isValidAuthorTitlePair(author: string, title: string, projectRoot?: string): boolean {
  const manifest = loadManifestCanonicals(projectRoot);

  const authorLower = author.toLowerCase().trim();
  const canonicalAuthor = manifest.authorCanonical.get(authorLower) || author;

  const authorTitleList = manifest.authorTitles.get(canonicalAuthor);
  if (!authorTitleList || authorTitleList.length === 0) return false;

  // Step 1: Exact match on full title string (catches "Being and Time" etc.)
  if (checkSingleTitle(authorTitleList, title, manifest.titleCanonical)) {
    return true;
  }

  // Step 2: Split on commas and semicolons, strip leading/trailing "and"
  const subTitles = title.split(/[,;]/)
    .map(t => t.trim().replace(/^and\s+/i, '').replace(/\s+and$/i, '').trim())
    .filter(Boolean);

  if (subTitles.length > 1) {
    // Strict all-pass: every sub-title must be valid for this author
    const allValid = subTitles.every(sub => {
      // Try direct match first
      if (checkSingleTitle(authorTitleList, sub, manifest.titleCanonical)) return true;
      // Step 3: Conditional "and" split — only if both halves are valid
      if (/\band\b/i.test(sub)) {
        const andParts = sub.split(/\band\b/i).map(p => p.trim()).filter(Boolean);
        if (andParts.length === 2) {
          return andParts.every(part => checkSingleTitle(authorTitleList, part, manifest.titleCanonical));
        }
      }
      return false;
    });
    return allValid;
  }

  // Single title that didn't match — try conditional "and" split as last resort
  if (/\band\b/i.test(title)) {
    const andParts = title.split(/\band\b/i).map(p => p.trim()).filter(Boolean);
    if (andParts.length === 2) {
      return andParts.every(part => checkSingleTitle(authorTitleList, part, manifest.titleCanonical));
    }
  }

  return false;
}

/**
 * Get the authority tier for a title from the manifest.
 * Returns 'primary', 'secondary', 'tertiary', or undefined if not found.
 */
export function getTitleAuthority(titleRaw: string, projectRoot?: string): string | undefined {
  const manifest = loadManifestCanonicals(projectRoot);
  return manifest.titleAuthority.get(titleRaw);
}

/**
 * Build a tiered corpus catalog string for injection into LLM prompts.
 * Groups works by authority tier for clear primary/secondary distinction.
 */
export function buildCorpusCatalog(projectRoot?: string): string {
  const manifest = loadManifestCanonicals(projectRoot);
  if (manifest.authorTitles.size === 0) return '';

  const primary: string[] = [];
  const secondary: string[] = [];
  const tertiary: string[] = [];

  for (const [author, titles] of manifest.authorTitles.entries()) {
    for (const title of titles) {
      const tier = manifest.titleAuthority.get(title) || 'secondary';
      const line = `- ${author}: ${title}`;
      if (tier === 'primary') primary.push(line);
      else if (tier === 'tertiary') tertiary.push(line);
      else secondary.push(line);
    }
  }

  const sections: string[] = ['AVAILABLE CORPUS WORKS (only suggest from this list):'];
  if (primary.length > 0) sections.push('PRIMARY TEXTS:', ...primary);
  if (secondary.length > 0) sections.push('SECONDARY SCHOLARSHIP:', ...secondary);
  if (tertiary.length > 0) sections.push('TERTIARY/ANTHOLOGIES:', ...tertiary);

  return sections.join('\n');
}

/**
 * Load compiled-index.json via the shared centralized loader (Task #21).
 * Derives sourceAuthor/targetAuthor on hooks at first load.
 */
export function getCompiledIndex(projectRoot?: string): CompiledIndex | null {
  const parsed = loadCompiledIndexShared(projectRoot) as CompiledIndex | null;
  if (!parsed) return null;

  // Derive author names from sourceText/targetText (one-time, idempotent)
  if (!_hooksDerivationDone) {
    for (const hook of (parsed.crossPipelineHooks || [])) {
      if (!hook.sourceAuthor || hook.sourceAuthor === 'Unknown') {
        hook.sourceAuthor = deriveAuthor(hook.sourceText);
      }
      if (!hook.targetAuthor || hook.targetAuthor === 'Unknown') {
        hook.targetAuthor = deriveAuthor(hook.targetText);
      }
    }
    _hooksDerivationDone = true;
  }

  return parsed;
}

/**
 * Extract author name from hook text label, returning the FULL author_raw
 * value that matches ChromaDB metadata for exact-match filtering.
 *
 * Maps abbreviations and short names to the canonical manifest author_raw format.
 * This mapping must stay in sync with the corpus manifest.
 */
function deriveAuthor(text?: string): string {
  if (!text) return 'Unknown';

  // Static abbreviation map for hook text labels that won't appear in manifest
  const ABBREVIATION_MAP: Record<string, string> = {
    'b&t': 'Heidegger, Martin',
    'bt': 'Heidegger, Martin',
    'bcap': 'Heidegger, Martin',
    'being and time': 'Heidegger, Martin',
    'ga 29/30 via uexkull': 'Heidegger, Martin',
  };

  const lower = text.toLowerCase().trim();

  // 1. Check static abbreviations first (B&T, BCAP etc.)
  if (ABBREVIATION_MAP[lower]) return ABBREVIATION_MAP[lower];

  // 2. Check manifest-derived canonical author table (H-05)
  const manifest = loadManifestCanonicals();
  if (manifest.authorCanonical.has(lower)) return manifest.authorCanonical.get(lower)!;

  // 3. Check if text is a work title that maps to an author via manifest
  const resolvedTitle = manifest.titleCanonical.get(lower.replace(/[^a-z0-9\s]/g, '').trim());
  if (resolvedTitle) {
    // Find which author owns this title
    for (const [author, titles] of manifest.authorTitles.entries()) {
      if (titles.includes(resolvedTitle)) return author;
    }
  }

  // 4. Standard format: "Author - Title"
  const dashIdx = text.indexOf(' - ');
  if (dashIdx > 0) {
    return text.slice(0, dashIdx).trim();
  }

  // 5. Fallback: substring match against manifest authors
  for (const [key, value] of manifest.authorCanonical.entries()) {
    if (lower.includes(key) && key.length >= 5) return value;
  }

  return text.trim();
}

// ---- Additive Dimensional Scoring ----

/**
 * Compute match score for a hook against facet topic words.
 * Scores source and target independently, then sums:
 *   Exact match (topic word IS the concept) = 2 points
 *   Substring match (topic word IN concept or vice versa) = 1 point
 *   No match = 0 points
 * Dual-match (both sides) gets up to 4 points.
 */
function computeMatchScore(hook: CrossPipelineHook, normalizedTopics: string[]): number {
  let score = 0;
  const sourceLower = (hook.sourceConcept || '').toLowerCase();
  const targetLower = (hook.targetConcept || '').toLowerCase();

  const checkMatch = (bridgeConcept: string): number => {
    if (!bridgeConcept) return 0;
    // Full/exact match: topic word equals the concept
    if (normalizedTopics.includes(bridgeConcept)) return 2;
    // Substring match: topic word contains concept or concept contains topic word
    if (normalizedTopics.some(t => bridgeConcept.includes(t) || t.includes(bridgeConcept))) return 1;
    return 0;
  };

  score += checkMatch(sourceLower);
  score += checkMatch(targetLower);

  return score;
}

// ---- Public API ----

/**
 * Detect which cross-pipeline hooks are active for a given set of topic words.
 *
 * Uses bounded OR matching (fires if source OR target matches) with:
 *  - Minimum 5-char filter to exclude noise words
 *  - Additive dimensional scoring (dual-match boosted)
 *  - Tag confidence tie-breaking (INTERP-high > INTERP-medium)
 *  - Hard cap of 1 bridge per facet to prevent prompt derailment
 */
export function getActiveBridges(
  facetTopicWords: string[],
  projectRoot?: string,
): CrossPipelineHook[] {
  const index = getCompiledIndex(projectRoot);
  if (!index) return [];

  const hooks = index.crossPipelineHooks || [];
  if (hooks.length === 0) return [];

  // Filter noise, keep only specific terms (>= 5 chars)
  const normalizedTopics = facetTopicWords
    .filter(w => w.length >= 5)
    .map(w => w.toLowerCase());

  if (normalizedTopics.length === 0) return [];

  const activeBridges: CrossPipelineHook[] = [];

  for (const hook of hooks) {
    const sourceLower = (hook.sourceConcept || '').toLowerCase();
    const targetLower = (hook.targetConcept || '').toLowerCase();

    // Bounded OR: fire if facet touches source OR target
    const matchesSource = normalizedTopics.some(t => sourceLower.includes(t) || t.includes(sourceLower));
    const matchesTarget = normalizedTopics.some(t => targetLower.includes(t) || t.includes(targetLower));

    if (matchesSource || matchesTarget) {
      activeBridges.push(hook);
    }
  }

  // Sort by additive dimensional score -> tag confidence -> deterministic ID
  activeBridges.sort((a, b) => {
    // 1. Combined specificity + dual-match presence
    const scoreA = computeMatchScore(a, normalizedTopics);
    const scoreB = computeMatchScore(b, normalizedTopics);
    if (scoreA !== scoreB) return scoreB - scoreA;

    // 2. Tag confidence
    const confA = a.tag?.includes('high') ? 2 : a.tag?.includes('medium') ? 1 : 0;
    const confB = b.tag?.includes('high') ? 2 : b.tag?.includes('medium') ? 1 : 0;
    if (confA !== confB) return confB - confA;

    // 3. Deterministic fallback
    return (a.id || '').localeCompare(b.id || '');
  });

  // Hard cap at 1 to prevent LLM word salad
  return activeBridges.slice(0, 1);
}

/**
 * Detect which tension edges are relevant for a given set of topic words.
 * Used by Phase 3 (tension-aware quality gate) to determine which
 * tensions the generated text should acknowledge.
 */
export function getActiveTensions(
  facetTopicWords: string[],
  projectRoot?: string,
): TensionEdge[] {
  const index = getCompiledIndex(projectRoot);
  if (!index) return [];

  const tensions = index.tensionEdges || [];
  if (tensions.length === 0) return [];

  const normalizedTopics = facetTopicWords
    .filter(w => w.length >= 5)
    .map(w => w.toLowerCase());

  if (normalizedTopics.length === 0) return [];

  const activeTensions: TensionEdge[] = [];

  for (const te of tensions) {
    const searchText = [te.nodeA, te.nodeB, te.description].filter(Boolean).join(' ').toLowerCase();
    const matches = normalizedTopics.some(t => searchText.includes(t));
    if (matches) {
      activeTensions.push(te);
    }
  }

  // Sort by relevance (count of matching topic words) and cap
  activeTensions.sort((a, b) => {
    const searchA = [a.nodeA, a.nodeB, a.description].filter(Boolean).join(' ').toLowerCase();
    const searchB = [b.nodeA, b.nodeB, b.description].filter(Boolean).join(' ').toLowerCase();
    const countA = normalizedTopics.filter(t => searchA.includes(t)).length;
    const countB = normalizedTopics.filter(t => searchB.includes(t)).length;
    return countB - countA;
  });

  // Cap at 3 tensions per facet
  return activeTensions.slice(0, 3);
}

/**
 * Expand a retrieval query with canonical ontology terms.
 *
 * Detects known philosophical concepts in the query text and appends their
 * transliterations, Greek script, translations, and aliases so the embedding
 * model activates on ALL variations of the term in the corpus.
 *
 * Example: "Aristotle's account of phantasia" →
 *   "Aristotle's account of phantasia (φαντασία, imagination, appearing)"
 *
 * Synchronous. Uses mtime-cached compiled-index.json.
 */
export function expandQueryWithCanonicalTerms(
  query: string,
  projectRoot?: string,
): string {
  const index = getCompiledIndex(projectRoot);
  if (!index) return query;

  const nodes = (index as any).ontologyNodes || [];
  if (nodes.length === 0) return query;

  let expandedQuery = query;
  const addedTerms = new Set<string>();
  const queryLower = query.toLowerCase();

  for (const node of nodes) {
    const name = (node.name || '').toLowerCase();
    const translit = (node.transliteration || '').toLowerCase();

    // Check if the query contains the primary name or its transliteration
    // Length >= 4 prevents tiny generic words from triggering
    const hasName = name.length >= 4 && queryLower.includes(name);
    const hasTranslit = translit.length >= 4 && queryLower.includes(translit);

    if (hasName || hasTranslit) {
      // Collect missing variations
      const candidates = [
        node.greek,
        node.transliteration,
        node.translation,
        ...(node.aliases || []),
      ];

      for (const term of candidates) {
        if (term && term.length >= 2 && !queryLower.includes(term.toLowerCase()) && !addedTerms.has(term)) {
          addedTerms.add(term);
        }
      }
    }
  }

  if (addedTerms.size > 0) {
    expandedQuery += ` (${Array.from(addedTerms).join(', ')})`;
  }

  return expandedQuery;
}

/**
 * Extract topic words from a facet's name and description.
 * Utility for callers that have a Facet object rather than pre-extracted words.
 */
export function extractTopicWords(name: string, description?: string): string[] {
  const text = [name, description].filter(Boolean).join(' ');
  return text
    .split(/\s+/)
    .map(w => w.replace(/[^a-zA-ZÀ-ÿα-ωΑ-Ω\-]/g, ''))
    .filter(w => w.length >= 4);
}
