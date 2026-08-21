# God Agent Stream Deck Implementation Plan

> **Living Document** | Created: 2026-03-15 | Updated: 2026-03-16 | Status: PLANNING
> Stream Deck MK.2 (15-key, 5x3 grid) + Stream Deck+ or XL expansion planned

---

## Current State Analysis

### What Exists (v1.0 Profile)

The current profile maps **11 of 15 buttons** (4 empty on Row 3):

| Row | Col 1 | Col 2 | Col 3 | Col 4 | Col 5 |
|-----|-------|-------|-------|-------|-------|
| **1 (Cyan)** | STATUS | ASK | CODE | RESEARCH | WRITE |
| **2 (Purple)** | LEARN | QUERY | STYLE IN | STYLES | FEEDBACK |
| **3 (Orange)** | _empty_ | _empty_ | _empty_ | _empty_ | DASHBOARD |

**Issues identified:**
1. **macOS-only dialogs** - All scripts use `osascript` (AppleScript) for input prompts. You're on **WSL2/Windows** - these will silently fail.
2. **Wrong GOD_AGENT_DIR** - Scripts default to `~/god-agent-package` but actual path is `/home/dalton/projects/claudeflow-testing`.
3. **Missing commands** - 9+ CLI commands and all slash commands are unmapped.
4. **No multi-page support** - 15 keys is insufficient for the full feature set. Stream Deck supports folders/profiles for page navigation.
5. **No service management** - `god-launch start/stop/restart` has no button.
6. **Dashboard script uses `open`** (macOS) instead of `wslview` or `explorer.exe`.

---

## Complete God Agent Command Inventory

### Tier 1: CLI Commands (`cli.ts`)

| Command | Alias | Needs Input? | Current Button? | Priority |
|---------|-------|-------------|-----------------|----------|
| `ask` | `a` | Yes (text) | Yes (R1C2) | DONE |
| `code` | `c` | Yes (task) | Yes (R1C3) | DONE |
| `research` | `r` | Yes (topic) | Yes (R1C4) | DONE |
| `write` | `w` | Yes (topic + many flags) | Yes (R1C5) | DONE |
| `status` | `s` | No | Yes (R1C1) | DONE |
| `learn` | `l` | Yes (content or --file) | Yes (R2C1) | DONE |
| `query` | `q` | Yes (search term) | Yes (R2C2) | DONE |
| `feedback` | `f` | Yes (id + rating) | Yes (R2C5) | DONE |
| `code-feedback` | `cf` | Yes (trajectoryId) | **No** | HIGH |
| `auto-complete-coding` | `acc` | No (--dry-run optional) | **No** | MEDIUM |
| `batch-learn` | `bl` | No (--limit, --dry-run) | **No** | MEDIUM |
| `verify-feedback` | `vf` | Yes (trajectoryId) | **No** | LOW |
| `feedback-health` | `fh` | No | **No** | MEDIUM |
| `code-pipeline` | - | Yes (task) | **No** | HIGH |
| `help` | `h` | No | **No** | LOW |

### Tier 2: Router Commands (no agent init needed)

| Command | Alias | Purpose | Priority |
|---------|-------|---------|----------|
| `analytics` | `dashboard` | Performance analytics | HIGH |
| `costs` | `cost` | Token/API cost tracking | MEDIUM |
| `quality` | - | Quality metrics | MEDIUM |
| `budget` | - | Budget status | LOW |
| `reviews` | `review` | Code review metrics | LOW |
| `routing` | `route` | Routing diagnostics | LOW |

### Tier 3: Service Management (`god-launch`)

| Command | Purpose | Priority |
|---------|---------|----------|
| `start` | Start all services (vLLM, embedding, memory, daemon, UCM, observe) | **CRITICAL** |
| `stop` | Graceful shutdown | **CRITICAL** |
| `restart` | Restart all or specific service | HIGH |
| `status` | Service health check | HIGH |
| `attach` | Attach to tmux session | MEDIUM |
| `logs` | View/search logs | MEDIUM |
| `metrics` | Performance metrics | LOW |
| `kill` | Emergency force kill | LOW |

### Tier 4: Claude Code Slash Commands

