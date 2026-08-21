# Pipeline Retest Comparison: Gold Standard vs Standard Pipeline (Fair Test)

**Date**: 2026-03-06 (retest)
**Topic**: "Motion, Time, Perception, and Phantasia: Aristotle's Temporal Framework and Heidegger's Interpretation"
**Prompt**: Identical — extracted from original gold standard prompt document
**Gold Standard Reference**: `C:\Users\Dalton\Documents\gold standard prompt.txt`

---

## Test Conditions

| Condition | Run 1 (Gold Standard) | Run 2 (Standard Pipeline) |
|-----------|----------------------|--------------------------|
| Mode | `--whitelist` (gold standard) | `--use-corpus` (standard) |
| Embedding service | **UP** | **UP** |
| Corpus retrieval | Multi-query sub-queries -> 15 chunks | Single-query -> 15 chunks |
| Inline validation | Disabled (single-shot) | **Enabled** (7 units, 1 passed) |
| Citation enforcement | Active (29 citations checked) | Active (9 citations checked) |
| Style profile | Injected via gold standard prompt | Not injected |
| Knowledge units | Loaded from god-learn | Not loaded |
| Min relevance | 0.35 (fixed from 0.75 bug) | 0.0 |
| Trajectory ID | `traj_1772844453392_ac584369` | `traj_1772844645679_4f3947de` |

**Key difference from previous test**: Both pipelines had full GPU access and retrieved 15 corpus chunks each. This is a fair comparison.

---

## Quantitative Comparison

### Word Count & Structure

| Metric | Run 1 (Gold Standard) | Run 2 (Standard) | Delta |
|--------|----------------------|-------------------|-------|
| **Total words** | 1,962 | 3,606 | **+84%** |
| Direct quotations | 21 | 37 | +76% |
| Formal citations | 29 | 9 | **-69%** |
| Hallucinated citations | 0 | 0 | -- |
| Citation corrections | 4 | 21 | +425% |

**Observation**: Run 2 produced nearly 2x more words and more quotations, but Run 1 had 3x more formal citations. Run 2 needed 21 citation corrections vs Run 1's 4, suggesting the standard pipeline's inline validation generates more citation artifacts that need cleanup.

### Source Diversity

| Metric | Run 1 (Gold Standard) | Run 2 (Standard) |
|--------|----------------------|-------------------|
| Chunks retrieved | 15 | 15 |
| Unique authors in chunks | 7 | 7 (identical) |
| Authors: | Aristotle, Heidegger, Rickert, O'Gorman, Burke, Multiple Authors, von Uexkull | Same |

**Observation**: Both pipelines retrieved the same 15 chunks (same query topic, same collection, same embedding service). Source diversity is identical — the retrieval layer is deterministic for the same query.

### Quality Gauntlet Scores

| Stage | Run 1 (Gold Standard) | Run 2 (Standard) | Winner |
|-------|----------------------|-------------------|--------|
| **Overall** | **71.5%** | **66.8%** | Run 1 |
| Argument Coherence | 93.2% | 94.3% | Run 2 |
| Citation Completeness | 99.4% | 99.0% | Run 1 |
| Style Consistency | 99.7% | 98.6% | Run 1 |
| Factual Accuracy | 99.7% | 99.6% | Tie |

**Observation**: Run 1 wins overall (71.5% vs 66.8%), driven by better style consistency and citation completeness. The gap is smaller than the previous unfair comparison (82.2% vs 84.2%).

### Issue Counts

| Severity | Run 1 (Gold Standard) | Run 2 (Standard) |
|----------|----------------------|-------------------|
| Critical | 30 | 62 |
| Major | 31 | 197 |
| Minor | 27 | 168 |
| **Total** | **88** | **427** |
| **Issues/word** | **0.045** | **0.118** |

**Observation**: Run 2 has 4.9x more total issues despite only 1.8x more words. Per-word issue rate is 2.6x worse. The inline validation pipeline introduces more artifacts (21 corrections needed vs 4).

### Inline Validation (Run 2 Only)

