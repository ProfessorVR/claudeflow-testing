# Part III — Laboratory Boredom Section — MODULAR OUTLINE v4 (2026-08-05)

**Status:** Stage-2, walkthrough in progress. Nothing drafted. Module prefix **L**.

**Supersedes v3 (2026-08-04); v1, v2 and v3 are never edited.** §Z carries the v3→v4 delta.

**v4 exists because the section's argument got a spine.** v3 said the section is applied philosophy. v4 can say
what that means concretely and can source it: the data was collected under an explicit, cited, psychological
definition of boredom, and this section reads it under Heidegger's instead. That substitution is the section, and
the divergence the analysis reports is its demonstration rather than its measurement.

**All source retrieval is from the `archon-cli-v3` project and nothing else.** Binary
`/home/dalton/projects/archon-cli-v3/target/release/archon` (v1.3.11), store `archon-cli-v3/.archon/`, corpus
`archon-cli-v3/corpus/` (261 files, 9 subdirectories), index **`archon-cli-v3/index/`** — note it sits at the
project root, *not* under `corpus/`. Store verified 2026-08-05: **241 documents, 13,564 chunks, 18,238 pages,
0 failed, index queue empty.** The store was re-chunked under the new native extraction, so any chunk-level
reference predating 2026-08-05 is stale; page loci are better than before. `projects/archon-cli` is retired for
this work.

**American spelling throughout (S-01).** "center," never "centre."

---

## 0. What kind of section this is, and the constraints that govern every module

### 0a. ★ The section's argument, stated once and carried everywhere

The two published studies did not merely fail to bring a philosophical frame to their data. They brought a
different one, named it, and built the study on it. P1 states in its methods that it adopted Fahlman et al.'s
definition of boredom as **"the aversive experience of having an unfulfilled desire to be engaged in satisfying
activity,"** declares its focus to be *state* boredom, and selects its stimulus under the same authority:
**"State boredom often derives from information or environmental stimuli that is monotonous, redundant, and/or
meaningless. Thus, for our boring control sample, we selected a 1989 Microsoft Word tutorial."** Both sentences
verified EXACT against the store, 2026-08-05.

That definition is Eastwood's. Eastwood et al. define boredom in terms of attention: **"the aversive experience of
wanting, but being unable, to engage in satisfying activity,"** the state that occurs when one cannot engage
attention, wants to participate in satisfying activity, and **"attribute[s] the cause of our aversive state to
the environment"** — their own example being *this task is boring*. Both verified EXACT.

**The two definitions are incompatible at a locatable point, and the point is the section's hinge.** Eastwood's
third condition requires the bored person to attribute the cause to the environment. Heidegger's second form
denies precisely that: **"There is nothing at all to be found that might have been boring,"** and what is boring
**"arises from out of Dasein itself"** rather than from outside. The third form leaves no particular want to be
unfulfilled at all. Verified EXACT, FCM pp.107–108 and pp.126–127.

**Two consequences, both load-bearing.**

*First, the published studies could only ever have detected the first form,* because their operative definition
builds the first form's structure into the construct — a nameable culprit in the environment and a
wanted-but-blocked activity. That is not a criticism of the studies; it is what their definition licenses.

*Second, the section's contribution is a demonstration rather than a measurement.* The instruments captured
something the definition governing their own collection could not name. Prioritizing Heidegger's definition over
the operative one is what makes that visible, and the keystone therefore appears as a **divergence** — the survey
asks first-form questions, the physiology does not know that, and where the two part company is where a
non-first-form structure is operating. **What this section demonstrates is what philosophy reveals when applied
to scientifically collected and statistically analyzed data.**

Every module must be legible as one of two moves: *here is what the measurement shows*, or *here is what that
measurement means once Heidegger's definition is the operative one*. Where a module mixes them, the seam is made
visible — which is also the concordance's own instruction, to use the psychological constructs for measurement
and the FCM constructs for interpretation without claiming an equivalence the literature does not support.

### 0b. Head movement
Present in this data — visible in the session video, where the head rolls roughly 90° and pitches far enough down
to take the film out of view — and **not instrumented in this pass**: both rounds record gaze eye-in-head, not
head pose (F-03). The section must **never** say the boring film produced stillness rather than restlessness. The
accurate form: *the eye channels show withdrawal, and the search behavior visible in the session video was not
instrumented in this pass.* Binds L3.4, L4.3, L4.4, L5.3, L6 and every caption carried across. See X-05 — the
overlay pass is the route beyond this, and no current wording may anticipate it.

### 0c. Criterion probabilities
Every criterion-validity probability is a **within-subject permutation p** — 20,000 shuffles of the three film
labels inside each participant, fixed seed (D-09). Three associations clear alpha analytically and do not clear
it under permutation; they are reported as non-significant. No analytic p is ever quoted as the result.

### 0d. Retrieval protocol
Index entry first → `archon docs search` → `archon docs verify-quote`, **gated on EXACT MATCH**, not on "found";
the PDF only where archon cannot resolve. Fuzzy hits above 95% have been observed returning unrelated boilerplate,
so fuzzy is never sufficient. The shell resets its working directory between calls, so every invocation must `cd`
to `/home/dalton/projects/archon-cli-v3` in the same command. FCM page loci are **read from the running head, never
computed** — the offsets against the desktop draft's existing citations are not constant, confirmed 2026-08-05.

---

## A. What this section INHERITS and must never re-derive

| Inherited | Source | Note |
|---|---|---|
| The three forms of boredom, in rendered prose | desktop **M4.1 ¶¶4–7** | one ¶ per form; scenes explained, evidence-requirements worked, the *channel* term defined. English form-names. **Refer and apply; do not re-expound.** |
| The channel term | desktop M4.1 ¶4 | "any independent way an experience shows itself in evidence" |
| The chain A₀→A₄, rhetorical incorporation, world-/co-disclosedness, veri(dis)similitude | Parts I–II | restate as formula, never re-argue |
| The two-channel rule | desktop **M2.3** | introduced there as a rule |
| The corrected layer assignment | FCM bridge **§4** | physiology = **occupied surface**; retrospective self-report = **hollow depth**. **L4.2 qualifies it twice in v4 — see there.** |
| Vocabulary source | FCM entry + construct-crosswalk §1/§4 | **NOT** Part II v4 |

