#!/usr/bin/env bash
# run-extractor.sh — wrapper around claim/mention/bridge extraction for one paper.
#
# Writes per-paper outputs into data/corpus/index/<paper-slug>/
# Implementation body is added in phase 2 work item B6 (move extractors from
# tmp/analysis-upgrade/claim-extractor-upgrade/sandbox/ into the worktree).
#
# Usage: run-extractor.sh {primary|secondary} <pdf-path> [--dry-run]

set -euo pipefail

if [ "$#" -lt 2 ]; then
  echo "usage: $0 {primary|secondary} <pdf-path> [--dry-run]" >&2
  exit 2
fi

MODE="$1"
PDF="$2"
DRY_RUN=""
[ "${3:-}" = "--dry-run" ] && DRY_RUN="--dry-run"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_ROOT="${SCRIPT_DIR}/.."
WORKTREE="${SANDBOX_ROOT}/src-worktree"
DATA_DIR="${SANDBOX_ROOT}/data/corpus/index"

case "${MODE}" in
  primary|secondary) ;;
  *) echo "ERROR: mode must be primary or secondary" >&2; exit 2 ;;
esac

# Phase 2 B6 will move extractor scripts into ${WORKTREE}/scripts/analyze-claims/
EXTRACTOR="${WORKTREE}/scripts/analyze-claims/analyze-${MODE}.sh"

if [ ! -f "${EXTRACTOR}" ]; then
  echo "ERROR: extractor not yet installed at ${EXTRACTOR}" >&2
  echo "       (installation is phase 2 work item B6)" >&2
  exit 1
fi

export CORPUS_INDEX_PATH="${DATA_DIR}"
bash "${EXTRACTOR}" "${PDF}" ${DRY_RUN}
