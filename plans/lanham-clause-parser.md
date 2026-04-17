# Lanham Clause Parser — Implementation Plan

**Date:** 2026-04-17
**Status:** PROPOSAL — awaiting review
**Prerequisite:** Phases A-F complete, periodic hybrid promotion deployed
**Estimated effort:** 8-12 hours across 6 phases
**New dependencies:** None (uses existing en-pos POS tagger)

---

## 1. What This Builds and Why

A dedicated clause-parsing subsystem that introduces reusable structural representations of English prose, supplementing the current regex/punctuation-based clause detection and creating a path to supersede parts of it if calibration validates the improvement. The current heuristics have hit a documented ceiling on parataxis (0.378 mono) and limit periodicity (0.479 mono T2 ensemble); the clause parser addresses the root cause (missing genuine clause structure) rather than attempting further threshold tuning.

The parser produces a clause graph per sentence — `ClauseNode` objects with linguistic role (matrix, subordinate, relative, coordinate, participial) and attachment relationships — that parataxis and periodicity axes consume as structured input rather than attempting their own ad-hoc clause detection.

**Why now:** The final system report explicitly identifies parataxis as limited by "missing genuine clause nesting depth" and periodicity as compensating for "aggressive clause splitting." Both axes need the same underlying capability: reliable identification of clause boundaries, clause types, and the matrix clause position. Building this as a shared module serves both axes while following the system's established pattern of shared infrastructure in `lanham-shared.ts` consumed through the two-layer controller.

---

## 2. Architecture

### New Files

```
src/god-agent/cli/style/
  lanham-clause-types.ts       — Type definitions (ClauseNode, SentenceClauseParse, etc.)
  lanham-clause-parser.ts      — Parser class with staged pipeline
  lanham-clause-features.ts    — Clause-derived feature extraction for Lanham axes
```

### Modified Files

```
  lanham-shared.ts             — en-pos adapter as ClauseParserBackend
  advanced-lanham-analyzer.ts  — Integrate clause features into Tier 2 parataxis + periodic
  lanham-style-controller.ts   — Shadow mode for clause-derived axes
  tests/calibration/lanham-failure-buckets.test.ts  — Clause-specific regression tests
  tests/calibration/lanham-calibration.test.ts      — Clause-derived axis reporting
```

### Design Principles

1. **Reusable structural service, not a one-off fix.** The parser returns `SentenceClauseParse` objects that any axis can consume. It doesn't compute Lanham scores directly.
2. **Each pipeline stage independently testable.** Tokenization, POS tagging, cue detection, span proposal, attachment, and matrix resolution are separate functions.
3. **No comma hard breaks by default.** Validated by our failure-bucket tests and the Phase E conservative splitter. Commas become boundaries only when supported by finite-verb evidence on both sides.
4. **Shadow mode first.** Clause-derived features enter Tier 2 in shadow mode. Promotion requires the same controller discipline (overall + per-genre + failure-bucket stability) as every other Tier 2 feature.
5. **Performance budget: <100ms for a 500-word passage.** en-pos runs at 525K tokens/sec (POS is not the bottleneck). Span proposal and attachment must be efficient — no exponential search.

---

## 3. Data Model

### `lanham-clause-types.ts`

```typescript
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

export interface SentenceClauseParse {
  sentenceId: string;
  sentenceText: string;
  tokens: ParsedToken[];
  clauses: ClauseNode[];
  matrixClauseId: string | null;
  coordinationGroups: string[][];
  diagnostics: string[];
}

export interface ClauseParseDocument {
  text: string;
  sentences: SentenceClauseParse[];
}
```

---

## 4. Parser Pipeline

### `lanham-clause-parser.ts`

#### Backend Interface

```typescript
export interface ClauseParserBackend {
  tag(tokens: string[]): Array<{ pos: string; lemma?: string }>;
  parse?(tokens: string[]): Array<{ dep: string; head: number; index: number }>;
}
```

