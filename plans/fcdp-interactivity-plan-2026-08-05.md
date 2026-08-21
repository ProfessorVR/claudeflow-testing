# FCDP Interactivity Plan — archon-cli

**Date:** 2026-08-05 · **Round:** 1, revised with round-1 review decisions (no code this session)
**Target:** `archon-cli` branch `feat/wraith-retrieval`, crates `archon-draft` + `src/command/draft.rs`
**Inputs:** `tmp/HANDOFF-FCDP-ARCHON-INTERACTIVITY-2026-08-05.md`, the two 2026-08-05 reports,
`archon-cli/project-work/fcdp-gauntlet-decision-2026-07-14.md` (house standard), author's session
brief (segment-by-segment goal), and direct reads listed in §9.

**Round-1 review decisions (author, 2026-08-05; revised same day):**
1. Revision notes use the **git-commit editor pattern**: choosing "revise" opens `$VISUAL` →
   `$EDITOR` → `nano` (never bare `vi` as fallback) on a pre-seeded buffer — the movement's
   skeleton extract as `#`-commented lines with instructions at top; author writes notes beneath
   the nucleus they concern; `#` lines are stripped on submit; an empty (or comments-only) buffer
   cancels the revision safely. Chosen over terminal entry for idiot-proofing: no terminator
   convention, no paste mangling, full pre-submit editing, zero-cost cancel. The
   Accept/Revise/Edit-draft/Abort *choice* remains a single-key terminal prompt.
2. Per-movement review **shows the movement's D1.5 skeleton extract above the substituted prose**
   — confirmed default-ON. The same extract seeds the notes buffer (decision 1).
3. **First real use is the Lab Boredom section** (Fable 5 @ xhigh mandated; >3 segments).
   Consequence: outline intake, variable movement count, and the model/effort fix are
   prerequisites of first use — former Phase 3 merges into Phase 2 (see §8). **The Lab Boredom
   outlines are still in progress** — the outline is therefore a LIVING input: intake copies and
   hashes it per run, and re-running with an updated outline is a supported operation (fresh D1
   iteration), not an error. Implementation does not wait on outline finality.
4. **Scope isolation (binding).** `archon-cli` is the TEST CASE for this work. All implementation,
   data, and verification stay inside `/home/dalton/projects/archon-cli` — its own corpus
   (`corpus/`, incl. `corpus/boredom`), its own index (`index/`), its own store and ingested data
   (`.archon/`: `archon-data.db`, `doc-vector-store`, `corpus-import`), its own `curated-packs/`.
   Nothing reads from or writes to any other project or directory. **`archon-cli-v3` is
   embargoed**: the FCDP changes are ported to v3 only after archon-cli is verified working as
   intended AND the author gives explicit permission — not before, not partially.

---

## 1. The goal, restated from the author's brief

Not "add an approval gate to a batch run." The target workflow is the live console session:

1. Author supplies (or the system drafts) a **detailed outline**; author and system iterate on it
   until the author is satisfied.
2. The system drafts the **first segment only** and presents it.
3. Author and system go **back and forth on that segment** — notes, revisions — until accepted.
4. Advance to the next segment. Repeat until the section is assembled.
5. Mechanical + judge gates run on the assembled whole; defects surface to the author.

Priority is **speed to usable**: the author wants to draft with this, not admire it. The plan is
phased so the smallest usable interactive loop lands first.

---

## 2. What already ships (named before recommending — house rule)

