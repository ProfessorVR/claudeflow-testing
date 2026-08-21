# Master Plan — Analysis-Upgrade Production Integration

**Status:** Final — awaiting user approval before any execution
**Date:** 2026-04-19
**Supersedes:** prior back-and-forth analyses in this session
**Companion docs:**
- `SYSTEM-REVIEW-GAPS.md` — gap analysis driving the work items below
- `claim-extractor-upgrade/reports/03-final-evaluation.md` — extractor readiness evidence
- `integration-sandbox/FINAL-RESULTS.md` — end-to-end pipeline proof

---

## Guiding principles

1. **Comprehensive backup precedes any change.** Including prior sandbox work.
2. **All experimentation runs in isolation.** The live codebase is not touched until a single coordinated promotion at the end. This includes TypeScript source (git worktree), Python scripts (sandbox copies), and data artifacts (separate `corpus/index/` paths gated by env var).
3. **One variable per experiment.** Each tuning step changes exactly one thing, and stands or falls on pre-registered metric thresholds.
4. **Measurement precedes tuning.** Gold set + baseline before any parameter sweep.
5. **Cheap feedback often; expensive feedback at architectural transitions.** Gold metrics at every step; full god-write A/B only at major boundaries.
6. **Single coordinated promotion.** No rolling deploys. Either everything passes and ships together, or we roll back the whole bundle.

---

## Phase 0 — Comprehensive backup (must be first)

**Deliverable:** `backups/pre-promotion-YYYYMMDD-HHMMSS/` with all affected state captured.

### What gets backed up

| Layer | Path | Why |
|---|---|---|
| Live TypeScript consumers | `src/god-agent/universal/corpus-index-provider.ts`, `.../cross-author-utils.ts`, `.../smart-retrieval-layer.ts`, `.../write-pipeline-orchestrator.ts`, `.../gold-standard-prompt-builder.ts`, `.../retrieval-stage.ts`, `.../quality-integration.ts`, `.../icp-orchestrator.ts` | All identified consumer call-sites from gap review |
| Live Python compiler | `scripts/compile-corpus-index.py` | Single source of compiled-index.json |
| Live corpus index | `corpus/index/compiled-index.json` (313 KB), `corpus/index/<author>/*` (per-author MD/JSON/CSV) | Entire analytical layer |
| Prior analysis-upgrade work | `tmp/analysis-upgrade/` in full (original sandbox + claim-extractor-upgrade + integration-sandbox) | All the experimental output we've built so far |
| Current git state | `git rev-parse HEAD` + annotated tag `pre-promotion-YYYYMMDD` | So we can always `git reset --hard` back |
| Ancillary state | `.env` (redacted), `scripts/ingest/manifest.jsonl` | Environment + corpus bookkeeping |

### Execution steps

1. Create `backups/pre-promotion-$(date +%Y%m%d-%H%M%S)/` and subdirectories.
2. Copy TypeScript files preserving relative paths.
3. Copy Python compiler + `corpus/index/` tree (use `rsync -a`).
4. Copy entire `tmp/analysis-upgrade/` tree.
5. Record: `git rev-parse HEAD > backups/.../GIT_HEAD.txt` and create lightweight git tag `pre-promotion-YYYYMMDD` (local only; do not push).
6. Verify backup completeness: file count + total size match source.
7. Write `backups/.../MANIFEST.md` summarizing what was backed up, size, timestamp, and restoration command.

**Gate:** phase 0 does not complete until manifest shows ≥1.1GB backed up (the prior sandbox alone is ~900MB).

---

## Phase 1 — Sandbox setup (complete isolation)

**Deliverable:** A new sandbox that can run the full promotion end-to-end without touching any live code or data.

### Structure

