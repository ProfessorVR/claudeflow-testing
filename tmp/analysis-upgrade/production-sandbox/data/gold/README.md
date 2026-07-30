# Phase 4 Gold Set — Resolver Ground Truth

**Purpose:** Human-labeled `{claim → ontology node(s)}` pairs used to measure the resolver's F1 across every E-step in Phase 5. Without a frozen gold set, E0 baseline is not measurable and the ladder (E1–E8) cannot run formally.

**Author:** Dalton Salvo (human; ~4 hr focused annotation).

**Sandbox commit context:** `1268adbcf` (writing-pipeline-v3, R1.3-baseline-post-3b). 4,921 claims in compiled-index from 23 authors.

---

## 1. Files in this directory

| File | Purpose | When written | Modifiable after E0? |
|------|---------|--------------|----------------------|
| `README.md` | This document | Now | Anytime |
| `resolver-gold-dev.jsonl` | 50-item dev set | Phase 4 | **YES** — iterated on during E1–E8 tuning |
| `resolver-gold-holdout.jsonl` | 20-item holdout set | Phase 4 | **NO** — LOCKED after E0 baseline |
| `resolver-gold-dev.jsonl.template` | Starter template with schema example | Now | Delete when dev is populated |
| `resolver-gold-holdout.jsonl.template` | Starter template with schema example | Now | Delete when holdout is populated |
| `candidates/` | Auto-sampled claim candidates (optional, for priming authoring) | See §5 | — |

---

## 2. Item schema

Each line of each JSONL is a complete JSON object:

```json
{
  "claim_id": "claim-white-1985-042",
  "claim_text": "Aristotle identifies phantasia as a movement resulting from an actual exercise of perception.",
  "expected_ontology_nodes": ["Phantasia", "Aisthesis (Perception)"],
  "rationale": "The claim directly names phantasia and its causal dependence on aisthesis — both first-tier ontology nodes with explicit Greek+transliteration in the ontology.",
  "source": {
    "author": "White, Kevin",
    "year": 1985,
    "page": 7
  },
  "genre": "secondary_phantasia",
  "notes": ""
}
```

**Required fields:** `claim_id`, `claim_text`, `expected_ontology_nodes` (array of ontology-node-name strings; may be empty for "no matching node" cases).

**Recommended fields:** `rationale` (1 sentence why this labeling), `source`, `genre` (see §3 categories), `notes` (caveats, ambiguity flags).

**Empty `expected_ontology_nodes: []`** is a LEGITIMATE label — it flags claims whose concepts have no matching node. These become direct signals for **E4 modern-node curation** (add ontology nodes for intentionality, supervenience, qualia, emergence).

---

## 3. Distribution — Dev set (50 items)

| Genre                             | N    | Source papers                                                     |
|-----------------------------------|------|-------------------------------------------------------------------|
| `primary_aristotle`               | 15   | aristotle-da-3-3 (80 claims available)                             |
| `primary_heidegger`               | 10   | heidegger-bcap-4-5 (112 claims; German+Greek cross-lingual)        |
| `secondary_phantasia`             | 15   | nussbaum-1985, caston-1995, frede-1992, papachristou-2013 (well-covered) |
| `secondary_non_phantasia`         | 10   | Any of: audi, barnes, kim, chalmers, burke (if available), o'gorman, bowin, metzinger (edge cases, incl. modern-philosophy) |
| **Total**                         | **50** |                                                                 |

## 4. Distribution — Holdout set (20 items)

| Genre                             | N    | Notes                                                              |
|-----------------------------------|------|--------------------------------------------------------------------|
| `primary_aristotle`               | 6    |                                                                    |
| `primary_heidegger`               | 4    |                                                                    |
| `secondary_phantasia`             | 5    |                                                                    |
| `secondary_modern_philosophy`     | **5**| **Specifically from Chalmers/Metzinger/Kim on intentionality, supervenience, qualia, emergence.** Tests E4 modern-node curation on unseen cases. |
| **Total**                         | **20** |                                                                  |

---

## 5. Priming — candidate claim samples (optional)

To accelerate annotation, a helper script can sample claim candidates per genre:

```bash
cd /home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/production-sandbox
python3 scripts/sample-gold-candidates.py \
    --dev-size 50 --holdout-size 20 \
    --out data/gold/candidates/
```

This writes `candidates/<genre>.sample.jsonl` with 3× the needed count per genre, drawn from claims with:
- `faithfulness ∈ {author-endorsed, supported, partial}` (no unsupported/speculative)
- `use_mention ∈ {use, mention}` (not null)
- Non-empty `key_concepts`

