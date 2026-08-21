# Part II — Diagnostic Report, Pass 1 (Pre-Rewrite)

*Generated 2026-06-30. Author: analytic pass over the five Part II sections as they stand, in assembly order: (1) Metaphysics — *What Are Virtual and Phantasmic Things?*; (2) Methodology — RODA DRAFT-v3; (3) Analysis Introduction; (4) G&G Chapter; (5) RDR2 Tutorial Chapter. This report supersedes and extends the earlier `DIAGNOSTIC-REPORT-2026-06-30.md` (preserved untouched): it (a) independently re-verifies that report's findings against the source texts, (b) adds **Lanham style analytics** across all five sections against the Part I voice fingerprint, (c) adds a **PDF-grounded citation-verification audit** of every flagged and load-bearing quotation, and (d) sharpens the cross-cutting flow analysis. It is written as an actionable blueprint: every finding maps to an edit that the combined rewrite (`Part-II-COMBINED-v1-2026-06-30.md/.tex`) implements. **No original files are modified.***

---

## 0. Method of this diagnostic

- **Read in full:** all five sections (≈26,800 words of draft prose).
- **Lanham analytics:** ran `tmp/analyze-style-lanham.ts` (the same 15-axis analyzer used for the Part I fingerprint) on the Part I voice target (§1.5 *Three Types of Action*-v3) and on all five Part II sections. Results in §I.
- **Citation verification:** extracted text from the actual corpus source PDFs (`pdftotext`) and located each flagged or weight-bearing quotation, recording verbatim accuracy and page. Results in §II.
- **Concurrence with the prior report:** I read the prior `DIAGNOSTIC-REPORT-2026-06-30.md` and checked each of its claims against the drafts. I **concur** with essentially all of its section-level findings; below I restate the load-bearing ones compactly and mark where I **add**, **sharpen**, or **diverge**.

---

## I. LANHAM STYLE ANALYTICS

The user's directive: confirm that the whole chapter *except the metaphysics* (which is deliberately its own register) holds the Part I tone and style. Target = Part I §1.5-v3 (the most agent-prominent, "figured-but-plain" chapter, the voice the analysis chapters are meant to mimic).

### A. The numbers (same analyzer, all six files)

| Metric | **Part I (target)** | Metaphysics¹ | Methodology | Intro | **G&G** | **RDR2** |
|---|---|---|---|---|---|---|
| avg sentence length | **27.0** | 30.2 | 30.1 | 29.3 | 26.5 | **18.3** ⚠ |
| short (<15 w) ratio | 0.271 | 0.115 | 0.264 | 0.175 | 0.287 | **0.481** ⚠ |
| long (>30 w) ratio | 0.416 | 0.432 | 0.406 | 0.437 | 0.371 | **0.191** ⚠ |
| nounVerbRatio | 0.636 | 0.718 | 0.648 | 0.649 | 0.757 | **0.818** ⚠ |
| nominalizationDensity /100w | 6.19 | 4.17 | 5.92 | 5.55 | 3.64 | **2.84** ⚠ |
| prepositionalPhraseDensity | 3.71 | 3.57 | 3.43 | 4.11 | 2.98 | **1.86** ⚠ |
| beVerbRatio | 0.163 | 0.149 | 0.218 | 0.159 | 0.141 | 0.156 |
| parataxis/hypotaxis | 0.444 | 0.421 | 0.330 | 0.288 | 0.307 | 0.376 |
| periodic/running | 0.663 | 0.410 | 0.659 | 0.595 | 0.721 | 0.746 |
| voiceScore | 0.314 | 0.447 | 0.265 | 0.384 | 0.329 | 0.389 |
| dynamicRange | 0.498 | 0.474 | 0.837 | 0.508 | 0.614 | 0.684 |
| latinate/Germanic | 0.158 | 0.180 | 0.103 | 0.155 | 0.066 | 0.071 |
| opacityScore | 0.694 | 0.727 | 0.702 | 0.755 | 0.659 | 0.604 |
| chiasmus / 1k words | 12.8 | 31.0 | 5.3 | 10.3 | 3.6 | **1.8** ⚠ |
| antithesis / 1k words | 5.3 | 1.4 | 4.4 | 3.3 | 5.5 | 6.0 |
| climax / 1k words | 5.5 | 4.1 | 4.4 | 6.0 | 4.5 | **8.6** |

¹ Metaphysics is *expected* to diverge (its own register) and is reported for reference only; it is **not** a remediation target.

### B. Findings

