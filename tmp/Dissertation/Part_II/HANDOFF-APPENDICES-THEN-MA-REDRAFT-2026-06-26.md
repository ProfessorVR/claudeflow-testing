# HANDOFF — Appendices, then the MA-thesis redraft via RODA · 2026-06-26

**Purpose.** Pick up after the RODA methodology **justification layer** was finished, revised, and ported. Two phases, **in this order**: (1) **populate the methodology appendices**, then (2) **begin redrafting the MA thesis (*Veri(dis)similitude*) using RODA**. Submit this doc at the top of the clean session. Do NOT re-derive the finished work.

> **Source priority (hard rule, user-restated 2026-06-26):** point to and read the **`corpus/index/` entries FIRST** for every source; PDF only as fallback. The relevant index entries are listed inline below and gathered in §5. (cf. memory `feedback-corpus-index-first`.)

---

## 0. TL;DR
- **Finished this session:** the Part II methodology justification layer → **DRAFT-v3** (5 movements), per-paragraph-revised to Part I's voice, every locus verified against the corpus, the two poles **renamed to world-/co-disclosedness**, ported to **compiling XeLaTeX** (4 pp, verified).
- **Phase 1 — appendices:** populate the 3 stubs in `tmp/Dissertation/Appendices/` from the index entries (verbatim is already in hand — see §3).
- **Phase 2 — MA redraft:** begin redrafting *Veri(dis)similitude* onto RODA. A detailed **repurpose plan already exists** (`plans/veridissimilitude-ma-repurpose-analysis.md`) and a **structured index entry is already partly built** (`corpus/index/Veri(dis)similitude (Salvo MA)/`) — but both predate the **final** method (they target RODA **v5**; the method is now **v8 + DRAFT-v3**, incl. the disclosedness rename), so they need re-seating. See §4.

---

## 1. What was FINISHED this session

**The methodology justification layer — DRAFT-v3 — is complete, revised, citation-verified, and ported.**
Files in `tmp/Dissertation/Part_II/methodology/`:
- `Rhetorical-Ontological Diachronic Analysis (RODA) - DRAFT-v3.md` — the **editable source** (5 movements; work prose here).
- `… - DRAFT-v3.tex` — the XeLaTeX port (DRAFT-v1.tex preamble; **compiles clean**, 4 pp).
- `… - DRAFT-v3.pdf` — the compiled output.
- backup of the pre-revision base: `…/methodology/.backups/2026-06-26T0923-pre-draft-v3-revision/`.

