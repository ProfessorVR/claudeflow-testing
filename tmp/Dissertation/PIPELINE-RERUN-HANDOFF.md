# Pipeline Re-Run Handoff Prompt (Post-Citation-Marathon)

**For**: New Claude Code session
**Generated**: 2026-05-20 by previous session
**Predecessor session deliverable**: Citation marathon §§1.0–1.5 complete + all user-action items resolved
**This task**: Execute workflow §10 post-marathon pipeline re-run

---

## Paste-ready prompt for new session

> The citation marathon for §§1.0–1.5 of my dissertation chapter completed on 2026-05-19, and I cleared all user-action items on 2026-05-20. Now I need to execute the post-marathon pipeline re-run per workflow §10 of `tmp/Dissertation/CITATION-MARATHON-WORKFLOW.md`.
>
> **Read first (in order):**
> 1. `tmp/Dissertation/DISSERTATION-ANALYSIS-PIPELINE-PLAN.md` (v1.4, ~1,400 lines, self-contained — the canonical execution plan; agents read this one file)
> 2. `tmp/Dissertation/CITATION-MARATHON-USER-ACTIONS.md` — consolidated list of resolved and deferred items
> 3. `tmp/Dissertation/.backups/2026-05-19T2304-pre-citation-fill-DISS-04-EMOTION/SESSION-REPORT.md` — final marathon session report with workflow-wide totals
> 4. `/home/dalton/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/project-dissertation-analysis-pipeline.md` — auto-loaded; current execution state through marathon-complete
>
> **Run-id information:**
> - Previous run-id: `2026-05-13T1439` (the Phase 4 citation-fill analysis being re-run against the revised state)
> - New run-id: generate a fresh `YYYY-MM-DDThhmm` timestamp at start
> - Output root: `corpus/index/Dissertation/_run-history/<new-TS>/`
>
> **Deliverable:**
> - Execute Phase 0–5 per the plan v1.4
> - Generate `_living/diff-from-previous.md` against the 2026-05-13T1439 run
> - Surface in the diff: **resolved** gaps (target 207 → near 0), **remaining** deferred items, and **newly introduced** inconsistencies if any
>
> **Current dissertation state after marathon + cleanup:**
> - §1.0 canonical file: `tmp/Dissertation/1.0 - Introduction/1.0 - Introduction.md`
> - §1.1 canonical file: `tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex` (NOT the .md — see §1.1 rule below)
> - §1.2 canonical file: `tmp/Dissertation/1.2 - A1-A2 - Aisthesis/1.2_A1-A2_Aisthesis_OUTPUT_v1.tex` (NOT the .md)
> - §1.3 canonical file: `tmp/Dissertation/1.3 - A3 - Orentational Modes/1.3 A3 - Orientational Modes.md`
> - §1.4 canonical file: `tmp/Dissertation/1.4 - Emotion is Motion/1.4 - Emotion is Motion.md`
> - §1.5 canonical file: `tmp/Dissertation/1.5 - A4 - Completed Action/1.5 - A4 - Completed Action.md`
>
> **Marathon-wide totals applied:** ~84 substantive citation fills, ~52 net new footnotes added, ZERO `\textbf{******}` placeholders remaining, ZERO UNVERIFIED markers remaining, 1 HL marker preserved at §1.0 L41 (intentional). All brace-balances preserved.
>
> **Workflow rules established during marathon (logged in memory, apply to pipeline):**
> 1. **File-state check on each section entry** — Check for `OUTPUT_v[12].tex` parallel to canonical `.md`. If `.tex` exists and post-dates the analyzed `.md`, treat `.tex` as canonical and apply via content-matching (already done — §1.1 uses v2.tex, §1.2 uses v1.tex).
> 2. **Cross-check .md before WebSearch/Perplexity** — God-write `OUTPUT_v[12].tex` export sometimes drops verbatims from `.md` into `\textbf{******}` placeholders. Always check the section's `.md` as a verbatim source before escalating.
> 3. **Corpus-grounded subsumes Tier C** — When a Tier A corpus/index source covers a fill, the corresponding Tier C Perplexity fallback is subsumed.
> 4. **Deep-research essays are leads, not sources** — Perplexity sonar-deep-research essays are literature-survey syntheses; cite the secondary sources they surface (Sherman, Aubenque, Broadie, McNeill) as `cf.` references, do not integrate essay prose.
> 5. **Verify Perplexity verbatims against actual PDFs** — Perplexity fabrications were caught in the marathon (e.g., §1.1 G15 Taft GA 3 verbatim was fabricated, §1.1 G06 Burke pp.214-215 location was wrong). Treat Perplexity-generated verbatims as unverified until cross-checked against actual primary source PDFs (`corpus/rhetorical_ontology/*.pdf` has BT, BCAP, RoM, GoM, Kant-and-the-Problem all local).
>
> **Deferred items expected to surface in diff (NOT bugs):**
> - §1.0 L41 `\hl{cognition itself specifies under a different logos.}` — preserved per user judgment (G16 footnote provides support; HL kept as conceptual-development flag)
> - §1.3 L45 `\hl{(Repeat quote in the final settled disposition section.)}` — author TODO note, intentional
> - §1.5 footnote density elevated (added 17 footnotes incl. 5 substantial CRITICAL-DISSERTATION-NOVEL interpretive flags per user direction)
> - Some §1.0 quote-fidelity notes (G09 DA I.4 408b5-7 paraphrastic; G09 Phys VII.3 ellipsis-spliced) — flagged not errored
>
> **Pause-and-surface triggers:**
> - Pipeline configuration questions (which phases, agent selection)
> - If Phase 4 wants to issue fresh Tier C Perplexity queries — most should be cache-hit, not fresh (the 244-entry MASTER-CITATION-REPORT cache was integrated)
> - If the diff surfaces brace-balance regressions, new placeholders, or unexpected NEW inconsistencies in any of the 6 sections
> - Pre-flight Qs A-H from plan §15 are resolved — do not re-ask
> - Per plan §10.3: pause-and-notify if Perplexity escalation needed beyond cached queries
>
> **Memory-loaded context:**
> - `MEMORY.md` index references the marathon-complete state at 2026-05-19T2325
> - `project-dissertation-analysis-pipeline.md` has the full execution state including each section's session-end report path
> - Workflow rules above are documented in the project memory file
>
> Begin with the workflow doc + plan file read. Confirm understanding (briefly), then start Phase 0 execution. Generate the new run-id at the start and pin it for the entire run.

