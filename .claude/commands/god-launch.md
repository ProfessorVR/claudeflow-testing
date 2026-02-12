---
description: Launch, stop, or manage God Agent services (vLLM, embedding, memory, daemon, UCM, observability)
---

Manage the God Agent unified service launcher. This controls all God Agent infrastructure services running in a tmux session.

**Query/Arguments:** $ARGUMENTS

## Services Managed

| Service | Port | Description |
|---------|------|-------------|
| vLLM | 8002 | Local Qwen2.5-Coder-32B-Instruct-AWQ model |
| Embedding | 8000 | gte-Qwen2-1.5B-instruct embedding API |
| ChromaDB | 8001 | Vector database for embeddings |
| Memory | - | AgentDB + DESC memory server |
| Daemon | - | Core God Agent daemon |
| UCM | - | Universal Context Management daemon |
| Observe | 3847 | Observability dashboard |

## Available Commands

Based on the arguments provided, execute the appropriate command:

### Start Services (default)
```bash
./scripts/god-launch start
```

### Stop All Services
```bash
./scripts/god-launch stop
```

### Check Status
```bash
./scripts/god-launch status
```

### Restart Services
```bash
# Restart all
./scripts/god-launch restart

# Restart specific service
./scripts/god-launch restart [service]
```

### Attach to tmux Session
```bash
./scripts/god-launch attach
```

### View Logs
```bash
./scripts/god-launch logs
```

## Profiles

- `--profile minimal` - memory + daemon only
- `--profile dev` - all services (default)
- `--profile prod` - all services + production settings
- `--profile research` - all services + PhD pipeline mode

## Usage Examples

- `/god-launch` or `/god-launch start` - Start all services
- `/god-launch stop` - Stop all services
- `/god-launch status` - Show service status
- `/god-launch restart embedding` - Restart embedding service only
- `/god-launch --profile minimal` - Start with minimal profile

## Endpoints After Launch

- Dashboard: http://localhost:3847
- Embedding API: http://localhost:8000
- ChromaDB: http://localhost:8001
- vLLM API: http://localhost:8002/v1/models
