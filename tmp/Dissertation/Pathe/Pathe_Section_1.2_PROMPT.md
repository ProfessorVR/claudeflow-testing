Synthesize Section 1.2 of the Pathe chapter — `Pathos` and `Pathē`: Two Articulational Concretions — into a polished final draft. The source draft at `tmp/Pathe/Pathe_Section_1.2.md` contains a mix of (a) substantially complete prose for the opening thesis, the *Metaphysics* fourfold subsubsection, and the *Rhetoric* threefold subsubsection; (b) free-floating `\inlinenote{}` blocks containing supporting quotations and structural arguments; (c) a large block of structural-argument fragments (lines 20–66 of the source) that develops the lectures-to-*Being and Time* continuity in three Layers (A, B, C) plus a system-tension resolution; (d) `\hl{}` highlight markers flagging citation gaps and minor revisions. Your task is to synthesize all of this into a single polished section that PRESERVES the existing polished prose where it is working, INTEGRATES the inline-note content into the body or into footnotes, EXPANDS the Layer A/B/C fragments into a new prose subsubsection between the opening thesis and the *Metaphysics* fourfold, and RESOLVES all `\hl{}` markers and Bekker typos. Target length is approximately 4,200 words of body prose. Use multistep drafting; do NOT use the inline validator path.

====================================================================
SOURCE-MATERIAL PRIORITY (HARD CONSTRAINT)
====================================================================

USE ONLY sources from `corpus/rhetorical_ontology`. No external/web sources. No sources from outside this corpus.

RETRIEVAL PRIORITY (in this order):
1. `corpus/index/` — consult Bekker reverse-index, BT-structured index, BCAP index FIRST for locus identification.
2. ChromaDB collections (`metaphysics`, `new_media`, `rhetorical_ontology`) — query for chunked content keyed to the Bekker / SZ / BCAP loci identified in step 1.
3. Source PDFs in `corpus/rhetorical_ontology/` — fall back ONLY when chunks are missing or insufficient. Cite by Bekker / SZ-H / BCAP-page even when content comes from PDF.

Permitted primary sources for THIS section:
- Aristotle, *De Anima* (II.5; II.12; III.3; III.7; III.10)
- Aristotle, *Metaphysics* Δ.21
- Aristotle, *Rhetoric* II.1; II.2; II.5; II.8 — definition passages for anger, fear, pity
- Aristotle, *Nicomachean Ethics* III.8 (animal pathos-like states)
- Aristotle, *Historia Animalium* IX (animal dispositions)
- Aristotle, *On Dreams* / *Sense and Sensibilia* — only if needed for ratio/excess support
- Heidegger, *Basic Concepts of Aristotelian Philosophy* (GA 18) — Sections covering pp. 115, 122, 125, 126, 131–134, 173–176
- Heidegger, *Being and Time* — §29 (H.134–140); §32 (H.148–153); §33 (H.154–160); §40; §65; §68

Permitted secondary sources for THIS section:
- Multiple Authors, *Heidegger and Rhetoric* (Gross ed.) — only if needed for retrospective reception of GA 18 Aristotle reading
- Gross, *Uncomfortable Situations* — only if needed for affect/pathē reading

NOT PERMITTED for this section:
- White, Caston, Frede, Nussbaum, O'Gorman, Hawhee, Papachristou, Bowin, Burke, Rickert, Gibson, von Uexküll — these belong to other sections of the chapter (perception, phantasia, action). Do not deploy them in 1.2.

====================================================================
MANDATORY OUTPUT STRUCTURE — PRODUCE EXACTLY THIS SECTION HIERARCHY
====================================================================

The output MUST use exactly these four headings, in this order:

1. `\subsection{\textit{Pathos} and \textit{Pathē}: Two Articulational Concretions}` — opening thesis and gap-filling argument; approx. 1,150 words.
2. `\subsubsection{From the Lectures to \textit{Being and Time}: The \textit{Pathos}-Level Instantiation of the Hermeneutical/Apophantical ``As''}` — the new subsubsection synthesizing the Layer A/B/C fragments; approx. 1,650 words.
3. `\subsubsection{The \textit{Metaphysics} Fourfold: \textit{Pathos} from Alterability to Magnitude}` — preserved-and-polished version of the existing subsubsection; approx. 900 words.
4. `\subsubsection{The \textit{Rhetoric}'s Constitutive Threefold: \textit{Pathos} as Change, \textit{Krisis}, and Hedonic Tonality}` — preserved-and-polished version of the existing subsubsection with `\hl{}` markers resolved; approx. 750 words (with footnotes counted separately).

