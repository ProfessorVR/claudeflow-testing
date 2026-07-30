#!/usr/bin/env bash
# Re-sync all session evidence into this directory. Idempotent, additive, read-only at source.
# Run any time; run again whenever a workflow completes.
set -uo pipefail

D="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
W=/home/dalton/.claude/projects/-home-dalton-projects-claudeflow-testing/b7a45413-ca33-4977-ba33-1664e7796fa8/subagents/workflows
T=/home/dalton/.claude-tmp/claude-1000/-home-dalton-projects-claudeflow-testing/6601dd58-419e-4a33-919e-286c44607bb5/tasks
S=/home/dalton/.claude-tmp/claude-1000/-home-dalton-projects-claudeflow-testing/b7a45413-ca33-4977-ba33-1664e7796fa8/scratchpad
SC=/home/dalton/.claude/projects/-home-dalton-projects-claudeflow-testing/b7a45413-ca33-4977-ba33-1664e7796fa8/workflows/scripts

mkdir -p "$D/raw/workflow-journals" "$D/raw/task-outputs" "$D/raw/workflow-scripts" "$D/extracted"

# Workflow journals, named by purpose. Add a line here when a new workflow is launched.
declare -A RUNS=(
  [wf_0eb58659-61c]=A-entry-audit
  [wf_b3398703-3a3]=B-code-audit
  [wf_ff61ccfd-45a]=C-plan-review
  [wf_d1b488a2-eed]=D-archon-first
  [wf_fdf31464-159]=E-production-readiness
)
for run in "${!RUNS[@]}"; do
  src="$W/$run/journal.jsonl"
  [ -f "$src" ] && cp -f "$src" "$D/raw/workflow-journals/${RUNS[$run]}.journal.jsonl"
done

# Everything else, verbatim.
cp -f "$T"/*.output           "$D/raw/task-outputs/"     2>/dev/null
cp -f "$SC"/*.js              "$D/raw/workflow-scripts/" 2>/dev/null
cp -f "$S"/*.json "$S"/*.md   "$D/extracted/"            2>/dev/null

# Named copies of the four principal results, so they are findable without the task-id lookup.
declare -A OUTS=(
  [wku81bf9c]=A-entry-audit.result
  [wluh3mm8b]=B-code-audit.result
  [w9eyz2vs6]=C-plan-review.result-v1-unverified
  [wllglf5ap]=C-plan-review.result-v2-verified
  [wvvjgtsq1]=D-archon-first.result
)
for id in "${!OUTS[@]}"; do
  f="$T/$id.output"
  [ -s "$f" ] && cp -f "$f" "$D/raw/task-outputs/${OUTS[$id]}.json"
done

printf 'synced %s — %s files, %s\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "$(find "$D" -type f | wc -l)" "$(du -sh "$D" | cut -f1)" | tee -a "$D/sync.log"
