# Revision Checklist — §1.1 A₀: Motion and Time as Ontological Horizon (DISS-01-A0)

**Section file**: `tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex` (and `.md` mirror with -2 line offset)
**Master roadmap**: `_synthesis/revision-roadmap.md`
**Sequencing in master roadmap**: After critical-path Steps 1–3 (terminology + numbering + Burke/Hawhee corrections)

---

## Section status

| Metric | Value |
|---|---|
| Word count (prose) | 5,950 |
| Sentence count | 165 |
| Phase 2 claim count | ~165 |
| Phase 4 fill files produced | 22 (`_per-section/DISS-01-A0/citation-fills/`) — includes 6 Tier-C Perplexity proposals (Q-006…Q-011) |
| Six-axis Lanham profile | `{nv: 0.64, para: 0.66, periodic: 0.46, voice: 0.30, register: 0.74, opacity: 0.32}` |
| Lanham composite (register × hypotaxis) | 0.488 (above §1.4 baseline 0.439 — well-developed) |
| Lanham overall tag | **ALL-ALIGNED** with §1.4; marginal positive drift on hypotaxis, periodic, register |
| Lanham-axis breakdown | All 6 axes within ±0.05 of §1.4 baseline |
| User-signature transitions | 22 (canonical-five total 12: thus×3, accordingly×4, hence×5; plus therefore×4 and other extras) |

---

## Pre-critical-path acknowledgment

Steps 1–7 of the master roadmap apply globally. This section's specific touchpoints from each step:

### Step 1 — Terminology migration (this section)
- **Sub-step 1.1** (*pathos simpliciter* → *epithymia*): None in §1.1 (the term is concentrated in §§1.2/1.3/1.4)
- **Sub-step 1.2** (*resonant orexis* → *resonant epithymia*): None in §1.1
- **Sub-step 1.4** (*Befindlichkeit* standardization): None in §1.1 (verify on revision)
- **Net**: §1.1 has minimal terminology migration load; primarily benefits from architectural-vocabulary consistency.

### Step 2 — Numbering migration (this section)
- 3 patches (per `numbering-audit.json`):
  - **Line 5**: notation-declaration revision (`$M_n \rightarrow M_{n+1}$ names the transitions between them` → `$M_n \rightarrow A_n$ names the transitions terminating in them (per \textit{Physics} V.1, 224b7–8)`) — **USER-REVIEW-RECOMMENDED PHRASING**
  - **Line 51**: `$M_3 \rightarrow M_4$` → `$M_4 \rightarrow A_4$`
  - **Line 89**: `$M_2 \rightarrow M_3$` → `$M_3 \rightarrow A_3$`

### Step 3 — Burke + Hawhee corrections (PRIMARY SITE — this is the corrections section)
- **§1.1 IS THE CORRECTIONS HUB**: both Burke and Hawhee corrections concentrate here
  - **Burke**: 3 instances cite `Grammar` pp.280–281; correct loci are pp.253 (temporal-priority quote) and pp.261–262 (entelechy / man-prior-to-boy quotes)
    - §1.1 .md line 5 / .tex line 7 instance 1
    - §1.1 .md line 5 / .tex line 7 instance 2
    - §1.1 PROMPT.md template (lines 43, 47, 127, 172) — sweep also
  - **Hawhee**: 1 instance cites *Bodily Arts* p.154; correct attribution is Hawhee 2011 "Looking Into Aristotle's Eyes" / "Rhetorical Vision" p.154
    - §1.1 .md line 19 / .tex line 21
- Evidence + Edit-ready patches: `_synthesis/burke-correction-evidence.md` + `_synthesis/hawhee-correction-evidence.md`

### Step 4 — Aₙ-naming architectural fix
- §1.1 line 5 notation-declaration (Step 2 P1) carries the chain-wide convention statement; verify it reads correctly after the Aₙ resolution lands at §1.0.
- §1.1 references to chain-architecture claims should be cross-checked against the revised §1.0 prose (post-Step 4) to ensure no §1.0/§1.1 drift.

### Step 5 — Relocations
- §1.1 is neither source nor target of any relocation. BUT:
  - **DA II.5, 417b2-7 cross-reference check**: per `relocations.json` REL-002 downstream-edits #5, §1.1's use of DA II.5 may need attention. The relocation moves DA II.5 to §1.2 as canonical site; §1.1 may retain in its own architectural context (motion-from-an-unmoved-originator) or back-reference to §1.2. **User decision required**.

### Step 6 — Diagram static exports
- Use `diag-A0-for-section-1.1.md` (the A₀ cutout)

### Step 7 — Hexeis development
- §1.1 does not require hexeis development (downstream of §1.1).

---

## Per-section citation gaps (after Phase 4)

**Total**: 18 gaps. Phase 4 produced **22 citation-fill proposals** (more proposals than gaps — multiple fill candidates for some). Tier breakdown:

