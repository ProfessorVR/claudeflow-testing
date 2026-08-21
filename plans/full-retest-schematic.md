# Full Retest Schematic: Gold Standard vs Standard Pipeline

**Purpose**: Re-run the comparison with GPU services healthy so both pipelines have equal access to corpus retrieval.

---

## Pre-Flight (after PC restart)

```
1. Open terminal → cd ~/projects/claudeflow-testing

2. Verify GPU:
   nvidia-smi
   # Expect: GPU listed with free VRAM (need ~4GB for embedding + ~18GB for vLLM)

3. Start all services:
   ./scripts/god-launch start
   # Wait for all 6 services to show green

4. Verify embedding:
   curl -s -X POST http://localhost:8000/embed \
     -H "Content-Type: application/json" \
     -d '{"texts":["test"]}' | head -c 100
   # Expect: JSON with embedding vector, NOT error

5. Verify ChromaDB:
   curl -s http://localhost:8001/api/v2/heartbeat
   # Expect: {"nanosecond heartbeat":...}

6. Verify vLLM (optional — not needed for academic writing):
   curl -s http://localhost:8002/v1/models | head -c 100
```

**All 3 must pass before proceeding. If embedding fails, do NOT run the tests.**

---

## Run 1: Gold Standard Mode

```
npx tsx src/god-agent/universal/cli.ts write \
  'Write a 3,500-word dissertation section on "Orienting Faculties: Phantasia and Stimmung as World-Disclosing Structures in Aristotle and Heidegger"

This section should provide a detailed comparative analysis of how both Aristotle'\''s phantasia and Heidegger'\''s Stimmung function to orient/attune the subject to their world.

**CORPUS-ONLY CITATION CONSTRAINT**: Cite ONLY from these available sources:
- Aristotle: De Anima, Rhetoric, De Motu Animalium, De Sensu, De Memoria
- Heidegger: Being and Time, Basic Concepts of Aristotelian Philosophy
- Secondary: Frede, Nussbaum, O'\''Gorman, Gonzalez, Hawhee, Gross, White, Caston, Bowin, Papachristou, Rickert

**REQUIREMENTS:**

1. **Central Thesis**
   - Both phantasia and Stimmung function as PRE-REFLECTIVE, WORLD-DISCLOSING STRUCTURES that orient the subject within their existential-perceptual field
   - Analyze how each concept serves as an "orienting faculty" prior to cognitive deliberation

2. **Aristotelian Analysis**
   - Examine phantasia from De Anima III.3 (427b14-429a9)
   - Address phantasia'\''s role between aisthesis and nous
   - Explain how phantasia presents the world "as if" present - its image-making function
   - Discuss kinesis and orexis in relation to phantasia

3. **Heideggerian Analysis**
   - Examine Stimmung from Being and Time sections 29-30
   - Address Befindlichkeit as the existential structure underlying mood
   - Explain how Stimmung discloses Dasein'\''s thrownness (Geworfenheit)
   - Discuss Erschlossenheit - how mood reveals world before cognition

4. **Comparative Synthesis**
   - Identify structural parallels: both operate PRIOR to reflective thought
   - Both function as CONDITIONS OF POSSIBILITY for subsequent engagement
   - Address key differences: phantasia tied to perception, Stimmung to existence
   - Develop "bridge concepts": orienting faculty, pre-reflective disclosure, world-attuning structure

5. **Argumentative Structure (CARS Model)**
   - Move 1 (Establishing Territory): Situate within phenomenological readings of Aristotle
   - Move 2 (Establishing Niche): Identify gap in functional parallel analysis
   - Move 3 (Occupying Niche): Claim systematic functional comparison as contribution

6. **Style Requirements**
   - Formal academic register with etymological grounding
   - Greek terms transliterated with original script: phantasia
   - German terms with appropriate italicization
   - Citation integration following APA 7th edition
   - Balance historical scholarship with original synthesis

7. **Key Concepts to Track**
   Classical (Aristotelian):
   - phantasia - image-making faculty
   - aisthesis - sense-perception
   - nous - intellect
   - kinesis - movement
   - orexis - desire

   Continental (Heideggerian):
   - Stimmung - mood/attunement
   - Befindlichkeit - affective disposition
   - Dasein - there-being
   - Erschlossenheit - disclosure
   - Geworfenheit - thrownness

Write the complete 3,500-word section with proper scholarly depth.

Additionally, include a VALIDATION APPENDIX at the end with:
1. **Claim Map**: Number each major claim (C1, C2, ...) with its supporting citation
2. **Quotation Fidelity Ledger**: List each direct quotation (Q1, Q2, ...) with source, page, and whether it is corpus-verified
3. **Citation Ledger**: List all unique sources cited with frequency count
4. **Validation Summary**: Total citations, corpus-verified percentage, style compliance
5. **Quality Gauntlet Report**: Overall quality score and stage results' \
  --execute --whitelist --json \
  --corpus-collections "rhetorical_ontology" \
  2>tmp/retest-run1-stderr.log | tee tmp/retest-run1-result.json
```

