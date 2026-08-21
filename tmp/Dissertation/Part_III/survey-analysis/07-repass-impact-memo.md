# 07 — Fable Re-Pass Refresh: Findings Impact Memo (2026-07-23)

**What happened.** Per the Station 7 ruling, the three Haiku-coded batches (1/2/5 = 438
responses, 50.2% of the corpus) were re-coded by blind Fable 5 replacement passes
(cross-model mean Jaccard vs Haiku: .596 / .514 / .668 — far below the .878 Fable–Fable
benchmark) and the corpus/statistics were deterministically rebuilt (backup
`.backups/20260723T173251/`; rebuilt `03-coded-corpus.csv` + `t3-stats.md`). Validation:
438/438 rows replaced; adjudications 1–7 intact (5–6 and 7 independently replicated blind);
computation semantics verified against the pre-refresh corpus before recomputing.
**This memo lists every consequence. NO edits have been made to `05-findings.md` — each
item below awaits a user ruling.**

> **UPDATE — RULINGS RECEIVED + APPLIED 2026-07-23 (backup `.backups/20260723T180045/`):**
> 05-findings harmonized (F1 rates + foreclosure trio; F2 table incl. dark → ATTESTED;
> F3 zero→one F-code; F4 counts; F5 13/12-unique + §D re-sort, residue confirmed unchanged;
> F7 2.8-vs-1.5 + E-SHA 91). 04 exemplar fixes 1–3 applied (carry-over exemplar →
> W26-R018/Q5). W26-R007/Q5 masked in open_text.csv + batch-5.txt (7th masked response;
> 00-data-audit + 02 limitation 7 updated). NOT applied (not ordered): the optional F7
> magnitude hedge beyond the number swap; the optional F6 replication sentence.
>
> **Station 11 residual sweep (2026-07-23):** further stale mirrors found and harmonized
> (backup `.backups/20260723T185233/`): 05 F6 per-term frictions (crash 21→4→4, hw 8→4→1);
> `reanalysis/deployment-brief.md` (in-world friction counts, D2/D3 block incl. one-co-code
> correction, B1 48, F1-PRESENCE 2.8-vs-1.5, crash arc 21→4→4); `reanalysis/
> cross-case-synthesis.md` §(iii) (D3 one co-code; 57 requests). Outline M3.4's ≈69% →
> 70.7% remains a flagged at-drafting fix.

## Headline deltas (old → new)
| Code | Old | New | Δ | Why |
|---|---|---|---|---|
| E-SHA | 67 | 91 | +24 | Haiku under-applied on Q10 social proposals |
| E-SPA | 12 | 36 | +24 | same pattern, spatial talk |
| X-OFFTOPIC | 156 | 179 | +23 | course-praise boundary corrected |
| G3-CONTENT | 39 | 58 | +19 | G5→G3 boundary |
| X-EMPTY | 86 | 69 | −17 | Haiku under-read short answers |
| E-LUD | 25 | 41 | +16 | quiz-drive talk recovered |
| A1.other | 17 | 32 | +15 | determinate frictions named more precisely |
| E-NAR | 38 | 51 | +13 | mostly ex-F3 rows |
| **F3-CARRY** | **18** | **7** | **−11** | Haiku read "useful" praise as carry-over; Fable requires after-effects talk. New split 3/2/2 (was 16/2/0) |
| D1-A2 | 23 | 34 | +11 | footage-quality talk resorted from D0/G2 |
| A1.hw | 22 | 13 | −9 | resorted to install/other |
| G5-GUIDE | 61 | 52 | −9 | → G3 |
| D2-A3 | 159 | 166 | +7 | net of off-topic removals + recoveries |
| **F1-PRESENCE** | **25** | **19** | **−6** | Haiku over-applied on W25 (14→8 W25) |
| A1.dark | 4 | 10 | +6 | legibility complaints recovered |
| **A4-DIV** | **18** | **13** | **−5** | 7 W25 flags dropped, 2 W26 added |
| A5-WITHDRAWN | 4 | 9 | +5 | abandonment talk recovered |
| D4-LOOP | 13 | 8 | −5 | strict return-use reading |

## F1–F8: verdict per finding (rulings requested where marked ⚖)

**F1 (threshold foreclosure) — STANDS; numbers update ⚖.** The strata asymmetry survives
and sharpens on the threshold side: install APP 0.9 vs VID 5.4 (was 0.6/4.7), X-NONUSE
0.0 vs 5.1, hw 0.9 vs 2.2 (hw total fell 22→13 by resorting into install/other). In-world
frictions still APP-side but with narrower margins: nav 2.8 vs 2.0 (was 3.9/1.7), lag 3.0
vs 2.7 (was 3.5/2.7), crash 4.1 vs 2.5. ⚖ The clause "the biggest attested foreclosures
(crash 24, install 22, hw 22)" must become "(crash 29, install 26; A1.other 32 — with
hardware access at 13)" or equivalent; the lag margin is now thin enough that F1's
in-world list may drop lag or hedge it.

**F2 (friction scorecard) — STANDS; one verdict upgrade ⚖.** lag CONFIRMED (25), nav
CONFIRMED (21; nav∧G5 co-occurrence rose 7→11, strengthening the guidance link), occl 0
(conditions-removed), prox 2 weakly. ⚖ **dark rooms: 4 → 10 complaints** — "weakly
attested" is no longer accurate; propose ATTESTED (a Wendt prediction upgrade — the
scorecard's falsifiable test comes out better for the lens). Unpredicted trio re-ranks:
crash 29, install 26, hw 13 (+ other 32).

