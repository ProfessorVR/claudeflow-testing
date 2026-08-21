#!/usr/bin/env bash
# run-phase3b-batch.sh — Phase 3b metaphysics extraction + Papachristou.
#
# Runs 14 PDFs through analyze-secondary.sh at parallelism=3.
# Order:
#   Wave 0 (serial): Chalmers, Metzinger — prioritized to close virtual-digital gap
#   Waves 1-5 (parallel=3): remaining 11 metaphysics authors
#   Wave 6 (serial): Papachristou
#
# Each paper writes to ${CORPUS_INDEX_PATH}/<slug>/claims.jsonl and appends
# to claim-extraction-manifest.jsonl.

set -uo pipefail

LIVE_ROOT="/home/dalton/projects/claudeflow-testing"
SANDBOX_ROOT="$LIVE_ROOT/tmp/analysis-upgrade/production-sandbox"
WORKTREE_ROOT="$SANDBOX_ROOT/src-worktree"
EXTRACT_SH="$WORKTREE_ROOT/scripts/analyze-claims/analyze-secondary.sh"
OUT_DIR="$SANDBOX_ROOT/results/phase3b-2026-04-21"
LOG="$OUT_DIR/batch.log"

mkdir -p "$OUT_DIR"
: > "$LOG"

if [ -f "$LIVE_ROOT/.env" ]; then
  set -a
  # shellcheck disable=SC1091
  source "$LIVE_ROOT/.env"
  set +a
fi

if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo "ERROR: ANTHROPIC_API_KEY not set" | tee -a "$LOG"
  exit 1
fi

export CORPUS_INDEX_PATH="$SANDBOX_ROOT/data/corpus/index"

# Ensure the worktree has a local .env so extractor.py's built-in .env loader
# has the key (it searches from script dir upward).
cp "$LIVE_ROOT/.env" "$WORKTREE_ROOT/.env"
trap 'rm -f "$WORKTREE_ROOT/.env"' EXIT

# Per-paper spec: pdf_relative_path | slug | author | title | year | first_page | last_page
# Paths are relative to $LIVE_ROOT.
PRIORITY=(
  "corpus/metaphysics/Chalmers, David J. - The Virtual and the Real_(2016)_[Clean Copy].pdf|chalmers-2016|Chalmers, David J.|The Virtual and the Real|2016|1|45"
  "corpus/metaphysics/Metzinger, Thomas K. - Why Is Virtual Reality Interesting for Philosophers_(2018)_[Clean Copy].pdf|metzinger-2018|Metzinger, Thomas K.|Why Is Virtual Reality Interesting for Philosophers|2018|1|19"
)

PARALLEL_BATCH=(
  "corpus/metaphysics/Audi, P.-Grounding-Toward a Theory of the In-Virtue-Of Relation_(2012)_[Clean Copy].pdf|audi-2012|Audi, P.|Grounding-Toward a Theory of the In-Virtue-Of Relation|2012|1|27"
  "corpus/metaphysics/Barnes, Elizabeth - Emergence and Fundamentality_(2012)_[Clean Copy].pdf|barnes-2012|Barnes, Elizabeth|Emergence and Fundamentality|2012|1|29"
  "corpus/metaphysics/Fodor, J.A. - Special Sciences (or the Disunity of Science as a Working Hypothesis) (1974).pdf|fodor-1974|Fodor, J.A.|Special Sciences (or the Disunity of Science as a Working Hypothesis)|1974|1|19"
  "corpus/metaphysics/Horgan, Terence - From Supervenience to Superdupervenience-Meeting the Demands of a Material World_(1993)_[Clean Copy].pdf|horgan-1993|Horgan, Terence|From Supervenience to Superdupervenience-Meeting the Demands of a Material World|1993|1|32"
  "corpus/metaphysics/Kim, Jaegwon - Emergence-Core Ideas and Issues_(2006)_[Clean Copy].pdf|kim-2006|Kim, Jaegwon|Emergence-Core Ideas and Issues|2006|1|13"
  "corpus/metaphysics/Kim, Jaegwon - Explanatory Realism, Causal Realism, and Explanatory Exclusion_(1988)_[Clean Copy].pdf|kim-1988|Kim, Jaegwon|Explanatory Realism, Causal Realism, and Explanatory Exclusion|1988|1|15"
  "corpus/metaphysics/Kim, Jaegwon - Supervenience as a Philosophical Concept_(1990)_[Clean Copy].pdf|kim-1990|Kim, Jaegwon|Supervenience as a Philosophical Concept|1990|1|27"
  "corpus/metaphysics/McDonnell, Neil and Wildman, Nathan - Virtual Reality- Digital or Fictional_(2019)_[Clean Copy].pdf|mcdonnell-wildman-2019|McDonnell, Neil and Wildman, Nathan|Virtual Reality- Digital or Fictional|2019|1|27"
  "corpus/metaphysics/Ney, Alyssa - On Phenomenal Functionalism about the Properties of Virtual and Non-virtual Objects_(2019)_[Clean Copy].pdf|ney-2019|Ney, Alyssa|On Phenomenal Functionalism about the Properties of Virtual and Non-virtual Objects|2019|1|12"
  "corpus/metaphysics/O'Connor, Timothy and Wong, Hong - The Metaphysics of Emergence_(2005)_[Clean Copy].pdf|oconnor-wong-2005|O'Connor, Timothy and Wong, Hong|The Metaphysics of Emergence|2005|1|21"
  "corpus/metaphysics/Raven, Michael - Fundamentality without Foundations_(2016)_[Clean Copy].pdf|raven-2016|Raven, Michael|Fundamentality without Foundations|2016|1|20"
  "corpus/metaphysics/Silcox, Mark - The Transition into Virtual Reality_(2019)_[Clean Copy].pdf|silcox-2019|Silcox, Mark|The Transition into Virtual Reality|2019|1|15"
)