**Standing correction owed to the desktop section.** `DESKTOP-M4-DRAFT-v1.tex` M4.1 ¶6 and `DESKTOP-M3-DRAFT-v1.tex`
M3.6 carry `STALE-2` markers citing the superseded keystone. Revised once, after this section is drafted, to
whatever L3.6 and L4.2 settle.

## B. What this section MUST REDEEM (desktop M7.1 hand-forward)

1. **The divergence-instrumented three-state proposal.** **L5 pays this; L5.3 states what it does not pay.**
2. **The unbuilt FCM-phenomenology × instrumentation combination.** **L1.4 supplies the warrant**, now on
   definitional as well as bibliographic evidence.
3. **The harmonization.** This section carries the full three-state statement; `III-5-Design-DRAFT-v1.tex`'s
   gesture wording is superseded by it.

---

## C. Modules

### L0. Introduction (six moves; thesis LAST) — 9–11 ¶¶

- **L0.1 Hook.** S07's answer sheet: bored 6 and engaged 7 on the clinical film, bored 7 and engaged 6 on the
  interesting one. The instrument that allowed two answers got two. Verified against `out/survey-episodes.csv`.
  The count — four such episodes across three participants — is held for L3.7.
- **L0.2 Context.** Three literatures and a word they share. For twenty-four years a phenomenological literature
  has asked what boredom discloses and a psychophysiological literature what boredom looks like in a signal, and
  they do not cite one another — not selectively, at all. The laboratory's own studies stand in a third lineage,
  clinical-immersion engineering education — **and took their definition of boredom from the second.**
- **L0.3 ★ Disruption, rebuilt on the definitional finding.** The laboratory's own evidence had not been read, and
  the reason is structural rather than accidental. The EEG headline came from one clean participant and is a full
  negative at N=8. The published gaze feature is rate-bound and the archived Round 1 telemetry cannot support it
  as defined. The test the design implied had not been computed. Beneath all three: **the study measured boredom
  under a definition that could not name what it found.**
- **L0.4 Resolution and methodology.** The reprocessing across four cohorts, the two questions kept apart from the
  outset, and above them the substitution that organizes the section — Heidegger's definition prioritized over the
  operative one, with the divergence as the demonstration. State the genre here.
- **L0.5 Signpost.** On M0.4's model: whose data, what supplies findings against what supplies interpretation,
  then a numbered walk through seven parts. Count pinned at first complete draft.
- **L0.6 Thesis, last.** Three connected parts.
  *First*, the second form of boredom is instrumentable, and this laboratory instruments it — the eyes place the
  clinical film with the interesting one and away from the boring one, while the participants' own reports place
  it nearer the boring end.
  *Second*, that divergence is sayable only because the same channels agree with the reports elsewhere, so parting
  company on one film is a finding rather than noise; and it is *legible* only under a definition of boredom the
  study that collected the data did not use.
  *Third*, what the laboratory licenses is a three-state instrument with a fourth terminal category, together with
  an honest statement of which states this pass could evidence and which it could not.
  All under category caution: episodic structural grammar, never a *Grundstimmung* claim.

### L1. The Three Literatures — 12 ¶¶, 4–5 pp (D-14)

*Backbone = `archon-cli-v3/index/Boredom Secondary (Part III)/` — 55 units in 7 strands, plus the debate map
(11 axes), construct-measure concordance, citation network and scholarly-evolution analysis. Supporting:
`VR Pedagogy Secondary (Part III)`, `Heidegger - The Fundamental Concepts of Metaphysics`,
`Virtual Learning Environments (King–Salvo)`.*

**Compression map for the second pass:** load-bearing and not to be cut — **¶1, ¶8, ¶9, ¶10, ¶11**. Foldable —
¶2 into ¶3, ¶7 into ¶5, ¶4 to two sentences, ¶12 to a footnote if DA-01 goes uncontested. That path lands L1 at
about eight paragraphs.

- **¶1 · The organizing claim.** Two literatures under one word for twenty-four years; the only connection is one
  author citing himself across his own two programs plus a single critical footnote. The laboratory's studies
  stand in a third lineage **and drew their operative definition of boredom from the second** — which is what
  makes the disjointness matter here rather than merely being a fact about a field.
- **¶2 · The phenomenological literature, as reception not exposition.** M4.1 renders the three forms. This adds
  what the reception contributes: Elpidorou and Freeman on whether profound boredom is boredom at all
  (`bor-sec-04`), the dispute over whether it or Angst is the fundamental attunement (DA-03), and Slaby
  (`bor-sec-13`) on boredom as the other side of existence — the reading that makes the surface-over-depth
  structure legible, and which works the same FCM passage this section's hinge rests on.
- **¶3 · Film, and why this literature reaches this paradigm.** Quaranta (`bor-sec-10`) on film viewership as
  being-in-the-world through Heideggerian boredom, with Hernández Albarracín (`bor-sec-11`) beside it. The
  stimulus here *is* film, watched under mandate, in a headset. Closest philosophical precedent in the cluster to
  the actual experimental object.
- **¶4 · Boredom and education.** Mansikka (`bor-sec-18`) as the first unit in the strand; Thomson (`bor-sec-19`)
  on ontological education with his misattribution warning; Gibbs (`bor-sec-07`) on profound boredom as
  pedagogical opportunity; Feldges, Mertel and Aroles and Küpers named compactly. The strand that makes boredom a
  pedagogical question rather than only a metaphysical one.