| Support tier | Count | Notes |
|---|---|---|
| T8-secondary-needed | 5 | Largest tier — secondary literature on Phys IV.14, Burke, Hawhee, Heidegger Kant book |
| T5-under-supported | 8 | Bulk |
| T4-interpretive-but-unflagged | 4 | Add interpretive flag for Heideggerian-radicalization moves |
| T7-overreach | 1 | Soften |
| T6-unsupported | 0 | (§1.1 is well-anchored) |

**Routing**:
- Tier A (corpus/index): high
- Tier C (cache + 6 fresh Perplexity): Q-006 Burke verification, Q-007 Burke alt, Q-008 Hawhee work-title, Q-009 Hussey Phys IV.14 commentary, Q-010 Coope strong-reading, Q-011 Heidegger Kant book

**Key gaps**:

| Gap | Tier | Effort | Notes |
|---|---|---|---|
| DISS-01-G05 (Hazlitt-identification in Burke RM 1950) | T8 | medium | Surfaces Burke *Rhetoric of Motives* pipeline gap; tier-C Perplexity Q-006 proposal |
| DISS-01-G06/G07 Burke corrections | T8 (citational) | small | RESOLVED by Step 3 |
| DISS-01-G08 Hawhee correction | T8 (citational) | small | RESOLVED by Step 3 |
| DISS-01-G09 (Phys IV.14 strong-reading additional secondary) | T8 | medium | Q-010 Coope 2005 proposal |
| DISS-01-G14 (Heidegger Kant book) | T8 | medium | Q-011 EN/DE proposal pair |
| DISS-01-G15 (interpretive flag for strong-reading) | T4 | small | Add `(per the strong reading defended below)` |
| INCONS-009 Bekker locus 223a25-27 → 223a21-26 | (in-text fix) | trivial | Bekker correction |

---

## Lanham revision priorities

Per `_synthesis/lanham-profile-matrix.json` priority 7:

- **No structural style revision needed**. All 6 axes ALIGNED with marginal positive drift.
- **Modest tightening**: Tighten explicit interpretive flagging on un-flagged Heideggerian-radicalization moves (kinēsis ≅ Bewegtheit; dyadic kinēsis ≅ proto-In-der-Welt-sein) to nudge opacity from 0.32 → 0.34.

---

## Architectural-mismatch findings to address

| Finding | Severity | Resolution path |
|---|---|---|
| INCONS-002 (Burke pp.280–281 misattribution × 3) | CRITICAL | Step 3 of master roadmap |
| INCONS-003 (Hawhee work-title misattribution) | CRITICAL | Step 3 of master roadmap |
| INCONS-009 (Phys IV.14 strong-reading flag propagation + Bekker 223a25-27 → 223a21-26) | MAJOR | (1) Fix Bekker locus. (2) At §1.2 first deployment of resonant kinēsis temporal-persistence, add `(per the strong reading of Phys. IV.14 defended in §1.1)`. (3) At §1.4 first deployment of Befindlichkeit temporal-grounding, similarly cross-reference §1.1. |

---

## Estimated total effort (post-critical-path)

| Component | Min (min) | Max (min) |
|---|---|---|
| Citation fills integration (22 files; includes 6 Tier-C Perplexity verification) | 120 | 180 |
| Burke/Hawhee corrections (Step 3, already prepared as Edit-ready patches) | 30 | 45 |
| Lanham modest tightening (Heideggerian flag additions) | 30 | 60 |
| Bekker fix + Phys IV.14 strong-reading flag propagation | 30 | 60 |
| Interpretive-flag additions (T4 gaps × 4) | 30 | 60 |
| Numbering migration (Step 2, 3 patches + line 5 review) | 15 | 30 |
| **Total** | **255 min (~4.3 hrs)** | **435 min (~7.3 hrs)** |

**Midpoint**: ~5 hrs post-critical-path.

---

## Files referenced

- Section file: `/home/dalton/projects/claudeflow-testing/tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex`
- Section file (.md mirror): `/home/dalton/projects/claudeflow-testing/tmp/Dissertation/1.1 - A0 - Motion and Time/1.1 - A0 - Motion and Time.md`
- PROMPT template (sweep target): `/home/dalton/projects/claudeflow-testing/tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_PROMPT.md`
- Phase 1 metadata: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-01-A0/phase1-metadata.json`
- Phase 2 claims: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-01-A0/phase2-claims.json`
- Phase 2 Lanham profile: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-01-A0/phase2-lanham-profile.json`
- Citation-gap table: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-01-A0/citation-gap-table.json`
- Phase 4 fill proposals: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-01-A0/citation-fills/`
- Burke evidence + patches: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_synthesis/burke-correction-evidence.md`
- Hawhee evidence + patches: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_synthesis/hawhee-correction-evidence.md`
- Diagram static export: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-DIAG-V7/static-exports/diag-A0-for-section-1.1.md`