TRAILING=(
  "corpus/rhetorical_ontology/Papachristou, Christina - Three Kinds or Grades of Phantasia in Aristotle's De Anima_(2013)_[Clean Copy].pdf|papachristou-2013|Papachristou, Christina|Three Kinds or Grades of Phantasia in Aristotle's De Anima|2013|1|30"
)

run_one() {
  local spec="$1"
  IFS='|' read -r pdf slug author title year first last <<< "$spec"
  local pdf_abs="$LIVE_ROOT/$pdf"
  local paper_log="$OUT_DIR/$slug.log"

  echo "[$(date +%H:%M:%S)] START $slug ($author $year, pp$first-$last)" | tee -a "$LOG"

  if [ ! -f "$pdf_abs" ]; then
    echo "[$(date +%H:%M:%S)] FAIL  $slug: PDF not found: $pdf_abs" | tee -a "$LOG"
    return 1
  fi

  local start_ts=$(date +%s)
  bash "$EXTRACT_SH" "$pdf_abs" "$slug" "$author" "$title" "$year" "$first" "$last" \
       > "$paper_log" 2>&1
  local rc=$?
  local elapsed=$(( $(date +%s) - start_ts ))

  local claims_file="$CORPUS_INDEX_PATH/$slug/claims.jsonl"
  local n_claims=0
  [ -f "$claims_file" ] && n_claims=$(wc -l < "$claims_file")

  if [ $rc -eq 0 ]; then
    echo "[$(date +%H:%M:%S)] OK    $slug rc=0 elapsed=${elapsed}s claims=$n_claims" | tee -a "$LOG"
  else
    echo "[$(date +%H:%M:%S)] FAIL  $slug rc=$rc elapsed=${elapsed}s" | tee -a "$LOG"
  fi
  return $rc
}

BATCH_START=$(date +%s)
TOTAL=$((${#PRIORITY[@]} + ${#PARALLEL_BATCH[@]} + ${#TRAILING[@]}))

echo "=== Phase 3b batch: $TOTAL papers ===" | tee -a "$LOG"
echo "CORPUS_INDEX_PATH=$CORPUS_INDEX_PATH" | tee -a "$LOG"
echo "started=$(date -Iseconds)" | tee -a "$LOG"
echo "" | tee -a "$LOG"

# Wave 0: priority papers, SERIAL (to verify pipeline before parallel spend)
echo "--- Wave 0 (priority, serial): Chalmers + Metzinger ---" | tee -a "$LOG"
for spec in "${PRIORITY[@]}"; do
  run_one "$spec" || echo "  (continuing despite failure)" | tee -a "$LOG"
done

# Wave 1-N: parallel batch at 3 concurrent
echo "" | tee -a "$LOG"
echo "--- Waves 1-N (parallel=3): ${#PARALLEL_BATCH[@]} remaining metaphysics ---" | tee -a "$LOG"
MAX_PAR=3
pids=()
for spec in "${PARALLEL_BATCH[@]}"; do
  # Wait for a slot
  while [ "${#pids[@]}" -ge "$MAX_PAR" ]; do
    for i in "${!pids[@]}"; do
      if ! kill -0 "${pids[$i]}" 2>/dev/null; then
        wait "${pids[$i]}" 2>/dev/null || true
        unset 'pids[i]'
      fi
    done
    pids=("${pids[@]}")
    [ "${#pids[@]}" -lt "$MAX_PAR" ] && break
    sleep 5
  done

  run_one "$spec" &
  pids+=($!)
done
# Drain remaining parallel jobs
for pid in "${pids[@]}"; do wait "$pid" 2>/dev/null || true; done

# Trailing: Papachristou (serial)
echo "" | tee -a "$LOG"
echo "--- Trailing (serial): Papachristou ---" | tee -a "$LOG"
for spec in "${TRAILING[@]}"; do
  run_one "$spec" || echo "  (continuing despite failure)" | tee -a "$LOG"
done

BATCH_END=$(date +%s)
ELAPSED=$((BATCH_END - BATCH_START))
echo "" | tee -a "$LOG"
echo "=== Phase 3b done: elapsed=${ELAPSED}s (~$((ELAPSED/60)) min) ===" | tee -a "$LOG"
echo "ended=$(date -Iseconds)" | tee -a "$LOG"

# Aggregate: per-paper claim counts
echo "" | tee -a "$LOG"
echo "--- Per-paper claim counts ---" | tee -a "$LOG"
for spec in "${PRIORITY[@]}" "${PARALLEL_BATCH[@]}" "${TRAILING[@]}"; do
  IFS='|' read -r _ slug _ _ _ _ _ <<< "$spec"
  n=0
  [ -f "$CORPUS_INDEX_PATH/$slug/claims.jsonl" ] && n=$(wc -l < "$CORPUS_INDEX_PATH/$slug/claims.jsonl")
  printf "  %-28s %4d claims\n" "$slug" "$n" | tee -a "$LOG"
done

exit 0
