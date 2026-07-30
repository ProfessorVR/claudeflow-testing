# Phase 3: Work-Level Ontology — Movement of Animals

**Source**: Aristotle, *Movement of Animals* (*De Motu Animalium*), trans. A. S. L. Farquharson (ROT, ed. Barnes).
**Date**: 2026-03-09
**Inputs**: Phase 2 unit MA-01 (chs. 1-11, complete work, Critical).
**Bekker range**: 698a1-704b4.

---

## Section 3A: Canonical Node List

Centrality criteria: **core** = structurally central to the treatise's argument and connected to 4+ edges; **important** = supports core arguments with 2+ edges; **peripheral** = local or single-edge scope.

### Core Nodes (5)

| # | Canonical Name | Greek Lemma | Transliteration | Barnes Translation | Definition | Units | Centrality | global_candidate |
|---|---------------|-------------|-----------------|-------------------|------------|-------|------------|-----------------|
| C1 | **ὄρεξις** | ὄρεξις | orexis | desire, appetition | The genus of motivating states encompassing appetite (ἐπιθυμία), spirit (θυμός), and wish (βούλησις); the proximate efficient cause of all animal locomotion; desire is "the last in the chain of things moved to move something else" (701a1). | MA-01 | core | true |
| C2 | **φαντασία** | φαντασία | phantasia | imagination, appearance | The faculty that presents objects to desire; a form of discrimination shared with sensation and thought; moves animals by arousing desire; can produce involuntary movement of heart and genitals without rational mandate. | MA-01 | core | true |
| C3 | **κίνησις** | κίνησις | kinēsis | movement, locomotion | Change of place; the specific kind of change investigated in this treatise; requires both an internal immovable point of rest and an external immovable ground; the soul (via desire) is the proximate cause. | MA-01 | core | true |
| C4 | **practical syllogism** | συλλογισμὸς τῶν πρακτῶν | syllogismos tōn praktōn | syllogism of actions | The logical structure whereby a universal major premise about the good plus a particular minor premise about present circumstances yields action (not a proposition) as conclusion; "I want to drink, says appetite; this is drink, says sense: straightaway I drink" (701a32-33). | MA-01 | core | false |
| C5 | **τὸ ἀγαθόν** | τὸ ἀγαθόν | to agathon | the good | The final cause that initiates movement; the object of desire; may be actual good, apparent good, or the pleasant; not every intelligible object moves but only the end in the domain of conduct. | MA-01 | core | false |

### Important Nodes (4)

| # | Canonical Name | Greek Lemma | Transliteration | Barnes Translation | Definition | Units | Centrality | global_candidate |
|---|---------------|-------------|-----------------|-------------------|------------|-------|------------|-----------------|
| I1 | **τὸ κινοῦν ἀκίνητον** | τὸ κινοῦν ἀκίνητον | to kinoun akinēton | the unmoved mover | That which causes motion without being moved; in cosmology, the mover of the heavens; in animals, the object of desire as final cause; grounds the requirement for an immovable point in all locomotion. | MA-01 | important | false |
| I2 | **σύμφυτον πνεῦμα** | σύμφυτον πνεῦμα | symphyton pneuma | connate/connatural spirit | The bodily medium through which the soul transmits movement to the limbs; capable of expansion and contraction; stands to the soul-origin as the moved joint-point stands to the unmoved. | MA-01 | important | false |
| I3 | **αἴσθησις** | αἴσθησις | aisthēsis | sense-perception | Faculty of discrimination that, alongside phantasia and thought, can present objects to desire and thus supply the minor premise of the practical syllogism. | MA-01 | important | true |
| I4 | **ἀλλοίωσις** | ἀλλοίωσις | alloiōsis | alteration, qualitative change | Bodily change (heating/chilling) that mediates between psychological states (phantasia, desire) and locomotion; imaginations produce the same bodily effects as real objects. | MA-01 | important | false |

### Peripheral Nodes (3)