---

## Why a clean session is recommended

The marathon session is saturated with section-specific edit details, fill files, and verbatim resolutions. The pipeline re-run is a different task type (analysis/diff generation, not editing) with substantial wall-time. Loading a clean context from the plan file and memory gives better signal-to-noise for the analysis phases.

## How to use this handoff

1. Open a new Claude Code session in `/home/dalton/projects/claudeflow-testing`
2. Paste the prompt block above (everything between the `>` markers)
3. Confirm the assistant reads the workflow doc + plan + user-actions file + marathon final report before starting
4. Approve the new run-id generation
5. Let Phase 0–5 execute; surface only the pause-triggers above

## Reference paths (for the new session)

```
tmp/Dissertation/CITATION-MARATHON-WORKFLOW.md          — workflow doc
tmp/Dissertation/DISSERTATION-ANALYSIS-PIPELINE-PLAN.md — canonical plan (v1.4, ~1400 lines)
tmp/Dissertation/CITATION-MARATHON-USER-ACTIONS.md      — consolidated action items
tmp/Dissertation/.backups/2026-05-19T2304-pre-citation-fill-DISS-04-EMOTION/SESSION-REPORT.md
                                                         — final marathon session report

corpus/index/Dissertation/_run-history/2026-05-13T1439/  — previous run output (compare against)
corpus/index/Dissertation/_run-history/<new-TS>/         — new run output target

memory/MEMORY.md                                          — index (auto-loaded)
memory/project-dissertation-analysis-pipeline.md          — pipeline status (auto-loaded if relevant)
```

## Optional: workflow-rule memory save

Before kicking off the new session, you may want to ask the previous-session assistant (this one) to save the Perplexity-verification workflow rule to feedback memory permanently:

> "Save the workflow rule about Perplexity verbatim verification to feedback memory: Perplexity-generated verbatims must be treated as unverified until cross-checked against actual primary-source PDFs; the UNVERIFIED prefix is necessary, not optional. Corpus/index summaries can also be wrong about specific page locations. Always read the local PDF if available before integrating any Perplexity-sourced verbatim."

This memory will then persist across sessions and apply to future research/citation work.
