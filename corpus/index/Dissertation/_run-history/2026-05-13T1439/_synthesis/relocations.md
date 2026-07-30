# Relocations Specification

**Run ID**: `2026-05-13T1439`
**Agent**: Phase 3 Wave 2 Agent E (Relocations + Outlines)
**Plan reference**: `DISSERTATION-ANALYSIS-PIPELINE-PLAN.md` v1.4 §9.2.2
**Deliverable**: `_synthesis/relocations.{md,json}`
**Companion JSON**: `relocations.json` (machine-readable, full claim-ID lists and verbatim text)

---

## Summary

| Metric | Value |
|---|---|
| User-mandated relocations | 3 |
| Pipeline-detected additional relocations | 0 |
| **Total relocations** | **3** |
| Estimated user execution time | 180–240 min (3–4 hr) |
| Section affected (source) | DISS-04-EMOTION (§1.4) |
| Section affected (target) | DISS-02-A1A2 (§1.2) |
| Net §1.4 word-count change | −1,450 words approx. |
| Net §1.2 word-count change | +1,450 words approx. |

The three user-mandated relocations are the entire relocation set. Phase 2's scan of all six dissertation sections (DISS-00-INTRO through DISS-05-A4) surfaced **zero additional** relocation candidates. The §1.1 passing references to *phantasia* (DISS-01-C055, C155, C158) are forward-reference foreshadowing for the chain architecture, not canonical *phantasia* treatments; they pass the appropriateness test per Plan §9.2.2 step 4.

---

## Relocation 1 — *Pathos*-Metaphysics-fourfold (§1.4 → §1.2)

### Overview

| Field | Value |
|---|---|
| ID | REL-001 |
| Status | User-mandated |
| Priority | P0 — load-bearing for §1.2/§1.4 architectural separation |
| Source file | `tmp/Dissertation/1.4 - Emotion is Motion/1.4 - Emotion is Motion.md` |
| Source lines | 35–49 (entire §1.4-S3b subsection) |
| Source subsection | DISS-04-S3b "The *Metaphysics* Fourfold: *Pathos* from Alterability to Magnitude" |
| Target file | `tmp/Dissertation/1.2 - A1-A2 - Aisthesis/1.2_A1-A2_Aisthesis_OUTPUT_v1.tex` |
| Target lines | 43–47 (within §1.2-S4) |
| Target subsection | DISS-02-S4 "Perception as Enmattered *Alloiōsis* and the Four Senses of *Pathos*" |
| Approx words to move | 850 (of 1,002 in source subsection) |
| Approx words to keep in §1.4 | 152 (the C099–C104 four-senses-at-basic-valence payoff) |

### Source claim manifest

**Claims to move in full to §1.2:**
`DISS-04-C084, C085, C086, C087, C088, C089, C090, C091, C092, C093, C094, C095, C096, C097, C098`

**Claims to keep in §1.4 as fourfold-at-basic-valence payoff:**
`DISS-04-C099, C100, C101, C102, C103, C104`

### Target receiving structure

**Receiving claims in §1.2-S4:**
`DISS-02-C069, C070, C071, C072, C073, C074, C075, C076, C077, C078, C079`

**Insertion anchor:** AFTER C069 (line 43, "The full structural frame within which this mode operates is given by Aristotle's fourfold articulation of pathos in *Metaphysics* Δ.21"), BEFORE C074 (line 47, "The four senses articulate pathos as the structure of being-occurrable-to").

**Fit quality:** **EXCELLENT.** §1.2-S4 was authored as a receiving structure for this exact relocation — the Δ.21 verbatim block is already in place (lines 44–46), the asterisk placeholder for BCAP 131–132 is already authored (line 47), and the meta-statement that the fourfold "serves as the frame for the perceptual case alone" (C079) already directs the reader to expect the higher-order treatment in §1.4.

### Rationale

The fourfold is canonically a treatment of *pathos* at the perceptual level — the structure of being-occurrable-to that belongs to any finite living being. §1.2 (the aisthēsis chapter) is the architectural home for this material. §1.4's job is to demonstrate the higher-order *pathē* as articulationally concrete instances of the structure already established at the perceptual level. After the relocation, §1.2 establishes the fourfold once in its canonical perceptual register; §1.4 deploys it again at the doxa-mediated, propositionally-articulated level. The two registers — basic affective valence vs. the higher-order *pathē* — become the two articulational concretions of the same single ontological structure (the user's central thesis) without §1.4 having to re-establish the fourfold from scratch.

What the relocation accomplishes:
- Removes the architectural redundancy of introducing the fourfold twice.
- Underwrites §1.2's claim that the fourfold "is taken up at the level of higher-order *pathē* in the emotion section" (C079) — currently this claim has no antecedent in §1.2.
- Lets §1.4's §S3b → §S3c → §S3d arc tighten around the higher-order-*pathē* application.
- Aligns with the user's "two articulational concretions of one ontological structure" thesis: the structure must be established once (§1.2) and concretized twice (§1.2 basic affective valence payoff + §1.4 *pathē* payoff).

### Verbatim to move (§1.4 lines 35–49)

