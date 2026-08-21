# Part III — Laboratory Boredom Section — MODULAR OUTLINE v3 (2026-08-04)

**Status:** Stage-2 proposal, for author walkthrough. Nothing drafted. Module prefix **L**.

**Supersedes v2 (same date), which supersedes v1 (2026-07-29). Neither earlier file is edited.** §Z carries the v2→v3
delta; §Y carries the v1→v2 delta, retained so the chain reads without opening three files.

**v3 exists because v2 mistook the section for a statistical report with a philosophical gloss.** It is the
reverse. This section is **applied philosophy**: a phenomenological and rhetorical-ontological frame interpreting
quantitative data collection and analysis. The numbers are evidence for a reading of boredom; they are not the
finding. v2's literature module was five bullets citing eleven sources. The corpus holds **fifty-five indexed
units in seven strands**, three of the author's own published papers with their full reference apparatus, an
eleven-axis debate map, a construct-measure concordance grid, and a four-movement scholarly-evolution analysis.
v3 rebuilds L1 on that material and re-weights the whole section around it.

---

## 0. What kind of section this is, and the constraints that govern every module

**0a. Applied philosophy — the section's own genre.** The two published studies asked whether an instrument could
separate three films. This section asks what boredom *is* in the situation the laboratory built, and uses the
instruments as evidence for that answer. The philosophical frame is not decoration on a results section and the
statistics are not an appendix to a philosophical essay. Each module must be legible as one or the other of two
moves: *here is what the measurement shows*, or *here is what that measurement means under the frame*. Where a
module mixes them, the seam is made visible rather than papered over — which is the concordance's own standing
instruction: use the psychological constructs for measurement and the FCM constructs for interpretation, and keep
the seam showing rather than claiming an equivalence the literature does not support.

**0b. Head movement.** Head movement is present in this data — visible in the session video, where the head rolls
roughly 90° and pitches far enough down to take the film out of view — and it is **not instrumented in this pass**:
both rounds record gaze eye-in-head, not head pose (F-03). The section must **never** say the boring film produced
stillness rather than restlessness. The accurate form, used wherever this arises: *the eye channels show
withdrawal, and the search behaviour visible in the session video was not instrumented in this pass.* Binds L3.4,
L4.3, L4.4, L5.3, L6, and every figure caption carried across.

**0c. Criterion probabilities.** Every criterion-validity probability is a **within-subject permutation p** —
20,000 shuffles of the three film labels inside each participant, fixed seed (D-09). Three associations clear
alpha analytically and do not clear it under permutation; they are reported as non-significant. No analytic p is
ever quoted as though it were the result.

**0d. Retrieval protocol — archon first, always.** All quotation retrieval, locus pinning and verification goes
through the archon-cli store, which carries the most current ingestion and index-entry processing. Binary
`/home/dalton/projects/archon-cli-v3/target/release/archon` (v1.3.11), store `archon-cli-v3/.archon/`, **233
documents / 15,447 chunks / 18,109 pages**, verified this session. Order of operations: **index entry first, then
`archon docs search` for the passage, then `archon docs verify-quote` to pin page and bbox, then the PDF only if
archon cannot resolve it.** Gate on `match_kind`, never on `found`. Entry pdf-page loci run one to two high, so
always re-pin. The shell resets its working directory between calls, so every archon invocation must `cd` to the
v3 project directory in the same command.

---

## A. What this section INHERITS and must never re-derive

| Inherited | Source | Note |
|---|---|---|
| The three forms of boredom, in rendered prose | desktop **M4.1 ¶¶4–7** | one ¶ per form; Heidegger's scenes explained, evidence-requirements worked, the *channel* term defined. English form-names only. **Refer and apply; do not re-expound.** |
| The channel term | desktop M4.1 ¶4 | "any independent way an experience shows itself in evidence" |
| The chain A₀→A₄, rhetorical incorporation, world-/co-disclosedness, veri(dis)similitude | Parts I–II | restate as formula, never re-argue |
| The two-channel rule | desktop **M2.3** | introduced there as a rule |
| The corrected layer assignment | FCM bridge **§4** (revised 2026-07-29) | physiology = **occupied surface**; retrospective self-report = **hollow depth**. Grounded in `fcm-05` §§24–28. **L4.2 qualifies it — see there.** |
| Vocabulary source | FCM entry + construct-crosswalk §1/§4 | **NOT** Part II v4 |

**Standing correction owed to the desktop section.** `DESKTOP-M4-DRAFT-v1.tex` M4.1 ¶6 and `DESKTOP-M3-DRAFT-v1.tex`
M3.6 carry `STALE-2` markers citing the superseded keystone. Those spans are revised once, after this section is
drafted, to whatever wording L3.6 and L4.2 settle. The structural point at both sites survives; only the naming of
the two channels was wrong.

## B. What this section MUST REDEEM (desktop M7.1 hand-forward)

1. **The divergence-instrumented three-state proposal.** **L5 pays this, and L5.3 states what it does not pay.**
2. **The unbuilt FCM-phenomenology × instrumentation combination.** **L1.4 supplies the warrant**, now on far
   stronger evidence than v1 or v2 had.
3. **The harmonization.** This section carries the full three-state statement; `III-5-Design-DRAFT-v1.tex`'s
   gesture wording is superseded by it.

---

## C. Modules

### L0. Introduction (six-move structure; thesis LAST)

Working shape 9–11 paragraphs. O-09 touches this first and the rest of the section scales from it.

- **L0.1 Hook.** S07's answer sheet: asked boredom and engagement as two questions rather than one axis, the
  participant returned **bored 6 and engaged 7 on the clinical film**, and **bored 7 and engaged 6** on the
  interesting one. The instrument that allowed two answers got two. Verified against `out/survey-episodes.csv`.
  The count — four such episodes across three participants — is held for L3.7.
- **L0.2 Context, rebuilt.** Not "two published studies and a ceiling," but **three literatures and a word they
  share**. For twenty-four years a phenomenological literature has asked what boredom discloses and a
  psychophysiological literature has asked what boredom looks like in a signal, and they do not cite one another —
  not selectively, at all. The two published laboratory studies stand in a third lineage again, the
  clinical-immersion engineering-education tradition, and cite almost nothing from either. The desktop deployment
  reached its ceiling with one channel. That is the situation this laboratory enters.
- **L0.3 Disruption.** The laboratory's own evidence had not been read. The EEG headline came from one clean
  subject and is a full negative at N=8 across every surface and contrast. The published gaze feature is
  rate-bound, and the archived Round 1 telemetry cannot support it as defined. The test the design implied —
  scoring each channel against the participants' own reports — had not been computed. **O-01 governs how this is
  said** (see §D).
- **L0.4 Resolution and methodology, rebuilt as applied philosophy.** The reprocessing across four cohorts, with
  the two questions kept apart from the outset — does a channel separate the films, and does it agree with the
  person — and, above that, the frame that makes either question interpretable. State the genre here explicitly:
  a phenomenological account supplies the constructs, the instruments supply evidence about them, and neither is
  reduced to the other. This is also where the concordance's instruction enters the prose: the psychological
  constructs are what the instruments measure, the FCM constructs are what the section interprets, and the seam
  between them stays visible.
- **L0.5 Signpost.** Modelled on M0.4 — whose data this is and how it was collected, what supplies the findings
  against what supplies the interpretation, then a numbered walk through the parts. Seven parts here. Part-count
  pinned at first complete draft, as M0.4's was.
