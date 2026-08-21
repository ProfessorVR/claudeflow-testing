# SITREP — End of Session 2026-05-01 (Item-25a Codification Sub-Session Complete)

**Date:** 2026-05-01 (session close)
**Branch:** `writing-pipeline-v2`
**Working sandbox:** `/home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/production-sandbox`
**Predecessor SITREP:** `tmp/SITREP-2026-04-30-end-of-session-dev-1-through-20-complete.md` (dev-20 close-of-session)
**Resume target:** Resource-planning revision discussion → item-25b authorization
**Milestone:** **Item-25a sub-session COMPLETE** (6 of 6 codification sub-tasks done; 1 of 6 item-25 sub-sessions done)

---

## 0. Overall project goal

Construct a **70-item resolver gold-set (50 dev + 20 holdout) for the analysis-upgrade subsystem**. The gold-set serves as resolver ground truth for Phase 5 E-step ladder (E0 baseline measurement + E1–E8 resolver optimization measured against gold-set labels). Combined with the locked 20-item holdout, the dev-set provides:

- **Calibration data** for resolver tuning (dev visible during optimization)
- **Holdout evaluation set** (locked after E0 baseline; never exposed to optimization to prevent overfitting)
- **Ground-truth labels** (`expected_ontology_nodes`) per claim, drawn from `data/corpus/index/compiled-index.json` (7,389 nodes; core / important / medium / peripheral tiers)

**Why this work matters:** Without trustworthy gold labels, resolver optimization produces gains-on-noise rather than gains-on-truth. The substantive labeling discipline (six-check protocol, §3.2 ontology-synonymy rules, §5.4 partial-faithfulness verification, AF4/AF5 flag codes, etc.) ensures each label is justified, traceable, and reproducible. Drift-log captures pattern-watch evolution so item-25 codification cycles can refine conventions based on real annotation contact.

**Phase ordering:** Phase 4 = gold-set construction (current); Phase 5 = E-step ladder (gated on Phase 4 complete); Phase 6 = atomic artifact swap to live (gated on Phase 5).

---

## 1. What was accomplished this session

### 1.1 Dev annotations committed (4 items: dev-21 through dev-24)

| # | claim_id | Genre | Labels | §5.4 | Notable |
|---|---|---|---|---|---|
| 21 | `claim-aristotle-da-3.3-063` | primary_aristotle | 4 | FIRES (c-causal NEW) | First Audi-031 verb→noun extension provisional fire (`resemble`→`resemblance`); Audi+Frede SURFACE-DRIVEN-DISAMBIGUATION; AF4 'remain' GENUINE-GAP affirmed via tier-stratified rule |
| 22 | `claim-horgan-1993-136` | secondary_non_phantasia | 5 | FIRES (c-parallel NEW) | First multi-cross-author SURFACE-DRIVEN-DISAMBIGUATION (Audi+Kim+Barnes); Horgan reporting Schiffer; obscurantist-clause stripped; rhetorical-frame stripping mechanism #7 NEW |
| 23 | `claim-aristotle-da-3.3-036` | primary_aristotle | 3 | FIRES (b-single + DISAMBIGUATION directionality NEW) | First dev-set faithfulness=PARTIAL item; first concrete labeling-decision impact of Concern B procedural protocol (`presence` SKIP); first verified primary-Aristotle GENUINE-GAP ('always') |
| 24 | `claim-aristotle-da-3.3-066` | primary_aristotle | 2 | NON-FIRE (Path A; rhetorical-frame stripping + presupposition-to-assertion conversion) | Second concrete labeling-decision impact of Concern B (`knowledge`/`knowing` SKIP); cluster-spanning-slug Procedural Flag → §5.5 codified; presupposition-to-assertion mechanism #8 NEW; LAST item before item-25 fire |

**Dev annotation: 24 of 50 (48%); 26 remaining.**

### 1.2 Item-25 codification cycle structure (Path C — Scoping + Decomposed Execution)

After dev-24 commit, codification load reached **n=28 coordinated sub-tasks** across 5 natural clusters per Phase 2 audit. Path C scoping session executed (7-phase plan):

