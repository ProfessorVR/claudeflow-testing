# Inconsistencies and Fallacy-Candidates — Cross-Section Catalog

**Run-id**: 2026-05-13T1439
**Agent**: Phase 3 Wave 2 Agent D (Inconsistency + Fallacy Detection)
**Pipeline plan**: `tmp/Dissertation/DISSERTATION-ANALYSIS-PIPELINE-PLAN.md` v1.4 §9.2.1
**Input scope**: phase2-claims.json + phase2-narrative.md + phase2-edges.csv for §§1.0, 1.1, 1.2, 1.3, 1.4, 1.5 + DISS-DIAG-V7 phase2-node-audit.json
**Companion JSON**: `inconsistencies-and-fallacies.json`

---

## Severity & category summary

| Severity | Count |
|----------|-------|
| CRITICAL | 5 |
| MAJOR    | 10 |
| MINOR    | 6 |
| **Total** | **21** |

| Category | Count |
|----------|-------|
| architectural | 5 |
| numbering | 4 |
| citational | 4 |
| terminological | 4 |
| definitional | 2 |
| interpretive-unflagged | 1 |
| overreach | 1 |

No formal-fallacy candidates of the equivocation/strawman/hasty-generalization/circular type are tagged here as discrete findings; the four equivocation-watch concepts (*pathos*, *kinēsis*/*energeia*, *phantasia*/*phantasma*, basic affective valence / *pathē*) are absorbed into the terminological + definitional findings INCONS-005, INCONS-006, INCONS-007, INCONS-008, and INCONS-014. None of these constitute a deployed fallacy in the prose; they are equivocation-RISK candidates flagged for revision.

---

## CRITICAL findings

### INCONS-001 — Systemic A_n-naming inconsistency across §§1.0 / 1.3 / 1.5 / DIAG

**Severity**: CRITICAL · **Category**: architectural

**Sections involved**: DISS-00-INTRO (prose vs. embedded diagram); DISS-03-A3; DISS-05-A4; DISS-DIAG-V7

**Evidence loci**:
1. §1.0 line 45 (prose): "A_4 = completed cognitive actuality produced when the rational cognitive apparatus engages the *phantasma* — intellection, memory, deliberative or speculative thinking, or the committal dimension of *doxa*."
2. §1.0 line 64 (claim C080): A_2 → A_3 described as "the actualization of the completed cognitive actuality" — but per the chain's own numbering A_3 is the *phantasma* proper, not the completed cognitive actuality (that's A_4 by the prose convention, A_3 by the diagram convention).
3. §1.0 line 68 (claim C091 / roadmap): "M_3 → A_4 [as] the cognitive engagements of the *phantasma*" — but cognitive engagements happen AT A_3 (the *phantasma*), and M_3 → A_4 is the *orectic* motion to action.
4. §1.0 line 176 (embedded TikZ diagram): A_4 = "Completed Action (*praxis*)" — flatly contradicts line 45 prose.
5. §1.5 line 5 + §1.5 narrative ¶1: A_4 = "completed action (*praxis*)" — follows the §1.0 *diagram* convention.
6. §1.3 narrative (Phase 2, Diagram orphan-analysis): "Prose §1.3 uses A_3 to refer to what the diagram calls A_2 (the *phantasma* proper). Under diagram convention, A_3 is 'branching cognitive actualities'." The prose has shifted chain numbering by approximately +1 relative to the canonical HTML diagram.
7. DISS-DIAG-V7 phase2-node-audit canonical_diagram_structure: A_1 = Completed Perception; A_2 = The Phantasma Proper; A_3 = Branching Cognitive Actualities; A_4 = Completed Action (*praxis*). §§1.0/1.1/1.4/1.5 prose use A_2 = perception, A_3 = phantasma, A_4 = praxis (or "completed cognitive actuality" depending on locus).

**Description**: At least THREE inconsistent A_n labelings co-exist in the corpus:

| Convention | A_0 | A_1 | A_2 | A_3 | A_4 |
|------------|-----|-----|-----|-----|-----|
| (a) §1.0 PROSE line 45 / line 68 / §§1.1–1.4 default | motion+time | preconditions for perception (sensible obj, organ, soul) | completed perception with dual trace (resonant kinēsis) | phantasma proper (cognitive engagements) | completed cognitive actuality |
| (b) §1.0 DIAGRAM line 176 / §1.5 prose / DIAG canonical | motion+time | completed perception | phantasma proper | branching cognitive actualities | completed action (*praxis*) |
| (c) Canonical HTML diagram | sensible object | completed perception | phantasma proper | branching cognitive actualities | completed action |

Conventions (a) and (b) differ by ONE NODE: convention (a) places "phantasma proper" at A_3 and "completed action" outside the A_n series (treated as M_4 / consequent action); convention (b) places "phantasma proper" at A_2 and uses A_3 for cognitive engagements and A_4 for praxis. The HTML diagram convention (c) is almost identical to (b) but drops the motion-time substrate from A_0 in favor of the sensible object — a further offset.

The §1.0 prose at line 64 is internally inconsistent with the §1.0 prose at line 45: line 45 says A_4 = completed cognitive actuality, but line 64 describes A_2 → A_3 as producing the completed cognitive actuality (which would put completed cognitive actuality at A_3, not A_4). Three nested inconsistencies coexist in a single section.

**Affected claims**: DISS-00-C074, C080, C091, C092; DISS-03-C026, C076; DISS-05-C017, C033

**Affected edges**: DISS-00 (3 inconsistent-with edges); DISS-05-C017 (2 inconsistent-with edges to §1.0 prose AND §1.0 diagram); DISS-05-C033 (chain-formula drift)

