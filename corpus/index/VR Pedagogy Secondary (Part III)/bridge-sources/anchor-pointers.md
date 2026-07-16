# Anchor Pointers — DO NOT RE-DIGEST

This cluster is a **secondary-literature** entry. Its bridges point *outward* to two anchor entries
that hold the dissertation's own primary material; that material is **never duplicated here**, only
pointed at (plan §0, §5 Phase 4).

The two anchors:

- **VLE (King–Salvo)** — `corpus/index/Virtual Learning Environments (King–Salvo)/` — the **active**
  primary-object anchor. Its units `vle-01…vle-04` carry the deployment survey, the boredom dataset,
  the exemplar bank, and the Mark attention-span digest. Each `bridges-to-vle` edge in this cluster's
  `global-edges.csv` names the specific `vle-0N` unit it grounds. Pointers below; the digests live
  there, not here.
- **Boredom Experiment (VR Attention Study) dataset** — the EEG/HMD/self-report dataset anchor (the
  lab/VR pole). This entry **is not yet built** (anchor build = Phase 2 of the rescoped plan).
  **RESCOPED 2026-07-16:** the 24 `grounds-measure` edges that pointed the pedagogy literature *at* this
  lab dataset were **retired** — they were backwards. This cluster is Part III LIT-SLOT literature for
  evaluating the deployed VLEs; the boredom lab is upstream of the phenomenology (it feeds the FCM
  apparatus + Part III M2/M3), not grounded by this literature. Each source's real relationships are
  already carried by its `bridges-to-part-iii` / `bridges-to-vle` edges. **Three anticipatory bridges to
  the dataset survive** (repointed when the anchor is built): ped-sec-14 (`bridges-to`), ped-sec-12 and
  ped-sec-01 (`bridges-to-part-iii`). Note `vle-02-boredom-raw-dataset` is the anonymized-derivative view
  of this same study that already exists under the VLE anchor.

The VLE anchor units (one line each; read them at the VLE entry, do not re-summarize here):

| Anchor unit | What it is |
|---|---|
| `vle-01-deployment-survey` | The deployment survey — N=241, 873 open responses, APP vs VID strata, F1–F8 findings (the 2D-PC deployment pole). |
| `vle-02-boredom-raw-dataset` | The anonymized boredom dataset derivative — S01–S08, per-video self-report, four load-bearing cases (the lab=VR pole). |
| `vle-03-exemplar-bank` | Curated verbatim respondent quotes — frictions, monotony/passivity, divergence candidates. |
| `vle-04-mark-attention-span` | Gloria Mark, *Attention Span* (2023) quotation catalog — the attention-span literature justification. |

## Per-unit anchor pointers

For each cluster unit: the VLE anchor unit(s) its `bridges-to-vle` edges target; its count of
`bridges-to-part-iii` edges (framing/caution pointers into the dissertation, itemized in each unit's
`-edges.csv`); and its Boredom-dataset status (all 24 `grounds-measure` pointers **retired 2026-07-16**;
"—" = never carried one or is a surviving bridge, see notes). Rows built from `_synthesis/global-edges.csv`
(authoritative), not hand-transcribed.

