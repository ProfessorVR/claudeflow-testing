# God Agent v2.1 - Feature & Improvement Proposal

> **Created:** 2026-01-14
> **Status:** Proposal - Ready for Review
> **Scope:** Comprehensive analysis of 133K+ lines across 374 files

---

## Executive Summary

Based on comprehensive codebase analysis, the God Agent v2.0 is a **mature, well-architected system** with strong foundations. However, several critical gaps exist around operational hardening, extensibility, and developer experience.

### Health Scorecard

| Dimension | Score | Status |
|-----------|-------|--------|
| Architecture | 9/10 | Excellent - 6-layer design, 197 agents |
| Learning System | 7/10 | Good - needs convergence metrics |
| Error Handling | 5/10 | Critical - silent failures, no recovery |
| Logging | 4/10 | Critical - Logger exists but unused |
| Configuration | 5/10 | Problematic - hardcoded values |
| Testing | 7/10 | Good - 272 tests, missing integration |
| Extensibility | 6/10 | Partial - no plugin system |
| Developer Experience | 6/10 | Complex multi-service startup |

---

## TIER 1: CRITICAL (Production Hardening)

### 1.1 Unified Logging System
**Priority:** P0 | **Effort:** 1 week

**Problem:**
- Sophisticated `Logger` class exists in `core/observability/logger.ts` but is **never used**
- All services use `console.log()` instead
- No log aggregation, no trace IDs, no structured logging

**Solution:**
```typescript
// Replace all console.log with Logger
import { Logger } from '../observability/logger';
const log = Logger.child({ service: 'daemon' });

log.info('Starting service', { port: 3847 });
log.error('Connection failed', { error, retryIn: 5000 });
```

**Deliverables:**
- [ ] Replace console.log in all daemon services
- [ ] Add trace_id propagation across services
- [ ] Integrate with launcher log aggregation (`god launch logs`)
- [ ] Add log levels via environment variable

---

### 1.2 Error Recovery System
**Priority:** P0 | **Effort:** 2 weeks

**Problem:**
- Many catch blocks are empty or just log
- No retry logic for network calls
- No circuit breaker for external dependencies
- Pipeline failures require manual intervention

**Solution:**
```typescript
// Centralized error handler with recovery
class ErrorRecovery {
  async withRetry<T>(fn: () => Promise<T>, options: RetryOptions): Promise<T>;
  async withCircuitBreaker<T>(fn: () => Promise<T>, options: CBOptions): Promise<T>;
  async withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T>;
}
```

**Deliverables:**
- [ ] Create `ErrorRecovery` service
- [ ] Add retry logic to embedding provider
- [ ] Add circuit breaker for external APIs
- [ ] Implement pipeline phase rollback
- [ ] Add graceful degradation for UCM without embeddings

---

### 1.3 Configuration Externalization
**Priority:** P0 | **Effort:** 1 week

**Problem:**
- Hardcoded: ports (8000, 3847), sockets, directories, timeouts
- 1536 vector dimension in 10+ files
- No config file loading despite launcher.yaml existing

**Solution:**
```yaml
# ~/.god-agent/config.yaml
services:
  embedding:
    port: 8000
    model: gte-Qwen2-1.5B-instruct
  observe:
    port: 3847
  daemon:
    socket: /tmp/godagent-db.sock

vectors:
  dimension: 1536

timeouts:
  embedding: 30000
  health_check: 5000
```

**Deliverables:**
- [ ] Create `ConfigManager` with validation
- [ ] Externalize all hardcoded values
- [ ] Add `god config show` command
- [ ] Add `god doctor` for configuration validation
- [ ] Environment variable overrides

---

### 1.4 Daemon Integration Testing
**Priority:** P1 | **Effort:** 1 week

**Problem:**
- Zero daemon integration tests
- Socket communication not tested
- No error path testing

**Deliverables:**
- [ ] Add daemon startup/shutdown tests
- [ ] Test socket communication reliability
- [ ] Test error recovery paths
- [ ] Add launcher script tests