Done within it:
1. **Voice** lifted to the Part I ¶3 **gold standard** (dynamicRange 0.769 → **0.853**); plain (not elevated) openers.
2. **Pole rename** (replaces world-pole / with-others pole): **world-disclosedness (*Welterschlossenheit*)** and **co-disclosedness (*Miterschlossenheit*)** — both **Heidegger's own terms** (M&R "co-disclosedness" = *Miterschlossenheit*, *BT* 145, of space; *BT* 160 = H.123 co-constitutes worldhood + the others' disclosedness). Morphology carries "one in substrate, different in being."
3. **Full citation/Bekker pass** (corpus/index first, PDF-verified): *Phys.* II.2 **194a34–b5**; *DA* III.2 425b26–27 aligned to Part I's translation; maker/user example **rudder → flute**; Calleja metaphor-disclaimer **p.3**; cornerstone **p.170**; the hammer "disappears into the hammering" **un-quoted** (it's paraphrase, not M&R; *BT* 98); seven causes **Rhet. I.10 1369a5–6**; concealment quote (Grammar 21) cross-sentence elision broken; *hexis* gloss **NE II.1 1103a16**; PIM narrative/affective footnote quotes extended to clause-end.
4. **Provenance end-note** corrected (the two-pole *fusion* is now partly Heidegger's via BT 160, so it's no longer claimed as the dissertation's own).
5. Continuity memory written: `…/memory/project-roda-methodology-draft-v3.md` (indexed in `MEMORY.md`).

**Two small open calls on DRAFT-v3** (carry forward; neither blocks): a precise single-page locus for *Welterschlossenheit* (currently anchored via "worldhood" @ *BT* 160); and the provenance closing line (keep / make a footnote / drop).

---

## 2. What REMAINS (deferred — beyond the appendices)
Still to draft on the methodology section itself (NOT this handoff's two phases, but on the books):
- **§M.5** emergent instruments + dwelling · **§M.6** VR↔screen differential module · **§M.7** protocol in brief.
- **Appendix C** — the full RODA brawl walkthrough (advisor demo, v8-updated: *prohairesis* = bouletic's completion not a coordinate Type 4; phantasm*ic* not phantasm*atic*; no bold run-in heads; restored Step 3 = Burke motive-rhetoric).
- The **Phase-2 applications** (G&G VR miniaturization; RDR2 Sonny capstone) — the MA redraft (§4) IS the on-ramp to the G&G one.

---

## 3. PHASE 1 — populate the appendices

**Stubs to fill** (in `tmp/Dissertation/Appendices/`):
- `Appendix - Calleja PIM and Incorporation Criteria (R1-R7).md`
- `Appendix - Burke Dramatistic Pentad.md`
- `Appendix - Burke-Calleja Crosswalk (convergence evidence).md`
- (`GLOSSARY.md` already exists — add the **world-/co-disclosedness** pair + any RODA terms not yet in it.)

**The verbatim is already in hand** — two assets make this mostly assembly, not research:
1. **DRAFT-v3's footnotes** already carry the *verified* verbatim: the 6 PIM dimensions (`[^pim]`), R1–R7 (`[^crit]`), the pentad + Attitude (`[^pentad]`). Lift from there.
2. This session's **citation-verification ledger** confirmed every locus; the corrected pages are baked into DRAFT-v3 (Calleja metaphor p.3, cornerstone p.170, etc.).

**Index entries to draw full articulation from (FIRST; PDF fallback):**
- **Calleja PIM + R1–R7** → `corpus/index/In-Game (Calleja 2011)/` — esp. `Calleja - The Player Involvement Model`, `Calleja - From Immersion to Incorporation`, `_synthesis`. PDF fallback: `corpus/new_media/Calleja, Gordon - In-Game- … [My Copy].pdf`. (PDF page = printed folio; offset 0.)
- **Burke pentad + consubstantiation + paradox of substance** → `corpus/index/A Grammar of Motives (Burke 1945)/` (esp. `Burke - Introduction (Five Key Terms of Dramatism)`) and `corpus/index/A Rhetoric of Motives (Burke 1950)/` (esp. `Burke - Identification and Consubstantiality`). PDFs cite by **printed page** (printed = PDF − 21 in *Grammar* body; − 15 in *Rhetoric*).
- **Burke × Calleja crosswalk** → `corpus/index/Game-Behavior Analysis Method (Burke × Calleja)/validated-crosswalk.json` (+ any `validation-report.md`). Four-binding core: Scene↔Spatial, Agent↔Shared, Agency↔Kinesthetic, Attitude↔Affective; keystone Consubstantiation↔Incorporation. **Present as evidence, NOT method** (the 6×6 grid was demoted).

**When populating:** keep `*-direct` (the theorist's claims) firewalled from RODA's recasting; use the **final** terminology (world-/co-disclosedness; the producing/using-art partition) — the stubs were written 2026-06-25, before the rename. Honor Gross citation rigor + the missing-source placeholder rules.

---

## 4. PHASE 2 — begin redrafting the MA thesis via RODA

**The MA thesis:** *Veri(dis)similitude: The Rhetorical Force Generated by VR Technology* (Salvo MA, 67 pp., advisor J. Alexander).
- **Index entry (READ FIRST):** `corpus/index/Veri(dis)similitude (Salvo MA)/` — already contains structured RODA analysis: `phase0-overview.md`, `vds-claims-moves.md`, `vds-terminology.md`, `vds-interlocutor-loci.md`, `gg-element-matrix.md`, `gg-RODA-matrix.md` (THE-MATRIX filled; miniaturization = ontological-change episode), `gg-frame-trace.md`, `manifest.json`.
  *(Windows/WSL view: `\\wsl.localhost\Ubuntu-24.04\home\dalton\projects\claudeflow-testing\corpus\index\Veri(dis)similitude (Salvo MA)`.)*
- **Source PDF (fallback):** `corpus/Part_II/Salvo, Dalton - MA Submission - Veri(dis)similitude- The Rhetorical Force Generated by VR Technology.pdf` (also in `style-training/`).
- **The repurpose execution plan:** `plans/veridissimilitude-ma-repurpose-analysis.md` — mode = **re-ground + enrich** (preserve the MA's readings, re-seat on the A₀–A₄ chain, add the Calleja/Burke/Heidegger apparatus), NOT from-scratch. Output homes: the index entry above + the Part-II dossier `tmp/Dissertation/Part_II/Part-II-GG-Repurpose/` (crosswalk, gaps-to-add, concept-reconciliation, vr-vs-screen-differential, `gg-frames/`).

**⚠️ Critical update flag — the analysis predates the final method.** The repurpose plan + index entry target RODA **v5** (2026-06-09). The method has since reached **v8 + the DRAFT-v3 justification layer**, which changed load-bearing terms: **world-face/other-face → world-disclosedness/co-disclosedness**; the producing-/using-art four-cause partition; the finalized union ("one in substrate, different in being"); *prohairesis* = bouletic's completion (not a coordinate Type 4); phantasm*ic* not phantasm*atic*. **Re-seat the v5 anchors onto DRAFT-v3 before/as you redraft** — the `gg-RODA-matrix.md` and the RODA-anchor map in the plan are the right scaffold but use stale labels.

**Scope fork to settle at pickup (discuss in prose, don't poll):** "redraft the MA *as* a revised standalone thesis" vs. "repurpose the MA into the **Part II G&G analysis chapter**" (the repurpose plan leans here — "writing Part II becomes assembly"; the MA's G&G clip + miniaturization-rupture is exactly the deferred Phase-2 G&G application). Most of the analytic prep is already in the index entry/dossier; the redraft is the **writing** pass that turns that prep into RODA-grounded prose.

**Method reference for the redraft:** the finalized method content lives in `corpus/index/Game-Behavior Analysis Method (Burke × Calleja)/CANONICAL-METHODOLOGY-v8.md` (+ `VALIDATION-v8-barfight.md`), and the *written* justification is DRAFT-v3 (§1). Use DRAFT-v3's vocabulary as canonical.

---

## 5. Index-entry pointers (the source-of-truth set — read these FIRST)
- MA thesis: `corpus/index/Veri(dis)similitude (Salvo MA)/`
- RODA method (canonical content): `corpus/index/Game-Behavior Analysis Method (Burke × Calleja)/` (`CANONICAL-METHODOLOGY-v8.md`, `VALIDATION-v8-barfight.md`, `validated-crosswalk.json`, `THE-MATRIX.md`)
- Calleja: `corpus/index/In-Game (Calleja 2011)/`
- Burke: `corpus/index/A Grammar of Motives (Burke 1945)/` · `corpus/index/A Rhetoric of Motives (Burke 1950)/`
- Heidegger *BT*: `corpus/index/Heidegger - Being and Time/`
- Aristotle: `corpus/index/Aristotle - Complete Works/` (+ verbatim catalog `tmp/Dissertation/verbatim_passages.md`)
- Part I voice target: `tmp/Dissertation/Working tex versions/Part I - Complete.md` (fingerprint in memory `project-part-i-lanham-style-fingerprint`)

---

## 6. Locks & conventions to carry (point of truth = `MEMORY.md`)
- **Voice:** orientation **¶3 of DRAFT-v3 is the gold standard** (figured-but-plain, short-punch rhythm); openers **plain not elevated**; chase **dynamicRange** (0.90), NOT voiceScore/low-be-verbs (¶3 is itself low-"I"/"is"-heavy). Runner: `npx tsx tmp/analyze-style-lanham.ts "<file>"`.
- **Terminology (hard):** the two poles = **world-disclosedness / co-disclosedness** (never world-face/other-face); the object the method traces = **the actualization-of-desire chain** (not "RODA" — RODA is the method); union = **"one in substrate, different in being"**; **"residue"** reserved for the within-pass *resonant kinēsis* (A₁), cross-pass build-up = **temporal sedimentation** (*hexis*).
- **Style:** **no bold run-in heads**; Greek italicized + glossed + **Bekker inline**; secondary lit cited inline `(Author, ShortTitle, Page)`; **ungendered**, in-game subject = **"the player"** (gendered pronouns only for named theorists, e.g. Calleja/Heidegger).
- **Process:** academic writing → Anthropic Claude; **corpus/index FIRST**; **Gross citation rigor** (verify every locus; honor unverifiable flags; `******` missing-source placeholder); **backup before changes** (`.backups/`); **major iterations on copies** (`*-iterations/`); discuss conceptual/terminology forks **in prose**, don't poll.
- **Session discipline:** consult `session-degradation-remediation-2026-05-24` (7-step pre-output protocol + forbidden-phrase blacklist) at session start.

## 7. Key file map
- **Methodology (DONE):** `tmp/Dissertation/Part_II/methodology/Rhetorical-Ontological Diachronic Analysis (RODA) - DRAFT-v3.{md,tex,pdf}`
- **Appendices (Phase 1):** `tmp/Dissertation/Appendices/` (3 stubs + GLOSSARY)
- **MA repurpose (Phase 2):** plan `plans/veridissimilitude-ma-repurpose-analysis.md`; index `corpus/index/Veri(dis)similitude (Salvo MA)/`; PDF `corpus/Part_II/Salvo, Dalton - MA Submission - …Veri(dis)similitude….pdf`; dossier `tmp/Dissertation/Part_II/Part-II-GG-Repurpose/`
- **Method (canonical):** `corpus/index/Game-Behavior Analysis Method (Burke × Calleja)/CANONICAL-METHODOLOGY-v8.md`
- **Continuity memory:** `…/memory/project-roda-methodology-draft-v3.md`
- **Style tooling:** `tmp/analyze-style-lanham.ts` · target `Part I - Complete.md`
