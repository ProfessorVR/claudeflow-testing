# A/B Results — RODA methodology "justification layer" (~3000w)

**Date:** 2026-06-26 · **Contestants** (all blind, same 5-movement scope, same embedded grounding pack):
- **god-write** — `godwrite-run4-content.md` (patched model path; trained profile `dalton-philosophical-mo2fmhy2`; no corpus, no multi-step).
- **console-max** — `console-max-content.md` (Claude, single max-effort pass, targeting Part I voice).
- **ultracode** — `ultracode-content.md` (5 parallel movement-drafters + 1 synthesizer, targeting Part I voice).

## Scorecard (0–10 per axis; weighted)

| Axis (weight) | god-write | console-max | ultracode |
|---|---|---|---|
| **Grounding (30%)** | 9.0 — verbatim pack, correct loci, honest provenance, fn→appendices, no junk/noise | 9.5 — most thorough; all loci + magic-circle move + "claims not grounded: none" | 8.0 — verbatim + Heidegger bridge + magic-circle, BUT **"Brian Calleja"** (wrong first name) |
| **Conceptual ownership (25%)** | 8.5 — correct A-chain, two-pole fusion, guard, convergence | 9.0 — same + defines "engage," "why now/which way" | 8.5 — same + nice "shared dimension anticipates the other pole" |
| **Terminology (20%)** | 9.0 — locks honored; residue reserved (fn) | 9.5 — all locks; residue explicitly distinguished | 9.0 — world-pole/with-others ×9; one-in-substrate ×5; no coinage |
| **Voice-texture (15%)** | 9.0 — **0.96** conformance; opacity exact; but voice 0.229, dyn-range 0.589 | 8.5 — 0.94; voice 0.242, lat/ger 0.098 (over-Germanic), opacity 0.673 | 8.0 — 0.94; **best voice 0.307 + dyn-range 0.737**, BUT avg sentence 23w (choppy vs Part I's 31w) |
| **Concision (10%)** | 9.0 — 3,052w, on target, complete | 9.5 — 2,837w, on target, complete | 5.0 — **4,343w (~45% over)**; synthesizer didn't trim |
| **Weighted total** | **8.88** | **9.23** | **8.03** |

## Ranking: console-max (9.23) > god-write-patched (8.88) > ultracode (8.03)

## What the A/B actually shows

1. **The grounding pack was the great equalizer.** Once every contestant got the verbatim quotes + loci + A-node semantics, grounding quality converged to "good." The earlier failures (god-write run 1's junk sources; DRAFT-v1's vagueness) were about *ungrounded inputs*, not the tool. Grounding is an input problem, not a model problem.
2. **Voice-texture is a wash (~0.94–0.96).** Lanham can't separate the three meaningfully; god-write's *trained profile* matched Part I as well as deliberate targeting did. None nailed Part I's high voice (0.39) or dynamic range (0.90) — all three came out more effaced and (except ultracode) less rhythmically varied than Part I.
3. **Ultracode came last — confirming the original suspicion.** The multi-agent fan-out has two structural costs a single author avoids: it **bloated to 4,343 words** (each drafter wrote to its own budget; the synthesizer didn't cut), and it let a **factual error through** ("Brian Calleja" for Gordon) that single-pass drafting caught. Its upside is real — the best voice-score and dynamic range — but the choppier sentences and the bloat/error make it the weakest for a coherent ~3000w section. Fan-out helped *grounding research* (the earlier pass); it hurt *coherent drafting*.
4. **God-write, once fixed, is genuinely competitive (2nd, by 0.35).** The whole gap between run 1 (junk, 0.678) and run 4 (clean, complete, 0.82, voice 0.96) was configuration: embedded pack instead of corpus retrieval, plus the model-path patch. Properly set up, it's a strong tool.
5. **console-max wins narrowly** on the substance axes (most thorough grounding, cleanest terminology, on-length), losing only a little on raw voice-texture to god-write.

## Recommendation

Use **console-max as the base for DRAFT-v2**, and graft in the few places the others did better: god-write's slightly cleaner voice-texture cues, and ultracode's higher dynamic range / the "shared dimension anticipates the with-others pole" observation. Then the remaining work is the same for any base: lift the voice toward Part I's higher dynamic range (more short-sentence punctuation of the long architectural sentences) and verify all loci against the PDFs in the citation pass. Fix the ultracode name error if any of its phrasing is reused.
