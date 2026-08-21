# Experiment Log

All phase-5 E-step decisions are recorded here. One row per E-step attempt.

Format per entry:

```
### EN — <short label> — <DECISION>

- date: YYYY-MM-DD
- change: single-variable description
- sandbox_sha: <git SHA in worktree>
- artifact_manifest_hash: <sha256>
- canonical_prompt_suite_hash: <sha256>
- metrics:
  - gold_dev_f1_before: X.XXX
  - gold_dev_f1_after:  X.XXX
  - gold_holdout_f1_before: X.XXX  (only at major transitions)
  - gold_holdout_f1_after:  X.XXX
  - godwrite_quality_median_before: X.XXX  (only at major transitions)
  - godwrite_quality_median_after:  X.XXX
  - individual_prompt_regressions: [] (list prompts that regressed > 0.02)
  - latency_p95_overhead_ms: N (only for E6/E8)
- signals_fired: ["dev_f1_≥+0.02", "holdout_f1_≥+0.01", "quality_≥+0.01"]  # 2-of-3 rule for major
- decision: KEEP | ROLLBACK | STOP_AND_INVESTIGATE
- rationale: 1–3 sentences
- release_created: release-N  (only if KEPT)
```

## Entries

### R1-baseline — retrieval diversification via active-claim authors — KEEP

- date: 2026-04-21
- change: loadActiveClaims surfaces `activeAuthors` (top-30 pre-cap, max 8); retrieval-stage adds Phase 1b-secondary source-targeting via `whereFilter: { author_raw: { $eq: author } }`, maxChunks=4 per author, up to 6 authors.
- sandbox_sha: 670fd2939f1d4e44932a3f68d9b52d812a0bc923 (writing-pipeline-v3)
- artifact_manifest_hash: 620ffd9396d5e53d71ab39ed9e2bdca23ac4681a7a5603b17a4b3e8281420a6e
- canonical_prompt_suite_hash: 80e76b57f5fefc8814c0f23c801cddce8dc351137052b6992074dc826883eea4
- sandbox_state: 1145 claims (release-2 bundle active, post-Nussbaum-migration); 8 per-paper dirs; ChromaDB collections unchanged
- metrics (step-4 prose validation, 6 canonical prompts; pre-R1 on 54c2ba1fe worktree state vs R1.1 on 670fd2939):
  - expected_author_match_rate_before: 0 / 11 (0%)
  - expected_author_match_rate_after: 9 / 11 (82%)
  - phase3a_author_prompt_appearances_before: 0 / 36
  - phase3a_author_prompt_appearances_after: 20 / 36
  - godwrite_quality_mean_before: 0.794
  - godwrite_quality_mean_after: 0.794 (no regression)
  - godwrite_wordcount_mean_before: 1,212
  - godwrite_wordcount_mean_after: 1,261 (+49)
  - individual_prompt_regressions_gt_002: ["adversarial-dialectical (-0.020)"]  # marginal; within noise
  - rc_success_rate: 6/6 (100%)
  - discipline_checks: use-mention (adversarial prompt) PASS | tension-non-resolution (tension prompt) PASS