---

## TIER 2: HIGH (Feature Completeness)

### 2.1 Intelligent Model Router (from existing plan)
**Priority:** P1 | **Effort:** 3-4 weeks

**Reference:** `docs/plans/intelligent-model-router.md`

**Core Features:**
- Capability-based routing (Claude → OpenAI → Local)
- Task complexity classification
- Audit logging for non-Claude changes
- Review queue when Claude returns
- Cost tracking with budgets
- Quality scoring with adaptive routing

**Key Addition:** Manual override with `--model` flag

---

### 2.2 Complete Launcher Features (from existing plan)
**Priority:** P1 | **Effort:** 2 weeks

**Reference:** `docs/plans/god-agent-launcher.md`

**Missing Features (marked Priority in plan):**
- [ ] Log aggregation with search/filter (`god launch logs --search error`)
- [ ] Performance metrics dashboard (`god launch metrics`)
- [ ] Service profiles (`--profile minimal|dev|prod`)
- [ ] launcher.yaml configuration loading
- [ ] Health monitoring auto-restart

---

### 2.3 Learning System Convergence
**Priority:** P1 | **Effort:** 2 weeks

**Problem:**
- No convergence metrics or visualization
- No plateau detection
- Fisher matrix grows unbounded
- No adaptive learning rate

**Solution:**
```typescript
interface ConvergenceMetrics {
  learningCurve: number[];     // Loss over time
  convergenceSpeed: number;     // Steps to 90% of final
  plateauDetected: boolean;
  recommendedAction: 'continue' | 'pause' | 'reset';
}

// god learn status --convergence
```

**Deliverables:**
- [ ] Add convergence tracking to SONA engine
- [ ] Implement plateau detection
- [ ] Add Fisher matrix pruning
- [ ] Create `god learn status --convergence` command

---

### 2.4 Mode Selection Auto-Pilot
**Priority:** P1 | **Effort:** 2 weeks

**Problem:**
- ReasoningBank has 4 modes but auto-selection marked "reserved for future"
- Currently requires manual mode specification

**Solution:**
```typescript
class ModeSelector {
  // ML-based mode selection
  async selectMode(task: Task): Promise<ReasoningMode> {
    const features = await this.extractFeatures(task);
    return this.classifier.predict(features);
  }
}
```

**Deliverables:**
- [ ] Implement ModeSelector with heuristic baseline
- [ ] Add mode performance tracking
- [ ] Create training data from historical runs
- [ ] Add `--mode auto` flag

---

### 2.5 Comprehensive GUI Dashboard
**Priority:** P1 | **Effort:** 3-4 weeks

**Problem:**
- Current vanilla JS dashboard has limited interactivity
- No unified view of all system capabilities
- CLI commands require memorization
- No visual command builder

**Current State:**
- Web dashboard at http://localhost:3847 (vanilla JS + Chart.js)
- Terminal dashboard in tmux (bash + watch)
- Strong Express API backend with SSE streaming

**Solution: Hybrid React + TUI Approach**

```
┌─────────────────────────────────────────────────────────────┐
│                     Express Server (:3847)                   │
│   ├── REST API (/api/*)                                      │
│   ├── SSE Stream (/api/stream)                               │
│   └── Static Files (React build)                             │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────────┐           ┌─────────────────┐
│  Web Dashboard  │           │  TUI Dashboard  │
│  (React SPA)    │           │  (Enhanced)     │
│                 │           │                 │
│ - Service mgmt  │           │ - Quick status  │
│ - Agent browser │           │ - Log tailing   │
│ - Command forms │           │ - tmux control  │
│ - Pipeline view │           │ - Keyboard nav  │
│ - Memory inspect│           │                 │
│ - Learning viz  │           │                 │
└─────────────────┘           └─────────────────┘
```

**GUI Components:**

