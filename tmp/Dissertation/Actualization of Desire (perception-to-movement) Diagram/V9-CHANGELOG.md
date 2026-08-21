# v9 Change Log — Diagram Sync Pass 2 (finalized §§1.0–1.5 v3)

**Date:** 2026-05-28
**File:** `option-b-iterations/actualization-chain-v7 — Option B v9.html` (copy of v8; v8 untouched as baseline)
**Backup:** `option-b-iterations/.backups/2026-05-28T-pre-diagram-sync-v9/` (contains v8 HTML + DIAGRAM-AUDIT-REPORT.md + V8-CHANGELOG.md baseline copies)
**Basis:** updated `DIAGRAM-AUDIT-REPORT.md` §5 closure status + `VERBATIM-GAPS-2026-05-28.md`
**Validation:** embedded JS parses via Node `vm`; 82 passage refs in diagram, all 137 resolvable keys (59 canonical + 79 aliases), 0 unresolved; brackets balanced (899 braces, 281 brackets); terminology lockdown verified at 0 hits for praxis-hexis / doxa-gate / \bflips\b / magnanimity / praxis-to-m23 / praxis-to-a1.

This pass applied the deferred §1.5 work + the 10 net-new findings v3 surfaced + the available verbatim citation layer. The 22 still-pending verbatim items are documented in `VERBATIM-GAPS-2026-05-28.md` (Phase 3); 3 prose-level items deferred to the author are documented in `DIAGRAM-AUDIT-REPORT.md` §6.

---

## A. Changes applied to v9

### Batch A — A₄ "Four Types of Action" structural restructure (audit P1 #2 → CLOSED)

The audit assumed Three Types; §1.5 v3 L128–157 specifies **Four**.

1. **A₄ "Four Types of Action — Overview" popup added** (~150 words). Names all four types in one line each (Epithymetic / Thymotic / Bouletic / Prohairetic), states the §1.5 L132–135 closing clarification (not mutually exclusive; *doxa* cross-cuts all four), points to the per-type Details popup.
2. **A₄ "Four Types — Details" popup added** (~200 words, ~50 per type). Type 1 Epithymetic (with pre-doxastic *kritikon* recoil and doxastic-appetitive sub-cases); Type 2 Thymotic (*Mitsein* / toward-whom); Type 3 Bouletic (end-aimed); Type 4 Prohairetic (deliberation completed in resolution).
3. **A₄ `passages` array added** — 8 entries (MA 701a28–b1, MA 701a7–24, DA III.10 433b10–18, DA III.7 431a8–14, DA III.3 427b21–24, Rhetoric II.1 1378a21–23, NE III.2 1111b21–30 *[VERBATIM PENDING]*, NE III.3 1112b12–19 *[VERBATIM PENDING]*).
4. **Four arrow tags refactored to four-type numbering**: pure-appetitive → "Type 1 (Epithymetic) · pre-doxastic kritikon recoil"; settled-doxai-to-m23 → "Type 4 (Prohairetic, habitual paradigm) · Technē-hexis activation"; ethical-hexis-to-m23-doxastic-ratification → "Types 2–4 (Thymotic / Bouletic / Prohairetic) · Doxa-gate modulation"; ethical-hexis-to-a1-basic-valence → "Types 2–4 · Basic-valence input modulation". Body texts within description fields aligned with the same four-type numbering.

### Batch B — `SETTLED_DOXAI` doxa-is-not-hexis cleanup (audit P1 #4 → CLOSED)

§1.5 L167 verbatim: *"they are not themselves hexeis, for a doxa is a taking-as-true, not a disposition."*

