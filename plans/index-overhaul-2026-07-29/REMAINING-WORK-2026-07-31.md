# Remaining Work — Index/Ingestion Overhaul
**Date:** 2026-07-31 · **State:** F1 + Phase-F extractors + F2 triage tooling + 15/15 gates DONE and committed (archon `d4dc299d` on private; claudeflow local `85e83ac4c`). Store: 8,525 clauses / 35,891 rows; anchors 4,316 exact + 1,773 near-verbatim; core ledger 93.8% verified; 0 ligature docs.
**Companion docs in this folder:** `DRIFT-REVIEW-2026-07-31.md`, `F2-TRIAGE-REPORT-2026-07-31.md`, `HANDOFF-F1-READY-2026-07-30.md`, `SHOWCASE-STATS-2026-07-30.md`.

---

## A. Waiting on YOUR review (deferred 2026-07-31 — no deadline, nothing blocks)

1. **Drift review — 405 quotations** (`DRIFT-REVIEW-2026-07-31.md`; machine file `archon-cli/.archon/corpus-import/drift-review.jsonl`). Decisions per row: ACCEPT-DOC / KEEP-COMPOSITE / RECLASSIFY. Batch rulings accepted ("all Papachristou rows ACCEPT-DOC except…"). Caution baked into the doc: the DOC text can be the wrong passage — glance before accepting. Apply machinery exists (`drift_reauthor.py` patterns): accepted rows re-verify and must return exact.
2. **Paraphrase reclass — 324 rows** (`drift-reclass-paraphrase.jsonl`, sim < 0.75): almost certainly paraphrases mislabeled as quotations. Likely a single bulk approval.
3. **Phase-F not-found tail — 1,596 spans**: mostly the entries' own glosses inside quote marks (not document text). Recommended: I pre-sort by heuristic (attribution-context, locus presence, length) into probable-gloss vs. probable-real-quote before you look — shrinks your reading to the ambiguous middle.
4. **Core not-found remainder — ~89 rows** (Caston-1995 9, Dow 8, Hawhee 6, Frede 6, …): translation-variant / OCR-divergence suspects; per-source inspection alongside the drift session.
5. **Concordance — 8 unbacked assertions** in `Boredom Secondary (Part III)/_synthesis/boredom-construct-measure-concordance.md` (down from the audited 316). File is in the out-of-band repair set — **your repair session writes it**; list is in `check_projection` output.
6. **FCM keystone ruling** (carried from earlier sessions) + **WRAITH physical power-down** (user-side).
7. **test-paper fixture**: sandbox test source with no live doc — remove or formally exempt (one-line decision).

## B. Machine/engineering work (no user input needed; ordered by value)

1. **Thin-entry enrichment targets** (density gate, now real measurements): sandbox:heidegger-bcap-4-5 **0.8**, wendt-design-for-dasein **2.1**, sandbox:aristotle-da-3-3 **2.5**, sandbox:caston-1995 **3.3**, sandbox:nussbaum-1985 **5.9**, sandbox:metzinger-2018 **13.4** records/1,000 words vs. the 15–35 band. These are the F2-regeneration priority list — new claim authoring under the D-gates.
2. **Page-locus enrichment** for dissertation / veridissimilitude / wendt claims (currently line-range loci → section-coverage and distribution gates report NEEDS-DATA). Options: locus back-fill from the anchored clauses, or section inventories in `gates-config.json`.
3. **`corpus_sources.archon_document_id` refresh**: column holds pre-F1 doc ids; every reader must chase `docid-remap.json` (gatelib `live_doc_id` exists). A one-shot column refresh via dump→remap→import removes the trap for future readers.
4. **Phase-F skipped spans**: 208 Greek (BCAP — need Greek-capable verification against the Kassel/Greek docs), 62 synthesis-file spans (need multi-doc attribution), 31 unmapped-article spans (fix the article→doc matching for those dirs).
5. **F1 engineering debt** (from the batch): driver preflight free-VRAM threshold should scale with page count (flat 12 GB let B&T/FCM plan onto CPU); a Marker fallback that zeroes an existing spatial layer should FAIL admissibility or auto-requeue (it passed as "ok"); `docs delete` atomicity; orphan sentence-row sweep; Marker ladder reports only its last rung's error; S8 second-engine escalation for the MARKER path (Kassel rho→eta page detected, not re-OCR'd).
6. **Miyauchi thin entry**: index entry yielded zero extractable quotes (registration-gate orphan). Needs entry enrichment or a documented waiver.
7. **DISS-03-C001**: supported_by cites a prose pointer (referential-integrity gate's one dangling ref) — re-point to a clause.
8. **Near-verbatim upgrades (optional)**: 1,773 near-verbatim anchors could be promoted to exact via the same review-then-re-author flow as drift, lower priority.

## C. Programme-level closure (the plan's F2/F3/G-F)

1. **F2 entry regeneration** under the locked creation system: the 27 entries, each against its per-entry defect checklist from `02-FINDINGS-TRACEABILITY.md`; relational apparatus migrated, never re-derived. The thin-entry list (B.1) sets the order. THE major remaining body of work.
2. **Claim-layer for the Heidegger books**: BCAP/BT/FCM now have clause-level quotes but no claim rows in the store ("245 structured + ~1,100 locus-anchored prose claims" per the draft plan's FCM row — parse + import under gates).
3. **F3 programme acceptance**: measure the §0.2.2 table (density in band, reachability ≥95%, spans ≥90%, quotes 100% exact-gated, narration-proof gates, relational reachability) — every row at target or the programme is not done.
4. **N1/N3/N5 open questions** (`03-OPEN-QUESTIONS.md`) — still unruled.
5. **Off-machine preservation** of end state (Mac `~/claudeflow-preserve/` refresh — needs your permission per standing rule).
6. **Drafting-system upgrade** (`plans/drafting-index-integration-plan-2026-07-30.md`, awaiting your review round): argument-scaffold packs, argument gates, draft→index round-trip, optional local extractor.

## Standing constraints (unchanged)

Private remote only (`ProfessorVR/archon-cli-private`); claudeflow origin is PUBLIC — local commits only. WRAITH retired incl. reranker (accepted loss). Ultracode OFF; no Workflows without per-run permission. Verification-gated commits. `corpus/download` ignored for directory-level ingests. Marker budget 9000 (windowed >82pp) is permanent policy.
