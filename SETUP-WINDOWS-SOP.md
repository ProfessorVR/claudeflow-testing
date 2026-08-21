# God Agent — Windows Setup SOP

A step-by-step guide to install and run the **God Agent** research/writing system on a
Windows 11 PC. Every command is copy-paste ready. Follow the parts in order.

> **Target machine profile:** Intel Core Ultra 9 285H (Intel Arc integrated graphics),
> 32 GB RAM, 1 TB SSD. This machine has **no NVIDIA/CUDA GPU**, so this SOP uses the
> **CPU + cloud-Claude** path — everything runs locally except the AI model calls, which
> go to Anthropic's Claude. (If you ever move to a machine with a big NVIDIA GPU, see
> **Appendix A** to add the local coding model.)

---

## 0. What you are installing (read this first — 2 min)

The God Agent is a **Linux program.** It is built from Node.js/TypeScript services plus a
Python embedding server, and it uses Unix sockets and bash launchers. It does **not** run
on native Windows — it runs inside **WSL2** (Windows Subsystem for Linux), which is a real
Ubuntu Linux running inside Windows. Part A installs that.

**The moving parts once installed:**

| Piece | What it does | Where it runs |
|-------|--------------|---------------|
| **Claude Code** (CLI) | The interface you type into. Interprets `/god-write`, `/god-ask`, etc. | Your Claude **Pro subscription** |
| **God Agent CLI** | The pipeline behind those commands (drafting, quality checks, citations) | Calls the Anthropic **API** |
| **Embedding server** | Turns your documents into searchable vectors | Local, **CPU** |
| **ChromaDB** | Local vector database that stores those vectors | Local, on disk |
| **4 daemons** (memory / core / UCM / observability) | Coordination + learning + a status dashboard | Local |

### ⚠️ The one cost surprise to understand up front

There are **two separate Claude charges**, and you need **both**:

1. **Claude Pro — $20/month.** This powers **Claude Code**, the app you type commands into.
   Start here (recommended).
2. **Anthropic API credit — pay-as-you-go (start with ~$5–$10).** The God Agent's writing
   and research pipeline calls Claude *directly through the API*, which is billed separately
   from the Pro subscription. Without an API key + a little credit, `/god-write`,
   `/god-research`, and `/god-ask` will fail with a "key not loaded" error.

You set up **both** in Part B. Everything else (embedding, database, search) is free and local.

---

## 1. Prerequisites checklist

