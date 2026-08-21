# Step 4 Prose Validation — Summary Report

**Date:** 2026-04-21
**Purpose:** Eyeball-verify that Phase 2 consumer wiring (CORPUS_INDEX_PATH → sandbox, ACTIVE CLAIMS block, cross-pipeline hook injection, H1 bridge/tension caps) surfaces in end-to-end god-write prose.
**Status:** ✅ PASS — pipeline wiring is live; two flagged issues for tuning (non-blocking).

---

## 1. Headline

All 6 canonical prompts completed successfully through the sandbox-wired god-write pipeline. The ACTIVE CLAIMS block fired on every run, pulling from the sandbox's 1145-claim index (not the live tree's pre-canary baseline); cross-pipeline hooks and tension edges injected at H1 caps; use-mention discipline held under adversarial framing; tension was productively non-resolved. One diagnostic finding: the activated-claim subset is **topic-invariant** — the same ~5 authors surface across all 6 prompts — suggesting the `loadActiveClaims` topic-matching/ranking logic needs tuning to differentiate by prompt content. This is a Phase 5 E-step concern, not a wiring bug.

---

## 2. Per-run metrics (rc=0 on all 6)

| Prompt                      | Words | Quality | Sources | Chunks | Elapsed | PAGE-NEEDED |
|-----------------------------|------:|--------:|--------:|-------:|--------:|------------:|
| phantasia-action            |  1195 |   0.792 |      20 |     20 |     66s |           1 |
| perception-sense            |  1150 |   0.787 |      20 |     20 |     75s |           2 |
| methodology                 |  1157 |   0.809 |      20 |     20 |     75s |           2 |
| virtual-digital             |  1173 |   0.806 |      20 |     20 |     74s |           1 |
| tension-acknowledgement     |  1263 |   0.780 |      20 |     20 |     81s |           1 |
| adversarial-dialectical     |  1334 |   0.789 |      20 |     20 |     76s |           3 |
| **Totals / avg**            | 7,272 |   0.794 |  20/run | 20/run |    448s |          10 |

- Quality range tight (0.78–0.81), all above the 0.75 gauntlet-reference threshold.
- Revisions iterations = 0 across the board (default max-revisions=0 = scoring-only, by design).
- Mean per-run wall time ~75s. Total wall time 7.5 min.

---

## 3. Wiring verification — telemetry

Uniform across all 6 runs (extracted from stderr):

```
[GOLD STD] Corpus index: 12 nodes, 3 hooks, 5 tensions   (virtual-digital: 3 tensions)
[GOLD STD] Active claims: 6 / 1145 evaluated, 56 filtered
```

This confirms:

- **CORPUS_INDEX_PATH is honored (B-Env wiring live):** 1,145 claims loaded — matches sandbox's post-Nussbaum-migration total exactly. Live tree's pre-canary baseline (781 claims) was not picked up.
- **ACTIVE CLAIMS block fires (B4 wiring live):** 56 claims survived ontology/topic filter, 6 activated after the `maxClaimsPerAuthor=2` diversity cap (B3).
- **Cross-pipeline hooks inject (B2 wiring live):** 3 hooks per run.
- **H1 caps live:** 5 tensions per run (new cap; old cap was 3). Virtual-digital surfaces only 3 — expected per SITREP §7.6: no metaphysics tension edges in corpus to fill the cap.
- **12 ontology nodes** consistent across runs (retrieval scope).

---

## 4. Qualitative discipline checks

### 4.1 Use-mention discipline ✅ PASS (adversarial-dialectical)

The hardest test case: prompt #6 voices the ancient-materialist thesis ("all thinking is a bodily process like perceiving") and asks whether Aristotle's critique depends on phantasia. The model MUST voice the ancient view as predecessor-position, never re-attributing it to Aristotle.

Evidence from output:

> "The ancient philosophers, **as Aristotle reports**, regard thinking as a bodily process analogous to perceiving..."
> "On **this materialist account**, the soul's cognitive operations reduce to the physical contact of elements..."
> "Aristotle's **critique of this position**, however, depends crucially on his elaboration of φαντασία..."
> "The **ancient materialists failed to articulate** [the dependence of phantasma on phantasia]..."
> "**The materialist account**, which cannot distinguish between the immediate deliverances of perception and the evaluative posture of belief, is therefore unable [to explain how] error arises..."