```
tmp/analysis-upgrade/production-sandbox/
├── README.md
├── src-worktree/                          # git worktree of the repo on a new branch
│   ├── src/god-agent/...                  # modifiable TypeScript
│   ├── scripts/compile-corpus-index.py    # modifiable Python
│   └── tests/                             # smoke-test harness
├── data/
│   ├── corpus/index/                       # sandbox compiled-index + per-paper dirs
│   │   ├── ARTIFACT-MANIFEST.json          # tracks active_release pointer + per-artifact active version
│   │   ├── releases/
│   │   │   ├── release-1.json              # initial release (all v1 artifacts)
│   │   │   ├── release-2.json              # created when first E-step is kept
│   │   │   └── ...                         # one per kept major E-step
│   │   ├── compiled-index.json             # SYMLINK → compiled-index.v{N}.json (set by activate-release.sh)
│   │   ├── compiled-index.v1.json          # per-release snapshot
│   │   ├── ontology-embeddings.jsonl       # SYMLINK → ontology-embeddings.v{N}.jsonl
│   │   ├── ontology-embeddings.v1.jsonl    # v1 artifact
│   │   ├── claims.jsonl                    # SYMLINK → claims.v{N}.jsonl
│   │   ├── concept-mentions.jsonl          # SYMLINK → concept-mentions.v{N}.jsonl
│   │   ├── bridge-candidates.jsonl         # SYMLINK → bridge-candidates.v{N}.jsonl
│   │   └── <paper-slug>/...                # populated by batch extraction
│   ├── gold/
│   │   ├── resolver-gold-dev.jsonl         # 50-item dev set
│   │   └── resolver-gold-holdout.jsonl     # 20-item holdout (locked after E0)
│   └── prompts/
│       └── canonical-suite.json            # 6 frozen prompts + SHA256 hash
├── scripts/
│   ├── run-extractor.sh                    # batch wrapper
│   ├── run-experiment.sh                   # runs one E-step
│   ├── run-ab.sh                           # god-write A/B harness (MANDATORY for phase 5)
│   ├── activate-release.sh                 # atomic release-bundle activation (see Phase 7)
│   ├── create-release.sh                   # snapshots current artifact versions into new release-N.json
│   ├── preflight-phase6.sh                 # writes the four required values
│   └── smoke-test.sh                       # gate after each major step
└── results/
    ├── e0-baseline.json                    # each file carries sandbox_sha, manifest_hash, prompt_suite_hash, timestamp
    ├── e1-threshold-060.json
    ├── ...                                 # one metrics file per E-step
    └── experiment-log.md                   # running decision log
```

### Isolation mechanics

- **TypeScript isolation via git worktree.** `git worktree add tmp/analysis-upgrade/production-sandbox/src-worktree writing-pipeline-v3` creates an independent checkout on a new branch. All TS changes happen there. Live `src/` is never touched.
- **Python script isolation.** Scripts in the worktree are what we execute. Paths are absolute or resolved via `SCRIPT_DIR`.
- **Data isolation via env var.** `CORPUS_INDEX_PATH=tmp/analysis-upgrade/production-sandbox/data/corpus/index` is set for every sandbox invocation. The TS loader (`jsonl-loaders.ts`) reads this env var; default falls back to live path.
- **API keys unchanged.** `.env` is reused (read-only); no rotation needed.

### Gate

Phase 1 complete when:
- Worktree exists at expected path and is on a new branch.
- Data directory structure matches spec.
- `scripts/smoke-test.sh` runs and reports "sandbox healthy: no live files modified" (reads git status on main worktree; fails if any live file dirty).

---

## Phase 2 — Consumer wiring (Blockers B1–B7)

All work inside `production-sandbox/src-worktree/`. No commits to `main` or `writing-pipeline-v2`.

### Work items

