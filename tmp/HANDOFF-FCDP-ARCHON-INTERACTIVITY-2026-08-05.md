# HANDOFF — Make archon-cli's FCDP interactive

**Date:** 2026-08-05
**From:** analysis session (Opus 5, claudeflow-testing)
**To:** a model conducting the improvement analysis
**Task:** design how to make the FCDP implementation in `archon-cli` interactive, in the way the
console protocol in `claudeflow-testing` is interactive.

**Read this document first, then the two reports it points to.** Everything below was verified
against the working tree on 2026-08-05; §8 states exactly what was and was not checked.

---

## 1. The task, stated precisely

`archon-cli` contains a complete, tested Rust implementation of FCDP (the Fable Console Drafting
Protocol). It executes the protocol's pipeline correctly and enforces its mechanical invariants
better than the original. **But it runs start-to-finish with no human control points.** The console
version's defining property — that the author approves the plan before prose exists, and that a
live objection stops the pipeline rather than being logged — did not survive the port.

The analysis you are being asked to conduct: **how should archon's FCDP become interactive, and
what should "interactive" mean here?** That second half is not rhetorical. The console version is
interactive because a human and an assistant are taking turns in a conversation. Archon is a
compiled batch engine invoked from a CLI and a TUI. Transplanting the console's interaction model
literally is probably wrong; the question is which of its control points are *load-bearing* and
what shape they should take in a program.

A constraint worth honoring: archon's batch mode is genuinely valuable (see §3.2). The goal is
almost certainly **to add an interactive mode, not to convert the engine**.

---

## 2. Documents produced in this session

Both live in `claudeflow-testing/tmp/`. Read them in this order.

### 2.1 `FCDP-PROTOCOL-ANALYSIS-REPORT-2026-08-05.md`
Analysis of the **console** protocol — the thing archon should become interactive *like*. Covers
purpose, the four invariants, all seven gates, the tooling, calibration, the two real runs, and a
full how-to guide. Sections most relevant to your task: §2.3 (invariants), §4.2 (Stage D1 and its
approval gate), §4.5 (the gauntlet), §7 (what the gates actually caught in practice).

It also documents four verified defects in the console side — a broken `style-status.mjs`, a
LaTeX stripper that reintroduces citation-apparatus contamination, the whole apparatus being
untracked in git, and an undocumented `«Qnn@»` mode. Those are context, not your task.

### 2.2 `FCDP-ARCHON-VS-CONSOLE-COMPARISON-2026-08-05.md`
The head-to-head. Gate-by-gate comparison table (§4), the G-A rebuild (§5), **what the port dropped
(§6)**, what it added (§7), risks (§8), and recommendations (§10). §6.1 is the problem you are
being handed.

---

## 3. Findings that matter for your analysis

### 3.1 The gap, located exactly

`crates/archon-draft/src/orchestrator.rs`:

| Line | What's there | What's missing |
|---|---|---|
| `run()` @ 412 | The whole pipeline, synchronous, no pauses | Any approval point |
| 443–471 | D1 generated → `g1_pass` → straight on | The console's default-ON plan approval |
| 488 | `let surface = d15.contains("SURFACE-TO-USER");` | This should *stop* the run; it only sets a bool |
| 557 | `while !res.all_pass() && cycle < MAX_CYCLES` | No per-cycle human checkpoint |
| 129 (d15 prompt) | Literal header `APPROVED MOVEMENT PLAN:` | **Nothing approved it.** The label is aspirational |

`g1_pass()` (orchestrator.rs:306) is the only thing between the plan and the prose, and it is a
substring check: every quote/evidence ID must literally appear in the plan text, and the string
"MOVEMENT 3" must be present. It cannot detect an orphan claim, a bad movement order, or a wrong
disposition — the things a human reads a plan *for*.

**In the console protocol, run 1 needed four D1 versions before approval.** That iteration is the
single highest-leverage control point and archon has no equivalent.

### 3.2 What batch mode buys — do not regress it

`run()` takes an injectable `ModelCall` closure (orchestrator.rs:25). That one seam is why the
whole pipeline — stage sequencing, G-1, gauntlet composition, R-loop, stop rule, provenance chain —
is deterministically testable from recorded outputs with no live API. **45 tests pass**
(`cargo test -p archon-draft`, verified 2026-08-05: 22 unit · 14 golden · 9 orchestrator).

Any interactivity design that makes `run()` non-testable, async, or dependent on a terminal has
paid too much. The existing seam is also the template for the answer — see §4.1.

### 3.3 Other port gaps, in case your analysis should widen

These are documented in the comparison report §6 and are adjacent to interactivity:

