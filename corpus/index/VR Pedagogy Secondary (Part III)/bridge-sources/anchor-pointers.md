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
- **Boredom Experiment (VR Attention Study) dataset** — the EEG/HMD/self-report dataset anchor.
  This entry **is not yet built** (plan §9 decision 4). Every dataset bridge is therefore a
  `****** UNVERIFIED:` pointer — recorded as a `grounds-measure` edge, blocking nothing. The moment
  that entry is built, these become verifiable channel-level links. Note that `vle-02-boredom-raw-dataset`
  is the anonymized-derivative view of this same study that already exists under the VLE anchor; the
  UNVERIFIED channel here is the *raw* EEG/telemetry dataset that `vle-02` derives from.

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
`-edges.csv`); and whether it carries an UNVERIFIED Boredom-dataset `grounds-measure` pointer. Rows
built programmatically from `_synthesis/global-edges.csv` (authoritative), not hand-transcribed.

| Unit | Source | Strand | → VLE anchor unit(s) | → Part III (n) | → Boredom dataset |
|---|---|---|---|---|---|
| ped-sec-01 | Lombard & Ditton 1997 | A | vle-01 | 4 | — |
| ped-sec-02 | Witmer & Singer 1998 | A | vle-01, vle-04 | 1 | UNVERIFIED |
| ped-sec-03 | Chow 2016 | A | vle-01 | 2 | UNVERIFIED |
| ped-sec-04 | Dalgarno & Lee 2009 | B | vle-03, vle-04 | 1 | UNVERIFIED |
| ped-sec-05 | Fowler 2014 | B | vle-03 | 2 | — |
| ped-sec-06 | Makransky & Petersen 2021 (CAMIL) | B | vle-01, vle-04 | 1 | UNVERIFIED |
| ped-sec-07 | Mayer et al. 2022 | B | vle-01, vle-04 | 2 | UNVERIFIED |
| ped-sec-08 | Parong & Mayer 2018 | C | vle-04 | 2 | UNVERIFIED |
| ped-sec-09 | Makransky & Lilleholt 2018 | C | vle-01, vle-04 | 1 | UNVERIFIED |
| ped-sec-10 | Makransky et al. 2019 | C | vle-04 | 2 | UNVERIFIED |
| ped-sec-11 | Makransky & Petersen 2019 | C | vle-01 | 2 | UNVERIFIED |
| ped-sec-12 | Makransky et al. 2019 (home/classroom) | C | vle-01 | 4 | UNVERIFIED |
| ped-sec-13 | Parong & Mayer 2020 | C | vle-02, vle-04 | 3 | UNVERIFIED |
| ped-sec-14 | Colin et al. 2022 | C | vle-01, vle-04 | 3 | — |
| ped-sec-15 | Cook et al. 2011 | D | — *(bridges to Part III directly)* | 3 | — |
| ped-sec-16 | Merchant et al. 2012 | D | vle-01 | 3 | UNVERIFIED |
| ped-sec-17 | Makransky et al. 2016 | D | vle-01 | 2 | — |
| ped-sec-18 | Dubovi et al. 2017 | D | vle-01 | 3 | UNVERIFIED |
| ped-sec-19 | Kononowicz et al. 2019 | D | vle-01 | 2 | UNVERIFIED |
| ped-sec-20 | Roe et al. 2019 | D | — *(bridges to Part III directly)* | 1 | — |
| ped-sec-21 | Potkonjak et al. 2016 | E | vle-01 | 2 | — |
| ped-sec-22 | Radianti et al. 2020 | E | vle-01, vle-04 | 3 | UNVERIFIED |
| ped-sec-23 | Cossio et al. 2025 | E | — *(bridges to Part III directly)* | 2 | UNVERIFIED |
| ped-sec-24 | Dalgarno & Lee 2012 | B | vle-01, vle-03 | 1 | — |
| ped-sec-25 | Gunawardena & Zittle 1997 | F | vle-01, vle-03 | 1 | UNVERIFIED |
| ped-sec-26 | Garrison, Anderson & Archer 1999 (CoI) | F | vle-01, vle-03 | 2 | — |
| ped-sec-27 | Tu 2002 | F | vle-01 | 2 | UNVERIFIED |
| ped-sec-28 | Richardson & Swan 2003 | F | vle-01 | 2 | UNVERIFIED |
| ped-sec-29 | Biocca, Burgoon & Harms 2003 | F | vle-01, vle-03 | 1 | UNVERIFIED |
| ped-sec-30 | Kreijns, Kirschner & Jochems 2003 | F | vle-01, vle-03 | 1 | UNVERIFIED |
| ped-sec-31 | Terry & Doolittle 2019 | F | vle-01, vle-03 | 1 | UNVERIFIED |
| ped-sec-32 | Richardson et al. 2017 (meta) | F | vle-01 | 3 | UNVERIFIED |
| ped-sec-33 | De Back, Tinga & Louwerse 2021 | F | vle-01, vle-03, vle-04 | 1 | UNVERIFIED |
| ped-sec-34 | VanderMeer et al. 2023 | F | vle-01 | 2 | — |

Totals: 31/34 units carry ≥1 `bridges-to-vle` edge; the other 3 (ped-sec-15, ped-sec-20, ped-sec-23)
bridge to Part III directly with no single VLE-unit target. All 34 units carry ≥1 bridge edge of some
kind (quality-gate invariant). 24/34 carry an UNVERIFIED Boredom-dataset pointer. `vle-01` is the
dominant target (28 edges) — the deployment survey is where most of this literature's constructs and
cautions land; `vle-02` (raw boredom dataset) is touched only by ped-sec-13, the one unit with an
EEG-workload measure to align against it.

## The UNVERIFIED Boredom-dataset channel

24 units reserve a `grounds-measure` edge to the Boredom Experiment (VR Attention Study) dataset,
all tagged `****** UNVERIFIED:` because that anchor entry does not yet exist (plan §9 decision 4).
These are **pointers, not claims** — each names, in its unit `-edges.csv`, the specific measure that
*would* ground against a dataset channel once built (e.g. ped-sec-10's EEG-derived boredom/optimal/
overload workload bands → the dataset's own EEG conditions; ped-sec-08's boredom-rating item →
the dataset's boredom operationalization under an HMD condition; ped-sec-02's PQ presence items →
the dataset's presence self-report, if any). No channel-level mapping is asserted here. Building the
dataset entry is the single action that upgrades all 24 from placeholder to verifiable.

## Anchor discipline note

No content from `vle-01…vle-04` or the Boredom dataset is reproduced in this cluster. Bridges are
directional pointers only. The construct×condition concordance's Row→VLE mapping
(`_synthesis/vr-pedagogy-construct-condition-concordance.md` §"Row → VLE anchor node mapping") is the
construct-axis complement to this unit-axis table: together they establish that every construct row
*and* every cluster unit reaches the VLE anchor, with no duplication of anchor material.
