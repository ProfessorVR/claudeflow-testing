# THE LAWS — Lab Boredom Section 2

**Binding. Read in full before drafting anything. Violating any of these has already produced a
false claim in this section at least once.**

Evidence and history: `00-SESSION-LOG.md`. Boot prompt: `02-HANDOFF-PROMPT.md`.

---

## I. THE GOVERNING RULING — what this section is and is not

**1. ★★ THE UNIT OF ANALYSIS IS THE EPISODE. THE FILM IS A LABEL, NOT A VARIABLE.**

There are **36 episodes**. Each carries two bodies of evidence, and these are what this
section analyzes:
  - the **eye-tracking data** recorded during it — gaze deviation and eye closure
  - **everything that participant reported about it** — the WHOLE survey, not only the boredom
    and engagement ratings

Which film an episode happened to be is metadata. It is not a variable, not a grouping, and not
something the analysis has anything to say about.

**NO FILM COMPARISONS. EVER.** No Friedman or Wilcoxon across films. No "separates the boring
film from the clinical one." No 99-contrast frame. No Holm-surviving-contrast list. No claim of
the form "on film X, all twelve participants…" — that is a claim about a film, and films are not
a category this analysis works in.

*Why:* boredom is subjective. The same film bores one person and engages another. Anything
computed by film averages across exactly the variation the experiment exists to study.

**The failure mode to watch for:** film framing re-enters through the back door in sentences
that sound descriptive — "the tutorial was most participants' worst episode," "four of the nine
occurred on the interest film." Each of those makes the film the subject. Write about episodes
and what was reported about them.

**2. THE CRITERION ANALYSIS IS THE EXPERIMENT.**
Every data-driven claim is: **eye-tracking data scored against that participant's own subjective
survey responses**, within-subject, across all 36 episodes.

**★ THE WHOLE SURVEY COUNTS — author, 2026-08-09.** Not only boredom and engagement. All seven
collected items and both derived quantities are in scope:

| item | scored against the eye measures? |
|---|---|
| boredom (1–9) | YES — gaze +0.595, closure +0.471 |
| engagement (1–9) | YES — gaze −0.585, closure −0.436 |
| sleep-fight (1–9) | YES — gaze +0.463, closure **+0.663** |
| fatigue AFTER (1–9) | YES — gaze +0.423, closure **+0.688** |
| minutes until bored | YES — closure **−0.546** (n=30; 6 never-bored are a category) |
| depletion (after − prior) | YES — closure +0.409 |
| fatigue BEFORE (1–9) | near-null against both — **this is the control, and it is load-bearing** |
| felt-duration ratio | flat against both — a film feeling long does not show in the eyes |
| felt duration (raw) | ★ **EMPTY in all 36 rows of the output table** — investigate before the survey appendix |

Excluding a survey item from the analysis requires an author ruling. None has been given.

**★ WHAT THESE ITEMS ARE — author, 2026-08-09:** *"felt-duration, fatigue before/after,
sleep-fight, minutes until bored are all indicators of boredom. not absolutely but likely."*

They are not incidental questions sitting beside the boredom rating. They are **convergent
indicators of the same construct**, each pointing at boredom **probabilistically rather than
definitionally**. Three consequences follow, and all three must be respected in the prose:

1. **Their agreement with the boredom rating is convergent validity, not independent
   corroboration.** Several indicators of one construct agreeing is expected if the construct is
   real; it is not a second, separate confirmation. Do not present it as one.
2. **Each is defeasible, and confounds must be conceded where they exist.** The author's own
   example: a sleep-deprived participant may fight sleep through an engaging episode for reasons
   having nothing to do with boredom. This is why the **within-participant** design matters —
   comparing a participant's own episodes cancels what they carried in.
3. **Fatigue BEFORE is a candidate indicator that comes out near-null**, against both the
   ratings and the eye measures. Because it *was* a plausible indicator, its flatness is
   evidence rather than an absence: the boredom measured here is driven by the episode, not by
   a predisposition the participant arrived with. **Say so; do not merely report the number.**

**3. THE ONLY PHYSIOLOGICAL DATA IS EYE DATA, AND ONLY TWO MEASURES OF IT.**
Gaze deviation on the **per-participant baseline**, and eye closure meaning **both eyes shut**.
Nothing else physiological. Pupil is excluded even though it is eye data.

**4. PERMANENTLY EXCLUDED, EACH FOR A DIFFERENT REASON — never reconsider:**

| measure | why |
|---|---|
| **pupil dilation** | tracks nothing (−0.172 vs boredom, ns); its film differences have several uncontrolled explanations at once (luminance unmatched, arousal, effort). Author: it "will only poison the results" |
| **cognitive load** | proprietary vendor figure; construction cannot be inspected; never a candidate |
| **heart rate / HRV** | forehead sensors did not sit flush on a number of participants, most consistently those of Asian descent — an equipment failure, not a null |
| **EEG** | a direction, never a result. Round 1 only, N=8. Never claim per-channel significance for it |

