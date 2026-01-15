#!/usr/bin/env bash
#
# dashboard.sh - TUI dashboard for monitoring
#

# Source parent environment if not already loaded
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [[ -z "${GOD_SESSION_NAME:-}" ]]; then
    source "${SCRIPT_DIR}/../god-launch"
fi

# Dashboard refresh interval
REFRESH_INTERVAL=2

# Check service status (simplified for dashboard)
get_service_status() {
    local service="$1"

    case "${service}" in
        embedding)
            if curl -sf "http://127.0.0.1:${EMBEDDING_PORT}/health" >/dev/null 2>&1 || \
               curl -sf "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
                echo "running"
            else
                echo "stopped"
            fi
            ;;
        memory)
            pgrep -f "memory-daemon.ts" >/dev/null 2>&1 && echo "running" || echo "stopped"
            ;;
        daemon)
            if [[ -S "${DAEMON_SOCKET}" ]] || pgrep -f "daemon-cli.ts" >/dev/null 2>&1; then
                echo "running"
            else
                echo "stopped"
            fi
            ;;
        ucm)
            if [[ -S "${UCM_SOCKET}" ]] || pgrep -f "ucm-cli.ts" >/dev/null 2>&1; then
                echo "running"
            else
                echo "stopped"
            fi
            ;;
        observe)
            curl -sf "http://127.0.0.1:${OBSERVE_PORT}/api/health" >/dev/null 2>&1 && echo "running" || echo "stopped"
            ;;
    esac
}

# Get process metrics
get_process_metrics() {
    local pattern="$1"
    local pid=$(pgrep -f "$pattern" 2>/dev/null | head -1)

    if [[ -n "$pid" ]]; then
        ps -p "$pid" -o rss=,pcpu=,etimes= 2>/dev/null | awk '{
            mem = $1/1024
            cpu = $2
            secs = $3
            hours = int(secs/3600)
            mins = int((secs%3600)/60)
            printf "%.0f|%.1f|%dh%02dm", mem, cpu, hours, mins
        }'
    else
        echo "0|0|N/A"
    fi
}

# Render dashboard
render_dashboard() {
    clear

    local now=$(date '+%Y-%m-%d %H:%M:%S')

    echo ""
    echo -e "\033[1;36m╔═══════════════════════════════════════════════════════════════════════╗\033[0m"
    echo -e "\033[1;36m║                     GOD AGENT CONTROL CENTER                          ║\033[0m"
    echo -e "\033[1;36m║                         ${now}                          ║\033[0m"
    echo -e "\033[1;36m╠═══════════════════════════════════════════════════════════════════════╣\033[0m"
    printf "\033[36m║\033[0m  %-14s %-12s %-10s %-12s %-10s \033[36m║\033[0m\n" \
        "Service" "Status" "Memory" "CPU" "Uptime"
    echo -e "\033[1;36m╠═══════════════════════════════════════════════════════════════════════╣\033[0m"

    # Service status rows
    local services=("embedding:api_embedder\|ollama" "memory:memory-daemon" "daemon:daemon-cli\|daemon-server" "ucm:ucm-cli" "observe:observability")

    for svc_info in "${services[@]}"; do
        local svc="${svc_info%%:*}"
        local pattern="${svc_info#*:}"

        local status=$(get_service_status "$svc")
        local metrics=$(get_process_metrics "$pattern")

        IFS='|' read -r mem cpu uptime <<< "$metrics"

        local status_color="\033[31m"  # Red
        local status_icon="○"
        if [[ "$status" == "running" ]]; then
            status_color="\033[32m"  # Green
            status_icon="●"
        fi

        printf "\033[36m║\033[0m  %-14s ${status_color}${status_icon} %-10s\033[0m %-10s %-12s %-10s \033[36m║\033[0m\n" \
            "$svc" "$status" "${mem} MB" "${cpu}%" "$uptime"
    done

    echo -e "\033[1;36m╠═══════════════════════════════════════════════════════════════════════╣\033[0m"
    echo -e "\033[36m║\033[0m  \033[34mDashboard:\033[0m http://localhost:${OBSERVE_PORT}                                   \033[36m║\033[0m"
    echo -e "\033[36m║\033[0m  \033[34mEmbedding:\033[0m http://localhost:${EMBEDDING_PORT}                                    \033[36m║\033[0m"
    echo -e "\033[1;36m╠═══════════════════════════════════════════════════════════════════════╣\033[0m"
    echo -e "\033[36m║\033[0m  \033[1mCommands:\033[0m [r] restart all  [s] stop all  [q] quit  [1-5] restart  \033[36m║\033[0m"
    echo -e "\033[36m║\033[0m            [l] logs view    [m] metrics   [h] help                  \033[36m║\033[0m"
    echo -e "\033[1;36m╚═══════════════════════════════════════════════════════════════════════╝\033[0m"
    echo ""
}