**B1 — The RDR2 Tutorial is the one clear style outlier, and the divergence is systematic, not local. [HIGH PRIORITY]**
Its average sentence (18.3 w) is ~⅓ shorter than the Part I target (27.0) and than its sibling G&G chapter (26.5). **Nearly half (48%) of its sentences run under 15 words** (Part I 27%, G&G 29%); only 19% exceed 30 words (Part I 42%, G&G 37%). Nominalization (2.84) and prepositional density (1.86) are roughly half the target's, and chiasmus — a signature Part I figure — is almost absent (1.8/1k vs Part I 12.8). The register has drifted into **clipped, punchy, fragment-heavy journalism**: one-clause declaratives and verbless fragments ("Twenty-nine seconds." / "The controller arrives second." / "The motive is pre-assigned." / "It begins with the name." / "The rails come off."). This is effective in spots but is *not* the long-breathed, hypotactic, chiastic Part I voice.
- The irony is on the page: the RDR2 draft's **own header claims** "85% Germanic, ~31w avg sentence, dynamic range 0.90." The Germanic figure is right (93%), but the measured sentence length is **18.3**, not 31 — the chapter *aspires* to the voice it does not yet instantiate.
- **This both confirms and quantifies** the prior report's qualitative cross-cutting note ("voice variation between G&G and RDR2"). It is more severe than that note implied: it is the whole chapter, not just the Colter/Heist sections.
- **Remediation (implemented in the rewrite):** a register pass that (i) fuses adjacent short declaratives into periodic/running sentences with trailing modifiers; (ii) converts ~⅓ of the verbless fragments into full clauses or subordinated openers; (iii) reintroduces chiasmus/antithesis at the section hinges; (iv) preserves a *few* deliberate short punches (the chapter's drumbeat is part of its rhetoric) but at G&G's density, not double it. Target: avg sentence → ~24–26, short-ratio → ~0.30, chiasmus → ~6–10/1k. The aim is convergence toward G&G/Part I, not erasure of the chapter's energy.

**B2 — G&G is the closest match and is the correct internal model.** It matches Part I on sentence length (26.5) and architecture; it is even *more* Germanic (93% vs 84%) and a touch more verbal (nounVerbRatio 0.757) — i.e. very slightly plainer/more Saxon than Part I body prose, which is exactly the intended "figured-but-plain" register. **No remediation needed**; it is the calibration reference for the RDR2 pass.

**B3 — Methodology and Introduction sit within tolerance of the target.** Methodology is the most "effaced/academic" (voiceScore 0.265, dynamicRange 0.837) — appropriate for a methods chapter — and matches Part I on length, nominalization, and noun/verb balance. The Introduction's only notable spike is `selfConsciousnessScore` 0.572 (vs Part I 0.10), driven by its first-person framing moves ("I believe we need to make a distinction," "For me, ecology represents…," "named in the present terms"). This is the author's own voice and is *not* a defect, but it is the section that most "talks about itself"; the rewrite leaves the voice intact and only trims two or three of the most overtly meta phrasings where they add nothing.

**B4 — Metaphysics confirmed as its own register (correctly).** Most periodic of all sections (periodic/running 0.410 — lots of front-loaded suspension), highest voiceScore (0.447), highest chiasmus density (31/1k). This is the dense, periodic, philosophical register the user intends. **Left as-is stylistically.**

---

## II. CITATION-VERIFICATION AUDIT (PDF-grounded)

Every item below was checked against the actual corpus source PDF.

### A. Verified EXACT (wording correct; safe to keep)

| Quotation (short) | Cited as | PDF verdict |
|---|---|---|
| "they project themselves into a space, becoming inscribed there…producing that space itself" | Lefebvre 129 | **EXACT** (Production of Space) |
| "outside the prior and ongoing structures of feeling that shape the social field" | Edbauer 10 | **EXACT** |
| "persuasion gains its bearings from an affectability…both prior to and alongside the human" | Rickert 254 | **EXACT** ("our," not "with out" — prior fix confirmed) |
| "That world of everyday Dasein which is closest to it, is the environment" | BT 94 | **EXACT** ("closest," not "closet" — prior fix confirmed) |
| "the absorption of a virtual environment into consciousness, yielding a sense of habitation…" | Calleja, In-Game 169 | **EXACT**, lands on p.169 |
| "incorporation is ultimately a metaphor like presence or immersion" | Calleja 3 | **EXACT**, p.3 |
| "he is both joined and separate…an individual locus of motives" | Burke, *Rhetoric*, 21 | **EXACT**, p.21 |
| "substance…was an act; and a way of life is an acting-together" | Burke, *Rhetoric*, 21 | **EXACT**, p.21 |
| "Identification is compensatory to division" | Burke, *Rhetoric*, 22 | **EXACT**, p.22 |
| "in banishing the term, far from banishing its functions one merely conceals them" | Burke, *Grammar*, 21 | **EXACT**, p.21 |
| pentad: "what was done (act), when or where it was done (scene)…" | Burke, *Grammar*, xv | **EXACT**, p.xv |
| "the essential co-disclosedness of space" | BT 145 | **EXACT**, English p.145 |
| "the characteristic absorption of concern in its equipmental world" | BT 405 | **EXACT**, English p.405 |

**Important corollary — BT pagination is consistent.** I had flagged a risk that the methodology cited Heidegger by German H-pagination (BT 145/160) while the Introduction used English (BT 94). **Resolved: all BT citations use the English Macquarrie–Robinson pagination consistently** ("co-disclosedness of space" is on English p.145; "environment" on English p.94; "absorption of concern" on English p.405). This is *not* a defect. (Keep an eye on it only when Part-I cross-references are spliced in, since Part I may cite Bekker/German for other texts.)

**The "two p.21s."** The single most error-prone spot in the whole apparatus: **Burke *Grammar* p.21** holds the *concealment* quote ("in banishing the term…"), while **Burke *Rhetoric* p.21** holds the *consubstantiation* quotes ("both joined and separate," "a way of life is an acting-together"). Two different books, same page number, adjacent concepts. This is exactly why the error below is easy to make — and why the fix must be done by *meaning*, not by find-replace on "21."

### B. ERRORS / fixes required

| # | Location | Problem | Fix |
|---|---|---|---|
| **C1** | RDR2 Heist (§Heist): "a way of life is an acting-together (Burke, *Grammar*, 21)" | **Wrong work.** The acting-together quote is *Rhetoric* 21 (verified); *Grammar* 21 is the concealment quote. | → `(Burke, *Rhetoric*, 21)` |
| **C2** | Intro §From Presence to Incorporation: presence "acts on our sensibility" (116) | **Dropped word.** Perelman & Olbrechts-Tyteca write "acts **directly** on our sensibility." | → "acts directly on our sensibility" |
| **C3** | RDR2 Leash: "This is Rickert's recalcitrance: the world 'pushes back'…(Rickert, *Ambient Rhetoric*, 199)" | **(a)** "pushes back" is **not** a verbatim Rickert quote (no such phrase in the book); the quote marks are unwarranted. **(b)** "recalcitrance" is **Burke's** concept, which Rickert *discusses* (it appears at Rickert 254/259, not 199). | Drop the quote marks (make "pushes back" the author's paraphrase); re-attribute recalcitrance to Burke (Rickert discussing Burke), or cite Rickert's *resistant-world* discussion at the correct page. The rewrite recasts it as: *the designed world resists — what Burke called the recalcitrance of the situation, the scene refusing the agent's free movement-impulse…* with Rickert cited for the ambient-resistance idea at a verified page. |
| **C4** | Intro: immersion as "concernful absorption" (BT 146) | Phrase is authentic Heidegger, but in the M&R text "concernful absorption" sits at English ~p.101 and ~268, **not 146**. Likely a page slip. | Verify and correct the page (probably the "absorption of concern in its equipmental world," BT 405, or the ~101 instance); flagged for the final citation pass. Low risk. |

