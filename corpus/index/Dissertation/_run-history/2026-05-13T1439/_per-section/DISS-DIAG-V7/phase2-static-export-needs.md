# Phase 2c — Static Export Specifications

**Run ID:** 2026-05-13T1439
**Section ID:** DISS-DIAG-V7
**Source HTML:** `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/actualization-chain-v7.html` (3,623 lines)
**Reference TikZ:** `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/Actualization of Desire Diagram in Latex Format.md`
**Output format:** TikZ-LaTeX-in-markdown — each export is a single `.md` file wrapping a complete `\documentclass[border=30pt,tikz]{standalone}` block in a ` ```latex ... ``` ` code fence; compilable directly with `pdflatex`.
**Display convention (all exports):** $M_n \to A_{n+1}$ (motion named by terminus, per *Physics* V.1, 224b7-8). The reference file still uses old form $M_n \!\to\! M_{n+1}$; **the seven exports below correct this to the new convention** so each per-section cutout is publishable as-is in the dissertation's print version.

## Color palette (inherited from reference TikZ, all exports)

| Color name      | RGB              | Use                                       |
|-----------------|------------------|-------------------------------------------|
| `actuality`     | `30, 60, 120`    | $A_n$ node frames + zone labels           |
| `motion`        | `140, 40, 40`    | $M_n$ node frames, kinetic boxes, arrows  |
| `timecolor`     | `60, 120, 60`    | $\tau$ nodes, time-axis annotations       |
| `pathoscolor`   | `160, 120, 40`   | Basic affective valence track             |
| `emotioncolor`  | `140, 60, 100`   | Emotion-desire composite, feedback arrow  |
| `perceptual`    | `225, 237, 252`  | $A_0$–$A_2$ background zone               |
| `cognitive`     | `252, 240, 225`  | $A_3$–$A_4$ background zone               |
| `loopcolor`     | `100, 100, 100`  | Recursive $A_4 \to A_0'$ loop             |
| `feedbackcolor` | `140, 60, 100`   | $A_4/EMO \to A_2$ feedback loop           |

## Node-style conventions (inherited)

| Style       | Shape                                       | Use                          |
|-------------|---------------------------------------------|------------------------------|
| `actnode`   | Rounded rectangle, thick `actuality` border | $A_n$ completed actualities  |
| `motionnode`| Rounded rectangle, dashed `motion` border   | $M_n$ motion segments        |
| `timenode`  | Rounded rectangle, thin `timecolor` border  | $\tau_n$ temporal intervals  |
| `kineticbox`| White rectangle, faint `motion` border      | Three-factor kinetic roles   |
| `pathostrack`| Rounded rectangle, `pathoscolor` filled    | Basic affective valence      |
| `emotionbox`| Rounded rectangle, `emotioncolor` filled    | Emotion-desire composite     |
| `detailbox` | White rectangle, faint `motion` border      | Detail / mode column         |

---

## Export 1: `diag-A0`

- **export_id:** `diag-A0`
- **for_section:** DISS-01-A0 (§1.1)
- **scope:** $A_0$ standalone — sensible object in actuality + sense-faculty + perceiver, with motion-time substrate as ground.
- **output_path:** `_per-section/DISS-DIAG-V7/static-exports/diag-A0-for-section-1.1.md`
- **source HTML element IDs / line ranges:**
  - `actualities[0]` (id='A0'), HTML line 830–852
  - K01 kinetic-box for $M_1 \to A_1$, HTML line 1220–1240 (kinetic data)
  - $\tau_{0 \to 1}$ time-node from `motions[0].tau`, HTML line 1241–1242
  - Naming-principle note (Phys. V.5, 229b25), reference TikZ lines 443–449
- **content emphasis:** Motion-and-time substrate as ground; sensible object as unmoved originator; "Naming principle" pull-out (Phys. V.1, 224b7-8 instead of V.5, 229b25 — both citations are present in the source and both make the same point; new exports use V.1 since this is the locus the new convention cites).
- **special features:** Show $A_0$ alone with its three-factor kinetic context. No $M_n$ chain arrows downstream.

## Export 2: `diag-A1-A2`

- **export_id:** `diag-A1-A2`
- **for_section:** DISS-02-A1A2 (§1.2)
- **scope:** $A_1 \to M_2 \to A_2$ (formerly written $A_1 \to M_{01} \to A_2$ in the original metadata; the canonical motion between A1 and A2 is **M12**, displayed as **$M_2 \to A_2$**). Add resonant-kinēsis dual-trace (`resonant_aisthēma` + `resonant_orexis`) per §1.2 prose lines 111, 142. Add full kinetic-roles column for both $M_1 \to A_1$ and $M_2 \to A_2$.
- **output_path:** `_per-section/DISS-DIAG-V7/static-exports/diag-A1-A2-for-section-1.2.md`
- **source HTML element IDs / line ranges:**
  - `actualities[1]` (id='A1'), HTML line 855–886
  - `actualities[2]` (id='A2'), HTML line 888–911
  - `motions[0]` (id='M01'), HTML line 1215–1259 (kinetic + tau + expanded)
  - `motions[1]` (id='M12'), HTML line 1261–1305
  - K01 + K12 from reference TikZ lines 225–243
  - Pathos track from reference TikZ lines 265–283
  - "Dual origin" note from reference TikZ lines 354–365 (MA 702a20–21)
