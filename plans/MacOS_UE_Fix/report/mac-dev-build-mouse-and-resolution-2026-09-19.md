# Report — the settings-menu mouse and the display resolution (Mac, and Windows Shipping)

2026-09-19. Investigation only; **nothing was changed** on any machine. Evidence: the operator's own runs, the games'
saved settings on both platforms, the UE 5.4.1 engine source, and a read-only probe of the display modes macOS offers.

## The short version

This is not a Mac bug. It is **one symptom with two different causes**, and they meet at the same place: the game ends
up rendering at a resolution that is **not** the desktop's, in windowed fullscreen — and that is when the mouse stops
landing where the pointer is drawn, while the keyboard keeps working.

| Build | Auto-tune | Resolution applied | Desktop | Result |
| --- | --- | --- | --- | --- |
| Windows **Development** (CHIMERA) | ran tonight → *High, 60 fps* | **2560 × 1600** | 2560 × 1600 | works |
| Windows **Shipping** (CHIMERA) | **never ran** | **1280 × 720** | 2560 × 1600 | mouse + resolution |
| Mac **Dev and Shipping** | ran, but could not match the display | **1280 × 800** | 1440 × 932 points | mouse + resolution |

Both failing cases share "applied resolution ≠ desktop resolution". The working case is the one where they match.

The machine: MacBook with **Apple M4**, built-in Liquid Retina, **2880 × 1864 pixels**, desktop point space
**1440 × 932**, backing scale **2**, macOS 15.7.7. CHIMERA: 2560 × 1600 at 150 % Windows scaling.

---

## 0. Why the Shipping build never benchmarks — found, and it is my bug

