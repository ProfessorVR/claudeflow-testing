# Phase F: LLM Calibration Expansion — Detailed Plan

**Date:** 2026-04-17
**Status:** PROPOSAL — awaiting review
**Prerequisite:** Phases A-E complete (commit pending on `writing-pipeline-v2`)
**Estimated effort:** 8-12 hours + API costs (~$5-15 depending on passage count)

---

## 1. What This Phase Does and Why

Phases A-E delivered three substantial monotonicity improvements (nounVerb +0.142, register +0.099, periodic +0.130) but left three axes at their heuristic ceiling (voice 0.372, parataxis 0.372, opacity 0.192). Phases C and D also built infrastructure — AWL word list, syllable counter, voice entropy/contrast/terminal shortness, opacity deviation-from-norm — that degraded performance when activated with hand-picked weights because 40 passages are too few to optimize multi-signal composites without overfitting.

Phase F solves both problems by generating 200-500 additional labeled passages via Claude-as-judge, validating those labels against human review, then using the expanded dataset to optimize all composite weights through cross-validation.

### Current State (Post Phase A-E)

| Axis | Monotonicity | Target | Gap | Infrastructure Available but Unweighted |
|------|-------------|--------|-----|----------------------------------------|
| nounVerb | 0.732 | 0.85 | -0.118 | POS verb detection active; threshold tuning possible |
| register | 0.673 | 0.85 | -0.177 | F-score active at 30%; AWL density, polysyllabic ratio, 7-signal composite weights need optimization |
| periodic | 0.479 (T2) | 0.65 | -0.171 | Ensemble active; left-branch/suspension/sentence-length weights need grid search |
| voice | 0.372 | 0.75 | -0.378 | Entropy, consecutive contrast, terminal shortness computed but weight=0 |
| parataxis | 0.372 | 0.70 | -0.328 | Graded evidence ladder active; threshold tuning possible |
| opacity | 0.192 | 0.70 | -0.508 | Deviation-from-norm computed but weight=0; tacit pattern blend unchanged |

---

## 2. F1: Design the Claude Rubric

### 2.1 Rubric Structure

One prompt per passage, structured to return labels for all 6 axes. The rubric has three sections:

**Section A — Framework introduction** (~300 tokens, cached across all passages):
A brief grounding in Lanham's analytical method. Not the full book — just enough for the model to understand the axes are descriptive (not evaluative) and genre-relative (not absolute).

**Section B — Few-shot examples** (~2,000 tokens, cached):
3 examples from the authoritative gold set, chosen to span the label space:
1. **Burns (Ch. 1)** — noun-style, hypotactic, running, unvoiced, high register, transparent
2. **Hemingway (Ch. 2)** — verb-style, paratactic, running, voiced, low register, opaque
3. **Brougham (Ch. 2)** — balanced, hypotactic, periodic, voiced, high register, transparent

Each example includes the passage text, all 6 labels, and a 2-3 sentence justification per axis drawn from Lanham's own commentary in the `notes` field of the gold set.

**Section C — The passage to evaluate** (variable, ~200-800 tokens per passage).

### 2.2 Output Format

```json
{
  "axes": {
    "nounVerb": {
      "label": "predominantly noun-style" | "balanced" | "predominantly verb-style",
      "confidence": 0.0-1.0,
      "justification": "string"
    },
    "parataxisHypotaxis": {
      "label": "predominantly paratactic" | "mixed" | "predominantly hypotactic",
      "confidence": 0.0-1.0,
      "justification": "string"
    },
    "periodicRunning": {
      "label": "predominantly periodic" | "mixed" | "predominantly running",
      "confidence": 0.0-1.0,
      "justification": "string"
    },
    "voice": {
      "label": "unvoiced" | "moderate voice" | "strongly voiced",
      "confidence": 0.0-1.0,
      "justification": "string"
    },
    "primaryRegister": {
      "label": "high" | "middle" | "low" | "mixed",
      "confidence": 0.0-1.0,
      "justification": "string"
    },
    "opacity": {
      "label": "transparent" | "mixed opacity" | "opaque",
      "confidence": 0.0-1.0,
      "justification": "string"
    }
  }
}
```

