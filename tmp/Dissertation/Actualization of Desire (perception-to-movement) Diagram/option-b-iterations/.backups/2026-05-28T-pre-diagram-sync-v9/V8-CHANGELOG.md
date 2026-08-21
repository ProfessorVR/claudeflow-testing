# v8 Change Log — Diagram Sync Pass 1 (finalized §§1.0–1.4)

**Date:** 2026-05-27
**File:** `option-b-iterations/actualization-chain-v7 — Option B v8.html` (copy of v7; v7 untouched as baseline)
**Backup:** `.backups/2026-05-27T-pre-diagram-sync-v8/`
**Basis:** `DIAGRAM-AUDIT-REPORT.md` (P0/P1 items from finalized sections only)
**Validation:** embedded script passes `node --check`; all `passages[]` keys resolve.

This pass applied **only** changes derived from the finalized sections (§§1.0–1.4) plus locus/factual fixes. All §1.5-domain items are deferred (see §C) pending your §1.5 revision. Per your directive, **no Gross/Heidegger passage was added unless verbatim-verified in `verbatim_passages.md`**; everything that wasn't is listed in §B.

---

## A. Changes applied to v8

### Locus / factual fixes
1. **Naming principle locus** `Phys. V.5, 229b25` → `Phys. V.1, 224b7–9` at: A₀ "Naming principle" cite; Motion-and-Time horizon popup (body + cite); horizon `passages[]`; time popover `passageHTML`. Added alias `PASSAGES['Phys. V.1, 224b7–9'] = PASSAGES['Phys. V.1, 224b6-8']`. The V.5 229b25 entry + its label-drift note are retained (still a legitimate passage). [audit C-1 / §1.0–§1.1]
2. **Factual error fixed** — "magnanimity of anger" → "good temper (*praotēs*) of anger"; and the low-anger contrast "the magnanimous person's" → "the good-tempered person's" (`praxis-to-m23-doxa-gate` arrow). The NE anger-virtue is *praotēs*, not *megalopsychia*. [audit §2.8 / §1.4 L193] *(Note: this arrow is otherwise §1.5-domain and may be relabeled in pass 2; the factual correction carries forward regardless.)*

### Masthead
3. Subtitle "Dual Trace Framework" → "Phantasia as the Soul's Temporal Medium" (the §1.0 frame; dual-trace was one sub-thesis and its content was never stated). [audit D-1]

### A₀ — now a dyad
4. Title "Sensible Object in Actuality" → **"Sensible Object & Aisthētikon"**; greek → "aisthēton + aisthētikon (dyad)"; desc rewritten to the **dyadic first actuality** of sensible object + *aisthētikon*. [audit §2.2 / §1.1 L51–55]
5. "Ontological character" popup rewritten: one shared *energeia* under two *logoi* (DA III.2 425b26–27); preservative (not destructive) being-affected (DA II.5 417b2–7); no longer a one-sided efficient cause.
6. "Structural analogy" → **"Relative unmoved originator (the limit case)"**: relative vs. cosmological Prime Mover (Met XII 1072a23–26); scale-invariance; co-eternity limit case (Met XII.6 1071b6–11). [audit A-4]

### A₁ — dual-resonance vocabulary
7. greek "aisthēma + affective valence (pathos)" → **"aisthēma + resonant epithymia (dual resonance)"**; desc rewritten to *resonant kinēsis → resonant aisthēma + resonant epithymia*; citation/passages `431a8–10` → **`431a8–14`**. [audit A-1/C-1 / §1.2]
8. Added popup **"Dual resonance: resonant aisthēma + resonant epithymia."**
9. Added popup **"Four senses of pathos (Met. Δ.21)."**

