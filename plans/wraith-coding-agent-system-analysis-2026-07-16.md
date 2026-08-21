# WRAITH Coding-Agent System — Goal, Design, and Current State

**Date:** 2026-07-16
**Author:** Investigation on PROTEUS (RTX 5090); target system on WRAITH (192.168.50.22, 2× RTX 3090)
**Status:** Descriptive + diagnostic analysis. No changes made to the running system.
**Evidence base:** Live inspection of WRAITH over SSH — process table, `docker ps`, `nvidia-smi`,
`ss` listeners, vLLM launch commands, `~/coding-agent-stack/litellm-config.yaml`,
`~/.openhands/{config.toml,settings.json}`, `~/coding-agent-stack/openhands-skills-audit.md`,
and agent-server container logs.

---

## 0. Executive summary

WRAITH — formerly the 2×RTX 3090 drafting/verification/NLI worker node of the *aristotle-prime*
dissertation pipeline — has been repurposed into a **local, self-hosted AI coding-agent stack**.
The intent is a "primary executes, secondary reviews" pattern with a different code model on each
GPU. In practice the stack is built on **OpenHands** as the agent runtime, **LiteLLM** as a model
gateway, and **two vLLM servers** (one per GPU). Its first real workload is remediating `cargo
clippy` findings in the `archon-cli-fcdp` Rust workspace.

The "severe issues that did not exist before" are real and, on the evidence, largely **structural
to this design rather than incidental bugs**:

1. **The two-model review design is not actually wired.** OpenHands is configured to use
   `coder-primary` only; its critic/verification feature is **disabled** (`critic_enabled: false`,
   `critic_model_name: null`). The second model (`coder-adversary`, Codestral-22B) is loaded and
   consuming ~20 GB of a whole 3090, but **nothing routes review work to it.**
2. **A hard 32,768-token context ceiling** on both models collides with OpenHands' heavy system
   prompt (agent scaffolding + 56 injected skills + an LLM security analyzer). Per-turn usage was
   measured at **32,403 / 32,768** — essentially zero headroom — which is what makes conversations
   stall.
3. **Architectural impedance mismatch.** OpenHands is a heavyweight, Claude/cloud-shaped agent
   platform (per-conversation Docker sandboxes, webhooks, an embedded VS Code server, and
   Anthropic-only LLM params) pointed at a small local model. Many settings are inert or actively
   fighting the runtime.
4. **Operational fragility.** ~15 agent-server sandbox containers have started and died in the last
   ~19 hours (SIGTERM churn plus a `set is not JSON serializable` webhook crash), and durable config
   fixes require hand-hacking bind-mounts into ephemeral containers.

Contrast with why *aristotle-prime worked*: it never ran an open-ended agent loop. It exchanged
**bounded, single-shot request/response messages** over NATS (draft → verify → synthesize), so
context never grew without bound and there was no per-turn ceiling to hit. The coding pivot threw
that model away and adopted a fundamentally different (and much heavier) execution style.

The user's own instinct — **skip OpenHands; put archon-cli (which already speaks local
OpenAI-compatible endpoints) on WRAITH and let the god-agent/archon systems talk over the existing
NATS-style substrate** — is architecturally sound and is evaluated in §6.

---

## 1. The goal

**Turn WRAITH into a networked code-development-and-review agent** that runs entirely on local GPUs,
so coding/refactoring/review tasks (starting with the archon-cli Rust codebase) can be dispatched to
it the way drafting/verification tasks were dispatched to it under aristotle-prime — without paying
for or depending on a cloud model for the bulk work.

Concretely, the desired properties are:

- **Two specialized coding models, one per 3090:** a *primary* that executes the task (edits code,
  runs builds/tests) and a *secondary/adversary* that reviews the primary's output.
- **Networked/outsourced:** the task originates elsewhere (the god-agent / archon-cli on PROTEUS)
  and WRAITH does the GPU-bound inference and iteration.
- **Local-first / no cloud dependency** for the coding work.
- **Reuse of the WRAITH hardware** that previously served Marker OCR (earlier era) and then
  aristotle-prime drafting/verification/DeBERTa-NLI.

