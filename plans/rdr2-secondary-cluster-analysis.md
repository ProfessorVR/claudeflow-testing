# Analysis Plan: Red Dead Redemption 2 Secondary-Literature Cluster (2019–2023)

**Type:** scholarly-article cluster (12 secondary-literature pieces on *Red Dead Redemption 2*) — modeled on `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/` and its plan `plans/phantasia-cluster-2025-analysis.md`.
**Status:** PROPOSED — awaiting user confirmation of scope + go.
**Output root:** `corpus/index/Red Dead Redemption 2 Secondary (2019-2023)/` · prefix `rdr-` · cluster pattern (per-article folders + `_synthesis/`).
**Source PDFs:** `corpus/new_media/` (12 RDR2 articles, recently added; the `.pdf:Zone.Identifier` files are Windows download-metadata — ignore).
**Ultimate purpose:** the secondary-literature backbone for the dissertation's **Part II RDR2 (screen) analysis** and the **RODA game-behavior method** — i.e., a map of *who has written what about which parts of RDR2*, organized so it directly feeds the scene-level analyses (tutorial, Valentine bar-fight, the disruption scene) and bridges to the Wendt design lens and Calleja's involvement model.

---

## 1. The cluster (12 articles, ~561 pp)

| # | Author(s) | Year | Short title | pp. | Strand | Depth |
|---|---|---|---|---|---|---|
| rdr-01 | Bagnoli, Nicolas | 2019 | How video games reflect a discourse about another era (RDR2) | 101 | history / discourse (thesis) | deep (2-pass, RDR2-core) |
| rdr-02 | Westerside & Holopainen | 2019 | Sites of Play: Locating Gameplace in RDR2 | 14 | game space / phenomenology | deep |
| rdr-03 | Tuominen, Juho | 2020 | Rockstar's Open World Games as Ideological Apparatuses | 87 | ideology critique (thesis) | deep (2-pass, RDR2-core) |
| rdr-04 | Crowley, E. | 2021 | The Educational Value of Virtual Ecologies in RDR2 | 15 | ecology / pedagogy | deep |
| rdr-05 | Wright, Esther | 2021 | Rockstar, Red Dead, and Narratives of "Progress" | 18 | history / authenticity | deep |
| rdr-06 | Vanderhoef & Payne | 2022 | Press X to Wait: Cultural Politics of Slow Game Time | 18 | temporality / pace | deep |
| rdr-07 | Ventomäki, Hanna | 2022 | Representations of Nature in RDR2 | 75 | ecocriticism (thesis) | deep (2-pass, RDR2-core) |
| rdr-08 | McEvoy, Amalia | 2023 | Digitizing the American West: Analyzing Rhetoric in RDR2 | 41 | rhetoric of the West (thesis) | deep |
| rdr-09 | Moser, Heather R. | n.d. | 'A Crash of Worlds': Empathy through Character Performance | 50 | empathy / performance (thesis) | deep (2-pass) |
| rdr-10 | Ruffino, Paolo | n.d. | There Is No Cure: Paratexts as Remediations of Agency | 14 | paratexts / agency | deep |
| rdr-11 | Donald & Reid | n.d. | The Wild West: Accuracy, Authenticity, and Gameplay | 9 | authenticity / gameplay | deep |
| rdr-12 | — | n.d. | Analysis of Immersion Levels vs. UX Design Quality in RDR2 | 9 | immersion / UX | map |

**Excluded (flag for confirmation):** "Beyond Narrative — Narrative Liminality" (271 pp — a monograph/edited volume, not an RDR2 article); Daneels et al., **DiGAP** (a game-analysis *protocol* — method-adjacent to RODA, not an RDR2 source); Vella, *Dark Souls* and Champion, *Oblivion*/virtual-places (other games). DiGAP recommended as a **method cross-link**, not a cluster member.

### Scholarly profile
- Recent + compressed span (**2019–2023**) — the "scholarly evolution" is more *thematic* than generational; track theme emergence, not decades.
- Discipline mix: game studies, rhetoric, history/American studies, ecocriticism, media/cultural studies.
- **5 long theses** (Bagnoli, Tuominen, Ventomäki, Moser, McEvoy) carry heavy lit-review/method framing — extract their **RDR2-core**, not every page.
- Likely citation hubs (to verify): Calleja (*In-Game* — already in corpus), Bogost, Juul, Murray, Jenkins, Sicart, Nitsche, Wright's own *Rockstar Games and American History*.