| # | File | Change | Effort |
|---|---|---|---|
| B1 | `scripts/compile-corpus-index.py` | Extend to read per-paper `<slug>/{claims,concept-mentions,bridge-candidates}.jsonl`; apply faithfulness filter; promote bridges by rule; add novel ontology nodes with centrality tagging | 3 hr |
| B2 | `src/god-agent/universal/corpus-index-provider.ts` | Add `Claim`, `ConceptMention` interfaces; extend `CompiledIndex` with new optional fields | 30 min |
| B2 | `src/god-agent/shared/cross-author-utils.ts` | Add optional new fields to `CrossPipelineHook`; extend `CompiledIndex` | 15 min |
| B3 | `src/god-agent/universal/corpus-index-provider.ts` | Add `loadActiveClaims(topic, filters?)` — top-K by topic term frequency, filterable by speaker/stance/use_mention/faithfulness/claim_type | 1 hr |
| B4 | `src/god-agent/universal/write-pipeline-orchestrator.ts` | Insert `## Active Claims (from secondary lit)` block at 6 injection points, parallel to existing `## Cross-Pipeline Hooks` | 1.5 hr |
| H1 | `src/god-agent/shared/cross-author-utils.ts` | Raise `getActiveBridges` cap 1 → 3; `getActiveTensions` cap 3 → 5 | 5 min |
| B5 | `corpus/index/ontology-embeddings.v1.jsonl` + symlink | Generate via GTE-Qwen (reuse `sandbox/scripts/embed_ontology.py`); write `ontology-embeddings.v1.jsonl`; symlink `ontology-embeddings.jsonl` → `v1`; register in initial release manifest `releases/release-1.json`. Loader reads the fixed-name symlinked path; no `current.txt` or other pointer. | 1 hr |
| B6 | `scripts/analyze-claims/` | Move extractor + prompts from `tmp/` into tracked sandbox scripts; add shell wrappers `analyze-primary.sh`, `analyze-secondary.sh` | 1 hr |
| B7 | `scripts/analyze-claims/prompts/candidate_{primary,secondary}.md` | Fix 5 taxonomy edge cases from gold-audit flagged items; re-validate on DA/BCAP/Caston samples | 2 hr |
| Env | `src/god-agent/shared/jsonl-loaders.ts` | Add `CORPUS_INDEX_PATH` env support with live fallback | 15 min |

### Smoke-test gate (O1)

Before proceeding to phase 3, run `scripts/smoke-test.sh` which:
1. Builds TS (no errors).
2. Writes one hand-crafted claim into `data/corpus/index/test-paper/claims.jsonl`.
3. Runs `compile-corpus-index.py` on the sandbox path — verifies claim appears in compiled-index.
4. Runs a minimal god-write CLI invocation pointed at the sandbox — verifies `## Active Claims` block appears in the prompt logs and the hand-crafted claim is listed.
5. Reports PASS/FAIL. Phase cannot proceed if any check fails.

**Gate:** PASS on smoke test + zero changes on main worktree.

---

## Phase 3 — Batch claim extraction

### 3a. Canary (3–5 PDFs)

