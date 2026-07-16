# Phase 0 Overview — VR Pedagogy Secondary (Part III)

**Date:** 2026-07-15 · **Prefix:** `ped-sec-` · **Plan:** `plans/vr-pedagogy-secondary-cluster-index-plan-2026-07-15.md`
(GATE G0 signed off 2026-07-15; all §9 decisions confirmed as stated, not re-opened.)

## Cluster profile

23 secondary-literature sources on VR/desktop-3D/2D learning, presence, and simulation-based education, modeled
structurally on `corpus/index/Boredom Secondary (Part III)/`. This cluster maps *who established which
learning/experience construct* and *how it behaves across media conditions* (IVR-HMD / desktop-3D / 2D) — the
comparative literature Part III's own strata (desktop-3D vs video-only) and poles (lab=VR / deployment=2D-PC) must
be read against.

**Final unit count: 23** — exactly the plan's provisional §1C count; no drift, no haystacks, no merges.

| Strand | Label | Units | Range |
|---|---|---|---|
| A | Presence: concept & measurement (foundations) | 3 | ped-sec-01..03 |
| B | Theories & frameworks of VR learning (pedagogy models) | 4 | ped-sec-04..07 |
| C | Media-comparison & process experiments (IVR vs desktop-3D vs 2D) | 7 | ped-sec-08..14 |
| D | Simulation-based & desktop-3D learning in professional education | 6 | ped-sec-15..20 |
| E | Reviews, agendas & constraints | 3 | ped-sec-21..23 |