- **Phase 1** Anchor verification — passed
- **Phase 2** Codification load audit — 28 sub-tasks documented across Clusters A (procedural-meta) / B (§5.4) / C (AF taxonomy) / D (ontology-rule) / E (tracker-cleanup)
- **Phase 3** Dependency mapping — dependency graph; 5 provisional standing rules ratify-vs-refine assessed; critical-path codification order (5 tiers); no pure-cycle dependencies; 6-sub-session decomposition recommended (was preliminary 4)
- **Phase 4** Decomposition decision — refined to **6 sub-sessions** (item-25a/b/c.1/c.2/d/e) with 6-point coordination protocol
- **Phase 5** Authorization — item-25a fired
- **Phase 6** Decomposed session execution — **item-25a complete** (6 of 6 sub-tasks); item-25b/c.1/c.2/d/e pending
- **Phase 7** Resume — pending after item-25e

### 1.3 Item-25a sub-session: 6 of 6 codification sub-tasks complete

| Sub-task | Codification | §8.1 Δ | Counter |
|---|---|---|---|
| A.1 | §7.4 (NEW) standing-rule-vs-candidate status tracking + §7.5 (NEW) candidate registry table structure | +1 | 11→12 |
| A.2 | §7.4 refinement bundle (audit window + audit scope + retroactive flag storage location) + audit-handoff drift-log entry for dev-21+22 PRESERVE-WITH-FLAG dispositions | +1 | 12→13 |
| A.3 | §5.5 (NEW) cluster-spanning-slug naming convention | +1 | 13→14 |
| A.4 | §7.6 (NEW) codification-decomposition framework + §7.4 cleanup (forward-pointer to §7.6) + §7.5 population (28 sub-tasks per Phase 2 audit) — bundled coordinated edit | +1 | 14→15 |
| A.5 | §8.5 (NEW) open-questions review discipline (Format A default; Format B restricted; pushback-re-presents-in-Format-A with prescriptive Q-list mapping; integrated dual-track Q+Concern structure; nuanced retroactive ratification dev-19→24) | +1 | 15→16 |
| C.1 | §5.6 (NEW) chapter-arc-context-check methodology (two-tier: BCAP STANDING + non-BCAP DISCRETIONARY with 5 disjunctive trigger criteria including (e) catch-all "use sparingly") | +1 | 16→17 |

**Item-25a cumulative §8.1 increments: 6** (Phase 4 estimate "~3–4" exceeded by +2–3).

### 1.4 New STANDING RULES codified this session

1. **§7.4 Standing-rule-vs-candidate status tracking** — 5-status taxonomy (STANDING RULE / ITEM-25 CANDIDATE / PROVISIONAL APPLICATION / DEPRECATED / DEFERRED-POST-ITEM-25); conditional-application flag format `[item-25 candidate: <name>; provisional application until next codification cycle]`; retroactive-application rule with PRESERVE-WITH-FLAG / REVISE / REVERT dispositions; audit-window + audit-scope + retroactive-flag-storage subsections
2. **§7.5 Item-25 candidate registry** — 6-column table (Candidate name | Status | Trigger commit | Evidence count (n) | Last update | Sub-cluster); populated with 28 sub-tasks at A.4
3. **§7.6 Codification-decomposition framework** — 4 disjunctive trigger criteria (sub-task count ≥6 / cross-cluster dependency density / high-stakes coordinated decisions / retroactive-review obligations); 7-phase decomposition phase structure; 5-element coordination-protocol-entry format; abstract-framework-only scope
4. **§5.5 Cluster-spanning-slug naming convention** — corpus extraction units may span multiple canonical chapters under single slug; source-data interpretation rule + annotation methodology rule + verification recipe
5. **§5.6 Chapter-arc-context-check methodology** — two-tier framework (BCAP STANDING + non-BCAP DISCRETIONARY); 5 disjunctive trigger criteria including (e) catch-all
6. **§8.5 Open-questions review discipline** — Format A default + Format B restricted + pushback-re-presents-in-Format-A with prescriptive Q-list mapping + Concern A–N parallel structure as PART of Format A

### 1.5 Retroactive dispositions documented (A.2 audit)

| Provisional fire | Disposition | Downstream impact | Action required |
|---|---|---|---|
| dev-21 `resemble`→`resemblance` (Audi-031 verb→noun extension) | PRESERVE-WITH-FLAG (label preserved; conditional-application flag applied retroactively via drift-log addendum per refined §7.4) | item-25d D.2: SCOPE-COMPLICATION | DOCUMENT-ONLY (HALT-FOR-USER-REVIEW reserved) |
| dev-22 multi-cross-author (Audi+Kim+Barnes SURFACE-DRIVEN-DISAMBIGUATION) | PRESERVE-WITH-FLAG | item-25d D.5: SCOPE-COMPLICATION | DOCUMENT-ONLY |

