# CHIMERA Transfer Plan — god-agent + archon-cli-v3, session-continuity build

**Date:** 2026-08-09 · **Author machine:** PROTEUS (WSL, desktop) · **Target:** CHIMERA laptop
**Status:** ✅ **EXECUTED AND VERIFIED 2026-08-09 11:07 PDT.** See §11 for the completion record.

---

## 1. Objective and success criteria

Put a working copy of `claudeflow-testing` (god-agent) and `archon-cli-v3` on CHIMERA such that
the author can continue working remotely, and can pick up exactly where the desktop left off if
the desktop becomes unavailable.

Done means all five hold on CHIMERA, verified by the gates in §7:

1. `claude --resume 5eeea0aa-f8a9-4ede-a8d9-e7210c639ccf` opens Session A with full history.
2. `claude --resume b95f9735-a4f0-4f7b-bca8-238485ee8b6b` opens Session B with full history.
3. A cold boot of Session A from `02-HANDOFF-PROMPT.md` works with no desktop access — every
   file it names resolves, and its five L4 verification tasks can actually be run.
4. `archon docs verify-quote` returns an exact match against the corpus, offline.
5. Auto-memory loads (151 files + MEMORY.md) from the correct project slug.

---

## 2. Verified session state (re-analyzed 2026-08-09 09:59)

### Session A — Lab Boredom, Part III Section 2

**The session was replaced.** The author closed the long-running session and booted a clean one.

| | |
|---|---|
| **Live session** | `5eeea0aa-f8a9-4ede-a8d9-e7210c639ccf` — 297 records, cwd `/home/dalton/projects/claudeflow-testing`, last active 09:48 |
| **Superseded** | `76faa9ca-6f5c-4c8f-b1cf-355884f2b042` — 14.6 MB, "Review dissertation Part III draft and protocol analysis". Reference only; travels for the record, not for resume |
| **Booted from** | `tmp/Dissertation/Part_III/Section 2/session-log-2026-08-09/02-HANDOFF-PROMPT.md` |
| **Position** | L1/L2/L3 drafted and author-approved; resuming at **L4, The Analysis** |
| **Model** | Fable 5 at xhigh |

The new log system is the continuity spine, and it is small — 48K total:

- `00-SESSION-LOG.md` (23K) — what was done, what went wrong, verified facts
- `01-LAWS.md` (10.5K) — binding rules
- `02-HANDOFF-PROMPT.md` (6K) — the cold-boot prompt

**This materially improves the transfer.** Continuity no longer depends on replaying a 14.6 MB
transcript; it depends on three markdown files, two commits, and the data they point at.

**The work is committed** — `b752f5135` (L1/L2/L3 + analysis rulings D-39…D-41) and `8a47a58e2`
(HEAD, records the hash in the log). Local only, **not pushed**. All Section 2 paths are clean.

### Session B — Dissertation revision campaign

| | |
|---|---|
| **Session** | `b95f9735-a4f0-4f7b-bca8-238485ee8b6b` — "Continue dissertation revision campaign map production" |
| **State** | Unchanged since the first analysis. `MAP-p1-v1.md` (80K) last written 2026-08-07 19:25 |
| **Home** | `archon-cli-v3/plans/dissertation_processing_and_analysis/` (PLAN_DIR, 12M) |
| **Repo** | `archon-cli-v3` on `feat/revision-campaign` @ `55165d6f`, 15 dirty |

---

## 3. The critical finding: git does not carry the work

The author elected full git history. That is necessary but **not sufficient**. Committing Session
A's drafts fixed part of the gap; the rest remains, and it is the part L4 needs most.

| Path | Tracked | Loose | Consequence if git-only |
|---|---|---|---|
| `tmp/Dissertation/Part_III/boredom-analysis-v5-2026-08-05` | 17 files | **355** | **L4 cannot run.** The `out/` CSVs are the data all five verification tasks re-derive from |
| `plans/packs` | 0 | 28 | Evidence packs lost |
| `scripts/substitute-quote-ids.py` | 0 | 1 | Quote-ID substitution breaks |
| PLAN_DIR working files (`Part I - Complete.md`, `MAP-p1-v1.md`, `Introduction.md`, `Appendices/`) | 0 | all | **Session B loses everything it is working on** |
| claudeflow working tree overall | — | 408 modified + 13,553 untracked | Wide silent drift |

