# Concluding Section §1.5 — Per-Subsection Generation Workflow

**Generated**: 2026-05-25
**Purpose**: A/B comparison experiment against `tmp/Concluding_Section_Prompt.md` (the all-at-once `--rolling-context` variant that produced versionA and versionB)
**Architecture**: 9 separate CLI invocations (one per subsection) + console-side coherence pass executed by Claude after all 9 outputs are produced

---

## 0. Experiment Design

**Hypothesis under test**: rolling-context (single invocation drafts 9 subsections sequentially with sliding-window prior-section context + per-author citation tracker) vs. independent per-subsection generation + post-hoc Claude coherence pass produces qualitatively different output that the user can evaluate.

**Variables held constant**: source hierarchy, vocabulary constraints, Bekker citation ledger, forbidden deployments, supplementary evidence pack (A–E including Source E Gross verbatim quotes), per-subsection requirements, stylistic constraints. The only changes are:

1. `--rolling-context` flag removed
2. Per-subsection word targets passed via `--word-target` instead of one global 6,500 target
3. Each subsection generated as an independent CLI invocation with NO prior-section context
4. A post-generation coherence pass executed by Claude in the console (Read → diagnose → Edit → stitched output)

**Comparison surface**: versionA (rolling-context, no Source E), versionB (rolling-context + Source E Gross verbatim injection), versionC (this workflow — independent per-subsection generation + coherence pass).

---

## 1. Directory Contents

| File | Purpose |
|---|---|
| `00-MASTER-WORKFLOW.md` | This file (the workflow doc) |
| `_SHARED-PRELUDE.md` | Shared context concatenated into every per-subsection prompt: source hierarchy, citation format, vocabulary, Bekker ledger, forbidden deployments, architectural context, full Source A–E evidence pack |
| `01-A4-Convergence.md` | Subsection 1 delta (~700w) |
| `02-Phantasia-Heart.md` | Subsection 2 delta (~900w) |
| `03-Three-Factor.md` | Subsection 3 delta (~600w) |
| `04-Three-Types.md` | Subsection 4 delta (~1,300w; the typological core) |
| `05-Doxa-Gate.md` | Subsection 5 delta (~700w) |
| `06-Hexis-Bivalence.md` | Subsection 6 delta (~900w) |
| `07-Pathetic-Loop.md` | Subsection 7 delta (~700w) |
| `08-Synthesis.md` | Subsection 8 delta (~700w) |
| `09-Development-Note.md` | Development Note delta (~400w; appears as `\subsection*{}` after §8) |

Each per-subsection delta is intended to be **concatenated with `_SHARED-PRELUDE.md`** at invocation time. The combined prompt is passed to the CLI as the prompt argument.

---

## 2. CLI Invocations (one per subsection)

**Output directory** (create it first): `tmp/Dissertation/Working tex versions/persubsection-runs/`

Each invocation produces a `.tex` file containing ONLY that subsection. Naming convention: `01-A4.tex`, `02-Phantasia.tex`, …, `09-DevNote.tex`.

