# R1.3 Length-Normalized Scoring — Validation

**Date:** 2026-04-21
**Change:** `scoreCandidateBM25` (k1=1.5, b=0.75) replaces raw TF scoring in `loadActiveClaims`. avgdl computed per-call from filtered candidate pool (two-pass scoring).
**Cost:** ~$1.80 for 6-prompt validation.
**Result:** Mixed — principled improvement in some dimensions, regression in others. Decision gate required.

---

## 1. Headline

BM25 length normalization **successfully activates Metzinger for the first time** (virtual-digital activeAuthors). **Nussbaum recovers** on tension-acknowledgement and adversarial-dialectical (lost in post-3b). **Bowin recovers** on perception-sense. Average quality 0.790 (vs post-3b 0.789, R1-baseline 0.794 — essentially unchanged). However, the expected-author match rate against canonical suite DROPS to 50% (vs R1-baseline 82%) because Caston/Frede drop from some prompts where they were strong in R1. Metzinger is in retrieval but still not cited in prose (LLM attribution bottleneck, not retrieval).

---

## 2. 4-way comparison — quality per prompt

| Prompt                      | pre-R1 | R1.1   | post-3b | R1.3   | R1.3 - post-3b |
|-----------------------------|-------:|-------:|--------:|-------:|---------------:|
| phantasia-action            | 0.792  | 0.804  | 0.774   | 0.790  | **+0.016**     |
| perception-sense            | 0.787  | 0.781  | 0.775   | 0.792  | **+0.017**     |
| methodology                 | 0.809  | 0.805  | 0.801   | 0.815  | **+0.014**     |
| virtual-digital             | 0.806  | 0.804  | 0.805   | 0.804  | -0.001         |
| tension-acknowledgement     | 0.780  | 0.799  | 0.779   | 0.777  | -0.002         |
| adversarial-dialectical     | 0.789  | 0.769  | 0.797   | 0.760  | **-0.037**     |
| **avg**                     | 0.794  | 0.794  | 0.789   | 0.790  | +0.001         |

Three prompts recover quality (phantasia +0.016, perception +0.017, methodology +0.014). Two hold. Adversarial regresses sharply (-0.037). Net-neutral vs post-3b.

---

## 3. Canonical-suite expected-author match

| Prompt                      | Expected                | R1.1 got          | R1.3 got          |
|-----------------------------|-------------------------|-------------------|-------------------|
| phantasia-action            | Nussbaum, Caston, Frede | Caston (1/3)      | Caston (1/3)      |
| perception-sense            | Caston, Frede, Papachristou | Frede, Papachristou (2/3) | Papachristou (1/3) |
| methodology                 | Bowin, Caston           | Caston (1/2)      | — (0/2)           |
| virtual-digital             | Chalmers, Metzinger, Nussbaum | — (0/3, unreachable) | **Chalmers, Nussbaum (2/3)** |
| tension-acknowledgement     | Caston, Nussbaum, Frede | all 3 (3/3)       | Nussbaum (1/3)    |
| adversarial-dialectical     | Nussbaum, Caston        | both (2/2)        | both (2/2)        |
| **Total (all 14)**          | 14                      | 9/14 (64%)        | 7/14 (50%)        |
| **Excluding VD (11)**       | 11                      | 9/11 (82%)        | 5/11 (45%)        |

**R1.3 wins on virtual-digital** (2/3 including primary-phil gap closure for Chalmers + Nussbaum surfacing for the first time in any mode).

