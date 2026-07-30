# Phase 2 Claim Extraction — DISS-04-EMOTION

**Section**: 1.4 — Emotion: The Form of Desire Under Evaluative Disclosure (E-motion is Motion)
**Run-id**: 2026-05-13T1439
**Word count**: 13,969 | **Lines**: 183 | **Claims extracted**: 306
**Schema**: Plan v1.4 §8.1.1
**Status**: GOLD STANDARD — Lanham baseline + canonical site for coined-term terminology

This file is the human-readable companion to `phase2-claims.json`. Use the JSON for tooling (edges-CSV cross-reference, citation-gap table generation, master-index roll-up). Use this MD for reading, revision-planning, and side-by-side comparison against the dissertation source.

## Summary tables

### Claim count by subsection

| Subsection | Heading | Lines | Claims |
|------------|---------|-------|--------|
| DISS-04-S1 | Section intro | 1-4 | 3 |
| DISS-04-S2 | E-motion is Motion (architecture) | 5-12 | 33 |
| DISS-04-S3 | Pathos and Pathē: Two Articulational Concretions | 13-24 | 32 |
| DISS-04-S3a | From the Lectures to Being and Time | 25-34 | 15 |
| DISS-04-S3b | The Metaphysics Fourfold (RELOCATION → §1.2) | 35-49 | 21 |
| DISS-04-S3c | The Rhetoric's Constitutive Threefold (RELOCATION for krisis → §1.2) | 50-61 | 23 |
| DISS-04-S4 | Enmattered-Accounts | 62-65 | 15 |
| DISS-04-S5 | The Articulational Concretion: From Doxa to Pathē | 66-77 | 20 |
| DISS-04-S6 | Somatic Preparation: Emotion in the Causal Chain | 78-85 | 21 |
| DISS-04-S7 | The Feedback Loop: Synchronic Chain, Diachronic Saturation | 86-115 | 42 |
| DISS-04-S8 | Emotion's Function in the Chain | 116-125 | 19 |
| DISS-04-S9 | Conclusion | 126-183 | 62 |
| **Total** | | | **306** |

### Claim count by support tier

| Tier | Count | % | Action implied |
|------|-------|---|----------------|
| T1-textually-confirmed | 82 | 26.8% | None |
| T2-textually-supported | 22 | 7.2% | Optional reinforcement |
| T3-interpretive-but-flagged | 156 | 51.0% | None (correctly flagged) |
| T4-interpretive-but-unflagged | 2 | 0.65% | **Add flagging** |
| T5-under-supported | 24 | 7.8% | **Add citation** |
| T6-unsupported | 0 | 0% | n/a |
| T7-overreach | 11 | 3.6% | **Fix overreach (mostly typos)** |
| T8-secondary-needed | 9 | 2.9% | Add secondary reinforcement |

The T3 majority is healthy: this is interpretive philosophy and the user has explicitly flagged most interpretive moves. The actionable gaps are T4 (2), T5 (24), and T8 (9) = 35 total, plus 11 T7 typos = 46 remediation items.

### Coined-term occurrence map

| Coined term | Canonical-definition claims | Total claim sites mentioning the term |
|-------------|----------------------------|---------------------------------------|
| `basic affective valence` | C002, C032, C033, C116 | 33+ across the section (verifies Phase 1 metadata count) |
| `pathos simpliciter` | C029, C033, C247 | 7+ |
| `resonant kinēsis` | C003, C030, C033 | 3 (matches Phase 1 metadata) |
| `resonant aisthēma` | C101 (sole site) | 1 (matches Phase 1 metadata — uniquely cited in §1.4 at line 48) |
| `resonant orexis` | C003, C030, C033, C034, C247 | 6 (matches Phase 1 metadata) |
| `articulational concretion` | C036, C037, C038, C067, C246 | 12+ (matches Phase 1 metadata) |
| `pathē / emotion` | passim | 56+ surface occurrences |

### Relocation source passages (the three user-mandated moves to §1.2)

