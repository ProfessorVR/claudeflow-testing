#!/usr/bin/env bash
# End-to-end integration test: process 3 diverse papers through the new pipeline.
# Skips recompile between runs; final recompile aggregates everything.

set -euo pipefail
BASE="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
SCRIPTS="$BASE/scripts"
cd "$BASE"

# 1) Aristotle De Anima III.3 (primary, Bekker-anchored)
python3 "$SCRIPTS/analyze.py" \
    --pdf "/home/dalton/projects/claudeflow-testing/corpus/rhetorical_ontology/Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf" \
    --first-page 41 --last-page 44 \
    --genre primary \
    --author "Aristotle" \
    --title "De Anima" \
    --year "c. 350 BCE" \
    --slug aristotle-da-3-3 \
    --skip-recompile

# 2) Heidegger BCAP §4-5 (primary, no-Bekker)
python3 "$SCRIPTS/analyze.py" \
    --pdf "/home/dalton/projects/claudeflow-testing/corpus/rhetorical_ontology/Heidegger, Martin - Basic Concepts of Aristotelian Philosophy_(2009)_[Clean Copy].pdf" \
    --first-page 25 --last-page 30 \
    --genre primary \
    --author "Heidegger, Martin" \
    --title "Basic Concepts of Aristotelian Philosophy" \
    --year "2009" \
    --slug heidegger-bcap-4-5 \
    --skip-recompile

# 3) Caston 1995 (secondary, phantasia commentator)
python3 "$SCRIPTS/analyze.py" \
    --pdf "/home/dalton/projects/claudeflow-testing/corpus/rhetorical_ontology/Caston, Victor - Why Aristotle Needs Imagination_(1995)_[Clean Copy].pdf" \
    --first-page 2 --last-page 7 \
    --genre secondary \
    --author "Caston, Victor" \
    --title "Why Aristotle Needs Imagination" \
    --year 1995 \
    --slug caston-1995 \
    --skip-recompile

# Final aggregate recompile
python3 "$SCRIPTS/recompile_index.py"

echo ""
echo "═══ FINAL INDEX STATE ═══"
python3 -c "
import json
from pathlib import Path
p = Path('$BASE/corpus/index/compiled-index.json')
d = json.loads(p.read_text())
print(f'ontologyNodes:     {len(d.get(\"ontologyNodes\", []))}')
print(f'crossPipelineHooks: {len(d.get(\"crossPipelineHooks\", []))}')
print(f'claims:            {len(d.get(\"claims\", []))}')
print(f'conceptMentions:   {len(d.get(\"conceptMentions\", []))}')
print(f'bridgeCandidates:  {len(d.get(\"bridgeCandidates\", []))}')
"
