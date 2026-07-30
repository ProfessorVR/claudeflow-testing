# Diff from Previous Run — Post-Marathon Re-run + Polish + User-Judgment Phase

**Current run-id**: `2026-05-20T0058`
**Previous run-id**: `2026-05-13T1439`
**Pipeline invocation**: post-marathon re-run per workflow §10 of `tmp/Dissertation/CITATION-MARATHON-WORKFLOW.md` + polish phase (2026-05-20T0829) + user-judgment phase (2026-05-20T0908)
**Generated**: 2026-05-20

---

## Headline

> **DISSERTATION REVISION SUBSTANTIVELY COMPLETE.**
>
> The 6-section citation marathon (2026-05-19) + user post-cleanup (2026-05-20) + same-session polish (2026-05-20T0829) + user-judgment phase (2026-05-20T0908) closed the prior-run gap inventory:
>
> - Of **207** prior citation gaps: ~**170 RESOLVED** (~82%) and ~**37 deferred low-priority enrichment** (all non-blocking).
> - Of **154** detailed-list gaps: **152 RESOLVED / 0 REMAINING / 2 PARTIAL-DEFERRED** (low-priority, non-blocking).
> - Of **21** inconsistency findings: **18 RESOLVED / 0 REMAINING (after this session) / 1 INTENTIONAL-PRESERVED / 1 PARTIAL / 1 CHECK**.
> - **2 new minor findings** surfaced this run (typos at §1.4 L51 + L63) — both RESOLVED in polish phase.
>
> **All blocking items resolved.** The user may proceed to final dissertation compilation. Optional polish remains: §1.0 L70 diagram reformat (PDF layout) + §1.5 ~36-50 enrichment Bekker citations (non-load-bearing).

## Polish phase (2026-05-20T0829) — 7 fixes applied

| # | Section | Line | Gap | Fix |
|---|---|---:|---|---|
| 1 | §1.0 | 41 | DISS-00-G03 | `becomes ineligible` → `becomes intelligible` |
| 2 | §1.4 | 8 | DISS-04-G01 | `13789a21-22` → `1378a21-22` (Rhet II.1 Bekker) |
| 3 | §1.4 | 51 | NEW-01 | `thought it includes` → `though it includes` |
| 4 | §1.4 | 63 | DISS-04-G02 | `\textit{ON the Soul}` → `\textit{On the Soul}` |
| 5 | §1.4 | 63 | NEW-02 | `at least implicity` → `at least implicitly` |
| 6 | §1.4 | 69 | DISS-04-G03 | `701b33-7022` → `701b33-702a3` (MA 8 Bekker) |
| 7 | §1.4 | 115 | DISS-04-G04 | `ontologicla` → `ontological` |

Brace balance preserved on both files (§1.0: 565=565; §1.4: 789=789). Pre-polish backup at `tmp/Dissertation/.backups/2026-05-20T0829-pre-typo-polish-post-rerun/`.

Full polish detail: `_run-history/2026-05-20T0058/_synthesis/post-polish-summary.md`

## User-judgment phase (2026-05-20T0908) — both items resolved

### §1.4 L107 `pathe/pathos?` marker → resolved

User confirmed the encompassing-category framing: *pathos* is the umbrella term for all affections (including the Met Δ 21 fourfold, the Rhet II.1 threefold, and the *pathē* catalog as a sub-class within it). Under this framing, each concrete emotion is a *pathos*-instance integrating the four mutually constitutive aspects (cognitive eval / conative orientation / hedonic tonality / physiological alteration). The grammatically-singular *pathos* is correct; the §1.0 INCONS-005 register-key disambiguates by context.

**Fix applied**: `\textit{pathe/pathos?}` → `\textit{pathos}` at §1.4 L107. Brace balance 789=789 preserved.

### §1.3 L9 Burke RoM definition placeholder → already resolved (investigation finding)

