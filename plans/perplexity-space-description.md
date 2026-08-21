# God Agent — Perplexity Space Description

---

## Space Name

**God Agent: Universal Self-Learning AI System**

---

## Space Description (Short — for subtitle/tagline)

A neuro-symbolic AI orchestration framework with trajectory-based self-learning, 197 specialized agents, corpus-grounded academic writing, and continuous improvement through EWC++ regularization. Built for PhD-level research, code generation, and document composition.

---

## Space Instructions / System Prompt

You are a knowledge assistant for the **God Agent** system — a Universal Self-Learning AI framework built as a TypeScript monolith (~357,000 lines of code) that orchestrates 197 specialized AI agents across 24 categories. The system runs on WSL2 (Linux on Windows) and integrates local GPU inference (vLLM with Qwen2.5-Coder-32B), embedding models (gte-Qwen2-1.5B), ChromaDB vector storage, and the Anthropic Claude API for academic writing.

Use the following comprehensive system description to answer questions accurately. When users ask about architecture, capabilities, commands, or implementation details, draw from this reference. If something is not covered here, say so rather than speculate.

---

## Full System Description (Knowledge Base Content)

### 1. What is the God Agent?

The God Agent is a **Universal Self-Learning AI System** — a unified interface that handles coding, research, academic writing, and general question-answering through a single CLI and daemon architecture. What distinguishes it from standard AI tooling is its **trajectory-based learning loop**: every interaction is recorded as a trajectory, user feedback reinforces or weakens learned patterns, and an EWC++ (Elastic Weight Consolidation++) regularization mechanism prevents catastrophic forgetting as the system accumulates knowledge over time.

The system is not a wrapper around a single LLM. It is an **orchestration framework** that:

- **Selects** the best specialist agent for each task via DAI-001 (Dynamic Agent Integration)
- **Retrieves** relevant corpus material from a ChromaDB vector database using hybrid semantic + keyword search
- **Generates** text constrained to verified sources through an 11-stage composition pipeline
- **Validates** output through a 7-stage Quality Gauntlet (citation verification, argument coherence, style consistency, factual accuracy)
- **Learns** from every interaction through SoNA (Self-Organizing Neural Architecture) trajectory tracking
- **Remembers** successful patterns via episodic memory (DESC — Dual Episodic Store with Chunking)

The project is a single TypeScript codebase comprising approximately 767 TypeScript files and 357,000 lines of code, organized into 11 major subsystems.

---

### 2. Architecture Overview

The God Agent is composed of the following major subsystems:

#### Core Orchestration Layer
- **UniversalAgent** (`universal-agent.ts`) — The single entry point. Exposes `ask()`, `code()`, `research()`, `write()`, `learn()`, `feedback()`, and `query()` methods. Auto-detects task mode from input text (code keywords trigger coding mode, research keywords trigger research mode, etc.).
- **CLI** (`cli.ts`) — Command-line interface supporting 15+ commands with aliases (`ask`/`a`, `code`/`c`, `write`/`w`, `research`/`r`, `status`/`s`, `learn`/`l`, `feedback`/`f`, `query`/`q`, `code-feedback`/`cf`, `auto-complete-coding`/`acc`, `batch-learn`/`bl`, etc.).
- **DAI-001 Agent Selector** — Dynamically selects the best specialist agent from a registry of 197 agents organized into 24 categories. Agent definitions are stored as YAML-frontmatter Markdown files in `.claude/agents/`.
- **DAI-002 Pipeline Executor** — Sequential multi-agent orchestration. Enforces RULE-004: agents execute ONE AT A TIME (never parallelized via `Promise.all()`). Each agent receives the accumulated context from previous agents via Relay Race Memory (RLM).

#### Learning & Reasoning Layer
- **SoNA Engine** (Self-Organizing Neural Architecture) — Trajectory-based learning with EWC++ regularization. Every user interaction creates a trajectory (a path through the system capturing patterns, context, and reasoning steps). User feedback (0.0–1.0 quality score) adjusts pattern weights. Fisher Information matrices prevent catastrophic forgetting — the system can learn new patterns without degrading performance on previously learned tasks. Performance targets: <1ms trajectory creation, <15ms feedback processing.
- **ReasoningBank** — Unified reasoning orchestrator supporting 4 primary modes and 8 specialized engines:
  - **Pattern-Match** (<10ms) — Template-based reasoning from historical patterns
  - **Causal-Inference** (<20ms) — Graph-based cause-effect reasoning using a CausalHypergraph
  - **Contextual** (<30ms) — GNN-enhanced semantic similarity
  - **Hybrid** (<30ms) — Weighted combination of all modes
  - Specialized engines: Abductive, Adversarial, Analogical, Constraint, Counterfactual, Decomposition, First-Principles, Temporal
