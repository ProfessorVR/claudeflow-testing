/**
 * lanham-clause-parser.ts — Clause parsing subsystem for Lanham prose analysis.
 *
 * Produces reusable structural representations (SentenceClauseParse) that
 * parataxis and periodicity axes consume. Does NOT compute Lanham scores directly.
 *
 * Pipeline stages (each independently testable):
 * 1. Sentence segmentation (reuses splitSentences from lanham-shared)
 * 2. Tokenization with character offsets
 * 3. POS tagging via backend
 * 4. Clause-cue detection
 * 5. Clause boundary proposal (no comma hard breaks by default)
 * 6. Clause node construction (provisional roles with confidence)
 * 7. Clause attachment
 * 8. Matrix clause resolution (two-pass: authoritative resolver)
 * 9. Depth assignment
 *
 * Design principles:
 * - No comma hard breaks without finite-verb evidence
 * - Provisional roles overridden by authoritative resolver
 * - Participial cues are low-confidence (0.45) per graded evidence ladder
 * - Feature-flag fallback: returns empty parses if backend unavailable
 */

import type {
  ClauseParseDocument,
  SentenceClauseParse,
  ParsedToken,
  ClauseNode,
  ClauseCue,
  ClauseCueType,
  ClauseRole,
  ClauseRelation,
  ProposedSpan,
  TokenSpan,
} from './lanham-clause-types.js';
import { splitSentences } from './lanham-shared.js';

// ── Constants ────────────────────────────────────────────────────────────────

const SUBORDINATORS = new Set([
  'because', 'although', 'though', 'since', 'while', 'if', 'unless', 'when',
  'whenever', 'whereas', 'before', 'after', 'until', 'once', 'provided', 'assuming',
  'inasmuch', 'insofar', 'notwithstanding', 'albeit', 'lest',
]);

const COORDINATORS = new Set(['and', 'but', 'or', 'nor', 'yet', 'so']);

const RELATIVE_TAGS = new Set(['WDT', 'WP', 'WP$', 'WRB']);
const FINITE_VERB_TAGS = new Set(['VBD', 'VBP', 'VBZ', 'MD']);

// ── Backend interface ────────────────────────────────────────────────────────

export interface ClauseParserBackend {
  tag(tokens: string[]): Array<{ pos: string; lemma?: string }>;
  parse?(tokens: string[]): Array<{ dep: string; head: number; index: number }>;
}

export interface ClauseParserOptions {
  backend: ClauseParserBackend;
  debug?: boolean;
}

// ── Main parser class ────────────────────────────────────────────────────────

export class LanhamClauseParser {
  private backend: ClauseParserBackend;
  private debug: boolean;

  constructor(opts: ClauseParserOptions) {
    this.backend = opts.backend;
    this.debug = opts.debug ?? false;
  }

  parseDocument(text: string): ClauseParseDocument {
    const sentenceTexts = splitSentences(text);
    const sentences = sentenceTexts.map((s, idx) =>
      this.parseSentence(s, `s${idx + 1}`)
    );
    return { text, sentences };
  }

