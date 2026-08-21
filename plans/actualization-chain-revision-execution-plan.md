# Execution Plan: Actualization Chain Analysis and Revision

## Project Overview

Analyze and revise the actualization chain for animal movement in Aristotle's psychology, integrating the causal account from *Movement of Animals*, the doxa analysis from prior sessions, and a new emotion analysis. Produce three deliverables: a structured analysis document (Tasks 1-8), a stand-alone emotion report (Task 5), and a revised LaTeX chain with diagram (Tasks 9-10).

The agent must adopt a critical evaluation stance: no deference to the author's formulations where textual or logical grounding is weak.

**Scope restriction**: This project is restricted to **rational animals** (those possessing the calculative/logos-bearing faculty). Non-rational cases (e.g., incomplete animals with only sensitive phantasia) may be noted in passing — particularly where they illuminate what is distinctive about the rational case — but do not need to be fully integrated into the chain or resolved architecturally.

---

## Source Inventory

### Primary Object of Analysis
- **`tmp/actualization-chain-styled.tex`** (450 lines)
  - LaTeX file containing the current actualization chain: A0 (sensible object) -> A1 (completed perception) -> A2 (phantasma) -> A3 (completed noetic/doxastic/mnemonic/anticipatory actuality) -> A4 (completed action)
  - Five motion segments: M0->M1 (perceptual), M1->M2 (phantastic), M2->M3 (noetic/doxastic/mnemonic/anticipatory), M3->M4 (orektikon)
  - Each segment identifies DA III.10 three-factor roles (unmoved originator, moved mover, moved)
  - Doxa is already integrated as a fourth parallel mode in M2->M3 alongside intellection, memory, and deliberative phantasia
  - Emotion is acknowledged but explicitly deferred: "reserved for subsequent treatment" (line 348)
  - Pathos (basic affective valence) is tracked as constitutive of perception from A1 onward, inherited through the phantasma at A2
  - Key inline notes flag interpretive choices and textual warrants

### Supporting Local Files
- **`/mnt/c/Users/Dalton/Desktop/MA_Causal_Chain.txt`** (64 lines)
  - Contains the MA 702a15-21 passage: sense-perception or thinking -> imagination -> desire -> affections -> organic parts -> action
  - Includes a TikZ diagram with 6 levels (Origin, Mediation, Motivation, Preparation, Instrument, Action)
  - Commentary on the "speed claim" (thinking and going virtually simultaneous) and the "natural correspondence of the active and passive"
  - Key structural feature: dual origin (sense-perception *or* thinking feeds imagination)
  
- **`/mnt/c/Users/Dalton/Desktop/Doxa and Emotion.txt`** (81 lines)
  - Draft sections for the MA thesis: "Emotion is Motion" and "The Affective Image"
  - Core argument: emotion = kinēsis of the soul, a being-moved by what appears significant
  - Temporal chain proposed: phantasia -> doxa -> pathos -> action
  - Heavy use of Heidegger (Stimmung, Being-in-the-world) as interpretive frame
  - Introduces "resonant motion" and "resonant mood" as personal philosophical extrapolations
  - Contains potential category confusions between pathos-as-affection and pathos-as-emotion that the analysis must address

- **`tmp/doxa-analysis-session-2026-04-16.md`** (302 lines)
  - Four-exchange session transcript analyzing doxa's placement in the chain
  - Exchange 1: Speculative phantasia (not named by Aristotle, but implied by III.7-8 + III.10-11)
  - Exchange 2: Doxa placement argued as fourth parallel mode in M2->M3, with detailed kinetic roles and textual warrants
  - Exchange 3: Involuntariness of doxa, the gatekeeping condition, the bidirectional pathos-doxa feedback loop
  - Exchange 4: Pathos/emotion distinction clarified (pathos = basic affective valence; emotion = higher-order states post-doxa)
  - This file serves as the structural template for the emotion report

### Existing Index and Knowledge Units (FIRST TIER)
- **`corpus/index/`** — pre-existing detailed analysis and breakdown of Aristotle's and Heidegger's texts
  - **`corpus/index/Aristotle - Complete Works/`**: Phase 2 unit analyses (DA-01 through DA-04, MA-01, RHET-01 through RHET-06, PHYS-01 through PHYS-08, META-01 through META-10, MEM-01, SS-01 through SS-02), work-level ontologies with canonical concept nodes (8 core + 10 important for DA alone), 157 global cross-work reasoning edges, Bekker index, Greek appendices, concept matrix, and 8 concept graphs (psychology, phantasia, rhetoric, metaphysics, physics, cross-work, cross-pipeline, global)
  - **`corpus/index/Heidegger - Being and Time/`**: 18 structured unit analyses, Phase 2 analyses, German appendix, tension edges, book-level ontology
  - **`corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/`**: BCAP structured and analysis files
  - **`corpus/index/compiled-index.json`**: integrated ontology nodes across all indexed works
  - Phase 0 must query and synthesize this index as the **primary epistemic substrate**. Only if a question cannot be definitively answered from this substrate should the agent fall back to direct PDF reading.
  - **Index/KU discrepancy logging (report-only)**: Any new conclusions generated during analysis that appear to extend, correct, or refine the existing index/KUs must be logged, with: (1) the relevant index/KU identifier or concept node, (2) the new conclusion or suspected issue, and (3) the passages or arguments that motivate the discrepancy. These are **not applied as updates** within this project. They are collected for human review in a separate deliverable (Deliverable 4: "Index & KU Issues Report") after the main analysis is complete. **The plan does not modify the index, KUs, reasoning edges, or retrieval configuration.**

### Research Corpus (SECOND TIER — fallback)
- **`corpus/rhetorical_ontology/`** (32 files, all PDFs)
  - Aristotle primary texts: De Anima, Movement of Animals, Rhetoric, On Memory, Sense and Sensibilia, Physics, Metaphysics, On Colours, On Things Heard
  - Secondary scholarship: Nussbaum (phantasia and action), Caston (imagination), Frede (cognitive role of phantasia), Papachristou (three grades of phantasia), White (phantasia in DA III.3-8), Gonzalez (phantasia in Rhetoric), O'Gorman (phantasia in Rhetoric), Bowin (perception and cognition of time), Hawhee (rhetorical vision), Gross (uncomfortable situations)
  - Also includes: Heidegger (Basic Concepts of Aristotelian Philosophy, Being and Time), Burke (Grammar/Rhetoric of Motives), Rickert (Ambient Rhetoric, two articles), Multiple Authors (Heidegger and Rhetoric), Gibson (Ecological Approach)
  - **Heidegger's role**: Use Heidegger (BCAP, Being and Time) to explain how the author's Heideggerian vocabulary (Stimmung, Befindlichkeit, being-moved, etc.) is interpreting or extending Aristotle, and to articulate Heidegger's disagreements or re-framings. **In cases of conflict, Aristotle's texts and the rhetorical_ontology corpus are decisive** for how the actualization chain is structured. Heidegger may push back as commentary but cannot overrule Aristotelian constraints on the causal and ontological layout of the chain.

