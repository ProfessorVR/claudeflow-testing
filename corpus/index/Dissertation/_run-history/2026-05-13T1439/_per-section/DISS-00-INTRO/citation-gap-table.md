# Citation Gap Table — DISS-00-INTRO

**Section**: §1.0 — Introduction: Rhetorical Phantasia: The Soul's Temporal Medium | **Run-id**: 2026-05-13T1439
**Total flagged claims**: 16 of 94 (17.0%)
**Sorted by**: remediation effort (small→large) THEN severity (T6 > T5 > T8 > T4 > T7)
**Cache annotation**: each row tagged for likely overlap with the 244-entry MASTER-CITATION-REPORT (2026-05-10) per Plan §3.5.

## Tier breakdown

| Tier | Count | % of flagged | Implied action |
|------|-------|--------------|----------------|
| T6-unsupported | 4 | 25.0% | Add citation OR explicitly flag |
| T5-under-supported | 8 | 50.0% | Add primary citation |
| T8-secondary-needed | 0 | 0% | n/a |
| T4-interpretive-but-unflagged | 1 | 6.25% | Add interpretive flag |
| T7-overreach (typos/formatting) | 3 | 18.75% | In-text fix |
| **TOTAL** | **16** | 100% | |

## Route breakdown

| Route | Count | Note |
|-------|-------|------|
| Tier A — corpus/index routable | 13 | Resolvable from existing pipelines (Aristotle Complete Works, BCAP, BT) |
| Tier B — ChromaDB routable | 0 | n/a — all routable via corpus/index |
| Tier C — Perplexity / cache | 1 | Phys. VII.3 alteration-applies-to-soul (cache-miss expected) |
| ****** placeholder manual fill | 0 | none |
| In-text fix only | 2 | ??? placeholder; diagram update |

## Cache overlap analysis

Per Plan §3.5: the 244-entry MASTER-CITATION-REPORT (2026-05-10) covers OLD Pathe §§1.1-1.9 → primarily §1.4 territory. **§1.0's overlap is LOWER** than §1.4's because the introduction's primary loci are framing/architecture-canonical:

| Cache likelihood | Count | Implication |
|------------------|-------|-------------|
| cache-likely-strong | 7 | ★★★★ or ★★★ match in master report — direct verbatim + locus + insertion-anchor already prepared |
| cache-likely-supplementary | 3 | ★★ or ★ match — useful but optional |
| cache-likely-miss | 1 | Phys. VII.3 (not Pathe-§§1.1-1.9 territory) |
| n/a (internal / typo / placeholder) | 5 | no external citation needed |

**Net Perplexity queries expected from DISS-00 in Phase 4**: at most 1 (Phys. VII.3, and even this could be skipped if user prefers ADD_FLAG remediation for the T4 claim). Per Plan §3.5.7 the 40-query budget remains largely available for §§1.1/1.2/1.3/1.5.

## Gap rows (sorted as specified)

### TRIVIAL effort — typos and placeholders (3 rows)

| # | Claim | Tier | Issue | Action | Effort | Cache |
|---|-------|------|-------|--------|--------|-------|
| 3 | C048 | T7 | "becomes ineligible" → "becomes intelligible" (line 41 chapter-scope statement) | FIX_TYPO | trivial (15 sec) | n/a |
| 4 | C065 | T7 | Empty `\textit{}` brace before Greek *orektikon* at line 58 (missing transliteration) | FIX_EMPTY_BRACE_ADD_TRANSLITERATION | trivial (15 sec) | n/a |
| 5 | C068 | T7 | Bekker typo "1072a23026" → "1072a23-26" (Met. XII Prime Mover citation, line 60) | FIX_BEKKER_TYPO | trivial (15 sec) | cache-strong (Met. XII canonically in master report) |

**Aggregate effort**: ~1 minute to clear the T7 cluster.

### SMALL effort — user-decision / placeholder resolution (2 rows)

| # | Claim | Tier | Issue | Action | Effort | Cache |
|---|-------|------|-------|--------|--------|-------|
| 1 | C047 | T6 | `???` placeholder for forward-reference to chapter developing rhetorical framing (line 41) | RESOLVE_QQQ_MARKER (user decision: likely Chapter X) | small (user decision) | n/a |
| 2 | C094 | T6 | Diagram update + full-page reformat `\inlinenote` (line 70); TikZ at lines 73-591 exists | RESOLVE_INLINENOTE+REFORMAT | small (formatting) | n/a |

### SMALL effort — formatting fix (1 row)

| # | Claim | Tier | Issue | Action | Effort | Cache |
|---|-------|------|-------|--------|--------|-------|
| 6 | C056 | T7 | Malformed footnote brace nesting in methodology 10-locus catalog (line 47) | FIX_FOOTNOTE_BRACE_NESTING | small (3 min) | n/a |