  parseSentence(sentenceText: string, sentenceId: string): SentenceClauseParse {
    const diagnostics: string[] = [];

    // Stage 1-2: Tokenize
    const rawTokens = tokenizeWithOffsets(sentenceText);
    if (rawTokens.length === 0) {
      return emptyParse(sentenceId, sentenceText);
    }

    // Stage 3: POS tag
    let tagged: Array<{ pos: string; lemma?: string }>;
    try {
      tagged = this.backend.tag(rawTokens.map(t => t.text));
    } catch {
      return emptyParse(sentenceId, sentenceText);
    }

    const tokens: ParsedToken[] = rawTokens.map((t, i) => ({
      i,
      text: t.text,
      lemma: tagged[i]?.lemma,
      pos: tagged[i]?.pos ?? 'NN',
    }));

    // Stage 4: Detect clause cues
    const cues = detectClauseCues(tokens);

    // Stage 5: Propose clause boundaries
    const spans = proposeClauseSpans(tokens, cues);

    // Stage 6: Build clause nodes (provisional roles)
    const rawClauses = buildClauseNodes(tokens, spans, sentenceId, cues, diagnostics);

    // Stage 7: Attach clauses
    const attached = attachClauses(rawClauses);

    // ── Post-stage-5 diagnostics: comma-clause boundaries ──
    for (const span of spans) {
      if (span.trigger === 'semicolon') {
        // 'semicolon' trigger on a non-semicolon token means the comma-clause rule fired
        const triggerToken = tokens[span.start];
        if (triggerToken && triggerToken.text !== ';') {
          diagnostics.push(
            `comma-clause-boundary: span [${span.start}-${span.end}) at token ${span.start}`
          );
        }
      }
    }

    // Stage 8: Resolve matrix clause (authoritative two-pass)
    const matrixClauseId = resolveMatrixClause(attached, diagnostics);

    // Stage 9: Assign depths
    const clauses = assignDepths(attached, matrixClauseId);

    // ── Post-stage-6 diagnostics: participial low-confidence clauses ──
    for (const c of clauses) {
      if (c.role === 'participial') {
        const tok = tokens[c.span.start];
        diagnostics.push(
          `participial-low-conf: clause ${c.id} token ${c.span.start} ${tok?.pos ?? 'UNK'}`
        );
      }
    }

    // Detect coordination groups
    const coordinationGroups = detectCoordinationGroups(clauses);

    return {
      sentenceId,
      sentenceText,
      tokens,
      clauses,
      matrixClauseId,
      coordinationGroups,
      diagnostics,
    };
  }
}

// ── Stage 2: Tokenization ────────────────────────────────────────────────────

interface RawToken {
  text: string;
  charStart: number;
  charEnd: number;
}

