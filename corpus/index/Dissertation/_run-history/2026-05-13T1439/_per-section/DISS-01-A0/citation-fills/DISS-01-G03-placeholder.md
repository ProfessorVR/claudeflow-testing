# DISS-01-G03 — Placeholder Resolution

**Gap ID**: DISS-01-G03
**Section**: DISS-01-A0 (§1.1 A_0 Motion and Time)
**Line**: 65 (.md) / 67 (.tex of `1.1_A0_Motion_and_Time_OUTPUT_v2.tex`)
**Anchor in prose**: *Innerzeitigkeit* — Heidegger's engagement with Aristotle's time-as-number-of-motion definition
**Tier**: A_corpus_index + ****** placeholder
**Severity**: MEDIUM
**Support tier**: T5-under-supported

## 1. Named locus (confirmed)

Heidegger, *Being and Time*, **§81 (H.421–422)**, Macquarrie-Robinson. The dissertation prose introduces *Innerzeitigkeit* in relation to Aristotelian *Physics* IV.11 time-as-number-of-motion:

> Heidegger states the relation in his explicit engagement with Aristotle's definition: "******" (SZ §81, H.421–422; Eng. ******).

The existing footnote anchors the locus: **"Within-time-ness and the genesis of the ordinary conception of time," in Heidegger's explicit engagement with Aristotle's definition of time as the number of motion. Heidegger here characterizes the Aristotelian definition as the most rigorous philosophical account of the time encountered in everyday concern, while indicating that the analysis leaves unthematized the originary temporality from which *Innerzeitigkeit* derives.**

## 2. Corpus/index pipeline route (confirmed)

**Pipeline**: `corpus/index/Heidegger - Being and Time/`
**Unit**: **BT-D2-U6** (`bt-structured/bt-d2-u6.json` + `bt-analysis/phase2-bt-d2-u6.md`)
- **Sections**: §§78–83 ("Within-time-ness; ordinary conception of time")
- **H pages**: H.404–437
- **Eng pages**: 456–488
- **Topical fit**: §81 lands in this unit (its §80–§81 transition is at H.420)
- **Dissertation-critical flag**: NO (the §1.1 author has flagged this engagement as load-bearing for the dissertation regardless)

## 3. Corpus/index narrative content (paraphrase available)

§81 is the locus where Heidegger names Aristotle's *Physics* IV definition as "the canonical philosophical conception of time" and **explicitly cites the Bekker locus** *Physics* Δ.11, 219b1–2 (the *ἀριθμὸς κινήσεως κατὰ τὸ πρότερον καὶ ὕστερον* definition). Heidegger's framing: Aristotle's analysis fixes the "now-time" stratum of *Innerzeitigkeit* but does not thematize the originary temporality (*Zeitlichkeit*) from which it is derived. The §81 H.421–422 paragraphs are the explicit Aristotle-engagement; the surrounding §§79–80 + §82–83 supply the existential-derivation argument.

## 4. Status of the verbatim

**Verbatim NOT directly extractable as a quotable string from corpus/index.** The BT-D2-U6 unit is not flagged as two-pass mandatory and the corpus/index narrative does not reproduce the §81 H.421–422 verbatim sentence. Per `feedback-missing-source-placeholder.md`, locus is identified and pipeline is routed; verbatim left for user manual fill.

## 5. Recommended action

**Per `feedback-missing-source-placeholder.md`**: leave the `******` in §1.1 line 65 for user manual fill. The dissertation footnote already narrows the locus correctly. The exact M-R English page for H.421 is **p. 473**; for H.422 is **p. 474** (per the BT-D2-U6 H/Eng mapping H.404–437 ↔ Eng. 456–488).

**Best candidate verbatim**: a likely fill is Heidegger's signature §81 sentence acknowledging Aristotle's "canonical" status: *"This conception of time [Aristotle's] has remained, in spite of many variations and revisions, the leading conception of time"* (or similar; user verifies against M-R p. 473). The user should select a sentence that directly engages the *Physics* IV.11 definition (e.g., the paragraphs at H.421 that identify Aristotle's account as the "definitive philosophical interpretation" while subsuming it under within-time-ness).

## 6. Patch-template for user

```latex
OLD:
Heidegger states the relation in his explicit engagement with Aristotle's 
definition: ``\textbf{******}'' (SZ \S 81, H.421--422; Eng.~\textbf{******}).

NEW (template — user supplies verbatim from M-R Eng. pp. 473–474):
Heidegger states the relation in his explicit engagement with Aristotle's 
definition: ``<<VERBATIM FROM M-R pp. 473–474 (H.421–422)>>'' 
(SZ \S 81, H.421--422; Eng.~473--474).
```

## 7. Provenance footer

- Pipeline manifest: `corpus/index/Heidegger - Being and Time/bt-structured/manifest.json` (BT-D2-U6 §§78–83, H.404–437)
- Corpus/index unit: `corpus/index/Heidegger - Being and Time/bt-structured/bt-d2-u6.json` (§81 section_id confirmed, German terms expected: *Innerzeitigkeit*, *Jetzt*, *Jetztzeit*, *Uhr*, *Einebnung*)
- Bekker cross-anchor: *Physics* Δ.11, 219b1–2 (Aristotelian time-as-number-of-motion definition); cf. `corpus/index/Aristotle - Complete Works/aristotle-phys-04.json`
