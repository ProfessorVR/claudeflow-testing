#!/usr/bin/env bash
#
# metrics.sh - Performance metrics collection
#

# Get process metrics
get_process_metrics() {
    local pattern="$1"
    local pid=$(pgrep -f "$pattern" 2>/dev/null | head -1)

    if [[ -n "$pid" ]]; then
        ps -p "$pid" -o pid=,rss=,vsz=,pcpu=,etimes= 2>/dev/null | awk '{
            pid = $1
            rss = $2/1024  # Convert to MB
            vsz = $3/1024
            cpu = $4
            secs = $5
            printf "%s|%.1f|%.1f|%.1f|%d", pid, rss, vsz, cpu, secs
        }'
    else
        echo "|0|0|0|0"
    fi
}

# Format uptime
format_uptime() {
    local seconds=$1
    local hours=$((seconds / 3600))
    local mins=$(((seconds % 3600) / 60))
    local secs=$((seconds % 60))

    if [[ $hours -gt 0 ]]; then
        printf "%dh %02dm %02ds" $hours $mins $secs
    elif [[ $mins -gt 0 ]]; then
        printf "%dm %02ds" $mins $secs
    else
        printf "%ds" $secs
    fi
}

# Get system metrics
get_system_metrics() {
    # CPU usage (overall)
    local cpu_usage=$(top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    [[ -z "$cpu_usage" ]] && cpu_usage=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | tr -d ' ')

    # Memory usage
    local mem_info=$(free -m 2>/dev/null | awk '/^Mem:/ {printf "%.1f|%.1f|%.1f", $3/1024, $2/1024, $3/$2*100}')
    [[ -z "$mem_info" ]] && mem_info="0|0|0"

    # Disk I/O (if iostat available)
    local disk_io="N/A"
    if command -v iostat &>/dev/null; then
        disk_io=$(iostat -d 1 1 2>/dev/null | awk '/^[a-z]/ {sum+=$3} END {printf "%.1f MB/s", sum/1024}')
    fi

    echo "${cpu_usage:-0}|${mem_info}|${disk_io}"
}

# Display metrics dashboard
show_metrics_dashboard() {
    clear

    local now=$(date '+%Y-%m-%d %H:%M:%S')

    echo ""
    echo -e "\033[1;36m╔═══════════════════════════════════════════════════════════════════════════╗\033[0m"
    echo -e "\033[1;36m║                         PERFORMANCE METRICS                               ║\033[0m"
    echo -e "\033[1;36m║                           ${now}                            ║\033[0m"
    echo -e "\033[1;36m╠═══════════════════════════════════════════════════════════════════════════╣\033[0m"
    printf "\033[36m║\033[0m  %-12s %-8s %-10s %-10s %-8s %-12s \033[36m║\033[0m\n" \
        "Service" "PID" "RSS" "VSZ" "CPU" "Uptime"
    echo -e "\033[1;36m╠═══════════════════════════════════════════════════════════════════════════╣\033[0m"

    # Service metrics
    local patterns=(
        "embedding:api_embedder\|ollama"
        "memory:memory-daemon"
        "daemon:daemon-cli\|daemon-server"
        "ucm:ucm-cli"
        "observe:observability"
    )

    local total_rss=0
    local total_cpu=0

    for pattern_info in "${patterns[@]}"; do
        local svc="${pattern_info%%:*}"
        local pattern="${pattern_info#*:}"

        local metrics=$(get_process_metrics "$pattern")
        IFS='|' read -r pid rss vsz cpu uptime_secs <<< "$metrics"

        local uptime_str="N/A"
        if [[ -n "$uptime_secs" ]] && [[ "$uptime_secs" -gt 0 ]]; then
            uptime_str=$(format_uptime "$uptime_secs")
        fi

        # Color based on resource usage
        local cpu_color="\033[32m"  # Green
        if (( $(echo "$cpu > 50" | bc -l 2>/dev/null || echo 0) )); then
            cpu_color="\033[31m"  # Red
        elif (( $(echo "$cpu > 20" | bc -l 2>/dev/null || echo 0) )); then
            cpu_color="\033[33m"  # Yellow
        fi

        local rss_color="\033[32m"
        if (( $(echo "$rss > 1024" | bc -l 2>/dev/null || echo 0) )); then
            rss_color="\033[31m"
        elif (( $(echo "$rss > 512" | bc -l 2>/dev/null || echo 0) )); then
            rss_color="\033[33m"
        fi

        printf "\033[36m║\033[0m  %-12s %-8s ${rss_color}%-10s\033[0m %-10s ${cpu_color}%-8s\033[0m %-12s \033[36m║\033[0m\n" \
            "$svc" "${pid:-N/A}" "${rss:-0} MB" "${vsz:-0} MB" "${cpu:-0}%" "$uptime_str"

        total_rss=$(echo "$total_rss + ${rss:-0}" | bc -l 2>/dev/null || echo "$total_rss")
        total_cpu=$(echo "$total_cpu + ${cpu:-0}" | bc -l 2>/dev/null || echo "$total_cpu")
    done

    echo -e "\033[1;36m╠═══════════════════════════════════════════════════════════════════════════╣\033[0m"
    printf "\033[36m║\033[0m  %-12s %-8s \033[1m%-10s\033[0m %-10s \033[1m%-8s\033[0m %-12s \033[36m║\033[0m\n" \
        "TOTAL" "" "$(printf '%.1f' $total_rss) MB" "" "$(printf '%.1f' $total_cpu)%" ""

    # System metrics
    echo -e "\033[1;36m╠═══════════════════════════════════════════════════════════════════════════╣\033[0m"
    echo -e "\033[36m║\033[0m  \033[1mSystem Resources:\033[0m                                                       \033[36m║\033[0m"

    local sys_metrics=$(get_system_metrics)
    IFS='|' read -r sys_cpu mem_used mem_total mem_pct disk_io <<< "$sys_metrics"

    printf "\033[36m║\033[0m    CPU: %-6s  Memory: %.1f/%.1f GB (%.0f%%)  Disk I/O: %-10s     \033[36m║\033[0m\n" \
        "${sys_cpu}%" "${mem_used:-0}" "${mem_total:-0}" "${mem_pct:-0}" "${disk_io:-N/A}"

    echo -e "\033[1;36m╚═══════════════════════════════════════════════════════════════════════════╝\033[0m"
    echo ""
}

