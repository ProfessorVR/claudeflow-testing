# Plan — the macOS window repair on every Apple laptop panel (2026-09-21, draft 1 for review)

Goal: students run awsTutorial on MacBook Airs (13.3", 13.6", 15.3") and MacBook Pros (13", 14.2", 16.2"), M1–M5,
macOS 15 and 26, at whatever display scaling and Dock they use. The window repair (`RepairMacWindow`, build 42) must
put a correctly hit-tested, Dock-clear window on all of them, and the graphics tuner must not be fooled by a display
mode that renders more pixels than the panel has. Nothing in this document has been implemented. Draft 1; the
operator reviews in rounds.

Sources: Apple tech-spec pages (native resolutions, ppi; the M1 Air page is the only one that still lists scaled
modes), Apple developer documentation (`NSScreen.visibleFrame`, `safeAreaInsets`, `backingScaleFactor`,
`CGDisplayModeGetPixelWidth`), and — the part that counts — a read-only survey run today on the two Macs we have
(`display_modes.swift`, output in §1.3), plus the engine source (`MacApplication.cpp`, `MetalRHI.cpp` patch).

---

## 1. What the research established

### 1.1 The panel matrix (Apple-silicon laptops students can own)

| Laptop | Panel px | ppi | Notch | Default "looks like" (pt) | Default virtual framebuffer (px) | Virtual ÷ panel | Scaled options (pt) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MacBook Air 13.3" M1 (2020) | 2560×1600 | 227 | no | 1440×900 (scaled) | 2880×1800 | 1.27× | 1024×640, 1280×800*, 1440×900, 1680×1050 (Apple lists 1680/1440/1024) |
| MacBook Pro 13" M1/M2 (Touch Bar) | 2560×1600 | 227 | no | 1440×900 (scaled) | 2880×1800 | 1.27× | same as above |
| MacBook Air 13.6" M2/M3/M4/M5 | 2560×1664 | 224 | yes | **1470×956 (scaled)** | **2940×1912** | **1.32×** | 1024×665, 1280×832*, 1470×956, 1710×1112 |
| MacBook Air 15.3" M2/M3/M4/M5 | 2880×1864 | 224 | yes | 1710×1107 per secondary sources; **the operator's Air runs 1440×932 (exact 2×) — default unconfirmed** | 3420×2214 if 1710 | 1.41× if 1710 | measured today: 1024×663, 1280×828, 1440×932*, 1710×1107, 1920×1243 (+ 4:3-ish 1024×640, 1280×800, 1440×900, 1710×1068, 1920×1200) |
| MacBook Pro 14.2" M1 Pro → M5 | 3024×1964 | 254 | yes | 1512×982 (exact 2×) | 3024×1964 | 1.00× | measured today: 1024×665, 1147×745, 1352×878, 1512×982*, 1800×1169 (+ 16:10 variants) |
| MacBook Pro 16.2" M1 Pro → M4 Max | 3456×2234 | 254 | yes | 1728×1117 (exact 2×) | 3456×2234 | 1.00× | 1168×755, 1312×848, 1496×967, 1728×1117*, 2056×1329 (secondary sources) |

`*` = the exact-2× mode. Every laptop also exposes 1× ("low resolution") modes at true panel pixel counts when
"Show all resolutions" is on — rare, but they exist (see §1.3).

Apple's current tech-spec pages no longer print the scaled-mode lists or which one is the default, so the 13.6" and
16" rows above rest on Apple Support Communities / MacRumors / Eclectic Light reports; the 15" and 14" rows were
**measured** today. A student's 13.6" Air is the case that matters most: it is the most common machine and its
factory default is a non-integer scaled mode.

### 1.2 How macOS reports a scaled mode (measured, corrects two Perplexity claims)

* `NSScreen.frame` is the "looks like" size in points; `backingScaleFactor` is 2 in every HiDPI mode. The engine's
  `FDisplayMetrics` is `frame × backingScaleFactor` (`MacApplication.cpp:1816`, `:2236`), i.e. the **virtual**
  framebuffer, not the panel. Slate, `r.setres`, `GetSizeInScreen`, the repair's target and AppKit's `visibleFrame×2`
  all live in that same virtual pixel space, so the geometry is self-consistent on every mode. This is why build 42's
  arithmetic is expected to hold on all panels: nothing in it is panel-specific any more.
