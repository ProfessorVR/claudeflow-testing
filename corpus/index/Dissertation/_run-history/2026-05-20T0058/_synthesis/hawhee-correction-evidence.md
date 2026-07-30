# Hawhee Book-Title Citation Correction — Evidence and Patch

**Run-id**: `2026-05-13T1439`
**Agent**: Phase 4 Agent 1 (Tier A + Critical Corrections)
**Source unit (authoritative)**: `/home/dalton/projects/claudeflow-testing/corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Hawhee - Rhetorical Vision (2011)/phx-07-hawhee.md` and `phx-07-hawhee.json`
**Inconsistency reference**: INCONS-003 (CRITICAL, citational, edge_type = cites-but-misreads)
**Affected dissertation file**: `/home/dalton/projects/claudeflow-testing/tmp/Dissertation/1.1 - A0 - Motion and Time/1.1 - A0 - Motion and Time.md` line 19 (and `1.1_A0_Motion_and_Time_OUTPUT_v2.tex` line 21)

---

## 1. Verdict (top-line)

**CONFIRMED**. The Phase 3 hypothesis is correct: the verbatim "*energeia* means the presence of the thing" attributed in §1.1 to **Hawhee, *Bodily Arts*, p.~154** is in fact from the Hawhee 2011 article "Looking Into Aristotle's Eyes: Toward a Theory of Rhetorical Vision," published in *Advances in the History of Rhetoric* 14.2 (2011): 139–165, with the verbatim landing at **article p. 154**.

The page-number coincidence (both works contain a p. 154) is what makes the slip plausible. The corpus-index unit for *Bodily Arts of Rhetoric* (Hawhee 2004, Texas) is not in the present run's corpus/index, but the 2011 essay is in the corpus/index Phantasia cluster as `PHX-07`, and the verbatim is anchored there.

---

## 2. Evidence from `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Hawhee - Rhetorical Vision (2011)/phx-07-hawhee.md`

### 2.1 Unit identification

- **Full citation**: Debra Hawhee, "Looking Into Aristotle's Eyes: Toward a Theory of Rhetorical Vision," *Advances in the History of Rhetoric* 14.2 (2011): 139–165. DOI: 10.1080/15362426.2011.613288.
- **Unit ID**: PHX-07.
- **Bekker locus anchored for the "presence of the thing" formula**: *Metaph.* 9.5.1048a.32–34 (cited explicitly by Hawhee at article p. 154 as the metaphysical anchor for the *energeia*-as-presence formula she uses to gloss *Rhetoric* III.11).

### 2.2 Verbatim from the corpus/index narrative (`phx-07-hawhee.md`)

The lexical analysis on p. 154 of the article is the chapter-anchor for §1.1's Hawhee citation:

> She closes the lexical analysis by anchoring *energeia* in *Metaphysics* 9.5.1048a.32–34: **"Energeia means the presence of the thing."** The conclusion of the section makes *lexis* the lifeblood of rhetorical vision: bringing-before-the-eyes and *energeia* are the leading stylistic strategies for tapping *phantasia* and stirring the *pathē*.
> — `phx-07-hawhee.md` § "*Phantasia* in *Rhetoric* Book III — *pro ommatōn poiein*, metaphor, *megethos*, *energeia*" (the narrative paragraph that anchors article p. 154's lexical closing-paragraph, with the *Metaph.* IX.5 cross-reference embedded).

The exact phrase "Energeia means the presence of the thing" is reproduced inside the corpus/index narrative as a quotation from Hawhee 2011 p. 154 (anchored by the corpus-index unit to *Metaph.* IX.5.1048a32–34). The corpus/index unit therefore confirms the verbatim is located in **Hawhee 2011 (the article) at p. 154**, not in Hawhee 2004 (*Bodily Arts*).

### 2.3 Hawhee 2004 *Bodily Arts* is referenced only once in the unit

In the corpus/index narrative on `phx-07-hawhee.md`, Hawhee 2004 (*Bodily Arts*) is cited only as a back-reference in Hawhee's own Note 18 (the antagonistic-relationship-between-saying-and-seeing claim). The 2011 article *explicitly reverses* the *Bodily Arts* position to argue that saying and seeing also work *in tandem*. *Bodily Arts*' content is therefore methodologically *incompatible* with the role the §1.1 citation has it playing — supporting the *energeia*-as-presence formula. The citation cannot survive on a "different work, similar content" defense.

---

## 3. The §1.1 instance to be corrected

### Current text (verbatim, §1.1 .md line 19 / .tex line 21)

> The peculiar ontological texture of motion follows from this asymmetry. Motion is the kind of actuality that is at once genuinely present --- the builder is at work, the house is rising --- and incomplete in respect of what it is becoming. **Hawhee observes of this register that \textit{energeia} ``names something like physical presence: \textit{energeia} means the presence of the thing'' (Hawhee, \textit{Bodily Arts}, p.~154).** If \textit{energeia} names the presence of the thing, then \textit{kinēsis} as \textit{energeia ateles} names a peculiar mode of presence: the presence of something that is not yet fully what it is becoming.

### Patch (Edit-ready)

Two correct forms are acceptable, depending on the dissertation's bibliographic style for journal articles vs. monographs:

**Option A — article form**:

```latex
OLD:
(Hawhee, \textit{Bodily Arts}, p.~154)

NEW:
(Hawhee, ``Looking Into Aristotle's Eyes,'' p.~154)
```

**Option B — short-title-by-substantive-keyword form, paralleling the *Bodily Arts* shortening that the original used**:

```latex
OLD:
(Hawhee, \textit{Bodily Arts}, p.~154)

NEW:
(Hawhee, ``Rhetorical Vision,'' p.~154)
```

**RECOMMENDED**: Option B, since the dissertation already uses italicized short-titles for monographs (e.g., Burke, *Grammar*); for an article, using quoted-short-title preserves the same compression. Bibliographic entry on the dissertation's References list should read in full:

> Hawhee, Debra. "Looking Into Aristotle's Eyes: Toward a Theory of Rhetorical Vision." *Advances in the History of Rhetoric* 14, no. 2 (2011): 139–165.

### Patch also for PROMPT.md (if Hawhee is referenced there)

A sweep of `1.1_A0_Motion_and_Time_PROMPT.md` for the string `Bodily Arts` should be performed in Phase 5 alongside the Burke-pp.280–281 sweep. (Phase 4 Agent 1 has not independently verified the PROMPT-template state; the sweep is flagged for the revision-roadmap.)

---

## 4. Verbatim verification — full sentence in context

The full sentence as it appears in §1.1 of the dissertation reads (in part):

> *energeia* "names something like physical presence: *energeia* means the presence of the thing"

The corpus/index narrative on Hawhee 2011 p. 154 contains the exact substring **"Energeia means the presence of the thing"** (initial-capitalized in the corpus-index quotation form, but representing the same lexical content). The compound phrase "names something like physical presence" is a paraphrasing prefix supplied by the dissertation's author rather than a Hawhee verbatim; this is consistent with the corpus-index narrative's contextualization of the formula as Hawhee's metaphysical-presence reading.

**Verbatim integrity**: the inner quoted clause survives intact; only the bibliographic anchor is wrong. The fix is to change the book-title-and-page reference, not the quoted content.

---

## 5. Cross-section sweep

No other §§1.2 / 1.3 / 1.4 / 1.5 occurrence of "Hawhee, *Bodily Arts*" surfaces in the dissertation source files. The misattribution is **contained to §1.1, single occurrence**, and the fix is trivial-effort.

---

## 6. Bibliographic note for the dissertation's References list

When the bibliography is rebuilt, the entry should distinguish:

| Hawhee work | Use-case in dissertation | Anchor citation form |
|---|---|---|
| Hawhee 2011, "Looking Into Aristotle's Eyes" (article) | *energeia*-as-presence; *phantasia*-as-rhetorical-vision; *pro ommatōn poiein* lexical analysis; deliberative *phantasia* | Hawhee, "Rhetorical Vision" (or full short-title), p. 154 |
| Hawhee 2004, *Bodily Arts of Rhetoric* (monograph) | NOT currently cited in §1.1; may be referenced elsewhere for athletics/agonistic rhetoric or "antagonistic relationship between saying and seeing" | Hawhee, *Bodily Arts* (italic) + monograph page |

---

## 7. Confidence and provenance summary

- **Phase 3 hypothesis (Hawhee book-title misattribution)**: **CONFIRMED**.
- **Provenance for the verbatim location**: corpus/index unit `PHX-07: Hawhee — Rhetorical Vision (2011)` deep-narrative `phx-07-hawhee.md` § "Phantasia in Rhetoric Book III"; *Metaph.* IX.5.1048a32–34 cross-anchor confirmed in the unit's `phx-07-hawhee.json` Bekker locus map.
- **Risk of remaining ambiguity**: minimal. The "Energeia means the presence of the thing" formula is the *signature* lexical anchor of Hawhee's 2011 article; its function in §1.1 (specifying the ontological texture of motion as a mode of presence) exactly matches the rhetorical-vision-as-presence thesis of the 2011 article.
- **Recommended canonical citation form**: `(Hawhee, "Rhetorical Vision," p.~154)` for first occurrence; subsequent occurrences (if any) may use `(Hawhee 2011, p.~154)`.