- **¶5 · The EEG literature.** Kim (`bor-sec-28`) and its null — thirteen participants, no significant correlation
  between self-report and any physiological feature. Barry (`bor-sec-27`) on alpha as a global arousal marker
  rather than a topographic index, which undercuts frontal-asymmetry boredom indices. Yuvaraj (`bor-sec-33`),
  2025, the only first-party EEG study in an educational setting and therefore the nearest neighbor, carrying its
  own gap — no resting baseline, which sidesteps Barry rather than answering him. Miyauchi, Perone, Yakobi, Seo
  compactly.
- **¶6 · The eye-tracking literature, and what pupil indexes.** Holmqvist (`bor-sec-36`), the minimal reporting
  guideline the method module is measured against. Scharinger (`bor-sec-38`, **2015 not 2019**) on pupil dilation
  and alpha as load indices. **van den Brink et al. (2016) on pupil diameter tracking lapses of attention**
  (D-18). Together: pupil indexes load and attention, not boredom-as-reported — the anchor that turns L3.5's
  pupil null into an answer. Charoenpit, Sharma, Jaques, GazeMotive, Cheval and the metrics review compactly.
- **¶7 · The negative through-line.** Kim's null, Perone's unsupported first hypothesis, Yakobi's mutually
  uncorrelated markers, Nacke's non-separating flow subscale (`bor-sec-44`), Miyauchi's alpha indexing appraisal
  rather than boredom. This section's EEG negative is characteristic of the literature, not anomalous within it.
  Without this, L3.8 reads as apology.
- **¶8 · ★ The lineage the two published studies stand in — and the definition they took from it.** The
  clinical-immersion tradition, cited from the papers' own lists. The vendor's developer documentation as the
  instrument reference. Then the paragraph's two real moves. **First**, the definitional adoption: P1 states it
  adopted Fahlman's definition, focused on state boredom, and chose the boring stimulus because state boredom
  derives from monotonous, redundant or meaningless material. Fahlman's definition is Eastwood's; the lineage runs
  Eastwood (2012) → Fahlman (2013) → P1 (2023) → the data this section reprocesses. **Second**, the redemptive
  half: the 2023 paper already cites phenomenology of virtual reality — Morie (2008), Heinzel and Heinzel (2010),
  Tham et al. (2018), **all three now in the corpus and quotable** — and uses it as framing rather than as an
  interpretive frame for its own data. The program reached for the right vocabulary without yet having the
  literature that would have connected it. **N-02 approved:** the observation that the two papers engage one of
  the fifty-five indexed units is stated as description of where the program stood, with the
  phenomenology-of-VR citations in the same paragraph doing the redemptive work.
- **¶9 · The originality warrant, bibliographic.** Route 1, construct-based: 22 units treat profound boredom, 19
  carry a hard instrument, **intersection empty**. Route 2, bridge-based: 21 carry an FCM bridge edge, 19 a
  hard-instrument edge, **intersection empty**; the unit ranges barely touch. No source in 55 both reads FCM and
  measures with EEG or eye-tracking.
- **¶10 · ★ The originality warrant, definitional — new in v4 and stronger than ¶9.** The concordance's hole:
  Heidegger's three forms are reachable by self-report and nothing else, and that one instrument is precisely the
  one the phenomenological tradition says cannot in principle access an attunement — awakened, not ascertained —
  and the one the empirical literature shows does not correlate with any physiological signature. The most
  important populated cell is a negative: profound boredom by self-report exists only because Elpidorou and
  Freeman argue the proneness scales do not measure it. **v4 adds the reason underneath:** the instruments in that
  grid were built to operationalize a construct defined by environmental attribution, and two of Heidegger's
  three forms deny environmental attribution by construction. The literatures are disjoint at the instrument
  boundary because they are disjoint at the *definitional* boundary. That is a contribution to claim and defend,
  not to assume.
- **¶11 · DA-04, and why the criterion analysis does not violate it.** The cluster refuses the question of which
  channel is really boredom; the consequence adopted is to report both and validate neither against the other.
  Scoring for agreement is not certifying one against the other — it measures coincidence, which is a finding, and
  the channels rank oppositely on the two questions, which demonstrates neither reduces to the other. Kim is the
  precedent for expecting disagreement: no significant association at thirteen participants against four surviving
  at twelve here, and the disagreement is reported rather than resolved.
- **¶12 · The construct's own parents, and the state/trait partition.** Eastwood (2012) and Fahlman (2013) as the
  definition and its operationalization; Mugon et al. (2020) on boredom proneness and self-control in achievement
  settings; Elpidorou's regulatory corrective (`bor-sec-25`, `bor-sec-26`) and DA-01, deficit against functional.
  The guard against citing "boredom is good" without the partition, and what keeps L4.6's depletion material from
  over-reading. DA-07 named here because L4.5 takes a side on it.

**What this costs, stated rather than allowed to happen quietly:** the eleven Hadjioannou chapters get a footnote
at most; strands C and F fold into ¶¶5–7 as names; roughly thirty-five of the fifty-five units appear as
citations without discussion. The works cited carries all of them.

**Prerequisite before drafting L1:** the synthesis layer is read; the ~17 individual unit entries that get worked
prose are not. Each needs its entry read and every quotation verified EXACT through archon before it enters a
paragraph.

### L2. The Apparatus and the Data — method

