# Stream Deck MCP Integration Report

> **Date:** 2026-04-04 | **Status:** ANALYSIS | **Audience:** Internal (God Agent project)

---

## Executive Summary

Elgato released **Stream Deck 7.4** (April 1, 2026) with native MCP (Model Context Protocol) support. This creates two new integration vectors for the God Agent workflow that complement our existing v2 shell-script approach:

1. **Official Elgato MCP Server** (`@elgato/mcp-server`) — Lets AI assistants (Claude Desktop, ChatGPT, G-Assist) *discover and trigger* Stream Deck actions via natural language.
2. **Third-party `streamdeck-mcp`** (verygoodplugins) — Lets AI assistants *programmatically configure* Stream Deck buttons, pages, and icons.

The key insight: **these are complementary, not competing, with our current setup.** Our v2 scripts handle WSL2 command execution. MCP adds an AI-driven *control plane* on top.

---

## Part 1: What Elgato's Official MCP Server Does

### Architecture

```
┌─────────────┐    MCP Protocol    ┌──────────────────┐    Local IPC    ┌──────────────┐
│  AI Client   │ ◄──────────────► │ Elgato MCP Server │ ◄────────────► │ Stream Deck  │
│ (Claude,     │   (stdio/HTTP)    │ (@elgato/mcp-     │                │ App 7.4+     │
│  ChatGPT,    │                   │  server)          │                │              │
│  G-Assist)   │                   │  Port 9090        │                │ MCP Actions  │
└─────────────┘                    └──────────────────┘                │ Profile      │
                                                                       └──────────────┘
```

### How It Works

1. **Enable MCP** in Stream Deck Preferences > General > "Enable MCP Actions"
2. A dedicated **MCP Actions profile** appears — only actions placed here are exposed to AI
3. Each action gets a **description field** (via AI icon in settings) that tells the AI what it does
4. **Elgato MCP Server** runs locally as a bridge (Node.js, port 9090)
5. AI tools connect to the MCP server and can discover + trigger exposed actions

### Transport Modes

| Mode | Command | Use Case |
|------|---------|----------|
| stdio | `npx @elgato/mcp-server@latest` | Claude Desktop, standard MCP clients |
| HTTP | `npx @elgato/mcp-server@latest --http` | NVIDIA G-Assist, HTTP-based clients |

### What AI Can Do (Official Server)

The official server is **one-directional**: AI triggers actions *on* the Stream Deck. The tools exposed are:
- **List available actions** — AI discovers what's on the MCP Actions profile
- **Trigger an action** — AI executes a specific action by description match
- **Combine actions** — AI chains multiple actions from a single natural language request

### Configuration for Claude Desktop

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "elgato": {
      "command": "npx",
      "args": ["--yes", "@elgato/mcp-server@latest"]
    }
  }
}
```

Health check: `GET http://localhost:9090/health`

---

## Part 2: Third-Party `streamdeck-mcp` (verygoodplugins)

This is the **reverse direction**: AI configures the Stream Deck rather than triggering it.

### MCP Tools Exposed

#### Profile Writer Mode (default — works alongside Elgato app)

| Tool | Description |
|------|-------------|
| `streamdeck_read_profiles` | List desktop profiles and page directories from ProfilesV3/V2 |
| `streamdeck_read_page` | Read page manifest with button details |
| `streamdeck_write_page` | Create/rewrite page manifest (action objects, convenience fields) |
| `streamdeck_create_icon` | Generate 72x72 PNG icon with text and colors |
| `streamdeck_create_action` | Create executable shell script in `~/StreamDeckScripts/` + return native Open action block |
| `streamdeck_restart_app` | Restart Stream Deck desktop app after profile changes |

#### Legacy USB Mode (requires exclusive hardware access)

