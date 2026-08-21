# §1.5 Per-Subsection Generation — Master Workflow (subsection-mode)

**Updated:** 2026-05-25
**Architecture:** 9 independent CLI invocations using `/god-write --subsection-mode` + console-side coherence pass executed by Claude after all 9 outputs are produced.

---

## 0. PREREQUISITE — Subsection-mode must be implemented

This workflow requires the `--subsection-mode` flag and its supporting infrastructure (Phases 1–6 of `plans/subsection-mode-design.md`). Until those phases land, the CLI invocations in §2 below will fail (`--subsection-mode` will be parsed as an unknown flag, or worse, silently ignored, routing the run back into the broken gold-standard path that produced the two §1.5 attempt-1 failures archived at `tmp/Dissertation/Working tex versions/persubsection-runs/failures/`).

**Gate check before running §2:**

```bash
# Smoke-test subsection-mode itself
npx tsx src/god-agent/universal/cli.ts write --help 2>&1 | grep -E '(subsection-mode|subsection-heading|subsection-quotations)'
# Should print all three flags. If empty, subsection-mode is not yet implemented.
```

Memory pointer for forward-looking integration: `[[analysis-upgrade-subsection-mode-integration]]` (subsection-mode auto-inherits bridge/claim/ontology improvements when `tmp/analysis-upgrade/` is promoted).

---

## 1. Experiment design

**Hypothesis under test:** rolling-context (single invocation drafts 9 subsections sequentially with sliding-window prior-section context + per-author citation tracker) vs. independent per-subsection generation under subsection-mode + post-hoc Claude coherence pass produces qualitatively different output that the user can evaluate.

**Variables held constant:** source hierarchy, vocabulary constraints, Bekker citation ledger, forbidden deployments, supplementary evidence pack (Sources A–E in `_SHARED-PRELUDE.md` including Gross verbatim), per-subsection requirements, stylistic constraints, dalton-philosophical style profile, corpus retrieval (whitelist + chromadb), corpus/index ontology + bridge enrichment.

**Variables changed:**

1. `--rolling-context` removed (the rolling-context branch is bypassed)
2. `--subsection-mode --word-target N --subsection-heading "..." --subsection-quotations N` activates the parallel subsection-mode branch
3. Each subsection generated as an independent CLI invocation with NO prior-section context
4. A post-generation coherence pass executed by Claude in the console (Read → diagnose → Edit → stitched output)

**Comparison surface:** versionA (rolling-context, no Source E), versionB (rolling-context + Source E Gross verbatim injection), versionC (this workflow — independent per-subsection subsection-mode generation + coherence pass).

---

## 2. Directory contents

| File | Purpose |
|---|---|
| `00-MASTER-WORKFLOW.md` | This file (the workflow doc) |
| `_SHARED-PRELUDE.md` | Dissertation-specific context: §§1.0–1.4 architectural inheritance, dissertation coinages, advisor-rigor blacklist, source hierarchy, full Source A–E evidence pack. Concatenated into every per-subsection prompt at invocation time. ~12 KB (slimmed from the original 49 KB; subsection-mode handles output format + length + structure mandates internally). |
| `01-A4-Convergence.md` | Subsection 1 delta (~700w) |
| `02-Phantasia-Heart.md` | Subsection 2 delta (~900w) |
| `03-Three-Factor.md` | Subsection 3 delta (~600w) |
| `04-Three-Types.md` | Subsection 4 delta (~1,300w; the typological core) |
| `05-Doxa-Gate.md` | Subsection 5 delta (~700w) |
| `06-Hexis-Bivalence.md` | Subsection 6 delta (~900w) |
| `07-Pathetic-Loop.md` | Subsection 7 delta (~700w) |
| `08-Synthesis.md` | Subsection 8 delta (~700w) |
| `09-Development-Note.md` | Development Note delta (~400w; appears as `\subsection*{}` after §8) |
| `.backups/pre-subsection-mode-update-*/` | Snapshot of pre-subsection-mode versions of all files (for rollback / reference) |