- **L2.1 Four cohorts, never conflated.** The published pilot (N=3, one clean EEG participant, ASEE 2023 #37129);
  the published gaze study (N=12 as published, ASEE 2024 #44685); Round 1 (N=8, `S01`–`S08`); Round 2 (N=4,
  `R2-01`–`R2-04`). Pooled here: **N=12 = 8 + 4**, thirty-six episodes. **The two twelves are different twelves**,
  and v4 can date it: the 2024 paper's access dates are January 2024, Round 2 was recorded that March (F-11).
- **L2.2 ★ The instrument, and the definition it was built under.** Seven items per episode in the break
  immediately after each film (R-07): fatigue-prior, boredom (1–9), engagement (1–9), minutes-until-bored,
  sleep-fight, felt duration, fatigue-after. Boredom and engagement asked as **two separate items, not a bipolar
  axis** — the design choice that makes within-instrument divergence observable. Derived: felt-duration ratio,
  depletion. Free text throughout: 239 bare numbers, 5 converted, 1 recovered from prose, 5 semantic, 2 missing,
  every interpretation logged with its raw string. Structural missingness stated: participants who never became
  bored are absent from minutes-until-bored by design.
  **The correction v4 makes:** Fahlman is **not** the item lineage. Fahlman is the *definition*, and the items
  operationalize it — which means the self-report channel is an instrument of the first-form construct. That is
  stated here and used twice later, at L4.2 and L6.
  `O-15` marks the IRB-facing wording.
- **L2.3 The stimuli, with the rationale from the paper itself.** Three 17-minute films, all treated equally
  (R-06); the clinical-centered framing was an IRB and publication necessity. Sources for the works cited, from
  the published lists (D-17): boring = Whamtan, "THE MOST BORING VIDEO EVER MADE (Microsoft Word tutorial,
  1989)," YouTube, 20 April 2014; interesting = The Why Files, "How to Build a Working UFO | Alien Reproduction
  Vehicles (ARVs)," 8 December 2022; clinical = UCI Virtual Reality, "Spinal Deformation," 11 April 2022. The
  published rationale, verified EXACT, belongs here because it shows the stimulus was chosen under the operative
  definition — monotonous, redundant or meaningless material, plus the assumption that students already knew
  Microsoft Word and that an obsolete interface would raise the likelihood of state boredom (R-08).
- **L2.4 Two engines, two axis conventions, two sampling regimes.** Round 1 Unreal (X forward), Round 2 Unity
  (Z forward) (F-01). Round 1 median 3.00 Hz, Round 2 120.1 Hz. **Poolability rule with its measurement:** means
  of per-sample values pool; variances, dispersions and windowed statistics do not, and recomputing the identical
  gaze feature on Round 2 decimated to Round 1's rate moves it by 0.65–0.84×. Consequences: blink rate is Round 2
  only; the two rounds' closure scales are harmonized before any pooled signed-rank test.
  **The sampling seam (F-10, N-02 approved):** the published paper states 120 Hz citing the vendor's
  documentation — the sensor's rate. Round 1's archived telemetry logs at ~3 Hz; Round 2 is the first round in
  which every attached sensor polled and logged at 120 Hz. The published five-point window therefore spans ~42 ms
  at the sensor's rate and ~1.5 s at Round 1's logging rate. Stated as a fact about logging, never as an error.
  EEG band power follows Welch's method per Parhi and Ayinala (2014) — **now in the corpus**; note the 2023 paper
  cites it as 2013, and *IEEE TCAS-I* 61.1 is a January 2014 issue, so the year is pinned at drafting.
- **L2.5 The closure surface and its proxy (D-11).** **Named eye closure throughout**: *the proportion of the
  episode during which the eyes were shut*; for Round 1, *the proportion during which the tracker could not obtain
  a valid read of both eyes*, licensed by a check inside Round 2 at **Pearson r = 0.998** across twelve cells.
  Without that agreement the pooled result could not be stated, which is why the argument is made in the open.
  Round 2's channel is **binary at source** — 3,416,362 per-eye samples, values {0,1} only — so the threshold is
  not a tuned parameter and blink against extended closure rests entirely on duration. Blink ceiling 500 ms, from
  VanderWerf et al.'s 334 ± 67 ms, recorded while participants watched video. Round 1 episodes are read from the
  per-eye sentinel, the parser masking it to NaN being correct for pupil and fatal for closure. Measured against
  Holmqvist's reporting guideline, which ¶6 introduces. The surface enters the engaged composite with a negative
  sign. `O-02 resolved.`
- **L2.6 Two window conventions.** Round 1's middle ~13.6 minutes against Round 2's whole film. The film began on
  "open your eyes" and stopped on "close your eyes," so the window **is** the stimulus interval (F-08). Both the
  full crop (primary) and a Round-1-matched window are carried through the same tests; the result belongs in L3.3.
- **L2.7 Viewing order (F-09).** The published protocol fixed the order at interesting → clinical → boring,
  because early experiments showed the boring film raised exhaustion and degraded what followed. Archived data
  confirms it: **ten of twelve ran interesting → clinical → boring; S01 and S05 ran clinical → boring →
  interesting.** Order is very largely confounded with stimulus. Answered at L3.10, limited at L6.3.
- **L2.8 The criterion-validity method.** Paste from `PROSE-METHODS-CRITERION-VALIDITY-v1-2026-08-04.md`, §A or
  §B. Do not rewrite. `O-14` and `O-15` are the two `******` markers. **Placement (D-13):** the two-questions
  distinction is introduced in L0.4, restated compactly here, and applied without re-explanation at L3.5.
- **L2.9 The gaze baselines (D-12).** Neither primary; each assigned to the question it answers — fixed forward
  for stimulus separation, per-file median for agreement with self-report, every result naming its baseline. Full
  log, justification and drafting-ready prose: **`PROSE-METHODS-GAZE-BASELINE-v1-2026-08-04.md`**. The
  per-participant baseline's absence from the criterion family is stated until X-06 runs.
- **L2.10 What each channel can and cannot say.** Load-bearing: pupil, eye closure, gaze, the seven-item
  self-report (R-05). **Cognitive load appendix-only** — vendor-computed, flat against both items (rho −0.09 and
  +0.11, permutation p 0.65 and 0.60). **Heart rate and HRV removed** — measurement failed for some participants
  owing to facial and head structure; HR flat (rho +0.09 and +0.04, p 0.68 and 0.86). Rulings evidenced, not
  asserted. EEG a full negative (L3.8). Standing reporting rule: directional convergence plus the surfaces that
  reach significance, never per-channel significance for channels that do not; n < 6 labeled descriptive; at n = 4
  the signed-rank floor is p = 0.125. `O-08` marks how much apparatus the prose carries against the appendix.

### L3. The Findings