Day one: the backend wraps the existing `tagPOS()` from `lanham-shared.ts`. The `parse()` method returns null. This means the initial clause parser is POS-only — an upgrade over regex-only but not yet a full syntactic parser. The optional `parse()` interface is forward-looking infrastructure for a future dependency parser integration without requiring it now.

#### Pipeline Stages

```
1. Sentence segmentation     — reuse existing splitSentences() from lanham-shared.ts
2. Tokenization with offsets  — split on whitespace, preserve punctuation as tokens
3. POS tagging               — via backend.tag() (en-pos adapter)
4. Clause-cue detection       — identify subordinators, relatives, coordinators, finite verbs
5. Clause boundary proposal   — split at high-confidence cues, NOT at bare commas
6. Clause node construction   — assign tentative roles based on cue + POS context
7. Clause attachment          — link subordinate/relative clauses to their parents
8. Matrix clause resolution   — two-pass: identify the true main predication
9. Depth assignment           — compute nesting depth from attachment tree
```

#### Key Design Decision: Provisional Roles + Authoritative Resolver

`buildClauseNodes()` assigns best-effort roles using actual linguistic categories (matrix, adverbial-subordinate, relative, etc.) with explicit confidence scores. A first clause with a finite verb gets `role: 'matrix'` at confidence **0.6** (provisional). A clause introduced by a known subordinator overrides to `role: 'adverbial-subordinate'` at confidence **0.9**.

`resolveMatrixClause()` is then always responsible for the final matrix assignment, using stronger global signals: subordinator presence, clause depth, attachment relations, and position. It filters out clauses that are adverbial-subordinate, relative, or participial, then selects the shallowest-depth finite clause.

This avoids introducing a pseudo-role (`'candidate-matrix'`) that would break the linguistic taxonomy. The role field always holds a real linguistic category, the confidence field captures provisionality, and the resolver has full authority to override initial assignments.

```typescript
// In buildClauseNodes() — provisional role assignment
if (idx === 0 && finiteVerb) {
  role = 'matrix';
  relation = 'root';
  confidence = 0.6; // explicitly provisional — resolver may override
}
// Subordinator always overrides, even at position 0
if (introducedBy && SUBORDINATORS.has(introducedBy) && first.pos === 'IN') {
  role = 'adverbial-subordinate';
  relation = 'subordinate';
  confidence = 0.9;
}

// In resolveMatrixClause() — authoritative resolution with corner-case handling
const candidates = clauses.filter(c =>
  c.finite &&
  c.role !== 'adverbial-subordinate' &&
  c.role !== 'relative' &&
  c.role !== 'participial'
);

// Sort: shallowest depth first, then penalize coordinate/appositive/parenthetical,
// then prefer the clause least preceded by subordination (the rhetorical landing
// point in periodic prose), then span start as final fallback only.
candidates.sort((a, b) => {
  // 1. Shallowest depth first
  const depthDelta = a.depth - b.depth;
  if (depthDelta !== 0) return depthDelta;

  // 2. Penalize coordinate and parenthetical/appositive clauses
  const pen = (c: ClauseNode) =>
    (c.role === 'coordinate' ? 1 : 0) +
    (c.role === 'appositive' || c.role === 'parenthetical' ? 1 : 0);
  const penaltyDelta = pen(a) - pen(b);
  if (penaltyDelta !== 0) return penaltyDelta;

  // 3. Prefer the clause least preceded by subordinate material.
  // Count how many subordinate/relative/participial clauses have spans
  // ending before this clause's span start. The clause with fewer
  // preceding subordinates is more likely to be the rhetorical landing
  // point in periodic prose, where the matrix comes AFTER front-loaded
  // subordination — not the earliest eligible clause.
  const precedingSubord = (c: ClauseNode) =>
    clauses.filter(other =>
      other.id !== c.id &&
      other.span.end <= c.span.start &&
      ['adverbial-subordinate', 'relative', 'participial'].includes(other.role)
    ).length;
  // INVERT: more preceding subordinates = more likely to be the real matrix
  // (it's the clause that all the subordination builds toward)
  const subordDelta = precedingSubord(b) - precedingSubord(a);
  if (subordDelta !== 0) return subordDelta;

  // 4. Final fallback: span start (earliest)
  return a.span.start - b.span.start;
});

return candidates[0]?.id ?? clauses.find(c => c.finite)?.id ?? null;
```