# Handle keyboard input
handle_input() {
    local key="$1"

    case "$key" in
        r)
            echo "Restarting all services..."
            source "${SCRIPT_DIR}/stop.sh"
            source "${SCRIPT_DIR}/start.sh"
            do_stop
            sleep 2
            do_start
            ;;
        s)
            echo "Stopping all services..."
            source "${SCRIPT_DIR}/stop.sh"
            do_stop
            exit 0
            ;;
        q)
            echo "Exiting dashboard (services continue running)"
            exit 0
            ;;
        1)
            echo "Restarting embedding..."
            tmux send-keys -t "${GOD_SESSION_NAME}:embed" C-c
            sleep 1
            source "${SCRIPT_DIR}/start.sh"
            start_embedding
            ;;
        2)
            echo "Restarting memory..."
            (cd "${GOD_PROJECT_DIR}" && npm run memory:stop 2>/dev/null || true)
            sleep 1
            source "${SCRIPT_DIR}/start.sh"
            start_memory
            ;;
        3)
            echo "Restarting daemon..."
            (cd "${GOD_PROJECT_DIR}" && npm run daemon:stop 2>/dev/null || true)
            sleep 1
            source "${SCRIPT_DIR}/start.sh"
            start_daemon
            ;;
        4)
            echo "Restarting UCM..."
            (cd "${GOD_PROJECT_DIR}" && npm run ucm:stop 2>/dev/null || true)
            sleep 1
            source "${SCRIPT_DIR}/start.sh"
            start_ucm
            ;;
        5)
            echo "Restarting observability..."
            (cd "${GOD_PROJECT_DIR}" && npm run observe:stop 2>/dev/null || true)
            sleep 1
            source "${SCRIPT_DIR}/start.sh"
            start_observe
            ;;
        l)
            echo "Opening logs view..."
            tmux select-window -t "${GOD_SESSION_NAME}:shell"
            tmux send-keys -t "${GOD_SESSION_NAME}:shell" "tail -f ${GOD_LOG_DIR}/*.log" Enter
            ;;
        m)
            echo "Opening metrics..."
            source "${SCRIPT_DIR}/metrics.sh"
            do_metrics
            ;;
        h)
            echo ""
            echo "Dashboard Help:"
            echo "  r - Restart all services"
            echo "  s - Stop all services and exit"
            echo "  q - Quit dashboard (services keep running)"
            echo "  1 - Restart embedding"
            echo "  2 - Restart memory"
            echo "  3 - Restart daemon"
            echo "  4 - Restart UCM"
            echo "  5 - Restart observability"
            echo "  l - View logs"
            echo "  m - View metrics"
            echo ""
            read -p "Press Enter to continue..."
            ;;
    esac
}

# Main dashboard function
do_dashboard() {
    # Set up terminal
    stty -echo 2>/dev/null || true

    trap 'stty echo 2>/dev/null; exit 0' EXIT INT TERM

    while true; do
        render_dashboard

        # Non-blocking read with timeout
        if read -t "${REFRESH_INTERVAL}" -n 1 key 2>/dev/null; then
            handle_input "$key"
        fi
    done
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    do_dashboard
fi
