# Dev Annotation Execution Plan — Locked 2026-04-28

**Status:** Plan-critique loop converged across two iterative cycles. Locked structurally. Awaiting operational "go" to begin Unit A.
**Working sandbox:** `/home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/production-sandbox`
**Branch:** `writing-pipeline-v2`
**Predecessor work:** Holdout 20/20 complete; item-20 §8.0 trigger scan logged; dev-candidate inspection complete.

---

## Overall goal

Move from holdout-complete (20 items locked, pending E0 baseline) into the **50-item dev annotation phase** of the analysis-upgrade gold-set construction. Dev annotation is the second half of Phase 4 (the gold-set labeling phase) of the broader analysis-upgrade program. Once dev is complete (50/50), the full 70-item gold set is ready for Phase 5 E-step ladder (E0 baseline + E1-E8 resolver optimization).

The plan structures the transition from holdout-mode (single-stream annotation) to dev-mode (annotation + accumulating evidence for item-25 deferred decisions + structured pre-staging of codification work). The plan exists because the transition has procedural complexity that cold-start would mishandle: 7 deferred decisions awaiting evidence accumulation, item-25 codifications needing pre-staged language, ordering-discipline that defends against selection bias, and infrastructure (dev jsonl, drafts directory, inspections directory) that doesn't exist yet.

---

## Decisions locked by the plan-critique loop

### Decision 1: Inspections artifact-type
- Create `data/gold/inspections/` directory
- First entry: `inspections/dev-inspection-item-20.md` (full report from current session, covers all 50 dev candidates per item-25 deferred decision)
- Index file: `inspections/README.md` documenting artifact-type contract (what counts as inspection, when produced, retention policy)
- Framework-maturity meta-observation logged as footer of `dev-inspection-item-20.md` (not separate artifact at n=1)

### Decision 2: Item-25 firing scope (revised from 3 codifications to 2)
- **FIRE AT ITEM-25:** load-bearing-modifier formalization (5 precedents); slug-graveyard primary-vs-secondary distinction (5 secondary-author clusters)
- **DEFER (with explicit early-trigger):** surface-variant taxonomy. Hard horizon: item-50 §8.2 every-25 drift check. Early trigger: if 5th mechanism surfaces during dev (e.g., multi-foreign-language synonymy at any BCAP predecessor_report or papachristou-Aquinas item), promote to formal evaluation immediately.
- **CONTINUE WAITING:** AF5 splitting; attribution-scope joint-eval; cross-author-concept-collision sub-modes; heidegger-technical-upgrade-default scope. All await dev evidence accumulation.

### Decision 3: Dev annotation ordering
- **Pure Option A (stratified-random within genres) with seeded RNG.** No front-loading.
- **Seed: 20260422.** Encodes date discipline was established (item-1 of holdout).
- Rationale documented in `data/gold/dev-ordering.md` (three-sentence form locked).
- Pre-computed sequence for all 50 items committed before first dev annotation.
- Lock-against-silent-change: seed not to be changed mid-stream; if reproducibility breaks (e.g., dev-candidate file modified), document the reason and new seed as addendum.

### Decision 4: Pre-staging codification language
- Create `data/gold/drafts/` directory (after verifying §8.1 counter scope)
- Pre-stage load-bearing-modifier and slug-graveyard codifications with acceptance criteria:
  - (a) Validator-passing (em-dash discipline, etc.)
  - (b) `Triggered by:` lines per §1 CONVENTIONS rule
  - (c) Exact back-sweep scope enumerating items + exact notes-field anchor strings
- Iterative validator runs during pre-staging (not check-at-end)

### Decision 5: Verification before validator extension
- Before extending validator to scan `drafts/`, grep CONVENTIONS §8.1 trigger language to confirm script edits don't increment Type B counter
- If script edits don't trigger counter (expected), extend validator
- If they do (unexpected), make validator extension a §8.1-aware decision

### Decision 6: Pre-dev checklist (revised, sequenced)
1. Verify holdout 20/20 committed and validated (gate)
2. Verify item-20 §8.0 trigger scan recorded as Type A drift-log entry (gate)
3. Inspections directory + report + meta-observation footer logged
4. Dev-ordering documented with seed + rationale + pre-computed sequence
5. Edit-velocity state explicitly verified (count=10, framework-settled distribution, no silent CONVENTIONS edit queued)
6. §8.1 counter scope verified for validator extension; drafts/ created if confirmed
7. Empty `resolver-gold-dev.jsonl` created; holdout lock-discipline confirmed
8. Pre-stage codifications in drafts/ with acceptance criteria + iterative validator runs
9. Backup CONVENTIONS.md + drift-log.md + resolver-gold-holdout.jsonl + drafts/ contents under timestamped pre-dev-snapshot directory

