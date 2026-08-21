# Phase 3a Canary — Results Report

**Status:** COMPLETE — PASS (all compound gates cleared)
**Date:** 2026-04-19
**Model:** `claude-sonnet-4-6` (verify pass on same model)

---

## Extraction totals

| Paper | Pages | Chunks | Claims | Cost | Dur | Chunks failed |
|---|---|---|---|---|---|---|
| Frede 1992 | 9 | 5 | 144 | $0.79 | 712s | 0 |
| O'Gorman 2005 | 13 | 7 | 191 | $1.04 | 812s | 0 |
| Bowin 2017 | 19 | 10 | 156 | $1.18 | 948s | **2** (JSON parse) |
| White 1985 | 23 | 12 | 295 | $1.52 | 1268s | 0 |
| **Total** | **64** | **34** | **786** | **$4.53** | 63m wall (parallel) | 2 of 34 (5.9%) |

Actual spend $4.53 vs original estimate $1.40 — claim density per page was ~3× higher than Nussbaum baseline suggested. Still well within what's tolerable for canary.

## Post-canary pipeline (resolve → bridges → recompile)

- **Concept mentions:** 1,979 claim↔ontology pairings resolved via GTE-Qwen cosine (min score 0.55, top-5 per claim).
- **Bridge candidates:** 0 generated. Expected — `generate_bridges.py` anchors against existing `crossPipelineHooks` in the compiled index, and the sandbox's compiled-index started empty (via `--bootstrap-empty`). Phase 5 prep should hydrate the sandbox with the LIVE `compiled-index.json` (317 hooks) so bridge-generation has anchor hooks.
- **Direct hooks:** 241 author→Aristotle hooks auto-generated from top mentions (score ≥ 0.65).
- **Novel ontology nodes:** 961 added (secondary-lit and primary-citation tiers) — tagged `centralityTier: peripheral`, ready for H3 centrality recalibration.

## Compound gate verdict — PASS

| Check | Threshold | Observed | Status |
|---|---|---|---|
| Papers present | 4 / 4 | 4 | ✅ |
| Hard failures (API crash, zero-output) | ≤ 10% | 0 | ✅ |
| Zero-claim papers | ≤ 5% | 0 | ✅ |
| Median claims per paper | ≥ 20 | 173.5 | ✅ |
| Missing required fields | 0 | 0 | ✅ |

## B7 taxonomy audit (surface flags only — not gate failures)

| Category | Count | Assessment |
|---|---|---|
| `exegetical_claim` on secondary-lit papers | 77 | **EXPECTED** — the B7 rule relocated `exegetical_claim` to secondary-lit only. These are legitimate here. Confirms the prompt revision is being honored. |
| `thetic` with `?` in quote (aporetic leak) | 0 | ✅ Aporetic-question discipline holding. |
| `use_mention: mention` + `stance: endorses` | 9 | 9 / 786 = 1.1%. Marginal anomaly rate; flag for spot-review but well within tolerance. |
| `dialectical_objection` attributed to "ancients"/"common" without refutation context | 0 | ✅ Predecessor-report vs dialectical-objection rule holding. |

## Faithfulness distribution

| Paper | supported | partial | unchecked | unsupported |
|---|---|---|---|---|
| Frede | 62% | 35% | 3% | 0.7% |
| O'Gorman | 61% | 26% | 13% | 0.5% |
| Bowin | 76% | 20% | 4% | 0.6% |
| White | 68% | 26% | 5% | 0.7% |
| **All** | **67%** | **26%** | **6%** | **0.6%** |

**Implication for `loadActiveClaims` filter:** Current default allowlist (`author-endorsed` + `supported`) drops the 26% `partial` tier — roughly 200 claims in this canary. Consider widening the default to include `partial` at Phase 5 E-step tuning, since `partial` claims are still attributable and preserve the use/mention frame.

## Known issues noted for Phase 3b

1. **Pre-patch `_robust_json_array` salvage path** — two Bowin chunks (pages 3-4 and 17-18) emitted JSON with unescaped double-quotes inside string values, failing the balanced-bracket parse AND the trailing-comma fallback. The bracket-balanced branch was returning None instead of falling through to `rfind("},")` salvage. **Patched** in `extractor.py` post-canary — future runs will fall through to salvage and recover partial claims. Estimated saving: ~50 claims per 30-PDF batch.
2. **5.9% chunk-level loss on pre-patch code** — ~60 claims lost on Bowin alone. Acceptable for canary; would be ~4% across 30 papers with the patched extractor.
3. **Bridge generation requires live hooks** — Phase 5 prerequisite: hydrate sandbox compiled-index with LIVE hooks before E0 baseline (currently the sandbox bootstrapped empty, so bridge metrics aren't measurable).

---

## Artifacts on disk

```
data/corpus/index/
├── ARTIFACT-MANIFEST.json                 (active_release: 1)
├── releases/release-1.json                (bootstrap, ontology-embeddings only)
├── compiled-index.json                    (bootstrap + 781 claims + 1979 mentions + 241 hooks + 961 novel ontology)
├── ontology-embeddings.v1.jsonl + symlink (unchanged)
├── claim-extraction-manifest.jsonl        (4 entries, all exit 0)
├── frede-1992/
│   ├── claims.jsonl                 (144)
│   ├── concept-mentions.jsonl       (531)
│   └── bridge-candidates.jsonl      (empty — expected)
├── ogorman-2005/ {claims: 191, mentions: 410, bridges: 0}
├── bowin-2017/   {claims: 156, mentions: 325, bridges: 0}
└── white-1985/   {claims: 295, mentions: 712, bridges: 0}
```

## Next gate — Phase 3b authorization

Phase 3b = full batch on remaining ~25 unprocessed PDFs at ~$15. With the salvage patch in place, expected loss rate drops from ~6% to ~4% of chunks. Canary gates are clean. **Awaiting explicit user authorization** for Phase 3b spend, OR whether to pause here and run Phase 4 gold-set work on the 4 canary papers first so we can start the E0 baseline sooner.
