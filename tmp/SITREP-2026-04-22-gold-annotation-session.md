# SITREP — Gold-Set Annotation Session
**Date:** 2026-04-22
**Branch:** `writing-pipeline-v2`
**Working sandbox:** `/home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/production-sandbox`
**Session context:** Continued from SITREP-2026-04-21. This session built out CONVENTIONS.md + drift-log.md governance, then annotated 10 items under max-effort-per-claim discipline.

---

## 0. Broader project context — the analysis-upgrade program

### 0.1 What is the analysis-upgrade project?

A multi-phase program to upgrade the claim-extraction + resolver + active-claims infrastructure in claudeflow-testing's writing pipeline, isolated from the live codebase until final promotion. Executed inside `tmp/analysis-upgrade/`, which contains:

- `MASTER-PLAN.md` — the overall plan governing phases 2-6
- `00-TODO.md`, `01-baseline-report.md`, `02-research-synthesis.md`, `03-implementation-plan.md`, `04-final-summary.md` — planning docs
- `SYSTEM-REVIEW-GAPS.md` — gap analysis
- `production-sandbox/` — **our work directory** (where gold annotation lives)
- `integration-sandbox/` — sibling sandbox for Phase 6 promotion integration
- `perplexity/` — external-research companion
- `sandbox/` — early-phase experimental space
- `claim-extractor-upgrade/` — Phase 2/3 scaffolding for extractor work

### 0.2 Phase ladder (MASTER-PLAN)