This preserves the ability to use provisional roles in explanations and diagnostics ("the opening clause is adverbial subordinate"), consistent with the label-aligned explanation pattern used elsewhere in the system. The coordinate/appositive penalty handles the "fronted subordinate + coordinate + matrix" pattern common in Lanham's gold set without requiring heavy syntax.

#### Clause-Cue Detection

```typescript
const SUBORDINATORS = new Set([
  'because', 'although', 'though', 'since', 'while', 'if', 'unless', 'when',
  'whenever', 'whereas', 'before', 'after', 'until', 'once', 'provided', 'assuming',
  'inasmuch', 'insofar', 'notwithstanding', 'albeit', 'lest',
]);

const RELATIVE_TAGS = new Set(['WDT', 'WP', 'WP$', 'WRB']);
const FINITE_VERB_TAGS = new Set(['VBD', 'VBP', 'VBZ', 'MD']);

interface ClauseCue {
  tokenIndex: number;
  type: 'subordinator' | 'relative' | 'coordinator' | 'finite-verb'
      | 'participial-opener' | 'parenthetical-mark' | 'semicolon';
  confidence: number;
}
```

Confidence levels aligned with the graded evidence ladder:
- Subordinators (POS-confirmed IN): **0.95**
- Relative pronouns (WDT/WP/WRB): **0.90**
- Coordinators (CC): **0.85**
- Finite verbs (VBD/VBP/VBZ/MD): **0.95**
- Participial openers (VBG/VBN in first 4 tokens): **0.45** — consistent with the existing 0.3x low-confidence weight
- Semicolons: **0.98** — always clause boundaries
- Parenthetical marks (—, commas): **0.40** — candidates only, not hard breaks

#### Clause Boundary Proposal: No Comma Hard Breaks

Commas do NOT create hard clause breaks by default. Boundaries are proposed at:
- Semicolons (always)
- Subordinators (POS-confirmed)
- Relative pronouns (POS-confirmed)
- NOT at bare commas, unless both sides contain a finite verb (indicating two independent clauses separated by comma — a comma splice or coordinate clause after a coordinator)

This directly addresses the failure modes documented in the failure-bucket tests (`list-commas`, `participial-false-positive`).

---

## 5. Clause-Derived Features

### `lanham-clause-features.ts`

```typescript
export interface ClauseDerivedFeatures {
  /** False when the clause parser backend is unavailable or returned empty parses.
   *  When false, all numeric fields are zero and must NOT be used for scoring —
   *  Tier 2 must skip clause-based paths entirely. This distinguishes "parser absent"
   *  from "passage genuinely has no finite clauses" (a fragment-heavy passage). */
  hasClauseData: boolean;
  /** Document-level confidence in the clause parse. Computed from:
   *  - Average matrix-resolution confidence across sentences
   *  - Proportion of sentences that received a non-null matrixClauseId
   *  - Inverse proportion of low-confidence participial cues
   *  Range 0-1. Could be used by the controller to gate clause features
   *  on a per-passage basis ("parser confidence high enough for this text"). */
  parseConfidence: number;
  coordinateClauseRate: number;       // coordinate clauses / total finite clauses
  subordinateClauseRate: number;      // subordinate clauses / total finite clauses
  subordinationDepthMean: number;     // average depth of subordinate clauses
  maxSubordinationDepth: number;      // deepest nesting level
  finiteClauseCount: number;          // total finite clauses in document
  preMainSubordinateRate: number;     // subordinate clauses before matrix / sentence count
  matrixDelayMean: number;            // avg (matrix verb position / sentence length)
}
```

#### Parataxis Features → Tier 2

