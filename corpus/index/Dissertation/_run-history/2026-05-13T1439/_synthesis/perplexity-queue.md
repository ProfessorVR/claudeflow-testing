# Perplexity Queue — Dissertation Analysis Pipeline

**Run ID**: `2026-05-13T1439`
**Schema**: Plan v1.4 §9.4 + §10
**Agent**: Phase 3 Wave 4 Agent G (Citation Gap Master + Corpus Routing + Perplexity Queue)
**Generated**: 2026-05-13

## Summary

| Field | Value |
|---|---|
| Initial allocation per Plan §10 | 40 queries |
| Monetary cap | $100 USD |
| **Total queries queued** | **17** |
| S1 (sonar-pro+low, ~$0.015) | 8 |
| S2 (sonar-pro+medium, ~$0.04) | 7 |
| S3 (sonar-deep-research, ~$2.50) | 2 |
| Estimated initial cost | ~$5.40 USD |
| Remaining capacity | 23 queries / $94.60 USD |
| Pause thresholds | 36 queries / $20 USD remaining |

## Escalation Policy (Plan §10)

`S1 (sonar-pro low) → S2 (sonar-pro medium) → S3 (sonar-deep-research)` with 3 attempts/gap maximum. Pause and reassess before invoking S3 on critical claims.

## Source-priority discipline

Per `feedback-corpus-index-first.md`: **corpus/index FIRST → ChromaDB → Perplexity**. All Tier C gaps below have been screened against the corpus/index pipelines. Queries are issued ONLY for material not resolvable through corpus pipelines.

---

## Queue Categorization

| Category | Count | Sections |
|---|---|---|
| Fresh secondary literature (Sherman/Aubenque/Bostock) | 5 | DISS-05 |
| Burke page-number verification | 2 | DISS-01 |
| Hawhee work-title verification | 1 | DISS-01 |
| Bekker line verification (Phys. IV.14, Met. XI) | 1 | DISS-01 |
| Coope/Broadie secondary engagement | 1 | DISS-01 |
| GA 3 Kant book productive imagination | 1 | DISS-01 |
| White phantasia placeholders (2x) | 2 | DISS-02 |
| Burnyeat/Sorabji/Caston bibliographic | 1 | DISS-02 |
| Papachristou/Aquinas verification | 1 | DISS-03 |
| Deep-research critical synthesis (S3) | 2 | DISS-05 |
| **Total** | **17** | |

## Deferred (No Query Needed)

- **DISS-04-EMOTION (all 46 gaps)**: The 244-entry MASTER-CITATION-REPORT covers OLD Pathe §§1.1-1.9 = all of DISS-04. Phase 3.5 cache reconciliation will resolve via cache. NET fresh-perplexity queries from §1.4: **0**.
- **DISS-00-INTRO Tier C (1 gap)**: Reroutable via corpus/index Aristotle/Heidegger pipelines once internal forward-references resolved.

---

## Queries

### Q-001 — Sherman/Aubenque on hexis-formation through emotional response

- **Section**: DISS-05-A4 | **Gap**: DISS-05-C070 | **Step**: S2 | **Cost**: ~$0.04
- **Priority**: ★★★★ | **Severity**: CRITICAL-DISSERTATION-NOVEL | **Load-bearing**: yes
- **Query**: Sherman 1989 *Fabric of Character* ch.5 (the character of fear; nature of cowardice and courage) — verbatim on the formation of hexeis through repeated emotional response. Aristotle NE II.1-6 habituation cluster.
- **Rationale**: Master synthesis claim of §1.5. Type 3 praxis-hexeis as sedimented affect is dissertation-novel; needs strongest secondary anchor available.
- **Cache overlap**: n/a (not in MASTER-CITATION-REPORT).

### Q-002 — Sherman/Aubenque on technē/praxis-hexis distinction

