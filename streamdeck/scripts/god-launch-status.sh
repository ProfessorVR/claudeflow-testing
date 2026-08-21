#!/bin/bash
source "$(dirname "$0")/_common.sh"
god_cd
OUTPUT=$(scripts/god-launch status 2>&1 | tail -10)
god_toast "Service Status" "$OUTPUT"