### 1.6 Files affected this session

**Modified:**
- `data/gold/resolver-gold-dev.jsonl` (20 → 24 lines; +4 dev annotations)
- `data/gold/drift-log.md` (154 → 194 entries; +40 entries; 32 dev-commit entries + 8 codification entries)
- `data/gold/CONVENTIONS.md` (45 KB pre-session → expanded with §7.4/§7.5/§7.6/§5.5/§5.6/§8.5 NEW sections)

**Backups created (5):**
- `.backups/pre-dev-21-commit-snapshot-20260501T221247Z/`
- `.backups/pre-dev-22-commit-snapshot-20260501T223248Z/`
- `.backups/pre-dev-23-commit-snapshot-20260501T225057Z/`
- `.backups/pre-dev-24-commit-snapshot-20260501T232730Z/`
- `.backups/pre-item-25a-codification-snapshot-20260501T235802Z/` (includes CONVENTIONS.md)

---

## 2. Where we are now (state at session-close)

### 2.1 Validator + integrity

- Validator: **OK (0 violations)**
- Holdout md5: **`2c6f1f7e76c7fc7192a5d4dfba515a59`** (unchanged across all session work)
- Dev jsonl: **24 lines, all well-formed JSON, 24/24 parseable**
- Drift-log: **194 entries**
- §8.1 CONVENTIONS-edit counter: **17** (was 11 at session start; +6 over session)

### 2.2 Position in overall pipeline

- **Dev annotation:** 24 of 50 (48%); **26 remaining** (dev-25 through dev-50)
- **Item-25 codification cycle:** item-25a complete; **item-25b/c.1/c.2/d/e pending** (5 of 6 sub-sessions remaining)
- **§7.5 candidate registry distribution:**
  - STANDING RULE: 4 (A.1 + A.2 audit + A.3 + A.4)
  - ITEM-25 CANDIDATE: 22 (work-list for item-25b/c.1/c.2/d/e)
  - PROVISIONAL APPLICATION: 2 (D.2 + D.5 with retroactive flag from A.2)
  - DEPRECATED: 0
  - DEFERRED-POST-ITEM-25: 1 (E.2 slug-graveyard)

### 2.3 Resource-planning revision (PENDING USER DECISION at resume)

**Phase 4 estimate variance surfaced:**
- Item-25a actual increments = **6** vs Phase 4 estimate ~3–4 (50–100% over)
- Variance drivers: refinement complexity, multi-Q-pushback rounds, specification-gap closure work
- Mitigation observed: bundled-edit batches at A.2 (3 spec gaps in single increment) + A.4 (3 components in single increment)

**Revised projection if scaling continues at item-25a rate:**
- item-25b (9 sub-tasks): 7–14 increments (vs 5–7 estimate)
- item-25c.1 (1 sub-task): 1–2 (vs 1)
- item-25c.2 (1 sub-task): 2–4 (vs 2)
- item-25d (7 sub-tasks): 7–14 (vs 5–7)
- item-25e (4 sub-tasks): 3–6 (vs 3)
- **Revised cumulative item-25 estimate: ~26–46** (vs original ~19–24)

**Recommendation surfaced at C.1 close (awaiting user response):** **(c) Hybrid** — accept revised ~26–46 estimate for resource-planning realism + actively pursue bundling opportunities at downstream sub-sessions (item-25b §5.4 cluster bundling candidates; item-25d §3.2 / SURFACE-DRIVEN cluster bundling candidates).

### 2.4 Item-25b authorization (pending)

Per Path C protocol, item-25b sub-session authorization gates on:
1. Resource-planning revision discussion resolution (above)
2. User authorization to fire item-25b

