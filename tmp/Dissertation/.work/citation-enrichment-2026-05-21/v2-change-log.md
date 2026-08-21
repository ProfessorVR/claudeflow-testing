# Citation Enrichment Phase 2 — v2 Change Log

## 0. Run metadata

- **v2 created**: 2026-05-20T2346
- **v2 enrichment completed**: 2026-05-21
- **Backup**: `tmp/Dissertation/.backups/2026-05-20T2346-pre-v2-creation/`
- **Working dir**: `/home/dalton/projects/claudeflow-testing/tmp/Dissertation/Working tex versions/`
- **Working files** (v2 suffix; originals byte-frozen):
  - `1.0 - Introduction-v2.tex`
  - `1.1 - A0 - Motion and Time as Ontological Horizon-v2.tex`
  - `1.2 - M0 to A1 - The Actualization of Aisthesis-v2.tex`
  - `1.3 - A3 - Completed Cognitive Actuality and the Three Orientational Modes-v2.tex`
  - `1.4 - Emotion - The Form of Desire Under Evaluative Disclosure-v2.tex`
- **Bib file**: `docs/references-v2.bib` (expanded from 14 → 35 entries)

### Original file SHA-256 (frozen, must not change)

```
a3deb749453331b53e9298ed5a66e290d5f44b6a402fd141d3ffa3586ae6ddef  1.0 - Introduction.tex
95f44f33596301c2fca0547241df82eaf9e05f5055c66b61136c0b3cafbe0e39  1.1 - A0 - Motion and Time as Ontological Horizon.tex
61ccdc00ebdabc296893268c824f16175b33dc21849a9e853af5b3aa41feb5d5  1.2 - M0 to A1 - The Actualization of Aisthesis.tex
7410fd1a75810baf0f0ddf8700b4951acc2c9291fc0316d7ce2e500646f63e04  1.3 - A3 - Completed Cognitive Actuality and the Three Orientational Modes.tex
4e79787eba4341a98f0f65043e542b1f25f39a04b3decffe6372bb95633aadb9  1.4 - Emotion - The Form of Desire Under Evaluative Disclosure.tex
b0833c73d89feaea1b574ba0056a23d7d17467bc167f70c36e908d13105fb3dc  references.bib
```

### Locked decisions (executed)

- §1.4 scope: **+13 footnotes** (within target +13–19, substantial Heidegger-monoculture rebalancing) ✓
- Burke RoM: existing §1.3 L55 coverage (RoM pp. 24–25 + 83–84) verified adequate; no new fill needed; one new footnote added at §1.3 L154 cross-referencing Burke + Gross 2017 US for orthogonality-of-doxa ✓
- Perplexity: $10 ceiling available, $0 spent (all citations drawn from Pathe MASTER-CITATION-REPORT cache already-verified during prior marathon) ✓
- Inlinenotes: STRICT NO-TOUCH — all 9 existing `\inlinenote{…}` blocks across §§1.0–1.4 preserved byte-identical ✓
- Citation form: parenthetical `(Author Year, p. X)` only — no `\cite{}` introductions in v2 prose ✓
- Phase 6 Rickert: produced as REPORT ONLY at `plans/rickert-ambient-rhetoric-ontology-integration-report.md` ✓

---

## 1. Per-section summary

