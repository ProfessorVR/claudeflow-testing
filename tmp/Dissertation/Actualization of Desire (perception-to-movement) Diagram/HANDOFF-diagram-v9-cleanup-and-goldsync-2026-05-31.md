# HANDOFF — Interactive Diagram v9: Cleanup + Gold-Standard Sync

**Date:** 2026-05-31
**Purpose:** Continue the operation on the "Actualization of Desire" interactive diagram in a fresh session with full context.

---

## Files

- **Diagram (edit this):**
  `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/option-b-iterations/actualization-chain-v7 — Option B v10.html`  ← **working file as of Batch 1 (2026-06-01); v9 preserved untouched as the pre-Batch-1 baseline**
- **Gold-standard dissertation (source of truth):**
  `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/Source/Part I - Rhetorical Phantasia.md`  (1393 lines)
- **Backups of diagram:**
  - `…/actualization-chain-v7 — Option B v9.html` — pre-Batch-1 gold-sync baseline (untouched; v10 = copy of it + Batch 1 fixes)
  - `…/actualization-chain-v7 — Option B v9.html.bak-pre-cleanup-38f7f49f` — pre-Task-2 cleanup

---

## The operation (original 6-part task)

1. Analyze every line of the diagram.
2. Remove meta-language — anything indicating an AI system created it (e.g. "This node now shows…").
3. Make the diagram reflect the gold-standard dissertation perfectly.
4. Green temporal bubbles → decided: **interval-only** (`τₙ→τₙ₊₁`).
5. *(merged into 3)*
6. **Every philosophical/technical term and every quotation in the diagram must be drawn from / verbatim against the dissertation. Nothing invented.**

## Locked decisions (apply going forward)

- **Keep** `§`-section cross-refs (e.g. `§1.3`, `§1.5`); **strip** manuscript line-numbers (`L###`). *(done)*
- **Fill** `[VERBATIM PENDING]` placeholders from the gold standard **where §§1–4 supply verified text**; otherwise leave a clean "verbatim text to be supplied."
- **Task 3 method:** section-by-section, **manual** (no workflow), reporting discrepancies per batch before editing.
- **Time bubbles:** interval-only. *(done)*

---

## Diagram architecture (orient fast)

Self-contained HTML. CSS (lines 9–687) → SVG skeleton of empty `<g>` shells (689–833) → big `<script>` (835–end) holding **all content in data arrays**, rendered into the shells.

- `actualities` — A₀…A₄. Fields: `desc`, `expanded:[{title,body,cite}]`, `passages:[]`, `greek`, `citation`.
- `a3Nodes` — four cognitive modes (Pure Noesis, Memory, Discursive[speculative/deliberative]) + the `hexis`/`doxa` data.
- `motions` — M₀→A₁ (M01) … M₃→A₄ (M34); each has `tau` (`τₙ→τₙ₊₁`) + `tauDesc` (now unused in the bubble label), `kinetic`, `roleDetails`, `expanded`.
- `PASSAGES` — **verbatim-quotation registry**, keyed by citation string (e.g. `'DA III.7, 431a8–14': "…verbatim…"`). This is the highest-risk place for non-verbatim text.
- `flowArrows`, plus the `MOTION_TIME_HORIZON` object (outer frame).
- Render: data → `#actuality-nodes`, `#motion-nodes`, `#time-boxes`, `#a3-nodes`, `#doxa-band`, `#settled-doxai`, etc. Hover/click → popover + side panel.

## Gold-standard section map (Source dissertation)

- **GOLD (verified):** start → end of **"A₂→A₃: Completed Cognitive Actuality and the Three Orientational Modes" (incl. *Doxa*)** = Source **lines 53–1061**. Covers: intro/architecture (53), Being-in-Motion-and-Time horizon (734), M₀→A₁ / *aisthēsis* / *resonant kinēsis* / dual-resonance (819), A₂ phantasma + the three modes + *doxa* (946).
- **FRONTIER (NOT gold yet):** **"Emotion…" (Source 1062)** and **"A₄: Four Types of Action…" (Source 1226)**.
  - ⚠️ Confirm with user whether the Emotion section (§5) is now gold; the instruction was "all sections **up to** section 5 'Emotion'," which I read as **through Doxa, before Emotion**.

This means the diagram's **A₄ node, emotion bubble, and Four-Types content cannot be gold-verified yet** — park them.

---

## DONE this session