```typescript
function computeParataxisFromClauses(f: ClauseDerivedFeatures): number {
  const hypotaxisSignal =
    f.subordinateClauseRate * 0.50 +
    Math.min(f.subordinationDepthMean / 2, 1) * 0.25 +
    Math.min(f.maxSubordinationDepth / 4, 1) * 0.15 +
    Math.min(f.preMainSubordinateRate, 1) * 0.10;

  const parataxisSignal =
    f.coordinateClauseRate * 0.60 +
    (f.finiteClauseCount >= 3 ? 0.15 : 0) +
    (f.subordinateClauseRate === 0 ? 0.25 : 0);

  return clamp((hypotaxisSignal - parataxisSignal + 1) / 2);
}
```

Weights are initial estimates — subject to the same grid-search calibration discipline as the Phase E periodic ensemble.

#### Periodic Features → Tier 2

The clause-derived `matrixDelayMean` and `preMainSubordinateRate` become **new signals in the existing periodic ensemble**, not replacements for it. The Phase E ensemble (left-branching index + suspension markers + sentence length) stays as a blending partner because suspension marker detection catches structural patterns (correlative "not only...but also", conditional "if...then") that pure clause parsing might miss if the subordinator isn't POS-tagged correctly.

```typescript
// Updated periodic ensemble with clause-derived signals
periodicRunningScore = weighted_combination(
  leftBranchIndex:       0.25,    // existing: POS-informed verb position
  suspensionMarkers:     0.20,    // existing: regex-based structural signals
  clauseMatrixDelay:     0.30,    // NEW: clause-derived matrix verb position
  clausePreMainSubord:   0.15,    // NEW: clause-derived pre-main subordinates
  sentenceLengthSignal:  0.10,    // existing: short sentences bias running
)
```

Weights are initial estimates. The clause-derived signals get higher weight than the existing signals because they measure the right thing (actual clause structure rather than proxy features), but the existing signals remain for robustness.

---

## 6. Integration with Existing Architecture

### Tier 1: Unchanged

Tier 1 does not use the clause parser. Its parataxis detection (POS "that" disambiguation + graded evidence ladder) and periodic detection (heuristic comma/subordinator analysis) remain the production baseline.

### Tier 2: Clause-Enhanced, Shadow Mode

Tier 2's `analyzeParataxisHypotaxis()` gains clause-derived features as a parallel signal, initially in shadow mode:
- Existing POS-based parataxis: still computed
- Clause-derived parataxis: computed and logged, not used for production scoring
- Controller policy: `parataxisHypotaxis.allowOverride = false` (unchanged)

Tier 2's `analyzePeriodicRunning()` gains clause-derived signals blended into the existing ensemble:
- The ensemble already uses T2 scores in production (hybrid promotion)
- Adding clause-derived signals to the ensemble changes the T2 score
- This requires recalibration of the periodic ensemble weights

### Controller: AXIS_OVERRIDE_POLICY + AXIS_OWNERSHIP

No changes to the ownership model on day one. The clause parser is infrastructure that feeds Tier 2; the controller decides what reaches production.

**Explicit promotion rules (encoded in AXIS_OVERRIDE_POLICY):**

### Parataxis: Full Promotion Gate (Tier 1 → Tier 2 ownership change)

Clause-derived parataxis promotion requires ALL of:
1. **Primary gate (monotonicity):** Clause-derived parataxis monotonicity exceeds Tier 1 baseline by **at least +0.05** (i.e., ≥0.428) on the 40-passage gold set — not just >0.378, to avoid chasing sampling noise on a small set
2. **Secondary gate (agreement — no regression):** Clause-derived parataxis agreement does not degrade by more than 5% from Tier 1 baseline (i.e., ≥37.5%). Agreement is a "must not degrade" check, not a "must improve" requirement, because the gold set's parataxis labels are coarse (3 categories) and a real ranking gain may not shift enough passages across label boundaries to improve categorical agreement.
3. No genre group with n≥3 degrades by more than **0.05** monotonicity
4. All clause-specific failure-bucket tests pass
5. No new failure modes detected in the clause-specific tests

