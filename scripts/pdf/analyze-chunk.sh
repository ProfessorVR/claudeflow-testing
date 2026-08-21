#!/bin/bash
# Quick chunk analysis helper
# Sends a chunk to God Agent for analysis

set -euo pipefail

if [ $# -lt 2 ]; then
    echo "Usage: $0 <chunk-file> <objective>"
    echo "Example: $0 ./output/chunk_aa 'Extract methodology'"
    exit 1
fi

CHUNK_FILE="$1"
OBJECTIVE="$2"

if [ ! -f "$CHUNK_FILE" ]; then
    echo "Error: Chunk file not found: $CHUNK_FILE"
    exit 1
fi

echo "Analyzing chunk: $(basename "$CHUNK_FILE")"
echo "Objective: $OBJECTIVE"
echo ""

# Read chunk content
CHUNK_CONTENT=$(cat "$CHUNK_FILE")

# Call God Agent
npx tsx src/god-agent/universal/cli.ts ask \
  "Analyze this PDF chunk with the following objective: $OBJECTIVE

CHUNK CONTENT:
$CHUNK_CONTENT"
