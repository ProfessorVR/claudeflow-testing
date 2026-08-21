# Lanham Style Conformance Report

**Document:** M₂→A₃: The Phantastic Motion and the Phantasma Proper (console draft)
**Source:** `a3-phantasma-console-draft-2026-04-23.md`
**Analyzer:** LanhamProseAnalyzer (Tier 1 heuristic, calibrated weights)
**Trained profile:** `dalton-academic-mkn82c3v`
**Draft word count (prose, strip-markdown):** 5,318
**Draft sentence count:** 190

## Sentence-Level Metrics

| Metric | Draft | Trained target | Δ |
|---|---|---|---|
| Average sentence length (words) | 27.99 | 31.24 | -3.254 (-10.4%) |
| Short-sentence ratio (<15 words) | 0.226 | 0.138 | +0.089 (+64.6%) |
| Long-sentence ratio (>30 words) | 0.400 | 0.516 | -0.116 (-22.5%) |

## Lanham Axis Metrics (six-axis analyzer)

| Axis / Metric | Draft | Trained target | Δ |
|---|---|---|---|
| Noun/verb ratio (lower = more verb-dominant) | 0.620 | 0.675 | -0.055 (-8.1%) |
| Nominalization density (per 100 words) | 6.588 | 4.310 | +2.277 (+52.8%) |
| Prepositional-phrase density | 3.575 | 5.154 | -1.579 (-30.6%) |
| Be-verb ratio | 0.203 | 0.107 | +0.096 (+89.7%) |
| Parataxis/hypotaxis ratio | 0.445 | 0.324 | +0.121 (+37.4%) |
| Coordinating conjunction density | 0.037 | 0.054 | -0.017 (-31.2%) |
| Subordinating conjunction density | 0.029 | 0.026 | +0.003 (+13.5%) |
| Periodic/running ratio (higher = more periodic) | 0.689 | 0.522 | +0.167 (+31.9%) |
| Pre-main-verb clause count (per sentence avg) | 0.070 | 0.154 | -0.084 (-54.6%) |
| Voice score | 0.245 | 0.244 | +0.001 (+0.5%) |
| Dynamic range | 0.578 | 0.707 | -0.129 (-18.3%) |
| Latinate/Germanic ratio | 0.181 | 0.159 | +0.022 (+13.7%) |
| Register markedness score | 0.700 | 0.682 | +0.018 (+2.7%) |
| Opacity score | 0.641 | 0.849 | -0.208 (-24.5%) |
| Self-consciousness score | 0.134 | 0.000 | +0.134 (+13.4%) |

## Tacit (Rhetorical) Patterns

| Pattern | Draft | Trained target |
|---|---|---|
| alliterationDensity | 0.038 | 0.154 |
| polyptotonDensity | 0.113 | 0.077 |
| chiasmusCount | 67.000 | 6.000 |
| antithesisCount | 12.000 | 1.000 |
| anaphoraCount | 0.000 | 0.000 |
| isocolonCount | 6.000 | 0.000 |
| climaxPatternCount | 29.000 | 0.000 |

## Qualitative Labels

| Axis | Draft label | Trained label | Match |
|---|---|---|---|
| nounVerb | balanced | predominantly verb-style | ✗ |
| parataxisHypotaxis | mixed | predominantly paratactic | ✗ |
| periodicRunning | predominantly running | predominantly periodic | ✗ |
| voice | moderate voice | unvoiced | ✗ |
| primaryRegister | high | high | ✓ |
| opacity | opaque | opaque | ✓ |

## Analyzer Explanations (for the draft)

**nounVerb**: Balanced noun-verb ratio with moderate nominalization (6.6/100 words) and 3.6 prepositional phrases per sentence.

**parataxisHypotaxis**: Mixed coordination and subordination, alternating between paratactic and hypotactic movement.

**periodicRunning**: Running style: sentences deliver their main clause early and accumulate trailing modifiers and qualifications.

**voice**: Effaced authorial presence with minimal rhythmic variety (dynamic range 0.58). The prose foregrounds content over personality.

**register**: Low register with predominantly Germanic/short vocabulary (82% non-Latinate). Markedness 70%.

**opacity**: Opaque prose: frequent self-conscious attention to language itself — meta-linguistic markers, sound patterning, and rhetorical display foreground the medium.

**tacitPatterns**: Detected tacit persuasion figures: polyptoton (0.11/sent); chiasmus (67); antithesis (12); isocolon (6); climax patterns (29).

## Overall Conformance Summary

**Mean absolute deviation (6 primary axes):** 0.095
**Conformance score (1 − mean abs dev):** 0.905

Interpretation:
- 1.00 = identical to trained profile on the six primary Lanham axes
- 0.90-0.99 = very close match; imperceptible stylistic variance
- 0.80-0.89 = close match; readers would perceive stylistic continuity
- 0.70-0.79 = moderate match; recognizable as the same register but with audible divergence
- <0.70 = distinct enough that a careful reader might notice a shift in voice

## Raw JSON

```json
{
  "nounVerbRatio": 0.6202942744492534,
  "nominalizationDensity": 6.587615283267458,
  "prepositionalPhraseDensity": 3.575268817204301,
  "beVerbRatio": 0.2032967032967033,
  "parataxisHypotaxisRatio": 0.44547473270583937,
  "coordinatingConjunctionDensity": 0.03707886316581969,
  "subordinatingConjunctionDensity": 0.029361942405420668,
  "periodicRunningRatio": 0.6891464699683878,
  "preMainVerbClauseCount": 0.06989247311827956,
  "voiceScore": 0.24489450209811858,
  "dynamicRange": 0.5775258687388014,
  "latinateGermanicRatio": 0.18095784341841123,
  "registerMarkednessScore": 0.6998122055105178,
  "opacityScore": 0.6407455546120124,
  "selfConsciousnessScore": 0.13440860215053763,
  "tacitPatterns": {
    "alliterationDensity": 0.03763440860215054,
    "polyptotonDensity": 0.11290322580645161,
    "chiasmusCount": 67,
    "antithesisCount": 12,
    "anaphoraCount": 0,
    "isocolonCount": 6,
    "climaxPatternCount": 29
  },
  "labels": {
    "nounVerb": "balanced",
    "parataxisHypotaxis": "mixed",
    "periodicRunning": "predominantly running",
    "voice": "moderate voice",
    "primaryRegister": "high",
    "registerMixed": false,
    "opacity": "opaque"
  },
  "explanations": {
    "nounVerb": "Balanced noun-verb ratio with moderate nominalization (6.6/100 words) and 3.6 prepositional phrases per sentence.",
    "parataxisHypotaxis": "Mixed coordination and subordination, alternating between paratactic and hypotactic movement.",
    "periodicRunning": "Running style: sentences deliver their main clause early and accumulate trailing modifiers and qualifications.",
    "voice": "Effaced authorial presence with minimal rhythmic variety (dynamic range 0.58). The prose foregrounds content over personality.",
    "register": "Low register with predominantly Germanic/short vocabulary (82% non-Latinate). Markedness 70%.",
    "opacity": "Opaque prose: frequent self-conscious attention to language itself — meta-linguistic markers, sound patterning, and rhetorical display foreground the medium.",
    "tacitPatterns": "Detected tacit persuasion figures: polyptoton (0.11/sent); chiasmus (67); antithesis (12); isocolon (6); climax patterns (29)."
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