| Tool | Description |
|------|-------------|
| `streamdeck_connect` / `_disconnect` | Connect/disconnect to hardware |
| `streamdeck_info` | Get device info |
| `streamdeck_set_button` / `_set_buttons` | Set single/multiple button images+actions |
| `streamdeck_clear_button` / `_clear_all` | Clear buttons |
| `streamdeck_set_brightness` | Set display brightness |
| `streamdeck_create_page` / `_switch_page` / `_list_pages` / `_delete_page` | Page management |
| `streamdeck_get_button` | Read button config |

### Installation

```json
// Claude Desktop or Claude Code MCP config
{
  "mcpServers": {
    "streamdeck": {
      "command": "uvx",
      "args": ["streamdeck-mcp"]
    }
  }
}
```

Or for development: `uv pip install -e .` from the cloned repo.

---

## Part 3: Integration Opportunities for the God Agent Workflow

### Opportunity Matrix

| # | Integration | Mechanism | Effort | Impact | Priority |
|---|------------|-----------|--------|--------|----------|
| 1 | Voice-triggered God Agent commands | Elgato MCP + G-Assist | LOW | HIGH | P1 |
| 2 | Claude-triggered pipeline actions | Elgato MCP + Claude Desktop | LOW | HIGH | P1 |
| 3 | AI-managed button layouts | streamdeck-mcp profile writer | MED | MED | P2 |
| 4 | Dynamic icon generation from pipeline state | streamdeck-mcp `create_icon` | MED | MED | P2 |
| 5 | Event-driven automation (Aitum-style) | Elgato MCP + custom triggers | HIGH | MED | P3 |
| 6 | Claude Code MCP server for Stream Deck | Custom MCP server | HIGH | HIGH | P3 |

---

### Opportunity 1: Voice-Triggered God Agent Commands (P1 — LOW EFFORT)

**What:** Put our existing shell scripts on the MCP Actions profile with AI-readable descriptions. NVIDIA G-Assist (or any voice AI) can then trigger them hands-free.

**Setup:**
1. Enable MCP Actions in Stream Deck 7.4 Preferences
2. Place our existing v2 buttons (ask, write, research, code, etc.) onto the MCP Actions profile
3. Add descriptions to each action:
   - START SERVICES: "Start all God Agent backend services including vLLM, embedding, ChromaDB, and observability"
   - WRITE: "Start an academic writing pipeline using the God Agent with style injection and quality validation"
   - ABORT: "Emergency abort of any running God Agent pipeline, immediately stopping API calls"
   - STATUS: "Check the health of all God Agent services"
4. Start the Elgato MCP Server: `npx @elgato/mcp-server@latest --http`
5. Configure G-Assist to connect to `localhost:9090`

**Voice commands that would work:**
- "Start my writing services" → triggers START SERVICES
- "Begin a research session on Aristotle's categories" → triggers RESEARCH
- "What's the status of my system?" → triggers STATUS
- "Abort the pipeline" → triggers ABORT
- "Wrap up and shut everything down" → triggers STOP SERVICES

**Value:** Hands-free control while reading PDFs or reviewing output. No context-switching to the Stream Deck or terminal.

---

### Opportunity 2: Claude Desktop Triggering Pipeline Actions (P1 — LOW EFFORT)

**What:** Connect Claude Desktop to the Elgato MCP server so that Claude can trigger God Agent commands as part of a conversational workflow.

**Example conversation:**
```
User: "I need to write a section on Aristotle's theory of substance"
Claude: [triggers WRITE action via MCP] "I've started the writing pipeline for you.
         I can see these actions available: WRITE, WRITE GOLD, RESEARCH, QUERY..."
```

**Why this matters:** Currently, launching a god-write pipeline requires switching to the terminal or pressing a Stream Deck button. With MCP, Claude Desktop becomes a *command surface* — you describe what you need, and Claude triggers the appropriate hardware action.

**Setup:** Add the `elgato` MCP server config to `claude_desktop_config.json` (see Part 1).

---

### Opportunity 3: AI-Managed Button Layouts (P2 — MEDIUM EFFORT)

