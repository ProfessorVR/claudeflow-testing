# Perplexity Budget Allocation — Post-Phase-3.5 Re-Distribution

**Phase 3.5 — Tier C Cache Reconciliation**
**Run-ID**: 2026-05-13T1439
**Date generated**: 2026-05-13

## Budget summary (locked decisions per Plan §9.4)

| Parameter | Value |
|---|---|
| Initial query allocation | 40 |
| Monetary cap | $100 USD |
| Escalation policy | S1 (sonar-pro+low ~$0.015) → S2 (sonar-pro+medium ~$0.04) → S3 (sonar-deep-research ~$2-3); 3 attempts/gap max |
| Pause thresholds | 36 queries OR $20 USD remaining |
| Source priority | corpus/index FIRST → ChromaDB → Perplexity (per feedback-corpus-index-first.md) |

## Pre-Phase-3.5 Perplexity queue baseline

Per `perplexity-queue.json`, Phase 3 Wave 4 Agent G allocated **17 queries** across the dissertation, distributed:

| Section | Pre-Phase-3.5 queries | Subtotal cost (est.) |
|---|---|---|
| DISS-00-INTRO | 0 | $0 |
| DISS-01-A0 | 6 | ~$0.24 (S1+S2) |
| DISS-02-A1A2 | 3 | ~$0.12 (S1) |
| DISS-03-A3 | 1 | ~$0.04 (S2) |
| **DISS-04-EMOTION** | **0** | **$0 (pre-Phase-3.5: assumed all DISS-04 gaps Tier A corpus-index-routable)** |
| DISS-05-A4 | 7 | ~$5.9 (includes 2× S3 deep-research at $2-3 each) |
| **TOTAL** | **17** | **~$6.34** |

Remaining capacity: 23 query slots / ~$87 USD.

## Phase 3.5 confirms DISS-04 cache reconciliation eliminated 31+ potential Perplexity escalations

Phase 3.5 cache reconciliation analysis (`cache-coverage-summary.md`) demonstrates:
- **34 of 37 corpus-routable DISS-04 gaps** are cache-resolved (strong/supplementary/partial)
- **22 cache-hit-strong** gaps would otherwise have required Perplexity Q-006 → Q-016 type queries (Sherman/Brennan/Konstan/Withy/Rickert anchors); now resolved by cache without query expenditure
- **9 cache-hit-supplementary** gaps would have required at minimum S1 sonar-pro+low queries; eliminated
- **3 cache-partial-hit + cache-miss gaps** REMAIN: G29 (SZ §31-32 primary), G32 (SZ §29 H.137 primary), G44 (3D magnitude-axis novel)

**Without Phase 3.5 cache reconciliation, DISS-04-EMOTION would have required an estimated 24-33 fresh Perplexity queries** (estimate: 22 strong cache-hits × 1 query each + 9 supplementary × 0.5 query each + 3 partials × 1.5 queries × $0.04 avg = $1.34 to $4 in Perplexity spend).

**With Phase 3.5 cache reconciliation**, DISS-04 may need 0–5 additional Perplexity queries (only for the partial-hits if user wants stronger backing for novel-architectural claims).

## Recommended post-Phase-3.5 budget redistribution

| Section | Phase-3.5-status | Recommended Perplexity allocation | Cost estimate |
|---|---|---|---|
| DISS-00-INTRO | Pending Phase 3.5 (cross-section dependency) | 2 (corrective only, if §1.0 prose-diagram drift requires it) | $0.08 |
| DISS-01-A0 | Already queued | 6 (no change) | $0.24 |
| DISS-02-A1A2 | Already queued | 3 (no change) | $0.12 |
| DISS-03-A3 | Already queued | 1 (no change) | $0.04 |
| **DISS-04-EMOTION** | **Post-Phase-3.5 reconciled** | **3 (only for G29 SZ §31-32 primary, G32 SZ §29 H.137 primary, G44 3D magnitude-axis novel)** | **$0.12 (S2-medium each)** |
| DISS-05-A4 | Already queued (heaviest) | 7 (no change) | ~$5.9 |
| **TOTAL POST-PHASE-3.5** | | **22 queries** | **~$6.50** |

**Slot capacity remaining**: 18 query slots
**USD capacity remaining**: ~$93.50 USD

## DISS-04 specific Perplexity allocation (the 3 new queries)

