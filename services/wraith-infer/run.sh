#!/usr/bin/env bash
# wraith-infer launcher — run on the WRAITH box (2x RTX 3090), inside WSL2.
#
# GPU pinning: Marker OCR uses one 3090; wraith-infer must pin to the OTHER one.
# Check `nvidia-smi` on WRAITH FIRST and set WRAITH_GPU to the GPU index Marker does NOT use.
# gte-Qwen2 (~3GB fp16) + bge-reranker-v2-m3 (~1.5GB fp16) fit on a single 24GB 3090 easily.
set -euo pipefail

cd "$(dirname "$0")"

# --- GPU selection -----------------------------------------------------------
# Default to GPU 0; override with `WRAITH_GPU=1 ./run.sh` after checking nvidia-smi.
export CUDA_VISIBLE_DEVICES="${WRAITH_GPU:-0}"

# --- venv --------------------------------------------------------------------
VENV="${WRAITH_VENV:-.venv}"
if [[ ! -d "$VENV" ]]; then
  echo "[run.sh] creating venv at $VENV"
  python3 -m venv "$VENV"
  # shellcheck disable=SC1090
  source "$VENV/bin/activate"
  echo "[run.sh] install torch (CUDA) FIRST if this is a fresh box, then requirements:"
  echo "         pip install torch --index-url https://download.pytorch.org/whl/cu121"
  pip install -r requirements.txt
else
  # shellcheck disable=SC1090
  source "$VENV/bin/activate"
fi

# --- config (override via env) ----------------------------------------------
export WRAITH_INFER_PORT="${WRAITH_INFER_PORT:-8100}"
export WRAITH_DEVICE="${WRAITH_DEVICE:-cuda}"

echo "[run.sh] CUDA_VISIBLE_DEVICES=$CUDA_VISIBLE_DEVICES  port=$WRAITH_INFER_PORT  device=$WRAITH_DEVICE"
exec python server.py
