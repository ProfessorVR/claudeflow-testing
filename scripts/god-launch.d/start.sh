#!/usr/bin/env bash
#
# start.sh - Startup logic with health gates
#

# Health check timeout (seconds)
HEALTH_TIMEOUT=30
HEALTH_INTERVAL=0.5

# Wait for HTTP endpoint to be ready
wait_for_http() {
    local url="$1"
    local timeout="${2:-$HEALTH_TIMEOUT}"
    local start_time=$(date +%s)

    while true; do
        if curl -sf "${url}" >/dev/null 2>&1; then
            return 0
        fi

        local elapsed=$(($(date +%s) - start_time))
        if [[ $elapsed -ge $timeout ]]; then
            return 1
        fi

        sleep "${HEALTH_INTERVAL}"
    done
}

# Wait for Unix socket to be ready
wait_for_socket() {
    local socket="$1"
    local timeout="${2:-$HEALTH_TIMEOUT}"
    local start_time=$(date +%s)

    while true; do
        if [[ -S "${socket}" ]]; then
            return 0
        fi

        local elapsed=$(($(date +%s) - start_time))
        if [[ $elapsed -ge $timeout ]]; then
            return 1
        fi

        sleep "${HEALTH_INTERVAL}"
    done
}

# Wait for process to be running
wait_for_pid() {
    local pid_file="$1"
    local timeout="${2:-$HEALTH_TIMEOUT}"
    local start_time=$(date +%s)

    while true; do
        if [[ -f "${pid_file}" ]]; then
            local pid=$(cat "${pid_file}" 2>/dev/null | grep -oE '[0-9]+' | head -1)
            if [[ -n "${pid}" ]] && kill -0 "${pid}" 2>/dev/null; then
                return 0
            fi
        fi

        local elapsed=$(($(date +%s) - start_time))
        if [[ $elapsed -ge $timeout ]]; then
            return 1
        fi

        sleep "${HEALTH_INTERVAL}"
    done
}

# Check if port is available
port_available() {
    local port="$1"
    ! ss -tuln 2>/dev/null | grep -q ":${port} " && \
    ! netstat -tuln 2>/dev/null | grep -q ":${port} "
}

# Start embedding server
start_embedding() {
    log_info "Starting embedding server..."

    # Check if already running
    if curl -sf "http://127.0.0.1:${EMBEDDING_PORT}/" >/dev/null 2>&1; then
        log_success "Embedding server already running"
        return 0
    fi

    # Check if ollama is available
    if command -v ollama &>/dev/null; then
        # Check if ollama is already running
        if curl -sf "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
            log_info "Using existing Ollama instance"
            export UCM_EMBEDDING_ENDPOINT="http://127.0.0.1:11434/api/embeddings"
            return 0
        fi
    fi

    # Try FastAPI wrapper
    if [[ -f "${GOD_PROJECT_DIR}/embedding-api/api_embedder.py" ]]; then
        tmux send-keys -t "${GOD_SESSION_NAME}:embed" \
            "cd '${GOD_PROJECT_DIR}/embedding-api' && python api_embedder.py 2>&1 | tee '${GOD_LOG_DIR}/embedding.log'" Enter
    else
        # Fallback: start ollama serve
        if command -v ollama &>/dev/null; then
            tmux send-keys -t "${GOD_SESSION_NAME}:embed" \
                "ollama serve 2>&1 | tee '${GOD_LOG_DIR}/embedding.log'" Enter
            export UCM_EMBEDDING_ENDPOINT="http://127.0.0.1:11434/api/embeddings"
        else
            log_warn "No embedding server available. UCM will run in degraded mode."
            return 0
        fi
    fi

    # Wait for embedding to be ready
    if wait_for_http "http://127.0.0.1:${EMBEDDING_PORT}/health" 60 || \
       wait_for_http "http://127.0.0.1:11434/api/tags" 60; then
        log_success "Embedding server ready"
    else
        log_warn "Embedding server not responding (UCM will run in degraded mode)"
    fi
}

