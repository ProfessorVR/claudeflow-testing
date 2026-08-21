# HANDOFF — Part III Laboratory Boredom section: Stage 2 COMPLETE, Stage 3 drafting not started (2026-08-05)

**Supersedes `HANDOFF-LAB-BOREDOM-V4-COMPLETE-2026-08-04.md`**, which remains accurate for the analysis history
and the four-tree version chain. Read this one for state.

**Status in one line: the analyses are finished through v4, the outline is finished at v5, every module has been
walked and ruled, four open decisions remain and none blocks drafting, and not one word of prose exists.**

---

## 0. THE THREE REQUIREMENTS THAT GOVERN THE NEXT SESSION

### 0.1 Drafting runs under the FCDP protocol — no exceptions

`plans/fable-console-drafting-protocol-v2.md` is the drafting method of record. Every prose-generating and
prose-judging step runs on **Fable 5 at xhigh effort**; the author switches the model personally and **must be
notified before drafting begins**. Judge passes are separate calls with lean contexts — the draft, the rubric, and
only what the rubric needs — never the full drafting conversation.

Pipeline, per module: **P** (pack assembly, HEAD/MIDDLE/TAIL, saved to `plans/packs/`) → **D1** (movement plan
plus numeric style targets, author approval default ON) → **D1.5** (skeleton: nucleus/satellite plus
counterargument pass, still no prose) → **D2** (drafting with `«Qnn»` quote markers) →
`scripts/substitute-quote-ids.py` (exit 0 required) → **G**, the seven-gate gauntlet (G-A Lanham, G-B quote
fidelity, G-C citation rigor, G-D terminology locks, G-E foundation fidelity [judge], G-F degradation checklist,
G-G consistency [judge]) → **R** (targeted revision, re-gauntlet, ≤3 cycles) → author review with diff and
provenance log. **No commit.**

**FCDP invariant 2 and requirement 0.2 must be reconciled correctly, and getting this wrong is the likeliest
process failure of the next session.** FCDP holds that *the pack is authoritative and there is no corpus
retrieval during drafting* — not in the pack means a `******` placeholder, not a lookup. Requirement 0.2 holds
that all retrieval comes from one place. They are compatible in exactly one arrangement:

- **Retrieval happens at Stage P (pack assembly) and at the optional post-gauntlet G-C+ verification stage, and
  nowhere else.**
- **At those two moments retrieval comes exclusively from `archon-cli-v3`.**
- **During D1, D1.5, D2 and the gauntlet there is no retrieval at all.** A missing quotation becomes `******` and
  is resolved by a later pack revision, never by a mid-draft lookup.

FCDP also binds: never modify the author's source documents; new prose to standalone `*-DRAFT-vN` files;
revisions of existing prose on `*-iterations/` copies; timestamped backups to `.backups/` before touching any
shared artifact. Standing constraints on all output are `tmp/Dissertation/REVISION-PROTOCOL.md` (rule tiers,
turn-weight gate) and the session-degradation 7-step pre-output protocol plus forbidden-phrase blacklist in
`tmp/Dissertation/TODO_NOTES.md` §H.

### 0.2 All source material comes from the WSL `archon-cli-v3` project and nowhere else

**Absolute. No exceptions, no fallbacks, no "just this once."**

| what | where |
|---|---|
| binary | `/home/dalton/projects/archon-cli-v3/target/release/archon` (v1.3.11) |
| store | `/home/dalton/projects/archon-cli-v3/.archon/` |
| corpus | `/home/dalton/projects/archon-cli-v3/corpus/` — 9 subdirectories |
| **index** | `/home/dalton/projects/archon-cli-v3/index/` — **AT THE PROJECT ROOT, not `corpus/index/`** |

State verified 2026-08-05: **241 documents, 13,564 chunks, 18,238 pages, 0 failed, index queue empty.**

**Do not use** `/home/dalton/projects/archon-cli` (retired), the `claudeflow-testing/corpus/` tree (a diverging
copy whose index still sits at `corpus/index/`), the Mac replica, ChromaDB, LEANN, god-learn, or any web search.
The two index trees diverge and reading the wrong one is the single easiest mistake to make here.

