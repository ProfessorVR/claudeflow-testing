# RODA Methodology — Draft Review, Grounding, and God-Write A/B Plan

**Date:** 2026-06-25 · **Inputs:** `Rhetorical-Ontological Diachronic Analysis (RODA) - DRAFT-v1.tex` (as you revised it); your overall + per-paragraph criticisms; the `roda-methodology-grounding` workflow (Calleja/Burke/Part-I/rivals, verbatim + loci).
**Bottom line:** your criticisms are correct and largely confirmable from the corpus. The draft's defect is not style-texture (it scored 0.94 Lanham-conformance to Part I) but **grounding and conceptual ownership** — it asserts relations it never defines, coins labels with no Part I pedigree, and imports rivals from general knowledge rather than your library. The fixes below are all grounded in verbatim corpus evidence.

---

## Part A — The meta-point (ultracode vs. effort-max vs. god-write)

A blunt admission first: the draft hit **0.94 Lanham conformance to Part I and still doesn't read like you** — and that is the diagnostic. The Lanham analyzer measures *texture* (sentence length, 85% Germanic vocabulary, figure density, voice score); it cannot see whether a relational verb like "presses" is *defined*, whether "the union" is *grounded*, or whether "world-face" has any *pedigree*. So a high texture score masked an under-grounded argument. **Lesson for the A/B: do not score on Lanham alone.** The decisive axes are (1) **grounding** — every claim tied to a verbatim quote + locus in *your* corpus; (2) **conceptual ownership** — relations defined, not gestured at; (3) **terminological continuity** with Part I; and only then (4) voice-texture.

This also reframes whether "ultracode" underperformed. The workflow draft's weakness was that I let parallel agents produce *prose* before grounding the claims; the same workflow machinery, pointed at **grounding research** (this pass), produced exactly the verbatim evidence the draft lacked. The likely ranking you suspect — god-write (curated prompt) ≥ console-max ≥ ultracode-prose — is plausible *for drafting*; but for *grounding* the multi-agent pass clearly earns its keep. The A/B below tests the drafting question cleanly.

---

## Part B — Overall criticisms, answered with grounding

**(1) More stylistic subsection titles.** Part I uses a consistent "Topic: Evocative Subtitle" form. Verbatim models: *"Rhetorical Phantasia: The Soul's Temporal Medium"*; *"Being-in-Motion-and-Time: The Ontological Horizon of Existence"*; *"The Architecture of Actualization: Schema, Chain, Iteration"*; *"Resonant Kinēsis: The Persisting Impression"*; *"Emotion: The Form of Desire Under Evaluative Disclosure."* Proposed methodology titles in that register:
- *Rhetorical Incorporation: The Substantial Union of Player and World*
- *Incorporation, Re-Grounded: Calleja and the Channels of Involvement*
- *Consubstantiation and the Grammar of Motives: Burke at the Other Pole*
- *The Producing Art and the Using Art: What the World Supplies and What the Player Does*

**(2) "world-face" / "other-face" — drop the coinage; it has NO Part I pedigree** (grep of Part I returns zero hits for either). Part I names the agent–world relation as a **"principle of correlation,"** agent and world as **"correlative poles of a single actualization"** (Part I 843), and the union by the locked formula **"one in substrate, different in being"** (Part I 837; *DA* III.2 425b26–27; the Thebes–Athens "one road, two descriptions"). The **social side** is **"being-with-others"** (Part I 1157), folded into the keystone formula **"the affective architecture of bodily-being-in-the-world-with-others"** (Part I 1299). Recommended replacements:
- Instead of *world-face / other-face* → **the two correlative poles** (or "two *logoi* of one substrate"): the **world-pole** (incorporation) and the **with-others pole** (consubstantiation).
- Drop "face" entirely; "pole" / "side" is Part I-sanctioned and non-coined.

