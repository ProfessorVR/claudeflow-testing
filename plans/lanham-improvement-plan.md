# Lanham Prose Analysis — Comprehensive Improvement Plan

**Date:** 2026-04-16
**Status:** PROPOSAL — No code changes until reviewed
**Branch:** `writing-pipeline-v2` (commit `50f87f36`)
**Basis:** Tier 1 vs Tier 2 comparison (40 authoritative gold set passages) + web research on computational stylometrics

---

## Executive Summary

The Lanham module's heuristic ceiling has been reached. Current accuracy:

| Axis | Agreement | Monotonicity | Target Mono | Gap |
|------|-----------|-------------|-------------|-----|
| nounVerb | 42.5% | 0.590 | 0.85 | -0.260 |
| register | 47.5% | 0.574 | 0.85 | -0.276 |
| voice | 15.0% | 0.372 | 0.75 | -0.378 |
| parataxis | 45.0% | 0.372 | 0.70 | -0.328 |
| periodic | 45.0% | 0.349 | 0.65 | -0.301 |
| opacity | 32.5% | 0.193 | 0.70 | -0.507 |

Tier 2 adds complexity but only improves one axis (periodic: +20% agreement) while degrading two others (register: -32.5%, parataxis: -5%). The root causes are:

1. **Register bug:** Tier 2's `deriveLabels()` uses raw `latinateGermanicRatio` against genre thresholds — but lgr values never exceed 0.22, so every passage gets "low."
2. **Parataxis inflation:** Tier 2's relative clause + participial phrase detection overcounts, inflating hypotaxis scores for genuinely paratactic text.
3. **Periodic running bias:** Tier 2's clause splitter fragments periodic sentences too aggressively, misidentifying main verb position.
4. **Fundamental heuristic ceiling:** Regex/counting cannot disambiguate parts of speech, measure syntactic depth, or detect deviation from norms — all of which these axes require.

**The single highest-impact change:** Add a lightweight JavaScript POS tagger (~1 npm dependency). This unlocks improvements to 3 axes simultaneously (parataxis, periodic, register) and enables the Heylighen-Dewaele formality F-score, which is the most validated computational register measure in the literature.

---

## Part 1: Root-Cause Analysis (Confirmed by Diagnostic Testing)

### 1.1 Register — Tier 2 Catastrophic Bug

**Symptom:** Tier 2 labels 40/40 passages as "low" register. Monotonicity is identical to Tier 1 (scores delegate), but labels diverge on every single entry.

**Confirmed root cause:** In `advanced-lanham-analyzer.ts:843-874`, the register label derivation:

```
Tier 1 path (lanham-prose-analyzer.ts:688-698):
  if (rms >= 0.62) → high        // uses composite registerMarkednessScore
  else if (rms <= 0.38) → low
  else → middle

Tier 2 path (advanced-lanham-analyzer.ts:849-874):
  if (rms < 0.25) → route by lgr against genre boundaries
  else → route by lgr against genre boundaries with markedness check
```

**Diagnostic data (all 40 passages):**
- `registerMarkednessScore` ranges: 0.470 – 0.701 (always > 0.25)
- So Tier 2 always takes the else branch (rms >= 0.25)
- In the else branch, `latinateGermanicRatio` ranges: 0.000 – 0.216
- Genre `general` thresholds: `lowToMiddle=0.25`, `middleToHigh=0.45`
- **Every lgr < 0.25**, so every passage → "low"

**Why lgr is always low:** The suffix-based Latinate detector (`isLatinate()`) only catches words ending in -tion, -sion, -ment, -ance, -ence, -ity, -ous, -ive, -able, -ible, -al, -ual. Many Latinate words use other patterns ("consequent", "premise", "derive", "perceive", "conceive"). The denominator includes all short Germanic words (2-5 chars), which outnumber detected Latinate words 4:1 or more.

**Fix:** Either (a) align Tier 2 label derivation with Tier 1's rms-based approach, or (b) recalibrate genre thresholds to match actual lgr distributions, or (c) replace suffix-based Latinate detection with a proper word-list approach.

### 1.2 Parataxis/Hypotaxis — Systematic Overcounting

**Symptom:** 14 label disagreements between tiers. Tier 2 subordination density is consistently higher, pushing paratactic passages toward "mixed."

