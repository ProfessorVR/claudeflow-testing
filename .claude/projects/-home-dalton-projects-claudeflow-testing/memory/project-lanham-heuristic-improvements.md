---
name: Lanham heuristic improvement opportunities
description: Ideas for improving Lanham analyzer calibration beyond regex heuristics — needed to close the gap between current scores and targets
type: project
---

The authoritative gold set (40 entries from Lanham's Analyzing Prose) reveals fundamental limitations of regex-based heuristics. Current calibration scores against authoritative labels:

- nounVerb: 0.590 (target 0.85)
- register: 0.574 (target 0.85)
- voice: 0.372 (target 0.75)
- parataxis: 0.372 (target 0.70)
- opacity: 0.193 (target 0.70)
- periodicRunning: 0.349 (target 0.65)

## Improvement Approaches to Consider

### 1. Dependency Parsing (spaCy/tree-sitter)
- **periodicRunning**: Identify main verb position in dependency tree. If main verb is late in the sentence = periodic. This would fix the Gettysburg/Churchill misranks.
- **parataxis**: Distinguish coordination of independent clauses from coordination within subordinate phrases. Drummond's "and" links participial phrases (hypotactic), not independent clauses.
- **nounVerb**: Identify agent-patient relationships. Noun-style prose has abstract agents and be-verbs; verb-style has concrete agents doing things.

### 2. Embedding-Based Similarity
- Train a small classifier on the 40 gold set entries using sentence embeddings (gte-Qwen2-1.5B already running locally on port 8000).
- For each axis, compute embedding similarity to known exemplars at each pole.
- Would capture holistic "feel" rather than surface features.

### 3. Syllable Counting for Register
- Register correlates with syllable count per word, not just word length.
- "Arenaceous" vs "sandy" is a register distinction that syllable counting captures better than character counting.
- Could use a pronunciation dictionary or simple heuristic (vowel clusters).

### 4. Voice: Read-Aloud Simulation
- Lanham's voice = "does this prose reward reading aloud?"
- Could simulate pitch contour by mapping sentence structure to stress patterns.
- Emphatic positions (end-stress, sentence-initial stress) carry voice.
- Monotonous passages (Federal Register) lack stress variation.

### 5. Opacity: Tacit Pattern Density as Primary Signal
- Current opacity formula underweights tacit patterns. Lanham's opacity IS dense rhetorical patterning.
- Consider making tacit pattern density (anaphora, chiasmus, alliteration, polyptoton) the dominant signal (0.50+ weight).
- The AT/THROUGH distinction maps to: high pattern density = AT (opaque), low = THROUGH (transparent).

### 6. Cross-Axis Signals
- Lanham's High/Low register table (p. 164) explicitly lists: periodic = high, loose = low; hypotactic = high, paratactic = low; opaque = high, transparent = low.
- Register could incorporate parataxis/hypotaxis ratio and periodic/running ratio as secondary signals.

### 7. Gold Set Expansion
- Currently 40 entries. Could add more from chapters not fully covered (Ch. 10 Value Judgments, Epilogue).
- Could add the Gorgias Encomium on Helen (Ch. 4), Rose on Seneca (Ch. 3), Variety movie report expansion.
- More entries = more robust monotonicity measurement.

**Why:** The current heuristics have hit a ceiling at ~0.35-0.59 on the authoritative gold set. Approaches 1-2 would likely push into the 0.65-0.80 range. The gold set is the permanent measurement asset — any algorithm upgrade is now measurable.

**How to apply:** When working on Lanham module improvements, read this list and choose the approach with the best effort/impact ratio for the specific axis being targeted.
