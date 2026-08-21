# Extractor Design Specification

**Version:** 1.0 (sandbox MVP)
**Companion to:** `01-research-synthesis.md`

---

## 1. Module layout

```
sandbox/scripts/
├── extractor.py            # main pipeline, 6 stages, genre-parameterized
├── pdf_utils.py            # PDF + Bekker-marker + page-header parsing
├── prompts/                # externalized prompt templates
│   ├── candidate_primary.md
│   ├── candidate_secondary.md
│   ├── verify_faithfulness.md
│   └── shared_json_contract.md
├── fuzzy_match.py          # quote → source span matching
├── evaluate.py             # gold-set comparison + metrics
└── run_extraction.py       # CLI wrapper
```

## 2. Pipeline stages

**Stage 1 — Chunking** (Python-only):
- `primary`: split by ~1 Bekker page (roughly 25 line numbers, typically 1200-1600 chars of OCR text). Carry `book_chapter` (e.g., "DA III.3"), detected `bekker_range` (e.g., "427b1-428a10"), and `pdf_pages`.
- `secondary`: split by ~3 PDF pages (~6000-9000 chars). Carry `section_header` (heuristic: lines in ALL CAPS, or starting with digits followed by period), `pdf_pages`, and `book_pages` (if header detection finds a running page).

**Stage 2-5 — Combined extraction** (LLM call #1, per chunk):
A single heavy prompt produces a list of atomic claims with all fields populated. The prompt is Claimify-inspired but asks for all components in one pass to save API calls. If v1 evaluation shows type or stance accuracy below targets, these will be split out in v2.

Input: chunk text + genre-specific prompt + JSON schema + source metadata.

Output schema (per claim):
```json
{
  "quote": "...",               // ~10-40 word verbatim substring of chunk
  "claim": "...",               // atomic paraphrased proposition
  "ground": "",                 // Toulmin grounds; "" if none
  "warrant": "",                // implicit inferential rule; "" if none
  "qualifier": "",              // scope/modality marker; "" if none
  "rebuttal": "",               // counter-consideration author addresses; "" if none
  "claim_type": "thetic",       // genre-specific enum
  "stance": "endorses",         // endorses | reports_neutral | concedes | critiques | refutes
  "use_mention": "use",         // use | mention
  "speaker": "Aristotle",       // who makes the claim in the text
  "key_concepts": ["phantasia","aisthēsis"],
  "nearby_provenance": "427b1"  // Bekker or page; LLM's best guess from chunk markers
}
```

Token budget: max 4000 output tokens per chunk. For primary texts with ~1500-char chunks, this handles ~15-30 claims. For secondary chunks ~8000 chars, it handles ~20-40 claims.

**Stage 6 — Verification** (Python + optional LLM call #2):
1. `fuzzy_match(claim.quote, chunk_text)` → if ratio < 0.85, drop claim with `verified=false`.
2. Extract `char_start`, `char_end` from match.
3. From surrounding ±500 chars, pull nearest Bekker/page marker → overwrite `nearby_provenance` with parsed anchor.
4. (Optional) LLM faithfulness judge call: "Does this quote entail this claim?" → `supported` / `partial` / `unsupported`. Only run this if v1 grounding rate >0.95 but we need tighter faithfulness.

## 3. Genre-specific prompt strategy

### Primary text
- Emphasize: distinguish Aristotle's own thesis from positions he voices to refute.
- Taxonomy: 10-class (thetic / definitional / dialectical_objection / dialectical_refutation / aporetic / predecessor_report / exegetical / empirical_observation / analogical_argument / methodological_remark).
- Concrete guidance: "If a sentence opens 'Some say that...', 'Empedocles held...', 'Democritus to say that...', the claim's `speaker` is the cited predecessor and `use_mention = mention`. Aristotle's endorsement must be inferred from nearby cues ('we must therefore say...', 'it is clear that...', 'the truth is...')."
- Greek-term preservation: include transliterated Greek in `key_concepts` and preserve in `quote` exactly as OCR'd.

### Secondary lit
- Taxonomy: 7-class (primary_thesis / subsidiary_claim / interpretive_claim / textual_claim / critical_claim / methodological_claim / concession).
- Concrete guidance: "The author frequently reports other scholars. When `speaker` is a scholar other than the paper's author, set `stance` based on surrounding cues: `reports_neutral` if no evaluative language, `endorses` if 'Nussbaum is right that...', `critiques` if 'Nussbaum overlooks...'."
- Bekker citations in quotes (e.g., "427a26-29") should be captured in `nearby_provenance`.

## 4. Evaluation approach

See `01-research-synthesis.md §Evaluation protocol`. Key points:

- Gold set: 30-50 claims labeled by hand, one passage per genre variant.
- LLM-as-judge for precision (does each extracted claim appear true in source?) and faithfulness (quote→claim entailment).
- Manual verification for recall (did we catch all gold claims, using semantic match?).
- Manual verification for use-mention and stance tagging accuracy.

## 5. Iteration plan

v1 (combined prompt) → measure on gold set. Expected weak spots:
- Use-mention tagging (likely < 0.90 on first try given arXiv 2024 base rate).
- Dialectical objection vs. thetic distinction on Aristotle (high domain-specific ambiguity).
- Atomicity on compound claims.

v2 interventions if v1 misses targets:
- Split stages: run selection + disambiguation as a separate LLM call, feed disambiguated sentences to a decomposition call. Adds ~1x cost but Claimify evidence says it closes the precision gap.
- Add explicit "before you answer" reasoning block: model writes out its use-mention analysis before producing JSON.
- Add genre-specific few-shot exemplars drawn from already-extracted Nussbaum data (same-genre few-shot; warn against domain-shift few-shot from q10).

v3 interventions (if still failing):
- Ensemble: run extraction twice with different seeds/models and retain only claims that appear in both.
- Contrastive pairing: for each dialectical passage, ask the model to identify both the objection AND the refutation and link them as `rebuttal_of` / `refuted_by`.

## 6. Non-goals for this sandbox

- No Greek-to-English alignment. If a Greek term appears, preserve it.
- No cross-text concept resolution. That's the next pipeline stage (already built for Nussbaum).
- No multi-hop reasoning. One claim, one passage, one extraction.
- No HTML/PDF layout parsing beyond PyMuPDF's default text extraction. OCR-level issues will be tolerated but flagged.

## 7. Test matrix

| Run | Text | Genre | Pages | Expected claims |
|---|---|---|---|---|
| T1 | DA III.3 | primary | 41-44 | 30-60 |
| T2 | BCAP §4 | primary | 26-28 | 15-30 |
| T3 | Caston 1995 pp.281-284 | secondary | 2-5 | 15-25 |
| T4 (holdout) | Frede 1992 § Introduction | secondary | 2-4 | 15-25 |
