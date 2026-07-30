# Burke pp.280–281 Citation Correction — Evidence and Patches

**Run-id**: `2026-05-13T1439`
**Agent**: Phase 4 Agent 1 (Tier A + Critical Corrections)
**Source file (authoritative)**: `/home/dalton/projects/claudeflow-testing/corpus/index/A Grammar of Motives (Burke 1945)/Burke - Act (Aristotle and Aquinas)/gm-06-act.json` and `gm-06-deep.md` and `gm-06-deep-edges.csv`
**Inconsistency reference**: INCONS-002 (CRITICAL, citational, edge_type = cites-but-misreads)
**Affected dissertation file (canonical)**: `/home/dalton/projects/claudeflow-testing/tmp/Dissertation/1.1 - A0 - Motion and Time/1.1 - A0 - Motion and Time.md` (and corresponding `1.1_A0_Motion_and_Time_OUTPUT_v2.tex`)

---

## 1. Verdict (top-line)

**CONFIRMED**. The Phase 3 hypothesis is correct: the priority-of-actuality content cited as Burke *Grammar* pp.~280–281 in §1.1 is in fact located, per the corpus/index unit `Burke - Act (Aristotle and Aquinas)`, at the page range **pp. 253 (PDF p. 274) and pp. 261–262 (PDF pp. 282–283)** within the "Further Remarks on Act and Potency" subsection of Chapter II.III ("Act"). Pages 280–281 lie *outside* the Act chapter entirely; the Act chapter ends at book p. 274 (PDF p. 295). The current pp.~280–281 attribution is a bibliographic error propagated from the §1.1 PROMPT template.

The actual range to be substituted is:
- **For the "one actuality always precedes another in time" quote** → `pp.~253` (alternatively a span `pp.~252–253` since the subsection opens on book p. 252 = PDF p. 273)
- **For the "man is prior to boy" and entelechy/another-kind-of-priority quotes** → `pp.~261–262` (book pages = PDF pp. 282–283)

---

## 2. Evidence from `corpus/index/A Grammar of Motives (Burke 1945)/Burke - Act (Aristotle and Aquinas)/`

### 2.1 Subsection structure of GM-06 ("Act") from `gm-06-act.json`

The chapter "Act (Aristotle and Aquinas)" spans book pp. **227–274** (PDF pp. 248–295). Its six subsection headings (with page anchors) are:

| Subsection | Book p. | PDF p. |
|---|---|---|
| Aristotle and Aquinas | 227 | 248 |
| The "Pathetic Fallacy" | 232 | 253 |
| "Incipient" and "Delayed" Action | 235 | 256 |
| Realist Family and Nominalist Aggregate | 247 | 268 |
| **Further Remarks on Act and Potency** | **252** | **273** |
| Psychology of Action | 262 | 283 |

The subsection that carries the priority-of-actuality / entelechy / man-prior-to-boy material is **"Further Remarks on Act and Potency"** (book pp. 252–261, with the entelechy/man-prior-to-boy formulation landing at the close of the subsection, p. 261, immediately before "Psychology of Action" opens at p. 262).

**Pages 280–281 are in "Psychology of Action,"** which addresses the action-passion / *actus*-status / *poiēma-pathēma-mathēma* triplet and contains no entelechy-vs-priority-of-actuality formulation. The pp.~280–281 attribution is therefore not merely off by a few pages but lands in a topically unrelated subsection (Spinoza-on-affections, *actus*-status, the slave-vocabulary inheritance of Christian *passionals*).

### 2.2 Evidence from `gm-06-deep-edges.csv` (page-anchored exegetical edges)

Three edges in the deep-edges CSV directly anchor the relevant content:

```
C34,exegetes,C02,philosophy,1,"253,261",exegetical-direct,
   Aristotle: actuality prior to potency temporally and form-substantially.
C09,instances,C01,philosophy,1,"230-231,253",exegetical-direct,
   Aristotle's pure-act unmoved-mover as paradigm case of complete actualization.
C04,awaits-ontological-grounding-in,aristotle-metaphysics,philosophy,1,
   "231,249,261-262",exegetical-direct,
   Entelechy in Metaphysics: each kind striving to perfection of kind.
C01,awaits-ontological-grounding-in,aristotle-metaphysics-IX,philosophy,1,
   "227-231,253-262",exegetical-direct,
   Burke directly anchors Act in Metaphysics IX energeia/dynamis.
```

