# Revision Checklist — §1.3 A₃: Completed Cognitive Actuality and the Three Orientational Modes (DISS-03-A3)

**Section file**: `tmp/Dissertation/1.3 - A3 - Orentational Modes/1.3 A3 - Orientational Modes.md`
**Master roadmap**: `_synthesis/revision-roadmap.md`
**Sequencing in master roadmap**: After critical-path Steps 1–4 (terminology + numbering + Burke/Hawhee + Aₙ-resolution)

---

## Section status

| Metric | Value |
|---|---|
| Word count (prose) | 9,650 |
| Sentence count | 290 |
| Phase 2 claim count | ~155 |
| Phase 4 fill files produced | 25 (`_per-section/DISS-03-A3/citation-fills/`) — includes 1 Tier-C Perplexity (Q-015 Papachristou/Aquinas) |
| Six-axis Lanham profile | `{nv: 0.61, para: 0.63, periodic: 0.44, voice: 0.33, register: 0.74, opacity: 0.33}` |
| Lanham composite (register × hypotaxis) | 0.466 (+0.027 above §1.4; well within developed band) |
| Lanham overall tag | **ALL-ALIGNED (closest match to §1.4)** of any non-gold section; all 6 axes within ±0.03 |
| User-signature transitions | 36 (canonical-five 24: thus×11, specifically×1, indeed×3, accordingly×9; plus however×6, therefore×5, furthermore×1) |

---

## Pre-critical-path acknowledgment

Steps 1–7 of the master roadmap apply globally. This section's specific touchpoints from each step:

### Step 1 — Terminology migration (this section — HEAVIEST LOAD)
- **Sub-step 1.1** (*pathos simpliciter* → *epithymia*): **8 occurrences** in §1.3
- **Sub-step 1.2** (*resonant orexis* → *resonant epithymia*): **15 occurrences** in §1.3 — **the largest single-section migration**
- **Sub-step 1.3** (insert *resonant pathē*): **§1.3 Memory subsection (lines 41–48) is a PRIMARY insertion target** — wherever memory-phantasma elicits anger/fear/shame, that's now *resonant pathē*
- **Sub-step 1.4** (*Befindlichkeit* standardization): None native to §1.3; verify on revision
- **Sub-step 1.5** (footnote insertions): §1.3 may host the *resonant pathē* first-use footnote (per `terminology-decisions-final.md` §3.3) — depends on which §ction reaches the first usage site first

### Step 2 — Numbering migration (this section)
- 5 patches (per `numbering-audit.json`):
  - **Line 59**: `$M_3 \to M_4$` → `$M_4 \to A_4$`
  - **Line 65**: `$M_2 \rightarrow M_3$` → `$M_3 \rightarrow A_3$`
  - **Line 67**: `$M_2 \to M_3$ \hl{(double check numbering)}` → `$M_3 \to A_3$` (also removes `\hl{}` annotation; user self-flagged)
  - **Line 114**: `$M_2 \rightarrow M_3$` → `$M_3 \rightarrow A_3$`
  - **Line 117**: `$M_3 \rightarrow M_4$` → `$M_4 \rightarrow A_4$`

### Step 3 — Burke + Hawhee corrections
- No direct touchpoints in §1.3 (corrections concentrated in §1.1). Sweep for any Burke pp.280-281 occurrences (none detected by Phase 3 but verify).

### Step 4 — Aₙ-naming architectural fix
- **§1.3 has off-by-one offset relative to diagram**: per `numbering-audit.json` orphan_references, "§1.3 offset-numbering misalignment ($A_3$ in prose = $A_2$ in diagram)". The Step 4 chain-wide propagation resolves this.
- **INCONS-012** (§1.3 lines 29 vs. 31 — three-vs-four orientational modes): Resolved at Step 4. Rewrite §1.3 line 31 "Four orientational modes must be distinguished" → "Three orientational modes must be distinguished". Adjust following sentence so *doxa* is unambiguously orthogonal committal layer.
- **INCONS-001 affects §1.3 via DISS-03-C026, C076** — propagation from §1.0 keystone fix.