- **L3.1** Ninety-nine pairwise contrasts; **nine survive Holm, every one on eye closure, pupil dilation, or
  excursions beyond 10° per minute**. Carried by the eye-tracking surfaces, not spread across the channel set.
  Nothing omitted for being non-significant.
- **L3.2 ★ Eye closure — the headline surface.** Pooled N=12: Friedman p = 0.0004; boring below clinical **11 of
  12** (Holm 0.0020, rb −0.974), below interesting **12 of 12** (Holm 0.0015, rb −1.000). Round 1 alone 7/8 and
  8/8; Round 2 alone 4/4, descriptive. Window-invariant; unmoved by the re-crop; and it fills what the cluster's
  concordance records as documented non-coverage. Episode counts: 4,365 Round 1 (3,501 blink-length, 864
  extended), 5,131 Round 2 (4,895 blink, 236 extended).
- **L3.3 Pupil — second, weakened by pooling.** Round 1 a perfect separation, 8 of 8, Friedman 0.0302, Wilcoxon
  0.0078, rb −1.000. Pooled **10 of 12**, Holm 0.0146, rb −0.872, omnibus 0.097 full window and **0.017 matched**.
  Round 2 alone 2 of 4, chance. Two honesties: the pooled result is substantially carried by Round 1, and pupil
  separates boring from clinical but **not** boring from interesting (Holm 0.303).
- **L3.4 ★ Gaze — amplitude and frequency point opposite ways.** Amplitude higher on the boring film and the
  component that tracks self-report; frequency — departures beyond 10° per minute — **lower**, 7 of 8 on both
  contrasts at **Holm p = 0.047**, the first gaze result here to survive correction. Fewer but longer departures
  when bored; frequent short repositioning when engaged. Three cautions, none droppable: eye-in-head;
  rate-dependent and never pooled; every result names its baseline per D-12.
- **L3.5 ★ Criterion validity.** Thirty-six paired episodes, within-subject standard scores both sides, Spearman
  reported with Pearson alongside, permutation probabilities throughout. **Four survive:** gaze deviation median
  against boredom (+0.524, p 0.0074) and engagement (−0.527, 0.0075); eye closure against boredom (−0.460,
  0.0212) and engagement (+0.416, 0.0370). **Pupil tracks neither** (−0.172, 0.404; +0.036, 0.861) though it
  separates the films most powerfully. Three that clear alpha analytically do not clear it under permutation. One
  borderline case runs against the reported statistic and is stated. **The finding is the oppositional ranking.**
- **L3.6 ★ The three-film decomposition.** Composite A (pupil + eye closure), every participant placed on **each**
  film:

  | film | divergent | both engaged | both bored | inverse |
  |---|---|---|---|---|
  | Boring | 0 | 0 | **9** | 3 |
  | **Clinical** | **8** | 4 | 0 | **0** |
  | Interesting | 3 | 5 | 2 | 2 |

  Safe form: the eyes place the clinical film with the interesting one and away from the boring one, while the
  survey places it nearer the boring end. Composite B gives 7/3/1/1 on clinical, so **A is cleaner and adding gaze
  does not strengthen the keystone**. Category counts; no omnibus test. `O-05` decides the appendix matrix.
- **L3.7 The self-report instrument on its own terms.** Boredom separates the films (Friedman 0.0139); engagement
  more strongly (0.0052; boring against interesting Holm 0.0176); sleep-fight sharpest (**12 of 12**, Holm
  0.0059); minutes-until-bored separates boring from clinical (Holm 0.0293). **Felt duration does not separate at
  all** (0.32) yet is dilated in **25 of 36 episodes**. **Ten of twelve became bored on the boring film, all
  within five minutes, three inside one minute.** Within-instrument divergence in **4 of 36 episodes across 3
  participants**.
- **L3.8 EEG as a full negative, read against its own literature.** **Zero of five surfaces at Friedman p < 0.05;
  zero of fifteen contrasts through Holm.** Keystone concordance 4 of 8, chance. Retention 62.3% (36.3–74.4%,
  three of twenty-four below 50%). No cell excluded for being noisy, because the retention figures are the
  evidence for the ruling. ¶7 does the interpretive work. **O-01 resolved (D-16):** both halves told, in order —
  dropped for scaling, then the reprocessing established what it could have carried; and agreement with
  self-report was asserted qualitatively in the published work and is computed here for the first time, per
  channel, with a clustering-corrected probability.
- **L3.9 The case set.** S05 — one continuous closure of **449.2 s** from 245.4 s in, eye validity 21.2%, kept as
  data, the episode reported as five minutes against seventeen. S08 — **124.5 s**, also on the boring film. S04 —
  the inversion, boredom 1 and engagement 7 on the boring film with fatigue 7 → 1, against 9 and 1 on the clinical
  film, her minutes-until-bored void by ruling (R-09). S03 — onset at 25 seconds, the episode reported as an hour.
  S06 — bored by the interesting film (8 and 2). R2-03 — never became bored by anything (3/1/2 against 6/8/8).
  S07 — within-instrument divergence on two of three films. Round 2's longest closure is 29.7 s, so S05's and
  S08's are not the same kind of event.
- **L3.10 The order confound and the two participants who answer it.** Ten of twelve saw the boring film last, so
  a critic will read the closure result as the end of a session. Three things answer it and all three are stated.
  **S01 and S05 saw the boring film second and the interesting film last**, and in both the boring film still
  carried the lower eye-open fraction (S01 0.904 against 0.926; S05 0.212 against 0.852) — the opposite of what a
  fatigue account predicts. **S05's 449 s closure occurred mid-session, not at its end.** And boring sits below
  interesting in **12 of 12**, so the effect is not carried by the out-of-order pair. At n = 2 this is a
  descriptive internal control; it does not dissolve the confound. `N-04 still open.`

### L4. The Analysis — chain-node walkthrough (THE analytical form)

