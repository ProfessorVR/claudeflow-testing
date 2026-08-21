# Prompt: §1.5 Revision (A₄ — Three Types of Action) — the chapter's concluding section

**Generated**: 2026-05-26, after the Conceptual Lock-Down session.
**Foundation**: `PROMPT-FOR-1.4-SWEEP.md` (phase model) + `1.5-CONCEPTUAL-LOCKDOWN.md` (the settled decisions).

## What makes §1.5 different from the §§1.1–1.4 sweeps

§§1.1–1.4 were hand-written drafts swept to final quality. **§1.5 is a PIPELINE DRAFT** — Version C: nine independent `/god-write --subsection-mode` runs + a Claude coherence pass, *never human-revised*, ~9,017 body words (+31% over target) — onto which the user has **prepended a `\begin{list}` block of 9 integration notes** (3 of them NOTE-TO-SYSTEM queries, plus placeholder citations). So this is **construction + cleanup**, not a sweep, and it runs in a fixed phase order with the conceptual decisions already locked.

Known pipeline issues (per the coherence-pass report): **17 Gross mentions** (UTMOST-PRIORITY rigor), **4 `[PAGE NEEDED]`** markers, garbled mid-sentence citation splices (L156/169/196/211), a **"Multiple Authors"** artifact, unverified White/Nussbaum/Frede/Hawhee loci, heavy cross-subsection repetition (three-factor schema, "I want to drink," the *aisthēsis*/*Befindlichkeit* parallel ~7×), AI-prose residue (hedging/connective bloat), a broken sentence (L226), and inconsistent node notation (`A\_4` / `A\textsubscript{4}` / `$A_2$`).

---

## PROMPT (paste into a fresh session)

```
I am revising §1.5 (A_4 — Three Types of Action), the CONCLUDING section of the
chapter. Unlike §§1.1–1.4 (hand-written, swept to final), §1.5 is a PIPELINE
DRAFT (Version C; never human-revised; ~9,017 words / +31% over) onto which I
have PREPENDED 9 integration notes. The conceptual lock-down is COMPLETE — the
decisions are settled in 1.5-CONCEPTUAL-LOCKDOWN.md; APPLY them, do not reopen
them. Work the phase sequence below strictly; do NOT skip ahead, and pause for my
signal at each phase boundary.

═══ PHASE 0 — SESSION-START READS (mandatory, in order) ═══
1.  tmp/Dissertation/REVISION-PROTOCOL.md (end to end)
2.  tmp/Dissertation/TODO_NOTES.md — Section D + Section H (full)
2b. tmp/Dissertation/DISSERTATION-CLEANUP-TODO.md (A1–A8 mechanical-convention
    definitions for PHASE 5; the Q1–Q5 context the blueprint distils)
3.  ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
    session-degradation-remediation-2026-05-24.md
4.  memory/: feedback-no-supplies-anchor-pattern.md, feedback-greek-faculty-names.md,
    feedback-no-explicit-back-references.md, feedback-gross-advisor-citation-rigor.md,
    project-aristotelian-terminology-framework.md
5.  tmp/Dissertation/1.5-CONCEPTUAL-LOCKDOWN.md   ← THE SIGNED-OFF DECISIONS; THIS GOVERNS
6.  tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2.tex
    (end to end, INCLUDING the prepended \inlinenote + \begin{list} notes)
7.  tmp/Dissertation/Working tex versions/1.4 - Emotion - The Form of Desire Under
    Evaluative Disclosure-v2.tex (finished exemplar + the emotion→action handoff — DO NOT EDIT)
8.  tmp/Dissertation/Working tex versions/1.3 - A3 - Completed Cognitive Actuality
    and the Three Orientational Modes-v2.tex (A3 + the BCAP p.129 "frequently of
    repetition" hexis anchor — DO NOT EDIT)
8b. tmp/Dissertation/Working tex versions/ — consult §§1.0–1.2 for the chapter arc
    (1.0 - Introduction-v2.tex for the A0–A4 chain + three entry-points;
    1.1 - A0 - Motion and Time as Ontological Horizon-v2.tex for the energeia/kinēsis
    material D4 closes; 1.2 - M0 to A1 - The Actualization of Aisthesis-v2.tex for
    resonant epithymia + the four senses of pathos). DO NOT EDIT.
9.  tmp/Dissertation/Working tex versions/alternate versions/
    1.5-coherence-pass-report-versionC.md (how the pipeline draft was produced + its
    known issues)
10. tmp/Dissertation/GLOSSARY.md + tmp/Dissertation/verbatim_passages.md (registers)

═══ PHASE 0.5 — STATUS SUMMARY ═══
Present (<250 words): file state (lines/words/brace balance); the 9-subsection
structure; a one-line summary of the locked decisions (from the blueprint); the
known pipeline issues; the 9-note integration map. Then BEGIN PHASE 1.

═══ HARD CONSTRAINTS (every phase) ═══
- The decisions in 1.5-CONCEPTUAL-LOCKDOWN.md are SETTLED — apply, do not relitigate.
- DO NOT edit §1.4 or §§1.0–1.3. The §1.4 trim-to-signal is a LOGGED FOLLOW-UP for
  after §1.5 is finalized (blueprint §7).
- Tier-1 protocol every turn: forbidden-phrase check; pattern-not-paragraph scope;
  Gross-rigor (UTMOST) on ALL 17 Gross mentions; PDF-verify any quotation inserted
  at insertion (or flag UNVERIFIED); backup before substantive edits.
- "faculty" (for phantasia/orexis/aisthēsis) → the §1.5 lexicon settled at the start
  of PHASE 1; Greek -ikon names retained for the power/organ.

═══ PHASE 1 — NOTE INTEGRATION (team, note-by-note) ═══
First: settle the faculty-lexicon word (propose the blueprint's candidates; I pick).
Then, for EACH of the 9 prepended notes, in order:
  (a) redundancy check — already covered in the draft? If so, say where + propose
      drop/merge.
  (b) if not, determine the insertion point (per blueprint §6 integration map) and
      propose a LaTeX-ready draft applying the locked decisions + faculty-lexicon;
      verify any inserted quotation at insertion.
  (c) I revise / reject / accept.
  (d) apply; move to the next note.
The 3 NOTE-TO-SYSTEM queries are already resolved in the blueprint (faculty = note 2;
hexis/energeia homology = D4; smoking anecdote = note 9 → illustrates D12's
appetitive→temperance/intemperance, placed in §7). Remove the \inlinenote +
\begin{list} scaffold once drained. Do NOT proceed to PHASE 2 until I signal.

═══ PHASE 2 — MY FLAGGED COMPLEX PARAGRAPHS ═══
I enumerate the paragraphs needing complex work / added research; proposal → approve
→ apply, one at a time. Do NOT proceed to PHASE 3 until I signal.

═══ PHASE 3 — FULL STRUCTURAL / CONTENT SWEEP ═══
Audit every paragraph + footnote → categorized proposal (CRITICAL / HIGH / MEDIUM /
DEFERRED). Apply the locked decisions structurally:
  - Recast the typology to the 3 terminus-types (appetitive / poiēsis / praxis),
    carved by the givenness-of-the-good (D6/D7); retitle §1's "Convergence at Praxis."
  - Reframe §6 → technē vs ethical hexis (D3; the NE II.1 cultivated-through-doing
    parallel); §1.5 OWNS the full synchronic/diachronic loop (D12 graded).
  - Recast §8 Synthesis toward ACTION + the recursive spiral — NOT a re-run of §1.4's
    emotion-thesis.
  - Decide §9 DevNote disposition (keep inline / footnote / move to
    DEFERRALS-AND-FORWARD-ORIENTATIONS.md).
  - Consolidate cross-subsection repetition; repair garbled sentences (L226) + the
    "Multiple Authors" artifact.
  - Canonical node-recap (A_0 dyad; M_2→A_3 "Cognitive Motion", D14).
  - Correct the pervasive "settled doxa"/"settled doxai" → just "doxa" (held/standing); doxa is NOT a species of hexis (D5); recast the practical-syllogism premise as a held doxa deliberation draws on.
  - Ensure the loop section articulates the memory route (D9): memory re-presents past doxastically-ratified, affect-laden content (inherited doxa, no fresh deliberation) — the carrier of the diachronic loop into present action.
We work through the revisions that arise. Do NOT proceed to PHASE 4 until I signal.

═══ PHASE 4 — CITATION VERIFICATION (inline, all of §1.5) ═══
Machine-generated → untrusted. Verify EVERY citation against corpus PDFs. UTMOST-
PRIORITY Gross pass (all 17 mentions; Heidegger and Rhetoric 2005 + Uncomfortable
Situations 2017). Resolve the 4 [PAGE NEEDED] (BCAP ~§§17–18). Verify
White/Nussbaum/Frede/Hawhee + every Aristotle locus. Register verified quotes in
verbatim_passages.md. Flag discrepancies — never silently correct.

═══ PHASE 5 — CONVENTION / AI-PROSE SWEEP (on stable text) ═══
File-wide: forbidden-phrase blacklist; apply the faculty-lexicon; node-notation →
$A_n$; work-titles (De Anima etc.); Greek macrons (ē); English-first German; em-dash
flush; MLA→authoryear/biblatex; back-references. AI-prose: de-hedge ("it is likely
that"/"perhaps"), de-bloat connectives, strip meta-narrative. Post-application
file-wide self-audit greps (report 0-result greps as "verification clean").

═══ PHASE 6 — OPTIONAL TRIM ═══
Address the +31% overshoot on the now-integrated/verified/polished draft, at my
discretion.

═══ PHASE 7 — MAINTENANCE + COMPLETION ═══
Backups; update TODO_NOTES.md (§1.5 status; discrepancies; Section H slips),
GLOSSARY.md (blueprint §5 deltas), memory (new project-section-1-5-walkthrough.md +
MEMORY.md top-line). LOG the follow-ups (blueprint §7). Completion report.
```

---

## Notes on using this prompt

- **Phase-boundary discipline.** PHASE 1 (notes) → 2 (my flags) → 3 (full sweep) each ends on my explicit signal. The mechanical/stylistic sweep is deliberately PHASE 5 — *after* content is locked and citations verified — so it runs once on stable text (see the lock-down discussion of why separation beats collapsing for a high-churn pipeline draft).
- **The blueprint is the spine.** `1.5-CONCEPTUAL-LOCKDOWN.md` carries D1–D14, the givenness-of-the-good principle, the *pathos*/hexis structure, the terminology register (locked + retired), the glossary deltas, the 9-note integration map, and the logged follow-ups. If a session ever drifts, re-anchor there.
- **Citation verification is inline (PHASE 4), not deferred to V1 capstone** — the §§1.0–1.4 norm is reversed here because pipeline citations cannot be trusted.
- **Gross is UTMOST PRIORITY** — 17 mentions, and the pipeline already mis-rendered one as "Multiple Authors." Every Gross quote/locus gets the full Task-#18 treatment.
- **Do not touch §1.4.** Its loop-treatment is intentionally left over-developed until §1.5 is finalized; the trim-to-signal happens afterward so the finalized §1.5 informs it.
- **After §1.5 is complete**: execute blueprint §7 follow-ups (the §1.4 trim + rename; diagram Q2/Q3/Q4; chapter-wide faculty sweep), then the chapter is ready for the V1 capstone verification pass.

---

**End of prompt file.**
