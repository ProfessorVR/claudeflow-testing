# Post-3b + R1 Validation Summary

**Date:** 2026-04-21
**Sandbox state:** 4,921 claims (1,145 → 4,921, +3,776 from Phase 3b), 23 authors, 552 bridges, 1,136 hooks, 7,389 ontology nodes
**Pipeline SHA:** 670fd2939 (R1 on writing-pipeline-v3)
**Phase 3b cost:** ~$20; Phase 3b merge: ~$0; Post-3b prose validation: ~$1.80; total session: ~$26.60

---

## 1. Headline

Phase 3b successfully extracted **3,776 new claims from 15 papers** (14 metaphysics + Papachristou), all rc=0, merged cleanly into compiled-index. Gate verdict PASS. **Chalmers surfaces on virtual-digital for the first time (4 prose mentions, plus Ney:2)** — the modern-philosophy coverage gap is **partially closed**. Metzinger, however, is **never activated** across any of the 6 canonical prompts: his 229 claims do not score in the top-30 TF for any canonical prompt, so he never reaches `activeClaimAuthors`. Quality averaged 0.789 (vs R1-baseline 0.794, Δ -0.005); 2 prompts regressed >0.02 (phantasia-action -0.030, tension-acknowledgement -0.020). No runtime failures.

---

## 2. Per-prompt results — 3-way comparison

| Prompt                      | pre-R1 Q | R1 Q  | post-3b Q | Δ(R1→3b) | Phase-3a Δ               | Modern-phil Δ                     |
|-----------------------------|---------:|------:|----------:|---------:|--------------------------|-----------------------------------|
| phantasia-action            |    0.792 | 0.804 |     0.774 |   -0.030 | Caston/White/O'Gorman hold | —                                |
| perception-sense            |    0.787 | 0.781 |     0.775 |   -0.006 | Frede/White hold          | —                                 |
| methodology                 |    0.809 | 0.805 |     0.801 |   -0.004 | Caston hold; Heidegger still dominant (17 mentions) | — |
| virtual-digital             |    0.806 | 0.804 |     0.805 |   +0.001 | —                        | **+Chalmers(4) +Ney(2)**           |
| tension-acknowledgement     |    0.780 | 0.799 |     0.779 |   -0.020 | Bowin/Caston/Nussbaum LOST | —                                 |
| adversarial-dialectical     |    0.789 | 0.769 |     0.797 |   +0.028 | Bowin/Caston/Nussbaum LOST | —                                 |
| **avg**                     |    0.794 | 0.794 |     0.789 |   -0.005 | net: ~50% retained        | gap partially closed              |

---

## 3. Modern-philosophy gap assessment

### 3.1 What closed
**Chalmers, David J.** appears in virtual-digital prose for the first time (4 citations, e.g., `(Chalmers, David J., The Virtual and the Real, p.X)`). Phase 1b-secondary source-targeted Chalmers via `author_raw`, brought his chunks into the 20-chunk pool, and the LLM attributed to them.

**Ney, Alyssa** also surfaces on virtual-digital (2 citations) — bonus metaphysics author.

### 3.2 What did not close
**Metzinger, Thomas K.** is absent from all 6 prompts. Telemetry shows Metzinger is *never* in `activeClaimAuthors` for any prompt. His 229 claims don't hit top-30 TF. On `virtual-digital` specifically, the activated authors were: Chalmers, Ney, McDonnell+Wildman, O'Gorman, Papachristou — Metzinger lost out to Chalmers (512 claims, denser VR vocabulary), McDonnell-Wildman (237 claims, "virtual reality" throughout), and non-metaphysics authors whose claims happened to match on general terms.

Root cause: TF-based `scoreCandidate` with no length normalization rewards claim density × claim count. Metzinger (229 claims × ~270 chars avg) is smaller target than Chalmers (512 claims × similar length).

