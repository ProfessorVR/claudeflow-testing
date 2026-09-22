# ⛔ SUPERSEDED — DO NOT BOOT FROM THIS FILE

**RESOLVED 2026-08-26.** Everything below describes work done inside an **OBSOLETE FORK** of the
project and is kept only as history. Do not follow it.

**Root cause of the whole "Paraguay videos are blank on macOS" investigation: the Mac — and the
Windows working directory — were running an obsolete fork.** The live project is
`Unreal_Projects/awsTutorial_VoiceRPCNew_ARBv3`; `UCI_Campus_Template_v1.0` is the fork.
A clean Shipping build from the live project plays every Paraguay and Vietnam video, procedures and
interviews, with sound. The fork has been deleted from the Mac (48 GB freed).

Every task described below — the station swaps, the Vietnam content entry, the "Paraguay interviews
stall when cooked" fault and its eleven dead hypotheses — was **measured correctly but against the
fork**, and is moot. ARBv3 already had the Vietnam work finished in September 2025.

- Full evidence: `SESSION-LOG-2026-08-24.md` **Parts G and H**.
- Current procedure: `team-package/README.txt` (7-step runbook) and
  `team-package/SOP-UE5.4.1-Mac-Build-and-Migration.md` (§8·0 lineage check, §8a·1, §8a·2, §11d).
- **Next active task:** `plans/MacOS_Voice_Echo/BOOT-PROMPT.md` — macOS voice-chat echo/feedback.

Before any asset work on this project, confirm lineage:
`BP_SC_CatPara` + `BP_WG_CatPara` present = live project. `BP_SC_T1`/`BP_WG_TEST` plus the
`CAT_PARA` family = the fork.

---

# BOOT PROMPT — awsTutorial video stations: finish the ship

Paste this whole file as the first message of a clean session.

---

You are finishing a repair of the surgical-video stations in the `awsTutorial` Unreal Engine 5.4.1
project. The hard diagnostic work is **done and verified**. What remains is content entry, a save-as,
and packaging on two platforms.

**Read these first, in this order:**
1. `plans/MacOS_UE_Fix/SESSION-LOG-2026-08-24.md` — Parts A–E. Records what was run and **seven
   retracted conclusions you must not re-derive.**
2. The work order (rev. 3): https://claude.ai/code/artifact/68994c10-4b85-421f-a006-4edc7a2d7965
3. The forensics report (rev. 5): https://claude.ai/code/artifact/5542fb4f-8efc-4ed9-9f66-ae7b09c576fd

---

## What was wrong, in one paragraph

Four video widgets exist across two architectural generations. The pre-ABR generation
(`BP_WG_CAT_PARA`, `BP_WG_CAT_VIET`) used a manual resolution picker; when adaptive-bitrate streaming
was added, the quality buttons were deleted but the graph nodes reading them were not, which orphaned
the entire playback path. The ABR generation (`BP_WG_TEST`, `BP_WG_CatViet_Test`) works. **Every real
fix turned out to be pointing an orbit trigger at the newer widget.** No Blueprint surgery was needed.
It was never a macOS bug — the Mac shipped `Hospital_Client`, which still wired the old stations, while
Windows shipped a `FirstPersonMap` that already used the rebuilds.

## DONE — verified at property level 2026-08-25, do not redo

Both stations swapped and **saved**. All 11 orbit triggers in `Hospital_Client` read clean from
`__ExternalActors__`. Read the *class*, not the object name:

```
Paraguay  ScreenActorRef -> class BP_SC_T1_C            WidgetClass -> BP_WG_TEST_C
Vietnam   ScreenActorRef -> class BP_SC_CatViet_Test_C  WidgetClass -> BP_WG_CatViet_Test_C
UCI-02 + 8 others untouched
```

⚠️ **The two screens were CONVERTED IN PLACE, not pasted.** Each kept its old object name
(`BP_SC_CAT_PARA_C_UAID_…`, `BP_SC_CAT_VIET_C_UAID_…`) and its old `ActorLabel` while its class changed.
A name-table scan therefore still shows the old names and *looks* like a half-finished swap. It is not —
do not "fix" it. ⇒ **Deleting the retired actors is MOOT; no duplicates exist.** Renaming the stale
labels is cosmetic only.

