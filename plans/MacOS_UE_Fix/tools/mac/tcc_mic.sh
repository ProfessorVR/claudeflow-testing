#!/bin/bash
# tcc_mic.sh - ON THE MAC: list microphone permission decisions (user TCC db). Read-only.
DB="$HOME/Library/Application Support/com.apple.TCC/TCC.db"
sqlite3 "$DB" "select client, auth_value, datetime(last_modified,'unixepoch','localtime') from access where service='kTCCServiceMicrophone' order by last_modified desc" 2>&1 | head -20
