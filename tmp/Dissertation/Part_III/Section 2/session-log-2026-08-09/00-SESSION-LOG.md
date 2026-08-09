# Lab Boredom Section 2 — Session Log and Durable Evidence Store

**Session dates:** 2026-08-06 → 2026-08-09 · **Model:** Fable 5 · **Modules drafted:** L1, L2, L3
**Working directory:** `tmp/Dissertation/Part_III/Section 2/`
**Status at close:** L1, L2 and L3 drafted and author-approved paragraph by paragraph. L0, L4,
L5, L6, L7 NOT begun. Appendices deferred by author order until the section body is finished.

> **Read `01-LAWS.md` before writing a single word.** It is short and it is binding. This log is
> the evidence behind it. `02-HANDOFF-PROMPT.md` is the boot prompt for the next session.

---

## 0. How to use this directory

| file | what it is |
|---|---|
| `00-SESSION-LOG.md` | this file — the full narrative, every problem encountered, every ruling and why |
| `01-LAWS.md` | the binding rules, extracted. If you read nothing else, read this |
| `02-HANDOFF-PROMPT.md` | paste-in boot prompt for a clean session |

Everything else lives where the work lives: the drafts in `Section 2/`, the spec in
`PART-III-LAB-BOREDOM-SECTION-OUTLINE-v8-2026-08-07.md`, the analysis in
`boredom-analysis-v5-2026-08-05/`.

---

## 1. What the author asked for at the outset

Draft the Laboratory Boredom section using **the same recipe as the Part III desktop section**
(Section 1): Stage-3 guided drafting — paragraph-level plans first, 1–3 paragraph batches, an
approval gate on every batch, bare paragraph numbers when presenting, backups before touching
approved files, prose decision points rather than polls.

Foundation documents named by the author: the Stage-P handoff, the L1 pack and its quote bank,
outline v7 §L1, decisions register v8, and FCDP v2 as the method of record.

**Two corrections to that starting set were found and approved on day one:** pack **v2**
supersedes v1 (eight loci resolved, Q01 barred as abstract-only), and the tandem session's
author-approved r1 revision of ¶1 was carried as the working base rather than redrafted.

---

## 2. THE GOVERNING RULING — everything else is downstream of this

Ruled 2026-08-07 and **sharpened 2026-08-09**. The 08-09 refinement is the definitive form:

> **THE UNIT OF ANALYSIS IS THE EPISODE. THE FILM IS A LABEL, NOT A VARIABLE.**
> There are 36 episodes. Each carries the eye-tracking data recorded during it and that
> participant's reported boredom and engagement for it. Which film it happened to be is
> metadata — not a variable, not a grouping, not something the analysis speaks about.
>
> Author, 2026-08-09: *"we do not care about films. the only things that matter are reported
> boredom/engagement from the surveys and the eye tracking data from that episode."*

The 08-07 ruling, which the above supersedes in framing but not in substance:

> **Film-separation statistics are excluded from the dissertation entirely.** Whether a measure
> can or cannot tell the three films apart is not a finding this section reports. Not demoted,
> not appendixed — **excluded**. This removes the 99 pairwise contrasts, every Friedman/Wilcoxon
> across-film test, the nine Holm-surviving contrasts, and every claim of the form "this measure
> distinguishes the boring film from the clinical one."
>
> **Reason, in the author's words:** boredom is subjective. The same film bores one person and
> engages another. Comparing films averages across exactly the variation the experiment exists
> to study.
>
> **The criterion analysis IS the experiment**: each physiological measure scored against what
> the participant reported about that episode, within-subject, across all 36 episodes.
>
> **Gaze deviation (per-participant baseline) is the principal finding.**
>
> **All three films are treated equally.** Conclusions about the clinical stimulus remain
> permissible; foregrounding it does not.

### What this overturned

- **D-26 is void** — it designated a separation result (eye closure 12-of-12) as the section's
  strongest evidence.
- **Outline v7 §L3 is void** — organized around separation from L3.1 onward. Rebuilt in v8.
- `PROSE-METHODS-CRITERION-VALIDITY-v2`'s "do not rewrite" status **lapses for register only**
  (numbers and logic stand; its pitch assumes statistical literacy and the author ruled against
  that).
- The three-baseline gaze architecture collapses: device-forward had been assigned to the
  separation question and now has no assigned question.

---