```bash
# Create output dir
mkdir -p tmp/Dissertation/Working\ tex\ versions/persubsection-runs/

# Per-subsection CLI invocations
# Each uses the same flags except --word-target and --length

# Subsection 1 — A_4 in the Chain: The Convergence at Praxis (~700w)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/01-A4-Convergence.md)" \
  --execute --json --multi-step --whitelist \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --enable-endnotes --style academic --format paper \
  --length medium --word-target 700 --max-revisions 2 \
  > tmp/Dissertation/Working\ tex\ versions/persubsection-runs/01-A4.tex

# Subsection 2 — Phantasia at the Heart of Every Action (~900w)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/02-Phantasia-Heart.md)" \
  --execute --json --multi-step --whitelist \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --enable-endnotes --style academic --format paper \
  --length medium --word-target 900 --max-revisions 2 \
  > tmp/Dissertation/Working\ tex\ versions/persubsection-runs/02-Phantasia.tex

# Subsection 3 — The Three-Factor Schema, the Three Entry Points (~600w)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/03-Three-Factor.md)" \
  --execute --json --multi-step --whitelist \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --enable-endnotes --style academic --format paper \
  --length medium --word-target 600 --max-revisions 2 \
  > tmp/Dissertation/Working\ tex\ versions/persubsection-runs/03-ThreeFactor.tex

# Subsection 4 — Three Types of Action (~1,300w; the typological core)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/04-Three-Types.md)" \
  --execute --json --multi-step --whitelist \
  --corpus-chunk-count 40 --corpus-min-relevance 0.60 \
  --enable-endnotes --style academic --format paper \
  --length comprehensive --word-target 1300 --max-revisions 2 \
  > tmp/Dissertation/Working\ tex\ versions/persubsection-runs/04-ThreeTypes.tex

# Subsection 5 — The Content-Conditional Doxa-Gate (~700w)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/05-Doxa-Gate.md)" \
  --execute --json --multi-step --whitelist \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --enable-endnotes --style academic --format paper \
  --length medium --word-target 700 --max-revisions 2 \
  > tmp/Dissertation/Working\ tex\ versions/persubsection-runs/05-DoxaGate.tex

# Subsection 6 — Hexis Bivalence: Technē-Hexis and Praxis-Hexis (~900w)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/06-Hexis-Bivalence.md)" \
  --execute --json --multi-step --whitelist \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --enable-endnotes --style academic --format paper \
  --length medium --word-target 900 --max-revisions 2 \
  > tmp/Dissertation/Working\ tex\ versions/persubsection-runs/06-HexisBivalence.tex

# Subsection 7 — The Pathetic Loop: Synchronic Pass and Diachronic Sedimentation (~700w)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/07-Pathetic-Loop.md)" \
  --execute --json --multi-step --whitelist \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --enable-endnotes --style academic --format paper \
  --length medium --word-target 700 --max-revisions 2 \
  > tmp/Dissertation/Working\ tex\ versions/persubsection-runs/07-PatheticLoop.tex

# Subsection 8 — Synthesis: Emotion as the Affective Architecture of Being-in-the-World (~700w)
# This subsection MUST close with the Heidegger deferral footnote
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/08-Synthesis.md)" \
  --execute --json --multi-step --whitelist \
  --corpus-chunk-count 30 --corpus-min-relevance 0.60 \
  --enable-endnotes --style academic --format paper \
  --length medium --word-target 700 --max-revisions 2 \
  > tmp/Dissertation/Working\ tex\ versions/persubsection-runs/08-Synthesis.tex

# Development Note — final \subsection*{} (~400w)
npx tsx src/god-agent/universal/cli.ts write \
  "$(cat tmp/Concluding_Section_Prompt-PerSubsection/_SHARED-PRELUDE.md \
        tmp/Concluding_Section_Prompt-PerSubsection/09-Development-Note.md)" \
  --execute --json --multi-step --whitelist \
  --corpus-chunk-count 20 --corpus-min-relevance 0.60 \
  --enable-endnotes --style academic --format paper \
  --length brief --word-target 400 --max-revisions 1 \
  > tmp/Dissertation/Working\ tex\ versions/persubsection-runs/09-DevNote.tex
```

**Flag rationale (compared to the rolling-context single-invocation in the original prompt):**

- `--rolling-context` REMOVED: this is the experimental variable being tested. Each subsection is generated independently with no sliding-window context.
- `--word-target` adjusted per-subsection (700, 900, 600, 1300, 700, 900, 700, 700, 400) instead of one global 6500. The CLI will target each subsection's specific length rather than averaging across the section.
- `--length` adjusted per-subsection (`medium` for 600–900w subsections, `comprehensive` for the 1,300w §4, `brief` for the 400w Development Note).
- `--corpus-chunk-count` lowered from 60 to 30 (40 for §4) since each subsection has narrower scope; the chunk pool can be more focused.
- `--max-revisions` retained at 2 (1 for the Development Note since it is short and primarily a hand-off).
- `--multi-step` retained: each subsection still gets the v1 → investigate → v2 quality cycle.
- All other flags unchanged from the original.

**Sequential vs parallel execution**: the 9 invocations are independent and can be run in parallel (no inter-invocation dependencies). If running sequentially, total wall-clock is roughly 9 × per-invocation time. If running in parallel (e.g., GNU parallel or shell `&`), wall-clock collapses to the longest single invocation. The user's hardware is the constraint.

---

## 3. After Generation: The Coherence Pass (Claude-Executed Console Workflow)

After the user has produced all 9 outputs in `tmp/Dissertation/Working tex versions/persubsection-runs/`, the user invokes Claude with: *"Run the coherence pass on the per-subsection §1.5 outputs."*

Claude then executes the following workflow in the console:

### Step 1 — Inventory and concatenate

Read each of the 9 `.tex` files. Produce a "v1 concatenation": all 9 subsections in order, with the LaTeX preamble (`\documentclass`, packages, `\begin{document}`, etc.) preserved from the first file and the closing `\end{document}` preserved from the last (or restored as needed). Save as `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionC-raw.tex`.

### Step 2 — Diagnose coherence issues

For each diagnostic category below, scan the v1 concatenation and produce a `tmp/Dissertation/Working tex versions/persubsection-runs/coherence-diagnosis.md` report:

(a) **Repeated quotations**. Specifically: are the same Aristotelian Bekker passages quoted in multiple subsections? Are the same Heidegger BCAP/BT passages quoted in multiple subsections? Each load-bearing block-quote should appear exactly once; supporting in-line citations may repeat the locus but should not repeat the verbatim text.

(b) **Missing transitions**. Each subsection's opening should acknowledge the previous subsection's claim (without using forbidden back-reference patterns: no "§1.X has already developed/established," no "as we have seen at…"). Each subsection's close should set up the next without using meta-discourse markers ("to reiterate," "as we will see"). The transitions need to be natural — restate the claim with parenthetical citation rather than announcing the cross-reference.

(c) **Terminology drift**. Each subsection should consistently use: *resonant kinēsis*, *resonant aisthēma*, *resonant epithymia*, *pathetic* loop, dual-resonance, articulational concretion, content-conditional doxa-gate, *technē*-hexis, *praxis*-hexis, affective architecture of being-in-the-world. Scan for retired terminology: "dual-trace," "pathos feedback loop," "resonant mood/tonality/trace," "faculty of X" English formulations, "supervenient/supervenes on," "rests on," "underwrites," "supplies the canonical anchor for."

(d) **Author imbalance**. The original §1.5 spec required deploying Gross verbatim in §§7–8. If the per-subsection runs produced (e.g.) zero Gross citations in §7 because each subsection saw only its own evidence pack, fix by adding the deployment. Likewise check Caston, Frede, Gibson, Hawhee, Nussbaum, O'Gorman appearances against the original spec.

(e) **Bekker compliance**. Every Aristotle citation uses Bekker notation; no Barnes page numbers; no PDF page numbers. Scan for `(Aristotle 2014, ...)`, `(*On The Soul (De Anima)*, p. ...)`, `[PAGE NEEDED]`. Replace with Bekker.

(f) **BT/BCAP full-citation compliance**. Every BT citation uses `(BT \S<n>, H.<page>; Eng.~p.~<page>)`; every BCAP citation uses `(BCAP p.~<n>)`. Replace bare references.

(g) **Heidegger deferral footnote**. Verify present at end of subsection 8, BEFORE the Development Note subsection. Use the exact text from the original spec if missing.

(h) **Heading count**. Verify exactly 8 `\subsubsection*{}` + 1 `\subsection*{Development Note}`. Heading text must match the mandatory output structure exactly.

(i) **Forbidden phrases**. Grep for "the user", "the reader", "the chapter," "this chapter," meta-discourse ("to reiterate," "as we have discussed," "as we will see," "I should clarify here," "before we can analyze"). Replace with substantive prose.

(j) **Greek diacritics**. Verify Unicode macrons (ē, ā, ī), not LaTeX `\=e`.

(k) **Markdown vs LaTeX**. Verify all italics are `\textit{X}`, never `*X*`. All bold is `\textbf{X}`, never `**X**`.

(l) **LaTeX hygiene**. Verify no `\inlinenote{}`, `\hl{}`, TODO markers, bracketed `[N]` endnote refs.

(m) **Block-quote markup**. Verify the two *De Motu Animalium* block-quotes in §4 use `\begin{adjustwidth}{0.5in}{0in}…\end{adjustwidth}` markup. Verify the two BCAP block-quotes in §6 use the same markup.

(n) **Work-in-narrative / locus-in-parens**. Verify no inline "at *De Anima* III.7, 431a8–14" formulations; work title in narrative, locus in parens.

(o) **Coinage compliance**. Verify *resonant kinēsis* etc. are italicized as units (using `\textit{resonant kinēsis}`, not split).

### Step 3 — Apply fixes via Edit

For each diagnosed issue, apply targeted Edits to the v1 concatenation. Preserve the substantive prose of each subsection — fix only:

- Transitional openers and closers (one sentence at the seam between subsections)
- Repeated block-quotes (keep the first instance; convert later instances to parenthetical citation)
- Terminology drift (replace retired terms with current)
- Author-deployment gaps (add citations where the spec required them)
- Citation format violations (Bekker, BT/BCAP)
- Forbidden phrases (substitute)
- LaTeX/Markdown hygiene (italics, bold, em-dashes, block-quote markup)

Save the fixed version as `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionC.tex`.

### Step 4 — Produce the coherence-pass report

Write `tmp/Dissertation/Working tex versions/1.5-coherence-pass-report-versionC.md` documenting:

- Per-subsection word counts (actual vs. target)
- Coherence issues diagnosed (the per-category checklist from Step 2)
- Fixes applied (the per-category counts: e.g., "3 dual-trace → dual-resonance replacements; 2 Bekker corrections in §4; 1 missing Gross citation added in §7")
- Comparison handoff: a list of metrics for the user's versionA/B/C comparison (word counts, author distribution, citation density, forbidden-phrase count, terminology compliance count)

