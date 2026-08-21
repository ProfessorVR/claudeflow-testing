# Dissertation Revision Protocol

**Purpose**: This document specifies how the user (Dalton) and the assistant (Claude) collaborate to revise the dissertation chapter on Aristotelian *phantasia* and rhetorical ontology. It is the canonical workflow rulebook. A clean session reading this document should be able to resume revision without any further onboarding.

**Audience**: Any future assistant instance loaded into this project. Read this file completely before performing any prose work. This protocol overrides any conflicting default behavior.

**Status**: Active. Established 2026-05-24 after a quality-degradation episode (see `TODO_NOTES.md` Section H + `~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/session-degradation-remediation-2026-05-24.md`). Restructured 2026-05-24 (rule tiers, light/heavy turns, scope table, canonical-source declaration).

---

## 0. Canonical Source Declaration

To prevent drift between this protocol and the convention registry:

- **This protocol (`REVISION-PROTOCOL.md`)** is the canonical source for **process**: turn-taking, audit cycle, rule tiers, pattern-not-paragraph scope, forbidden-phrase blacklist (operational extract), self-audit procedure.
- **`TODO_NOTES.md` Section D** is the canonical source for **content conventions**: full convention list, terminology, formatting, citation styles, Greek/German rules, advisor-prose prohibitions, etc.
- **`DISSERTATION-CLEANUP-TODO.md`** is the canonical source for the **project-level work plan**: A1–A8 + Q1–Q5 task definitions, execution sequence, dependency graph.

**In case of conflict**: TODO_NOTES.md Section D wins for content; this protocol wins for process; DISSERTATION-CLEANUP-TODO.md wins for task scope and dependencies.

This protocol summarizes only the most frequent content-failure surfaces (Section 4 forbidden-phrase blacklist + Section 5 scope table). For anything else content-related, defer to TODO_NOTES.md Section D.

---

## 1. Document Topology

**Working files** (canonical, suffix `-v2.tex`):
- `tmp/Dissertation/Working tex versions/1.0 - Introduction-v2.tex`
- `tmp/Dissertation/Working tex versions/1.1 - A0 - Motion and Time as Ontological Horizon-v2.tex`
- `tmp/Dissertation/Working tex versions/1.2 - M0 to A1 - The Actualization of Aisthesis-v2.tex`
- `tmp/Dissertation/Working tex versions/1.3 - A3 - Completed Cognitive Actuality and the Three Orientational Modes-v2.tex`
- `tmp/Dissertation/Working tex versions/1.4 - Emotion - The Form of Desire Under Evaluative Disclosure-v2.tex`
- `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action.tex` (no v2 yet; user rewrites entirely after §§1.0–1.4 complete)

**Originals (v0 baselines)**: same directory without `-v2` suffix. Never edit.

**Living documents** (always cross-reference and update):
- `tmp/Dissertation/DISSERTATION-CLEANUP-TODO.md` — structured TODO list (A1–A8 formatting tasks + Q1–Q5 deferred investigations + Execution Sequence)
- `tmp/Dissertation/TODO_NOTES.md` — companion to the above; future-work notes, verification discrepancies, workflow preferences, failed-pattern log, session-degradation diagnosis (Section H). **THIS IS THE MOST OPERATIONALLY CRITICAL FILE.**
- `tmp/Dissertation/GLOSSARY.md` — Greek/German term register with citational support
- `tmp/Dissertation/verbatim_passages.md` — verified verbatim quotation register (V1 source-of-truth)
- `tmp/Dissertation/DEFERRALS-AND-FORWARD-ORIENTATIONS.md` — archived "Deferrals" subsections
- `tmp/Dissertation/REVISION-PROTOCOL.md` — this file

**Memory files** at `~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/`:
- `MEMORY.md` — top-level index (loads automatically into every session context)
- `session-degradation-remediation-2026-05-24.md` — **CRITICAL**: 7-step pre-output protocol + forbidden-phrase blacklist
- `project-aristotelian-terminology-framework.md` — Task #19, Greek conventions, 3-species orexis mapping, 4-fold pathos register
- `project-section-1-3-walkthrough.md` — §1.3 walkthrough status
- `project-verbatim-passages-catalog.md` — workflow + Heidegger preservation convention
- `project-future-work-thinking-emotion-as-kinesis.md` — DA I.4 408b5-7 deployment for §§1.3/1.4
- `project-diagram-prose-sync.md` — A_0 + M_2→A_3 rename sync
- `project-diagram-future-work.md` — 6 diagram future-work items
- Feedback memory files (12+): `feedback-*.md` — see `TODO_NOTES.md` Section G for full index

---

## 1.5. Rule Tiers

Three tiers of obligation. Higher tiers are non-negotiable; lower tiers can be skipped with a one-line "skipped X this turn; reason: Y" note. This structure directly counters the convention-amnesia diagnosis (Section H of TODO_NOTES.md) by reducing the cognitive load of tracking all rules with equal weight.

### Tier 1 — Non-negotiable every-turn rules

