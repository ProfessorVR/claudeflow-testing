# Showcase: the new ingestion + index system, by the numbers
**As of 2026-07-30** (before = the incumbent system / first archon probes, 2026-07-29)

## Addressability — the headline transformation

| Metric | Before | After |
|---|---|---|
| Claim-shaped records addressable at runtime | ~2.3% (gold-standard entry, incumbent compiler) | **100% of imported records queryable in the store** (32,186 rows) |
| Character/byte spans in index files | **0** across 1,758 files | **3,181 clauses with exact byte-span anchors** (chunk + UTF-8 byte range + page + locator) |
| Machine-verified quote anchoring | none (quotes lived as prose) | **85.7% of 4,872 clauses** (65.3% exact @ sim 1.0 + 20.4% near-verbatim ≥0.9), each verdict recorded with document, page, and similarity |
| Bekker-line addressing (Aristotle) | absent from runtime | exact anchors carry `Bekker:427a1`-class locators (352 preserved on the Rhetorica alone) |
| Sentence-level granularity | did not exist | **420,926 sentences** across 227 docs, byte-spanned + sha-verified, **95.6% with tight bboxes**, 99.4% with page |

## Extraction quality — the A/B and stress cases (single bare `docs ingest`, zero flags)

| Document | Before | After |
|---|---|---|
| King & Salvo (born-digital) | 49 ligature corruptions; key quote NOT FOUND | **0 corruptions; same quote EXACT @ 1.000, page 8, bbox, byte-addressed** |
| Aristotle *Rhetorica* (Kassel, 279-pp Greek scan) | 2,006 junk chunks; 5.9% spatial | **120 clean chunks; 100% spatial; 5,633 sentences all bbox'd; 261 page-scans auto-detected, enrichment auto-skipped** |
| White 1985 (copier scan + OCR layer) | 10% spatial; 38% sentence-bbox; 71 footnote blocks silently lost; 105 duplicate chunks | **100% spatial; 100% sentence-bbox; footnotes captured; 16 clean chunks; its 280 unanchorable clauses flipped to exact/near-verbatim** |
| Corpus ligature damage | 6 documents citation-fatally corrupted (invisible to every existing check) | root cause fixed at source (pypdfium2); admissibility gate makes recurrence an ingest FAILURE, not a silent pass |

## What now runs automatically on EVERY ingest (was: nothing)

1. Sentence layer built inline — a document cannot read "Ingested" without it
2. OCR quality scoring (Greek-aware) + second-engine arbitration on low-quality success; engine + score recorded per image and per page; bad pages flagged `suspect`
3. Admissibility gate: ligature markers / degenerate extraction / missing sentences ⇒ document **Failed**, never silently admitted
4. Scan-vs-figure classification (3-detector union incl. the margin-cropped and bi-level-codec classes) — scanned books skip wasteful VLM enrichment automatically
5. Footnote + apparatus text captured (was silently discarded)

## Honesty of the record (the incumbent's failure modes, now impossible)

| Incumbent failure (audited) | Now |
|---|---|
| 76% of manifest rows said "ok" with zero vectors written | status and embeddings are decoupled; regression-tested (B-50) |
| Failed store writes reported as success | batched writes hard-fail (B-42, tested) |
| 64KB-prefix change detection (misses any later edit) | full-content hashing (B-44, tested) |
| bboxes attached by list position (wrong on any drift) | keyed by (chunk, block) (B-45, tested) |
| moved file = silent orphan | content-hash reconciliation (B-47, tested) |
| 119 tensions authored, 64 survived compilation | **119/119 in the store** |
| 5,437 reasoning edges runtime-dead | **all imported and queryable** |

## Speed (same hardware)

| Operation | Before | After |
|---|---|---|
| Sentence rebuild, 223-chunk doc | 130 s | **0.85 s** (150x — batched doc-wide reads) |
| Full-corpus sentence backfill | ~2–3 h projected | **1 m 53 s** (verify-sampled clean) |
| Clause re-anchoring (4,872 quotes) | ~22 h projected (corpus-wide search, 19% timeout rate) | ~1 h doc-scoped at ~0.5 s/clause, 1 residual timeout |
| Kassel 279-pp scan ingest | ~60+ min (CPU-starved) / 20 min wasted VLM | **~13 min GPU, zero waste** |

## Scale of the verified evidence base

- 32,186 index rows: 6,304 claims · 4,872 clauses (incl. 235 dissertation verbatims) · 20,817 edges · 119 tensions · 49 groups · 25 sources
- 227 source documents; 15,900+ chunks; 420,926 addressable sentences
- Every anchor traceable: quote → clause → chunk → byte span → page/bbox → source PDF, with per-stage provenance and tamper-evident hashes
- Quality gates as executable checkers (density bands, loci resolution, quote fidelity) with machine-readable `gates.json`

*Data sources: audit archive (280 agents / 239 verified findings), `corpus-probes.json` E0 vs current, `reanchor-ledger.jsonl`, `06-AB-INGESTION-COMPARISON.md`, session commits `5d70a0e0`…`670c5477`.*
