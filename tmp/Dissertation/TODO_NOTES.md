# Dissertation TODO Notes — Living Document

**Purpose**: Companion to `DISSERTATION-CLEANUP-TODO.md` (structured 17+ task list). Captures future-work notes, verification discrepancies, workflow preferences, and other tracked items that don't fit cleanly into the main TODO's task-list format. Updated incrementally during walkthroughs.

**Companion documents**:
- `REVISION-PROTOCOL.md` — **CANONICAL WORKFLOW RULEBOOK** (read every session; covers turn structure, audit cycle, pattern-not-paragraph scope, forbidden-phrase blacklist, session-start checklist)
- `DISSERTATION-CLEANUP-TODO.md` — main structured TODO list (A1–A8 + Q1–Q5 + Execution Sequence)
- `GLOSSARY.md` — load-bearing Greek/German term register
- `verbatim_passages.md` — verified verbatim quotation register (V1 source-of-truth)
- `DEFERRALS-AND-FORWARD-ORIENTATIONS.md` — archived "Deferrals" subsections from main files
- `HANDOFF-DISSERTATION-REVISION-2026-05-22-EOD.md` — most recent EOD handoff

**Last updated**: 2026-05-24 (added §1.0 retroactive sweep, verbatim audit, §1.3 walkthrough-in-progress, session-degradation diagnosis + remediation protocol)

> **⚡ CURRENT — 2026-05-28 (READ FIRST):** §1.5 v3 substantive revision COMPLETE; chapter-wide §§1.0–1.4 ripple PARTIAL (un-frozen this session). **DONE on v3** (all compile xelatex exit 0): **§1.5** four-category recast / §6 D3 / Struever-p.109 / D10 / §5 dark-alley / node-macron norm (14 pp); **DMA-"affections"** §1.1 L55 fn + §1.4 L113/L115; **prohairesis-intro** §1.0 L101 + §1.3 L91 (NE III.3 1112b11–16) + §1.4 L199; **"civic passions" definitional anchors** §1.0 L101 fn + §1.4 L54 (user-supplied); **§§1.0–1.3 *pathē* rename** 17 edits applied (incl. *resonant pathē*→*resonant passion* at §1.2 L113 fn). **§§1.4–1.5 *pathē* rename — USER WILL HANDLE THE REMAINDER themselves** (2026-05-28 directive). **CLEANUP:** §1.5 DoxaGate markers cleaned (`05-DoxaGate` → `05-DoxRatification` ×3 + bonus L58 `04-ThreeTypes`→`04-FourTypes` drift fix); **A2 em-dash sweep DONE** — 247 spaced em-dashes fixed across all 6 v3 files (§1.0 8 · §1.1 59 · §1.2 71 · §1.3 21 · §1.4 40 · §1.5 48); 0 remaining; all compile. Backup `.backups/2026-05-28T-pre-emdash-sweep/`. **Master TODO A1 + A2 + A7 + Q4 marked DONE.** **Q4 (Hexis ≠ Doxa) APPLIED**: rule corrected (doxa is taking-as-true, NOT a species of hexis); cross-file "settled *doxa*/*doxai*" → "held *doxa*/*doxai*" sweep done; 9 fixes applied across §1.0 (diagram code + Type-3 label + comments), §1.3 (L93 fn rewrite + L85 settled→held), §1.4 (L201 heavy rewrite: "doxa is technē-grounded" framing replaced with "hexis conditions doxa-formation by shaping how phantasma appears" + temperance/courage clarifying example), §1.5 (L179 settled→held + L210 "settled procedural doxa" → "*technē* (hexis of production, *poiēsis*)"). §1.5 L186 canonical correct formulation preserved as model. All 4 affected files compile clean. Review list at `tmp/Dissertation/Q4-hexis-doxa-audit.md`. Full state → **`SITREP-1.5-v3-2026-05-27.md`** (UPDATE 2026-05-28 blocks).

---

## A. Future Work — by Section

### §1.0 (Introduction)

#### ✓ COMPLETED 2026-05-24: §1.0 retroactive sweep
- A_0 reframes applied at L78, L95, L97, L99, L101 ("ontological horizon of *being-in-motion-and-time*", "dyad of sensible object + faculty of sense")
- "chapter" → "section" sweep applied (5 instances)
- SZ → BT sweep applied
- L67 footnote corrected: Stambaugh quote replaced with M&R verbatim BT §72 H.374 ("Dasein does not fill up a track or stretch \`of life'..." replacing Stambaugh translation)

#### Pending in §1.0:
- **L74/L76 methodology twofold-project statement** — Needs updating to match §1.1 L55 (synchronic + diachronic registers, *hexeis* as diachronic mechanism). Deferred from §1.0 sweep 2026-05-23; better as walkthrough than mechanical sweep.
- **L91 footnote ("analogical extension" qualification)** — Conflicts with the now-stronger direct-application reading established at §1.0 L93 footnote and applied at §1.2 L51. Decision pending: either remove the analogical qualification entirely (replacing with direct-application supported by DA II.5 416b33–417a1, DA III.3 429a1–2, DA I.4 408b5–7), or reframe it as conceding the locomotive default while noting the direct-application warrant for psychic motions. See `project-future-work-thinking-emotion-as-kinesis.md`.
- **Diagram TikZ inline** — Lines 206, 315, 437, 521, 702 retain old A_0=motion-time labelling. Task #20 cascading-rename sweep pending (M_2→A_3 "Cognitive Engagement"→"Cognitive Motion" applied to memory + v8 LaTeX but not v7 prose-inline TikZ).
- **Rename "pathos feedback loop" → "*pathetic* loop" retroactive cross-section sweep** (user directive 2026-05-24 PHASE 1 §1.4 walkthrough). §1.4 renamed in 2026-05-24 PHASE 1: the concept-name now reads *pathetic loop* throughout §1.4's subsection (formerly "The Feedback Loop"). §1.0 grep surfaces 2 instances at L531 + L685 — both TikZ diagram comments (`%` prefixed), not rendered prose; needs visual TikZ-render verification to determine whether any "Feedback Loop" labels appear in the rendered diagram and need updating. Other sections (§§1.1, 1.2, 1.3, 1.5) have 0 instances per cross-file grep (2026-05-24); cross-section consistency requires §1.0 diagram check + §1.5 construction-phase use of the new *pathetic loop* terminology.

### §1.1 (A_0 — Motion and Time as Ontological Horizon)

#### ✓ COMPLETED 2026-05-24: L87 footnote correction
- BT fore-having quote corrected via verbatim audit: "In every case this interpretation is grounded in *something we have in advance*---in a *fore-having*" (M&R, with "this" + italics restored)

#### ✓ COMPLETED 2026-05-24: §1.1 comprehensive sweep
- **Backup**: `.backups/2026-05-24T1541-pre-1.1-comprehensive-sweep/`
- **File now**: 136 lines (unchanged from start, no orphan footnotes, no markup breaks)
- **A1 forbidden-phrase**: L53 "rests on" → "is grounded in"
- **A2 chapter→section** (3): L87 main, L87 Gadamer fn, L113 main (preserved L71 fn "chapter-title" as legitimate BCAP §26 book-internal reference)
- **A3 interpretive-qualifier removal** (2): L87 fn opener rewritten (drops "is the substantive interpretive claim of this section" meta-claim + "the structural homology is supported by" → "the projection-schemas operate"); L127 main "stronger interpretive reading" → "stronger reading"
- **A4 SZ→BT + M-R drop** at L113: main "(SZ §81, H.421; Eng.~M-R p.~473)" → "(BT §81, H.421; Eng.~473)"; fn "(M-R p.~473)" ×2 → "(Eng.~473)" ×2
- **A5 faculty of X → Greek faculty-names** (5): L51 main ×2 "the faculty of sense" → "the *aisthētikon*"; L51 *orektikon* gloss "faculty of desire" dropped; L55 "the faculty through which" → "that through which"; L79 main "faculty of sense" → "*aisthētikon*"
- **A6 German-first sweep** (9 patterns, alt-glosses dropped per user "drop alternative glosses for terseness"): *Seinscharakter*, *Bewegtheit* (×2 incl. fn — Metcalf-Tanzer translator-info dropped), *Sorge* (combined with B6 §41 → parens), *Vorhabe*/*Vorsicht*/*Vorgriff*, *Innerzeitigkeit* (incl. innertimeness alt dropped), *Zeitlichkeit*, *Geschichtlichkeit*, *Ekstasen* (standings-outside alt dropped), *Gewesenheit*/*Gegenwart*/*Zukunft* (all alt-glosses dropped)
- **B3 Greek gloss-drop** (~12, KEEP energeia ateles + entelecheia + "the now" as strictly-needed): L51 *phantasia*; L53 *ousia*, *telos*; L55 *aisthēsis*/*noēsis*/*phantasia*/*orexis*/*pathē* (5-term batch); L65 *energeia*/*dynamis* (2); L95 *poiēsis*/*pathēsis* (2); L97 *aisthēsis*
- **B4 back-ref cleanup**: L97 fn "§1.0 L74" → "§1.0"
- **B5 + B6 inline-locus → parens** (extended per user reaffirmation): L71 main BT §41 (with *Sorge*), L71 main BT §68 (dropped from narrative, parenthetical retains); L97 fn ×3 restructured ("*De Anima* II.5... develops" → "Aristotle develops... in *De Anima* (II.5, ...)"; "given at *De Anima* III.2..." → "given in *De Anima* (III.2, ...)"); L99 main BT §18 inline dropped (parens retains); L123 fn (parallel) "at *Physics* IV.14" → "(*Physics* IV.14)"; L127 fn Coope "at *Time for Aristotle...*" → "Coope, in *Time for Aristotle...*, defends..."; L129 fn §74 dropped from narrative (parens retains); L133 main "At *Kant and the Problem of Metaphysics* §35" → "In *Kant and the Problem of Metaphysics* (§35)"
- **B7 *Metaphysica* → *Metaphysics*** (2): L53 footnotes normalized to file-consistent English form
- **B12 L129 fn structural-homology grounding addition** (per user "add grounding"): appended sentence linking §§66–68 derivation of *Innerzeitigkeit* to Aristotle's soul-as-counter at categorial-structural level (vs. circumspective concern at existential-ontological level)
- **B2 markup fix WITHDRAWN**: L113 4-backticks preserved per GLOSSARY-documented Heidegger quotation-preservation convention (nested-double pattern is verbatim Heidegger usage, not broken markup)
- **GLOSSARY updates**: added *aisthētērion*, *kinētikon*, *phantastikon* (completing Greek faculty-names set per user A5 directive); added *Gegenwart*, *Geschichtlichkeit*, *Gewesenheit*, *Zukunft*, *Ekstasen*, *Vorhabe*, *Vorsicht*, *Vorgriff* (Heideggerian terms newly introduced in §1.1)

