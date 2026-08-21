# Curated /god-write prompt — RODA methodology (justification layer, ~3000w)

> Paste the TASK block below as the `/god-write` prompt. Scope = the methodology **justification layer** (~3000 words): orientation → ontological frame (by reference) → the generative spine + rhetorical incorporation → why Calleja → why Burke. This matches the word-target and is directly comparable to the ultracode `DRAFT-v1` for the A/B.
>
> **CLI invocation — RUN 3 (embedded-pack-only; fixes after run 1 = corpus overrode the pack, run 2 = multi-step degraded without corpus and truncated):**
> ```
> npx tsx src/god-agent/universal/cli.ts write "<TASK block>" \
>   --execute --json \
>   --style academic --word-target 3000 \
>   --style-profile dalton-philosophical-mo2fmhy2
> ```
> Flag notes: **NO corpus retrieval** (`--use-corpus`/`--whitelist` dropped) — the embedded GROUNDING PACK is the sole source, so retrieval cannot override it with tangential/junk chunks (run 1's failure). **NO multi-step suite** (`--multi-step`/`--nli-verify`/`--candidate-selection` dropped) — that path degraded to `steps:0`/`pipelineHealth:degraded` and truncated before the Burke movement without corpus (run 2's failure). Citation-enforcement/verify-sources are corpus-dependent and auto-skip without a corpus, so they are omitted. Inline validation auto-disables (no corpus). Voice = the **trained profile**, no external target. The pack already names exactly which sources may be cited; do not introduce others.

---

TASK. Draft the **justification layer** of a philosophy dissertation's Part II methodology chapter (~3000 words of continuous scholarly prose + footnotes), in FIVE movements with the subsection titles given. This is argumentative prose for a doctoral committee, not a summary. Ground every claim in the GROUNDING PACK below; do not introduce any source not in the pack.

VOICE. Use your TRAINED STYLE PROFILE for voice. Do NOT import or match any external style target. Observe only these standing dissertation conventions: Greek terms italicized and glossed with Bekker numbers inline; substantive footnotes; NO bold run-in headings; ungendered language — refer to the in-game subject as "the player" (never she/he/they); subsection titles in the author's "Topic: Evocative Subtitle" form.

THE FIVE MOVEMENTS (subsection titles + content):

1. **Rhetorical-Ontological Diachronic Analysis: The Mechanism of a Reshaping** (orientation, ~400w). The prior (metaphysics) section discharged the reality-burden — that virtual and phantasmic things are real, distinct in kind, a potency rendered into act — and deferred the question of how such rendered worlds come to work upon, and reshape, the one who engages them. This section answers that with the method: RODA, which reads a stretch of play as the actualization of desire and traces how a designed world drives it toward a substantial union (rhetorical incorporation) that sediments into the player's *hexis*.

2. **The Producing Art and the Using Art: What the World Supplies and What the Player Does** (the ontological frame, by reference, ~500w). Do NOT re-derive Part I. State only the two load-bearing features: (a) the four causes belong to a single change and cannot be split between two agents — designing and playing are two acts, joined at Aristotle's producing-art/using-art relation (*Phys.* II.2 194a36–b8), so the designer's end-product is the player's given means (what the world supplies = material + formal; what the player does = efficient + final); (b) the union-structure RODA inherits is "one in substrate, different in being" (*DA* III.2 425b26–27).

3. **Rhetorical Incorporation: The Substantial Union of Player and World** (the spine, ~600w). The actualization-of-desire chain (A₀→A₄), read forward, understood backward from the *orekton*. The central event at A₃→A₄: a substantial union with two correlative poles — the world-pole (incorporation) and the with-others pole (consubstantiation) — held as one event. State plainly: this fusion, grounded in the actualization of desire, is the dissertation's own; neither source has both poles. Guard: the union is an experiential convergence, NOT a change of kind (a wholly incorporated player has not made the virtual non-virtual).

4. **Incorporation, Re-Grounded: Calleja and the Channels of Involvement** (why Calleja, ~800w). The chain shows a designed world engages the player's perception, cognition, and desire — but gives no vocabulary for *where* that engagement happens, nor a test for *whether* the player is truly taken into the world. Calleja's Player Involvement Model supplies both. Sublate in three beats: PRESERVE incorporation as the world-pole + the six dimensions as designed channels; TRANSFORM it from a psychological intensification of involvement into an ontological union — tie it to the dissertation's own Heideggerian "absorption of concern in its equipmental world" / circumspective concern (this is YOUR bridge; Calleja does not make it — see PROVENANCE); ELEVATE it into union with the other pole. Show the re-grounding is warranted by Calleja's own admission (incorporation "ultimately a metaphor") and the gap between his experientialist ground and the phenomenological vocabulary he reaches for. Make R1–R7 the union-test. Close with why Calleja over alternatives — routed per PROVENANCE.