| Panel | Features |
|-------|----------|
| Service Management | Status, logs, restart controls for 5 services |
| Agent Registry | Browse 197+ agents by category, view specs |
| Command Palette | VS Code-style Cmd+K for all god commands |
| Pipeline Viewer | 28-phase PhD pipeline with progress |
| Memory Inspector | 5 tabs (Interaction, Reasoning, Episode, UCM, Hyperedge) |
| Learning Dashboard | Trajectories, patterns, quality trends |

**Recommended Stack:**
| Layer | Technology |
|-------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS |
| State | Zustand + TanStack Query |
| UI Kit | shadcn/ui |
| Charts | Recharts |

**Deliverables:**
- [ ] Set up React + Vite project in `/gui` directory
- [ ] Create API client for existing endpoints
- [ ] Implement SSE hook for real-time updates
- [ ] Build Service Management panel
- [ ] Build Agent Registry browser with search
- [ ] Build Command Palette with form inputs
- [ ] Build Pipeline progress visualization
- [ ] Build Memory Inspector tabs
- [ ] Build Learning metrics dashboard
- [ ] Add keyboard shortcuts throughout

---

## TIER 3: MEDIUM (Extensibility)

### 3.1 LLM Provider Abstraction
**Priority:** P2 | **Effort:** 2 weeks

**Problem:**
- Hard-wired to Anthropic Claude
- No support for OpenAI, local models

**Solution:**
```typescript
interface ILLMProvider {
  complete(prompt: string, options: CompletionOptions): Promise<string>;
  stream(prompt: string): AsyncIterable<string>;
  getModel(): string;
  getCost(tokens: number): number;
}

// Implementations
class AnthropicProvider implements ILLMProvider { }
class OpenAIProvider implements ILLMProvider { }
class OllamaProvider implements ILLMProvider { }
```

**Deliverables:**
- [ ] Create `ILLMProvider` interface
- [ ] Refactor current Anthropic usage
- [ ] Add OpenAI provider
- [ ] Add Ollama local provider
- [ ] Provider selection in config

---

### 3.2 Plugin System Foundation
**Priority:** P2 | **Effort:** 3 weeks

**Problem:**
- No standardized way to extend God Agent
- Adapters must be compiled into binary
- No plugin lifecycle management

**Solution:**
```typescript
interface IPlugin {
  id: string;
  version: string;

  onLoad(context: PluginContext): Promise<void>;
  onUnload(): Promise<void>;

  // Optional hooks
  onBeforeTask?(task: Task): Promise<void>;
  onAfterTask?(task: Task, result: Result): Promise<void>;
}

// Plugin manifest (god-plugin.yaml)
id: my-plugin
version: 1.0.0
hooks:
  - beforeTask
  - afterTask
permissions:
  - memory:read
  - memory:write
```

**Deliverables:**
- [ ] Define plugin interface
- [ ] Create plugin loader
- [ ] Implement lifecycle hooks
- [ ] Add plugin configuration schema
- [ ] Create sample plugin

---

### 3.3 Event Bus for Agent Communication
**Priority:** P2 | **Effort:** 2 weeks

**Problem:**
- Agents communicate only via memory (eventual consistency)
- No direct messaging or events
- No heartbeats between agents

**Solution:**
```typescript
interface IEventBus {
  subscribe(pattern: string, handler: EventHandler): Subscription;
  publish(event: AgentEvent): void;
  request(event: AgentEvent): Promise<Response>;
}

// Usage
eventBus.subscribe('agent.*.completed', (event) => {
  console.log(`Agent ${event.agentId} completed task`);
});

eventBus.publish({
  type: 'agent.research.completed',
  agentId: 'researcher-1',
  result: { ... }
});
```

**Deliverables:**
- [ ] Create EventBus with pub/sub
- [ ] Add request/response pattern
- [ ] Integrate with Relay Race orchestrator
- [ ] Add agent heartbeat events

---

### 3.4 Vector Database Abstraction
**Priority:** P2 | **Effort:** 2 weeks

**Problem:**
- Hard-wired to HNSW backend
- No support for Pinecone, Weaviate, Qdrant

