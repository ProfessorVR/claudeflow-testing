# ClaudeFlow New: Comprehensive Capabilities Report & How-To Guide

Generated: 2026-03-23
Source: `/home/dalton/projects/claudeflow-new` (ste-bah/claudeflow-testing, freshly cloned)

---

# Part 1: Capability Report

## 1. Persistent Memory System (MemoryGraph + LanceDB)

The newest feature (added Mar 23) provides a **dual-store persistent memory architecture** that survives across sessions, compactions, and context resets. It consists of two MCP servers working in tandem:

### MemoryGraph (FalkorDBLite Graph Store)
- **MCP server**: `memorygraph` (Python-based, configured in `settings.json`)
- **Tools (11)**:
  - `store_memory` -- Store typed memories with importance, tags, and content
  - `search_memories` -- Keyword + tag search with tolerance tuning
  - `recall_memories` -- Fuzzy natural-language recall
  - `get_memory` / `update_memory` / `delete_memory` -- CRUD operations
  - `create_relationship` -- Link memories with typed edges (RELATED_TO, CAUSED_BY, etc.)
  - `get_related_memories` -- Traverse relationships from a memory node
  - `contextual_search` -- Combined search across tags, content, and graph proximity
  - `search_relationships_by_context` -- Find relationships matching a context description
  - `get_memory_statistics` -- Counts by type, relationship count, average importance

- **Memory types**: `code_pattern`, `solution`, `fix`, `project`, `technology`, `error`, `problem`, `task`, `workflow`, `command`, `general`, `conversation`, `file_context`
- **Importance decay**: Type-specific half-lives (7-60 days) applied during consolidation
- **Storage**: FalkorDBLite graph database with patched Cypher preamble support
- **Patch verification**: SessionStart hook checks that the FalkorDBLite patch at `~/.memorygraph-venv/lib/python3.12/site-packages/memorygraph/backends/_falkordb_shared.py` matches the backup copy

### LanceDB Vector Store
- **MCP server**: `lancedb-memory` (TypeScript, at `src/mcp-servers/lancedb-memory/server.ts`)
- **Tools (8)**:
  - `embed_and_store` -- Generate embeddings and store in one call
  - `store_embedding` -- Store pre-computed 1536-dim vectors with metadata
  - `search_similar` -- Cosine similarity search with optional SQL WHERE filter
  - `retrieve_context` -- Token-budget-aware context retrieval with fusion scoring
  - `delete_embedding` -- Remove a vector by ID
  - `dual_store` -- Store simultaneously in LanceDB and MemoryGraph
  - `reconcile` -- Compare MemoryGraph vs LanceDB IDs for consistency
  - `drain_queue` -- Process pending embeddings from the queue
  - `stats` -- Table row count, disk usage

- **Storage**: Lance columnar format at `.persistent-memory/vectors/`
- **Retrieval features**: Recency scoring, fusion scoring (similarity + recency), deduplication by content, token budget estimation
- **Embedding provider**: Configurable, supports the local gte-Qwen2-1.5B-instruct embedding model (1536-dim)

### Consolidation System
- **5-stage cycle** (run by `/memory-garden` or `/memory-loop`):
  1. **Decay**: Exponential importance decay based on type-specific half-lives
  2. **Duplicate Detection**: Jaccard similarity on memory titles (>50% overlap flagged)
  3. **Merge**: Combine flagged duplicates, archive donors at importance 0.01
  4. **Relationship Discovery**: Auto-link memories sharing 2+ tags
  5. **Briefing Generation**: Write top-10 by importance to `.persistent-memory/briefing.md`

- **Cursor file**: `.persistent-memory/consolidation-cursor.json` tracks which stage ran last
- **Loop mode**: `/loop 30m /memory-loop` runs one stage every 30 minutes

### File-Based Session Persistence
- `memory-inject.sh` (SessionStart hook): Injects `~/.claude/personality.md`, `~/.claude/understanding.md`, and `.persistent-memory/briefing.md` into context at session start
- `memory-session-end.sh` (Stop hook): Writes `consolidation-pending` flag and `last-session-summary.txt` for next session pickup

---

## 2. Skills System (37 Skills)

Skills live in `.claude/skills/[name]/SKILL.md`. They use YAML frontmatter (`name` + `description`) for progressive disclosure -- only metadata is loaded at startup; the full body loads only when a skill is triggered.