## 3. Problems I introduced, and how they were caught

**This section exists because the author caught these, not because I did.** A future session
should assume the same failure modes are available to it.

### 3.1 ★★ Generalizing from a single subject — caught TWICE

**First instance.** I drafted a case paragraph claiming "the same three confirm it" about the
three participants whose ratings departed from the cohort. The author asked me to verify. On
checking all three: one confirmed on all measures, one on two of three, and **S06 contradicted
on every measure**. The claim was false.

**Second instance.** I then drafted the S04 case from S04's data alone and concluded the cohort
evidence was weaker than it is. The author ordered a complete breakdown of all twelve. Result:
**each measure agrees with participants' own reports in 10 or 11 of 12 cases**, and two of the
three apparent exceptions dissolve on inspection. My draft had badly *understated* the finding.

**The author's rule, now law:** never draft a results claim from one participant unless the
passage is explicitly about that participant. Run every subject, every time, before writing.

### 3.2 The composite was built on a measure the section disowns

The keystone — the section's central divergence finding — was computed from **pupil dilation +
eye closure**. Pupil had already been excluded from the argument by author ruling. The section
would have rested its central claim 50% on a measure it tells the reader to disregard.

Author's words: pupil "will only poison the results." Rebuilt as **eye closure + gaze deviation**
(D-41). Six of 36 episodes changed category; clinical divergent fell from 8 to 5. **The published
keystone in its old form does not survive**, and the section must say so.

Why pupil inflated it: pupil responds to light before anything else, the clinical footage is the
brightest sample, so pupil read "engaged" on that film for non-engagement reasons.

### 3.3 Presenting an arithmetic artifact as a finding (P27, cut)

**This is also the clearest instance of film framing re-entering by the back door**, and it did
so twice — once in the paragraph itself, and again while I was explaining the error to the
author, in sentences like "the tutorial was most participants' worst episode." That sentence
still makes a film the subject.

I claimed that all twelve tutorial composites being negative was a finding. The author
challenged it. Verification: the composite is a within-subject z, so **each participant's three
values sum to exactly zero** (verified +0.000000 for all twelve) — a participant's worst episode
is negative *by construction*. The tutorial was the worst episode for **11 of 12**, so "all
twelve negative" follows almost automatically. Paragraph cut.

### 3.4 Overstating a leave-one-out check

I wrote "no episode's removal weakened the relationship." False — episode-level removals range
+0.601 to +0.707 against a full +0.623. The author asked whether clustering mattered, which
exposed it. Replaced with **leave-one-PARTICIPANT-out** (the cluster-respecting version),
re-standardizing the remaining eleven from scratch.

### 3.5 An unsourced magnitude claim

I wrote that correlations "around 0.5 are ordinarily treated as substantial." The author asked
for the source. It traces to Cohen (1988) and is contested. **Cut** rather than cited.

### 3.6 Scratch-script file bugs (the analysis itself was always correct)

- A glob matching `*B*` picked up **`MilanBas_HMD_Clinical_Crop.csv`** — a filename that
  misspells the participant's surname with a stray "B" — as if it were the boring film.
- `sorted()[0]` picked **`_Crop 2`** over the plain `_Crop` for S07.
- **S07's boring file has a different column layout** — a single colon-joined timestamp instead
  of four fields, shifting every column by three. My fixed-position reader produced garbage.
  **The analysis handles this correctly and always has** (`ch_hmd.read_hmd()` detects it).

A full **`FILE-AUDIT-2026-08-07.md`** was produced by matching RUN-MANIFEST MD5 hashes back to
disk. **All 24 Round 1 cells read the correct file.**

### 3.7 Deadlocked waiter loops (operational)

I armed background waiters with `until ! pgrep -f "analysis/run.py"`. Each waiter's own command
line contains that string, so they matched each other and span forever. Twice reported a run as
"still running" when it had finished. **Use a pattern that cannot match the checking process.**

### 3.8 Film framing surviving in approved prose (caught 2026-08-09)

After the episode-is-the-unit refinement, an audit of already-approved L3 prose found two
sentences that made a film the subject of a claim. Both were cut on 2026-08-09:

- **¶25's closing** — "Four of the nine occurred on the interest film and five on the clinical
  footage, so the pattern is not the property of any one stimulus." Written to satisfy the
  equal-treatment ruling, but it argued *about films* to show films do not matter.
