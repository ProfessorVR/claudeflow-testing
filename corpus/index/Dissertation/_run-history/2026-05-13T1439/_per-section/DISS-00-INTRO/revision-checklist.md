# Revision Checklist — §1.0 Introduction (DISS-00-INTRO)

**Section file**: `tmp/Dissertation/1.0 - Introduction/1.0 - Introduction.md`
**Master roadmap**: `_synthesis/revision-roadmap.md`
**Sequencing in master roadmap**: After critical-path Steps 1–4 (terminology + numbering + Burke/Hawhee + Aₙ-resolution)

---

## Section status

| Metric | Value |
|---|---|
| Word count (prose) | 4,009 |
| Sentence count | 129 |
| Phase 1 citation density | (baseline; introduction-grade) |
| Footnote count | (architectural-conclusory; intro-grade) |
| Phase 2 claim count | ~95 |
| Phase 4 fill files produced | 12 (`_per-section/DISS-00-INTRO/citation-fills/`) |
| Six-axis Lanham profile | `{nv: 0.58, para: 0.55, periodic: 0.36, voice: 0.34, register: 0.64, opacity: 0.27}` |
| Lanham composite (register × hypotaxis) | 0.352 (lower edge of healthy [0.35, 0.55] band) |
| Lanham overall tag | **ALL-ALIGNED** with §1.4 baseline; register at -0.08 (boundary) |
| Lanham-axis breakdown | nv ALIGNED (-0.04), para ALIGNED (-0.06), periodic ALIGNED (-0.05), voice ALIGNED (+0.02), register ALIGNED-boundary (-0.08), opacity ALIGNED (-0.07) |
| User-signature transitions | 13 (thus×3, indeed×0, specifically×0, accordingly×5, hence×1) — substantially below §1.4's 45 |

---

## Pre-critical-path acknowledgment

Steps 1–7 of the master roadmap apply globally. This section's specific touchpoints from each step:

### Step 1 — Terminology migration (this section)
- **Sub-step 1.2** (`resonant orexis` → `resonant epithymia`): **2 occurrences** in §1.0
- **Sub-step 1.5** (footnote insertions): None native to §1.0; first-use sites are in §1.2/§1.3/§1.4
- **INCONS-015**: §1.0 line 19 "resonant motion" → `resonant kinēsis` (informal-to-canonical drift; not a terminology-decisions item but a §1.0 internal consistency fix)

### Step 2 — Numbering migration (this section)
- 4 patches in the TikZ block (lines 186, 190, 194, 198) — all user-facing
  - `$M_0 \!\to\! M_1$: Perceptual Motion` → `$M_1 \!\to\! A_1$: Perceptual Motion`
  - `$M_1 \!\to\! M_2$: Phantastic Motion` → `$M_2 \!\to\! A_2$: Phantastic Motion`
  - `$M_2 \!\to\! M_3$: Cognitive Engagement` → `$M_3 \!\to\! A_3$: Cognitive Engagement`
  - `$M_3 \!\to\! M_4$: \textit{Orektikon} Motion` → `$M_4 \!\to\! A_4$: \textit{Orektikon} Motion`

### Step 3 — Burke + Hawhee corrections
- No direct touchpoints in §1.0 (corrections concentrated in §1.1). If §1.0 references Burke *Grammar* page numbers or Hawhee *Bodily Arts* (verify on revision), apply the same correction.

### Step 4 — Aₙ-naming architectural fix (PRIMARY SITE — this is the keystone)
- **§1.0 IS THE KEYSTONE**: the chain-wide Aₙ convention must be re-anchored here
  - Line 45 prose: rewrite for A₃ = "completed cognitive actuality (phantasma under three orientational modes + doxa)" and A₄ = "completed action (*praxis*)"
  - Line 64: rewrite A₂ → A₃ as cognitive engagement of the *phantasma* (not "actualization of the completed cognitive actuality" — that was the internal contradiction per INCONS-004)
  - Line 68: rewrite M₃ → A₄ (post-Step 2) as orectic motion to action (not "cognitive engagements of the phantasma" — those happen at A₃)
  - Verify §1.0 embedded TikZ labels match the rewritten prose (Step 2 already migrated mechanically; cross-check consistency)
- **INCONS-001, INCONS-004 affect §1.0 directly**: 5 affected claims (DISS-00-C074, C080, C091, C092 + 1)

### Step 5 — Relocations
- §1.0 is neither source nor target of any relocation. BUT verify §1.0 cross-references to "the fourfold" or "the Metaphysics fourfold" — if §1.0 references the fourfold as "developed in §1.4", update to "§1.2" post-REL-001. (Phase 1 metadata for DISS-00-INTRO should be reviewed for any such forward-reference.)

### Step 6 — Diagram static exports
- §1.0 contains the embedded TikZ chain (lines 184–198) — this is the §1.0-specific diagram (full chain). The `diag-full-chain.md` static export is the §1.0 reference.

### Step 7 — Hexeis development
- §1.0 does not require hexeis-specific development; the topic is downstream of §1.0.

