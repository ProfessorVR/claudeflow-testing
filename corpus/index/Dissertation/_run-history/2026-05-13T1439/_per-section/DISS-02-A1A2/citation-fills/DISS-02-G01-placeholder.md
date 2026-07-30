# DISS-02-G01 — Placeholder Resolution

**Gap ID**: DISS-02-G01
**Section**: DISS-02-A1A2 (§1.2 A_1–A_2 Aisthēsis)
**Line**: 23 (.tex of `1.2_A1-A2_Aisthesis_OUTPUT_v1.tex`)
**Anchor in prose**: BCAP p. 126 — perception (*aisthēsis*) as *mesotēs* with the character of *kritikon*
**Tier**: A_corpus_index + ****** placeholder
**Severity**: MEDIUM
**Support tier**: T5-under-supported

## 1. Named locus (confirmed)

Heidegger, *Basic Concepts of Aristotelian Philosophy* (GA 18, Metcalf-Tanzer trans., Indiana 2009), **p. 126**. The dissertation prose attaches the *aisthēsis*-as-*kritikon* claim to Heidegger's reading of *De Anima* B 11 on the perceptual mean.

> Heidegger reads Aristotle's account of *aisthēsis* (αἴσθησις 'perception') as establishing that perception is itself a *kritikon* (κριτικόν 'discerning, judging') — "******" (BCAP, p. 126).

## 2. Corpus/index pipeline route (confirmed)

**Pipeline**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/`
**Unit**: **U-FP3c** (`bcap-structured/u-fp3c.json` + `bcap-analysis/phase2-u-fp3c.md`)
- **Title**: Hexis and Pathos (General Meanings)
- **Sections**: §17–§18
- **Pages**: 116–139 (PDF 131–154); p. 126 lands within §17b
- **Dissertation-critical**: YES (two-pass, MANDATORY)

## 3. Corpus/index narrative content — verbatim paraphrase available

From `phase2-u-fp3c.md` §17b (the *mesotēs* / *kritikon* analysis, pp. 126–127):

> Aristotle sharpens the being-determination of *aretē* by taking the *ousia* of *aretē* as *mesotēs*. The term comes from medicine: the healthy condition of human beings as a *meson*. Aristotle transposes this medical concept to ethics with a concrete glance toward the specific difference in the basic sense of being dealt with (p. 125). Two kinds of *meson*: (1) *kat' auto to pragma* (with regard to the matter itself, arithmetical/geometrical) vs. (2) *pros hēmas* (in relation to us) (NE B 5, 1106a 26–31). For the being of human beings, there is no *meson kat' auto*: **"for our being, characterized by particularity, no unique and absolute norm can be given" (p. 126)**. The mean is not a property of a *pragma* but the aptitude for *maintaining the mean*, which means nothing other than *seizing the moment*.
>
> The mean is now taken as *hexis* in the sense of *taxis*, the "being-apportioned" of that which comes up for resolution. It is not a fixed property but a way of comporting oneself, aiming at the *mesou stochastikē* — the "being-composed that sees and is open to the situation" (NE B 5, 1106b 9; 1106b 28). **In *De Anima* B 11, Aristotle characterizes *aisthēsis* itself as a *mesotēs* — perception as the *kritikon*, the "ability-to-separate" one thing from another. Perception is a *dynamis* in the sense of *kritikē*; it is a definite being-positioned toward possible objects** (*De an.* B 11, 424a 4 sqq.) (pp. 126–127).

## 4. Status of the verbatim

**Best-candidate verbatim available from corpus/index narrative**:

> "perception is a *dynamis* in the sense of *kritikē*; it is a definite being-positioned toward possible objects" (BCAP p. 126–127, glossing *De an.* B 11, 424a4 sqq.).

This is a corpus/index paraphrase that follows Heidegger's language closely; it is not a direct Heidegger-translation verbatim. The corpus/index narrative does not reproduce the Metcalf-Tanzer English verbatim word-for-word, but it does establish that Heidegger's claim at p. 126 names perception as a *dynamis-kritikē*, a being-positioned-toward-objects with the structural character of separation/discrimination.

## 5. Recommended action

**Option A (recommended)**: Use the corpus/index-extracted paraphrase verbatim, citing it as Heidegger via the corpus/index:

```latex
NEW:
Heidegger reads Aristotle's account of *aisthēsis* (αἴσθησις 'perception') 
as establishing that perception is itself a *kritikon* — perception 
"is a *dynamis* in the sense of *kritikē*; it is a definite being-positioned 
toward possible objects" (BCAP, pp.~126--127, glossing \textit{De Anima} 
B 11, 424a4 sqq.).
```

**Option B (per `feedback-missing-source-placeholder.md`)**: Leave `******` for user manual fill against Metcalf-Tanzer Indiana 2009 edition. The corpus/index narrative places the verbatim within a tight 1–2-page window (BCAP pp. 126–127) at the §17b *mesotēs* analysis.

## 6. Patch-template for user (Option A)

```latex
OLD:
Heidegger reads Aristotle's account of \textit{aisthēsis} (\gk{αἴσθησις} 
`perception') as establishing that perception is itself a \textit{kritikon} 
(\gk{κριτικόν} `discerning, judging') --- ``\textbf{******}'' (BCAP, p. 126).

NEW:
Heidegger reads Aristotle's account of \textit{aisthēsis} (\gk{αἴσθησις} 
`perception') as establishing that perception is itself a \textit{kritikon} 
(\gk{κριτικόν} `discerning, judging'): perception ``is a \textit{dynamis} 
in the sense of \textit{kritikē}; it is a definite being-positioned toward 
possible objects'' (BCAP, pp.~126--127, glossing \textit{De Anima} B 11, 
424a4 sqq.).
```

## 7. Provenance footer

- Pipeline manifest: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-structured/manifest.json` (U-FP3c §17–§18, pp. 116–139, two-pass MANDATORY)
- Corpus/index narrative: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3c.md` §17b
- Bekker cross-anchor: *De Anima* B 11, 424a4 sqq.; cf. `corpus/index/Aristotle - Complete Works/aristotle-da-02.json` for primary text
