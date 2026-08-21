# Clean-Session Prompts: §1.1 and §1.2 Comprehensive Sweeps

**Generated**: 2026-05-24, after §1.3 comprehensive sweep completed
**Purpose**: Two self-contained prompts to be copy-pasted into clean sessions, each performing a comprehensive paragraph-by-paragraph sweep of one section (§1.1 or §1.2) modeled on the §1.3 sweep just completed.

**Why a sweep is needed**:
- §1.1 was walked in per-paragraph mode in earlier sessions; user reports paragraphs were skipped
- §1.2 was marked "section-by-section walkthrough complete 2026-05-23" per TODO_NOTES.md, but the marking was premature — paragraphs were skipped
- Both sections need the same comprehensive audit cycle applied to §1.3 today, which found 70+ items across CRITICAL/HIGH/MEDIUM/DEFERRED categories

**Workflow per prompt**:
1. Session-start checklist (read all required protocol + memory files + the working `-v2.tex` file + §1.3 v2 as finished-sweep exemplar)
2. Comprehensive paragraph-by-paragraph audit
3. Categorized findings proposal (Critical / High / Medium / Deferred)
4. User category-by-category approval
5. Batched application via Edit (mechanical replace_all where applicable; targeted otherwise)
6. Update TODO_NOTES.md + memory + protocol
7. Confirm completion

---
## PROMPT 2 — §1.2 Comprehensive Sweep

```
I need a comprehensive paragraph-by-paragraph sweep of §1.2 (M_0 → A_1:
The Actualization of Aisthēsis) following the same audit + apply workflow
the system just completed for §1.3 on 2026-05-24. §1.2 was marked
"section-by-section walkthrough complete 2026-05-23" in TODO_NOTES.md,
but paragraphs were skipped; this sweep is to catch every convention
violation, every NOTE TO SYSTEM marker, every typo, every orphan
footnote, every mechanical-batch item still pending.

Before any sweep work, execute the session-start checklist in this order:

1. Read tmp/Dissertation/REVISION-PROTOCOL.md end to end (canonical
   process rulebook; updated 2026-05-24 with new forbidden-phrase row in
   Section 4)
2. Read tmp/Dissertation/TODO_NOTES.md Section D (canonical content
   conventions) and Section H (failed-pattern log + session-degradation
   diagnosis) in full
3. Read ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
   session-degradation-remediation-2026-05-24.md in full
4. Read ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
   feedback-no-supplies-anchor-pattern.md (added 2026-05-24 after §1.3 B1
   work — forbids "supplies the canonical scholarly anchor for X" meta-
   narrative; just state what source says + how it supports the claim)
5. Read ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
   project-section-1-3-walkthrough.md (for §1.3 sweep exemplar status)
6. Read tmp/Dissertation/Working tex versions/1.2 - M0 to A1 - The
   Actualization of Aisthesis-v2.tex end to end
7. Read tmp/Dissertation/Working tex versions/1.3 - A3 - Completed
   Cognitive Actuality and the Three Orientational Modes-v2.tex end to
   end — this is the finished-sweep state to model
8. Identify project phase: §1.2 comprehensive sweep (not fresh
   walkthrough, not capstone). Modeled on §1.3 afternoon-session sweep
   2026-05-24.

Known pending items in §1.2 (from TODO_NOTES.md Section A.§1.2):
- L75 footnote — Greek Physics III.3 202a21–24 acquisition (Task #23):
  currently only English Smith/Hardie ROT in corpus; Greek Physics
  edition (Ross OCT 1936 or equivalent) needed in
  corpus/rhetorical_ontology/ to verify Greek poiēsis/pathēsis passage.
- ✓ L85 quote discrepancy "change in/of quality" RESOLVED 2026-05-24
- L55 main text German-first slip — "\textit{Geworfenheit}
  (`thrownness')" and bare "\textit{Befindlichkeit}" — should be
  "thrownness (\textit{Geworfenheit})", "disposedness
  (\textit{Befindlichkeit})". Per-paragraph application during
  walkthrough.
