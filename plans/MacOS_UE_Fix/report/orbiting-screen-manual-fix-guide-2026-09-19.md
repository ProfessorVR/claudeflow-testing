# Manual fix: give orbiting its own reference (BP_FirstPersonCharacter) — step by step

**Goal:** the O key (orbit) stops overwriting `CurrentOrbitTarget`, the reference that E and Q use for the video player.
You add one variable, `OrbitingScreen`, and change **3–4 nodes** in the O-key section. Nothing else changes.

Time: about 5 minutes. The editor is Unreal Engine 5.4 (Windows project).

---

## Step 0 — Backup (before opening the editor)
Tell me and I'll back up the asset and verify the copy. Or copy it yourself, with the editor closed:
`Content/FirstPerson/Blueprints/FirstPersonMap/BP_FirstPersonCharacter.uasset`

Note: every time this project's editor starts, it re-copies the engine's StarterContent pack. This is an existing
project setting (`bAddPacks=True`), and the game doesn't use StarterContent. It's harmless; I'm mentioning it only so
the file changes aren't a surprise.

## Step 1 — Open the Blueprint
Content Browser → `Content/FirstPerson/Blueprints/FirstPersonMap/` → double-click **BP_FirstPersonCharacter** → the
**Event Graph** tab.

## Step 2 — Create the new variable
1. In the **My Blueprint** panel (left), under **Variables**, right-click **CurrentOrbitTarget** → **Duplicate**.
2. Rename the copy (F2) to **OrbitingScreen**.
3. Select it and check in **Details**: **Variable Type = Actor → Object Reference**. It should be identical to
   CurrentOrbitTarget. Leave the default value empty.
4. Click **Compile**.

## Step 3 — Find the O-key section
1. In **My Blueprint**, right-click **CurrentOrbitTarget** and choose **By Name**. That's one of the four Find
   References options (By Name, By Name (All), By Class, By Class (All)); "By Name" searches only this Blueprint. The
   results open in the **Find Results** panel at the bottom of the editor.
   Alternatives: select the variable and press **Alt+Shift+F**, or press **Ctrl+F** in the Blueprint and type
   `CurrentOrbitTarget`.
2. Double-click any result that sits next to **Start Orbiting** or **Stop Orbiting**. You land in the O-key section.
   It starts at a red event node titled **O**, which has **Pressed** and **Released** outputs.

The section looks like this:

**O → Pressed:**
`Get Overlapping Actors (Class Filter: BP_OrbitTrigger)` → `For Each Loop with Break` →
`Cast To BP_OrbitTrigger` → `Branch (Does Implement Interface: Screen Actor Ref, BPI_Orbitable)` →
`Start Orbiting (Message)` → **① SET CurrentOrbitTarget** (its input is wired from *Screen Actor Ref*).

**O → Released:**
`Is Valid` (or a Branch fed by Is Valid) using **② Get CurrentOrbitTarget** → `Stop Orbiting (Message)`, whose
Target is **③ Get CurrentOrbitTarget** → **④ SET CurrentOrbitTarget** (its input is left empty). ② and ③ may be one
Get node wired to both places.

## Step 4 — Switch those nodes to OrbitingScreen
The easiest way is to **drag `OrbitingScreen` from My Blueprint and drop it directly onto the node**.
- On a SET node, the tooltip reads *"Change node to write to 'OrbitingScreen'"*.
- On a Get node, it reads *"Change node to read from 'OrbitingScreen'"*.

Release the mouse, and the node switches with its wires intact. Do this for:
- **①** the SET at the end of the **Pressed** chain.
- **②/③** every Get CurrentOrbitTarget in the **Released** chain (the one feeding *Is Valid*, and the one feeding
  *Stop Orbiting*'s Target).
- **④** the SET at the end of the **Released** chain (leave its input empty).

If dropping doesn't offer "Change node…", do it manually:
- **Ctrl-drag** `OrbitingScreen` into the graph to create a Get, or **Alt-drag** to create a Set.
- Reconnect the same wires (the white exec wires and the blue data wire).
- Delete the old node.

**Do not change** anything outside the O section. In particular, leave CurrentOrbitTarget alone inside the functions
**ShowFromActiveTrigger** and **Hide Current**.

## Step 5 — Check it
1. Right-click **CurrentOrbitTarget** → **By Name** again. **No result should be in the Event Graph.** All remaining
   uses should be inside the **ShowFromActiveTrigger** and **Hide Current** functions.
2. Right-click **OrbitingScreen** → **By Name**. You should see only the O-section nodes: 1 SET in Pressed, then 1–2
   Gets and 1 SET in Released.
3. Click **Compile**. It must finish with no errors. Then **Save**.

## Step 6 — Quick test in Play (PIE), at a 360 screen
1. **E → Q:** the video player closes.
2. **E → hold O, release O → Q:** it closes. This is the case that failed before.
3. **E → hold O → Q while holding → release O:** it closes, and the screen **stops** orbiting.
4. **E at screen A → orbit screen B with O → Q:** screen A's video closes.

## Step 7 — Tell me when you're done
I'll check the result read-only: a fresh bytecode dump compared with today's. The O paths must use OrbitingScreen, and
E/Q must be unchanged. Then, with your go-ahead, I'll:
- Package the Windows build and test it on CHIMERA.
- Apply the same asset to the Mac project, after confirming the Mac's copy matches the Windows original.
