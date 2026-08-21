# Porting FCDP v2 → archon-cli — Plan

**Date:** 2026-07-07 · **Status:** SUPERSEDED by `fcdp-archon-port-plan-v2-2026-07-07.md` (research-hardened, same day) — retained read-only
**Source protocol:** `plans/fable-console-drafting-protocol-v2.md` (FCDP v2, gate-enforced console drafting)
**Target host:** `archon-cli` (Rust console agent), branch `feat/marker-server-parallel-ingest`
**Push discipline:** archon-cli commits/pushes ONLY from WSL, never the Mac ([[feedback-archon-push-from-wsl-only]]).

**Locked constraints (user, 2026-07-07):**
1. **Sandbox-first — touch no archon code.** All build/validation happens in an isolated sandbox that *depends on* archon crates but does not modify them. Integration into archon only after the sandbox proves the protocol both portable and integratable.
2. **Isolated fork.** The work lives in its own fork so the original stays untouched; merge into the main fork only once the sandbox proof holds.
3. **Recalibrate G-A bands on Rust.** M0's decision is pre-made: bands and fingerprints are re-derived against `archon-lanham` — no attempt to transfer the TS-calibrated bands.

**Decisions locked (user, 2026-07-07 — "go with recommendations"):**
- **A1** · Sandbox = standalone Rust workspace, read-only path deps on the fork's archon crates.
- **B1** · New dedicated fork of upstream `ste-bah/archon-cli`; main fork (merge target) = `ProfessorVR/archon-cli`. *GitHub fork creation is outward-facing — deferred until first persist/commit; not needed for local M0–M6.*
- **C1** · M0 recalibrates the MA-applications register only.
- **D** · D2 vertical slice = first internal checkpoint; **D1 full E2E = the merge gate**.
- **E** · deferred; typed serde pack schema assumed since sandbox is Rust.

---

## 0. Verdict

**Portable — and archon-cli is a better host than the current TS/Python console.** FCDP's two proven, load-bearing assets already exist there as native Rust, and the model requirement is satisfiable today:

- **G-A Lanham gate + P2 fingerprint** → `archon-lanham::full_analysis()` — POS-free, offline, in-console match already validated 2026-07-01.
- **P2 style capture** → `archon style train` / `train_to_output_style()` → output-style `.md`.
- **Fable 5 at every prose step** → `archon-llm/src/anthropic.rs` (full Anthropic client; `claude-fable-5` is a model-ID string).
- **Provenance log (Stage R)** → `archon-provenance` — a CozoDB-backed record/edge store with chain-hashing, W3C-PROV export, and chain verification. This is *stronger* than FCDP's footer-diff-comment scheme.

What remains is **orchestration, not new algorithms**: a pack assembler, staged drafting prompts, the mechanical/judge gate runners, and the R-loop — plus three validations that must land before G-A can be trusted in archon.

This plan is distinct from `plans/archon-lanham-research-pipeline-wiring-plan.md`, which wires Lanham into the **research/ingest** pipeline. Both use `archon-lanham`; this one targets the **drafting** protocol.

---

## 1. Current-state findings (grounded in the checkout)

archon-cli is a full console agent, not merely an ingestion tool:

| Capability | Where | Relevance to FCDP |
|---|---|---|
| Anthropic provider (OAuth, beta headers, model field) | `crates/archon-llm/src/anthropic.rs` | Fable 5 for all prose + judge calls |
| Lanham analyzer (all axes + labels) | `crates/archon-lanham/` (`full_analysis`, `analyze_*`, `detect_tacit`, `Labels`) | G-A engine + P2 measurement |
| Style training → output-style `.md` | `archon style train` → `train_to_output_style()` | P2 fingerprint capture/activation |
| Corpus ingest/search/answer/index | `crates/archon-docs` (`docs …`) | Pack-time PDF verification; optional G-C+ |
| Provenance store | `crates/archon-provenance` (`record`, `chain`, `store`, `export_w3c`, `verify`) | Stage-R provenance log |
| Pipeline / workflow / policy / permissions / sandbox | `archon-pipeline`, `archon-workflow`, `archon-policy`, `archon-permissions`, `src/runtime/sandbox_mode.rs` | Gate runner + RAG-ban enforcement + no-commit invariant |
| Session loop + slash dispatch | `src/session_loop/`, `src/command/` | Stages as `/…` commands or a pipeline |

