#!/usr/bin/env bash
#
# reingest-max.sh — Fast whole-corpus FULL re-ingest on the local GPU.
#
# Frees the GPU by stopping vLLM, then runs Marker + embedding TOGETHER on the card with
# a GPU budget that leaves headroom for BOTH. IMPORTANT: the embedding model (~7-8 GB) also
# lives on the GPU, so Marker can NOT be uncapped — an uncapped Marker starves embedding and
# causes a CUDA OOM (this is what corrupted the 2026-06-29 overnight run). So this uses
# GENEROUS-but-bounded Marker batches (more than the vLLM-coexist caps, since vLLM is off)
# plus a small embedding batch. The re-ingest is resumable and uses upsert-then-delete, so a
# failure can never lose data.
#
#   Usage:  bash scripts/reingest-max.sh
#   Watch:  bash scripts/reingest-status.sh
#   After it finishes, restart vLLM with your normal launcher (e.g. /god-launch).
#
set -uo pipefail
cd "$(dirname "$0")/.." || exit 1

VENV="${MARKER_VENV:-$HOME/.venv-marker}"
PORT="${MARKER_LOCAL_PORT:-8003}"
SP=/tmp/claude-1000/-home-dalton-projects-claudeflow-testing/35439f17-0cc9-49dd-8796-b204a443eb3b/scratchpad
RLOG="$SP/reingest_corpus.log"; MLOG="$SP/marker_server.log"; mkdir -p "$SP"

echo "[1/5] Stopping any in-flight re-ingest..."
pkill -9 -f "run_ingest_phase2.py --root corpus" 2>/dev/null || true; sleep 1

echo "[2/5] Stopping vLLM to free GPU headroom (embedding stays on GPU)..."
pkill -f "vllm" 2>/dev/null || true
for _ in $(seq 1 40); do
  free=$(nvidia-smi --query-gpu=memory.free --format=csv,noheader,nounits 2>/dev/null | head -1)
  [ "${free:-0}" -ge 22000 ] && break; sleep 2
done
echo "    GPU free: $(nvidia-smi --query-gpu=memory.free --format=csv,noheader 2>/dev/null | head -1)"

echo "[3/5] Restarting local Marker with GENEROUS-but-bounded batches (leaves room for embedding)..."
pkill -9 -f "marker_server" 2>/dev/null || true; sleep 1
setsid env PYTHONUNBUFFERED=1 TORCH_DEVICE=cuda PYTORCH_CUDA_ALLOC_CONF=expandable_segments:True \
  RECOGNITION_BATCH_SIZE=24 DETECTOR_BATCH_SIZE=6 LAYOUT_BATCH_SIZE=8 TABLE_REC_BATCH_SIZE=6 OCR_ERROR_BATCH_SIZE=6 \
  "${VENV}/bin/marker_server" --host 127.0.0.1 --port "${PORT}" >> "$MLOG" 2>&1 </dev/null &
disown
echo "    waiting for Marker to load models on :${PORT}..."
curl -s --retry 150 --retry-delay 2 --retry-connrefused --retry-all-errors -o /dev/null --max-time 360 "http://127.0.0.1:${PORT}/" 2>/dev/null || true
if ! curl -sf -o /dev/null --max-time 5 "http://127.0.0.1:${PORT}/" 2>/dev/null; then
  echo "    ERROR: Marker did not come up on :${PORT}. Aborting (no degraded run started)."; exit 1
fi
echo "    Marker ready. GPU: $(nvidia-smi --query-gpu=memory.used,memory.free --format=csv,noheader | head -1)"

echo "[4/5] Launching LOCAL-ONLY FULL re-ingest (detached, resumable, small embed batch)..."
printf -- '--- reingest-max %s ---\n' "$(date)" >> "$RLOG"
setsid env PYTHONUNBUFFERED=1 MARKER_ENABLED=true MARKER_URL="http://127.0.0.1:${PORT}" EMBED_BATCH_SIZE=18 \
  python3 scripts/ingest/run_ingest_phase2.py --root corpus --pdf-only --disable-ocr >> "$RLOG" 2>&1 </dev/null &
disown

echo "[5/5] Done. Re-ingest running. GPU shared safely between Marker + embedding."
echo "    Watch : bash scripts/reingest-status.sh"
echo "    NOTE  : vLLM is stopped. Restart it when you need it (e.g. /god-launch)."