- **Provenance Store** — Tracks evidence sources with L-Score (a confidence metric for how well-supported a conclusion is by its evidence chain).

#### Writing & Composition Layer
- **ICP Orchestrator** (Interactive Composition Pipeline) — An 11-stage pipeline for corpus-grounded academic writing:
  1. Prompt decomposition into facets
  2. Retrieval of quote spans with provenance
  3. Canonicalization and ranking
  4. Tiered verification (auto/flagged/rejected)
  5. Writing contract with facet-level strictness
  6. Claim decomposition into ClaimAtoms
  7. Atom binding to retrieved quotes + stress testing
  8. Paragraph planning → validation → generation → drift check
  9. Deterministic review
  10. Claim-locked polish
  11. Run manifest export

- **WritePipelineOrchestrator** — The practical writing pipeline used by the CLI. Includes:
  - Corpus retrieval via SmartRetrievalLayer
  - Corpus constraint building (whitelist of allowed sources from manifest)
  - Inline validation (paragraph-by-paragraph generation with citation checking)
  - Multi-step drafting (v1 draft → local investigation → v2 with prevention plan)
  - Citation enforcement and non-corpus author scrubbing
  - Prose sanitization (removes LLM meta-text leaks, duplicate sections, planning artifacts)
  - Endnote generation

- **Quality Gauntlet** — 7-stage validation pipeline:
  1. Citation Verifier — checks sources exist in corpus manifest
  2. Toulmin Enforcer — validates argument structure (claim, evidence, warrant)
  3. Argument Coherence — detects logical gaps
  4. Citation Completeness — ensures all claims are cited
  5. Citation Density — checks citation frequency meets thresholds
  6. Style Consistency — verifies adherence to learned writing style
  7. Factual Accuracy — detects claims contradicted by corpus

- **Style Learning** — Learns writing style from PDF documents. Extracts: average sentence length (e.g., 31.24 words), long-sentence ratio (51.6%), passive voice ratio (20.1%), formality score (0.64), characteristic transitions ("thus", "specifically", "indeed", "accordingly", "hence"), citation integration patterns (author-prominent with verbs like "observes", "argues", "suggests"), and tone. Stored as a reusable style profile that is injected into all generation prompts.

#### Retrieval & Knowledge Layer
- **SmartRetrievalLayer** — Multi-layer corpus retrieval with:
  - Hybrid search (semantic embeddings + keyword matching)
  - LRU query caching (1,000 queries, 30-minute TTL)
  - Parallel retrieval (5 concurrent queries)
  - Cross-encoder re-ranking
  - Source diversity enforcement (per-source caps, relevance-first selection)
  - Intelligent chunk trimming (92% size reduction preserving quotations, page refs, key terms)
  - Attention-optimized chunk reordering (highest relevance at start/end of prompt)
- **ChromaDB** — Vector database on port 8001 storing ingested corpus chunks
- **Embedding API** — gte-Qwen2-1.5B-instruct on port 8000 (1536-dimensional vectors)
- **Corpus Manifest** — `manifest.jsonl` containing all ingested scholarly sources. Citations MUST match entries in this manifest.
- **LEANN** — Semantic code search index for codebase navigation

#### Memory & Context Layer
- **DESC** (Dual Episodic Store with Chunking) — Episodic memory system that stores query/answer pairs with dual embeddings (separate embeddings for the question and the answer). Retrieves relevant past episodes to inject into new interactions. Tracks outcome success/failure per episode to avoid re-injecting low-quality patterns. Includes a negative example provider that warns about historically unsuccessful approaches.
- **UCM** (Unbounded Context Management) — Daemon-based context management with:
  - Token budget ratios by content type (prose=1.3x, code=1.5x, tables=2.0x, citations=1.4x)
  - Progressive summarization (rolling window sizes per pipeline phase)
  - Recovery service after context compaction
  - Health monitoring

#### Coding Pipeline
- **48-Agent PhD Pipeline** — A phased coding pipeline with 8 phases:
  - Phase 0: Initialization (topic analysis, corpus preparation)
  - Phase 1: Research Foundation (literature review, source analysis)
  - Phase 2: Knowledge Synthesis (extract concepts, build knowledge graph)
  - Phase 3: Argument Development (thesis building, claim structuring)
  - Phase 4: Writing & Composition (section generation with citations)
  - Phase 5: Validation & Refinement (peer review simulation)
  - Phase 6: Final Polish (style, grammar, formatting)
  - Phase 7: Delivery Preparation (export, archival)
  - Includes topological dependency resolution, quality gates at each phase, checkpoint save/restore, and the Sherlock verification engine (9 components for forensic code verification).

- **CodingPipelineOrchestrator** — Separate code-specific pipeline with phase execution, dependency resolution, and coding-specific quality gates.

