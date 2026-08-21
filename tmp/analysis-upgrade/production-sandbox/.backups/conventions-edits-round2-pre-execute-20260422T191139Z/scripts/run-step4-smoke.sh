#!/usr/bin/env bash
# run-step4-smoke.sh — Single-prompt smoke test of Option-B step 4 wiring.
# Runs only phantasia-action through the sandbox-wired god-write pipeline
# to verify CORPUS_INDEX_PATH is honored + ACTIVE CLAIMS block fires.

set -uo pipefail

LIVE_ROOT="/home/dalton/projects/claudeflow-testing"
SANDBOX_ROOT="$LIVE_ROOT/tmp/analysis-upgrade/production-sandbox"
WORKTREE_ROOT="$SANDBOX_ROOT/src-worktree"
SUITE_JSON="$SANDBOX_ROOT/data/prompts/canonical-suite.json"
OUT_DIR="$SANDBOX_ROOT/results/step4-prose-validation-2026-04-21"
LOG="$OUT_DIR/smoke.log"

mkdir -p "$OUT_DIR"
: > "$LOG"

if [ -f "$LIVE_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$LIVE_ROOT/.env"
  set +a
fi

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ERROR: ANTHROPIC_API_KEY not set" | tee -a "$LOG"
  exit 1
fi

export CORPUS_INDEX_PATH="$SANDBOX_ROOT/data/corpus/index"
cp "$LIVE_ROOT/.env" "$WORKTREE_ROOT/.env"

cd "$WORKTREE_ROOT" || { echo "ERROR: cannot cd to $WORKTREE_ROOT"; exit 1; }

ID="phantasia-action"
TOPIC=$(jq -r --arg id "$ID" '.prompts[] | select(.id==$id) | .topic' "$SUITE_JSON")

echo "=== Smoke: $ID ===" | tee -a "$LOG"
echo "CORPUS_INDEX_PATH=$CORPUS_INDEX_PATH" | tee -a "$LOG"
echo "topic: $TOPIC" | tee -a "$LOG"
echo "started=$(date -Iseconds)" | tee -a "$LOG"

STDOUT_FILE="$OUT_DIR/$ID.stdout.json"
STDERR_FILE="$OUT_DIR/$ID.stderr.txt"
START_TS=$(date +%s)

set +e
npx tsx src/god-agent/universal/cli.ts write "$TOPIC" \
  --execute --json \
  --style academic \
  --length short \
  --use-corpus \
  --corpus-chunk-count 20 \
  --corpus-min-relevance 0.65 \
  > "$STDOUT_FILE" 2> "$STDERR_FILE"
RC=$?
set -e

END_TS=$(date +%s)
ELAPSED=$((END_TS - START_TS))

echo "rc=$RC elapsed=${ELAPSED}s" | tee -a "$LOG"
echo "stdout_bytes=$(wc -c < "$STDOUT_FILE")" | tee -a "$LOG"
echo "stderr_bytes=$(wc -c < "$STDERR_FILE")" | tee -a "$LOG"

rm -f "$WORKTREE_ROOT/.env"
exit "$RC"
