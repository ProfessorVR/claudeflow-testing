# Video player volume (2026-09-19, operator-approved option B): creates SC_Video (a sound class under SC_Master, with
# SC_Master's settings, so videos sound exactly as before) and SM_Video (a copy of the sibling mix SM_Voice, adjusting
# SC_Video). Saves SC_Video, SM_Video and SC_Master (its child list gains SC_Video). Idempotent: stops if SC_Video exists.
import unreal

DIR = "/Game/AntizeMenuSystem/Sounds/ClassesAndMixes"

def log(msg):
    unreal.log("VIDVOL " + msg)

def run():
    eal = unreal.EditorAssetLibrary
    if eal.does_asset_exist(DIR + "/SC_Video") or eal.does_asset_exist(DIR + "/SM_Video"):
        log("SC_Video or SM_Video already exists; nothing done")
        return
    master = unreal.load_asset(DIR + "/SC_Master")
    log("SC_Master properties before: %s" % master.get_editor_property("properties"))
    log("SC_Master passive mixes: %s" % master.get_editor_property("passive_sound_mix_modifiers"))
    log("SC_Master children before: %s" % [c.get_name() for c in master.get_editor_property("child_classes")])

    at = unreal.AssetToolsHelpers.get_asset_tools()
    sc = at.create_asset("SC_Video", DIR, unreal.SoundClass, unreal.SoundClassFactory())
    sc.set_editor_property("properties", master.get_editor_property("properties"))
    children = list(master.get_editor_property("child_classes"))
    children.append(sc)
    master.set_editor_property("child_classes", children)   # the editor's change handler also sets SC_Video's parent

    sm = eal.duplicate_asset(DIR + "/SM_Voice", DIR + "/SM_Video")
    adjusters = list(sm.get_editor_property("sound_class_effects"))
    if len(adjusters) != 1:
        log("unexpected SM_Voice adjuster count %d; stopping before save" % len(adjusters))
        return
    adj = adjusters[0]
    adj.set_editor_property("sound_class_object", sc)
    adj.set_editor_property("volume_adjuster", 1.0)
    adj.set_editor_property("apply_to_children", False)
    sm.set_editor_property("sound_class_effects", [adj])

    for asset in (sc, sm, master):
        ok = eal.save_loaded_asset(asset, False)
        log("saved %s: %s" % (asset.get_path_name(), ok))

    log("SC_Master children after: %s" % [c.get_name() for c in master.get_editor_property("child_classes")])
    log("SC_Video parent: %s" % sc.get_editor_property("parent_class"))
    log("SC_Video properties: %s" % sc.get_editor_property("properties"))
    for a in sm.get_editor_property("sound_class_effects"):
        log("SM_Video adjuster: class=%s volume=%s children=%s" % (a.get_editor_property("sound_class_object").get_name(),
            a.get_editor_property("volume_adjuster"), a.get_editor_property("apply_to_children")))
    voice = unreal.load_asset(DIR + "/SM_Voice")
    for p in ["b_apply_eq", "eq_priority", "fade_in_time", "fade_out_time", "duration"]:
        try:
            log("mix %s: SM_Voice=%s SM_Video=%s" % (p, voice.get_editor_property(p), sm.get_editor_property(p)))
        except Exception:
            pass

run()
log("DONE")
unreal.SystemLibrary.quit_editor()