Retrieval order: **index entry → `archon docs search` → `archon docs verify-quote` → PDF only if archon cannot
resolve.** **Gate on EXACT MATCH**, never on "found" and never on a fuzzy hit — a 99% fuzzy match has been
observed returning unrelated front matter. The shell resets its working directory between calls, so every
invocation must `cd` to the v3 project in the same command. The store was re-chunked under native extraction on
2026-08-05, so **any chunk-level reference from before that date is stale**; page loci improved.

### 0.3 Two things happen BEFORE any drafting

**Step A — read the eighteen unit entries that get worked prose, and verify every quotation EXACT.** This is a
working session in itself, not something to do while drafting. The entries, all under
`archon-cli-v3/index/Boredom Secondary (Part III)/`:

| L1 ¶ | units |
|---|---|
| ¶2 | `bor-sec-04` Elpidorou & Freeman · `bor-sec-13` Slaby |
| ¶3 | `bor-sec-10` Quaranta · `bor-sec-11` Hernández Albarracín (**author attribution flagged in the manifest — confirm**) |
| ¶4 | `bor-sec-18` Mansikka · `bor-sec-19` Thomson · `bor-sec-07` Gibbs |
| ¶5 | `bor-sec-28` Kim · `bor-sec-27` Barry · `bor-sec-33` Yuvaraj |
| ¶6 | `bor-sec-36` Holmqvist · `bor-sec-38` Scharinger (**2015, not 2019**) |
| ¶7 | `bor-sec-30` Perone · `bor-sec-32` Yakobi · `bor-sec-29` Miyauchi · `bor-sec-44` Nacke |
| ¶12 | `bor-sec-25` · `bor-sec-26` Elpidorou |

Plus four documents ingested 2026-08-04/05 that **carry no index entry yet (X-08)** and must be read from the
store directly: **Eastwood (2012)**, **Fahlman (2013)**, **Mugon et al. (2020)**, **van den Brink et al. (2016)**.
Also read from `_synthesis/`: the debate map on DA-01, DA-02, DA-03, DA-04, DA-07; the construct-measure
concordance §2 and §7; the scholarly-evolution arc; the citation network §2.

**Step B — run X-07, the v5 analysis regeneration pass**, before any figure caption is carried into the
dissertation. One run covering: the composite misdescribed in `report.py:493`, `figures.py:656` and
`crossref.py`'s docstring; the stale "1099–2430 s" in `figures.py:523` and `config.py:194`; the empty
enumerations and the "+nan trimmed" string; the two gaze-caption defects (baselines blended in one sentence, and
"10/12" pooled across rounds for a channel marked not poolable); the **eye openness → eye closure** rename
(D-11); the **American spelling sweep** (S-01, measured footprint 52 instances in generated `.md`/`.txt` and 76
in `analysis/*.py`); the `EXCLUSIONS.log` line reading "3/3 episodes whose heading states an order," which reads
as three participants when it is three episodes belonging to S01; and **X-06** — add the per-participant gaze
baseline to the criterion family, and add per-round criterion splits (R1-only, R2-only) as a sensitivity check.

Run with `/home/dalton/.venv/bin/python analysis/run.py` from `boredom-analysis-v4-2026-08-04/`. **A full run is
about six minutes**, the permutation stage dominating. **Never edit `scripts/boredom-o9/` — it is the methodology
of record and four correctness checks are defined against its behavior.**

---

## 1. THE OVERALL GOAL

Draft the laboratory boredom section of Part III: **applied philosophy — a phenomenological and
rhetorical-ontological frame interpreting quantitative data collection and analysis.** Not a results section with
a philosophical gloss, and not an essay with an appendix of numbers.

**The section's argument, which every module serves.** The two published studies did not lack a frame; they had a
different one, named it, and built the study on it. P1's methods adopt Fahlman's definition of boredom —
*"the aversive experience of having an unfulfilled desire to be engaged in satisfying activity"* — declare the
focus to be *state* boredom, and choose the stimulus under the same authority. That definition is Eastwood's,
which requires that one *"attribute the cause of our aversive state to the environment."* Heidegger's second form
denies exactly that condition: *"There is nothing at all to be found that might have been boring."*

Therefore: **the published studies could only ever have detected the first form**, because their operative
definition builds the first form's structure into the construct; **the keystone appears as a divergence rather
than a measurement**, since the survey asks first-form questions and the physiology does not know that; and
**the self-report channel is itself a first-form instrument**, which is both a limit and the condition that makes
the divergence legible. What the section demonstrates is **what philosophy reveals when applied to scientifically
collected and statistically analyzed data.**