* A Metal drawable is virtual-sized, so on a default 13.6" Air the game renders **2940×1912** and the window server
  downsamples to 2560×1664: ~32 % more pixels than the panel, paid for in GPU time and (slightly) in sharpness. On
  "More Space" (1710×1112) it is 3420×2224, +79 %.
* `CGDisplayPixelsWide/High` returns **points** (1440×932 on the Air, 1512×982 on the MBP), not panel pixels — it is
  useless for finding the panel. The panel's true size is the largest non-HiDPI mode in `CGDisplayCopyAllDisplayModes`
  (2880×1864 / 3024×1964 today) or `CGDisplayModeGetPixelWidth` of the exact-2× mode.
* `visibleFrame` already excludes the menu bar including the camera housing, and the Dock on whichever edge it is on
  (left/right Docks move `minX`/`maxX`, not `minY`); it grows when the Dock auto-hides; Apple says never to cache it.

### 1.3 Today's survey of the two Macs (read-only, `display_modes.swift`)

| | Air (M4, macOS 15.7.7) | Lab MBP (M5 Pro, macOS 26.5.2) |
| --- | --- | --- |
| Current mode | 1440×932 pt → 2880×1864 px (exact 2×), 60 Hz | 1512×982 pt → 3024×1964 px (exact 2×), 120 Hz |
| HiDPI modes offered | 960×600 … 1920×1243 (virtual 1920×1200 … 3840×2486) | 960×600 … 1800×1169 (virtual 1920×1200 … 3600×2338) |
| 1× modes offered | 1920×1200 … 2880×1864 at scale 1 | 1920×1200 … 3024×1964 at scale 1 |
| Menu bar (frame − visibleFrame top) | 34 pt = 68 px | 33 pt = 66 px |
| `safeAreaInsets.top` (notch) | 28 pt = 56 px | 32 pt = 64 px |
| Dock (bottom) | 60 pt = 120 px (`tilesize 64`) | **75 pt = 150 px** (was 146 on 2026-09-21 afternoon — the Dock moves) |
| Title bar | 28 pt = 56 px | 28 pt = 56 px |
| `NSStatusBar.thickness` | 22 pt (the bar proper; the housing adds the rest) | 22 pt |

A non-notch M1 Air will read a 24–25 pt menu bar (48–50 px) — never measured by us; the repair reads it at run time.

### 1.4 What build 42 already gets right, and what it does not cover

Right: display, menu bar, title bar and Dock read from AppKit per tick for the screen the window is on; everything in
backing pixels; target re-derived every tick so a Dock or mode change produces a new target with a fresh correction
budget; overrides via cvars; fallbacks only when AppKit reports no screens.

Not covered or never exercised:

1. **Never run on a scaled mode, a non-notch panel, a 1× mode, an external display, or a side/hidden Dock.** The
   arithmetic says it works; nothing has shown it.