**5. ALL THREE FILMS ARE TREATED EQUALLY.** Conclusions about the clinical stimulus are
permissible; foregrounding it is not.

**6. GAZE DEVIATION IS THE PRINCIPAL FINDING.**

---

## II. ★★ THE COMPLETE-COHORT LAW

**NEVER draft a data-driven claim from a subset of subjects.** Run **all twelve**, every time,
and look at the full table **before** writing a word.

*This was violated twice in one session.* Once producing a false claim ("the same three confirm
it" — one of the three contradicted every measure). Once producing a claim that badly
**understated** the finding (drafted from S04 alone; the full cohort shows each measure agreeing
with participants' own reports in 10 or 11 of 12 cases).

The only exception: a passage explicitly about one participant, as the S01 attention paragraph
is. Even then, the cohort context must be computed first.

---

## III. STATISTICAL DISCIPLINE

- **Within-subject z-scores.** Each participant scored against their own three-episode mean.
  Consequence to remember: **a participant's three composite values sum to exactly zero**, so
  their worst episode is negative *by construction*. Never present that as a finding.
- **Within-cluster permutation** for probabilities, 20,000 shuffles, ratings reshuffled only
  inside each participant. Never the analytic p — the 36 episodes are 12 clusters of 3.
- **Spearman is the reported test** (ordinal scale). **Pearson is shown beside it** as evidence
  of near-linearity — justified because leave-one-out shows influential episodes *suppress* it.
- **Leave-one-PARTICIPANT-out**, not leave-one-episode-out, and re-standardize the remaining
  eleven from scratch.
- **Never assert a magnitude convention** ("0.5 is substantial") without a source. Cohen 1988 is
  contested; it was cut rather than cited.
- **Exact sign test** for paired within-participant comparisons; state the floor at n=11–12.
- **No slopes, no tests on thirds.** Onset-and-duration evidence only.
- **Never claim per-channel significance for a channel that does not reach it.**

---

## IV. HOW TO REFER TO SUBJECTS

- **By number, never by pronoun.** "S04 fought sleep at six against one" — never "they fought
  sleep." The number is the name; the reader must never track an antecedent.
- **Never gendered.** Everything is anonymized.
- Codes are `S01`–`S08` and `R2-01`–`R2-04`. Never a real name, never a source path.

---

## V. PROSE LAW

**Banned outright:**
sentence-initial "And" · "the record" as a name for evidence · "pole"/"poles" · "ladder",
"stall", "stalled" · cost/price/spend metaphors · gambling vocabulary · bold run-in heads ·
"stillness" or any claim the boring film produced stillness rather than restlessness ·
vague paragraph openers and closers · metatextual signposting · **"ones" as a pronoun for
things** ("our reasons were the ones…" is ungrammatical — use "those" or the noun).

**"instrument" is banned as a vague cover.** Name the thing: the eye tracker, gaze deviation,
eye closure, the seven-item survey, "the physiological measurements." Permissible only where a
source uses it or the referent was named in the same breath. **We did not build the EEG or eye
tracker for boredom** — never write "instruments built to detect boredom."

**"mood" is loaded** — the dissertation renders *Stimmung* as attunement. Use it only in that
technical sense.

**Required:**
- **Percentages as numerals** — 78%, not seventy-eight percent.
- **First name + surname at an author's first mention**, surname after.
- **Own publications (King & Salvo) in the FIRST PERSON.**
- **"demonstrated," never "prove."**
- American spelling. MLA. No explicit back-references (one sanctioned exception: the signal
  phrase reintroducing the first form of boredom).
- **Terminology AND plain explanation together** — one committee member is statistically
  literate; the writing must serve both. Name the test, then explain it so a lay reader follows.
- Explain every number. Anchor every claim in verifiable detail. No stylistic gesturing.

---

## VI. PROCESS LAW

- **Stage-3 guided drafting**: paragraph plans first, 1–3 paragraph batches, **approval gate on
  every batch**, bare paragraph numbers when presenting.
- **PRESENT THE PROSE.** Never summarize what you wrote instead of showing it. This was violated
  once and caught.
- **Verification-gated**: quotes EXACT before prose; index entry → `docs search` →
  `verify-quote` (EXACT only, ruling out the two S-04 false-failure modes) → PDF last, all from
  `archon-cli-v3`. Backups before touching approved files. **Nothing committed without explicit
  sign-off — and nothing has been committed across any session of this work.**
- **Flag conflicts, never resolve them silently.** When a source, a spec and the author disagree,
  put the evidence in front of the author.
- **When the author challenges a number, re-derive it from the data.** Every challenge this
  session found a real error.
- **Operational:** never write a `pgrep` pattern that matches the checking process. Use the
  analysis interpreter `/home/dalton/.pyenv/versions/3.11.9/bin/python3` for scipy work.
