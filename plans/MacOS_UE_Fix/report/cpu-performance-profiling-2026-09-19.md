# Why CHIMERA (RTX 5070) only reaches ~47 fps: profiling results and fix plan (2026-09-19)

Analysis only. Nothing in the project was changed.

**Setup:**
- Machine: CHIMERA, Ryzen 9 7940HS + RTX 5070 Laptop, 2560x1600, on AC, unlocked, game in the foreground (checked every 2 s).
- Build: `25-dev`, standalone `FirstPersonMap`, standing at the spawn point.
- Settings: the tuner's High save, with Max FPS Unlimited and V-Sync off (2-byte patch, `perf/patch_options_sav.py`).
- Capture: 4,000-frame Unreal CSV profiles (`-csvCaptureFrames -csvGpuStats -csvStatCounts`), analysed over ~35–64 s of steady state (`perf/csv_summary.py`). CSVs are in `/tmp/gfx_perf/`.

## Result: the level's lights cost ~60 % of every frame

| Run | Frame | fps | Game | Render thread | RHI thread | GPU | Draw calls |
|---|---|---|---|---|---|---|---|
| Today (Shadows Low) | 20.5 ms | 49 | 3.0 | 14.4 | 9.3 | 7.6 | 2,593 |
| Scene captures off (`set SceneCaptureComponent2D bCaptureEveryFrame 0`) | 20.4 ms | 49 | 3.0 | 14.3 | 9.5 | 7.6 | 2,594 |
| Clustered deferred shading on | 18.0 ms | 56 | 3.1 | 13.8 | 8.9 | 8.0 | 2,354 |
| Shadows Off | 13.2 ms | 76 | 2.8 | 7.0 | 5.9 | 5.0 | 1,630 |
| **Shadows Off + clustered deferred** | **8.0 ms** | **125** | 2.8 | 5.1 | 5.0 | 5.6 | 1,258 |

What the numbers show:
- **CPU-bound.** The render thread is the critical path (`RenderThreadTime_CriticalPath` equals the frame time), and the GPU is idle more than half the time.
- **372 lights are processed every frame** (`LightCount/All`); 131 of them are "unbatched", which means shadow-casting.
- **Lighting drives the render thread:** `RenderLighting` is 5.0 ms, and lights account for 900 draw calls per frame. Dynamic shadow setup (`ShadowInitDynamic`) runs on every worker thread.
- **Graphics quality barely matters:** High, Medium and Low all measured ~21 ms.

## Root cause: "Static" lights that were never baked

A census of all 729 light-bearing actor packages in `FirstPersonMap` (`perf/light_census.py`) found 830 light components:

| Mobility | Cast shadows | No shadows | Notes |
|---|---|---|---|
| **Static** | **481** | 96 | Meant to be baked into lightmaps (free at runtime) |
| Stationary | 175 | 51 | |
| Stationary (hidden) | 27 | — | |

Other properties:
- **Max Draw Distance:** unlimited on **every** light.
- **Attenuation radius:** median 383 units.
- **BP_CeilingLight_01:** 83 fixtures.

The map's lighting was never baked for its current state:
- It is a World Partition map. `bForceNoPrecomputedLighting = False`, so baking is allowed.
- `FirstPersonMap_BuiltData.uasset` is from **2024-05-23** and only 458 KB, while the map was last changed in September 2025.
- Without valid baked lighting, UE renders every Static light as a live dynamic light, with dynamic shadows.

That produces hundreds of per-frame lights and roughly 130 shadow-casting lights in view, each costing render-thread time, RHI draw submissions and (for point lights) up to six shadow cube faces.

**Ruled out:**
- **The 11 scene captures** (BP_SC_* 360 screens, BP_2D_* screens) were a suspect: they tick every frame and their templates capture every frame. Disabling them at runtime changed nothing.
- **Graphics settings, the game thread (3 ms) and the GPU (7.6 ms)** are not the limit on CHIMERA.

## Fix plan, by payoff (each needs the operator's go-ahead)

1. **Stop the un-baked Static lights casting dynamic shadows** (content change).
   - Set `CastShadows = false` on the 481 Static shadow-casting lights. They were designed for baked shadows, so their live shadows were never intended.
   - Optionally trim the 175 Stationary shadow casters to the few that visibly matter.
   - **Upper bound, measured:** 20.5 → 13.2 ms (Shadows Off).
   - Done by editor Python over the World Partition actor packages, after backing up `Content/__ExternalActors__/FirstPerson/Maps/FirstPersonMap`.
   - The level's look changes (fewer dynamic shadows), so it needs a visual review.
2. **Turn on clustered deferred shading:** one line in `DefaultEngine.ini`, `r.UseClusteredDeferredShading=1`.
   - Renders all unshadowed lights in one pass instead of one draw per light.
   - **Measured:** 20.5 → 18.0 ms on today's content, and 13.2 → 8.0 ms combined with fix 1.
   - It is a config change, so it is easy to revert.
3. **Give every local light a Max Draw Distance plus a fade range** (for example 2,500–4,000 units, depending on room size).
   - Today every light renders from anywhere in the level.
   - This cuts the 372 lights per frame to the rooms nearby.
   - It also makes `r.LightMaxDrawDistanceScale` work, which the auto-tuner could then use as a low-end lever.
4. **Alternative to 1:** bake the lighting (Lightmass), so the Static lights cost nothing and keep their shadows.
   - World Partition baked-lighting support in UE 5.4 is limited, builds are long, and it interacts with the project's Lumen settings.
   - It needs a trial in the editor before committing to it.