**What:** Use `streamdeck-mcp` to let Claude Code dynamically reconfigure the Stream Deck layout based on context.

**Use cases:**
- **Pipeline-active mode:** When a write pipeline is running, automatically reconfigure Page 1 to show ABORT prominently, hide START, show pipeline stage progress
- **Research mode:** When doing corpus analysis, swap in research-specific buttons (QUERY, LOCAL RESEARCH, GROUNDED RESEARCH) to Page 1
- **Review mode:** After a writing run, swap in FEEDBACK folder, QUALITY check, ANALYTICS to Page 1

**Implementation:**
1. Add `streamdeck-mcp` as an MCP server in Claude Code settings
2. Create context-aware profile templates (JSON) for each mode
3. Use `streamdeck_write_page` to swap layouts when mode changes
4. Use `streamdeck_create_icon` to generate context-specific icons (e.g., stage 4/11 indicator)

**Example Claude Code interaction:**
```
Claude Code: [detects write pipeline started]
  → streamdeck_write_page: replaces Page 1 with pipeline-monitoring layout
  → streamdeck_create_icon: generates "Stage 1/11" icon for position R1C1

Claude Code: [detects pipeline complete]
  → streamdeck_write_page: restores default Page 1 layout
```

---

### Opportunity 4: Dynamic Icon Generation from Pipeline State (P2 — MEDIUM EFFORT)

**What:** Instead of the BarRaider API Ninja polling approach (Phase 4 in our current plan), use `streamdeck-mcp` to push icon updates when pipeline state changes.

**Current approach (polling):** STATUS button polls `GET /api/health` every 5-10s → green/yellow/red icon
**MCP approach (push):** Pipeline emits state → Claude Code (or a hook) calls `streamdeck_create_icon` → icon updates instantly

**Advantages over polling:**
- Richer information: can show "Stage 4/11" or "1,234 tokens" instead of just green/yellow/red
- Event-driven: updates only when state changes, not on a polling interval
- No third-party plugin dependency (BarRaider)

**Implementation:**
1. Add a post-task hook or pipeline event listener
2. On state change, call `streamdeck_create_icon` with current status text
3. Call `streamdeck_write_page` to update the specific button position

---

### Opportunity 5: Event-Driven Automation (P3 — HIGH EFFORT)

**What:** Create automated workflows where external events trigger Stream Deck actions, similar to how Aitum works for streamers.

**God Agent scenarios:**
- Pipeline completes → flash FEEDBACK button, play notification sound
- Corpus ingestion finishes → update LEARN button icon with chunk count
- API costs exceed threshold → flash ABORT button red, send toast notification
- Service health degrades → auto-switch to STATUS page

**Implementation:** Requires building a lightweight event bridge between the observability server (port 3847 SSE) and the MCP action trigger system. This is the Phase 6 custom plugin territory from our current plan.

---

### Opportunity 6: Custom God Agent MCP Server for Stream Deck (P3 — HIGH EFFORT)

**What:** Build a dedicated MCP server that exposes God Agent operations as first-class MCP tools, rather than wrapping shell scripts.

**Tools it would expose:**
```
god_agent_status        — Returns structured service health
god_agent_write         — Starts writing pipeline with parameters
god_agent_research      — Starts research with topic + mode
god_agent_abort         — Aborts running pipeline
god_agent_learn         — Ingests knowledge
god_agent_query         — Queries knowledge base
god_agent_pipeline_info — Returns current pipeline stage/progress
god_agent_costs         — Returns token usage/costs
```

**Why:** Eliminates the shell-script-to-WSL-to-CLI chain. AI tools would talk directly to the God Agent via MCP, with structured responses instead of terminal output.

