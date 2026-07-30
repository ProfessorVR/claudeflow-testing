# Phase 0 — Preflight Dashboard

**Run-id**: `2026-05-13T1439`
**Pipeline version**: v1.4
**Total wall time for Phase 0**: ~3 min (regex + I/O only; sequential single agent)
**Status**: ✅ Complete. Phase 1 cleared to start.

---

## 1. File hashes (frozen for this run)

| ID | Path | SHA-256 (first 12) | Bytes | Lines | Words |
|----|------|---------------------|-------|-------|-------|
| DISS-00-INTRO | `1.0 - Introduction/1.0 - Introduction.md` | `889300a770a6` | 56,065 | 592 | 6,669 |
| DISS-01-A0 | `1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex` | `9664df69422c` | 44,249 | 89 | 6,272 |
| DISS-02-A1A2 | `1.2 - A1-A2 - Aisthesis/1.2_A1-A2_Aisthesis_OUTPUT_v1.tex` | `23cafbe70c72` | 54,128 | 99 | 7,774 |
| DISS-03-A3 | `1.3 - A3 - Orentational Modes/1.3 A3 - Orientational Modes.md` | `17efd7b603f9` | 76,185 | 124 | 10,191 |
| DISS-04-EMOTION ★ | `1.4 - Emotion is Motion/1.4 - Emotion is Motion.md` | `87ae5a030e32` | 102,898 | 183 | 13,969 |
| DISS-05-A4 | `1.5 - A4 - Completed Action/1.5 - A4 - Completed Action.md` | `615413e9e1a8` | 26,328 | 28 | 3,506 |
| DISS-DIAG-V7 | `Actualization of Desire (perception-to-movement) Diagram/actualization-chain-v7.html` | `daf6b613f1d0` | 198,131 | 3,623 | — |

**Total dissertation word count**: 48,381 words across 6 prose sections.
**§1.4 share of total**: 28.9% (gold standard, longest by ~38%).
**§1.5 deficit**: ~26.4% of §1.4's length — explicitly flagged as needing rework.

---

## 2. Citation-gap markers (per section)

| Section | `\hl{}` | `\inlinenote{}` | `(CITE)` | `\textbf{******}` | `???` | TOTAL |
|---------|---------|-----------------|----------|-------------------|-------|-------|
| DISS-00-INTRO | 3 | 4 | 0 | 0 | 1 | **8** |
| DISS-01-A0 | 0 | 0 | 0 | 4 | 0 | **4** |
| DISS-02-A1A2 | 0 | 0 | 0 | 4 | 0 | **4** |
| DISS-03-A3 | 7 | 5 | 1 | 0 | 0 | **13** |
| DISS-04-EMOTION ★ | 4 | 5 | 1 | 1 | 0 | **11** |
| DISS-05-A4 | 0 | 0 | 0 | 0 | 0 | **0** |
| **TOTAL** | **14** | **14** | **2** | **9** | **1** | **40** |

**Key observations**:
- DISS-03-A3 has the most user-acknowledged markers (13) — consistent with user's note that §1.3 needs more direct quotations + footnotes.
- DISS-05-A4 has ZERO explicit gap markers — but this is misleading: the section is the shortest (~3,500 words) and least developed; gaps are structural rather than marker-flagged.
- DISS-01-A0 and DISS-02-A1A2 each have 4 `\textbf{******}` placeholders — locus given, verbatim awaiting manual fill from the user's own access to the volumes. Per `feedback-missing-source-placeholder.md`, the pipeline does not insert verbatim text for these; it confirms the named locus and leaves the placeholder for user fill.

### 2a. Specific line locations

**`\textbf{******}` asterisk placeholders** (verbatim awaiting manual fill):
- DISS-01-A0: lines 25 (`Bewegtheit`), 53 (TBD), 67 (TBD), 79 (TBD)
- DISS-02-A1A2: lines 23, 47, 55, 79
- DISS-04-EMOTION: line 174

**`(CITE)` placeholders**:
- DISS-03-A3: line 65
- DISS-04-EMOTION: line 33

**`???` markers**:
- DISS-00-INTRO: line 41

