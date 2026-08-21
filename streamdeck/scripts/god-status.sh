#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
echo "========================================="
echo "  GOD AGENT — STATUS"
echo "========================================="
echo ""
npx tsx src/god-agent/universal/cli.ts status 2>&1
echo ""
echo "========================================="
scripts/god-launch status 2>&1
god_wait
