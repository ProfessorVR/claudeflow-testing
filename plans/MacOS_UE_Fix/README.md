# MacOS_UE_Fix

Investigation into why the **Cataract Operations — Paraguay** video widget fails on the macOS build of
`awsTutorial` (UE 5.4.1), while the byte-identical widget plays correctly in a shipped Windows build.
Created 2026-08-24 from session `be627851-3de2-4ae4-a1b2-3114b88015cb`.

## Start here

**Resuming in a clean session? Paste `BOOT-PROMPT.md` as your first message.**

| File | What it is |
|---|---|
| `BOOT-PROMPT.md` | Handoff. Settled facts, the live hypothesis, the decisive next test, constraints, environment. |
| `SESSION-LOG-2026-08-24.md` | Detailed run log — commands, outputs, and **two retracted conclusions** not to re-derive. |
| `report/paraguay-widget-forensics.html` | Source of the published report (rev. 2). Republish this path to update the same URL. |
| `tools/` | The analysis instruments built this session. See caveats below. |
| `data/` | Baseline manifests and widget name tables, so a changed project can be diffed without re-deriving. |

Published report (rev. 3): **https://claude.ai/code/artifact/5542fb4f-8efc-4ed9-9f66-ae7b09c576fd**

## Where things stand

**Symptom (macOS only):** Paraguay plays no video and never switches back to the Procedures /
Interviews buttons.

**Settled:**
- The live chain is `Hospital_Client → BP_SC_CAT_PARA → BP_WG_CAT_PARA`.
- `BP_WG_CAT_PARA` is genuinely damaged (54 dangling media-player reads, 19 dangling button reads,
  208 delegate binds vs 7–32 in working peers, 0 unbinds).
- **That damage is not the cause.** The same bytes play correctly in the shipped Windows package;
  `K2Node_*` nodes are editor-only and stripped at cook. Debt, not fault.
- Zero broken asset references. Media library intact.
- The PC project is byte-identical to the Mac one for 169 of 171 relevant assets.

**Override hypothesis — DEAD (2026-08-24).** The `Mac → ElectraPlayer` override is present on 442/442
Mac stream sources (all 162 Paraguay ones) and baked into the shipped Mac build. Rev. 2's "not on disk"
was a string grep for a `transient` property stored as raw GUIDs — it could never have found it.
The cooked Blueprint class is also byte-identical across Windows and Mac. Blueprint, assets, player
selection and content are all eliminated; **runtime media playback is the only layer left**, and the
next step is a verbose packaged-run log. See Part C of the session log.

## Tool caveats

- `uasset2.py` — trustworthy. Derives table strides empirically; asserts every export name resolves.
- `nodedata.py` — **has false positives** by construction. Only valid for relative comparison across
  files analysed the same way.
- `checkrefs2.sh` — FName-aware. The naive version produced a false-positive storm; read §B3 of the
  session log before touching it.

## Related, already shipped

The Mac **CLI packaging** procedure (SOP §11h) was written and deployed the same day — it documents why
the editor's Package Project button deadlocks on this project and gives the explicit `RunUAT` commands.
It lives on the Mac at `~/Downloads/ue541-team-package/`, mirrored to `/Volumes/KingLab/ue541-team-package/`,
md5 `dd575b1ebb86ea660a2f0390237f6aad`. That work is complete; see Part A of the session log.