| Slash Command | Purpose | Priority |
|---------------|---------|----------|
| `/god-write` | Full writing pipeline with style injection | **CRITICAL** |
| `/god-ask` | Question routing via DAI-001 | HIGH |
| `/god-learn` | Store knowledge | DONE (via CLI) |
| `/god-learn-update` | Compile + query-conditioned retrieval | HIGH |
| `/god-learn-compile` | Phase 1-3 substrate compile | MEDIUM |
| `/god-learn-style` | Learn style from PDF | DONE (via CLI) |
| `/god-learn-verify` | Verify god-learn artifacts | MEDIUM |
| `/god-style-status` | Style profile status | DONE (via CLI) |
| `/god-status` | System status | DONE (via CLI) |
| `/god-launch` | Service management | **CRITICAL** |
| `/god-feedback` | Trajectory feedback | DONE (via CLI) |
| `/god-pdf-analyze` | PDF analysis (auto/manual/hybrid) | HIGH |
| `/god-research` | PhD pipeline deep research | HIGH |
| `/god-research-local` | Local-only research (no web) | MEDIUM |
| `/god-research-grounded` | Grounded research (corpus + external) | MEDIUM |
| `/god-research-hybrid` | Hybrid research (local-first + external) | MEDIUM |
| `/god-complete-section` | Dissertation section completion | HIGH |
| `/god-synthesize-chapters` | Chapter synthesis | MEDIUM |
| `/god-code` | 48-agent coding pipeline | HIGH |
| `/pushrepo` | Commit + push | MEDIUM |
| `/sitrep` | Session restoration doc | MEDIUM |

### Tier 5: Observability Dashboard (port 3847)

| Feature | Purpose | Priority |
|---------|---------|----------|
| Open Dashboard | `http://localhost:3847` | **CRITICAL** |
| ICP Panel | Writing pipeline monitoring | HIGH |

---

## Execution Mode Classification

> **Design principle (2026-03-16 review):** Not every button needs a terminal tab.
> Opening a new WT tab for status checks or service toggles clutters the workspace.

### Three Execution Modes

| Mode | Stream Deck Action | When to Use | Examples |
|------|-------------------|-------------|----------|
| **Interactive** | `wt.exe -p "God Agent" wsl -e script.sh` | Long-running, produces output you need to read | ask, write, research, code, code-pipeline |
| **Background** | `wsl.exe -e script.sh` (hidden, no terminal) | Fire-and-forget, result via toast notification | start, stop, learn, batch-learn, learn-update |
| **Web Link** | Stream Deck native "Website" action | Opens URL directly, bypasses WSL entirely | Dashboard (`http://localhost:3847`) |

**Toast notifications for background commands:** Background scripts that produce summary output
(e.g., `status`, `feedback-health`) use Windows toast notifications via
`powershell.exe -Command "New-BurntToastNotification -Text '...'"` instead of spawning a terminal tab.
This surfaces the info without cluttering the workspace.

### Command → Mode Mapping

| Command | Mode | Rationale |
|---------|------|-----------|
| ask, write, research, code | Interactive | Long output, progress bars, fallback input |
| code-pipeline, complete-section | Interactive | Multi-phase output, long-running |
| start, stop, restart | Background | Fire-and-forget service control |
| learn, learn-update, learn-compile | Background | No output needed immediately |
| batch-learn, learn-verify | Background | Automated processing |
| status, feedback-health | Background + Toast | Instant result, shown as notification |
| Dashboard | Web Link | `http://localhost:3847` direct |
| feedback (folder) | Background | Clipboard ID + preset rating |

---

## Proposed Multi-Page Layout

### Page 1: MAIN (Primary Commands)

The "home screen" - most frequently used operations.

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  STATUS  │   ASK    │   CODE   │ RESEARCH │  WRITE   │
│    📊    │    💬    │    ⚙️    │    🔬    │    ✍️    │
│ (API*)   │ (intctv) │ (intctv) │ (intctv) │ (intctv) │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│  LEARN   │  QUERY   │ PDF SCAN │ COMPLETE │⭐FEEDBCK │
│    🧠    │    🔍    │    📑    │    📝    │ (folder) │
│  (bkgd)  │ (intctv) │ (intctv) │ (intctv) │ 5 presets│
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ 🟢 START │ 🔴 STOP  │ 🖥️ DASH  │ ⛔ ABORT │ → PAGE 2 │
│  (bkgd)  │  (bkgd)  │ (weblink)│  (bkgd)  │  (folder)│
└──────────┴──────────┴──────────┴──────────┴──────────┘

