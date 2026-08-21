# Claim Extraction Research Synthesis

**Date:** 2026-04-18
**Queries:** 12 Perplexity `sonar-pro` runs (~$0.19 total)
**Raw data:** `../perplexity/q01..q12_*.json`

---

## Executive summary

The 2024-2026 literature is **thin for our niche** (philosophy + classical texts + long primary sources). Perplexity consistently reported "evidence is thin" or "no direct work" across 7 of 12 queries. The general-purpose argument-mining and claim-extraction field, however, has concrete, transferable techniques:

1. **Microsoft Claimify (2024-2025)** — the cleanest multi-stage pipeline, achieves 99% entailment.
2. **Toulmin + IBM Debater CDC + Walton/Stab-Gurevych** — taxonomy stack that covers most argumentative prose.
3. **ARIES benchmark (2024)** — reveals that contemporary argument-mining models **do not transfer** across domains (relevant warning for us).
4. **"Use-vs-mention" failures in LLMs** (arXiv 2024) — 8-20% false-positive rate treating *reported* claims as *endorsed* claims. This is our single biggest risk on dialectical texts (Aristotle, Heidegger, Plato).
5. **LogitMatch (2024)** — constrained-decoding span grounding, unavailable in Anthropic API but motivates a fuzzy-match post-hoc verification step.
6. **Few-shot with out-of-domain exemplars HURTS** (Instruction-following LLMs for Claim Matching, COLING 2025) — zero-shot beats few-shot under domain shift. Relevant because our gold set will be tiny and drawn from philosophy, not the model's training bias.

Upshot: our existing extractor is directionally correct (Toulmin-style) but has six concrete upgrade targets and must be split into a primary-text variant with a different taxonomy.

---

## What the existing extractor gets right

`tmp/analysis-upgrade/sandbox/scripts/extract_nussbaum.py` produces 119 claims from Nussbaum 1985 with:

| Field | Toulmin mapping | Kept in upgrade? |
|---|---|---|
| `claim` | Claim | Yes |
| `ground` | Grounds | Yes |
| `warrant` | Warrant | Yes |
| `qualifier` | Qualifier | Yes |
| `rebuttal` | Rebuttal | Yes |
| `citation` | Backing (source) | Yes, **upgraded** |
| `author_position` | Speaker attribution | Yes, **upgraded** (split into two fields) |
| `key_concepts` | — (ontology hook) | Yes |

Strengths:
- Acknowledges OCR noise explicitly in the prompt.
- Returns strict JSON; regex-salvage for malformed output.
- Chunks by page window (6 PDF pages) — reasonable middle ground.
- Attributes to other scholars correctly in ~85% of cases per manual spot-check during the original sandbox run.

## What it gets wrong (six specific upgrade targets)

### U1. No verbatim grounding — citations are Bekker-strings only, not text snippets.
- *Evidence:* q05 (PaperTrail, 2026): "decomposes papers and answers into discrete claims for finer alignment." Citation-only provenance allows hallucinated Bekker numbers.
- *Fix:* every claim must return a `quote` field containing a verbatim substring of the chunk. Post-hoc fuzzy-match confirms the quote exists in source; claims with no match are flagged `grounding: unverified`.

### U2. Use-mention conflation on reported views.
- *Evidence:* q11 ("NLP Systems That Can't Tell Use from Mention Censor Counterspeech", arXiv 2024) — 8-20% FPR on GPT-3.5/4.
- *Concrete example from existing Nussbaum output:* several claims tagged `author_position: Nussbaum` are in fact positions she reports from Hamlyn/Wedin/Schofield. Current one-field `author_position` cannot express "Nussbaum reports Wedin's view (neutrally)" vs "Nussbaum endorses Wedin's view" vs "Nussbaum critiques Wedin's view."
- *Fix:* split into `speaker` (who says it) + `stance` (author-relationship: `endorses` / `reports-neutral` / `concedes` / `critiques` / `refutes`) + `use_mention` (`use` or `mention`).

### U3. One-shot prompt doesn't disambiguate.
- *Evidence:* q09 (Claimify): stage-3 disambiguation reduces OCR noise errors and pronoun ambiguity. Our current prompt asks the model to handle all of this in one pass.
- *Fix:* add an explicit disambiguation stage for OCR-corrupted sentences and unresolved anaphora. Stage returns `disambiguated_sentence` which gets fed to decomposition.

### U4. No claim typology.
- *Evidence:* q02 (Stab & Gurevych, Walton schemes): philosophical texts mix thetic, definitional, interpretive, and dialectical claims. Our output treats all claims uniformly.
- *Fix:* add `claim_type` enum (see primary/secondary taxonomies below). Downstream ranking can weight by type (thesis > subsidiary, for instance).

### U5. No atomicity guarantee.
- *Evidence:* q06, q09 — atomicity is a key quality metric; compound claims fragment concept-resolution.
- *Fix:* Claimify-style decomposition stage. If a claim contains "and"/"but"/"although" joining two independent propositions, split.