**Confirmed root cause:** Tier 2 counts three additional subordination signals:
- **Relative clauses:** `that/which/who/whom` + verb within 3 words. But "that" as demonstrative pronoun ("that year", "that nation") triggers false positives.
- **Participial phrases:** `-ing`/`-ed` words after clause boundaries. But past participles in passive constructions ("was killed") and gerunds as nouns ("the killing") are not subordination.
- **Nesting depth bonus:** Up to +0.15 for avg max nesting. Amplifies the overcounting.

**Diagnostic data (14 disagreement cases):**
- T2 subordinating density averages 38% higher than T1
- Coordinating density is always identical (both count the same explicit conjunctions)
- 7/14 cases: T1 correct, T2 wrong — the inflation hurts more than it helps
- Worst case: Lichtenstein T1=0.543 → T2=0.290 (massive swing, both miss gold "predominantly hypotactic")

**Fix:** Disambiguate "that" using POS tagging (WDT=relative vs. DT=demonstrative vs. IN=complementizer). Weight participial phrases at 0.3x instead of 1.0x. Reduce nesting depth bonus from 0.15 to 0.08.

### 1.3 Periodic/Running — Extreme Running Bias

**Symptom:** Tier 2 produces `periodicRunningRatio = 1.000` for 10/21 disagreement cases, including genuinely periodic passages (Federal Register, Brougham, Churchill Trinity).

**Confirmed root cause:** The clause splitter (`splitClauses()`) splits at every comma, semicolon, colon, and dash. For a sentence like:

> "If you have been in line, ordered simply to wait, and have watched the enemy bring their guns to bear upon you..."

This becomes ~6 clause fragments. The main-verb finder searches for the first finite verb not in a subordinate clause — but `COMMON_VERBS` includes high-frequency words like "have", "been", "do" that appear in subordinate clauses too. The algorithm finds "have" in the first "if" clause fragment, skips it (subordinate), but then finds another common verb in the second fragment before reaching the actual main clause.

**Key diagnostic evidence:**
- Sterne: T1=0.000 (periodic), T2=1.000 (running) — gold is "predominantly running" (T2 correct)
- Federal Register: T1=0.000 (periodic), T2=1.000 (running) — gold is "predominantly periodic" (T1 correct)
- Both flip to the extreme, suggesting the algorithm is binary rather than graded

**Fix:** (a) Use POS tagger to identify finite verbs (VBZ/VBP/VBD/MD) rather than the `COMMON_VERBS` set, (b) Don't split at every comma — only split at clause-boundary commas (after subordinate clauses, not list commas), (c) Add suspension marker detection (conditional openers, participial openers, fronted prepositional chains) as an independent periodic signal.

---

## Part 2: Research Findings — State of the Art

### 2.1 The POS Tagger Keystone

A lightweight JavaScript POS tagger unlocks improvements to 3+ axes simultaneously:

| Package | Accuracy | Speed | Size | License |
|---------|----------|-------|------|---------|
| `en-pos` | 96.43% (Penn Treebank) | Fast | Small | MIT |
| `wink-pos-tagger` | 93.2% | 525K tokens/sec | 10KB min | MIT |
| `compromise` | ~87% | Very fast | 180KB | MIT |

**Recommendation:** `en-pos` for accuracy or `wink-pos-tagger` for speed. Either provides the POS tags needed for "that" disambiguation, finite verb identification, and the Heylighen-Dewaele F-score.

### 2.2 Register — Heylighen-Dewaele F-Score

The most validated computational formality measure in the literature (Heylighen & Dewaele 1999):

```
F = 50 * ((freq_noun + freq_adj + freq_prep + freq_article
         - freq_pronoun - freq_verb - freq_adverb - freq_interjection) / N + 1)
```

- Score range: 0 (maximally informal) to 100 (maximally formal)
- Requires POS tag frequencies (directly available from the tagger)
- Validated across multiple languages and genres
- The R `formality` package implements it; the SQUINKY corpus (7,032 sentences) provides human ratings for calibration

**Supplementary:** Embed the Coxhead Academic Word List (570 word families) as a JSON lookup. AWL density is a strong high-register signal independent of POS tagging.

### 2.3 Register — Word List Tiers

Replace suffix-based Latinate detection with curated vocabulary tiers:

| List | Size | Signal |
|------|------|--------|
| General Service List (GSL) | ~2,000 families | Low register (everyday) |
| Academic Word List (AWL) | 570 families | High register (academic/formal) |
| New General Service List (NGSL) | ~2,800 families | Neutral baseline |