| Phase | Purpose | Status |
|---|---|---|
| 2 | Consumer wiring (TS interfaces, `loadActiveClaims`, prompt emission, pipeline threading, extractor scripts, taxonomy prompt revisions) | **COMPLETE** ✅ (per `PHASE-2-STATUS.md`; O1 gate passing 2026-04-19) |
| 3a | Canary extraction — 4 secondary-lit papers (Frede 1992, O'Gorman 2005, Bowin 2017, White 1985) → 786 claims, 1979 concept mentions, $4.53 spend | **COMPLETE / PASS** ✅ (per `PHASE-3A-CANARY-REPORT.md`; compound gate cleared) |
| 3b | Full extraction (remaining secondary + primary corpus) | Completed (per the commit log earlier in the repo; compiled-index.v2.json result is the ontology we're labeling against) |
| **4** | **Gold-set labeling — human-annotated `{claim → ontology nodes}` ground truth** | **IN PROGRESS — this session's work** |
| 5 | E-step ladder (E0 baseline → E1-E8 resolver optimization measured against the gold set) | Not started; gated on Phase 4 |
| 6 | Promotion to live (atomic artifact swap; TS and data isolation released) | Not started; gated on Phase 5 |

### 0.3 What the Phase 4 gold set is for

The resolver is the component that maps extracted claims to ontology nodes. Phase 5 measures the resolver's F1 across eight E-step configurations (E0 = baseline no-op, E1-E8 = progressively tuned variants) against the Phase 4 gold set.

**Without a frozen gold set, E0 cannot be measured, and the E1-E8 ladder cannot run formally.** Our 70-item target (50 dev + 20 holdout) is the minimum corpus to get statistically meaningful F1 per genre. Holdout is locked after E0; dev is iterated on during E1-E8 tuning.

### 0.4 Isolation mechanics (why we're in `production-sandbox/`)

- TypeScript isolation: edits go under `src-worktree/src/`; top-level repo untouched until Phase 6 atomic promotion
- Data isolation: `CORPUS_INDEX_PATH` env var points at sandbox index; TS loader falls back to live if unset
- Release bundles: artifact activation is atomic via `scripts/activate-release.sh N`
- Worktree branch: `writing-pipeline-v3` (based on commit `54c2ba1fe`, tag `pre-promotion-20260419`)

**Nothing our annotation work touches the live codebase.** All changes are confined to `data/gold/` and `scripts/validate-gold-notes.sh` inside the sandbox.

### 0.5 Parallelism permitted

Per `production-sandbox/README.md`:
- Phase 3 batch (API-bound) can overlap with Phase 4 gold labeling (human-bound) — different artifact paths
- Phase 5 E3/E4 (human curation) can overlap with Phase 5 E1/E2 (parameter sweeps)
- No overlap at Phase 6 promotion

### 0.6 Key artifacts in the sandbox

- `data/corpus/index/compiled-index.v2.json` — **the ontology we label against** (7389 nodes, post-Phase-3b)
- `data/corpus/index/ARTIFACT-MANIFEST.json` — tracks active release version
- `data/corpus/index/releases/release-N.json` — atomic release bundles
- `data/prompts/canonical-suite.json` — 6 frozen prompts with SHA256
- `data/gold/README.md` — gold-set authoring protocol (distribution targets, item schema, workflow, lock discipline)

### 0.7 Our relationship to the broader project

This session's work (gold-set annotation) is **Phase 4 exclusively**. Everything in this SITREP's subsequent sections is Phase 4 scope. Phase 5 onward is downstream (gated on us); Phase 3b is upstream (produced the compiled-index we're labeling against); Phase 2 is infrastructure (enables the labels to actually be used).

---

## 1. Where we are

**Committed:** 10 / 70 items (14.3%) → holdout file: `data/gold/resolver-gold-holdout.jsonl`

| Genre | Committed | Target | Status |
|---|---|---|---|
| primary_aristotle | 6 | 6 | ✓ complete |
| primary_heidegger | 4 | 4 | ✓ complete |
| secondary_phantasia | 0 | 5 | next |
| secondary_modern_philosophy | 0 | 5 | queued |
| **holdout total** | **10** | **20** | **50%** |
| dev total | 0 | 50 | not started |

**In-flight at session end:** Item 127 (`claim-papachristou-2013-127`) walked through in full procedure; **5-item label set `["Imagination", "Perception", "Movement/Change", "Actuality", "Soul"]` proposed awaiting user confirmation + 3 drift-log additions queued (attribution-scope observation for 127, second rich-rich-duplication-trace, primary→secondary concept-reuse trace). Not yet committed.**

Validator state: OK (0 violations) as of last successful run.

---

## 2. Artifacts — file inventory

### Core annotation
- `data/gold/resolver-gold-holdout.jsonl` — 10 lines, validator-clean
- `data/gold/resolver-gold-dev.jsonl` — **not created yet** (empty file / template only)
- `data/gold/CONVENTIONS.md` — locked governance document (see §3 below)
- `data/gold/drift-log.md` — 32 entries: 9 CONVENTIONS-edit events + 6 pattern-watch registrations + 11 observations (counted) + 6 trace observations (bare middle field)

### Tooling
- `scripts/validate-gold-notes.sh` — executable, enforces em-dash/pipe padding, character substitutes, sentinel pairing
- `ontology-names.txt` — 7389-line sorted list of ontology node names for grep-based node-existence checks

### Candidate pools (not yet annotated)
- `data/gold/candidates/holdout-secondary_phantasia.sample.jsonl` — 15 candidates; recommended set = {127, 069, 100, 049, 138}
- `data/gold/candidates/holdout-secondary_modern_philosophy.sample.jsonl` — 15 candidates; not yet inspected
- `data/gold/candidates/dev-*.sample.jsonl` — 4 files, 150 total candidates (dev set)

### Backups (timestamped, append-only)
- `.backups/` directory has ~15+ timestamped backups per edit batch. All include `MANIFEST.json` explaining the change. Most recent pre-commit state preserved.

---

## 3. CONVENTIONS.md — state as of session end

Section structure:
- §1 How this document is written (every rule cites its trigger)
- §2 Flag grammar (AF / PL syntax, ALL_CAPS placeholder convention for prose)
- §3 Parking lot
  - **§3.0 Node-choice principle** (thinness corroborative not determinative; rich-preferred unless scope-exceedance)
  - §3.0 **rich-vs-strict tension corollary** (rich-preferred default; override on scope-exceedance)
  - §3.1 PL: flag grammar
  - §3.2 Named patterns table (ontology-synonymy, object-of-type-canonicalization, paraphrase-distortion + 4 deferred patterns)
- §4 Flag codes (AF4, AF5, AF6 with examples + non-examples + decision procedures)
- §5 Retrieval paths (jq-first; grep convenience)
  - **§5.4 Partial-faithfulness verification procedure** (two-file jq snippets, slug→path mapping, hand-off to PL:paraphrase-distortion)
- §6 Validator
- §7 Governance (back-sweep required; umbrella-consolidation note)
- §8 Review cadence
  - **§8.0 Pattern-watch trigger scans** (items 10 & 20; canonical recipe; middle-field-match + ALL_CAPS PLACEHOLDER recipe-hardening)
  - §8.1 Item-25 convention-validation checkpoint + **edit-velocity counter with interim trigger at count ≥10 before item 20** + **distribution-review by 5-item window**
  - §8.2 Every-25-items drift check
  - §8.3 Final pre-lock consistency check
  - §8.4 Drift-log entry types
- §9 Deferrals
- §10 Quick reference

**CONVENTIONS-edit velocity:** 9 edits / 10 items = 0.9 edit/item. Interim-checkpoint trigger fires at **count ≥10** — **one more CONVENTIONS edit will fire the interim checkpoint**.

---

## 4. Active pattern-watches (6 registered)

| Pattern | Observations (canonical recipe) | Trigger condition | Status |
|---|---|---|---|
| `slug-graveyard` | 1 | ≥2 more by item 20 | 1 of 2 |
| `AF5-subtype-proliferation` | 0 | 4th subtype OR ≥5 total AF5 instances | 3 subtypes, 4 AF5 instances; evaluated at item-25 |
| `wrong-context-rich-canonical` | 2 | ≥3 total instances | **at threshold** (2 obs + 1 registration = 3); evaluated at item-25 |
| `wrong-context-rich-canonical-framework-validity` | 1 | (informational — flip side confirmation) | ongoing |
| `attribution-scope-not-referent` | 0 (pending 127) | ≥3 total instances | 1 of 3 (079 registration + 127 pending) |
| `context-sensitive-canonicalization` | 0 | ≥2 more cases by item 20 | 0 of 2 additional |
| `heidegger-technical-upgrade-default` | 4 | first genuine rejection (rigorously defined) OR item-25 | 4 accepts / 0 rejections; evaluated at item-25 |

**Traces (non-counting observations):**
- `rich-rich-duplication-trace`: 1 (fourth instance observed at 127 — increment pending); §3.0 corollary coverage
- `retrospective-logging-mechanism`: 1 (procedural precedent for back-populating pattern-watch observations)
- `drift-log-middle-field-rename`: 1 (procedural precedent for renaming middle-field tokens)
- `s54-procedure-first-activation`: documented via bare `observation` entry at 066 (first real §5.4 run, passed cleanly)

---

## 5. Annotated items — summary

| Item | Genre | Labels | Notable flags/observations |
|---|---|---|---|
| 058 | primary_aristotle | Perception, common sensibles, incidental perception | PL:ontology-synonymy; PL:object-of-type-canonicalization |
| 007 | primary_aristotle | point, unity, divisible | AF4:two; AF5:Time (analogical-target); AF4+AF5:discriminating-faculty; slug-graveyard pattern-watch triggered |
| 033 | primary_aristotle | Imagination, Emotion | PL:ontology-synonymy; AF5:opinion (elided-contrast); second slug-graveyard instance observed |
| 053 | primary_aristotle | Perception, Actuality, Movement/Change | AF5:Imagination (definitional-target — third AF5 subtype); rich-rich-duplication noted twice |
| 037 | primary_aristotle | Imagination, Perception, Actuality, brutes | §3.0 paraphrase-scope applied (animals → brutes); no AF5 (passage-level argumentative) |
| 039 | primary_aristotle | Perception, Imagination, true, false | wrong-context-rich-canonical pattern-watch triggered (Truth→Heideggerian mis-denotation) |
| 091 | primary_heidegger | Dasein, Being-in-the-world, Discourse | first Heideggerian item; flip side of wrong-context-rich-canonical; heidegger-technical-upgrade observation #1 |
| 079 | primary_heidegger | Logos | attribution-scope-not-referent triggered ("For the Greeks"); context-sensitive-canonicalization pattern-watch triggered (speaking→Discourse vs Logos) |
| 036 | primary_heidegger | concept, conceptuality, Disclosedness | heidegger-technical-upgrade #3 (visible→Disclosedness after passage review) |
| 066 | primary_heidegger | proprium, genus, species, Essence | **first §5.4 activation** (passed: elaboration, not distortion); heidegger-technical-upgrade formally registered at n=4 |

---

## 6. What remains

### Holdout (10 items to go)

**secondary_phantasia** (5 items needed) — RECOMMENDED SET from session:
1. `claim-papachristou-2013-127` — **walked through, awaiting commit** (see §7 resume instructions)
2. `claim-white-1985-069` — attribution-scope test ("Aristotle's analysis...")
3. `claim-ogorman-2005-100` — PARTIAL faithfulness, §5.4 second activation
4. `claim-nussbaum-1985-049` — "Sensory phantasia for Aristotle..." attribution + specialized subtype
5. `claim-frede-1992-138` — phantasiai as imprints, fifth author

**secondary_modern_philosophy** (5 items needed) — not yet inspected. Expected to surface:
- `PL:paraphrase-distortion` genuine cases (modern philosophy paraphrasing)
- Ontology gaps requiring AF4 flags (supervenience, qualia, emergence — contemporary concepts likely missing from ontology)
- Wrong-context-rich-canonical rejection cases (Heideggerian Truth/Fear/animal nodes may appear and be rejected in modern-philosophy contexts)
- `wrong-context-rich-canonical` pattern-watch is at threshold — first of these items could push it to evaluation

### Dev (50 items to go)

Distribution: 15 primary_aristotle + 10 primary_heidegger + 15 secondary_phantasia + 10 secondary_non_phantasia.
Candidates files exist under `data/gold/candidates/dev-*.sample.jsonl`. Not yet inspected.

### Checkpoints

- **Item-10 pattern-watch trigger scan** (§8.0): due now (we're at item 10). Quick scan to verify no triggers have fired since last check. Five minutes.
- **Item-20 pattern-watch trigger scan** (§8.0): horizon for slug-graveyard, context-sensitive-canonicalization, etc.
- **Item-25 convention-validation checkpoint** (§8.1): the big one. Full CONVENTIONS re-read + all items checked + edit-velocity review + distribution shape + pattern-watch re-evaluation (especially for `wrong-context-rich-canonical` at threshold and `heidegger-technical-upgrade-default` at n=4).
- **Interim-checkpoint trigger** (§8.1): fires at CONVENTIONS-edit count ≥10 before item 20. **Currently at 9** — one more edit triggers interim checkpoint.

### Final pre-lock consistency check

Per `README.md` §7 (not our CONVENTIONS §8.3): re-review 15 randomly-chosen dev items after all 50 are labeled; if ≥3 of 15 change on second pass → second pass before lock.

---

## 7. Resume instructions

### To resume item 127 (in-flight)

Item 127 (`claim-papachristou-2013-127`) was walked through but **not committed**. Pending user decisions:

1. Confirm label set `["Imagination", "Perception", "Movement/Change", "Actuality", "Soul"]` — specifically whether to include `Actuality` (parallel to 053's "actual sensation" treatment) or drop as overly inferential for noun-form "activity of sensation"
2. Confirm "Aristotle characterizes" treated as attribution-scope (second instance of pattern)
3. Confirm 3 drift-log additions:
   - (a) Observation entry for attribution-scope-not-referent triggered by 127
   - (b) Second rich-rich-duplication-trace observation (Soul vs ψυχή)
   - (c) Primary→secondary concept-reuse framework-validity observation

Last message in conversation was my walk-through presenting these decisions. Scroll back to find the proposed JSONL line + the three drift-log entry drafts.

### Resume prompt for next session

> Read `tmp/SITREP-2026-04-22-gold-annotation-session.md`. We were mid-way through item 127 (secondary_phantasia Papachristou 2013-127) — walk-through complete, awaiting my decisions on label set, attribution-scope treatment, and three drift-log additions. Re-present the item-127 proposal and my decisions. If I confirm as-drafted, execute commit + drift-log entries + validator.

### Services needed for next session

- vLLM: **not required** for annotation work (annotation is Claude-side, ontology lookups are local jq)
- Embedding: not required for annotation
- God Agent services: not required for annotation
- Just Claude Code + file access

### State verification on resume

```bash
# From project root:
cd /home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/production-sandbox
bash scripts/validate-gold-notes.sh  # should return OK (0 violations)
wc -l data/gold/resolver-gold-holdout.jsonl  # should be 10
grep -c '^2026-' data/gold/drift-log.md  # should be 32
jq -c '{id: .claim_id, labels: .expected_ontology_nodes}' data/gold/resolver-gold-holdout.jsonl
```

---

## 8. User preferences saved to memory (carry across sessions)

- **Max effort on gold-set annotations** (`~/.claude/.../memory/feedback-annotation-max-effort.md`) — per-item max-reasoning, no batch-shortcuts, ontology verification per node, full flag-condition checks, decision-confirmation per item.
- **Backup before changes** (pre-existing) — timestamped `.backups/` before multi-file edits. Honored consistently this session.
- **Plan review process** (pre-existing) — multi-round review; this session repeatedly exercised.

---

## 9. Framework-state observations worth the next session's attention

1. **CONVENTIONS is stabilizing.** Items 8-10 produced 1 CONVENTIONS edit total (the §8.1 distribution-review addition). Earlier items 4-6 produced 5 edits. Clear deceleration — framework absorbing new cases without further codification. This is the expected "latent patterns surfacing early" shape.

2. **`heidegger-technical-upgrade-default` is at n=4 consecutive accepts with no rejections.** Strong codification candidate at item-25. Scope question flagged in registration entry: does it apply to all primary_heidegger or specifically BCAP-style material? First secondary_phantasia items will test whether the pattern extends to secondary-literature-about-Aristotle.

3. **`wrong-context-rich-canonical` at threshold.** 2 observations + 1 registration = 3 total. At item-25, will likely promote to PL code. First secondary_modern_philosophy items are likely to surface more rejection cases (Heideggerian Truth/Fear/animal on contemporary philosophy of mind claims), potentially accelerating promotion before item-25.

4. **Attribution-scope-not-referent** pattern is real and recurring (2 instances so far — 079, 127-pending). Will almost certainly hit threshold on secondary-literature items (every "Frede argues...", "Nussbaum claims..." triggers it).

5. **The `s54-procedure-first-activation` trace confirms** the partial-faithfulness verification procedure works as designed on real data. Future partial items should follow the same pattern.

6. **The rich-rich-duplication pattern is settling** at n=4-5 instances. §3.0 corollary covers it. Item-25 should verify the corollary is producing consistent choices across all instances.
