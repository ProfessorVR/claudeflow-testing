# GPU Server Switching - vLLM ↔ Embedding

## Overview

The God Agent intelligently manages GPU resources by automatically switching between two modes:

1. **vLLM Mode (Default)**: Runs Qwen2.5-Coder-32B-Instruct-AWQ for local inference
2. **Embedding Mode (On-Demand)**: Runs GTE-Qwen2-1.5B for document ingestion

**Why switch?** Both services require significant GPU VRAM and cannot run simultaneously on a 32GB GPU. The system optimizes resource usage by:
- Running vLLM by default (most common use case)
- Only starting embedding when needed (document ingest operations)
- Automatically switching back to vLLM after ingest completes

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   God Agent Services                    │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   vLLM AWQ   │◄──►│  Embedding   │  GPU Switching   │
│  │   Port 8002  │    │  Port 8000   │  Managed by      │
│  └──────────────┘    └──────────────┘  GPUServerManager│
│         │                    │                          │
│         └────────┬───────────┘                          │
│                  │                                      │
│              32GB GPU                                   │
│         (Only one active)                               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  Always Running: Memory, Daemon, UCM, Observe          │
└─────────────────────────────────────────────────────────┘
```

## Default Behavior

### When you run `god launch`:

```bash
god launch
```

**Services Started:**
1. ✅ **vLLM AWQ** - Local inference model (port 8002)
2. ✅ **Memory** - AgentDB + DESC
3. ✅ **Daemon** - Core daemon
4. ✅ **UCM** - Universal Context Management
5. ✅ **Observe** - Dashboard (http://localhost:3847)

**Services NOT Started:**
- ❌ **Embedding** - Only starts when needed

**GPU Usage:**
- **~24GB** for vLLM AWQ (with 0.85 utilization)
- **~8GB free** for system/other tasks

## Automatic Switching

### Ingest Operations (Embedding Mode)

When you run document ingest:

```bash
god learn "My research paper" --file paper.pdf
```

**What happens:**

1. **GPUServerManager detects ingest operation**
   - Triggered by `withEmbeddingMode()` wrapper

2. **Stop vLLM** (lines 443-447 in gpu-server-manager.ts)
   ```typescript
   await this.stopAwq();
   await this.sleep(3000);  // Wait for GPU memory to free
   ```

3. **Clear GPU memory** (line 468)
   ```bash
   python3 -c "import torch; torch.cuda.empty_cache()"
   ```

4. **Start embedding server** (lines 367-402)
   - Launches FastAPI wrapper on port 8000
   - Starts ChromaDB on port 8001
   - Waits up to 60s for readiness

5. **Run ingest pipeline**
   - Documents are embedded using GTE-Qwen2-1.5B
   - Stored in ChromaDB vector database

6. **Switch back to vLLM** (lines 571-580)
   ```typescript
   finally {
     if (previousMode === 'awq' || previousMode === 'none') {
       await manager.switchToAwq();  // Always restore vLLM
     }
   }
   ```

**Timeline:**
- vLLM shutdown: ~3 seconds
- GPU memory clear: ~3 seconds
- Embedding startup: ~30-60 seconds
- Ingest operation: varies (depends on document size)
- vLLM restart: ~90-120 seconds

**Total overhead:** ~2-3 minutes for mode switching

## Manual Control

### Check Current GPU Status

```bash
# Via observability dashboard
open http://localhost:3847

# Via CLI (if implemented)
curl http://localhost:3847/api/gpu/status
```

**Response:**
```json
{
  "mode": "awq",
  "awq": {
    "running": true,
    "port": 8002,
    "model": "Qwen/Qwen2.5-Coder-32B-Instruct-AWQ"
  },
  "embedding": {
    "running": false,
    "port": 8000,
    "chromaRunning": false,
    "chromaPort": 8001
  }
}
```

### Manually Start Embedding

```bash
bash scripts/god-launch.d/embedding-on-demand.sh
```

**What it does:**
1. Checks if embedding already running → exit if yes
2. Stops vLLM if running
3. Starts embedding server via `embedding-api/api-embed.sh`
4. Waits for health check (port 8000)

### Manually Switch Back to vLLM

```bash
# Stop embedding
bash embedding-api/api-embed.sh stop

# Restart god launch (which starts vLLM)
god launch restart vllm
```

## Code Integration

### Using `withEmbeddingMode()` Wrapper

**Recommended approach** for any code that needs embedding:

```typescript
import { withEmbeddingMode } from '@/god-agent/core/gpu';

async function ingestDocuments(files: string[]) {
  // This automatically handles GPU switching
  await withEmbeddingMode(async () => {
    // Your ingest code here
    for (const file of files) {
      const chunks = await chunkDocument(file);
      await embedAndStore(chunks);
    }
  });
  // vLLM automatically restarted after this block
}
```

### Manual Control via GPUServerManager

**Advanced usage** when you need fine-grained control:

```typescript
import { getGPUServerManager } from '@/god-agent/core/gpu';