**Proposed remediation**: **Adopt convention (b) — the diagram convention — chapter-wide**, since (i) the diagram is the load-bearing canonical apparatus per Plan §6 and DISS-DIAG-V7 node-audit, (ii) §1.5 already uses it, (iii) §1.0 line 68 roadmap is already partially aligned to it, and (iv) "completed cognitive actuality" is better named as the node where the cognitive engagements TERMINATE (i.e., the branching A_3-NOESIS / A_3-MEMORY / A_3-DISCURSIVE termini), not as a successor node. Concrete edits: (1) rewrite §1.0 line 45 to state A_3 = "completed cognitive actuality (the *phantasma* under the three orientational modes + doxa)" and A_4 = "completed action (*praxis*)"; (2) rewrite §1.0 line 64 to describe A_2 → A_3 as the cognitive engagement of the *phantasma*; (3) rewrite §1.0 line 68 to describe M_3 → A_4 as the *orectic* motion to action; (4) propagate the §1.0 prose fix into §§1.1–1.4 where they reference the chain numbering (especially §1.3 prose where C026/C076 use "three plus doxa-as-fourth" inconsistently); (5) verify the §1.0 TikZ embedded diagram block (lines 74–591) labels match the line-45 prose after the rewrite. Estimated effort: medium (semantic, not mechanical — every A_n mention in the introduction needs an audit pass; ~40 occurrences per DIAG node-audit counts).

---

### INCONS-002 — Burke *Grammar of Motives* pp. 280–281 cited THREE times in §1.1 for material the corpus locates at pp. 253 / 261–262

**Severity**: CRITICAL · **Category**: citational (`cites-but-misreads`)

**Sections involved**: DISS-01-A0 (3 instances); citation pattern may recur in §§1.3, 1.4, 1.5 (verification needed during cross-section sweep)

**Evidence loci**:
1. §1.1 line 7 (in `1.1_A0_Motion_and_Time_OUTPUT_v2.tex`): "Burke, *Grammar*, pp. 280–281, glossing *Metaphysics* IX.8" — for the "one actuality always precedes another in time right back to the actuality of the eternal prime mover" verbatim AND for the "man is 'prior' to boy" verbatim. Both attributed to pp. 280–281.
2. §1.1 line 33 (S3): "Burke isolates the architectural payoff: the entelechy 'allowed [Aristotle] to introduce another kind of priority, namely the "principle" involved in a given form' (Burke, *Grammar*, pp. 280–281)."
3. §1.1 PROMPT.md lines 43, 47, 127, 172: declared the pp. 280–281 locus as canonical for the section — this propagated the error into the OUTPUT.
4. Edges-csv evidence: DISS-01-C012, DISS-01-C015, DISS-01-C067 are all `cites-but-misreads` to "SECONDARY-LOCUS:Burke Grammar pp. 280-281". Phase 2 §1.1 narrative ¶25 explicitly flags: "VERIFY: corpus locus is pp. 253, 261-262".

**Description**: The chapter's foundational secondary-citation block at §1.1 (priority of actuality, entelechial completion, man-prior-to-boy formal-priority gloss, "one actuality always precedes another in time" gloss) is anchored to Burke pp. 280–281 across THREE distinct prose-citation sites. Per the corpus-index Burke pipeline (memory note: feedback-corpus-index-first) the priority-of-actuality and entelechy material is found at pp. 253 (one-actuality-always-precedes) and pp. 261–262 (man-prior-to-boy, entelechial-priority gloss) of Burke's *Grammar of Motives* — both in the Act chapter. Pages 280–281 are in the Agent chapter and address Hegel-Marx material unrelated to the priority-of-actuality thesis. The mis-citation is recursive: the §1.1 PROMPT.md template hard-coded the wrong page numbers, which then propagated through the OUTPUT v1 and v2.

**Affected claims**: DISS-01-C012, DISS-01-C015, DISS-01-C067 (direct); citation-gap table G05.

**Proposed remediation**: (1) Mechanical replace: `pp.~280--281` → `pp.~261--262` for the entelechy / man-prior-to-boy quotes; (2) `pp.~280--281` → `p.~253` for the "one actuality always precedes another in time" quote at line 7 first occurrence (this verbatim is from a different page than the entelechy gloss); (3) verify verbatim text against corpus-index Burke before propagating; (4) sweep §§1.3, 1.4, 1.5 for any further Burke-Grammar pp. 280-281 occurrences (Phase 2 indicated potential in §1.3 Burke-entelechy block at line 23 of narrative — needs primary source check). Effort: small (mechanical sed-replace plus 4 corpus verifications).

---

### INCONS-003 — Hawhee work-title misattribution: "energeia means the presence of the thing" attributed to *Bodily Arts* (2004) but corpus locates verbatim in *Rhetorical Vision* (2011)

**Severity**: CRITICAL · **Category**: citational (`cites-but-misreads`)

**Sections involved**: DISS-01-A0 (S2 line 21 of source; narrative ¶33)

**Evidence loci**:
1. §1.1 source (`1.1 - A0 - Motion and Time.md` line containing Hawhee citation): "*energeia* names something like physical presence: *energeia* means the presence of the thing" (Hawhee, *Bodily Arts* p. 154 [VERIFY: corpus has this verbatim at Hawhee 2011 *Rhetorical Vision* p. 154]).
2. Edges-csv DISS-01-C039: `cites-but-misreads` → "SECONDARY-LOCUS:Hawhee Bodily Arts p. 154" with note "Hawhee verbatim attributed to Bodily Arts; corpus has Hawhee 2011 Rhetorical Vision."
3. Phase 2 §1.1 narrative explicit flag (item iv in "What this section needs to be gold-standard"): "Hawhee work-title correction — the 'energeia means the presence of the thing' verbatim is attributed in corpus to Hawhee 2011 *Rhetorical Vision* p. 154, not Hawhee 2004 *Bodily Arts* p. 154."

**Description**: Hawhee has two extensively-cited works: *Bodily Arts of Rhetoric* (2004) and the 2011 *Rhetorical Vision* article. The "presence of the thing" verbatim for *energeia* belongs to the 2011 article, not the 2004 book. Same author + same page-number-by-coincidence (p. 154) makes the slip easy to commit but it remains a misreading: the cited bibliographic anchor does not contain the cited verbatim.

**Affected claims**: DISS-01-C039 (also citation-gap table G07).

**Proposed remediation**: Replace "*Bodily Arts* p. 154" with "*Rhetorical Vision* (2011) p. 154" in §1.1 and in the dissertation's bibliography. Verify against corpus-index Hawhee pipeline before committing. Effort: trivial (single-locus citation fix).

