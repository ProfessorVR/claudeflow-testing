# HANDOFF — RDR2 Secondary-Literature Integration (2026-07-07)

**State: Phase 4 of 4 — the integrated draft is COMPILED and gauntlet-passed, awaiting the user's review/revision. Nothing spliced, nothing committed, no source file modified.**

The next session's job: support the user's revision/redrafting of `RDR2-INTEGRATED-DRAFT-v1.md`, then execute the splice into the combined document (checklist in §8).

---

## 1. What this work was

Two goals, executed 2026-07-06 in one session:
1. **A literature review** ("The Critical Field") introducing the RDR2 sections of Part II from the 12-article secondary cluster (`corpus/index/Red Dead Redemption 2 Secondary (2019-2023)/`).
2. **Insertion of verified secondary-literature quotations** into the three RDR2 texts — tutorial §5 (combined-v2), the Sonny-event analysis, and its conclusion — to add warrants, foils, and precedents.

Everything was compiled into **one review document** at the user's request, drafted under **FCDP v2** (`plans/fable-console-drafting-protocol-v2.md`): pack → «Qnn» quote-markers → mechanical substitution → seven-gate gauntlet (incl. two independent judge calls) → targeted repair cycles.

## 2. Deliverables and where they live

| Artifact | Path | Role |
|---|---|---|
| **THE REVIEW DOCUMENT** | `tmp/Dissertation/Part_II/Part-II-RDR2-Tutorial/RDR2-INTEGRATED-DRAFT-v1.md` | ~19.2k words; [A] lit review · [B] tutorial §5 · [C] Sonny analysis (§6) · [D] conclusion. Insertions begin at `% [INS-nn: …]` lines. Gauntlet report appended as end-comment. **This is what the user revises.** |
| Marker/provenance version | `…/RDR2-INTEGRATED-DRAFT-v1-MARKERS.md` | identical but with `«Qnn»` markers unsubstituted; regenerate the final via `python3 scripts/substitute-quote-ids.py <markers> plans/packs/rdr2-integration-quotes.json <out>` |
| Lit review standalone | `…/RDR2-Lit-Review-DRAFT-v1.md` | same text as block [A]; carries all repairs |
| **Quote bank** | `…/rdr2-secondary-quote-bank.md` | ~35 verified quotes, printed pages + evidence, round-2 user dispositions, §0b wording traps, phase log |
| FCDP pack + quote JSON | `plans/packs/rdr2-integration-pack-v1.md` · `rdr2-integration-quotes.json` | P-fields, D1 insertion plan (INS-01…20), Q1–Q40 with citations |
| Execution plan | `plans/rdr2-secondary-lit-review-and-insertion-plan-2026-07-06.md` | phases, decisions 1–4 all resolved |
| Foundation sources (UNTOUCHED) | `Part-II-COMBINED-v2-2026-07-01.tex` L405–545 (tutorial §5) · `…/Ontological-Violence-Analysis-EXPANDED-DRAFT-v1.md` · `…/Ontological-Violence-Conclusion-DRAFT-v1.md` | still carry the pre-fix variants noted in §6 |