| Capability | Where | State |
|---|---|---|
| Per-segment drafting | `orchestrator.rs:490–529` — D2 already loops movement-by-movement, writes `d2-m{n}.md` per movement, each with a provenance record | Ships; never presents to a human |
| Durable artifact at every stage boundary | `d1-plan.md`, `d15-skeleton.md`, `d2-m{n}.md`, `draft-presub*.md`, `draft*.md`, `provenance.jsonl`, `declaration.md`, `outcome.json` | Ships |
| Resume | `orchestrator.rs:426` — single point (`draft-presub.md` exists → skip D1/D1.5/D2); tested (`resume_skips_drafting_calls`) | Ships, coarse |
| Deterministic test seam | `ModelCall` closure (`orchestrator.rs:25`); 45 tests (22 unit · 14 golden · 9 orchestrator) drive the pipeline from scripted outputs | Ships — must be preserved |
| CLI prompting precedent | `ask()`/`ask_required()` (`draft.rs:486–512`) — **sync stdin prompts called inside the async wizard fn**; the wizard already stops and asks "Run the FCDP draft now?" | Ships |
| Final accept/revise/reject | `archon-evidence/src/outcome.rs` + `archon evidence review-outcome` + TUI `outcome_review` | Ships (post-run only) |
| Hash-chained provenance with free-form stage names | `provenance.rs` — chain hash covers content + detail JSON; stage strings are not enumerated, so **new record kinds cannot break chain verification** | Ships |
| Pack-schema compatibility precedent | `draft_type` with `#[serde(default)]` (`lib.rs:44–64`) | Ships — the pattern for any new field |

The work is therefore composition and re-plumbing, not invention. The one genuinely new mechanism
is the author-notes revision call (§4.3).

---

## 3. Decision D-1 — Architecture: decompose the orchestrator; the CLI owns the loop

**Decision:** decompose `run()` into stage functions over a shared context struct; keep `run()` as
the batch sequencer, byte-identical in behavior. A new interactive CLI path sequences the stages
itself, prompting between them. This answers the handoff's Q8 **yes** — and reverses the lean I
took before the author's brief, for a reason worth recording.

**Why the brief flips it.** Under a "pause at D1" model, suspend-and-resume (halt policy inside
`run()`, re-invoke to continue) was the cheaper design, and I argued for it. But the actual target
is a *conversational loop*: many small round-trips per segment, each carrying **author notes into
a model prompt**. Under suspend-and-resume, notes have no natural channel — they would have to be
smuggled through sentinel files (`d2-m2-notes.md` newer than `d2-m2.md` → regenerate), a fragile
file-signaling protocol that reimplements function arguments on the filesystem. With caller-owned
sequencing, notes are just a parameter: `revise_movement(ctx, i, prior_text, notes)`. The
interaction the author wants *is* caller-driven control flow; the architecture should say so.

**The `spawn_blocking` constraint (handoff §4.7), addressed explicitly.** The orchestrator is
synchronous; its model client drives its own runtime; today the whole `run()` sits in one
`tokio::task::spawn_blocking` (`draft.rs:166`). The interactive path does **not** raise prompts
from inside that blocking thread — it inverts the nesting: each *stage call* runs in its own
`spawn_blocking` hop, and all prompting happens between hops, on the main task, using the same
sync-stdin `ask()` pattern the wizard already uses today. No orchestrator code ever waits on a
human; no blocking thread ever touches stdin. The constraint stops being a constraint.

**What batch mode becomes.** `run()` survives with its exact current signature and behavior,
re-expressed as the trivial sequencer over the stage functions (no prompts, no pauses). The 9
orchestrator tests and 14 golden tests call it unchanged. Scripts, the wizard's dispatch, CI: no
change. This is the "do not convert the engine" requirement satisfied structurally rather than by
promise.

**Suspend-and-resume is retained as a property, not the mechanism.** Every stage still writes its
artifact before the loop asks anything, so a killed terminal, an OOM, or a walk-away loses
nothing: the interactive command, re-run on the same workdir, fast-forwards through accepted
artifacts to the first unaccepted stage (a small acceptance marker in the workdir records where
the author had gotten to — see §4.6). This generalizes the existing single-point resume instead of
replacing it.

**Testability of the interaction itself.** The interactive sequencer takes a decision seam exactly
analogous to `ModelCall`:

```
type UserDecision<'a> = dyn FnMut(&StagePresentation) -> Decision + 'a;
// Decision = Accept | ReviseWithNotes(String) | EditedOnDisk | Abort
```