### A₂ — the most out-of-date node (rebuilt)
10. greek "phantasma — dual-aspect" → **"phantasma — resonant aisthēma + epithymia"**; desc rewritten (making-present of the *eidos*, taken-as). [audit B-1/B-2]
11. **"Three essential characteristics" corrected** from {stable/recallable, formally similar, hinge} → **{determinacy, availability, representationality}**, recast as "structural moments of the soul's disclosedness toward the *eidos*." [audit B-1 — the P0 correctness fix]
12. Added popup **"Making-present and taking-as (Heidegger, BCAP)"** — quotes GA 18 p.135 ("νοῦς is the light in which the look of something is seen", verbatim-verified); "pre-propositional but not pre-positional."
13. Added popup **"Three routes to 'this is drink' (MA 701a32–33)"** (aisthēsis / phantasia / nous).
14. `passages[]` extended with `DA III.7, 431a14–17` and `GA 18, p. 135`.

### M₀→A₁
15. Added popup **"Enmattered alloiōsis & the persisting trace"** (preservative *paschein* → *resonant kinēsis*; DA II.5 417b2–7). *(The "analogical extension" caveat was left untouched — see §D.1.)* [audit A-1/A-3]

### M₂→A₃
16. Modes list item 3 "Deliberative phantasia" → **"Discursive (deliberative + speculative)"** with both sub-domains noted. [audit B-4]

### Doxa band
17. Functional-mode 3 wording: "flips the generic resonant *orexis*" → "**articulationally concretizes** the latent *resonant epithymia*" (§1.4 vocabulary). [audit B-4]

### Emotion (EMOTION_COMPOSITE + M34 + the loop)
18. "Tripartite composite" → **"Five-fold composite"** (disposition · toward-which/whom + *Mitsein* · bodily form · temporal range · disclosive function). [audit B-1 / §1.4 Conclusion]
19. Added popup **"E-motion is motion (paschein)"** — preservative *paschein*; *Befindlichkeit* quote BT §29 H.137 ("A mood assails us…", verbatim-verified).
20. "Pathos vs. emotion: a two-level structure" → **"Two articulational concretions of one structure"**; dropped "supervene"/strata; added the three-dimensional magnitude-axis. [audit B-2]
21. M34 emotion sub-object `content` updated from tripartite to the five-fold concretion language.
22. **`emotion-feedback` arrow re-registered** (P0 correctness): title "Emotion Feedback to A₂" → **"The Pathetic Loop (diachronic)"**; tag "within-episode" → "diachronic (cross-episode)"; description rewritten per §1.4 L131 (chain stays directional A₀→A₄ within an episode; two mechanisms — *Stimmung*-saturation→A₁, corrective-impairment→A₂→A₃ gate); added De Insomn. 460b16–18 (verbatim-verified). [audit §2.7]
23. `EMOTION_COMPOSITE.feedbackPath` retitled "The feedback path" → **"The pathetic loop (diachronic)"** with the same register clarification.

### New PASSAGES entries (all verbatim-verified in `verbatim_passages.md`)
- `DA III.7, 431a8–14` · `GA 18, p. 135` · `BT §29, H.137` · `De Insomn. 460b16–18` · alias `Phys. V.1, 224b7–9`.

---

## B. PENDING — needs verification into `verbatim_passages.md` before it can go into the diagram

These audit recommendations were **NOT applied** because the verbatim text is not yet in `verbatim_passages.md`. Per your directive, each must be added + verified there first, then wired into the popups.

### Gross (advisor-rigor — none currently in the verbatim doc)
- *Heidegger and Rhetoric* (2005, ed. Gross & Kemmann): Intro **p.4** ("*pathos* is the very substance…"), **p.26** (GA 18 206–207, enmattered *eidos* of fear), **pp.113–115** ("passions alter judgements / intrude on *logos*"), **p.1** (SS 1924 epigraph).
- *Uncomfortable Situations* (2017): **p.3** (anti-cognitivist), **pp.20 / 22–23** ("rhetoric as a humanistic form of affordance theory…").
- Intended homes: a new framing popup (§1.0 *phantasia*/temporal-medium), the A₂ making-present popup, the doxa band, and the emotion/A₄ synthesis popups.