| Metric | Value |
|--------|-------|
| Units generated | 7 |
| Passed first attempt | 1 (14%) |
| Passed after retry | 0 |
| Failed units | 6 (86%) |
| Total attempts | 19 |
| Avg attempts/unit | 2.7 |
| Inline quality score | 84.8% |
| Quotation fidelity rate | 42.1% |

**Observation**: Inline validation is still struggling — only 1/7 units passed on first attempt, and 6/7 failed even after retries. The quotation fidelity rate of 42.1% means more than half the quotations don't match corpus text verbatim. Common failure reasons: hallucinated citations for common words ("his", "analysis", "framework"), and non-verbatim quotations being flagged.

---

## Comparison with Actual Gold Standard Document

Source: `research/generated-phantasia-temporal-section.md` (from 2026-02-10 backup)

| Metric | Actual Gold Standard | Run 1 (Whitelist) | Run 2 (Standard) |
|--------|---------------------|-------------------|-------------------|
| **Words** | 3,116 | 1,962 (**-37%**) | 3,606 (**+16%**) |
| **Sections** | 6 | 7 | 7 |
| **Direct quotations** | 4 (precise, verbatim) | 21 (inflated) | 37 (inflated) |
| **Authors cited** | 3 (Aristotle, Heidegger, White) | 7 | 7 |
| **Parenthetical citations** | 1 | 29 | 9 |
| **Avg sentence length** | 22.1 words | ~30+ words | ~30+ words |
| **Transition words** | 25 (thus 8, hence 4, indeed 3, accordingly 3, similarly 3, subsequently 2, specifically 2) | ? | ? |
| **Validation appendix** | None | Yes (inflates word count) | Yes (inflates word count) |

**Critical findings**:

1. **The gold standard is restrained, not maximalist**: Only 4 direct quotations, each precisely verbatim from corpus. The current pipelines produce 5-10x more "quotations" but many are near-misses (42% fidelity in Run 2). Quality over quantity.

2. **Word count is close to target**: Gold standard hit 3,116 words (target: 3,000-3,500). Run 2 exceeds this at 3,606. Run 1 undershoots at 1,962.

3. **Citation style is sparse and precise**: Only 1 parenthetical citation plus 3 inline Bekker references (De Anima II.5, 417b22-23 etc.). The pipelines over-cite with 9-29 parenthetical citations — not how the gold standard reads.

4. **Argumentative depth over source breadth**: The gold standard cites only 3 authors but develops a sustained, original philosophical argument (the "tripartite temporal schema" of Stimmung/phantasia/pathos). Both pipeline runs cite 7 authors but lack this kind of original synthesis.

5. **Sentence length is shorter than the trained profile target**: Gold standard averages 22.1 words/sentence, not the 31-word profile target. The actual writing is more readable than the profile predicts.

6. **No validation appendix**: The gold standard is pure scholarly prose without appended claim maps or quotation ledgers. The appendix inflates both runs' apparent word counts.

7. **The gold standard reads like a dissertation chapter**: Sustained argument across 6 sections with a clear thesis ("phantasia as temporal medium"), development (aisthesis -> Stimmung -> phantasia as bridge -> tripartite schema), and synthesis. The pipeline outputs read like structured summaries with more citations but less original thought.

---

## Root Cause Analysis

### Why both pipelines fail to match the gold standard's quality:

1. **Over-citation**: The gold standard uses only 4 quotations and 1 parenthetical citation across 3,116 words. Both pipelines are configured to maximize citations (citation enforcement, quotation fidelity checks), which produces a citation-dense but argumentatively shallow result
2. **Missing sustained argument**: The gold standard develops an original thesis ("tripartite temporal schema") across 6 sections. The pipelines produce structured summaries that cover subsections mechanically rather than building a cumulative philosophical argument
3. **Quotation inflation**: The pipeline prompt asks for "15+ citations" and "3-4 direct quotations from Heidegger's BCAP." The gold standard prompt also asked for this but the LLM chose quality over quantity — 4 precise quotations that anchor the argument
4. **Validation appendix overhead**: The pipeline adds ~500-800 words of appendix (claim maps, ledgers, etc.) that the gold standard doesn't have, distorting word count comparisons
5. **Style profile not matching actual output**: The trained profile says 31 words/sentence avg, but the gold standard actually averages 22.1 words. The profile may be over-specifying, causing the pipeline to produce artificially long sentences
5. **REMEMBER block effectiveness**: The original prompt had explicit "REMEMBER" instructions for style. The current system's REMEMBER block may not carry the same weight

