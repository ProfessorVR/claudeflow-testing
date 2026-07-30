# DISS-02-G04 — Placeholder Resolution (BCAP p. 164 — hēdonē-in-the-moment)

**Gap ID**: DISS-02-G04
**Section**: DISS-02-A1A2 (§1.2 A_1–A_2 Aisthēsis)
**Line**: 79 (.tex of `1.2_A1-A2_Aisthesis_OUTPUT_v1.tex`); the .md file at line 121 ALREADY contains the verbatim
**Anchor in prose**: BCAP p. 164 — *hēdonē* "in the moment," not in time as a determinate span
**Tier**: A_corpus_index + ****** placeholder
**Severity**: MEDIUM
**Support tier**: T5-under-supported

## 1. Named locus (confirmed)

Heidegger, *Basic Concepts of Aristotelian Philosophy*, **p. 164**. The dissertation prose attaches the *hēdonē-en-tō-nun* claim to the *resonant orexis* (post-terminology-migration: `resonant epithymia`) hedonic-tonality argument.

## 2. Corpus/index pipeline route (confirmed)

**Pipeline**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/`
**Unit**: **U-FP3d** (`bcap-structured/u-fp3d.json` + `bcap-analysis/phase2-u-fp3d.md`)
- **Title**: *Phusikos, Hēdonē/Lupē*
- **Sections**: §19–§20
- **Pages**: 140–166 (PDF 155–181); p. 164 lands within §20 (the *hēdonē/lupē* analysis)

## 3. Corpus/index narrative content — full verbatim available

From `phase2-u-fp3d.md` §U-FP3d-P19 (the *hēdonē-en-tō-nun* claim, p. 164):

> **U-FP3d-P19: *Hēdonē* is *en tō nun* — "in the moment" — and thus no *kinēsis* but a determination of the presentness of being-there as such.**
>
> Comparison with *aisthēsis* (NE K3): *hēdonē* is complete "in the moment," not in time as a determinate span. **"It is in itself completed, has no movement"** (p. 164). Heidegger insists this is not merely negative (not-in-time) but positive: *hēdonē* characterizes the presentness of being-there. In *Rhetoric* A11, *hēdonē* is called *kinēsis tis*, but this means it is a determination of being — change as the character of being, not a process in a span.

The .md version of §1.2 (line 121) already contains the corresponding verbatim:

> *hēdonē* "is what it is 'in the moment,' μὴ ἐν χρόνῳ, 'not in time' in the sense of a determinate span." (164); and, while *hēdonē* is a motion (*kinesis*), it is no movement in the sense of a process spanning time but "a *determination of the presentness of being-there as such*" (164).

## 4. Status of the verbatim

**Verbatim AVAILABLE from corpus/index AND from the .md source**. This placeholder can be filled immediately. The .md text already contains the canonical fill.

## 5. Recommended action

**ACTION**: Fill the .tex placeholder with the verbatim that appears in the .md.

## 6. Patch (Edit-ready)

```latex
OLD:
Heidegger insists, first, that \textit{hēdonē} is what it is ``in the 
moment,'' not in time as a determinate span: ``\textbf{******}'' 
(BCAP, p.~164).

NEW:
Heidegger insists, first, that \textit{hēdonē} is what it is ``in the 
moment,'' not in time as a determinate span: \textit{hēdonē} ``is in itself 
completed, has no movement'' and is ``a \textit{determination of the 
presentness of being-there as such}'' (BCAP, p.~164).
```

## 7. Provenance footer

- Corpus/index narrative: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3d.md` §U-FP3d-P19
- Cross-verification with `.md` source: `/home/dalton/projects/claudeflow-testing/tmp/Dissertation/1.2 - A1-A2 - Aisthesis/1.2 - A1-A2 - Aisthesis.md` line 121 (compatible verbatim, slight phrasing variation; corpus/index version is canonical)
- Bekker cross-anchor: *NE* K3, 1174a13 sqq., 1174b9; *Rhet.* A11, 1369b33; cf. `corpus/index/Aristotle - Complete Works/aristotle-ne-10.json` and `aristotle-rhet-01.json`
