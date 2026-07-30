# DISS-02-G05 — Placeholder Resolution (BCAP p. 166 — hēdonē co-given with every mode of being-there)

**Gap ID**: DISS-02-G05
**Section**: DISS-02-A1A2 (§1.2 A_1–A_2 Aisthēsis)
**Line**: 79 (.tex of `1.2_A1-A2_Aisthesis_OUTPUT_v1.tex`); the .md file at line 121 ALREADY contains the verbatim
**Anchor in prose**: BCAP p. 166 — *hēdonē*/*lypē* as universal accompaniment of every mode of being-there
**Tier**: A_corpus_index + ****** placeholder
**Severity**: MEDIUM
**Support tier**: T5-under-supported

## 1. Named locus (confirmed)

Heidegger, *Basic Concepts of Aristotelian Philosophy*, **p. 166**. The dissertation prose attaches the universal-affect claim to the hedonic-tonality argument for the post-perceptual residue.

## 2. Corpus/index pipeline route (confirmed)

**Pipeline**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/`
**Unit**: **U-FP3d** (`bcap-structured/u-fp3d.json` + `bcap-analysis/phase2-u-fp3d.md`)
- **Title**: *Phusikos, Hēdonē/Lupē*
- **Pages**: 140–166 (PDF 155–181); p. 166 is the closing page of the unit, within §20

## 3. Corpus/index narrative content — full verbatim available

From `phase2-u-fp3d.md` §U-FP3d-P22 (the universal-affect claim, p. 166):

> **U-FP3d-P22: The *pathē* are co-given with every *pathos*: *hēdonē* and *lypē* accompany every perceiving, thinking, and considering as inseparable companions.**
>
> **"*Hēdonē* and *lypē* are co-given; with every *pathos*, but equally with every perceiving, every thinking, considering, with *theōria*, to the extent that they are basic modes of living, *hēdonē* is an inseparable companion"** (p. 166). This is the ground-claim for the universality of affect: no mode of being-there is without *hēdonē*/*lypē*.

The .md version of §1.2 (line 121) already contains this verbatim:

> "with every πάθος (*pathos*), but equally with every perceiving, every thinking, considering, with θεωρία (*theōria*), to the extent that they are basic modes of living, ἡδονή (*hēdonē*) is an inseparable companion" (166). There is no mode of being-there from which pleasure-or-pain is absent.

## 4. Status of the verbatim

**Verbatim AVAILABLE from corpus/index AND from the .md source**. The two sources give matching content (corpus/index in plain transliterated form; .md preserves Greek-script). This placeholder can be filled immediately.

## 5. Recommended action

**ACTION**: Fill the .tex placeholder with the verbatim from the corpus/index narrative (matches the .md).

## 6. Patch (Edit-ready)

```latex
OLD:
Second, Heidegger insists that \textit{hēdonē} and \textit{lypē} are 
co-given with every mode of being-there: ``\textbf{******}'' (BCAP, p.~166).

NEW:
Second, Heidegger insists that \textit{hēdonē} and \textit{lypē} are 
co-given with every mode of being-there: ``\textit{hēdonē} and \textit{lypē} 
are co-given; with every \gk{πάθος} (\textit{pathos}), but equally with 
every perceiving, every thinking, considering, with \gk{θεωρία} 
(\textit{theōria}), to the extent that they are basic modes of living, 
\gk{ἡδονή} (\textit{hēdonē}) is an inseparable companion'' (BCAP, p.~166).
```

## 7. Provenance footer

- Corpus/index narrative: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3d.md` §U-FP3d-P22
- Cross-verification with `.md` source: `/home/dalton/projects/claudeflow-testing/tmp/Dissertation/1.2 - A1-A2 - Aisthesis/1.2 - A1-A2 - Aisthesis.md` line 121 (matches; the .md keeps Greek script which is preferable for the final dissertation)
- Bekker cross-anchor: *NE* K4, 1174b20 sqq.; cf. `corpus/index/Aristotle - Complete Works/aristotle-ne-10.json`
- Note: this verbatim is the ground-claim for the §1.2 hedonic-tonality / resonant-epithymia argument; per the post-terminology-migration update (terminology-decisions-final.md), `resonant orexis` should be replaced by `resonant epithymia` in §1.2 line 79 surrounding prose; this is a separate Phase 5 task.