- signals_fired: ["author_coverage_transformative", "quality_no_regression", "100_pct_success"]
- decision: KEEP
- rationale: Step-4 eyeball validation established that Phase-3a authors (White, O'Gorman, Frede, Caston, Nussbaum, Bowin — 961 claims, 84% of sandbox) were entirely absent from pre-R1 prose; R1 brings them into 56% of author-prompt slots and matches canonical-suite expected-author targets at 82%. Quality unchanged, use-mention discipline preserved. Pre-extraction baseline committed; Phase 3b extracts 14 metaphysics + Papachristou against this state. NOT a formal E-step (no gold-dev/holdout F1 available yet); retrieval-layer bug-fix baseline that unblocks formal Phase 5 measurement.
- release_created: none (release-2 remains active; sandbox state matches release-2 + Nussbaum-migration artifacts)
- pre-extraction_snapshot_command: `git tag R1-baseline-pre-3b 670fd2939` (optional)
- known_followups:
  - methodology prompt showed 21 Heidegger mentions (amplified by Phase 1b-secondary when his BCAP claims scored on "dialectical method"); candidate for R1.2 per-secondary-author cap if pattern recurs post-3b
  - virtual-digital modern-phil gap (Chalmers, Metzinger) requires Phase 3b metaphysics extraction
  - 3 untracked modules still not in git: `core/abort/`, `llm-claim-provider.ts`, `prompt-builder-engine.ts` — Phase 6 preflight item
- artifacts:
  - commit: 670fd2939f1d4e44932a3f68d9b52d812a0bc923
  - validation report: `results/step4-prose-validation-2026-04-21/R1-VALIDATION.md`
  - prose outputs: `results/step4-prose-validation-2026-04-21/*.stdout.json`
  - diagnostic: `results/step4-prose-validation-2026-04-21/diagnostic.{json,log}`
  - scripts: `scripts/run-step4-{smoke,prose}.sh`, `scripts/diagnose-active-claims.ts`

### Phase-3b-extraction — 14 metaphysics + Papachristou — EXTRACTED

- date: 2026-04-21
- change: Ran analyze-secondary.sh on 15 PDFs; extracted 3,776 new claims; merged via resolve_concepts -> generate_bridges -> recompile_index chain.
- papers: Chalmers, Metzinger, Audi, Barnes, Fodor, Horgan, Kim (x3), McDonnell+Wildman, Ney, O'Connor+Wong, Raven, Silcox, Papachristou
- sandbox_state_before: 1,145 claims / 8 authors / 96 bridges / 558 hooks / 1,990 ontology nodes
- sandbox_state_after:  4,921 claims / 23 authors / 552 bridges / 1,136 hooks / 7,389 ontology nodes
- gate_verdict: PASS (canary-health-report.py on 23 papers; 0 zero-claim papers; smoke PASS; claim round-trip PASS)
- cost: ~$20 (Chalmers $2.59 dominant; Phase 3a estimate of $10-12 was low because metaphysics papers longer than canary papers)
- elapsed: 158 min (parallelism=3; Chalmers and Metzinger serial Wave 0, then parallel, Papachristou serial tail)
- known_footnotes:
  - 1 chunk p17-p18 in Chalmers lost to pre-patch _robust_json_array JSON parse failure (~20-25 claims). Salvage patch active for future runs.
  - All bridge judgments returned "unrelated/high" from vLLM judger — metaphysics ontology doesn't cross-pipeline with Aristotle ontology. 456 new bridge candidates recorded but none promoted.
  - Stray "SmokeTest" test-dir in compiled-index activates in some prompts' activeClaimAuthors; cleanup pending.

### R1.3 — BM25 length-normalized scoreCandidate in loadActiveClaims — KEEP (with monitoring)

- date: 2026-04-21
- change: Added `scoreCandidateBM25(topicTerms, searchText, avgdl)` with k1=1.5, b=0.75. loadActiveClaims refactored to two-pass: filter + gather searchTexts to compute avgdl, then score with BM25. Raw-TF `scoreCandidate` preserved for ontology/hook/tension ranking (non-claim paths).
- sandbox_sha: 1268adbcf179b43d368b68be7f427d986576f5d1 (writing-pipeline-v3, tagged `R1.3-baseline-post-3b`)
- artifact_manifest_hash: 620ffd9396d5e53d71ab39ed9e2bdca23ac4681a7a5603b17a4b3e8281420a6e
- canonical_prompt_suite_hash: 80e76b57f5fefc8814c0f23c801cddce8dc351137052b6992074dc826883eea4
- sandbox_state: 4,921 claims / 23 authors (post-3b-merge)
- metrics (step4 6-prompt validation; R1.1 post-3b baseline vs R1.3):
  - godwrite_quality_mean_post3b: 0.789
  - godwrite_quality_mean_r13:    0.790 (+0.001)
  - quality_recovery_prompts: ["phantasia-action +0.016", "perception-sense +0.017", "methodology +0.014"]
  - individual_prompt_regressions_gt_002: ["adversarial-dialectical -0.037"]
  - canonical_expected_author_match_r11_baseline: 9/11 (82%)
  - canonical_expected_author_match_r13: 5/11 (45%); with virtual-digital: 7/14 (50%)
  - metzinger_activated: true (first time; virtual-digital activeClaimAuthors)
  - metzinger_cited_in_prose: false (LLM attribution bottleneck, not retrieval)
  - chalmers_nussbaum_cocite_on_virtual_digital: true (first time)
  - nussbaum_recovery: tension-ack +5, adversarial +3, virtual-digital +4, perception-sense +8
  - bowin_recovery: perception-sense +3
  - persistent_issues: [methodology-heidegger-19-mentions, metzinger-prose-absent, smoketest-contamination]
  - rc_success_rate: 6/6 (100%)
- signals_fired: ["metzinger_activation_first_time", "nussbaum_recovery_multi_prompt", "quality_recovery_3_of_6", "scoring_philosophy_shift_principled"]
- signals_missed: ["canonical_expected_author_match_declined", "adversarial_quality_regressed"]
- decision: KEEP (with monitoring directives; user-approved despite mixed signals)
- rationale: BM25 is a principled standard IR approach with known length-bias correction; raw TF will degrade further as corpus grows. Metzinger activation was a stated Phase-3b goal. The canonical suite's `expected_secondary_presence` was written pre-Phase-3b for an 8-author corpus and is underspecified for 23-author state; the 82% -> 45% drop reflects narrow targeting loss rather than quality loss. Three prompts RECOVER quality under R1.3.
- release_created: none yet (release-3 pending; planned after Phase 4 gold-set creation enables formal F1 measurement)

#### R1.3 monitoring directives (carry-forward to Phase 5 E-step harness)

1. **adversarial-dialectical quality watch**. R1.3 regressed this prompt -0.037. Under any future tweak (per-source caps, prompt adjustments, activeAuthor cap tuning, retrieval weighting), log adversarial-dialectical quality explicitly. Rollback-trigger: if godwrite quality_score < 0.75 sustained across 2 consecutive E-steps without compensating gains elsewhere, revert the triggering change.

2. **R1.3-off as candidate E-step**. If both (a) formal gold-dev F1 + (b) canonical A/B prose-side evaluation indicate BM25-ish scoring regresses rather than improves, treat "R1.3 off" (revert to raw-TF scoreCandidate in loadActiveClaims) as a legitimate E-step rollback. Mechanism: the raw `scoreCandidate` function is preserved unchanged in corpus-index-provider.ts — a one-line revert in loadActiveClaims (swap `scoreCandidateBM25(topicTerms, searchText, avgdl)` -> `scoreCandidate(topicTerms, searchText)`) restores prior behavior. Capture as release-bundle before making R1.3 the default.

3. **Metzinger-specific prose-attribution probe**. Metzinger is now reachable in retrieval but doesn't appear in prose. Before attributing this to "LLM won't cite", verify that his chunks actually pass enforceSourceDiversity + attention-reorder + chunk-trim into the final LLM prompt. If yes, then this is a prompt-tuning question for E-step (elevate ACTIVE CLAIMS block attribution guidance or author-prominence-weighted chunk ordering).

- artifacts:
  - commit: 1268adbcf179b43d368b68be7f427d986576f5d1
  - tag: R1.3-baseline-post-3b
  - validation report: `results/step4-r13-2026-04-21/R13-SUMMARY.md`
  - post-3b reference: `results/step4-post3b-2026-04-21/POST-3B-SUMMARY.md`
  - prose outputs: `results/step4-r13-2026-04-21/*.stdout.json`
  - scripts: `scripts/run-step4-r13.sh`, `scripts/run-phase3b-batch.sh`