- **L4.1 The chain in the laboratory.** A₀ = strapped into a headset under mandate, no leisure motive; A₁/A₂ = the
  charged image; A₃ = committed interest; **A₄ crossed always, because the chain runs always** — the only
  potentiality furnished is watching, and the diagnosis concerns the worth of what is furnished. The laboratory is
  a *Hingehaltenheit* apparatus by design, and felt duration shows it: dilated in 25 of 36 episodes with **no
  separation between films**. Quaranta is the philosophical precedent, already in play from ¶3.
- **L4.2 ★★ The second form, instrumented — with two qualifications, both load-bearing.** The layer assignment
  argued: Heidegger's surface is outward comportment, his depth an emptiness recognized only retrospectively, and
  the post-film self-report **is** that retrospective recognition; behavioral engagement is not evidence against
  boredom but in this form the very medium of it.
  **The reverse case, absorbed rather than deferred:** zero reverse cases at N=12 under the primary composite; the
  sweep over all seven subsets produces one or two under four of the seven, R2-03 recurring. R2-03's own answers
  explain it — boredom 3, 1, 2 and engagement 8 on clinical; they never became bored by anything, so their
  clinical episode is their own relative minimum, and *reverse* is a within-subject relative statement throughout.
  **First qualification (from L3.5):** two eye channels **do** track the reports across all thirty-six episodes.
  That does not undercut the divergence; it is what makes it sayable — a channel that tracked nothing could not be
  said to diverge. The confined claim: instruments that agree with the person at rho ≈ 0.5 across their three
  films part company with them on one film. The composite is itself a mixture on that point, closure tracking the
  report and pupil not, and the mixture is stated rather than smoothed.
  **★ Second qualification, new in v4 and the section's sharpest move:** the self-report channel is an instrument
  of the *first-form* construct (L2.2). Its items were written under a definition requiring a nameable
  environmental cause. So when a participant rates the clinical film bored while their eyes read engaged, what
  the instrument has recorded is a retrospective recognition arriving through an item that only knows how to ask
  about culprits — which is exactly the second form's signature, registered by an instrument built to miss it.
  The divergence is therefore not an artifact of a mismatched instrument; it is what a mismatched instrument
  produces when the structure it cannot name is present. **This is where the section's argument and its evidence
  meet, and it is the paragraph to get right.**
- **L4.3 The first form — the *Zeitvertreib* claim moves from the body to the eye.** The report side behaves as
  predicted: onset within five minutes in 10 of 12, three inside a minute, sleep-fight 12 of 12. **And it would,
  because the instrument was built for it** — L2.2's point returns here as the reason the first form is
  over-detected rather than merely well-detected. v1's "searching gaze as *Zeitvertreib* operationalized" is
  withdrawn: the amplitude/frequency split says the eye departs **further** but **less often**, a few long
  excursions rather than continuous search. Passing the time is constrained here as it is not at Heidegger's
  station — no leaving, no timetable, no walking — so the counter-move has almost nowhere to go but the body and
  the eye. What it looked like beyond the eye is what this pass did not instrument.
- **L4.4 The third form, as analog only — better evidenced, under harder caution.** Eye closure is the strongest
  surface in the analysis; S05's 449.2 s and S08's 124.5 s are extended withdrawals of a different order from any
  blink; felt duration is dilated in 25 of 36 episodes; the frequency result gives the zombie-stare account its
  first correction-surviving measurement. **Because the analog is better evidenced, the caution binds harder.**
  Episodic structural grammar only; a seventeen-minute film cannot produce a form whose scope is beings as a
  whole. ¶10 defends the restraint: no source in fifty-five instruments profound boredom, and DA-02 and DA-03
  show the literature disputing whether the third form is boredom and whether it or Angst is the fundamental
  attunement — so the refusal to claim an instance is a position in a live debate, not a hedge. Sleep-exit remains
  its own terminal category: boredom's escape, not its depth; the entranced while requires a held witness, and
  S05 stopped being one.
- **L4.5 Against stimulus-essentialism — the anomaly set.** S04's inversion; S06's boredom on the interesting
  film; R2-03, whom nothing bored; S03's extremity; the four within-instrument divergent episodes; and the
  round-level non-replication, clinical at the engaged extreme in Round 1 while in Round 2 the engaged extreme is
  the interesting film. The same footage bores, engages, restores and repels. Boredom is a **relation**, not a
  property (FCM §§20–22), and **DA-07** is the axis this takes a side on. **The definitional point returns:** the
  operative definition locates the cause in the environment, and the anomaly set is the evidence against that
  location. `O-07` decides prior exposure's status; strata remain near-indistinguishable on clinical at 8
  against 4, descriptively.
- **L4.6 The aftermath.** Depletion after the boring film as the one lane running laboratory → philosophy: FCM
  treats boredom as disclosive and never as depleting, and Elpidorou's regulatory account is the other side of
  that argument, which is why ¶12 precedes this. `RE-PIN` the depletion counts from `out/survey-episodes.csv`;
  v1's "6/8" is a Round-1-era figure under a different definition and the pooled item does not separate the films
  (0.3965), so the claim is descriptive at episode level or not at all. S04's −6 is the counter-instance.

### L5. What the Laboratory Licenses

- **L5.1 The divergence index respecified.** Composite physiological engagement minus retrospective self-report,
  read **signed rather than absolute**. The old gaze-minus-EEG formula is void — it differences two measures of
  the same layer. The specification carries which channels may enter (pupil and eye closure, both Holm-surviving,
  both from raw per-sample data), which may not (anything rate-dependent), and what the sensitivity sweep showed.
  ¶10's instruction governs: the index measures psychological constructs and is interpreted through FCM
  constructs, with the seam visible in the definition itself.
- **L5.2 The three states made concrete.** Restless search / occupied-but-hollow / withdrawn, plus **sleep-exit as
  a fourth terminal category**. What each needs and what this study holds: the withdrawn state has eye closure;
  occupied-but-hollow has the two-channel disagreement and the criterion analysis that makes it meaningful;
  sleep-exit has S05; **restless search is the state this pass could not instrument.**