Until all 5 criteria are met, `AXIS_OVERRIDE_POLICY.parataxisHypotaxis.allowOverride` stays `false` and `AXIS_OWNERSHIP.parataxisHypotaxis.scoreSource` stays `'tier1'`.

### Periodic: Weight Recalibration Gate (within existing Tier 2 ownership)

Periodic already uses Tier 2 as score source in hybrid configuration. Adding clause-derived signals to the ensemble is a **weight recalibration**, not a new promotion. The gate is therefore modest:
1. No monotonicity regression >0.02 from current T2 ensemble baseline (0.479)
2. No new failure-bucket failures
3. No genre group with n≥3 degrades by more than 0.05

This is explicitly less strict than the parataxis full-promotion gate because periodic is not changing axis ownership — it's updating weights within an already-promoted ensemble.

### What Happens to Existing Detection

| Component | After Clause Parser | Rationale |
|-----------|-------------------|-----------|
| Tier 1 parataxis (POS + evidence ladder) | Stays as production baseline | Parser hasn't earned promotion yet |
| Tier 2 parataxis (B3 "that" disambiguation) | Supplemented by clause features, shadow mode | Clause features are more structural |
| Tier 1 periodic (heuristic) | Stays as label source | Labels derive from Tier 1 |
| Tier 2 periodic ensemble | Augmented with clause signals | Clause delay is a better signal than left-branching index alone |
| Phase E conservative clause splitter | Superseded for clause-level signals once parser is stable. During rollout, periodic ensemble uses clause parser for matrixDelay/preMainSubord and old splitter for any remaining legacy segment features. **Deprecation target:** remove old splitter entirely after Phase 6 promotion decision, to avoid two parallel "clause-ish segment" mechanisms silently diverging. | The parser is a proper replacement; parallel mechanisms are a maintenance risk |

---

## 7. Rollout Phases

### Phase 1: Types + Facade + Backend Adapter (1-2 hours)

- Create `lanham-clause-types.ts` with all type definitions
- Create `lanham-clause-parser.ts` with the `LanhamClauseParser` class skeleton and `ClauseParserBackend` interface
- Add en-pos adapter in `lanham-shared.ts`: `createEnPosBackend(): ClauseParserBackend`
- Verify the facade compiles and produces basic tokenized output on a test passage
- **Gate:** Types compile, facade instantiates, POS tags produced

### Phase 2: Core Clause Extraction (2-3 hours)

- Implement `detectClauseCues()` — subordinator, relative, coordinator, finite-verb, participial, semicolon detection
- Implement `proposeClauseSpans()` — no comma hard breaks, split at subordinators/semicolons/relatives
- Implement `buildClauseNodes()` — tentative role assignment (NO premature matrix assignment)
- Implement `attachClauses()` — link subordinate/relative to parents
- Implement `resolveMatrixClause()` — two-pass matrix resolution
- Implement `assignDepths()` — compute nesting depth from attachment tree
- **Gate:** Parser produces correct clause graphs for 5 hand-verified test sentences

### Phase 3: Feature Extraction + Shadow Integration (2-3 hours)

- Create `lanham-clause-features.ts` with `extractClauseFeatures()`
- Add `computeParataxisFromClauses()` and `computePeriodicSignalsFromClauses()`
- Wire into Tier 2: clause features computed alongside existing analysis
- Parataxis: clause features logged in shadow mode (not blended into score)
- Periodic: clause-derived `matrixDelayMean` and `preMainSubordinateRate` added to ensemble
- **Gate:** Tier 2 produces clause-derived features without errors; existing test suite passes

### Phase 3.5: Diagnostics + Dev Tools (30 min)

- Populate `diagnostics: string[]` on each `SentenceClauseParse`:
  - When resolver overrides provisional matrix: `"matrix-overrode-initial: s1_c3 over s1_c1"`
  - When a comma-splice boundary is created (finite verbs on both sides): `"comma-splice-boundary: token 12"`
  - When participial opener is detected but treated as low-confidence: `"participial-low-conf: token 0 VBG"`
