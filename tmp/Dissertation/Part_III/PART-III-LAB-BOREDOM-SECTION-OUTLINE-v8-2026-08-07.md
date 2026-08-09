# Part III — Laboratory Boredom Section — MODULAR OUTLINE v8 (2026-08-07)

> **v8 supersedes v7. Version chain: supersede with `-v9-`, never edit in place.**
>
> ## ★★ THE GOVERNING RULING (author, 2026-08-07) — READ BEFORE ANYTHING ELSE
>
> **1. FILM-SEPARATION STATISTICS ARE EXCLUDED FROM THE DISSERTATION ENTIRELY.**
> Whether a measure can or cannot tell the three films apart is not a finding this section
> reports. Not demoted, not moved to the appendix — excluded. This removes the 99 pairwise
> contrasts, every Friedman/Wilcoxon across-film test, the nine Holm-surviving contrasts, and
> every claim of the form "this measure distinguishes the boring film from the clinical one."
> **Reason:** boredom is a response, not a property of a film. The same film bores one person
> and engages another — S04 is the proof — so comparing films averages across exactly the
> subjective variation the experiment exists to study.
>
> **2. THE CRITERION ANALYSIS IS THE EXPERIMENT.** Each physiological measure scored against
> what the participant reported about that episode, within-subject, across all 36 episodes.
> That is the heart of the study and what the results present.
>
> **3. GAZE DEVIATION IS THE PRINCIPAL FINDING** (per-participant baseline).
>
> **4. COEFFICIENTS.** The body carries the Spearman/Pearson comparison chart at the point the
> criterion findings are discussed, as an image. Spearman is the reported test; Pearson sits
> beside it as evidence of near-linearity. The fuller criterion table for non-load-bearing
> channels goes to the appendix. **Justification for promoting Pearson:** leave-one-out
> leverage testing (2026-08-07) shows every influential episode SUPPRESSES the Pearson
> coefficient rather than inflating it — dropping S06/BOR raises eye closure's r from +0.577
> to +0.655, and gaze's from +0.623 to +0.707 — so the linear relationship is real and is
> understated by the extreme cases, not manufactured by them.
>
> **5. REGISTER.** Statistical terminology is used, for a statistically literate committee
> member, AND everything is explained so a non-statistical reader can follow both the results
> and why each computation was chosen. Both, not either.
>
> **6. ALL THREE FILMS TREATED EQUALLY.** The clinical stimulus does not hold the prominent
> position it held in the published studies. Conclusions about it remain permissible;
> foregrounding it does not.
>
> ### What this ruling overturns
>
> - **D-26 is void** in its current form: it designates a separation result (eye closure
>   12-of-12, boring vs interesting) as the section's strongest evidence.
> - **§L3 as written in v7 is void** — it is organized around separation from L3.1 onward and
>   must be rebuilt on the criterion analysis. See §L3 below.
> - **D-37's sleep-fight figures** are film comparisons and do not appear as such.
> - `PROSE-METHODS-CRITERION-VALIDITY-v2`'s **"do not rewrite" status lapses for REGISTER
>   only**. Its numbers and logic stand; its pitch assumes statistical literacy and ruling 5
>   supersedes that. The drafted L2 version is current.
>
> ## ★ NEW ANALYSES not present in v7 (computed 2026-08-07)
>
> - **Sleep-fight against reported boredom and engagement.** Within-subject z, pooled 36
>   episodes: **rho +0.771 / r +0.823** vs boredom; **rho −0.752 / r −0.782** vs engagement;
>   within-subject permutation p < 0.0001 on all four. Leave-one-out: all influential points
>   suppress r. **MANDATORY CAVEAT — shared method:** sleep-fight is a survey item correlated
>   with other survey items, same person, same instrument, same moment. It evidences the
>   survey's internal coherence and the boredom→drowsiness account; it is NOT independent
>   corroboration from outside the survey the way gaze deviation is. State this wherever the
>   figure appears or a reader will take it as the strongest physiological result, which it is
>   not — it is not a physiological result at all.
> - **★ The within-participant paired contrast (the author's confound test).** Each
>   participant's own most-boring episode against their own most-engaging episode, which
>   cancels baseline drowsiness carried into the session. **11 of 12 fought sleep harder on
>   their own most-boring episode, 0 the other way, 1 tied (S06, 6/6).** Exact sign test
>   two-sided **p = 0.0010**, which is the FLOOR at 11 pairs; exact sign-flip permutation
>   agrees at 0.0010. **Goes in the BODY as a convergent finding**, with the correlation beside
>   it carrying the shared-method caveat.
> - **★ Why this vindicates the reframing — use it.** S04's most-boring episode was the
>   CLINICAL footage (bored 9) and her most-engaging was the BORING tutorial (engaged 7); she
>   fought sleep 6 against 1. Organized by film type she is the study's outlier; organized by
>   what she reported she follows the pattern by one of the larger margins in the set. Same for
>   S06 and R2-03. The film-type frame turns the most interesting participants into noise.
>
> ## ★ D-39 (author, 2026-08-06/07) — survey parsing, EXECUTED and re-run
>
> On any 1–9 item, "NA" means the film produced none of that quality and is read as **1**, the
> scale floor. On minutes-until-bored, a blank means **never became bored**, identical to an
> explicit NA, retained as a category and **NOT coded 0** (on a duration item 0 would read as
> bored from the first second — the opposite). Parsing counts are now **239 exact / 5 converted
> / 1 flagged / 7 semantic / 0 missing** (252 = 36 episodes × 7 items). **The survey has no
> unanswered items.** Both reproduction gates PASS. Figures did NOT regenerate — matplotlib
> absent in the WSL environment; any figure touching sleep-fight or R2-03's row is stale.
>
> ## ★ COHORT CORRECTION (author-confirmed 2026-08-06) — F-11 WITHDRAWN
>
> The 2023 paper reported **three** subjects (verified four ways in the document). Round 1 as a
> collection round has **eight**. The 2024 paper reported **twelve** = Round 1's eight + Round
> 2's four, using the same Round 1 recordings. **The published gaze cohort IS this analysis's
> cohort** — v7's "two twelves are different twelves" trap is GONE. Participants also include
> **computer science undergraduates**. IRB: use the 2024 form, **UCI IRB Exempt No. 20232678**.
> **Parhi and Ayinala is 2014, not 2013** (IEEE TCAS-I 61.1, January 2014).

---

# (v7 content follows, superseded where it conflicts with the ruling above)

# Part III — Laboratory Boredom Section — MODULAR OUTLINE v7 (2026-08-06)

**Status: CONSOLIDATED AND STANDALONE. Supersedes v5 (module spec) and v6 (amendments layer); v1–v6 are never
edited.** This is the single document to draft from. §Z carries the v5+v6 → v7 delta.

Rulings ledger: **`DECISIONS-REGISTER-v8-2026-08-05.md`**.
Analysis tree: **`boredom-analysis-v5-2026-08-05/`** — v4 retained untouched as the audit artifact.
Method prose: **`PROSE-METHODS-CRITERION-VALIDITY-v2-2026-08-05.md`** · **`PROSE-METHODS-GAZE-BASELINE-v2-2026-08-05.md`**.
**The v1 method files carry inverted eye-closure signs and must never be pasted.**

---

## 0. Retrieval, sources, and the state of the machine index

**All retrieval from `archon-cli-v3` and nothing else.** Binary `target/release/archon`; store `.archon/`;
corpus `corpus/`; index **`index/` at the project root, not under `corpus/`**. v3 is the authoring home as well
as the read source (ruled 2026-08-05); `claudeflow-testing/corpus/index` is the frozen replica and is never
synced from, in either direction. `INDEX-OWNERSHIP.md` in both trees records this, dated.

**Retrieval order:** index entry → `corpus-index search` / `docs search` → `docs verify-quote` **gated on EXACT
MATCH**, never on "found" and never on a fuzzy hit → PDF last.

**Two false-failure modes, both fixed by `--doc <id>`, both to be ruled out before calling a quotation wrong:**
hyphens broke the FTS parser (fixed in the binary as of 2026-08-06 — verified functionally, since the version
stamp lags the commit), and unrestricted search can miss a quotation that is present. The second is live: the
full "nothing at all to be found" sentence returned only from Slaby unrestricted and EXACT from FCM with `--doc`.

**New retrieval surface (2026-08-06), use it:** `corpus-index search "<query>" [--kind clauses|claims]` runs FTS
over quotes and claim texts; `corpus-index clauses-for-chunk <chunk-id>` is the reverse lookup. `dump clauses
--entry` now errors rather than silently dumping everything.

**Store census 2026-08-06:** sources 89 · clauses 8,553 · claims 5,571 · edges 21,319 · tensions 133 · groups 52.
The dissertation namespace was removed by author order and archived. All ten new-format entries PASS E1–E14.

**FCM is now fully evidenced:** 330 exact-anchored clauses, 181 of 182 claims carrying verbatim refs. **Pull the
verbatim; do not paraphrase from memory.**

**Two drafting caveats from that backfill.** The clause behind `claim-146` preserves an OCR corruption,
*entelectly* — never carry it into prose unmarked. `claim-133`'s locus cites p. 233 while the passage sits at
p. 223; FCM loci are read from the running head, never computed, so re-pin at use.

### 0a. ★ The argument, stated once and carried everywhere

The two published studies did not lack a frame. They had a different one, named it, and built the study on it.
P1's methods adopt Fahlman et al.'s definition of boredom as **"the aversive experience of having an unfulfilled
desire to be engaged in satisfying activity,"** declare the focus to be *state* boredom, and select the stimulus
under the same authority: **"State boredom often derives from information or environmental stimuli that is
monotonous, redundant, and/or meaningless."** That definition is Eastwood's — **"the aversive experience of
wanting, but being unable, to engage in satisfying activity,"** requiring that one **"attribute the cause of our
aversive state to the environment."** All verified EXACT.

**The incompatibility is locatable, and it is now a machine-indexed axis (DA-12).** Eastwood's third condition
requires the bored person to attribute the cause to the environment. The second form denies it twice over, and
the two denials do different work:

- **Claim-077** defeats the condition **on the instrument's own terms**: there is no determinate boring thing,
  only an "I know not what" — **"There is nothing at all to be found that might have been boring about this
  evening, neither the conversation, nor the people, nor the rooms"** (verbatim `cl-heidegger-fcm-1929-007`,
  FCM pp. 107–108, running head p. 107). A subject in the second form, asked to attribute their boredom to the
  surroundings, has nothing to attribute it to. **The definition filters the second form out of the data before
  any electrode is attached.**