5. **Consubstantiation and the Grammar of Motives: Burke at the Other Pole** (why Burke, ~700w). Two things the chain and incorporation leave unaccounted for (do NOT call these "residues"): (i) a consubstantial bond among several agents — a "we" that can itself *source* an action; (ii) a grammar by which a finished act is given its motive, and its true source displaced. Burke supplies both. Sublate: PRESERVE consubstantiation; TRANSFORM it from symbolic persuasion into the desire-sourced "we" ratified at A₃; ELEVATE it into the with-others pole. Ground the seven-causes-as-motive bridge (Burke does it himself, *Grammar* 292). Frame the pentad as motive-attribution and the concealment diagnostic precisely (not "every account hides its ground"). End with the blind Burke↔Calleja convergence as the evidence the two track one structure.

GROUNDING PACK — CALLEJA (*In-Game*, 2011; quote verbatim, cite Author + short title + page):
- Incorporation double-axis (p.169): "Incorporation thus operates on a double axis: the player incorporates (in the sense of internalizing or assimilating) the game environment into consciousness while simultaneously being incorporated through the avatar into that environment. The simultaneous occurrence of these two processes is a necessary condition for the experience of incorporation."
- Canonical definition (p.169): "We can thus conceive of incorporation as the absorption of a virtual environment into consciousness, yielding a sense of habitation, which is supported by the systemically upheld embodiment of the player in a single location, as represented by the avatar."
- Cornerstone (pp.169–170): "two particular dimensions—spatial and kinesthetic—form the cornerstone of the incorporation experience. Without them, incorporation cannot take place."
- Metaphor-disclaimer (p.5): "incorporation is ultimately a metaphor like presence or immersion…"
- His ground (p.168): "their experientialist ontology" (Lakoff & Johnson); (p.169) "a view of consciousness as an internally generated construct (Dennett, 1991; Damasio, 2000; Lakoff and Johnson, 2003)."
- Six PIM dimensions (verbatim, pp.43–44) — for a footnote naming each: KINESTHETIC "all modes of avatar or game piece control… ranging from learning controls to the fluency of internalized movement." SPATIAL "engagement with the spatial qualities of a virtual environment… the sense that they are inhabiting a place, rather than merely perceiving a representation of space." SHARED "engagement derived from players' awareness of and interaction with other agents… cohabitation, cooperation, and competition." NARRATIVE "the narrative that is scripted into the game and the narrative that is generated from the ongoing interaction." AFFECTIVE "various forms of emotional engagement… either purposefully designed into the game or precipitated by an individual player's interpretation." LUDIC "players' engagement with the choices made in the game and the repercussions of those choices."
- R1–R7 (Calleja 169–173, 178; R3–R7 are Calleja's own incorporation-vs-involvement test, R1–R2 from the double-axis): R1 assimilation · R2 embodiment · R3 simultaneity (the strictest gatekeeper) · R4 spatial-kinesthetic cornerstone · R5 blending · R6 temporal apex · R7 intrusion-integration.

GROUNDING PACK — BURKE (*A Grammar of Motives* 1945, *A Rhetoric of Motives* 1950; verbatim; cite by printed page):
- Pentad (*Grammar* xv): "We shall use five terms as generating principle of our investigation. They are: Act, Scene, Agent, Agency, Purpose…"; interrogatives — "what was done (act), when or where it was done (scene), who did it (agent), how he did it (agency), and why (purpose)."
- "Grammar of motives" = the terms alone (*Grammar* xvi): "Strictly speaking, we mean by a Grammar of motives a concern with the terms alone…" (use PLURAL "motives"; it is a grammar of how motive is *attributed*, not a psychology of drives).
- Attitude, the 6th term (*Rhetoric* 42): "rhetorical language is inducement to action (or to attitude, attitude being an incipient act)."
- Paradox of substance (*Grammar* 22–23): "the word 'substance,' used to designate what a thing is, derives from a word designating something that a thing is not… etymologically refers to something outside the thing, extrinsic to it."
- Consubstantiation (*Rhetoric* 21): "In being identified with B, A is 'substantially one' with a person other than himself. Yet at the same time he remains unique, an individual locus of motives. Thus he is both joined and separate…"; act-basis (*Rhetoric* 21) "substance… was an act; and a way of life is an acting-together…"; compensatory (*Rhetoric* 22) "Identification is affirmed with earnestness precisely because there is division. Identification is compensatory to division."
- Seven-causes-as-motive (*Grammar* 292): Burke "refers human actions to seven causes (aitia): chance, nature, compulsion, habit, reason, anger, and desire" — direct warrant for reading *Rhetorica* I.10 (1369a–b) as categories of motive. (Burke's explicit Aristotle↔pentad map is the FOUR causes; the seven-causes→pentad reading is the dissertation's construction built on Burke's own move — say so.)
- Concealment diagnostic (*Grammar* 21): "in banishing the term, far from banishing its functions one merely conceals them… we may detect its covert influence even in cases where it is overtly absent." (Frame as detecting a displaced/covertly-imported motive-locus — NOT a blanket "every account hides its ground.")

GROUNDING PACK — PART I CONTINUITY + HEIDEGGER (the author's established vocabulary; quote as Part I / the dissertation's own):
- Agent–world relation: "correlative poles of a single actualization" (Part I); union formula "one in substrate, different in being" (*DA* III.2 425b26–27).
- The with-others pole: "being-with-others," folded into "the affective architecture of bodily-being-in-the-world-with-others" (Part I).
- Concernful absorption (already in Part I, BT 405): "the characteristic absorption of concern in its equipmental world"; "circumspective concern"; equipment that withdraws (the hammer "disappears into the hammering," BT 98). Use these to re-ground Calleja's incorporation.

GROUNDING PACK — THE A₀–A₄ CHAIN (Part I; use THESE node definitions EXACTLY in movement 3 — do not improvise the node semantics):
- The chain is read FORWARD (motion by motion) but understood BACKWARD from the *orekton* (the object of desire that draws the whole).
- **A₀** — the ontological horizon: a sensible object and the sense-faculty given together within motion and time; the designed *Umwelt* into which the player is already thrown.
- **M₀→A₁** (perceptual motion) → **A₁** — completed perception, which deposits a dual residue, the *resonant kinēsis*: the *resonant aisthēma* (the persisting eidetic trace) and the *resonant epithymia* (the persisting hedonic-orectic tone). ["residue"/"resonant" belong ONLY here.]
- **M₁→A₂** (phantastic motion) → **A₂** — the *phantasma* proper: the determinate, available, charged image (the pivot on which every later operation works), generated from the *resonant kinēsis*.
- **M₂→A₃** (cognitive motion) → **A₃** — completed cognition: the *phantasma* engaged by the three orientational modes (intellection · memory · discursive/deliberative) PLUS the orthogonal committal *doxa* (the taking-as-true) PLUS the concretized emotion.
- **M₃→A₄** (orektikon motion) → **A₄** — completed action (*praxis* / *poiēsis*); it sediments into *hexis* (this cross-pass build-up is *temporal sedimentation*, NOT "residue").
- The central event (rhetorical incorporation) is at the **A₃→A₄** transition. DO NOT place cognition at A₁–A₂ or desire at A₂–A₃; A₂ is the *phantasma*, A₃ is cognition/*doxa*/emotion.

TERMINOLOGY LOCKS (violating any is failure):
- The object RODA traces = "the actualization-of-desire chain" (first) / "the actualization chain" (after) — NOT "RODA" (RODA is the method, not the chain).
- The two sides of the union = "the world-pole" / "the with-others pole" — NEVER "world-face"/"other-face."
- The union structure = "one in substrate, different in being" — do not call it "the keystone" without defining it.
- "residue" is reserved for the within-pass resonant trace (*resonant kinēsis*); cross-pass build-up is "temporal sedimentation" (*hexis*). Do NOT use "residue" for the gaps Burke fills.
- "gang" only in any concrete game example; in the abstract claim use "one's fellows" / "being-with-others."
- Define any relational verb ("engages," "bears on") on first use; do not write "presses on the efficient-final cause" without explanation.

PROVENANCE (state honestly; required by the corpus-only + strict-citation flags):
- The incorporation ↔ concernful-absorption reading is the DISSERTATION'S construction; Heidegger is absent from Calleja's incorporation chapter, and Calleja grounds incorporation in experientialist cognitive science (Lakoff & Johnson + Damasio + Dennett). Present the Heideggerian re-grounding as the author's interpretive move that supplies what Calleja's own ground lacks.
- Cite ONLY ingested corpus sources. Do NOT cite Murray, Ryan, Perelman, Bitzer (not yet ingested) or Huizinga / Salen & Zimmerman (absent). For the "why Calleja over rivals" move, route the contrast through Calleja's OWN excision of the magic circle (in the Calleja text/corpus) and his correction of the unidirectional "immersion/presence" metaphors — do not name or cite the absent rival primaries.
- The seven-causes→pentad crosswalk is the dissertation's construction built on Burke's own invocation of the seven causes (*Grammar* 292).

OUTPUT: the five-movement justification layer (~3000 words) + footnotes (footnotes name each PIM dimension, each R1–R7 criterion, and each pentad term, pointing to the Calleja and Burke appendices for full verbatim articulation). End with a one-line list of any claim you could not ground in the pack above.
