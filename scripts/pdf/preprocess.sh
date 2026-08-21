#!/bin/bash
# PDF Preprocessing Script
# Part of Hybrid PDF Analysis System
# Extracts text from PDF and splits into manageable chunks

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
PAGES_PER_CHUNK=30
LINES_PER_PAGE=50  # Approximate lines per page
VERBOSE=false

# Usage function
usage() {
    cat << EOF
${BLUE}PDF Preprocessing Script${NC}
Part of Hybrid PDF Analysis System (Option 4 + 5)

${YELLOW}Usage:${NC}
  $0 <pdf-file> <output-dir> [options]

${YELLOW}Arguments:${NC}
  pdf-file      Path to PDF file to process
  output-dir    Directory for output chunks

${YELLOW}Options:${NC}
  --pages-per-chunk NUM   Pages per chunk (default: 30)
  --verbose              Enable verbose output
  --help                 Show this help message

${YELLOW}Examples:${NC}
  $0 paper.pdf ./output
  $0 dissertation.pdf ./chunks --pages-per-chunk 20 --verbose

EOF
    exit 1
}

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Check dependencies
check_dependencies() {
    local missing=()

    if ! command -v pdftotext &> /dev/null; then
        missing+=("pdftotext (install: sudo apt-get install poppler-utils)")
    fi

    if ! command -v pdfinfo &> /dev/null; then
        missing+=("pdfinfo (install: sudo apt-get install poppler-utils)")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing dependencies:"
        for dep in "${missing[@]}"; do
            echo "  - $dep"
        done
        exit 1
    fi
}

# Parse arguments
if [ $# -lt 2 ]; then
    usage
fi

PDF_FILE="$1"
OUTPUT_DIR="$2"
shift 2

while [ $# -gt 0 ]; do
    case "$1" in
        --pages-per-chunk)
            PAGES_PER_CHUNK="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            usage
            ;;
        *)
            log_error "Unknown option: $1"
            usage
            ;;
    esac
done

# Validate inputs
if [ ! -f "$PDF_FILE" ]; then
    log_error "PDF file not found: $PDF_FILE"
    exit 1
fi

if [ ! "${PDF_FILE: -4}" = ".pdf" ]; then
    log_warn "File does not have .pdf extension: $PDF_FILE"
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check dependencies
check_dependencies

log_info "Starting PDF preprocessing..."
log_info "Input: $PDF_FILE"
log_info "Output: $OUTPUT_DIR"

# Extract PDF metadata
log_info "Extracting PDF metadata..."
PAGE_COUNT=$(pdfinfo "$PDF_FILE" | grep "Pages:" | awk '{print $2}')
TITLE=$(pdfinfo "$PDF_FILE" | grep "Title:" | cut -d':' -f2- | xargs || echo "")
AUTHOR=$(pdfinfo "$PDF_FILE" | grep "Author:" | cut -d':' -f2- | xargs || echo "")

[ "$VERBOSE" = true ] && log_info "Pages: $PAGE_COUNT"
[ "$VERBOSE" = true ] && log_info "Title: ${TITLE:-N/A}"
[ "$VERBOSE" = true ] && log_info "Author: ${AUTHOR:-N/A}"

# Extract full text
log_info "Extracting text from PDF..."
FULL_TEXT="${OUTPUT_DIR}/full_text.txt"
pdftotext -layout "$PDF_FILE" "$FULL_TEXT"

if [ ! -s "$FULL_TEXT" ]; then
    log_error "Text extraction failed or PDF is empty"
    exit 1
fi

TOTAL_LINES=$(wc -l < "$FULL_TEXT")
log_success "Extracted $TOTAL_LINES lines of text"

# Calculate chunk parameters
LINES_PER_CHUNK=$((PAGES_PER_CHUNK * LINES_PER_PAGE))
EXPECTED_CHUNKS=$(( (PAGE_COUNT + PAGES_PER_CHUNK - 1) / PAGES_PER_CHUNK ))

log_info "Splitting into chunks (${PAGES_PER_CHUNK} pages per chunk, ~${LINES_PER_CHUNK} lines)..."

# Split into chunks
split -l "$LINES_PER_CHUNK" "$FULL_TEXT" "${OUTPUT_DIR}/chunk_"