External citation-hub guesses (to verify during Phase 3 citation-network authoring): **Makransky** (hub author,
6 in-cluster units: ped-sec-06/09/10/11/12/17 — the cluster's densest intra-cluster citation network), **Mayer**
(hub author, 3 in-cluster units: ped-sec-07/08/13), **Slater, Mel** (presence/immersion theory, expected external
cite across Strand A/C), **Sweller, John** (cognitive load theory, expected external cite in Strand B/C's
cognitive-load route), **Witmer & Singer** (already in-cluster, ped-sec-02, likely also cited externally as the
presence-questionnaire standard).

## De-duplication (Phase −1 findings, confirmed at Phase 0)

Of 24 files on disk in `corpus/pedagogy/`: **23 map 1:1 to units**; **1 file excluded** (Synnott — misfiled
trolling/investigative-psychology paper with zero VR-pedagogy content; confirmed at GATE G0). No haystacks, no
exact-duplicate md5 matches, no merges. 23 + 1 = 24, matching disk count exactly.

**OCR audit (re-run this session):** the Phase −1 scratchpad from the plan's 2026-07-15 authoring session was
session-specific and did not persist, so all 23 non-excluded sources were re-extracted via `pdftotext` into this
session's scratchpad. Result matches the plan's prediction exactly: 22/23 sources extract cleanly
(4,281–21,903 words, proportionate to page count); exactly one — **Lombard & Ditton (1997), ped-sec-01** — yields
**0 words** (image-only 69pp web printout of a standard journal article). **OCR-LOW flag confirmed** for ped-sec-01
only. Per plan §5 Phase 0 and §1B, the ped-sec-01 Phase-2 agent reads the PDF directly via `Read` in ≤10pp chunks
rather than working from a `.txt` extraction; no OCR reprocessing detour (plan §9 decision 5).

## Bridge-anchor status

- **VLE (King–Salvo)** (`corpus/index/Virtual Learning Environments (King–Salvo)/`): confirmed present on disk.
  Bridge units: `vle-01-deployment-survey`, `vle-02-boredom-raw-dataset`, `vle-03-exemplar-bank`,
  `vle-04-mark-attention-span`; ontology at `_synthesis/book-level-ontology.md`. Per anchor discipline, bridge to
  these units — never re-describe the VLE's own survey/dataset/study apparatus.
- **Boredom Experiment (VR Attention Study)**: confirmed **not yet built** on disk as of this Phase 0 pass
  (`corpus/index/Boredom Experiment (VR Attention Study)/` absent). Per plan §9 decision 4, `grounds-measure`
  bridges to this anchor were left as flagged `****** UNVERIFIED:` pointers rather than blocking cluster
  construction. **[UPDATE 2026-07-16: those 24 `grounds-measure` edges were RETIRED (rescope) — the pedagogy
  cluster informs Part III's VLE evaluation, not the boredom *lab* dataset; each source's real relationships
  are already carried by its `bridges-to-part-iii`/`bridges-to-vle` edges. Three anticipatory bridges to the
  dataset survive (ped-sec-14, ped-sec-12, ped-sec-01). See `bridge-sources/anchor-pointers.md` and
  `plans/boredom-experiment-channel-schema-anchor-plan-2026-07-16.md`.]**
- **Boredom Secondary (Part III)** (cross-cluster kinship, not a formal anchor): Strand F (Haj-Bolouri, Lin, Nacke
  — VR/immersion/engagement) overlaps thematically; add an optional `cites-cluster` edge to the relevant
  `bor-sec-NN` id only where a unit here genuinely engages one of those sources — no floor requirement.

## Judgment calls

None required at Phase 0 — the plan's §1C unit table, §1B dedup table, and OCR-audit prediction all verified
exactly on re-extraction. No `manifest.json → planCorrections` entries needed at this phase.

## Update — post-Phase-1 extension (2026-07-15): 11 new sources, Strand F added

After Phase 1 completed for the original 23 units, the user added 11 new PDFs to `corpus/pedagogy/`, all bearing on
**social presence theory in education** — the foundational CMC/online-learning tradition (Short et al.'s 1976
theory, operationalized by Gunawardena & Zittle 1997; Garrison/Anderson/Archer's 1999 Community of Inquiry
framework; Tu 2002; Richardson & Swan 2003; Biocca/Burgoon/Harms 2003; Kreijns/Kirschner/Jochems 2003;
Terry & Doolittle 2019; capped by Richardson et al.'s 2017 meta-analysis) plus two VR-specific bridge pieces
(De Back/Tinga/Louwerse 2021; VanderMeer et al. 2023) connecting that tradition to the VR/immersive literature
already in the cluster, plus a Dalgarno & Lee (2012) followup to already-in-cluster ped-sec-04.

Added as **`ped-sec-24`** (Strand B extension, Dalgarno & Lee followup) and **`ped-sec-25`..`ped-sec-34`**
(new **Strand F — Social presence theory: CMC foundations & VR-collaborative applications**, 9 units). Strand F
directly grounds the `social presence / co-presence` construct-axis row — present in the plan's §3 vocabulary since
G0 but previously ungrounded by any dedicated source, structurally identical to how the Boredom cluster's
bor-sec-25/26 (Elpidorou) additions grounded a previously-ungrounded construct row.

**Mislabeling caught and resolved before any content was built:** one of the user's supplied files, filed as
"De Back, Tycho, et al. — Learning in immersed collaborative virtual environments... (2021).pdf", was verified via
`pdfinfo`/`pdftotext` to actually contain a different paper — Terry & Doolittle (2019), "Re-examining Social
Presence." Flagged to the user before building; user renamed the file to its true identity and separately supplied
the genuine De Back, Tinga & Louwerse (2021) paper. Built as `ped-sec-31` (Terry & Doolittle) and `ped-sec-33`
(De Back et al.) respectively — no unit was ever built under a false attribution.

**OCR audit (extension batch):** all 11 new sources extract cleanly via `pdftotext` (5,565–15,781 words,
proportionate to page count). No OCR-LOW flags.

**Revised final unit count: 34** (23 original + 11 added). Full detail in `manifest.json → planCorrections`.

## Next step

Phase 1 metadata for ped-sec-24..34 (batches of ~8) → Phase 2 (deep per-unit trios, one agent per unit, all 34
units) → Phase 3 (cluster synthesis, main loop) → Phase 4 (bridge pointers) → Phase 5 (compiler wiring + GATE G1).