- **L0.6 Thesis, last.** Three connected parts:
  first, the second form of boredom is instrumentable, and this laboratory instruments it — the eyes place the
  clinical film with the interesting one and away from the boring one, while the participants' own reports place
  it nearer the boring end;
  second, that divergence is sayable only because the same channels agree with the reports elsewhere, so parting
  company on one film is a finding rather than noise, and the channel that separates the films most powerfully is
  not among the channels that agree with the person;
  third, what the laboratory licenses is a three-state instrument with a fourth terminal category, together with
  an honest statement of which states this pass could evidence and which it could not.
  All of it under category caution: episodic structural grammar, never a *Grundstimmung* claim.

### L1. The Three Literatures — LIT-SLOT, REBUILT AND MUCH ENLARGED

*Desktop M1.5's deferred boredom slot lands here. Backbone = `corpus/index/Boredom Secondary (Part III)/` — **55
units in 7 strands**, plus `_synthesis/`'s debate map (11 axes), construct-measure concordance, citation network
and scholarly-evolution analysis. Supporting clusters: `VR Pedagogy Secondary (Part III)` (34 entries),
`Heidegger - The Fundamental Concepts of Metaphysics`, `Virtual Learning Environments (King–Salvo)` (units
vle-00…05). v1 and v2 cited eleven units; v3's floor is the full strand structure, with depth allocated by
O-09.*

**Organizing claim for the whole module, and it is citable rather than asserted:** two literatures grew in
parallel under one word for twenty-four years, and the section's own studies stand in a third. The module is
built to demonstrate that and then to occupy the space it opens.

- **L1.1 The phenomenological literature — what boredom discloses.** Strand A (14 units) and Strand B (5),
  with Strand G (11 chapters from Hadjioannou's *Heidegger on Affect*) supplying the affect-theoretic
  surround.
  - The FCM three-form account itself is inherited from desktop M4.1 and never re-expounded here; what L1.1 adds
    is the **reception**: Slaby's two readings (`bor-sec-13` on boredom as the other side of existence,
    `bor-sec-12` on living in the moment); Elpidorou and Freeman's two-part *Affectivity in Heidegger*
    (`bor-sec-02`, `bor-sec-03`); Aho on deep boredom and the inability-to-be (`bor-sec-01`); Hughes on
    monotony (`bor-sec-08`); Mihačević (`bor-sec-09`); Zabalo (`bor-sec-14`); Elpidorou's phenomenological
    conspectus (`bor-sec-06`).
  - **Quaranta (`bor-sec-10`) is newly load-bearing and v1/v2 both missed it**: film viewership as
    being-in-the-world, read through Heideggerian boredom. This section's stimulus is film, watched under
    mandate, in a headset. It is the closest philosophical precedent in the cluster to the actual paradigm, and
    it belongs in the prose rather than in a citation list. Hernández Albarracín's cinematographic analytic
    (`bor-sec-11`) sits beside it. `VERIFY:` `bor-sec-11`'s author attribution is flagged in the manifest as
    needing confirmation.
  - **The education strand**: Mansikka (`bor-sec-18`) as the first boredom-and-education unit — **2008 online /
    2009 print, and the plan's earlier attribution of this paper to "Standish (2015)" is a mis-attribution the
    index already corrected**; Thomson's ontological education and its misattribution warning (`bor-sec-19`);
    Gibbs on profound boredom as pedagogical opportunity (`bor-sec-07`); Feldges's critical review
    (`bor-sec-16`); Mertel on Heidegger, technology and education (`bor-sec-17`); Aroles and Küpers on the
    digital *Gestell* (`bor-sec-15`).
  - **Debate axes this subsection must state rather than assume**: DA-02 (is profound boredom boredom at all),
    DA-03 (Angst against profound boredom as the *Grundstimmung*), DA-09 (mood against emotion), DA-11
    (Heidegger's philosophy against his politics). DA-02 and DA-03 bear directly on the category caution: if the
    literature itself disputes whether the third form is boredom, then this section's refusal to claim an
    instance of it is a position within a live debate rather than mere modesty.
- **L1.2 The measurement literature — what boredom looks like in a signal.** Strands C (7), D (7), E (8), F (3).
  This is the "detailed scientific review" and it is organised by **what each instrument was shown to index**,
  because that is what the section needs from it.
  - **Psychology and cognitive science (C)**: Raffaelli et al.'s review (`bor-sec-21` — the one unit either
    published study cites); Tam et al.'s boredom feedback model (`bor-sec-22`); Darling's predictive-processing
    account (`bor-sec-20`, a theory-model and not an instrument, which the concordance is explicit about);
    Murphy et al. on boredom, time and technology (`bor-sec-23`); Clark and Hassert on the opacity of
    metacognition (`bor-sec-24`) — which is the empirical counterpart to the phenomenological objection that
    reflective access distorts what it targets.
  - **EEG (D)**: Kim et al.'s combined gaze-and-EEG detection (`bor-sec-28`) — **and its null: N=13 with no
    significant correlation between self-report and any physiological feature**, which is the empirical half of
    DA-04; Miyauchi and Kawasaki on task-unrelated thought, where tonic theta differentiated boredom from
    dislike while phasic alpha did not (`bor-sec-29`); Perone et al. on frontal asymmetry across a boring task,
    whose first hypothesis was **not supported** (`bor-sec-30`); Seo et al. on machine-learning classification
    (`bor-sec-31`); Yakobi et al., where P3 and ERN proved mutually uncorrelated and the authors used that to
    reject a simple reduced-attention mechanism (`bor-sec-32`); Yuvaraj et al.'s 2025 connectivity study
    (`bor-sec-33`), the only first-party EEG study in an educational setting and therefore the nearest thing to
    this laboratory's own position; and **Barry et al. (`bor-sec-27`), whose eyes-open/eyes-closed decomposition
    underwrites DA-05** — alpha as a global arousal marker rather than a topographic index, which is the caution
    that undercuts frontal-asymmetry boredom indices, this section's own EEG negative included.
  - **Eye-tracking, gaze and pupillometry (E)**: Holmqvist et al.'s minimal reporting guideline (`bor-sec-36`),
    which is the standard this section's own methods module should be measured against, and which carries Van
    Orden's fixation-duration + blink-duration + pupil-diameter regression; Scharinger, Kammerer and Gerjets on
    pupil dilation and alpha as load indices (`bor-sec-38`, **2015 not 2019** per the index's dating
    correction); Charoenpit and Ohkura on emotion in e-learning (`bor-sec-35`); Sharma, Giannakos and
    Dillenbourg (`bor-sec-39`); Cheval et al. on attentional bias (`bor-sec-34`); the eye-tracking metrics
    review (`bor-sec-37`); Jaques et al. on predicting affect from gaze in a tutoring system (`bor-sec-40`); and
    GazeMotive (`bor-sec-41`).
  - **VR, immersion and engagement (F)**: Haj-Bolouri's phenomenology-inspired inquiry into immersive VR
    (`bor-sec-42`) — the only unit in the cluster that both reads Heidegger and works on VR, and it reads
    *Being and Time*, never the FCM; Lin et al. on VR and student engagement (`bor-sec-43`); Nacke and Lindley
    on flow and immersion, where the flow subscale did not separate the conditions (`bor-sec-44`).
  - **The through-line to state explicitly**: this literature's own results are substantially negative or
    partial — Kim's null, Perone's unsupported hypothesis, Yakobi's uncorrelated markers, Nacke's
    non-separating subscale, Miyauchi's alpha that indexes appraisal rather than boredom. That matters for how
    this section reports its own EEG negative: it is **not an outlier in this literature, it is characteristic
    of it**, and saying so converts an embarrassment into a contribution.
