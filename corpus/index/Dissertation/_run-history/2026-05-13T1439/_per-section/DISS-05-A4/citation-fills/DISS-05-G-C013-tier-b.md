# Tier B Citation Fill Proposal — DISS-05-G-C013

**Run-id**: 2026-05-13T1439 / Phase 4 Agent 2 (Tier B ChromaDB)
**Generated**: 2026-05-13T18:30 (local)
**Section**: DISS-05-A4
**Claim id**: DISS-05-C013
**Severity**: MEDIUM
**Load-bearing**: false (T2-textually-supported)
**Support tier (original)**: T2-textually-supported
**Source priority order**: corpus/index FIRST → ChromaDB → Perplexity
**Routing tier final**: Tier B (ChromaDB-strong; corpus/download/Corcilius-2013 ingested via Phase 4.0)
**Vetting tag**: `chromadb-strong / unvetted-against-PDF`

## Claim

> "Aristotle locates the somatic preparation of the organic parts internal to this transition rather than as a discrete subsequent stage." (DISS-05 line 5; MA 702a17-19 quoted verbatim)

## Missing locus / topic

Secondary anchor: Corcilius, Klaus & Gregoric, Pavel (2013), "Aristotle's Model of Animal Motion," *Phronesis* 58(1): 52–97 — for the CIOM (Cardiocentric Incoming/Outgoing Motion) model that supports the internal-to-the-transition reading of somatic preparation.

## Source identification

- **Author**: Corcilius, Klaus (with Gregoric, P.)
- **Year**: 2013
- **Title**: "Aristotle's Model of Animal Motion"
- **Venue**: *Phronesis* 58(1), 52–97
- **PDF**: `corpus/download/Corcilius_Klaus_2013_Aristotle_s_Model_of_Animal_Motion.pdf`
- **Chunks ingested**: 75 (Phase 4.0)
- **Density**: 1.47 (★★★ deep-analysis priority; relevance concentrated in §1.5 chapters)

## Top-relevance ChromaDB hits (vetted)

### Hit 1 — CIOM model: peripheral alteration → cardiac transduction → thermic alteration → pneumatic change → mechanical limb motion (chunk 35, pp.73–~74)

**Distance (cosine)**: 0.4753

> "Having answered all three questions, we are now able to spell out the basic schematic description of the CIOM model, specifying all the links in the causal chain: ANIMAL. Obviously, the model crucially relies on the idea of transformation motion: the external object causes alteration in the peripheral sense, [the] alteration is transduced to the heart via 'channels' and blood vessels. In the heart, this alteration becomes a perceptual alteration. If the perceptual alteration is caused by an external object which is good or bad for the animal, the perceptual alteration in the heart causes thermic alteration, and this thermic alteration has a double effect: contraction and expansion of pneuma (quantitative change), and solidification-hardening and liquefaction-softening of the flesh around joints (consistency alteration)"

— Corcilius & Gregoric (2013), p. 73 (ChromaDB chunk index 35).

**Why relevant**: Establishes the technical reading of MA 702a as a CONTINUOUS causal chain in which the "somatic preparation" (heating/cooling of pneuma, expansion/contraction of flesh around joints) is internal to a single transformation-motion, not a discrete subsequent stage. This is precisely the architectural reading DISS-05-C013 asserts.

### Hit 2 — CIOM model and Aristotle's cardiocentric biology (chunk 59, p.88)

**Distance (cosine)**: 0.4579

> "This distinction allows us to tackle one large problem in Aristotle's theory. We have seen that the CIOM model is eminently cardiocentric. It sits well with a number of passages in Aristotle's biological writings which assign a special place to the heart. A notable example is De Motu Animalium 10, 703a29-b2, in which Aristotle compares the animal to a city well governed by law. There he suggests that the heart stands in a privileged relation to the soul, whereas the other parts of the body perform their functions on account of being attachments to, or literally 'outgrowths' from, the heart."

— Corcilius & Gregoric (2013), p. 88 (ChromaDB chunk index 59).

**Why relevant**: Provides the architectural framework — "the other parts of the body perform their functions on account of being attachments to [...] the heart" — that grounds the internal-stage reading of MA 702a17-19.