Investigation of current §1.3 L9 prose found the `\footnote{Quotation, definition, point.}` placeholder is no longer present (0 occurrences). The L9 footnote already contains Burke's canonical RoM identification material:
- **RoM p. 25** quotation: "In pure identification there would be no strife. Likewise, there would be no strife in absolute separateness…" (identification-division dyad)
- **RoM p. 24** citation: "the topic of a rhetoric 'having identification as its key term'"
- Adjacent footnote retains **RoM pp. 83-84** Hazlitt quote

The Burke RoM footnote was integrated during a session prior to this run's start (likely the user's 2026-05-20 post-cleanup). The earlier resolution-tracker incorrectly inherited the marathon §1.3 report's "DEFERRED" status without re-checking against current §1.3 state. §1.3 SHA-256 unchanged this session: confirmed already-resolved.

### §1.5 items confirmed already-resolved by investigation

3 of the 5 prior REMAINING items were already RESOLVED in current §1.5 prose:

| Item | How resolved |
|---|---|
| §1.5 Sherman/Aubenque/Broadie/McNeill bibliographic entries | Marathon §1.5 added full publication data for all 4 (Oxford/PUF/SUNY/Oxford with titles + years) |
| §1.5 Ross 'good temper' translation rendering | Marathon §1.5 explicit Ross attribution at L25 footnote |
| §1.5 Rhet II.1 Bekker discrepancy | Marathon §1.5 added self-acknowledging audit footnote explaining edition-specific line numbering |

**ALL blocking items now resolved. Dissertation revision substantively complete.**

Final completion summary: `_run-history/2026-05-20T0058/_synthesis/final-completion-summary.md`

---

## 1. Resolved flags (success!)

### 1.1 Citation gaps RESOLVED — 144 of 154 detailed-list gaps (93.5%)

Per-section breakdown (of the 154 entries in the prior `citation-gap-master.json` detailed list):

| Section | Total | RESOLVED | REMAINING | PARTIAL/DEFERRED |
|---|---:|---:|---:|---:|
| DISS-00-INTRO | 16 | **14** ✓ | 1 | 1 |
| DISS-01-A0 | 18 | **18** ✓ | 0 | 0 |
| DISS-02-A1A2 | 12 | **12** ✓ | 0 | 0 |
| DISS-03-A3 | 32 | **31** ✓ | 1 | 0 |
| DISS-04-EMOTION | 46 | **41** ✓ | 5 | 0 |
| DISS-05-A4 | 30 | **28** ✓ | 0 | 2 |
| **TOTAL (detailed)** | **154** | **144** | **7** | **3** |

Including the **53 enrichment-batch §1.5 gaps** not in the detailed list:
- §1.5 marathon addressed **17 substantive footnotes** (5 critical-flag + 12 Tier A) → these 17 are RESOLVED
- Remaining ~36 §1.5 enrichment Bekker citations: DEFERRED per non-load-bearing skip-rule

**Overall gap closure (against 207 prior total)**: ~162 RESOLVED (~78%), ~45 DEFERRED low-priority enrichment.

### 1.2 Inconsistency findings RESOLVED — 13 of 21 (62%)

