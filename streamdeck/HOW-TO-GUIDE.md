# God Agent Stream Deck v2 — Implementation & Usage Guide

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup (WSL2 Side)](#initial-setup-wsl2-side)
3. [Stream Deck App Configuration](#stream-deck-app-configuration)
4. [Page 1 — Main Commands](#page-1--main-commands)
5. [Page 2 — Research & Learning](#page-2--research--learning)
6. [Feedback Folder](#feedback-folder)
7. [Dynamic Status Indicator (API Ninja)](#dynamic-status-indicator-api-ninja)
8. [START Button Multi-Action](#start-button-multi-action)
9. [Pipeline Abort System](#pipeline-abort-system)
10. [Execution Modes Explained](#execution-modes-explained)
11. [Clipboard Workflow](#clipboard-workflow)
12. [Toast Notifications](#toast-notifications)
13. [Customization](#customization)
14. [Troubleshooting](#troubleshooting)

---

## Prerequisites

**Hardware**: Elgato Stream Deck MK.2 (15 keys, 5x3 grid)

**Software — Windows side**:
- Stream Deck app (Elgato) — https://www.elgato.com/en/downloads
- Windows Terminal (`wt.exe`) — from Microsoft Store
- BarRaider API Ninja plugin — https://barraider.com/  (for dynamic STATUS button)
- BurntToast PowerShell module — for toast notifications:
  ```powershell
  Install-Module -Name BurntToast -Force
  ```

**Software — WSL2 side**:
- Node.js 18+ (via nvm recommended)
- God Agent project at `/home/dalton/projects/claudeflow-testing`
- God Agent services running (`/god-launch start`)

---

## Initial Setup (WSL2 Side)

1. Open a WSL2 terminal and run:

   ```bash
   cd /home/dalton/projects/claudeflow-testing/streamdeck
   bash setup.sh
   ```

   This will:
   - Make all 33 scripts executable
   - Verify `GOD_AGENT_DIR` exists
   - Check Node.js, npx, and PowerShell interop
   - Print both page layouts for reference

2. Verify the output shows all green checkmarks. If `powershell.exe` is not found, WSL2 interop may be disabled — check `/etc/wsl.conf` has `[interop] enabled = true`.

3. The WSL2 path to scripts is:
   ```
   /home/dalton/projects/claudeflow-testing/streamdeck/scripts/
   ```

   The Windows-equivalent path (for Stream Deck app) is:
   ```
   \\wsl$\Ubuntu\home\dalton\projects\claudeflow-testing\streamdeck\scripts\
   ```

---

## Stream Deck App Configuration

There are three execution modes. Each button uses one:

### Interactive Buttons (opens a Windows Terminal tab)

In Stream Deck app:
1. Drag **"Open"** action onto the key
2. Set **App/File**: `wt.exe`
3. Set **Arguments**: `-p "God Agent" wsl -e /home/dalton/projects/claudeflow-testing/streamdeck/scripts/<SCRIPT>.sh`

This opens a new Windows Terminal tab with the "God Agent" profile (create this profile in WT Settings → Add new profile → name it "God Agent", set command to `wsl.exe`).

**Buttons using this mode**: ASK, CODE, RESEARCH, WRITE, QUERY, PDF SCAN, COMPLETE, and all Page 2 interactive commands.

### Background Buttons (runs silently, notifies via toast)

In Stream Deck app:
1. Drag **"Open"** action onto the key
2. Set **App/File**: `wsl.exe`
3. Set **Arguments**: `-e /home/dalton/projects/claudeflow-testing/streamdeck/scripts/<SCRIPT>.sh`

No terminal window opens. Results come as Windows toast notifications.

**Buttons using this mode**: LEARN, START, STOP, ABORT, all feedback presets, and Page 2 background commands.

### WebLink Buttons (opens URL in browser)

In Stream Deck app:
1. Drag **"Website"** action onto the key
2. Set **URL**: `http://localhost:3847`

No WSL involved at all.

**Buttons using this mode**: DASH (dashboard)

---

## Page 1 — Main Commands

```
  ┌──────────┬──────────┬──────────┬──────────┬──────────┐
  │ STATUS   │   ASK    │   CODE   │ RESEARCH │  WRITE   │
  │ (API*)   │ (intctv) │ (intctv) │ (intctv) │ (intctv) │
  ├──────────┼──────────┼──────────┼──────────┼──────────┤
  │  LEARN   │  QUERY   │ PDF SCAN │ COMPLETE │ FEEDBACK │
  │  (bkgd)  │ (intctv) │ (intctv) │ (intctv) │ (folder) │
  ├──────────┼──────────┼──────────┼──────────┼──────────┤
  │  START   │   STOP   │   DASH   │  ABORT   │ PAGE 2 → │
  │  (bkgd)  │  (bkgd)  │ (weblink)│  (bkgd)  │ (folder) │
  └──────────┴──────────┴──────────┴──────────┴──────────┘
```

| # | Button | Script | Mode | What it does |
|---|--------|--------|------|--------------|
| 1 | **STATUS** | — | API-polled | Dynamic health indicator (see [API Ninja section](#dynamic-status-indicator-api-ninja)) |
| 2 | **ASK** | `god-ask.sh` | Interactive | Ask the God Agent anything (DAI-001 auto-routes) |
| 3 | **CODE** | `god-code.sh` | Interactive | Generate code via 48-agent coding pipeline |
| 4 | **RESEARCH** | `god-research.sh` | Interactive | Deep research via DAI-002 PhD pipeline |
| 5 | **WRITE** | `god-write.sh` | Interactive | Academic writing with style profile + quality gauntlet |
| 6 | **LEARN** | `god-learn.sh` | Background | Store clipboard content as knowledge |
| 7 | **QUERY** | `god-query.sh` | Interactive | Search stored knowledge |
| 8 | **PDF SCAN** | `god-pdf-analyze.sh` | Interactive | Analyze a PDF (prompts for file path) |
| 9 | **COMPLETE** | `god-complete-section.sh` | Interactive | Complete a dissertation section (prompts for section + context) |
| 10 | **FEEDBACK** | — | Folder | Opens 5-button feedback sub-page |
| 11 | **START** | `god-launch-start.sh` | Background | Start all God Agent services (Multi-Action, see below) |
| 12 | **STOP** | `god-launch-stop.sh` | Background | Stop all services |
| 13 | **DASH** | — | WebLink | Open dashboard at `http://localhost:3847` |
| 14 | **ABORT** | `god-abort-pipeline.sh` | Background | Emergency kill any running pipeline |
| 15 | **PAGE 2** | — | Folder | Navigate to Research & Learning page |

---

## Page 2 — Research & Learning

```
  ┌──────────┬──────────┬──────────┬──────────┬──────────┐
  │ LOCAL    │ GROUNDED │ HYBRID   │ SYNTH    │ STYLE    │
  │ RESEARCH │ RESEARCH │ RESEARCH │ CHAPTERS │ STATUS   │
  ├──────────┼──────────┼──────────┼──────────┼──────────┤
  │ LEARN    │ LEARN    │ LEARN    │ CODE     │ SITREP   │
  │ UPDATE   │ COMPILE  │ VERIFY   │ PIPELINE │          │
  ├──────────┼──────────┼──────────┼──────────┼──────────┤
  │ANALYTICS │  COSTS   │ QUALITY  │ SVC STAT │ ← PAGE 1 │
  └──────────┴──────────┴──────────┴──────────┴──────────┘
```

| # | Button | Script | Mode | What it does |
|---|--------|--------|------|--------------|
| 1 | **LOCAL RESEARCH** | `god-research-local.sh` | Interactive | Corpus-only research (no web) |
| 2 | **GROUNDED RESEARCH** | `god-research-grounded.sh` | Interactive | Corpus ground truth + Perplexity enrichment |
| 3 | **HYBRID RESEARCH** | `god-research-hybrid.sh` | Interactive | Local-first + conditional external supplementation |
| 4 | **SYNTH CHAPTERS** | `god-synthesize-chapters.sh` | Interactive | Merge two dissertation chapters |
| 5 | **STYLE STATUS** | `god-style-status.sh` | Background | Show available writing style profiles |
| 6 | **LEARN UPDATE** | `god-learn-update.sh` | Background | Compile + query-conditioned retrieval & promotion |
| 7 | **LEARN COMPILE** | `god-learn-compile.sh` | Background | Phase 1-3 substrate compilation only |
| 8 | **LEARN VERIFY** | `god-learn-verify.sh` | Background | Verify ingest + knowledge artifacts |
| 9 | **CODE PIPELINE** | `god-code-pipeline.sh` | Interactive | Full 48-agent coding pipeline (prompts for task) |
| 10 | **SITREP** | `god-sitrep.sh` | Interactive | Situation report of current project state |
| 11 | **ANALYTICS** | `god-analytics.sh` | Background | Show routing analytics |
| 12 | **COSTS** | `god-costs.sh` | Background | Show API cost tracking |
| 13 | **QUALITY** | `god-quality.sh` | Background | Show quality metrics |
| 14 | **SVC STATUS** | `god-launch-status.sh` | Background | Check service health |
| 15 | **PAGE 1** | — | Folder | Navigate back to main page |

---

## Feedback Folder

When you press FEEDBACK on Page 1, a sub-page opens with 5 preset buttons:

| Button | Rating | Script | Aligned to |
|--------|--------|--------|------------|
| PERFECT | 1.0 | `feedback/feedback-perfect.sh` | Full SoNA EWC++ gradient |
| GOOD | 0.8 | `feedback/feedback-good.sh` | Strong positive signal |
| MEH | 0.5 | `feedback/feedback-meh.sh` | Neutral |
| POOR | 0.2 | `feedback/feedback-poor.sh` | Negative signal |
| FAIL | 0.0 | `feedback/feedback-fail.sh` | Full negative gradient |

**How to use**:
1. After any God Agent interaction, a trajectory ID is printed (e.g., `trj_abc123`)
2. Copy the trajectory ID to your clipboard
3. Press FEEDBACK → press the rating button
4. The script reads the ID from clipboard and submits the feedback
5. A toast notification confirms the submission

This closes the feedback loop for SoNA trajectory learning — the agent improves from your ratings.

---

## Dynamic Status Indicator (API Ninja)

The STATUS button (row 1, col 1) uses **BarRaider API Ninja** to poll the health endpoint and change the button icon color dynamically.

### Setup in Stream Deck app:

1. Install BarRaider API Ninja plugin from the Stream Deck Store
2. Drag "API Ninja" action onto the STATUS key position
3. Configure:
   - **URL**: `http://localhost:3847/api/health`
   - **Method**: GET
   - **Poll Interval**: 5 seconds
   - **Response Handling**: Parse JSON → `$.status`

4. Create 3 icon images (72x72 PNG recommended):
   - `status-green.png` — green circle/indicator
   - `status-yellow.png` — yellow circle/indicator
   - `status-red.png` — red circle/indicator

5. Set icon mapping rules:
   - Response `"healthy"` → green icon
   - Response `"degraded"` → yellow icon
   - **Connection refused / timeout / any error** → red icon (this is critical — crashed daemons must show red, not yellow)

### Color semantics:
- **Green**: All services running, ready for commands
- **Yellow**: ONLY during 30-second startup window (see START button Multi-Action)
- **Red**: Services down, errored, or unreachable

---

## START Button Multi-Action

The START button uses a Stream Deck **Multi-Action** to solve a timing problem: when you press START, the services take time to boot. During this window, the API Ninja poller would show red (connection refused). The Multi-Action forces a 30-second yellow override:

### Setup:
1. Drag "Multi Action" onto the START key
2. Add these actions in order:
   - **Action 1**: Set API Ninja icon to `status-yellow.png` (static override)
   - **Action 2**: Open → `wsl.exe -e /path/to/scripts/god-launch-start.sh`
   - **Action 3**: Delay → 30 seconds
   - **Action 4**: Release API Ninja back to polling mode (set back to API Ninja action)

This gives services 30 seconds to start. After that, the poller takes over — if the daemon crashed during startup, it correctly shows red.

---

## Pipeline Abort System

The ABORT button is an emergency kill switch for long-running pipelines (writing, coding, research).

**How it works (two layers)**:

1. **File sentinel**: Pressing ABORT runs `touch .god-agent/abort-pipeline`
2. **fs.watch detection**: The pipeline orchestrator watches the `.god-agent/` directory. When the sentinel appears, it fires an `AbortController`, which:
   - Severs active HTTP connections to Anthropic/vLLM immediately (via `AbortSignal.any()`)
   - Returns partial results instead of losing all progress
   - Cleans up the sentinel file

For CPU-bound stages where the event loop is blocked (e.g., parsing), the orchestrator calls `checkSync()` at each stage boundary as a backup check.

**Usage**: Just press the ABORT button. You'll get a toast notification confirming the signal was sent. The pipeline stops at the next opportunity (usually within 1-2 seconds).

**Stale sentinels**: If a sentinel file is older than 5 minutes (from a previous abort that wasn't cleaned up), the system automatically removes it on the next pipeline start.

---

## Execution Modes Explained

### Interactive (`wt.exe`)
```
wt.exe -p "God Agent" wsl -e /path/to/script.sh
```
Opens a new **Windows Terminal** tab. The script runs inside it — you see output, can type input, and the tab stays open until you press a key (`god_wait`). Used for commands that produce readable output or need user input.

**Windows Terminal profile setup**: Open Windows Terminal → Settings → Add new profile → Name: "God Agent" → Command line: `wsl.exe` → Appearance: pick a color scheme. This is optional but gives you a visually distinct tab.

### Background (`wsl.exe`)
```
wsl.exe -e /path/to/script.sh
```
Runs completely hidden. No window appears. Results are delivered via Windows toast notifications (BurntToast). Used for fire-and-forget commands (learn, start/stop, feedback).

### WebLink (native)
Uses Stream Deck's built-in **Website** action. Opens a URL in your default browser. No WSL involved. Used only for the dashboard.

### Folder (native)
Uses Stream Deck's built-in **Create Folder** action. Opens a sub-page of buttons. Used for FEEDBACK (5 preset buttons) and PAGE 2 navigation.

### API-Polled (BarRaider)
Uses BarRaider API Ninja plugin. Polls an HTTP endpoint and changes the button icon based on the response. Used only for STATUS.

---

## Clipboard Workflow

Many scripts use the clipboard as input. This is the primary interaction pattern:

1. **Copy your prompt/question/content** to clipboard (Ctrl+C in any Windows app)
2. **Press the Stream Deck button**
3. The script reads the clipboard via `powershell.exe Get-Clipboard`
4. If clipboard is empty, interactive scripts fall back to a terminal `read` prompt; background scripts show a toast error

**Examples**:
- Copy "What is Aristotle's concept of phantasia?" → press ASK
- Copy a paragraph of text → press LEARN
- Copy a trajectory ID → press FEEDBACK → PERFECT
- Copy a PDF path → press PDF SCAN

---

## Toast Notifications

Background commands communicate via Windows toast notifications (BurntToast module).

**Install BurntToast** (one-time, in PowerShell as admin):
```powershell
Install-Module -Name BurntToast -Force
```

Toast notifications appear in the Windows notification center. They show:
- Command name (e.g., "God Agent")
- Result message (e.g., "Knowledge stored", "Services started", "Abort signal sent")

If BurntToast is not installed, scripts still run — toasts are fired with `2>/dev/null &` so failures are silent.

---

## Customization

### Changing GOD_AGENT_DIR

Edit `streamdeck/scripts/_common.sh` line 3:
```bash
export GOD_AGENT_DIR="/your/path/here"
```

### Adding a new button

1. Create `streamdeck/scripts/god-<name>.sh`:
   ```bash
   #!/bin/bash
   source "$(dirname "$0")/_common.sh"
   god_cd
   # Your command here
   god_wait  # for interactive, or god_toast for background
   ```

2. Make it executable: `chmod +x streamdeck/scripts/god-<name>.sh`

3. Assign it to a key in the Stream Deck app using the appropriate execution mode.

### Custom icons

Place 72x72 PNG icons in `streamdeck/icons/`. The profile JSONs reference icon filenames — update them if you create custom icons.

---

## Troubleshooting

### "Command not found" or "npx not found"
The script can't find Node.js. `_common.sh` includes nvm PATH resolution, but if your nvm is installed in a non-standard location, edit lines 6-8 of `_common.sh`.

### Toast notifications don't appear
1. Verify BurntToast: `powershell.exe -Command "Get-Module -ListAvailable BurntToast"`
2. Check Windows notification settings — "Focus Assist" or "Do Not Disturb" may suppress them

### Clipboard is empty / wrong content
The clipboard is read once at script start. If you press a button before copying, you'll get the old clipboard content. Always copy first, then press.

### ABORT doesn't stop the pipeline immediately
The abort works at stage boundaries. If the LLM is mid-response on a long generation, the abort fires after the current HTTP call resolves (or is severed if the signal propagates to `fetch()`). In practice this is 1-2 seconds.

### STATUS button stays red after starting services
Services take time to boot. The START Multi-Action forces 30s yellow. If STATUS is still red after 30s, check service logs:
```bash
cd /home/dalton/projects/claudeflow-testing
cat logs/chroma.log
cat logs/embedder.log
```

### "God Agent" Windows Terminal profile not found
Create it: Windows Terminal → Settings → Add new profile → Name: `God Agent` → Command line: `wsl.exe`. If you skip this, `wt.exe -p "God Agent"` falls back to your default profile (still works, just less visually distinct).

### Scripts work in terminal but not from Stream Deck
Stream Deck launches scripts in a non-interactive, non-login shell. `_common.sh` handles nvm PATH injection, but other tools may need their paths added. Check `which <tool>` in a WSL shell vs what the script sees.

---

## File Reference

```
streamdeck/
├── HOW-TO-GUIDE.md          ← This file
├── setup.sh                  ← Run once to initialize
├── profiles/
│   ├── god-agent-page1.json  ← Page 1 button definitions
│   └── god-agent-page2.json  ← Page 2 button definitions
└── scripts/
    ├── _common.sh            ← Shared utilities (GOD_AGENT_DIR, input, toast, etc.)
    ├── god-ask.sh
    ├── god-code.sh
    ├── god-write.sh
    ├── god-research.sh
    ├── god-learn.sh
    ├── god-query.sh
    ├── god-status.sh
    ├── god-abort-pipeline.sh
    ├── god-launch-start.sh
    ├── god-launch-stop.sh
    ├── god-launch-status.sh
    ├── god-pdf-analyze.sh
    ├── god-complete-section.sh
    ├── god-research-local.sh
    ├── god-research-grounded.sh
    ├── god-research-hybrid.sh
    ├── god-synthesize-chapters.sh
    ├── god-style-status.sh
    ├── god-learn-update.sh
    ├── god-learn-compile.sh
    ├── god-learn-verify.sh
    ├── god-code-pipeline.sh
    ├── god-sitrep.sh
    ├── god-analytics.sh
    ├── god-costs.sh
    ├── god-quality.sh
    ├── god-write-gold.sh
    ├── god-write-quick.sh
    └── feedback/
        ├── feedback-perfect.sh  (1.0)
        ├── feedback-good.sh     (0.8)
        ├── feedback-meh.sh      (0.5)
        ├── feedback-poor.sh     (0.2)
        └── feedback-fail.sh     (0.0)
```

Abort mechanism (in main codebase):
```
src/god-agent/core/abort/
├── pipeline-abort.ts    ← PipelineAbortController + PipelineAbortError
└── index.ts             ← Barrel export

Modified files:
├── src/god-agent/core/composition/model-router.ts          ← abortSignal threading
├── src/god-agent/universal/write-pipeline-orchestrator.ts   ← abort integration
└── src/god-agent/core/pipeline/coding-pipeline-orchestrator.ts  ← abort integration
```