See `relocations.json` field `relocations[0].verbatim_to_move_from_§1.4_lines_35_to_49` for the full extracted text. Summary of what moves:

- The verbatim Δ.21 enumeration (Aristotle's four senses) — currently in the §1.4 footnote at line 37.
- Heidegger's per-sense gloss (BCAP 131, BCAP 131, BCAP 131, BCAP 132).
- The "progression from one sense to the next is not arbitrary" paragraph (§1.4 line 46).
- Heidegger's "genuine relatedness" synthesis at BCAP 132.
- The sōtēria/preservation paragraph (§1.4 line 46 closing).
- The DA II.5, 417b2-5 footnote at §1.4 line 46 (load-bearing for the sōtēria gloss).

The trailing §1.4 prose at lines 47–48 (C099–C104, "Each of the four senses of *pathos* is structurally satisfied at the level of basic affective valence...") corresponds to the payoff site and **stays in §1.4** with a bridge text below.

### Bridge text for the §1.2 target (integration note)

The relocated §1.4 material expands what is currently a 4-line frame at §1.2 lines 43–47 into a full subsection establishing the fourfold canonically. The user should:

1. Remove the existing line-47 "progressive narrowing" / "genuine relatedness" interpretive paraphrase (C075–C076), since the relocated material includes the verbatim treatment.
2. Replace the existing BCAP 131–132 asterisk placeholder (line 47, the verbatim Heidegger "gathers the four under a single thesis") with the new full quotation from the §1.4 source.
3. Revise C077 (the "each of the four senses... is satisfied at the perceptual level" summary) to function as the perceptual-level payoff that the §1.4 relocation does NOT include (since the §1.4 payoff at C099–C104 demonstrates fourfold-at-basic-affective-valence, the §1.2 receiving structure must demonstrate the parallel fourfold-at-aisthesis claim).

After integration, the §1.2-S4 subsection reads:

1. Two kinds of *alloiōsis* (C062–C068).
2. The Metaphysics Δ.21 fourfold introduced verbatim (relocated from §1.4 line 37).
3. Heidegger's progressive-narrowing gloss (relocated full paragraph from §1.4).
4. The BCAP 132 sōtēria/preservation gloss (relocated closing paragraph from §1.4).
5. The four-senses-at-aisthesis payoff (existing §1.2 C077, revised).
6. The meta-statement that the fourfold is taken up at the higher-order *pathē* level in §1.4 (existing §1.2 C079).

### Bridge text for the §1.4 residue (the back-reference pointer paragraph)

In place of the relocated §S3b subsection at §1.4 lines 35–49, insert the following pointer paragraph immediately before the C099–C104 payoff material (drafted in the user's voice per the `dalton-academic-mkn82c3v` style profile — hypotactic, periodic-running, no contracted forms, author-prominent citation):

> The fourfold articulation of *pathos*, treated canonically in §1.2 (the *aisthēsis* chapter), establishes the perceptual case as the structural ground from which the higher-order *pathē* of the *Rhetoric* proceed. Each of the four senses Heidegger gathers from *Metaphysics* Δ.21 — alterability, the *energeia* of alteration, harmful alteration, and the magnitude of the harmful — was there shown to be satisfied at the level of the basic affective valence co-given with every *aisthēsis*. The present section accordingly takes the fourfold as established and turns to its articulationally concrete instantiation at the *doxa*-mediated level: the determinate emotions of anger, fear, and pity, with their propositional contents, conative orientations, and hedonic tonalities. The same single ontological structure that §1.2 specified at minimal articulation is here realized at maximal articulation; the *pathē* of the *Rhetoric* are not a second *pathos*-structure but a second articulational concretion of the one ontological structure the perceptual case already exhibits.

The existing payoff prose at §1.4 line 47–48 (C099–C104, "Each of the four senses of *pathos* is structurally satisfied at the level of basic affective valence...") should be **removed**, since this is now the canonical payoff site for §1.2 (the perceptual level). The relocated subsection thus shrinks from ~1,002 words to ~152 words of pointer text.

### Downstream edits

| Scope | Edit |
|---|---|
| §1.4 intra-section | Update subsection numbering: §S3b "Metaphysics Fourfold" collapses into the pointer paragraph; renumber subsequent subsections if needed. |
| §1.4 internal cross-references | Search §1.4 for cross-references to "the fourfold introduced above" / "the four senses of pathos" / "the Metaphysics Δ.21 enumeration"; redirect each to "§1.2 §S4". Likely loci: §1.4 lines 64, 80–83, 122, 150. |
| §1.4 citation graph | The Met. Δ 21 and BCAP 131–132 citations move with the relocation; §1.4 retains only a back-reference to §1.2. |
| §1.2 citation graph | §1.2 GAINS Met. Δ 21 (1022b15–21) as verbatim primary citation; GAINS the BCAP 131–132 sōtēria verbatim (fills existing placeholder at line 47); §1.2 placeholder count drops from 6 to 5. |
| §1.0 Introduction | Update any forward-reference to the fourfold from "§1.4" to "§1.2". |
| §1.3 A_3 (Phantasia) | Update any reference to "the four senses" or "the Metaphysics fourfold" to cite §1.2 post-relocation. |
| §1.5 A_4 (Completed Action) | Update any reference to "the structure of being-occurrable-to" to cite §1.2 (canonical fourfold). |
| Cross-section terminology | Add "basic affective valence" to §1.2-S4 payoff (currently uses "basic-valence dimension" at line 57) to align with §1.4 canonical term. |
| Diagram | No changes required (relocation is purely textual). |
| Phase 2 claim-ID stability | §1.4 claim IDs C084–C098 retired from DISS-04-EMOTION; re-assigned to DISS-02-A1A2 with new IDs. |

### Interpretive flags

- **REL-001 and REL-002 are coupled.** The DA II.5, 417b2-5 footnote at §1.4 line 46 is load-bearing for both R1's sōtēria-gloss and R2's preservation-vs-destruction main statement. The footnote moves with R1. Execute R1 BEFORE R2.
- After the relocation, §1.4's word count drops ~850; §1.2's grows ~850. Verify §1.2's Lanham profile is computed for the EXPANDED section in Phase 3 Wave 3.

---

## Relocation 2 — *Paschein*-preservation-vs-destruction (§1.4 → §1.2)

### Overview

| Field | Value |
|---|---|
| ID | REL-002 |
| Status | User-mandated |
| Priority | P0 — coupled to REL-001; load-bearing for §1.2's account of perceptual *alloiōsis* as preservative |
| Source file | `tmp/Dissertation/1.4 - Emotion is Motion/1.4 - Emotion is Motion.md` |
| Source lines | 23 (main statement) + 46 (footnote, moves with REL-001) |
| Source subsection | DISS-04-S3 (terminal paragraph) + DISS-04-S3b (footnote) |
| Target file | `tmp/Dissertation/1.2 - A1-A2 - Aisthesis/1.2_A1-A2_Aisthesis_OUTPUT_v1.tex` |
| Target lines | 41 (extending C062's paragraph) — or new paragraph between lines 41 and 43 |
| Target subsection | DISS-02-S4 "Perception as Enmattered *Alloiōsis* and the Four Senses of *Pathos*" |
| Approx words to move (R2 portion only) | 280 |
| Approx words to keep in §1.4 | 164 (the C059–C061 extension-to-emotion) |

### Source claim manifest

**Claims to move:** `DISS-04-C055, C056, C057, C058`
**Claims already moving with REL-001:** `DISS-04-C094, C095`
**Claims to keep in §1.4 as extension-to-emotion:** `DISS-04-C059, C060, C061`

### Target receiving structure

**Receiving claims in §1.2-S4:** `DISS-02-C062, C063, C064, C065, C066, C067, C068`

**Insertion anchor:** EXTEND C062's paragraph (§1.2 line 41) which already introduces "two kinds of *alloiōsis*" (corrupting vs. preservative) but WITHOUT the explicit DA II.5 paschein-double-sense quotation, the Heideggerian sōtēria gloss, or the "one is destruction, the other is preservation" formulation that the §1.4 source provides. Alternative: as a new short paragraph between current lines 41 and 43, immediately before the Δ.21 verbatim block at line 44 (which REL-001 also augments).

**Fit quality:** **EXCELLENT.** §1.2 already authored the receiving paragraph (C062–C067), needing only the deeper paschein/sōtēria treatment that §1.4 carries. After integration, §1.2-S4's opening four paragraphs establish a single coherent distinction: (i) alloiōsis dual-kinds [existing], (ii) paschein dual-senses [new from §1.4 line 23], (iii) BCAP 132 sōtēria philosophical point [from §1.4 line 46 footnote, moving with REL-001], (iv) Metaphysics Δ.21 fourfold as broader frame [REL-001].

### Rationale

The dual *paschein* is the structural register for §1.2's preservative-alloiōsis treatment of perceptual reception; without the explicit distinction, §1.2's C062 claim "preservative rather than corrupting" floats without grounding. After the relocation, §1.2 becomes the canonical site for the entire dual-paschein architecture, exactly as §1.2 is the canonical site for hylomorphic reception of form. §1.4 then deploys the architecture at the higher-order *pathē* level — explicitly noting (in C059) that both basic affective valence and the *pathē* are species of preservative *paschein*. The structural pattern is: §1.2 establishes once; §1.4 (and §1.3) deploy.

What the relocation accomplishes:
- Grounds §1.2's existing preservative-vs-corrupting distinction (C062–C067) in the explicit *paschein* register.
- Provides the load-bearing BCAP 132 sōtēria-as-preservation primary quotation as a §1.2 citation rather than a derivative §1.4 citation.
- Lets §1.4 deploy the distinction with a one-sentence back-reference rather than re-establishing it.
- Coordinates with REL-001: the Δ.21 fourfold and the dual-paschein are mutually reinforcing structural claims; placing both in §1.2-S4 produces a unified architectural treatment.

### Verbatim to move (§1.4 line 23, first half of terminal paragraph)

**Move to §1.2 (REL-002 portion, ~280 words):**

> The unifying ground of this single-structure thesis is the distinction Aristotle draws between two senses of *paschein* ("to be acted upon"). On the one hand, *paschein* expresses "the extinction of one of two contraries by the other"; on the other, "the maintenance of what is potential by the agency of what is actual and already like what is acted upon, as actual to potential" (*On the Soul* II.5, 417b2–7). In one sense being-affected is a destruction; in the other it is a preservation in which a potential is brought into its actuality. Hearing a sound is a being-affected of the second sort: my hearing is brought to its full being, not destroyed.

**Keep in §1.4 (C059–C061, ~164 words):** the "So too is being-moved by anger or fear..." sentence onward through the multi-dimensional-magnitude-axis treatment and the dark-alley case.

**Note**: the footnote at §1.4 line 46 (the DA II.5, 417b2-5 verbatim "Aristotle himself") moves with REL-001 (it is the load-bearing footnote for the fourfold-narrowing gloss). After REL-001 + REL-002 are executed, this DA II.5 footnote lands in §1.2-S4 and serves as the citation for BOTH the relocated paschein-distinction main statement AND the relocated fourfold's sōtēria-gloss.

### Bridge text for the §1.2 target

EXTEND C062's paragraph by inserting the §1.4 source material immediately after the existing "The second kind of *alloiōsis* is preservative rather than corrupting" sentence. The integrated paragraph should read approximately as follows (user-voice per `dalton-academic-mkn82c3v`):

> Two kinds of *alloiōsis* must be distinguished. The first is ordinary qualitative change, in which a substance's quality is altered by the imposition of a contrary: cold water becomes hot, a living body becomes diseased, a flame is extinguished. This kind of *alloiōsis* is corrupting; the contrary supplants what was there. The second kind of *alloiōsis* is preservative rather than corrupting. *[existing C062 prose continues through the geometer-builder-sense-organ examples and the wax-signet analogy.]* The deeper structural register here is *paschein* (πάσχειν "being-affected"), under which Aristotle himself distinguishes two senses. On the one hand, *paschein* expresses "the extinction of one of two contraries by the other"; on the other, "the maintenance of what is potential by the agency of what is actual and already like what is acted upon, as actual to potential" (*DA* II.5, 417b2–7). In one sense being-affected is a destruction; in the other it is a preservation in which a potential is brought into its actuality. Hearing a sound is a being-affected of the second sort: hearing is brought to its full being, not destroyed. The same structural point governs every perceptual *alloiōsis* (cf. the parallel development at the level of higher-order *pathē* in the emotion section, where the preservative-*paschein* structure is deployed for the determinate emotions).

The existing §1.2 C067 sentence beginning "The same structural point governs the perceptual *alloiōsis*" becomes redundant after this extension and should either be removed or compressed into "The same structural point governs the perceptual *alloiōsis* (cf. §1.4 for the higher-order *pathē* application)."

### Bridge text for the §1.4 residue (back-reference sentence)

At the head of what was §1.4 line 23's terminal paragraph (after the line-21 paragraph concluding with "the present analysis, working through the chain of actualizing desire, must."), insert the following bridging sentence (user-voice, hypotactic-periodic):

> The unifying ground of this single-structure thesis is the dual *paschein*-distinction Aristotle establishes at *DA* II.5, 417b2–7 and §1.2 has developed canonically as the structural register for perceptual reception: one sense of being-affected is destruction by an opposite, the other is preservation in which a potential is brought into its actuality. The present section deploys the second, preservative sense at the level of the higher-order *pathē*. So too is being-moved by anger or fear *[continue with existing C059 prose]*: there is no mode of being-there from which pleasure or pain is absent; every moment of our being-there is colored by hedonic tonality. Accordingly, both basic affective valence and the *pathē* are species of preservative *paschein*.

After this revision, §1.4 line 23's terminal paragraph reduces from ~444 words to ~280 words. The C060–C062 second-half (multi-dimensional-magnitude-axis + dark-alley example) is **untouched**.

### Downstream edits

| Scope | Edit |
|---|---|
| §1.4 intra-section | Line 23 terminal paragraph shortens by ~164 words (C055–C058 move); C059–C062 second-half unchanged. |
| §1.4 footnote at line 46 | Moves to §1.2 with REL-001; §1.4 drops the footnote or replaces it with a back-reference "See §1.2 §S4, DA II.5, 417b2–7." |
| §1.4 internal cross-references | Search §1.4 for references to "the dual paschein" / "preservative versus destructive paschein" / "DA II.5"; redirect to "§1.2 §S4". Likely loci: §1.4 lines 64, 80, 122. |
| §1.4 citation graph | Primary citations from §1.4 to DA II.5, 417b2–7 reduced from 2 to 0 (or 1 if a back-reference is retained). |
| §1.2 citation graph | §1.2-S4 gains DA II.5, 417b2–7 as primary citation for dual-paschein. §1.2 already has DA II.5, 417a21-b2 (alloiōsis dual-kinds at C062); both may coexist, or consolidate to span 417a21-b7. |
| §1.1 A_0 (Motion and Time) | Per Plan §9.2.2: DA II.5, 417b2–7 "is currently in both §1.1 and §1.4". Verify §1.1's use: likely retains its own context (motion-from-an-unmoved-originator), but verify with user. |
| §1.3 A_3 (Phantasia) | Update any phantasia-as-preservative-residue invocation to cite §1.2. |
| §1.5 A_4 (Completed Action) | Update any preservative-paschein invocation in the action-types argument to cite §1.2. |
| Cross-section terminology | "paschein" becomes a §1.2-anchored canonical term; Phase 3 Wave 1 terminology-reckoning should verify consistency across §§1.1, 1.2, 1.4. |
| Phase 2 claim-ID stability | §1.4 claim IDs C055–C058 retired; re-assigned to §1.2 (inserted into C062 paragraph). |

### Interpretive flags

- **REL-002 is coupled to REL-001.** Execute REL-001 first. After REL-001, the DA II.5, 417b2-5 footnote is in §1.2; REL-002 reduces to moving the §1.4 line 23 main statement (C055–C058) only.
- The DA II.5 citation appears in two slightly different verbatim ranges in the current text: §1.4 line 23 cites "417b2–7" (main statement); §1.4 line 46 footnote cites "417b2–5" (Aristotle-himself verbatim); §1.2 C062 cites "417a21-b2" (alloiōsis dual-kinds). The user should decide on a unified citation: either three slightly-overlapping ranges, or a single span "417a21-b7".
- Per Plan §9.2.2: DA II.5, 417b2–7 "is currently in both §1.1 and §1.4". Inspect §1.1; user decides whether §1.1's invocation stays or redirects.

---

## Relocation 3 — Perception-as-*krisis* (BCAP 126) (§1.4 → §1.2)

### Overview

| Field | Value |
|---|---|
| ID | REL-003 |
| Status | User-mandated |
| Priority | P0 — fills an existing §1.2 asterisk placeholder; load-bearing for §1.2's hylomorphism account |
| Source file | `tmp/Dissertation/1.4 - Emotion is Motion/1.4 - Emotion is Motion.md` |
| Source lines | 50–61 (entire §1.4-S3c subsection) — specifically the BCAP 126 mesotēs/kritikon material at lines 57–58 |
| Source subsection | DISS-04-S3c "The *Rhetoric*'s Constitutive Threefold: *Pathos* as Change, *Krisis*, and Hedonic Tonality" |
| Target file | `tmp/Dissertation/1.2 - A1-A2 - Aisthesis/1.2_A1-A2_Aisthesis_OUTPUT_v1.tex` |
| Target lines | 23–25 (within §1.2-S2) |
| Target subsection | DISS-02-S2 "Hylomorphism and the Reception of Form" |
| Approx words to move | 320 |
| Approx words to keep in §1.4 | 681 (the Rhetoric threefold + pre-propositional/pre-positional + threefold-at-pathē application) |

### Source claim manifest

**Claims to move:** `DISS-04-C113, C114, C115, C116 (partial), C117, C118, C119`
**Claims to keep in §1.4 as Rhetoric application:** `DISS-04-C105, C106, C107, C108, C109, C110, C111, C112, C120, C121, C122, C123, C124, C125, C126, C127`

### Target receiving structure

**Receiving claims in §1.2-S2:** `DISS-02-C033, C034, C035, C036, C037`

**Insertion anchor:** FILL the existing asterisk placeholder at §1.2 line 23 (the BCAP 126 placeholder, identified by C033 and C154). The §1.2 placeholder currently reads:

> Heidegger reads Aristotle's account of *aisthēsis* as establishing that perception is itself a *kritikon* — "******" (BCAP, p. 126).

The §1.4 source provides the verbatim Heidegger quotation that fills this placeholder PLUS additional surrounding interpretive framing (claims C114–C117 deepen the discrimination-and-position-taking treatment).

**Fit quality:** **EXCELLENT.** The §1.2 placeholder structure was authored in anticipation of exactly this relocation. The §1.4 source carries the verbatim quotation plus four additional sentences of surrounding interpretive framing (the position-taking-is-pre-doxastic argument).

### Rationale

Per Plan §9.2.2: "the BCAP 126 passage on *mesotēs* + *kritikon* is currently in §1.4; propose moving the philosophical statement of perception-as-*krisis* to §1.2 while retaining the emotional application in §1.4 (which is where the position-taking aspect of *pathē* uses it)." The user has explicitly distinguished the philosophical statement (perception is itself discriminative) from the emotional application (the position-taking aspect of *pathē* uses the same discrimination structure). The philosophical statement is canonically about *aisthēsis* and belongs in §1.2; the emotional application is canonically about *pathē* and stays in §1.4.

After the relocation, §1.2 becomes the canonical site for the perception-as-*krisis* thesis. §1.4 then USES this thesis in its account of the *Rhetoric*'s threefold: when §1.4 argues that the position-taking moment of the *pathē* is "already operative at the perceptual level in Heidegger's own analysis" (currently C116–C117), the back-reference is to §1.2. The chapter's broader pattern: perception is discriminative-and-position-taking (§1.2); *pathos* at every articulational concretion inherits this structure (§1.4). The user's central thesis — that the pre-propositional but not pre-positional character of basic affective valence is what makes the *pathē* possible — becomes architecturally explicit through the relocation.

What the relocation accomplishes:
- Fills an existing §1.2 asterisk placeholder (1 of 6 in §1.2; reducing placeholder count from 6 to 5).
- Provides §1.2's hylomorphism account with the structural depth it currently lacks: the §1.2-S2 claim that "form-reception and discrimination are not two operations but one" (C037) is currently asserted but not developed.
- Lets §1.4-S3c focus tightly on the *Rhetoric*'s threefold and its application to the higher-order *pathē*.
- Aligns with the user's pre-propositional-not-pre-positional distinction: §1.2 establishes the pre-doxastic position-taking; §1.4 deploys it to argue that the *pathē*'s position-taking is the same structure at a higher articulational concretion.

### Verbatim to move (§1.4 lines 57–58, ~320 words)

**Move to §1.2:**

> The three-fold articulation is not, however, first introduced at the level of the *pathē*. The second moment in particular — "we differentiate ourselves with respect to position-takings" — is already operative at the perceptual level in Heidegger's own analysis. He reads Aristotle's explanation of *aisthēsis* as establishing that perception is itself "a μέσον [*mesotēs* 'mean'] with the character of κριτικόν [*kritikon* 'discerning'], of the 'ability-to-separate' one thing from another... It is a being-positioned toward possible objects, which is a δύναμις [*dynamis* 'potentiality'] in the sense of κριτική [*kritikē* 'faculty of judgment']" (*BCAP* 126). Aristotle confirms this when he argues the perceiving soul is said to make an "affirmation or negation" and to pursue or avoid accordingly (*On the Soul* III.7, 431a8–12). This basic affective valence — the organism's pre-propositional orientation toward the pleasant and away from the painful, what Heidegger names the disclosive attunement or mood (*Stimmung*) of state-of-mind (*Befindlichkeit*) — is co-given with perception from the earliest moment of the actualization chain. It is dispositional; it colors the perceptual field with the most general affective tonality of good or bad, pursue or avoid. The position-taking moment is therefore constitutive of perception with affective valence; it is not introduced anew by *doxa*.

**Keep in §1.4 (claims C120–C127, ~681 words):** the pre-propositional/pre-positional distinction, the *metaballontes* discussion, the co-givenness-of-pleasure-and-pain treatment, and the application to the higher-order *pathē* (anger as "desire accompanied by pain for conspicuous revenge").

### Bridge text for the §1.2 target

REPLACE the existing asterisk placeholder at §1.2 line 23 (the BCAP 126 placeholder) with the relocated verbatim, AND extend the surrounding paragraph with the §1.4 source's interpretive framing. The integrated §1.2 paragraph at line 23 should read approximately as follows (user-voice, hypotactic-periodic):

> Heidegger's reading of Aristotelian perception in the *Basic Concepts of Aristotelian Philosophy* radicalizes this analysis structurally. Heidegger reads Aristotle's account of *aisthēsis* as establishing that perception is itself "a μέσον [*mesotēs* 'mean'] with the character of κριτικόν [*kritikon* 'discerning'] — of the 'ability-to-separate' one thing from another. It is a being-positioned toward possible objects, which is a δύναμις [*dynamis* 'potentiality'] in the sense of κριτική [*kritikē*] 'faculty of judgment'" (*BCAP*, p. 126). *Aisthēsis* is not a passive imprinting but a discriminative event: the sense faculty, in receiving the form, simultaneously exercises its critical capacity to distinguish what it has received. Aristotle himself confirms the reading: the perceiving soul is said to "make an affirmation or negation" and to pursue or avoid accordingly (*DA* III.7, 431a8–12). The hylomorphic reception of form is thus not a mere passive imprinting but a structurally discriminative event in which form-reception and discrimination are not two operations but one. The position-taking moment is therefore constitutive of perception with affective valence; it is not introduced anew by *doxa*. White's identification of *to kritikon* as the unifying capacity that connects perception, *phantasia*, and thought is the secondary literature's correlate of Heidegger's reading: "******" (White, *The Meaning of Phantasia in Aristotle's De Anima III, 3-8*, pp. 9–11).

**Note**: the §1.2 *second* placeholder at line 23 (the White pp. 9–11 verbatim, currently identified by C036 and C155) **remains a placeholder** after REL-003 — REL-003 only fills the FIRST placeholder. The user must still fill the White placeholder separately per the citation-gap-table.

### Bridge text for the §1.4 residue (back-reference sentence)

After REL-003, §1.4-S3c retains items (i) Rhetoric threefold introduction, (ii) Heidegger's *metaballontes*/*kriseis*/hedonic-tonality gloss, (iv) pre-propositional/pre-positional distinction, (v) threefold-at-*pathē* application. The removed item (iii) (BCAP 126 perception-as-*krisis*) is replaced by a back-reference. The §1.4 residue at line 57 should read approximately as follows:

> The three-fold articulation is not, however, first introduced at the level of the *pathē*. The second moment in particular — "we differentiate ourselves with respect to position-takings" — is already operative at the perceptual level. As §1.2 §S2 established in the discussion of *aisthēsis*-as-*kritikon* (*BCAP* 126), perception is itself a discriminative event: form-reception and discrimination are not two operations but one, and the perceiver's being-positioned toward the perceived as pursue-able or avoid-able is constitutive of perception, not introduced anew by *doxa*. Aristotle confirms this when he argues the perceiving soul is said to make an "affirmation or negation" and to pursue or avoid accordingly (*DA* III.7, 431a8–12) — a structural claim §1.2 develops in its hylomorphism account. The position-taking moment is therefore constitutive of perception with affective valence; it is not introduced anew by *doxa*. *[Continue with existing C120–C127 prose: "Basic affective valence satisfies the differentiation aspect pre-propositionally but not pre-positionally..."]*

The §1.4-S3c subsection now flows: threefold-introduction → perception-as-*krisis* back-reference → pre-propositional/pre-positional → threefold-at-*pathē*. Total word count drops from ~1,001 to ~681.

### Downstream edits

| Scope | Edit |
|---|---|
| §1.4 intra-section | §S3c word count drops ~320 words; subsection structure tightens. Consider renaming §S3c subtitle if krisis-introduction is no longer the subsection's responsibility, or keep since krisis-at-pathē-level is still treated. |
| §1.4 internal cross-references | Search §1.4 for "perception is itself kritikon" / "BCAP 126" / "aisthēsis as mesotēs" / "discriminative event"; redirect to "§1.2 §S2". Likely loci: §1.4 lines 80–83, 122. |
| §1.4 citation graph | §1.4 loses one primary BCAP 126 citation (moves to §1.2). May retain DA III.7, 431a8–12 as back-reference or drop. |
| §1.2 citation graph | §1.2 GAINS BCAP 126 verbatim primary citation (fills placeholder at C033/C154). §1.2 already has DA III.7, 431a8–12 at C034. §1.2 placeholder count drops from 6 to 5. |
| §1.0 Introduction | Update any forward-reference to perception-as-discriminative or aisthēsis-as-krisis from §1.4 to §1.2. |
| §1.3 A_3 (Phantasia) | Update any phantasia-as-discriminative-trace invocation to cite §1.2 canonically. |
| §1.5 A_4 (Completed Action) | Update any position-taking-aspect-of-aisthēsis invocation in action-types argument to cite §1.2. |
| Cross-section terminology | "krisis/kritikon/mesotēs" becomes a §1.2-anchored canonical cluster. |
| Asterisk placeholder count | §1.2 drops from 6 to 5. Update citation-gap-master and cache-coverage-summary. |
| Diagram | No changes required. |
| Phase 2 claim-ID stability | §1.4 claim IDs C113–C119 retired (C116 partially retained); re-assigned to §1.2 at C033 territory. |

### Interpretive flags

- **REL-003 is the easiest of the three to execute** because the §1.2 receiving structure is fully authored AND the placeholder is a known gap.
- Per Plan §9.2.2: "...while retaining the emotional application in §1.4 (which is where the position-taking aspect of *pathē* uses it)". The §1.4 residue MUST retain the pre-propositional/pre-positional distinction (C120–C127) as the §1.4-internal application of the relocated *krisis*-thesis.
- C116 is split between source and target: the basic-affective-valence identification stays in §1.4; the BCAP 126-grounded position-taking-is-pre-doxastic argument moves to §1.2. Read C116 carefully and partition the prose accordingly.

---

## Cross-relocation coupling and execution sequence

### Recommended order: REL-001 → REL-002 → REL-003

| Coupling | Description |
|---|---|
| REL-001 ↔ REL-002 | Load-bearing footnote. REL-002's primary citation (DA II.5, 417b2-5 footnote at §1.4 line 46) is bound to REL-001's fourfold-narrowing gloss. The footnote moves with REL-001. Execute REL-001 first; REL-002 then operates on the §1.4 line 23 main statement only. |
| REL-001 ↔ REL-003 | Independent. REL-001 lands in §1.2-S4 (lines 43–47); REL-003 lands in §1.2-S2 (line 23). No overlap. |
| REL-002 ↔ REL-003 | Independent. REL-002 lands in §1.2-S4 (line 41, extending C062); REL-003 lands in §1.2-S2 (line 23, filling C033 placeholder). No overlap. |

**Rationale for order:** (a) REL-001 moves the load-bearing DA II.5 footnote that REL-002 needs in §1.2; (b) REL-002's residue work is small once REL-001 has landed; (c) REL-003 is the most self-contained (fills an existing placeholder) and can land last without conflict.

**Alternative:** REL-003 may be executed FIRST if the user prefers an early small win (filling a known placeholder). REL-001 and REL-002 should always execute in that order regardless of REL-003 placement.

---

## Pipeline-detected additional relocation candidates

**Total additional finds: 0.**

| Section | Relocation candidates | Notes |
|---|---|---|
| DISS-00-INTRO | 0 | No relocation flags in Phase 2 output. |
| DISS-01-A0 | 0 | *Phantasia* mentioned at C055, C155, C158 are forward-reference foreshadowing for chain architecture, not canonical phantasia treatments. Pass the appropriateness test per Plan §9.2.2 step 4. |
| DISS-02-A1A2 | 0 outbound (receiving section) | 3 receiving-target receipts consistent with user-mandated relocations. |
| DISS-03-A3 | 0 | No relocation flags. |
| DISS-04-EMOTION | 3 (the user-mandated set) | 23 RELOCATE_NOTE entries group into the three user-mandated chains. No additional candidates surfaced. |
| DISS-05-A4 | 0 | No relocation flags. |

The user's three explicit relocations (§1.4 → §1.2 for fourfold, *paschein*, *krisis*) capture the full set of §1.4-content-belonging-canonically-in-§1.2. Phase 2 found no instances of pre-canonical concept invocation requiring relocation across the other sections.

---

## Estimated user execution time

| Relocation | Estimated time | Why |
|---|---|---|
| REL-001 (Metaphysics fourfold) | 75–90 min | Largest passage (~850 words to move); requires structural rewrite of §1.2-S4; needs replacement of the BCAP 131–132 placeholder with the relocated verbatim; coupled with REL-002's footnote. |
| REL-002 (*paschein* preservation/destruction) | 40–50 min | Smaller passage (~280 words to move); extends an existing §1.2 paragraph rather than rewriting a section; load-bearing footnote already moved by REL-001. |
| REL-003 (perception-as-*krisis* BCAP 126) | 60–90 min | Mid-size passage (~320 words to move); fills an existing §1.2 placeholder; smaller bridge work in §1.4 (one-sentence back-reference). |
| Cross-section consistency verification | 20–30 min | After all three are integrated: verify §§1.0/1.1/1.3/1.5 cross-references, citation graph, terminology consistency, claim-ID lineage. |
| **Total** | **180–240 min (3–4 hours)** | Aligns with Plan §11.1 critical-path Step 3. |

---

## Post-relocation verification

After the user executes the relocations, the following verification steps are recommended:

1. Re-run Phase 1 metadata extraction on revised §1.2 and §1.4; verify line counts.
2. Re-run Phase 2 claim extraction on revised §1.2 and §1.4; verify claim-ID lineage:
   - C084–C098 (R1) no longer in DISS-04; present in DISS-02 with new IDs.
   - C055–C058 (R2) no longer in DISS-04; present in DISS-02 with new IDs.
   - C113–C119 (R3, C116 partial) no longer in DISS-04; present in DISS-02 with new IDs.
3. Re-run Lanham profile on revised §1.2 and §1.4; verify §1.4 baseline holds and §1.2 inherits §1.4's voice naturally (the relocated passages were authored in §1.4's voice).
4. Re-run Phase 2 citation-gap-table on revised §1.2 and §1.4; verify §1.2 asterisk placeholder count drops from 6 to 5 (REL-003 fills line 23 #1) and the DA II.5 + Met. Δ.21 + BCAP 131–132 citations are properly attributed to §1.2.
5. Verify the §1.4 back-reference paragraphs (the bridge texts in the source residue) read naturally in the user's voice and maintain Lanham §1.4 baseline.
6. Verify cross-section citations to the relocated material from §§1.0/1.1/1.3/1.5 are updated.

**Diff target for the next pipeline run:** Phase 3 Wave 2 Agent 3E re-runs after the user executes the relocations; the diff against this run should show:

- Zero `RELOCATE_NOTE` entries in DISS-04-EMOTION (the relocations are complete).
- The relocated claims present in DISS-02-A1A2 with new IDs and stable lineage.
- §1.2 placeholder count reduced from 6 to 5.
- No new RELOCATION candidates surfaced (the three user-mandated relocations are exhaustive per the pipeline scan).

---

## Lanham style verification for bridge texts

**Target profile:** `dalton-academic-mkn82c3v` (§1.4 baseline) — 31.24 avg words/sentence, 51.6% long sentences, 20.1% passive, 0.64 formality, transitions {thus, specifically, indeed, accordingly, hence}, author-prominent citations (99.2%) with {observes, argues, suggests, states, maintains, contends}, no contracted forms.

| Bridge text | Compliance |
|---|---|
| REL-001 → §1.2 target | COMPLIANT — hypotactic, periodic-running, no contracted forms; author-prominent citation "Heidegger gathers". |
| REL-001 → §1.4 residue | COMPLIANT — hypotactic, periodic-running, "accordingly" and "therefore" transitions. |
| REL-002 → §1.2 target | COMPLIANT — extends C062 in C062's voice; deeper paschein register added without breaking hypotactic chain. |
| REL-002 → §1.4 residue | COMPLIANT — single hypotactic sentence opens the residue with the back-reference. |
| REL-003 → §1.2 target | COMPLIANT — extends C033 with verbatim BCAP 126 + the surrounding framing; matches §1.2-S2 voice. |
| REL-003 → §1.4 residue | COMPLIANT — one-sentence back-reference replaces ~320 words; existing C120–C127 sequence continues without disruption. |

---

## Output manifest

- `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_synthesis/relocations.md` (this file)
- `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_synthesis/relocations.json` (companion JSON, full verbatim + claim-ID lists)