| Relocation | Source line range | Claims involved | Bridge text needed in §1.4 |
|------------|-------------------|-----------------|----------------------------|
| **(i) Metaphysics fourfold** | Lines 35-49 (entire DISS-04-S3b) | C084-C098 fully move; C099-C104 stay as the "fourfold-at-basic-valence-level" payoff | "The fourfold senses of pathos established in §1.2 are all satisfied at the basic affective valence level, as follows." |
| **(ii) Paschein preservation/destruction** | Line 23 main statement + line 46 footnote (DA II.5 quotation) | C055-C058, C094-C095 fully move; C059-C061 stay as the extension-to-emotion | "As established in §1.2's analysis of aisthēsis, Aristotle distinguishes two senses of paschein; both basic affective valence and the pathē are species of preservative paschein." |
| **(iii) Perception-as-krisis (BCAP 126)** | Lines 50-61 partial (the BCAP 126 mesotēs/kritikon passage) | C113-C119 mostly move; C120-C127 stay as the application to the Rhetoric threefold + pre-propositional/pre-positional distinction | "As §1.2 established in the discussion of aisthēsis-as-krisis (BCAP 126), perception is itself kritikon; the position-taking moment is constitutive of perception, not introduced anew by doxa." |

### Feedback-loop CONCEPT nodes (S7, the most novel architectural move)

1. **CONCEPT-synchronic_chain** — A₀→A₁→A₂-A₃→A₄, directional within a single actualization (C200, C201, C202)
2. **CONCEPT-diachronic_saturation** — prior actualizations modulate subsequent ones; "content of A₀ on any given pass is conditioned by residues of prior passes" (C203, C204, C209, C225)
3. **CONCEPT-Stimmung_saturation_mechanism** — Diachronic mechanism 1: pathos persists as tonal coloring biasing subsequent perception (C206)
4. **CONCEPT-corrective_faculty_impairment_mechanism** — Diachronic mechanism 2: emotional excitement disables controlling sense; phantasmata pass corrective gate unopposed; localized at A₂→A₃ (C207, C189)
5. **CONCEPT-character_consolidation_via_hexis** — Aristotelian articulation: residual modification consolidates into hexeis (C212, C213, C214)
6. **CONCEPT-thrownness_as_diachronic_character_of_chain** — Heideggerian articulation: feedback IS the thrownness-character of the chain, not a third direction (C210, C217, C218, C220, C224)
7. **CONCEPT-temporality_Gewesenheit** — Stimmung temporalizes primarily in past-modality, currently-conditioning having-been (C218, C219, C280, C281)

### Preflight marker map (per Phase 0)

| Marker | Line(s) | Attached claim(s) |
|--------|---------|-------------------|
| \\inlinenote | 3 | C002, C003 (terminological clarification of basic affective valence) |
| \\hl(CITE) placeholder | 33 | C080 (BT §31-32 needs locus for "understanding/discourse grounded in attunement") |
| \\hl marker | 64 | C140, C142 (enmattered-account structural-constraint claims, user-acknowledged tentative) |
| \\hl marker | 80 | C165 (Loeb attribution for pathē translation) |
| \\hl marker | 82 | C166 (somatic-preparatory thesis — "and this is further indicated…" tentative) |
| \\inlinenote | 60 | C074, C077, C116 (Befindlichkeit/Stimmung translation reminder) |
| \\inlinenote | 138 | C257 (social aspects of pathē — Mitsein development needed) |
| \\inlinenote | 148 | C262 (worked thirst example for fivefold) |
| \\inlinenote | 162 | C282 (disclosive function expansion with Heidegger on logos) |
| ****** placeholder | 174 | C291 (BCAP page + verbatim for "pathē and hexeis as fundamental concepts of being") |
| Mₙ→Mₙ₊₁ (old) | 118 | C227 (notation-settled meta-statement that uses M→M); C228 |
| Mₙ→Mₙ₊₁ (old) | 144 | C263 (element 5 reference to "M₃→M₄") |
| Mₙ→Aₙ₊₁ (new) | 114 | C226 (transition to S8 uses M→A) |
| Mₙ→Aₙ₊₁ (new) | 124 | C244, C245 (appetitive case uses M₃→A₄) |

