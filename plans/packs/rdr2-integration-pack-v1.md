# FCDP Pack — RDR2 Secondary-Literature Integration (v1, 2026-07-06)

Adapted FCDP-v2 pack for an **insertion pass** (not fresh drafting): the foundation prose is carried byte-identical into the compiled base; new prose exists only at the numbered insertion points below.

## P1 TASK
Integrate the verified secondary-literature quotations (`tmp/Dissertation/Part_II/Part-II-RDR2-Tutorial/rdr2-secondary-quote-bank.md`, round-2 dispositions) into the three RDR2 texts, and compile lit review + tutorial + Sonny analysis + conclusion into ONE review document:
`tmp/Dissertation/Part_II/Part-II-RDR2-Tutorial/RDR2-INTEGRATED-DRAFT-v1.md`.
Register: MA-applications voice. LaTeX conventions (`` `` '' ``; \textit; \gk where the base uses it). Citations inline author-page; Vanderhoef & Payne by section name; Wright by paragraph number.

## P2 STYLE TARGET
MA-applications fingerprint (FCDP §8): avg sentence 33.7 (band 29–36); short/long 0.23/0.45; periodicRunning 0.44; preMainVerb 0.21; voice 0.41; dynamicRange 0.74; latinate ≤0.14; opacity 0.76. G-A runs on (a) the lit review block, (b) the full compiled document (foundation-dominated baseline).

## P3/P8 LOCKS (from FCDP §7)
LaTeX quotes only; no bold run-in heads; *hexis* ≠ habit ≠ *doxa*; "emotion" not *pathē* (Rhetorica); ungendered — the in-game subject is "the player"; Greek faculty-names italic; retired stem "phantasmat-"; poles = world-/co-disclosedness; no explicit back-references; no "supplies the … anchor"; coined-compound restraint; missing source → `******`; MA voice throughout (Part II applications).

## P9 USAGE
Model contributes phrasing/structure/analysis of pack-supplied evidence only; no claims beyond the banks; quotations enter by ID substitution only (`scripts/substitute-quote-ids.py`).

## P4a QUOTE INDEX
`plans/packs/rdr2-integration-quotes.json` — Q1–Q40, all verbatim-verified against PDFs 2026-07-06 (see quote bank for loci/evidence). Typographic normalizations (flagged): curly→LaTeX quotes throughout; Q32 spaced en dash → `--`; Q36 inner curly quotes → LaTeX single; Q25 inner-quote tail closed with `{}` kern.

## P5 EVIDENCE
All game-evidence assertions already live in the foundation texts (frame evidence AUTHOR-CONFIRMED 2026-07-01; honor-neutrality AUTHOR-CONFIRMED). Insertions introduce NO new game-evidence claims — only scholarly attributions, each warranted by the quote bank.

## P6 CONCEPTUAL SEMANTICS
As embedded in the foundation texts (A₀–A₄ chain, *bia*, two *paschein* modes, dual hexis, phantasia-load, honor machine as motive-attribution). User round-2 framings to carry: (a) porosity — dispositions travel real→virtual and virtual→real; RODA's hexis-account does not ontologically differentiate the two; (b) honor-fence = Calleja ludic channel; low-honor play possible but priced; (c) TB-vs-Sonny = where the harm lands (Arthur vs the player); (d) honor blind-spots as design intrusion enabling the high-honor Arthur; (e) save-load experimentation as ethically widening, motivating replay.

## P7 FOUNDATION (byte-identical bases)
1. `RDR2-Lit-Review-DRAFT-v1.md` (prose + footer ledger; header comments dropped).
2. `Part-II-COMBINED-v2-2026-07-01.tex` L405–545 (tutorial §5 entire).
3. `Ontological-Violence-Analysis-EXPANDED-DRAFT-v1.md` L18–50 (body).
4. `Ontological-Violence-Conclusion-DRAFT-v1.md` L11–31 (body).

## D1 INSERTION PLAN (approved via user round-2 annotations + "execute now")
| INS | Target anchor | Quotes | Function |
|---|---|---|---|
| 01 | Tutorial · Opening Cutscene, spectator ¶ | Q22 | Moser's audience→actor = patiency→agency |
| 02 | Tutorial · Leash, after recalcitrance ¶ | Q25, Q24, Q26 | secondary lit reads the same ride; structural pole named, then answered |
| 03 | Tutorial · Colter opening ¶ | Q21 | tutorial as actor-preparation |
| 04 | Tutorial · Colter looting ¶ | Q27 | canned-animation tempo |
| 05 | Tutorial · Camp, after woodpile ¶ | Q28, Q29 | gameplace: camp as home, world for being-in |
| 06 | Tutorial · Camp, after boredom ¶ | Q30 | interpellation counter-voice, answered |
| 07 | Tutorial · Town/Honor, new scholarly ¶ after opening ¶ | Q31, Q32, Q35, Q36, Q33, Q34 | D5 three readings + fence/priced asymmetry + blind-spot foil |
| 08 | Tutorial · Legendary Hunt, after Dead Eye prosthesis sentence | Q23, Q40 | Dead Eye = worked mastery; V&P slow-time reading of same hunt |
| 09 | Tutorial · Disposition Built, new ¶ before "The rails will come off." | Q37, Q38 | save-load ethical experimentation; endings economy; replay |
| 10 | Tutorial · Disposition Built, final ¶ + pending-note | Q39 (+Ruffino cites) | push-narrative persists (Downes, TB); CORRECT stale footage line |
| 11 | Sonny · arrival ¶ | Q1, Q2, Q3 | attachment-over-duration; lifeworld union; world-autonomy; porosity frame |
| 12 | Sonny · hail/lure ¶ end | Q4 (+McEvoy 12 paraphrase) | rigid structure inside free space; Calleja ludic channel |
| 13 | Sonny · hesitation ¶ | Q6 | choice entanglement warrant |
| 14 | Sonny · seizure ¶ | Q8, Q9, Q7, Q10(fn) | agency-as-affect; grant-revoke; TB landing-site contrast; engine-seam precedent |
| 15 | Sonny · honor-silence ¶ | Q13, Q14, Q15; Q17 | exception spectrum (reward/exemption/silence); wound-sourced persistence parallel |
| 16 | Sonny · reception ¶ end | Q16 (+Moser 40 paraphrase) | transfer thesis + her evidence gap discharged by Tate/Kyle |
| 17 | Sonny · phantasia-conscription ¶ | Q11, Q12 | keystone: Moser's asymmetry corroborates authored-in-the-player |
| 18 | Sonny · procedural-commentary ¶ | Q19, Q18 (+D1 cites paraphrased) | procedural values; stifles-claim flagged as unevidenced; complicit-or-critical acknowledged |
| 19 | Conclusion · incorporation ¶ | Q20 | not-not-Arthur beside Burke |
| 20 | Conclusion · bia ¶ | (cites only) | D3 positioning: not foreclosed, not fenced — used |

**Foundation dispositions:** all beats RETAIN except: (C1) §5 closing sentence "the disruption is the subject of the section the footage will let me write" — CORRECT (footage now exists; hand off to the following section); (C2) §5 italic pending-note — CORRECT (drop "pending capture of the Sonny-scene footage"; retain the four tutorial-internal frame-verification beats); (C3) Sonny \section{...} header + parenthetical note — CORRECT to clean compiled headers; (C4) analysis draft's inline header comments dropped in compilation (preserved in source files).
**Ledger:** all 40 bank entries ASSIGNED. Lit review quotes are already substituted in its base (drafted from the bank; G-B covers the compiled doc).