**item-25b scope:** 9 sub-tasks (B.1 / B.2 / B.3 / B.4 / B.5 / B.6 / B.7 / B.8 / C.4) — §5.4 codification (largest sub-session). Per Path C Phase 4 specification:
- **B.1** §5.4 paragraph-scope methodology REFINE
- **B.2** sub-pattern (a) paragraph-vs-chapter-arc-scope boundary
- **B.3** sub-pattern (c) umbrella-vs-split decision
- **B.4** faithfulness=partial vs supported §5.4 entry-criterion
- **B.5** faithfulness=supported reliability audit
- **B.6** DISAMBIGUATION third directionality variant within (b-single)
- **B.7** cluster-vs-paragraph-scope §5.4 verification methodology
- **B.8** paraphrase-modifications taxonomy formalization (8 mechanisms)
- **C.4** AF5 4-disposition taxonomy RATIFY-REFINE

**Coordination handoffs to item-25b (active):**
- §7.4 vocabulary protocol (A.1 STANDING)
- §7.6 codification-decomposition framework (A.4 STANDING)
- §8.5 open-questions discipline Format A (A.5 STANDING)
- §5.5 cluster-spanning-slug (A.3 STANDING; relevant for B.2)
- §5.6 chapter-arc-context-check methodology (C.1 STANDING; relevant for B.1/B.2/B.7)
- §7.5 candidate registry rows for B.1-B.8 + C.4 are work-list

---

## 3. What remains

### 3.1 Item-25 codification cycle: 5 of 6 sub-sessions remaining

| Sub-session | Sub-task count | Estimated increments (revised) | Est. effort |
|---|---|---|---|
| **item-25b** §5.4 codification | 9 (B.1-B.8 + C.4) | 7–14 | LARGE (longest sub-session) |
| **item-25c.1** AF5 split-decision | 1 (C.2) | 1–2 | SMALL (single high-stakes decision) |
| **item-25c.2** AF4 + tier-stratified | 1 (C.3) | 2–4 | SMALL-MEDIUM |
| **item-25d** Ontology-rule codification | 7 (D.1-D.7) | 7–14 | LARGE (mandatory A.2 reconciliation opening) |
| **item-25e** Tracker/cleanup + final | 4 (E.1-E.4) | 3–6 | MEDIUM (terminal sub-session) |

**Total estimated remaining increments: 20–40** (per revised projection per Concern C resource-planning revision).

### 3.2 Dev annotation: 26 of 50 items remaining

After item-25 codification cycle complete (item-25a/b/c.1/c.2/d/e all done), dev annotation resumes at **dev-25** (or dev-26 per Path C Phase 7 resume protocol — TBD whether dev-25 is the post-item-25 first item, or if item-25 IS the position 25 marker and dev-25 was conceptually consumed by the codification cycle).

**Sequence positions 25-50 remaining** per `data/gold/dev-ordering.md`. Per Path C protocol Phase 7 resume: dev annotation resumes with new codified framework (all standing rules from item-25 cycle in effect; CONVENTIONS updated; drift-log codification record entries serve as future precedent).

### 3.3 After Phase 4 complete (dev 50/50 + holdout 20/20 = gold-set 70/70)

- **Holdout LOCKS** after E0 baseline measurement (Phase 5 entry) — currently operationally locked but not formally locked
- **Phase 5 E-step ladder** (E0–E8 resolver optimization) — gated on Phase 4 complete; not started
- **Phase 6 promotion** (atomic artifact swap to live) — gated on Phase 5

### 3.4 Standing rules to apply going forward (post-item-25a)

**Newly codified standing rules (from item-25a):**
1. §7.4 status-tracking + conditional-application flag protocol
2. §7.5 candidate registry (use for tracking; update on candidate registration + sub-session resolution)
3. §7.6 codification-decomposition framework (apply to future item-N cycles per §8.2)
4. §5.5 cluster-spanning-slug naming convention (apply to cross-chapter clusters)
5. §5.6 chapter-arc-context-check methodology (apply per disjunctive trigger criteria)
6. §8.5 open-questions discipline Format A (apply to all proposal-review-confirm cycles)

**Pre-existing standing rules continued from prior sessions:**
- SURFACE-DRIVEN rule (dev-19 Decision 13 STANDING)
- §5.4 paragraph-scope methodology (dev-18 Entry E STANDING; pending item-25b refinement)
- Cross-author-collision-avoidance default-skip (§3.2 STANDING)
- Tier-stratified GENUINE-GAP test (dev-21 Q5 STANDING post-dev-21)

---

## 4. Resume prompt for next session

