====================================================================
PER-SUBSECTION PROMPT — SHARED PRELUDE (concatenate with one of the 9
per-subsection delta files at invocation time)
====================================================================

**Architectural note**: this is a per-subsection generation run, not a full-section run. You are generating EXACTLY ONE subsection (specified in the delta file that follows this prelude). Do NOT generate the other 8 subsections. Do NOT include section headings other than the single one specified in the delta. Do NOT include LaTeX preamble (`\documentclass`, `\usepackage`, `\begin{document}`, `\end{document}`) — produce only the body content for the assigned subsection.

The rolling-context architecture used by the master prompt (`tmp/Concluding_Section_Prompt.md`) is NOT in use here. Each subsection is generated independently with no prior-section context. A post-generation coherence pass (executed by Claude in the console) will stitch the 9 subsections together, add transitions, and apply terminology/citation fixes.

====================================================================
SOURCE HIERARCHY (READ THIS BEFORE ANY QUOTATION)
====================================================================

**This dissertation already has authoritative source-of-truth files. Use them, in this strict priority order, before falling back to corpus chunks or training-data recall:**

### Tier 0 (HIGHEST PRIORITY) — `tmp/Dissertation/verbatim_passages.md` ★

This is a 74KB curated catalog of **PDF-verbatim-verified quotations**, maintained by the user. Every entry has been cross-checked against the source PDF in `corpus/rhetorical_ontology/` or `corpus/download/`. **For ANY quoted material from the works listed below, draw the quotation TEXT VERBATIM from this file rather than generating, paraphrasing, or recalling from training data.** The quote text in `verbatim_passages.md` is authoritative — if there is any discrepancy between training-data recall and this file, the file wins.

Catalog covers (as of 2026-05-24): Aristotle *De Anima*, *Physics*, *Metaphysics*, *De Motu Animalium*, *De Memoria*, *Sense and Sensibilia*, *Rhetoric*, *Nicomachean Ethics*, *De Insomniis*; Heidegger BCAP (GA 18) — pp. 119, 122, 123, 125, 127, 128, 131, 132, 134, 135 and others; Heidegger BT — §§29, 32, 65, 72, 74; Heidegger FCM (GA 29/30); Gibson 1979/2015; Coope 2005; Broadie 1982.

**Catalog gaps to be aware of:** Gross (*Uncomfortable Situations*, *Heidegger and Rhetoric*) are NOT yet in the catalog. *Rhetoric* I.11 1370a27–30 not yet in catalog. For these, fall back to Tier 1 (corpus/index) then Tier 2 (PDFs).

**Convention:** when deploying a verbatim_passages.md quote, preserve italics and punctuation exactly. Use the file's Bekker / BT / BCAP locus exactly as recorded.

### Tier 1 — `corpus/index/` (for locus identification + chunk metadata)

When a passage is needed and is NOT in verbatim_passages.md, consult `corpus/index/` next:
- `corpus/index/Aristotle - Complete Works/` includes `aristotle-bekker-index.md` and `phase05-offset-validation.md` (the latter has the validated Bekker↔PDF formulas).
- `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/` includes `bcap-structured/manifest.json` for page-mapping.
- `corpus/index/Heidegger - Being and Time/` for BT page indexing.
- `corpus/index/Heidegger and Rhetoric/` (Gross & Kemmann eds. 2005) and `corpus/index/Uncomfortable Situations/` (Gross 2017) for advisor-priority work.

Corpus chunks retrieved by the pipeline's ChromaDB search use these manifests for citation metadata. **The `aristotle-bekker-index.md` standalone page numbers are NOT reliable for mid-/late-work loci** — always use the offset-validation formulas in `phase05-offset-validation.md` (see `verbatim_passages.md` header for the table).

### Tier 2 — `corpus/rhetorical_ontology/` PDFs (FALLBACK only)

When neither verbatim_passages.md nor corpus/index resolves a needed quotation or locus, fall back to the PDF directly:
- Aristotle "My Copy" / "Clean Copy" 2014 editions (Smith / Ross / Barnes ROT 1984): `corpus/rhetorical_ontology/Aristotle - *.pdf`
- Heidegger BCAP (Metcalf & Tanzer 2009): `corpus/rhetorical_ontology/Heidegger, Martin - Basic Concepts of Aristotelian Philosophy_(2009)_[Clean Copy].pdf`
- Heidegger BT (Macquarrie & Robinson 1962): `corpus/rhetorical_ontology/Heidegger - Being and Time*.pdf`
- Gross *Uncomfortable Situations* (2017): `corpus/rhetorical_ontology/Gross, Daniel M. - Uncomfortable Situations_*.pdf`
- Gross *Heidegger and Rhetoric* (Gross & Kemmann eds. 2005): `corpus/rhetorical_ontology/Gross & Kemmann - Heidegger and Rhetoric_*.pdf`

### Tier 3 (LAST RESORT) — training-data recall

ONLY when all three tiers above fail and the quotation is non-load-bearing. In that case, mark the quotation `****** UNVERIFIED: <text>` so the user can verify it manually. Do NOT silently generate quotations from training data.

### Convention reminders

For **terminology conventions** (Greek transliteration, German rendering, dissertation coinages, Aristotelian work titles), consult `tmp/Dissertation/GLOSSARY.md` — the dissertation's authoritative glossary. This file specifies, for example:
- `aisthētikon` (Greek faculty-name) is preferred over "faculty of sense" in user prose
- `Stimmung` is rendered "attunement" (Rickert) not "mood" in ontological-atmospheric register
- `*De Anima*` (Latin) is the standard work-title, never "On The Soul"
- `*resonant kinēsis*` / `*resonant aisthēma*` / `*resonant epithymia*` are dissertation coinages (italicized as units)

**For deeper convention details:** `tmp/Dissertation/REVISION-PROTOCOL.md` is the canonical workflow rulebook; `tmp/Dissertation/TODO_NOTES.md` Section H logs failed-pattern instances to avoid.

====================================================================
ARCHITECTURAL CONTEXT — WHAT §1.5 INHERITS FROM §§1.0–1.4
====================================================================