- Create `scripts/lanham-clause-view.ts` — lightweight CLI tool that takes a passage on stdin, runs `LanhamClauseParser`, and pretty-prints the clause tree showing spans, roles, depths, and diagnostics. Useful during calibration for diagnosing gold-set mismatches.
- **Gate:** Diagnostics populate correctly on 3 test passages (one running, one periodic, one mixed)

### Phase 4: Failure-Bucket Tests (1 hour)

Add clause-specific regression tests:

```typescript
// In lanham-failure-buckets.test.ts
it('clause parser: does not split list commas into clauses', () => { ... });
it('clause parser: distinguishes demonstrative that from subordinate that', () => { ... });
it('clause parser: detects delayed matrix clause in periodic structure', () => { ... });
it('clause parser: identifies matrix in periodic "if...if...if...then" pattern', () => { ... });
it('clause parser: handles semicolon-separated independent clauses', () => { ... });

it('clause parser: handles coordination + embedded subordination', () => {
  // "He came, and when the bell rang, he left."
  // This is mixed: coordination ("and") plus embedded subordination ("when").
  // The parser should NOT flatten it into pure coordination or pure subordination.
  const doc = parser.parseDocument('He came, and when the bell rang, he left.');
  const roles = doc.sentences[0].clauses.map(c => c.role);
  expect(roles).toContain('coordinate');
  expect(roles).toContain('adverbial-subordinate');
  // Should have 3 clauses: "He came" (matrix), "when the bell rang" (subordinate),
  // "he left" (coordinate with matrix)
  expect(doc.sentences[0].clauses.filter(c => c.finite).length).toBeGreaterThanOrEqual(2);
});
```

- **Gate:** All new failure-bucket tests pass; all existing 19 tests pass

### Phase 5: Calibration (1-2 hours)

- Run full calibration suite on the 40-passage gold set
- Compare clause-derived parataxis (shadow) against existing parataxis (Tier 1)
- Compare clause-augmented periodic ensemble against current ensemble
- Genre-stratified reporting for n≥3 groups
- Score-vs-label quality separation
- Log corpus-level clause statistics for the 40-passage gold set:
  - Mean `finiteClauseCount` per sentence
  - Distribution of `ClauseRole` types (proportion matrix, subordinate, relative, coordinate, participial, fragment)
  - Mean `matrixDelayMean` across the set
  - These numbers provide a "shape" of the parser's behavior and serve as a baseline if a dependency parser is later introduced behind `parse()`
- Log resolver override statistics:
  - Percent of sentences where initial matrix guess was overridden by `resolveMatrixClause()`
  - Percent of overridden cases in passages ultimately scored as highly periodic (matrixDelayMean > 0.5)
  - Percent of overrides triggered by subordinate-openers vs. coordinate/appositive penalties vs. "most preceded by subordination" rule
  - This is a fast reality check on whether the two-pass resolver is doing useful work or just creating churn
- **Gate:** No existing axis degrades >0.02 monotonicity. Clause-derived parataxis shows improvement over Tier 1 baseline (0.378) in shadow comparison.

### Phase 6: Promotion Decision (1 hour)

Based on Phase 5 calibration, each axis reaches one of three explicit outcomes:

**Parataxis outcomes (using the full 5-criterion promotion gate):**

- **Outcome A — Stay in shadow:** Gains are promising (monotonicity trending upward, some genre groups improve) but below the +0.05 gate or unstable across genres. Action: keep `AXIS_OVERRIDE_POLICY.parataxisHypotaxis.allowOverride = false`. Document findings. Clause features remain in Tier 2 shadow mode for continued observation.

- **Outcome B — Promote score source only:** Monotonicity gate passes (≥0.428), agreement does not degrade (≥37.5%), per-genre and failure-bucket criteria met. Action: set `allowOverride = true`, set `AXIS_OWNERSHIP.parataxisHypotaxis.scoreSource = 'tier2'`, keep `labelSource = 'tier1'`. This mirrors the existing periodic hybrid pattern — Tier 2 provides better ranking, Tier 1 provides labels until cutpoints are recalibrated.