**Expected**: ~5-7 min. Output: `tmp/retest-run1-result.json`

---

## Run 2: Standard Pipeline (same prompt, no --whitelist)

```
npx tsx src/god-agent/universal/cli.ts write \
  [SAME PROMPT AS ABOVE] \
  --execute --use-corpus --json \
  --corpus-collections "rhetorical_ontology" \
  --corpus-min-relevance "0.0" \
  2>tmp/retest-run2-stderr.log | tee tmp/retest-run2-result.json
```

**Expected**: ~3-5 min. Output: `tmp/retest-run2-result.json`

---

## Run 3: Extract & Compare

Ask Claude Code:

```
Compare the two pipeline outputs in tmp/retest-run1-result.json and
tmp/retest-run2-result.json. Produce a comparison document like
tmp/pipeline-comparison-20260306.md but for this retest with both
pipelines having full GPU access.
```

---

## What to Look For

| Metric | Gold Standard Target | Standard Pipeline Target |
|--------|---------------------|-------------------------|
| Words | 5,000–7,000 | 3,000–5,000 |
| Unique authors | 8+ | 5+ (with corpus) |
| Direct quotations | 25+ | 10+ (with inline validation) |
| Hallucinated citations | 0 | 0 |
| Quality gauntlet | 70%+ | 70%+ |
| Chunks retrieved | 25-35 | 15 (default) |
| Citation enforcement | Active | Active |

**The key question**: With both pipelines having equal access to embeddings, does the gold standard mode's multi-query retrieval + style injection + REMEMBER block still produce categorically better output than the standard pipeline's single-query retrieval + inline validation path?

---

## Known Issues to Watch

1. **Endnote markers [n]** in Run 1 — check if prose sanitizer strips them
2. **Sentence length** — Run 1 previously averaged 63 words (target: 31). May need style profile tuning.
3. **Gauntlet false parity** — gauntlet may score both similarly; trust source diversity and quotation count over gauntlet score
4. **Inline validation in Run 2** — if corpus >= 3 chunks, inline validation auto-enables. Watch for `[GENERATION FAILED]` placeholders if citation checking is too aggressive.

---

## Files Reference

| File | Purpose |
|------|---------|
| `plans/restore-gold-standard.md` | Implementation plan (Phase 1-7) |
| `plans/god-write-audit-findings.md` | P0-P3 bugs and fix plan |
| `plans/feature-diff-testing-vs-OG.md` | Feature comparison between codebases |
| `tmp/pipeline-comparison-20260306.md` | Previous comparison (Run 2 had no GPU) |
| `src/god-agent/universal/write-pipeline-orchestrator.ts` | Gold standard mode implementation |
| `src/god-agent/universal/universal-agent.ts` | CapabilityIndex graceful degradation fix |
