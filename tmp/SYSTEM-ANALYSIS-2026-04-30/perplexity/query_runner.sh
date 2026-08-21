#!/bin/bash
# Perplexity query runner — emits JSON per query to argv[2]
# Usage: query_runner.sh <query> <output.json>
set -euo pipefail
Q="$1"
OUT="$2"
curl -sS -X POST https://api.perplexity.ai/chat/completions \
  -H "Authorization: Bearer ${PERPLEXITY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(jq -n --arg q "$Q" '{
    model: "sonar-pro",
    messages: [
      {role: "system", content: "You are a research assistant for NLP/ML production hardening. Cite sources [n] inline. Prefer 2024-2026 work. Be specific and concrete; flag what is unknown."},
      {role: "user", content: $q}
    ],
    max_tokens: 2000,
    temperature: 0.2
  }')" > "$OUT"
echo "wrote $OUT ($(wc -c < "$OUT") bytes)"