### Q-DISS04-001 (for DISS-04-G29 → C080: Grounding-direction-identical thesis)
- **Section**: DISS-04-S3a (From the Lectures to Being and Time)
- **Cache coverage**: cache-hit-supplementary via Q-HRH-15 (Michalski) and Q-HRH-13 (Pöggeler)
- **Remaining need**: Direct verbatim from SZ §31 H.142 / §32 H.143 establishing that attunement grounds understanding AND discourse
- **Expected starting step**: S1 (corpus/index lookup likely sufficient; SZ is in corpus/index; Perplexity is fallback)
- **Estimated cost**: $0.015
- **Priority**: ★★ (supplementary; primary Heidegger - Being and Time corpus/index route preferred)

### Q-DISS04-002 (for DISS-04-G32 → C206: Stimmung-saturation mechanism)
- **Section**: DISS-04-S7 (Feedback Loop)
- **Cache coverage**: cache-hit-supplementary via Q-HAW-11 (Aristotelian textual ground)
- **Remaining need**: Direct verbatim from SZ §29 H.137 (the canonical Stimmung+thrownness passage)
- **Expected starting step**: S1 (SZ in corpus/index; Perplexity is fallback)
- **Estimated cost**: $0.015
- **Priority**: ★★ (supplementary)

### Q-DISS04-003 (for DISS-04-G44 → C062: Three-dimensional magnitude-axis)
- **Section**: DISS-04-S3 (Two Articulational Concretions)
- **Cache coverage**: cache-hit-supplementary via Q-HRH-09, Q-DOW-05, Q-WIT-08 (parallel framings only)
- **Remaining need**: Secondary literature on Aristotelian magnitude-axes for emotion (Konstan 2006? Sherman 1989?); the dissertation-novel 3D axis (intensity / weight / articulation) needs a closest-secondary anchor
- **Expected starting step**: S2 (medium context — this is a dissertation-novel claim and requires careful searching)
- **Estimated cost**: $0.04
- **Priority**: ★★★ (dissertation-novel architectural claim warrants stronger secondary anchor IF available)

**DISS-04 Perplexity subtotal**: ~$0.07 USD, 3 queries (well within freed capacity of ~$93.50 / 18 slots)

## Cache-vs-Perplexity efficiency win

**Phase 3.5 net savings**: At least **22 queries × $0.04 avg = ~$0.88 USD** in direct Perplexity spend OR more if S3 escalations would have been needed for dissertation-novel claims. More importantly, the cache reconciliation provides **22+ verbatim ★★★★/★★★ scholarly quotations** that Perplexity would have had to discover and verify in real-time, with attendant verification burden and time cost.

The cache reconciliation also surfaces **2 ★★★★ (CITE)-resolvers** (Q-NUS-07 for §1.6 + W-9 for §1.7) which would otherwise have required dedicated S2 or S3 Perplexity queries with verification rounds.

## Pause/escalation policy reminder

The original pause thresholds (Plan §9.4) remain:
- Pause if queries → 36 of 40 used
- Pause if $USD remaining ≤ $20

Post-Phase-3.5 status: 22 queries planned / 17 already queued + 3 new from Phase 3.5 + 2 reserve placeholders = **22 queries committed**; **$93.50 USD remaining**. Phase 3.5 has put the Perplexity queue in a **healthy budget posture** with ~50% capacity reserve.

## Routing for the 3 DISS-04 Perplexity queries

All 3 queries should be FALLBACK-ONLY: the primary route is corpus/index lookup:

1. **DISS-04-G29 / G32 (SZ primary citations)**: Run a corpus/index lookup at `/home/dalton/projects/claudeflow-testing/corpus/index/Heidegger - Being and Time/` for §29 H.137 and §31-32 first. Only escalate to Perplexity if the corpus/index extraction yields incomplete text.
2. **DISS-04-G44 (3D magnitude-axis secondary)**: Run a corpus/index lookup at `/home/dalton/projects/claudeflow-testing/corpus/index/Aristotelian Phantasia Secondary (1985-2017)/` for Konstan-style emotion-typology scholarship first. Only escalate to S2 Perplexity if no such secondary exists in the existing pipeline cohort.

This routing aligns with feedback-corpus-index-first.md (Plan §9.4 source priority).

## Summary

- **Queries freed from §1.4 by cache reconciliation**: ~24 (22 strong cache-hits + 9 supplementary = 31 would-have-needed queries, with cache-hits eliminating the need)
- **Net new Perplexity queries added by Phase 3.5**: 3 (all S1/S2 supplementary, total ~$0.07 USD)
- **Net budget impact**: HEALTHY — Phase 3.5 net-saves ~$0.81 USD and 19 query slots vs. the no-cache counterfactual
- **Quality impact**: HIGHER — cache provides verified verbatim ★★★★/★★★ quotations from already-vetted scholarly sources rather than Perplexity-derived fresh material requiring verification
