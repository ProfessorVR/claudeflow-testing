#!/usr/bin/env bash
# Run god-write twice: once with the live compiled-index.json, once with the sandbox version.
# Save both outputs + capture the prompt context that gets injected.

set -euo pipefail
cd "$(dirname "$0")/../../../.."

REPO="$(pwd)"
SANDBOX="$REPO/tmp/analysis-upgrade/sandbox"
LIVE_INDEX="$REPO/corpus/index/compiled-index.json"
SANDBOX_INDEX="$SANDBOX/corpus/index/compiled-index.json"
BACKUP="$REPO/corpus/index/compiled-index.json.live-backup-$(date +%s)"
TESTS="$SANDBOX/tests"
mkdir -p "$TESTS"

PROMPT_TXT='Discuss Aristotle'"'"'s account of phantasia in animal action, focusing on the phantasia-orexis-kinesis circuit in De Anima III.9-11 and De Motu Animalium 6-8. Engage with at least one piece of secondary scholarship on the role of phantasia in explaining action. 600 words.'

echo "============================================================"
echo "PROMPT:"
echo "$PROMPT_TXT"
echo "============================================================"

# Backup
echo "[1/4] backing up live index → $BACKUP"
cp "$LIVE_INDEX" "$BACKUP"

cleanup() {
  if [ -f "$BACKUP" ]; then
    echo "[cleanup] restoring live index"
    cp "$BACKUP" "$LIVE_INDEX"
  fi
}
trap cleanup EXIT

# 1. BASELINE: live index
echo ""
echo "============================================================"
echo "[2/4] BASELINE god-write (live compiled-index.json)"
echo "============================================================"
echo "$PROMPT_TXT" > "$TESTS/before-prompt.txt"
npx tsx src/god-agent/universal/cli.ts write "$PROMPT_TXT" \
  --execute --json \
  --style academic \
  --use-corpus \
  --corpus-chunk-count 20 \
  --corpus-min-relevance 0.65 \
  > "$TESTS/before-output.json" 2> "$TESTS/before-stderr.log" || true
echo "  baseline output: $TESTS/before-output.json"

# 2. UPGRADED: sandbox index
echo ""
echo "============================================================"
echo "[3/4] UPGRADED god-write (sandbox compiled-index.json)"
echo "============================================================"
echo "  swapping in sandbox index"
cp "$SANDBOX_INDEX" "$LIVE_INDEX"
echo "$PROMPT_TXT" > "$TESTS/after-prompt.txt"
npx tsx src/god-agent/universal/cli.ts write "$PROMPT_TXT" \
  --execute --json \
  --style academic \
  --use-corpus \
  --corpus-chunk-count 20 \
  --corpus-min-relevance 0.65 \
  > "$TESTS/after-output.json" 2> "$TESTS/after-stderr.log" || true
echo "  upgraded output: $TESTS/after-output.json"

# 3. Restore (also via trap)
echo ""
echo "[4/4] restoring live index"
cp "$BACKUP" "$LIVE_INDEX"

echo ""
echo "============================================================"
echo "DONE — outputs in $TESTS/"
echo "============================================================"
ls -la "$TESTS/"
