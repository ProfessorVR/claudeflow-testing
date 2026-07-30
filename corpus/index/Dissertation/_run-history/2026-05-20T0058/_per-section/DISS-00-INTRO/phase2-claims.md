<!-- Inherited from 2026-05-13T1439 (claim-IDs preserved per plan §14 diff-protocol). For per-claim resolution status, see citation-gap-table.json. -->

# Phase 2 Claim Extraction — DISS-00-INTRO

**Section**: §1.0 — Introduction: Rhetorical Phantasia: The Soul's Temporal Medium
**Run-id**: 2026-05-13T1439
**Word count**: 6,669 (raw) / 4,009 (prose-only, post LaTeX/TikZ/footnote strip) | **Lines**: 592 | **Claims extracted**: 94
**Schema**: Plan v1.4 §8.1.1
**Status**: NEEDS-DEVELOPMENT — section written first, untouched since theoretical development of §§1.1-1.5; introduction will require realignment against finalized §§1.1-1.5

This file is the human-readable companion to `phase2-claims.json`. Use the JSON for tooling (edges-CSV cross-reference, citation-gap table generation, master-index roll-up). Use this MD for reading, revision-planning, and side-by-side comparison against the dissertation source.

## Summary tables

### Claim count by subsection

| Subsection | Heading | Lines | Claims |
|------------|---------|-------|--------|
| DISS-00-S0 | (Author self-note, pre-section) | 3 | 1 |
| DISS-00-S1 | Rhetorical Phantasia: The Soul's Temporal Medium | 5-38 | 38 |
| DISS-00-S2 | Methodology | 39-48 | 18 |
| DISS-00-S3 | The Kinetic Schema: A Three-Factor Structure of Perceptual Motion | 49-72 | 37 |
| **Total** | | | **94** |

### Claim count by support tier

| Tier | Count | % | Action implied |
|------|-------|---|----------------|
| T1-textually-confirmed | 28 | 29.8% | None |
| T2-textually-supported | 5 | 5.3% | Optional reinforcement |
| T3-interpretive-but-flagged | 45 | 47.9% | None (correctly flagged) |
| T4-interpretive-but-unflagged | 1 | 1.1% | **Add flagging** |
| T5-under-supported | 8 | 8.5% | **Add citation** |
| T6-unsupported | 4 | 4.3% | **Add citation OR flag** |
| T7-overreach | 3 | 3.2% | **Fix typo / formatting** |
| T8-secondary-needed | 0 | 0% | n/a |

The T1 + T3 dominance (29.8% + 47.9% = 77.7%) is appropriate for a high-citation-density introduction. The actionable gaps are T4 (1), T5 (8), T6 (4), T7 (3) = 16 remediation items.

