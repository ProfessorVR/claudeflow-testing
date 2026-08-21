# Analysis-Upgrade System — Conclusive Analysis Report

**Date:** 2026-04-30
**Branch:** `writing-pipeline-v2` (live) / `writing-pipeline-v3` (sandbox worktree)
**Working sandbox:** `/home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/production-sandbox/`
**Live index:** `/home/dalton/projects/claudeflow-testing/corpus/index/`
**Status as of report:** Dev-20 of 50 (40%) annotated; Phase 2 (consumer wiring) complete in sandbox; Phase 5 ladder + Phase 6 promotion not started.
**Scope:** Full read-only audit of code, conventions, methodology, and integration footprint, plus 8 fresh Perplexity research queries on hardening.
**Constraint:** Change nothing. Compile only.

---

## Executive summary

The analysis-upgrade subsystem is a serious, disciplined research-engineering effort to add a *concept-aware analytical layer* to a philosophical-text writing pipeline. The architecture (sandbox → release-bundle promotion → live) is sound, the discipline (per-item review, drift-log, holdout md5 anchor, atomic activation script) is unusually rigorous for a single-author project, and the measured A/B impact of the prototype was a real but modest +0.022 quality gain (cap-1 bridges + 4 LLM-validated bridges from Nussbaum 1985 alone).

**Three honest assessments:**

1. **Phase 2 (B1–B7) is genuinely done in sandbox; live is untouched.** The TypeScript additions (`loadActiveClaims`, `Claim`/`ConceptMention`/`BridgeCandidate` types, ACTIVE CLAIMS prompt block) are implemented well, with graceful-fallback contracts. Live `corpus-index-provider.ts` ends at line 203 — none of the new surface is in production. Promotion will be a multi-file simultaneous merge.
2. **The gold-set construction (Phase 4) is the project's center of mass right now and is showing strain.** Convention-edit counter is 11/15. Item-25 codification debt has grown from a 9-task plan to **26+ documented sub-tasks**. The annotator is logging "cycle-cost note" warnings in the drift-log on every item from dev-14 onward. The trajectory is recoverable iff item-25 successfully discharges debt and consolidates parallel taxonomies.
3. **Several real defects exist in code paths that have not yet been exercised at scale.** A jq `last`-on-string bug in `create-release.sh:44-46` would emit malformed versioned filenames; the `sample-gold-candidates.py` dev/holdout overlap (SITREP §9.7) is a documented blocker for re-sampling; `validate-gold-notes.sh` is a typographic firewall, not a semantic one (it would not have caught the dev-3/4/5 wrong-ontology-source error that triggered the 2026-04-28 remediation).

**The single most important external risk:** the live `compiled-index.json` was last built 2026-04-07 (`builtAt` field), three weeks ago. Its `mtime` of 2026-04-27 reflects symlink/permission churn but not content regeneration. Phase 6 promotion cannot rely on a swap-only operation; it must include a fresh recompile.

---

## 1. System overview

### 1.1 Mission

Add a *concept-aware analytical layer* to a philosophical-writing pipeline. The layer turns 30+ secondary-literature PDFs from raw text into:

- **Claims** with speaker / stance / use-mention / faithfulness metadata.
- **Concept mentions** linking text spans to ~1,500 ontology nodes (Aristotelian, Heideggerian, modern philosophy).
- **Bridge candidates** linking concepts across authors (e.g., Aristotle's *phantasia* ↔ Heidegger's *Erschlossenheit*) with LLM-judged stance: alignment / extension / contestation.

These artifacts plug into the `god-write` writing pipeline through:
- A new **`## ACTIVE CLAIMS (FROM SECONDARY LIT)`** block in writing prompts.
- Raised caps on bridges (1→3) and tensions (3→5).
- An `ontology-embeddings.jsonl` table for semantic resolution.
- A query-time hybrid score `0.7·cos + 0.3·conceptOverlap` (Phase 5 E6).

### 1.2 Phase plan (per `MASTER-PLAN.md`)

| Phase | Status | Key gates |
|---|---|---|
| 0 — Backup | DONE 2026-04-19 | ≥1.1 GB backed up; manifest written |
| 1 — Sandbox setup | DONE | Worktree `writing-pipeline-v3` at `1268adbc…`; release-bundle infra built |
| 2 — Consumer wiring (B1–B7) | DONE 2026-04-19 (sandbox) | O1 smoke gate PASS; tsc clean |
| 3a — Canary (3–5 PDFs) | DONE 2026-04-21 | 4 papers, 786 claims, $4.53; all gates PASS |
| 3b — Full batch (~30 PDFs) | (not in evidence) | gated |
| 4 — Resolver gold-set (70 items) | IN PROGRESS — 40/70 (57%): all 20 holdout + dev-20 of 50 | gold validator OK; holdout md5 stable |
| 5 — E0–E8 ladder | NOT STARTED | gated on Phase 4 |
| 6 — Atomic promotion | NOT STARTED | gated on Phase 5; preflight checklist defined |
| 7 — Rollback protocol | infrastructure exists; never exercised | activate-release.sh ready |

