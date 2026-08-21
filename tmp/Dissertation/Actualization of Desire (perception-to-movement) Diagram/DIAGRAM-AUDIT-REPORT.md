# Interactive Diagram Audit — v7 (Option B) vs. Dissertation §§1.0–1.5

**Date:** 2026-05-27
**Artifact audited:** `option-b-iterations/actualization-chain-v7 — Option B v7.html` (last modified 2026-05-22)
**Sources:** `Source/1.0`–`1.5 …-v2.tex` (§1.5 last modified 2026-05-27)
**Scope:** Read-only investigation. Nothing was changed. This report identifies (A) what is **missing** from the diagram, (B) what is **contradicted / outdated**, (C) **citation/locus** discrepancies, and (D) concrete **popup redraft** recommendations, organized by diagram element and cross-referenced to dissertation section + line and diagram line numbers.

---

## 0. Executive summary

The diagram is a competent, internally consistent rendering of an **earlier generation** of the chapter. Its skeleton (A₀→A₁→A₂[pivot]→A₃[branching]→A₄; doxa as orthogonal band; emotion satellite; hexeis node; recursive/feedback arrows) is sound and matches the dissertation's architecture. But the prose has moved substantially ahead of it in six systematic ways, and there are a handful of outright errors.

**Two structural facts drive most of the drift:**
1. **The diagram (May 22) predates the §1.5 revision (May 27).** §1.5 is also itself mid-revision (it contains four `[PAGE NEEDED]` markers and uses lockdown terminology only partially). §1.5 is therefore the highest-drift section.
2. **The diagram is built almost entirely on primary-Aristotle loci.** The chapter's dense Heideggerian layer (BCAP / GA 18 / *Being and Time*) and its secondary-literature scaffolding (Frede, Caston, Papachristou, Nussbaum, Hawhee, Burke, Gonzalez, O'Gorman, Rickert) — and, critically, **every reference to the advisor Daniel Gross** — are essentially absent from the diagram.

### The "must-fix" list (highest priority first)

| # | Issue | Where | Tier |
|---|-------|-------|------|
| 1 | **A₂ "three characteristics" are wrong.** Diagram says *stable/recallable · formally similar · hinge*; §1.3 says **determinacy · availability · representationality**. The entire Heideggerian "making-present / taking-as / eidos-illumination" reading of A₂ (BCAP 132–137) is absent. | A₂ node, HTML 955–957 | **P0 correctness** |
| 2 | **The "Three Types of Action" typology is never surfaced at A₄.** §1.5's central organizing framework (Type 1 simple appetition / Type 2 habitual-rational / Type 3 evaluatively complex) is scattered and unlabeled; A₄ has only two generic popups and no `passages`. | A₄ node, HTML 978–994 | **P0 structural** |
| 3 | **The emotion-feedback loop is mis-registered.** Diagram routes it *synchronically, "within-episode," back to A₂*; §1.4 L131 **explicitly reassigns it to the diachronic register** and insists the chain stays directional A₀→A₄ within any single actualization. Also renamed "pathetic loop." | `emotion-feedback`, HTML 1989–2029 | **P0 correctness** |
| 4 | **"Settled doxai as hexeis" conflation.** §1.5 L164 now states **"a *doxa* is a taking-as-true, not a disposition … not themselves *hexeis*."** The diagram repeatedly identifies settled doxa *as* hexis. | `SETTLED_DOXAI`, HTML 1245–1280 | **P0 contradiction** |
| 5 | **Factual error: "magnanimity of anger."** The NE anger-virtue is **good temper (*praotēs*)**, not magnanimity (*megalopsychia*). §1.4 L193 uses Ross's "good temper." | `praxis-to-m23-doxa-gate`, HTML 2135/2147 | **P0 factual** |
| 6 | **Naming-principle locus is wrong and self-inconsistent.** Diagram cites *Phys.* V.5, 229b25 (self-flagged as "label drift"); §1.0 and §1.1 both authoritatively cite ***Phys.* V.1, 224b7–9**, which the diagram already has verbatim. | A₀/horizon/naming, HTML 907, 1592, 1838, 3158 | **P1** |
| 7 | **No Gross, no *Being and Time*, no BCAP-phantasia/doxa/emotion passages.** Advisor-rigor zone. Every Gross citation (2005 Intro p.4/p.26; 2017 p.3/p.20) and the load-bearing BT §29 / BCAP 115, 176, 132–137 passages are absent. | global PASSAGES | **P1** |
| 8 | **The "resonant" vocabulary is applied inconsistently.** §§1.2–1.4 make *resonant kinēsis / resonant aisthēma / resonant epithymia* the chapter's spine. The diagram uses it at M₁→A₂ (1343) but **not** at A₁ ("affective valence (pathos)") or A₂ ("dual-aspect"). | A₁ 914, A₂ 947 | **P1** |

### Terminology in flux — flag, don't blindly swap

