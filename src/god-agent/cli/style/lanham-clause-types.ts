/**
 * lanham-clause-types.ts — Type definitions for the clause parsing subsystem.
 *
 * The clause parser produces reusable structural representations (not scores).
 * Consumers (parataxis, periodicity) extract features from these structures.
 *
 * Key design decisions:
 * - ClauseNode stores both linguistic role AND attachment relationship
 * - SentenceClauseParse includes a matrixClauseId pointer for periodic analysis
 * - coordinationGroups for parataxis coordination counting
 * - diagnostics[] for resolver override logging and calibration debugging
 */

// ── Clause taxonomy ──────────────────────────────────────────────────────────

export type ClauseRole =
  | 'matrix'
  | 'coordinate'
  | 'adverbial-subordinate'
  | 'relative'
  | 'complement'
  | 'participial'
  | 'appositive'
  | 'parenthetical'
  | 'fragment';

export type ClauseRelation =
  | 'root'
  | 'coordinate'
  | 'subordinate'
  | 'relative-modifier'
  | 'complement'
  | 'adjunct'
  | 'parataxis'
  | 'unknown';

// ── Token and span types ─────────────────────────────────────────────────────

export interface TokenSpan {
  start: number;
  end: number; // exclusive token index
}

export interface ParsedToken {
  i: number;
  text: string;
  lemma?: string;
  pos: string;       // Penn Treebank tags from en-pos
  dep?: string;      // optional — null until dependency parser added
  head?: number;     // optional — null until dependency parser added
}

// ── Clause-cue detection ─────────────────────────────────────────────────────

export type ClauseCueType =
  | 'subordinator'
  | 'relative'
  | 'coordinator'
  | 'finite-verb'
  | 'participial-opener'
  | 'parenthetical-mark'
  | 'semicolon';

export interface ClauseCue {
  tokenIndex: number;
  type: ClauseCueType;
  confidence: number; // 0..1
}

// ── Clause node ──────────────────────────────────────────────────────────────

export interface ClauseNode {
  id: string;
  sentenceId: string;
  span: TokenSpan;
  role: ClauseRole;
  relationToParent: ClauseRelation;
  parentClauseId: string | null;
  introducedBy?: string;
  headVerbToken?: number;
  finite: boolean;
  depth: number;
  confidence: number; // 0..1
}

// ── Sentence-level parse ─────────────────────────────────────────────────────

export interface SentenceClauseParse {
  sentenceId: string;
  sentenceText: string;
  tokens: ParsedToken[];
  clauses: ClauseNode[];
  matrixClauseId: string | null;
  coordinationGroups: string[][];
  diagnostics: string[];
}

// ── Document-level parse ─────────────────────────────────────────────────────

export interface ClauseParseDocument {
  text: string;
  sentences: SentenceClauseParse[];
}

// ── Proposed span (internal pipeline type) ���──────────────────────────────────

export interface ProposedSpan {
  start: number;
  end: number;
  trigger?: ClauseCueType;
}
