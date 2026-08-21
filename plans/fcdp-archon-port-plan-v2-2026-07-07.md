# Porting FCDP v2 → archon-cli — Plan **v2** (research-hardened)

**Date:** 2026-07-07 · **Status:** DRAFT v2, awaiting user review (multi-round per plan-review process)
**Supersedes:** `fcdp-archon-port-plan-2026-07-07.md` (v1, retained read-only)
**Source protocol:** `plans/fable-console-drafting-protocol-v2.md` (FCDP v2)
**Target host:** `archon-cli`, pinned at `archon-lanham` SHA `bfa6999fe` (branch `feat/marker-server-parallel-ingest`)
**Research basis:** 3 × Perplexity `sonar-deep-research` queries 2026-07-07 (raw outputs + citation lists archived at `plans/fcdp-archon-port-research-2026-07-07.md`; ~$2.33 total) + the prior FCDP research report of 2026-07-02.
**Push discipline:** archon commits/pushes ONLY from WSL ([[feedback-archon-push-from-wsl-only]]).

**Evidence bar (user directive, 2026-07-07):** an improvement is adopted only with substantial, valid backing from prestigious universities or research organizations. Every adopted move below names its backing and an evidence grade (STRONG / MODERATE / CONTESTED / WEAK, per the research reports' own grading). Moves that failed the bar are listed in §6 (Considered and rejected). Items that are pure engineering hygiene — not research claims — are labeled `[hygiene]` and carry no institutional citation because none is applicable.

**Locked constraints (carried from v1, unchanged):**
1. **Sandbox-first** — no archon code touched; all build/validation in `/home/dalton/projects/fcdp-archon-sandbox/` (A1: standalone workspace, read-only path deps). Integration only after the sandbox proves portability + integratability.
2. **Isolated fork (B1)** — dedicated fork of `ste-bah/archon-cli`; merge target = `ProfessorVR/archon-cli`; fork creation deferred until first persist.
3. **Recalibrate G-A bands on Rust** — no transfer of TS-calibrated bands.
4. **C1** MA-applications register first · **D2→D1** vertical-slice checkpoint, full-E2E merge gate · **E** typed serde pack schema, command surface decided at integration.

---

## 0. What changed v1 → v2 (changelog, research-driven)

| # | Change | Trigger | Backing grade |
|---|---|---|---|
| R1 | **Variance-derived, feature-tiered tolerance bands** replace fixed-width recentering; the 2026-07-07 band lock is REOPENED | Self-consistency failure found in-house + stylometric within-author-variance literature | STRONG |
| R2 | **Scale-matched measurement**: two-tier gating — stable features gated per section, noisy features accumulated and gated at chapter scale | Minimum-sample-size literature; 400–800 w sections explicitly under-powered | STRONG |
| R3 | **Exemplar passages added to D2 sub-packs**; numeric style targets retained for *measurement* (G-A) but demoted as the sole *steering* mechanism | Numeric-target steering = WEAK evidence; exemplar conditioning = MODERATE | MODERATE |
| R4 | **Same-model judge panels NOT adopted**; single Fable judge kept, hardened with rationale-before-verdict + battery-order randomization; optional cross-model audit surfaced as a user decision | Panel gains come from judge *diversity*; same-family panels inherit shared bias (preference leakage; self-preference) | STRONG (that diversity drives gains) / MODERATE (preference leakage) |
| R5 | **Judge output = free prose then mechanical extraction**, not strict constrained-JSON decoding | Format-restriction degradation findings; contested but the hedge is free | CONTESTED |
| R6 | **Disclosure-declaration generator**: per-section AI-use declaration auto-derived from the provenance log, formatted to named university templates | Cambridge template declaration; Harvard HGSE granularity (tools + prompts + integration); EC Living Guidelines 2024 | MODERATE (policy documents, not experiments) |
| R7 | **Hash-chained per-passage provenance CONFIRMED and kept** — research verdict: ahead of current norms, proportionate given contested-authorship stakes, cheap because `archon-provenance` exists | W3C PROV-DM; C2PA; university policies requiring auditable AI trails | MODERATE |
| R8 | **Epistemic-status note added**: no institution has empirically validated a gate-enforced dissertation pipeline end-to-end; the composition is principled but unproven — M6 is our own validation and the user remains the arbiter | All three research reports flag this explicitly | — (honesty clause) |
| H1 | `[hygiene]` Analyzer SHA pinned into fingerprint `_meta` (done); golden tests as canary on fork updates; hold-out cross-validation added to band derivation | — | — |

**Defect disclosure (mine):** v1's M0 exit criterion was met nominally, but the lock was premature. After locking I ran the self-consistency check that should have preceded it: **all three calibration documents fail the locked `avg_sentence_length` band** (docs span 28.7–38.6 w/sent; the FCDP ±3.5 width recentered on the 33.9 aggregate covers only 30.4–37.4), and Ontological Violence fails `dynamicRange` by 0.01. A gate that rejects 3/3 of its own calibration corpus on any metric is mis-derived. The research (§2 below) explains why: fixed ± widths ignore within-author variance, which is real, structured, and feature-dependent. R1 is the corrective. Reopening the lock needs your sign-off since you locked it on my recommendation.

---

## 1. Verdict and current state (carried from v1, still true)

Portable; archon-cli is the stronger host. Confirmed by sandbox work already done:

- Sandbox compiles + runs against `archon-lanham` as a **read-only path dep** — archon untouched (first integratability proof).
- `measure` harness emits all `LanhamMetrics` axes + the two missing G-A axes (avg sentence length, short/long shares) computed sandbox-side.
- The Rust analyzer **largely agrees** with the TS runner on the true 21k-word MA corpus (nominalization, preMainVerb, periodic, voice, opacity, latinate all match §8 targets); genuine deltas confined to nounVerbRatio, beVerbRatio, sentence-length axes.
- 3-doc calibration corpus measured per-doc + aggregate; MA PDF apparatus-stripped (20,823 w) — the corpus is register-coherent (all docs: balanced / paratactic / mixed / moderate-voice / opaque).

Existing-asset map (REUSE/PORT/BUILD table) and §1 findings of v1 remain valid; not repeated here.

---

## 2. Evidence base (what the deep research returned)

Grades are the research reports' own; attributions spot-checked against model knowledge — two Perplexity attribution glitches found and corrected below (it credited DSPy to "Khlaaf et al."; correct is **Khattab et al., Stanford NLP**; its "No Free Labels = Anthropic" attribution is uncertain and I do not rely on that paper). Both Q1/Q2/Q3 responses truncated mid-document (API budget behavior); each report's synthesis section was complete, and citation lists are archived.

**Stylometry (Q1):**
- **S1 · STRONG** — Stylometric estimate stability improves monotonically with sample size; robust content-agnostic fingerprints typically need thousands of tokens (5k–10k common in practice; one peer-reviewed pipeline explicitly selects 10,000-token chunks — *Mathematics* 2022, multilingual literary corpus). 400–800 w subsections are noisy; 2,000–5,000 w sections are viable measurement units. Consistent with the canonical minimum-sample study (Eder, *DSH/LLC* 2015, Pedagogical University of Kraków — from my knowledge, consistent with the research findings, flagged as such).
- **S2 · STRONG** — Within-author variance is non-trivial, structured, and **feature-dependent**: function-word and syntactic-complexity features are comparatively stable cross-topic; content-linked features fluctuate widely (survey evidence across ACL/EMNLP experiments; Göttingen/Kassel *Frontiers in Psychology* 2018 content-controlled study; U. Wrocław legal-stylistics 2021).
- **S3 · Methodological implication (the report's through-line):** tolerance bands should be derived from **empirical within-author distributions**, with tight bands only on stable features — not uniform fixed ± widths.
- **S4 · WEAK vs MODERATE** — Steering LLM style via prompt-injected **numeric stylometric targets: WEAK** evidence it works. **Exemplar-based conditioning and fine-tuning: MODERATE** evidence. (Q1 executive synthesis, stated verbatim.)
- **S5 · MODERATE, cautionary** — Authorship-representation verifiers (TACL 2023, incl. Google Research) can leak topic into "style" scores → keeps the trained same-author scorer in DEFERRED status (§6).

**Judge architecture (Q2):**
- **J1 · STRONG** — Ensemble/judge gains come from **diversity** (architecture, training, prompting); same-family panels inherit shared biases (SIGIR 2024 LLMJudge resource analysis; Edinburgh SkillAggregation; ensemble studies).
- **J2 · MODERATE** — **Preference leakage / self-preference**: judges systematically favor outputs from their own model family, surviving anonymization and eval-tuning (Hu et al. 2025, multi-university preprint with extensive experiments; consistent with Panickssery/Bowman/Feng, NYU, NeurIPS 2024 — peer-reviewed).
- **J3 · STRONG (as methodology)** — Decomposed binary/checklist rubrics beat undifferentiated scalar scoring for reliability and calibration (CheckList lineage — Ribeiro et al., UW/MSR, ACL 2020, replicated; G-Eval, Microsoft, EMNLP 2023 for structured judging). *Confirms FCDP's existing binary batteries.*
- **J4 · CONTESTED** — Strict format constraints (JSON-mode / constrained decoding) may degrade reasoning quality in judge/reasoning tasks ("Let Me Speak Freely?", EMNLP 2024 Industry, with published rebuttals showing careful schema design closes the gap). Evidence mixed → hedge, don't bet.
- **J5 · MODERATE→STRONG** — Cheap deterministic gates before expensive model gates; explicit assertion semantics (DSPy — Khattab et al., Stanford, NeurIPS/ICLR-era, peer-reviewed; CheckList ACL 2020). *Confirms FCDP's mechanical-first gauntlet ordering.*
- **J6 · MODERATE** — Self-refinement returns diminish past ~2–3 iterations; fresh-context critics outperform same-context self-review (Self-Refine — Madaan et al., CMU et al., NeurIPS 2023; Q2 synthesis). *Confirms FCDP's ≤3 loop and fresh-judge-per-cycle rule.*

**Disclosure/provenance (Q3):**
- **P1 · MODERATE (policy corpus)** — Named university requirements now exist for dissertation-level AI disclosure: **U. Georgia Graduate School** (thesis/dissertation-specific policy), **Harvard HGSE** (disclose tools + prompts + how output was integrated), **Cambridge** (template declaration document for generative-AI use), Oxford, Princeton History, ETH Zurich, UC Berkeley grad division; **EC Living Guidelines on Responsible Use of Generative AI in Research (2024)**.
- **P2 · MODERATE** — W3C **PROV-DM** (W3C Recommendation 2013) and **C2PA** give formal provenance vocabularies; fine-grained per-passage text provenance is *emergent*, not yet required by any policy → FCDP's hash-chained log **exceeds** current norms (conservative, defensible, not over-engineered *given the stakes and the near-zero marginal cost via `archon-provenance`*).
- **P3 · honest negative** — No peer-reviewed empirical validation exists for multi-stage gate-enforced dissertation pipelines as a whole; institutional guidance is principles-level. (Feeds R8.)

---

## 3. The moves, in detail

Format per move: **What · Why (with backing) · Pros · Cons · Implementation risks · Long-term risks.** Milestone mapping in §4.

### Move 1 — REOPEN and re-derive G-A bands: variance-derived, feature-tiered (R1) — *replaces the 2026-07-07 lock*

**What.** Discard the fixed-width bands. New derivation: slice the 3-doc calibration corpus into overlapping windows at draft scale (primary window = 1,000 w, step 250 w → ~140 windows over 37k words); compute every metric per window; set each metric's band from its **empirical within-author distribution** (default P5–P95, per-metric review); assign each metric to a **tier** — Tier-1 (stable: function-word-type ratios, beVerb, nominalization, latinate, sentence-length family) gets gating force; Tier-2 (noisy at window scale: periodicRunning, preMainVerbClause, parataxisHypotaxis, tacit-figure counts, dynamicRange) gates only at accumulated scale (Move 2) or advisory-only per section. Validate by **leave-one-document-out cross-validation**: bands derived from 2 docs must pass the held-out doc on all gating-force metrics, for all three rotations. `[hygiene]` component: derivation script + windows + rotation results all persisted in `sandbox/fingerprints/`.

**Why.** (a) In-house defect: the locked bands reject all 3 calibration docs on `avg_sentence_length` — empirical proof the fixed widths are narrower than your natural spread. (b) S2/S3 (STRONG): within-author variance is real and feature-dependent; bands must come from measured distributions, tight only where the feature is stable. (c) The LOO check operationalizes "the gate must accept the author it was calibrated on" — the minimal validity condition a style gate can have.

**Pros.** Bands become *defensible* (derived, not asserted); per-metric widths self-adjust to your actual variance; the tier split stops noisy metrics from generating false defects that would trigger pointless R-cycles (each avoided false defect saves a full re-gauntlet); LOO gives a concrete pass/fail criterion for the derivation itself.

**Cons.** More sandbox code (windowing + percentile + LOO harness, ~a day); bands will be *wider* than FCDP's on some metrics — the gate becomes more permissive, catching only real drift; three documents is a small basis for P5/P95 tails (percentiles on ~140 overlapping windows are serviceable but not luxurious).

**Implementation risks.** Overlapping windows inflate effective n (windows are autocorrelated) → tails look more stable than they are; mitigate by also computing non-overlapping-window percentiles as a check. Percentile choice is a knob — P5–P95 vs P10–P90 changes strictness; surface both to you at review rather than choosing silently.

**Long-term risks.** Bands calibrated on pre-2026 prose slowly diverge from your evolving voice → schedule recalibration after every ~2–3 accepted sections (FCDP already anticipated band tightening; this formalizes it). If the calibration corpus is ever extended, the tiers must be re-derived, not just the centers — document this in the fingerprint `_meta`.

### Move 2 — Scale-matched, two-tier gating (R2)

**What.** G-A runs at two scales. **Per-section (400–1,500 w):** hard gate on Tier-1 metrics + categorical labels only; Tier-2 metrics reported as advisory with a "measured at unreliable scale" tag. **Accumulated (chapter / ≥2,500 w of accepted+candidate prose):** hard gate on everything, Tier-2 included. A section can therefore pass alone but be flagged when the growing chapter drifts.

**Why.** S1 (STRONG): 400–800 w is under-powered for clause-level and rhythm metrics; 2,000–5,000 w is the viable unit. Gating a 500-word subsection on `periodicRunningRatio` is statistically meaningless — the v1 plan would have done exactly that. This was the single clearest research-driven correction to the port design.

**Pros.** Eliminates the largest class of statistically-spurious gate failures; matches how the dissertation is actually assembled (sections accrete into chapters); the advisory tags still surface early warning without forcing revision churn.

**Cons.** Slightly more complex comparator (two thresholds sets + accumulation state); a genuinely off-rhythm short section won't be *forced* to revise until enough neighboring prose accumulates — the user's read remains the real-time rhythm check (which FCDP's handoff already assumes).

**Implementation risks.** Accumulation bookkeeping across drafting cycles (which prose counts as "accepted") must be defined — simplest: everything user-signed-off in the current chapter + the candidate section. Defined in the comparator spec at M2.

**Long-term risks.** Advisory flags that are routinely ignored train habituation; mitigate by including advisory-flag history in the accumulated-scale gate report so drift is visible in one place.

### Move 3 — Exemplar conditioning in D2; numeric targets demoted to measurement (R3)

**What.** Extend the pack schema with **P2b EXEMPLARS**: 2–3 short passages (150–300 w) per movement *type* (theoretical exposition / close reading / transition-argument), hand-tagged once from the calibration corpus. D2's per-movement sub-pack carries the matching exemplars with the instruction "match the texture of these passages," *alongside* (not replacing) the numeric rhythm directives. G-A still measures numerically — the change is to the steering side only. D1 still emits numeric per-movement targets (they parameterize the *gate*, and remain useful plan documentation).

**Why.** S4: numeric-target steering is WEAK-evidenced; exemplar conditioning is MODERATE-evidenced. FCDP v2 bet on numbers for steering because they're checkable; the research says models *follow examples* better than they follow stylometric arithmetic. Keeping both costs one pack field.

**Pros.** Better first-draft voice → fewer G-A failures → fewer R-cycles (the most expensive commodity in the loop); exemplars are also human-auditable (you can see exactly what texture is being asked for); zero new tooling — it's pack content.

**Cons.** One-time curation cost (you or I tag exemplars per movement type — ~an hour with your sign-off); adds ~600–900 w per D2 sub-pack (trivial against Fable's context); risk of the model *quoting or closely paraphrasing* an exemplar — G-B/G-E do not currently watch for this.

**Implementation risks.** Exemplar leakage into the draft: add a cheap mechanical sub-check to G-B — n-gram overlap (say, any 8-gram) between draft and exemplar passages → defect. Small addition, closes the hole.

**Long-term risks.** Exemplars freeze a 2018–2026 voice snapshot even as your voice evolves — same staleness clock as the bands; refresh exemplars at the same recalibration cadence. Also a subtle homogenization pressure: every movement of a given type steered by the same 2–3 exemplars could flatten within-type variety; rotating which exemplars ship per section (from a pool of ~5 per type) is a cheap counter.

### Move 4 — Judge hardening without same-model panels (R4)

**What.** Keep FCDP's single-judge G-E and G-G on Fable with lean contexts. Add three zero-cost mitigations: (a) **rationale-before-verdict** — each battery item answered as one-sentence-reason-then-YES/NO, never verdict-first; (b) **battery-order randomization** per call (deterministic seed from section ID, recorded in provenance — no `Date.now()`-style irreproducibility); (c) **defect-affinity blinding** — judge prompts state only the rubric, never which stage produced the text or that "this already passed N gates" (anchor removal). **Do not** add a panel of Fable judges. **Option for your decision (§5-i):** a single cross-model *audit* call (e.g., Opus 4.8) on G-E only, at the final R-cycle only — a verifier, not a prose judge, so arguably outside FCDP's "Fable at every prose-judging step" invariant; your call whether the invariant is about capability (then Opus auditing is fine) or purity (then skip).

**Why.** J1 (STRONG): panel gains require judge diversity — N Fable judges are correlated samples, near-zero marginal information for N× cost. J2 (MODERATE): same-family self-preference is exactly our configuration (Fable drafts, Fable judges); FCDP's lean-context rule already blunts the *recognition* channel, and (a)–(c) are the standard validated-or-promising mitigations that cost nothing. J3 (STRONG) confirms the binary battery format — unchanged.

**Pros.** Free reliability gains; avoids the panel's cost trap; the cross-model audit option gives a genuinely *diverse* second opinion precisely where stakes are highest (foundation fidelity at the last cycle).

**Cons.** Randomization + blinding add small prompt-assembly complexity; the cross-model audit (if adopted) adds one API dependency and mild protocol impurity.

**Implementation risks.** Rationale-before-verdict lengthens judge outputs → extraction (Move 5) must parse reason+verdict pairs robustly; battery randomization must never split logically-dependent items (batteries are independent by design — verify at authoring time).

**Long-term risks.** Self-preference is a *systematic* bias — mitigations reduce, don't eliminate. The backstop is architectural: mechanical gates and the user's read are model-free. If future drafts start passing G-E while reading wrong to you, that's the trigger to escalate to the cross-model audit (mirrors FCDP's deferred-scorer trigger pattern).

### Move 5 — Judge output: free prose, mechanical extraction (R5)

**What.** Judge calls answer in plain structured-ish prose (numbered items, reason then YES/NO). A sandbox-side extractor (regex over the numbered battery) converts to the defect list. No JSON-mode, no constrained decoding, no schema-forced generation in judge calls. If extraction fails → re-ask *formatting only* (verdict content never re-judged by the formatter pass).

**Why.** J4 (CONTESTED): format-restriction degradation is disputed, but our configuration doesn't need to take the bet — batteries are trivially extractable from prose, so the hedge costs one regex. When evidence is mixed and one side is free, take the free side.

**Pros.** Removes a possible quality tax on the highest-stakes calls; extraction failures are visible and mechanically retryable; judge transcripts stay human-readable for the provenance log.

**Cons.** Extraction is one more small component to test; malformed outputs cost an occasional extra formatting round-trip.

**Implementation risks.** Ambiguous verdicts ("mostly yes") — extractor treats anything not cleanly YES/NO as a defect-side answer (fail-closed), which is the conservative direction for a gate.

**Long-term risks.** Minimal; if constrained decoding is later shown harmless for this class of task, switching to it is a one-line change, and nothing in the pipeline depends on the free-prose choice.

### Move 6 — Disclosure-declaration generator (R6)

**What.** A small sandbox tool: reads the provenance log for a section → emits a **declaration of AI use** naming (i) tools/models + versions, (ii) what the model contributed (phrasing/structure over pack-supplied evidence, per P9), (iii) what it was barred from (claims, citations, quotations — with the mechanism stated), (iv) the human control points (D1 approval, per-cycle review, final sign-off), (v) pointer to the full provenance chain. Output formatted to match the **Cambridge template declaration** structure and the **HGSE granularity standard** (tools + prompts + integration). Generated per section, aggregated per part for the dissertation's front-matter statement (P9's "eventual LLM-disclosure statement" becomes *generated*, not hand-written).

**Why.** P1: named institutions now require disclosure at precisely this granularity; FCDP planned the statement but not its automation. The provenance log already contains every fact the declaration needs — generating it makes the disclosure *provably consistent with* the log instead of a parallel hand-maintained claim.

**Pros.** Near-zero marginal cost (the data exists); the declaration can never drift from the actual record; instantly adaptable if your institution publishes its own template; strong examiner-facing story (declaration backed by hash-chained evidence).

**Cons.** Your institution's actual policy may differ from the referenced templates — the generator targets the *strictest* named granularity, which may over-disclose relative to local requirements (over-disclosure is the safe direction, but it's your narrative to control).

**Implementation risks.** Template mismatch — mitigate by making the output a draft-for-your-edit, never auto-final. Trivial engineering otherwise.

**Long-term risks.** Policy landscape is moving (2023–2026 documents may be revised by defense date); the generator isolates policy formatting in one template file so a policy change is a template edit, not a pipeline change.

### Move 7 — Provenance: hash-chain confirmed, W3C-PROV export kept (R7)

**What.** Unchanged from v1 mechanically (`archon-provenance` records/edges per R-cycle, chain-hashed, `export_w3c` for PROV-JSON-LD) — but now with an explicit rationale statement in the plan and one addition: each provenance record carries the **gate report + judge rationales** (from Move 5's readable transcripts), making the chain self-explanatory rather than hash-opaque.

**Why.** P2: per-passage provenance *exceeds* current norms — the research explicitly framed the question "proportionate or over-engineered?" and the answer is: ahead of norms, proportionate given (a) contested-authorship stakes of an AI-assisted dissertation and (b) near-zero marginal cost since the crate exists and M5 was already building on it. W3C-PROV export means the record speaks a standards vocabulary any future auditor recognizes.

**Pros.** The strongest possible integrity story available to you; underpins Move 6 for free; no new build cost beyond v1's M5.

**Cons.** Storage/verbosity grows with cycles (trivially — text-scale data); over-documentation could invite scrutiny fishing ("why did cycle 2 fail G-E item 3?") — but the alternative (thin records) is strictly worse in any contested scenario.

**Implementation/long-term risks.** CozoDB store durability across machines — provenance DB must live with the dissertation repo backups, not only the sandbox `[hygiene]`; W3C-PROV is a stable 2013 Recommendation, no drift risk.

### Move 8 — Epistemic-status clause (R8)

**What.** A standing paragraph in this plan and in the M6 report: the individual mechanisms are evidence-backed (grades above); their *composition* into this pipeline has no direct empirical validation anywhere in the literature (P3); M6's E2E on a real section, judged by you, **is** the validation event, and every später section remains user-arbitrated.

**Why.** All three research reports independently flagged this. The user's evidence bar demands honesty about where the evidence stops.

**Pros/Cons/Risks.** Pure honesty clause — its only risk is the false comfort of *not* having it.

---

## 4. Milestones (v2 — amendments folded in)

- **M0 ✅ / M0.1 — band re-derivation EXECUTED 2026-07-07, candidate awaiting re-lock.** 137×1000w + 60×2500w windows measured; empirical tiers (5 Tier-1 survivors: avgSentLen, nounVerb, nominaliz, beVerb, opacity — dispersion demoted short/long shares, prepPhrase, latinate); Tier-2 chapter-scale bands at 2500w; LOO ×3 passes all T1 metrics except a documented avg-sentence-length heterogeneity (2019-MA 38.6 w/sent vs 2026 docs ~29 — real voice drift, spanned by the pooled band). Candidate: `sandbox/fingerprints/ga-bands-candidate-v2.json` (rec: T1 = pooled P10–P90 per-section; T2 = 2500w P5–P95 at chapter scale). *Exit:* user re-lock.
- **M1 — Pack + G-P** (+ **P2b exemplar field**, Move 3; exemplar pool tagged with your sign-off). *Exit:* real section's pack assembles + passes G-P.
- **M2 — Mechanical gates** (two-tier G-A comparator per Moves 1–2; G-B + exemplar-overlap sub-check; G-C/G-D greps; G-F; RAG-ban mode proven). *Exit:* named-defect list on a hand-written draft, including a seeded exemplar-leak.
- **M3 — Drafting orchestration** (D1/D1.5/D2; D2 carries exemplars + numeric directives; approval gate default-ON). *Exit:* pack → `«Qnn»` draft end-to-end.
- **M4 — Judge gates** (G-E/G-G with Move-4 mitigations; Move-5 extraction; seeded-defect draft must be caught; blinding verified by transcript inspection). *Exit:* claim-level verdicts, reproducible under the recorded randomization seed.
- **M5 — R-loop + provenance + disclosure** (≤3 cycles; Move-7 enriched records; Move-6 generator emits a draft declaration from a real log). *Exit:* converge-or-surface behavior; chain verifies; declaration renders.
- **M6 — Sandbox E2E = the validation event (Move 8; D1 gate).** One live Part-II §4+ section, full P→R, all gates, declaration, provenance. *Exit / merge gate:* gauntlet green + **you judge it on-voice** + declaration acceptable.
- **M7 — Fork integration** (only after M6; B1 fork created at this point; promote sandbox modules; PR to `ProfessorVR/archon-cli`).

Sequencing: M0.1 first and alone (bands parameterize M2). M1 ∥ M0.1 tail is acceptable (pack schema doesn't depend on band values). D2-slice checkpoint after M4 (pack + G-A + G-E + provenance on a short sample) per locked decision D.

### Milestone status — autonomous run 2026-07-07 (post re-lock)

| Milestone | Status | Evidence |
|---|---|---|
| M0.1 bands | ✅ RE-LOCKED | `fingerprints/ga-gate-locked-v2.json` (T1 pooled P10–P90; T2 2500w P5–P95) |
| M1 pack + G-P | ✅ (exemplar pool partial) | serde `Pack` schema (`src/lib.rs`); `fcdp gp-validate` passes fixture, catches 3 seeded pack defects; 1 exemplar selected (approved:false), full 5×3 pool at first real pack |
| M2 mechanical gates | ✅ | Rust: substitute (unit-tested), two-tier `ga-gate` (positive control OntViol passes; off-voice control fails 4 T1 + 4 labels). Python: G-B/G-C/G-D/G-F catch 7/7 seeded defects incl. pre-substitution literal-quote check |
| M3 orchestration | ✅ MVP | `slice_run.py`: pack → D2 (markers only, zero literal quotes live) → substitute → gates, provenance at every step |
| M4 judge gates | ✅ | Live G-E on `claude-fable-5`: randomized battery (seed recorded), 5/5 clean verdict extraction, caught seeded semantic defects greps cannot see (UNCERTAIN asserted flatly; memory-locus claim; quote misused vs declared intent) |
| M5 R-loop + provenance + declaration | ✅ | 3 R-cycles executed; **stop-rule fired at ≤3 and surfaced real conflicts** (designed behavior); 13-record hash chain VERIFIED; declaration generated from chain |
| D2-slice checkpoint (decision D) | ✅ COMPLETE | Full P→R lineage on fixture pack; ended stop-and-surface, not all-green — correct FCDP behavior on a deliberately minimal pack |
| M6 live section | ✅ **ALL GATES GREEN** 2026-07-08 (voice judgment pending) | Real pack: "The Two Unions" candidate insert (Calleja p.169 + Burke p.21, 4 quotes PDF-verified in-session; 4 graded evidence items; foundation = differential closing ¶). Full P→D1→D1.5→D2(×3 movements)→gauntlet→R-loop. 4 cycles: run1 aborted (5 instrument bugs diagnosed+fixed), cycles 1–3 partly consumed by judge truncation, final clean-instrument cycle 4 → all 7 gates green. Chain verified; declaration generated. `sandbox/m6-out/draft-r4.md` (679w). **Formal merge gate = user reads it on-voice.** D1 approval was run through under the autonomous directive — plan + skeleton retained for retroactive review; skeleton carried one SURFACE-TO-USER counterargument item (see m6-out/d15-skeleton.md). |
| M7 fork integration | ✅ COMMITTED LOCALLY (push withheld) | Local clone `~/projects/archon-fcdp-fork`, branch `feat/fcdp-draft` @ f8779fd1 (21 files, +2,097): `crates/archon-draft` (schema/G-P/substitute/measure/G-A over archon's own `archon-lanham`), `scripts/fcdp/` orchestration, `crates/archon-draft/data/` gate config. Builds + tests green in-workspace; fork binary reproduces sandbox verdicts (byte-identical substitution; identical G-A). PR body ready (`PR-BODY-fcdp-draft.md`). **GitHub fork creation + push + PR = publication, held for user.** |

### M6/M7 additional learnings (L6–L8)

- **L6 · Fable API thinking is adaptive-only** — `thinking.type=enabled/disabled` are rejected; control via `output_config.effort` + generous max_tokens. Runaway thinking consumed 16k output with zero text on repair prompts until effort-capped.
- **L7 · Judge truncation masquerades as fail-closed defects** — a judge whose output truncates mid-battery produces phantom "no clean verdict" defects that then poison repair prompts. Judges must budget like drafters and surface stop_reason; extraction must be block-based, not line-based.
- **L8 · Labels must inherit their metric's tier** — exact-match categorical labels derived from Tier-2 metrics (voice, parataxis, periodicRunning) had silently reinstated per-section hard gating that the two-tier design demoted; and G-G without the D1 claim list (which FCDP §5 specifies) flags foundation-internal dialectics as contradictions. Both fixed; the gate config now records `tier2_labels` and `label_tiering`.

### Slice learnings (encode at M6/M7)

- **L1 · Fable API thinking blocks:** `claude-fable-5` spends output budget on thinking; a 2000-token cap produced an EMPTY revision. All callers now budget ≥5–6k and hard-abort on empty text. (Integration note: archon-llm must surface stop_reason and thinking-token split.)
- **L2 · Dominant repair failure mode = movement drop:** revisers dropped trailing movement M2 in 2/3 cycles — even with an explicit retain-everything instruction. G-B (unused quote) + G-E (missing foundation claim) caught it **every time, independently**. M3 requirement: repair prompts restate the FULL movement plan, not a retain-clause.
- **L3 · Exemplar×bank n-gram interaction:** the leak check must exclude bank-rendered forms (text, text+cite, cite) or substituted quotes false-positive; pack-assembly rule: prefer quote-free exemplars whose content doesn't overlap assigned evidence.
- **L4 · Style oscillation without steering, damped with exemplar:** no-exemplar cycles swung opacity 0.87→0.56 and nominalization to 10.7; the R3 cycle carrying one exemplar landed 0.004 off the band ceiling. Single-sample, but consistent with Move 3's MODERATE-graded prediction.
- **L5 · Judge separation earns its keep:** G-E caught the reviser *inventing content during an architecture-only repair* (a fabricated "sleeper" example + an unwarranted "Aristotle asserts outright" claim). This failure class is invisible to every mechanical gate.

---

## 5. Decisions — RESOLVED (user, 2026-07-07)

1. **Band lock REOPENED** — M0.1 re-derivation authorized.
2. **Cross-model G-E audit: trigger-armed** — not wired now; escalation trigger = a draft passes G-E but reads foundation-unfaithful to the user (parallel to the deferred authorship-scorer trigger).
3. **Percentile width: decide at re-lock** — both P5–P95 and P10–P90 tables to be presented.
4. **Exemplar pool: agreed** — assistant pre-selects ~5 candidates per movement type; user approve/replace pass at M1.

---

## 6. Considered and REJECTED under the evidence bar

| Candidate | Why rejected |
|---|---|
| **Panel of same-model (Fable) judges** | J1/J2: gains require diversity; same-family panels multiply cost while inheriting shared bias. |
| **Strict JSON-schema judge outputs** | J4 contested; free-prose+extraction hedge costs nothing (adopted instead, Move 5). |
| **Trained authorship-verification scorer as a gate now** | S5: representation verifiers leak topic into style scores (MODERATE, cautionary); stays DEFERRED behind FCDP's original trigger (passes-bands-but-reads-off-voice). |
| **Per-section hard gating of clause/rhythm metrics** | S1: statistically under-powered at 400–1,500 w — replaced by two-tier design (Move 2). |
| **Numeric-targets-only style steering** | S4: WEAK as steering; retained for measurement, supplemented by exemplars (Move 3). |
| **C2PA content-credential embedding in the dissertation PDF** | Emergent for text, no institutional requirement, real tooling cost — W3C-PROV export already covers the auditable-trail need (P2). Revisit only if a venue demands it. |

## 7. Non-goals & standing risks (v1 §6 carried, plus)

- Non-goals unchanged: no analyzer re-port; research-pipeline Lanham wiring is a separate plan.
- **R8 standing risk:** the pipeline's composition is unvalidated by external literature — M6 is the proof event, and each section's user review is the permanent control.
- Perplexity-sourced attributions are archived but two glitches were caught — any citation that graduates into dissertation-facing text (e.g., the disclosure statement's methods description) gets PDF-verified per your citation-rigor standard before use.
- Device discipline unchanged: sandbox on WSL; fork pushes from WSL only.

## 8. Immediate next step

On your sign-off for **Decision 1** (reopen the lock): build the windowed-distribution + LOO harness in the sandbox (M0.1), present both percentile tables and tier assignments for re-lock. Everything stays in the sandbox; no fork, no commits.