- **L1.3 ★ The lineage the two published studies actually stand in — NEW IN v3.** Built from the papers' own
  reference lists, read this session.
  - Both papers are grounded in the **clinical-immersion engineering-education tradition**: Kotche et al. on
    bioengineering clinical immersion; Mittal et al. on developing the virtual experience; Stephens et al.,
    Kadlowec et al., Guilford et al. on clinical-needs bridging courses; Brennan-Pierce et al. on pivoting to a
    virtual format; and the program's own prior work (King and Salvo 2022; the 2023 physiological study; the
    2025 scalable-VR paper). Much of this surround is already indexed in `VR Pedagogy Secondary (Part III)`.
  - **The 2023 paper cites phenomenology directly** — Morie on the ontological implications of being in
    immersive environments, Heinzel and Heinzel on the phenomenology of virtual reality, Tham et al. on
    presence, embodiment and professional practice. **This is the single most useful fact L1.3 carries:** the
    published lineage already reached for phenomenological vocabulary and used it as framing rather than as an
    interpretive frame for its own data. The section's applied-philosophy move is therefore a completion of its
    own program's instinct, not an import from outside it. `******` — none of those three sources is in the
    corpus (see §E).
  - **What the two papers do not cite.** Of the fifty-five indexed units, they cite **one**: Raffaelli et al.
    The self-report instrument's likely lineage — Fahlman et al.'s Multidimensional State Boredom Scale — is
    cited by both papers and is **not in the corpus**. Neither paper cites Kim, Miyauchi, Seo, Perone, Yakobi,
    Yuvaraj, Barry, Scharinger, Charoenpit, Sharma, Holmqvist, Jaques or GazeMotive; nor any unit of Strands A,
    B or G. The instrument documentation they lean on is the vendor's own Omnicept developer portal.
  - This is stated as a description of where the work stood, not as a fault. It is also the precise measure of
    what the reprocessing adds.
- **L1.4 ★ THE ORIGINALITY WARRANT — verified twice, and stronger than v1 claimed.**
  - **Route 1, construct-based:** 22 units treat profound boredom; 19 carry a hard instrument; **intersection
    empty.**
  - **Route 2, bridge-based:** 21 units carry an FCM bridge edge; 19 carry a hard-instrument
    operationalizes-measure edge; **intersection empty.** The unit-ID ranges barely touch — FCM-bridging units
    run `bor-sec-01`–`18` plus 23, 48, 51, 54, 55; hard-instrumented units run `bor-sec-21`–`41`.
  - **The arc is not a progression, and the cluster's data refutes the progression story three ways:** Movement
    3 does not cite Movement 1 at all; Movement 1 does not cite Movement 3 at all; the only connection is
    Elpidorou citing himself across his own two programmes, plus one critical footnote in Hughes. Two
    literatures under one word for twenty-four years.
  - **The concordance's hole is the section's own site.** Heidegger's three forms are reachable by self-report
    and nothing else; every hard-instrument column is empty for all three. Worse, the one instrument that
    reaches them is the one the phenomenological tradition says cannot in principle access an attunement — a
    *Grundstimmung* is awakened, not ascertained — and the one the empirical literature shows does not correlate
    with any physiological signature. The single most important populated cell is a negative: profound boredom ×
    self-report exists only because Elpidorou and Freeman argue the boredom-proneness scales do not measure
    profound boredom at all.
  - **The instruction the concordance issues, adopted here verbatim in substance:** do not claim the literatures
    converge; do not validate physiology against self-report; report the third form as un-instrumented; use the
    psychological constructs for measurement and the FCM constructs for interpretation, keeping the seam
    visible. `L1.4 is load-bearing for L4.4's category caution and for L5.1.`
  - **One honest qualification v3 adds:** this dataset instruments roughly half the measure space the
    literature uses. The half it lacks — connectivity, resting baselines, blink at Round 1, behavioural
    performance, machine-learning classification — is stated wherever this instrumentation is compared to the
    field's.
- **L1.5 DA-04, and why the criterion analysis does not violate it.** When the participant's report and the
  instrument disagree, which is boredom? The cluster refuses the framing, and this section adopts the
  consequence: **report both channels, validate neither against the other.** The criterion analysis is not a
  violation of that rule and L1.5 must say why. Scoring a channel for agreement with a report is not
  certifying the instrument against the person; it measures how far the two coincide, which is a finding in its
  own right. The channels rank oppositely on the two questions, which is the demonstration that neither reduces
  to the other. Kim's null (`bor-sec-28`) is the empirical precedent for expecting disagreement, and the
  contrast is instructive: at N=13 Kim found no significant correlation with any physiological feature, while
  this reprocessing finds four surviving associations — so the two studies disagree, and the disagreement is
  reported rather than resolved.
- **L1.6 Elpidorou's regulatory corrective and the state/trait partition.** `bor-sec-25` and `bor-sec-26`, with
  DA-01 as the axis: boredom as deficit against boredom as functional and adaptive. This is the guard against
  citing "Elpidorou says boredom is good" without the partition, and it is also what keeps the section's
  depletion material (L4.6) from over-reading. DA-06 (unified construct against heterogeneous family) and DA-07
  (monotony-caused against meaning-caused) belong here too; DA-07 in particular sets up L4.5's argument that
  boredom is a relation rather than a property.

`DEP:` L1.4 is load-bearing for L4.4 and L5.1. `DEP:` L1.5 is load-bearing for L3.5 and L4.2. `DEP:` L1.2's
negative through-line is load-bearing for L3.8.
`NOTE:` Parong and Makransky data points are already used in desktop M7.1 — coordinate, do not duplicate.
`NOTE:` DA-08's *anticipatory-application* marking (individually structured against collectively induced boredom)
travels to L6.

### L2. The Apparatus and the Data — method

*Renamed from v1's "The Apparatus and the Record": "record" may not name evidence. `scripts/boredom-o9/` may still
be called the **methodology of record**, which names a code path and not evidence.*

