#!/usr/bin/env bash
#
# health.sh - Health monitoring loop with auto-restart
#

# Health check configuration
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-10}"
MAX_RESTARTS="${MAX_RESTARTS:-3}"
RESTART_WINDOW="${RESTART_WINDOW:-300}"  # 5 minutes

# Track restart counts
declare -A RESTART_COUNTS
declare -A LAST_RESTART_TIME

# Initialize restart tracking
init_health_tracking() {
    for service in "${SERVICES[@]}"; do
        RESTART_COUNTS[$service]=0
        LAST_RESTART_TIME[$service]=0
    done
}

# Check if we can restart (respecting max restarts)
can_restart() {
    local service="$1"
    local now=$(date +%s)
    local last_restart="${LAST_RESTART_TIME[$service]:-0}"
    local count="${RESTART_COUNTS[$service]:-0}"

    # Reset count if outside restart window
    if [[ $((now - last_restart)) -gt $RESTART_WINDOW ]]; then
        RESTART_COUNTS[$service]=0
        count=0
    fi

    if [[ $count -ge $MAX_RESTARTS ]]; then
        return 1
    fi

    return 0
}

# Record a restart
record_restart() {
    local service="$1"
    local now=$(date +%s)

    RESTART_COUNTS[$service]=$((${RESTART_COUNTS[$service]:-0} + 1))
    LAST_RESTART_TIME[$service]=$now
}

# Check service health
check_health() {
    local service="$1"

    case "${service}" in
        embedding)
            curl -sf "http://127.0.0.1:${EMBEDDING_PORT}/health" >/dev/null 2>&1 || \
            curl -sf "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1
            ;;
        memory)
            pgrep -f "memory-daemon.ts" >/dev/null 2>&1
            ;;
        daemon)
            [[ -S "${DAEMON_SOCKET}" ]] || pgrep -f "daemon-cli.ts" >/dev/null 2>&1
            ;;
        ucm)
            [[ -S "${UCM_SOCKET}" ]] || pgrep -f "ucm-cli.ts" >/dev/null 2>&1
            ;;
        observe)
            curl -sf "http://127.0.0.1:${OBSERVE_PORT}/api/health" >/dev/null 2>&1
            ;;
        *)
            return 1
            ;;
    esac
}

# Restart a service
restart_service() {
    local service="$1"

    log_warn "Restarting ${service}..."

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
    esac

    record_restart "$service"
}

# Health monitoring loop
run_health_monitor() {
    log_info "Starting health monitor (interval: ${HEALTH_CHECK_INTERVAL}s)"

    init_health_tracking

    while true; do
        for service in "${SERVICES[@]}"; do
            if ! check_health "$service"; then
                log_warn "${service} is unhealthy"

                if can_restart "$service"; then
                    restart_service "$service"
                else
                    log_error "${service} exceeded max restarts (${MAX_RESTARTS})"
                    log_error "Manual intervention required"
                fi
            fi
        done

        sleep "${HEALTH_CHECK_INTERVAL}"
    done
}

# Main health function
do_health() {
    local command="${1:-monitor}"

    case "$command" in
        monitor)
            run_health_monitor
            ;;
        check)
            # One-time health check
            local all_healthy=true

            for service in "${SERVICES[@]}"; do
                if check_health "$service"; then
                    echo -e "${GREEN}✓${NC} ${service}: healthy"
                else
                    echo -e "${RED}✗${NC} ${service}: unhealthy"
                    all_healthy=false
                fi
            done

            $all_healthy
            ;;
        *)
            echo "Usage: god launch health [monitor|check]"
            ;;
    esac
}