## 2. How it is *intended* to function

The intended loop (as described, and as the two-model server layout implies):

1. A coding task (e.g. "fix these clippy findings in archon-cli") is handed to WRAITH.
2. The **primary** model works the task inside a sandbox: reads the repo, edits files, runs
   `cargo`/`clippy`, iterates.
3. The **secondary/adversary** model reviews the primary's diff/output (correctness, quality,
   reuse/simplification) and feeds findings back for another iteration.
4. This repeats until the task passes review, then the change is committed/PR'd.

This is a direct conceptual descendant of aristotle-prime's **draft → verify** split (primary drafts
a section, a verification worker + DeBERTa NLI checks it), re-aimed at code.

## 3. The means — how it is *actually* built

Everything below runs on WRAITH (`192.168.50.22`). The stack lives in `~/coding-agent-stack/`
(an install tree with logs and two Python venvs — **not** a git repo).

### 3.1 Model-serving layer (the two GPUs)

Two `vllm serve` processes, both from `~/coding-agent-stack/.venv-stable`:

| Role | Model | Port | Key flags | GPU use |
|---|---|---|---|---|
| `coder-primary` (executor) | `Qwen/Qwen2.5-Coder-14B-Instruct-AWQ` | 8010 | `--max-model-len 32768 --kv-cache-dtype fp8 --max-num-seqs 1 --enforce-eager --enable-auto-tool-choice --tool-call-parser hermes --gpu-memory-utilization 0.85` | GPU0 ~21.9/24 GB |
| `coder-adversary` (reviewer) | `TechxGenus/Codestral-22B-v0.1-AWQ` | 8011 | `--max-model-len 32768 --enforce-eager --gpu-memory-utilization 0.90` (no tool-call parser) | GPU1 ~20.5/24 GB |

Notes: both GPUs are effectively full. The primary is served with `max-num-seqs 1` (one concurrent
request) and fp8 KV cache to fit context. The adversary is served **without** a tool-call parser, so
it could not drive an agentic tool loop even if asked to.

### 3.2 Gateway layer

**LiteLLM** (`~/coding-agent-stack/.venv-litellm`, listening on **:8000**, `master_key
sk-wraith-gateway`) presents the two vLLM servers as a single OpenAI-compatible endpoint with model
names `coder-primary` and `coder-adversary`. Config: `~/coding-agent-stack/litellm-config.yaml`.

### 3.3 Agent-runtime layer

**OpenHands**, in two container tiers:

- **`openhands-app`** (`docker.openhands.dev/openhands/openhands:1.8`) — the control plane/UI on
  **:3000**, driven from a browser client (seen at `192.168.50.89`).
- **`oh-agent-server`** (`ghcr.io/openhands/agent-server:1.26.0-python`) — a **per-conversation
  sandbox container**, spawned fresh for each task, each exposing an agent server (:8000 internal),
  an openvscode-server (:8001), and mapped to random high host ports. The active one is working in
  `/workspace/project/archon-cli-fcdp`.

**OpenHands agent config** (`~/.openhands/config.toml`, `~/.openhands/settings.json`):

- Agent: `CodeActAgent`; single LLM = `openai/coder-primary` via
  `http://host.docker.internal:8000/v1` (i.e. through LiteLLM → vLLM primary).
- `native_tool_calling: false` (parses tool calls from text — despite the vLLM primary being
  launched *with* a hermes tool-call parser).
- `condenser: llm_summarizing` (max_size 240, keep_first 2, hard-context-reset) — a summarization
  band-aid for the small context window.
- `security_analyzer: "llm"` — an *extra* LLM call to vet each action (more tokens/latency on an
  already-starved window).
- `max_iterations: 500`.
- `verification.critic_enabled: false`, `critic_model_name: null`, `enable_iterative_refinement:
  false` — **the review/critic path is off.**
- Exactly one LLM profile: `wraith-coder-primary` (active). No profile references the adversary.
- Several **Anthropic-only** params are set and inert here: `extended_thinking_budget: 200000`,
  `reasoning_effort: high`, `enable_encrypted_reasoning: true`, `prompt_cache_retention: 24h`
  (mostly dropped via `drop_params`/`modify_params`).

