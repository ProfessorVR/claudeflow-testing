# Plan: God Agent Unified Launcher (tmux-based)

> **Permanent Location:** `docs/plans/god-agent-launcher.md`
> **Created:** 2026-01-14
> **Status:** Draft - Proposal for review

---

## Goal

Create a single launcher command that starts all god-agent services in a managed tmux session with:
- Organized visibility into each service
- Health monitoring and auto-restart
- Clean startup/shutdown orchestration
- Developer-friendly interface

---

## Current State

```
npm run god-agent:start
  └─→ memory:start && daemon:start && ucm:start && observe:start
```

**Problems:**
- No unified visibility (logs scattered)
- No health monitoring after startup
- No auto-restart on crash
- Can't easily attach/detach from services
- Embedding server must be started separately

---

## Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     god-agent-launcher                              │
│                    (scripts/god-launch)                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      tmux session: god-agent                        │
├─────────────────────────────────────────────────────────────────────┤
│  Window 0: dashboard     │ Health monitor + service status         │
├──────────────────────────┼──────────────────────────────────────────┤
│  Window 1: memory        │ Memory server daemon logs               │
├──────────────────────────┼──────────────────────────────────────────┤
│  Window 2: daemon        │ Core daemon logs                        │
├──────────────────────────┼──────────────────────────────────────────┤
│  Window 3: ucm           │ UCM daemon logs                         │
├──────────────────────────┼──────────────────────────────────────────┤
│  Window 4: observe       │ Observability daemon logs               │
├──────────────────────────┼──────────────────────────────────────────┤
│  Window 5: embedding     │ Embedding server (ollama/fastapi)       │
├──────────────────────────┼──────────────────────────────────────────┤
│  Window 6: shell         │ Interactive shell for commands          │
└──────────────────────────┴──────────────────────────────────────────┘
```

---

## Launcher Commands

```bash
# Start all services in tmux session
god launch                  # or: scripts/god-launch start

# Attach to running session
god launch attach           # or: scripts/god-launch attach

# View status dashboard
god launch status           # Show service health without attaching

# Stop all services gracefully
god launch stop

# Restart a specific service
god launch restart memory   # Restart just memory server
god launch restart all      # Restart everything

# View logs for a service
god launch logs ucm         # Tail UCM logs
god launch logs all         # Tail all logs (multiplexed)

# Kill session (emergency)
god launch kill
```

---

## tmux Session Layout (Separate Windows - Selected)

Each service gets its own window for easy navigation:

```
[0] dashboard*  [1] memory  [2] daemon  [3] ucm  [4] observe  [5] embed  [6] shell
```

**Navigation:**
- `Ctrl-b 0-6` - Switch windows
- `Ctrl-b d` - Detach
- `Ctrl-b n/p` - Next/prev window

---

## Dashboard Window Features

The dashboard window provides real-time status:

```
╔═══════════════════════════════════════════════════════════════════╗
║                     GOD AGENT CONTROL CENTER                      ║
╠═══════════════════════════════════════════════════════════════════╣
║  Service          Status      PID      Uptime     Memory   CPU    ║
╠═══════════════════════════════════════════════════════════════════╣
║  memory           ● RUNNING   12345    2h 34m     45 MB    0.1%   ║
║  daemon           ● RUNNING   12346    2h 34m     128 MB   0.3%   ║
║  ucm              ● RUNNING   12347    2h 34m     89 MB    0.2%   ║
║  observe          ● RUNNING   12348    2h 34m     156 MB   0.5%   ║
║  embedding        ● RUNNING   12349    2h 34m     2.1 GB   15%    ║
╠═══════════════════════════════════════════════════════════════════╣
║  Last Health Check: 2 seconds ago                                 ║
║  Dashboard: http://localhost:3847                                 ║
║  Embedding: http://localhost:8000/embed                           ║
╠═══════════════════════════════════════════════════════════════════╣
║  [r] restart all  [s] stop all  [q] quit  [1-5] restart service  ║
╚═══════════════════════════════════════════════════════════════════╝
```

**Interactive Commands:**
- `r` - Restart all services
- `s` - Stop all services (graceful)
- `q` - Quit dashboard (services keep running)
- `1-5` - Restart individual service
- `l` - Toggle log tailing mode
- `h` - Show help

---

## Health Monitoring Features

### Auto-Restart on Crash
```yaml
health_monitoring:
  enabled: true
  check_interval: 10s

  restart_policy:
    max_restarts: 3           # Max restarts in window
    restart_window: 300s      # 5 minute window
    backoff: exponential      # 1s, 2s, 4s, 8s...
    max_backoff: 60s

  alerts:
    on_crash: true
    on_restart: true
    on_max_restarts: true     # Service marked as failed
```

### Health Check Methods
| Service | Check Method |
|---------|--------------|
| memory | Socket ping + PID check |
| daemon | Socket ping + health RPC |
| ucm | Socket ping + health RPC |
| observe | HTTP GET /api/health |
| embedding | HTTP POST /embed (test vector) |

### Dependency-Aware Restarts
If a service crashes, check dependents:
```
memory ← daemon ← ucm
              ↖ observe

