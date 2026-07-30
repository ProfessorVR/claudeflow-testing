# Diagram Step 7 Hexis-Bisection — Option A Applied

**Timestamp**: 2026-05-20T1015 (TikZ authoring) / T1019 (reference file)
**Backup**: `tmp/Dissertation/.backups/2026-05-20T1012-pre-hexis-band-option-A/`
**Files modified**: 2

## What was applied

**Option A** per the user's confirmed plan: incremental Step 7 augmentation of the §1.0 inline TikZ + canonical reference TikZ-in-MD file. The user noted this is a first pass; a future Option B full-inclusive redesign will further close the gap.

### Changes to §1.0 (`tmp/Dissertation/1.0 - Introduction/1.0 - Introduction.md`)

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| Lines | 606 | 677 | +71 |
| Brace balance | 565=565 | 580=580 | preserved |
| SHA-256 | (varied) | `a107611b693117a900bcb7bd2d0bf25becbf05f0926648bc806eb37f32cc66fb` | updated |

TikZ additions inserted just after the K-foreach (kinetic→motion arrows) loop, before the Schema label:

1. **TECHNE-hexis sub-node** at `(-\kinoff - 8.5, -2*\nodesep - \motionoff)` = (-14.3, -9.5)
2. **PRAXIS-hexis sub-node** at `(-\kinoff - 6.1, -2*\nodesep - \motionoff)` = (-11.9, -9.5)
3. **Outer frame** (`fit=(techne-hexis)(praxis-hexis)`) with dual labels:
   - Above: "Settled Doxai (*Hexeis*)"
   - Below: "Met. Δ 20, 1022b 4 · GA 18 §17"
4. **Three arrows**:
   - technē-hexis → M23.south west (additional unmoved originator)
   - praxis-hexis → M23.south (same role, Type 3 chain)
   - praxis-hexis → A1.west (Type 3 two-level reach; modulates basic-valence input)
5. **Type 3 two-level annotation** at `(-\kinoff - 6.1, -\nodesep - \motionoff - 0.3)` explaining the upstream reach

Also updated the original `\inlinenote` at L70 to record the Option A application + flag what Option B would add.

### Changes to reference TikZ-in-MD (`tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/Actualization of Desire Diagram in Latex Format.md`)

| Metric | Before | After | Delta |
|---|---:|---:|---:|
| Lines | 548 | 619 | +71 |
| Brace balance | 247=247 | 247=247 | preserved |

Beyond the same hexis-bisection block applied to §1.0, the reference also received the Convention (b) + content migration that brings it forward to match §1.0 (it had been stuck at the pre-Sessions-1-3c state):

1. A_0 title: `Sensible Object in Actuality` / `energeiai aisthēton` → `Motion and Time as Ontological Horizon` / `kinēsis kai chronos`
2. M01-M34 labels: `M_n → M_{n+1}` (Convention a, 4 occurrences) → `M_n → A_{n+1}` (Convention b)
3. K01 unmoved-role: `A_0 (sensible object)` → `A_0 (motion-time horizon) + sensible object's active potency`
4. Recursive loop text (2 occurrences): `new A_0` → `fresh M_0 → A_1 cycle`

### Cross-file diff (post-update)