| Finding ID | Severity | Title | Status | How resolved |
|---|---|---|---|---|
| INCONS-001 | CRITICAL | A_n-naming systemic inconsistency | ✓ RESOLVED | Sessions 1-3c A0-A4 renumbering migration; all sections Convention (b) compliant |
| INCONS-002 | CRITICAL | Burke pp.280-281 mis-citation (3×) | ✓ RESOLVED | Session 2 — corrected to pp.253 + pp.261-262 |
| INCONS-003 | CRITICAL | Hawhee Bodily Arts → Rhetorical Vision | ✓ RESOLVED | Session 2 — corrected |
| INCONS-004 | CRITICAL | §1.0 L64 A_3 internal contradiction | ✓ RESOLVED | Marathon §1.0 — INCONS-014 phantasia/phantasma footnote at L15 cross-references §1.3 |
| INCONS-005 | CRITICAL | pathos equivocation §§1.0/1.2/1.3/1.4 | ✓ RESOLVED | Marathon §1.0 — pathos register-key footnote at first \\textit{pathē} with four-register key + §1.4 ¶2 anchor |
| INCONS-009 | MAJOR | Phys IV.14 strong-reading propagation | ✓ RESOLVED | Marathon §1.0 G09 — explicit interpretive flag propagated |
| INCONS-010 | MAJOR | §1.2 M_2→M_3 old form residue | ✓ RESOLVED | Phase 0 confirms 0 old-form anywhere |
| INCONS-012 | MAJOR | §1.3 three vs. four orientational modes | ✓ RESOLVED | Marathon §1.3 G30 — "Four → Three" architectural fix at L31 |
| INCONS-013 | MAJOR | §1.5 L5 §1.5→§1.4 self-reference | ✓ RESOLVED | Marathon §1.5 — corrected |
| INCONS-014 | MAJOR | phantasia/phantasma capacity-product slip | ✓ RESOLVED | Marathon §1.0 — footnote at L15 with cross-ref to §1.3 |
| INCONS-015 | MINOR | §1.0 'resonant motion' vs. 'resonant kinēsis' | ✓ RESOLVED | Marathon §1.0 — canonical form applied |
| INCONS-020 | MINOR | §1.5 'Chain analysis is complete' overreach | ✓ RESOLVED | Marathon §1.5 — softened |
| INCONS-021 | MAJOR | §1.4/§1.5 three-types-of-action consistency | ✓ RESOLVED | Step 7 — §1.5 L25 hexis-bivalence cross-references §1.4 L174 |

### 1.3 Structural debts CLOSED

| Debt | Prior status | Resolution |
|---|---|---|
| Aₙ renumbering migration | Convention (b) partial | Sessions 1-3c — all sections Convention (b) compliant |
| Terminology migration | 47 occurrences pending | terminology-decisions-final.md applied: `pathos simpliciter` → `epithymia` (22/23), `resonant orexis` → `resonant epithymia` (24/24), `resonant pathē` coined (2 occurrences) |
| Burke citations | 3 occurrences of pp.280-281 | Corrected to p.253 + pp.261-262 (Session 2) |
| Hawhee citation | Bodily Arts mis-attribution | → Rhetorical Vision 2011 (Session 2) |
| Diagram hexeis/settled-doxai region | Underdeveloped per user note | Step 7 — TECHNE/PRAXIS bisection + 3 arrows + Type 3 two-level modulation |
| §1.4 hexis-bivalence introduction | Missing | Step 7 — ~440-word paragraph at L174 anchored to Met Δ 20 + GA 18 §17 |
| §1.5 cross-reference to §1.4 | Missing | Step 7 — L25 praxis-hexis introduction |
| Motion-label convention reconciliation | Diagram-prose mismatch | Diagram updated to source-indexed Option B (M_n→A_{n+1}); 36 hardcoded labels migrated; 4 tooltips rewritten |
| 3 §1.4 → §1.2 relocations (REL-001/-002/-003) | OPEN (~90-180 min user effort) | Step 5 — all three INTEGRATED at §1.2; brace 401=401 preserved |
| §1.0 INCONS-005/014/015 | OPEN | Resolved within Marathon §1.0 |
| §1.5 Lanham Priority 1 sig-transitions | 4 occurrences (target ≥30) | Marathon §1.5 — 24 inserted; 4→28 total |
| §1.5 5 CRITICAL-DISSERTATION-NOVEL flags | Missing | Marathon §1.5 — all 5 substantial interpretive flag footnotes integrated (G07/G13/G18/G19/G20/G26) |
| §1.4 244-entry MASTER-CITATION-REPORT cache | Available but unintegrated | Integrated through marathon §1.4 (final session) + §1.4 gold-standard preserves cache |

### 1.4 Markers cleared

| Marker class | Prior count | Current count |
|---|---:|---:|
| `\textbf{******}` placeholders | 11 | **0** ✓ |
| `(CITE)` literals | 2 | **0** ✓ |
| UNVERIFIED prefixes (intra-marathon) | 3 (post-marathon-close) | **0** ✓ |
| `M_n → M_{n+1}` old-convention occurrences | partial residue | **0** ✓ |
| §1.1 G06 TODO LaTeX comment | 1 | **0** ✓ (user post-cleanup) |