function tokenizeWithOffsets(text: string): RawToken[] {
  const tokens: RawToken[] = [];
  // Split on whitespace but keep punctuation as separate tokens
  const regex = /(\S+)/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    let word = match[1];
    const charStart = match.index;

    // Separate trailing punctuation (, . ; : ! ? — – -)
    const trailingPunct = /([,;:!?.—–\-\)\]]+)$/.exec(word);
    if (trailingPunct && word.length > trailingPunct[1].length) {
      const mainWord = word.slice(0, -trailingPunct[1].length);
      tokens.push({ text: mainWord, charStart, charEnd: charStart + mainWord.length });
      for (const ch of trailingPunct[1]) {
        const pStart = charStart + mainWord.length + (trailingPunct[1].indexOf(ch));
        tokens.push({ text: ch, charStart: pStart, charEnd: pStart + 1 });
      }
    } else {
      // Separate leading punctuation (( [ ")
      const leadingPunct = /^([(\["']+)/.exec(word);
      if (leadingPunct && word.length > leadingPunct[1].length) {
        for (const ch of leadingPunct[1]) {
          tokens.push({ text: ch, charStart: charStart, charEnd: charStart + 1 });
        }
        const rest = word.slice(leadingPunct[1].length);
        tokens.push({ text: rest, charStart: charStart + leadingPunct[1].length, charEnd: charStart + word.length });
      } else {
        tokens.push({ text: word, charStart, charEnd: charStart + word.length });
      }
    }
  }
  return tokens;
}

// ── Stage 4: Clause-cue detection ────────────────────────────────────────────

export function detectClauseCues(tokens: ParsedToken[]): ClauseCue[] {
  const cues: ClauseCue[] = [];

  for (const t of tokens) {
    const lower = t.text.toLowerCase();

    // Subordinators (POS-confirmed IN)
    if (SUBORDINATORS.has(lower) && t.pos === 'IN') {
      cues.push({ tokenIndex: t.i, type: 'subordinator', confidence: 0.95 });
    }

    // Relative pronouns (WDT/WP/WRB)
    if (RELATIVE_TAGS.has(t.pos)) {
      cues.push({ tokenIndex: t.i, type: 'relative', confidence: 0.90 });
    }

    // Coordinators (CC)
    if (t.pos === 'CC' && COORDINATORS.has(lower)) {
      cues.push({ tokenIndex: t.i, type: 'coordinator', confidence: 0.85 });
    }

    // Finite verbs
    if (FINITE_VERB_TAGS.has(t.pos)) {
      cues.push({ tokenIndex: t.i, type: 'finite-verb', confidence: 0.95 });
    }

    // Participial opener (VBG/VBN in first 4 tokens)
    if ((t.pos === 'VBG' || t.pos === 'VBN') && t.i < 4) {
      cues.push({ tokenIndex: t.i, type: 'participial-opener', confidence: 0.45 });
    }

    // Semicolons
    if (t.text === ';') {
      cues.push({ tokenIndex: t.i, type: 'semicolon', confidence: 0.98 });
    }

    // Parenthetical marks (low confidence — candidates only)
    if (['—', '–', '(', ')'].includes(t.text)) {
      cues.push({ tokenIndex: t.i, type: 'parenthetical-mark', confidence: 0.40 });
    }
  }

  return cues;
}

// ── Stage 5: Clause boundary proposal ────────────────────────────────────────

export function proposeClauseSpans(tokens: ParsedToken[], cues: ClauseCue[]): ProposedSpan[] {
  if (tokens.length === 0) return [];

  // Collect break points with their trigger type
  const breakpoints = new Map<number, ClauseCueType>();

  for (const cue of cues) {
    if (cue.type === 'semicolon') {
      // Break AFTER the semicolon
      breakpoints.set(cue.tokenIndex + 1, 'semicolon');
    }
    if (cue.type === 'subordinator' || cue.type === 'relative') {
      // Break BEFORE the subordinator/relative
      breakpoints.set(cue.tokenIndex, cue.type);
    }
  }

  // Break at coordinators that precede a finite verb or subordinator.
  // "He came, and when the bell rang, he left" → break at "and"
  // "He ran and jumped" → do NOT break (verb-level coordination, no separate finite clause)
  for (const cue of cues) {
    if (cue.type === 'coordinator') {
      const idx = cue.tokenIndex;
      // Look ahead: does a finite verb OR subordinator follow within 6 tokens?
      const lookahead = tokens.slice(idx + 1, Math.min(tokens.length, idx + 7));
      const hasSubordinatorAhead = lookahead.some(t =>
        SUBORDINATORS.has(t.text.toLowerCase()) && t.pos === 'IN'
      );
      const hasFiniteVerbAhead = lookahead.some(t => FINITE_VERB_TAGS.has(t.pos));
      // Also check: is there a finite verb BEFORE this coordinator? (clause-level coordination)
      const lookback = tokens.slice(Math.max(0, idx - 6), idx);
      const hasFiniteVerbBehind = lookback.some(t => FINITE_VERB_TAGS.has(t.pos));

      if (hasFiniteVerbBehind && (hasSubordinatorAhead || hasFiniteVerbAhead)) {
        breakpoints.set(idx, 'coordinator');
      }
    }
  }

  // Check for comma-separated clauses: comma with finite verb on both sides.
  // This catches:
  // - Comma splices ("He came, he left")
  // - Coordinator + clause ("He came, and he left") — handled above by coordinator logic
  // - Subordinate clause ending at comma, followed by matrix ("if X, you know Y")
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].text === ',') {
      const hasPriorFinite = tokens.slice(Math.max(0, i - 8), i)
        .some(t => FINITE_VERB_TAGS.has(t.pos));
      const nextTokens = tokens.slice(i + 1, Math.min(tokens.length, i + 8));
      const hasPostFinite = nextTokens.some(t => FINITE_VERB_TAGS.has(t.pos));
      // The next non-punctuation token
      const nextContent = nextTokens.find(t => /\w/.test(t.text));
      const nextIsSubordinator = nextContent && SUBORDINATORS.has(nextContent.text.toLowerCase()) && nextContent.pos === 'IN';
      const nextIsCoordinator = nextContent && COORDINATORS.has(nextContent.text.toLowerCase());

      if (hasPriorFinite && hasPostFinite && !nextIsCoordinator && !nextIsSubordinator) {
        // Finite verb on both sides, no coordinator/subordinator after comma
        // → this is a clause boundary (comma splice or subordinate-to-matrix transition)
        if (!breakpoints.has(i + 1)) {
          breakpoints.set(i + 1, 'semicolon'); // treat like a hard boundary
        }
      }
    }
  }

  // Build spans from sorted breakpoints
  const sortedBreaks = [...breakpoints.keys()].filter(b => b > 0 && b < tokens.length).sort((a, b) => a - b);
  const spans: ProposedSpan[] = [];
  let start = 0;

  for (const bp of sortedBreaks) {
    if (bp > start) {
      spans.push({ start, end: bp, trigger: breakpoints.get(bp) });
    }
    start = bp;
  }
  if (start < tokens.length) {
    spans.push({ start, end: tokens.length });
  }

  // Filter out spans with no content words (pure punctuation spans)
  // BUT keep coordinator-only spans (they matter for coordination group detection)
  return spans.filter(span => {
    const slice = tokens.slice(span.start, span.end);
    return slice.some(t => /\w/.test(t.text));
  });
}

