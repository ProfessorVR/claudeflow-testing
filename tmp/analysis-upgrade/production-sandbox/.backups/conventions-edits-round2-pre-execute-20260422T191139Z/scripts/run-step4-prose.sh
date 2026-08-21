#!/usr/bin/env bash
# run-step4-prose.sh — Option-B step 4 god-write prose validation wrapper.
# Loops the 6 canonical prompts through the sandbox-wired god-write pipeline
# (CORPUS_INDEX_PATH=sandbox) and captures each run's full JSON output + stderr.
# Purpose: eyeball-verify that ACTIVE CLAIMS / cross-pipeline hooks surface in prose.

set -uo pipefail

LIVE_ROOT="/home/dalton/projects/claudeflow-testing"
SANDBOX_ROOT="$LIVE_ROOT/tmp/analysis-upgrade/production-sandbox"
WORKTREE_ROOT="$SANDBOX_ROOT/src-worktree"
SUITE_JSON="$SANDBOX_ROOT/data/prompts/canonical-suite.json"
OUT_DIR="$SANDBOX_ROOT/results/step4-prose-validation-2026-04-21"
LOG="$OUT_DIR/run.log"

mkdir -p "$OUT_DIR"
: > "$LOG"

# Load ANTHROPIC_API_KEY from live .env (sandbox worktree has no .env)
if [ -f "$LIVE_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$LIVE_ROOT/.env"
  set +a
fi

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ERROR: ANTHROPIC_API_KEY not set after sourcing live .env" | tee -a "$LOG"
  exit 1
fi

# Sandbox-pointed corpus-index (Phase 2 B-Env wiring)
export CORPUS_INDEX_PATH="$SANDBOX_ROOT/data/corpus/index"

# Also copy .env into worktree so the CLI's built-in .env loader doesn't clobber
# the exported key with an older value (it only overrides if shorter, but safe).
cp "$LIVE_ROOT/.env" "$WORKTREE_ROOT/.env"

cd "$WORKTREE_ROOT" || { echo "ERROR: cannot cd to $WORKTREE_ROOT"; exit 1; }

# Allow skipping already-run prompts via env var (space-separated list).
# Smoke already ran phantasia-action; skip it by default.
SKIP_IDS="${SKIP_IDS:-phantasia-action}"
PROMPT_IDS=$(jq -r '.prompts[].id' "$SUITE_JSON" | grep -v -E "^($(echo "$SKIP_IDS" | tr ' ' '|'))\$" || true)
COUNT=0
FAILED=0

echo "=== Step 4 prose validation ===" | tee -a "$LOG"
echo "CORPUS_INDEX_PATH=$CORPUS_INDEX_PATH" | tee -a "$LOG"
echo "worktree=$WORKTREE_ROOT" | tee -a "$LOG"
echo "out=$OUT_DIR" | tee -a "$LOG"
echo "started=$(date -Iseconds)" | tee -a "$LOG"
echo "" | tee -a "$LOG"

TOTAL=$(echo "$PROMPT_IDS" | wc -w)
echo "skip: $SKIP_IDS" | tee -a "$LOG"
echo "to_run: $TOTAL ($(echo "$PROMPT_IDS" | tr '\n' ' '))" | tee -a "$LOG"
echo "" | tee -a "$LOG"

for ID in $PROMPT_IDS; do
  COUNT=$((COUNT + 1))
  TOPIC=$(jq -r --arg id "$ID" '.prompts[] | select(.id==$id) | .topic' "$SUITE_JSON")
  echo "--- [$COUNT/$TOTAL] $ID ---" | tee -a "$LOG"
  echo "topic: $TOPIC" | tee -a "$LOG"

  STDOUT_FILE="$OUT_DIR/$ID.stdout.json"
  STDERR_FILE="$OUT_DIR/$ID.stderr.txt"
  META_FILE="$OUT_DIR/$ID.meta.json"
  START_TS=$(date +%s)

  # --length short to cap API cost; --max-revisions default (0) = scoring only.
  # --corpus-min-relevance 0.65 between strict (0.70) and lenient (0.35).
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

  # Strip trailing non-JSON noise (SonaEngine log lines can pollute stdout
  # after the JSON object closes). Keep content up to and including the first
  # line containing only `}` — that's the top-level JSON close.
  if [ -s "$STDOUT_FILE" ]; then
    sed -i '/^}$/q' "$STDOUT_FILE"
  fi

  jq -n --arg id "$ID" --arg topic "$TOPIC" --argjson rc "$RC" \
        --argjson elapsed_s "$ELAPSED" --arg started "$(date -Iseconds -d @$START_TS)" \
        --arg ended "$(date -Iseconds -d @$END_TS)" \
        '{id:$id, topic:$topic, rc:$rc, elapsed_s:$elapsed_s, started:$started, ended:$ended}' \
    > "$META_FILE"

  if [ "$RC" -ne 0 ]; then
    FAILED=$((FAILED + 1))
    echo "  FAIL rc=$RC elapsed=${ELAPSED}s" | tee -a "$LOG"
  else
    WC=$(jq -r '.wordCount // .result.wordCount // "?"' "$STDOUT_FILE" 2>/dev/null || echo "?")
    QS=$(jq -r '.qualityScore // "n/a"' "$STDOUT_FILE" 2>/dev/null || echo "?")
    SC=$(jq -r '.result.sourcesCount // "?"' "$STDOUT_FILE" 2>/dev/null || echo "?")
    echo "  OK elapsed=${ELAPSED}s words=$WC quality=$QS sources=$SC" | tee -a "$LOG"
  fi
  echo "" | tee -a "$LOG"
done

echo "=== Done: $COUNT runs, $FAILED failed ===" | tee -a "$LOG"
echo "ended=$(date -Iseconds)" | tee -a "$LOG"

# Remove the temp .env we copied into the worktree
rm -f "$WORKTREE_ROOT/.env"

exit "$FAILED"