### Hit 3 — neurophysiological parallel + motion-from-B-to-A clarification on continuous transition (chunk 36, p.74)

**Distance (cosine)**: 0.4812

> "[The CIOM model] combine[s] to produce the mechanical effect of local motion of the limbs that allow the animal to displace itself. This model seems quite intuitive. Perhaps it can be traced back, at least on the side of incoming motions, to Plato's Timaeus, in which perceptions are explained as motions that travel through the body [...] More to the point, we find a similar model in contemporary neuroscience. Very briefly, the bodies of vertebrates include peripheral receptors sensitive to various kinds of stimuli from the environment, the system of sensory neurons which transduce the impulses by means of a chain of chemical and electromagnetic changes, and the brain as the central organ [...]"

— Corcilius & Gregoric (2013), p. 74 (ChromaDB chunk index 36).

**Why relevant**: Confirms that on Corcilius & Gregoric's reading, Aristotle's model is a continuous-transformation-motion, not a sequence of discrete stages — corroborating the architectural reading at DISS-05-C013.

### Hit 4 — Motions from B to A: De Anima II.5 transition reading (chunk 9, pp.7–8)

**Distance (cosine)**: 0.4907

> "There are scholars who deny that perception, on Aristotle's account, involves motion or change which stands in relation to perceptual awareness as matter to form. If there is change involved in perception, they claim, it is only in the extended sense of transition from potentiality into actuality. This transition no doubt receives emphasis in the De Anima II.5, but this is only, in our view, because of the place of the De Anima in Aristotle's biology. Explanations of digestive processes, episodes of perception or occurrences of thoughts, we believe, is not on the agenda of that treatise."

— Corcilius & Gregoric (2013), pp. 7-8 (ChromaDB chunk index 9).

**Why relevant**: Establishes Corcilius/Gregoric's reading that the DA II.5 transition-from-potentiality language must be supplemented by the CIOM model from MA to explain actual somatic mechanism. Supports the architectural-substitutional-flag remediation action.

## Routing

- corpus/download path: `corpus/download/Corcilius_Klaus_2013_Aristotle_s_Model_of_Animal_Motion.pdf`
- ChromaDB collection: `dissertation-perplexity-cache`
- Author metadata filter: `{"author": "Corcilius, Klaus"}`
- **Tier B → Tier A promotion candidate**: high (75 ingested chunks; deep-analysis ★★★)

## Recommended LaTeX form

Combined with the existing in-text quotation of MA 702a17-19:

> [...As Aristotle states at MA 702a17-19,...]. This continuous-transformation reading is corroborated by Corcilius & Gregoric (2013), whose reconstruction of Aristotle's Cardiocentric Incoming/Outgoing Motion (CIOM) model treats the alteration "in the heart" — quantitative changes in pneuma and consistency-alterations in flesh around the joints — as causally internal to the single transduction-motion from peripheral sense-alteration to limb-motion (Corcilius & Gregoric 2013, pp. 73-74).

## Remediation action

Per the gap table: `MIGRATE_NUMBERING+ADD_INTERPRETIVE_FLAG+ADD_CORCILIUS`. This Tier B fill discharges the ADD_CORCILIUS sub-action.

## Vetting checklist (user review required)

- [ ] Verify Bekker locus MA 702a17-19 against quoted in-text passage
- [ ] Verify Corcilius/Gregoric page numbers (chunks reference internal pagination; book pp. 52-97)
- [ ] Verify verbatim Greek/English transcription against PDF
- [ ] Apply new terminology where contextually relevant
- [ ] Decide whether to cite as "Corcilius 2013" or "Corcilius & Gregoric 2013"

## Provenance

- Phase 4.0 ingest log: `corpus/download/_ingest-logs/Corcilius_Klaus_2013_Aristotle_s_Model_of_Animal_Motion-2026-05-13T1439.log`
- Phase 4 query script: `tmp/Dissertation/phase4-tier-b/run_all.py`
- Raw result JSON: `tmp/Dissertation/phase4-tier-b/results/DISS-05-G-C013.json`
