I need an analysis of how to make the FCDP drafting protocol in `archon-cli` interactive, the way
the console version in `claudeflow-testing` is interactive. This session produces a **plan**, not
code.

**Read first, in this order:**

1. `/home/dalton/projects/claudeflow-testing/tmp/HANDOFF-FCDP-ARCHON-INTERACTIVITY-2026-08-05.md`
   — the full brief. It locates the gap to the line, maps the seams that already exist in the
   codebase, lists the design questions, and states exactly which of its own claims were verified by
   execution and which were only skimmed. Read §8 before you trust anything in it.
2. `tmp/FCDP-ARCHON-VS-CONSOLE-COMPARISON-2026-08-05.md` §6 — what the Rust port dropped.
3. `tmp/FCDP-PROTOCOL-ANALYSIS-REPORT-2026-08-05.md` §4.2 and §7 — the console's D1 approval point
   and what the gates actually caught on the two real runs.
4. `archon-cli/project-work/fcdp-gauntlet-decision-2026-07-14.md` — the house standard for this
   kind of analysis. Hold your own work to it: name what already ships before recommending it, cost
   anything that adds model calls, and don't trade determinism for advisories whose value is
   asserted rather than measured.

**The problem in one line:** `archon draft` runs D1 → G-1 → D1.5 → D2 → gauntlet → R-loop with zero
human control points, while the console protocol makes D1 plan approval default-ON and halts on a
live counterargument. The D1.5 prompt in `orchestrator.rs:129` even opens with the header
`APPROVED MOVEMENT PLAN:` — nothing approved it.

**Non-negotiables:**

- **Verify before you build on it.** The handoff is 32-hours-fresh but was written by a model, and
  it says plainly which parts are second-hand. `src/command/draft.rs` (1,584 LOC), most of
  `archon-evidence`, and the archon-tui FSM bodies were NOT read end to end. Read what you need.
- **Do not break the 45 tests.** `cargo test -p archon-draft` passes today (22 unit · 14 golden ·
  9 orchestrator). The injectable `ModelCall` closure at `orchestrator.rs:25` is what makes the
  pipeline deterministically testable without an API — whatever you design must preserve that.
- **Batch mode survives.** Scripts and the guided wizard depend on it. The goal is an interactive
  mode, not a converted engine.
- **Address the `spawn_blocking` constraint explicitly** (`src/command/draft.rs:166`). The
  orchestrator is synchronous and runs on a blocking thread, so it cannot await a TUI event. Weigh
  blocking-callback against suspend-and-resume and say why you chose what you chose.
- **No code this session.** Multi-round plan, saved to `plans/`, per my usual plan-review process.
  I'll review before anything is written.
- **Commits/pushes from WSL only, and only after I sign off.** Don't touch the Mac.

**Environment:** cargo is not on the non-interactive PATH — use
`export PATH="$HOME/.cargo/bin:$PATH"`, plus `LIBCLANG_PATH=/usr/lib/llvm-18/lib` for the full
workspace. The FCDP engine is in `archon-cli` (branch `feat/wraith-retrieval`); `archon-cli-v3` has
no FCDP at all, so don't look for it there.

**Two things I want you to form your own view on, not inherit:**

1. Which control points are actually load-bearing. The handoff lists five candidates. I don't want
   all five reflexively — I want an argument about which ones earn their cost. Note that the console
   run that needed four D1 iterations is the strongest evidence available.
2. Whether interactivity belongs inside `run()` at all, or whether `run()` should decompose into
   stage functions that the CLI and TUI sequence themselves. That's the biggest refactor on the
   table and it may be the right answer.

There is also one open defect I want resolved as part of this: `provenance::declare()` writes
"**Human control points.** Plan approval before drafting" into the generated AI-use declaration for
a pipeline that has no plan approval. Find out whether that text was written against the console
spec or is a port artifact, and fold the fix into the plan — that declaration is the evidentiary
basis for my dissertation's LLM-use disclosure, so it cannot overstate oversight.

Start by reading the handoff and telling me what you think the shape of the answer is before you
go deep.
