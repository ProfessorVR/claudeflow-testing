# Dashboard ↔ Writing System Alignment Plan

**Date:** 2026-03-07
**Status:** Approved — awaiting execution
**Parent:** `plans/writing-system-refactoring-plan.md` (completed Phases 1–5)
**Scope:** Sync dashboard God Write tab with v2 pipeline changes

---

## Executive Summary

The v2 pipeline refactoring added significant new capabilities (DomainConfig, GoldStandardConfig, pipeline versioning, multi-step drafting, prompt-builder-engine) but the dashboard's God Write tab still speaks the legacy dialect. There are three distinct integration points that need updating:

1. **`express-server.ts:buildGodWriteCliArgs()`** — maps dashboard flags → CLI args (server-side)
2. **`app.js` God Write tab** — UI controls, flag collection, presets (client-side)
3. **`prompt-builder-engine.ts`** — structured prompt generator (currently standalone, not wired into dashboard)

---

## Detailed Analysis

### A. Dashboard Server (`express-server.ts` lines 3184–3233)

**What it does:** `buildGodWriteCliArgs()` translates the `flags` object from the frontend into CLI arguments passed to `npx tsx cli.ts write`.

**Gaps relative to CLI:**

| CLI Flag | Dashboard Sends? | Notes |
|----------|-----------------|-------|
| `--whitelist` / `-w` | **NO** | Gold-standard mode; most important for dissertation writing |
| `--pipeline-version v2` | **NO** | v2 staged pipeline (new) |
| `--multi-step` | **NO** | Multi-step drafting (v1→investigate→v2) |
| `--nli-verify` | **NO** | NLI verification |
| `--candidate-selection` | **NO** | Candidate selection mode |
| `--corpus-min-relevance` | YES | Hardcoded default 0.75 in UI; CLI default is 0.35 |
| `--force-execute` | **NO** | Testing bypass |
| `--max-quotations-per-endnote` | **NO** | Endnote granularity |
| `--min-endnote-relevance` | **NO** | Endnote filtering |
| `--style-profile` | YES | Already wired |
| `--data-source-mode` | YES | Already wired |

**Current bugs/mismatches:**

1. **Corpus relevance default mismatch**: UI defaults to `0.75`, but CLI gold-standard uses `0.35`. At 0.75, most chunks are filtered out → poor corpus coverage.
2. **Missing `--execute` flag logic**: The server always passes `--execute --json`, which is correct, but `--whitelist` mode is completely absent — the single most impactful flag for academic writing.
3. **Chunk count default**: UI says 15, whitelist mode uses 28. No way to toggle this from dashboard.

### B. Dashboard Frontend (`app.js` lines 660–1380)

**What it does:** Renders the God Write configuration panel, collects flags via `getGodWriteFlags()`, manages presets.

**Missing UI controls:**

| Feature | Status | Priority |
|---------|--------|----------|
| Whitelist mode toggle | Missing | **Critical** |
| Pipeline version selector (legacy/v2) | Missing | **High** |
| Multi-step drafting toggle | Missing | **High** |
| NLI verify toggle | Missing | Low (Advanced drawer) |
| Candidate selection toggle | Missing | Low (Advanced drawer) |
| Endnote detail controls | Missing | Low (Advanced drawer) |

**Preset issues:**

- `dissertation-chapter` preset uses `corpus-chunks: 20, corpus-relevance: 0.75` — should use whitelist mode with 28 chunks at 0.35 relevance
- `research-synthesis` uses `corpus-relevance: 0.70` — still too high
- No preset uses `--whitelist`, `--multi-step`, or `--pipeline-version v2`
- No preset matches the gold-standard CLI invocation that actually works well

### C. Prompt Builder Engine (`prompt-builder-engine.ts`)

**What it does:** Generates structured academic prompts with configurable strictness, sections, and source specifications. Currently only invoked by `scripts/build-prompt.ts` CLI.

**Integration gap:** The dashboard spawns `cli.ts write` with a raw prompt string. It never calls `buildPrompt()` to structure the prompt before sending it.

**Current prompt builder limitations:**