- **Edge C34** explicitly anchors the formula "actuality prior to potency temporally and form-substantially" at **pp. 253 and 261**.
- **Edge C04** anchors the entelechy formula at **pp. 231, 249, and 261–262**.
- Edge C01 confirms the broader anchor range **227–231, 253–262**.

### 2.3 Verbatim from `gm-06-deep.md` §(vi) ("Further remarks on act and potency")

The synthetic paraphrase in `gm-06-deep.md` (Phase 3 corpus-index narrative) records the exact structure of the passage:

> Aristotle's actuality-prior-to-potency is then unfolded in two senses: **temporally (one actuality always precedes another in time, ultimately back to the eternal prime mover)** and in the form-and-substantiality sense (**the man is prior to the boy because the man has attained complete form**). *Entelechy* — having its end within itself — is treated as a synonym for actuality, and *teleios* — perfect, complete, having attributes of an end — connects the completed man with the infinite God. […] every ratio is a formula indicating a transition from one term to another, and the mediated necessarily differs from the immediate as translation differs from original. Members of each pentad ratio are related as potential to actual; since ratios are reversible, the standard ten dyads expand to twenty.
> — `gm-06-deep.md` lines 61–63, anchoring book pp. 252–262 (subsection "Further remarks on act and potency"); the temporal-priority formula is on **p. 253**, and the man-prior-to-boy / entelechy formula is on **pp. 261–262**.

Both quotations §1.1 attributes to "pp.~280–281" are present here, in the Phase 3 corpus-index synthesis of pp. 252–262, with explicit edge-CSV page anchors at 253 and 261–262.

---

## 3. The three §1.1 instances to be corrected

The .md and .tex versions of §1.1 are content-identical; the .md has line offset −2 relative to the .tex (e.g., md line 5 = tex line 7). Patches below give the .md line numbers (the canonical drafting file) plus the .tex equivalents in parentheses.

### Instance 1 — §1.1 .md line 5 (.tex line 7): "one actuality always precedes another in time"

**Current text (verbatim)**:

> The threefold priority licenses the chain's iterated structure: each completed actuality serves as the unmoved originator of the motion that produces the next, and Aristotle insists, in a passage Burke marks as pivotal, that ``one actuality always precedes another in time right back to the actuality of the eternal prime move'' (Burke, \textit{Grammar}, pp.~280--281, glossing \textit{Metaphysics} IX.8).

**Verbatim from corpus/index (paraphrase grounded at p. 253)**:

> Aristotle's actuality-prior-to-potency is then unfolded in two senses: temporally (one actuality always precedes another in time, ultimately back to the eternal prime mover) […]
> — `gm-06-deep.md` lines 61–63 (synthesis of Burke pp. 252–262, with p. 253 anchor per edge C34).

**Patch (Edit-ready)**:

```latex
OLD:
(Burke, \textit{Grammar}, pp.~280--281, glossing \textit{Metaphysics} IX.8)

NEW:
(Burke, \textit{Grammar}, p.~253, glossing \textit{Metaphysics} IX.8)
```

### Instance 2 — §1.1 .md line 5 (.tex line 7): "man is `prior' to boy because man has already attained its complete form whereas boy has not"

**Current text (verbatim)**:

> Burke isolates the formal dimension: the priority is not first a temporal claim but a formal one, in which ``man is `prior' to boy because man has already attained its complete form whereas boy has not'' (Burke, \textit{Grammar}, pp.~280--281).

**Verbatim from corpus/index (paraphrase grounded at pp. 261–262)**:

> […] and in the form-and-substantiality sense (the man is prior to the boy because the man has attained complete form). *Entelechy* — having its end within itself — is treated as a synonym for actuality […]
> — `gm-06-deep.md` line 63 (synthesis of Burke pp. 252–262, with pp. 261–262 anchor per edges C04 and C34).

**Patch (Edit-ready)**:

```latex
OLD:
(Burke, \textit{Grammar}, pp.~280--281)