- **Claim-085** is the **ontological counter**: what is boring **"arises from out of Dasein itself,"** so an
  attribution-constituted construct and the second form cannot both be exhaustive.

The third form leaves no particular want to be unfulfilled at all.

**Machine anchors — cite these rather than re-deriving the chain:** `ten-eastwood-unengaged-2012-01`
(condition (c) ↔ 085) · `ten-eastwood-unengaged-2012-02` (condition (c) ↔ 077) · `ten-fahlman-msbs-2013-01` ·
`ten-king-salvo-physio-2023-04` · `cl-heidegger-fcm-1929-007`.

**Three consequences, all ruled (D-19).** *The published studies could only ever have detected the first form*,
their operative definition building the first form's structure into the construct — a consequence of the
definition, never a criticism of the studies. *The keystone appears as a demonstration rather than a measurement*
— the survey asks first-form questions, the physiology does not know that, and where they part company is where a
non-first-form structure is operating. *The self-report channel is itself an instrument of the first-form
construct*, which is simultaneously a limit (L6) and the condition that makes the divergence legible (L4.2).

**What the section demonstrates: what philosophy reveals when applied to scientifically collected and
statistically analyzed data.** Every module must be legible as one of two moves — here is what the measurement
shows, or here is what it means once Heidegger's definition is the operative one — with the seam visible where
they meet.

### 0b. ★ The frame forbids ascertaining attunement (D-33) — a note displayed in the text

Verified EXACT: **"Not only can an attunement not be ascertained, it ought not to be ascertained, even if it were
possible to do so."** · **"all making conscious means destroying, altering in each case"** · **"but of awakening
it. Awakening means making something wakeful, letting whatever is sleeping become wakeful."** Heidegger addresses
observation directly in the preceding sentences: it is no objection that listeners cannot ascertain the attunement
in themselves, because there is nothing to be found by observation however astute, even calling on psychoanalysis.

**No measurement here can evidence profound boredom and none is claimed to.** What the instruments show are
episodic structures resembling parts of its anatomy, named as resemblances every time. **This converts the
category caution from methodological modesty into a requirement of the frame**, section-wide, and it sharpens what
the section does claim: not the mood, but the structural grammar.

### 0c. Potentiality (D-29)

The situation does not furnish a single act; it **narrows the field of potentialities available for
actualization**. Watching is what it furnishes toward the film; closing the eyes, shifting and falling asleep
remain available and were actualized. The diagnosis concerns the restriction of the field and the worth of what
remains in it. Sleep is therefore an actualized potentiality rather than an absence — which is why sleep-exit is
boredom's escape rather than its depth. The deployment parallel: that world furnished watching *and* the exit to
YouTube; the laboratory removes the exit while leaving closure, agitation and sleep.

### 0d. Head movement

Present in this data and **not instrumented in this pass**. The section must **never** say the boring film
produced stillness rather than restlessness. Permitted form: *the eye channels show withdrawal, and the search
behavior visible in the session video was not instrumented in this pass.* **Two independent reasons** — gaze is
recorded eye-in-head, and Round 1 participants were instructed not to produce the movement (D-30). Written as
though X-05 and X-09 will not happen; if they do, that is a revision, not a fulfilled promise.

### 0e. Criterion probabilities

Every criterion probability is a **within-subject permutation p** — 20,000 shuffles of the film labels inside each
participant, fixed seed. Three associations clear alpha analytically and not under permutation; reported as
non-significant. No analytic p is ever quoted as the result.

---

## A. INHERITED — never re-derived

The three forms in rendered prose (desktop **M4.1 ¶¶4–7**) · the *channel* term (M4.1 ¶4) · the chain A₀→A₄,
rhetorical incorporation, world-/co-disclosedness, veri(dis)similitude (Parts I–II) · the two-channel rule
(**M2.3**) · the layer assignment, physiology = occupied surface and retrospective self-report = hollow depth
(FCM bridge §4) · vocabulary from the FCM entry and construct-crosswalk, **not** Part II v4.

**Owed to the desktop section:** `DESKTOP-M4-DRAFT-v1.tex` M4.1 ¶6 and `DESKTOP-M3-DRAFT-v1.tex` M3.6 carry
`STALE-2` markers citing the superseded keystone; revised once, after this section is drafted, to whatever L3 and
L4.2 settle. **A third item joins that queue:** M4.1 ¶7 locates the third form's shape in "the laboratory's
stillest episodes," which is a stillness claim this section is forbidden to make (0d).

## B. REDEEMED (desktop M7.1 hand-forward)