Also done: `BP_WG_CAT_PARA`'s null POV variables were repointed to `MP_POV_01_CAT_PARA` /
`MP_POV_02_CAT_PARA` and verified (zero `Accessed None`). That widget is retired, but keep the change.

Backup taken 2026-08-25: `UCI_Campus_Template_v1.0/.backups/20260825T112304/` — map + all 4,519
external actors + 5 Blueprints + 2 media sources. At the **project root**, NOT under `Content/`
(the editor would try to import it).

## REMAINING WORK

1. **Vietnam content entry** — smaller than it looks. The station is a **one-procedure,
   one-interview** station by design (`BP_SC_CatViet_Test` declares only `VS_360-01`, `VS_POV-DR-01`,
   `ITV-01`; the widget graph binds `OnClicked` on only `Button_VS_PRO-01` and `Button_VS_ITV-01`).
   Three strings and eighteen collapses:

   | asset | widget | currently | set to |
   |---|---|---|---|
   | `BP_WG_CatViet_Test` | `TextBlock_131` (in `Button_VS_PRO-01`) | `Procedure Title` | operator's call |
   | `BP_WG_CatViet_Test` | `TextBlock_19` (in `Button_VS_ITV-01`) | `Procedure Title` | `Cataract Animation: Laser vs Manual` |
   | `BP_SC_CatViet_Test` | `TextRender` (in-world sign) | `Procedure Title Here` | `Cataract Operation - Vietnam` |

   Collapse the **SizeBox wrappers**, not the Buttons — the SizeBox is what the ScrollBox lays out, so
   collapsing the Button alone leaves an empty row. Keep `SizeBox_291` (PRO-01) and `SizeBox_10`
   (ITV-01); collapse `SizeBox_462 _547 _4 _3 _2` (PRO-02..06) and
   `SizeBox_11 _12 SizeBox _5 _6 _1 _7 _8 _9 _14 _15 _16 _17` (ITV-02..14).
2. **Save**, then ask the assistant to byte-verify the trigger pairings again.
3. **Verify** — PIE `Hospital_Client`, walk Paraguay, Vietnam, and **UCI-02 as the control**.
4. **Ship Windows** — `File → Save Current Level As… → FirstPersonMap` (overwrite), then package
   (Shipping, to match the last build).
5. **Ship Mac** — carry the corrected `Hospital_Client.umap` + its `__ExternalActors__` folder + the
   widget assets across, then package **CLI only**. Mac maps are still 2026-07-24; engine volume is
   already mounted.

### The two data bugs are ORPHANS — hygiene, not blockers
Zero referencers across all 16,023 packages; the ABR rebuild reaches neither.
- `CAT_VIET_MISC` points at a **Paraguay** URL. **Nothing to repoint it to** — no Vietnam *Misc* DASH
  manifest was ever published (7 candidate CDN paths, all 403). The Laser-vs-Manual manifest that does
  exist is already wired via `CAT_UCI_02_ITV-LasVsManAnim1`.
- `CAT_VIET_360_4K_Low` is a `264_1080_6Mbps` encode under a 4K name. Real 4K Vietnam 360 exists only
  inside the adaptive manifest, which is what the station plays.

## HARD CONSTRAINTS

- **HIDE surplus buttons, never DELETE them.** Set Visibility to Collapsed. Deleting widget objects
  that graph nodes still reference is exactly how `BP_WG_CAT_PARA` was destroyed — 19 nodes kept
  reading a `Button_4K` that no longer existed and the playback path died silently behind it.
  `BP_WG_CatViet_Test` came from the same template.
- **`ScreenActorRef` is an ACTOR pointer and cannot cross maps.** If a swapped station stops opening
  its menu on overlap, this is why. Set it after pasting, against the instance in the current map.
  `BP_OrbitTrigger` has no tag property — only `ScreenActor`, `ScreenActorRef`, `WidgetClass`,
  `bAutoShowWidget`.
- **Package the Mac from the CLI. Never the editor's Package Project button** — it deadlocks
  (`-EditorIOPort` cook hangs in `-[NSApplication _shouldTerminate]`, unrecoverable from the GUI).
  SOP §11h, or `~/Downloads/ue541-team-package/package-awsTutorial-mac.sh`. Windows' Package button
  is fine; the deadlock is macOS-only.