2. **Render cost on scaled modes** (13.6" Air default, any "More Space"): the tuner measures the phantom pixels and
   settles a rung lower than the panel deserves; a fanless M1/M2 Air on "More Space" may miss 30 fps at Low.
3. **The resolution row mixes units** after the engine patch: HiDPI modes appear in points (1440×932), 1× modes in
   pixels (2880×1864). `FindDisplayResolutionIndex` tries display/1, /2, /4 and then "largest that fits", so on a
   scaled-mode machine (display 2940×1912) it should find 1470×956 — but if it ever falls to the fallback it could
   pick the 1× entry 2560×1664 (points!) and ask for a 5120-px-wide window. Unverified.
4. **Side Dock / Stage Manager**: the target is always the full display width at X = 0; a left Dock (or the Stage
   Manager strip) would sit over the game's left edge. `visibleFrame` carries the answer; the repair ignores its X.
5. **Fallback constants** are the Air's (68/56/120) — harmless on any Retina Mac, wrong by 2× on a 1× external
   display, but reached only when AppKit returns no screens.
6. **Fullscreen trim** (`gfx.MacFullscreenTrim` 74, next-phase item 0) is a per-machine constant; the notch height
   `safeAreaInsets.top × scale` (56 on the Air, 64 on the MBP) plus the menu bar is the calculable version.
7. **Smallest virtual case**: 13.3" Air at 1024×640 → content 2048×(1280−50−56−120) ≈ 2048×1054; UMG is
   `ScaleToFit` with the default DPI curve, so UI scale ≈ 0.98 there — should be fine, never seen.

---

## 2. Phases

### Phase 1 — Prove it on the panels we can emulate (no code, ~half a day, needs operator permission)

Each HiDPI mode a Mac offers is a faithful emulation of another laptop's *virtual* space (a 15" Air at 1470×956 is a
13.6" Air's default; at 1024×663 it is the smallest case; 1× 2880×1864 is the low-resolution case). Run Development 42
unattended (`mac_runtime_test.sh dev <label> 90 term`) on the Air and the lab MBP through this matrix, reading
`[GraphicsAutoTune] MacWindow=` / `Trace1..3` / the insets log line each time, with one `screencapture` per state
taken from a second launch (the first frame over ssh is stale):

| Axis | Air values | MBP values |
| --- | --- | --- |
| Display mode | 1024×663, 1280×828, 1440×932, 1710×1107, 1920×1243, 1× 2880×1864 | 1024×665, 1352×878, 1512×982, 1800×1169, 1× 3024×1964 |
| Dock | bottom default, bottom `tilesize 128`, left, auto-hide | same |
| Menu bar | default, auto-hide ("Automatically hide and show the menu bar") | same |
| External display | one run with the Air on an external monitor at scale 1 if one is available | — |

Also in this phase: (a) confirm what the resolution row lists in a scaled mode and what the tuner selected
(§1.4 item 3); (b) record the tuner's rung/percent per mode so Phase 3 has a baseline; (c) ask the operator whether
their Air's 1440×932 was changed from the factory setting (decides the 15" row's default); (d) if a student's 13.6"
Air or M1 Air can be borrowed for an hour, one real run each beats all emulation. Changing display modes uses
`displayplacer` (Homebrew) or System Settings; every change is restored afterwards and the operator is asked before
touching the Air. Output: a results table appended to this file. Exit criterion: every cell reads
`reached … after ≤1 correction`, controls visible above the Dock, click alignment right in a hand check on at
least the two extreme modes per machine.

### Phase 2 — Harden the repair for what Phase 1 shows (masters only, 1 day)

Expected items, trimmed or extended by Phase 1:

1. **Horizontal insets.** Add `Left`/`Right` to `FMacDisplayInsetsPx` from `visibleFrame.minX`/`maxX`; the target
   becomes `visible width × scale` at `X = origin + left`. Side Docks and the Stage Manager strip stop overlapping.
2. **Panel awareness.** Add `PanelWidth/PanelHeight` (largest non-HiDPI `CGDisplayMode` for the screen's display ID)
   and `VirtualOverPanel` to the insets struct; log and trace `display 2940x1912 virtual over a 2560x1664 panel
   (1.32x)`. Read-only in this phase; Phase 3 consumes it.
3. **Notch height** from `safeAreaInsets.top × scale` into the struct, for item 0's fullscreen trim (§1.4 item 6):
   trim = menu bar when the game is under it, or notch height when the fullscreen geometry covers the menu bar. The
   constant 74 becomes an override (0 = auto), same pattern as the other three cvars.
4. **Fallbacks by scale**, not the Air's pixels: 25/28/0 pt × backing scale (menu bar without notch, title bar, no
   Dock) so the no-screens path is at least plausible on a 1× display.
5. **Screen-parameter changes**: the per-tick re-read already retargets; add one trace line when the display size or
   insets change mid-session so a Shipping ini shows *why* the window moved.
6. **Guard the minimum**: if the computed content height would be < 720 px (only 1× modes or a tiny external
   display get there), keep the window but log it; do not shrink below what the UI can hold.

All Mac-only, behind the existing cvars; Windows recompiles unchanged code.

### Phase 3 — Scaled modes: stop rendering phantom pixels (tuner, half a day + Phase 1 data)

