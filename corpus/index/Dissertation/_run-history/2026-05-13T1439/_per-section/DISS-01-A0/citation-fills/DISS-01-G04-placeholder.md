# DISS-01-G04 — Placeholder Resolution

**Gap ID**: DISS-01-G04
**Section**: DISS-01-A0 (§1.1 A_0 Motion and Time)
**Line**: 77 (.md) / 79 (.tex of `1.1_A0_Motion_and_Time_OUTPUT_v2.tex`)
**Anchor in prose**: *Zeitlichkeit* and the three ecstases — Heidegger's existential-temporality recovery of Aristotelian soul-as-counter
**Tier**: A_corpus_index + ****** placeholder
**Severity**: MEDIUM
**Support tier**: T5-under-supported

## 1. Named locus (confirmed)

Heidegger, *Being and Time*, **§65 (H.328–329)**, Macquarrie-Robinson. The dissertation prose attaches the ecstases-of-*Zeitlichkeit* claim to Aristotle's *Physics* IV.14 "no time without soul" passage:

> Heidegger states the relation: "******" (SZ §65, H.328–329; Eng. ******).

The existing footnote anchors the locus: **"Temporality as the ontological meaning of care," in Heidegger's articulation of temporality as the unity of three ecstases (*Gewesenheit*, *Gegenwart*, *Zukunft*) and as the originary phenomenon from which *Innerzeitigkeit* is derived. The pertinent material is in the middle paragraphs of §65 around H.328–329, where Heidegger first introduces the three ecstases by name and characterizes their co-original unity.**

## 2. Corpus/index pipeline route (confirmed)

**Pipeline**: `corpus/index/Heidegger - Being and Time/`
**Unit**: **BT-D2-U3** (`bt-structured/bt-d2-u3.json` + `bt-analysis/phase2-bt-d2-u3.md`)
- **Sections**: §§61–66 ("Temporality as ontological meaning of care")
- **H pages**: H.301–331
- **Eng pages**: 349–380
- **Dissertation-critical**: YES (two-pass, MANDATORY)
- **Topical fit**: §65 occupies the central pages of this unit; H.328–329 are within §65 proper

## 3. Corpus/index narrative content

From `bt-structured/bt-d2-u3.json` confirming the §65 section anchors:
- **section_id**: §65
- **tags**: ["temporality", "Zeitlichkeit", "ecstases", "future", "having-been", "present", "Gewesen", "Zukunft", "Gegenwart"]
- **German terms expected**: *Zeitlichkeit*, *Ekstasen*, *Zukunft*, *Gewesenheit*, *Gegenwart*, *Augenblick*, *Vorlaufen*

The three-ecstases canonical formulation lands at H.329 in M-R, with the introductory account of temporality as "the unity of having-been-future-making-present" running from H.326 through H.331. The §1.1 dissertation prose has correctly identified H.328–329 as the canonical-naming locus.

## 4. Status of the verbatim

**Verbatim NOT directly extractable as a quotable string from corpus/index.** The BT-D2-U3 unit is flagged two-pass mandatory but the corpus/index Phase 2 narrative paraphrases the §65 ecstases-content rather than reproducing the verbatim sentence. Per `feedback-missing-source-placeholder.md`, locus is identified (BT-D2-U3 §65, H.328–329) and pipeline is routed; verbatim left for user manual fill.

## 5. Recommended action

**Per `feedback-missing-source-placeholder.md`**: leave the `******` in §1.1 line 77 for user manual fill. The dissertation footnote already narrows the locus correctly. The M-R English pages for H.328–329 are **pp. 376–377** (per BT-D2-U3 mapping H.301–331 ↔ Eng. 349–380; pdf_offset +1 confirmed in manifest).

**Best candidate verbatim**: the classic §65 ecstases-naming sentence at H.329 — "Temporality is the primordial 'outside-of-itself' in and for itself. We therefore call the phenomena of the future, the character of having been, and the Present, the 'ecstases' of temporality" (M-R p. 377). The user should verify against their copy of M-R; this is the H.329 paragraph in which Heidegger first names *Zeitlichkeit* as the unity of three *Ekstasen*.

## 6. Patch-template for user

```latex
OLD:
Heidegger states the relation: ``\textbf{******}'' 
(SZ \S 65, H.328--329; Eng.~\textbf{******}).

NEW (template — user supplies verbatim from M-R Eng. pp. 376–377):
Heidegger states the relation: ``<<VERBATIM FROM M-R pp. 376–377 (H.328–329)>>'' 
(SZ \S 65, H.328--329; Eng.~376--377).
```

## 7. Provenance footer

- Pipeline manifest: `corpus/index/Heidegger - Being and Time/bt-structured/manifest.json` (BT-D2-U3 §§61–66, H.301–331, two-pass MANDATORY)
- Corpus/index unit: `corpus/index/Heidegger - Being and Time/bt-structured/bt-d2-u3.json` (§65 section_id confirmed with full ecstases-tags)
- Cross-anchor: SZ §74 H.385–386 also referenced in the footnote for *Geschichtlichkeit* derivation (covered by BT-D2-U5 §§72–77, also two-pass mandatory)