### Style Profile
- **`dalton-philosophical-mo2fmhy2`** (active in `.agentdb/universal/style-profiles.json`)
  - Trained on 3 documents from `style-training/`
  - Key parameters:
    - Average sentence length: 33.4 words
    - Long sentence ratio: 55.4%
    - Complex sentence ratio: 50.8%
    - Passive voice ratio: 23.1%
    - Formality score: 0.64
    - Common transitions: indeed, thus, subsequently, hence, similarly, accordingly
    - Citation style: author-prominent (Heidegger argues, Heim observes, Burke claims)
    - Noun-verb ratio: 0.64 (moderately nominal)
    - Claim strength: cautious (hedging patterns: perhaps, it is likely that, to some extent)
    - Periodic/running ratio: 0.59 (slightly favoring periodic structure)

### Existing Diagram
- **`tmp/actualization-chain-diagram.pdf`** — visual style precedent only; no content may be derived from it

---

## Conceptual Distinctions to Enforce

These distinctions must be maintained throughout all analysis and writing. They are not negotiable unless textual evidence from the corpus compels revision.

### 1. Affections (PROJECT SENSE: basic valence)
- In this project, "affections" refers to basic affective valence (pleasure/pain, good/bad orientation) co-present with perception from A1 onward and inherited by the phantasma at A2 as part of a dual-aspect unity (formal imprint + affective charge).
- This is a **project-level usage**; the MA usage of pathē at the "affections" level (702a15-21) is a separate question treated in Phase 2 and explicitly reconciled in Phase 8.
- Feelings or states the soul undergoes accompanied by pleasure/pain
- Track good/bad, pleasant/painful valence
- Present constitutively from A1 (perception) onward
- Dispositional, not mobilizing on their own (per DA III.3, 427b21-24: mere imagination leaves us *apathōs*)

### 2. Desire (orexis)
- Generic conative category with three species: appetite (epithumia), spirited desire/anger (thumos), rational wish (boulēsis)
- Do NOT pre-classify all desire as "impulse toward motion"
- Each species' role must be inferred from its deployment in the corpus texts on animal motion
- The moved mover in the DA III.10 schema (433b10-18)
- **In the MA causal chain** (702a15-21): treat "desire" (orexis) as the appetitive faculty at the most basic level of good/bad orientation (pursue/avoid), consistent with DA II.3 and the MA description of desire as the moved mover that follows perception/imagination. Note: the basic orektikon capacity exists as a hexis (first actuality); what imagination does is actualize it into a specific desire directed at a particular object. The MA's "desire by imagination" describes this activation-into-exercise, not the dormant capacity itself.

### 3. Emotion (pathē as higher-order states)
- **Primary definition** (Rhetoric II.1, 1378a20-22): "Emotions are all those feelings that so change men as to affect their judgements and that are also attended by pain or pleasure (anger, pity, fear, etc.)."
- The project's working distinction between "emotion" and "basic affective valence" is **derived from this definition**: emotions are the judgment-modifying states *attended by* pleasure/pain; basic affective valence (the pleasure/pain itself) is the accompaniment, not the emotion. Therefore the basic pleasure/pain that accompanies perception at A1 (DA II.3) is not yet emotion — it is the raw affective dimension that emotions are attended by.
- Reserved for fear, anger, pity, shame, joy, etc. — NOT basic affective valence
- Involves richer configuration: evaluative content, temporal structure, quasi-judgmental aspects
- Arises post-doxa for rational animals (427b21-24: "when we take something to be fearful, emotion is immediately produced")
- Each emotion in Rhetoric II has a characteristic doxastic structure
- **Note on emotion and desire**: DA I.1's enmattered account (anger = desire for retaliation + boiling of blood) shows that individual emotions *include* specific desires as constitutive components. Maintaining the emotion/desire distinction does not mean treating them as wholly independent; it means that emotion is not *reducible to* desire, even though it may *include* desire among its elements.

### 4. Doxa vs phantasia vs speculative thought
- Phantasia: eph' hēmin (voluntary), does not require logos/pistis/pepeisthai, found in non-rational animals
- Doxa: ouk eph' hēmin (involuntary), requires logos/pistis/pepeisthai, found only in rational animals
- **Doxa is non-speculative**: doxa is always involuntary taking-as-true (or false) — the moment of assent. "Speculative doxa" is not a coherent category; once doxa is formed, the soul is committed and the state is not under our control. The existing chain's references to "speculative doxa" (e.g., lines 365-372) must be replaced with either:
  - **Doxa about non-practical content**: doxa whose content does not disclose a realizable good or evil (e.g., "the sun is larger than the earth"). This is still doxa (committed, involuntary), but it terminates the chain at A3 because no orexis is activated.
  - **Speculative phantasia**: non-committal entertaining of possibilities that lacks the doxastic taking-as function (as described in the doxa analysis session, Exchange 1).
  - **Speculative thought (dianoia theōrētikē)**: noetic activity that "moves nothing" in the sense of DA III.10, 433a13-15.
- **Motion-relevance rule for speculative phantasia**: speculative phantasia may be described in the M2->M3 taxonomy (as a mode of cognitive engagement with the phantasma), but if it plays no direct role in generating desire or motion (no realizable good is taken-as-true, no orexis is activated), it should be treated as non-causal for the actualization chain. Include speculative phantasia as a causal factor in the chain only if corpus texts show it can disclose a realizable good that activates desire.
- Speculative thought: moves nothing (433a13-15), does not issue in action
- Doxa and phantasia can deliver contradictory content simultaneously (sun example, 428b2-4)

### 5. Three-Factor Motion Schema (DA III.10)
Applied to every motion segment:
1. Unmoved originator (that which originates movement without being moved)
2. Moved mover (that by means of which movement is originated; itself moved)
3. That which is moved (the animal, organ, or psycho-somatic state)

---

## Execution Phases

### Phase 0: Corpus Research (prerequisite for all tasks)