- **L2.1 Four cohorts, never conflated.** The published pilot (N=3, one clean EEG subject, ASEE 2023 #37129); the
  published gaze study (N=12 as published, ASEE 2024 #44685); the unpublished per-participant Round 1 dataset
  (N=8, `S01`–`S08`); and Round 2 (N=4, `R2-01`–`R2-04`). This reprocessing's pooled cohort is **N=12 = 8 + 4**,
  thirty-six episodes.
  **★ The trap this subsection closes:** the published gaze study's twelve and this analysis's twelve are two
  different twelves. **v3 can now say why with a date rather than a caveat:** the 2024 paper's own access dates
  are January 2024 and Round 2 was recorded in March 2024, so the published twelve cannot contain Round 2's
  four. The published twelve is a Round-1-era cohort of which eight have retained per-participant raw data.
  `VERIFY BEFORE DRAFTING:` confirm that reading against the paper's participant paragraph; it describes
  recruitment by programme rather than by count.
- **L2.2 The instrument.** Seven items per episode, administered in the break immediately after each film (R-07):
  fatigue-prior, boredom (1–9), engagement (1–9), minutes-until-bored, sleep-fight, felt duration, fatigue-after.
  Boredom and engagement asked as **two separate items, not a bipolar axis** — the design choice that makes
  within-instrument divergence observable. Derived: felt-duration ratio, depletion. Free text throughout: 239
  values read as bare numbers, 5 converted, 1 recovered from prose, 5 semantic, 2 missing, every interpretation
  logged with its raw string. Structural missingness stated rather than buried: participants who never became
  bored are absent from minutes-until-bored by design.
  **New in v3:** both published papers cite Fahlman et al.'s Multidimensional State Boredom Scale, so the
  instrument's lineage can be named — `******` the scale is not in the corpus and the claim needs a source
  before it enters prose. `O-15` marks the IRB-facing wording.
- **L2.3 The stimuli — and O-10 is RESOLVED.** Three 17-minute films, all three treated equally (R-06); the
  clinical-centred framing of the published work was an IRB and publication necessity and is not the analytic
  frame here. All three sources are named in the published reference lists and can now enter the works cited:
  the **boring** film is a section of Whamtan's "THE MOST BORING VIDEO EVER MADE (Microsoft Word tutorial,
  1989)," YouTube, 20 April 2014; the **interesting** film is The Why Files, "How to Build a Working UFO | Alien
  Reproduction Vehicles (ARVs)," YouTube, 8 December 2022; the **clinical** film is UCI Virtual Reality, "Spinal
  Deformation," YouTube, 11 April 2022. The published rationale is worth carrying: the boring sample was chosen
  on the assumption that students already knew the material and that outdated content would raise the likelihood
  of boredom — which is R-08's point that this is task-structured instructional content and not visually empty
  filler.
- **L2.4 Two engines, two axis conventions, two sampling regimes.** Round 1 in Unreal (X forward), Round 2 in
  Unity (Z forward), confirmed from the original MATLAB (F-01); a single hard-coded forward direction would give
  Round 1 a meaningless ~90° offset on every cell. Round 1's effective rate is a median 3.00 Hz, Round 2's 120.1
  Hz. **The poolability rule with its measurement:** means of per-sample values pool; variances, dispersions and
  windowed statistics do not, and recomputing the identical gaze feature on Round 2 decimated to Round 1's rate
  moves it by 0.65–0.84×. Consequences: blink rate is a Round 2 measure only, Round 1's 334 ms sampling interval
  being the mean duration of a blink; and the two rounds' openness scales are harmonised before any pooled
  signed-rank test.
  **★ New in v3, and it needs careful handling.** The published gaze paper states that gaze and pupil were
  measured at 120 Hz, citing the vendor's developer documentation. That is the **sensor's** rate. Round 1's
  archived telemetry logs at roughly 3 Hz, and Round 2 is the first round in which every attached sensor
  actually polled and logged at 120 Hz. The published feature — variance of a five-point rolling median — spans
  about 42 ms at the sensor's rate and about 1.5 s at Round 1's logging rate, so what Round 1 computed under that
  name is not the quantity the definition describes. Stated as a fact about logging rather than as an error in
  the paper, and it is the reason the gaze feature had to be rebuilt.
- **L2.5 The openness proxy — its own paragraph.** Round 1 has no continuous openness channel; its per-sample
  validity flag is the proxy, licensed by a check inside Round 2 where both measures exist, at **Pearson r =
  0.998** across twelve cells. Without that agreement the pooled openness result could not be stated at all,
  which is why the argument is made in the open. Round 2's openness is **binary at source** — 3,416,362 per-eye
  samples, values {0,1} only — so the threshold is not a tuned parameter and blink against extended closure
  rests entirely on duration. The blink ceiling is 500 ms, from VanderWerf et al.'s spontaneous blink of 334 ±
  67 ms, recorded while participants watched video, which matches this paradigm. Round 1 closure episodes are
  read from the per-eye sentinel, because the parser masks it to NaN — correct for pupil, fatal for closure.
  **Measured against Holmqvist et al.'s minimal reporting guideline (`bor-sec-36`)**, which L1.2 introduces, this
  is the subsection that has to satisfy it. `O-02` marks the naming of the surface.
- **L2.6 Two window conventions.** Round 1's window is the middle ~13.6 minutes; Round 2's crop is essentially
  the whole film. The film began on "open your eyes" and stopped on "close your eyes," so the window **is** the
  stimulus interval and the instructed closures are its boundaries (F-08). Because closure accumulates, the
  difference is measured rather than assumed away: both the full crop (primary) and a Round-1-matched window are
  carried through the same tests. The result belongs in L3.3.
- **L2.7 ★ Viewing order — NEW IN v3, and it is a first-order design fact.** The published protocol fixed the
  order at interesting, then clinical, then boring, on the stated ground that early experiments showed the boring
  video raised exhaustion and degraded subsequent viewing. The archived data confirms it and shows the
  exceptions: **ten of twelve participants ran interesting → clinical → boring; two (S01 and S05) ran clinical →
  boring → interesting.** Order is therefore very largely confounded with stimulus, and the boring film sits last
  in ten of twelve sessions. This must be stated in the method module and answered in the findings — see L3.10
  and L6.3. `O-04` is partly overtaken by this: viewing order is no longer optional analysis, it is a required
  disclosure.
- **L2.8 The criterion-validity method.** **Already written** — paste from
  `PROSE-METHODS-CRITERION-VALIDITY-v1-2026-08-04.md`, §A full form or §B short form. Do not rewrite. Two
  `******` markers are author decisions: `O-14` (multiplicity; the written recommendation is to keep it a family
  of descriptive associations and justify that in a footnote) and `O-15`. §C holds six anticipated objections
  with answers already in the text — defence material, not prose. **Placement is a drafting decision with
  consequences:** the distinction between separating the films and agreeing with the person must be introduced
  before the results, or the pupil finding reads as a failure rather than as the answer to a different question.
- **L2.9 What each channel can and cannot say.** Load-bearing: pupil, eye openness and closure, gaze, the
  seven-item self-report (R-05). **Cognitive load appendix-only** — vendor-computed from undisclosed inputs, flat
  against both items (rho −0.09 and +0.11, permutation p 0.65 and 0.60). **Heart rate and HRV removed** —
  measurement failed for some participants owing to facial and head structure; HR likewise flat (rho +0.09 and
  +0.04, p 0.68 and 0.86). Both rulings evidenced rather than asserted, which is why the flat numbers are
  printed. EEG reported as a full negative (L3.8). Standing reporting rule closes the module: directional
  convergence plus the surfaces that reach significance, never per-channel significance for channels that do
  not; anything below n = 6 labelled descriptive; at n = 4 the signed-rank floor is p = 0.125, so perfect
  separation is the strongest obtainable result. `O-08` marks how much apparatus the prose carries.

### L3. The Findings

- **L3.1 What the tests found, in one frame.** Ninety-nine pairwise contrasts; **nine survive Holm, every one on
  eye openness, pupil dilation, or excursions beyond 10° per minute**. The result is carried by the eye-tracking
  surfaces and is not spread across the channel set. Nothing omitted for being non-significant.
- **L3.2 ★ Eye closure — the headline surface.** Pooled N=12: Friedman p = 0.0004; boring below clinical in
  **11 of 12** (Holm p = 0.0020, rb −0.974), below interesting in **12 of 12** (Holm p = 0.0015, rb −1.000).
  Round 1 alone 7/8 and 8/8; Round 2 alone 4/4, descriptive. Window-invariant; completely unmoved by the
  re-crop; and it fills what the cluster's concordance records as documented non-coverage — blink and eye-closure
  had no measure in this dataset before. Episode counts for scale: 4,365 Round 1 closures (3,501 blink-length,
  864 extended) and 5,131 in Round 2 (4,895 blink, 236 extended).
- **L3.3 Pupil — second, and honestly weakened by pooling.** Round 1 alone a perfect separation, 8 of 8, Friedman
  p = 0.0302, Wilcoxon p = 0.0078, rb −1.000. Pooled: **10 of 12**, Holm p = 0.0146, rb −0.872, omnibus p = 0.097
  on the full window and **0.017 on the Round-1-matched window**. Round 2 alone 2 of 4, chance. Two honesties
  owed: the pooled result is substantially carried by Round 1, and pupil separates boring from clinical but not
  boring from interesting (Holm p = 0.303). Scharinger et al. (`bor-sec-38`) is the literature anchor for reading
  pupil as a load index rather than a boredom index — which is exactly what L3.5 then confirms.
- **L3.4 ★ Gaze — amplitude and frequency point opposite ways.** Amplitude, how far off centre the eye sits, is
  higher on the boring film and is the component that tracks self-report. Frequency, departures beyond 10° per
  minute, is **lower** on the boring film: 7 of 8 against clinical and 7 of 8 against interesting, both at **Holm
  p = 0.047**, the first gaze result in this study to survive correction. Fewer but longer departures when bored;
  frequent short repositioning when engaged — the measurable form of the zombie-stare against engaged-focus
  distinction the published work described qualitatively. Three cautions travel and none may be dropped: gaze is
  eye-in-head; the feature is rate-dependent and never pooled; the baseline choice is made in the open, with
  three references reported side by side and the finding, reported against prediction, that the per-file baseline
  correlates with self-report better than the faithful restoration (rho +0.52 against +0.36). `O-12` decides
  which is primary.
- **L3.5 ★ Criterion validity — does the channel agree with the person?** Thirty-six paired episodes,
  within-subject standard scores both sides, Spearman reported with Pearson alongside, permutation probabilities
  throughout. **Four associations survive:** gaze deviation median against boredom (rho +0.524, p = 0.0074) and
  against engagement (−0.527, 0.0075); eye openness against boredom (−0.460, 0.0212) and against engagement
  (+0.416, 0.0370). **Pupil tracks neither report** (−0.172, p = 0.404; +0.036, p = 0.861) although it separates
  the films most powerfully. Three associations that clear alpha analytically do not clear it under permutation
  and are reported as non-significant. One borderline case runs against the reported statistic and is stated as
  such. **The finding is the ranking, and the ranking is oppositional.** `O-13` decides the presentation.
- **L3.6 ★ The three-film decomposition — replaces the clinical-only keystone.** Composite A (pupil + eye
  openness, the two Holm-surviving surfaces, both from raw per-sample data rather than a vendor index), every
  participant placed on **each** film:

  | film | divergent | both engaged | both bored | inverse |
  |---|---|---|---|---|
  | Boring | 0 | 0 | **9** | 3 |
  | **Clinical** | **8** | 4 | 0 | **0** |
  | Interesting | 3 | 5 | 2 | 2 |

  Safe form, immune to the objection that the composite is partly a boring-detector: the eyes place the clinical
  film with the interesting one and away from the boring one, while the survey places it nearer the boring end.
  Composite B, adding gaze, gives 7/3/1/1 on clinical, so **A is cleaner and the hypothesis that gaze would
  strengthen the keystone is not supported** even though gaze is the best single channel against self-report.
  Category counts at N=12; no omnibus test. `O-05` decides the appendix matrix.
- **L3.7 The self-report instrument on its own terms.** Boredom separates the films (Friedman p = 0.0139);
  engagement more strongly (0.0052, boring against interesting Holm 0.0176); sleep-fight is the sharpest item
  (boring above interesting **12 of 12**, Holm 0.0059); minutes-until-bored separates boring from clinical (Holm
  0.0293). **Felt duration does not separate the films at all** (p = 0.32) and is dilated in **25 of 36
  episodes** — a finding about the situation, not about any film. **Ten of twelve became bored on the boring
  film, all within five minutes, three inside one minute.** Within-instrument divergence — both items at 5 or
  above — in **4 of 36 episodes across 3 participants**.
- **L3.8 EEG, reported as a full negative — and read against its own literature.** N=8 permanently. **Zero of five
  surfaces reach Friedman p < 0.05; zero of fifteen pairwise contrasts survive Holm.** Keystone concordance 4 of
  8, exactly chance. Retention averages 62.3% (36.3–74.4%, three of twenty-four cells below 50%). No cell
  excluded for being noisy, because the retention figures are the evidence for the ruling and removing the worst
  cells would remove the justification. **L1.2's through-line does the interpretive work here:** Perone's
  unsupported hypothesis, Yakobi's mutually uncorrelated markers, Miyauchi's alpha indexing appraisal rather than
  boredom, and above all Barry's demonstration that alpha moves as a global arousal marker rather than a
  topographic index — this negative is characteristic of the literature rather than anomalous within it. `O-01`
  decides the framing.
- **L3.9 The case set.** **S05** — one continuous closure of **449.2 s** beginning 245.4 s in, that cell's eye
  validity 21.2%, kept as data rather than discarded, the episode reported as five minutes against seventeen.
  **S08** — a single closure of **124.5 s**, also on the boring film. **S04** — the inversion: boredom 1 and
  engagement 7 on the boring film with fatigue 7 → 1, against boredom 9 and engagement 1 on the clinical film;
  her minutes-until-bored answer is void by ruling (R-09). **S03** — onset at 25 seconds, the episode reported as
  an hour. **S06** — bored by the interesting film (8 and 2). **R2-03** — never became bored by anything (3/1/2
  against 6/8/8). **S07** — within-instrument divergence on two of three films. For scale, Round 2's longest
  single closure is 29.7 s, so S05's and S08's are not the same kind of event.
- **L3.10 ★ The order confound, and the two participants who answer it — NEW IN v3.** Ten of twelve saw the
  boring film last, so time-on-task, fatigue and headset discomfort all accumulate toward it, and a critic will
  say the openness result measures the end of a session rather than the film. Three things answer that, and the
  section states all three rather than the convenient one. First, **S01 and S05 saw the boring film second and
  the interesting film last** — and in both, eye openness on the last-viewed interesting film is higher than on
  the boring film (S01 0.926 against 0.904; S05 0.852 against 0.212), which is the opposite of what a fatigue
  account predicts. Second, **the single most extreme withdrawal event in the corpus — S05's 449 s closure —
  occurred in the middle of a session, not at its end.** Third, the boring film is below the interesting film on
  openness in **12 of 12**, so the effect is not carried by the out-of-order pair. At n = 2 this is a descriptive
  internal control and is labelled one; it does not dissolve the confound, and L6.3 states what remains.

### L4. The Analysis — chain-node walkthrough (THE analytical form)

- **L4.1 The chain in the laboratory.** A₀ = strapped into a headset under mandate, no leisure motive; A₁/A₂ = the
  charged image; A₃ = committed interest; **A₄ crossed always, because the chain runs always** — the only
  potentiality this situation furnishes is watching, and the diagnosis concerns the worth of what is furnished.
  The laboratory is a *Hingehaltenheit* apparatus by design, and felt duration is what shows it: dilated in 25 of
  36 episodes with **no separation between films**, so the holding belongs to the situation and not to any
  stimulus. Quaranta (`bor-sec-10`) is the philosophical precedent for reading film viewership this way, and
  L1.1 has already put it in play.
- **L4.2 ★ The second form, instrumented — with the reverse case absorbed, not deferred.** The layer assignment
  argued rather than assumed: Heidegger's surface is outward comportment, his depth an emptiness recognised only
  retrospectively, and the post-film self-report **is** that retrospective recognition; `fcm-05`'s decisive
  sentence is that behavioural engagement is not evidence against boredom but in this form the very medium of it.
  **The reverse case in full:** zero reverse cases at N=12 under the primary composite; the sweep over all seven
  subsets of the three poolable engagement channels produces one or two under four of the seven, R2-03
  recurring. R2-03's own answers explain it — boredom 3, 1, 2 and engagement 8 on clinical; they never became
  bored by anything, so their clinical episode is their own relative minimum rather than an absolute bored state,
  and *reverse* is a within-subject relative statement throughout. Honest form: **the asymmetry holds under the
  primary composite and is reported with the sweep that shows what it depends on.**
  **★ The qualification, load-bearing.** L3.5 shows two eye channels **do** track the reports across all
  thirty-six episodes. That does not undercut the divergence; it is what makes it sayable — a channel that
  tracked nothing could not be said to diverge, it would be noise. The claim the section confines itself to:
  instruments that agree with the person at rho ≈ 0.5 across their three films nevertheless part company on one
  film. The composite is itself a mixture on that point, openness tracking the report and pupil not, and the
  mixture is stated rather than smoothed. **This is also the section's answer to DA-04 in practice** — both
  channels reported, neither validated against the other, and the disagreement itself carrying the finding.
- **L4.3 The first form — the *Zeitvertreib* claim moves from the body to the eye.** The report side behaves as
  the form predicts: onset within five minutes in 10 of 12, three inside a minute, sleep-fight the sharpest item
  at 12 of 12. **v1's "searching gaze as *Zeitvertreib* operationalized" is withdrawn as stated.** The
  amplitude/frequency split says something more specific and partly the opposite: the eye departs **further** but
  **less often**, so what the instrument shows is a few long excursions rather than continuous search. Passing
  the time is also constrained here in a way it is not at Heidegger's station — the participant cannot leave,
  cannot read a timetable, cannot walk — so the counter-move has almost nowhere to go but the body and the eye.
  What it looked like beyond the eye is what this pass did not instrument, and the section says that rather than
  converting it into stillness.
- **L4.4 The third form, as analog only — better evidenced, and therefore under harder caution.** The evidence
  has strengthened: eye closure is now the strongest surface in the analysis; S05's 449.2 s and S08's 124.5 s
  closures are extended withdrawals of a different order from any blink; felt duration is dilated in 25 of 36
  episodes; the frequency result gives the zombie-stare account its first correction-surviving measurement.
  **Precisely because the analog is better evidenced, the caution binds harder.** Episodic structural grammar
  only. A seventeen-minute film in a laboratory cannot produce a form whose scope is beings as a whole; what the
  instruments show are episodic structures resembling parts of its anatomy, named as resemblances every time.
  **L1.4 supplies the defence of that restraint**: no source in fifty-five instruments profound boredom, and
  DA-02 and DA-03 show the literature itself disputing whether the third form is boredom and whether it or Angst
  is the *Grundstimmung* — so the refusal to claim an instance is a position in a live debate, not a hedge.
  Sleep-exit remains its own terminal category: not the deepest boredom but boredom's escape, the entranced while
  requiring a held witness, and S05 stopped being one.
- **L4.5 Against stimulus-essentialism — the anomaly pair becomes an anomaly set.** Six kinds of case, stronger
  together than separately: **S04's inversion**; **S06's boredom on the interesting film**; **R2-03, whom nothing
  bored**; **S03's extremity**; **the four within-instrument divergent episodes across three participants**; and
  **the round-level non-replication** — clinical sits at the engaged extreme in Round 1, while in Round 2 the
  engaged extreme is the interesting film. The same footage bores, engages, restores and repels. Boredom is a
  **relation**, not a property (FCM §§20–22), and **DA-07** — monotony-caused against meaning-caused — is the
  axis this argument takes a side on. `O-07` decides prior exposure's status; the strata remain
  near-indistinguishable on clinical at 8 against 4, descriptively.
- **L4.6 The aftermath.** Depletion after the boring film as the one lane running laboratory → philosophy: FCM
  treats boredom as disclosive and never as depleting, and **Elpidorou's regulatory account (`bor-sec-25`,
  `bor-sec-26`) is the other side of that argument**, which is why L1.6 has to precede this. `RE-PIN` the
  depletion counts from `out/survey-episodes.csv` at drafting — v1's "6/8" is a Round-1-era figure under a
  different definition, and the pooled item does not separate the films (p = 0.3965), so the claim is made
  descriptively at episode level or not at all. S04's −6 is the counter-instance: for one participant the boring
  film was restorative.