- **Map selection belongs to the operator.** Never touch `GameDefaultMap` / `ServerDefaultMap` or any
  map INI key. Shipping level is chosen by saving `Hospital_Client` as `FirstPersonMap`.
- **Keep `Hospital_Client` current.** A stale `Hospital_Client` is the whole reason this bug reached
  macOS — the ship workflow saves it over `FirstPersonMap`, so staleness silently undoes fixes.
- **Back up before changing assets** — timestamped `.backups/`.
- **Verification-gated:** show evidence and wait for sign-off before committing.
- Do not modify `awsTutorial.uproject` (e.g. to enable `PythonScriptPlugin`) without asking.

## ENVIRONMENT

| | |
|---|---|
| PC project | `/mnt/c/Users/Dalton/Documents/Unreal_Projects/UCI_Campus_Template_v1.0` |
| PC engine | `D:\UE_5.4.1` — the registered engine (GUID `{E88B43D6-…}`); `PythonScriptPlugin` is compiled but not enabled |
| Windows launcher | `cmd.exe` works from WSL; run from a `/mnt/c` cwd or you get UNC warnings |
| Mac | `ssh -o BatchMode=yes daltonsalvo@192.168.50.10 'bash -lc "…"'` — login shell **required** |
| Mac project | `/Volumes/UnrealEngine/Unreal_Projects/awsTutorial` |
| Mac engine | `/Volumes/UnrealEngine/UE_5_4_1` — APFS sparsebundle; check `ls /Volumes` before `hdiutil attach` |
| Windows build | `…/Packaged/20 - God please be the last/Windows` (Shipping, Sep 2025) |

Gotchas: `timeout` does not exist on macOS (`gtimeout`); macOS uses `md5 -r` not `md5sum`; heredocs are
blocked by a hook in this repo — write scripts with the Write tool then run them; disk is tight
(C: ~92 GB, D: ~67 GB free, both 98–99% full) and a cook plus staging wants 15–20 GB.

## HOW TO VERIFY ANYTHING

Run the game on a specific map without cooking:
```
"D:\UE_5.4.1\Engine\Binaries\Win64\UnrealEditor.exe" ^
  "C:\Users\Dalton\Documents\Unreal_Projects\UCI_Campus_Template_v1.0\awsTutorial.uproject" ^
  Hospital_Client -game -log ^
  -LogCmds="LogMediaAssets Verbose, LogElectraPlayer Verbose, LogWmfMedia Verbose, LogMedia Verbose"
```
Log lands at `Saved/Logs/awsTutorial.log`. Confirm the right station with `Returning: BP_SC_T1` and
`Current Widget = BP_WG_TEST_C_0`. Success signals: zero `Accessed None`, an `OpenSource` per player,
`Playback started at play position`.

**Include `LogWmfMedia`.** Windows mp4s go through WmfMedia, not Electra — grepping only
`IMediaPlayer::Open` (an Electra-only line) produced a false "zero opens" conclusion once already.

## METHOD NOTES WORTH KEEPING

- **Which widget is live is a property of the MAP**, not of `BP_FirstPersonCharacter` (which
  hard-references `BP_WG_CAT_PARAOG`, not the live widget). The screen↔widget pairing lives on the
  `BP_OrbitTrigger` actor instance. Read it from the external-actor packages, not from any Blueprint.
- Tools in `plans/MacOS_UE_Fix/tools/`: `uasset2.py` (UE5 table parser, strides derived empirically),
  `blob.py` (export blob extractor), `census.py` (media override census), `urls.py` (StreamUrl census).
  `nodedata.py` has false positives — relative comparison only. `props.py` (UE 5.4 tagged-property
  decoder — the tag layout changed in 5.4, see `reference-ue54-tagged-property-layout` memory),
  `triggers.py` (orbit-trigger census), `widgettree.py` (UMG tree; index-keyed, never name-keyed —
  a WidgetBlueprint holds two widget trees whose exports share names).
- Media player **overrides are invisible to string greps** — `PlatformPlayerNames` is `transient` and
  stored as raw `TMap<FGuid,FGuid>`. See `reference-ue-media-player-override-serialization` memory.
- **A control that does not exercise the subject is not a control.** The "byte-identical widget plays
  on Windows" comparison drove three wrong revisions because that build never loaded the widget.