Per the §1.5 lockdown (project memory, 2026-05-26), several renames are *planned but only partially applied* in the prose. **The diagram currently matches the dominant current-text term**, so do not globally swap until §1.5 finalizes:
- `praxis-hexis` → `ethical hexis` (both coexist in §1.5; diagram already uses "ēthical hexis" once at 2069 — reconcile so the diagram doesn't use both names for one thing).
- `doxa-gate` → `doxastic ratification` (both coexist in §1.5; `DOXA_BAND` already uses "ratifies").
- A₄ `praxis` → genus "actualization of desire" with three terminus-types (appetitive / *poiēsis* / *praxis*). **Not yet relabeled in §1.5**; the diagram's "Completed Action (praxis)" matches current text but conflates genus with one species relative to the direction of travel.

---

## 1. Cross-cutting / global issues

### 1.1 The advisor-rigor citation layer is absent (P1)
Daniel Gross is the dissertation advisor; any use of *Uncomfortable Situations* (2017) or *Heidegger and Rhetoric* (2005) must be verbatim and page-exact. **The diagram contains zero Gross citations** and zero *Being and Time* passages. The Heidegger material that *is* present is confined to GA 18 §17 (the *hexis* passages, 1809–1810, 1863–1864). The following are cited in the prose and missing from the diagram entirely:

- **Gross, *Heidegger and Rhetoric* Intro (2005):** p.4 ("*pathos* is the very substance in which propositional thought finds its objects … no legs to stand on"); p.26 (GA 18 206–207, "the *eidos* of fear draws primarily upon a body's condition … *logoi enyloi*"); pp.113–115 ("passions alter judgements / intrude on *logos*"); p.1 (the SS 1924 epigraph). [§1.2 L57/L115; §1.3 L144; §1.4 L52/L97/L207; §1.5 L182/L201/L218]
- **Gross, *Uncomfortable Situations* (2017):** p.3 (anti-cognitivist framing); pp.20/22–23 ("rhetoric, as a humanistic form of affordance theory … threatening and promising with respect to our human being-in-the-world"). [§1.0 L69; §1.2 L115; §1.3 L144; §1.4 L157; §1.5 L218]
- **Heidegger, *Being and Time*:** §29 H.134/135/137/138 (*Befindlichkeit*, thrownness, "a mood assails us"); §68b H.340 (*Stimmung* temporalizes as *Gewesenheit*); §§15–16; §81 (Innerzeitigkeit/Zeitlichkeit); §65 (the three ecstases); KPM §35. **No BT entry exists in PASSAGES.** [§1.1 throughout; §1.4 L72/L78/L139; §1.5 L216]
- **BCAP (the Aristotle lectures, English ed.):** the diagram has only §17 *hexis* pages. Missing: pp.93–94, 95, 96, 101, 104–105, 110, 124 (phantasia/doxa, §1.3); pp.115, 133–134, 173–174, 176 (emotion/constitutive-threefold, §1.4); pp.132–137 (the A₂ making-present reading, §1.3); pp.264–265, 277–280 (*paschein*/*dechesthai*, §1.3/§1.5).

**Action:** treat this as a coordinated extraction task. When these popups are drafted, every Gross/Heidegger quotation must be verbatim-verified against the PDFs per the standing Gross-rigor protocol.

### 1.2 BCAP-vs-GA 18 citation-form mismatch (P1, rigor)
§1.3–§1.5 cite the Aristotle lectures as **"BCAP" with English-edition page numbers**; the diagram cites **"GA 18" with German Gesamtausgabe pages** (119, 125, 127–128, 122–125). Pages overlap and the verbatim quotes match (e.g. the p.127 "training … reducing deliberation" and p.128 "holding-oneself-open … *dynamis* in the *mesōtēs*" lines), but the two paginations must be reconciled to one convention. The dissertation's choice (BCAP English) should govern; verify the diagram's "GA 18, p.127/128" actually map to the same English passages.

### 1.3 The "resonant" vocabulary is internally inconsistent (P1)
The chapter's load-bearing residue vocabulary — **resonant kinēsis** (the persisting impression) bifurcating into **resonant aisthēma** (formal-epistemic content) + **resonant epithymia** (affective valence) — is introduced in §1.2 (L107–121) and carries through §§1.3–1.5. The diagram:
- uses it correctly at **M₁→A₂** (`roleDetails.unmoved`, 1343: "resonant aisthēma and pathos") — but pairs *aisthēma* with the genus word *pathos* rather than the species *epithymia*;
- **does not use it at A₁** — `greek: 'aisthēma + affective valence (pathos)'` (914);
- **does not use it at A₂** — `greek: 'phantasma — dual-aspect'` (947).

So the residue is named one stage downstream of where §1.2 introduces it, and never with the matched *aisthēma + epithymia* pair. The masthead even advertises "Dual Trace Framework" (694) while never stating what the two traces are. **Recommendation:** standardize on *resonant aisthēma + resonant epithymia* at A₁, A₂, and M₁→A₂; reserve "*pathos*" for the four-senses analysis and the higher-order *pathē*.

### 1.4 "Analogical vs. direct" extension of the three-factor schema — an internal dissertation tension the diagram should track
- **§1.0 L91 fn** says the schema's extension to "perceptual, *phantastic*, and **cognitive** motion is **analogical**."
- **§1.2 L51** says the opposite for perception: "Because *aisthēsis* is a *kinēsis* … the three-factor schema applies to the perceptual motion **directly rather than by analogical extension**."
- **The diagram** sides with §1.0 (ROLE_GLOSSARY 1566; M01 1300–1302: "analogical extension of the III.10 schema").

This is first a **dissertation-internal inconsistency** (§1.0 vs §1.2) the author should resolve. Once resolved, the diagram's M01/ROLE_GLOSSARY caveat must follow. Secondarily: ROLE_GLOSSARY currently flags only M₀→A₁ and M₁→A₂ as analogical and silently treats M₂→A₃ as literal — §1.0 includes cognitive motion in the analogical list.

### 1.5 Doxa terminology: "doxa-gate" vs "doxastic ratification" (P2, in flux)
`SETTLED_DOXAI` and the praxis-hexis arrows use "doxa-gate" (≈17×). §1.4/§1.5 still use "doxa-gate" but have begun moving to "doxastic ratification"; `DOXA_BAND` already uses "ratifies." Hold until §1.5 settles, then align. Also: `DOXA_BAND` mode-3 says doxa "flips" the resonant *orexis*; the prose verb is "**concretizes / articulationally concretizes**."

---

## 2. Node-by-node findings

> Format per node: **Missing · Contradicted/Outdated · Citations · Redraft.** Dissertation refs as (§x.y L##); diagram refs as HTML line.

### 2.0 Header / overall framing (§1.0)
- **Missing.** §1.0's actual frame — *"Rhetorical Phantasia: The Soul's Temporal Medium"* (§1.0 L49/L65/L69) — is unrepresented. There is no popup stating *phantasia* stretches the soul across past/present/future as the medium of all higher operations. The **priority-of-actuality** doctrine ("read the list forward; understand it backwards," §1.0 L84; Met IX.8 1049b4–10) and the **scale-invariant relative-vs-absolute unmoved mover** point (§1.0 L92–93; distinguishing the chain's relative originators from the cosmological Prime Mover) are absent. **Burke's *entelechy* / temporal-vs-formal priority** (§1.0 L99, *Grammar* p.261) — the license for the "nested not linear" architecture — is absent. The clean **three entry-points** schema (sense@A₁ / imagination@A₂ / thought@A₃, §1.0 L78) is only half-present.
- **Contradicted/Outdated.** The masthead subtitle "**Dual Trace Framework**" (694) over-promotes one sub-thesis and mislabels it (the trace content is never given — §1.3). ROLE_GLOSSARY's bolded "*orexis* … is the **sole source of all animal movement** … no movement originates from any other principle" (1566) states more strongly, in the *generic* gloss, than §1.0's careful *relative*-originator framing.
- **Citations.** Three-factor schema: §1.0's block quote uses "433b12–25" (off by one at the start; the verbatim begins at 433b13, which the diagram has correct at 1646). Reconcile to **433b13–25**.
- **Redraft.** (D-1) Change subtitle to e.g. *"Aristotelian Philosophy of Mind · Phantasia as the Soul's Temporal Medium."* (D-2) Add a *phantasia*/temporal-medium framing popup (cite Gross 2017 pp.22–23 + BCAP 133–134 verbatim). (D-6) Add an interlock/priority sentence to the schema chip ("each completed actuality both *names* the preceding motion [Phys V.1 224b7–8] and is the relative unmoved originator of the next [Met IX.8 1049b4–10]"). Qualify the ROLE_GLOSSARY "sole source" claim.

### 2.1 Motion-and-Time outer frame (§1.1)
- **Verified correct.** The restructuring (Motion-and-Time = enclosing *horizon*, not a node; A₀ = the sensible object/genetic origin) is **directly vindicated** by §1.1 ("situated *within* motion and time as the encompassing horizon," §1.1 L51/L55). The diagram's editorial note ("That was a category error: motion and time are the ontological background … not a stage," HTML ~3134) paraphrases §1.1. Keep.
- **Missing.** Nearly all of §1.1's distinctive argument lives only in the prose: **kinēsis as *energeia ateles* / "Being-in-Motion-and-Time"** (§1.1 L59–71); **priority of actuality** (three senses, §1.1 L73–87); the **relational structure of kinēsis** (single shared *energeia* of agent+patient, Phys III.2 202a13–20, Thebes–Athens III.3, §1.1 L89–99); **time as number of motion** with the load-bearing *counted-vs-counting* distinction (§1.1 L101–119, only the bare 219b1 definition is in the frame popup); **the soul's constitutive role** / soul-as-counter / "time without soul is ontologically incomplete" (§1.1 L121–129); the **Heideggerian register** (Bewegtheit/*Da*-Charakter; Innerzeitigkeit from Zeitlichkeit; Struever in *Heidegger and Rhetoric*, ed. Gross & Kemmann 2005).
- **Redraft.** (D-2) Add frame popups: "Kinēsis as energeia ateles," "Priority of actuality," "Time as the number of motion" (add counted/counting + soul-as-counter), and a "Heideggerian register" popup (verbatim-verified). Add Phys III.1 201a11–14 (already in PASSAGES), Met XII.6 1071b6–11, Phys IV.14 223a21–26 to the frame's `passages`.

### 2.2 A₀ — "Sensible Object in Actuality" (§1.1)
- **Contradicted (P1).** §1.1 is emphatic and repeated that A₀ is a **dyad**: "the dyadic structure of the sensible object **and the *aisthētikon*** … the perceiver-perceptible pair" (§1.1 L51/L55/L97; cf. §1.0 L78/L95 "dyadic first actuality of sensible object and faculty of sense"). The diagram's A₀ is a single object — `title: 'Sensible Object in Actuality'`, `desc: '…the external source from which the chain begins'` (888–890); the faculty-of-sense half is dropped. The "Ontological character" popup's clean "initiates … **without itself undergoing any alteration**" (897) also flattens §1.1's relational doctrine (perception is a *joint* actualization, "a single actuality of both alike," and being-affected here is the *preservative* not destructive sense, §1.1 L69/L93/L97).
- **Contradicted (nuance).** "Structural analogy … analogous to the unmoved mover in Aristotle's broader metaphysics" (901–902) is looser than §1.1's precise framing of A₀ as "the **limit case**: an actuality without prior actuality, since motion and time are co-eternal" (§1.1 L53). Distinguish the chain's *relative* originator from the Prime Mover.
- **Citations.** "Naming principle" cite *Phys.* V.5, 229b25 (907) is wrong (see 1.6 below / §1.1 C1). A₀ `passages: ['DA II.5, 417a–b']` is an editor-built composite; §1.1's primary A₀ loci (Phys III.2 202a13–20; DA III.2 425b26–27) are not attached.
- **Redraft.** (D-1/D-4) Retitle/redesc A₀ as the **conjoint first actuality of sensible object + *aisthētikon*** situated within the motion-time horizon; recast "Ontological character" as one shared *energeia* under two *logoi* (Phys III.2; DA III.2 425b26); soften "without alteration" to the preservative-*paschein* reading; reframe "Structural analogy" as the co-eternity limit case; fix the naming cite to Phys V.1 224b7–9.

### 2.3 M₀→A₁ "Perceptual Motion" + A₁ "Completed Perception" (§1.2)
- **Missing (P1).** The **dual-resonance thesis** is the spine of §1.2 and is absent at this stage: *resonant kinēsis* (the persisting impression, §1.2 L107–117), bifurcating into *resonant aisthēma* + *resonant epithymia* (§1.2 L119–121). M01 has a "Destruction condition" popup but **no "residual trace / persisting impression" popup at all**, though §1.2's whole §"Resonant Kinēsis" hangs on it. The **Four Senses of *Pathos*** (Met Δ.21, 1022b15–21, with Heidegger's BCAP 131–132 gloss; §1.2 L81–105) are **entirely absent** (the diagram's only "Δ 20, 1022b 4" is the *hexis* definition, a different passage). The **preservative-vs-corruptive *alloiōsis*/*paschein*** distinction (§1.2 L83–85/L101) appears only as the corruptive limit case.
- **Contradicted.** A₁ `greek: 'aisthēma + affective valence (pathos)'` (914) uses the genus word *pathos* where §1.2 L113 reserves the species *epithymia* for the appetitive residue — blurring the basic-valence / higher-order-*pathē* boundary §1.2 makes its closing finding (L139). M01's "analogical extension" caveat (1292/1300–1302) **contradicts §1.2 L51** ("applies … directly," because *aisthēsis* is itself a *kinēsis*, DA II.5 416b33–417a1) — see 1.4 above.
- **Citations.** A₁ summary cite `DA III.7, 431a8–10` (916) is **truncated**: §1.2 (and §1.5) use **431a8–14**, and the extra a10–14 clause ("one in substrate, two in being") is exactly what grounds the dual-resonance and perception/appetite co-constitution. The diagram's PASSAGES text for 431a8–10 stops before this clause. Also absent from PASSAGES: Met IX.6 1048b10–34; *De Sensu* 447a3–7/446b8–9; *De Insomniis* 459a24–28/459b1–6; *De Memoria* 450a26–b11/453a14–32; Met Δ.21 1022b15–21; DA II.5 416b33–417a1. Wax/signet cite "424a17–24" (diagram) vs §1.2 "424a18–24" (trivial).
- **Redraft.** (D-1) A₁ `greek` → "aisthēma + resonant epithymia (dual resonance)"; extend cite to 431a8–14. (D-2) Add A₁ popups "Dual resonance: aisthēma + epithymia" and "Four senses of pathos (Met Δ.21)." (D-3) Add M01 popup "Enmattered *alloiōsis* & the persisting trace" (preservative *paschein* → *resonant kinēsis*). (D-4/D-5) Rewrite the M01 movedMover caveat per §1.2 L51 ("direct, not analogical — *aisthēsis* is itself a *kinēsis*"), pending resolution of the §1.0/§1.2 internal tension (1.4).

### 2.4 A₂ — "The Phantasma Proper" (§1.3) — **most out of date**
- **Contradicted (P0).** The "Three essential characteristics" popup (955–957) lists *(1) stable/recallable · (2) formally similar · (3) hinge between perception and thought*. §1.3 L53 names a **different** triad: **determinacy · availability · representationality**. The mapping is broken: diagram (1)≈availability, (2)≈representationality, **determinacy is dropped**, and **(3) "hinge" is not one of §1.3's three** (the hinge/architectonic point is a separate claim, §1.3 L49–51). §1.3 L55–57 further recasts all three as "**structural moments of the soul's disclosedness toward the *eidos***" — a reframing the diagram entirely lacks.
- **Missing (P0).** The **entire Heideggerian A₂ reading** (BCAP 132–137): *phantasia* as *poiēin paron* / "making-present"; the anti-mental-theater claim ("not … inner copies … a *mode of being-in-the-world*," BCAP 134); **nous-as-light / eidos-illumination** ("*phantasia* is the light in which the look of something is seen and felt," BCAP 135); the bodily-being-in-the-world grounding of *noein* (BCAP 134). The **taking-as** function and the formula "**pre-propositional but not pre-positional**" (§1.3 L61). The **three worked cases of MA 701a32–33** (aisthēsis/phantasia/nous each "saying 'this is drink'," with the *dynamis→energeia* analysis of resonant epithymia, §1.3 L61–69). The secondary scaffolding: **Frede** (faculty/product), **Papachristou** (three grades), **Caston** (problem of error), **Nussbaum/Hawhee** (rhetorical vision), **Burke/Hazlitt** (identification of appetite and imagination) — all absent or barely present.
- **Contradicted (vocab).** `greek: 'phantasma — dual-aspect'` (947) vs the chapter's "dual-trace" / *resonant aisthēma + resonant epithymia* (§1.3 L49/L129). Internally inconsistent with M12 (1343), which does use the resonant pair.
- **Citations.** None of §1.3's BCAP page-cites (134, 135, 93–94, 96, 101, 104–105, 110, 124, 264–265) are in the diagram. **Gross 2017 pp.22–23** (§1.3 L144) absent. Locus conflict: §1.3 L75 attributes "the thinking faculty thinks the forms in the images" to **431b12–13**, but the diagram's PASSAGES puts that text at **431b2–9** and assigns 431b12–13 to a *different* sentence ("that which is true or false … absolute/relative"). The diagram's assignment appears correct — **flag §1.3 L75's locus tag to the author.** The "Dual origin" (MA 702a20–21) and the M23 "gatekeeping condition" (De Insomn 460b3–16) content is diagram-present but has no anchor in §1.3 specifically (the gatekeeping point is grounded in §1.4, not §1.3).
- **Redraft.** (D-1) Rewrite "Three essential characteristics" to determinacy/availability/representationality + the disclosedness recasting. (D-2) Add "Making-present / taking-as (BCAP 132–137)" popup (needs verbatim BCAP 134/135 added to PASSAGES). (D-3) Add "Three routes to 'this is drink' (MA 701a32–33)." (D-4) Fix `greek`/`desc` to the resonant-pair vocabulary. This node needs the most work of any in the diagram.

### 2.5 M₂→A₃ "Cognitive Motion" + A₃ row (§1.3)
- **Mostly aligned.** A₃ `desc` (974) correctly gives the three orientational modes + orthogonal doxa, matching §1.3/§1.0 L101. The A3-NOESIS / A3-MEMORY / A3-DISCURSIVE(Speculative+Deliberative) nodes and their primary-Aristotle loci are **clean and correctly aliased** (On Memory 449b22–30; DA III.9 432b27–433a3; DA III.11 434a5–10; etc.).
- **Missing.** White (phantasia as "storehouse of forms," §1.3 L75); Heidegger "deliberation as seeking" (BCAP 96, §1.3 L93); Kisiel/Struever; the long Rickert/Gibson/Uexküll disclosure-as-occlusion footnote (§1.3 L140); Gonzalez/O'Gorman on phantasia as the orator's medium (§1.3 L91).
- **Contradicted (minor).** M23 `modes.items[2]` lists mode 3 as "**Deliberative phantasia**" only (1414), under-representing the discursive mode, which §1.3/§1.0 give **both** deliberative *and* speculative sub-domains (the A3-DISCURSIVE parent already handles both). Rename to "Discursive (deliberative + speculative) phantasia."
- **Redraft.** (D-6) Add speculative to the M23 modes list; optionally add the White/Heidegger-seeking citations to the relevant sub-nodes.

### 2.6 DOXA band (§1.3 + §1.4)
- **Aligned with caveats.** The DA-loci popups (asymmetry of will 427b17–21; three conditions pistis/pepeisthai/logos 428a19–24; sun passage 428b2–7; supervenience) match §1.3 (L107/L117/L119/L134). "Doxa's three functional modes" (terminus / habitual-rational / evaluatively-complex, 1235–1237) maps onto §1.3/§1.4/§1.5.
- **Missing.** The Heideggerian doxa apparatus (BCAP 93–94 "having-present"; 101 "average everyday discoveredness"; 110 "rhetoric has its sight on *krisis*"; §15e "doxa as basis of theoretical negotiating"), O'Gorman's "opinion's external grounding" (§1.3 L133, the section's only `\autocite`), and **Gross 2017** affordance framing — all absent.
- **Contradicted (vocab).** Mode 3 uses "the **doxa-gate**" and "**flips**" the resonant orexis (1236); prose prefers "**doxastic ratification**" and "**concretizes**." Hold the rename per 1.5; change "flips"→"concretizes" now.
- **Redraft.** (D-5) Add a Heideggerian-doxa popup (BCAP 93–94/101/110 + Gross 2017 verbatim); soften the gate/flip vocabulary.

### 2.7 M₃→A₄ "Orektikon Motion" + Emotion composite (§1.4)
- **Contradicted (P0): tripartite → five-fold.** `EMOTION_COMPOSITE` "Tripartite composite" (1528) and M34 `emotion` (1486) give emotion as *cognitive evaluation + conative orientation + somatic alteration*. §1.4's Conclusion (L157–185) supersedes this with a **five-fold** structure: (1) disposition (*Befindlichkeit*), (2) toward-which **and toward-whom** (intentionality + *Mitsein*/Being-with), (3) bodily form, (4) **temporal range** (three ecstases), (5) **disclosive function** (bringing-to-*krisis*/*logos*). The diagram omits elements 4 and 5 — the two §1.4 says carry "the heaviest ontological weight."
- **Contradicted (P0): the loop's register.** See must-fix #3. `emotion-feedback` (1989–1993) = "Emotion → A₂ · **within-episode**." §1.4 L131: "the *De Insomniis* phenomenon belongs to the **diachronic** register … the chain remains structurally directional from A₀ to A₄ within any single actualization." §1.4 L133 further locates two mechanisms: *Stimmung*-saturation at the **A₁** basic-valence input, and corrective-faculty impairment at the **A₂→A₃** corrective gate — not a generic "back to A₂" loop.
- **Contradicted (terminology).** Diagram "feedback path" / "Emotion Feedback" vs §1.4's deliberate rename **"the pathetic loop"** (§1.4 L119 heading, recurring). "Pathos vs. emotion … **supervene**" (1542–1543) vs §1.4's "**two articulational concretions of one ontological structure**" on a three-dimensional magnitude-axis (hedonic intensity / existential weight / cognitive articulation), explicitly anti-stratification (§1.4 L64/L68).
- **Missing.** The "**E-motion is Motion / paschein**" opening frame (§1.4 L50–52/L68); the **Rhetoric's constitutive threefold** (pathos as change + *krisis* + hedonic tonality, BCAP 115, §1.4 L86–92); the **diachronic *Stimmung*-saturation** mechanism as such; the whole **BT *Befindlichkeit*/*Stimmung*/*Geworfenheit*** apparatus; the "From the Lectures to *Being and Time*" scholarly arc.
- **Citations.** Gross 2005 p.4/p.26 and 2017 p.3/p.20 absent (advisor rigor). BT §29 H.135/138, §68b H.340 absent. BCAP 115 and 176 (the two block-quotes §1.4 hangs its thesis on) absent. **De Insomniis verbatim mismatch:** §1.4 L125 "the amorous person **by the object of his desire**" vs diagram 1675 "by amorous desire" (different ROT/Beare renderings — reconcile). Missing **Rhetoric II.6 shame** definition (1383b13–17) though §1.4 uses shame as a recurring three-ecstasis example.
- **Redraft.** (D-1) "Tripartite"→"Five-fold composite" (EMOTION_COMPOSITE + M34). (D-2) Add "Pathos as kinēsis (E-motion is Motion)" popup. (D-3) Re-label "Pathos vs emotion" as "Two articulational concretions" and drop the supervenience/strata language. (D-5) **Rename `emotion-feedback` → "The Pathetic Loop (diachronic)"**, re-register it (two mechanisms: *Stimmung*-saturation→A₁; corrective impairment→A₂→A₃ gate), and drop "within-episode."

### 2.8 Hexeis node + praxis-hexis arrows (§1.4 introduces bivalence; §1.5 operationalizes)
- **Contradicted (P0): doxa-is-not-a-hexis.** `SETTLED_DOXAI` ("Settled doxai as hexeis," 1242) says "the universal premise is itself a doxa — a settled belief **held as a disposition**" (1267) and "the settled hexis **is doxastic**" (1276). §1.5 L164 now states: "they are **not themselves *hexeis*, for a *doxa* is a taking-as-true, not a disposition**" (L147: doxa is "**not a disposition**"). Genuine contradiction with current text. (The node's `greek` field at 1251 already hedges toward the corrected view — make the body consistent.)
- **Factual error (P0).** `praxis-to-m23-doxa-gate` (2135/2147) says "**magnanimity of anger**" / "the magnanimous person's." The NE anger-virtue is **good temper (*praotēs*)**, not magnanimity (*megalopsychia*). §1.4 L193 uses Ross's "good temper." Fix.
- **Missing.** The *energeia*/*kinēsis* grounding of the bivalence: §1.5 L186 now asserts ***praxis*:*poiēsis*::*energeia*:*kinēsis*** (Met IX.6 1048b30–36 tense-test). The diagram renders the bivalence only via GA 18 deliberation-reduction vs holding-open — `poiēsis`, `energeia atelēs`, `1048b` appear **zero** times.
- **Aligned (good).** The technē-hexis (reduce deliberation) / praxis-hexis (holding-oneself-open for the *kairos*) contrast (1256–1262) matches §1.4 L195–201 and §1.5 L162–188; GA 18 §17 / Met Δ.20 / NE II.4 loci match; the two-level modulation (basic-valence@A₁ + doxa-gate) matches §1.5 L182; "ēthical hexis" already appears at 2069.
- **Citations.** Diagram-only loci to verify against §1.5's actual argument: NE VII.3 1147a25–b3 / 1147a14–24 (akrasia), Phys II.3 195b21–25, NE III.7 1115b7–13. §1.5's four `[PAGE NEEDED]` BCAP markers (→ ~pp.133–152) and the *Heidegger and Rhetoric* pp.113–115 anchor are paired open TODOs the diagram should pick up once resolved.
- **Redraft.** (D-3) Remove the "doxa is a hexis" conflation. (D-4) Fix "magnanimity"→"good temper (*praotēs*)." (D-5) Add the Met IX.6 *energeia*/*kinēsis* grounding (new passage 1048b30–36). (D-4-term) Flag the pending praxis-hexis→ethical-hexis rename; reconcile with the existing "ēthical hexis" usage.

### 2.9 A₄ — "Completed Action (praxis)" (§1.5) — **biggest structural gap**
- **Missing (P0): the Three Types of Action.** A₄ has only "Full kinetic-affective history" and "Recursive, not linear" (984–993) and **no `passages` array**. §1.5's central framework (Type 1 Simple Appetition / Type 2 Habitual-Rational / Type 3 Evaluatively Complex, §1.5 L127–138) is scattered (Type 1 ≈ `pure-appetitive` bypass; Type 2/3 language only inside the Hexeis node; the `DOXA_BAND` three-modes is the closest but is buried and presupposes doxa, excluding Type 1). A reader cannot recover the typology at the terminus where §1.5 places it.
- **Missing.** Type 1's **pre-doxastic *kritikon* recoil** ("the human being who flinches at an unexpected blow … the *orexis* recoils before any deliberative register," DA III.7 431a8–12, §1.5 L130) — the bypass arrow describes only the *pursuit* side. The closing **"affective architecture of being-in-the-world"** synthesis (§1.5 L212–220) — the phrase appears zero times in the diagram. The **five deferred open problems** (§1.5 L227–231). `enargeia` (zero occurrences in diagram; §1.5 L155 makes it the gate-opening mechanism).
- **Contradicted/in-flux.** A₄ title "Completed Action (praxis)" (980) matches current §1.5 text (still calls A₄ "completed *praxis*") but **conflates the genus with one species** relative to the planned relabel (genus = "actualization of desire"; terminus-types = appetitive / *poiēsis* / *praxis*). Do not relabel yet — §1.5 has only the seeds (L186, L205). The `recursive-loop` and `hexis-sedimentation` arrows are sound; the "Doxastic vs ēthical hexis" popup (2069–2075) correctly notes the diagram tracks only doxastic sedimentation.
- **Citations.** §1.5 uses DA III.7 **431a8–12/431a8–14**; diagram has only 431a8–10 (extend). BCAP-vs-GA18 form (1.2). The four `[PAGE NEEDED]` markers (1.1/§1.5 C3) gate the Gross/BCAP additions.
- **Redraft.** (D-1) **New A₄ popup "Three Types of Action"** with a `passages` array (MA 701a29–b1; MA 701a7–16; DA III.10 433b10–18; DA III.7 431a8–14; DA III.3 427b21–24; Rhet II.1 1378a21–23), cross-referencing the bypass (Type 1), `settled-doxai-to-m23` (Type 2), and `praxis-to-m23-doxa-gate` (Type 3) so the scattered pieces resolve to the named typology. (D-2) New A₄ synthesis popup "Affective Architecture of Being-in-the-World" (with the Gross/Heidegger verbatim material). (D-7) Defer the genus relabel and the three-terminus-type restructure until §1.5 finalizes — flag as the largest future structural change.

---

## 3. Citation & verbatim-rigor appendix

### 3.1 Locus discrepancies to reconcile
| Locus / claim | Dissertation | Diagram | Resolution |
|---|---|---|---|
| Naming-from-terminus | Phys V.1 224b7–9 (§1.0 L76/84/95; §1.1 L51/81) | Phys V.5 229b25 (self-flagged "drift"); also V.1 224b7-8 at 1592 | Use **V.1 224b7–9** (diagram already has it verbatim at 1669) |
| Three-factor schema block | "433b12–25" (§1.0 L89) | 433b13–25 (1646, correct) | Fix prose to **433b13–25** |
| "thinks the forms in the images" | 431b12–13 (§1.3 L75) | 431b2–9 (1738, appears correct) | **Flag §1.3 L75 to author** |
| Perception/appetite identity | 431a8–**14** (§1.2, §1.5) | 431a8–10 (truncated, 1637) | Extend diagram PASSAGES to **431a8–14** |
| Anger-virtue | "good temper" / *praotēs* (§1.4 L193) | "magnanimity" (2135/2147, **error**) | Fix to **good temper (*praotēs*)** |
| *hexis* def. | Δ.20 1022b4 | "Δ 20, 1022b 4" | OK (spacing only) |
| De Insomniis | "by the object of his desire" (§1.4 L125) | "by amorous desire" (1675) | Reconcile translation source |
| BCAP pagination | English ed. pages | GA 18 German pages | Reconcile to BCAP English |

### 3.2 Passages cited in prose but absent from the diagram's PASSAGES registry
- **Gross:** *Heidegger and Rhetoric* (2005) pp.1, 4, 26, 113–115; *Uncomfortable Situations* (2017) pp.3, 20, 22–23.
- **Being and Time:** §29 H.134/135/137/138; §68b H.340; §§15–16; §81; §65; KPM §35.
- **BCAP:** 93–94, 95, 96, 101, 104–105, 110, 115, 124, 131–132, 132–137, 173–174, 176, 264–265, 277–280.
- **GA 18:** §21 fear (168–169, 175); 206–207 (enmattered eidos).
- **Aristotle:** Met IX.6 1048b10–34 & 1048b30–36; Met Δ.21 1022b15–21; Met XII.6 1071b6–11; *De Sensu* 446b8–9 / 447a3–7; *De Insomniis* 459a24–28 / 459b1–6; *De Memoria* 450a26–b11 / 453a14–32; DA II.5 416b33–417a1; Phys III.2 202a13–20; Phys III.3 202a21–24; Phys IV.14 223a21–26; DA III.2 425b26–27; Rhetoric II.6 1383b13–17 (shame).
- **Secondary:** Frede, Caston, Papachristou, Nussbaum, Hawhee, Burke (Hazlitt/identification), Gonzalez, O'Gorman, White, Kisiel, Struever, Michalski, Rickert/Gibson/Uexküll.

All Gross/Heidegger additions require verbatim PDF verification before insertion (advisor-rigor protocol).

---

## 4. Prioritized action checklist

**P0 — correctness / structural (do first):**
1. Rewrite A₂ "three characteristics" → determinacy/availability/representationality; add the BCAP 132–137 making-present popup. (§2.4)
2. Add the "Three Types of Action" popup + `passages` to A₄; bind the scattered Type-1/2/3 pieces to it. (§2.9)
3. Rename & re-register `emotion-feedback` → "Pathetic Loop (diachronic)"; two mechanisms (A₁ saturation; A₂→A₃ gate); drop "within-episode." (§2.7)
4. Remove the "settled doxa **is** a hexis" conflation in `SETTLED_DOXAI`. (§2.8)
5. Fix "magnanimity of anger" → "good temper (*praotēs*)." (§2.8)
6. Upgrade emotion "tripartite" → "five-fold." (§2.7)

**P1 — high-value alignment:**
7. Fix the naming-principle locus everywhere → Phys V.1 224b7–9. (§2.0/2.2)
8. Restore A₀ as the **dyad** (sensible object + *aisthētikon*). (§2.2)
9. Standardize the *resonant aisthēma + resonant epithymia* vocabulary at A₁/A₂/M₁→A₂; fix masthead subtitle. (§1.3/2.0/2.3/2.4)
10. Add the Gross / *Being and Time* / BCAP-phantasia-doxa-emotion citation layer (verbatim-verified). (§1.1)
11. Add the Four Senses of *Pathos* (Met Δ.21) and the *resonant kinēsis* residual-trace popup to A₁/M01. (§2.3)
12. Extend DA III.7 to 431a8–14; reconcile the BCAP/GA 18 pagination. (§3.1)

**P2 — pending §1.5 finalization (flag, don't act):**
13. `praxis-hexis` → `ethical hexis`; `doxa-gate` → `doxastic ratification`; A₄ genus relabel to "actualization of desire" with appetitive/*poiēsis*/*praxis* terminus-types and the *praxis*:*poiēsis*::*energeia*:*kinēsis* grounding (Met IX.6). (§2.8/2.9)

**Dissertation-internal items to resolve (not diagram bugs):**
14. §1.0 ("analogical") vs §1.2 L51 ("direct") on the perceptual three-factor extension. (§1.4 above)
15. §1.3 L75 locus tag "431b12–13." (§3.1)
16. §1.5's four `[PAGE NEEDED]` BCAP markers + the compound BCAP/*Heidegger-and-Rhetoric* citation at §1.5 L136. (§2.9)

---

*Compiled from six per-section deep audits (§1.0–§1.5) cross-referenced against the v7 diagram's JS data model (`actualities`, `a3Nodes`, `DOXA_BAND`, `SETTLED_DOXAI`, `motions`, `EMOTION_COMPOSITE`, `ROLE_GLOSSARY`, `PASSAGES`, `flowArrows`). No files were modified.*

---

## 5. Closure status as of 2026-05-28 (post-v8, post-v3)

This section reconciles the May-27 audit findings against (a) what v8 actually applied per `V8-CHANGELOG.md` and (b) what changed in the §§1.0–1.5 v3 source files (finalized 2026-05-28). It also documents the 10 net-new findings v3 surfaced and the verbatim_passages.md coverage state as of 2026-05-28.

### 5.1 Status reconciliation — audit §0 must-fix table + §4 checklist items #1–#16

| # | Title (terse) | STATUS | EVIDENCE | NEXT-ACTION |
|---|---|---|---|---|
| 1 | A₂ three characteristics corrected | **CLOSED** | V8-CHANGELOG §A items 10–13; v3 §1.3 L55–57 confirms determinacy/availability/representationality framing | — |
| 2 | Three Types of Action popup @ A₄ | **PARTIAL → READY (4 not 3)** | V8-CHANGELOG §C item 1 deferred; v3 §1.5 L128–157 now specifies **Four** Types (Epithymetic / Thymotic / Bouletic / Prohairetic) | v9 Batch A — two-popup approach (Overview + Details) |
| 3 | emotion-feedback → "Pathetic Loop" | **CLOSED** | V8-CHANGELOG §A items 22–23; v8 HTML line ~2038 confirmed | — |
| 4 | Remove "settled doxa **is** a hexis" conflation | **PARTIAL → READY** | V8-CHANGELOG §C item 3 deferred; v3 §1.5 L167 verbatim: *"a doxa is a taking-as-true, not a disposition"* | v9 Batch B |
| 5 | "magnanimity of anger" → "good temper" | **CLOSED** | V8-CHANGELOG §A item 2; v8 HTML line ~2195 confirmed | — |
| 6 | Naming-principle locus Phys V.1 224b7–9 | **CLOSED** | V8-CHANGELOG §A item 1; alias created, locus fixed everywhere | — |
| 7 | Gross / BT / BCAP passage layer | **PARTIAL → MOSTLY UNBLOCKED** | V8 has BT §29 H.137 + BCAP p. 135. verbatim_passages.md (2026-05-27/28) now also verifies: Gross 2005 p. 4 & p. 26, Struever p. 109, BCAP §17 + pp. 131/132/134/122–125/98–99, BT §32 H.150, §65 H.328/329, §72 H.374, §29 H.135 | v9 Batch G wires the unblocked entries; Phase 3 documents the ~22 remaining gaps |
| 8 | A₀ as dyad (sensible object + aisthētikon) | **CLOSED** | V8-CHANGELOG §A items 4–6; v3 §1.1 L51–55 validates dyadic structure | — |
| 9 | Resonant aisthēma + epithymia vocabulary | **CLOSED** | V8-CHANGELOG §A items 7–9; v3 §1.2 L107–121 confirms | — |
| 10 | Gross / BT / BCAP specific refs | **PARTIAL → MOSTLY UNBLOCKED** | See #7 above. Specific wirings in v9 Batch G | Wire available; document gaps |
| 11 | Met Δ.21 verbatim popup @ A₁ | **PARTIAL → BLOCKED** | V8-CHANGELOG §A item 9 added the label; verbatim text **NOT yet** in verbatim_passages.md (only Δ 20 1022b4 entry exists) | v9 Batch D — `[VERBATIM PENDING]` skeleton; Phase 3 registry |
| 12 | BCAP vs GA 18 pagination | **PARTIAL → POLICY APPLIED** | v9 plan codifies: preserve verbatim_passages.md's exact key form (`'GA 18 §17, pp. X'` or `'GA 18, p. X'` — always with GA volume prefix + English print page) | v9 Batch G verification step |
| 13 | Terminology renames pending §1.5 | **PARTIAL → READY** | V8-CHANGELOG §C item 4 deferred; v3 §1.5 L163/L167/L184 confirms doxastic-ratification + ethical-hexis lockdown | v9 Batch C |
| 14 | §1.0 (analogical) vs §1.2 (direct) tension | **OPEN — prose-level** | V8-CHANGELOG §D.1 deferred; v3 keeps **both** readings (§1.0 L91 fn still "analogical"; §1.2 L51 still "directly") | Phase 4 Item A — prose decision pending; no diagram action |
| 15 | §1.3 L75 locus tag 431b12–13 | **OPEN — prose-level** | V8-CHANGELOG §D.2; v3 §1.3 L75 still cites 431b12–13 but verbatim is at 431b2 (diagram's PASSAGES is correct) | Phase 4 Item B — prose errata pending; no diagram action |
| 16 | §1.5 four [PAGE NEEDED] BCAP markers | **PARTIAL → STRUCTURALLY READY** | v3 §1.5 metadata still has [PAGE NEEDED] markers in §§4–7 for BCAP ~133–152; structural placement is clear | Wait for author page-fills; v9 wires what's verified |

### 5.2 Net-new findings from v3 — items #17–#26

These are findings that did NOT exist in the May-27 audit but are surfaced by §1.5 v3 + the §§1.0–1.3 ripple work + the updated verbatim_passages.md (2026-05-28 cross-check):

**#17. Four Types of Action (replaces "Three Types").** §1.5 v3 §"Four Types of Action" (L128–157) specifies Epithymetic / Thymotic / Bouletic / Prohairetic; Thymotic and Prohairetic are new vs. the audit's Three-Type assumption. *Diagram action:* Batch A two-popup restructure.

**#18. "Affective Architecture of Being-in-the-World" is now a labeled subsection** (§1.5 L234). The closing synthesis carries explicit Heideggerian framing — *Befindlichkeit*, five-fold composite, recursive loop + hexis sedimentation jointly constitute the agent's affective architecture across episodes. *Diagram action:* Batch E synthesis popup @ A₄.

**#19. Articulational concretion as the doxa→pathē transition verb.** §1.5 L100–101 makes "articulationally concretizes" load-bearing for the basic-valence-to-civic-passion movement. v8 has this at DOXA_BAND mode 3; v3 grounds it explicitly. *Diagram action:* Batch H item 1 — language consistency sweep.

**#20. Mitsein/Gewesenheit deeper integration.** §1.5 L155 names *Mitsein* for the Thymotic case; §1.3 L80–83 grounds resonant kinēsis in ecstatic *Gewesenheit*. *Diagram action:* Batch H items 2 & 7 — Memory popup + EMOTION_COMPOSITE.

**#21. Five-fold composite axis elaboration.** §1.4 L98–102 specifies the five axes (disposition / toward-which-whom + Mitsein / bodily form / temporal range / disclosive function). v8 labels "five-fold" but doesn't elaborate axes 4 and 5 (temporal, disclosive). *Diagram action:* Batch H item 3 — EMOTION_COMPOSITE popup 2 expansion.

**#22. Hexis bivalence philosophical grounding.** §1.5 L184–200 grounds the technē-vs-ethical-hexis distinction in Heidegger BCAP pp. 127–128 (reduces deliberation vs. holds-open). *Diagram action:* Batch H item 5 — surface §1.5 framing in Hexeis node popup 1 (which already has the GA 18 §17 cite).

**#23. Pathetic Loop with synchronic AND diachronic registers.** §1.5 L215 names the loop "Synchronic Pass and Diachronic Sedimentation." v8 has only the diachronic register. *Diagram action:* Batch H item 8 — emotion-feedback popup update.

**#24. Doxastic ratification as two-axis threshold.** §1.5 L163–178 formalizes the gate as: rational axis (doxa formation) + content axis (evaluative complexity) — both must converge. *Diagram action:* Batch H item 9 — DOXA_BAND popup 6 structural note.

**#25. Resonant kinēsis ↔ Gewesenheit linkage.** §1.3 L80–83 explicitly parallels the persisting resonant trace to Heideggerian *Gewesenheit*. *Diagram action:* Batch H item 7 — Memory popup.

**#26. Civic-passions terminology in flux.** verbatim_passages.md line 925 notes the user has paused the pathē→civic-passions rename pending review. Diagram must NOT preempt. *Diagram action:* Batch H item 10 — TODO HTML comment, no terminology change.

### 5.3 Verbatim_passages.md coverage state (2026-05-28 cross-check)

**Verified and wireable in v9** (Batch G):
Gross 2005 p. 4 (line 898) · Gross 2005 p. 26 (line 893) · Struever p. 109 (line 887) · BCAP §17 pp. 119/125/127–128 (line 518) · BCAP pp. 122–125 (line 580) · BCAP p. 131 / p. 132 / p. 134 / p. 135 (lines 538/557/564/571) · BCAP pp. 98–99 (line 831) · BT §29 H.135 (line 626) · BT §29 H.137 (line 629) · BT §32 H.150 (line 638) · BT §65 H.328/329 (lines 657/663) · BT §72 H.374 (line 681) · Met IX.6 1048b30–36 (line 813)

**Verbatim gaps documented in Phase 3 `VERBATIM-GAPS-2026-05-28.md`** (~22 items):
Gross 2017 *Uncomfortable Situations* (pp. 3, 20, 22–23) · Gross 2005 *Heidegger and Rhetoric* Intro (pp. 1, 113–115) · BCAP (pp. 93–94, 95, 96, 101, 104–105, 110, 115, 124, 132–134, 173–174, 176, 264–265, 277–280) · BT §29 H.134/H.138 · BT §68b H.340 · BT §§15–16 · BT §81 · KPM §35 · Met Δ.21 1022b15–21 · Rhetoric II.6 1383b13–17 · NE III.2 1111b21–30 · NE III.3 1112b12–19 · *enargeia* concept placeholder

### 5.4 Prose-level items deferred (Phase 4)

See Phase 4 below — three items remain at the prose level (analogical/direct tension, §1.3 L75 locus drift, A₄ genus relabel question). No diagram action; flagged for author resolution.

---

## 6. Prose-level items flagged for author resolution (2026-05-28)

These three items surfaced during the May-27 audit and remain unresolved in v3. They cannot be fixed in the diagram without prose-level decision; documenting here so they are not lost.

### Item A — §1.0 vs §1.2 internal tension on three-factor schema extension

**v3 §1.0 L91 fn (still reads):** *"The schema introduced by Aristotle is specifically for locomotive action, and its extension to perceptual, phantastic, and cognitive motion is analogical."*

**v3 §1.2 L51 (still reads):** *"Because aisthēsis is a kinēsis, the three-factor schema… applies to the perceptual motion directly rather than by analogical extension."*

**State in v3:** both readings coexist. §1.0 frames the schema's original (locomotive) home with an "analogical" hedge for downstream applications; §1.2 argues that perception, being itself a *kinēsis* (DA II.5 416b33–417a1), licenses *direct* (non-analogical) application. The diagram's M01 `roleDetails` follows §1.0 ("analogical extension of the III.10 schema"), consistent with §1.0 but not §1.2.

**Diagram action:** none. **Author decision needed:** reconcile §1.0 ↔ §1.2, or explicitly mark the difference as deliberate (locomotive-origin vs. perceptual-instantiation). Once decided, v10 can update M01 / ROLE_GLOSSARY accordingly.

### Item B — §1.3 L75 locus tag drift `(De Anima III.7, 431b12-13)`

**v3 §1.3 L75 cites:** *"the thinking faculty thinks the forms in the images" (De Anima III.7, 431b12–13)*

**Actual Bekker location of the quoted text:** ~431b2 (the ROT renders this at 431b2; 431b12–13 carries a different sentence about truth/falsity and absolute/relative).

**Diagram state:** PASSAGES correctly places the quote at `DA III.7, 431b2–9` (verified in verbatim_passages.md). The drift is in the prose, not the diagram.

**Diagram action:** none. **Author decision needed:** prose errata pass — correct §1.3 L75 from `431b12–13` to `431b2` (or the appropriate range matching ROT).

### Item C — A₄ genus relabel

**Audit suggestion (May 27):** rename A₄ from "Completed Action (praxis)" to "Actualization of Desire" with three terminus-types (appetitive / *poiēsis* / *praxis*). This separates the genus (actualization of desire) from one species (*praxis*) that the current label conflates.

**v3 §1.5 state:** §1.5 L95 keeps "Completed action—*praxis* in the fullest Aristotelian sense—stands as the terminal actuality." The four-type framework underneath (Epithymetic / Thymotic / Bouletic / Prohairetic at L128–157) suggests broader scope than *praxis* alone, but no explicit relabel instruction.

**Diagram action:** none in v9 (the diagram matches current §1.5). **Author decision needed:** confirm whether the genus relabel is planned for §1.5 v4 / Part II. If so, v10 can apply.