The divergence-instrumented three-state proposal (**L5 pays it; L5.3 states what it does not**) · the unbuilt
FCM-phenomenology × instrumentation combination (**L1 supplies the warrant, now definitional as well as
bibliographic**) · the harmonization, this section carrying the full three-state statement and superseding
III-5-Design's gesture wording.

---

## C. Modules

### L0. Introduction — 9–11 ¶¶, six moves, thesis LAST

- **Hook.** S07's answer sheet: bored 6 and engaged 7 on the clinical film, bored 7 and engaged 6 on the
  interesting one. The instrument that allowed two answers got two. The count — four such episodes across three
  participants — is held for L3.
- **Context.** Three literatures and a word they share: one asking what boredom discloses, one asking what it
  looks like in a signal, not citing each other for twenty-four years — **and the laboratory's own studies
  standing in a third lineage while taking their definition of boredom from the second.**
- **Disruption.** The laboratory's own evidence had not been read, and the reason is structural: the EEG headline
  came from one clean participant and is a full negative at N=8; the published gaze feature is rate-bound and
  Round 1's telemetry cannot support it as defined; the test the design implied had not been computed. Beneath all
  three, **the study measured boredom under a definition that could not name what it found.**
- **Resolution and methodology.** Four cohorts reprocessed, the two questions kept apart from the outset, and
  above them the substitution that organizes the section. State the genre here.
- **Signpost.** On M0.4's model; seven parts; count pinned at first complete draft.
- **Thesis, last.** Three connected parts. *First*, the second form is instrumentable and this laboratory
  instruments it — the eyes place the clinical film with the interesting one and away from the boring one while
  the reports place it nearer the boring end. *Second*, that divergence is sayable only because the same channels
  agree with the reports elsewhere, and *legible* only under a definition the study that collected the data did
  not use. *Third*, what the laboratory licenses is a three-state instrument with a fourth terminal category,
  together with an honest ledger of which states it could evidence and which it could not.

### L1. The Three Literatures — 12 ¶¶, **4–5 pp** (D-14)

*Backbone: `archon-cli-v3/index/Boredom Secondary (Part III)/` — 55 units in 7 strands, the debate map (now
**twelve** axes), the construct-measure concordance, the citation network, the scholarly-evolution analysis.*

**Compression map for the second pass:** load-bearing — **¶1, ¶8, ¶9, ¶10, ¶11**. Foldable — ¶2 into ¶3, ¶7 into
¶5, ¶4 to two sentences, ¶12 to a footnote. That path lands L1 at about eight paragraphs.

1. **The organizing claim.** Two literatures under one word for twenty-four years; the only connection is one
   author citing himself across his own two programs plus a single critical footnote. The laboratory's studies
   stand in a third lineage **and drew their operative definition from the second**.
2. **The phenomenological literature, as reception not exposition.** Elpidorou and Freeman on whether profound
   boredom is boredom (`bor-sec-04`), DA-03 on Angst against boredom as the fundamental attunement, Slaby
   (`bor-sec-13`) on the other side of existence — the reading that makes the surface-over-depth structure legible
   and that works the same FCM passage this section's hinge rests on.
3. **Film, and why this literature reaches this paradigm.** Quaranta (`bor-sec-10`) on film viewership as
   being-in-the-world through Heideggerian boredom. **¶3 rests on Quaranta alone** — `bor-sec-11` is dropped as
   the only non-English source of the eighteen (author ruling), and needs no works-cited entry. The stimulus here
   *is* film, watched under mandate, in a headset.
4. **Boredom and education.** Mansikka (`bor-sec-18`) as the strand's first unit; Gibbs (`bor-sec-07`); Feldges,
   Mertel, Aroles and Küpers compactly.
   **★ Thomson (`bor-sec-19`) is NOT a boredom source (A-02)** — zero occurrences of "bored," "boredom" or
   "Langeweile." **Keep him in one sentence for the frame he does supply** — paideia, enframing, teaching as
   "letting learn," an ontohistorical account of meaninglessness — stated as a frame for the education strand,
   never as a reading of boredom.
   **★ Mansikka is the pedagogical precedent for the keystone (A-09).** His second form maps onto
   engaged-but-inauthentic learning: a student fully occupied, even high-achieving, while governed by *das Man*.
   The consequence he draws is the one this section demonstrates instrumentally — that form is invisible to
   behavioral-engagement metrics **because engagement and hollow boredom are compatible rather than opposed.**
   Hand forward to L4.2, which shows it in two channels rather than arguing it.
5. **The EEG literature.** Kim (`bor-sec-28`) and its null — thirteen participants, no significant correlation
   between self-report and any physiological feature (A-06); Barry (`bor-sec-27`) on alpha as global arousal
   rather than a topographic index, **and the further point that eyes-closed and eyes-open are non-equivalent
   baselines** (A-07), which bears on this section twice over; Yuvaraj (`bor-sec-33`) as the nearest neighbor and
   its own gap — no resting baseline, both conditions active eyes-open video-viewing (A-08). Miyauchi, Perone,
   Yakobi, Seo compactly. **`bor-sec-29` (Miyauchi) carries no multi-word source quotations at all (A-10)** — no
   worked quotation is available from it.
6. **The eye-tracking literature, and what pupil indexes.** Holmqvist (`bor-sec-36`) as the reporting standard L2
   is measured against; Scharinger (`bor-sec-38`, **2015 not 2019** — A-03, and likewise not a boredom source);
   **van den Brink et al. (2016)** on pupil tracking lapses of attention (D-18). Together: pupil indexes load and
   attention, not boredom-as-reported — the anchor that turns L3's pupil null into an answer.
   **★ Scharinger is a published precedent for this section's oppositional ranking (A-04):** pupil dilation and
   EEG alpha **both** registered the load manipulation and **did not correlate with each other** (r = −.16, −.14,
   ns), with alpha alone tracking comprehension. That is L3.6's structure with a prior in the literature, and it
   sharpens ¶6 from "pupil indexes load, not boredom" to **channels registering one manipulation routinely fail to
   agree** — which is what makes the oppositional ranking a finding rather than an anomaly.
   **★ A third instance is now available (2026-08-06): VanderWerf.** Blink duration and amplitude vary
   systematically with vertical gaze position, and any blink corpus recorded during stimulus presentation is an
   unknown mixture of elicitation classes whose composition depends on the stimulus. Same shape as the pupil case
   — an ocular measure that reliably indexes something (motor drive and lid position) and does not index the
   reported construct. Charoenpit, Sharma, Jaques, GazeMotive, Cheval, the metrics review compactly.
7. **The negative through-line.** Kim's null, Perone's unsupported first hypothesis, Yakobi's uncorrelated
   markers, Nacke's non-separating flow subscale, Miyauchi's alpha indexing appraisal. This section's EEG negative
   is characteristic of the literature, not anomalous within it.
8. **★ The lineage the published studies stand in — and the definition they took from it.** The clinical-immersion
   tradition from the papers' own lists; the vendor documentation as instrument reference. Then the two moves:
   the **definitional adoption**, Eastwood (2012) → Fahlman (2013) → P1 (2023) → this data; and the **redemptive
   half**, the 2023 paper already citing phenomenology of VR — Morie (2008), Heinzel and Heinzel (2010), Tham et
   al. (2018) — as framing rather than as an interpretive frame for its own data.
   **Both halves are now machine-indexed and should be cited from the index rather than re-argued.**
   `grp-vr-phenomenology-framing:collective:VR-PHEN` records the three sources as **one undifferentiated gesture
   at refs [13–15], invoked but inert** — no proposition applied, quoted, engaged or contested.
   `grp-program-lineage:collective:PROG-LINEAGE` records the program **as a body of work**: extension rather than
   resolution, on a warrant (scarcity of clinical access) identical across five years, its published position
   being that platform viability is settled and learner experience favorable **while what the immersion does to
   attention and engagement remains open in its own record**. P1 sits deliberately outside that set, because it is
   quoted rather than characterized. Per **D-20**, the observation that the two papers engage one of the
   fifty-five indexed units is stated as description of where the program stood. `O-06` governs how much to
   re-present against cite, under the 4–5 pp cap.