**Objective**: Build the epistemic substrate for all subsequent tasks, using a two-tier approach: existing index/KUs first, PDF fallback second.

**Scope restriction**: All research in this phase targets **rational animals** only. Non-rational cases may be noted parenthetically but do not constrain analysis.

#### Tier 1: Existing Index and KUs (PRIMARY)

Query and synthesize the pre-existing index at `corpus/index/` as the primary substrate:

1. **Aristotle — De Anima** (DA-01 through DA-04):
   - `phase2-da-04.md` — the critical unit: DA III.1-13 covering common sense, phantasia (III.3), nous (III.4-6), thought/perception/imagination (III.7-8), desire and motion (III.9-11). Contains Bekker-indexed hierarchical outlines for every passage relevant to this project.
   - `phase2-da-03.md` — DA II.7-12: individual senses, common sensibles, form-without-matter, the destruction condition.
   - `phase2-da-02.md` — DA II.1-6: soul as first actuality, three-grade potentiality schema, perception, nutrition/appetite.
   - `de-anima-ontology.md` — canonical concept nodes (ψυχή, αἴσθησις, φαντασία, νοῦς, ὄρεξις, etc.) with definitions and centrality.
   - `de-anima-edges.csv` — concept relations (phantasia depends_on aisthesis, orexis activated_by phantasia, etc.).
   - `de-anima-greek.json` — Greek term index.

2. **Aristotle — Movement of Animals** (MA-01):
   - `phase2-ma-01.md` — complete work analysis (chs. 1-11, 698a-704b), including the 702a15-21 causal chain and the practical syllogism.
   - `movement-animals-ontology.md` — core nodes (ὄρεξις, φαντασία, κίνησις, practical syllogism, τὸ ἀγαθόν) and important nodes (unmoved mover, σύμφυτον πνεῦμα).
   - `movement-animals-edges.csv` — edges linking MA concepts to DA and Metaphysics.

3. **Aristotle — Rhetoric** (RHET-01 through RHET-06):
   - `phase2-rhet-02.md` through `phase2-rhet-04.md` — Book II analyses covering emotion definitions (1378a-1388b).
   - `rhetoric-ontology.md` and `rhetoric-edges.csv`.

4. **Aristotle — On Memory** (MEM-01):
   - `phase2-mem-01.md` — memory and phantasma, the past qua past.

5. **Cross-work resources**:
   - `global-edges.csv` (157 edges) — cross-work concept relations.
   - `aristotle-graph-psychology.mmd` — phantasia/aisthesis/nous/orexis/kinesis network.
   - `aristotle-graph-phantasia.mmd` — phantasia-specific concept graph.
   - `concept-matrix.csv` — concept presence across all units.
   - `aristotle-bekker-index.md` — Bekker number lookup.

6. **Heidegger** (commentary role only):
   - `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/` — for contextualizing Stimmung, Befindlichkeit, being-moved.
   - `corpus/index/Heidegger - Being and Time/bt-analysis/` — for Dasein's attunement, mood, temporality.
   - **Authority rule**: Heidegger explains the author's Heideggerian vocabulary and articulates disagreements/re-framings. In cases of conflict, Aristotle is decisive for the chain's structure.

#### Tier 2: PDF Fallback (SECONDARY)

Only if a question cannot be definitively answered from the index should the agent read the raw PDFs in `corpus/rhetorical_ontology/`. Priority when falling back:

1. Aristotle - De Anima — focus on II.3-6, III.3, III.7-8, III.9-11
2. Aristotle - Movement of Animals — 702a15-21 and surrounding context; MA 7 (701b33-702a7, heating/cooling)
3. Aristotle - Rhetoric — II.1-11
4. Aristotle - On Memory — 449b-450a
5. Nussbaum (1985), Frede (1992), Papachristou (2013), Caston (1995), White (1985), Bowin (2017), O'Gorman (2005)
6. Other secondary texts as needed: Gonzalez, Hawhee, Gross
7. Heidegger (BCAP, BT) — only for contextualizing Heideggerian claims in the author's documents

**Index/KU discrepancy logging (report-only)**: Any new conclusions from PDF reading that appear to extend, correct, or refine the existing index/KUs must be logged to the running Deliverable 4 list for human review. **The agent does not apply any fixes, corrections, or updates to the index, KUs, reasoning edges, or retrieval configuration.** Implementation of any corrections is at the user's discretion after reviewing Deliverable 4.

**Method**: Build a working citation index organized by topic (perception, phantasia, doxa, emotion/pathē, desire/orexis, motion/locomotion, three-factor schema). All claims in the analysis and revised chain must trace to entries in this index — whether sourced from Tier 1 or Tier 2. All phases (0-8) should append any suspected index/KU/retrieval issues they encounter to a running log, which becomes Deliverable 4 ("Index & KU Issues Report"). No changes are made to the index/KUs themselves.

**Output**: Internal working notes (not a deliverable) — a passage index organized by topic. Index/KU discrepancies are logged to the running Deliverable 4 list.

---

### Phase 1: Task 1 — Analyze the Styled Actualization Chain

**Objective**: Produce a complete structural analysis of `actualization-chain-styled.tex`.

**Steps**:

1. **Reconstruct the chain in tabular form**:

   | Node | Name | Ontological Status | Key Features |
   |------|------|--------------------|--------------|
   | A0 | Sensible Object in Actuality | First actuality (energeia) | Unmoved originator; exercises power without reciprocal change |
   | A1 | Completed Perception (aisthēsis + aisthēma) | Second actuality | Dual-aspect: formal imprint + affective charge as constitutive unity; dual role (terminus of M0->M1, originator of M1->M2) |
   | A2 | Phantasma Proper | Settled residual motion | Stable, recallable, formally similar to original perception; hinge between perception and thought |
   | A3 | Completed Noetic/Doxastic/Mnemonic/Anticipatory Actuality | Determinate judgment/belief/memory/projection | Discloses realizable good (practical) or truth-value (non-practical doxa / speculative thought); non-practical doxa and speculative thought terminate chain here |
   | A4 | Completed Action (praxis) | Motor loop closed | Recursive: changes world, producing new A0 |

