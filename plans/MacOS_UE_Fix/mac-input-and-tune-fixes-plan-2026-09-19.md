# Plan — Mac input repair, Mac resolution choice, and the Shipping auto-tune gate

2026-09-19, following the diagnosis in `report/mac-dev-build-mouse-and-resolution-2026-09-19.md`. All four changes are
in `Source/awsTutorial/GraphicsAutoTuneSubsystem.{h,cpp}`. **No engine changes**, no Blueprint changes.

## What is being fixed, and on what evidence

| # | Fault | Evidence | Fix |
| --- | --- | --- | --- |
| A | On macOS the game window is created directly in fullscreen from the saved settings; Slate caches a wrong window rect and a stale "is on active Space" flag, so no widget can be clicked and, once clicking works, clicks land ~1 cm below the pointer | Operator: Cmd-Tab restored clicking; switching to Windowed and back fixed the alignment **and it stayed fixed**. Engine: `MacWindow.cpp:487`, `CocoaWindow.cpp:38`, `MacApplication.cpp:1226-1249`, `MacWindow.cpp:712-718` | Do that window-mode round-trip **once at startup, automatically**, on macOS only |
| B | The Mac never reaches native resolution: the RHI halves the mode list, and the tuner looks up the viewport it is already in | `MetalRHI.cpp:1311-1317`; measured list tops out at 1440 × 932; `FindDisplayResolutionIndex` (`:1095`) | Choose the best entry **for the display** rather than looking up the current viewport |
| C | A Shipping build never benchmarks: it saves to `%LOCALAPPDATA%`, which held an options save from 2025, and the gate reads "menu save present + never tuned" as "the player chose these" | `App.cpp:219-223`; the stale `MyOptions.sav`; gate at `:403` | Gate on `TunedVersion` alone |
| D | Several failure paths disable the tuner permanently and silently, and Shipping has no log at all | Audit: `:396-401`, `:560-567`, `:650-656`, `:525-543` | Record `LastResult` on each, make give-up retryable, add a menu-wait timeout |

## A — macOS startup window repair

New Mac-only routine, run from the top of `Tick` so it works whether or not tuning is pending:

* waits until the game viewport window exists and ~3 s have passed since the level loaded — **before** the login
  screen is usable, since the bug also stops the player clicking Login;
* if the window is already Windowed, does nothing;
* otherwise issues `r.setres <W>x<H>` (windowed) at the window's current size, holds ~0.3 s, then re-issues the same
  size with the original mode's suffix (`wf` or `f`) — the exact round-trip the operator verified by hand, which the
  operator confirmed works for **both** Fullscreen and Windowed Fullscreen;
* runs once per session, and is gated by a cvar (`gfx.MacWindowRepair 0` to disable) so it can be turned off during
  review without a rebuild.

Cost: one brief flicker during loading. It does not touch saved settings.

## B — Resolution choice for the display

`FindDisplayResolutionIndex` keeps its exact-match attempts (Windows hits those), and when none match it now picks
**the largest entry that fits inside the display** instead of giving up and leaving the row alone. On this Mac that
selects 1440 × 932 — the desktop's point size, which renders at the full 2880 × 1864 through
`bAllowHighDPIInGameMode`. The choice is logged either way.

## C — The Shipping gate

```
- bPending = bForced || (TunedVersion < TuneVersion && (!bHasMenuSave || TunedVersion > 0));
+ bPending = bForced || TunedVersion < TuneVersion;
```

An install that has never been tuned now tunes once, whatever menu save happens to be lying in that directory, and
`TunedVersion` then stops it happening again. The duplicate menu-save check in `WaitForSettle` goes with it — it
contradicts the new gate and could disable the tuner permanently on a startup race. Opening the options menu during a
run still aborts it, as before.

## D — Diagnosability and no more permanent lockouts

* Give-up after cancelled runs: record the outcome **without** setting `TunedVersion`, and reset `Attempts`, so the
  next launch tries again instead of being disabled forever.
* Structural bail (menu lacks the expected rows) and the new menu-wait timeout (10 minutes, generous because the
  menu only exists after login) both write `LastResult`.
* Every skip is therefore visible in `GameUserSettings.ini` even in Shipping, where `UE_LOG` is compiled out.

## Order of work

1. Back up `Source/awsTutorial` into the project's `.backups/`.
2. Edit the two files.
3. Build the Windows editor, package **32-dev** and **32-shipping**.
4. Verify on CHIMERA, where the stale 2025 save still sits in `%LOCALAPPDATA%` — it is the test fixture for fix C.
   Expected: the Shipping build now benchmarks and lands at 2560 × 1600. (That save is **not** to be deleted.)
5. Only then sync to the Mac, rebuild, package both configs, and verify A and B there.
6. Nothing committed, nothing pushed.

---

## Built and verified, 2026-09-19 23:00–23:35

A fifth change was made during the work: **`TuneVersion` 1 → 2**. Without it the resolution fix could never reach any
install that had already been tuned — including this Mac, which carried `TunedVersion=1` from the morning's run — so
the tuner would have skipped forever and kept 1280 × 800. Bumping it is what that field exists for, and it costs each
existing install one short benchmark at next launch.