**Arc position.** Part III runs: thin opening → the desktop/VLE section (M0–M7, drafted and assembled) → **this
section** → the Part III coda, which lands at **L7.2**. Ruled 2026-07-29.

---

## 2. WHAT HAS BEEN DONE

**Four complete analysis trees.** v1 `archived/analysis_trees/boredom-analysis-2026-07-30/` is **FROZEN — never
edit or re-run**. v2 and v3 exist for the audit trail. **v4 `boredom-analysis-v4-2026-08-04/` is CURRENT** — 27
tables, 72 figures, 8 artefacts, including the generated `APPENDIX-CRITERION-VALIDITY.md`. Round 1 returns
bit-identical across v2–v4 on both Round-1-only locked gate checks, which is the continuity proof.

**Stage 2 complete.** Outline v1 → v2 (post-handoff) → v3 (post-corpus reconnaissance) → v4 (the definitional
finding) → **v5 (the full module walkthrough)**. Registers v1 → **v7**. Two drafting-ready methodological
statements written. The module walkthrough ran **L0 through L7** and every module was walked and ruled.

**The major findings established across these sessions**, beyond the analysis itself:

- **The definitional substitution** (D-19) — the section's spine, described above, with six anchor quotations
  verified EXACT.
- **The frame forbids ascertaining attunement** (D-33, F-15) — *"Not only can an attunement not be ascertained,
  it ought not to be ascertained, even if it were possible to do so"*; *"all making conscious means destroying,
  altering in each case."* This converts the category caution from methodological modesty into a requirement of
  the frame, section-wide.
- **Viewing order resolved and corroborated four ways** (F-09) — S01 and S05 ran clinical → boring → interesting;
  everyone else ran interesting → clinical → boring; boring last in ten of twelve. **The data-labeling worry is
  closed**: the original uncut CSVs reproduce the crop-derived order with a consistent 1:47–2:22 offset matching
  the crop trim, so no physiological value is attached to the wrong film.
- **Why the order changed** (F-14) — S01 and S05 were the first two participants; the team then hypothesized the
  boring film depressed whatever followed and fixed the order. This is the referent of the published "early
  experiments" sentence. **The hypothesis does not survive its own data** (N-13).
- **The transition case is S08** (N-14) — closure escalating 16.8% → 58.7% → 89.2% across the boring episode
  against under 8% on either other film. **Read as the first form's counter-move exhausting toward sleep-exit,
  never as a move into profound boredom.**
- **Depletion is a session effect, not a boredom effect** (N-15) — the laboratory-to-philosophy lane is
  **withdrawn**, not softened.
- **Gaze works where it was properly sampled** (N-16) — perfect separation in Round 2 at 120 Hz, nothing in Round
  1 at ~3 Hz.
- **The aversive-arousal objection fails its own prediction** (N-17).

---

## 3. WHERE WE ARE

Stage 2 is finished. **Outline v5 is the drafting specification**; register v7 is the rulings ledger. Nothing is
drafted, nothing is committed, and nothing has been committed across any session of this work.

### 3.1 Open decisions — 4, none blocking

| # | Question |
|---|---|
| **O-03** | **PARTLY RESOLVED 2026-08-05 — see §3.2.** The works-cited entries remain. |
| O-06 | How much of the published studies to re-present against cite (L1 ¶8, constrained by the 4–5 pp cap) |
| O-14 | Multiplicity in the criterion family — recommendation is a footnote, not a computed correction |
| O-15 | The IRB-facing wording of the survey-instrument description |

**Adopted by continuation (D-35), reversible:** the within-episode time course stays out of the prose (O-04); the
per-participant matrix goes to the appendix (O-05); prior exposure is a footnote (O-07).

### 3.2 ★ O-03 RESOLVED, AND IT REACHES THE ANALYSIS — bank into register v8

**Author ruling 2026-08-05: one Round 2 participant was also a co-author of the published gaze study.** The
survey filename token places him as **R2-03**.

Three consequences, none yet written into outline v5:

1. **Disclosure.** Standard research transparency requires the dissertation to state that a co-author of the
   published study was also a participant. **The author has not yet ruled on the wording.**
