# HANDOFF — "Actualization of Desire" Diagram: Update Status

**Date:** 2026-06-01
**Purpose:** Single-page snapshot of where both diagrams stand, so a fresh session can continue without re-deriving context.
**Scope:** the **interactive HTML diagram** (primary) and the **static LaTeX figure** (mirror, for the dissertation).

---

## 0. TL;DR

- **Interactive HTML → `…v10.html`.** All **gold (§§1–4 / Source 53–1061)** content is **gold-synced (Batches 1–3 ✅).** Everything past *Doxa* — A₄, Emotion, Four-Types, the Hexeis nodes, and 3 `[VERBATIM PENDING]` placeholders — is **PARKED**, awaiting the user's gold-review of §§5–6.
- **Static LaTeX → `actualization-chain-v9.tex`.** **Rewritten + simplified this session**, gold-synced to v10, restructured per user (Doxa split out beneath A₃, emotion fed by doxa, feedback + hexeis arrows, Motion-&-Time horizon frame). **Compiles clean** (pdflatex, 1 page, 384 lines).

---

## 1. Files

| Role | Path |
|---|---|
| **Interactive diagram (edit this)** | `option-b-iterations/actualization-chain-v7 — Option B v10.html` (4402 lines) |
| Interactive pre-Batch-1 baseline (untouched) | `option-b-iterations/actualization-chain-v7 — Option B v9.html` (4393 lines) |
| Interactive pre-cleanup bak | `…/actualization-chain-v7 — Option B v9.html.bak-pre-cleanup-38f7f49f` |
| **Static figure (edit this)** | `actualization-chain-v9.tex` (384 lines) + `actualization-chain-v9.pdf` |
| Static pre-simplify backup | `actualization-chain-v9.tex.bak-pre-simplify-1780334317` |
| **Gold standard (source of truth)** | `Source/Part I - Rhetorical Phantasia.md` — **GOLD = lines 53–1061 only** (through *Doxa*, before Emotion) |
| Verified-verbatim registry | `tmp/Dissertation/verbatim_passages.md` |
| Heidegger PDFs (for verbatim checks) | `corpus/rhetorical_ontology/` — BCAP `…Basic Concepts of Aristotelian Philosophy_(2009)_[Clean Copy].pdf`; Being and Time `…Being and Time_(1962)_[My Copy].pdf` |
| **Prior handoff (batch-level detail)** | `HANDOFF-diagram-v9-cleanup-and-goldsync-2026-05-31.md` (has the full per-batch DONE logs) |

---

## 2. Interactive HTML (v10) — status

**Gold boundary:** gold = §§1–4 (Source 53–1061). §5 "Emotion" and §6 "A₄ / Four Types" are **NOT gold yet** (user-confirmed 2026-06-01).

### DONE — Batches 1–3 (all gold content gold-synced)

- **Batch 1 — A₀ · A₁ · M₀₁ · M₁₂.** "analogical extension" → **direct application** (aisthēsis/phantasia are themselves *kinēseis*; M₀₁ + both flowArrow role descriptions); `DA II.5, 426a27–b8` → **`DA III.2, 426a27–b8`** (3×); naming cite `Phys. V.1, 224b7–9` → **`Phys. V.5, 229a24–25`** (everywhere); A₀ near-quote → active ROT ("one and the same activity, and yet the distinction between their being remains"); Prime Mover `1072a23–26` → `1072a24–28`; A₁ fourfold siglum `GA 18` → `BCAP`; A₁ greek field → "resonant *aisthēma* + resonant *epithymia*"; A₁ "Second actuality" node spells out the three grades (first potentiality / first actuality = held / second actuality = exercised); pruned orphaned `Phys. V.1, 224b6-8`.
- **Batch 2 — A₂ · M₂₃.** Fixed the **pp.122–125 misattribution** → **BCAP pp. 132–137** (making-present reading; 122–125 is the *hexis* material); converted A₂ Heidegger cites `GA 18` → **`BCAP` page-only** (+ aliases); relocated the fourfold-of-*pathos* quotes (BCAP 131/132/134) out of A₂ into **A₁**; `poiēin paron` → `poiein paron`. M₂₃ was substantively clean.
- **Batch 3 — A₃ row + Doxa-band core.** Verbatim-clean; only edit = **BT `§65, H.329` → `BT, pp. 377–378`** (M&R English page) + alias. Also added the **BCAP 134 making-present block-quote** to A₂ (PDF-verified vs gold Source 962).

JS parses cleanly throughout; file 4402 lines.

### PARKED (frontier §§5–6 / §1.5 hexis — NOT gold-reviewed)
A₄ node · Emotion bubble · Four-Types taxonomy · **Hexeis / settled-doxai nodes** · the 3 `[VERBATIM PENDING]` placeholders (`Rhetoric II.6, 1383b13–17` shame; `NE III.2, 1111b21–30`; `NE III.3, 1112b12–19`). Still use `GA 18 §17` (BCAP-normalize when gold).

---

## 3. Static LaTeX figure — status (rewritten this session)

A clean, simplified mirror of the v10 HTML, built for the dissertation. Compiles with `pdflatex` (1 page).

**Layout:** A₀→A₄ chain (center) + M₀₁–M₃₄ motions · three-factor **kinetic roles** (left) · **time** τ intervals (right) · **Doxa** bubble beneath A₃ · **Emotion–Desire Composite** (right) · **Hexeis** bubble (technē + ethical hexis, left) · recursive loop · perceptual/noetic background zones · all inside the dashed **"within MOTION & TIME (kinēsis kai chronos) — the all-encompassing horizon"** frame.