The single most CRITICAL preflight finding: **lines 114, 118, 124, 144 contain mixed-convention drift within a 30-line span.** C227 (line 118) self-describes the notation as "settled" while using the OLD M→M convention; line 114 just above and line 124 just below use the NEW M→A convention. This is the central numbering audit finding for §1.4.

## Per-subsection claim listing

This is a compact human-reading rendering. For full per-claim metadata (citations, supports/supported-by, remediation), consult `phase2-claims.json`.

### DISS-04-S1 — Section intro (lines 1-4)

- **C001** [T3] — Title-claim: emotion is the form of desire under evaluative disclosure.
- **C002** [T3, COINED `basic affective valence`] — basic affective valence is when object of sense is present. (\\inlinenote)
- **C003** [T3, COINED `resonant kinēsis`+`resonant orexis`] — residual half: when object removed, residual valence forming part of resonant kinēsis is resonant orexis. (\\inlinenote)

### DISS-04-S2 — E-motion is Motion: The Affective Architecture (lines 5-12)

Opens with full agreement-with-Heidegger framing (C004–C012, all anchored to BCAP 133), then the four-paragraph etymology argument (C013–C021, anchored to OED), then the canonical Aristotelian terminological reckoning that introduces the four senses of pathos (C022–C028, anchored to Met. Δ 21 + DA III.7 + DA I.1 + Rhetoric II.1; the only typo concern is C025's "13789a21-22" should be "1378a20-22"). The coined-term canonical definitions land at C029 (pathos simpliciter), C030 (resonant orexis), C032 (basic affective valence), with the perceiving-vs-thinking mapping at C034. The subsection closes with the canonical articulational-concretion thesis at C036.

**Key flags**: C025 (T7 Bekker typo), C030 (T5 needs citation at canonical resonant-orexis site), C031 (T5 needs DA II.2 + BCAP 115 anchor for hedonic-co-givenness), C034 (T5 needs DA III.3 + DA III.7 for perception-vs-thinking mapping).

### DISS-04-S3 — Pathos and Pathē: Two Articulational Concretions (lines 13-24)

The canonical articulational-concretion thesis is stated (C037), the user-coined-restriction to rational animals is set out (C040), the long footnote treating animal pathos-attribution as analogical-not-univocal is developed (C041, C042, anchored to NE III.8 + HA IX). The "gap in Heidegger" diagnostic argues that the variable presence of pathos across action-types (esp. the MA drinking case) cannot be accommodated by Heidegger's undifferentiated treatment (C043–C048). The two-position dialectical elimination follows (C049–C054). The paschein-preservation-vs-destruction passage (C055–C058) is the **(ii) RELOCATION source** to §1.2.

**Critical interpretive claim**: C062 introduces the **three-dimensional magnitude-axis** (hedonic intensity × existential weight × cognitive articulation) — a novel architectural move that needs explicit flagging (currently T3 but the user-voice flag is implicit). The alley illustration at C068 closes the subsection.

**Key flags**: C036 (T5 paschein anchor needed at articulational-concretion canonical thesis), C045-C046-C047-C048 (T5 cluster, MA 7 + BCAP 132 anchors), C055-C058 + C094 (RELOCATION (ii) sources), C062 (T3 but should add explicit flag for the three-dimensional axis).

### DISS-04-S3a — From the Lectures to Being and Time (lines 25-34)

Canonical Heideggerian-arc claim: the articulational distinction recovers a pattern Heidegger's trajectory presupposes (C069). The BT footnote citing Aristotle's Rhetoric as "first systematic hermeneutic" is reproduced (C070-C072, SZ §29, H.138). The BCAP 176 pathē-as-ground-of-logos passage is quoted (C075-C076) and paired with SZ §29, H.135-137 (C077-C078). The grounding-direction-identical thesis is at C080 — this is the claim with the **\\hl(CITE) placeholder at line 33** needing SZ §31-32 anchor.

**Key flags**: C080 (T5 — explicit \\hl(CITE) placeholder; SZ §31-32 for understanding/discourse grounded in attunement); C074 + C077 (Befindlichkeit translation drift, user-flagged at line 60).

### DISS-04-S3b — The Metaphysics Fourfold (lines 35-49) — **RELOCATION (i) SOURCE**

Heidegger's gloss of the four senses (C084-C088, BCAP 131-132, anchored to Met. Δ 21, 1022b15-21). The progression-from-general-to-magnitude (C089), the unifying being-of-living-things gloss (C090-C092), the paschein-as-sōtēria-preservation (C093-C098, anchored to BCAP 132 + DA II.5 — this is also the (ii) relocation site for the footnoted DA II.5 quotation). The fourfold-at-basic-affective-valence demonstration (C099-C104) is what stays in §1.4 as the payoff (with bridge text), even though the fourfold introduction itself moves to §1.2.

**Key flags**: C084-C098 all RELOCATE to §1.2; C099-C104 PARTIAL relocate (stay in §1.4 but require new bridge); C100 + C101 (T5 needs DA II.5 anchor for alterability-and-actuality-of-aisthētikon claims).

### DISS-04-S3c — The Rhetoric's Constitutive Threefold (lines 50-61) — **RELOCATION (iii) SOURCE** for the perception-as-krisis discussion

The Rhetoric II.1, 1378a20-22 primary definition is given (C105) and defended against "rhetorical-not-ontological" objection (C106). Heidegger's threefold reading from BCAP 115 is quoted (C108) and developed (C109-C112): change-in-disposition + position-taking + co-givenness of pleasure/pain. The threefold-already-at-perceptual-level claim (C113) introduces the **BCAP 126 perception-as-krisis** passage (C114) which IS the (iii) RELOCATION source — but with the important caveat that the **emotional application** of the perception-as-krisis insight stays in §1.4 (in C120-C127). The basic-affective-valence-as-Stimmung-Befindlichkeit identification (C116) is canonical for §1.4 and stays.

**Key flags**: C114 RELOCATE; C115 (T7 typo "ON the Soul"); C116 verifies user's preferred translation (Stimmung=attunement/mood, Befindlichkeit=state-of-mind) consistent with inlinenote at line 60.

### DISS-04-S4 — Enmattered-Accounts (lines 62-65)

The DA I.1, 403a25-b19 enmattered-accounts thesis (C128), the dialectician/physicist contrast (C129-C130), the joint sufficiency claim (C131), Heidegger's "no division between psychic and bodily acts" (C133), the fear-eidos passage at BCAP 139 (C134), and the closing payoff: anger as constitutively enmattered, irreducible to any single component (C140-C142). The **\\hl marker at line 64** flags two clauses: "or contain true explanatory value" (C140) and the entire structural-constraint paragraph (C142).

**Key flags**: C134 (verify BCAP 139 page); C140, C142 (resolve \\hl).

### DISS-04-S5 — The Articulational Concretion: From Doxa to Pathē (lines 66-77)

The DA III.3, 427b21-24 "doxa → emotion immediately" passage (C143) and the response to the "merely imagining we remain unaffected" puzzle (C144-C147): "unaffected" specifies absence of pathē, not absence of all pathos; the Poetics catharsis footnote (C147) confirms non-apathy of imaginative engagement. The canonical **doxa-as-immediate-concretizer** thesis (C150) and the **doxa-gate thesis** (C151) follow, with the involuntariness-of-doxa account at C152-C156 (Heidegger on fear at BCAP 173-174). The shame case-study (C159-C162, Rhetoric II.6, 1383b15-17) closes the subsection.

**Key flags**: C154, C156 (verify BCAP 173-174 pagination); C161 (user's interpretive interpolation of shame's conative element, well-flagged with "is likely").

### DISS-04-S6 — Somatic Preparation: Emotion in the Causal Chain (lines 78-85)

The MA causal chain (C163) — sense/think → imagination → desire → affections → organic parts → movement — with the **placement-justification thesis** at C164 ("the location of 'affections' between desire and the organic parts" justifies the articulational distinction). The Loeb-attribution footnote at C165 has a \\hl marker. The MA 8, 701b33-702a3 "heating or chilling" quotation (C167) has a Bekker typo ("7022"). The emotion-as-composite thesis is developed (C168-C171) and the non-redundancy argument from placement (C172-C177) follows. The doxa-as-truth-committal closer (C178-C183) anchors to DA III.3, 427b21-24 and DA III.7, 431b5-6 (beacon-fire illustration).

**Key flags**: C163 (T5 add Bekker MA 7, 701a29-b1); C165 (resolve \\hl + add Bekker for Loeb attribution); C166 (resolve \\hl on "and this is further indicated"); C167 (T7 fix "7022" → "702a2" or "702a3" Bekker).

### DISS-04-S7 — The Feedback Loop: Synchronic Chain, Diachronic Saturation (lines 86-115) — **THE MOST NOVEL ARCHITECTURAL MOVE**

The "judgement modifying" puzzle (C184): if doxa is necessary for emotion's articulational concretization, how can emotion modify judgment? The puzzle resolves via the synchronic/diachronic register distinction. The canonical introduction of the **pathos feedback loop** (C187), the On Dreams 460b3-11 seminal text (C188), and the **corrective-faculty impairment mechanism** (C189-C191). The four structural features of the loop are developed (C193-C197): loop as intrinsic-not-malfunction; threshold-lowering; temporal asymmetry; past-to-present direction. The interpretive-reconstruction footnote (C198-C199) explicitly flags the feedback-loop reading as user-novel, citing convergence of three passages (DA III.3, On Dreams, Rhet. II.1).

The **canonical synchronic/diachronic distinction** is at C200, with the synchronic chain at C201 and the diachronic register at C203-C204. The **two diachronic mechanisms** are split (C205): Stimmung-saturation modulates input to doxa (C206); corrective-faculty impairment modulates the doxa-gating itself (C207). Their localization within the chain is at C208. The disambiguation against treating diachronic as a fourth synchronic transition is at C209.

The **canonical Aristotle-Heidegger convergence** spans C210-C224: hexis = Geworfenheit at different ontological registers; NE II.1, 1103a16-17 + 1103a31-b2 on habituation; SZ §29, H.137 on three disclosures; SZ §29, H.135 on Geworfenheit; SZ §68b, H.340 on Stimmung-as-Gewesenheit; BCAP 122 on hexis-as-self-cultivation. The canonical payoff (C224, C225): feedback IS the thrownness-character of the chain — synchronically directional, diachronically saturated.

**Key flags**: C201 (numbering inconsistency — basic valence@A₀/doxa@A₁/pathē@A₂-A₃/action@A₄ conflicts with prior subsection placements); C206 (T5 add SZ §29 anchor); C208, C225, C226 (numbering notes); the entire S7 is **GOLD** for the dissertation's most novel work.

### DISS-04-S8 — Emotion's Function in the Chain (lines 116-125)

The **meta-notational statement** at C227 (line 118) — "the chapter has settled on a coordinated notation" — IS the source of the renumbering inconsistency, using M→M while line 114 (just above) and line 124 (just below) use M→A. C228 develops emotion-as-conversion-at-M₃→M₄ (sic; should be M₃→A₄). The individuation argument (C229-C230) — fear ≠ retaliation, relief ≠ concealment — develops the emotion-as-form-of-desire thesis (C231). Per-emotion illustrations follow: fear (C232), anger (C233), pity (C234). The Rhetoric-confirms-composite closer (C235-C236) ends with C236's **T4 flag**: trailing "pathe/pathos?" with a literal question mark — user-acknowledged in-text uncertainty. The three-factor schema preservation claim (C237-C242), the appetitive case where basic valence alone suffices (C243-C245).

**Key flags**: C227 (CRITICAL renumbering audit source — patches needed for lines 118, 144, plus internal §1.7/§1.8 cross-references); C236 (T4 — resolve "pathe/pathos?" query); C244-C245 (mixed-convention drift).

### DISS-04-S9 — Conclusion (lines 126-183)

The **canonical five-fold structure** is introduced at C246, covering the full register from pathos simpliciter through resonant orexis to the Rhetoric's catalog (C247). The articulational-not-ontological difference (C248), the ontology-of-being-affected payoff (C249). The five-fold-as-integration claim (C250) maps the Rhetoric threefold (C251), Metaphysics fourfold (C253), and DA enmattered-account four-component analysis (C254) onto the five elements.

The **five elements**:
- **Element 1 (disposition)** at C256: each pathos is a determinate manner of finding-oneself-disposed; somatic-dominant in basic, doxastic-laden in concrete pathē.
- **Element 2 (toward-which + toward-whom)** at C257: world-side + social-ontological intentionality; opens Mitsein-dimension. **\\inlinenote at line 138** flags development gap.
- **Element 3 (bodily form)** at C258-C259: constitutive bodily articulation, logos-articulated.
- **Element 4 (temporal range)** at C260-C262: all three ecstases co-temporalized with primary anchor; applies fully to basic valence (thirst case). **\\inlinenote at line 148** flags worked-thirst-example need.
- **Element 5 (disclosive function: bringing to krisis, to logos)** at C263-C265: anger→confront, fear→confer, shame→defend/reform, pity→alleviate; only the pathē bring to logos.

The defensive **temporal range as not-retrojection** development (C268-C285) marshals: De Memoria 449b10-30 + Rhetoric I.11, 1370a (phantasia grounds three ecstases); per-emotion temporal distributions (fear primarily futural, anger primarily having-been, pity primarily present, shame all three explicit); GA 18 fear analysis at p. 168, 175; SZ §68 on three ecstases; SZ §68b fear-temporal-braiding; GA 18 p. 131 + Rhetoric I.3, 1358b13-17 three-genres-three-tenses correspondence; Struever's Alltäglichkeit/timefulness gloss.

The **pathē-as-ground-of-logos** culmination (C286-C290) returns to BCAP 176 and SZ §29, H.138. The **\\textbf{******}** placeholder at line 174 (C291) marks the BCAP page reference and verbatim for "pathē and hexeis as fundamental concepts of speaking-with-one-another." The per-pathos-hexis-correlate claim (C292) lists courage/fear, magnanimity/anger, friendliness/kindness. The hexis-consolidation closer (C293).

The **emotion-keyed-to-appearance** thesis (C294-C297, anchored to DA III.3, 427b21-24) with three illustrations: rattlesnake (C295), art (C296), rope-not-snake (C297). The phantasia-as-condition-of-pathē payoff (C298-C301, anchored to De Memoria 450a20-25 + Rhetoric I.11, 1370a + Rhetoric II.5, 1382a22-23). The rhetoric-as-phantasmatic-reshaping application (C302-C303, anchored to Heidegger and Rhetoric ed. Gross, p. 1).

The final canonical summary (C304-C305) — emotion is grounded in phantasia, shaped through involuntary doxa, felt as pleasure/pain, prepared somatically, expressed as motion; the five-fold structure specifies the affective architecture of being-in-the-world. Forecast to next chapter on hexis cultivation (C306).

**Key flags**: C257 (\\inlinenote development gap on Mitsein); C262 (\\inlinenote on worked thirst example); C263 (numbering: line 144 uses M→M, references §1.8); C282 (\\inlinenote on logos expansion); C287, C306 (update internal §1.7 cross-references — these are now subsection S7 of §1.4); C291 (CRITICAL — \\textbf{******} placeholder, BCAP page + verbatim to be supplied manually per `feedback-missing-source-placeholder.md`); C292 (T8 NE II-IV anchor needed for per-virtue analyses); C299 (T5 Bekker line range needed for Rhet. I.11, 1370a).

## Critical aggregate findings

### Numbering audit (CRITICAL severity)

Lines 114, 118, 124, 144 contain mixed M→M / M→A drift within a small span. The meta-notational claim at C227 (line 118) self-describes the convention as "settled" while using the OLD M→M. This must be patched in coordination with the diagram (which uses the new M→A convention). Per Plan §9.1.2 the patch list for §1.4 is:

- Line 114: `M_3 \\rightarrow A_4` (already NEW — verify)
- Line 118: `M_3 \\rightarrow M_4` → `M_3 \\rightarrow A_4` (TWO occurrences; cf. §1.7 reference is also stale)
- Line 124 (paragraph 1): `M_3 \\rightarrow A_4` (already NEW — verify)
- Line 124 (paragraph 1 again): both M→A
- Line 144: `M_3 \\rightarrow M_4` → `M_3 \\rightarrow A_4`

Internal cross-references `§1.7` and `§1.8` and "next chapter" are stale and refer to old chapter-numbering when §1.4 was multi-section "Pathe chapter §§1.1-1.9"; in the new structure they correspond to subsections S7 and S8 within §1.4 itself. Need clarification or rewriting.

### Typo cluster (line 128-134) — T7 cluster

- C025: "13789a21-22" → "1378a20-22"
- C115: "ON the Soul" → "On the Soul"
- C167: "7022" → "702a2" (or "702a3")
- C248: "ontologicla" → "ontological"
- C252: "intot he" → "into the"; "takin" → "taking"
- C254: "enmattered-accout" → "enmattered-account"; "agner" → "anger"; "metaphysics'" → "Metaphysics'"
- C256: "occured" → "occurred"; missing closing paren
- C265: missing closing paren

The 11 T7 items can be cleared in a single 15-minute pass.

### Befindlichkeit/Stimmung translation drift

Phase 1 metadata: "9 'state-of-mind' + 9 'attunement' surface-form occurrences." The user's inlinenote at line 60 directs: Befindlichkeit → state-of-mind; Stimmung → mood/attunement. Current usage at C074 ("attunement (Befindlichkeit)") and C077 ("attunement" for Befindlichkeit) drifts; C116 ("disclosive attunement or mood (Stimmung) of state-of-mind (Befindlichkeit)") is consistent with user preference. Patch needed for C074, C077; verify all 18 surface occurrences in a sweep.

### Cross-references to old chapter structure (CRITICAL)

The closing subsections (S8, S9) repeatedly invoke `§1.7` and `§1.8` and "the next chapter" + "§1.2/§1.3/§1.4/§1.5" as if from an older multi-section "Pathe" structure. In the consolidated DISS-04-EMOTION these are internal subsection references. Specific patches:

- C227 (line 118): "(cf. §1.7)" — refers to S7 (feedback loop, lines 86-115 in this section)
- C258 (line 140): refs "§1.3's analysis of DA I.1" — this is S4 of this section (Enmattered-Accounts, lines 62-65)
- C258 (line 140): "§1.5 specified the same moment from the action-theoretic side" — refers to S6 of this section (Somatic Preparation, lines 78-85)
- C260 (line 142): "§1.7's analysis of the synchronic chain" — refers to S7 (lines 86-115)
- C264 (line 144): "§1.8's analysis of the chain at M₃→M₄" — refers to S8 (Emotion's Function, lines 116-125)
- C287 (line 172): "feedback structure of which §1.7 has specified" — refers to S7
- C293 (line 174): "§1.7's analysis of the diachronic register" — refers to S7
- C306 (line 184): "temporal sedimentation specified in §1.7" — refers to S7

All of these are TODO-clarify items in revision. The user will need to decide whether to (a) rewrite cross-references to be intra-section ("as developed in the section on Y above"), or (b) keep the old §-numbers if the dissertation structure preserves them at some other level.
