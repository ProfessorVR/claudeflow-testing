# Lanham Style Analyzer/Training → Archon (Rust) Port Plan

**Date:** 2026-06-24
**Source:** TypeScript "God Agent" Lanham subsystem (`/home/dalton/projects/claudeflow-testing`) — ~6,000 lines across ~12 files, mature/calibrated.
**Target:** Archon CLI (`ste-bah/archon-cli` v1.3.11) — Rust, 26-crate workspace, self-contained, cloud-LLM, CozoDB + RocksDB + fastembed/ONNX. Install guide: `archon-cli-macbook-setup.md`.
**Gate:** ALL implementation is blocked until Archon is installed and verified on the MacBook Air (todo #1).
**Method:** 5-subagent subsystem map → strategist → adversarial review (verdict: *endorse-with-changes*, high confidence). Corrections folded in below.

---

## 1. Headline finding (verified against source)

**"Draft prose that mimics a trained style" is a prompt-injection problem, not an NLP problem.** The draft-time injection path —

```
StyleProfileManager.load() → getActiveProfile()
   → generateStylePrompt()        (descriptive: Lanham axis labels + explanations)
   → buildLanhamStyleBlock()       (prescriptive: AT/THROUGH mode, register/voice targets, tacit budget)
   → buildGoldStandardPrompt()     ([1]/[2]/[2b] assembly)
```

— is **pure string templating over a persisted JSON profile**. It imports only `node:fs`/`node:path`, **zero npm deps, zero POS tagging**. `gold-standard-prompt-builder.ts` and `style-injector.ts` import neither `lanham-shared` nor the analyzers; `buildLanhamStyleBlock` reads only a categorical `LanhamStyleTarget`.

The two hardest things to port — the **`en-pos` POS tagger** and the **582-line clause parser** — live one layer down in the *analyzers*, which run **only at training time** (`createProfile → analyzeDeepMultiple`) and as a **post-draft QA gate** (`write-pipeline-orchestrator.ts:1205`). They are **not on the path to the immediate goal.**

The active profile (`dalton-philosophical-mo2fmhy2`) **already carries a complete frozen `lanhamMetrics` object** (20 keys incl. labels + explanations, nested at `characteristics.lanhamMetrics`) plus `metadata.suggestedLanhamTarget`. It can ship as a **data artifact** and be rendered in Rust **with no analyzer at all.**

**Consequence:** we can deliver the user's goal at Phase 1 (small, pure-Rust, Node-free) and quarantine the hard NLP into clearly-bounded optional later phases that are only needed for *in-Archon retraining of brand-new styles*.

---

## 2. Options considered

| Option | Effort | Archon fit | Verdict |
|---|---|---|---|
| **A — Full native-Rust reimplementation** (incl. en-pos + clause parser now) | XL | Highest *if completed* | Over-scoped: puts the two riskiest ports on the critical path for capability the goal doesn't need. |
| **B — LLM-prompt-only** (ship profile + prescriptive block; LLM-as-judge for drift) | S | Good on self-containment | Abandons the project's actual asset — the deterministic, gold-calibrated, train-free scorer — for non-deterministic, cloud-cost LLM judgment. |
| **C — Hybrid (RECOMMENDED)**: pure-Rust injection now → POS-free analyzer + controller next → en-pos & clause parser as optional later phases | L (front-loaded value at S) | Best overall | Delivers the goal fast, stays self-contained throughout, preserves calibrated IP, defers the hard work. |
| **D — Sidecar** (keep TS analyzer, Archon shells out to Node) | M | **Worst — disallowed** | Reintroduces a Node runtime, breaking Archon's "no Node.js needed" self-contained design. **Rejected.** |

**Recommendation: Option C**, corrected per the adversarial review (§4–§6).

---

## 3. Phased plan

### Phase 0 — Gate + discovery (on the Mac, after install) ⟵ *the dominant unknown lives here*
Stand up Archon (CozoDB/RocksDB/fastembed init, Anthropic key, `archon-init.sh` scaffold, `.archon/config.toml`). **Before any Rust, answer two questions that branch the whole port:**
1. **Does Archon already have a native style-profile / few-shot style-conditioning concept?** If **yes**, the immediate goal is likely a *data transform* (serialize `characteristics` + `samplePhrases` + `suggestedLanhamTarget` into Archon's native style input) — **not** a new crate. Only build `archon-lanham` if Archon lacks native style conditioning.
2. **Does Archon expose a draft-prompt injection seam, or own the entire draft prompt?** Determines how literally `buildGoldStandardPrompt`'s `[1]/[2]/[2b]` structure ports.

**Deliverable:** verified install + a one-page note answering (1) and (2) and choosing profile persistence (CozoDB relation `profiles{id => json}` vs RocksDB JSON blob). **No porting starts until this exists.**

### Phase 1 — Pure-Rust prompt injection *(delivers the user goal)*
- `serde` structs for `StoredStyleProfile` / `StyleCharacteristics` / `LanhamProseMetrics` / `LanhamStyleTarget` derived from the **actual** `style-profiles.json` (superset metadata: `suggestedLanhamTarget`, `metricsProvenance`, `lanhamAnalyzerTier`, `lanhamEnrichedAt` are NOT in the TS interface → `#[serde(default)]` + `Option`). **Note nesting:** `characteristics.lanhamMetrics`, `metadata.suggestedLanhamTarget`.
- Port `StyleProfileManager.load` + `getActiveProfile`, `generateStylePrompt` (descriptive, incl. the `PROSE STYLE DIMENSIONS` sub-block) **verbatim**, `buildLanhamStyleBlock` **verbatim**, and `buildGoldStandardPrompt` `[1]/[2]/[2b]` assembly.
- Seed the existing profile store into CozoDB / bundle as data.
- **HARD GATE (critique fix):** the active profile's `samplePhrases` contain `"the user to" / "the user is"` VR-thesis noise, and `generateStylePrompt` (`style-analyzer.ts:634`) injects `samplePhrases.slice(0,5)` **verbatim** into every draft prompt. **Retrain a clean profile via `/god-learn-style` (or scrub the phrases) BEFORE freezing the profile as the data artifact.** Shipping as-is injects garbage instructions into the mimicry prompt.
- **ADD a mimicry-evaluation deliverable (critique fix):** re-measure Archon's drafts and compare axes/labels back to the trained profile's `characteristics.lanhamMetrics` (deterministic re-analysis once Phase 2 exists, or LLM/human A-B in the interim). String-diff prompt parity is necessary but is **not** the user's acceptance criterion — "it mimics" must be falsifiable.

**Deliverable:** Archon console/writing drafts in the active trained style; descriptive + prescriptive blocks render identically to TS (string-diff tested) **and** a mimicry check shows drafts track the profile's measured metrics. No Node, no Python, no runtime POS.

### Phase 2 — Deterministic POS-free analyzer + style-gate controller
- Port `lanham-shared` pure utils (tokenize, splitSentences, clamp, Phase-D metrics, `TRANSPARENT_NORM`, all word-lists **byte-for-byte**) + `GENRE_THRESHOLDS`/`GENRE_DEFAULTS` as `const` data.
- Refactor `LanhamProseMetrics` to **enum-addressable axes** (prerequisite for the controller).
- Port the **~5 POS-free axes at full fidelity** (voice, opacity, tacit patterns, periodic/running via `leftBranchRunning` fallback, lexical parts of nounVerb/register). Register F-score + parataxis `that`-disambiguation use the graceful-degradation path until Phase 3.
- Port `LanhamStyleController` (`mergeWithPolicy` + `AXIS_OWNERSHIP`/`AXIS_OVERRIDE_POLICY` tables + `computeLanhamDrift` + `maybeRegenerateWithLanham` single-regen, `regenerateFn` wired to Archon's native cloud client). Preserve the **"never fail the pipeline on style analysis"** Result-fallback contract.
- **HONESTY NOTE (critique fix):** `maybeRegenerateWithLanham` (controller lines 347/357/438) runs `analyzer.fullAnalysis()` **on the generated draft**, and that analyzer pulls `en-pos` (`lanham-shared.ts:39-48`, silent `'NN'` fallback). So the **deterministic drift-gate itself is degraded on register + parataxis until Phase 3.** The "C preserves the calibrated scorer vs B" edge is only **~5/7 real pre-Phase-3** — state this plainly; don't sell Phase 2 as full-fidelity gating.

**Deliverable:** Archon deterministically scores drafts and gates a single local regeneration (no LLM-judge), behind a stable `ILanhamAnalyzer` trait. Golden-tested on the POS-free axes.

### Phase 3 *(optional)* — Native `en-pos` reimplementation for full-fidelity retraining
Reimplement `en-pos` in Rust: `en-lexicon` as a `phf` data table, `en-inflectors` as rule functions, Brill-style smoothing, `cities-list`/`humannames` as bundled gazetteers — emitting identical Penn-Treebank tags. Wire behind `ILanhamAnalyzer` to light up register's F-score, parataxis `that`-disambiguation, and full nounVerb verb-counting. **Golden-test fixture suite comparing Rust tags to the JS tagger; a missing/wrong tagger must be a HARD ERROR, not silent all-`NN` degradation** (silent degradation flips calibrated label bands). Replace DOCX/PDF extraction with Archon document intelligence (drop python/poppler). **This is the L3 capability (§6) — a planned fast-follow, not a blocker: it upgrades Mac-trained profiles from ~5/7 to full 7-axis fidelity and removes the need to train-here-and-port. Until it lands, train full-fidelity profiles here and port the JSON.**

### Phase 4 *(optional, lowest priority)* — Tier-2 clause parser for periodic precision
Port `lanham-clause-types` + `lanham-clause-parser` (9 stages; `resolveMatrixClause` must become index-based; `assignDepths` needs a cycle guard / depth cap the JS lacks) + `lanham-clause-features`. Cache one `ClauseParseDocument` per `fullAnalysis`; drop the discarded parataxis shadow-mode call. Promote `periodicRunning` to Tier-2 per `AXIS_OWNERSHIP` (+0.130 monotonicity). Only if periodic precision matters for the writing.

---

## 4. Rust dependency gaps

| Dependency | Used for | Rust path | Severity |
|---|---|---|---|
| **`en-pos`** (+ en-lexicon/en-inflectors/cities-list/humannames) | Penn-Treebank POS tagging **inside analyzers only (training/QA-gate time)**: nounVerb verb-counting, parataxis `that` disambiguation, register F-score, clause cues. **NOT on the draft/injection path.** | Reimplement natively: deterministic lexicon lookup + inflector morphology + Brill smoothing, **no model file**. Bundle data as `phf` maps. **Reject** rust-bert/ONNX POS (heavy, shifts tag distribution) and **reject** any Node shell-out. Golden-test against the JS tagger. | **hard** (deferrable to Phase 3) |
| **`lanham-clause-parser`** (9-stage POS pipeline) | Tier-2; materially affects **only** `periodicRunning` (`matrixDelayMean`, 0.45 weight). Pure shadow-mode in parataxis. Needs en-pos. | Index-based rewrite + cycle guard. Defer entirely for v1 (`leftBranchRunning` fallback). | **hard** (deferrable to Phase 4) |
| JS regex semantics (`/gi` global count, lookahead, `\w`/`\b` unicode) | Marker counting, clause tokenization, agent full-rewrite | `regex` crate (`case_insensitive`, `find_iter().count()`); rewrite the one lookahead via manual scan or `fancy-regex`; `Replacer` for capture callbacks; pin Unicode word semantics. | moderate |
| `python3`+zipfile (DOCX) / `pdftotext`/poppler | Extract text from user PDFs/DOCX before training | Reuse Archon's document intelligence; if standalone, `zip`+`quick-xml` (DOCX), `pdf-extract`/`lopdf` (PDF). **Do NOT carry the python shell-out.** | easy (training-only) |
| `style-profiles.json` flat store | Persist/load trained profiles | `serde` structs from the actual JSON → CozoDB relation or RocksDB blob | easy |
| `@anthropic-ai` SDK / raw fetch | Offline calibration judge (one-time) + `regenerateFn` at draft time | Use Archon's native cloud client; controller is already provider-agnostic (boxed async `Fn`). **Revalidate model id — `claude-sonnet-4-6` in `run-judge.ts:29` is stale**, and the regen prompt was tuned on an unknown model. | easy |

---

## 5. Frozen artifacts — copy as data, never re-derive

- **`GENRE_THRESHOLDS` + `GENRE_DEFAULTS`** (`lanham-style-policy.ts`) — THE live calibration source of truth (the `general` Phase-F values nounVerb 0.58/0.85, voice 0.10/0.31 are transcribed weight-optimizer output). Port verbatim as a Rust `const` table.
- **`.agentdb/universal/style-profiles.json`** — the trained profile store (active = `dalton-philosophical-mo2fmhy2`). Derive serde structs from THIS, not the TS interface. *(Clean samplePhrases first — §3 Phase 1 gate.)*
- **`TRANSPARENT_NORM` centroid `[22.5,4.8,0.045,0.48]`, `goldMean [24.0,4.7,0.055,0.46]`, `goldStd [10.0,0.6,0.025,0.05]`** (`lanham-shared.ts`) — load-bearing for `opacityDeviationFromNorm`; not regenerable without the gold set. Byte-for-byte.
- **All inline word-lists / suffix-lists / marker-regex arrays** in `lanham-shared.ts` (BE_VERBS, COMMON_VERBS, PREPOSITIONS, conjunction sets, FORMAL/META/OPACITY/PERSONALITY markers, NOMINALIZATION/LATINATE suffixes, NOM_EXCLUSIONS, STOP/FUNCTION_WORDS) — calibrated, byte-for-byte.
- **Hardcoded scoring divisors/weights** embedded in the analyzer formulas (nounSignal 0.45/0.25/0.30; opacity 7-term blend; voice 0.60/0.40; tacit→opacity 0.50/0.25/0.15/0.10; periodic ensemble 0.45/0.30/0.25; parataxis 0.50/0.20/0.05/0.10; cue confidences) — these **are** the calibrated model. Port only the **active** formulas (skip commented-out Phase C/D variants).
- **`AXIS_OWNERSHIP` / `AXIS_OVERRIDE_POLICY` / `SCORE_FIELDS` / `DEFAULT_REGEN_CONFIG`** (`lanham-style-controller.ts`) — tier-merge + promotion contract (`periodicRunning` is the only promoted Tier-2 axis). Preserve the blocked-axis invariant.
- **`data/academic-word-list.ts` (AWL_WORDS)** — port as data (near-dormant but retained for calibration).
- **`god-learn/analysis-trajectories.jsonl`** (19) + DENOMINALIZATIONS (29) — only if porting the `LanhamProseAnalyst` agent.
- **`lanham-calibrated-weights.json` / `lanham-gold-set.jsonl` / `expansion-corpus.jsonl`** — copy **only if re-calibrating**. NOT runtime-loaded (grep-confirmed 0 src hits). Do **not** wire as runtime config; the live thresholds are `GENRE_THRESHOLDS`.

---

## 6. Capability levels (user requirement 2026-06-24: train a style on the Mac OR port one from here, immediately)

> **✅ DECISION LOCKED (2026-06-24): L2 now → L3 fast-follow.** Build L2 (train-on-Mac at 5/7-axis fidelity, no `en-pos`) + use train-here-and-port for guaranteed full fidelity meanwhile; add the `en-pos` Rust module later to reach L3. **The upgrade is purely additive** — L2 MUST be built with the POS-tagger seam in place (the analyzer consumes tags through one `tag_pos()` function with the fallback already wired), so L3 = fill in the real Rust tagger + golden tests, with **no rework** of injection / controller / profile store / the other 5 axes. Only chore at upgrade time: a cheap one-shot re-enrich of register + parataxis on any profiles trained *on the Mac during the L2 period*.

**Verified:** `StyleProfileManager.createProfile` (`style-profile.ts:53`) computes the base profile via `StyleAnalyzer.analyzeDeepMultiple` — **pure heuristic, no LLM call, no `en-pos`.** `en-pos` enters only through the *optional* Lanham enrichment, and only **2 of 7 axes** use it (register F-score, parataxis `that`-disambiguation); the analyzer degrades gracefully without it (`tagPOS → []`). Therefore **training a new style on the Mac does NOT require the `en-pos` Rust port** — it requires porting the (heuristic, POS-free) base `StyleAnalyzer`.

| Level | Capability | What to port | `en-pos`? |
|---|---|---|---|
| **L1** | Mac **drafts** in any existing profile (ported from here) | Phase 1 (injection + serde profile) | No |
| **L2** | Mac **trains brand-new** profiles, ~5/7-axis fidelity (register/parataxis degraded, recomputable) | Phase 1 + base `StyleAnalyzer.analyzeDeepMultiple` + POS-free Lanham analyzer (Phase 2 scope) | No |
| **L3** | Mac trains new profiles at **full 7-axis fidelity, fully self-contained** | + Phase 3 (`en-pos` Rust reimpl) | Yes |

**Escape hatch (matters):** existing profiles port as pure data and are byte-for-byte correct, so you can always **train here (full `en-pos`) → port the JSON** to land a fully-correct new profile on the Mac *without* the `en-pos` Rust port. **L3 only matters if the Mac must train at full fidelity with no access to this machine.**

**Recommended build = L2 now + train-here-and-port escape hatch, with `en-pos` (→L3) as a fast-follow.** This delivers *both* "port from here" and "train on the Mac" immediately, no `en-pos` blocker. **Caveat:** profiles trained on the Mac *before* `en-pos` lands bake in degraded register/parataxis — recompute those two axes once `en-pos` ships (parataxis is already the weakest axis at 0.378 mono even *with* `en-pos`, so the practical loss is small; register is partly carried by base characteristics + the categorical target).

### Secondary decisions
- **Drift/QA gating:** deterministic local analyzer (Phase 2; degraded on register/parataxis until `en-pos`) vs. LLM-judge (cloud cost, non-deterministic) vs. none-for-now.
- **Profile hygiene:** retrain a clean profile via `/god-learn-style` before freezing as data (recommended), or scrub `samplePhrases` in place.
- **Persistence:** CozoDB relation vs RocksDB JSON blob (decide at Phase 0 once Archon's memory model is confirmed).
- **Genre coverage:** academic-only, or all 6 `GENRE_THRESHOLDS` active (all port as data either way; affects test priorities).

---

## 7. Standing constraints (do not violate)

- **Never reintroduce Node or Python at runtime** — it breaks Archon's self-contained "no Node.js needed" design. (Kills Option D and the python DOCX shell-out.)
- **Calibration stays frozen-as-data** in every phase — never re-derive thresholds in the port.
- **A wrong/missing POS tagger must be a hard error, not silent `all-NN` degradation** — silent degradation flips calibrated label bands invisibly.
- **String-diff prompt parity ≠ mimicry.** Keep a falsifiable mimicry-evaluation check.
