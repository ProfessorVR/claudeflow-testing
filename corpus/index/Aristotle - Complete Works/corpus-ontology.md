# Corpus-Level Ontology — Aristotle Complete Works (Phase 4)

**Works synthesized**: 9 (Metaphysics, Physics, Rhetoric, De Anima, Sense and Sensibilia, On Memory, Movement of Animals, On Colours, On Things Heard)
**Phase 3 inputs**: 9 work-level ontologies, 9 edge CSVs
**Generated**: 2026-03-09
**Pipeline**: Aristotle Corpus Analysis, Phase 4A-4F

---

## 4A: Canonical Concept Nodes

Promotion criteria: `global_candidate: true` in Phase 3; confirmed cross-work structural role. Centrality tiers: **core** = 4+ works OR architectonic load-bearing; **important** = 2-3 works with significant structural role; **peripheral** = 2+ works but limited structural role.

### Core Tier (20 nodes)

| # | Concept | Greek | Transliteration | Definition (corpus-level) | Works | Centrality | Units |
|---|---------|-------|-----------------|--------------------------|-------|------------|-------|
| 1 | **Substance** | οὐσία | ousia | The primary sense of being; that which is neither said of nor in a subject. In the Metaphysics, resolved as form (Z.xvii). In the Physics, nature is always in a substance. In De Anima, soul is substance as form. Three senses across the corpus: matter, form, composite. | Met, Phys, DA, SS | core | META-01-10, PHYS-01-02-05, DA-02, SS-01 |
| 2 | **Form** | εἶδος | eidos | The determinate structure that makes matter into a "this." In the Metaphysics, substance in the primary sense. In the Physics, the more proper sense of nature. In De Anima, soul as form of the body. In perception, the sensible form received without matter. | Met, Phys, DA, SS | core | META-01-10, PHYS-01-02-03, DA-02-03, SS-01 |
| 3 | **Matter** | ὕλη | hyle | The substratum capable of receiving form; potentiality in the domain of substance. In the Physics, one of three principles and the seat of hypothetical necessity. In De Anima, body is matter to soul's form. The infinite is a cause in the sense of matter. | Met, Phys, DA, SS | core | META-01-10, PHYS-01-07, DA-02-03, SS-01 |
| 4 | **Actuality** | ἐνέργεια | energeia | The existence of a thing in its completed or exercised state. In Metaphysics Theta, prior to potentiality in formula, time, and substance. In De Anima, second actuality = active exercise. In the Rhetoric, the representation of activity that makes metaphor produce visualization. In perception, the joint actualization of sense and sensible. | Met, Phys, DA, Rhet, SS | core | META-02-09, PHYS-01-08, DA-02-04, RHET-06, SS-01-02 |
| 5 | **Potentiality** | δύναμις | dynamis | A starting-point of change in another or in the self qua other. Three-grade schema in De Anima (first potentiality, first actuality/hexis, second actuality). In the Physics, the potential infinite. In Metaphysics, rational vs. non-rational potentialities. | Met, Phys, DA, SS | core | META-02-09, PHYS-01-08, DA-02-04, SS-01-02 |
| 6 | **Fulfillment** | ἐντελέχεια | entelecheia | "Having-its-end-within." Central to the De Anima definition of soul as first entelecheia. In the Physics, deployed in the definition of motion. Often used interchangeably with energeia but functionally distinguished as first actuality (possession) vs. second actuality (exercise). | Met, Phys, DA | core | META-07, PHYS-03, DA-01-02-04 |
| 7 | **Movement/Change** | κίνησις | kinesis | The actuality of the potential qua potential. In the Physics, the central object of investigation. In De Anima, phantasia defined as a kinesis. In On Memory, chains of residual movements constitute memory and recollection. In Movement of Animals, desire is the proximate cause of animal locomotion. | Met, Phys, DA, Mem, MA | core | META-01-10, PHYS-01-08, DA-01-04, MEM-01, MA-01 |
| 8 | **Perception** | αἴσθησις | aisthesis | The transition from potentiality to actuality through the agency of an external sensible object; receives sensible forms without matter. The foundational psychological faculty, presupposed by phantasia, memory, and animal movement. | DA, SS, Mem, MA, Rhet | core | DA-01-04, SS-01-02, MEM-01, MA-01, RHET-02 |
| 9 | **Imagination** | φαντασία | phantasia | A movement resulting from actual sensation. In De Anima, distinct from perception, opinion, and knowledge; subdivided into sensitive and deliberative. In the Rhetoric, the psychological faculty presupposed by "setting before the eyes." In On Memory, the faculty that produces phantasmata on which memory depends. In Movement of Animals, presents objects to desire. | DA, Rhet, Mem, MA | core | DA-03-04, RHET-02-03-06, MEM-01, MA-01 |
| 10 | **Intellect** | νοῦς | nous | The thinking part of the soul; impassible, unmixed, without nature of its own. Never thinks without an image. Active nous is separable, immortal, eternal. In the Metaphysics, divine thought is the activity of the unmoved mover. | Met, DA | core | META-01-07-09, DA-01-02-04 |
| 11 | **Cause** | αἴτιον / αἰτία | aition | That which accounts for a thing's being, in four senses: material, formal, efficient, final. In De Anima, soul is cause in three of the four senses. The four-cause scheme structures all Aristotelian explanation. | Met, Phys, DA | core | META-01-06, PHYS-02, DA-02 |
| 12 | **End/Purpose** | τέλος | telos | The "that for the sake of which." In the Metaphysics, actuality is the end. In the Physics, nature acts for an end. In De Anima, all natural bodies are organs of soul. The formal and final causes often coincide. | Met, Phys, DA | core | META-01-09, PHYS-02-08, DA-02 |
| 13 | **Nature** | φύσις | phusis | An internal principle of motion and rest. Identified in two senses: matter and form, with form as the more proper sense. Defines the domain of natural science. | Met, Phys, DA | core | META-01-09, PHYS-01-08, DA-02 |
| 14 | **Soul** | ψυχή | psyche | The first actuality of a natural organized body having life potentially. Cause in three senses: efficient, final, formal. The central concept of De Anima, presupposed by all Parva Naturalia and Movement of Animals. In the Physics, time qua numbered may require soul as counter. | DA, Phys, Mem, MA | core | DA-01-04, PHYS-04, MEM-01, MA-01 |
| 15 | **Desire** | ὄρεξις | orexis | The genus of motivating states (appetite, spirit, wish). Together with practical thought/imagination, the source of animal locomotion. In the Metaphysics, the unmoved mover produces motion as the object of desire. | Met, DA, MA | core | META-07-09, DA-04, MA-01 |
| 16 | **Logos** | λόγος | logos | Polysemous: definitional formula, rational account, ratio, speech, argument-proof. In the Metaphysics, parts of the logos are parts of the form. In De Anima, sense as a logos/ratio between contraries. In the Rhetoric, the third technical proof (demonstration through the speech). | Met, Phys, DA, Rhet | core | META-01-07, PHYS-01-04, DA-02-04, RHET-01-06 |
| 17 | **Rhetoric** | ῥητορική | rhetorike | The faculty of observing available means of persuasion; counterpart of dialectic. The domain-defining concept of the Rhetoric that connects to dialectic, ethics, and psychology. | Rhet | core | RHET-01-06 |
| 18 | **Means of Persuasion** | πίστις | pistis | The means by which persuasion is effected; divided into technical (ethos, pathos, logos) and non-technical. The enthymeme and example are the two modes of demonstrative pistis. | Rhet | core | RHET-01-06 |
| 19 | **Enthymeme** | ἐνθύμημα | enthymema | The rhetorical syllogism; "the body of persuasion." Drawn from probabilities and signs. Twenty-eight lines catalogued. | Rhet | core | RHET-01-04-06 |
| 20 | **Emotion** | πάθος | pathos | In the Rhetoric, feelings that change judgement, attended by pain or pleasure. In De Anima, the affections of soul are enmattered logoi. In the Metaphysics, Delta.21 gives four senses. | Rhet, DA, Met | core | RHET-01-06, DA-01-02, META-04, MEM-01 |

