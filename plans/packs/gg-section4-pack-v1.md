# FCDP PACK — Part II §4 (Gnomes & Goblins) — v1 (2026-07-02)

First full-dress FCDP v2 run. Task class: **register redraft + targeted enrichment** of an existing, content-approved section.

---

## HEAD

### P1 TASK
- **Section:** Part II §4 *Gnomes & Goblins* — the two-subsection arc (4.1 Tutorial: candle → forest → fruit · 4.2 Disruption: miniaturization → tavern → carry-over).
- **Foundation & insertion point:** `Part-II-COMBINED-v2-2026-07-01.tex` lines 319–412 (snapshot: `gg-section4-foundation-snapshot-2026-07-02.tex`). Output replaces that span **only after user sign-off**.
- **Output file:** `tmp/Dissertation/Part_II/Part-II-GG-Repurpose/GG-Section4-FCDP-DRAFT-v1.tex` (LaTeX body only).
- **Length:** 5,000–5,800 words (foundation ≈ 5,040; enrichments add, register recast is roughly length-neutral).
- **Register:** **MA-applications voice** (P2). This is the primary work of the run: the foundation's content is approved; its prose architecture is Part-I-figured and must be rebuilt (periodic–running 0.74 → ~0.44–0.55; pre-main-verb 0.07 → ~0.18–0.24; voice 0.31 → ~0.40; aphoristic fragment cadence dissolved into longer suspended builds; first-person analyst voice admitted as in the MA).
- **Conventions:** XeLaTeX; `` `` '' `` quotes; Greek via `\gk{}` after italic term; cites `(Author, \textit{ShortTitle}, page)`; `\subsection*`/`\subsubsection*` heads as in foundation.

### P2 STYLE TARGET (MA fingerprint, measured 2026-07-01; G-A bands per FCDP §5)
avg sentence 33.7 (band 29–36) · short/long 0.23/0.45 · nounVerb 0.65 balanced · nominalization 5.0 · prepPhrase ≤5.4 · beVerb 0.15 · parataxis 0.38 mixed · **periodicRunning 0.44 mixed (label must read *mixed*)** · **preMainVerb 0.21** · voice 0.41 / dynamicRange 0.74 · Germanic ≥86% · opacity 0.76 · figures: polyptoton ~0.10/sent, chiasmus/antithesis/isocolon/climax present but not saturated.
Gate: `python3 scripts/strip-latex-for-lanham.py <draft> <plain>` (add `\gk{}`/`\ldots` stripping) → `npx tsx tmp/analyze-style-lanham.ts <plain>` **from repo root**.

### P3 TERMINOLOGY & STYLE LOCKS (delta-relevant; full list = FCDP §7)
- **KEEP (user-locked 2026-07-01):** *rhetorical actancy/actant* (Gries/Latour, not folded into Burke) · *fallenness* (inauthentic-until-ruptured enrichment) · the ``they''.
- **On-sight swaps:** goblin "compulsive motion" → **programmed responsiveness / scripted efficient causation** (never "compulsion" for the NPC) · "true presence"/"Being-in-a-virtual-world-in-the-world" → **rhetorical incorporation** (world-disclosedness pole) · thrownness → the A₀ dwelling-horizon · "phantasmatic" → "phantasmic".
- **Collision guard:** Heidegger's "involvement" (MA) vs Calleja's (RODA) — use *dwelling / equipmental dealings* for the former.
- *prohairesis* = the bouletic's deliberative completion, never a fourth type. Union poles = world-/co-disclosedness. *hexis* ≠ habit. "emotion" not *pathē*. Player ungendered noun. No bold run-in heads; no back-references; no new coinages; `` '' only.

### P8 NEGATIVE CONSTRAINTS
- No aphoristic fragment-sentences as paragraph pivots ("The mood is the proof.") — the MA voice earns emphasis inside longer sentences.
- No "supplies the canonical anchor"; forbidden-phrase blacklist (`tmp/Dissertation/TODO_NOTES.md` §H) consulted at G-F.
- **The methodology is implemented AND stated (user directive 2026-07-02):** RODA named as the encompassing frame; **Calleja's PIM named as the structural layer within it** — the six involvement dimensions identify which designed elements press at each beat, the A₀–A₄ chain says what they do to the actualization of desire. The Fruit carries the full chain×channel mapping explicitly; elsewhere channels are named wherever they do real work (never as a checklist). The former "implicit outside the Fruit" constraint is RESCINDED.
- **The exploratory pedagogy is 4.1's organizing claim (user directive 2026-07-02):** exactly ONE instruction exists in the whole demo ("light the candle," at the start, visible only on looking at the tracked hands); everything else is learned by exploration — what can and cannot be done, what things mean, what the goblin wants, what the bell does. Write M1–M3 so this carries the argument, not a detail of it.
- Evidence asserted per grade only; no locus from memory (missing → `******`).

