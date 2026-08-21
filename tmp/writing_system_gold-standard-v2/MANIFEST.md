# Writing System Gold Standard v2 — Backup Manifest

**Date:** 2026-03-07
**Branch:** god-agent-v2-pr
**Status:** All tests passing, pipeline verified across 5 runs

## Architecture

Multi-step drafting pipeline: **v1 (no style) → investigateV1() → prevention plan → v2 (styled + constraints)**

### Pipeline Flow
1. `.env` loaded → valid API key
2. Primary author extraction from prompt
3. Multi-query corpus retrieval (SmartRetrievalLayer → ChromaDB)
4. Targeted retrieval for primary authors + diversity enforcement
5. **v1 generation** (Opus, no style profile — diagnostic draft)
6. Quality gauntlet scoring on v1
7. **investigateV1()** — local string analysis detecting:
   - Hallucinated citations (author not in manifest)
   - Phantom quotations (not verbatim from chunks)
   - Factual claims without citation (major) vs interpretive (exempt)
   - Source balance (over-cited / under-cited)
   - Short sections (<350 words)
8. Prevention plan built (blacklist, strengthened constraints)
9. Supplemental retrieval for under-cited sources
10. Per-section constraints derived from prompt structure
11. **v2 generation** (Opus, full style profile + prevention plan + section constraints)
12. Post-generation heading structure fix
13. Prose sanitization → citation enforcement → author scrubbing
14. V2 diagnostics (blacklist check scoped to main text only)

## Key Improvements (this version)

| # | Priority | Improvement |
|---|----------|-------------|
| 1 | P0 | Structural heading enforcement — standalone `## N. Title` + post-gen regex fix |
| 2 | P0 | Quotation safe-path with correct/incorrect examples — eliminated quotation anxiety |
| 3 | P0 | Validation Appendix compression — ~20 lines → ~5 lines schema-style |
| 4 | P1 | Blacklist check scoped to main text — splits at `# VALIDATION APPENDIX` |
| 5 | P1 | Claims-without-citation factual/interpretive split with attributive phrase detection |
| 6 | P2 | Conclusion citation relaxation (≥200 words, citations optional) |
| 7 | — | Primary-text priority rule — prefer close reading over secondary-source summaries |
| 8 | — | Phantasia section depth constraints (grades, belief, voluntariness) |
| 9 | — | Heidegger link-back constraints (tie back to each earlier subsection) |

## Run Results

| Metric | Run 2 | Run 3 | Run 4 | Run 5 |
|--------|:-----:|:-----:|:-----:|:-----:|
| Quality Score | 68.6% | 78.0% | 68.8% | 77.2% |
| Citations | 24 | 24 | 23 | 19 |
| Quotations | 0 | 24 | 21 | 25 |
| Hallucinated | 0 | 0 | 0 | 0 |
| Pass Rate | 100% | 100% | 100% | 100% |
| Unique Authors | 9 | 11 | 7 | 6 |
| Primary cit % | ? | ? | ? | 47% |
| Phantasia depth | — | — | — | 6/6 |
| Heidegger links | — | — | — | 7/10 |

## Files

### Source (24 files)
- `write-pipeline-orchestrator.ts` — Core pipeline (~3050 lines)
- `universal-agent.ts` — Agent interface, WriteResult type
- `cli.ts` — CLI flag parsing, JSON output mapping
- `smart-retrieval-layer.ts` — Multi-query retrieval with L2→cosine fix
- `icp-orchestrator.ts` — ICP composition pipeline
- `model-router.ts` — LLM routing (Anthropic vs vLLM)
- `constrained-generator.ts` — Constrained paragraph generation
- `corpus-constraint-builder.ts` — Whitelist constraint builder
- `inline-validation-orchestrator.ts` — Paragraph-level validation
- + 15 more composition/validation/observability files

### Tests (5 files)
- `investigate-v1.test.ts` — 7 tests for investigateV1() (all passing)
- `smart-retrieval-layer.test.ts` — Retrieval tests
- `prompt-builder-engine.test.ts` — Prompt builder tests
- `constrained-generator.test.ts` — Generator tests
- `model-router.test.ts` — Router tests

### Runs
- `runs/msd-dissertation-strict/` — All run outputs (JSON + stderr + extracted markdown)

### Config
- `manifest.jsonl` — Corpus source manifest
- `style-profiles.json` — Trained style profile (dalton-academic-mkn82c3v)

### Memory
- `MEMORY.md` — Persistent memory with all fix documentation (Fix 9–50+)

## Critical Fix Index

See MEMORY.md for the full fix list. Key fixes for this version:
- Fix 9: .env loader in CLI
- Fix 22: `??` nullish coalescing in citation-validator
- Fix 25: Post-enforcement author scrubbing
- Fix 29: Hybrid search empty keyword fallback
- Fix 30: 120s timeout for academic decomposition
- Fix 45: minRelevance 0.0 in corpus constraint
- Fix 46: Full manifest for author scrubber allowedAuthors
- Fix 50: Quality gauntlet revision disabled (stages return 0.5 default)
