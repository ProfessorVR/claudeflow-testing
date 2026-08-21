# Handoff — End of Day, Dissertation Revision Setup

**Generated**: 2026-05-20T~20:00 (end of evening session)
**Reason**: User going to bed, PC powering off. Capture full setup state for clean resumption.
**Supersedes**: `tmp/HANDOFF-DISSERTATION-REVISION-2026-05-20.md` (the morning handoff — still valid for deeper context; this doc adds the evening session's setup decisions).

---

## TL;DR (read first in next session)

This evening's session established the full operating infrastructure for the dissertation revision project but did **not** apply any actual revisions yet. The §1.0 walkthrough is ready to begin on the user's next signal. All workflow decisions, backups, task lists, and verification capabilities are in place.

**Critical state**: §1.0 backup `.backups/2026-05-20T1933-pre-§1.0/` created. **17 tasks** in queue (#1–#17). **0 tasks started**. **0 file edits made** to dissertation source.

**To resume**: just have user signal "your turn" with a paragraph line range on §1.0, and execute the per-paragraph protocol.

---

## What This Session Accomplished

### 1. Workflow protocol settled (per-paragraph collaboration)

10-step user-first per-paragraph protocol locked in:
1. User edits paragraph in VS Code, saves (Ctrl+S)
2. User signals "your turn" in chat + any notes/questions (NOT in `\inlinenote{}` — chat only)
3. Assistant targeted-Read of paragraph (~500–1000 tokens)
4. Assistant presents TODO findings in compact format (line, current, proposed, TODO-tag, reason)
5. User approves / rejects / modifies each
6. Assistant responds to user's notes/questions (research, proposed edit, counterpoint)
7. User decides
8. Assistant implements via Edit tool (auto-saves)
9. Assistant confirms "done — reload in VS Code"
10. User accepts VS Code Revert prompt, moves to next paragraph

Stored as: `~/.claude/projects/.../memory/feedback-per-paragraph-revision-protocol.md`

### 2. Coordination cadences decided

| Setting | Decision | Notes |
|---|---|---|
| **Backup** | Once per section | `tmp/Dissertation/Working tex versions/.backups/<timestamp>-pre-§<n>/` |
| **Compile** | Only after LaTeX-syntax-affecting changes | Skip for safe text-only edits (em-dash spacing, Unicode swaps, work-title text) |
| **Signal format** | Line range + anchor fallback | E.g., "§1.0 L49–65"; if line drifts, fall back to grep-by-anchor |
| **Q-item research** | Block-load texts per Q-item | Pull all relevant Aristotle + Heidegger passages at once when Q-item surfaces |

### 3. Canonical-form decisions

| Decision | Value | Reason |
|---|---|---|
| **A1 Greek macron form** | Unicode (`kinēsis`, `aisthēsis`, `boulēsis`) | XeLaTeX + fontspec stack already used; cleaner in source. Convert existing `\=e` instances to Unicode. NOT `\gk{}` Greek script form. |
| **DA translator** | J. A. Smith, revised for Barnes ROT 1984 | Confirmed via PDF title page read; Greek source W. D. Ross OCT Oxford 1956 |
| **Bib year flag** | `DAaristotle2014` key year ≠ PDF source year 1984 | "(2014)" in filename = acquisition year, NOT publication year. Flag when first non-trivial bib question arises. |

### 4. Backup created

```
tmp/Dissertation/Working tex versions/.backups/2026-05-20T1933-pre-§1.0/
└── 1.0 - Introduction.tex  (73,233 bytes — identical snapshot pre-revision)
```

### 5. Task list expanded to 17 items (from original 13)

**4 new items added this session**:
- **E1** (#14): *Phantasia* untranslated convention — introduce in §1.0 footnote as option
- **C1** (#15): Source augmentation — Heidegger / Rhetoric / Gross / secondary scholarship (primarily §§1.3-1.5)
- **C2** (#16): Citation migration to biblatex authoryear `\autocite[locus]{key}` (user updated `references.bib` for all 9 Aristotle keys this session)
- **V1** (#17): Direct-quote PDF verification — CAPSTONE final pass over entire document

All 17 tasks in TaskList (none started). Dependencies noted in descriptions; not enforced via `blockedBy` (user can re-order if desired).

### 6. Quote verification capability validated (demo)

Demo run on §1.0 L51 quotes against `corpus/rhetorical_ontology/Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf`:

- ✓ **Fragment A** (`"is that in virtue of which an image arises for us"`): VERBATIM at 428a1
- ⚠️ **Fragment B** (`"in virtue of which we discriminate and are either in error or not"`): word-for-word match BUT terminal `?` in PDF source omitted by dissertation. User must decide: (a) keep as-is, (b) add `?` inside quote, (c) `[?]` editorial mark, (d) ellipsis. **PENDING USER DECISION when §1.0 L51 walked.**
- ✓ **Locus**: `428a1-3` correctly in DA III.3
- ⚠️ **Bib year mismatch** flagged (see above)

**V1 task documents the workflow** for full-doc final-pass verification.

### 7. Memory updates

| File | Action |
|---|---|
| `MEMORY.md` | Top entry updated: "ACTIVE §1.0" status, 17 tasks, decisions, DA translator |
| `project-dissertation-cleanup-todo.md` | Rewritten with full TODO table (17 items), workflow protocol, decisions, V1 protocol, demo findings |
| `feedback-per-paragraph-revision-protocol.md` | NEW — captures the 10-step per-paragraph collaboration pattern |

---

## Current State

### Source files (UNTOUCHED this session)
```
tmp/Dissertation/Working tex versions/
├── 1.0 - Introduction.tex                                                   (725L, 73KB)
├── 1.1 - A0 - Motion and Time as Ontological Horizon.tex                    (138L, 55KB)
├── 1.2 - M0 to A1 - The Actualization of Aisthesis.tex                      (147L, 62KB)
├── 1.3 - A3 - Completed Cognitive Actuality and the Three Orientational…    (173L, 93KB)
├── 1.4 - Emotion - The Form of Desire Under Evaluative Disclosure.tex       (221L, 107KB)
├── 1.5 - A4 - Three Types of Action.tex                                     (77L, 30KB)
├── references.bib                                                           (user updated this evening: all 9 Aristotle keys now valid)
└── .backups/2026-05-20T1933-pre-§1.0/
    └── 1.0 - Introduction.tex                                               (snapshot)
```

### §1.0 walkthrough chunking (proposed, not yet executed)
| Chunk | Lines | Section | Likely TODO hits |
|--:|---|---|---|
| 1 | L47 | Opening `\inlinenote` (animal motion as desire-actualization) | A1, A7, A8, C2 (footnote citations) |
| 2 | L49–65 | §RP definitions — phantasia mediation, T₁–T₄ events | A1 heavy, A2, A7, A8, C2, **E1 (phantasia convention introduction point)** |
| 3 | L67–76 | §RP continued — diakrisis, continuous unfolding, Papachristou | A1, A2 (multiple em-dashes L70), A3, C2 |
| 4 | L78–82 | §RP thesis — motion-and-time principle | A1, A2 |
| 5 | L83–92 | §Methodology — anti-internalist framing, A₀–A₄ chain | A1, A2, A7 (many titles), A8, C2 |
| 6 | L93–104 | §Kinetic Schema setup — three-factor, scale invariance | A1 dense, A2, A3, A4, A7, A8, C2 |
| 7 | L106–108 | §Kinetic Schema interlock — iterated chain | A1, A2, A4 (multi-defs heavy), A8 |
| 8 | L110–112 | §Kinetic Schema Burke + roadmap | A1, A2, A3, A4, A7, A8, C2 |
| — | L114 + L118–720 | Diagram inline note + TikZ body | A6 + Q1 only — **deferred** (paused at v7) |

### Task list (17 items, all pending)

```
#1  A2: Em-dash spacing — no spaces around `---`
#2  A6: Time bubble re-labeling Tₙ→Tₙ₊₁ in diagram
#3  A7: Aristotle work titles — standardize Latin/Greek forms
#4  A1: Greek accents — canonicalize kinēsis, aisthēsis, etc.
#5  A8: Italicize coined "resonant X" compounds
#6  Q1: Rethink temporal bubble descriptors
#7  A3: Italicize Greek-derived modifiers
#8  A4: Multi-definition format — unified bracket notation
#9  Q4: Hexis ≠ Doxa prose audit
#10 Q3: Path 1 (Deliberative bypass DOXA) interpretation
#11 Q2: A₄→Hexeis feedback character investigation
#12 Q5: "trace" → "tone" terminology investigation
#13 A5: Glossary with citational support (capstone)
#14 E1: Phantasia untranslated convention — §1.0 footnote (option)
#15 C1: Source augmentation — Heidegger/Rhetoric/Gross/secondary (primarily §§1.3-1.5)
#16 C2: Citation migration to biblatex authoryear (\autocite)
#17 V1: Direct-quote PDF verification (CAPSTONE — entire document, final pass)
```

---

## What's Remaining

**Total estimated**: 60–110 hr across 10–15 sessions.

### Per-section work (paragraph-by-paragraph walkthrough)
- §1.0 (725L): ~8 prose chunks
- §1.1 (138L): chunk count TBD when reached
- §1.2 (147L): chunk count TBD
- §1.3 (173L): chunk count TBD (heavy C1 surface area)
- §1.4 (221L): chunk count TBD (heavy C1 surface area)
- §1.5 (77L): chunk count TBD (heavy C1 surface area)

### Capstone tasks (run after walkthroughs complete)
- A5 (#13): Glossary — depends on A1+A3+A4+A7+A8+Q4+Q5
- V1 (#17): Quote verification — final pass over entire document, depends on ALL others

### Diagram work (PAUSED at v7, separate from this revision project)
- Resume after §§1.0–1.5 revision complete
- A6 (#2) + Q1 (#6) will iterate the diagram at that time
- v7 lives in: `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/option-b-iterations/`

---

## How to Resume in a Clean Session

### Step 1 — Verify state

```bash
# Confirm canonical files intact + backup present
cd "/home/dalton/projects/claudeflow-testing/tmp/Dissertation/Working tex versions"
ls -la *.tex
ls -la .backups/2026-05-20T1933-pre-§1.0/

# Confirm reference.bib has 9 Aristotle keys
grep -E "(DAaristotle2014|aristotle_(movement|on_colours|physics|metaphysics|sense_and_sensibilia|rhetoric|on_memory|on_dreams))" references.bib | head -20
```

### Step 2 — Read handoffs + memory

```bash
# Read THIS handoff first (current state)
cat tmp/HANDOFF-DISSERTATION-REVISION-2026-05-20-EOD.md

# Read morning handoff (deeper background context)
cat tmp/HANDOFF-DISSERTATION-REVISION-2026-05-20.md

# Master TODO with detailed grep commands + sequence
cat tmp/Dissertation/DISSERTATION-CLEANUP-TODO.md
```

(MEMORY.md auto-loads — entries `project-dissertation-cleanup-todo.md` + `feedback-per-paragraph-revision-protocol.md` + others surface automatically.)

### Step 3 — Task list

Tasks #1–#17 should appear on TaskList. If they don't (cross-session persistence varies), recreate from the master TODO list. The morning handoff Step 4 has the same recreation instructions.

### Step 4 — Begin §1.0 walkthrough

Assistant should say something like:

> "Ready for §1.0 walkthrough. Whenever you signal 'your turn' with a line range (e.g., '§1.0 L47' for the opening note, or '§1.0 L49–65' for the §RP definitions chunk), I'll targeted-Read and scan against all 17 TODO items."

Then user signals on the first paragraph and the per-paragraph protocol kicks in.

### Step 5 — When the first non-trivial citation question arises

Surface the **bib-year flag**: `DAaristotle2014` key year (2014) doesn't match the PDF source year (1984 Barnes ROT). Ask user whether the bib key should be renamed (`DAaristotle1984`?) or whether 2014 is the intentional reference (e.g., year of acquisition, year a specific reprint, or other reason).

### Step 6 — When §1.0 L51 is walked

Surface the **Fragment B punctuation question** from the demo: the PDF source ends `"...in error or not?"` (with `?`) but the dissertation drops the `?`. User must decide (a)/(b)/(c)/(d) per the demo report. This is a small representative case of what V1 (#17) will catch document-wide.

---

## Critical Conventions to Carry Forward (Don't Re-Decide)

| Convention | Value |
|---|---|
| Greek macron form | Unicode (`ē`) — NOT `\=e` LaTeX command, NOT `\gk{}` |
| Citation format | `\autocite[locus]{key}` (biblatex authoryear) |
| Aristotle bib keys | `DAaristotle2014`, `aristotle_movement_of_animals`, `aristotle_on_colours`, `aristotle_physics`, `aristotle_metaphysics`, `aristotle_sense_and_sensibilia`, `aristotle_rhetoric`, `aristotle_on_memory`, `aristotle_on_dreams` |
| Backup cadence | Per section |
| Compile cadence | Only after LaTeX-syntax-affecting changes |
| Signal format | Line range + anchor fallback |
| Q-item research | Block-load per Q-item |
| User signals via chat | Notes/questions in chat, NOT in `\inlinenote{}` |
| V1 timing | CAPSTONE final pass — NOT per-paragraph |
| Quote verbatim spec | Strict: italics + dashes + Greek + punctuation + quotes + capitalization + ellipses + brackets |

---

## What's NOT Done (Explicit Non-Goals for Resumption)

- ❌ DO NOT begin TikZ diagram revision (paused at v7) — wait until §§1.0–1.5 prose complete
- ❌ DO NOT bulk-execute any TODO item across files — strict per-paragraph protocol
- ❌ DO NOT make philosophical/interpretive decisions on Q-items unilaterally — pull texts + discuss
- ❌ DO NOT run V1 (#17) until all other tasks complete — capstone is sequenced last
- ❌ DO NOT modify §§1.0–1.5 source without explicit "your turn" signal
- ❌ DO NOT use `\inlinenote{}` for user notes — chat only

---

## Files Touched This Session

For audit:
- **Created**: `tmp/HANDOFF-DISSERTATION-REVISION-2026-05-20-EOD.md` (this file)
- **Created**: `tmp/Dissertation/Working tex versions/.backups/2026-05-20T1933-pre-§1.0/1.0 - Introduction.tex` (snapshot)
- **Created**: `~/.claude/projects/.../memory/feedback-per-paragraph-revision-protocol.md` (NEW memory)
- **Updated**: `~/.claude/projects/.../memory/MEMORY.md` (top entry + workflow preferences list)
- **Updated**: `~/.claude/projects/.../memory/project-dissertation-cleanup-todo.md` (rewrote with full state)
- **Created**: 17 TaskCreate entries (#1–#17)
- **User-modified outside this assistant**: `references.bib` (all 9 Aristotle keys added — confirmed by user mid-session)

**Dissertation source files in `Working tex versions/`: UNTOUCHED this session.** Zero edits to dissertation `.tex` content. All revision work begins fresh in next session.

---

## Open Items / First-Touch Notes for Next Session

1. **Bib year mismatch decision** (surface when first non-trivial bib question arises — see Step 5 above)
2. **Fragment B punctuation decision** (surface when §1.0 L51 walked — see Step 6 above)
3. **Translator confirmation across other Aristotle works** (we confirmed Smith/Barnes ROT for DA only; Metaphysics/Physics/MA/etc. translators TBD on first quote from each)
4. **`phantasia` untranslated footnote convention (E1)** — natural surfacing point at §1.0 L49–65 Chunk 2 where *phantasia* is first introduced. Will likely be the first interpretive decision in Chunk 2.

---

**End of EOD handoff. Sleep well. Safe to power down PC. Resume tomorrow with clean session.**