**Therefore: rsync is mandatory and git is supplementary.** This is the same failure that hit the
July transfer, where `tmp/Dissertation` (156 MB, untracked) was silently skipped and had to be
remediated on arrival.

---

## 4. Inventory

Headline directory sizes are misleading. `claudeflow-testing` is 218G but 178G is `backups/`;
`archon-cli-v3` is 139G but 130G is the Rust `target/`.

### Pass 1 — sessions + archon (~41G, of which 28G is git)

**archon-cli-v3 → `/home/dalton/projects/archon-cli-v3` (~8.7G)**

| Item | Size | Why |
|---|---|---|
| `.archon/` | 6.6G | Doc store — `archon-data.db` 4.7G, `leann.db` 1.2G, `doc-vector-store` 586M, `corpus-import` 134M |
| `corpus/` | 1.9G | Source PDFs for quote verification |
| `index/` | 48M | Claim-level index — **at project root, not `corpus/index/`** |
| `target/release/archon` | 95M | Prebuilt v1.3.11 (`84630e74`). Ship it; do not rebuild |
| `plans/dissertation_processing_and_analysis/` | 12M | Session B's entire working set |
| source (`crates/ src/ web/ docs/ scripts/`) | ~40M | |
| `.git/` | 66M | Full history, cheap |

**claudeflow-testing → `/home/dalton/projects/claudeflow-testing` (~4.5G + 28G git)**

| Item | Size | Why |
|---|---|---|
| `corpus/` | 2.9G | |
| `tmp/Dissertation/` | 364M | Session A's working set incl. the 35M analysis tree and 48K log system |
| `plans/` | 45M | Includes untracked `plans/packs` |
| `src/ scripts/ dist/ god-learn/ god-reason/ docs/` | ~130M | |
| `.god-agent/` | 53M | Live DBs |
| `.agentdb/` | 416M | |
| `.claude/` | 385M | Project agents, commands, hooks, skills, settings |
| `.git/` | **28G** | Author elected full history. **Sequence last** — see §6 |

**Claude Code state → `/home/dalton/.claude/` (~19M)**

| Item | Size |
|---|---|
| `projects/-home-dalton-projects-claudeflow-testing/5eeea0aa….jsonl` | 1.2M |
| `…/b95f9735….jsonl` | 2.5M |
| `…/76faa9ca….jsonl` (reference) | 14.6M |
| `…/memory/` (151 files) + `MEMORY.md` | 1.2M |
| session scratchpads (`/tmp/claude-1000/…`) | 1.2M + 36K |

**Python environment**

`/home/dalton/.pyenv/versions/3.11.9/` (12G) — scipy 1.16.0, matplotlib 3.11.1, numpy 2.2.6,
pandas 3.0.0. The handoff prompt names this interpreter explicitly for L4's re-derivations.
See §8 hazard H5 — do not assume a fresh `pip install` reproduces these versions.

### Pass 2 — god-agent runtime (~7.3G)

`node_modules/` 350M · `vector_db_1536/` 6.5G · `.claude-flow/` · `services/` · daemon configs.
Neither session's critical path touches these: Session A calls the archon binary and edits files,
Session B is markdown only. Deferred deliberately.

### Never transferred

`backups/` 178G · `archon-cli-v3/target/` minus the release binary, 130G · `coverage/` 48M ·
`logs/` 39M · `serena/` 90M.

---

## 5. Preconditions — all blocking

| # | Precondition | Current state |
|---|---|---|
| P1 | CHIMERA powered on and reachable | **FAILING** (re-checked 2026-08-09 ~10:30). LAN `192.168.50.243`: no route, ARP `FAILED`. Tailnet `chimera.taile22c7.ts.net` → `100.81.24.125`: DNS resolves but node offline, 100% loss. Full `/24` sweep found no Windows OpenSSH responder — the four live SSH hosts (.15, .89, .157, .170) are all Unix. **Machine is off or off-network.** Two usable routes exist once it is up: LAN `.243` and the tailnet address |
| P2 | Claude Code on CHIMERA at 2.1.226 (desktop parity) | Unknown — offline |
| P3 | Destination paths **byte-identical**: `/home/dalton/projects/claudeflow-testing` and `/home/dalton/projects/archon-cli-v3` | Must not reuse July's `claudeflow-testing-writing-pipeline-v2` name — see hazard H1 |
| P4 | ≥60G free on CHIMERA | 900G free as of 2026-07-05; re-verify |
| P5 | Both sessions quiesced at snapshot time | Session A wrote at 09:48 |
| P6 | Author sign-off on this plan | Pending |