Register score = f(AWL density, GSL-only density, F-score, contraction rate, avg sentence length).

### 2.4 Parataxis — "That" Disambiguation

With POS tagging, "that" tokens are classified:
- **WDT** (wh-determiner): "the book **that** fell" → relative clause → subordination ✓
- **DT** (determiner): "**that** book" → demonstrative → NOT subordination ✗
- **IN** (subordinating conjunction): "he said **that**" → complement clause → subordination ✓

This single disambiguation eliminates the largest false-positive source. Expected impact: +10-15% agreement.

### 2.5 Periodic — Left-Branching Index + Suspension Markers

**Left-branching index:** With POS tags, identify the first finite verb (VBZ/VBP/VBD/MD) not preceded by a subordinating conjunction. Compute `mainVerbPosition / totalSentenceLength`. Values < 0.33 = running, > 0.67 = periodic.

**Suspension markers** (regex, no POS needed):
- Conditional openers: `^(If|When|Should|Were|Had|Provided that|Unless)\b`
- Participial openers: `^[A-Z][a-z]+(ing|ed)\b.*,` (participial phrase + comma)
- Absolute constructions: `^(The|His|Her|Their|Its) \w+ (being|having|done|completed|finished)\b`
- Fronted prepositional chains: 2+ prepositions before first verb
- Correlative suspensions: `not only...but also`, `neither...nor`, `whether...or`

### 2.6 Voice — Sentence Length Entropy + Consecutive Contrast

**Shannon entropy over quantized sentence lengths:**
```
Bins: [1-5, 6-10, 11-15, 16-20, 21-30, 31-50, 51+]
H = -Σ(p_i × log₂(p_i))
```
High entropy = rhythmic variety = voiced. Low entropy = monotonous = unvoiced.

**Consecutive length contrast:**
```
For each adjacent pair (s_i, s_{i+1}):
  contrast = |len(s_i) - len(s_{i+1})| / max(len(s_i), len(s_{i+1}))
Avg contrast across passage.
```
High contrast = deliberate rhythmic alternation (Mellinkoff, Woolf). Low contrast = bureaucratic evenness (Federal Register).

**Terminal shortness:** Check if final 1-2 sentences are < 50% of passage mean. Churchill: "Today is Trinity Sunday." signals voiced prose.

### 2.7 Opacity — Foregrounding Index + Deviation from Norm

**Miall-Kuiken foregrounding categories (1994):**
1. **Phonetic:** Alliteration + assonance + consonance + internal rhyme (partially implemented)
2. **Grammatical:** Fragments (no main verb), inverted word order, extreme sentence lengths
3. **Semantic:** Unexpected word combinations (requires surprisal metrics)

**Deviation-from-norm:** Build a "transparent norm" profile from the gold set's transparent passages (Federal Register, Pittsburgh, Darbyshire, Lichtenstein). Compute distance from this norm. Passages far from the norm in either direction are opaque.

**Immediate win:** Increase tacit pattern weight in opacity blending from 0.25 to 0.45. Lanham's most opaque passages all have dense rhetorical figures; his most transparent have zero.

### 2.8 LLM-as-Judge Calibration (Tier 3)

Use Claude as a "teacher model" for calibration expansion:
1. Gather 200-500 diverse prose passages
2. Send to Claude with Lanham-specific rubrics + gold set few-shot examples
3. Generate labeled training data
4. Use labels to tune Tier 1 heuristic weights via cross-validated optimization
5. Keep 40 authoritative gold set as hard validation (never train on it)

Expected impact: With 200+ labeled passages, proper coefficient optimization should push all axes above their targets.

---

## Part 3: Implementation Phases

### Phase A: Tier 2 Bug Fixes (Immediate, no new deps)

| # | Fix | File | Impact |
|---|-----|------|--------|
| A1 | Align Tier 2 register labels with Tier 1's rms-based approach | `advanced-lanham-analyzer.ts:843-874` | +32.5% register agreement |
| A2 | Reduce participial phrase weight from 1.0x to 0.3x | `advanced-lanham-analyzer.ts:410-415` | ~+3% parataxis |
| A3 | Reduce nesting depth bonus from 0.15 to 0.08 | `advanced-lanham-analyzer.ts:447` | ~+2% parataxis |
| A4 | Increase tacit pattern weight in opacity from 0.25 to 0.45 | `lanham-prose-analyzer.ts:74` | ~+5% opacity |