**(3) "the chain" is unclear — and no, do not replace it with RODA.** Part I calls it **"the actualization chain"** (~25 occurrences) and introduces it as **"what I call, the actualization of desire"** (Part I 84); the compound **"the actualization-of-desire chain"** appears at Part I 934. **"RODA" appears zero times in Part I.** Crucially, RODA and the chain are *different kinds of thing*: **RODA is the method (the analysis you perform); the actualization-of-desire chain is the ontological structure RODA traces.** Collapsing them is a category error. Fix: say **"the actualization-of-desire chain"** on first mention, **"the actualization chain"** thereafter; reserve "RODA" for naming the method, not the object.

**(4a) Too vague / ornate / under-supported.** Conceded — this is the central flaw and the through-line of every per-paragraph fix below. The remedy is mechanical and consistent: (i) **define every relational verb** the first time ("presses," "renders," "conceals"); (ii) **attach a verbatim quote + locus** to every claim about Calleja, Burke, Heidegger; (iii) **replace coinages** with Part I terms; (iv) **cut the rivals you cannot ground** (or ground them from the now-available PDFs). Ornate phrasing that outruns its support is exactly what the grounding pass exists to prevent.

**(4b) Calleja's "incorporation" ↔ Heidegger's "concernful absorption" — yes, and this is a major, fertile connection. It should become the spine of the Calleja section.** It is grounded *in Part I already*: Part I quotes BT 405 — **"the characteristic absorption of concern in its equipmental world"** — plus **"circumspective concern"** and the ready-to-hand withdrawal analysis (the hammer "disappears into the hammering," BT 98, at Part I 1385). And it rhymes precisely with Calleja: incorporation requires the spatial and kinesthetic dimensions internalized **"to the point that they do not demand conscious attention"** (Calleja 170) — i.e. equipmental withdrawal. **But the bridge is yours, not Calleja's:** Heidegger is absent from Calleja's incorporation chapter; Calleja grounds incorporation in Lakoff & Johnson's experientialism + Damasio + Dennett (Calleja 168–169), and his most phenomenological phrase, "inhabiting a place" (Calleja 43), he anchors on **Tuan, not Heidegger.** So the concernful-absorption reading is the very phenomenological ground his cognitivism lacks — which is what your rhetorical ontology supplies. Present it as the dissertation's interpretive move, and it does double duty: it justifies Calleja *and* re-grounds him.

**(5) Doesn't sound like you.** See Part A: the texture matched while the substance did not. The cure is not more voice-tuning but grounding + your established terms + cutting ornamental assertion. When the claims are yours and the words are Part I's, the voice follows.

---

## Part C — Per-paragraph criticisms, answered