---

## 4. Expected Failure Modes and Diagnostic Targets

Specific failure modes the per-subsection architecture may exhibit that the rolling-context architecture would (in principle) avoid:

| Failure mode | Root cause | Step-2 diagnostic that catches it |
|---|---|---|
| Each subsection re-introduces "the actualization chain" architecture | No prior-section context; each subsection treats itself as standalone | (b) Missing transitions; opening of §§2–8 may be redundant scene-setting |
| Same Aristotelian quote (esp. *MA* 7, 701a32–33) cited in §3 AND §4 verbatim | Each subsection's evidence pack overlaps | (a) Repeated quotations |
| Gross missing from §§7–8 entirely | Per-subsection evidence packs may not push Gross hard enough without the rolling tracker | (d) Author imbalance |
| Inconsistent rendering of *technē*-hexis vs technē-hexis vs technē hexis | Each subsection's pipeline may resolve coinages differently | (c) Terminology drift |
| Heidegger deferral footnote absent | The footnote is specified in §8 — but the per-subsection pipeline may forget if §8's prompt does not reinforce it | (g) Deferral footnote check |
| Word counts vary widely from target | `--word-target` is a hint, not a hard cap; the multi-step pipeline may over- or under-shoot | Word-count audit in Step 4 |

Specific failure modes the per-subsection architecture should HELP with (the experiment is testing whether these gains outweigh the losses):

| Expected gain | Mechanism |
|---|---|
| Each subsection gets full attention budget | The pipeline does not have to balance 9 subsections against one 6,500-word global target |
| §4 (the typological core) gets a dedicated 1,300-word target run | The rolling-context version may have over- or under-allocated time/tokens to §4 |
| Gross verbatim quotes get full deployment guidance per subsection | Source E is included in §§6–8 evidence packs with the verbatim quotes inline; the pipeline cannot ignore them because they are the dominant secondary source in the per-subsection pack |
| Source diversity per subsection | Each subsection's pack is curated for that subsection's needs; the rolling-context's shared 60-chunk pool may have over-weighted Heidegger BCAP |

---

## 5. Comparison Protocol (user-executed after Claude's coherence pass)

After Claude produces `1.5 - A4 - Three Types of Action-v2-versionC.tex`, the user has three versions to compare:

- **versionA** (`1.5 - A4 - Three Types of Action-v2-versionA.tex`): rolling-context, no Source E injection
- **versionB** (`1.5 - A4 - Three Types of Action-v2-versionB.tex`): rolling-context, with Source E (Gross verbatim) injection
- **versionC** (`1.5 - A4 - Three Types of Action-v2-versionC.tex`): per-subsection + Claude coherence pass

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

The expected outcome is one of:

1. versionC is qualitatively better (per-subsection focus + coherence pass beats rolling-context)
2. versionC is qualitatively worse (rolling-context's sliding window is doing real work the coherence pass can't recover)
3. versionC is comparable (the experiment is null; the architecture choice does not load-bear on quality)

Whichever outcome, the comparison informs future per-section-vs-rolling-context decisions for §§1.6 and beyond.

---

## 6. Files this Workflow Produces

| File | Producer | Purpose |
|---|---|---|
| `tmp/Dissertation/Working tex versions/persubsection-runs/01-A4.tex` ... `09-DevNote.tex` | CLI (9 invocations) | Raw per-subsection outputs |
| `tmp/Dissertation/Working tex versions/persubsection-runs/coherence-diagnosis.md` | Claude (Step 2) | The Step-2 diagnostic report |
| `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionC-raw.tex` | Claude (Step 1) | v1 concatenation before fixes |
| `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionC.tex` | Claude (Step 3) | Final unified .tex after fixes |
| `tmp/Dissertation/Working tex versions/1.5-coherence-pass-report-versionC.md` | Claude (Step 4) | Coherence-pass audit report for user review |

**Backup discipline**: before Claude begins the coherence pass, snapshot the raw concatenation. Before any Edit that touches more than a single line, back up the working file to `tmp/Dissertation/.backups/<timestamp>-pre-<task>/`. This matches the dissertation's standing backup convention (memory: feedback-backup-before-changes).

---

## 7. Invocation Trigger

When the user has all 9 outputs and wants the coherence pass executed, they will invoke Claude with one of:

- "Run the coherence pass on the per-subsection §1.5 outputs."
- "Stitch the per-subsection §1.5 runs into versionC."
- "§1.5 versionC coherence pass."

Any of these phrases triggers the workflow described in §3.