### C. Watch-items (not errors, but normalize in the unified document)

- **Citation-format heterogeneity (the document's biggest cosmetic problem).** Five sections, ~three conventions: metaphysics uses LaTeX `\cite{chalmers2017}`/biblatex; methodology + intro + G&G + RDR2 use inline `(Author, *ShortTitle*, Page)`; the intro additionally uses bare-key shorts (`GoM 57`, `RoM 43`, `ISPR par. 2`, `OED`). **The combined document normalizes everything to `(Author, *ShortTitle*, Page)`** (e.g. `\cite{chalmers2017} 317` → `(Chalmers, "The Virtual and the Real," 317)`; `GoM 57` → `(Burke, *Grammar*, 57)`; `RoM 43` → `(Burke, *Rhetoric*, 43)`). This also lets the `.tex` compile with a single XeLaTeX pass (no biber).
- **Aristotle by Bekker** throughout (metaphysics already does: 417a21–b2, 428b, 431a16–17); keep.
- **ISPR par. 2 / OED / Heim 220 / Latour 373 / Gries 74–75 / Veri(dis)similitude 9** — per the intro's own header these were verified at source 2026-06-28 (drawn from the MA PDF and corpus); not re-checked here. Trust but include in the final marathon pass.

---

## III. SECTION-BY-SECTION DIAGNOSTICS

For each section I list the load-bearing weaknesses to fix in the rewrite. Where the prior report already stated a point and I verified it, I mark **[concur]**; new or sharpened points are marked **[add]** / **[sharpen]**.

### 1. Metaphysics — *What Are Virtual and Phantasmic Things?*

**Strengths (keep):** the Aristotelian first/second-actuality frame as the genus of virtual+phantasmic; the two-HMD counterexample against Chalmers; the resonant/phantasmic parallel; the closing "data-discrepancy as the axis" bridge.

- **M1 [concur, P-urgent] — The `\inlinenote{}` Gestell placeholder must go.** The orange-boxed "Follow-up, to develop later…" note (after the D-Day limit-case paragraph) is a visible drafting artifact. The rewrite **removes it** and folds its one usable forward-pointer (total verisimilitude forecloses rupture → the inauthenticity risk is the *foreclosed rupture*, not the virtuality) into a single clean sentence at the end of that paragraph, since the disruption chapters cash exactly this out.
- **M2 [sharpen, P-high] — The HMD restriction technically excludes the dissertation's own screen-based case (RDR2).** "Virtual reality" is defined via "Head Mounted Displays (HMD) and handheld controllers," and the entire ontology rides on HMD-mediation. But RDR2 is a flat-screen game. **The rewrite adds a short paragraph** (in §"The Three Kinds of Thing") generalizing the mediating device: the HMD is *one* instance of the renderer-plus-display that actualizes a digital object into a perceptible virtual object; a monitor is another. The structure (digital object → renderer → perceptible virtual object) is invariant; what varies across devices is the **data-discrepancy**, which is precisely the axis the section already builds. This *uses* the section's own concept to close the gap rather than bolting on a new claim.
- **M3 [add, P-high] — Coin "phantasia-load" here.** The analysis chapters lean continuously on "high-/low-phantasia-load" and "the 2D pole / VR pole" as if established terms, but the metaphysics names only "data discrepancy" and says "*phantasia* fills the gap." **The rewrite adds one sentence** at the data-discrepancy close that explicitly names the experiential converse of data-discrepancy as *phantasia*-load (the smaller the data a medium supplies, the more the perceiver's image-making must contribute), so the term the analyses use is actually minted where it belongs. This is the single highest-leverage conceptual stitch between the metaphysics and the two case studies.
- **M4 [sharpen] — Promote the orectic-charge disanalogy out of the footnote.** The claim that the resonant trace "carries an orectic charge — it *matters* — that no data structure possesses" is the hinge between the metaphysics and the RODA chain's orectic structure (A₁'s resonant *epithymia*, A₂'s desire-laden *phantasma*). It currently lives in footnote 12. The rewrite lifts the core sentence into the body of §"What is a Phantasmic Thing" (keeping the longer caveat in the note).
- **M5 [concur, but re-scoped] — The Chalmers/Kim apparatus is over-built relative to downstream use.** The prior report says "condense or use it." I **sharpen**: the *data-discrepancy* half of the metaphysics is used heavily downstream (it *is* the 2D/VR axis); the *Chalmers-rebuttal* half (digital-vs-virtual-object identity, the two-HMD argument, Kim's explanatory exclusion) is never re-invoked in the analyses. Rather than cut good philosophy, the rewrite adds **one downstream hook**: a clause in the disruption readings noting that when the apparatus fails (headset slips, program crashes) the event happens *to the digital object* while the *virtual object* the player inhabited simply ceases — which is the digital/virtual distinction doing live work. Minimal, and it pays off the investment. (A deeper trim is left as an optional editorial decision flagged for the author, not executed, since it's a judgement call about the chapter's ambitions.)
- **M6 [add] — Define "resonant kinēsis" in situ.** It is introduced in the body (and a footnote points "back to Part I"). Since Part II should be followable without Part I to hand, the first body use gets a five-word appositive gloss. (Already half-done in fn 12; surface it.)

### 2. Methodology — RODA DRAFT-v3

**Strengths (keep):** the diachronic/ontological/rhetorical tripartition; the producing-art/using-art partition (the cleanest original move); the explicit preserve/transform/elevate sublation of Calleja and Burke; the world-/co-disclosedness naming with BT 145/160; the "blind to each other" convergence argument.

- **MM1 [concur, P-high] — *Bia* is absent from the method that authorizes it.** "*Bia*" is a primary analytical instrument in *both* case chapters (bia-cinematic / soft / suffered / inflicted / de-inverted), yet it is never defined in the methodology. **The rewrite adds a short paragraph** in the chain-description: *bia* (βία) is the **exception** to the orektikon motion (M₃→A₄) — it fires when the agent's *orexis* is opposed by external force rather than consummated, inverting agent into patient — and names its five forms with one-clause glosses. This is the single highest-impact methodological edit in the whole project.
- **MM2 [concur, P-high] — The hexis type-distinction (technē-hexis vs ethical hexis) is missing.** The RDR2 chapter's entire spine is the "dual hexis." The methodology uses *hexis* generically. **The rewrite adds one sentence** to the A₄→A₀′ sedimentation description: deposits bifurcate — skill-craft settles as *technē*-hexis, morally-weighted choice as ethical *hexis* — two strands of one sediment, not two chains.
- **MM3 [concur] — Bring the R1–R7 criteria into the body.** They are the empirical gauge that turns the union-claim from assertion into verdict (achieved / partial / merely-involved / ruptured), and both analyses invoke "R3 simultaneity," "R4 the spatial-kinesthetic cornerstone." The footnote stays, but the body gets one sentence naming what R1–R7 *are for*.
- **MM4 [concur] — Expand the concealment diagnostic by ~2 sentences.** "In banishing the term…one merely conceals them" generates the honor-machine reading; the method should state the diagnostic *sign* of a displaced motive (a source smuggled in under another term's name — e.g. an act attributed to Scene that the Agent in fact sourced) so the analyses' use of it is licensed.
- **MM5 [add] — A one-sentence ontology→rhetoric bridge at the top.** The transition from the metaphysics (ontology) to the method (rhetoric + Burke) is a discipline shift with no hinge. The methodology's first paragraph already gestures at it ("The first question was metaphysical. The second is rhetorical"); the rewrite strengthens that into an explicit handoff so the Burke material doesn't arrive unannounced.
- **MM6 [concur] — Name the diachronic claim's payoff.** "Read forward…understood backward from its end" is the thinnest-developed of the three governing words; add one clause: the *orekton* names itself only when the chain closes, so earlier nodes are recognizable as what they are only from the vantage of the completed act.

### 3. Analysis Introduction

**Strengths (keep):** Movement 1 (Uexküll→Heidegger→Lefebvre→Rickert→Hawk) is the author's strongest writing and the "virtual environment is that proposition carried to its limit" turn is among the best sentences in Part II; the careful, *limited* Baudrillard invocation; the veri(dis)similitude double condition; the clean "two worlds at the poles" setup.

- **AI1 [diverge from prior report → reconcile] — Movement 2 (Presence→Incorporation) should be *deconflicted with the methodology*, not simply "expanded."** The prior report says expand Movement 2 because incorporation is under-treated. But in assembly order the **methodology already develops incorporation in depth** (Calleja preserve/transform/elevate, R1–R7, the double axis). If the Introduction *re-derives* Calleja, it duplicates the method chapter. **Resolution:** keep Movement 2 short, but make it do a *different* job than the methodology — (i) the "presence → incorporation" terminological turn (which is the intro's own, via the MA's "true presence"), and (ii) one **concrete two-sentence contrast** of mere presence (a non-interactive 3-D film) vs. incorporation (the fruit hand-off; a camp-chore morning) so the reader sees the concept's teeth *before* the cases — while **pointing forward** to the methodology's machinery rather than rebuilding it. This satisfies the prior report's real concern (reader doesn't grasp incorporation's content) without creating redundancy.
- **AI2 [concur, P-medium] — Bridge veri(dis)similitude ↔ data-discrepancy ↔ phantasia-load explicitly.** Movement 4 already says the two cases are "a controlled variation in data-discrepancy." Add the missing half-sentence: data-discrepancy is the *technical* specification of veri(dis)similitude's verisimilar pole, and *phantasia*-load (minted in the metaphysics, per M3) is its *experiential* consequence — so the three names are one idea seen from three sides. This unifies the conceptual vocabulary across all five sections.
- **AI3 [concur] — The Baudrillard "simulacrum" invocation needs its limiting clause made explicit at point of use.** The metaphysics argues virtual objects are *real in kind, grounded in a real digital object* — the opposite of Baudrillard's "no original." Movement 1 calls the virtual environment "a Baudrillardian simulacrum." Add the limiter inline: *in a minimal sense — rendered rather than found — without Baudrillard's anti-realist claim that there is no ground behind it.*
- **AI4 [concur] — Citations C2 (Perelman "directly") here.** See §II.B.
- **AI5 [add] — Gibson's affordance is invoked once and dropped.** "It implies the complementarity of the animal and the environment" (Gibson 119) appears in Movement 1 and never returns, though the analyses are *full* of affordances (the fruit affords picking, the bell affords ringing). Either (a) add a half-sentence licensing later affordance-talk, or (b) cut the Gibson cite. The rewrite takes (a): one clause tying affordance to the "possibilities for action" the ecology authors.

### 4. G&G Chapter

**Strengths (keep):** The Fruit is the finest writing in Part II ("curation, not coercion"); the Miniaturization's mood analysis (wonder, not dread); the Carry-Over's 15-minute recalibration datum and its elevation ("to design such worlds is to design dispositions"); the Tavern's co-disclosedness-at-its-threshold reading. Voice is on-model (see §I.B2).

- **GG1 [concur, P-high] — The Uexküll "soap bubble" metaphor is duplicated verbatim** in the Introduction (Movement 1) and the Forest section. Keep it in the Introduction (it builds the ecology concept); **reformulate the Forest instance** to describe the enclosure-structure without re-using the "soap bubble" phrase.
- **GG2 [concur] — "Overt vs figured-but-plain" is muddied** because The Candle already names *hexis*, *technē*, and dwelling explicitly before The Fruit (the supposed "one overt example"). Fix by softening the chapter-note claim from "overt vs figured-but-plain" to "the most fully *walked-through* example" — The Fruit's distinction is that it narrates the *whole A₀–A₄ chain in order*, not that it's the first to name the apparatus.
- **GG3 [concur] — Rock/Rickert "things rather than objects" (199–201)** gives Rickert primary credit for a distinction that is fundamentally Heidegger's (ready/unready-to-hand, thing vs object). Reformulate to `(see Heidegger, *Being and Time*, 102–107; Rickert, *Ambient Rhetoric*, 199–201)`. (Note: the Rock passage is paraphrase, not verbatim quotation, so this is an attribution-credit fix, not a misquote.)
- **GG4 [concur] — Add the "by design or by constraint" hedge to the Tavern finding.** The chapter's strongest claim (co-disclosedness withheld at its threshold) is silent on whether the withholding is authorial choice or technical limit. One clause: *whether by design or by the limits of the NPC system, the analytic result is the same — the co-world is disclosed as preview.*
- **GG5 [concur] — Frame the self-citation** "(Salvo, *Veri(dis)similitude*, 58 n.15)" with a three-word parenthetical ("the author's earlier study") at first occurrence, since first-person self-citation can read as opaque.
- **GG6 [concur] — The Bell/prohairesis compression.** The parenthetical bracketing "prohairesis completes a wish rather than being a fourth kind of motive" carries a distinction contested enough in the method development to earn one main-text sentence: ringing the bell is not a *bouletic* act sourced in a goal but a *prohairetic* act completing an *epithymetic* impulse by a deliberative path.
- **GG7 [add] — Burke *Grammar* 443 (Scene–Act) and *Grammar* 21 (concealment) in the Miniaturization are both correctly the *Grammar*** (verified). No change — flagged only so the citation-normalization pass does not "correct" them by analogy to C1.

### 5. RDR2 Tutorial Chapter

**Strengths (keep):** the dual-hexis thesis and the three-pitch orekton arc; the honor-machine-as-Burkean-motive-attribution-machine (the chapter's most original contribution, esp. the Town section's five-event disclaimer structure); the Colter bell-toll diagnostic; the Legendary Hunt's silence-as-diagnostic and the bear-charge flinch specimen; the Camp's second-form-boredom reading.

- **RD1 [add, P-high] — Register pass (see §I.B1).** The chapter's prose must be brought from 18.3→~24–26 avg sentence, fragments fused, chiasmus restored, to sit beside G&G. This is the largest single editing task in the rewrite and is done section by section, preserving the analytical content and a *measured* amount of the drumbeat cadence.
- **RD2 [add, P-urgent] — Corrupted Greek glyph.** In the Colter Corridor section: "the committal *doxa* (**οκτόν** this is an enemy, take-as-hostile)" — "οκτόν" is a mis-paste fragment (stray piece of *ὀρεκτόν*). Fix to "the committal *doxa* (δόξα): *this is an enemy, take-as-hostile*."
- **RD3 [concur, P-urgent] — Citation C1** (Heist `Grammar 21` → `Rhetoric 21`). See §II.B.
- **RD4 [concur, P-urgent] — Evidential caveat for the Drunk Night (clip 12).** Its beatmap is flagged "100% whisper hallucination — ZERO coherent English dialogue," yet the prose presents the drunk-cam mechanic and brawl arc as established. Add one sentence: these beats are *analytically inferred pending frame verification*, not transcript-grounded. (Academic-integrity item.) The chapter's own end-note already lists four frame-verification pendings; surface the clip-12 one into the body.
- **RD5 [add] — Citation C3** (the Rickert "pushes back"/recalcitrance attribution in the Leash). See §II.B.
- **RD6 [concur] — "Clip 3a" arrives unprepared.** Add one orienting sentence at the Colter section open: clip 3a is the choke/spare fork interleaved within the same in-game session as clip 3, beatmapped separately.
- **RD7 [add] — Clip-numbering opacity.** The chapter cites clips 1, 2, 3, 3a, 4, 5, 6, 7, 9, 12 — gaps at 8/10/11 are unexplained, and a reader tracking the numbers will stumble. Either renumber the *analysed* clips sequentially (§§ are already named, so clip numbers can be demoted to "the hunting clip," "the saloon clip") or add a one-line note that clip numbers are the raw capture indices, not a continuous sequence. The rewrite leans on the section names and keeps clip numbers only where a timestamp citation needs them.
- **RD8 [concur, P-high] — The closing frame "The Disposition Built" is under-weight (~350 w vs G&G's Carry-Over ~600 w).** It must perform three moves like its G&G counterpart: (a) what the dual-hexis bundle *amounts to* as a prepared agent; (b) the explicit VR/2D-thesis connection (the 2D pole reaches the same incorporation via the high-phantasia-load route, its prostheses — Eagle Eye, Dead Eye, drunk-cam — the medium-specific instruments of compensation); (c) a real forward-pointer to the disruption, not a single final line. The rewrite expands it accordingly.
- **RD9 [concur] — Camp section under-developed for its conceptual load.** Add the explicit Calleja-channel profile of camp-dwelling (spatial + kinesthetic + affective dominant; ludic near-zero) so Calleja's apparatus earns its place where it best does — and tie the second-form boredom to that channel profile.
- **RD10 [concur] — Each section should build to one explicit claim.** The Colter and Heist sections in particular catalogue mechanics and label RODA loci without always arriving at *what the beats prove* about the dual-hexis or 2D-pole thesis. The register pass (RD1) is the occasion to add, per section, the one-sentence "what this section establishes" that the G&G sections all have.

---

## IV. CROSS-CUTTING STRUCTURAL & FLOW ANALYSIS

**F1 — Incorporation is developed twice (methodology §§3–4 AND intro Movement 2). [the most important flow issue, P-high]** In assembly order metaphysics → methodology → intro → cases, the methodology owns the deep incorporation mechanism; the intro's Movement 2 currently re-introduces Calleja's incorporation from scratch. *Deconflict* per AI1: the methodology keeps the machinery (Calleja sublation, R1–R7, the union structure); the intro keeps only the *terminological* turn (presence → incorporation, via the MA's "true presence") plus a concrete contrast, and points forward to the method. Net effect: each section has a distinct job and the reader is not told the same thing twice in two registers.

**F2 — The conceptual vocabulary is *one idea under four names* that are never unified: data-discrepancy (metaphysics), phantasia-load (analyses), veri(dis)similitude (intro), the 2D/VR pole (analyses).** Fixes M3 + AI2 mint "phantasia-load" in the metaphysics and unify all four in the intro's Movement 4, so the analyses inherit a single, defined vocabulary instead of four loosely-related terms.

**F3 — Inter-section handoffs are mostly excellent; protect them.** Metaphysics closes → "belongs to the analysis that follows"; methodology opens → "The preceding account did one thing only" (picks up the metaphysics almost verbatim in structure). This is a model handoff and must be **preserved** in the combined doc. The one weak seam is metaphysics→method *discipline* shift (ontology→rhetoric) — addressed by MM5. The intro→G&G seam ("The first case is *Gnomes & Goblins*" → the G&G chapter) is clean.

**F4 — Structural asymmetry between the two cases (acknowledged, not fixable now).** G&G = 3 tutorial + 3 disruption (balanced). RDR2 = 9 tutorial sections + **no disruption yet** (blocked on Sonny-scene footage). Part II currently leans heavily toward RDR2's tutorial. Not fixable until footage arrives; the RDR2 closing frame (RD8) must explicitly signal the disruption is coming and what it will test. **The combined document carries a visible note** that the RDR2 disruption (§2.2) is pending, so the asymmetry reads as *known and scheduled*, not as an omission.

**F5 — Each analysis chapter should name its own differential contribution in one closing sentence** (without folding in the separate Differential draft): G&G = the VR pole achieves world-disclosedness fully, co-disclosedness only in preview; RDR2 = the 2D pole achieves both, via the high-phantasia-load route, its prostheses the 2D-specific instruments of compensation. (G&G's Carry-Over and RDR2's RD8 closing are the homes for these.)

**F6 — Title/numbering scaffolding for the combined document.** The five drafts use inconsistent heading levels (the intro is unnumbered; G&G is "Section 1"; RDR2 is "§2.1"). The combined document imposes a single scheme: Part II with a short part-title; then §1 Metaphysics, §2 Methodology, §3 Introduction-to-the-Applications, §4 *Gnomes & Goblins*, §5 *Red Dead Redemption 2*. (Pure scaffolding; no content change. This is a proposal the author can renumber at will.)

---

## V. PRIORITIZED IMPROVEMENT LIST (mapped to the rewrite)

**URGENT (correctness/integrity — done first in the rewrite):**
- U1 = RD3/C1 — Burke *Grammar* 21 → *Rhetoric* 21 (RDR2 Heist).
- U2 = RD2 — fix corrupted Greek "οκτόν" → *doxa* (δόξα).
- U3 = RD4 — Drunk-Night evidential caveat (inference pending frame-verification).
- U4 = M1 — delete the metaphysics `\inlinenote{}` placeholder (fold its pointer into prose).
- U5 = C2/C3/C4 — Perelman "directly"; Rickert recalcitrance attribution; BT-146 page check.

**HIGH (structural/argumentative integrity):**
- H1 = M2 — extend the virtual-object ontology to screen-based rendering (un-exclude RDR2).
- H2 = M3 + AI2 + F2 — mint "phantasia-load" in the metaphysics; unify the four-named concept in the intro.
- H3 = MM1 — add *bia* to the methodology.
- H4 = MM2 — add the hexis type-distinction to the methodology.
- H5 = F1/AI1 — deconflict incorporation (methodology vs intro Movement 2).
- H6 = RD1 — RDR2 register pass toward the Part I/G&G voice.
- H7 = RD8 — expand the RDR2 closing frame (three moves + forward pointer).
- H8 = GG1 — fix the Uexküll "soap bubble" duplication.

**MEDIUM (precision/voice):**
- MM3 (R1–R7 to body), MM4 (concealment diagnostic), MM5 (ontology→rhetoric bridge), MM6 (diachronic payoff), M4 (orectic-charge to body), M5 (one downstream digital/virtual hook), AI3 (Baudrillard limiter), AI5 (Gibson affordance), GG2 (overt/figured wording), GG3 (Rickert/Heidegger credit), GG4 (by-design-or-constraint hedge), GG5 (self-citation frame), GG6 (bell/prohairesis sentence), RD6 (clip-3a prep), RD7 (clip-numbering), RD9 (Camp/Calleja channels), RD10 (per-section claim), F5 (differential closing sentences).

**LOW / global pass:**
- Citation-format normalization to `(Author, *ShortTitle*, Page)` across all five sections (enables single-pass XeLaTeX); M6 (resonant-kinēsis gloss); F4/F6 (asymmetry note + numbering scaffold).

---

## VI. ANCHOR REWRITES (the load-bearing new prose)

These are drafted to Part I / G&G voice and are inserted verbatim (or near-) in the combined document.

**(a) Metaphysics — screen-extension + phantasia-load (H1/H2), added in §"The Three Kinds of Thing," after the data-discrepancy paragraph:**
> The head-mounted display is only the most enclosing case of a more general arrangement. What actualizes a digital object into a perceptible virtual one is a renderer and a display; the headset is one such display, the monitor another, and the structure — digital object, rendered into act, mediated to a perceiver — holds across them. What changes from device to device is not the kind of being produced but the *bandwidth* of its production: how much of the non-virtual object's full sensorial field the medium supplies, and how much it leaves the perceiver to furnish. This is the data discrepancy named from the side of the world. Named from the side of the perceiver it is its converse, which I will call the **phantasia-load**: the smaller the data a medium delivers, the more the beholder's own image-making must contribute to make a world of it. A head-mounted, room-tracked world carries a small discrepancy and asks little of *phantasia*; a world rendered on a flat screen and worked through a controller carries a large one and asks a great deal. Both produce virtual objects in the one sense established here; they differ in the route by which the perceiver is brought to them.

**(b) Methodology — *bia* (H3), added to the chain description after the orektikon-motion sentence:**
> One motion in the chain can be inverted, and the method must mark the inversion as carefully as the completion. Ordinarily the orektikon motion M₃→A₄ issues from the agent's own desire into the agent's own act. But a designed world can *oppose* that desire with a force of its own, and where it does, the agent is made patient: the motion is suffered rather than enacted. This is *bia* (βία), forced motion — the standing exception to the chain's agency. It takes several forms the analyses will need: *cinematic* (the cutscene, total patiency, the body's control withdrawn entire); *soft* (the rebuff, the invisible wall, the leash that turns the player back without seizing the body); *suffered* (the grapple, the bear's charge, control stripped and won back only by counter-input); *inflicted* (the player as the agent of force upon another); and *de-inverted* (the act that restores to another the agency *bia* had taken). Where the chain runs to its *orekton*, desire is consummated; where *bia* intervenes, desire is overridden, and the analyst reads an agent momentarily unmade.

**(c) Methodology — hexis type-distinction (H4), added to the temporal-sedimentation sentence:**
> And the sediment is of two strands. A completed act of skill settles as a *technē*-hexis, the craftsman's standing readiness; a completed act of morally-weighted choice settles as an *ethical* hexis, the character's. These are not two chains but two deposits of one — laid down together, each conditioning what the other can become — and a single stretch of play commonly thickens both at once.

**(d) RDR2 — corrupted-glyph + claim fix (U2/RD10), Colter Corridor:**
> …the armed O'Driscoll becomes the *phantasma* charged with threat; the committal *doxa* (δόξα) — *this is an enemy, to be met with force* — forms and concretizes; the shot closes the chain. What the section establishes is the chapter's whole wager in miniature: the *technē*-hexis of combat and the ethical *hexis* of mercy are not taught in sequence but installed in the same half-hour, the player who learns to shoot at 07:08 the same player who learns to spare at 16:00.

**(e) RDR2 — expanded closing frame (RD8/F5), replacing the final two short paragraphs of "The Disposition Built":**
> What the tutorial has built is neither a skill-set nor a personality but a *paideia* (παιδεία): a standing readiness to act in certain ways in certain kinds of situation, cultivated by repetition until it runs without instruction. The two strands are by now one bundle — the *technē*-hexis that draws a bow in silence and the ethical hexis that spares a begging man under the eyes of witnesses — and the bundle is the prepared agent the open world will inherit.
>
> It was built, moreover, by the route the flat screen makes necessary. Where the head-mounted world hands the body its surround and asks little of the image, the screen withholds the surround and asks everything: the cold of the blizzard, the heft of the drawn bow, the lurch of the leaping train, the recoil from the charging bear — each supplied by the player's own *phantasia* across a data-discrepancy the medium never closes. And where the eye alone will not suffice, the design lends prostheses — Eagle Eye for the tracker's gaze, Dead Eye for the marksman's composure, the drunk-cam for the swimming head — the 2D pole's standing instruments of compensation. The disposition is the same kind of thing G&G deposited at the other pole; the road to it ran through the image, not the body.
>
> The rails will come off, and everything the tutorial deposited will be drawn upon across the forty hours that follow — and tested, when the gang that the loyalty-hexis was built around begins to come apart. That test is the disruption, and it is the subject of the section that the footage will let me write. What the tutorial built was the world that is made to break.

**(f) RDR2 — Leash recalcitrance/citation fix (C3), replacing the "Rickert's recalcitrance" sentence:**
> The world refuses the off-trail vector and routes the player back — the designed scene exerting what Burke called the recalcitrance of the situation, an ambient resistance that, as Rickert reads it, belongs to the material environment and not only to the persuading speaker (Rickert, *Ambient Rhetoric*, 254). It is a soft *bia*: no force is applied and no cutscene strips control; the companion's line stands in for the invisible wall, and the player re-corrects.

*(Additional smaller insertions — the metaphysics inlinenote replacement, the orectic-charge promotion, the methodology R1–R7/concealment/diachronic sentences, the intro deconfliction + concept-unification + Baudrillard limiter + Gibson clause, the G&G soap-bubble reformulation + by-design hedge + bell/prohairesis sentence + Rickert/Heidegger credit, and all citation normalizations — are applied directly in the combined document and itemized in §VII.)*

---

## VII. WHAT THE COMBINED DOCUMENT IMPLEMENTS

The rewrite (`Part-II-COMBINED-v1-2026-06-30.md` and `.tex`) is **one document, five sections**, originals untouched, applying every URGENT + HIGH + MEDIUM item above plus the global citation-normalization and numbering scaffold. The `.tex` is built for a **single-pass XeLaTeX** compile (`\setmainfont{Gentium Plus}` for Latin+Greek; subscripts via `\newunicodechar`; all citations inline, so no biber). The metaphysics keeps its own prose register; the RDR2 chapter is brought to the G&G/Part I register; the four-named concept is unified; *bia* and the dual-hexis gain their methodological home; incorporation is deconflicted. A second diagnostic (Pass 2) is run on the finished document and reports overall findings only.

*End of Pass 1.*
