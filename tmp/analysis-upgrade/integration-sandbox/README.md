# Integration Sandbox

**Purpose:** End-to-end sandbox integrating the v1 claim extractors (from `../claim-extractor-upgrade/`) with the analysis-upgrade pipeline (concept resolution, bridge generation, index recompilation). Sandbox only — nothing in `corpus/` or live code is touched.

## Layout

```
integration-sandbox/
├── README.md
├── scripts/
│   ├── analyze.py                # end-to-end orchestrator (extract → resolve → bridge → recompile)
│   ├── resolve_concepts.py       # new-schema compatible
│   ├── generate_bridges.py       # new-schema compatible (speaker/stance tagged)
│   ├── recompile_index.py        # aggregates all paper dirs, faithfulness filter
│   └── extractor/                # copy of claim-extractor-upgrade v1
│       ├── extractor.py
│       ├── pdf_utils.py
│       ├── fuzzy_match.py
│       ├── summarize.py
│       └── prompts/
├── corpus/
│   └── index/
│       ├── compiled-index.json          # starting snapshot (copied from analysis-upgrade sandbox)
│       ├── ontology-embeddings.jsonl    # 278 × 1536-D GTE-Qwen embeddings
│       └── <paper-slug>/                # one per paper, created by analyze.py
│           ├── <slug>-claims.jsonl
│           ├── <slug>-concept-mentions.jsonl
│           └── <slug>-bridge-candidates.jsonl
├── output/                       # intermediate artifacts
└── tests/
    └── run_e2e.sh               # exercises all papers end-to-end
```

## Usage

```bash
# Single paper end-to-end
python3 scripts/analyze.py \
    --pdf "/path/to/paper.pdf" \
    --genre secondary \
    --author "Caston, Victor" \
    --title "Why Aristotle Needs Imagination" \
    --year 1995 \
    --slug caston-1995 \
    --first-page 2 --last-page 7

# Or run the e2e test (processes 4 papers)
bash tests/run_e2e.sh
```

## Key differences from analysis-upgrade sandbox

| Aspect | Old (analysis-upgrade) | New (integration-sandbox) |
|---|---|---|
| Extractor | Nussbaum-only, single-prompt | Genre-parameterized (primary/secondary), 6 stages with verify |
| Speaker tracking | `author_position` field only | `speaker` + `stance` + `use_mention` fields |
| Grounding | Bekker-string only | Verbatim quote + fuzzy-match to source + LLM faithfulness judge |
| Filtering | None | Drops `faithfulness=unsupported`, down-ranks `use_mention=mention` for bridges |
| Taxonomy | 1 type (claim) | 10 primary types / 7 secondary types |
| Bridge tagging | relation + confidence only | relation + confidence + stance + speaker + faithfulness |
| Orchestration | Manual per-step CLI | `analyze.py` single-command end-to-end |

## Dependencies

- Python 3.11 with `anthropic`, `pymupdf`.
- `ANTHROPIC_API_KEY` in repo `.env` (same as claim-extractor-upgrade).
- Embedding service at `http://localhost:8000/embed` (GTE-Qwen, provided by god-launch).

## Environment variables

- `ANTHROPIC_API_KEY` — required.
- `EMBED_URL` — default `http://localhost:8000/embed`; override for alternate embedder.

## Costs (estimated per paper)

| Stage | Avg cost | Notes |
|---|---|---|
| Extract | $0.30 | varies with chunk count |
| Resolve | $0.00 | local embedding service |
| Bridge | $0.15 | ~24 LLM calls (8 concepts × 3 hooks) |
| **Total** | **$0.45** | per paper end-to-end |

Full corpus (~33 PDFs) ≈ $15.
