#!/usr/bin/env bash
# preflight-phase6.sh — writes the four required values gating phase 6 promotion.
#
# Blocks promotion unless all four values are present, non-empty, and match the
# hashes used in the final E-step's results JSON.
#
# Output: results/phase6-preflight.json

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_ROOT="${SCRIPT_DIR}/.."
WORKTREE="${SANDBOX_ROOT}/src-worktree"
DATA_DIR="${SANDBOX_ROOT}/data/corpus/index"
PROMPTS="${SANDBOX_ROOT}/data/prompts/canonical-suite.json"
SURVIVOR_FILE="${SANDBOX_ROOT}/results/survivor-set.json"
OUTPUT="${SANDBOX_ROOT}/results/phase6-preflight.json"

fail() { echo "PREFLIGHT FAIL: $*" >&2; exit 1; }

[ -d "${WORKTREE}" ] || fail "worktree missing at ${WORKTREE}"
[ -f "${DATA_DIR}/ARTIFACT-MANIFEST.json" ] || fail "ARTIFACT-MANIFEST.json missing"
[ -f "${PROMPTS}" ] || fail "canonical-suite.json missing"
[ -f "${SURVIVOR_FILE}" ] || fail "survivor-set.json missing (was phase 5 completed?)"

cd "${WORKTREE}"
GIT_SHA=$(git rev-parse HEAD)
cd - >/dev/null

MANIFEST_HASH=$(sha256sum "${DATA_DIR}/ARTIFACT-MANIFEST.json" | awk '{print $1}')
PROMPT_HASH=$(sha256sum "${PROMPTS}" | awk '{print $1}')
SURVIVORS=$(jq -c '.survivor_set' "${SURVIVOR_FILE}")

if [ -z "${GIT_SHA}" ] || [ -z "${MANIFEST_HASH}" ] || [ -z "${PROMPT_HASH}" ] || [ -z "${SURVIVORS}" ] || [ "${SURVIVORS}" = "null" ]; then
  fail "one or more values empty"
fi

jq -n \
  --arg sha "${GIT_SHA}" \
  --arg mh "${MANIFEST_HASH}" \
  --arg ph "${PROMPT_HASH}" \
  --argjson sv "${SURVIVORS}" \
  --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '{
    active_sandbox_git_sha: $sha,
    active_artifact_manifest_hash: $mh,
    canonical_prompt_suite_hash: $ph,
    survivor_set: $sv,
    recorded_at: $ts
  }' > "${OUTPUT}"

echo "preflight written to ${OUTPUT}:"
cat "${OUTPUT}"
