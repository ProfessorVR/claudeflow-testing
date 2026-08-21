#!/usr/bin/env bash
# Quick status of the whole-corpus FULL re-ingest (scoped to the latest run).
cd /home/dalton/projects/claudeflow-testing || exit 1
L=/tmp/claude-1000/-home-dalton-projects-claudeflow-testing/35439f17-0cc9-49dd-8796-b204a443eb3b/scratchpad/reingest_corpus.log

# Isolate the latest run = everything after the last "--- ... ---" marker line.
RUN=$(awk '/^--- /{buf=""} {buf=buf $0 "\n"} END{printf "%s", buf}' "$L" 2>/dev/null)
target=$(printf '%s' "$RUN" | grep -oE "Pre-fetching Marker JSON for [0-9]+" | grep -oE "[0-9]+" | tail -1)
pf=$(printf '%s' "$RUN" | grep -c '\[Parallel\] OK')
pffail=$(printf '%s' "$RUN" | grep -c '\[Parallel\] FAIL')
up=$(printf '%s' "$RUN" | grep -c 'EMBED+UPSERT')
alive=$(ps aux | grep '[r]un_ingest_phase2.py' | grep -v 'bash -c' | wc -l)
done=$(( $(wc -l < scripts/ingest/manifest.jsonl) - 937 ))
gpu=$(nvidia-smi --query-gpu=utilization.gpu --format=csv,noheader 2>/dev/null | head -1)

echo "================ re-ingest status ================"
if [[ "$alive" -ge 1 ]]; then echo "state    : RUNNING (local GPU util: ${gpu:-?})"
else echo "state    : NOT RUNNING (finished or stopped)"; fi
echo "docs done: ${done}/160   (manifest-based, authoritative)"
echo "prefetch : ${pf}/${target:-?} Marker JSON fetched this run  (fails: ${pffail})"
echo "upserted : ${up} docs written this run"
echo "--- last activity ---"
printf '%s' "$RUN" | grep -E 'EMBED\+UPSERT|\[Parallel\] (OK|FAIL)|Summary|ok=[0-9]' | tail -3
echo "=================================================="
