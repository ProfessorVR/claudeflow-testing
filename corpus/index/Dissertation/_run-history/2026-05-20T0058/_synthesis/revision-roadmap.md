# Dissertation Revision Roadmap — Post-Marathon Re-run

**Run-id**: 2026-05-20T0058  
**Previous run-id**: 2026-05-13T1439  
**Status**: ✓ MARATHON COMPLETE — section work substantially done; remaining items are low-effort polish


## Headline

The 6-section citation marathon (2026-05-19) + user post-cleanup (2026-05-20) resolved the vast majority of prior-run findings. **All structural and architectural debts from prior run are closed.** Remaining items are typo-level polish + low-priority enrichment.

## Total scope (this cycle's results)

| Metric | Prior run | This run | Δ |
|---|---:|---:|---:|
| Citation gaps (detailed list) | 154 (of 207 total) | 144 RESOLVED + 7 REMAINING + 3 DEFERRED | -144 RESOLVED ✓ |
| Total citation gaps including enrichment | 207 | ~162 RESOLVED + ~45 DEFERRED | -78% gap-burden ✓ |
| Inconsistencies (21 prior) | 21 | 13 RESOLVED + 5 REMAINING + 1 INTENTIONAL + 1 PARTIAL + 1 CHECK | -14 RESOLVED ✓ |
| ****** placeholders | 11 | 0 | -11 ✓ |
| UNVERIFIED markers (intra-marathon) | (n/a) | 0 | post-cleanup CLEAN ✓ |
| Mₙ→Mₙ₊₁ old form | partial in §1.1/§1.4/§1.5 | 0 | -all ✓ |
| Footnotes (total) | 84 | 109 | +25 |
| Word count (§§1.0-1.5) | 41,728 | 56,713 | +14,985 (+35.9%) |
| Citation-fill files produced | 154 | inherited; no new produced | (cache-first policy) |
| Perplexity spend | $2.33 / 17 queries | $0.00 / 0 queries | 0 spend this run |

## Critical-path tasks — all COMPLETE

| Step | Prior status | This run | Resolution |
|---|---|---|---|
| 1. Terminology clarification (Q1-Q4) | OPEN (USER DECISION REQUIRED) | RESOLVED | terminology-decisions-final.md (user-locked 2026-05-13) all migrations applied |
| 2. Mechanical numbering migration | OPEN (33+ patches) | RESOLVED | Sessions 1-3c + diagram Step 7 reconciliation; 0 old-form residue |
| 3. Relocations (REL-001/-002/-003) | OPEN (90-180 min user effort) | RESOLVED | Step 5 integrated all three at §1.2; brace 401=401 |
| 4. Diagram static exports | OPEN | DEFERRED (low priority, not blocking) | TikZ exports per-section deferred — diagram source updated per Step 7 |
| 5. Hexeis/settled-doxai development | OPEN | RESOLVED | Step 7 — diagram bisected TECHNE/PRAXIS + §1.4 L174 hexis-bivalence paragraph + §1.5 L25 cross-ref |
| 6. Burke pp.280-281 correction | OPEN | RESOLVED | Session 2 — pp.253 + pp.261-262 |
| 7. Hawhee Bodily Arts → Rhetorical Vision | OPEN | RESOLVED | Session 2 |

## Section-by-section status

| Section | Word count | Citation gaps RESOLVED / total | Inconsistencies (unresolved) | Effort remaining |
|---|---:|---|---|---|
| DISS-00-INTRO | 8270 | **14/16** | 0 | 2 item(s); typo-polish |
| DISS-01-A0 | 7488 | **18/18** | 0 | ✓ DONE |
| DISS-02-A1A2 | 8549 | **12/12** | 0 | ✓ DONE |
| DISS-03-A3 | 12136 | **31/32** | 0 | 1 item(s); typo-polish |
| DISS-04-EMOTION | 14248 | **41/46** | 7 | 5 item(s); typo-polish |
| DISS-05-A4 | 6022 | **28/30** | 0 | 2 item(s); typo-polish |

## Remaining work (low-priority polish)

### §1.0 (1 PARTIAL-DEFERRED)

- DISS-00-G02: Diagram + full-page reformat \inlinenote at L70 — PDF compile / layout concern, not citation-gap

### §1.3 (1 REMAINING)

- DISS-03-G05: L9 footnote{Quotation, definition, point.} placeholder — user supplies Burke RoM definition of identification

### §1.4 (5 REMAINING — all trivial typos)

- DISS-04-G02: 'ON the Soul' typo at L63 (capitalization)
- DISS-04-G03: '7022' Bekker typo at L69 (701b33-7022 should be 701b33-702a3)
- DISS-04-G04: 'ontologicla' typo at L115
- DISS-04-G05/G06: '(pathe/pathos?)' marker at L107 — user-internal uncertainty (load-bearing canonical site)
- **NEW-01** (this run): 'thought it includes' typo at L51 (should be 'though it includes')
- **NEW-02** (this run): 'implicity' typo at L63 (should be 'implicitly')

### §1.5 (2 PARTIAL-DEFERRED)

- DISS-05-additional-batch: ~36-50 enrichment Bekker citations (Tier A non-load-bearing); deferred per non-load-bearing skip-rule
- DISS-05-blocked-batch: ~14 upstream-blocked items now unblocked by marathon completion; deferred for final polish pass
- Bibliographic verifications: Sherman 1989, Aubenque 1963, Broadie 1991, McNeill 1999 entries
- Ross 'good temper' rendering vs. alternatives
- Rhet II.1 Bekker edition-discrepancy (prose 1378a24 vs. corpus/index 1378a20-22)

## Estimated user effort remaining

- 5 §1.4 trivial typos (NEW-01, NEW-02 + G02-G06): **5-10 min total** (Find/Replace)
- §1.3 G05 Burke RoM definition: **15-30 min** (locate quote in user's RoM copy)
- §1.5 bibliographic verifications: **30-60 min**
- §1.5 enrichment fills (if desired): **2-4 hours** (optional non-load-bearing enrichment)
- §1.0 diagram reformat: **30-60 min** (PDF compile concern, not citation-gap)

**Total to declare revision complete**: ~50-100 min for blocking items; ~3-5 hr including all polish.

## Next pipeline action

1. User completes remaining ~5-10 minutes of trivial §1.4 typo Find/Replace + §1.3 G05 Burke quote insertion
2. User reviews per-section revision-checklist.md files for any items not yet acted on
3. Optional: re-run pipeline after user polish to confirm 100% citation-gap closure
4. Declare revision complete and proceed to final dissertation compilation