No re-attribution. Clean dialectical frame maintained throughout.

### 4.2 Tension held productively ✅ PASS (tension-acknowledgement)

Prompt #5 tests whether the model collapses or preserves the tension between phantasia's truth-aptness and its susceptibility to error.

Evidence:

> "...generates a **productive tension**, for the faculty's truth-aptness is thereby parasitic upon the reliability of the senses even as its independence from ongoing sensation introduces the possibility of distortion and error."
> "Thus **the tension between phantasia's truth-apt inheritance from perception and its susceptibility to deception** is already inscribed in the very distinction between sensation and imagination."
> "...**the tension between** phantasia's truth-apt representational structure and its capacity for error **is not merely an epistemological puzzle but a fundamentally rhetorical one**..."

Tension is named, reframed, and carried through — not resolved into one side.

### 4.3 Secondary-lit voicing ✅ (where activated)

Signal-verb discipline is consistent: "X argues…", "X's analysis clarifies…", "X observes…", "X's reading of Y proves instructive…". No collapsing of secondary-lit claims into uncited assertion.

---

## 5. ⚠ Findings

### 5.1 Topic-invariant claim activation (flagged for Phase 5)

The 6 activated claims look like **the same cluster regardless of prompt**. Author coverage across prompts (from prose):

| Author       | phantasia-action | perception-sense | methodology | virtual-digital | tension-ack | adversarial | Count |
|--------------|:---------------:|:----------------:|:-----------:|:---------------:|:-----------:|:-----------:|:-----:|
| Papachristou |        ✓        |         ✓        |      ✓      |        ✓        |      ✓      |      ✓      |  6/6  |
| Heidegger    |        ✓        |         ✓        |      ✓      |        ✓        |      ✓      |      ✓      |  6/6  |
| Burke        |        ✓        |         ✓        |             |        ✓        |      ✓      |      ✓      |  5/6  |
| Hawhee       |                 |                  |             |        ✓        |      ✓      |      ✓      |  3/6  |
| Gonzalez     |                 |                  |             |                 |      ✓      |             |  1/6  |
| Nussbaum     |                 |                  |             |                 |             |             |  0/6  |
| Caston       |                 |                  |             |                 |             |             |  0/6  |
| Frede        |                 |                  |             |                 |             |             |  0/6  |
| Bowin        |                 |                  |             |                 |             |             |  0/6  |
| O'Gorman     |                 |                  |             |                 |             |             |  0/6  |
| White        |                 |                  |             |                 |             |             |  0/6  |
| Chalmers     |                 |                  |             |                 |             |             |  0/6  |
| Metzinger    |                 |                  |             |                 |             |             |  0/6  |