**F3 (A₃→A₄ stall headline) — STANDS, slightly weakened at the edge ⚖.** D2-A3 166
mentions (was 159), G4-INTERACT 57 requests at APP 8.6 vs VID 4.2 (stronger than before).
But: D2's with-F co-occurrence is 16 (was 21), and D3's "zero F-codes" is now **one** —
W25-R044/Q10 ("The virtual space feels like you are in it… makes you more involved and
interactive with the space"), a genuine positive involvement report. ⚖ "co-occur with
**zero** F-codes" → "with one F-code exception" or re-inspect W25-R044/Q10 and rule.

**F4 (flight anatomies) — STANDS; co-occurrence updates only ⚖.** The two-anatomy split
(61 excluded / 47 hassle-flight) is survey-item-derived and untouched. B1 48 (was 51).
Cited co-occurrences shift upward on the threshold side: install∧B1 8→11, crash∧B1 3→5,
lag∧B1 4 unchanged — friction-as-exit-occasion slightly strengthens.

**F5 (divergence register) — STRUCTURE STANDS; register recomposed, re-sort needed ⚖.**
A4-DIV 18 → 13 rows (12 unique texts — the S25-R021/W26-R011 duplicate pair now BOTH
flagged; count once per 02 limitation 4). All four examples F5 quotes survive (S25-R022/Q9,
W25-R014/Q9, W26-R016/Q6, S25-R009/Q10), as does the W26-R037 within-respondent pair
(batch 6, untouched). REMOVED (no coder-level A4 in canonical passes): W25-R007/Q10,
W25-R014/Q6, W25-R017/Q9, W25-R037/Q9, W25-R038/Q10, W25-R056/Q9, W25-R059/Q6. ADDED:
W26-R014/Q6 (surface-positive "really cool… started to appreciate it more" ∧ "does look
odd on a laptop" deflation) + the dup row. ⚖ F5's "18 candidates" → "13 (12 unique)";
the §D-grid form-1-vs-form-2 sort should re-run over the new register (the small genuine
form-2 residue F5 names is intact).

**F6 (value-skepticism arc) — STRENGTHENED, no change required.** F6 already cites sweep
numbers, not code counts. The re-pass adds independent support: blind coders invented
skepticism codes in BOTH W25 batches (H-NEW-vr-redundant ×6, H-NEW-videos-suffice ×5),
so the theme is now coder-attested in W25 as well as W26 — exactly what the sweep claimed
against the old 0/0/9 artifact. Optional ⚖: add one sentence noting the independent
replication.

**F7 (presence + WE) — STANDS; number updates ⚖.** Bullet 1: F1-PRESENCE now **2.8 vs 1.5
per-100** (was 4.3 vs 1.2) — the APP>VID direction survives but the ratio narrows from
~3.6× to ~1.9×; the screen-route presence claim stands on rate + verbatims, but the
sentence needs its numbers replaced and possibly a hedge on magnitude. Bullet 2: E-SHA
**91** mentions (was 67), still roughly term-stable per-100 (W25 11.1 / S25 10.0 / W26
9.9). The 2026-07-13 correction block and the recount addendum are UNAFFECTED (the recount
was keyword-swept over the full corpus, independent of family codes; its floors are
unchanged). Note: the F7 recount addendum's E-SHA-filter-insufficiency clause cited "67"
E-SHA rows — now 91; the recount's candidate set remains the documented 115.

**F8 (limits) — STANDS.** Zero-attested trio unchanged (A1.occl, B3-PASSTIME, C2-FLOW);
C1-DRAG still 1; the temporal-mute limitation is intact and the C2 strike is now
blind-replicated.

## Exemplar bank (04) — stale items found ⚖
1. **W25-R064/Q5 [carry-over]** exemplar: the row no longer carries F3-CARRY (one of batch
   2's 14 collapsed F3s; now D2-A3;E-NAR). Replace with a surviving F3 exemplar (7 remain,
   e.g. W26-R006/Q5, W26-R018/Q5) or drop.
2. **W25-R038/Q10** bracket note "[row coded A4-DIV;G6-USECASE, not E-SHA]" is stale: the
   row is now coded A1.other;E-SHA;G6-USECASE (E-SHA present, A4 dropped).
3. **S25-R072/Q10** bracket note "[row coded G6-USECASE, not E-SHA]" is stale: now
   G6-USECASE;E-SHA.
   (2 and 3 are pleasant staleness: the non-activator exemplars are now properly E-SHA-
   family-coded, closing the grain gap the alignment audit diagnosed.)

## Anonymization follow-up ⚖
W26-R007/Q5 carries a MASK flag from the blind coder: the response ends "How can I apply
to the translator/researcher position when traveling to Paraguay? I'm bilingual;)" — a
direct self-identifying question to the instructor (no personal name). Proposal per the
Station 1 masking policy (6 responses already masked): mask that final sentence in
`data/open_text.csv` (derived files only; raw exports untouched) as the 7th masked
response. AWAITING RULING.

## Methods-record consequences (already applied in 02/t3, no ruling needed)
- 02 executed design: all canonical passes now Fable 5; Haiku passes superseded, retained
  as cross-model artifacts; limitation 3 (model heterogeneity) closed with measured
  Jaccards.
- Disclosure footnote (Station 6, option d) simplifies: every canonical pass is Fable 5;
  the superseded Haiku first passes and their measured divergence are disclosed as the
  reason for replacement — a strictly stronger transparency story.
- Jaccard .878 (batch-6, Fable–Fable) unchanged and still the corpus reliability estimate;
  it now licenses coders exchangeable with ALL canonical passes.