### Decision 7: Resume ritual codified
- 30-second on-resume verification: validator run + pattern-watch canonical-recipe greps for each registered pattern
- Avoid CONVENTIONS edits in first session-message after a break (cold-start risk)
- Item-completion is the natural break-point (don't break mid-item)

### Decision 8: Interim procedural checks during dev
- **dev-5:** general evidence-accumulation scan (flag any deferred decision likely to have <2 cases by dev-25)
- **dev-20:** §8.0-style trigger scan (symmetric with holdout-20 cadence)
- **dev-25:** fire item-25 checkpoint with 2 ready codifications + 5 deferred-with-explicit-trigger-conditions carried forward

---

## Cognitive-unit batched execution sequence

| Unit | Step | Action |
|---|---|---|
| **A — Artifact setup** | 0 | Create `data/gold/inspections/` and `data/gold/drafts/` directories |
| **A** | 1 | Verify holdout 20/20, validator OK, item-20 scan logged (gate) |
| **A** | 2 | Log inspection report at `inspections/dev-inspection-item-20.md` |
| **A** | 3 | Append framework-maturity meta-observation as footer of inspection report |
| **A** | 3b | Create `inspections/README.md` documenting artifact-type contract for inspections |
| **B — Discipline + infra** | 4 | Document dev ordering principle + seed (20260422) + rationale + pre-computed sequence in `dev-ordering.md` |
| **B** | 5 | Verify edit-velocity state (no silent CONVENTIONS edit queued) |
| **B** | 6 | Verify §8.1 counter scope (grep-confirm script edits don't increment) → extend validator to scan `drafts/` if confirmed |
| **B** | 6b | Create empty `resolver-gold-dev.jsonl` + confirm holdout lock-discipline |
| **C — Pre-staging + backup** | 7 | Pre-stage load-bearing-modifier + slug-graveyard codification language in `drafts/` with acceptance criteria, iterative validator runs during pre-staging |
| **C** | 8 | Backup all artifacts under timestamped pre-dev-snapshot directory (includes drafts/ contents) |
| **D — Real work** | 9 | Begin dev annotation per documented ordering |
| **D** | 10 | Interim check at dev-5 (general evidence-accumulation scan) |
| **D** | 11 | Interim check at dev-20 (§8.0-style trigger scan) |
| **D** | 12 | Fire item-25 at dev-25 (overall item 45) with 2 ready codifications + 5 deferred-with-explicit-trigger-conditions |

**Cognitive framing for execution:** three pre-dev setup units (A, B, C) then real work (D onward). The 12-step table is procedural, not cognitive — pre-dev setup shouldn't dominate attention.

---

## Pre-staged dev-inspection-item-20 content (for reference)

The full inspection report content is in conversation history (system message: "Run dev-candidate inspection per option 2..."). Key findings to migrate to the artifact at step 2:

**Per-decision evidence availability** (summary):
- AF5 subtype-proliferation: abundant elided-contrast/definitional-target evidence; 3-4 framework-specificity candidates that could confirm 4th subtype (horgan 091/213, oconnor-wong 114, fodor 021, chalmers 491, mcdonnell-wildman 146/213, audi 249)
- Slug-graveyard: 8 NEW secondary authors in dev pools (Caston, Bowin, Fodor, O'Connor-Wong, Chalmers, Metzinger, Barnes, Raven) — would extend own-cluster pattern from n=5 to n=13
- Heidegger-technical-upgrade: ALL 30 dev primary_heidegger candidates are BCAP (scope question untestable); 5+ predecessor_report rejection candidates (bcap-001/002/006/007/031/032)
- Attribution-scope: 20+ candidates across all 4 syntactic forms with multiple preventive cases (Aquinas, Davidson, Morgan, Loraux, etc.)
- Load-bearing-modifier: 15+ borderline candidates, 6+ scope-restricting cases
- Cross-author-concept-collision: 16+ cases plus 2 new potential sub-modes (multi-author-shared-concept, self-attribution-with-author-name)
- Surface-variant taxonomy: 4-5 candidates for 5th mechanism (multi-foreign-language synonymy strongest)

**Recommendation:** mixed strategy at item-25 — fire load-bearing-modifier + slug-graveyard primary-vs-secondary; defer surface-variant + AF5 + attribution-scope + cross-author-collision + heidegger-scope until partial dev evidence accumulates.

---

## Resume instructions for next session

### To resume

> Read `tmp/SITREP-2026-04-28-plan-ready-for-execution.md` and `tmp/dev-annotation-execution-plan-2026-04-28.md`. Plan-critique loop converged across two iterative cycles. Awaiting operational "go" on Unit A (artifact setup). Confirm "execute Unit A" or override.

### State verification on resume (30-second resume ritual per Decision 7)

```bash
cd /home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/production-sandbox
bash scripts/validate-gold-notes.sh                               # should return OK
wc -l data/gold/resolver-gold-holdout.jsonl                       # should be 20
grep -c '^2026-' data/gold/drift-log.md                           # should be 80+
grep -c "## 2026-04-22 — item-20" data/gold/drift-log.md          # should be 1
ls data/gold/inspections/ 2>/dev/null || echo "inspections/ not yet created"
ls data/gold/drafts/ 2>/dev/null || echo "drafts/ not yet created"
ls data/gold/resolver-gold-dev.jsonl 2>/dev/null || echo "dev jsonl not yet created"
```

If all 3 directories/files report "not yet created," plan is at pre-execution state (correct).

### What's left after this plan executes

- **Dev annotation: 50 items** across stratified-random ordering with seeded RNG
- **Item-25 fire** at dev-25 (overall item 45): 2 codifications (load-bearing-modifier + slug-graveyard primary-vs-secondary)
- **Item-50** equivalent at dev-50 (overall item 70): final pre-lock checks per README §7
- **Holdout LOCK** after E0 baseline measurement (Phase 5 entry)
- **Phase 5 E-step ladder** (E0-E8 resolver optimization measured against gold set) — not started, gated on Phase 4 (gold-set complete)
- **Phase 6 promotion** (atomic artifact swap to live) — gated on Phase 5

---

## Why this plan exists

Three reasons:

1. **Procedural complexity:** the transition from holdout to dev has 7 deferred decisions, 4 new artifact types (inspections/, drafts/, dev jsonl, dev-ordering.md), validator extension considerations, and cross-session-consistency requirements. Cold-starting the dev phase without the plan would miss several of these.

2. **Pre-staging discipline:** item-25 codification of load-bearing-modifier and slug-graveyard primary-vs-secondary requires CONVENTIONS-edit-quality language with `Triggered by:` lines, validator-passing format, and exact back-sweep anchors. Deriving this language at item-25 firing time risks rough drafts; pre-staging during the dev phase makes item-25 execution rather than derivation.

3. **Selection-bias defense:** the dev-candidate inspection identified evidence-rich items for each deferred decision. Without the seeded-RNG ordering discipline, cognitive temptation to front-load evidence-rich items (whether consciously or unconsciously) would compromise the deferred decisions' evidence quality. The seed-and-document-pre-computed-sequence is the structural defense.

The plan operationalizes these three concerns as Units A-C (setup + infrastructure + pre-staging) before Unit D (the actual dev annotation work). Unit D is the deliverable; Units A-C are necessary infrastructure that the holdout phase didn't require.

---

## Addenda (lock-against-silent-change log)

### Addendum 2026-04-28 (dev-5) — dev-20 scope extension

**Trigger:** surface-variant 5th-mechanism scope locked at dev-5 (locked plan Decision 2 early-trigger fire on `claim-heidegger-bcap-067`); item-25 codification load shifted from 2-fire-definite + surface-variant-contingent to 3-fire-definite (load-bearing-modifier + slug-graveyard primary-vs-secondary + surface-variant 5-mechanism).

**Extension:** dev-20 step (locked-plan Decision 8 §8.0-style trigger scan) extended to include surface-variant 5-mechanism draft skeleton kickoff, analogous to Unit C's first-iteration drafts for load-bearing-modifier and slug-graveyard-split. Pre-staging iterations distribute across dev-22/23/24 (plan-critique cycles on the draft as evidence accumulates), matching the iterative pattern that worked for the Unit C drafts (multiple revisions before validator-clean). Dev-25 fires surface-variant 5-mechanism alongside the other two definite codifications.

**Cycle structure preserved:** no new pre-staging interval introduced; only dev-20's scope is widened. dev-20's §8.0-style scan runs cleanly (its original locked-plan purpose) alongside the codification-drafting kickoff; the subsequent pre-staging iterations interleave with dev annotation work at dev-22/23/24 rather than being crammed into dev-20.

**Reasoning for fixing this now (vs at dev-20):** the scope extension is a planning decision, not a scan-time discovery. Deciding it at dev-20 would mean the planning happens under the time-pressure of the scan-and-prepare session itself; deciding it now means dev-20 walks in with a known agenda and the pre-staging work is paced across the cycle rather than crammed.

**Cross-reference:** dev-5 close-out reasoning + locked plan Decision 4 acceptance criteria for codification drafts (validator-passing, `Triggered by:` lines, exact back-sweep anchors) carry forward to surface-variant 5-mechanism draft; the early-trigger fire at dev-5 confirmed the 5th mechanism (multi-foreign-language synonymy) so the draft can be authored against a locked 5-mechanism scope rather than a contingent 4-vs-5 scope.