### BCAP pages not yet in the verbatim doc
- **p.115** (the *Rhetoric*'s constitutive threefold: change + *krisis* + hedonic tonality) — for an emotion popup.
- **pp.133–134** (*pathē* "not psychic experiences… being-taken in their full being-in-the-world") and the **132–134 making-present** narrative (only p.135 is verified, and it is used).
- **p.176** ("*pathē* are the ground out of which speaking arises").
- BCAP phantasia/doxa pages cited in §1.3 (93–94, 96, 101, 104–105, 110, 124, 264–265) — for the doxa band and A₃ modes.

### Being and Time pages not yet verified verbatim
- §29 **H.135** (thrownness — catalog has it as an anchor only, "quote-text pending"); §68b **H.340** (*Stimmung* temporalizes as *Gewesenheit*).

### Aristotle loci not yet in the diagram's registry (verbatim available in some cases — confirm before wiring)
- **Met. Δ.21, 1022b15–21** (four senses of *pathos* — currently cited as a label only on the new A₁ popup; add verbatim to show under "Full passage").
- **Rhetoric II.6, 1383b13–17** (shame definition — used as a recurring §1.4 example; absent from registry).
- **Met. IX.6, 1048b30–36** (*energeia*/*kinēsis* tense-test — verified in the doc; belongs to the §1.5 pass, see §C).

### Secondary sources (absent from diagram entirely)
Frede, Caston, Papachristou, Nussbaum, Hawhee, Burke (Hazlitt/identification), Gonzalez, O'Gorman, White, Kisiel, Struever, Michalski, Rickert/Gibson/Uexküll. Add as needed when the relevant popups are built out.

---

## C. DEFERRED to the §1.5 second pass (do after you finish §1.5)

1. **A₄ "Three Types of Action" popup** (Type 1 simple appetition / Type 2 habitual-rational / Type 3 evaluatively complex) + a `passages[]` array. The diagram's A₄ still has only the two generic popups. [audit §2.9 — biggest structural gap]
2. **A₄ "Affective Architecture of Being-in-the-World" synthesis popup.**
3. **Hexeis node**: remove the "settled doxa **is** a hexis" conflation (§1.5 L164: "a *doxa* is a taking-as-true, not a disposition"); add the *energeia*/*kinēsis* grounding (Met IX.6 1048b30–36; *praxis*:*poiēsis*::*energeia*:*kinēsis*).
4. **Terminology renames pending §1.5 finalization** (diagram currently matches the dominant current-text term): `praxis-hexis` → `ethical hexis`; `doxa-gate` → `doxastic ratification`; possible A₄ genus relabel ("Completed Action (praxis)" → "Actualization of Desire" with three terminus-types).
5. **Type 1 pre-doxastic *kritikon* recoil** (DA III.7 431a8–12) on the pure-appetitive bypass arrow.

---

## D. Dissertation-internal questions surfaced (not diagram bugs — for you to resolve)

1. **§1.0 vs §1.2 on the three-factor schema's extension to perception.** §1.0 L91 fn calls it *analogical*; §1.2 L51 calls it *direct* ("aisthēsis is itself a kinēsis"). The diagram (M01 caveat + ROLE_GLOSSARY) follows §1.0's "analogical." **Left untouched** pending your resolution; once settled, M01's `movedMoverNote` and ROLE_GLOSSARY should follow.
2. **§1.3 L75 locus tag "431b12–13"** for "the thinking faculty thinks the forms in the images." The diagram (and the ROT text) place that line at ~431b2; 431b12–13 carries a different sentence. Worth verifying against the PDF.
3. The `emotion-feedback` **arrow geometry** still draws to A₂; the popup now clarifies the real targets (A₁ + the A₂→A₃ gate) and notes the arrow is schematic. A true geometry split is a larger SVG change, deferrable.