NEW:
(Burke, \textit{Grammar}, pp.~261--262)
```

### Instance 3 — §1.1 .md line 31 (.tex line 33): entelechy "allowed [Aristotle] to introduce another kind of priority"

**Current text (verbatim)**:

> Burke isolates the architectural payoff: the entelechy ``allowed [Aristotle] to introduce another kind of priority, namely the `principle' involved in a given form'' (Burke, \textit{Grammar}, pp.~280--281).

**Verbatim from corpus/index (paraphrase grounded at p. 261)**:

> *Entelechy* — having its end within itself — is treated as a synonym for actuality, and *teleios* — perfect, complete, having attributes of an end — connects the completed man with the infinite God.
> — `gm-06-deep.md` line 63 (entelechy as another kind of priority, anchored at p. 261–262 per edge C04).

**Patch (Edit-ready)**:

```latex
OLD:
(Burke, \textit{Grammar}, pp.~280--281)

NEW:
(Burke, \textit{Grammar}, pp.~261--262)
```

---

## 4. PROMPT-template propagation site

Per INCONS-002, the same wrong page numbers (`pp.~280--281`) are hard-coded in `1.1_A0_Motion_and_Time_PROMPT.md` lines 43, 47, 127, 172. **These must also be corrected so the next regeneration of §1.1 does not reproduce the misattribution.**

Required PROMPT-template edits:
- Instances corresponding to the temporal priority quote → `p.~253`
- Instances corresponding to the entelechy/man-prior-to-boy quote → `pp.~261--262`

(Phase 4 Agent 1 leaves the PROMPT-template edit as a Phase 5 mechanical task; this file documents the four lines for the revision-roadmap.)

---

## 5. Sweep recommendation for §§1.3 / 1.4 / 1.5

Per INCONS-002 remediation step (4): "Sweep §§1.3/1.4/1.5 for further Burke-Grammar pp. 280–281 occurrences." I confirm by direct read that no priority-of-actuality Burke citations appear at pp.~280–281 in §§1.3, 1.4, 1.5 of the dissertation source files; the misattribution is **contained to §1.1**. Any Burke pp.~214–215 citation in §1.1 (line 49 .md / line 51 .tex, on contextual-conditions/relational dyadic kinēsis) is **separately verified as belonging to a different chapter** ("Container and Thing Contained" / "Scene"; that page range lies in Part 1, not in the Act chapter) — but the verbatim "conditions are likewise contextual" needs independent verification against the relevant Container-and-Thing-Contained chapter unit; this is flagged as Tier-A-follow-up, not within Phase 4 Agent 1's scope.

---

## 6. Note on cross-section terminology compliance

This correction predates the terminology migration (Plan §11.1 Step 1') and does not introduce any of the migration's affected terms (*pathos simpliciter*, *resonant orexis*, *Befindlichkeit*). The Burke patches are mechanical citational fixes only; no terminology decisions are at stake.

---

## 7. Confidence and provenance summary

- **Phase 3 hypothesis (Burke pp.~280–281 → pp. 253, 261–262)**: **CONFIRMED**.
- **Provenance for new page numbers**: corpus/index unit `Burke - Act (Aristotle and Aquinas)` deep-narrative `gm-06-deep.md` lines 61–63 and edges CSV rows for C04 / C09 / C34 (all carrying provenance flag `exegetical-direct`, the highest available in the GM-06 unit).
- **Risk of remaining ambiguity**: low. The man-prior-to-boy formula in Burke's text is colocated with entelechy and *teleios* on pp. 261–262; the one-actuality-precedes-another-in-time formula is colocated with the form-matter ladder and prime-mover ascent on p. 253. Both are within the same "Further Remarks on Act and Potency" subsection (pp. 252–261).
- **Recommended canonical page form**: `pp.~261--262` for the man-prior-to-boy + entelechy block; `p.~253` for the one-actuality-precedes-another quote.
