# Phase 0 Overview — Boredom Secondary (Part III)

**Date:** 2026-07-14 · **Prefix:** `bor-sec-` · **Plan:** `plans/boredom-secondary-cluster-index-plan-2026-07-14.md`

## Cluster profile

44 secondary-literature sources on boredom (philosophy + hard science), modeled on the RDR2 Secondary and
Aristotelian Phantasia Secondary clusters. This cluster maps *who established which boredom construct* and
*which physiological signature*, feeding Part III's empirical analysis of student boredom (survey/EEG/eye-tracking)
and bridging to two existing/planned anchors: Heidegger's FCM (primary phenomenological source for the three forms
of boredom) and the Boredom Experiment (VR Attention Study) dataset entry.

**Final unit count: 46** (44 planned + 2 added — see Deviations below), organized into 7 strands (the plan's own
header says "six strands" but lists seven letters A–G; 46 units genuinely span 7 groups):

| Strand | Label | Units | Humanities/STEM |
|---|---|---|---|
| A | Heideggerian / phenomenological boredom | 14 | Humanities |
| B | Boredom, mood & education | 5 | Humanities-pedagogy |
| C | Psychology / cognitive science of boredom | 7 | Humanities/behavioral |
| D | EEG / neurophysiology of boredom | 7 | STEM |
| E | Eye-tracking / gaze / pupillometry | 8 | STEM-methods |
| F | VR / immersion / engagement | 3 | STEM-applied |
| G | Books / edited volumes (chapter-selective) | 2 | Humanities (long-form) |

External citation-hub guesses (to verify during Phase 3 citation-network authoring): **Heidegger** (FCM, primary
source for Strand A/B), **Elpidorou** (already in-cluster via 7 units — see Strand A/C — likely also an external hub
cited by others), **Eastwood & Danckert** (boredom-as-attention-lapse; expect citations across Strand C/D),
**Csikszentmihalyi** (flow, the contrast pole in Strand F/theme list), **Mann & Robinson** (boredom-proneness scale,
expect citations in Strand C/D self-report methodology).

## De-duplication / haystack resolution (applied per plan §1B, with two corrections)

Of 49 files on disk in `corpus/boredom/`:
- **44 files map 1:1 to units** (including the 2 added Elpidorou papers — see Deviations).
- **2 files are haystack containers**, each yielding exactly 1 extracted unit (net +2 units): the 781pp
  `Human Computer Interaction - 2019.pdf` (INTERACT 2019 proceedings) → **GazeMotive** (bor-sec-41, PDF pp.564–568 /
  book pp.544–548, confirmed by the paper's own DOI citation and by inspecting the pages immediately before/after
  the extracted range); and `Predicting Affect from Gaze Data...pdf` (727pp, ITS-2014 proceedings — see Deviation 2
  below) → **Jaques et al.** (bor-sec-40, PDF pp.55–64).
- **3 files are pure exclusions**, contributing 0 units: the exact-duplicate eye-tracking-metrics `(1).pdf` copy
  (md5-confirmed), the redundant `Intelligent Tutoring Systems.pdf` copy of the ITS-2014 proceedings (md5-confirmed
  identical to the file above), and the Yakobi preprint variant (different md5, same study as the published version
  analyzed as bor-sec-32).

44 + 2 (haystack) = 46. All dedup/haystack claims were verified directly (md5sum, pdfinfo, pdftotext page-boundary
search) rather than taken on faith — see `manifest.json`'s `excluded` array for exact md5s and reasoning.

**OCR audit:** pdftotext word-count sanity check across all 49 sources found no near-empty extractions; every
source's word count is proportionate to its page count (lowest: 1656 words / 4pp for Aho's short commentary,
consistent with genuine text-layer content, not a scan artifact). **No OCR-LOW flags raised** — no source requires
the ≤10pp-at-a-time `Read`-on-PDF fallback.

## Deviations from the written plan (flagged for the record, not silently applied)

