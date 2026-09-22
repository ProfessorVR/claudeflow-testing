# Packaging awsTutorial — step by step, for someone who has never used Unreal Engine

This page is for the person who has to produce a new build of the game after something in the project changed
(a video, a room, a menu, a blueprint, anything) — or just a fresh build — without knowing how Unreal works. You
will run one file per computer and read one word at the end: **OK** or **FAILED**. If you see FAILED, you stop
and send one file to the engineer; nothing you do here can damage the project.

There are three situations. Find yours:

| You changed something… | You need a… | Do |
| --- | --- | --- |
| in the Unreal editor **on the Windows PC** (or nothing changed, you just need a fresh build) | Windows build | Part A |
| in the Unreal editor **on the Windows PC** | Mac build | Part A (optional) then Part B |
| in the Unreal editor **on a Mac** (the Air or the lab MacBook Pro) | Mac build | Part C |

Words used below: the **project folder** is the folder that contains the file `awsTutorial.uproject` (on the
Windows PC: `C:\Users\Dalton\Documents\Unreal_Projects\awsTutorial_VoiceRPCNew_ARBv3`; on the Air:
`/Volumes/UnrealEngine/Unreal_Projects/awsTutorial`; on the lab MacBook Pro: `Unreal_Projects/awsTutorial` in the
home folder). The **package folder** is the folder named `ue541-team-package` (on the lab drive `KingLab`, and a
copy in `Downloads` on each Mac); the files you run live in it. A **build** is the finished game: on Windows a
folder with `awsTutorial.exe`, on Mac an app with the Unreal icon. Always make the **Shipping** build the one you hand
out; the Development build is the same game with extra diagnostics for the engineer.

Before you start, on any computer: close the Unreal editor and the game if they are open, plug the laptop in, and
keep the lid open. Every step keeps the machine awake by itself, but a laptop on battery stops when it locks.

---

## Part A — Windows build (on the Windows PC)

1. Open the package folder (`KingLab\ue541-team-package`, or wherever the engineer put it) and inside it the folder
   `windows`. Copy the file **`package-windows.bat`** into the **project folder** (next to `awsTutorial.uproject`).
   You only have to do this once; the copy can stay there.
2. Double-click `package-windows.bat` in the project folder. A black window opens. If Windows asks whether to allow
   the program, choose Yes. The first lines tell you where the builds will go:
   ```
   === Output:  C:\...\awsTutorial_VoiceRPCNew_ARBv3\Packaged\2026-09-22-dev\Windows  and  ...\2026-09-22-shipping\Windows
   === [1/3] Cooking content ...
   ```
3. Wait. It says `[1/3] Cooking`, then `[2/3] Building + staging Development`, then `[3/3] ... Shipping`. Each part
   takes 10–20 minutes and the window prints nothing while a part runs — that is normal, it is not stuck. Total
   30–60 minutes. Do not close the window.
4. Read the last lines:
   - `PACKAGE OK` and two lines starting `Development:` and `Shipping:` → done. Press any key to close the window.
   - `PACKAGE FAILED: …` followed by `Log: C:\Users\...\package_win_2026-09-22_…log` → stop. Send that log file and a
     photo of the window to the engineer. Nothing was broken.
5. Check the build (2 minutes): open the `Shipping` folder printed on the `Shipping:` line, double-click
   `awsTutorial.exe`, log in, walk into the level, quit from the menu. If it does that, the build is good.
6. To hand it out: right-click the `Windows` folder inside `Packaged\<date>-shipping`, choose *Send to → Compressed
   (zipped) folder*. Students unzip it and run `awsTutorial.exe`.

If you also need a Mac build, go to Part B now.

---

## Part B — Mac build after a change made on the Windows PC

The Mac cannot read the Windows project directly; it needs a zip made by a specific file (the Unreal editor's own
"Zip Up Project" leaves out a folder the Mac needs, so never use that).

**B1. Make the zip (on the Windows PC, 5–15 minutes)**

1. From the package folder's `windows` folder, copy **`make-project-zip.bat`** into the **project folder** (next to
   `awsTutorial.uproject`). Once is enough.
2. Double-click it. The black window checks that this is the right project (`live markers 2 (want 2), fork markers 0
   (want 0)`), then says `=== Zipping (5-6 GB, typically 5-15 minutes; the window stays open)...`. Wait.
3. Read the end:
   - `ZIP OK` with a `file:` line → the zip is in the folder **above** the project folder (`Unreal_Projects`), named
     `awsTutorial-src-<today's date>.zip`, and a tiny file with the same name ending in `.md5` sits next to it.
   - `ZIP FAILED: …` → stop, photo of the window to the engineer.
4. Copy **both** files (the `.zip` and the `.md5`) to the lab drive's package folder (`KingLab\ue541-team-package`),
   replacing any older `awsTutorial-src-….zip` there (move the old one into the `old-zips` folder, or delete it: the
   Mac step refuses to guess when two zips are present). The copy takes a few minutes; do not unplug the drive early
   (right-click the drive → Eject when Windows says it is done).

