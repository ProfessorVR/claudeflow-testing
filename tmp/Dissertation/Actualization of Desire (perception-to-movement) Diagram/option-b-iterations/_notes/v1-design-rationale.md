# Option B v1 — Design Rationale

**Generated**: 2026-05-20T1202
**Iteration**: v1 (first Option B pass)
**Baseline**: v0 (post-Option-A state, 2026-05-19 18:21 / 2026-05-20T1015)
**Workflow**: copies-not-edits per `feedback-major-iterations-on-copies.md`

---

## v0 hashes (frozen baselines)

```
c5f665327d868180…  Actualization of Desire Diagram in Latex Format.md     (619L, 24973b)
35d0703bccb36d29…  actualization-chain-v7.html                              (3849L, 213784b)
45aba0afceb9bf03…  1.0 - Introduction.md                                    (677L, 72785b)
```

If these change at any point, v1 design assumptions need re-verification.

---

## User decisions (2026-05-20T1155)

1. **Right-column detail boxes**: KEEP both `modes` and `emotion` as supplementary annotations (reword to reference inline structure; add 4 doxa functional modes to `modes`, add Rhetoric definitions to `emotion`).
2. **Figure layout (§1.0 inline)**: portrait full-page with `\resizebox{\textwidth}{!}{...}`, caption below.
3. **HTML empty-bubble fix**: DEFER to separate session (user verifies v0 in browser first; force-refresh may resolve the cache hypothesis).

---

## Element inventory: HTML → TikZ mapping

### A3 row (5 sub-nodes + frame)

HTML structure (per `actualization-chain-v7.html` L799-1140):
- **A3-NOESIS** at SVG (350, 830) w=180 h=130 — terminates, "Pure Noesis (Intellection)"
- **A3-MEMORY** at SVG (555, 830) w=180 h=130 — terminates, feeds Discursive
- **A3-DISCURSIVE** parent at SVG (800, 830) w=240 h=130 — italic sublabel "synthetic operation upon phantasmata"
  - **A3-SPECULATIVE** sub at SVG (800, 880) w=215 h=36 — terminates
  - **A3-DELIBERATIVE** sub at SVG (800, 920) w=215 h=36 — feeds M3→A4
- **A3-FRAME** medium-touch enclosure at SVG (235, 800) w=715 h=270

TikZ v1 placement (TikZ has y-positive-UP; scale=0.62):
- A3-NOESIS at `(-2.6, -3*\nodesep)`, custom node style, w=1.9cm h=1.0cm
- A3-MEMORY at `(0, -3*\nodesep)`, w=1.9cm h=1.0cm
- A3-DISC at `(+2.6, -3*\nodesep)`, parent style (dashed border), w=2.4cm h=1.0cm
  - A3-SPEC at `(+2.6, -3*\nodesep + 0.25)`, sub-style, w=2.0cm h=0.4cm
  - A3-DELIB at `(+2.6, -3*\nodesep - 0.25)`, sub-style, w=2.0cm h=0.4cm
- A3-FRAME via `\node[fit=(A3-NOESIS)(A3-MEMORY)(A3-DISC)]`

### DOXA band (orthogonal committal dimension)

HTML: `<g id="doxa-band">` at SVG (590-940 x, 990-1054 y), w=700 h=64, pathos colors, "DOXA — orthogonal committal dimension · supervenes upon any orientational mode · taking-as-true-or-false"

TikZ v1: horizontal band at `(0, -3*\nodesep - 1.5)`, w=7cm h=0.7cm, pathos colors.

Supervenes arrows: from `.south` of each of NOESIS/MEMORY/DISC/DELIB into top of band.

### Memory feeds Discursive arrow

HTML L2416-2442: dashed arrow from MEMORY.east to DISC.west with label "feeds".

TikZ v1: small dashed arrow with `\node[midway]` label "feeds".

### Inline emotion-bubble (replaces right-col `emotion` location? NO — keep both)

HTML L3008-3052: EMO at SVG (1070, 1022) w=190 h=68 with connector from DOXA east edge.

TikZ v1 placement: at `(+5.5, -3*\nodesep - 1.5)` = (5.5, -12.9), w=2.6cm h=0.9cm. Style: `emotionnode` with magenta/emotion color.

Connector: dashed line from DOXA.east to EMO-INLINE.west.