**Delta-file structural change:** the deltas no longer use `##` markdown headings. The pipeline previously interpreted those headings as content-section directives to be populated (e.g., generating a "Subsection Role" section + "Required Deployments" section with off-topic prose). The new format uses bold inline labels (`**Subsection role.**`) followed by prose, which the pipeline cannot misinterpret as content scaffold.

Each per-subsection delta is intended to be **concatenated with `_SHARED-PRELUDE.md`** at invocation time. The combined prompt is passed to the CLI as the prompt argument.

---

## 3. CLI invocations (one per subsection)

**Output directory** (create it first): `tmp/Dissertation/Working tex versions/persubsection-runs/`

Each invocation produces a `.tex` file containing ONLY that subsection's LaTeX body content (no preamble, no `\documentclass`, no `\end{document}`). Naming convention: `01-A4.tex`, `02-Phantasia.tex`, …, `09-DevNote.tex`.

```bash
# Create output dir + log subdir
mkdir -p "tmp/Dissertation/Working tex versions/persubsection-runs/logs/"

# Subsection 1 — A_4 in the Chain: The Convergence at Praxis (~700w)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/01-A4-Convergence.md)" \
  --execute --json --multi-step --whitelist \
  --subsection-mode \
  --word-target 700 \
  --subsection-heading "A_4 in the Chain: The Convergence at \textit{Praxis}" \
  --subsection-quotations 1 \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --style academic --format paper \
  --max-revisions 2 \
  > "tmp/Dissertation/Working tex versions/persubsection-runs/01-A4.tex" \
  2> "tmp/Dissertation/Working tex versions/persubsection-runs/logs/01-A4.log"

# Subsection 2 — Phantasia at the Heart of Every Action (~900w)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/02-Phantasia-Heart.md)" \
  --execute --json --multi-step --whitelist \
  --subsection-mode \
  --word-target 900 \
  --subsection-heading "\textit{Phantasia} at the Heart of Every Action" \
  --subsection-quotations 1 \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --style academic --format paper \
  --max-revisions 2 \
  > "tmp/Dissertation/Working tex versions/persubsection-runs/02-Phantasia.tex" \
  2> "tmp/Dissertation/Working tex versions/persubsection-runs/logs/02-Phantasia.log"

# Subsection 3 — The Three-Factor Schema, the Three Entry Points (~600w)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/03-Three-Factor.md)" \
  --execute --json --multi-step --whitelist \
  --subsection-mode \
  --word-target 600 \
  --subsection-heading "The Three-Factor Schema, the Three Entry Points" \
  --subsection-quotations 1 \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --style academic --format paper \
  --max-revisions 2 \
  > "tmp/Dissertation/Working tex versions/persubsection-runs/03-ThreeFactor.tex" \
  2> "tmp/Dissertation/Working tex versions/persubsection-runs/logs/03-ThreeFactor.log"

# Subsection 4 — Three Types of Action (~1,300w; the typological core)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/04-Three-Types.md)" \
  --execute --json --multi-step --whitelist \
  --subsection-mode \
  --word-target 1300 \
  --subsection-heading "Three Types of Action" \
  --subsection-quotations 2 \
  --corpus-chunk-count 40 --corpus-min-relevance 0.60 \
  --style academic --format paper \
  --max-revisions 2 \
  > "tmp/Dissertation/Working tex versions/persubsection-runs/04-ThreeTypes.tex" \
  2> "tmp/Dissertation/Working tex versions/persubsection-runs/logs/04-ThreeTypes.log"

# Subsection 5 — The Content-Conditional Doxa-Gate (~700w)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/05-Doxa-Gate.md)" \
  --execute --json --multi-step --whitelist \
  --subsection-mode \
  --word-target 700 \
  --subsection-heading "The Content-Conditional Doxa-Gate" \
  --subsection-quotations 1 \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --style academic --format paper \
  --max-revisions 2 \
  > "tmp/Dissertation/Working tex versions/persubsection-runs/05-DoxaGate.tex" \
  2> "tmp/Dissertation/Working tex versions/persubsection-runs/logs/05-DoxaGate.log"

# Subsection 6 — Hexis Bivalence: Technē-Hexis and Praxis-Hexis (~900w)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/06-Hexis-Bivalence.md)" \
  --execute --json --multi-step --whitelist \
  --subsection-mode \
  --word-target 900 \
  --subsection-heading "\textit{Hexis} Bivalence: \textit{Techn\=e}-Hexis and \textit{Praxis}-Hexis" \
  --subsection-quotations 2 \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --style academic --format paper \
  --max-revisions 2 \
  > "tmp/Dissertation/Working tex versions/persubsection-runs/06-HexisBivalence.tex" \
  2> "tmp/Dissertation/Working tex versions/persubsection-runs/logs/06-HexisBivalence.log"

# Subsection 7 — The Pathetic Loop: Synchronic Pass and Diachronic Sedimentation (~700w)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/07-Pathetic-Loop.md)" \
  --execute --json --multi-step --whitelist \
  --subsection-mode \
  --word-target 700 \
  --subsection-heading "The \textit{Pathetic} Loop: Synchronic Pass and Diachronic Sedimentation" \
  --subsection-quotations 1 \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --style academic --format paper \
  --max-revisions 2 \
  > "tmp/Dissertation/Working tex versions/persubsection-runs/07-PatheticLoop.tex" \
  2> "tmp/Dissertation/Working tex versions/persubsection-runs/logs/07-PatheticLoop.log"

# Subsection 8 — Synthesis: Emotion as the Affective Architecture of Being-in-the-World (~700w)
# MUST close with the Heidegger deferral footnote (see delta file's self-audit)
# --subsection-quotations 3 because BOTH Gross quotes (p.3, p.20) + BCAP+BT inline quotes are required
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/08-Synthesis.md)" \
  --execute --json --multi-step --whitelist \
  --subsection-mode \
  --word-target 700 \
  --subsection-heading "Synthesis: Emotion as the Affective Architecture of Being-in-the-World" \
  --subsection-quotations 3 \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --style academic --format paper \
  --max-revisions 2 \
  > "tmp/Dissertation/Working tex versions/persubsection-runs/08-Synthesis.tex" \
  2> "tmp/Dissertation/Working tex versions/persubsection-runs/logs/08-Synthesis.log"

# Development Note — final \subsection*{} (~400w)
# Note: --subsection-heading uses \subsection*{} not \subsubsection*{}
# Subsection-mode should honor whatever LaTeX command appears in --subsection-heading
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/09-Development-Note.md)" \
  --execute --json --multi-step --whitelist \
  --subsection-mode \
  --word-target 400 \
  --subsection-heading "Development Note" \
  --subsection-heading-level subsection \
  --subsection-quotations 0 \
  --corpus-chunk-count 20 --corpus-min-relevance 0.60 \
  --style academic --format paper \
  --max-revisions 1 \
  > "tmp/Dissertation/Working tex versions/persubsection-runs/09-DevNote.tex" \
  2> "tmp/Dissertation/Working tex versions/persubsection-runs/logs/09-DevNote.log"
```

