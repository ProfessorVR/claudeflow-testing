# Phase 3C — T-Stage Schema (v1.0)

**Pipeline**: Phantasia Chapter Analysis
**Version**: 1.0
**Date**: 2026-03-10
**Source**: Phase 0 T-stage reconciliation + Phase 2 unit analyses

---

## Canonical Schema

| T-Stage | Name | Description | Primary Faculties | Key Examples | Associated Affect/Judgment | Chapter Sections |
|---------|------|-------------|-------------------|--------------|---------------------------|-----------------|
| **T0** | Motion and Time | Pre-conditions: *kinesis* as ontological ground, *chronos* as "number of motion with respect to before and after." Asymmetric dependency: time depends on motion. | — | Physics IV analysis | — | A 1.2 |
| **T1** | *Aisthesis* (First Motion) | Sensory encounter: form received without matter (*alloiosis*). *Dynamis* → *energeia*. Instantaneous contact with present. | aisthesis | Crack of bat (outfielder) | — (purely receptive) | A 1.3 |
| **T2** | Perceptual Actualization | Sense organ undergoes *kinesis*; perceptual capacity actualized. Motion is "in" the perceiver. | aisthesis, pathos | Ball present to senses | Residual affect begins | A 1.4 |
| **T3** | Resonant Motion (*Phantasma* Generated) | Residual *kinesis* (*apoleipomene kinesis*) persists after object withdraws. Inner likeness crystallizes as *phantasma*. | phantasia, kinesis | Ball positions A→B→C stored | — | A 1.4 |
| **T4** | Phantasma Activation | Phantasia activates stored phantasmata. Soul operates on images: recognizing, comparing, imagining. Phantasma functions as *eikon*. | phantasia, mneme | "Baseball" recognition; rattlesnake fear | Fear, anticipation | A 1.5 |
| **T5** | Deliberation | Combination of phantasmata (*sumploke*); practical syllogism. Deliberative phantasia enables planning. | deliberative phantasia, phronesis | Calculating catch angle | Comparative judgment | A 1.1 (embedded) |
| **T6** | Action (Pursue/Avoid) | Culmination: *orexis* moves toward or away. Emotion (*pathos*) is e-motion. Locomotion, affective motion, intellectual motion. | orexis, kinesis | Running to catch; body movement | Pleasure/pain, desire | A 1.1, 1.5.1 |

---

## Loop Structure

```
T1 ──→ T2 ──→ T3 ──→ T4 ──→ T5 ──→ T6
↑                      ↑              │
│                      │ (background)  │
│                      └───────────────┘ (T5 updates as new T1-T3 data arrives)
└──────────────────────────────────────┘ (T6 feeds back: action changes perceptual field → new T1)
```

- T1-T3: **continuous** (new percepts arriving constantly)
- T4: **background** (phantasmata available for recall/recognition)
- T5: **updating** (recalculates as new T1-T3 data arrives)
- T6: **feedback** (action changes perceptual field, generating new T1)

---

## Chapter 2 Extension: Stimmung's Temporality

Stimmung does NOT add a new T-stage. It provides the **existential temporal horizon** within which T0-T6 unfold:

```
┌─────────────────────────────────────────────────────────────┐
│  STIMMUNG (pre-temporal horizon)                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  T0 → T1 → T2 → T3 → T4 → T5 → T6 → (loop)       │  │
│  └───────────────────────────────────────────────────────┘  │
│  Stimmung colors ALL T-stages with existential significance │
└─────────────────────────────────────────────────────────────┘
```

### 4-Step Schema Overlay

| 4-Step | Maps to T-Stage | Temporal Character |
|--------|-----------------|-------------------|
| 1. Stimmung → horizon | pre-T0 | Pre-temporal resonance |
| 2. Phantasia → appearances | T3-T4 | Temporal trace |
| 3. Doxa → assent | T5 | Judgment within time |
| 4. Pathos → emotion | T6 | Structured motion in time |

---

## Known Issues (v1.0)

1. **Section 1.5.3 numbering error**: Labeled "(T1)" in source text; content is temporal synthesis (T4/T5 area). Flagged for author revision.
2. **T7 abandoned**: Document B lists T7 with no content. Not included in v1.0.
3. **T5-T6 coverage gap**: No dedicated sections; covered functionally within emotion/doxa analysis.
4. **Non-deliberative path**: The phantasia→pathos direct path (no doxa, no T5) is not formally captured as a T-stage variant. The schema assumes the full chain; the direct path is a shortcut.

---

## Version History

| Version | Date | Changes | Rationale |
|---------|------|---------|-----------|
| v1.0 | 2026-03-10 | Initial schema from Ch 1-2 analysis | Baseline from primary text (Doc A) |