**Note**: The v0 right-column `emotion` detail box stays at `(\detailoff=+10.8, -14.8)`. The new inline EMO at `(+5.5, -12.9)` is 5.3 units left + 1.9 up. They are visually distinct and don't overlap. Per user choice, the detail box content gets reworded to reference inline.

### M3→A4 three input paths (replace single A3→M34 chainlink)

HTML L2726-2799:
- Path 1 (Deliberative, no doxa): teal #1e7878 solid, from DELIB.south curving to M34.north_west
- Path 2 (Habitual rational, settled doxa as hexis): pathos gold dashed, from DOXA south-left to M34.north
- Path 3 (Evaluatively complex, emotion-mediated): emotion magenta dashed, from EMO south to M34.north_east

TikZ v1 styles (NEW):
```latex
m34deliberative/.style={ -{Stealth[length=5pt,width=4pt]},
  line width=1.4pt, color=teal!70!black },
m34habitual/.style={ -{Stealth[length=5pt,width=4pt]},
  line width=1.2pt, color=pathoscolor!80!black,
  dash pattern=on 4pt off 2pt },
m34emotion/.style={ -{Stealth[length=5pt,width=4pt]},
  line width=1.2pt, color=emotioncolor!80!black,
  dash pattern=on 3pt off 3pt },
```

### Diachronic feedback (A4 → Settled Doxai)

HTML L3106-3160: `flow-arrow-hexis-sedimentation` from A4.west routed at HX_LEFT_X=15 (far-left margin) up to Settled Doxai west face.

TikZ v1: from A4.west → x=-12.5 (further left than current emotion-feedback at -11.5) → up to hexis-band.west.

Style (NEW):
```latex
diachronic/.style={ -{Stealth[length=5pt,width=4pt]},
  line width=1pt, color=pathoscolor!75!black,
  dash pattern=on 6pt off 3pt },
```

### Figure[p] wrapper (§1.0 only)

Reference TikZ-in-MD is standalone — needs NO wrapper.

§1.0 v1 inline TikZ block gets wrapped:
```latex
\begin{figure}[p]
  \centering
  \resizebox{\textwidth}{!}{%
    \begin{tikzpicture}[scale=0.62, transform shape, ...]
    ...
    \end{tikzpicture}%
  }
  \caption{The Actualization Chain $A_0$ through $A_4$. The five-fold articulation
  of the perceptual-phantasmatic-motor loop: ontological horizon (A$_0$), completed
  perception with affective valence (A$_1$), phantasma as pivot (A$_2$), branching
  cognitive actualities under the orthogonal committal dimension of doxa (A$_3$ row),
  and completed praxis (A$_4$). Three input paths into M$_3$$\to$A$_4$ render the
  Type 1/2/3 chain bivalence: pure deliberation, habitual rational action via
  settled-doxa-as-hexis, and evaluatively complex emotion-mediated action.
  Diachronic feedback (A$_4 \to$ Settled Doxai) renders cross-episode hexis
  sedimentation (NE II.1).}
  \label{fig:actualization-chain}
\end{figure}
```

Prose cross-reference: find existing diagram-discussion paragraph in §1.0 and add `(see Figure~\ref{fig:actualization-chain})` to it.

---

## Coordinate math: vertical shift

To fit the new A3 row (h=1.0) + DOXA band (h=0.7) + gaps between A3 row, DOXA band, and M34, we need ~1.0 unit extra vertical space below A3 row.

**Shift M34, A4 down by `\m34extra = 1.0`**:

| Element | v0 y-coord | v1 y-coord | Reason |
|---|---:|---:|---|
| A0 | 0 | 0 | unchanged |
| A1 | -3.8 | -3.8 | unchanged |
| A2 | -7.6 | -7.6 | unchanged |
| A3 | -11.4 | -11.4 (row center) | row replaces single node |
| DOXA | n/a | -12.9 | NEW (A3.y - 1.5) |
| M34 | -13.3 | -14.3 | shifted by `\m34extra` |
| A4 | -15.2 | -16.2 | shifted by `\m34extra` |
| T34 | -13.3 | -14.3 | follows M34 |
| K34 | -13.3 | -14.3 | follows M34 |
| T34d | -14.6 | -15.6 | follows T34 |