# Start memory server
start_memory() {
    log_info "Starting memory server..."

    # Run the npm script in tmux window
    tmux send-keys -t "${GOD_SESSION_NAME}:memory" \
        "cd '${GOD_PROJECT_DIR}' && npm run memory:start 2>&1; echo '--- Memory server exited ---'; read" Enter

    # Wait for memory to be ready
    sleep 2
    if wait_for_pid "${GOD_CONFIG_DIR}/../.agentdb/memory-server.pid" 15 || \
       wait_for_pid "${GOD_PROJECT_DIR}/.agentdb/memory-server.pid" 15; then
        log_success "Memory server ready"
    else
        # Check if it's running anyway
        if pgrep -f "memory-daemon.ts" >/dev/null 2>&1; then
            log_success "Memory server running"
        else
            log_error "Memory server failed to start"
            return 1
        fi
    fi
}

# Start core daemon
start_daemon() {
    log_info "Starting core daemon..."

    tmux send-keys -t "${GOD_SESSION_NAME}:daemon" \
        "cd '${GOD_PROJECT_DIR}' && npm run daemon:start 2>&1; echo '--- Core daemon exited ---'; read" Enter

    sleep 2
    if wait_for_socket "${DAEMON_SOCKET}" 20; then
        log_success "Core daemon ready"
    else
        if pgrep -f "daemon-cli.ts" >/dev/null 2>&1 || pgrep -f "daemon-server" >/dev/null 2>&1; then
            log_success "Core daemon running"
        else
            log_error "Core daemon failed to start"
            return 1
        fi
    fi
}

# Start UCM daemon
start_ucm() {
    log_info "Starting UCM daemon..."

    tmux send-keys -t "${GOD_SESSION_NAME}:ucm" \
        "cd '${GOD_PROJECT_DIR}' && npm run ucm:start 2>&1; echo '--- UCM daemon exited ---'; read" Enter

    sleep 2
    if wait_for_socket "${UCM_SOCKET}" 20; then
        log_success "UCM daemon ready"
    else
        if pgrep -f "ucm-cli.ts" >/dev/null 2>&1; then
            log_success "UCM daemon running"
        else
            log_error "UCM daemon failed to start"
            return 1
        fi
    fi
}

# Start observability
start_observe() {
    log_info "Starting observability dashboard..."

    tmux send-keys -t "${GOD_SESSION_NAME}:observe" \
        "cd '${GOD_PROJECT_DIR}' && npm run observe:start 2>&1; echo '--- Observability exited ---'; read" Enter

    sleep 2
    if wait_for_http "http://127.0.0.1:${OBSERVE_PORT}/api/health" 15; then
        log_success "Observability ready at http://localhost:${OBSERVE_PORT}"
    else
        if pgrep -f "observability/daemon" >/dev/null 2>&1; then
            log_success "Observability running"
        else
            log_warn "Observability dashboard may not be fully ready"
        fi
    fi
}

# Create tmux session with windows
create_session() {
    log_info "Creating tmux session: ${GOD_SESSION_NAME}"

    # Create session with first window (dashboard)
    tmux new-session -d -s "${GOD_SESSION_NAME}" -n "dashboard" -x 200 -y 50

    # Create service windows
    tmux new-window -t "${GOD_SESSION_NAME}" -n "memory"
    tmux new-window -t "${GOD_SESSION_NAME}" -n "daemon"
    tmux new-window -t "${GOD_SESSION_NAME}" -n "ucm"
    tmux new-window -t "${GOD_SESSION_NAME}" -n "observe"
    tmux new-window -t "${GOD_SESSION_NAME}" -n "embed"
    tmux new-window -t "${GOD_SESSION_NAME}" -n "shell"

    # Set up shell window
    tmux send-keys -t "${GOD_SESSION_NAME}:shell" "cd '${GOD_PROJECT_DIR}'" Enter
    tmux send-keys -t "${GOD_SESSION_NAME}:shell" "echo 'God Agent Shell - Ready for commands'" Enter

    log_success "Session created with 7 windows"
}