**Estimated effort:** 1-2 hours. No new dependencies. Pure threshold/weight adjustments.

### Phase B: POS Tagger Integration (Key enabler)

| # | Task | Impact |
|---|------|--------|
| B1 | Add `en-pos` (or `wink-pos-tagger`) as npm dependency | Enables B2-B5 |
| B2 | Replace `isVerb()` / `COMMON_VERBS` with POS-tagged verb identification | Better finite verb detection |
| B3 | Disambiguate "that" (WDT vs DT vs IN) in parataxis detection | ~+10-15% parataxis agreement |
| B4 | Use POS-tagged finite verbs for periodic main-verb detection | ~+10% periodic agreement |
| B5 | Implement Heylighen-Dewaele F-score using POS frequencies | ~+15-20% register monotonicity |

**Estimated effort:** 4-6 hours. Single npm dependency. Affects `lanham-shared.ts` (new POS utility functions), `lanham-prose-analyzer.ts`, and `advanced-lanham-analyzer.ts`.

### Phase C: Word Lists + Syllable Counting

| # | Task | Impact |
|---|------|--------|
| C1 | Embed Coxhead AWL (570 families) as JSON lookup | Register: AWL density signal |
| C2 | Embed GSL/NGSL core (~2,000 families) as JSON lookup | Register: low-register signal |
| C3 | Add heuristic syllable counter (vowel-cluster method) | Register + Voice: polysyllabic ratio |
| C4 | Optionally add `cmu-pronouncing-dictionary` for stress patterns | Voice: stress variance, Opacity: phonemic foregrounding |

**Estimated effort:** 3-4 hours for C1-C3. C4 adds ~3MB dependency, optional.

### Phase D: Voice + Opacity Enhancement

| # | Task | Impact |
|---|------|--------|
| D1 | Add sentence length entropy to voice scoring | ~+5-10% voice |
| D2 | Add consecutive length contrast metric | ~+5% voice |
| D3 | Add terminal shortness detection | ~+3% voice |
| D4 | Build transparent norm profile from gold set | Opacity: deviation metric |
| D5 | Add suspension marker regex list for periodic detection | ~+5% periodic |

**Estimated effort:** 4-5 hours. No new dependencies.

### Phase E: Periodic Sentence Overhaul

| # | Task | Impact |
|---|------|--------|
| E1 | Implement left-branching index using POS-tagged verb positions | ~+10-15% periodic |
| E2 | Fix clause splitter to distinguish clause-boundary commas from list commas | ~+5% periodic |
| E3 | Combine suspension markers + left-branching + comma distribution | Composite periodic score |

**Estimated effort:** 4-6 hours. Depends on Phase B.

### Phase F: LLM Calibration Expansion (Tier 3)

| # | Task | Impact |
|---|------|--------|
| F1 | Design Claude rubric with Lanham-specific criteria per axis | Foundation |
| F2 | Curate 200-500 diverse prose passages from public domain sources | Training corpus |
| F3 | Run Claude-as-judge on all passages (batch API) | Labeled expansion set |
| F4 | Cross-validated threshold optimization on heuristic weights | All axes above targets |
| F5 | Validate against 40 authoritative gold set (hard holdout) | Final verification |

**Estimated effort:** 8-12 hours + API costs. Largest impact but most effort.

---

## Part 4: Projected Impact

### Conservative estimates (Phases A+B only):

| Axis | Current Mono | After Phase A | After Phase B | Target |
|------|-------------|--------------|--------------|--------|
| nounVerb | 0.590 | 0.590 | 0.610 | 0.85 |
| register | 0.574 | 0.574 | 0.700 | 0.85 |
| voice | 0.372 | 0.372 | 0.372 | 0.75 |
| parataxis | 0.372 | 0.395 | 0.500 | 0.70 |
| periodic | 0.349 | 0.349 | 0.470 | 0.65 |
| opacity | 0.193 | 0.280 | 0.280 | 0.70 |

### Optimistic estimates (all phases A through E):

| Axis | Current Mono | Projected | Target | Met? |
|------|-------------|-----------|--------|------|
| nounVerb | 0.590 | 0.650 | 0.85 | No (needs LLM calibration) |
| register | 0.574 | 0.780 | 0.85 | Close |
| voice | 0.372 | 0.550 | 0.75 | No (needs LLM calibration) |
| parataxis | 0.372 | 0.600 | 0.70 | Close |
| periodic | 0.349 | 0.580 | 0.65 | Close |
| opacity | 0.193 | 0.450 | 0.70 | No (needs LLM calibration) |

