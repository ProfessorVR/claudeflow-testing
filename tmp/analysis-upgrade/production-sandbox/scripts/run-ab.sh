#!/usr/bin/env bash
# run-ab.sh — god-write A/B harness (mandatory for every major E-step).
#
# Runs the canonical 6-prompt suite twice: once with baseline-sha checked out,
# once with the current worktree HEAD. Emits one JSON with per-prompt quality
# score, cited-author list, claim-activation counts, and use-mention spot-check.
#
# Usage:
#   run-ab.sh --prompt-suite canonical --baseline-sha <sha> [--output <path>]

set -euo pipefail

PROMPT_SUITE=""
BASELINE_SHA=""
OUTPUT=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --prompt-suite) PROMPT_SUITE="$2"; shift 2 ;;
    --baseline-sha) BASELINE_SHA="$2"; shift 2 ;;
    --output)       OUTPUT="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [ -z "${PROMPT_SUITE}" ] || [ -z "${BASELINE_SHA}" ]; then
  echo "usage: $0 --prompt-suite canonical --baseline-sha <sha> [--output <path>]" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_ROOT="${SCRIPT_DIR}/.."
WORKTREE="${SANDBOX_ROOT}/src-worktree"
SUITE_FILE="${SANDBOX_ROOT}/data/prompts/${PROMPT_SUITE}-suite.json"
OUTPUT="${OUTPUT:-${SANDBOX_ROOT}/results/ab-$(date +%Y%m%d-%H%M%S).json}"

if [ ! -f "${SUITE_FILE}" ]; then
  echo "ERROR: prompt suite ${SUITE_FILE} not found" >&2
  exit 1
fi

# Full implementation added in phase 5 prerequisites. This stub records the
# intended interface so tooling can depend on it.
echo "stub: run-ab.sh requires phase 5 prerequisite harness" >&2
exit 1