## 2. Why this cluster, why now
1. **Direct support for Part II RDR2 analysis.** The dissertation analyzes RDR2 scenes (tutorial, Valentine bar-fight, the disruption scene); this cluster is the secondary-literature backbone those analyses cite or rebut.
2. **Feeds the RODA method (read-only).** RODA's RDR2 validations (`RODA-Walkthrough-BarFight`) gain scholarly grounding; the cluster's game-element concordance says which scholars treat which scenes/mechanics.
3. **Cross-links the new Wendt design lens** (`game-vle-pointers.md` already reaches to RDR2) and **Calleja** (involvement/incorporation — present in corpus and likely cited across the cluster).
4. **The game-as-primary-object innovation.** Where the phantasia cluster concords to Aristotle's *text* (Bekker loci), this cluster concords to the **game** — missions, mechanics, regions, scenes — a new "primary-object concordance" pattern for ludic secondary literature.

## 3. Folder layout
```
corpus/index/Red Dead Redemption 2 Secondary (2019-2023)/
├── _synthesis/
│   ├── manifest.json · phase0-overview.md
│   ├── cluster-ontology.{md,json}
│   ├── global-edges.csv
│   ├── debate-map.{md,json}                 # cross-article disagreements
│   ├── concept-matrix.csv
│   ├── contested-readings.md
│   ├── citation-network.{md,json}           # who cites whom (intra-cluster)
│   ├── rdr-game-element-concordance.{md,json}   # *** the primary-object anchor: article × scene/mission/mechanic/region ***
│   ├── rdr-secondary-literature-network.{md,json}  # Calleja/Bogost/Juul/Murray/Sicart/...
│   ├── rdr-terminology-appendix.{md,json}   # game-studies + rhetoric terms (immersion, gameplace, paratext, ludonarrative, honor, Dead Eye…)
│   ├── rdr-scholarly-evolution-2019-2023.md
│   └── rdr-graph-{citation-network,concept-debate,discipline-cluster,game-element-density,cross-pipeline-bridge}.mmd
├── Bagnoli - Discourse About Another Era (2019)/  rdr-01-bagnoli.{json,md,edges.csv}
├── Westerside & Holopainen - Sites of Play (2019)/ rdr-02-westerside.{json,md,edges.csv}
│   … (rdr-03 … rdr-12, one folder each)
```

## 4. Controlled vocabulary (cluster-adapted)
- **Object types:** CONCEPT · READING/THESIS · **GAME-ELEMENT** (mission/scene/mechanic/system/region/character) · GAME-WORK (RDR2; also RDR1, GTA, other Rockstar) · THEME · DEBATE-AXIS · INTERLOCUTOR (game-studies/rhetoric/cultural-theory) · AUTHOR (this cluster) · TERM.
- **Edge relations:** standard (`defines, cites, extends, contests, concedes, qualifies, bridges-to-pipeline, instances-in-text`) + cluster (`cites-cluster-author, contests-reading-of, extends-reading-of, shifts-debate-axis`) + **`treats-game-element`** (article → a specific RDR2 scene/mechanic).
- **Themes (axis seeds):** rhetoric of the American West / frontier myth · narratives of progress & ideology critique · nature/ecology · slow time & temporality · empathy & character performance · gameplace/open-world spatiality · authenticity/accuracy · paratexts & agency · immersion/UX · education.
- **Debate axes (seeds):** celebratory ↔ critical-ideological; authenticity-as-accuracy ↔ authenticity-as-feel; player-agency ↔ scripted-constraint; nature-as-resource ↔ nature-as-aesthetic/ecological; narrative-determinism ↔ player-authored experience.