5. **Popup 3 "The practical syllogism" body rewritten**. Removed *"settled belief held as a disposition"*; replaced with *"held doxa — a taking-as-true that the rational soul has settled into routine activation. The hexis is the standing readiness to activate; the doxa is the truth-claim activated."* Adds explicit §1.5 L167 anchor.
6. **Popup 4 "Additional unmoved originator" body rewritten**. The held universal-premise doxa, activated by the technē-hexis, operates alongside A₂. The unmoved originator is the held doxa-content; the hexis is what holds it.
7. **Popup 5 "Habitual rational action" body + title updated**. Title changed from "Type 2 paradigm" to "Type 4 paradigm". Body shifts language to "held doxa" (not "settled belief held as a disposition").
8. **`greek` field rewritten** to drop the "settled doxai are one species" framing; new text: *"hexis is the broader genus (a standing readiness, the energeia of having); doxai are activated by hexeis but are not themselves dispositions — a doxa is a taking-as-true, not a hexis (§1.5 L167; Met IX.6, 1048b30–36)."*
9. **`desc` field rewritten** with Four Types numbering + explicit "via the held doxai they activate" qualification.
10. **JS comment header at line 1273 updated**: dropped "Settled doxai as hexeis" framing; new comment notes "doxai are NOT themselves hexeis ... the hexis is the standing readiness to activate, the doxa is the truth-claim activated."
11. **New popup added: "*Praxis* : *poiēsis* :: *energeia* : *kinēsis* (§1.5 L186 grounding)"**. Surfaces the Met IX.6 1048b30–36 tense-test as the deeper bivalence; explains why doxa cannot be a hexis (doxa is a *krisis*, not a standing readiness for activity).

### Batch C — Terminology lockdown sweep (audit P1 #13 → CLOSED)

Locked terminology per §1.5 v3.

12. **Arrow id rename**: `praxis-to-m23-doxa-gate` → `ethical-hexis-to-m23-doxastic-ratification` (4 string occurrences across the arrow definition, the SVG element id, the bindFlowArrow call, and adjacent comments).
13. **Arrow id rename**: `praxis-to-a1-basic-valence` → `ethical-hexis-to-a1-basic-valence` (4 string occurrences, parallel structure).
14. **Global text rename**: `praxis-hexis` → `ethical hexis` (21 instances, both lower- and upper-case variants).
15. **Global text rename**: `doxa-gate` → `doxastic ratification` (18 instances, both case variants).
16. **Verification**: full-file grep for `praxis-hexis`, `doxa-gate`, `\bflips\b`, `magnanimity`, `praxis-to-m23`, `praxis-to-a1` — all 0 hits.

### Batch D — PASSAGES registry additions (audit P1 #7/#10/#11/#12 → PARTIAL → CLOSED for what verbatim_passages.md verifies)

12 new canonical PASSAGES entries (9 verified verbatim + 3 [VERBATIM PENDING]), plus 3 supplementary GA 18 entries identified during Batch G integration. Final canonical key count: **59** (was 56 in v8 + new entries).

