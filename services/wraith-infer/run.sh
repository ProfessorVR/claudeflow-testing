#!/usr/bin/env bash
# wraith-infer launcher — run on the WRAITH box (2x RTX 3090), inside WSL2.
#
# GPU pinning: pin wraith-infer to GPU 1.
# IMPORTANT: GPU 0 on WRAITH is the primary/display GPU and Linux/nouveau attaches to it;
# under sustained CUDA compute it throws cudaErrorLaunchFailure and wedges the driver
# (verified: 3 wedges on GPU 0, while GPU 1 passed a 2800-request concurrency stress test
# with zero failures). Keep this on GPU 1 until GPU 0's driver/headless config is fixed.
# gte-Qwen2 (~10GB) + bge-reranker-v2-m3 fit on a single 24GB 3090 easily.
set -euo pipefail

cd "$(dirname "$0")"

# --- GPU selection -----------------------------------------------------------
# Default to GPU 1 (see note above); override with `WRAITH_GPU=0 ./run.sh` only after GPU 0
# is confirmed healthy (nouveau blacklisted, headless, no display/framebuffer on it).
export CUDA_VISIBLE_DEVICES="${WRAITH_GPU:-1}"

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
