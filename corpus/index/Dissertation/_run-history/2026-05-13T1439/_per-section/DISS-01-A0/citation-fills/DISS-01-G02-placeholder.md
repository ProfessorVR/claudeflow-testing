# DISS-01-G02 — Placeholder Resolution

**Gap ID**: DISS-01-G02
**Section**: DISS-01-A0 (§1.1 A_0 Motion and Time)
**Line**: 51 (.md) / 53 (.tex of `1.1_A0_Motion_and_Time_OUTPUT_v2.tex`)
**Anchor in prose**: *Bewandtnis* (involvement) — being-in-the-world's referential-totality structure
**Tier**: A_corpus_index + ****** placeholder
**Severity**: MEDIUM
**Support tier**: T5-under-supported

## 1. Named locus (confirmed)

Heidegger, *Being and Time*, **§18 (H.84)** in the Macquarrie-Robinson translation (Blackwell 1962). The dissertation prose introduces *Bewandtnis* in §1.1's resonance with the relational structure of *kinēsis*:

> Heidegger states the structural claim in *Being and Time* §18: "******" (SZ §18, H.84; Eng. ******).

The existing footnote identifies the topical anchor: **"Involvement and Significance: the Worldhood of the World," opening paragraphs articulating how involvement (*Bewandtnis*) is the structural character of entities encountered within the world, and how the totality of involvements (*Bewandtnisganzheit*) is grounded in the for-the-sake-of-which (*Worumwillen*) of Dasein's own existence.**

## 2. Corpus/index pipeline route (confirmed)

**Pipeline**: `corpus/index/Heidegger - Being and Time/`
**Unit**: **BT-D1-U2** (`bt-structured/bt-d1-u2.json` + `bt-analysis/phase2-bt-d1-u2.md`)
- **Sections**: §§14–18 ("Worldhood: equipment, readiness-to-hand, significance")
- **H pages**: H.63–88
- **Eng pages**: 91–121
- **Dissertation-critical**: YES (two-pass, MANDATORY)
- **Topical fit**: §18 occupies H.83–88 (the closing 5 H-pages of the unit); H.84 lands on the second H-page of §18

## 3. Corpus/index narrative content (for paraphrase if needed)

From `phase2-bt-d1-u2.md`, §2.5 "Involvement, significance, and the formal structure of worldhood (§18)":

> The Being of the ready-to-hand is involvement (*Bewandtnis*): to say that an entity has the character of reference or assignment means it has in itself the character of "having been assigned or referred" (*Verwiesenheit*). With any such entity, there is an involvement in something — letting it be involved (*Bewendenlassen*).
>
> The totality of involvements is constitutive for readiness-to-hand, and is "earlier" than any single item of equipment. Involvements go back through chains of "towards-which" (*Wozu*) until they reach a "towards-which" that is no further involvement: the **for-the-sake-of-which** (*Worumwillen* / *Umwillen*), which pertains to Dasein's own Being.
>
> "Letting something be involved" (*Bewandtnis haben lassen*) is the *a priori* condition for encountering anything ready-to-hand. Ontologically, it means previously freeing entities within-the-world for their readiness-to-hand; ontically, it means letting things be in our factical concern as they already are.

The corpus/index narrative explicitly anchors *Bewandtnis* at H.84 (per the German-terms table in `phase2-bt-d1-u2.md` §7): "*Bewandtnis* | involvement | 84, 85, 86, 87 | true | M/R extensive footnote (H.84 fn.2): among the most difficult terms; 'turning,' 'tendency,' 'course.' Rendered via 'involve' and 'involvement' as closest."

## 4. Status of the verbatim

**Verbatim NOT directly extractable as a quotable string from corpus/index.** The corpus/index narrative paraphrases Heidegger's §18 H.84 claim but does not reproduce the German-original or Macquarrie-Robinson English-page verbatim sentence. Per `feedback-missing-source-placeholder.md`, locus is identified (BT-D1-U2 §18, H.84) and pipeline is routed; verbatim left for user manual fill.

## 5. Recommended action

**Per `feedback-missing-source-placeholder.md`**: leave the `******` in §1.1 line 51 for user manual fill. The dissertation footnote already narrows the locus correctly to "opening paragraphs of §18 articulating how involvement is the structural character of entities" — H.84 is the canonical first-mention page for *Bewandtnis* as an ontological determination.

**Best candidate verbatim**: the M-R English page for H.84 is **p. 115** (Macquarrie-Robinson 1962). The classic sentence at H.84 — "Being-ready-to-hand within-the-world has, with the entity that is ready-to-hand, the kind of Being characteristic of involvement (*Bewandtnis*)" — is the natural fill, but the user should verify against their copy of Macquarrie-Robinson.

## 6. Patch-template for user

```latex
OLD:
Heidegger states the structural claim in \textit{Being and Time} \S 18: 
``\textbf{******}'' (SZ \S 18, H.84; Eng.~\textbf{******}).

NEW (template — user supplies verbatim from M-R Eng. p. 115):
Heidegger states the structural claim in \textit{Being and Time} \S 18: 
``<<VERBATIM FROM M-R p. 115 (H.84)>>'' (SZ \S 18, H.84; Eng.~115).
```

## 7. Provenance footer

- Pipeline manifest: `corpus/index/Heidegger - Being and Time/bt-structured/manifest.json` (BT-D1-U2 §§14–18, H.63–88, two-pass MANDATORY)
- Corpus/index narrative: `corpus/index/Heidegger - Being and Time/bt-analysis/phase2-bt-d1-u2.md` §2.5 (§18 narrative)
- M-R English-page for H.84 confirmed via the BT pdf_offset (+1 per manifest) and the established M-R H.84 ↔ Eng.115 correspondence in the BT-D1-U2 H-pages-to-Eng-pages mapping (H.63–88 ↔ Eng. 91–121).