- **G-F is nearly hollow** (gauntlet.rs:342–351). The console's 7-step degradation protocol,
  forbidden-phrase blacklist, and turn-weight gate became a word-count check and a Unicode check,
  and *both are advisories that cannot fail the gate* (`pass = defects.is_empty()`, gauntlet.rs:353).
- **Three movements are hardcoded** — the D1 prompt says "use 3 movements", `split_movements` takes
  3 (orchestrator.rs:135), and `mv_types` is a fixed 3-element array (orchestrator.rs:436).
- **Repair is whole-draft, not per-movement**, even though D2 drafts movement by movement.
- **Default model is off-spec**: `DEFAULT_MODEL = "claude-opus-4-8"` at `effort: medium`
  (fable.rs:26, 95). The protocol and the live Lab Boredom boot prompt both require Fable 5 at xhigh.
- **No `docs/fcdp/README.md`** despite `Cargo.toml` and `lib.rs` both referencing it.

Treat these as in-scope-if-useful, not as the assignment.

---

## 4. The technical landscape — seams that already exist

**This is the most useful part of this handoff.** The codebase already contains, in working and
tested form, every architectural pattern the interactive version needs. The work is likely
composition, not invention. Verify each of these yourself before relying on it.

### 4.1 The injectable-callback pattern (orchestrator.rs:25)

```rust
pub type ModelCall<'a> = dyn Fn(&str, u32) -> Result<FableResponse, FableError> + 'a;
```

Production binds it to the live client; tests bind it to recorded outputs. **The obvious shape for
approval is a second seam of the same kind** — an approval callback that batch mode binds to
"always approve" and interactive mode binds to a real prompt. Tests keep working because they bind
it to a scripted decision. Worth checking whether this preserves the golden tests byte-for-byte.

### 4.2 Per-stage artifacts are already persisted

`run()` writes `d1-plan.md`, `d15-skeleton.md`, `d2-m{1,2,3}.md`, `draft-presub.md`, `draft.md`,
`draft-presub-r{N}.md`, `draft-r{N}.md`, `provenance.jsonl`, `declaration.md`, `outcome.json`.
Every stage boundary already has a durable artifact — so a pause point does not need new state.

### 4.3 Resume already exists, and is coarser than it needs to be

orchestrator.rs:426: `let resume = work.join("draft-presub.md").exists();` — if the pre-substitution
draft is on disk, D1/D1.5/D2 are skipped and their artifacts are read back from disk instead.

