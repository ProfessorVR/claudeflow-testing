#!/usr/bin/env bash
# smoke-test.sh — gate after each major phase step.
#
# Flags:
#   --sandbox    (default) — verify sandbox is isolated; run build + claim round-trip
#   --live                 — post-promotion check against the live tree
#
# Checks performed:
#   1. No live files dirty (git status on main worktree) — sandbox mode only
#   2. TypeScript builds clean in sandbox worktree
#   3. Hand-crafted claim round-trip (optional; requires phase-2 wiring)
#   4. Active Claims block present in god-write prompt logs (optional; requires phase-2 wiring)

set -euo pipefail

MODE="${1:-sandbox}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_ROOT="${SCRIPT_DIR}/.."
WORKTREE="${SANDBOX_ROOT}/src-worktree"
DATA_DIR="${SANDBOX_ROOT}/data/corpus/index"

fail() { echo "SMOKE FAIL: $*" >&2; exit 1; }
pass() { echo "smoke pass: $*"; }

if [ "${MODE}" = "--sandbox" ] || [ "${MODE}" = "sandbox" ]; then
  # Check live files not dirty RELATIVE TO baseline snapshot recorded at phase 1
  # start. Pre-existing uncommitted changes (backup files from earlier sessions)
  # are expected and must not fail the gate; the gate is about whether OUR
  # sandbox work has introduced new dirtiness in the live tree.
  LIVE_ROOT=$(cd "${SANDBOX_ROOT}/../../.." && pwd)
  BASELINE="${SANDBOX_ROOT}/results/baseline-git-status.txt"
  cd "${LIVE_ROOT}"
  current=$(git status --porcelain -- \
    "src/god-agent" \
    "scripts/compile-corpus-index.py" \
    "corpus/index" \
    2>/dev/null | sort)
  if [ ! -f "${BASELINE}" ]; then
    fail "baseline-git-status.txt not recorded; phase 1 setup incomplete"
  fi
  new_dirty=$(diff <(sort "${BASELINE}") <(printf '%s\n' "${current}") | grep '^> ' || true)
  if [ -n "${new_dirty}" ]; then
    fail "live production files dirtied since phase 1 baseline:\n${new_dirty}"
  fi
  pass "no NEW live production file changes since baseline"
fi

# Worktree TypeScript build — compare NEW errors against baseline only.
# The live tree has 161 pre-existing TS errors at baseline; this gate fires on
# errors introduced by our sandbox work, not on pre-existing dirt.
cd "${WORKTREE}"
BASELINE_ERRS="${SANDBOX_ROOT}/results/baseline-tsc-errors.txt"
if [ -f "package.json" ] && [ -f "tsconfig.json" ] && command -v npx >/dev/null 2>&1; then
  CURRENT_ERRS=$(mktemp)
  # Normalize line/column so a pure line-shift (caused by edits above the
  # error) does not register as a new error. TS error format: `file(L,C):`
  npx --no-install tsc --noEmit -p tsconfig.json 2>&1 \
    | grep -E "error TS" \
    | sed -E 's/\([0-9]+,[0-9]+\):/(<L,C>):/g' \
    | sort -u > "${CURRENT_ERRS}" || true
  if [ ! -f "${BASELINE_ERRS}" ]; then
    fail "baseline-tsc-errors.txt not recorded; phase 1 setup incomplete"
  fi
  NEW_ERRS=$(comm -13 "${BASELINE_ERRS}" "${CURRENT_ERRS}" | head -50)
  if [ -n "${NEW_ERRS}" ]; then
    echo "--- NEW tsc errors (not in baseline) ---"
    echo "${NEW_ERRS}"
    rm -f "${CURRENT_ERRS}"
    fail "sandbox work introduced new TypeScript errors"
  fi
  rm -f "${CURRENT_ERRS}"
  pass "no new tsc errors relative to baseline"
else
  echo "smoke skip: npx/tsconfig unavailable"
fi

# Optional round-trip test (exists only after phase 2 wiring)
if [ -f "${SANDBOX_ROOT}/tests/claim-roundtrip.sh" ]; then
  bash "${SANDBOX_ROOT}/tests/claim-roundtrip.sh" || fail "claim round-trip failed"
  pass "claim round-trip PASS"
else
  echo "smoke skip: tests/claim-roundtrip.sh not yet installed"
fi

echo "smoke test: PASS (${MODE})"
