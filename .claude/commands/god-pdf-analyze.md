---
name: god-pdf-analyze
description: Analyze PDFs using hybrid auto/manual/hybrid modes with God Agent
---

# PDF Analysis with Hybrid Processing

Analyze PDF documents using three modes:
- **Auto**: Fully automated AI processing
- **Manual**: Complete control at each step
- **Hybrid**: AI automation with manual checkpoints (recommended)

## Quick Start

```bash
# Auto mode (fully automated)
/god-pdf-analyze paper.pdf --auto --objective "Extract methodology"

# Hybrid mode (recommended - AI + manual control)
/god-pdf-analyze dissertation.pdf --hybrid --objective "Literature review analysis"

# Manual mode (complete control)
/god-pdf-analyze paper.pdf --manual
```

## Usage

```
/god-pdf-analyze <pdf-path> [options]
```

### Modes

- `--auto` - Fully automated processing (Option 5)
- `--manual` - Manual control at each step (Option 4)
- `--hybrid` - AI automation with checkpoints (Option 4 + 5 combined) ⭐ **Recommended**

### Options

- `--objective <text>` - Analysis goal (required for auto/hybrid)
- `--pages-per-chunk <num>` - Pages per chunk (default: 30)
- `--page-range <range>` - Specific pages (e.g., "1-50,100-150")
- `--skip-chunks <ids>` - Skip specific chunks (e.g., "0,2,5")
- `--review` - Pause for review between steps
- `--no-checkpoints` - Disable checkpoint saving
- `--resume <session-id>` - Resume from checkpoint
- `--list-checkpoints` - List available checkpoints

#### Corpus Integration (NEW - Phase 2)

- `--use-corpus` - Enable corpus-aware analysis with context retrieval
- `--collections <list>` - Target specific collections (comma-separated, e.g., "theory,empirical")
- `--context-chunks <num>` - Number of corpus chunks to retrieve per analysis (default: 10)

## Examples

### Auto Mode
Fully automated - AI handles everything:

```bash
/god-pdf-analyze research-paper.pdf \
  --auto \
  --objective "Extract research methodology and findings"
```

### Hybrid Mode (Recommended)
AI automation with manual control points:

```bash
# With review checkpoints
/god-pdf-analyze dissertation.pdf \
  --hybrid \
  --review \
  --objective "Analyze theoretical framework"

# Skip specific chunks
/god-pdf-analyze paper.pdf \
  --hybrid \
  --skip-chunks "0,1,15" \
  --objective "Focus on results section"

# Custom chunk size
/god-pdf-analyze long-paper.pdf \
  --hybrid \
  --pages-per-chunk 20 \
  --objective "Comprehensive analysis"

# Corpus-aware analysis (NEW)
/god-pdf-analyze rdr2-notes.pdf \
  --hybrid \
  --use-corpus \
  --collections "theory,empirical" \
  --context-chunks 15 \
  --objective "Apply Calleja framework to RDR2 gameplay analysis"
```

### Manual Mode
Complete manual control:

```bash
# Step 1: Preprocess
/god-pdf-analyze paper.pdf --manual --step preprocess

# Step 2: Analyze specific chunk
/god-pdf-analyze paper.pdf --manual --step analyze --chunk 3

# Step 3: Synthesize when ready
/god-pdf-analyze paper.pdf --manual --step synthesize
```

### Resume from Checkpoint

```bash
# List available checkpoints
/god-pdf-analyze --list-checkpoints

# Resume specific session
/god-pdf-analyze --resume hybrid-1737821234567
```

## How It Works

### 1. Preprocessing
- Extracts text from PDF using `pdftotext`
- Splits into manageable chunks (default: 30 pages each)
- Generates metadata and index
- (Optional) Checks AgentDB for existing semantic chunks if corpus enabled

### 2. Analysis
- Each chunk is analyzed by God Agent
- Context from previous chunks is maintained
- **NEW**: If `--use-corpus` enabled, retrieves relevant context from corpus
  - Semantic search for related chunks from specified collections
  - Retrieves 10-15 most relevant chunks (configurable)
  - Enriches analysis prompt with grounded context