## 5. Five-phase pipeline (cluster-adapted)
- **Phase 0 — overview.** `phase0-overview.md` (cluster profile, theme map, citation-hub guess, discipline split, OCR audit via `pdftotext`) + `manifest.json` (12 units + bibliographic spine). Confirm `book/pdf` offsets per article (these are born-digital PDFs/theses — usually offset 0, verify).
- **Phase 1 — per-article metadata** (`rdr-NN-<author>.json`): bib header, author/discipline, abstract paraphrase, section structure, expected themes, **expected game-elements treated**, expected interlocutors, OCR confidence.
- **Phase 2 — deep per-article** (one agent each; **two-pass on the 5 long theses** = metadata/outline then edges/concordance, extracting the RDR2-core): `.md` paraphrastic synthesis (1,500–4,000w; **no ≥25-word verbatim** — copyrighted), `.json` (concepts ≥10, readings ≥3, **game-elements treated**, themes, interlocutors, tensions), `-edges.csv` (short ≥15 / medium ≥25 / long ≥40 edges; `contributor` = author).
- **Phase 3 — cluster synthesis** (waves): (3A) cluster-ontology (dedup concepts/readings); (3B) global-edges + debate-map (8–12 documented disagreements); (3C) concept-matrix + contested-readings; (3D) **game-element concordance** (article × scene/mission/mechanic/region — *aligned to the dissertation's RODA targets: tutorial, Valentine bar-fight, the disruption scene*) + terminology appendix; (3E) citation-network + secondary-lit network; then graphs (5 Mermaid) + `rdr-scholarly-evolution-2019-2023.md`.
- **Phase 4 — cross-pipeline integration:** bridge to **Part II RDR2 analysis**, **RODA** (read-only crosswalk), the **Wendt entry** (`game-vle-pointers.md`), **Calleja In-Game**, and the actualization-of-desire chain (hard cap ~25 edges). Activate now (vs. parked) since the dissertation framework exists.

## 6. Orchestration
- **Agent tool, not Workflow** (no Workflow opt-in). ~1 (Phase 0) + 12 (metadata) + 12 (deep) + ~6 (synthesis waves) agents.
- **Reliability lesson from the Wendt build:** the environment's pre/post-task hook intermittently no-ops a subagent (~1/8). Mitigation: pre-extract each article's text with `pdftotext` to a scratch file (cheap reads, no image cost), give agents that path, **harvest successes + self-author any gaps**, and verify every unit's 3 files on disk before synthesis.
- Author the cluster-level synthesis (ontology, debate-map, concordance, scholarly-evolution) **in-loop** for quality.

## 7. Quality gates
≥220 deduplicated edges · 8–12 documented debates · 8–12 contested readings · **every article mapped to ≥3 game-elements in the concordance; the dissertation's target scenes (tutorial, bar-fight, disruption) each cross-referenced to every article that treats them** · ≥40 terminology lemmas · ≥15 intra-cluster citations · 5 Mermaid graphs render · cross-pipeline graph ≤25 edges · **no ≥25-word verbatim from any article** (paraphrase + page anchor) · provenance discipline (article-says vs cluster-synthesis vs dissertation-application, the last tagged `anticipatory-application`).

## 8. Decisions to confirm (reasoned recommendations — push back freely)
1. **Scope:** the 12 above; **exclude** Beyond-Narrative (271pp book), DiGAP (method → cross-link only), Vella/Champion (other games). *Recommend as listed.* (Confirm Tuominen's Rockstar-open-world thesis counts as RDR2-relevant — recommend yes.)
2. **Folder name / prefix:** `Red Dead Redemption 2 Secondary (2019-2023)` · `rdr-`. (Alt: `RDR2 Secondary Literature`.)
3. **Depth on the 5 long theses:** deep but **RDR2-core-focused** (two-pass), not exhaustive page-by-page. *Recommend.*
4. **Concordance anchoring:** align the game-element concordance to your **RODA analytic targets** (tutorial, Valentine bar-fight, disruption scene) so the cluster directly serves Part II. *Recommend* (need you to confirm the canonical scene list).
5. **Cross-pipeline (Phase 4) active**, bridging Part II RDR2 + RODA (frozen/read-only) + Wendt + Calleja + the RO chain. *Recommend.*
6. **compiled-index.json:** generated/pipeline-built (as found in the Wendt build) — the cluster will be built + verified, with compilation left to `/god-learn-compile` (not hand-edited).

## 9. Risks & mitigations
- **Long theses → context exhaustion / non-RDR2 padding** → two-pass + RDR2-core extraction; cap edges.
- **Copyright** → paraphrase + page anchor; no ≥25-word verbatim.
- **OCR variance** (theses vs journal PDFs) → Phase 0 `pdftotext` spot-check; flag low-confidence.
- **Subagent hook no-ops** → harvest + self-author gaps; verify files on disk.
- **Game-element naming drift** → concordance maintains canonical scene/mechanic names (RDR2 wiki-aligned) + each article's own phrasing.