---

## 6. Procedure

Every leg runs as **resumable rsync in a bounded foreground window**. CHIMERA's WSL reaps
background jobs when the ssh session closes — nohup, setsid and tmux all die. `--partial
--append-verify` means an interrupted leg resumes rather than restarts.

Reach WSL by piping a script over stdin; never inline nested quotes through ssh→cmd→wsl→bash:

```
ssh -o BatchMode=yes dalton@192.168.50.243 "wsl -e bash -s" < local-script.sh
```

**Phase 0 — Pre-flight.** Verify P1–P4. Confirm CHIMERA's `claude --version`, free disk, that
`/home/dalton/projects/` exists, and whether `~/.bashrc:134` still exports `OPENAI_API_KEY`
(hazard H3).

**Phase 1 — Quiesce and snapshot.** Both sessions idle. Record a manifest on the desktop: both
`git rev-parse HEAD`, `git status --porcelain` counts, and `find … -newer` timestamps for
`tmp/Dissertation` and PLAN_DIR. This manifest is the diff baseline for §7 and for return-merge.

**Phase 2 — archon-cli-v3 working tree** (~8.7G). Excludes `target/` except the release binary.
Largest single file is `archon-data.db` at 4.7G — expect it to dominate the leg.

**Phase 3 — claudeflow-testing working tree** (~4.5G). Excludes `backups/`, `vector_db_1536/`,
`node_modules/`, `coverage/`, `logs/`, `serena/`, and `.git/` (Phase 5). **Includes untracked
files** — this is the leg that carries what §3 shows git would drop.

**Phase 4 — Claude Code state** (~19M). Both live transcripts plus the superseded one, the memory
directory, and both session scratchpads. Fast, and it is what makes `--resume` work.

**Phase 5 — Git history** (28G + 66M). **Sequenced last on purpose.** Sessions become resumable at
the end of Phase 4; this leg only adds `git log`/`diff`/`show` orientation. If it is slow or the
link drops, work can begin without it and the leg resumes later.

**Phase 6 — Python environment.** **DECIDED 2026-08-09: rsync `~/.pyenv/versions/3.11.9` (12G).**
Exact interpreter, no resolver risk on pandas 3.0.0 / numpy 2.2.6. See H5.

**Phase 7 — Verification gates** (§7). No leg is "done" until its gate passes.

**Phase 8 — god-agent runtime.** Separate session, after Pass 1 is signed off.

---

## 7. Verification gates

Run on CHIMERA, with the desktop's network share disconnected where possible so nothing silently
resolves back home.

| Gate | Check | Pass condition |
|---|---|---|
| G1 | `git -C claudeflow-testing rev-parse HEAD` | `8a47a58e2` |
| G2 | `git -C archon-cli-v3 rev-parse HEAD` | `55165d6f` |
| G3 | Working-tree drift vs Phase-1 manifest | modified 408, untracked 13,553 (claudeflow); 15 dirty (archon) |
| G4 | `ls "tmp/Dissertation/Part_III/Section 2/session-log-2026-08-09/"` | all three log files, byte-identical (md5) |
| G5 | `ls tmp/Dissertation/Part_III/boredom-analysis-v5-2026-08-05/out/` | all CSVs present; `survey-episodes.csv` readable |
| G6 | `./target/release/archon --version` | `archon 1.3.11 (84630e74)` |
| G7 | `archon docs verify-quote` on a known-good quotation | **exact match** — never gate on "found" or a fuzzy hit |
| G8 | `archon corpus-index search` | returns rows; sources 119 / claims 6,544 as of 2026-08-05 |
| G9 | `claude --resume 5eeea0aa…` | opens with full history |
| G10 | `claude --resume b95f9735…` | opens with full history |
| G11 | Auto-memory loads | MEMORY.md visible in context; 151 files present |
| G12 | `python3 -c "import scipy, matplotlib, pandas"` on the pyenv interpreter | versions match §4 exactly |
| G13 | **Cold-boot rehearsal** | Paste `02-HANDOFF-PROMPT.md` into a fresh session. Every named file resolves; L4 verification task 1 (which episodes are divergent under the rebuilt composite — expect **5, not 8**) runs and returns |