### Memory Lifecycle Skills
| Skill | Command | Purpose |
|-------|---------|---------|
| `start` | `/start` | Session opener: searches MemoryGraph for recent sessions, shows git status, memory health, checks RocketChat, suggests next steps |
| `recall` | `/recall <query>` | Cross-store search: queries MemoryGraph (keyword + fuzzy) and LanceDB (semantic vectors), presents results in labeled sections |
| `session-summary` | `/session-summary` | Stores a structured session summary to MemoryGraph with tags, relationships, and importance 0.7 |
| `learn` | `/learn [topic]` | Self-directed web research: searches the web, extracts 3-5 takeaways, stores in MemoryGraph at importance 0.3. Budget: 3/session. Can auto-select topics based on knowledge gaps |
| `post-mortem` | `/post-mortem <description>` | Failure analysis: captures symptom, attempts, root cause, fix, key insight. Stores at importance 0.85 |
| `memory-garden` | `/memory-garden` | Interactive consolidation: presents menu of 8 actions (full cycle, individual stages, reconcile, drain queue). Updates cursor |
| `memory-loop` | `/memory-loop` | Automated consolidation: runs one stage per invocation, designed for `/loop 30m /memory-loop` |

### Communication Skills
| Skill | Purpose |
|-------|---------|
| `check-messages` | Polls RocketChat `A.I.-Chat` channel for new messages since last read. Silent when none. Stateful (writes last-read timestamp) |

### Development Skills
| Skill | Purpose |
|-------|---------|
| `pair-programming` | AI pair programming with 7 modes (driver, navigator, switch, TDD, review, mentor, debug), truth-score verification, role switching |
| `sparc-methodology` | SPARC (Specification, Pseudocode, Architecture, Refinement, Completion) with 17 modes and multi-agent orchestration |
| `stream-chain` | Multi-agent pipeline chaining where each step's output feeds the next |
| `hooks-automation` | Documentation and management for the full hook system |

### Meta Skills
| Skill | Purpose |
|-------|---------|
| `skill-builder` | Create new skills with proper YAML frontmatter and progressive disclosure structure |
| `skill-propose` | Claude proposes new skills based on observed patterns, asks for user approval before creating |

### Orchestration Skills
| Skill | Purpose |
|-------|---------|
| `swarm-orchestration` | Multi-agent swarm orchestration with mesh, hierarchical, and adaptive topologies |
| `swarm-advanced` | Advanced patterns for research, development, testing, and distributed workflows |
| `hive-mind-advanced` | Queen-led multi-agent coordination with consensus mechanisms |

### Quality & Analysis Skills
| Skill | Purpose |
|-------|---------|
| `verification-quality` | Truth scoring (0.0-1.0), verification checks, automatic rollback, CI/CD integration |
| `performance-analysis` | Bottleneck detection, profiling, reporting, optimization recommendations |

### GitHub Skills
| Skill | Purpose |
|-------|---------|
| `github-code-review` | Multi-agent code review with security/performance analysis |
| `github-multi-repo` | Multi-repository coordination and synchronization |
| `github-project-management` | GitHub Projects management |
| `github-release-management` | Automated versioning, testing, deployment, rollback |
| `github-workflow-automation` | CI/CD workflow automation |

### AgentDB & ReasoningBank Skills
| Skill | Purpose |
|-------|---------|
| `agentdb-advanced` | QUIC sync, multi-database, custom distance metrics, hybrid search |
| `agentdb-learning` | 9 reinforcement learning algorithms (Decision Transformer, Q-Learning, SARSA, etc.) |
| `agentdb-memory-patterns` | Persistent memory patterns for stateful agents |
| `agentdb-optimization` | Quantization, HNSW indexing, caching, batch operations |
| `agentdb-vector-search` | Semantic vector search, RAG, knowledge bases |
| `reasoningbank-agentdb` | Trajectory tracking, verdict judgment, memory distillation |
| `reasoningbank-intelligence` | Adaptive learning, pattern recognition, meta-cognitive systems |

### Platform Skills
| Skill | Purpose |
|-------|---------|
| `flow-nexus-neural` | Neural network training in distributed E2B sandboxes |
| `flow-nexus-platform` | Authentication, sandboxes, app deployment, payments |
| `flow-nexus-swarm` | Cloud-based swarm deployment with event-driven workflows |

### Research Skills
| Skill | Purpose |
|-------|---------|
| `phd-phase8-execution` | PhD Pipeline Phase 8 execution using Task tool with dynamic per-chapter agents |

---

## 3. Hooks System

