#!/usr/bin/env bash
#===============================================================================
# package-god-agent-for-boss.sh
#
# Produces a CLEAN, SCRUBBED copy of the God Agent suitable for handing to
# another person / pushing to a fresh private GitHub repo.
#
# It copies ONLY source + config the app needs (allowlist), and deliberately
# EXCLUDES:
#   - secrets            (.env)
#   - personal data      (corpus content, memory/, .claude personal state)
#   - trained profiles   (.agentdb style-profiles.json)  <- she trains her own
#   - regenerable bulk    (node_modules, dist, vector_db_*, .chroma-data)
#   - machine state       (logs, tmp, backups, .god-agent DBs, test scratch dirs)
#
# Usage:
#   bash scripts/package-god-agent-for-boss.sh [OUTPUT_DIR]
#
# Default OUTPUT_DIR: ../god-agent-clean
#===============================================================================
set -euo pipefail

SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT="${1:-$SRC/../god-agent-clean}"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
say() { echo -e "${CYAN}==>${NC} $*"; }

if [ -e "$OUT" ]; then
  echo "Output dir already exists: $OUT"
  echo "Remove it first (rm -rf \"$OUT\") or pass a different path."
  exit 1
fi

say "Staging clean package at: $OUT"
mkdir -p "$OUT"

# ----- 1. Application source (allowlist) ------------------------------------
say "Copying application source..."
cp -r "$SRC/src"           "$OUT/src"
cp -r "$SRC/scripts"       "$OUT/scripts"
cp -r "$SRC/embedding-api" "$OUT/embedding-api"
[ -d "$SRC/god-learn/config" ] && mkdir -p "$OUT/god-learn" && cp -r "$SRC/god-learn/config" "$OUT/god-learn/config"

# Do not ship the packaging script itself
rm -f "$OUT/scripts/package-god-agent-for-boss.sh"

# ----- 2. Claude Code integration (.claude, curated) ------------------------
say "Copying .claude/ (agents, commands, skills, hooks) — excluding personal state..."
mkdir -p "$OUT/.claude"
for item in agents commands skills hooks helpers \
            CORPUS-ONLY-CONSTRAINT.md HOOKS_README.md \
            statusline-command.sh settings.json settings.local.json.example; do
  [ -e "$SRC/.claude/$item" ] && cp -r "$SRC/.claude/$item" "$OUT/.claude/$item"
done
# scrub any personal local state that may have slipped into subdirs
rm -f  "$OUT/.claude/settings.local.json" 2>/dev/null || true
rm -f  "$OUT/.claude"/memory.db* 2>/dev/null || true

# ----- 3. Root config / build files -----------------------------------------
say "Copying root config files..."
for f in package.json package-lock.json tsconfig.json vitest.config.ts \
         .python-version requirements-full.txt README.md SETUP.md \
         SETUP-WINDOWS-SOP.md FCDP-DRAFTING-PROTOCOL.md GRANT-WRITING-WORKFLOW.md \
         .env.example; do
  [ -e "$SRC/$f" ] && cp "$SRC/$f" "$OUT/$f"
done

# ----- 4. Empty corpus scaffold (per instruction: folder, no content) -------
say "Creating EMPTY corpus/ scaffold..."
mkdir -p "$OUT/corpus"
: > "$OUT/corpus/.gitkeep"
cat > "$OUT/corpus/README.md" <<'CORPUS'
# corpus/

Drop your own source documents here (`.pdf`, `.txt`, `.md`), then ingest them:

```bash
npx tsx src/god-agent/universal/cli.ts ingest corpus/
```

This folder ships EMPTY on purpose — it holds *your* research library, not
anyone else's. Ingested documents are embedded into the local vector database
(`vector_db_1536/`), which is git-ignored and rebuilt from these sources.
CORPUS

# ----- 5. Clean MCP config (strip machine-specific Stream Deck / Elgato) -----
say "Writing clean .mcp.json (code-intelligence only, hardware MCPs removed)..."
cat > "$OUT/.mcp.json" <<'MCP'
{
  "mcpServers": {
    "leann-search": {
      "command": "npx",
      "args": ["tsx", "src/mcp-servers/leann-search/server.ts"],
      "cwd": ".",
      "env": {
        "LEANN_PERSIST_PATH": "./vector_db_leann",
        "LEANN_LOG_LEVEL": "warn"
      }
    }
  }
}
MCP

# ----- 6. Fresh, strict .gitignore ------------------------------------------
say "Writing hardened .gitignore..."
cat > "$OUT/.gitignore" <<'GI'
# --- Secrets ---
.env
.env.local

# --- Node / build ---
node_modules/
dist/
coverage/
tsconfig.tsbuildinfo
*.tsbuildinfo

# --- Python ---
.venv/
__pycache__/
.pytest_cache/

# --- Regenerable data (rebuilt from corpus/) ---
vector_db_1536/
vector_db_leann/
vector_db_leann.content/
.chroma-data/

# --- Your private research library (never commit) ---
corpus/**
!corpus/.gitkeep
!corpus/README.md

# --- Your private grant materials (never commit) ---
grants/

# --- Runtime / machine state ---
.god-agent/
.agentdb/
.agentdb-test/
god-reason/
memory/
logs/
tmp/
.tmp/
.run/
uploads/
output/
reports/
backups/
.backups/
.swarm/
.hive-mind/
.serena/
.ucm/
coordination/
config/

# --- Trained writing styles (each user trains their own) ---
.agentdb/universal/style-profiles.json
style-training/

# --- Claude Code personal state ---
.claude/settings.local.json
.claude/memory.db*
.claude/projects/
.claude/runtime/
.claude/checkpoints/
.claude/worktrees/

# --- Editor / OS ---
.DS_Store
.vscode/
GI

# ----- 7. Sanity scan for leaked secrets ------------------------------------
say "Scanning staged package for leaked secrets..."
LEAKS=$(grep -rIER 'sk-ant-[A-Za-z0-9]{20}|pplx-[A-Za-z0-9]{20}|sk-[A-Za-z0-9]{40}' "$OUT" 2>/dev/null | head -5 || true)
if [ -n "$LEAKS" ]; then
  echo -e "${YELLOW}!! POSSIBLE SECRET FOUND — review before publishing:${NC}"
  echo "$LEAKS"
else
  echo -e "${GREEN}No API-key patterns found in staged files.${NC}"
fi

echo
say "Done. Clean package staged at:"
echo "    $OUT"
echo
echo "Size:"
du -sh "$OUT" 2>/dev/null | sed 's/^/    /'
echo
echo "Next steps (see PACKAGING-AND-PUBLISH.md):"
echo "    cd \"$OUT\" && git init -b main && git add -A && git commit -m 'Initial clean God Agent package'"
echo "    gh repo create god-agent --private --source=. --push   # requires: gh auth login"
