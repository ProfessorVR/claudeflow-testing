# HANDOFF — Verbatim Passages Audit (2026-05-22)

**Goal**: Make every quotation in the interactive diagram (`actualization-chain-v7 — Option B v7.html`) a verbatim pull from `corpus/rhetorical_ontology/`. User explicitly rejects placeholders.

**Active file**: `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/option-b-iterations/actualization-chain-v7 — Option B v7.html`

**Memory note context**: see `project-diagram-future-work.md` Item 3 (corpus-verbatim quotation pull).

---

## ✅ Completed in 2026-05-22 session

### Session 1: Fixes to existing PASSAGES registry
1. Replaced `"???"` placeholder for `'DA III.3, 428b25–429a2'` with verbatim from De Anima PDF pp. 41-44 (Smith/Barnes ROT)
2. Fixed typo `"invvolve"` → `"involve"` in `'DA III.11, 434a10–11'`
3. Removed editorial interpolation `''he observes, \`\`` from `'De Insomn. 460b3–11'` (now reads as continuous verbatim)
4. Removed duplicate PASSAGES keys: `'DA III.3, 428b10-17'` (kept en-dash version `'DA III.3, 428b10–16'`) and `'DA III.7, 431b2-9'` (kept `'DA III.7, 431b2–9'`)

### Session 2: Citation-reference aliases
Added 25 alias entries to PASSAGES (HTML refs in `passages: [...]` arrays now resolve to existing verbatim text):
- DA off-by-N: `433b17–18`, `433b5–10`, `433b7`, `433b9–10`, `434a5–10`, `428b2–4`, `431b2`, `14–15` (malformed → fixed), `417a–b` (composite of 3 sub-ranges), `427b14–15` (canonical)
- MA off-by-N: `701a13–14`, `701a32–33`, `701a7–25`, `701b16–32`, `702a15–17`, `702a17–19`, `702a20–21`
- On Memory off-by-N: `449b22–25`, `449b28–30`
- Phys off-by-N: `IV.11, 219b1–2`
- Rhetoric off-by-N: `1378a20–22`, `1378a30`, `1382a20–21`, `1385b15`
- De Insomn off-by-N: `460b3–16`

### Session 3: New verbatim extraction (1 of 6)
- ✅ `'DA III.7, 431b12–13'` — extracted verbatim from De Anima PDF p. 48 (Bekker 431b10–13):
  > "That too which involves no action, i.e. that which is true or false, is in the same province with what is good or bad: yet they differ in this, that the one is absolute and the other relative to someone."

### Spot-checks completed
Verbatim verified against PDF for 6 existing DA III.3 entries: `427b14–15`, `427b17–21`, `427b21–24`, `428a19–24`, `428b2–7`, `429a1–2`. All match Smith/Barnes ROT.

---

## ⏳ REMAINING WORK

### 5 PLACEHOLDER ENTRIES STILL NEED VERBATIM (lines 1796+ of v7.html)

These are still `****** ...` placeholders in PASSAGES. Each requires PDF read + extraction + edit replace.

| Citation | Source PDF | PDF page hint | Notes |
|---|---|---|---|
| `'GA 18 §17, pp. 119, 125, 127–128'` | `corpus/rhetorical_ontology/Heidegger, Martin - Basic Concepts of Aristotelian Philosophy_(2009)_[Clean Copy].pdf` | Print pp. 119, 125, 127–128 = PDF pp. 134, 140, 142–143 (offset +15 confirmed via bcap-structured/manifest.json) | Need 3 specific quote anchors: (a) "training has the precise sense of reducing deliberation…" p. 127; (b) "the how is only appropriated…to be composed at each moment; not routine but holding-oneself-open" p. 128; (c) "Hexis is nothing other than a how of pathos…" p. 125 |
| `'Met. Δ 20, 1022b 4'` | `corpus/rhetorical_ontology/Aristotle - Metaphysics_(2014)_[My Copy].pdf` | **WARNING**: bekker-index.md page numbers proven WRONG (claimed META-04 at pp. 36-48, actual at much higher PDF pages). Met Book V (Δ) is around print page 1612-1620 range. Try PDF pages 67-69 first. | Topic: definition of hexis as energeia of having |
| `'NE B 4, 1105a 22'` | **MISSING from corpus/rhetorical_ontology** — full NE PDF not present. Try `corpus/download/Q-017_cit15_PDF_Nicomachean_Ethics_II.-III.5_By_Aristotle_Book_II_-_UN.pdf` (Book II partial) OR `corpus/download/_extra_The_20Nicomachean_20Ethics.pdf` | TBD | Quote anchor: "not by chance, but according to a prescription…from out of himself" (grammatikos). If no PDF accessible, user must provide. |
| `'Phys. III.1, 200b12–25'` | `corpus/rhetorical_ontology/Aristotle - Physics_(2014)_[My Copy].pdf` | **WARNING**: bekker-index.md page numbers WRONG by ~30. Bekker 200b is start of book III. Read confirmed Phys PDF: p. 48-50 = Bekker 212-213 (book IV), p. 63-65 = Bekker 222-223, p. 82-84 = Bekker 233-235 (book V), p. 93-94 = Bekker 240-241 (book VI). For 200b, try PDF p. 32-36. | Topic: introduction of motion preparatory to canonical definition at 201a10-11 |
| `'Phys. V.5, 229b25'` | Same Physics PDF | Book V chapter 5, end of book V. Tried p. 82-84 (got 233-235) and p. 93-94 (got 240-241). 229b likely around PDF p. 78-80. | Topic: "each motion takes its name from its terminus" — naming-principle anchor |