**B2. Build on the Mac (on the Air or the lab MacBook Pro, 15–35 minutes)**

1. Plug the lab drive into the Mac. Open **Terminal** (press ⌘-Space, type `Terminal`, press Return). A white window
   with a blinking cursor appears; everything below is typed into it, one line at a time, pressing Return after each.
2. Type this line (it copies the new zip from the drive into the Mac's own package folder; adjust the date to the zip
   you made):
   ```
   cp /Volumes/KingLab/ue541-team-package/awsTutorial-src-2026-09-22.zip* ~/Downloads/ue541-team-package/
   ```
   It prints nothing when it works. If it says `No such file or directory`, the drive is not mounted or the date is
   wrong — look in Finder under `KingLab › ue541-team-package` for the exact name.
3. Type:
   ```
   bash ~/Downloads/ue541-team-package/mac-rebuild-from-zip.sh ~/Downloads/ue541-team-package/awsTutorial-src-2026-09-22.zip
   ```
   (again with the real date). It prints what it is doing, in three numbered parts:
   ```
   ==> Checking the zip's checksum (a minute)…
   ==> 1/3 Unpacking the project and preparing it for the Mac (5–10 min the first time; …)
   ==> 2/3 Making the streamed videos play on Mac (…)
   ==> 3/3 Packaging Development + Shipping (15–30 min; …)
   ```
   Long silences inside a part are normal. Do not close the window; do not put the Mac to sleep.
4. Read the end (the whole run took 16 minutes on the lab MacBook Pro when this page was tested):
   - `PASS — both apps were built` with a `Development:` and a `Shipping:` path → done.
   - `FAIL: …` with a `Send this file to the engineer:` line → stop and send that file (and a screenshot). The
     previous build is untouched.
5. Check the build: see "How to check a Mac build" below.
6. Housekeeping, optional: the previous copy of the project was moved to a folder named
   `awsTutorial_superseded_<date-time>` next to the project. It can be large (67 GB on the lab MacBook Pro: it
   includes the old build files). Once the new build is known good, that folder can go in the Trash.

---

## Part C — Mac build after a change made on this Mac

If the change was made in the Unreal editor on the Air or the lab MacBook Pro, the project on that Mac is already
current — no zip needed. Save in the editor, quit the editor, then in Terminal (⌘-Space, `Terminal`, Return):

```
bash ~/Downloads/ue541-team-package/mac-rebuild-from-zip.sh --package-only
```

It runs parts 2/3 and 3/3 only (the video fix, then packaging) and ends with `PASS` or `FAIL` exactly as in Part B.
If the change must also reach the Windows PC, tell the engineer; the Windows side is not covered here.

---

## How to check a Mac build (5 minutes)

1. In Finder, open the folder printed on the `Shipping:` line (on the lab MacBook Pro:
   `Unreal_Projects › awsTutorial › Packaged › Mac-Shipping`). Double-click `awsTutorial-Mac-Shipping`.
2. The first time an app runs on a Mac, macOS may say it cannot check it. Right-click the app → *Open* → *Open*.
   If macOS asks about the microphone, click *Allow*.
3. The game starts in a window under the menu bar. Log in, enter the level, open the options menu once, quit from
   the menu. If all of that happened, the build is good.
4. To give the app to another Mac: copy the `.app` (it is 3–4 GB); on the other Mac the same right-click → *Open*
   dance is needed once, or in Terminal: `xattr -dr com.apple.quarantine ` followed by the dragged-in app.

## What can go wrong, and what to do

| The window says | It means | Do |
| --- | --- | --- |
| `ZIP FAILED: this file must sit in the project folder` | the .bat was run from the wrong place | copy it next to `awsTutorial.uproject` and double-click it there |
| `live markers 0` / `this looks like the OBSOLETE FORK` | wrong project folder | ask the engineer which folder is the live project |
| `PACKAGE FAILED: engine not found at D:\UE_5.4.1` | the engine drive is missing | check that drive D: is present in *This PC* |
| `FAIL: the zip is damaged or incomplete` | the copy was interrupted | copy the `.zip` and `.md5` again |
| `FAIL: no built engine found` | this Mac was never set up | the engineer's runbook `Building-awsTutorial-on-a-Mac.md` §1 must be done once on this Mac |
| `More than one .zip beside this script` | an old zip is still in the package folder | move the old one to `old-zips` |
| `ENGINE_PATCH_MISSING` | the engine on this Mac lost a required fix | stop; engineer |
| `FAIL: the game is running on this Mac` | the game is open | quit it and run the command again |
| anything else with `FAIL` or `FAILED` | | send the named log file and a screenshot |

Everything a run does is written to a folder named `awsTutorial-rebuild-<date-time>` in the Mac's home folder
(Windows: the `.log` file named in the window). Those files are what the engineer needs; nothing else.

## Where the technical details are

`README.txt` (what each file does), `Building-awsTutorial-on-a-Mac.md` (setting up a Mac from scratch, and what the
engineer checks in the logs), `SOP-UE5.4.1-Mac-Build-and-Migration.md` (why every step exists). This page is
deliberately the short version.
