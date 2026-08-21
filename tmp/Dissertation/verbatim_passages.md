# Verified Verbatim Passages

This document maintains a running list of passages verified verbatim against source PDFs in `corpus/rhetorical_ontology/` and `corpus/download/`. When system-generated text (dissertation prose, diagram popovers, footnotes) includes a quotation that appears in this list, the verbatim form here is authoritative.

**Translation conventions**:
- Aristotle (DA, Phys., Met., MA, On Memory, Rhetoric, Sense & Sensibilia, On Colours, On Things Heard): J. A. Smith / W. D. Ross / Barnes *Revised Oxford Translation* (1984), as printed in the "My Copy" / "Clean Copy" 2014 editions in `corpus/rhetorical_ontology/`.
- Aristotle (Nicomachean Ethics): D. Ross, revised L. Brown, *Oxford World's Classics* (PDF `corpus/download/_extra_The_20Nicomachean_20Ethics.pdf`).
- Aristotle (De Insomniis): Beare/ROT translation (source: image-only PDF; one entry awaiting manual user provision — see end of file).
- Heidegger BCAP (*Basic Concepts of Aristotelian Philosophy*, GA 18): R. D. Metcalf & M. B. Tanzer (Indiana UP, 2009).
- Heidegger BT (*Being and Time*): Macquarrie & Robinson (1962).

**Page-offset reference**: `corpus/index/Aristotle - Complete Works/phase05-offset-validation.md` provides empirically validated Bekker↔PDF formulas for all 9 "My Copy" / "Clean Copy" Aristotle PDFs:

| Work | Formula |
|---|---|
| Metaphysics | `PDF ≈ (Bekker − 980) × 1.566 + 3` |
| Physics | `PDF ≈ (Bekker − 184) × 1.590 + 3` |
| Rhetoric | `PDF ≈ (Bekker − 1354) × 1.788 + 3` |
| De Anima | `PDF ≈ (Bekker − 402) × 1.576 + 3` |
| On Memory | `PDF ≈ (Bekker − 449) × 1.750 + 3` |
| Movement of Animals | `PDF ≈ (Bekker − 698) × 1.667 + 3` |

The standalone `aristotle-bekker-index.md` page numbers are **not** reliable for mid-/late-work loci; use the offset-validation formulas above.

---

## Audit summary (2026-05-22)

- **43 entries** in PASSAGES const of `actualization-chain-v7 — Option B v7.html` (incl. aliases that share text).
- **42 entries verified verbatim** against PDF source.
- **1 entry awaiting manual provision** (De Insomn. 460b3-11 — see end of file).
- **1 minor typo fixed**: PASSAGES['DA II.3, 414b4–6'] had `"at least,viz."` → corrected to `"at least, viz."`.
- **1 locus drift flagged**: PASSAGES['Phys. V.5, 229b25'] — the "name from terminus" verbatim is actually at Bekker 229a23–26 (chapter 5 opens at 229a7). Editorial note added in PASSAGES entry; recommend label correction in v7→v8.

## 2026-05-24 Comprehensive Audit

Five parallel verification agents ran ~90 sub-entries against corpus PDFs.

**Summary**:

| Status | Count |
|---|---|
| ✓ VERIFIED verbatim against PDF | ~65 |
| ⚠️ DISCREPANCY — correction needed | 8 |
| ❓ UNCERTAIN — catalog summary lacks quote text | 7 entries (23 sub-entries) |
| 📁 NO PDF AVAILABLE | 7 |

### ⚠️ Critical discrepancies — RESOLVED 2026-05-24 (user-verified)

All 8 items resolved by user manual verification 2026-05-24:

| # | Entry | Resolution |
|---|---|---|
| 1 | **Phys. III.3, 202a21–24** | ✓ User confirmed catalog quote is verbatim (partial — mid-sentence cut starting "there must be an actuality"); fuller PDF text adds "Perhaps it is necessary that" prefix. No correction needed. |
| 2 | **S&S 447b4–5** | ✓ Catalog text verbatim; Bekker locus corrected from `447b3–5` to **`447b4–5`**. Prose at §1.2 L91 footnote needs Bekker update. |
| 3 | **BT §72, H.374** | ✓ Replaced Stambaugh quote with M&R verbatim. Locus corrected from H.373/p. 425 to **H.374/p. 426**. **Prose at §1.0 L67 footnote needs replacement.** |
| 4 | **BCAP p. 119** | ✓ Catalog quote corrected with verbatim text + italics per user. Not yet deployed in prose. |
| 5 | **BCAP p. 128** | ✓ Catalog quote corrected ("through" not "from"). Two transcription typos in user-supplied text resolved 2026-05-24 ("....he distinction" → "....The distinction"; duplicated "not routine but holding-oneself-open" reduced to single occurrence). Not yet deployed in prose. |
| 6 | **BT §29, H.137** | ✓ Catalog corrected: "A mood assails us..." (capital A, no [Stimmung] insertion, no "the"s). Locus corrected H.136 → **H.137 (Eng.~p. 176)**. **Prose at §1.2 L55 footnote + §1.2 L69 footnote needs correction.** |
| 7 | **BT §32, H.150** | ✓ Catalog corrected: "In every case this interpretation is grounded in *something we have in advance*---in a *fore-having*". **Prose at §1.1 L87 footnote needs correction (add "this", add italics).** |
| 8 | **NE II.1** | ✓ Translator documented: W. D. Ross revised by J. O. Urmson (Greek: Bywater OCT 1894). "Excellence" rendering is authoritative for this Ross-Urmson revision. Full quote added to catalog. |

### ✓ Dissertation prose corrections — APPLIED 2026-05-24

- **§1.0 L67 footnote** ✓ — BT §72 Stambaugh quote replaced with M&R verbatim; locus corrected H.373→H.374 (Eng.~p. 426)
- **§1.2 L55 footnote** ✓ — BT §29 quote corrected: "the"s dropped, [Stimmung] bracket dropped, "A" capitalized, locus updated H.136 → H.137 (Eng.~p. 176)
- **§1.2 L69 footnote** — N/A (BT §29 quote not actually deployed here; earlier audit flag was incorrect — only L55 has the quote)
- **§1.1 L87 footnote** ✓ — BT §32 H.150 first sub-quote: "this" added; italics applied to "*something we have in advance*" and "*fore-having*"
- **§1.2 L91 footnote** ✓ — S&S Bekker locus updated 447b3–5 → 447b4–5
- **§1.2 L85** ✓ — Pre-existing typo "change in quality" → "change of quality" corrected

### ❓ Catalog summary entries lacking quote text

These 23 sub-entries were marked "Verified 2026-05-22" but the catalog records only Bekker ranges, not the actual quoted text — cannot round-trip verify:

- **DA II.5**: 417a14–21, 417a22–b1, 417b2–8 (3 entries) — L128
- **DA III.3**: 9 entries 427b14–429a2 — L155
- **DA III.7**: 431a8–10, 431b2–9, 431b12–13 (3 entries) — L158
- **DA III.10**: 433a13–15, 433b5–12, 433b13–25, 433b21–25 (4 entries) — L207
- **DA III.11**: 434a5–9, 434a10–11, 434a10–16 (3 entries) — L210

**Recommendation**: add actual verbatim text to these catalog entries during V1 capstone pass.

### 📁 PDFs needing acquisition (for V1)

