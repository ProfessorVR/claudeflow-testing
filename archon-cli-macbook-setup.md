# Archon CLI — MacBook Air (Apple Silicon) Setup Guide

Setup plan for **`ste-bah/archon-cli` v1.3.11** on a brand-new Mac with nothing installed.
Target: Apple Silicon (M-series, `aarch64`). Written 2026-06-24.

---

## What this is

`archon-cli` is a **self-learning agent platform written in Rust** — a 26-crate Cargo
workspace. It is a *separate* project from the Node/Python "God Agent"; same concept
(persistent memory, multi-agent pipelines, evidence/provenance, document + video
intelligence, governed learning), different implementation.

**Why a fresh Mac is easy:** it is almost entirely **self-contained**. Memory (CozoDB
graph), the vector store (RocksDB), and local embeddings (fastembed/ONNX — model is
auto-downloaded on first use) are all compiled into the single `archon` binary. The
browser workbench is embedded too.

- **No local model servers needed** — no vLLM, ChromaDB, or embedding server.
- **No Node.js needed** for normal use (the web UI is pre-built and embedded).
- LLM inference is **cloud** (Anthropic / OpenAI Codex / Google), so you just need
  credentials.

---

## 1. Prerequisites — what to install on the blank Mac

| # | Install | Why | Needed for |
|---|---|---|---|
| 1 | **Full Xcode** (Mac App Store) — you need it for iOS app development | Also provides `clang`/`cc`, `git`, `make`, linker, so it satisfies Archon's build toolchain too. After install: `sudo xcodebuild -license accept` + `sudo xcodebuild -runFirstLaunch`. The standalone Command Line Tools are then optional (Homebrew's installer adds them automatically if anything still needs them). | **Required** to build from source |
| 2 | **Homebrew** (brew.sh) | macOS package manager for the helper tools | **Required** |
| 3 | **Rust** via rustup | Compiles the workspace (edition 2024, needs **Rust 1.85+**) | **Required** to build from source |
| 4 | **poppler, tesseract, ffmpeg, yt-dlp, whisper-cpp** (brew, via the repo's installer) | PDF text/image extraction, OCR, video/audio ingest + local transcription | **Required for docs/video features**; not for plain chat |
| 5 | **Anthropic credentials** (Claude OAuth *or* `ANTHROPIC_API_KEY`) | The actual LLM | **Required to do anything useful** |
| — | **cmake** (brew) | Only if building the **MLX** world-model backend (`mlx-rs` builds the MLX C++ core) | Optional (MLX only) |
| — | Python 3 + pip | Optional RapidOCR/OpenCV ingest fallbacks & "Trading Lab" tools | Optional |
| — | Docker Desktop | Optional command-sandbox backend | Optional |
| — | Node.js 22+ | Only to *rebuild* the web UI (already embedded) | Optional |
| — | OpenAI Codex OAuth / Google Gemini key | Alternate LLM provider / cloud vision for docs | Optional |

> **Key nuance:** items **1 + 3 are the only things needed to compile.** The brew helper
> tools (item 4) are **runtime** tools for the document/video features, not build
> dependencies. (Confirmed against the project's macOS CI lane, which builds with just
> Xcode CLT + rustup.)

---

## 2. Two ways to get it running

| | **Path A — build from source** *(recommended)* | **Path B — prebuilt binary** *(fastest to running)* |
|---|---|---|
| Time | ~15–40 min first compile (see note) | ~5–10 min, mostly download |
| Pros | Matches source exactly; clone is needed anyway for project-init assets + dev scripts; no Gatekeeper friction; **only path that can enable MLX** | Skips the whole compile |
| Cons | Long first build | Must clear macOS quarantine; still need the clone + brew tools; **cannot use MLX** |

There **is** a prebuilt Apple-Silicon binary on the latest release
(`archon-v1.3.11-aarch64-apple-darwin.tar.gz`), despite the README saying "no precompiled
binaries." So Path B is real.

> **Build-time reality:** the README claims "3–4 minutes" — optimistic for this dependency
> tree (it compiles RocksDB/C++, vendored OpenSSL, SQLite, tree-sitter, wasmtime, russh,
> libgit2, then a single-codegen-unit **LTO** link). On an M-series Air expect roughly
> **15–40 minutes** for the first clean `--release` build; it may thermally throttle
> (fanless) so keep it on power. Incremental rebuilds are fast. A debug build
> (`cargo build --bin archon`, no `--release`) compiles **much** faster if you just want
> to try it.

---

## 3. Path A — build from source (full copy-paste)

```bash
# 1) Xcode — you're doing iOS development, so install the FULL Xcode from the Mac App Store
#    (large ~40 GB download — kick it off first and let it run). After it finishes, run:
sudo xcodebuild -license accept
sudo xcodebuild -runFirstLaunch            # installs additional required components
xcode-select -p                            # should print /Applications/Xcode.app/Contents/Developer
#    Full Xcode supplies the clang/Rust build toolchain, so a separate `xcode-select --install`
#    is NOT needed. (If some tool ever complains the Command Line Tools are missing, the
#    Homebrew installer in step 2 adds them automatically.)

# 2) Homebrew, then put it on PATH (Apple Silicon installs to /opt/homebrew)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# 3) Rust (stable; rustup)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
source "$HOME/.cargo/env"
rustc --version          # expect 1.86 or newer

# 4) Clone the repo
mkdir -p ~/projects && cd ~/projects
git clone https://github.com/ste-bah/archon-cli
cd archon-cli

# 5) Runtime helper tools (PDF/OCR/video). NOTE: NO sudo on macOS — it uses brew.
scripts/install-system-deps.sh           # installs poppler tesseract ffmpeg yt-dlp whisper-cpp
scripts/install-system-deps.sh --check   # verify all present

# 6) Build the release binary and put it on PATH
cargo build --release --bin archon       # add --features mlx-metal here ONLY if you want MLX (see §5)
cargo install --path .                    # installs `archon` to ~/.cargo/bin (already on PATH)
archon --version                          # expect: archon 1.3.11 (<short-sha>)

# 7) Authenticate — choose ONE
archon auth login --provider anthropic    # Claude OAuth (if you have a Claude subscription)
#   …or use an API key:
#   export ANTHROPIC_API_KEY="sk-ant-api..."   (add to ~/.zshrc to persist)
archon auth status

# 8) Scaffold a working project (copies skills/templates/game-theory specs from the clone)
mkdir -p ~/projects/my-archon-project
sh scripts/archon-init.sh \
  --target ~/projects/my-archon-project \
  --archon-cli-repo "$(pwd)"

# 9) Run it from the project root
cd ~/projects/my-archon-project
archon                                     # interactive TUI
# archon -p "summarize this project layout" --output-format json   # non-interactive
# archon web --port 8421 --bind-address 127.0.0.1                   # browser workbench
```

---

## 4. Path B — prebuilt binary (fast alternative)

You still want the repo clone (for `archon-init.sh` assets) and the brew tools (steps 1, 2,
4 above), but you skip Rust + the compile:

```bash
cd ~/Downloads
# Needs GitHub CLI (brew install gh) — or just download from the Releases page in a browser
gh release download v1.3.11 --repo ste-bah/archon-cli \
  --pattern 'archon-v1.3.11-aarch64-apple-darwin.tar.gz*'
shasum -a 256 -c archon-v1.3.11-aarch64-apple-darwin.tar.gz.sha256   # verify integrity
tar -xzf archon-v1.3.11-aarch64-apple-darwin.tar.gz
sudo mv archon-v1.3.11-aarch64-apple-darwin/archon /usr/local/bin/archon

# macOS Gatekeeper blocks downloaded binaries — clear quarantine, or it dies with "killed"
xattr -dr com.apple.quarantine /usr/local/bin/archon
codesign --force --sign - /usr/local/bin/archon       # re-sign ad-hoc if it still won't run
archon --version
```

> The prebuilt binary is compiled with **no extra Cargo features**, so it **cannot use MLX**
> (see §5). Everything else works identically.

---

## 5. MLX / Apple Silicon GPU acceleration — read before deciding to compile

**Short answer:** "compile locally so you can use MLX" is *technically correct but narrow*.
MLX only matters if you specifically intend to train/run Archon's **local world-model
(JEPA) subsystem** on the Apple GPU. It does **nothing** for the core agent, chat, docs,
OCR, research pipelines, or embeddings.

### What MLX actually accelerates
- MLX is exposed as the `metal` backend of the **World Model** (`archon world …` commands —
  `train-jepa`, `eval-jepa`, etc.). This is an opt-in, policy-gated "advisory learning"
  layer that learns from Archon's own session/pipeline traces and predicts next-state /
  risk / retry-pressure / verification-need / plan-drift to advise the agent.
- The main LLM is **cloud** (Anthropic/OpenAI/Google). Embeddings use **ONNX/fastembed**.
  Neither uses MLX. So MLX has **zero** effect on normal usage.

### Three facts that matter
1. **MLX requires a source build with a feature flag.** It is gated behind the `mlx-metal`
   Cargo feature (pulls `mlx-rs = 0.25.3`). The prebuilt binary does **not** include it,
   and **plain `cargo build --release` does not either** — you must add `--features mlx-metal`.
2. **It's experimental.** The docs label the Metal/MLX backend **"Experimental … until
   validated on real hardware,"** with an unfilled validation checklist. JEPA Metal
   candidates need a hardware `JepaBackendExecutionReport` before they can "promote."
3. **CPU is the default and works fine.** The world model runs on CPU by default with
   `allow_cpu_fallback = true`. MLX just makes JEPA training faster — it is not required
   for the world-model feature to function.

### So is compiling locally "the recommended path"?
- **If your goal is to run Archon as an agent/research/docs tool (the normal case):** MLX is
  irrelevant. Choose Path A vs Path B on convenience grounds, **not** because of MLX.
- **If you specifically plan to train the local JEPA world-model on the GPU:** then yes,
  build from source — it's the only way to get MLX — but understand it's experimental and
  falls back to CPU.

Building from source is a good default **regardless** (documented happy path; you need the
clone anyway). Just don't treat MLX as a reason it's mandatory unless you'll use the
world-model.

### Enabling MLX (only if you want it)
```bash
brew install cmake                                        # mlx-rs builds the MLX C++ core
cd ~/projects/archon-cli
cargo build --release --bin archon --features mlx-metal
cargo install --path . --features mlx-metal
```
Then select the backend in config (`~/.config/archon/config.toml` or `<project>/.archon/config.toml`):
```toml
[learning.world_model.training]
backend = "auto"          # auto | cpu | cuda | metal  — "auto" prefers an available accelerator
allow_cpu_fallback = true
precision = "fp32"
```
Archon runs an availability probe (creates the Metal device, runs a tiny tensor op, reads it
back) before it will select MLX; if the probe fails it falls back to CPU. Verify with
`archon world status`.

---

## 6. Optional add-ons (install later, only if you want the feature)

- **Local video transcription / OCR fallbacks:** download a whisper.cpp model and set
  `[policy.video.asr].model`; `python3 -m pip install rapidocr opencv-python` for frame OCR.
- **Command sandboxing:** `scripts/install-system-deps.sh --with-docker` (installs Docker
  Desktop), then enable `[sandbox]` in config. OpenShell backend also supported on Apple Silicon.
- **Other providers:** `archon auth login --provider openai-codex` (ChatGPT/Codex sub);
  `archon auth login --provider google` (Gemini key for cloud vision on docs).
- **Trading Lab tooling:** `scripts/setup-trading-tools.sh` (pulls in Node + Python helpers).
- **Hacking on the web UI:** `cd web && npm install && npm run build && cd .. && cargo build --release --bin archon`.

---

## 7. Authentication detail

Anthropic credentials resolve in this order: OAuth token → `ANTHROPIC_API_KEY`
(alias `ARCHON_API_KEY`) → `ARCHON_OAUTH_TOKEN` (alias `ANTHROPIC_AUTH_TOKEN`).

- **OAuth (Claude subscription):** `archon auth login --provider anthropic` → browser PKCE
  flow, tokens stored at `~/.archon/.credentials.json`, auto-refreshed.
- **API key:** `export ANTHROPIC_API_KEY="sk-ant-api..."` (put in `~/.zshrc` to persist).
- Inspect without printing secrets: `archon auth status`.

---

## 8. Gotchas specific to a brand-new Apple Silicon Mac

- **Homebrew PATH:** on Apple Silicon brew lives in `/opt/homebrew`, not on PATH by default —
  the `~/.zprofile` line in §3 step 2 fixes it. Skip it and `brew`/the tools "won't be found."
- **Do NOT run `scripts/install-system-deps.sh` with `sudo` on macOS** — it refuses to run
  brew as root. (The `sudo` form in the README is the Linux path.)
- **Downloaded binary "killed":** that's Gatekeeper quarantine — see the `xattr`/`codesign`
  step in §4. A locally-built binary doesn't have this problem.
- **RAM — your 24 GB is plenty.** Well above the 8 GB recommended; the memory-hungry LTO
  link won't swap. Build at full parallelism (do **not** use `-j1` — that's a WSL2-only
  workaround) and run the world-model / web UI / multiple sessions without pressure.
