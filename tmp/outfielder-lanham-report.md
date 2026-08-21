# Lanham Style Conformance Report — Outfielder Rewrite

**Document:** The Outfielder (chain-aligned rewrite, 2026-06-10)
**Analyzer:** LanhamProseAnalyzer (calibrated heuristic)
**Trained profile:** `dalton-philosophical-mo2fmhy2` (active philosophical profile)
**Analyzed prose (main text, footnotes/headers/math stripped):** 2,047 words, 58 sentences

## Sentence-Level Metrics

| Metric | Draft | Trained target | Δ |
|---|---|---|---|
| Avg sentence length (words) | 35.29 | 33.40 | +1.890 (+5.7%) |
| Short ratio (<15w) | 0.172 | 0.119 | +0.053 (+44.7%) |
| Medium ratio (15–30w) | 0.190 | 0.327 | -0.137 (-41.9%) |
| Long ratio (>30w) | 0.638 | 0.554 | +0.084 (+15.1%) |

## Lanham Axis Metrics

| Axis / Metric | Draft | Trained target | Δ |
|---|---|---|---|
| Noun/verb ratio | 0.663 | 0.642 | +0.022 (+3.4%) |
| Nominalization density (/100w) | 4.773 | 5.117 | -0.344 (-6.7%) |
| Prepositional-phrase density | 4.431 | 5.077 | -0.646 (-12.7%) |
| Be-verb ratio | 0.198 | 0.130 | +0.068 (+51.8%) |
| Parataxis/hypotaxis ratio | 0.388 | 0.324 | +0.063 (+19.5%) |
| Coordinating-conj density | 0.046 | 0.053 | -0.007 (-14.1%) |
| Subordinating-conj density | 0.028 | 0.026 | +0.002 (+9.3%) |
| Periodic/running ratio | 0.626 | 0.594 | +0.031 (+5.3%) |
| Pre-main-verb clause count | 0.052 | 0.154 | -0.102 (-66.4%) |
| Voice score | 0.280 | 0.289 | -0.009 (-3.0%) |
| Dynamic range | 0.467 | 0.807 | -0.340 (-42.1%) |
| Latinate/Germanic ratio | 0.109 | 0.167 | -0.058 (-34.6%) |
| Register markedness | 0.682 | 0.687 | -0.006 (-0.8%) |
| Opacity score | 0.708 | 0.870 | -0.162 (-18.6%) |
| Self-consciousness score | 0.000 | 0.000 | +0.000 (+0.0%) |

## Qualitative Labels

| Axis | Draft label | Trained label | Match |
|---|---|---|---|
| nounVerb | balanced | balanced | ✓ |
| parataxisHypotaxis | mixed | predominantly paratactic | ✗ |
| periodicRunning | mixed | mixed | ✓ |
| voice | moderate voice | unvoiced | ✗ |
| primaryRegister | high | high | ✓ |
| opacity | opaque | opaque | ✓ |

## Analyzer Explanations (draft)

**nounVerb**: Active verb choices dominate with low nominalization (4.8/100 words), producing a dynamic, action-oriented prose rhythm.

**parataxisHypotaxis**: Mixed coordination and subordination, alternating between paratactic and hypotactic movement.

**periodicRunning**: Mixed sentence architecture with both periodic suspension and running delivery.

**voice**: Effaced authorial presence with minimal rhythmic variety (dynamic range 0.47). The prose foregrounds content over personality.

**register**: Low register with predominantly Germanic/short vocabulary (89% non-Latinate). Markedness 68%.

**opacity**: Opaque prose: frequent self-conscious attention to language itself — meta-linguistic markers, sound patterning, and rhetorical display foreground the medium.

**tacitPatterns**: Detected tacit persuasion figures: polyptoton (0.07/sent); chiasmus (15); antithesis (13); isocolon (5); climax patterns (6).

## Overall Conformance

**Label matches:** 4/6
**Mean absolute deviation (6 primary axes):** 0.049
**Conformance score (1 − MAD):** 0.951

Bands: ≥0.90 imperceptible variance · 0.80–0.89 readers perceive continuity · 0.70–0.79 same register, audible divergence · <0.70 noticeable voice shift.

## Raw JSON
```json
{
  "nounVerbRatio": 0.6633115356544389,
  "nominalizationDensity": 4.7733847637415625,
  "prepositionalPhraseDensity": 4.431034482758621,
  "beVerbRatio": 0.1980440097799511,
  "parataxisHypotaxisRatio": 0.38770565697543385,
  "coordinatingConjunctionDensity": 0.04580520732883317,
  "subordinatingConjunctionDensity": 0.027965284474445518,
  "periodicRunningRatio": 0.6258503401360545,
  "preMainVerbClauseCount": 0.05172413793103448,
  "voiceScore": 0.28002742771620587,
  "dynamicRange": 0.467387841805821,
  "latinateGermanicRatio": 0.10907811400422238,
  "registerMarkednessScore": 0.6815206549593791,
  "opacityScore": 0.7081304935767411,
  "selfConsciousnessScore": 0,
  "tacitPatterns": {
    "alliterationDensity": 0.08620689655172414,
    "polyptotonDensity": 0.06896551724137931,
    "chiasmusCount": 15,
    "antithesisCount": 13,
    "anaphoraCount": 0,
    "isocolonCount": 5,
    "climaxPatternCount": 6
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
    "nounVerb": "Active verb choices dominate with low nominalization (4.8/100 words), producing a dynamic, action-oriented prose rhythm.",
    "parataxisHypotaxis": "Mixed coordination and subordination, alternating between paratactic and hypotactic movement.",
    "periodicRunning": "Mixed sentence architecture with both periodic suspension and running delivery.",
    "voice": "Effaced authorial presence with minimal rhythmic variety (dynamic range 0.47). The prose foregrounds content over personality.",
    "register": "Low register with predominantly Germanic/short vocabulary (89% non-Latinate). Markedness 68%.",
    "opacity": "Opaque prose: frequent self-conscious attention to language itself — meta-linguistic markers, sound patterning, and rhetorical display foreground the medium.",
    "tacitPatterns": "Detected tacit persuasion figures: polyptoton (0.07/sent); chiasmus (15); antithesis (13); isocolon (5); climax patterns (6)."
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