**Windows** — `Packaged\32-dev` and `Packaged\32-shipping`, cooked fresh (the stale cooked Immersive Mode materials
were dropped from the cook directory first). On CHIMERA, with the 2025 options save seeded into the test install:

```
Startup: will tune in the first level with the options menu (TunedVersion=0, attempts=0, options save present)
```

The same condition printed "no tuning needed" under the old gate. The macOS repair correctly does nothing on Windows.

**macOS** — both apps rebuilt (Development 23:27, Shipping 23:30); the previous build-30 apps are preserved, still
runnable, in `.backups/mac-input-and-tune-fixes-20260919/apps/`. A runtime test of the Development app:

```
[06.32.53:167] Startup: will tune in the first level with the options menu (TunedVersion=1, attempts=0, options save present)
[06.32.56:182] r.SetRes = "2880x1836"
[06.32.56:498] r.SetRes = "2880x1836wf"
[06.32.56:498] macOS window repaired (windowed round-trip, then r.setres 2880x1836wf), so clicks land where the pointer is
```

Fix A fires 3.3 s after the level loads, both legs of the round-trip in the right order 316 ms apart, at the window's
real size (2880 × 1836 — Slate's screen space on macOS is backing pixels, so this is the full panel less the menu
bar). Fix C decides to tune where the previous build said "no tuning needed". Clean exit, no crash, and **no errors or
warnings at all** from LogGraphicsAutoTune, LogSlate, LogViewport or LogWindows.

## Operator session, 2026-09-19 23:40 → 2026-09-20 00:10

**B and C are done.** With the operator logged in, the tuner ran on the Mac and did exactly what it should:

```
Startup: will tune in the first level with the options menu (TunedVersion=1, attempts=0, options save present)
Display is 2880x1836 and the menu's list has no such entry (4 entries); choosing its largest that fits: 1440x932
r.SetRes = "1440x932wf"
Result: Low, 30 fps, 100% resolution (settings save written) in 21 s
```

The Mac now runs at 1440 × 932 points — the desktop's own size, rendered at the full 2880 × 1864 — instead of
1280 × 800. On the next launch it correctly logged `no tuning needed (TunedVersion=2 ...)`, so the once-only
behaviour works too. No errors in either run.

**A is not fixed yet, and the log says why the first two attempts failed.**

* Attempt 1 (one-shot at startup) was undone: the options menu re-applies windowed-fullscreen at login
  (`r.SetRes = "1280x800wf"` at 06:40:50) and the tuner again a second later, and each reshape re-caches the wrong
  window rect.
* Attempt 2 (repeat whenever the game re-applies a mode) fired correctly — twice, at startup and 1.3 s after the
  login re-application — and still did not repair. The round-trip held the window for 0.3 s, and macOS *animates*
  the fullscreen transition, so it was almost certainly flipped back before it ever arrived in windowed mode.
* **Operator's decisive detail: clicks are OFFSET, not dead.** So `bIsOnActiveSpace` is fine in this state and the
  remaining fault is purely the cached window rect — `FMacApplication::OnWindowDidResize` caching
  `[NSScreen visibleFrame]` (the screen less the 28-point menu bar, hence the ~1 cm) as the window size.

**Attempt 3, built but untested** (Mac apps rebuilt 00:15 / 00:18, Windows repackaged 00:19 / 00:20): the round-trip
now waits until the window actually reports `EWindowMode::Windowed` (up to 3 s), holds 0.8 s from that moment, and
only then returns to the saved mode.

**The cheaper alternative to test first.** In *true* Fullscreen — not Windowed Fullscreen — Slate applies a cursor
transform that it deliberately skips in windowed-fullscreen (`SlateApplication.cpp:4457-4474`, guarded on
`EWindowMode::Fullscreen`), scaling the pointer by window size over display size. That is exactly the 2880 × 1836
versus 2880 × 1864 discrepancy. If true Fullscreen is clean, the macOS fix is one default rather than a flicker, and
`gfx.MacWindowRepair 0` turns the round-trip off. The operator set Screen Mode to Fullscreen before quitting, though
`GameUserSettings.ini` still reads `FullscreenMode=1` (the menu keeps its own mode in `MyOptions.sav`), so the next
run's `r.setres` suffix — `f` or `wf` — will say which mode it actually starts in.

### Next session, in order

1. **Do not launch the game without the operator present** (their standing instruction from 2026-09-20 00:10).
2. Launch the Mac Development app with `gfx.MacWindowRepair 0` (via `[SystemSettings]` in
   `~/Library/Application Support/Epic/awsTutorial/Saved/Config/Mac/Engine.ini`, then remove it afterwards) in true
   Fullscreen, and check pointer alignment at the login screen — no login needed, hovering is enough.
3. If that is clean: default macOS to Fullscreen and drop the round-trip.
4. If not: run the same build with the repair enabled and read the timing — the new log line reports whether the
   window ever reported windowed.
5. Still untested anywhere: **the Shipping build on either platform**, and fix D's `LastResult` on a skip.