| Requirement | Version | Where to get it |
|-------------|---------|-----------------|
| Windows 11 (or Windows 10 22H2) | — | already installed |
| WSL2 + Ubuntu 24.04 | latest | Part A (built into Windows) |
| Node.js | 22 LTS | Part A (via nvm) |
| Python | 3.10+ (Ubuntu's default is fine) | Part A |
| Git | any | Part A |
| Claude Pro subscription | — | https://claude.ai/upgrade |
| Claude Code CLI | latest | Part B |
| Anthropic API key + credit | — | https://console.anthropic.com |
| Perplexity API key *(optional)* | — | https://www.perplexity.ai/settings/api |

Total download footprint is roughly **6–8 GB** (WSL, Node, Python packages, and a one-time
~3 GB embedding-model download on first run). You have plenty of room on a 1 TB SSD.

---

## Part A — One-time Windows / Linux setup

### A1. Install WSL2 + Ubuntu

Open **PowerShell as Administrator** (Start → type "PowerShell" → right-click → *Run as
administrator*) and run:

```powershell
wsl --install -d Ubuntu-24.04
```

This installs WSL2 and Ubuntu 24.04. **Reboot when it asks.** After reboot, Ubuntu opens and
asks you to create a **Linux username and password** — pick anything and **write it down**
(you'll need the password for `sudo`).

> If `wsl --install` says it's already installed, just run `wsl --install -d Ubuntu-24.04`
> to add the Ubuntu distro. Docs: https://learn.microsoft.com/windows/wsl/install

From now on, **every command below is typed inside the Ubuntu terminal** (open it any time
from the Start menu → "Ubuntu"), *not* PowerShell.

### A2. Update Ubuntu and install base tools

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl build-essential python3 python3-venv python3-pip tmux poppler-utils
```

### A3. Install Node.js 22 (via nvm)

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 22 && nvm alias default 22
```

Verify:

```bash
node --version   # should print v22.x
npm --version
```

### A4. Verify Python

```bash
python3 --version   # 3.10, 3.11, or 3.12 are all fine
```

---

## Part B — Accounts, subscription, and API keys

### B1. Get Claude Pro ($20/month) and install Claude Code

1. Go to **https://claude.ai/upgrade** and subscribe to **Claude Pro** ($20/month).
2. Install the Claude Code CLI inside Ubuntu:

   ```bash
   npm install -g @anthropic-ai/claude-code
   ```

3. Log in with your Pro account:

   ```bash
   claude
   ```

   The first run prints a link — open it in your browser, approve, and you're logged in.
   Type `/exit` to leave for now. (Install docs: https://docs.anthropic.com/en/docs/claude-code/overview)

### B2. Get an Anthropic API key + add credit (required for the pipeline)

1. Go to **https://console.anthropic.com** and sign in (same account is fine).
2. Left menu → **Billing** → add a small amount of credit (**$5–$10** is plenty to start).
3. Left menu → **API Keys** → **Create Key** → copy the key (starts with `sk-ant-...`).
   **Save it somewhere safe — you can't see it again.**

You'll paste this key into the project's `.env` file in Part D.

### B3. (Optional) Perplexity API key — only for external web research

The `/god-research` external-web features use Perplexity. If you only need corpus-based
writing/research, skip this. Otherwise get a key at
https://www.perplexity.ai/settings/api (starts with `pplx-...`).

---

## Part C — Get the God Agent code

You will receive an invitation to a **private GitHub repository** (see the note from the
sender). First, connect Git to GitHub, then clone.

### C1. Sign in to GitHub from Ubuntu

Install the GitHub CLI and log in (easiest method — handles all auth):

```bash
sudo apt install -y gh
gh auth login
```

Choose **GitHub.com → HTTPS → Login with a web browser**, and paste the one-time code it
shows into the page that opens.

### C2. Clone the repository

```bash
cd ~
gh repo clone <OWNER>/<REPO-NAME> god-agent
cd god-agent
```

> Replace `<OWNER>/<REPO-NAME>` with the actual repo path from your invite
> (for example `ProfessorVR/god-agent`).

---

## Part D — Install dependencies and configure

Run all of these from inside `~/god-agent`.

### D1. Install Node dependencies

```bash
npm install
```

### D2. Create the Python environment and install the embedding server

Install the **CPU build of PyTorch first** (smaller, no GPU drivers needed), then the rest:

```bash
python3 -m venv ~/.venv
source ~/.venv/bin/activate
pip install --upgrade pip
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r embedding-api/requirements.txt
deactivate
```

> This installs ChromaDB and the sentence-transformers embedding stack. The embedding
> **model itself (~3 GB) downloads automatically on first launch** in Part E, not now.

### D3. Configure your keys and CPU-mode settings

Create your `.env` from the template:

```bash
cp .env.example .env
nano .env
```

In `nano`, set the values below. (Paste with **right-click** or **Ctrl+Shift+V**; save with
**Ctrl+O**, Enter; exit with **Ctrl+X**.)

```bash
# --- Required: the pipeline's own Claude calls ---
ANTHROPIC_API_KEY=sk-ant-your-real-key-here

# --- Optional: external web research ---
PERPLEXITY_API_KEY=pplx-your-key-here-or-leave-placeholder

# --- CPU / cloud-Claude mode (this machine has no NVIDIA GPU) ---
# Turn OFF local-model-first routing so all AI goes to Claude instead of a
# local GPU model that isn't installed:
GOD_ROUTER_LOCAL_FIRST=false

# --- Local, free embeddings + local vector DB ---
EMBEDDING_BACKEND=local
VECTOR_DB=chroma
```

### D4. Build (optional but recommended)

```bash
npm run build
```

> The slash commands actually run the TypeScript source directly via `tsx`, so a failed
> build won't block you — but building once confirms everything compiled cleanly.

---

## Part E — Start the services

You start **two things**: the embedding server (+ ChromaDB), then the four daemons.
**vLLM is intentionally not started** — this machine routes AI to Claude instead.

### E1. Start the embedding server + ChromaDB

```bash
source ~/.venv/bin/activate
./embedding-api/api-embed.sh start
```

**First run only:** it downloads the ~3 GB embedding model — this can take several minutes.
When it prints `Ready`, confirm both are healthy:

```bash
curl -s http://127.0.0.1:8000/health        # embedding API
curl -s http://127.0.0.1:8001/api/v1/heartbeat   # ChromaDB
```

### E2. Start the four God Agent daemons

```bash
npm run god-agent:start
```

You should see `ok` next to Memory Server, Core Daemon, UCM Daemon, and Observability.
The status dashboard is at **http://localhost:3847**.

### E3. Check status any time

```bash
npm run god-agent:status
./embedding-api/api-embed.sh status
```

To stop everything later:

```bash
npm run god-agent:stop
./embedding-api/api-embed.sh stop
```

---

## Part F — First run & verification

### F1. Ask the agent a question (no corpus needed)

```bash
npx tsx src/god-agent/universal/cli.ts ask "Explain what this system does in two sentences."
```

If you get a coherent answer, your API key and pipeline are working. ✅

### F2. Add a document and search it

Drop a `.pdf`, `.txt`, or `.md` file into the `corpus/` folder, then ingest it:

```bash
# from Windows you can also copy files into:  \\wsl$\Ubuntu-24.04\home\<you>\god-agent\corpus
npx tsx src/god-agent/universal/cli.ts ingest corpus/
```

### F3. Use it inside Claude Code (the main way you'll work)

```bash
claude
```

Then, at the Claude Code prompt, use the slash commands, e.g.:

```
/god-ask What are the main themes across my ingested documents?
/god-write A 500-word summary of <your topic>
```

> If a command reports services aren't running, re-run Part E and check the two `curl`
> health commands.

---

## Part G — Day-to-day usage

| You want to… | Command (inside `claude`, or as `/…`) |
|--------------|----------------------------------------|
| Ask a question | `/god-ask <your question>` |
| Draft writing (corpus-cited) | `/god-write <topic or instruction>` |
| Deep research | `/god-research <question>` |
| Analyze a PDF | `/god-pdf-analyze <path>` |
| Add documents | `npx tsx src/god-agent/universal/cli.ts ingest corpus/` |
| Check system health | `/god-status` or `npm run god-agent:status` |
| Start/stop services | Part E commands |

**Every new work session:** open Ubuntu, then:

```bash
cd ~/god-agent
source ~/.venv/bin/activate
./embedding-api/api-embed.sh start
npm run god-agent:start
claude
```

---

## Part H — Train your own writing style

The package ships **without any trained writing styles** — you train your own from your own
writing samples. Put a few representative PDFs/documents of *your* prose in a folder and run:

```bash
/god-learn-style my-style path/to/your/writing-samples
```

Then check it registered:

```bash
/god-style-status
```

Once trained, `/god-write` will draft in your voice.

> **This step is 100% local, CPU-only, and free.** Style training reads your documents and
> measures how you write — sentence rhythm, vocabulary, active/passive voice, Latinate-vs-Germanic
> word choice, and the *Analyzing Prose* (Lanham) clause diagnostics. It's pure text analysis: no
> GPU, no vector database, and **no API credit is consumed**. It runs in seconds even on this
> integrated-graphics machine. The only requirement is that PDFs contain *real selectable text*
> (not scanned images) — `poppler-utils`, installed in Part A2, handles the extraction.

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `ANTHROPIC_API_KEY not loaded` / `[TASK_QUEUED]` | Key missing or unfunded. Check `.env` has a real `sk-ant-...` key and that Console → Billing has credit. Then restart services (Part E). |
| `/god-write` says services down | Run the two `curl` health checks in E1. If they fail, `./embedding-api/api-embed.sh restart`. |
| Port already in use (8000/8001/3847) | `./embedding-api/api-embed.sh stop` then `start`; for daemons `npm run god-agent:stop` then start. |
| Embedding model download is slow/stuck | It's a one-time ~3 GB pull from Hugging Face; give it time on first launch. Re-run `./embedding-api/api-embed.sh start` if interrupted. |
| `node: command not found` in a new terminal | Run `nvm use 22` (nvm loads per-shell; it's set as default so a fresh Ubuntu window should pick it up). |
| Python errors on `pip install` | Make sure the venv is active (`source ~/.venv/bin/activate`) and retry. |
| Claude Code won't log in | Re-run `claude` and use the browser link; confirm your Pro subscription is active. |

---

## Appendix A — Optional: machines WITH an NVIDIA GPU (local coding model)

Skip this on the target laptop (integrated graphics only). On a machine with a **large NVIDIA
GPU (24 GB+ VRAM, e.g. RTX 3090/4090/5090)** you can additionally run the local
**Qwen2.5-Coder-32B** model via vLLM so coding/OCR tasks don't hit the API:

1. Install NVIDIA drivers + CUDA in WSL (https://docs.nvidia.com/cuda/wsl-user-guide/) and vLLM
   (`pip install vllm`).
2. In `.env` set `GOD_ROUTER_LOCAL_FIRST=true` and keep `VLLM_BASE_URL=http://localhost:8002`.
3. Start the full stack (this also starts vLLM in a tmux session):

   ```bash
   ./scripts/god-launch start
   ```

The embedding server can also use the GPU automatically when CUDA is present, which speeds up
ingestion. **None of this applies to a CPU-only / integrated-graphics machine** — there, the
CPU path in Parts E–F is the correct and complete setup.

---

## Appendix B — Cost summary

| Item | Cost | Required? |
|------|------|-----------|
| Claude Pro subscription | **$20 / month** | Yes — runs Claude Code |
| Anthropic API credit | **pay-as-you-go, ~$5–$10 to start** | Yes — runs the writing/research pipeline |
| Perplexity API | pay-as-you-go | Optional — external web research only |
| Everything else (WSL, Node, Python, embeddings, ChromaDB, the corpus) | **Free / local** | — |

Start with **Claude Pro ($20)** + **~$5 of API credit**, then top up the API balance only if
heavy use draws it down.
