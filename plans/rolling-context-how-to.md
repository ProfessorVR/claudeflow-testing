# Rolling Context Generation — How to Use

## Quick Start

### CLI

```bash
# Basic: rolling context (no v1 investigation)
npx tsx cli.ts write "Your topic\n1. Section One\n2. Section Two\n3. Conclusion" \
  --execute --whitelist --rolling-context --enable-endnotes \
  --word-target "3,000-3,500" --use-corpus --corpus-collections rhetorical_ontology

# Recommended: rolling context + multi-step (v1 investigation → prevention plan → rolling v2)
npx tsx cli.ts write "Your topic\n1. Section One\n2. Section Two\n3. Conclusion" \
  --execute --whitelist --rolling-context --multi-step --enable-endnotes \
  --word-target "3,000-3,500" --use-corpus --corpus-collections rhetorical_ontology
```

### Dashboard

1. Open the dashboard at `localhost:3847`
2. Select the **Gold Standard (Dissertation)** preset — rolling context is now on by default
3. Or manually check: **Whitelist** + **Rolling Context** (+ optionally **Multi-Step**)
4. Click **Generate**

### /god-write

```
/god-write "Your topic\n1. Section One\n..." --whitelist --rolling-context --multi-step
```

## Flag Rules

| Flags | Behavior |
|-------|----------|
| `--whitelist --rolling-context` | Global retrieval → direct rolling context (no v1) |
| `--whitelist --rolling-context --multi-step` | Global retrieval → monolithic v1 → investigate → rolling v2 with prevention plan |
| `--rolling-context` (no `--whitelist`) | Error — rolling context requires whitelist mode |

## What It Does

Instead of one monolithic API call generating 3,000+ words (which causes token-distribution fatigue — 270-word early sections, 2,284-word conclusions), rolling context generates **each section sequentially** (~700 words per call) and feeds previously generated text back into subsequent prompts.

### Per-section generation loop

For each section, the model receives:
- The **global outline** (all section headings) so it knows the argument trajectory
- **Section-specific corpus chunks** + a filtered **shared pool** of top-relevance chunks
- The **last 2 sections** of generated text (sliding window)
- A **citation tracker** showing who's been cited and who hasn't
- A **trailing hook** instruction: "End with a transition into the next section: [heading]"

### Conclusion handling

The conclusion receives a **hybrid context**:
- **Full text** of the last 2 sections (immediate rhetorical texture)
- **50-word Haiku summaries** of all earlier sections (forces synthesis over copy-paste)

### Source diversity enforcement

When an author accumulates 3+ citations, their chunks are **evicted from the shared pool** for subsequent sections. This physically prevents the model from over-relying on a single source.

## What to Expect

| Metric | Single-Shot | Rolling Context |
|--------|:-----------:|:---------------:|
| Prompt size per call | ~30,000 chars | ~14,000 chars |
| Section word balance | Wildly uneven | ~700 words each |
| API calls | 1 (+ 1 for multi-step v1) | 8 (+ 8 Haiku summaries + 1 for multi-step v1) |
| Inter-section coherence | "8 blog posts glued together" | Continuous argument with transitions |
| Source diversity | Model decides | Enforced by chunk filtering |
| Conclusion quality | Token-fatigued dump | Synthesis from compressed arc |

## JSON Output

The `--json` output includes a `rollingContext` diagnostics block:

```json
{
  "rollingContext": {
    "used": true,
    "totalSections": 8,
    "sectionStats": [
      {
        "heading": "Kinesis as Ground",
        "wordCount": 712,
        "citationCount": 4,
        "quotationCount": 2,
        "citedAuthors": ["aristotle", "heidegger"],
        "promptChars": 13842
      }
    ],
    "citationTracker": {
      "totalCitations": 28,
      "totalQuotations": 14,
      "authorCitationCounts": { "aristotle": 8, "heidegger": 6, "burke": 5 }
    },
    "sharedPoolEvictions": 3
  }
}
```

## Tuning

All constants live in `gold-standard-config.ts`:

| Constant | Default | What it controls |
|----------|---------|-----------------|
| `rollingContextWindowSize` | 2 | Prior sections in sliding window |
| `rollingContextSectionWords` | 700 | Target words per section |
| `rollingContextConclusionWords` | 200 | Target words for conclusion |
| `rollingContextMaxTokens` | 2048 | Max output tokens per section call |
| `rollingContextSharedPoolSize` | 5 | Top-relevance chunks shared across all sections |
| `rollingContextMaxChunksPerSection` | 10 | Max chunks per section prompt |
| `rollingContextUseSummaries` | true | Haiku summaries for conclusion context |
| `rollingContextSharedPoolMaxCitations` | 3 | Evict shared chunk after author hits N citations |