Hooks are configured in `.claude/settings.json` across 6 lifecycle events. All hooks are shell commands.

### SessionStart Hooks (6 hooks)
1. **clean-settings.sh** -- Sanitizes settings.json (removes corrupt entries)
2. **Memory ghost purge** -- SQLite `DELETE FROM memory_entries WHERE status="deleted"` in `.swarm/memory.db`
3. **god-agent-start.sh** -- Starts all 5 daemon services (Memory Server, Core Daemon, UCM Daemon, Pipeline Daemon, Observability)
4. **ucm-session-start.ts** -- Initializes UCM episodic memory for the new session
5. **LEANN queue check** -- Reports count of queued files needing code indexing
6. **memory-inject.sh** -- Injects personality.md, understanding.md, and briefing.md into context

### PreToolUse Hooks

**On Skill invocation:**
- God-code pipeline activation: When `/god-code` is invoked, activates the 48-agent pipeline enforcement mode (blocks direct Write/Edit until sufficient Task agents are spawned)

**On Task invocation (2 hooks):**
- Pipeline agent counter: Increments agent count for god-code enforcement
- UCM DESC injector: Injects episodic memory context from UCM into subagent prompts

**On Bash invocation (3 hooks):**
- `block-heredoc.sh` -- Blocks dangerous heredoc patterns
- `pipeline-integrity-guard.sh` -- Guards pipeline state integrity
- Claude Flow pre-command hook -- Validates command safety, prepares resources

**On Write/Edit/MultiEdit (1 hook with compound logic):**
- **God-code enforcement v2**: If god-code pipeline is active AND not enough agents have been spawned (min 6 for Phase 1), BLOCKS the write with a detailed error message. This ensures the coding pipeline goes through proper phases before any files are modified.
- LEANN file indexing queue update

### PostToolUse Hooks

**After Skill:**
- Coding pipeline post-hook for god-code completions

**After Task (3 hooks):**
- `post-task.sh` -- Wraps TypeScript post-task handler with 5s timeout
- UCM post-task archive -- Archives episode data
- **Memory nudge** -- Prints: "Subagent complete. If key decisions or patterns were produced, store to MemoryGraph."

**After Bash:**
- Claude Flow post-command -- Tracks metrics, stores results

**After Write/Edit/MultiEdit (2 hooks):**
- Claude Flow post-edit -- Formats, updates memory
- LEANN file indexing -- Indexes modified files for code search

### PreCompact Hooks (2 hooks)
- **Manual compact**: Reminds about 54 agents, swarm strategies, SPARC workflows, golden rule
- **Auto compact**: Same guidance for automatic context compaction

### PermissionRequest Hooks
- **Bash auto-allow**: Common commands (cd, npx, python, node, npm, git, etc.) are auto-allowed without user prompt

### Stop Hooks (5 hooks)
1. God-code pipeline cleanup (removes `.claude/runtime/.god-code-active`)
2. Claude Flow session-end (generates summary, persists state, exports metrics)
3. `god-agent-save.sh` -- Saves god-agent state
4. UCM session stop
5. `clean-settings.sh` -- Final cleanup
6. `memory-session-end.sh` -- Writes consolidation-pending flag and last-session-summary.txt

### StatusLine
A custom status bar command (`.claude/statusline-command.sh`) shows: model name, directory, git branch, swarm topology, agent count, memory/CPU usage, session ID, success rate, average task time, streak count, active tasks, and hooks state.

---

## 4. Observability Dashboard (4-Tab SPA)

The dashboard is a single-page application at `src/god-agent/observability/dashboard/` served by the Observability daemon. It uses SSE (Server-Sent Events) for real-time updates and Chart.js for visualizations.

### Tab 1: Overview
- **Health strip**: Daemon status, uptime, memory usage, SSE connection state
- **Active Pipeline**: Current pipeline progress display
- **Active Agents**: List with count badge
- **Metrics cards**: Tokens, Trajectories, Patterns, Episodes
- **Charts**: Token usage over time, quality score trends
- **Activity Stream**: Filterable event log (by component: Agents, Pipelines, Routing, Learning, UCM, IDESC, Episode, Hyperedge, Embedding, Daemon, Token Budget, Search, Memory; by status: Success, Error, Running, Info)

### Tab 2: Pipeline
- **Pipeline type filter**: All / God-Code (48 agents) / God-Research (PhD)
- **Phase Stepper**: Visual progress indicator for active pipeline phases
- **Agent Execution**: Real-time view of agent activity
- **Recent Pipelines**: History table with Pipeline name, Type, Status, Agent count, Duration, Quality Score