# Export metrics in Prometheus format
export_prometheus() {
    local patterns=(
        "embedding:api_embedder\|ollama"
        "memory:memory-daemon"
        "daemon:daemon-cli\|daemon-server"
        "ucm:ucm-cli"
        "observe:observability"
    )

    echo "# HELP god_agent_process_cpu_percent CPU usage percentage"
    echo "# TYPE god_agent_process_cpu_percent gauge"

    echo "# HELP god_agent_process_memory_rss_bytes Resident Set Size in bytes"
    echo "# TYPE god_agent_process_memory_rss_bytes gauge"

    echo "# HELP god_agent_process_uptime_seconds Process uptime in seconds"
    echo "# TYPE god_agent_process_uptime_seconds gauge"

    for pattern_info in "${patterns[@]}"; do
        local svc="${pattern_info%%:*}"
        local pattern="${pattern_info#*:}"

        local metrics=$(get_process_metrics "$pattern")
        IFS='|' read -r pid rss vsz cpu uptime_secs <<< "$metrics"

        local rss_bytes=$(echo "${rss:-0} * 1024 * 1024" | bc -l 2>/dev/null || echo 0)

        echo "god_agent_process_cpu_percent{service=\"${svc}\"} ${cpu:-0}"
        echo "god_agent_process_memory_rss_bytes{service=\"${svc}\"} ${rss_bytes:-0}"
        echo "god_agent_process_uptime_seconds{service=\"${svc}\"} ${uptime_secs:-0}"
    done
}

# Export metrics as JSON
export_json() {
    local patterns=(
        "embedding:api_embedder\|ollama"
        "memory:memory-daemon"
        "daemon:daemon-cli\|daemon-server"
        "ucm:ucm-cli"
        "observe:observability"
    )

    echo "{"
    echo "  \"timestamp\": \"$(date -Iseconds)\","
    echo "  \"services\": {"

    local first=true
    for pattern_info in "${patterns[@]}"; do
        local svc="${pattern_info%%:*}"
        local pattern="${pattern_info#*:}"

        local metrics=$(get_process_metrics "$pattern")
        IFS='|' read -r pid rss vsz cpu uptime_secs <<< "$metrics"

        [[ "$first" == "true" ]] || echo ","
        first=false

        echo "    \"${svc}\": {"
        echo "      \"pid\": ${pid:-null},"
        echo "      \"memory_rss_mb\": ${rss:-0},"
        echo "      \"memory_vsz_mb\": ${vsz:-0},"
        echo "      \"cpu_percent\": ${cpu:-0},"
        echo "      \"uptime_seconds\": ${uptime_secs:-0}"
        echo -n "    }"
    done

    echo ""
    echo "  }"
    echo "}"
}

# Main metrics function
do_metrics() {
    local command="${1:-dashboard}"
    shift || true

    case "$command" in
        dashboard|"")
            # Interactive dashboard with refresh
            while true; do
                show_metrics_dashboard
                echo "Press Ctrl+C to exit, refreshing in 2s..."
                sleep 2
            done
            ;;
        once)
            show_metrics_dashboard
            ;;
        --export)
            local format="${1:-prometheus}"
            case "$format" in
                prometheus)
                    export_prometheus
                    ;;
                json)
                    export_json
                    ;;
                *)
                    echo "Unknown format: $format (use: prometheus, json)"
                    return 1
                    ;;
            esac
            ;;
        --serve)
            local port="${1:-9090}"
            echo "Starting metrics server on port ${port}..."
            echo "Scrape endpoint: http://localhost:${port}/metrics"

            # Simple HTTP server using netcat
            while true; do
                {
                    echo "HTTP/1.1 200 OK"
                    echo "Content-Type: text/plain"
                    echo ""
                    export_prometheus
                } | nc -l -p "$port" -q 1 2>/dev/null || {
                    # Fallback for systems without nc
                    echo "netcat not available, using socat..."
                    break
                }
            done
            ;;
        *)
            echo "Usage: god launch metrics [command]"
            echo ""
            echo "Commands:"
            echo "  dashboard      Interactive dashboard (default)"
            echo "  once           Show metrics once and exit"
            echo "  --export FMT   Export metrics (prometheus|json)"
            echo "  --serve PORT   Start Prometheus scrape endpoint"
            ;;
    esac
}
