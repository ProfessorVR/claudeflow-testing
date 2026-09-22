# =============================================================================
#  set_electra_override.py
#  Sets  Player Overrides -> Mac -> ElectraPlayer  on every StreamMediaSource in
#  the project. This makes macOS play the DASH (.mpd) streams via ElectraPlayer
#  instead of AvfMedia (which cannot decode DASH -> the -12847 blank-video bug).
#
#  TWO WAYS TO RUN
#  ---------------
#  A) HEADLESS (preferred — no .uproject edit, scriptable). Use the wrapper:
#         ./apply-electra-override-mac.sh            # dry run, changes nothing
#         ./apply-electra-override-mac.sh apply      # applies, then VERIFIES
#     It invokes this file as a -run=pythonscript commandlet with
#     -EnablePlugins=PythonScriptPlugin, so awsTutorial.uproject is NOT modified
#     (PythonScriptPlugin is EnabledByDefault:false and is not in the project).
#
#  B) IN-EDITOR:  Tools -> Execute Python Script...  -> pick this file
#     (or Output Log -> input dropdown "Python" ->
#         exec(open("/Users/<you>/Downloads/ue541-team-package/set_electra_override.py").read()) )
#
#  ⚠️ 2026-08-25 FIX — WHY THIS SCRIPT ONCE DID NOTHING AND SAID IT SUCCEEDED
#  -------------------------------------------------------------------------
#  Run as a commandlet, the Asset Registry starts EMPTY. ar.get_assets() returned
#  0 assets, the loop body never executed, and the run finished in 0.06 s logging
#  "Python script executed successfully" — a completely silent no-op.
#  It only worked in-editor because the editor has already scanned /Game.
#  FIX: scan_paths_synchronous() below, before querying. Verified: 0 assets
#  before the scan, 443 after.
#
#  ⚠️ ALSO: in commandlet mode, unreal.log() (Display) is SWALLOWED — only
#  Errors and Warnings survive. So the summary is emitted as a WARNING and is
#  also written to RESULT_JSON for machine reading. Don't judge a run by silence.
#
#  ⚠️ NEVER TRUST THIS SCRIPT'S OWN REPORT. Confirm on disk with:
#         python3 verify_media_overrides.py <Project>/Content/Media/StreamMediaSources
#  which parses the raw .uasset bytes and needs no Unreal. A string grep CANNOT
#  verify this: PlatformPlayerNames is `transient` and hand-serialized as a raw
#  TMap<FGuid,FGuid>, so neither that name nor "ElectraPlayer" appears in an
#  uncooked asset whether or not the override is set.
# =============================================================================
import json

import unreal

DRY_RUN     = True                 # <-- set False (or use the wrapper) to apply + save
PLATFORM    = "Mac"
PLAYER      = "ElectraPlayer"
SEARCH_PATH = "/Game"              # whole project (class filter keeps it to StreamMediaSource)
RESULT_JSON = "/tmp/electra_result.json"

ar = unreal.AssetRegistryHelpers.get_asset_registry()

flt = unreal.ARFilter(
    class_paths=[unreal.TopLevelAssetPath("/Script/MediaAssets", "StreamMediaSource")],
    package_paths=[SEARCH_PATH],
    recursive_paths=True,
    recursive_classes=True,
)

# --- THE FIX: make sure the registry is actually populated (see header) -------
assets = ar.get_assets(flt)
if len(assets) == 0:
    unreal.log_warning("Asset Registry empty (commandlet mode) — scanning {} …".format(SEARCH_PATH))
    ar.scan_paths_synchronous([SEARCH_PATH], force_rescan=True)
    assets = ar.get_assets(flt)
# -----------------------------------------------------------------------------

unreal.log("=========================================================")
unreal.log("StreamMediaSource -> Mac=ElectraPlayer   DRY_RUN={}".format(DRY_RUN))
unreal.log("Found {} StreamMediaSource asset(s)".format(len(assets)))
unreal.log("=========================================================")

if len(assets) == 0:
    unreal.log_error("FOUND 0 ASSETS — refusing to report success. "
                     "Check the project path and that Content/Media exists.")

changed = already = errors = 0

for ad in assets:
    path = str(ad.package_name)
    try:
        obj = ad.get_asset()
        overrides = dict(obj.get_editor_property("platform_player_names"))
        current = overrides.get(PLATFORM)
        if current is not None and str(current) == PLAYER:
            unreal.log("  [already {}] {}".format(PLAYER, path))
            already += 1
            continue
        unreal.log("  [SET {}->{}]  {}   (was: {})".format(PLATFORM, PLAYER, path, current))
        changed += 1
        if not DRY_RUN:
            overrides[PLATFORM] = unreal.Name(PLAYER)
            obj.set_editor_property("platform_player_names", overrides)
            unreal.EditorAssetLibrary.save_loaded_asset(obj)
    except Exception as e:
        unreal.log_error("  [ERROR] {} : {}".format(path, e))
        errors += 1

summary = {
    "found": len(assets),
    "dry_run": DRY_RUN,
    "changed": changed,
    "already": already,
    "errors": errors,
}
try:
    with open(RESULT_JSON, "w") as f:
        json.dump(summary, f, indent=2)
except Exception as e:
    unreal.log_error("could not write {}: {}".format(RESULT_JSON, e))

verb = "would change" if DRY_RUN else "changed+saved"
unreal.log("=========================================================")
unreal.log("Done. {}={}  already-set={}  errors={}  (DRY_RUN={})".format(
    verb, changed, already, errors, DRY_RUN))
# Warning level survives the commandlet log filter — this is the line you look for.
unreal.log_warning("ELECTRA_RESULT {}".format(json.dumps(summary)))
if DRY_RUN:
    unreal.log(">>> Looks right? Run with 'apply' (or set DRY_RUN=False) to write.")
unreal.log(">>> THEN VERIFY ON DISK: python3 verify_media_overrides.py <Project>/Content/Media/StreamMediaSources")
unreal.log("=========================================================")