- **L5.3 ★ The withdrawal.** The claim that the inertial unit supplies the visible-restlessness channel and
  supersedes the ch-obs rationale **is withdrawn**, on three grounds. Head motion is deferred by ruling. The
  inertial streams are present in only nine of twelve Round 2 cells, and a within-subject three-way comparison
  needs all three films from one participant — **only one has that**. And the channel it would have replaced was
  closed on validity rather than effort: optical flow from the first-person feed tracks the stimulus's visual
  richness rather than the participant's motion, the background being a featureless black void for two conditions
  in three. **What remains is a limitation, not a capability.** What it would take is a body or face camera, or a
  textured surround for every condition, recorded deliberately. Future work, gesture scale. **X-05 is the named
  route and no wording here anticipates it.**
- **L5.4 Back to the deployment.** What the survey could hear only as an echo, the laboratory shows as a
  measurable disagreement between two channels — and what the laboratory cannot show is what a cohort-scale
  deployment could.

### L6. Limits

- **L6.1** Gaze is **eye-in-head, not head pose**; confirmed three ways including the overlay, where the head
  rolls ~90° and pitches far down while the gaze marker stays near frame center; Round 2's combined gaze never
  exceeds 38.8°.
- **L6.2** Head movement is deferred and is where disengagement is visible. In the permitted form only.
- **L6.3** **Viewing order.** Ten of twelve saw the boring film last, by the published protocol's own design.
  L3.10 gives the internal control; **what remains is that the design cannot separate order from stimulus.** The
  protocol's reason is itself evidence: the order was fixed *because* the boring film degraded what followed.
- **L6.4** The window difference between rounds; measured rather than assumed, and the measurement is the limit's
  own answer.
- **L6.5** The Round 1 closure proxy is a validity flag, not a measurement of the eyelid; licensed at r = 0.998
  and still a proxy, sitting underneath the headline surface.
- **L6.6** N=12 across two instrument generations, no formal power; Round 2 alone n = 4 and descriptive.
- **L6.7** The criterion comparison is **episode-level throughout**; nothing time-locks a moment of experience to
  a moment of signal, and the coefficients support no population estimate.
- **L6.8** Clinical's position **does not replicate** across rounds.
- **L6.9** EEG N=8 permanently; HRV excluded from both rounds and recoverable; cognitive load and heart rate
  appendix-only with their flatness printed.
- **L6.10** This dataset instruments about half the measure space the literature uses; the missing half —
  connectivity, resting baselines, blink at Round 1, behavioral performance, ML classification — is named, and
  Yuvaraj is the nearest published work holding the half this one lacks.
- **L6.11 ★ NEW — the self-report channel was built under a definition this section does not adopt.** The items
  operationalize environmental attribution, and the section reads them as the depth channel of a form that denies
  it. That is a real limit on what the instrument can be asked, and it is stated as one. It is also, per L4.2, the
  condition that makes the divergence legible — so the limit and the finding are the same fact seen twice, and
  saying so is stronger than choosing one.
- **L6.12** Category caution — episodic structural grammar, never a *Grundstimmung* claim. No learning-outcome
  claims.
- **L6.13** DA-08: the canonical account is individualist by construction; the participants here are a cohort.
- **L6.14** Laboratory ↔ deployment transfer limits.

`O-11` governs L6.1–L6.2 and lands its other half at L7.2.

### L7. Close

- **L7.1** The two halves joined: what the deployment could hear only as echo, the laboratory shows as divergence.
- **L7.2 ★ Part III coda + dissertation-level close.** Desktop M7.2 stays section-scale as drafted, and is the
  expansion site only if the arc resolves that way.

---

## D. Open decisions — 11

**Resolved:** O-01 → D-16 · O-02 → D-11 · O-09 → D-14 · O-10 → D-17 · O-11 → D-15 · O-12 → D-12 · O-13 → D-13 ·
N-02 → approved, ¶8 and L2.4 · N-03 → D-18 · N-05 → the 12-¶ architecture above · **the definitional argument →
D-19.**

| # | Question | Where | Status |
|---|---|---|---|
| O-03 | The two ASEE works-cited entries; co-author/participant surname overlap | L1 ¶8, L2.1 | at assembly |
| O-04 | Within-episode time course — computed, never reported | L3.7 | open |
| O-05 | Per-participant matrix as an appendix | L3.6 | shaped by D-14 |
| O-06 | How much of the published studies to re-present | ¶8 | constrained by the 4–5 pp cap |
| O-07 | Prior exposure — variable or footnote | L4.5 | open |
| O-08 | How much apparatus the prose carries against the appendix | L2.10, L3 | body/appendix split needs specifics |
| O-14 | Multiplicity in the criterion family | L2.8 (`******`) | at drafting |
| O-15 | IRB-facing survey wording | L2.2, L2.8 (`******`) | at drafting |
| N-01 | Source acquisition | — | **discharged** for the nine; the remaining ~14 are cited from the published lists without quotation |
| N-04 | Viewing-order presentation — findings plus control, or limits alone | L3.10, L6.3 | **open** |
| **N-06** | **NEW — drafting model.** Fable at xhigh for prose; Opus for the physiological analysis. Practical note in §F. | Stage 3 | **open** |

## E. Source availability

**Now in the corpus and quotable** — the nine ingested 2026-08-04/05: Fahlman (2013), Eastwood (2012), Mugon et
al. (2020), Morie (2008), Heinzel and Heinzel (2010), Tham et al. (2018), Meyer, Omdahl and Makransky (2019),
Tamim et al. (2011), Parhi and Ayinala (2014). None yet carries a group index entry, so retrieval for these runs
`docs search` → `verify-quote` without an entry to consult first.