### L5. What the Laboratory Licenses — redeems M7.1, and states one withdrawal

- **L5.1 The divergence index respecified.** Composite physiological engagement minus retrospective self-report,
  read **signed rather than absolute**. The old gaze-minus-EEG formula is void — it differences two measures of
  the same layer. The specification now carries which channels may enter (pupil and eye openness, both
  Holm-surviving, both from raw per-sample data), which may not (anything rate-dependent, if the index spans
  instrument generations), and what the sensitivity sweep showed about how much the category counts depend on
  that choice. **L1.4's concordance instruction governs the specification**: the index measures psychological
  constructs and is interpreted through FCM constructs, and the seam stays visible in the definition itself.
- **L5.2 The three states made concrete, with the evidence each requires.** Restless search / occupied-but-hollow
  / withdrawn, plus **sleep-exit as a fourth terminal category**. v3 can say what evidence each needs and which
  this study holds: the withdrawn state has eye closure, the strongest surface in the analysis;
  occupied-but-hollow has the two-channel disagreement and the criterion analysis that makes the disagreement
  meaningful; sleep-exit has S05; **restless search is the state this pass could not instrument** — L5.3.
- **L5.3 ★ THE WITHDRAWAL.** The Round 2 reconnaissance proposed that the headset's inertial measurement unit
  supplies the visible-restlessness channel and supersedes the ch-obs rationale entirely. **That claim is
  withdrawn**, on three grounds that all belong in the prose. Head motion is deferred by ruling and was not read
  in this pass (R-03, R-04). The inertial streams are present in only nine of twelve Round 2 cells, and a
  within-subject three-way comparison needs all three films from one participant — **only one has that** — so the
  channel could not carry a cohort statistic even if read. And the channel it would have replaced was closed on
  validity rather than effort: optical flow from the first-person feed tracks the stimulus's visual richness
  rather than the participant's motion, the background being a featureless black void for two conditions in
  three. **What remains is a limitation, not a capability.** What it would take is a body or face camera, or a
  virtual environment with a textured surround for every condition, recorded deliberately rather than recovered
  afterward. Future work, gesture scale.
