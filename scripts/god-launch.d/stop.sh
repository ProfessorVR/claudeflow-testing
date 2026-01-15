#!/usr/bin/env bash
#
# stop.sh - Graceful shutdown logic
#

# Stop all services gracefully
do_stop() {
    if ! session_exists; then
        log_info "No session running"
        return 0
    fi

    echo ""
    echo -e "${BOLD}${YELLOW}Stopping God Agent services...${NC}"
    echo ""

    # Stop in reverse dependency order
    # 1. Observability (depends on daemon)
    log_info "Stopping observability..."
    (cd "${GOD_PROJECT_DIR}" && npm run observe:stop 2>/dev/null) || true

    # 2. UCM (depends on daemon, embedding)
    log_info "Stopping UCM daemon..."
    (cd "${GOD_PROJECT_DIR}" && npm run ucm:stop 2>/dev/null) || true

    # 3. Core daemon (depends on memory)
    log_info "Stopping core daemon..."
    (cd "${GOD_PROJECT_DIR}" && npm run daemon:stop 2>/dev/null) || true

    # 4. Memory (no dependencies)
    log_info "Stopping memory server..."
    (cd "${GOD_PROJECT_DIR}" && npm run memory:stop 2>/dev/null) || true

    # 5. Embedding (no dependencies)
    log_info "Stopping embedding server..."
    # Send Ctrl-C to embedding window
    tmux send-keys -t "${GOD_SESSION_NAME}:embed" C-c 2>/dev/null || true

    # Wait a moment for graceful shutdown
    sleep 2

    # Kill the tmux session
    log_info "Cleaning up tmux session..."
    tmux kill-session -t "${GOD_SESSION_NAME}" 2>/dev/null || true

    # Clean up stale socket files
    rm -f "${DAEMON_SOCKET}" "${UCM_SOCKET}" 2>/dev/null || true

    echo ""
    log_success "All services stopped"
    echo ""
}

# Stop a specific service
stop_service() {
    local service="$1"

    case "${service}" in
        embedding)
            tmux send-keys -t "${GOD_SESSION_NAME}:embed" C-c 2>/dev/null || true
            ;;
        memory)
            (cd "${GOD_PROJECT_DIR}" && npm run memory:stop 2>/dev/null) || true
            ;;
        daemon)
            (cd "${GOD_PROJECT_DIR}" && npm run daemon:stop 2>/dev/null) || true
            ;;
        ucm)
            (cd "${GOD_PROJECT_DIR}" && npm run ucm:stop 2>/dev/null) || true
            ;;
        observe)
            (cd "${GOD_PROJECT_DIR}" && npm run observe:stop 2>/dev/null) || true
            ;;
        *)
            log_error "Unknown service: ${service}"
            return 1
            ;;
    esac

    log_success "${service} stopped"
}