**Cited by the published studies and still absent** — cite from the published reference lists without quotation:
the clinical-immersion lineage (Yazdi; Singh, Ferry and Mills; Kotche; Stephens; Kadlowec; Guilford; Miller and
Higbee; Mittal; Brennan-Pierce; Sawyer; King, Hoo, Tang and Khine), the program's own 2022 ASEE platform paper,
Kolb and Kolb, Yelamanchili, Altrabsheh, and Fisher (1936). Web and media references — NAE, OSTP, the HP Omnicept
developer documentation, Adobe, and the three stimulus films — are cited from the papers' entries.

**Retrieval hazards.** `bor-sec-40` (Jaques) resolves under `Intelligent Tutoring Systems.pdf`, byte-identical to
the file the index names (md5 `d531a4d6…`). The Mansikka paper appears twice, once misattributed to Standish;
`bor-sec-18` is Mansikka and Standish is never cited for that text. Duplicate ingestions across `boredom/` and
`biomedical_engineering/` mean archon's reported path may not match the folder the index entry names.

## F. Drafting model (N-06)

The author's preference is **Fable at xhigh effort for all drafting**, so the argumentation is strongest and the
linguistic style matches, with Opus retained for the physiological analysis. Practical notes: the session model is
switched with `/model`, and the cleanest arrangement is to switch to Fable when Stage 3 begins, since drafting is
the whole task at that point. Nothing in this material should trip a safeguard — it is ordinary human-subjects
research reported under an IRB protocol with label-only PII discipline — and the drafting inputs are already
summary statistics rather than raw physiological records, which the outline and the two methodological statements
supply directly.

## G. Verification

**Verified EXACT through archon, 2026-08-05:** Eastwood's definition (p.1) and his environmental-attribution
condition; P1's adopted-definition sentence and its stimulus rationale; FCM "that which holds us in limbo and yet
leaves us empty" (pp.84–85, bbox p84), "There is nothing at all to be found that might have been boring"
(pp.107–108, bbox p107, also in Slaby), "it arises from out of Dasein itself" (pp.126–127, bbox p126).
**Verified against the v4 tables, 2026-08-04:** S07's answer sheets; the four divergent episodes; ten of twelve
bored within five minutes with three inside one; S05's 449.231 s and S08's 124.547 s against Round 2's longest of
29.7 s; the composite definition in code; the full viewing-order table; the per-participant closure values behind
L3.10; both published reference lists; the 55-unit strand structure.
**`RE-PIN` before drafting:** depletion counts (L4.6); the published gaze cohort's composition (L2.1); Parhi's
year; every FCM locus from the running head, never computed — the offsets are not constant.

## H. Doctrine locks

Chain-node walkthrough is THE analytical form · **NO-STALL** · **GREATEST-DESIRE** · "demonstrated" never
"prove" · standing sweeps before every batch (sentence-initial *And* / "record" as evidence-name / "pole" /
ladder / stall / cost-price-spend metaphors / bare "incorporation" / vague paragraph frames) · scientific-direct
register · MLA · *Rhetorica* in Aristotle parentheticals · no module labels in rendered text · bare ¶-numbers when
presenting · verification-gated · backups to `.backups/` · **PII: `S01`–`S08` and `R2-01`–`R2-04` only** · forks
in prose, never polls · ultracode off · **American spelling (S-01)** · **nothing committed without explicit
sign-off**.

## I. Workflow

Stage 2 (this outline) → walkthrough, module by module → Stage 3 guided drafting in **1–3 ¶ batches with an
approval gate per batch**, bare ¶-numbers when presenting, **Fable at xhigh**.

---

## Z. What changed from v3 → v4

| v3 | v4 | Why |
|---|---|---|
| "Applied philosophy" stated as genre | **§0a**: the specific substitution — Heidegger's definition prioritized over the Eastwood/Fahlman definition the data was collected under, with all six anchor quotations verified EXACT | the definitional finding, author-approved |
| — | **The incompatibility located**: Eastwood's environmental-attribution condition against the second form's "nothing at all to be found" | both texts now in the corpus |
| — | **The published studies could only have detected the first form** — stated as a consequence of their definition, not as a criticism | ditto |
| L0.3 disruption = evidence unread | **plus the reason**: the study measured boredom under a definition that could not name what it found | ditto |
| L1 ¶8 = lineage + phenomenology-of-VR trio as `******` | **¶8 carries the definitional adoption**, and the trio is quotable | nine documents ingested |
| ¶9 = the warrant | **¶9 bibliographic + ¶10 definitional**, the second stronger | the disjointness has a cause |
| ¶12 = Elpidorou only | **plus Eastwood, Fahlman, Mugon** as the operative construct's parents | ingested |
| L2.2 named Fahlman as the item lineage | **corrected**: Fahlman is the *definition*; the items operationalize it; the self-report channel is an instrument of the first-form construct | verified from P1's methods |
| L2.3 stimuli identified | **plus the published rationale**, verified EXACT, showing the stimulus was chosen under the operative definition | ditto |
| L2.4 sampling seam | **plus Parhi (2014)** as the band-power method source, with the year discrepancy flagged | ingested |
| L2.5 "eye openness" | **"eye closure" throughout (D-11)**, negative sign in the composite | O-02 approved |
| — | **L2.9** carries D-12's baseline assignment and points at the gaze-baseline statement | O-12 approved |
| L4.2 one qualification | **two** — the second being that the survey is a first-form instrument, which is why the divergence is legible rather than an artifact | the definitional finding |
| L4.3 first form well-detected | **over-detected, and why** | ditto |
| L4.5 anomaly set | **plus the definitional point**: the operative definition locates the cause in the environment and the anomaly set is evidence against that location | ditto |
| L6 thirteen limits | **fourteen**, adding L6.11 — the self-report channel was built under a definition the section does not adopt, which is both a limit and the condition of the finding | ditto |
| index at `corpus/index/` | **`archon-cli-v3/index/`**, project root; store re-chunked, 241 docs / 13,564 chunks | v3 self-sufficient |
| British spellings throughout | **American (S-01)** | author ruling |
| 18 open decisions | **11**, with N-06 added for the drafting model | seven resolved |