- **Disk — your 512 GB works fine; Xcode is the big consumer.** Archon from source is only
  ~9–14 GB. Full Xcode plus a couple of iOS Simulator runtimes adds roughly **40–70 GB** on
  top, so budget ~50–85 GB for the combined Xcode + Archon dev environment — still leaving
  well over ~380 GB free on a fresh Mac. Watch the growth items below.

### Disk budget (512 GB SSD)

| Item | Approx size | Notes |
|---|---|---|
| C/Rust build toolchain | included with Xcode | provided by full Xcode (sized separately below) |
| Rust toolchain + cargo cache | ~3–4 GB | `~/.rustup` + `~/.cargo` (large dependency tree) |
| `target/` (release build) | ~3 GB | add ~4–6 GB more if you also keep a debug build |
| Homebrew + helper tools | ~2–4 GB | `ffmpeg` + its deps dominate |
| First-run model downloads | ~0.3–0.7 GB | ONNX runtime + local embedding model (auto-downloaded) |
| **Archon core total** | **~9–14 GB** | one-time (excludes Xcode) |
| **Full Xcode** (iOS dev) | ~40 GB installed | ~12 GB download; your largest single consumer |
| iOS Simulator runtimes | ~7–10 GB each | prune via Xcode ▸ Settings ▸ Components or `xcrun simctl delete unavailable` |
| whisper.cpp ASR model | 140 MB – 3 GB | only for local video transcription (`base` → `large`) |
| Docker Desktop (optional sandbox) | 1.5 GB app + 5–20+ GB images/VM | **biggest space risk** — skip unless you need it |
| `.archon/video-artifacts/` | up to ~2 GB per downloaded video | policy-capped; grows with video-evidence work |
| Document corpus + embeddings | hundreds of MB and up | CozoDB + RocksDB store; scales with your corpus |