### Step 5 — Relocations
- §1.3 is neither source nor target. **BUT** verify §1.3's references to "the four senses" or "the Metaphysics fourfold" cite §1.2 (post-REL-001), not §1.4.
- Verify §1.3's references to *paschein*-preservation cite §1.2 (post-REL-002).
- Verify §1.3's references to perception-as-discriminative cite §1.2 (post-REL-003).

### Step 6 — Diagram static exports
- Use `diag-M2-A3-doxa-for-section-1.3.md` (the M₂→A₃ + doxa-orthogonal cutout)

### Step 7 — Hexeis development
- §1.3 may need a Papachristou three-grades framework inline-note resolution (user-flagged in Phase 1 metadata as forward-promised in §1.0; "partially fulfilled" per INCONS analysis)

---

## Per-section citation gaps (after Phase 4)

**Total**: 32 gaps. Phase 4 produced **25 citation-fill proposals**. Tier breakdown:

| Support tier | Count | Notes |
|---|---|---|
| T5-under-supported | 23 | Bulk |
| T8-secondary-needed | 7 | Papachristou + Aquinas + other secondary |
| T7-overreach | 2 | Soften |

**Effort distribution** (per `gap_summary`):
- trivial: 8
- small (5–10 min): 12
- small-medium (10–15 min): 4
- medium (15–25 min): 5
- large (deferred): 3

**Routing**:
- Corpus/index only: 21
- Corpus/index + ChromaDB: 4
- Editorial only: 7
- Perplexity required: 0 (Q-015 already executed)

---

## Lanham revision priorities

Per `_synthesis/lanham-profile-matrix.json` priority 8 (OPTIONAL):

- **Closest single match to §1.4 of any non-gold section**. Minimal style revision.
- **OPTIONAL**: Insert 4–5 additional *accordingly* (current 9 vs. §1.4's 18) to match cadence. Gap not large enough to count as drift.

---

## Architectural-mismatch findings to address

| Finding | Severity | Resolution path |
|---|---|---|
| INCONS-012 (three-vs-four orientational modes at lines 29/31) | MAJOR | Rewrite §1.3 line 31 (Step 4) |
| INCONS-001 propagation (DISS-03-C026, C076) | CRITICAL (resolved by Step 4) | Step 4 of master roadmap |
| §1.3 line 67 `\hl{(double check numbering)}` annotation | (user self-flag) | Resolved by Step 2 P3 (the numbering migration also removes the highlight annotation) |
| Papachristou three-grades framework inline-note (forward-promised by §1.0; flagged in Phase 1) | (developmental) | User decision: develop in §1.3 or defer |

---

## Estimated total effort (post-critical-path)

| Component | Min (min) | Max (min) |
|---|---|---|
| Citation fills integration (25 files) | 150 | 250 |
| Terminology migration (8 *pathos simpliciter* + 15 *resonant orexis* + *resonant pathē* insertions at Memory subsection) | 90 | 150 |
| INCONS-012 (line 31 three-vs-four rewrite) | 15 | 30 |
| Numbering migration (Step 2, 5 patches incl. `\hl{}` cleanup) | 15 | 25 |
| §1.2 cross-reference verifications post-relocations (3 verifications) | 30 | 60 |
| Papachristou inline-note (optional development) | 30 | 60 |
| Lanham optional *accordingly* insertions (4–5) | 15 | 30 |
| **Total** | **345 min (~5.8 hrs)** | **605 min (~10.1 hrs)** |

**Midpoint**: ~6 hrs post-critical-path. (Note: terminology load is heaviest in §1.3.)

---

## Files referenced

- Section file: `/home/dalton/projects/claudeflow-testing/tmp/Dissertation/1.3 - A3 - Orentational Modes/1.3 A3 - Orientational Modes.md`
- Phase 1 metadata: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-03-A3/phase1-metadata.json`
- Phase 2 claims: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-03-A3/phase2-claims.json`
- Phase 2 Lanham profile: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-03-A3/phase2-lanham-profile.json`
- Citation-gap table: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-03-A3/citation-gap-table.json`
- Phase 4 fill proposals: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-03-A3/citation-fills/`
- Diagram static export: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-DIAG-V7/static-exports/diag-M2-A3-doxa-for-section-1.3.md`