### Tab 3: Memory & Learning
- **SoNA Learning Metrics**: Trajectories (total/active/completed), Patterns (count, avg weight, success/fail ratio), doughnut chart
- **UCM & IDESC v2**: Episodes stored, context size, outcomes recorded, injection rate, negative warnings, threshold adjustments
- **Episode & Hyperedge**: Episodes linked, time index size, Q&A hyperedges, causal chains, loops detected, communities
- **LEANN Search Index**: Index size, indexed chunks, unique files, memory usage, files on disk, stores
- **Memory Inspector** (right panel): 5 sub-tabs:
  - InteractionStore (with domain search)
  - ReasoningBank
  - EpisodeStore
  - UCM Context
  - Hyperedge

### Tab 4: System
- **Daemon Health**: Status, uptime, events processed, memory usage
- **Token Usage**: Total/input/output tokens, request count
- **Databases**: Table showing each database's size and path
- **Agent Registry**: Total agents (280), categories (39), selections today, embedding dimension (1536)
- **Routing Decisions**: Recent agent routing decisions list

---

## 5. Coding Pipeline (God-Code)

The coding pipeline is a **7-phase, 48-agent orchestration system** for complex software development tasks, with an additional Sherlock forensic analysis phase.

### Architecture
- **Source**: `src/god-agent/core/pipeline/` (60+ TypeScript files)
- **Agent definitions**: `.claude/agents/coding-pipeline/` (51 agent markdown files)
- **Enforcement**: `god-code-enforcement-v2.sh` uses ClaudeFlow memory (`.swarm/memory.db`) for compaction-safe state tracking

### 7 Phases + Sherlock
| Phase | Agents | Purpose |
|-------|--------|---------|
| 1. Understanding | 1-6 | requirement-extractor, scope-definer, context-gatherer, research-planner, technology-scout, feasibility-analyzer |
| 2. Exploration | 7-10 | codebase-analyzer, pattern-explorer, dependency-manager, requirement-prioritizer |
| 3. Architecture | 11-15 | system-designer, component-designer, interface-designer, data-architect, security-architect |
| 4. Implementation | 16-27 | code-generator, type-implementer, api-implementer, service-implementer, data-layer-implementer, frontend-implementer, config-implementer, logger-implementer, error-handler-implementer, integration-architect, performance-architect, implementation-coordinator |
| 5. Testing | 28-35 | test-generator, unit-implementer, integration-tester, security-tester, coverage-analyzer, regression-tester, test-runner, test-fixer |
| 6. Optimization | 36-40 | performance-optimizer, code-quality-improver, final-refactorer, regression-detector, quality-gate |
| 7. Delivery | 41 | sign-off-approver |
| Sherlock | 42-48 | Forensic validation: adversarial analysis, case-file building, verification matrix, learning integration, verdict engine |

### Key Features
- **Write blocking**: Direct Write/Edit calls are BLOCKED until Phase 4 (6+ agents spawned)
- **DAG execution**: Dependencies between agents resolved via DAG builder
- **Quality gates**: Phase-specific quality gate definitions and validators
- **Truth protocol**: End-to-end verification with truth scoring
- **Constitution validation**: Ensures pipeline follows defined rules
- **LEANN context**: Code search integration for agent context enrichment
- **Sherlock forensic**: Post-pipeline adversarial analysis with verdict engine

---

## 6. PhD/Writing Pipeline

### God-Write System (in the current repo, not claudeflow-new)
The writing pipeline lives primarily in the current working repo's `src/god-agent/universal/` and includes:
- `write-pipeline-orchestrator.ts` -- Multi-step drafting orchestration
- Gold standard prompt building with style profile injection
- Inline validation (paragraph-by-paragraph generation with quality checks)
- Citation enforcement, author scrubbing, prose sanitization
- SmartRetrievalLayer for corpus-grounded writing

### PhD Phase 8 Execution (in claudeflow-new)
- **Skill**: `phd-phase8-execution`
- Uses Claude Code Task tool with **dynamic agents per chapter**
- Reads `phase8-prompts.json` generated by `phd-cli.ts finalize --prepare-for-claude-code`
- Sequential chapter execution with specialized agents (introduction-writer, literature-review-writer, methodology-writer, etc.)
- Memory namespace: `phd/{slug}/phase8`
- PhD pipeline bridge and orchestrator at `src/god-agent/core/pipeline/phd-pipeline-*.ts`