#### Observability & Dashboard
- **Express Server** on port 3847 — HTTP + WebSocket for real-time monitoring
- **ICP Panel** — Visualizes writing pipeline stages, quality gate results, retrieval statistics
- **Agent Tracker** — Per-agent execution metrics
- **Pipeline Tracker** — Pipeline execution progress and phase status
- **Activity Stream** — Timeline of all system activities
- **Event Store** — Persistent event storage for post-hoc analysis

#### Hook System
- **Pre/Post Tool Hooks** — Intercept before and after tool execution
  - `auto-injection` — Inject DESC episodes automatically
  - `quality-assessment-trigger` — Trigger quality checks
  - `task-result-capture` — Capture trajectory data for SoNA learning
- Priority levels: VALIDATION (10) → INJECTION (20) → LOGGING (30) → CAPTURE (40) → POST_PROCESS (60) → CLEANUP (90)

---

### 3. Service Architecture

The God Agent runs as a set of coordinated services, typically managed via tmux:

| Service | Port | Technology | Purpose |
|---------|------|------------|---------|
| **vLLM** | 8002 | Qwen2.5-Coder-32B-Instruct-AWQ | Local LLM inference for coding tasks and OCR repair |
| **Embedding API** | 8000 | gte-Qwen2-1.5B-instruct | Text embedding for semantic search (1536D vectors) |
| **ChromaDB** | 8001 | ChromaDB | Vector database for corpus chunk storage |
| **Memory Server** | — | AgentDB + DESC | Episodic memory and knowledge persistence |
| **Core Daemon** | — | Node.js | Main God Agent daemon (depends on embedding service) |
| **UCM Daemon** | — | Node.js | Unbounded Context Management (depends on daemon + embedding) |
| **Observability** | 3847 | Express + WebSocket | Dashboard and real-time monitoring |

**Startup order** (dependency-aware):
1. vLLM (no dependencies)
2. Embedding API (no dependencies, but must start before daemon/UCM)
3. Memory Server (no dependencies)
4. Core Daemon (depends on memory + embedding)
5. UCM Daemon (depends on daemon + embedding)
6. Observability (depends on daemon)

**Launch profiles**:
- `minimal` — memory + daemon only
- `dev` — all services (default)
- `prod` — all services + production settings
- `research` — all services + PhD pipeline mode

**LLM Routing Rule**: All academic writing routes to Anthropic Claude (high cost tier). vLLM (Qwen Coder) is restricted to coding tasks and OCR repair only.

---

### 4. CLI Commands Reference

#### Primary Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `ask <text>` | `a` | Ask anything — auto-detects mode via DAI-001 |
| `code <task>` | `c` | Generate code with pattern learning |
| `research <query>` | `r` | Deep research via PhD pipeline |
| `write <topic> [flags]` | `w` | Write documents with corpus integration |
| `status` | `s` | Show system status and learning stats |
| `learn <content>` | `l` | Store knowledge (text or `--file` path) |
| `query <search>` | `q` | Search stored knowledge by domain/tags |
| `feedback <id> <rating>` | `f` | Provide quality feedback (0.0–1.0) for trajectory learning |

#### Specialized Commands

| Command | Alias | Description |
|---------|-------|-------------|
| `code-feedback <trajectoryId>` | `cf` | Code-specific feedback with quality analysis |
| `auto-complete-coding` | `acc` | Auto-complete orphaned coding trajectories |
| `batch-learn` | `bl` | Batch process pending knowledge items |
| `verify-feedback <id>` | `vf` | Verify feedback was properly recorded |
| `feedback-health` | `fh` | Diagnostic check of feedback system health |
| `code-pipeline <task>` | — | Execute full coding pipeline |

#### Router Commands (lightweight, no agent init)

| Command | Description |
|---------|-------------|
| `analytics` / `dashboard` | Performance analytics |
| `costs` / `cost` | Token and API cost tracking |
| `quality` | Quality metrics |
| `budget` | Budget status |
| `reviews` / `review` | Code review metrics |
| `routing` / `route` | Routing diagnostics |

#### Write Command Flags

The `write` command supports extensive configuration:

| Flag | Description |
|------|-------------|
| `--style <type>` | academic, professional, casual, technical |
| `--length <size>` | short, medium, long, comprehensive |
| `--format <type>` | essay, report, article, paper |
| `--style-profile <id>` | Use a learned style profile |
| `--use-corpus` | Enable corpus retrieval for grounding |
| `--whitelist` | Source constraint mode (gold standard) |
| `--corpus-chunk-count <n>` | Number of chunks to retrieve (default: 15 or 28 in whitelist mode) |
| `--execute` | Execute full pipeline (not just prepare) |
| `--multi-step` | Enable v1→investigate→v2 drafting pipeline |
| `--use-inline-validation` | Paragraph-by-paragraph validation |
| `--enable-endnotes` | Generate endnotes with quotation fidelity |
| `--pipeline-version v2` | Use v2 staged composition pipeline |
| `--data-source-mode <mode>` | corpus, hybrid, or external |
| `--verify-sources` | Verify all cited sources exist |

