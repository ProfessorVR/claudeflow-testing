#!/usr/bin/env bash
# Second A/B test: Nussbaum-targeted prompt + bridge-cap raised from 1 → 5.
# Patches cross-author-utils.ts (env-controlled cap), runs 4-way matrix:
#   v1: live index, cap=1   (baseline)
#   v2: sandbox index, cap=1 (Phase 1-5 only)
#   v3: sandbox index, cap=5 (Phase 6 enabled)

set -euo pipefail
cd "$(dirname "$0")/../../../.."

REPO="$(pwd)"
SANDBOX="$REPO/tmp/analysis-upgrade/sandbox"
LIVE_INDEX="$REPO/corpus/index/compiled-index.json"
SANDBOX_INDEX="$SANDBOX/corpus/index/compiled-index.json"
INDEX_BACKUP="$REPO/corpus/index/compiled-index.json.live-backup-$$"
TS_FILE="$REPO/src/god-agent/shared/cross-author-utils.ts"
TS_BACKUP="$TS_FILE.live-backup-$$"
TESTS="$SANDBOX/tests"
mkdir -p "$TESTS"

PROMPT='In 500 words, discuss how contemporary Aristotelian scholars—Nussbaum in particular—interpret the role of phantasia in animal action. Focus on the phantasia-orexis-kinesis circuit (De Anima III.9-11, De Motu Animalium 6-8), Nussbaum'"'"'s reading of phantasia as "seeing-as" that supplies motivating content, and any contested points where her reading diverges from e.g. Wedin or the Uexküll biosemiotic analogue of phantasma/Merkbild.'

echo "===================================================================="
echo "PROMPT:"
echo "$PROMPT"
echo "===================================================================="

# Backups
cp "$LIVE_INDEX" "$INDEX_BACKUP"
cp "$TS_FILE" "$TS_BACKUP"

cleanup() {
  echo ""
  echo "[cleanup] restoring live index + TS file"
  cp "$INDEX_BACKUP" "$LIVE_INDEX"
  cp "$TS_BACKUP" "$TS_FILE"
  rm -f "$INDEX_BACKUP" "$TS_BACKUP"
}
trap cleanup EXIT

run_gw() {
  local label="$1"
  local out="$TESTS/v2-$label.json"
  local err="$TESTS/v2-$label.stderr.log"
  echo ""
  echo "===================================================================="
  echo "[run_gw $label] writing..."
  echo "===================================================================="
  npx tsx src/god-agent/universal/cli.ts write "$PROMPT" \
    --execute --json --style academic \
    --use-corpus --corpus-chunk-count 20 --corpus-min-relevance 0.65 \
    > "$out" 2> "$err" || true
  local sz=$(stat -c %s "$out" 2>/dev/null || echo 0)
  echo "[run_gw $label] ${sz}B  $(date +%H:%M:%S)"
}

# v1: live index, cap=1
echo "[v1] live index + cap=1"
run_gw v1-baseline

# v2: sandbox index, cap=1
echo "[v2] sandbox index + cap=1"
cp "$SANDBOX_INDEX" "$LIVE_INDEX"
run_gw v2-sandbox-cap1

# v3: sandbox index, cap=5 (patch cross-author-utils.ts)
echo "[v3] sandbox index + cap=5"
sed -i 's|return activeBridges.slice(0, 1);|return activeBridges.slice(0, 5);|' "$TS_FILE"
sed -i 's|return activeTensions.slice(0, 3);|return activeTensions.slice(0, 5);|' "$TS_FILE"
# verify patches
grep -n "return activeBridges.slice\|return activeTensions.slice" "$TS_FILE"
run_gw v3-sandbox-cap5

echo ""
echo "===================================================================="
echo "DONE"
echo "===================================================================="
ls -la "$TESTS"/v2-*.json