2. **Re-identification.** Saying "one Round 2 participant was also a co-author" alongside a four-name author list
   narrows the field to four, and combined with the stated facts about R2-03 it narrows further. The PII rule
   keeps names out of files, but this construction can identify without naming. **A disclosure decision, not a
   PII-mechanics one, and it needs the author.**
3. **★ The analytic consequence, and it is the important one.** R2-03 is the participant **whom nothing bored**
   (boredom 3/1/2 against engagement 6/8/8) and **the recurring reverse case** under four of the seven composite
   definitions. L4.2 currently explains that profile from their own answers — they never became bored by
   anything, so their clinical episode is their own relative minimum. **A second and more parsimonious account is
   now available: hypothesis awareness.** A co-author knew the study's design and what the boring film was for.
   This belongs in **L4.2** beside the existing explanation and in **L6** as a limit. It does not overturn the
   keystone — R2-03 is one of twelve and the decomposition holds without them — but leaving it unstated when it
   is knowable would be indefensible.

### 3.3 Deferred work items

| # | Item |
|---|---|
| X-04 | Extending `channel-correlation` to the v3 gaze columns — awaiting approval; changes an existing figure |
| X-05 | **The overlay pass** — gaze overlays for every participant × film, the intended route to a head channel. **No current wording anticipates it**; if it happens it is a revision, not a fulfilled promise |
| X-06 | Folded into X-07 (§0.3 Step B) |
| X-07 | The v5 regeneration pass (§0.3 Step B) |
| X-08 | Group index entries for the nine documents ingested 2026-08-04/05 |
| X-09 | **Manual video review** to demonstrate the S08 transition directly, if time permits. Same rule as X-05 |

### 3.4 Owed to the desktop section

`DESKTOP-M4-DRAFT-v1.tex` M4.1 ¶6 and `DESKTOP-M3-DRAFT-v1.tex` M3.6 carry `STALE-2` markers citing the
superseded keystone; they are revised **once**, after this section is drafted, to whatever L3 and L4.2 settle.
The generated Overleaf mirror must then be re-flattened and the assembled PDF recompiled.

**L7.2 is the gate on three further desktop items:** M2.3's revision, the arc-close question (the *desktop's*
O-11 — see §5.2), and the M7.1-versus-III-5 three-state harmonization. Drafting L7.2 unblocks all three.

---

## 4. WHAT REMAINS — the drafting order

1. **Step A and Step B of §0.3**, in either order. Neither is drafting.
2. **Bank O-03's ruling into `DECISIONS-REGISTER-v8-…`** and fold its three consequences into
   `PART-III-LAB-BOREDOM-SECTION-OUTLINE-v6-…`. Version chain: prior versions are **never edited**.
3. **Stage 3 drafting, module by module, under FCDP**, in outline order L0 → L7, in **1–3 paragraph batches with
   an author approval gate on each batch**, presenting with **bare paragraph numbers** and no module labels.
4. After the section is drafted: the desktop `STALE-2` revisions, the M2.3 and three-state harmonizations, the
   arc-close question, then re-flatten and recompile.

**Nothing is committed without explicit author sign-off. Nothing across any of these sessions has been
committed.**

---

## 5. KEY PATHS

### 5.1 This section

| what | where |
|---|---|
| **Drafting specification** | `tmp/Dissertation/Part_III/PART-III-LAB-BOREDOM-SECTION-OUTLINE-v5-2026-08-05.md` |
| **Rulings ledger** | `tmp/Dissertation/Part_III/DECISIONS-REGISTER-v7-2026-08-05.md` |
| **This handoff** | `tmp/Dissertation/Part_III/HANDOFF-LAB-BOREDOM-STAGE3-DRAFTING-2026-08-05.md` |
| Drafting-ready criterion prose | `tmp/Dissertation/Part_III/PROSE-METHODS-CRITERION-VALIDITY-v1-2026-08-04.md` |
| Drafting-ready gaze-baseline prose + log | `tmp/Dissertation/Part_III/PROSE-METHODS-GAZE-BASELINE-v1-2026-08-04.md` |
| **Current analysis tree** | `tmp/Dissertation/Part_III/boredom-analysis-v4-2026-08-04/` |
| Analysis version diff | `tmp/Dissertation/Part_III/ANALYSIS-VERSION-DIFF-v1-v4-2026-08-04.md` |
| Prior handoff (analysis history) | `tmp/Dissertation/Part_III/HANDOFF-LAB-BOREDOM-V4-COMPLETE-2026-08-04.md` |
| Superseded outlines v1–v4, registers v1–v6 | same directory — **never edit, kept for rollback** |
| **Methodology of record — NEVER EDIT** | `scripts/boredom-o9/` |