---

### INCONS-004 — §1.0 line 64 internal contradiction: A_3 simultaneously named "actualization of the completed cognitive actuality" and "phantasma proper"

**Severity**: CRITICAL · **Category**: definitional (sub-finding of INCONS-001 but stands as a self-contained internal contradiction within §1.0)

**Sections involved**: DISS-00-INTRO (line 45 vs. line 64 vs. line 68)

**Evidence loci**:
1. §1.0 line 45 (methodology subsection): A_3 = "the *phantasma* proper, generated from the *resonant kinēsis* at A_2".
2. §1.0 line 64 (claim C080): "A_2 → A_3" described as "the actualization of the completed cognitive actuality."
3. §1.0 line 68 (claim C091 / roadmap): A_3's subsequent sections analyze the cognitive engagements at "M_3 → A_4."

The three lines cannot all be true under any single A_n convention. Under convention (a) (§1.0 default), A_4 IS the completed cognitive actuality, so line 64's description of A_2 → A_3 producing the completed cognitive actuality is wrong by one node. Under convention (b) (diagram), A_3 is branching cognitive actualities (so line 64's "completed cognitive actuality at A_3" is acceptable), but then line 68's M_3 → A_4 cognitive-engagements claim is wrong (M_3 → A_4 is orectic motion to action).

**Description**: This is the most internally-load-bearing inconsistency in §1.0. It is what triggers the cascade of inconsistent-with edges DISS-00-C074 → DISS-00-C080 (architectural) and DISS-00-C091 → DISS-00-C074 (architectural). The user's text effectively presents the same A_n node under three labelings within three adjacent lines.

**Affected claims**: DISS-00-C074, C080, C091; consequent effects on DISS-03-C026, C076 (§1.3's "three vs four orientational modes" confusion is partly downstream of §1.0's A_3-conflation).

**Proposed remediation**: Bundled with INCONS-001 remediation. The fix is one-pass and self-consistent: pick convention (b), then rewrite §1.0 lines 45, 64, 68 in a single coordinated edit. The §1.0 → §§1.1–1.5 cascade is then a series of mechanical alignments.

---

### INCONS-005 — Equivocation-watch on `pathos`: four registers operate side-by-side in §1.4 without persistent index

**Severity**: CRITICAL · **Category**: terminological (equivocation-RISK)

**Sections involved**: DISS-04-EMOTION (§1.4 §S1 lines 9-22 explicitly catalogs the four senses); DISS-02-A1A2 (§1.2 uses *pathos*-fourfold from Met. Δ.21 at S4); DISS-03-A3; DISS-00-INTRO C046 (the "different *logos*" framing presupposes the equivocation will be controlled downstream).

**Evidence loci**:
1. §1.4 narrative ¶2 explicitly catalogs: "Aristotle uses *pathos* in at least four registers across his corpus: ontological (Met. Δ.21 — alterability); perceptual-affective (DA III.7 — pleasure/pain valence); rhetorical-emotional (Rhet. II.1 — anger, fear, pity, shame); bodily-physiological (DA I.1 — boiling blood)." Each register has a different intension.
2. §1.4 narrative ¶3 introduces *three* coined terms — *basic affective valence*, *pathos simpliciter*, *resonant orexis* — to track the register-distinctions. These are not yet introduced in §1.0 / §1.2 / §1.3 prose.
3. §1.2 narrative ¶V deploys the same *pathos* in *Metaphysics* Δ.21 fourfold (alterability, actuality of alteration, harmful alteration, magnitude) at the perceptual *paschein* level — without yet bringing in the §1.4 register-distinctions.
4. §1.4 source line 120: "(pathe/pathos?)" — explicit user-internal uncertainty about which register the term is operating in at a load-bearing site (see INCONS-006).
5. §1.4 source line 60 author-note: "Make sure I update my translation of Befindlichkeit to be state-of-mind and stimmung as attunement or mood" — indicates active terminological reckoning is in-progress for the chapter.

**Description**: The chapter uses `pathos` in (a) Met. Δ.21 ontological-alterability sense, (b) DA III.7 perceptual-affective sense, (c) Rhet. II.1 determinate-emotion sense, and (d) DA I.1 bodily-physiological sense, plus the user's coined *pathos simpliciter* (= basic affective valence with object present) — FIVE senses. The relations between them are made explicit at §1.4 ¶2 ff. but the same disambiguating apparatus is NOT propagated to §§1.0, 1.2, 1.3 where *pathos* and *pathē* appear in surrounding prose. The risk is equivocation: a downstream reader who has not yet read §1.4 may unify the register-distinctions covertly. The four senses do form a unified ontological structure (Heidegger's "progressive narrowing" reading; §1.4 ¶ on the Met. Δ.21 four-fold), but unity-of-structure is not the same as univocity-of-term, and the chapter currently asserts unity-of-structure without warning the reader against univocity-of-term inference.

**Affected claims**: DISS-04-C002, C025, C033 (basic affective valence scope drift between "is when" and "refers to two phenomena" — C002 vs C033 inconsistent-with edge); DISS-04-C236 (the pathe/pathos? marker at line 120); DISS-00 (C001, C046 use *pathos*-language at framing level without §1.4 register-distinction).

**Proposed remediation**: (1) Add a register-key footnote at §1.0 first *pathos*-occurrence pointing the reader forward to §1.4 ¶2's catalog; (2) at §1.2 first *pathos*-occurrence (in the S4 Metaphysics Δ.21 fourfold treatment) annotate which register is operative (ontological-alterability); (3) at §1.3 first *pathos*-occurrence annotate which register is operative; (4) at §1.4 line 120, RESOLVE the "pathe/pathos?" marker explicitly (see INCONS-006); (5) verify each downstream *pathos* in §§1.4 / 1.5 carries a stable register; consider color-coding or subscript convention internally during the revision pass.

---

## MAJOR findings

### INCONS-006 — User-internal uncertainty marker "(pathe/pathos?)" persists at §1.4 line 120, a canonical load-bearing site

