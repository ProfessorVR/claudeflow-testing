#!/usr/bin/env bash
#
# config-loader.sh - Load configuration from launcher.yaml
#
# Configuration precedence:
# 1. Command line arguments (highest)
# 2. Environment variables
# 3. User config (~/.god-agent/launcher.yaml)
# 4. Project config (.god-agent/launcher.yaml)
# 5. Default values (lowest)
#

# Default configuration
DEFAULT_SESSION_NAME="god-agent"
DEFAULT_PROFILE="dev"
DEFAULT_HEALTH_INTERVAL=10
DEFAULT_MAX_RESTARTS=3
DEFAULT_RESTART_WINDOW=300
DEFAULT_LOG_KEEP_LINES=1000

# Simple YAML parser (handles basic key: value pairs)
parse_yaml() {
    local yaml_file="$1"
    local prefix="${2:-}"

    if [[ ! -f "$yaml_file" ]]; then
        return 0
    fi

    # Read and parse YAML
    while IFS='' read -r line || [[ -n "$line" ]]; do
        # Skip empty lines and comments
        [[ -z "${line// }" ]] && continue
        [[ "$line" =~ ^[[:space:]]*# ]] && continue

        # Calculate indentation
        local indent="${line%%[![:space:]]*}"
        local indent_level=$((${#indent} / 2))

        # Remove leading/trailing whitespace
        line="${line#"${line%%[![:space:]]*}"}"
        line="${line%"${line##*[![:space:]]}"}"

        # Parse key: value
        if [[ "$line" =~ ^([a-zA-Z_][a-zA-Z0-9_-]*):(.*)$ ]]; then
            local key="${BASH_REMATCH[1]}"
            local value="${BASH_REMATCH[2]}"

            # Trim value
            value="${value#"${value%%[![:space:]]*}"}"
            value="${value%"${value##*[![:space:]]}"}"

            # Remove quotes
            value="${value#\"}"
            value="${value%\"}"
            value="${value#\'}"
            value="${value%\'}"

            # Export as environment variable if it has a value
            if [[ -n "$value" ]]; then
                local var_name="${prefix}${key^^}"
                var_name="${var_name//-/_}"
                export "$var_name"="$value"
            fi
        fi
    done < "$yaml_file"
}

# Load launcher configuration
load_launcher_config() {
    # Start with defaults
    export GOD_SESSION_NAME="${GOD_SESSION_NAME:-$DEFAULT_SESSION_NAME}"
    export GOD_PROFILE="${GOD_PROFILE:-$DEFAULT_PROFILE}"
    export HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-$DEFAULT_HEALTH_INTERVAL}"
    export MAX_RESTARTS="${MAX_RESTARTS:-$DEFAULT_MAX_RESTARTS}"
    export RESTART_WINDOW="${RESTART_WINDOW:-$DEFAULT_RESTART_WINDOW}"
    export GOD_LOG_KEEP_LINES="${GOD_LOG_KEEP_LINES:-$DEFAULT_LOG_KEEP_LINES}"

    # Load project config if exists
    local project_config="${GOD_PROJECT_DIR}/.god-agent/launcher.yaml"
    if [[ -f "$project_config" ]]; then
        log_info "Loading project config: ${project_config}"
        parse_yaml "$project_config" "GOD_"
    fi

    # Load user config if exists (overrides project)
    local user_config="${HOME}/.god-agent/launcher.yaml"
    if [[ -f "$user_config" ]]; then
        log_info "Loading user config: ${user_config}"
        parse_yaml "$user_config" "GOD_"
    fi

    # Apply service config from god-agent config
    load_service_config
}

# Load service-specific configuration
load_service_config() {
    # Try to read from node config manager
    if [[ -f "${GOD_PROJECT_DIR}/dist/god-agent/core/config/config-manager.js" ]]; then
        # Use Node.js to read config values
        local config_json
        config_json=$(node -e "
            const { getFullConfig } = require('${GOD_PROJECT_DIR}/dist/god-agent/core/config/config-manager.js');
            console.log(JSON.stringify(getFullConfig()));
        " 2>/dev/null || echo "{}")

        if [[ -n "$config_json" && "$config_json" != "{}" ]]; then
            # Extract values using simple parsing
            EMBEDDING_PORT=$(echo "$config_json" | grep -oP '"embedding":\s*{[^}]*"port":\s*\K\d+' || echo "$EMBEDDING_PORT")
            OBSERVE_PORT=$(echo "$config_json" | grep -oP '"observe":\s*{[^}]*"port":\s*\K\d+' || echo "$OBSERVE_PORT")
        fi
    fi
}

# Get config value with default
get_config() {
    local key="$1"
    local default="$2"
    local var_name="GOD_${key^^}"
    var_name="${var_name//-/_}"
    var_name="${var_name//./_}"

    echo "${!var_name:-$default}"
}

# Show current configuration
show_config() {
    echo ""
    echo -e "${BOLD}Launcher Configuration:${NC}"
    echo ""
    echo "  Session Name:     ${GOD_SESSION_NAME}"
    echo "  Profile:          ${CURRENT_PROFILE:-$GOD_PROFILE}"
    echo "  Config Dir:       ${GOD_CONFIG_DIR}"
    echo "  Log Dir:          ${GOD_LOG_DIR}"
    echo ""
    echo "  Embedding Port:   ${EMBEDDING_PORT}"
    echo "  Observe Port:     ${OBSERVE_PORT}"
    echo ""
    echo "  Health Interval:  ${HEALTH_CHECK_INTERVAL}s"
    echo "  Max Restarts:     ${MAX_RESTARTS}"
    echo "  Restart Window:   ${RESTART_WINDOW}s"
    echo ""
    echo "  Log Keep Lines:   ${GOD_LOG_KEEP_LINES}"
    echo ""

    # Show config file locations
    echo -e "${BOLD}Config Files:${NC}"
    [[ -f "${GOD_PROJECT_DIR}/.god-agent/launcher.yaml" ]] && \
        echo "  Project: ${GOD_PROJECT_DIR}/.god-agent/launcher.yaml"
    [[ -f "${HOME}/.god-agent/launcher.yaml" ]] && \
        echo "  User: ${HOME}/.god-agent/launcher.yaml"
    echo ""
}