### With LLM calibration expansion (Phase F):

All axes projected to reach or exceed targets. The bottleneck shifts from heuristic quality to gold set calibration volume.

---

## Part 5: Dependency Graph

```
Phase A (bug fixes, no deps)
    │
    ├──→ A1-A4: Immediate, independent
    │
Phase B (POS tagger)
    │
    ├──→ B1: npm install en-pos
    │     │
    │     ├──→ B2: Replace isVerb with POS tags
    │     ├──→ B3: "That" disambiguation
    │     ├──→ B4: Finite verb detection for periodic
    │     └──→ B5: Heylighen-Dewaele F-score
    │
Phase C (word lists) — independent of B
    │
    ├──→ C1-C2: AWL/GSL JSON embeds
    └──→ C3: Syllable counter
          │
          └──→ C4: CMU dictionary (optional)
                    │
Phase D (voice + opacity) — after B and optionally C4
    │
    ├──→ D1-D3: Voice entropy/contrast (independent)
    ├──→ D4: Norm profile (independent)
    └──→ D5: Suspension markers (independent)
          │
Phase E (periodic overhaul) — after B
    │
    ├──→ E1: Left-branching index (needs B4)
    ├──→ E2: Clause splitter fix (independent)
    └──→ E3: Composite scoring (needs E1+E2+D5)
          │
Phase F (LLM calibration) — after A-E validated
    │
    └──→ F1-F5: Sequential pipeline
```

---

## Part 6: Key References

| Source | Relevance |
|--------|-----------|
| Heylighen & Dewaele (1999), "Formality of Language" | F-score formula for register |
| Brooke, Wang & Hirst (2010), "Automatic Acquisition of Lexical Formality" | 86% accuracy formality scoring |
| Miall & Kuiken (1994), "Foregrounding, Defamiliarization, and Affect" | Operationalized foregrounding for opacity |
| Kurzynski (2024), "Cognitive Stylometry" | Perplexity as opacity proxy |
| Lagutina & Lagutina (2019), "Survey on Stylometric Text Features" | Comprehensive feature taxonomy |
| Zheng et al. (2024), "Survey on LLM-as-a-Judge" | Best practices for Tier 3 |
| Coxhead (2000), Academic Word List | 570 word families for register |
| SQUINKY corpus (Pavlick & Tetreault 2016) | 7,032 sentences with human formality ratings |

### npm packages identified:
- `en-pos` — 96.43% POS accuracy, pure JS, MIT
- `wink-pos-tagger` — 93.2% accuracy, 525K tokens/sec, MIT
- `cmu-pronouncing-dictionary` — stress patterns, ~3MB, MIT
- `syllable-count-english` — CMU + heuristic fallback

---

## Part 7: What NOT to Change

1. **The 40-passage authoritative gold set** — this is ground truth. Never tune thresholds to overfit it.
2. **Tier 1/Tier 2 architecture** — the two-tier approach is sound. Fix Tier 2, don't collapse to one tier.
3. **The genre-specific threshold system** — the `lanham-style-policy.ts` structure is correct; only the threshold values need adjustment.
4. **The controller facade pattern** — `LanhamStyleController` correctly isolates pipeline logic from the orchestrator.
5. **Opacity delegation to Tier 1** — this was the right call. Tier 2's opacity composite performed worse (confirmed in the original god-agent-v2 calibration).

---

## Recommended Execution Order

1. **Phase A** (1-2 hours): Fix Tier 2 bugs. Re-run comparison. Verify register agreement recovers to ≥47.5%.
2. **Phase B** (4-6 hours): Add POS tagger. Implement "that" disambiguation, F-score, finite verb detection.
3. **Re-calibrate**: Run full calibration suite after A+B. Document new baselines.
4. **Phase C** (3-4 hours): Word lists + syllable counting.
5. **Phase D** (4-5 hours): Voice entropy, opacity norm profile.
6. **Phase E** (4-6 hours): Periodic sentence overhaul.
7. **Re-calibrate**: Full suite after C+D+E. Document baselines.
8. **Phase F** (8-12 hours): LLM calibration expansion if targets not yet met.