- **¶16's clause** — "the tutorial would look less reliably boring than it was" — rewritten to
  "since their episodes would be averaged in against reports that ran the other way."

Sentences that merely identify which of a participant's three episodes is under discussion
("S04 rated the tutorial the most engaging of their three episodes") were **kept** — that is
identifying an episode, not claiming a property of a film. The distinction is the test to apply.

### 3.9 Skipping the presentation gate

I drifted into summarizing what I had written instead of presenting the prose for approval. The
author caught it. **Present every drafted batch in full, with bare paragraph numbers.**

---

## 4. Analysis changes made this session — all re-run, all gates passing

| id | change | consequence |
|---|---|---|
| **D-39** | On any 1–9 item, "NA" means the film produced none of that quality → read as **1** (scale floor). A blank on minutes-until-bored means **never became bored**, retained as a category, **NOT coded 0** (on a duration item 0 would mean bored from the first second). | Survey now has **no missing answers**. Parsing: 239 exact / 5 converted / 1 flagged / 7 semantic / 0 missing = 252 = 36 × 7. Sleep-fight gained a second significant comparison. |
| **D-40** | Eye closure = **both eyes shut**, on both rounds. Round 1 now reads the per-eye −1 sentinel rather than `pct_valid_eye`. | **This was a correction, not a preference:** Round 2 already used both-eyes; Round 1 counted a sample closed when *either* eye flag fell. The rounds were applying opposite rules. Criterion coefficients moved ≤0.02. |
| **D-41** | Composite rebuilt: **eye closure + gaze deviation (per-participant baseline)**. Pupil removed. Sensitivity sweep reduced to the same two measures — pupil AND cognitive load removed from it entirely. | 6 of 36 episodes changed category. See §3.2. |

**Gates:** all eight checks pass on both code paths. **D-11 rename equivalence holds at 1.8e-15**
against a 1e-12 threshold (the assertion was rebuilt for the new composite and still proves the
same thing). **72 figures regenerate** — matplotlib and scipy were installed this session; they
were previously absent, which is why figures had been stale.

**Backups:** `.backups/analysis-pre-D39/`, `-pre-D40/`, `-pre-D41/` each hold the prior outputs;
`-pre-D41/` also holds the prior `crossref.py`.

---

## 5. The headline results, as they now stand

All within-subject z, 36 episodes, 12 participants, 20,000 within-subject permutations.

| measure | vs reported boredom | vs reported engagement |
|---|---|---|
| **gaze deviation** (per-participant) | **+0.595** (p 0.0025) | **−0.585** (p 0.0022) |
| **eye closure** | +0.471 (p 0.0187) | −0.436 (p 0.0280) |
| sleep-fight *(survey item)* | +0.771 (p <0.0001) | −0.752 (p 0.0001) |
| fatigue after *(survey item)* | +0.640 (p 0.0007) | −0.616 (p 0.0010) |
| **fatigue BEFORE** *(the control)* | **+0.071 (p 0.72)** | −0.208 (p 0.30) |

**Pearson runs slightly higher throughout** (gaze +0.623 / −0.609), and leave-one-out shows every
influential episode *suppresses* Pearson rather than inflating it — which is why promoting it was
defensible.

**Within-participant** (own most-boring vs own most-engaging): gaze 10 agree / 2 contra; closure
10 / 2; sleep-fight 11 / 0 / 1 tied; fatigue-after 10 / 1 / 1 tied.

**The decomposition (rebuilt):** across 36 episodes — 13 both-bored, 11 both-engaged,
**9 divergent** (eyes engaged, person bored), 3 reverse. Sweep: closure alone gives 7 divergent
on clinical, gaze alone 3, both 5 — **no weighting choice creates the finding**.

### 5.1 ★ Every survey item against the eye measures (computed 2026-08-09, at author's
### instruction that the WHOLE survey is in scope, not only boredom and engagement)

| survey item | vs gaze deviation | vs eye closure |
|---|---|---|
| boredom | +0.595 (0.0021) | +0.471 (0.0171) |
| engagement | −0.585 (0.0026) | −0.436 (0.0284) |
| **sleep-fight** | **+0.463 (0.0206)** | **+0.663 (0.0006)** |
| **fatigue after** | **+0.423 (0.0332)** | **+0.688 (0.0004)** |
| **minutes until bored** | −0.400 (0.0729) | **−0.546 (0.0129)** — n=30 |
| **depletion** | +0.249 (0.2201) | **+0.409 (0.0422)** |
| fatigue before | +0.320 (0.1093) | +0.238 (0.2408) |
| felt-duration ratio | +0.243 (0.2280) | +0.106 (0.6042) |