You pick which candidates to label, discard the rest.

Note: the sampling script is not yet implemented. First pass of gold annotation can be done manually by reading `compiled-index.json` or per-paper `claims.jsonl` files directly. The script is a convenience, not a blocker.

---

## 6. Authoring protocol

1. **Read the claim** — pull `claim_id` + `claim_text` + `key_concepts` from per-paper `claims.jsonl` or compiled-index.
2. **Open the ontology** — read relevant nodes in compiled-index `ontologyNodes[]`. Each node has `name`, `greek`, `transliteration`, `definition`, optional `aliases`. Ontology is currently 7,389 nodes (post-3b); most authoring will reference the ~200 most-connected nodes.
3. **Label `expected_ontology_nodes`** — which node(s) does the claim genuinely refer to? Use node `name` exactly. Empty array is valid.
4. **Write `rationale`** — one sentence that another annotator could use to verify your label.
5. **Flag ambiguous cases** in `notes` — e.g., "claim uses 'imagination' informally; could be Phantasia or Mneme depending on reading".
6. **Batch in 10-15 item sessions** with short breaks. Focus slips after ~15 items of close ontology work.

## 7. Inter-annotator consistency check

- Re-examine **15 randomly-chosen items** from the dev set after a break (or after all 50 are labeled).
- Record which (if any) you'd change on second pass.
- If ≥ 3 of 15 (20%) change, the dev set needs a second pass before lock.
- LLM-assisted agreement: feed each `(claim_text, expected_nodes)` pair to Claude Sonnet with the ontology definitions, ask it to judge agreement. Items where LLM disagrees flag for human re-review.

## 8. Lock discipline

- **Holdout is LOCKED** after E0 baseline is recorded via `create-release.sh`. Do not view, edit, or reference it during E1–E8 iteration.
- **Holdout is evaluated only at major E-step transitions** (post-E2, post-E5, post-E6, post-E8).
- **If dev ΔF1 and holdout ΔF1 diverge by more than 0.05** in either direction, that is an overfitting signal → stop and investigate.
- Holdout file's mtime is recorded in `ARTIFACT-MANIFEST.json` at E0 lock. Subsequent mtime changes before Phase 6 fail the preflight check.

## 9. How this wires into the E-step harness

- `scripts/run-experiment.sh <E>` runs the resolver against both `resolver-gold-dev.jsonl` (always) and `resolver-gold-holdout.jsonl` (only at major-E transitions).
- Emits F1 (micro-average across items), per-genre breakdown, and confusion on empty-expected items.
- Results written to `results/e<N>-<label>.json` with `sandbox_sha`, `artifact_manifest_hash`, `canonical_prompt_suite_hash`, `timestamp`.
- `run-experiment.sh` is currently a stub (per SITREP §7.3). Phase 4 must complete before the stub is fleshed out into a working harness.

## 10. Useful queries while authoring

```bash
# Count claims per genre candidate
jq -s 'group_by(.source.author) | map({author: .[0].source.author, n: length})' \
    data/corpus/index/*/claims.jsonl

# Find claims mentioning a specific concept
jq 'select(.key_concepts[]? | contains("phantasia"))' \
    data/corpus/index/aristotle-da-3-3/claims.jsonl

# List all ontology-node names (for label picking)
jq -r '.ontologyNodes[].name' data/corpus/index/compiled-index.json | sort -u

# Sample top 200 most-connected nodes (approx — check the actual field name)
jq '.ontologyNodes | sort_by(-(.centralityTier // "tertiary" | length)) | .[:200] | map(.name)' \
    data/corpus/index/compiled-index.json
```

---

## 11. Checklist

- [ ] Dev candidates sampled or manually selected (can use helper script or direct reading)
- [ ] 15 `primary_aristotle` items labeled
- [ ] 10 `primary_heidegger` items labeled
- [ ] 15 `secondary_phantasia` items labeled
- [ ] 10 `secondary_non_phantasia` items labeled
- [ ] Dev consistency spot-check (15 items re-reviewed)
- [ ] Dev file saved as `resolver-gold-dev.jsonl` (.template deleted)
- [ ] Holdout 6+4+5+5 items labeled following dev-locked protocol
- [ ] Holdout saved as `resolver-gold-holdout.jsonl` (.template deleted)
- [ ] mtime of holdout recorded to ARTIFACT-MANIFEST.json
- [ ] Phase 5 E0 baseline run → holdout locked

---

**Start here:** review the templates, read §2 + §6, open `compiled-index.json` in a viewer, and label the first 5 items. Come back and let me know when dev is populated or when you want a hand sampling candidates.