Compared to §1.4 (306 claims with 24 T5 + 11 T7 = 35 actionable): §1.0 has a markedly higher T6-unsupported rate (4 / 94 = 4.3% vs §1.4's 0 / 306 = 0%) reflecting the section's untouched-since-written status and the four user-acknowledged \\inlinenote/??? markers.

### Coined-term occurrence map

| Coined term | Canonical-definition sites | Total claim sites mentioning the term |
|-------------|---------------------------|---------------------------------------|
| `basic affective valence` | (none — term not yet introduced; §1.4 canonical site) | 0 in extracted claims |
| `pathos simpliciter` | (none — term not yet introduced; §1.4 canonical site) | 0 in extracted claims |
| `resonant kinēsis` | C022 (precursor "resonant motion"), C054, C074, C089 | 4 |
| `resonant aisthēma` | C074 | 1 |
| `resonant orexis` | C074, C092 | 2 |
| `articulational concretion` | (none — term not yet introduced; §1.4 canonical site) | 0 in extracted claims |
| `pathē / emotion` | C092 | 1 |

**Phase 1 metadata occurrence-count cross-check**: Phase 1 metadata reported 3 `basic affective valence` (Phase 1 likely counted the inline note at line 3 + 2 instances in the methodology subsection — but the extracted claims show 0 because "basic affective valence" does not appear as a phrase in §1.0; this discrepancy is documented under coined-term-introduction-drift in citation-gap-table.md Table C). The phrase appears in the metadata expected_concepts list but not in the dissertation's introduction prose. Phase 1 metadata may have been over-eager. **Coined-term-introduction findings**:

- `resonant kinēsis` is introduced informally as "resonant motion" at line 19 (T_3 of the four-temporal-events catalog) — this is the introduction's most consequential coined-term usage and is BELOW the canonical formality of §1.2/§1.4. The term is canonically named at lines 62, 68, 89 in the methodology and roadmap as `resonant kinēsis`. The pre-canonical "resonant motion" terminology in the framing subsection is a drift candidate.
- `resonant aisthēma` and `resonant orexis` appear only in the methodology subsection (lines 62, 68) and only as items within the canonical chain numbering. They are NOT defined in the introduction; their definitions are forward-deferred to §1.2.
- `basic affective valence`, `pathos simpliciter`, and `articulational concretion` are absent from the introduction. This is consistent with §1.4 being the canonical site for these terms.

### Preflight marker map (per Phase 0)

| Marker | Line | Attached claim(s) | Resolution required |
|--------|------|-------------------|---------------------|
| \\hl{...} | 19 | C022 (T_1..T_4 temporal events thesis) | Add primary citations from DA II.5 / DA III.3 / On Dreams / On Memory |
| \\hl{...} | 36 | C036 ("motion and time" guiding principle) | Soft user-flag adequate; consider adding Phys. III.1 + Phys. IV.11 |
| \\hl{...} | 41 | C046 (cognition specifies same mode under different logos) | Add DA I.1 + DA II.5 + DA III.2 enmattered-accounts cluster |
| \\inlinenote{...} | 3 | C001 (animal motion as actualization of desire) | Surface into prose with DA III.10 + MA 6 |
| \\inlinenote{...} | 23 | C026 (diakrisis methodological remark) | Either surface into prose or move to methodology footnote with DA III.7 |
| \\inlinenote{...} | 30 | C031, C032, C033, C034 (Papachristou three-grades) | Inlinenote resolves on its own (Chapter IV deferral acknowledged); already cited |
| \\inlinenote{...} | 70 | C094 (diagram update / full-page reformat) | Formatting only — diagram is at lines 73-591; user-acknowledged |
| ??? | 41 | C047 (forward chapter reference for rhetorical framing) | Identify target chapter |

### Special-instruction findings (per Plan §8.2 for DISS-00-INTRO)

#### (a) Framing drift: temporal-narrative-synthesizing vs §§1.1-1.4's actual development

| §1.0 framing | §§1.1-1.4 delivery | Drift assessment |
|---|---|---|
| Phantasia as "temporal medium" (line 32, 41): the WHOLE-CHAIN temporal medium binding past/present/future | §1.3 positions phantasia at A_3 only (phantasma proper) as the central organ; §1.2 positions the "persisting residual motion" at A_2 (resonant kinēsis); §1.1 places motion and time at A_0 | DRIFT-PARTIAL: §1.0 frames phantasia as the soul's overall temporal medium, but §§1.1-1.4 distribute the temporal-architecture work across A_0 (motion + time as substrate), A_2 (resonant kinēsis as residual trace), and A_3 (phantasma at central organ). The introduction's claim that phantasia is the temporal medium is true at the level of A_3 but obscures the §1.1 ontological-substrate role of motion and time. The introduction's framing requires sharpening: phantasia is the SOUL'S temporal medium (Heideggerian sense) — it is the FACULTY through which the chain becomes temporally synthesized — but the chain itself rests on motion and time as A_0 (per §1.1). |
| Phantasia generates "a continuous, affectively charged narrative of experience" (line 36) | §1.4 introduces the synchronic chain vs diachronic saturation distinction; the "continuous narrative" is the synchronic chain, but it's diachronically saturated by prior runs | DRIFT-PARTIAL: §1.0 collapses the synchronic/diachronic distinction that §1.4 articulates. The introduction should acknowledge — or be left to acknowledge in a subsequent revision — that the "continuous narrative" of experience is BOTH synchronic (each chain-run from A_0 to A_4) AND diachronic (each new chain-run starts from a thrownness-modulated baseline of prior phantasmata). |
| "The capacity for being-affected is not a secondary feature added to cognition but the mode of being that cognition itself specifies under a different logos" (line 41) | §1.4 develops this exactly: pathē are not psychic add-ons but "a being-taken of human beings in their full being-in-the-world" (BCAP 133) | ALIGNED: this is §1.0's most consequential anti-internalist thesis and §1.4 delivers it. The introduction is correctly framing what §1.4 develops. |

#### (b) Promised arguments vs delivered arguments

Eleven explicit promises identified in §1.0:

| # | Promise (line) | Promised content | Delivery section | Delivery status |
|---|----------------|------------------|------------------|-----------------|
| 1 | line 17 | "Aristotle's concept of phantasia lies at the core of human being through its capacity to create a continuous narrative of experience" | §§1.2, 1.3, 1.4 cumulatively | FULFILLED |
| 2 | line 19 | Four temporal events T_1..T_4 of phantasia's operation | §1.1 (motion-time), §1.2 (perception → resonant kinēsis), §1.3 (phantasma generation) | FULFILLED via the A_n chain (T_n → A_n mapping is implicit) |
| 3 | line 30 | "Three kinds or grades of phantasia... examined in detail in Chapter IV" | §1.3 (DISS-03-A3) per Phase 1 metadata | PARTIALLY-FULFILLED: §1.3 develops three orientational modes + doxa-as-orthogonal but the Papachristou three-grades framework is inlinenote-flagged for §1.3 — verify in §1.3 |
| 4 | line 30 | Phantasia/doxa relation; phantasia's voluntariness — "will receive sustained treatment in subsequent chapters" | §1.3 (DISS-03-S6, S7, S8); §1.4 (doxa-gate at A_3) | FULFILLED |
| 5 | line 36 | Phantasia as the kinetic capacity generating continuous narrative — main dissertation thesis | §§1.1-1.4 cumulatively | FULFILLED (architecture is delivered, though framing in §1.0 emphasises narrative more than §§1.1-1.4 emphasise) |
| 6 | line 41 | "The full defense of this rhetorical framing is developed in chapter ???" | Forward reference to undefined chapter (likely a future Chapter X engaging Heidegger/Rickert/Uexküll/Burke) | UNFULFILLED-DEFERRED: chapter not yet written; ??? placeholder must be resolved at revision time |
| 7 | line 41 | The chapter "traces the architectural sequence through which 'mattering' is generated, with phantasia standing at its temporal center" | §§1.1-1.4 trace the architectural sequence; "mattering" is most directly delivered in §1.4 (pathos as being-taken-of-significance) | FULFILLED |
| 8 | line 43 | Sustained interpretive reading of aisthēsis, phantasia, cognition, appetitive action as a SINGLE architectural sequence | §§1.1-1.5 cumulatively | FULFILLED |
| 9 | line 47 | "Several interpretive readings that go beyond what Aristotle explicitly states: the ontological incompleteness of time without soul, the dual-trace thesis, the orthogonal committal dimension of doxa, and the gate-keeping condition for doxastic commitment" | §1.1 (time without soul), §1.2 (dual-trace), §1.3 (doxa-orthogonal + gate-keeping) | FULFILLED |
| 10 | line 68 | Chapter roadmap explicitly enumerates A_0, A_1 → A_2, M_2 → A_3, M_3 → A_4 | Section structure matches: §1.1 = A_0; §1.2 = A_1 → A_2; §1.3 = M_2 → A_3 + A_3 + M_3 → A_4 + doxa; §1.4 = emotion (M_3 → A_4 evaluatively complex); §1.5 = A_4 + recursive loop | FULFILLED (with one subtle drift: §1.0 says "A_3's subsequent sections analyze the cognitive engagements...at M_3 → A_4" — but in §1.3, M_3 → A_4 is the orectic motion to action, not the cognitive engagements; the cognitive engagements are A_3 (the phantasma itself) and its M_2 → A_3 phantastic-motion antecedent. This is a DRIFT POINT) |
| 11 | line 68 | "The chapter closes with a synthesis that situates the chain's architectural contribution within the dissertation's wider rhetorical project and prepares the transition to Chapter X's engagement with Heidegger, Rickert, Uexküll, and Burke" | §1.5 closes the chain at A_4 but per its Phase 1 metadata is "needs-rework-after-upstream-revision"; the Chapter X engagement is forward-deferred | UNFULFILLED-DEFERRED: §1.5 does close the chain but not in a way that fulfills the full synthesis-and-transition promise of the introduction; Chapter X is not yet written |

Summary: **7 FULFILLED, 3 PARTIALLY-FULFILLED, 1 UNFULFILLED-DEFERRED**.

#### (c) Methodology subsection architectural commitments vs §§1.1-1.5's final form

| §1.0 Methodology commitment | §§1.1-1.5 final form | Consistency assessment |
|---|---|---|
| Five principal nodes: A_0, A_1, A_2, A_3, A_4 (line 45) | §1.1 = A_0; §1.2 = A_1 + A_2; §1.3 = A_3 (with M_2 → A_3 motion); §1.4 = M_3 → A_4 (evaluatively complex); §1.5 = A_4 + recursive | CONSISTENT |
| A_2 "completed perception together with the dual residual trace it deposits" (line 45) | §1.2 introduces resonant kinēsis at A_2 with dual-trace (resonant aisthēma + resonant orexis) per phase1 metadata | CONSISTENT |
| A_3 "the phantasma proper, generated from the resonant kinēsis at A_2" (line 45) | §1.3 develops three orientational modes of A_3 (intellection, memory, deliberative/speculative) + doxa as orthogonal | CONSISTENT with the phantasma-at-A_3 framing; §1.3 elaborates the cognitive engagements with the phantasma which is a richer development than the introduction's "phantasma proper" suggests |
| A_4 "completed cognitive actuality produced when the rational cognitive apparatus engages the phantasma — intellection, memory, deliberative or speculative thinking, or the committal dimension of doxa (opinion)" (line 45) | §1.3 + §1.4: A_4 is the completed cognitive actuality (cognition node); M_3 → A_4 is the motion from cognitive completion to action via orexis. The introduction's framing CONFLATES A_3 (cognitive engagement) with A_4 (cognitive completion) at one critical moment in C080 (line 64) | DRIFT-DETECTED: line 64 (C080) describes A_2 → A_3 as "the actualization of the completed cognitive actuality" — but per the chain's own numbering A_3 IS the phantasma proper, not the completed cognitive actuality (that's A_4). This is a CRITICAL internal inconsistency. |
| Three-factor schema is scale-invariant from cosmic to psychological (line 60) | §1.1 develops this directly per phase1 metadata (cited as one of the methodology commitments) | CONSISTENT |
| Five methodology elements: three-factor schema, priority of actuality, motion-named-by-terminus, scale-invariance, actuality-first/iterated-chain interlock (line 43) | §1.1 develops priority of actuality, motion-named-by-terminus, scale-invariance; §§1.1-1.4 use the three-factor schema; §1.1 + §1.2 + §1.3 + §1.4 do the actuality-first/iterated-chain interlock | CONSISTENT (the five elements are deployed across §§1.1-1.4; §1.0 forward-promises them all) |

#### (d) Numbering convention: NEW-ONLY confirmed

Per Phase 0/Phase 1 preflight: §1.0 has 4 NEW M→A occurrences at lines 62, 68 (specifically: M_2 → A_3 and M_3 → A_4 on each line). Confirmed: §1.0 uses NEW-ONLY (M_n → A_n+1) numbering convention.

Cross-section numbering profile:
- §1.0: NEW-ONLY (4 occurrences) — CLEAN
- §1.1: OLD-ONLY (2 occurrences) — MIGRATION NEEDED
- §1.2: MIXED (2 OLD + 3 NEW) — RECONCILIATION NEEDED
- §1.3: MIXED (5 OLD + 2 NEW) — RECONCILIATION NEEDED
- §1.4: NEW-ONLY (per Phase 1)
- §1.5: OLD-ONLY (per Phase 1) — MIGRATION NEEDED

§1.0's clean NEW-ONLY profile means: the introduction is the canonical site for the NEW convention. Any migration patch to §§1.1, 1.2, 1.3, 1.5 should align with §1.0's usage.

#### (e) Coined-term forward-pointing introductions

| Coined term in §1.0 | §1.0 usage | Canonical definition site | Drift status |
|---|---|---|---|
| "resonant motion" (line 19) → "resonant kinēsis" (lines 62, 68, 89) | Two-stage introduction: informal "resonant motion" in framing subsection, formal "resonant kinēsis" in methodology + roadmap | §1.2 (DISS-02-A1A2) per Phase 1 metadata is the canonical introduction site (subsection "Resonant Kinēsis: The Persisting Impression" + dual-trace subsection) | DRIFT-CANDIDATE: §1.0's informal "resonant motion" at line 19 differs from §1.2's canonical "resonant kinēsis." Recommend §1.0 revision to use canonical "resonant kinēsis" throughout, or at minimum a footnote naming the term explicitly. |
| "resonant aisthēma" (line 62) | Used in chain-numbering enumeration only; not defined | §1.2 (DISS-02-S6: "The Dual-Trace Thesis: Resonant Aisthēma and Resonant Orexis") | ALIGNED: §1.0's usage is consistent with §1.2's canonical role. |
| "resonant orexis" (lines 62, 68) | Used in chain-numbering enumeration + emotion roadmap | §1.2 (DISS-02-S6) canonical introduction + §1.4 (DISS-04-S2) canonical definition | ALIGNED with one caveat: §1.0 says "flips the latent resonant orexis into the determinate higher-order pathē" — this maps onto §1.4's articulational-concretion thesis but the §1.0 framing is slightly less precise (basic affective valence has two sub-modes: pathos simpliciter when present; resonant orexis when absent). Recommend §1.0 revision to acknowledge that resonant orexis is the absent-object case specifically. |

### Edge-graph summary

See `phase2-edges.csv` for the full graph. 70 edges total spanning:
- architectural-grounding edges (chain-iteration, three-factor-schema, terminus-naming-principle, scale-invariance, Burke priority distinction)
- citation-support edges (DA, Phys., Met., MA, BCAP, SZ)
- citation-need edges (loci missing at canonical claims: §1.0 needs 8 primary citation additions per the citation-gap table)
- inconsistent-with edges (3 architectural-mismatch edges to §§1.1, 1.3, 1.4 marking framing drift and the line-64 A_3-conflation)
- depends-on edges (Burke's priority-distinction, White's intermediary thesis, Frede's threefold)

## Claim-by-claim reading

For each claim see `phase2-claims.json` (compact field-name schema documented in the `_compactness_note` field). The JSON contains all 94 claims with their full schema (claim_id, subsection, location, claim_text, claim_type, logical_role, supports/supported_by, primary/secondary/implicit citations, support_tier, coined-term flag, interpretive-move flag, interpretive-flag-present, recommended interpretive-flag, and remediation routing with corpus-index/ChromaDB/Perplexity candidates).

## Cross-section bridges to §§1.1-1.5

### To DISS-01-A0 (§1.1)
- C022 (T_1 sensory encounter, T_2 perceptual actualization) ↔ §1.1's A_0 + A_1 ontological substrate
- C027 (continuous unfolding) ↔ §1.1's motion-time analysis
- C054, C056, C088 (chain canonical numbering + A_0 ground) ↔ §1.1 entire structure
- C060, C061, C062, C063 (actuality-motion-time triad) ↔ §1.1 entire structure
- C071, C072 (scale-invariance) ↔ §1.1 cosmic-to-psychological transposition
- C082, C083, C084-C087 (Burke entelechy + reciprocal priority) ↔ §1.1's Burke-citation usage

### To DISS-02-A1A2 (§1.2)
- C017, C018, C019 (phantasia depends on aisthēsis) ↔ §1.2's perception architecture
- C022 (T_2 perceptual actualization → T_3 resonant motion) ↔ §1.2's resonant kinēsis introduction
- C054, C074, C089 (resonant kinēsis at A_2; dual-trace) ↔ §1.2's canonical dual-trace thesis

### To DISS-03-A3 (§1.3)
- C022 (T_3 → T_4 phantasma activation) ↔ §1.3's three orientational modes
- C024 (recollection / imagination / reasoning / opinion formation) ↔ §1.3's noesis/memory/discursive + doxa
- C031, C032, C033 (Papachristou three-grades) ↔ §1.3's inlinenote-flagged Papachristou citation need
- C090, C091 (phantastic motion + cognitive engagements + doxa-orthogonal) ↔ §1.3's central thesis

### To DISS-04-EMOTION (§1.4)
- C038, C039 (kinetic and affective resonance; rhetorical influence on phantasia) ↔ §1.4's emotion-as-rhetorical thesis
- C044, C045 (anti-internalist; cognition under different logos) ↔ §1.4's anti-internalist thesis at BCAP 133
- C092 (latent resonant orexis flipped into determinate pathē) ↔ §1.4's articulational-concretion thesis

### To DISS-05-A4 (§1.5)
- C055, C091, C092 (orectic motion → appetitive action; how mobilized orexis moves the body) ↔ §1.5's three types of action
- C093 (chapter close synthesis + Chapter X transition) ↔ §1.5's conclusion (per Phase 1 metadata: §1.5 is the closing chain section, currently under-developed)

---

**END OF DISS-00-INTRO CLAIMS MARKDOWN**
