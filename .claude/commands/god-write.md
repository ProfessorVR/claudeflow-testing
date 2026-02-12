---
description: Generate documents/papers using the Universal Self-Learning God Agent with DAI-001 agent selection
---

Generate written content using the Universal Self-Learning God Agent with full pipeline execution.

**Topic:** $ARGUMENTS

## CRITICAL: CORPUS-ONLY CITATION CONSTRAINT (DEFAULT)

**BY DEFAULT, cite ONLY sources from the ingested corpus.** See `.claude/CORPUS-ONLY-CONSTRAINT.md` for the complete list of available sources.

- Do NOT fabricate or hallucinate sources
- Do NOT cite sources not in the corpus unless `--allow-external` is specified
- If a claim requires an unavailable source, reframe using corpus sources or flag for user review

**Available Corpus Sources Include:**
- Aristotle: *De Anima*, *Rhetoric*, *De Motu Animalium*, *De Sensu*, *De Memoria*
- Heidegger: *Being and Time*, *Basic Concepts of Aristotelian Philosophy*
- Frede, Nussbaum, O'Gorman, Gonzalez, Hawhee, Gross, White, Caston, Bowin, Papachristou, Rickert

## Step 1: Execute Full Pipeline via CLI

Run the God Agent CLI with `--execute` to trigger the full quality pipeline:

```bash
npx tsx src/god-agent/universal/cli.ts write "$ARGUMENTS" \
  --execute --json \
  --style academic \
  --use-corpus \
  --corpus-chunk-count 20 \
  --corpus-min-relevance 0.70 \
  --verify-sources \
  --enable-endnotes
```

This single command runs the **complete pipeline** through `agent.write()`:
1. DAI-001 agent selection
2. Style profile loading (auto-loads active profile `dalton-academic-mkn82c3v`)
3. Corpus retrieval from ChromaDB (20 chunks, relevance >= 0.70)
4. Corpus constraint building (whitelist of allowed sources)
5. Citation budget check
6. Inline validation (paragraph-by-paragraph hallucination prevention, auto-enabled when corpus >= 3 chunks)
7. Prose sanitization (removes research artifacts)
8. **Quality Gauntlet** (9 stages, 0.85 threshold, up to 3 revision iterations)
9. Citation enforcement (catches hallucinated citations post-generation)
10. Endnote generation with supporting quotations
11. Source verification against corpus

**Additional options** (add to the command):
- `--format paper` - Paper format (or: essay, report, article)
- `--length comprehensive` - Comprehensive length (or: short, medium, long)
- `--corpus-collections "theory,empirical,notes"` - Target specific corpus collections
- `--acquire-missing` - Automatically download open access missing sources
- `--download-dir <path>` - Directory for downloaded sources (default: ./corpus/downloads)
- `--use-inline-validation` - Force inline validation even with few corpus chunks
- `--inline-validation-strictness strict` - Strict inline validation (or: moderate, lenient)
- `--citation-enforcement-mode strict` - Strict citation enforcement (or: auto-correct, warn)
- `--use-staged-composition` - Enable micro-meso-macro composition pipeline
- `--chapter-outline <json>` - Provide structured chapter outline with sections

## Step 2: Parse and Present Results

The CLI outputs JSON with the full result:

```json
{
  "command": "write",
  "selectedAgent": "academic-writer",
  "prompt": "original topic",
  "isPipeline": false,
  "qualityScore": 0.87,
  "wordCount": 3100,
  "result": {
    "content": "## Section Title\n\nGenerated text...",
    "style": "academic",
    "wordCount": 3100,
    "sourcesCount": 8,
    "qualityScore": 0.87
  },
  "endnotes": { "count": 12, "supportingQuotationsCount": 24 },
  "success": true,
  "trajectoryId": "traj_xxx"
}
```

Present the output to the user along with:
- Generated content (from `result.content`)
- Quality score and pass/fail status
- Word count
- Sources referenced and corpus verification results
- Endnotes (if generated)
- Trajectory ID for feedback

**If the CLI returns `success: false`**, report the error from the JSON and suggest the user check:
- Services are running: `/god-launch status`
- Embedding service health: `curl http://localhost:8000/health`
- ChromaDB health: `curl http://localhost:8001/api/v2/heartbeat`

## Step 3: Quality Validation (Automatic)

The quality gauntlet runs automatically as part of the CLI pipeline and assesses:
- **Citation Verifier** - No hallucinated citations (anti-hallucination stage 0)
- **Quotation Fidelity** - Verbatim accuracy of quoted material
- **Toulmin Enforcer** - Argument structure (claim/data/warrant)
- **Argument Coherence** - Logical flow and claim support
- **Citation Completeness** - Citation coverage and format
- **Citation Density** - Citations per 1000 words
- **Style Consistency** - Tone and style adherence to trained profile
- **Factual Accuracy** - Internal consistency
- **Claim Verification** - Claims verified against corpus evidence

**Pass Threshold:** 0.85 overall score
**Max Revisions:** 3 automatic iterations

If the initial output scores below 0.85, the system automatically revises up to 3 times to meet the threshold. The final output is always the highest-scoring version.

## Step 4: Provide Feedback (Recommended)

To improve learning, provide feedback:
```bash
npx tsx src/god-agent/universal/cli.ts feedback [trajectoryId] [rating 0-1] --trajectory --notes "feedback"
```

Quality gauntlet scores are automatically logged to the trajectory for learning.
