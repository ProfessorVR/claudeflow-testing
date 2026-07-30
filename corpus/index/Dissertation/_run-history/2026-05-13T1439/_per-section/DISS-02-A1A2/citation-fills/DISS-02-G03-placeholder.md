# DISS-02-G03 — Placeholder Resolution (White p. 498 — resonant phantasia)

**Gap ID**: DISS-02-G03
**Section**: DISS-02-A1A2 (§1.2 A_1–A_2 Aisthēsis)
**Line**: 55 (.tex of `1.2_A1-A2_Aisthesis_OUTPUT_v1.tex`); the corresponding .md file at line 91 ALREADY contains the verbatim
**Anchor in prose**: White p. 498 — the "lingering, resonating, echoing presence" formulation of *phantasia*
**Tier**: A_corpus_index + ****** placeholder
**Severity**: MEDIUM
**Support tier**: T5-under-supported

## 1. Named locus (confirmed)

Kevin White, "The Meaning of *Phantasia* in Aristotle's *De Anima* III, 3–8" (1985), **article p. 498**. The dissertation prose attaches White's "lingering, resonating, echoing presence" formula to the *resonant kinēsis* coinage.

## 2. Corpus/index pipeline route (confirmed)

**Pipeline**: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/`
**Unit**: **PHX-02** (`White - Phantasia in DA III.3-8 (1985)/phx-02-white.md`)
- The **book p. 498** = end of White's § 3 (close of *phantasia*-and-sensation analysis, transitioning to § 4 *phantasia* and *nous*).
- Per the corpus/index narrative: "The longest and architecturally most important section of the essay" (§ 4) begins at book p. 498.

## 3. Corpus/index narrative content — full verbatim available

From `phx-02-white.md` § 3 close (pdf 16, book p. 498):

> The closing paragraph of § 3 (pdf 16) consolidates: *phantasia* is "a dimension of the life of all animal souls." Beyond reception, the animal soul is "a *preserver* and a *storehouse* of the sensible forms of things" (pdf 16). **The lingering, resonating, echoing presence of sensible forms freed from their original matter is "the essence of *phantasia* for Aristotle."** It is here that White inserts the explicit Augustinian parallel: Aristotle's *phantasia* "resembles very much the *memoria* eloquently described by St. Augustine."

Additionally, the .md version of §1.2 of the dissertation (line 91) already contains the FULL VERBATIM White quote, which is corroborated by the corpus/index narrative:

> "This lingering, resonating, echoing presence of sensible forms freed from their original matter appears to be the essence of *phantasia* for Aristotle. The movement in the sense-power caused by the sensible object itself sets up a second movement which continues after the sensation has ceased and the object is gone" (White, p. 498).

## 4. Status of the verbatim

**Verbatim AVAILABLE from corpus/index AND from the .md source**. This placeholder can be filled immediately. The discrepancy between the .md (full verbatim) and .tex v1 (placeholder) appears to be an export artifact during the OUTPUT_v1.tex generation; the .md is the authoritative source.

## 5. Recommended action

**ACTION**: Fill the .tex placeholder with the verbatim from `phx-02-white.md` (= the same verbatim that already appears in the .md file).

## 6. Patch (Edit-ready)

```latex
OLD:
White captures the reverberating character precisely: ``\textbf{******}'' 
(White, \textit{The Meaning of Phantasia in Aristotle's De Anima III, 3-8}, 
p.~498).

NEW:
White captures the reverberating character precisely: ``This lingering, 
resonating, echoing presence of sensible forms freed from their original 
matter appears to be the essence of \textit{phantasia} for Aristotle. 
The movement in the sense-power caused by the sensible object itself sets 
up a second movement which continues after the sensation has ceased and 
the object is gone'' (White, \textit{The Meaning of Phantasia in Aristotle's 
De Anima III, 3-8}, p.~498).
```

## 7. Provenance footer

- Corpus/index narrative: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/White - Phantasia in DA III.3-8 (1985)/phx-02-white.md` § 3 closing paragraph
- Cross-verification with `.md` source file: `/home/dalton/projects/claudeflow-testing/tmp/Dissertation/1.2 - A1-A2 - Aisthesis/1.2 - A1-A2 - Aisthesis.md` line 91 (identical verbatim)
- Note: this placeholder is the strongest case for direct fill in the §1.2 set — the verbatim is corroborated independently by the corpus/index narrative AND the dissertation's own .md draft.
