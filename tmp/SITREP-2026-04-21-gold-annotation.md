# SITREP — Resolver Gold-Set Annotation (Phase 4)
**Date:** 2026-04-21
**Branch:** `writing-pipeline-v2`
**Working sandbox:** `/home/dalton/projects/claudeflow-testing/tmp/analysis-upgrade/production-sandbox`
**Sandbox commit context (from README):** `1268adbcf` (writing-pipeline-v3, R1.3-baseline-post-3b)

---

## 1. Session context

Goal: build the 50-item **dev** + 20-item **holdout** human-labeled `{claim → ontology_node(s)}` gold set that the Phase 5 E0-E8 resolver harness measures F1 against. Without it, E0 baseline is not measurable.

## 2. What we did this session

1. **Started services** — `vLLM` (Qwen2.5-Coder-32B-AWQ, port 8002) + `embedding` (port 8000). vLLM required two fixes:
   - `export VLLM_HOST_IP=127.0.0.1` (WSL2 + Tailscale `100.64.100.6` interface caused PyTorch TCPStore to hang for 600 s)
   - `--gpu-memory-utilization 0.92 --max-model-len 8192` (KV cache needed more headroom once embedding was also resident on GPU)
   - Final working command is in `/home/dalton/.god-agent/logs/vllm.log`
   - Memory/daemon/ucm/observe were already running from startup hook

2. **Opened** `data/gold/candidates/dev-primary_aristotle.sample.jsonl` — **45** pre-sampled Aristotle *De Anima* 3.3 claims, each with `faithfulness`, `use_mention`, `claim_type`, `key_concepts` metadata. `expected_ontology_nodes` and `rationale` fields are null (ready for annotation).

3. **Sanity-checked ontology**:
   - `compiled-index.v2.json` → **7389** ontology nodes
   - Full sorted name list dumped to `tmp/analysis-upgrade/production-sandbox/ontology-names.txt` (120 KB)
   - Vocabulary mixes English concept names (`Imagination`, `Soul`, `Intellect`), Greek/transliteration (`phantasia`, `aisthesis`, `doxa`, `nous`, `hupolepsis`, `episteme`, `koina`, `idia`, `pistis`), proper names, and Bekker citations (some latter entries look noisy)

