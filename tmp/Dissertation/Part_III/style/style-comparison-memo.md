# Part III Style Calibration Memo — Part-I Refresh + Publication Fingerprints

**Phase 1B deliverable** (plan `plans/part-iii-reanalysis-and-draft-plan-2026-07-06.md`). Built 2026-07-06.
**Analyzer:** `npx tsx tmp/analyze-style-lanham.ts <file>` (strips LaTeX incl. quote/footnote environments — quoted material excluded from fingerprints). Publications extracted `pdftotext -layout` → `scripts/strip-pdf-prose-for-lanham.py` (NEW helper: cuts References, captions, page furniture; de-hyphenates wraps). Raw outputs in `partI-stripped/` and `pubs/`.

## 1. Part-I fingerprint — REFRESHED from the current six `-v3.tex` sections

| src | words | sents | avg | short<15 | long>30 | periodic | preMV | voice | dyn | latinate | nomin | prep | opacity | selfConsc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1.0 Intro | 6246 | 147 | **42.49** | .156 | .497 | .643 | .054 | **.665** | 1.00 | .185 | 6.74 | 5.10 | **.805** | **.454** |
| 1.1 A₀ | 5399 | 199 | 27.13 | .251 | .397 | .739 | .065 | .224 | .547 | .168 | 7.48 | 3.95 | .761 | .270 |
| 1.2 M₀→A₁ | 6719 | 245 | 27.42 | .216 | .388 | .727 | .075 | .242 | .498 | .165 | 6.66 | 3.68 | .674 | .292 |
| 1.3 A₃ | 9373 | 329 | 28.49 | .152 | .416 | .551 | .095 | .333 | .514 | .163 | 5.45 | 3.80 | .689 | .305 |
| 1.4 Emotion | 10617 | 353 | 30.08 | .156 | .450 | .589 | .085 | .352 | .495 | .165 | 6.99 | 4.13 | .743 | .172 |
| 1.5 A₄ | 10187 | 377 | 27.02 | .271 | .416 | .663 | .103 | .314 | .498 | .158 | 6.19 | 3.71 | .694 | .101 |
| **POOLED** | **48541** | **1649** | **29.44** | **.201** | **.424** | **.640** | **.084** | **.404** | **.877** | **.166** | **6.50** | **3.98** | **.736** | **.241** |

- **The refresh CONFIRMS the stored fingerprint** (~31w avg, voice .39, opacity .74, ~85% Germanic) — metric-stable against the current v3 text (pooled: 29.4w, .404, .736, 83.4% Germanic). The FCDP precondition ("refresh before Part-I-register use") is discharged.
- **Body sections (1.1–1.5) are the register core** — tight cluster: avg 27–30, periodic .55–.74, voice .22–.35, opacity .67–.76. **§1.0 is the rhetorical outlier** (42.5 avg, voice .665, selfConsc .454): the *introduction* voice, not the *analysis* voice. Part III movements should target the body-section cluster; a §III.0 opening MAY run hotter (1.0-like) by explicit choice at D1.
- Tacit-figure profile (from full outputs): heavy chiasmus, climax patterns, alliteration/polyptoton present throughout — the analyzer's "opaque / self-conscious" reading is exactly the Lanham-trained signature.

## 2. Publication fingerprints (the experiments' register)

| src | words | sents | avg | short<15 | long>30 | periodic | preMV | voice | dyn | latinate | nomin | prep | opacity | selfConsc |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P1 physio (ASEE'23 WIP) | 3137 | 255 | 12.30 | .631 | .114 | .501 | .051 | .498 | .672 | .148 | 4.59 | 2.30 | .689 | **.000** |
| P2 eye-tracking (ASEE'24) | 3585 | 134 | 26.75 | .134 | .328 | .500 | .124 | .297 | .455 | .184 | 6.49 | 3.94 | .606 | .065 |
| P3 phenom (BiomedEngEduc'24) | 9927 | 563 | 17.63 | .604 | .217 | .623 | .112 | .473 | .863 | .170 | 4.67 | 2.83 | .606 | .038 |
| **PUBS POOLED** | **16648** | **951** | **17.51** | **.545** | **.206** | **.575** | **.101** | **.458** | **.762** | **.169** | **5.04** | **2.92** | **.631** | **.034** |

- **The registers are cleanly separable.** Strongest discriminators: **selfConsciousness** (.241 vs .034 — rhetorical display vs none; the single best gate), **short-sentence ratio** (.20 vs .55), **avg length** (29.4 vs 17.5), **long-sentence ratio** (.42 vs .21), nominalization (6.5 vs 5.0), prepositional density (3.98 vs 2.92). Both registers are Germanic-leaning (latinate ≈ .17) — vocabulary is NOT the discriminator; architecture and display are.
- Caveats: P1 is short/choppy WIP prose (its voice .498 is length-variety noise, not personality — treat as noisy); P2 runs longest sentences of the three (upper edge of the reporting register); pub extraction retains some furniture (author bios, stray numerals) and the sentence splitter breaks on "Fig." — direction of all contrasts is robust to this noise.
- **MA fingerprint (comparison only, per D4 — not the governing register):** avg 35.0, short .151, periodic .416, preMainVerb .222, voice .323, dynamic .633 (clean MA pp.29–47, measured 2026-07-01; not rerun).

## 3. Proposed FCDP G-A per-movement bands (implements resolved D4: zoning, Part-I governs)

**Band G — GOVERNING (interpretive/phenomenological/synthesis movements).** From Part-I pooled ± body-section spread:
avg **27–33** · short **.15–.27** · long **.38–.50** · periodic **.55–.72** · preMV .05–.11 · voice **.28–.48** · dynamicRange ≥ .50 · latinate ≤ .20 · nominalization 5.5–7.5 · prep 3.6–4.3 · opacity **.67–.78** · selfConsc **.10–.30** · tacit figures EXPECTED (chiasmus/climax present).

**Band R — REPORTING (methods/results recaps: Ns, p-values, instruments, procedures).** From pubs pooled, tightened away from P1 chop:
avg **16–22** · short **.40–.60** · long .15–.28 · periodic .45–.60 · preMV .08–.13 · voice unconstrained (soft-note only) · latinate ≤ .20 · nominalization 4.5–6.0 · prep 2.7–3.5 · opacity ≤ .65 · selfConsc **≤ .08** · tacit figures NOT expected (no display quota).

**Band M — optional MIDDLE (extended case-walkthrough passages; offered per-section at D1):**
avg 22–28 · short .25–.40 · opacity .60–.72 · selfConsc .05–.15 · other metrics interpolated.

**Gating discipline (proposal):** hard-gate on avg / short / long / latinate / selfConsc; soft-warn the rest. §III.0's opening movement may target §1.0's hotter profile (avg up to ~40, voice ~.6) by explicit D1 flag. Every movement in a D1 plan declares its band; G-A evaluates against the declared band.

## 4. Discharge status
- Part-I fingerprint refresh: **DONE** (precondition for Part-I-register FCDP use discharged).
- Publication fingerprints: **DONE** (user-ordered task complete).
- Bands: **PROPOSED — confirm or adjust at G1** (bands can also be tuned per-section at each D1 approval, per FCDP).