**Severity**: MAJOR · **Category**: terminological / interpretive-unflagged

**Sections involved**: DISS-04-EMOTION

**Evidence loci**:
1. §1.4 source line 120 contains "pathe/pathos?" — an in-prose user query at a canonical site.
2. Edges-csv DISS-04-C236: `inconsistent-with` to "CONCEPT:pathē-vs-pathos" with note "T4 unflagged 'pathe/pathos?' query reveals user-internal uncertainty at canonical site."

**Description**: The question-mark in the prose itself reveals that the author is uncertain whether the operative term at that locus should be singular *pathos* or plural *pathē*. Since §1.4 is the canonical site for the *pathos* / *pathē* / basic-affective-valence / articulational-concretion architecture, this is a load-bearing under-determination. T4-unflagged status means the marker is not formally registered in the claim-extraction yet.

**Affected claims**: DISS-04-C236.

**Proposed remediation**: The user must resolve the marker. Heuristic recommendation: where the context is "the kind of being-affected belonging to a finite living being" (singular structure-of-being), use `pathos`; where the context is "the catalog of determinate emotions" (plural enumeration), use `pathē`. The §1.4 line 120 surrounding context determines which applies; flag for user review.

---

### INCONS-007 — Befindlichkeit translation drift: 11 occurrences in §1.4 source, alternating between "state-of-mind", "attunement", and untranslated

**Severity**: MAJOR · **Category**: terminological

**Sections involved**: DISS-04-EMOTION (the §1.4 source has 11 raw occurrences); §1.0 (no Befindlichkeit occurrences yet); §1.3 narrative ¶ on *Zeitlichkeit*; §1.5 narrative ¶ on *Befindlichkeit* (state-of-mind, "finding-oneself," attunement).

**Evidence loci**:
1. §1.4 source line 27: "state-of-mind" (in SZ §29 H.138 quote) AND "attunement (*Befindlichkeit*)" (in user prose).
2. §1.4 source line 33: "Attunement" (heading-level user prose).
3. §1.4 source line 58: "disclosive attunement or mood (*Stimmung*) of state-of-mind (*Befindlichkeit*)" — DOUBLE-translation (Stimmung as mood, Befindlichkeit as state-of-mind in user prose, but the same prose elsewhere uses attunement for Befindlichkeit).
4. §1.4 source line 60 (author note, in `\inlinenote{}` form): "Make sure I update my translation of Befindlichkeit to be state-of-mind and stimmung as attunement or mood" — author has self-flagged this for cleanup.
5. §1.4 source line 108: "state-of-mind (*Befindlichkeit*)".
6. §1.4 source line 110: SZ §68b verbatim uses "state-of-mind" (Macquarrie-Robinson canonical translation).
7. §1.4 source line 130: "state-of-mind (*Befindlichkeit*)" in user prose.
8. §1.4 source line 134: "*Befindlichkeit*-side" in user prose.
9. §1.4 source line 160: "state-of-mind" in user prose; "*Befindlichkeit*" elsewhere in same line.
10. §1.4 source line 172: "*Befindlichkeit*-analytic" in user prose.
11. §1.5 narrative ¶7: "*Befindlichkeit* (state-of-mind, 'finding-oneself,' attunement)" — TRIPLE-translation lined up.

Per memory note (USER DIRECTIVE: "state-of-mind" is the canonical translation for Befindlichkeit).

**Description**: Heidegger's *Befindlichkeit* is translated three ways across the §1.4 prose: "state-of-mind" (canonical Macquarrie-Robinson; user-preferred per author-note line 60), "attunement" (Stambaugh-Schmidt; user uses this in some prose surroundings), and untranslated. *Stimmung* is similarly drifting (mood / attunement). The author has self-flagged this at line 60 as needing cleanup.

**Affected claims**: DISS-04 claims at lines 27, 33, 58, 60, 108, 110, 130, 134, 160, 172 referencing Befindlichkeit; DISS-05 narrative on Befindlichkeit.

**Proposed remediation**: **Unify on the user-preferred convention**: Befindlichkeit → "state-of-mind" (with `(Befindlichkeit)` parenthetical at first occurrence per section); Stimmung → "attunement" (with `(Stimmung)` parenthetical at first occurrence per section). Resolve the §1.4 line 60 author-note by performing the global replace. Cross-check direct quotations from SZ — the Macquarrie-Robinson translation uses "state-of-mind" for Befindlichkeit, so direct quotes are already consistent; only the user-prose surrounding the quotes needs alignment. Effort: small (sed-replace + 11 verifications).

---

### INCONS-008 — Internal cross-references in §1.4 to "§1.5", "§1.7", "§1.8" use old subsection-numbering that should be S5, S7, S8 of §1.4 itself

**Severity**: MAJOR · **Category**: numbering

**Sections involved**: DISS-04-EMOTION (internal cross-refs); affects how §1.4 reads relative to its own internal structure.