4. **Drafted the first annotation batch (claims 1-10 of the Aristotle dev candidates)** with proposed `expected_ontology_nodes` + 1-sentence `rationale`. Draft is in the conversation transcript — NOT yet written to disk. Flagged three nodes not yet confirmed in vocab: `predecessors` (#4), `separability`/`choristos` (#9), `contraries`/`contrariety` (#10).

## 3. Where we are now

- **Annotation output file (target):** `data/gold/resolver-gold-dev.jsonl` — does not yet exist; template is at `data/gold/resolver-gold-dev.jsonl.template`
- **Holdout target:** `data/gold/resolver-gold-holdout.jsonl` — does not yet exist; template at `.template`
- **Items labeled so far:** 0 (drafted-in-chat only)
- **Next concrete action when resuming:** review/edit the 10-item draft above, then I write the first 10 rows into `resolver-gold-dev.jsonl`

## 4. Paths reference — everything needed to resume

### Ontology (label vocabulary)
| Path | Purpose |
|------|---------|
| `data/corpus/index/compiled-index.v2.json` | **Authoritative** ontology source (7389 nodes; has `name`, `greek`, `transliteration`, `definition`, `aliases` per node) |
| `data/corpus/index/compiled-index.json` | Older version — do not use for labeling |
| `data/corpus/index/compiled-index.pre-hydrate.json` | Pre-hydrate snapshot |
| `ontology-names.txt` | Plain sorted name list (7389 lines) — quick reference for label-picking |

### Candidate claims (items to annotate)
| Path | Count | Genre | Target dev/holdout |
|------|-------|-------|--------------------|
| `data/gold/candidates/dev-primary_aristotle.sample.jsonl` | 45 | primary_aristotle | pick **15** for dev |
| `data/gold/candidates/dev-primary_heidegger.sample.jsonl` | 30 | primary_heidegger | pick **10** for dev |
| `data/gold/candidates/dev-secondary_phantasia.sample.jsonl` | 45 | secondary_phantasia | pick **15** for dev |
| `data/gold/candidates/dev-secondary_non_phantasia.sample.jsonl` | 30 | secondary_non_phantasia | pick **10** for dev |
| `data/gold/candidates/holdout-primary_aristotle.sample.jsonl` | 18 | primary_aristotle | pick **6** for holdout |
| `data/gold/candidates/holdout-primary_heidegger.sample.jsonl` | 12 | primary_heidegger | pick **4** for holdout |
| `data/gold/candidates/holdout-secondary_phantasia.sample.jsonl` | 15 | secondary_phantasia | pick **5** for holdout |
| `data/gold/candidates/holdout-secondary_modern_philosophy.sample.jsonl` | 15 | secondary_modern_philosophy | pick **5** for holdout |

### Output files (create/populate these)
| Path | Status |
|------|--------|
| `data/gold/resolver-gold-dev.jsonl` | **TO CREATE** (50 items total, from dev candidates) |
| `data/gold/resolver-gold-holdout.jsonl` | **TO CREATE AFTER DEV** (20 items, then LOCK) |
| `data/gold/resolver-gold-dev.jsonl.template` | delete when dev is populated |
| `data/gold/resolver-gold-holdout.jsonl.template` | delete when holdout is populated |

### Protocol / spec
| Path | Purpose |
|------|---------|
| `data/gold/README.md` | **Authoring protocol (§2 schema, §6 workflow, §7 IAA, §8 lock discipline)** — read before resuming |
| `PHASE-2-STATUS.md` | Earlier phase status |
| `PHASE-3A-CANARY-REPORT.md` | Canary report |

## 5. Item schema reminder (from `data/gold/README.md` §2)

```json
{
  "claim_id": "claim-aristotle-da-3.3-037",
  "claim_text": "...",
  "expected_ontology_nodes": ["phantasia", "aisthesis", "Imagination"],
  "rationale": "One sentence another annotator can verify.",
  "source": {"author": "Aristotle", "year": "c. 350 BCE", "slug": "aristotle-da-3.3"},
  "genre": "primary_aristotle",
  "notes": ""
}
```

- `expected_ontology_nodes: []` is a legitimate label — flags E4 modern-node curation need
- Node names must match `ontologyNodes[].name` exactly (case-sensitive)
- Batch in 10-15 item sessions; focus slips after ~15

## 6. Distribution targets

**Dev (50 total):** 15 primary_aristotle + 10 primary_heidegger + 15 secondary_phantasia + 10 secondary_non_phantasia
**Holdout (20 total):** 6 primary_aristotle + 4 primary_heidegger + 5 secondary_phantasia + 5 secondary_modern_philosophy

## 7. What's left

- [ ] Finalize 10-item draft for `primary_aristotle` (review + emit JSONL)
- [ ] Pick + annotate remaining **5** Aristotle dev items (of the 45 candidates)
- [ ] Annotate **10** Heidegger dev items
- [ ] Annotate **15** secondary_phantasia dev items
- [ ] Annotate **10** secondary_non_phantasia dev items (watch for empty-node cases → E4 flags)
- [ ] Dev consistency spot-check (re-review 15 random items after break; if ≥3 changes → second pass)
- [ ] Save as `resolver-gold-dev.jsonl`, delete `.template`
- [ ] Annotate holdout (6+4+5+5 = 20 items) using dev-locked protocol
- [ ] Save as `resolver-gold-holdout.jsonl`, delete `.template`
- [ ] Record holdout mtime in `ARTIFACT-MANIFEST.json`
- [ ] Phase 5 E0 baseline run → holdout locked

## 8. Service restart cheatsheet (for next session)

```bash
# Status
./scripts/god-launch status

# If vLLM is down (most likely):
tmux send-keys -t god-agent:vllm "export VLLM_HOST_IP=127.0.0.1 && vllm serve Qwen/Qwen2.5-Coder-32B-Instruct-AWQ --port 8002 --quantization awq --enforce-eager --gpu-memory-utilization 0.92 --max-model-len 8192 --enable-auto-tool-choice --tool-call-parser hermes 2>&1 | tee /home/dalton/.god-agent/logs/vllm.log" Enter

# If embedding is down:
./scripts/god-launch restart embedding

# Verify:
curl -sf http://localhost:8002/v1/models | jq .data[0].id
curl -sf http://localhost:8000/
```

## 9. Resume prompt (paste to Claude Code on next session)

> Read `tmp/SITREP-2026-04-21-gold-annotation.md`. We were annotating the `primary_aristotle` dev set. I had a 10-item draft in the last transcript — please re-read `data/gold/candidates/dev-primary_aristotle.sample.jsonl` lines 1-10 and re-produce the annotation draft so we can review it, then write it to `data/gold/resolver-gold-dev.jsonl`.

---

**Open questions to resolve on resume:**
1. Confirm or correct proposed nodes for claim #4 (`predecessors`), #9 (`separability`/`choristos`), #10 (`contraries`/`contrariety`) — grep `ontology-names.txt` first
2. Should the ontology noise (Bekker citations like `427b20`, year stubs like `2017`) be filtered out of the label vocab before annotation, or kept in?