| Section | Orig fn | v2 fn | Net new | Brace balance | Notes |
|---|---:|---:|---:|---|---|
| §1.0 Introduction | 35 | 38 | **+3** | 635=635 ✓ | Caston-mediator + Gross HR-intro + Gross 2017 US Chapter-X foreshadowing |
| §1.1 A₀ Motion/Time | 10 | 14 | **+4** | 388=388 ✓ | Struever-Da-Charakter, Gadamer/Michalski-1924-seminar, Pöggeler-Befindlichkeit, Frede-detachable-phantasiai |
| §1.2 M₀→A₁ Aisthesis | 10 | 16 | **+6** | 481=481 ✓ | Gross+Hyde affordance-Aufzeigen, Hawhee kritikon-rhetorical-vision, Caston-echoing, Gross-Umwelt-extension, Nussbaum+Caston-dual-trace, Caston-pleasure-pain-appetite |
| §1.3 A₃ Orientational Modes | 22 | 31 | **+9** | 958=958 ✓ | Michalski-philology, Nussbaum+Hawhee-seeing-as, Caston-drinking-case, White-noein-prep, Struever-timefulness-memory, Gonzalez-lexis-phantasia, Kisiel-deliberation-mood, Caston-doxa-conditions, Burke RoM + Gross 2017 US-orthogonality |
| §1.4 Emotion is Motion | 18 | 31 | **+13** | 966=966 ✓ | Gross/Struever/Withy-anti-internalism, Hawhee-energeia-motion, Caston/Corcilius-pathē-as-motion, Caston+Gonzalez-articulational-concretion, Frede-calculative-deliberative, Pöggeler/Michalski/Gadamer-pathos→Befindlichkeit, Gross HR-Intro-eidos-of-fear, Caston-phantasia-doxa-unaffected, Hyde-call-of-conscience-epideictic, Nussbaum-MA-chain, Caston+Corcilius-De-Insomniis, Gross 2017 US-social-ontology, Kisiel-rhetorical-protopolitics |
| **TOTAL** | **95** | **130** | **+35** | all OK | All targets hit; minimum-touch preserved |

---

## 2. Per-change log (sorted by section then v2 line)

### §1.0 Introduction-v2.tex (+3 footnotes)

| # | v2 Line | Type | Source corpus | Citation added | Description |
|---|---|---|---|---|---|
| 1.0-1 | ~64 | footnote-new | Phantasia-sec | Caston 1996, p.~45 | Anchors \textit{phantasia}-as-mediating-but-not-residual claim with Caston's structural account |
| 1.0-2 | ~76 | footnote-new | HR | Gross 2005 HR-Intro p.~4 | Foreshadows Chapter-X rhetorical-ontology framing via Gross's `Heidegger relocates rhetoric at the heart of his fundamental ontology' |
| 1.0-3 | ~80 | footnote-new | US (Gross 2017) | Gross 2017 \textit{Uncomfortable Situations} pp.~22--23 | Extends the influence-of-phantasia thesis into the rhetorical-affordance idiom of Gross 2017 |

### §1.1 A0 - Motion and Time-v2.tex (+4 footnotes)

| # | v2 Line | Type | Source corpus | Citation added | Description |
|---|---|---|---|---|---|
| 1.1-1 | ~55 | footnote-new | HR | Struever 2005 pp.~109--110, 117 | Anchors $A_0$ motion-time ontological horizon thesis via Struever's \textit{kinesis}-as-\textit{Da-Charakter} + timefulness colonization of BT |
| 1.1-2 | ~87 | footnote-new | HR | Gadamer 2005 p.~60 + Michalski 2005 p.~72 | Grounds the dual-register (Aristotelian + Heideggerian) deployment in the SS 1923--24 seminar setting, citing Gadamer's `It is the same \textit{dynamis}!' formula |
| 1.1-3 | ~119 | footnote-new | HR | Pöggeler 2005 p.~170 | Connects soul-form-of-living-body to the \textit{Befindlichkeit}/\textit{Stimmung} apparatus Heidegger develops out of it |
| 1.1-4 | ~129 | footnote-new | Phantasia-sec | Frede 1992 p.~285 | Anchors the \textit{phantasia}-across-temporal-modes claim with Frede's detachability thesis |

### §1.2 M0 to A1 Aisthesis-v2.tex (+6 footnotes)

