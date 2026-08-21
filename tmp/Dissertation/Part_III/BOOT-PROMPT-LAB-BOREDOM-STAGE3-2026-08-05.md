# BOOT PROMPT — Part III Laboratory Boredom, Stage 3 drafting (paste into a clean session)

---

We are resuming the LABORATORY BOREDOM section of Part III of my dissertation. Stage 2 is finished: the analyses
are complete through v4, the outline is complete at v5, every module has been walked and ruled, and no prose
exists. You are picking up at the pre-drafting step.

**Read these before doing anything else, in this order:**

1. `tmp/Dissertation/Part_III/HANDOFF-LAB-BOREDOM-STAGE3-DRAFTING-2026-08-05.md` — full state. Read it in full
   first. Its §0 carries three requirements that govern everything you do this session.
2. `tmp/Dissertation/Part_III/PART-III-LAB-BOREDOM-SECTION-OUTLINE-v5-2026-08-05.md` — the drafting
   specification, module by module, L0 through L7. This is what you draft from.
3. `tmp/Dissertation/Part_III/DECISIONS-REGISTER-v7-2026-08-05.md` — every ruling. §0–§5 are binding; §6 is the
   four still-open decisions.
4. `plans/fable-console-drafting-protocol-v2.md` — the drafting method of record. §0 roles and invariants, §9
   invocation checklist.
5. `tmp/Dissertation/Part_III/PROSE-METHODS-CRITERION-VALIDITY-v1-2026-08-04.md` and
   `PROSE-METHODS-GAZE-BASELINE-v1-2026-08-04.md` — two drafting-ready methodological statements, already
   written. Paste them where the outline says; do not rewrite them.
6. From `tmp/Dissertation/Part_III/boredom-analysis-v4-2026-08-04/`: `FINDINGS.md`, `METHODS.md`,
   `APPENDIX-CRITERION-VALIDITY.md`, `QC-REPORT.md`, `EXCLUSIONS.log`, `figures/INDEX.md`. **v4 is current and is
   the only tree you may quote numbers from.**
7. From `tmp/Dissertation/Part_III/drafts/`: `DESKTOP-M4-DRAFT-v1.tex` ¶¶4–7 of M4.1 — the three-forms exposition
   this section inherits and never re-derives — and `DESKTOP-M7-DRAFT-v1.tex` M7.1, the hand-forward it redeems.
   Read the file headers; they carry binding rulings.

---

## THREE REQUIREMENTS, NON-NEGOTIABLE

**1. Drafting runs under FCDP.** Pack → D1 → D1.5 → D2 with `«Qnn»` markers → `substitute-quote-ids.py` → the
seven-gate gauntlet → targeted revision (≤3 cycles) → my review. Prose and judge steps run on Fable 5 at xhigh;
judge passes are separate lean-context calls. **Tell me before drafting starts so I switch the model myself.**

**2. All source retrieval, analysis and verification comes from the WSL `archon-cli-v3` project and nowhere
else.** Binary `/home/dalton/projects/archon-cli-v3/target/release/archon`, store `.archon/`, corpus `corpus/`,
and **index `index/` at the project root — NOT `corpus/index/`.** Do not touch `projects/archon-cli`, the
`claudeflow-testing/corpus/` tree, the Mac replica, ChromaDB, LEANN, god-learn, or any web search. The two index
trees diverge; reading the wrong one is the easiest mistake available. Retrieval order is index entry →
`docs search` → `docs verify-quote`, **gated on EXACT MATCH, never on "found" and never on a fuzzy hit.** The
shell resets its working directory between calls, so `cd` to the v3 project inside every command.

**Reconcile 1 and 2 correctly — this is the likeliest process failure.** FCDP says the pack is authoritative and
there is no retrieval during drafting. So: retrieval happens **only** at pack assembly and at the optional
post-gauntlet verification stage, and at those moments it comes **only** from archon-cli-v3. During D1, D1.5, D2
and the gauntlet there is no retrieval at all — a missing quotation becomes `******` and waits for a pack
revision, never a mid-draft lookup.

**3. Do two things before any drafting.**

- **Step A — read the eighteen unit entries that get worked prose in L1 and verify every quotation EXACT.** The
  list is in handoff §0.3. Four further documents (Eastwood 2012, Fahlman 2013, Mugon 2020, van den Brink 2016)
  have no index entry yet and must be read from the store directly. This is a working session in itself.