Ephemeral (session scratchpad, likely gone): the `pdftotext` extractions. Re-create if needed: `pdftotext -layout "<pdf>" out.txt` on the PDFs in `corpus/new_media/` (Ruffino's file is misspelled **"Rffino, Paolo - There is no cure…"**; rdr-12 immersion/UX is image-only, unused).

## 3. How the quotes were verified (trust chain)

Index-entry-first (per user instruction): each unit's `.md`/`.json` loci drove the hunt; PDFs used only for verbatim wording + printed pages. Eight parallel harvest agents; every quote character-matched against `pdftotext -layout` output; page offsets established empirically (in bank §0): Moser printed=PDF−6 · McEvoy=PDF−5 · Tuominen=PDF−4 · Bagnoli=PDF · W&H=PDF · Ruffino=PDF+344 · **Vanderhoef & Payne unpaginated → cite by section name** · **Wright → cite by paragraph number** · Crowley 1229–1243 · Donald & Reid (MEJ 66) 15–23.

## 4. User decisions locked during the process (do not relitigate)

1. Lit review placed free-standing at the head of the RDR2 half (before "The Opening Cutscene"); tutorial + Sonny + conclusion all in scope ("total integration").
2. Citation convention: inline author-page, same as drafts (V&P/Wright exceptions above).
3. Moser's "outskirts of the city of Saint Denis" geography: cite her reading without repeating her location gloss.
4. Round-2 bank dispositions (annotated in the bank): 1.7 + 3.17 removed; 1.6→Town/Honor as *ludic-channel* steering with the "low honor possible but priced/harder" asymmetry; 1.9→tutorial (save-load ethical experimentation, replay across the two endings); 1.14, 1.15, 1.17→tutorial; **1.10 reframed** — never say the Sonny consequence is "withheld"; the contrast is *where the harm lands* (TB → Arthur, through him to the player; Sonny → almost nothing on Arthur, almost everything in the player); 1.2 porosity framing (RODA *hexis* does not differentiate virtual/non-virtual experience — both real experiences of different artifact-kinds).

## 5. The 20 insertions (map for the revision pass)

Tutorial §5: INS-01 Moser performer (Opening Cutscene) · INS-02 V&P+Tuominen slow-time/illusory-freedom, answered (Leash) · INS-03 Moser techniques-and-tools (Colter) · INS-04 V&P canned animations (Colter looting) · INS-05 W&H gameplace/camp-as-home (Camp) · INS-06 Tuominen interpellation counter-voice, answered (Camp) · INS-07 the honor-machine scholarly ¶ — McEvoy/Tuominen/Bagnoli three readings + blind spots + priced asymmetry (Town) · INS-08 McEvoy Dead Eye + V&P legendary-hunt tempo (Legendary Hunt) · INS-09 save-load experiment economy — Moser magic-if + McEvoy endings (Disposition Built) · INS-10a Downes/TB push-narrative bridge + C1 correction · INS-10b pending-note correction.
Sonny analysis: INS-11 Moser attachment + W&H world-autonomy + porosity (arrival) · INS-12 McEvoy free-space/rigid-structure + Calleja ludic channel (hail) · INS-13 Moser choices-entangled (hesitation) · INS-14 Ruffino agency-as-affect / TB landing-site mirror / mask-strip footnote (seizure) · INS-15 Tuominen+Bagnoli exception spectrum: reward→exemption→silence (honor-silence) · INS-15b Ruffino persistence-at-a-wound · INS-16 Moser transfer thesis + her evidence gap = Tate/Kyle (reception) · INS-17 **keystone** — Moser pet-shack reload-asymmetry ("the erasure option proves the address") (phantasia-conscription) · INS-18 Bagnoli processes + McEvoy stifles-claim-flagged + D1 debate (procedural commentary).
Conclusion: INS-19 Moser not-not-Arthur (beside Burke) · INS-20 D3 positioning, cites only — "agency not foreclosed, not fenced, but used" (relocated to its ¶'s end).

## 6. Gauntlet outcome (full report = end-comment of the document)

- **Foundation fidelity (G-E judge): foundation 100% intact** — every source sentence verbatim; the judge's marker-contract and warrant defects were all fixed.
- **Consistency (G-G judge): 11 defects** — fixed: honor-in-missions contradiction (Bagnoli 42 now reconciled with the meter firing at choice-points, unscored obligatory violence per Bagnoli 43); Ruffino-353 and Salen&Zimmerman de-duplications; "moral fence" gloss removed (her words: "a fence or barrier", 12–13); Tuominen rescoped off the opening ride; Bagnoli 40 = "the game's processes"; "eleven studies"; cite fixes (McEvoy 32–33 span; Crowley 1229, 1234).
- **Flagged foundation fixes applied in the compiled doc only** (sources still carry the old variants — apply at splice): **FIX-D4** ungendered-player repair, tutorial Opening Cutscene (five player-bound "he"s); **FIX-D6a** "Can't make up **its** mind" (frame record; analysis draft had "his"); **FIX-D6b** "**Oh, you struggled... and you lost**" (frame record CONFIRMED verbatim; conclusion had "You struggled. You struggled and lost"). Evidence: `corpus/index/Red Dead Redemption 2 (Salvo Playthrough)/rdr2-rape-scene-RODA.md`.
- **Surfaced, NOT fixed** (listed in the document header — the user's revision should decide): the Sonny analysis/conclusion **back-references and drafting-process leaks** ("the comparison I proposed earlier," "here the footage corrects my earlier description," "deserves more weight than I first gave it," the spoken-address "please feel free to leave" sentence, etc.); **\textit{phantasia}-load vs plain phantasia-load** italicization inconsistency across the tutorial foundation; conclusion's "ever-present machine" possibly softened after three sections establish designed blind spots.
- **Lanham (G-A):** lit review repaired over 3 cycles to ~31w avg, in band on avg/short/preMainVerb/opacity/Germanic; **accepted residuals**: long-share ~0.55 (top 0.53), dynamicRange ~0.49 (floor 0.62), nominalization ~3.2 (floor 3.5). Full doc: avg 31.4, in band. Runner: `python3 scripts/strip-latex-for-lanham.py <f> <txt> && npx tsx tmp/analyze-style-lanham.ts <txt>`.
- **Quote fidelity (G-B):** substitution exit 0, 40/40 used; all 24 lit-review spans source-verified (4 were pdftotext artifacts, individually confirmed).

## 7. Wording traps (must survive any redraft — bank §0b has the full list)

"a crash of worlds" = Moser's title only · her verb is "load a previous save" (never "reload") · McEvoy "stifle**s**" · Tuominen "mainstream but **still** radically progressive" · Ruffino's "a consequence with no actions" is a **section heading** (346), running prose = "consequences could manifest with no preceding actions" (351) · "white, able-bodied male character**s**" (plural) · Bagnoli's KKK exception *grants* honor (stronger than "costs none"); his triad is "feminism, race, and animal condition" (7) · W&H never name Horseshoe Overlook as "home"; their Calleja tie is one "cf." · attribution chains: Owen-in-Ruffino; Mitchell-under-Tuominen; Sicart-in-Bogost-in-Bagnoli; Salen&Zimmerman-in-McEvoy · Tuominen makes **no tutorial claims**.

## 8. Splice checklist (after the user's revision + sign-off — NOT before)

1. Apply the user's revisions in `RDR2-INTEGRATED-DRAFT-v1.md` (or its successor).
2. Backup `Part-II-COMBINED-v2-2026-07-01.tex` to `.backups/` (timestamped).
3. Splice [A] at §5's head; replace §5 body with revised [B]; add [C]+[D] as the new §6 (renumber vs the existing "§2: The Disruption" placeholder expectations; the compiled doc's headers were harmonized: `\section*{6. …(§2: The Disruption): The Sonny Event}` + `\subsection*{Conclusion: …}`).
4. Apply FIX-D4/D6a/D6b to the foundation text going in (and to the standalone Sonny drafts if they remain live).
5. Strip all `% [INS-…]`/`% [FIX-…]`/`% [bank …]` comment lines + the gauntlet report.
6. Normalize *phantasia*-compound italicization; resolve the surfaced back-reference/process-leak list; the analysis's `***Add video clip***` marker and `\begin{adjustwidth}` (needs `changepage` package) still pending.
7. XeLaTeX compile check; verification-gated — user sign-off before commit (`/pushrepo` only on request).

## 9. Open loose ends beyond the splice

- Four tutorial beats still await frame-verification (per the corrected pending-note): choke/spare bell-toll timing, hostage-fork honor delta, bear-maul *bia*, drunk-brawl honor attribution.
- The Bill Williamson corroboration passage was deliberately not retained in the Sonny analysis (needs own sourcing pass — see the v1 draft's footer).
- G-A band calibration feedback for FCDP: the lit-review register (survey + citation apparatus) strains the MA-applications bands — worth noting in the protocol's open questions.
- rdr-12 (immersion/UX FDP) unused (image-only); could be OCR'd and added to the lit review's ¶1 later if wanted (would make "twelve studies" true again).
