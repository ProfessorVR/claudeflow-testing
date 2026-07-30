# Remediation 2026-04-28 — Operative-Source Ambiguity

**Status:** Phase 1 complete; Phase 2 in progress.
**Trigger:** dev-6 retroactive ontology-source verification at start of dev-6 annotation; finding propagated to dev-3/4/5 records and derived drift-log entries.
**Plan-critique convergence:** v4 (4 cycles).
**Pre-remediation snapshot:** `.backups/pre-remediation-snapshot-20260428T214901Z/` (23 files, 580K, holdout md5 anchor preserved at `2c6f1f7e76c7fc7192a5d4dfba515a59`).

---

## Phase 1 audit-summary

### §1.1 Operative-source verification — PASS

| Source | Path | Node count | Status |
|---|---|---|---|
| compiled-index.json | `data/corpus/index/compiled-index.json` (→ `compiled-index.v2.json`) | 7,389 | **OPERATIVE** |
| ontology-embeddings.jsonl | `data/corpus/index/ontology-embeddings.jsonl` | 277 | embedded subset for resolver fuzzy-matching |

Per-node fields in compiled-index: `name`, `greek`, `transliteration`, `definition`, `aliases`, `centralityTier`, `type`, `text`, `translation`, `units`. README §6 line 99 + retrieval recipe at line 138 both reference compiled-index as the source.

### §1.2 Reading C verification — PASS (rich-preferred-when-concept-matches)

| Test | Holdout sample | Result |
|---|---|---|
| Holdout labels in 7,389 set | 56 of 56 | ✓ |
| Holdout labels in 277-embedded set | 12 of 56 | thin slugs in 277-embedded inadequate |
| claim-033 (Imagination rich + phantasia thin) | labeled `Imagination` (rich) | rich-preferred ✓ |
| claim-091 (Discourse rich + speaking thin) | labeled `Discourse` (rich) | rich-preferred ✓ |
| claim-058 (common sensibles thin; no rich concept-match at correct level) | labeled `common sensibles` (thin) | thin-when-no-rich-alternative ✓ |

Reading C: full 7,389 is operative; rich-preferred when both rich and thin concept-match; thin labeled when no rich alternative passes Tests 1-3 + Checks 3-4.

### §1.3 Rich-preferred-with-thin-fallback interaction — PASS

Confirmed via §1.2 test cases. Reading C operationalized as: rich-preferred holds unless rich rejected by concept-match (Test 1) / no-richer-alternative (Test 2) / scope-exceedance (Check 3) / wrong-context (Check 4); thin-slug fallback governed by §3.2 surface-variant convention (Check 5) and compound-vs-compositional decision (Check 6).

### §1.4 Six-check candidate-enumeration discipline — PASS

Committed to `data/gold/protocols/candidate-enumeration-protocol-v1.md`. Includes:
- §1.4a jq query template (definition-level access)
- §1.4b Three-test sub-protocol (concept-match / no-richer-alternative / thinness-corroborative)
- §1.4c Six-check protocol (presence / rich-concept-match / scope-exceedance / wrong-context / surface-variant / compound)
- §1.4d Flagging-disposition vs. labeling-disposition distinction (cross-author-concept-collision and other §3.2 deferred rows are flagging-only, NOT labeling checks)

### §1.5 Primary-referent-vs-predicate-content discipline — PASS

Committed to `candidate-enumeration-protocol-v1.md` §1.5 section.

**Holdout audit findings (basis for the discipline):**
- 20 holdout items
- Mean labels/item: 3.45
- Range: 1-8
- Distribution: 1 label (2 items), 2 labels (2 items), 3 labels (8 items), 4 labels (5 items), 5 labels (1 item), 6 labels (1 item), 8 labels (1 item)
- Implicit discipline: label primary referents + load-bearing predicates; exclude decorative predicates and setting (unless flagging-disposition applies)

Working classification protocol established with four role categories: primary referent / load-bearing predicate / decorative predicate / setting.

If §1.5 surfaces ambiguity in README §6 / CONVENTIONS regarding formal specification: flagged as item-25 §6-codification-clarification candidate.

### Verification artifacts (jq query test results)

Surface concepts from dev-3/4/5 verified against compiled-index:

| Surface concept | In compiled-index | centralityTier | Definition source |
|---|---|---|---|
| `unpredictability` | ✓ | peripheral | Concept introduced via O'Connor & Wong |
| `emergence` | ✓ | peripheral | Concept introduced via Barnes |
| `metaphysical features` | ✓ | peripheral | Concept introduced via O'Connor & Wong |
| `reduction` | ✓ | peripheral | Concept introduced via Audi |
| `bridge law` | ✓ | peripheral | Concept introduced via Fodor |
| `predicate` | ✓ | peripheral | Concept introduced via Audi |
| `physical predicates` | ✓ | peripheral | Concept introduced via Fodor |
| `accidens` | ✓ | peripheral | Concept introduced via Heidegger |
| `συμβεβηκός` | ✓ | peripheral | Concept introduced via Heidegger |
| `accident` | ✓ | peripheral | Concept introduced via Fodor |
| `βούλησις` | ✓ | peripheral | Concept introduced via Papachristou |
| `wish` | ✓ | peripheral | Concept introduced via Papachristou |