---

## 7. Market Terminal

A Bloomberg-inspired terminal for stock analysis located at `market-terminal/`.

### Architecture
- **Backend**: Python FastAPI (port 8000) with SQLite persistence
- **Frontend**: Node.js (port 3000) with keyboard-driven Bloomberg-style UI
- **MCP Integration**: 19 tools exposed via stdio for AI agent integration

### 6 Methodologies
| Methodology | Weight | Focus |
|-------------|--------|-------|
| Wyckoff | 20% | Accumulation/distribution phases, volume-price spread |
| Elliott Wave | 15% | Impulse and corrective wave patterns |
| ICT Smart Money | 20% | Order blocks, fair value gaps, liquidity sweeps |
| CANSLIM | 20% | O'Neil growth criteria with fundamentals |
| Larry Williams | 10% | Williams %R, COT positioning, seasonals |
| Sentiment | 15% | FinBERT/VADER news sentiment scoring |

### 19 MCP Tools
- **Data Retrieval (9)**: get_price, get_volume, get_fundamentals, get_options_chain, get_ownership, get_insider_activity, get_news, get_macro_calendar, get_macro_history
- **Analysis (7)**: run_wyckoff, run_elliott, run_ict, run_canslim, run_williams, run_sentiment, run_composite
- **Watchlist (3)**: watchlist_add, watchlist_remove, watchlist_list
- **Scan (1)**: scan_watchlist (filter by methodology signals)

### Data Sources
- Finnhub, FRED, yfinance, SEC EDGAR, JBlanked, Alpha Vantage (optional), CFTC COT
- Fallback chains: Finnhub -> yfinance for price data

### Panel Layout
4 resizable rows: Watchlist+Chart+Scores (50%), News+Fundamentals (22%), Ownership+Insider (18%), Macro Calendar (10%)

---

## 8. Daemon Services (5 Services)

Started by `scripts/god-agent-start.sh` (auto-invoked by SessionStart hook). All communicate via Unix sockets.

| Service | Socket/PID | Log File | Timeout | Purpose |
|---------|-----------|----------|---------|---------|
| Memory Server | `/tmp/god-agent-memory.sock` | `logs/memory-server.log` | 10s | In-memory data store for agent state |
| Core Daemon | `/tmp/godagent-db.sock` | `logs/core-daemon.log` | 10s | Database operations, event bus |
| UCM Daemon | `/tmp/godagent-ucm.sock` | `logs/ucm-daemon.log` | 10s | Unbounded Context Memory management |
| Pipeline Daemon | `/tmp/godagent-pipeline.sock` | `logs/pipeline-daemon.log` | 60s | Pipeline orchestration (includes UniversalAgent init + capability indexing) |
| Observability | PID file at `~/.god-agent/daemon.pid` | `logs/observability.log` | 3s | Dashboard + SSE event streaming |

### Features
- **Log rotation**: Keeps last 5 log files per service, rotates on startup, cleans files older than 7 days
- **Health checks**: Socket existence check for first 4 services, PID check for Observability
- **Stale socket cleanup**: Removes stale sockets before starting
- **Status scripts**: `god-agent-status.sh` (check), `god-agent-stop.sh` (shutdown), `god-agent-backup.sh` (data backup)

---

## 9. Learning System (SoNA Engine)

The **SoNA (Self-Optimizing Neural Adaptation) Engine** at `src/god-agent/core/learning/sona-engine.ts` implements trajectory-based learning for pattern weight adaptation.

### Core Concepts
- **Trajectories**: Track individual task execution paths with steps, outcomes, and timing
- **Patterns**: Learned behavioral patterns with weights that evolve based on success/failure feedback
- **Route Weights**: LoRA-style weight updates for routing decisions
- **Fisher Information**: Importance weighting for preventing catastrophic forgetting
- **Checkpoints**: Periodic state snapshots with rollback capability

### Performance Targets
- `createTrajectory()`: <1ms
- `getWeight()`: <1ms
- `getWeights()`: <5ms
- `provideFeedback()`: <15ms

### Components
- `sona-engine.ts` -- Main engine: trajectory lifecycle, weight management, feedback processing
- `trajectory-stream-manager.ts` -- Real-time trajectory streaming for monitoring
- `step-capture-service.ts` -- Captures individual reasoning steps within trajectories
- `sona-types.ts` -- Full type definitions including drift detection, checkpoints, rollback state
- `sona-utils.ts` -- Utility functions (ID generation, validation, serialization)

