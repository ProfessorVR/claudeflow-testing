# Stream Deck MCP — Operator Guide

## Start everything
```bash
bash streamdeck/scripts/god-launch-start.sh  # starts services + SSE watcher
```

## Stop everything
```bash
bash streamdeck/scripts/god-launch-stop.sh   # stops services + kills watcher
```

## Check health
```bash
bash streamdeck/scripts/mcp-smoke-test.sh    # full check
cat .god-agent/streamdeck-mode               # current mode
tail logs/streamdeck-sse-watcher.log         # SSE watcher status
```

## Backup / Restore
```bash
bash streamdeck/scripts/mcp-backup.sh
bash streamdeck/scripts/mcp-restore.sh --dry-run backups/streamdeck-mcp-XXXXXXXX/
bash streamdeck/scripts/mcp-restore.sh backups/streamdeck-mcp-XXXXXXXX/
```

## After any pipeline/SSE/MCP change
```bash
bash streamdeck/scripts/mcp-ci.sh
```

## Logs
- `logs/streamdeck-sse-watcher.log` — SSE watcher
- `.run/streamdeck-watcher.pid` — watcher PID

## Mode lock (disable auto page switching)
```bash
echo "locked" > .god-agent/streamdeck-mode
```

## Rebuild profile pages
```bash
python3 streamdeck/scripts/build-mcp-pages.py
# Then restart Stream Deck app
```

## Regenerate .bat wrappers
```bash
bash streamdeck/scripts/mcp-create-wrappers.sh
```

## Regenerate icons
```bash
python3 streamdeck/scripts/generate-icons.py
```

## Layer contract
See `.claude/plans/parallel-foraging-yeti.md`

## Key UUIDs
- Profile: `19BBCADB-65EE-484C-86CF-5EA0AE391361` (AI Stream Deck)
- Page 1 DEFAULT: `A71FFA10-6F33-44D3-8F05-5092296E590E`
- Page 2 PIPELINE: `53F7B969-F208-4A72-AB07-8056462AF932`
- Page 3 RESEARCH: `F99BDEA8-C3AC-4318-A8C1-32D4E568C2CF`
- Page 4 REVIEW: `D9B2D208-01D7-4646-96D6-9AC697DFCD89`
