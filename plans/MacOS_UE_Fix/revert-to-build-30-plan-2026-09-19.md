# Plan — archive the Immersive Mode project, revert to the last working version, package dev + shipping

Written 2026-09-19. **Nothing has been changed.** This is the execution plan for approval.

Goal: (1) a zipped copy of the project exactly as it stands, so Immersive Mode can be picked up later; (2) the project
reverted to the last fully working version; (3) a matched Development + Shipping pair packaged from that reverted tree.

---

## What the revert actually involves (measured, not assumed)

The last fully working version is **build 30** (speaker selection, the OrbitingScreen Q fix, video volume with its own
sound class, and the Video row in the audio settings) — operator-verified on CHIMERA.

Everything Immersive Mode added to the project is **four files**:

| File | Added |
| --- | --- |
| `Source/awsTutorial/ImmersiveViewSubsystem.cpp` | 18:29 today |
| `Source/awsTutorial/ImmersiveViewSubsystem.h` | 18:29 today |
| `Content/Blueprints/Immersive/M_ImmersiveBlackout.uasset` | 17:14 today |
| `Content/Blueprints/Immersive/M_ImmersiveFloor.uasset` | 17:14 today |

Checks behind that claim:

* `awsTutorial.Build.cs` last changed **09:22** — before Immersive Mode; no module was added for it.
* `Config/DefaultEngine.ini` last changed **12:41** (the video-volume work).
* `Config/DefaultGame.ini` has a 16:55 timestamp but is **byte-identical** to the build-30-era copy in
  `.backups/video-volume-v2-20260919T131616` — an editor run touched it, nothing changed. No immersive path was ever
  added to the project config (`grep -ri immersive Config/` → nothing).
* Only those two `.uasset` files under `Content/` were modified after the build-30 package was made (13:51).
* No Blueprint asset was edited for Immersive Mode — the button is injected at runtime. The hand-patched
  `BP_FirstPersonCharacter` (OrbitingScreen, 12:14) belongs to build 30 and **stays**.
* The **Mac** has no Immersive Mode at all (checked read-only: no `ImmersiveViewSubsystem*`, no
  `Content/Blueprints/Immersive`). It is already at build 30. **No Mac work in this plan.**

Restore points that already exist: `.backups/pre-immersive-mode-20260919T170948/` (278 files, 167 MB: Config, Content
`.uasset`s, all 17 `Source/` files, editor binaries — no immersive anything) and the untouched `Packaged\30-dev` and
`Packaged\30-shipping`.

---

## Step 1 — Zip the project as it stands (before anything is touched)

The project directory is **216 GB**, nearly all of it rebuildable: `Packaged` 109 GB, `Intermediate` 51 GB, `Saved`
17 GB, `Binaries` 7.7 GB, and `Plugins/*/Intermediate` 14 GB. The part that cannot be regenerated is about **9 GB**:

```
awsTutorial.uproject
Config\          48 KB
Source\          280 KB      (includes both ImmersiveViewSubsystem files)
Content\         5.3 GB      (includes Content\Blueprints\Immersive\)
Plugins\         3.9 GB      (minus each plugin's Intermediate)
.backups\        ~1-2 GB     (every snapshot taken this week)
```

Command (detached, like the packaging runs; 7-Zip is installed):

```
"C:\Program Files\7-Zip\7z.exe" a -tzip -mx1 -slp ^
  "C:\Users\Dalton\Documents\Unreal_Projects\awsTutorial_ARBv3_post-Immersive-Mode_2026-09-19.zip" ^
  "C:\Users\Dalton\Documents\Unreal_Projects\awsTutorial_VoiceRPCNew_ARBv3\*" ^
  -xr!Packaged -xr!Intermediate -xr!Saved -xr!DerivedDataCache -xr!Binaries -xr!.vs -xr!*.sln
```