### Dashboard Integration
The Memory & Learning tab (Tab 3) displays: total/active/completed trajectories, pattern count, average weight, success/failure ratio, and a doughnut chart.

---

## 10. UCM (Universal Context Manager) & DESC

The UCM system provides **unbounded episodic memory** that persists across context compactions.

### UCM Architecture (`src/god-agent/core/ucm/`)
- **Daemon**: `daemon/ucm-cli.ts` -- Unix socket server for IPC
- **Context management**: `context/` -- Token-budget-aware context injection
- **Configuration**: `config.ts` -- UCM behavioral settings
- **Recovery**: `recovery/` -- State recovery after crashes
- **Token management**: `token/` -- Token budget tracking and optimization
- **Error handling**: `errors.ts` -- UCM-specific error hierarchy

### DESC (Dual Embedding Symmetric Chunking) (`src/god-agent/core/ucm/desc/`)
A sophisticated episodic memory system with:

- **SymmetricChunker**: RULE-064 compliant text chunking
- **DualEmbeddingStore**: Episode storage with dual embeddings (full + compressed)
- **EpisodeRetriever**: All-to-all retrieval with threshold filtering (RULE-066/069)
- **EmbeddingProxy**: HTTP client for the local gte-Qwen2-1.5B-instruct model
- **InjectionFilter**: Safety mechanisms to prevent harmful injection

### IDESC v2 (Intelligent DESC)
Enhanced with outcome tracking and confidence calculation:
- **OutcomeTracker**: Records and tracks success/failure outcomes per episode
- **ConfidenceCalculator**: Multi-factor confidence scoring
- **NegativeExampleProvider**: Provides counter-examples for improved learning
- **TrajectoryLinker**: Links episodes to SoNA trajectories for cross-system learning
- **ThresholdAdjuster**: Dynamic threshold adjustment based on outcome history
- **QualityMonitor**: Continuous quality monitoring of injected context

### Episode & Hyperedge Systems
- **EpisodeStore** (`src/god-agent/core/episode/`): Episodes with time indexing and linking
- **Hyperedge System** (`src/god-agent/core/hyperedge/`):
  - Q&A hyperedges: Link questions to answers across episodes
  - Causal chains: Track cause-effect relationships
  - Anomaly detection: Identify unusual patterns
  - Community detection: Cluster related episodes

---

# Part 2: How-To Guide

## How to Use the Persistent Memory System

### Starting a Session with Memory Context

When you start Claude Code in the project, the **SessionStart hooks fire automatically**:
1. Daemon services start (if not already running)
2. `memory-inject.sh` loads your personality, understanding, and briefing into context
3. UCM session is initialized

Then invoke `/start` explicitly for a full orientation:
```
/start
```
This will:
- Search MemoryGraph for the last 1-3 session summaries
- Show git status (uncommitted work)
- Display memory health (total memories, relationships, avg importance)
- Check RocketChat for new messages
- Suggest 1-3 next steps based on findings

### Searching Your Memory

Use `/recall` to search across all memory stores:
```
/recall authentication timeout handling
/recall XSS prevention patterns
/recall src/api/routes/watchlist.py
```
This runs three parallel searches:
1. MemoryGraph keyword search (exact terms, acronyms, file paths)
2. MemoryGraph fuzzy recall (conceptual/natural language queries)
3. LanceDB semantic vector search (finds related content even without keyword overlap)

Results are presented in labeled sections -- they are NOT merged or deduplicated since the stores return different data structures.

### Storing What You Learn

**After web research:**
```
/learn Zod schema validation patterns
```
This searches the web (max 3 queries), reads the best result, extracts 3-5 takeaways, and stores them in MemoryGraph tagged `self-learned` at importance 0.3. Budget: 3 per session.

**Without an argument:**
```
/learn
```
Auto-selects a topic based on knowledge gaps in your existing memory graph. Prioritizes technologies relevant to active projects.

### Recording Failures

After a debugging session or significant mistake:
```
/post-mortem the FalkorDBLite create_relationship was broken due to Cypher preamble format
```
This captures: symptom, debugging journey (each failed attempt), root cause, fix, and the key insight. Stored at importance 0.85 with relationships to related memories.

### Ending a Session

Before exiting:
```
/session-summary
```
This reflects on the session (what was done, key decisions, pending items) and stores a summary to MemoryGraph at importance 0.7 with tags like `session-summary`, project name, and date.