**Ripple effects to verify**:
- Background `zonelower` fit: uses (A3)(A4)(K23)(K34)(T23)(T34) — now (A3-FRAME)(DOXA)(EMO-INLINE)(A4)(K23)(K34)(T23)(T34)
- Pathos track end-pos: pathos.south → K34.south + (0, -0.5) (now further down)
- Variable emotion note: `at (0, -4*\nodesep - 2.2 - \m34extra)` → currently `-17.4` → now `-18.4`
- Legend: `at (0, -4*\nodesep - 4.8 - \m34extra)` → currently `-20.0` → now `-21.0`
- Recursive loop: ends at A0.east, starts at A4.east → vertical span increases by `\m34extra`

---

## v0 → v1 diff plan (reference TikZ)

Changes to apply (in roughly file order):

1. **Add new offset macro** `\def\m34extra{1.0}` after existing layout constants (L110).
2. **Add new TikZ styles** in tikzpicture options (~L100):
   - `a3node` (smaller actnode for inline A3 sub-nodes)
   - `a3parent` (dashed border parent)
   - `a3sub` (smaller sub-node)
   - `a3frame` (medium-touch enclosure)
   - `doxaband` (horizontal band style)
   - `emotioninline` (inline emotion bubble)
   - `m34deliberative`, `m34habitual`, `m34emotion` (3 path styles)
   - `diachronic` (A4→hexis arrow)
   - `doxasupervene` (small arrows into DOXA top)
   - `feeds` (memory→discursive)
   - `emoconnector` (DOXA→EMO-INLINE)
3. **Remove single A3 actnode** at L128-131.
4. **Add A3 row + sub-nodes + frame** (~50 lines new) after A2 actnode.
5. **Shift M34, A4** y-coords (use `\m34extra` macro).
6. **Add DOXA band** + supervenes arrows + memory-feeds-discursive arrow (~30 lines).
7. **Remove single M23→A3 chainlink and A3→M34 chainlink** at L166-167.
8. **Add M23 fan-out** (3 arrows to NOESIS/MEMORY/DISC) (~12 lines).
9. **Add M3→A4 three-input paths** (Deliberative + Habitual + Emotion) (~30 lines).
10. **Add inline EMO-INLINE node** + connector from DOXA east (~12 lines).
11. **Add diachronic feedback** A4 → hexis-band (~15 lines).
12. **Update `modes` detail box content** to reference inline A3 + add 4 doxa functional modes from DOXA_BAND.expanded[5] (HTML L1185-1187).
13. **Update `emotion` detail box content** to reference inline EMO-INLINE + add Rhetoric definitions from EMOTION_COMPOSITE.expanded[2] (HTML L1486-1490).
14. **Update `terminate` annotation** at L411-419 to reference NOESIS/MEMORY/SPECULATIVE (3 terminating modes) rather than A3.
15. **Update background `zonelower` fit** (L491-495).
16. **Update recursive loop label/route** for new A4 position.
17. **Update variable emotion note position** for new A4 position.
18. **Add LEGEND rows** for new visual categories: A3 sub-node, DOXA band, EMO inline, 3 m34-paths, diachronic feedback.

**Estimated v1 reference TikZ size**: ~820 lines (vs 619 v0).
**Estimated v1 brace balance**: ~280-290 (vs 247 v0).

---

## Verification plan

After v1 written:

1. Brace balance preserved (each `{` matched).
2. SHA-256 of v1 file recorded.
3. Standalone PDF compile via pdflatex:
   ```bash
   cd "tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/option-b-iterations/"
   sed -n '/\\documentclass/,/\\end{document}/p' "Actualization of Desire Diagram — Option B v1.md" > /tmp/diagram-v1.tex
   pdflatex -output-directory=/tmp -interaction=nonstopmode /tmp/diagram-v1.tex
   xdg-open /tmp/diagram-v1.pdf
   ```
4. Visual comparison against `actualization-chain-v7.html` rendered in browser.
5. User review of v1 PDF → decision: approve / request v2.
6. If approved, propagate v1 → originals via copy-back with `.backups/` snapshot.

---

## Open questions deferred to v2 (if any)

- v1 keeps the v0 left-column kinetic boxes (K01-K34) unchanged. HTML has these as well — match is good. No change anticipated for v2 on this front.
- v1 keeps the v0 pathos track unchanged. HTML has this — match is good. No change.
- v1 does NOT add the pure-appetitive bypass (A2 → M34 east). HTML has it; could be added in v2 if user wants full HTML parity. Marked as "optional addition" for v2.
- v1 does NOT add the schema-bubble at top. v0 has "THREE-FACTOR SCHEMA" text label; HTML has a clickable schema-chip. Visual parity good enough; no change.

---

**End of v1 design rationale.**