9. **The warrant, bibliographic.** Route 1: 22 units treat profound boredom, 19 carry a hard instrument,
   **intersection empty**. Route 2: 21 carry an FCM bridge edge, 19 a hard-instrument edge, **intersection
   empty**; the ID ranges barely touch. **`RE-PIN` these six counts against the regenerated synthesis layer.**
10. **★ The warrant, definitional — the stronger half.** The concordance's hole: the three forms are reachable by
    self-report and nothing else, and that instrument is the one the phenomenological tradition says cannot in
    principle access an attunement and the one the empirical literature shows does not correlate with any
    physiological signature. The most important populated cell is a negative. **Underneath it:** the instruments
    in that grid were built to operationalize a construct defined by environmental attribution, and two of the
    three forms deny environmental attribution by construction. The literatures are disjoint at the instrument
    boundary because they are disjoint at the **definitional** boundary. **Per D-23 the two definitional
    quotations are rendered here, once, together** — Eastwood's condition beside the FCM's "nothing at all to be
    found" — and paraphrased everywhere else.
11. **DA-04, DA-12, and why the criterion analysis does not violate either.** Report both channels, validate
    neither against the other. Scoring for agreement is not certifying one against the other; it measures
    coincidence, which is a finding, and the channels rank oppositely on the two questions, which shows neither
    reduces to the other. Kim is the precedent for expecting disagreement — none significant at thirteen
    participants against four surviving at twelve here, and the disagreement is reported rather than resolved.
    **★ The two axes divide the labor and the prose should say so once: DA-04 carries the measurement half of the
    argument, DA-12 the definitional half — and the definitional exclusion operates *before* self-report's
    validity is even in question.**
12. **The construct's parents, and state/trait.** Eastwood (2012), Fahlman (2013), Mugon et al. (2020) — the last
    now joined to DA-01 rather than seeding a new axis; Elpidorou's regulatory corrective (`bor-sec-25`,
    `bor-sec-26`) and DA-01. The guard against "boredom is good" without the partition, and what keeps L4.6 from
    over-reading. DA-07 named here because L4.5 takes a side.

**What this costs, stated rather than allowed to happen quietly:** the eleven Hadjioannou chapters get a footnote
at most; strands C and F fold into ¶¶5–7 as names; roughly thirty-five of the fifty-five units appear as citations
without discussion. The works cited carries all of them.

**Quotation discipline (A-01, S-04).** The index entries put paraphrases inside quotation marks — two of the first
ten candidates were not verbatim — and they use ellipses inside quoted spans, which cannot verify exact by
construction. **Nothing from an entry enters prose without passing the gate in its own right.**

### L2. The Apparatus and the Data — 10 subsections

**Body/appendix split APPROVED.** Body ≈ 5 pp: the cohorts and the trap, the instrument with its operative
definition, the stimuli, the two-instruments fact and the rule that follows, eye closure and the licensing of its
proxy, viewing order, the two-questions distinction, the standing reporting rule. Appendix: the poolability table,
the decimation measurement, the rate-harmonization detail, the blink-ceiling derivation and episode counts, the
window mechanics, the survey-parsing confidence table, the full criterion statement, the gaze-baseline log.

**Sequencing APPROVED as slightly unconventional:** the instrument's operative definition (2.2) precedes the
stimuli (2.3), so the stimulus rationale lands as confirmation.

1. **Four cohorts.** Published pilot N=3; published gaze study N=12 as published; Round 1 N=8; Round 2 N=4. Pooled
   **N=12 = 8 + 4**, 36 episodes. **The two twelves are different twelves** — the 2024 paper's access dates are
   January 2024, Round 2 was recorded that March (F-11). `RE-PIN` the paper's participant paragraph.
2. **★ The instrument, under the definition it was built for.** Seven items in the break after each film; boredom
   and engagement as **two separate items, not a bipolar axis**. Derived: felt-duration ratio, depletion. Free
   text: 239 bare numbers, 5 converted, 1 recovered from prose, 5 semantic, 2 missing, every interpretation logged
   with its raw string. Structural missingness stated. **Fahlman is the *definition*, not the item lineage** — the
   items operationalize it, which makes self-report an instrument of the first-form construct. Stated in a
   sentence or two; L1 ¶8 and ¶10 carry the argument, and it is not made twice at half strength. `O-15`.
3. **The stimuli, with the published rationale.** Three films, treated equally (R-06). Sources for the works cited
   per D-17. The published rationale, verified EXACT, shows the stimulus was chosen under the operative
   definition — monotonous, redundant or meaningless material, plus the assumption that students already knew
   Microsoft Word and that an obsolete interface would raise the likelihood of state boredom (R-08).
4. **Two engines, two conventions, two sampling regimes.** Unreal (X forward) against Unity (Z forward) (F-01);
   3 Hz against 120 Hz. **The rule:** means of per-sample values pool; variances and windowed statistics do not.
   Consequences: blink rate is Round 2 only; the closure scales are harmonized before any pooled signed-rank test.
   **The sampling seam (F-10, D-20):** the published 120 Hz is the *sensor's* rate, cited to vendor documentation;
   Round 1's telemetry logs at ~3 Hz; Round 2 is the first round where every sensor polled and logged at 120. A
   fact about logging, never an error. EEG band power follows Welch per **Parhi and Ayinala** — `RE-PIN` the year,
   cited 2013 against a January 2014 issue.
5. **Eye closure and its proxy (D-11).** Named **eye closure** throughout: *the proportion of the episode during
   which the eyes were shut*; Round 1, *the proportion during which the tracker could not obtain a valid read of
   both eyes*, licensed at **Pearson r = 0.998** inside Round 2. Round 2 **binary at source** — {0,1} across
   3,416,362 per-eye samples — so the threshold is not tuned and blink against extended closure rests entirely on
   duration. Blink ceiling 500 ms (VanderWerf; **334 ± 67 ms**, recorded while subjects watched video). Round 1
   episodes read from the per-eye sentinel. Negative sign in the composite. Measured against Holmqvist's
   guideline (L1 ¶6).
   **★ NEW limit, from the VanderWerf entry (2026-08-06):** the ceiling is a *duration* threshold, and blink
   duration varies systematically with vertical gaze position — controllable at a fixed screen, not in 360° video
   where gaze is the participant's own behavior. The blink/extended-closure partition, the episode counts and
   Round 2's blink rate all inherit that dependency. State it here; carry it to L6.
6. **Two windows.** Round 1's middle ~13.6 min against Round 2's whole film; the instructed closures are the
   stimulus boundaries (F-08). Both computed; **the result belongs to L3, not here.**
7. **Viewing order (F-09, F-14).** S01 and S05 ran clinical → boring → interesting; the other six Round 1 and all
   four Round 2 ran interesting → clinical → boring. **Boring last in ten of twelve.** The order was fixed **after
   the first two participants**, on a hypothesis that the boring film depressed whatever followed, and the
   published paper says so. **The test of that hypothesis goes to L6, not here.** R2-03 and S07 analyzed as single
   sessions in the standard order (D-21).