* Lands beside the existing project zips in `Documents\Unreal_Projects\`. 124 GB free on C:, the zip will be ~6-8 GB.
* `-mx1` = fast compression; the bulk is video, which will not compress further anyway. **Est. 15-25 min.**
* Project-level `Binaries` is excluded (7.7 GB, rebuilt by one editor compile); plugin `Binaries` are kept.

**Gate 1 — the zip is verified before anything is deleted:**
1. `7z t` on the archive (integrity), exit code 0.
2. `7z l` must list `Source/awsTutorial/ImmersiveViewSubsystem.cpp`, `.h`, both `Content/Blueprints/Immersive/*.uasset`,
   `awsTutorial.uproject`, `Config/DefaultEngine.ini`.
3. Report the file count and size to you.

If any of that fails, stop — nothing else runs.

The C++ masters also stay in the WSL repo at `plans/MacOS_UE_Fix/immersive/src/`, with the as-built notes in
`plans/MacOS_UE_Fix/immersive/IMMERSIVE-MODE-AS-BUILT.md`, so the zip is the second copy, not the only one.

## Step 2 — Take the four files out (recorded, not destroyed)

Move — not delete — into a new snapshot `.backups\immersive-removed-<timestamp>\`, same shape as the other backups
(`files.tar` + `filelist.txt` + `manifest.md5`), then remove them from the tree, leaving `Content\Blueprints\Immersive\`
empty and deleted.

Result: a tree identical to the one that produced build 30.

**Gate 2:** `ls Source/awsTutorial` shows 17 files, no `Immersive*`; `Content/Blueprints/Immersive` gone; Build.cs and
both Config files untouched (md5 compared against the build-30-era copies in `.backups`).

## Step 3 — Rebuild the editor module

`%TEMP%\gfx_build_editor.bat` (~3 min). This proves the reverted tree compiles with nothing missing.
**Gate 3:** `BUILD_EXIT=0`.

## Step 4 — Cook, then package Development, then Shipping

New script `%TEMP%\rv32_package_win.bat`, a copy of the build-30 script with new paths — **build 32 = build 30 with
Immersive Mode removed** (31 is the immersive build; the number is not reused):

* `rv32_package_win.bat cook` → judged by the cook's own `Success - 0 error(s)` line, not the exit code (the editor can
  crash while unloading plugin DLLs after a good cook). **Est. 10-20 min.**
* `rv32_package_win.bat dev` → `Packaged\32-dev`. **Est. 5 min.**
* `rv32_package_win.bat ship` → `Packaged\32-shipping`. **Est. 10-15 min.**

`Packaged\30-dev` and `Packaged\30-shipping` are left exactly as they are, as the proven fallback.

**Gate 4 — verify the binaries, not the intention:**

| Check | Expected |
| --- | --- |
| `ImmersiveView` in `32-dev\...\awsTutorial.exe` | **0 hits** |
| `VideoPlayerVolume` / `SC_Video` in the same exe | present (build-30 features intact) |
| `AudioOutputSelector` strings | present |
| `/Game/Blueprints/Immersive` in the Shipping exe | **0 hits** (Shipping strips log strings, so asset-path `TEXT()` literals are what gets checked) |
| `Packaged\32-shipping\...\awsTutorial-Win64-Shipping.exe` | exists, sane size (~156 MB, as build 30) |

## Step 5 — Smoke test 32-dev on CHIMERA before you touch it

Copy `32-dev` to `C:\Users\Dalton\Downloads\awsTutorial-32-dev` on CHIMERA (1.7 TB free), then run the probe:

1. Launch on the FirstPerson map — **no** `LogImmersiveView` lines anywhere in the log.
2. `-VideoVolumeSelfTest=settings` (the dev-only switch already in `VideoPlayerVolumeSubsystem`) — the Video row in the
   audio settings still registers and responds.
3. Screenshot of the video player, sent to you.

**Note on the firewall:** a new folder means Windows will prompt on first launch, and **you** click Allow — I will not
touch that prompt or any firewall rule. If you would rather avoid the prompt, say so and I will drop the new exe into
the already-allowed `awsTutorial-30-dev` folder instead, at the cost of the folder name no longer matching the build.

## Step 6 — Hand over

* `Packaged\32-dev` and `Packaged\32-shipping` on this machine, `awsTutorial-32-dev` on CHIMERA.
* The zip path, size and verification result.
* Nothing committed, nothing pushed — same standing rule as all week.
* Mac: untouched, already at build 30. If you want a fresh Mac pair from the same state, that is a separate run
  (~40 min) and I will ask first.

---

## Rollback

| If | Then |
| --- | --- |
| The reverted tree fails to build | restore `.backups/pre-immersive-mode-20260919T170948/files.tar` over the project (278 files) and rebuild |
| Build 32 misbehaves in any way | ship `Packaged\30-dev` / `30-shipping`, which are untouched and already operator-verified |
| Immersive Mode is wanted back | unzip the archive, or copy the two sources from `plans/MacOS_UE_Fix/immersive/src/` and the two materials from the removal snapshot; `apply_immersive_src.py` puts them back in one command |

## Timing

Roughly **50-75 minutes**, nearly all unattended: zip 15-25, editor build 3, cook 10-20, dev 5, ship 10-15, deploy and
smoke test 10. The zip runs first and alone; nothing is deleted until it is verified.

---

## Two things I need from you

**Rebuild, or reuse build 30?** Steps 3-4 rebuild the reverted tree from scratch, which proves the tree is clean and
gives a dev/shipping pair from identical sources — my recommendation, and the reason for the extra ~30 minutes. The
alternative is zero-risk and immediate: `Packaged\30-dev` and `Packaged\30-shipping` already exist, were built at
13:21 and 13:51 today from exactly this source state, and I have confirmed the 30-dev exe contains **no** immersive
code. If you only need the working builds in hand, I can revert the tree and hand you those instead.

**What were the serious issues?** I would rather fix the right thing when we come back to this. From my side the
cinema picture and the 360 view both rendered correctly in the last run, so whatever you saw is something I have not
seen — the picture being too small or too close, the auto-enter being unwanted, the movement lock, the button, or
something in the room behaving differently from the test seat. Whatever it is, tell me and I will write it into the
immersive notes before we shelve it.