### 3.4 The "review" that actually exists

Not a second model. "Review" is present only as **OpenHands skills** — `code-review` and
`code-simplifier` (Claude-Code-derived skill text describing reuse/quality/efficiency sub-reviews) —
which are prompt instructions executed by the **single primary model**. There is no adversarial
second-model pass.

### 3.5 Supporting pieces

- `~/coding-agent-stack/openhands-skills-override/index.js` — a hand-trimmed 12-skill catalog
  bind-mounted (via OpenHands' `SANDBOX_VOLUMES`) over the generated 56-skill catalog in every new
  sandbox, to cut system-prompt bloat.
- `~/.humming/` (cache/tmp) and a stray `clipdog-qdrant-1` Qdrant container are also present
  (peripheral; not central to the loop).

## 4. What currently exists (inventory)

- ✅ Two local coding models served on the two 3090s via vLLM, fronted by a LiteLLM gateway.
- ✅ OpenHands control plane (:3000) + per-conversation Docker sandboxes with a working repo checkout
  (`archon-cli-fcdp`) and an embedded editor.
- ✅ A real first workload defined: archon-cli `clippy` remediation.
- ✅ A skills audit + durable skills-trim mechanism (56 → 12) documented in
  `~/coding-agent-stack/openhands-skills-audit.md`.
- ⚠️ **Missing:** any wiring from OpenHands to the adversary model; any real two-model review loop;
  any orchestration from the god-agent/archon-cli on PROTEUS (the task is currently driven by hand
  through the OpenHands UI, not "outsourced" from god-agent).
- ⚠️ **Not** a version-controlled/reproducible deployment — it is an install tree assembled with
  several venvs and logs.

## 5. Current state — what's actually happening

- **Both GPUs pinned near full**, one model each. The adversary's ~20 GB is spent for no functional
  return.
- **Conversations stall at the context ceiling.** Measured per-turn usage 32,403 / 32,768. The
  skills trim buys ~6k tokens/turn of guaranteed headroom (and much more worst-case), but the
  ceiling itself (32,768) is unchanged and remains the binding constraint for any non-trivial
  agentic task.
- **Sandbox churn / instability.** ~15 `oh-agent-server` containers have exited in ~19 hours. Exit
  causes seen: `143` (SIGTERM — the app tearing down/recreating sandboxes) and `255` following a
  repeated webhook error: `Failed to post events to webhook … Object of type set is not JSON
  serializable`. Each new sandbox reloads all 56 public skills before the override applies.
- **Config is fighting the runtime:** native tool-calling disabled while the server offers it; an
  extra LLM security analyzer per step; Claude-only params sent to a Qwen model; a summarizing
  condenser papering over the window. Each adds latency/tokens or is simply inert.

## 6. Assessment — is the approach flawed, and what are the paths?

### 6.1 Why this is harder than aristotle-prime was

aristotle-prime succeeded on the *same hardware* because its unit of work was a **bounded
request/response message** over NATS/JetStream: draft one section, verify one claim, return. Context
per call was small and fixed; there was no growing conversation, no per-turn ceiling, no Docker
sandbox per task, no 56-skill system prompt. The coding pivot replaced that with an **open-ended
agentic loop** (CodeAct: read→edit→run→observe→repeat, carrying a growing history) hosted by a
platform designed around large-context cloud models. On a 14B model capped at 32K, that loop is
starved almost immediately. The regression is structural, not a tuning bug.

### 6.2 Specific design flaws

1. **The headline feature (primary executes / secondary reviews) is unimplemented.** A whole 3090 is
   committed to a model nothing calls. Any perceived "review" is the primary reviewing itself via
   skill text.
2. **32K context + heavyweight harness** is the core stall mechanism. You cannot skill-trim your way
   out of a ceiling that a single large diff + tool output can exceed on its own.
3. **OpenHands is a large surface to own** (app + agent-server images, webhooks, sandbox lifecycle,
   skills catalog generation, VS Code server) for what is, here, "run a local model in a loop." Most
   of its cloud-shaped machinery is dead weight or friction against a local model.
4. **It duplicates infrastructure you already have and trust** — a NATS request/response fabric
   (aristotle-prime) and a code-native tool (archon-cli) that already targets local OpenAI-compatible
   endpoints and is literally the repo under repair.

### 6.3 The user's alternative (recommended direction to evaluate)

**Put archon-cli on WRAITH and let the god-agent/archon systems talk, reusing the aristotle-prime
outsourcing pattern.** This is the stronger architecture for these reasons:

- **Reuses a proven substrate.** The draft→verify split already implements "primary produces,
  secondary checks" as two NATS subjects with bounded messages. The coding version is
  **execute → review** as two subjects — the exact shape that already worked, now with
  `coder-primary` and `coder-adversary` as the two model endpoints. The two-model design becomes
  *real* and *explicit* instead of aspirational.
- **archon-cli already speaks local models.** Its `config.toml` documents OpenAI-compatible /
  Ollama base-URL model providers; pointing it at LiteLLM (`:8000`) or the vLLM servers directly is
  a config change, not a new platform.
- **Bounded context by construction.** If orchestration hands each model a scoped request (a file or
  a single clippy finding + the relevant span) and collects a scoped response, the 32K window stops
  being the binding constraint — no runaway agentic history.
- **One mental model, one set of tools** to operate and debug, versus a third agent framework
  running in parallel.

**Honest caveats to weigh, not ignore:**

- archon-cli today is oriented to research/drafting/evidence-curation. It is **not yet a
  code-editing agent** — it has no built-in apply-diff / run-cargo / iterate loop. Adopting this
  path means **building the coding-agent loop** (tool calls for edit + build + test, and the
  execute↔review handshake) on top of archon-cli/god-agent, rather than getting it "for free."
- OpenHands' one genuine advantage is that the agent loop, sandboxing, and tool execution already
  exist. The trade is: **OpenHands = free loop, permanent impedance mismatch** vs. **god-agent/archon
  = you build the loop, but on infrastructure you own, reuse, and control.**

### 6.4 If OpenHands is kept short-term (mitigations, not endorsement)

- Raise the model context window materially (the 14B/AWQ can go well beyond 32K on a 3090 with fp8
  KV cache) — without headroom above the harness's baseline, nothing else matters.
- Either **wire the adversary as the OpenHands critic** (`critic_enabled: true` +
  `critic_model_name`/`critic_server_url` → `coder-adversary`) so the second GPU earns its keep, or
  **shut the adversary down** and give both GPUs (tensor-parallel) to a single larger-context
  primary.
- Turn off the LLM `security_analyzer` for a trusted local repo; reconsider `native_tool_calling`
  to match the server's hermes parser; drop the inert Anthropic-only params.
- Fix or work around the webhook `set is not JSON serializable` crash driving sandbox churn.

---

## 7. Reference — key coordinates

- **WRAITH:** `192.168.50.22`, 2× RTX 3090 (24 GB each). Cluster peers: PROTEUS (RTX 5090, this
  box), FENRIR (`192.168.50.251`, NATS/Qdrant/embeddings).
- **Stack root:** `~/coding-agent-stack/` on WRAITH (venvs `.venv-litellm`, `.venv-stable`).
- **Endpoints:** vLLM primary `:8010`, vLLM adversary `:8011`, LiteLLM gateway `:8000`
  (`sk-wraith-gateway`), OpenHands app `:3000`.
- **Models:** primary `Qwen/Qwen2.5-Coder-14B-Instruct-AWQ`; adversary
  `TechxGenus/Codestral-22B-v0.1-AWQ`. Both `max-model-len 32768`.
- **OpenHands config:** `~/.openhands/config.toml`, `~/.openhands/settings.json`; skills audit
  `~/coding-agent-stack/openhands-skills-audit.md`; skills override
  `~/coding-agent-stack/openhands-skills-override/index.js`.
- **Current workload:** `cargo clippy` remediation on `archon-cli-fcdp`.