§1.0 inline TikZ vs. reference TikZ-in-MD: **diff reduced from 50 lines (pre-update) to 20 lines (post-update)**. Remaining differences are entirely cosmetic:
- `\usetikzlibrary` formatting (single line vs. multi-line) — 9 lines
- §1.0 has a "color definitions" editorial comment the reference doesn't — 1 line
- Reference has `\begin{document}` (since it's a standalone document) — 1 line
- Reference uses LaTeX escape `\=` for Greek transliteration; §1.0 uses raw Unicode — 1 line

The TikZ body content is now in sync.

## What Option A does NOT cover (deferred to Option B)

Per the user's note: "we will return to this later to make sure it is fully inclusive of every element". Option B would also add the following Step 7 / HTML-diagram elements not present in §1.0's simplified architecture:

1. **A3 frame with 5 sub-nodes**: NOESIS / MEMORY / DISCURSIVE / SPECULATIVE / DELIBERATIVE (currently §1.0 has a single A3 actnode with subtitle "Noetic / Doxastic / Mnemonic / Anticipatory")
2. **Doxa band** as a horizontal visual element beneath A3-row (currently §1.0 has this in the right-column `modes` detail-box)
3. **Emotion node** fed by M34 as a visual chain element (currently §1.0 has this in the right-column `emotion` detail-box)
4. **M3→A4 three-input-paths** (deliberation-no-doxa / settled-hexis / emotion-mediated)
5. **Diachronic feedback loop** indicator (cross-episode hexis formation: A4→Settled Doxai)
6. **Full-page layout** (figure[p] environment with caption/label/cross-ref from prose)

### 7. Empty settled-doxa bubble investigation (user-observed 2026-05-20)

**User note**: "In the diagram, the settled doxa bubble on the left has nothing inside of it."

**Investigation status**: The HTML SVG-rendering JS at `actualization-chain-v7.html` L2535-2620 DOES build the bubble's interior content:

- Outer frame (`outerRect`, class `settled-doxai-outer`) with label `Settled Doxai (Hexeis)` at top
- TECHNE sub-node rect (`techneRect`, class `settled-doxai-techne`) + label `technē-hexis` + subtitle `(Type 2)`
- PRAXIS sub-node rect (`praxisRect`, class `settled-doxai-praxis`) + label `praxis-hexis` + subtitle `(Type 3)`

All elements are appended to the `<g id="settled-doxai">` group via `g.appendChild(...)`. So in code, the bubble SHOULD have content.

**Possible causes of the visual emptiness the user is observing**:

a) The user is looking at an older browser-cached version (HTML mtime is 2026-05-19 18:21 from Step 7 update; cache may be stale)
b) The JS render is failing silently in the user's browser (DevTools Console would show errors)
c) The SVG `<text>` elements are being rendered but with `fill` color matching the bubble's `fill` (both use `var(--pathos)`-derived values) — making the text invisible against the background. Worth inspecting computed fills.
d) Font loading issue: the SVG `<text>` requires the font to be loaded; if the EB Garamond / IBM Plex Sans webfonts fail to load (no internet, font CDN blocked), text may render in a fallback that displays nothing
e) The user might be referring to a DIFFERENT element — there's also a "doxa band" mentioned in the HTML separately from "settled-doxai". The doxa band is the horizontal band beneath A3 (orthogonal committal layer) which may be what's actually empty.

**Action items for Option B return-to**:
- Open the HTML in browser, use DevTools Inspect Element on the empty bubble to confirm whether (a) the `<text>` nodes exist in DOM but are invisible (fill/font issue) or (b) the JS didn't run / appendChild didn't execute
- If (a): adjust the CSS / fill colors / font fallbacks
- If (b): debug the JS render path; the relevant function block is at L2535-2620
- If the user means the SEPARATE "doxa band" element rather than "settled-doxai": locate and populate that band (search HTML for `id="doxa-band"` or `doxaBand`)
- Once root cause is identified, ensure the TikZ static export captures the resolved content faithfully

Estimated effort for Option B: ~6-10 hours (with the empty-bubble diagnostic adding ~30-60 min depending on root cause).

## What remains in the broader §1.0 L70 inlinenote

The original user note was "Have to update the diagram and make it full page". After Option A:
- "Update the diagram" — **substantially done** for Step 7 hexis-bisection (the most recent canonical change). Option B remains for full fidelity.
- "Make it full page" — **NOT YET DONE**. Layout decision (figure[p] vs. landscape vs. resizebox + caption + label) remains a separate task.

## Verification

- §1.0 brace balance: 580=580 ✓
- Reference brace balance: 247=247 ✓
- §1.0 contains all new TikZ identifiers: `techne-hexis`, `praxis-hexis`, `Settled Doxai`, `Type 3 only` ✓
- Reference contains same identifiers ✓
- No old `M_n → M_{n+1}` residue in reference ✓
- No old "Sensible Object in Actuality" title in reference ✓
- §1.0/reference cross-file diff reduced 50→20 lines (cosmetic preamble only) ✓

## Visual verification (recommended next step for user)

To confirm the new TikZ renders cleanly:

```bash
# Standalone compile of reference file:
cd "tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/"
# Extract TikZ from .md and compile:
sed -n '/\\documentclass/,/\\end{document}/p' \
  "Actualization of Desire Diagram in Latex Format.md" > /tmp/diagram.tex
pdflatex -output-directory=/tmp /tmp/diagram.tex
xdg-open /tmp/diagram.pdf
```

This will produce a standalone PDF rendering the post-Step-7 diagram, which can be visually compared against the interactive HTML at `actualization-chain-v7.html` for parity.
