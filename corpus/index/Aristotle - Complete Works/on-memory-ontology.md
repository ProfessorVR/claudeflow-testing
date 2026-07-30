# Phase 3: Work-Level Ontology — On Memory

**Source**: Aristotle, *On Memory and Reminiscence* (*De Memoria et Reminiscentia*), trans. J. I. Beare (ROT, ed. Barnes).
**Date**: 2026-03-09
**Inputs**: Phase 2 unit MEM-01 (chs. 1-2, complete work, Critical).
**Bekker range**: 449b4-453b11.

---

## Section 3A: Canonical Node List

Centrality criteria: **core** = structurally central to the treatise's argument and connected to 4+ edges; **important** = supports core arguments with 2+ edges; **peripheral** = local or single-edge scope.

### Core Nodes (5)

| # | Canonical Name | Greek Lemma | Transliteration | Barnes Translation | Definition | Units | Centrality | global_candidate |
|---|---------------|-------------|-----------------|-------------------|------------|-------|------------|-----------------|
| C1 | **μνήμη** | μνήμη | mnēmē | memory | A state (ἕξις) or affection (πάθος) of perception or conception, conditioned by the lapse of time, directed exclusively at the past; not itself perception or conception but a subsequent dispositional state; belongs essentially to the primary faculty of sense-perception (τὸ πρῶτον αἰσθητικόν). | MEM-01 | core | true |
| C2 | **ἀνάμνησις** | ἀνάμνησις | anamnēsis | recollection, reminiscence | A distinct quasi-inferential process (ζήτησις) of recovering memory through the deliberate sequential reactivation of habitual movements; belongs only to beings with the faculty of deliberation (βουλευτικόν); governed by association (succession, similarity, contrariety, contiguity). | MEM-01 | core | true |
| C3 | **φάντασμα** | φάντασμα | phantasma | image, appearance | The sensory image that serves as the medium of memory; has a dual nature — simultaneously an object of contemplation in itself (θεώρημα) and a likeness (εἰκών) of the thing remembered; memory consists in perceiving it *qua* likeness. | MEM-01 | core | true |
| C4 | **φαντασία** | φαντασία | phantasia | imagination | The image-producing faculty treated in *De Anima* III.3; all objects of imagination are potentially objects of memory; without imagination, thinking is impossible; the faculty that generates φαντάσματα. | MEM-01 | core | true |
| C5 | **κίνησις** | κίνησις | kinēsis | movement, motion | The residual physiological movement left by perception; chains of such movements constitute the mechanism of both memory and recollection; movements succeed one another by nature, custom, or association. | MEM-01 | core | true |

### Important Nodes (4)

| # | Canonical Name | Greek Lemma | Transliteration | Barnes Translation | Definition | Units | Centrality | global_candidate |
|---|---------------|-------------|-----------------|-------------------|------------|-------|------------|-----------------|
| I1 | **τὸ πρῶτον αἰσθητικόν** | τὸ πρῶτον αἰσθητικόν | to prōton aisthētikon | the primary perceptive faculty / common sense | The faculty by which one cognizes magnitude, motion, and time; the organ to which memory essentially belongs; identical with the common sense (κοινὴ αἴσθησις). | MEM-01 | important | true |
| I2 | **χρόνος** | χρόνος | chronos | time | The necessary condition of memory: all memory implies the lapse of time; recollection essentially involves the perception of time as magnitude, determinately or indeterminately; only time-perceiving animals can remember. | MEM-01 | important | false |
| I3 | **τύπος** | τύπος | typos | impression, imprint | The quasi-physical mark stamped in the soul and its bodily seat by perception; analogous to a seal-ring impression in wax; the quality of this impression explains individual differences in memory. | MEM-01 | important | false |
| I4 | **ἕξις / πάθος** | ἕξις / πάθος | hexis / pathos | state / affection | Memory is defined as a ἕξις or πάθος of perception/conception; ἕξις = the settled dispositional condition that persists; πάθος = the modification undergone by the soul and its bodily organ. | MEM-01 | important | true |