### Important Tier (19 nodes)

| # | Concept | Greek | Transliteration | Definition (corpus-level) | Works | Centrality | Units |
|---|---------|-------|-----------------|--------------------------|-------|------------|-------|
| 21 | **Essence** | τὸ τί ἦν εἶναι | to ti en einai | What a thing is in virtue of itself; the definitional formula of substance. In De Anima, soul as formal cause is identical with essence. | Met, DA | important | META-01-07, DA-02 |
| 22 | **Character** | ἦθος | ethos | In the Rhetoric, the first technical proof: persuasion through the speaker's projected character. Three sources of trust: good sense, excellence, goodwill. | Rhet | important | RHET-01-06 |
| 23 | **Style** | λέξις | lexis | The manner of linguistic expression. Excellence consists in clarity through current words combined with distinction through metaphor. Governed by appropriateness. | Rhet | important | RHET-05-06 |
| 24 | **Metaphor** | μεταφορά | metaphora | The transfer of an alien name; the supreme instrument of prose style. Achieves highest effect through energeia (setting before the eyes). Implies intuitive perception of similarity in dissimilars. | Rhet | important | RHET-05-06 |
| 25 | **Setting Before the Eyes** | πρὸ ὀμμάτων ποιεῖν | pro ommaton poiein | Metaphor that represents things in a state of activity, producing quasi-perceptual experience in the audience. The culmination of the Rhetoric's metaphor theory. | Rhet | important | RHET-06 |
| 26 | **Image** | φάντασμα | phantasma | The product of phantasia; persists after sensation ceases. In De Anima, quasi-perceptual content for thinking ("the soul never thinks without a phantasma"). In On Memory, the medium of memory with dual nature (object of contemplation and likeness). | DA, Mem | important | DA-04, MEM-01 |
| 27 | **Common Sense** | κοινὴ αἴσθησις | koine aisthesis | The faculty that discriminates between objects of different senses; numerically one but divisible in being. Perceives time. In On Memory, the primary perceptive faculty to which memory belongs. | DA, SS, Mem | important | DA-03-04, SS-01-02, MEM-01 |
| 28 | **Art/Craft** | τέχνη | techne | Universal knowledge arising from experience; knows the "why." In the Physics, principle in the maker (contrasted with nature's internal principle). In the Rhetoric, rhetoric is a techne. In the Metaphysics, one of three sources of generation. | Met, Phys, Rhet | important | META-01-07, PHYS-02, RHET-01-05 |
| 29 | **State/Disposition** | ἕξις | hexis | A disposition by which a thing is well or ill disposed. In the Rhetoric, rhetoric and virtue are hexeis. In De Anima, first actuality = hexis (possession). In the Metaphysics, the primary contrariety is hexis vs. steresis. In On Memory, memory is a hexis. | Met, DA, Rhet, Mem | important | META-04-08, DA-02, RHET-01-03, MEM-01 |
| 30 | **Place** | τόπος | topos | In the Physics, the innermost motionless boundary of what contains. In the Rhetoric, argumentative "places" from which enthymemes are constructed. Dual sense: spatial and logical. | Phys, Rhet | important | PHYS-04-08, RHET-01-04 |
| 31 | **Time** | χρόνος | chronos | The number of motion in respect of before and after. In On Memory, the necessary condition of memory (all memory implies the lapse of time). Continuous, made so by the now. | Phys, Mem | important | PHYS-04-08, MEM-01 |
| 32 | **The Now** | τὸ νῦν | to nun | The indivisible boundary of time; same in substratum, different in being. Makes time continuous (connecting) and countable (dividing). | Phys | important | PHYS-04-06-08 |
| 33 | **Privation** | στέρησις | steresis | Absence of form; the contrary of form. In the Physics, one of three principles. In the Metaphysics, the primary contrariety is state vs. privation. The infinite's essence is privation. | Met, Phys | important | META-03-09, PHYS-01-03 |
| 34 | **Principle** | ἀρχή | arche | The first point from which a thing is, comes to be, or is known. All causes are archai. In On Memory, the starting-point of recollective search. | Met, Phys, Mem | important | META-01-09, PHYS-01, MEM-01 |
| 35 | **Practical Wisdom** | φρόνησις | phronesis | Good sense; one of three sources of trust in the speaker's character. Links rhetoric to the ethical doctrine. | Rhet | important | RHET-03 |
| 36 | **Colour** | χρῶμα | chroma | The limit of the transparent in determinately bounded bodies. White and black are extremes; intermediate colours arise by ratio-mixture. Central to Sense and Sensibilia and On Colours. | SS, Col | important | SS-01-02, COL-01 |
| 37 | **Memory** | μνήμη | mneme | A state or affection of perception/conception, conditioned by the lapse of time, directed exclusively at the past. Belongs to the primary faculty of sense-perception. | Mem | important | MEM-01 |
| 38 | **Recollection** | ἀνάμνησις | anamnesis | A quasi-inferential process of recovering memory through deliberate sequential reactivation of habitual movements. Belongs only to beings with the deliberative faculty. | Mem | important | MEM-01 |
| 39 | **The Transparent** | τὸ διαφανές | to diaphanes | A common nature and power subsisting in all bodies; when actualized by fire it is light. Colour exists at its limit. The medium of vision. | SS, Col (absent) | important | SS-01-02 |

### Peripheral Tier (6 nodes)

| # | Concept | Greek | Transliteration | Works | Centrality | Notes |
|---|---------|-------|-----------------|-------|------------|-------|
| 40 | **Being qua Being** | τὸ ὂν ᾗ ὄν | to on hei on | Met | peripheral | Subject-matter of first philosophy; Metaphysics-internal |
| 41 | **Focal Meaning** | πρὸς ἕν | pros hen | Met | peripheral | Logical structure relating senses of "being" to substance |
| 42 | **PNC** | τὸ βεβαιοτάτη ἀρχή | to bebaiotate arche | Met | peripheral | The most certain principle; load-bearing within Metaphysics |
| 43 | **The Composite** | σύνολον | synolon | Met | peripheral | Form + matter compound; load-bearing for generation |
| 44 | **Truth** | ἀλήθεια | aletheia | Met | peripheral | Dissertation-critical for Heidegger's reading |
| 45 | **Sound** | ψόφος | psophos | DA, AUD | peripheral | Central to On Things Heard; voice as ensouled sound in DA |

**Total canonical nodes: 45** (20 core, 19 important, 6 peripheral)

---

## 4C: Cross-Work Integration Map

Systematic tracking of how key concepts develop, shift, or acquire new functions across works. Each entry maps concept -> {work, local_definition, local_role, differences from other works}.

### 1. ἐνέργεια — Actuality / Activity

| Work | Local Definition | Local Role | Differences |
|------|-----------------|------------|-------------|
| **Metaphysics** (Theta) | The existence of a thing not in the way expressed by "potentially"; defined by analogy, not genus. Complete actualities distinguished from incomplete movements by tense test. | Ontological-foundational: actuality is prior to potentiality in formula, time, and substance. The unmoved mover's substance is pure actuality. | Broadest, most abstract sense. The energeia/kinesis distinction (Theta.6) is the locus classicus. |
| **Physics** (III) | Deployed in the definition of motion as "incomplete actuality" (energeia ateles). The mover is in actuality what the moved is in potentiality. | Process-ontological: makes the definition of motion possible. | The paradoxical "incomplete actuality" is Physics-specific. Creates tension with Metaphysics Theta's clean separation. |
| **De Anima** (II-III) | Second actuality = active exercise of a capacity. The actualization of sense and of the sensible are one and the same event. | Psychological: structures the three-grade potentiality schema and the analysis of perception. | Distinguished from entelecheia (first actuality = possession). Perception as joint actualization is DA-specific. |
| **Rhetoric** (III.11) | The representation of things as active or alive; the mechanism by which metaphor produces visualization. | Rhetorical-aesthetic: names the vividness-effect that makes metaphor produce quasi-perceptual experience. | Entirely distinct semantic domain: not ontological priority but perceptual vividness. The transfer from metaphysics to rhetoric is Aristotle's most striking conceptual redeployment. |
| **Sense and Sensibilia** | Potentiality/actuality applied to perceptual thresholds: sensible qualities exist potentially below threshold, actually at sufficient scale. | Natural-philosophical: resolves the infinite-divisibility puzzle for perception. | Applied rather than theorized; presupposes De Anima's framework. |

### 2. οὐσία — Substance

| Work | Local Definition | Local Role | Differences |
|------|-----------------|------------|-------------|
| **Metaphysics** | Four candidates (essence, universal, genus, substratum); resolved as form at Z.xvii. Primary in formula, knowledge, and time. Three kinds in Lambda (sensible-perishable, sensible-eternal, immovable). | The central question of first philosophy: "what is being?" = "what is substance?" | The most extensive and contested treatment. The form-vs-composite priority tension runs throughout. |
| **Physics** | Nature is always in a substance. No motion in the category of substance (no contrary). | Presupposed background: substance is the subject of natural change but not itself the object of investigation. | Substance is not thematized independently; it is the given framework within which motion occurs. |
| **De Anima** | Three senses: matter, form, composite. Soul is substance in the sense of form. | The hylomorphic analysis of substance is deployed to define soul. | The DA deploys the Metaphysics result (form = primary substance) but applies it to living beings, producing the inseparability thesis. |

### 3. φαντασία — Imagination

| Work | Local Definition | Local Role | Differences |
|------|-----------------|------------|-------------|
| **De Anima** (III.3) | A movement resulting from actual sensation; distinct from perception, opinion, knowledge. Subdivided into sensitive and deliberative. | Bridge between perception and thought: "the soul never thinks without an image." | Formal definition. Causal origin in sensation. Both cognitive and reproductive. |
| **Rhetoric** (I.11, III.11) | "A feeble sort of sensation" (1370a28). The psychological faculty presupposed by pro ommaton poiein. | The audience's phantasia is activated by metaphor to produce visualization. | Rhetorical phantasia is the reception-side: the hearer's capacity to "see" what is described. The focus shifts from image-production to image-reception. |
| **On Memory** | The faculty that produces phantasmata; without it, thinking is impossible. All objects of imagination are potentially objects of memory. | Foundation of memory: memory consists in perceiving a phantasma qua likeness of something absent. | Emphasis on the phantasma's dual nature (in-itself vs. qua-likeness). Temporal dimension foregrounded. |
| **Movement of Animals** | A faculty of discrimination alongside sensation and thought; presents objects to desire. | Cognitive input to the practical syllogism's minor premise; also causes involuntary bodily effects (blushing, trembling). | Physiological effects of phantasia (heating/chilling) are MA-specific. The involuntary-movement claim extends phantasia beyond the cognitive. |

### 4. κίνησις — Movement / Change

| Work | Local Definition | Local Role | Differences |
|------|-----------------|------------|-------------|
| **Physics** (III.1) | "The fulfilment of what is potentially, as such." Four categories; three species (alteration, growth, locomotion). Locomotion is primary. | The central object: everything in the Physics is investigated because of its connection to motion. | Technical definition. The kinesis/metabole distinction (V.1) is Physics-specific. |
| **Metaphysics** (Theta.6) | Distinguished from energeia: movements are incomplete (building vs. has-built), actualities are complete (seeing = has-seen). | The ontological framework that places motion below completed actuality. | The tense-test criterion. Motion as secondary to pure actuality. |
| **De Anima** (III.3) | Phantasia is defined as a kinesis resulting from actual sensation. | Technical application: phantasia as a specific kind of motion. | Psychological motion, not physical. |
| **On Memory** | Chains of residual movements constitute memory and recollection; movements succeed by nature, custom, or association. | Physiological mechanism of both memory retention and recollective search. | Quasi-mechanical: movement-chains are the associative substrate. |
| **Movement of Animals** | Locomotion: change of place requiring internal immovable point and external ground. Desire is the proximate cause. | The explanandum: how animals move from place to place. | Zoological focus. The practical syllogism links rational motion-initiation to the desire-phantasia complex. |

### 5. ψυχή — Soul

| Work | Local Definition | Local Role | Differences |
|------|-----------------|------------|-------------|
| **De Anima** | First actuality of a natural organized body having life potentially. Cause in three senses. | The central definiendum; everything else in the treatise derives from or qualifies this definition. | Hylomorphic definition. The inseparability thesis (except for nous). |
| **Physics** (IV.14) | Time qua numbered may require soul as counter. | Limited role: bridges physics and psychology on the question of time's ontological status. | Soul is not defined or investigated; its numbering-capacity is invoked as a condition of time. |
| **Movement of Animals** | The soul moves the body through desire; its origin must be in the middle of the body. | Motive principle: soul as the source of locomotion via desire and pneuma. | Physiological emphasis: the soul's location and its interface with the body through connate spirit. |
| **On Memory** | Memory belongs to the primary faculty of sense-perception (the common sense), which is a faculty of soul. | The organ to which memory essentially belongs. | Memory as a specific psychic function tied to the common sense, not to nous. |

### 6. λόγος — Formula / Account / Speech / Ratio

| Work | Local Definition | Local Role | Differences |
|------|-----------------|------------|-------------|
| **Metaphysics** | Definitional formula; parts of the logos are parts of the form. The rational formula differentiates rational from non-rational potentialities. | Methodological-ontological: definition captures formal structure. | Logos as definition is primary. |
| **Physics** | Form specified in the logos; things "different in logos" (same in substratum). | Differentiating principle alongside matter. | Applied rather than thematized. |
| **De Anima** | Sense as a logos/ratio between contraries (the mean). Voice as sound with logos (meaning). | Perceptual-ontological: the sense-organ's ratio-structure grounds its discriminative power. | The ratio-sense is De Anima-specific and structurally central. |
| **Rhetoric** | Third technical proof: persuasion through demonstrating a truth via the words of the speech. | Rhetorical: the speech itself as argument. | The broadest sense: rational speech distinguishing humans from animals. |

### 7. τέχνη — Art / Craft

| Work | Local Definition | Local Role | Differences |
|------|-----------------|------------|-------------|
| **Metaphysics** (A.1) | Universal knowledge arising from experience; knows the "why." One of three sources of generation: the form is in the soul of the maker. | Epistemological: ranks art above experience but below wisdom. Ontological: art-production mirrors natural generation. | The art-nature parallel in generation (Z.vii). |
| **Physics** (II.1) | Principle in the maker, not in the thing made. Art imitates nature or completes what nature cannot. | Contrastive: defines nature by opposition. | The phusis/techne contrast is the Physics's foundational methodological distinction. |
| **Rhetoric** (I.1, III.2) | Rhetoric is a techne, yet its supreme instrument (metaphor) cannot be taught, and art must conceal itself. | Domain-constitutive: rhetoric's status as a genuine techne is defended against sophistic and Platonic challenges. | The tension between rhetoric-as-techne and the unteachability of metaphor is Rhetoric-specific. |

### 8. ὄρεξις — Desire

| Work | Local Definition | Local Role | Differences |
|------|-----------------|------------|-------------|
| **De Anima** (III.10) | Generic desiderative faculty: wish, spirit, appetite. Together with practical thought, source of locomotion. The single moving faculty. | Psychological: the motive origin of animal movement. | The subordination of nous to orexis in the practical domain. |
| **Metaphysics** (Theta.5, Lambda.7) | Desire/choice determines which contrary a rational potentiality actualizes. The unmoved mover moves as the object of desire. | Ontological-teleological: desire mediates between rational potentiality and actuality; cosmic desire explains celestial motion. | Cosmic scale: desire connects zoology to theology. |
| **Movement of Animals** | Proximate efficient cause of all animal locomotion; genus encompassing appetite, spirit, wish. | The central explanatory concept: the practical syllogism's major premise is supplied by desire. | Physiological mechanism: desire operates through connate spirit (pneuma). |

### 9. ἕξις — State / Disposition

| Work | Local Definition | Local Role | Differences |
|------|-----------------|------------|-------------|
| **Metaphysics** (Delta.20) | A kind of activity of the haver and had; disposition well or ill. Primary contrariety: hexis vs. steresis. | Ontological: structures the contrariety framework. | Four senses enumerated. |
| **De Anima** (II.5) | First actuality = hexis (possession of knowledge). Part of the three-grade potentiality schema. | Psychological-ontological: the intermediate between first potentiality and active exercise. | DA hexis is a technical level in the potentiality ladder. |
| **Rhetoric** (I-II) | Rhetoric and virtue are hexeis; the orator's character is a settled capacity projected through speech. | Ethical-rhetorical: links rhetoric to the virtue-ethics framework. | Hexis as ethical rather than ontological. |
| **On Memory** | Memory is a hexis or pathos of perception/conception. | Psychological: memory as a settled dispositional condition that persists. | Combined with pathos in the definition. |

### 10. αἴσθησις — Perception

| Work | Local Definition | Local Role | Differences |
|------|-----------------|------------|-------------|
| **De Anima** (II.5-12) | Transition from potentiality to actuality through external agency; receives sensible forms without matter (wax-signet). | The paradigmatic psychic faculty, analyzed in full detail. | General theory + individual sense analyses. |
| **Sense and Sensibilia** | An affection generated in the soul through the medium of the body. Focus on specific sense-modalities (colour, savour, odour) and their media. | Extends De Anima's framework to specific natural-philosophical questions about perceptual media and thresholds. | The transparent, ratio-mixture, and perceptual thresholds are SS-specific. |
| **On Memory** | The primary perceptive faculty (common sense) is the organ of memory. Only time-perceiving animals can remember. | Foundation of memory: perception's temporal dimension enables memory. | Perception's role as substrate for memory, not as active process. |
| **Movement of Animals** | Supplies the minor premise of the practical syllogism; alongside phantasia, presents objects to desire. | Input to the action-generation chain. | Instrumental: perception triggers desire via the practical syllogism. |
| **Rhetoric** | Metaphor's materials must be "beautiful to ear, understanding, eye" (1405b18-20). Phantasia as "feeble sort of sensation." | The audience's perceptual/quasi-perceptual engagement with rhetorical language. | Reception-side: how the audience perceives metaphorical speech. |

### 11. κοινὴ αἴσθησις — Common Sense

| Work | Local Definition | Local Role | Differences |
|------|-----------------|------------|-------------|
| **De Anima** (III.1-2) | Discriminates across sense-modalities in a single indivisible act; numerically one, divisible in being. | Unifies perception across the five senses. | Formal treatment: the unity problem. |
| **Sense and Sensibilia** (ch. 7) | Perceives common sensibles (figure, magnitude, motion, number, time); governs simultaneous cross-modal perception. | Resolves the puzzle of how we perceive one object through multiple senses simultaneously. | Extended treatment of simultaneity and unity. |
| **On Memory** | Identified with the "primary perceptive faculty" (to proton aisthertikon); the organ to which memory essentially belongs. | Memory's home faculty: cognizes magnitude, motion, and time. | Functional identification: common sense = primary perceptive = memory's seat. |

### 12. τόπος — Place / Topic

| Work | Local Definition | Local Role | Differences |
|------|-----------------|------------|-------------|
| **Physics** (IV.4) | The innermost motionless boundary of what contains. Place has "power" (dunamis) over natural locomotion. | Physical: the spatial framework of locomotion. | The container-theory. Power of natural places. |
| **Rhetoric** (I-II) | Argumentative "places" from which enthymemes are constructed; common and special topics. | Logical-rhetorical: the source-material for rhetorical invention. | Entirely different sense: logical place, not physical place. Shared Greek term masks total conceptual divergence. |

---

## 4D: Productive Tensions (Corpus-Level)

### CT-1: Energeia as ontological priority vs. energeia as rhetorical vividness
- **Node A**: ἐνέργεια (Metaphysics: completed actuality prior to potentiality)
- **Node B**: ἐνέργεια (Rhetoric III.11: representation of activity producing visualization)
- **Dependency**: Rhetorical energeia presupposes the metaphysical sense (activity/aliveness as the mode of being that metaphor conveys)
- **Conflict**: The metaphysical sense is abstract and atemporal (the priority thesis); the rhetorical sense is concrete and perceptual (vividness before the eyes)
- **Tension**: Whether the Rhetoric's energeia is a genuine application of the Metaphysics concept or a homonymous appropriation
- **Works**: Met Theta, Rhet III

### CT-2: Soul as inseparable from body vs. nous as separable
- **Node A**: ψυχή (De Anima II.1: first entelecheia of a natural body; inseparable)
- **Node B**: νοῦς (De Anima III.5: active nous is separable, immortal, eternal)
- **Dependency**: Nous is a capacity of soul; the hylomorphic definition should govern all psychic capacities
- **Conflict**: Active nous breaches the hylomorphic framework at its highest point
- **Tension**: The fundamental tension of De Anima, reverberating into the Metaphysics (Lambda: thought thinking itself) and the theological tradition
- **Works**: DA, Met Lambda

### CT-3: Motion as incomplete actuality vs. the priority of actuality over potentiality
- **Node A**: κίνησις (Physics III.2: energeia ateles, incomplete actuality)
- **Node B**: ἐνέργεια (Metaphysics Theta.8: actuality prior in formula, time, substance)
- **Dependency**: The Physics definition deploys the actuality concept from Metaphysics Theta
- **Conflict**: "Incomplete actuality" is paradoxical within a framework where actuality is defined as completion. How can actuality be incomplete?
- **Tension**: The central interpretive crux connecting Physics and Metaphysics. Whether kinesis constitutes a genuine third ontological category or is merely a conceptual device
- **Works**: Phys III, Met Theta

### CT-4: Phantasia as derived from sensation vs. phantasia as functionally autonomous
- **Node A**: φαντασία (De Anima III.3: kinesis from actual sensation — causally derived)
- **Node B**: φαντασία (DA III.3: occurs in dreams, guides action, mediates thought — functionally independent)
- **Dependency**: Phantasia originates in sensation and inherits its reliability structure
- **Conflict**: A dependent capacity achieves operational independence — phantasia functions without present sensation (in dreams, in deliberation, in rhetorical reception)
- **Tension**: Extends across DA, Rhetoric (audience phantasia activated by speech, not by sensation), Memory (phantasmata persist and function after sensation ceases), and MA (phantasia causes involuntary bodily effects)
- **Works**: DA, Rhet, Mem, MA

### CT-5: Teleology without deliberation
- **Node A**: τέλος / τὸ οὗ ἕνεκα (Physics II.8: nature acts for an end)
- **Node B**: τέχνη (Physics II.8: art acts purposively through deliberation)
- **Dependency**: The teleological argument relies on the art-nature analogy
- **Conflict**: Nature acts for an end but does not deliberate; stripping deliberation while retaining purposiveness undermines the analogy
- **Tension**: Whether non-deliberative purposiveness is genuinely explanatory or covertly metaphorical. Extends to Movement of Animals (the practical syllogism compresses deliberation to vanishing point in rapid action)
- **Works**: Phys II, MA

### CT-6: The practical syllogism — logical form or causal sequence?
- **Node A**: Practical syllogism (MA ch. 7: universal major + particular minor = action)
- **Node B**: ὄρεξις (MA/DA: desire as proximate efficient cause of locomotion)
- **Dependency**: The practical syllogism formalizes the desire-perception-action chain
- **Conflict**: The "conclusion" is an action, not a proposition. Whether this is a genuine syllogism or a causal sequence in logical dress is contested. Rapid-action cases compress deliberative structure to nothing.
- **Tension**: Bridges logic and psychology in a way that threatens the integrity of both
- **Works**: MA, DA

### CT-7: Nous requires phantasmata yet is impassible
- **Node A**: νοῦς (DA III.4: impassible, unmixed, without nature of its own)
- **Node B**: φάντασμα (DA III.7: the soul never thinks without an image)
- **Dependency**: Nous depends on phantasmata for all its operations
- **Conflict**: If nous requires images (which are bodily residues of sensation), how is it genuinely impassible and separable?
- **Tension**: The wax-signet model applied to both sense and thought threatens to collapse the distinction between embodied perception and separable intellection
- **Works**: DA

### CT-8: God's self-thinking vs. knowledge of the world
- **Node A**: νοῦς (Met Lambda.9: thought thinking itself, noesis noeseos noesis)
- **Node B**: τὸ ἀγαθόν (Met Lambda.10: the good of the universe depends on God as both separate principle and immanent order)
- **Dependency**: God's thinking is the supreme actuality; the universe's order depends on it
- **Conflict**: If God thinks only himself, God has no cognition of the world he orders
- **Tension**: How a self-thinking god can govern worldly order without cognizing it
- **Works**: Met Lambda

### CT-9: Form as universal vs. form as individual
- **Node A**: εἶδος (Met Z.viii: man generates man — form seems universal across instances)
- **Node B**: εἶδος (Met Z.xiii: no universal is substance — form must be individual)
- **Dependency**: Form is substance; substance must be a "this" not a "such"
- **Conflict**: If the form of man is numerically the same across all humans, it looks universal; if numerically distinct, what individuates it?
- **Tension**: Never fully resolved within the Metaphysics; the Categories' treatment of individual composites as primary substance adds a further layer
- **Works**: Met

### CT-10: Time as objective vs. time as soul-dependent
- **Node A**: χρόνος (Physics IV.11: number of motion — grounded in motion, mind-independent)
- **Node B**: χρόνος (Physics IV.14: time qua numbered requires a counter/soul)
- **Dependency**: Time is defined through motion but requires soul to be numbered
- **Conflict**: The hedged formulation leaves time's ontological status ambiguous
- **Tension**: Extends to On Memory (time is the necessary condition of memory; only time-perceiving animals remember), binding physics to psychology
- **Works**: Phys, Mem

### CT-11: Rhetoric as morally neutral techne vs. rhetoric as truth-directed
- **Node A**: ῥητορική (Rhet I.1: can be misused; value-neutral capacity)
- **Node B**: ῥητορική (Rhet I.1: truth and justice are naturally stronger)
- **Dependency**: Rhetoric is a genuine techne with systematic structure
- **Conflict**: The most truthful-seeming speech is the most artfully constructed (art concealing art)
- **Tension**: The constitutive tension of the Rhetoric, echoed in the metaphor-as-unteachable paradox
- **Works**: Rhet

### CT-12: The dual-aspect puzzle of the phantasma
- **Node A**: φάντασμα (Mem: object of contemplation in itself, theōrēma)
- **Node B**: φάντασμα (Mem: likeness of the thing remembered, eikōn)
- **Dependency**: Memory consists in perceiving the phantasma qua likeness
- **Conflict**: The mechanism by which the soul "shifts" from perceiving the image in itself to perceiving it qua likeness presupposes the awareness of the absent original it is meant to explain
- **Tension**: The representational puzzle at the heart of Aristotle's philosophy of mind
- **Works**: Mem, DA

---

## 4E: Contested Nodes

### E1: ἐνέργεια — Actuality / Activity

The most semantically dispersed concept in the corpus. Five distinct (though related) senses:
1. **Ontological priority** (Met Theta): completed actuality prior to potentiality
2. **Process-actuality** (Phys III): "incomplete actuality" of the potential qua potential
3. **Psychological actuality** (DA): second actuality = active exercise (seeing, thinking)
4. **Rhetorical vividness** (Rhet III.11): representation of activity producing visualization
5. **Perceptual threshold** (SS): qualities existing actually at sufficient scale

Whether these constitute a unified concept (related by focal meaning), a family resemblance, or genuine equivocation is one of the most consequential interpretive questions in Aristotle scholarship.

### E2: οὐσία — Substance

Shifts across:
- **Categories**: individual composites (Callias, this horse) as primary substance
- **Metaphysics Z**: form as primary substance; the composite as "posterior and obvious"
- **Metaphysics Lambda**: three kinds (sensible-perishable, sensible-eternal, immovable)
- **De Anima**: soul as substance in the sense of form
- **Physics**: presupposed background; nature is always in a substance

The Categories-to-Metaphysics shift (composite-first to form-first) is the most discussed developmental question in Aristotle scholarship.

### E3: φαντασία — Imagination

Translation is itself contested: "imagination" imports creative/productive connotations absent from the Greek. Schofield, Nussbaum, Caston prefer "appearance" or "representation." The concept shifts from:
- **DA III.3**: formal definition as kinesis from actual sensation (cognitive-reproductive)
- **Rhetoric**: audience's capacity to "see" what is described (receptive-aesthetic)
- **On Memory**: faculty producing phantasmata that serve as memory-media (retentive-temporal)
- **Movement of Animals**: cognitive input to desire; also causes involuntary physiological effects (motive-physiological)

### E4: λόγος — Formula / Account / Speech / Ratio

The most polysemous term in the corpus:
1. **Definitional formula** (Met Z): parts of the logos are parts of the form
2. **Rational account** (Met, Phys): the "why" that constitutes knowledge
3. **Ratio/mean** (DA): sense-organ as a logos between contraries
4. **Speech/argument** (Rhet): the third technical proof
5. **Rational formula** (Met Theta.2): differentiates rational from non-rational potentialities

Whether these senses share a focal meaning (as "being" shares focal meaning in substance) or are simply homonymous is rarely addressed explicitly.

### E5: πάθος — Emotion / Affection / Being-Acted-Upon

Three major sense-clusters:
1. **Rhetorical emotions** (Rhet II): feelings that change judgement, each analyzed under three heads
2. **Affections of the soul** (DA I.1): the logoi enuloi that require enmattered definitions
3. **Metaphysical category** (Met Delta.21): four senses including quality-change

The rhetorical and the De Anima senses are not obviously the same concept deployed in the same way.

### E6: τέχνη — Art / Craft

Shifts from:
- **Met A.1**: epistemological rank (above experience, below wisdom)
- **Phys II.1**: contrastive definition of nature (internal vs. external principle)
- **Rhetoric**: rhetoric as a techne whose supreme instrument (metaphor) cannot be taught

The tension between techne-as-teachable-system and natural-genius-that-resists-teaching is Rhetoric-specific but reverberates through the broader question of what an "art" is.

---

## 4F: Corpus Trajectory — The Architectonic of Aristotle's System

### The Four Architectonic Bridges

**Bridge 1: Metaphysics -> Physics** (First Philosophy -> Natural Science)
The Metaphysics establishes the conceptual infrastructure — substance, form, matter, actuality, potentiality, the four causes — that the Physics deploys for the investigation of nature. The Physics definition of motion as "the actuality of the potential qua potential" is unintelligible without Metaphysics Theta's act/potency framework. The Physics's unmoved mover (VIII.6) becomes the Metaphysics's divine self-thinker (Lambda.7-9). The causal traffic runs in both directions: the Physics supplies the doctrine that nature acts for an end, which the Metaphysics presupposes in its account of generation (Z.vii-ix).

**Bridge 2: Physics -> De Anima** (Natural Science -> Psychology)
The Physics establishes the general framework of motion, change, and teleology within which the De Anima operates. Soul is the first actuality of a *natural* body — the definition itself invokes the Physics's conception of nature. The three-grade potentiality schema (DA II.5) refines the Physics's binary potentiality/actuality into a more articulated hierarchy. The Physics's time-soul puzzle (IV.14) is resolved implicitly by De Anima's account of the common sense as the faculty that perceives time. The Physics's self-mover problem (VIII.5-6) connects to DA I.3-4 (soul is not a self-mover) and DA III.10 (desire + thought as source of locomotion).

**Bridge 3: De Anima -> Parva Naturalia + Movement of Animals** (General Psychology -> Special Psychic Functions)
De Anima provides the definitions (soul, perception, phantasia, nous, desire) that the shorter treatises apply to specific phenomena. Sense and Sensibilia extends the perception theory to individual modalities and their media. On Memory applies the phantasia doctrine to temporal cognition. Movement of Animals applies the desire-phantasia-nous complex to animal locomotion, adding the practical syllogism and the physiology of connate spirit. The internal trajectory: general definition (DA) -> perceptual modalities (SS) -> temporal retention (Mem) -> action-generation (MA).

**Bridge 4: De Anima -> Rhetoric** (Psychology -> Persuasion)
The Rhetoric's proof-theory depends on De Anima's psychology. Pathos (emotional persuasion) presupposes the DA's account of emotions as enmattered logoi. Phantasia grounds the pro ommaton poiein doctrine: metaphor works by activating the audience's image-producing faculty. Energeia as rhetorical vividness appropriates the DA/Met concept of actuality for the aesthetic domain. The practical connection: rhetoric moves audiences to judgement and action through the same psychological mechanisms (phantasia -> desire -> action) that Movement of Animals analyzes for animal locomotion.

### The System's Unity

The Aristotelian corpus hangs together through three structural principles:

1. **Hylomorphism as universal explanatory schema**: Form/matter, actuality/potentiality, the four causes — these concepts are not Metaphysics-internal but are deployed identically across domains. Soul is to body as form to matter. The sense-organ receives form without matter. The rhetor activates the audience's phantasia (a formal structure) through material speech. Generation, perception, memory, rhetoric — all instantiate the same hylomorphic pattern.

2. **Facultative hierarchy as architectonic ordering**: The serial ordering of psychic faculties (nutritive < sensitive < appetitive < locomotive < intellectual) maps onto the ordering of treatises: physics investigates nature's principles, De Anima investigates soul as nature's most complex instantiation, the Parva Naturalia investigate specific faculties, Movement of Animals investigates the output (locomotion), and the Rhetoric investigates the highest rational use of language — persuasion through logos, ethos, and pathos.

3. **Teleological integration**: The final cause operates at every level. Nature acts for an end (Phys II.8). Soul is the final cause of the body (DA II.4). Memory serves deliberation, which serves action, which aims at the good (Mem, MA). Rhetoric aims at persuasion, which aims at practical judgement. The unmoved mover moves the cosmos as the object of desire and thought — the cosmic telos that makes the entire system cohere.

### Key Lacunae

- **Ethics/Politics**: Not included in this corpus analysis but would complete the practical philosophy bridge from Rhetoric.
- **Poetics**: Would extend the metaphor-phantasia-energeia trajectory into aesthetic theory.
- **Categories/Topics**: Would ground the logical infrastructure presupposed by the Metaphysics and Rhetoric.
- **Aristotle primary texts in the corpus**: The semantic retrieval layer returns zero Aristotle primary-text chunks — all chunks are secondary scholarship. Corpus ingestion of primary texts would strengthen citation support for the ontology.

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Canonical nodes | 45 |
| Core tier | 20 |
| Important tier | 19 |
| Peripheral tier | 6 |
| Cross-work integration entries | 12 concepts |
| Concepts in 4+ works | 8 (energeia, dynamis, kinesis, aisthesis, phantasia, logos, eidos, hyle) |
| Concepts in 3 works | 8 (ousia, entelecheia, aition, telos, phusis, orexis, techne, hexis) |
| Concepts in 2 works | 10 |
| Corpus-level tensions | 12 |
| Contested nodes | 6 |
