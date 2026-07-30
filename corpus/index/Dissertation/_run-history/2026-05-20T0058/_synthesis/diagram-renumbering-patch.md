# Diagram Renumbering Patch — `actualization-chain-v7.html`

**Run-id**: 2026-05-13T1439
**Phase 3 Wave 1, Agent 3B (Numbering Audit)**
**Source**: `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/actualization-chain-v7.html` (SHA-256 first-12: `daf6b613f1d0`)
**Phase 2c findings**: `_per-section/DISS-DIAG-V7/phase2-node-audit.json`

---

## 1. Runtime convention verification

The diagram's user-visible SVG arrow labels are rendered through the `motionDisplayId()` function at **HTML line 1522**:

```javascript
// motionDisplayId(id) — implements the NEW Mn→An convention
// M01 → M₁→A₁    (perceptual motion)
// M12 → M₂→A₂    (phantastic motion)
// M23 → M₃→A₃    (cognitive engagement)
// M34 → M₄→A₄    (orektikon motion)
```

This function is **consistently applied at all SVG arrow labels** and produces the correct NEW-convention display at runtime. The patches in this document do **not** affect runtime SVG rendering — they only update OLD-form references that persist in developer-facing code comments and one user-visible tooltip context.

---

## 2. Developer-comment OLD-form patches (9 patches; not user-visible)

These patches edit `<!-- HTML comment -->` and `// JS comment` strings inside the HTML file. None of them affect what the user sees at runtime; their purpose is to bring the source-file annotations into alignment with the displayed convention so that future authors editing the file are not confused by mismatched OLD/NEW references.

### Patch DIAG-P1 — Line 734

**Context**: SVG group header comment for the three M34 input paths.

```html
OLD:  <!-- ============== M3→M4 INPUT PATHS (three styles) ============== -->
NEW:  <!-- ============== M4→A4 INPUT PATHS (three styles) ============== -->
```

### Patch DIAG-P2 — Line 825

**Context**: Code comment describing SETTLED_DOXAI position.

```
OLD:  Connector arcs up to M2→M3.
NEW:  Connector arcs up to M3→A3.
```

### Patch DIAG-P3 — Line 1185

**Context**: Code comment immediately above the `SETTLED_DOXAI` JS object declaration; co-located with the user-facing tooltip at line 1193 which already uses the NEW form (correct).

```
OLD:  Settled doxai as hexeis — additional unmoved originator at M2→M3
NEW:  Settled doxai as hexeis — additional unmoved originator at M3→A3
```

**Significance**: this is the **single locus** of the diagram's user-visible inconsistency cluster — the dev-comment at line 1185 uses OLD form while the user-facing tooltip body at line 1193 uses NEW form, and both sit in the same paragraph of source code. Patch DIAG-P3 alone resolves the cluster; **line 1193 requires no change**.

### Patch DIAG-P4 — Line 1997

**Context**: Code comment in the connector-drawing logic.

```
OLD:  (M23 → a3Nodes) and via the three M3→M4 input paths.
NEW:  (M23 → a3Nodes) and via the three M4→A4 input paths.
```

### Patch DIAG-P5 — Line 2114

**Context**: Code comment for A3-frame width sizing.

```
OLD:  Width is sized to fit before the leftmost M2→M3
NEW:  Width is sized to fit before the leftmost M3→A3
```

### Patch DIAG-P6 — Line 2425

**Context**: Section-header code comment introducing the SETTLED-DOXAI region's geometry.

```
OLD:  SETTLED DOXAI — sits below kinetic-M23 box, feeds into M2→M3
NEW:  SETTLED DOXAI — sits below kinetic-M23 box, feeds into M3→A3
```

### Patch DIAG-P7 — Line 2498

**Context**: Section-header code comment introducing the three M34 input-path styles.

```
OLD:  THREE PATHS INTO M3→M4 (distinct visual styles)
NEW:  THREE PATHS INTO M4→A4 (distinct visual styles)
```

### Patch DIAG-P8 — Line 2577

**Context**: Section-header code comment describing the pure-appetitive bypass route geometry.

```
OLD:  PURE-APPETITIVE BYPASS (A2 east → right column → over the top of T-box → M3→M4 north face)
NEW:  PURE-APPETITIVE BYPASS (A2 east → right column → over the top of T-box → M4→A4 north face)
```

