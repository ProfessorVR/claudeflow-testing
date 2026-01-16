#!/usr/bin/env bash
#
# profiles.sh - Service profiles for different use cases
#
# Profiles define which services to start and with what configuration:
# - minimal:  memory + daemon only (no vLLM, no observe)
# - dev:      all services with verbose logging (vLLM, memory, daemon, ucm, observe)
# - prod:     all services with production settings
# - research: all services + PhD pipeline ready mode
#

# Profile definitions - which services to start
# Note: embedding must start BEFORE ucm/daemon for CapabilityIndex routing
declare -A PROFILE_SERVICES
PROFILE_SERVICES[minimal]="memory daemon"
PROFILE_SERVICES[dev]="vllm embedding memory daemon ucm observe"
PROFILE_SERVICES[prod]="vllm embedding memory daemon ucm observe"
PROFILE_SERVICES[research]="vllm embedding memory daemon ucm observe"

# Profile settings
declare -A PROFILE_VERBOSE
PROFILE_VERBOSE[minimal]=false
PROFILE_VERBOSE[dev]=true
PROFILE_VERBOSE[prod]=false
PROFILE_VERBOSE[research]=true

declare -A PROFILE_HEALTH_MONITOR
PROFILE_HEALTH_MONITOR[minimal]=false
PROFILE_HEALTH_MONITOR[dev]=false
PROFILE_HEALTH_MONITOR[prod]=true
PROFILE_HEALTH_MONITOR[research]=true

declare -A PROFILE_LOG_LEVEL
PROFILE_LOG_LEVEL[minimal]="warn"
PROFILE_LOG_LEVEL[dev]="debug"
PROFILE_LOG_LEVEL[prod]="info"
PROFILE_LOG_LEVEL[research]="debug"

# Current profile (default: dev)
CURRENT_PROFILE="${GOD_PROFILE:-dev}"

# Get services for profile
get_profile_services() {
    local profile="${1:-$CURRENT_PROFILE}"
    echo "${PROFILE_SERVICES[$profile]:-${PROFILE_SERVICES[dev]}}"
}

# Check if service is enabled in profile
service_enabled_in_profile() {
    local service="$1"
    local profile="${2:-$CURRENT_PROFILE}"
    local services=$(get_profile_services "$profile")

    [[ " ${services} " =~ " ${service} " ]]
}

# Apply profile settings to environment
apply_profile() {
    local profile="${1:-$CURRENT_PROFILE}"

    export CURRENT_PROFILE="$profile"
    export GOD_VERBOSE="${PROFILE_VERBOSE[$profile]:-false}"
    export GOD_LOG_LEVEL="${PROFILE_LOG_LEVEL[$profile]:-info}"
    export GOD_HEALTH_MONITOR="${PROFILE_HEALTH_MONITOR[$profile]:-false}"

    # Update SERVICES array based on profile
    local profile_services=$(get_profile_services "$profile")
    SERVICES=($profile_services)

    log_info "Applied profile: ${profile}"
    log_info "Services: ${profile_services}"
    log_info "Log level: ${GOD_LOG_LEVEL}"
}

# Show profile info
show_profile_info() {
    local profile="${1:-$CURRENT_PROFILE}"

    echo ""
    echo -e "${BOLD}Profile: ${CYAN}${profile}${NC}"
    echo ""
    echo "Services: $(get_profile_services "$profile")"
    echo "Verbose: ${PROFILE_VERBOSE[$profile]:-false}"
    echo "Log Level: ${PROFILE_LOG_LEVEL[$profile]:-info}"
    echo "Health Monitor: ${PROFILE_HEALTH_MONITOR[$profile]:-false}"
    echo ""
}

# List all available profiles
list_profiles() {
    echo ""
    echo -e "${BOLD}Available Profiles:${NC}"
    echo ""

    for profile in minimal dev prod research; do
        local marker=""
        [[ "$profile" == "$CURRENT_PROFILE" ]] && marker=" ${GREEN}(active)${NC}"

        echo -e "  ${CYAN}${profile}${NC}${marker}"
        echo "    Services: $(get_profile_services "$profile")"
        echo "    Log Level: ${PROFILE_LOG_LEVEL[$profile]}"
        echo ""
    done
}

# Parse profile from command line
parse_profile() {
    local args=("$@")

    for ((i=0; i<${#args[@]}; i++)); do
        case "${args[i]}" in
            --profile|-p)
                local profile="${args[i+1]}"
                if [[ -n "${PROFILE_SERVICES[$profile]}" ]]; then
                    apply_profile "$profile"
                else
                    log_error "Unknown profile: $profile"
                    list_profiles
                    exit 1
                fi
                ;;
        esac
    done
}

# Profile-aware start function (replaces do_start)
do_start_with_profile() {
    local attach_after=false
    local profile="${CURRENT_PROFILE}"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case "$1" in
            --attach|-a)
                attach_after=true
                shift
                ;;
            --profile|-p)
                profile="$2"
                apply_profile "$profile"
                shift 2
                ;;
            *)
                shift
                ;;
        esac
    done

    # Show profile being used
    show_profile_info "$profile"

    # Continue with normal start...
    # (This function should be called from do_start)
}