**Arrows:** A₃→Doxa ("ratifies") · Doxa→Emotion ("evaluatively complex") · Emotion→M₃₄ ("structures desire") · Emotion→A₂ (judgment-modifying feedback, *De Insomn.* 460b3–16) · Hexeis→M₂→A₃ ("add'l unmoved originator") · A₄→Hexeis ("action sediments disposition", NE II.1) · recursive A₄→A₀.

**Removed** (per user, for cleanliness): Basic-Affective-Valence bubble/track, the Legend, the orientational-modes + committal-dimension detail box, the three labelled M₃₄ routes, the bypass/feedback clutter, floating annotations, and the verbose time-bubble descriptions.

**Gold-synced content:** aisthēsis-as-kinēsis → schema applies **directly** (not analogical); naming = **Phys. V.5, 229a24–25**; A₁ = resonant aisthēma + resonant epithymia; **M₁→A₂ = "resonant kinēsis crystallizes into the phantasma"**; time bubbles = **τₙ→ₙ₊₁ only**.

**Caveats:** technē described as "procedural efficiency toward an end" (deliberately avoids the techne-doxa error — see §5); the hexeis cite still reads `GA 18 §17` to match the HTML's parked state (BCAP-normalize together when §1.5 goes gold). Doxa sits just right-of-center beneath A₃ (a centered Doxa would block the A₃→M₃₄ chain arrow). "add'l unmoved originator" is abbreviated to fit the channel below K23.

---

## 4. Locked decisions / conventions (apply to BOTH diagrams)

- **Heidegger verification source-priority:** gold doc → `verbatim_passages.md` → **PDF** (only if absent from the first two).
- **Citations:** cite **BCAP by page** ("BCAP, p. 135" — not "GA 18"); cite **Being and Time by M&R English page** ("BT, p. 377" — not "§x, H.xxx"). Drop the `GA 18 §x` apparatus.
- **Naming-from-terminus** = **Phys. V.5, 229a24–25** (reversed the earlier "per §1.0/§1.1" V.1 224b choice — flip back only if the §1.0/§1.1 *.tex* genuinely cite V.1 224b).
- **aisthēsis and phantasia are themselves *kinēseis*** → the three-factor schema applies to the perceptual & phantastic motions **directly, not analogically**.
- Keep **§-section cross-refs**; strip manuscript **L-numbers**.
- **Greek-throughout convention:** accurate added Greek glosses (e.g. ἑνί τινι δεῖ μετρεῖν, οὐκ ἐφ' ἡμῖν) are fine.
- **Method:** section-by-section, manual (no workflow); **report discrepancies before editing**; verify JS parses after HTML edits; compile + visually check after .tex edits.

---

## 5. Known issues / flags

- **`technē-doxa` terminological error** (user-flagged 2026-06-01, parked): the HTML hexeis nodes frame technē as a "doxa" ("technē-doxa"). **Wrong** — technē is *not* a doxa and does not operate like one; it is a procedural efficiency toward an end, a *type of hexis*; no hexis is a doxa. Re-term when the hexeis section (§1.5) goes gold (HTML ~lines 1305–1311 + settled-doxai prose). The static figure already avoids this framing.
- **Hexeis sub-bubble UI bug** (HTML): the technē / ethical-hexis sub-bubbles are hard to select individually — usually only the overall "Hexeis (Standing Dispositions)" bubble opens. Needs a hit-target / z-order / event-binding fix.
- **Gold-side typos (the diagrams are correct; fix in the dissertation):**
  - Source 954 fn cites the "imagine fearful without being affected" passage as **427a21–24** → correct is **427b21–24**.
  - Source 986 swaps two loci: "the soul never thinks without an image" cited 431b2 (correct **431a16–17**) and "the thinking faculty thinks the forms in the images" cited 431b12–13 (correct **431b2**).
  - Source 340 (the dissertation's *own* embedded TikZ caption) still says "analogical ext." — stale vs the prose at 823.

---

## 6. Next steps

1. **When the user confirms §§5–6 (Emotion + A₄) and §1.5 (hexis) are gold:** run **Batch 4** on the HTML — verify A₄ / Emotion / Four-Types / Hexeis against the now-gold source; **BCAP-normalize** the `GA 18 §17` refs; **fix the technē-doxa** terminology; **fill the 3 `[VERBATIM PENDING]` placeholders** (Rhetoric II.6 shame, NE III.2, NE III.3). Then mirror those fixes into the **static .tex** (its Emotion + Hexeis are currently minimal/parked-state).
2. **Static .tex** optional polish: spell out "add'l unmoved originator"; option to center Doxa directly under A₃ (shift the lower chain to make room); option to drop the left kinetic-role column for more whitespace.
3. The detailed per-batch logs (exact line numbers, before/after) live in `HANDOFF-diagram-v9-cleanup-and-goldsync-2026-05-31.md`.

---

## 7. Ready-to-use opening prompt for a new session

> Continue the "Actualization of Desire" diagram work per `HANDOFF-diagram-status-2026-06-01.md`. Interactive = `…Option B v10.html`; static = `actualization-chain-v9.tex`; gold = `Source/Part I - Rhetorical Phantasia.md` (lines 53–1061). All gold §§1–4 content is synced (HTML Batches 1–3); the frontier (A₄/Emotion/Four-Types/Hexeis + 3 placeholders) is parked until I confirm §§5–6 are gold. Heidegger source-priority gold → verbatim_passages.md → PDF; cite BCAP by page, BT by M&R English page; keep §-refs, no L-numbers; report discrepancies before editing.