- **L5.4 Back to the deployment.** What the survey could hear only as an echo, the laboratory shows as a
  measurable disagreement between two channels — and what the laboratory cannot show is what a cohort-scale
  deployment could.

### L6. Limits

- **L6.1 ★ Gaze is eye-in-head, not head pose.** Confirmed three ways including the overlay video, where the head
  rolls ~90° and pitches far down while the gaze marker stays near frame centre; Round 2's combined gaze never
  exceeds 38.8°, zero samples beyond 50°.
- **L6.2 ★ Head movement is deferred, and it is where disengagement is visible.** In the permitted form and no
  other: the eye channels show withdrawal, and the search behaviour visible in the session video was not
  instrumented in this pass.
- **L6.3 ★ Viewing order — NEW IN v3.** Ten of twelve saw the boring film last, by the published protocol's own
  design, so order is very largely confounded with stimulus. L3.10 gives the internal control that speaks against
  a fatigue reading; **what remains is that the design cannot separate the two, and the section says so.** The
  protocol's reason is itself evidence worth carrying: the order was fixed *because* the boring film degraded
  what followed, which is a finding about the stimulus even though it costs the design a counterbalance.
- **L6.4 ★ The window difference between the rounds.** Round 1's middle ~13.6 minutes against Round 2's whole
  film; measured rather than assumed, and the measurement is the limit's own answer — openness is invariant to
  it, pupil is not.
