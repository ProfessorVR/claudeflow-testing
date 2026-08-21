# Clean-Session Prompt: §1.4 Comprehensive Sweep (with PHASE 1 user-flagged paragraphs FIRST)

**Generated**: 2026-05-24, after §1.2 and §1.3 comprehensive sweeps completed
**Purpose**: Self-contained prompt for §1.4 (Emotion: The Form of Desire Under Evaluative Disclosure) sweep
**Foundation**: `PROMPTS-FOR-1.1-AND-1.2-SWEEPS.md` (PROMPT 2 for §1.2 used as direct model)

**KEY DIFFERENCE FROM §1.1 / §1.2 PROMPTS**:
PHASE 1 (user-flagged paragraphs) MUST be worked through FIRST, BEFORE the comprehensive sweep (PHASE 2) begins. The system must explicitly pause after the session-start checklist and wait for the user to enumerate which paragraphs require complex work. Each flagged paragraph is handled in a proposal-approve-apply cycle. Only AFTER all user-flagged paragraphs are complete does the system proceed to PHASE 2 (comprehensive sweep modeled on §1.2/§1.3).

This ordering matters because §1.4 is the EMOTION section — heavy on substantive interpretive work (4-fold *pathos* register, articulational-concretion thesis, somatic preparation, feedback loop to *hexeis*). Substantive paragraph rewrites should happen FIRST so the comprehensive mechanical sweep operates on the user-finalized prose state, not on prose that will subsequently be rewritten.

**Workflow per prompt**:
1. PHASE 0: Session-start checklist (read all required protocol + memory files + the working `-v2.tex` file + §1.2 + §1.3 v2 as finished-sweep exemplars)
2. PHASE 0.5: Brief status summary; EXPLICITLY ASK user for paragraph flags
3. PHASE 1: User-flagged paragraphs — proposal → approval → apply, one paragraph at a time (or batched if user prefers)
4. PHASE 2: Comprehensive paragraph-by-paragraph audit (only after PHASE 1 complete)
5. PHASE 3: Categorized findings proposal (Critical / High / Medium / Deferred)
6. PHASE 4: User category-by-category approval
7. PHASE 5: Batched application via Edit
8. PHASE 6: Update TODO_NOTES.md + memory + protocol
9. PHASE 7: Confirm completion

---

## PROMPT — §1.4 Comprehensive Sweep (PHASE 1 First, Then PHASE 2)

