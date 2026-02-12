# Research Documentation Index

## Folder Structure

```
research/
├── INDEX.md                      (this file)
├── veridissimilitude-augmentation/   (PhD Pipeline Phase 1-10 outputs)
├── dissertation-integration/         (Earlier dissertation compilation work)
├── rdr2-analysis/                    (RDR2-specific research materials)
├── routing-diagnostics/              (God Agent routing investigation)
└── reference-materials/              (Scholarly sources, frameworks, bibliographies)
```

---

## 1. Veri(dis)similitude Augmentation (`veridissimilitude-augmentation/`)

**Project:** 10-phase PhD pipeline execution to augment the Veri(dis)similitude MA thesis with RDR2 tutorial analysis.

**Date:** 2026-01-20

### Phase Outputs

| Phase | File | Description |
|-------|------|-------------|
| Plan | `rhetorical-phantasia-execution-plan.md` | Complete 10-phase methodology with agent mappings |
| 1 | `phase1_ontological_situation_report.md` | Philosophical registers, gaps identified |
| 2 | `phase2_conceptual_field.md` | 22 concepts defined with provenance and negations |
| 3 | `phase3_text_concept_alignment.md` | Primary source citations mapped to concepts |
| 4 | `phase4_relational_structure.md` | Graphable argument logic and relations |
| 5 | `phase5_rdr2_tutorial_analysis.md` | 8 mechanic clusters analyzed ontologically |
| 6 | `phase6_rhetorical_force_assessment.md` | VR/game rhetorical force equivalence tested |
| 7 | `phase7_controlled_composition.md` | 10 paragraphs composed in Veri(dis)similitude voice |
| 8 | `phase8_gap_repair.md` | 6 gaps identified with primary source repairs |
| 9 | `phase9_veridissimilitude_integrated.md` | 7 integration points with ~2,300 new words |
| 10 | `phase10_veridissimilitude_augmented.tex` | LaTeX file with `\hl{}` highlighting |

### Key Contributions

- **New Concept:** *Procedural veri(dis)similitude* — extends VR-specific concept to game tutorials
- **New Sources:** Aristotle (*De Anima*), Calleja (*In-Game*), Rickert (*Ambient Rhetoric*)
- **Integration:** 7 sections augmented, ~2,300 new words

---

## 2. Dissertation Integration (`dissertation-integration/`)

**Project:** Earlier dissertation compilation work integrating multiple source documents.

### Key Files

| File | Description |
|------|-------------|
| `dissertation-full-integrated.pdf` | Final compiled PDF |
| `dissertation-full-integrated.tex` | LaTeX source |
| `dissertation-integration-guide.md` | Integration methodology |
| `dissertation-integration-changelog.md` | Change log |
| `dissertation-expansion-draft.md` | Initial draft |
| `dissertation-expansion-draft-revised.md` | Revised draft |
| `dissertation-expansion-refinement.md` | Refinement notes |
| `dissertation-final-compiled.md` | Final markdown compilation |
| `dissertation-complete-assembled.md` | Assembled version |
| `dissertation_completions.md` | Completion tracking |

---

## 3. RDR2 Analysis (`rdr2-analysis/`)

**Project:** Red Dead Redemption 2 tutorial analysis research materials.

### Files

| File | Description |
|------|-------------|
| `rdr2-annotated-bibliography.md` | Annotated bibliography of RDR2 sources |
| `rdr2-gg-comparative-matrix.md` | Comparative matrix: RDR2 vs Gnomes & Goblins |
| `rdr2-dissertation-expansion-plan.md` | Expansion plan for dissertation |

---

## 4. Routing Diagnostics (`routing-diagnostics/`)

**Project:** Investigation of God Agent local-first routing system (2026-01-16).

### Files

| File | Description |
|------|-------------|
| `DIAGNOSIS_SUMMARY.md` | Executive summary, problem statement, solution |
| `routing-diagnostic-report.md` | Detailed architecture analysis, root cause |
| `routing-execution-flow-diagram.md` | ASCII flow diagrams, before/after |

### Key Findings

**Problem:** The `CapabilityRouter` is fully implemented but never invoked during god-ask execution because the Task tool spawning mechanism bypasses it entirely.

**Root Cause:** No abstraction layer exists between routing decisions and LLM API calls.

**Solution:** Implement provider abstraction layer (vLLM, Claude providers) and integrate routing decision into `executeTaskDefault()` execution path.

**Status:** Investigation Complete. Local-first routing now operational (fixed 2026-01-20).

---

## 5. Reference Materials (`reference-materials/`)

**Project:** Scholarly sources, framework summaries, and general reference documents.

### Files

| File | Description |
|------|-------------|
| `scholarly-sources-phantasia.md` | Scholarly sources on phantasia |
| `calleja-framework-summary.md` | Summary of Calleja's Player Involvement Model |
| `gnomes-goblins-reference-index.md` | Reference index for Gnomes & Goblins VR analysis |
| `veridissimilitude-application.md` | Application notes for veri(dis)similitude concept |
| `phd-pipeline-improvement-proposal.md` | Proposal for PhD pipeline improvements |

---

## Navigation

- **Quick start:** Check `veridissimilitude-augmentation/` for the latest PhD pipeline outputs
- **Compiled outputs:** PDF files are in `dissertation-integration/`
- **Reference lookup:** Check `reference-materials/` for framework summaries

---

**Last Updated:** 2026-01-20
**Total Files:** 45
**Subfolders:** 5
