#!/usr/bin/env bash
#
# status.sh - Status checking and display
#

# Check if a service is running
check_service_status() {
    local service="$1"
    local status="stopped"
    local pid=""
    local uptime=""
    local memory=""
    local cpu=""

    case "${service}" in
        embedding)
            if curl -sf "http://127.0.0.1:${EMBEDDING_PORT}/health" >/dev/null 2>&1 || \
               curl -sf "http://127.0.0.1:11434/api/tags" >/dev/null 2>&1; then
                status="running"
                pid=$(pgrep -f "api_embedder.py" 2>/dev/null | head -1)
                [[ -z "$pid" ]] && pid=$(pgrep -f "ollama" 2>/dev/null | head -1)
            fi
            ;;
        memory)
            if pgrep -f "memory-daemon.ts" >/dev/null 2>&1; then
                status="running"
                pid=$(pgrep -f "memory-daemon.ts" 2>/dev/null | head -1)
            fi
            ;;
        daemon)
            if [[ -S "${DAEMON_SOCKET}" ]] || pgrep -f "daemon-cli.ts start" >/dev/null 2>&1; then
                status="running"
                pid=$(pgrep -f "daemon-server" 2>/dev/null | head -1)
                [[ -z "$pid" ]] && pid=$(pgrep -f "daemon-cli.ts" 2>/dev/null | head -1)
            fi
            ;;
        ucm)
            if [[ -S "${UCM_SOCKET}" ]] || pgrep -f "ucm-cli.ts" >/dev/null 2>&1; then
                status="running"
                pid=$(pgrep -f "ucm-cli.ts" 2>/dev/null | head -1)
            fi
            ;;
        observe)
            if curl -sf "http://127.0.0.1:${OBSERVE_PORT}/api/health" >/dev/null 2>&1; then
                status="running"
                pid=$(pgrep -f "observability/daemon" 2>/dev/null | head -1)
            fi
            ;;
    esac

    # Get process stats if running
    if [[ -n "$pid" ]] && [[ "$status" == "running" ]]; then
        # Get memory and CPU
        local stats=$(ps -p "$pid" -o rss=,pcpu=,etimes= 2>/dev/null)
        if [[ -n "$stats" ]]; then
            memory=$(echo "$stats" | awk '{printf "%.0f MB", $1/1024}')
            cpu=$(echo "$stats" | awk '{printf "%.1f%%", $2}')
            local seconds=$(echo "$stats" | awk '{print $3}')
            if [[ -n "$seconds" ]]; then
                local hours=$((seconds / 3600))
                local mins=$(((seconds % 3600) / 60))
                uptime="${hours}h ${mins}m"
            fi
        fi
    fi

    echo "${status}|${pid:-N/A}|${uptime:-N/A}|${memory:-N/A}|${cpu:-N/A}"
}

# Display status table
do_status() {
    echo ""
    echo -e "${BOLD}${CYAN}╔═══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║                     GOD AGENT STATUS                              ║${NC}"
    echo -e "${BOLD}${CYAN}╠═══════════════════════════════════════════════════════════════════╣${NC}"
    printf "${CYAN}║${NC}  %-12s %-10s %-8s %-10s %-10s %-8s ${CYAN}║${NC}\n" \
        "Service" "Status" "PID" "Uptime" "Memory" "CPU"
    echo -e "${CYAN}╠═══════════════════════════════════════════════════════════════════╣${NC}"

    for service in "${SERVICES[@]}"; do
        local info=$(check_service_status "$service")
        IFS='|' read -r status pid uptime memory cpu <<< "$info"

        local status_color="${RED}"
        local status_icon="○"
        if [[ "$status" == "running" ]]; then
            status_color="${GREEN}"
            status_icon="●"
        fi

        printf "${CYAN}║${NC}  %-12s ${status_color}${status_icon} %-8s${NC} %-8s %-10s %-10s %-8s ${CYAN}║${NC}\n" \
            "$service" "$status" "$pid" "$uptime" "$memory" "$cpu"
    done

    echo -e "${CYAN}╠═══════════════════════════════════════════════════════════════════╣${NC}"

    # Session status
    if session_exists; then
        echo -e "${CYAN}║${NC}  ${GREEN}Session:${NC} ${GOD_SESSION_NAME} (running)                              ${CYAN}║${NC}"
    else
        echo -e "${CYAN}║${NC}  ${YELLOW}Session:${NC} Not running                                        ${CYAN}║${NC}"
    fi

    # Endpoints
    echo -e "${CYAN}║${NC}  ${BLUE}Dashboard:${NC} http://localhost:${OBSERVE_PORT}                             ${CYAN}║${NC}"
    echo -e "${CYAN}║${NC}  ${BLUE}Embedding:${NC} http://localhost:${EMBEDDING_PORT}                              ${CYAN}║${NC}"

    echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    # Quick health summary
    local running=0
    local total=${#SERVICES[@]}
    for service in "${SERVICES[@]}"; do
        local info=$(check_service_status "$service")
        if [[ "$info" == running* ]]; then
            ((running++))
        fi
    done

    if [[ $running -eq $total ]]; then
        echo -e "  ${GREEN}All services healthy${NC} (${running}/${total})"
    elif [[ $running -gt 0 ]]; then
        echo -e "  ${YELLOW}Partial availability${NC} (${running}/${total} running)"
    else
        echo -e "  ${RED}All services stopped${NC}"
    fi
    echo ""
}
