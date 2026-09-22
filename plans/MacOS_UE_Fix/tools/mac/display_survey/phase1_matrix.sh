#!/bin/bash
# phase1_matrix.sh <app path> <cells file> <restore: "W H hidpi|lowdpi"> - ON THE MAC. Runs the Phase 1 panel-matrix
# cells one after another (2026-09-21). Cell lines:
#   mode W H hidpi|lowdpi      switch the main display (session-scoped) and run one cell
#   dock key=value             e.g. dock tilesize=128 | dock orientation=left | dock autohide=1 ; restored after the cell
#   menubar hide               "Automatically hide and show the menu bar"; restored after the cell
# At the end: the display mode given as <restore>, the Dock (from ~/phase1_backup/dock.plist) and the game's
# GameUserSettings.ini (from ~/phase1_backup/) are put back. Summary in /tmp/phase1/matrix-summary.txt.
set -u
APP="${1:?app}"; CELLS="${2:?cells file}"; RESTORE="${3:?restore mode 'W H hidpi|lowdpi'}"
CFG=~/Library/Application\ Support/Epic/awsTutorial/Saved/Config/Mac
SUM=/tmp/phase1/matrix-summary.txt; mkdir -p /tmp/phase1; : > "$SUM"
restore_dock() { defaults import com.apple.dock ~/phase1_backup/dock.plist; killall Dock; sleep 4; }
restore_menubar() { defaults delete NSGlobalDomain _HIHideMenuBar 2>/dev/null; killall Finder 2>/dev/null; sleep 4; }
summarize() { # label
  local R=/tmp/phase1/$1/result.txt
  { echo "## $1"; grep -E "^mode:|^screen\[|^window |^(MacWindow|Trace[123])=|^quit:|EXITED_EARLY|ABORT|Ensure|Fatal|/Crashes/" "$R" | cut -c1-230; echo; } >> "$SUM"
}
while read -r kind a b c; do
  [ -z "${kind:-}" ] && continue; case "$kind" in \#*) continue;; esac
  if [ "$kind" = mode ]; then
    LABEL="mode-${a}x${b}-${c}"
    echo "### $LABEL: switching"; R=$(/tmp/set_mode "$a" "$b" "$c"); echo "$R"
    case "$R" in OK*) ;; *) echo "## $LABEL: SKIPPED ($R)" >> "$SUM"; continue;; esac
    sleep 4
    /tmp/phase1_run.sh "$APP" "$LABEL" 60 > /dev/null
    summarize "$LABEL"
  elif [ "$kind" = dock ]; then
    KEY=${a%%=*}; VAL=${a#*=}; LABEL="dock-$KEY-$VAL"
    echo "### $LABEL"; if [ "$KEY" = orientation ]; then defaults write com.apple.dock "$KEY" -string "$VAL"; else defaults write com.apple.dock "$KEY" -int "$VAL"; fi
    killall Dock; sleep 5
    /tmp/phase1_run.sh "$APP" "$LABEL" 60 > /dev/null
    summarize "$LABEL"; restore_dock
  elif [ "$kind" = menubar ]; then
    LABEL="menubar-hide"; echo "### $LABEL"
    defaults write NSGlobalDomain _HIHideMenuBar -bool true; killall Finder; sleep 6
    /tmp/display_modes | grep -E "^screen\[" | cut -c1-200
    /tmp/phase1_run.sh "$APP" "$LABEL" 60 > /dev/null
    summarize "$LABEL"; restore_menubar
  fi
done < "$CELLS"
echo "### restoring"; set -- $RESTORE; /tmp/set_mode "$1" "$2" "$3"; restore_dock
cp -p ~/phase1_backup/GameUserSettings.ini "$CFG/GameUserSettings.ini" && echo "GameUserSettings.ini restored"
echo "final: $(/tmp/set_mode current)"; /tmp/display_modes | grep -E "^screen\[" | cut -c1-200
echo "MATRIX_DONE"