- **Section**: DISS-05-A4 | **Gap**: DISS-05-C031 | **Step**: S2 | **Cost**: ~$0.04
- **Priority**: ★★★★ | **Severity**: CRITICAL-DISSERTATION-NOVEL | **Load-bearing**: yes
- **Query**: Sherman 1989 *Fabric of Character* OR Aubenque 1963 *La prudence chez Aristote* — verbatim on the distinction between technē-based habituation and praxis-based habituation in Aristotle's *Nicomachean Ethics*; how this bivalence grounds emotional comportment.
- **Rationale**: §1.5 master synthesis — alignment of three-types catalog with technē/praxis distinction; dissertation's signature interpretive move.

### Q-003 — Sherman/Brennan on Rhetoric II ēthos-hexis conditioning

- **Section**: DISS-05-A4 | **Gap**: DISS-05-C076 | **Step**: S2 | **Cost**: ~$0.04
- **Priority**: ★★★ | **Severity**: architectural-novel | **Load-bearing**: yes
- **Query**: Sherman 1989 OR Brennan 2003 — verbatim on Rhetoric II's presupposition of ēthos-hexis-conditioning of pathos arousal; how hexeis modulate both input-to-doxa and doxa-gating in Aristotle.
- **Rationale**: Two-modulation architectural elaboration; dissertation-novel.

### Q-004 — Bostock on Met. Δ 20 1022b4 hexis-as-energeia

- **Section**: DISS-05-A4 | **Gap**: DISS-05-C025 | **Step**: S1 | **Cost**: ~$0.015
- **Priority**: ★★★ | **Severity**: verbatim-verification
- **Query**: Bostock Aristotle Metaphysics commentary — verbatim on Met. Δ 20 1022b4: hexis as the energeia of the haver and the had. Provide exact page reference.

### Q-005 — Bostock on Met. Δ 12 1019a15 hexis-as-dynamis

- **Section**: DISS-05-A4 | **Gap**: DISS-05-C072 | **Step**: S1 | **Cost**: ~$0.015
- **Priority**: ★★★ | **Severity**: verbatim-verification
- **Query**: Bostock Aristotle Metaphysics commentary — verbatim on Met. Δ 12 1019a15: hexis as dynamis with active-passive bivalence.

### Q-006 — Burke pp. 280-281 vs 261-262 actuality-precedes-potentiality

- **Section**: DISS-01-A0 | **Gap**: DISS-01-G05 (C016) | **Step**: S1 | **Cost**: ~$0.015
- **Priority**: ★★★★ | **Severity**: HIGH | **Load-bearing**: yes
- **Query**: Burke *A Grammar of Motives* 1945 — 'one actuality always precedes another in time right back to the actuality of the eternal prime mover' AND 'man is prior to boy because man has already attained its complete form'. Confirm whether these quotes appear at pp. 261-262 (Burke - Act chapter) versus pp. 280-281 (Burke - Agent chapter).
- **Rationale**: Load-bearing for iterated-chain architectural argument. Try `corpus/index/A Grammar of Motives (Burke 1945)/Burke - Act (Aristotle and Aquinas)/gm-06-deep` first; Perplexity as cross-check only.

### Q-007 — Burke pp. 214-215 'conditions of an organism's existence' VERIFY

- **Section**: DISS-01-A0 | **Gap**: DISS-01-G06 (C088) | **Step**: S1 | **Cost**: ~$0.015
- **Priority**: ★★ | **Severity**: MEDIUM
- **Query**: Burke *A Grammar of Motives* — verbatim 'conditions are likewise contextual, as with the conditions of an organism's existence'. Confirm page number: Agent chapter Santayana section pp. 214-215 OR Scene chapter Darwin section pp. 152-159 ('Conditions of Existence').

### Q-008 — Hawhee Bodily Arts vs Rhetorical Vision (2011) p. 154

- **Section**: DISS-01-A0 | **Gap**: DISS-01-G07 (C033) | **Step**: S1 | **Cost**: ~$0.015
- **Priority**: ★★ | **Severity**: MEDIUM
- **Query**: Hawhee Debra — 'energeia means the presence of the thing'. Confirm whether this verbatim appears at Hawhee 2004 *Bodily Arts* p. 154 OR Hawhee 2011 'Rhetorical Vision: Looking with Aristotle' p. 154 (Western Journal of Communication).
- **Cache overlap**: cache-possible (Hawhee 2011 in MASTER-CITATION-REPORT per Phase 3 analysis).