| Source | Status |
|---|---|
| Categories (Cat. 8b25–9a13) | Not in corpus |
| NE complete (Barnes ROT 1984) | Only 5-page cover + 5-page II–III.5 excerpt; missing II.4, VI.5, VII.3, III.7 |
| GA 29/30 (FCM) | Not in corpus |
| De Insomniis (Beare 1908) | PDF in corpus is 0-page / corrupt |
| Broadie 1982 *Nature, Change, and Agency* | Confirmed not in corpus (Task #18 carryover) |
| Greek *Physics* | Already flagged Task #23 (only English Barnes ROT in corpus) |

### Notes from this audit

- **L85 of §1.2** earlier-flagged "change *in* quality" → "change *of* quality" — confirmed (DA agent verified PDF has "of"). Correction at L85 still pending in dissertation prose.
- **Phys. V.5, 229b25** locus drift correctly flagged (verbatim is at 229a23–26).
- **Met. Δ 20** has minor inserted em-dash between (1) and (2) — trivial.
- **All MA, On Memory, Rhetoric, Coope, Gibson quotes** verified verbatim.
- **All Met. archē / IX.6 / IX.8 / XII.6** verified verbatim.
- **Most BCAP / BT** quotes verified verbatim (the 4 discrepancies above are the exceptions).

---

## Dissertation walkthrough additions (2026-05-23 session)

Verified quotes from §§1.0–1.2 walkthroughs added to catalog this session:

- **DA II.5, 416b33–417a1** (NEW, §1.2 L85+L51 anchor — with discrepancy flag: existing L85 has "change *in* quality"; PDF says "change *of* quality")
- **Met. V.1 (Δ.1), 1013a7–10 + 1013a17–19** (§1.1 L53 — *archē* convention)
- **Met. IX.8, 1050b1–6** (§1.1 L53 — Burke gloss anchor)
- **Met. XII.6, 1071b6–8 + 1071b8–11** (§1.1 L53 — motion–time co-eternity)
- **Met. IX.6, 1048b22–30** (§1.1 L65 — *energeia*/*kinēsis* distinction)
- **BT §12 H.53, §18 H.84 (×2), §29 H.135–136, §32 H.150 (×2), §32 H.153, §65 H.328, §65 H.329 (×4), §72 H.373, §74 H.385–386** (§§1.0/1.1/1.2 various)
- **GA 29/30, p. 67** (§1.2 L55 — Stimmung as atmosphere; PDF cross-check pending V1)
- **Coope pp. 160, 162** (§1.1 L127 — replaces misattributed "strong reading" quote)
- **Broadie 1982** flagged ****** UNVERIFIED (not in corpus; user to supply)

**Added 2026-05-23 (§1.2 L61–L71 walkthrough)**:
- **DA III.2, 426a27–b3 + 426b8–12** (§1.2 L67 — ratio analysis footnote with quote + paraphrase)
- **DA III.7, 431a8–14** (§1.2 L119 existing + L69 proposed — "one in substrate, two in being" for perception/appetite; hedonic-tonality-internal warrant)
- **DA III.9, 432a15–17** (§1.2 L69 — kritikon/kinetikon major division, anchoring White's pairing)
- **Frede p. 282** (§1.2 L71 proposed Option B rewrite — two main functions of phantasia: synthesis/retention + applying thought)

**Added 2026-05-23 (§1.2 L75–L81 walkthrough)**:
- **Phys. III.3, 202a21–24 + 202b13–14** (§1.2 L75 footnote — agent-patient correlativity + Thebes-Athens analogy; flagged Greek-text acquisition gap for Task #23)
- **BT §18, H.84 (Eng. p. 116)** (§1.2 L81 — totality-of-involvements quote; previously verified in §1.1 walkthrough)
- **§1.2 L79 paragraph DROPPED** (meta-narrative scaffolding; substantive content redundant with L69/L77/L119)

**Added 2026-05-23 (§1.2 COMPLETION sweep: dual-trace → dual-resonance + chapter → section)**:
- **§1.2 §1.2 dual-trace → dual-resonance sweep COMPLETE** — 13 instances across L119 subsection title + L121 paragraph + L121 footnote (×2) + L133 footnote + L137 (×2) + L139 + L143 (×2) + L151 (×2); "dual residual trace" at L143 reduced to "dual resonance" (residual character implicit in resonance)
- **§1.2 chapter → section sweep COMPLETE** — 5 instances across L57 footnote (×2) + L115 footnote (×2) + L139 main (×1)
- **§1.2 L149 AI-style cleanup applied** — back-reference + "phantasia-foreshadowing landing" opening removed
- **§1.2 WALKTHROUGH COMPLETE**: all user-flagged paragraphs walked; all deferred items executed

**Added 2026-05-23 (§1.2 L121 + L149 walkthrough: first coining of resonant aisthēma + phantasia-foreshadowing closing)**:
- **BCAP p. 135** (Heidegger's *eidos* = "look" definition, with αἴσθησις connection) — applied §1.2 L121 at first coining of *resonant aisthēma*
- **§1.2 L149 concluding sentence rewritten** — "(per the dual-trace defense... §F above)" back-reference + obsolete term removed; concluding explanation expanded in-text
- **§1.2 L121 typo fixed** — "momeelementsnts" → "moments" (embedded-word artifact in existing text)

**Added 2026-05-23 (§1.2 L99–L113 walkthrough: residual kinēsis / dual-resonance development)**:
- **Aristotelis Parva Naturalia, ed. Wilhelm Biehl (Teubner, 1898), p. 68** — added §1.2 L99 footnote (Greek-source citation for *aisthēmata*; HathiTrust catalog link)
- **DA III.7, 431a8–14** flipped from "proposed" to "applied 2026-05-23" at §1.2 L113 Footnote 1 (canonical anchor for *aisthēsis*-*epithymia* one-in-substrate-two-in-being structure)
- **GA 29/30, §§42–58** structural reference (Heidegger's engagement with Uexküll's *Funktionskreis* + *Benommenheit* / *Weltbildung* distinction) — added §1.2 L105 footnote; no verbatim quote, structural-reference only
- **§1.2 L113 paragraph + Footnotes 1 & 2 corrected** — "dual-trace thesis" replaced with "dual-resonance thesis" (term migration); "faculty of X" English formulations replaced with Greek *aisthētikon* / *orektikon*; hedonic-tonality-NOT-identical-to-perceptual-aspect framing corrected; AI-style filler removed
- **§1.2 L69 footnote retroactive correction** — same dual-resonance term migration + Greek faculty-names + framework correction
- **§1.2 L101 footnote** — dual-resonance term migration + "affective-valence content" corrected to "orectic-charge content" + AI filler removed
- **§1.2 L105 main paragraph** — closing signal sentence dropped per established convention

**Added 2026-05-23 (§1.2 L85–L91 walkthrough: four-senses expansion)**:
- **BCAP p. 131** (×3 sub-quotes: sense 1 "becoming-otherwise"; sense 2 "being-there of shifting occurring-to-one"; sense 3 "blaberon/lypē/becoming-depressed") — applied §1.2 L91 enumerated Heidegger gloss
- **BCAP p. 132** (sense 4 "πάθος designates the `size,' the `measure'") — applied §1.2 L91 enumerated (4)
- **BCAP p. 134** ("tones life down") — applied §1.2 L91 enumerated (3) refinement
- **DA II.2, 413b24** ("Where there is sensation, there is also pleasure and pain") — applied §1.2 L91 perceptual-level (3) footnote
- **Sense and Sensibilia 7, 447b3–5** (stimuli efface one another; stronger alone distinctly perceptible) — applied §1.2 L91 perceptual-level (4) footnote
- **§1.2 L91 EXPANDED** from compact one-paragraph treatment to three-paragraph enumerated treatment (Heidegger four-senses gloss + progressive-narrowing + perceptual-level satisfaction); content drawn primarily from §1.4 source paragraphs L25–L34; closing signal sentence dropped per established convention

**OCR artifacts noted (pending manual verification)**:
- Gibson 2015 Classic Edition p. 46: "an arrangement ofsome sort" — missing space; likely PDF extraction artifact

**V1 discrepancy flags**:
- §1.2 L85: "change in quality" → "change of quality" (DA II.5, 416b33–417a1)
- §1.2 L57: Gibson page citation "pp. 209–210" doesn't support claim (correct support at pp. 45–46 of 2015 Classic Edition, per user verification 2026-05-23; see Gibson entries below)
- §1.0 L51 footnote: `aristotle2014soul` bib key year mismatches PDF year (1984 Smith/Barnes ROT)

---

## Aristotle — De Anima

### DA I.1, 403a25–b19
> Consequently their definitions ought to correspond, e.g. anger should be defined as a certain mode of movement of such and such a body (or part or faculty of a body) by this or that cause and for this or that end. … the affections of soul, insofar as they are such as passion and fear, are inseparable from the natural matter of animals in this way and not in the same way as a line or surface.

**Source**: `Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf`. (Full text in v7.html.) **Verified**: 2026-05-22

### DA II.3, 414b4–6
> now all animals have one sense at least, viz. touch, and whatever has a sense has the capacity for pleasure and pain and therefore has pleasant and painful objects present to it, and wherever these are present, there is desire, for desire is appetition of what is pleasant.

**Source**: PDF p. 21–22. **Verified**: 2026-05-22 (typo "least,viz." → "least, viz." corrected in PASSAGES)

### DA II.2, 413b24 *(added 2026-05-23 — §1.2 L91 footnote)*
> Where there is sensation, there is also pleasure and pain.

**Source**: `Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf`. **Verified**: 2026-05-23.

**Used at**: §1.2 L91 footnote (applied 2026-05-23 — harmful-alterations sense satisfied at perceptual level via painful sensation).

**Context (fuller quote)**: "for, where there is sensation, there is also pleasure and pain, and, where these, necessarily also desire" — the dissertation quotes the first clause only.

### DA II.5, 416b33–417a1 *(added 2026-05-23 — §1.2 walkthrough session)*
> Sensation depends, as we have said, on a process of movement or affection from without, for it is held to be some sort of change of quality.

**Source**: `Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf`, PDF p. 25 (opening of DA II.5). **Verified**: 2026-05-23.

**Used at**: §1.2 L51 (applied 2026-05-23 — aisthēsis-is-kinēsis anchor for direct application of three-factor schema); §1.2 L85 (existing — enmattered *alloiōsis* anchor).

**⚠️ Discrepancy flag (V1 target)**: Existing §1.2 L85 reads "change **in** quality" — this is a transcription error; PDF source has "change **of** quality". The L51 deployment (2026-05-23) uses verbatim "change of quality"; L85 needs correction at V1.

### DA II.5, 417a14–21, 417a22–b1, 417b2–8
Three contiguous entries spanning PDF pp. 27–28. **Verified**: 2026-05-22

**❓ 2026-05-24 AUDIT**: Catalog records only Bekker ranges, not actual quote text — cannot round-trip verify. Surrounding PDF text reads cleanly with no OCR gaps; prior 2026-05-22 verification is plausible. **Action**: add verbatim quote text to catalog during V1 capstone pass.

### DA II.5 (III.2), 426a27–b8
> If voice is a concord, and if the voice and the hearing of it are in one sense one and the same … to touch, that which is capable of being either warmed or chilled; the sense and the ratio are identical; while excess is painful or destructive.

**Source**: PDF p. 41. **Verified**: 2026-05-22. *Note: 426a/b is actually DA III.2 in standard chapter division; the diagram label "DA II.5" reflects a different sub-numbering convention.*

### DA III.2, 426a27–b3 and 426b8–12 *(added 2026-05-23 — §1.2 L67 walkthrough)*

Two sub-quotes for the ratio-analysis footnote:

**426a27–b3** (with internal ellipsis):
> If voice is a concord, and if the voice and the hearing of it are in one sense one and the same, and if concord is a ratio, hearing as well as what is heard must be a ratio. That is why the excess of either the sharp or the flat destroys the hearing.... This shows that the sense is a ratio.

**426b8–12** (generalization):
> Each sense then is relative to its particular group of sensible qualities: it is found in a sense-organ as such and discriminates the differences which exist within that group; e.g. sight discriminates white and black, taste sweet and bitter, and so in all cases.

**Source**: `Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf`, PDF p. 41. **Verified**: 2026-05-23.

**Used at**: §1.2 L67 (applied 2026-05-23 — ratio-analysis footnote with quote + paraphrase).

### DA II.12, 424a17–24
> Generally, about all perception, we can say that a sense is what has the power of receiving into itself the sensible forms of things without the matter, in the way in which a piece of wax takes on the impress of a signet-ring without the iron or gold; what produces the impression is a signet of bronze or gold, but not *qua* bronze or gold: in a similar way the sense is affected by what is coloured or flavoured or sounding not insofar as each is what it is, but insofar as it is of such and such a sort and according to its form.

**Source**: PDF p. 36 (end of chapter 12). **Verified**: 2026-05-22

### DA III.3, 427b14–15, 427b17–21, 427b21–24, 428a1–3, 428a19–24, 428b2–7, 428b10–16, 428b25–429a2, 429a1–2
Nine entries spanning the *phantasia* analysis on PDF pp. 39–44. **All verified verbatim**: 2026-05-22

**❓ 2026-05-24 AUDIT**: Catalog records only Bekker ranges for these 9 entries, not actual quote texts — cannot round-trip verify. Surrounding PDF text reads cleanly. **Action**: add 9 verbatim quote texts to catalog during V1 capstone pass.

### DA III.7, 431a8–10, 431b2–9, 431b12–13
Three entries on PDF pp. 47–48. **Verified**: 2026-05-22. *Note: 431b12–13 was extracted in this session to replace prior `???` placeholder.*

**❓ 2026-05-24 AUDIT**: Catalog records only Bekker ranges for these 3 entries, not actual quote texts — cannot round-trip verify. Surrounding PDF text reads cleanly. **Action**: add 3 verbatim quote texts to catalog during V1 capstone pass.

### DA III.7, 431a8–14 *(added 2026-05-23 — §1.2 L69 footnote support; also used at §1.2 L119)*
> To perceive then is like bare asserting or thinking; but when the object is pleasant or painful, the soul makes a sort of affirmation or negation, and pursues or avoids the object. To feel pleasure or pain is to act with the sensitive mean towards what is good or bad as such. Both avoidance and appetite when actual are identical with this: the faculty of appetite and avoidance are not different, either from one another or from the faculty of sense-perception; but their being is different.

**Source**: `Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf`, PDF p. 47. **Verified**: 2026-05-23.

**Used at**: §1.2 L119 (existing block quote — perception/appetite coordination); proposed §1.2 L69 footnote (hedonic-tonality-internal-to-aisthesis warrant via the "one in substrate, two in being" structure).

**Significance**: This passage establishes (a) that perception of a pleasant/painful object is intrinsically discriminative-and-evaluative (affirmation/negation, pursuit/avoidance); and (b) that the faculty of appetite/avoidance is "one in substrate" with the faculty of sense-perception, "two in being" only. Textual warrant for the dissertation's claim that the basic hedonic tonality is internal to *aisthēsis*'s *kritikon*, not added downstream.

### DA III.7, 431a14–17 *(added in diagram audit pass 2026-05-22)*
> To the thinking soul images serve as if they were contents of perception (and when it asserts or denies them to be good or bad it avoids or pursues them). That is why the soul never thinks without an image.

**Source**: PDF p. 47. **Verified**: 2026-05-22. Added to PASSAGES to back the inline diagram quote "the soul never thinks without an image" (A3-NOESIS bubble).

### DA III.3, 429a4–8 *(added in diagram audit pass 2 2026-05-22)*
> As sight is the most highly developed sense, the name φαντασία (imagination) has been formed from φάος (light) because it is not possible to see without light. And because imaginations remain in the organs of sense and resemble sensations, animals in their actions are largely guided by them, some (i.e. the brutes) because of the non-existence in them of thought, others (i.e. men) because of the temporary eclipse in them of thought by feeling or disease or sleep.

**Source**: PDF p. 44. **Verified**: 2026-05-22.

### DA III.10, 433a9–12 *(added in diagram audit pass 2 2026-05-22)*
> These two at all events appear to be sources of movement: appetite and thought (if one may venture to regard imagination as a kind of thinking; for many men follow their imaginations contrary to knowledge, and in all animals other than man there is no thinking or calculation but only imagination).

**Source**: PDF p. 50 (chapter 10 opening). **Verified**: 2026-05-22.

### DA III.10, 433b10–18 *(added in diagram audit pass 2026-05-22 — three-factor schema framing)*
> It follows that while that which originates movement must be specifically one, viz. the faculty of appetite as such (or rather farthest back of all the object of that faculty; for it is it that itself remaining unmoved originates the movement by being apprehended in thought or imagination), the things that originate movement are numerically many. All movement involves three factors, (1) that which originates the movement, (2) that by means of which it originates it, and (3) that which is moved. The expression 'that which originates the movement' is ambiguous: it may mean either something which itself is unmoved or that which at once moves and is moved. Here that which moves without itself being moved is the realizable good, that which at once moves and is moved is the faculty of appetite (for that which is moved is moved insofar as it desires, and appetite in the sense of actual appetite *is* a kind of movement).

**Source**: PDF p. 51. **Verified**: 2026-05-22. Added to back the kinetic-schema popovers (kineticBoxPopoverHTML, rolePopoverHTML) which cite `'DA III.10, 433b10–18'` in 5 places but had no PASSAGES entry — previously rendered "— passage not yet entered —".

### DA III.9, 432a15–17 *(added 2026-05-23 — §1.2 L69 footnote: kritikon/kinetikon division)*
> The soul of animals is characterized by two faculties, the faculty of discrimination which is the work of thought and sense, and the faculty of originating local movement.

**Source**: `Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf`, PDF p. 49 (opening of DA III.9). **Verified**: 2026-05-23.

**Used at**: §1.2 L69 footnote (applied 2026-05-23 — major division of soul's faculties, anchoring White's *to kritikon* / *to kinetikon* pairing).

### DA III.9, 432b27–433a3 *(added in diagram audit pass 2026-05-22)*
> Further, neither can the calculative faculty or what is called thought be the cause of such movement; for mind as speculative never thinks what is practicable, it never says anything about an object to be avoided or pursued, while this movement is always in something which is avoiding or pursuing an object. No, not even when it is aware of such an object does it thereby enjoin pursuit or avoidance of it; e.g. the mind often thinks of something terrifying or pleasant without enjoining the emotion of fear.

**Source**: PDF p. 50. **Verified**: 2026-05-22. Added to PASSAGES to back the inline diagram quote "never thinks what is practicable, it never says anything about an object to be avoided or pursued" (A3-SPECULATIVE bubble).

### DA III.8, 432a3–9
> Since it seems that there is nothing outside and separate in existence from sensible spatial magnitudes, the objects of thought are in the sensible forms … for images are like sensuous contents except in that they contain no matter.

**Source**: PDF p. 48. **Verified**: 2026-05-22

### DA III.10, 433a13–15, 433b5–12, 433b13–25, 433b21–25
Four entries on PDF pp. 49–50 covering the three-factor analysis of movement. **Verified**: 2026-05-22

**❓ 2026-05-24 AUDIT**: Catalog records only Bekker ranges for these 4 entries, not actual quote texts — cannot round-trip verify. Surrounding PDF text reads cleanly. **Action**: add 4 verbatim quote texts to catalog during V1 capstone pass.

### DA III.11, 434a5–9, 434a10–11, 434a10–16
Three entries on PDF pp. 50–51 covering deliberative imagination. **Verified**: 2026-05-22

**❓ 2026-05-24 AUDIT**: Catalog records only Bekker ranges for these 3 entries, not actual quote texts — cannot round-trip verify. Surrounding PDF text reads cleanly. **Action**: add 3 verbatim quote texts to catalog during V1 capstone pass.

---

## Aristotle — De Motu Animalium (Movement of Animals)

### MA 701a7–24, 701a28–b1, 701b15–32, 702a15–21, 702a17–18
Five entries on PDF pp. 7–10. **All verified verbatim**: 2026-05-22

*Note (2026-05-22 audit pass):* PASSAGES['MA 701a7–24'] was extended to remove a prior elision; the entry now includes the verbatim "whenever one thinks that every man ought to walk, and that one is a man oneself, straightaway one walks" practical-syllogism example (Bekker 701a13–15) to back the inline diagram quote in the SETTLED_DOXAI bubble.

---

## Aristotle — Physics

### Phys. II.2, 194a28–31 *(user-provided 2026-06-09 — ADA four-cause frame; final cause = the end)*
> Again, that for the sake of which, or the end, belongs to the same department of knowledge as the means. But the nature is the end or that for the sake of which. For if a thing undergoes a continuous change toward some end, that last stage is actually that for the sake of which.

**Source**: Hardie & Gaye ROT (*Physics*), per user, 2026-06-09. **Verified**: 2026-06-09 (corpus Physics PDF — text + Bekker margins; 194a28–31 confirmed).
**Used at**: ADA methodology — the *final cause* ("that for the sake of which") as the terminus of continuous change. Not yet deployed in dissertation prose.

### Phys. II.2, 194a34–b5 *(user-provided 2026-06-09 — ADA four-cause frame; using-art vs producing-art)*
> For the arts make their material (some simply make it, others make it serviceable), and we use everything as if it was there for our sake. (We also are in a sense an end. 'That for the sake of which' may be taken in two ways, as we said in our work *On Philosophy*.) The arts, therefore, which govern the matter and have knowledge are two, namely the art which uses the product and the art which directs the production of it. That is why the using art also is in a sense directive; but it differs in that it knows the form, whereas the art which is directive as being concerned with production knows the matter.

**Source**: Hardie & Gaye ROT (*Physics*), per user, 2026-06-09. **Verified**: 2026-06-09 (corpus PDF — text + Bekker margins read directly).
**Used at**: ADA methodology — the *using-art* (knows the form/end) vs the *producing-art* (knows the matter): textual anchor for the **designer↔player partition** of the four causes (designer = producing-art/matter; player = using-art/form-and-end, "in a sense directive").
**✓ Corrections applied 2026-06-09 (user-confirmed)**: "there" → "their"; parenthesis closed after "serviceable)". Text above is corrected.

### Phys. II.3, 194b24–195a3 *(user-provided 2026-06-09 — ADA four-cause frame; the four causes enumerated)*
> In one way, then, that out of which a thing comes to be and which persists, is called a cause, e.g. the bronze of the statue, the silver of the bowl, and the genera of which the bronze and the silver are species. In another way, the form or the archetype, i.e. the definition of the essence, and its genera, are called causes (e.g. of the octave the relation of 2:1, and generally number), and the parts in the definition. Again, the primary source of the change or rest; e.g. the man who deliberated is a cause, the father is a cause of the child, and generally what makes of what is made and what changes of what is changed. Again, in the sense of end or that for the sake of which a thing is done, e.g. health is the cause of walking about. ('Why is he walking about?' We say: 'To be healthy', and, having said that, we think we have assigned the cause.) The same is true also of all the intermediate steps which are brought about through the action of something else as means towards the end, e.g. reduction of flesh, purging, drugs, or surgical instruments are means towards health. All these things are for the sake of the end, though they differ from one another in that some are activities, others instruments.

**Source**: Hardie & Gaye ROT (*Physics*), per user, 2026-06-09. **Verified**: 2026-06-09 (corpus PDF — text + Bekker margins read directly).
**Used at**: ADA methodology — the canonical four-cause statement (material/formal/efficient/final); the overarching explanatory grid within which the actualization chain individuates the efficient–final slot.
**✓ Corrections applied 2026-06-09 (user-confirmed)**: stray space before comma removed; "instrument" → "instruments". **Locus II.3 confirmed** (user).
**⚠️ PDF check 2026-06-09 (user review)**: the My-Copy PDF reads "the father is **cause** of the child" (no article); the doc has "the father is **a** cause of the child" — likely an extra "a" in transcription. Recommend removing; confirm vs your copy. *(Conversely, "some are activities, others **instruments**" is PDF-confirmed — my earlier "instruments…and…actions" guess was wrong.)*

### Phys. II.3, 195a4–14 *(user-provided 2026-06-09 — ADA four-cause frame; several causes of one thing; presence/absence)*
> As things are called causes in many ways, it follows that there are several causes of the same thing (not merely accidentally), e.g. both the art of the sculptor and the bronze are causes of the statue. These are causes of the statue *qua* statue, not in virtue of anything else that it may be—only not in the same way, the one being the material cause, the other the cause whence the motion comes. Some things cause each other reciprocally, e.g. hard work causes fitness and *vice versa*, but again not in the same way, but the one as end, the other as the principle of motion. Further the same thing is the cause of contrary results. For that which by its presence brings about one result is sometimes blamed for bringing about the contrary by its absence. Thus we ascribe the wreck of a ship to the absence of the pilot whose presence was the cause of its safety.

**Source**: Hardie & Gaye ROT (*Physics*), per user, 2026-06-09. **Verified**: 2026-06-09 (corpus PDF — text + Bekker margins read directly).
**Used at**: ADA methodology — (a) "several causes of the same thing" → licenses the designer↔player multi-cause partition; (b) **reciprocal causation** ("hard work causes fitness and *vice versa* … the one as end, the other as the principle of motion") → anchor for the synchronic↔diachronic *hexis* spiral; (c) presence/absence (the absent pilot → safety lost) → model for agency-stripped de-agentialization.
**✓ Locus II.3 confirmed** 2026-06-09 (user).

### Phys. II.3, 195b4–6 *(user-provided 2026-06-09 — ADA four-cause frame; potential vs actual cause)*
> All causes, both proper and accidental, may be spoken of either as potential or as actual; e.g. the cause of a house being built is either a house-builder or a house-builder building.

**Source**: Hardie & Gaye ROT (*Physics*), per user, 2026-06-09. **Verified**: 2026-06-09 (corpus PDF — text + Bekker margins read directly). *(Adjacent to the existing "Phys. II.3, 195b21–25" entry — "a man builds because he is a builder".)*
**Used at**: ADA methodology — the potential/actual distinction in the efficient cause (house-builder vs house-builder-building) → the disposition(*hexis*)/exercise(*energeia*) distinction at the level of cause.
**✓ Locus II.3 confirmed** 2026-06-09 (user). (Opening-quote artifact was in the LaTeX paste only; the blockquote form here carries no surrounding quotation marks.)

### Phys. II.3, 195b21–25 *(added in diagram audit pass 2 2026-05-22)*
> ...this is not always true of potential causes—the house and the housebuilder do not pass away simultaneously. In investigating the cause of each thing it is always necessary to seek what is most precise (as also in other things): thus a man builds because he is a builder, and a builder builds in virtue of his art of building. This last cause then is prior; and so generally.

**Source**: PDF p. 22, print p. 334 (image-based read; PDF text layer is empty on this page). **Verified**: 2026-05-22.

### Phys. III.1, 200b12–25 *(new this session)*
> Nature is a principle of motion and change, and it is the subject of our inquiry. We must therefore see that we understand what motion is; for if it were unknown, nature too would be unknown. When we have determined the nature of motion, our task will be to attack in the same way the terms which come next in order. Now motion is supposed to belong to the class of things which are continuous; and the infinite presents itself first in the continuous—that is how it comes about that the account of the infinite is often used in definitions of the continuous; for what is infinitely divisible is continuous. Besides these, place, void, and time are thought to be necessary conditions of motion.

**Source**: PDF p. 29, print p. 342 (Book III ch. 1 opening). **Verified**: 2026-05-22

### Phys. III.1, 201a11–14
> thus the fulfilment of what is potentially, as such, is motion—e.g. the fulfilment of what is alterable, as alterable, is alteration; of what is increasable and its opposite, decreasable (there is no common name for both), increase and decrease; of what can come to be and pass away, coming to be and passing away; of what can be carried along, locomotion.

**Source**: PDF p. 30. **Verified**: 2026-05-22

### Phys. IV.11, 219b1
> For time is just this—number of motion in respect of 'before' and 'after'.

**Source**: PDF p. 60. **Verified**: 2026-05-22

### Phys. III.3, 202a21–24 and 202b13–14 *(added 2026-05-23 — §1.2 L75 footnote)*

**✓ 2026-05-24 AUDIT — VERIFIED (partial quote)**: User confirmed 2026-05-24 — catalog quote is verbatim but represents only the latter portion of the sentence. PDF full sentence: "Perhaps it is necessary that there should be an actuality of the agent and of the patient. The one is agency and the other patiency..." Catalog quote begins mid-sentence at "there must be an actuality..." — this is the latter portion. Both verbatim; catalog uses mid-sentence cut. No correction needed.

Two passages on agent/patient correlativity and the Thebes-Athens analogy:

**202a21–24** (agent-patient as two formal aspects of one motion):
> there must be an actuality of the agent and of the patient. The one is agency and the other patiency; and the outcome and end of the one is an action, that of the other a passion.

**202b13–14** (Thebes-Athens analogy):
> the road from Thebes to Athens and the road from Athens to Thebes are the same.

**Source**: `Aristotle - Physics_(2014)_[My Copy].pdf` (English: Smith/Hardie ROT). **Verified**: 2026-05-23.

**Used at**: §1.2 L75 footnote (applied 2026-05-23 — one-in-substrate-different-in-being structure at agent-patient correlativity level).

**⚠️ Greek-text gap (Task #23)**: The transliterations *poiēsis* (ποίησις) and *pathēsis* (πάθησις) for "action" and "passion" appear in dissertation prose as standard transliterations. The full Greek passage at 202a21–24 is NOT in corpus. Acquisition of a Greek *Physics* edition (Ross OCT 1936 or equivalent) is pending; only English Smith/Hardie ROT and a Greek-term glossary (`corpus/index/Aristotle - Complete Works/physics-greek.json`) are currently available.

### Phys. V.1, 224b6–8
> So we are left with a mover, a moved, and that to which the motion proceeds; for it is that to which rather than that from which the motion proceeds that gives its name to the change.

**Source**: PDF p. 67. **Verified**: 2026-05-22

### Phys. V.5, 229b25 — locus flagged *(new this session)*
> Moreover, each several motion takes its name rather from the goal than from the starting-point of change, e.g. motion to health we call convalescence, motion to disease sickening. Thus we are left with motions respectively to contraries, and motions respectively to contraries from the opposite contraries.

**Source**: PDF p. 75, print p. 387. **Verified**: 2026-05-22.

**Editorial note**: The "name from terminus" principle appears at Bekker **229a23–26**, not 229b25 (chapter 5 opens at 229a7). The diagram's `229b25` cite tag may be a label drift; verbatim is preserved as the canonical naming-principle anchor. Recommend label correction in v7→v8.

### Phys. VIII.4, 256a3 *(user-verified 2026-05-29 — §1.0 three-factor schema universal-application argument)*
> all things that are in motion must be moved by something.

**Source**: `Aristotle - Physics_(2014)_[My Copy].pdf` (English: Smith/Hardie ROT). **Verified**: 2026-05-29 (user).

**Used at**: §1.0 main text (three-factor schema's universal premise — establishing that every motion has a mover). Cited inline as "(*Physica* VIII.4, 256a3; full argument 255b31–256a3)."

### Phys. VIII.5, 256a4–6 *(user-verified 2026-05-29 — §1.0 three-factor schema universal-application argument)*
> Now this may come about in either of two ways, either not because of the mover itself, but because of something else which moves the mover, or because of the mover itself.

**Source**: `Aristotle - Physics_(2014)_[My Copy].pdf` (English: Smith/Hardie ROT). **Verified**: 2026-05-29 (user).

**Used at**: §1.0 main text (three-factor schema's two-role specification — the moved mover / unmoved originator distinction). The first disjunct ("not because of the mover itself…") names the moved mover; the second ("because of the mover itself") names the unmoved originator. Pairs structurally with VIII.4, 256a3 in establishing the universal three-role analysis of mediated motion.

---

## Aristotle — Metaphysics

### Met. I.3 (A.3), 983a24–32 *(user-provided 2026-06-09 — ADA four-cause frame; the four causes)*
> Evidently we have to acquire knowledge of the original causes (for we say we know each thing only when we think we recognize its first cause), and causes are spoken of in four senses. In one of these we mean the substance, i.e. the essence (for the 'why' is referred finally to the formula, and the ultimate 'why' is a cause and principle); in another the matter or substratum, in a third the source of the change, and in a fourth the cause opposed to this, that for the sake of which and the good (for this is the end of all generation and change).

**Source**: Ross ROT (*Metaphysics*), per user, 2026-06-09. **Verified**: 2026-06-09 (corpus PDF — text + Bekker margins read directly).
**Used at**: ADA methodology — Aristotle's own four-cause enumeration (formal/essence · material/substratum · efficient/source-of-change · final/that-for-the-sake-of-which-and-the-good); canonical cross-witness to *Physics* II.3 for the four-cause frame. No transcription issues spotted.

### Met. Δ 20, 1022b4 *(new this session)*
> We call a having (1) a kind of activity of the haver and the had—something like an action or movement. When one thing makes and one is made, between them there is a making; so too between him who has a garment and the garment which he has there is a having. This sort of having, then, evidently we cannot have; for the process will go on to infinity, if we can have the having of what we have.—(2) 'Having' means a disposition according to which that which is disposed is either well or ill disposed, either in itself or with reference to something else, e.g. health is a having; for it is such a disposition.—(3) We speak of a having if there is a portion of such a disposition; therefore the excellence of the parts is a having.

**Source**: PDF p. 65, print p. 1614 (chapter 20 of Book V/Δ). **Verified**: 2026-05-22

### Met. V.1 (Δ.1), 1013a7–10 and 1013a17–19 *(verified during §1.1 walkthrough 2026-05-22; added to catalog 2026-05-23)*

Two sub-quotes from Aristotle's six-senses analysis of *archē*:

**1013a7–10** (sense 4 — productive source):
> That from which (not as an immanent part) a thing first arises, and from which the movement or the change naturally first proceeds, as a child comes from the father and the mother, and a fight from abusive language.

**1013a17–19** (Aristotle's summary):
> It is common, then, to all to be the first point from which a thing either is or comes to be or is known.

**Source**: `Aristotle - Metaphysics_(2014)_[My Copy].pdf`. **Verified**: 2026-05-22.

**Used at**: §1.1 L53 footnote (*archē* convention anchor — chain-relevant sense 4: "the productive source from which the next motion proceeds").

### Met. IX.8, 1050b1–6 *(verified during §1.1 walkthrough 2026-05-22; added to catalog 2026-05-23)*
> Obviously, therefore, the substance or form is actuality. From this argument it is obvious that actuality is prior in substance to potentiality; and as we have said, one actuality always precedes another in time right back to the actuality of the eternal prime mover.

**Source**: `Aristotle - Metaphysics_(2014)_[My Copy].pdf`. **Verified**: 2026-05-22.

**Used at**: §1.1 L53 footnote (Burke gloss anchor — Burke quote "one actuality always precedes another in time right back to the actuality of the eternal prime mover" identified as near-verbatim of this passage).

### Met. XII.6, 1071b6–8 and 1071b8–11 *(verified during §1.1 walkthrough 2026-05-22; added to catalog 2026-05-23)*

Two sub-quotes establishing motion–time co-eternity:

**1071b6–8**:
> it is impossible that movement should either come into being or cease to be; for it must always have existed.

**1071b8–11**:
> nor can time come into being or cease to be; for there could not be a before and an after if time did not exist. Movement also is continuous, then, in the sense in which time is; for time is either the same thing as movement or an attribute of movement.

**Source**: `Aristotle - Metaphysics_(2014)_[My Copy].pdf`. **Verified**: 2026-05-22.

**Used at**: §1.1 L53 main text (motion–time co-eternity in defense of A_0 as limit-case actuality without prior).

### Met. XII.7, 1072a21–29 *(user-verified 2026-05-29 — §1.0 three-factor schema cosmological-to-psychological bridge)*
> There is, then, something which is always moved with an unceasing motion, which is motion in a circle; and this is plain not in theory only but in fact. Therefore the first heavens must be eternal. There is therefore also something which moves them. And since that which is moved and moves is intermediate, there is a mover which moves without being moved, being eternal, substance, and actuality. And the object of desire and the object of thought move in this way: they move without being moved. The primary objects of desire and of thought are the same. For the apparent good is the object of appetite, and the real good is the primary object of wish. But desire is consequent on opinion rather than opinion on desire: for the thinking is the starting-point.

**Source**: `Aristotle - Metaphysics_(2014)_[My Copy].pdf` (English: ROT). **Verified**: 2026-05-29 (user).

**Used at**: §1.0 main text (cosmological-to-psychological bridge — extending the unmoved-mover structure beyond the Prime Mover to *objects of desire* and *objects of thought*; licenses the relative-unmoved-mover relativization deployed at every stage of the actualization chain). The decisive line for the §1.0 argument: "And the object of desire and the object of thought move in this way: they move without being moved" — establishes that the three-role structure of *Physica* VIII.5 applies in the same structural sense at the appetitive-cognitive level as at the cosmological level.

### Met. IX.6, 1048b18–34 — the full *energeia*/*kinēsis* passage *(full text user-supplied 2026-06-09, copied directly; subsumes the former sub-quote entry b22–30 and the b30–34 "tense-test" entry below)*
> Since of the actions which have a limit none is an end but all are relative to the end, e.g. the process of making thin is of this sort, and the things themselves when one is making them thin are in movement in this way (i.e. without being already that at which the movement aims), this is not an action or at least not a complete one (for it is not an end); but that in which the end is present is an action. E.g. at the same time we are seeing and have seen, are understanding and have understood, are thinking and have thought: but it is not true that at the same time we are learning and have learnt, or are being cured and have been cured. At the same time we are living well and have lived well, and are happy and have been happy. If not, the process would have had sometime to cease, as the process of making thin ceases: but, as it is, it does not cease; we are living and have lived. Of these processes, then, we must call the one set movements, and the other actualities. For every movement is incomplete — making thin, learning, walking, building; these are movements, and incomplete movements. For it is not true that at the same time we are walking and have walked, or are building and have built, or are coming to be and have come to be — it is a different thing that is being moved and that has been moved, and that is moving and that has moved; but it is the same thing that at the same time has seen and is seeing, or is thinking and has thought. The latter sort of process, then, I call an actuality, and the former a movement.

**Source**: Ross ROT (*Metaphysics*); **user-supplied full text 2026-06-09 (direct copy — no verification pass needed per user)**. Component sub-ranges previously PDF-verified against `Aristotle - Metaphysics_(2014)_[My Copy].pdf`: b23–25 / b25–27 / b28–30 (2026-05-22) and b30–34 (2026-05-26).
**Used at**: **§1.1 L65** (the *energeia atelēs* pairing — sub-ranges b23–30); **§1.5 §6 note-8b** (the tense-test / D4 homology *praxis*:*poiēsis* :: *energeia*:*kinēsis* — sub-range b30–34); **ADA methodology §2.1** (the ontological frame — *kinēsis* [telos external, self-canceling] vs *energeia*-narrow [telos internal, self-sustaining]; the locus classicus, referenced directly).
**Sub-ranges (for cite-tags that reference them)**: b23–25 "seeing and have seen…"; b25–27 "learning and have learnt…"; b28–30 "every movement is incomplete…"; b30–34 "walking and have walked … I call an actuality, and the former a movement."

---

## Aristotle — Nicomachean Ethics

### Cat. 8, 8b25–9a13 *(user-provided 2026-05-22)*
> By a *quality* I mean that in virtue of which things are said to be qualified somehow. But quality is one of the things spoken of in a number of ways.
>
> One kind of quality let us call *states* and *conditions*. A state differs from a condition in being more stable and lasting longer. Such are the branches of knowledge and the virtues. For knowledge seems to be something permanent and hard to change if one has even a moderate grasp of a branch of knowledge, unless a great change is brought about by illness or some other such thing. So also virtue; justice, temperance, and the rest seem to be not easily changed. It is what are easily changed and quickly changing that we call conditions, e.g. hotness and chill and sickness and health and the like. For a man is in a certain condition in virtue of these but he changes quickly from hot to cold and from being healthy to being sick. Similarly with the rest, unless indeed even one of these were eventually to become through length of time part of a man's nature and irremediable or exceedingly hard to change—and then one would perhaps call this a state. It is obvious that by a state people do mean what is more lasting and harder to change. For those who lack full mastery of a branch of knowledge and are easily changed are not said to be in a state of knowledge, though they are of course in some condition, a better or a worse, in regard to that knowledge. Thus a state differs from a condition in that the one is easily changed while the other lasts longer and is harder to change.
>
> States are also conditions but conditions are not necessarily states. For people in a state are, in virtue of this, also in some condition, but people in a condition are not in every case also in a state.

**Source**: Barnes ROT (J. L. Ackrill translation), per user, 2026-05-22. The categorial definition of *hexis* (= "state") vs. *diathesis* (= "condition") within the genus of quality — Aristotle's foundational distinction between long-lasting, hard-to-change dispositions (knowledge, virtue) and transient, easily-altered ones (heat, sickness). Open-ended cite alias `Cat. 8b27ff` retargets to this entry.

### NE II.1, 1103a14–b25 *(user-provided 2026-05-22; translator + edition confirmed 2026-05-24)*

**✓ 2026-05-24 AUDIT — VERIFIED + TRANSLATOR DOCUMENTED**: User confirmed 2026-05-24 — translator is **W. D. Ross revised by J. O. Urmson** (Greek original: I. Bywater, OCT, Oxford, 1894). The Ross-Urmson revision uses "excellence" where the original Ross translation uses "virtue" — the Q-017 5-page Perplexity excerpt PDF in corpus is the earlier unrevised Ross. Available NE PDF in corpus is not the Ross-Urmson revision; user has authoritative print copy.

Full verbatim per user (verified 2026-05-24):

> Excellence, then, being of two kinds, intellectual and moral, intellectual excellence in the main owes both its birth and its growth to teaching (for which reason it requires experience and time), while moral excellence comes about as a result of habit, whence also its name is one that is formed by a slight variation from the word for 'habit'. From this it is also plain that none of the moral excellences arises in us by nature; for nothing that exists by nature can form a habit contrary to its nature. For instance the stone which by nature moves downwards cannot be habituated to move upwards, not even if one tries to train it by throwing it up ten thousand times; nor can fire be habituated to move downwards, nor can anything else that by nature behaves in one way be trained to behave in another. Neither by nature, then, nor contrary to nature do excellences arise in us; rather we are adapted by nature to receive them, and are made perfect by habit.
> Excellence, then, being of two kinds, intellectual and moral, intellectual excellence in the main owes both its birth and its growth to teaching (for which reason it requires experience and time), while moral excellence comes about as a result of habit, whence also its name is one that is formed by a slight variation from the word for 'habit'. From this it is also plain that none of the moral excellences arises in us by nature; for nothing that exists by nature can form a habit contrary to its nature. For instance the stone which by nature moves downwards cannot be habituated to move upwards, not even if one tries to train it by throwing it up ten thousand times; nor can fire be habituated to move downwards, nor can anything else that by nature behaves in one way be trained to behave in another. Neither by nature, then, nor contrary to nature do excellences arise in us; rather we are adapted by nature to receive them, and are made perfect by habit.

**Source**: Barnes ROT (W. D. Ross translation), per user, 2026-05-22. Sub-range alias `NE II.1, 1103a16–b2` points to same entry.

### NE III.1, 1110a1–4 *(user-provided 2026-07-01 — bia / the involuntary; forced-motion criterion)*
> Those things, then, are thought involuntary, which take place under compulsion or owing to ignorance; and that is compulsory of which the moving principle is outside, being a principle in which nothing is contributed by the person who acts or is acted upon, e.g. if he were to be carried somewhere by a wind, or by men who had him in their power.

**Greek** (I. Bywater, OCT, Oxford, 1894; 1110a1–2): δοκεῖ δ᾽ ἀκούσια εἶναι τὰ βίᾳ ἢ δι᾽ ἄγνοιαν γινόμενα· βίαιον δέ ἐστιν ᾧ ἡ ἀρχὴ ἔξωθεν, τοιαύτη οὖσα ᾗ μηδὲν συμβάλλεται ὁ πράττων.

**Source**: English — W. D. Ross rev. J. O. Urmson (per the NE II.1 translator note above); Greek — I. Bywater, OCT, Oxford, 1894. **Provided by user 2026-07-01.**
**Used at**: Part II §2 (L233) — footnote defining *bia* / forced motion; "the moving principle is outside … nothing is contributed by the [agent]" is the criterion for cinematic/soft/suffered *bia*. Complements the *Rhetoric* I.10 compulsion definition ("contrary to the desire or reason of the agents themselves").
**⚠ Locus corrected 2026-07-01**: user-supplied English cite "III.1, 1109a35–b4" → **1110a1–4** (1109a35–b4 falls in II.9; III.1 opens at 1109b30; the compulsion passage is 1110a1–4); Greek 1110a1–2 as user-labelled.

### NE VII.3, 1147a25–b3 *(user-provided 2026-05-22)*
> Again, we may also view the cause as follows with reference to the facts of nature. The one opinion is universal, the other is concerned with the particular facts, and here we come to something within the sphere of perception; when a single opinion results from the two, the soul must in one type of case affirm the conclusion, while in the case of opinions concerned with production it must immediately act (e.g. if everything sweet ought to be tasted, and this is sweet, in the sense of being one of the particular sweet things, the man who can act and is not restrained must at the same time actually act accordingly). When, then, the universal opinion is present in us restraining us from tasting, and there is also the opinion that everything sweet is pleasant, and that this is sweet (now this is the opinion that is active), and when appetite happens to be present in us, the one opinion bids us avoid the object, but appetite leads us towards it (for it can move each of our bodily parts); so that it turns out that a man behaves incontinently under the influence (in a sense) of reason and opinion, and of opinion not contrary in itself, but only incidentally—for the appetite is contrary not the opinion—to right reason. It also follows that this is the reason why the lower animals are not incontinent, viz. because they have no universal beliefs but only imagination and memory of particulars.
>
> The explanation of how the ignorance is dissolved and the incontinent man regains his knowledge, is the same as in the case of the man drunk or asleep and is not peculiar to this condition; we must go to the students of natural science for it.

**Source**: Barnes ROT (W. D. Ross translation), per user, 2026-05-22. The "everything sweet" akrasia passage — Aristotle's canonical practical-syllogism example with universal/particular opinion + opposing appetite. Cited by the `settled-doxai-to-m23` arrow alongside NE VI.5 and Phys. II.3.

### NE III.7, 1115b 7–13 *(user-provided 2026-05-22)*
> What is terrible is not the same for all men; but we say there are things terrible even beyond human strength. These, then, are terrible to every one—at least to every sensible man; but the terrible things that are not *not* beyond human strength differ in magnitude and degree, and so too do the things that inspire confidence. Now the brave man is as dauntless as man may be. Therefore, while he will fear even the things that are not beyond human strength, he will fear them as he ought and as reason directs, and he will face them for the sake of what is noble; for this is the end of excellence.

**Source**: Barnes ROT (W. D. Ross translation), per user, 2026-05-22. The courage passage cited by the `praxis-to-m23-doxa-gate` arrow (Type 3 chain — praxis-hexis modulates which *pathē* emerge at the doxa-gate, e.g. the courageous person's regulated, action-prepared fear).

*Note on transcription*: the phrase "the terrible things that are not *not* beyond human strength" preserves the user-provided text exactly (the doubled "not" with italic emphasis is as supplied — could be an emphasis convention or a transcription mark from the source).

### NE VI.5, 1140a24–b30 *(user-provided 2026-05-22)*
> Regarding *practical wisdom* we shall get at the truth by considering who are the persons we credit with it. Now it is thought to be a mark of a man of practical wisdom to be able to deliberate well about what is good and expedient for himself, not in some particular respect, e.g. about what sorts of thing conduce to health or to strength, but about what sorts of thing conduce to the good life in general. This is shown by the fact that we credit men with practical wisdom in some particular respect when they have calculated well with a view to some good end which is one of those that are not the object of any art. Thus in general the man who is capable of deliberating has practical wisdom. Now no one deliberates about things that cannot be otherwise nor about things that it is impossible for him to do. Therefore, since knowledge involves demonstration, but there is no demonstration of things whose first principles can be otherwise (for all such things might actually be otherwise), and since it is impossible to deliberate about things that are of necessity, practical wisdom cannot be knowledge nor art; not knowledge because that which can be done is capable of being otherwise, not art because action and making are different kinds of thing. It remains, then, that it is a true and reasoned state of capacity to act with regard to the things that are good or bad for man. For while making has an end other than itself, action cannot; for good action itself is its end. It is for this reason that we think Pericles and men like him have practical wisdom, viz. because they can see what is good for themselves and what is good for men in general; we consider that those can do this who are good at managing households or states. (This is why we call temperance by this name; we imply that it preserves one's practical wisdom.) Now what it preserves is a belief of the kind we have described. For it is not any and every belief that pleasant and painful objects destroy and pervert, e.g. the belief that the triangle has or has not its angles equal to two right angles, but only beliefs about what is to be done. For the principles of the things that are done consist in that for the sake of which they are to be done; but the man who has been ruined by pleasure or pain forthwith fails to see any such principle—to see that for the sake of this or because of this he ought to choose and do whatever he chooses and does; for vice is destructive of the principle.)
>
> Practical wisdom, then, must be a reasoned and true state of capacity to act with regard to human goods. But further, while there is such a thing as excellence in art, there is no such thing as excellence in practical wisdom; and in art he who errs willingly is preferable, but in practical wisdom, as in the excellences he is the reverse. Plainly, then, practical wisdom is an excellence and not an art. There being two parts of the soul that possess reason, it must be the excellence of one of the two, i.e. of that part which forms opinions; for opinion is about what can be otherwise, and so is practical wisdom. But yet it is not only a reasoned state; this is shown by the fact that a state of that sort may be forgotten but practical wisdom cannot.

**Source**: Barnes ROT (W. D. Ross translation), per user, 2026-05-22. The definition of *phronesis* as "a true and reasoned state of capacity to act with regard to things that are good or bad for man." Used in the diagram to support the load-bearing claim that standing hexeis function as universal premises in the practical syllogism. Chapter-level alias `NE VI.5` retargets to this entry.

### NE VII.3, 1147a14–24 *(user-provided 2026-05-22)*
> But now this is just the condition of men under the influence of passions; for outbursts of anger and sexual appetites and some other such passions, it is evident, actually alter our bodily condition, and in some men even produce fits of madness. It is plain, then, that incontinent people must be said to be in a similar condition to these. The fact that men use the language that flows from knowledge proves nothing; for even men under the influence of these passions utter scientific proofs and verses of Empedocles, and those who have just begun to learn can string together words, but do not yet know; for it has to become part of themselves, and that takes time; so that we must suppose that the use of language by men in an incontinent state means no more than its utterance by actors on the stage.

**Source**: Barnes ROT (W. D. Ross translation), per user, 2026-05-22. The akrasia passage on bodily-condition effects of passion — incontinent agents "have" but cannot "use" knowledge.

### NE II.4, 1105a17–b13 *(user-provided 2026-05-22; range expanded from 1105a17–26)*
> The question might be asked, what we mean by saying that we must become just by doing just acts, and temperate by doing temperate acts; for if men do just and temperate acts, they are already just and temperate, exactly as, if they do what is grammatical or musical they are proficient in grammar and music.
>
> Or is this not true even of the arts? It is possible to do something grammatical either by chance or under the guidance of another. A man will be proficient in grammar, then, only when he has both done something grammatical and done it grammatically; and this means doing it in accordance with the grammatical knowledge in himself.
>
> Again, the case of the arts and that of the excellences are not similar; for the products of the arts have their goodness in themselves, so that it is enough that they should have a certain character, but if the acts that are in accordance with the excellences have themselves a certain character it does not follow that they are done justly or temperately. The agent also must be in a certain condition when he does them; in the first place he must have knowledge, secondly he must choose the acts, and choose them for their own sakes, and thirdly his action must proceed from a firm and unchangeable character. These are not reckoned in as conditions of the possession of the arts, except the bare knowledge; but as a condition of the possession of the excellences, knowledge has little or no weight, while the other conditions count not for a little but for everything, i.e. the very conditions which result from often doing just and temperate acts.
>
> Actions, then, are called just and temperate when they are such as the just or the temperate man would do; but it is not the man who does these that is just and temperate, but the man who also does them *as* just and temperate men do them. It is well said, then, that it is by doing just acts that the just man is produced, and by doing temperate acts the temperate man; without doing these no one would have even a prospect of becoming good.

**Source**: Barnes ROT (using "excellences" rather than the Oxford World's Classics "virtues"; "proficient in grammar" rather than "grammarians"), per user, 2026-05-22.

**Changes applied to v7.html**:
- New canonical key `'NE II.4, 1105a17–b13'` replaces prior `'NE B 4, 1105a 22'` entry (which used Heidegger's "B 4" chapter-tag and a shorter 1105a17–26 range).
- Legacy alias `'NE B 4, 1105a 22'` retargeted to the new key for backward compatibility with any cite-strings still in that form.
- Sub-range alias `'NE II.4, 1105a17–b9'` also points to the new entry.
- All diagram cite labels updated globally: `NE B 4, 1105a 22` → `NE II.4, 1105a17–b13` in passages[] arrays and inline cite strings.

**Editorial note**: Heidegger BCAP §17 (p. 127, fn. 229) cites this passage as "Eth. Nic. B 3, 1105 a 22 sqq." — chapter-division convention difference (Heidegger's "B 3" = standard modern "B 4").

### NE X.7, 1177b17–26 *(user-provided 2026-06-20; manual transcription from user's own NE edition, verbatim per user)*
> the activity of intellect, which is contemplative, seems both to be superior in worth and to aim at no end beyond itself, and to have its pleasure proper to itself (and this augments the activity), and the self-sufficiency, leisureliness, unweariedness (so far as this is possible for man), and all the other attributes ascribed to the blessed man are evidently those connected with this activity, it follows that this will be the complete happiness of man, if it be allowed a complete term of life (for none of the attributes of happiness is *in*complete).

**Source**: transcribed manually by the user from their own *Nicomachean Ethics* edition; **verbatim per user (2026-06-20)**. Reads as the Ross translation (ROT/OWC family — "superior in worth," "the blessed man," "complete happiness of man"); specific edition to confirm at V1. User's emphasis on *in*complete preserved; closing parenthesis restored from a transcription slip.

**Used at**: §08 Synthesis conclusion (Section 6 Live, L288) — fragments deployed inline ("superior in worth," "to aim at no end beyond itself," "its pleasure proper to itself," self-sufficient / unwearied, "the complete happiness of man"). *Theōria* is introduced (paraphrase, no quote) at §01-A₄ L184; full development flagged for the *phantasia* / *nous* section.

---

## Aristotle — On Memory

### On Memory 449b22–23, 449b24–25, 449b25–27, 449b27–29
Four contiguous entries on PDF pp. 3–4. **All verified verbatim**: 2026-05-22

---

## Aristotle — Sense and Sensibilia

### Sense and Sensibilia 7, 447b4–5 *(added 2026-05-23 — §1.2 L91 footnote; Bekker locus corrected 2026-05-24)*

**✓ 2026-05-24 AUDIT — VERIFIED (locus corrected)**: User confirmed 2026-05-24 — catalog quote is verbatim. Bekker locus corrected from `447b3–5` to **`447b4–5`**. Prose at §1.2 L91 footnote also needs Bekker locus correction.
> For we must suppose that the stimuli, when equal, tend alike to efface one another, since no one stimulus results from them; while, if they are unequal, the stronger alone is distinctly perceptible.

**Source**: `Aristotle - Sense And Sensibilia_(2014)_[Clean Copy].pdf`. **Verified**: 2026-05-23.

**Used at**: §1.2 L91 footnote (applied 2026-05-23 — magnitude-structure at perceptual level, supporting four-senses-of-pathos (4) magnitudes).

**Note on Bekker locus**: §1.4 source cited as `447b4–5`; PDF marginal numbers place it at 447b3–5. The b5 line endpoint matches "distinctly perceptible"; the b3 starting point matches "For we must suppose". Catalogued range adjusted to 447b3–5 to match PDF.

## Aristotle — Rhetoric

### Rhetoric I.10, 1369a32–b29 — the per-cause definitions + the good/pleasant summing-up *(2026-06-09; PDF-verified vs Clean Copy)*
> The things that happen by chance are all those whose cause cannot be determined, that have no purpose, and that happen neither always nor for the most part nor in any fixed way. The definition of chance shows just what they are. Those things happen by nature which have a fixed and internal cause; they take place uniformly, either always or for the most part. There is no need to discuss in exact detail the things that happen contrary to nature, nor to ask whether they happen in some sense naturally or from some other cause; it would seem that chance is indeed the cause of such events. Those things happen through compulsion which take place contrary to the desire or reason of the agents themselves. Acts are done from habit which men do because they have often done them before. Actions are due to reasoning when, in view of any of the goods already mentioned, they appear useful either as ends or as contributing to an end, and are performed for that reason—for intemperate men too perform a certain number of useful actions, but because they are pleasant and not because they are useful. To passion and anger are due all acts of revenge. Revenge and punishment are different things. Punishment is inflicted for the sake of the person punished; revenge for that of the punisher, to satisfy his feelings. (What anger is will be made clear when we come to discuss the emotions.) Appetite is the cause of all actions that appear pleasant. Things familiar and things habitual belong to the class of pleasant things; for there are many actions not naturally pleasant which men perform with pleasure, once they have become used to them. To sum up then, all actions due to ourselves either are or seem to be either good or pleasant. Moreover, as all actions due to ourselves are done voluntarily and actions not due to ourselves are done involuntarily, it follows that all voluntary actions must either be or seem to be either good or pleasant; for I reckon among goods escape from evils or apparent evils and the exchange of a greater evil for a less (since these things are in a sense desirable), and likewise I count among pleasures escape from painful or apparently painful things and the exchange of a greater pain for a less.

**Source**: Roberts ROT, `corpus/rhetorical_ontology/Aristotle - Rhetoric_(2014)_[Clean Copy].pdf` (PDF p. 28–30; Bekker margins read directly). **Verified**: 2026-06-09 (PDF — passage runs **1369a32 → 1369b29**; per-cause definitions begin at 1369a32; the good/pleasant summing-up sits at ~1369b15–29).
**Used at**: ADA methodology — **Aristotle's operational definitions of each cause** = the Step-4 diagnostic criteria. Load-bearing: *compulsion = "contrary to the desire or reason of the agents themselves"* (the *bia*/forced-cutscene criterion); *chance = "cause cannot be determined … no fixed way"* (a criterion in-game RNG **fails**, being an authored distribution → designed chance = *technē* masked as *tychē*); *reasoning = useful "either as ends or as contributing to an end"* (the end/means split → *boulēsis*/*prohairesis*); the reduction of all voluntary action to *good-or-pleasant* (= the *orekton*).
**✓ 2026-06-09 — dittography removed (PDF)**: the Clean Copy reads "…contrary to nature, nor to ask whether they happen in some sense naturally or from some other cause" (1369b ~3–5); the duplicated "nor to ask whether they happen contrary to nature," in the original paste has been deleted above. *(OCR note: the pdftotext extraction garbles "they appear useful" / "performed for that reason" / "I reckon"; the PDF's printed text is correct — no change needed.)*
**✓ Consolidation 2026-06-09**: this is the **full passage** and **subsumes the former "1369a16–29" entry** (in the 2026-05-31 cluster below, now a pointer — that tail text actually sits at ~1369b15–29). The first six per-cause definitions are unique to this entry. **Related I.10 entries** (1368b33–1369a4 *orexis*-division; 1369a5–6 seven causes) are in the 2026-05-31 cluster below. **Greek pending** (Kassel ≈ p. 49–50).

### Rhetoric I.11, 1369b34–1370a5 *(user-provided 2026-06-09 — ADA hedonic register; pleasure as movement to the natural state)*
> We may lay it down that pleasure is a movement, a movement by which the soul as a whole is consciously brought into its normal state of being; and that pain is the opposite. If this is what pleasure is, it is clear that the pleasant is what tends to produce this condition, while that which tends to destroy it, or to cause the soul to be brought into the opposite state, is painful. It must therefore be pleasant for the most part to move towards a natural state of being, particularly when a natural process has achieved the complete recovery of that natural state.

**Source**: Roberts ROT (*Rhetoric*), per user, 2026-06-09. **Verified**: 2026-06-09 (corpus PDF — text + Bekker margins read directly).
**Used at**: ADA methodology — the *Rhetoric*'s restoration-model of pleasure (pleasure = a *kinēsis* of the soul toward its natural state); grounds the hedonic tonality at A₁ (*resonant epithymia*) and appetitive reward-loop design. **Tension to flag**: stands against *NE* X.4 (pleasure as *energeia* completing an activity, **not** a process) — the *energeia*/*kinēsis* distinction recurs at the level of pleasure (restorative-appetitive = *kinēsis*; pleasure internal to complete activity = *energeia*), bearing on the two-compulsions analysis.

### Rhetoric II.1, 1378a21–23; II.2, 1378a31–b5; II.5, 1382a21–27; II.8, 1385b11–19
Four entries on PDF pp. 46, 53, 59. **All verified verbatim**: 2026-05-22

---

## Heidegger — Basic Concepts of Aristotelian Philosophy (GA 18)

### GA 18 §17, pp. 119, 125, 127–128 (four-anchor verbatim) *(new this session)*

**✓ 2026-05-24 AUDIT — CORRECTED**: User confirmed 2026-05-24 — p. 119 + p. 128 sub-quotes corrected to PDF-verbatim text below. pp. 125 and 127 verified verbatim already. p. 128 has two apparent transcription typos in user-supplied text (flagged in entry below for re-confirmation). Not yet deployed in §§1.0–1.2 prose (added to catalog only during 2026-05-22 diagram audit).

**p. 119** *(closing of §17 introduction to ἕξις) — corrected 2026-05-24*:
> Ἕξις is the *determination of the genuineness of being-there in a moment of being-composed as to something*: the various ἕξεις as the various modes of being able to be composed. Ἕξις is, in an entirely fundamental way, the being-determination of genuine being, here in relation to human πρᾶξις. Πρᾶξις is characterized through ἀρετή, and ἀρετή is characterized as ἕξις προαιρετική. Πρᾶξις, as the how of being-in-the-world, appears here as the being-context that we can also designate in another sense as *existence*. Being-composed is not something optional and indeterminate, for in ἕξις lies the primary orientation toward the καιρός: "I am there, come what may!" This being-there, being-on-the-alert in one's situation, in relation to its matter, characterizes ἕξις. Ἕξις is, therefore, a being-possibility that is *related in itself to another possibility*, to the possibility of my being, *that within my being something comes over me, which brings me out of composure*.

**p. 125** *(subsection γ. ἕξις and ἀρετή — hexis as how-of-pathos)*:
> Ἕξις is nothing other than a how of πάθος, being-out-of-composure, in relation to being-composed-as-to . . . Insofar as we can define ἕξις according to its basic structure, we will also clarify the possible-structure of πάθη.

**p. 127** *(the γραμματικός and reduction of deliberation through training)*:
> Aristotle speaks of the γραμματικός. He says: one can write correctly, at first by chance or with outside help. But whoever writes by chance cannot simply write. He must write in the way demanded by τέχνη. He must write, not by chance, but according to a prescription; and without outside help, but he must be able to write from out of himself. Through practice, by frequently-undergoing, it comes about that being-oriented puts the prescription further and further out of play. Training has the precise sense of reducing deliberation insofar as it is through training that the completedness of attaining a result comes about.

**p. 128** *(πρᾶξις-hexis as holding-oneself-open, not routine) — corrected 2026-05-24*:
> Cultivating ἕξις never depends on an operation, a routine. In an operation, the moment is destroyed. Every completedness, as settled routine, breaks down in the face of the moment. Appropriation and cultivation of ἕξις through habituation means nothing other than correct repetition.... The distinction lies in the fact that πρᾶξις depends on the *how*. The how is only appropriated in such a way that the human being enables himself *to be composed at each moment*; not routine but holding-oneself-open, δύναμις in the μεσότης.

**✓ Typos resolved 2026-05-24**: "....he distinction" → "....The distinction" (missing leading T); duplicated phrase "not routine but holding-oneself-open" reduced to single occurrence (per user confirmation 2026-05-24).

**Source**: `Heidegger, Martin - Basic Concepts of Aristotelian Philosophy_(2009)_[Clean Copy].pdf`, PDF pp. 134, 140, 142, 143 (offset +15 from print pages, confirmed via `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-structured/manifest.json`). **Verified**: 2026-05-22

### GA 18, p. 131 *(added 2026-05-23 — §1.2 L91 four-senses expansion)*

Three sub-quotes from Heidegger's gloss on Aristotle's *Metaphysics* Δ.21 fourfold of πάθος:

**p. 131 (sense 1 — broadest):**
> characterizes a being as something that can in some way be affected by something. Something can *happen* to such a being.

> becoming-otherwise.

**p. 131 (sense 2 — energeiai of alterations):**
> the `being-there' of such a shifting occurring-to-one.

**p. 131 (sense 3 — narrowing to harmful/lypē/attunement):**
> as the occurring-to-one that has the character of the unpleasant, of the βλαβερόν. That which happens to me is harmful to me in its happening. This is, indeed, the way that we use the expression `to happen.' But πάθος is defined still more precisely: harmfulness is related mostly to λύπη, so that, as a result, *my attunement to this occurring affects me*. It is a becoming-relevant of something, which aims at my attunement, a becoming-otherwise in the sense of becoming-depressed.

**Source**: `Heidegger, Martin - Basic Concepts of Aristotelian Philosophy_(2009)_[Clean Copy].pdf`, PDF p. 146 (offset +15 from print pages). **Verified**: 2026-05-23 (spot-checked against PDF; §1.4 source provided initial transcription).

**Used at**: §1.2 L91 (applied 2026-05-23 — enumerated (1)-(3) of Heidegger's four-senses gloss in the expansion of perceptual fourfold treatment).

### GA 18, p. 132 *(added 2026-05-23 — §1.2 L91 four-senses expansion, sense 4)*
> πάθος designates the `size,' the `measure,' of that which happens to me, that which occurs to me in a harmful way. We have a corresponding expression for that: `that is a blow to me'.

**Source**: BCAP PDF, p. 147 (offset). **Verified**: 2026-05-23.

**Used at**: §1.2 L91 (applied 2026-05-23 — enumerated (4) of Heidegger's four-senses gloss, magnitude-of-harmful sense).

### GA 18, p. 134 *("tones life down"; added 2026-05-23 — §1.2 L91 four-senses expansion)*
> tones life down.

**Source**: BCAP PDF, p. 149 (offset). **Verified**: 2026-05-23 (§1.4 source).

**Used at**: §1.2 L91 (applied 2026-05-23 — Heidegger's refinement of sense 3, noting that the occurrence at issue is the one that "tones life down").

### GA 18, p. 135 *(added 2026-05-23 — §1.2 L121, eidos = "look" anchor at first coining of resonant aisthēma)*
> As this δυνατόν, νοῦς is better defined as δεκτικὸν τοῦ εἴδους, as ``being-able-to-take-up'' the εἶδος at the moment, the ``look'' of a being. Accordingly, νοῦς is the light in which the look of something is seen. What is said of illumination in relation to color (αἴσθησις) is said fundamentally of νοῦς, with regard to the being-determinations of every being as such.

**Source**: `Heidegger, Martin - Basic Concepts of Aristotelian Philosophy_(2009)_[Clean Copy].pdf`, PDF p. 150 (offset +15 from print pages). **Verified**: 2026-05-23.

**Used at**: §1.2 L121 (applied 2026-05-23 — anchor for the resonant *aisthēma* as residual *eidos* / "look" of the perceived thing at the first main-text coining of *resonant aisthēma*).

**Significance**: directly ties *eidos* to *aisthēsis* via the color/illumination analogy (in Heidegger's own phrasing), supplying the philosophical anchor for naming the formal-imagistic residue *resonant aisthēma* and articulating it as the residual *eidos* / "what it is" of the perceived thing.

### GA 18, pp. 122–125 *(added in diagram audit pass 2 2026-05-22)*

A four-anchor extract covering the γένεσις of ἀρετή, the no-τέχνη-for-καιρός claim, the three aspects of the how of πρᾶξις (εἰδώς / προαιρούμενος / βεβαίως), and ἕξις as how-of-pathos:

**p. 122 (γένεσις of ἀρετή)**:
> Ἀρετή as ἕξις is not a property, not a possession brought to being-there from without, but is rather a mode of being-there itself. We are encountering once again, as always, the peculiar category of the how. Ἀρετή is a how of being-there, not as a fixed property, but rather as the how of being-there determined by its being, characterized by temporality, by the stretching across time. For this reason, ἀρετή is and comes to be δι' ἔθους, "through habit."

**p. 123 (no τέχνη for the kairos)**:
> For this determination should not be conceived as though there were a τέχνη for this taking-opportunities and venturing-out into the δεινά of life. … Nor is there a παραγγελία for this, something like a universal military field order, an a priori ethics, by which humanity becomes better eo ipso. Everyone must have, for himself, his eyes trained on that which is at the moment and which matters to him.

**p. 123–124 (three aspects of the how of πρᾶξις)**:
> For this πρᾶξις, it depends on how the one acting, as such, behaves toward himself. It depends on ἕξις, being-composed and this πῶς ἔχων of the πράττων, the "how" of the "one acting" is defined in accordance with three aspects: 1. εἰδώς — φρόνησις: he must be "knowing," must act in the right "condition of looking around," which is oriented toward the καιρός with respect to the subject matter. 2. προαιρούμενος, he must act from out of himself "on the basis of an actual being-resolved to . . ." 3. Acting in such a way that he is thereby βεβαίως καὶ ἀμετακινήτως ἔχων, "stable and not to be brought out of composure."

**p. 125 (ἕξις as how of πάθος)**:
> Ἕξις is nothing other than a how of πάθος, being-out-of-composure, in relation to being-composed-as-to . . . Insofar as we can define ἕξις according to its basic structure, we will also clarify the possible-structure of πάθη.

**Source**: PDF pp. 137–140 (offset +15 from print pages). **Verified**: 2026-05-22.

---

## Heidegger — Being and Time (BT)

**Translation**: Macquarrie & Robinson (1962 / 1980 reprint). **Source PDF**: `corpus/rhetorical_ontology/Heidegger, Martin - Being and Time_(1962)_[My Copy].pdf`.

*(All entries below verified during §1.1 walkthrough 2026-05-22; added to catalog 2026-05-23.)*

### BT §12, H.53 (Eng. p. 78)
> The compound expression 'Being-in-the-world' … stands for a unitary phenomenon. This primary datum must be seen as a whole.

> cannot be broken up into contents which may be pieced together.

**Verified**: 2026-05-22.
**Used at**: §1.1 L99 second footnote (unitary-phenomenon structure as proto-form of Heideggerian being-in-the-world).

### BT §18, H.84 (Eng. p. 115)
> If something has an involvement, this implies letting it be involved in something. The relationship of the `with … in …' shall be indicated by the term `assignment' or `reference'.

**Verified**: 2026-05-22.
**Used at**: §1.1 L99 first footnote (involvement-assignment structure).

### BT §18, H.84 (Eng. p. 116)
> the totality of involvements which is constitutive for the ready-to-hand in its readiness-to-hand, is 'earlier' than any single item of equipment.

**Verified**: 2026-05-22.
**Used at**: §1.1 L99 first footnote (totality-of-involvements 'earlier' than individual equipment).

### BT §29, H.135 (Eng. pp. 172–175)
*(anchor citation for *Geworfenheit* / thrownness used at §1.2 L55; specific quote-text pending PDF re-verification at V1)*

### BT §29, H.137 (Eng. p. 176) *(corrected from H.136 — 2026-05-24)*

**✓ 2026-05-24 AUDIT — CORRECTED**: User confirmed 2026-05-24 — verbatim is "A mood assails us" (capital A, no "[Stimmung]" editorial insertion, no spurious "the"s). Locus corrected from H.136 to **H.137 / Eng.~p. 176**.

> A mood assails us. It comes neither from `outside' nor from `inside', but arises out of Being-in-the-world, as a way of such Being.

**Source**: `corpus/rhetorical_ontology/Heidegger, Martin - Being and Time_(1962)_[My Copy].pdf`, M&R 1962. **Verified**: 2026-05-24 (M&R verbatim per user).
**Used at**: §1.2 L55 footnote + §1.2 L69 footnote — **prose needs correction in both locations** (drop "the"s, drop [*Stimmung*] insertion, restore capital "A", update locus H.136 → H.137 / Eng.~p. 176).

### BT §32, H.150 (Eng. p. 191)

**✓ 2026-05-24 AUDIT — CORRECTED**: User confirmed 2026-05-24 — first sub-quote missing "this" + italics on "something we have in advance" and "fore-having". Corrected verbatim below. Second sub-quote unchanged. Applied at §1.1 L87 — **prose needs correction (add "this", add italics)**.

Two sub-quotes:

> In every case this interpretation is grounded in *something we have in advance*---in a *fore-having*.

> Whenever something is interpreted as something, the interpretation will be founded essentially upon fore-having, fore-sight, and fore-conception.

**Verified**: 2026-05-22.
**Used at**: §1.1 L87 (fore-structure of interpretation; Aristotelian *telos* / Heideggerian fore-structure homology).

### BT §32, H.153 (Eng. p. 195)
> this circle of understanding is not an orbit in which any random kind of knowledge may move; it is the expression of the existential fore-structure of Dasein itself.

**Verified**: 2026-05-22.
**Used at**: §1.1 L87 (existential fore-structure of Dasein in iterated-chain hermeneutic-circle homology).

### BT §65, H.328 (Eng. p. 377)
> Temporality 'is' not an entity at all. It is not, but it temporalizes itself.

**Verified**: 2026-05-22.
**Used at**: §1.1 L129 footnote.

### BT §65, H.329 (Eng. pp. 377–378)
Four sub-quotes:

**H.329 (equiprimordiality)**:
> temporality does not first arise through a cumulative sequence of the ecstases, but in each case temporalizes itself in their equiprimordiality.

**H.329 (unity of ecstases)**:
> its essence is a process of temporalizing in the unity of the ecstases.

**H.329 (future as primary)**:
> The primary phenomenon of primordial and authentic temporality is the future.

**H.329 (derivative time)**:
> the 'time' which is accessible to Dasein's common sense is not primordial, but arises rather from authentic temporality.

**Verified**: 2026-05-22.
**Used at**: §1.1 L129 (equiprimordiality + derivative time in main text; remaining three sub-quotes in footnote).

### BT §72, H.374 (Eng. p. 426) *(corrected from H.373/p.425 — 2026-05-24)*

**✓ 2026-05-24 AUDIT — CORRECTED**: User confirmed 2026-05-24 — prior catalog quote (Stambaugh wording) replaced with M&R 1962 verbatim. Locus corrected from H.373/Eng.~p. 425 to **H.374/Eng.~p. 426**.

> Dasein does not fill up a track or stretch `of life'---one which is somehow present-at-hand---with the phases of its momentary actualities. It stretches *itself* along in such a way that its own Being is constituted in advance as a stretching-along.

**Source**: `corpus/rhetorical_ontology/Heidegger, Martin - Being and Time_(1962)_[My Copy].pdf`, M&R 1962. **Verified**: 2026-05-24 (M&R verbatim per user).
**Used at**: §1.0 L67 footnote (Erstreckung / stretching-along) — **prose needs replacement with this M&R verbatim + locus correction (H.373 → H.374, p. 425 → p. 426)**; also §07 L277 (Section 6 Live, historicality, 2026-06-19).

_**Removed 2026-06-19**: a false BT §74, H.385–386 entry (unreliable pre-audit "Verified: 2026-05-22" mark; matched nothing at §74 H.385; per user, not in the current dissertation). Do not re-add._

---

## Heidegger — Fundamental Concepts of Metaphysics (GA 29/30)

**Translation**: McNeill & Walker (Indiana UP, 1995). **Source PDF**: pending corpus availability check (cited in catalog references but specific PDF spot-check pending V1).

### GA 29/30, p. 67
> [*Stimmung* is] like an atmosphere in which we first immerse ourselves in each case and which then attunes us through and through.

**Verified**: 2026-05-22 (per Rickert's citation in *Ambient Rhetoric*; PDF cross-check pending V1).
**Used at**: §1.2 L55 footnote (atmospheric-resonant character of attunement; Rickert-cited; load-bearing for dissertation's second section on VR/video-game environments).

---

## Secondary — Gibson (1979 / 2015 Classic Edition)

**Source**: Gibson, J. J., *The Ecological Approach to Visual Perception* (Classic Edition, 2015). **Source PDF**: `corpus/rhetorical_ontology/Gibson, James J. - The Ecological Approach to Visual Perception._(2015)_[Clean Copy].pdf`.

### Gibson, p. 45 *(verified by user 2026-05-23; from Ch. 4 "The Structuring of Ambient Light")*
> Only insofar as ambient light has *structure* does it specify the environment.... The term that will be used to describe ambient light with structure is an *ambient optic array*. This implies an arrangement of some sort, that is, a pattern, a texture, or a configuration. The array has to have parts.

**Verified**: 2026-05-23 (user-confirmed page + italics on "structure" and "ambient optic array").
**Used at**: §1.2 L57 (applied 2026-05-23 — verbatim support for the ambient-optic-array-specifies-environment claim).

**Editorial note**: Existing §1.2 L57 cites this as "pp. 209–210" — incorrect; those pages are Ch. 12 "Looking with the Head and Eyes," discussing the lorgnette tachistoscope and stimulus-sequence fallacy. Correct support is at p. 45, per user verification.

### Gibson, p. 46 *(verified by user 2026-05-23; from Ch. 4 "The Structuring of Ambient Light", second extracted quote)*
> the light specifies these surfaces, their composition, texture, color, and layout, their gross properties, not their atomic properties.

**Verified**: 2026-05-23 (user-confirmed page).
**Used at**: §1.2 L57 (applied 2026-05-23 — companion to p. 45 quote).

---

## Secondary — Coope (2005)

**Source**: Coope, *Time for Aristotle: Physics IV.10–14*, Oxford 2005. **Source PDF**: `corpus/download/dissertation-fresh-perplexity/Q-010_Ursula_Coope_2005_Time_for_Aristotle_Physics_IV.10_14.pdf`.

### Coope p. 160
> Once we fully understand Aristotle's view about the way in which time is countable, we should be able to see for ourselves not just that it is mind-dependent but also that it is mind-dependent in a way in which change is not.

**Verified**: 2026-05-22.
**Used at**: §1.1 L127 footnote (replaces previously-misattributed "strong reading" formulation; see editorial note below).

### Coope p. 162
> the nature of time itself implies that time cannot exist in the absence of ensouled beings.

**Verified**: 2026-05-22.
**Used at**: §1.1 L127 footnote.

**Editorial note (Coope misattribution — removed from dissertation)**: A prior dissertation footnote attributed "On what I shall call the strong reading … I shall argue for the strong reading" to Coope. This is NOT verbatim in her PDF — the strong-vs-weak reading distinction in that exact form does not appear in her text. Replaced with the verified Coope quotes above (Coope Ch. 10 "Time and the Soul", pp. 160, 162) during §1.1 L127 walkthrough.

---

## Secondary — Broadie (1982)

**Source**: Broadie, *Nature, Change, and Agency in Aristotle's Physics*, Oxford 1982.

**⚠️ Status**: PDF **not in corpus**; flagged `****** UNVERIFIED` placeholder at §1.1 L127 footnote (the time-without-soul / time-as-arithmos passage referenced in that footnote). User to supply verbatim text manually.

---

## Secondary — Rickert, *Ambient Rhetoric* (2013)

**Source**: Rickert, Thomas. *Ambient Rhetoric: The Attunements of Rhetorical Being*. Pittsburgh: University of Pittsburgh Press, 2013. **PDF**: `corpus/rhetorical_ontology/Rickert, Thomas - Ambient Rhetoric- The Attunements of Rhetorical Being_(2013)_[My Copy].pdf`. All entries **verbatim-confirmed 2026-06-09** against the PDF text extraction (`pdftotext`); pages read from the extraction's running headers. *(The extraction garbles spacing — "ca retaking"→"caretaking", "ofattunement"→"of attunement", "ifit"→"if it" — and renders curly quotes as mojibake; entries below give the corrected printed text. Pages marked `~` to confirm against the print copy.)* Added for the **ADA v5 dwelling integration** (`CANONICAL-METHODOLOGY-v5.md`).

### Rickert p. 223 — dwelling as a *principle of being*, not a worldview *(ADA v5 §2.1 / world-face — the ontological content of incorporation's re-grounding)*
> As Heidegger argues, however, dwelling indicates not a worldview but a principle of being: culture is materially enworlded. That is, dwelling is a way of being conditioned and permeated by things so that they are inseparable from what it means to live in the world.

### Rickert p. 224 — dwelling as ecological flourishing; active (not passive) comportment *(ADA v5 §2.1)*
> Rather, dwelling indicates lived relations woven into complex ecologies of the world's things and forces. This is not passive coexistence or simple adaptation to things; it is an active if conditioned comportment toward the world.
*(Continues: Heidegger characterizes this as a "letting be" appearing as "shepherding, cultivating, sparing, and caretaking" — PLT 147–48.)*

### Rickert p. 225 — the **bethinged** (we are gathered by things) *(ADA v5 §2.1 — the patient-pole, held WITH the agent-pole via DA III.7; not a dissolution of agency)*
> Thus, homemaking is not humanist on this account; it is distributed, ecological, and attuned doing. We do not just gather things in our existence; in addition, we are gathered by things: "we are the bethinged, the conditioned ones" (Heidegger, FLT 181).

### Rickert p. 225 — *thing* vs *object* (recalcitrance / anti-dualism) *(ADA v5 §6 — the recalcitrance design-diagnostic)*
> a thing is not simply an object "out there," picked out within a dualistic paradigm in which a subject perceives and distinguishes objects, which can be called things…. A thing also invokes relations and situations.
**⚠️ Note (design decision 2026-06-09)**: in Rickert this distinction runs *into* the Fourfold ("how he wants to grant to the thing … the ability to manifest what he calls the fourfold [*das Geviert*] … earth, sky, mortals, and gods"). **ADA takes the thing/object distinction and stops before the Geviert** (per user). Rickert himself: "we must resist this valuation but not simply reject it." The anti-dualism here ("not… within a dualistic paradigm in which a subject perceives… objects") independently reinforces the DA III.7 "one substrate, two in being" structure.

### Rickert p. 161 — *a priori affectability* hollows out identification in advance *(ADA v5 §4 / other-face — dwelling grounds consubstantiation)*
> The conjunctures we call identification, commonality, and community work from, have their spaces of possibility hollowed in advance by, this a priori affectability.

### Rickert ~p. 172 — Burke's limit (the world's meaning ≤ human symbolicity) *(ADA v5 §5.2 / §10 — supports re-grounding Burke symbolic→desire-sourced)*
> For Burke, the world possesses no meaning or value beyond the projections of human symbolicity.
*(Extraction line 6983; page ~172 — confirm.)*

### Rickert, Introduction — **rhetoric is ontological** (the capstone warrant) *(ADA v5 §4.3 / §9 — the rhetorical-ontological warrant for the virtual→actual carry-over)*
> Rhetoric accomplishes its work by inducing us to shift, at least potentially, how we dwell or see ourselves dwelling in the world. Rhetoric does not just change subjective states of mind; it transforms our fundamental disposition concerning how we are in the world, how we dwell.
*(Introduction; "transforms our fundamental disposition" is verbatim — the notes' em-dash is a semicolon in print. Confirm page.)*

### Rickert, Introduction — Rickert's own definition of dwelling *(ADA v5 §2.1)*
> I use the term dwelling here to mean how people come together to flourish (or try to flourish) in a place, or better, how they come together in the continual making of a place; at the same time, that place is interwoven into the way they have come to be as they are—and as further disclosed through their dwelling practices.
*(Introduction; confirm page.)*

### Rickert ~p. 246 — dwelling is possible **anywhere, including the digital** *(ADA v5 §2.1 / §8 — licenses applying dwelling to virtual worlds)*
> Despite much of what Heidegger himself might say, dwelling is possible anywhere, in the city or even in a digital or other realm that challenges current conceptions of "whereness."

### Rickert ~p. 246 — dwelling as a **never-stilled process** *(ADA v5 §4.2 / §7 — the union is intrinsically processual; explains incorporation's "slipping back")*
> Dwelling is an ongoing and never stilled process of attunement, disclosure, and building. Thus, dwelling is rhetorical in an ambient sense: disclosure and attunement emerge out of a worldly affectability, so that dwelling's coming to manifestation is a matter of ongoing differentiation.

### Rickert ~p. 245 — transhuman powers; affordances **and recalcitrances** *(ADA v5 §6 — the recalcitrance diagnostic)*
> …they are transhuman powers manifesting themselves as the land's affordances and recalcitrances.
*(Extraction line 9487; the fuller sentence — "Location in regard to the spring and the mountain, the weight of snow, the severity of weather, mortality, and more emerge as vital things in their own rights…" — and exact page to confirm.)*

---

## Aristotle — De Insomniis (On Dreams)

### De Insomn. 460b1–10 *(user-provided 2026-05-22; key renamed from 460b3–11)*
> In order to answer our original question, let us now, therefore, assume one proposition, which is clear from what precedes, viz. that even when the external object of perception has departed, the impressions it has made persist, and are themselves objects of perception; and let us assume, besides, that we are easily deceived respecting the operations of sense-perception when we are excited by emotions, and different persons according to their different emotions; for example, the coward when excited by fear, the amorous person by amorous desire; so that, with but little resemblance to go upon, the former thinks he sees his foes approaching, the latter, that he sees the object of his desire; and the more deeply one is under the influence of the emotion, the less similarity is required to give rise to these impressions. Thus, too, both in fits of anger, and also in all states of appetite, all men become easily deceived, and more so the more their emotions are excited.

**Source**: J. I. Beare translation (from W. D. Ross, *Aristotle: Parva Naturalia*, Clarendon Press, Oxford 1955), as printed in *The Complete Works of Aristotle: The Revised Oxford Translation*, ed. Jonathan Barnes (1984). User-provided verbatim 2026-05-22.

**Changes applied to v7.html**:
- PASSAGES key renamed `'De Insomn. 460b3–11'` → `'De Insomn. 460b1–10'` (corrected Bekker locus).
- Alias `'De Insomn. 460b3–16'` retargeted to new key (no `passages[]` array updates needed — all references go through the alias).
- Phrase corrected: "the amorous person by the object of his desire" → "the amorous person by amorous desire" (prior entry had a phrasing error).
- Verbatim extended to include the full sentence opening ("In order to answer our original question…") and the closing extension ("Thus, too, both in fits of anger…").

**Verified**: 2026-05-22

### De Insomn. 460b16–18 *(noted 2026-05-26 — §1.5 doxa-gate / "corrective-faculty" anchor)*
> The cause of these occurrences is that the faculty in virtue of which the controlling sense judges is not identical with that in virtue of which images come before the mind.

**Source**: J. I. Beare translation, *Revised Oxford Translation* (Barnes 1984) — user-supplied verbatim 2026-05-26 from personal copy.

**Corpus cross-witness** (Ross 1906 *De Insomniis*, "Summer Workshop in Ancient Philosophy" trans., text-cache `corpus/download/text-cache/G._R._T._Ross_1906_…De_Insomniis…txt`): "And the reason for these things occurring is the fact that the authoritative part in respect of judging and the part by which appearances come to be are not grounded in the same capacity." — same locus (460b16–18).

**Gloss**: the judging *kritikon* of the controlling/common *aisthētikon* (τὸ κρῖνον / ἡ κυρία αἴσθησις) ≠ *phantasia*/*phantastikon* (the imaging power). Continuation (460b18–22): the sun-appears-a-foot-wide override (doxastic) + crossed-fingers / "sight is more authoritative than touch" (sense-over-sense).

**Status**: user-supplied verbatim (trusted); corpus Beare-ROT *De Insomniis* PDF is image-only (not text-verifiable); Ross 1906 confirms locus + sense. Not yet deployed; targeted for §1.5 §5 (gate) / §7 (corrective-impairment) at PHASE 3/4.

---

## §1.5 PHASE 1 walkthrough additions (2026-05-26)

### DA II.8, 420b28–421a2 (voice) *(§1.5 §2 note-3 insertion; PDF-verified 2026-05-26)*
> Voice then is the impact of the inbreathed air against the windpipe, and the agent that produces the impact is the soul resident in these parts of the body. Not every sound, as we said, made by an animal is voice (even with the tongue we may merely make a sound which is not voice, or without the tongue as in coughing); what produces the impact must have soul in it and must be accompanied by an act of imagination, for voice is a sound with a meaning, and is not the result of any impact of the breath as in coughing; in voice the breath in the windpipe is used as an instrument to knock with against the walls of the windpipe.

**Source**: Aristotle, *De Anima*, Smith/Barnes ROT (corpus `Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf`).
**Deployed**: §1.5 §2 — full quote in footnote; "a sound with a meaning" inline (420b31–33). Note's "knownck" typo → corpus "knock with"; work-title "On The Soul (De Anima)" → *De Anima*.

### White 1985, "The Meaning of Phantasia in Aristotle's *De Anima* III.3–8," p. 485 (phaō etymology) *(§1.5 §2 note-3; PDF-verified 2026-05-26)*
> Although Aristotle's derivation of it from *phaos* ("light") may not be strictly correct, both words seem ultimately to come from the verb *phaō*, which means "to give light, shine, beam, especially of the heavenly bodies". From this latter word were derived the two verbs *phainō* ("to show") … and *phantazō* ("to make visible …"), and thence the verbal nouns *phantasia* and *phantasma*.

**Source**: Kevin White, *The New Scholasticism* (1985); corpus `White, Kevin - The Meaning of Phantasia …(1985)_[My Copy].pdf`. Page marker "485" precedes the passage. **OCR caveat**: the verb prints as "phad"/"phaind" (ō misread as d) → read *phaō* / *phainō*.
**Deployed**: §1.5 §2 — consolidated with the pre-existing White p. 498 quote ("lingering, resonating, echoing presence…"). Corrects the draft note's genealogy: *phaō* (light) is the ultimate root; *phainō* (show) derives from it.

### von Uexküll, *A Foray into the Worlds of Animals and Humans* — Hansel-and-Gretel child *(§1.5 §5 note-5; PDF-verified 2026-05-26)*
> Get the witch out of here; I can't stand to see her repulsive face any more!

**Context** ("Magical Environments" ch.): children "played the story of Hansel and Gretel, the witch, and the gingerbread house" until one exclaimed the above. (The PDF interleaves a figure caption — "FIGURE 42. The magical appearance of the witch" — mid-sentence; not part of the quote.)
**Source**: J. von Uexküll, *A Foray into the Worlds of Animals and Humans with A Theory of Meaning* (O'Neil trans.; corpus `von Uexkull, Jacob - A Foray Into the Worlds…(1934)_[Clean Copy].pdf`). **Page**: user-cited range pp. 122–126 ("Magical Environments"); single-page locus to confirm.
**Deployed**: §1.5 §5 — *phantasma* overriding a standing *doxa* (D5, held-until-revised). **Q5**: in scope for the deferred trace→tone (Uexküll *Merkmalton*/*Wirktonus*) investigation.

### Rhetoric II.1, 1378a19–23 (pathē alter judgments + hedonic tone) *(§1.5 note-7; PDF-verified 2026-05-26)*
> The emotions are all those feelings that so change men as to affect their judgements, and that are also attended by pain or pleasure. Such are anger, pity, fear and the like, with their opposites.

**Source**: Aristotle, *Rhetoric* (W. Rhys Roberts ROT; corpus `Aristotle - Rhetoric_(2014)_[Clean Copy].pdf`).
**Deployed**: §1.5 §5 — "so change men as to affect their judgements" at L167 (pre-existing, judgment-alteration); "attended by pain or pleasure" at note-7 (the *doxa*'s affective saturation, D11). Two complementary clauses of one definition.

### Metaphysics IX.6, 1048b30–34 (energeia/kinēsis tense-test) *(§1.5 note-8b / D4 homology; PDF-verified 2026-05-26)*
**→ Now the tail of the full passage `Met. IX.6, 1048b18–34` above** (user-supplied 2026-06-09). This sub-range — "it is not true that at the same time we are walking and have walked, or are building and have built … The latter sort of process, then, I call an actuality, and the former a movement" — is deployed at **§1.5 §6 note-8b** (D4 homology *praxis*:*poiēsis* :: *energeia*:*kinēsis*; arc-closer *kinēsis* = *energeia atelēs*; quoted there with elisions). *(Prior locus "b30–36" tightened to b30–34, the passage's end; OCR note: the My-Copy PDF prints "I call" as "1 call".)*

### Nussbaum, "The Role of Phantasia in Aristotle's Explanation of Action" — apparent good (NE 1114a32ff.) *(§1.5 note-9a; verbatim-verified 2026-05-26)*
> All men strive for the apparent good (phainomenon agathon): but no one is in control of the appearing (phantasia): the way the end appears (phainetai) to someone depends on what sort of a man he is.

**Source**: Nussbaum's translation of *Nicomachean Ethics* 1114a32ff.; appears in BOTH corpus PDFs — *The Role of Phantasia…* (1985) and *Aristotle's De Motu Animalium* (1978, Essay 5). **Page**: user-cited pp. 31–33 — NOT confirmable from corpus extraction (no clean page marker by the passage); confirm against user's edition. OCR garbles the Greek glosses; English verified.
**Deployed**: §1.5 §7 note-9a (*hexis* conditions the *phantasia* of the good). **PHASE-4 flag**: §2's pre-existing "ties abstract thought to concrete perceptible objects … *Fragility of Goodness* p. 265" attribution likely belongs to this *Role of Phantasia*/*DMA* work, not *Fragility*.

### Metaphysics A.1, 980b28–981a4 (empeiría) *(§1.5 note-9b; cited, PDF-confirmed 2026-05-26)*
Locus confirmed to contain the experience→art material ("experience made art, as Polus says, but inexperience luck"; "men of experience"). **Cited, not quoted**, in §7 note-9b for the appetitive→*empeiría* sedimentation (D12).
**Source**: Aristotle, *Metaphysics* (Ross ROT; corpus copy).

---

## Heidegger, *BCAP* pp. 98–99 — *prohairesis* / *boulēsis* / *thymos* / *doxa* (Heidegger quoting *NE* III.2) *(user-supplied 2026-05-27; §1.5 PHASE-3 "civic passions" + *prohairesis* discovery)*

**Provenance (user):** Heidegger quotes Aristotle directly (footnotes give the *NE* loci). Text within ``…'' is verbatim as printed; nested Aristotle-quotes appear as ````…; user's own translations/glosses are in `[]` (once `{}`). **Six block-quotes supplied (user wrote "five" — registering all six). Transcribed faithfully; **text typos user-confirmed and corrected 2026-05-27** (the `\gk{θυμός]` bracket in (5) + minor LaTeX-markup [`\texit`, duplicate *praktón* bracket, missing `/`] LEFT as-is for the V1 pass); **PDF cross-checked verbatim vs corpus BCAP 2026-05-27 — VERIFIED.****

**(1) BCAP 98 — the five "being-after-something" phenomena:**
> ``The five phenomena [\textit{epithymia}/\gk{ἐπιθυμία}/``appetite'', \textit{thymos}/\gk{θυμός}/``passion'', \textit{boulēsis}/\gk{βούλησις}``wish'' or ``rational desire'', \textit{doxa}/\gk{δόξα}, and \textit{prohairesis}/\gk{προαίρεσις}/deliberate desire] are fully characterized as \textit{being-after something, with the character of having-in-advance}, so that what one is after is there in advance in a particular way---\gk{προαίρεσις}. The toward-which is there from the outset. This being-after something with the character of the in-advance is found in \gk{ἐπιθυμία} exactly as it is in \gk{θυμός}. It is fully explicit in the case of wish. A being-after something in the direction of the \gk{ἀληθές} [\texit{alēthes}/``what is true''] is also found in \gk{δόξα}. To opine that the matter is thus and so lies in the view itself. This being-after something---something that I do not yet generally possess, but which already occupies me nevertheless---is the phenomenon that motivates bringing these various phenomena together with \gk{προαίρεσις}.'' (\textit{BCAP} 98).

**(2) BCAP 98 — no *prohairesis* for the speechless** [fn: *NE* III.2, 1111b12]:
> ````There is no \gk{προαίρεσις}, no being-resolved, for living things that do not speak.'' Speaking, deliberating, belong to \gk{προαίρεσις}. Only a resolution that passes through deliberation is a genuine resolution.'' (\textit{BCAP} 98).

**(3) BCAP 98 — *epithymia*/*thymos* go after *hēdy*/*lypēron*** [fn: *NE* III.2, 1111b13]:
> ````He who lacks self-control acts \gk{ἐπιθυμῶν} such that he goes off after the matter. But this going-off is not a resolute acting. The self-controlled acts resolutely, but he does not need to be \gk{ἐπιθυμῶν}. \gk{Ἐπιθυμία} and \gk{θυμός} go after a \gk{ἡδύ} [\textit{hēdy}/``pleasant thing''] and a \gk{λυπηρόν} [\textit{lypēron}/``distressful thing''] that disposition supports and tones down.'''' (\textit{BCAP} 98).

**(4) BCAP 98 — *prohairesis* goes after the *praktón*:**
> ``\gk{Προαίρεσις} goes after the \gk{πρακτόν} [\textit{praktón] [\textit{praktón}/``realizable''], that which is decisive for a concern in the moment, that which comes into question for it. That is what the resolution brings together. Orientation toward the whole moment belongs to \gk{προαίρεσις}. \gk{Προαίρεσις} is not a so-called act; it is a genuine possibility of being in the moment.'' (\textit{BCAP} 98).

**(5) BCAP 99 — *thymos*: arousal vs lucid resolution** [fn: *NE* III.2, 1111b18]:
> ``Aristotle says about \gk{θυμός], ``that which is grasped in a state of arousal, in blind passion, has little to do with that which is grasped in clear, lucid resolution.'' (\textit{BCAP} 99).

**(6) BCAP 99 — *prohairesis* is not *boulēsis* (realizable vs impossible)** [fn: *NE* III.2, 1111b20; user note: `{}` used for *éschaton* because the passage already had `[]`]:
> ``Furthermore, \gk{προαίρεσις} is not a \gk{βούλησις} although it looks that way. The difference lies in that to which they are related. ``\gk{Προαίρεσις} never goes after something that is impossible. [I am resolved to something of which it is certain that it is possible.] If someone wanted to say that he is resolved to an impossibility, we would say that he is foolish. Wishing, on the other hand, can be directed at something that is impossible.'' \gk{Προαίρεσις} is always after the possible, specifically, after something determinately possible that we take up and are able to carry out in the moment. \gk{βούλησις}, on the other hand, goes after something that is impossible. It can go after the possible too, not if it depends on us but rather on others. \gk{Προαίρεσις} always goes after something that is under our control. \gk{Προαίρεσις} leads to the \gk{ἔσχατον} {\textit{éschaton}/``ultimate end''}, to the point that I grasp, that I genuinely institute through action.'' (\textit{BCAP} 99).

**Source**: Heidegger, *Basic Concepts of Aristotelian Philosophy* (2009), pp. 98–99 (quoting Aristotle *NE* III.2, ~1111b9–22). User-supplied 2026-05-27.

**✓ Text typos RESOLVED 2026-05-27** (user-confirmed; corrected in the quotes above; `\gk{θυμός]` bracket + minor markup left for V1). Quotes PDF-verified verbatim vs corpus BCAP; deployed in §1.5 v3 cited p.~98 (*praktón*) + p.~99 (rest). Original flags retained below for record:
- (1) `[\texit{alēthes}` → likely `\textit{alēthes}` (LaTeX); `\gk{βούλησις}``wish''` → missing `/` separator (cf. the pattern `…/\gk{…}/``…''`); **"occuppies"** (inside ``…'') → "occupies"? *verify: translator's text or transcription slip.*
- (2) fn `\texit{NE}` → `\textit{NE}`.
- (3) fn `\text{NE}` → `\textit{NE}`.
- (4) `[\textit{praktón] [\textit{praktón}/``realizable'']` → looks like a duplicated/half-formed bracket; likely just `[\textit{praktón}/``realizable'']`.
- (5) `\gk{θυμός]` → `\gk{θυμός}` (bracket→brace); fn `\text{NE}` → `\textit{NE}` and `/footnote` → `\footnote`; closing quotes: only one `''` after "resolution" though an inner Aristotle-quote opened — *verify nesting (a `''` may be missing).*
- (6) **"gos after"** (inside ``…'') → "goes after"? *verify: verbatim or slip.* fn `\text{NE}` → `\textit{NE}` and `/footnote` → `\footnote`.

---

## Wish vs. choice / ends vs. means — *Rhetoric* I.5–6 + *NE* III.2–3 *(user-supplied 2026-05-27; grounds *boulēsis* [end] vs *prohairesis* [means])*

> It may be said that every individual man and all men in common aim at a certain end which determines what they choose and what they avoid. This end, to sum it up briefly, is happiness and its constituents. (*Rhetoric*, I.5, 1360b4--6)

> It is now plain what our aims, future or actual, should be in urging, and what in deprecating, a proposal; the latter being the opposite of the former. Now the deliberative orator's aim is utility: deliberation seeks to determine not ends but the means to ends, i.e. what it is most useful to do. (*Rhetoric*, I.6, 1362a15--20)

> We deliberate about things that are in our power and can be done. (*NE* III.3, 1112a31)

> We deliberate not about ends but about what contributes to ends. For a doctor does not deliberate whether he shall heal, nor an orator whether he shall convince, nor a statesman whether he shall produce law and order, nor does any one else deliberate about his end. Having set the end they consider how and by what means it is to be attained; and if it seems to be produced by several means they consider by which it is most easily and best produced, while if it is achieved by one only they consider how it will be achieved by this and by what means *this* will be achieved, till they come to the first cause, which in the order of discovery is last. (*NE*, III.3, 1112b12--19)

> but there may be a wish even for impossibles, e.g. for immortality. And wish may relate to things that could in no way be brought about by one's own efforts, e.g. that a particular actor or athlete should win in a competition; but no one chooses such things, but only the things that he thinks could be brought about by his own efforts. Again, wish relates rather to the end, choice to what contributes to the end; for instance, we wish to be healthy, but we choose the acts which will make us healthy, and we wish to be happy and say we do, but we cannot well say we choose to be so; for, in general, choice seems to relate to the things that are in our own power. (*NE* III.2, 1111b21--30)

**Source**: Aristotle, *Rhetoric* (Roberts ROT) + *Nicomachean Ethics* (Ross ROT). User-supplied 2026-05-27. **Establishes:** *boulēsis* (wish) → the **end** (health, happiness); *prohairesis* (choice) → **what contributes to the end / the means** (the acts that make us healthy), restricted to the realizable/up-to-us.
**✓ Typos RESOLVED 2026-05-27** (user-confirmed; corrected in the quotes above): *Rhet* I.6 "It is **no** plain" → "It is **now** plain"; *NE* III.3 "whe**t**er" → "whe**th**er"; *NE* III.2 "brough**tt**" → "brought".


---

## §1.5 v3 citation verifications (2026-05-27) — Gross / Struever / BCAP / Rhetoric

PDF-verified against `corpus/rhetorical_ontology/` during the §1.5 `-v3.tex` revision; these resolve the pipeline draft's flagged *Heidegger and Rhetoric* citations.

### Struever — "Alltäglichkeit, Timefulness, in the Heideggerian Program," in *Heidegger and Rhetoric* (Gross & Kemmann, eds., 2005), **p. 109**
> Passion itself is both motion and a cause of motions; it is a capacity for altering … Of Aristotle's notion that passions alter judgements, Heidegger observes that this is where passions intrude on logos---here articulated judgements …

**Source**: `Multiple Authors - Heidegger and Rhetoric_(2005)_[My Copy].pdf`, print p. 109 (running header "Nancy S. Struever"; PDF p. 115). **Verified 2026-05-27.**
**CORRECTION**: the pipeline draft cited this as "Multiple Authors / Gross & Kemmann, **pp. 113–115**" — wrong author *and* page ("Multiple Authors" was only the corpus filename). Swept to **Struever, p. 109** in v3 across §§1, 5, 7, 8, 9.

### Gross — Introduction ("Being-Moved: The Pathos of Heidegger's Rhetorical Ontology"), in *Heidegger and Rhetoric*, **p. 26**
> The eidos of the pathē is a disposition toward other humans, a Being-in-the-world.

**Verified 2026-05-27** (print p. 26, running header "Daniel M. Gross"; PDF p. 32). **ATTRIBUTION**: this line is **Heidegger's** (Gross block-quotes it; German original `[Der Grieche sieht eine Linie nicht primär an sich…]` printed beneath), about **the *pathē* in general** (worked example = **fear**, not anger). Gross's own adjacent prose (p. 26): the *pathē* "tie humans in a unique way to their embodiment … by determining the possibilities for moving about a shared world." Deployed correctly at §4 T2 (option C) — NOT as Gross's own words, NOT "anger."

### Gross — Introduction, *Heidegger and Rhetoric*, **p. 4** (genuinely Gross's prose; correct as cited)
> Heidegger characterizes pathos (variously "passion," "affect," "mood," or "emotion") as the very condition for the possibility of rational discourse, or logos. No cynical and crowd-pleasing addition to logos, pathos is the very substance in which propositional thought finds its objects and its motivation.

**Verified 2026-05-27** (print p. 4, running header "Daniel M. Gross"; PDF p. 10). Used at §1.5 §7. The "4) Finally," in the source is Gross's enumerated point 4 (coincidentally also on p. 4).

### Also verified verbatim (2026-05-27)
- **BCAP pp. 98–99** (*prohairesis*/*boulēsis*/*thymos*/*doxa*) — see entry above; cited p. 98 (*praktón*) + p. 99 (arousal/lucid, impossible/under-our-control/*éschaton*).
- **Rhetoric I.5, 1360b4–6** ("happiness and its constituents") — verbatim (PDF p. ~14).

**§1.5 v3 status (2026-05-27):** four-category recast + §6 cleanup (D3) + Struever-p.109 sweep + D10 (doxastic ratification) + §5 dark-alley + `$A_n` node/macron normalization — all applied to `Working tex versions/1.5 - A4 - Three Types of Action-v3.tex` (compiles, 14 pp; v2 untouched). Full handoff: `SITREP-1.5-v3-2026-05-27.md`. Remaining: chapter-wide *pathē*→"civic passions" + §§1.0–1.4 ripple (frozen pending user signal).

---

## Chapter-wide §§1.0–1.4 ripple — v3 applications (2026-05-28)

The §§1.0–1.4 ripple was un-frozen this session; v3 working copies now host the chapter-wide changes (v2 baselines untouched). Two of three ripple components are DONE; the civic-passions rename is audit-complete and pending user review.

### DMA-"affections" reinterpretation — §1.1 L55 fn + §1.4 L113/L115
Realigns *De Motu Animalium* 702a17–19's "affections" with the general being-affected/somatic-substrate sense (basic-affective-valence/somatic register), distinct from the higher-order *Rhetoric*-II *pathē* (anger, fear, pity, shame, etc.). The §1.1 L55 chain-element footnote now reads: *"The chain-element is \textit{pathē} in the general, being-affected sense (the basic-affective-valence/somatic register); the higher-order \textit{pathē} developed at §1.4 are the \textit{doxa}-ratified species realized upon it."* §1.4 L113 + L115 carry the matching distinction in the main prose (the "boiling of blood around the heart" cited as such an affection — somatic substrate through which the determinate emotion is realized). The reinterpretation is paraphrastic; DMA 702a17–19 already sits in the corpus index, no new verbatim quote added.

### Prohairesis-intro — §§1.0/1.3/1.4 (introduces *prohairesis* into §§1.0–1.4 for the first time; was 6× in §1.5 only)
- **§1.3 L91** — definitional anchor, appended to the *calculative-practical*-sub-function sentence (deliberative *phantasia* "terminates in a determination of the greater good"). Cites **NE III.3, 1112b11–16** (full verbatim at the dedicated entry above, "Wish vs. choice / ends vs. means"). The terminating determination *is* *prohairesis*; deliberative *phantasia* is the cognitive organ through which candidate means are projected and weighed; "*Prohairesis* accordingly presupposes deliberative *phantasia* as its condition."
- **§1.4 L199** — appended to the *praxis-hexis* paragraph (end of the *technē-hexis* / *praxis-hexis* bivalence). Structural contrast: where *technē-hexis* contracts deliberation toward routine, *praxis-hexis* keeps the agent open for "renewed prohairetic resolution on each occasion" — ties the *praxis* disposition explicitly to the prohairetic type. Uses §1.4's current "*technē-hexis*"/"*praxis-hexis*" terminology (the §1.5-only D3 retirement to *technē* / ethical *hexis* has not yet been swept chapter-wide).
- **§1.0 L101** — light parenthetical foreshadow inside the roadmap span, after "the particular *pathos* calls forth": *"---and, where the realizable good is reached only through deliberation, the deliberate choice of the means to it (\textit{prohairesis})---"* (cleanest-fix wording; em-dash on the left, comma on the right back into the existing roadmap sentence). No new locus, just the name.

All three placements verified via grep + brace balance and compile xelatex exit 0 against their respective v3 files (§1.0-v3 10 pp · §1.3-v3 17 pp · §1.4-v3 20 pp).

### Civic-passions rename — PENDING USER REVIEW (NOT YET APPLIED)
Audit at `tmp/Dissertation/pathe-civic-passions-analysis.md` (412 path-occurrences across §§1.0–1.5; 151 civic-passion candidates, 45 uncertain, 216 keep). Per the §1.5 rule established this session: singular *pathos* reserved for the §1.1 ontological being-affected/affectable structure; plural *pathē* (Rhetoric II catalogue: anger, fear, pity, shame, indignation, envy, etc.) renamed to **civic passions**. User decisions pending: (i) "Each *pathos*..." distributive convention in §1.4 (31 spots), (ii) definitional anchor location (§1.4 L52–L56 + §1.0 L101 fn), (iii) *resonant pathē* coinage rename, (iv) in-quote preservation policy. Execution will follow user-supplied decisions.

---

## 2026-05-30 — *Phantasia*–*aisthēsis*–*orexis* cluster (§1.2 "Hylomorphism and the Reception of Form")

Four passages assembled for the §1.2 result that *phantasia* is operative *within* *aisthēsis* (the *kritikon* / taking-as), grounding *phantasia*'s presence throughout the chain from A₁ onward and the *phantasia*–*orexis* link behind perceptual *epithymia*. Greek of the *De Anima* passages confirmed against the Ross OCT scan (`Aristotle - De Anima (Ross_Greek).pdf`, scan p. 37 = Bekker 413a–b); English verified against the Smith/ROT "My Copy" PDF.

### De Insomniis 1, 459a15–22 *(user-supplied 2026-05-30 — phantastikon = aisthētikon, "different in being")*
> But since we have, in our work on the soul, treated of imagination [\textit{phantasia}], and the faculty of imagination [\textit{phantastikon}] is identical with that of sense-perception, though the being of a faculty of imagination is different from that of a faculty of sense-perception [\textit{aisthētikon}]; and since imagination is the movement set up by a sensory faculty when actually discharging its function, while a dream appears to be an image … it manifestly follows that dreaming is an activity of the faculty of sense-perception but belongs to this faculty \textit{qua} imaginative. (\textit{De Insomniis} 1, 459a15–22)

**Source**: Beare/ROT translation. **Status**: user-supplied verbatim (trusted); corpus Beare-ROT *De Insomniis* PDF is image-only (not text-verifiable). **Cross-witness**: Ross 1906 *De Insomniis* (`corpus/download/text-cache/G._R._T._Ross_1906_…De_Insomniis….txt`, l. 92) confirms locus + sense — "…but [it belongs] to this *qua* imaginative" (459a22).

**Significance**: the *phantastikon* and *aisthētikon* are one in substrate, "different in being"; *phantasia* is defined as the motion the sensory faculty sets up *when actually discharging its function* — i.e., concurrent with perceiving, not merely posterior. Primary warrant for *phantasia*'s presence within *aisthēsis*.

### DA II.2, 413b21–24 *(user-supplied 2026-05-30; full passage — extends the existing "413b24" sub-entry above)*
> each of the segments possesses both sensation and local movement; and if sensation, necessarily also imagination and appetition; for, where there is sensation, there is also pleasure and pain, and, where these, necessarily also desire. (\textit{De Anima} II.2, 413b21–24)

**Source**: `Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf`, PDF p. ~21 (insects-cut-in-two argument). **Verified**: 2026-05-30 (English matches My-Copy ROT verbatim).

**Greek** (Ross OCT, verified against scan p. 37 = Bekker 413a–b):
> εἰ δ' αἴσθησιν, καὶ φαντασίαν καὶ ὄρεξιν· ὅπου μὲν γὰρ αἴσθησις, καὶ λύπη τε καὶ ἡδονή, ὅπου δὲ ταῦτα, ἐξ ἀνάγκης καὶ ἐπιθυμία.

**Significance**: Aristotle's most compact statement of the chain *aisthēsis* → *phantasia* + *orexis* → (pleasure/pain) → *epithymia*. The explicit naming of *phantasia* (φαντασία) here is the textual ground for the coextensivity reading (perception entails *phantasia* and desire), *pace* the schematic faculty-lists at 413b13 (θρεπτικῷ, αἰσθητικῷ, διανοητικῷ, κινήσει) and 414a31–32 (θρεπτικόν, αἰσθητικόν, ὀρεκτικόν, κινητικὸν κατὰ τόπον, διανοητικόν), both of which omit it.

**Cross-references**: the existing "DA II.2, 413b24" entry above (added 2026-05-23, used at §1.2 L91) records only the "where there is sensation, there is also pleasure and pain" sub-clause of *this* passage. A *parallel* pleasure/pain → desire statement occurs separately at **414b4–6** (own entry above: "whatever has a sense has the capacity for pleasure and pain … wherever these are present, there is desire, for desire is appetition of what is pleasant"). Distinct loci, not one quote. *(Correction 2026-05-30: an earlier session note questioned whether 413b contained "pleasure and pain"; the Greek above confirms it does — ὅπου μὲν γὰρ αἴσθησις, καὶ λύπη τε καὶ ἡδονή — so this single passage is verbatim-faithful, not a 413b/414b splice.)*

### DA III.10, 433b27–30 *(user-supplied 2026-05-30 — phantasia–orexis link / perceptual epithymia)*
> inasmuch as an animal is capable of appetite it is capable of self-movement; it is not capable of appetite without possessing imagination; and all imagination is either calculative or sensitive. In the latter all animals partake. (\textit{De Anima} III.10, 433b27–30)

**Source**: `Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf`, PDF p. ~51–52. **Verified**: 2026-05-30 (English matches My-Copy ROT verbatim; in source the sentence opens "To sum up, then, and repeat what I have said, inasmuch as …").

**Significance**: appetite (*orexis*/*epithymia*) is impossible without *phantasia* — the inextricability that makes perceptual *epithymia* possible. The "sensitive" species (*phantasia aisthētikē*) is the one shared by all animals, hence present wherever perception is.

### DA III.7, 431a10–14 — ALREADY IN DOC (no new entry added)
This batch's fourth quote ("To feel pleasure or pain is to act with the sensitive mean … but their being *is* different") is the latter half of the existing **DA III.7, 431a8–14** entry above (added 2026-05-23; used at §1.2 L119/L69). Not duplicated. (The user's working version italicizes "their being *is* different"; the canonical entry has plain "is.")

---

## 2026-05-31 — Rhetoric I.10: the *orexis*-division, the seven causes, the good/pleasant

Three passages from *Rhetoric* I.10, trans. W. Rhys Roberts (Revised Oxford Translation). Greek for the first two verified against the newly-added *Ars Rhetorica*, ed. Kassel (Berlin: De Gruyter, 1976), in the corpus (scan p. 49 = Bekker 1369a). Obvious transcription typos in the supplied English were corrected: "himnself" → "himself"; "change" → "chance"; "arae" → "are".

### Rhetoric I.10, 1368b33–1369a4 — the *orexis*-division *(added 2026-05-31)*
> Now every action of every person either is or is not due to that person himself. Of those not due to himself some are due to chance, the others to necessity; of these latter, again, some are due to compulsion, the others to nature. Consequently all actions that are not due to a man himself are due either to chance or to nature or to compulsion. All actions that \textit{are} due to a man himself and caused by himself are due either to habit or to desire; and of the latter, some are due to rational desire, the others to irrational. Rational desire is wishing, and wishing is a desire for good—nobody wishes for anything unless he thinks it good. Irrational desire is twofold, viz. anger and appetite. (\textit{Rhetorica} I.10, 1368b33–1369a4)

**Translation**: W. Rhys Roberts (ROT). **Greek** (ed. Kassel, scan p. 49; 1369a1–4): \gk{τὰ μὲν δι' ἔθος τὰ δὲ δι' ὄρεξιν, τῶν δὲ δι' ὄρεξιν τὰ μὲν διὰ λογιστικὴν ὄρεξιν τὰ δὲ δι' ἄλογον· ἔστι δ' ἡ μὲν βούλησις ἀγαθοῦ ὄρεξις (οὐδεὶς γὰρ βούλεται ἀλλ' ἢ ὅταν οἰηθῇ εἶναι ἀγαθόν), ἡ δ' ἄλογος ὄρεξις ὀργὴ καὶ ἐπιθυμία.} (Kassel's apparatus brackets part of the \gk{βούλησις} clause; transcribed from the scan.)

**Convention note**: Roberts here renders \gk{ὄρεξις} = "desire" (the genus), \gk{ἐπιθυμία} = "appetite" (a species), and \gk{βούλησις} = "wishing/rational desire" — the modern convention this dissertation adopts, and the **inverse** of the Smith *De Anima* (which gives \gk{ὄρεξις} "appetite," \gk{ἐπιθυμία} "desire"). Direct translation-precedent for our usage. Note the irrational species here are \gk{ὀργή} (anger) + \gk{ἐπιθυμία}; cf. *DA* II.3, 414b1–2 (\gk{ὄρεξις μὲν γὰρ ἐπιθυμία καὶ θυμὸς καὶ βούλησις}), where the three species are \gk{ἐπιθυμία}/\gk{θυμός}/\gk{βούλησις} — the spirited member named \gk{θυμός}, not \gk{ὀργή}.

### Rhetoric I.10, 1369a5–6 — the seven causes *(added 2026-05-31)*
> Thus every action must be due to one or other of seven causes: chance, nature, compulsion, habit, reasoning, anger, or appetite. (\textit{Rhetorica} I.10, 1369a5–6)

**Translation**: Roberts (ROT). **Greek** (ed. Kassel, 1369a5–7): \gk{ὥστε πάντα ὅσα πράττουσιν ἀνάγκη πράττειν δι' αἰτίας ἑπτά, διὰ τύχην, διὰ φύσιν, διὰ βίαν, δι' ἔθος, διὰ λογισμόν, διὰ θυμόν, δι' ἐπιθυμίαν.} **Note**: the spirited cause is here \gk{θυμός} (Roberts "anger"), whereas the *orexis*-division three lines above (1369a4) names it \gk{ὀργή}; in the Greek the list runs to 1369a7 (\gk{δι' ἐπιθυμίαν}), one line past the cited 1369a6.

### Rhetoric I.10, ~1369b15–29 — appetite, the habitual, and the good/pleasant *(added 2026-05-31; locus corrected + merged 2026-06-09)*
**→ Merged into `Rhetoric I.10, 1369a32–b29`** (the full per-cause passage, in the "## Aristotle — Rhetoric" section above), of which this is the closing portion ("Appetite is the cause of all actions that appear pleasant … the exchange of a greater pain for a less"). **Locus correction**: the prior "1369a16–29" was wrong — the Clean Copy PDF (Bekker margins) places this tail at **~1369b15–29** (the per-cause discussion runs 1369a32 → b29; the "To sum up" conclusion is at b20–29). Verbatim text now lives once, in the merged entry; Greek still to transcribe (Kassel ≈ p. 50).

---

## 2026-05-31 — De Memoria 2: corporeal recollection and the persistence of motions

Two passages from *De Memoria* 2, trans. J.I. Beare (ROT); both verified verbatim against `Aristotle - On Memory_(2014)_[Clean Copy].pdf` (PDF p. ~10). They ground the dual-resonance thesis's appeal to affective-kinetic persistence (the *resonant epithymia* footnote, §1.2). No Greek *De Memoria* is in the corpus, so no Greek is added here.

### De Memoria 2, 453a14–19 — recollection as a search in a corporeal substrate *(added 2026-05-31)*
> That the affection is corporeal, i.e. that recollection is a searching for an image in a corporeal substrate, is proved by the fact that some persons, when, despite the most strenuous application of thought, they have been unable to recollect, feel discomfort, which even though they abandon the effort at recollection, persists in them none the less. (\textit{De Memoria} 2, 453a14–19)

**Source/translation**: J.I. Beare (ROT); `Aristotle - On Memory_(2014)_[Clean Copy].pdf`, PDF p. ~10. **Verified**: 2026-05-31 (verbatim; the supplied "nonetheless" reads "none the less" in the source).

### De Memoria 2, 453a26–29 — anger and terror as self-sustaining motions *(added 2026-05-31)*
> For a similar reason bursts of anger or fits of terror, when once they have excited such motions, are not at once allayed, even though the angry or terrified persons set up counter motions, but the passions continue to move them on, in the same direction as at first. (\textit{De Memoria} 2, 453a26–29)

**Source/translation**: J.I. Beare (ROT); same PDF. **Verified**: 2026-05-31 (verbatim). **Significance**: the kinetic persistence of already-excited *pathē* (anger, terror) that the dual-resonance thesis generalizes to the orectic residue (*resonant epithymia*); the immediately preceding lines (453a19–25) supply the melancholic/moisture mechanism and the thrown-stone simile.