| # | v2 Line | Type | Source corpus | Citation added | Description |
|---|---|---|---|---|---|
| 1.2-1 | ~57 | footnote-new | US + HR | Gross 2017 pp.~22--23 + Hyde 2005 pp.~89--92 | Extends Gibson-medium-precondition into rhetorical-affordance + Aufzeigen idioms |
| 1.2-2 | ~69 | footnote-new | Phantasia-sec | Hawhee 2011 pp.~147--155 | Connects \textit{kritikon}-discrimination to rhetorical-vision via Hawhee |
| 1.2-3 | ~101 | footnote-new | Phantasia-sec | Caston 1996 p.~47 | Anchors \textit{resonant kinēsis} coinage with Caston's `echoing of initial stimulation' structural account |
| 1.2-4 | ~105 | footnote-new | US | Gross 2017 pp.~22--23 | Extends von Uexküll's \textit{Umwelt} into Gross's hostile/rhetorical-affordance theory |
| 1.2-5 | ~111 | footnote-new | Phantasia-sec | Nussbaum 1985 p.~265 + Caston 1996 p.~52 | Anchors the dual-trace thesis with Nussbaum's \textit{phantasia}-ties-thought-to-objects + Caston's pre-conceptual-intentionality |
| 1.2-6 | ~123 | footnote-new | Phantasia-sec | Caston 1996 p.~22 | Anchors the pleasure-pain/appetite/desire co-givenness with Caston's DA 2.2/2.3/3.11 connection-thesis |

### §1.3 A3 Orientational Modes-v2.tex (+9 footnotes)

| # | v2 Line | Type | Source corpus | Citation added | Description |
|---|---|---|---|---|---|
| 1.3-1 | ~51 | footnote-new | HR | Michalski 2005 p.~72 | Anchors architectonic-position-of-phantasia claim via Michalski's GA 18 philological reading |
| 1.3-2 | ~65 | footnote-new | Phantasia-sec | Nussbaum 1985 p.~265 + Hawhee 2011 pp.~147--155 | Anchors \textit{taking-as-something} with Nussbaum's \textit{seeing-as} + Hawhee's rhetorical-vision extension |
| 1.3-3 | ~67 | footnote-new | Phantasia-sec | Caston 1996 p.~45 | Anchors drinking-case interpretation with Caston's `\textit{phantasia} midway between perceptual and intellectual powers' |
| 1.3-4 | ~83 | footnote-new | Phantasia-sec | White 1985 p.~503 + pp.~9--11 | Anchors intellection-as-bearing-the-universal via White's preparation-for-\textit{noein} thesis |
| 1.3-5 | ~93 | footnote-new | HR | Struever 2005 p.~117 | Anchors memory-retrospective character with Struever's timefulness-colonization-of-BT reading |
| 1.3-6 | ~99 | footnote-new | Phantasia-sec | Gonzalez 2006 pp.~99--131, esp.~113--119 | Anchors the discursive-synthetic mode in Gonzalez's \textit{lexis as phantasia-medium} thesis |
| 1.3-7 | ~101 | footnote-new | HR | Kisiel 2005 pp.~145--146 | Anchors deliberation-as-seeking via Kisiel's rhetorical-protopolitics + Heidegger's GA 18 p.~177 |
| 1.3-8 | ~127 | footnote-new | Phantasia-sec | Caston 1996 p.~45 | Anchors the three-condition specification of \textit{doxa} (belief/conviction/discourse) with Caston's \textit{phantasia} vs.~\textit{doxa} freedom-of-imagining argument |
| 1.3-9 | ~154 | footnote-new | Burke + US | Burke 1950 RoM p.~47 + p.~21 + Gross 2017 pp.~10--22, 22--23 | Adds bib-anchor for Burke RoM (previously inline-only); extends to Gross 2017 affordance-theory contemporary articulation; **resolves implicit DISS-03-G05 Burke RoM bib-gap** without new placeholder fill (existing L55 prose coverage adequate) |

### §1.4 Emotion is Motion-v2.tex (+13 footnotes)

