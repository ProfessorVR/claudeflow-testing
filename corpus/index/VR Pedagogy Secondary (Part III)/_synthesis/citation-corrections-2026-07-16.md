# Citation Corrections — Gross-Rigor PDF Verification (2026-07-16)

Every citation-year flag left `UNVERIFIED` / "discrepancy, unresolved" during the cluster build was
checked against the **source PDF's own front matter** (via `pdftotext`, page 1 + copyright/DOI lines).
This file is the authoritative record of what was found. It resolves the flags but does **not** itself
rewrite the unit labels/folders — that awaits the convention decision in §3.

## 1. Verified bibliographic records

| Unit | Author / short title | Currently labeled | Online-first (© / advance) | **Version of record (journal issue)** | Verdict |
|---|---|---|---|---|---|
| ped-sec-04 | Dalgarno & Lee, *learning affordances of 3-D VLEs* | 2009 | © 2009 (Blackwell/Becta) | **BJET 41(1), 2010**, doi:10.1111/j.1467-8535.2009.01038.x | label is online-first year; VoR = **2010** |
| ped-sec-05 | Fowler, *VR and learning: where is the pedagogy?* | 2014 | © 2014 (BERA) | **BJET 46(2), 2015**, doi:10.1111/bjet.12135 | label is online-first year; VoR = **2015** |
| ped-sec-08 | Parong & Mayer, *Learning science in immersive VR* | 2018 | advance online 25 Jan 2018 | **J. Educational Psychology 110(6), 2018**, doi:10.1037/edu0000241 | **correct** (online + issue same year) |
| ped-sec-10 | Makransky et al., *more presence but less learning* | 2019 | online 2017 | **Learning & Instruction 60, 2019** | **correct**; earlier papers cite the online-first "2017b" |
| ped-sec-13 | Parong & Mayer, *Cognitive & affective processes…* | 2020 | © 2020 (recd 30 Mar / accd 12 Jul 2020) | **J. Computer Assisted Learning 37(1):226–241, 2021**, doi:10.1111/jcal.12482 | label is online-first year; VoR = **2021** |
| ped-sec-16 | Merchant et al., *learner characteristics… chemistry* | 2012 | — | **Computers & Education 59:551–568, 2012** | **correct**; see §2 |

Page ranges for ped-sec-04 (BJET 41(1):10–32) and ped-sec-05 (BJET 46(2):412–422) are the standard
version-of-record ranges but were **not** re-extracted from the PDF here — verify at final citation.

## 2. One genuine error (not a year discrepancy): a mis-linkage in ped-sec-09

ped-sec-09 (Makransky & Lilleholt 2018) cites "**Merchant et al. 2014**" for **meta-analytic** support
that non-immersive VR + traditional teaching outperforms traditional-only / 2D-images / no-treatment.
That is the **Merchant et al. (2014) meta-analysis** — *Computers & Education 70:29–40* — a **different
paper** from ped-sec-16 (the 2012 *college-chemistry SEM study*, C&E 59:551–568). The cluster wrongly
recorded this as a `cites-cluster-author → ped-sec-16` edge with a "year discrepancy" flag. It is not a
year discrepancy and not a cluster-internal cite: it is an **external** citation to a paper this cluster
did not build as a unit. Correct action (pending §3 go-ahead): retag ped-sec-09's edge from
`cites-cluster-author,ped-sec-16` → `cites,"Merchant et al. 2014 (meta-analysis, C&E 70:29–40 — NOT
ped-sec-16)"`, and fix the two JSON notes. This ripples into `global-edges.csv`, `citation-network.*`,
and `concept-matrix.csv`, which must be re-derived.

## 3. The convention decision (author call — UTMOST citation rigor)

Three papers (04, 05, 13) carry the **online-first year** as their label while their **version of
record** (journal issue) is a later year. This is one consistent choice, not three separate errors, and
it recurs dissertation-wide. Standard practice (APA 7 §9.16; Chicago 17) is: **once a final published
version exists, cite the version of record.** All three have final published versions. The cluster's own
sources already do this — Fowler cites "Dalgarno and Lee (2010)"; CAMIL cites "2010"; Mayer et al. cite
Parong & Mayer "2021a." So the cluster is currently *internally inconsistent* against its own sources.

**Recommendation:** adopt **version-of-record** as the canonical citation year cluster-wide —
04→**2010**, 05→**2015**, 13→**2021** — with the online-first year noted where useful. Folder/file names
and the `ped-sec-NN` IDs are storage handles and can retain their current strings (documented via
`manifest.sourceFile`); only the manifest `year` field, the citation prose, and the resolved flags change.

**Alternative:** keep online-first years (2009/2014/2020) as labels and simply *note* the version-of-record
year — lighter-touch, but leaves the cluster inconsistent with how its own sources cite these works.

No labels have been flipped yet. On the author's call, the full correction set (manifest years, flag
rewrites, the §2 mis-linkage, and re-derivation of the three affected synthesis files + recompile) will
be applied as one batch and gated before commit.
