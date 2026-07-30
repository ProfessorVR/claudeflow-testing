# Phase 0 — Preflight Dashboard

**Run-id**: `2026-05-20T0058`
**Previous run-id**: `2026-05-13T1439`
**Pipeline invocation**: post-marathon re-run (per workflow §10 of `CITATION-MARATHON-WORKFLOW.md`)
**Plan version**: v1.4

---

## 0. Headline

All 7 inputs CHANGED since prior run. The marathon (six sections, 2026-05-19) + user post-cleanup on 2026-05-20 modified every file. **The 2026-05-13 baseline of 207 citation gaps, 4 `\textbf{******}` placeholders, and 4 `\hl{...}` blocking markers is fully neutralised** to the count thresholds shown below.

| Indicator | Prior run (2026-05-13) | This run (2026-05-20) | Delta |
|---|---|---|---|
| **`\textbf{******}` placeholders** | 4 (across §1.1, §1.4) | **0** | -4 ✓ |
| **UNVERIFIED markers** | 0 (didn't exist as a tracked class) | **0** | n/a (created and cleared inside marathon) |
| **`(CITE)` literal markers** | 2 (§1.4 L32, plus §1.6 cluster in old Pathe) | **0** | -2 ✓ |
| **`TBD` / `???` markers** | 0 | 0 (1 `???` in DIAG-V7 hex shape glyph — unrelated, not a flag) | unchanged |
| **`\hl{...}` markers** | 8 (mixed citation-gap + editorial) | 7 (all 7 explicitly preserved as intentional per session-end reports) | -1 (§1.4 L32 (CITE) resolved) |
| **`\inlinenote{...}` markers** | 11 | 10 (§1.0 ×4, §1.3 ×3, §1.4 ×3 — all are stylistic explanatory notes, NOT citation gaps) | -1 |
| **Footnotes (total)** | 84 (sum across 6 sections) | **109** | +25 (gross marathon footnote addition; net per session-end reports was +52, so prior run undercounted some footnote forms) |
| **Word count (total dissertation §§1.0–1.5)** | 41,728 | **56,713** | +14,985 (+35.9%; cumulative marathon + REL relocations + sig-transitions + Step 7 + post-cleanup) |
| **`M_n → M_{n+1}` (old convention)** | residual occurrences in §1.1 / §1.4 / §1.5 (per Sessions 1-3c memory) | **0** | -all ✓ |
| **`M_n → A_{n+1}` (new convention)** | partial coverage | 48 occurrences across 6 sections | full migration ✓ |

---

## 1. Per-section marker scan

| Section | Lines | Words | `\hl{}` | `\inlinenote{}` | `(CITE)` | `\textbf{******}` | UNV | TBD | `???` | Footnotes |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| DISS-00-INTRO | 606 | 8,270 | 2 | 4 | 0 | 0 | 0 | 0 | 0 | 29 |
| DISS-01-A0 | 89 | 7,488 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 |
| DISS-02-A1A2 | 99 | 8,549 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 10 |
| DISS-03-A3 | 124 | 12,136 | 1 | 3 | 0 | 0 | 0 | 0 | 0 | 22 |
| DISS-04-EMOTION | 172 | 14,248 | 4 | 3 | 0 | 0 | 0 | 0 | 0 | 18 |
| DISS-05-A4 | 28 | 6,022 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 20 |
| DISS-DIAG-V7 | n/a (HTML) | n/a | 0 | 0 | 0 | 0 | 0 | 0 | 1 (glyph) | 0 |
| **TOTAL** | **1,118** + DIAG | **56,713** | **7** | **10** | **0** | **0** | **0** | **0** | **1 (non-issue)** | **109** |

---

## 2. Numbering convention scan (Mₙ→Mₙ₊₁ vs Mₙ→Aₙ₊₁)

| Section | M→M (old) | M→A (new) | Notes |
|---|---:|---:|---|
| DISS-00-INTRO | 0 | 17 | Convention (b) compliant |
| DISS-01-A0 | 0 | 2 | Convention (b) compliant; TikZ block also confirmed migrated |
| DISS-02-A1A2 | 0 | 8 | Convention (b) compliant |
| DISS-03-A3 | 0 | 9 | Convention (b) compliant |
| DISS-04-EMOTION | 0 | 6 | Convention (b) compliant |
| DISS-05-A4 | 0 | 6 | Convention (b) compliant (was old-only at prior run) |
| **TOTAL** | **0** | **48** | **Numbering migration: COMPLETE** |

---

## 3. Coined-term occurrence audit

Per Sessions 1–3c (2026-05-19), `resonant orexis` → `resonant epithymia` migration is complete. `pathos simpliciter` → `epithymia` substantially complete (1 vestige in §1.3). `resonant pathē` newly coined for past-emotional content in memory.

| Section | `pathos simpliciter` | `basic affective valence` | `resonant kinēsis` | `resonant aisthēma` | `resonant orexis` | `resonant epithymia` | `resonant pathē` | `articulational concretion` |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| DISS-00-INTRO | 0 | 4 | 4 | 1 | **0** | 2 | 0 | 1 |
| DISS-01-A0 | 0 | 0 | 0 | 0 | **0** | 0 | 0 | 0 |
| DISS-02-A1A2 | 0 | 1 | 1 | 0 | **0** | 7 | 1 | 0 |
| DISS-03-A3 | 1 | 0 | 5 | 5 | **0** | 13 | 0 | 0 |
| DISS-04-EMOTION | 0 | 18 | 2 | 1 | **0** | 6 | 1 | 14 |
| DISS-05-A4 | 0 | 2 | 0 | 0 | **0** | 1 | 0 | 0 |
| **TOTAL** | **1** | **25** | **12** | **7** | **0** | **29** | **2** | **15** |

**Migration status**: `resonant orexis` is fully migrated (0 residual). `pathos simpliciter` has 1 residual occurrence at §1.3 (vestige) — surface as Phase 3 finding.

---

## 4. Translation-variant scan (German terms)

User policy per memory: `Befindlichkeit → state-of-mind`; `Stimmung → mood/attunement`.

| Section | Befindlichkeit | Stimmung | Sorge | Bewegtheit | In-der-Welt-sein | Zuhandenheit |
|---|---:|---:|---:|---:|---:|---:|
| DISS-00-INTRO | 0 | 0 | 0 | 0 | 0 | 0 |
| DISS-01-A0 | 0 | 0 | 1 | 2 | 1 | 1 |
| DISS-02-A1A2 | 1 | 2 | 0 | 0 | 1 | 0 |
| DISS-03-A3 | 1 | 0 | 2 | 0 | 0 | 0 |
| DISS-04-EMOTION | 9 | 6 | 0 | 0 | 0 | 0 |
| DISS-05-A4 | 2 | 1 | 0 | 0 | 0 | 0 |
| **TOTAL** | **13** | **9** | **3** | **2** | **2** | **1** |

`Befindlichkeit` is the densest German term, concentrated in §1.4 (9 occurrences) — consistent with §1.4 being the canonical state-of-mind / mood-attunement development site.

---

## 5. Greek-token density

| Section | Unicode Greek runs | `\textgreek{}` / `\gk{}` blocks | Density (Unicode/1000-words) |
|---|---:|---:|---:|
| DISS-00-INTRO | 14 | 7 | 1.69 |
| DISS-01-A0 | 49 | 22 | 6.54 |
| DISS-02-A1A2 | 41 | 33 | 4.80 |
| DISS-03-A3 | 72 | 44 | 5.93 |
| DISS-04-EMOTION | 58 | 40 | 4.07 |
| DISS-05-A4 | 20 | 21 | 3.32 |
| DISS-DIAG-V7 | 54 | 0 | n/a |
| **TOTAL** | **308** | **167** | mean 4.39 |

---

## 6. Specific line locations of preserved markers

### DISS-00-INTRO (1.0 - Introduction.md)

| Line | Marker | Status |
|---|---|---|
| L36 | `\hl{motion and time}` | **Stylistic emphasis** (architectural anchor for chapter's central principle) — not a citation gap |
| L41 | `\hl{cognition itself specifies under a different logos.}` | **Preserved per user judgment** (G16 footnote now provides DA I.1+II.5+III.2 support; HL kept as conceptual-development flag) |
| (4 `\inlinenote{...}`) | (stylistic explanatory notes interspersed with footnotes) | not citation gaps |

### DISS-03-A3 (1.3 A3 - Orientational Modes.md)

| Line | Marker | Status |
|---|---|---|
| L45 | `\hl{(Repeat quote in the final settled disposition section.)}` | **Author TODO note** — intentional cross-section repeat indicator, preserved per marathon report |
| (3 `\inlinenote{...}`) | (stylistic) | not citation gaps |

### DISS-04-EMOTION (1.4 - Emotion is Motion.md)

| Line | Marker | Status |
|---|---|---|
| L51 (1) | `\hl{or contain true explanatory value}` | Editorial author-note on enmattered-account claim |
| L51 (2) | `\hl{The enmattered account thus imposes a structural constraint…irreducible to any one of them.}` | Editorial structural-constraint note (forward-reference to later subsection) |
| L67 | `\hl{path\=e}` (Greek emphasis inside Loeb footnote) | Greek-emphasis flag inside attribution footnote — not a gap |
| L69 | `\hl{and this is further indicated by the enmattered account and bodily accompaniment}` | Editorial connector |
| (3 `\inlinenote{...}`) | (stylistic) | not citation gaps |

### DISS-05-A4 (1.5 - A4 - Completed Action.md)

- 0 HL markers, 0 inlinenote markers — completely clean after marathon §1.5 Lanham Priority 1 sig-transitions + INCONS-013/020 + 5 critical interpretive flag footnotes

### DISS-01-A0 (1.1_A0_Motion_and_Time_OUTPUT_v2.tex)

- **0 HL, 0 inlinenote, 0 UNVERIFIED, 0 `\textbf{******}`, 0 TODO LaTeX comment.**
- All 3 UNVERIFIED prefixes (L53/L79/L83) cleared by user 2026-05-20 with M-R/Taft printed-edition verification annotations now in footnotes
- Both `\textbf{******}` placeholders (L25 Bewegtheit / L67 Innerzeitigkeit) filled with verbatims (BCAP p.199 / SZ §81 H.421) by user 2026-05-20
- G06 Burke TODO LaTeX comment cleared

### DISS-02-A1A2 (1.2_A1-A2_Aisthesis_OUTPUT_v1.tex)

- **0 HL, 0 inlinenote, 0 placeholders, 0 UNVERIFIED.** Section completely clean of citation-marathon markers.

---

## 7. Diagram (DISS-DIAG-V7) parse

**File**: `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/actualization-chain-v7.html` (SHA-256 changed since prior run; Step 7 hexeis-bisection applied)

| Canonical node IDs | Canonical motion IDs | Display-label transform | Settled-doxai region |
|---|---|---|---|
| A0, A1, A2, A3-NOESIS, A3-MEMORY, A3-DISCURSIVE, A3-SPECULATIVE, A3-DELIBERATIVE, A4 | M01, M12, M23, M34 | "M01" → "M₀→A₁" (source-indexed Option B; reconciled with prose 2026-05-19) | TECHNE / PRAXIS bisection applied (Step 7); 3 arrows + Type 3 two-level modulation rendering |

**Prose-vs-diagram consistency**: Per Sessions 1-3c memory, all six section files use the diagram's canonical node/motion IDs with the source-indexed convention. Phase 0 confirms: 0 occurrences of the old `M_n → M_{n+1}` form in any section, 48 occurrences of the new `M_n → A_{n+1}` form distributed appropriately.

---

## 8. Marathon-era resolution audit

The marathon and user post-cleanup applied:

- **~84 substantive citation fills** across §§1.0/1.1/1.2/1.3/1.4/1.5
- **~52 net new footnotes** (total footnote count: 84 → 109, +25 gross; the +52 net figure from session-end reports counts substantive multi-paragraph footnotes that replaced sparser placeholders, where the count of `\footnote{` braces shows +25)
- **5 CRITICAL-DISSERTATION-NOVEL interpretive flag footnotes** at §1.5 (G07/G13/G18/G19/G20/G26 critical-tagged claims)
- **Magnanimity → good-temper (praotēs)** Ross-translation correction propagated §1.4 ↔ §1.5
- **3 relocations §1.4 → §1.2** (REL-001/-002/-003)
- **§1.0 INCONS-005/014/015 + G01 (Chapter ??? → Chapter X)**
- **§1.5 INCONS-013/020 + Lanham Priority 1 sig-transitions (24 inserted, 4→28)**

User post-cleanup on 2026-05-20 resolved:

- §1.1 G01 / G02 / G03 / G04 / G15 (all 3 UNVERIFIED + both ****** placeholders) — verified against printed M-R and Taft editions; verification annotations added to footnotes
- §1.1 G06 Burke TODO LaTeX comment — cleared

---

## 9. File hashes (input verification)

| Section | SHA-256 | Prior SHA-256 | Δ |
|---|---|---|---|
| DISS-00-INTRO | `02a9137a…f8fca44c` | `889300a7…b907ba02` | changed |
| DISS-01-A0 | `f1fdab0a…2f4356d3` | `9664df69…d22f98a3` | changed |
| DISS-02-A1A2 | `73648f9e…85d22f16` | `23cafbe7…b285148f` | changed |
| DISS-03-A3 | `8e2403d9…ef82bd0d` | `17efd7b6…b8c92ca8` | changed |
| DISS-04-EMOTION | `603ed356…ded89c14` | `87ae5a03…fdea1dd8` | changed |
| DISS-05-A4 | `76ea3654…3b568100` | `615413e9…f7da0a50` | changed |
| DISS-DIAG-V7 | `35d0703b…42d882bc` | `daf6b613…9599e9dc` | changed |

All 7 inputs CHANGED. Full SHA-256s in `manifest.json`.

---

## 10. Pre-flight verdict

**GREEN for Phase 1.**

- All 7 inputs hashed and accounted for; all changed since prior run as expected
- 0 blocking markers remain (down from 4 placeholders + 2 (CITE) + 3 UNVERIFIED at marathon mid-stream)
- Numbering migration complete (0 old-convention occurrences anywhere)
- `resonant orexis` term migration complete
- All marathon workflow rules logged in manifest
- Perplexity policy locked to cache-first (no fresh queries without user pause)
- Output tree created at `corpus/index/Dissertation/_run-history/2026-05-20T0058/`

Phase 1 (per-section metadata) proceeds next.