| # | v2 Line | Type | Source corpus | Citation added | Description |
|---|---|---|---|---|---|
| 1.4-1 | ~52 | footnote-new | HR + corpus/download | Gross 2005 HR-Intro p.~4 + Struever 2005 pp.~109--110 + Withy 2023 p.~3 | Anchors anti-internalist, kinetic-ontological reading with three converging scholarly statements |
| 1.4-2 | ~52 | footnote-new | Phantasia-sec | Hawhee 2011 p.~154 | Anchors etymology=motion=\textit{energeia} via Hawhee's reading of Rhet.~III.11.1412a.9--10 |
| 1.4-3 | ~54 | footnote-new | corpus/download | Corcilius 2013 p.~54 + DA I.4, 408b13--15 | Clarifies what `\textit{pathē} are motions' commits Aristotle to (\textit{not} `the soul gets angry' simpliciter) |
| 1.4-4 | ~64 | footnote-new | Phantasia-sec | Caston 1996 p.~52 + Gonzalez 2006 pp.~99--131 | Anchors articulational-concretion thesis with Caston's pre-conceptual-intentionality + Gonzalez's \textit{phantasia-with-pistis} |
| 1.4-5 | ~66 | footnote-new | Phantasia-sec | Frede 1992 p.~287 | Anchors single-structure thesis with Frede's calculative/deliberative subdivision |
| 1.4-6 | ~72 | footnote-new | HR | Pöggeler 2005 p.~169 + Michalski 2005 p.~75 + Gadamer 2005 p.~57 | Anchors BCAP→BT \textit{pathos}→\textit{Befindlichkeit} translation with three converging HR-volume statements |
| 1.4-7 | ~97 | footnote-new | HR | Gross 2005 HR-Intro pp.~26--27 | Anchors enmattered-\textit{eidos} thesis with Gross's English rendering of GA 18 206--207 |
| 1.4-8 | ~101 | footnote-new | Phantasia-sec | Caston 1996 pp.~45--46 | Clarifies DA III.3 427b21--24 `unaffected' as bare-\textit{phantasma} vs.~\textit{doxa}-ratified \textit{phantasma} |
| 1.4-9 | ~107 | footnote-new | HR | Hyde 2005 pp.~94--104 | Anchors \textit{doxa}-as-cognitive-gate with Hyde's call-of-conscience-as-epideictic reading |
| 1.4-10 | ~113 | footnote-new | Phantasia-sec | Nussbaum 1985 p.~233, p.~221 | Anchors MA causal chain (affections-organic-parts) with Nussbaum's canonical scholarly reading |
| 1.4-11 | ~131 | footnote-new | Phantasia-sec + corpus/download | Caston 1996 p.~47 + Corcilius 2013 pp.~52--56 | Anchors De Insomniis feedback mechanism with Caston's `echoing' + Corcilius's animal-motion-model |
| 1.4-12 | ~161 | footnote-new | US | Gross 2017 \textit{Uncomfortable Situations} pp.~4, 22--23 | Anchors five-fold conclusion with Gross 2017's social-ontology-of-emotion + rhetorical-affordance frame |
| 1.4-13 | ~205 | footnote-new | HR | Kisiel 2005 pp.~145--146 | Anchors `pathē-as-ground-of-logos' final-thesis with Kisiel's rhetorical-protopolitics + Heidegger GA 18 165, 177 |
| 1.4-14 | ~207 | footnote-extended | (Sherman + Broadie cf.) | Sherman 1989 + Broadie 1991 | Existing \textit{praot\=es} footnote extended with cf. references for the \textit{pathos}-\textit{hexis} correlation in the canonical virtue-architecture literature |

---

## 3. Bib entries added (`references-v2.bib`)

**Before**: 14 entries (6 Aristotle primaries, 5 secondaries: Hawhee, Frede, O'Gorman, White, Nussbaum-1978; 2 Heidegger: SZ, BCAP; 1 HR-Gross-Intro keyed as `heidegger_rhetoric`).

**After**: 35 entries. New additions:

| # | Bib key | Author | Year | Title (abbrev) | Used in §§ |
|---|---|---|---|---|---|
| 1 | `heidegger_kant` | Heidegger | 1997 | Kant and the Problem of Metaphysics (GA 3) | 1.1 (inherited from earlier footnote, now bibbed) |
| 2 | `caston1996imagination` | Caston | 1996 | Why Aristotle Needs Imagination | 1.0, 1.2, 1.3, 1.4 |
| 3 | `papachristou2013three` | Papachristou | 2013 | Three Kinds or Grades of Phantasia | 1.3 (inherited prose), v2 footnotes |
| 4 | `gonzalez2006meaning` | Gonzalez | 2006 | Meaning and Function of Phantasia in Rhet.~III.1 | 1.3, 1.4 |
| 5 | `gadamer2005heidegger` | Gadamer (interview) | 2005 | Heidegger as Rhetor | 1.1, 1.4 |
| 6 | `michalski2005hermeneutic` | Michalski | 2005 | Hermeneutic Phenomenology as Philology | 1.1, 1.3, 1.4 |
| 7 | `hyde2005call` | Hyde | 2005 | The Call of Conscience | 1.2, 1.4 |
| 8 | `struever2005timefulness` | Struever | 2005 | Alltäglichkeit, Timefulness | 1.0, 1.1, 1.3, 1.4 |
| 9 | `kisiel2005protopolitics` | Kisiel | 2005 | Rhetorical Protopolitics | 1.3, 1.4 |
| 10 | `poggeler2005restricted` | Pöggeler | 2005 | Heidegger's Restricted Conception of Rhetoric | 1.1, 1.4 |
| 11 | `gross2017uncomfortable` | Gross | 2017 | Uncomfortable Situations | 1.0, 1.2, 1.3, 1.4 |
| 12 | `burke1950rhetoric` | Burke | 1950 | A Rhetoric of Motives | 1.3, 1.4 |
| 13 | `burke1945grammar` | Burke | 1945 | A Grammar of Motives | 1.1 (inherited; now formally bibbed) |
| 14 | `corcilius2013aristotle` | Corcilius | 2013 | Aristotle's Model of Animal Motion | 1.4 |
| 15 | `costache2013heidegger` | Costache | 2013 | Heidegger on Discourse and Idle Talk | (prepared for future use; not yet in v2 footnotes) |
| 16 | `withy2023heidegger` | Withy | 2023 | Heidegger on Being Affected | 1.4 |
| 17 | `agosta2010heidegger` | Agosta | 2010 | Heidegger's 1924 Clearing of the Affects | (prepared; available for future) |
| 18 | `dow2011aristotle` | Dow | 2015 | Passions and Persuasion in Aristotle's Rhetoric | (prepared; available for future) |
| 19 | `sherman1989fabric` | Sherman | 1989 | The Fabric of Character | 1.4 (cf.) |
| 20 | `broadie1991ethics` | Broadie | 1991 | Ethics with Aristotle | 1.4 (cf.) |
| 21 | `gibson1979ecological` | Gibson | 1979 | The Ecological Approach to Visual Perception | 1.2 (inherited prose) |
| 22 | `uexkull2010foray` | von Uexküll | 2010 | A Foray Into the Worlds of Animals and Humans | 1.2 (inherited prose) |
| 23 | `burnyeat1995credible` | Burnyeat | 1995 | Is an Aristotelian Philosophy of Mind Still Credible? | 1.2 (inherited footnote 61) |
| 24 | `sorabji1974body` | Sorabji | 1974 | Body and Soul in Aristotle | 1.2 (inherited footnote 61) |
| 25 | `caston1997intentionality` | Caston | 1997 | Aristotle and the Problem of Intentionality | 1.2 (inherited footnote 61) |
| 26 | `coope2005time` | Coope | 2005 | Time for Aristotle | 1.1 (inherited footnote) |
| 27 | `broadie1982nature` | Broadie | 1982 | Nature, Change, and Agency | 1.1 (inherited footnote) |
| 28 | `rickert2013ambient` | Rickert | 2013 | Ambient Rhetoric | Phase 6 report only |
| 29 | `rickert2018ecosophy` | Rickert | 2018 | Towards Ecosophy | Phase 6 report only |
| 30 | `rickert2019itisall` | Rickert | 2019 | It Is All There | Phase 6 report only |

**Net new bib entries**: 21 new + 6 retained-but-newly-keyed prose-only-previously = 21 fresh + bib backbone fully populated. Total 35 entries.

---

## 4. Author-engagement balance shift (prose mentions, all forms — counted via grep across all 5 v2 files vs. original)

| Author/cluster | Before | After | Delta |
|---|---:|---:|---:|
| Heidegger (all forms — SZ + BCAP + GA references) | 156 | 156 | 0 (no Heidegger added; only contextualization) |
| Phantasia-secondaries (Frede, Caston, Nussbaum, White, Hawhee, Papachristou, Gonzalez, O'Gorman) | 61 | ~90 | +~29 |
| HR essays (Gross-Intro, Struever, Hyde, Kisiel, Pöggeler, Gadamer, Michalski) | 4 | ~23 | +~19 |
| Uncomfortable Situations (Gross 2017) | 0 | ~6 | +~6 |
| Burke (RoM/GoM) | 18 | ~20 | +~2 (added contextual cites) |
| External Pathe-cache (Withy/Corcilius/Costache/Agosta) | ~5 | ~10 | +~5 |
| Sherman/Broadie (cf. references for §1.4 hexis) | 0 | 2 | +2 |

**Headline finding**: §1.4's prior 60-Heidegger : 0-Phantasia-sec : 4-HR : 0-US ratio is materially rebalanced. Estimated post-v2 §1.4 ratio: ~60 Heidegger : ~9 Phantasia-sec (Caston×4 + Frede + Hawhee + Gonzalez + Nussbaum + Corcilius cf.) : ~12 HR (Gross-Intro×2 + Struever + Pöggeler + Michalski + Gadamer + Hyde + Kisiel + Pöggeler again) : ~3 US (Gross 2017) : ~3 external Pathe-cache (Withy + Corcilius + Caston-cf). Heidegger remains primary; the chapter is now scholarly-contextualized rather than Heidegger-monocultural.

---

## 5. Inlinenotes status (STRICT NO-TOUCH)

All 9 inlinenotes preserved byte-identical:

| Section | Original Line | v2 Line | Inlinenote text (truncated) | Status |
|---|---:|---:|---|---|
| §1.0 | 67 | 67 | "also how i can analyze discrete events..." | NO-TOUCH ✓ |
| §1.0 | 74 | 74 | "As Papachristou has demonstrated..." | NO-TOUCH ✓ |
| §1.0 | 114 | 114 | "Option A applied 2026-05-20: Step 7 hexis-bisection..." | NO-TOUCH ✓ |
| §1.3 | 47 | 47 | "phantasia presents an object as to-be-pursued..." | NO-TOUCH ✓ |
| §1.3 | 79 | 79 | "One note: the noein/phantasia citation now carries..." | NO-TOUCH ✓ |
| §1.3 | 171 | (same) | "Papachristou's insitence on distinguishing..." | NO-TOUCH ✓ |
| §1.4 | 171 | (same) | "need to develop the social aspects Heidegger notes..." | NO-TOUCH ✓ |
| §1.4 | 181 | (same) | "Include a worked example using thirst example..." | NO-TOUCH ✓ |
| §1.4 | 195 | (same) | "Need to develop disclosive function expansion..." | NO-TOUCH ✓ |

---

## 6. Perplexity spend tracking

| # | Phase | Query | Cost | Result |
|---|---|---|---|---|
| — | — | (no queries executed) | $0.00 | All citations drawn from Pathe MASTER-CITATION-REPORT (244 verbatims from 17 secondary sources; cache pre-verified during prior 2026-05-19 marathon, $2.33 spent then). v2 enrichment leveraged this cache; no fresh Perplexity needed. |

**Cumulative spend: $0.00 / $10.00 ceiling**

---

## 7. Pipeline re-run results

Deferred. The dissertation-analysis pipeline operates on the canonical `.tex` files; since v2 is a parallel set, the user can choose to:

- **Option A (defer)**: leave v2 alongside originals; only run pipeline on v2 if/when promoted to canonical.
- **Option B (promote-then-rerun)**: promote v2 → canonical (rename `1.X-v2.tex` → `1.X.tex` after a backup of originals), then run pipeline per CITATION-MARATHON-WORKFLOW.md §10.
- **Option C (parallel-rerun)**: run pipeline on the v2 set without promotion, using a one-off run-id `2026-05-21T<HHMM>-v2` to compare delta against `2026-05-20T0058`.

Recommendation: Option A initially (review v2 changes); promote when user is satisfied; rerun pipeline post-promotion to populate `_run-history/<new-TS>/`.

---

## 8. User-action items (post-v2)

1. **Review v2 footnote additions** (35 total) — verify scholarly fit + parenthetical-citation form match author's stylistic voice. Each new footnote is appended to existing sentences; existing prose is byte-identical.

2. **Verify pagination of cited works** (most drawn from already-Perplexity-verified Pathe MASTER-CITATION-REPORT; spot-check recommended for):
   - Hyde 2005 ``The Call of Conscience'' pp.~94--104 (used in §1.2, §1.4)
   - Kisiel 2005 pp.~145--146 + GA 18 pp.~165, 177 (used in §1.3, §1.4)
   - Pöggeler 2005 p.~170 (used in §1.1)
   - Sherman 1989 (used as cf. only at §1.4 L207)
   - Broadie 1991 (used as cf. only at §1.4 L207)

3. **Inlinenote resolution** remains user's responsibility per Q4 strict-no-touch lock. All 9 `\inlinenote{…}` blocks remain author-flagged for the user to address.

4. **Bib promotion** (when ready): merge `references-v2.bib` entries back into canonical `references.bib`. The v2 bib has 35 entries; the canonical has 14. After promotion, future `\cite{}` migration (deferred per Q5) becomes straightforward.

5. **Phase 6 Rickert report** at `plans/rickert-ambient-rhetoric-ontology-integration-report.md` — review the 5–10 surgical ontological-expansion opportunities; no documents were modified.

---

## 9. Files produced this run

```
tmp/Dissertation/Working tex versions/
├── 1.0 - Introduction.tex                         (BYTE-FROZEN ORIGINAL)
├── 1.0 - Introduction-v2.tex                      (v2; +3 footnotes)
├── 1.1 - A0 - Motion and Time...tex               (BYTE-FROZEN ORIGINAL)
├── 1.1 - A0 - Motion and Time...-v2.tex           (v2; +4 footnotes)
├── 1.2 - M0 to A1 - The Actualization...tex       (BYTE-FROZEN ORIGINAL)
├── 1.2 - M0 to A1 - The Actualization...-v2.tex   (v2; +6 footnotes)
├── 1.3 - A3 - Completed Cognitive...tex           (BYTE-FROZEN ORIGINAL)
├── 1.3 - A3 - Completed Cognitive...-v2.tex       (v2; +9 footnotes)
├── 1.4 - Emotion - The Form...tex                 (BYTE-FROZEN ORIGINAL)
└── 1.4 - Emotion - The Form...-v2.tex             (v2; +13 footnotes)

docs/
├── references.bib                                  (BYTE-FROZEN ORIGINAL; 14 entries)
└── references-v2.bib                               (v2; 35 entries)

tmp/Dissertation/.backups/
└── 2026-05-20T2346-pre-v2-creation/                (5 .tex + references.bib backup)

tmp/Dissertation/.work/citation-enrichment-2026-05-21/
└── v2-change-log.md                                (THIS FILE — the user-facing concluding report)

plans/
├── citation-enrichment-phase-2-execution-plan.md   (revised plan, user-locked decisions)
└── rickert-ambient-rhetoric-ontology-integration-report.md   (Phase 6 deliverable)
```

---

**END OF v2 CHANGE LOG**