### U6. No faithfulness check.
- *Evidence:* q06 — LLM-as-judge faithfulness is the dominant evaluation metric. We have zero verification today.
- *Fix:* post-extraction validator pass (same or different model) asks: "Is this claim fully supported by this quote?" Three-way response: `supported` / `partial` / `unsupported`. Unsupported claims are dropped or flagged.

---

## Why primary-text extraction needs a different design

Perplexity found no prior work on this. So the design below is reasoned from first principles plus the transferable techniques above.

### Structural differences from secondary lit

| Dimension | Secondary lit (Nussbaum) | Primary text (Aristotle DA) |
|---|---|---|
| **Authorial voice** | First-person argument | Mixed: thesis + dialectical objections voiced by interlocutors |
| **Structural anchors** | Section headers, paragraphs, citations | Bekker line-numbers (e.g., 432b15), book.chapter |
| **Language** | Modern English prose | English translation with inlined Greek terms |
| **Sentence density** | 1 claim / 2-3 sentences typically | Often 2-3 claims per sentence; Aristotle is compressed |
| **Dialectical load** | Occasional (when criticizing scholars) | Pervasive (whole chapters work through aporiai) |
| **Claim evidence** | Citations to primary text | Internal coherence, analogy, observation of nature |
| **Use-mention risk** | Moderate | Critical — Aristotle reports Democritus, Empedocles, Plato extensively |

### Claim typology differences

**Secondary-lit claim types (used for Nussbaum-style extraction):**
1. `primary_thesis` — the paper's overall argument
2. `subsidiary_claim` — supporting step in the argument
3. `interpretive_claim` — "Aristotle means X when he says Y"
4. `textual_claim` — "Aristotle writes X at DA 432b15"
5. `critical_claim` — author rejects a prior reading
6. `methodological_claim` — "We should read this passage by ..."
7. `concession` — acknowledged counterpoint

**Primary-text claim types (new — for Aristotle / Heidegger / Uexküll):**
1. `thetic` — Aristotle's own thesis ("phantasia is a kind of motion...")
2. `definitional` — genus-differentia, conceptual delimitation ("phantasia is that in virtue of which...")
3. `dialectical_objection` — view Aristotle voices to test ("Some say X because Y")
4. `dialectical_refutation` — Aristotle's counter ("but this cannot be right because...")
5. `aporetic` — a puzzle raised, not yet resolved
6. `predecessor_report` — "Democritus held X" / "Plato says in Timaeus..."
7. `exegetical_claim` — what Aristotle takes a predecessor to have meant
8. `empirical_observation` — observations about animal behavior, nature
9. `analogical_argument` — "as the ship is to the pilot, so the soul is to the body"
10. `methodological_remark` — "we must inquire into the cause of..."

Distinguishing (3) `dialectical_objection` from (1) `thetic` is the critical precision problem — 20% FPR here per q11.

### Provenance model

- **Secondary lit:** `quote` (verbatim string) + `page` (book page) + `section_header` (if available).
- **Primary text:** `quote` + `bekker` (e.g. "DA 432b15-18") extracted from surrounding text or page headers + `book_chapter` (e.g. "DA III.9").

For Heidegger's lectures (BCAP, B&T) there's no Bekker system — use `gesamtausgabe_page` (GA 18 p. 12) when available, else just page.

For Uexküll — use book page only.

---

## Recommended architecture

### Single shared core pipeline + per-genre tuning (Claimify-adapted)

```
                     +----------------+
PDF text + metadata  |  1. CHUNK &     |
  ──────────────────>|     STRUCTURE   |  (sections, Bekker markers, headers)
                     +-------+--------+
                             │
                             ▼
                     +----------------+
                     |  2. CANDIDATE   |  (per-sentence verifiability filter;
                     |     SELECTION   |   drop pure transitions/rhetoric)
                     +-------+--------+
                             │
                             ▼
                     +----------------+
                     |  3. DISAMBIG.   |  (OCR fixes, pronoun resolution,
                     |                 |   voice attribution)
                     +-------+--------+
                             │
                             ▼
                     +----------------+
                     |  4. DECOMPOSE   |  (split into atomic claims,
                     |                 |   capture ground/warrant/qualifier/rebuttal)
                     +-------+--------+
                             │
                             ▼
                     +----------------+
                     |  5. TYPE & STANCE│  (genre-specific taxonomy,
                     |                 |   use-mention detection)
                     +-------+--------+
                             │
                             ▼
                     +----------------+
                     |  6. GROUNDING   |  (verify quote exists in source,
                     |     VERIFY      |   flag unverified)
                     +-------+--------+
                             │
                             ▼
                           claim.jsonl
```

### Two variants, one codebase

Both variants use the same 6-stage pipeline. They differ in:

| Stage | Secondary-lit variant | Primary-text variant |
|---|---|---|
| 1. Chunk | 6-page windows, section-header metadata | Bekker-line windows (~60 lines), book.chapter metadata |
| 2. Select | "does this contain an argumentative claim?" | "does this contain a philosophical assertion, objection, or observation?" |
| 3. Disambig | resolve anaphora, clean OCR noise | same + resolve Greek term transliterations, restore voiced speakers |
| 4. Decompose | Toulmin 5-tuple | Toulmin 5-tuple + dialectical structure (objection/refutation linkage) |
| 5. Type | 7-class (thesis/subsidiary/interpretive/textual/critical/method/concession) | 10-class (thetic/definitional/... see above) |
| 6. Ground | quote + page + section | quote + Bekker line + book.chapter |