**Analyzer field set (parity target).** `LanhamMetrics` exposes: `noun_verb_ratio`, `nominalization_density`, `prepositional_phrase_density`, `be_verb_ratio`, `parataxis_hypotaxis_ratio`, `coordinating/subordinating_conjunction_density`, `periodic_running_ratio`, `pre_main_verb_clause_count`, `voice_score`, `dynamic_range`, `latinate_germanic_ratio`, `register_markedness_score`, `opacity_score`, `self_consciousness_score`, `tacit_patterns`, `labels`. **Not present as struct fields:** `avg_sentence_length` and the `short(<15)/long(>30)` shares that FCDP's G-A band table keys on — so parity work must add/confirm these (see §3.1).

**Quote substitution (to port).** `scripts/substitute-quote-ids.py` is a 40-line, dependency-free spec: `«Qnn»` → bank text, `«Qnn+»` → text + cite, `«Qnn@»` → cite only; exit 1 on unknown IDs; report unused entries. Direct 1:1 Rust port.

---

## 2. FCDP → archon mapping

Legend: **REUSE** (exists) · **PORT** (small mechanical translation) · **BUILD** (new orchestration).

| FCDP element | archon target | Action |
|---|---|---|
| **Stage P** pack (HEAD/MIDDLE/TAIL) + `plans/packs/` persistence | new `archon-draft` module (pack schema = structured md + `quotes.json`) | BUILD |
| **G-P** pack validator | pack-schema check + `archon-docs` PDF verify + JSON parse + key-match | BUILD (thin) |
| **Stage D1** movement plan + numeric style targets | `archon-workflow` step → Anthropic call w/ D1 sub-pack | BUILD |
| **Stage D1.5** skeleton (nucleus/satellite + counterargument) | workflow step, D1.5 sub-pack | BUILD |
| **Stage D2** draft w/ `«Qnn»` markers, per-movement sub-packs | workflow step, D2 sub-pack | BUILD |
| **quote substitution** | port `substitute-quote-ids.py` → `archon-draft::substitute_quotes()` | PORT |
| **G-A** Lanham bands + labels | `archon-lanham::full_analysis()` + band comparator vs P2 | REUSE + BUILD (comparator) |
| **G-B** quote fidelity | substitution exit-0 + post-sub char-match vs bank | PORT + BUILD |
| **G-C** citation rigor | locus greps + trace-to-pack; read part = judge micro-call | BUILD (regex) |
| **G-C+** secondary-lit retrieval verify (optional, post-gauntlet) | `archon-docs` / external query, separate context | BUILD (deferrable) |
| **G-D** terminology locks | grep set (§7 lock list) → native regex | PORT |
| **G-E** foundation fidelity | Anthropic judge call, lean context, binary battery | BUILD |
| **G-F** degradation checklist | static checklist | PORT |
| **G-G** consistency | Anthropic judge call, lean context, binary battery | BUILD |
| **Stage R** ≤3 loop + diff log | loop driver + `archon-provenance` records/edges | BUILD + REUSE |
| **LaTeX strip for G-A** | port `strip-latex-for-lanham.py` | PORT |
| **Handoff (no commit until sign-off)** | `archon-policy`/`permissions` gate | REUSE |

---

## 3. Must-resolve-first validations

These gate correctness; do them before building the drafting stages on top.

### 3.1 Band recalibration on Rust (locked — M0)
FCDP's G-A tolerance bands (§5) and stored fingerprints (§8) were calibrated against the **TS** runner (`tmp/analyze-style-lanham.ts`). Per locked constraint #3 we **do not** attempt to transfer them; we re-derive them against `archon-lanham`. The Rust port was an "Option-C hybrid" with en-POS + clause-parser deferrable (cf. the `lanham-clause-parser` calibration cycle), so the clause-level metrics (`periodic_running_ratio`, `pre_main_verb_clause_count`, `parataxis_hypotaxis_ratio`) will read differently — that is expected and absorbed by recalibration. Also, `avg_sentence_length` and the short/long shares that the G-A table keys on are **not** `LanhamMetrics` fields and must be added to the sandbox's analysis path (computed alongside, without editing the archon crate).