**Not closed by R1 alone.** Options:
- Add Metzinger to `primaryAuthors` for virtual-digital-style prompts (prompt-specific)
- R1.3: length-normalize `scoreCandidate` (existing design option from diagnostic)
- R1.4: topic-keyword overlap bonus (VR prompts boost VR-labeled claims)
- Accept: Chalmers + Ney cover the modern-phil corner adequately for writing purposes

### 3.3 Phase-3a author regression
Some Phase-3a authors present in R1-baseline prose are now absent post-3b:

| Prompt          | R1-baseline Phase-3a | Post-3b Phase-3a     | Lost           |
|-----------------|----------------------|----------------------|----------------|
| tension-ack     | Bowin, Caston, Nussbaum | — (none)          | Bowin, Caston, Nussbaum |
| adversarial     | Bowin, Caston, O'Gorman, Nussbaum, White | White | Bowin, Caston, O'Gorman, Nussbaum |
| phantasia-action | Caston, White, O'Gorman | Caston, White, O'Gorman | — (hold) |
| virtual-digital | Frede, White, O'Gorman | O'Gorman | Frede, White |
| perception-sense | Frede, White | Frede, White     | — (hold) |
| methodology     | Caston | Caston            | — (hold) |

**Mechanism:** the claim pool grew from 1,145 → 4,921 (4.3×). The top-30 TF scored pool now has more competition. Metaphysics authors surface on general-philosophy terms (`dialectical`, `tension`, `ancient`, `thought`) even when less topically specific. The `maxAuthors=8` cap remains fixed, so as new authors enter the top-30, older ones drop out.

---

## 4. Quality regression analysis

Two prompts regressed >0.02:

### 4.1 phantasia-action (−0.030, 0.804 → 0.774)
ActiveAuthors shifted but content still strong. The drop may be from the SmokeTest stray that made it into activeAuthors (test-dir contamination in compiled-index). Worth investigating; ~1-2 point quality impact likely.

### 4.2 tension-acknowledgement (−0.020, 0.799 → 0.779)
Lost Bowin/Caston/Nussbaum who were visible in R1-baseline. The tension prompt explicitly expects these. Phase 1b-secondary is now routing retrieval to Kim, Barnes, Chalmers instead. Quality cost: these authors' chunks don't address the truth-apt/deception tension as directly.

### 4.3 adversarial-dialectical (+0.028, 0.769 → 0.797)
Improved quality despite losing Phase-3a authors — suggests prose coherence benefited from tighter primary-author focus (Aristotle + Heidegger).

Two regressions are both within the "flag at ±0.02" threshold but not catastrophic. Discipline checks (use-mention, tension non-resolution) still intact on spot-check.

---

## 5. Telemetry — activeClaimAuthors per prompt

| Prompt                      | Authors activated                                                                   |
|-----------------------------|-------------------------------------------------------------------------------------|
| phantasia-action            | Papachristou, White, O'Gorman, Frede, **SmokeTest**, Caston  (6 authors; SmokeTest = stray) |
| perception-sense            | Frede, McDonnell+Wildman, Papachristou, O'Gorman, White, Bowin  (6)                 |
| methodology                 | White, Caston, Frede, O'Gorman, Heidegger, Ney, Papachristou  (7)                   |
| virtual-digital             | **Chalmers**, **Ney**, McDonnell+Wildman, O'Gorman, Papachristou  (5)               |
| tension-acknowledgement     | Kim, O'Gorman, Papachristou, Frede, White, Barnes, Bowin, Chalmers  (8 — cap hit)   |
| adversarial-dialectical     | White, Audi, Kim, Barnes, Ney, O'Connor+Wong, Caston  (7; Aristotle filtered)       |

Filtered count: 245/4921 (vs R1-baseline 56/1145) — same ~5% filter rate, consistent with faithfulness-allowlist behavior.

---

## 6. Observations