Implementation: **one Python module `extractor.py` with a `genre` parameter.** Prompts for stages 2-5 live in `prompts/secondary_*.md` and `prompts/primary_*.md`. Stages 1 and 6 are shared utilities.

### Anti-patterns the research warns against

- **Don't** add few-shot examples drawn from contemporary prose. q10 shows this *hurts* on domain-shift tasks. If we use few-shot, exemplars must come from the same genre (preferably same author).
- **Don't** trust character-offset return from the LLM. q12 shows "LLMs cannot count reliably." Use verbatim-quote-then-fuzzy-match.
- **Don't** ask one prompt to do all six stages. Claimify's 99% entailment depends on the cascade.
- **Don't** treat "Author says X" as endorsement. Require explicit use-mention tagging.

---

## Evaluation protocol

Following q06 + small-gold-set guidance.

### Gold set design
- **Size:** 30-50 hand-labeled claims across 2-3 passages.
- **Composition:** 1 Aristotle passage (~2 Bekker pages, estimated 10-15 claims) + 1 Heidegger BCAP passage (~3 pages, ~10 claims) + 1 secondary-lit passage from Caston or Frede (~2 pages, ~10 claims). Mix dialectical and non-dialectical content.
- **Annotation schema:** claim text + type + stance + use/mention + quote + source-span.
- **Label by:** manual human annotation (me), spot-checked with LLM-as-judge agreement.

### Metrics
| Metric | How | Target |
|---|---|---|
| Precision | % of extracted claims that a human judges as true claims in the text | ≥ 0.85 |
| Recall | % of gold claims that the extractor captures (semantic match, not string) | ≥ 0.70 |
| F1 | Harmonic mean | ≥ 0.77 |
| Grounding rate | % of claims where `quote` appears verbatim in source | ≥ 0.95 |
| Type accuracy | % of claim_type tags that match gold | ≥ 0.75 |
| Use-mention accuracy | % correctly tagged use vs mention | ≥ 0.90 (high bar — this is the critical bug) |
| Stance accuracy | % correctly tagged endorses/reports/critiques | ≥ 0.80 |
| Atomicity | % of claims that are single-proposition (LLM-judge) | ≥ 0.90 |

### Why these thresholds
- Precision > recall is a deliberate design choice — for downstream use (bridge generation, prompt injection into god-write), false positives cost more than false negatives. A missed claim lowers coverage; a false claim poisons the analytical layer and can propagate into the dissertation.
- Grounding rate at 0.95 because the primary upgrade goal is *anchoring claims to source*. Anything less than 0.95 means hallucinated quotes are reaching the index.
- Use-mention at 0.90 because that is where the arXiv 2024 paper sets the FPR bar for "censoring counterspeech"; philosophy has the same structure.

### Iteration protocol
1. Build v1. Run on gold set + 2 new (unseen) passages.
2. Compute metrics. If any metric < target, diagnose which stage failed.
3. Patch the offending stage's prompt or logic. Never widen the extractor's scope to catch more at cost of precision.
4. Re-run. Log delta on every pass.
5. Stop when all targets hit OR three consecutive iterations show no improvement on the failing metric (in which case accept the floor and flag the limitation).

---

## Deliverables for this sandbox run

1. `reports/01-research-synthesis.md` (this file) — findings.
2. `reports/02-extractor-design.md` — concrete spec for both variants.
3. `sandbox/scripts/extractor.py` — shared pipeline.
4. `sandbox/scripts/prompts/` — per-stage prompts for each genre.
5. `sandbox/gold/` — hand-labeled claims (30-50).
6. `sandbox/tests/` — evaluation runs, iteration logs.
7. `reports/03-final-evaluation.md` — results + promotion recommendation.

---

## Citations

Representative sources surfaced during research (full JSON in `../perplexity/`):

- Claimify (Microsoft Research, 2024-2025) — https://www.microsoft.com/en-us/research/blog/claimify-extracting-high-quality-claims-from-language-model-outputs/
- PaperTrail (arXiv 2602.21045, 2026) — claim-evidence interface for scholarly PDFs
- "Zero-shot and Few-shot Learning with Instruction-following LLMs for Claim Matching" (COLING 2025, arXiv 2501.10860)
- "Strategies for Span Labeling with Large Language Models" (arXiv 2601.16946, 2024) — LogitMatch
- "NLP Systems That Can't Tell Use from Mention Censor Counterspeech" (arXiv 2404.01651, 2024)
- ARIES Benchmark (ACL Anthology 2024.argmining-1)
- IBM Debater / Context-Dependent Claims (IJCAI 2015, still foundational)
- Stab & Gurevych argumentation schemes (ACL 2017)
- Toulmin (1958) — still the domain-independent default