```
I need a two-phase revision of §1.4 (Emotion: The Form of Desire Under
Evaluative Disclosure). PHASE 1 is per-paragraph collaborative work on
paragraphs I will flag; PHASE 2 is the comprehensive sweep modeled on
§1.2 and §1.3 completed 2026-05-24. DO NOT proceed to PHASE 2 until I
have signaled that PHASE 1 is complete.

═══════════════════════════════════════════════════════════════════════
PHASE 0: SESSION-START CHECKLIST (mandatory before any other action)
═══════════════════════════════════════════════════════════════════════

Execute the following reads in order:

1. Read tmp/Dissertation/REVISION-PROTOCOL.md end to end (canonical
   process rulebook; established 2026-05-24)
2. Read tmp/Dissertation/TODO_NOTES.md Section D (canonical content
   conventions) AND Section H (failed-pattern log + session-degradation
   diagnosis) in full
3. Read ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
   session-degradation-remediation-2026-05-24.md in full
4. Read ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
   feedback-no-supplies-anchor-pattern.md (added 2026-05-24 after §1.3
   B1 work — forbids "supplies the canonical scholarly anchor for X"
   meta-narrative; just state what source says + how it supports claim)
5. Read ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
   project-section-1-2-walkthrough.md (for §1.2 sweep precedent)
6. Read ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
   project-section-1-3-walkthrough.md (for §1.3 sweep precedent)
7. Read ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
   project-aristotelian-terminology-framework.md (Task #19 — CRITICAL
   for §1.4, the heaviest pathos/orexis user in the dissertation)
8. Read ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
   project-future-work-thinking-emotion-as-kinesis.md (DA I.4 408b5-7
   deployment item explicitly applicable to §1.4)
9. Read ~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/
   feedback-gross-advisor-citation-rigor.md (UTMOST PRIORITY: Gross
   citation/quote verification required for ANY Gross use — §1.4 has at
   least one direct Gross quote at L52 fn)
10. Read tmp/Dissertation/Working tex versions/1.4 - Emotion - The Form
    of Desire Under Evaluative Disclosure-v2.tex end to end
11. Read tmp/Dissertation/Working tex versions/1.2 - M0 to A1 - The
    Actualization of Aisthesis-v2.tex end to end — finished-sweep
    exemplar (one section before §1.4)
12. Read tmp/Dissertation/Working tex versions/1.3 - A3 - Completed
    Cognitive Actuality and the Three Orientational Modes-v2.tex end to
    end — finished-sweep exemplar (the section §1.4 immediately follows)
13. Identify project phase: §1.4 hybrid revision (PHASE 1
    per-paragraph user-flagged work + PHASE 2 comprehensive sweep).

═══════════════════════════════════════════════════════════════════════
PHASE 0.5: STATUS SUMMARY + EXPLICIT WAIT FOR USER FLAGS
═══════════════════════════════════════════════════════════════════════

After completing PHASE 0 reads, present a brief status summary
(< 200 words) including:

- File state (line count, word count, brace balance)
- Subsection structure (the 9 subsections + 2 subsubsections of §1.4)
- Known pending items from TODO_NOTES.md Section A.§1.4 (e.g., DA I.4
  408b5-7 deployment, L112 pathos-register tightening per Task #19)
- Heaviest patterns observed in §1.4 (pathos/pathē density, orexis-family
  density, hexis/hexeis density, BCAP/BT footnote density, Gross
  occurrence count)
- Any pre-existing tracking notes for §1.4

Then EXPLICITLY pause with the following message:

  "PHASE 0 complete. PHASE 2 sweep is on HOLD pending PHASE 1 user-
  flagged paragraphs. Please enumerate the paragraphs requiring complex
  work (footnote rewrites, paragraph rewrites, new quotation inclusions,
  research lookups, structural reorganization, conceptual development).
  I will work through each in a proposal-approve-apply cycle. When all
  flagged paragraphs are complete, signal `proceed to PHASE 2` to
  initiate the comprehensive sweep."

DO NOT proceed to PHASE 2 until I explicitly signal `proceed to PHASE 2`.
DO NOT attempt to auto-detect paragraphs needing complex work and run
PHASE 2 unilaterally. The PHASE 1 user-flagged work is the priority and
must happen first.

═══════════════════════════════════════════════════════════════════════
PHASE 1: USER-FLAGGED PARAGRAPHS (one cycle per paragraph)
═══════════════════════════════════════════════════════════════════════

For each paragraph I flag, execute this cycle:

1. Identify the deliverable type (footnote rewrite, paragraph rewrite,
   new quotation insertion, research lookup, structural reorganization).
2. Conduct any necessary corpus research FIRST (before drafting):
   - For Aristotle quotes: consult corpus/index/ FIRST, then
     corpus/rhetorical_ontology/<work>.pdf
   - For Heidegger BCAP/BT quotes: consult
     corpus/rhetorical_ontology/Heidegger - Basic Concepts of
     Aristotelian Philosophy*.pdf or .../Being and Time*.pdf
   - For Gross quotes: corpus/rhetorical_ontology/Gross*.pdf — UTMOST
     PRIORITY rigor per Task #18 (read entire chapters as needed)
   - For Withy / Hawhee / Caston / Corcilius secondary sources: check
     corpus/index/ first, then corpus/rhetorical_ontology/ if available
3. Articulate the convention being applied (state explicitly).
4. Draft the proposal as LaTeX-ready text with:
   - Paragraph reference (line number + content anchor)
   - Convention applied
   - Source verification status (PDF-verified, corpus-index-verified,
     UNVERIFIED with reason, etc.)
   - Proposed text (LaTeX-ready)
   - Brief rationale
5. Wait for my approval, revision, or rejection.
6. Apply approved changes via Edit tool.
7. Briefly confirm application and signal ready for next flagged item.

After all flagged paragraphs are complete, I will signal `proceed to
PHASE 2`. Do not assume PHASE 1 is done; wait for my signal.

═══════════════════════════════════════════════════════════════════════
PHASE 2: COMPREHENSIVE SWEEP (only after PHASE 1 signal)
═══════════════════════════════════════════════════════════════════════

Execute the following audit for EVERY paragraph + EVERY footnote in
§1.4 (do NOT skip any; account for the fact that §1.4 has 9 subsections
+ 2 subsubsections, ~206 lines):

1. Forbidden-phrase blacklist check (Section 4 of REVISION-PROTOCOL.md +
   recent additions). This is FILE-WIDE scope per Section 5.1 advisor-
   prose patterns table; do NOT enumerate specific known instances and
   stop there — run a complete file-wide grep for each pattern:
   - "rests on" / "underwrites" / "the dissertation's claim depends on"
   - "supervenient" / "supervenes on"
   - "§1.X has already developed/established" / "as we have seen at"
   - "faculty of X" (user prose, not direct quotes) → use Greek faculty-
     names (aisthētikon, orektikon, kritikon, kinētikon, etc.)
   - "this chapter" / "the chapter" → "section" / "subsection"
   - "at *Work* [locus]" inline → work-in-narrative, locus-in-parens
   - "dual-trace" → "dual-resonance" (verify no residue from inheritance
     of §1.2's terminology)
   - German-first slips for Heidegger terms (English-first required)
   - "Framing:" / `\textit{Framing}:` footnote prefixes
   - "The chapter's interpretive reading" / "The present chapter's
     interpretive move"
   - "interpretive" qualifier on user's own readings
   - "Macquarrie-Robinson translation" signposting at footnote openings
   - "potency" / "act" → "potentiality" / "actuality" + Greek
     dynamis/energeia in parens
   - "supplies the [canonical/textual/philological] [anchor/ground/basis]
     for the X [reading/argument] [deployed here/articulated above]"
     (NEW 2026-05-24 — just state what source says and how it bears on
     claim)
   - Any meta-narrative phrasing about "the chapter" / "the dissertation"
     / "the project" / "the present section"
   - **CRITICAL LEARNING FROM §1.2 SWEEP**: do NOT enumerate
     instances in proposal then stop. Run a comprehensive file-wide
     grep for EACH pattern; in the proposal explicitly state "file-wide
     scope: N instances found across [list]". Section H 2026-05-24
     logged TWO §1.2 slips from enumeration-then-stop: L69 fn
     "underwrites" and L113 fn "supplies partial textual support" both
     escaped initial proposal scope.

2. Mechanical-batch items (D1–D5 from §1.3 / §1.2 sweeps):
   - D1 A7: file-wide *On the Soul* → *De Anima*, *On Memory* →
     *De Memoria*, *Movement of Animals* → *De Motu Animalium*,
     *On Dreams* → *De Insomniis*, *Sense and Sensibilia* → *De Sensu*
     (the §1.2 sweep extended the §1.3 set to include the latter two;
     §1.4 should follow the §1.2 expanded set for cross-section
     consistency)
   - D2 A1: file-wide `\=e` → Unicode `ē`; targeted `kinesis` →
     `kinēsis`, `aisthema` → `aisthēma`, `aisthesis` → `aisthēsis`,
     `dunamis` → `dynamis`, `pathe` → `pathē` (NB: §1.4 has 33+ `pathē`
     instances — verify all are Unicode macron form), etc.
   - D3 A8: coined "resonant X" compounds — italicize whole compound
     (§1.4 inherits *resonant epithymia* terminology from §1.2; verify
     A8 form throughout). NOTE: §1.4 may also introduce *resonant pathē*
     (the live re-engagement of past pathē-content per §1.2 L113 fn);
     verify A8 form on any such coinage.
   - D4 C2: bare `\cite{key}` → `\autocite[locus]{key}`
   - D5 BT citation full-format: "(BT §X, H.<page>; Eng. <page>)" —
     surface but defer to V1 capstone if locus unknown
   - D6 (NEW): *De Insomniis* / *De Sensu* / *De Anima* / *De Memoria*
     work-title consistency across §1.4 footnotes — flag any English-
     form residues for D1 batch

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
   - Curly apostrophes vs straight apostrophes (LaTeX prefers ` and ')