#### Pending in §1.1 (V1 capstone + user-input):
- **L117 Rhetoric I.11 block quote verification** (user flagged 2026-05-22 as "almost positive not verbatim"): defer to V1 capstone PDF cross-check against Roberts ROT in `corpus/rhetorical_ontology/`
- **L127 footnote: Broadie 1982 quote** — `****** UNVERIFIED` placeholder remains; user to supply verbatim text manually
- **L127 footnote final-sentence-removal** (user 2026-05-23 directive): user chose B8 "leave as is" during 2026-05-24 sweep — interpretive-move sentence about Met/Phys corroboration + geometer analogy preserved per user instruction
- **L133 paraphrased Rhetoric I.11 quote at A_1 threshold** — defer V1 capstone PDF verification to confirm no residual paraphrase
- **~30 V1 capstone quotation candidates** — flagged for verbatim verification at V1 capstone pass (BT §32, §65, §68, §74; *Metaphysics* IX.6, IX.8, IX.9, XI.6, XII.6; *Physics* III.1, III.2, III.3, IV.11, IV.12, IV.14, V.1; *De Anima* II.1, II.3, II.5; BCAP §26; Gadamer 60; Michalski 72; Pöggeler 169; Hawhee 154; Coope 160, 162; Taft KPM §35 pp.~137, 141; Frede 285; Struever GA 18 p.~287)

#### Forward-work items not user-activated in §1.1:
- DA I.4 408b5–7 deployment — Per `project-future-work-thinking-emotion-as-kinesis.md`; cognitive motion three-factor schema direct application
- BT citation full-format completion: some BT cites missing Eng. pagination (L71 BT §68b H.342; L87 BT §32 H.150 mid-paragraph; L87/L99 ranges) — defer to V1 capstone BT page-number sweep per existing Section D protocol

### §1.2 (M_0 → A_1: The Actualization of *Aisthēsis*)

#### Walkthrough status — MAJOR SWEEP COMPLETE 2026-05-24