If memory crashes → restart memory, then daemon, then ucm
If daemon crashes → restart daemon only
If embedding crashes → warn (ucm degrades gracefully)
```

---

## Startup Sequence

```
1. Check prerequisites
   ├── tmux installed?
   ├── Node.js version OK?
   ├── Required ports available? (3847, 8000)
   └── Project built? (dist/ exists)

2. Check for existing session
   ├── Session exists + healthy → offer attach
   ├── Session exists + unhealthy → offer restart
   └── No session → proceed with start

3. Create tmux session
   └── god-agent (detached initially)

4. Start services in order (with health gates)
   ├── Window 1: Start embedding server
   │             Wait for http://localhost:8000/embed ready
   │
   ├── Window 2: Start memory daemon
   │             Wait for socket ready
   │
   ├── Window 3: Start core daemon
   │             Wait for socket ready
   │
   ├── Window 4: Start UCM daemon
   │             Wait for socket ready + embedding connected
   │
   ├── Window 5: Start observability
   │             Wait for http://localhost:3847 ready
   │
   └── Window 0: Start dashboard monitor

5. Report status
   ├── All services healthy → "Ready! Run: god launch attach"
   └── Some failed → Show which, offer retry
```

---

## Embedding Server Integration

### Option A: Ollama Direct
```bash
# In embedding window
ollama serve  # Runs on :11434

# UCM configured to use:
# OLLAMA_HOST=http://localhost:11434
```

### Option B: FastAPI Wrapper (Current)
```bash
# In embedding window
cd embedding-api && python api_embedder.py
# Runs on :8000
```

### Option C: Hybrid (Recommended)
```bash
# Check if ollama running, use it
# Otherwise start FastAPI wrapper
# Configure UCM_EMBEDDING_ENDPOINT accordingly
```

---

## Configuration File

`~/.god-agent/launcher.yaml`:
```yaml
launcher:
  session_name: god-agent
  layout: windows           # windows | panes | hybrid

  dashboard:
    enabled: true
    refresh_interval: 2s
    show_logs: true

  services:
    memory:
      enabled: true
      auto_restart: true
      priority: 1

    daemon:
      enabled: true
      auto_restart: true
      priority: 2
      depends_on: [memory]

    ucm:
      enabled: true
      auto_restart: true
      priority: 3
      depends_on: [daemon, embedding]

    observe:
      enabled: true
      auto_restart: true
      priority: 4
      depends_on: [daemon]

    embedding:
      enabled: true
      auto_restart: true
      priority: 0           # Start first
      type: ollama          # ollama | fastapi | external
      model: gte-Qwen2-1.5B-instruct

  health:
    check_interval: 10s
    startup_timeout: 30s
    restart_delay: 2s
    max_restarts: 3

  logging:
    keep_lines: 1000
    log_dir: ~/.god-agent/logs/
    rotate: daily
```

---

## Implementation Files (Bash Scripts - Selected)

| File | Purpose |
|------|---------|
| `scripts/god-launch` | Main launcher entry point (executable) |
| `scripts/god-launch.d/start.sh` | Startup logic with health gates |
| `scripts/god-launch.d/stop.sh` | Graceful shutdown logic |
| `scripts/god-launch.d/status.sh` | Status checking and display |
| `scripts/god-launch.d/health.sh` | Health monitoring loop |
| `scripts/god-launch.d/dashboard.sh` | Dashboard TUI (using `watch` + formatting) |
| `scripts/god-launch.d/logs.sh` | Log aggregation and search |
| `scripts/god-launch.d/metrics.sh` | Performance metrics collection |
| `~/.god-agent/launcher.yaml` | User configuration (parsed with `yq`) |

---

## Additional Features (Open for Discussion)

### 1. Service Profiles
```bash
god launch --profile minimal    # memory + daemon only
god launch --profile dev        # all services + verbose logging
god launch --profile prod       # all services + minimal logging
god launch --profile research   # all + PhD pipeline ready
```

### 2. Remote Attach
```bash
god launch --remote user@server  # SSH + tmux attach
```

### 3. Log Aggregation (Priority Feature)
```bash
# Tail all logs in real-time (multiplexed with color-coded prefixes)
god launch logs all
# Output:
# [memory]  2026-01-14 10:23:45 INFO  Knowledge entry stored
# [daemon]  2026-01-14 10:23:45 DEBUG Episode created: ep_12345
# [ucm]     2026-01-14 10:23:46 INFO  DESC injection: 3 episodes
# [observe] 2026-01-14 10:23:46 HTTP  GET /api/health 200

# Tail specific service
god launch logs memory

# Search across all logs
god launch logs --search "error"
god launch logs --search "error" --since 1h
god launch logs --search "episode" --service daemon

# Filter by log level
god launch logs --level error    # ERROR only
god launch logs --level warn     # WARN and above