### SMALL effort — corpus-routable T6 (2 rows)

| # | Claim | Tier | Issue | Best route | Cache |
|---|-------|------|-------|-----------|-------|
| 7 | C026 | T6 | Diakrisis methodological remark (line 23 \\inlinenote) needs DA III.7 anchor and prose-surfacing | corpus/index/Aristotle/DA III.7 (431a8-12) | supplementary |
| 8 | C001 | T6 | Animal motion as actualization of desire (line 3 \\inlinenote) needs DA III.10 + MA 6 anchors and prose-surfacing | corpus/index/Aristotle/DA III.10 + MA 6 | strong |

### SMALL effort — corpus-routable T4 / T5 (5 rows)

| # | Claim | Tier | Issue | Best route | Cache |
|---|-------|------|-------|-----------|-------|
| 9 | C072 | T4 | "Psychic events as species of natural motion" interpretive-but-UNFLAGGED at line 60 | ADD_FLAG (prefer) OR corpus/index/Aristotle/Phys. VII.3 | miss |
| 11 | C027 | T5 | Continuous-unfolding thesis (line 26) needs Phys. III.1 + Phys. IV.11 anchors | corpus/index/Aristotle/Phys. III.1 + Phys. IV.11 | strong |
| 12 | C028 | T5 | "BT 499" stretching-along citation (line 26) needs SZ section sharpening | corpus/index/Heidegger/BT §65 + §72 | supplementary |
| 13 | C029 | T5 | Phantasia-temporal-distinguishing thesis (line 28) needs DA III.3 427b15-428a18 anchor | corpus/index/Aristotle/DA III.3 | strong |
| 14 | C030 | T5 | Kinetic-constitution / not-a-mixture thesis (line 28) needs DA III.3 427b14-26 anchor | corpus/index/Aristotle/DA III.3 | strong |
| 15 | C044 | T5 | Anti-internalist thesis (line 41 \\hl) needs BCAP 133 anchor at canonical-statement site | corpus/index/Heidegger/BCAP p.133 | strong |

### MEDIUM effort — multi-locus T3-with-T5-children (1 row)

| # | Claim | Tier | Issue | Best route | Cache | Effort |
|---|-------|------|-------|-----------|-------|--------|
| 10 | C022 | T3 (children C023, C024 are T5) | Four-temporal-events thesis (line 19 \\hl) needs 4 canonical anchors: DA II.5 + DA III.3 + On Dreams + On Memory | corpus/index/Aristotle/DA II.5 + DA III.3 + On Dreams + On Memory | strong (multi-locus) | medium (15-20 min for 4 anchors + verbatim selection + insertion) |

### MEDIUM effort — multi-locus T5 (1 row)

| # | Claim | Tier | Issue | Best route | Cache | Effort |
|---|-------|------|-------|-----------|-------|--------|
| 16 | C045 | T5 | Cognition-itself-specifies-under-different-logos thesis (line 41 \\hl) needs DA I.1 + DA II.5 + DA III.2 enmattered-accounts cluster | corpus/index/Aristotle/DA I.1 + DA II.5 + DA III.2 | strong | medium (10-15 min for 3 anchors + footnote integration) |

---

## Aggregate remediation budget

| Tier of effort | Items | Total estimated time |
|----------------|-------|---------------------|
| Trivial (15 sec - 1 min each) | 3 | ~1 min |
| Small (3-10 min each) | 11 | ~60-90 min |
| Medium (10-20 min each) | 2 | ~25-35 min |
| **TOTAL** | **16** | **~1.5-2 hours** |

The introduction is a **moderate-effort revision target** by Phase 4 / Phase 5 standards. Compared to §1.4's 46 actionable items at 4-5 hour estimate, §1.0 is about 1/3 the effort but proportionally similar in density (16 / 94 = 17% flagged vs §1.4's 46 / 306 = 15%).

---

## TABLE B: Promise / fulfillment cross-reference

Eleven explicit promises made in §1.0; cross-referenced against §§1.1-1.5's actual delivery:

| # | Promise (line) | Fulfillment status | Action needed at revision |
|---|----------------|-------------------|----------------------------|
| 1 | line 17 — "Aristotle's concept of phantasia lies at the core of human being through its capacity to create a continuous narrative of experience" | FULFILLED | None |
| 2 | line 19 — Four temporal events T_1..T_4 of phantasia's operation | FULFILLED via the A_n chain | Apply DRIFT-1 to align T_n / A_n terminology |
| 3 | line 30 — "Three kinds or grades of phantasia... examined in detail in Chapter IV" | PARTIAL | Verify in §1.3 whether Papachristou framework is engaged or only orientational-modes; if only modes, decide whether to drop Papachristou promise |
| 4 | line 30 — Phantasia/doxa relation; phantasia's voluntariness | FULFILLED in §1.3 and §1.4 | None |
| 5 | line 36 — Phantasia as kinetic capacity generating continuous narrative (main thesis) | FULFILLED | Apply DRIFT-3 (acknowledge diachronic dimension) |
| 6 | line 41 — "Full defense of this rhetorical framing is developed in chapter ???" | UNFULFILLED-DEFERRED | Resolve ??? at C047; identify Chapter X |
| 7 | line 41 — Chapter "traces the architectural sequence through which 'mattering' is generated, with phantasia at its temporal center" | FULFILLED | Apply DRIFT-2 (sharpen temporal-center claim) |
| 8 | line 43 — Sustained interpretive reading of aisthēsis/phantasia/cognition/appetitive-action as SINGLE sequence | FULFILLED across §§1.1-1.5 | None |
| 9 | line 47 — "Several interpretive readings that go beyond what Aristotle explicitly states" (time without soul, dual-trace, orthogonal doxa, gate-keeping) | FULFILLED across §§1.1-1.3 | None |
| 10 | line 68 — Chapter roadmap explicitly enumerates A_0, A_1 → A_2, M_2 → A_3, M_3 → A_4 | FULFILLED with internal drift | Apply DRIFT-4 (line 64 A_2-A_3 conflation) and DRIFT-5 (line 68 M_3-A_4 roadmap mismatch) |
| 11 | line 68 — Chapter close with synthesis + transition to Chapter X engaging Heidegger/Rickert/Uexküll/Burke | UNFULFILLED-DEFERRED | §1.5 needs rework; Chapter X awaits writing |

Summary: **7 FULFILLED, 3 PARTIALLY-FULFILLED, 1 UNFULFILLED-DEFERRED**.

---

## TABLE C: Cross-section drift findings

| # | Type | From | To | Issue | Action | Effort |
|---|------|------|-----|-------|--------|--------|
| DRIFT-1 | coined-term-naming | C022 (§1.0 line 19) | §1.2 canonical | "resonant motion" → "resonant kinēsis" | TEXT_REPLACE + FOOTNOTE_FORWARD_POINT | small (2-3 min) |
| DRIFT-2 | architectural-mismatch | C042 (§1.0 line 41) | §1.3 (phantasma at A_3) | "Whole-chain temporal medium" framing too broad; phantasia is the soul's faculty (Heideggerian sense) but chain rests on A_0 + A_2 | REVISE_TEMPORAL_MEDIUM_CLAIM | small (5-10 min) |
| DRIFT-3 | synchronic-diachronic-conflation | C035 / C037 (§1.0 lines 32, 36) | §1.4 (synchronic-vs-diachronic) | "Continuous narrative" is synchronic-only; needs diachronic-saturation acknowledgment | ADD_FOOTNOTE | small (5 min) |
| DRIFT-4 | internal-inconsistency | C080 (§1.0 line 64) | C074 (§1.0 line 62) | A_2 → A_3 described as "completed cognitive actuality" but A_3 IS the phantasma (cognitive actuality is A_4) | REWRITE_A2_A3_DESCRIPTION | small (3-5 min) |
| DRIFT-5 | roadmap-numbering-drift | C091 (§1.0 line 68) | C074 (§1.0 line 62) | Roadmap says M_3 → A_4 is cognitive engagements but M_3 → A_4 is the orectic motion to action | SHARPEN_ROADMAP | small (5 min) |
| DRIFT-6 | coined-term-compression-mismatch | C055 / C092 (§1.0 lines 45, 68) | §1.4 (articulational-concretion) | "Resonant orexis flipped into pathē" elides tripartite distinction | OPTION_A_ADD_FOOTNOTE or OPTION_B_INTRODUCE_TRIAD | small (5-10 min) |

**Aggregate drift-correction budget**: ~30-45 min for all 6 drift items.

---

## TOTAL DISS-00-INTRO REMEDIATION ESTIMATE

| Activity | Items | Time |
|----------|-------|------|
| Citation gaps (T4/T5/T6/T7) | 16 | ~1.5-2 hours |
| Drift corrections | 6 | ~30-45 min |
| Promise resolution (Chapter X identification) | 2 (UNFUL-1, PART-2) | ~15 min (user decision) |
| **TOTAL** | **24 items** | **~2.5-3 hours** |

This makes §1.0 a **medium-effort revision target** — substantially less than §1.4's 4-5 hour estimate, but the architectural-mismatch drifts (DRIFT-2, DRIFT-4, DRIFT-5) carry **higher consequential weight** than typical citation gaps because they affect how the entire chapter's architecture is presented at the introduction's threshold.

---

**END OF DISS-00-INTRO CITATION GAP TABLE**