| # | Canonical Name | Greek Lemma | Transliteration | Barnes Translation | Definition | Units | Centrality | global_candidate |
|---|---------------|-------------|-----------------|-------------------|------------|-------|------------|-----------------|
| P1 | **ἐπιθυμία** | ἐπιθυμία | epithymia | appetite | A species of desire directed at the pleasant; operates without deliberation; supplies the major premise in rapid action. | MA-01 | peripheral | false |
| P2 | **προαίρεσις** | προαίρεσις | prohairesis | purpose, deliberate choice | Belongs "both to intellect and to desire" (700b22-23); a hybrid faculty combining thought and desire. | MA-01 | peripheral | false |
| P3 | **ψυχή** | ψυχή | psychē | soul | The soul moves the body through desire; the moving soul's origin must be in the middle of the body; distinct from bodily magnitude yet located therein. | MA-01 | peripheral | true |

---

## Section 3B: Global Edge List

See companion file: `movement-animals-edges.csv`

### Summary Statistics

- **Total unique edges**: 13
- **Relation distribution**: explains (3), depends_on (3), operationalizes (2), presupposes (2), supports (1), contrasts_with (1), refines (1)
- **Domain distribution**: psychological-causal (4), physiological (3), cosmological (2), teleological (2), logical-practical (2)

### Selected Core Edges

| Source | Relation | Target | Domain | Units | Evidence |
|--------|----------|--------|--------|-------|----------|
| ὄρεξις | explains | κίνησις (animal locomotion) | psychological-causal | MA-01 | Desire is the proximate efficient cause of all animal locomotion (700b17-19, 701a1). |
| φαντασία | operationalizes | ὄρεξις | psychological-causal | MA-01 | Phantasia presents objects to desire, setting it in motion; a "faculty of discrimination" (700b19-21). |
| practical syllogism | explains | action (as conclusion) | logical-practical | MA-01 | Universal major + particular minor yields action as conclusion (701a13-23). |
| τὸ ἀγαθόν | presupposes | ὄρεξις | teleological | MA-01 | The good (actual or apparent) is the final cause that initiates desire (700b25-29). |
| σύμφυτον πνεῦμα | operationalizes | ὄρεξις → limbs | physiological | MA-01 | Pneuma transmits desire's motive force through expansion/contraction (703a9-23). |
| φαντασία | explains | involuntary movement | physiological | MA-01 | Phantasia moves heart and genitals without rational mandate (703b6-8). |
| φαντασία | explains | ἀλλοίωσις (bodily) | physiological | MA-01 | Imaginations cause heating/chilling, producing blushing, trembling (701b16-32). |
| τὸ κινοῦν ἀκίνητον | presupposes | κίνησις | cosmological | MA-01 | All locomotion requires an immovable ground; the cosmic unmoved mover grounds all motion (699a14-20). |

---

## Section 3C: Tension Layer

1. **Intellect vs. desire as mover** (ch. 6): "The object of desire or of intellect first initiates movement" (700b24) retains a residual motive role for νοῦς that sits uneasily with desire's monopoly as proximate cause. Whether νοῦς πρακτικός has any independent motive force or is entirely dependent on desire remains in tension. [INTERP-low]

2. **Phantasia's scope: cognitive or sub-rational?** (chs. 6-7, 11): Phantasia is a "faculty of discrimination" alongside thought (700b19-21), yet produces involuntary movements "without express mandate of the intellect" (703b6-8). Whether phantasia in MA is a unified faculty or divides into rational and sub-rational varieties (as DA III.11 suggests) is unresolved. [INTERP-med]

3. **The practical syllogism: logical form or causal sequence?** (ch. 7): The "conclusion" is an action, not a proposition. Whether this is a genuine syllogism or a psychological causal sequence dressed in logical language is a persistent interpretive problem. The rapid-action cases compress deliberative structure to vanishing point. [INTERP-med]

4. **The cosmological-zoological gap** (chs. 1-5 vs. 6-11): The opening establishes that animal motion requires an external immovable (ultimately the cosmic unmoved mover), but the internal analysis of desire-phantasia-syllogism never reconnects to this cosmological framework. [INTERP-low]