**Flag rationale (vs. the original rolling-context invocation):**

- `--rolling-context` **removed** — experimental variable being tested
- `--subsection-mode` **added** — activates the parallel branch that respects `--word-target`, suppresses the gold-standard Markdown structure mandate, emits LaTeX `\subsubsection*{}` output, parameterizes diagnostic thresholds
- `--word-target N` per-subsection (700, 900, 600, 1300, 700, 900, 700, 700, 400) — under subsection-mode this is actually respected (it was ignored under gold-standard mode due to the `write-pipeline-orchestrator.ts:2035` lookup table override)
- `--subsection-heading "..."` per-subsection — explicit LaTeX heading content; eliminates the previous failure mode where the model invented its own heading (e.g., "Verbatim Passages: Receptivity..." instead of "A_4 in the Chain: The Convergence at *Praxis*")
- `--subsection-quotations N` per-subsection — verbatim-quotation target (replaces the gold-standard "≥3 quotations" mandate which was wrong for short subsections)
- `--length` **removed** — ignored in subsection-mode (the orchestrator warns if passed; the `--length`-derived word-target lookup table is bypassed)
- `--enable-endnotes` **not passed** — off by default in subsection-mode (per design decision: per-subsection endnotes would conflict with the coherence pass's responsibility to merge/renumber across the unified §1.5). Coherence pass handles citation aggregation; user can opt-in with `--enable-endnotes` if endnotes are wanted per-subsection.
- `--max-revisions` retained at 2 (1 for the Development Note since it is short and primarily a hand-off)
- `--multi-step` retained — each subsection still gets the v1 → investigate → v2 quality cycle (this is the highest-quality generation path; preserved in subsection-mode)
- `--whitelist` retained — keeps the curated-corpus constraint, Opus 4.6 model selection, and inline-validation hard-disable that the gold-standard path uses. Subsection-mode and whitelist mode compose (subsection-mode wins the word-target precedence per `plans/subsection-mode-design.md` Phase 3 Swap 1; whitelist's other 9 behaviors are unaffected)

**Sequential vs parallel execution:** the 9 invocations are independent and can be run in parallel (no inter-invocation dependencies). For first validation, run sequentially in background and validate each output before continuing (the recommended Phase 7 smoke-test path). For bulk re-runs (Phase 9), all 9 can fire in parallel.

---

## 4. After generation: the coherence pass

After the user has produced all 9 outputs in `tmp/Dissertation/Working tex versions/persubsection-runs/`, the user invokes Claude with: *"Run the coherence pass on the per-subsection §1.5 outputs."*

Claude then executes the following workflow. The methodology is SIMPLER than the original because subsection-mode handles many former-coherence-pass concerns programmatically (LaTeX output format, single-block structure, no Validation Appendix, no endnotes, parameterized word targets, citation enforcement, prose sanitization).

### Step 1 — Inventory and concatenate

Each of the 9 `.tex` files is JSON-wrapped per the `--json` flag. Extract `result.content` from each, in order. Wrap with the dissertation's standard preamble (copy from `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionB.tex` lines 1–47). Save as `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionC-raw.tex`.

### Step 2 — Diagnose coherence issues (REDUCED categories)

Subsection-mode automatically handles these former coherence-pass categories — they no longer need diagnosis:

- ~~Markdown vs LaTeX conversion~~ (subsection-mode emits LaTeX directly)
- ~~`[N]` endnote ref cleanup~~ (endnotes off by default; refs not generated)
- ~~Validation Appendix removal~~ (suppressed in subsection-mode)
- ~~Heading-format normalization~~ (`--subsection-heading` is passed explicitly)
- ~~Greek diacritic normalization~~ (handled by subsection-mode prompt template)
- ~~LaTeX hygiene cleanup (`\inlinenote{}`, `\hl{}`, TODO markers)~~ (prose sanitization runs in subsection-mode just as in gold-standard)
- ~~Block-quote markup~~ (delta files specify the exact `\begin{adjustwidth}` markup)

The coherence pass focuses on cross-subsection issues that no individual generation can catch. For each diagnostic category below, scan the concatenation and produce `tmp/Dissertation/Working tex versions/persubsection-runs/coherence-diagnosis.md`:

**(a) Repeated quotations.** Are the same Aristotelian Bekker passages quoted (as block-quotes or with long verbatim text) in multiple subsections? Are the same Heidegger BCAP/BT passages quoted in multiple subsections? Each load-bearing block-quote should appear exactly once; supporting in-line citations may repeat the locus but should not repeat the verbatim text.

**(b) Transition seams.** Each subsection's opening should acknowledge the previous subsection's claim WITHOUT using forbidden back-reference patterns (no "§1.X has already developed/established," no "as we have seen at…"). Each subsection's close should set up the next without using meta-discourse markers ("to reiterate," "as we will see"). The transitions need to be natural — restate the claim with parenthetical citation rather than announcing the cross-reference.

**(c) Terminology drift across subsections.** Verify consistent use of: *resonant kinēsis*, *resonant aisthēma*, *resonant epithymia*, *pathetic* loop, dual-resonance, articulational concretion, content-conditional doxa-gate, *technē*-hexis, *praxis*-hexis, affective architecture of being-in-the-world. Scan for retired terminology: "dual-trace," "pathos feedback loop," "resonant mood/tonality/trace," "faculty of X" English formulations.

**(d) Author imbalance across the assembled section.** Check Gross presence in §§6, 7, 8 (per delta specs). Check Caston, Frede, Gibson, Hawhee, Nussbaum, O'Gorman appearances against §2's deployment specs. The per-subsection runs may have under-deployed an author the spec required.

**(e) Bekker citation density.** Spot-check ~10 Aristotle citations across the assembled file. Every Aristotle citation should use Bekker notation; no Barnes page numbers; no PDF page numbers; no `[PAGE NEEDED]` markers. (The CitationEnforcement pass in subsection-mode should catch most of these, but cross-subsection consistency is a coherence concern.)

**(f) BT/BCAP full-citation compliance.** Spot-check Heidegger citations. Every BT citation should use `(BT \S<n>, H.<page>; Eng.~p.~<page>)`; every BCAP citation should use `(BCAP p.~<n>)`. Replace bare references.

**(g) Heidegger deferral footnote presence.** Verify the deferral footnote is present at end of §8, BEFORE §9 (Development Note). Use the text from `08-Synthesis.md` delta if missing or substantively altered.

**(h) Heading count and structural hierarchy.** Verify exactly 8 `\subsubsection*{...}` (§§1–8) + 1 `\subsection*{Development Note}` (§9). Heading text matches the `--subsection-heading` values passed at invocation.

**(i) Forbidden phrases.** Grep for "the user", "the reader", "the chapter," "this chapter," "underwrites," "rests on," "supplies the canonical anchor," meta-discourse ("to reiterate," "as we have discussed," "as we will see," "I should clarify here," "before we can analyze"). The dissertation-specific blacklist in `_SHARED-PRELUDE.md` lists the full set. Replace with substantive prose. (Some of these will be caught by subsection-mode's prose-sanitization, but cross-subsection patterns and edge cases may still appear.)

**(j) Work-in-narrative / locus-in-parens.** Verify no inline "at *De Anima* III.7, 431a8–14" formulations; work title in narrative, locus in parens.

**(k) Coinage compliance.** Verify *resonant kinēsis* etc. are italicized as units (using `\textit{resonant kinēsis}`, not split).

### Step 3 — Apply fixes via Edit

For each diagnosed issue, apply targeted Edits to the v1 concatenation. Preserve the substantive prose of each subsection — fix only:

- Transitional openers and closers (one sentence at the seam between subsections)
- Repeated block-quotes (keep the first instance; convert later instances to parenthetical citation)
- Terminology drift (replace retired terms with current)
- Author-deployment gaps (add citations where the delta-specs required them)
- Citation format violations (Bekker, BT/BCAP)
- Forbidden phrases (substitute)
- Heidegger deferral footnote (restore if missing)
- Coinage italicization (re-italicize as units)

Save the fixed version as `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionC.tex`.

### Step 4 — Produce the coherence-pass report

Write `tmp/Dissertation/Working tex versions/1.5-coherence-pass-report-versionC.md` documenting:

- Per-subsection word counts (actual vs. target; pull from `result.bodyWordCount` in each `.tex` JSON)
- Per-subsection citation density (pull from `result.citationEnforcement` JSON fields)
- Per-subsection bridges injected (pull from `result.injectedBridges` — new in subsection-mode per `plans/subsection-mode-design.md` Phase 6)
- Per-subsection corpus/index contributions (pull from `result.corpusIndexContributions` — also new in Phase 6)
- Coherence issues diagnosed (the per-category checklist from Step 2)
- Fixes applied (the per-category counts: e.g., "3 dual-trace → dual-resonance replacements; 2 Bekker corrections in §4; 1 missing Gross citation added in §7")
- Comparison handoff metrics: word counts, author distribution, citation density, forbidden-phrase count, terminology compliance count

---

## 5. Expected failure modes (REDUCED — subsection-mode addresses the prior structural ones)

**Structural failures from attempts 1 + 2 that subsection-mode addresses:**

| Prior failure | Root cause | How subsection-mode fixes it |
|---|---|---|
| Output topic completely off (e.g., "Verbatim Passages: Receptivity" or "Kenneth Burke dramatism" instead of A_4 at *praxis*) | 49 KB SHARED-PRELUDE swamped the delta + delta's `##` markdown headers became content-section directives | Slim 12 KB prelude + delta uses bold inline labels not `##` headers + explicit `--subsection-heading` flag passes the LaTeX heading to use |
| Output is Markdown (`##`, `*X*`, `[N]`) not LaTeX | gold-standard prompt template hardcodes "MANDATORY `## N. Title` structure" | subsection-mode's `buildSubsectionPrompt()` mandates LaTeX output and suppresses the Markdown directive |
| Word count off by 4× (850w generated when 700 asked) + v1 diagnostic complains "target 3,000-3,500" | `--word-target` dropped at orchestrator line 2035; hardcoded 2500/3000-3500 in `retrieval-utils.ts:228` | subsection-mode's parameterized thresholds use `--word-target` directly + scaled minimum-section words |
| Phantom quotations fabricated (3 critical) | v2 revision didn't fire (`revisionIterations: 0`) due to gold-standard's confused diagnostic | subsection-mode's parameterized diagnostics correctly identify subsection-scale insufficient-word-count and trigger v2 with appropriate prevention plan |

**Residual failure modes that may still occur and what catches them:**

| Failure mode | Root cause | Diagnostic that catches it |
|---|---|---|
| Same Aristotelian quote (esp. *MA* 7, 701a32–33) cited verbatim in §3 AND §4 | Each subsection's evidence pack overlaps | (a) Repeated quotations |
| Gross missing from §§7–8 entirely | Per-subsection evidence packs may not push Gross hard enough without the rolling tracker; delta says "optional" for §7 | (d) Author imbalance |
| Inconsistent rendering of *technē*-hexis vs technē-hexis vs technē hexis | Each subsection's pipeline may resolve coinages differently | (c) Terminology drift + (k) Coinage compliance |
| Heidegger deferral footnote absent from §8 | The footnote is specified in §8 delta — but per-subsection runs may forget if attention budget is tight | (g) Deferral footnote check |
| Word counts vary widely from target | `--word-target` is now respected, but the multi-step pipeline may still over- or under-shoot by 10-20% | Word-count audit in Step 4 |
| `--subsection-heading` value rendered with literal LaTeX escapes (`\textit{Praxis}` becomes `\textit\{Praxis\}` in the output) | Shell-escaping or subsection-mode flag parsing edge case | Step 2(h) heading-count check + visual spot-check |

---

## 6. Comparison protocol (user-executed after Claude's coherence pass)

After Claude produces `1.5 - A4 - Three Types of Action-v2-versionC.tex`, the user has three versions to compare:

- **versionA** (`1.5 - A4 - Three Types of Action-v2-versionA.tex`): rolling-context, no Source E injection
- **versionB** (`1.5 - A4 - Three Types of Action-v2-versionB.tex`): rolling-context, with Source E (Gross verbatim) injection
- **versionC** (`1.5 - A4 - Three Types of Action-v2-versionC.tex`): per-subsection subsection-mode + Claude coherence pass

Suggested comparison axes:

- **Substantive content fidelity**: does each version develop the same architectural claims (5-node chain, three-factor schema, three types, doxa-gate, *hexis* bivalence, *pathetic* loop, affective-architecture synthesis) at comparable depth?
- **Citation density and distribution**: how many Aristotle citations, BCAP citations, BT citations, secondary-source citations per subsection?
- **Author balance**: Gross presence; Caston/Frede/Gibson/Hawhee/Nussbaum/O'Gorman/Rickert presence
- **Forbidden-phrase count**: "the user," "this chapter," "underwrites," "rests on," etc.
- **Terminology compliance**: dual-resonance vs. dual-trace; *pathetic* loop vs. "pathos feedback loop"
- **Block-quote count**: are the four spec-required block-quotes (DMA 701a29–b1, DMA 701a7–16, BCAP 127, BCAP 128) present in each version?
- **Word count**: total body prose
- **Transition quality**: are the seams between subsections smooth, or visibly mechanical?
- **Lanham profile**: sentence-length distribution, formality, register
- **Bridge/index contributions** (versionC only — new in subsection-mode): what cross-author bridges and corpus-index ontology nodes contributed per subsection?

Expected outcomes (one of):

1. versionC is qualitatively better (per-subsection focus + subsection-mode + coherence pass beats rolling-context)
2. versionC is qualitatively worse (rolling-context's sliding window is doing real work the coherence pass can't recover)
3. versionC is comparable (the experiment is null; the architecture choice does not load-bear on quality)

Whichever outcome, the comparison informs future per-section-vs-rolling-context decisions for §§1.6 and beyond. The reusable infrastructure (subsection-mode) is valuable independently of the experimental outcome — it enables per-subsection iteration on any section going forward.

---

## 7. Files this Workflow Produces

| File | Producer | Purpose |
|---|---|---|
| `tmp/Dissertation/Working tex versions/persubsection-runs/01-A4.tex` ... `09-DevNote.tex` | CLI (9 invocations) | Raw per-subsection JSON outputs (each containing `result.content` LaTeX) |
| `tmp/Dissertation/Working tex versions/persubsection-runs/logs/0N-*.log` | CLI (stderr) | Per-invocation logs (subsection-mode activation, prompt-builder choice, bridge selection, corpus-index contributions, v1/v2 diagnostics) |
| `tmp/Dissertation/Working tex versions/persubsection-runs/coherence-diagnosis.md` | Claude (Step 2) | The Step-2 diagnostic report |
| `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionC-raw.tex` | Claude (Step 1) | concatenation before fixes |
| `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionC.tex` | Claude (Step 3) | Final unified .tex after fixes |
| `tmp/Dissertation/Working tex versions/1.5-coherence-pass-report-versionC.md` | Claude (Step 4) | Coherence-pass audit report for user review |

**Backup discipline:** before Claude begins the coherence pass, snapshot the raw concatenation. Before any Edit that touches more than a single line, back up the working file to `tmp/Dissertation/.backups/<timestamp>-pre-<task>/`. This matches the dissertation's standing backup convention (memory: feedback-backup-before-changes).

---

## 8. Invocation trigger

When the user has all 9 outputs and wants the coherence pass executed, they will invoke Claude with one of:

- "Run the coherence pass on the per-subsection §1.5 outputs."
- "Stitch the per-subsection §1.5 runs into versionC."
- "§1.5 versionC coherence pass."

Any of these phrases triggers the workflow described in §4.

---

## 9. Pointers

- **Plan doc:** `plans/subsection-mode-design.md` — Phase 0 backup, Phases 1-6 implementation, Phase 7 smoke test, Phase 8 regression validation, Phase 9 full run
- **Memory note for future analysis-upgrade integration:** `[[analysis-upgrade-subsection-mode-integration]]`
- **Phase-1-failure evidence (for diagnosis reference):** `tmp/Dissertation/Working tex versions/persubsection-runs/failures/01-A4-attempt1-prelude-first.tex` + `.log`
- **Pre-subsection-mode prompt-file backups:** `tmp/Concluding_Section_Prompt-PerSubsection/.backups/pre-subsection-mode-update-<timestamp>/`
- **Existing working reference (rolling-context):** `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionB.tex`