Select 3–5 diverse PDFs that have **not** been processed in prior sandboxes:
- 1 secondary-lit phantasia commentator (e.g., Frede 1992)
- 1 rhetoric-tradition text (e.g., O'Gorman 2005)
- 1 non-phantasia (e.g., Burnyeat or Bowin)

Run `scripts/analyze-claims/analyze-secondary.sh` on each. Verify:
- Output JSONL format valid.
- Manifest entry written per paper.
- No API errors; rate limit respected.

**Gate:** 3–5 canary runs complete without error; manifest up to date.

### 3b. Full batch (~30 PDFs)

Scope: all unprocessed secondary-lit PDFs in `corpus/rhetorical_ontology/` + `corpus/metaphysics/` + `corpus/new_media/`.

Skip rule: check `corpus/index/claim-extraction-manifest.jsonl` — do not reprocess papers already covered by prior sandbox work (Nussbaum 1985, Caston 1995, Heidegger BCAP §4-5, Aristotle DA III.3). Copy those existing outputs into the sandbox as if they were just extracted.

Execution:
- Parallelism: 3 concurrent extractions (respects Anthropic tier).
- Checkpoint per-paper to manifest.
- Auto-retry on transient errors (3 attempts, exponential backoff).
- Log to `results/batch-extraction.log`.

**Estimated:** ~$15, ~3 hr wall time.

### Batch health gate (compound)

| Check | Threshold | If fails |
|---|---|---|
| Manifest entries | One per attempted paper, 100% | **Pause batch** |
| Hard failures (API exhaustion, OCR total failure, crash) | ≤ 10% of papers | **Pause batch** |
| Zero-claim papers | ≤ 5% | Contributes to compound trigger |
| Median claims per paper | ≥ 20 | **Advisory** — pause only if compounded (see below) |
| Manual spot-check of 5 diverse papers | All pass (no systematic under-extraction) | Contributes to compound trigger |

**Pause-vs-flag rule:**
- **Pause batch** if any hard threshold fails, OR if median < 20 AND at least one of {zero-claim rate > 5%, spot-check failure} also fails.
- **Flag for review but continue** if median < 20 AND no other failure signal (likely benign genre mix — e.g., short commentaries).
- **Proceed cleanly** if all thresholds pass.

All compound-gate decisions are recorded in `results/batch-health-report.md`.

---

## Phase 4 — Build resolver gold set (70 items: 50 dev + 20 holdout)

**Deliverable:** two gold files, each item of form `{claim_id, claim_text, expected_ontology_nodes: string[], rationale}`:
- `data/gold/resolver-gold-dev.jsonl` — 50 items used for iteration in E0–E8
- `data/gold/resolver-gold-holdout.jsonl` — 20 items used only for cross-check at major E-step transitions

### Composition

**Dev (50 items):**
- 15 from Aristotle primary (DA III.3) — classical ontology matches
- 10 from Heidegger primary (BCAP) — German + Greek cross-lingual
- 15 from phantasia commentators (Nussbaum, Caston, Frede, Gonzalez) — well-covered domain
- 10 from non-phantasia secondary (Burke, Gibson, Chalmers if batched) — edge cases including modern-philosophy terms

**Holdout (20 items):**
- Same distribution, labeled after dev set is locked
- **Reserve 5 items drawn specifically from modern-philosophy content** (intentionality, supervenience, qualia, emergence) so E4 (modern-node curation) is tested on unseen cases

### Authorship
Draw claim candidates from non-flagged successful extractions (use claim-extractor gold audit to filter). For each, manually label which ontology node ID(s) the claim legitimately refers to. Allow empty set for "no matching node exists" cases (these are direct signals for modern-node curation at E4).

### Effort
4 hr of focused annotation (was 3 hr for 50; +1 hr for the extra 20 holdout items).

### Discipline rules
- **Holdout is LOCKED after E0 baseline is recorded.** Not viewed or inspected during E1–E8 iteration.
- **Holdout is evaluated only at major E-step transitions** (post-E2, post-E5, post-E6, post-E8).
- **If dev Δ F1 and holdout Δ F1 diverge by more than 0.05** (absolute gap in either direction), that is an overfitting signal — stop and investigate rather than continue tuning.
- **Holdout-governed stop rule:** see §Phase 5 decision thresholds for the 2-of-3 signal requirement on major E-steps.

**Gate:** 70 items complete; inter-annotator consistency spot-check on 15 items (re-examining after a break or LLM-assisted agreement check). Holdout file's modification time is recorded in `ARTIFACT-MANIFEST.json` — subsequent modifications before phase 6 are forbidden.

---

## Phase 5 — Experiments E0–E8 (in sandbox)

All E-steps modify ONLY files under `production-sandbox/`. Each logs metrics to `results/eN-*.json` and a decision entry to `experiment-log.md`.

### Phase 5 prerequisites (mandatory, not optional)

Before E0 can run, all of the following must be in place:
- **Regression harness operational.** `scripts/run-ab.sh --prompt-suite canonical --baseline-sha $SHA` emits a single JSON with per-prompt quality score, cited-author list, claim-activation counts, and use-mention spot-check result. This is the execution path for every god-write A/B measurement in the ladder.
- **Canonical prompt suite frozen.** 6 prompts covering: phantasia/action, perception/sense, methodology, virtual/digital (tests E4 modern-nodes), tension-acknowledgement, and one adversarial prompt designed to exercise dialectical voicing (tests use-mention integrity). SHA256 of the suite JSON recorded in `ARTIFACT-MANIFEST.json` and checked at every A/B run.
- **Artifact versioning + release bundles operational.** All derived artifacts (ontology-embeddings, claims, concept-mentions, bridge-candidates, compiled-index) exist as `*.vN.*` files with same-name symlinks. Each kept E-step creates a new `releases/release-N.json` bundle via `create-release.sh`. `activate-release.sh <N>` atomically rotates the whole bundle — no per-artifact rotation is exposed.
- **Results provenance.** Every results JSON records `sandbox_sha`, `artifact_manifest_hash`, `canonical_prompt_suite_hash`, `timestamp`.

### Pre-registered decision thresholds

#### Per-step keep/rollback

| Condition | Action |
|---|---|
| Gold dev F1 improves by ≥ 0.02 over prior kept E | Contributes to keep signal |
| Major-step god-write quality improves by ≥ 0.01 median across canonical suite AND no individual prompt regresses by > 0.02 | Contributes to keep signal |
| Holdout Δ F1 ≥ +0.01 (checked only at major transitions) | Contributes to keep signal |
| Either metric regresses substantially (F1 < prior −0.02 OR quality < prior −0.01) | **Roll back** |
| F1 delta 0.00 ± 0.02 AND no quality signal demanded | **Roll back**; cost of added complexity not justified |
| Dev–holdout divergence > 0.05 F1 (absolute, either direction) | **Stop and investigate**; do not proceed to next E |

#### Major-step "2-of-3 signal" rule

For major E-steps (E2, E5, E6, E8) to survive, at least **two of three** positive signals must fire:

1. Dev Δ F1 ≥ +0.02 (**required** — must be one of the two)
2. Holdout Δ F1 ≥ +0.01
3. God-write median Δ quality ≥ +0.01 across canonical suite (with no-individual-regression clause)

Dev-only wins with flat or diverging holdout do **not** survive unless god-write carries the vote AND spot-check of flagged items shows no structural problem.

Minor E-steps (E1, E3, E4, E7) use dev + holdout-sanity-check only; no mandatory god-write.

### The ladder

| E | Change (1 variable) | Measurement | Gate |
|---|---|---|---|
| **E0** | Baseline: v1 embeddings, threshold 0.55, original ontology, no reranker, no hybrid | Gold dev F1 + holdout F1 + god-write A/B | Baseline numbers recorded; holdout locked |
| E1 | Threshold 0.55 → 0.60 | Gold dev only | Keep if Δ dev F1 ≥ 0.02 |
| **E2** | Threshold 0.60 → 0.65 | Gold dev + holdout + god-write A/B (end of sweep) | 2-of-3 rule; keep best of E1/E2 |
| E3 | Ontology denoise (enrich generic-node definitions, add specificity prior for "Image", "Perception", "Emotion" etc.) | Gold dev only | Keep if Δ dev F1 ≥ 0.02 |
| E4 | Add 30–50 modern-philosophy nodes (LLM-draft from Caston/Chalmers/Kim/Metzinger passages, human review) | Gold dev only | Keep if Δ dev F1 ≥ 0.02, especially on non-classical dev items |
| **E5** | Add BGE-reranker-v2-m3 on top-K ontology candidates | Gold dev + holdout + god-write A/B | 2-of-3 rule |
| **E6** | Query-time hybrid scoring `0.7·cos + 0.3·conceptOverlap` (candidates-only, no chunk pre-tag) | Gold dev + holdout + god-write A/B + **latency budget** | 2-of-3 rule AND p95 retrieval overhead ≤ +300 ms |
| E7 | Lazy per-chunk concept_hits cache (populate on retrieval, reuse from cache thereafter) | Gold dev + latency | Keep if no latency regression AND cache hit rate > 30% after 50 queries |
| **E8** | Full corpus-wide chunk pre-tagging + optional bi-encoder swap (BGE-M3) | Gold dev + holdout + god-write A/B + **latency/size budget** | Only if prior E-steps did not reach quality target; 2-of-3 rule AND pre-tag batch ≤ 2 hr wall AND ≤ 50 MB metadata growth AND (if bi-encoder swapped) ontology re-embedding ≤ 10 min |

Bold rows = major transitions: god-write A/B performed, holdout checked, 2-of-3 rule applied.

### Budgets

| E-step | Compute cost | Human time |
|---|---|---|
| E0 | $2 god-write | 30 min |
| E1+E2 | $2 god-write | 1 hr |
| E3 | — | 2 hr denoise curation |
| E4 | $5 LLM drafting + 4–8 hr human review | 4–8 hr |
| E5 | $1 reranker compute | 1 hr wiring |
| E6 | $2 god-write | 2 hr code |
| E7 | — | 2 hr code |
| E8 | $3 pre-tag batch + $2 god-write | 4 hr |

Total estimated experimentation: ~$17 + ~25 hr human time.

### Gate between phases 5 and 6

Phase 5 complete when:
- All E-steps attempted OR a stop-threshold met.
- `experiment-log.md` has clear keep/rollback decisions for each.
- Final "survivor set" identified (e.g., E0 + E1 + E3 + E4 + E5 kept; E6 rolled back; E7 kept).

---

## Phase 6 — Promotion (sandbox → live)

**Deliverable:** all survivor-set changes applied to live repo + corpus in one coordinated change.

### Preflight checklist (blocking gate)

Phase 6 **cannot start** until `scripts/preflight-phase6.sh` writes all four values to `results/phase6-preflight.json` and the file is committed to the worktree:

| Value | Source |
|---|---|
| `active_sandbox_git_sha` | `git rev-parse HEAD` in worktree |
| `active_artifact_manifest_hash` | `sha256sum data/corpus/index/ARTIFACT-MANIFEST.json` |
| `canonical_prompt_suite_hash` | `sha256sum data/prompts/canonical-suite.json` |
| `survivor_set` | Ordered list like `["E1","E3","E5"]` — kept E-steps from phase 5 |

All four must be present, non-empty, and match the hashes used in the final E-step's results JSON. Any mismatch blocks promotion and requires re-running the final A/B to establish consistency.

### Prerequisites
- Phase 0 backup verified still intact.
- Git tag `pre-promotion-YYYYMMDD` still points at the pre-work HEAD.
- Preflight checklist above complete.
- Dissertation writing user notified of a ~30-min write-freeze window.

### Execution sequence

1. **Freeze sandbox state.** Note git SHA on worktree, lock the data dir.
2. **Run full smoke test one last time.** All checks PASS.
3. **Dry-run promotion script.** `scripts/promote-analysis-upgrade.sh --dry-run` reports what would change.
4. **Commit worktree to `writing-pipeline-v3` branch** with structured message listing all kept E-steps.
5. **Rebase/merge to main** via PR or direct (user choice).
6. **Copy sandbox data** to live paths:
   - `data/corpus/index/*.v1.jsonl` → `corpus/index/` (versioned artifacts).
   - `data/corpus/index/<paper>/*` → `corpus/index/<paper>/` (per-paper claim/mention/bridge sidecars).
   - Activate the promoted release via `activate-release.sh <survivor-release-id>` (atomic bundle swap of all symlinks + ARTIFACT-MANIFEST).
7. **Run live compile-corpus-index.py** (now the upgraded version) to rebuild `corpus/index/compiled-index.json`.
8. **Post-promotion smoke test.** Run god-write on the canonical "Discuss Aristotle's account of phantasia..." prompt. Verify:
   - Output non-empty and coherent.
   - New `## Active Claims` block is non-empty.
   - No new errors in logs.
   - Quality score within +0.01 of sandbox A/B result.
9. **Tag success.** `git tag post-promotion-YYYYMMDD`.

### Time budget
- Dry-run: 10 min.
- Live work: 15 min.
- Smoke test: 5 min.
- **Total write-freeze:** ~30 min.

---

## Phase 7 — Rollback protocol

### Triggers
Any of:
- Post-promotion smoke test FAILS.
- User reports regression within 24 hr.
- god-write quality score > 0.02 lower than pre-promotion on a known-good prompt.

### Execution (bundle-level rollback via activate-release.sh)

Rollback is atomic at the **release** level, never per-artifact. A release is a coordinated snapshot of the active versions of all artifacts; per-artifact rotation is not exposed, so no command sequence can leave the system in a mixed-version state.

```bash
# Roll back to release-1 (pre-promotion baseline, all v1 artifacts)
bash scripts/activate-release.sh 1

# The script atomically:
#   1. Reads releases/release-1.json (lists target version for every artifact)
#   2. Verifies every target file exists and matches expected hash
#   3. Rewrites ALL fixed-name symlinks in one pass
#   4. Updates ARTIFACT-MANIFEST.json active_release pointer last
#   5. Re-verifies post-swap integrity
# Loader code is unchanged because it reads the symlinked fixed-name files.
# If any step fails, the script aborts before mutating state; no partial rollback possible.
```

Each kept E-step in phase 5 produces a new release via `create-release.sh`. The natural sequence:
- `release-1.json` — initial state, all v1 artifacts (created at end of phase 1)
- `release-2.json` — created if E1 or E2 is kept
- `release-3.json` — created if E3 is kept
- …etc.

The final promotion ships whatever release number corresponds to the survivor-set bundle.

### Full-state restore (nuclear option)

If artifact versioning itself gets corrupted:

```bash
git reset --hard pre-promotion-YYYYMMDD
rsync -a --delete backups/pre-promotion-YYYYMMDD-HHMMSS/corpus/index/ corpus/index/
rsync -a --delete backups/pre-promotion-YYYYMMDD-HHMMSS/src/god-agent/ src/god-agent/
cp backups/pre-promotion-YYYYMMDD-HHMMSS/scripts/compile-corpus-index.py scripts/compile-corpus-index.py
# re-verify:
npm run typecheck && bash scripts/smoke-test.sh --live
```

### Partial rollback
If one kept E-step is later found regressing (e.g., E5 reranker after promotion), roll back to the release that represents pre-E5 state:

```bash
# E.g., if survivor-set shipped through release-5 and E5 corresponds to release-5,
# roll back to release-4 (pre-E5 bundle):
bash scripts/activate-release.sh 4
```

This is still one atomic bundle swap, not a per-artifact rotation.

Alternatively, E-step behavior can be gated by a boolean in `src/god-agent/shared/config.ts` (added during phase 2), so a problem feature can be disabled without reverting the artifact bundle.

---

## Resolved decisions (no remaining open items)

All decisions that were previously floating have been closed before execution:

| Item | Decision | Implemented in |
|---|---|---|
| **Write-freeze window** | Morning of Phase 6 execution day; starts at `preflight-phase6.sh`; ends at `smoke-test.sh --live` PASS (or rollback) | Phase 6 preflight + smoke-test |
| **H9 old-hook backfill** | Graceful-default tolerance — new TS fields are all optional, `undefined` treated as neutral downstream | Phase 2 B2 work item |
| **H10 regression harness** | Mandatory before E0; part of Phase 5 prerequisites | Phase 5 prerequisites |
| **H8 claim-to-chunk linkage** | Deferred to v2 (not a blocker for first promotion); revisit only if provenance expansion becomes a measured bottleneck | Out of scope |
| **Parallelism** | Phase 3 batch ↔ Phase 4 gold labeling may overlap (different artifact paths, no write contention); E3/E4 human curation may overlap E1/E2 runs (human multitasking); within any E-step chain, strict serial; no overlap at Phase 6 | Phase 1 README + phase-level notes |

---

## What is explicitly OUT of scope for this promotion

Deferred to v2 per gap review:
- D1 Multi-author concept constellations.
- D3 Claim-level deduplication across papers.
- D4 Greek/transliteration normalization.
- D5 OCR cache integration.
- D6 Semantic claim filtering at write-time.
- D7 Interactive concept-neighborhood explorer.
- D8 Quality-gauntlet → index feedback loop.

---

## Cost and time summary

| Phase | Compute | Human time |
|---|---|---|
| 0 — Backup | $0 | 30 min |
| 1 — Sandbox setup (incl. symlink scaffolding + `activate-release.sh` + `create-release.sh`) | $0 | 1.5 hr |
| 2 — Consumer wiring (B1–B7) | $0 | 8 hr |
| 3 — Batch extraction | $15 | 3 hr (mostly wall) |
| 4 — Gold set (70 items: 50 dev + 20 holdout) | $0 | 4 hr |
| 5 — E0–E8 experiments (incl. mandatory harness + latency instrumentation) | $17 | 27 hr |
| 6 — Promotion (incl. preflight checklist) | $2 | 1 hr |
| 7 — Rollback (conditional) | $0 | 30 min |
| **Total (no rollback)** | **~$34** | **~45 hr** |

Wall-clock calendar: feasible in 4–6 working days if single-threaded, or 2–3 days with parallelism where possible (batch extraction runs overnight; gold-set labeling in parallel with phase 3; E-steps mostly sequential but E3/E4 curation can run in parallel with E1/E2 experiments).

---

## Success criteria for the overall upgrade

Promotion is declared successful if, relative to pre-promotion baseline, all mandatory criteria are met:

### Mandatory (must hit all)

1. **God-write quality score:** median Δ across 6-prompt canonical suite ≥ **+0.01** (ship tier) **AND** no individual prompt regresses by more than 0.02.
2. **`## Active Claims` block** fires on ≥ 70% of topic-relevant prompts.
3. **Zero false-attribution incidents** in spot-checks (no "Aristotle endorses X" where Aristotle only voiced X dialectically).
4. **No regression** on canonical tension-aware prompts (tension acknowledgement rate unchanged or improved).

### Tier labels (informational, not gates)

| Tier | Median Δ quality |
|---|---|
| **Ship** | ≥ +0.01 |
| **Good** | ≥ +0.02 |
| **Excellent** | ≥ +0.03 |

### Aspirational (desirable but not blocking)

5. **Cited-author diversity:** +2 distinct authors in retrieved chunks on a phantasia query.
6. **Secondary-lit citation rate:** +50% (e.g., Nussbaum/Caston appearing per paper).

Aspirational metrics that regress without mandatory metrics failing go into the post-promotion backlog, not the rollback trigger.

---

## Ready for execution — zero open decisions

This plan incorporates:
- 7 rounds of back-and-forth refinement (consumer-gap-first, artifact-vs-model versioning, gold-set-before-tuning, 1-variable E-ladder with explicit stop thresholds, canary-before-batch, lazy-cache middle option, tiered ship targets, compound batch-health gate, dev/holdout split, mandatory harness, release-bundle rollback atomicity, 2-of-3 major-step signal rule, phase-6 preflight checklist, single-mechanism artifact activation).
- All explicit user directives:
  - Phase 0 comprehensive backup (including all prior `tmp/analysis-upgrade/` work).
  - All execution in a sandbox that does not touch the live codebase.
- The 25 gaps from `SYSTEM-REVIEW-GAPS.md`, sorted into blockers (addressed in phases 2–3), high-priority (addressed in phases 3–5), and deferred (out of scope).

All previously open decisions (write-freeze timing, H9 backfill policy, H10 harness automation, H8 scope, parallelism level) are resolved in §Resolved decisions above.

Phase 0 may start immediately.