# Export for debugging
god launch logs --export ~/debug-$(date +%Y%m%d).tar.gz
god launch logs --export --since 24h ~/last-day.tar.gz

# Follow with grep
god launch logs all | grep -E "(ERROR|WARN)"
```

**Log Storage:**
```
~/.god-agent/logs/
├── memory.log          # Rolling log (last 10MB)
├── daemon.log
├── ucm.log
├── observe.log
├── embedding.log
└── archive/            # Rotated logs
    ├── memory.log.2026-01-13.gz
    └── ...
```

### 4. Performance Metrics (Priority Feature)
```bash
# Real-time metrics dashboard
god launch metrics
# Output:
# ╔═══════════════════════════════════════════════════════════════════╗
# ║                     PERFORMANCE METRICS                           ║
# ╠═══════════════════════════════════════════════════════════════════╣
# ║  Service      CPU     Memory    Requests/s    Avg Latency        ║
# ╠═══════════════════════════════════════════════════════════════════╣
# ║  memory       0.2%    48 MB     12.3          2.1 ms             ║
# ║  daemon       0.5%    132 MB    8.7           15.4 ms            ║
# ║  ucm          0.3%    94 MB     5.2           45.2 ms            ║
# ║  observe      0.8%    168 MB    2.1           8.3 ms             ║
# ║  embedding    18.2%   2.3 GB    1.4           892 ms             ║
# ╠═══════════════════════════════════════════════════════════════════╣
# ║  System: CPU 24% | Memory 4.2/16 GB | Disk I/O 12 MB/s           ║
# ╚═══════════════════════════════════════════════════════════════════╝

# Historical metrics (last hour)
god launch metrics --history 1h
# Shows sparkline graphs for each metric

# Export for Prometheus/Grafana
god launch metrics --export prometheus > /tmp/god-agent-metrics.prom
god launch metrics --export json > /tmp/metrics.json

# Continuous export (scrape endpoint)
god launch metrics --serve :9090  # Prometheus scrape endpoint

# Resource alerts
god launch metrics --alert "memory.rss > 500MB"
god launch metrics --alert "cpu > 50%"
```

**Metrics Collected:**
| Metric | Source | Description |
|--------|--------|-------------|
| `process_cpu_percent` | `ps` | CPU usage per service |
| `process_memory_rss` | `ps` | Resident set size |
| `process_memory_vms` | `ps` | Virtual memory size |
| `process_uptime` | PID file | Time since start |
| `socket_connections` | `ss` | Active connections |
| `http_requests_total` | observe API | Request count |
| `http_request_duration` | observe API | Latency histogram |
| `embedding_requests` | UCM logs | Embedding calls |
| `embedding_latency` | UCM logs | Embedding response time |
| `episodes_created` | daemon logs | DESC episode count |
| `knowledge_entries` | memory logs | Knowledge store size |

### 5. Service Hooks
```yaml
services:
  daemon:
    hooks:
      pre_start: "echo 'Starting daemon...'"
      post_start: "notify-send 'Daemon ready'"
      on_crash: "slack-notify 'Daemon crashed!'"
```

### 6. Automatic Updates
```bash
god launch update              # Pull latest, rebuild, restart
god launch update --dry-run    # Show what would change
```

### 7. tmux Keybindings
Custom prefix for god-agent session:
```
Ctrl-g (instead of Ctrl-b)
  Ctrl-g 0-6  - Switch window
  Ctrl-g r    - Restart current service
  Ctrl-g R    - Restart all
  Ctrl-g s    - Stop current service
  Ctrl-g S    - Stop all
  Ctrl-g d    - Detach
  Ctrl-g ?    - Help
```

---

## Verification Plan

1. **Unit tests** - Config loading, health check logic
2. **Integration tests** - Service startup/shutdown sequences
3. **Manual testing:**
   - Fresh start from nothing
   - Attach to existing session
   - Kill a service, verify auto-restart
   - Stop all, verify clean shutdown
   - Verify dashboard updates correctly

---

## Summary

### Selected Configuration
- **Layout:** Separate Windows (7 windows: dashboard, memory, daemon, ucm, observe, embed, shell)
- **Implementation:** Bash scripts (portable, simple)
- **Priority Features:** Log aggregation + Performance metrics

### Core Features
| Feature | Benefit |
|---------|---------|
| Unified tmux session | All services visible, easy navigation |
| Health monitoring | Auto-restart on crash with backoff |
| Dashboard TUI | Real-time status at a glance |
| Dependency ordering | Correct startup sequence with health gates |
| Easy attach/detach | Resume from anywhere with `god launch attach` |
| Log aggregation | Search, filter, export across all services |
| Performance metrics | CPU/memory/latency tracking, Prometheus export |

### Commands Summary
```bash
god launch              # Start all services
god launch attach       # Attach to session
god launch stop         # Graceful shutdown
god launch status       # Quick health check
god launch logs all     # Tail all logs
god launch logs --search "error"
god launch metrics      # Performance dashboard
god launch restart ucm  # Restart single service
```
