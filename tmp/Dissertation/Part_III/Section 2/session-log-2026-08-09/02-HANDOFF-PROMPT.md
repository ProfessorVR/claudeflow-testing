# BOOT PROMPT — Lab Boredom Section 2, resuming at L4

**Paste everything below the line into a clean session. Model: Fable 5 at xhigh. cwd:
`/home/dalton/projects/claudeflow-testing`.**

---

You are resuming the drafting of the Laboratory Boredom section of Part III of a dissertation.
Three modules are drafted and author-approved; you are picking up at **L4, The Analysis**.

## Read these first, in this order, before writing anything

1. `tmp/Dissertation/Part_III/Section 2/session-log-2026-08-09/01-LAWS.md` — **binding rules.
   Short. Every one of them exists because it was violated at least once.**
2. `tmp/Dissertation/Part_III/Section 2/session-log-2026-08-09/00-SESSION-LOG.md` — what was
   done, what went wrong, and the verified facts that cost effort to establish.
3. `tmp/Dissertation/Part_III/PART-III-LAB-BOREDOM-SECTION-OUTLINE-v8-2026-08-07.md` — the spec.
   **v8, not v7.** Its opening block carries the governing ruling; the v7 content beneath it is
   superseded wherever the two conflict.
4. The three drafted modules, whose **header comments carry every ruling and verification
   ledger** — read the headers, not only the prose:
   `Section 2/L1-DRAFT-v1.tex`, `L2-DRAFT-v1.tex`, `L3-DRAFT-v1.tex`.

## The five things that matter most

1. **The unit of analysis is the EPISODE; the film is a label, not a variable.** 36 episodes,
   each carrying eye-tracking data and that participant's reported boredom and engagement.
   Which film it was is metadata. **No film comparisons, ever** — and watch for film framing
   re-entering through sentences that merely sound descriptive ("the tutorial was most
   participants' worst episode" makes the film the subject).
   **The evidence is: the two eye measures — gaze deviation and eye closure — against the WHOLE
   survey.** Not only boredom and engagement: sleep-fight, fatigue after, minutes-until-bored and
   depletion all correlate with the eye measures too, and fatigue-before is the near-null
   control. **These items are convergent INDICATORS of boredom — likely, not absolute** — so
   their agreement is convergent validity, not independent corroboration, and each is
   defeasible. Pupil, cognitive load, heart rate and HRV are permanently excluded, each for a
   different reason (see the Laws).
2. **Run all twelve subjects before any data-driven claim.** Drafting from a subset produced a
   false claim once and a badly understated one once, in a single session.
3. **Refer to subjects by number, never by pronoun**, and never with gender.
4. **Present every drafted batch in full** for approval — bare paragraph numbers, 1–3 paragraphs
   at a time. Do not summarize what you wrote instead of showing it.
5. **When the author challenges a figure, re-derive it from the data.** Every challenge in the
   previous session found a real error.

## Your first task — five verifications before any drafting

Outline v8's §L4 was written against the **old** composite and **pre-D-39** numbers. Before
drafting, verify and report:

1. **Which episodes are divergent under the rebuilt composite.** §L4.2 builds a chain-node
   walkthrough on "a divergent participant on the clinical film." There are now **5, not 8**.
   Identify them and confirm one actually fits the description.
2. **Current sleep-fight figures** — §L4.3 cites D-37's, which D-39 changed.
3. **Revisit L3's shared-method caveat.** It says the survey items cannot be corroborated from
   outside the survey. That is now too strong: sleep-fight and fatigue-after both correlate with
   the eye measures (closure +0.663 and +0.688). The caveat needs weakening to match.
4. **`felt_duration` is empty in all 36 rows** of `survey-episodes.csv` — one of the seven
   collected items, with only the derived ratio surviving. Find out why before the appendix.
5. **S08's eye closure across thirds of the boring episode** (the spec cites 16.8% → 58.7% →
   89.2%). D-40 changed the closure definition. Verify. The spec permits **onset-and-duration
   evidence only and forbids slopes or tests on thirds**.

Data lives in `tmp/Dissertation/Part_III/boredom-analysis-v5-2026-08-05/out/`. Use
`/home/dalton/.pyenv/versions/3.11.9/bin/python3` for anything needing scipy.

**Then present a batch plan for L4 — do not draft prose until the plan is approved.**

## State

| module | state |
|---|---|
| L0 Introduction | not drafted |
| L1 Three Literatures | drafted, ~12 ¶¶ — over its page cap, compression **deferred by author** |
| L2 Apparatus and Data | drafted, 19 ¶¶, body complete |
| L3 Findings | drafted, ~25 ¶¶, complete (P27 and two film-framed sentences cut 2026-08-09) |
| **L4 Analysis** | **next** |
| L5–L7 | not drafted |
| Appendices | **deferred by author order until the body is finished** |

The analysis tree is current: D-39, D-40 and D-41 are applied and re-run, all eight gate checks
pass, the D-11 equivalence proof holds at 1.8e-15, and 72 figures regenerate. matplotlib and
scipy are installed. Backups of every pre-change state are in `Part_III/.backups/`.

**Nothing has been committed across any session of this work, and nothing should be without
explicit sign-off.**

## Open items to carry, not to resolve unasked

Figures for the results (a marked instruction block in `L3-DRAFT-v1.tex` lists six candidates) ·
L1 compression · the appendix designation for the two published papers · the seventh survey
item's printed wording, still unverified · O-15's IRB wording at L2.8 · the desktop-section debt
(M4.1 ¶6 cites FCM 110; the author ruled 109) · pack errata for Q21's misattributed cite string.