// ── Stage 6: Clause node construction ────────────────────────────────────────

export function buildClauseNodes(
  tokens: ParsedToken[],
  spans: ProposedSpan[],
  sentenceId: string,
  cues: ClauseCue[],
  diagnostics: string[],
): ClauseNode[] {
  return spans.map((span, idx) => {
    const slice = tokens.slice(span.start, span.end);
    const first = slice[0];
    const finiteVerb = slice.find(t => FINITE_VERB_TAGS.has(t.pos));
    const hasRelative = slice.some(t => RELATIVE_TAGS.has(t.pos));
    const introducedBy = first?.text?.toLowerCase();

    let role: ClauseRole = 'fragment';
    let relation: ClauseRelation = 'unknown';
    let confidence = 0.4;

    // Provisional matrix: first clause with a finite verb
    if (idx === 0 && finiteVerb) {
      role = 'matrix';
      relation = 'root';
      confidence = 0.6; // provisional — resolver may override
    }

    // Subordinator always overrides, even at position 0
    if (introducedBy && SUBORDINATORS.has(introducedBy) && first.pos === 'IN') {
      role = 'adverbial-subordinate';
      relation = 'subordinate';
      confidence = 0.92;
    } else if (hasRelative) {
      role = 'relative';
      relation = 'relative-modifier';
      confidence = 0.88;
    } else if (first && (first.pos === 'VBG' || first.pos === 'VBN') && idx > 0) {
      role = 'participial';
      relation = 'adjunct';
      confidence = 0.45;
    } else if (finiteVerb && idx > 0 && role !== 'adverbial-subordinate') {
      // Finite clause not introduced by subordinator → coordinate or potential matrix
      role = 'coordinate';
      relation = 'coordinate';
      confidence = 0.70;
    }

    return {
      id: `${sentenceId}_c${idx + 1}`,
      sentenceId,
      span,
      role,
      relationToParent: relation,
      parentClauseId: null,
      introducedBy,
      headVerbToken: finiteVerb?.i,
      finite: Boolean(finiteVerb),
      depth: 0,
      confidence,
    };
  });
}

// ── Stage 7: Clause attachment ───────────────────────────────────────────────

export function attachClauses(clauses: ClauseNode[]): ClauseNode[] {
  if (clauses.length === 0) return clauses;

  // Find provisional root (will be overridden by resolver)
  const root = clauses.find(c => c.role === 'matrix') ?? clauses[0];

  return clauses.map((clause, idx) => {
    if (clause.id === root.id) return { ...clause, parentClauseId: null };

    // Subordinate, relative, participial → attach to preceding clause
    if (
      clause.relationToParent === 'subordinate' ||
      clause.relationToParent === 'relative-modifier' ||
      clause.relationToParent === 'adjunct'
    ) {
      const prev = clauses[idx - 1] ?? root;
      return { ...clause, parentClauseId: prev.id };
    }

    // Coordinate → attach to root
    if (clause.relationToParent === 'coordinate') {
      return { ...clause, parentClauseId: root.id };
    }

    // Default → attach to root
    return { ...clause, parentClauseId: root.id };
  });
}

// ── Stage 8: Matrix clause resolution (authoritative two-pass) ───────────────