> Read `tmp/SITREP-2026-05-01-end-of-session-item-25a-complete.md`. Item-25a sub-session complete (6/6 codification sub-tasks); 5 of 6 item-25 sub-sessions remaining (item-25b/c.1/c.2/d/e). §8.1 counter at 17 (was 11 at item-25a fire; +6 over Phase 4 estimate of +3-4). Validator OK; holdout md5 unchanged; dev jsonl 24/24; drift-log 194 entries. Standing rules from item-25a active per §3.4 SITREP. Resume target: **resource-planning revision discussion** (recommendation pending: hybrid (c) accept revised ~26–46 cumulative estimate + pursue bundling at downstream sub-sessions). After resolution: **item-25b authorization** (9 sub-tasks; LARGEST sub-session; bundling opportunities flagged at B.1+B.2+B.3 §5.4-thematic and C.4-related). Run resume ritual (validator + holdout md5 + state checks per §5 below) before any execution.

---

## 5. Resume ritual (run on session start)

```bash
cd /home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/production-sandbox

# Validator + state verification
bash scripts/validate-gold-notes.sh                                # expect: OK (0 violations)
md5sum data/gold/resolver-gold-holdout.jsonl                       # expect: 2c6f1f7e76c7fc7192a5d4dfba515a59
wc -l data/gold/resolver-gold-dev.jsonl                            # expect: 24
grep -c '^2026-' data/gold/drift-log.md                            # expect: 194
grep -cE '^[0-9]{4}-[0-9]{2}-[0-9]{2} \| §' data/gold/drift-log.md # expect: 17 (§8.1 counter)

# CONVENTIONS sections newly codified at item-25a (verify all 6 present)
grep -nE '^### (5\.5|5\.6|7\.4|7\.5|7\.6|8\.5)' data/gold/CONVENTIONS.md
# expect:
#   5.5 Cluster-spanning-slug naming convention
#   5.6 Chapter-arc-context-check methodology
#   7.4 Standing-rule-vs-candidate status tracking
#   7.5 Item-25 candidate registry
#   7.6 Codification-decomposition framework
#   8.5 Open-questions review discipline

# Confirm protocols + drafts + backups in place
ls data/gold/protocols/                                            # expect: README + candidate-enumeration-protocol-v1.md + remediation-2026-04-28.md
ls -td .backups/pre-item-25a* | head -1                            # expect: pre-item-25a-codification-snapshot-20260501T235802Z

# Item-25b sub-session resolution targets (preview)
# B.1-B.8 + C.4 = 9 sub-tasks per Path C Phase 4 plan; expected §8.1 +7-14 increments per revised projection
```

---

## 6. Decisions locked this session

| # | Decision | Source | Status |
|---|---|---|---|
| 19 | §5.4 sub-pattern (c) umbrella with conditional-collapse + causal-collapse variants (interim) | dev-21 | Codified at item-25b B.3 (pending) |
| 20 | §5.4 (c) umbrella extended to three variants (c-conditional / c-causal / c-parallel) | dev-22 | Codified at item-25b B.3 (pending) |
| 21 | SURFACE-DRIVEN-DISAMBIGUATION sub-mechanism extends to multi-cross-author scope | dev-22 | A.2 PRESERVE-WITH-FLAG; codified at item-25d D.5 (pending) |
| 22 | §5.4 (c) umbrella with three named variants; umbrella-vs-split threshold n≥3 | dev-22 | Codified at item-25b B.3 (pending) |
| 23 | SURFACE-DRIVEN-DISAMBIGUATION sub-mechanism multi-cross-author standing | dev-22 | A.2 PRESERVE-WITH-FLAG; codified at item-25d D.5 (pending) |
| 24 | §5.4 sub-pattern (b-single) DISAMBIGUATION directionality variant (third variant) | dev-23 | Codified at item-25b B.6 (pending) |

---

## 7. Critical anchors

| Anchor | Value |
|---|---|
| Holdout md5 | `2c6f1f7e76c7fc7192a5d4dfba515a59` |
| Operative ontology path | `data/corpus/index/compiled-index.json` (symlinked to `compiled-index.v2.json`) |
| Protocol v1 location | `data/gold/protocols/candidate-enumeration-protocol-v1.md` |
| Locked plan + addenda | `tmp/dev-annotation-execution-plan-2026-04-28.md` |
| Path C scoping plan | (Phase 1-4 deliverables in conversation; not yet exported to file) |
| §7.5 candidate registry | `data/gold/CONVENTIONS.md` §7.5 (28 sub-tasks populated at A.4) |
| §7.6 codification-decomposition framework | `data/gold/CONVENTIONS.md` §7.6 |
| §8.1 counter | **17** (was 11 at session start; +6 over session per item-25a) |
| Latest backup | `.backups/pre-item-25a-codification-snapshot-20260501T235802Z` |