The CLI binds it to stdin prompts; tests bind it to scripted decision sequences and drive the full
interactive flow — including multi-iteration segment loops — deterministically with no terminal.
This is the same discipline that made the batch pipeline testable, applied to the new surface.

**Rejected alternative — blocking approval callback inside `run()`:** crosses the
`spawn_blocking` boundary for real (a blocking thread waiting on an async TUI/stdin channel),
cannot express edit-the-artifact naturally, and couples the engine to interaction. Rejected.

**Rejected alternative — pure suspend-and-resume (halt policy, re-invoke per step):** correct for
coarse pauses, wrong granularity for per-segment conversation; notes channel degenerates into file
sentinels. Its one real advantage (headless/SSH-editing workflow) is preserved anyway via the
retained resume property. Rejected as the primary mechanism.

---

## 4. Decision D-2 — The control points, and what each costs

Ordered by the workflow, with the evidence that earns each one:

### 4.1 Outline intake (new)
`--outline <file>`: an author-supplied detailed outline is injected into the D1 prompt as the
authoritative structure the movement plan must realize. D1 still emits the full FCDP plan form
(claims, evidence/quote assignments, disposition table, ledger) mapped onto the author's outline,
and G-1 still gates it — the ledger-closure invariant is untouched. This matches how the author's
live sessions actually begin (outline first) and costs zero extra model calls (same D1 call,
longer prompt). Stored in the workdir (`outline.md`) and recorded in the chain.

**The outline is a living input.** The Lab Boredom outlines are still being revised, so intake
must not assume finality: each run copies the outline into the workdir and hashes it into the
chain, and re-invoking with an updated outline on an existing workdir is supported — it versions
the stored copy (`outline-v{n}.md`) and re-enters the D1 loop against the new structure instead
of erroring. The D1 loop is the mechanism that absorbs outline drift.

### 4.2 D1 plan loop (the highest-leverage point — 4 iterations in real run 1)
Present the plan + the G-1 report. Author chooses:
- **Accept** → proceed (provenance record `d1-approval`).
- **Revise with notes** → one model call regenerates the plan with the notes appended to the D1
  prompt plus the prior plan; new version saved as `d1-plan-v{n}.md`; loop.
- **Edited on disk** → author edited `d1-plan.md` directly in their editor; re-run G-1 on it; loop.
- **Abort** → clean exit; everything on disk.

G-1 failures in interactive mode present-and-loop instead of erroring the run (batch keeps the
hard error).

**Notes entry (both loops):** the git-commit editor pattern (author decision, round 1 revised).
"Revise" opens `$VISUAL` → `$EDITOR` → `nano` on a pre-seeded buffer: instructions and the
relevant contract (for D1, the G-1 report + plan headings; for a movement, its D1.5 skeleton
extract) as `#`-commented lines. Comment lines are stripped on submit; an empty result cancels
the revision (safe mis-key). The stripped notes are saved beside the version they produce
(`d1-notes-v{n}.md`, `d2-m{i}-notes-v{n}.md`) and hashed into the decision's provenance record.
The editor is spawned as a child process from the CLI sequencer between engine hops — never from
inside a blocking orchestrator thread.