8. **The criterion method.** Short form in the body (D-13), full statement in the appendix. Do not rewrite —
   **`PROSE-METHODS-CRITERION-VALIDITY-v2-2026-08-05.md`**. `O-14`, `O-15` are the two `******`.
9. **★ The gaze baselines (D-12 as REVISED).** Three references computed, **none primary**, each assigned to the
   question its construction lets it answer: **device-forward** for stimulus separation, **per-participant** for
   agreement with self-report, **per-file** reported alongside the second. **The ground stated in the prose is the
   design, not the coefficient** — the agreement analysis is within-subject and the per-participant baseline is
   the only one built the same way — with the coefficient as corroboration. Every result names its baseline. Do
   not rewrite — **`PROSE-METHODS-GAZE-BASELINE-v2-2026-08-05.md`**.
10. **What each channel can and cannot say.** Load-bearing four. **Cognitive load appendix-only** (rho −0.09 /
    +0.11, p 0.65 / 0.60); **HR and HRV removed** (rho +0.09 / +0.04, p 0.68 / 0.86) — the flat numbers stay in
    the body because they make the rulings non-arbitrary. EEG a full negative. Standing reporting rule:
    directional convergence plus the surfaces that reach significance, never per-channel significance for those
    that do not; n < 6 descriptive; at n = 4 the signed-rank floor is p = 0.125. **Round 1 participants were
    instructed to refrain from agitated movement** because it would corrupt the EEG; the instruction was not given
    in Round 2 (D-30) — the fifth round-asymmetry, alongside engine, axis convention, rate and window.

### L3. The Findings — RESTRUCTURED PER CHANNEL (D-25)

**Both questions run through each channel** — does it separate the films, does it agree with the person. The
oppositional ranking then emerges from the material rather than being announced, eye closure's primacy becomes
self-evident, and D-13's distinction is taught by demonstration three times.

**Body/appendix split APPROVED.** Body: every subsection at working weight. Appendix: the 99-contrast forest, the
full criterion table with both coefficients and both probabilities, item-by-item self-report, the EEG retention
and noise table, the composite sensitivity sweep, and the per-participant matrix (**O-05 adopted**).

1. **The frame.** 99 pairwise contrasts; **nine survive Holm, every one on eye closure, pupil, or excursion
   frequency**. Carried by the eye-tracking surfaces. Nothing omitted for being non-significant. The two questions
   named here, restating L0 and L2.8 compactly.
2. **The self-report instrument.** Boredom separates the films (0.0139); engagement more strongly (0.0052, boring
   against interesting Holm 0.0176); **sleep-fight sharpest — 10 higher, 0 lower, 2 tied (S04 at 1/1, S06 at 6/6),
   Holm 0.0059, rb +1.000** (D-37; rank-biserial excludes ties). **Permitted form: *no participant fought sleep
   less on the boring film than on the interesting one, and ten of twelve fought it more.*** Minutes-until-bored
   separates boring from clinical (Holm 0.0293). **Felt duration does not separate at all** (0.32) yet is dilated
   in **25 of 36 episodes**. **Ten of twelve became bored on the boring film, all within five minutes, three
   inside one.** Within-instrument divergence in **4 of 36 episodes across 3 participants** — the hook's count.
3. **★ Eye closure — the only channel that answers both questions.** *Separates:* 11 of 12 against clinical (Holm
   0.0020, **rb +0.974**), **12 of 12** against interesting (Holm 0.0015, **rb +1.000**), Friedman 0.0004; Round 1
   alone 7/8 and 8/8; Round 2 alone 4/4 descriptive; window-invariant; unmoved by the re-crop; filling a
   documented non-coverage. *Agrees:* **rho +0.460** against boredom (0.0212) and **−0.416** against engagement
   (0.0370) — more closure, more reported boredom. **S05's 449.2 s and S08's 124.5 s belong here as closure
   measurements**, against Round 2's longest of 29.7 s. Episode counts: 4,365 Round 1 (3,501 blink-length, 864
   extended), 5,131 Round 2 (4,895 blink, 236 extended).
4. **Pupil — separates powerfully, agrees not at all.** *Separates:* perfect in Round 1, 8 of 8, Friedman 0.0302,
   Wilcoxon 0.0078, rb −1.000; pooled **10 of 12**, Holm 0.0146, rb −0.872, omnibus 0.097 full window and
   **0.017 matched**; Round 2 alone 2 of 4, chance. Two honesties: the pooled result is substantially carried by
   Round 1, and pupil separates boring from clinical but **not** boring from interesting (Holm 0.303).
   *Agrees:* rho −0.172 (0.404) and +0.036 (0.861) — **neither**. L1 ¶6 does the interpretive work.
5. **★ Gaze — agrees best, separates least (D-27).** *Agrees:* on the **per-participant baseline**, the one
   assigned to this question, rho **+0.590** against boredom (0.0024) and **−0.585** against engagement (0.0022) —
   **the strongest associations in the study**; the **per-file baseline** stands next at +0.524 (0.0074) and
   −0.527 (0.0075) and points the same way, so nothing turns on which is used (N-18). *Separates:* on the per-file
   baseline, **nothing** in Round 1 (Friedman 0.135; boring against clinical 0.84) — but in Round 2, where the
   feature was sampled at the rate its definition assumes, **perfectly**, 4/4 on both contrasts at the n = 4 floor
   of p = 0.125 (**N-16**). On fixed forward, excursion **frequency** is lower on the boring film, 7 of 8 both
   contrasts at **Holm 0.047**, the first gaze result here to survive correction, while amplitude does not
   survive. **Amplitude and frequency point opposite ways:** fewer but longer departures when bored; frequent
   short repositioning when engaged.
   **★ The per-participant baseline is uneven on separation** — best on boring against interesting (8/8 in Round 1)
   and **chance on boring against clinical (4/8)** — which is why the separation assignment stays on device-forward.
   **★ Independent support for the rate account (N-19):** every load-bearing criterion association points the same
   way in both rounds, and gaze is markedly stronger in Round 2 (+0.812 / −0.914 per-file; +0.868 / −0.928
   per-participant) than in Round 1. N-16 previously rested only on the separation test.
   Per **D-28**, separation is reported **per round and never pooled on raw magnitudes**; criterion validity **is**
   pooled and legitimately so, because within-subject z-scoring is scale-invariant and removes a multiplicative
   rate difference by construction — with the stated limit that it does not guarantee removal of a rate effect on
   the *shape* of the between-film pattern. Three cautions travel: eye-in-head; rate-dependent; every result names
   its baseline.
6. **The oppositional ranking, stated once now that it has been shown three times.** The channel that separates
   the films most powerfully is not among those that agree with the person; the channel that agrees best separates
   least; one channel does both, and it is the headline. **Per D-26**, this is the section's most load-bearing
   finding and not its strongest evidence — that remains the twelve-of-twelve separation. Both said, kept apart.
   Three associations clear alpha analytically and not under permutation; one borderline case runs against the
   reported statistic and is stated as such. **Scharinger is the published precedent (L1 ¶6).**
7. **★ The three-film decomposition.** Composite A (**pupil + eye closure**, the two Holm-surviving poolable
   channels, closure entering at sign −1), every participant on **each** film:

   | film | divergent | both engaged | both bored | inverse |
   |---|---|---|---|---|
   | Boring | 0 | 0 | **9** | 3 |
   | **Clinical** | **8** | 4 | 0 | **0** |
   | Interesting | 3 | 5 | 2 | 2 |

   Safe form: the eyes place clinical with interesting and away from boring; the survey places it nearer boring.
   Composite B gives 7/3/1/1 on clinical, so **A is cleaner and adding gaze does not strengthen the keystone**.
   Category counts; no omnibus test. **Cognitive load is NOT in composite A** (R-01) and lives in the sensitivity
   space only.
