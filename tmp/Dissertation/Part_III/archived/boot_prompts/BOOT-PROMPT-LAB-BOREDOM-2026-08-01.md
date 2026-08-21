> # ⛔ SUPERSEDED — DO NOT USE
>
> **This document is archived history. It is NOT the current state and must not be
> read as instructions, quoted for numbers, or used to boot a session.**
>
> **Superseded by:** `BOOT-PROMPT-LAB-BOREDOM-v2-2026-08-04.md`
> **Archived:** 2026-08-04 · **Reason:** boots against v3 and omits the permutation-p constraint
>
> Retained only for rollback and audit. If you are an agent selecting a document to
> work from, STOP and use the superseded-by file above.

---

# BOOT PROMPT — paste this into a clean session

Copy everything below the line.

---

We are resuming the LABORATORY BOREDOM section of Part III of my dissertation. The analyses are finished; what remains is the section itself. Read before doing anything else, in this order:

1. `tmp/Dissertation/Part_III/HANDOFF-LAB-BOREDOM-V2-V3-COMPLETE-2026-07-31.md` — full state. Read it in full first.
2. `tmp/Dissertation/Part_III/DECISIONS-REGISTER-v2-2026-07-31.md` — every ruling, deferral and open question. Treat §1–§4 as binding and §6 as the list of things you must not forget I still owe you an answer on.
3. `tmp/Dissertation/Part_III/ANALYSIS-VERSION-DIFF-v1-v2-v3-2026-07-31.md` — what changed across the three analysis versions and every number that moved.
4. From `tmp/Dissertation/Part_III/boredom-analysis-v4-2026-08-04/`: `FINDINGS.md`, `METHODS.md`, `APPENDIX-CRITERION-VALIDITY.md`, `QC-REPORT.md`, `EXCLUSIONS.log`, and `figures/INDEX.md`. **v4 is current**; v1 (`boredom-analysis-2026-07-30/`) is frozen and must not be edited or re-run. Also read `PROSE-METHODS-CRITERION-VALIDITY-v1-2026-08-04.md` — a drafting-ready methodological statement to paste into L2 when drafting reaches it.
5. `tmp/Dissertation/Part_III/PART-III-LAB-BOREDOM-SECTION-OUTLINE-v1-2026-07-29.md` — **read knowing it is stale.** It predates Round 2's re-crop, the channel rulings, the equal-focus ruling, the criterion-validity result and the gaze rebuild. Handoff §4a says exactly what is wrong with it.
6. `tmp/Dissertation/Part_III/reanalysis/boredom-o9-physiological-findings.md` and `boredom-round2-recon-2026-07-29.md` — background, both partly superseded.
7. From `tmp/Dissertation/Part_III/drafts/`: `DESKTOP-M4-DRAFT-v1.tex` ¶¶4–7 of M4.1 — the three-forms exposition this section inherits and never re-derives — and `DESKTOP-M7-DRAFT-v1.tex` M7.1, the hand-forward this section must redeem. Read the file headers; they carry binding rulings.

Then, in this order:

**First, revise the outline.** Produce `PART-III-LAB-BOREDOM-SECTION-OUTLINE-v2-<date>.md` as a new file — never edit v1. Version chains everywhere: v1, v2, v3, prior versions never edited, so we can roll back. In the revision I want to see explicitly:

- **L2** carrying four cohorts, two engines with different axis conventions, the poolability rule, the two window conventions, and the openness-proxy argument promoted from footnote to a paragraph of its own.
- **L3** rebuilt rather than patched: eye-closure as the headline surface, pupil second and honestly weakened by pooling, the criterion-validity result as a new subsection, and the three-film decomposition in place of the clinical-only keystone.
- **L4** with its three corrections — the reverse case absorbed into L4.2 rather than deferred; L4.3's *Zeitvertreib* claim moved from body to eye, citing the amplitude/frequency split; L4.4's third-form analog better evidenced and therefore under harder category caution; L4.5's anomaly pair grown into an anomaly set.
- **L5** **withdrawing** the claim that the IMU supplies the restlessness channel.
- **L6** grown to carry the eye-in-head limit, the deferred head analysis, the window difference and the openness proxy.

Then present it for a module-by-module walkthrough. After the walkthrough, Stage 3 guided drafting in 1–3 paragraph batches with my approval gate on each, bare paragraph-numbers when presenting.

**One drafting constraint that must not be violated:** head movement is present in this data — it is visible in the session video, where the head rolls about 90° and pitches far enough down to take the film out of view — but it is not instrumented in this pass. The section must never say the boring film produced stillness rather than restlessness. The accurate form is that the eye channels show withdrawal and the search behaviour visible in the session video was not instrumented here.

**Standing rules, all in force and detailed in handoff §6:** verification-gated — quotes char-exact against source before entering prose, index entries first then PDFs, entry pdf-page loci run 1–2 high so always re-pin. Backups to `.backups/` before touching any approved file. Doctrine locks: chain-node walkthrough is the analytical form; NO-STALL, the chain runs always; GREATEST-DESIRE, never "better route"; "demonstrated" never "prove". Standing sweeps before any batch. Scientific-direct register, MLA, *Rhetorica* in Aristotle parentheticals. Statistics reported as directional convergence plus the surfaces that actually reach significance, never per-channel significance for those that don't; anything n<6 labelled descriptive. Category caution — episodic structural grammar, never a *Grundstimmung* claim. PII: S01–S08 and R2-01–R2-04 only in any file, crosswalk never persisted; I may use real names in conversation and they must never reach an output. Discuss forks in prose, never polls. Ultracode off. **Nothing gets committed without my explicit sign-off — nothing across the last three sessions has been committed yet.**

Do not re-run the analyses unless something is actually wrong. If you do need to re-run, use `boredom-analysis-v4-2026-08-04/analysis/run.py` with `/home/dalton/.venv/bin/python`, and never edit `scripts/boredom-o9/`.

Start by reading the handoff and the register, then tell me where we are and what you propose to do first.
