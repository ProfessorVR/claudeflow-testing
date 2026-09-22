# Display survey harness (macOS) — 2026-09-21

Proves the game's window repair on a laptop panel the lab has not seen before, without a login: every HiDPI mode a
Mac offers is a faithful emulation of another laptop's virtual framebuffer (plan
`mac-panel-matrix-window-plan-2026-09-21.md` §1.2, §2a). Tools, built by `build_survey.sh` (needs Xcode):

| Tool | Does |
| --- | --- |
| `display_modes` | prints every screen: frame, visibleFrame (menu bar/Dock), safeAreaInsets (notch), backing scale, all CGDisplayModes incl. 1× |
| `set_mode current` / `set_mode W H hidpi\|lowdpi` | reads / switches the main display's mode for this login session only |
| `win_bounds` | the game's window as macOS places it (CGWindowListCopyWindowInfo; points, y-down) — the evidence, since `screencapture` over ssh returns a stale frame |
| `phase1_run.sh <app> <label> [wait]` | one cell: record mode + insets, launch, wait, read `[GraphicsAutoTune] MacWindow=/Trace` lines written after launch, `win_bounds`, SIGTERM, crash check → `/tmp/phase1/<label>/result.txt` |
| `phase1_matrix.sh <app> <cells> <restore>` | runs a cells file (`cells_air.txt`, `cells_mbp.txt`: modes, Dock variants, menu-bar auto-hide) and restores the display, Dock and the game's ini |

Five-minute survey of a new laptop: `bash build_survey.sh` → `/tmp/display_modes` (note panel, default mode, insets)
→ `phase1_run.sh <Development app> baseline 60` → read `reached WxH windowed at X,Y after N correction(s)` and
compare with `win_bounds`. Before a matrix run save the Dock prefs and the game's `GameUserSettings.ini` to
`~/phase1_backup/` (the matrix restores from there; `defaults import` alone does not restore a Dock — delete the keys).
Unattended launches never reach the options menu, so tuner results need a real login.
