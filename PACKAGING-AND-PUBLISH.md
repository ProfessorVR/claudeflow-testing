# Packaging & Publishing the God Agent (for Dalton)

How this clean package was produced and how to publish it to a **private GitHub repo** for
your boss. Run everything below **inside WSL**.

## What this package is

A scrubbed copy of the God Agent produced by
`scripts/package-god-agent-for-boss.sh` (in the source repo). It contains only source +
config the app needs. It deliberately **excludes**:

- **Secrets** — `.env` (only `.env.example` ships)
- **Personal data** — all corpus content (folder ships **empty** with a README), `memory/`,
  `.claude` personal state (`settings.local.json`, `memory.db`, `projects/`, `runtime/`)
- **Trained writing styles** — `.agentdb/universal/style-profiles.json` (she trains her own)
- **Regenerable bulk** — `node_modules/`, `dist/`, `vector_db_1536/`, `vector_db_leann/`,
  `.chroma-data/`
- **Machine state** — `logs/`, `tmp/`, `backups/`, `.god-agent/` databases, `.test-gnn-*`
  scratch dirs, Stream Deck / Elgato hardware MCP config

A hardened `.gitignore` keeps all of that out of the repo going forward, and the packaging
script runs a secret-scan before finishing.

## Recommended distribution: a **new PRIVATE GitHub repo**

Why private GitHub over emailing a zip:
- The system is proprietary and the repo will later hold her private research corpus.
- She gets clean updates with `git pull` when you improve things.
- No secrets or personal data are in the tree (verified above), so it's safe to host privately.

### Step 1 — (re)generate the clean package from the source repo

```bash
cd ~/projects/claudeflow-testing
rm -rf ../god-agent-clean
bash scripts/package-god-agent-for-boss.sh
```

### Step 2 — create the private repo and push

```bash
cd ../god-agent-clean
git init -b main
git add -A
git commit -m "Initial clean God Agent package for Windows/WSL"

# Requires GitHub CLI logged in:  gh auth login
gh repo create god-agent --private --source=. --push
```

> Pick any name you like instead of `god-agent`. Use your `ProfessorVR` account or a new one.

### Step 3 — give your boss access

Either add her as a collaborator:

```bash
gh repo edit <owner>/god-agent --add-collaborator <her-github-username>
```

…or, from the GitHub web UI: **Repo → Settings → Collaborators → Add people**. She accepts
the email invite, then follows **Part C** of `SETUP-WINDOWS-SOP.md` to clone it.

### Fallback if she'd rather not use GitHub

Zip the clean folder and send it over any file transfer:

```bash
cd ..
tar -czf god-agent-clean.tar.gz god-agent-clean
```

She unpacks it into `~/god-agent` inside WSL and skips **Part C**, starting at **Part D**.

## Before you publish — final human check (30 seconds)

```bash
cd ~/god-agent-clean
# 1. no real secrets (only the .env.example placeholder should match):
grep -rIE 'sk-ant-[A-Za-z0-9]{20}|pplx-[A-Za-z0-9]{30}' . | grep -v .env.example
# 2. corpus is empty scaffold only:
find corpus -type f
# 3. no style profiles shipped:
find . -name 'style-profiles.json'
```

All three should return **nothing** (except the empty-corpus `.gitkeep`/`README.md`).

## If you change the source and want to re-ship

Re-run Step 1, then in the clean folder:

```bash
git add -A && git commit -m "Update" && git push
```

She pulls with `git pull` — her `.env`, corpus, and trained style profile stay untouched
because they're git-ignored.
