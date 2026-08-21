# Lanham Style Conformance Report

**Document:** A₁→A₂: The Actualization of Perception (console draft)
**Source:** `a2-aisthesis-console-draft-2026-04-23.md`
**Analyzer:** LanhamProseAnalyzer (Tier 1 heuristic, calibrated weights)
**Trained profile:** `dalton-academic-mkn82c3v`
**Draft word count (prose, strip-markdown):** 6,427
**Draft sentence count:** 232

## Sentence-Level Metrics

| Metric | Draft | Trained target | Δ |
|---|---|---|---|
| Average sentence length (words) | 27.70 | 31.24 | -3.541 (-11.3%) |
| Short-sentence ratio (<15 words) | 0.228 | 0.138 | +0.091 (+66.1%) |
| Long-sentence ratio (>30 words) | 0.375 | 0.516 | -0.141 (-27.3%) |

## Lanham Axis Metrics (six-axis analyzer)

| Axis / Metric | Draft | Trained target | Δ |
|---|---|---|---|
| Noun/verb ratio (lower = more verb-dominant) | 0.637 | 0.675 | -0.038 (-5.7%) |
| Nominalization density (per 100 words) | 6.432 | 4.310 | +2.121 (+49.2%) |
| Prepositional-phrase density | 3.226 | 5.154 | -1.928 (-37.4%) |
| Be-verb ratio | 0.203 | 0.107 | +0.096 (+89.4%) |
| Parataxis/hypotaxis ratio | 0.410 | 0.324 | +0.086 (+26.5%) |
| Coordinating conjunction density | 0.042 | 0.054 | -0.012 (-22.7%) |
| Subordinating conjunction density | 0.028 | 0.026 | +0.003 (+9.9%) |
| Periodic/running ratio (higher = more periodic) | 0.599 | 0.522 | +0.076 (+14.6%) |
| Pre-main-verb clause count (per sentence avg) | 0.104 | 0.154 | -0.049 (-32.2%) |
| Voice score | 0.245 | 0.244 | +0.001 (+0.5%) |
| Dynamic range | 0.621 | 0.707 | -0.085 (-12.1%) |
| Latinate/Germanic ratio | 0.167 | 0.159 | +0.007 (+4.7%) |
| Register markedness score | 0.689 | 0.682 | +0.008 (+1.2%) |
| Opacity score | 0.684 | 0.849 | -0.165 (-19.5%) |
| Self-consciousness score | 0.290 | 0.000 | +0.290 (+29.0%) |

## Tacit (Rhetorical) Patterns

| Pattern | Draft | Trained target |
|---|---|---|
| alliterationDensity | 0.052 | 0.154 |
| polyptotonDensity | 0.178 | 0.077 |
| chiasmusCount | 86.000 | 6.000 |
| antithesisCount | 26.000 | 1.000 |
| anaphoraCount | 0.000 | 0.000 |
| isocolonCount | 4.000 | 0.000 |
| climaxPatternCount | 35.000 | 0.000 |

## Qualitative Labels

| Axis | Draft label | Trained label | Match |
|---|---|---|---|
| nounVerb | balanced | predominantly verb-style | ✗ |
| parataxisHypotaxis | mixed | predominantly paratactic | ✗ |
| periodicRunning | mixed | predominantly periodic | ✗ |
| voice | moderate voice | unvoiced | ✗ |
| primaryRegister | high | high | ✓ |
| opacity | opaque | opaque | ✓ |

## Analyzer Explanations (for the draft)

**nounVerb**: Balanced noun-verb ratio with moderate nominalization (6.4/100 words) and 3.2 prepositional phrases per sentence.

**parataxisHypotaxis**: Mixed coordination and subordination, alternating between paratactic and hypotactic movement.

**periodicRunning**: Mixed sentence architecture with both periodic suspension and running delivery.

**voice**: Effaced authorial presence with minimal rhythmic variety (dynamic range 0.62). The prose foregrounds content over personality.

**register**: Low register with predominantly Germanic/short vocabulary (83% non-Latinate). Markedness 69%.

**opacity**: Opaque prose: frequent self-conscious attention to language itself — meta-linguistic markers, sound patterning, and rhetorical display foreground the medium.

**tacitPatterns**: Detected tacit persuasion figures: polyptoton (0.18/sent); chiasmus (86); antithesis (26); isocolon (4); climax patterns (35).

## Overall Conformance Summary

**Mean absolute deviation (6 primary axes):** 0.063
**Conformance score (1 − mean abs dev):** 0.937

Interpretation:
- 1.00 = identical to trained profile on the six primary Lanham axes
- 0.90-0.99 = very close match; imperceptible stylistic variance
- 0.80-0.89 = close match; readers would perceive stylistic continuity
- 0.70-0.79 = moderate match; recognizable as the same register but with audible divergence
- <0.70 = distinct enough that a careful reader might notice a shift in voice

## Raw JSON

```json
{
  "nounVerbRatio": 0.6366712911992038,
  "nominalizationDensity": 6.43156750038838,
  "prepositionalPhraseDensity": 3.226086956521739,
  "beVerbRatio": 0.2028985507246377,
  "parataxisHypotaxisRatio": 0.4101997493492721,
  "coordinatingConjunctionDensity": 0.0416343016933354,
  "subordinatingConjunctionDensity": 0.02842939257418052,
  "periodicRunningRatio": 0.5986336464560206,
  "preMainVerbClauseCount": 0.10434782608695652,
  "voiceScore": 0.24495966026090005,
  "dynamicRange": 0.621247686439178,
  "latinateGermanicRatio": 0.16651665166516652,
  "registerMarkednessScore": 0.689451564847654,
  "opacityScore": 0.6837011098109675,
  "selfConsciousnessScore": 0.2898550724637681,
  "tacitPatterns": {
    "alliterationDensity": 0.05217391304347826,
    "polyptotonDensity": 0.1782608695652174,
    "chiasmusCount": 86,
    "antithesisCount": 26,
    "anaphoraCount": 0,
    "isocolonCount": 4,
    "climaxPatternCount": 35
  },
  "labels": {
    "nounVerb": "balanced",
    "parataxisHypotaxis": "mixed",
    "periodicRunning": "mixed",
    "voice": "moderate voice",
    "primaryRegister": "high",
    "registerMixed": false,
    "opacity": "opaque"
  },
  "explanations": {
    "nounVerb": "Balanced noun-verb ratio with moderate nominalization (6.4/100 words) and 3.2 prepositional phrases per sentence.",
    "parataxisHypotaxis": "Mixed coordination and subordination, alternating between paratactic and hypotactic movement.",
    "periodicRunning": "Mixed sentence architecture with both periodic suspension and running delivery.",
    "voice": "Effaced authorial presence with minimal rhythmic variety (dynamic range 0.62). The prose foregrounds content over personality.",
    "register": "Low register with predominantly Germanic/short vocabulary (83% non-Latinate). Markedness 69%.",
    "opacity": "Opaque prose: frequent self-conscious attention to language itself — meta-linguistic markers, sound patterning, and rhetorical display foreground the medium.",
    "tacitPatterns": "Detected tacit persuasion figures: polyptoton (0.18/sent); chiasmus (86); antithesis (26); isocolon (4); climax patterns (35)."
  },
  "analysisDepth": "heuristic",
  "confidenceByAxis": {
    "nounVerb": "high",
    "register": "high",
    "voice": "medium",
    "parataxisHypotaxis": "medium",
    "opacity": "medium",
    "tacitPatterns": "medium",
    "periodicRunning": "low"
  }
}
```