**This is a pause/resume mechanism that already works; it just has exactly one resume point.**
A finer-grained version (d1-plan.md exists but d15-skeleton.md doesn't → resume at D1.5) is a small
extension of code that is already there and already tested (`resume_skips_drafting_calls`). That
suggests one candidate design: *interactivity as suspend-and-resume* rather than as blocking
prompts — the run stops at a boundary, writes its artifact, and exits; the human edits or approves;
the same command re-invoked resumes. This has the significant property of working identically in
CLI, TUI, and headless contexts.

### 4.4 A decide → accept/revise/reject loop already exists — but post-run

- `crates/archon-evidence/src/outcome.rs` (247 LOC) — `Decision::{Accept, Revise, Reject}`,
  `ReviewedOutcome` persisted as `<workdir>/outcome.json`. Its own header calls it "the final seam
  of the pipeline."
- `crates/archon-tui/src/screens/outcome_review.rs` — an interactive modal FSM presenting status,
  cycles, provenance verdict, counterargument disposition, and worst-first concerns, walking the
  reviewer to a disposition, with a notes-entry step for Revise.
- CLI equivalent: `archon evidence review-outcome <workdir> --accept | --revise "notes"`.

**The entire interaction pattern you need already exists — it is just wired to the wrong end of the
pipeline.** A major question for your analysis: can this be generalized to a stage-agnostic review
seam applied at D1 (and optionally D1.5 and each R-cycle), rather than only at the end?

### 4.5 The TUI screen conventions are established and pure

`crates/archon-tui/src/screens/` contains `draft_wizard.rs`, `evidence_curation.rs`,
`outcome_review.rs` — all **pure state machines with no I/O**, unit-testable without a terminal,
with the I/O living in `crates/archon-tui/src/event_loop/{draft_wizard,evidence_curation,outcome_review,ask_user}.rs`.
`draft_wizard.rs`'s own header documents the pattern: it walks steps, then yields a command string
re-injected via `input_tx` so the existing one-shot handler is reused unchanged.

There is also `CommandEffect::RunDraft` (src/command/context.rs:491, src/command/draft.rs:858) —
the effect the TUI stashes to trigger a run.

### 4.6 A CLI interaction helper already exists

`src/command/draft.rs:485–500` — the `ask(prompt, default)` / `ask_required(prompt)` helpers used
by the guided wizard (`archon draft` with no pack). Plain stdin, with defaults. The wizard already
asks "Run the FCDP draft now? [Y/n]" — so the CLI path already knows how to stop and ask.

### 4.7 The async/sync boundary — a real constraint

`src/command/draft.rs:166` runs the orchestrator on `tokio::task::spawn_blocking`, because the
orchestrator is synchronous and its model client drives its own Tokio runtime (a `block_on` inside
the async main runtime would panic). **Any interactive prompt raised from inside `run()` is raised
from a blocking thread**, which cannot simply await a TUI event. This is the single hardest
technical constraint in the task, and it is a strong argument for the suspend-and-resume design in
§4.3 over blocking-callback designs. Your analysis should weigh both explicitly.

---

## 5. Design questions the analysis should answer

1. **Which control points are load-bearing?** Candidates, roughly in the order the console protocol
   values them: D1 plan approval (highest — run 1 needed four iterations); SURFACE-TO-USER halt;
   per-R-cycle review; D1.5 skeleton review; final acceptance (already exists). Is the answer all
   of them, or is D1 + SURFACE-TO-USER 90% of the value?
2. **Blocking callback vs suspend-and-resume?** §4.1 vs §4.3. Suspend-and-resume sidesteps §4.7,
   works headless, and reuses tested code — but changes the UX from a conversation to a sequence of
   invocations. Blocking is closer to the console feel but must cross the `spawn_blocking` boundary.
3. **Can `outcome_review` be generalized to a stage-agnostic review seam** (§4.4), or does D1
   approval need its own screen and model?
4. **Should approval allow editing, not just accept/revise?** The console author edits the D1 plan
   directly. Archon's artifacts are files on disk, so "pause, let the human edit `d1-plan.md`,
   resume" is nearly free under §4.3 — and is arguably closer to the real console workflow than a
   yes/no prompt.
5. **How does interactivity interact with `MAX_CYCLES = 3`?** The console's rule is that hitting the
   cap means stop and surface a probable *spec conflict*. Should an interactive run let the human
   authorize a 4th cycle, or is preserving the cap the point?
6. **What is the default?** Console FCDP's plan approval is **default-ON, opt out with "draft
   straight through."** Should `archon draft` invert to interactive-by-default with `--batch`, or
   stay batch with `--interactive`? Consider that scripts, the wizard, and any CI depend on current
   behavior.
7. **How is the D1.5 `SURFACE-TO-USER` halt surfaced** without re-running D1? (Note the artifact is
   already on disk, so a halt loses nothing.)
8. **Does interactivity belong in `run()` at all,** or should `run()` be decomposed into
   stage functions the caller sequences — leaving the CLI/TUI to own the interaction entirely? This
   is the largest refactor on the table and may be the correct answer; weigh it against §3.2.

---

## 6. Constraints to respect

1. **Do not break the 45 tests.** The `ModelCall` seam is what makes them possible; preserve
   deterministic testability of stage sequencing, gates, the R-loop, the stop rule, and the
   provenance chain.
2. **Do not weaken the mechanical gates.** The guiding principle recorded in
   `archon-cli/project-work/fcdp-gauntlet-decision-2026-07-14.md` is that mechanical gates are
   deterministic, zero-cost, and fail-closed, and that no new model dependency is added without a
   demonstrated failure it would have caught. Read that document — it also shows the house standard
   for this kind of analysis, including its own rejection of recommendations that were circular or
   uncosted.
3. **The provenance chain must stay intact and verifiable.** Human decisions arguably *should*
   become chain records (they are exactly the "human control points" the auto-generated declaration
   claims — see `provenance::declare`, which currently asserts "Plan approval before drafting" in
   the disclosure text of a pipeline that has no plan approval; that is a live honesty defect worth
   naming in your analysis).
4. **Batch mode must survive** for scripted and wizard-driven runs.
5. **Backwards compatibility of the pack schema** — new fields need `#[serde(default)]`, following
   the `draft_type` precedent (lib.rs:44–64).
6. **Push discipline:** commits and pushes from WSL only, and only after WSL-verified working. Ask
   before either. Do not push to the Mac.

---

## 7. Orientation — where things are

```
archon-cli/  (branch feat/wraith-retrieval)   ← the FCDP ENGINE lives here
  crates/archon-draft/src/
    orchestrator.rs  617  ← the run loop; the gap is here
    lib.rs           739  ← Pack schema, G-P, substitution, G-A comparator, repair hints
    judge.rs         398  ← G-E/G-G, seeded shuffle, fail-closed extraction
    gauntlet.rs      359  ← G-B/G-C/G-D/G-F mechanical
    provenance.rs    363  ← hash chain + disclosure declaration
    fable.rs         394  ← model client, request contract
    bin/archon_fcdp.rs 229
    data/ga-gate-locked-v2.json  ← two-tier variance-derived bands
  crates/archon-evidence/src/outcome.rs   ← the accept/revise/reject model
  crates/archon-tui/src/screens/          ← draft_wizard, evidence_curation, outcome_review
  crates/archon-tui/src/event_loop/       ← their I/O handlers, incl. ask_user
  src/command/draft.rs   1584  ← `archon draft` + guided wizard + spawn_blocking boundary
  src/command/curate.rs  1004
  src/command/evidence.rs 604
  project-work/fcdp-gauntlet-decision-2026-07-14.md   ← house standard for this analysis

claudeflow-testing/                        ← the CONSOLE protocol + this session's reports
  plans/fable-console-drafting-protocol-v2.md   ← CANONICAL console protocol
  FCDP-DRAFTING-PROTOCOL.md                     ← generalized/portable rewrite
  plans/fcdp-archon-port-plan-v2-2026-07-07.md  ← the port plan; §2 has the band-derivation research
  plans/fcdp-orchestration-rust-port-plan-2026-07-08.md
  tmp/FCDP-PROTOCOL-ANALYSIS-REPORT-2026-08-05.md          ← report 1
  tmp/FCDP-ARCHON-VS-CONSOLE-COMPARISON-2026-08-05.md      ← report 2
  tmp/SITREP-FCDP-GG-Section4-2026-07-02.md     ← real run 1; what the gates caught
  tmp/SITREP-FCDP-RDR2-Section5-2026-07-03.md   ← real run 2

archon-cli-v3/    ← NO FCDP. No archon-draft, no archon-evidence. Retrieval only.
```

---

## 8. Verification status — what I actually checked

**Verified by execution or direct read (trust these):**
- All 9 `archon-draft` source files read in full; line references in §3.1 and §4 are from those reads.
- `cargo test -p archon-draft` run 2026-08-05 → **45 passed, 0 failed**. Note: cargo is not on the
  non-interactive `PATH`; use `export PATH="$HOME/.cargo/bin:$PATH"` (and
  `LIBCLANG_PATH=/usr/lib/llvm-18/lib` for the full workspace).
- `ga-gate-locked-v2.json` parsed and both tiers dumped.
- Absence of `docs/fcdp/` confirmed; absence of `archon-draft`/`archon-evidence` in `archon-cli-v3`
  confirmed by crate listing.
- Git tracking status of the console-side files confirmed (all untracked, none gitignored).
- Both console protocol documents and both SITREPs read in full.

**Read partially — verify before relying on:**
- `src/command/draft.rs` (1,584 LOC) — read the header, the dispatch path, the `spawn_blocking`
  call, and the wizard's confirm/`ask` section. **Not read end to end.**
- `crates/archon-evidence/` — read `outcome.rs`'s header and `verify.rs`'s signatures; the other
  ~2,800 LOC skimmed by grep only.
- `crates/archon-tui/src/screens/{draft_wizard,outcome_review}.rs` — headers and type definitions
  only. The FSM bodies were not read.

**Not checked at all:**
- Whether the full workspace builds (only `-p archon-draft` was built).
- Any live `archon draft` run against a real pack.
- The `archon-tui` event-loop handlers' internals.
- Whether `CommandEffect::RunDraft` can carry new interactive state.
- The Mac replica's state.

**One thing I could not resolve:** the honesty defect in §6.3 — `provenance::declare()` emits
"**Human control points.** Plan approval before drafting" into the disclosure declaration, but the
pipeline it describes has no plan approval. I did not determine whether this text was written
against the console protocol's spec or is a port artifact. It is worth resolving, because it means
the generated AI-use declaration currently overstates human oversight.

---

## 9. Suggested shape for the analysis output

Following this project's plan-review convention (multi-round, saved to `plans/`), the deliverable
is probably `archon-cli/plans/` or `claudeflow-testing/plans/fcdp-interactivity-plan-<date>.md`,
containing: the control-point decision (§5.1) with reasoning; the architecture choice (§5.2) with
the `spawn_blocking` constraint addressed explicitly; a migration path that keeps the 45 tests
green; the default-mode decision (§5.6) with its compatibility consequences; and an explicit
list of what was considered and rejected, with reasons.

Hold it to the standard set by `project-work/fcdp-gauntlet-decision-2026-07-14.md`: name what is
already shipped before recommending it, cost anything that adds model calls, and do not trade
determinism for advisories whose value is asserted rather than measured.