G13 is the real test. G1–G12 prove files moved; G13 proves the work can continue.

---

## 8. Hazards

**H1 — Path mismatch silently breaks resume.** Claude Code derives the session-store slug from the
working directory. `--resume` only finds a transcript when CHIMERA's checkout sits at exactly
`/home/dalton/projects/claudeflow-testing`. July's setup used a different directory name, which
forced a different slug and a manual memory copy. Same for `archon-cli-v3`.

**H2 — Untracked-file loss.** §3. Mitigation: rsync carries untracked files; G3 and G5 catch it.

**H3 — archon OpenAI-key panic — CONFIRMED PRESENT IN v3. Blocking.** Verified 2026-08-09:
`grep -rn "openai_explicit_optin" crates/archon-docs/src/` returns **nothing**, and the shipped
`target/release/archon` binary contains **0** occurrences. The July fix was applied to a different
tree and **was never ported to archon-cli-v3**.

Failure mode: CHIMERA's `~/.bashrc:134` exports an ambient `OPENAI_API_KEY`; the doc-store embedder
auto-detects it, flips from the 768-dim snapshot to OpenAI's 1536-dim embeddings, and panics —
`reqwest::blocking` built and `send()`-called inside the CLI's tokio runtime. The desktop never
trips this because no `OPENAI_API_KEY` is set here, which is why it went unnoticed.

Without mitigation, gates G7 and G8 fail on arrival and no quote verification works on CHIMERA.

Mitigation, in order of preference:
1. **Wrapper script** that `unset OPENAI_API_KEY` before exec'ing the real binary (the July setup
   kept exactly such a wrapper at `~/archon-cli-travel/archon` as belt-and-suspenders). Cheapest,
   survives a rebuild.
2. **Port the three-file fix** into v3 (`embed_config.rs` `openai_explicit_optin`, `embed.rs` Auto
   arm + thread-wrapped init, `embed_openai.rs` `request_batch` on a scoped thread) and rebuild.
   Correct, but a v3 release build is expensive and needs `LIBCLANG_PATH=/usr/lib/llvm-18/lib`.
3. Remove the export from CHIMERA's `~/.bashrc` — rejected; it presumably serves other tools.

**Decide before Phase 2.** Option 1 unblocks the transfer today; option 2 is the real repair and can
follow.

**H4 — WSL job reaping.** No systemd, no passwordless sudo, and background jobs die ~19s after the
launching ssh session closes. Hence bounded foreground legs and resumable rsync.

**H5 — Python version drift.** pandas 3.0.0 and numpy 2.2.6 are recent and consequential. A fresh
`pip install` on CHIMERA may resolve differently and change the numbers L4 re-derives — which
would look like an analysis error, not an environment difference. Prefer copying the interpreter.

**H6 — Snapshot taken mid-write.** Session A wrote `L3-DRAFT-v1.tex` at 08:57 and the log at 09:21
during this analysis. Enforce P5.

**H7 — Divergence after transfer.** Two live copies. See §9.

**H8 — The 28G git leg — RESOLVED, not a hazard.** Storage layout inspected 2026-08-09: the 28G is
**five packfiles** (21.6G / 5.0G / 1.5G / 875M / 118M) with 1,395 loose objects and 1,487 files
total. That is the best case for rsync — a few large sequential transfers, negligible per-file
overhead. Estimate ~5 min on gigabit, ~12 min on wifi. It also makes return-merge cheaper (`git
diff` against the transfer baseline) and costs nothing on the way back, since no commits happen on
CHIMERA and the packs never change. **Keep in Pass 1, sequenced last.**

---

## 9. Divergence and return-merge

Standing rules, consistent with the July travel guide and existing project law:

- **No commits and no pushes from CHIMERA.** Commits happen from WSL desktop only, never the Mac,
  and pushing needs separate author permission.
- While travelling, **CHIMERA's copy of `tmp/Dissertation` and PLAN_DIR is authoritative**.
- Memory files diverge on the two machines and must be **merged by hand** on return.
- Return procedure: rsync back, then diff against the Phase-1 manifest before any commit.
- `b752f5135` and `8a47a58e2` are **local and unpushed**. Do not resolve that by pushing from
  CHIMERA.