- Uses `sourcingRules[strictness.quotation]` for rule 1 (should use a dedicated `sourcing` dimension per Issue #21)
- `wordCount` is never injected into the prompt text itself (Required Structure section doesn't mention target length)
- No awareness of DomainConfig (could auto-populate sourcing rules from primary/secondary authors)
- No awareness of whitelist mode

---

## Update Plan

### Phase 1 + 2: Wire Flags + Update Presets (Single Session)

**Goal:** Make the dashboard capable of reproducing the gold-standard CLI invocation in one click.

#### Step 1.1: Add flags to `buildGodWriteCliArgs()` (server-side)

File: `src/god-agent/observability/express-server.ts`

Add to `buildGodWriteCliArgs()`:
```typescript
// Whitelist mode (gold-standard corpus constraint)
if (flags.whitelistMode)     args.push('--whitelist');

// Pipeline version
if (flags.pipelineVersion === 'v2') args.push('--pipeline-version', 'v2');

// Multi-step drafting
if (flags.multiStep)          args.push('--multi-step');

// Advanced flags (from Advanced drawer)
if (flags.nliVerify)          args.push('--nli-verify');
if (flags.candidateSelection) args.push('--candidate-selection');

// Endnote detail (mapped from dropdown preset)
if (flags.maxQuotationsPerEndnote) args.push('--max-quotations-per-endnote', String(flags.maxQuotationsPerEndnote));
if (flags.minEndnoteRelevance)     args.push('--min-endnote-relevance', String(flags.minEndnoteRelevance));
```

#### Step 1.2: Add UI controls (client-side)

**Three core toggles** (always visible in config panel):

1. **Whitelist Mode** — checkbox with tooltip: "Uses corpus manifest as source whitelist. Recommended for academic writing. Auto-sets 28 chunks at 0.35 min relevance."
2. **v2 Pipeline** — checkbox (or simple toggle): "Use v2 staged pipeline"
3. **Multi-Step Drafting** — checkbox with tooltip: "v1 draft → investigate issues → prevention plan → v2 revision"

**Whitelist auto-adjust behavior:**
- When whitelist is toggled ON: auto-set `corpus-chunks` to 28, `corpus-relevance` to 0.35, enable `use-corpus`
- When whitelist is toggled OFF: revert to previous values (or defaults: 15 chunks, 0.75 relevance)

**Advanced drawer** (collapsed by default, toggle via "Advanced..." link):

- NLI Verify toggle
- Candidate Selection toggle
- Endnote Detail dropdown: `minimal` (1 quote, 0.80 relevance) / `standard` (3 quotes, 0.65 relevance) / `detailed` (5 quotes, 0.50 relevance)
  - Maps internally to `maxQuotationsPerEndnote` and `minEndnoteRelevance`

**Extend `getGodWriteFlags()`:**
```javascript
whitelistMode: checked('flag-whitelist-mode'),
pipelineVersion: val('flag-pipeline-version') || 'legacy',
multiStep: checked('flag-multi-step'),
nliVerify: checked('flag-nli-verify'),
candidateSelection: checked('flag-candidate-selection'),
// Endnote detail mapped from dropdown
...this.getEndnoteDetailFlags(),
```

**Extend `setGodWriteFlags()`** with matching setters.

#### Step 1.3: Fix defaults

- `corpus-relevance` default: `0.75` → `0.35` (match CLI gold-standard)
- `corpus-chunks`: dynamically set to 28 when whitelist is on, 15 otherwise
- `flag-pipeline-version` default: `legacy` (safe default until v2 is validated from dashboard)

#### Step 2.1: Replace presets

```javascript
static GOD_WRITE_PRESETS = {
  'gold-standard': {
    name: 'Gold Standard (Dissertation)',
    description: 'Full pipeline: whitelist, multi-step drafting, inline validation, v2 pipeline',
    flags: {
      style: 'academic', format: 'section', length: 'comprehensive',
      'whitelist-mode': true, 'corpus-chunks': 28, 'corpus-relevance': 0.35,
      'use-corpus': true, 'verify-sources': true,
      'use-inline-validation': true, 'inline-validation-strictness': 'moderate',
      'inline-max-retries': 3, 'inline-enable-citation-lookup': true,
      'citation-enforcement-mode': 'auto-correct', 'citation-min-pass-rate': 0.85,
      'citation-max-hallucinations': 3, 'enable-endnotes': true,
      'multi-step': true, 'pipeline-version': 'v2',
      'use-staged-composition': false,
    }
  },
  'dissertation-chapter': {
    name: 'Dissertation Chapter',
    description: 'Staged composition with whitelist and multi-step drafting',
    flags: {
      style: 'academic', format: 'section', length: 'comprehensive',
      'whitelist-mode': true, 'corpus-chunks': 28, 'corpus-relevance': 0.35,
      'use-corpus': true, 'verify-sources': true,
      'use-inline-validation': true, 'inline-validation-strictness': 'moderate',
      'inline-max-retries': 3, 'inline-enable-citation-lookup': true,
      'citation-enforcement-mode': 'auto-correct', 'citation-min-pass-rate': 0.85,
      'citation-max-hallucinations': 3, 'enable-endnotes': true,
      'multi-step': true, 'pipeline-version': 'v2',
      'use-staged-composition': true,
    }
  },
  'quick-draft': {
    name: 'Quick Draft',
    description: 'Fast generation without corpus or validation - good for brainstorming',
    flags: {
      style: 'casual', format: 'essay', length: 'short',
      'whitelist-mode': false, 'use-corpus': false,
      'corpus-chunks': 15, 'corpus-relevance': 0.75,
      'verify-sources': false, 'acquire-missing': false,
      'use-inline-validation': false, 'inline-validation-strictness': 'lenient',
      'inline-max-retries': 1, 'inline-enable-citation-lookup': false,
      'citation-enforcement-mode': 'warn', 'citation-min-pass-rate': 0.5,
      'citation-max-hallucinations': 10, 'enable-endnotes': false,
      'multi-step': false, 'pipeline-version': 'legacy',
      'use-staged-composition': false,
    }
  },
  'technical-report': {
    name: 'Technical Report',
    description: 'Technical writing with source verification and citation enforcement',
    flags: {
      style: 'technical', format: 'report', length: 'long',
      'whitelist-mode': false, 'use-corpus': true,
      'corpus-chunks': 15, 'corpus-relevance': 0.50,
      'verify-sources': true, 'acquire-missing': true,
      'use-inline-validation': false, 'inline-validation-strictness': 'moderate',
      'inline-max-retries': 3, 'inline-enable-citation-lookup': true,
      'citation-enforcement-mode': 'auto-correct', 'citation-min-pass-rate': 0.80,
      'citation-max-hallucinations': 5, 'enable-endnotes': false,
      'multi-step': false, 'pipeline-version': 'legacy',
      'use-staged-composition': false,
    }
  },
  'research-synthesis': {
    name: 'Research Synthesis',
    description: 'Maximum quality: multi-step, strict citation enforcement, v2 pipeline',
    flags: {
      style: 'academic', format: 'paper', length: 'comprehensive',
      'whitelist-mode': true, 'corpus-chunks': 28, 'corpus-relevance': 0.35,
      'use-corpus': true, 'verify-sources': true,
      'use-inline-validation': true, 'inline-validation-strictness': 'strict',
      'inline-max-retries': 5, 'inline-enable-citation-lookup': true,
      'citation-enforcement-mode': 'strict', 'citation-min-pass-rate': 0.95,
      'citation-max-hallucinations': 0, 'enable-endnotes': true,
      'multi-step': true, 'pipeline-version': 'v2',
      'use-staged-composition': false,
    }
  }
};
```

#### Step 2.2: Add instrumented soak tracking to history DB

Add two columns to `god_write_history` table:
```sql
ALTER TABLE god_write_history ADD COLUMN needed_resteering BOOLEAN DEFAULT 0;
ALTER TABLE god_write_history ADD COLUMN resteering_notes TEXT;
```

Add to the output panel UI:
- Checkbox: "Needed manual re-steering?" (saves to job history)
- Small text field: "What constraint was missing?" (appears when checkbox is checked)
- Both persist via `PATCH /api/god-write/history/:jobId/feedback`

New API endpoint:
```typescript
router.patch('/history/:jobId/feedback', (req, res) => {
  const { jobId } = req.params;
  const { neededResteering, resteeringNotes } = req.body;
  db.prepare('UPDATE god_write_history SET needed_resteering = ?, resteering_notes = ? WHERE job_id = ?')
    .run(neededResteering ? 1 : 0, resteeringNotes || null, jobId);
  res.json({ ok: true });
});
```

This instruments the soak period so the Phase 3 decision is data-driven.

---

### Instrumented Soak Period (5–10 runs)

After Phase 1+2 ships:

1. Run 5–10 real dissertation-quality generations from the dashboard using Gold Standard preset
2. After each run, mark "Needed manual re-steering?" and note the specific constraint missing
3. Track patterns:
   - If pain is "under-quotes overall" → fix with stricter presets or pipeline prompt tweaks
   - If pain is "I need section-specific constraints" → build Phase 3 minimal structured mode
   - If no consistent pain → Phase 3 is low priority

---

### Phase 4 Lite: Pipeline Health + Multi-Step Timeline

**Can run in parallel with soak period.**

#### Step 4.1: Pipeline health badge

At the top of job output, display:
- Small badge: `Pipeline health: clean / degraded / failed`
- Color-coded: green / yellow / red
- Tooltip with one-line explanation for degraded/failed

In `express-server.ts runGodWriteJob()`, propagate:
```typescript
metadata: {
  pipelineHealth: result.pipelineHealth ?? 'unknown',
  multiStepDiagnostics: result.multiStepDiagnostics ?? null,
}
```

#### Step 4.2: Compact multi-step timeline

Single "Show diagnostics" drawer in the output panel. When expanded, shows:

**Timeline view:**
```
Step 1: v1 Draft     → 4,043 words | 24 citations | 9 critical issues
Step 2: Investigation → 7 under-cited sources | 5 prevention constraints
Step 3: v2 Revision   → 4,902 words | 29 sources | quality +0.12
```

**Condensed warnings:** Top 3 most important warnings/hard failures, with "show all (N)" link.

This avoids log-viewer syndrome while giving full debugging access when needed.

---

### Phase 3 (If Needed): Minimal Structured Prompt Mode

**Only build if soak data shows recurring need for section-specific constraints.**

Minimal scope:
- Draft Category dropdown (section / chapter / paper)
- Strictness preset (strict / moderate / permissive)
- Word Count target
- "Use domain's primary sources" toggle (pulls from DomainConfig server-side, no UI list editing)
- Auto-generated sections based on category (hidden by default; "Edit sections..." opens simple editor)
- Preview button showing assembled prompt

Do NOT build in first cut:
- Primary/secondary source list editors
- Full sections editor with drag-and-drop reorder
- Per-section quotation minimum controls (add only if soak data specifically requests this)

Server-side:
- `POST /api/god-write/build-prompt` → calls `buildPrompt()` from prompt-builder-engine
- `GET /api/god-write/domain-config` → returns `loadDomainConfig()` for toggle behavior

Fix in `prompt-builder-engine.ts`:
- Inject `wordCount` into Required Structure section text
- DomainConfig influence: auto-populate sourcing rules from primary/secondary authors when "Use domain's primary sources" is active

---

## File Change Matrix

| File | Phase | Changes |
|------|-------|---------|
| `src/god-agent/observability/express-server.ts` | 1+2, 4 | `buildGodWriteCliArgs()` + feedback endpoint + health propagation |
| `src/god-agent/observability/dashboard/app.js` | 1+2, 4 | Flags + presets + Advanced drawer + health badge + timeline + soak UI |
| `src/god-agent/observability/dashboard/index.html` | 1+2, 4 | Toggle controls, Advanced drawer, health badges, feedback checkbox |
| `src/god-agent/observability/dashboard/styles.css` | 1+2, 4 | Styles for new controls, drawer, badges |
| `src/god-agent/core/composition/prompt-builder-engine.ts` | 3 (if needed) | Word count injection, DomainConfig influence |
| `src/god-agent/universal/domain-config.ts` | 3 (if needed) | No changes needed (already exports all needed functions) |

---

## Risk and Rollback

- All changes are additive — no existing behavior is modified, only extended
- New presets coexist with saved custom presets in localStorage
- v2 pipeline flags are optional; omitting them routes through legacy path
- Advanced drawer is collapsed by default; power users can expand
- Soak instrumentation is non-invasive (two optional DB columns + small UI elements)
- Phase 3 is gated on soak data, not assumed necessary

---

## Execution Order

1. **Phase 1 + 2** (single session): Three core flags, Advanced drawer, updated presets, soak instrumentation
2. **Soak period** (5–10 runs): Instrumented with "needed re-steering?" tracking per job
3. **Phase 4 lite** (parallel with soak): Health badge + compact multi-step timeline
4. **Phase 3** (if soak data warrants): Minimal structured mode, scoped by observed section-level pain

---

## Execution Log

_Update this section as changes are implemented._

| Date | Phase | Action Taken | Result |
|------|-------|-------------|--------|
| | | | |