**★ What these items ARE (author ruling, 2026-08-09).** Felt duration, fatigue before and
after, sleep-fight and minutes-until-bored are **all indicators of boredom — likely, not
absolute**. They are convergent indicators of one construct, not separate questions that happen
to sit beside the boredom rating. So their agreement with each other is **convergent validity**
and must not be written as independent corroboration; each is defeasible, and confounds must be
conceded (a sleep-deprived participant may fight sleep through an engaging episode); and the
near-null on fatigue-BEFORE is evidence precisely because it was a plausible indicator — the
boredom here is episode-driven rather than a predisposition carried in.

### 5.2 ★ The indicator battery against the RATINGS (computed 2026-08-09)

Every indicator item scored against reported boredom and engagement, two ways. Within-subject z,
within-subject permutation p for the correlation; exact sign test for the paired comparison of a
participant's own most-boring against their own most-engaging episode.

| indicator | vs boredom | vs engagement | within-participant (agree/contra/tied) |
|---|---|---|---|
| sleep-fight | **+0.771** (0.0000) | −0.752 (0.0001) | 11 / 0 / 1 — p 0.0010 |
| fatigue after | **+0.640** (0.0007) | −0.616 (0.0011) | 10 / 1 / 1 — p 0.0117 |
| **minutes until bored** | **−0.714** (0.0007) | +0.668 (0.0021) | **0 / 8 / 0 — p 0.0078** (n=8 testable) |
| felt-duration ratio | +0.499 (0.0108) | −0.549 (0.0049) | 9 / 2 / 1 — p 0.0654 |
| depletion | +0.516 (0.0102) | −0.420 (0.0342) | 9 / 2 / 1 — p 0.0654 |
| **fatigue BEFORE** | **+0.071 (0.7240)** | −0.208 (0.2981) | 6 / 3 / 3 — p 0.5078 |

**Every indicator points the predicted way on both ratings.** Four of five reach significance on
the correlation; three of five on the stricter paired test. Minutes-until-bored is unanimous in
the paired test — **not one of the eight testable participants took longer to become bored on
their own most-boring episode**.

**Fatigue BEFORE is flat on every test**, which is the whole point of having it: it is the only
member of the battery that does not behave like an indicator, and it is the only one measured
before the episode began.

★ **A correction to §5.1's reading of felt duration.** Felt duration is flat against the EYE
measures (ratio vs gaze +0.243, vs closure +0.106) but tracks the RATINGS well (+0.499 /
−0.549). Those are different claims. The honest statement: a film feeling long shows up in what
participants say and not in what their eyes do.

**Why this matters and what it changes.** Sleep-fight and fatigue-after had only ever been
correlated against boredom and engagement — other survey items — which left both open to the
shared-method objection. They now stand against physiological data the participant had no access
to, and eye closure reaches +0.663 and +0.688 on them. **The shared-method caveat in L3 needs
revisiting: it is now too strong as drafted.**

Minutes-until-bored against eye closure at −0.546 is a **new finding**: the sooner a participant
reported becoming bored, the more of the episode their eyes spent shut.

**Two data problems surfaced by this pass:**
- `felt_duration` is **empty in all 36 rows** of `survey-episodes.csv`. It is one of the seven
  collected items and only the derived ratio survives. Investigate before the survey appendix.
- Felt duration is flat against both eye measures — a film feeling long does not show in the eyes.

**The fatigue-before null is the strongest defensive result in the section**, and it now extends:
fatigue before the film is near-null against the **eye measures** as well (+0.320 and +0.238),
so what a participant carried in predicts neither their ratings nor their eye behaviour. It answers the
shared-method objection: if participants were merely narrating a consistent story about a dull
afternoon, the before-item would be swept along. It is not.

**S06 suppresses everything.** Dropping S06 raises gaze to +0.706 and fatigue-after to +0.767.
**Every association already clears significance with S06 included** — nothing crosses a
threshold, it only gets more emphatic. S06 is retained, and the section says so openly.

---

## 6. Module state