**Deliverable — recalibration harness (sandbox):** run `archon-lanham::full_analysis()` over the reference corpus (§C below), record the Rust-native metric values, and write new G-A bands + §8-equivalent fingerprints *from the Rust numbers*. Optionally also run the TS runner for a delta table — as documentation of the shift, not as a source of truth. Output: `sandbox/fingerprints/*.json` (Rust-native) + a recalibration note. Until this lands, G-A in the sandbox is not trustworthy. **Do not skip.**

### 3.2 RAG-ban invariant
FCDP forbids all retrieval in the drafting context; archon wires `docs`/MCP into the session by default. Enforce a drafting mode that disables docs/retrieval tools during P→D2 via `archon-policy` + `sandbox_mode.rs`. Retrieval is permitted only at pack-assembly (PDF verify) and the optional post-gauntlet G-C+ — both outside the drafting context.

### 3.3 Judge/drafter context isolation
G-E and G-G must run as **fresh** Anthropic calls seeing only draft + rubric + named pack fields — never the drafting transcript. The provider is `Arc<dyn LlmProvider>`, so this is a deliberate new call path, not a session continuation. Verify no session/history leakage into judge prompts.

### 3.4 Fable routability (checkpoint, low risk)
Provider tests default to `claude-haiku-4-5`; confirm `claude-fable-5` routes through the OAuth/API-key path intended for the Mac runs.

---

## 4. Milestones