### Why Run 2 produces more words but worse quality:

1. **Inline validation overhead**: 7 units x 2.7 attempts avg = 19 LLM calls vs Run 1's single-shot. More calls = more artifacts
2. **Citation false positives**: The validator flags common English words as "hallucinated citations" (e.g., "his", "analysis", "framework"), causing units to fail and retry
3. **Quotation infidelity**: 42.1% fidelity rate means the LLM generates near-miss quotations that don't exactly match corpus text, triggering corrections
4. **No style profile**: Run 2 doesn't inject the trained style, producing more generic academic prose

---

## Recommendations

### Immediate fixes needed:

1. **Fix minRelevance default**: Already fixed (0.75 -> 0.35 in cli.ts), needs commit
2. **Fix inline validation false positives**: Common English words being flagged as citation authors is the #1 cause of unit failures
3. **Increase default chunk count**: Change from 15 to 28-30 chunks to match the original prompt's density
4. **Improve sub-query extraction**: Multi-query retrieval should generate topic-specific queries ("Aristotle phantasia De Anima", "Heidegger kinesis Being-there") not just split prompt sections

### Architectural insights from gold standard analysis:

5. **De-emphasize citation count, emphasize argument structure**: The gold standard succeeds with only 4 quotations and 3 authors — the quality comes from sustained philosophical argument, not citation density. The pipeline's citation enforcement and quotation fidelity checks are optimizing for the wrong metric.
6. **Recalibrate the style profile**: The trained profile says 31 words/sentence but the gold standard averages 22.1. Either the profile was learned from different documents, or the gold standard prompt's REMEMBER block successfully overrode it. Consider lowering the target.
7. **Make validation appendix optional**: The gold standard has none. The appendix is useful for debugging but should not be part of the final output for real writing tasks.
8. **Single-shot generation may be better for academic writing**: Run 1 (single-shot, 1,962 words) produced fewer but more precise citations than Run 2 (inline validation, 3,606 words, 42% fidelity). The gold standard was also single-shot. Inline validation's unit decomposition may fragment the argument.
9. **The gold standard prompt's REMEMBER block is critical**: The explicit "Write in the trained Dalton Salvo style throughout. Long, architectonic sentences... NEVER put text in quotation marks unless it appears VERBATIM in the corpus chunks" instruction at the end of the prompt likely drove the gold standard's quality. The current pipeline should ensure this block is equally prominent.

---

## Artifact Locations

| Artifact | Path |
|----------|------|
| Run 1 content | `tmp/retest-20260306/run1-gold-final-content.md` |
| Run 1 result JSON | `tmp/retest-20260306/run1-gold-final-result.json` |
| Run 1 stderr | `tmp/retest-20260306/run1-gold-final-stderr.log` |
| Run 2 content | `tmp/retest-20260306/run2-standard-final-content.md` |
| Run 2 result JSON | `tmp/retest-20260306/run2-standard-final-result.json` |
| Run 2 stderr | `tmp/retest-20260306/run2-standard-final-stderr.log` |
| This comparison | `tmp/retest-20260306/pipeline-comparison-retest.md` |
| Original gold standard prompt | `C:\Users\Dalton\Documents\gold standard prompt.txt` |
| Actual gold standard output | `D:\god-agent-backup-20260210\...\research\generated-phantasia-temporal-section.md` |
| Retest schematic | `plans/full-retest-schematic.md` |
| Previous comparison (unfair) | `tmp/pipeline-comparison-20260306.md` |
| Code fix (minRelevance) | `src/god-agent/universal/cli.ts:1401` |