- **L6.5 ★ The openness proxy.** Round 1's openness is a validity-flag proxy, not a measurement of the eyelid;
  licensed at r = 0.998 inside Round 2, which is strong, and still a proxy — and it sits underneath the section's
  headline surface, so the limit is stated where a reader will look for it.
- **L6.6** N=12 across two instrument generations, no formal power; Round 2 alone n = 4 and descriptive, its
  signed-rank floor p = 0.125.
- **L6.7** The criterion comparison is **episode-level throughout**, so nothing time-locks a moment of experience
  to a moment of signal; the coefficients describe this group and support no population estimate.
- **L6.8** Clinical's position **does not replicate** across rounds — in Round 2 the engaged extreme is the
  interesting film.
- **L6.9** EEG N=8 permanently; HRV excluded from both rounds and recoverable; cognitive load and heart rate
  appendix-only with their flatness printed as the evidence.
- **L6.10 ★ Half the measure space — NEW IN v3.** Measured against the cluster's own concordance, this dataset
  instruments roughly half the measure space the literature uses. The half it lacks — connectivity, resting
  baselines, blink at Round 1, behavioural performance, machine-learning classification — is named, and Yuvaraj's
  2025 educational connectivity study is the nearest published work that has the half this one does not.
- **L6.11** Category caution — episodic structural grammar, never a *Grundstimmung* claim. No learning-outcome
  claims anywhere.
- **L6.12** DA-08: the canonical account is individualist by construction and the participants here are a cohort.
- **L6.13** Laboratory ↔ deployment transfer limits.

`O-11` lands in this module and governs how L6.1 and L6.2 are worded.

### L7. Close

- **L7.1** The two halves joined: what the deployment could hear only as echo, the laboratory shows as
  divergence.
- **L7.2 ★ Part III coda + dissertation-level close — O-11's other half lands here.** Desktop M7.2 stays
  section-scale as drafted and is the expansion site only if the arc resolves that way.

---

## D. The fifteen open decisions, mapped — with two now resolvable

| # | Question | Module(s) | Status |
|---|---|---|---|
| O-01 | EEG framing — is the earlier account told alongside the non-replication? | **L0.3, L3.8** | **BLOCKING.** See §F. |
| O-02 | Naming the openness surface | **L2.5, L3.2**, then everywhere | **BLOCKING for L3.2** |
| O-03 | The two ASEE works-cited entries; surname overlap | L1.3, L2.1, works cited | at assembly |
| O-04 | Within-episode time course and viewing order | L3.7, **L2.7** | **partly overtaken** — order is now a required disclosure, not an option; time course still open |
| O-05 | Per-participant matrix as an appendix | L3.6 | no |
| O-06 | How much of the published studies to re-present | **L1.3**, L0.2 | shapes L1.3's length |
| O-07 | Prior exposure — variable or footnote | L4.5 | no |
| O-08 | How much statistical apparatus the prose carries | L2.9, L3 | shapes L3 length |
| O-09 | Section length and module weighting | all | **settle at walkthrough** — L1 has grown from 5 bullets to 6 substantial subsections |
| O-10 | The boring film's title and source | L2.3 | **RESOLVABLE NOW** — all three films identified from the published reference lists (§C, L2.3) |
| O-11 | Round 1 measures the eye only | **L6.1–L6.2, L7.2** | **BLOCKING for L6** |
| O-12 | Which gaze baseline is primary | **L3.4**, L3.5 | **BLOCKING for L3.4** |
| O-13 | Presenting the two-questions distinction | **L2.8 placement, L3.5, L4.2** | **BLOCKING for L3.5** |
| O-14 | Multiplicity in the criterion family | L2.8 (`******`) | at drafting |
| O-15 | IRB-facing survey wording | L2.2, L2.8 (`******`) | at drafting |

## E. Source availability — what can and cannot be quoted

**Fully available and archon-verifiable.** All 55 boredom-cluster units resolve to ingested documents. The two
haystack containers are both in the store, so `bor-sec-40` (Jaques) and `bor-sec-41` (GazeMotive) are
quote-verifiable at their page ranges. The FCM, *Being and Time*, *Basic Concepts of Aristotelian Philosophy*,
Hadjioannou's *Heidegger on Affect*, the VR-pedagogy cluster's 34 entries and all four King–Salvo papers are
ingested.