---

## Per-section citation gaps (after Phase 4)

**Total**: 16 gaps. Phase 4 produced **12 citation-fill proposals**. Tier breakdown:

| Support tier | Count | Notes |
|---|---|---|
| T6-unsupported | 4 | Most-pressing for §1.0 |
| T5-under-supported | 8 | Bulk; mostly Tier-A corpus/index routable |
| T7-overreach | 3 | Soften or hedge |
| T4-interpretive-but-unflagged | 1 | Add interpretive flag |
| T8-secondary-needed | 0 | (§1.0 mostly primary-source-anchored) |

**Routing**:
- Tier A (corpus/index): 13
- Tier C (cache): 1
- in-text fix only: 2

**Key gaps** (see `citation-gap-table.json` for full list):

| Gap | Tier | Effort | Notes |
|---|---|---|---|
| DISS-00-G01 (C047) | T6 | trivial (in-text) | `???` placeholder at line 41 — identify forward-reference target chapter (likely Chapter X engaging Heidegger/Rickert/Uexküll/Burke per line 68) |
| Aₙ-architectural gaps (C074, C080, C091, C092) | T6/T5 | (RESOLVED by Step 4) | Cross-section reconciliation; do NOT route to corpus until §1.0 prose-diagram reconciliation resolved |

---

## Lanham revision priorities

Per `_synthesis/lanham-profile-matrix.json` priority 6 (DECISION POINT):

**Option A** (keep as-is): Accept boundary register (-0.08) as intentional accessibility for an introduction.
**Option B** (lift toward §1.4): Add 1–2 *specifically* / *indeed* signature transitions; integrate *Befindlichkeit* / *Stimmung* at §§1.1/1.4-anticipation points.

**Constraint**: Do not drop below composite 0.35.

**Recommendation**: Option A unless user wishes §1.0 to register as more philosophically dense.

---

## Architectural-mismatch findings to address

Concentrated in §1.0; primary site for chain-wide fix:

| Finding | Severity | Resolution path |
|---|---|---|
| INCONS-001 (Systemic Aₙ-naming across §§1.0/1.3/1.5/DIAG) | CRITICAL | Step 4 of master roadmap |
| INCONS-004 (§1.0 line 64 internal contradiction) | CRITICAL | Step 4 (bundled with INCONS-001) |
| INCONS-005 (pathos equivocation-RISK; §1.0 first-occurrence register-key footnote needed) | CRITICAL | Add register-key footnote at §1.0 first pathos-occurrence pointing forward to §1.4 ¶2 |
| INCONS-014 (phantasia vs. phantasma capacity/product distinction) | MAJOR | At §1.0 first joint occurrence, add parenthetical noting the distinction (per §1.3 canonical site) |
| INCONS-015 (resonant motion → resonant kinēsis) | MINOR | Line 19 replace; trivial |

### §1.0 promises vs. §§1.1–1.5 delivery (per `inconsistencies-and-fallacies.json` cross-section pattern)

- **Fulfilled**: 7 promises
- **Partially fulfilled**: 3
  - Papachristou three-grades framework (§1.0 forward-promise; §1.3 inlinenote-flagged for development)
  - phantasia-as-temporal-medium framing drift relative to §1.1's A₀ and §1.2's A₂ placements
  - M₃ → A₄ cognitive-engagements vs. orectic-motion-to-action drift (sub-finding of INCONS-001)
- **Unfulfilled-deferred**: 1 — Chapter ??? placeholder (rhetorical-framing defense)

All 3 partial items are covered by INCONS-001 remediation (Step 4).

---

## Estimated total effort (post-critical-path)

| Component | Min (min) | Max (min) |
|---|---|---|
| Citation fills integration (12 files) | 60 | 100 |
| Lanham revisions (decision point + register-key footnote + phantasia/phantasma parenthetical) | 30 | 60 |
| Architectural-mismatch fixes (cascade of Step 4 from §1.0 keystone outward; INCONS-001/004/005/014/015) | 90 | 180 |
| Numbering migration (Step 2, 4 patches) | 10 | 15 |
| §1.0 promise-fulfillment audits (Papachristou + phantasia-as-temporal-medium + cross-refs to §1.2 post-REL-001) | 30 | 60 |
| **Total** | **220 min (~3.7 hrs)** | **415 min (~6.9 hrs)** |

**Midpoint**: ~4 hrs post-critical-path.

---

## Files referenced

- Section file: `/home/dalton/projects/claudeflow-testing/tmp/Dissertation/1.0 - Introduction/1.0 - Introduction.md`
- Phase 1 metadata: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-00-INTRO/phase1-metadata.json`
- Phase 2 claims: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-00-INTRO/phase2-claims.json`
- Phase 2 narrative: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-00-INTRO/phase2-narrative.md`
- Phase 2 Lanham profile: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-00-INTRO/phase2-lanham-profile.json`
- Citation-gap table: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-00-INTRO/citation-gap-table.json`
- Phase 4 fill proposals: `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-00-INTRO/citation-fills/`
