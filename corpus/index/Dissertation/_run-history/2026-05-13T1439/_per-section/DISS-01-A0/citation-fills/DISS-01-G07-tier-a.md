# DISS-01-G07 — Tier A Citation-Fill (Hawhee Bodily Arts → Rhetorical Vision 2011)

**Gap ID**: DISS-01-G07
**Section**: DISS-01-A0 (§1.1)
**Severity**: MEDIUM (T7-overreach: bibliographic misattribution)
**Tier**: A_corpus_index
**Inconsistency cross-ref**: INCONS-003 (CRITICAL)

## 1. Claim and anchor

§1.1 .md line 19 / .tex line 21 cites:
> Hawhee observes of this register that *energeia* "names something like physical presence: *energeia* means the presence of the thing" (Hawhee, *Bodily Arts*, p. 154).

Per `inconsistencies-and-fallacies.json` INCONS-003 and the corpus/index Hawhee unit PHX-07, the verbatim "Energeia means the presence of the thing" is from Hawhee 2011 ("Looking Into Aristotle's Eyes: Toward a Theory of Rhetorical Vision"), p. 154 — NOT Hawhee 2004 *Bodily Arts*.

## 2. Locus confirmed in corpus/index

- **Pipeline**: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/`
- **Unit**: `Hawhee - Rhetorical Vision (2011)/phx-07-hawhee.md` § "Phantasia in Rhetoric Book III"
- **Exact verbatim location**: article p. 154, anchoring *Metaphysics* 9.5.1048a32–34

## 3. Verbatim from corpus/index

From `phx-07-hawhee.md` § Book III analysis:

> She closes the lexical analysis by anchoring *energeia* in *Metaphysics* 9.5.1048a.32–34: **"Energeia means the presence of the thing."** The conclusion of the section makes *lexis* the lifeblood of rhetorical vision: bringing-before-the-eyes and *energeia* are the leading stylistic strategies for tapping *phantasia* and stirring the *pathē*.

## 4. Patch (edit-ready)

```latex
OLD:
(Hawhee, \textit{Bodily Arts}, p.~154)

NEW (recommended — short-title form):
(Hawhee, ``Rhetorical Vision,'' p.~154)
```

Alternative form (full short-title): `(Hawhee, "Looking Into Aristotle's Eyes," p.~154)`.

**Bibliography entry** for the dissertation's References list:
> Hawhee, Debra. "Looking Into Aristotle's Eyes: Toward a Theory of Rhetorical Vision." *Advances in the History of Rhetoric* 14, no. 2 (2011): 139–165.

## 5. Status

CONFIRMED correction. Phase 3 hypothesis verified. The verbatim is corroborated independently in the corpus/index Hawhee 2011 unit. The misattribution to *Bodily Arts* (2004) is bibliographically incorrect because:
1. The verbatim does not appear in *Bodily Arts*; it appears in the 2011 article at p. 154.
2. The 2011 article's central thesis (rhetorical vision via *energeia*-as-presence) explicitly reverses the *Bodily Arts* "antagonistic" framing of saying-vs-seeing.

See `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_synthesis/hawhee-correction-evidence.md` for full evidence file.

## 6. Cross-section sweep

Single occurrence in §1.1; no propagation to §§1.2–1.5 detected via direct search.