- **Outcome C — Keep Tier 1 ownership:** Gains disappear under genre/failure-bucket review, or clause features introduce new failure modes. Action: keep current Tier 1 ownership unchanged. Document what went wrong. The clause parser remains as infrastructure for future use.

**Periodic outcomes (using the modest weight-recalibration gate):**

- **Recalibrate:** No regression >0.02, no failure-bucket failures, no genre n≥3 degradation >0.05. Action: adopt new ensemble weights with clause-derived signals included.

- **Revert:** Regression detected. Action: remove clause signals from ensemble, keep existing weights.

- **Gate:** Each axis has a documented outcome with explicit controller state changes (or documented "not yet met").

---

## 8. Performance Considerations

**Target:** <100ms for a 500-word passage on a single core.

**Estimated breakdown:**
- Sentence splitting: <1ms (reuse existing `splitSentences()`)
- Tokenization: <1ms (whitespace split)
- POS tagging: ~1ms (en-pos at 525K tokens/sec, 500 tokens = <1ms)
- Cue detection: <1ms (single pass over tokens)
- Span proposal: <1ms (sorted breakpoint iteration)
- Clause building + attachment: <5ms (linear scan with parent lookup)
- Matrix resolution: <1ms (filter + sort)
- Feature extraction: <1ms (aggregate over clause graph)

**Total estimated: <10ms.** Well within the 100ms budget. If profiling shows otherwise, the first optimization target is the POS tagger call (batch sentences to amortize startup).

**Micro-benchmark (required):** Add `scripts/lanham-clause-bench.ts` that runs the parser over 10 synthetic 500-word passages and asserts mean runtime under 100ms. This runs as part of Phase 2 gate validation.

**Feature-flag fallback:** If clause parsing needs to be disabled in a constrained environment (e.g., missing en-pos dependency), Tier 1 parataxis/periodic logic must still function unchanged. The clause parser is an additive capability, not a replacement for the base analyzer.

Specific behavior when backend is unavailable:
- `LanhamClauseParser.parseDocument()` returns a document with `sentences` populated but `clauses: []` and `matrixClauseId: null` on each sentence.
- `extractClauseFeatures()` returns zeroed features (all rates = 0, all counts = 0).
- Tier 2 `analyzeParataxisHypotaxis()` and `analyzePeriodicRunning()` must explicitly check `if (!clauseFeatures.hasClauseData)` and **skip clause-based paths entirely** — not attempt to blend zeroed values into ensemble weights. This is clearer than checking `finiteClauseCount === 0`, which is ambiguous (could mean "parser absent" or "passage is all fragments").
- This prevents NaN from propagating into axis scores when clause infrastructure is absent.

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Clause parser introduces parataxis regressions | Medium | Medium | Shadow mode first; failure-bucket gates; Tier 1 stays as production baseline |
| Matrix resolution fails on complex periodic sentences | Medium | Low | Two-pass design prevents premature assignment; fallback to existing ensemble |
| Performance exceeds budget | Low | Low | POS is fast; clause logic is linear; profiling before promotion |
| Overengineering for current needs | Medium | Low | Types are simple; parser is staged; Phase 6 promotion is optional |
| POS tagger errors propagate into clause structure | Medium | Medium | Confidence scores on cues; low-confidence cues (participial) don't create hard breaks |

---

## 10. What This Does NOT Do

- Does not add a dependency parser. The `parse()` backend method is optional and stays null.
- Does not replace Tier 1's production parataxis detection. That stays until clause features earn promotion.
- Does not replace the Phase E periodic ensemble. Clause signals augment the ensemble.
- Does not change any labels, thresholds, or controller ownership. Those change only after Phase 6 calibration validates the improvement.
- Does not touch voice, register, opacity, or nounVerb. The clause parser serves parataxis and periodicity only.
