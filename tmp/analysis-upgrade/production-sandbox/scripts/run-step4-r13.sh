#!/usr/bin/env bash
# run-step4-post3b.sh — Re-run all 6 canonical prompts against the post-3b
# sandbox (4,921 claims, R1 retrieval diversification live). Writes to a
# separate results directory so pre-R1 + R1-baseline + post-3b outputs can
# be compared side-by-side.

set -uo pipefail

LIVE_ROOT="/home/dalton/projects/claudeflow-testing"
SANDBOX_ROOT="$LIVE_ROOT/tmp/analysis-upgrade/production-sandbox"
WORKTREE_ROOT="$SANDBOX_ROOT/src-worktree"
SUITE_JSON="$SANDBOX_ROOT/data/prompts/canonical-suite.json"
OUT_DIR="$SANDBOX_ROOT/results/step4-r13-2026-04-21"
LOG="$OUT_DIR/run.log"

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
trap 'rm -f "$WORKTREE_ROOT/.env"' EXIT

cd "$WORKTREE_ROOT" || exit 1

PROMPT_IDS=$(jq -r '.prompts[].id' "$SUITE_JSON")
COUNT=0
FAILED=0
TOTAL=$(echo "$PROMPT_IDS" | wc -w)

echo "=== Step 4 post-3b prose validation ===" | tee -a "$LOG"
echo "CORPUS_INDEX_PATH=$CORPUS_INDEX_PATH" | tee -a "$LOG"
echo "out=$OUT_DIR" | tee -a "$LOG"
echo "started=$(date -Iseconds)" | tee -a "$LOG"
echo "to_run: $TOTAL" | tee -a "$LOG"
echo "" | tee -a "$LOG"

for ID in $PROMPT_IDS; do
  COUNT=$((COUNT + 1))
  TOPIC=$(jq -r --arg id "$ID" '.prompts[] | select(.id==$id) | .topic' "$SUITE_JSON")
  echo "--- [$COUNT/$TOTAL] $ID ---" | tee -a "$LOG"

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

  if [ -s "$STDOUT_FILE" ]; then
    sed -i '/^}$/q' "$STDOUT_FILE"
  fi

  if [ "$RC" -ne 0 ]; then
    FAILED=$((FAILED + 1))
    echo "  FAIL rc=$RC elapsed=${ELAPSED}s" | tee -a "$LOG"
  else
    WC=$(jq -r '.wordCount // "?"' "$STDOUT_FILE" 2>/dev/null || echo "?")
    QS=$(jq -r '.qualityScore // "?"' "$STDOUT_FILE" 2>/dev/null || echo "?")
    echo "  OK elapsed=${ELAPSED}s words=$WC quality=$QS" | tee -a "$LOG"
  fi
  echo "" | tee -a "$LOG"
done

echo "=== Done: $COUNT runs, $FAILED failed ===" | tee -a "$LOG"
echo "ended=$(date -Iseconds)" | tee -a "$LOG"
exit "$FAILED"
