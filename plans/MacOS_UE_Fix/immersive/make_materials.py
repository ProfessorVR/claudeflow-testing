# Immersive Mode (2026-09-19): creates the two materials the mode needs, in /Game/Blueprints/Immersive:
#   M_ImmersiveBlackout - unlit black, for the surround in cinema mode.
#   M_ImmersiveFloor    - unlit translucent grid disc (params Tint, Grid, Opacity), the optional comfort floor.
# Idempotent: existing assets are left alone. Nothing else is touched.
import unreal

DIR = "/Game/Blueprints/Immersive"
GRID = "/Game/LevelPrototyping/Textures/T_GridChecker_A"

def log(m):
    unreal.log("IMMMAT " + str(m)[:500])

mel = unreal.MaterialEditingLibrary
at = unreal.AssetToolsHelpers.get_asset_tools()
eal = unreal.EditorAssetLibrary

def make(name, build):
    path = "%s/%s" % (DIR, name)
    if eal.does_asset_exist(path):
        log("%s exists; left alone" % name)
        return None
    mat = at.create_asset(name, DIR, unreal.Material, unreal.MaterialFactoryNew())
    mat.set_editor_property("shading_model", unreal.MaterialShadingModel.MSM_UNLIT)
    mat.set_editor_property("two_sided", True)
    build(mat)
    mel.recompile_material(mat)
    eal.save_loaded_asset(mat, False)
    log("created %s" % path)
    return mat

def blackout(mat):
    black = mel.create_material_expression(mat, unreal.MaterialExpressionConstant3Vector, -400, 0)
    black.set_editor_property("constant", unreal.LinearColor(0.0, 0.0, 0.0, 1.0))
    mel.connect_material_property(black, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)

def floor(mat):
    mat.set_editor_property("blend_mode", unreal.BlendMode.BLEND_TRANSLUCENT)
    tint = mel.create_material_expression(mat, unreal.MaterialExpressionVectorParameter, -800, -200)
    tint.set_editor_property("parameter_name", "Tint")
    tint.set_editor_property("default_value", unreal.LinearColor(0.08, 0.10, 0.13, 1.0))
    mel.connect_material_property(tint, "", unreal.MaterialProperty.MP_EMISSIVE_COLOR)

    grid = mel.create_material_expression(mat, unreal.MaterialExpressionTextureSampleParameter2D, -800, 100)
    grid.set_editor_property("parameter_name", "Grid")
    texture = unreal.load_asset(GRID)
    if texture:
        grid.set_editor_property("texture", texture)
    else:
        log("grid texture missing: " + GRID)

    opacity = mel.create_material_expression(mat, unreal.MaterialExpressionScalarParameter, -800, 400)
    opacity.set_editor_property("parameter_name", "Opacity")
    opacity.set_editor_property("default_value", 0.25)

    mul = mel.create_material_expression(mat, unreal.MaterialExpressionMultiply, -500, 200)
    mel.connect_material_expressions(grid, "R", mul, "A")
    mel.connect_material_expressions(opacity, "", mul, "B")

    # Fade out towards the edge of the disc, so it reads as a soft pool of light rather than a square.
    last = mul
    try:
        radial = mel.create_material_expression(mat, unreal.MaterialExpressionRadialGradientExponential, -800, 600)
        fade = mel.create_material_expression(mat, unreal.MaterialExpressionMultiply, -300, 300)
        mel.connect_material_expressions(mul, "", fade, "A")
        mel.connect_material_expressions(radial, "", fade, "B")
        last = fade
    except Exception as e:
        log("no radial fade (%s); flat grid instead" % e)
    mel.connect_material_property(last, "", unreal.MaterialProperty.MP_OPACITY)

make("M_ImmersiveBlackout", blackout)
make("M_ImmersiveFloor", floor)

for name in ["M_ImmersiveBlackout", "M_ImmersiveFloor"]:
    p = "%s/%s" % (DIR, name)
    m = unreal.load_asset(p)
    if m:
        log("%s: shading=%s blend=%s two_sided=%s" % (name, m.get_editor_property("shading_model"),
            m.get_editor_property("blend_mode"), m.get_editor_property("two_sided")))

log("DONE")
unreal.SystemLibrary.quit_editor()
