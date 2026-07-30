# Phase 3: Work-Level Ontology — On Things Heard

**Source**: [Aristotle], *On Things Heard* (*De Audibilibus*), trans. T. Loveday and E. S. Forster (ROT, ed. Barnes).
**Date**: 2026-03-09
**Inputs**: Phase 2 unit AUD-01 (continuous treatise, Light).
**Bekker range**: 800a1-804b39.
**Authorship note**: Disputed — possibly Strato of Lampsacus; attributed to the Peripatetic school.

---

## Section 3A: Canonical Node List

Centrality criteria: **core** = structurally central to the treatise's argument and connected to 3+ edges; **important** = supports core arguments with 2+ edges; **peripheral** = local or single-edge scope.

### Core Nodes (4)

| # | Canonical Name | Greek Lemma | Transliteration | Barnes Translation | Definition | Units | Centrality | global_candidate |
|---|---------------|-------------|-----------------|-------------------|------------|-------|------------|-----------------|
| C1 | **ψόφος** | ψόφος | psophos | sound | The central object of the treatise; all sounds arise from the impact of air against bodies or bodies against air; qualitative differences (hard, soft, clear, rough, thick, thin) are determined by the physical properties of the sound-producing organs and the transmitting air. | AUD-01 | core | true |
| C2 | **πληγή** | πληγή | plēgē | impact, blow, strike | The fundamental mechanism of all sound production; sound arises when air is set in motion by impact — contraction, expansion, compression, or the blow of breath against bodies; the force and manner of impact determine sound quality. | AUD-01 | core | false |
| C3 | **πνεῦμα** | πνεῦμα | pneuma | breath | The material cause of vocal sound; its force, quantity, and manner of expulsion from the lungs through the windpipe and mouth determine the qualitative differences among voices (hard, soft, clear, rough, shrill, deep). | AUD-01 | core | false |
| C4 | **σαφές** | σαφές | saphes | clearness, distinctness | A quality of sound analogous to clearness in colour; produced by concentrated, solid, and pure stimuli striking the sense organ with maximal penetration; requires that the breath or impact not be dispersed or divided. | AUD-01 | core | false |

### Important Nodes (3)

| # | Canonical Name | Greek Lemma | Transliteration | Barnes Translation | Definition | Units | Centrality | global_candidate |
|---|---------------|-------------|-----------------|-------------------|------------|-------|------------|-----------------|
| I1 | **σκληρός / μαλακός** | σκληρός / μαλακός | sklēros / malakos | hard / soft | Hard sounds strike the hearing with force and travel with added momentum; soft sounds arise from gentle breath. Determined by the force of the impact of breath from the lungs, not the hardness of the windpipe. | AUD-01 | important | false |
| I2 | **τραχύς** | τραχύς | trachys | rough | Rough sounds arise when the impact of air on the ear is not single but divided and dispersed, each portion striking separately; compared to rough objects touching the skin (cross-modal touch analogy). | AUD-01 | important | false |
| I3 | **συμφωνία** | συμφωνία | symphōnia | concord | Musical concords arise because overlapping note-impacts cause intermediate sounds to escape notice; the shriller note strikes simultaneously with the slower, producing apparent continuity. | AUD-01 | important | false |

### Peripheral Nodes (2)

| # | Canonical Name | Greek Lemma | Transliteration | Barnes Translation | Definition | Units | Centrality | global_candidate |
|---|---------------|-------------|-----------------|-------------------|------------|-------|------------|-----------------|
| P1 | **ὀξύς / βαρύς** | ὀξύς / βαρύς | oxys / barys | shrill (high) / deep (low) | Pitch distinction: quickness of breathing produces shrillness; slowness of breath or large quantity produces depth. | AUD-01 | peripheral | false |
| P2 | **παχύς / λεπτός** | παχύς / λεπτός | pachys / leptos | thick / thin | Volume-related: thick sounds produced when breath is emitted in great quantity (men's voices, well-filled oboes); thin when breath is small (children, women, eunuchs). | AUD-01 | peripheral | false |

---

## Section 3B: Global Edge List

See companion file: `on-things-heard-edges.csv`

### Summary Statistics

- **Total unique edges**: 8
- **Relation distribution**: explains (3), depends_on (2), operationalizes (1), exemplifies (1), refines (1)
- **Domain distribution**: perceptual (4), physiological (3), methodological (1)

### Selected Core Edges

| Source | Relation | Target | Domain | Units | Evidence |
|--------|----------|--------|--------|-------|----------|
| πληγή (impact) | explains | ψόφος | perceptual | AUD-01 | All sounds are produced by the impact of air against bodies (800a1-5). |
| πνεῦμα (breath) | explains | vocal quality | physiological | AUD-01 | Force of breath from lungs determines hardness/softness (803b10-25). |
| σαφές (clearness) | depends_on | concentrated impact | perceptual | AUD-01 | Clearness requires concentrated, undispersed stimuli (801b10-802a10). |
| σαφές (clearness in sound) | exemplifies | σαφές (clearness in colour) | perceptual | AUD-01 | Clearness in sound resembles clearness in colour (802a1-10). |
| τραχύς (roughness) | operationalizes | divided impact | perceptual | AUD-01 | Rough sound = dispersed air-impacts each striking separately (803b40-804a10). |
| συμφωνία | depends_on | rapid intermittence | perceptual | AUD-01 | Concords arise from overlapping note-impacts masking intermediate sounds (804b1-10). |

---

## Section 3C: Tension Layer

1. **Impact theory vs. shape theory**: The treatise opens by rejecting "those who believe air assumes certain shapes to produce sound" (800a1-3), but the positive account — that all sound arises from impact — is itself underdeveloped as a theory of qualitative differentiation. The transition from mechanical impact to perceived quality relies heavily on analogy (missiles, streams, files) rather than a unified explanatory principle. [INTERP-low]

2. **Clearness analogy across modalities**: The claim that clearness in sound "resembles" clearness in colour (802a1-10) raises the question of whether there is a genuine cross-modal property or merely a metaphorical transfer. The treatise does not provide criteria for when cross-modal analogies are structural vs. merely illustrative. [INTERP-low]