NO OTHER HEADINGS are permitted. Do NOT generate auto-headings from quoted material, footnote content, or Layer labels (treat "Layer A," "Layer B," "Layer C" as internal scaffolding, not as section titles).

====================================================================
PER-SUBSECTION REQUIREMENTS
====================================================================

**Subsection 1 — Opening Thesis and Gap-Filling Argument (~1,150 words).**

PRESERVE substantially the prose at source lines 3–14 (the indented thesis statement with its three footnotes, the gap-filling argument with its `(\textit{sōtēria})`-paschein anchoring, and the `\textit{paschein}` two-senses argument from *DA* II.5 417b2-7). Make the following targeted revisions:

- Footnote at thesis (currently footnote 1 in source — Heidegger's *hexis*-as-how-of-pathos quote at BCAP p. 125): KEEP verbatim.
- Footnote at thesis (currently footnote 2 in source — hermeneutical/apophantical 'as' at *Being and Time* §32–33): KEEP, but replace the bare page reference "(201)" with "(SZ §33, H.158; Eng. 201)" using SZ H-pagination.
- Footnote at thesis (currently footnote 3 — restriction to rational animals + animal-pathē mediation): EXPAND to absorb the standalone inline-notes at source lines 8 and 10. Specifically:
  - INTEGRATE the *NE* III.8, 1116b24-1117a5 quotation (source line 8) as block-quoted supporting evidence WITHIN this footnote, with the explanatory framing the source already supplies ("Aristotle simultaneously (a) attributes *pathos*-like states to non-rational animals and (b) denies them genuine virtue/courage…").
  - INTEGRATE the *Historia Animalium* IX 10–14 quotation (source line 10) as additional supporting evidence in the same footnote.
  - CORRECT the citation in the original footnote: replace "*Nicomachean Ethics* III.10" with "*Nicomachean Ethics* III.8, 1116b23–1117a9" (the III.10 reference was a slip; III.10 is on temperance/touch-pleasures, not animal pathē).
  - CORRECT the Bekker typo in the *Rhetoric* II.1 citation appearing in the body of subsection 1: "(II.1, 13789a21-22)" must read "(II.1, 1378a21–22)". (NOTE: this typo appears in source line 1.1, not 1.2 — but if it propagates anywhere in 1.2 prose, fix it.)
- The two free-floating `\inlinenote{}` blocks at source lines 16 and 18 (the structural-parallel-to-BT note and the *dynamis-energeia* register clarification): DO NOT integrate into Subsection 1. Their content is folded into Subsection 2 instead (see below).
- Resolve the embedded `\hl{}` highlight in source line 14 ("when the object of sense is actually present, we have the basic hedonic tonality, the basic affective valence of good or bad, pursue or avoid; *resonant orexis*, on the other hand, is part of the *resonant kineseis* that persists after the object has ceased to be…"): retain this distinction in the prose but remove the `\hl{}` markup (the distinction is now load-bearing; it no longer needs flagging).

The subsection should close at the magnitude-axis sentence ("…it is an *articulational* graduation rather than a difference in kind.") and should NOT end with a transition into the new subsubsection — let the subsubsection heading carry the transition.

**Subsection 2 — From the Lectures to *Being and Time*: The *Pathos*-Level Instantiation of the Hermeneutical/Apophantical "As" (~1,650 words).**

This is the section's most synthetic move. Develop into polished prose the structural argument currently scattered across source lines 16–66. The argument has three Layers (A, B, C) plus a system-tension resolution. Treat the Layer labels as internal organizational logic; do NOT use them as headings.

The argument's overall arc:

The articulational distinction this chapter draws between basic *resonant orexis* and the higher-order *pathē* is not an importation of a foreign Heideggerian schema onto Aristotle. It is the recovery of a structural pattern that Heidegger's own intellectual trajectory presupposes but does not fully articulate at the *pathos* level. Three lines of evidence support this: the chronological-textual link from the lectures to *Being and Time*; the structural-philosophical homology between (basic *pathos* / higher-order *pathē*) and (hermeneutical "as" / apophantical "as"); and the resolution of an open *Being and Time* tension that the *pathos*-level analysis supplies.

Develop the argument in the following sequence (approximate paragraph allocations):

(i) **Chronological-textual evidence (~250 words).** Heidegger's *Being and Time* §29 retrospectively names Aristotle's *Rhetoric* II as "the first systematic hermeneutic of the everydayness of Being-with-one-another" (SZ §29, H.138; Eng. 178). Quote directly the relevant passage from H.138–139 (use the full block-quote at source line 24, with proper SZ-H pagination). Argue that this retrospective citation explicitly identifies the *Rhetoric* II treatment of πάθη — the very treatment Heidegger develops in the GA 18 lectures — as the Aristotelian prefiguration of what *Being and Time* analyzes as Befindlichkeit, Stimmung, and the disclosive structure of state-of-mind. The chronological arc is therefore not interpretive: Heidegger himself draws it.

(ii) **Layer A: pathē as the ground of logos (~300 words).** Develop the GA 18 grounding-direction claim. Quote the BCAP passage on πάθη as "the ground out of which speaking arises, and which what is expressed grows back into" (BCAP, p. 176) and the BT companion passage on state-of-mind disclosing Dasein "prior to all cognition and volition, and beyond their range of disclosure" (SZ §29, H.135; Eng. 175). Argue the structural identity: GA 18's *finding-oneself* that grounds *logos* IS what *Being and Time* names *Befindlichkeit* — literally "the how of one's finding-oneself" — that grounds *Verstehen* and *Rede*. Emphasize that this grounding-direction operates at the most basic level: it is pre-cognitive, pre-volitional, and constitutive of the disclosive medium in which entities can show up as mattering. Connect this directly to the actualization chain established in the prior section: basic *resonant orexis* at the perceptual level IS the *pathos*-grade instantiation of this disclosive ground; the chain shows mood (basic affective valence) as prior to all cognition (*doxa*) and volition (deliberative choice).

(iii) **Layer B: hermeneutical "as" and the perceptual position-taking (~400 words).** Develop the homology between basic *pathos* as pre-propositional position-taking and *Being and Time*'s hermeneutical "as." Quote two BT passages: (a) the prior-disclosedness passage at SZ §29, H.137 (Eng. 176) — "letting something be encountered is primarily circumspective… to be affected by the unserviceable, resistant, or threatening character of that which is ready-to-hand becomes ontologically possible only in so far as Being-in as such has been determined existentially beforehand"; and (b) the hammer-becoming-object passage at SZ §33, H.158 (Eng. 200–201) — the as-structure of interpretation undergoes a modification when an entity becomes the "object" of an assertion, and "this leveling of the primordial 'as' of circumspective interpretation to the 'as' with which presence-at-hand is given a definite character is the specialty of assertion." Define the two terms via Heidegger's own formulation: "the primordial 'as' of an interpretation (ἑρμηνεία) which understands circumspectively we call the 'existential-hermeneutical 'as'' in distinction from the 'apophantical 'as'' of the assertion" (SZ §33, H.158; Eng. 201). Argue that the *aisthēsis*-as-*kritikon* reading Heidegger develops in the lectures (BCAP p. 126) is precisely the perceptual-level instantiation of what *Being and Time* generalizes as the as-structure of involved understanding: perception is already a position-taking, already a "this-as-pursue-able" or "this-as-avoid-able," before any propositional articulation. Basic *resonant orexis* IS the *pathos*-grade hermeneutical "as." The position-taking is pre-propositional but not pre-positional.

(iv) **Layer C: doxa as the apophantical articulation (~300 words).** Develop the homology between *doxa* and *Being and Time*'s apophantical "as." Quote (briefly) Heidegger's GA 18 characterization of *doxa* as standing "at the end of seeing" — *doxa* is *phasis* (yes-saying, predicative articulation) rather than direct seeing. Connect this to *Being and Time*'s account of assertion (*Aussage*) as a derivative mode of interpretation in which the hermeneutical "as" is "leveled down" to the apophantical "as" (SZ §33, H.158; Eng. 201). Argue that *doxa* performs at the *pathos* level exactly what *Aussage* performs at the level of interpretation in general: the propositional articulation of what the dispositional ground has already disclosed. The "this-as-pursue-able" of basic valence becomes the propositionally articulated "this IS fearful," "this IS pity-worthy," "this IS shameful." The higher-order *pathē* are *doxa*-mediated apophantical articulations of the basic *pathos* their disposition has already disclosed. Two patterns, structurally identical at different domains:

- *Being and Time*: hermeneutical "as" (involved position-taking, pre-propositional) → apophantical "as" (predicative determination, propositional), the latter derived from and grounded in the former.
- The present synthesis: basic *pathos* / *resonant orexis* (involved position-taking, pre-propositional, "this-as-pursue-able") → higher-order *pathē* (doxa-articulated determinate emotion, propositional, "this IS fearful"), the latter derived from and grounded in the former, mediated by *doxa*.

(v) **The system tension and its *pathos*-level resolution (~250 words).** State the open tension Heidegger's account leaves unresolved: assertion is supposed to be a "derivative mode" of interpretation in which the apophantical "as" arises from a leveling-down of the hermeneutical "as," and yet Heidegger's own analysis shows assertion retains the full fore-structure of interpretation — it has fore-having, fore-sight, fore-conception. If the structure is retained, what exactly is "leveled"? Resolve this tension at the *pathos* level: what is leveled in the move from basic *pathos* to higher-order *pathē* is NOT the position-taking itself — that is retained — but its *articulational concretion*. The pre-propositional "this-as-good" becomes propositionally articulated as "this IS good." The fore-structure (the dispositional ground, the basic valence) is retained because higher-order *pathē* still presuppose the basic *pathos* they articulate. The "leveling" is the propositional articulation of what the disposition has already disclosed; the fore-structure is retained because the disposition itself is preserved through the articulation. The *pathos*-level cut therefore renders intelligible at a determinate level what the BT *Aussage*-analysis leaves structurally tense.

(vi) **Closing synthesis (~150 words).** Restate the position. Heidegger's GA 18 *pathos*-analysis is the preparatory work for *Being and Time*'s hermeneutical/apophantical cut. *Being and Time* generalizes the cut at the level of interpretation/assertion (*Verstehen* → *Aussage*). The actualization chain reinstantiates the same pattern at the *pathos* level by drawing the articulational cut (basic *pathos* / higher-order *pathē*) that Heidegger's lectures leave undrawn, identifying *doxa* as the *pathos*-level analog of *Aussage*, and articulating the directional structure that runs basic *pathos* → *logos* → *doxa* → higher-order *pathē*. The unfinished work of the lectures — the *pathos*-specific concretion of the structural pattern Heidegger himself prepared — is here completed. End with a transitional sentence orienting the reader toward the *Metaphysics* fourfold subsubsection.

ABSORB these inlinenotes from the source into Subsection 2:
- Source line 16 (structural parallel inlinenote) → entirely absorbed into the argument.
- Source line 18 (dynamis-energeia register inlinenote) → folded into a single sentence within Layer C, clarifying that both basic *resonant orexis* and higher-order *pathē* are *energeiai* of the same πάθος-structure at different articulational concretions, not the relation between *dunamis* and *energeia*.
- Source line 64 (the "DOes my actualization chain show that MOOD…" question) → answered explicitly within Layer A. The answer: yes; the chain shows basic *resonant orexis* at A₁ as pre-doxa, pre-logos, and therefore prior to all cognition and volition.
- Source line 62 (the hanging BT 176 quote "The mood has already disclosed…") → integrate as supporting evidence within Layer A.

**Subsection 3 — The *Metaphysics* Fourfold: *Pathos* from Alterability to Magnitude (~900 words).**

PRESERVE substantially the prose at source lines 70–81. Targeted revisions:

- The opening sentence currently reads "As Heidegger glosses in his reading of Aristotle's *Metaphysics*…" — keep this and the existing footnote 6 (which contains the four-senses verification at the basic-valence level) but reformat footnote 6 as cleaner running prose within the footnote (it currently has heavy mid-sentence typographical noise: "perception's *dynamis* is constitutionally alterable…" etc. — clean this up so each of (1)–(4) is a single, well-formed sentence).
- The numbered list of four senses (source lines 73–77): KEEP the indented enumerate environment with the four senses. Each uses a direct quote from BCAP pp. 131–132. PRESERVE the existing translations and Greek.
- The Heidegger phenomenological-assessment paragraph (source line 79): KEEP. Quote BCAP p. 132 ("From these four meanings, the *genuine relatedness* of πάθος becomes visible…") and the σωτηρία-preservation passage. The σωτηρία/φθορά distinction at *DA* II.5 417b2-5 in footnote — KEEP this footnote.
- The four-senses-at-perceptual-level recap paragraph (source lines 80–81): KEEP. This is the structural recap mapping each of the four senses onto basic *resonant orexis*. Footnotes for *DA* II.2 413b24, II.12 424a28-32, III.2 426a30-b8, and *Sense* 447b4-5 — all KEEP.
- The closing inlinenote at source line 83 (magnitude as multi-dimensional): ABSORB into a footnote attached to the final sentence of the recap paragraph. The footnote should run approximately three sentences: Heidegger reads magnitude as quantitative-existential (size of misfortune); the magnitude-axis as deployed here is multi-dimensional, with at least three independent dimensions — hedonic intensity, existential weight, cognitive articulation; the articulational dimension carries most of the structural argument, and may operate even where hedonic intensity is high (the drinking case) without propositional articulation.

**Subsection 4 — The *Rhetoric*'s Constitutive Threefold: *Pathos* as Change, *Krisis*, and Hedonic Tonality (~750 words).**

PRESERVE substantially the prose at source lines 87–93. Targeted revisions:

- The primary definition (Rhet II.1, 1378a20–22): KEEP. Confirm Bekker citation is "1378a20–22" (no typos).
- The Heidegger threefold gloss (source line 89, indented): KEEP the indented adjustwidth environment with the three constitutive moments and their footnotes. The Greek scholia at *diapherousi pros tas kriseis* and *hois hepetai lypē kai hēdonē* — KEEP.
- The discussion of *kriseis* as position-takings (source line 91): KEEP. Heidegger's emphasis on differentiating-of-oneself-from-oneself, pleasure/pain as co-given. End at the closing-sentence summary: "every *pathos*… is a (1) change-in-disposition that (2) differentiates the subject's position-taking and is (3) co-given with hedonic tonality."
- The three-fold-at-perceptual-level demonstration (source line 93): KEEP. The *aisthēsis*-as-*kritikon* / *mesotēs* analysis at BCAP p. 126, *DA* III.7 431a8-12, and the per-aspect demonstration that all three Rhetoric moments hold at the perceptual level via basic *resonant orexis*.
- RESOLVE `\hl{Heeideggerian mood)}` (appearing as "or what Heidegger calls in *Being and Time*… Heeideggerian mood)"): replace with a clean parenthetical "what Heidegger names the disclosive *Stimmung* of *Befindlichkeit*" with a footnote citing SZ §29, H.134 (Eng. 172): "What we indicate ontologically by the term 'state-of-mind' is ontically the most familiar and everyday sort of thing; our mood, our Being-attuned." The misspelled marker indicates a placeholder — fix it.
- RESOLVE `\hl{(CITE)}` after "the *desire* to retaliate, the *desire* to flee, and the *desire* that the suffering cease" (source line 93, footnote): the conative components are interpretive readings rather than direct Aristotelian citations. Reframe the footnote to reflect this: the conative components for fear and pity are read off the Rhetoric definitions interpretively, since Aristotle does not name a desire-component directly in the fear (Rhet II.5, 1382a22–32) or pity (Rhet II.8, 1385b13–19) definitions. Anger is the explicit case (Rhet II.2, 1378a30 — "desire accompanied by pain for conspicuous revenge"). Frame the footnote: "Anger names the *desire* explicitly (Rhet II.2, 1378a30); for fear and pity the conative orientation is interpretive — read off the formal structure of avoidance and the wish-that-the-suffering-cease respectively, rather than directly stated by Aristotle."
- The closing inlinenote at source line 95 ("perhaps temporal aspect as well for higher order pathē"): DROP. The temporal dimension is now developed in Subsection 1.7's feedback-loop section (the Geworfenheit/hexis-temporality treatment); a marginal note is no longer warranted here.

====================================================================
CITATION FORMAT — HARD REQUIREMENT
====================================================================

ARISTOTLE: Bekker notation only. NEVER use Barnes page numbers.

CORRECT examples:
- "*De Anima* II.5, 417b2–7"
- "*De Anima* III.7, 431a8–12"
- "*Metaphysics* Δ.21, 1022b15–21"
- "*Rhetoric* II.1, 1378a20–22"
- "*Rhetoric* II.2, 1378a30–b9"
- "*Rhetoric* II.5, 1382a21–22"
- "*Nicomachean Ethics* III.8, 1116b23–1117a9"

INCORRECT — NEVER USE THESE:
- "Aristotle, *De Anima*, p. 18" — FORBIDDEN
- "(Aristotle, *Rhetoric*, p. 70)" — FORBIDDEN
- "*Metaphysics* 21" — INSUFFICIENT (must be "Δ.21" or "V.21" with full Bekker)

KNOWN BEKKER TYPOS TO FIX (if propagated from elsewhere):
- "13789a21-22" → "1378a21–22"
- "701b33-7022" → "701b33–702a3" (only relevant if cross-referenced)

HEIDEGGER (BT): Cite by SZ German pagination AND English page. Format: "(SZ §29, H.138; Eng. 178)".

KNOWN BT PAGES FOR THIS SECTION:
- §29, H.134 / Eng. 172 — state-of-mind as ontically familiar
- §29, H.135 / Eng. 175 — thrownness; mood disclosing Dasein prior to cognition
- §29, H.137 / Eng. 176 — prior-disclosedness through state-of-mind; Being-affected
- §29, H.138 / Eng. 178 — Rhetoric II as "first systematic hermeneutic"
- §32, H.149 / Eng. 191 — interpretation, fore-structure
- §33, H.158 / Eng. 200–201 — apophantical "as"; leveling of primordial "as"

HEIDEGGER (BCAP / GA 18): Cite by translation page only — "(BCAP, p. 176)" or by section number — "(GA 18, §15)".

KNOWN BCAP PAGES FOR THIS SECTION:
- p. 115 — three constitutive aspects of pathos
- p. 122 — hexis as self-cultivation through prior actualizations
- p. 125 — hexis as a how of pathos
- p. 126 — aisthēsis as mesotēs / kritikon
- p. 131–132 — fourfold of *Metaphysics* Δ.21
- p. 133 — pathē not "in consciousness"; full being-in-the-world
- p. 134 — no division between psychic and bodily
- p. 173–174 — fear analysis; "believing" the threat threatens me
- p. 176 — pathē as ground of speaking; finding-oneself

====================================================================
STYLISTIC CONSTRAINTS
====================================================================

- Lanham-tuned profile: avg ~31 words/sentence with periodic short-pivot variation; ~50% long sentences balanced by periodic short assertions; formality ~0.64.
- Author-prominent citations at ~99% rate. Introduce Aristotle (or Heidegger) as agent BEFORE the quote: "Aristotle observes," "Aristotle argues," "Aristotle insists," "Aristotle states," "Heidegger writes," "Heidegger argues," "Heidegger insists."
- Transition vocabulary: *thus*, *specifically*, *indeed*, *accordingly*, *hence*. Do NOT use: *poignantly*, *strategically qualified*, *interestingly*, *it is worth appreciating*, *tellingly*.
- Minimize meta-discourse: do NOT use "to reiterate," "before we can analyze," "I should clarify here," "as we have discussed," "as I have argued above" (use specific cross-reference instead, e.g., "the prior section").
- Block quotes only when load-bearing — particularly the BT §29 H.138 retrospective passage and the BT §33 H.158 hermeneutical/apophantical "as" passage. Extract decisive clauses elsewhere and unpack discursively.
- Greek terms: italicized transliteration first, Greek script in parens — e.g., "*pathos* (πάθος 'affect')". Match the source draft's actual practice, not external prescriptions.

====================================================================
VOCABULARY CONSTRAINTS
====================================================================

DO USE:
- *pathos*, *pathē* (singular and plural, Greek script + transliteration on first occurrence per subsubsection)
- *resonant orexis* — basic affective valence at perceptual level (introduced in prior chapter)
- *resonant kinesis* — residual motion in sensory apparatus (introduced in prior chapter)
- *resonant aisthēma* — formal-epistemic aspect of residual motion (introduced in prior chapter)
- *articulational concretion* — the user's term for the cut between basic *pathos* and higher-order *pathē*
- *doxa* (δόξα) — opinion/belief, the apophantical-articulational gate
- *phantasia*, *phantasma* — only as cross-reference, do not develop
- *aisthēsis* (αἴσθησις)
- *sōtēria* (σωτηρία) / *paschein* (πάσχειν) — preservation / being-affected
- *energeia*, *dunamis*, *entelecheia*
- *mesotēs* (μεσότης), *kritikon* (κριτικόν)
- *hexis* (ἕξις)
- *Befindlichkeit*, *Stimmung*, *Verstehen*, *Rede*, *Aussage*, *Geworfenheit* — German technical terms (italicized, with English gloss on first use)
- "hermeneutical 'as'" / "apophantical 'as'"

DO NOT USE:
- "resonant tonality," "resonant motion," "resonant mood" (retired)
- "atmospheric attunement" (Subsection 1.6's vocabulary, not 1.2's)
- "pre-cognitive" without qualification (use "pre-doxastic" or "pre-propositional")
- "raw feeling," "mere physiological disturbance" — too colloquial
- "to put it another way," "in other words" — restate the substance, do not flag the restatement

====================================================================
FORBIDDEN DEPLOYMENTS
====================================================================

- Do NOT develop the *Metaphysics* fourfold or the *Rhetoric* threefold structures BEFORE Subsection 3 / Subsection 4 — Subsections 1 and 2 may gesture at them but must not preempt the structured exposition.
- Do NOT develop the variable-presence cases (drinking, habitual-rational, evaluatively complex action) in 1.2 — those belong to Subsection 1.6.
- Do NOT develop the feedback-loop / *De Insomniis* / Geworfenheit analysis in 1.2 — that belongs to Subsection 1.7.
- Do NOT develop the enmattered-accounts framework (*DA* I.1, 403a25–b19) at length — that belongs to Subsection 1.3.
- Do NOT develop the somatic-preparation account (*MA* 7) at length — that belongs to Subsection 1.5.
- Do NOT develop the per-emotion definitions (anger, fear, pity, shame definitions in detail) — those belong to Subsection 1.4 and may be referenced but not developed.
- Do NOT cite secondary scholarship (White, Caston, Frede, Nussbaum, etc.) — they are not deployed in 1.2.
- Do NOT include `\inlinenote{}`, `\hl{}`, TODO markers, or working-note markup in the output. The output is the final draft.
- Do NOT generate "Claim Map," "Quotation Ledger," "Citation Ledger," or "Validation Summary" sections as part of the body. If the pipeline post-attaches these as artifacts, that is acceptable; do not include them in the 4,200-word body count.
- Do NOT use Barnes pagination for Aristotle.
- Do NOT collapse Aristotle's text into Heidegger's interpretation — preserve the distinction between Aristotle's position and Heidegger's reading of that position. When Heidegger is interpreted as restoring or recovering an Aristotelian doctrine, mark the mediation: "as Heidegger reads Aristotle," "Heidegger's gloss," "Heidegger's *Rhetoric*-reading."
- Do NOT use Heidegger as the SOLE warrant for a claim about Aristotle's own doctrine. Aristotle must be cited first for Aristotelian doctrine; Heidegger is cited for Heidegger's reading of that doctrine.

====================================================================
INLINENOTE / HIGHLIGHT INTEGRATION TABLE
====================================================================

Source-line locations and their disposition:

| Source loc. | Content | Disposition |
|-------------|---------|-------------|
| Line 3, fn. 1 | BCAP p. 125 hexis-as-how-of-pathos | KEEP verbatim |
| Line 3, fn. 2 | BT §32–33 hermeneutical/apophantical | KEEP, reformat with SZ-H pagination |
| Line 3, fn. 3 | rational-animals restriction + animal-pathē mediation | EXPAND to absorb lines 8 + 10; correct citation to NE III.8 |
| Line 8 (inlinenote) | NE III.8 1116b24-1117a5 quotation | ABSORB into fn. 3 |
| Line 10 (inlinenote) | HA IX 10–14 quotation | ABSORB into fn. 3 |
| Line 14 `\hl{}` | resonant orexis vs basic affective valence distinction | RETAIN distinction, REMOVE `\hl{}` markup |
| Line 16 (inlinenote) | structural parallel to BT §32–33 | ABSORB into Subsection 2 (Layers A–C and resolution) |
| Line 18 (inlinenote) | dynamis-energeia register clarification | ABSORB into Subsection 2 (Layer C, single sentence) |
| Lines 20–66 | Three Layers + system tension | EXPAND into Subsection 2 prose (~1,650 words) |
| Line 62 (hanging quote) | BT 176 "mood has already disclosed" | INTEGRATE as supporting evidence in Layer A |
| Line 64 (inlinenote) | "Does the chain show MOOD prior?" | ANSWER explicitly in Layer A |
| Line 83 (inlinenote) | magnitude as multi-dimensional | ABSORB into footnote on Subsection 3's recap paragraph |
| Line 93 `\hl{Heeideggerian mood)}` | placeholder for Stimmung citation | RESOLVE with footnote citing SZ §29, H.134 |
| Line 93 `\hl{(CITE)}` | conative components for fear/pity | REFRAME as interpretive reading; cite Rhet II.5 / II.8 directly |
| Line 95 (inlinenote) | "perhaps temporal aspect" | DROP — handled in Subsection 1.7 |

====================================================================
BEKKER CITATION LEDGER (use these exact references)
====================================================================

ARISTOTLE — *DE ANIMA*:
- I.1, 403a25–b19 — pathē as enmattered accounts (cross-reference only; not developed)
- I.4, 408b5–7 — being pained or pleased, or thinking, are *kineseis*
- II.2, 413b24 — where there is sensation, there is also pleasure and pain
- II.5, 416b33–417a20 — sensation as movement; *dynamis* of perception
- II.5, 417b2–7 — two senses of *paschein*: extinction vs. preservation
- II.12, 424a28–32 — destruction-by-excess
- III.2, 426a28–b8 — sense as ratio (*logos*); excess destroys the ratio
- III.3, 428a23–24 — brutes have phantasia without logos
- III.7, 431a8–12 — perception, affirmation/negation, pursue/avoid

ARISTOTLE — *METAPHYSICS*:
- Δ.21, 1022b15–21 — fourfold sense of *pathos*

ARISTOTLE — *RHETORIC*:
- II.1, 1378a20–22 — definition of emotion as judgment-affecting
- II.2, 1378a30–b9 — anger definition (full passage)
- II.5, 1382a22–32 — fear definition
- II.8, 1385b13–19 — pity definition

ARISTOTLE — *NICOMACHEAN ETHICS*:
- II.1, 1103a17–25 — settled disposition (*hexis*) from repeated actualization (cross-reference only)
- III.8, 1116b23–1117a9 — animals act under pain/spirit but lack rational element

ARISTOTLE — *HISTORIA ANIMALIUM*:
- IX (Bekker 588a–608b) — animal characters, dispositions analogous to soul-passions

ARISTOTLE — *SENSE AND SENSIBILIA*:
- 7, 447b4–5 — stronger stimuli mask weaker stimuli (cross-reference for magnitude)

HEIDEGGER — *BEING AND TIME*:
- §29, H.134 / Eng. 172 — state-of-mind as ontically familiar mood
- §29, H.135 / Eng. 175 — thrownness; mood prior to cognition and volition
- §29, H.137 / Eng. 176 — prior-disclosedness; being-affected
- §29, H.138 / Eng. 178 — Rhetoric II as "first systematic hermeneutic of everydayness"
- §33, H.158 / Eng. 200–201 — apophantical "as"; leveling of primordial "as"

HEIDEGGER — *BCAP* / GA 18:
- p. 115 — three constitutive aspects of *pathos*
- p. 122 — hexis-genesis "in being-there itself"
- p. 125 — hexis as "how of pathos"
- p. 126 — *aisthēsis* as *mesotēs* / *kritikon*
- p. 131–132 — fourfold of *Metaphysics* Δ.21
- p. 133 — pathē as full being-in-the-world
- p. 134 — no division between psychic and bodily
- p. 173–174 — fear; the "believing" that the threat threatens me
- p. 176 — pathē as ground out of which speaking arises

====================================================================
DRAFTING PROCESS — MULTISTEP, NO INLINE VALIDATOR
====================================================================

USE the multistep drafting pipeline (`investigateV1` / multi-step CLI). DO NOT use the inline-validator path.

Step 1: Retrieve all relevant passages from `corpus/index/` (Bekker reverse-index, BT-structured, BCAP). Confirm Bekker / SZ-H / BCAP loci against the ledger above.

Step 2: Retrieve chunked content from ChromaDB collections for the loci. Cross-check against the index to ensure passage fidelity.

Step 3: Draft Subsection 1 first, preserving source prose at lines 3–14 with the targeted footnote-revisions specified.

Step 4: Draft Subsection 2 from scratch (this is the synthesis-heavy section). Follow the (i)–(vi) sequence specified in the per-subsection requirements. Target ~1,650 words. Use the integration table to absorb the listed inlinenotes/highlights.

Step 5: Draft Subsections 3 and 4 by polishing the existing source prose with the targeted revisions specified. Resolve `\hl{}` markers. Drop / absorb inlinenotes per the integration table.

Step 6: Run a continuity pass across the four subsections — check transitions, verify the sōtēria-paschein anchor in Subsection 1 connects to the disclosive-ground argument in Subsection 2, verify the *Metaphysics* fourfold (Subsection 3) and *Rhetoric* threefold (Subsection 4) both close back to the articulational-concretion thesis.

Step 7: Verify ALL Bekker citations against the ledger. Verify ALL SZ citations have H-pagination + English page. Verify NO Barnes pagination is used. Verify NO `\inlinenote{}` or `\hl{}` markers remain in the output.

Step 8: Verify word count: total body ~4,200 words (Subsection 1 ~1,150; Subsection 2 ~1,650; Subsection 3 ~900; Subsection 4 ~750). Footnotes counted separately and may run to substantial length where they absorb inlinenote content (especially fn. 3 in Subsection 1).

Output the complete LaTeX text of the four subsections in order, with all footnotes, block quotations (`adjustwidth` environments), and Greek script preserved per the source draft's conventions.