### Q-009 — Phys. IV.14 223a25-27 vs 223a21-26 Bekker range

- **Section**: DISS-01-A0 | **Gap**: DISS-01-G08 (C141) | **Step**: S1 | **Cost**: ~$0.015
- **Priority**: ★★★★ | **Severity**: HIGH | **Load-bearing**: yes
- **Query**: Aristotle Physics IV.14 Bekker — 'if nothing but soul, or in soul reason, is qualified to count, it is impossible for there to be time unless there is soul'. Provide exact Bekker line range from Ross or Barnes Princeton edition.

### Q-010 — Coope (2005) + Broadie on 'time without soul' strong/weak reading

- **Section**: DISS-01-A0 | **Gap**: DISS-01-G14 (C144) | **Step**: S2 | **Cost**: ~$0.04
- **Priority**: ★★★★ | **Severity**: HIGH | **Load-bearing**: yes
- **Query**: Coope Ursula *Time for Aristotle* 2005 AND Broadie Sarah commentary on Physics IV.14 — verbatim quotations on the 'time without soul' counting passage, strong-vs-weak reading distinction. Provide bibliographic data and key page references.
- **Cache overlap**: cache-likely-supplementary (corpus/index Bowin 2017 cites both throughout — primary route).

### Q-011 — Heidegger GA 3 productive imagination locus

- **Section**: DISS-01-A0 | **Gap**: DISS-01-G15 (C158) | **Step**: S1 | **Cost**: ~$0.015
- **Priority**: ★★ | **Severity**: LOW
- **Query**: Heidegger *Kant and the Problem of Metaphysics* GA 3 — verbatim on productive imagination as the temporalizing-synthesis that knits the three ecstases into the unity of originary temporality. Provide specific section and page from Taft translation OR Klostermann pagination.
- **Rationale**: GA 3 not in corpus/index; Perplexity is appropriate route.

### Q-012 — White pp. 9-11 on to kritikon