2. **Map each motion segment's three-factor roles as currently assigned**:

   | Segment | Unmoved Originator | Moved Mover | That Which is Moved |
   |---------|-------------------|-------------|---------------------|
   | M0->M1 | A0 (sensible object) | Sense faculty (receives form without matter) | Sense organ + perceiver as material substrate |
   | M1->M2 | A1 (completed perception) | Phantasia (retentive faculty, sustains/transforms residual impression) | Psycho-somatic state |
   | M2->M3 | A2 (phantasma/repertoire) + possibly settled doxai as hexeis | Nous / doxastic faculty / mnemonic faculty / bouleutikē phantasia | Knower, believer, rememberer, deliberator |
   | M3->M4 | Realizable good as apprehended in A3 | Orexis (appetite/desire) | Animal via bodily instrument (ball-and-socket joint) |

3. **Evaluate internal coherence**:
   - Check whether each transition is genuinely causal (not merely sequential)
   - Check whether the dual-role structure (A_n is both terminus of M_{n-1}->M_n and originator of M_n->M_{n+1}) is consistently maintained
   - Check whether the four parallel modes in M2->M3 are genuinely parallel or whether some have priority/dependency

4. **Cross-check against corpus**:
   - Verify each Bekker reference cited in the chain against the corpus text
   - Identify any claims that lack textual support
   - Identify any passages in the corpus that the chain ignores or misrepresents

5. **Identify specific problems** (preliminary list based on initial reading):

   **Potential issues to investigate**:
   - The chain currently lacks an explicit emotion stage — this is acknowledged and deferred. The question is whether this deferral creates structural gaps in the M3->M4 transition as currently written.
   - The "destruction condition" at M0->M1 (lines 17-18) introduces a negative case. Is this structurally necessary, or does it interrupt the flow of the positive chain?
   - The treatment of the moved mover in M0->M1 (the sense faculty "receives the form without the matter and is thereby altered") — is the sense faculty genuinely a "moved mover" in the DA III.10 sense, or is this a different kind of being-affected? The sense faculty doesn't originate further movement in the way desire does.
   - The four parallel modes in M2->M3 — the chain says they "are not stages arranged in a fixed sequence but orientations of the same cognitive apparatus." But doxa is characterized as operating through logos, pistis, and pepeisthai, which are capacities not shared by memory or phantasia. Is the parallelism overstated?
   - The inline note at line 82 acknowledges that the unification of sensitive and deliberative phantasia as "parallel orientations of the same apparatus" is implicit, not explicit in Aristotle. How much weight should this bear?
   - The treatment of doxa as "involuntary" may be more nuanced than the chain allows — the gatekeeping condition (lines 150-167) introduces conditionality that complicates the ouk eph' hēmin claim.
   - The moved mover for M2->M3 lists four different faculties (nous, doxastic faculty, mnemonic faculty, bouleutikē phantasia). Does the three-factor schema actually permit multiple moved movers operating simultaneously, or does each activation constitute a separate motion?

**Output**: Section 1 of the analysis document, with subsections matching the evaluation categories above.

---

### Phase 2: Task 2 — Integrate the MA Causal Chain

**Objective**: Extract the Aristotelian causal chain from MA_Causal_Chain.txt and map it onto the styled chain, identifying convergences and divergences.

**Scope note**: All interpretive decisions about desire, affections, and motion in this phase are made under the assumption that the subject is a rational animal. Non-rational cases (if mentioned in MA or elsewhere) may be noted parenthetically but do not constrain the architecture of this chain.

**Steps**:

1. **Extract the MA chain** (from 702a15-21):
   ```
   Sense-perception or Thinking -> Imagination -> Desire -> Affections (pathē) -> Organic Parts (suitably prepared) -> Going/Action
   ```
   Note: "virtually simultaneous" unless hindered.