### Peripheral Nodes (3)

| # | Canonical Name | Greek Lemma | Transliteration | Barnes Translation | Definition | Units | Centrality | global_candidate |
|---|---------------|-------------|-----------------|-------------------|------------|-------|------------|-----------------|
| P1 | **εἰκών** | εἰκών | eikōn | likeness, image-copy | The relational aspect of the φάντασμα: when the soul perceives the image *qua* related to something else, it functions as a likeness and enables memory. | MEM-01 | peripheral | false |
| P2 | **βουλευτικόν** | βουλευτικόν | bouleutikon | deliberative faculty | The faculty of deliberation; recollection belongs naturally to those who possess it, since recollection is a form of inference. | MEM-01 | peripheral | false |
| P3 | **ἀρχή** | ἀρχή | archē | starting-point, principle | The initial term from which the recollective search proceeds; the middle of a series is the optimal starting-point; functions as a psychological τόπος. | MEM-01 | peripheral | false |

---

## Section 3B: Global Edge List

See companion file: `on-memory-edges.csv`

### Summary Statistics

- **Total unique edges**: 14
- **Relation distribution**: depends_on (6), operationalizes (2), presupposes (2), explains (2), refines (1), supports (1)
- **Domain distribution**: psychological (7), physiological (3), ontological (3), methodological (1)

### Selected Core Edges

| Source | Relation | Target | Domain | Units | Evidence |
|--------|----------|--------|--------|-------|----------|
| μνήμη | depends_on | φάντασμα | psychological | MEM-01 | Memory is the having of a φάντασμα related as likeness to that of which it is an image (451a14-16). |
| μνήμη | depends_on | χρόνος | ontological | MEM-01 | All memory implies the lapse of time; only time-perceiving animals can remember (449b28-30). |
| μνήμη | depends_on | τὸ πρῶτον αἰσθητικόν | psychological | MEM-01 | Memory belongs essentially to the primary faculty of sense-perception (450a12-14). |
| ἀνάμνησις | presupposes | μνήμη | psychological | MEM-01 | Recollection is distinct from memory but memory may follow on recollection (451a18-22). |
| ἀνάμνησις | operationalizes | κίνησις | physiological | MEM-01 | Recollection operates through the sequential reactivation of habitual movements (451b10-16). |
| ἀνάμνησις | depends_on | βουλευτικόν | psychological | MEM-01 | Recollection belongs to beings with the deliberative faculty; it is a form of inference (453a10-14). |
| φαντασία | explains | φάντασμα | psychological | MEM-01 | Imagination is the faculty that produces φαντάσματα; without it, thinking is impossible (450a1-2). |
| φάντασμα | refines | εἰκών / θεώρημα | psychological | MEM-01 | The φάντασμα has dual nature: in itself an object of contemplation; *qua* related to another, a likeness (450b20-451a2). |

---

## Section 3C: Tension Layer

1. **The dual-aspect puzzle of the φάντασμα** (450b11-451a2): Aristotle explains how one remembers what is absent by contemplating a present affection via the picture/likeness distinction. But the mechanism by which the soul "shifts" from perceiving the image *in itself* to perceiving it *qua* likeness of something absent presupposes precisely the awareness of the absent original it is meant to explain. [INTERP-high]

2. **Recollection as inference vs. quasi-mechanical movement** (451b10-453a14): Recollection is described both as a "mode of inference" and "investigation" (ζήτησις) belonging to beings with deliberation, and as a chain of quasi-mechanical movements governed by habit and natural succession. The tension between the deliberative-rational and the associative-mechanical characterizations is never fully integrated. [INTERP-high]

3. **Time as magnitude and the proportionality analogy** (452b7-24): The claim that the mind constructs proportional movements corresponding to external magnitudes (the AB/CD analogy) is obscure. Whether this is a literal psychophysiological claim or a structural analogy resists straightforward interpretation. [INTERP-high]
