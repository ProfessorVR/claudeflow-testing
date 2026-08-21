# Analysis-Upgrade System — Pre-Promotion Gap Review

**Date:** 2026-04-19
**Scope:** All of `tmp/analysis-upgrade/` (original sandbox + claim-extractor-upgrade + integration-sandbox) reviewed against the LIVE TypeScript/Python production system.
**Purpose:** Identify everything that must be created, upgraded, or validated BEFORE we start modifying the live corpus/index/ or live TypeScript.

---

## TL;DR — what we found

**25 gaps total** — 7 blockers, 10 high-priority, 8 deferrable.

The biggest surprise: our sandbox pipeline (extract → resolve → bridge → recompile) is **Python + JSONL sidecars**, but the live writing system is **TypeScript consuming one monolithic `compiled-index.json`**. The live compile script (`scripts/compile-corpus-index.py`, 1329 lines) has hardcoded the 4-key schema (`ontologyNodes`, `crossPipelineHooks`, `tensionEdges`, `canonicalTerms`) and does NOT know how to read per-paper claim/mention/bridge sidecars. Five TypeScript files (8 consumer call-sites) have `CompiledIndex` interfaces that don't know about the new fields. **None of the new pipeline output can reach the writing prompts without live-code changes.**

The second surprise: most of the downstream value the original plan promised — "concept-aware retrieval with `0.7·cos + 0.3·conceptOverlap`" (Phase 4), "mandatory bridge injection at cap 3" (Phase 6), "Active Claims block in writing prompts" — was **not implemented in either the original sandbox or the claim-extractor-upgrade sandbox**. We built the data producer. We did not build the consumer.

---

## BLOCKERS (must be done before promotion)

### B1. Live `compile-corpus-index.py` has no knowledge of claims/mentions/bridges
- **File:** `scripts/compile-corpus-index.py:1293` outputs only 4 keys.
- **What's missing:** reader for `corpus/index/<paper>/claims.jsonl`, `concept-mentions.jsonl`, `bridge-candidates.jsonl`; bridge-promotion logic; faithfulness filter; novel-ontology promotion.
- **Good news:** the sandbox `integration-sandbox/scripts/recompile_index.py` is the replacement. It needs to be merged into the live compiler (or the live compiler should delegate to it).
- **Effort:** medium (~200 LOC). The logic is already written; it's a port + merge.
- **Risk if skipped:** Impossible to promote; nothing from the sandbox reaches writing prompts.

### B2. TypeScript `CompiledIndex` interfaces don't have the new fields
- **Files:**
  - `src/god-agent/universal/corpus-index-provider.ts:52-58`
  - `src/god-agent/shared/cross-author-utils.ts:47-51`
- **What's missing:** `claims`, `conceptMentions`, `bridgeCandidates` as optional array fields; `speaker`, `stance`, `use_mention`, `faithfulness`, `claim_type` as optional fields on `CrossPipelineHook`; a `Claim` interface; a `ConceptMention` interface.
- **Effort:** small (~30 LOC of types, no logic).
- **Risk if skipped:** TypeScript compilation breaks OR downstream code silently reads `undefined`.

### B3. No `loadActiveClaims(topic)` — the main write-path hook for the whole upgrade
- **File to edit:** `src/god-agent/universal/corpus-index-provider.ts`
- **What's missing:** function that returns top-K claims for a topic, filterable by `speaker`, `stance`, `use_mention`, `faithfulness`, `claim_type`. This is the primary mechanism by which secondary-lit content enters writing prompts.
- **Effort:** small (~60 LOC, analogous to `loadCorpusIndexContext`).
- **Risk if skipped:** Claims never reach writing prompts. The entire claim-extraction work sits on disk unused.

### B4. No prompt-injection block for claims
- **File to edit:** `src/god-agent/universal/write-pipeline-orchestrator.ts`
- **What's missing:** a new `## Active Claims (from secondary lit)` prompt block, wired at the same 6+ injection points where `crossPipelineHooks` currently appear. Must include proper use-mention framing ("Nussbaum reports that Aristotle says…" vs "Nussbaum argues…").
- **Effort:** medium (~100 LOC, carefully placed).
- **Risk if skipped:** Same as B3 — claims have nowhere to go.

### B5. Live `corpus/index/` has no `ontology-embeddings.jsonl`
- **Status:** Sandbox has it (278 × 1536-D, built on 2026-04-18). Live doesn't.
- **What's missing:** one-time embedding run (already scripted: `sandbox/scripts/embed_ontology.py`). Then a TypeScript loader so retrieval can use concept cosine.
- **Effort:** small (copy file + add loader + 1-line cache).
- **Risk if skipped:** Concept-aware retrieval (Phase 4 of the original plan) remains impossible. We also cannot regenerate bridges against the live index later.