# Main start function
do_start() {
    local attach_after=false

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --attach|-a)
                attach_after=true
                shift
                ;;
            *)
                shift
                ;;
        esac
    done

    # Check if already running
    if session_exists; then
        log_warn "Session already running"
        echo ""
        echo "Options:"
        echo "  god launch attach    - Attach to existing session"
        echo "  god launch restart   - Restart all services"
        echo "  god launch stop      - Stop all services"
        echo ""
        read -p "Attach to existing session? [Y/n] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            exec tmux attach-session -t "${GOD_SESSION_NAME}"
        fi
        return 0
    fi

    echo ""
    echo -e "${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║           GOD AGENT UNIFIED LAUNCHER                      ║${NC}"
    echo -e "${BOLD}${CYAN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Create session
    create_session

    # Start services in dependency order
    echo ""
    log_info "Starting services in dependency order..."
    echo ""

    # 1. Embedding (no dependencies)
    start_embedding

    # 2. Memory (no dependencies)
    start_memory

    # 3. Core daemon (depends on memory)
    start_daemon

    # 4. UCM (depends on daemon, embedding)
    start_ucm

    # 5. Observability (depends on daemon)
    start_observe

    # Start dashboard in window 0
    log_info "Starting dashboard..."
    tmux send-keys -t "${GOD_SESSION_NAME}:dashboard" \
        "cd '${GOD_PROJECT_DIR}' && bash scripts/god-launch.d/dashboard.sh" Enter

    # Summary
    echo ""
    echo -e "${BOLD}${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${GREEN}║           ALL SERVICES STARTED                            ║${NC}"
    echo -e "${BOLD}${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${CYAN}Dashboard:${NC}  http://localhost:${OBSERVE_PORT}"
    echo -e "  ${CYAN}Embedding:${NC}  http://localhost:${EMBEDDING_PORT}"
    echo ""
    echo -e "  ${BOLD}To attach:${NC}  god launch attach"
    echo -e "  ${BOLD}To stop:${NC}    god launch stop"
    echo -e "  ${BOLD}Status:${NC}     god launch status"
    echo ""

    # Attach if requested
    if [[ "${attach_after}" == "true" ]]; then
        exec tmux attach-session -t "${GOD_SESSION_NAME}"
    fi
}

# Restart function
do_restart() {
    local service="${1:-all}"

    if [[ "${service}" == "all" ]]; then
        log_info "Restarting all services..."
        do_stop
        sleep 2
        do_start
    else
        log_info "Restarting ${service}..."

        # Stop the specific service
        case "${service}" in
            embedding)
                tmux send-keys -t "${GOD_SESSION_NAME}:embed" C-c
                sleep 1
                start_embedding
                ;;
            memory)
                (cd "${GOD_PROJECT_DIR}" && npm run memory:stop 2>/dev/null || true)
                sleep 1
                start_memory
                ;;
            daemon)
                (cd "${GOD_PROJECT_DIR}" && npm run daemon:stop 2>/dev/null || true)
                sleep 1
                start_daemon
                ;;
            ucm)
                (cd "${GOD_PROJECT_DIR}" && npm run ucm:stop 2>/dev/null || true)
                sleep 1
                start_ucm
                ;;
            observe)
                (cd "${GOD_PROJECT_DIR}" && npm run observe:stop 2>/dev/null || true)
                sleep 1
                start_observe
                ;;
            *)
                log_error "Unknown service: ${service}"
                echo "Available: embedding, memory, daemon, ucm, observe"
                return 1
                ;;
        esac

        log_success "${service} restarted"
    fi
}