**Space tips:** reclaim build space with `cargo clean` (deletes `target/`) or by removing
`target/debug` if you only keep release; `brew cleanup` drops old formula versions. Biggest
dirs to watch: `~/.cargo`, `<repo>/target`, `~/.archon/world-model`,
`~/.archon/video-artifacts`, and Homebrew's `Cellar`.

---

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `error: package … specifies edition 2024` | Rust < 1.85 | `rustup update stable` |
| `linker 'cc' not found` / `linking with cc failed` | C toolchain not active | point at Xcode: `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer` |
| `You have not agreed to the Xcode license` / `tool 'xcodebuild' requires Xcode` | fresh Xcode not set up | `sudo xcodebuild -license accept` then `sudo xcodebuild -runFirstLaunch` |
| Build hangs / very long on first run | full dependency graph compile + LTO link | normal for first build; rebuilds use the incremental cache |
| Downloaded `archon` prints only `killed` | Gatekeeper quarantine | `xattr -dr com.apple.quarantine <path>` then `codesign --force --sign - <path>` |
| `brew: command not found` after install | brew not on PATH (Apple Silicon) | run the `eval "$(/opt/homebrew/bin/brew shellenv)"` line |
| MLX build fails on `mlx-rs`/native build | missing cmake or old toolchain | `brew install cmake`; ensure Xcode CLT is current |
| `archon world` says Metal unavailable, uses CPU | probe failed or built without `mlx-metal` | rebuild with `--features mlx-metal`; check `archon world status` |
| A transitive crate complains about OpenSSL | missing pkg-config (rare; OpenSSL is vendored) | `brew install pkg-config openssl` then `export PKG_CONFIG_PATH="$(brew --prefix openssl)/lib/pkgconfig"` |

---

## 10. Verify it works

```bash
archon --version              # archon 1.3.11 (<short-sha>)
archon --help                 # full subcommand listing
archon auth status            # confirms provider credentials
archon --list-themes          # 23 themes
```

Full upstream guide: `docs/getting-started/installation.md` in the repo.