6. Grammar/typo issues — full pass through every paragraph.

7. Content/argument issues SPECIFIC TO §1.4:
   - **L52 fn Gross "Heidegger and Rhetoric" (ed. Gross & Kemmann,
     SUNY 2005) p. 4 quote** — UTMOST PRIORITY Gross-rigor
     verification per Task #18. Verify verbatim text + page locus
     against corpus/rhetorical_ontology/Heidegger and Rhetoric*.pdf
     introduction chapter. Confirm Daniel Gross is the author of the
     introduction (he is also volume co-editor).
   - **L54 fn citation discrepancy** — paragraph says "Caston's
     analysis of *De Anima* I.4, 408b1--18 clarifies what is at
     stake..." but the parenthetical citation reads "(Corcilius,
     ``Aristotle's Definition of Non-Rational Pleasure,'' 2013, p.~54)".
     This is a SOURCE-ATTRIBUTION ERROR (attribution to Caston in
     narrative but citation is to Corcilius). Either (a) the quote is
     from Corcilius and the narrative attribution to Caston is wrong,
     or (b) the quote is from Caston and the parenthetical citation
     is wrong. Verify against both PDFs and flag for user resolution
     (do NOT silently correct).
   - **DA I.4 408b5-7 deployment** — Per
     `project-future-work-thinking-emotion-as-kinesis.md`: the
     three-factor schema of motion (mover/means/moved) applies
     directly to higher-order *pathē* and *orektikon* motion
     ($M_3 \rightarrow A_4$) via DA I.4 408b5-7 ("being pained or
     pleased, or thinking" as movements of ensouled being). Deploy
     inline (not footnote) at the appropriate $M_3 \rightarrow A_4$
     transition point. Confirm placement with user before drafting.
   - **L112 pathos-register tightening** — Per TODO_NOTES Section
     A.§1.4: make the orectic-species dimension of higher-order
     *pathē* explicit per Task #19 + `project-aristotelian-terminology-
     framework.md`. The four-fold pathos register (Met Δ.21 broad,
     perceptual, harm-narrow, harm-magnitude) should map onto orectic
     species (epithymia vs thymos vs boulēsis) at the higher-order
     *pathē* level — make explicit which species mobilizes which kind
     of pathos. Likely a paragraph-rewrite candidate.
   - Quotations needing verification against corpus PDFs (Rhetoric II
     catalog of pathē at L139 / L141 / L143 region; BCAP §17-18 quotes
     at L52 / L62 / L84+; Withy 2023 Heidegger on Being Affected p. 3
     at L52 fn; Hawhee Rhetoric III.11.1412a.9-10 at L52 fn footnote;
     Struever Alltäglichkeit GA 18 p. 287 at L52 fn footnote — each
     for V1 capstone flag; do not pre-verify unless user activates)

8. Q5 trace tally update for §1.4 (TODO baseline scan: 3 occurrences;
   update per actual file state).

OUTPUT STRUCTURE (PHASE 2 proposal):

Present findings as a structured proposal organized by severity:

## A. CRITICAL — needs user attention
- Orphan footnotes (with proposed relocation)
- Forbidden-phrase residue (full file-wide grep results enumerated)
- German-first slips (full file-wide grep)
- "the chapter/this chapter" residue (full file-wide grep)
- back-references (full file-wide grep)
- supplies-anchor variants (full file-wide grep — every instance, not
  just enumerated set)
- underwrites / rests on (full file-wide grep)

## B. HIGH — content gaps, broken markup, source-attribution issues
- L54 fn citation discrepancy (Caston attribution / Corcilius citation)
- L52 fn Gross UTMOST PRIORITY verification (need PDF read)
- DA I.4 408b5-7 deployment (placement decision needed)
- L112 pathos-register tightening (paragraph rewrite candidate)
- NOTE TO SYSTEM markers with proposed PDF-verified resolutions
- Broken markup
- Per-quote PDF verification flags

## C. MEDIUM — typos + double-space + grammar
- Listed in document order with OLD / NEW

## D. DEFERRED — forward-mechanical batches
- D1 A7 work-title sweep (5-title set including §1.2-added titles)
- D2 A1 Greek-accent sweep
- D3 A8 italicization (verify resonant compounds + flag any *resonant
  pathē* if introduced)
- D4 C2 biblatex migration
- D5 BT citation format (V1 capstone)
- D6 V1 capstone PDF verification candidates (Rhetoric II + BCAP +
  Withy + Hawhee + Struever — substantial list)

═══════════════════════════════════════════════════════════════════════
PHASE 3-7: STANDARD APPLICATION WORKFLOW
═══════════════════════════════════════════════════════════════════════

After presenting the PHASE 2 proposal:

1. Wait for user category-by-category approval (or "all approved")
2. Create timestamped backup at
   tmp/Dissertation/Working tex versions/.backups/<timestamp>-pre-1.4-
   comprehensive-sweep/
3. Apply approved batches via Edit (use replace_all=true for file-wide
   mechanical batches; targeted Edits for content-specific changes)
4. POST-APPLICATION self-audit greps for forbidden patterns FILE-WIDE
   (per §1.2 sweep learning: enumerate-then-stop fails; the
   pattern-not-paragraph rule applies to the sweep proposal itself).
   Report 0-result greps as "verification clean" rather than skip.
5. Update tmp/Dissertation/TODO_NOTES.md:
   - Mark §1.4 items resolved in Section A.§1.4
   - Update §1.4 walkthrough status to "MAJOR SWEEP COMPLETE"
   - Add to Section C any verification discrepancies found (e.g.,
     L54 Caston/Corcilius attribution if unresolved)
   - Add to Section H any new pattern slips caught
6. Create memory file project-section-1-4-walkthrough.md (does not yet
   exist) with full sweep diff, PHASE 1 items applied, PHASE 2 items
   applied, B1 Gross-rigor finding if relevant.
7. Update memory/MEMORY.md top-line with new §1.4 sweep entry above
   the §1.2 entry.
8. Confirm completion with structured summary (modeled on §1.2 sweep
   completion report from 2026-05-24).

Begin with PHASE 0 session-start checklist. Confirm understanding with
the brief status summary from PHASE 0.5, then EXPLICITLY pause and wait
for my user-flagged paragraphs before doing anything else. Do not begin
PHASE 2 audit work in parallel with PHASE 1 — PHASE 1 work must
complete first, fully.

═══════════════════════════════════════════════════════════════════════
SPECIAL NOTES FOR §1.4
═══════════════════════════════════════════════════════════════════════

§1.4 is the EMOTION SECTION and the heaviest user of the pathos / orexis
/ hexis Greek register in the dissertation. Counts from the pre-sweep
file: ~33 pathē + ~36 pathos + ~8 epithymia + ~8 orexis + ~7
hexis/hexeis. Task #19 (project-aristotelian-terminology-framework)
conventions are accordingly CRITICAL throughout.

**Task #19 reminders specifically critical for §1.4**:
- *Orexis*-family terms (orexis, orektikon, epithymia, thymos, boulēsis)
  must be Greek italicized in user prose, NO English gloss. Aristotle's
  Greek is consistent (orexis = genus); Smith/Barnes ROT translation is
  inconsistent (DA = old convention "appetite," MA/Rhetoric = modern
  "desire"). Preserve Greek throughout user prose; quoted material
  keeps translator's English (e.g., "appetite" in quoted Smith).
- *Pathos* / *pathē* / *pathē-as-kinēsis* register: §1.4's central
  thesis is that *pathos* is *kinēsis* (a being-moved). The 4-fold
  Met Δ.21 register (alterability / actuality of alteration / harmful
  / magnitude of harm) maps onto 4 articulational concretions of the
  same single *pathos* ontological structure. Higher-order *pathē* of
  the Rhetoric II catalog are the doxa-mediated maximal articulation;
  basic affective valence (epithymia / resonant epithymia from §1.2) is
  the perceptual-level minimal articulation. Sweep must preserve this
  articulational-distinction architecture.
- The 4-fold *pathos* register noted in MEMORY.md:
  basic hedonic tonality + orectic-species + propositional krisis +
  bodily alteration. Higher-order *pathē* couple all four; bare
  *epithymia* couples only the first two (per §1.2 fn analysis).

**Heidegger BCAP register**: §1.4 leans heavily on BCAP §§15-18
(rhetoric, pathos, logos, doxa). Quotation-preservation convention
applies (verbatim including punctuation, italics, nested quote marks
per established Heidegger-preservation rule).

**Gross-rigor (UTMOST PRIORITY)**: §1.4 L52 fn quotes Daniel Gross
(Heidegger and Rhetoric ed. Gross & Kemmann, SUNY 2005, p. 4). The
B1-style Gross verification is MANDATORY: read corpus/rhetorical_ontology/
Heidegger and Rhetoric*.pdf introduction chapter, verify verbatim text
+ page locus, NOT silently correct any discrepancy. Per §1.2 sweep
precedent: the (Gross 22-23) → (Gross 20) citation correction at §1.2
L57+L115 fns was a B1 finding that surfaced via the same protocol; the
§1.4 L52 fn deserves identical rigor.

**L54 fn source-attribution discrepancy**: the paragraph attributes a
quote to "Caston's analysis of *De Anima* I.4, 408b1--18" but the
parenthetical citation reads "(Corcilius, ``Aristotle's Definition of
Non-Rational Pleasure,'' 2013, p.~54)". Either the attribution or the
citation is wrong. Verify against both Caston and Corcilius PDFs (if
available in corpus); flag for user resolution. Do not silently
correct.

**Heavy footnote density**: §1.4 L52 fn (Gross+Struever+Withy
multi-source compound footnote), L54 fn (Caston/Corcilius), L62 fn
(BCAP p. 125 hexis), L64 fn (Caston+Gonzalez articulational-concretion
grounding) — each is a substantial integrationally-rich footnote
needing full audit. Likely PHASE 1 flag candidates.

**§1.4-specific cross-section dependencies**:
- §1.2's dual-resonance thesis + *resonant epithymia* terminology
  inherited into §1.4
- §1.3's *doxa*-as-orthogonal-committal-dimension inherited as the
  articulational-concretion mechanism in §1.4
- §1.5's *hexis* / *hexeis* / settled-disposition cluster previewed in
  §1.4 feedback-loop section (L119+ region) — §1.5 has no v2 yet so
  forward-references should NOT preempt §1.5 content, but the §1.4
  feedback-loop section must be terminologically consistent with §1.3
  L83 fn (the "frequently of repetition" anchor) which §1.5 will
  develop.

**Backup naming convention**: per §1.2 precedent, use
.backups/<timestamp>-pre-1.4-comprehensive-sweep/ for PHASE 2
application. For PHASE 1 paragraph-rewrites, optionally backup per-
paragraph with .backups/<timestamp>-pre-1.4-L<line>-rewrite/ — at user
preference (some PHASE 1 items may not warrant full file backup).

**Failed-pattern carry-forward**: log any §1.4 pattern slips to
TODO_NOTES.md Section H using first-instance-then-tally rule (Section
10.1 of REVISION-PROTOCOL.md). The two §1.2 self-audit catches
(L69 fn underwrites, L113 fn supplies-anchor-variant) are the most
recent slip-pattern entries; verify §1.4 sweep does not repeat them.
```

---

## Notes on Using This Prompt

### Order of execution

- This is the §1.4 prompt; §1.1, §1.2, §1.3 sweeps already complete (2026-05-24)
- §1.5 has no `-v2.tex` yet — user will rewrite entirely after §§1.0–1.4 are clean. §1.5 is therefore the NEXT target after §1.4 — but in CONSTRUCTION mode, not sweep mode (because it is being rewritten from scratch).

### Expected per-session duration (longer than §1.2 because of PHASE 1)

- ~20 minutes PHASE 0 session-start checklist reads (more reads than §1.2 prompt because §1.4 inherits cross-section dependencies)
- VARIABLE PHASE 1 duration — depends entirely on number of user-flagged paragraphs + complexity of each
- ~25 minutes PHASE 2 comprehensive audit + proposal composition
- ~15 minutes PHASE 3-4 user category-by-category review + approvals
- ~25 minutes PHASE 5-7 application + post-audit + TODO/memory updates
- **Total**: PHASE 0 + PHASE 2 + PHASE 3-7 = ~85 minutes minimum; + PHASE 1 = variable on top

### Phase boundary discipline

- PHASE 0.5 EXPLICIT PAUSE is critical. The system must not auto-detect "PHASE 1 candidates" and proceed unilaterally. Wait for user enumeration.
- PHASE 1 → PHASE 2 transition requires explicit user signal (`proceed to PHASE 2` or equivalent). The system must not assume completion.
- Within PHASE 1, each paragraph cycle ends with user approval; do not chain multiple PHASE 1 paragraphs without per-paragraph approval (unless user explicitly batches).

### Cross-session anchoring

- If the session runs into trouble:
  - The feedback memory `feedback-no-supplies-anchor-pattern.md` is recently added (2026-05-24); if the new session somehow misses it, re-paste the relevant rule.
  - §1.2 sweep created backup at `.backups/2026-05-24T1632-pre-1.2-comprehensive-sweep/` — new §1.4 sweep should follow the same naming convention.
  - If the new session asks scope questions covered by protocol, refer to REVISION-PROTOCOL.md Section 12.1 (Novel-case escape clause) — escape clause is for genuinely novel cases only, not for protocol-covered ones (and PHASE 1 vs PHASE 2 ordering is explicitly covered by this prompt, not a novel case).

### After §1.4 sweep complete

- Update TODO_NOTES.md §1.4 walkthrough status to "MAJOR SWEEP COMPLETE 2026-05-XX" (mirrors §§1.1, 1.2, 1.3).
- Create `memory/project-section-1-4-walkthrough.md` (does not exist yet).
- Update `memory/MEMORY.md` top-line entries.
- **Next target**: §1.5 construction (separate workflow — not a sweep, since the file does not exist yet; user will compose §1.5 from scratch drawing on §1.4 feedback-loop hand-off + §1.3 L85 BCAP p. 129 "frequently of repetition" anchor + §§1.0-1.4 *hexis* / *hexeis* / settled-disposition material).

---

**End of prompt file.**