All of M0–M6 happen **in the sandbox** (locked constraint #1). M7 is the first time archon's own tree is touched, in the isolated fork (constraint #2).

- **M0 — Recalibrate on Rust (§3.1). ✅ DONE 2026-07-07.** Sandbox (`/home/dalton/projects/fcdp-archon-sandbox/`, A1) built + runs `measure` against `archon-lanham` read-only (archon untouched — first integratability signal). Added `avg_sentence_length` + short/long shares. Calibrated on the 3-doc MA-applications corpus (MA PDF cleaned to 20,823 w + Virtual 7,404 w + Ontological Violence 8,667 w). **Finding:** analyzer largely agrees with TS §8 on the true 21k corpus (nominaliz/preMainVerb/periodic/voice/opacity/latinate all match); genuine deltas only on nounVerbRatio, beVerbRatio, avg-sentence-length. Bands LOCKED in `sandbox/fingerprints/ga-bands-ma-applications.json` (apparatus-stripped targets; soft `primaryRegister` accepting high|middle). *Exit met.*
- **M1 — Pack + G-P.** Pack schema (HEAD/MIDDLE/TAIL) + `quotes.json` + persistence; G-P validator (fields, PDF-verify via `archon-docs`, JSON parse, key match). *Exit:* a real section's pack assembles + passes G-P.
- **M2 — Mechanical gates.** Port substitution + LaTeX-strip; build G-A comparator (vs M0 bands), G-B char-match, G-C/G-D greps, G-F checklist. Prove the RAG-ban mode (§3.2). *Exit:* all mechanical gates run on a hand-written draft and produce a named-defect list.
- **M3 — Drafting orchestration.** D1 / D1.5 / D2 as staged calls with sub-pack slicing; user-approval gate after D1 (default ON). *Exit:* pack → draft-with-`«Qnn»` end to end.
- **M4 — Judge gates.** G-E + G-G as isolated lean-context calls (§3.3), binary-battery rubrics. *Exit:* judge gates emit claim-by-claim verdicts on a seeded-defect draft.
- **M5 — Stage R + provenance.** ≤3 G↔R loop driver; each cycle's diff written as `archon-provenance` records/edges (chain-hashed; W3C-PROV export = the LLM-disclosure evidentiary base). *Exit:* a failing draft converges or halts-with-surfaced-conflict; provenance chain verifies.
- **M6 — Sandbox E2E (the portability + integratability proof).** Full P→R on one live section (candidate: a Part-II §4+ MA-voice movement, since that register is the M0 recalibration target). Optional secondary-lit G-C+ against `archon-docs`. *Exit / merge gate:* a sandbox-produced draft passes the full gauntlet **and** the user judges it on-voice → this is the go/no-go for integration.
- **M7 — Integrate into the fork (only if M6 passes).** Promote the sandbox modules into the isolated archon fork as a real crate/command; wire the command surface; open the PR against the main fork. *Exit:* the same E2E runs inside archon proper; PR ready for review.

Sequencing: **M0 first and alone** (it defines the bands everything else checks against). M1/M2 parallelizable. M3 depends on M1. M4/M5 depend on M2/M3. **M7 is gated on the M6 proof.**

---

## 5. Decisions needed now

The three locked constraints settle the *transfer-vs-recalibrate* and *touch-code-now* questions. Four decisions remain before M0 can start; a fifth is deferrable.

### Decision A — Sandbox form (how it exercises archon)
- **A1 · Standalone Rust workspace** in a scratch dir, depending on the fork's archon crates via read-only path/git deps. Exercises the *real* Rust primitives (`archon-lanham`, `archon-llm`, `archon-provenance`); original untouched; most directly proves integratability. *(recommended)*
- **A2 · Isolated crate inside the fork** (e.g. `sandbox/archon-draft/`), not wired into existing code. Easiest eventual promotion (M7 is a move, not a port), but lives inside the fork tree rather than beside it.
- **A3 · Non-Rust orchestration prototype** (Python/TS) + a thin Rust harness only for the M0 recalibration. Fastest gate-logic iteration, but defers the actual Rust-integration risk instead of retiring it — weakest "integratable" proof.

### Decision B — Fork strategy (what "its own fork" and "main fork" mean)
- **B1 · New dedicated fork** of upstream `ste-bah/archon-cli`, separate from your `ProfessorVR` ingestion fork. "Main fork" = ProfessorVR; merge there after M6. Maximal isolation. *(recommended if FCDP work should stay clear of the in-flight ingestion PRs)*
- **B2 · New isolated branch on the existing `ProfessorVR` fork,** cut from clean `main` (not the ingestion branch). One fork, one clean branch. Simpler, but shares a repo with the ingestion work.
- *Open:* confirm which repo you consider the "main fork" to merge into.

### Decision C — Recalibration scope (M0 target registers)
- **C1 · MA-applications voice only** — the register of the first real draft target (measured, 21,323 words). Minimal; unblocks the M6 proof fastest. *(recommended for the proof)*
- **C2 · Both MA-applications and Part-I** — Part-I needs a refresh against the current `-v3.tex` anyway (memory-flagged). More complete, more work before the proof.

### Decision D — Merge gate (what M6 must demonstrate before M7)
- **D1 · Full E2E** — one real section, all 7 gates green + provenance chain verifies + you judge it on-voice. Strongest bar. *(recommended as the merge gate)*
- **D2 · Vertical slice** — pack + recalibrated G-A + one judge gate (G-E) + provenance, on a short sample. Faster first checkpoint; weaker proof.
- *Recommendation:* D2 as the first internal checkpoint, D1 as the actual merge gate.

### Decision E — Pack format / command surface (deferrable)
If the sandbox is Rust (A1/A2), a typed serde pack schema is the natural choice (G-P becomes deserialize-and-validate). Command surface (slash commands vs. `archon draft run` pipeline vs. workflow) can be settled at M7. Not blocking M0.

**Carried forward from FCDP (unchanged):** G-C+ default-OFF; deferred authorship scorer behind its off-voice trigger.

---

## 6. Non-goals / risks

- **Non-goal:** re-porting the Lanham analyzer — it exists; M0 validates it, doesn't rebuild it.
- **Non-goal:** research-pipeline Lanham wiring (separate plan).
- **Risk:** parity failure (§3.1) forces a full band + fingerprint recalibration — additive work, not a blocker to the architecture, but it must precede any trust in G-A.
- **Risk:** judge-context leakage (§3.3) silently defeats FCDP's anti-self-rationalization discipline — needs an explicit test asserting the judge prompt contains no session history.
- **Risk:** device discipline — build/validate on WSL; the Mac is a runtime, and pushes come from WSL only.

---

## 7. Immediate next step

Settle Decisions **A–D** (§5), then scaffold the sandbox and land **M0** — the Rust recalibration harness that defines the bands everything downstream checks against. No archon code is touched until the M6 proof clears (constraint #1); nothing merges to the main fork until then either (constraint #2).
