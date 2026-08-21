#!/usr/bin/env bash
# claim-roundtrip.sh — hand-crafted claim round-trip test (phase 2 O1 gate).
#
# 1. Writes one hand-crafted claim into data/corpus/index/test-paper/claims.jsonl
# 2. Runs recompile_index.py with --bootstrap-empty on the sandbox path
# 3. Verifies the claim appears in compiled-index.json
# 4. (optional) Runs a minimal god-write CLI invocation pointed at the sandbox
# 5. (optional) Verifies the ## Active Claims block appears in prompt logs AND
#    the hand-crafted claim is listed
#
# Exits 0 on PASS, non-zero on FAIL.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_ROOT="${SCRIPT_DIR}/.."
WORKTREE="${SANDBOX_ROOT}/src-worktree"
DATA_DIR="${SANDBOX_ROOT}/data/corpus/index"

fail() { echo "ROUNDTRIP FAIL: $*" >&2; exit 1; }

# Phase-gating: this gate applies only after B1 (compile-corpus-index.py
# extension) is installed. If the sandbox compile script does not yet know how
# to read per-paper claims.jsonl sidecars, short-circuit with PASS so phase 1
# smoke-test runs clean.
B1_MARKER="${SANDBOX_ROOT}/data/corpus/index/.b1-installed"
if [ ! -f "${B1_MARKER}" ]; then
  echo "claim round-trip: SKIP (B1 compile extension not yet installed; marker absent)"
  exit 0
fi

# Step 1 — write hand-crafted claim
mkdir -p "${DATA_DIR}/test-paper"
cat > "${DATA_DIR}/test-paper/claims.jsonl" <<'JSON'
{"id":"RT-0001","quote":"Phantasia enables practical reasoning in Aristotle's account.","claim":"Phantasia enables practical reasoning in Aristotle's account.","speaker":"author","stance":"endorses","use_mention":"use","faithfulness":"author-endorsed","claim_type":"thetic","key_concepts":["phantasia","practical reasoning"],"source":{"author":"SmokeTest","year":"2026","slug":"test-paper","page":1}}
JSON

# Step 2 — run recompile via the sandbox analyze-claims script
export CORPUS_INDEX_PATH="${DATA_DIR}"
RECOMPILE="${WORKTREE}/scripts/analyze-claims/recompile_index.py"
if [ ! -f "${RECOMPILE}" ]; then
  fail "recompile_index.py not found at ${RECOMPILE} (B6 extractor copy missing?)"
fi
python3 "${RECOMPILE}" --index-path "${DATA_DIR}" --bootstrap-empty \
  > /tmp/roundtrip-compile.log 2>&1 \
  || fail "recompile failed; see /tmp/roundtrip-compile.log"

# Step 3 — assert claim appears in compiled-index
if ! grep -q "RT-0001" "${DATA_DIR}/compiled-index.json" 2>/dev/null; then
  echo "--- compile log (tail) ---"
  tail -40 /tmp/roundtrip-compile.log
  echo "--- compiled-index (head) ---"
  head -80 "${DATA_DIR}/compiled-index.json"
  fail "hand-crafted claim RT-0001 missing from compiled-index.json"
fi

# Step 4 — minimal god-write invocation (optional, phase 2 B4 wiring check)
#   This requires a running write pipeline. Skip unless the helper script exists.
GODWRITE_LOG="/tmp/roundtrip-godwrite.log"
if [ -x "${WORKTREE}/scripts/god-write-minimal.sh" ]; then
  bash "${WORKTREE}/scripts/god-write-minimal.sh" \
    --topic "phantasia practical reasoning" \
    --index "${DATA_DIR}" \
    > "${GODWRITE_LOG}" 2>&1 \
    || fail "god-write-minimal failed; see ${GODWRITE_LOG}"
  grep -q "## ACTIVE CLAIMS" "${GODWRITE_LOG}" \
    || fail "## ACTIVE CLAIMS block missing from prompt logs"
  grep -q "RT-0001\|Phantasia enables practical reasoning" "${GODWRITE_LOG}" \
    || fail "hand-crafted claim text not surfaced in prompt"
  echo "claim round-trip: godwrite prompt check PASS"
else
  echo "claim round-trip: compile PASS; godwrite check skipped (scripts/god-write-minimal.sh not present)"
fi

echo "claim round-trip: PASS"