**Cited by the published studies and NOT in the corpus — `******` if they enter prose.** Fahlman et al.'s
Multidimensional State Boredom Scale (the self-report instrument's likely lineage, cited by both papers);
Yelamanchili on EEG correlates of flow, boredom and anxiety in gaming; **Morie, Heinzel and Heinzel, and Tham et
al. — the three phenomenology-of-VR sources the 2023 paper itself cites**, which L1.3 leans on; Meyer, Omdahl and
Makransky; Kolb and Kolb; Tamim et al. Also absent, though named as expected citation hubs by the cluster's own
Phase 0: Eastwood and Danckert, Csikszentmihalyi, Mann and Robinson.
**Recommendation:** acquiring Fahlman and the three phenomenology-of-VR sources would materially strengthen L1.3
and L2.2. The rest can be cited from the published papers' own reference lists without quotation.

**Two retrieval hazards.**
1. **A duplicate under a wrong author.** `corpus/boredom/` holds both `Mansikka … Can Boredom Educate Us (2008)`
   and `Standish, P. … Can Boredom Educate Us … (2015)`, and both are ingested. The index has already ruled these
   the same paper: `bor-sec-18` is Mansikka, 2008 online / 2009 print, and the "Standish (2015)" attribution was
   a plan error. An archon search will return both copies; **cite Mansikka and never Standish for this text.**
2. **Duplicate ingestions across folders.** Fourteen boredom papers exist in both `corpus/boredom/` and
   `corpus/biomedical_engineering/`; only the biomedical-engineering copies were ingested for most of them.
   Verify-quote will resolve to whichever copy is in the store, so the reported source path may not match the
   folder the index entry names. Not an error, but do not report the path as provenance without checking.

## F. The O-01 collision — restated, because v3 sharpens it

The section's originality claim in L1.4 and L3.5 is that scoring each channel against the participants' own
reports had not been done. Your account in O-01 is that cross-validation against self-report was completed before
EEG was dropped for scaling. Both cannot stand unqualified.

v3 supplies the material for a clean distinction if you want one. What the published papers contain is a
qualitative corroboration — the 2024 paper states that self-reports of perceived boredom generally corroborated
the pattern, and the 2023 pilot reports that the interesting and boring samples evoked distinct states as
determined by self-report. Neither computes an association between a physiological channel and a rating. So the
accurate form is available: **agreement with self-report was asserted qualitatively in the published work and is
computed here for the first time, per channel, with a clustering-corrected probability.** That preserves your
account and the originality claim together. `VERIFY` the two published sentences char-exact through archon before
either enters prose.

## G. Verification requirements

- **Verified this session:** S07's answer sheets; the four within-instrument divergent episodes; ten of twelve
  bored within five minutes with three inside one minute; S05's 449.231 s and S08's 124.547 s closures against
  Round 2's longest of 29.7 s; the composite definition actually used in code; the full viewing-order table; the
  per-participant openness values behind L3.10; both published reference lists; the 55-unit strand structure;
  archon store coverage.
- **`RE-PIN` before drafting:** depletion counts (L4.6); the published gaze cohort's composition (L2.1); every
  quotation from every unit, char-exact through archon.
- FCM page loci: `book_page = 2·pdf_page − 24`; cite the triple locus; **GA pagination drifts — read it from the
  running head, never compute it.**
- K&S papers via `pdftotext`, never as images. Index entries first, then archon, then the PDF.

## H. Doctrine locks (unchanged)

Chain-node walkthrough is THE analytical form · **NO-STALL** · **GREATEST-DESIRE** · "demonstrated" never
"prove" · standing sweeps before every batch (sentence-initial *And* / "record" as evidence-name / "pole" /
ladder / stall / cost-price-spend metaphors / bare "incorporation" / vague paragraph frames) · scientific-direct
register · MLA · *Rhetorica* in Aristotle parentheticals · no module labels in rendered text · bare ¶-numbers when
presenting · verification-gated · backups to `.backups/` · **PII: `S01`–`S08` and `R2-01`–`R2-04` only** · forks
in prose, never polls · ultracode off · **nothing committed without explicit sign-off**.

## I. Workflow

Stage 2 (this outline) → author walkthrough, module by module → Stage 3 guided drafting in **1–3 ¶ batches with an
approval gate per batch**, bare ¶-numbers when presenting.

## J. The III-2 harvest map (unchanged)

| Item | Lands at |
|---|---|
| The S07 seam fix — self-rated boredom licensed as a depth channel via a conjunction, not dilation alone | L4.2 |
| Sleep-exit as its own terminal category | L4.4 |
| Depletion and carryover as the laboratory → philosophy lane | L4.6 |
| The anomaly cases as refutation of stimulus-essentialism | L4.5 |

## K. Defects in the generated v4 artefacts — reported, not fixed

None moves a statistic; all are strings in generated files that would migrate into the dissertation if quoted.
1. **The composite is misdescribed in three places** — `report.py:493`, `figures.py:656`, `crossref.py`'s
   docstring all say "pupil dilation, cognitive load and eye openness"; the code defines pupil + openness, which
   is what R-01 requires and where 8/4/0/0 comes from. **Never quote FINDINGS §4's opening sentence or the
   keystone-scatter caption verbatim.**
2. **Stale durations** — `figures.py:523` and `config.py:194` state Round 2 recordings run 1099–2430 s; post-crop
   they run 1013.2–1167.8 s.
3. **Two empty enumerations** — "0 reverse cases: ." and "namely ."; the same caption prints "+nan trimmed."

Recommendation unchanged: fix in one v5 pass after the walkthrough, before any caption is carried across.

---

## Z. What changed from v2 → v3

| v2 | v3 | Why |
|---|---|---|
| No statement of genre | **§0a**: the section is applied philosophy, and every module is legible as measurement or as interpretation with the seam visible | author ruling; the concordance's own §7.4 |
| No retrieval protocol | **§0d**: archon-first, with binary, store, counts and the `match_kind` gate | author ruling |
| L1 = 5 bullets, 11 units | **L1 = 6 substantial subsections over 55 units in 7 strands**, plus the debate map, concordance, citation network and scholarly-evolution arc | the corpus was under-read |
| — | **L1.3, entirely new**: the clinical-immersion lineage the two published papers stand in, from their own reference lists — including that the 2023 paper already cites phenomenology of VR | the "sources they used" review the author asked for |
| L1.3 warrant on two counts | **L1.4**: both routes, plus the arc that is not a progression, plus the concordance's hole and its five instructions | the synthesis files carry far more than v2 used |
| EEG negative reported bare | **L3.8 read against its literature** — Perone, Yakobi, Miyauchi, Barry — so the negative is characteristic rather than anomalous | L1.2's through-line |
| — | **L2.3 resolves O-10**: all three films identified with sources from the published reference lists | read this session |
| — | **L2.7 + L3.10 + L6.3, all new**: viewing order fixed at interesting → clinical → boring in ten of twelve, the confound stated, and S01/S05 as the internal control against a fatigue reading | found by reading the published protocol against the archived order data |
| L2.4 rate rule only | **plus the 120 Hz seam**: the published paper states the sensor's rate; Round 1 logged at ~3 Hz; Round 2 is the first round that logged at 120 Hz | read this session |
| L2.1 flagged the two twelves as unverifiable | **dated**: the 2024 paper's access dates precede Round 2's March 2024 recording, so the published twelve cannot contain Round 2 | read this session |
| — | **L6.10**: this dataset instruments about half the measure space the literature uses, and the missing half is named | concordance §7.5 |
| — | **§E**: source-availability audit, seven absent sources marked `******`, two retrieval hazards | archon coverage check |
| — | **§F**: the O-01 collision with a proposed clean distinction and the sentences that support it | the published papers' own wording |
| L4.4 caution asserted | **caution defended** from DA-02/DA-03 and the un-instrumented third form | debate map |

## Y. What changed from v1 → v2 (retained)

L2 renamed off "Record" · four cohorts and the two-twelves trap · two engines and the poolability rule · the
openness proxy promoted to its own paragraph · two window conventions · the criterion method referenced not
rewritten · channel status by ruling with the flat numbers as evidence · L3 rebuilt with eye closure as headline
and pupil demoted · gaze amplitude against frequency added · criterion validity added as a subsection · the
three-film decomposition replacing the clinical-only keystone · 8/4/0/0 at N=12 · felt duration 25/36 · the case
set · the reverse case absorbed into L4.2 · the *Zeitvertreib* claim withdrawn and replaced · the third form
better evidenced under harder caution · the anomaly set · **L5.3's withdrawal of the inertial-unit claim** · L6
grown from six limits to eleven · DA-04 qualified · the fifteen open decisions mapped · the artefact defects
reported.