The justification field is for auditability and inter-source validation (F4). It is NOT a chain-of-thought reasoning dependency — the label must stand on its own without the justification influencing it.

### 2.3 Per-Axis Rubric Grounding

Each axis gets a short description anchored in Lanham's own vocabulary:

**nounVerb:** "Is this prose dominated by nominalizations and prepositional phrase chains ('the implementation of the assessment of'), or by active verbs with human agents ('she walked in and stopped')? Lanham's 'Official Style' is noun-heavy; his verb style is action-driven."

**parataxisHypotaxis:** "Are clauses coordinated by 'and/but/or' in parallel chains (parataxis), or embedded inside each other through 'because/although/since/which/who' (hypotaxis)? Hemingway is paratactic; Holmes is hypotactic."

**periodicRunning:** "Does the sentence deliver its main predication early and trail qualifications afterward (running), or delay the main clause behind introductory subordinate material (periodic)? A sentence that starts 'If X, if Y, if Z, then W' is periodic. A sentence that starts 'He walked in and sat down' is running."

**voice:** "Does this prose reward being read aloud? Can you find natural places for emphasis, dynamic range between loud and soft? Or does it resist performance — a flat, bureaucratic evenness where 'you feel ridiculous trying to add a voice' (Lanham Ch. 5)?"

**primaryRegister:** "Is the diction formal and Latinate (high), plain and Anglo-Saxon (low), or unmarked middle? Churchill's speeches are high register; Hemingway is low; newspaper prose is middle."

**opacity:** "Does this prose draw attention to its own surface — through sound patterns, rhetorical figures, meta-linguistic gestures, or deliberate structural display (opaque/AT)? Or does it let you look through to the content without noticing the language itself (transparent/THROUGH)?"

### 2.4 What the Rubric Must NOT Do

- Must not ask the model to "reason step by step" or produce chain-of-thought traces
- Must not include labels that presuppose genre norms ("academic prose should be...") — labels are descriptive, not prescriptive
- Must not provide threshold numbers, score formulas, or heuristic details — the model should judge the prose, not reverse-engineer the heuristic
- Must not include more than 3-4 few-shot examples — too many examples bias the model toward the gold set's label distribution

---

## 3. F2: Curate the Expansion Corpus

### 3.1 Target: 300 Passages

300 is the target, not 200 or 500. Rationale:
- 200 is the minimum for stable cross-validated optimization across 6 axes
- 500 costs more than double (API + human review time) with diminishing returns
- 300 gives 240 train / 60 test in an 80/20 split, which is sufficient for 7-signal composite optimization on any single axis

### 3.2 Genre Distribution

The distribution should match the gold set's genre coverage while filling gaps in underrepresented groups:

| Genre | Gold Set Count | Target Expansion | Total After | Source Strategy |
|-------|---------------|-----------------|-------------|-----------------|
| Academic (humanities) | 3 | 40 | 43 | JSTOR open access, Stanford Encyclopedia of Philosophy, scholarly book prefaces |
| Academic (social science) | 2 | 25 | 27 | Published abstracts, sociological reviews, psychology papers |
| Academic (hard science) | 1 | 20 | 21 | Nature/Science editorials, geological survey reports, medical reviews |
| Legal | 3 | 25 | 28 | Federal Register, Supreme Court opinions (public domain), law review articles |
| Political (speeches) | 4 | 20 | 24 | American Rhetoric archive, Congressional Record, inaugural addresses |
| Political (other) | 2 | 15 | 17 | Manifestos, party platforms, UN resolutions |
| Literary fiction | 5 | 30 | 35 | Project Gutenberg (pre-1927), classic novel openings across periods |
| Narrative nonfiction | 3 | 25 | 28 | Memoirs, travel writing, personal essays (public domain) |
| Literary criticism | 1 | 15 | 16 | Published reviews, critical essays, prefaces to literary editions |
| Journalism | 1 | 20 | 21 | Wire service reports, feature articles, editorials (public domain archives) |
| Polemical | 2 | 15 | 17 | Political pamphlets, opinion pieces, protest literature |
| Religious | 1 | 10 | 11 | Biblical passages, sermons, theological treatises (public domain) |
| Textbook | 1 | 10 | 11 | Introductory textbook openings across disciplines |
| Technical | 0 | 15 | 15 | Software documentation, scientific methods sections, technical manuals |
| Personal correspondence | 1 | 10 | 11 | Published letter collections (public domain), diary excerpts |
| Military | 1 | 5 | 6 | After-action reports, military correspondence, strategy documents |
| **Total** | **40** | **300** | **340** | |

