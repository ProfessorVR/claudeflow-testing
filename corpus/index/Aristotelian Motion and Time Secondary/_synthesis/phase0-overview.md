# Aristotelian Motion and Time Secondary — Phase 0 Overview

## Rationale for a Separate Pipeline

This mini-pipeline isolates John Bowin's 2017 chapter "Aristotle on the Perception and Cognition of Time" from the larger *Aristotelian Phantasia Secondary (1985-2017)* cluster. The user directive was clear and is preserved here as an authoritative principle: Bowin's load-bearing object is not *phantasia* but **the perception of time**. The chapter's animating problem is Aristotle's apparent commitment to two theses that seem to generate a vicious circularity — (i) memory requires the perception of time (*De Memoria* 1, 449b28-29), and (ii) the perception of time requires memory (since perceiving a number of motion-stages "as before and after" appears to require remembering earlier motion-stages). Bowin's resolution invokes *phantasmata*, but *phantasia* is the medium of resolution, not the topic in question. Misclassifying the chapter as a phantasia-secondary unit would create signal pollution in the Phantasia pipeline's centerpiece-concept analytics (which weight *phantasia*-as-faculty, the DA 3.3 dilemma of error, the phantasma-as-image debate, and the *de motu animalium* role of phantasia in action-explanation). At the same time, the chapter's coupling to the Phantasia cluster is real and important — see "Cross-Pipeline Bridge" below — so this mini-pipeline ships with an explicit anchor edge to the Phantasia cluster rather than a clean separation.

## Bowin's Argument in Brief

Bowin's chapter advances five connected claims across five numbered sections plus an introduction (chapter pages 175-193 / pdf pp. 1-19):

1. **Perceiving time does not presuppose grasping time intellectually.** Non-rational animals can perceive time — Aristotle credits them with memory (*Meta*. Α.1, 980a28 ff.), and memory presupposes the perception of time (*Mem*. 1, 450a14-450a20). The ancient commentators Albert the Great and Themistius read perception-of-time as already requiring *nous* (counting, abstraction); Bowin reads this as an over-mathematization of *Physics* 4.11.

2. **The "soul says the nows are two" passage (Phys. 4.11.219a27-8) is about perceiving, not counting, nows.** Aristotle's verb *arithmein* appears only after the definition of time at 219b1-2 and is reserved for the rational soul's counting-as-measuring. The common sense, in animals and humans, can directly perceive *number* (a discrete plurality of nows) without counting them, just as it perceives "two" or "three" of any sensible item (DA 3.1, 425a16; cf. 2.6.418a7-11).

3. **Measuring time (the intellectual cognition) requires *nous*; perceiving time does not.** Bowin distinguishes *gnōrizein* (apprehension by a measure or indeterminately, *Mem*. 2, 452b8-9) from *aisthanesthai* (perceiving). Counting horses requires the sortal *horse*; counting days as a measure of time requires the sortal *day*. Animals can perceive a day, but not "as a day" used as a measuring-unit.

4. **The circularity between memory and the perception of time is real but non-vicious.** It is resolved through *phantasia*. Both memory and the perception of time involve *phantasmata*: two *phantasmata*, one representing the event remembered and one representing the time elapsed since the event (*Mem*. 2.452b31-453a4). If either *phantasma* is missing, one fails to remember; hence memory presupposes the perception of time, and both presuppose *phantasmata*. The perception of time, however, does NOT presuppose memory — only that one currently perceives motion-stages-as-before-and-after, where the before/after relation is delivered by the *phantasma* of the past phase *as past*.

5. **Intellectual grasp of time has an effect on how rational beings perceive time, even though it is not necessary for perceiving time.** Bowin appropriates Pseudo-Philoponus's distinction between perception of determinate (*hōrismenon*) and indeterminate (*aoriston*) time. Determinate time is the synthesis (a unified *phantasma* of, e.g., a day) produced by **deliberative *phantasia*** (*DA* 3.11.434a6-15); indeterminate time is the residue of perceptual *phantasia* alone. Bowin's reading aligns *Physics* 4.14's "no soul, no time" passage with this: in the absence of beings with *nous*, time would not be *measurable* (countable in the extended sense), but motion's before-and-after would still obtain.

## The Anchor Passage: *De Memoria* 1, 450a19-22