---

## 8. Open questions / awareness items for next session

1. **Resource-planning revision (PRIMARY at resume)** — recommendation surfaced at C.1 close: **(c) hybrid** (accept revised ~26–46 cumulative estimate + pursue bundling). User has not yet responded; first action at resume is to surface this for resolution.

2. **Bundling opportunities flagged for item-25b** — B.1+B.2+B.3 share §5.4 sub-pattern thematic; consider bundled coordinated edit. C.4 AF5 4-disposition taxonomy ratify could pair with C.2 split-decision (item-25c.1) but they're in separate sub-sessions per Path C plan.

3. **Item-25d MANDATORY OPENING** — when item-25d fires (after item-25c.2), sub-session opens with explicit reconciliation of A.2 dispositions per Protocol 2 mandatory-consumption rule. dev-21 resemblance + dev-22 multi-cross-author dispositions (PRESERVE-WITH-FLAG / SCOPE-COMPLICATION / DOCUMENT-ONLY) consumed before D.2/D.5 codification proceeds. HALT-FOR-USER-REVIEW reserved for unanticipated complications.

4. **Path C Phase 4 plan never exported** — the Phase 4 deliverable (6-sub-session decomposition + 6-point coordination protocol) lives in conversation messages but not in a file artifact. If session context is lost, reconstructing requires reading conversation transcript. **Consider exporting to `tmp/path-c-phase-4-plan-2026-05-01.md` as a resume-resilience measure.**

5. **§7.5 candidate registry status updates** — registry was populated full at A.4 with 28 rows; subsequent sub-session resolutions update Status column per incremental-update protocol. Item-25b will update 9 rows (B.1-B.8 + C.4) from ITEM-25 CANDIDATE → STANDING RULE / DEPRECATED / DEFERRED-POST-ITEM-25 per resolution.

6. **Per-sub-session anchor verification** — each item-25 sub-session opens with anchor verification per §7.6 Phase 1. Item-25b opening should verify post-item-25a state matches §5 SITREP anchors above.

7. **No new pre-staging concerns** — Phase 4 plan rejected pre-staging at dev-23/24; current locked-plan sequence holds for item-25b/c.1/c.2/d/e firing per critical path.

---

## 9. Session-close summary

**4 dev annotations committed (dev-21 → dev-24); 6 codification standing rules established; 6 §8.1 increments applied; Phase 1-4 of Path C scoping session executed; item-25a sub-session of 6 sub-task codifications completed.**

Major session contributions:

1. **Concern B procedural protocol established** (dev-23 Entry F) and **codified into §7.4** (item-25a A.1) — separates STANDING RULES from ITEM-25 CANDIDATES with conditional-application flag protocol; produced 2 concrete labeling-decision impacts (dev-23 `presence` SKIP / dev-24 `knowledge` SKIP)
2. **Path C scoping session methodology** — 7-phase plan executed for item-25 codification; **§7.6 codification-decomposition framework codified** generalizing for future item-N cycles
3. **Cluster-spanning-slug naming convention** (dev-24 Procedural Flag) codified as **§5.5 STANDING RULE**; chapter-attribution-vs-slug-prefix divergence reconciled empirically
4. **Open-questions review discipline** codified as **§8.5** with Format A default + Format B restricted + pushback-re-presents-with-prescriptive-Q-mapping
5. **Chapter-arc-check methodology** codified as **§5.6** with two-tier framework (BCAP STANDING + non-BCAP DISCRETIONARY) and 5 disjunctive trigger criteria
6. **Item-25 candidate registry §7.5** populated with all 28 sub-tasks from Phase 2 audit; serves as work-list for item-25b/c.1/c.2/d/e
7. **A.2 retroactive-review** of dev-21 + dev-22 provisional fires: both PRESERVE-WITH-FLAG; SCOPE-COMPLICATION downstream impact for item-25d D.2/D.5 codification

Validator OK; holdout integrity preserved; per-decision review discipline maintained throughout codification work; all sub-session work backed up. Resource-planning revision discussion pending at resume.