**Evidence loci**:
1. §1.4 source line 134: "what S1.2's articulational-concretion thesis recovered as the *Befindlichkeit*-side... and what S1.4 specified as the involuntary uptake" — S1.2 and S1.4 are internal subsections of §1.4 (referring to its own subsections), but the numbering format "§1.X" is ambiguous: a reader at chapter-level may interpret this as cross-chapter references to §§1.2 and 1.4 of the dissertation (which §1.4 IS, in the chapter's enumeration — making the self-reference incoherent).
2. §1.4 source line 136: "S1.4's per-emotion analyses of the *Rhetoric*'s definitions" — same ambiguity (S1.4 = subsection 4 of §1.4 chapter, but format collides with the chapter's own enumeration).
3. §1.4 source line 140: "the moment that S1.3's analysis of *De Anima* I.1, 403a25–b19 secured" — S1.3 again ambiguous.
4. §1.4 source line 140: "S1.5 specified the same moment from the action-theoretic side" — internal subsection reference S5, but reads as the chapter §1.5 in the dissertation enumeration.
5. §1.4 source line 142: "S1.7's analysis of the synchronic chain and diachronic saturation" — refers to S7 of §1.4 (the synchronic/diachronic subsection).
6. §1.4 source line 144: "S1.8's analysis of the chain at M_3 → M_4" — refers to S8 of §1.4.
7. §1.4 source line 172: "S1.7 has specified at the *pathos* level itself" — refers to S7 of §1.4.
8. §1.4 source line 174: "S1.7's analysis of the diachronic register of the feedback loop" — refers to S7 of §1.4.
9. §1.4 source line 184: "the temporal sedimentation specified in S1.7 receives its sustained practical-philosophical treatment" — refers to S7 of §1.4.
10. Edges-csv DISS-04-C287 and DISS-04-C306: explicit `inconsistent-with` numbering edges flagging "§1.7" and "§1.8" as "stale numbering" / "stale cross-reference."

**Description**: At minimum 9 occurrences of internal subsection cross-references use `\S1.X` notation that is ambiguous with the chapter-level §1.X enumeration. Worst-case reader interpretation: §1.4 line 140's "S1.5 specified the same moment from the action-theoretic side" is treated as a forward-reference to chapter §1.5 (which DOES treat action), so the reader expects to find action-theoretic material in chapter §1.5 — which §1.5 does provide, BUT the §1.4 prose intended to reference its OWN internal subsection 5. The semantic accident may sometimes resolve to the right place, but it is unsound and the §1.7 / §1.8 cases definitely do not resolve (chapter §1.7 and §1.8 do not exist — the chapter ends at §1.5).

**Affected claims**: DISS-04-C287, C306; cross-cuts §1.4 throughout.

**Proposed remediation**: **Replace internal subsection refs with section-letter notation**: "§1.4 S5" → "subsection S5 above" or "the action-theoretic subsection below (S5)"; "§1.7" → "the synchronic-diachronic subsection (S7) above"; "§1.8" → "the M_3 → M_4 subsection (S8) above." Alternatively, use named-section references (e.g., "the articulational-concretion subsection") rather than numbered. Per Plan §3.1 the canonical convention should be documented in the front-matter. Effort: medium (10 careful edits; user must verify each refers to the intended subsection).

---

### INCONS-009 — Phys. IV.14 strong-reading explicitly flagged in §1.1 but downstream unflagged uses possible in §§1.2, 1.4 (verification needed)

**Severity**: MAJOR · **Category**: interpretive-unflagged (potential)

**Sections involved**: DISS-01-A0 (canonical site, properly flagged); DISS-02-A1A2; DISS-04-EMOTION.

**Evidence loci**:
1. §1.1 narrative §S6 "THE STRONG READING": Phys. IV.14 223a25-27 strong-reading is explicitly flagged ("The chapter adopts a stronger interpretive reading of the conditional than Aristotle's text strictly compels: *time without a counting soul is not merely unnumbered but ontologically incomplete*... The reading is interpretive rather than textually compelled, and the chapter flags it as such.").
2. §1.1 narrative §S6 closes: "The strong reading of Phys. IV.14 aligns most cleanly with the Heideggerian recovery..." — i.e., the strong reading is presupposed by the §1.1 Heideggerian gloss.
3. Edges-csv DISS-01-C148: `inconsistent-with` to DISS-01-C147 with note "Meta-flag confirms — but rhetorically, this is the explicit interpretive-marker that the strong reading is the chapter's interpretive move."
4. §1.2 narrative on time-and-perception: uses the *resonant kinēsis* terminology that presupposes the time-soul interdependence (i.e., the strong reading). No explicit flag found in §1.2.
5. §1.4 narrative on synchronic/diachronic temporality: deploys *Befindlichkeit*/*Zeitlichkeit* + Aristotle without re-flagging the underlying Phys. IV.14 strong reading.
6. §1.1 narrative explicit corpus-locus correction needed: "the strong-reading passage is standardly 223a21-26, not 223a25-27" (Phase 2 §1.1 narrative item iii).

**Description**: §1.1 is the canonical-flagging site (4+ explicit flags) for the Phys. IV.14 strong reading. Downstream sections inherit the strong reading implicitly when they deploy soul-dependent temporality language; whether this counts as an unflagged use depends on whether the §1.0 introduction has propagated the flag down-stream. Per §1.0's metadata-commitment treatment (Methodology subsection lists "ontological incompleteness of time without soul" as one of four interpretive-readings-that-go-beyond-Aristotle), the strong reading IS flagged at §1.0 once and §1.1 multiply, but §§1.2 and 1.4 do not re-mark it on each redeployment. Whether this is a true inconsistency or merely an absent breadcrumb depends on revision standards.

**Affected claims**: DISS-01-C147, C148, C145 (Bekker-locus correction); potential DISS-02 and DISS-04 claims using soul-dependent temporality without strong-reading reflag.

**Proposed remediation**: (1) Fix the Bekker locus in §1.1 from 223a25-27 to 223a21-26 (Phase 2 §1.1 noted this); (2) at §1.2 first deployment of *resonant kinēsis*'s temporal-persistence claim, add a parenthetical "(per the strong reading of Phys. IV.14 defended in §1.1)"; (3) at §1.4 first deployment of *Befindlichkeit*'s temporal-grounding-of-pathos claim, similarly cross-reference §1.1's strong reading. Effort: small (3 brief insertions).

---

### INCONS-010 — §1.2 lines 83 / 99: old M_2→M_3 form inconsistent with new M_2→A_3 convention; lines may also be substantively distinct phantastic-motion stages

**Severity**: MAJOR · **Category**: numbering (potential additional substantive distinction)

**Sections involved**: DISS-02-A1A2

**Evidence loci**:
1. §1.2 source lines 83 and 99 use the old form M_2→M_3 while line 134 uses the new M_2→A_3. Edges-csv: DISS-02-C130 and DISS-02-C148 are `inconsistent-with` numbering edges to C134.
2. §1.2 Phase 2b flag (per task description): "lines 83/99 as possibly distinct from M_2→A_3 phantastic motion (doxa-ratification motion vs phantasma-constitution motion)" — there may be TWO M_2→A_3 motions covertly conflated.

**Description**: The numbering inconsistency is mechanical but may mask a substantive question: do §1.2's old-form M_2→M_3 references at lines 83/99 name the SAME motion as §1.2's new-form M_2→A_3 references at line 134, or do they name DIFFERENT motions (e.g., the doxa-ratification step at S6 vs. the phantasma-constitution step at S7)? If the same motion: pure mechanical rename. If different: requires architectural clarification.

**Affected claims**: DISS-02-C130, C148, C134.

**Proposed remediation**: (1) Read §1.2 lines 83/99 against line 134 substantively to determine whether they refer to a single motion or distinct motions. (2) If single: rename to the new convention. (3) If distinct: introduce a sub-numbering (e.g., M_2→A_3-α vs. M_2→A_3-β) and add explicit prose clarification. The diagram already shows ONE M_2→A_3 motion (HTML M12 / display "M_2→A_2"), so the substantive answer is probably "same motion" but requires user confirmation. Effort: medium (substantive reading needed).

---

### INCONS-011 — §1.4 C201 and C082 internal architectural-numbering disagreement on which A_n the basic *pathos simpliciter* lives at

**Severity**: MAJOR · **Category**: architectural / numbering

**Sections involved**: DISS-04-EMOTION (internal); cascades to §1.0's A_n confusion (INCONS-001).

**Evidence loci**:
1. Edges-csv DISS-04-C201 → DISS-04-C082: `inconsistent-with` numbering with note "Synchronic A0→A4 numbering conflicts with C082 placing basic *pathos simpliciter* at A_1."
2. §1.4 source line 58 (in main prose): "basic affective valence... is co-given with perception from the earliest moment of the actualization chain" — context places basic affective valence AT the perceptual A_n.
3. §1.4 narrative ¶: "the chain therefore exhibits basic affective valence as the disclosive ground from which *doxa* and the *pathē* proceed" — places basic affective valence STRUCTURALLY-PRIOR to *doxa* (which sits at A_3 in convention (a) / A_2 in convention (b)). Under convention (a), basic affective valence sits at A_2 (the completed perception). Under convention (b), basic affective valence sits at A_1.

**Description**: Internal to §1.4, there is ambiguity about which A_n hosts *pathos simpliciter* / basic affective valence. The substantive position is clear (it sits at the completed perception, before doxa); the numerical answer depends on which A_n convention applies. Resolution is downstream of INCONS-001.

**Affected claims**: DISS-04-C201, C082.

**Proposed remediation**: Bundled with INCONS-001. Once the A_n convention is fixed, the locus for basic affective valence is determinate.

---

### INCONS-012 — §1.3 lines 29 vs. 31: three orientational modes (+ orthogonal *doxa*) vs. four orientational modes (with *doxa* as fourth)

**Severity**: MAJOR · **Category**: structural / definitional

**Sections involved**: DISS-03-A3

**Evidence loci**:
1. §1.3 source line 29: "Three orientational modes must accordingly be distinguished: intellection (νοῦς), memory (μνήμη), and the discursive mode... Alongside these three orientational modes, a structurally distinct dimension enters the engagement: doxa, the propositional taking-as-something-true... where it will be shown to operate not as a fourth parallel mode but as an orthogonal committal layer."
2. §1.3 source line 31: "Four orientational modes must be distinguished: intellection (nous), memory, and that mode which Aristotle designates deliberative phantasia... Alongside the three orientational modes, a fourth and structurally distinct dimension enters the engagement: doxa..."
3. §1.3 narrative explicit flag: "(see line 67) lines 5 and 119 use new M→A convention; lines 59, 65, 67, 114, 117 use old M→M convention. Line 67 self-acknowledges with '(double check numbering)'."
4. Edges-csv DISS-03-C026 → DISS-03-C024: `inconsistent-with` terminological with note "Line 31 says 'Four orientational modes must be distinguished' but enumerates three plus doxa-as-fourth; line 29 says three plus doxa-as-orthogonal — internal inconsistency."
5. Edges-csv DISS-03-C076 → DISS-03-C026: structural inconsistency edge.

**Description**: Within two paragraphs of each other, §1.3 enumerates the orientational modes as both THREE (with doxa-as-orthogonal) and FOUR (with doxa-as-fourth-mode-but-also-orthogonal-layer). The position of doxa is the locus of confusion: line 29 says "not a fourth parallel mode but an orthogonal committal layer"; line 31 says "a fourth and structurally distinct dimension... operates not as a fourth parallel mode but as an orthogonal committal layer." The §1.3 narrative's reading (line 31 says THREE + doxa-as-orthogonal) matches line 29 but not the literal line 31 prose ("Four orientational modes must be distinguished").

**Affected claims**: DISS-03-C024, C026, C076.

**Proposed remediation**: **Rewrite §1.3 line 31 to match line 29**: replace "Four orientational modes must be distinguished" with "Three orientational modes must be distinguished" and adjust the following sentence so that *doxa* is unambiguously an orthogonal committal layer over the three modes, never a "fourth orientational mode." The downstream prose at line 112 already uses the three+orthogonal formulation correctly; the line 31 phrasing is the outlier. Effort: trivial (one-line fix).

---

### INCONS-013 — §1.5 self-reference to "§1.5" at line 5 likely intended §1.4

**Severity**: MAJOR · **Category**: numbering (cross-reference)

**Sections involved**: DISS-05-A4

**Evidence loci**:
1. Edges-csv DISS-05-C015: `inconsistent-with` structural with note "§1.5 cross-reference to '§1.5' is self-reference; likely intends §1.4."

**Description**: §1.5 contains an apparent self-reference at line 5 (per Phase 2 §1.5 edges). The intended target is probably §1.4 (the emotion chapter, which §1.5 builds on for the praxis-*hexis* analysis). The error is mechanical.

**Affected claims**: DISS-05-C015.

**Proposed remediation**: Replace "§1.5" → "§1.4" at the locus. Verify the surrounding prose to confirm §1.4 is the intended target. Effort: trivial.

---

### INCONS-014 — Conflation-risk: *phantasia* (activity / faculty) vs. *phantasma* (product) — distinction is rigorous at §1.3 but may slip in §§1.0, 1.4

**Severity**: MAJOR · **Category**: terminological (equivocation-RISK)

**Sections involved**: DISS-00-INTRO; DISS-03-A3 (canonical site); DISS-04-EMOTION.

**Evidence loci**:
1. §1.3 narrative ¶3 explicitly establishes the distinction: "*Phantasia* names the soul's capacity and activity of generating presentation-images from perceptual residue. *Phantasma* names the determinate image that results from that activity."
2. §1.0 narrative ¶: "*phantasia* 'draws upon or reactivates the resonant motion to generate an internal image (*phantasma*)' — in an act of recollection, imagination, reasoning, or opinion-formation." — uses both but does not explicitly distinguish.
3. §1.4 narrative usage: "*phantasia* generates appearances beyond the immediately present" (¶ on appearance) — uses *phantasia* in the activity-sense; consistent. But §1.4 also uses "*phantasmatic* field," "*phantasmatic* representation" — adjectival forms that may collapse the distinction.
4. §1.0 metadata occurrence-count cross-check (Phase 2 §1.0 coined-term map): *phantasia* appears extensively; *phantasma* appears only in the chain-numbering enumeration and the four-event-thesis. The two are NOT formally distinguished in §1.0's prose.

**Description**: The capacity/activity/product distinction is load-bearing for the chapter (per §1.3 Papachristou citation and Frede 1992 p. 279 threefold). Where prose uses *phantasia* and *phantasma* without the distinction operating, the reader may equate the activity with the product. This is not yet a deployed equivocation in any traceable claim, but the canonical-site §1.3 establishes the distinction; §1.0 and §1.4 should propagate it.

**Affected claims**: DISS-00 C022, C089-C092 (use both terms in chain-roadmap); DISS-04 narrative passim.

**Proposed remediation**: At §1.0 first joint occurrence of *phantasia* and *phantasma*, add a parenthetical noting the capacity/activity vs. product distinction (per §1.3 canonical site). Effort: small (one footnote or parenthetical at §1.0 ¶3 ish).

---

## MINOR findings

### INCONS-015 — §1.0 informal "resonant motion" at line 19 vs. canonical *resonant kinēsis* at §§1.0 lines 62/68/89 and §1.2

**Severity**: MINOR · **Category**: terminological (coined-term-introduction drift)

**Sections involved**: DISS-00-INTRO; DISS-02-A1A2.

**Evidence**: §1.0 line 19 (T_3 of the four-temporal-events thesis): "a kind of inner likeness, a resonant motion, is generated and remains in the soul." §1.0 lines 62, 68, 89 use the canonical *resonant kinēsis* in the methodology + roadmap. §1.2 canonical introduction (S5 "Resonant Kinēsis: The Persisting Impression") uses *resonant kinēsis* throughout. Edges-csv DISS-00-C022 → DISS-02-RESONANT-KINESIS.

**Remediation**: Replace §1.0 line 19 "resonant motion" with "resonant *kinēsis*" (the term is canonically named six lines later anyway; the informality at line 19 is pre-introductory). Effort: trivial.

---

### INCONS-016 — §1.4 T7 Bekker typo "13789" should be "1378" (Rhet. II.1)

**Severity**: MINOR · **Category**: citational (mechanical typo)

**Sections involved**: DISS-04-EMOTION.

**Evidence**: Edges-csv DISS-04-C025 `inconsistent-with` ARISTOTLE-LOCUS:Rhet. II.1 1378a20-22, note "T7 Bekker typo '13789' should be '1378'", line 9.

**Remediation**: Replace "13789" → "1378a20-22". Effort: trivial.

---

### INCONS-017 — §1.4 T7 typo "ON the Soul" should be "On the Soul" (line 58)

**Severity**: MINOR · **Category**: citational (mechanical typo)

**Sections involved**: DISS-04-EMOTION.

**Evidence**: Edges-csv DISS-04-C115; line 58.

**Remediation**: Capitalization fix. Effort: trivial.

---

### INCONS-018 — §1.4 T7 Bekker typo "7022" should be "702a2" or "702a3" (MA 8)

**Severity**: MINOR · **Category**: citational (mechanical typo)

**Sections involved**: DISS-04-EMOTION.

**Evidence**: Edges-csv DISS-04-C167; line 82.

**Remediation**: Replace "7022" with intended "702a2" or "702a3" depending on context. Effort: trivial (verify against MA 8 locus).

---

### INCONS-019 — §1.4 T7 typo "ontologicla" at line 128

**Severity**: MINOR · **Category**: citational (mechanical typo, spelling)

**Sections involved**: DISS-04-EMOTION.

**Evidence**: Edges-csv DISS-04-C248; line 128.

**Remediation**: Correct spelling to "ontological". Effort: trivial.

---

### INCONS-020 — §1.5 "Chain analysis is complete" claim at line 29 is OVERREACH given §§1.0–1.3 under-development

**Severity**: MINOR · **Category**: overreach

**Sections involved**: DISS-05-A4.

**Evidence**: Edges-csv DISS-05-C098: `inconsistent-with` structural to UPSTREAM-UNDERDEV, note "'Chain analysis is complete' overreach given §§1.0-1.3 under-development." Also §1.5 narrative §S1 acknowledgement: "§1.5 will be revised LAST after §§1.0–1.4 stabilize."

**Remediation**: Soften "chain analysis is complete" to "the structural-architectural analysis of the chain, at the level of detail this chapter requires, is now in place" or similar hedge. The conclusion can claim local completion without forward-promising that no §1.0–1.4 work remains. Effort: small (single sentence rewrite).

---

### INCONS-021 — Three-types-of-action treatment must be consistent between §§1.4 and 1.5

**Severity**: MAJOR · **Category**: architectural

**Sections involved**: DISS-04-EMOTION; DISS-05-A4.

**Evidence loci**:
1. §1.5 narrative architecture-thesis: "the kinetic-roles spine of *De Anima* III.10... holds invariant across all three types of action Aristotle catalogs in *Movement of Animals*. The DA III.10 schema — unmoved originator (realizable good), moved mover (*orexis*), and moved (animal-via-ball-and-socket-joint) — is preserved across types because it specifies the *fundamental kinetic structure* of any *orectic* actualization."
2. §1.5 Type 1 = simple appetition (no *doxa*); Type 2 = habitual-procedural action (*doxa* present, technē-*hexis*); Type 3 = evaluatively complex action (*doxa* present, evaluative content, praxis-*hexis*).
3. §1.4 narrative ¶ on MA-drinking case: "Where the apparent good is straightforwardly pleasant or painful — the drinking case of MA 7, 701a32-33 — basic affective valence suffices, and the chain runs without internal complexity. The conversion is reserved for the case in which doxa has done its articulational work."
4. §1.5 Special Instruction (f): "verify that [§1.5 two-level modulation thesis] is consistent with §1.4's *hexis*-bivalence treatment. Provisional finding: §1.4 establishes the bivalence in principle; §1.5 elaborates the operational two-level structure. The two treatments are consistent but the §1.5 elaboration is novel and needs §1.4 cross-reference."
5. Edges-csv DISS-05-C081 → DISS-04-EMOTION-HEXIS-TREATMENT: `inconsistent-with` architectural with note "Verify consistency with §1.4 hexis-bivalence treatment per Special Instruction (f)".

**Description**: §1.4 sets up the basic-affective-valence / *pathē* distinction (Type 1 = basic valence drives drinking; Type 3 = articulationally-concrete *pathē* drive evaluative action). §1.5 extends this with Type 2 (habitual-procedural action, technē-*hexis*), which is NOT discussed in §1.4. The two-level *hexis* modulation (basic-valence input level + doxa-gate level) is §1.5's novel articulation. The Phase 2 §1.5 reading flags this as "consistent in principle but novel in §1.5"; the consistency check needs an explicit §1.5-to-§1.4 cross-reference and §1.4 may need a forward-promise to Type 2.

**Affected claims**: DISS-04 C002, C033 (basic affective valence definition); DISS-05 C076, C081 (two-level thesis); DISS-05 C031 (technē-/praxis-*hexis* synthesis).

**Proposed remediation**: (1) Insert §1.4 forward-promise mentioning Type 2 (habitual-procedural) chains where the chapter's basic-affective-valence vs. *pathē* dichotomy makes contact with §1.5's three-types schema; (2) Insert §1.5 cross-reference to §1.4 at the praxis-*hexis* introduction. Effort: small (two bridge insertions).

---

## Cross-section pattern summary

### Equivocation-watch (from Plan §9.2.1)

- `pathos` — INCONS-005 (CRITICAL): 4-5 registers; §1.4 catalog ¶2 controls but downstream sections do not propagate disambiguation.
- `kinēsis` vs `energeia` — covered indirectly via INCONS-001/004 (A_n labeling) and §1.1's *energeia ateles* / *Bewegtheit* framing. The *kinēsis*-as-incomplete-motion vs *energeia*-as-self-contained-actuality distinction is rigorously deployed in §1.1 §S2 and consistent downstream. NO inconsistency-finding warranted.
- `phantasia` vs `phantasma` — INCONS-014 (MAJOR): canonical at §1.3; propagation to §§1.0 and 1.4 needs reinforcement.
- `basic affective valence` vs `pathē` — covered under INCONS-005 (pathos register) + DISS-04-C002 vs C033 (definition-scope drift between "is when" and "refers to two phenomena" at coined-term-introduction site).

### Marker placeholders (****** quotation bodies awaiting verbatim)

Per memory note (`feedback-missing-source-placeholder.md`), these are deliberate user placeholders, NOT inconsistencies. Cataloging here for completeness:
- §1.1 line 25 (Bewegtheit) — BCAP page TBD
- §1.1 line 53 — SZ §18 H.84 TBD
- §1.1 line 67 — SZ §81 H.421-422 TBD
- §1.1 line 79 — SZ §65 H.328-329 TBD
- §1.2 lines 23, 47, 55, 79 — TBD (per task description; cataloged in §1.2 phase2 citation-gap table)
- §1.4 line 174 — BCAP page TBD for *pathē*/*hexeis* fundamental-concepts-of-being verbatim.

### Resonant orexis: ZERO drift confirmed

Per Phase 2 cross-section coined-term tracking: *resonant orexis* is used consistently across §§1.0/1.2/1.3/1.4 as "basic affective valence in the case where the object of sense is no longer present: the residual hedonic tonality." The §1.4 canonical-definition site is internally consistent with §1.2's introduction and §1.3's deployment. **NOTE**: The basic-affective-valence ↔ resonant-orexis relation IS explicitly stated at §1.4 line 13 narrative: "Both *pathos simpliciter* and *resonant orexis* belong to **basic affective valence**" — so the verification requested in the task description (that the BAV-to-resonant-orexis relation be explicitly stated at the §1.4 canonical site) is **CONFIRMED PRESENT**.

### Architectural-mismatch §1.0 promises vs. §§1.1–1.5 delivery

Per Phase 2 §1.0 architectural-promise table: **7 FULFILLED, 3 PARTIALLY-FULFILLED, 1 UNFULFILLED-DEFERRED.** The 1 unfulfilled-deferred is the "Chapter ???" placeholder (rhetorical-framing defense). The 3 partially-fulfilled are: (i) Papachristou three-grades framework (§1.0 forward-promise; §1.3 inlinenote-flagged); (ii) phantasia-as-temporal-medium framing drift relative to §1.1's A_0 + §1.2's A_2 placements (sub-finding of INCONS-001's A_n family); (iii) the M_3 → A_4 cognitive-engagements vs. orectic-motion-to-action drift (DIRECT sub-finding of INCONS-001). All three are covered by remediation of INCONS-001.

---

**END OF CATALOG**

*Total findings: 21 (5 CRITICAL, 10 MAJOR, 6 MINOR). Categories: 5 architectural, 4 numbering, 4 citational, 4 terminological, 2 definitional, 1 interpretive-unflagged, 1 overreach. No formal-fallacy candidates of the equivocation/strawman/hasty-generalization/circular type warrant standalone tagging beyond the equivocation-RISK findings already absorbed into INCONS-005, INCONS-007, INCONS-014.*