2. **Map DA III.10 three-factor roles onto the MA chain**:
   - For each level (1-6 in the TikZ diagram), identify what counts as unmoved originator, moved mover, and moved
   - Key question: in the MA chain, "affections" (pathē) come *after* desire but *before* organic parts. This is the reverse of the styled chain's ordering, where pathos (affective valence) is present from A1 and desire (orexis) is the final moved mover in M3->M4.
   - This ordering discrepancy (desire -> affections -> organic parts -> action vs. the styled chain's perception -> phantasia -> cognition/doxa -> desire -> action) is a **critical divergence** that must be carefully analyzed.

3. **Analyze the "affections" in the MA chain**:
   - Note explicitly that the Greek is pathē.
   - The system must consider **two readings**:
     - **(a)** Affections = basic affective valence (pleasure/pain, good/bad feel)
     - **(b)** Affections = higher-order emotions (pathē in the Rhetoric sense: anger, fear, shame, etc.)
   - **Argument against reading (a)**: basic pleasure/pain is co-constitutive with perception at A1 (DA II.3, 414b4-6), so placing it *after* desire in the MA ordering (imagination -> desire -> affections) would be backwards — pleasure/pain already accompanies the perception that feeds imagination. Reading (a) creates a structural incoherence in the MA chain.
   - **Argument for reading (b)**: higher-order emotions genuinely are downstream of desire/imagination in a way that basic affect is not. The MA's "organic parts are suitably prepared by the affections" aligns with the somatic effects of higher-order emotions (heating, cooling, trembling) described at MA 7, 701b33-702a7 and the enmattered accounts at DA I.1, 403a25-b2.
   - Cross-check with MA 7, 701b33-702a7 (the heating/cooling passage) and DA I.1, 403a25-b2
   - **If the corpus does not allow a clean resolution**: adopt the working interpretation **(b) — affections = higher-order emotions for rational animals** — and attach a clear methodological note explaining the competing readings, citing the relevant MA and DA passages, and justifying why this interpretation is being used pragmatically. This resolution is deferred to **Phase 8**, which must include an explicit reconciliation sub-section (see below).

4. **Map convergences and divergences**:

   | MA Level | MA Element | Styled Chain Equivalent | Status |
   |----------|-----------|------------------------|--------|
   | 1 (Origin) | Sense-perception or Thinking | A0->A1 (perception) + A3 (completed thinking) | Partial alignment — MA allows thinking as origin, which the styled chain handles via M2->M3 |
   | 2 (Mediation) | Imagination | A2 (phantasma) | Close alignment |
   | 3 (Motivation) | Desire | M3->M4 (orektikon motion) | Close alignment |
   | 4 (Preparation) | Affections (pathē) | ??? | **Gap in styled chain** — no explicit preparation stage |
   | 5 (Instrument) | Organic Parts | "ball-and-socket joint" reference at M3->M4 | Partial — mentioned but not a separate stage |
   | 6 (Action) | Going/Action | A4 | Close alignment |

5. **Critical divergence analysis**:
   - The MA chain places affections (pathē) *between* desire and organic parts, as a preparatory stage. The styled chain places pathos (affective valence) at A1 and has no separate preparation stage.
   - Possible resolution: the MA "affections" at Level 4 are not the same as the basic affective valence at A1. They are the somatic effects of desire/emotion — the heating, cooling, trembling that desire produces in the body, which in turn "suitably prepare" the organic parts for movement.
   - This would mean the styled chain needs a micro-stage between desire and completed action: desire -> somatic preparation -> bodily movement.
   - Alternatively, this micro-stage may be internal to M3->M4 and does not require a separate node.

6. **The "dual origin" problem**:
   - The MA chain allows "thinking" as an origin alongside "sense-perception." The styled chain begins at A0 (sensible object) and treats thinking as occurring at M2->M3.
   - How should the chain handle cases where thinking (rather than current perception) initiates the sequence? E.g., a remembered insult triggering anger and action.
   - The styled chain's A2 (phantasma) can be reactivated from memory, which handles this — but the MA chain's structure suggests a more direct path from thinking to imagination that bypasses current perception entirely.

7. **Micro-stages constraint**:
   - The MA chain introduces a level where "affections" prepare the organic parts before going/action. A micro-stage (e.g., "somatic preparation" between desire and overt locomotion) may be introduced within an existing motion segment **only if explicitly textually grounded** in MA and/or DA.
   - Example: M3->M3.5 (emotion/desire complex produces somatic changes — heating, cooling, muscle tension — that "suitably prepare" the organic parts, cf. MA 7, 701b33-702a7; DA I.1) followed by M3.5->M4 (mechanical motion of the joint leading to spatial displacement).
   - Any such micro-stage must: (a) preserve the overall A0-A4 macro-skeleton of the chain; (b) be justified with specific passages; (c) be treated as an optional refinement — if the texts do not clearly support it, keep the simpler M3->M4 structure and describe somatic preparation as internal detail rather than a distinct motion stage.

**Output**: Section 2 of the analysis document.

---

### Phase 3: Task 3 — Analyze Doxa Materials

**Objective**: Evaluate the doxa account across both doxa files against corpus evidence and the styled chain.

**Steps**:

1. **Extract the core doxa claims from both files**:
   - From `doxa-analysis-session-2026-04-16.md`:
     - Doxa is post-A2 (non-negotiable; 434a10-11)
     - Doxa is not phantasia (eliminative argument of III.3, 428a19-24)
     - Doxa is a fourth parallel mode in M2->M3
     - Doxa has a gatekeeping condition: corrective faculty intercepts or fails
     - The affective test (427b21-24) establishes doxa as the activator of emotion
     - Bidirectional structure: forward (phantasia -> doxa -> pathos -> kinēsis) and backward (pathos -> impaired corrective faculty -> phantasia taken as doxa -> further pathos)
     - Incidental perception is quasi-doxastic but not genuinely doxastic (resolved via koinē aisthēsis)

   - From `Doxa and Emotion.txt`:
     - Doxa is the "hinge between appearance and affective motion"
     - Doxa is involuntary, externally grounded (O'Gorman)
     - "Emotion follows not judgment (krisis) but appearance-laden belief"
     - Temporal chain: phantasia -> doxa -> pathos -> action
     - Connects to Heidegger's Stimmung as "atmospheric attunement"

2. **Evaluate against corpus texts**:
   - Verify the eliminative argument (III.3, 428a19-24) in the De Anima PDF
   - Verify the affective test (III.3, 427b21-24) in the De Anima PDF
   - Verify the sun passage (III.3, 428b2-4)
   - Verify the gatekeeping condition (De Insomniis 460b3-16) — note: De Insomniis may not be in the corpus as a separate file; check if On Memory covers it
   - Verify the Rhetoric definition of emotions (1378a20-22) and fear (1382a21-23)
   - Check O'Gorman's claim about doxa's external grounding against his article in the corpus

3. **Assess textual strength of each claim**:
   - Strongly supported: doxa is post-A2, doxa is not phantasia, doxa requires logos/pistis/pepeisthai, the affective test, the sun passage
   - Potentially overextended: the gatekeeping condition (the De Insomniis passage may be about phantasia in sleep, not about a general "corrective faculty"). Note: the question of non-rational animals experiencing emotion without doxa is outside this project's scope (rational animals only) and may be flagged but need not be resolved.
   - In tension with texts: the claim in Doxa and Emotion.txt that "emotion follows not judgment but appearance-laden belief" — but the very passage cited (427b21-24) uses doxazein (to opine), which *is* a form of judgment. The attempt to distinguish doxa from krisis may be forced.
   - Category confusion risk: Doxa and Emotion.txt sometimes uses "pathos" to mean higher-order emotion and sometimes to mean basic affective valence (the prompt's distinction). Need to check whether this confusion leaks into the styled chain.

4. **Doxa non-speculative check**:
   - Flag any references to "speculative doxa" in the styled chain or doxa files
   - Replace with the correct category: "doxa about non-practical content" (committed belief that doesn't disclose a realizable good), "speculative phantasia" (non-committal entertaining of possibilities), or "speculative thought" (dianoia theōrētikē that moves nothing)
   - Verify that the chain's treatment of cases where doxa terminates at A3 without producing motion is correctly attributed to the *content* being non-practical, not to doxa itself being "speculative"

5. **For each weak point, propose correction**:
   - Provide specific textual references
   - Offer a more cautious or precise formulation

**Output**: Section 3 of the analysis document.

---

### Phase 4: Task 4 — Research Emotion in the Corpus

**Objective**: Systematic corpus research on Aristotle's concept of pathē as higher-order emotion, constrained by how the author uses it.

**Steps**:

1. **Corpus research targets** (in order of priority):
   - DA I.1, 403a3-b19 (enmattered accounts of pathē — anger as boiling of blood around the heart *and* desire for retaliation)
   - DA III.3, 427b21-24 (the affective test — emotion follows doxa, not bare phantasia)
   - DA III.7, 431a8-10 and 431b1-9 (thinking in images, pursuit/avoidance based on pleasant/painful)
   - DA III.9-11 (desire as cause of motion; practical vs speculative thought; phantasia and desire)
   - Rhetoric II.1, 1378a20-22 (definition of emotions as affecting judgments, attended by pleasure/pain)
   - Rhetoric II.2-11 (individual emotion definitions: anger 1378a31, calmness 1380a8, fear 1382a21, confidence 1383a16, shame 1383b12, pity 1385b13, etc.)
   - MA 7, 701b33-702a21 (how desire produces bodily change; the heating/cooling account)
   - On Memory 449b-450a (memory and phantasma)
   - Nussbaum 1985 (phantasia in explanation of action — does she address emotion specifically?)
   - Gross 2017 (Uncomfortable Situations — may address emotion directly)

2. **Organize findings by question**:
   - How does Aristotle relate emotion to perception, pleasure/pain, and desire?
   - How does emotion relate to higher-order cognition (doxa, phantasia, reasoning)?
   - How does emotion participate in the causal chain from perception to motion?
   - Is emotion a necessary intermediate, a mere accompaniment, or variably present?

3. **Key interpretive questions to resolve**:
   - DA I.1 gives the enmattered account: anger = boiling of blood around the heart + desire for retaliation. Does this mean every emotion necessarily involves both a physiological change AND a desire? If so, emotion would always involve orexis, and the question is whether emotion is prior to, concurrent with, or a composite that *includes* some species of desire (while remaining irreducible to it — see the emotion/desire note in Section 2 above).
   - The Rhetoric definitions: fear = "pain or disturbance arising from the phantasia of a future destructive or painful evil" (1382a21-23). This definition includes phantasia but not doxa explicitly. Yet DA III.3, 427b21-24 says doxa (not bare phantasia) produces emotion. Is the Rhetoric using phantasia in a broader sense that includes doxastic phantasia?
   - Non-rational animals: they have phantasia but not doxa (428a22-24). Aristotle seems to attribute fear to animals in various passages. **This question is outside the project's scope** (restricted to rational animals) and may be flagged as an open question but does not need to be resolved or architecturally accommodated.

**Output**: Internal working notes organized by question. These feed into Task 5.

---

### Phase 5: Task 5 — Produce the Emotion Report

**Objective**: Write a stand-alone report on Aristotle's concept of emotion, modeled on `doxa-analysis-session-2026-04-16.md`, in the `dalton-philosophical-mo2fmhy2` style.

**Structure** (modeled on the doxa session's format):

1. **Opening**: Define emotion using the Rhetoric definition (1378a20-22) as the primary anchor. Derive the distinction between emotion and basic affective valence from this definition: emotions are judgment-modifying states attended by pleasure/pain; basic valence is the accompaniment. State the scope restriction (rational animals only) and constraints.

2. **The Textual Foundations**: 
   - DA I.1 enmattered account (anger = desire for retaliation + boiling of blood — emotion as composite including desire, physiological change, and cognitive content)
   - DA III.3 affective test (427b21-24)
   - Rhetoric II.1, 1378a20-22 (the primary definition) and individual emotion definitions in II.2-11
   - MA causal chain and the role of "affections" (pathē) between desire and organic parts

3. **Emotion's Ontological Status**:
   - Is emotion a pathos of the soul involving judgment/doxa? (DA III.3 says yes for rational animals)
   - Does emotion *include* desire as a constitutive component without being *reducible to* desire? (DA I.1 anger = desire for retaliation; but anger is not merely that desire)
   - Is emotion a composite of cognitive, conative, and physiological elements? (the enmattered account suggests this)
   - Is emotion a movement (kinēsis) or a state (hexis)?

4. **Emotion in the Perception-Phantasia-Doxa-Desire-Movement Sequence** (rational animals only):
   - The forward path: phantasia -> doxa -> emotion -> desire? -> action
   - The feedback path: emotion -> impaired corrective faculty -> further doxa -> further emotion
   - Whether emotion is a necessary intermediate for certain actions vs. an accompaniment
   - Note in passing: the non-rational animal case (phantasia -> emotion? -> desire -> action, without doxa) is outside this project's scope and may be flagged as an open question

5. **Interpretive Options and Ambiguities**:
   - Flag each point where the corpus evidence underdetermines the answer
   - Distinguish between textually mandated conclusions and interpretive constructions

6. **Self-Check Section** (5-7 sentences):
   - List key claims that are directly text-supported
   - Note where corpus evidence is thin or contested
   - Confirm that affect/desire/emotion distinctions have been respected

**Style requirements**:
- Average sentence length ~33 words, with 55% long sentences
- Transitions: indeed, thus, subsequently, hence, similarly, accordingly
- Author-prominent citations
- Cautious claim strength with appropriate hedging
- Periodic sentence structure favored slightly over running
- No LLM planning voice or textbook style
- Meta-commentary in notes or asides, not in main prose

**Output**: Stand-alone emotion report (Deliverable 2).

---

### Phase 6: Task 6 — Re-check Doxa Placement

**Objective**: With the refined understanding from Phases 3-5, re-evaluate doxa's position in the chain.

**Steps**:

1. **Re-evaluate doxa's current placement**:
   - Currently: fourth parallel mode in M2->M3, with A2 (phantasma) as unmoved originator
   - Key question: does the emotion analysis change anything about doxa's placement?
   - The styled chain says doxa "activates" the phantasma's latent pathos into a condition capable of producing higher-order emotion (lines 334-348). Does this activation-function give doxa a special structural priority over the other three modes in M2->M3?

2. **Consider whether doxa should be separated from the M2->M3 parallel modes**:
   - If doxa is the necessary condition for emotion (for rational animals), and if emotion is a distinct stage in the chain, then doxa may need its own sub-segment rather than being merely one of four parallel orientations.
   - Counter-argument: the chain already handles this by noting that doxa at A3 activates emotion. The parallelism at M2->M3 is about how the phantasma is cognitively engaged; the downstream effects differ by mode.

3. **Answer explicitly**: do I agree with doxa's current position and function?
   - If yes: explain why the emotion analysis reinforces the current placement
   - If no: propose a revised placement with textual support and explain downstream effects

4. **Check for consistency with the MA causal chain**:
   - The MA chain does not mention doxa explicitly — it goes directly from imagination to desire. Where does doxa fit in the MA schema?
   - Possible answer: doxa is internal to "imagination" in the MA chain, because Aristotle uses phantasia loosely in MA to include both bare phantasia and doxastic phantasia. Support from DA III.10, where phantasia is treated as including the presentational function that discloses the realizable good.

**Output**: Section 6 of the analysis document.

---

### Phase 7: Task 7 — Determine Where Emotion Fits

**Objective**: Using the emotion report and the MA causal chain, determine where higher-order emotion belongs in the revised chain.

**Scope note**: All placement decisions in this phase assume a rational animal. The non-rational animal case is outside scope.

**Steps**:

1. **Consider candidate placements**:
   
   **Option A**: Emotion as a sub-moment within A3 -> M3->M4 transition
   - After doxa completes (at A3), emotion is immediately produced (euthus, 427b23), which then activates desire, which initiates bodily movement.
   - Chain: A2 -> M2->M3 -> A3 [doxa-formed] -> emotion -> orexis -> M3->M4 -> A4
   - Pros: preserves the existing structure; emotion is the bridge between completed judgment and desire
   - Cons: may conflate emotion with the activation of desire; is emotion genuinely *between* doxa and desire, or is it *concurrent with* desire?

   **Option B**: Emotion as a separate motion segment (M3->M4 becomes M3->M3.5->M4 or similar)
   - Emotion has its own three-factor structure: unmoved originator = A3 (completed doxa disclosing something as fearful/good/etc.), moved mover = the pathetic faculty (the soul's capacity to be emotionally moved), moved = the psycho-somatic state of the animal
   - Pros: gives emotion full structural parity with other chain segments; allows the three-factor schema to be applied
   - Cons: may multiply stages beyond what Aristotle warrants; the MA chain puts affections (pathē) between desire and organic parts, not between cognition and desire

   **Option C**: Emotion as a modification of desire, not a separate stage — **PRIMA FACIE DISFAVORED**
   - On this reading, emotion *is* the affective-conative complex that constitutes desire in its activated form. Fear = the desire to flee *felt as painful*. Anger = the desire for retaliation *felt as painful*. Emotion is not separate from desire but is desire's qualitative character.
   - Pros: parsimonious; aligns with DA I.1 where anger = desire for retaliation + boiling of blood
   - Cons: violates the prompt's sharp distinction between desire and emotion; some emotions (e.g., boredom, aesthetic pleasure) don't obviously reduce to desire
   - **Status**: This option is disfavored because the project's governing constraints (Section 2) draw a sharp distinction between desire and emotion. Option C collapses that distinction. It may only be adopted if the corpus and the Rhetoric definition together *strongly require* it — and if adopted, must be documented explicitly as a revision to the initial constraint, with full textual justification.
   - **Note**: DA I.1's enmattered account (anger *includes* desire for retaliation) creates genuine pressure here. The resolution is that emotion *includes* desire as a component without being *reducible to* desire. This preserves the distinction while acknowledging the compositional relationship.

   **Option D**: Emotion as variably present depending on the kind of motion
   - For some actions (habitual, appetitive), emotion is absent or minimal — desire responds directly to the phantasma or doxa without an intervening emotional state
   - For other actions (those involving objects perceived as fearful, insulting, pitiable), emotion is a necessary intermediate between doxa and desire
   - Pros: most faithful to the textual evidence, which discusses specific emotions in specific contexts rather than positing a universal emotion stage
   - Cons: makes the chain less unified; the guiding principle that "each motion possesses an identical internal structure" would need qualification

2. **Evaluate each option against the texts**
3. **Select and justify a placement**
4. **Check that placement does not violate**: the affect/desire/emotion distinctions; Aristotle's constraints on what causes motion; the DA III.10 three-factor schema

**Output**: Section 7 of the analysis document.

---

### Phase 8: Task 8 — Global Conformity Check

**Objective**: Step back and evaluate the entire revised chain for internal consistency and Aristotelian fidelity.

**Steps**:

1. **Walk through the revised chain from A0 to A4** with all revisions from Tasks 1-7 integrated
2. **Check three-factor schema conformity** for every motion segment in the revised chain
3. **Check consistency with the MA causal chain**: does the revised chain map cleanly onto the MA 702a15-21 sequence?
4. **MA "Affections" Reconciliation** (mandatory sub-section):
   This sub-section must explicitly:
   - State whether "affections" (pathē) in MA 702a15-21 are being taken as basic affect (reading a) or higher-order emotions (reading b), and why.
   - Explain how that choice interacts with:
     - The A1-onward affective valence structure in the styled chain (where basic pathos is constitutive of perception and inherited by the phantasma).
     - The Rhetoric definition of emotion as judgment-affecting states attended by pleasure/pain (1378a20-22).
   - If the texts remain ambiguous, clearly mark this as an unresolved tension and state that, for this project, the chain uses the working interpretation (affections = higher-order emotions in rational animals) as a working model, with a methodological note citing the competing readings and the relevant MA and DA passages.
5. **Identify remaining tensions**:
   - Speculative steps where the reconstruction goes beyond what the texts explicitly warrant
   - Controversial interpretive choices (e.g., the exact causal role of emotion in producing locomotion)
   - Open questions that should be labeled as such rather than resolved
   - The non-rational animal case may be flagged as an open question but does not need to be resolved
6. **For each tension**: either resolve it with a revision or explicitly label it as an open interpretive question

**Output**: Section 8 of the analysis document.

---

### Phase 9: Task 9 — Draft the Revised Chain

**Objective**: Write a complete, revised LaTeX file to replace `actualization-chain-styled.tex`.

**Steps**:

1. **Structural planning**:
   - Determine the final node structure (A0, A1, A2, A3, ... A_n) based on Phases 1-8
   - Determine the final motion segments
   - Determine where emotion and doxa appear in their revised positions
   - **Micro-stages**: any micro-stages (e.g., somatic preparation between desire and locomotion) may be included only if explicitly textually grounded. They must preserve the A0-A4 macro-skeleton. If textual support is thin, describe the content as internal detail within M3->M4 rather than promoting it to a distinct structural stage.
   - **Doxa terminology**: replace all instances of "speculative doxa" with the correct category (doxa about non-practical content, speculative phantasia, or speculative thought)
   - Plan LaTeX comments explaining each structural change

2. **Writing**:
   - Conform to `dalton-philosophical-mo2fmhy2` style profile metrics directly; do not re-calibrate style on the existing chain text. The chain is content; style comes solely from the profile.
   - LaTeX formatting conventions are inherited from the chain's existing markup (these are formatting, not style): `\inlinenote{}` for interpretive notes, `\hl{}` for key claims, `\gk{}` for Greek text, Bekker number integration patterns.
   - For each non-obvious claim: in-text note, LaTeX comment, or footnote with textual reference
   - Where diverging from the original chain: brief LaTeX comment explaining what changed and why, citing the decisive passage

3. **Methodological afterword** (or extended LaTeX comment):
   - List major structural changes relative to the original chain
   - State which Aristotelian passages were decisive for each change
   - Note remaining open questions intentionally left unresolved

4. **Quality checks**:
   - Every motion segment has all three DA III.10 roles identified
   - Every textual citation can be traced to the corpus or the four allowed files
   - The affect/desire/emotion distinctions are consistently maintained
   - No claims are introduced that cannot be supported from allowed sources
   - Speculative claims are explicitly marked

**Output**: Complete revised LaTeX file (Deliverable 3, part 1).

---

### Phase 10: Task 10 — Generate Updated Diagram

**Objective**: Design a new diagram that reflects the revised chain.

**Steps**:

1. **Diagram content** (derived entirely from the Task 9 revised chain):
   - Nodes: each A_n with label and ontological status
   - Edges: each M_n->M_{n+1} with label
   - Three-factor roles labeled for each motion segment (unmoved originator, moved mover, moved)
   - Visual indicators for where affections, desire, and higher-order emotions appear
   - The feedback loop (if retained from the doxa analysis) shown as a return path

2. **Format**: TikZ code (matching the style precedent from the old diagram and from MA_Causal_Chain.txt's TikZ)

3. **Design note**: for each labeled element in the diagram, a brief note explaining how it corresponds to specific passages or claims in the revised chain text

**Output**: TikZ code + design notes (Deliverable 3, part 2).

---

## Deliverables Summary

| # | Deliverable | Format | Content |
|---|-------------|--------|---------|
| 1 | Structured Analysis Document | Markdown | Tasks 1-8 with headings matching task numbers; critical evaluation of the chain, doxa, emotion, and global conformity |
| 2 | Stand-Alone Emotion Report | Markdown (styled) | Aristotle's concept of emotion as it bears on animal movement; modeled on doxa-analysis-session; in `dalton-philosophical-mo2fmhy2` style; includes self-check section |
| 3 | Revised Actualization Chain + Diagram | LaTeX (.tex) + TikZ | Complete replacement for actualization-chain-styled.tex with doxa and emotion integrated; methodological afterword; TikZ diagram with design notes |
| 4 | Index & KU Issues Report | Markdown | All potential issues with the existing index (`corpus/index/`), KUs, reasoning edges, and retrieval behavior encountered during Phases 0-8, including suggested human review items and their textual basis. Also includes any observed retrieval anomalies (e.g., systematically missing key DA passages, over-selecting Heidegger when Aristotle is needed, ignoring important index nodes) with concrete examples and hypotheses about the cause. |

## Output Locations

All deliverables will be saved to `docs/actualization-chain/`, which must be created as a final step:
- `docs/actualization-chain/actualization-chain-analysis.md` (Deliverable 1)
- `docs/actualization-chain/aristotle-emotion-report.md` (Deliverable 2)
- `docs/actualization-chain/actualization-chain-styled-v2.tex` (Deliverable 3, part 1)
- `docs/actualization-chain/actualization-chain-diagram-v2.tex` (Deliverable 3, part 2)
- `docs/actualization-chain/index-ku-issues-report.md` (Deliverable 4)

### Final Step: Create Deliverables Folder

Before writing any deliverables, create the output directory:
```
mkdir -p docs/actualization-chain
```
All final deliverables are stored in this folder.

---

## Critical Risks and Mitigations

### 1. Corpus Access Limitations
**Risk**: The corpus consists of 32 PDFs. Reading them thoroughly enough to ground all claims is time-intensive and may be bounded by PDF extraction quality.
**Mitigation**: Prioritize the 6-7 most essential texts (DA, MA, Rhetoric, On Memory, Nussbaum, Frede, Papachristou). Use targeted page-range reads for specific passages rather than cover-to-cover reading. Cross-reference quotations already present in the four local files.

### 2. Non-Rational Animals and Emotion (OBSERVATIONAL ONLY)
**Risk**: Aristotle appears to attribute fear/anger to non-rational animals (who lack doxa), which would imply a separate, doxa-independent path to emotion.
**Status**: This risk is observational only. No architectural accommodation for non-rational animals is required in the revised chain. The project is restricted to rational animals. The non-rational case may be flagged in passing as an open question for future work, but it does not constrain any design decisions in this project.

### 3. Ordering of Emotion and Desire
**Risk**: The MA chain places affections *after* desire, not before it. If emotion is post-desire in some readings, placing it between doxa and desire in the revised chain would contradict the MA text.
**Mitigation**: Analyze the MA "affections" carefully (Phase 2, step 3). The MA pathē may refer to somatic preparations rather than higher-order emotions. If so, the styled chain and the MA chain are compatible — they track different senses of pathē at different levels of the causal sequence.

### 4. Style Profile Fidelity
**Risk**: The `dalton-philosophical-mo2fmhy2` profile was trained on 3 documents that include early philosophical writing. The training data may not perfectly capture the author's current mature style.
**Mitigation**: Enforce `dalton-philosophical-mo2fmhy2` style profile metrics directly; do not re-calibrate style on the current chain text. The chain is content; style comes solely from the profile. LaTeX formatting conventions (the `\gk{}` command for Greek, `\inlinenote{}` for interpretive notes, `\hl{}` for key claims, Bekker number integration) are inherited from the chain's existing markup, since these are formatting and content conventions, not style.

### 5. Scope and Iteration
**Risk**: Tasks 1-8 may reveal issues that require revisiting earlier tasks. The prompt explicitly permits loopback. This could expand scope significantly.
**Mitigation**: Perform Tasks 1-4 as a first pass, then Tasks 5-8 as a second pass. Track revisions explicitly. Limit loopback to cases where a later finding *genuinely invalidates* an earlier conclusion (not merely adds nuance).

---

## Execution Order and Dependencies

```
Phase 0 (Corpus Research)
    |
    v
Phase 1 (Task 1: Analyze Chain) -----> Phase 2 (Task 2: Integrate MA Chain)
    |                                       |
    v                                       v
Phase 3 (Task 3: Doxa Analysis) -----> Phase 4 (Task 4: Emotion Research)
    |                                       |
    v                                       v
Phase 5 (Task 5: Emotion Report) <---- feeds from Phase 4
    |
    v
Phase 6 (Task 6: Re-check Doxa) <---- feeds from Phases 3, 4, 5
    |
    v
Phase 7 (Task 7: Emotion Placement) <---- feeds from Phases 5, 2
    |
    v
Phase 8 (Task 8: Global Check) <---- feeds from all prior phases
    |
    v
Phase 9 (Task 9: Revised Chain) <---- feeds from Phase 8
    |
    v
Phase 10 (Task 10: Diagram) <---- feeds from Phase 9
```

Phases 1 and 2 can proceed in parallel after Phase 0.
Phases 3 and 4 can proceed in partial parallel after Phases 1-2.
Phases 5-10 are strictly sequential.
