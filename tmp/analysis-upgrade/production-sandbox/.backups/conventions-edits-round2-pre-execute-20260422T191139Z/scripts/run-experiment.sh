#!/usr/bin/env bash
# run-experiment.sh — runs one E-step from the ladder.
#
# Operations:
#   1. Apply the E-step's single change (threshold tweak, reranker flip, etc.)
#   2. Rebuild compiled-index if needed
#   3. Run gold-set F1 measurement on dev (+ holdout at major transitions)
#   4. For major E-steps, also run run-ab.sh
#   5. Write results/eN-<label>.json
#
# Usage: run-experiment.sh <E-step-id>  (e.g. E0, E1, E2a, ...)

set -euo pipefail

if [ "$#" -ne 1 ]; then
  echo "usage: $0 <E-step-id>" >&2
  exit 2
fi

E_ID="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_ROOT="${SCRIPT_DIR}/.."
RESULTS="${SANDBOX_ROOT}/results/${E_ID}.json"
LOG="${SANDBOX_ROOT}/results/experiment-log.md"
PROMPTS="${SANDBOX_ROOT}/data/prompts/canonical-suite.json"
MANIFEST="${SANDBOX_ROOT}/data/corpus/index/ARTIFACT-MANIFEST.json"

if [ ! -f "${PROMPTS}" ]; then
  echo "ERROR: canonical prompt suite not yet frozen (phase 5 prerequisite)" >&2
  exit 1
fi

# Per-step dispatch table lives in results/experiment-log.md as source of truth.
# Phase 5 code fills in the body once gold eval + A/B harness exist.
echo "stub: experiment ${E_ID} requires phase 5 harness" >&2
exit 1