8. **EEG, a full negative read against its own literature.** **Zero of five surfaces at Friedman p < 0.05; zero of
   fifteen contrasts through Holm.** Concordance 4 of 8, chance. Retention 62.3% (36.3–74.4%, three of
   twenty-four below 50%). No cell excluded for noise, because the retention figures are the evidence for the
   ruling. **D-16:** dropped for scaling, then the reprocessing established what it could have carried; and
   agreement with self-report was asserted qualitatively in the published work and is computed here for the first
   time, per channel, with a clustering-corrected probability. Barry's eyes-closed/eyes-open non-equivalence
   (A-07) bears here.
9. **The case set — the people.** S04's inversion (boredom 1 and engagement 7 on the boring film, fatigue 7 → 1,
   **0.9% of the episode with eyes closed**, the lowest in the cohort — against 9 and 1 on the clinical film; her
   minutes-until-bored void by ruling; **her sleep-fight tie at 1/1 corroborates this profile**). S06 bored by the
   interesting film (8 and 2), **also tied on sleep-fight at 6/6**. R2-03 whom nothing bored (3/1/2 against
   6/8/8). S03 bored at 25 seconds, the episode reported as an hour. S07's within-instrument divergence on two of
   three films.
   **★ The swept reverse cases, with counts and baseline composites (D-5):** **R2-03 reverse under 4 of 7
   definitions** (baseline composite +0.425, boredom 3/1/2), **R2-04 under 3 of 7** (+0.486, boredom 7/2/3),
   **S03 under 1 of 7** (+0.274, boredom 9/3/3). **The robustness clause is conditional per case:** S03's
   single-definition case *is* an artifact of that one choice and is said to be; R2-03 and R2-04 recur across
   definitions and are not.
10. **The order confound and its control (D-24).** Ten of twelve saw the boring film last. **S01 and S05 saw it
    second and the interesting film last**, and in both the last-viewed film still carried the **lower eye
    closure** (0.074 against 0.096; 0.148 against 0.788); **S05's 449 s closure occurred mid-session**; boring
    sits **above** interesting on closure in **12 of 12**, so the effect is not carried by the pair. **At n = 2
    this is a check, not an argument, and the prose says so** — the weight-bearing claim stays the twelve-of-twelve
    separation.

### L4. The Analysis — chain-node walkthrough (THE analytical form)

1. **The chain in the laboratory.** A₀ = strapped into a headset under mandate, no leisure motive; A₁/A₂ = the
   charged image; A₃ = committed interest; **A₄ crossed always**. Per **0c**, the situation narrows the field
   rather than furnishing one act — watching toward the film, with closure, shifting and sleep remaining and
   actualized. The laboratory is a purer holding apparatus than the deployment because it removes the exit; felt
   duration shows the holding belongs to the situation, dilated in 25 of 36 episodes with **no separation between
   films**. Quaranta is the philosophical precedent, in play from L1 ¶3.
2. **★★ The second form, instrumented.** The layer assignment argued from the dinner-party structure. **The chain
   runs completely and well** for a divergent participant on the clinical film — perception, charged image,
   committed interest with the physiology registering it, watching actualized — and the same participant then
   rates it boring 6 of 9. **So the finding is not a chain failure.** Nothing stalled, nothing was withheld, the
   participant followed their greatest desire within the field available; what is hollow is not the mechanism but
   what the completed chain amounted to, which is Heidegger's structure exactly.
   **The reverse case absorbed:** zero under composite A; one or two under four of seven subsets, R2-03 recurring,
   explained from their own answers — never bored by anything, so their clinical episode is their own relative
   minimum, and *reverse* is a within-subject relative statement.
   **Qualification 1:** two eye channels **do** track the reports at about rho 0.5, which is what makes parting
   company on one film a finding rather than noise. The confined claim, and the composite's mixture stated.
   **Qualification 2 (D-19):** the survey is a first-form instrument, so the divergence is what a mismatched
   instrument produces when the structure it cannot name is present. **DA-12 is the machine anchor.**
   **The objection answered (D-34):** aversive arousal predicts the eyes close or turn away; they do neither —
   clinical closure is indistinguishable from the interesting film's (CLCvINT p = 0.2036) and far below boring's,
   and closure is the channel that *does* track self-report; the prior-exposure strata agree.
   **Overreach guard:** the second form is never claimed to be *detected*. What is demonstrated is its structural
   grammar — an occupied surface over a depth that reports emptiness.
   **★ O-03 is CLOSED (D-38): no disclosure sentence, no re-identification exposure, and no hypothesis-awareness
   alternative account here or in L6.**
3. **The first form.** Onset within five minutes in 10 of 12, three inside a minute, **sleep-fight 10 of 12 higher
   with 2 tied and none lower** (D-37) — **and the instrument was built for exactly this, so the form is
   over-detected rather than merely well-detected.** v1's "searching gaze as *Zeitvertreib* operationalized" is
   **withdrawn**: the eye departs **further but less often**, a few long excursions rather than continuous search.
   **The chain-node reading that earns its keep: A₄ completes in the counter-move rather than in the object** —
   the long excursion is the actualized act, so passing the time is not a failure of the chain but its completion
   elsewhere. **The counter-move was constrained twice (D-30):** the room offered no exit, and the protocol closed
   the body by instruction for the eight participants carrying most of the evidence — and the movements occurred
   anyway, observed and never recorded.
4. **The third form, as analog only — better evidenced, harder caution.** Closure the strongest surface, the two
   extended withdrawals, felt duration, the first correction-surviving gaze result. **Because the analog is better
   evidenced the caution binds harder** — and per **0b** it is a requirement of the frame, not modesty. L1 ¶10
   defends the restraint; DA-02 and DA-03 make the refusal a position in a live debate.
   **The transition (N-14, D-31):** **S08** — bored within thirty seconds, sleep-fight 8 of 9, closure escalating
   **16.8% → 58.7% → 89.2%** across the boring episode against under 8% in every third of both her other films.
   Evidenced from closure onsets and durations only; **no channel trajectory, no slope, no test on thirds**.
   Confound stated: boring came last for her, partially answered because her second-position film shows no
   escalation. **Read as the first form's counter-move exhausting toward sleep-exit, never as a move into profound
   boredom.** **S05 is the terminal category arriving at once** (55.1 / 100.0 / 66.8, one event beginning early).
   **S07 is neither** and escalates inside her first-viewed film too — a personal tendency, not a stimulus
   response. **No cohort claim:** last third above first in 6/8 on boring against 5/8 on each other film.
   Sleep-exit stays a fourth terminal category: boredom's escape, not its depth.
5. **Against stimulus-essentialism — the anomaly set.** Not a list of odd cases but the definitional argument
   cashing out: the operative definition places the cause in the environment, and the set shows the same material
   producing opposite responses in the same session. **S04 is the keystone.** Then S06, R2-03, S03, the four
   divergent episodes, the round-level non-replication, and the sequence-level instance from the carryover check.
   **DA-07** is the axis this takes a side on. `O-07` — prior exposure as a footnote (**adopted, D-35**); strata
   near-indistinguishable on clinical at 8 against 4.