- **content emphasis:** "Pivotal actuality" pull-out for $A_2$; dual-trace structure (resonant_aisthēma + resonant_orexis) made explicit as twin boxes anchored at $A_2$.
- **special features:** Show the constitutive co-presence of formal-epistemic and affective traces at $A_2$. Add a small inset showing how the pathos track flows along $A_0 \to A_1 \to A_2$.

## Export 3: `diag-M2-A3-doxa`

- **export_id:** `diag-M2-A3-doxa`
- **for_section:** DISS-03-A3 (§1.3)
- **scope:** $M_3 \to A_3$ (the canonical M23, displayed as $M_3 \to A_3$) plus three orientational modes (NOESIS, MEMORY, DISCURSIVE with SPECULATIVE/DELIBERATIVE sub-domains) and the doxa-band as the orthogonal layer.
- **output_path:** `_per-section/DISS-DIAG-V7/static-exports/diag-M2-A3-doxa-for-section-1.3.md`
- **source HTML element IDs / line ranges:**
  - `actualities[3]` (id='A3', is_branching), HTML line 914–920
  - `a3Nodes` (A3-NOESIS / A3-MEMORY / A3-DISCURSIVE / A3-SPECULATIVE / A3-DELIBERATIVE), HTML lines 944–1133
  - `DOXA_BAND` (id='DOXA'), HTML line 1138–1183
  - `motions[2]` (id='M23'), HTML line 1307–1377
  - Modes detail-box from reference TikZ lines 289–307
- **content emphasis:** The three orientational modes are visually parallel (NOESIS / MEMORY / DISCURSIVE), with SPECULATIVE and DELIBERATIVE nested below DISCURSIVE. The doxa-band runs orthogonally beneath all four, signalling its supervenient-not-parallel character per §1.3 lines 100, 112, 119.
- **special features:** Fan-out arrows from $M_3 \to A_3$ junction to each A3 sub-node; memory feeds-forward to discursive. Doxa-band drawn as a horizontal supervenience layer.

## Export 4: `diag-A3-M3-A4-feedback`

- **export_id:** `diag-A3-M3-A4-feedback`
- **for_section:** DISS-04-EMOTION (§1.4)
- **scope:** $A_3$-doxa-band $\to M_4 \to A_4$ (canonical M34, displayed as $M_4 \to A_4$) with three input paths (deliberation-without-doxa, settled-hexis, emotion-mediated), $A_4$ proper, and the diachronic feedback-loop indicator from $A_4/EMO \to A_2$.
- **output_path:** `_per-section/DISS-DIAG-V7/static-exports/diag-A3-M3-A4-for-section-1.4.md`
- **source HTML element IDs / line ranges:**
  - `motions[3]` (id='M34'), HTML line 1379–1446
  - `EMOTION_COMPOSITE` (id='EMO'), HTML line 1452–1488
  - Three M34 input paths drawing in JS function `drawM34InputPaths()`, HTML line 2502–2575 (deliberative / doxa-band / emotion routes)
  - Bypass path (pure appetitive), HTML lines 2577–2630 (A2 → over T-box → M34 north)
  - Feedback path from reference TikZ lines 374–390
  - $A_4$ from `actualities[4]`, HTML line 922–937
- **content emphasis:** The three input paths into $M_4 \to A_4$ visualised as distinct routes (line styles or routing). Emotion-desire composite as satellite right of $M_4 \to A_4$. Feedback loop annotated with the §1.4 diachronic-saturation thesis (lines 106, 110, 112).
- **special features:** Bypass path for pure appetitive action (MA 701a32–33) drawn as an alternative route from $A_2$ directly to $M_4 \to A_4$.

## Export 5: `diag-hexeis`

- **export_id:** `diag-hexeis`
- **for_section:** DISS-04-EMOTION (§1.4, hexeis sub-section)
- **scope:** Hexeis / settled-doxai region with $M_3 \to A_3$ connector. Show the bivalent technē/praxis treatment promised in §1.5 line 1; show the hexis–pathē correlate pairs promised in §1.4 line 174.
- **output_path:** `_per-section/DISS-DIAG-V7/static-exports/diag-hexeis-for-section-1.4.md`
- **source HTML element IDs / line ranges:**
  - `SETTLED_DOXAI` (id='SETTLED-DOXAI'), HTML line 1186–1211
  - Connector to M23 in JS function (HTML line 2454–2495), feeds into M23.west
  - Practical-syllogism passage MA 701a7–25 (cited in HTML line 1199)