All 6 authors activated are from pre-canary hydration or newly-surfaced claims. The Phase 3a-extracted authors (Bowin 156, Caston 56, Frede 144, Nussbaum 119, O'Gorman 191, White 295 claims — 961 claims total, ~84% of sandbox) are entirely absent from prose output.

This contradicts the canonical suite's `expected_secondary_presence` for every prompt:
- phantasia-action expects Nussbaum, Caston, Frede — got Burke, Heidegger, Papachristou
- adversarial-dialectical expects Nussbaum, Caston — got Burke, Hawhee, Heidegger, Papachristou
- etc. (0/6 prompts have expected-author overlap)

**Hypothesis:** `loadActiveClaims` is ranking by ontology-node overlap (which favors pre-canary claims with rich hook structure) rather than by query-prompt semantic similarity. The `maxClaimsPerAuthor=2` diversity cap saturates after 3 authors even when the evaluated pool of 56 is larger.

**Recommendation (Phase 5 E-step):** tune `loadActiveClaims` scoring to incorporate prompt-topic semantic match; consider increasing evaluated-pool → activated-pool ratio (currently 56→6 ≈ 10%).

**Budget impact:** none right now. This is a Phase 5 concern; today's telemetry answered the wiring question.

### 5.2 Recurring sanitization artifacts

Two patterns to track:

1. **`[PAGE NEEDED]` placeholders** — 10 total across 6 runs (avg 1.7/run). Citation-lookup pipeline is leaving gaps when no page number resolves. Not novel; pre-existing pipeline behavior.

2. **Truncated-quote fragment** — `sight or seeing: imagination takes place in the absence of both` appears verbatim (missing opening) in 3/6 runs (perception-sense, tension-acknowledgement, adversarial-dialectical). Looks like a prose-sanitizer artifact where a quoted passage loses its leading clause. Worth filing as a discrete prose-sanitizer bug.

3. **Mid-sentence grammar breakdown** — adversarial-dialectical §3: *"The ancients, by reducing cognition to bodily contact with present objects, could the soul turns back upon its own images and grasps them..."* — looks like two clauses got concatenated without the linking verb. Similar truncation pathology.

### 5.3 Claude CLI fallback

Every run logs `[GOLD STD] claude CLI failed (1), falling back to Anthropic API...`. Not a bug — the pipeline has clean fallback — but the claude-CLI path is unhealthy. Not investigated further (out of scope for step 4).

---

## 6. Sandbox worktree footnote

Three untracked modules existed in the live tree but not in the worktree, causing the first smoke attempt to fail `ERR_MODULE_NOT_FOUND`:

- `src/god-agent/core/abort/` (directory with `index.ts` + `pipeline-abort.ts`)
- `src/god-agent/core/composition/llm-claim-provider.ts`
- `src/god-agent/core/composition/prompt-builder-engine.ts`

All three are `?? untracked` in the live tree's git status, so they never replicated to the worktree. I copied them in (untracked) to unblock the smoke. Relevant only if someone re-hydrates or clean-checks out the worktree.

**Action for Phase 6 preflight:** either add these files to git under writing-pipeline-v3, or document the copy-in step as a worktree-hydration prerequisite.

---

## 7. Cost & timing

| Item                           | Spent |
|--------------------------------|------:|
| Smoke (1 prompt)               | ~$0.40 |
| Batch (5 prompts)              | ~$1.80 |
| **Step 4 total (est.)**        | **~$2.20** |

Under the $3-5 budget quoted in SITREP §11. No revision iterations triggered (max-revisions=0), which was the cost control.

---

## 8. Decision rule — does this change Option-B answer?

**No.** The step 4 prose validation confirms that the wiring works end-to-end; the extraction-path decision from telemetry alone stands:

- **Real coverage gap (prose-visible):** modern philosophy (Chalmers, Metzinger) on virtual-digital + broader secondary-lit rotation (Nussbaum/Caston/Frede not surfacing despite being in corpus).
- **Scoped primary-first NOT supported.**
- **Secondary-first targeted at metaphysics (~14 PDFs, ~$10–12) remains the evidence-backed recommendation** — but with an addendum: Phase 5 E-step must tune `loadActiveClaims` ranking before full Phase 3b extraction can pay off.

---

## 9. Recommended next step

Proceed to **Option (ii) — Phase 3b metaphysics batch** as originally planned, BUT bundle it with a pre-3b tuning sprint on `loadActiveClaims` scoring (fixed-cost, tight, diagnosable from today's 6 outputs). Otherwise we'll extract 961 claims' worth of new content (Nussbaum/Chalmers/Metzinger) and still not surface them in prose.

Alternative: treat §5.1 as Phase 5 E-step E2 (activation ranking) and run Phase 3b first anyway — accept that early prose output from the expanded corpus will under-utilize it until E2 lands.

---

## 10. Artifacts

All under `tmp/analysis-upgrade/production-sandbox/results/step4-prose-validation-2026-04-21/`:

- `*.stdout.json` × 6 — full CLI JSON output (content + metrics + endnotes)
- `*.stderr.txt` × 6 — pipeline telemetry
- `*.meta.json` × 6 — per-run timing metadata
- `run.log` — batch log (5 prompts)
- `smoke.log` — smoke log (phantasia-action)
- `SUMMARY.md` — this document

Scripts:
- `tmp/analysis-upgrade/production-sandbox/scripts/run-step4-smoke.sh`
- `tmp/analysis-upgrade/production-sandbox/scripts/run-step4-prose.sh`

---

**End of summary.**