* STATUS button: API-polled dynamic icon (green/yellow/red)
  via BarRaider API Ninja polling GET /api/health every 5s
```

**Changes from v1.0:**
- R1C1: STATUS now uses **API-polled dynamic icon** (see Dynamic Status section)
- R2C3: STYLE IN → PDF SCAN (`/god-pdf-analyze`) - more frequently used
- R2C4: STYLES → COMPLETE (`/god-complete-section`) - core workflow
- R2C5: FEEDBACK → **Folder** with 5 preset rating buttons (see Feedback Folder section)
- R3C1: empty → START SERVICES (`god-launch start`, background mode)
- R3C2: empty → STOP SERVICES (`god-launch stop`, background mode)
- R3C3: empty → DASHBOARD (native Website action → `http://localhost:3847`)
- R3C4: empty → **ABORT PIPELINE** (emergency kill switch, see Pipeline Abort section)
- R3C5: DASHBOARD → PAGE 2 (folder navigation)

### Feedback Folder (inside R2C5)

Pressing FEEDBACK opens a folder with 5 preset rating buttons.
Workflow: copy Trajectory ID to clipboard → press rating button → done.

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│  PERFECT │   GOOD   │   MEH    │   POOR   │   FAIL   │
│   1.0    │   0.8    │   0.5    │   0.2    │   0.0    │
│    ✅    │    👍    │    😐    │    👎    │    ❌    │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

Each button: reads clipboard → `cli.ts feedback "$CLIPBOARD" <rating>` (background mode).
These 5 levels align with SoNA's EWC++ gradient update sensitivity:
- 1.0 = strong reinforcement, 0.8 = moderate reinforcement
- 0.5 = neutral, 0.2 = moderate penalty, 0.0 = strong penalty

### Page 2: RESEARCH & LEARNING

```
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ LOCAL    │ GROUNDED │ HYBRID   │ SYNTH    │ STYLE    │
│ RESEARCH │ RESEARCH │ RESEARCH │ CHAPTERS │  STATUS  │
│   📚    │   🌍    │   🔄    │   📖    │    🎨    │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ LEARN    │ LEARN    │ LEARN    │ CODE     │  SITREP  │
│ UPDATE   │ COMPILE  │ VERIFY   │ PIPELINE │    📋    │
│   🔄    │   🏗️    │   ✅    │   🏭    │          │
├──────────┼──────────┼──────────┼──────────┼──────────┤
│ ANALYTICS│  COSTS   │ QUALITY  │ SVC STAT │ ← PAGE 1 │
│    📈   │    💰    │    🎯   │    🩺   │    ◀◀    │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

**Changes from v1 plan:** SITREP moved from Page 1 R3C4 to Page 2 R2C5.
CODE FEEDBACK removed (absorbed into Feedback Folder's clipboard workflow —
works for both regular and code trajectories).

---

## Implementation Phases

### Phase 0: Fix WSL2 Compatibility (BLOCKING)

All existing scripts use `osascript` (macOS AppleScript). On WSL2, we need a different input mechanism.

**Decided approach (2026-03-16):** Clipboard-first with terminal `read` fallback.

Interactive scripts try `powershell.exe Get-Clipboard` first (0.5-1.5s overhead, acceptable
for commands that will then run for seconds/minutes anyway). If clipboard is empty,
fall back to `read -p` in the terminal. Background scripts skip input entirely or
read clipboard silently.

**Script template for WSL2 interactive commands:**
```bash
#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
INPUT=$(god_input "Enter query")
[ -z "$INPUT" ] && echo "No input." && exit 0
npx tsx src/god-agent/universal/cli.ts ask "$INPUT"
god_wait
```

**Script template for WSL2 background commands:**
```bash
#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
scripts/god-launch start 2>&1
god_toast "God Agent" "Services started"
```

### Phase 1: Rewrite Existing Scripts + Add Execution Mode Support

- [ ] Create `_common.sh` with `god_cd`, `god_input`, `god_open`, `god_wait`, `god_toast` helpers
- [ ] Update `GOD_AGENT_DIR` default to `/home/dalton/projects/claudeflow-testing`
- [ ] Replace all `osascript` calls with clipboard/read pattern
- [ ] Replace `open` (macOS) with native Stream Deck "Website" action (for dashboard)
- [ ] Categorize all scripts as interactive/background/weblink per mode mapping table
- [ ] Install BurntToast PowerShell module for toast notifications (`Install-Module -Name BurntToast`)
- [ ] Test interactive script (ask) and background script (status) end-to-end

### Phase 2: Add Missing Page 1 Buttons

- [ ] `god-launch-start.sh` — background, `scripts/god-launch start` + toast
- [ ] `god-launch-stop.sh` — background, `scripts/god-launch stop` + toast
- [ ] `god-pdf-analyze.sh` — interactive, clipboard path → `cli.ts pdf-analyze`
- [ ] `god-complete-section.sh` — interactive, clipboard topic → write pipeline
- [ ] `god-abort-pipeline.sh` — background, creates sentinel file (see Pipeline Abort section)
- [ ] Configure Dashboard button as native "Website" action → `http://localhost:3847`
- [ ] Create Feedback Folder with 5 preset rating scripts (1.0, 0.8, 0.5, 0.2, 0.0)

