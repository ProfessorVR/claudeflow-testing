# "Procedures" / "Interviews" buttons cut off ("ecures", "rviews") — findings, 2026-09-18

Read-only inspection of the live Mac project (`/Volumes/UnrealEngine/Unreal_Projects/awsTutorial`).
Nothing was modified. Tools: `plans/MacOS_UE_Fix/tools/{widgettree,props_exact,label_layout}.py`.

## How the video player is shown
Walking into a placed `BP_OrbitTrigger` (e.g. `__ExternalActors__/…/Hospital_Client/7/EU/P2IMHTNF3YZFP7U0BCID08`,
`WidgetClass = BP_WG_CatPara_C`) makes `BP_FirstPersonCharacter` › `ShowFromActiveTrigger` run
`CreateWidget(WidgetClass)` → `AddToViewport`. The player is **screen-space UI**, laid out in UI units =
screen pixels ÷ UI scale.

## Where the buttons are
Every video widget (16 checked) has the same structure:
`CanvasPanel_All › [CanvasPanel_Menu, full-screen] › VideoSelectionSwitcher › SwitchtoVideoSelection (grid, one
auto-width column) › SizeBox › Button VideoSelectPRO / VideoSelectINT › TextBlock "Procedures" / "Interviews"`.
The text blocks and size boxes set no width, font, justification or clipping — the labels are not the problem.

`VideoSelectionSwitcher` is **anchored to the screen centre** (anchors = alignment = 0.5) and then moved with a
**render transform of (−1087.1, +289.8)** — identical in all 16 widgets. The buttons' left edge therefore renders
**952.6–955.0 UI units left of screen centre**:

| variant | widgets | canvas slot (left offset / width) | left edge vs centre |
|---|---|---|---|
| A | CatPara, CatViet_Test, TEST_Backup, Template_POV-1, Template_POV-2 | 365.1 / 466.0 | −955.0 |
| B | CAT_UCI_01, CAT_UCI_02, CAT_VIET, CHOC, CORNEA, DBS, SD, TAVR | 382.0 / 495.0 | −952.6 |
| C | BilateralScar, PeriMortem, YouTube | 549.3 / 829.5 | −952.6 |

So the buttons are on screen only if the UI layout is at least ~1,910 units wide.

## Why it depends on the screen
The project uses Unreal's default UI scaling (no override in `Config/`): rule **ShortestSide**, curve
480→0.444, 720→0.666, 1080→1.0, 8640→8.0 (`Engine/Config/BaseEngine.ini`). A 16:9 screen always lays out
~1,920 units wide — the buttons fit with 5–7 units to spare. Anything narrower than 16:9 lays out narrower and
pushes the left part of the buttons off the screen edge:

| display | UI scale | layout width | units of the buttons off-screen |
|---|---|---|---|
| 1920×1080, 2560×1440 (16:9) | 1.00 / 1.33 | 1920 | 0 |
| 3440×1440 (21:9, desktop AW3423DW) | 1.33 | 2580 | 0 |
| **2560×1656 MacBook Air** (game log `r.SetRes`) | 1.53 | 1670 | **~120** |
| **2560×1600 16:10 (CHIMERA laptop panel)** | 1.48 | 1728 | **~90** |
| 1920×1200 / 1440×900 (16:10) | 1.11 / 0.83 | 1728 | ~90 |
| 2736×1824 (3:2) | 1.69 | 1620 | ~145 |

The cut is on the left, so what remains is the end of each word ("…ecures", "…rviews"). This is a layout/design
issue, not a Mac rendering bug: both 16:10 test laptops are affected; the 16:9 and 21:9 development monitors are
not, which is likely why it was never seen during development.

## Fix options (not applied)
1. **Project-wide, one setting (recommended):** Project Settings › Engine › User Interface › DPI Scaling Rule =
   **Scale To Fit** (design size 1920×1080). Then scale = min(width/1920, height/1080), the layout is never
   narrower than 1920 units, and the buttons fit on every aspect ratio (0 cut on every display above). 16:9
   screens look exactly as today; on 16:10 the whole UI is drawn ~11% smaller (it lays out 1920×1200 instead of
   1728×1080). Check the other full-screen menus (login, course page, microphone menu) once after the change.
2. **Per widget (16 widgets):** re-anchor `VideoSelectionSwitcher` to the left edge (anchors/alignment 0, 0.5) and
   replace the −1087 render translation with a real position offset. Keeps the current UI size but is 16 edits
   and must be repeated for any widget copied from the template.
3. **Per widget, alternative:** wrap each widget's root in a Scale Box (Scale To Fit) — same effect as option 1
   but per widget.