### Patch DIAG-P9 — Line 2584

**Context**: Code comment about route geometry above the three M34-path labels.

```
OLD:  well above M34/T-box AND above all three M3→M4 path labels
NEW:  well above M34/T-box AND above all three M4→A4 path labels
```

---

## 3. User-facing inconsistency cluster (resolved by Patch DIAG-P3 alone)

The diagram has **exactly one user-visible inconsistency** in the source file — and it is resolved by Patch DIAG-P3 (the dev-comment side) without any change to the user-facing tooltip.

| Line | Form | User-facing? | Action |
|------|------|--------------|--------|
| 1185 | OLD: "additional unmoved originator at M2→M3" (dev comment) | No (developer-only) | **PATCH** via DIAG-P3 → "M3→A3" |
| 1193 | NEW: "additional unmoved originators of M₃→A₃" (tooltip body) | Yes (rendered in tooltip) | **NO CHANGE** — already correct |

After Patch DIAG-P3 lands, both lines use the NEW convention; the source-file paragraph becomes internally consistent and the user-visible tooltip continues to display the correct form.

---

## 4. ID-vs-display-label distinction (do NOT patch)

The HTML file uses an **internal ID scheme** that should be left untouched:

- `M01`, `M12`, `M23`, `M34` (motion JS object IDs) — these are *labels*, not numeric coordinates; they stay as-is.
- `A0`, `A1`, `A2`, `A3`, `A4` (actuality node IDs) — likewise stable.
- `<g id="settled-doxai">` (line 732), `kinetic-M23`, `T-box` references — stay as-is.

The `motionDisplayId()` function maps each internal ID to its NEW-convention display string. The patches in §2 above touch *only comment-strings and the one tooltip-co-located comment*, **never the internal IDs**.

---

## 5. Application order

The 9 patches can be applied in any order; they touch disjoint lines. A single `sed`-style scripted pass over the HTML file with the 9 OLD-strings → 9 NEW-strings substitutions is the recommended mechanism.

**Verification after patching**:
1. Re-grep the HTML file for `M2→M3` and `M3→M4` — should return only matches inside `motionDisplayId()` source code at line 1522 (the conversion definitions themselves) and any pre-existing matches that are **part of** the OLD-strings already patched.
2. Render the HTML in a browser and confirm SVG arrow labels still display correctly (no functional change expected).
3. Confirm the user-visible tooltip at line 1193 still renders the NEW form.

---

## 6. Diagram-element coverage gaps (NOT migration patches)

The Phase 2c audit identified 6 diagram elements that are never referenced by HTML sub-node ID in any prose section: A3-NOESIS (line 946), A3-MEMORY (line 985), A3-DISCURSIVE (line 1026), A3-SPECULATIVE (line 1057), A3-DELIBERATIVE (line 1094), DOXA band (line 1138), SETTLED-DOXAI (line 1186, flagged under-developed), EMO satellite (line 1452). These are **coverage gaps**, not numbering issues, and are tracked here for downstream consideration. They require no mechanical patch under the §M_n → A_n migration.

The diagram element that IS matched by prose reference is the **recursive-loop** (HTML group line 746), which is named explicitly at §1.5 line 29: "A_4 produces A_0', and the cycle resumes". No patch needed.

---

## 7. Hexeis/Settled-Doxai region (separate gap for Phase 3D/3E)

Per the diagram audit's `hexeis_underdevelopment_confirmation` block, the SETTLED-DOXAI region is structurally under-developed and the §1.4 prose's hexeis architecture is out of sync with the diagram. This is a **substantive architectural gap**, not a numbering migration issue, and belongs to Phase 3D (inconsistency detection) or Phase 3E (relocations) rather than this audit. No patch needed here.

---

## 8. Summary

- **Total HTML patches**: 9 mechanical comment-string substitutions.
- **User-visible impact at runtime**: zero (SVG arrows already use NEW form via `motionDisplayId()`; the tooltip at line 1193 is already correct).
- **Developer-facing impact**: source file becomes internally consistent, future authors no longer encounter mixed OLD/NEW references in code comments.
- **Estimated time**: **5 minutes** for a scripted regex pass.

---

**End of diagram renumbering patch.**
