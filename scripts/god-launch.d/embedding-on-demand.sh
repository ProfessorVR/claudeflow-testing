#!/usr/bin/env bash
#
# On-demand embedding server starter
# Used by ingest operations via GPUServerManager.switchToEmbedding()
#
# This script is called automatically by the GPU Server Manager when:
# - Document ingest operations run (god learn)
# - Embedding functionality is required
#
# It handles:
# 1. Checking if embedding server is already running
# 2. Stopping vLLM AWQ to free GPU memory
# 3. Starting the embedding server (FastAPI or Ollama)
# 4. Waiting for server readiness
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Source common functions if available
if [[ -f "${SCRIPT_DIR}/common.sh" ]]; then
    source "${SCRIPT_DIR}/common.sh"
else
    # Fallback logging functions
    log_info() { echo "[INFO] $*"; }
    log_success() { echo "[SUCCESS] $*"; }
    log_error() { echo "[ERROR] $*" >&2; }
    log_warn() { echo "[WARN] $*"; }
fi

# Ports
EMBEDDING_PORT="${EMBEDDING_PORT:-8000}"
VLLM_PORT="${VLLM_PORT:-8002}"
CHROMA_PORT="${CHROMA_PORT:-8001}"

start_embedding_on_demand() {
    log_info "Starting embedding server on-demand..."

    # Check if already running
    if curl -sf "http://localhost:${EMBEDDING_PORT}/health" >/dev/null 2>&1; then
        log_success "Embedding server already running on port ${EMBEDDING_PORT}"
        return 0
    fi

    # Stop vLLM if running (free GPU memory)
    if curl -sf "http://localhost:${VLLM_PORT}/v1/models" >/dev/null 2>&1; then
        log_info "Stopping vLLM to free GPU memory..."
        pkill -f "vllm serve" 2>/dev/null || true
        sleep 3
        log_success "vLLM stopped"
    fi

    # Try to start embedding via existing script
    local embed_script="${PROJECT_ROOT}/embedding-api/api-embed.sh"

    if [[ -f "$embed_script" ]]; then
        log_info "Starting embedding server via api-embed.sh..."
        bash "$embed_script" start

        # Wait for server
        local timeout=60
        local elapsed=0
        log_info "Waiting for embedding server to be ready..."

        while [[ $elapsed -lt $timeout ]]; do
            if curl -sf "http://localhost:${EMBEDDING_PORT}/health" >/dev/null 2>&1; then
                log_success "Embedding server started successfully on port ${EMBEDDING_PORT}"
                log_info "ChromaDB running on port ${CHROMA_PORT}"
                return 0
            fi
            sleep 2
            elapsed=$((elapsed + 2))
            echo -n "."
        done
        echo ""  # newline after dots

        log_error "Embedding server failed to start within ${timeout}s"
        return 1
    else
        log_error "Embedding script not found: $embed_script"
        log_info "Tried: ${embed_script}"
        log_info "Please ensure embedding-api is properly installed"
        return 1
    fi
}

# Execute if called directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    start_embedding_on_demand "$@"
fi
