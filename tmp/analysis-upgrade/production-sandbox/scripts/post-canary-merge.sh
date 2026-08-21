#!/usr/bin/env bash
# post-canary-merge.sh — after Phase 3a canary extraction completes, chain:
#   1. resolve_concepts.py per paper  (embed claim key_concepts -> ontology nodes)
#   2. generate_bridges.py per paper  (candidate author->Aristotle bridges)
#   3. recompile_index.py             (merge all sidecars into compiled-index.json)
#   4. claim-roundtrip smoke gate     (full TS->data path exercise)
#   5. canary-health-report.py        (compound-gate verdict)
#
# Usage: post-canary-merge.sh
#
# Expects: data/corpus/index/<slug>/claims.jsonl (per-paper, from Phase 3a)
#          data/corpus/index/ontology-embeddings.jsonl (from B5)
#          Embedding service running at http://localhost:8000/embed (for resolve)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SANDBOX_ROOT="${SCRIPT_DIR}/.."
WORKTREE="${SANDBOX_ROOT}/src-worktree"
DATA_DIR="${SANDBOX_ROOT}/data/corpus/index"
ANALYZE="${WORKTREE}/scripts/analyze-claims"

export CORPUS_INDEX_PATH="${DATA_DIR}"

# Per-paper resolve + bridges
PAPERS=()
for d in "${DATA_DIR}"/*/; do
  [ -d "$d" ] || continue
  slug=$(basename "$d")
  # skip bookkeeping / test dirs
  case "${slug}" in
    releases|test-paper) continue ;;
  esac
  if [ ! -f "${d}claims.jsonl" ]; then continue; fi
  PAPERS+=("${slug}")
done

if [ ${#PAPERS[@]} -eq 0 ]; then
  echo "post-canary-merge: no per-paper claims.jsonl found" >&2
  exit 1
fi

echo "=== Papers found: ${PAPERS[*]} ==="
echo ""

echo "=== 1. resolve_concepts.py (per paper) ==="
for slug in "${PAPERS[@]}"; do
  echo "  [resolve] ${slug}"
  python3 "${ANALYZE}/resolve_concepts.py" \
    --claims "${DATA_DIR}/${slug}/claims.jsonl" \
    --out    "${DATA_DIR}/${slug}/concept-mentions.jsonl" \
    || { echo "resolve FAIL on ${slug}" >&2; exit 1; }
done

echo ""
echo "=== 2. generate_bridges.py (per paper) ==="
for slug in "${PAPERS[@]}"; do
  echo "  [bridges] ${slug}"
  python3 "${ANALYZE}/generate_bridges.py" \
    --claims   "${DATA_DIR}/${slug}/claims.jsonl" \
    --mentions "${DATA_DIR}/${slug}/concept-mentions.jsonl" \
    --out      "${DATA_DIR}/${slug}/bridge-candidates.jsonl" \
    || { echo "bridges FAIL on ${slug}" >&2; exit 1; }
done

echo ""
echo "=== 3. recompile_index.py (merge) ==="
python3 "${ANALYZE}/recompile_index.py" \
  --index-path "${DATA_DIR}" --bootstrap-empty

echo ""
echo "=== 4. claim-roundtrip smoke (TS->data) ==="
bash "${SANDBOX_ROOT}/scripts/smoke-test.sh" sandbox

echo ""
echo "=== 5. Canary health report ==="
python3 "${SCRIPT_DIR}/canary-health-report.py" --expected-papers "${#PAPERS[@]}"
