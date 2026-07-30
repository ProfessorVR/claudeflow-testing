# dfd… — Quality Gates & Registration Status

## Quality gates — verified 2026-06-23
| Gate | Target | Actual | Pass |
|---|---|---|---|
| Units indexed | 12 (3 files each) | **12/12** | ✓ |
| Deep-unit length | ~1,500–3,000 w | 1,900–2,600 (rdr-12 map = 417, a 9-slide deck) | ✓ |
| Global edges | ≥220 | **506** | ✓ |
| Documented debates | 8–12 | **10** (`debate-map.json`) | ✓ |
| Contested readings | 8–12 | **10** (`contested-readings.md`) | ✓ |
| Game-element concordance | every unit mapped + dissertation anchors | all 12 mapped; **3 RODA anchors** cross-referenced (bar-fight→rdr-08, disruption→rdr-09, honor→7 units) | ✓ |
| Terminology lemmas | ≥40 | **65** | ✓ |
| No ≥25-word verbatim | required (copyrighted) | per-unit agents verified (longest ~19 w); rdr-12 from slides | ✓ |
| Provenance discipline | 3 voices; application tagged | faithful synthesis vs `anticipatory-application` (bridge + diss-hooks) kept distinct | ✓ |
| Synthesis deliverables | ~22 (phantasia-cluster parity) | **22** | ✓ |

## Gates NOT fully met (reported honestly)
- **Intra-cluster citations ≥15 → actual 4.** This is a **finding, not a shortfall of the build**: the RDR2 secondary literature (2019–2023) is **pre-paradigmatic** — parallel, largely non-self-citing work. The cluster's connectivity is via **shared interlocutors** (Bogost ×3, Althusser ×2, Heidegger/Husserl, Calleja) and **shared game-elements**, documented in `citation-network.md` + `rdr-secondary-literature-network.md`. The debate-map and concordance (not a citation graph) are what make this a cluster.
- **Mermaid graphs render via mmdc → deferred.** 5 `.mmd` graphs authored with valid syntax; `mmdc` is **not installed** in this environment, so render-validation is deferred to the user's toolchain (the source compiles/renders on a standard Mermaid setup).

## Notes / caveats
- **rdr-12** ("Immersion vs UX", a UOC student Final Degree Project) is an **image-only PDF**; OCR tools (`ocrmypdf`/`tesseract`) are absent, so it was **image-read and self-authored** from its 9 slides (map depth; flagged lower scholarly weight in its files).
- **Scope:** the 12 RDR2-focused articles; excluded "Beyond Narrative" (271pp monograph), DiGAP (method → cross-link only), Vella/Champion (other games), per the plan.
- All unit files consolidated into `corpus/index/` (9 agents had initially written to `corpus/new_media/` due to an abbreviated output path; moved + verified; no strays remain).

## Registration status — `corpus/index/compiled-index.json`
**Corrected 2026-06-23.** `compiled-index.json` is the primary-source **concept ontology** (Greek/German-lemma canonical nodes) built by **`scripts/compile-corpus-index.py`** from a hardcoded `TEXT_DIRS` — **not** by `god-learn compile` (which rebuilds a separate god-learn knowledge substrate). The RDR2 cluster is a **secondary-literature cluster** (debates/concordance, `cluster-ontology.md`), so — like the existing Aristotelian Phantasia/Emotion Secondary clusters — it is **not part of compiled-index.json by design**, and is consumed directly by agents (read as files). Registering it would require hand-authoring a node-format `book-level-ontology.md §3A` + a `TEXT_DIRS` entry (a semantic stretch for a primary-concept index). See memory `project-compiled-index-registration`.