**R1.3 loses on tension-acknowledgement** (1/3 vs R1.1's 3/3) and perception-sense (1/3 vs 2/3). Caston and Frede drop from prose citations despite being in activeAuthors on some prompts.

---

## 4. Phase-3a + metaphysics author coverage

| Prompt                      | R1.3 prose authors                                                      |
|-----------------------------|-------------------------------------------------------------------------|
| phantasia-action            | White:4, Caston:4, Papachristou:3, Heidegger:2                          |
| perception-sense            | **Nussbaum:8, Bowin:3**, Papachristou:4, O'Gorman:2, Heidegger:2, Burke:2 |
| methodology                 | Heidegger:19, White:2, Papachristou:2                                   |
| virtual-digital             | White:6, **Chalmers:6**, **Nussbaum:4**, Heidegger:4, Papachristou:3, O'Gorman:2, Burke:2 |
| tension-acknowledgement     | **Nussbaum:5**, White:4, Papachristou:4, O'Gorman:2, Heidegger:2, Hawhee:2, Gonzalez:2, Burke:2 |
| adversarial-dialectical     | Caston:6, White:4, **Nussbaum:3**, Papachristou:2, Heidegger:2           |

**Recoveries (post-3b → R1.3):**
- tension-ack: Nussbaum back (was 0, now 5)
- adversarial: Caston back (0 → 6), Nussbaum back (0 → 3)
- perception-sense: Nussbaum back (0 → 8), Bowin back (0 → 3)
- virtual-digital: Nussbaum appears (0 → 4)

**Persistent absence:**
- Metzinger — in activeAuthors for virtual-digital but 0 prose mentions
- methodology Heidegger dominance: 19 mentions (unchanged)

---

## 5. Why Metzinger still absent from prose

Telemetry shows Metzinger in `activeClaimAuthors` for virtual-digital (first time!) — so Phase 1b-secondary source-targeted him and pulled his chunks into the retrieval pool. But the prose cites Chalmers:6 and Nussbaum:4 instead. Likely causes:
- Metzinger's chunks scored lower in final `enforceSourceDiversity` ranking
- Or the LLM preferred quoting Chalmers' crisper VR-phenomenology passages over Metzinger's philosophical-motivation arguments
- Only 4-6 Metzinger chunks in ChromaDB (vs Chalmers' 23+12)

Retrieval succeeded; LLM attribution is the bottleneck. Not addressable by scoring tweaks in `loadActiveClaims` alone.

---

## 6. Stray contamination: "SmokeTest"

`SmokeTest` appears in activeAuthors for phantasia-action and methodology. There's a test-dir in the sandbox compiled-index that should have been filtered. Minor — costs one slot in activeAuthors. Discrete cleanup task.

---

## 7. Decision — keep or revert R1.3?

### Pro-keep arguments
- BM25 is a principled standard IR approach; raw TF has known length-bias failure modes that only get worse as the corpus grows
- Metzinger activated for the first time (stated goal of Phase 3b)
- Nussbaum/Bowin recover on multiple prompts
- Virtual-digital includes Chalmers + Nussbaum (highest expected-author match on that prompt ever)
- Quality equivalent (+0.001 avg)
- Will scale better for future extractions

### Pro-revert arguments
- Expected-author match rate drops from 82% (R1.1) to 50% (R1.3) — this is the canonical-suite-defined quality metric
- tension-acknowledgement went from 3/3 expected authors to 1/3
- adversarial-dialectical quality regressed -0.037

### Hybrid option
Keep R1.3 AND restore stronger TF on prompts where canonical suite specifies narrow expected authors (tension/adversarial). Would require prompt-level tuning or two-pass ranking — scope creep.

---

## 8. Recommendation

**Keep R1.3.** Rationale:
1. Expected-author metric is narrow (canonical suite specifies 2-3 expected authors per prompt); a high match on that metric can mean the pipeline is over-fitted to canonical-suite-author preferences rather than producing topically-diverse prose
2. Quality is equivalent; R1.3 recovers quality on 3/6 prompts
3. Virtual-digital sees the first Nussbaum + Chalmers co-citation (stated 3b goal achieved)
4. BM25 scales; raw TF will get worse as corpus grows
5. Phase 4 gold-set work can include author-prominence calibration as a formal E-step if needed

Accept the trade-off: moved from over-fitted "expected author match" toward broader topical breadth. The canonical suite's `expected_secondary_presence` was written against a pre-Phase-3b corpus; it's underspecified now.

---

## 9. Next gate

- **ε)** KEEP R1.3 → commit → log → proceed to Phase 4 gold-set
- **ζ)** REVERT R1.3 → stay on R1.1 → proceed to Phase 4
- **η)** Investigate methodology Heidegger dominance (R1.4 per-secondary-author cap) before Phase 4
- **θ)** Investigate Metzinger attribution (LLM prompt tuning) before Phase 4

Recommend ε.

---

**End of R1.3 summary.**