6. **The aftermath — the lane WITHDRAWN (D-32, N-15).** v1 and v4 both assert that boredom depletes and that the
   canonical account does not, making a laboratory-to-philosophy lane. **The re-pinned counts do not support it:**
   more fatigued after boring 9/12, clinical 8/12, interesting 8/12; medians +1.5, +1.0, +1.0; the omnibus does
   not separate them (0.3965). **Depletion is a session effect.** The withdrawal is written as a withdrawal.
   **What survives:** the boring film has by far the widest spread — −6 to +5 against clinical's −3 to +2 and
   interesting's −1 to +3 — producing the three largest depletions and the only substantial restoration (S04's
   −6). The same film exhausts some and restores another. **L4.6 becomes L4.5's coda**, not an independent lane.

### L5. What the Laboratory Licenses

1. **The divergence index respecified.** Composite physiological engagement minus retrospective self-report, read
   **signed rather than absolute**. The old gaze-minus-EEG formula is void — it differences two measures of the
   same layer. The specification carries which channels may enter (pupil and eye closure, both Holm-surviving,
   both from raw per-sample data), which may not (anything rate-dependent), and the sensitivity sweep across all
   seven combinations. L1 ¶10's instruction governs: psychological constructs measured, FCM constructs
   interpreting, the seam visible in the definition itself.
2. **The three states, with an evidential ledger attached.** Restless search / occupied-but-hollow / withdrawn,
   plus **sleep-exit as a fourth terminal category**. **The asymmetry is named rather than hidden:** the withdrawn
   state has eye closure, the strongest surface in the analysis; occupied-but-hollow has the two-channel
   disagreement and the criterion analysis that makes it meaningful; sleep-exit has S05 abruptly and S08
   progressively, two routes to one endpoint; and **restless search is unsupplied** — for two reasons, the
   eye-in-head instrumentation and the protocol that asked Round 1 participants not to produce it. A proposal that
   reports which of its own parts it cannot support is harder to attack than one presenting four states as equally
   furnished.
3. **★ The withdrawal.** The claim that the inertial unit supplies the restlessness channel **is withdrawn**:
   head motion deferred by ruling; the streams present in only nine of twelve Round 2 cells with **one**
   participant having all three films, so no cohort statistic was ever available; and the channel it would have
   replaced was closed on validity rather than effort, optical flow from a first-person feed tracking the
   stimulus's visual richness where the background is a featureless void for two conditions in three. **What
   remains is a limitation, not a capability.** Future work at gesture scale: a body or face camera, or a textured
   surround for every condition, recorded deliberately.
4. **Back to the deployment.** What the survey could hear only as an echo, the laboratory shows as a measurable
   disagreement; and what the laboratory cannot show is what a cohort-scale deployment could.

### L6. Limits — reorganized into a shape, not a list

> **★ ADDED 2026-08-07 (author ruling): the headset's fit is a limit of the PLATFORM, not only of
> this analysis, and gets its own line in the body.** Heart rate and HRV were dropped because both
> sensors must rest against the forehead and the housing is shaped to a narrow range of facial
> structures; on a number of participants, most consistently those of Asian descent, it did not sit
> flush against the skin, so the required contact was never established. State it as a finding about
> the equipment that bears on any future study using it — a headset that cannot take a forehead
> reading from a substantial share of its users constrains what any deployment of it can measure.
> Stated in L2.10 as the reason for removal; L6 carries the forward-looking consequence.
> **Posture: this is a limit that has NOT been converted into an argument. State it and stop.**

**Body carries seven, in this order; the appendix carries the rest.** Each limit stated as a claim and stopped.
**Posture:** where a limit has been converted into an argument, say so; where it has not, state it and move on
without cushioning. Converting all of them reads as evasive.

1. **The scope, stated first because it is an argument (D-15).** This study measures the eye and the report and
   nothing else. Converted immediately: the published headline rested on the noisiest instrument and did not
   survive, while the strongest result comes from the simplest measurement available.
2. **Restlessness, unmeasured for two independent reasons (D-30).** Gaze is eye-in-head; and Round 1 participants
   were instructed not to produce the movement, an instruction not given in Round 2. The second is a design
   choice, not a sensor limitation. The author's observation that movements occurred anyway enters here, marked as
   observation, carrying no claim.
3. **Viewing order (D-22, D-24).** Confounded by design in ten of twelve, for a documented reason that is itself
   evidence about the stimulus; the two-participant control stated as a check; **and the carryover hypothesis
   reported alongside the data that does not support it** — exhaustion half-supported (S05 +5, S01 0), degradation
   of the subsequent experience not supported, the interesting film that followed rated less boring (3.50 against
   4.83) and felt shorter (15.0 against 22.7 min). n = 2 against n = 6, descriptive; contrast effect flagged, not
   asserted.
4. **The instrument mismatch — the limit that is also the finding.** The self-report channel was built to
   operationalize a definition requiring an environmental culprit, and the section reads it as the depth channel
   of a form that denies one. Both true; saying both is stronger than choosing.
5. **The statistical bounds.** Twelve participants across two instrument generations, no formal power; Round 2
   descriptive at four; **episode-level throughout** so nothing time-locks experience to signal; coefficients
   describing this group with no population estimate behind them. **Two additions:** the engaged composite is a
   **mixture**, half of it a channel that does not agree with the reports; and **closure propensity varies
   enormously between people** — 0.9% against 74% on the same film — which the within-subject scoring handles for
   every test but not for the raw cross-participant comparisons, including the order control.
6. **The non-replication.** Clinical's position does not hold across rounds; in Round 2 the engaged extreme is the
   interesting film.
7. **Category caution as a frame requirement (0b, D-33), not modesty.** Attunement cannot be ascertained and ought
   not to be; no measurement here evidences profound boredom and none is claimed to.

**Appendix:** the window difference and its own answer · the Round 1 closure proxy · **the blink ceiling's
gaze-position dependency (L2.5)** · EEG N=8 permanently, HRV excluded and recoverable, cognitive load and HR
appendix-only with their flatness printed · **half the measure space**, the missing half named, Yuvaraj the
nearest published work holding it · DA-08, individualist by construction against a cohort · laboratory ↔
deployment transfer · the criterion family carries no multiplicity correction, by choice (`O-14`).

### L7. Close

1. **The two halves joined — mapped onto the three forms.** A retrospective survey is a single channel, and a
   single channel can attest only the first form; that is what the deployment's data holds, honestly. Two channels
   that can disagree about one experience are what the second form requires, because its surface is genuinely
   occupied and would deny boredom if asked; the laboratory supplies them, and the disagreement is the second
   form's structural grammar rather than its mood. **The third form neither study reaches, and the reason is
   principled rather than instrumental** — an attunement cannot be ascertained and ought not to be. The two
   studies together map how far instrumented evidence extends: further than the field has taken it, and less far
   than the field would like.
2. **★ The Part III coda.** The two halves establish different kinds of thing. The deployment tested the frame's
   vocabulary against the sparest authored world in the dissertation, at cohort scale, and the vocabulary held.
   The laboratory tested whether a philosophical account can be brought to data collected under a different and
   partly incompatible definition and read out of it what the collecting definition could not name. The first is a
   frame surviving contact with evidence; the second is a frame doing work on evidence — **which is what this Part
   carries forward, and why the divergence is a demonstration rather than a measurement.**
   **Cautions:** do not re-argue; "demonstrated" never "prove," to the last line; and do not echo the desktop's
   closing construction.

---

## D. The O-11 collision — corrected

**There are two different O-11s.** The **lab** register's O-11 was "accept as a stated limit that Round 1 measures
the eye only," resolved as **D-15**. The **desktop** register's O-11 is "dissertation-level conclusion inside M7.2
versus a separate coda." From here the desktop's is **the arc-close question**, never referred to by number.