### 3.3 Passage Selection Criteria

Each passage must be:
- **100-400 words** (matching the gold set's passage length range)
- **Self-contained** (coherent without surrounding context)
- **Prose** (not poetry, dialogue-only, or tabular)
- **English** (any variety: British, American, archaic)
- **Public domain or fair-use excerpt** (no copyright issues)
- **Not from Lanham's book** (those are reserved for the authoritative gold set)

### 3.4 Passage Metadata

Each passage is stored as JSONL with the same schema as the gold set:
```json
{
  "id": "expansion_001",
  "genre": "academic-humanities",
  "text": "...",
  "source": "Author, Title (Publisher, Year), p. XX",
  "period": "18th-century" | "19th-century" | "20th-century" | "21st-century",
  "word_count": 247
}
```

No labels in the JSONL — labels come from Claude in F3.

### 3.5 Collection Method

Two approaches, used together:

**Approach A: Scripted extraction from Project Gutenberg / public domain archives.**
Write a script that downloads texts from Gutenberg (60,000+ English books), extracts 200-400 word passages from random positions, filters by prose quality (no chapter headings, no dialogue-only, no tables), and stores with metadata. This covers literary fiction, religious texts, personal correspondence, and historical political prose efficiently.

**Approach B: Manual curation for specialized genres.**
Academic, legal, technical, and journalistic passages require targeted selection from specific sources (JSTOR open access, Federal Register, software documentation). These are curated manually — ~100 passages at 5-10 minutes each = 8-16 hours.

### 3.6 Deduplication and Quality Filter

Before sending to Claude:
- Remove any passage that overlaps >50% with a gold set entry (Jaccard similarity on word sets)
- Remove passages shorter than 80 words or longer than 500 words after extraction
- Remove passages that are primarily dialogue (>50% of sentences in quotation marks)
- Remove passages with >20% non-English words or OCR artifacts

---

## 3.7 F2.5: Prompt Ablation Test

Before full-scale labeling, run a small comparison to measure how much the few-shot examples anchor Claude's label distribution versus how much the rubric descriptions alone do the work.

**Method:**
1. Select 15 passages from the expansion corpus (stratified by genre, 2-3 per bucket)
2. Run each passage through two prompt variants:
   - **Rubric-only:** Section A (framework) + Section C (passage), no few-shot examples
   - **Rubric-plus-few-shot:** Full prompt (Section A + B + C)
3. Compare label distributions across the two variants

**Interpretation:**
- If label distributions differ by <10% per axis: the rubric descriptions are doing the work. Few-shot examples are reinforcement, not anchoring. Proceed.
- If label distributions differ by >20% on any axis: the few-shot examples are materially anchoring that axis. This is a risk — the expansion labels may be biased toward the gold set's distribution rather than reflecting genuine analysis. Consider:
  - Reducing to 2 few-shot examples instead of 3
  - Selecting examples that are less extreme (avoid the most canonical passages)
  - Adding a "do not assume the distribution of these examples reflects the general distribution" instruction
- If distributions differ by 10-20%: moderate anchoring. Document and proceed, but flag this axis in the F4 bias detection checklist.

**Cost:** ~15 passages × 2 variants × ~500 output tokens = ~15K tokens. Negligible.

---

## 4. F3: Run Claude-as-Judge

### 4.1 API Configuration

- **Model:** `claude-sonnet-4-6` (best accuracy/cost balance for structured evaluation)
- **Temperature:** 0 (deterministic — we want consistent labels, not creative variation)
- **Max tokens:** 800 per response (6 axes × ~120 tokens each)
- **System prompt:** Section A (framework) + Section B (few-shot examples) — cached via prompt caching for all 300 passages
- **User prompt:** Section C (the passage) + "Evaluate this passage on all six Lanham axes. Return your analysis as JSON."

### 4.2 Cost Estimate

| Component | Tokens | Rate | Cost |
|-----------|--------|------|------|
| System prompt (cached, 300 calls) | ~2,300 × 300 = 690K (cached reads) | $0.30/M cached | ~$0.21 |
| Passage text (300 passages × ~300 avg) | ~90K input | $3/M | ~$0.27 |
| Responses (300 × ~600) | ~180K output | $15/M | ~$2.70 |
| **Total** | | | **~$3.18** |

Using Sonnet keeps costs under $5 even at 500 passages. If accuracy on the validation sample (F4) is below threshold, we can re-run specific axes with Opus at ~3x cost.

### 4.3 Batch Processing Script

A TypeScript script (`scripts/lanham-llm-calibration.ts`) that:
1. Loads the expansion corpus JSONL
2. Constructs the prompt (system + passage)
3. Sends to the Anthropic API via batch or sequential calls with rate limiting
4. Parses the JSON response, validates against the expected schema
5. Stores results as JSONL: `{id, genre, claude_labels: {...}, claude_confidence: {...}, claude_justifications: {...}}`
6. Handles failures gracefully (retry 3x, then skip and log)

### 4.4 Determinism Check

Run 10 passages twice at temperature=0 and verify label agreement. If agreement ≥ 95%, proceed with the full corpus.

If agreement < 95%, do NOT switch to majority voting at higher temperature (this adds variance to a pipeline designed for stability). Instead:
1. Keep temperature=0 for the full run
2. Flag passages where any axis label changed between the two runs as "unstable"
3. Send only the unstable passages to a second-pass adjudication: re-run with Opus, or include in the human review sample (F4)
4. Passages that remain unstable after adjudication are excluded from the optimization dataset

---

## 5. F4: Inter-Source Validation

### 5.1 Gold Set Distribution Comparison

Before any human review, automatically compare Claude's label distributions to the authoritative gold set's distributions:

| Axis | Gold Distribution | Claude Distribution (check) |
|------|------------------|-----------------------------|
| nounVerb | noun 12.5%, balanced 65%, verb 22.5% | Should be within ±15% of each bucket |
| parataxis | para 30%, mixed 30%, hypo 40% | Should be within ±15% |
| periodic | periodic 15%, mixed 30%, running 55% | Should be within ±15% |
| voice | unvoiced 12.5%, moderate 50%, voiced 37.5% | Should be within ±15% |
| register | high 40%, middle 37.5%, low 15%, mixed 7.5% | Should be within ±15% |
| opacity | transparent 25%, mixed 40%, opaque 35% | Should be within ±15% |

If Claude's distribution on the expansion set is dramatically different from the gold set (e.g., 60% "balanced" for nounVerb when gold has 65%), that is expected — the expansion corpus has different genre balance. But if Claude labels 90% of passages as "moderate voice" when the gold set has a wider spread, that flags a systematic bias.

**Genre-matched distribution check (required):** Since the expansion corpus intentionally has different genre balance than the gold set, a global distribution comparison cannot distinguish "different genre mix" from "model bias." For each genre group with n≥3 in both the gold set and expansion corpus, compute per-genre label distributions and compare. A model bias appears as a consistent shift within the same genre (e.g., Claude labels 80% of academic passages as "middle register" when the gold set's academic passages are 75% "high register"). A corpus-composition effect appears only in the aggregate.

**Action on distribution mismatch:** Do not reject the labels. Instead, document the mismatch, distinguishing per-genre model bias (actionable — may require rubric correction) from aggregate corpus-composition differences (expected). The human review sample (5.2) is the real validation.

### 5.2 Human Review Sample

Two layers of sampling:

**Base sample (30 passages):** Stratified by genre.
- 5 passages per each of 6 primary genre buckets (academic, legal, literary, political, journalistic, other)
- Within each bucket, select passages where Claude's confidence is mixed (some axes high, some low) — these are the most informative for validation

**Axis-risk supplement (12-18 additional passages):** Targeted at the three weakest axes.
- 4-6 passages where Claude's voice confidence is low or voice label is "moderate voice" (the most common mislabel)
- 4-6 passages where Claude's opacity confidence is low or opacity label is "mixed opacity"
- 4-6 passages where Claude's parataxis confidence is low or the passage contains multiple "that" tokens (the known disambiguation challenge)

These are drawn from outside the base sample. The supplement ensures that the axes with the widest gap to target (voice -0.378, opacity -0.508, parataxis -0.328) get enough human-reviewed data points to detect axis-specific bias.

**Total human review: 42-48 passages.** For each, the human reviewer labels all 6 axes independently, then we compute per-axis agreement.

### 5.3 Per-Axis Agreement Thresholds

| Agreement Level | Action |
|----------------|--------|
| **≥80%** (24+ of 30 agree) | Full trust: expansion set used at 100% weight for this axis |
| **76-79%** (23 of 30) | Partial trust: expansion set used at 50% weight-factor for this axis |
| **<76%** (≤22 of 30) | No trust: expansion set excluded for this axis; optimize using only the 40 gold passages |

Applied per-axis. A strong result on five axes is not blocked by one borderline axis.

### 5.4 Bias Detection Checklist

Flag if any of these patterns appear in the 30-passage review:
- **Verbosity bias:** Claude systematically rates longer passages as more "voiced" or "opaque"
- **Formality-register conflation:** Claude conflates formal/informal with high/low register (register is about diction, not tone)
- **Hypotaxis inflation:** Claude counts any complex sentence as hypotactic (same bug our heuristic had)
- **Transparency default:** Claude defaults to "transparent" for any passage without obvious meta-linguistic markers
- **Period blindness:** Claude labels all pre-20th-century prose as "high register" regardless of actual diction

If a bias is detected, add a corrective note to the rubric and re-run the affected passages before proceeding.

---

## 6. F5: Cross-Validated Weight Optimization

### 6.1 Dataset Preparation

The authoritative 40-passage gold set is **exclusively a validation holdout** — it is never used in weight selection, training, or test splitting. The optimizer trains and tests only on the expansion set.

Prepare the expansion dataset (300 passages, labeled by Claude, validated by F4):
- Split 80/20 stratified by genre → 240 train / 60 test
- Each passage carries per-axis weight factors from F4 validation (1.0 / 0.5 / 0.0)
- Each passage also carries per-axis confidence scores from Claude (used for within-axis weighting — see 6.2)

The 40 gold passages are used only for:
1. Rubric design (F1 few-shot examples)
2. Post-optimization final validation (F5.4)
3. Regression reporting (F6)

### 6.2 What Gets Optimized

For each axis, the optimizer searches for weights that maximize Spearman rank monotonicity between heuristic continuous scores and label ordinals on the training set.

**Per-passage confidence weighting (calibrated, not raw):** Model-reported confidence is not automatically calibrated — a model that reports 0.85 on voice labels might be wrong 40% of the time on voice specifically. Rather than using raw confidence as a direct multiplier, we calibrate it against the human-reviewed sample first.

**Calibration method:** Using the 42-48 human-reviewed passages from F4:
1. For each axis, bin Claude's confidence into three bands: high (≥0.80), medium (0.60-0.79), low (<0.60)
2. Compute the human-agreement rate within each band (e.g., high-confidence voice labels agree with human 85% of the time, medium agrees 60%, low agrees 40%)
3. Map bands to trust weights: high → 1.0, medium → agreement_rate / high_agreement_rate, low → 0.0 (excluded)

If the human-reviewed sample is too small for stable per-band rates on a given axis, fall back to a simpler two-tier scheme: confidence ≥ 0.70 → 1.0 weight, confidence < 0.70 → 0.5 weight, confidence < 0.50 → excluded.

**Implementation:** In the monotonicity objective function, multiply each passage's contribution by `axisWeightFactor × calibratedTrustWeight`. This ensures confidence only influences optimization to the degree it has been validated against human judgment, not to the degree the model claims.

**Register composite (7 signals):**
```
registerScore = w1*fScore + w2*awlDensity + w3*polysyllabicRatio
              + w4*contractionSignal + w5*sentLenSignal + w6*lgrMarkedness + w7*formalMarkers
```
Optimize: w1 through w7, constrained to sum to 1.0 and each ≥0.

**Voice composite (5 signals):**
```
voiceScore = w1*baseUnvoiced + w2*positiveVoice + w3*entropy + w4*contrast + w5*terminal
```
Optimize: w1 through w5, constrained to sum to 1.0 and each ≥0.

**Opacity composite (7 signals):**
```
opacityScore = w1*soundDensity + w2*polysyndeton + w3*repetition + w4*extremes
             + w5*metaLing + w6*contentOpacity + w7*deviation
```
Optimize: w1 through w7, constrained to sum to 1.0 and each ≥0.

**Periodic ensemble (3 signals):**
```
periodicScore = w1*leftBranch + w2*suspensionMarkers + w3*shortSentSignal
```
Optimize: w1 through w3, constrained to sum to 1.0 and each ≥0.

**Parataxis thresholds:**
- Optimize the graded evidence ladder weights (currently high=1.0, low=0.3)
- Optimize the nesting bonus magnitude (currently 0.08)
- Optimize the genre band boundaries (lowBand, highBand)

**NounVerb thresholds:**
- Optimize the nounStyleOverride thresholds (currently nomDensity>8, beVerb>0.25, pp>3.0)
- Optimize the genre band boundaries

### 6.3 Optimization Method

**Grid search with refinement** (not gradient descent — the search space is small enough):

1. **Coarse grid:** For each weight vector, sample 20 evenly-spaced candidate values per weight. For a 7-signal composite, this means evaluating ~20^6 combinations (constraining weights to sum to 1.0 reduces the search space dramatically via Dirichlet sampling — sample ~10,000 weight vectors from a Dirichlet distribution).
2. **Refine:** Take the top 10 weight vectors by training monotonicity. For each, sample 100 nearby perturbations (±0.05 per weight). Keep the best.
3. **Validate:** Evaluate the best weight vector on the 20% test set. If test monotonicity is within 0.05 of training monotonicity, the weights are stable (not overfit). If the gap exceeds 0.05, widen the Dirichlet sampling and repeat.

### 6.4 Threshold Calibration (Score → Label Boundaries)

The register bug in Phase A proved that good continuous scoring can coexist with catastrophically wrong derived labels. Phase F carries that lesson forward by fitting label boundaries as a named step rather than treating them as an implicit byproduct of weight selection.

**After choosing the best continuous weights on the expansion training split:**
1. For each axis, fit the two cutpoints (lowBand, highBand) that map the continuous score to the three categorical labels. Use the training split gold-standard Claude labels as targets.
2. Optimization criterion: maximize categorical agreement on the training split, breaking ties by monotonicity.
3. Validate the fitted cutpoints on the expansion test split. If test-split agreement drops by more than 5% compared to training, the cutpoints are overfit — widen the search range and refit.
4. Store the optimized cutpoints alongside the weights in the config file.

This gives separate, validated control over both ranking quality (weights → monotonicity) and labeling quality (cutpoints → agreement), preventing a repeat of the "good scores, broken labels" failure mode.

**Length-sensitivity check:** After fitting cutpoints, split the training set by word count into three bins (<150 words, 150-300 words, >300 words). For each axis, compute agreement within each bin using the fitted cutpoints. If short-passage agreement drops more than 15% below long-passage agreement on any axis (most likely nounVerb and register, where nominalization density and Latinate ratio are noisier on small samples), document the length sensitivity in the F6 calibration report as a known limitation. Do not attempt length-dependent cutpoints — 300 passages split into 3 length bins per 6 axes would overfit.

### 6.5 Final Validation (Gold Holdout)

After weight optimization (6.3) and threshold calibration (6.4), run the complete scoring pipeline (weights + cutpoints) against the 40-passage authoritative gold set. This set was never used in training, testing, or weight selection — it is exclusively a validation holdout. Report per-axis monotonicity AND per-axis categorical agreement separately.

**Pass criteria (both score quality and label quality must pass):**

Score quality (monotonicity):
- Each axis must meet or exceed its pre-optimization monotonicity baseline on the authoritative holdout
- At least 3 of 6 axes must show monotonicity improvement ≥0.03
- No axis may degrade monotonicity by more than 0.02

Label quality (categorical agreement):
- Each axis must meet or exceed its pre-optimization agreement baseline on the authoritative holdout
- No axis may degrade agreement by more than 5%
- The fitted cutpoints must produce test-split agreement within 5% of training-split agreement (overfitting check)

If either set of criteria is not met, the optimized weights and/or cutpoints are rejected and the pre-optimization values are retained. The most likely failure points are expansion set quality (revisit F4) or cutpoint overfitting (widen search range).

### 6.5 Implementation

**Hard dataset separation (enforced in code, not just prose):**

Two distinct dataset files with separate loader paths:
- `data/expansion-training.jsonl` — the 300 Claude-labeled expansion passages (for optimization)
- `data/gold-holdout.jsonl` — the 40 authoritative passages (for final validation only)

The optimizer script (`scripts/lanham-weight-optimizer.ts`):
1. Loads `expansion-training.jsonl` only — the gold holdout file is NOT loaded during optimization
2. Splits the expansion set 80/20 stratified by genre → 240 train / 60 test
3. **Assertion guard:** Validates that no passage ID from `gold-holdout.jsonl` appears in the training or test set. The script fails immediately if any gold ID is detected.
4. For each axis, runs the Dirichlet-sampled grid search on the training split
5. Reports the best weight vector, training monotonicity, test monotonicity
6. Outputs an intermediate weight config

A separate validation script (`scripts/lanham-holdout-validate.ts`):
1. Loads the intermediate weight config
2. Loads `gold-holdout.jsonl`
3. Runs the pass criteria (no axis degrades >0.02, at least 3/6 improve ≥0.03)
4. If passed, promotes the intermediate config to the final `lanham-calibrated-weights.json`

This two-script separation makes it impossible to accidentally include gold data in optimization, even if someone modifies the scripts later.

---

## 7. F6: Integration and Documentation

### 7.1 Weight Config File

Create `src/god-agent/cli/style/data/lanham-calibrated-weights.json`:
```json
{
  "calibrationDate": "2026-04-XX",
  "calibrationCorpusSize": 340,
  "goldSetSize": 40,
  "expansionSetSize": 300,
  "axes": {
    "register": {
      "weights": { "fScore": 0.XX, "awlDensity": 0.XX, ... },
      "trainMono": 0.XXX,
      "testMono": 0.XXX,
      "holdoutMono": 0.XXX
    },
    ...
  }
}
```

### 7.2 Analyzer Integration

Modify `LanhamProseAnalyzer` and `AdvancedLanhamAnalyzer` to load weights from the config file at construction time. The current hardcoded weights become the fallback if the config file doesn't exist.

### 7.3 Documentation

Publish a calibration report covering:
- Per-axis before/after monotonicity and agreement (authoritative holdout)
- Per-genre stratified results (n≥3 hard gate, n<3 watchlist)
- Failure-bucket regression results
- Claude label distribution vs. gold set distribution
- Human-Claude agreement per axis
- Which axes benefited from expansion and which did not
- Recommendations for future calibration cycles

### 7.4 Calibration Cycle Policy

Phase F is not a one-time operation. Establish a policy for recalibration:
- **Trigger:** When new heuristic features are added or existing weights are suspected of drift
- **Frequency:** No more than quarterly unless triggered
- **Incremental:** New passages can be added to the expansion set without re-labeling existing ones
- **Gold set growth:** If new passages from Lanham's book are identified, they are added to the authoritative set (not the expansion set)

---

## 8. Execution Order and Gates

```
F1: Design rubric (1-2 hours)
  │
  ├── GATE: Review rubric with human before proceeding.
  │         Run rubric on 5 gold set passages and verify
  │         Claude labels match gold labels on ≥4/5.
  │
F2: Curate expansion corpus (6-10 hours, partially scriptable)
  │
  ├── GATE: Verify 300 passages meet selection criteria.
  │         Spot-check 10 for prose quality and metadata accuracy.
  │
F2.5: Prompt ablation test (30 min)
  │
  ├── GATE: Per-axis distribution difference <20% between
  │         rubric-only and rubric-plus-few-shot variants.
  │         If >20% on any axis, revise few-shot selection.
  │
F3: Run Claude-as-judge (1-2 hours including retries)
  │
  ├── GATE: Determinism check on 10 passages (flag unstable,
  │         adjudicate via Opus or human — no majority voting).
  │         Schema validation on all responses.
  │
F4: Inter-source validation (3-5 hours for human review of 42-48 passages)
  │
  ├── GATE: Per-axis agreement thresholds met (base 30 + axis-risk 12-18).
  │         Per-genre distribution checks for n≥3 groups.
  │         Bias detection checklist clear (or corrective re-run done).
  │
F5: Weight optimization + threshold calibration (2-3 hours)
  │     Train/test split on expansion set ONLY.
  │     40 gold passages are holdout, never in training.
  │     Calibrated (not raw) confidence weighting within trusted axes.
  │     Hard dataset separation enforced: two scripts, assertion guard.
  │
  │     F5a: Weight search (Dirichlet grid on training split)
  │     F5b: Threshold calibration (cutpoint fitting on training split)
  │     F5c: Test-split validation (weights + cutpoints)
  │     F5d: Gold holdout validation (final gate)
  │
  ├── GATE: Test set monotonicity within 0.05 of training.
  │         Test set agreement within 5% of training.
  │         Authoritative holdout: no axis degrades mono >0.02 or agree >5%.
  │         At least 3/6 axes improve monotonicity ≥0.03.
  │
F6: Integration and documentation (1-2 hours)
  │
  └── GATE: All 19 existing tests pass.
            Failure-bucket regression stable.
            Genre-stratified calibration: no n≥3 group degrades.
```

---

## 9. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Claude labels are systematically biased on one axis | Medium | Medium | Per-axis F4 validation; 50% weight-factor for borderline axes |
| Expansion corpus is too homogeneous (genre imbalance) | Low | High | Stratified sampling targets; genre metadata required |
| Optimized weights overfit to expansion set | Medium | High | 80/20 cross-validation; 40-passage authoritative holdout; 0.05 gap threshold |
| Voice and opacity remain at ceiling despite expanded data | Medium | Low | Expected for reader-response axes; document as known limitation |
| Rubric primes Claude to match gold set distribution | Low | Medium | Rubric uses descriptions, not statistical targets; distribution comparison in F4 detects this |
| API costs exceed budget | Low | Low | Sonnet at 300 passages ≈ $3-5; Opus fallback ≈ $10-15 |

---

## 10. Projected Outcomes

### Conservative (all axes get F4 validation ≥80%)

| Axis | Current | Projected | Target | Met? |
|------|---------|-----------|--------|------|
| nounVerb | 0.732 | 0.780 | 0.85 | No (close) |
| register | 0.673 | 0.780 | 0.85 | No (close) |
| periodic | 0.479 | 0.580 | 0.65 | No (close) |
| voice | 0.372 | 0.500 | 0.75 | No |
| parataxis | 0.372 | 0.550 | 0.70 | No (close) |
| opacity | 0.192 | 0.400 | 0.70 | No |

### Optimistic (all axes get ≥80%, weights converge well)

| Axis | Current | Projected | Target | Met? |
|------|---------|-----------|--------|------|
| nounVerb | 0.732 | 0.830 | 0.85 | Nearly |
| register | 0.673 | 0.820 | 0.85 | Nearly |
| periodic | 0.479 | 0.640 | 0.65 | Nearly |
| voice | 0.372 | 0.580 | 0.75 | No |
| parataxis | 0.372 | 0.620 | 0.70 | Close |
| opacity | 0.192 | 0.480 | 0.70 | No |

Voice and opacity are not expected to reach their targets even with LLM calibration. These axes measure phenomena (authorial intention, reader response) that neither heuristics nor LLM-as-judge can fully operationalize. The targets themselves may need revision — 0.75 for voice and 0.70 for opacity were set aspirationally and may not be achievable without a fundamentally different approach (e.g., human-in-the-loop real-time evaluation).