- **L48 footnote (provenance) — keep.** Fine as is.
- **L64 footnote ("This guard is the same…") — rewrite, drop "guard."** The footnote is convoluted because it compresses three moves (firewall, foreclosed-rupture, media differential) into one breath. Recommendation: cut the forward-references entirely from this footnote; state only the single point it needs to make, in plain terms — *that the union is an experiential convergence and not a change of kind: a player wholly taken into the world has not made the virtual non-virtual.* Move the foreclosed-rupture/*Gestell* and media-differential material to M.5/M.6 where they are actually developed.
- **L68 — "presses" is undefined; whole paragraph too compressed; last sentence pretentious. Rewrite.** Replace the "presses on the efficient-final cause" formula with a plain statement of *why Calleja*: **his Player Involvement Model gives a validated, games-built breakdown of the structural elements through which a player is involved in a game** — the vocabulary the actualization-of-desire chain needs for *where, in a designed world, a player's perception, cognition, and desire are actually engaged.* Drop "no account built closer to the philosophy of mind could supply what his, built from games, does" (the pretentious sentence) and just say it.
- **L70 — "when the world-face union obtains" unclear; need a PIM footnote + appendix.** Done: the **Calleja appendix** (`Appendix - Calleja PIM and Incorporation Criteria (R1-R7).md`) is created and the verbatim PIM definitions are now in hand (Calleja 43–44) for a footnote that names each dimension. Rewrite the final sentence to: Calleja gives the chain both a vocabulary for the six dimensions of involvement and a test for when a player is genuinely incorporated rather than merely involved.
- **L72 — second sentence convoluted; footnote must define "presses"; "world-facing throughout" is an overclaim.** All three confirmed. The "world-facing throughout" claim is **not defensible**: by Calleja's own definition incorporation is a **double axis** — "the player incorporates… the game environment into consciousness while simultaneously being incorporated through the avatar into that environment" (Calleja 169) — i.e. one axis runs *into consciousness*, and the closing coda places "the emphasis… on the internally constructed consciousness of the individual" (Calleja 179). Drop "world-facing throughout." Define "presses" once (e.g. "bears on" / "engages," then drop the metaphor).
- **L74 — cut the opening sentence; justify the specificity of "experientialist… naturalism."** "Experientialist" is exactly right — it is **Calleja's own term**: "their experientialist ontology" (Calleja 168), warranted by Damasio and Dennett (Calleja 169). But "embodied-cognition naturalism" is *my gloss*, not his words. Rewrite to: *what Calleja himself calls an experientialist ontology (Lakoff and Johnson), backed by Damasio's and Dennett's picture of consciousness as an internally generated construct.* The phenomenological-vocabulary move you liked is **strengthened** by the corpus, which independently flags "Tension 2: embodied-cognition naturalization vs. residual phenomenological vocabulary" (ig-10-deep §8) — keep that move and cite his "sense of habitation" (Calleja 169) and "inhabiting a place" (Calleja 43).
- **L76 — unpack R1–R7 (name each); the footnote must list them; "union-claim/union" should use the coined term; last sentence unclear.** R1–R7 are now spelled out (Calleja 169–173, 178) and belong in the appendix + a naming footnote: R1 assimilation · R2 embodiment · R3 simultaneity · R4 spatial-kinesthetic cornerstone · R5 blending · R6 temporal apex · R7 intrusion-integration. Replace "union-claim/union" with **rhetorical incorporation** (the coined term). The Calleja appendix folder is created per your instruction; the R1–R7 stub is in it.
- **L78 — opening sentence unclear; ground the rivals; "magic circle"/"immersive fallacy"; "keystone".** Grounded provenance: **Murray** (*Hamlet on the Holodeck*) and **Ryan** (*Narrative as Virtual Reality* 1 & 2) **are** in `corpus/new_media` (un-ingested) — so they can be quoted once ingested; **Huizinga's *Homo Ludens* (magic circle) and Salen & Zimmerman's *Rules of Play* (immersive fallacy) are NOT in your corpus** — they appear only as Calleja's *excision* of them. Recommendation: either (a) supply those two texts, or (b) **make the move through Calleja's own excision** (which *is* grounded: Calleja deliberately drops the magic circle on grounds of spatial redundancy + empirical absence), rather than asserting the magic circle from absent primaries. "**keystone**" is being used un-introduced — it is the **"one in substrate, different in being"** structure (Part I 837); name it that, and drop the bare label "keystone" until/unless you define it.
- **L82 — "gang" doesn't fit; "residue" conflation; "motion rendered/source concealed" unclear.** Three fixes. (i) Replace "gang" in the abstract claim with **"those one acts alongside" / "one's fellows" / "being-with-others"** (save the Van der Linde gang for the demonstration). (ii) **"residue" is a Part I technical term** — it denotes the *within-a-single-pass persisting trace* (= the *resonant kinēsis*: the bell still ringing, Part I 918); cross-pass dispositional build-up is **"temporal sedimentation"** (hexis, Part I 1246). My draft's "Two residues are left" **conflates** them — drop "residue" here; say "**two things the chain and incorporation leave unaccounted for**" or "**two gaps**." (iii) Define the two gaps plainly (see L84/L86).
- **L84 — "Take the first" (style); "own praxis"; "union of agents" anachronism; brawl out of nowhere.** (i) Replace "Take the first" with a stated claim. (ii) Correct "Aristotle's *praxis* is owned by a single soul" — *praxis* is a **kind of action a soul performs**, not a thing owned; rephrase to "Aristotle analyzes *praxis* as the action of a single soul." (iii) Drop "union of agents" — it is vague and, read as subject+environment, false; say precisely **"a consubstantial bond among several agents — a 'we' that can itself source an action."** (iv) **Pull the brawl out** for now (your lean): the demonstration belongs in its own compact passage / Appendix C, not threaded mid-justification.
- **L86 — "Take the second" (style); introduce the pentad properly (Burke's *dramatistic pentad*) with a footnote + appendix; "account conceals its own ground" unclear.** (i) State it. (ii) Introduce **"Burke's dramatistic pentad"** by full name; the Burke appendix (created) now has the verbatim definitions (Burke, *Grammar* xv): act/scene/agent/agency/purpose + attitude (RoM 42, "attitude being an incipient act"). (iii) **"conceals its own ground" overreaches.** What *is* Burkean: a motive-term, when banished, "far from banishing its functions one merely conceals them," so the analyst must "detect its covert influence even in cases where it is overtly absent" (Burke, *Grammar* 21). Reframe the diagnostic as **detecting the displaced or covertly-imported motive-locus** — not a blanket "every account hides its ground."
- **L88 — opening style; "consubstantial union of agents"; Perelman/Bitzer provenance; "paradox of substance".** (i) State why Burke plainly. (ii) Your instinct is grounded and strong: **Aristotle's seven causes of action (*Rhetorica* I.10) can be read as categories of motive — and Burke does exactly this himself**: he "refers human actions to seven causes (aitia): chance, nature, compulsion, habit, reason, anger, and desire" (Burke, *Grammar* 292). This is the cleanest bridge (and your Section 6 seven-causes reframe already anticipates it); note that Burke's *explicit* Aristotle↔pentad map is via the **four causes**, so the seven-causes→pentad reading is your construction built on Burke's own move. (iii) **Perelman & Bitzer** are now in `corpus/rhetorical_ontology` (you added them; un-ingested) — so they are grounding-eligible; if kept, ingest + quote verbatim (Perelman: "adherence of minds" / "universal audience," *The New Rhetoric*; Bitzer: exigence + audience + constraints, "The Rhetorical Situation," 1968). (iv) **"paradox of substance"** is verbatim-grounded (Burke, *Grammar* 22–23): "the word 'substance,' used to designate what a thing is, derives from a word designating something that a thing is not… etymologically refers to something outside the thing." Footnote it.
- **L90 — appendix needed.** Created: `Appendix - Burke-Calleja Crosswalk (convergence evidence).md` (to be populated from `validated-crosswalk.json`).

---

## Part D — Consolidated terminology decisions (lock these)

| Draft term | Problem | Replace with (Part I-grounded) |
|---|---|---|
| "the chain" (bare) | ambiguous | **"the actualization-of-desire chain"** (1st), **"the actualization chain"** (after) |
| replace chain with "RODA"? | category error | **No** — RODA = the method; the chain = the object it traces |
| "world-face" / "other-face" | coinage, no pedigree | **the world-pole** (incorporation) / **the with-others pole** (consubstantiation); "two *logoi* of one substrate" |
| "keystone" (un-introduced) | undefined label | **"one in substrate, different in being"** (Part I 837; *DA* III.2 425b26–27) |
| "residue" (for Burke's gaps) | conflates a Part I technical term | **"two gaps"** / "two things left unaccounted for" (reserve *residue* = the resonant trace) |
| "gang" (abstract claim) | wrong register | **"one's fellows" / "being-with-others"** (RDR2 gang only in the demonstration) |
| "presses on the efficient-final cause" | undefined metaphor | define once ("bears on / engages"), then plain language |
| "embodied-cognition naturalism" (Calleja) | not his words | **"experientialist ontology (Lakoff & Johnson), backed by Damasio and Dennett"** |

---

## Part E — Provenance ledger (what is grounded, what needs work)

- **Verbatim, in hand now (quote + locus):** Calleja — 6 PIM dimensions (43–44), incorporation double-axis (169), cornerstone (170), metaphor-disclaimer (5), experientialist ground (168–169). Burke — pentad (Grammar xv), paradox of substance (22–23), consubstantiation + "compensatory to division" (RoM 21–22), seven-causes-as-motive (Grammar 292), concealment (Grammar 21). Part I — concernful absorption (BT 405 @ 752), correlative poles (843), one-in-substrate (837), being-with-others (1157, 1299), resonant/residue vs sedimentation (918, 1246). Heidegger — Besorgen §15/H.66–67, ready-to-hand §15–16, Being-alongside §41/H.192–193 (verbatim Heidegger sentence NEEDS the BT PDF).
- **In corpus, un-ingested (ingest + quote if kept):** Murray, Ryan ×2 (`new_media`); Perelman, Bitzer (`rhetorical_ontology`).
- **Absent — supply or route around:** Huizinga *Homo Ludens*; Salen & Zimmerman *Rules of Play*. Cleanest route-around: cite Calleja's own excision of the magic circle (grounded) rather than the absent primaries.
- **Citation hygiene:** cite Burke by printed page (running heads), not PDF page; verify any quote near OCR damage in your Burke PDFs (e.g. RoM 20 "killing"→OCR "filling"); the seven-causes→pentad map is your construction (Burke's explicit map is the four causes).

---

## Part F — The A/B protocol (god-write vs. ultracode vs. console-max)

**Scope (apples-to-apples):** all three draft the **same unit** — the **Calleja justification** (the "why Calleja" subsection), ~600–900 words. It is the centerpiece, it is where the original draft was weakest, and it is small enough to judge cleanly. Scale the winner's approach to the rest afterward.

**Common inputs handed to all three:** (i) the grounding pack (Part E quotes + loci); (ii) the terminology locks (Part D); (iii) the dissertation conventions (ungendered/"player"; no bold run-in heads; Greek italic + Bekker); (iv) the instruction to ground every claim and define every relational verb.

**Voice handling differs by contestant, by design:** god-write uses its **trained style profile** (`dalton-philosophical-mo2fmhy2`) — it is NOT given the Part I Lanham fingerprint as a target (coaching it would contaminate the test). Console-max and ultracode target the Part I fingerprint as established. The Lanham-conformance axis is then a *measurement* applied identically to all three outputs — fair, because each tool produces voice its own way and is scored on the result, not the method.

**Contestants:**
1. **god-write** — the curated prompt (`godwrite-prompt - RODA methodology.md`), run via `/god-write` on its trained style profile (no external voice target).
2. **ultracode** — a fresh workflow draft *with the grounding pack pre-supplied* (the fair version — drafting on grounded inputs, not discovering as it writes); targets Part I voice.
3. **console-max** — me, single-pass at max effort, same inputs, no workflow; targets Part I voice.

**Scoring rubric (NOT Lanham-only):**
| Axis | Weight | What it measures |
|---|---|---|
| Grounding | 30% | every claim → verbatim quote + locus in your corpus; zero ungrounded rivals |
| Conceptual ownership | 25% | relations defined, not gestured; no ornate filler |
| Terminology continuity | 20% | uses Part I terms (Part D); no coinages |
| Voice-texture (Lanham) | 15% | conformance to Part I fingerprint |
| Concision / committee-readiness | 10% | brief, no padding |

Blind-score all three on this rubric; the winner's *method* (not just its text) becomes the drafting pipeline for M.0–M.6.

---

## Part G — The god-write prompt

See `godwrite-prompt - RODA methodology.md` (companion file). It embeds the grounding pack so god-write cannot hallucinate sources, locks the terminology, sets the Part I style target, and scopes the task to the Calleja justification for the A/B.