### Phase 3: Add Page 2 Scripts

- [ ] Research variants: `god-research-local.sh`, `god-research-grounded.sh`, `god-research-hybrid.sh` (interactive)
- [ ] Learning lifecycle: `god-learn-update.sh`, `god-learn-compile.sh`, `god-learn-verify.sh` (background)
- [ ] Code pipeline: `god-code-pipeline.sh` (interactive)
- [ ] Chapter synthesis: `god-synthesize-chapters.sh` (interactive)
- [ ] Analytics/costs/quality router commands (background + toast)
- [ ] Service status: `god-launch-status.sh` (background + toast)
- [ ] SITREP: `god-sitrep.sh` (background, writes to ./tmp/)

### Phase 4: Stream Deck App Configuration + Dynamic Status

- [ ] Create profile JSON v2 with multi-page layout + folder structure
- [ ] Design button icons (72x72 PNG) matching the dashboard color scheme:
  - Cyan (#00c8ff): Row 1 primary commands
  - Purple (#7b2fff): Row 2 learning/knowledge
  - Orange (#ff6b35): Row 3 system/navigation
  - Red (#ff3355): ABORT button
- [ ] Configure folder actions for page navigation and feedback presets
- [ ] Set up execution modes per button (wt.exe for interactive, wsl.exe for background, Website for dash)
- [ ] **Install BarRaider API Ninja** (or similar API polling plugin)
- [ ] Configure STATUS button (R1C1) to poll `GET http://localhost:3847/api/health` every 5-10s
  - `status: "healthy"` → green icon
  - `status: "degraded"` → yellow icon
  - `status: "unhealthy"` or connection refused → red icon
  - Connection refused during startup = yellow (not red)
- [ ] Write mode presets as Multi-Action buttons:
  - "WRITE GOLD" = `write --whitelist --multi-step --execute`
  - "WRITE QUICK" = `write --execute`

### Phase 5: Pipeline Abort Mechanism (NEW — requires code changes)

**Problem:** Neither CodingPipelineOrchestrator nor WritePipelineOrchestrator have an abort
signal. `god-launch stop` kills ALL services (vLLM, ChromaDB, embedding) just to stop
a runaway pipeline. Anthropic API calls have 120-180s timeouts — a stage-boundary-only
sentinel would still allow a full token generation to complete before aborting.

**Solution: Two-layer abort (file sentinel + AbortController signal propagation).**

See "Pipeline Abort Architecture" section above for full design.

**Code changes needed:**

Layer 1 — File sentinel trigger (Stream Deck side):
- [ ] `god-abort-pipeline.sh`: `touch .god-agent/abort-pipeline` + toast "Abort signal sent"

Layer 2 — AbortController signal propagation (TypeScript side):
- [ ] `WritePipelineOrchestrator.write()`: Create AbortController + fs.watch at pipeline start
- [ ] `CodingPipelineOrchestrator.execute()`: Same pattern
- [ ] `ModelRouter.callAnthropic()`: Accept optional `AbortSignal`, compose with `AbortSignal.any([timeout, pipelineSignal])`
- [ ] `ModelRouter.callVLLM()`: Same pattern
- [ ] `write-pipeline-orchestrator.ts` direct fetch calls (line ~1099): Accept signal param
- [ ] Both orchestrators: AbortError catch → save checkpoint → record partial trajectory → cleanup
- [ ] Stage-boundary sentinel check as backup for CPU-bound work between API calls
- [ ] Stale sentinel cleanup (>5 min) at pipeline start

**Testing:**
- [ ] Unit test: fs.watch detects sentinel, AbortController fires, fetch throws AbortError
- [ ] Integration test: Start write pipeline, touch sentinel, verify immediate abort + checkpoint saved
- [ ] Verify Node 20+ `AbortSignal.any()` availability in project's Node version

### Phase 6: Evaluate Custom Stream Deck Plugin (FUTURE)

After using the profile for 1+ week with the generic API polling plugin, evaluate whether
a custom Node.js Stream Deck plugin is worth building. Triggers for building custom:

- [ ] Need WebSocket connection for real-time pipeline progress (stage X/11 on button)
- [ ] Need live token cost counter during generation
- [ ] Need multi-button coordination (ABORT only visible when pipeline active)
- [ ] Need pipeline ETA / completion percentage

**Infrastructure already available:**
- SSE broadcaster in `express-server.ts` (HTTP-based, accessible from Windows)
- Unix Domain Socket server in `socket-server.ts` (would need TCP bridge for Windows)
- Prometheus metrics endpoint at `GET /api/metrics`

If building: use the Elgato Stream Deck SDK (Node.js) + fetch against `localhost:3847`.

---

## Stream Deck Action Types

For each button, the Stream Deck action type matters:

| Action Type | Use Case | Notes |
|-------------|----------|-------|
| **System: Open** | Run shell script in terminal | Current approach, works for WSL via `wsl.exe` |
| **System: Website** | Open URL | Good for dashboard (`http://localhost:3847`) |
| **Multi Action** | Sequential actions | Start services → wait → open dashboard |
| **Folder** | Page navigation | Navigate between Page 1 and Page 2 |
| **Hotkey** | Keyboard shortcut | Can trigger Claude Code slash commands if terminal focused |

### Windows → WSL Script Execution

Stream Deck runs on Windows. To execute WSL scripts:

**Option A: Direct WSL invocation**
```
Application: wsl.exe
Arguments: -e /home/dalton/projects/claudeflow-testing/streamdeck/scripts/god-status.sh
```

**Option B: PowerShell wrapper**
```
Application: powershell.exe
Arguments: -NoProfile -Command "wsl -e bash /home/dalton/projects/claudeflow-testing/streamdeck/scripts/god-status.sh"
```

**Option C: Windows Terminal profile** (recommended)
```
Application: wt.exe
Arguments: -p "God Agent" wsl -e /path/to/script.sh
```

This opens each command in a dedicated Windows Terminal tab with the "God Agent" profile (custom colors matching the dashboard theme).

---

## File Structure

```
streamdeck/
├── scripts/
│   ├── _common.sh              # Shared setup (GOD_AGENT_DIR, input helpers)
│   ├── god-ask.sh
│   ├── god-code.sh
│   ├── god-code-feedback.sh
│   ├── god-code-pipeline.sh
│   ├── god-complete-section.sh
│   ├── god-dashboard.sh
│   ├── god-feedback.sh
│   ├── god-launch-start.sh
│   ├── god-launch-stop.sh
│   ├── god-launch-status.sh
│   ├── god-learn.sh
│   ├── god-learn-compile.sh
│   ├── god-learn-style.sh
│   ├── god-learn-update.sh
│   ├── god-learn-verify.sh
│   ├── god-pdf-analyze.sh
│   ├── god-query.sh
│   ├── god-research.sh
│   ├── god-research-grounded.sh
│   ├── god-research-hybrid.sh
│   ├── god-research-local.sh
│   ├── god-sitrep.sh
│   ├── god-status.sh
│   ├── god-style-status.sh
│   ├── god-synthesize-chapters.sh
│   ├── god-write.sh
│   ├── god-write-gold.sh        # Preset: --whitelist --multi-step --execute
│   └── god-write-quick.sh       # Preset: --execute
├── icons/
│   ├── 72x72 PNGs for each button
│   └── (generated from dashboard color scheme)
├── profiles/
│   ├── god-agent-page1.json
│   └── god-agent-page2.json
├── dashboard/
│   └── index.html               # Updated companion dashboard
├── setup.sh                     # WSL2-aware setup script
└── README.md
```

---

## Dynamic Status Indicators (API-Polled)

The Observability server already exposes health endpoints that can drive live button icons:

| Endpoint | Returns | Use Case |
|----------|---------|----------|
| `GET /api/health` | `{ status, uptime, clientCount, eventCount }` | Main STATUS button |
| `GET /api/monitoring/health` | Deep health check via monitoring subsystem | Service health detail |
| `GET /api/monitoring/alerts` | Active alert list | Alert indicator |
| `GET /api/router/circuits` | Circuit breaker state per LLM provider | Provider health |

**`/api/health` response shape** (`express-server.ts:2721`):
```json
{
  "status": "healthy",       // "healthy" | "degraded" | "unhealthy"
  "uptime": 3600000,
  "clientCount": 2,
  "eventCount": 145,
  "bufferUsage": 12.5,
  "dbSize": 1024
}
```

**Icon mapping:**
- `status === "healthy"` → solid green
- `status === "degraded"` → pulsing yellow
- Connection refused (server not running) → solid red during startup, pulsing red if unexpected
- Poll interval: 5-10 seconds (sufficient for service health, not wasteful)

**Startup edge case (2026-03-16 revision):** During service startup, the Express server on
port 3847 isn't running yet. The API polling plugin receives connection-refused.

**DO NOT map connection-refused to yellow ("starting").** A crashed daemon returns the same
error, and a permanently-yellow dead system silently masks critical failures.

**Solution: Temporal constraint via START button Multi-Action.**
The API poller uses strict mapping:
- `healthy` → green
- `degraded` → yellow
- Connection-refused / `unhealthy` / any error → **red**

The START button is configured as a Multi-Action:
1. Force STATUS icon to yellow (override)
2. Execute `wsl.exe -e god-launch-start.sh` (background)
3. Delay 30 seconds (covers vLLM + ChromaDB cold start)
4. Release STATUS icon back to API-polled state

Result: After pressing START, you see yellow for exactly 30s. If services start successfully,
the API poller takes over and shows green. If startup fails, the poller shows red after the
30s window expires. No ambiguity, no silent failures.

---

## Pipeline Abort Architecture

### Why This Is Needed

The 48-agent CodingPipeline and 11-stage ICP WritePipeline can run for minutes and consume
significant Anthropic API tokens. The codebase currently has:
- `graceful-shutdown.ts` — Process-level SIGTERM/SIGINT handlers (kills the whole daemon)
- `CodingPipelineOrchestrator` — **No abort/cancel signal** (verified in source)
- `WritePipelineOrchestrator` — **No abort/cancel signal** (verified in source)

`god-launch stop` kills vLLM, ChromaDB, embedding, memory, daemon, UCM, and observability
just to stop a runaway writing task. That's disproportionate.

### Current LLM Call Timeouts (verified in source)

| Location | Timeout | File |
|----------|---------|------|
| ModelRouter → Anthropic | 120s (2 min) | `model-router.ts:302-305` |
| WritePipelineOrchestrator → Anthropic | 180s (3 min) | `write-pipeline-orchestrator.ts:1107` |
| ModelRouter → vLLM | 10s | `model-router.ts` (fast-fail) |
| ModelRouter → vLLM health | 3s | `model-router.ts:212,221` |

A file sentinel checked only between stages would still allow 2-3 minutes of wasted Anthropic
API calls (and tokens) before noticing the abort. That's not a kill switch — it's a suggestion.

### Two-Layer Abort: File Sentinel + AbortController Signal Propagation

**Layer 1: File sentinel** (cross-platform trigger from Stream Deck)
```
Stream Deck ABORT button → touch .god-agent/abort-pipeline
```

**Layer 2: fs.watch + AbortController** (instant TCP connection severance)

The `fs.watch` and `AbortController` live **in the orchestrator process itself**, not in the
daemon. This is critical because `cli.ts write --execute` runs the WritePipelineOrchestrator
in the CLI process, not in the daemon. The abort mechanism must work wherever the pipeline runs.

```typescript
// In WritePipelineOrchestrator.write() — at pipeline start
const abortController = new AbortController();
const sentinelDir = path.join(GOD_AGENT_DIR, '.god-agent');
const sentinelFile = 'abort-pipeline';
const sentinelPath = path.join(sentinelDir, sentinelFile);

// Clean stale sentinel (older than 5 minutes)
if (existsSync(sentinelPath)) {
  const age = Date.now() - statSync(sentinelPath).mtimeMs;
  if (age > 300_000) unlinkSync(sentinelPath);
}

// IMPORTANT: Watch the DIRECTORY, not the file.
// 1. The sentinel file doesn't exist yet — watching it throws ENOENT.
// 2. `touch` across Windows→WSL boundary replaces the inode, which
//    silently breaks direct file watchers.
// Watching the parent directory + filtering by filename is reliable.
const watcher = fs.watch(sentinelDir, (eventType, filename) => {
  if (filename === sentinelFile) {
    log('⛔ Abort signal received — severing LLM connections');
    abortController.abort('Triggered via Stream Deck sentinel');
    watcher.close();
    try { unlinkSync(sentinelPath); } catch { /* already cleaned */ }
  }
});

// Pass signal downstream to all LLM calls
const pipelineSignal = abortController.signal;
```

**Signal composition in ModelRouter** — Composes the pipeline abort signal with the existing
per-request timeout using `AbortSignal.any()` (Node 20+):

```typescript
// model-router.ts — callAnthropic()
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  signal: AbortSignal.any([
    AbortSignal.timeout(timeoutMs),   // existing 120s timeout
    pipelineSignal,                   // new: abort on user request
  ]),
  headers: { ... },
  body: JSON.stringify({ ... }),
});
```

**Result:** Pressing ABORT on Stream Deck creates the sentinel file. Within milliseconds,
`fs.watch` fires, `abortController.abort()` triggers, and all active `fetch()` calls to
Anthropic/vLLM receive an `AbortError`, immediately severing TCP connections mid-stream.

**Cleanup on abort:**
1. Catch `AbortError` in orchestrator's try/catch
2. Save checkpoint (partial artifact preserved)
3. Record partial trajectory in SoNA (system learns from completed stages)
4. Close fs.watch
5. Remove sentinel file
6. Exit with distinct status code (e.g., 130) to distinguish abort from crash

**Stage-boundary sentinel check remains as backup** for CPU-bound processing between
API calls (e.g., chunk trimming, constraint building, quality gauntlet evaluation).

**Why AbortController lives in the orchestrator, not the daemon:**
- `cli.ts write --execute` runs WritePipelineOrchestrator in the CLI process
- `cli.ts code-pipeline` runs CodingPipelineOrchestrator in the CLI process
- The daemon hosts observability + socket IPC, but not the actual LLM calls
- AbortController must be in the same process as the fetch() calls it needs to abort

---

## Shared Script Template (`_common.sh`)

```bash
#!/bin/bash
# God Agent Stream Deck — Common utilities (WSL2)
export GOD_AGENT_DIR="/home/dalton/projects/claudeflow-testing"
export PATH="$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node/ | tail -1)/bin:$PATH"

# Navigate to project directory
god_cd() { cd "$GOD_AGENT_DIR" || { echo "ERROR: $GOD_AGENT_DIR not found"; exit 1; }; }

# Get input: clipboard first, then terminal prompt
# Use for interactive commands only (ask, write, research, code)
god_input() {
  local prompt="${1:-Enter input}"
  local input
  input=$(powershell.exe -NoProfile -Command "Get-Clipboard" 2>/dev/null | tr -d '\r\n')
  if [ -z "$input" ]; then
    read -p "$prompt: " input
  else
    echo "[Clipboard] $input"
  fi
  echo "$input"
}

# Get clipboard content only (for background scripts like feedback)
god_clipboard() {
  powershell.exe -NoProfile -Command "Get-Clipboard" 2>/dev/null | tr -d '\r\n'
}

# Send Windows toast notification (for background commands)
# Requires: Install-Module -Name BurntToast (PowerShell)
god_toast() {
  local title="${1:-God Agent}"
  local message="${2:-Done}"
  powershell.exe -NoProfile -Command \
    "New-BurntToastNotification -Text '$title','$message'" 2>/dev/null
}

# Open URL in Windows default browser
god_open() { explorer.exe "$1" 2>/dev/null || wslview "$1" 2>/dev/null; }

# Wait for keypress before closing (interactive commands only)
god_wait() { echo ""; read -n 1 -s -r -p "Press any key to close..."; }

# Create pipeline abort sentinel
god_abort() {
  touch "$GOD_AGENT_DIR/.god-agent/abort-pipeline"
  god_toast "God Agent" "Abort signal sent — pipeline will stop at next stage boundary"
}
```

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-15 | Multi-page layout (2 pages) | 15 keys insufficient for 30+ commands |
| 2026-03-15 | Clipboard-first input | Fastest UX on WSL2, no dialog dependency |
| 2026-03-15 | Windows Terminal profiles | Consistent theming, tab management |
| 2026-03-15 | Service mgmt on Page 1 Row 3 | Most critical missing feature |
| 2026-03-16 | Three execution modes (interactive/background/weblink) | Prevents workspace clutter from fire-and-forget commands |
| 2026-03-16 | API-polled dynamic STATUS via BarRaider plugin | Leverages existing `/api/health` endpoint, passive monitoring |
| 2026-03-16 | Feedback Folder with 5 preset ratings | Eliminates manual float typing, aligns with SoNA gradient levels |
| 2026-03-16 | File sentinel pipeline abort (not signal-based) | Cross-platform WSL→Linux, no PID tracking, clean stage-boundary abort |
| 2026-03-16 | ABORT button on Page 1 R3C4 (replaces SITREP) | Cost control is time-critical; SITREP is not |
| 2026-03-16 | Generic API plugin first, custom plugin Phase 6 | Start simple, evaluate after 1 week of real usage |
| 2026-03-16 | Dashboard as native "Website" action | Zero WSL overhead, instant open |
| 2026-03-16 | Connection-refused = RED (not yellow) | Crashed daemon must not display "starting" permanently |
| 2026-03-16 | START button Multi-Action forces 30s yellow window | Temporal constraint: intentional yellow during known startup, red if still down after |
| 2026-03-16 | Two-layer abort: sentinel + AbortController | Sentinel alone allows 2-3 min of wasted API calls; signal propagation severs TCP instantly |
| 2026-03-16 | AbortController lives in orchestrator, not daemon | CLI pipelines run in CLI process, not daemon; abort must be co-located with fetch() calls |
| 2026-03-16 | fs.watch on directory, not file | Sentinel file doesn't exist yet (ENOENT); Windows→WSL `touch` replaces inode (breaks file watchers) |

---

## Next Steps

1. **Create `_common.sh`** with all helper functions
2. **Rewrite `god-status.sh`** as background + toast proof-of-concept
3. **Rewrite `god-ask.sh`** as interactive proof-of-concept
4. **Test Stream Deck → WSL execution** for both modes
5. **Install BarRaider API Ninja** and configure `/api/health` polling
6. **Implement file sentinel abort** in WritePipelineOrchestrator + CodingPipelineOrchestrator
7. **Create Feedback Folder** scripts (5 presets)
8. **Design icons** (72x72 PNG, dashboard color scheme)
