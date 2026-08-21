# 02 — Codebook Final Record (T2 close-out)

**Codebook:** v1 as specified in `../methodology-application/codebook-v1.md` — no structural revisions required after coding. This record documents the executed design, reliability, adjudication, and emergent codes.

## Executed design (lean; user-directed mid-run for token economy)
- All **873** responses coded at least once against the frozen v1 codebook.
- **Reliability subsample:** batch 6 (143 responses, mostly W26) double-coded by two independent blind passes (both Fable 5). **Mean Jaccard agreement = 0.878** over full code-sets — high for open multi-coding; licenses the single-pass remainder.
- Single-pass batches: 1, 2, 5 coded by Haiku 4.5; batch 3 by Fable pass-1; batch 4 by Fable pass-2. Model heterogeneity is a documented limitation; spot-checks showed consistent top-distribution across models (D2-A3, G6-USECASE, X-OFFTOPIC dominant everywhere).
- Merge rules (as specified in `scripts/merge-adjudicate.py`): union for mention-level families (D/E/G/F/X/H); intersection + keyword-warranted auto-accept for A/B/C on the double-coded batch; A4-DIV kept at either-pass sensitivity; A1.other dropped when a specific sub-tag present.

## Manual adjudication (6 items: 1–4 decided 2026-07-06; 5–6 decided 2026-07-23, Station 2 coding review)
1. W26-R023/Q9 → **+A5-WITHDRAWN** (used, frustrated by slowness, abandoned to YouTube).
2. W26-R036/Q6 → **−A1.other** (workload/online-format complaint, not a platform friction; retained X-OFFTOPIC + E-SHA; flagged as async-course context datum).
3. W26-R049/Q6 → **+B2-MINIMAL** ("I don't run it very often").
4. W26-R055/Q9 → **−A1.other** (redundant with A1.lag + D0).
5. W25-R049/Q5 → **−C2-FLOW** (objective-brevity praise, "short and condensed" — no time-vanishing talk; D2-A3 retained).
6. W25-R076/Q5 → **−C2-FLOW** (self-pacing praise, "at my own pace" — no time-vanishing talk; D2-A3 retained). C2-FLOW now stands at 0 — a deliberately retained UNATTESTED cell; the engagement-side temporal register is unattested in this corpus.

## Emergent codes (H-NEW-*) — disposition
- **H-NEW-skeptic** (9 coded, all batch-6/W26): "VR unnecessary / no advantage over YouTube / gimmicky." **Coder-vocabulary artifact caveat:** the code was invented by the batch-6 coders, so its 0/0/9 term distribution is NOT a clean trend. Remedy applied: a term-neutral keyword sweep (`scratchpad skeptic-sweep`) finds value-skepticism responses in ALL terms — **W25 1.3 / S25 0.7 / W26 4.2 per 100 responses** (16 total; 2 keyword false-positives inspected and discounted). Disposition: treat **value-skepticism** as a cross-term theme, elevated (~3×) in W26; report sweep numbers, not the code count. (Mild circularity caveat: sweep vocabulary partly seeded from W26 phrasings; generic terms dominate, so the direction is robust.)
- **H-NEW-lecture** (13): praise of course video-lectures as most-useful — course-media datum adjacent to X-OFFTOPIC; retained as context for "what outcompetes the VLE."
- **H-NEW-optional** (2): make the VLE optional — folded into the value-skepticism theme.
- **H-NEW-playback** (1): playback-speed control — folded into G5-GUIDE-adjacent design requests.

## Negative-case & saturation statement
Housekeeping coverage (X-EMPTY 86, X-OFFTOPIC 156, X-NONUSE 17) accounts for all non-codable content; no response resisted the scheme outright (0 uncodable reported by any coder). Code discovery saturated early: no new H-codes after batch 6's four; batches 1/2/5 (coded last) produced zero new emergent codes.

## Known limitations of the coded corpus
1. Single self-report channel — form-mappings remain PROJECTED signatures (per application-memo §4.2).
2. Response-level (not segment-level) code sets, with evidence spans for A-family/F1/C1 — a documented operationalization of codebook v1's segment ideal.
3. Model heterogeneity across single-pass batches (above).
4. Cross-term duplicate detected (W26-R011/Q5 verbatim-identical to S25-R021/Q5) — flagged; treat as possible retake/copy artifact in any per-respondent claims. [Extended 2026-07-23: the same respondent-pair is also verbatim-identical at Q10, and both Q10 rows are E-SHA-coded — E-SHA/Q10 counts carry one duplicated response.]
5. Retrospective course survey elicits little temporal phenomenology (C1-DRAG = 1; C2-FLOW = 0 after the 2026-07-23 adjudication) — felt time is effectively mute in this instrument; the lab dataset carries the felt-time thread.
