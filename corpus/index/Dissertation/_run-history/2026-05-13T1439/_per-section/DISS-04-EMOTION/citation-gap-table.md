# Citation Gap Table — DISS-04-EMOTION

**Section**: §1.4 — Emotion is Motion | **Run-id**: 2026-05-13T1439
**Total flagged claims**: 46 of 306 (15.0%)
**Sorted by**: remediation effort (small→large) THEN severity (T6 > T5 > T8 > T4 > T7)
**Cache annotation**: each row tagged for likely overlap with the 244-entry MASTER-CITATION-REPORT (2026-05-10) per Plan §3.5.

## Tier breakdown

| Tier | Count | % of flagged | Implied action |
|------|-------|--------------|----------------|
| T6-unsupported | 0 | 0% | n/a |
| T5-under-supported | 24 | 52.2% | Add primary citation |
| T8-secondary-needed | 9 | 19.6% | Add secondary reinforcement |
| T4-interpretive-but-unflagged | 2 | 4.3% | Add interpretive flag |
| T7-overreach (mostly typos) | 11 | 23.9% | In-text fix |
| **TOTAL** | **46** | 100% | |

## Route breakdown

| Route | Count | Note |
|-------|-------|------|
| Tier A — corpus/index routable | 32 | Resolvable from existing pipelines (Aristotle, BCAP, BT, H&R, Phantasia Sec, Rickert) |
| Tier B — ChromaDB routable | 1 | Caston 2021 Cartesian Theatre (in corpus/download, awaits ChromaDB ingest) |
| Tier C — Perplexity / cache | 8 | All expected to be cache-hits from MASTER-CITATION-REPORT — zero net fresh Perplexity queries from this section |
| ****** placeholder manual fill | 1 | C291 (line 174) — user fills verbatim per `feedback-missing-source-placeholder.md` |
| In-text fix only | 4 | Typos, punctuation, user-decision items |

## Cache overlap analysis

Per Plan §3.5: the 244-entry MASTER-CITATION-REPORT (2026-05-10) covers OLD Pathe §§1.1-1.9 → ALL of DISS-04-EMOTION. **Expected cache hits**:

| Cache likelihood | Count | Implication |
|------------------|-------|-------------|
| cache-likely-strong | 24 | ★★★★ or ★★★ match in master report — direct verbatim + locus + insertion-anchor + rationale already prepared |
| cache-likely-supplementary | 9 | ★★ or ★ match — useful but optional |
| cache-likely-miss | 0 | none |
| n/a (purely internal / typo) | 13 | no external citation needed |

**Net Perplexity queries expected from DISS-04 in Phase 4**: ZERO. Per Plan §3.5.7 the 40-query budget is now free for §§1.0/1.1/1.2/1.3/1.5.

## Gap rows (sorted as specified)

### TRIVIAL effort — typos and punctuation (T7, 8 rows)

| # | Claim | Tier | Issue | Action | Effort | Cache |
|---|-------|------|-------|--------|--------|-------|
| 1 | C025 | T7 | Bekker typo "13789a21-22" → "1378a20-22" (line 9) | FIX_BEKKER_TYPO | trivial (30s) | n/a |
| 2 | C115 | T7 | "ON the Soul" → "On the Soul" (line 58) | FIX_TYPO | trivial (30s) | n/a |
| 3 | C167 | T7 | MA 8 Bekker "7022" → "702a2" (line 82) | FIX_BEKKER_TYPO | trivial (30s) | supplementary |
| 4 | C248 | T7 | "ontologicla" → "ontological" (line 128) | FIX_TYPO | trivial (15s) | n/a |
| 5 | C252 | T7 | "intot he"/"takin" (line 130) | FIX_TYPOS | trivial (30s) | n/a |
| 6 | C254 | T7 | "enmattered-accout"/"agner"/"metaphysics'" (line 130) | FIX_TYPOS | trivial (45s) | n/a |
| 7 | C256 | T7 | "occured" + missing paren (line 134) | FIX | trivial (30s) | n/a |
| 8 | C265 | T7 | Missing close paren (line 144) | FIX_PARENS | trivial (15s) | n/a |

**Aggregate effort**: ~4 minutes to clear the entire T7 cluster.

### SMALL effort — user-decision and renumbering (T4, 2 rows)

| # | Claim | Tier | Issue | Action | Effort | Cache |
|---|-------|------|-------|--------|--------|-------|
| 9 | C236 | T4 | "pathe/pathos?" in-text query at canonical-thesis site (line 120) | RESOLVE_USER_QUERY | small (user decision) | n/a |
| 10 | C227 | T4 | M→M / M→A drift in "settled-notation" meta-statement (lines 118, 124[partial], 144) | RENUMBERING_PATCH | small (3 sites + cross-ref update) | n/a |

### SMALL effort — corpus-routable T5 (16 rows)

All Tier A corpus/index routable. Bekker line additions + missing primary anchors.