**`\hl{}` highlight markers** (user-flagged for attention):
- DISS-00-INTRO: lines 19, 36, 41
- DISS-03-A3: lines 7, 37, 43, 45, 65, 67, 77
- DISS-04-EMOTION: lines 33, 64, 80, 82

**`\inlinenote{}` markers** (user notes-to-self):
- DISS-00-INTRO: lines 3, 23, 30, 70
- DISS-03-A3: lines 1, 33, 61, 123, 125
- DISS-04-EMOTION: lines 3, 60, 138, 148, 162

---

## 3. Numbering convention status (M→M vs M→A)

The user has been migrating from $M_n \to M_{n+1}$ to $M_n \to A_{n+1}$ to denote motions by their termini (actualities). Per `Physics` V.1, 224b7–8. **Migration is incomplete.**

| Section | Old form $M_n→M_{n+1}$ | New form $M_n→A_{n+1}$ | Status |
|---------|------------------------|------------------------|--------|
| DISS-00-INTRO | 0 | 4 | ✅ NEW-ONLY |
| DISS-01-A0 | 2 | 0 | ❌ OLD-ONLY |
| DISS-02-A1A2 | 2 | 3 | ⚠️ MIXED |
| DISS-03-A3 | 5 | 2 | ⚠️ MIXED |
| DISS-04-EMOTION ★ | 3 | 2 | ⚠️ MIXED |
| DISS-05-A4 | 4 | 0 | ❌ OLD-ONLY |
| **TOTAL** | **16** | **11** | **27 patches needed** |

**Self-acknowledgment**: DISS-03-A3 line 67 contains `\hl{(double check numbering)` — the user is already aware.

### 3a. Line locations of OLD form (need migration)

| Section | Line | Pattern | Context (snippet) |
|---------|------|---------|-------------------|
| DISS-01-A0 | 51 | `$M_3 \rightarrow M_4$` | "the realizable good moves at $M_3 \to M_4$ is *orexis*..." |
| DISS-01-A0 | 89 | `$M_2 \rightarrow M_3$` | "the orientational modes at $M_2 \to M_3$. Third, the entelechial..." |
| DISS-02-A1A2 | 83 | `$M_2 \rightarrow M_3$` | "*doxa*'s ratification at $M_2 \to M_3$, where the cognitive apparatus..." |
| DISS-02-A1A2 | 99 | `$M_2 \rightarrow M_3$` | "*doxa*'s ratification at $M_2 \to M_3$, requiring the rational cognition..." |
| DISS-03-A3 | 59 | `$M_3 \to M_4$` | "*orektikon* motion is initiated at $M_3 \to M_4$ on its basis..." |
| DISS-03-A3 | 65 | `$M_2 \rightarrow M_3$` | "common structural role within $M_2 \to M_3$: in each mode, the unmoved..." |
| DISS-03-A3 | 67 | `$M_2 \to M_3$` | "...cognitive actualities that $M_2 \to M_3$ `\hl{(double check numbering)`..." |
| DISS-03-A3 | 114 | `$M_2 \rightarrow M_3$` | "structure of taking-as that governs $M_2 \to M_3$ as a whole..." |
| DISS-03-A3 | 117 | `$M_3 \rightarrow M_4$` | "of the subsequent motion at $M_3 \to M_4$, and the condition is that..." |
| DISS-04-EMOTION ★ | 118 | `$M_3 \rightarrow M_4$` ×2 | "moments between nodes, with $M_3 \to M_4$ designating the conversion..." |
| DISS-04-EMOTION ★ | 144 | `$M_3 \rightarrow M_4$` | "1.8's analysis of the chain at $M_3 \to M_4$ specified the mechanism..." |
| DISS-05-A4 | 3 | `$M_3 \rightarrow M_4$` | "*orektikon* transition $M_3 \to M_4$ in which desire..." |
| DISS-05-A4 | 5 | `$M_3 \rightarrow M_4$` | "distinguishable moments within $M_3 \to M_4$, not separate macro-nodes..." |
| DISS-05-A4 | 23 | `$M_3 \rightarrow M_4$` | "somatic preparation internal to $M_3 \to M_4$ taking the specific form..." |
| DISS-05-A4 | (TBD line) | `$M_3 \rightarrow M_4$` | (4th occurrence to find in Phase 3B) |

