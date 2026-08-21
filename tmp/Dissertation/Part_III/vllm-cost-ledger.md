# vLLM Handoff Cost Ledger (code authoring only — execution is always token-free)

**Rule (user 2026-07-06):** scripts > ~150 lines or needing iterative debugging → draft on local vLLM (Qwen Coder :8002) via curl, Fable reviews+runs; smaller glue → Fable writes directly. **This ledger tallies the economics per task; if handoff costs more than Fable-direct, don't hand off.**

## Cost model (tokens; Fable pricing asymmetry: output ≈ 5× input)
- **Fable-direct authoring** ≈ lines × ~13 output-tok + reasoning overhead (~20–40% at effort-high).
- **vLLM handoff** ≈ spec-writing (~250–400 output-tok) + review-read (lines × ~13 INPUT-tok, ≈5× cheaper/tok) + per-rework-loop (~repeat of both). vLLM inference itself = $0 (local GPU) but requires vLLM running (shares 5090).
- **Break-even ≈ 150–250 lines at zero rework; one rework loop pushes break-even past ~400 lines.** Hence the 150-line threshold with a debugging-expected qualifier.

## Ledger
| Task | Lines | Route | Est. Fable-direct (out-tok) | Est. handoff (equiv-out-tok) | Delta | Decision & outcome |
|---|---|---|---|---|---|---|
| extract-anonymize.py | ~100 | Fable-direct | ~1.4k | ~0.9k spec+review | −0.5k? NO: +1 rework risk on CSV edge-cases → ~1.7k | Fable-direct ✓ (ran first try) |
| quant-summary.py | ~120 | Fable-direct | ~1.7k | ~1.0k + rework risk | wash | Fable-direct ✓ (first try) |
| boredom-audit.py | ~110 | Fable-direct | ~1.5k | ~1.0k + rework risk (WSL paths, ffprobe) | wash | Fable-direct ✓ (first try) |
| merge-adjudicate.py (+lean adaptation) | ~140+40 | Fable-direct | ~2.3k | ~1.4k + HIGH rework risk (merge-rule nuance) | negative for handoff | Fable-direct ✓ (adaptation needed domain judgment) |
| apply-and-analyze.py | ~120 | Fable-direct | ~1.7k | ~1.1k + rework risk | wash | Fable-direct ✓ (first try) |
| tabulate/pool/sweep helpers | ~25–35 ea | Fable-direct | ~0.4k ea | spec alone ≈ script | handoff strictly worse | Fable-direct ✓ |

**Running verdict:** every script so far sat below threshold and ran first-try (zero rework loops) — total authoring spend ≈ 9–10k output-tokens for the whole pipeline's code, i.e. under 2% of the run's token budget. The dominant costs were the Fable agent fan-out (~1.4M subagent tokens for 12+3 coders + 4 recon) and main-loop prose. **Conclusion so far: vLLM handoff has not yet been worth it for any task in this run; it becomes worth it only for a genuinely large one-shot codegen (200+ lines, well-specified, low rework risk).** Candidates ahead: none currently planned — Phase 3–7 are prose + existing scripts. Will log any new case here before routing.