- **Step B — run X-07**, the v5 analysis regeneration pass: the three artefact defects, the two gaze-caption
  defects, the eye-openness → eye-closure rename, the American spelling sweep, and X-06 (the per-participant
  gaze baseline into the criterion family, plus per-round criterion splits). Handoff §0.3 lists every item. Run
  `/home/dalton/.venv/bin/python analysis/run.py` from `boredom-analysis-v4-2026-08-04/`; about six minutes.
  **Never edit `scripts/boredom-o9/`.**

Then bank the O-03 ruling into `DECISIONS-REGISTER-v8-…` and fold its consequences into
`PART-III-LAB-BOREDOM-SECTION-OUTLINE-v6-…`. Version chains everywhere; prior versions are never edited.

---

## WHAT THE SECTION ARGUES

This is applied philosophy: a phenomenological and rhetorical-ontological frame interpreting quantitative data
collection and analysis. The two published studies did not lack a frame — they had a different one, named it, and
built the study on it. They adopted Fahlman's definition of boredom, which is Eastwood's, and which requires that
the bored person attribute the cause to the environment. Heidegger's second form denies exactly that condition.
So the published studies could only ever have detected the first form; the keystone shows up as a **divergence
rather than a measurement**; and the self-report channel is itself a first-form instrument, which is both a limit
and the condition that makes the divergence legible. What the section demonstrates is what philosophy reveals
when applied to scientifically collected and statistically analyzed data.

---

## FOUR THINGS THAT MUST NOT BE VIOLATED

**Head movement.** It is present in this data — visible in the session video, where the head rolls about 90° and
pitches far enough down to take the film out of view — and it is **not instrumented in this pass**, for two
reasons: gaze is recorded eye-in-head, and Round 1 participants were instructed not to move because it would
corrupt the EEG. **Never write that the boring film produced stillness rather than restlessness.** The accurate
form is that the eye channels show withdrawal and the search behaviour visible in the session video was not
instrumented here.

**Profound boredom cannot be measured, and this is the frame's own rule, not our modesty.** Heidegger: *"Not only
can an attunement not be ascertained, it ought not to be ascertained, even if it were possible to do so,"* since
*"all making conscious means destroying, altering in each case."* No measurement in this section evidences
profound boredom and none is claimed to. What the instruments show are episodic structures resembling parts of
its anatomy, named as resemblances every time. **Display this note in the text wherever the third form appears.**

**Every criterion probability is a within-subject permutation p**, not the analytic one. Three associations clear
alpha analytically and do not clear it under permutation; they are reported as non-significant. Never quote an
analytic p as though it were the result.

**Potentiality.** The situation does not furnish a single act; it **narrows the field** of potentialities
available for actualization. Watching is what it furnishes toward the film — closing the eyes, shifting and
falling asleep remain available and were actualized. Sleep is an actualized potentiality, not an absence.

---

## STANDING RULES, ALL IN FORCE — detailed in handoff §6

Verification-gated: quotes EXACT before entering prose; index entries first, then archon, then PDFs; FCM page
loci read from the running head, never computed. Backups to `.backups/` before touching any approved file.
Doctrine locks: chain-node walkthrough is the analytical form · NO-STALL, the chain runs always · GREATEST-DESIRE,
never "better route" · "demonstrated" never "prove." Standing sweeps before every batch. Scientific-direct
register, MLA, *Rhetorica* in Aristotle parentheticals, no module labels in rendered text, bare paragraph numbers
when presenting. **American spelling — "center," never "centre."** Statistics reported as directional convergence
plus the surfaces that actually reach significance, never per-channel significance for those that do not; anything
n < 6 labelled descriptive. Category caution: episodic structural grammar, never a *Grundstimmung* claim. PII:
`S01`–`S08` and `R2-01`–`R2-04` only, in any file; the crosswalk is never persisted; Round 1 source filenames
carry participant names, so never reproduce file paths in output. I may use real names in conversation and they
must never reach an output. Discuss forks in prose, never polls. Ultracode off. **Nothing gets committed without
my explicit sign-off — nothing across any of these sessions has been committed.**

---

## ONE OPEN ITEM THAT NEEDS ME EARLY

O-03 is resolved in substance — one Round 2 participant was also a co-author of the published gaze study, and he
is R2-03 — but three things follow that I have not yet ruled on: the disclosure wording, the re-identification
question, and the analytic consequence. R2-03 is the participant whom nothing bored and the recurring reverse
case, so **hypothesis awareness is now a live alternative account of that profile** and belongs in L4.2 beside
the existing explanation and in L6 as a limit. Handoff §3.2 states all three. Raise it with me early.

---

**Start by reading the handoff and the outline, then tell me where we are, confirm the three requirements above,
and propose what to do first.**