1. **Time bubbles → interval-only.** Label render (≈ line 3254) is now `` `<tspan font-weight="500">${m.tau}</tspan>` `` (dropped `: ${m.tauDesc}`). `tauDesc` data fields left in place (harmless; may still feed the time popover).
2. **Meta-language removed (Task 2):**
   - Code/process comments deleted: `stay where they were`, `TODO 2026-05-28…pending user review`, `v9 ADDITIONS/PLACEHOLDERS (2026-05-28)`, `Time column label — removed`, the `EDIT HERE…Replace the value` block, the `PASSAGE PLACEHOLDERS … Per the user's standing convention (feedback-…-memory)` block, the `Earlier versions … category error` block, `Additional entries added 2026-…` dividers, `See VERBATIM-GAPS-…`, and the `tmp/Dissertation/verbatim_passages.md` path (kept the translator note); `strip is now inside the bubble` → `is inside the bubble`.
   - Viewer-facing: `"A₃ is no longer a single node but a row…"` → `"A₃ is a row of cognitive completions…"`.
   - All 22 `L###` line-numbers stripped; **all 39 `§` section-refs preserved**.
3. **Placeholders:** **Met Δ.21 fourfold** filled with verified verbatim (Source line 890: "We call an affection (1)…(4)…called affections."). The 3 others (`Rhetoric II.6, 1383b13–17` shame; `NE III.2, 1111b21–30`; `NE III.3, 1112b12–19`) had the AI file-ref removed → now "verbatim text to be supplied" (they're §5/§6 = not gold yet).
4. JS still parses; file is 4393 lines.

---

## Batch 1 (Task 3) — DONE 2026-06-01 → working file is now **v10**

Created `…Option B v10.html` (copy of v9) and gold-synced **A₀ · A₁ · M₀₁ · M₁₂** against Source 53–142 + 734–945. Fixes:
- **M₀₁ + both flowArrow role descriptions:** "analogical extension" of the III.10 schema → **direct application** (aisthēsis/phantasia are themselves *kinēseis*; gold Source 823, 821, 101/109; DA II.5 416b33–34, III.3 429a2).
- **`DA II.5, 426a27–b8` → `DA III.2, 426a27–b8`** (3×; gold Source 908).
- **Naming cite `Phys. V.1, 224b7–9` → `Phys. V.5, 229a24–25`** everywhere (A₀, MOTION_TIME_HORIZON, popover builder, comment; registry entry relabeled from the mislabeled `229b25`; alias repurposed to `229a25`). Gold Source 94/631/762. ⚠️ **Reversed** the prior "per §1.0/§1.1" choice — flip back only if §1.0/§1.1 *.tex* genuinely cite V.1 224b.
- **A₀ near-quote** → active ROT "one and the same activity, and yet the distinction between their being remains" (425b26–27; gold 82/841).
- **Prime Mover** `1072a23–26` → `1072a24–28` (gold 107).
- **A₁ fourfold siglum** `GA 18` → `BCAP` (matches body + gold 893–906).
- **A₁ greek field** → `resonant aisthēma + resonant epithymia`.
- **A₁ "Second actuality"** node: three-grade schema made explicit — first potentiality / first actuality (= held) / second actuality (= exercised); gold 800/825.
- **Pruned** orphaned `PASSAGES['Phys. V.1, 224b6-8']`.

Verified: JS parses (1 block, syntax OK); all relabeled/aliased keys resolve; verbatim-clean (Met Δ.21 1022b15–21, DA II.3 414b4–6, DA II.12 424a17–24, DA III.7 431a8–14 all match gold). File now 4390 lines.

**New locked decisions:** (a) naming-from-terminus cite = **Phys. V.5, 229a24–25** (not V.1 224b); (b) the three-factor schema applies to perceptual & phantastic motions **directly, not analogically** (these motions are themselves *kinēseis*). NB the gold `.tex`'s own embedded TikZ caption (Source 340) still says "analogical ext." — stale; flag for the dissertation prose pass, not the diagram.

---

## Batch 2 (Task 3) — DONE 2026-06-01 (in v10)

Gold-synced **A₂ (the *phantasma* proper) + M₂₃ (cognitive motion)** against Source 946–979 (+ modes/doxa 980–1061). Fixes were A₂-only; **M₂₃ was substantively clean**.
- **Misattribution fixed:** "BCAP pp. 122–125 (where phantasia is analyzed as the way eidos becomes operative)" → **"BCAP pp. 132–137"** (the making-present reading: gold Source 960 "See BCAP 132–137"; block-quote 962; illumination 966/984). pp. 122–125 is the *hexis*/ἀρετή material — retained in registry (used by parked hexeis nodes).
- **Citation format → BCAP page-only** in A₂ (per user directive): "GA 18, p. X" → "BCAP, p. X"; added BCAP→GA18 aliases so keys resolve. Parked A₄/hexeis "GA 18 §17" refs left for Batch 3.
- **Relocated** the fourfold-of-*pathos* quotes (BCAP 131/132/134) out of A₂'s passages (they are A₁ content) into **A₁'s passages**, where its "Four senses of *pathos*" item discusses them.
- **`poiēin paron` → `poiein paron`** (transliteration of ποιεῖν παρόν, gold Source 960); **A₂ greek field** "+ epithymia" → "+ resonant epithymia".

Verbatim-clean (gold/verbatim_passages): "νοῦς is the light…" (BCAP 135 = verbatim_passages 593), "taken-as-baseball" + "pre-propositional but not pre-positional" (Source 970), "ποιεῖν παρόν / making-present" (Source 960), MA 701a32–33. JS parses; BCAP keys resolve; file 4396 lines.

**Heads-up (gold-side, not diagram):** Source 954 fn cites the "imagine fearful without being affected" passage as **427a21–24**; correct Bekker is **427b21–24** (diagram is correct). M₂₃ carries accurate added-Greek glosses (ἑνί τινι δεῖ μετρεῖν; οὐκ ἐφ' ἡμῖν; logos/pistis/pepeisthai) beyond gold's English ROT — consistent with the Greek-throughout convention.
**Optional enhancement (not done):** add the BCAP 134 making-present block-quote (gold Source 962) as a registry entry so A₂'s making-present claim is verbatim-backed.

---

## Batch 3 (Task 3) — DONE 2026-06-01 (in v10)

Gold-synced the **A₃ row + Doxa-band core** against Source 980–1061. **Content was verbatim-clean; the only edit was the BT citation reformat.**
- **A3-NOESIS / A3-MEMORY / A3-DISCURSIVE (+ Speculative, Deliberative) / Doxa-band core** (asymmetry-of-will, three conditions, sun passage, two-level taking-as, orthogonal supervenience): quotations verbatim + loci correct vs gold (DA III.7 431a16–17 / 431b2; On Memory 449b22–30; DA III.11 434a5–9; DA III.10 433a14 / 433b7–10; III.9 432b28; III.3 427b16–21 / 428a19–24 / 428b2–4 / 434a10–11).
- **BT → M&R English page** (per user directive 2026-06-01): A3-MEMORY `BT §65, H.329` → **`BT, pp. 377–378`** (alias added; canonical key kept for the parked emotion node; its attribution also cleaned to page-only). Plus the BCAP-134 making-present block-quote was added to A₂ (PDF-verified, gold Source 962).
- Added-Greek glosses in modes/doxa (ἑνί τινι δεῖ μετρεῖν; ἐφ' ἡμῖν / οὐκ ἐφ' ἡμῖν; πίστις/πεπεῖσθαι/λόγος) left as-is — accurate, consistent with the Greek-throughout convention.

**PARKED (frontier §1.5/hexis):** SETTLED_DOXAI (hexeis node) + the doxa-band's last two expanded items ("two-axis threshold §1.5"; "hexis bivalence anchor GA 18 §17") — these carry the user-flagged **technē-doxa** error (item 4) + GA 18 §17 refs (BCAP-normalize when gold).

**Gold-side heads-up (not diagram):** Source 986 swaps two loci — "the soul never thinks without an image" cited 431b2 (correct: 431a16–17) and "the thinking faculty thinks the forms in the images" cited 431b12–13 (correct: 431b2). The diagram is correct.

**STATUS: all gold (§§1–4 / Source 53–1061) diagram content is synced (Batches 1–3 ✅).** Remaining = parked frontier, awaiting user gold-review of §§5–6.

---

## REMAINING — the main job (Task 3)

**Node-by-node verbatim + terminology cross-reference of A₀ → A₃/doxa against gold §§ (Source 53–1061).** For each diagram element, verify against the dissertation:
- every embedded quotation is **verbatim** (check the `PASSAGES` registry entries AND inline quotes in `desc`/`expanded.body`);
- every `cite` / `passages[]` citation (work, book, Bekker/H/page) is correct;
- every key term is **dissertation-sourced** (point 6) — no invented terminology.

**Suggested batches (in order):**
1. ✅ **DONE (v10, 2026-06-01)** — A₀ + A₁ + M₀₁ + M₁₂ — perception / hylomorphism / *resonant kinēsis* / dual-resonance. (Source 734–945.)
2. ✅ **DONE (v10, 2026-06-01)** — A₂ + M₂₃ — the *phantasma* proper, making-present/taking-as, the three "this is drink" routes. (Source 946–979.)
3. ✅ **DONE (v10, 2026-06-01) — A₃ modes + Doxa-band core** (Noesis / Memory / Discursive + Speculative/Deliberative + orthogonal *doxa* core). **Hexeis / settled-doxai PARKED** (frontier §1.5; technē-doxa issue — see item 4). (Source 980–1061.)
4. **PARKED until §§5–6 gold:** A₄ node, emotion bubble, Four-Types, and the 3 remaining placeholders (Rhetoric II.6 shame, NE III.2, NE III.3). **Hexeis nodes also parked** (frontier §§1.4/1.5, not yet gold-reviewed) — user-flagged 2026-06-01:
   - (a) **Terminological error:** the diagram's "**technē-doxa**" framing is wrong. *Technē* is NOT a *doxa* and does not operate like one — it is a *procedural efficiency toward achieving an end*, hence a *type of hexis*; but like every *hexis* it is in no way a *doxa* (cf. the doxa ≠ hexis rule). Re-term when the hexeis section goes gold (look at lines ~1305–1311 `technē-doxa`, and the settled-doxai/hexis prose).
   - (b) **UI bug:** the *technē-hexis* / *ethical-hexis* sub-bubbles are very hard to select individually; usually only the overall "Hexeis (standing dispositions)" bubble opens. Needs a hit-target / z-order / event-binding fix on the sub-regions.

**Method:** read the relevant Source subsection, pull the diagram's corresponding quotes/cites, report discrepancies, fix on approval (or fix-and-report per the manual section-by-section plan).

---

## Critical caveats (this project has a hallucination history)

- **Do not trust any quote in the diagram — verify each against the Source and/or the source PDFs.** This session already caught multiple non-verbatim/misattributed quotes *in the dissertation itself* (e.g. a largely fabricated *Being and Time* footnote; Burke "art of persuasion" cited p.47 but actually p.46; Uexküll pages off by ~4; Rickert "carved out **in advance**" mis-truncated). The diagram likely has similar issues.
- **Source PDFs for verbatim checks** are in `corpus/rhetorical_ontology/` — incl. Heidegger *Being and Time* (1962 M&R), *BCAP*/GA 18 (2009), Gibson *Ecological Approach* (2015), von Uexküll *A Foray* (2010 transl.), Rickert *Ambient Rhetoric* (2013), Burke *A Rhetoric of Motives* (1950), Frede "Cognitive Role of Phantasia" (1992).
- **Page numbers:** derive **printed** page from each page's running header, not the PDF index; beware line-break hyphenation when grepping (`pdftotext -layout`, then de-hyphenate).
- **Point 6 is strict:** if a diagram term/phrase isn't in the dissertation, flag it rather than keep it.
- Make a fresh backup before a big edit batch.

---

## Ready-to-use opening prompt for the new session

> Continue the interactive-diagram operation per the handoff at
> `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/HANDOFF-diagram-v9-cleanup-and-goldsync-2026-05-31.md`.
> **Batches 1–3 are DONE in `…/actualization-chain-v7 — Option B v10.html`** (v9 preserved) — all **gold (§§1–4 / Source 53–1061) diagram content is now synced**. Remaining work is the **parked frontier**: the A₄ node, the Emotion bubble, Four-Types, the **Hexeis** nodes (incl. the user-flagged `technē-doxa` terminological error), and the 3 `[VERBATIM PENDING]` placeholders (Rhetoric II.6 shame, NE III.2, NE III.3). These await the user's gold-review of **§§5–6 (Emotion + A₄)** and the §1.5/hexis sections. When a frontier section goes gold, cross-reference it by the same method: Heidegger source-priority gold → `verbatim_passages.md` → PDF; cite **BCAP by page**, **BT by M&R English page** (e.g. `BT, p. 377`); drop "GA 18 §x"; keep §-refs, no L-numbers; report discrepancies before editing.
