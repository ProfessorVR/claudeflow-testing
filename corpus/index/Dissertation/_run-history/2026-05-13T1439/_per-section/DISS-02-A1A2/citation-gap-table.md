# DISS-02-A1A2 Citation Gap Table

**Section**: §1.2 — A_1 → A_2: The Actualization of Perception
**Run-ID**: 2026-05-13T1439
**Total flagged claims**: 16
**Sort order**: remediation_effort (small→large) THEN severity (T6 > T5 > T8 > T4 > T7)

---

## Summary by Tier

| Tier | Count |
|------|-------|
| T5-under-supported | 13 |
| T8-secondary-needed | 3 |
| T4-interpretive-but-unflagged | 0 |
| T6-unsupported | 0 |
| T7-overreach | 0 |

## Summary by Route

| Route | Count |
|-------|-------|
| Tier A (corpus-index-routable) | 11 |
| Tier B (chromadb-routable) | 0 |
| Tier C (perplexity-or-cache) | 0 |
| Asterisk placeholder (manual fill) | 6 |
| In-text fix only (no external lookup) | 5 |

---

## Asterisk Placeholders (6 instances, 4 lines)

| Line | # | Locus | Status | Verbatim in Corpus? |
|------|---|-------|--------|---------------------|
| 23 | 1 | BCAP 126 — perception-as-*kritikon* | T5 | YES (`corpus/index/Heidegger - BCAP/bcap-analysis/phase2-u-fp3c.md`, SS17b-beta) |
| 23 | 2 | White, *Meaning of Phantasia*, pp. 9-11 — *to kritikon* unifying | T5 | UNCERTAIN (verify `corpus/index/Aristotelian Phantasia Secondary`) |
| 47 | 1 | BCAP 131-132 — progressive-narrowing + *sōtēria* | T5 | YES (`corpus/index/Heidegger - BCAP/bcap-analysis/phase2-u-fp3c.md`) |
| 55 | 1 | White, op. cit., p. 498 — resonant phantasia | T5 | UNCERTAIN |
| 79 | 1 | BCAP 164 — *hēdonē* in-the-moment | T5 | YES (BCAP material) |
| 79 | 2 | BCAP 166 — *hēdonē*/*lypē* co-given | T5 | YES (BCAP material) |

**PHASE 1 METADATA DISCREPANCY**: Phase 1 recorded 4 placeholders; actual count is 6 (lines 23 and 79 each contain two). Update `phase1-metadata.json` field `asterisk_placeholders: 4 → 6`.

---

## Gaps (ranked)

### Rank 1 — DISS-02-C033 (T5) — line 23
**Issue**: ASTERISK PLACEHOLDER #1 — BCAP 126 perception-as-*kritikon* quotation missing.
**Action**: `FILL_ASTERISK_PLACEHOLDER`
**Corpus source**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3c.md` (SS17b-beta, pp. 126-127). VERIFIED CONTAINS the relevant passage.
**Effort**: small (5-10 min).
**RELOCATION STATUS**: This placeholder is the §1.4 → §1.2 RELOCATION TARGET (iii). The §1.4 source-claim `DISS-04-C114` contains the same BCAP 126 quotation. Verbatim should match.

---

### Rank 2 — DISS-02-C075 (T5) — line 47
**Issue**: ASTERISK PLACEHOLDER #3 — BCAP 131-132 progressive-narrowing/sōtēria quotation missing.
**Action**: `FILL_ASTERISK_PLACEHOLDER`
**Corpus source**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3c.md`. VERIFIED CONTAINS BCAP 131-132 sōtēria material.
**Effort**: small (5-10 min).
**RELOCATION STATUS**: This placeholder is the §1.4 → §1.2 RELOCATION TARGET (i). The §1.4 source-claims `DISS-04-C084` through `C098` contain the relevant material.

---

### Rank 3 — DISS-02-C091 (T5) — line 55
**Issue**: ASTERISK PLACEHOLDER #4 — White p. 498 ("lingering, resonating, echoing presence...") quotation missing.
**Action**: `FILL_ASTERISK_PLACEHOLDER`
**Corpus source**: Verify `corpus/index/Aristotelian Phantasia Secondary` for White's *Meaning of Phantasia*.
**Perplexity fallback**: "Stephen White Meaning of Phantasia in Aristotle's De Anima III.3-8 page 498 resonant phantasia residual sensation"
**Effort**: small (5-10 min).

---

### Rank 4 — DISS-02-C120 (T5) — line 79
**Issue**: ASTERISK PLACEHOLDER #5 — BCAP 164 *hēdonē*-in-the-moment quotation missing.
**Action**: `FILL_ASTERISK_PLACEHOLDER`
**Corpus source**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis` (BCAP 164).
**Effort**: small (5-10 min).

---

### Rank 5 — DISS-02-C121 (T5) — line 79
**Issue**: ASTERISK PLACEHOLDER #6 — BCAP 166 *hēdonē*-co-given quotation missing.
**Action**: `FILL_ASTERISK_PLACEHOLDER`
**Corpus source**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis` (BCAP 166).
**Effort**: small (5-10 min).

---

### Rank 6 — DISS-02-C036 (T5) — line 23
**Issue**: ASTERISK PLACEHOLDER #2 — White, *Meaning of Phantasia*, pp. 9-11 quotation missing.
**Action**: `FILL_ASTERISK_PLACEHOLDER`
**Corpus source**: Verify `corpus/index/Aristotelian Phantasia Secondary` for White at pp. 9-11.
**Perplexity fallback**: "Stephen White Meaning of Phantasia Aristotle De Anima III.3-8 to kritikon pp 9-11"
**Effort**: small (5-10 min).

---

### Rank 7 — DISS-02-C003 (T5) — line 5
**Issue**: Three-factor schema applied to perception lacks Bekker locus (DA III.10, 433b12-25) for originating passage.
**Action**: `ADD_PRIMARY_CITATION`
**Corpus source**: `corpus/index/Aristotle - Complete Works/De Anima III.10`.
**Effort**: small (3-5 min).

---

### Rank 8 — DISS-02-C021 (T5) — line 15
**Issue**: Footnote citations to Burnyeat / Sorabji / Caston are by short-title only; full bibliographic entries required.
**Action**: `ADD_BIBLIOGRAPHIC_DATA`
**Corpus source**: `corpus/index/Aristotelian Phantasia Secondary`.
**Effort**: small (5 min).

---

### Rank 9 — DISS-02-C153 (T5) — line 55 (LATENT TENSION, analyst-flagged)
**Issue**: The coinage "resonant kinēsis" names the residual motion as kinēsis without dialectical justification for the applicability of the canonical *Physics* III.1 (201a10-11) kinesis definition (which presupposes mover-moved unity). The residual motion is sustained in the absence of the mover that originated it.
**Action**: `ADD_CITATION+CLARIFY`
**Corpus source**: `corpus/index/Aristotle - Complete Works/Physics III.1-2`; cross-reference §1.1 treatment of *energeia ateles*.
**Effort**: medium (15-20 min — requires one-paragraph footnote or short addition).

---

### Rank 10-13 — DISS-02-C154 / C155 / C156 / C157 (T5)
**Issue**: Analyst-record duplicates of the asterisk placeholders, recorded separately for Phase 3 traceability.
**Action**: Same as ranks 1-6.
**Effort**: Subsumed within ranks 1-6.

---

### Rank 14 — DISS-02-C129 (T8) — line 83
**Issue**: Higher-order pathē Rhetoric definitions (anger, fear, pity) paraphrased without Bekker citations.
**Action**: `ADD_PRIMARY_CITATION`
**Corpus source**: `corpus/index/Aristotle - Complete Works/Rhetoric II.2` (anger 1378a31), `II.5` (fear 1382a21), `II.8` (pity 1385b13).
**Cache overlap**: cache-likely-strong (Rhet. II.2/II.5/II.8 definitions multiply-cited in MASTER-CITATION-REPORT).
**Effort**: small (5 min).

---

### Rank 15 — DISS-02-C146 (T8) — line 99
**Issue**: Animal-locomotion deferral names Nussbaum (*De Motu Animalium*) and Caston (*phantasia* in animal cognition) as principal interlocutors without full citations.
**Action**: `ADD_SECONDARY_CITATION_IF_DEFERRAL_DEVELOPED`
**Corpus source**: `corpus/index/Aristotelian Phantasia Secondary`.
**Perplexity fallback**: "Nussbaum Aristotle De Motu Animalium 1978/1985 commentary bibliography; Caston phantasia animal cognition bibliography".
**Cache overlap**: cache-possible (Nussbaum is in MASTER-CITATION-REPORT).
**Effort**: medium (only if deferral is developed; otherwise none required for deferral as stated).

---

### Rank 16 — DISS-02-C158 (T8) — phase 1 metadata
**Issue**: Phase 1 metadata records `asterisk_placeholders: 4` and `asterisk_lines: [23, 47, 55, 79]`, but actual placeholder count is 6 (lines 23 and 79 each contain two placeholders).
**Action**: `UPDATE_PHASE_1_METADATA`
**Effort**: trivial (1 min) — update fields to `asterisk_placeholders: 6` and `asterisk_lines: [23, 23, 47, 55, 79, 79]`.

---

## Remediation Summary

| Category | Count |
|----------|-------|
| Total gaps logged | 16 |
| Deduplicated actual actions | 12 |
| `FILL_ASTERISK_PLACEHOLDER` | 6 (deduplicated to 6 distinct loci) |
| `ADD_PRIMARY_CITATION` | 2 (Rhetoric definitions; DA III.10 anchor) |
| `ADD_BIBLIOGRAPHIC_DATA` | 1 (Burnyeat/Sorabji/Caston) |
| `ADD_CITATION+CLARIFY` | 1 (kinesis-applicability latent tension) |
| `ADD_SECONDARY_CITATION_IF_DEFERRAL_DEVELOPED` | 1 (Nussbaum/Caston) |
| `UPDATE_PHASE_1_METADATA` | 1 (placeholder count) |

**By effort**: 1 trivial, 13 small, 2 medium, 0 large.
**Estimated total effort**: 1.5-2.5 hours for all 12 deduplicated actions.

---

## Relocation-Dependency Resolution Forecast

The three user-mandated §1.4 → §1.2 relocations will auto-resolve **5 of 6 asterisk placeholders + the Rhetoric citation gap**:

| Relocation | Resolves |
|------------|----------|
| (i) *pathos*-Metaphysics-fourfold | C075 (BCAP 131-132 verbatim) + extends C069 / C074 fourfold treatment |
| (ii) *paschein*-preservation/destruction | extends C062 (already-anchored at DA II.5, 417a21-b2) |
| (iii) Perception-as-*krisis* (BCAP 126) | C033 (BCAP 126 verbatim) + extends §S2 kritikon treatment |

**Remaining gaps after relocations land** (estimated 6 actions, 1-2 hours):
- C036 / C155 — White pp. 9-11 verbatim (no relocation-source)
- C091 / C157 — White p. 498 verbatim (no relocation-source)
- C120 — BCAP 164 verbatim (independent, line 79)
- C121 — BCAP 166 verbatim (independent, line 79)
- C129 — Rhetoric Bekkers (small fix)
- C003 — DA III.10 citation (small fix)
- C021 — bibliographic data (small fix)
- C146 — Nussbaum/Caston deferral citations (conditional on deferral development)
- C153 — kinesis-applicability latent tension (medium clarification)