### B6. Live extractors for primary texts don't exist as committed code
- **Status:** Extractors live in `tmp/analysis-upgrade/claim-extractor-upgrade/sandbox/scripts/`. They need to be promoted to `scripts/analyze-claims/` (or similar) so they can be re-run on demand and versioned.
- **What's missing:** move Python scripts + prompts out of `tmp/` into the tracked codebase; add shell wrappers `analyze-primary.sh` / `analyze-secondary.sh`; pin API model IDs and prompt versions in metadata.
- **Effort:** small (file move + 2 shell wrappers + README).
- **Risk if skipped:** Scripts get deleted with tmp cleanup; can't reproduce extractions; no CI/CD can run them.

### B7. Taxonomy edge cases flagged during gold audit (32 items) not fixed in prompts
- **Files:** `tmp/analysis-upgrade/claim-extractor-upgrade/sandbox/gold/*-flagged.jsonl`
- **Issues surfaced:**
  - `exegetical_claim` incorrectly applied to primary texts (should remove from primary taxonomy OR clarify it applies only to Aristotle-interpreting-predecessors).
  - Aporetic question-form not detected (DA-003).
  - `predecessor_report` vs `dialectical_objection` boundary ambiguous for "common opinion" / "the ancients".
  - Reductio-style positive assertion inside refutation context mis-tagged `dialectical_refutation` instead of `thetic`.
  - Terminology-borrowing (Aristotle uses Anaxagoras' word "dominate") mis-tagged `mention`.
- **Effort:** small (~2 hours prompt tweaks + re-validate on 1-2 passages).
- **Risk if skipped:** Batch extraction on 30 PDFs inherits these 10%+ error rates; corrections required post-hoc.

---

## HIGH-PRIORITY (should do for a clean promotion)

### H1. Cap increases in `getActiveBridges` and `getActiveTensions`
- **File:** `src/god-agent/shared/cross-author-utils.ts:498` and `:542`
- **Plan said:** bridges cap 1→3, tensions cap 3→5.
- **Effort:** tiny (2 constants).
- **Why:** The whole point of having 317 hooks is to surface more than 1 per facet. Without this, the bridge-generation work is wasted.

### H2. Concept-aware retrieval — hybrid scoring `0.7·cos + 0.3·conceptOverlap`
- **File to edit:** `src/god-agent/retrieval/smart-retrieval-layer.ts`
- **What's missing:** (a) chunk-level concept tagging (each ChromaDB chunk gets a `concept_hits: string[]` metadata field), (b) query-time concept resolution using ontology-embeddings, (c) rescoring chunks by Jaccard overlap against query concepts.
- **Effort:** large (chunk tagging requires re-ingestion OR upsert, retrieval rescoring is ~100 LOC).
- **Why:** Phase 4 of the original plan. The measured god-write gain from phases 1-3 alone was only +0.006 quality. The big retrieval improvement was always expected to come from this phase.
- **Workaround:** defer until after initial promotion; measure god-write impact with basic claim injection first; add this only if gains are insufficient.

### H3. Centrality recalibration
- **File to create:** `scripts/compute-centrality.py`
- **What's missing:** currently every novel ontology node is tagged `centralityTier: peripheral`. With cross-paper data, centrality should be: `core` if appears in ≥5 papers, `important` if ≥2, `peripheral` otherwise; weighted by authority-tier of the papers.
- **Effort:** small (~60 LOC, runs once at compile time).
- **Why:** Controls which ontology terms get surfaced first in `loadCorpusIndexContext`. Without this, important cross-cutting concepts like "phantasia" (which should be `core`) get drowned out by peripheral Caston-only terms.

### H4. Cross-paper bridge deduplication + contradiction detection
- **What's missing:** if both Caston and Nussbaum generate a bridge for `phantasia → Erschlossenheit`, we should merge into one bridge with two supporting papers, OR flag as contested if one says "alignment" and the other says "contestation."
- **Effort:** medium (~80 LOC, runs in `recompile_index.py`).
- **Why:** Without this, we'll have 5-10x duplicate bridges once all 30 PDFs are processed. Writing prompts get bloated. Harder to surface genuine disagreements.

### H5. Promotion script with rollback
- **File to create:** `scripts/promote-analysis-upgrade.sh`
- **What's missing:**
  - Pre-flight: run typecheck + unit tests.
  - Snapshot current `corpus/index/compiled-index.json` into `.backups/`.
  - Copy sandbox ontology embeddings + paper dirs into live.
  - Run updated compile.
  - Run smoke test (fixed prompt; assert claims appear in output; assert no typecheck regression).
  - On failure, auto-rollback and alert.
- **Effort:** small (~50 lines of bash + a smoke-test TS).
- **Why:** Without this, manual promotion risks partial state, and rollback requires manual restoration from `.backups/pre-analysis-upgrade-*`.

### H6. Batch processor for the 30 remaining secondary-lit PDFs
- **File to create:** `scripts/batch-analyze-corpus.py`
- **What's missing:** loop over unprocessed PDFs, parallelize with rate limiting (Anthropic 1000 RPM tier), checkpoint per-paper, auto-retry on failure, generate cost/time report.
- **Effort:** medium (~150 LOC). The existing `analyze.py` is single-paper; this wraps it.
- **Why:** Manual per-paper runs = 30 command invocations + human vigilance on failures. At $0.45/paper, whole batch costs ~$15 and takes ~2.5 hours wall time.

### H7. Manifest / processing bookkeeping
- **File to create:** `corpus/index/claim-extraction-manifest.jsonl`
- **What's missing:** per-paper record: `{slug, pdf_path, processed_at, extractor_version, model_id, first_page, last_page, claim_count, mention_count, bridge_count, gold_audited, flagged_count}`.
- **Effort:** tiny (5 LOC in `analyze.py`).
- **Why:** Without this, we can't answer "have we processed this PDF yet?" or "which papers need re-extraction after a prompt update?"

### H8. Claim-to-chunk linkage
- **Gap referenced in:** baseline report G7 ("concept nodes don't link to chunk IDs").
- **What's missing:** for each extracted claim, we have PDF-page char offsets. We don't have the ChromaDB chunk_id that contains it. Mapping requires running claim text through the ingestion chunker or doing a post-hoc embedding lookup in the chunks collection.
- **Effort:** medium (~100 LOC; embedding lookup against ChromaDB collections).
- **Why:** Unlocks retrieval jumps: "I cited claim-nussbaum-042 → let me pull the full paragraph from ChromaDB." Without this, provenance ends at the claim; god-write can't expand.

### H9. Old hand-curated hooks need new fields backfilled (or gracefully tolerated)
- **Files:** 72 hooks in `corpus/index/compiled-index.json` have no `speaker`, `stance`, `faithfulness` fields.
- **Two options:**
  - (a) Run an LLM pass to auto-label existing hooks with `speaker` (the source author), `stance: reports_neutral`, `faithfulness: unchecked`.
  - (b) Make all new fields optional in TS types; downstream code treats missing fields as neutral defaults.
- **Effort:** small either way. (b) is cheaper if we're fine with mixed-confidence hooks.
- **Why:** Mixing old + new hook schemas in the same array needs handling.

### H10. Regression validation harness
- **What's missing:** the original plan Phase 7 called for measuring 6 metrics (chunk-source diversity, ontology-hit count, bridge activation count, citation density, secondary-lit citation count, new-claim integration) before/after. We ran this ad hoc during the original sandbox but never automated.
- **Effort:** medium (~200 LOC; uses existing god-write CLI).
- **Why:** Without it, you can't catch the case where bridge generation DROPS quality on an untested prompt type.

---

## DEFERRABLE (can be v2 after promotion works)

### D1. Multi-author concept constellations (baseline G2)
- Not pairwise bridges but clusters: `phantasia ⟷ Erschlossenheit ⟷ Merkbild ⟷ ambient-rhetoric`.
- Requires new data structure in compiled-index + UI/TS loader. Known-valuable but significant.

### D2. Modern-philosophy ontology enrichment
- Caston/Chalmers/Kim use terms (intentionality, supervenience, emergence) absent from classical ontology. Threshold of 0.55 excludes them. Fix: generate a secondary ontology or enrich with a secondary-lit analysis pass. For now, ~1 mention/claim for Caston is the measured impact — tolerable.

### D3. Claim-level deduplication across papers
- "Caston says DA 432b15 → X" + "Nussbaum says DA 432b15 → X" → should cluster with "also cited by" list. Requires semantic dedup over claims. Effort: medium.

### D4. Greek / transliteration normalization
- Ontology stores both `φαντασία` and `phantasia`; our `key_concepts` may be either. Bi-encoder already handles it OK (our tests show 97.6% Bekker linkage on DA).

### D5. OCR cache integration
- Current extractor uses PyMuPDF at extraction time. Repo's ingestion pipeline produces cached OCR output with bboxes. Could save ~3s/paper by reading cache. Optimization, not correctness.

### D6. God-write prompt-aware claim filtering
- When a prompt is about "phantasia and action," we'd want claims where both those concepts appear. Currently `loadActiveClaims` would do topic-term matching; semantic match would be better. Small add-on.

### D7. Interactive concept-neighborhood explorer
- Baseline G14. Not required; nice for dissertation-writing UX.

### D8. Feedback loop from god-write quality-gauntlet to the index
- Baseline G12. When quality gauntlet rejects a passage for missing a tension, that tension should be boosted in the index. Requires persistent feedback store.

---

## Specific files that need editing (summary for the implementation session)

| File | Change | Size |
|---|---|---|
| `scripts/compile-corpus-index.py` | Extend with recompile_index.py logic; aggregate per-paper dirs; filter by faithfulness | medium |
| `src/god-agent/universal/corpus-index-provider.ts` | Add `Claim` + `ConceptMention` types; add `loadActiveClaims(topic)` | small |
| `src/god-agent/shared/cross-author-utils.ts` | Raise `getActiveBridges` cap 1→3; raise `getActiveTensions` cap 3→5; add optional new fields to `CrossPipelineHook` | tiny |
| `src/god-agent/universal/write-pipeline-orchestrator.ts` | Add `## Active Claims` prompt block at 6+ injection points | medium |
| `src/god-agent/retrieval/smart-retrieval-layer.ts` | (H2, optional v1) Hybrid score with concept overlap | large |
| `scripts/analyze-claims/` (new dir) | Move extractor + prompts from tmp/ into tracked code | small |
| `scripts/analyze-primary.sh` + `analyze-secondary.sh` (new) | Shell wrappers for single-paper extraction | tiny |
| `scripts/batch-analyze-corpus.py` (new) | Batch processor with rate limit / resume | medium |
| `scripts/promote-analysis-upgrade.sh` (new) | Snapshot + copy + compile + smoke-test + rollback | small |
| `scripts/compute-centrality.py` (new) | Frequency-based centrality recomputation | small |
| `tests/promotion-smoke-test.ts` (new) | Regression validation harness | medium |
| `corpus/index/claim-extraction-manifest.jsonl` (new) | Per-paper processing bookkeeping | trivial |

---

## Recommended order of operations

1. **Fix B7 (prompt taxonomy edge cases)** — 2 hours. Re-validate on existing DA/BCAP/Caston.
2. **Port compile-corpus-index.py → B1** — 1 hour. Keep old 4-key output intact for backward compat; add new fields.
3. **B2 + B3 + H9 + H1** (TypeScript types + loader + cap change) — 2 hours.
4. **B4 (prompt injection block)** — 1 hour.
5. **H3 (centrality) + H4 (bridge dedup)** — 2 hours.
6. **B5 (ontology embeddings to live) + B6 (extractor to tracked code) + H7 (manifest)** — 1 hour.
7. **H5 (promotion script) + H10 (smoke test)** — 2 hours.
8. **Dry-run promotion on a scratch branch + rollback test** — 1 hour.
9. **H6 (batch processor) + batch-run 30 PDFs** — 3 hours wall, ~$15.
10. **Real promotion with smoke-test validation.**

Total pre-batch work: ~10 hours of implementation + validation. Then 1 overnight batch run. Then promote.

---

## The one thing that surprised me most

The original Nussbaum sandbox (2026-04-18 phase 1-5) and the claim-extractor-upgrade sandbox (2026-04-18 to 2026-04-19) **both focused on producing data**. Neither of them built the consumer. The god-write A/B test from the 04-final-summary used the existing `getActiveBridges` + `loadCorpusIndexContext` — same caps, same logic. The +0.022 quality gain came entirely from the first 4 bridges LLM-judged during Nussbaum extraction, activated through the OLD consumer path.

Which means: **we have not yet measured what the full upgrade delivers.** The quality gain measurement so far was from a partial consumer still using cap=1 bridges and no claim injection. Phase 6 (prompt injection of `## Active Claims`) has never been tested.

That's either very good news (there's more quality improvement waiting once we wire it up) or a risk (maybe prompt injection of claims doesn't help as much as expected and we need H2 anyway). We won't know until B4 + H5 are done and a full A/B runs against the live writing pipeline.

---

## Bottom line

Before promotion to live, we must finish **7 blockers**. Before the promotion is *clean and measurable*, we should finish **10 high-priority items**. Both batches are under 15 hours of implementation. The deferrable 8 items are real but not required for the first promotion.

The pipeline is ready. The consumer side is not.