**Solution:**
```typescript
interface IVectorStore {
  insert(vectors: VectorWithMetadata[]): Promise<string[]>;
  search(query: Float32Array, topK: number): Promise<SearchResult[]>;
  delete(ids: string[]): Promise<void>;
}

// Implementations
class HNSWStore implements IVectorStore { }
class PineconeStore implements IVectorStore { }
class QdrantStore implements IVectorStore { }
```

---

## TIER 4: NICE-TO-HAVE (Polish)

### 4.1 Observability Dashboard Enhancements
**Priority:** P3 | **Effort:** 2 weeks

- Real-time learning curve visualization
- Agent execution timelines
- Memory usage trends
- Prometheus metrics export
- Grafana dashboard templates

---

### 4.2 GraphQL API
**Priority:** P3 | **Effort:** 3 weeks

```graphql
query {
  agents(status: ACTIVE) {
    id, name, capabilities
  }
  episodes(filter: { domain: "research", quality: { gte: 0.8 } }) {
    id, content, quality
  }
  trajectories(limit: 10) {
    id, verdict, weight
  }
}

mutation {
  provideFeedback(trajectoryId: "...", verdict: POSITIVE, notes: "...")
}
```

---

### 4.3 Distributed Execution
**Priority:** P3 | **Effort:** 6+ weeks

- Multi-machine agent execution
- Distributed 2PC for memory transactions
- Agent federation across instances
- Load balancing with agent pools

---

### 4.4 MCP Server for God Agent
**Priority:** P3 | **Effort:** 3 weeks

Expose God Agent capabilities as MCP tools:
```typescript
// god-agent-mcp-server
tools:
  - god_ask: Ask the god agent a question
  - god_research: Deep research with PhD pipeline
  - god_learn: Store knowledge
  - god_feedback: Rate a trajectory
```

---

## Refactoring Priorities

### Critical Files to Split

| File | Lines | Recommendation |
|------|-------|----------------|
| `phd-cli.ts` | 155,803 | Split by research phase |
| `universal-agent.ts` | 4,165 | Extract routing logic |
| `gnn-enhancer.ts` | 37,492 | Separate training/inference |
| `sona-engine.ts` | 2,000+ | Extract persistence layer |

### Code Quality Improvements

1. **SimpleMutex** - Replace with proper async mutex library
2. **File I/O** - Add timeout handling
3. **SQLite** - Add connection pooling
4. **Wait Gates** - Add timeout guards (prevent hangs)

---

## Implementation Roadmap

### Phase 1: Hardening (Weeks 1-4)
- 1.1 Unified Logging
- 1.2 Error Recovery
- 1.3 Configuration Externalization
- 1.4 Integration Testing

### Phase 2: Core Features (Weeks 5-10)
- 2.2 Complete Launcher Features
- 2.3 Learning Convergence
- 2.4 Mode Selection
- 2.5 Comprehensive GUI Dashboard (parallel track)

### Phase 3: Router (Weeks 11-14)
- 2.1 Intelligent Model Router (full implementation)

### Phase 4: Extensibility (Weeks 15-20)
- 3.1 LLM Provider Abstraction
- 3.2 Plugin System
- 3.3 Event Bus

### Phase 5: Polish (Weeks 21+)
- 3.4 Vector DB Abstraction
- 4.x Nice-to-have features

---

## Quick Wins (Can Do Now)

1. **Replace console.log** with Logger (1-2 days)
2. **Add timeout to wait gates** (1 day)
3. **Document environment variables** (1 day)
4. **Fix launcher log aggregation** (2-3 days)
5. **Add `god doctor` command** (1 day)

---

## Summary

The God Agent v2.0 is architecturally excellent but needs:

1. **Operational hardening** - logging, errors, config
2. **Feature completion** - router, launcher, learning metrics
3. **Extensibility** - LLM providers, plugins, events
4. **Code quality** - split monolithic files, add tests

Total estimated effort: **20-24 weeks** for full implementation

Recommended immediate focus: **Tier 1 items** (4-6 weeks) to achieve production hardness.