---

## 10. Decisions

Resolved 2026-08-09:

1. **Python — rsync the 12G pyenv.** Author ruling. Exact interpreter; no resolver drift.
2. **Git history — full, kept in Pass 1, sequenced last.** Author elected full history; layout
   analysis (H8) shows the cost is ~5–12 min and the return-merge benefit is real.
3. **`76faa9ca…` superseded transcript — carry it.** 14.6 MB against a 41G transfer. The log
   system distills *what* was decided; the transcript is the only record of *why*. Losing it is
   unrecoverable in precisely the desktop-unavailable scenario this build exists for.

Still open:

4. ~~Sign-off to execute~~ — given 2026-08-09; transfer complete.

---

## 11. Completion record — 2026-08-09

**Executed 10:47–11:07 PDT. All automated gates pass. ~49G moved at 106–117 MB/s (gigabit line rate).**

### Address change

CHIMERA is at **`192.168.50.245`**, not `.243`. It also carries a Tailscale identity,
`chimera.taile22c7.ts.net` → `100.81.24.125`, usable off-LAN when the node is up.

### Transport

`rsync --rsync-path="wsl rsync"` over Windows OpenSSH works and is the right tool — it reaches
WSL's rsync directly. Nested-quote commands through ssh→cmd→wsl still mangle (it broke the
scratchpad `mkdir`); pipe a script over stdin instead.

### Legs

| Phase | Content | Result |
|---|---|---|
| 1b | Renamed CHIMERA's pre-existing checkout to `~/projects/claudeflow-testing.pre-transfer-2026-08-09` | Intact — `3da50263`, 20 engine files, `icp`/`prd`/`usacf`, 102 dirty preserved |
| 2 | archon-cli-v3 (ex-`target/`, keeping the release binary) | 9.25G / 11,741 files / 85s / exit 0 |
| 3 | claudeflow-testing working tree incl. untracked | 4.0G / 33,157 files / 49s / exit 0 |
| 4 | 3 transcripts + 151 memory files | exit 0 |
| 5 | `.git` — 28G claudeflow (five packfiles) + 66M archon | 4m14s / exit 0 |
| 6 | pyenv 3.11.9 (author ruling: rsync, not rebuild) | 57s / exit 0 |
| 7 | `node_modules`, `coverage`, `serena`, `logs`, `vector_db_1536` — added to make `git status` match exactly | 75s / exit 0 |

Final: `claudeflow-testing` 40G, `archon-cli-v3` 8.7G, 816G free. Sizes reconcile exactly against the
desktop minus `backups/` (178G) and archon `target/` (130G) — **the only deliberate omissions.**

### Gate results

G1 ✅ `8a47a58e2` / `feat/wraith-retrieval` · G2 ✅ `55165d6f` / `feat/revision-campaign` ·
G3 ✅ **exact** — modified 408, untracked 13,554, deleted 366, matching the desktop file-for-file ·
G4 ✅ 3 log files, md5-verified · G5 ✅ 27 CSVs incl. `survey-episodes.csv`, all four drafts ·
G6 ✅ `archon 1.3.11 (84630e74)` · **G7 ✅ EXACT MATCH offline with the ambient key present** ·
G8 ✅ corpus-index search returns ranked clauses · G9–G11 ✅ all three transcripts + 151 memory files
+ MEMORY.md · G12 ✅ scipy 1.16.0 / mpl 3.11.1 / np 2.2.6 / pd 3.0.0.

**G13 (cold-boot rehearsal) is the one gate left, and it is author-side** — paste
`02-HANDOFF-PROMPT.md` into a fresh session on CHIMERA and confirm L4 verification task 1 returns
5 divergent episodes.

### H3 mitigation — installed and proven

`~/bin/archon` unsets `OPENAI_API_KEY`, `ARCHON_DOCS_OPENAIKEY`, `ARCHON_MEMORY_OPENAIKEY` and execs
the real binary. `~/bin` prepended to PATH in `~/.bashrc` (backup: `~/.bashrc.bak-2026-08-09`).
Proven by running `verify-quote` with a canary key exported — exact match, no panic.

### New CHIMERA facts, correcting the July notes