The Stop hook also automatically writes `last-session-summary.txt` and sets the consolidation-pending flag.

### Memory Maintenance

**Interactive maintenance:**
```
/memory-garden
```
Presents a menu with 8 options:
- a) Full consolidation (all 5 stages)
- b) Decay only (reduce importance on old memories)
- c) Find and merge duplicates
- d) Discover relationships
- e) Regenerate briefing
- f) Show consolidation cursor state
- g) Reconcile MemoryGraph vs LanceDB
- h) Drain pending-embeddings queue

**Automated maintenance:**
```
/loop 30m /memory-loop
```
Runs one consolidation stage every 30 minutes, cycling through: decay -> duplicates -> merge -> relationships -> briefing.

---

## How the Post-Task Memory Nudge Hook Works

After every `Task` tool invocation completes, three PostToolUse hooks fire:

1. **post-task.sh**: Wraps the TypeScript handler, runs performance analysis and decision storage with 5s timeout
2. **UCM post-task archive**: Archives the episode data from the subagent execution
3. **Memory nudge**: Simply outputs: `"[memory] Subagent complete. If key decisions or patterns were produced, store to MemoryGraph."`

This third hook is a **prompt injection** -- it appears in Claude's context as a reminder to persist important learnings. It does NOT automatically store anything; it nudges the agent to call `mcp__memorygraph__store_memory` when appropriate.

---

## How the Session Reminder Hook Works

The `memory-inject.sh` hook fires on every SessionStart and outputs to stdout (which becomes part of the system context):

1. **Personality** (`~/.claude/personality.md`, max 3000 chars): The agent's identity and behavioral rules
2. **Understanding** (`~/.claude/understanding.md`, max 3000 chars): User context and preferences
3. **Briefing** (`.persistent-memory/briefing.md`, max 2450 chars): Auto-generated top-K memories from the last consolidation

It also checks:
- FalkorDBLite patch integrity (warns if patches were overwritten)
- Previous session summary (reminds to store it if less than 24h old)
- Consolidation pending flag (reminds to run `/memory-garden` if overdue >24h)

All of this completes in <500ms since it reads only pre-computed files and makes no network/database calls.

---

## How to Use the New Dashboard Tabs

Start the observability dashboard (auto-started by SessionStart, or manually):
```bash
bash scripts/god-agent-start.sh
```

Navigate to the dashboard URL shown in the startup output (typically `http://localhost:3847` or the WSL IP address).

### Tab 1: Overview
Your "command center" view. Glance at:
- Health strip for daemon status
- Active pipeline progress
- Token/trajectory/pattern/episode counts
- Activity stream (filterable by component and status)

### Tab 2: Pipeline
Monitor coding or research pipelines:
- Filter by pipeline type (God-Code 48-agent or God-Research PhD)
- Watch the phase stepper advance through Understanding -> Exploration -> Architecture -> Implementation -> Testing -> Optimization -> Delivery
- See individual agent execution status
- Review pipeline history with quality scores

### Tab 3: Memory & Learning
The deepest tab -- monitors all memory subsystems:
- **SoNA metrics**: Are patterns improving? Check success/fail ratio
- **UCM/IDESC**: Is episodic injection working? Check injection rate
- **Episodes/Hyperedges**: How connected is the knowledge graph?
- **LEANN**: Is the code index up to date?
- **Memory Inspector**: Browse individual memory stores (InteractionStore, ReasoningBank, EpisodeStore, UCM Context, Hyperedge)

### Tab 4: System
Infrastructure monitoring:
- Daemon health and uptime
- Token usage (total, input, output, requests)
- Database sizes and paths
- Agent registry (280 agents across 39 categories)
- Recent routing decisions

---

## How to Leverage the Rocket.Chat Integration

### Setup
The `check-messages` skill works with the RocketChat MCP server. The channel `A.I.-Chat` is pre-configured.

### Usage
The `/start` skill automatically calls `/check-messages`. You can also invoke it directly:
```
/check-messages
```

It:
1. Reads last-read timestamp from `.persistent-memory/rocketchat-last-read.json`
2. Fetches up to 50 messages from the channel
3. Filters out your own messages (username: "archon")
4. Displays new messages with relative timestamps
5. Updates the last-read timestamp
6. Optionally responds to messages directed at you

**Silent behavior**: If there are no new messages, it produces no output at all.

---

## How Skills and Hooks Integrate Together

The system is designed as a layered architecture where hooks provide automatic plumbing and skills provide user-invoked intelligence:

### Session Lifecycle
```
SessionStart
  -> hook: clean-settings.sh (sanitize config)
  -> hook: god-agent-start.sh (start 5 daemons)
  -> hook: ucm-session-start.ts (init episodic memory)
  -> hook: memory-inject.sh (inject personality + briefing)
  -> skill: /start (MemoryGraph search + project state + suggestions)

During Session
  -> hook: pre-task (pipeline enforcement + UCM injection)
  -> hook: post-task (metrics + archive + memory nudge)
  -> hook: pre-edit (god-code enforcement + LEANN queue)
  -> hook: post-edit (formatting + LEANN indexing)
  -> skill: /recall, /learn, /post-mortem (manual memory ops)

Pre-Compact
  -> hook: reminds about agents, swarm strategies, golden rule

Session End
  -> skill: /session-summary (store structured summary to MemoryGraph)
  -> hook: Stop (pipeline cleanup + state save + UCM stop + memory-session-end)
```

### God-Code Pipeline Flow
```
1. User invokes /god-code
   -> PreToolUse:Skill hook activates pipeline enforcement
   -> Sets .claude/runtime/.god-code-active with count=0
   -> BLOCKS all Write/Edit/MultiEdit calls

2. Claude spawns Task agents
   -> PreToolUse:Task hook increments agent count
   -> Phase 1 (Understanding): 6 agents analyze the problem
   -> Phase 2 (Exploration): 4 agents explore codebase
   -> Phase 3 (Architecture): 5 agents design solution

3. At agent count >= 6, writes are UNBLOCKED
   -> Phase 4 (Implementation): 12 agents write code
   -> Phase 5 (Testing): 8 agents test
   -> Phase 6 (Optimization): 5 agents optimize
   -> Phase 7 (Delivery): 1 agent signs off

4. Sherlock Phase (42-48): Forensic validation
   -> Adversarial analysis, case-file building, verdict engine

5. Session ends
   -> Stop hook clears .god-code-active
```

### Memory Flow
```
Automatic (hooks):
  SessionStart -> inject briefing.md (pre-computed)
  Stop -> write consolidation-pending + last-session-summary.txt

Semi-automatic (skills with nudges):
  Post-task hook -> "[memory] store decisions" nudge
  /session-summary -> store summary to MemoryGraph

Manual (user-invoked):
  /recall -> search all stores
  /learn -> web research + store
  /post-mortem -> failure analysis + store
  /memory-garden -> consolidation cycle
  /memory-loop -> automated consolidation via /loop
```

---

## MCP Server Configuration

The system uses 5 MCP servers (configured via `enabledMcpjsonServers` in settings.json):

| Server | Transport | Purpose |
|--------|-----------|---------|
| `claude-flow@alpha` | npx stdio | Swarm orchestration, task coordination, memory, hooks |
| `ruv-swarm` | npx stdio | Additional swarm capabilities |
| `serena` | MCP | Code symbol navigation, file operations, memory |
| `memorygraph` | MCP | FalkorDBLite graph memory (11 tools) |
| `lancedb-memory` | MCP | LanceDB vector memory (8 tools) |

Additional MCP servers (market-terminal, rocketchat) can be added via Claude Desktop config or the project's `.claude/mcp.json`.

---

## Quick Reference: Key File Paths

| Component | Path |
|-----------|------|
| Settings (hooks, permissions, MCP) | `.claude/settings.json` |
| Skills | `.claude/skills/[name]/SKILL.md` |
| Hooks | `.claude/hooks/` |
| Agent definitions | `.claude/agents/` |
| Dashboard | `src/god-agent/observability/dashboard/` |
| LanceDB MCP server | `src/mcp-servers/lancedb-memory/server.ts` |
| SoNA Engine | `src/god-agent/core/learning/sona-engine.ts` |
| UCM/DESC | `src/god-agent/core/ucm/desc/` |
| Episode Store | `src/god-agent/core/episode/` |
| Hyperedge System | `src/god-agent/core/hyperedge/` |
| Coding Pipeline | `src/god-agent/core/pipeline/` |
| Daemon startup | `scripts/god-agent-start.sh` |
| Market Terminal | `market-terminal/` |
| Persistent memory data | `.persistent-memory/` |
| Memory briefing | `.persistent-memory/briefing.md` |
| Consolidation cursor | `.persistent-memory/consolidation-cursor.json` |
| Personality | `~/.claude/personality.md` |
| Understanding | `~/.claude/understanding.md` |