| # | Claim | Tier | Issue | Best route | Cache |
|---|-------|------|-------|-----------|-------|
| 11 | C163 | T5 | MA causal chain at line 80 needs Bekker 701a29-b1 | corpus/index/Aristotle/MA 7 | strong |
| 12 | C165 | T5 | \\hl Loeb attribution at line 80 needs Bekker + edition | corpus/index/Aristotle/MA 7 | supplementary |
| 13 | C299 | T5 | Rhet. I.11, 1370a — needs line range | corpus/index/Aristotle/Rhet. I.11 | supplementary |
| 14 | C002 | T5 | basic affective valence definition (line 3) needs DA III.7 | corpus/index/Aristotle/DA III.7 | strong |
| 15 | C003 | T5 | resonant orexis definition (line 3) needs On Dreams + DA II.5 | corpus/index/Aristotle/On Dreams + DA II.5 | strong |
| 16 | C030 | T5 | resonant orexis canonical (line 9) needs On Dreams + DA II.5 | corpus/index/Aristotle/On Dreams + DA II.5 | strong |
| 17 | C031 | T5 | hedonic universalism (line 11) needs DA II.2 + BCAP 115 | corpus/index/Aristotle/DA II.2 + BCAP 115 | strong |
| 18 | C034 | T5 | perception-thinking mapping (line 11) needs DA III.3 + DA III.7 | corpus/index/Aristotle/DA III.3+III.7 | strong |
| 19 | C036 | T5 | articulational concretion canonical (line 11) needs DA II.5 | corpus/index/Aristotle/DA II.5 | strong |
| 20 | C045 | T5 | variable-presence diagnostic (line 19) needs MA 7 | corpus/index/Aristotle/MA 7 | supplementary |
| 21 | C046 | T5 | drinking case diagnostic (line 19) needs MA 7 + flag | corpus/index/Aristotle/MA 7 | supplementary |
| 22 | C048 | T5 | resolution restatement (line 19) needs DA II.5 + BCAP 132 | corpus/index/Aristotle/DA II.5 + BCAP 132 | strong |
| 23 | C059 | T5 | extension to anger/fear (line 23) needs BCAP 132 | corpus/index/BCAP 132 | strong |
| 24 | C060 | T5 | hedonic universalism restated (line 23) needs DA II.2 + BCAP 115 | corpus/index/Aristotle/DA II.2 + BCAP 115 | strong |
| 25 | C066 | T5 | dimensional independence illustration (line 23) needs MA 7 | corpus/index/Aristotle/MA 7 | supplementary |
| 26 | C080 | T5 | \\hl(CITE) placeholder line 33 — SZ §31-32 anchor for "understanding/discourse grounded in attunement" | corpus/index/BT §31-32 | supplementary |

### SMALL effort — \\hl marker resolution (3 rows)

| # | Claim | Tier | Issue | Action | Cache |
|---|-------|------|-------|--------|-------|
| 27 | C140 | T5 | \\hl on "or contain true explanatory value" (line 64) | RESOLVE_HL | n/a |
| 28 | C142 | T5 | \\hl on structural-constraint sentence (line 64) | RESOLVE_HL + cross-ref | n/a |
| 29 | C166 | T5 | \\hl on "this is further indicated…" (line 82) | RESOLVE_HL | n/a |

### SMALL effort — fourfold-at-basic-valence support (3 rows)

These should resolve naturally as the (i) Met. fourfold relocates to §1.2 with bridge text; until then they need DA II.5 anchors in §1.4.

| # | Claim | Tier | Issue | Best route | Cache |
|---|-------|------|-------|-----------|-------|
| 30 | C100 | T5 | alterability at aisthēsis (line 48) needs DA II.5 | corpus/index/Aristotle/DA II.5 | strong |
| 31 | C101 | T5 | energeia of aisthētikon (line 48) needs DA II.5 | corpus/index/Aristotle/DA II.5 | strong |
| 32 | C206 | T5 | Stimmung-saturation mechanism (line 104) needs SZ §29 H.137 | corpus/index/BT §29 | supplementary |

### SMALL-to-MEDIUM effort — interpretive-move flag + secondary

| # | Claim | Tier | Issue | Action | Cache |
|---|-------|------|-------|--------|-------|
| 44 | C062 | T5 | Three-dimensional magnitude-axis (hedonic intensity × existential weight × cognitive articulation) is novel; needs explicit flag + BCAP 132 | ADD_FLAG + corpus/index/BCAP 132 | supplementary |

### SMALL effort — T8 secondary reinforcement (8 rows)

All Tier A corpus/index. Author-prominent style allows for trim insertions.

