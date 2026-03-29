# ICP Dashboard V2 — Final Implementation Plan

**Date**: 2026-03-29
**Status**: Approved for implementation
**Prerequisite**: Phase 8 audit complete (`writing-pipeline-v2` branch)

---

## Architecture

Single backend pipeline (ICPOrchestrator) with three UX depth presets.

```
┌──────────────┐     ┌──────────────┐     ┌─────────┐     ┌────────┐
│    Prompt     │ ──▶ │   Evidence   │ ──▶ │ Quality │ ──▶ │ Export │
│ + Depth Mode  │     │   + Review   │     │ + Gates │     │        │
└──────────────┘     └──────────────┘     └─────────┘     └────────┘
```

### Depth Modes

| Mode | "Run" button does | Evidence panel | Next trigger |
|------|------------------|----------------|-------------|
| **Express** | POST /session → auto-verify ≥0.85, reject <0.85 → POST /adapter/generate (from-evidence) → land on Export | Skipped | N/A |
| **Standard** | POST /session (stages 1-4) → land on Evidence | Shown, bulk actions | "Proceed to Quality" calls POST /adapter/generate (from-evidence) |
| **Full** | POST /session (stages 1-4) → land on Evidence | Shown, bulk actions, Advanced drawer open | "Proceed to Quality" calls POST /adapter/generate (from-evidence) |

### Backend Route: `POST /adapter/generate/:sessionId`

Accepts `{ mode: 'full' | 'from-evidence' }`:
- `mode: 'full'` → calls `orchestrator.run()` (re-does all 11 stages). Used by Express when no prior session exists.
- `mode: 'from-evidence'` → generates from session's existing verified evidence using gold-standard prompt + quality gates. Used by Standard/Full after user reviews evidence.

### Express Mode Safety

- Auto-verifies quotes with `auto_confidence >= 0.85`
- Auto-rejects quotes with `auto_confidence < 0.85` (not "flagged" — rejected outright)
- If zero quotes survive: abort with error "Insufficient evidence — switch to Standard mode"
- No generation from uncertain evidence. Zero hallucination risk.

### Pipeline Progress Bar (4 macro-phases)

```
  Prepare           →      Review        →      Validate       →      Export
  (stages 1-4)           (evidence            (generation +         (results)
                          review)              quality gates)

    ✓                       ●                     ○                    ○
```

### Export Panel Actions

- Copy to Clipboard / Download .md
- **Modify & Regenerate** → returns to Evidence (Standard/Full) or Prompt (Express), session preserved, progress bar resets Validate+Export to pending
- **Start Over** → new session (confirm dialog)

### Advanced Drawer (Full mode: open by default; Standard: collapsed)

Tabs: Binding | Stress Test | Planner | Heatmap | Corpus Diff
Read-only diagnostic views.

### Provenance Viewer (cross-cutting)

Reusable modal using existing server-side PDF rendering:
- Left: PDF page from `GET /api/icp/pdf-page/:docId/:page` (PNG, 300 DPI)
- Right: Quote context card (text, metadata, confidence, status, actions)
- Triggered by clicking any quote text in Evidence, Quality, or Export panels
- Keyboard: Esc close, ←/→ prev/next quote from same source, V verify, R reject (Evidence only)

### Quality Gate Override

Users can force-proceed past failing gates. Confirm dialog lists failing gate names. Override logged to `session.event_log`.

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `observability/dashboard/icp-panel-v2.js` | CREATE | V2 dashboard frontend |
| `observability/icp-api-routes.ts` | MODIFY | Add from-evidence generation mode |
| `observability/dashboard/styles.css` | MODIFY | Add V2-specific CSS |
| `observability/dashboard/index.html` | MODIFY | Add V2 tab toggle |
| `observability/dashboard/app.js` | MODIFY | Wire V2 panel loading |
