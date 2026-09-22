# Local engine patches — UE 5.4.1 source build on the Mac (`/Volumes/UnrealEngine/UE_5_4_1`)

Kept here so that nothing about the Mac engine lives only in a working tree. Written 2026-09-20 (H1 of
`report/adversarial-review-mac-2026-09-20.md`).

| File | What |
| --- | --- |
| `MetalRHI-resolution-list.patch` | The one patch the game depends on: `FMetalDynamicRHI::RHIGetAvailableResolutions` reports display modes in pixels instead of dividing by the backing scale a second time. Without it the options menu's resolution list tops out at half the panel and the tuner cannot pick native. |
| `engine-all-local-modifications.patch` | `git diff` of every locally modified engine file as of 2026-09-20 22:54 (15 files: UBT/Apple toolchain edits, `WebBrowserSingleton.cpp`, `AudioCaptureInternal.h`, `Character.h`, `Apple_SDK.json`, …). These are **not** committed anywhere and were not reviewed tonight; they are here so a reset can be undone. |

## Where the fix lives now

* Engine repository: local branch **`local/mac-engine-fixes`**, one commit on top of the detached `5.4.1 release`
  (`16dc333db`), containing only `MetalRHI.cpp`. `git switch local/mac-engine-fixes` restores it after any checkout.
  The other 14 modified files are still uncommitted working-tree changes on that branch (same risk class — see the
  review's H1; committing them was outside tonight's order).
* Guard: `graphics-autotune/check_engine_patch.sh` (copy on the Mac in `~/gfx_autotune/`). `package_mac_gfx.sh` runs it
  first and refuses to package (`ENGINE_PATCH_MISSING` in `/tmp/gfx_package_mac.out`) when the marker comment is gone
  or the stock `/ Scale` divisions are back.
* Stock original beside the source: `MetalRHI.cpp.orig-preresfix`.

## Re-applying by hand

```
cd /Volumes/UnrealEngine/UE_5_4_1
git apply --check <this dir>/MetalRHI-resolution-list.patch && git apply <this dir>/MetalRHI-resolution-list.patch
bash ~/gfx_autotune/check_engine_patch.sh
```
Then rebuild: the next `package_mac_gfx.sh` run recompiles `MetalRHI.cpp` for both configurations (UBT tracks the
source timestamp; verified 2026-09-20 by the `.o` timestamps under `Intermediate/Build/Mac/arm64/awsTutorial/`).