- Progress is saved to checkpoints

### 3. Synthesis
- All chunk analyses are synthesized
- Comprehensive summary is generated
- Results are saved with metadata

## Output

Analysis results are saved to:
- `.pdf-chunks/<pdf-name>/` - Preprocessed chunks
- `.pdf-analysis-checkpoints/` - Session checkpoints
- `.pdf-analysis-results/<pdf-name>/` - Final results

## Mode Comparison

| Feature | Auto | Manual | Hybrid |
|---------|------|--------|--------|
| **Setup** | Simple | Detailed | Balanced |
| **Control** | AI decides | You decide | Collaborative |
| **Speed** | Fastest | Slowest | Medium |
| **Flexibility** | Low | Highest | High |
| **Best for** | Quick analysis | Custom needs | Most use cases |

## Tips

1. **Use Hybrid mode** for best results - combines AI efficiency with manual oversight
2. **Enable `--review`** for important documents - review chunks before analysis
3. **Save checkpoints** (default) - resume long analyses if interrupted
4. **Skip irrelevant chunks** - use `--skip-chunks` to focus on specific sections
5. **Adjust chunk size** - smaller chunks for detailed analysis, larger for overview

## Behind the Scenes

This command uses:
- **Option 4 (External)**: `scripts/pdf/preprocess.sh` for text extraction
- **Option 5 (Pipeline)**: `src/god-agent/pipelines/pdf-analysis-pipeline.ts` for AI orchestration
- **God Agent**: Universal agent for analysis and synthesis

## Troubleshooting

**Context limit errors:**
- Reduce `--pages-per-chunk` (try 20 or 15)
- Use `--skip-chunks` to skip less relevant sections
- Process in smaller batches with `--page-range`

**Missing dependencies:**
```bash
# Install pdftotext
sudo apt-get install poppler-utils  # Linux
brew install poppler                # macOS
```

**Checkpoint issues:**
```bash
# Clear old checkpoints
rm -rf .pdf-analysis-checkpoints/*
```

## Advanced Usage

### Corpus-Aware Analysis (Phase 2 Integration)

The `--use-corpus` flag enables retrieval-augmented analysis:

```bash
# Analyze PDF with grounding in theoretical corpus
/god-pdf-analyze gameplay-observations.pdf \
  --hybrid \
  --use-corpus \
  --collections "theory" \
  --context-chunks 15 \
  --objective "Apply Calleja's kinesthetic involvement to gameplay notes"

# Multi-collection analysis
/god-pdf-analyze dissertation-chapter.pdf \
  --auto \
  --use-corpus \
  --collections "theory,empirical,notes" \
  --context-chunks 20 \
  --objective "Comprehensive analysis with all available sources"

# Without corpus (traditional mode)
/god-pdf-analyze paper.pdf \
  --hybrid \
  --objective "Standard analysis without corpus"
```

**Benefits of Corpus Integration:**
- Grounds analysis in your existing theoretical framework
- Cites actual sources from your dissertation corpus
- Identifies connections to previous research
- Maintains consistency with existing work
- Reduces hallucinations through source grounding

### Custom Preprocessing

```bash
# Preprocess externally with custom settings
bash scripts/pdf/preprocess.sh paper.pdf ./output --pages-per-chunk 15 --verbose

# Then analyze the preprocessed chunks
/god-pdf-analyze ./output --manual --step analyze-all
```

### Integrate with Other Tools

```bash
# Extract specific pages first
pdftk input.pdf cat 50-100 output section.pdf

# Then analyze the section
/god-pdf-analyze section.pdf --auto --objective "Analyze results section"
```

## See Also

- `/god-research` - Deep research with God Agent
- `/god-write` - Generate documents with God Agent
- `/god-ask` - Ask God Agent questions

---

**Part of the Hybrid PDF Analysis System** (Option 4 + Option 5)
Combines external tool control with AI automation for optimal PDF processing.