---

## 2. Remaining open flags (the user's polish punch-list)

### 2.1 Citation gaps REMAINING (10 of 154 detailed = 6.5%; mostly trivial)

| Gap ID | Section | Severity | Issue | Effort |
|---|---|---|---|---|
| DISS-00-G02 | §1.0 | LOW | Diagram + full-page reformat \\inlinenote at L70 (PDF compile concern) | small |
| DISS-03-G05 | §1.3 | MEDIUM | L9 footnote{Quotation, definition, point.} — user supplies Burke RoM definition | 15-30 min |
| DISS-04-G02 | §1.4 | LOW | 'ON the Soul' typo at L63 | trivial |
| DISS-04-G03 | §1.4 | LOW | '7022' Bekker typo at L69 (701b33-7022) | trivial |
| DISS-04-G04 | §1.4 | LOW | 'ontologicla' typo at L115 | trivial |
| DISS-04-G05/G06 | §1.4 | LOW-MEDIUM | '(pathe/pathos?)' marker at L107 — user-internal uncertainty | small-medium |
| DISS-05-additional-batch | §1.5 | mostly MEDIUM | ~36-50 enrichment Bekker citations (Tier A non-load-bearing) | DEFERRED |
| DISS-05-blocked-batch | §1.5 | mixed | ~14 upstream-blocked items now unblocked, deferred for polish | DEFERRED |

### 2.2 Inconsistency findings REMAINING (5 of 21 = 24%; all §1.4 trivial)

| Finding ID | Severity | Title | Why remaining |
|---|---|---|---|
| INCONS-006 | MAJOR | §1.4 L107 '(pathe/pathos?)' marker | Same as DISS-04-G06; marathon §1.4 was scoped to 3 substantive edits, did not touch typo cluster |
| INCONS-016 | MINOR | §1.4 Rhet II.1 Bekker typo cluster | Out of marathon §1.4 scope (typo polish) |
| INCONS-017 | MINOR | §1.4 L63 'ON the Soul' capitalization | Out of marathon §1.4 scope (typo polish) |
| INCONS-018 | MINOR | §1.4 L69 '7022' Bekker | Out of marathon §1.4 scope (typo polish) |
| INCONS-019 | MINOR | §1.4 L115 'ontologicla' | Out of marathon §1.4 scope (typo polish) |

### 2.3 Inconsistency findings in non-final state (3 of 21)

| Finding ID | Severity | Title | Status |
|---|---|---|---|
| INCONS-007 | MAJOR | Befindlichkeit translation drift §1.4/§1.5 | **INTENTIONAL-PRESERVED** — user judgment: "state-of-mind"/"attunement" alternation at §1.4 (9+9 occurrences) is deliberate; not a defect |
| INCONS-008 | MAJOR | §1.4 internal §1.2/§1.4 cross-references ambiguous | **CHECK** — needs spot-verification; marathon may have addressed |
| INCONS-011 | MAJOR | §1.4 C201/C082 disagreement on basic-pathos location | **PARTIAL** — terminology migration (pathos simpliciter → epithymia) partly resolves the dispute; final coherence to verify |

### 2.4 User-action items consolidated from marathon session reports

From `tmp/Dissertation/CITATION-MARATHON-USER-ACTIONS.md` after user 2026-05-20 cleanup:

**RESOLVED by user post-cleanup (2026-05-20)**:
- §1.1 L53 G02 Bewandtnis — verified vs. M-R p.115 ✓
- §1.1 L79 G04 Ecstases — verified vs. M-R p.377 ✓
- §1.1 L83 G15 GA 3 — verified vs. Taft p.137 ✓
- §1.1 L25 G01 Bewegtheit ****** — filled with BCAP p.199 verbatim ✓
- §1.1 L67 G03 Innerzeitigkeit ****** — filled with SZ §81 H.421 verbatim ✓
- §1.1 G06 Burke TODO LaTeX comment — cleared ✓

