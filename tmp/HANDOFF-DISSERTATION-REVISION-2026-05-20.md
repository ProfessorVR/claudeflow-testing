# Handoff — Dissertation Revision (Section-by-Section Collaboration)

**Generated**: 2026-05-20T16:00
**Reason**: Begin dissertation revision in a clean session, resuming from this session's TODO compilation + paused diagram work
**Preceded by**:
- Diagram Option B iteration v1 → v7 (paused at v7; complete)
- TODO compilation session (this session)

---

## TL;DR (read first)

Two work-streams stand ready to resume:

1. **Dissertation revision** (primary, this handoff's focus): 13-item TODO list of formatting + philosophical-research tasks, to be worked through **section-by-section in collaboration with user** — NO bulk execution. Source files moved to new canonical location with line-numbered `.tex` versions.

2. **Diagram work** (paused, separate): Option B iteration at v7 in `option-b-iterations/` folder, complete and ready for §1.0 inline propagation + figure[p] wrapper when user chooses. A6 + Q1 in the TODO list affect the diagram if/when resumed.

User's overall goal: walk through each chapter together, applying TODO items in context, making judgment calls jointly where philosophical research is required. Hand-edits have already been applied; bulk-running the TODO would force a full re-read.

---

## Canonical Source Files (NEW location)

All files in:
```
/home/dalton/projects/claudeflow-testing/tmp/Dissertation/Working tex versions/
```

| Section | Filename | Lines | Bytes |
|---|---|---:|---:|
| §1.0 | `1.0 - Introduction.tex` | 725 | 73,233 |
| §1.1 | `1.1 - A0 - Motion and Time as Ontological Horizon.tex` | 138 | 54,878 |
| §1.2 | `1.2 - M0 to A1 - The Actualization of Aisthesis.tex` | 147 | 62,134 |
| §1.3 | `1.3 - A3 - Completed Cognitive Actuality and the Three Orientational Modes.tex` | 173 | 93,285 |
| §1.4 | `1.4 - Emotion - The Form of Desire Under Evaluative Disclosure.tex` | 221 | 107,085 |
| §1.5 | `1.5 - A4 - Three Types of Action.tex` | 77 | 30,318 |
| **Total** | 6 files | **1,481** | **420,933** |

All standalone `\documentclass{article}` — each can be compiled individually.

**Ignore**: six `.tex:Zone.Identifier` files (25 bytes each) — NTFS metadata artifacts from WSL/Windows boundary.

**Note on file naming**: the chapter titles in the filenames reflect the working titles (e.g., §1.1 = "Motion and Time as Ontological Horizon"; §1.2 = "The Actualization of Aisthesis"; §1.4 = "Emotion — The Form of Desire Under Evaluative Disclosure"; §1.5 = "Three Types of Action"). These supersede prior shorter names.

---

## The TODO List (master document)

**Master TODO**: `tmp/Dissertation/DISSERTATION-CLEANUP-TODO.md`

**13 items, ordered by ease of completion**:

| # | Item | Effort | Notes |
|--:|---|---:|---|
| **1** | A2 — Em-dash spacing (no spaces around `---`) | 30-60 min | Pure sed; mechanical |
| **2** | A6 — Time bubble re-labeling Tₙ→Tₙ₊₁ | 30-60 min | Diagram tweak (touches paused v7) |
| **3** | A7 — Aristotle work titles (Latin/Greek standard) | 1-2 hr | Pattern + quotation guard |
| **4** | A1 — Greek accents (kinēsis, aisthēsis, etc.) | 2-3 hr | Pattern + disambiguation |
| **5** | A8 — Italicize coined "resonant X" compounds | 1-2 hr | 75 compound instances; depends on A1 |
| **6** | Q1 — Rethink all temporal bubble descriptors | 2-4 hr | Pairs with A6 |
| **7** | A3 — Italicize Greek-derived modifiers (phantastic, doxastic, etc.) | 3-4 hr | Context-sensitive |
| **8** | A4 — Multi-def format (parens vs. square brackets) | 3-5 hr | Two-pattern classification |
| **9** | Q4 — Hexis ≠ Doxa prose audit | 4-8 hr | Prerequisite for Q3 + A5 |
| **10** | Q3 — Path 1 (Deliberative bypass DOXA) interpretation | 2-4 hr | Blocked by Q4 |
| **11** | Q2 — A₄→Hexeis feedback character | 4-8 hr | Deepest independent investigation |
| **12** | Q5 — "trace" → "tone" terminology investigation | 5-10 hr | Uexküll/Heidegger research |
| **13** | A5 — Glossary with citational support | 10-16 hr | Capstone; depends on A1+A3+A4+A7+A8 (+Q4+Q5) |

**Total**: 42-74 hours across 12 items + capstone, naturally splitting across 7-10 work sessions.

---

## Workflow Rules (CRITICAL)

These are workflow rules user established this session:

### Rule 1 — Section-by-section collaboration; NO bulk execution
- User has hand-edited the documents; bulk-running the TODO would force a re-read of everything
- Each TODO item should be applied per-chapter with joint review, not via global find-replace across all files
- Discussion of edge cases happens BEFORE applying changes

### Rule 2 — Line numbers for reference
- The `.tex` versions in `Working tex versions/` have natural line numbers
- Reference specific changes by line number (e.g., "§1.2 L43 — change `phantasia` to italicize")
- This lets both parties verify changes against the same coordinate system

### Rule 3 — Q-items are joint research
- **Q1** (temporal bubbles) — research Aristotle's Phys. IV.11 + temporal modes literature jointly
- **Q2** (A₄→Hexeis feedback) — pull NE II.1, II.5, MA 701a32-33, NE VI.5, Met. A.1, NE VII.10 + Heidegger GA 18 §17, GA 19; decide reading together
- **Q3** (Path 1 doxa-bypass) — pull DA III.10, III.11, MA 701a7-25, DA III.3 + Heidegger GA 18 §15; decide interpretation (depends on Q4)
- **Q4** (Hexis ≠ Doxa) — pull Cat. 8b27ff, Met. Δ 20, NE II.5, NE II.1, MA 701a7-25 + Heidegger GA 18 §17; audit prose for conflations
- **Q5** (trace → tone) — pull Uexküll (Theoretical Biology, A Foray into Worlds) + Heidegger (BT §10 fn, GA 29/30 §§42-58); decide if change adopted; if yes, implement
- For each Q-item: pull texts together, discuss interpretation, then I implement the conclusion

### Rule 4 — Backups for major changes
- Pre-existing standing rule: create timestamped `.backups/` before multi-file edits
- For section-by-section work: create per-section backup before non-trivial in-place edits (e.g., before re-routing emotion-trace terminology if Q5 adopted)

### Rule 5 — Dependencies respected
- Some items must precede others (see dependency graph in master TODO):
  - A1 before A8 (canonical Greek forms before italicization)
  - Q4 before Q3 (Hexis/Doxa distinction must be settled before Path 1 interpretation finalized)
  - Q4 + Q5 before A5 (glossary needs settled hexis treatment + decided tone terminology)
  - A1+A3+A4+A7+A8 before A5 (all formatting unified before glossary compilation)

---

## Quick-Scan Scope (against new canonical files)

| Pattern | Bad / Total | Notes |
|---|---:|---|
| `kinesis` bare (needs `kinēsis`) | 5 | §1.0 (1), §1.3 (2), §1.4 (2) |
| `aisthesis` bare (needs `aisthēsis`) | 4 | §1.0 (2), §1.3 (2) |
| em-dash with spaces (` --- ` or `--- ` or ` ---`) | 84 / 158 | §1.1 + §1.2 are 100% bad |
| `trace` occurrences (Q5 scope) | 36 total | §1.2 alone has 20 |
| `resonant` (any context) | 47 total | 73 are coined compounds |
| `resonant epithymia` | 48 | most frequent coined compound |
| `resonant kinēsis` / `kinesis` | 11 + 3 | §1.2 + §1.3 + §1.4 + §1.0 |
| `resonant aisthēma` / `aisthema` | 6 + 1 | §1.0 + §1.2 + §1.3 + §1.4 |
| `resonant pathē` / `pathos` | 3 + 1 | §1.2 + §1.4 + §1.5 |

---

## Diagram Work — PAUSED at v7

**Status**: Diagram Option B iteration complete through v7. Resume when ready.

**Location**: `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/option-b-iterations/`

**Iteration trail preserved**:
- v0 baseline.pdf (original post-Option-A)
- v1.pdf (empty bubbles — bug)
- v2.pdf (empty bubbles fixed via background layer)
- v3.pdf (spacing + Q1 T23 "multi-modal duration" + Q4 Hexeis rename + DISC fix)
- v3_drawn update.pdf (user's annotated drawing for diachronic re-route)
- v4.pdf (diachronic arrow re-routed far-left per user drawing)
- v5.pdf (within-episode FB re-sourced from EMO-INLINE; A3 label "A₃: Cognitive actualities")
- v6.pdf (bypass arrow A₂→M34 + removed right-column detail boxes + spacing increased)
- v7.pdf (A3-frame layer bug fixed — moved off background to main with fill=none)

**Deferred work for diagram** (will return after dissertation revision):
- §1.0 inline TikZ propagation from v7 reference
- `\begin{figure}[p]` wrapper for §1.0
- §1.0 prose cross-reference `Figure~\ref{fig:actualization-chain}`
- Q1 temporal bubble redesign (connects to A6 in TODO)
- A6 Tₙ→Tₙ₊₁ relabeling in diagram

**Diagram-relevant TODO items**: A6 + Q1. Other items (A1-A5, A7-A8, Q2-Q5) affect only the prose.

**Diagram design rationale**: `option-b-iterations/_notes/v1-design-rationale.md` + `v3-followup-notes.md` (Q1-Q4 investigations)

---

## How to Resume in a Clean Session

### Step 1 — Verify state

Run these commands to confirm the canonical files exist and have the expected sizes:

```bash
cd "/home/dalton/projects/claudeflow-testing/tmp/Dissertation/Working tex versions"
for f in *.tex; do
  lines=$(wc -l < "$f")
  bytes=$(wc -c < "$f")
  printf "%-70s %5sL %8sb\n" "$(echo "$f" | cut -c1-70)" "$lines" "$bytes"
done
```

Expected output:
```
1.0 - Introduction.tex                                                   725L    73233b
1.1 - A0 - Motion and Time as Ontological Horizon.tex                    138L    54878b
1.2 - M0 to A1 - The Actualization of Aisthesis.tex                      147L    62134b
1.3 - A3 - Completed Cognitive Actuality and the Three Orientation       173L    93285b
1.4 - Emotion - The Form of Desire Under Evaluative Disclosure.tex       221L   107085b
1.5 - A4 - Three Types of Action.tex                                      77L    30318b
```

### Step 2 — Read this handoff + TODO

```bash
cat tmp/HANDOFF-DISSERTATION-REVISION-2026-05-20.md   # this file
cat tmp/Dissertation/DISSERTATION-CLEANUP-TODO.md     # master TODO
```

### Step 3 — Read deferred-research notes (for Q-items context)

```bash
cat "tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/option-b-iterations/_notes/v3-followup-notes.md"
```

### Step 4 — Pick first work item

The natural starting point is the section the user wants to begin with (likely §1.0 since it introduces the framework). Possible first conversation:

> "Let's start with §1.0. Walk me through it section by section and we'll apply TODO items as we go."

OR work item-by-item across sections:

> "Let's do A2 (em-dash spacing) first — show me each instance in §1.0 and we'll decide together."

OR begin with a Q-item:

> "Let's tackle Q4 first since it unblocks Q3 and A5. Pull the relevant Aristotle + Heidegger texts."

### Step 5 — Reference syntax

When discussing specific changes, use the line-number reference convention:

> "§1.2 L43 — change `phantasia` to italicize (Pattern 1 since it's in-text)"
> "§1.4 L107-110 — the em-dash on L108 needs spaces removed"
> "§1.0 L290-295 — this passage might need the Q4 hexis-doxa clarification"

---

## Task List (TaskCreate entries)

13 pending tasks already created (#17-#29):

| ID | Subject |
|---:|---|
| 17 | A1: Greek accents (kinēsis, aisthēsis, etc.) |
| 18 | A2: Em-dash spacing (no spaces around `---`) |
| 19 | A3: Italicize Greek-derived modifiers |
| 20 | A4: Multi-definition format (unified bracket notation) |
| 21 | A5: Build glossary with citational support |
| 22 | A6: Time bubble re-labeling (Tₙ→Tₙ₊₁) |
| 23 | A7: Aristotle work titles (Latin/Greek standardized form) |
| 24 | Q1: Rethink all temporal bubble descriptors |
| 25 | Q2: A₄→Hexeis feedback character investigation |
| 26 | Q3: Path 1 (Deliberative bypass DOXA) interpretation |
| 27 | Q4: Hexis ≠ Doxa dissertation prose audit |
| 28 | Q5: "trace" → "tone" terminology investigation |
| 29 | A8: Italicize coined "resonant X" compound terms |

Plus 2 pending diagram-related tasks (paused):
| ID | Subject |
|---:|---|
| 6 | Apply Option B to §1.0 COPY + figure[p] wrapper (v1) — will inherit v7 |
| 9 | Document Option B in synthesis audit + update memory |

Use `TaskUpdate` to mark items in_progress when starting, completed when done.

---

## Memory References (auto-loaded)

These are stored in `~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/`:

- `MEMORY.md` — top-level index (entry pointing here at top)
- `project-dissertation-cleanup-todo.md` — full project notes with master TODO pointer
- `feedback-major-iterations-on-copies.md` — workflow rule for iterations (applies to diagram, not text prose)
- `feedback-backup-before-changes.md` — workflow rule for backups
- `project-dissertation-analysis-pipeline.md` — prior pipeline execution context

---

## What's NOT Done (Explicit Non-Goals for Resumption)

- ❌ DO NOT bulk-run any TODO item across multiple files without per-section discussion
- ❌ DO NOT make philosophical/interpretive decisions on Q-items unilaterally — pull texts together first
- ❌ DO NOT resume diagram v8+ before completing dissertation revision (user's stated priority)
- ❌ DO NOT modify the §§1.0-1.5 hand-edits without confirming with user first
- ❌ DO NOT create §1.0 figure[p] propagation until dissertation revision is done (avoid double-touching §1.0)

---

## Files Touched in This Handoff Session

For audit:
- Created: `tmp/HANDOFF-DISSERTATION-REVISION-2026-05-20.md` (this file)
- Created: `tmp/Dissertation/DISSERTATION-CLEANUP-TODO.md` (master TODO)
- Created: `~/.claude/projects/.../memory/project-dissertation-cleanup-todo.md` (memory pointer)
- Created: `~/.claude/projects/.../memory/feedback-major-iterations-on-copies.md` (workflow rule)
- Updated: `~/.claude/projects/.../memory/MEMORY.md` (added top-of-index entry)
- Created: 13 TaskCreate entries (#17-#29)
- Diagram iterations folder: read-only (paused at v7)

**Dissertation source files in `Working tex versions/`: UNTOUCHED this session.** All formatting/research work begins fresh in the next session per the section-by-section workflow.

---

## Open Questions for User (to Answer in First Message of Next Session)

1. **Starting point**: Section-by-section starting from §1.0, OR item-by-item starting with A2 (easiest mechanical), OR Q4 first (since it unblocks Q3 + A5)?
2. **Q-item research format**: Pull all Aristotle/Heidegger texts at once for an investigation block, or pull texts as each Q-item arises in section reading?
3. **Backup convention for section work**: Create `Working tex versions/.backups/<timestamp>-pre-X/` before each non-trivial section edit? Or rely on git for change tracking?
4. **Compile-as-we-go**: Compile each `.tex` after major changes to verify LaTeX still renders, or batch-compile periodically?

---

**End of handoff. Safe to start a clean session.**
