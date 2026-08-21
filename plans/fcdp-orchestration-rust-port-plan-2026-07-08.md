# FCDP Follow-up #2 — Rust Port of the Python Orchestration

**Status:** DRAFT for review (2026-07-08)
**Scope:** Follow-up item #2 from `plans/fcdp-archon-port-plan-v2-2026-07-07.md`. Items #1 (`archon draft` subcommand) and #3 (provenance → CozoDB) are explicitly deferred until #2 is implemented and validated.
**Repos:** WSL fork `~/projects/archon-fcdp-fork` (branch `feat/fcdp-draft`, PR ste-bah/archon-cli#51); Mac consolidated `~/projects/archon-cli`.
**Related memory:** [[project-fcdp-archon-port]], [[project-fcdp-drafting-protocol]].

---

## 1. Goal & non-goals

**Goal.** Move the FCDP pipeline *orchestration* — currently seven Python scripts in `scripts/fcdp/` — into the Rust `archon-draft` crate, so the entire protocol runs from one compiled binary with no Python interpreter and no `scripts/fcdp/` path coupling.

**Explicit non-goals (this item):**
- **No behavior change.** The pipeline already passed M6/M7 + Mac E2E. The port must produce the *same gate verdicts and defect lists* on the same inputs. This is a re-implementation, not a redesign.
- **No `archon draft` subcommand yet** (#1). The ported orchestration is exposed through the existing `archon-fcdp` binary via new subcommands (`run`, `slice`, `rcycle`). #1 later re-surfaces those under `archon draft`.
- **No CozoDB** (#3). Provenance stays a JSONL hash chain; only its *implementation language* moves to Rust. The JSONL format is the clean seam #3 will later swap out.
- **No re-calibration.** Bands (`ga-gate-locked-v2.json`), exemplar pool, and pack schema are frozen inputs.

---

## 2. What exists today (inventory)

### Already Rust (`crates/archon-draft`, no change needed)
| Surface | Location |
|---|---|
| Pack + bank schema (serde) | `lib.rs` — `Pack`, `PackMeta`, `P1Task`, `Exemplar`, `QuoteIndexEntry`, `EvidenceItem`, `QuoteBank` |
| G-P gate | `gp_validate()` |
| «Qnn» substitution (G-B pre) | `substitute_quote_ids()` |
| G-A gate + measurement | `ga_compare()`, `measure_text()`, `strip_markup()` (over `archon-lanham`) |
| Binary dispatch | `src/bin/archon_fcdp.rs` — `measure` / `gp-validate` / `substitute` / `ga-gate` |

### Python to be ported (`scripts/fcdp/`)
| Script | Responsibility | Port disposition |
|---|---|---|
| `m6_run.py` (315 ln) | **Full E2E orchestrator**: HEAD-block assembly; D1 movement-plan + G-1; D1.5 skeleton + SURFACE-TO-USER detection; D2 per-movement drafting (exemplars + prior-movement context); assemble; gauntlet cycle 0; R-loop ≤3 (repair prompt restates full plan, L2); outcome + provenance verify/declare. Has RESUME-from-disk logic. | **Port in full** → `orchestrator.rs` |
| `gauntlet.py` (110 ln) | **Mechanical gates** G-B(post)/G-C/G-D/G-F + P2b exemplar 8-gram leak check + foundation-span allowance | **Port in full** (pure regex/text; deterministic) → `gauntlet.rs` |
| `judge.py` (95 ln) | **LLM judge gates** G-E/G-G: battery defs, deterministic LCG Fisher-Yates shuffle, lean-context prompt, Fable call, block-based fail-closed verdict extraction | **Port in full** → `judge.rs` |
| `provenance.py` (80 ln) | JSONL hash chain `record`/`verify` + disclosure `declare` | **Port in full, keep JSONL** → `provenance.rs` |
| `slice_run.py` (90 ln) | D2-slice checkpoint driver (movement-plan inlined) — a strict subset of `m6_run` | **Fold into orchestrator** as a `slice` mode |
| `rcycle.py` (70 ln) | One standalone targeted R-cycle for a G-A failure — overlaps m6's inner loop | **Fold into orchestrator** (the R-loop step becomes a reusable fn; expose `rcycle` subcommand for manual single-cycle use) |
| `final_cycle.py` (60 ln) | One-off manual repair with a **hardcoded** defect string (an M6 artifact) | **Do not port as-is.** Generalize into a `repair --defect "<text>"` mode, or drop. Decision below. |

### Reuse target: `archon-llm`
The raw `urllib` POST to `api.anthropic.com/v1/messages` should be replaced by the workspace client:
- `archon_llm::anthropic::{AnthropicClient, MessageRequest}` — async (`stream_message`), tokio-based, used already in `archon-pipeline/src/llm_adapter.rs`.
- `archon_llm::effort::EffortLevel::Medium` → emits `output_config:{effort:"medium"}` + beta header `effort-2025-11-24` — **matches the Python `output_config.effort=medium`**.
- Auth via `AuthProvider` (env `ANTHROPIC_API_KEY`), usage via `UsageAccumulator`.

---

## 3. The one hard constraint: fidelity

The whole port's value is that it **doesn't change what the pipeline does**. Several behaviors are validation-load-bearing and must be reproduced *exactly*:

1. **Fable request shape (L6–L8).** Python sends `model=claude-fable-5`, `thinking:{type:adaptive}`, `output_config:{effort:medium}`, per-stage `max_tokens` (D-stages 8000, repair 16000, judge 9000), **empty-output guard = hard abort**. The Rust call must reproduce this request, including *adaptive thinking* — verify `archon-llm` emits the same body, or the model's behavior (esp. the runaway-thinking failure the effort cap fixed) can differ.
2. **Deterministic battery shuffle.** `judge.py` derives a seed from `sha256(section_id)` and runs an **LCG Fisher-Yates** (`r = (r*1103515245+12345) % 2^31`) — chosen precisely so it's reproducible without a RNG library. Port the integer arithmetic bit-for-bit; unit-test against recorded Python orders.
3. **Verdict extraction.** Block-based (item *N* start → item *N+1* start via `^\s*(?:\*\*)?N[.)]`), `VERDICT:\s*(YES|NO)`, **fail-closed** when no clean verdict. Anything looser changes pass/fail.
4. **Gauntlet regexes + 8-gram logic.** G-B/C/D/F patterns, foundation short-span allowance, bank-rendered-form ngram exclusion (bare / text+cite / cite-alone), locus normalization (`--`/en-dash → `-`). Includes the **G-D gendered-pronoun negative-lookahead fix** (`(?!\s+\w+,)`) already committed (`7dde7fc8`/`1db88924`) — must carry over.
5. **Provenance canonicalization.** Chain hash = `sha256(prev + content_sha256 + json.dumps(detail, sort_keys=True))`. Rust must canonicalize `detail` JSON identically (sorted keys, separators) for a self-consistent chain. *Note:* re-verifying historical Python-written chains is not required (those are archived artifacts); internal record↔verify consistency is.

**Design implication:** separate the **deterministic machinery** (gauntlet, judge extraction, shuffle, provenance, loop control) from the **nondeterministic model call**. Only the latter can't be golden-tested. This split is what makes validation tractable (see §6).

---

## 4. Target architecture

```
crates/archon-draft/
  src/
    lib.rs            (unchanged schema/gates + new `pub mod`s)
    gauntlet.rs       ← gauntlet.py   (deterministic)
    judge.rs          ← judge.py      (battery defs, shuffle, extraction; model call via fable.rs)
    provenance.rs     ← provenance.py (JSONL record/verify/declare)
    fable.rs          ← fable() helper over archon-llm + resolve_model() seam (request-shape parity)
    orchestrator.rs   ← m6_run.py + slice_run.py + rcycle.py (stages, R-loop, RESUME)
    bin/archon_fcdp.rs  (+ subcommands: run | slice | rcycle | repair)
  data/               (unchanged: ga-gate-locked-v2.json, exemplar-pool-candidates.json)
```

**Cargo.** Add to `archon-draft`: `archon-llm` (path), `tokio` (workspace, `rt-multi-thread`/`macros`), `sha2`, `async-trait` if needed. The binary's `main` becomes `#[tokio::main]` (or a runtime built for the `run`/`slice`/`rcycle` arms only; `measure`/`gp-validate`/`substitute`/`ga-gate` stay sync). `regex`, `serde`, `serde_json` already present.

**Async seam.** `gauntlet.rs`, `provenance.rs`, extraction, and shuffle are **sync** and independently testable. Only `fable.rs` (and the orchestrator arms that call it) are async. Keep async surface minimal.

**Model client — LOCKED: reuse `archon-llm` `AnthropicClient` (option A).** Idiomatic, gets retry/auth/beta handling free, is the whole point of "port into archon." It's streaming + must be verified to emit the exact `thinking:adaptive`+`effort` body → request-parity assertion is an acceptance gate (§6 V0). (Fallback (B), a minimal raw `reqwest` call mirroring the Python body, is held in reserve only if (A)'s request shape can't be matched without patching `archon-llm`.)

**Model selection — configurable, with a split default (per user).** The Python hardcodes `claude-fable-5`. The port replaces this with a single resolution seam:

```
fn resolve_model(cli_override: Option<&str>) -> String
    = cli_override                       // `archon-fcdp run --model <m>`
   ?? LlmConfig.model                    // ~/.config/archon/config.toml → .archon/config.toml (what the
                                         //   archon system persists; this is the `/model` value's home)
   ?? DEFAULT_MODEL                      // committed constant = "claude-opus-4-8"
```

- **Committed default = `claude-opus-4-8` (Opus).** A fresh clone of the public repo with no config runs on Opus — the *guaranteed-available fallback*, since public access to Fable is uncertain. This is the value that ships in PR#51.
- **Local default = `claude-fable-5` (Fable), via config, NOT via a divergent source tree.** Set `model = "claude-fable-5"` in `~/.config/archon/config.toml` on both WSL and Mac. The resolution seam honors it, so local runs use Fable while the committed source still defaults to Opus. **No git divergence, no risk of Fable leaking into a push or of forgetting to swap** — config lives outside the repo. (Do *not* implement this as a never-push local commit that flips the constant.)
- `--model` overrides per-invocation on either box.
- **The seam is forward-compatible with #1.** The standalone `archon-fcdp` binary #2 keeps does *not* share the TUI's in-session `app.status.model`, so the fully interactive "`/model` then draft in the same session" UX is realized when #1 wires the orchestrator in-process and passes `app.status.model` into `resolve_model`. #2 makes that a one-line hookup by centralizing resolution now.
- **One model drives both drafter and judge** (matching the validated single-model-with-anti-self-preference-mitigations design, R4). Independent judge-model selection is the natural hook for the deferred cross-model G-E audit — a future extension, out of scope here.
- **Fidelity caveat (honesty clause, extends R8):** the stylometric bands (G-A) are model-independent, but the judges (G-E/G-G), the L6–L8 request-shape learnings, and drafting/repair dynamics are model-specific. **Both Fable and Opus are now first-class validation targets** (§6) — Fable because it's the local default, Opus because it's the committed/public default and the guaranteed fallback. Any *other* model remains supported-but-un-validated (user's-risk).

**`final_cycle.py` — LOCKED: drop, fold `rcycle` into the orchestrator.** `final_cycle` is an M6-specific manual patch (hardcoded "44.9 > 44.8" defect); not ported. `rcycle`'s automatic behavior becomes a reusable R-loop step inside `run`; its manual single-cycle use is exposed as the `rcycle` subcommand. No separate `repair` mode (the R-loop covers the automatic case).

---

## 5. Phased milestones

Sandbox-first discipline (per the parent plan): build and differential-test in `~/projects/fcdp-archon-sandbox` (or a scratch branch) before touching the fork's committed crate. Each phase leaves the tree building + green.

| Phase | Deliverable | Exit criterion |
|---|---|---|
| **P0** | Cargo wiring: add deps, tokio main for async arms, empty module stubs | `cargo build -p archon-draft` + existing 2 tests green |
| **P1** | `provenance.rs` (record/verify/declare, JSONL, canonical hash) | Unit tests: record→verify round-trip; `declare` output matches Python on a fixture chain |
| **P2** | `gauntlet.rs` (G-B/C/D/F + exemplar leak) | Golden test: identical defect/advisory JSON vs `gauntlet.py` on ≥3 recorded drafts (incl. the G-D pronoun true-pos + false-pos cases; 7/7 seeded-defect suite) |
| **P3** | `fable.rs` (archon-llm wrapper) + request-parity check | Emitted request body has `model`, adaptive thinking, `effort:medium`, correct `max_tokens`, empty-output guard; live smoke call returns text |
| **P4** | `judge.rs` (battery, LCG shuffle, extraction) | Golden test: identical `battery_order`, `battery_seed`, and verdict extraction vs `judge.py` on recorded model transcripts (replayed, not live) |
| **P5** | `orchestrator.rs` (`run` full E2E: D1/G-1 → D1.5 → D2 → gauntlet → R-loop → outcome/provenance) + RESUME; fold `slice`/`rcycle` | Replay-mode E2E reproduces the Python run's stage sequence, gate reports, and outcome on recorded fixtures |
| **P6** | Binary subcommands `run|slice|rcycle` (+ optional `repair`); delete `scripts/fcdp/` | `archon-fcdp run <pack> <work>` replaces `python m6_run.py`; help text; no Python left in the pipeline path |
| **V** | Validation (see §6) | All gates below pass on WSL **and** Mac |

---

## 6. Validation strategy (the "validated" gate)

Because model calls are nondeterministic, validation splits into **replay** (deterministic, exact) and **live** (behavioral, variance-tolerant). **Two model targets: Fable (local default) and Opus (committed/public default + guaranteed fallback) — both must pass the live gates.**

- **V0 — request parity.** Assert the Rust request JSON equals the Python body (fields, thinking mode, effort, max_tokens) for each call site, **for both `claude-fable-5` and `claude-opus-4-8`** — confirm `archon-llm` emits adaptive-thinking + `effort:medium` correctly for each. Blocks the "silently different model behavior" failure.
- **V1 — golden differential (deterministic core).** Capture inputs + model outputs from a known run as fixtures. Feed identical fixtures to Python and Rust; assert **byte-identical** gauntlet reports, judge battery order/seed/verdicts, and provenance chain structure. Model-independent (fixtures are replayed), so one fixture set suffices. Strongest evidence; mirrors the M7 "byte-identical verdicts vs sandbox" criterion.
- **V2 — regression suite.** 7/7 seeded-defect suite still caught; G-D pronoun fix intact (false-pos suppressed, true-pos still caught); positive+negative controls hold. (Deterministic → model-independent.)
- **V3 — live E2E, WSL, BOTH models.** `archon-fcdp run` on the "Two Unions" pack once with `--model claude-fable-5` and once with `--model claude-opus-4-8`. Fable: expect the same terminal behavior as the Python runs (STOP-AND-SURFACE on the two-unions/one-union G-G tension), allowing generation variance. **Opus: the live acceptance event for the fallback** — capture its outcome, gate reports, and any L6–L8-class behavior differences (thinking-token budgets, empty-output, judge truncation) so Opus-specific tuning, if any, is recorded. Opus is the more expensive run — budget for it.
- **V4 — cross-platform parity, Mac.** Rebuild on the MacBook Air; re-run V1 (deterministic → must match WSL byte-for-byte) and V3 on **both models** (live → same class of outcome per model). Mirrors the gate validation done in M7.
- **V5 — provenance integrity.** Full-run chain verifies; disclosure declaration well-formed (records the *actual* model used, per run).

**Acceptance:** V0–V2 + V5 exact; V3–V4 behaviorally equivalent **on both Fable and Opus** (author-arbitrated, as always). Opus passing V3/V4 is what makes it a validated fallback, not merely the default string. Only then is #2 "done" and #1/#3 unblocked.

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| `archon-llm` won't emit `thinking:adaptive`+`effort` in the exact shape → different model behavior | V0 parity gate; fallback (B) raw reqwest if unmatchable |
| Regex/ngram/shuffle port drifts subtly → different verdicts | V1 byte-differential against Python on fixtures; port arithmetic (LCG) literally with unit tests |
| JSON canonicalization mismatch → chain won't self-verify | Dedicated canonical-serialize fn (sorted keys, compact separators) + round-trip test |
| Async refactor bloats the crate / infects sync gates | Keep async only in `fable.rs` + orchestrator arms; gates stay sync |
| Scope creep from `final_cycle`/`repair` mode | Default: fold `rcycle`, drop `final_cycle`; add `repair` only if cheap |
| PR#51 is mid-review; large change churns it | Build/differential-test in sandbox first, then **stack as follow-up commits** on `feat/fcdp-draft` (decision §8.4 — no full review expected) |
| Fable public access could disappear → public repo unusable | Committed default = **Opus** (`claude-opus-4-8`), validated on Opus (V3/V4) as a guaranteed fallback; Fable is local-only via config |
| Split default implemented as a divergent local commit → Fable leaks into a push, or Opus not really tested | Split achieved via **config override only** (committed source always defaults Opus); both models pass live gates; disclosure records the actual model per run |
| Opus exhibits L6–L8-class differences (thinking budgets, empty-output, judge truncation) vs Fable | V3 on Opus captures these explicitly; Opus-specific request tuning recorded if needed; deterministic gates unaffected |
| Loss of the RESUME cost-saver (avoids re-spending API) | Port RESUME-from-disk explicitly in P5 |

---

## 8. Decisions (LOCKED 2026-07-08)

1. **Model client:** reuse `archon-llm` `AnthropicClient` (option A) + V0 request-parity gate.
2. **Model selection:** configurable via archon config + `--model` override; resolution centralized in one seam, forward-compatible with #1's in-session `/model`. **Split default: committed/public = `claude-opus-4-8` (guaranteed fallback), local = `claude-fable-5` via `~/.config/archon/config.toml` (no git divergence).** Both Fable and Opus are validated (§6 V3/V4 on both); other models un-validated (user's-risk).
3. **`final_cycle.py`:** dropped; `rcycle` folded into the orchestrator (auto R-loop step + manual `rcycle` subcommand).
4. **Landing target:** stack as follow-up commits on `feat/fcdp-draft` (PR#51); no full review expected.
5. **Validation:** V0–V5 as written.

---

## 9. Immediate next step

On approval: **P0 + P1 + P2** (Cargo wiring, `provenance.rs`, `gauntlet.rs`) in the sandbox — all deterministic, all golden-testable against the Python without spending any API tokens. That front-loads the exact-match evidence before any live model work.
