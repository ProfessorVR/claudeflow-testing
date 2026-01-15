#!/usr/bin/env bash
#
# logs.sh - Log aggregation and search
#

# Color codes for different services
declare -A SERVICE_COLORS=(
    ["embedding"]="\033[35m"  # Magenta
    ["memory"]="\033[32m"     # Green
    ["daemon"]="\033[34m"     # Blue
    ["ucm"]="\033[36m"        # Cyan
    ["observe"]="\033[33m"    # Yellow
)
NC="\033[0m"

# Log file locations
get_log_file() {
    local service="$1"
    echo "${GOD_LOG_DIR}/${service}.log"
}

# Tail a single service log
tail_service_log() {
    local service="$1"
    local log_file=$(get_log_file "$service")
    local color="${SERVICE_COLORS[$service]:-$NC}"

    if [[ -f "$log_file" ]]; then
        tail -f "$log_file" | while IFS= read -r line; do
            echo -e "${color}[${service}]${NC} ${line}"
        done
    else
        echo -e "${color}[${service}]${NC} No log file found: ${log_file}"
    fi
}

# Tail all logs multiplexed
tail_all_logs() {
    local log_files=()

    for service in "${SERVICES[@]}"; do
        local log_file=$(get_log_file "$service")
        if [[ -f "$log_file" ]]; then
            log_files+=("$log_file")
        fi
    done

    if [[ ${#log_files[@]} -eq 0 ]]; then
        echo "No log files found in ${GOD_LOG_DIR}"
        return 1
    fi

    # Use tail with file headers
    tail -f "${log_files[@]}" | while IFS= read -r line; do
        # Parse the ==> filename <== headers from tail -f
        if [[ "$line" =~ ^==\>\ (.+)\ \<== ]]; then
            local filename="${BASH_REMATCH[1]}"
            local service=$(basename "$filename" .log)
            echo -e "\n${SERVICE_COLORS[$service]:-$NC}=== ${service} ===${NC}"
        else
            echo "$line"
        fi
    done
}

# Search logs
search_logs() {
    local pattern="$1"
    local since="${2:-}"
    local service="${3:-}"
    local level="${4:-}"

    local grep_opts="-n --color=always"

    # Build file list
    local log_files=()
    if [[ -n "$service" ]]; then
        log_files+=("$(get_log_file "$service")")
    else
        for svc in "${SERVICES[@]}"; do
            local log_file=$(get_log_file "$svc")
            if [[ -f "$log_file" ]]; then
                log_files+=("$log_file")
            fi
        done
    fi

    if [[ ${#log_files[@]} -eq 0 ]]; then
        echo "No log files found"
        return 1
    fi

    # Add level filter if specified
    local level_pattern=""
    case "${level}" in
        error)
            level_pattern="ERROR\|FATAL\|CRITICAL"
            ;;
        warn)
            level_pattern="WARN\|ERROR\|FATAL\|CRITICAL"
            ;;
        info)
            level_pattern="INFO\|WARN\|ERROR\|FATAL\|CRITICAL"
            ;;
        debug)
            level_pattern="DEBUG\|INFO\|WARN\|ERROR\|FATAL\|CRITICAL"
            ;;
    esac

    echo -e "${CYAN}Searching for: ${pattern}${NC}"
    [[ -n "$level" ]] && echo -e "${CYAN}Level filter: ${level}${NC}"
    [[ -n "$since" ]] && echo -e "${CYAN}Since: ${since}${NC}"
    echo ""

    # Search with optional filters
    for log_file in "${log_files[@]}"; do
        local svc=$(basename "$log_file" .log)
        local color="${SERVICE_COLORS[$svc]:-$NC}"

        echo -e "${color}=== ${svc} ===${NC}"

        if [[ -n "$level_pattern" ]]; then
            grep -E "$level_pattern" "$log_file" 2>/dev/null | grep -i $grep_opts "$pattern" || true
        else
            grep -i $grep_opts "$pattern" "$log_file" 2>/dev/null || true
        fi

        echo ""
    done
}

# Export logs
export_logs() {
    local output="$1"
    local since="${2:-}"

    local temp_dir=$(mktemp -d)
    local timestamp=$(date +%Y%m%d_%H%M%S)

    echo -e "${CYAN}Exporting logs to: ${output}${NC}"

    # Copy log files
    for service in "${SERVICES[@]}"; do
        local log_file=$(get_log_file "$service")
        if [[ -f "$log_file" ]]; then
            cp "$log_file" "${temp_dir}/${service}.log"
        fi
    done

    # Create archive
    if [[ "$output" == *.tar.gz ]]; then
        tar -czf "$output" -C "$temp_dir" .
    elif [[ "$output" == *.zip ]]; then
        (cd "$temp_dir" && zip -r "$output" .)
    else
        # Default to tar.gz
        tar -czf "${output}.tar.gz" -C "$temp_dir" .
        output="${output}.tar.gz"
    fi

    rm -rf "$temp_dir"

    echo -e "${GREEN}Logs exported to: ${output}${NC}"
}

# Show recent logs
show_recent() {
    local service="${1:-all}"
    local lines="${2:-50}"

    if [[ "$service" == "all" ]]; then
        for svc in "${SERVICES[@]}"; do
            local log_file=$(get_log_file "$svc")
            local color="${SERVICE_COLORS[$svc]:-$NC}"

            if [[ -f "$log_file" ]]; then
                echo -e "${color}=== ${svc} (last ${lines} lines) ===${NC}"
                tail -n "$lines" "$log_file"
                echo ""
            fi
        done
    else
        local log_file=$(get_log_file "$service")
        if [[ -f "$log_file" ]]; then
            tail -n "$lines" "$log_file"
        else
            echo "No log file found for: $service"
            return 1
        fi
    fi
}

# Main logs function
do_logs() {
    local command="${1:-all}"
    shift || true

    local search_pattern=""
    local since=""
    local service=""
    local level=""
    local export_file=""
    local lines=50

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --search|-s)
                search_pattern="$2"
                shift 2
                ;;
            --since)
                since="$2"
                shift 2
                ;;
            --service)
                service="$2"
                shift 2
                ;;
            --level|-l)
                level="$2"
                shift 2
                ;;
            --export|-e)
                export_file="$2"
                shift 2
                ;;
            --lines|-n)
                lines="$2"
                shift 2
                ;;
            *)
                # Could be a service name
                if [[ " ${SERVICES[*]} " =~ " $1 " ]]; then
                    service="$1"
                fi
                shift
                ;;
        esac
    done

    # Handle export
    if [[ -n "$export_file" ]]; then
        export_logs "$export_file" "$since"
        return
    fi

    # Handle search
    if [[ -n "$search_pattern" ]]; then
        search_logs "$search_pattern" "$since" "$service" "$level"
        return
    fi

    # Handle level filter
    if [[ -n "$level" ]]; then
        search_logs "." "$since" "$service" "$level"
        return
    fi

    # Default: tail logs
    case "$command" in
        all)
            if [[ -n "$service" ]]; then
                tail_service_log "$service"
            else
                tail_all_logs
            fi
            ;;
        embedding|memory|daemon|ucm|observe)
            tail_service_log "$command"
            ;;
        recent)
            show_recent "$service" "$lines"
            ;;
        *)
            # Try as service name
            if [[ " ${SERVICES[*]} " =~ " $command " ]]; then
                tail_service_log "$command"
            else
                echo "Usage: god launch logs [service|all] [options]"
                echo ""
                echo "Services: ${SERVICES[*]}"
                echo ""
                echo "Options:"
                echo "  --search, -s PATTERN   Search for pattern"
                echo "  --level, -l LEVEL      Filter by level (debug|info|warn|error)"
                echo "  --service SERVICE      Filter by service"
                echo "  --since TIME           Filter by time (e.g., 1h, 30m)"
                echo "  --export, -e FILE      Export logs to archive"
                echo "  --lines, -n NUM        Number of lines for recent (default: 50)"
                echo ""
                echo "Examples:"
                echo "  god launch logs                    # Tail all logs"
                echo "  god launch logs daemon             # Tail daemon logs"
                echo "  god launch logs --search error     # Search for errors"
                echo "  god launch logs --level error      # Show only errors"
                echo "  god launch logs --export ~/logs.tar.gz"
            fi
            ;;
    esac
}