- **Section**: DISS-02-A1A2 | **Gap**: DISS-02-C036 (placeholder #2) | **Step**: S1 | **Cost**: ~$0.015
- **Priority**: ★★★ | **Severity**: MEDIUM
- **Query**: Stephen A. White 'The Meaning of Phantasia in Aristotle's De Anima III, 3-8' — verbatim on to kritikon (the discriminating capacity) as the unifying capacity connecting perception, phantasia, and thought, at pp. 9-11.
- **Rationale**: asterisk-six placeholder fill. corpus/index Aristotelian Phantasia Secondary route first; Perplexity if White not indexed.

### Q-013 — White p. 498 resonant phantasia 'lingering, echoing presence'

- **Section**: DISS-02-A1A2 | **Gap**: DISS-02-C091 (placeholder #4) | **Step**: S1 | **Cost**: ~$0.015
- **Priority**: ★★★ | **Severity**: MEDIUM | **Load-bearing**: yes
- **Query**: Stephen A. White 'The Meaning of Phantasia in Aristotle's De Anima III, 3-8' OR companion paper — verbatim quote at p. 498: 'lingering, resonating, echoing presence of sensible forms freed from their original matter'. Verify publication and page.
- **Rationale**: Direct support for resonant-kinēsis architectural argument; placeholder fill.

### Q-014 — Burnyeat/Sorabji/Caston bibliographic completion

- **Section**: DISS-02-A1A2 | **Gap**: DISS-02-C021 | **Step**: S1 | **Cost**: ~$0.015
- **Priority**: ★★ | **Severity**: LOW
- **Query**: Provide full bibliographic data: (1) Burnyeat Myles 'Is an Aristotelian Philosophy of Mind Still Credible?' — publisher, year, pages; (2) Sorabji Richard 'Body and Soul in Aristotle' — Philosophy or other journal/volume; (3) Caston Victor 'Aristotle and the Problem of Intentionality' — Philosophy and Phenomenological Research or other.

### Q-015 — Papachristou 2013 Aquinas Sentencia quotation

- **Section**: DISS-03-A3 | **Gap**: DISS-03-G01 (C076) | **Step**: S1 | **Cost**: ~$0.015
- **Priority**: ★★★★ | **Severity**: CRITICAL (Plan §8.2 special instruction b) | **Load-bearing**: yes
- **Query**: Papachristou Christina 2013 'Three Kinds or Grades of Phantasia in Aristotle's De Anima' — verbatim Aquinas Sentencia Liber II passage on motus phantasiae quoted at p. 16 fn. 57; full bibliographic entry.
- **Rationale**: Primary route: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Papachristou - Three Kinds of Phantasia (2013)/phx-08-papachristou`. Perplexity fallback if Aquinas passage not indexed.

### Q-016 — DEEP: Heidegger/Aristotle praxis-hexis cultivating fresh resolution

- **Section**: DISS-05-A4 | **Gap**: DISS-05-C058 | **Step**: S3 | **Cost**: ~$2.50
- **Priority**: ★★★★★ | **Severity**: CRITICAL-DISSERTATION-NOVEL | **Load-bearing**: yes
- **Query**: Deep research: Heidegger reading of Aristotle on praxis-hexis (NE VI.5 + GA 18 §17-18) as cultivating fresh emotional resolution rather than mechanical reflex. Secondary literature on doxa-content-conditional gate for pathē-arousal. Authoritative quotations from Sherman, Aubenque, Sheehan, Costache, McNeill, Kisiel, Pöggeler.
- **Rationale**: Section's master synthesis claim; deep-research justified given novelty and load-bearing role. Use S3 only after S2 attempts on Q-001/Q-002 fail.

### Q-017 — DEEP: per-virtue-pathos pairings in NE

- **Section**: DISS-05-A4 | **Gap**: DISS-05-C074 | **Step**: S3 | **Cost**: ~$2.50
- **Priority**: ★★★★★ | **Severity**: CRITICAL-DISSERTATION-NOVEL | **Load-bearing**: yes
- **Query**: Deep research: per-virtue-pathos pairings in Aristotle's NE — courage/fear (NE III.7), megalopsychia/anger (NE IV.3), aidōs/shame (NE IV.9). Secondary literature on the architectural reading that aretē just IS a praxis-hexis. Critical commentary from Sherman 1989, Aubenque 1963, Broadie 1991, Bostock 2000.
- **Rationale**: Substantial interpretive synthesis; S3 only after attempts on Q-001/Q-002. NE virtue-specific loci must come from `corpus/index/Aristotle - Complete Works` first.

---

## Execution Order

1. **Round 1 (S1 batch, ~$0.12)**: Q-004, Q-005, Q-006, Q-007, Q-008, Q-009, Q-011, Q-014 — 8 quick verifications
2. **Round 2 (S1 batch, ~$0.045)**: Q-012, Q-013, Q-015 — 3 placeholder fills with cache-possible status
3. **Round 3 (S2 batch, ~$0.20)**: Q-001, Q-002, Q-003, Q-010 — 4 fresh secondary
4. **Round 4 (S3 reserved, ~$5.00)**: Q-016, Q-017 ONLY if Round 3 S2 results inadequate

**Pause check after Round 3**: 16 queries used / 24 remaining; 99.6 USD remaining. Proceed to S3 only if Q-001/Q-002/Q-003 S2 outputs are inadequate for §1.5 master-synthesis claims.

## Quality Gates (Plan §9.6)

- [x] Queue size ≤ 40
- [x] Monetary cap ≤ $100 USD
- [x] Every query has starting step
- [x] Every query has cost estimate
- [x] corpus/index-FIRST routing applied
- [x] No query for cache-likely-strong topic (all DISS-04 gaps deferred to cache)