- **content emphasis:** Settled-doxai box, the practical-syllogism quotation, the additional-unmoved-originator role, and connector to $M_3 \to A_3$.
- **UNDER-DEVELOPMENT NOTE (REQUIRED in markdown surrounding text per user note 2026-05-13):** The hexeis region in the source HTML currently consists of a single Settled-Doxai box (at `<g id="settled-doxai">`, line 732) with one connector to $M_3 \to A_3$. The diagram does not yet represent:
  1. The technē/praxis bivalence (§1.5 line 1: simple appetition vs. habitual-procedural vs. evaluatively complex action — the habitual-procedural branch operates through doxa-as-hexis without emotional concretion);
  2. The hexis–pathē correlate structure (§1.4 line 174: courage:fear, magnanimity:anger, friendliness:kindness);
  3. The diachronic-saturation feedback through which completed action sediments as hexis (§1.4 lines 106, 110, 112);
  4. The bivalent gating ("habitual rational action" vs. "evaluatively complex action") that distinguishes paths 2 and 3 of the M34 input paths.

  **The static export below mirrors the HTML's current under-developed state; it preserves the single-box rendering with explicit annotation that hexis-region development is a pending revision-roadmap item (Phase 5).** Once the HTML region is fleshed out, this export should be regenerated.

## Export 6: `diag-A4-recursive`

- **export_id:** `diag-A4-recursive`
- **for_section:** DISS-05-A4 (§1.5)
- **scope:** $A_4$ + recursive loop back to $A_0'$ (action reconstitutes the perceptual field as new $A_0$).
- **output_path:** `_per-section/DISS-DIAG-V7/static-exports/diag-A4-recursive-for-section-1.5.md`
- **source HTML element IDs / line ranges:**
  - `actualities[4]` (id='A4'), HTML line 922–937
  - `motions[3]` (id='M34'), HTML line 1379–1446
  - Recursive-loop SVG path in JS function (HTML around line 746 group + drawing JS), reference TikZ lines 431–438
  - Variable emotion note from reference TikZ lines 455–464 (MA 701a32–33)
- **content emphasis:** $M_4 \to A_4$ producing $A_4$ (praxis completed); recursive loop annotated "completed action changes the world → new $A_0'$"; the §1.5 line 29 thesis ("the chain is recursive, not linear: $A_4$ produces $A_0'$").
- **special features:** Loop arrow routed to the right, exiting $A_4$.east and arcing back to enter a marker for "new $A_0'$" above (or labelled $A_0'$ rather than the original $A_0$).

## Export 7: `diag-full-chain`

- **export_id:** `diag-full-chain` (the metadata calls it `diag-full`; output filename `diag-full-chain.md`)
- **for_section:** DISS-00-INTRO and final-document front-matter
- **scope:** Full $A_0 \to A_4$ chain at single-page scale; intended as the introduction's overview reference and a TOC-adjacent reproduction.
- **output_path:** `_per-section/DISS-DIAG-V7/static-exports/diag-full-chain.md`
- **source HTML element IDs / line ranges:** All elements above, plus:
  - Background zones (perceptual / noetic), reference TikZ lines 413–425
  - Legend, reference TikZ lines 470–545
  - Ontological-priority line ("A2 is the pivotal actuality"), reference TikZ lines 396–407
  - Naming-principle note, reference TikZ lines 443–449
- **content emphasis:** A faithful reproduction of the reference TikZ block at the new $M_n \to A_{n+1}$ display convention (the reference still has the old form). Background zones, legend, and all annotations preserved.
- **special features:** This is the canonical reference export; it should match the reference file's structure exactly except for the motion-label correction.

---

## Common quality checks for all 7 exports

1. **Compilation:** Each export must compile under `pdflatex` with `tikz` and `amsmath` loaded.
2. **Border:** `\documentclass[border=30pt,tikz]{standalone}` (matches reference).
3. **Font:** `\usepackage[T1]{fontenc}` (matches reference).
4. **Motion labels:** Always $M_n \to A_{n+1}$, never $M_n \to M_{n+1}$.
5. **Citations:** Bekker-locus form (e.g., "DA III.10, 433b10–18"); no abbreviation drift from the reference.
6. **Color names:** Identical to reference palette (`actuality`, `motion`, `timecolor`, `pathoscolor`, `emotioncolor`, `perceptual`, `cognitive`, `loopcolor`, `feedbackcolor`).
7. **Scale:** `scale=0.62, transform shape` (matches reference); per-export scale may be increased for the smaller cutouts (§1.1, §1.5) to fill the page.