Decision for the operator (see §3): when `virtual > panel`, cap the tuner's *starting* screen percentage at
`panel width ÷ virtual width` (13.6" default → 87 %, 13.6" "More Space" → 75 %, 15" at 1710×1107 → 84 %), so the
measurement and the committed rung reflect real pixels; the tuner still lowers it further if the budget demands.
Alternative: leave it to the tuner (it measures the true cost anyway) and only fix sharpness by advice — cheaper,
but a fanless Air on "More Space" then lands on Low for no visible gain. Also in this phase: make
`FindDisplayResolutionIndex` unit-safe (prefer the entry equal to the frame in points; never take a 1× entry larger
than the frame in points), and bump `TuneVersion` 4 → 5 on macOS only so already-tuned installs re-measure once.

### Phase 4 — Build 43 and re-verification (1 day, both platforms)

Windows first (`package_win_43.bat stage`, Dev + Shipping compile, one CHIMERA run — that also clears open item 1,
Windows 42 never having run); then Mac Dev + Shipping via `package_mac_gfx.sh pre-build43 first`. Re-run the Phase 1
matrix on both Macs (scripted; the extremes by hand with the operator), Shipping read through the ini trace. Exit
criterion as Phase 1 plus: on a scaled mode the trace shows the panel line and the capped starting percentage; no
regression on the two exact-2× machines (window `2880x1620 @ 0,124` / `3024x1692 @ 0,122`, allowing for the
MBP's Dock now being 150 px). Handoff, memory and this plan updated; zips only when told.

### Phase 5 — Student-facing guidance and the lab SOP (2 hours)

One paragraph for students: the game runs windowed under the menu bar on purpose; if the bottom controls are hidden,
the Dock is set to auto-hide-off-and-huge or the display was changed mid-session — quit and relaunch; the Options
menu's Fullscreen is supported (after item 0). The panel matrix and the survey script go into the handoff/SOP so the
next new laptop (an M5 Air, an M6 anything) is a 5-minute survey, not a session.

---

## 2a. Phase 1 results (2026-09-21 19:05–19:20, both Macs at once, Development 42, unattended, operator logged in on some cells)

Harness: `tools/mac/display_survey/` — `set_mode.swift` (session-scoped `CGConfigureDisplayWithDisplayMode`),
`win_bounds.swift` (`CGWindowListCopyWindowInfo`: the window as macOS places it), `phase1_run.sh` (one cell),
`phase1_matrix.sh` (the list). Raw results: `report/panel-matrix-2026-09-21/{air,mbp}/`. Verdict per cell = the
game's own `MacWindow=` line agreeing with the window bounds macOS reports (`frame` = content + 56 px title bar).

| Cell | Virtual px | OS insets menu/title/Dock (px) | Window macOS saw (px, frame) | Game's `MacWindow=` | Verdict |
| --- | --- | --- | --- | --- | --- |
| Air 1440×932 (exact 2×) | 2880×1864 | 68/56/120 | 2880×1680 at 0,68 | reached 2880×1624 windowed at 0,124, 1 correction | OK |
| Air 1024×663 (smallest) | 2048×1326 | 52/56/94 | 2048×1182 at 0,52 | reached 2048×1126 at 0,108, 1 | OK |
| Air 1280×828 (≈13.6" Air 1280×832) | 2560×1656 | 62/56/110 | 2560×1486 at 0,62 | reached 2560×1430 at 0,118, 1 | OK |
| Air 1710×1107 (15" "default" per sources) | 3420×2214 | 78/56/140 | 3420×2000 at 0,78 | reached 3420×1944 at 0,134, 1 | OK |
| Air 1920×1243 (More Space) | 3840×2486 | 86/56/152 | 3840×2252 at 0,86 | reached 3840×2196 at 0,142, 1 | OK |
| Air 2880×1864 at 1× | 2880×1864 | 62/28/85 | 2880×1717 at 0,62 | reached 2880×1689 at 0,90, 1 | OK |
| Air Dock tilesize 128 | 2880×1864 | 68/56/124 | 2880×1674 at 0,68 | reached 2880×1618 at 0,124, 1 | OK |
| Air Dock left (45 pt) | 2880×1864 | Dock 0, left 90 | 2880×1796 at 0,68 | reached 2880×1740 at 0,124, 2 | OK vertically; **window under the left Dock** (build 42 ignores left/right) |
| Air Dock auto-hide | 2880×1864 | Dock 0 | 2880×1796 at 0,68 | already right at launch (no new line) | OK |
| MBP 1512×982 (exact 2×) | 3024×1964 | 66/56/150 | 3024×1752 at 0,66 | reached 3024×1696 at 0,122, 1 | OK |
| MBP 1024×665 | 2048×1330 | 52/56/108 | 2048×1172 at 0,52 | reached 2048×1116 at 0,108, 1 | OK |
| MBP 1352×878 | 2704×1756 | 60/56/140 | 2704×1568 at 0,60 | reached 2704×1512 at 0,116, 1 | OK |
| MBP 1800×1169 (More Space) | 3600×2338 | 78/56/170 | 3600×2094 at 0,78 | reached 3600×2038 at 0,134, 1 | OK |
| MBP 3024×1964 at 1× | 3024×1964 | 65/28/90 | 3024×1809 at 0,65 | reached 3024×1781 at 0,93, 1 | OK |
| MBP Dock left (52 pt) | 3024×1964 | Dock 0, left 104 | 3024×1898 at 0,66 | reached 3024×1842 at 0,122, 2 | **under the left Dock** (same gap) |
| MBP Dock auto-hide | 3024×1964 | Dock 0 | 3024×1898 at 0,66 | reached 3024×1842 at 0,122, 1 | OK |
| MBP menu bar auto-hide | 3024×1964 | 64/56/0 | 3024×1898 at 0,64 | reached 3024×1842 | OK — on a notch panel the housing strip (32 pt) stays reserved even with the menu bar hidden |

Findings:

1. **The geometry holds on every mode and Dock**, from 2048×1326 to 3840×2486 virtual pixels and at 1×: the arithmetic
   is panel-independent as §1.2 predicted. One correction per launch is the norm (the saved size is the previous mode's).
2. **The only defect is horizontal**: a left (or right) Dock. Fixed in build 43 (`Left`/`Right` insets, §2 item 1).
3. The game reads the Dock **4 px smaller** than a fresh process does at 2× (146 vs 150, 92 vs 94, 116 vs 120 …; equal
   at 1×). Within the 4 px tolerance and inside the Dock's translucent margin; cause not chased (AppKit caches screen
   geometry per process at first use).
4. Every Development run logs the engine ensure `MetalStateCache.cpp:2359 Mismatched texture type` (EnsureReport
   written, run continues). Engine noise, present since before this work, absent in Shipping (ensures compile out).
5. A `SIGTERM` quit can take longer than 20 s while the ensure report is being written; the harness waits 60 s.
6. `defaults import com.apple.dock` + `killall Dock` does **not** restore the Dock (the dying Dock writes its own prefs
   back); both Macs were restored by deleting the keys explicitly. The Air's Dock now reads 62 pt where it read 60
   before the matrix (same `tilesize 64`; icon count decides the rest) — operator to eyeball.
7. Screenshots over ssh are stale wallpaper frames (known); `win_bounds` is the evidence.

## 3. Decisions the operator owns (RESOLVED 2026-09-21 evening)

1. Display changes on the Air — **approved**, done (Phase 1 ran on both Macs in parallel).
2. Borrowed student Air — **not available**; the performance claim of Phase 3 stays unverified on real 13.6" hardware.
3. Phase 3 policy — **Option A** (cap at the panel), with detailed backups; optimisation secondary to shipping.
4. Item 0 in build 43 — **approved**.
5. One build — **approved**, with detailed backups. Delivery: 2026-09-22.

Backups taken before any edit: Windows project `.backups/pre-panel-matrix-20260921T190356`, Mac project
`.backups/pre-panel-matrix-20260921T190403`, plans masters `.backups/pre-panel-matrix-20260921T190357/masters.tar`;
both Macs' `GameUserSettings.ini`/`Engine.ini`/Dock plist/display mode in `~/phase1_backup/`; the build-42 Mac apps
parked by `package_mac_gfx.sh pre-build43-20260921T192233 first`.

## 2b. Build 43 — as built (2026-09-21 evening; masters `graphics-autotune/src/`, applied to both projects, drift zero)

`MacDisplayInsets.h/.mm`: the struct gains `Left`, `Right` (visibleFrame's x edges: side Dock, Stage Manager),
`Notch` (`safeAreaInsets.top × scale`), `PanelWidth/Height` (largest non-HiDPI `CGDisplayMode` of the screen's
display, cached per display+mode; falls back to the current mode's pixel size), `BackingScale`, `VirtualOverPanel()`,
`IsScaledMode()`, `Signature()`.

`GraphicsAutoTuneSubsystem.cpp/.h`:

* `RepairMacWindow`: windowed target is `(display − left − right) × (display − menu bar − title bar − Dock)` at
  `(origin + left, origin + menu bar + title bar)`; insets logged and traced at the first repair **and whenever they
  change** (`insets-changed …`), with panel and virtual-over-panel; fallbacks are 25/28 pt × backing scale, no Dock.
* **Item 0 — `gfx.MacWindowRepair` default 1 → 3 = follow the options menu's screen-mode row.** Row 0 → windowed
  target; row 1 or 2 → trimmed Fullscreen target (`r.setres WxHf`, trim = `gfx.MacFullscreenTrim` or, at its new
  default 0, the OS menu-bar height). A fullscreen target is enforced only after a correct windowed window has been
  held ≥ 2 s (`MacWindowedReachedTime`, reset whenever the window is not windowed), or when the window is already
  Fullscreen. Values 1 and 2 keep their old meaning, so `[SystemSettings] gfx.MacWindowRepair=1` in `MacEngine.ini`
  reverts the behaviour without a rebuild.
* **Windowed start on every launch**: `Initialize()` (before the engine creates its window — `UGameEngine::Init` runs
  `InitializeStandalone` first, `CreateGameWindow` after) sets `GameUserSettings` FullscreenMode to Windowed if it was
  anything else, saves, and traces `startup mode forced Windowed (saved N)`. The menu re-applies its own mode after
  login; the repair makes it correct.
* **Phase 3**: `NativePercent` = 100, or `floor(100 / virtual-over-panel / 5) × 5` (≥ 50) in a scaled macOS mode; used
  wherever the ladder meant "native" (start, commits, the `== 100` checks, the resolution estimate's ceiling,
  `CommitBestSoFar`). Logged/traced as `scaled mode 1.15x: native scale 85%`. On macOS the Resolution row is no
  longer set at commit (`#if !PLATFORM_MAC`); `TuneVersion` 4 → 5 on macOS only.
* Windows: recompiled, behaviour unchanged (`Packaged\43-dev`, `43-shipping`, 19:19–19:20, `BUILD SUCCESSFUL`).

Not done (deferred, small): the M5 "user intent" latch (a dragged window is still put back), the 1× external-display
run, the borrowed-Air performance check.

## 2c. Build 43 verification, automated part (2026-09-21 19:19–19:38)

| Check | Result |
| --- | --- |
| Windows 43 Dev + Shipping compile/stage | `BUILD SUCCESSFUL`, `PACKAGE_EXIT=0` both (19:19, 19:20); no tuner warnings |
| Windows Shipping 43 on CHIMERA (interactive task, 120 s, `-nosplash`) | launched, `Trace1=startup on AC: AC measured, battery measured, nothing to measure` written 19:28:04, closed by the harness 19:30:10, no crash; copies verified (`3667e4b0…` dev exe md5) |
| Mac 43 package (`package_mac_gfx.sh pre-build43-20260921T192233 first`) | Dev 19:25 `DEV_EXIT=0`, Shipping 19:28, `ALL_DONE`; 42 apps parked |
| Air Dev 43 baseline (unattended, 150 s) | insets `menu 68 title 56 Dock 122 left 0 right 0 notch 56, panel 2880x1864 1.00x`; `reached 2880x1618 windowed at 0,124 after 1 correction`; macOS window frame 2880×1674 at 0,68; clean SIGTERM exit; tuner: `startup on Battery: … will measure` (menu never found without a login, as expected) |
| Air Dev 43, Dock on the left (45 pt) | insets `left 88`; `reached 2792x1740 windowed at 88,124 after 2`; macOS frame x=88 w=2792 — **the Phase 1 defect is fixed** |
| Air Shipping 43 baseline (90 s) | `reached 2880x1618 windowed at 0,124 after 1`; frame 2880×1674 at 0,68; clean exit; ini trace complete |
| Lab MBP Dev 43 (copied, md5 `bdcca4a8…` both ends), Dock on the left (52 pt) | insets `left 104 notch 64`; `reached 2920x1842 windowed at 104,122 after 2`; frame x=104 w=2920 — fixed on the second panel too |
| Lab MBP Dev 43 at 1800×1169 ("More Space", 3600×2338 virtual) | insets `display 3600x2338 … panel 3024x1964, 1.19x virtual` — **panel detection works**; window `3600x2038 at 0,134`; mode restored |
| Lab MBP Shipping 43 copied | md5 `6089d17e…` both ends; not yet run |

**Operator hand test of build 43 (19:45–20:00, Dev 43, Air then lab MBP):** fullscreen alignment "everything looked
fine" on the Air and "everything looked correct" on the MBP — the trim = OS menu bar is right on both panels, the
return to Windowed works, the re-tune ran. **One defect:** the window switched mode as soon as the row was cycled,
before Apply. Cause: the repair read the row's live `ButtonIndex`. **Fix → build 44:** the repair no longer reads the
row at all; it follows the mode the menu *applied*, detected as a window-mode change the repair did not issue itself
(`MacLastWindowMode`, `bMacRepairModeChangePending`/`MacRepairPendingMode` mark the repair's own transitions). Apply
runs the row's command, which is the only thing that changes the window's mode, so this is exactly "after Apply"; the
login re-apply of the saved mode goes through the same path. Windows 44 = recompilation; Mac 44 packaged
(`pre-build44-20260921T200324 first`, 43 apps parked).

**Build 44 automated verification (20:03–20:15):** Windows 44 Dev + Shipping `BUILD SUCCESSFUL` (20:03/20:04),
copied to CHIMERA `Downloads\awsTutorial-44-{dev,shipping}` (verified), Shipping 44 smoke run 120 s on CHIMERA
(`startup on AC … nothing to measure`, closed by the harness 20:09, no crash). Mac 44 Dev 20:06 / Shipping 20:09,
`ALL_DONE`. Air Dev 44 unattended: started **windowed** although the operator had quit build 43 from fullscreen
(Initialize guard works), `2880x1618 at 0,124` already right, clean exit. Lab MBP Dev 44 (md5 `e72fe332…` both
ends): `3024x1696 at 0,122` already right, clean exit; Shipping 44 on the MBP (md5 `6e52127a…`), not yet run.
Evidence from the operator's 43 fullscreen session in the MBP ini: while the app is fullscreen AppKit reports the
screen as `3024x1890` with menu bar 0 (the frame below the camera housing), so the enforced fullscreen height settles
at the OS's own fullscreen frame whatever the trim — consistent with "alignment correct" on both panels.
Pending: operator re-test of the Apply behaviour on both Macs.

## 3a. Decisions the operator owned (as written for review)

1. Permission to change display mode / Dock / menu bar settings on the Air for Phase 1 (all restored; the MBP is the
   lab's and can be driven freely).
2. Borrow a student's 13.6" Air (and ideally an M1 Air) for one real run each — yes/no, when.
3. Phase 3 policy: cap the starting screen percentage to the panel (recommended), or leave scaled modes to the tuner.
4. Whether next-phase item 0 (window mode follows the menu) rides in build 43 with Phase 2 item 3, or waits.
5. Order: Phase 1 first regardless; Phases 2–3 could be a single build 43 (recommended) or two builds.

## 4. Risks

* Emulation is not a panel: a scaled mode on the Air proves the *geometry* of a 13.6" Air, not its GPU budget; only a
  real M1/M2 Air proves the performance claim in Phase 3.
* Changing the display mode under a running game exercises `NSApplicationDidChangeScreenParameters` paths in the
  engine that no one has looked at; do it between runs, not during, unless testing item 5 of Phase 2 explicitly.
* macOS 26's menu bar (33 pt) is now barely taller than the notch (32 pt); a future macOS could let windows extend
  beside the housing, which would make `visibleFrame` and `safeAreaInsets` disagree — the struct carries both from
  Phase 2 on, so the policy is a one-line change.
* `CGDisplayCopyAllDisplayModes` with `kCGDisplayShowDuplicateLowResolutionModes` is the only way to see the 1×
  modes; reading it once per screen-parameter change is cheap, but it must not run every tick.

## 5. Evidence files

* `display_modes.swift` (session scratch; to be copied to `tools/mac/display_survey/` in Phase 1) and its output
  above (§1.3).
* Apple: support.apple.com/111883 (M1 Air, lists 1680×1050 / 1440×900 / 1024×640), /122209 and /126320 (13.6" Air
  M4/M5, 2560×1664 @224), /122210 and /126321 (15" Air, 2880×1864 @224), /121552 (14" MBP, 3024×1964 @254),
  /121554 (16" MBP, 3456×2234 @254); developer.apple.com/documentation/appkit/nsscreen/visibleframe,
  /safeareainsets, /backingscalefactor; HighResolutionOSX APIs guide (`CGDisplayModeGetPixelWidth`).
* Engine: `MacApplication.cpp` 1808–1822 (FramePixels = frame × scale), 2222–2240 (display metrics), 1220–1232
  (fullscreen sizes from `visibleFrame × DPI`); `engine-patches/MetalRHI-resolution-list.patch`.