1. **Two source files were missing from the plan's own §1A/§1B tables**: `Elpidorou - The Bored Mind is a Guiding
   Mind - Toward a Regulatory Theory of Boredom (2018).pdf` and `Elpidorou - The Good of Boredom (2018).pdf`. Both
   are on disk in `corpus/boredom/` but never named as units, drops, or merges anywhere in the plan. These are
   functional/regulatory-account pieces (not phenomenological readings), and they are the natural primary sources
   for the plan's own §4 debate axis ("Elpidorou's regulatory good vs. deficit accounts") and §3 construct row
   ("boredom-as-regulatory-signal"), which otherwise would have had no dedicated in-cluster grounding. **User
   confirmed 2026-07-14: add them.** Added as `bor-sec-25` / `bor-sec-26` in Strand C.

2. **The plan's §1B dedup table was factually wrong about one file.** It stated `Predicting Affect from Gaze Data
   during Interaction with an Intelligent Tutoring System.pdf` "is the single extracted paper" (as opposed to
   `Intelligent Tutoring Systems.pdf`, which it correctly identified as a duplicate to drop). In fact, `pdfinfo`
   shows the "single paper" file is **727 pages**, and `md5sum` confirms it is byte-identical to `Intelligent
   Tutoring Systems.pdf` — both are the full ITS-2014 proceedings volume; neither is a standalone paper. This was
   caught by checking page counts and md5s directly rather than trusting the plan's characterization. Resolved by
   applying the same haystack-extraction method already specified for GazeMotive: located the actual paper (Jaques,
   Conati, Harley & Azevedo) via page-boundary search, confirmed clean start (title/abstract, PDF p.55) and end
   (reference #32, PDF p.64, with an unrelated paper — "It's Written on Your Face" — beginning immediately after).
   Extracted with `pdftotext -f 55 -l 64` → `bor-sec-40`.

3. **One depth-classification judgment call** not made explicit in the plan: `Holmqvist et al. — Eye tracking:
   empirical foundations for a minimal reporting guideline` (53pp) is classified `deep-long` (comprehensive
   methodological review, more than double the length of any other Strand E article) rather than plain `deep`.
   `GazeMotive` (5pp extracted) and the Jaques et al. ITS paper (10pp extracted) are classified `map` under the
   rubric's explicit "haystack-derived" clause.

4. **Two minor items flagged for verification during Phase 1** (not blocking, will resolve from each PDF's own
   title page): `bor-sec-11` (`Hernandez-Alvarez-Pallares (1).pdf`) — filename doesn't exactly match the plan's
   attributed author "Hernández Albarracín"; and `bor-sec-44` (`Nacke, L. and Craig, L. - Flow and Immersion in
   First-Person Shooters.pdf`) — plan attributes this to "Lindley & Nacke" but the filename says "Nacke and Craig."

   **`bor-sec-44` RESOLVED at Phase 4 (2026-07-14)** — canonical citation is **Nacke, L., & Lindley, C. A. (2008)**,
   FuturePlay 2008, ACM 978-1-60558-218-4. Both prior attributions were wrong: the plan reversed the author order, the
   filename mis-parsed Lindley's given name *Craig* as his surname. The year, null until Phase 4, is 2008. It took two
   passes — the Phase-1 check endorsed the plan on the strength of a non-layout `pdftotext` dump that interleaved the
   two-column byline. See `manifest.json` → `planCorrections` and `contested-readings.md` → CR-12c.
   **`bor-sec-11` remains open** — author still carries an "(author verification needed)" marker, and the unit has no year.

## Bridge-anchor status

- **FCM** (`corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/`): confirmed present, `_synthesis/
  book-level-ontology.md` uses the exact header format this cluster's compiler wiring will replicate. Bridge units:
  `fcm-04-first-form`, `fcm-05-second-form`, `fcm-06-third-form`, `fcm-07-particular-profound`.
- **Boredom Experiment (VR Attention Study) dataset entry**: confirmed **not yet built** on disk as of this Phase 0
  pass. Per the plan's own decision 4, `grounds-measure` bridges will be left as flagged `****** UNVERIFIED:`
  pointers rather than blocking cluster construction.

## Update — Strand B execution (post-Phase-0 correction)

During Strand B execution, **bor-sec-18 (planned as "Standish, P., 2015, Can Boredom Educate Us?") was found to have no valid source.** The on-disk PDF for that filename is a mislabeled duplicate of Mertel (2020) "Heidegger, Technology and Education" — confirmed independently via `pdfinfo` embedded metadata (Title: "Heidegger, Technology and Education", Subject: "J Philosophy of Edu 2020.54:467-486", same CreationDate as the correctly-labeled Mertel PDF) and a full-text diff against the Mertel extraction (identical article, only cosmetic OCR/download-source differences). The actual paper carrying this title is **Mansikka, J.-E. (2008/2009), "Can Boredom Educate Us? Tracing a Mood in Heidegger's Fundamental Ontology from an Educational Point of View," *Studies in Philosophy and Education* 28(3):255–268** — not by Standish, not dated 2015, and not present anywhere in `corpus/boredom/` or elsewhere in this project.

The deep-read agent assigned to bor-sec-18 correctly refused to fabricate a unit under a false attribution (i.e., paraphrasing Mertel's content and presenting it as "Standish, P. 2015") rather than silently proceeding. As a side effect of this investigation, Gibbs's (bor-sec-07) citation of "Mansikka (2009)" was independently confirmed accurate — no error there.

**Cluster total revised: 46 → 45 units**, pending a user decision on bor-sec-18: either source the real Mansikka (2009) PDF so a genuine unit can be built, or drop the slot permanently. Strand B otherwise complete (4/5 units: Aroles & Küpers, Feldges, Mertel, Thomson), all verified on disk with edge floors met. Three of these four honestly reported thin-to-nil direct FCM/boredom engagement in their sources (correctly not fabricating bridges-to-fcm edges, since that requirement is Strand-A-specific per the plan) — construct engagement was still captured via legitimate analogical mappings, clearly flagged as our own interpretive move.

## Next step

Strand A (14 units) — metadata + deep-read agents, per-strand pacing as agreed. Pausing here for go-ahead.