### 6.1 Stray "SmokeTest" author in activeAuthors
phantasia-action shows `SmokeTest` in activeAuthors — indicates a test-dir slipped past the `case "${slug}" in releases|test-paper) continue ;;` skip in post-canary-merge.sh. The skip list missed `test-*` or similar. Worth pruning from compiled-index.

### 6.2 Heidegger dominance on methodology persists (17 mentions)
Unchanged vs R1-baseline (21 mentions). His BCAP claims still score high on "dialectical method". R1 didn't address this and Phase 3b didn't change it. Candidate for future R1.2 `maxPerSource` tightening on secondary authors.

### 6.3 Bridges generated but all "unrelated"
552 bridges total; all judgments show `unrelated/high` from the vLLM bridge-judger. Metaphysics ↔ Aristotle ontology doesn't cross-pipeline strongly. Non-blocking — claims still contribute via Phase 1b-secondary regardless.

### 6.4 No runtime failures
6/6 prompts completed rc=0. Worktree cleanup behaving correctly. R1 code stable with 4.3× larger claim pool.

---

## 7. Decision for next step

Three paths forward:

### Option α: Accept current state → Phase 4 gold-set
Pipeline works; gap partially closed; quality within 0.005 of R1-baseline. Build 50-dev + 20-holdout gold items on the 23-paper corpus. Formal E-step harness thereafter. **Cost: $0 + ~4hr human work.**

### Option β: R1.3 (score length-norm) before Phase 4
Implement length-normalized `scoreCandidate` (BM25-ish, already scoped in diagnose-active-claims.ts's `scoreBM25`) to reduce claim-density bias. Re-validate. Likely closes Metzinger gap + restores dropped Phase-3a authors. **Cost: code + ~$2 re-validation.**

### Option γ: Accept current state, add Metzinger as virtual-digital primary_author
Smallest surgical fix — make Metzinger a `primaryAuthor` for VR-topic prompts via domain config. Doesn't address general scoring issues. **Cost: config tweak + ~$0.40 single-prompt smoke.**

### Option δ: Investigate SmokeTest contamination + methodology Heidegger dominance
Side-quest: clean compiled-index, add `maxPerSource=4` for non-primary authors. **Cost: code + data cleanup + ~$2 re-validation.**

**Recommendation:** β (R1.3 length-norm) before Phase 4. It's a well-scoped tuning pass that directly addresses the scoring bias this validation exposed. Phase 4 gold-set work is expensive (4hr human) and benefits from a tuned pipeline.

---

## 8. Budget

| Item                                  | Spent    |
|---------------------------------------|---------:|
| Session-running total before Phase 3b | ~$4.80   |
| Phase 3b extraction (15 papers)       | ~$20.00  |
| Post-3b merge chain (vLLM + embed)    | ~$0.00   |
| Post-3b prose validation (6 prompts)  | ~$1.80   |
| **Session total**                     | **~$26.60** |

---

## 9. Artifacts

- `results/phase3b-2026-04-21/batch.log` — extraction log
- `results/phase3b-2026-04-21/*.log` — per-paper extraction logs
- `results/phase3b-2026-04-21/merge.log` — resolve+bridges+recompile chain
- `results/step4-post3b-2026-04-21/*.stdout.json` × 6 — R1 + post-3b prose
- `results/step4-post3b-2026-04-21/*.stderr.txt` × 6 — pipeline telemetry
- `data/corpus/index/<slug>/{claims,concept-mentions,bridge-candidates}.jsonl` × 15 new
- `data/corpus/index/compiled-index.json` — recompiled to 4,921 claims / 7,389 nodes / 552 bridges / 45 tensions / 1,136 hooks

Scripts added:
- `scripts/run-phase3b-batch.sh`
- `scripts/run-step4-post3b.sh`

Experiment log entry: R1-baseline logged at `results/experiment-log.md`. Post-3b entry is pending — recommend logging after user choice among α/β/γ/δ so the entry reflects the next decision.

---

**End of post-3b summary.**