### P9 USAGE STATEMENT
Fable 5 contributes phrasing, structure, and analysis of pack-supplied evidence only; no claims beyond P5/P7; no invented or recalled citations; quotations enter by «Qnn» substitution only (`scripts/substitute-quote-ids.py` + `gg-section4-quotes.json`).

---

## MIDDLE

### P4a QUOTE INDEX (bank: `gg-section4-quotes.json`; provenance: verified in the G&G chapter pass 2026-06-27 and COMBINED-v1 citation pass 2026-06-30, as rendered in the foundation)
- **Q1** Salvo 31 — candle lighting "more difficult than one might imagine…" (candle difficulty datum)
- **Q2/Q3** Salvo 31 — "direction tone" / "interface tone" (the sign→interface turn)
- **Q4** Salvo 40 — the rock "resistant or entirely unserviceable" (recalcitrance exemplar)
- **Q5** Salvo 36 — goblin actions "nothing more than… programmed responses…" (superficial agent)
- **Q6/Q7** Salvo 58 n.15 — the reverse-AWS carry-over datum ("tethered…" / "…around 15 minutes…recalibrate…")
- **Q8/Q9** Burke *Rhetoric* 21 — "acting-together" / "both joined and separate" (consubstantiation; tavern)
- **Q10** Heidegger *BT* 160 — "disclosedness of the Dasein-with of Others" (co-disclosedness locus)
- Page-cite-only (no verbatim needed): Salvo 27 (soap-bubble), 28 (1:1 locomotion), 30 (kinesthetic interiorizing), 32 (goblin shyness; axe; waiting), 33 (less-is-more), 35–36 (comportment mirroring); Rickert *Ambient Rhetoric* 199–201 (thing vs object); Burke *Grammar* 443 (Scene–Act), 21 (banished term); Calleja *In-Game* 178 (apex), 172 (intrusion-integration); Heidegger *BT* 176 (equiprimordial disclosedness); Adorno *Aesthetic Theory* 32 (piano); Salvo 41–42 (craftsman passage — see M2 enrichment; lift requires pdftotext re-verification at D2 time before quoting verbatim).

### P5 EVIDENCE BANK
- Frame-trace timestamps (CONFIRMED, `gg-frame-trace.md`): fruit detaches **06:52.8**, lands 06:53.5; hand-over/placement **07:13.3**; goblin retrieval **07:21.7** (~8 s delay); miniaturization **07:48–08:14**; tavern **08:56–09:16** (two goblins: one asleep, one drinking).
- Reverse-AWS carry-over (AUTHOR, MA 58 n.15): ~4 h session → ~15 min recalibration.
- Goblin behavior set (AUTHOR, MA 32, 35–36): shy peripheral appearances; axe-sharpening detour; waiting posture; comportment mirroring (abrupt → flee, gentle → approach).
- Candle instruction visibility (AUTHOR, MA 31): single instruction, only on looking at tracked hands.

### P6 CONCEPTUAL SEMANTICS (RODA v9, locked formulations)
- **Chain:** A₀ designed *Umwelt*/dwelling-horizon → A₁ completed perception + dual residue → A₂ *phantasma* (pivot) → A₃ completed cognition + committal *doxa* → A₄ completed action, recursive → *hexis* (A₄→A₀′).
- **Union:** *rhetorical incorporation*, two-poled, "one in substrate, different in being" — **world-disclosedness** (incorporation, re-grounded from Calleja; R1–R7; R4 cornerstone = room-scale 1:1; R6 apex; R7 intrusion-integration) · **co-disclosedness** (consubstantiation, re-grounded from Burke; the *doxa*-ratified WE).
- **Cause:** two four-cause analyses hinged at producing-art/using-art; designer authors material+formal, player supplies efficient+final; **curation not coercion**.
- **Instruments in play:** phantasia-conscription (withholding authors via the player); **productive rupture** vs *bia* (miniaturization transforms without seizing the agent-pole — contrast case to the RDR2 rupture); rupture typology (rock-recalcitrance / equipment-failure incl. HMD-power-cut with the kind-distinction note / gestalt-flip / miniaturization — only the last re-incorporates); fallen-incorporation-until-ruptured; unconcealing; carry-over as *alloiōsis* bounded by the kind-firewall (no depth of carry-over converts kinds).
- **Types:** epithymetic/thymotic/bouletic; *prohairesis* = deliberative completion (the bell-ring reading in the foundation is correct and locked).

### P7 FOUNDATION TEXT
`plans/packs/gg-section4-foundation-snapshot-2026-07-02.tex` — COMBINED v2 §4, verbatim, 5,044 words (the god-agent's 2026-07-02 content pass included). **Content-approved; voice to be rebuilt.**

---

## D1 sub-pack note
D1 uses: P1–P3, P8–P9, P5 grades, P6, P7, P4a. D2 per-movement sub-packs add the movement's skeleton + assigned quote-index entries only.