async function advancedWorkflow() {
  const manager = getGPUServerManager();

  // Check current state
  const status = await manager.getStatus();
  console.log('Current mode:', status.mode);

  // Switch to embedding
  const switched = await manager.switchToEmbedding();
  if (!switched) {
    throw new Error('Failed to switch to embedding mode');
  }

  try {
    // Do embedding work
    await performEmbedding();
  } finally {
    // Always switch back
    await manager.switchToAwq();
  }
}
```

## Ports Reference

| Service | Port | Default State | Purpose |
|---------|------|---------------|---------|
| vLLM AWQ | 8002 | Running | Local inference |
| Embedding API | 8000 | Stopped | Document embedding |
| ChromaDB | 8001 | Stopped | Vector storage |
| Dashboard | 3847 | Running | Observability |
| Memory Server | socket | Running | AgentDB/DESC |
| Daemon | socket | Running | Core daemon |
| UCM | socket | Running | Context management |

## Configuration

### Environment Variables

```bash
# vLLM configuration
export VLLM_PORT=8002                      # Default vLLM port
export VLLM_GPU_MEMORY_UTILIZATION=0.85    # 85% of GPU VRAM
export VLLM_MAX_MODEL_LEN=16384            # Max context length

# Embedding configuration
export EMBEDDING_PORT=8000                 # Default embedding port
export CHROMA_PORT=8001                    # Default ChromaDB port
export UCM_EMBEDDING_ENDPOINT="http://127.0.0.1:8000"
```

### GPU Optimization Settings

**vLLM** (lines 279-283 in gpu-server-manager.ts):
```bash
export PYTORCH_ALLOC_CONF="expandable_segments:True"
export NCCL_CUMEM_ENABLE="0"
```

## Troubleshooting

### vLLM fails to start

**Symptoms:**
```
[ERROR] vLLM AWQ server failed to start within 120s
```

**Solutions:**
1. Check GPU availability:
   ```bash
   nvidia-smi
   ```

2. Verify vLLM installation:
   ```bash
   vllm --version
   pip install vllm
   ```

3. Check memory:
   ```bash
   # Should show ~24GB free
   nvidia-smi --query-gpu=memory.free --format=csv
   ```

4. Check logs:
   ```bash
   tail -f ~/.god-agent/logs/vllm.log
   ```

### Embedding server won't start

**Symptoms:**
```
[ERROR] Embedding server failed to start within 60s
```

**Solutions:**
1. Check if script exists:
   ```bash
   ls -la embedding-api/api-embed.sh
   ```

2. Verify Python dependencies:
   ```bash
   pip install fastapi sentence-transformers chromadb
   ```

3. Check if vLLM was properly stopped:
   ```bash
   pkill -f "vllm serve"
   sleep 3
   python3 -c "import torch; torch.cuda.empty_cache()"
   ```

### Both services running (GPU OOM)

**Symptoms:**
```
CUDA out of memory
```

**Solutions:**
1. Stop both services:
   ```bash
   pkill -f "vllm serve"
   bash embedding-api/api-embed.sh stop
   ```

2. Clear GPU memory:
   ```bash
   python3 -c "import torch; torch.cuda.empty_cache()"
   ```

3. Restart god launch:
   ```bash
   god launch restart
   ```

### Switching takes too long

**Normal behavior:**
- vLLM startup: 90-120 seconds (model loading)
- Embedding startup: 30-60 seconds (model loading)

**Optimization ideas:**
1. Keep embedding model in CPU RAM (future enhancement)
2. Use smaller embedding model
3. Increase GPU memory (upgrade to 48GB/80GB GPU)

## Performance Metrics

### GPU VRAM Usage

| Mode | VRAM Used | Available | Utilization |
|------|-----------|-----------|-------------|
| vLLM Only | ~24GB | ~8GB | 75% |
| Embedding Only | ~8GB | ~24GB | 25% |
| Both (ERROR) | ~32GB | 0GB | 100% (OOM) |

### Switching Times

| Operation | Duration | Notes |
|-----------|----------|-------|
| vLLM → Embedding | 40-70s | Includes model unload + load |
| Embedding → vLLM | 95-125s | vLLM model is larger |
| Round-trip (with ingest) | 3-5 min | Depends on document size |

## Best Practices

1. **Let GPUServerManager handle switching**
   - Use `withEmbeddingMode()` wrapper
   - Don't manually start/stop services during ingest

2. **Batch ingest operations**
   - Process multiple documents in one go
   - Minimize mode switches

3. **Monitor GPU usage**
   - Check dashboard: `http://localhost:3847`
   - Watch for OOM errors

4. **Use profiles appropriately**
   ```bash
   # Development - all services
   god launch --profile dev

   # Minimal - no GPU services
   god launch --profile minimal
   ```

5. **Plan for switching time**
   - First ingest after launch: ~2 minutes overhead
   - Subsequent ingests: immediate (if embedding still running)

## Future Enhancements

1. **Keep embedding model in CPU RAM**
   - Faster switching (~10s instead of 60s)
   - Requires 16GB+ system RAM

2. **Concurrent execution with model partitioning**
   - Run both on 48GB+ GPU
   - Split VRAM allocation

3. **Remote embedding service**
   - Run embedding on separate GPU
   - No switching needed

4. **Dashboard GPU mode indicator**
   - Real-time mode display
   - Quick-switch buttons

## References

- GPUServerManager: `src/god-agent/core/gpu/gpu-server-manager.ts`
- Embedding on-demand script: `scripts/god-launch.d/embedding-on-demand.sh`
- vLLM startup: `scripts/god-launch.d/start.sh` (lines 125-205)
- Profiles: `scripts/god-launch.d/profiles.sh`