- **Backup**: `.backups/2026-05-24T1632-pre-1.2-comprehensive-sweep/`
- **File**: 152 lines (was 153 pre-sweep, -1 from L55 fn meta-narrative trim); 10,385 words; 576 / 576 braces balanced
- **CRITICAL items applied**:
  - A1 supplies-anchor rewrites at L111 fn (Caston), L115 fn (Rickert), L121 fn (Nussbaum/Caston); L57 fn kept per user "leave as is"
  - A2 back-references dropped at L75 main ("§1.1 established" → "Aristotle states") + L137 main ("established in §1.1" + "same-chain identity" → "warrants treating ... as one chain rather than two" / "That the two are one chain rather than two")
  - A3 German-first slips at L55: `\textit{Geworfenheit}` (`thrownness') → `thrownness (\textit{Geworfenheit})`; `\textit{Befindlichkeit}` → `disposedness (\textit{Befindlichkeit})`
  - A4 L135 "the chapter" → "this section"
  - A5 L57 main "underwrites" → "supports"
  - A6 L51 "active potency" → "active potentiality (\textit{dynamis})"
  - **Self-audit catch (post-application)**: L69 fn "underwrites" → "grounds" (file-wide scope per Section 5.1 advisor-prose patterns; missed in initial proposal — see Section H slip log)
  - **Self-audit catch (post-application)**: L113 fn "supplies partial textual support for affective-kinetic persistence" → "In *De Memoria* (453a14--32) Aristotle describes the kinetic persistence of already-excited anger and terror; the dual-resonance thesis generalizes this affective-kinetic persistence to..." (file-wide supplies-anchor scope; missed in initial proposal)
- **HIGH items applied**:
  - B2 L57 fn missing 's possessive: "the present section Aristotelian-hylomorphic reading" → "the present section's Aristotelian-hylomorphic reading"
  - B3 L55 fn meta-narrative trim: removed "The present footnote anchors the convention for the pair \textit{Befindlichkeit} and \textit{Stimmung}, whose translations diverge most consequentially from Macquarrie \& Robinson's standard renderings; " sentence-opener; kept "The glossary records the full list of analogous renderings..." (file -1 line)
  - B4 L139 closing rewrite: dropped "the determinate evaluative concretions the emotion section develops" forward-reference + "is load-bearing for the section and is the central thesis of the emotion section" meta-narrative; left "is the closing structural finding of the perceptual analysis"
  - B5 L57 + L115 duplicate Gross 22-23 quote: kept both per user "rest of B approved" (each context has its own logical role)
- **MEDIUM items applied**:
  - C1 L131 "epithmetic" typo → "epithymetic" + "aisthetic" → "aisthētic" (Greek macron)
- **D1 + D8 work-title sweep (file-wide replace_all)**:
  - *On the Soul* → *De Anima* (1 instance at L97 fn)
  - *On Dreams* → *De Insomniis* (6 instances at L109 ×4, L113 fn ×2)
  - *On Memory* → *De Memoria* (2 instances at L113 fn ×2)
  - *Sense and Sensibilia* → *De Sensu* (4 instances at L53 main, L53 fn, L103 fn ×2)
- **D3 A8 italicization sweep (file-wide + 2 targeted subsection titles)**:
  - `the resonant \textit{kinēsis}` → `the \textit{resonant kinēsis}` (file-wide)
  - `The resonant \textit{kinēsis}` → `The \textit{resonant kinēsis}` (file-wide)
  - `the resonant \textit{aisthēma}` → `the \textit{resonant aisthēma}` (file-wide)
  - `The resonant \textit{aisthēma}` → `The \textit{resonant aisthēma}` (file-wide)
  - `(resonant \textit{aisthēma}` → `(\textit{resonant aisthēma}` (file-wide)
  - L107 subsection title: `Resonant \textit{Kinēsis}` → `\textit{Resonant Kinēsis}`
  - L119 subsection title: `Resonant \textit{Aisthēma} and Resonant \textit{Epithymia}` → `\textit{Resonant Aisthēma} and \textit{Resonant Epithymia}`
  - Result: 16 well-formed `\textit{resonant X}` / `\textit{Resonant X}` compounds verified; 0 ill-formed
- **D4 C2 biblatex migration**: no bare `\cite{}` calls found; skipped
- **L57 footnote Gross 22-23 verification** (B1 UTMOST PRIORITY Task #18) — **VERBATIM VERIFIED, LOCUS WRONG**: the full quote ("Rhetoric, as a humanistic form of affordance theory, posits a situation that is not neutral but is rather 'persuasive,' threatening and promising with respect to our human being-in-the-world") is verbatim from Gross *Uncomfortable Situations* but appears at **book p. 20** (PDF p. 30), not pp. 22--23. Book p. 22 has a shortened restatement ("Thus rhetoric, as a humanistic form of affordance theory—see Gibson below—posits a situation that is not neutral but is rather 'persuasive.'") WITHOUT the "threatening and promising" continuation. **Per protocol Section 9.3 (Gross-rigor) + 9.1 (never silently correct)**: page citation NOT silently updated; flagged for user decision at L57 fn + L115 fn. Additional finding: L115 fn italicizes "Rhetoric" in the Gross quote (`\textit{Rhetoric}`), but Gross does not italicize "Rhetoric" at p. 20 (it's a regular noun, not a book title) — markup discrepancy also flagged for user decision.

#### Pending in §1.2 (V1 capstone + user-input):

- **L75 footnote — Greek text of *Physics* III.3 202a21–24** (containing *poiēsis* and *pathēsis* in the original): **Task #23 specific acquisition need**. Currently only English Smith/Hardie ROT in corpus (`Aristotle - Physics_(2014)_[My Copy].pdf`); a Greek-term glossary at `corpus/index/Aristotle - Complete Works/physics-greek.json` exists but contains no full text. Need Greek *Physics* edition (Ross OCT 1936 or equivalent) added to `corpus/rhetorical_ontology/` to verify the full Greek of the agent/patient passage. Self-deferred in the footnote text.
- **L57 Gibson/Rickert/Uexküll integration** — User noted these are tied together for future work; further integration may be desired
- **V1 capstone PDF verifications** — ~20 quotations flagged for V1 capstone pass per existing protocol
- **L79 main BT citation full-format** — "(*Being and Time* §18, H.84)" missing Eng. — flag for V1 capstone BT page-number sweep
- **L103 four-senses-walkthrough — integrate orectic dimension alongside aisthetic** (user directive 2026-05-24 PHASE 1 of §1.4 walkthrough). Currently L103 walks through the four senses of *pathos* at the perceptual level on the *aisthētikon* side only. The orectic dimension (*epithymia*/*resonant epithymia* as actuality of the *orektikon*, one-substrate-two-in-being with the *resonant aisthēma*) must be integrated under sense (2) "actual alterations" so that the four-senses framework is treated on both sides at the basic-affective-valence level. **General principle (extends beyond §1.2 L103)**: in all perceptual-level analyses across §§1.0–1.5, the *epithymia*/orectic aspect must be worked through alongside the *aisthētic* aspect rather than as a separate downstream addition. The "one substrate, two in being" relation is the architectural fact that requires symmetric treatment. Without this integration, §1.4 L82 (rewritten 2026-05-24 as a summary referring back) must be expanded to re-establish the orectic-side claim independently.

#### ✓ RESOLVED 2026-05-24 (was pending pre-sweep):

- **L51 A_0=motion-time conflations (2 instances)** — RESOLVED 2026-05-23
- **L85 quote discrepancy "change in/of quality"** — RESOLVED 2026-05-24 (verbatim audit)
- **L57 Gibson page citation** — was pp. 209–210 in earlier draft; ALREADY CORRECTED to pp. 45–46 (2015 Classic Edition, Ch. 4 "The Structuring of Ambient Light") in v2 pre-sweep state; TODO item was stale
- **L55 German-first slips** — RESOLVED 2026-05-24 sweep (Geworfenheit + Befindlichkeit)
- **L81 German-first slip** — OBSOLETE — grep confirmed only `In-der-Welt-sein` occurrence at L55 fn is already English-first; no slip remained
- **L57 + L115 + L121 supplies-anchor pattern** — RESOLVED 2026-05-24 sweep (L57 fn LEAVE AS IS per user; L111, L115, L121 fn rewritten)
- **L75 + L137 back-references** — RESOLVED 2026-05-24 sweep
- **A8 italicization (heaviest user in dissertation per §1.2)** — RESOLVED 2026-05-24 sweep (file-wide + 2 subsection titles)
- **Work-title sweep** — RESOLVED 2026-05-24 sweep (3 §1.3-list titles + Sense and Sensibilia)
- **L57 + L115 Gross 22-23 → p. 20 page-citation correction** — RESOLVED 2026-05-24 (both updated to (Gross 20))
- **L115 fn `\textit{Rhetoric}` italics in Gross quote** — RESOLVED 2026-05-24 (italics dropped; 3 other `\textit{Rhetoric}` instances at L111/L113/L139 are legitimate Aristotle work-title citations and preserved)

### §1.3 (A_3 — Completed Cognitive Actuality and the Three Orientational Modes)

#### Walkthrough status — MAJOR SWEEP COMPLETE 2026-05-24
- **Earlier walked (per memory): L51 (main + 2 fns), L53 (fn), L73 (fn); "at *Work*" → "in *Work*" sweep at L55, L77 (×2), L83, L105 (×2), L117, L165 footnotes**
- **Today (2026-05-24 afternoon session): 7 user-flagged items + comprehensive sweep applied**:
  - Items: L97 noēsis/speculative clarification; L73 Papachristou framing fn relocated from L101 (Latin dropped, Kocourek English kept, locus corrected to fn. 67 p. 20); L117 fn last sentence rewritten (replaced "Aristotle's source-claim spans" AI-pattern); L119 new BCAP §15e fn on doxa as ground of rhetoric + theoretical science (PDF-verified pp. 104, 105, 107); L123 stick-in-water illustration added; L144 three-modes-doxa-verdict example added; L158 *Physics* II.1 quote relocated to footnote with explanation
  - Sweep applied: A2 forbidden-phrase batch (L51 "dual-traces"+"as I established"+"as we have seen"; L51 fn 4 "the present paragraph defends"; L93 "phantastic faculty" → *phantastikon*; L103 fn 1 "the present chapter" → "here"; L103 fn 2 "resonant trace" → *resonant kinēsis*; L142 fn "the present chapter's thesis" → "this section's thesis")
  - B3 nested-quote markup: L113 broken bracket; L117 inner double-quote → single; L148 Burke "proves opposites" nested + missing close
  - B4: L47 inline development scaffolding `\inlinenote{}` deleted (Frede pp. 4-5 suspect citation; dual-trace residue)
  - B5: L121 "belief in the sun" → "belief that the sun"; L117 awkward grammar split; L103 dangling em-dash removed
  - C typos: ~25 instances (presentating, "a see", simipliciter, "they were", dunamis/dynamis, "Heideger", "memory memory", appetitve, "this I", "deliberation phantasia", truthood, "formation off", "with is", "case." vs ",", "Gonalez", "on  phantasia pistis", four double-space cleanups, three L61 footnote-quote spaces)
  - D1 A7 work-title sweep: file-wide *On the Soul* → *De Anima*, *On Memory* → *De Memoria*, *Movement of Animals* → *De Motu Animalium*
  - D2 A1 Greek-accent sweep: file-wide `\=e` → Unicode `ē`; plus targeted `kinesis` → `kinēsis`, `aisthema` → `aisthēma`, `aisthesis` → `aisthēsis`, `dunamis` → `dynamis`
  - D3 A8 italicization: L127 "the resonant *aisthēma*" → "the *resonant aisthēma*"
  - D4 C2 biblatex migration: L136 `\cite{ogorman_aristotles_phantasia}` → `\autocite[25]{ogorman_aristotles_phantasia}`
  - L162 orphan footnote relocated to L148 (after "(110)." anchor) per same procedure as L101; first sentence trimmed (was redundant with L148 main-text material)
  - B2: L85 `\hl{(Repeat quote in the final settled disposition section.)}` removed; carried forward to §1.5 hexis-section TODO (Section A.§1.5)
- **Backups**: `.backups/2026-05-24T1329-pre-1.3-L97-to-L158-walkthrough/` (pre-walked-edits) + `.backups/2026-05-24T<HHMM>-pre-1.3-comprehensive-sweep/` (pre-sweep-application)
- **File now**: ~163 lines (was 165 post-L101-deletion, slight decrease from L162 deletion + L47 deletion offset by L73 + L117 + L148 footnote additions)

#### ✓ RESOLVED 2026-05-24 (B1 NOTE TO SYSTEM gaps — afternoon session):
- **L63 fn (Hawhee gap)** — Replaced with Nussbaum 1985 p.~265 quote + Hawhee 2011 p.~152 grafting clause (PDF-index-verified): "*phantasia* moves closer to the way Nussbaum (1985) figures it---as interpretation, but it is interpretation that is grafted onto direct perception: rhetorical vision depends upon both simultaneously." Hawhee's Nussbaum-citation made explicit. NOTE TO SYSTEM marker deleted.
- **L93 fn (Gonzalez/O'Gorman gap)** — Replaced "supplies the rhetorical articulation" framing with PDF-verified Gonzalez quote (pp.~126--127: orator-phantasia-lexis-skhêmata-pathos chain) + O'Gorman cross-reference (p.~31: epideictic-as-affective-ground; p.~34: corporate phantasmata). NOTE TO SYSTEM marker deleted.
- **L144 (Rickert/Heidegger/Gibson/Uexküll synthesis)** — Extended existing L142 Rickert footnote with PDF-verified Rickert p.~244 disclosure-withdrawal quote + PDF-verified Gibson p.~119-120 affordance complementarity quotes + PDF-verified Uexküll pp.~97, 99 hermit-crab-Wirkton quotes; synthesizing principle (Heideggerian disclosure-withdrawal / Gibsonian affordance / Uexküllian Wirkton each name the same attuned-disclosure-as-occlusion principle) stated explicitly. NOTE TO SYSTEM marker deleted.

#### Pending in §1.3:
- **DA I.4 408b5–7 deployment** — Future-work item per `project-future-work-thinking-emotion-as-kinesis.md`; not user-activated.
- **V1 capstone PDF verifications** — deferred per existing protocol; ~30 quotations flagged in sweep doc.
- **BT citation full-format** at L83 main text "(*BT* 449-451)" — locus question (449-451 ≠ §§72-77 H.372-404 per L83 footnote); defer to V1 capstone.
- **Block quote at L113** "Δυνατόν---ἀδύνατον" — entire quote needs V1 verification (BCAP 93-94).

### §1.4 (Emotion — The Form of Desire Under Evaluative Disclosure)

#### Walkthrough status — PHASE 1 + PHASE 2 COMPLETE 2026-05-24

- **Backups**: `.backups/2026-05-24T1714-pre-1.4-walkthrough-PHASE1/` (pre-PHASE 1) + `.backups/2026-05-24T1903-pre-1.4-PHASE2-sweep/` (pre-PHASE 2)
- **File**: 212 lines, 16,015 words, 1011/1011 braces ✓
- **PHASE 1 (17 user-flagged items applied)**: L54+L56 terminology lockdown; L82 four-senses summary; L92 penultimate sentence rewrite (tripartite→articulational-concretion); L97 eidetic-structure clarification; L121 pathos feedback loop → *pathetic* loop rename (6 instances); L129 fn rewrite (3-treatise/1-phenomenon framing); L131 labeling + T_1/T_2 precision; L133 final sentence rewrite (drop $A_{-1}$ counterfactual); L135 final sentence rewrite (A_2 primary + A_1 derived); L157 aisthēma/epithymia co-givenness footnote addition; L159 5-element enumeration; L165 multi-locus→footnote + Mitsein-supporting BCAP p.110 footnote; L183 BT §65 H.329 three-ecstasis-braiding footnote; L185 emotion-genre mapping passage removal; L193 two footnote rewrites (drop *zōē praktikē meta logou*; Ross "good temper"); L195 major rewrite + BT §15-16 equipment-quote inclusion (markdown→LaTeX, 4-paragraph split).
- **PHASE 2 (comprehensive sweep — all categories approved)**:
  - A1 underwrites: L52 LEAVE AS IS per user; L64 + L113 fixed → "is consistent with" / "is consistent with"
  - A2 rests on: L78 fn → "is established in"
  - A3 chapter (13 instances) → all replaced with "section" / restructured
  - A4 at *Work* [locus] inline (6 instances) → all restructured to work-in-narrative, locus-in-parens
  - A5 supplies-anchor (5 instances) → all replaced with substantive verbs
  - A6 cross-references — §1.2 back-refs dropped; §1.3 (wrong) corrected to internal-§1.4 reference; §1.4 self-refs dropped; §1.5/§1.7/§1.8 (non-existent) replaced with "above" / internal-section reference
  - B5 typos: L121 phantasmat → phantasmata; "ground" agreement; aisthesis → aisthēsis; B6 kinēseis macron
  - C1 4 double-spaces collapsed
  - D1 work-title batch: 11 *On the Soul* → *De Anima*; 3 *On Dreams* → *De Insomniis*; 8 *Movement of Animals* → *De Motu Animalium* (file-wide replace_all)
  - D2 Greek-accent batch: 17 `\=e` → `ē` (file-wide replace_all)
  - D5 SZ → BT sweep: 6 instances all converted to (BT §X, H.Y; Eng.~Z) format
  - **PHASE 1 Edit failure discovered + re-applied**: L131 + L133 PHASE 1 rewrites failed to apply silently despite "successful" Edit messages; re-applied during PHASE 2 self-audit; L129 fn rewrite also re-applied
- **Gross verification (B1-B4 all PDF-verified 2026-05-24)**:
  - B1 L52 fn (HR 2005 p. 4): ✓ VERBATIM + page correct
  - B2 L97 fn (HR 2005): ✓ verbatim (with "So also" dropped at start), but page citation `pp.~26--27` corrected to `p.~26` (English text all on p. 26; p. 27 has German parallel only)
  - B3 L157 fn (US 2017): Quote 1 page `p.~4` → `p.~3` (verified at p. 3); Quote 2 page `pp.~22--23` → `p.~20` (matches §1.2 precedent, p. 22 has shortened restatement only)
  - B4 L201 (HR 2005 p. 1): ✓ verbatim quote, page correct; **attribution clarified** — the quoted phrase is Heidegger's epigraph (SS 1924 GA 18.110), not Gross's own writing; "Daniel Gross' assessment" reframed to "the epigraph Gross places at the head of his Introduction"
- **Q5 trace tally for §1.4**: 2 occurrences (down from 3 pre-sweep baseline; L82 summarization removed 1)

#### Pending in §1.4 (future-work + V1 capstone):

- **DA I.4 408b5–7 deployment** — Same quote for higher-order *pathē* and *orektikon* motion $M_3 \rightarrow A_4$. Currently deployed at L92 for the change-aspect of *pathos*; strategic redeployment at $M_3 \rightarrow A_4$ remains future-work.
- **L112 footnote — *pathos*-register tightening** — Make the orectic-species dimension of higher-order *pathē* explicit (per Task #19 + `project-aristotelian-terminology-framework.md`). May be addressed by PHASE 1 L54+L56 terminology lockdown; verify against current state.
- **Hexis-to-A_1 connection follow-up** (user directive 2026-05-24 PHASE 1 L135 walkthrough). The L135 rewrite identifies A_2 as hexis's primary chain-attachment point (the phantasma at A_2 directly carries the hexis-sedimented resonant-residue content), with A_1 biasing (Stimmung-saturation mechanism per L133) and A_2→A_3 doxa-gating (corrective-faculty mechanism per L133) treated as derived effects of the same substrate. The A_1 connection deserves architectural follow-up: is the Stimmung-saturation effect at A_1 a genuine direct effect (the perceptual faculty's *hexis*-state biasing fresh perception), or is it mediated entirely through the A_2 phantasma-content's hexis-shaping (so that "biased perception" at A_1 is structurally an artifact of the phantasma-content overriding the controlling sense via mechanism 2)? L133's current framing treats them as two distinct mechanisms operating at different chain-positions; L135's revision preserves this two-mechanism reading. A deeper architectural analysis may reveal that mechanism 1 reduces to mechanism 2 (i.e., all hexis-influence enters via A_2 with derivative biasing of A_1 perception via phantasma-content override), or may confirm them as architecturally distinct. Decision deferred until §1.5 (which develops hexis fully) and possibly until V1 capstone synthesis.

### §1.5 (A_4 — Three Types of Action)

- **Pipeline-draft revision IN PROGRESS (2026-05-26)** — §1.5 v2 now exists = Version C pipeline draft (9 `/god-write --subsection-mode` runs + Claude coherence pass, ~9,017 body words / +31%) + 9 user-prepended integration notes. Governed by `1.5-CONCEPTUAL-LOCKDOWN.md` (D1–D14, SIGNED OFF) + `PROMPT-FOR-1.5-REVISION.md` (PHASE 0–7). Faculty-lexicon settled 2026-05-26: **"mode of disclosure"** for *phantasia*/*orexis*/*aisthēsis*-as-activities (§1.5-only; Greek -ikon names retained for power/organ; orexis fallback "the soul's orectic activity"; chapter-wide sweep = logged follow-up). Citation verification is INLINE (PHASE 4), not deferred to V1 — pipeline citations untrusted.
- **§1.5 PHASE 1 (note integration) COMPLETE (2026-05-26)** — all 9 prepended notes integrated; scaffold (`\inlinenote` + `\begin{list}`) drained. Per-note: (1) practical-horizon + Heidegger 3-senses-of-*pathos* fn (BCAP p.113) → §1 L125-close; (2) faculty→**"mode of disclosure"** (file-wide = PHASE 5); (3) White *phaō* etymology (p.485, consolidated w/ p.498) + *DA* II.8 voice fn → §2; (4) startle/flinch = pure appetitive avoidance, genesis in the *kritikon* (*DA* III.7 431a8–12), *pathos*=being-moved-not-mover → §4 Type 1; (5) Uexküll witch-child → §5 (*phantasma* overrides held *doxa*, D5); (6) "minimum ground for *doxa*" = doxastic ratification, held-until-revised, not a disposition → §5; (7) *doxa* inherits affective coloring (*Rhetoric* 1378a20–23) → §5; (8) surgeon (*technē* vs ethical hexis, D3) + *Met* IX.6 1048b30–36 homology (D4 arc-closer) → §6; (9) Nussbaum apparent-good (NE 1114a32ff) + smoking anecdote (D12 appetitive→*empeiría*+temperance/intemperance) → §7. **Stray-brace pipeline artifact fixed** (`\textit{phantasia}}`→`\textit{phantasia}`, *DA* 434a5–10, §2). File: 229 lines, braces **750/750 balanced**, all environments matched, body ~10.3k words (was ~9.0k). Backups: `.backups/2026-05-26T1614-pre-1.5-PHASE1-note-integration/` + `.backups/2026-05-26T1735-pre-1.5-scaffold-drain/`. Verbatim registered: De Insomn. 460b16–18, *DA* II.8 420b28–421a2, White p.485, Uexküll witch, *Rhet.* 1378a19–23, *Met* IX.6 1048b30–36, Nussbaum apparent-good, *Met* A.1 980b28–981a4.
  - **Carried to PHASE 3:** §6 retire "*technē*-hexis"/"*praxis*-hexis" (~20 tokens); "settled *doxa*"/*doxa*-as-species-of-hexis corrections (§3 L147, §4, §6 L178 — D5); "doxa-gate"→doxastic ratification (D10); 4 garbled BCAP/[PAGE NEEDED] mid-sentence splices; "Multiple Authors" artifact (= *Heidegger and Rhetoric* pp.113–115 contributor essay — identify author); broken "We may chapter's closing formulation"; node-notation→$A_n$; §8 vs §1.4 thesis re-run; *pathos*-not-a-mover authorial sweep; BCAP p.129 "frequently of repetition" reuse.
  - **Carried to PHASE 4:** Nussbaum pp.31–33 page-confirm; §2 *Fragility of Goodness* p.265 likely mis-attribution; resolve 4 [PAGE NEEDED] (BCAP ~§§17–18); White/Hawhee/Frede + all Aristotle loci (incl. NE III.6–7, III.10–12, VI.5); Ackrill (note-8b fn) not in corpus.
- **§1.5 PHASE 2 (user-flagged complex paragraphs) COMPLETE (2026-05-27)** — 18 flags addressed (3 batches). **Applied (17):** L99 multi-locus→fn; L101 fourfold-convergence clarify + D13 formal-cause assignment; L103 garbled-splice repair + "evaluative judgement/situated disposition" clarify; L112 secondary-lit fn (Caston/Frede/Nussbaum/Hawhee/O'Gorman/Gonzalez); L119b "locus classicus"→plain; L128 "structurally same appetitive operation" clarify; L132 **held *doxa*** (D5: dropped settled/diathesis/species-of-hexis); L138 dark-alley example (vague anxiety→fear; *resonant epithymia* is **latent, not felt** — user correction); L151 justice/honour/shame + "content-conditionality differentiates the three types" splice-repair; L155 enargeia-symmetry clarify + "*doxa* **assents**" (not "finds"); L157 *kairos* footnote; L164 "dispositional form"/courage-fear clarify + **D5-fix** (dropped "settled doxai = species of hexis" + diathesis); L166 *technē*-transparency ↔ ready-to-hand (BT §15) link; L172 dropped "practical syllogism" detour + held-doxa; L182 ***doxa* orthogonal at A₃** (not an A₂→A₃ gate) — actualization-ordering fix; L214 *paschein* **preservative/*sōtēria*** sense (not "dechesthai," which keeps its proper intro at L216); L218 ***archē kinēseōs*** glossed + reconciled with the "*pathos*-not-a-mover" principle (loop-impetus ≠ synchronic-originator). Brace 0; compiles. Backups: `…T2207/…T2225/…T0804`. **Deferred:** (a) L119a **typology recast** (simple-appetition/habitual-rational/evaluatively-complex → **appetitive/poiēsis/praxis** by givenness-of-good) = **PHASE 3**; (b) **Overall *pathē*/*pathos* sweep** (L112/L130/L151 "higher-order *pathos*"→*pathē* + full pass) = **PHASE 5**, rule: **singular "*pathos*" reserved for the ontological being-affected/affectable structure (per §1.1)**; all higher-order Rhetoric-emotion uses → *pathē* (revisit the L138 "a determinate *pathos*"=fear there).
- **§1.5 PHASE 3 — TYPOLOGY RECARVED (2026-05-27, supersedes D6/D7).** Confirmed **two-axis** structure: **Axis 1 (TYPES, by desire actualized):** **epithymetic** (*epithymia*/appetite, pre-doxastic) / **bouletic** (*boulēsis*/rational-wish, deliberative–universal-premise, *pathē*-neutral) / **pathetic** (higher-order *pathē*, evaluatively-complex, *doxa*-ratified). **Axis 2 (TERMINUS, orthogonal, cross-cuts the types):** ***poiēsis*** (end-beyond/making, *kinēsis*, *technē*) vs ***praxis*** (end-in-itself/doing, *energeia*, ethical hexis) — **home of D4 + the §6 hexis-bivalence; NOT a type-name.** Rationale: *poiēsis*/*praxis* is orthogonal to desire-source (revenge-anger → end-beyond/*poiēsis* though *pathetic*; walking-on-universal-premise → activity/*praxis* though *bouletic*); old D6/D7 fused the axes. **D1 reinforced** (genus = actualization of desire = the type-principle); **D3 holds** (retire *technē*-hexis/*praxis*-hexis → *technē*/ethical hexis, now keyed to terminus); **D12 re-keys** (epithymetic→*empeiría*+temperance/intemperance; *poiēsis*-termini→*technē*; *praxis*-termini→ethical hexis+*phronēsis*). Names confirmed: **bouletic** (over "deliberative") + **pathetic** (not "thymetic" — *pathē* span all three orectic species). **Recast plan:** §4 rename+recarve the three types and **drop the Type→hexis conflation**; §3 hinge → desire-types; §5 type-recap renamed; §6 reframed around the *poiēsis*/*praxis* terminus axis + hexis-bivalence (surgeon note-8a + D4 note-8b already fit).
- **§1.5 PHASE 3 — TYPOLOGY REVISED TO FOUR CATEGORIES (2026-05-27 FINAL; supersedes the two-axis interim ↑ AND D6/D7).** **PARADIGM SHIFT** (user discovery): the *DMA* 702a17–19 "affections" = *pathē* in the GENERAL (being-affected) sense, **not** the *Rhetoric* emotions → the *Rhetoric* emotions are renamed **"civic passions"** chapter-wide. **FOUR action-categories, by the desire that SOURCES the action** (A₄ = actualization of desire, D1): **epithymetic** (*epithymia*; UNIQUELY can be pre-doxastic [flinch] *or* doxastic [the "pleasing partner" assent]) · **thymotic** (*thymos*; anger/honour/self-assertion; social) · **bouletic** (*boulēsis* = wish for the END; may aim at the impossible / what depends on others) · **prohairetic** (*prohairesis* = deliberate choice of the MEANS; realizable, up-to-us, deliberation-completed). **Cross-cutting (NOT categories):** *doxa* (taking-as-true; cross-cuts all four; epithymetic alone can be pre-doxastic); the **general *pathē*** (being-affected substrate, pervasive → non-exclusivity); the **civic passions** (= the *social* species of being-affected = *Rhetoric* II catalogue: anger/calmness, friendship/enmity, fear/confidence, shame/shamelessness, kindness/unkindness, pity/indignation, envy, emulation/contempt — each a *toward-whom*; motivates a desire whose source fixes the type — anger→thymotic, pity→bouletic[wish-to-help] then prohairetic[means]); ***poiēsis*/*praxis*** orthogonal TERMINUS axis (making/doing; home of D4 + §6 hexis-bivalence; *prohairesis*→*praktón* ties to *praxis*). **Non-exclusivity:** types = the *predominant* source-desire; one episode may pass through several. **fear = source-variable; dark-alley → §5.** Decisions: D1 reinforced; D3 holds (*technē*/ethical-hexis, keyed to terminus); D4 holds (terminus); D5 holds + extended (doxa cross-cutting); **D6/D7 SUPERSEDED**; D12 re-keys to the four types + terminus.
  - **§4 RECAST DESIGN — LOCKED, NOT YET APPLIED:** opening (four types by desire-source) + non-exclusivity note (pity example + civic-passions) + doxa-cross-cutting note. **T1 Epithymetic:** *DMA* 701a29–b1 ("I want to drink") + 3 observations + startle/flinch + doxastic-appetite example. **T2 Thymotic:** anger/slight (*Rhet.* 1378a31–b5) + social-disclosure/*Mitsein* note + **Gross p.26 (RELOCATED from §6)** + BCAP 99 (arousal/lucid). **T3 Bouletic:** wished end (*Rhet.* I.5; "we wish to be healthy") + can-aim-at-impossible (*NE* III.2/BCAP 99) + pity→wish-to-help. **T4 Prohairetic:** practical syllogism (*DMA* 701a7–16) **RE-READ as the means-conclusion** + deliberation-about-means (*NE* III.3) + pianist (sedimented means) + BCAP 98–99 (*praktón*/up-to-us/*éschaton*). Drop the old Type→hexis mappings; repair the [PAGE NEEDED]/"Multiple Authors" splices.
  - **VERBATIM REGISTERED THIS SESSION (await user typo-verification — flags in verbatim_passages.md):** BCAP 98–99 *prohairesis*/*boulēsis*/*thymos*/*doxa* (6 quotes; *NE* III.2 loci) + *Rhetoric* I.5/I.6 & *NE* III.2/III.3 wish/choice (5 quotes).
  - **CHAPTER-WIDE RIPPLE (NOT DONE):** §1 *DMA*-"affections" reinterpretation (general being-affected); *pathē* → "civic passions" across §§1.0–1.5; introduce *prohairesis* in §§1.0/1.3/1.4; §3 hinge → four desire-sources; §5 gains dark-alley + doxa-cross-cutting; §6 unchanged in role (*poiēsis*/*praxis* terminus + hexis-bivalence + D3 retirement).
  - **STATE — SUPERSEDED 2026-05-27 (see top banner + `SITREP-1.5-v3-2026-05-27.md`):** §4 recast + §1.5-internal ripple + §6 cleanup (D3) + Struever-p.109 sweep + D10 are now ALL DONE on **`-v3.tex`** (compiles, 14 pp). The plan that follows is retained for reference. PHASES 1–2 COMPLETE + applied (brace 0; compiles). NEXT (original): write + apply the §4 four-category recast prose (design above) → review → apply → then the rest of PHASE 3 + the ripple. **Clean-session handoff prompt: `PROMPT-FOR-1.5-PHASE3-CONTINUATION.md`.**
- **Reuse BCAP p. 129 "frequently is" quote in the settled-disposition (hexis) section** — Per §1.3 L85 `\hl{}` marker (removed 2026-05-24). The Heidegger quote anchors hexis/disposition temporality: "The frequently is, precisely, that which characterizes the temporality of being-there. Aristotle cannot say \gk{ἀεί} (\textit{aei}) insofar as human being-there does not so comport itself constantly and always. It can constantly be otherwise. The \textit{always} of a being like being-there is the \textit{frequently of repetition}. It is the being-there of human beings, as determined by \textit{historicality}, to see entirely different time-contexts in relation to which the remaining time-determinations break down" (\textit{BCAP}, p.~129). Currently cited at §1.3 L85 footnote; reuse in §1.5 settled-disposition discussion as load-bearing anchor for the temporal structure of \textit{hexeis} as the "frequently of repetition" rather than the \gk{ἀεί} of pure being-at-rest.
- **De Insomniis 460b16–18 anchor (κρῖνον ≠ φαντασία) — for §5 doxa-gate + §7 corrective-impairment** (noted 2026-05-26). User-supplied Beare ROT: "The cause of these occurrences is that the faculty in virtue of which the controlling sense judges is not identical with that in virtue of which images come before the mind" (*De Insomniis* 460b16–18). Ross 1906 corpus parallel: "the authoritative part in respect of judging and the part by which appearances come to be are not grounded in the same capacity." **Mapping:** "controlling sense" = primary/common *aisthētikon* (τὸ πρῶτον αἰσθητικόν / κοινὴ αἴσθησις, cf. *De Memoria* 450a12–14); "the faculty by which it judges" = its *kritikon* dimension; contrast-partner = *phantasia*/*phantastikon*. **Two-rung correction (keep distinct in revision):** (i) perceptual *kritikon*, one sense overriding another ("sight more authoritative than touch," 460b20–22); (ii) doxastic, knowledge overriding appearance ("the sun appears a foot across, but something speaks against it," 460b18–20). The draft's "corrective-faculty impairment" (L196/L209/L235) is the doxastic rung at A₂→A₃ → **recast "corrective faculty" → *kritikon* (perceptual) / *doxa* (gate); never an invented faculty.** "Corrective faculty" is NOT Aristotle's term (De Memoria names only primary-perceptive/deliberative/recollective faculties; De Insomniis says "controlling sense"/"judging faculty"/"more authoritative sense"). **PHASE 4 locus flag:** draft cites De Insomniis 459a24–28 / 460b3–16 for this mechanism, but κρῖνον≠φαντασία is 460b16–18 and "the judging faculty is dominated" is 461b3–7. **Source to pin:** Beare ROT (Barnes 1984); corpus has only Ross 1906 (searchable) + image-only Beare PDF.
- **§6 deferred item from note 3 (2026-05-26):** the voluntariness/agency of deliberative *phantasia* — its directability ("one can, within limits, direct the imaginative presentation") opens the space for *hexis* to modulate the passage from affect to action. User deferred this from §2 to §6 (hexis bivalence), where *hexis*-modulation does its argumentative work; deploy alongside D9 (deliberative *phantasia* intrinsically ordered to A₄).
- **PHASE 3 sweep — "*pathos* is not a mover" principle (user directive, 2026-05-26):** *pathos* = *paschein*, the capability of being-moved/being-affected, NOT an originator of motion. The genesis of pre-doxastic (Type 1) movement = the *kritikon*'s basic good/bad, pursue/avoid discrimination *in the act of perception* (sensory, in the `now'); *orexis* is the mover; *pathos* the receptivity presupposed. Applied in note 4 (§4 Type 1). PHASE 3: audit §1.5 for any *authorial* prose casting *pathē* as generators/originators of motion and recast (the direct quotation "passion itself is both motion and a cause of motions," L196/L224, stays as quoted). Chapter-wide check = later follow-up.

## B. Diagram Future Work (paused at v7 / v8 LaTeX TBD)

See `project-diagram-future-work.md` for full detail. Six items:

1. **Heidegger citational support** — GA 18 §§15/17/18 + Gross 2005/2017 verbatim added to popovers
2. **Popup-content coincidence audit** — after dissertation finalized
3. **Dissertation cross-refs + corpus-verbatim quotation pull** — every popover references section + page range; all quotations pulled verbatim from `corpus/`
4. **Removal of left-side kinetic role bubbles** — INTERACTIVE only (keep in STATIC version)
5. **Emotion→A_2 feedback arrow** — make hoverable with full panel parallel to A_4→A_0 recursive-loop arrow
6. **Static hyperlinked version** — PDF/HTML with hyperlinks to popover content

### Diagram-Prose Sync (Task #20)

A_0 now = "Sensible Object in Actuality" (or dyad per current restructure); motion-time = outer bounding frame (not a node); M_2→A_3 = "Cognitive Motion" (not "Cognitive Engagement"). See `project-diagram-prose-sync.md`.

### Diagram Step 7 Option B

User noted Option B (full-inclusive redesign + investigation of empty settled-doxa-bubble in HTML JS render) remains as return-to. Diagram Step 7 Option A applied 2026-05-20.

## B'. C2 — Biblatex Migration (user directive 2026-05-20, e15a5d6d session)

User has switched to `\usepackage[backend=biber,style=authoryear]{biblatex}`. ALL parenthetical citations must be migrated from `\cite{...}` to `\autocite[locus]{key}` format.

**Example format**: `\autocite[I.1, 402a5-8]{DAaristotle2014}`

**Aristotle bibkeys** (already in `references.bib`):
- `DAaristotle2014` — De Anima (J.A. Smith / Barnes ROT 1984; filename year is acquisition year)
- `aristotle_movement_of_animals`
- `aristotle_on_colours`
- `aristotle_physics`
- `aristotle_metaphysics`
- `aristotle_sense_and_sensibilia`
- `aristotle_rhetoric`
- `aristotle_on_memory`
- `aristotle_on_dreams`

**Migration timing**: NOT yet applied to v2 prose — must catch during walkthroughs. Best paired with end-of-document V1 capstone verification pass.

**Heidegger and other bibkeys**: not yet enumerated in this file; check `references.bib` and `references-v2.bib` for the canonical list when running the migration sweep.

## V1 Capstone Verification Protocol (user directive 2026-05-20, e15a5d6d session)

**Trigger**: ONLY run V1 verification pass at the very end, once ALL other changes are complete.

**Scope**: every direct quotation in the dissertation across §§1.0–1.5, including italics, dashes, Greek glyphs, punctuation, quotation marks, footnotes — verified verbatim against source PDF in `corpus/rhetorical_ontology/`.

**Per-quote procedure** (during V1 pass):
1. Verify quotation is verbatim against PDF
2. Verify parenthetical citation locus is correct
3. Add verified quote to `verbatim_passages.md` register
4. Update inline citation to authoryear biblatex format `\autocite[locus]{key}` if not already
5. For BT specifically: full citation format `(BT \S<n>, H.<page>; Eng. <page>)`
6. Flag quotation discrepancies for user review (never silently correct)

**Output**: compiled report at end of pass with all verifications + any flagged discrepancies.

**Missing-source protocol** (user directive 2026-05-22): if the reference is not in `corpus/rhetorical_ontology/` (e.g., *On Dreams*, Broadie 1982), report at end of pass with full locus; user inputs verbatim manually.

## C. Verification Discrepancies (V1 capstone targets)

These are specific instances where the dissertation prose diverges from the PDF source, or where the citation is incorrect. Surface during V1 sweep.

| Location | Issue | Status |
|---|---|---|
| §1.2 L85 | "change in quality" → PDF says "change of quality" (DA II.5, 416b33–417a1) | ✓ RESOLVED 2026-05-24 (audit) |
| §1.2 L57 | Gibson pp. 209–210 cite — content at pp. 46–47 instead | ✓ RESOLVED 2026-05-24 (audit) |
| §1.1 L127 | Broadie 1982 quote — ****** UNVERIFIED placeholder; user to supply | Pending user input |
| §1.0 L51 footnote | `aristotle2014soul` bib key year doesn't match PDF year (1984 Smith/Barnes ROT) | V1 capstone bib audit |
| §1.0 L67 footnote | BT §72 H.374 — quote was Stambaugh translation but labeled M&R | ✓ RESOLVED 2026-05-24 (audit) |
| §1.1 L87 footnote | BT fore-having missing "this" + italics | ✓ RESOLVED 2026-05-24 (audit) |
| §1.2 L121 BCAP p. 119 quote | 3 word-level errors: are/as, being-there/πρᾶξις, the how/as the how | ✓ RESOLVED 2026-05-24 (audit) |
| §1.2 L121 BCAP p. 128 quote | from/through preposition error | ✓ RESOLVED 2026-05-24 (audit) |
| §1.2 L55 BT §29 H.137 quote | 2 spurious "the"s + "[Stimmung]" bracket | ✓ RESOLVED 2026-05-24 (audit) |
| §1.2 L57 fn + L115 fn Gross 22-23 | quote verbatim verified against PDF p. 30 (book p. 20); cited locus pp. 22--23 was WRONG (p. 22 has only shortened restatement) | ✓ RESOLVED 2026-05-24 — both citations updated to (Gross 20) |
| §1.2 L115 fn `\textit{Rhetoric}` markup | dissertation italicized "Rhetoric" in Gross quote; Gross p. 20 does not italicize (regular noun, not book title) | ✓ RESOLVED 2026-05-24 — italics dropped at L115 fn |
| §1.2 L?? BT §32 H.150 quote | missing "this", missing italics | ✓ RESOLVED 2026-05-24 (audit) |
| Sense and Sensibilia | wrong Bekker locus (447b3-5 should be 447b4-5) | ✓ RESOLVED 2026-05-24 (audit) |
| Frede pp. 4-5 | suspect citation — replaced with verified Frede p. 282 quotes | ✓ RESOLVED 2026-05-24 (audit) |
| Frede "supervenient" | not in source — replaced with "arises from sensation but is not reducible to it" | ✓ RESOLVED 2026-05-24 (audit) |

### ✓ COMPLETED 2026-05-24: Comprehensive verbatim audit
- 5 parallel verification agents covered all corpus PDFs cited in §§1.0–1.2
- 8 critical discrepancies flagged → user-verified → 5 prose corrections applied
- Catalog entries marked uncertain → updated with corrected verbatim text
- New catalog entries added: DA II.5 416b33-417a1, Met. V.1 (Δ.1), Met. IX.8, Met. XII.6, Met. IX.6, BT §12/§18/§29/§32/§65/§72/§74, GA 29/30 p.67, Coope pp. 160 162, Phys. III.3 202a21-24 + 202b13-14, BT §18 H.84, BCAP p. 131 (×3), p. 132, p. 134, p. 135, DA II.2 413b24, S&S 447b3-5, Aristotelis Parva Naturalia (Teubner 1898), Gibson pp. 45-46
- See `verbatim_passages.md` for full register

### OCR / extraction artifacts noted

- Gibson PDF (2015 Classic Edition, p. 46): "an arrangement ofsome sort" — missing space between "of" and "some"; likely PDF extraction artifact, original print likely "of some sort". **Flag for manual verification when quoting.**

## D. Workflow Preferences (Active Conventions)

> **CANONICAL SOURCE**: This section is the authoritative content-convention registry for the dissertation. Per `REVISION-PROTOCOL.md` Section 0, in case of conflict between this section and any process document (including the protocol itself), this section wins for content conventions. The protocol's Section 4 forbidden-phrase blacklist and Section 5 scope table are extracted operational summaries — for the full convention list, refer here.

### Collaboration cadences (user directives)

- **Per-paragraph protocol** for deep walkthrough (§1.1 was this mode): user edits first, then assistant TODO scan, then approval, then implement. See `feedback-per-paragraph-revision-protocol.md`.
- **Section-by-section protocol** for surface review (§1.2 onward, user directive 2026-05-23): user reads full section, makes their own edits, follows up with specific paragraphs needing complex work; assistant proposes changes for review BEFORE applying any substantive work.
- **Backup before changes**: timestamped `.backups/<timestamp>-pre-...` per section or before multi-file edits. See `feedback-backup-before-changes.md`.
- **Substantive changes require review BEFORE applying** (user directive 2026-05-23): footnote rewrites, new quotation inclusions, etc. — propose first, apply only after explicit approval.

### Quotation verification rigor (user directive 2026-05-23)

- **If unsure whether a quotation is verbatim for any reason** (OCR artifact, edition uncertainty, page-number drift, etc.), present for **manual user verification** rather than silently asserting or correcting.

### No explicit back-references to prior sections (user directive 2026-05-23)

- **Avoid stylistic phrasings** like "§1.1 has already developed/established...", "as established in §1.0...", etc.
- **Rewrite such instances** unless absolutely necessary; just reiterate the point with a parenthetical citation for the textual support being referenced.
- If the citation is already present elsewhere in the immediate context (e.g., already in a footnote), no additional parenthetical needed.
- See `feedback-no-explicit-back-references.md` for full rule + examples.

### Action item: sweep §§1.0–1.5 for back-references

Pending sweep — grep all files for `§1\.` and `chapter has already` / `section has already` / `has already developed` / `has already established` / `as we have seen at` patterns; flag for rewrite during walkthroughs.

### Greek faculty-names convention (user directive 2026-05-23, §1.2 L103)

In user prose, use Greek faculty-names — *aisthētikon*, *orektikon*, *kritikon*, *kinētikon*, *aisthētērion*, *phantastikon* — instead of English "faculty of X" formulations. Direct quotations preserve the translator's English ("the faculty of appetite and avoidance..." stays as-is). See `feedback-greek-faculty-names.md` for full rule.

### Advisor-prose phrasing prohibitions (user directive 2026-05-22 through 2026-05-24)

Explicitly forbidden patterns (do NOT use in walkthrough footnotes or main text):
- "The dissertation's claim ... rests on this structural reading" (2026-05-24, §1.3 L51 fn1)
- "X underwrites the [distinction] this chapter deploys" (2026-05-24, §1.3 L53)
- "X is necessary for Y to be the case"
- "The chapter's interpretive reading ..." (2026-05-22, §1.1 L129)
- "The present chapter's interpretive move" (2026-05-22, §1.1 L87)
- `\textit{Framing}:` or "Framing:" footnote prefixes (2026-05-22, §1.1 L57, L87, L99 — user: "Remove 'Framing'. I don't like these types of moves.")
- "interpretive" qualifier on user's own readings (2026-05-22, §1.1 L123 — user: "it should be clear in the explanation that this is my reading of the texts in question")
- "supplies the [canonical/textual/philological] [anchor/ground/basis] for the X [reading/argument] [deployed here/articulated above]" (2026-05-24, §1.3 L63 B1.1) — meta-narrative announcing the source's function; instead just state what the source says and how it supports the claim
- Any meta-narrative phrasing that turns the footnote into a defense of "the chapter" / "the dissertation" / "the project"

**Preferred**: state what the structure/text does in its own terms; let the parallel to the dissertation's argumentative work be implicit. If commentary is needed, frame as "the actualization-of-desire chain depends on this structure" (substantive) not "the dissertation's claim rests on this" (meta). When making an interpretive move, simply make it — don't announce it as interpretive.

### Pattern-not-paragraph scope protocol (assistant-side commitment 2026-05-24)

**When user flags one violation in a paragraph**: do not fix only that paragraph. Grep the full section (or full file) for peer violations of the same pattern, fix them all in a single batch, and present the batch for approval. This converts a single-correction loop into a sweep-and-validate loop.

Specific recurring patterns to watch for and sweep when flagged:
- "at *Work* [locus]" inline → should be work in narrative, locus in parens
- "supervenient" / "supervenes on" → replace with substantive language
- Back-references ("§1.X has already developed...", "as established in §...")
- "faculty of X" → Greek faculty-names
- "chapter" / "this chapter" → "section" / "subsection"
- "rests on", "underwrites", "the dissertation's claim ... depends on" → restate substantively
- "dual-trace" → "dual-resonance"
- German-first slip → English-first per Heidegger convention
- Spaced em-dashes ` --- ` → flush `---`
- LaTeX `\=e` → Unicode `ē`

### ✓ COMPLETED 2026-05-23: dual-trace → dual-resonance sweep across §1.2

All 13 occurrences migrated:
- L119 subsection title ✓
- L121 main paragraph (×2) ✓
- L121 footnote (×2) ✓
- L133 footnote ✓
- L137 (×2) ✓
- L139 ✓
- L143 (×2 — "dual residual trace" reduced to "dual resonance") ✓
- L151 (×2) ✓

### ✓ COMPLETED 2026-05-23: §1.2 chapter → section sweep

All 5 occurrences migrated:
- L57 footnote (×2) ✓
- L115 footnote (×2) ✓
- L139 main (×1) ✓

### ✓ COMPLETED 2026-05-24: §1.0 chapter → section sweep
Applied during §1.0 retroactive sweep (5 instances).

### Pending: §§1.1, 1.3, 1.4, 1.5 dual-trace / chapter sweeps

The dual-trace → dual-resonance migration completed for §1.2 only; chapter → section cleanup completed for §§1.0 and 1.2. Cross-sectional grep + migration pending for §§1.1, 1.3, 1.4, 1.5.

### §1.2 WALKTHROUGH STATUS — MAJOR SWEEP COMPLETE 2026-05-24

Section-by-section walkthrough COMPLETE 2026-05-23 (user-flagged paragraphs); MAJOR SWEEP COMPLETE 2026-05-24 (comprehensive sweep modeled on §1.3 afternoon-session). See Section A.§1.2 above for full sweep diff. Section ready for V1 capstone PDF verification pass at end of dissertation; user-input items (L57/L115 Gross page-citation correction, L115 fn `\textit{Rhetoric}` markup, Greek *Physics* III.3 acquisition Task #23) flagged separately.

The previously unflagged paragraphs (L117 signet-ring three-phases, L133 main modus tollens, L137 main dual-resonance closing, L143 main $A_1$ as Ground opening, L147 similarity grounded in resonant kinēsis, L151 threshold of $A_2$) received cross-cutting attention during the major sweep (forbidden-phrase, A8 italicization, work-title, German-first checks applied throughout). Substantive content unchanged on unflagged paragraphs; only mechanical conventions normalized.

### Source priority

- **corpus/index FIRST, ChromaDB fallback** for scholarly source retrieval. See `feedback-corpus-index-first.md`.
- **Verify Perplexity verbatims against PDFs** — Perplexity outputs can be wrong; cross-check against local PDFs. See `feedback-perplexity-verbatim-verification.md`.
- **Missing-from-corpus**: use `******` placeholder for body; cite by Bekker/SZ/locus; user supplies manually. See `feedback-missing-source-placeholder.md`.
- **Gross advisor-rigor (UTMOST PRIORITY)**: ANY citation/quote/paraphrase from Gross *Uncomfortable Situations* (2017) or Gross-Kemmann eds. *Heidegger and Rhetoric* (2005) must be perfectly verbatim AND contextually accurate. See `feedback-gross-advisor-citation-rigor.md`.

### Format conventions (Tasks #19–#22)

- **Greek-throughout** for *orexis*-family + load-bearing Greek (no English glosses for *orexis*, *orektikon*, *epithymia*, *thymos*, *boulēsis*, *telos*, *archē*; secondary Greek terms like *eidos*, *hylē*, *phantasia*, *aisthēsis* keep Greek script but English gloss dropped per user pattern 2026-05-23). See `project-aristotelian-terminology-framework.md`.
- **English-first** for Heidegger German technical terms: `disposedness (\textit{Befindlichkeit})`, `attunement (\textit{Stimmung})`, etc.
- **Aristotelian "now" → \`now'** in user prose (Task #22); quoted material untouched.
- **"Chapter" → "Section" / "Subsection"** — dissertation organized into sections/subsections, NOT chapters.
- **Heidegger quotation-preservation** (user directive 2026-05-22): all Heidegger quotations preserve exact punctuation, italics, and nested-quote structure verbatim, including stylistically unusual usages. End-of-document sweep deferred.

### Citation style (Task #21)

- **Work title in narrative, locus in parenthetical** is the general rule.
- **Load-bearing chapter discussions** (e.g., "Heidegger reads *De Anima* III.2–5 as the foundation for...") may use work + locus inline.
- **Referencing something specific in flow** (e.g., "the three-factor schema of motion Aristotle presents in *De Anima*---mover, means, and moved (III.10, 433b13–18)---..."): work in narrative, locus in parens within em-dash interjection.
- **Direct quotation citations** continue to use the standard (Work, locus) parenthetical format.
- **Multi-locus citation lists belong in footnotes** (user directive 2026-05-22, §1.0 L97): when a citation includes multiple loci with cf./contrast notes (e.g., "(De Anima II.5, 416b33-417a20; cf. III.2, 425b26-27 on the single-event-under-two-logoi structure)"), move to footnote with brief explanation. In-text clutter is to be avoided.

### Quotation length rule (user directive 2026-05-22, §1.1 L65)

- **Quotations under 5 lines** stay in-text with standard quotation marks.
- **Quotations 5+ lines** use block-quote format with `adjustwidth` parameter (`\begin{adjustwidth}{...}{...}` ... `\end{adjustwidth}`).
- **Style guideline**: avoid placing two block quotations close together (stylistically detrimental); if a long quote is near another, prefer to break it up into shorter in-text quotes when meaning permits.

### Heidegger/BT full-citation format (user directive 2026-05-22, §1.1 L71.2–3)

- **All references to Being and Time** use English "Being and Time" / "BT" (not "Sein und Zeit" / "SZ") in main text and footnotes.
- **Page numbers required**: BT citations include H.<Heidegger pagination> and Eng.<translator pagination>. Format: `(BT \S9, H.42; Eng. 67)`.
- **Final pass timing**: BT page-number sweep runs alongside the verbatim verification pass at end of dissertation. When a BT quote is encountered during that pass: (1) verify verbatim against PDF, (2) add to `verbatim_passages.md`, (3) update inline citation to full gamut format.

### Potentiality-actuality / dynamis-energeia translation (user directive 2026-05-22, §1.1 L99)

- **Preferred English rendering**: "potentiality-actuality" (not "potency-act").
- **Greek-in-parens**: at first technical use, `potentiality-actuality (\textit{dynamis}-\textit{energeia})`.
- **Subsequent uses**: bare "potentiality" or "actuality" in user prose; Greek `\textit{dynamis}` / `\textit{energeia}` retained where the Greek register is load-bearing.

### Footnote depth principle (user directive 2026-05-22, §1.1 L99 and L129)

- **A footnote doing substantive interpretive work must include direct quotations**, not paraphrases or signposting alone. If you find yourself summarizing what a source says without quoting, expand to include the actual passage(s).
- **No translator-info signposting in footnote openings**: don't begin a footnote with "Macquarrie-Robinson translation appears at p. X" or "The pertinent material is in the middle of the passage." The parenthetical citation handles location; the footnote provides the quotation + explanation/insight.
- **No "framing" prefixes**: don't begin footnotes with `\textit{Framing}:` or "The present chapter's interpretive move..." — provide the substantive content directly. (Captured separately in Section D advisor-prose prohibitions.)
- **If a footnote becomes too long for the form**: consider whether the material belongs in main text, as a separate footnote, or as a sub-section. Don't compress dense conceptual work into a footnote that lacks supporting quotations.

### Markup conventions

- **Em-dash flush** (no spaces around `---`) per Task #1 (A2). New v2 content should follow proper convention; existing spaced em-dashes get cleaned up in A2 sweep.
- **Greek Unicode macrons** (not `\=e`) per Task #4 (A1). New v2 content uses Unicode `ē`/`ā`/`ī`.
- **Coined "resonant X" compounds**: italicize whole compound per Task #5 (A8).
- **Multi-definition format**: parens for in-text author's prose; **square brackets `[...]`** for editorial additions inside quotations. Per Task #8 (A4).

### Workflow preferences (continued)

- **Avoid coined hyphenated compounds in prose** — descriptive noun phrases with parenthetical glosses preferred. See `feedback-coined-compound-restraint.md`.
- **Major iterations on copies** in dedicated `*-iterations/` folders; originals as v0 baselines. See `feedback-major-iterations-on-copies.md`.
- **Long single-line LaTeX from chat code blocks** picks up spurious newlines on paste; write to tmp file or apply Edit directly. See `feedback-copy-paste-line-breaks.md`.

## E. Active Investigations / Tallies

### Q5 — "trace" → "tone" terminology investigation (active, user directive 2026-05-23)

**Status**: ACTIVE — user maintaining serious consideration. Reasoning recorded: "tone" aligns thematically with "resonant" prefix in coined compounds (*resonant kinēsis*, *resonant aisthēma*, *resonant epithymia*), more so than "trace". Needs grounding in:
- **Uexküll**: *Merkmalton* (perceptual tone) and *Wirktonus* (effector tone) from *Theoretische Biologie* / *A Foray into the Worlds of Animals and Humans*
- **Heidegger**: possible appropriation of Uexküll's tonal vocabulary in GA 29/30 §§42–58 (engagement with Uexküll's *Funktionskreis* model; *Stimmung*-tonal register convergence)

**Renames pending decision**:
- "dual-trace thesis" → "dual-tone thesis"
- "residual trace" → "residual tone"
- (Other "trace" usages context-dependent — must disambiguate noun "trace" from verb "to trace")

**Tally maintenance**: assistant maintains a running occurrence list of all "trace" usages (noun, in the sense of residual perceptual deposit) per section. When user makes go/no-go decision, this tally enables targeted refactor.

#### Current tally (initialized 2026-05-23 from DISSERTATION-CLEANUP-TODO.md quick-scan baseline)

| File | "trace" count (per scan) | Notes |
|---|---:|---|
| §1.0 | 8 | Mostly methodology paragraphs introducing dual-trace thesis |
| §1.1 | 2 | Limited use |
| §1.2 | 20 | **Heaviest** — A_1 is where dual-trace thesis is developed (introduced + applied) |
| §1.3 | 3 | |
| §1.4 | 3 | |
| §1.5 | 1 | |
| **Total** | **37** | |

#### Per-paragraph occurrences (tallied as walkthroughs progress)

**§1.2 — tallied incrementally during walkthrough**:
- L51 (applied 2026-05-23): "the residual trace the act deposits" — `residual trace`, dispositional-deposit sense ✓ candidate
- L71 (current): "the persisting trace" (×2 — "the capacity that takes up the persisting trace" + "the persisting trace preserves the formal structure"); "The resonant trace" — `persisting trace` (×2), `resonant trace` (×1) candidates
- L71 (existing): "the persistence-character" / "the persistence of this formal determination" — persistence-claim variants
- L97: "The completion of the perceptual act does not terminate the *kinēsis* initiated by the sensible object; it deposits a persisting impression" — no "trace" but persistence-claim
- L101: "*resonant kinēsis* for the residual motion understood as a whole" — coined compound, separate from "trace"
- L107: "*Residual trace*" subsection content — `residual trace`, candidate
- L109+: "dual trace comprising two distinct yet inseparable moments" — `dual trace`, candidate
- L111: "the trace" — candidate
- L121: "The residual motion that persists" + "the residue preserves both aspects as formal aspects of a single material substrate" — persistence
- L127: "two temporal phases" — separate concept
- L131: "the dual residual trace" — `dual residual trace`, candidate
- L137: "the dual trace at $A_1$" — `dual trace`, candidate
- L141: "The dual trace is in place" — candidate
- (Tally continues as §1.2 walkthrough progresses)

**§1.1**: 2 occurrences (per scan) — to be tallied during cleanup pass.

**§§1.0, 1.3, 1.4, 1.5**: tally to be completed.

#### Grounding texts to consult before adoption

- Uexküll, *Theoretical Biology* (1926/1928) — *Funktionskreis*; *Merkmalton* / *Wirktonus*
- Uexküll, *A Foray into the Worlds of Animals and Humans* (1934; trans. O'Neil 2010, `corpus/rhetorical_ontology/Von Uexkull - A Foray into the Worlds of Animals and Humans...pdf`)
- Heidegger BT §10 (M&R fn, Uexküll reference)
- Heidegger GA 29/30 (FCM) §§42–58 (Uexküll engagement, animal captivation vs. world-formation)

#### Dependencies

- Should be settled BEFORE A5 glossary capstone (so "tone" gets correct citational anchor if adopted)
- Should be settled BEFORE §1.2 final pass (heaviest user)
- Independent of A0-restructure (Task #20)

---

## F. Active Observations / Notes

### Pre-catalog verified quotes (logged in `project-verbatim-passages-catalog.md`)

These were PDF-verified during §§1.0–1.1 walkthroughs. Migrated to `verbatim_passages.md` in 2026-05-23 session update. See verbatim_passages.md.

### Diagram engagement registers

- Diagram is **explicitly Heidegger-mediated** in the dissertation argument; current state is more Aristotle-direct than the prose. Coordinating fix is item 1 in Diagram Future Work.

### Paused threads

- **Heidegger GA 18 PDFs + active-intellect dialectic** — Paused at Plato Sophist 248e–249d threshold (2026-04-30). See `project-heidegger-ga18-philosophy-thread.md`.
- **A_3 *phantasma* section v1** — Paused 2026-04-27 with v1 violations to fix (LaTeX/Bekker/Heidegger formatting). See `project-a3-phantasma-session.md`.

### Special user requests

- **All load-bearing Greek words → glossary** (Task #13 / A5 capstone expanded per user directive 2026-05-22) — `GLOSSARY.md` is the running register; final capstone pass at end of dissertation.
- **Per-paragraph collaboration mode is preferred for deep revision** — user's standing preference; section-by-section mode is the exception for §1.2 walkthrough.

## G. Memory File Index (cross-reference)

Active project memory files at `~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/`:

- `MEMORY.md` — top-level index (loads automatically into context)
- `session-degradation-remediation-2026-05-24.md` — **CRITICAL**: honest diagnosis + 7-step pre-output protocol + forbidden-phrase blacklist. Consult at start of every dissertation-revision session.
- `project-section-1-3-walkthrough.md` — §1.3 walkthrough status: L51/L53/L73 walked; many paragraphs pending
- `project-aristotelian-terminology-framework.md` — Greek conventions + 3-species mapping + 4-fold *pathos* register
- `project-verbatim-passages-catalog.md` — workflow rules + pre-catalog logged quotes + Heidegger preservation convention
- `project-future-work-thinking-emotion-as-kinesis.md` — DA I.4 408b5–7 deployment for §1.3 / §1.4 (created 2026-05-23)
- `project-diagram-prose-sync.md` — A_0 + M_2→A_3 rename sync
- `project-diagram-future-work.md` — 6 diagram future-work items
- `project-dissertation-cleanup-todo.md` — master TODO mirror (cross-link to actual `DISSERTATION-CLEANUP-TODO.md`)
- `project-dissertation-analysis-pipeline.md` — historical reference (Mar/Apr session pipeline runs)
- `project-heidegger-ga18-philosophy-thread.md` — paused active-intellect dialectic
- `project-a3-phantasma-session.md` — paused §1.3 *phantasma* v1 work

Feedback memory files:
- `feedback-gross-advisor-citation-rigor.md` (UTMOST PRIORITY)
- `feedback-per-paragraph-revision-protocol.md`
- `feedback-coined-compound-restraint.md`
- `feedback-copy-paste-line-breaks.md`
- `feedback-missing-source-placeholder.md` + `-relaxed.md`
- `feedback-perplexity-verbatim-verification.md`
- `feedback-backup-before-changes.md`
- `feedback-major-iterations-on-copies.md`
- `feedback-corpus-index-first.md`
- `feedback-annotation-max-effort.md`
- `feedback-plan-review-process.md`
- `feedback-no-explicit-back-references.md` (added 2026-05-23)
- `feedback-greek-faculty-names.md` (added 2026-05-23)

---

## H. Session Degradation Diagnosis + Remediation (2026-05-24)

User flagged a pattern: assistant quality degraded across the last two sessions (relative to the §1.0 walkthrough session `dfc6e46e-5c3a-4271-91fd-9a586d783e35`, May 22 21:14, which user identifies as "finest"). Honest diagnosis logged here so future sessions can apply the remediation protocol.

### Failure patterns observed (current session + previous)

1. **Convention amnesia under generative pressure** — As the convention stack grew (~3 rules at §1.0 → ~15+ rules by §1.3), my attention to each individual rule weakened. AI-default training patterns reasserted under generation load. Specifically I kept drifting back to forbidden patterns: inline "at *Work* [locus]", "supervenient", "the dissertation's claim ... rests on this structural reading", back-references "§1.X has already developed", "faculty of X" instead of *aisthētikon*.

2. **Memory exists but not operationally consulted** — Feedback memory files (`feedback-greek-faculty-names.md`, `feedback-no-explicit-back-references.md`) were created after explicit corrections, then violated within hours. The fix was treated as memory-creation, not memory-consultation-before-output.

3. **Reactive scope (paragraph only) instead of proactive section sweep** — When user flagged one paragraph for a pattern violation, I fixed only that paragraph. Did not grep the section for peer violations. Same pattern then surfaced in the next paragraph.

4. **AI-default citation pattern is heavily ingrained** — "at *De Anima* III.7, 431a13-14" inline format keeps reappearing because academic training data has it at very high frequency. User's prohibition is one episode; the prior is millions. Active suppression required, not passive "rule learning".

5. **Asked scope questions instead of inferring from established protocol** — Asked "should I scan the whole section or just the paragraph?" after section-by-section protocol was already established. Friction-by-clarification.

6. **Verification-pass shortcuts** — Verbatim catalog entries built earlier without PDF cross-check despite `feedback-perplexity-verbatim-verification.md` rule. Same root cause as #2.

### What was different about the §1.0 walkthrough (dfc6e46e)

- **Smaller convention stack** to track (~3 rules vs. ~15+)
- **Fresher context window** — early in the project, less dilution
- **Pre-output rigor was higher** — discipline scaled to the smaller rule stack
- **AI-default reassertion was rare** — fewer rules in active competition

### Remediation Protocol (assistant-side commitment, effective 2026-05-24)

**Before every prose output in §§1.3+:**

1. **Mechanical pre-output check** against the convention list in `TODO_NOTES.md` Section D + feedback memory files. Not "I should" — actually do it for each output. Check every footnote for inline "at *Work* [locus]"; check main text for back-references, "faculty of", "supervenient", advisor-prose patterns.

2. **Pattern-not-paragraph scope**: when user flags a violation, grep the section for peer violations of the same pattern, fix them all in one pass, present as a batch.

3. **Suppress AI-default citation prior**: before producing any citation, articulate the work-in-narrative-locus-in-parens rule explicitly. Confirm format before writing.

4. **State the convention being applied** in proposals, so user can verify tracking.

5. **Infer protocol from prior turn**, do not ask scope questions when protocol is established.

6. **Forbidden phrase blacklist** (always check before outputting):
   - "rests on", "underwrites", "the dissertation's claim ... depends on"
   - "supervenient", "supervenes on"
   - "§1.X has already developed/established", "as we have seen at"
   - "faculty of X" (in user prose, not direct quotes)
   - "this chapter" / "the chapter" (it's section/subsection)
   - "at *Work* [locus]" inline (always work-in-narrative, locus-in-parens)
   - "dual-trace" (now dual-resonance)
   - German-first slips for Heidegger terms
   - "Framing:" / `\textit{Framing}:` footnote prefixes
   - "The chapter's interpretive reading" / "The present chapter's interpretive move"
   - "interpretive" qualifier on the user's own readings (just make the reading; don't announce it as interpretive)
   - "Macquarrie-Robinson translation" / translator-info signposting at footnote opening (parenthetical citation handles location)
   - "potency"/"act" (use "potentiality"/"actuality"; Greek dynamis/energeia in parens)

7. **Perplexity/non-PDF-verified quotations**: never assert as verbatim without PDF cross-check. Use `****** UNVERIFIED:` prefix when sourcing without local PDF.

### Failed-pattern log for ongoing self-audit

Track each instance where a forbidden pattern slipped through, so the pattern's reassertion frequency can be monitored:

| Date | Section | Pattern that slipped | Caught by |
|---|---|---|---|
| 2026-05-23 | §1.2 L103 | "faculty of perception" | User |
| 2026-05-24 | §1.3 L51 fn1 | "the dissertation's claim ... rests on this structural reading" | User |
| 2026-05-24 | §1.3 L53 | "supervenient" | User |
| 2026-05-24 | §1.3 L53 fn | "Papachristou's distinctions underwrite the [distinction] this chapter deploys" | User |
| 2026-05-24 | §1.3 multiple footnotes | "at *Work* [locus]" inline (5+ instances) | User |
| 2026-05-24 | Workflow | Asked scope question when section-by-section protocol established | User |
| 2026-05-24 | §1.3 L63 B1.1 footnote (proposal draft) | "supplies the canonical scholarly anchor for the *taking-as* reading deployed here" — meta-narrative announcing source function | User |
| 2026-05-24 | §1.1 L87 Gadamer fn (pre-existing, missed in initial sweep) | "Gadamer's first-person testimony ... supplies the philosophical setting in which this two-register deployment was first elaborated" | Self-audit (post-edit grep) |
| 2026-05-24 | §1.1 L87 Michalski fn (pre-existing, missed in initial sweep) | "Michalski's reading of GA 18 supplies the philological corroboration" — peer of same pattern; explicitly hit "philological" from blacklist | Self-audit (post-edit grep) |
| 2026-05-24 | §1.1 L129 fn (assistant-introduced in B12 grounding addition) | "The §§66--68 derivation supplies the structural grounding for the Aristotelian--Heideggerian parallel developed in the main text" — **CRITICAL**: assistant introduced the exact forbidden pattern within the same turn as reading [[feedback-no-supplies-anchor-pattern]]; this is the convention-amnesia diagnosis (Section H opening) reasserting under generative pressure even with the memory file open in context | Self-audit (post-edit grep) |
| 2026-05-24 | §1.1 L53 main + 2 fn (B6 inline-locus missed in initial proposal scope) | "Aristotle defends this priority in *Metaphysics* IX.8:" + 2 fn "at *Metaphysics* IX.8" / "at *Metaphysics* V.1" — proposal initially limited B6 to L97/L99/L123/L127/L133; L53 instances escaped scope-listing | Self-audit (post-edit grep) |
| 2026-05-24 | §1.1 L71 fn (BCAP-internal inline-locus, missed in initial proposal scope) | "Heidegger's analysis of *dynamis* at §26d.γ specifies" — book-internal section ref, but B6 user directive is strict ("do not include elements like III.2 in text") | Self-audit (post-edit grep) |
| 2026-05-24 | §1.2 L69 fn (advisor-prose "underwrites" file-wide scope missed in initial proposal) | "such that the soul's capacity to discriminate underwrites both the formal reception of sensible qualities..." — A5 proposal flagged only L57 main instance; file-wide scope per Section 5.1 table requires whole-file sweep. Same convention-amnesia pattern as §1.1 L53/L97/etc. peer-sweep failures. Fixed → "grounds" post-application. | Self-audit (post-edit grep) |
| 2026-05-24 | §1.2 L113 fn (advisor-prose "supplies X for Y" variant missed in initial proposal) | "*De Memoria* 453a14--32 (the kinetic persistence of already-excited anger and terror) supplies partial textual support for affective-kinetic persistence" — variant of supplies-anchor pattern not caught in A1 proposal scope (A1 enumerated only 4 specific instances at L57/L111/L115/L121). Fixed → "In *De Memoria* (453a14--32) Aristotle describes... ; the dual-resonance thesis generalizes..." post-application. | Self-audit (post-edit grep) |
| 2026-05-24 | §1.4 PHASE 1 L131+L133+L129 Edits (TOOL silent-failure pattern) | **CRITICAL NEW FAILURE CLASS**: Edit tool reported "successful" but Edits did NOT actually apply for L131, L133, L129 PHASE 1 rewrites. Discovered during PHASE 2 self-audit when grep showed OLD text still present. Likely cause: old_string had `\textit{path\=e}` (LaTeX accent form) but file may have already been in mixed/unicode state, causing silent mismatch. Re-applied during PHASE 2 with current-state old_string. **Mitigation now required**: always verify Edit success with grep of expected NEW text after each substantive Edit, NOT just trust the tool's "successful" message. | Self-audit (post-PHASE-1, during PHASE 2) |
| 2026-05-24 | §1.4 PHASE 2 A5 supplies-anchor file-wide grep (initial enumeration missed 5 instances) | A5 proposal initially enumerated 5 supplies-anchor instances (L113, L127×2, L157, L159). All 5 caught by file-wide grep in proposal. PHASE 2 audit confirmed file-wide scope correctly applied; no escapees this section. Lesson re-confirmed (vs §1.2 sweep): file-wide grep BEFORE proposal, not enumeration after. | Self-audit (proposal grep) |

---

**Format**: when new notes / future-work items / observations / discrepancies arise during walkthroughs, append to the appropriate section above. Cross-link to memory files where relevant. This document is the durable companion to the structured `DISSERTATION-CLEANUP-TODO.md`.