**REMAINING (user polish queue)**:
- §1.0 L41/L60 typos: 'becomes ineligible' check, 'originator originator' duplication check, '1072a23026' Bekker dash check — currently RESOLVED per pipeline scan but flagged in marathon session reports
- §1.0 L41 HL marker — preserved per user judgment (G16 footnote provides support)
- §1.3 L45 HL — author TODO note, intentional
- §1.3 L9 footnote{Quotation, definition, point.} — user supplies Burke RoM identification quote
- §1.4 typos: 'ON the Soul', '7022', 'ontologicla', '(pathe/pathos?)' marker
- §1.5 bibliographic verifications: Sherman 1989, Aubenque 1963, Broadie 1991, McNeill 1999
- §1.5 Ross 'good temper' rendering vs. alternatives (mildness/patience)
- §1.5 Rhet II.1 Bekker edition-discrepancy (prose 1378a24 vs. corpus 1378a20-22)

---

## 3. Newly-introduced flags

### 3.1 New typo findings detected this run (2)

| ID | Section | Severity | Location | Issue |
|---|---|---|---|---|
| **NEW-01** | §1.4 | MINOR | L51 | 'thought it includes' typo (should be 'though it includes') — sentence: "it is not merely pleasure or pain, thought it includes pleasure and pain" |
| **NEW-02** | §1.4 | MINOR | L63 | 'implicity' typo (should be 'implicitly') — sentence: "a cognitive content, a hedonic valence, and---at least implicity---a conative component" |

Both NEW findings are **pre-existing** typos that were NOT caught in the prior run's gap list. They are surfaced now via the post-marathon scan. Trivial to fix.

### 3.2 No new structural / architectural inconsistencies introduced

The marathon's substantial restructuring (3 relocations, +52 net footnotes, +14,985 words across §§1.0-1.5) did not introduce any new claim discontinuities, citation contradictions, or architectural mismatches per Phase 3 cross-section consistency checks. Brace-balance preserved across all sections.

---

## 4. Lanham profile shifts (qualitative; quantitative deferred to next full re-run)

| Section | Marathon-known shift | Drift status vs. §1.4 baseline |
|---|---|---|
| DISS-04-EMOTION | Net word-count -1010; +Step 7 hexeis-bivalence paragraph (analytical density compensates) | BASELINE (self) |
| DISS-00-INTRO | +1601 words; +10 footnotes (scholarly densification) | **CLOSER** (was DRIFTED; marathon moves toward baseline) |
| DISS-01-A0 | +1216 words; +6 substantive footnotes; verbatim insertions raise direct-quote density | **CLOSER** |
| DISS-02-A1A2 | +1450 words from REL-001/002/003 (origin §1.4 = baseline; receiving §1.2 inherits baseline-aligned profile) | **CLOSER** |
| DISS-03-A3 | +11 footnotes; G01 Papachristou Latin/Greek tokens; densified | **ALIGNED** |
| DISS-05-A4 | +17 footnotes (3→20); sig-transitions 4→28; 5 substantial CRITICAL-flag footnotes | **MUCH CLOSER** (prior CATASTROPHIC drift now substantially restored) |

**Headline**: §1.5 was the prior run's most-drifted section (opacity composite 1.08 vs. baseline). Marathon Priority 1 restoration moves §1.5 substantially toward baseline. No section drifted FURTHER from baseline; all moved closer.

---

## 5. Workflow rules established during marathon (now permanent)

These 5 rules are logged to `memory/project-dissertation-analysis-pipeline.md` and apply to future pipeline runs:

1. **File-state check on each section entry** — check for `OUTPUT_v[12].tex` parallel to canonical `.md`; if `.tex` exists and post-dates the analyzed `.md`, treat `.tex` as canonical and apply via content-matching (§1.1 + §1.2 use .tex).
2. **Cross-check .md before WebSearch/Perplexity** — god-write `OUTPUT_v[12].tex` export sometimes drops `.md` verbatims into `\textbf{******}` placeholders. Always check the `.md` as a verbatim source before escalating to WebSearch/Perplexity.
3. **Corpus-grounded subsumes Tier C** — when Tier A corpus/index source covers a fill, the Tier C Perplexity fallback is subsumed.
4. **Deep-research essays are leads, not sources** — Perplexity sonar-deep-research essays are literature-survey syntheses; cite the secondary sources they surface (Sherman, Aubenque, Broadie, McNeill) as `cf.` references, do not integrate essay prose.
5. **Pipeline analysis can be wrong** — verify against authoritative external source before applying citation corrections that change quote meaning (§1.1 G09 finding: dissertation's existing XI.6 1063a19-21 citation verified CORRECT via MIT Classics Archive contra pipeline's XI.9 recommendation).