### 3b. Line locations of NEW form (correct; do not touch)

| Section | Line | Pattern |
|---------|------|---------|
| DISS-00-INTRO | 62, 68 | $M_n \to A_n$ forms (4 total) |
| DISS-02-A1A2 | 61, 87, 95 | $M_2 \to A_3$ |
| DISS-03-A3 | 5, 119 | $M_n \to A_n$ |
| DISS-04-EMOTION ★ | 114, 124 | $M_3 \to A_4$ |

**Diagram-prose alignment**: the source HTML uses display-label transforms (line 822 "Settled Doxai (hexis) — sits in the open airspace BELOW the A3 frame, on the left"; line 1185 "Settled doxai as hexeis — additional unmoved originator at M2→M3"). Note that the HTML still has narrative text using the old M2→M3 form too — so the diagram's display-label transform `M01 -> M₁→A₁` style is applied in the SVG arrow labels but the **diagram's HTML descriptions/footnotes** still use M2→M3 in places. Phase 3B will catch and audit.

---

## 4. Coined-term distribution

| Term | DISS-00 | DISS-01 | DISS-02 | DISS-03 | DISS-04 ★ | DISS-05 | TOTAL |
|------|---------|---------|---------|---------|-----------|---------|-------|
| `basic affective valence` | 3 | 0 | 0 | 0 | **33** | 0 | 36 |
| `pathos simpliciter` | 0 | 0 | **8** | **8** | 7 | 0 | 23 |
| `resonant kinēsis` | 2 | 0 | 1 | 6 | 3 | 0 | 12 |
| `resonant aisthēma` | 1 | 0 | 0 | 5 | 1 | 0 | 7 |
| `resonant orexis` | 2 | 0 | 0 | **15** | 6 | 1 | 24 |
| `articulational concretion` | 0 | 0 | 0 | 0 | **12** | 0 | 12 |

**Observations**:
- §1.4 is the **canonical definition site** for `basic affective valence` (33 occurrences) and `articulational concretion` (12) and is essentially the **only site** for these terms.
- §1.3 is the **heavy user** of `resonant orexis` (15) — the user-flagged-for-rework term. Cross-section drift here is most likely.
- `pathos simpliciter` is most-used in §1.2 and §1.3 (8 each), then §1.4 (7); used as a primary architectural term across the chain.
- §1.0 has only token references (mostly forward-pointing).
- §1.1 has ZERO coined terms — consistent with its role as the pre-coining $A_0$ ground-laying section.
- §1.5 has only 1 coined-term occurrence (`resonant orexis` once) — consistent with its under-developed status.

---

## 5. Greek-term distribution (selected key terms)

| Term | DISS-00 | DISS-01 | DISS-02 | DISS-03 | DISS-04 ★ | DISS-05 |
|------|---------|---------|---------|---------|-----------|---------|
| pathos | 15 | 0 | 17 | 10 | **87** | 10 |
| pathē/pathe | 1/0 | 1/0 | 11/0 | 2/1 | **56/5** | 16/1 |
| paschein | 0 | 0 | 6 | 0 | 9 | 0 |
| phantasia | 59 | 19 | 27 | **98** | 10 | 4 |
| phantasma | 24 | 1 | 8 | **137** | 21 | 11 |
| kinēsis | 3 | **14** | 15 | 5 | 4 | 0 |
| energeia | 4 | **14** | 2 | 1 | 3 | 1 |
| dynamis | 0 | 2 | 2 | 0 | 3 | 1 |
| aisthēsis | 7 | 2 | 3 | 3 | 4 | 0 |
| aisthēma | 1 | 0 | **8** | 5 | 1 | 0 |
| doxa | 14 | 0 | 5 | **84** | 54 | **51** |
| orexis | 8 | 4 | 14 | 27 | 13 | 11 |
| nous | 2 | 0 | 3 | **14** | 0 | 0 |
| hexis | 0 | 0 | 1 | 1 | 11 | **31** |
| krisis | 1 | 0 | 0 | 4 | 6 | 0 |