5. **Later, smaller wins once lighting is fixed:**
   - **Base pass:** 743 draw calls; ~1 M triangles per frame.
   - **Occlusion queries:** 441 per frame (merged or instanced meshes, World Partition HLODs, cull distances).
   - **Game-thread UI:** 1.25 ms (UMG widgets ticking).
   - **Scene captures:** switch them to capture on demand instead of every frame. They don't cost frame time in this scene, but they will once they have render targets.

**Expected effect:**
- **CHIMERA:** comfortably above 60 fps. The measured best case is 8 ms / 125 fps. The tuner would then pick 60 fps with High settings.
- **MacBook Air M4 (GPU-bound):** the same changes remove most of the shadow-depth and per-light GPU work (on the RTX, lights + shadow depths + projection ≈ 3.8 ms of GPU). So the Mac should also need less resolution reduction.
- **Integrated-graphics laptops:** benefit on both CPU and GPU.

## Applied to the Windows project (2026-09-19, operator-approved: fixes 1, 2 and 3)

**Backup:** `.backups/level-lights-20260919T073324/` (manifest-verified):
- `files.tar`: 4,541 files. This covers every FirstPersonMap external actor and external object package, the map, its BuiltData, and DefaultEngine.ini.
- `blueprint/files.tar`: BP_CeilingLight_01.uasset, md5 a7a30829….

**Changes** (headless editor Python; the StarterContent re-import was suppressed):
- **Fix 1:** `CastShadows = false` on all 647 Static local lights that cast shadows.
  - 564 of them are placed lights, saved in 729 external actor packages.
  - The 83 BP_CeilingLight_01 spotlights got the change on the **Blueprint template**, because instance edits are regenerated on load. The Blueprint lives in the UniversityClassroom pack, so the change also applies wherever else it is used.
- **Fix 3:** every rendered local light got `MaxDrawDistance = max(3000, 4 × AttenuationRadius)` and `MaxDistanceFadeRange = 1000`. Only 18 hidden, zero-intensity spotlights inside the BP_SC_* screens were left without one (not rendered).
- **Fix 2:** `r.UseClusteredDeferredShading=1` in `[/Script/Engine.RendererSettings]` (DefaultEngine.ini, +3 lines).
- **Verification:** a read-only reload in the editor reports 0 Static lights casting shadows and 18 lights without a draw distance (the hidden screen spotlights).

**Build 26** (`Packaged/26-dev`), CHIMERA, same uncapped-High profile as the 20.5 ms baseline:

| | Before (25) | After (26) |
|---|---|---|
| Frame time | 20.5 ms (49 fps) | **6.3 ms (~158 fps)** |
| Game / Render / RHI / GPU | 3.0 / 14.4 / 9.3 / 7.6 | 2.9 / 6.2 / 3.6 / 5.5 |
| Draw calls | 2,593 | 772 |
| Lights per frame / shadow-casting | 372 / 131 | 26 / 2 |
| RDG passes | 1,480 | 183 |

**Auto-tuner on build 26** (first launch, foreground, AC):

| GPU | Build 25 result | Build 26 result |
|---|---|---|
| RTX 5070 | High, 30 fps, 100 % (~47 fps CPU-bound) | **High, 60 fps, 100 %** (p95 7.2 ms) |
| Radeon 780M | Low, 30 fps, 70 % | **High, 30 fps, 100 %** |

The 780M's steps under build 26 were High 23.5, Medium 22.4 and Low 16.9 ms p95 (Low median 15.6 ms ≈ 64 fps).

**Rollback:**
```
cd <project> && tar -xf .backups/level-lights-20260919T073324/files.tar && tar -xf .backups/level-lights-20260919T073324/blueprint/files.tar
```
Then check the files against `manifest.md5` and `blueprint/manifest.md5`.

**Mac:** applied 2026-09-19 ~08:10, after the operator's visual review of build 26 ("everything looks good enough… well worth any minor loss").
- **Backup:** `/Volumes/UnrealEngine/Unreal_Projects/awsTutorial/.backups/level-lights-20260919T080712/` (4,541 files; manifest built with `md5 -q`; tar list verified). It holds `blueprint/` (BP_CeilingLight_01) and `apps/`, the previous Mac Development and Shipping apps, which still run.
- **Why a copy is exact:** the Mac's 4,525 actor packages and BP_CeilingLight_01 were byte-identical to the Windows pre-change originals. The 730 changed Windows files (729 light packages + the Blueprint) were copied, and all 730 md5s match Windows. `apply_clustered.sh` added the 3 lines to the Mac DefaultEngine.ini.
- **Builds:** `package_mac_gfx.sh` produced `Packaged/Mac/awsTutorial.app` and `Packaged/Mac-Shipping/awsTutorial-Mac-Shipping.app`. Both contain the tuner, `NSHighResolutionCapable` true, and both `r.UseClusteredDeferredShading=1` and `bAllowHighDPIInGameMode=True` inside the pak.
- **Tuner on the MacBook Air M4** (Retina 2880x1836, AC, foreground):

| Rung (p95) | Before | After |
|---|---|---|
| High | 65.9 ms | 32.7 ms |
| Medium | 64.0 ms | 30.8 ms |
| Low | 58.6 ms | 24.2 ms |
| Result | Low, 30 fps, 50 % resolution | **Low, 30 fps, 100 % (full Retina)** |

- **Operator's earlier Mac settings:** the tuned-for-old-lighting save is at `~/gfx_autotune/pre_lighting_tuned_20260919T081523/`; the July originals are at `~/gfx_autotune/user_saved_backup_20260919T062204/`.

## Side note

Drive D: (engine install) is at 100 %. A background Unreal Insights build for this analysis failed with "No space left on device". Its partial output was deleted, giving back ~2.5 GB. Insights was not needed.
