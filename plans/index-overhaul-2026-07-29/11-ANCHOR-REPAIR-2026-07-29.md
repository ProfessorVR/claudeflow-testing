# §11 — The concurrent change explained: user's anchor repair, 2026-07-29

*Appendix to `00-SESSION-LOG.md`. Resolves the concurrency finding recorded in §10.*

The §10 concurrency finding is resolved. The user was working on the dissertation in parallel and performed a deliberate anchor repair on the Boredom Experiment entry. Their statement, recorded verbatim:

> **Anchor repair**
>
> Done and verified. Backup at `.backups/20260729-o9-status-repair/`. The four channel nodes that told the runtime three processed channels were raw metadata are down to one — ch-obs, which is legitimately still deferred. The compiled index went from four nodes saying UNPROCESSED to one, with four now carrying real processing detail, and the recompile is clean and additive: 701 nodes, 1,722 canonical terms, 64 tension edges, no loss on any axis. The corrected keystone and the pupil significance now reach the runtime artifact, where before neither did.
>
> Beyond the status repair I folded the five-surface z-score table and the full statistical picture into bex-03, corrected the O-10 gate language in the manifest, bex-00 and the ontology header to your ruling, and rewrote the channel-role sections of bex-02 and bex-03 — because both still described themselves as the two halves of a two-instrument keystone that the reprocessing dissolved. Seven files, all within the Boredom Experiment anchor plus the compiled index.
>
> Modified (6 source files, all in `corpus/index/Boredom Experiment (VR Attention Study)/`):
>
> | File | Lines changed | What I changed |
> |---|---|---|
> | `_synthesis/book-level-ontology.md` | 45 | Gates block (O-10 resolved, O-9 status); future-work paragraph rewritten as a processing-status paragraph; outbound keystone description corrected; §3A definitions for ch-eeg, ch-hmd, ch-fig rewritten from UNPROCESSED to processed-with-results; ch-obs reworded as the one remaining deferred channel |
> | `_synthesis/manifest.json` | 130 | `future_work_deferred_processing` restructured into processed/still-deferred; `currently_usable` rewritten; gates O-10 and O-9 restated, PII marked permanent-unchanged; top-level status; per-channel status fields for all five affected channels |
> | `units/bex-00-corpus-overview.md` | 69 | Gates 2 and 3 rewritten; channel-taxonomy status column updated for five rows; keystone section restated with the non-replication; "Deferred processing" section replaced by "Processing status" |
> | `units/bex-02-eeg-workload.md` | 19 | Register line; channel-role section rewritten — this channel withdrawn from its old role as the keystone's depth half |
> | `units/bex-03-gaze-arousal.md` | 40 | Register line; new section carrying the five-surface z-score table, raw magnitudes, and the full statistical picture; channel-role section rewritten |
> | `units/bex-04-stimulus-corpus.md` | 32 | Header status; ch-hmd and ch-fig sections rewritten as processed with their results; ch-obs heading reworded; channel-role paragraph |
>
> Regenerated (1): `corpus/index/compiled-index.json`, by running `scripts/compile-corpus-index.py`.
>
> Created (untracked): `corpus/index/Boredom Experiment (VR Attention Study)/.backups/20260729-o9-status-repair/` — pre-edit copies of `_synthesis/` and `units/`, plus `compiled-index.json.pre`. The separate `corpus/index/.backups/` directory is not mine; it dates from 2026-07-20.
>
> One caveat about the compiled index that matters if you commit. It was already modified relative to HEAD before this session started — its diff against HEAD is 644 lines, but only 108 JSON lines are attributable to me, measured against the snapshot I took immediately before recompiling. The remainder is uncommitted work from 2026-07-20 that was never committed: the Social Presence, Presence Theory, and Rhetoric of Interactivity entries, and the vle-05 registration. The last commit touching that file is `2f4e3ed97`. So a commit scoped to this file would sweep in roughly five times more change than the repair itself.
>
> Untouched inside the anchor: `units/bex-01-selfreport-record.md`, `_synthesis/graph-channel-map.mmd`, `bridge-sources/paper-digest-pointers.md`.
>
> Deliberately untouched elsewhere in the index, and each now stale:
>
> - `Heidegger - The Fundamental Concepts of Metaphysics/_synthesis/fcm-king-salvo-bridge.md` — the canonical keystone statement, still entirely on the superseded two-instrument reading, awaiting your ruling on sequencing.
> - `Virtual Learning Environments (King–Salvo)/units/vle-02-boredom-raw-dataset.md` — stale in two places now, not one. It still says the (Med) marker's meaning is "unconfirmed → O-10," and it still closes with "FE-U use in the dissertation pending O-10 consent-scope confirmation." Both were settled by your ruling. It also still records the `.mat` processing as deferred under O-9.
> - `Boredom Secondary (Part III)/_synthesis/boredom-construct-measure-concordance.md` — the twelve `****** UNVERIFIED:` channel pointers, still queued as a separate pass.
>
> Nothing is committed or staged.

---

## 11.1 Why this matters to the programme

This repair is a live, unplanned demonstration of two requirements the new creation plan derives from the audit, and it strengthens both.

**Requirement E10 — transactional correction with a reverse-reference index.** One factual change (three channels moving from deferred to processed) left at least three other locations stale, across three different entries. They were found by hand and by memory. The audit independently found the same failure mode with a different fact: a superseded VLE figure that had propagated into **10 live locations in a sibling entry** plus 4 `global-edges.csv` rows. Two independent instances of one defect class inside a single index is the argument for building the reverse-reference index at compile time and making correction transactional.

**Requirement G19 — mandatory post-change corpus-wide consistency sweep as a gate.** The three stale locations are known because the author remembered them. A gate that greps the whole index for assertions about a changed entry's prior state would produce that list mechanically and fail the build until each is resolved or explicitly waived.

**Open decision 4 (the Phase 0 commit) is now sharper.** The user's own measurement — 644 lines of diff against HEAD, of which only 108 are the repair, the remainder being uncommitted 2026-07-20 work covering Social Presence, Presence Theory, Rhetoric of Interactivity and the vle-05 registration, last commit `2f4e3ed97` — states the problem more precisely than the audit's "+583/−55 that nobody can classify." A commit scoped to `compiled-index.json` sweeps roughly five times more change than intended.

**A stale finding to retire.** The audit filed 12 defects against the Boredom Experiment entry, several of which concerned exactly the deferred/unprocessed status this repair corrects. Those are now obsolete in the user's favour. The entry's audit record should be re-derived, not trusted, from here.

---

## 11.2 Correction to §10

`corpus/index/.backups/` is **not** part of this repair; it dates from 2026-07-20. Only `Boredom Experiment (VR Attention Study)/.backups/20260729-o9-status-repair/` is new.

§10.2's mtime table stands. §10.3's characterisation of the change as external to this session stands. §10.4's recommendation to take a fresh post-repair backup stands — and is now more clearly worthwhile, since D1 predates a repair the user wants to keep.

§10.1's correction of my own drift-testing error is unaffected and still stands: the handoff's printed recipe verifies the backup against its own manifest and cannot detect live drift.