| # | Claim | Tier | Issue | Best route | Cache |
|---|-------|------|-------|-----------|-------|
| 34 | C008 | T8 | pathē-as-soul-kinēsis needs Caston/Frede secondary | corpus/index/Phantasia Sec/Caston 1995 | strong |
| 35 | C018 | T8 | etymology-Aristotle bridge needs DA III.10 secondary | corpus/index/Aristotle/DA III.10 | supplementary |
| 36 | C027 | T8 | overlap-of-pathos-senses warning needs BCAP 131-132 | corpus/index/BCAP 131-132 | strong |
| 37 | C032 | T8 | basic affective valence canonical needs BCAP 115 | corpus/index/BCAP 115 | strong |
| 38 | C106 | T8 | defense of Rhetoric-as-ontological needs BCAP 115 | corpus/index/BCAP 115 | strong |
| 39 | C181 | T8 | doxa-non-deliberative reading needs DA III.3 secondary | corpus/index/Aristotle/DA III.3 | supplementary |
| 40 | C190 | T8 | non-identity of faculties needs Caston 2021 Cartesian Theatre | Tier B (ChromaDB) + corpus/index/Phantasia Sec/Caston 1995 | strong (corpus/download) |
| 41 | C232 | T8 | fear-as-form-of-desire could anchor to Rhet. II.5 | corpus/index/Aristotle/Rhet. II.5 | strong |
| 42 | C292 | T8 | per-pathos hexis correlate needs NE II-IV | corpus/index/Aristotle/NE II-IV | supplementary |
| 43 | C302 | T8 | rhetoric-as-phantasmatic-reshaping needs Hawhee + Rickert | corpus/index/Hawhee 2011 + Rickert | strong |

### MEDIUM effort — content development gaps (3 rows)

| # | Claim | Tier | Issue | Action | Effort | Cache |
|---|-------|------|-------|--------|--------|-------|
| 33 | C291 | T5 | \\textbf{******} placeholder at line 174 — BCAP page + verbatim for "pathē and hexeis as fundamental concepts" | RESOLVE_PLACEHOLDER_MANUAL_FILL | medium — user locates verbatim per `feedback-missing-source-placeholder.md` | strong |
| 45 | C257 | T5 | \\inlinenote at line 138: "develop the social aspects… and locate it in earlier section" — Mitsein development gap | DEVELOP — relocates to §1.2 with back-reference from §1.4 | medium | strong |
| 46 | C262 | T5 | \\inlinenote at line 148: "Include a worked example using thirst example for illustration" | DEVELOP_WORKED_EXAMPLE in-place | medium (user writes example) | n/a (MA 7 is anchor) |

## Aggregate

- **Trivial effort**: 11 items (typos + missing parens) — ~5 min
- **Small effort**: 30 items (Bekker additions + secondary insertions + flag additions + \\hl resolutions) — ~3 hours
- **Medium effort**: 5 items (placeholder fill, Mitsein development, worked example, three-dimensional-axis flag) — ~3 hours

**Total revision time for §1.4 to clear all 46 gaps**: ~6 hours of focused work + the manual ****** fill (user-pace).

## Cross-reference cleanup (not in the 46 gaps; structural debt)

Beyond the 46 cited gaps, the section has several stale internal cross-references using OLD chapter-numbering (`§1.7`, `§1.8`, "next chapter") that now refer to internal subsections (S7, S8) of §1.4 itself. These require disambiguation:

- C227 (line 118): "(cf. §1.7)" → "(cf. the feedback-loop subsection above)"
- C258 (line 140): "§1.3's analysis of DA I.1" → "the Enmattered-Accounts subsection above"
- C258 (line 140): "§1.5 specified the same moment from the action-theoretic side" → "the Somatic-Preparation subsection above"
- C260 (line 142): "§1.7's analysis of the synchronic chain" → "the Feedback-Loop subsection above"
- C264 (line 144): "§1.8's analysis of the chain at M₃→M₄" → "the Emotion's-Function subsection above"
- C287 (line 172): "feedback structure of which §1.7 has specified" → "the feedback structure specified above"
- C293 (line 174): "§1.7's analysis of the diachronic register" → "the diachronic-saturation analysis above"
- C306 (line 184): "temporal sedimentation specified in §1.7" → "the temporal sedimentation specified above"

Estimated effort: 30 min (small).

## Recommendation for revision order (per Plan G8)

1. **Trivial T7 typo pass** (4 min) — clears 8 surface defects in one editorial pass
2. **Renumbering patch** (10 min) — fix lines 118, 124[partial], 144 to M→A; update cross-refs
3. **\\hl marker resolution** (30 min) — lines 33, 64×2, 80, 82 either tighten or fill citation
4. **Bekker-addition pass** (45 min) — add precise Bekker line ranges to all T5 corpus-routable claims (rows 11-26, 30-32)
5. **Secondary-citation insertion pass** (60 min) — add corpus/index secondary anchors to T8 rows (34-43)
6. **Cross-reference cleanup** (30 min) — fix the 8 stale §-references
7. **C062 three-dimensional axis flag** (10 min) — explicit interpretive flagging on the novel architectural move
8. **\\inlinenote development** (3 hours) — Mitsein development (relocates to §1.2 with back-ref), worked thirst example, three-dimensional axis development
9. **C291 manual ****** fill** (user-pace) — locate BCAP verbatim per `feedback-missing-source-placeholder.md`
10. **Three relocation source patches** (independent — coordinated with §1.2 revision)
