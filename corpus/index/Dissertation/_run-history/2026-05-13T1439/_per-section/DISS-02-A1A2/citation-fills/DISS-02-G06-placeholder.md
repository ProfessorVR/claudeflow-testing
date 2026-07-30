# DISS-02-G06 — Placeholder Resolution (White pp. 9–11)

**Gap ID**: DISS-02-G06
**Section**: DISS-02-A1A2 (§1.2 A_1–A_2 Aisthēsis)
**Line**: 23 (.tex of `1.2_A1-A2_Aisthesis_OUTPUT_v1.tex`)
**Anchor in prose**: White pp. 9–11 — *to kritikon* as unifying capacity across perception, *phantasia*, thought
**Tier**: A_corpus_index + ****** placeholder
**Severity**: MEDIUM
**Support tier**: T5-under-supported

## 1. Named locus (confirmed)

Kevin White, "The Meaning of *Phantasia* in Aristotle's *De Anima* III, 3–8" (1985), **article pp. 9–11**. The dissertation prose attaches White's *to kritikon* analysis to the §1.2 *aisthēsis*-as-kritikon discussion:

> White's identification of *to kritikon* as the unifying capacity that connects perception, *phantasia*, and thought is the secondary literature's correlate of Heidegger's reading: "******" (White, *The Meaning of Phantasia in Aristotle's De Anima III, 3-8*, pp. 9–11).

## 2. Corpus/index pipeline route (confirmed)

**Pipeline**: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/`
**Unit**: **PHX-02** (`White - Phantasia in DA III.3-8 (1985)/phx-02-white.md` + `phx-02-white.json`)
- Bekker locus map covers: DA I.1, II.2, II.3, III.2, III.3, III.7, III.8, III.9, III.10, III.11, *De Insomniis*, *De Memoria*, Metaphysics IV.5
- **Article pp. 9–11**: this corresponds to White's "§ 2.1 The Plan of the *De Anima*" (pdf 7–11), where the three-way reading of DA III.3–11 is articulated, and the *to kritikon* vs *to kinetikon* division is named.

## 3. Corpus/index narrative content — verbatim available

From `phx-02-white.md` § 2.1 (the plan-of-the-*De-Anima* analysis, pdf 7–11):

> White then surveys the unstable architecture of the latter half of the treatise: nutrition (II.4), sensation (II.5–III.2), *phantasia* (III.3), thought (III.4–8), locomotion (III.9–11), and supplementary remarks (III.12–13). **The plan of III.3–11 admits at least three readings: (a) by grades-of-life; (b) by *to kritikon* (the "distinguishing power," collecting thought and sensation) versus *to kinetikon* (the locomotive power), the major division at III.9 432a15–17; or (c) by powers peculiar to soul versus powers common to soul and body** (pdf 9–10). White's verdict: ***nous* is "a continuing and unifying theme throughout III, 3–11"** (pdf 11, fn. 39).

## 4. Status of the verbatim

**Best-candidate verbatim from corpus/index narrative**:

> "by *to kritikon* (the 'distinguishing power,' collecting thought and sensation) versus *to kinetikon* (the locomotive power), the major division at III.9 432a15–17" (White, "Meaning of *Phantasia*," pp. 9–10).

And from White's pp. 11 fn. 39 (per the corpus/index narrative):

> "*nous* is a continuing and unifying theme throughout III, 3–11" (White, p. 11 fn. 39).

The combined material at White pp. 9–11 establishes that the §1.2 dissertation claim — White treats *to kritikon* as the unifying thread connecting perception, *phantasia*, and thought — is grounded in the article's three-way reading of DA III.3–11's plan, with the *to kritikon* reading (b) explicitly bringing thought and sensation together as the "distinguishing power."

## 5. Recommended action

**Option A (recommended)**: Use the corpus/index-extracted verbatim:

```latex
NEW:
White's identification of *to kritikon* as the unifying capacity that 
connects perception, *phantasia*, and thought is the secondary literature's 
correlate of Heidegger's reading: White names ``\textit{to kritikon} (the 
`distinguishing power,' collecting thought and sensation) versus 
\textit{to kinetikon} (the locomotive power), the major division at 
\textit{De Anima} III.9 432a15--17'' (White, ``Meaning of Phantasia,'' 
pp.~9--10), with *nous* serving as ``a continuing and unifying theme 
throughout III, 3--11'' (White, p.~11, fn.~39).
```

**Option B**: Leave `******` for user manual fill against the published article. Locus is identified to within 2–3 article pages.

## 6. Patch-template for user (Option A)

```latex
OLD:
``\textbf{******}'' (White, \textit{The Meaning of Phantasia in Aristotle's 
De Anima III, 3-8}, pp.~9--11).

NEW:
``\textit{to kritikon} (the `distinguishing power,' collecting thought and 
sensation) versus \textit{to kinetikon} (the locomotive power), the major 
division at \textit{De Anima} III.9 432a15--17'' (White, ``Meaning of 
Phantasia,'' pp.~9--10), with *nous* as ``a continuing and unifying theme 
throughout III, 3--11'' (White, p.~11, fn.~39).
```

## 7. Provenance footer

- Pipeline manifest: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/_synthesis/` (per cluster master-plan; full unit at `White - Phantasia in DA III.3-8 (1985)/`)
- Corpus/index narrative: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/White - Phantasia in DA III.3-8 (1985)/phx-02-white.md` § 2.1
- Bekker cross-anchor: *DA* III.9, 432a15–17 (*to kritikon* vs *to kinetikon* division); cf. `corpus/index/Aristotle - Complete Works/aristotle-da-03.json` for primary text
- Note: a second §1.2 occurrence of White pp. 9–11 (line 81 of `1.2 - A1-A2 - Aisthesis.md`) is NOT placeholder-marked but uses the same locus; corrections should propagate consistently.
