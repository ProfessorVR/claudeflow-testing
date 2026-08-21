# Production Sandbox — Analysis-Upgrade Promotion

This sandbox is the isolation boundary for executing MASTER-PLAN phases 2–5. Nothing here touches the live codebase or live `corpus/index/` until phase 6 promotion.

## Layout

```
production-sandbox/
├── README.md                        (this file)
├── src-worktree/                    git worktree on branch `writing-pipeline-v3`
├── data/
│   ├── corpus/index/                sandbox compiled-index + per-paper dirs
│   │   ├── ARTIFACT-MANIFEST.json
│   │   ├── releases/                release-N.json bundles
│   │   ├── compiled-index.json      → symlink → compiled-index.vN.json
│   │   ├── ontology-embeddings.jsonl → symlink → ontology-embeddings.vN.jsonl
│   │   ├── claims.jsonl             → symlink
│   │   ├── concept-mentions.jsonl   → symlink
│   │   └── bridge-candidates.jsonl  → symlink
│   ├── gold/                        resolver gold sets (dev + holdout)
│   └── prompts/
│       └── canonical-suite.json     6 frozen prompts + SHA256
├── scripts/                         helper scripts (see §Scripts below)
├── results/                         per-E-step metrics + experiment-log.md
└── tests/                           smoke-test harness
```

## Isolation mechanics

- **TypeScript isolation.** All TS edits go under `src-worktree/src/`. The top-level repo is untouched.
- **Python script isolation.** Edited compilers live under `src-worktree/scripts/`.
- **Data isolation.** All invocations set `CORPUS_INDEX_PATH=<absolute-path-to>/data/corpus/index`. The TS loader reads this env var with live fallback.
- **Release bundles.** Artifact activation is atomic at the release level (`scripts/activate-release.sh N`). Per-artifact rotation is not exposed.

## Scripts

| Script | Purpose |
|---|---|
| `scripts/smoke-test.sh` | Runs after each major step; verifies no live files touched, TS builds clean, hand-crafted claim reaches Active Claims prompt block |
| `scripts/create-release.sh <N> [description]` | Snapshot current artifact versions into `releases/release-N.json` |
| `scripts/activate-release.sh <N>` | Atomic bundle swap: rewrites all symlinks in one pass, updates `active_release` in ARTIFACT-MANIFEST last |
| `scripts/run-extractor.sh <paper>` | Wrapper around the claim extractor (primary or secondary) |
| `scripts/run-experiment.sh <E-step>` | Runs one E-step from the ladder, logs metrics JSON |
| `scripts/run-ab.sh --prompt-suite canonical --baseline-sha <sha>` | God-write A/B harness (mandatory for major E-steps) |
| `scripts/preflight-phase6.sh` | Writes the four required values before promotion |

## Branch and worktree

- Worktree: `tmp/analysis-upgrade/production-sandbox/src-worktree`
- Branch: `writing-pipeline-v3`
- Base commit: `54c2ba1fec70775e57274fa3eeb9b42f1da8a4b8` (tag `pre-promotion-20260419`)

## Parallelism allowed

- Phase 3 batch (API-bound) can overlap with Phase 4 gold labeling (human-bound) — different artifact paths, no write contention.
- Phase 5 E3/E4 (human curation) can overlap with Phase 5 E1/E2 (parameter sweep runs).
- Within any E-step chain, strict serial.
- No overlap at phase 6 promotion.