### EXISTING PASSAGES STILL NEED FULL VERIFICATION (~37 entries)

Spot-check verified 6 DA III.3 entries verbatim. The remaining ~37 entries are TRUSTED based on the user's careful construction, but full verification requires PDF reads of each Bekker locus:

**De Anima** (need PDF pp. ~5-50 batched by Bekker range):
- DA I.1, 403a25–b19 (PDF p. ~10)
- DA II.3, 414b4–6 (PDF p. ~17)
- DA II.5, 417a14–21, 417a22–b1, 417b2–8 (PDF p. ~19-20)
- DA II.5, 426a27–b8 (NOTE: 426a is Book III.2, label "II.5" may be wrong)
- DA II.12, 424a17–24 (PDF p. ~25)
- DA III.3, 428a1–3 (need to verify start exactly)
- DA III.3, 428b10–16 (already partially verified — text matches)
- DA III.7, 431a8–10, 431b2–9 (PDF pp. 46-48 — partially verified)
- DA III.8, 432a3–9 (PDF p. ~48)
- DA III.10, 433a13–15, 433b5-12, 433b13–25, 433b21–25 (PDF pp. ~49-50)
- DA III.11, 434a5–9, 434a10–11, 434a10–16 (PDF p. ~50)

**De Motu Animalium** (PDF for Movement of Animals):
- MA 701a7–24, 701a28–b1, 701b15–32, 702a15–21, 702a17–18 (5 entries)

**Physics**:
- Phys. III.1, 201a11-14 (need to find correct PDF page)
- Phys. IV.11, 219b1 (need to find correct PDF page)
- Phys. V.1, 224b6-8 (need to find correct PDF page)

**De Insomniis**:
- De Insomn. 460b3–11 (source NOT in main corpus; use `corpus/download/G._R._T._Ross_1906_Aristotle_De_Insomniis_Translation_and_Notes.txt` or `John_Beare_trans._and_ed.__1908_*.txt` — text already extracted)

**On Memory** (4 entries):
- 449b22–23, 449b24–25, 449b25–27, 449b27–29

**Rhetoric** (4 entries):
- 1378a21–23, 1378a31–b5, 1382a21–27, 1385b11–19

---

## RESUMPTION INSTRUCTIONS (for fresh-context session)

1. Read this handoff doc to load state
2. Read memory: `MEMORY.md` + `project-diagram-prose-sync.md` + `project-diagram-future-work.md`
3. Read v7.html PASSAGES section (lines ~1605–1855) to see current state
4. Pick a batch (recommendation order: a → b → c → d):
   - **(a)** Extract the 5 remaining placeholder verbatims, replacing `****** …` blocks
   - **(b)** Verify existing entries by Bekker-range batches against PDFs
   - **(c)** Spot-check completed work
   - **(d)** Create `tmp/Dissertation/verbatim_passages.md` (running list — see schema below)
5. For Physics PDF: ignore corpus/index page numbers (proven wrong). Use empirical mapping: PDF p. 48 ≈ Bekker 212, p. 65 ≈ Bekker 223, p. 82 ≈ Bekker 234, p. 93 ≈ Bekker 240. Linear interp: 1 Bekker page ≈ 0.8 PDF pages in book IV-V range.
6. For Metaphysics PDF: same warning — index pages are wrong. Empirical: PDF p. 44 ≈ Bekker 1008, p. 70 ≈ Bekker 1026. Met Δ 20, 1022b is around PDF p. 67-69.

### verbatim_passages.md schema (when creating)

```markdown
# Verified Verbatim Passages

This document maintains a running list of all passages verified to be verbatim against source PDFs. When system-generated text includes a quotation that appears in this list, the verbatim form here is authoritative.

**Translation conventions**:
- Aristotle: J. A. Smith / Barnes Revised Oxford Translation (1984/2014)
- Heidegger BCAP: Metcalf & Tanzer (Indiana UP, 2009)
- Heidegger BT: Macquarrie & Robinson (1962)

## Aristotle — De Anima

### DA I.1, 403a25–b19
> [verbatim text]

**Source**: `corpus/rhetorical_ontology/Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf`, PDF p. [X], print p. [Y]
**Verified**: 2026-05-22

### DA II.3, 414b4–6
...
```

Use blockquote (`>`) for the verbatim. List in Bekker order within each work. Group works in chain order: DA → MA → Physics → Metaphysics → NE → On Memory → Rhetoric → De Insomniis → Heidegger BCAP.

---

## CRITICAL CAVEAT

The `corpus/index/Aristotle - Complete Works/aristotle-bekker-index.md` PDF page mappings are NOT reliable. They claim PHYS-05 (Bekker 224a-231a) is at pp. 43-50, but actual PDF p. 48-50 shows Bekker 212-213. Use empirical anchors from this handoff (Phys PDF p. 65 = Bekker 222, etc.) and binary-search from there.

Same caveat for Metaphysics: claimed META-04 at pp. 36-48 is wrong; actual META-04 (Δ) is around PDF p. 60-69.

---

**Iteration count**: HTML file is at v7 (current). Per user convention, next changes go to v8.
**LaTeX static**: v8 LaTeX file already exists at `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/option-b-iterations/Actualization of Desire Diagram — Option B v8.md` (only Cognitive Motion relabel applied so far; Motion-and-Time outer-frame restructure deferred).
