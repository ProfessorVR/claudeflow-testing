# DISS-01-G01 — Placeholder Resolution

**Gap ID**: DISS-01-G01
**Section**: DISS-01-A0 (§1.1 A_0 Motion and Time)
**Line**: 23 (.md) / 23 (.tex, line 23 of `1.1_A0_Motion_and_Time_OUTPUT_v2.tex`)
**Anchor in prose**: *kinēsis* as *Bewegtheit* — Heidegger's structural-existential determination of a being's *there*
**Tier**: A_corpus_index + ****** placeholder
**Severity**: MEDIUM (per `citation-gap-master.json`)
**Support tier**: T5-under-supported

## 1. Named locus (confirmed)

The named locus is Heidegger, *Basic Concepts of Aristotelian Philosophy* (GA 18, the 1924 Marburg lectures), Metcalf-Tanzer trans. (Indiana 2009). The dissertation prose introduces *Bewegtheit* as Heidegger's German rendering of *kinēsis*-as-character-of-being:

> *kinēsis* accordingly names what Heidegger develops as *Bewegtheit* — "******" (*Basic Concepts of Aristotelian Philosophy*, p. ******).

The footnote already in §1.1 narrows the locus to **the chapter-area on *kinēsis* and being-in-movement, alongside Heidegger's reading of *Metaphysics* Θ on *dynamis* and *energeia*** — which corresponds to **GA 18 §26** (Movement as ἐντελέχεια τοῦ δυνάμει ὄντος, *Physics* Γ1).

## 2. Corpus/index pipeline route (confirmed)

**Pipeline**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/`
**Unit**: **U-SP2a** (`bcap-structured/u-sp2a.json` + `bcap-analysis/phase2-u-sp2a.md`)
- **Title**: Physics as Archē-Research; Kinēsis as Entelecheia
- **Pages**: 192–212 (PDF 207–227)
- **Sections**: §25, §26 (with §26a–§26g)
- **Dissertation-critical**: YES (two-pass, MANDATORY)

## 3. Corpus/index narrative content (for paraphrase if needed)

From `phase2-u-sp2a.md` (the §26 thesis narrative):

> Heidegger argues that Aristotle's *Physics* is not natural science but *ἀρχή*-research — critique of inherited interpretedness — whose central achievement is the definition of κίνησις as ἐντελέχεια τοῦ δυνάμει ὄντος (*Physics* Γ1, 201a10), a formula that discloses movement as the **presence of a being in its ability-to-be precisely insofar as it is an ability-to-be**, grounded in the threefold articulation of ἐντελέχεια/ἐνέργεια, στέρησις, and δύναμις and in the twofold (διχῶς) structure of each category, such that κίνησις is revealed not as a regional phenomenon but as the **fundamental mode of being of worldly beings** — the 1924 anticipation of *Zuhandenheit* and the existential analytic.

A particularly close formulation from `phase2-u-sp2a.md` §26d (citing GA 18 p. 199, the announcement that opens the *kinēsis* analysis):

> "It is really not a question of *defining* movement in some sense, but of *making* beings as moved *visible* in their being-there and holding fast to them."

The "rest is an extreme case of movement" formulation (p. 212):

> "Rest is only possible for something that in itself has the being-determination of being in movement or being able to be in movement. We encounter many things of the world — most of those with which we have to do — for the most part as resting."

## 4. Status of the verbatim

**Verbatim NOT extractable from corpus/index.** Per the unit's manifest note ("Full text not stored due to content filtering; read PDF pages 207–227 on-the-fly"), the precise Heidegger verbatim for "*kinēsis* = *Bewegtheit*" is not stored as a quotable string in the corpus/index unit. The corpus/index narrative confirms the locus but does not reproduce the German-text verbatim.

## 5. Recommended action

**Per `feedback-missing-source-placeholder.md`**: leave the `******` in §1.1 line 23 for **user manual fill**. The current footnote already narrows the locus correctly. Recommend additionally cross-anchoring the citation to **GA 18 §26 (Metcalf-Tanzer pp. 199–212)** rather than to a single page, since the *Bewegtheit*-as-being-determination thesis develops continuously across §26d–§26g (pp. 199–212).

**Best candidate verbatim pages** (in order of likely relevance):
1. **p. 199** (start of §26d): the announcement that the task is "making beings as moved visible in their being-there" rather than defining movement
2. **p. 211** (§26f): the διχῶς-of-categories formula linking each category's twofold structure to *kinēsis* as the "from… toward…" being-determination
3. **p. 212** (close of §26g): rest as the extreme case of movement

A user-manual fill drawing on §26d (p. 199) is most likely to match the existing prose context, since §1.1 is establishing *kinēsis* as a *Seinscharakter* (character of being) of moving entities.

## 6. Patch-template for user

```latex
OLD:
*kinēsis* accordingly names what Heidegger develops as *Bewegtheit* — 
``\textbf{******}'' (\textit{Basic Concepts of Aristotelian Philosophy}, p.~\textbf{******}).

NEW (template — user supplies verbatim from BCAP §26d–§26g):
*kinēsis* accordingly names what Heidegger develops as *Bewegtheit* — 
``<<VERBATIM FROM BCAP PP. 199–212>>'' (\textit{Basic Concepts of 
Aristotelian Philosophy}, p.~<<CONFIRM PAGE>>).
```

## 7. Provenance footer

- Pipeline manifest: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-structured/manifest.json` (unit U-SP2a, pp. 192–212, two-pass MANDATORY)
- Corpus/index narrative: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-sp2a.md` (Phase 2 mandatory-two-pass narrative)
- Bekker locus cross-anchored: *Physics* Γ1, 201a10 (also in `corpus/index/Aristotle - Complete Works/aristotle-phys-03.json`)