| module | state |
|---|---|
| **L0** Introduction | NOT DRAFTED |
| **L1** The Three Literatures | DRAFTED, ~12 ¶¶. Over the 4–5 pp cap at ~6,200 words; compression **deferred by author** |
| **L2** Apparatus and Data | DRAFTED, 19 ¶¶, body complete |
| **L3** The Findings | DRAFTED, ~25 ¶¶, complete incl. decomposition, order control, EEG. P27 cut; two film-framed sentences cut 2026-08-09 |
| **L4** The Analysis | NOT DRAFTED — next |
| **L5–L7** | NOT DRAFTED |
| Appendices | **Deferred by author order** until the body is finished |

---

## 7. Three checks owed before L4 is drafted

L4's spec in outline v8 was written against the OLD composite and pre-D-39 numbers.

1. **Which episodes are divergent under the rebuilt composite** — L4.2 builds a chain-node
   walkthrough on "a divergent participant on the clinical film." There are now 5, not 8.
   Identify them and confirm one fits the description before building on it.
2. **Current sleep-fight figures** — L4.3 cites D-37's numbers, which D-39 changed.
3. **S08's closure by thirds** (16.8% → 58.7% → 89.2%) — L4.4 leans on this, and D-40 changed
   the closure definition. Verify. The spec permits onset-and-duration evidence only and
   **forbids slopes or tests on thirds**.

---

## 8. Open items at close

- **Figures**: 72 regenerate, but the results figures the author asked for are not yet made. A
  marked instruction block sits in `L3-DRAFT-v1.tex` listing six candidates in prose order.
- **L1 length**: ~6,200 words against a 4–5 pp cap. Compression deferred.
- **`******` pins**: appendix designation for the two published papers; the seventh survey item's
  printed wording (fatigue-after) is unverified and needed before the survey appendix.
- **O-15**: IRB-facing survey wording, deferred to where it lands in L2.8.
- **Desktop debt**: desktop M4.1 ¶6 cites FCM **110**; the author ruled the passage is on
  **109**. Correct when that section is next opened.
- **Pack errata**: `PACK-ERRATA-2026-08-06.md` — Q21's cite string names "Nacke and Craig";
  **Craig is Lindley's given name**. Same class of error as the Colin/Barrett trap.
- **S01/S04 video comparison**: plan written (`PLAN-S01-S04-GAZE-VIDEO-2026-08-07.md`), **not
  executed**. The author will likely state the same-location claim as personal observation from
  the overlay recordings instead.

---

## 9. Verified facts that cost effort to establish — do not re-derive

- **Cohort**: 12 participants = Round 1's 8 + Round 2's 4. The **2023 paper reported 3** of Round
  1's 8 (verified four ways in the document; author confirmed). The **2024 paper reported all
  12** using the same Round 1 recordings. **F-11 is WITHDRAWN** — the published gaze cohort IS
  this analysis's cohort.
- Participants include **computer science** undergraduates alongside BME, MEng BME and medical
  students. IRB: **UCI IRB Exempt No. 20232678** (2024 form).
- **Parhi and Ayinala is 2014**, not 2013 (IEEE TCAS-I 61.1, January 2014).
- **P2's authors**: Christine E. King, Matthew Lo, Milan Das, Dalton Salvo (ASEE 2024 #44685).
- First names resolved: **Mahon O'Brien, Christos Hadjioannou, Emily Hughes, Kurt C. M. Mertel**.
- The 2023 paper's stimulus sentence is a **paraphrase of Fahlman's summary of Berlyne and
  others** — not quotable as either party's own words.
- **Equipment did not change between rounds** — same headset and sensors, EEG dropped for Round
  2. What changed is the **capture software**, which by Round 2 logged everything at 120 Hz
  against Round 1's ~3 Hz.
- **Calibration used a trigger pull** on the headset controller. The 2024 paper says "click a
  mouse"; the author corrected it.
- **Surveys were administered verbally**, the proctor recording answers — hence free text.
- **HR and HRV were dropped for an equipment reason**: the forehead sensors did not sit flush on
  a number of participants, most consistently those of Asian descent. Not a null-result exclusion.
- **Cognitive load** is a proprietary vendor figure whose construction cannot be inspected. Never
  a candidate.
- Round 1 stimuli were **flat 2D video**; only the clinical footage was **180°, stereoscopic 3D**.
  Participants were seated and did not turn around.