**A Development build and a Shipping build do not share a save location.** A staged Development build writes beside
itself (`awsTutorial-30-dev\awsTutorial\Saved\`); a Shipping build is an *installed* build and writes to
`%LOCALAPPDATA%\awsTutorial\Saved\`. Confirmed on CHIMERA: the Development folder has its own `Saved` written tonight,
and the Shipping run wrote to `%LOCALAPPDATA%` instead.

That `%LOCALAPPDATA%` location already contained **`SaveGames\Settings\MyOptions.sav` dated 11 July 2025** — the
options save of a build from over a year ago — and a `GameUserSettings.ini` with **no `[GraphicsAutoTune]` section at
all**, i.e. `TunedVersion = 0`.

Now the gate in `GraphicsAutoTuneSubsystem.cpp:403`:

```cpp
bPending = bForced || (TunedVersion < GfxAutoTune::TuneVersion && (!bHasMenuSave || TunedVersion > 0));
```

with `MenuSlotName = "/Settings/MyOptions"` (line 60). For the Shipping build: `TunedVersion = 0`, `bHasMenuSave =
true` → `(!true || false)` → **false**. The tuner logs "no tuning needed" and never benchmarks.

The intent was "never overwrite settings a player has already chosen". The flaw is that it cannot tell a player's
deliberate settings from a stale save left by an unrelated build — and because Shipping and Development save to
different places, the Shipping build always looks at that older, untuned location. So the stale 2025 save is applied
in full: **1280 × 720** windowed fullscreen on a 2560 × 1600 display, with near-Epic scalability
(`sg.ViewDistanceQuality=4`, `sg.AntiAliasingQuality=4`, `sg.ReflectionQuality=4`, `sg.PostProcessQuality=4`).

That single fact explains everything the operator saw on Windows Shipping: no benchmark, no automatic settings, a
blurry stretched picture (1280 × 720 is 16:9 on a 16:10 panel), and the mouse landing in the wrong place.

**Fix directions** (none applied): gate on `TunedVersion` alone and treat "no `[GraphicsAutoTune]` section" as
untuned regardless of the menu save; or stamp the tuner's version *into* the menu save so a foreign save is
recognised; or, simplest and safest for a release, have the tuner run whenever the applied resolution does not match
the display, which is the condition that actually hurts.

**Who this hits, and who it does not.** A machine that has *never* run this game has no `MyOptions.sav`, so
`bHasMenuSave` is false, the gate opens and the Shipping build tunes normally. The failure is specific to machines
carrying an options save from an earlier build — CHIMERA (July 2025 save) and, very likely, the operator's own
workstation. That is worth knowing before drawing conclusions about what a fresh tester will see, and it is also why
this went unnoticed until now.

**A Shipping build writes no log.** `%LOCALAPPDATA%\awsTutorial\Saved\Logs` contains only `cef3.log` — UE compiles
logging out of Shipping by default, so there is no `awsTutorial.log` to read. Diagnosing Shipping means reading
`GameUserSettings.ini` and the save files, or shipping a build with `bUseLoggingInShipping=True`.

**The tuner cannot run before login.** Forcing it with `-GraphicsAutoTune` on CHIMERA changed nothing, because the
game stops at the Cognito login screen and the tuner waits for the options menu, which is past it. That is a limit on
*automated* testing, not an explanation of the fault: the operator's own 22:04 run did log in (`UserToken.sav`
rewritten at 22:04:32) and reached the settings menu, and still wrote no `[GraphicsAutoTune]` section — which is the
gate, exactly as described above.

### Confirmed in the engine source, plus four more traps in the same file

A separate read-only audit of the subsystem against the UE 5.4 source confirmed the mechanism and found more:

* **The redirect is hard-coded.** `FApp::IsInstalled()` (`Core/Private/Misc/App.cpp:219-223`) returns true for
  `UE_BUILD_SHIPPING && PLATFORM_DESKTOP`, which sends `FPaths::ProjectSavedDir()` — and with it
  `GGameUserSettingsIni` *and* the save-slot path — to `%LOCALAPPDATA%`. Nothing in the project causes this; it is
  how Shipping is defined. The staged trees carry no `InstalledProjectBuild.txt`, so Development stays local.
  The dev workstation's own `%LOCALAPPDATA%` copy of `MyOptions.sav` is dated 2025-09-25, so Shipping would misbehave
  there too.
* **The `TunedVersion > 0` half of the gate is dead code** while `TuneVersion == 1`: no integer satisfies
  `TunedVersion < 1 && TunedVersion > 0`. It only comes alive when `TuneVersion` is bumped — which, usefully, would
  also release every install currently stuck.
* **`Attempts` is a one-way ratchet.** It is incremented at the start of every run (`:668`) and cleared only by a
  finishing outcome, while an abort (level change, menu opened, pawn repossessed) records nothing. Three interrupted
  runs hit the give-up path, which writes `TunedVersion = 1` — disabling the tuner *permanently*, not for that
  session.
* **A startup race can disable it permanently too.** `WaitForSettle` (`:560-567`) checks for the menu save a second
  time; if the Antize menu writes its own save during startup, after `Initialize` but before the settle check, the
  run is cancelled and `TunedVersion = 1` is written. Blueprint timing differs between Dev and Shipping, so this is
  configuration-sensitive.
* **`WaitForMenu` has no timeout** (`:525-543`). If the menu is never found — a renamed component class, a
  `W_OptionsRef` not yet set, `IsInViewport()` false — it polls forever, records nothing, and in Shipping prints
  nothing.

**A defect worth fixing on its own account:** `SetRow`'s failure return is ignored at all eleven call sites
(`:723, :727, :731, :745, :941, :945, :947, :948, :952, :1007, :1011`). A row that cannot be set is logged and then
treated as applied, and the run commits a result that was never actually put into effect. That is exactly what
happened on the Mac: `FindDisplayResolutionIndex` returned `INDEX_NONE`, the resolution row was left alone, and the
tuner still recorded "Low, 30 fps, 100% resolution" as a success.

Every one of these failure paths is silent in Shipping, because `UE_LOG` is compiled out
(`USE_LOGGING_IN_SHIPPING` defaults to 0; the project's `Target.cs` does not override it). Writing `LastResult` on
each of them would make this whole class of problem self-diagnosing from the ini alone. The frame-timing path itself
is fine in Shipping — `FApp::GetDeltaTime`, `GGameThreadTime`, `GRenderThreadTime` and `RHIGetGPUFrameCycles` are all
assigned outside `#if STATS`.

---

## 1. The resolution — root cause found, and it is an engine bug

**What the game did.** It ran at **1280 × 800**, windowed fullscreen, for the whole session:

```
[04.16.34] r.SetRes = "1280x800wf"      <- applied by the menu at startup
[04.18.18] r.SetRes = "1280x800f"       <- operator switching window mode
[04.18.31] r.SetRes = "1280x800wf"
```

The same menu on Windows applies the panel's real resolution — CHIMERA's logs show `r.SetRes = "2560x1600wf"` on a
2560 × 1600 display. So the menu logic is fine; the **list it is given on macOS is wrong**.

**Why.** The menu's resolution row is filled from `GetSupportedFullscreenResolutions`, which ends in the Metal RHI —
`Engine/Source/Runtime/Apple/MetalRHI/Private/MetalRHI.cpp`, line 1297:

```cpp
const int32 Scale  = (int32)FMacApplication::GetPrimaryScreenBackingScaleFactor();   // 2 on Retina
const int32 Width  = (int32)CGDisplayModeGetWidth(Mode)  / Scale;                    // divided again
const int32 Height = (int32)CGDisplayModeGetHeight(Mode) / Scale;
```

`CGDisplayCopyAllDisplayModes` already reports each mode at its own size; UE divides by the Retina scale a second
time, so every resolution the game offers is **half the real one in each axis — a quarter of the pixels**.

Measured on this Mac (read-only probe, `CGDisplayCopyAllDisplayModes` + `NSScreen.backingScaleFactor`):

| | Values |
| --- | --- |
| Modes macOS offers | 1920×1200, 2048×1280, 2048×1326, 2560×1600, 2560×1656, 2880×1800, **2880×1864** |
| What the game is told (÷2) | 960×600, 1024×640, 1024×663, **1280×800**, 1280×828, 1440×900, **1440×932** |

So **1440 × 932 is the highest resolution the menu can ever show on this machine**, and 1280 × 800 — what it actually
ran at — is the fourth entry down. The panel's real 2880 × 1864 can never appear in that list.

Two further consequences worth knowing:

* **1440 × 932 is not really a downgrade.** It is exactly the desktop's point size, and with
  `bAllowHighDPIInGameMode=True` (set in this project on 2026-09-18) the engine renders it at the full 2880 × 1864
  pixels. The top entry in that list *is* native Retina. 1280 × 800, by contrast, renders at 2560 × 1600 and is then
  stretched onto a 2880 × 1864 panel.
* **The aspect ratio is wrong too.** 1280 × 800 is 1.600; this display is 1.545. 1440 × 932 matches the panel exactly.

The engine's own `GameUserSettings.ini` on the Mac stores `ResolutionSizeX=2880 / ResolutionSizeY=1864`, so UE knows
the true size — it is only the menu's list that is halved.

### Why the tuner did not rescue it on the Mac — a second bug, also mine

On the Mac the tuner *did* run (`TunedVersion=1`, `LastResult=Low, 30 fps, 100% resolution`, `MyOptions.sav` written
08:16), and it still left the game at 1280 × 800. The reason is in `FindDisplayResolutionIndex`
(`GraphicsAutoTuneSubsystem.cpp:1095`): in fullscreen it takes **the current viewport size** and looks *that* up in
the menu's list, rather than asking which entry best matches the display. On Windows those coincide, because the game
is already at the display's resolution. On the Mac they do not:

* `DpiScale` comes from `Window->GetDPIScaleFactor()`, which on macOS is **1.0** (Retina is handled by the backing
  scale, not by Slate's DPI scale), so the three divisors it tries are all 1 — the fallbacks written for exactly this
  case never engage.
* The viewport reports the size the game is *already* running at. So the lookup either fails outright (searching for a
  2560 × 1600 backbuffer in a list that stops at 1440 × 932, which logs "not in the menu's resolution list" and leaves
  the row untouched) or it "finds" 1280 × 800 and confirms the resolution it started from.

Either way the tuner can never move a Mac to the top of its own list. The fix is to choose the best entry **for the
display** — on macOS, the desktop's point size, which is the last entry — instead of looking up the current viewport.

Both platform's Mac apps share one save location (`~/Library/Application Support/Epic/awsTutorial/Saved`), which is
why the Development and Shipping apps behave identically there.

### Fix options (none applied)

1. **Game-side, recommended.** On macOS, stop driving the window from the RHI list: set the window once to the
   desktop's point size from `FDisplayMetrics` (here 1440 × 932, i.e. true Retina) and let the resolution row control
   `r.ScreenPercentage` instead — which is how a Mac game is normally expected to behave, and how performance should
   be traded on a Retina panel anyway. This is a contained change in the existing `GraphicsAutoTuneSubsystem`; no
   engine rebuild.
2. **Engine-side.** Delete the `/ Scale` in `MetalRHI.cpp`. One line, but it needs a full Mac engine rebuild, it
   diverges from Epic's source, and it would then hand UE *pixel* sizes where it expects points — risking a window
   twice the intended size. Not recommended without care.
3. **Nothing, with a note to users.** Tell Mac users to choose the top entry (1440 × 932). That is the native display
   and costs nothing but a sentence in the instructions. It is also the first thing to try for §2 below.

**Performance caveat, honestly stated.** The auto-tune settled this Mac at *Low, 30 fps, 100 % resolution*, having
measured 32.7 / 30.8 / 24.2 ms per frame at High / Medium / Low — the M4 is GPU-bound on this content already. Moving
from 1280 × 800 to 1440 × 932 raises the pixel count by about 27 %, so expect to give some of it back through the
Screen Scale row rather than through a smaller window.

---

## 2. The mouse in the settings menu — leading explanation, one test needed

Nothing in the log shows a failure: input mode is set for a menu exactly as expected —

```
[04.16.34] LogViewport: Viewport MouseLockMode Changed, LockOnCapture -> DoNotLock
[04.16.34] LogViewport: Viewport MouseCaptureMode Changed, CapturePermanently_IncludingInitialMouseDown -> NoCapture
```

— and there are no Slate or input errors anywhere in the session.

**Most likely cause, and it follows directly from §0 and §1:** the game renders at a resolution below the desktop
inside a fullscreen window, at a different aspect ratio. Mouse hit-testing has to map the cursor through that
mismatch; keyboard navigation does not use coordinates at all, which is exactly the asymmetry that was observed.
Clicks land somewhere other than where the pointer is drawn, and the error grows toward the edges of the screen.

The Windows Shipping build corroborates this and rules out "a Mac problem": there the mismatch is **1280 × 720 inside
2560 × 1600** — a different platform, a different cause, the same symptom. And the one configuration where the
applied resolution equals the desktop (Windows Development, 2560 × 1600) is the one where the mouse behaves. Three
data points, one correlation.

*Caveat on my own testing:* synthetic clicks from the probe harness on CHIMERA never reached UMG either, but that is
almost certainly the harness — it sends clicks in physical pixels on a 150 %-scaled desktop — so it is not evidence
about the game one way or the other.

**The test that settles it — about two minutes, on the Development build:**

1. Open the console with **`** (backtick) and run `r.setres 1440x932wf`. Try the settings rows with the mouse again.
2. If that fixes it, the cause is confirmed and option 1 or 3 above is also the fix for the mouse.
3. If it does not, set the Window Mode row to **Windowed** and try again — that isolates the fullscreen path.

### What the engine source says — the resolution theory is dead, and there is a better candidate

A read-only audit of UE 5.4.1 settled the generic question first: **a render resolution below the desktop cannot
misplace clicks.** In windowed fullscreen the engine discards the requested size and makes the window fill the screen
(`Slate/SceneViewport.cpp:1341-1345`, `:1425-1439`), the backbuffer then follows the *window*
(`SceneViewport.cpp:1488-1499`), and hit testing uses that same single number
(`SlateCore/Private/Widgets/SWindow.cpp:2084`). The one cursor transform in the pipeline is deliberately restricted to
true exclusive fullscreen (`SlateApplication.cpp:4457-4474`). So Windows being fine at 1280 × 720 is expected, and the
Mac fault is elsewhere.

**The operator's refinement — the cursor moves normally, but *no* button responds — is itself diagnostic.** A
coordinate offset would activate the *wrong* button, not none. Something is returning an empty hit result.

**Leading candidate: `FMacWindow::IsPointInWindow` short-circuits on a stale `bIsOnActiveSpace`.**

```cpp
// ApplicationCore/Private/Mac/MacWindow.cpp:487-492
if (WindowHandle->bIsOnActiveSpace) { ...NSPointInRect... }
return PointInWindow;              // false when the flag is false
```

That feeds `SWindow::IsScreenspaceMouseWithin` (`SWindow.cpp:1586-1590`) and then
`FSlateApplication::LocateWidgetInWindow` (`SlateApplication.cpp:1801-1824`), which returns an **empty widget path**
— so every move, hover and click reaches nothing. Keyboard is untouched because key events route to the focused
widget with no hit test at all.

The flag is set **once**, in `initWithContentRect:` before the window is ever shown (`CocoaWindow.cpp:38`), and
refreshed in only two places: the active-Space notification (`MacApplication.cpp:158-161`, dispatched to the main
queue) and app activation (`MacApplication.cpp:1499-1501`). And UE implements *windowed fullscreen* on macOS with
**native fullscreen** — `[WindowHandle toggleFullScreen:nil]` (`MacWindow.cpp:712-718`) — which moves the window into
its own Space, while `WaitForFullScreenTransition` busy-spins and can finish before that main-queue notification
runs. Epic's own comment at `MacApplication.cpp:1499` records that this flag is already known to read wrong in some
circumstances.

Also relevant structurally: **Windows re-reads the real client rect on every size change**
(`WindowsWindow.cpp:949-962`, `AdjustCachedSize`); **macOS has no such override at all**, so any Mac-side window-rect
error is permanent. Which matters for the runner-up below.

**Runner-up (produces an offset, not total failure):** `FMacApplication::OnWindowDidResize`
(`MacApplication.cpp:1226-1249`) passes a *size difference* as the window position and uses `[NSScreen visibleFrame]`
— which excludes the menu bar and a visible Dock — as the window size in fullscreen modes. The hit-test grid is then
shifted and shrunk against the pixels actually on screen (roughly 95 points vertically with the Dock showing, plus
about 11 % vertical stretch). That would make rows hard to hit, not impossible.

### Operator test, 2026-09-19 — both predictions confirmed

> "command tab worked but the alignment was off. the mouse was being picked up about a centimeter below it was
> appearing on the screen."

That is both defects, observed one after the other:

* **Cmd-Tab restored clicking** → `bIsOnActiveSpace` was indeed stale, and app activation refreshed it
  (`MacApplication.cpp:1499-1501`). Confirmed.
* **Clicks then landed about a centimetre below the pointer** → the runner-up, `OnWindowDidResize` feeding Slate
  `[NSScreen visibleFrame]` as the window size and a size *difference* as the window position
  (`MacApplication.cpp:1226-1249`). The menu bar is 24–37 points tall and this display runs about 43 points per
  centimetre, so a menu-bar-sized origin shift is almost exactly the centimetre reported. Confirmed.

Both are engine defects in the macOS backend, both specific to the fullscreen branch
(`TargetWindowMode == WindowedFullscreen || Fullscreen`), and both are avoided entirely by running **Windowed**,
which takes the `setFrame:` path at `MacWindow.cpp:651` and never enters a separate Space.

### Tests, in order of how decisive they are

1. **Cmd-Tab away from the game and back, then click.** App activation re-reads the flag for every window
   (`MacApplication.cpp:1499-1501`). If clicks start working, `bIsOnActiveSpace` is confirmed — and so is a usable
   workaround. A Mission Control swipe to another Space and back does the same thing.
2. **Run windowed:** set Screen Mode to Windowed, or launch with `-windowed -ResX=1280 -ResY=800`. That path never
   calls `toggleFullScreen:` (`MacWindow.cpp:651`), so the window stays in the normal Space. Clicks working windowed
   and failing in windowed-fullscreen points at the Space transition rather than any coordinate maths.
3. **`r.setres 1440x932wf`** — match the desktop exactly. Still failing at a matched resolution rules the runner-up
   out and the Space flag in.
4. Toggle `bAllowHighDPIInGameMode`, or launch with `-nohighdpi`: this flips Slate's whole screen space between
   points and backing pixels. If nothing changes, units are not involved.

---

## 3. Incidental finding — the injected "Video" audio row logs a Blueprint warning

At startup, while the menu applies saved audio settings, three Blueprint warnings fire:

```
LogScript: Warning: Switch statement failed to match case for index property Temp_byte_Variable
  W_TemplateAudio_C … Audio_Video
  Function /Game/AntizeMenuSystem/Widgets/W_TemplateAudio.W_TemplateAudio_C:ChangeAudio
```

This is the **Video** row added in build 30. The row is created at runtime with a new enum index, and
`W_TemplateAudio`'s own `ChangeAudio` switch has no case for it, so the Blueprint's branch does nothing — the volume
is applied by `VideoPlayerVolumeSubsystem` in C++ instead, which is why the row works on both platforms.

It is cosmetic, it fires only at startup, and it is **not** related to the mouse (the warnings stop before any
interaction). Worth cleaning up when the menu is next touched, either by adding the case in the Blueprint or by
having the C++ suppress the Blueprint call for that index.

---

## What was checked and found healthy

* `NSHighResolutionCapable` is `true` in both packaged Mac apps — the app is correctly Retina-capable.
* `bAllowHighDPIInGameMode=True` is present in the Mac project config as well as the Windows one.
* No Slate, viewport or input errors in the run; the only warnings are the three above plus unrelated
  bandwidth-probe and voice-chat noise.
* The Mac and Windows `DefaultEngine.ini` differ only in the Mac signing and entitlement lines
  (`bMacSignToRunLocally=True`, `PremadeMacEntitlements`) — expected, and unrelated.