| Unit | Source | Strand | → VLE anchor unit(s) | → Part III (n) | → Boredom dataset |
|---|---|---|---|---|---|
| ped-sec-01 | Lombard & Ditton 1997 | A | vle-01 | 4 | — |
| ped-sec-02 | Witmer & Singer 1998 | A | vle-01, vle-04 | 1 | retired |
| ped-sec-03 | Chow 2016 | A | vle-01 | 2 | retired |
| ped-sec-04 | Dalgarno & Lee 2010 | B | vle-03, vle-04 | 1 | retired |
| ped-sec-05 | Fowler 2015 | B | vle-03 | 2 | — |
| ped-sec-06 | Makransky & Petersen 2021 (CAMIL) | B | vle-01, vle-04 | 1 | retired |
| ped-sec-07 | Mayer et al. 2022 | B | vle-01, vle-04 | 2 | retired |
| ped-sec-08 | Parong & Mayer 2018 | C | vle-04 | 2 | retired |
| ped-sec-09 | Makransky & Lilleholt 2018 | C | vle-01, vle-04 | 1 | retired |
| ped-sec-10 | Makransky et al. 2019 | C | vle-04 | 2 | retired |
| ped-sec-11 | Makransky & Petersen 2019 | C | vle-01 | 2 | retired |
| ped-sec-12 | Makransky et al. 2019 (home/classroom) | C | vle-01 | 4 | retired |
| ped-sec-13 | Parong & Mayer 2021 | C | vle-02, vle-04 | 3 | retired |
| ped-sec-14 | Barrett et al. 2022 | C | vle-01, vle-04 | 3 | — |
| ped-sec-15 | Cook et al. 2011 | D | — *(bridges to Part III directly)* | 3 | — |
| ped-sec-16 | Merchant et al. 2012 | D | vle-01 | 3 | retired |
| ped-sec-17 | Makransky et al. 2016 | D | vle-01 | 2 | — |
| ped-sec-18 | Dubovi et al. 2017 | D | vle-01 | 3 | retired |
| ped-sec-19 | Kononowicz et al. 2019 | D | vle-01 | 2 | retired |
| ped-sec-20 | Roe et al. 2019 | D | — *(bridges to Part III directly)* | 1 | — |
| ped-sec-21 | Potkonjak et al. 2016 | E | vle-01 | 2 | — |
| ped-sec-22 | Radianti et al. 2020 | E | vle-01, vle-04 | 3 | retired |
| ped-sec-23 | Cossio et al. 2025 | E | — *(bridges to Part III directly)* | 2 | retired |
| ped-sec-24 | Dalgarno & Lee 2012 | B | vle-01, vle-03 | 1 | — |
| ped-sec-25 | Gunawardena & Zittle 1997 | F | vle-01, vle-03 | 1 | retired |
| ped-sec-26 | Garrison, Anderson & Archer 1999 (CoI) | F | vle-01, vle-03 | 2 | — |
| ped-sec-27 | Tu 2002 | F | vle-01 | 2 | retired |
| ped-sec-28 | Richardson & Swan 2003 | F | vle-01 | 2 | retired |
| ped-sec-29 | Biocca, Burgoon & Harms 2003 | F | vle-01, vle-03 | 1 | retired |
| ped-sec-30 | Kreijns, Kirschner & Jochems 2003 | F | vle-01, vle-03 | 1 | retired |
| ped-sec-31 | Terry & Doolittle 2019 | F | vle-01, vle-03 | 1 | retired |
| ped-sec-32 | Richardson et al. 2017 (meta) | F | vle-01 | 3 | retired |
| ped-sec-33 | De Back, Tinga & Louwerse 2021 | F | vle-01, vle-03, vle-04 | 1 | retired |
| ped-sec-34 | VanderMeer et al. 2023 | F | vle-01 | 2 | — |

Totals: 31/34 units carry ≥1 `bridges-to-vle` edge; the other 3 (ped-sec-15, ped-sec-20, ped-sec-23)
bridge to Part III directly with no single VLE-unit target. All 34 units carry ≥1 bridge edge of some
kind (quality-gate invariant). **0/34 now carry a `grounds-measure` pointer** — all 24 retired 2026-07-16;
3 anticipatory bridges to the dataset survive and were **repointed 2026-07-16 to the now-built anchor**
(ped-sec-14 `bridges-to` → `Boredom Experiment (VR Attention Study)#ch-stimulus`; ped-sec-12 and ped-sec-01
`bridges-to-part-iii`). `vle-01` is the
dominant target (28 edges) — the deployment survey is where most of this literature's constructs and
cautions land; `vle-02` (raw boredom dataset) is touched only by ped-sec-13, the one unit with an
EEG-workload measure to align against it.

## The Boredom-dataset grounds-measure edges — RETIRED 2026-07-16

The 24 `grounds-measure` edges that formerly reserved a pointer from these units to the Boredom
Experiment dataset were **deleted** (from each unit `-edges.csv`, `global-edges.csv`, and each unit
`.json` `bridges` block). Rationale (see `plans/boredom-experiment-channel-schema-anchor-plan-2026-07-16.md`):
this cluster is Part III LIT-SLOT literature for evaluating the deployed VLEs, not an interface to the
boredom *lab* dataset. The boredom lab is upstream of the phenomenology (it feeds the FCM apparatus and
Part III M2/M3) — it is not *grounded by* the pedagogy literature; the edges pointed the wrong way, and
each source's real relationships are already carried by its `bridges-to-part-iii` / `bridges-to-vle`
edges (verified: all 24 retain ≥1 `bridges-to-part-iii`). When the dataset anchor is built (Phase 2), the
lab↔literature construct links — where genuinely used (e.g. EEG-workload, boredom-rating) — will be
authored as the anchor's *outbound* edges, correctly typed, not as inbound groundings from this cluster.
**Three anticipatory bridges to the dataset survive** and were **repointed 2026-07-16 to the built anchor**
`corpus/index/Boredom Experiment (VR Attention Study)/`: ped-sec-14 (`bridges-to` → `#ch-stimulus`),
ped-sec-12 and ped-sec-01 (`bridges-to-part-iii`).

## Anchor discipline note

No content from `vle-01…vle-04` or the Boredom dataset is reproduced in this cluster. Bridges are
directional pointers only. The construct×condition concordance's Row→VLE mapping
(`_synthesis/vr-pedagogy-construct-condition-concordance.md` §"Row → VLE anchor node mapping") is the
construct-axis complement to this unit-axis table: together they establish that every construct row
*and* every cluster unit reaches the VLE anchor, with no duplication of anchor material.