The signature passage is *Mem*. 1, 450a19-22 (Bowin's translation, slightly modified from Sorabji and Hamlyn):

> "When someone is actively engaged in memory, he perceives in addition (*prosaisthanetai*) that he saw this, or heard it, or learned it before; and before and after are in time."

The passage is doubly load-bearing. First, it underwrites Bowin's claim that Aristotle takes perceiving the temporal pastness of an event to be *part of* the act of remembering — *not* a logically prior intellectual act of dating. Sorabji's alternative (the "broader sense of *perceive*" reading) is rejected on the grounds that Aristotle never distinguishes perceiving-time-as-passing from remembering-that-time-has-elapsed. Second, the passage establishes the *phantasma*-mediated structure of the before-and-after itself: what it is to perceive that one *learned it earlier* is for the *phantasma* of the prior act to present itself *as past* — and "before and after are in time," so the time-content rides on the phantasma's temporal modality. This is the precise junction at which the Time-Perception cluster bridges into the Phantasia cluster.

## Bekker Citation Density

The chapter's primary Aristotelian texture is dense and easy to spot. By rough count of in-text citations: ~28 occurrences of *Physics* IV (heaviest on 4.11 and 4.14, with 4.10, 4.12, 4.13, 8.8 secondary), ~14 of *De Memoria* (1 and 2 about equally), ~9 of *De Anima* III (especially 3.1, 3.3, 3.6, 3.10, 3.11), ~3 of *De Insomniis*, ~4 of *Metaphysics* (Α.1, Δ.15, Θ.1, Θ.10, with Λ in passing), and single citations of *Posterior Analytics* II.19, *Topics* 6.5 and 8.14, *Generation of Animals* I.23, *Historia Animalium* 6.6, *Nicomachean Ethics* VII.3 and VI.7, *Categories* 7, *De Interpretatione*, *Politics* I.13, *Rhetoric* I.11, and *De Sensu* 1. The Bekker-line precision is high throughout (line-pairs to single digit, e.g., 219a3-4, 449b28-29, 450a19-22, 452b30-453a4). For pipeline retrieval and edge construction this density makes the chapter a rich source unit for any AMT-or-phantasia loci graph.

## Cross-Pipeline Bridge to *Aristotelian Phantasia Secondary*

The bridge is explicit and necessary. Three connections must be preserved in any downstream graph traversal:

1. **Anchor edge AMT-01-BOWIN → PHX-CLUSTER via *De Memoria* 1, 450a19-22 *phantasma* doctrine.** Bowin treats memory and the perception of time as co-grounded in *phantasmata*; this is the same *phantasma*-as-image-of-past doctrine that Caston (1995), Frede (1992), and Nussbaum (1985) elaborate from the *DA* 3.3 side. The edge relation is `bridges-to-pipeline` with edge-evidence locus *Mem*. 1.450a19-22 + *Mem*. 2.452b31-453a4.

2. **Deliberative *phantasia* (*DA* 3.11.434a6-15) as the intellect-modulated synthesis of *phantasmata*.** Bowin's adoption of Pseudo-Philoponus's determinate/indeterminate-time distinction makes deliberative *phantasia* the mechanism by which rational beings produce sortally-determinate time-units (days, months, years). This is the same deliberative-*phantasia* doctrine load-bearing in Frede 1992 and Moss 2012; the bridge relation is `draws-on` (Bowin → Frede/Moss/Polansky).

3. **The T0 motion/time pre-condition for any dissertation-level phantasia chapter.** Dalton's A3-phantasma chain (the "resonant *kinēsis* / one-in-substrate-two-in-being" thesis paused at the GA 18 §15-§18 threshold and the Plato *Sophist* 248e-249d question) presupposes a structural account of how *phantasmata* can present the before-and-after of motion *as past*. Bowin supplies precisely this account. The dissertation-side edge is `presupposes` (A3-phantasma → AMT-01-BOWIN circularity resolution).

This mini-pipeline contains a single unit (AMT-01-BOWIN), one edges CSV, and this synthesis layer. The quality gates (concepts ≥ 15, readings ≥ 3, aristotle_loci ≥ 25, greek_terms ≥ 15, tensions ≥ 2, interlocutors ≥ 10, edges ≥ 25) are enforced by `manifest.json` and are met by the unit deliverables.