Must be satisfied before ANY output (proposal or applied edit). No exceptions.

1. **Forbidden-phrase blacklist check** (Section 4 of this protocol).
2. **Pattern-not-paragraph scope** when a violation is flagged (Section 5).
3. **"Propose before applying" for substantive changes** (definition in Section 3.5).
4. **Gross-rigor for any Gross citation/quote/paraphrase** (Task #18, UTMOST PRIORITY): verbatim accuracy + contextual accuracy, read full chapters as needed.
5. **PDF verification for any newly inserted quotation** (per-turn inline verification, Section 9.2).
6. **Backup before substantive multi-file edits** (Section 7).

### Tier 2 — Strong defaults, suspend with explicit note

Standard procedure for any turn beyond a single mechanical fix. May be skipped with one-line note in proposal (e.g., "Skipped full TODO audit this turn — single-pattern mechanical fix, narrow scope").

1. **Read full section being revised end to end** (capture user's hand-edits).
2. **Run full TODO-item audit for the section** (Section 3.2).
3. **Update verbatim_passages.md / GLOSSARY.md** after applying changes that affect either.
4. **LaTeX compile check after LaTeX-affecting changes**.

### Tier 3 — Nice-to-have / context-dependent

Apply when relevant; routine skipping is fine without explicit note.

1. **Re-reading marginal memory files** (beyond the always-required: MEMORY.md, REVISION-PROTOCOL.md, TODO_NOTES.md Section D + H, session-degradation-remediation-2026-05-24.md).
2. **Updating MEMORY.md top-line entries** for incremental progress (batch at end of session or end of section).
3. **Cross-section consistency checking** outside the active section.

### Why this tiering matters

The §1.0 walkthrough session (dfc6e46e) succeeded with effectively ~3 Tier-1 rules. As the convention stack grew, treating all rules at equal weight diluted attention to each. The tier structure preserves accountability for the critical few while permitting realistic relief on the rest.

---

## 2. Collaboration Mode (Section-by-Section Protocol)

This protocol replaced the per-paragraph mode at §1.2 onward (user directive 2026-05-23). Use this mode for §§1.2 forward unless user explicitly switches back to per-paragraph.

### 2.1 Turn structure

1. **User's turn (user goes first)**
   - User reads a section (or range) of the working `-v2.tex` file.
   - User makes their own edits directly in the file (hand-edits, deletions, paragraph merges, etc.).
   - User flags specific paragraphs requiring complex assistant work (footnote rewrites, new quotations, substantive paragraph rewrites, research lookups).
   - User signals "your turn" with paragraph references (line numbers and/or content anchors).

2. **Assistant's turn**
   - Assistant performs the full audit cycle described in Section 3 below.
   - Assistant proposes changes for review BEFORE applying any substantive work (user directive 2026-05-23).
   - User approves, rejects, or modifies the proposal.
   - Assistant applies approved changes after explicit approval.

### 2.2 What "your turn" means

When the user says "your turn", the assistant does NOT only address the flagged paragraph. The assistant MUST:

1. **Re-read the working file (full section)** to capture user's hand-edits since last sync.
2. **Run a TODO-item audit** for the section (Section 3.2 below).
3. **Run a convention-violation sweep** for the section (Section 3.3 below).
4. **Compile findings** into a structured proposal grouped by paragraph.
5. **Present proposal** with explicit labels: (a) items addressing user-flagged paragraph(s), (b) items found by TODO audit, (c) items found by convention sweep, (d) any research lookups needed before applying.
6. **Wait for approval** before applying anything substantive.

The flagged-paragraph item is just one item among many. The assistant scans the entire section even when only one paragraph is flagged.

---

## 3. Assistant Audit Cycle (per turn)

This is the operational heart of the protocol. Tier 1 rules (Section 1.5) are non-negotiable on every turn. Tier 2 can be suspended with an explicit one-line note when turn weight justifies. Tier 3 is context-dependent.

### 3.0 Turn-weight decision gate (run first)

At the start of every turn, classify the turn:

**Light turn** — applies when ALL of the following hold:
- Change is purely mechanical (e.g., em-dash spacing, Greek accent normalization, single forbidden-phrase replacement)
- Change matches an existing codified convention with no judgment required
- Scope is narrow (single paragraph or a handful of clearly local instances)
- No new quotations, no interpretive rewrites, no reorganization

**Heavy turn** — applies whenever ANY of the following hold:
- User flagged a paragraph for complex work (footnote rewrite, paragraph rewrite, new quotation insertion, structural reorganization)
- Change requires judgment about which convention applies or how to phrase the replacement
- Change touches multiple sections or cross-references
- Research/corpus lookup is needed

**Behavior implications**:
- Light turn: Tier 1 still mandatory (forbidden-phrase check, pattern-not-paragraph scope, propose-before-applying if substantive, Gross-rigor, PDF verification, backup). Tier 2 may be skipped with one-line note: "Skipped [Tier 2 item] this turn — [reason]".
- Heavy turn: full Tier 1 + Tier 2. Tier 3 as warranted.

**Important**: Light-turn relief NEVER applies to Tier 1. The forbidden-phrase blacklist and pattern-not-paragraph scope must run on every turn regardless of weight. A "mechanical" change still carries hidden semantic risk (e.g., a "supervenient" → "arises from sensation but not reducible to it" substitution must fit the grammar; an "at *Work* [locus]" → work-in-narrative restructure must read naturally).

### 3.1 Pre-turn setup

**Distinguish session-start reads from mid-session reads**:

**At session start (full reads, required)**:
1. **Read `MEMORY.md`** (always loaded; verify current state).
2. **Read `tmp/Dissertation/REVISION-PROTOCOL.md`** (this file) end to end.
3. **Read `tmp/Dissertation/TODO_NOTES.md`** Section D (workflow preferences / active conventions) + Section H (failed-pattern log + session-degradation diagnosis) in full.
4. **Read `~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/session-degradation-remediation-2026-05-24.md`** in full.
5. **Read the relevant project memory file** for the active section (e.g., `project-section-1-3-walkthrough.md` for §1.3).
6. **Read the current working `-v2.tex` file** for the section under revision.

**On subsequent turns within the same session**:
1. **Quick-reference scan**: forbidden-phrase blacklist (Section 4) + scope table (Section 5). These live in the protocol as extracted operational summaries; consult before every output.
2. **Re-read working `-v2.tex` section file** (capture user's hand-edits since last sync) — Tier 2; skippable on light turn with note.
3. **On-demand re-read of TODO_NOTES.md sections** only when ambiguity arises or a new pattern is encountered (e.g., a Greek term you haven't worked with before → consult `project-aristotelian-terminology-framework.md`).

**Always (every turn)**:
- **Backup the working file** to `tmp/Dissertation/Working tex versions/.backups/<timestamp>-pre-<section>-<turn-context>/` before any substantive change. Tier 1.

### 3.2 TODO-item audit (for the section)

For the entire section under revision, scan against `TODO_NOTES.md` items:

- **Section A** (Future Work by section): identify all items for the current section. Each must be either addressed in this turn, deferred with reason, or flagged as pending.
- **Section B** (Diagram Future Work): only if the section being revised contains diagram-related content or cross-references.
- **Section B'** (C2 Biblatex Migration): identify any `\cite{...}` calls that should be `\autocite[locus]{key}`. Apply if user has not deferred to end-of-document.
- **Section C** (Verification Discrepancies): identify any V1 capstone targets in the section. Flag, do not silently correct.
- **Section D** (Workflow Preferences): apply ALL active conventions to anything you write. This is the most frequent violation surface — see 3.3.
- **Section E** (Active Investigations / Tallies): update Q5 trace→tone tally if the section contains "trace" usages.
- **Section F** (Active Observations / Notes): cross-reference any notes that bear on the current section.
- **Section H** (Failed-pattern log): consult to see which patterns this session is most likely to slip on. Apply extra vigilance to those patterns.

### 3.3 Convention-violation sweep (for the section)

Before proposing any prose changes, grep the section for these patterns. Each hit is a candidate fix to propose alongside the user-flagged work:

#### 3.3.1 Citation/format violations

- `at \\textit{[Work]}[^,]*[0-9]` — inline "at *Work* [locus]" pattern. Should be work in narrative, locus in parens. (User directive 2026-05-22, §1.1 L46 et al.)
- Multi-locus parenthetical citations with `cf.` or `;` separators inline in main text → should be footnotes with brief explanation. (§1.0 L97 directive)
- `\\cite{` (without `auto`) → migrate to `\\autocite[locus]{key}`. (C2 task)
- `(SZ` → should be `(BT` (English Being and Time, never SZ). (§1.1 L71 directive)
- BT citations without page numbers → flag for V1 capstone full-citation pass.
- Quotations 5+ lines not in block-quote format → should use `\\begin{adjustwidth}...\\end{adjustwidth}`. (§1.1 L65 directive)

#### 3.3.2 Terminology violations

- `\\textit{dual-trace}` / `dual-trace` / `dual trace` → `dual-resonance`. (Status: §1.2 ✓ done; §§1.0/1.1/1.3/1.4/1.5 pending sweep.)
- `chapter` / `this chapter` (in user prose, not direct quotes) → `section` / `subsection`. (Status: §§1.0, 1.2 ✓ done; §§1.1/1.3/1.4/1.5 pending.)
- `faculty of [appetite|sense|desire|...]` (in user prose, not direct quotes) → Greek faculty-name: *aisthētikon*, *orektikon*, *kritikon*, *kinētikon*, *aisthētērion*, *phantastikon*. (Directive 2026-05-23.)
- `the now` / `"the now"` (Aristotelian, in user prose) → `\\`now\\'` (backtick-apostrophe). Task #22.
- "potency" or "act" used for energeia/dynamis → "potentiality" / "actuality" with Greek in parens. (§1.1 L99 directive)
- German-first slip for Heidegger terms: `\\textit{Geworfenheit} (``thrownness'')` → `thrownness (\\textit{Geworfenheit})`. English-first per user directive 2026-05-22.
- "supervenient" / "supervenes on" → substantive language ("arises from sensation but is not reducible to it"). (§1.3 L53 directive.)

#### 3.3.3 Advisor-prose violations (forbidden phrasing)

- "The dissertation's claim ... rests on this structural reading"
- "X underwrites the [distinction] this chapter deploys"
- "The chapter's interpretive reading ..."
- "The present chapter's interpretive move"
- `\\textit{Framing}:` / "Framing:" footnote prefixes
- "interpretive" qualifier on user's own readings ("My interpretive position is that...")
- "Macquarrie-Robinson translation appears at p. X" / translator-info signposting at footnote opening
- Any meta-narrative phrasing that turns a footnote into a defense of "the chapter" / "the dissertation" / "the project"

#### 3.3.4 Cross-reference violations

- `\\S 1\\.[0-9]` followed by "has already developed", "has already established", "as we have seen at" → remove explicit back-reference; restate the point with parenthetical citation. (Feedback memory: `feedback-no-explicit-back-references.md`.)

#### 3.3.5 Formatting violations

- `\\=e` (LaTeX-encoded long-e) → Unicode `ē`. Task #4 (A1).
- ` --- ` (spaced em-dash) → `---` (flush). Task #1 (A2).
- Coined `resonant <X>` compound NOT italicized as whole compound → italicize whole compound. Task #5 (A8).
- Greek modifier (phantastic, doxastic, kinetic, etc.) NOT italicized → italicize. Task #3 (A3).

### 3.4 Substantive-work execution

For user-flagged paragraphs requiring complex work:

1. **Identify the deliverable type**: footnote rewrite, new quotation insertion, paragraph rewrite, research lookup, structural reorganization, etc.
2. **Conduct any necessary corpus research FIRST** (before drafting):
   - For Aristotle quotes: consult `corpus/index/` FIRST, then `corpus/rhetorical_ontology/<work>.pdf`. (`feedback-corpus-index-first.md`)
   - For Heidegger quotes: consult `corpus/rhetorical_ontology/<work>.pdf`. Quotation-preservation: verbatim punctuation, italics, nested quote marks. (Feedback memory.)
   - For Gross quotes: `corpus/rhetorical_ontology/Gross - Uncomfortable Situations` PDF or `Gross - Heidegger and Rhetoric` PDF. UTMOST PRIORITY rigor (Task #18). Read entire chapters as needed.
   - For non-corpus sources: WebSearch ONLY when explicitly authorized (`feedback-missing-source-placeholder-relaxed.md`). Otherwise use `******` placeholder with locus.
3. **Articulate the convention being applied** in the proposal (e.g., "applying work-in-narrative/locus-in-parens per Task #21").
4. **Suppress AI-default citation prior**: before writing any citation, mentally state the work-in-narrative/locus-in-parens rule.
5. **Draft the proposal** with:
   - Section header (paragraph reference, e.g., "L51 footnote 1 rewrite")
   - Convention applied
   - Source verification status (PDF-verified, corpus-index-verified, UNVERIFIED, etc.)
   - Proposed text (LaTeX-ready)
   - Brief rationale

### 3.5 Proposal presentation

Present findings as a structured document with the following sections (use ALL that apply):

1. **User-flagged items** (highest priority — what user asked for)
2. **TODO-audit findings** (from Section 3.2 — TODO items applicable to this section)
3. **Convention-violation sweep findings** (from Section 3.3 — peer violations of the same pattern types)
4. **Research lookups required** (any item needing corpus PDF reading before drafting)
5. **Deferrals** (items consciously deferred, with reason)
6. **Questions for user** (anything blocking)

#### Substantive vs. non-substantive (precise definitions)

**Substantive — `[REVIEW BEFORE APPLY]` required**:
- Any new interpretation, rephrasing, or extension of user's own argument
- Any change to quotations: new insertion, modification of existing quote, change of citation locus or source attribution
- Any reorganization of sentences or paragraphs
- Any new footnote content (not just formatting cleanup)
- Any change to terminology choice (e.g., "appetitive" → "orectic") in user prose
- Any judgment-required scope question (e.g., should this go in main text or footnote?)

**Non-substantive — `[APPLY DIRECTLY]` permitted** (assistant still lists locations):
- Mechanical formatting per A1–A8 from `DISSERTATION-CLEANUP-TODO.md`:
  - A1 Greek accent normalization (`\=e` → `ē`)
  - A2 em-dash spacing flush (`text --- text` → `text---text`)
  - A3 Italicizing Greek-derived modifiers (phantastic, doxastic, kinetic)
  - A8 Italicizing coined "resonant X" compounds
- Replacing pre-approved phrases with their pre-approved substitutes (e.g., "supervenient" → "arises from sensation but not reducible to it"; "dual-trace" → "dual-resonance"; "chapter" → "section" in user prose; "faculty of X" → Greek faculty-name; "at *Work* [locus]" → work-in-narrative/locus-in-parens)
- C2 biblatex migration (`\cite{key}` → `\autocite[locus]{key}`) for already-defined bibkeys

If unsure whether a change is substantive: treat it as substantive (propose first). When in doubt, propose; never silently apply judgment-required changes.

#### Batched micro-edits

For purely mechanical changes of the same type (e.g., all instances of "at *Work* [locus]" inline in a section, or all em-dash spacing fixes), present them as a single batch with one global rationale and a bullet list of locations, rather than full micro-rationales per line. Format:

```
[BATCH — APPLY DIRECTLY]
Convention applied: work-in-narrative, locus-in-parens (Task #21)
Pattern grep: `at \\textit\\{[^}]+\\}[^,)]*[0-9]`
Locations:
  - L73: "at *De Anima* III.7, 431a13-14" → "Aristotle's *De Anima* (III.7, 431a13-14)"
  - L77: "at *Metaphysics* IX.6, 1048b18-23" → "Aristotle's *Metaphysics* (IX.6, 1048b18-23)"
  - L105: ...
```

This preserves transparency (every location visible) while avoiding per-instance boilerplate.

For each proposed change (or batch), label as:
- `[APPLY DIRECTLY]` if non-substantive per the definitions above
- `[BATCH — APPLY DIRECTLY]` for mechanical sweeps grouped together
- `[REVIEW BEFORE APPLY]` if substantive
- `[DEFERRED]` with reason

### 3.6 Application

After user approval:

1. Apply approved changes via `Edit` tool. Each `Edit` should target one specific change for traceability.
2. Update `verbatim_passages.md` for any new verified quotations.
3. Update `GLOSSARY.md` for any new load-bearing Greek/German terms or translation choices.
4. Update `TODO_NOTES.md`:
   - Mark resolved items as `✓ RESOLVED <date>` in the relevant section
   - Add any new pending items discovered during the work
   - Update the Q5 trace→tone tally if "trace" usages were touched
   - Log any forbidden-phrase slips to Section H failed-pattern table
5. Update memory files as needed (status updates, new feedback rules, etc.).
6. Confirm successful application to user. Signal end of turn.

### 3.7 Post-turn maintenance

After confirming completion, before signaling end of turn:

- **LaTeX compile check** (only if LaTeX-affecting changes were made — per user directive: "compile only after LaTeX-affecting changes"). Use `pdflatex` or `lualatex` per project configuration.
- **Verify backup exists** for the change-set.
- **Update `MEMORY.md`** with one-line status of the section (e.g., "§1.3 walkthrough: L51, L53, L73, L91 walked"). Keep `MEMORY.md` index concise.

---

## 4. Forbidden-Phrase Blacklist (always check before output)

Reproduced from `TODO_NOTES.md` Section H for direct reference:

| Pattern | Replace with | Source |
|---|---|---|
| "rests on", "underwrites", "the dissertation's claim depends on" | substantive description | §1.3 L51 fn1, §1.3 L53 |
| "supervenient", "supervenes on" | "arises from sensation but is not reducible to it" | §1.3 L53 |
| "§1.X has already developed/established", "as we have seen at" | restate point + parenthetical citation | `feedback-no-explicit-back-references.md` |
| "faculty of X" (user prose, not quotes) | *aisthētikon*, *orektikon*, *kritikon*, etc. | `feedback-greek-faculty-names.md` |
| "this chapter" / "the chapter" | "section" / "subsection" | 2026-05-22 |
| "at *Work* [locus]" inline | work in narrative, locus in parens | Task #21, 2026-05-22 |
| "dual-trace" | "dual-resonance" | 2026-05-23 §1.2 |
| German-first for Heidegger terms | English-first parenthetical German | 2026-05-22 |
| "Framing:" / `\\textit{Framing}:` | direct substantive content | §1.1 L57, L87, L99 |
| "The chapter's interpretive reading" | just make the reading directly | §1.1 L129 |
| "The present chapter's interpretive move" | just make the move directly | §1.1 L87 |
| "interpretive" qualifier on own readings | just state the reading | §1.1 L123 |
| "Macquarrie-Robinson translation" signposting | parenthetical citation handles location | §1.1 L99 |
| "potency" / "act" | "potentiality" / "actuality" + Greek dynamis/energeia in parens | §1.1 L99 |
| "supplies the [canonical/textual/philological] [anchor/ground/basis] for the X [reading/argument] [deployed here/articulated above]" | just state what the source says and how it supports the claim | §1.3 L63 B1.1 footnote, 2026-05-24 |

---

## 5. Pattern-not-Paragraph Scope Rule

This is the operational commitment that closes the convention-amnesia loop documented in TODO_NOTES.md Section H.

**Rule**: when the user flags one violation of a pattern in one paragraph, the assistant must grep at the appropriate scope (section or file, per the table below) for peer violations of the same pattern class. Fix all violations in a single batch. Present the batch for approval.

**Why**: paragraph-isolated fixes leave peer violations to surface in the next paragraph, requiring repeated correction loops. The user has expressed frustration with this regression pattern multiple times.

### 5.1 Scope per pattern type

| Pattern | Default scope | Rationale |
|---|---|---|
| "at *Work* [locus]" inline | section | Per-section citation density varies; section sweep catches dense pockets |
| "faculty of X" → Greek faculty-name | section | Local to walked sections (don't disturb older stable sections without prompt) |
| "dual-trace" → "dual-resonance" | section (active section only) | Cross-section sweep deferred to dedicated batch; see Tasks #3 |
| "supervenient" → approved substitute | section | Low frequency; section catches local cluster |
| "chapter" → "section" / "subsection" | section | Same as above |
| German-first → English-first for Heidegger | section | Same as above |
| Em-dash flush (Task #1 A2) | file | Purely mechanical; batch across whole file is efficient |
| Greek Unicode (Task #4 A1) | file | Same as above |
| Resonant-X compound italicization (Task #5 A8) | file | Same as above |
| **Advisor-prose patterns** ("rests on", "underwrites", "this chapter's interpretive reading", "Framing:", "interpretive" qualifier) | **file** | These patterns are insidious and reassert under generative pressure; whole-file sweep prevents re-emergence |
| **Back-references** ("§1.X has already developed/established") | **file** | Cross-section by nature |
| **Macquarrie-Robinson translator-info signposting** | **file** | Footnote opening pattern; sweep across all footnotes |
| **"Potency"/"Act"** → potentiality/actuality | **file** | Translation choice; cross-section consistency required |

### 5.2 Paragraph-narrowing escape

**Default scope**: per the table above (section or file).

**Narrower scope allowed** when ANY of:
- User explicitly narrows scope: "just fix this one"
- The pattern is genuinely contained in a self-contained footnote with no architectural reach (e.g., a one-off "faculty of X" inside a quoted-context paraphrase that the rest of the section doesn't share)
- The default-scope sweep would touch older stable sections that user has not flagged for revision in the current session

When narrowing scope: state the narrower scope explicitly in the proposal with reason ("narrowing to paragraph only — pattern is contained in a footnote-internal paraphrase; no peer instances in adjacent paragraphs of this section").

### 5.3 Concrete example

User flags `at \\textit{De Anima} III.7, 431a13-14` at §1.3 L73. Assistant:
1. Identifies pattern: "at *Work* [locus]" inline (per scope table: section scope).
2. Runs `grep -nE 'at \\\\textit\\{[^}]+\\}[^,)]*[0-9]+' 1.3*.tex` to find all peer instances in §1.3.
3. Lists all peer instances (L73, L77, L83, L105, L117, L165) in the proposal alongside the flagged item.
4. User approves the batch; assistant applies in one pass.
5. Logs the slip pattern to TODO_NOTES.md Section H if not already logged.

---

## 6. Session-Start Checklist (clean session bootstrap)

For a fresh assistant session, execute this checklist before any prose work:

1. Read `MEMORY.md` (always loaded; verify current state).
2. Read `tmp/Dissertation/REVISION-PROTOCOL.md` (this file). **Required.**
3. Read `tmp/Dissertation/TODO_NOTES.md` Section H (failed-pattern log + session-degradation diagnosis). **Required.**
4. Read `~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/session-degradation-remediation-2026-05-24.md`. **Required.**
5. Read `tmp/Dissertation/TODO_NOTES.md` Section D (workflow preferences / active conventions).
6. Read `tmp/Dissertation/DISSERTATION-CLEANUP-TODO.md` for structured A1-A8 / Q1-Q5 task list.
7. Identify which section is the active focus (check `MEMORY.md` top entries + recent user message context).
8. Read the current working `-v2.tex` file end to end.
9. Read the relevant project memory file for the active section (e.g., `project-section-1-3-walkthrough.md` for §1.3).
10. **Identify the current project phase and active task scope** (see 6.1 below).
11. Confirm understanding to user with a brief status summary; await user signal on next paragraph/section to work on.

### 6.1 Project-phase awareness

When reading `DISSERTATION-CLEANUP-TODO.md`, identify:

- **Currently active items**: which A1–A8 / Q1–Q5 items are appropriate for this session (e.g., user is in §1.3 walkthrough → A2 em-dash + A7 Latin titles + active-section convention sweeps are in scope).
- **Deferred items**: items consciously parked until later (e.g., V1 capstone quotation verification runs at end of dissertation only; A5 glossary is the capstone deliverable).
- **Blocked items**: items waiting on dependencies (e.g., Q3 Path 1 interpretation blocked until Q4 hexis-doxa audit resolves).

**Behavior rules**:
- Proposals should NOT attempt deferred or capstone items (e.g., V1 capstone verification, A5 glossary completion) unless the user explicitly activates them.
- Forward-looking philosophical changes (Q2 hexeis feedback, Q5 trace→tone adoption) belong to investigation phases — do not preemptively apply during mechanical cleanup turns.
- When unsure whether an item is in-scope for the current session, ask before applying.
- "Being helpful" by tackling forward items is a regression risk; stay in the user's announced phase.

The phase signal usually comes from the user's most recent task assignment ("let's continue §1.3 walkthrough" = section-walkthrough phase; "let's run the V1 pass" = capstone phase). When ambiguous, default to the user's announced focus.

---

## 7. Backup Discipline

Per `feedback-backup-before-changes.md`:

**Always create timestamped backup before multi-file edits**:
```
mkdir -p tmp/Dissertation/Working\ tex\ versions/.backups/$(date +%Y-%m-%dT%H%M)-pre-<short-label>/
cp tmp/Dissertation/Working\ tex\ versions/*.tex tmp/Dissertation/Working\ tex\ versions/.backups/$(date +%Y-%m-%dT%H%M)-pre-<short-label>/
```

**Before any substantive section-level work**: backup just the section file under revision.

**Naming**: `<timestamp>-pre-<section>-<context>` (e.g., `2026-05-24T1230-pre-1.3-L51-walkthrough`).

---

## 8. LaTeX Conventions

- **Greek**: Unicode (ē, ā, ī) — NOT LaTeX-encoded (`\=e`). Task #4.
- **Em-dash**: flush (no spaces) — `text---text` NOT `text --- text`. Task #1.
- **Italics**: `\textit{}` for Latin work titles (*De Anima*), Greek terms (*phantasia*), coined compounds (*resonant epithymia*).
- **Greek glyphs**: `\gk{}` for polytonic Greek inline (when font available); Unicode when not.
- **Quotation marks**: backtick-apostrophe `\`text'` (single) or `\`\`text''` (double). LaTeX-canonical.
- **Footnotes**: `\footnote{...}` — be wary of brace nesting; check brace balance on edits.
- **Block quotations**: `\begin{adjustwidth}{...}{...}` ... `\end{adjustwidth}` for quotes 5+ lines.
- **Citations**: `\autocite[locus]{bibkey}` per biblatex authoryear (C2 migration in progress).
- **Aristotle Latin work titles**: per Task A7 (`A7. Aristotle work titles — use Latin/Greek standardized form` in DISSERTATION-CLEANUP-TODO.md).

---

## 9. Verification Protocols

### 9.1 Quotation verification (V1 capstone)

Trigger: ONLY at end of dissertation revision, after all other changes complete.

Per-quote procedure: verify verbatim against PDF, verify locus, add to `verbatim_passages.md`, update citation to authoryear biblatex format, flag discrepancies for user review (never silently correct).

### 9.2 In-line verification (per-turn)

When a quote is added or edited during a turn:
- Verify verbatim against `corpus/rhetorical_ontology/<work>.pdf`
- If quote is not in corpus: use `******` placeholder body with locus; user supplies manually
- If quote sourced via WebSearch (only when explicitly authorized): prefix `****** UNVERIFIED:` in footnote audit flag

### 9.3 Gross-rigor (UTMOST PRIORITY, Task #18)

ANY use of *Uncomfortable Situations* (2017) or *Heidegger and Rhetoric* (2005, ed. Gross) requires:
- Perfect verbatim accuracy
- Contextual accuracy (read full chapters as needed)
- No paraphrase or summary unless explicitly approved by user
- Cross-check against `corpus/rhetorical_ontology/Gross*` PDFs

---

## 10. Failed-Pattern Self-Audit

After every turn, before signaling completion:

1. Re-read the diff (changes just made).
2. Check each diff line against the forbidden-phrase blacklist (Section 4).
3. If a forbidden pattern slipped through: fix the slip before signaling completion AND log to Section H.

### 10.1 Section H logging — first-instance-then-tally

To keep Section H readable while preserving diagnostic value:

- **First instance per pattern per session** = full row (date, section, pattern, context, caught-by). This preserves the contextual diagnostic (which kind of situation triggers the reassertion).
- **Subsequent instances of the same pattern in the same session** = tally increment under that row (e.g., "supervenient: +3 this session"). No new row needed.
- **Across sessions**: the pattern row persists; tally resets per session. Cumulative tallies across sessions surface in the periodic Section H review.
- **New pattern classes** (not previously diagnosed) always get a new row, regardless of session.

This avoids Section H bloat while still letting cross-session review identify which patterns are most prone to reassertion.

This converts the user's correction load into a self-audit load. Goal: zero user-side corrections of the same pattern after this protocol is in effect.

---

## 11. When the User Says "Move On" / "Lets Move to §1.X"

Standard transition behavior:
1. Confirm current section's walkthrough is at a sensible pause point.
2. Update relevant memory files with the section's walkthrough state (e.g., "§1.2 walkthrough complete; unflagged paragraphs L117, L133, L137, L143, L147, L151 remain available").
3. Read the next section's working `-v2.tex` file end to end.
4. Read the relevant project memory file (if exists) for the next section.
5. Identify pending items in `TODO_NOTES.md` Section A for the next section.
6. Present a brief readiness status to user; await user signal.

---

## 12. When the Protocol Fails

If you (assistant) catch yourself reverting to a forbidden pattern, an AI-default citation style, or asking a scope question that was already answered by protocol:

1. **Acknowledge directly**. Do not euphemize. The user values honest self-diagnosis.
2. **Log to TODO_NOTES.md Section H failed-pattern table** immediately (per Section 10.1 first-instance-then-tally rule).
3. **Check if a peer-violation sweep is warranted** — the slipped pattern often has multiple instances.
4. **Resume work with explicit articulation** of the convention being applied.

If you discover the protocol itself is ambiguous, incomplete, or self-contradictory:
1. Flag the issue to the user.
2. Propose a protocol amendment.
3. Apply the amendment to this file after user approval.

### 12.1 Novel-case escape clause (for scope questions)

The default rule "never ask scope questions when protocol is established" applies to situations covered by Section 5 scope table and the established section-by-section protocol.

**Escape allowed**: when facing a genuinely novel situation NOT covered by the scope table or protocol — e.g.:
- An unusual cross-sectional operation (e.g., consolidating duplicate footnotes across two sections)
- A pattern class not previously encountered (e.g., a new terminology question that no prior convention addresses)
- A file or content area outside the standard `-v2.tex` working files

In these cases, ask ONE concrete, scoped question rather than guessing. Frame it as: "This situation is not covered by [Section 5 scope table / Section 3.0 turn-weight decision gate / Section 6.1 project-phase rules]. Should I [option A] or [option B]?"

The escape clause does NOT cover situations already addressed by protocol (e.g., section-vs-paragraph scope for known patterns, light-vs-heavy turn classification, substantive-vs-non-substantive classification). For those, infer and act per protocol.

---

## 13. Why This Protocol Exists

Quality degraded across the sessions immediately preceding 2026-05-24 relative to the §1.0 walkthrough session `dfc6e46e` (May 22 21:14, identified by user as "finest"). Root causes diagnosed: convention amnesia under generative pressure, memory created but not consulted, reactive paragraph-only scope, AI-default citation pattern reassertion, scope-question regression, verification-pass shortcuts.

This protocol is the corrective mechanism. It operationalizes rules that previously existed only as memory files (which were not consulted at generation time). It converts the user's repeated correction work into an assistant self-audit load. It establishes the pattern-not-paragraph scope as default.

Full diagnostic: `~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/session-degradation-remediation-2026-05-24.md` + `TODO_NOTES.md` Section H.

---

## 14. Quick Reference Card (for tab-out review)

### Tier 1 (every turn, no exceptions) — Section 1.5

1. Forbidden-phrase blacklist check (Section 4)
2. Pattern-not-paragraph scope when violation flagged (Section 5; default scope per Section 5.1 table)
3. Propose-before-applying for substantive changes (Section 3.5 definitions)
4. Gross-rigor for any Gross citation/quote (Task #18)
5. PDF verification for any newly inserted quotation
6. Backup before substantive multi-file edits

### Tier 2 (strong default, suspend with one-line note if light turn) — Section 1.5

1. Read full section being revised end to end
2. Run full TODO-item audit (Section 3.2)
3. Update verbatim_passages.md / GLOSSARY.md after applying
4. LaTeX compile check after LaTeX-affecting changes

### Tier 3 (nice-to-have)

1. Re-read marginal memory files (beyond required set)
2. Update MEMORY.md top-line entries (batch end-of-section)
3. Cross-section consistency checks outside active section

### Turn-weight decision gate (Section 3.0)

- **Light turn** (Tier 2 skippable with note): purely mechanical, codified convention, narrow scope, no judgment
- **Heavy turn** (full Tier 1 + Tier 2): user-flagged complex work, judgment required, multi-section, research needed

### Never:

- Use forbidden phrases (Section 4 blacklist — extracted operational summary)
- Apply substantive changes without user approval (definitions in Section 3.5)
- Treat paragraph as the scope when default is section/file (Section 5 table)
- Silently correct verification discrepancies (always flag)
- Ask scope questions covered by protocol (escape clause for genuinely novel cases only, Section 12.1)
- Skip Tier 1 (forbidden-phrase check, pattern-scope, propose-before-applying, Gross-rigor, PDF verification, backup)
- Tackle deferred/capstone items without user activation (Section 6.1)

### Always:

- State the convention being applied in proposals
- Verify quotations against PDFs in corpus
- Use Greek faculty-names in user prose (per `feedback-greek-faculty-names.md`)
- Use English-first for Heidegger German
- Use work-in-narrative / locus-in-parens for citations (Task #21)
- Honor backup discipline (Section 7)
- Use first-instance-then-tally for Section H logging (Section 10.1)

### Canonical sources

- **Process** → this protocol (REVISION-PROTOCOL.md)
- **Content conventions** → TODO_NOTES.md Section D
- **Project-level tasks** → DISSERTATION-CLEANUP-TODO.md (A1–A8, Q1–Q5, execution sequence)
- **In case of conflict**: see Section 0 canonical source declaration

---

**End of Revision Protocol.**
