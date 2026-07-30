# Phase 3: Work-Level Ontology — On Colours

**Source**: [Aristotle], *On Colours* (*De Coloribus*), trans. T. Loveday and E. S. Forster (ROT, ed. Barnes).
**Date**: 2026-03-09
**Inputs**: Phase 2 unit COL-01 (chs. 1-6, complete work, Light).
**Bekker range**: 791a1-799b30.
**Authorship note**: Disputed — traditionally attributed to the Peripatetic school, not securely to Aristotle.

---

## Section 3A: Canonical Node List

Centrality criteria: **core** = structurally central to the treatise's argument and connected to 3+ edges; **important** = supports core arguments with 2+ edges; **peripheral** = local or single-edge scope.

### Core Nodes (4)

| # | Canonical Name | Greek Lemma | Transliteration | Barnes Translation | Definition | Units | Centrality | global_candidate |
|---|---------------|-------------|-----------------|-------------------|------------|-------|------------|-----------------|
| C1 | **χρῶμα** | χρῶμα | chrōma | colour | The central object of the treatise; simple colours belong to the four elements (white to fire/air/water/earth, yellow to fire/sun, black to transmuted elements); intermediate colours arise from mixture and blending of simple colours in varying proportions. | COL-01 | core | true |
| C2 | **μῖξις / κρᾶσις** | μῖξις / κρᾶσις | mixis / krasis | mixture, blending | The primary mechanism for generating intermediate colours from simple ones; covers both physical mixing of elemental constituents and observational chromatic variation; different strengths yield crimson, violet, grey, brown, flame-colour. | COL-01 | core | false |
| C3 | **φῶς / σκότος** | φῶς / σκότος | phōs / skotos | light / darkness | Light is the colour of fire; darkness is privation of light, not a colour; the interaction of light and darkness with the four elements generates simple colours. Darkness lacks definite magnitude or shape, distinguishing it from black. | COL-01 | core | false |
| C4 | **πέψις (maturation)** | πέψις | pepsis | maturation, ripening, concoction | The natural process through which plants and animals undergo chromatic change via heat, nutriment, and moisture; fruit progresses from herb-green through a chromatic sequence; animal hair/feathers change through nutriment cycles. Central explanatory principle for chs. 5-6. | COL-01 | core | false |

### Important Nodes (3)

| # | Canonical Name | Greek Lemma | Transliteration | Barnes Translation | Definition | Units | Centrality | global_candidate |
|---|---------------|-------------|-----------------|-------------------|------------|-------|------------|-----------------|
| I1 | **στοιχεῖα** | στοιχεῖα | stoicheia | elements (fire, air, water, earth) | The four elements to which simple colours belong; the material substrate of all colour generation through transmutation and mixture. | COL-01 | important | false |
| I2 | **τροφή** | τροφή | trophē | nutriment, nourishment | Determines animal colouring: white when moisture containing proper colouring dries up in maturation; black when moisture settles and becomes stale; explains age-related chromatic changes. | COL-01 | important | false |
| I3 | **βαφή** | βαφή | baphē | dyeing | The paradigm case of colour transference through moisture and heat entering pores; used as analogy for both fruit maturation and elemental colour change; the dye-fruit analogy is central to ch. 5. | COL-01 | important | false |

### Peripheral Nodes (2)

| # | Canonical Name | Greek Lemma | Transliteration | Barnes Translation | Definition | Units | Centrality | global_candidate |
|---|---------------|-------------|-----------------|-------------------|------------|-------|------------|-----------------|
| P1 | **λαμπρόν** | λαμπρόν | lampron | lustre | Continuity and density of light; explains why gold appears glistening and pigeons' necks appear lustrous; a property of light rather than colour. | COL-01 | peripheral | false |
| P2 | **μέλαν / λευκόν** | μέλαν / λευκόν | melan / leukon | black / white | The extremes of colour: white is the natural colour of the elements and the colour of deviation and weakness; black is the colour of transmutation. All intermediate colours arise from their mixture. | COL-01 | peripheral | false |

---

## Section 3B: Global Edge List

See companion file: `on-colours-edges.csv`

### Summary Statistics

- **Total unique edges**: 9
- **Relation distribution**: depends_on (3), explains (3), contrasts_with (1), exemplifies (1), presupposes (1)
- **Domain distribution**: ontological (3), teleological (2), perceptual (2), methodological (2)

### Selected Core Edges

| Source | Relation | Target | Domain | Units | Evidence |
|--------|----------|--------|--------|-------|----------|
| χρῶμα (simple) | depends_on | στοιχεῖα | ontological | COL-01 | Simple colours belong to the four elements (791a1-12). |
| χρῶμα (intermediate) | depends_on | μῖξις/κρᾶσις | ontological | COL-01 | All intermediate colours arise from blending simple colours in varying strengths (792a5-b25). |
| σκότος | contrasts_with | φῶς | perceptual | COL-01 | Darkness is privation of light, not a colour (791a12-791b5). |
| πέψις | explains | plant colour | teleological | COL-01 | All plant colour changes coincide with maturation (794b10-796a30). |
| τροφή | explains | animal colour | teleological | COL-01 | Animal hair/feather/hide colour determined by nutriment and moisture (797a1-799b). |
| βαφή | exemplifies | μῖξις/κρᾶσις | methodological | COL-01 | Dyeing is the paradigm case of colour transference through moisture and heat entering pores (794a15-b10). |

---

## Section 3C: Tension Layer

1. **Absence of τὸ διαφανές**: The *De Coloribus* colour theory lacks the concept of the transparent entirely, whereas *Sense and Sensibilia* ch. 3 defines colour as "the limit of the transparent in a determinately bounded body" (439b10-14). Whether this represents an earlier, more empirical stage of the theory or simply a popular-level simplification is unclear. The treatise's disputed authorship may explain this gap. [INTERP-low]

2. **Black as transmutation vs. black as privation**: The treatise calls black the colour of "elements in process of transmutation" (791a10-12) — a positive characterization — while *Sens.* 442a25-29 calls black a "privation of white in the transparent." These are not obviously compatible accounts. [INTERP-low]
