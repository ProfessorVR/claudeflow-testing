# DISS-02-G02 — Placeholder Resolution

**Gap ID**: DISS-02-G02
**Section**: DISS-02-A1A2 (§1.2 A_1–A_2 Aisthēsis)
**Line**: 47 (.tex of `1.2_A1-A2_Aisthesis_OUTPUT_v1.tex`)
**Anchor in prose**: BCAP pp. 131–132 — Heidegger's "progressive narrowing" reading of the fourfold of *pathos* (*Met.* Δ.21)
**Tier**: A_corpus_index + ****** placeholder
**Severity**: MEDIUM
**Support tier**: T5-under-supported

## 1. Named locus (confirmed)

Heidegger, *Basic Concepts of Aristotelian Philosophy* (GA 18, Metcalf-Tanzer trans., Indiana 2009), **pp. 131–132**. The dissertation prose attaches Heidegger's progressive-narrowing reading to the four senses of *pathos* in *Metaphysics* Δ.21:

> Heidegger gathers the four under a single thesis: "******" (BCAP, pp. 131–132).

## 2. Corpus/index pipeline route (confirmed)

**Pipeline**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/`
**Unit**: **U-FP3c** (`bcap-structured/u-fp3c.json` + `bcap-analysis/phase2-u-fp3c.md`)
- **Title**: Hexis and Pathos (General Meanings)
- **Sections**: §17–§18
- **Pages**: 116–139 (PDF 131–154)
- **Subsection covering pp. 131–132**: §18b "The four general meanings of *pathos* (Met. Δ.21)"
- **Dissertation-critical**: YES (two-pass, MANDATORY)

## 3. Corpus/index narrative content — verbatim paraphrase available

From `phase2-u-fp3c.md` §18b (the fourfold *pathos* analysis, pp. 131–132):

> **§18b: The four general meanings of *pathos* (Met. Δ.21) [pp. 131–132]**
>
> 1. **Poiotēs kath' hen alloiousthai endechetai** — "being-constituted, regarding which something underlies alteration." *Pathos* is a determination of beings with the character of alterability; something can *happen* to such a being. "To happen" touches upon *paschein* and *pathos* in the genuine sense: not the passive, but that which *occurs for me*. "*Pathos* is a determination of beings with the character of becoming-otherwise" (Met. Δ.21, 1022b 15 sqq.) (p. 131).
> 2. **Energeia kai alloiōseis ēdē** — beings that carry in themselves the possibility of something occurring to them in relation to their constitution. *Energeia*: the "being-there" of such a shifting occurring-to-one (Met. Δ.21, 1022b 18) (p. 131).
> 3. **Blaberai alloiōseis kai kinēseis, kai malista hai lypēai** — *pathos* as the occurring-to-one that has the character of the unpleasant, the *blaberon*. *Pathos* is defined still more precisely: harmfulness is related mostly to *lypē* — "my attunement to this occurring affects me," a becoming-otherwise in the sense of becoming-depressed (Met. Δ.21, 1022b 18 sqq.) (pp. 131–132).
> 4. **Ta megethē tōn sumpherontōn kai luperōn pathē** — *pathos* designates "size," the measure of that which occurs to me in a harmful way: "that is a blow to me" (Met. Δ.21, 1022b 20 sq.) (p. 132).
>
> From these four meanings, **the *genuine relatedness* of *pathos* becomes visible: it is related to the *being of living things*, characterized by the occurring-again-and-again**. This occurring has in itself the character of the *harmful*. Aristotle recognizes that *pathos* includes *metabolē*, *kinēsis*, *alloiōsis*, in which *paschein* has the character of *phthora* and *sōtēria*.

## 4. Status of the verbatim

**Best-candidate verbatim from corpus/index narrative**:

> "the *genuine relatedness* of *pathos*… is related to the *being of living things*, characterized by the occurring-again-and-again." (BCAP pp. 131–132, glossing *Met.* Δ.21, 1022b15–20).

This is the corpus/index paraphrase of Heidegger's thesis-formulation at the close of §18b. The "occurring-again-and-again" + "*phthora*/*sōtēria*" pairing captures Heidegger's progressive-narrowing claim: each of the four senses narrows the previous one toward the lived-bodily case where the harmful threatens *sōtēria* of the being. The §1.2 footnote correctly describes this as "thus-finding-oneself-again-and-again" — the corpus/index narrative uses "occurring-again-and-again."

## 5. Recommended action

**Option A (recommended)**: Use the corpus/index-extracted thesis-formulation as the verbatim citation:

```latex
NEW:
Heidegger gathers the four under a single thesis: the ``genuine relatedness''
of *pathos* is to ``the being of living things, characterized by the 
occurring-again-and-again,'' which ``has in itself the character of the 
harmful'' (BCAP, pp.~131--132, glossing \textit{Metaphysics} Δ.21, 
1022b15--20).
```

**Option B (per `feedback-missing-source-placeholder.md`)**: Leave `******` for user manual fill against Metcalf-Tanzer Indiana 2009 edition. The corpus/index narrative provides a complete progressive-narrowing argument at pp. 131–132 with explicit page anchors.

## 6. Patch-template for user (Option A)

```latex
OLD:
Heidegger gathers the four under a single thesis: ``\textbf{******}'' 
(BCAP, pp.~131--132).

NEW:
Heidegger gathers the four under a single thesis: the ``genuine relatedness'' 
of \textit{pathos} is to ``the being of living things, characterized by the 
occurring-again-and-again,'' which ``has in itself the character of the 
harmful'' (BCAP, pp.~131--132, glossing \textit{Metaphysics} Δ.21, 
1022b15--20).
```

## 7. Note on Δ.21 interpretation alignment

The dissertation prose claims each of the four senses is **"satisfied at the perceptual level"**:
1. alterability ↔ *DA* II.5, 416b33–417a20 (perceptual *dynamis*)
2. actual alterations ↔ resonant *aisthēma* as *energeia* of *aisthētikon*
3. harmful alterations ↔ *DA* III.2, 426a30–b8 (limit-case excess destroys *logos*)
4. magnitudes ↔ perception admits intensity/gradation

The Heideggerian gloss in the corpus/index narrative — where the harmful occurs as *phthora*/*sōtēria* — supplies the unified frame, and the dissertation's own perceptual specification of the four senses is the chapter's downstream interpretive deployment of Heidegger's progressive-narrowing reading.

## 8. Provenance footer

- Pipeline manifest: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-structured/manifest.json` (U-FP3c §17–§18, two-pass MANDATORY)
- Corpus/index narrative: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3c.md` §18b
- Bekker cross-anchor: *Metaphysics* Δ.21, 1022b15–20; cf. `corpus/index/Aristotle - Complete Works/aristotle-meta-05.json` for primary text