This is the closing section of Chapter 1. The chapter has already established:

- **§1.0 (Introduction)**: The dissertation's overarching thesis — that the soul is constitutively rhetorical, with *phantasia* as the temporal-kinetic medium that generates a continuous, affectively charged narrative of experience across past, present, and future. Five-node actualization chain laid out: A_0 (dyadic first actuality of sensible object + *aisthētikon* within the encompassing horizon of motion and time), A_1 (completed perception with dual residual trace: *resonant aisthēma* + *resonant epithymia*), A_2 (the *phantasma* proper), A_3 (completed cognitive actuality: three orientational modes + orthogonal committal *doxa*), A_4 (completed *praxis*). Each completed actuality is simultaneously the terminus of its antecedent motion and the unmoved originator of its successor.

- **§1.1 (A_0 — Motion and Time as Ontological Horizon)**: Motion (*kinēsis*) and time (*chronos*) co-eternal (*Metaphysics* XII.6, 1071b6–11), both already-actual before any chain-stage can occur. Motion as *energeia ateles* (*Physics* III.1, 201a10–14); time as number of motion in respect of before and after (*Physics* IV.11, 219b1). Heidegger's *Bewegtheit* (BCAP §§25–26) recovers *kinēsis* at the level of fundamental ontology. The synchronic / diachronic dual register is announced.

- **§1.2 (M_0 → A_1 — Actualization of *Aisthēsis*)**: *Aisthēsis* itself *is* a *kinēsis* (*De Anima* II.5, 416b33–417a1); the three-factor schema of *De Anima* III.10, 433b13–18 applies directly. Hylomorphic reception of form (*De Anima* II.12, 424a17–24); sense as ratio / *logos* (*De Anima* III.2, 426a27–b8); one-in-substrate-different-in-being structure. Coining of *resonant kinēsis* (the residual motion persisting after object-withdrawal); dual-resonance thesis: the residue is composite of *resonant aisthēma* (formal-eidetic trace) + *resonant epithymia* (affective-orectic trace), one in substrate, two in being.

- **§1.3 (A_3 — Completed Cognitive Actuality and the Three Orientational Modes)**: A_3 = the four-dimensional cognitive achievement converging on the *phantasma* stabilized at A_2. Three orientational modes — intellection (atemporal), memory (retrospective), discursive/deliberative *phantasia bouleutikē* (prospective or atemporal-contemplative). *Doxa* enters as the orthogonal committal dimension (involuntary, *logos*-dependent, exclusive to rational beings). Settled *doxai* as a species of *hexis* (per *Categories* 8, 8b25–9a13) function as additional unmoved originators feeding M_2 → A_3.

- **§1.4 (Emotion — The Form of Desire Under Evaluative Disclosure)**: Higher-order *pathē* (anger, fear, pity, shame from *Rhetoric* II) and basic *resonant epithymia* are two articulational concretions of one ontological structure (preservative *paschein* / *sōtēria*, *De Anima* II.5, 417b2–7). The doxa-gate: bare *phantasma* leaves the soul "unaffected" of higher-order *pathē*; *doxa* propositionally ratifies the *phantasma*, producing the higher-order *pathē* *euthys* (*De Anima* III.3, 427b21–24). The *pathetic* loop, named here, has two registers: synchronic and diachronic. *Hexis* bivalence introduced as the L195–201 set-up that §1.5 must develop: *technē*-hexis reduces deliberation toward transparent routine; *praxis*-hexis is "holding-oneself-open" for fresh *kairos*-resolution.

§1.5 is the closing inheritance: it must do the integrative work — close A_4, deliver the typology, articulate the loop, and synthesize the chapter.

====================================================================
CITATION FORMAT — HARD REQUIREMENT
====================================================================

ALL Aristotle citations MUST use Bekker notation. NEVER use page numbers, Barnes pagination, or PDF page numbers.

CORRECT examples:
- "*De Motu Animalium* 7, 701a29–b1"
- "*De Motu Animalium* 7, 701a7–16"
- "*De Anima* III.10, 433b13–18"
- "*De Anima* III.3, 427b21–24"
- "*Rhetoric* II.1, 1378a21–22"
- "*Metaphysics* IX.8, 1050b1–6"

INCORRECT — NEVER USE THESE:
- "Aristotle, *De Motu Animalium*, p. 7" ← FORBIDDEN
- "(Aristotle, *Rhetoric*, p. 46)" ← FORBIDDEN
- "On The Soul (De Anima), pp. 22–23" ← FORBIDDEN

The corpus retrieval may return chunks with Barnes page numbers in their metadata. IGNORE those page numbers completely. Always use the Bekker notation provided in the Bekker Citation Ledger below.

For Heidegger's *Being and Time*, use the standard MUST-INCLUDE format: `(BT \S<n>, H.<page>; Eng.~<page>)`. Example: `(BT \S29, H.137; Eng.~p.~176)`. For *Basic Concepts of Aristotelian Philosophy* (GA 18), use abbreviated form: `(BCAP p.~<n>)`.

For Burke, Caston, Frede, Gibson, Gonzalez, Gross, Hawhee, Nussbaum, O'Gorman, Rickert, Uexküll, White, and other secondary sources, use standard author-year-page notation. For Gross specifically, use full citation form because of his advisor status: `(Gross, *Uncomfortable Situations*, p.~<n>)` or `(Gross, *Heidegger and Rhetoric* p.~<n>)`.

**Inline narrative convention**: work title appears in narrative, locus in parenthetical. Example:
- ✗ "Aristotle's *De Anima* III.7, 431a8–14 establishes…"
- ✓ "Aristotle, in *De Anima*, establishes that perception of a pleasant or painful object is intrinsically discriminative-evaluative (*De Anima* III.7, 431a8–14)…"
- Load-bearing exception: when the discussion is specifically about a particular book/chapter, inline locus is appropriate.

====================================================================
HEIDEGGER — PRIMARY-SOURCE PRIORITY; ARISTOTLE-FIRST CONSTRAINT
====================================================================