### 4.3 Per-movement D2 loop (the author's central request)
After each movement drafts: display **the movement's D1.5 skeleton extract** (its nucleus claims,
labeled satellites with attached quote/evidence IDs, dispositions, rhythm placements — the
contract this prose must realize), then the prose **with quotes substituted** (display-only; the
canonical artifact keeps «Qnn» markers — substitution for display reuses `substitute_quote_ids`
and costs nothing), plus a zero-cost advisory strip: the movement's word count vs. its plan
WORD-SHARE, and any G-D lock / P8 hits within the movement. Reviewing prose against its skeleton
contract is what makes notes targetable ("nucleus 2's concession never appears"). Author: Accept / Revise-with-notes (one model call:
the movement's D2 prompt + prior version + notes) / Edited-on-disk / Abort. Versions saved as
`d2-m{i}-v{n}.md`; decisions recorded. Only on Accept does the loop advance to movement i+1 —
which is exactly the "work back and forth until that segment is complete, then move on" the brief
asks for. Judge gates do **not** run per movement (each would be a model call per iteration for a
whole-draft property; the assembled gauntlet already covers it — house rule: no new model
dependency without a demonstrated failure it catches).

### 4.4 SURFACE-TO-USER halt (fixing a semantic inversion)
Today a disposition that *means* "ask the author" is a post-run boolean. Interactive mode: after
D1.5, if any SURFACE-TO-USER item exists, extract and present those items before any prose is
drafted; author answers (their answer becomes notes to a D1.5 revision call) or waves them
through. Note the console spec itself shows the skeleton **only** in this case — so there is no
standing "review the skeleton" step; this conditional halt is the whole of D1.5 interactivity.
Batch mode keeps the boolean.

### 4.5 Assembled gauntlet + R-loop: stays batch, surfaces interactively
The gauntlet and ≤3 repair cycles run exactly as today — both real runs showed the gates catching
defects autonomously; no recorded case needed a mid-cycle human. On ALL-GREEN, present and point
at outcome review. On stop-and-surface, present the named defects and offer: edit the draft and
re-gauntlet (mechanical-only re-check is free; judges re-run costs 2 calls — stated at the
prompt), or accept-with-defects into outcome review, or abort. **MAX_CYCLES stays 3** — the cap
means "probable spec conflict"; the interactive remedy is editing the pack/plan/draft (changed
inputs), not a fourth identical cycle. The cap-hit message will say "probable spec conflict"
explicitly.

**Rejected: per-R-cycle approval.** Real cost (human latency × up to 3 cycles), value unmeasured
in two live runs. Revisit only if field use shows repair cycles destroying accepted-movement prose
— which the per-movement acceptance records would make detectable.

### 4.6 Interactive-session resume
An `interactive-state.json` in the workdir records the last accepted stage/movement and version.
Re-running the interactive command on the same workdir fast-forwards to the first unaccepted
point. Small, and it generalizes the existing tested resume rather than adding a second mechanism.

### 4.7 Final acceptance
Already ships (`review-outcome` / TUI). The interactive loop ends by invoking it (or printing the
command), not by reimplementing it.

---

## 5. Decision D-3 — Provenance and the declaration honesty defect

**Resolved: the overstatement is a port artifact.** The console protocol v2 has no declaration
template — its P9 is a role-boundary statement, and the protocol derives the disclosure from the
provenance log. The paragraph "**Human control points.** Plan approval before drafting; gate
reports at every cycle …" was authored inside `provenance.rs` in the original port commit
(`8bfe441d`); no predecessor text exists on the console side (checked scripts and plans). It
describes the console *spec* and is emitted unconditionally by an engine that implements neither
claim — and the second clause ("gate reports at every cycle") overstates batch oversight too,
which the handoff did not flag.

**Fix — structural, not textual:** human decisions become chain records (`d1-approval`,
`d1-revision`, `d2-m{i}-approval`, `d2-m{i}-revision`, `surface-response`, with notes hashed into
`detail`), and `declare()` derives the control-points paragraph from the records present — exactly
as it already derives stage sequence, cycles, and gates. A batch run then declares truthfully:
*"Human control points: none during generation (batch run); final acceptance by the author via
outcome review."* An interactive run enumerates what actually happened, per the chain. Since
`stage` is a free string and the chain hash covers content+detail generically, new record kinds
cannot break chain verification or the Python-compat golden test. **This fix ships first and
alone (Phase 0)** — it is the evidentiary basis of the dissertation's LLM-use disclosure and it is
wrong today in the direction of overstating oversight.

---

## 6. Decision D-4 — Smaller items folded in

| Item | Decision | Why |
|---|---|---|
| **Variable movement count** | In scope, Phase 2b. Parametrize `d1_prompt`'s "use 3 movements", `split_movements(n)`, `g1_pass`'s `MOVEMENT {n}` check, and derive `mv_types` (all-but-last `theoretical-exposition`, last `transition-argument` — today's scheme generalized). Pack field `movements` with `#[serde(default = 3)]` per the `draft_type` precedent. With the default, every prompt stays **byte-identical** → golden tests unchanged. | A detailed outline has however many segments it has; the author's real outlines exceed 3. Without this, the interactive loop is a demo. |
| **Default model/effort** | In scope, Phase 2b (small). `DEFAULT_MODEL = "claude-opus-4-8"` + hardcoded `effort: "medium"` (`fable.rs:26,95`) vs. the protocol's Fable 5 @ xhigh mandate. Make effort follow the model choice (config-level), default unchanged for compat; document `--model` for Fable. | The author will actually draft with this; the current default silently violates the drafting mandate in memory (`feedback-drafting-model-fable-xhigh`). |
| **Wizard default** | Wizard (human demonstrably present) defaults **interactive-ON** with an explicit "draft straight through" opt-out — mirroring console default-ON. Direct `archon draft <pack> <wd>` stays batch; `--interactive` opts in. Scripts/CI untouched. | Console fidelity where a human is present; strict compat where one may not be. |
| **G-F rebuild, per-movement repair, `docs/fcdp/README.md`** | Out of scope; listed for the register. | Not on the path to "usable interactive drafting"; G-F per the 07-14 decision doc needs instrumentation first. |

---

## 7. Cost accounting (house rule: cost anything that adds model calls)

- **Batch path: zero new model calls.** Identical call sequence, byte-identical prompts.
- **Interactive path:** every author-requested revision = **one** model call at `D_MAX_TOKENS`
  (plan or movement scale — cheaper than today's whole-draft repairs at `REPAIR_MAX_TOKENS`).
  Calls are strictly author-demanded, bounded by the author's own iteration appetite; this is the
  feature, not overhead. Display substitution, G-1 re-checks, advisory strips, mechanical
  re-gauntlet after manual edit: all zero-cost. Judge re-runs after a manual post-gauntlet edit:
  2 calls, stated at the prompt before spending.
- **No new model dependencies.** No advisory judges, no embedding models. All new gates on the
  interactive path are the existing mechanical ones re-presented.

---

## 8. Phases (ordered for speed-to-usable) and test strategy

**Phase 0 — Declaration honesty fix.** Decision records + derived control-points paragraph
(§5). Independent; ships alone. *Tests:* extend `declare_tests` — batch chain → "none during
generation"; chain with approval records → enumerated points; chain-verify golden untouched.

**Phase 1 — Behavior-neutral decomposition.** Extract stage functions + `RunContext` from
`run()`; `run()` becomes the batch sequencer over them. No CLI change. *Tests:* all 45 pass
unchanged — golden prompts byte-identical (the prompt builders don't move), orchestrator tests
call the same `run()`. This is the refactor risk gate: if 45-green cannot be held here, stop and
reassess before any interactivity lands.

**Phase 2 — The interactive loop, fit to Lab Boredom (the usable core).** First real use is the
Lab Boredom section, so everything first use requires lands here, in two sub-phases that merge
former Phase 3:

- **2a — the loop:** `--interactive` on `archon draft`; the CLI sequencer with the `UserDecision`
  seam; D1 loop, per-movement loop (skeleton extract + substituted prose display), in-terminal
  notes (lone-`.` terminator), SURFACE-TO-USER halt, interactive gauntlet surfacing,
  `interactive-state.json` resume; decision provenance records feeding Phase 0's declaration.
  Wizard gains the interactive default + opt-out.
- **2b — Lab Boredom prerequisites:** `--outline` intake with living-outline versioning (§4.1 —
  the outlines are still in progress, so updated-outline re-entry is a supported operation);
  variable movement count (the Lab Boredom outline has more than 3 segments; without this the
  loop cannot express the section at all); model/effort fix (the boot prompt mandates Fable 5 @
  xhigh — the current hardcoded Opus @ medium default would silently violate it on the very
  first real run).

*Tests:* new orchestrator-style tests drive full interactive sessions from scripted
`UserDecision` + `ModelCall` closures — multi-iteration D1, movement revise-then-accept, surface
halt, abort-and-resume — no terminal required. Golden tests stay byte-identical at default 3
movements; new golden for n≠3 and for outline-bearing D1 prompts. Existing 45 untouched.

**Phase 3 — Deferred, revisit on evidence:** TUI interactive drafting screen (the FSM + `ask_user`
patterns fit, but CLI-first is faster to usable and the TUI FSM bodies remain unread); per-R-cycle
approval; per-movement repair. Each waits for a demonstrated need per the instrument-before-
spending rule.

Estimated diff center of gravity: Phase 1 touches only `orchestrator.rs`; Phase 2a adds one module
to `src/command/` (the sequencer) plus ~4 small prompt-builder additions (notes parameter);
Phase 2b touches `lib.rs` (schema), `orchestrator.rs` (movement plumbing), `fable.rs` (effort).

**Acceptance target for the whole plan:** an end-to-end interactive run of the Lab Boredom
section — pack curated **from archon-cli's own corpus/index/store** (decision 4: no external
retrieval, no v3) — against the **then-current** Lab Boredom outline (still evolving; v5 at time
of writing), on WSL, with the declaration correctly enumerating the session's actual control
points. Success here is the gate for the eventual v3 port, which itself waits on explicit author
permission.

**Phase 4 — port to `archon-cli-v3`.** Out of scope for this plan; exists only as the named
destination. Begins only after the acceptance target is met and the author explicitly authorizes
it. Until then v3 is not read, not written, not referenced by any implementation code.

---

## 9. Verification status of this plan's claims

**Read in full this session:** `orchestrator.rs` (617 LOC — every line reference above),
`provenance.rs` declaration + chain-hash sections, the gauntlet decision doc, handoff, comparison
§6, protocol report §4.2/§7, `lib.rs:40–70` (schema precedent), orchestrator test list.
**Read in targeted part:** `draft.rs` — dispatch (`main_dispatch.rs:73–95`), the `spawn_blocking`
call and post-run path (100–250), wizard confirm + `ask()` helpers (440–560). Not read end-to-end;
Phase 2's sequencer placement should re-verify the post-run import path it must share.
**Checked by search/history:** no console-side predecessor of the declaration text; its origin
commit (`8bfe441d`); `archon-cli-v3` has no FCDP (per handoff, not re-verified).
**Not verified:** TUI FSM bodies and `CommandEffect::RunDraft` capacity (deferred with Phase 3);
full-workspace build; any live run.

---

## 10. Considered and rejected — the register

| Proposal | Verdict | Reason |
|---|---|---|
| Blocking approval callback inside `run()` | Rejected | Crosses `spawn_blocking` for real; can't express edit-and-iterate; couples engine to interaction |
| Suspend-and-resume as the primary mechanism | Rejected (retained as crash-resume property) | Wrong granularity for conversational segment loops; notes degenerate into file sentinels |
| Per-R-cycle human approval | Rejected pending evidence | Two live runs show autonomous gates sufficed; real latency cost, unmeasured value |
| Per-movement judge gates | Rejected | Model call per iteration for a whole-draft property; assembled gauntlet covers it |
| Raising/overriding MAX_CYCLES interactively | Rejected | Cap means spec conflict; remedy is changed inputs, which interactive editing now provides |
| Textual patch of the declaration string | Rejected | Would still assert statically what only the chain can attest; derive it instead |
| TUI-first implementation | Deferred | CLI is faster to usable; TUI FSMs unread; `ask()` precedent already in the CLI |