---

### 5. Claude Code Slash Commands

The God Agent integrates with Claude Code (Anthropic's CLI) through slash commands:

| Command | Purpose |
|---------|---------|
| `/god-ask` | Route questions through DAI-001 agent selection |
| `/god-code` | Generate code using the 48-agent pipeline |
| `/god-write` | Academic writing with full style injection and Quality Gauntlet |
| `/god-research` | Deep research using PhD pipeline with 45 specialized agents |
| `/god-research-local` | Local-only research (no web tools, corpus only) |
| `/god-research-grounded` | Grounded research (corpus as ground truth + external enrichment) |
| `/god-research-hybrid` | Local-first research with conditional external supplementation |
| `/god-learn` | Store knowledge in the learning system |
| `/god-learn-update` | Run compile + query-conditioned retrieval & promotion |
| `/god-learn-compile` | Run Phase 1–3 substrate compilation |
| `/god-learn-style` | Learn writing style from PDF documents |
| `/god-learn-verify` | Verify god-learn artifacts (ingest + knowledge + assembly) |
| `/god-status` | Show system status and learning statistics |
| `/god-style-status` | Show available style profiles |
| `/god-feedback` | Provide trajectory feedback for learning improvement |
| `/god-launch` | Start, stop, or manage God Agent services |
| `/god-pdf-analyze` | Analyze PDFs using auto/manual/hybrid modes |
| `/god-complete-section` | Complete a dissertation section with full context and style |
| `/god-synthesize-chapters` | Synthesize two chapters into one without reducing word count |

---

### 6. Key Design Principles

1. **Corpus Grounding** — All academic writing is constrained to sources that exist in the ingested corpus manifest. The system will not hallucinate citations. A whitelist of allowed authors is built from the corpus, and a post-generation author scrubber removes any sentences that reference non-corpus authors.

2. **Trajectory-Based Learning** — Every interaction creates a SoNA trajectory. Feedback reinforces successful patterns. EWC++ prevents catastrophic forgetting. The system genuinely improves on repeated tasks (measured +26% improvement).

3. **Sequential Agent Execution** — Multi-agent pipelines run agents one at a time (RULE-004). Each agent receives the accumulated context from all previous agents. This prevents context corruption and ensures deterministic execution order.

4. **Quality Over Speed** — The 7-stage Quality Gauntlet, inline validation, multi-step drafting, and citation enforcement prioritize output quality. Academic writing uses the highest-cost LLM tier (Anthropic Claude) while coding tasks use local inference (vLLM).

5. **Fail-Safe Defaults** — When components fail (embedding service down, ChromaDB unavailable), the system degrades gracefully. DESC injection is best-effort (wrapped in try/catch with silent fallback). The quality gauntlet can be bypassed when stages return defaults.

6. **Style Fidelity** — Learned style profiles capture quantitative writing characteristics (sentence length distributions, passive voice ratios, transition preferences, citation integration patterns) and inject them into every generation prompt, producing output that matches the user's established voice.

---

### 7. Technical Stack

- **Language**: TypeScript (Node.js, compiled with tsx)
- **LLM Providers**: Anthropic Claude API (academic writing), vLLM with Qwen2.5-Coder-32B-Instruct-AWQ (coding/OCR)
- **Embedding**: gte-Qwen2-1.5B-instruct (1536 dimensions)
- **Vector Database**: ChromaDB
- **Knowledge Storage**: AgentDB, SQLite (trajectories, episodes, patterns), JSONL (knowledge units, corpus manifest)
- **Process Management**: tmux sessions via god-launch script
- **Platform**: WSL2 (Linux on Windows) with NVIDIA GPU for local inference
- **Observability**: Express + WebSocket dashboard on port 3847
- **Integration**: Claude Code CLI with custom slash commands and agent definitions

---

### 8. What the God Agent Is NOT

- It is **not a chatbot** — it is an orchestration framework that selects and coordinates specialist agents.
- It is **not a RAG wrapper** — it has a full 11-stage composition pipeline with claim decomposition, stress testing, and deterministic review.
- It is **not stateless** — it maintains episodic memory (DESC), learned patterns (SoNA), style profiles, and knowledge units across sessions.
- It is **not a single model** — it routes between Anthropic Claude and local vLLM based on task type, with different cost tiers and timeout configurations.
- It does **not hallucinate citations** — corpus grounding, whitelist constraints, citation verification, and post-generation author scrubbing enforce source fidelity.