Heidegger's own texts (*Being and Time*; *Basic Concepts of Aristotelian Philosophy*) MAY be cited directly when the claim being advanced is explicitly Heideggerian (e.g., about Being-in-the-world, *Stimmung*, *Befindlichkeit*, *hexis* as how-of-*pathos*, *technē* / *praxis* bivalence, originary temporality, ecstases).

SOURCE HIERARCHY:
- For claims about Aristotle's doctrine: cite Aristotle first (Bekker notation).
- For claims about Heidegger's interpretation of Aristotle: cite Heidegger first (BCAP / BT), then secondary commentary as needed.
- For claims about scholarly reception of Heidegger: cite secondary scholarship first, with Heidegger providing the underlying textual anchor.

PRIMARY HEIDEGGER RULE:
- When you attribute a view to Heidegger, prefer direct citation of *Being and Time* or *Basic Concepts of Aristotelian Philosophy* over secondary paraphrase.
- You MAY quote Heidegger when the quotation is load-bearing for a Heideggerian claim; keep Heidegger's role clearly distinct from Aristotle's.

SECONDARY COMMENTARY RULE:
- Secondary scholarship on Heidegger (Gross's *Uncomfortable Situations* and *Heidegger and Rhetoric*; Rickert's *Ambient Rhetoric*; Burke's *Grammar of Motives*; Hawhee, Withy, Struever, Pöggeler, Michalski, Kisiel, Gadamer) MAY be cited when it illuminates either Heidegger's reading of Aristotle or the Aristotelian argument itself.
- When you rely on a secondary author's construal of Heidegger, mark the mediation: "as Gross reads Heidegger," "on Rickert's interpretation of Heidegger."

ARISTOTLE-FIRST CONSTRAINT:
- Do NOT use Heidegger as the sole warrant for claims about what Aristotle himself holds.
- Do NOT collapse Aristotle's text into Heidegger's interpretation; preserve the distinction between Aristotle's position and Heidegger's reading of that position.

ADVISOR-RIGOR RULE (UTMOST PRIORITY):
- Daniel Gross is the dissertation advisor. ANY citation, quotation, or paraphrase of *Uncomfortable Situations* (2017) or *Heidegger and Rhetoric* (2005, Gross & Kemmann eds.) must be **perfectly verbatim** AND **contextually accurate**. Page numbers must be exact. Italics in quoted text must match Gross's original. Where uncertainty exists, mark the quotation `****** UNVERIFIED: <text>` so the user can verify against the PDF. Do NOT silently correct any Gross page number; do NOT silently re-italicize.

HEIDEGGER QUOTATION-PRESERVATION CONVENTION:
- Anything between LaTeX double-quote pairs in Heidegger citations **preserves his exact punctuation and italics verbatim**, including nested internal quotes (rendered via four backticks where Heidegger himself uses internal quote marks). Even where stylistically unusual in English, the punctuation and italics are preserved.

====================================================================
STYLISTIC CONSTRAINTS
====================================================================

- Lanham-tuned profile: avg ~31 words/sentence with periodic short-pivot variation; ~50% long sentences balanced by periodic short assertions; formality ~0.64.
- Author-prominent citations at ~99% rate. Introduce Aristotle (or Burke, Caston, Coope, Frede, Gibson, Gonzalez, Gross, Hawhee, Heidegger, Kisiel, Michalski, Nussbaum, O'Gorman, Pöggeler, Rickert, Struever, Uexküll, White) as agent BEFORE the quote: "Aristotle observes," "Aristotle argues," "Aristotle insists," "Aristotle writes," "Aristotle states," "Heidegger reads," "Heidegger develops," "Gross argues," "Rickert observes," "Nussbaum demonstrates."
- Transition vocabulary: *thus*, *specifically*, *indeed*, *accordingly*, *hence*. Do NOT use: *poignantly*, *strategically qualified*, *interestingly*, *it is worth appreciating*.
- Minimize meta-discourse: do NOT use "to reiterate," "before we can analyze," "I should clarify here," "as we have discussed."
- Block quotes only when load-bearing (the two *De Motu Animalium* quotes in Subsection 4 and the two BCAP quotes in Subsection 6 are load-bearing); extract decisive clauses and unpack them discursively elsewhere. Use `\begin{adjustwidth}{0.5in}{0in}` ... `\end{adjustwidth}` markup for block-quotes per the dissertation's existing convention.
- Em-dashes flush (no spaces): use `---` not ` --- `.
- Greek transliterations use Unicode macrons: `ē`, `ā`, `ī` (not LaTeX `\=e`).
- Greek-derived technical adjectives italicized: *phantastic*, *doxastic*, *kinetic*, *noetic*, *aisthētic*, *epithymetic*, *orectic*, *pathic*.
- Aristotle work titles use Latin/Greek standardized form: *De Anima* (NOT *On the Soul*); *De Motu Animalium* (NOT *Movement of Animals*); *De Insomniis* (NOT *On Dreams*); *De Memoria* (NOT *On Memory*); *De Sensu* (NOT *Sense and Sensibilia*).

====================================================================
VOCABULARY CONSTRAINTS — DO USE
====================================================================

(These coinages were established in §§1.0–1.4 and must be deployed consistently.)

- ***resonant kinēsis*** — the residual motion in the sensory apparatus that persists after the sensible object withdraws (italicized as a unit: `\textit{resonant kinēsis}`)
- ***resonant aisthēma*** — the formal-eidetic aspect of the residual motion (italicized as a unit)
- ***resonant epithymia*** — the affective-orectic aspect of the residual motion; the basic-orectic-charge residue deposited at A_1 (italicized as a unit)
- ***pathetic* loop** — the judgement-modifying recursive structure of pathos (NOT "pathos feedback loop"; that wording was retired 2026-05-24)
- **articulational concretion** — the axis along which generic *pathos* (basic hedonic tonality) becomes determinate higher-order *pathē*; the higher-order *pathē* are MORE-articulated forms of the same ontological structure, not categorically distinct kinds
- **dual-resonance thesis** — the thesis that A_1 deposits both formal-eidetic and affective-orectic residues simultaneously (NOT "dual-trace" — that wording was retired 2026-05-23)
- **content-conditional doxa-gate** — the rule that *doxa* alone is necessary but not sufficient for higher-order *pathē*; the *doxa*'s content must engage evaluatively complex categories
- **synchronic / diachronic register** — synchronic = single chain-pass within one event; diachronic = cumulative trajectory reshaping dispositional ground
- ***technē*-hexis** / ***praxis*-hexis** — Heidegger's BCAP §17 bivalent reading of *hexis*: training-reducing-deliberation vs holding-oneself-open
- **affective architecture of being-in-the-world** — the chapter's closing synthesis term for emotion's ontological function

DO USE (primary Aristotelian terminology):
- *aisthēsis*, *aisthēma*, *aisthēmata*, *aisthētikon*, *aisthētērion*, *aisthēton*
- *phantasia*, *phantasma*, *phantasmata*, *phantastikon*, *phantasia bouleutikē*
- *kinēsis*, *energeia*, *energeia ateles*, *dynamis*, *entelecheia*
- *pathos*, *pathē* (singular and plural; *pathē* defaults to higher-order)
- *alloiōsis*, *paschein*, *sōtēria*
- *hylē*, *eidos* (matter / form)
- *logos*, *logoi*
- *orexis*, *orektikon*, *epithymia*, *thymos*, *boulēsis*
- *doxa*, *kritikon*, *krisis*, *diakrisis*
- *hexis*, *hexeis*, *diathesis*
- *praxis*, *poiēsis*, *technē*, *phronēsis*
- *nous*, *noēsis*
- *psychē*, *archē*, *telos*, *ousia*
- *to kinoun*, *to kinoumenon*, *to orekton*, *to prakton agathon*

DO USE (Heideggerian German):
- *Bewegtheit* (NOT *Bewegung*) — being-moved
- *Befindlichkeit* — disposedness (Kisiel rendering; NOT "state-of-mind")
- *Stimmung* — attunement (Rickert rendering; NOT "mood" when serving ontological-atmospheric register)
- *Sorge* — care
- *Geworfenheit* — thrownness
- *Geschichtlichkeit* — historicity
- *Zeitlichkeit* — temporality
- *Ekstasen*, *Gewesenheit*, *Gegenwart*, *Zukunft*
- *Mitsein* — Being-with
- *Augenblick* — moment (only in Heidegger deferral footnote)
- *Da-sein* / Dasein — untranslated

====================================================================
VOCABULARY CONSTRAINTS — DO NOT USE
====================================================================

Retired terminology:
- "dual-trace" / "dual trace" / "dual residual trace" — use **dual-resonance**
- "resonant motion" / "resonant mood" / "resonant tonality" / "resonant trace" — use **resonant *kinēsis*** / **resonant *orexis*** / **resonant *aisthēma*** / **resonant *epithymia***
- "pathos feedback loop" — use ***pathetic* loop**
- "supervenient" / "supervenes on" — replace with substantive language ("operates orthogonally to," "is layered upon," "ratifies")
- "faculty of X" English formulations — use Greek faculty-names (*aisthētikon*, *orektikon*, *kritikon*, *kinētikon*, *phantastikon*)

Advisor-prose forbidden patterns:
- "The dissertation's claim ... rests on this structural reading"
- "X underwrites the [distinction] this chapter deploys"
- "X is necessary for Y to be the case" (as a meta-narrative claim)
- "The chapter's interpretive reading ..."
- "The present chapter's interpretive move"
- `\textit{Framing}:` or "Framing:" footnote prefixes
- "interpretive" qualifier on the author's own readings (just make the reading; don't announce it as interpretive)
- "supplies the [canonical/textual/philological] [anchor/ground/basis] for the X [reading/argument] [deployed here/articulated above]"
- Any meta-narrative phrasing that turns a sentence or footnote into a defense of "the chapter" / "the dissertation" / "the project"

Back-reference patterns:
- "§1.X has already developed/established..."
- "as established in §1.0..."
- "as we have seen at..."
- "this chapter" / "the chapter" — use "section" / "subsection" or, where appropriate, "Chapter 1" only when the chapter as a whole is the antecedent
- Inline "at *Work* [locus]" formulations — always work-in-narrative, locus-in-parens
- Where a prior section's claim must be invoked, just restate the claim with parenthetical citation (no announcement of where it was first developed)

Per-subsection-specific forbidden patterns:
- Do NOT re-introduce "the actualization chain" architecture (it was set up in §1.0 and is assumed). Each subsection's opener should engage its own thesis directly, not re-set-up the chapter context.
- Do NOT add prefatory paragraphs like "Having established X in the previous sections, we now turn to Y." Each subsection's job is to develop its own claim.
- Do NOT generate transitions between subsections inside the per-subsection output. Transitions are added by Claude in the coherence pass.
- Do NOT reference other subsections by number from inside the per-subsection output ("Subsection 4 will develop…"). Forward-references are added by Claude in the coherence pass.

Translation conventions:
- "potency" / "act" — use "potentiality" / "actuality" (with Greek *dynamis* / *energeia* in parens at first technical use)
- Aristotle's "now" in the technical sense (*to nun*) — wrap in single marks: `` `now' ``

LaTeX hygiene:
- No `\inlinenote{}` markers, working notes, TODO markers, or margin notes in the output
- No `\hl{}` highlighting in the output
- No spaced em-dashes ` --- `; use flush `---`
- No bare `\cite{}` calls; use `\autocite[locus]{key}` for biblatex authoryear (or, where bibkey is uncertain, fall back to standard parenthetical author-year-page form)
- All italics MUST be `\textit{X}` LaTeX, NEVER `*X*` Markdown. All bold MUST be `\textbf{X}`, NEVER `**X**`.
- Use `\footnote{...}` for ALL footnotes; never use bracketed `[N]` markers.

====================================================================
BEKKER CITATION LEDGER (use these exact Bekker references)
====================================================================

**Source-hierarchy reminder:** For each locus below, FIRST consult `tmp/Dissertation/verbatim_passages.md` for the PDF-verbatim quotation text. If not present, consult `corpus/index/Aristotle - Complete Works/phase05-offset-validation.md` for the Bekker→PDF page formula, then `corpus/rhetorical_ontology/Aristotle - <work>_(2014)_[*Copy].pdf`. NEVER generate quotation text from training-data recall when the locus is load-bearing.

DE ANIMA:
- I.1, 403a25–b19 — *pathē* of soul as enmattered accounts (hylomorphic definitions)
- I.4, 408b5–7 — "being pained or pleased, or thinking" as movements of ensouled being
- II.2, 413b24 — "Where there is sensation, there is also pleasure and pain"
- II.3, 414b1–6 — sensation entails pleasure/pain entails appetite (analytic entailment)
- II.5, 416b33–417a1 — sensation as movement and affection from without ("change of quality")
- II.5, 417a21–b7 — preservative *alloiōsis* / *sōtēria*
- II.12, 424a17–24 — wax-signet metaphor, reception of form without matter
- III.2, 425b23–26 — sensings and imaginings continue to exist in the sense-organs
- III.2, 425b26–27 — activity of sensible and of sense is one (one in substrate, two in being)
- III.2, 426a27–b8 — sense as ratio (*logos*)
- III.3, 427b14–428a18 — *phantasia* and *doxa* distinguished; sun-passage; bare *phantasia* leaves soul unaffected, *doxa* produces *euthys paschomen*
- III.3, 427b17–24 — *phantasia* voluntary, *doxa* not
- III.3, 427b21–24 — soul unaffected by *phantasia* alone; *euthys paschomen* with *doxa*
- III.3, 428a19–24 — *doxa* requires *logos*, *pistis*, *pepoíthēsis*
- III.3, 428b2–9 — sun-passage proving *phantasia* / *doxa* distinctness
- III.3, 428b10–17 — *phantasia* as movement produced by actual sensation
- III.3, 429a1–2 — *phantasia* as "a movement resulting from actual perception"
- III.3, 429a4–8 — *phantasia* from *phaos* (light); imaginations remain in organs
- III.7, 431a8–14 — perception is like bare asserting; pursues/avoids when object is pleasant/painful; perception and appetite one in substrate, different in being
- III.7, 431a14–17 — soul never thinks without an image
- III.9, 432a15–17 — soul of animals characterized by faculty of discrimination + faculty of locomotion
- III.9, 432b27–433a3 — speculative thought never says anything about object to be avoided or pursued
- III.10, 433a9–12 — appetite and thought as sources of movement; imagination as a kind of thinking
- III.10, 433a13–15 — speculative thought moves nothing; practical thought concerns the realizable good
- III.10, 433b10–18 — three-factor schema (unmoved originator: realizable good; moved-mover: faculty of appetite; that which is moved: animal)
- III.11, 434a5–10 — deliberative *phantasia bouleutikē* composes multiple *phantasmata*

PHYSICS:
- II.1, 192b20–23 — nature as principle of motion
- III.1, 201a10–14 — motion as *energeia ateles*
- III.2, 202a13–20 — single actuality of mover and movable
- IV.11, 219b1 — time as number of motion in respect of before and after
- V.1, 224b7–9 — motion takes its name from terminus

METAPHYSICS:
- V.1 (Δ.1), 1013a7–10, 1013a17–19 — *archē* (six senses, sense 4 load-bearing)
- IX.6, 1048b22–30 — *energeia* / *kinēsis* same-time vs incomplete activities
- IX.8, 1050b1–6 — priority of actuality (one actuality always precedes another in time)
- XII.6, 1071b6–11 — motion and time co-eternal
- Δ.20, 1022b4 — *hexis* as activity of haver and had; *hexis* as disposition for being well or ill disposed
- Δ.21, 1022b15–21 — fourfold of *pathos* (quality in respect of which a thing can be altered)

DE MOTU ANIMALIUM:
- 7, 701a7–16 — the practical syllogism: "every man ought to walk" / "I am a man" / straightaway one walks
- 7, 701a29–b1 — "I want to drink, says appetite; this is drink, says sense or imagination or thought: straightaway I drink"; "the actualizing of desire is a substitute for inquiry or thinking"
- 7, 701b16–32 — somatic effects (heating, cooling, trembling)
- 7, 702a17–19 — "the organic parts are suitably prepared by the affections, these again by desire, and desire by imagination"

DE INSOMNIIS:
- 2, 459a24–28 — affection persists in organs after object departs
- 2, 460b1–10 — the cowardly excited by fear sees foes approaching; the amorous by amorous desire sees the object; affective priming of recognition

RHETORIC:
- I.11, 1370a27–b1 — pleasure as weak perception attending memory and expectation; "the man who remembers and the man who hopes... will be attended by an imagination of what he remembers or hopes"
- II.1, 1378a21–22 — *pathē* as "judgement-modifying"; the *Rhetoric*'s canonical definition
- II.2, 1378a31–b5 — anger as definitionally arising from perceived slight
- II.5, 1382a21–22 — fear as "a pain or disturbance due to imagining some destructive or painful evil in the future"

DE ANIMA / NICOMACHEAN ETHICS / CATEGORIES (for *hexis*):
- *Categories* 8, 8b25–9a13 — *hexis* vs *diathesis*; *hexis* as more stable, longer-lasting; knowledge and virtue as paradigmatic *hexeis*
- *Nicomachean Ethics* II.1, 1103a14–b25 — moral excellence comes about as a result of habit; *ethos* / *hexis* etymological connection
- *Nicomachean Ethics* II.4, 1105a17–b13 — agent's condition (knowing / choosing / firm-and-unchangeable character) as condition of *excellence*-possession
- *Nicomachean Ethics* VI.5, 1140a24–b30 — *phronēsis* as "true and reasoned state of capacity to act with regard to the things that are good or bad for man"
- *Nicomachean Ethics* III.7, 1115b7–13 — courage and the regulation of fear under noble action
- *Nicomachean Ethics* VII.3, 1147a14–24, 1147a25–b3 — akrasia and the practical syllogism with opposed appetite

HEIDEGGER — BCAP (GA 18):
- §15e (pp. 104–107) — *doxa* as basis of theoretical negotiating
- §17 (pp. 119, 122–125, 127–128) — *hexis* as how-of-*pathos*; γένεσις of ἀρετή; no *technē* for the *kairos*; training reduces deliberation; *praxis*-hexis as holding-oneself-open
- pp. 131–132 — Heidegger's gloss of the four-senses fourfold (used at §1.2 / §1.4)
- pp. 133–134 — *pathē* not psychic experiences; being-taken of being-there in full being-in-the-world
- p. 110 — deliberative-oratorical *Mitsein* structure

HEIDEGGER — BT:
- §29, H.135–137 (Eng.~pp.~172–176) — *Befindlichkeit* / *Stimmung* / *Geworfenheit*; "A mood assails us. It comes neither from 'outside' nor from 'inside', but arises out of Being-in-the-world"
- §32, H.150 (Eng.~p.~191) — fore-having / fore-sight / fore-conception
- §65, H.328–329 (Eng.~pp.~377–378) — originary temporality; three ecstases; future as primary; equiprimordiality
- §74, H.385–386 (Eng.~p.~437) — *Geschichtlichkeit*; ecstatico-horizonal unity of raptures

SECONDARY:
- Caston, 1996 — *aisthēma* as direct effect of sensory stimulation; *doxa* as ratification of *phantasma*
- Coope, *Time for Aristotle*, pp. 160, 162 — time as mind-dependent in a way change is not
- Frede, "The Cognitive Role of *Phantasia* in Aristotle," pp. 282–285 — residual motion has a life of its own
- Gibson, *Ecological Approach to Visual Perception*, pp. 45–46, 119–120 — ambient optic array; affordance complementarity
- Gonzalez, 2006, pp. 126–127 — orator-*phantasia*-lexis-*skhēmata*-pathos chain
- Gross, *Heidegger and Rhetoric*, pp. 4, 26 (verbatim verified per §1.4 audit) — anti-internalist social-ontology
- Gross, *Uncomfortable Situations*, pp. 3, 20 (verbatim verified per §1.4 audit) — rhetoric as humanistic affordance theory
- Hawhee, *Looking Into Aristotle's Eyes*, p. 145; "Rhetorical Vision," p. 152 — phantasmatic capacity in rhetorical persuasion; phantasia as graft onto direct perception
- Heidegger, FCM (GA 29/30), p. 67 — *Stimmung* as atmosphere
- Nussbaum, *Fragility of Goodness* (and *MA* commentary) — *phantasia* as supplier of material for practical reasoning; *phantasia* as interpretation grafted onto direct perception (1985, p. 265)
- O'Gorman, "Aristotle's *Phantasia* in the *Rhetoric*," pp. 25, 31, 34 — *phantasia* forms objects of belief and desire; corporate phantasmata; epideictic-as-affective-ground
- Rickert, *Ambient Rhetoric*, pp. 131, 146, 243–244, 285 — *Stimmung* as attunement; disclosure / withdrawal; rhetorical being-in-the-world
- Struever, in *Heidegger and Rhetoric* (Gross & Kemmann eds.), pp. 109–110, 117, 287 — *Da*-character; *Veränderlichkeit*; GA 18 reading
- Uexküll, *A Foray into the Worlds of Animals and Humans*, pp. 97, 99 — hermit-crab / *Wirkton*
- White, "The Meaning of *Phantasia* in Aristotle's *De Anima*, III, 3–8," p. 498 — residual motion as lingering, resonating, echoing presence
- Withy, 2023, p. 3 — Heideggerian anti-internalism

====================================================================
FORBIDDEN DEPLOYMENTS (general)
====================================================================

**v1 RUN FAILURE PATTERNS — DO NOT REPEAT** (these are concrete patterns from the failed 2026-05-24 first run; all are spec violations):
- **Three-types typology**: USE "Simple appetition / Habitual-rational / Evaluatively complex". DO NOT use "Pathē-driven / Hexis-formed / Logos-guided" (the v1 run substituted a structurally inconsistent schema).
- **Voice failures**: NEVER use "the user", "the reader", or any direct address to an audience. This is academic monograph prose, not user-facing documentation.
- **Citation format**: NEVER write `(Aristotle 2014, *On The Soul (De Anima)*, p. [PAGE NEEDED])`. Aristotle = Bekker notation only. The work title is `*De Anima*`, never "On The Soul".
- **Markdown vs LaTeX**: All italics MUST be `\textit{X}` LaTeX, NEVER `*X*` Markdown. All bold MUST be `\textbf{X}`.
- **Phantom quotations**: NEVER fabricate quotation text. Every quotation MUST come verbatim from `verbatim_passages.md`, a corpus chunk, or the corpus PDF via the source-hierarchy above.
- **Numbered endnote refs**: Use `\footnote{...}` for ALL footnotes; never use bracketed `[N]` markers.

- Do NOT use Heidegger as the sole or primary warrant for a claim about Aristotle's own doctrine; Aristotle must be cited first for Aristotle.
- When you deploy Heidegger in the main body, explicitly mark his contribution as an interpretation of or perspective on Aristotle ("Heidegger reads Aristotle as ..."), unless the claim is explicitly Heideggerian.
- Gross's *Uncomfortable Situations* and *Heidegger and Rhetoric* are advisor-priority sources: verbatim accuracy and page-number precision are non-negotiable.
- Do NOT use Barnes page numbers for Aristotle — Bekker notation only.
- Do NOT redevelop §§1.0–1.4 material at length; refer back via canonical Bekker citations where needed.
- Do NOT include working notes, margin notes, `\inlinenote{}` markers, TODO markers, or `\hl{}` highlights in the output.
- Do NOT use register-inflated adverbs: "poignantly," "strategically qualified," "interestingly," "it is worth appreciating."
- Do NOT use meta-discourse: "to reiterate," "as we have discussed," "I should clarify here," "before we can analyze."
- Do NOT generate auto-injected sections titled "Claim Map," "Quotation Ledger," "Citation Ledger," "Validation Summary" as part of the main body.
- Do NOT create section headings from quoted Aristotelian clauses or from the supplementary evidence pack below.
- Do NOT preemptively tackle the deferred V1 capstone items (quotation verbatim verification against PDFs; biblatex migration). Those belong to the final V1 capstone pass.
- Do NOT use "supplies the canonical / textual / philological anchor for" phrasing; just state what the source says and how it bears on the claim.
- Do NOT use the phrase "underwrites" in any meta-narrative function ("X underwrites the distinction Y"); replace with substantive language ("X grounds Y," "X is the textual warrant for Y," "X is consistent with Y").
- Do NOT use the phrase "the dissertation's claim ... rests on ...". State the claim and the textual warrant directly.

====================================================================
SOURCE A — Aristotle direct deployments (full set, filter to subsection-relevant)
====================================================================

*De Motu Animalium 7, 701a29–b1* (Subsection 4(a) load-bearing block-quote):
> "And so what we do without reflection, we do quickly. For when a man is actually using perception or imagination or thought in relation to that for the sake of which, what he desires he does at once. For the actualizing of desire is a substitute for inquiry or thinking. I want to drink, says appetite; this is drink, says sense or imagination or thought: straightaway I drink. In this way living creatures are impelled to move and to act, and desire is the last cause of movement, and desire arises through perception or through imagination and thought. And things that desire to act make and act sometimes from appetite or impulse and sometimes from wish."

*De Motu Animalium 7, 701a7–16* (Subsection 4(b) load-bearing block-quote):
> "But how is it that thought is sometimes followed by action, sometimes not; sometimes by movement, sometimes not? What happens seems parallel to the case of thinking and inferring about the immovable objects. There the end is the truth seen (for, when one thinks the two propositions, one thinks and puts together the conclusion), but here the two propositions result in a conclusion which is an action---for example, whenever one thinks that every man ought to walk, and that one is a man oneself, straightaway one walks; or that, in this case, no man should walk, one is a man: straightaway one remains at rest. And one so acts in the two cases provided that there is nothing to compel or to prevent."

*De Anima III.10, 433b10–18* (Subsection 3 backbone):
> "It follows that while that which originates movement must be specifically one, viz. the faculty of appetite as such (or rather farthest back of all the object of that faculty; for it is it that itself remaining unmoved originates the movement by being apprehended in thought or imagination), the things that originate movement are numerically many. All movement involves three factors, (1) that which originates the movement, (2) that by means of which it originates it, and (3) that which is moved. The expression 'that which originates the movement' is ambiguous: it may mean either something which itself is unmoved or that which at once moves and is moved. Here that which moves without itself being moved is the realizable good, that which at once moves and is moved is the faculty of appetite (for that which is moved is moved insofar as it desires, and appetite in the sense of actual appetite *is* a kind of movement)."

*De Anima III.3, 429a1–2* (Subsection 2 anchor):
> *Phantasia* is "a movement resulting from actual perception."

*Rhetoric I.11, 1370a28–30* (Subsection 2 anchor):
> "Both the man who remembers and the man who hopes will be attended by an imagination of what he remembers or hopes."

*De Insomniis 2, 460b1–10* (Subsection 7 diachronic anchor):
> "even when the external object of perception has departed, the impressions it has made persist, and are themselves objects of perception; and let us assume, besides, that we are easily deceived respecting the operations of sense-perception when we are excited by emotions, and different persons according to their different emotions; for example, the coward when excited by fear, the amorous person by amorous desire; so that, with but little resemblance to go upon, the former thinks he sees his foes approaching, the latter, that he sees the object of his desire; and the more deeply one is under the influence of the emotion, the less similarity is required to give rise to these impressions."

====================================================================
SOURCE B — Heidegger BCAP §17 (load-bearing in Subsection 6)
====================================================================

*BCAP p. 127* (training reduces deliberation):
> "Through practice, by frequently-undergoing, it comes about that being-oriented puts the prescription further and further out of play. Training has the precise sense of reducing deliberation insofar as it is through training that the completedness of attaining a result comes about."

*BCAP p. 128* (*praxis*-hexis as holding-oneself-open):
> "Cultivating *hexis* never depends on an operation, a routine. In an operation, the moment is destroyed. Every completedness, as settled routine, breaks down in the face of the moment. Appropriation and cultivation of *hexis* through habituation means nothing other than correct repetition.... The distinction lies in the fact that *praxis* depends on the *how*. The how is only appropriated in such a way that the human being enables himself *to be composed at each moment*; not routine but holding-oneself-open, *dynamis* in the *mesotēs*."

*BCAP p. 125* (*hexis* as how-of-*pathos*):
> "*Hexis* is nothing other than a how of *pathos*, being-out-of-composure, in relation to being-composed-as-to . . . Insofar as we can define *hexis* according to its basic structure, we will also clarify the possible-structure of *pathē*."

*BCAP pp. 122–123* (no *technē* for the *kairos*):
> "For this determination should not be conceived as though there were a *technē* for this taking-opportunities and venturing-out into the *deina* of life."

*BCAP pp. 133–134* (anti-internalism, Subsection 8 closing):
> *pathē* are "not psychic experiences and not in consciousness" but "a being-taken of human beings *in their full being-in-the-world*."

====================================================================
SOURCE C — Heidegger BT (load-bearing in Subsections 7 and 8)
====================================================================

*BT §29, H.137 (Eng.~p.~176)* — *Stimmung* as ontological-atmospheric:
> "A mood assails us. It comes neither from `outside' nor from `inside', but arises out of Being-in-the-world, as a way of such Being."

*BT §74, H.385–386 (Eng.~p.~437)* — *Geschichtlichkeit* as ecstatic-horizonal:
> "As historical, Dasein is possible only by reason of its temporality, and temporality temporalizes itself in the ecstatico-horizonal unity of its raptures."

*FCM (GA 29/30), p. 67* — *Stimmung* as atmosphere:
> "[*Stimmung* is] like an atmosphere in which we first immerse ourselves in each case and which then attunes us through and through."

====================================================================
SOURCE D — Secondary touchstones (Subsection 2 integration)
====================================================================

- O'Gorman ("Aristotle's *Phantasia* in the *Rhetoric*," p. 34): *phantasia* "forms the objects of belief and desire, even gives birth to belief and desire and provides the images that are the objects of deliberative desire, ethical choice, and political judgment."
- Hawhee (*Looking Into Aristotle's Eyes*, p. 145): rhetor's task is to "supply images concrete, narrative, and affectively charged enough to allow the audience to see what the rhetor wants them to see."
- Nussbaum (*Fragility of Goodness*; *MA* commentary): *phantasia* as material-supplier for practical reasoning; the *phantasia* operated upon by deliberative reasoning synthesizes alternatives into unrealized possibilities and measures them against a single standard.
- White ("The Meaning of *Phantasia*," p. 498): residual motion as "lingering, resonating, echoing presence of sensible forms freed from their original matter."
- Frede ("The Cognitive Role of *Phantasia*," pp. 282–285): residual motion has "a life of its own"; *phantasma* produced while sense-perception still in operation.

====================================================================
SOURCE E — Gross (advisor verbatim quotes; audit-verified against PDFs in §1.4 walkthrough 2026-05-24)
====================================================================

These four Gross quotations have been verified verbatim against the source PDFs. **For any subsection whose delta file lists Gross as a deployment target, you MUST deploy the listed Gross quotes verbatim — do NOT paraphrase, do NOT silently re-italicize, do NOT silently correct page numbers.** The delta file specifies which of the four quotes to deploy in that subsection.

*Gross, "Introduction: Being-Moved: The Pathos of Heidegger's Rhetorical Ontology," in* Heidegger and Rhetoric *(ed. Gross & Kemmann, SUNY, 2005), p. 4* (anti-internalist anchor — load-bearing for any claim that *pathos* grounds *logos*):
> "Heidegger characterizes *pathos* (variously 'passion,' 'affect,' 'mood,' or 'emotion') as the very condition for the possibility of rational discourse, or *logos*. No cynical and crowd-pleasing addition to *logos*, *pathos* is the very substance in which propositional thought finds its objects and its motivation. Without affect our disembodied minds would have no heart, and no legs to stand on."

*Gross, "Introduction," in* Heidegger and Rhetoric *(2005), p. 26* (translating GA 18, 206–207; enmattered-*eidos* thesis):
> "the *eidos* of fear draws primarily upon a body's condition. The difference lies in the fact that the particular condition of the body (being, say, brown or scratched) plays no role in mathematical inseparability, while for the *pathe* Being in such and such a condition is essential. Both are *logoi enyloi*, but in quite different senses of the term... The *eidos* of the *pathe* is a disposition toward other humans, a Being-in-the-world."

*Gross,* Uncomfortable Situations *(Chicago, 2017), p. 3* (Aristotle as social-phenomenon humanism):
> "Aristotle's *Rhetoric* offers alternatives for understanding emotions as social phenomena, which is something that leading humanists like Martha Nussbaum and Richard Sorabji should have remembered as they rushed toward the latest brain science."

*Gross,* Uncomfortable Situations *(Chicago, 2017), p. 20* (rhetoric-as-affordance-theory; load-bearing for Subsection 8 close):
> "Rhetoric, as a humanistic form of affordance theory, posits a situation that is not neutral but is rather 'persuasive,' threatening and promising with respect to our human being-in-the-world."

**Bonus Heidegger epigraph from Gross's editor-Introduction (SUNY 2005, p. 1):**
> "the self-elaboration of Dasein is expressly executed" (Heidegger, SS 1924, GA 18.110, epigraph in Gross ed., *Heidegger and Rhetoric*, p. 1)

====================================================================
GENERIC POST-GENERATION SELF-AUDIT (apply before output)
====================================================================

Before producing the final draft for this subsection, mechanically check:

- **Heading**: the output contains EXACTLY the subsection heading specified in the delta file (using `\subsubsection*{}` for §§1–8 or `\subsection*{}` for the Development Note). No other section headings.
- **No preamble**: no `\documentclass`, no `\usepackage`, no `\begin{document}`, no `\end{document}`.
- **Word count**: within ±15% of the per-subsection target specified in the delta file.
- **Bekker compliance**: every Aristotle citation uses Bekker notation; no Barnes page numbers; no PDF page numbers.
- **BT/BCAP full-citation compliance**: every BT citation uses `(BT \S<n>, H.<page>; Eng.~p.~<page>)`; every BCAP citation uses `(BCAP p.~<n>)`.
- **Gross advisor-rigor**: every Gross citation has exact page number; every quoted phrase is verbatim or flagged `****** UNVERIFIED:`.
- **Coinage compliance**: *resonant kinēsis*, *resonant aisthēma*, *resonant epithymia* italicized as units; *pathetic* loop (not "pathos feedback loop"); dual-resonance (not "dual-trace"); articulational concretion; content-conditional doxa-gate.
- **Work-titles**: *De Anima*, *De Motu Animalium*, *De Insomniis*, *De Memoria*, *De Sensu* — never the English equivalents in user prose (translator's English preserved in direct quotations only).
- **Em-dash hygiene**: flush `---`, no spaces.
- **Greek accents**: Unicode macrons `ē`, `ā`, `ī`; not LaTeX `\=e`.
- **Author-prominent introduction**: 99% of citations introduce the author before the quote.
- **Work-in-narrative / locus-in-parens**: every reference uses the canonical pattern.
- **No back-references**: no "§1.X has already developed/established"; restate claims with parenthetical citation where needed.
- **No forward-references to other subsections**: do not say "Subsection N will develop…"; transitions will be added by Claude in the coherence pass.
- **No subsection-internal preamble that re-establishes the chapter context**: open with the subsection's own substantive thesis.

The subsection-specific delta file follows.

====================================================================
END OF SHARED PRELUDE — delta file begins below
====================================================================