# Count actual chunks
CHUNK_COUNT=$(ls -1 "${OUTPUT_DIR}"/chunk_* 2>/dev/null | wc -l)
log_success "Created $CHUNK_COUNT chunks"

# Generate metadata file
METADATA_FILE="${OUTPUT_DIR}/metadata.json"
log_info "Generating metadata..."

cat > "$METADATA_FILE" << EOJSON
{
  "source_pdf": "$(basename "$PDF_FILE")",
  "source_path": "$(realpath "$PDF_FILE")",
  "processed_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "total_pages": $PAGE_COUNT,
  "total_lines": $TOTAL_LINES,
  "pages_per_chunk": $PAGES_PER_CHUNK,
  "lines_per_chunk": $LINES_PER_CHUNK,
  "chunk_count": $CHUNK_COUNT,
  "title": "${TITLE:-null}",
  "author": "${AUTHOR:-null}",
  "chunks": [
EOJSON

# Generate chunk metadata
CHUNK_NUM=0
for chunk_file in "${OUTPUT_DIR}"/chunk_*; do
    CHUNK_NAME=$(basename "$chunk_file")
    CHUNK_LINES=$(wc -l < "$chunk_file")
    START_PAGE=$((CHUNK_NUM * PAGES_PER_CHUNK + 1))
    END_PAGE=$(( (CHUNK_NUM + 1) * PAGES_PER_CHUNK ))
    [ $END_PAGE -gt $PAGE_COUNT ] && END_PAGE=$PAGE_COUNT

    if [ $CHUNK_NUM -gt 0 ]; then
        echo "," >> "$METADATA_FILE"
    fi

    cat >> "$METADATA_FILE" << EOJSON
    {
      "chunk_id": $CHUNK_NUM,
      "filename": "$CHUNK_NAME",
      "lines": $CHUNK_LINES,
      "estimated_pages": "$START_PAGE-$END_PAGE"
    }
EOJSON

    CHUNK_NUM=$((CHUNK_NUM + 1))
done

cat >> "$METADATA_FILE" << EOJSON

  ]
}
EOJSON

log_success "Metadata saved to $METADATA_FILE"

# Generate chunk index file
INDEX_FILE="${OUTPUT_DIR}/INDEX.md"
log_info "Generating chunk index..."

cat > "$INDEX_FILE" << EOINDEX
# PDF Chunk Index

**Source:** $(basename "$PDF_FILE")
**Processed:** $(date)
**Total Pages:** $PAGE_COUNT
**Total Chunks:** $CHUNK_COUNT
**Pages per Chunk:** $PAGES_PER_CHUNK

---

## Chunks

EOINDEX

CHUNK_NUM=0
for chunk_file in "${OUTPUT_DIR}"/chunk_*; do
    CHUNK_NAME=$(basename "$chunk_file")
    CHUNK_LINES=$(wc -l < "$chunk_file")
    START_PAGE=$((CHUNK_NUM * PAGES_PER_CHUNK + 1))
    END_PAGE=$(( (CHUNK_NUM + 1) * PAGES_PER_CHUNK ))
    [ $END_PAGE -gt $PAGE_COUNT ] && END_PAGE=$PAGE_COUNT

    # Get first line as preview
    PREVIEW=$(head -n 1 "$chunk_file" | cut -c1-80)

    cat >> "$INDEX_FILE" << EOINDEX
### Chunk $CHUNK_NUM: \`$CHUNK_NAME\`
- **Pages:** $START_PAGE-$END_PAGE
- **Lines:** $CHUNK_LINES
- **Preview:** $PREVIEW...

EOINDEX

    CHUNK_NUM=$((CHUNK_NUM + 1))
done

log_success "Index saved to $INDEX_FILE"

# Summary
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Preprocessing Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  ${BLUE}Output Directory:${NC} $OUTPUT_DIR"
echo -e "  ${BLUE}Chunks Created:${NC} $CHUNK_COUNT"
echo -e "  ${BLUE}Metadata:${NC} $METADATA_FILE"
echo -e "  ${BLUE}Index:${NC} $INDEX_FILE"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Review chunks: cat ${OUTPUT_DIR}/INDEX.md"
echo -e "  2. Analyze chunk: /god-ask \"Analyze: \$(cat ${OUTPUT_DIR}/chunk_aa)\""
echo -e "  3. Or use hybrid mode: /god-pdf-analyze $PDF_FILE --hybrid"
echo ""