### 5.2 Inherited and cross-referenced

| what | where |
|---|---|
| Three-forms exposition this section inherits and never re-derives | `Part_III/drafts/DESKTOP-M4-DRAFT-v1.tex`, ¶¶4–7 of M4.1 |
| The hand-forward this section redeems | `Part_III/drafts/DESKTOP-M7-DRAFT-v1.tex`, M7.1 |
| Gold-standard roadmap exemplar for L0's signpost | `Part_III/drafts/DESKTOP-M0-DRAFT-v2.tex`, the M0.4 block |
| **FCDP protocol** | `plans/fable-console-drafting-protocol-v2.md` |
| Canonical revision protocol | `tmp/Dissertation/REVISION-PROTOCOL.md` |
| Session-degradation protocol + blacklist | `tmp/Dissertation/TODO_NOTES.md` §H |
| Packs | `plans/packs/` |
| FCDP tooling | `scripts/strip-latex-for-lanham.py` · `scripts/substitute-quote-ids.py` · `tmp/analyze-style-lanham.ts` |

**Note on the two O-11s.** The *lab* register's O-11 was "accept as a stated limit that Round 1 measures the eye
only," resolved as D-15. The *desktop* register's O-11 is "dissertation-level conclusion inside M7.2 versus a
separate coda." They are different questions with the same number. From here the desktop's is called **the
arc-close question** and never referred to by number. The arc ruling of 2026-07-29 answers it in substance: the
dissertation-level close happens at L7.2 and desktop M7.2 stays section-scale as drafted.

---

## 6. DOCTRINE AND GATES — all in force

**PII (permanent).** `S01`–`S08` and `R2-01`–`R2-04` only. No participant name in any output, log, figure,
caption or filename. The crosswalk is never persisted. **Round 1 source filenames themselves carry participant
names, so directory listings and file paths are never reproduced in output.** The author may use names in
conversation; they never reach a file. See §3.2 for the re-identification question O-03 raises.

**Doctrine locks.** Chain-node walkthrough is THE analytical form · **NO-STALL**, the chain runs always ·
**GREATEST-DESIRE**, never "better route" · **"demonstrated" never "prove"** · **potentiality is always
actualized within a narrowed field** — the situation limits the potentialities available, it does not furnish a
single act.

**Standing sweeps before presenting any batch.** Sentence-initial *And* · "record" as an evidence-name · "pole" ·
ladder · stall · cost/price/spend metaphors · bare "incorporation" (Calleja only) · vague paragraph frames.

**Register.** Scientific-direct; MLA; *Rhetorica* in Aristotle parentheticals; no module labels in rendered text;
bare paragraph numbers when presenting; **American spelling — "center," never "centre"**, and the whole
*analyze / normalize / harmonize / labeled / artifact / behavior / recognize / organize* family; note *analysis*
is already American.

**Verification-gated.** Quotes EXACT before entering prose; index entry first, then archon, then the PDF; **FCM
page loci are read from the running head, never computed** — the offsets are not constant; backups before
touching approved files; forks discussed in prose, never polls; ultracode off; **nothing committed without
explicit sign-off**.

**Statistics.** Directional convergence plus the surfaces that actually reach significance — never per-channel
significance for channels that do not. Anything n < 6 is labelled descriptive; at n = 4 the signed-rank floor is
p = 0.125, so perfect separation is the strongest obtainable result. **Every criterion probability is a
within-subject permutation p**; three associations clear alpha analytically and not under permutation and are
reported as non-significant.

**Category caution.** Episodic structural grammar only, never a *Grundstimmung* claim — and per D-33 this is a
**requirement of the frame**, not modesty. No learning-outcome claims anywhere.

**The two constraints that must never be violated.** Head movement is present in this data and **not instrumented
in this pass**; the section must never say the boring film produced stillness rather than restlessness. The
permitted form: *the eye channels show withdrawal, and the search behavior visible in the session video was not
instrumented in this pass.* And no measurement here evidences profound boredom; what the instruments show are
episodic structures resembling parts of its anatomy, named as resemblances every time.