**The arc-close question is answered in substance by the arc ruling of 2026-07-29** — desktop first, laboratory
second, coda at L7.2. So the dissertation-level close happens in this section and desktop M7.2 stays section-scale
as drafted. **L7.2 is therefore the gate on three deferred desktop items:** M2.3's revision, the arc-close
question itself, and the M7.1-versus-III-5 three-state harmonization. Drafting L7.2 unblocks all three.

## E. Open decisions — 3, none blocking

| # | Question | Where |
|---|---|---|
| O-06 | How much of the published studies to re-present against cite | L1 ¶8, under the 4–5 pp cap |
| O-14 | Multiplicity in the criterion family — recommendation is a footnote | L2.8 (`******`) |
| O-15 | IRB-facing survey wording | L2.2, L2.8 (`******`) |

**Adopted by continuation (D-35), reversible:** O-04 the within-episode time course stays out of the prose ·
O-05 the per-participant matrix goes to the appendix · O-07 prior exposure is a footnote.
**Closed:** O-03 (D-38) · O-11 (§D).

## F. Source availability and retrieval hazards

**Now fully indexed and quotable at claim level:** King & Salvo P1 (2023), Eastwood (2012), Fahlman (2013), Mugon
(2020), van den Brink (2016), VanderWerf (2003), FCM (330 clauses), plus the three group entries. **Ten
new-format entries, all PASS E1–E14.**

**Absent, cited from the published reference lists without quotation:** the clinical-immersion lineage (Yazdi;
Singh, Ferry and Mills; Kotche; Stephens; Kadlowec; Guilford; Miller and Higbee; Mittal; Brennan-Pierce; Sawyer;
King, Hoo, Tang and Khine), the program's own 2022 ASEE platform paper, Kolb and Kolb, Yelamanchili, Altrabsheh,
Fisher (1936). Web and media — NAE, OSTP, the HP Omnicept documentation, Adobe, the three stimulus films.

**Retrieval hazards.** `bor-sec-40` (Jaques) resolves under `Intelligent Tutoring Systems.pdf`. The Mansikka paper
appears twice, once misattributed to Standish; `bor-sec-18` is Mansikka. Duplicate ingestions across `boredom/`
and `biomedical_engineering/` mean archon's reported path may not match the folder the index entry names.
Elpidorou & Freeman resolves in two documents with divergent pagination — MLA cites the chapter in the volume.
Slaby's chapter is ingested as a standalone whose PDF pages start at 1 against published pp. 101–120.

## G. Verification

**Verified EXACT:** Eastwood's definition and his environmental-attribution condition · P1's adopted-definition
sentence and its stimulus rationale · FCM "that which holds us in limbo and yet leaves us empty" (pp. 84–85) ·
**"There is nothing at all to be found that might have been boring about this evening, neither the conversation,
nor the people, nor the rooms" (pp. 107–108, running head p. 107, `cl-heidegger-fcm-1929-007`; the SHORT form
also resolves in Slaby)** · "it arises from out of Dasein itself" (pp. 126–127, bbox p126) · the three attunement
passages (F-15) · VanderWerf's blink-duration sentence **including its "(Fig. 3A)" parenthetical**, p. 2786.

**Verified against the tables:** S07's answer sheets · the four divergent episodes · ten of twelve bored within
five minutes with three inside one · S05's 449.231 s and S08's 124.547 s against Round 2's longest of 29.7 s ·
the composite definition in code · the full viewing-order table · the per-participant closure values · S08's
thirds by overlap allocation · the depletion counts · both published reference lists · the 55-unit strand
structure.

**`RE-PIN` before drafting:** the published gaze cohort's composition · Parhi's year · L1 ¶9's six counts against
the regenerated synthesis layer · FCM `claim-133`'s locus (cites p. 233, passage at p. 223) · every FCM locus
from the running head, never computed.

**Never carry unmarked:** the OCR corruption *entelectly* in the clause behind FCM `claim-146`.

## H. Doctrine locks

Chain-node walkthrough is THE analytical form · **NO-STALL** · **GREATEST-DESIRE** · "demonstrated" never
"prove" · **potentiality always actualized within a narrowed field (0c)** · standing sweeps before every batch
(sentence-initial *And* / "record" as evidence-name / "pole" / ladder / stall / cost-price-spend metaphors / bare
"incorporation" / vague paragraph frames) · scientific-direct register · MLA · *Rhetorica* in Aristotle
parentheticals · no module labels in rendered text · bare ¶-numbers when presenting · verification-gated ·
backups to `.backups/` · **PII: `S01`–`S08` and `R2-01`–`R2-04` only; Round 1 source filenames carry participant
names, so paths are never reproduced in output** · forks in prose, never polls · ultracode off · **American
spelling** · **nothing committed without explicit sign-off**.

## I. Workflow

**Next: Step A's tail, then Stage P.** Drafting in 1–3 ¶ batches with an approval gate per batch, bare ¶-numbers
when presenting, under FCDP. **Fable 5 at xhigh — the author switches the model personally and is notified before
L1 drafting begins.**

---

## Z. What changed from v5 + v6 → v7

| v5 / v6 | v7 | Why |
|---|---|---|
| Two documents, v6 an amendments layer over v5 | **One standalone spec** | v6's own recommendation; drafting from two documents is a defect waiting to happen |
| L3.2 corrected to 10-of-12 sleep-fight; **L4.3 left at "12 of 12"** and v6 §F affirmatively preserved L4.3 | **D-37 propagated to BOTH L3.2 and L4.3** | propagation gap found 2026-08-06 |
| D-11 sign flip enumerated for L3.3, L3.1, L3.6; **L3.10 left in the openness direction** | **L3.10 restated in the closure direction** (0.074/0.096; 0.148/0.788; boring *above* interesting 12/12) | same |
| L4.2's arousal objection cited "clinical openness … far above boring's" | restated as **closure … far below boring's** | D-11 |
| The definitional incompatibility argued in prose only | **DA-12 machine anchors named** (`ten-eastwood-…-01/-02`, `ten-fahlman-…-01`, `ten-king-salvo-…-04`, `cl-heidegger-fcm-1929-007`); 077 and 085 distinguished by the work each does | X-08 §4 regeneration |
| L1 ¶11 covered DA-04 | **DA-04 = the measurement half, DA-12 = the definitional half, exclusion operating first** | debate-map DA-12 |
| L1 ¶8's group claims argued from prose | **VR-PHEN and PROG-LINEAGE citable as collective records** | group entries imported |
| L1 ¶6 had two dual-measure precedents | **VanderWerf added as a third**, same shape as the pupil case | 2026-08-06 entry |
| Blink ceiling stated as licensed by VanderWerf | **plus its gaze-position dependency as a new limit** (L2.5, L6 appendix) | same |
| L3.9 case set without the swept counts | **R2-03 4/7, R2-04 3/7, S03 1/7 with baseline composites**; robustness conditional per case | D-5 of v6 |
| L3.5 gaze without X-06 | **N-18 and N-19 folded in**; per-participant assigned, uneven separation stated | D-12 revised |
| Method prose pointed at v1 files | **v2 files, with v1 marked never-paste** | inverted signs |
| O-03 open and located | **CLOSED (D-38)** — no disclosure, no hypothesis-awareness account | author ruling |
| Desktop debts: M4.1 ¶6, M3.6 | **plus M4.1 ¶7's "stillest episodes"**, a stillness claim 0d forbids | 2026-08-06 |
| 4 open decisions | **3** | O-03 closed |