17. `Met. IX.6, 1048b30–36` (verbatim_passages.md line 813) — *energeia*/*kinēsis* tense-test grounding §1.5 L186 + Batch B popup.
18. `Gross 2005, p. 4` (line 898) — "pathos is the very substance" anchor; wired into A₄ Affective Architecture popup.
19. `Gross 2005, p. 26` (line 893) — "eidos of the pathē / disposition toward other humans" with Heidegger-attribution clarification; wired into A₄ Affective Architecture popup.
20. `Struever 2005, p. 109` (line 887) — passion as motion + intrusion-on-logos; wired into A₄ Affective Architecture popup.
21. `BCAP, pp. 98–99` (line 831) — the five "being-after-something" phenomena (*epithymia*/*thymos*/*boulēsis*/*doxa*/*prohairesis*); wired into A₄ Four Types popup.
22. `BT §65, H.328` (line 657) — temporality temporalizes itself.
23. `BT §65, H.329` (line 663) — three ecstases co-temporalize in equiprimordiality; wired into A3-MEMORY for the *Gewesenheit* anchor.
24. `BT §72, H.374` (line 681) — Dasein stretches itself along.
25. `BT §32, H.150` (line 638) — fore-having.
26. `Met. Δ.21, 1022b15–21` — **[VERBATIM PENDING]** placeholder for the four senses of *pathos*; wired in A₁ "Four senses of pathos" popup body where the cite is referenced.
27. `Rhetoric II.6, 1383b13–17` — **[VERBATIM PENDING]** placeholder for the shame definition; awaits §1.4 worked-example deployment.
28. `NE III.2, 1111b21–30` + `NE III.3, 1112b12–19` — **[VERBATIM PENDING]** placeholders for the Bouletic-vs-Prohairetic distinction; wired in A₄ Four Types Details popup body.
29. **Supplementary additions during Batch G**: `GA 18, p. 131`, `GA 18, p. 132`, `GA 18, p. 134` (verbatim_passages.md lines 538/557/564) — Heidegger's four-senses-of-*pathos* gloss; wired into A₁ "Four senses of pathos" popup body. (These were initially referenced in popup `cite:` fields without canonical entries; final-batch validation caught the unresolved references and the entries were added.)

### Batch E — A₄ Affective Architecture synthesis popup (audit P1 #2 partial → CLOSED)

§1.5 L234 is now a labeled subsection.

30. **A₄ "Affective Architecture of Being-in-the-World" popup added** (~200 words). Distillation of §1.5 L234–254: each Type-N action is structurally enmattered in *Befindlichkeit*; five-fold composite assembles into world-disclosure; recursive loop + hexis sedimentation jointly constitute the agent's affective architecture across episodes. Includes Gross 2005 p. 4 + p. 26 verbatim citations (advisor-rigor) and Struever p. 109. **Gross 2005 p. 4 placement note**: this popup is where the "masthead framing" Gross quote (originally proposed as a header element in earlier plan drafts) was instead folded, since the diagram has no masthead-popup structural slot and inventing one risks SVG layout drift.
31. **A₄ `passages` array extended** with 5 new entries: DA I.1 403a25–b19, Gross 2005 p. 4, Gross 2005 p. 26, Struever 2005 p. 109, BT §29 H.137. Total A₄ passages: 14.

### Batch F — Type 1 pre-doxastic *kritikon* recoil label (audit P1 #2 partial → CLOSED)

§1.5 L144 verbatim: *"The animal that startles at a sudden noise, the human being who flinches at an unexpected blow, recoils before any deliberative register is engaged. The genesis of such movement lies in the kritikon of perception itself."*

32. **`pure-appetitive` arrow subtitle updated**: *"phantasma direct to motion (no doxa engaged)"* → *"pre-doxastic kritikon recoil (Type 1 bypass; no doxa engaged)"*.
33. **`pure-appetitive` arrow tag updated**: *"Bypass · pre-rational"* → *"Type 1 (Epithymetic) · pre-doxastic kritikon recoil"*.
34. **New popup "Pre-doxastic kritikon recoil (Type 1)" added** to the `pure-appetitive` arrow. Distinguishes pre-doxastic startle/flinch (the *kritikon* of perception activates *orexis* directly) from doxastic-appetitive judgment (routes through doxastic ratification because *doxa* is involved in identifying the object). Cites DA III.7 431a8–14 + MA 701a32–33 + §1.5 L144.

### Batch G — Verbatim citation wiring (audit P1 #7/#10 → PARTIAL — closed for what verbatim_passages.md verifies)

35. **A₂ "Making-present" popup body extended** with BCAP pp. 122–125 (verbatim_passages.md line 580) for the disclosure-of-eidos framing; cite field updated.
36. **A₂ "Four senses of pathos" popup body extended** with Heidegger's four-senses gloss across BCAP pp. 131/132/134 (verbatim_passages.md lines 538/557/564); cite field updated; canonical PASSAGES entries added in late Batch D.
37. **A₂ `passages` array extended** with 4 new entries: GA 18 pp. 122–125, GA 18 p. 131, GA 18 p. 132, GA 18 p. 134. Total A₂ passages: 9.
38. **DOXA_BAND new popup added**: "Heidegger's hexis bivalence anchor (GA 18 §17, pp. 119, 125, 127–128)" — the four-anchor BCAP §17 verbatim explaining technē (reduces deliberation) vs ethical hexis (holds-open for the *kairos*). Closes the gap between the SETTLED_DOXAI Hexeis node and the doxastic-ratification gate at the DOXA_BAND level.
39. **DOXA_BAND `passages` array extended** with `GA 18 §17, pp. 119, 125, 127–128`. Total DOXA_BAND passages: 7.
40. **EMOTION_COMPOSITE `passages` array extended** with `BT §32, H.150`, `BT §65, H.328`, `BT §65, H.329`. Total EMOTION_COMPOSITE passages: 13.

### Batch H — Net-new v3 enhancements (audit §5.2 items #17–#26)

§1.5 v3 surfaced 10 enhancement opportunities not in the May-27 audit. 9 applied in v9 (#4 enargeia deferred).

41. **A3-MEMORY new popup "Resonant kinēsis ↔ Gewesenheit (§1.3 L80–83)"**. Memory's structural ground is the persisting resonant kinēsis; BT §65 H.329 makes the having-been ecstasis Heideggerian correlate. Cites §1.3 L80–83 + BT §65 H.329 + On Memory 449b22–30.
42. **A3-MEMORY `passages` array extended** with `BT §65, H.329`. Total: 4.
43. **`emotion-feedback` popup overhauled for synchronic + diachronic registers** (per §1.5 L215 "Synchronic Pass and Diachronic Sedimentation"). Title: "The Pathetic Loop (synchronic + diachronic)". Subtitle: "Synchronic pass within an episode · Diachronic sedimentation across episodes (§1.5 L215)". Tag: "Pathetic loop · synchronic + diachronic". Description body restructured into two explicit registers: synchronic (the *pathē* at A₄ are not external to the action but its constitutive form; back-shapes within the single actualization) + diachronic (cross-episode sedimentation: *Stimmung*-saturation at A₁ + corrective-faculty impairment at A₂→A₃ gate). The two registers compound across iterations.
44. **DOXA_BAND new popup "Doxastic ratification as a two-axis threshold (§1.5 L163–178)"**. Formalizes the ratification gate as two-dimensional: rational axis (*doxa* formation) + content axis (evaluative complexity); ratification fires only when both converge. Explains why Type 1 bypass-routing is structurally possible (content-axis-only firing) and why Types 2–4 are the home of higher-order *pathē*.
45. **HTML comment inserted at EMOTION_COMPOSITE declaration**: TODO note flagging that the *pathē* → civic-passions terminology rename is pending user review (per verbatim_passages.md line 925); diagram preserves "*pathē*" / "higher-order *pathē*" until user signals readiness, with explicit instructions for the eventual sweep.

### Batch I — Final consistency sweep (audit harness)

46. **Full validation harness re-run**: brackets balanced (899/899 braces, 281/281 brackets); all 82 passage refs resolve against 137 keys (59 canonical + 79 aliases); 0 unresolved; embedded JS parses via Node `vm.Script` without error.
47. **File size delta**: 4297→4410 lines (+113); 265281→286910 bytes (+22 KB) — additive in popup bodies as expected, no structural footprint change.

---

## B. PENDING — verbatim items needing verification before they can go into the diagram

All listed in `VERBATIM-GAPS-2026-05-28.md` (Phase 3 companion doc):

- **Gross 2017** *Uncomfortable Situations* pp. 3, 20, 22–23
- **Gross 2005** *Heidegger and Rhetoric* Intro pp. 1, 113–115 (authorship of pp. 113–115 may need re-verification — Struever, not Gross, at p. 109)
- **BCAP**: pp. 93–94 / 95 / 96 / 101 / 104–105 / 110 / 115 / 124 / **132–134** (p. 135 IS verified) / 173–174 / 176 / 264–265 / 277–280
- **BT**: §29 H.134 + H.138, §68b H.340, §§15–16, §81, KPM §35
- **Aristotle primary**: Met Δ.21 1022b15–21, Rhetoric II.6 1383b13–17
- **NE (new from v9 cross-check)**: NE III.2 1111b21–30, NE III.3 1112b12–19 — **immediate blockers** for v9's [VERBATIM PENDING] placeholders in the A₄ Four Types Details popup
- **Concept placeholder**: *enargeia* (Rhetoric III.11) — needs §1.4 v3 line confirmation or defer to §1.5 v4

---

## C. DEFERRED to the author — prose-level decisions (no diagram action)

Documented in `DIAGRAM-AUDIT-REPORT.md` §6:

1. **§1.0 vs §1.2 internal tension** on three-factor schema extension to perception (analogical vs direct). v3 keeps both readings; M01 caveat currently follows §1.0. Author decision needed.
2. **§1.3 L75 locus tag `(De Anima III.7, 431b12-13)`** — verbatim quotation is at 431b2 (the diagram's PASSAGES locates it correctly); prose locus tag is a drift that didn't get corrected in v3. Author errata pass needed.
3. **A₄ genus relabel** — audit suggested "Completed Action (praxis)" → "Actualization of Desire" with three terminus-types. §1.5 keeps "Completed Action (praxis)" at L95; relabel may be planned for §1.5 v4 / Part II. Author confirmation needed before v10.

---

## D. Net-new v3 enhancement items documented

See `DIAGRAM-AUDIT-REPORT.md` §5.2 items #17–#26. Of the 10 items:

- **#17 Four Types of Action** — applied in Batch A
- **#18 Affective Architecture popup** — applied in Batch E
- **#19 Articulational concretion** — already present in v8 (DOXA_BAND mode 3); no further v9 action
- **#20 Mitsein/Gewesenheit anchors** — applied in Batches G (Memory popup) + the A₄ Four Types Type 2 Thymotic body
- **#21 Five-fold composite axis elaboration** — EMOTION_COMPOSITE popup 2 already lists all five axes; no further v9 action
- **#22 Hexis bivalence philosophical grounding** — applied via Batch G's new DOXA_BAND "Heidegger's hexis bivalence anchor" popup
- **#23 Pathetic Loop synchronic + diachronic registers** — applied in Batch H (emotion-feedback overhaul)
- **#24 Doxastic ratification two-axis threshold** — applied in Batch H (DOXA_BAND new popup)
- **#25 Resonant kinēsis ↔ Gewesenheit** — applied in Batch H (A3-MEMORY new popup)
- **#26 Civic-passions terminology flag** — applied in Batch H (HTML TODO comment); awaits user signal for the eventual sweep
- **(Item #4 from earlier draft) enargeia** — **DEFERRED** to Phase 3 gap registry; the originally cited §1.5 L155/L177 locations actually discuss *Mitsein* and "vivid *phantasmata*" without naming *enargeia* lexically. Move to gap-registry pending §1.4 v3 line confirmation or §1.5 v4

---

## End-to-end success criterion (verified)

Per the original plan: *every v3 claim that the diagram needs to represent is either (a) accurately reflected in v9, or (b) explicitly documented as a verbatim gap, or (c) explicitly flagged as a prose-level question for the author. Nothing falls through.*

- (a) Reflected in v9: 47 applied changes across Batches A–I
- (b) Documented as verbatim gap: ~22 items in `VERBATIM-GAPS-2026-05-28.md`
- (c) Flagged as prose-level: 3 items in `DIAGRAM-AUDIT-REPORT.md` §6

**v9 status: complete pass. Awaiting user review + browser render verification.**
