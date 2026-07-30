# Lanham Profile Matrix — Run 2026-05-13T1439

**Agent**: Phase 3 Wave 3 Agent 3F
**Run ID**: 2026-05-13T1439
**Date**: 2026-05-13
**Source data**: 6 × `phase2-lanham-profile.json` files in `_per-section/<section-id>/`
**Plan reference**: §9.3 / §9.3.1 (Lanham profile matrix); §5.5 (Lanham axes); G6

---

## 1. Baseline definition

**§1.4 (DISS-04-EMOTION, "Emotion is Motion")** is the gold-standard baseline. Its six-axis Lanham signature defines the per-axis target the other five sections are measured against:

| Axis | §1.4 baseline | Label |
|------|--------------:|-------|
| nounVerb | 0.62 | noun-style |
| parataxisHypotaxis | 0.61 | hypotactic |
| periodicRunning | 0.41 | periodic-with-running-cohabitation |
| voice | 0.32 | predominantly-active |
| register | 0.72 | high-Latinate-formal |
| opacity | 0.34 | moderately-transparent |

**Composite (register × hypotaxis)**: 0.439. §1.4's interpretive notes specify the healthy band as 0.35–0.55; below 0.35 = under-developed; above 0.55 = over-formal.

**Per-axis bands** (from §1.4's `target_metrics_for_other_sections.thresholds_per_axis`):

| Axis | ALIGNED window | DRIFT-TOWARD (toward neutral 0.5) | DRIFT-AWAY (beyond §1.4) | INVERSE |
|------|---------------|-----------------------------------|--------------------------|---------|
| nounVerb (b=0.62) | [0.52, 0.72] | [0.42, 0.52] | [0.72, 0.82] | <0.42 or >0.82 |
| parataxisHypotaxis (b=0.61) | [0.51, 0.71] | [0.41, 0.51] | [0.71, 0.81] | <0.41 or >0.81 |
| periodicRunning (b=0.41) | [0.31, 0.51] | [0.51, 0.61] (toward periodic) | [0.21, 0.31] (toward running) | <0.21 or >0.61 |
| voice (b=0.32) | [0.22, 0.42] | [0.42, 0.52] (toward passive) | [0.12, 0.22] (more active) | <0.12 or >0.52 |
| register (b=0.72) | [0.62, 0.82] | [0.52, 0.62] | [0.82, 0.92] | <0.52 or >0.92 |
| opacity (b=0.34) | [0.24, 0.44] | [0.14, 0.24] (more opaque) | [0.44, 0.54] (more transparent) | <0.14 or >0.54 |

---

## 2. Delta classification (per Plan §9.3.1)

- **Aligned**: |Δ| ≤ 0.10 — axis sits in the §1.4 window.
- **Drift-toward**: |Δ| in (0.10, 0.20] toward neutral 0.5 — section is *weaker* than §1.4 on this axis.
- **Drift-away**: |Δ| in (0.10, 0.20] away from neutral, beyond §1.4 — section is *stronger* than §1.4 on this axis.
- **Inverse**: |Δ| > 0.20 (or crosses the axis-label threshold) — section is on the other side of the threshold.

---

## 3. Per-axis matrix

Each cell shows `value (delta) [tag]` where delta = section minus §1.4 baseline.

| Section | nounVerb | parataxisHypotaxis | periodicRunning | voice | register | opacity | Tacit pattern signature |
|---------|---------|---------|---------|---------|---------|---------|------|
| **§1.4 ★ BASELINE** | 0.62 (0.00) [—] | 0.61 (0.00) [—] | 0.41 (0.00) [—] | 0.32 (0.00) [—] | 0.72 (0.00) [—] | 0.34 (0.00) [—] | Antithesis (high), isocolon (mod), polyptoton (mod-high), allit 1.422/s |
| **§1.0** | 0.58 (−0.04) [ALIGNED] | 0.55 (−0.06) [ALIGNED] | 0.36 (−0.05) [ALIGNED] | 0.34 (+0.02) [ALIGNED] | 0.64 (−0.08) [ALIGNED boundary] | 0.27 (−0.07) [ALIGNED] | Isocolon (high), polyptoton (high), antithesis (mod), allit 0.938/s |
| **§1.1** | 0.64 (+0.02) [ALIGNED] | 0.66 (+0.05) [ALIGNED] | 0.46 (+0.05) [ALIGNED] | 0.30 (−0.02) [ALIGNED] | 0.74 (+0.02) [ALIGNED] | 0.32 (−0.02) [ALIGNED] | Antithesis (high), isocolon (mod-high), polyptoton (high), allit 1.318/s |
| **§1.2** | 0.59 (−0.03) [ALIGNED] | 0.58 (−0.03) [ALIGNED] | 0.38 (−0.03) [ALIGNED] | 0.30 (−0.02) [ALIGNED] | 0.71 (−0.01) [ALIGNED] | 0.31 (−0.03) [ALIGNED] | Antithesis (high), polyptoton (high), isocolon (mod), allit 0.95/s |
| **§1.3** | 0.61 (−0.01) [ALIGNED] | 0.63 (+0.02) [ALIGNED] | 0.44 (+0.03) [ALIGNED] | 0.33 (+0.01) [ALIGNED] | 0.74 (+0.02) [ALIGNED] | 0.33 (−0.01) [ALIGNED] | Antithesis (very high), isocolon (high), anaphora (mod-high), allit 1.38/s |
| **§1.5** | 0.58 (−0.04) [ALIGNED] | 0.66 (+0.05) [ALIGNED] | **0.55 (+0.14) [DRIFT-TOWARD periodic]** | 0.34 (+0.02) [ALIGNED] | 0.69 (−0.03) [ALIGNED] | 0.27 (−0.07) [ALIGNED, lower edge] | Anaphora (very high), antithesis (very high), isocolon (very high), climax (high), allit 1.05/s |

### 3.1 Overall per-section tag

| Section | Axes ALIGNED | Axes DRIFT-TOWARD | Axes DRIFT-AWAY | Axes INVERSE | Overall verdict |
|---------|:-:|:-:|:-:|:-:|---|
| §1.0 | 6/6 | 0 | 0 | 0 | **ALL-ALIGNED** (register at boundary) |
| §1.1 | 6/6 | 0 | 0 | 0 | **ALL-ALIGNED** (slightly above §1.4 on composite) |
| §1.2 | 6/6 | 0 | 0 | 0 | **ALL-ALIGNED** (uniform Δ ≈ −0.02 to −0.03) |
| §1.3 | 6/6 | 0 | 0 | 0 | **ALL-ALIGNED — closest single match to §1.4** |
| §1.5 | 5/6 | 1 (periodic) | 0 | 0 | **DRIFT** (periodic-axis drift + opacity loss at signature level) |

### 3.2 Composite (register × hypotaxis)

| Section | composite | vs §1.4 (0.439) | band ([0.35, 0.55]) |
|---------|----------:|:--------------:|:--:|
| §1.0 | **0.352** | −0.087 | lower edge — at the under-developed threshold |
| §1.1 | **0.488** | +0.049 | well within developed band, above §1.4 |
| §1.2 | **0.412** | −0.027 | well within developed band |
| §1.3 | **0.466** | +0.027 | well within developed band, above §1.4 |
| §1.4 ★ | 0.439 | — | baseline |
| §1.5 | **0.456** | +0.017 | well within developed band, above §1.4 — but see §3.3 |

### 3.3 Alternative composite for §1.5: opacity × signature-transition count

The register × hypotaxis composite **fails to detect §1.5's under-development** because §1.5's hypotaxis is elevated (compression forces braiding) and register is preserved (Greek-term density is high). A more diagnostic composite for §1.5 is **opacity × user-signature-transitions**:

| Section | opacity | sig-trans count | composite | vs §1.4 (15.30) |
|---------|--------:|----------------:|----------:|:--------:|
| §1.0 | 0.27 | 13 | 3.51 | −11.79 (23% of baseline) |
| §1.1 | 0.32 | 22 | 7.04 | −8.26 (46% of baseline) |
| §1.2 | 0.31 | 14 | 4.34 | −10.96 (28% of baseline) |
| §1.3 | 0.33 | 36 | 11.88 | −3.42 (78% of baseline) |
| §1.4 ★ | 0.34 | 45 | 15.30 | — |
| §1.5 | 0.27 | **4** | **1.08** | **−14.22 (7% of baseline) — 14.2× reduction** |

§1.5's signature-transition collapse (45 → 4, an 11.25× reduction) and the resulting composite collapse (15.30 → 1.08, a 14.2× reduction) is the single most reliable Lanham-level marker that §1.5 needs the user's habitual multi-pass revision discipline.

---

## 4. Per-section drift summary + recommendations

### 4.1 §1.0 (DISS-00-INTRO) — accessible introduction tone

**Verdict**: ALL-ALIGNED on 6/6 axes. Register at the ALIGNED boundary (−0.08).

**Findings**:
- All six axes sit inside the ±0.10 ALIGNED window.
- Largest delta: register −0.08 (sits one tenth of a tenth above the DRIFT-TOWARD threshold of 0.62). Driven by (a) zero occurrences of "specifically" and "indeed" (vs §1.4's 4 + 10), (b) German-philosophical vocabulary largely absent (no Befindlichkeit/Stimmung/Geworfenheit cluster), (c) Latinate-proxy ratio 0.193 vs §1.4's 0.220.
- Composite register × hypotaxis = 0.352 — at the lower edge of §1.4's 0.35–0.55 healthy band.
- Tacit-pattern signature pivots toward **isocolon** (high; the T₁/T₂/T₃/T₄ catalog, the A₀–A₄ catalog, the chapter-procession catalog) and **polyptoton** (high; phantasia/phantasma/phantasmata cluster). Antithesis less aggressively cultivated than §1.4.
- First-person interpretive flagging (I will argue / I believe / I think) is more dense here than in §1.4, appropriately for an introduction's threshold function.

**Recommendation**:
- *Keep as-is* if the user intends §1.0 to be pedagogically accessible (the lower register and dense first-person flagging are appropriate at the threshold of the chapter).
- *If lifting toward §1.4 desired*: introduce 1–2 instances of "specifically" / "indeed" in the methodology subsection; integrate Heideggerian vocabulary (Befindlichkeit, Stimmung) at the points where §1.0 prefigures §§1.1/1.4 content (it currently does not anticipate the German-philosophical register).
- *Caution*: further drift downward would push the composite below 0.35 and trigger the under-developed threshold. Do not strip Greek-with-gloss in any rewrite.

### 4.2 §1.1 (DISS-01-A0) — Heideggerian-architectural register

**Verdict**: ALL-ALIGNED on 6/6 axes. Composite SITS ABOVE §1.4 baseline (0.488 > 0.439).

**Findings**:
- All six axes inside the ±0.10 ALIGNED window. Largest positive deltas: hypotaxis +0.05, periodic +0.05, nounVerb +0.02, register +0.02 — all consistent with §1.1's architectural-definitional density.
- Greek vocabulary saturation: kinēsis × 18, energeia × 14, entelecheia × 5, dynamis × 5; German vocabulary saturation: Bewegtheit × 4, Innerzeitigkeit × 5, Zeitlichkeit × 4, Bewandtnis × 3.
- §1.1 is more periodic than §1.4 (0.46 vs 0.41): front-loaded conditional/participial openings ("On Heidegger's reading...", "If a being is determined in its there...") are the diagnostic.
- The strong-reading-of-Phys-IV.14 is explicitly flagged (opacity-transparency); other Heideggerian-Aristotelian bridge claims (kinēsis ≅ Bewegtheit, Aristotelian dyadic kinēsis ≅ proto-form of In-der-Welt-sein) are less explicitly flagged — modest opportunity to tighten meta-transparency.

**Recommendation**:
- *Style*: no style-level revision needed. §1.1 is well-developed.
- *Content* (carry to revision-roadmap, not a Lanham finding): the four `\textbf{******}` placeholder quotation fills + Bekker reference verification + Burke page-number verification.
- *Modest tightening*: increase explicit interpretive flagging on the un-flagged Heideggerian-radicalization moves to nudge opacity from 0.32 → 0.34.

### 4.3 §1.2 (DISS-02-A1A2) — receiving-section

**Verdict**: ALL-ALIGNED on 6/6 axes. Uniform Δ ≈ −0.02 to −0.03 across the board.

**Findings**:
- Every axis is within −0.01 to −0.04 of §1.4. The pattern is *uniform mild under-baseline*, not directional drift.
- This contradicts the §1.4 baseline prediction of DRIFT-TOWARD on register and opacity for §1.2: the existing §1.2 prose is already idiomatically the user's. The Phase 1 metadata flag of "under-development" pertains to **three pending relocation-receipts** (pathos-Metaphysics-fourfold, paschein preservation/destruction, perception-as-krisis from §1.4 → §1.2) and to **content gaps**, not to stylistic drift.
- Signature-transition gap: §1.2 uses "indeed" 0 times and "hence" 0 times (vs §1.4's 10 + 1) — the largest single register-marker absence outside of §1.5.
- Sentence length: 23.63 words average (vs §1.4's 32.72) — meaningfully shorter, which contributes to the slight hypotaxis and periodic dips. This is structurally appropriate because §1.2 contains more block-quoted Aristotelian passages.
- Tacit-pattern profile: ALIGNED with §1.4 on antithesis and polyptoton; alliteration density 0.95/s vs §1.4's 1.42/s (lower because of block-quote interruptions).

**Recommendation**:
- *Style*: as the three relocations land, insert at least 1–2 instances of "indeed" (e.g., "Aristotle's distinction is, *indeed*, the structural ground of the dual-trace thesis") and at least 1 instance of "hence" to restore the full signature-transition palette.
- *Content* (revision-roadmap): land the three relocations from §1.4. The expectation is that word-count + claim-density will increase but the Lanham profile will remain ALIGNED (relocated content already meets §1.4-grade because it WAS §1.4 content).
- *Tacit patterns*: explicitly mark the antithetical pairs in upcoming relocation-receipt subsections to maintain §1.4-grade tacit-pattern density.

### 4.4 §1.3 (DISS-03-A3) — closest match to §1.4 baseline

**Verdict**: ALL-ALIGNED on 6/6 axes. Closest single match to §1.4's signature; deltas range from −0.01 to +0.03. Composite +0.027 above §1.4.

**Findings**:
- §1.3 is the strongest stylistic-fit non-gold section. Confirms the §1.4 baseline's drift prediction ("Likely ALIGNED-to-DRIFT-AWAY on register and hypotaxis since §1.3 introduces three-orientational-modes + doxa-as-orthogonal-layer — architecturally dense"): the section stays inside ALIGNED with marginal positive drift.
- §1.3 has the highest Greek-term density in the dissertation: phantasia/phantasma cluster × 137 surface occurrences (highest), doxa × 84. Latinate-proxy ratio 0.230 (highest non-§1.4-baseline).
- Hypotaxis +0.02 and periodic +0.03 reflect the architectural-exposition function (long periodic sentences for the three-modes taxonomy + doxa-as-orthogonal-layer).
- Tacit patterns: §1.3's anaphora (the three-mode triadic refrain in S5/S6/S10), antithesis (pre-propositional/propositional, aspectual/propositional, voluntary phantasia/involuntary doxa), and climax (four-step phantasia → doxa → emotion → action chain) are MORE pronounced than §1.4. The four-step gradatio at line 108 is one of the chapter's strongest sentences.
- Signature-transition gap: §1.3 has 36 transitions total vs §1.4's 45 (largest single gap is accordingly: 9 vs 18). Whether to bring §1.3 into closer alignment is a stylistic choice; the gap is not large enough to be considered drift.

**Recommendation**:
- *Style*: minimal style edits needed. §1.3 already sits at §1.4-grade.
- *Modest tightening*: optionally insert 4–5 additional "accordingly" instances to match §1.4's cadence.
- *Content* (revision-roadmap): Papachristou inlinenote resolution + hexeis/settled-doxai expansion + citation-density supplementation in §S7/§S8. None of these will move Lanham metrics out of ALIGNED.

### 4.5 §1.5 (DISS-05-A4) — DRIFT (the conclusion that needs revision)

**Verdict**: DRIFT — 5/6 axes ALIGNED, 1 axis (periodic) DRIFT-TOWARD. Multiple under-development signals at signature-marker level not captured by axis bands.

**Findings (axis-level)**:
- **periodicRunning +0.14 DRIFT-TOWARD-periodic**: §1.5 sentences average 38.2 words (vs §1.4's 32.7), 48% of sentences ≥35 words (vs §1.4's 37.5%), periodic-candidate rate 0.50 (vs §1.4's 0.41). Mechanism: the section's compression-into-fewer-paragraphs (3,506 words, 28 lines, 0 footnotes) forces long suspended-completion sentences modeling the suspended-completion of cultivated comportment (hexis/aretē/kairos demand periodic grammar). This drift is *content-driven*, not under-development-driven.
- **opacity −0.07** (sits at the lower edge of ALIGNED, near DRIFT-TOWARD-opaque): meta-linguistic transition density 0.043/sentence (vs §1.4's 0.208 — **4.8× reduction**). Zero explicit interpretive-flag markers ("I argue," "on the present reading," "the present chapter contends"). Cross-references ("cf. §1.8," "as §1.8 established") are organizational not meta-interpretive.

**Findings (signature-marker level — the actual diagnostic)**:
- **User-signature transitions: 45 → 4 (11.25× reduction)**. §1.4 uses {thus × 12, specifically × 4, indeed × 10, accordingly × 18, hence × 1}; §1.5 uses {thus × 0, specifically × 0, indeed × 0, accordingly × 4, hence × 0}. Four of the five signature transitions are absent. This is the chapter's clearest single under-development signal.
- **Opacity × sig-transitions composite: 15.30 → 1.08 (14.2× reduction)** — see §3.3 above. This composite captures what register × hypotaxis cannot.
- **Footnotes: 0 vs §1.4's substantial apparatus**.
- **German-philosophical vocabulary: Befindlichkeit × 1, Stimmung × 1, both confined to the closing paragraph** (vs §1.4's sustained alternation).

**Findings (tacit-pattern level — a counterintuitive section-strength)**:
- §1.5's tacit-pattern profile is MORE rhetorically marked than §1.4's: anaphora (very high — the three-types catalog), antithesis (very high — technē-hexis vs praxis-hexis, simple vs habitual vs evaluatively-complex), isocolon (very high — the kinetic-roles formulae), climax (high — the four-step gradatio at line 27: "What phantasia presents, doxa commits to; what doxa commits to, emotion mobilizes; what emotion mobilizes, action completes"). The compression-into-fewer-paragraphs has *forced* rhetorical patterning to organize the matter, producing one of the chapter's strongest single sentences (line 27).

**Recommendation**:
- *Style — under-development restoration*:
  - Reintroduce the user-signature transitions {thus, specifically, indeed, hence} that are absent — target ≥30 total signature transitions across the section to approach §1.4's 45.
  - Add explicit interpretive flags at every Heideggerian interpretive move (praxis-hexis bivalence, hexis-modulation of doxa-gate, hexis-as-co-original-with-pathos). Per §1.5's profile, these currently sit unflagged and by the §5.3 ledger they should be T3-interpretive-but-flagged rather than T4-unflagged.
  - Introduce footnote apparatus (currently zero footnotes) to support the architectural-conclusory claims.
  - Sustain German-philosophical vocabulary alternation beyond the single closing paragraph.
- *Style — preserve*:
  - Keep the periodic-running profile at 0.55. The drift is content-driven (hexis/aretē/kairos demand suspended-completion grammar) and reflects the section's character-formation subject matter.
  - PRESERVE the line-27 four-part climax verbatim. Resist any revision-pass temptation to "vary" the parallel grammatical structure.
  - PRESERVE the three-types anaphoric/isocolonic catalog — the parallelism IS the conclusion's signature.
- *Sequencing*: per the user's stated workflow, §1.5 should be revised AFTER §§1.0–1.4 finalize (the section's content depends on upstream determinations).

---

## 5. Cross-axis observations

### 5.1 Hypotaxis × periodic coupling is the strongest cross-axis correlation

Empirical Pearson correlations across the 6 sections:

| Axis pair | r | Interpretation |
|-----------|--:|----------------|
| **parataxisHypotaxis × periodicRunning** | **0.886** | Strongest coupling. Sections with more hypotaxis are also more periodic — long subordinate-clause-embedded sentences cluster with periodic suspension. |
| **opacity × section length** | 0.891 | Opacity (transparency-toward-meta) rises with section length — longer sections have room for more meta-linguistic flagging. |
| **opacity × signature-transition count** | 0.884 | Closely-related: the user's signature transitions ARE the dominant transparency mechanism. |
| **signature-transition count × section length** | 0.949 | Near-linear: signature transitions scale with section length (≈ 3.5 per 1000 words for the user's typical density). |
| register × parataxisHypotaxis | 0.648 | Moderate. Both are register-formal markers but they vary somewhat independently. |
| register × periodicRunning | 0.278 | Weak. Register and periodic structure are largely independent in this corpus. |

### 5.2 Diagnostic implications

- **The most diagnostic single composite for sections §1.0–§1.3 is register × hypotaxis** (per §1.4 baseline). Healthy band: 0.35–0.55. §1.0 at 0.352 sits at lower edge; §1.1/1.2/1.3 well inside; §1.5 also inside (0.456) but only because hypotaxis is elevated for compression-reasons.
- **For §1.5, register × hypotaxis FAILS to detect under-development**. The alternative composite **opacity × signature-transitions** correctly identifies §1.5 as 14× below §1.4 — driven by the signature-transition collapse (45 → 4).
- **Opacity is brittle on the Tier-1 heuristic** (confidence 0.50–0.55 across sections; MEMORY.md notes Tier-1 calibration ceiling 0.193). The signature-transition raw count is a more reliable proxy for the user's meta-cognitive transparency discipline than the opacity axis itself.
- **Periodic-running is the Tier-2-promoted axis** (per MEMORY.md). §1.5's +0.14 delta is the largest single drift across the matrix; Tier-2 deep analysis would refine this number but the direction is reliable.

### 5.3 Pattern: ALL six sections drift away from gold-set means in the SAME direction

| Axis | Gold-set mean | §1.4 baseline | All-six-sections mean | Direction |
|------|---:|---:|---:|---|
| nounVerb | 0.590 | 0.62 | 0.603 | All ≥ gold-set mean (academic register baseline) |
| parataxisHypotaxis | 0.372 | 0.61 | 0.615 | All MASSIVELY above gold-set (user's signature dense embedding) |
| periodicRunning | 0.349 | 0.41 | 0.433 | All slightly above gold-set |
| voice | 0.372 | 0.32 | 0.322 | All BELOW gold-set (user's author-prominent active discipline) |
| register | 0.574 | 0.72 | 0.707 | All MASSIVELY above gold-set (Greek-with-gloss + Latinate-formal) |
| opacity | 0.193 | 0.34 | 0.307 | All above gold-set (denser meta-flagging than population) |

The dissertation's collective Lanham signature is decidedly more **hypotactic, register-heavy, opaque-transparent (meta-flagged), and active** than Lanham's general gold-set means — exactly the signature one expects from disciplined Aristotelian-Heideggerian academic prose. Internal consistency across the six sections is high (every section is within ±0.10 of §1.4 on every axis except §1.5's periodic).

---

## 6. Recommendations for revision (priority order)

| # | Section | Action | Lanham diagnostic |
|---|---------|--------|-------------------|
| **1** | **§1.5** | Restore user-signature transitions (thus, specifically, indeed, hence) — target ≥30 total occurrences across the section. The 45 → 4 collapse is the section's clearest single under-development signal. | opacity ×sig-transitions composite 14.2× below §1.4 |
| **2** | **§1.5** | Add explicit interpretive flags ("I argue," "on the present reading," "the present chapter contends") to every Heideggerian interpretive move (praxis-hexis bivalence, hexis-modulation of doxa-gate, hexis-as-co-original-with-pathos). Per §5.3 ledger, unflagged moves are T4 rather than T3. | opacity −0.07; zero explicit interpretive markers |
| **3** | **§1.5** | Add footnote apparatus (currently zero footnotes) for architectural-conclusory claims. Sustain German-philosophical vocabulary (Befindlichkeit/Stimmung) beyond the single closing paragraph. | Footnotes 0; German vocabulary confined to closing paragraph |
| **4** | **§1.5** | **PRESERVE** the line-27 four-part climax verbatim; PRESERVE the three-types anaphoric/isocolonic catalog. The compression-driven rhetorical density IS the conclusion's signature. | Tacit patterns (anaphora, isocolon, climax, polyptoton) MORE pronounced than §1.4 |
| **5** | **§1.2** | As the three relocations land (fourfold, paschein-dual, perception-as-krisis from §1.4), insert at least 1–2 "indeed" and 1 "hence" to restore the full signature-transition palette. Explicitly mark antithetical pairs in relocation-receipt subsections. | "indeed" × 0 and "hence" × 0 in current state; alliteration 0.95/s vs §1.4's 1.42/s |
| **6** | **§1.0** | DECISION POINT — accept the intentionally-accessible boundary register (−0.08 below §1.4), or lift toward §1.4 by adding 1–2 "specifically"/"indeed" and integrating Befindlichkeit/Stimmung at points where §1.0 prefigures §§1.1/1.4. Do not drop below composite 0.35. | Composite 0.352 at lower edge of healthy band |
| **7** | **§1.1** | Tighten explicit interpretive flagging on un-flagged Heideggerian-radicalization moves (kinēsis ≅ Bewegtheit, dyadic kinēsis ≅ proto-In-der-Welt-sein). Nudges opacity 0.32 → 0.34. | opacity −0.02; one interpretive move (strong reading of Phys. IV.14) is flagged, others less so |
| **8** | **§1.3** | OPTIONAL — insert 4–5 additional "accordingly" to match §1.4's cadence (current 9 vs §1.4's 18). Not strictly needed; the gap is well within stylistic noise. | Signature-transitions 36 vs §1.4's 45 |

**Cross-cutting**: NONE of the non-gold sections requires structural style-level revision. §1.5 is the only section whose Lanham profile signals genuine under-development; the remaining four (§1.0/§1.1/§1.2/§1.3) require *content-level* work (relocations, citation fills, Bekker verification) but not stylistic re-pitching.

---

## 7. Diagnostic notes for downstream synthesis (3A/3B/3D)

- **Lanham-Phase 3A coupling**: §1.5 should be the **highest-priority revision target** in the master revision-roadmap (Plan §10.7). Its Lanham under-development signal combines with its content-level under-development (3,506 words, 28 lines, 0 footnotes, undeveloped praxis-hexis interpretation per Phase 1 metadata).
- **Lanham-Phase 3B coupling**: §1.2's uniform −0.03 across axes is *content-driven not style-driven*. Phase 3B's relocations-document should list the three relocations from §1.4 and predict that landing them will leave the Lanham profile in the same ALIGNED range (not push toward §1.4 baseline).
- **Lanham-Phase 3D coupling**: §1.0's register at the lower-edge composite (0.352) intersects with §1.0's citation-density (per Phase 1 metadata, §1.0 needs additional citation density). Sequencing: after §1.0 receives additional Heidegger-vocabulary integration and inline citations to anticipate the §§1.1/1.4 register, expect register to rise from 0.64 toward 0.68–0.70 (still ALIGNED).
- **Confidence per axis is lowest on opacity** (0.50–0.55 across sections; Tier-1 brittle per MEMORY.md). Where the matrix flags opacity drift (§1.5 −0.07), corroborate with raw signature-transition count (the more reliable proxy).
- **Periodic-running is Tier-2-promoted**. §1.5's +0.14 drift would benefit from Tier-2 re-analysis on the next run.

---

## 8. Quality gates

- [x] Lanham profile matrix covers all 6 sections; §1.4 is the explicit baseline.
- [x] Per-axis matrix with value/delta/tag for 6 sections × 6 axes (36 cells) + tacit-pattern signatures.
- [x] Delta classification per Plan §9.3.1 (ALIGNED / DRIFT-TOWARD / DRIFT-AWAY / INVERSE) applied to every axis.
- [x] Per-section drift summary + recommendations written for all 5 non-gold sections.
- [x] Cross-axis observations include the §1.5-specific alternative composite (opacity × sig-transitions).
- [x] Recommendations prioritized; §1.5 is identified as the highest-priority revision target.
- [x] Confidence levels noted (Tier-1 brittleness on opacity; periodic-axis Tier-2-promoted).
- [x] Cross-references to Phase 3A/3B/3D synthesis files identified.