### 1.3 Why the work is real

The Nussbaum-1985 sandbox A/B (`04-final-summary.md:96-114`) produced a measurable +0.022 quality gain, and a direct prose insertion linking Nussbaum's reading to Aristotle's *phantasia*-orexis circuit that came demonstrably from the auto-generated bridge (the chunker did not retrieve Nussbaum). That is concrete evidence the analytical layer carries signal. The 4 substantive bridges produced (1 alignment / 2 extension / 1 contestation) included a genuinely interesting *contestation* (φάντασμα ≠ Merkbild on Nussbaum's reading) — exactly the cross-author conceptual revision the system was designed to surface.

---

## 2. Progress at session-close (2026-04-30)

| Dimension | State |
|---|---|
| Dev annotation | 20/50 (40%) committed; 30 remaining |
| Holdout | 20/20 complete; md5 `2c6f1f7e76c7fc7192a5d4dfba515a59` stable across all sessions |
| Mean labels/item | 4.40 (range 3–7; mode 4–5) |
| Drift-log entries | 154 active + 67 added in dev-9-through-dev-20 session |
| §8.1 CONVENTIONS-edit counter | 11 (threshold 15) |
| Pattern-watches active | 8+ formal + ≥6 newly registered |
| §5.4 step-4 fires (cumulative) | 4 (dev-4, dev-14, dev-16, dev-18) |
| Item-25 codification debt | **26+ documented sub-tasks** (vs. 9 in original plan) |
| Backups (per-item snapshots) | 12 (one per dev-9 through dev-20 commit) |
| Live `compiled-index.json` | 306 KB, builtAt 2026-04-07 (3 weeks stale) |
| Live `ontology-embeddings.jsonl` | **does not exist** in production |
| Sandbox release-2 manifest | 1,582 ontology / 313 hooks / 45 tensions / 781 claims / 1,979 mentions |

### 2.1 Substantive contributions this session (dev-9 through dev-20)

1. §5.4 sub-pattern family (a/b-single/b-multiple/c) + per-element framework + ANY-FIRE → FIRE rule + paragraph-scope methodology + WARRANT-≠-SOURCE-TEXT principle + predicate-shift directionality.
2. SURFACE-DRIVEN ontology-synonymy rule (English / Greek-transliterated / Greek-glyph surface-drives label choice).
3. GENUINE-GAP test 4-criteria specification.
4. AF5 disposition taxonomy (4 types with type-(4) sub-variants 4a/4b/4c/4d).
5. Paraphrase-modifications taxonomy (substitution/addition/omission/modal-shift).
6. §8.0 trigger scan checkpoint at dev-20 — no integrity violations.

These are real intellectual outputs of the annotation work; they justify the project's existence as a research artifact independent of E0–E8.

---

## 3. Code quality findings (consolidated from four parallel deep-audits)

### 3.1 Production-sandbox `scripts/` — 5 CRITICAL, 16 HIGH, ~25 MED, ~15 LOW

**CRITICAL findings (all unique to sandbox; live unaffected):**

1. **`activate-release.sh` split-brain risk.** Atomic per-symlink, not atomic across the bundle. A SIGKILL between symlink swap (`:67-71`) and manifest update (`:74-80`) leaves on-disk symlinks ahead of `ARTIFACT-MANIFEST.json:active_release`. No flock; no previous-release backup; no recovery journal.
2. **`run-phase3b-batch.sh` parallel-job race + always exit-0.** The pid-array reindex pattern (`:120-136`) has a race window; `wait` on already-reaped PIDs returns 127. Aggregate `FAILED` count is never tallied across waves; the script exits 0 regardless of how many papers failed (`:163`).
3. **`run-step4-r13.sh` is byte-identical to `run-step4-post3b.sh`** (header comment still says "post3b" — copy-paste). Only `OUT_DIR` differs.
4. **`sample-gold-candidates.py` dev/holdout pool overlap.** SITREP §9.7 already acknowledges this. `:139-147` calls `sample_per_genre` twice with the same RNG state and same input pool; no holdout-exclusion when sampling dev. `compute-dev-ordering.py:34-45` patches over it post-hoc.
5. **`run-step4-smoke.sh` and `run-step4-prose.sh` lack the EXIT trap** their post3b/r13 siblings have on `:33`. A SIGINT during a 10-minute prose run leaves the API key in `${WORKTREE_ROOT}/.env`.

**HIGH-severity (selected):**

- **`create-release.sh:44-46` jq `last`-on-string bug.** `(.[:-1] | join(".")) + ".v\($v)." + (. | last)` — the trailing `last` references the joined-prefix *string*, not the original split array. For input `"foo.bar.json"` the output is `foo.bar.v1.r` (last char of `"foo.bar"`) not `foo.bar.v1.json`. Defect; almost certainly never exercised end-to-end.
- **Hardcoded absolute path `LIVE_ROOT=/home/dalton/projects/claudeflow-testing`** in five batch wrappers.
- **`validate-gold-notes.sh:23` uses `set -u` only** — no `-e`, no `-o pipefail`. Failures in jq/Python subshells do not propagate. The "OK (0 violations)" guarantee is weaker than it appears.
- **Per-line shell exec in validator** — `jq | grep | sed` per gold-set line × 4 checks; subshell explosion will become a measurable bottleneck as the gold set grows.
- **`smoke-test.sh` baseline staleness.** Compares `git status --porcelain` to a stored baseline file with no mtime check; weeks-old baselines silently mask drift.
- **No central library.** Path resolution, SKIP_SLUGS, jq output formatting, and `.env` lifetime conventions are duplicated across ≥10 scripts; a single sourced `scripts/lib/common.sh` would absorb most consistency bugs.

### 3.2 Gold-set methodology — Internally publication-grade; externally needs second-rater discipline

- **Strengths.** "Triggered by:" provenance on every CONVENTIONS rule (`CONVENTIONS.md:11-16`); ≥3-instance promotion gate with mandatory back-sweep (§7.1); six-check labeling protocol formalizes what is usually implicit; `inspections/` directory captures multi-paragraph analyses persistently.
- **The single-annotator floor.** With one rater, no Cohen's κ or Krippendorff's α can be computed. The 15-of-50 self-re-review (`README.md:107-110`) measures intra-annotator stability, not inter-rater agreement. F1 measurements against this gold set carry an unquantified bias floor.
- **Validator coverage gap.** `validate-gold-notes.sh` checks em-dashes, pipe-padding, and CONVENTIONS sentinel-bracket pairs. It does **not** validate: schema validity of gold jsonl entries, ontology-node existence in `expected_ontology_nodes` (the exact gap that produced the dev-3/4/5 wrong-ontology remediation), PL-pattern-name validity, holdout md5 invariance (manual only), drift-log Type A/B template conformance, or `_candidate_metadata` faithfulness.
- **Item-25 codification debt is realer than the SITREP claims.** Counted from drift-log lines 290-436: **at least 26 distinct codification sub-tasks** explicitly tagged "item-25." The locked-plan budget (2 codifications + 5 deferrals) is obsolete. Either item-25 expands into a multi-session checkpoint, or sub-tasks must be re-deferred to item-50 with explicit triggers, or the codification scope must collapse via umbrella consolidation (`CONVENTIONS.md:311`).
- **Cycle-cost trajectory.** From `drift-log.md:378-432`, the annotator is logging "cycle-cost note" warnings on every item from dev-14 onward. This is a leading indicator of decision fatigue. The §8.1 interim-checkpoint trigger (`CONVENTIONS.md:382`) was designed for exactly this and has been met-and-deferred twice.
- **Recoverability.** Local recovery is good (12 commit snapshots + pre-remediation snapshot + Claude transcript fallback). Off-host recovery is undocumented; `tmp/analysis-upgrade/` and its `.backups/` live on one workstation. The most critical artifact (the holdout md5 anchor) survives only because it is manually documented in `dev-ordering.md:212`.

### 3.3 src-worktree TypeScript + Python — Phase 2 implementation is well-formed

- **All B1–B7 changes verified present and well-formed in sandbox.** `loadActiveClaims` at `corpus-index-provider.ts:327-494` implements the spec plus two beyond-spec enhancements (R1.3 BM25 length-normalization; R1 author-diversity scan returning `activeAuthors` for retrieval re-targeting). H1 caps raised: bridges 1→3, tensions 3→5.
- **Optional-field discipline preserved.** All new `CompiledIndex` fields (`claims?`, `conceptMentions?`, `bridgeCandidates?`) and all new `CrossPipelineHook` fields (`speaker`, `stance`, `use_mention`, `faithfulness`, `claim_type`, `auto_generated`, `needs_review`) are correctly marked `?`. Live consumers' optional-chaining will tolerate missing fields without crashing.
- **Extractor prompts are not SHA-pinned.** `ARTIFACT-MANIFEST.json` fingerprints `canonical-suite.json` (the writing-prompt suite) but does not fingerprint `scripts/analyze-claims/prompts/candidate_*.md`. Re-running the canary requires git-hash provenance from the worktree; manifest-level reproducibility is incomplete.
- **No automated tests for `loadActiveClaims`, BM25 scoring, or the diversity-cap overflow re-fill** (`corpus-index-provider.ts:437-457`). These are pure functions; property-tests would be cheap and would catch silent ranking regressions during refactors.
- **Two orphaned trees.** `claim-extractor-upgrade/sandbox/scripts/prompts/candidate_primary.md` is the **pre-B7** prompt (no precedence rules, includes `exegetical_claim` in primary). `integration-sandbox/scripts/recompile_index.py` is the **pre-B1** version with hardcoded paths. Both are now superseded; should be marked deprecated to prevent accidental reuse.
- **Two minor TS hygiene issues.** Unused `fs`/`path` imports at `corpus-index-provider.ts:10-11`; a "compatibility but ignored" `indexPath` parameter at `:196-200` that has been silently neutered (the shared loader actually does honor `CORPUS_INDEX_PATH`).
- **`evaluate.py:29` fragile path resolution** — `parents[4]` instead of an `.env`-walk-up like `extractor.py:34-42`. Move/rename of the script silently breaks `.env` loading.

### 3.4 Live integration footprint — Sandbox is materially ahead; live is unchanged

| Surface | Live state (HEAD `54c2ba1f`) | Sandbox state |
|---|---|---|
| `compile-corpus-index.py` | Identical to sandbox; no B1 port (chain approach) | `recompile_index.py` is the new entry point |
| `corpus-index-provider.ts` | 203 lines; legacy 4-array `CompiledIndex`; no `loadActiveClaims` | 537 lines; full B2/B3 surface |
| `cross-author-utils.ts` | bridge cap 1, tension cap 3 | bridge cap 3, tension cap 5 |
| `gold-standard-prompt-builder.ts` | no `activeClaims?` | `activeClaims?: string[]` field + render block |
| `write-pipeline-orchestrator.ts` | first 130 lines identical to sandbox; no `loadActiveClaims` call | 6 injection points + rolling-context writer |
| `corpus/index/ontology-embeddings.jsonl` | **MISSING** | 9.1 MB, 277 × 1536-D, manifested as v1, active under release 2 |
| `corpus/index/ARTIFACT-MANIFEST.json` | does not exist | exists; tracks `active_release: 2`, frozen prompt-suite SHA, per-artifact `current_version` |
| `corpus/index/releases/` | does not exist | `release-1.json` + `release-2.json` |
| `corpus/index/compiled-index.json` | regular file, builtAt 2026-04-07 | symlink → `compiled-index.v2.json` (release-bundle layout) |

**Promotion design challenge.** Phase 6's atomic activation works only if the bundle layout (symlinks + ARTIFACT-MANIFEST + `releases/`) is replicated in live. Two options:
- (a) Replace live `compiled-index.json` with a symlink — breaks any external tooling that does `git diff` on it as a regular file.
- (b) Flatten sandbox to no-symlink form before merge — loses the rollback property the bundle was designed to deliver.

This decision is **not in any current plan document** and must be made before Phase 6.

**Other live-integration risks:**
- `_hooksDerivationDone` is a process-global flag in `cross-author-utils.ts:56`; release activation that retargets the symlink does **not** invalidate it. If the loader cache is keyed on file mtime and symlink retargeting preserves the inode mtime, the cache will not invalidate at all. This must be verified before Phase 6.
- The B2 / B3 / B4 / B5 changes only deliver value as a coordinated unit; partial promotion is non-destructive but useless.

---

## 4. Perplexity research findings — applied to system gaps

8 fresh queries dispatched to `sonar-pro`; full responses in `tmp/SYSTEM-ANALYSIS-2026-04-30/perplexity/q*.json`. Mapped to system gaps:

### Q1 — Atomic multi-file release activation

Confirms the sandbox approach (POSIX `rename(2)` + `flock` + manifest pointer) is correct. **Calls out the exact issue auditing found in `activate-release.sh`:**
- "Always fsync **manifest before symlink** — crash mid-swap leaves symlink dangling but manifest points to old/valid release. Reverse order risks pointing to unfsynced artifacts."
- The sandbox script does the inverse: it swaps symlinks first (`:67-71`), then writes the manifest (`:75-80`). The fsync ordering pitfall the literature warns about is exactly the failure mode this script is exposed to.
- Recommends `flock(2)` over plain lockfile (sandbox has neither) and a journal-based recovery scan (`/release-journal.log` with txid/N/timestamp for replay) — also absent.

### Q2 — Single-annotator gold-set construction

Confirms there is **no published 2024–2026 protocol explicitly targeting solo-rater bias for philosophical text**. The literature available:
- LLM-as-Judge for bias mitigation is the leading approach (cited as improving accuracy by 44.2%, reducing hallucinations by 22.5% in ontology-aligned triple extraction).
- Atomic decomposition + linguistic principles (causal decomposition, coreference) using a single powerful LLM is the recommended decomposition pattern — which is approximately what the candidate-enumeration protocol does.
- **Specific gap acknowledged in the literature:** "Minimum agreement thresholds (e.g., LLM-human Kappa > 0.6) and adjudication specifics… not detailed; no evidence of Claude/GPT/Gemini benchmarks for second-annotator role."
- **Implication for this project:** the LLM-disagreement check anticipated in `README.md:110` is genuinely the SOTA approach. Running it with **two distinct LLMs (Claude Sonnet + a non-Anthropic model)** before E0 lock would close most of the externally-quantifiable bias gap.

### Q3 — Holdout integrity automation

Confirms the practitioner-driven layered-automation pattern (pre-commit hash hooks + chattr +i + DVC/Git LFS + CI gates) is right. **Specific gap in current implementation:**
- No automated tamper-detection for the holdout md5; the anchor is documented but not enforced.
- A 5-line `pre-commit` hook calling `md5sum --check holdout.md5sum` would close this.
- Source [1] notes: "Manual processes lead to data leakage or contamination — devs accidentally edit holdout during exploration, inflating reported performance."

### Q4 — Convention drift management

Direct guidance applicable to item-25:
- "Freeze conventions when IAA drops below thresholds (Cohen's κ < 0.80) or label distributions shift > 3-5%." **The project has no IAA metric**, so the freeze trigger is unbounded. Substitute: `§8.1 CONVENTIONS-edit counter` is a soft proxy, currently 11/15.
- "Partial back-sweep for batches with detected drift on 5–10% samples; full back-sweep only post-governance audit if drift predicts > 8–15% model accuracy loss." The dev-3/4/5 remediation was a **fully-affected sub-batch retroactive correction** — appropriate severity matched to scope.
- "Use version-controlled documentation with timestamps for every guideline update… link each dataset/gold-set release to the exact guideline version." **Currently the gold-set jsonl entries do not record which CONVENTIONS version they were annotated against.** Adding a `_conventions_sha` field per item would make per-item conventions-version traceable and would let item-25 codifications retroactively flag earlier items annotated under superseded rules.

### Q5 — Evaluation power

The literature in the search corpus did not directly answer the query, but the standard-stats inference is informative:
- **For ΔF1 = 0.02 (σ_F1 ≈ 0.05), required N ≈ 400–1,000 queries** for a paired two-sided test at α = 0.05, power = 0.8.
- **The current plan uses N = 50 dev + 20 holdout** — this is deeply underpowered for the ΔF1 ≥ 0.02 keep/rollback decision rule in `MASTER-PLAN.md` Phase 5 (per-step keep/rollback). The bias-variance tradeoff at N < 200 inflates variance and biases toward null; bootstrap CIs (rather than parametric) are required.
- **Implication:** the 2-of-3 signal rule for major E-steps was the right intuition (it reduces dependence on a single underpowered metric), but the dev/holdout sizes themselves are too small for ΔF1 ≥ 0.02 detection at conventional power. Either: (i) widen the gold set (cost-prohibitive), (ii) accept a weaker effect-size threshold (ΔF1 ≥ 0.05 requires N ~150–250), or (iii) explicitly report bootstrap 95% CIs alongside point estimates and treat overlap as "no decision."
- **TREC/BEIR/MTEB norms** support bootstrap (1,000 resamples) for non-normal F1; this is a cheap addition at gold-set freeze time.

### Q6 — Schema validation at promotion

Direct prescription that maps onto the live-vs-sandbox schema-drift risk:
- **Use JSON Schema as single source of truth.** Generate from TypeBox (TS) and Pydantic (Python); diff in CI with `json-schema-diff`.
- "Block promotion if JSON index fails schema parse: TS `TypeBox.validate(data)`, Python `PydanticModel.model_validate_json(artifact)`."
- **Specific gap:** sandbox has no Zod/TypeBox schema for `CompiledIndex`. Optional-chaining in consumers is robust to missing fields but **silent on field renames** (e.g., `nodeA` → `node_a` would silently produce empty bridges with no error). Adding a Zod schema check inside `loadCompiledIndex` (`shared/jsonl-loaders.ts`) would add a hard validation gate in the load path.

### Q7 — Hybrid retrieval scoring

Several specific findings directly relevant to Phase 5 E6:
- **Reciprocal Rank Fusion (RRF) outperforms weighted linear fusion** in 2024–2026 benchmarks. 38% MAP@10 over BM25 in code-mixed/heterogeneous text; "robust without tuning."
- The plan's `0.7·cos + 0.3·conceptOverlap` formula is brittle to query drift and out-of-domain data — requires score normalization (min-max or z-score) which the current plan does not specify.
- **Query-adaptive α (DAT, arXiv 2503.23013)** beats fixed α on queries with ranking divergence.
- "Adding concept-tag overlap to dense retrieval helps in term-sparse or code-mixed corpora but washes out or hurts in semantically rich corpora without normalization." Philosophical text is **semantically rich** — concept-overlap may help less than the plan assumes.
- **Implication:** consider **substituting RRF for weighted linear fusion as the E6 default**. The plan's keep/rollback gates (2-of-3 signal + p95 latency ≤ +300 ms) still apply. Latency: ~50–100 ms p95 overhead, within budget.

### Q8 — Bash hardening

Confirms the audit findings exactly:
- "`set -euo pipefail` is mandatory for production research pipelines… without `pipefail`, a failing upstream API call followed by successful `grep` would report success, silently corrupting downstream analysis." This is precisely the `validate-gold-notes.sh:23` gap.
- "Use `trap` commands on `EXIT`, `INT`, and `TERM` to guarantee cleanup of `.env` files." Sandbox has these in some scripts and not others — exactly the inconsistency the audit flagged.
- "Atomic file writes using `mktemp` + `mv` instead of direct redirection (`>tmp;mv`) ensures partial writes don't corrupt results." `create-release.sh:60` writes the release file directly; sandbox affirmation needed.
- "Avoid polling with sleep loops in long-running batch scripts… `wait -n` is superior." `run-phase3b-batch.sh:131` uses `sleep 5`; bash 4.3+ `wait -n` is the recommended replacement.

---

## 5. Cleanup, improvement, and hardening recommendations

Organized by ROI: highest-value-for-lowest-effort first. **All recommendations preserve the user's "change nothing now" directive — these are findings, not actions.**

### 5.1 Quick wins (1–2 hours each, no risk)

| # | Finding | Action |
|---|---|---|
| Q1 | `create-release.sh:44-46` `last`-on-string bug | Fix to `(.[:-1] | join(".")) + ".v\($v)." + (.[-1])` (use array index, not string `last`) |
| Q2 | `run-step4-r13.sh` is a copy of `run-step4-post3b.sh` | Delete one; parameterize the other with `--out-dir` |
| Q3 | Two orphaned prompts/scripts (pre-B7 prompt; pre-B1 recompile) | Add `.deprecated` suffix or move to `.archive/` |
| Q4 | Unused `fs`/`path` imports in `corpus-index-provider.ts:10-11` | Remove |
| Q5 | "Compatibility but ignored" `indexPath` parameter on `loadCompiledIndex` | Either wire it or remove with deprecation comment |
| Q6 | Validator (`validate-gold-notes.sh:23`) lacks `set -e`/`-o pipefail` | Add (1-line change); also add the same to `run-step4-*.sh` |
| Q7 | No automated holdout tamper check | 5-line pre-commit hook calling `md5sum --check` |
| Q8 | Hardcoded `LIVE_ROOT=/home/dalton/...` in 5 scripts | Replace with `$(cd "${SCRIPT_DIR}/../../.." && pwd)` |

### 5.2 Medium-effort improvements (a few hours each)

| # | Finding | Action |
|---|---|---|
| M1 | `sample-gold-candidates.py` dev/holdout overlap (SITREP §9.7 blocker) | Patch to draw from disjoint pools in one pass with explicit set-subtract; this is documented prerequisite for any re-sampling |
| M2 | No semantic validator for gold jsonl | Add a Python validator that asserts: every `expected_ontology_nodes[*]` exists in `compiled-index.json`; every `PL:<name>` matches a row in CONVENTIONS §3.2; every flag-block matches `flag-grammar` regex |
| M3 | Drift-log Type A/B template not mechanically enforced | Validator step that asserts every drift-log entry begins with `YYYY-MM-DD | <type> — <pattern-name>` |
| M4 | No JSON Schema for `CompiledIndex` cross-language | Define a Zod schema in TS + Pydantic model in Python; export to JSON Schema; diff in CI; validate on load |
| M5 | Extractor prompts not SHA-pinned in `ARTIFACT-MANIFEST.json` | Add `extractor_prompts: { dir, sha256 (recursive content hash) }` |
| M6 | No central `scripts/lib/common.sh` | Extract `LIVE_ROOT`, `SKIP_SLUGS`, `.env` lifetime conventions, jq output format into one sourced library |
| M7 | `activate-release.sh` lacks `flock`, lacks previous-manifest backup, lacks fsync ordering | Add `flock -x ${DATA_DIR}/.activate.lock`; write `previous-release.json` snapshot before symlink swap; fsync manifest *before* symlink; post-condition assert |
| M8 | `_hooksDerivationDone` is process-global; release-swap doesn't invalidate | Make the flag cache-keyed on `(indexPath, manifestSha)` not module-global |
| M9 | No bootstrap CI on F1 measurements | Add a 1,000-resample bootstrap to the eventual `run-ab.sh`; treat overlapping CIs as "no decision" rather than tied means |
| M10 | LLM-disagreement check not yet executed (`README.md:110`) | Run it with **two distinct LLMs** (Claude Sonnet + Gemini 2.5 / GPT-5) on a 10-item sub-sample before E0 lock |
| M11 | Per-item annotation does not record `_conventions_sha` | Add field to gold jsonl schema; pin per-item to the CONVENTIONS commit at annotation time |

### 5.3 Strategic recommendations

| # | Issue | Recommendation |
|---|---|---|
| S1 | Item-25 codification debt is 26+ tasks, not 9 | **Triage at item-25 entry**, not during. Classify into (a) fire-now, (b) defer-to-item-50-with-trigger, (c) consolidate-into-existing. Aggressively use umbrella consolidation per `CONVENTIONS.md:311` |
| S2 | Cycle-cost compounding from dev-14 onward | **Move item-25 forward to dev-21** if cycle cost continues compounding. The §8.1 interim-checkpoint trigger has been met-and-deferred twice; that signal is now load-bearing |
| S3 | Single-annotator floor unquantified | Document the single-annotator bias floor explicitly in the gold-set's downstream consumer documentation so resolver F1 measurements are not over-interpreted as ground truth |
| S4 | N = 50 dev + 20 holdout under-powered for ΔF1 ≥ 0.02 | Either (i) widen to 150–250 over Phase 5 (cost-prohibitive), (ii) raise effect-size threshold to ΔF1 ≥ 0.05, or (iii) explicitly report bootstrap 95% CIs and treat overlap as no-decision. **(iii) is the cheapest principled option** |
| S5 | E6 plan uses fixed `0.7·cos + 0.3·conceptOverlap` | Consider RRF as default; the literature shows fixed weighted fusion is brittle on semantically-rich corpora and RRF is "robust without tuning." Adds ~50–100 ms p95 — within budget |
| S6 | Phase 6 promotion: bundle-vs-flat layout decision not in any plan | **Decide before Phase 6.** Recommendation: bundle layout in live, with a `corpus/index/README.md` documenting that `compiled-index.json` is a symlink and external tooling must `readlink` it |
| S7 | Live `compiled-index.json` is 3 weeks stale (`builtAt 2026-04-07`) | Phase 6 must include a fresh recompile, not just symlink swap; preflight should refuse if `builtAt < (now - N days)` |
| S8 | Off-host backup undocumented | Add scheduled (every 5 items) periodic snapshots; verify gold-set commits are pushed to remote at every checkpoint |
| S9 | No tests for `loadActiveClaims` ranking | Add property tests for BM25 length normalization + diversity-cap overflow re-fill (`corpus-index-provider.ts:437-457`); both are pure functions, easy to test |
| S10 | Validator: typographic only, not semantic | Extend to: schema validity, ontology-node existence, PL-pattern-name validity, holdout md5 invariance, drift-log template conformance |

### 5.4 Hardening additions worth scheduling

- **Smoke-test baseline staleness check.** `smoke-test.sh` should fail or warn if `BASELINE` mtime > 7 days.
- **`ARTIFACT-MANIFEST.json` schema_version field.** Currently no version; future readers cannot detect format changes.
- **Append-only release journal.** `releases/release-journal.log` with `txid|N|timestamp|active_release_before|active_release_after` for replay-based recovery.
- **`run-ab.sh` and `run-experiment.sh` are stubs that exit 1.** Implement before E0 — they are Phase 5 prerequisites.
- **Cost model in `extractor.py:169-170` is hardcoded** for sonnet-4.5 ($3/M / $15/M). If `--model` is changed, cost reporting silently lies. Move to a config file or compute from the model name.

---

## 6. What is going right

Worth recording explicitly because most of this report is failure-mode analysis:

1. **The annotation discipline is real intellectual work.** The §5.4 sub-pattern family, AF5 disposition taxonomy, and SURFACE-DRIVEN rule are not bureaucratic accretion — they represent genuine taxonomic discoveries about the philosophical-text labeling problem. The drift-log captures their derivation completely.
2. **Phase 2 sandbox implementation is well-scoped and clean.** `loadActiveClaims` with BM25 + author-diversity scan is competently engineered; the optional-chaining contract gives Phase 6 a non-destructive promotion path even if some B-steps land before others.
3. **Backup and remediation discipline.** When the dev-3/4/5 ontology-source error was discovered, the response was: pre-remediation snapshot → systematic re-annotation → post-remediation snapshot → drift-log entry → CONVENTIONS clarification. Most projects would have silently re-annotated and lost the audit trail.
4. **The release-bundle architecture is conceptually right.** `activate-release.sh` correctly preflight-validates every target file, uses staging directories, and re-verifies post-swap. The implementation has gaps (no flock, fsync ordering, no journal) but the design is sound.
5. **The Nussbaum-1985 A/B was a genuine concrete proof.** The auto-generated φάντασμα/Merkbild contestation that surfaced in upgraded prose was traceable to the bridge generator, not the chunker — exactly the kind of cross-author conceptual revision the system was designed to surface.

---

## 7. What to NOT do (anti-recommendations)

- **Do not** keep deferring item-25. The §8.1 interim-checkpoint trigger has fired twice already; defer-twice is the maximum that is still healthy. A third deferral converts the codification framework from "discipline" to "theatre."
- **Do not** widen the gold set to 200+ items as a first response to underpowered F1. The labor cost (~12+ hours per 50 items at current cycle-cost) does not pay back; the cheaper fix is bootstrap CIs + raised effect-size threshold.
- **Do not** promote Phase 2 to live without Phase 5. Partial promotion is non-destructive (consumers tolerate undefined fields) but useless; the value materializes only as a coordinated bundle.
- **Do not** rely on the Claude transcript fallback for inspection-class artifacts. The persistence-as-generated pattern-watch (`drift-log.md:298`) correctly identifies this as a process gap; transcripts are an implementation artifact, not a guaranteed durable store.
- **Do not** add new pattern-watches between dev-21 and item-25 unless they are CRITICAL. The cycle-cost compounding is real; new pattern-watches should be queued for item-25 evaluation, not promoted live.

---

## 8. Closing assessment

The analysis-upgrade subsystem is in **mid-traversal of an honest research-engineering arc**. The hard work — system architecture, sandbox isolation, atomic-promotion infrastructure, gold-set discipline, the LLM-bridge generator that produced the Nussbaum *phantasma*/Merkbild contestation — is largely done and largely sound. The remaining work splits into:

1. **30 dev annotations + an enormous item-25 codification cycle** (the dominant near-term cost; cycle-fatigue risk is real and should be the operating constraint).
2. **Phase 5 E0–E8 ladder** (gated on Phase 4; budget under-powered for the F1 thresholds; benefits from RRF substitution and bootstrap CI before E0).
3. **Phase 6 atomic promotion** (decisions on bundle-vs-flat live layout still unmade; live recompile required; the activate-release.sh gaps are CRITICAL but unexercised).

The **single highest-leverage hardening intervention right now** would be a **40-line patch to `validate-gold-notes.sh` extending it to ontology-node-existence and PL-pattern-name validity.** This would have caught the dev-3/4/5 wrong-ontology-source error before it cost a remediation cycle, and it is the single missing safety net on the project's load-bearing artifact.

The **second-highest** would be the LLM-disagreement check on a 10-item gold-set sub-sample using two distinct LLMs (Claude + a non-Anthropic model). This is the closest available substitute for the Cohen's κ that a single annotator structurally cannot produce, and the literature confirms it is the SOTA approach to the bias-floor problem.

Everything else is incremental. The project is on track; it just needs a forcing function for item-25 and a more honest accounting of the gold-set's statistical floor before E0 begins.

---

## Appendix A — Files and artifacts examined

### Strategic
- `tmp/analysis-upgrade/MASTER-PLAN.md` (506 lines)
- `tmp/analysis-upgrade/SYSTEM-REVIEW-GAPS.md` (224 lines)
- `tmp/analysis-upgrade/04-final-summary.md`
- `tmp/analysis-upgrade/production-sandbox/PHASE-2-STATUS.md`
- `tmp/analysis-upgrade/production-sandbox/PHASE-3A-CANARY-REPORT.md`
- `tmp/SITREP-2026-04-30-end-of-session-dev-1-through-20-complete.md`

### Code
- `production-sandbox/scripts/*` (19 scripts)
- `production-sandbox/src-worktree/src/god-agent/{universal,shared,retrieval}/*.ts`
- `production-sandbox/src-worktree/scripts/analyze-claims/*` (Python + prompts)
- `claim-extractor-upgrade/sandbox/scripts/*` (legacy)
- `integration-sandbox/scripts/*` (legacy)
- `corpus/index/compiled-index.json` (live)
- `src/god-agent/{universal,shared,retrieval}/*.ts` (live consumers)
- `scripts/compile-corpus-index.py` (live)

### Gold-set + methodology
- `production-sandbox/data/gold/CONVENTIONS.md` (442 lines)
- `production-sandbox/data/gold/drift-log.md` (436 lines)
- `production-sandbox/data/gold/dev-ordering.md` (227 lines)
- `production-sandbox/data/gold/protocols/*.md`
- `production-sandbox/data/gold/drafts/*.md`
- `production-sandbox/data/gold/inspections/*.md`
- `production-sandbox/data/gold/resolver-gold-{dev,holdout}.jsonl`
- `production-sandbox/data/gold/candidates/*.jsonl`

### Perplexity research (8 fresh queries, dispatched 2026-04-30)
- `tmp/SYSTEM-ANALYSIS-2026-04-30/perplexity/q1_atomic_release.json`
- `tmp/SYSTEM-ANALYSIS-2026-04-30/perplexity/q2_solo_annotator.json`
- `tmp/SYSTEM-ANALYSIS-2026-04-30/perplexity/q3_holdout_integrity.json`
- `tmp/SYSTEM-ANALYSIS-2026-04-30/perplexity/q4_convention_drift.json`
- `tmp/SYSTEM-ANALYSIS-2026-04-30/perplexity/q5_evaluation_power.json`
- `tmp/SYSTEM-ANALYSIS-2026-04-30/perplexity/q6_schema_validation.json`
- `tmp/SYSTEM-ANALYSIS-2026-04-30/perplexity/q7_hybrid_retrieval_tuning.json`
- `tmp/SYSTEM-ANALYSIS-2026-04-30/perplexity/q8_bash_hardening.json`

Plus 16 pre-existing Perplexity files at `tmp/analysis-upgrade/perplexity/q1-4` and `tmp/analysis-upgrade/claim-extractor-upgrade/perplexity/q01-12` (covering GraphRAG, claim extraction, hybrid retrieval, dialectical voicing, span grounding, evaluation metrics).

---

*Report compiled 2026-04-30. No code, configuration, or artifacts were modified in producing it.*