Rich-canonical name-match check across these concepts: **0 matches at core/important/medium tier.** All dev-3/4/5 surface concepts are peripheral-tier-only (thin slugs).

dev-2 surface concepts (Mind/nature/capacity/forms): rich canonicals all `core` tier (Thought / Intellect, Nature, Potentiality / Capacity, Form). Rich-preferred holds; dev-2 labels stand pending §2.2 full protocol verification.

---

## Phase 1 → Phase 2 Gate Check

| Gate item | Required state | Status |
|---|---|---|
| §1.1 operative-source verification | confirmed (compiled-index = 7,389 nodes; ontology-embeddings.jsonl = embedded subset) | ✓ PASS |
| §1.2 Reading C verification | holds with definition-level evidence | ✓ PASS |
| §1.3 rich-preferred-with-thin-fallback interaction | confirmed via Reading C test cases | ✓ PASS |
| §1.4 candidate-enumeration discipline (six checks) | committed to candidate-enumeration-protocol-v1.md | ✓ PASS |
| §1.4a jq query template | tested against dev-3/4/5 surface concepts; committed | ✓ PASS |
| §1.4b three-test sub-protocol | committed | ✓ PASS |
| §1.4d flagging-disposition note | committed | ✓ PASS |
| §1.5 primary-referent discipline | established + holdout audit committed | ✓ PASS |
| `data/gold/protocols/candidate-enumeration-protocol-v1.md` | committed | ✓ PASS |
| `data/gold/protocols/remediation-2026-04-28.md` (with audit-summary) | committed (this document) | ✓ PASS |
| `data/gold/protocols/README.md` (artifact-type contract) | committed | ✓ PASS |
| Validator | OK (0 violations) | ✓ PASS (verified at Phase 1 close) |

**Gate Check result: PASS — Phase 2 proceeds.**

---

## Root cause analysis (operative-source-ambiguity)

The dev-3/4/5 annotations were authored against the 277-node `ontology-embeddings.jsonl` subset rather than the 7,389-node `compiled-index.json` operative ontology. False-AF4 calls fired when concepts WERE present as peripheral-tier thin slugs.

**Contributing conditions:**
1. README §1's "ontology IS 7,389 nodes; most authoring will reference the ~200 most-connected nodes" framing creates ambiguity between subset-as-default vs. full-ontology-with-rich-preferred reading
2. The 277-node file's name `ontology-embeddings.jsonl` lacks an explicit "subset" qualifier; affordance of the file naming made it easy to mistake the embedded subset for the operative source
3. Dev-1/dev-2 happened to label correctly via the rich-preferred discipline (which doesn't depend on the subset/full distinction); the error didn't surface until dev-3/4/5 produced false-AF4 calls

**Corpus-data-quality observation:** parallels dev-3 dev-holdout-contamination case in shape — file naming + README ambiguity together produced the affordance for the error.

---

## Phase 2 status (in progress)

Per-item atomic phase: 5 items, one at a time. Each item produces:
- (a) Original record + original drift-log entries
- (b) Six-check protocol applied per surface concept
- (c) Primary-referent classification per §1.5
- (d) Flagging review (§1.4d): which §3.2 flag-only rules apply
- (e) Corrected record proposal: `expected_ontology_nodes` + notes flags
- (f) Drift-log retractions (RETRACTED- middle-field tokenization, provisional-pending-item-25)
- (g) Drift-log additions

Atomic per-item commit on approval (validator + state-consistency check before N+1).

See per-item card sections below as Phase 2 progresses.

---

## Phase 3 status (pending Phase 2 completion)

- §4 Locked-plan addendum (conditional on §2.5 Outcomes A-G; preserve-on-revert)
- §5a observation — operative-source-ambiguity (drift-log historical record)
- §5b observation — corpus-data-quality-recommendations (drift-log forward-looking)
- §6 Pattern-watch registrations: `annotation-methodology-must-reference-compiled-index`; `af5-subtype-candidate-5-provisional`
- §7 observation — pre-resumption-verification (separate drift-log entry; 3 random concepts)
- §8 §8.4 clarification cluster expansion to 5 cases (adding amendment-vs-retraction-boundary)
- §9 Final snapshot (parallel to Unit C step 8 pattern)

---

## Item-25 codification candidates emerging from this remediation

1. `annotation-methodology-must-reference-compiled-index` — process-discipline rule belonging to §7-class governance, not §3.2 annotation-pattern table
2. `af5-subtype-candidate-5-provisional` — explicit-enumeration-implicit-instances candidate AF5 5th subtype; rename + codification at item-25
3. Retraction protocol formalization — middle-field-level RETRACTED- tokenization (provisional in this remediation; formalization at item-25 alongside §8.4 cluster)
4. §8.4 clarification cluster (5 cases): locked-plan-driven Type A; registration-prose-as-evidence; registration-vs-observation count; retraction protocol; amendment-vs-retraction-boundary
5. Operative-source disambiguation in README + file rename to `ontology-embeddings.subset.jsonl` or similar (corpus-data-quality recommendation)