- **systemd IS running** on CHIMERA's WSL now (`systemd-private-*` dirs in `/tmp`). The July note
  that there is no systemd is stale; background-job reaping may also no longer apply.
- **`/tmp` is volatile** — wiped at 11:04 while the VM stayed up 23 min. Session scratchpads
  therefore live at **`~/claude-scratchpad-archive/<session-id>/`** (85 files for `76faa9ca`,
  6 for `5eeea0aa`). Never park durable state in CHIMERA's `/tmp`.
- Claude Code is **2.1.212** vs the desktop's 2.1.226. Non-blocking; upgrade with npm if desired.

### G13 — PASSED 2026-08-09 12:09

Cold-boot rehearsal run by the author on CHIMERA (session `3d43c864-…`). The session read every file
the handoff names, in order, then completed **all five verification tasks** and produced a
16-paragraph / 7-batch plan for L4. 43 tool calls. Task 1 returned **nine divergent episodes across
the 36, five of them on the clinical film** — the predicted 5. Data integrity confirmed by md5:
`survey-episodes.csv` `281f42b0…` and `keystone-decomposition.csv` `14677d65…` identical on both
machines.

It also falsified three spec claims — evidence the environment is good enough to catch errors, not
merely to run: task 4's "`felt_duration` empty in all 36 rows" is wrong (the column is
`felt_duration_min`, populated in all 36, confirmed independently on the desktop); task 5's thirds
figures are superseded; and two further errors were found in already-approved L3 prose.

### DEFECT FOUND AND FIXED — scipy was broken by a no-`--delete` rsync

**Cause (transfer error, mine).** CHIMERA's pyenv 3.11.9 already had **scipy 1.17.0**. Phase 6
rsynced the desktop's 1.16.0 over it **without `--delete`**, leaving a hybrid tree: both
`scipy-1.16.0.dist-info` and `scipy-1.17.0.dist-info`, and a stale
`sparse/linalg/_propack.cpython-311-x86_64-linux-gnu.so` shadowing the real `_propack/` package.
Any `from scipy import stats` died with `ImportError: cannot import name '_spropack'`.

`import scipy` succeeded, which is why gate G12 passed and missed it — **G12 was too weak; it should
import the submodules actually used.**

**Impact.** The L4 session hand-rolled Spearman/Pearson and exact binomial sign tests as a
workaround, verifying them to four decimals against `criterion-validity.csv`. Its figures are
therefore probably sound, but every recomputed coefficient in that verification report should be
re-checked now that scipy works.

**Fix (surgical, not a blanket delete).** A full `--delete` on the pyenv would have removed 2,237
CHIMERA-only files (websockets, watchfiles, …) unrelated to the fault. Instead: `--delete` scoped to
`site-packages/scipy/` (42 stale 1.17.0 artifacts), `scipy.libs/`, and `scipy-1.16.0.dist-info/`,
plus removal of the orphaned `scipy-1.17.0.dist-info`. Verified: `scipy.stats` imports, and
`spearmanr` on `survey-episodes.csv` returns rho −0.8273, p 4.93e-10 over 36 rows.

**Lesson for any future sync into a non-empty target: use `--delete`, or scope it and dry-run with
`--info=del` first.**

### Known gap — the 214G raw tree is NOT on CHIMERA

`analysis/config.py:29` sets `R1_ROOT = "/mnt/d/PhD/Dissertation/Boredom Experiment"` — **214G** of
raw HMD/EEG recordings on the desktop's D: drive, outside both repos and never in scope. CHIMERA
has a D: drive but no `PhD` tree. The L4 session searched `/mnt/c`, `/mnt/d`, `/mnt/h`, found
nothing, and correctly fell back to the committed `out/` tables.

Consequence: reading and re-deriving from `out/` works (27 CSVs plus `out/_raw`, 3.4M of parsed
intermediates, all present); **re-running the pipeline from original recordings does not.**
`R2_PARSER` and `scripts/boredom-o9/` are inside the repo and did transfer, so this is the only
external dependency. ~35 min to ship at observed throughput if full independence is wanted.

### Security

CHIMERA's `~/.bashrc:134` holds a live `sk-proj-…` OpenAI key in plaintext. Reading the file printed
it into the transfer session's transcript. **Rotate it.** Moving it out of `.bashrc` into a
secrets file loaded on demand would also remove the root cause of H3.