**Architecture:**
```
┌──────────────┐   MCP    ┌────────────────────┐   Direct API   ┌──────────────┐
│ Claude/GPT/  │ ◄──────► │ God Agent MCP      │ ◄────────────► │ God Agent    │
│ G-Assist     │          │ Server (custom)    │               │ Core         │
└──────────────┘          └────────────────────┘               │ (CLI/Daemon) │
       │                                                        └──────────────┘
       │                    ┌──────────────────┐
       └──────────────────► │ Elgato MCP Server│ ──► Stream Deck (hardware)
                            └──────────────────┘
```

This would make the God Agent a first-class MCP citizen — discoverable by any MCP-compatible AI tool.

---

## Part 4: Recommended Rollout Plan

### Phase A: Quick Wins (1-2 hours)

1. **Update Stream Deck to 7.4+** if not already done
2. **Enable MCP Actions** in Stream Deck Preferences
3. **Clone existing v2 buttons** onto the MCP Actions profile with descriptions
4. **Install Elgato MCP Server**: `npm install -g @elgato/mcp-server`
5. **Configure Claude Desktop** with the `elgato` MCP server entry
6. **Test**: Ask Claude Desktop "What Stream Deck actions do I have available?"

### Phase B: Dynamic Layouts (half day)

1. **Install `streamdeck-mcp`**: `pip install streamdeck-mcp` (or `uvx streamdeck-mcp`)
2. **Add to Claude Code MCP config** as `streamdeck` server
3. **Create mode templates** (default, pipeline-active, research, review)
4. **Test**: Ask Claude Code to switch to "pipeline monitoring mode"

### Phase C: Push-Based Status (1 day)

1. **Add pipeline state hooks** that call `streamdeck_create_icon` on state changes
2. **Replace BarRaider polling** with event-driven icon updates
3. **Test**: Run a write pipeline, verify button shows stage progress

### Phase D: Custom MCP Server (future — evaluate after Phase C)

1. Only if Phases A-C prove the value of MCP integration
2. Build a Node.js MCP server wrapping the God Agent CLI/API
3. Register with both Claude Desktop and Stream Deck's action system

---

## Part 5: Compatibility with Current v2 Setup

| Current v2 Component | MCP Impact | Action Needed |
|-----------------------|-----------|---------------|
| 33 shell scripts in `streamdeck/scripts/` | **Keep** — still needed for WSL execution | None |
| `_common.sh` helpers | **Keep** — MCP actions still trigger these scripts | None |
| Clipboard-first input | **Enhanced** — AI can pass parameters directly via MCP | Consider structured input path |
| BarRaider API polling (planned Phase 4) | **Replace** with `streamdeck-mcp` push icons | Skip BarRaider, go straight to MCP |
| Custom plugin (planned Phase 6) | **Replace** with `streamdeck-mcp` + custom MCP server | Lower barrier than building SD plugin |
| Pipeline abort sentinel | **Keep** — file sentinel is transport-agnostic | None |
| Windows Terminal profiles | **Keep** — interactive commands still need terminal | None |
| Toast notifications | **Keep** — background feedback mechanism unchanged | None |

### Key Revision to Existing Plan

The biggest change: **skip BarRaider API Ninja (Phase 4) and the custom Stream Deck plugin (Phase 6) entirely.** The `streamdeck-mcp` profile writer gives us programmatic icon/layout control without building a custom plugin, and the Elgato MCP server gives us AI-triggered actions without a custom integration layer.

---

## Sources

- [How to Control Stream Deck with AI | Elgato (Official)](https://www.elgato.com/ww/en/explorer/products/stream-deck/sd-mcp-setup/)
- [streamdeck-mcp (verygoodplugins) — GitHub](https://github.com/verygoodplugins/streamdeck-mcp)
- [Elgato Stream Deck 7.4 MCP Support — AI Directory](https://aidirectory.com/news/elgato-stream-deck-7-4-mcp-ai-assistants-trigger-actions)
- [Elgato GitHub Organization](https://github.com/elgatosf)
- [streamdeck-mcp on PyPI](https://pypi.org/project/streamdeck-mcp/0.2.0/)