**Section signatures**:
- **§1.0**: phantasia-heavy (rhetorical-phantasia framing); concept-spread = broad
- **§1.1**: kinēsis/energeia/Aristotelian-motion-anchor — Aristotle/Heidegger primary-text vocabulary
- **§1.2**: pathos/paschein/aisthēma/phantasia balanced — perceptual core
- **§1.3**: phantasma/doxa/nous/orexis dominant — orientational-modes machinery
- **§1.4 ★**: pathos/pathē dominant (143 combined!) — emotion's section
- **§1.5**: doxa/hexis dominant — settled-belief/character-disposition vocabulary

---

## 6. German/Heideggerian term distribution

| Term | DISS-00 | DISS-01 | DISS-02 | DISS-03 | DISS-04 ★ | DISS-05 |
|------|---------|---------|---------|---------|-----------|---------|
| Dasein | 1 | **13** | 5 | 3 | 8 | 0 |
| Befindlichkeit | 0 | 0 | 1 | 0 | **9** | 1 |
| Stimmung | 0 | 0 | 0 | 0 | **4** | 1 |
| Sorge | 0 | 1 | 0 | 0 | 0 | 0 |
| Mitsein | 0 | 0 | 0 | 0 | 1 | 0 |
| Geworfenheit | 0 | 0 | 1 | 0 | **4** | 0 |
| Zuhandenheit | 0 | 1 | 0 | 0 | 0 | 0 |
| Bewegtheit | 0 | **3** | 0 | 0 | 0 | 0 |
| In-der-Welt-sein | 0 | 1 | 1 | 0 | 0 | 0 |

### 6a. Befindlichkeit translation-surface forms (drift check)

| Surface form | DISS-00 | DISS-01 | DISS-02 | DISS-03 | DISS-04 ★ | DISS-05 |
|--------------|---------|---------|---------|---------|-----------|---------|
| state-of-mind | 0 | 0 | 1 | 0 | **9** | 1 |
| attunement | 0 | 0 | 2 | 0 | **9** | 1 |
| findingness | 0 | 0 | 0 | 0 | 0 | 0 |
| disposition (generic) | 3 | 0 | 5 | 3 | 47 | 8 |
| mood (probable Stimmung) | 0 | 0 | 2 | 0 | 11 | 0 |

**Flag**: §1.4 uses "state-of-mind" and "attunement" each 9 times for `Befindlichkeit`. Per the user's MEMORY note, the canonical translation is "state-of-mind". The 9 "attunement" occurrences may also legitimately refer to `Stimmung`-side semantics; **Phase 3A terminology-reckoning must disambiguate every occurrence**, not just count.

---

## 7. Basic citation statistics

| Section | Bekker refs (Aristotle) | BCAP refs | SZ/H-page refs | Footnotes | Lines/footnote |
|---------|--------------------------|-----------|------------------|-----------|----------------|
| DISS-00-INTRO | 67 | 0 | 0 | 17 | 34.8 |
| DISS-01-A0 | 46 | 0 | 10 | 4 | 22.3 |
| DISS-02-A1A2 | 50 | 0 | 1 | 10 | 9.9 |
| DISS-03-A3 | 25 | 1 | 0 | 11 | 11.3 |
| DISS-04-EMOTION ★ | 64 | 2 | 10 | 17 | 10.8 |
| DISS-05-A4 | 17 | 0 | 0 | 0 | — |

**Observations**:
- DISS-04-EMOTION has the highest absolute Aristotle citation count (64 Bekker refs) and ties §1.0 for footnotes — consistent with gold-standard status.
- DISS-05-A4 has **0 footnotes** in 3,506 words — major citation deficit; consistent with under-developed/conclusion status.
- DISS-01-A0 has high Bekker density (46 / 6,272 words = 7.3 / 1000 words) but low Heidegger citation count for a section that is heavily Heideggerian thematically — consistent with the 4 outstanding `\textbf{******}` placeholders awaiting Heidegger verbatims.
- DISS-02-A1A2 has only 1 SZ/H-page ref — surprisingly low for a section that engages BCAP heavily; expected to climb after relocations from §1.4 (which has 10).

---

## 8. Diagram parse (`actualization-chain-v7.html`)