export function resolveMatrixClause(
  clauses: ClauseNode[],
  diagnostics: string[],
): string | null {
  if (clauses.length === 0) return null;

  // Filter candidates: finite, not subordinate/relative/participial
  const candidates = clauses.filter(c =>
    c.finite &&
    c.role !== 'adverbial-subordinate' &&
    c.role !== 'relative' &&
    c.role !== 'participial'
  );

  if (candidates.length === 0) {
    // Fallback: any finite clause
    const fallback = clauses.find(c => c.finite);
    return fallback?.id ?? null;
  }

  if (candidates.length === 1) {
    const chosen = candidates[0];
    // Check if resolver overrode the provisional idx=0 matrix
    const provisional = clauses.find(c => c.role === 'matrix');
    if (provisional && provisional.id !== chosen.id) {
      diagnostics.push(`matrix-overrode-initial: ${chosen.id} over ${provisional.id}`);
      // Update the old provisional's role
      provisional.role = provisional.role === 'matrix' ? 'coordinate' : provisional.role;
    }
    chosen.role = 'matrix';
    chosen.relationToParent = 'root';
    chosen.parentClauseId = null;
    return chosen.id;
  }

  // Multiple candidates: sort by depth, then penalties, then subordination precedence
  candidates.sort((a, b) => {
    // 1. Shallowest depth first
    const depthDelta = a.depth - b.depth;
    if (depthDelta !== 0) return depthDelta;

    // 2. Penalize coordinate and parenthetical/appositive
    const pen = (c: ClauseNode) =>
      (c.role === 'coordinate' ? 1 : 0) +
      (c.role === 'appositive' || c.role === 'parenthetical' ? 1 : 0);
    const penaltyDelta = pen(a) - pen(b);
    if (penaltyDelta !== 0) return penaltyDelta;

    // 3. Prefer clause most preceded by subordinate material
    // (the rhetorical landing point in periodic prose)
    const precedingSubord = (c: ClauseNode) =>
      clauses.filter(other =>
        other.id !== c.id &&
        other.span.end <= c.span.start &&
        ['adverbial-subordinate', 'relative', 'participial'].includes(other.role)
      ).length;
    const subordDelta = precedingSubord(b) - precedingSubord(a);
    if (subordDelta !== 0) return subordDelta;

    // 4. Final fallback: span start
    return a.span.start - b.span.start;
  });

  const chosen = candidates[0];
  const provisional = clauses.find(c => c.role === 'matrix');
  if (provisional && provisional.id !== chosen.id) {
    diagnostics.push(`matrix-overrode-initial: ${chosen.id} over ${provisional.id}`);
    if (provisional.role === 'matrix') {
      provisional.role = 'coordinate';
      provisional.relationToParent = 'coordinate';
    }
  }

  chosen.role = 'matrix';
  chosen.relationToParent = 'root';
  chosen.parentClauseId = null;

  return chosen.id;
}

// ── Stage 9: Depth assignment ────────────────────────────────────────────────

export function assignDepths(clauses: ClauseNode[], matrixId: string | null): ClauseNode[] {
  if (clauses.length === 0) return clauses;

  const byId = new Map(clauses.map(c => [c.id, c]));
  const result = clauses.map(c => ({ ...c }));
  const resultById = new Map(result.map(c => [c.id, c]));

  function computeDepth(clause: ClauseNode): number {
    if (clause.id === matrixId || !clause.parentClauseId) return 0;
    const parent = resultById.get(clause.parentClauseId);
    if (!parent) return 0;
    return computeDepth(parent) + (clause.relationToParent === 'coordinate' ? 0 : 1);
  }

  for (const c of result) {
    c.depth = computeDepth(c);
  }

  return result;
}

// ── Coordination group detection ─────────────────────────────────────────────

export function detectCoordinationGroups(clauses: ClauseNode[]): string[][] {
  const groups: string[][] = [];
  const visited = new Set<string>();

  for (const c of clauses) {
    if (visited.has(c.id)) continue;
    if (c.role === 'matrix' || c.role === 'coordinate') {
      // Find all clauses coordinated with this one
      const group = clauses
        .filter(other =>
          other.id === c.id ||
          (other.role === 'coordinate' && other.parentClauseId === c.parentClauseId) ||
          (other.role === 'coordinate' && other.parentClauseId === c.id) ||
          (c.role === 'coordinate' && c.parentClauseId === other.id)
        )
        .map(g => g.id);
      if (group.length >= 2) {
        groups.push(group);
        group.forEach(id => visited.add(id));
      }
    }
  }

  return groups;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function emptyParse(sentenceId: string, sentenceText: string): SentenceClauseParse {
  return {
    sentenceId,
    sentenceText,
    tokens: [],
    clauses: [],
    matrixClauseId: null,
    coordinationGroups: [],
    diagnostics: [],
  };
}