- L81 German-first slip — "\textit{In-der-Welt-sein}
  (`being-in-the-world')" should be "being-in-the-world
  (\textit{In-der-Welt-sein})"
- L57 Gibson page citation — Currently pp. 209–210 (lorgnette
  tachistoscope material, doesn't support claim about ambient optic
  array specifying surfaces/layouts); correct support at Ch. 4 "The
  Structuring of Ambient Light" pp. 46–47 of 2015 Classic Edition.
- L57 footnote: Gross p. 22–23 quote — Task #18 (GROSS-VERIFY, UTMOST
  PRIORITY): verify against corpus/rhetorical_ontology/Gross -
  Uncomfortable Situations PDF before any further section-level work.
- L57 Gibson/Rickert/Uexküll integration — user noted these are tied
  together for future work; existing L57 footnote ties
  Gibson+Gross+Hyde+Rickert; L105 footnote ties Gross+Uexküll+Rickert;
  further integration may be desired.

Known prior status:
- ✓ L51 A_0=motion-time conflations (2 instances) RESOLVED 2026-05-23
- ✓ dual-trace → dual-resonance sweep COMPLETE 2026-05-23 (13
  occurrences migrated)
- ✓ chapter → section sweep COMPLETE 2026-05-23 (5 instances migrated)
- §1.2 was section-by-section walkthrough 2026-05-23; user-flagged
  paragraphs walked; UNFLAGGED paragraphs that received no deep work
  (per TODO_NOTES.md): L117 (signet-ring three-phases), L133 main (modus
  tollens), L137 main (dual-resonance closing), L143 main ($A_1$ as
  Ground opening), L147 (similarity grounded in resonant kinēsis), L151
  (threshold of $A_2$). THESE ARE PRIME SWEEP TARGETS — paragraphs
  explicitly marked as not deeply walked.

THE SWEEP TASK:

Execute the following audit for EVERY paragraph + EVERY footnote in §1.2
(do NOT skip any; pay special attention to the L117/L133/L137/L143/L147/
L151 paragraphs that received no deep work):

1. Forbidden-phrase blacklist check (Section 4 of REVISION-PROTOCOL.md):
   - "rests on" / "underwrites" / "the dissertation's claim depends on"
   - "supervenient" / "supervenes on"
   - "§1.X has already developed/established" / "as we have seen at"
   - "faculty of X" (user prose, not direct quotes) → use Greek faculty-
     names (aisthētikon, orektikon, kritikon, kinētikon, etc.)
   - "this chapter" / "the chapter" → "section" / "subsection" (sweep
     was COMPLETE 2026-05-23 but verify no new instances)
   - "at *Work* [locus]" inline → work-in-narrative, locus-in-parens
   - "dual-trace" → "dual-resonance" (sweep was COMPLETE 2026-05-23 but
     verify no residue)
   - German-first slips for Heidegger terms (English-first required) —
     L55, L81 known pending
   - "Framing:" / `\textit{Framing}:` footnote prefixes
   - "The chapter's interpretive reading" / "The present chapter's
     interpretive move"
   - "interpretive" qualifier on user's own readings
   - "Macquarrie-Robinson translation" signposting at footnote openings
   - "potency" / "act" → "potentiality" / "actuality" + Greek
     dynamis/energeia in parens
   - "supplies the [canonical/textual/philological] [anchor/ground/basis]
     for the X [reading/argument] [deployed here/articulated above]" (NEW
     2026-05-24 — just state what source says and how it supports claim)
   - Any meta-narrative phrasing about "the chapter" / "the dissertation"
     / "the project"

2. Mechanical-batch items (D1–D5 from §1.3 sweep):
   - D1 A7: file-wide *On the Soul* → *De Anima*, *On Memory* →
     *De Memoria*, *Movement of Animals* → *De Motu Animalium*
   - D2 A1: file-wide `\=e` → Unicode `ē`; targeted `kinesis` →
     `kinēsis`, `aisthema` → `aisthēma`, `aisthesis` → `aisthēsis`,
     `dunamis` → `dynamis`, `pathe` → `pathē`, etc.
   - D3 A8: coined "resonant X" compounds — italicize whole compound
     (§1.2 is heaviest user of these compounds — 13+ instances)
   - D4 C2: bare `\cite{key}` → `\autocite[locus]{key}`
   - D5 BT citation full-format: "(BT §X, H.<page>; Eng. <page>)" —
     surface but defer to V1 capstone if locus unknown

3. Orphan footnotes — search for `\footnote{}` not attached to text
   (like the L101 and L162 orphans found in §1.3). Relocate to natural
   attachment point.

4. NOTE TO SYSTEM markers — search for "NOTE TO SYSTEM" or similar;
   propose resolutions with PDF-verified quotes where applicable.

5. Markup issues:
   - Broken nested-quote markup
   - Broken brackets
   - Missing closing quotes
   - Double-spaces in body text

6. Grammar/typo issues — full pass through every paragraph (this is
   where the prior walkthrough most likely skipped).

7. Content/argument issues:
   - L57 Gibson page citation correction (pp. 209-210 → pp. 46-47)
   - L57 Gross p. 22-23 quote — Gross-rigor verification (UTMOST
     PRIORITY per Task #18; read full corpus PDF chapter)
   - L75 Greek Physics acquisition note (Task #23) — defer until Greek
     edition added to corpus
   - L117/L133/L137/L143/L147/L151 — explicitly skipped paragraphs;
     full audit needed
   - Quotations needing verification against corpus PDFs

OUTPUT STRUCTURE:

Present findings as a structured proposal organized by severity:

## A. CRITICAL — needs user attention
- Orphan footnotes (with proposed relocation)
- Forbidden-phrase residue (with proposed substitutions)
- Dual-trace / "the chapter" residue (verify none remains; flag if
  surprising)
- German-first slips at L55, L81 (known pending)

## B. HIGH — content gaps and broken markup
- NOTE TO SYSTEM markers with proposed PDF-verified resolutions
- L57 Gibson page citation correction (pp. 209-210 → pp. 46-47)
- L57 Gross p. 22-23 quote verification (UTMOST PRIORITY — full chapter
  read required per Task #18)
- Broken markup (nested quotes, brackets, missing closes)
- Content/argument issues
- Per-quote PDF verification flags

## C. MEDIUM — typos + double-space + grammar
- Listed in document order with OLD / NEW
- Pay special attention to the L117/L133/L137/L143/L147/L151
  "explicitly-skipped" paragraphs

## D. DEFERRED — forward-mechanical batches
- D1 A7 work-title sweep
- D2 A1 Greek-accent sweep
- D3 A8 italicization (heavy in §1.2 — 13+ "resonant X" compounds)
- D4 C2 biblatex migration
- D5 BT citation format (V1 capstone)
- D6 V1 capstone PDF verification candidates
- L75 Greek Physics acquisition (Task #23 — corpus addition required)

After presenting the proposal:

1. Wait for user category-by-category approval (or "all approved")
2. Create timestamped backup at
   tmp/Dissertation/Working tex versions/.backups/<timestamp>-pre-1.2-
   comprehensive-sweep/
3. Apply approved batches via Edit (use replace_all=true for file-wide
   mechanical batches; targeted Edits for content-specific changes)
4. Update tmp/Dissertation/TODO_NOTES.md (mark §1.2 items resolved;
   update §1.2 walkthrough status to "MAJOR SWEEP COMPLETE"; update
   Section H if new patterns slipped)
5. Update memory file (create
   project-section-1-2-walkthrough.md if doesn't exist; update if exists)
6. Confirm completion with structured summary

Begin with the session-start checklist. Confirm understanding with brief
status summary before beginning audit work. Use the §1.3 sweep proposal
structure as direct model.

SPECIAL NOTE FOR §1.2:

§1.2 is the heaviest user of the user's coined "resonant X" compounds
(*resonant kinēsis*, *resonant aisthēma*, *resonant epithymia*, *resonant
pathē*) — 13+ instances per A8 inventory. Verify A8 italicization
(whole-compound italics) on every instance. Also note that §1.2 introduces
the dual-resonance thesis; any residue of "dual-trace" terminology must
be caught (sweep was marked complete 2026-05-23 but verify).

Also note Task #19 (project-aristotelian-terminology-framework):
*orexis*-family terms (orexis, orektikon, epithymia, thymos, boulēsis)
must be Greek italicized in user prose with NO English gloss. Aristotle's
Greek consistent; Smith/Barnes ROT inconsistent (DA = old convention,
MA/Rhetoric = modern). §1.2 introduces *resonant epithymia* — verify
terminology compliance throughout.
```

---

## Notes on Using These Prompts

### Order of execution

- These two prompts are independent — can be run in either order, in parallel sessions, or sequentially.
- §1.3 is the exemplar; both sessions read §1.3's final state as model.
- §1.0 is also reasonably complete (per earlier retroactive sweep 2026-05-24 morning); not included in this batch but a similar prompt can be generated if needed.
- §1.4 has not yet been swept; can be next after §1.1 and §1.2.
- §1.5 has no `-v2.tex` yet — user will rewrite entirely after §§1.0–1.4 are clean.

### Expected per-session duration

Based on §1.3 sweep this afternoon:
- ~15 minutes session-start checklist reads
- ~20 minutes paragraph-by-paragraph audit + proposal composition
- ~10 minutes user review + approvals
- ~20 minutes application + TODO/memory updates
- **Total**: ~60–90 minutes per section

### If the session runs into trouble

- The new feedback memory `feedback-no-supplies-anchor-pattern.md` is freshly added (2026-05-24); if the new session somehow misses it, re-paste the relevant rule.
- Today's §1.3 sweep created backups at `.backups/2026-05-24T1329-pre-1.3-L97-to-L158-walkthrough/` and `.backups/2026-05-24T<HHMM>-pre-1.3-comprehensive-sweep/` — new sessions should follow the same naming pattern.
- If the new session asks scope questions covered by protocol, refer to REVISION-PROTOCOL.md Section 12.1 (Novel-case escape clause) — escape clause is for genuinely novel cases only, not for protocol-covered ones.

### After both sweeps complete

Update TODO_NOTES.md Section §1.2 walkthrough status from "COMPLETE 2026-05-23" to "MAJOR SWEEP COMPLETE 2026-05-XX" (mirrors §1.3 today). Likewise for §1.1.

Then §1.4 can be the next target (similar prompt structure; the §1.4 section has Q-items per TODO_NOTES.md to coordinate).


## PROMPT 1 — §1.1 Comprehensive Sweep

```
I need a comprehensive paragraph-by-paragraph sweep of §1.1 (A_0 — Motion
and Time as Ontological Horizon) following the same audit + apply workflow
the system just completed for §1.3 on 2026-05-24. Earlier per-paragraph
walkthroughs of §1.1 skipped paragraphs; this sweep is to catch every
convention violation, every NOTE TO SYSTEM marker, every typo, every
orphan footnote, every mechanical-batch item still pending.

Before any sweep work, execute the session-start checklist in this order:

1. Read tmp/Dissertation/REVISION-PROTOCOL.md end to end (canonical
   process rulebook; updated 2026-05-24 with new forbidden-phrase row in
   Section 4)
2. Read tmp/Dissertation/TODO_NOTES.md Section D (canonical content
   conventions) and Section H (failed-pattern log + session-degradation
   diagnosis) in full
3. Read ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
   session-degradation-remediation-2026-05-24.md in full
4. Read ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
   feedback-no-supplies-anchor-pattern.md (added 2026-05-24 after §1.3 B1
   work — forbids "supplies the canonical scholarly anchor for X" meta-
   narrative; just state what source says + how it supports the claim)
5. Read ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
   project-section-1-3-walkthrough.md (for §1.3 sweep exemplar status)
6. Read tmp/Dissertation/Working tex versions/1.1 - A0 - Motion and Time
   as Ontological Horizon-v2.tex end to end
7. Read tmp/Dissertation/Working tex versions/1.3 - A3 - Completed
   Cognitive Actuality and the Three Orientational Modes-v2.tex end to
   end — this is the finished-sweep state to model
8. Identify project phase: §1.1 comprehensive sweep (not fresh walkthrough,
   not capstone). Modeled on §1.3 afternoon-session sweep 2026-05-24.

Known pending items in §1.1 (from TODO_NOTES.md Section A.§1.1):
- L115 Rhetoric quote verification (user noted 2026-05-22: "I am almost
  positive the quotation from the Rhetoric is not verbatim with my
  version in the corpus." Verify against Roberts ROT in
  corpus/rhetorical_ontology/; replace with verbatim if drift confirmed)
- L127 Broadie 1982 quote — `****** UNVERIFIED` placeholder; user to
  supply verbatim text manually (Broadie not in corpus/rhetorical_ontology)
- L127 footnote interpretation — time/motion co-eternal (research note,
  user directive 2026-05-22): Aristotle holds time and motion are co-
  eternal; without rational soul, time exists because motion exists (as
  the number of motion). Need corroboration from Metaphysics and/or
  Physics for citational anchor. Remove final interpretive-move sentence
  from current L127 footnote.
- L129 footnote rewrite (user directive 2026-05-22): (1) remove
  translation-info opening; (2) include direct quotations rather than
  "the pertinent material is in the middle"; (3) the conceptual Heidegger
  work needs additional brief direct quotations for structural-homology
  grounding; (4) remove "The chapter's interpretive reading..." final
  sentences (meta-narrative pattern).
- L133 paraphrased Rhetoric I.11 quote at A_1 threshold — Confirmed
  paraphrase, not verbatim per Roberts ROT in corpus PDF; replaced with
  verbatim quote during §1.1 walkthrough but verify no residual
  paraphrase remains.

Known prior status:
- ✓ L87 fn BT fore-having quote correction APPLIED 2026-05-24 audit
- §1.1 was walked per-paragraph in earlier sessions (e.g., May 21–22)

THE SWEEP TASK:

Execute the following audit for EVERY paragraph + EVERY footnote in §1.1
(do NOT skip any):

1. Forbidden-phrase blacklist check (Section 4 of REVISION-PROTOCOL.md):
   - "rests on" / "underwrites" / "the dissertation's claim depends on"
   - "supervenient" / "supervenes on"
   - "§1.X has already developed/established" / "as we have seen at"
   - "faculty of X" (user prose, not direct quotes) → use Greek faculty-
     names (aisthētikon, orektikon, kritikon, kinētikon, etc.)
   - "this chapter" / "the chapter" → "section" / "subsection"
   - "at *Work* [locus]" inline → work-in-narrative, locus-in-parens
   - "dual-trace" → "dual-resonance"
   - German-first slips for Heidegger terms (English-first required)
   - "Framing:" / `\textit{Framing}:` footnote prefixes
   - "The chapter's interpretive reading" / "The present chapter's
     interpretive move"
   - "interpretive" qualifier on user's own readings
   - "Macquarrie-Robinson translation" signposting at footnote openings
   - "potency" / "act" → "potentiality" / "actuality" + Greek
     dynamis/energeia in parens
   - "supplies the [canonical/textual/philological] [anchor/ground/basis]
     for the X [reading/argument] [deployed here/articulated above]" (NEW
     2026-05-24 — just state what source says and how it supports claim)
   - Any meta-narrative phrasing about "the chapter" / "the dissertation"
     / "the project"

2. Mechanical-batch items (D1–D5 from §1.3 sweep):
   - D1 A7: file-wide *On the Soul* → *De Anima*, *On Memory* →
     *De Memoria*, *Movement of Animals* → *De Motu Animalium*
   - D2 A1: file-wide `\=e` → Unicode `ē`; targeted `kinesis` →
     `kinēsis`, `aisthema` → `aisthēma`, `aisthesis` → `aisthēsis`,
     `dunamis` → `dynamis`, `pathe` → `pathē`, etc.
   - D3 A8: coined "resonant X" compounds — italicize whole compound
   - D4 C2: bare `\cite{key}` → `\autocite[locus]{key}`
   - D5 BT citation full-format: "(BT §X, H.<page>; Eng. <page>)" —
     surface but defer to V1 capstone if locus unknown

3. Orphan footnotes — search for `\footnote{}` not attached to text
   (like the L101 and L162 orphans found in §1.3). Relocate to natural
   attachment point.

4. NOTE TO SYSTEM markers — search for "NOTE TO SYSTEM" or similar;
   propose resolutions with PDF-verified quotes where applicable.

5. Markup issues:
   - Broken nested-quote markup (look for ``X``Y'' or `X``Y' patterns)
   - Broken brackets `[(]` etc.
   - Missing closing quotes
   - Double-spaces in body text

6. Grammar/typo issues:
   - Spelling typos (presentating, simipliciter, "a see", "Heideger",
     "memory memory", appetitve, "this I", "with is", "case." vs ",",
     etc.)
   - Subject-verb agreement
   - Awkward grammar (e.g., "the decisive feature of which being that")
   - Dangling em-dashes
   - Missing words

7. Content/argument issues:
   - Quotations needing verification against corpus PDFs (flag for V1
     capstone if substantial)
   - Inline citations missing page numbers
   - Cross-section forward-references that need flagging

OUTPUT STRUCTURE:

Present findings as a structured proposal organized by severity:

## A. CRITICAL — needs user attention
- Orphan footnotes (with proposed relocation)
- Forbidden-phrase residue (with proposed substitutions)
- Dual-trace residue (with → dual-resonance proposal)

## B. HIGH — content gaps and broken markup
- NOTE TO SYSTEM markers with proposed PDF-verified resolutions
- Broken markup (nested quotes, brackets, missing closes)
- Content/argument issues
- Per-quote PDF verification flags

## C. MEDIUM — typos + double-space + grammar
- Listed in document order with OLD / NEW

## D. DEFERRED — forward-mechanical batches
- D1 A7 work-title sweep
- D2 A1 Greek-accent sweep
- D3 A8 italicization
- D4 C2 biblatex migration
- D5 BT citation format (V1 capstone)
- D6 V1 capstone PDF verification candidates

After presenting the proposal:

1. Wait for user category-by-category approval (or "all approved")
2. Create timestamped backup at
   tmp/Dissertation/Working tex versions/.backups/<timestamp>-pre-1.1-
   comprehensive-sweep/
3. Apply approved batches via Edit (use replace_all=true for file-wide
   mechanical batches; targeted Edits for content-specific changes)
4. Update tmp/Dissertation/TODO_NOTES.md (mark §1.1 items resolved;
   update Section H if new patterns slipped)
5. Update memory file (create
   project-section-1-1-walkthrough.md if doesn't exist; update if exists)
6. Confirm completion with structured summary

Begin with the session-start checklist. Confirm understanding with brief
status summary before beginning audit work. Use the §1.3 sweep proposal
structure as direct model.
```

---



---

**End of prompt file.**