**Canonical node IDs found**: A0, A1, A2, A3 (with subnodes A3-NOESIS, A3-MEMORY, A3-DISCURSIVE, A3-SPECULATIVE, A3-DELIBERATIVE), A4.
**Canonical motion IDs found**: M01, M12, M23, M34.
**Additional architectural elements**: doxa band (A3_DOXA_BAND_*), settled-doxai (hexeis) node, recursive loop indicator.

**Display-label transform**: SVG arrows use `M_n→A_n` display style (e.g., M01 displays as M₁→A₁). The diagram's narrative HTML text/tooltips still contain `M2→M3` strings in places (e.g., line 1185 "Settled doxai as hexeis — additional unmoved originator at M2→M3"; line 1313 "phantasma + settled doxai as hexeis"). Phase 2c will catalog and patch.

**Hexeis/Settled-Doxai region** (per user note, under-developed):
- Single Settled-Doxai node currently at `<g id="settled-doxai">` (line 732 of HTML).
- Tooltip/description: line 1191 "Settled Doxai (Hexeis)"; line 1193 describes them as "additional unmoved originators of M₃→A₃" — **note the M₃→A₃ usage, which conflicts with surrounding M2→M3 / M3→M3 narrative on the same diagram**.

**Diagram readiness for static exports**: ready for 5 of 7 planned exports (A0; A1→A2; M2→A3+doxa; A3-band→M3→A4 three paths; A4 recursive; full chain). The hexeis-region export will note the under-development.

---

## 9. Pre-flight flag summary (input to Phase 1 metadata)

```json
{
  "DISS-00-INTRO":   {"hl": 3,  "inlinenote": 4, "cite": 0, "asterisk": 0, "qqq": 1, "mm_old": 0, "ma_new": 4, "mixed": false},
  "DISS-01-A0":      {"hl": 0,  "inlinenote": 0, "cite": 0, "asterisk": 4, "qqq": 0, "mm_old": 2, "ma_new": 0, "mixed": false, "convention": "OLD-ONLY"},
  "DISS-02-A1A2":    {"hl": 0,  "inlinenote": 0, "cite": 0, "asterisk": 4, "qqq": 0, "mm_old": 2, "ma_new": 3, "mixed": true},
  "DISS-03-A3":      {"hl": 7,  "inlinenote": 5, "cite": 1, "asterisk": 0, "qqq": 0, "mm_old": 5, "ma_new": 2, "mixed": true, "self_acknowledged": "line 67 \\hl{(double check numbering)}"},
  "DISS-04-EMOTION": {"hl": 4,  "inlinenote": 5, "cite": 1, "asterisk": 1, "qqq": 0, "mm_old": 3, "ma_new": 2, "mixed": true},
  "DISS-05-A4":      {"hl": 0,  "inlinenote": 0, "cite": 0, "asterisk": 0, "qqq": 0, "mm_old": 4, "ma_new": 0, "mixed": false, "convention": "OLD-ONLY"}
}
```

---

## 10. Tier C cache inputs (per Plan §3.5)

The 2026-05-10 Perplexity citation harvest is available for Phase 3.5 reconciliation:

- **MASTER-CITATION-REPORT**: `tmp/Dissertation/Pathe/citations/MASTER-CITATION-REPORT.md` (244 verbatim quotations across 17 secondary sources)
- **Pre-extracted text caches**: `tmp/Dissertation/Pathe/citations/text-cache/*.txt` (also in `corpus/download/text-cache/*.txt`)
- **22 downloaded PDFs**: `corpus/download/*.pdf` with `MANIFEST.json`
- **Reusable scripts**: `parse-and-download.py`, `perplexity-search.sh`

All artifacts confirmed present.

---

## 11. Phase 0 → Phase 1 handoff

Phase 1 (per-section metadata) is cleared to run on:
- 6 prose sections + 1 diagram = 7 metadata files
- Each will record: section heading structure with line ranges, expected concepts (from corpus/index), expected Aristotle/Heidegger/secondary loci, preflight flag counts (from §9 above), two-pass marker (all 7 = mandatory two-pass since all are dissertation-critical).

Phase 1 may run all 7 agents in 3 parallel batches per Plan §12 orchestration.

---

**End of Phase 0 dashboard. Total Phase 0 cost: ~0 LLM tokens (pure regex/I/O).**