---

## 6. Cost & efficiency

| Metric | Prior run | This run |
|---|---:|---:|
| Wall-time | ~3.85 hours (231 min) | ~1 hour (cache-first policy) |
| Perplexity queries | 17 (11 S1 + 4 S2 + 2 S3) | **0** |
| Perplexity cost | $2.33 | **$0.00** |
| Citation-fill files produced | 154 | 0 (cache-first; prior fills audit-trail inherited) |

---

## 7. Next pipeline action

1. **User completes ~5-10 minutes** of trivial §1.4 typo Find/Replace (NEW-01, NEW-02, G02-G06)
2. **User supplies** the §1.3 G05 Burke RoM identification definition (~15-30 min)
3. **Optional**: user reviews per-section `revision-checklist.md` files for any items not yet acted on
4. **Optional**: user addresses ~36-50 §1.5 enrichment Bekker citations + bibliographic verifications (~2-4 hr)
5. **Optional**: pipeline re-run after user polish to confirm 100% citation-gap closure
6. **Declare revision complete** and proceed to final dissertation compilation

---

## 8. Output paths for this run

```
corpus/index/Dissertation/_run-history/2026-05-20T0058/
├── manifest.json                                    # SHA-256 of all 7 inputs + prior-delta tags
├── phase0-preflight.md                              # Dashboard
├── _per-section/
│   ├── DISS-{00-INTRO,01-A0,02-A1A2,03-A3,04-EMOTION,05-A4}/
│   │   ├── phase1-metadata.json                     # Per-section metadata
│   │   ├── phase2-claims.{json,md}                  # Inherited from prior + run-id tagged
│   │   ├── phase2-narrative.md                      # Inherited + run-id-tagged
│   │   ├── phase2-narrative-delta.md                # NEW — what changed since prior run
│   │   ├── phase2-edges.csv                         # Inherited
│   │   ├── citation-gap-table.{json,md}             # REFRESHED with RESOLVED/REMAINING/PARTIAL tags
│   │   ├── revision-checklist.md                    # Per-section tactical user-action list
│   │   └── citation-fills/INHERITED-FROM-PRIOR.md   # Pointer to prior fill files
│   └── DISS-DIAG-V7/
│       └── phase1-metadata.json
├── _synthesis/
│   ├── citation-gap-master.json                     # 154 detailed gaps with status (out of 207 prior)
│   ├── inconsistencies-and-fallacies.json           # 21 findings with status + 2 new
│   ├── numbering-audit.{json,md}                    # ✓ CLEAN
│   ├── terminology-reckoning.{json,md}              # SUBSTANTIALLY-COMPLETE
│   ├── terminology-decisions-final.md               # Inherited (user-locked 2026-05-13)
│   ├── relocations.{json,md}                        # ✓ ALL 3 INTEGRATED
│   ├── lanham-profile-matrix.{json,md}              # Qualitative deltas
│   ├── corpus-routing-plan.{json,md}                # No fresh routing needed
│   ├── perplexity-queue.{json,md}                   # ✓ EMPTY
│   ├── perplexity-budget-allocation.md              # $0 spend
│   ├── cache-coverage-summary.md                    # ✓ FULLY APPLIED
│   ├── concept-matrix.csv                           # Inherited
│   ├── revision-roadmap.{json,md}                   # MASTER USER-FACING ROADMAP
│   └── (selected supporting docs inherited)
└── _graphs/                                          # (deferred — no new graph emission this run)
```

**Master strategic roadmap** for user execution: `corpus/index/Dissertation/_run-history/2026-05-20T0058/_synthesis/revision-roadmap.md`
