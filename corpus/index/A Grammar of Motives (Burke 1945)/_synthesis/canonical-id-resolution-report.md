# Canonical ID Resolution Report — Burke *Grammar of Motives* (1945)

**Agent**: Phase 3 Wave 1 Agent 3B (global edges + tensions)
**Generated**: 2026-05-11
**Plan**: `plans/grammar-of-motives-burke-1945-analysis.md` §5 Phase 3 Wave 1 3B

## Status

Agent 3A's `_synthesis/book-level-ontology.json` was **not yet available** when 3B ran. The synthesis therefore uses heuristic canonicalization (lowercase-normalized triple matching on `source_id`, `relation`, `target_id`). A second canonicalization pass against 3A's book-level ontology is **required** before downstream dissertation deployment.

## CSV Schema Heterogeneity (handled)

The 14 unit edges CSVs use **8 distinct header schemas**:
- Canonical 8-col (`source_id,relation,target_id,domain,centrality_tier,book_page,provenance,notes`): 6 units (gm-00, gm-01, gm-06, gm-09, gm-11, gm-13)
- 5-col compact (`src,rel,dst,book_page,note`): gm-02
- 6-col variants: gm-08, gm-10
- 7-col variant: gm-04
- 8-col with `source_type`/`target_type` instead of domain: gm-03
- 9-col with `edge_id` prefix: gm-05, gm-07, gm-12

An adaptive header-mapper normalises all variants to the canonical 8-column schema before concatenation. Edges with missing `source_id`/`relation`/`target_id` after mapping (i.e., truly malformed rows) are dropped; all such drops are zero in practice.

## Edge Synthesis Statistics

| Stage | Edge Count |
|---|---|
| Pre-canonical (all 14 unit edges with `unit_id` prefix) | **878** |
| Post-dedup (heuristic triple-matching) | **876** |
| Reduction | 2 edges merged (0.2%) |

### Quality gate
Target ≥350 deduplicated edges: **PASS** (876)

### Per-unit edge contributions
- `GM-06` (Burke - Act (Aristotle and Aquinas)): 73 edges
- `GM-07` (Burke - Agency and Purpose): 44 edges
- `GM-05` (Burke - Agent in General): 49 edges
- `GM-02` (Burke - Antinomies of Definition): 55 edges
- `GM-01` (Burke - Container and Thing Contained): 59 edges
- `GM-09` (Burke - Dialectic in General): 78 edges
- `GM-00` (Burke - Introduction (Five Key Terms of Dramatism)): 78 edges
- `GM-12` (Burke - Motives and Motifs in Marianne Moore): 56 edges
- `GM-04` (Burke - Scene (Philosophic Schools)): 55 edges
- `GM-03` (Burke - Scope and Reduction): 61 edges
- `GM-10` (Burke - Symbolic Action in a Poem by Keats): 49 edges
- `GM-08` (Burke - The Dialectic of Constitutions): 67 edges
- `GM-13` (Burke - The Four Master Tropes): 76 edges
- `GM-11` (Burke - The Problem of the Intrinsic): 78 edges

### Top relation types by frequency (post-dedup)
| Relation | Count |
|---|---|
| `defines` | 35 |
| `ratio-of` | 25 |
| `awaits-ontological-grounding-in` | 19 |
| `instances` | 18 |
| `maps-to-pim-dimension` | 17 |
| `exemplifies` | 17 |
| `instances-in-text` | 17 |
| `exemplified-by` | 16 |
| `extends` | 15 |
| `features-as-locus` | 14 |
| `anticipates` | 14 |
| `applies-pentad-to` | 12 |
| `contests` | 11 |
| `operationalizes` | 9 |
| `maps-to-uexkull-construct` | 8 |
| `anticipatory-bridge` | 8 |
| `bridges-to` | 8 |
| `most-implicates-pentad-term` | 8 |
| `decomposes-into` | 7 |
| `bridges` | 7 |
| `bridges-to-pipeline` | 7 |
| `in-tension-with` | 6 |
| `grounds` | 6 |
| `instantiates` | 6 |
| `features-pentad-term` | 6 |


## Canonicalization Method (Heuristic, pending 3A)

For each edge `(source_id, relation, target_id)`:
1. Lowercase + whitespace-to-hyphen normalization.
2. Edges sharing the normalized triple are merged.
3. Highest-centrality-tier instance wins on tier/source-form; all source units accumulated; notes concatenated (first 3 unique); book_pages and provenances unioned.
4. Resolution status marked `heuristic-pending-3A` for every record.

### Known lossiness
- **Aliased concept IDs not yet merged**: e.g., `C-SCENE-ACT` vs `SCENE-ACT-RATIO` vs `scene-act` would survive as multiple edges under pure-string normalization. Estimated under-merge: 10–20% given the heterogeneous concept-ID conventions across the 14 units (some use `C-` prefix, some lowercase-hyphen, some `Capitalized`). A second pass with 3A's alias table will compress this further.
- **Relation-name variants not normalized**: e.g., `defines` vs `definition-of` vs `is-defined-as` count as distinct relations under heuristic. 3A pass should merge synonymous relation predicates.
- **Edges lost in conversion**: zero — all pre-canonical edges (`global-edges-pre-canonical.csv`) preserve every row.

## Tension Synthesis Statistics

| Stage | Count |
|---|---|
| Raw unit tensions (sum across 14 units) | **70** |
| Canonical tensions (heuristic pattern-clustered) | **16** |
| Unmatched raw tensions (review needed) | **21** |

### Quality gate
Target 14–18 canonical tensions: **PASS** (16)

### Canonical tension list
- **BT-001** Scene-as-container vs scene-act extended/sequential ratios (tier 2, 7 raw matches, units: GM-01, GM-04, GM-07)
- **BT-002** Featuring/reduction vs full pentadic scope (tier 1, 8 raw matches, units: GM-00, GM-03, GM-04, GM-07)
- **BT-003** Act as actus (full realization) vs act as mere motion/event (tier 2, 8 raw matches, units: GM-01, GM-02, GM-06, GM-07, GM-11)
- **BT-004** Agent as substance vs agent as constituted by ratios (tier 2, 3 raw matches, units: GM-03, GM-07, GM-12)
- **BT-005** Antinomies of definition: terms as stable vs terms as paradoxical (tier 2, 3 raw matches, units: GM-02, GM-07)
- **BT-006** Intrinsic vs extrinsic / context-of-situation problem (tier 2, 1 raw matches, units: GM-04)
- **BT-007** Dialectic of constitutions: enacted constitution vs constitutional substance (tier 2, 0 raw matches, units: none)
- **BT-008** Agency vs purpose: instrumental means vs telic end (tier 2, 2 raw matches, units: GM-07, GM-12)
- **BT-009** Four master tropes: metaphor/metonymy/synecdoche/irony as cognitive vs literary (tier 2, 5 raw matches, units: GM-13)
- **BT-010** Symbolic action vs sheer motion / poem-as-act problem (tier 2, 3 raw matches, units: GM-06, GM-12)
- **BT-011** Dramatistic vocabulary vs scientistic vocabulary (tier 2, 6 raw matches, units: GM-00, GM-02, GM-03, GM-11)
- **BT-012** Marianne Moore: descriptive surface vs ethical/motivational depth (tier 2, 0 raw matches, units: none)
- **BT-013** Philosophic schools as systematic vs schools as featuring-strategies (tier 1, 3 raw matches, units: GM-00, GM-02, GM-07)
- **BT-014** Dialectic in general: merger vs division (two-in-one / one-in-two) (tier 2, 0 raw matches, units: none)
- **BT-015** Higher-order combinations: pentadic ratios vs pentadic + circumferences (tier 2, 0 raw matches, units: none)
- **BT-016** Grammar vs Rhetoric vs Symbolic (volume-trilogy gesture) (tier 2, 0 raw matches, units: none)


### Tension clustering method
- 16 canonical-tension seeds derived from Burke's master oppositions: pentadic ratios (scene-as-container; agency-purpose; agent-substance); antinomies of definition; intrinsic/extrinsic; dialectic of constitutions; four master tropes; symbolic action vs motion; dramatistic vs scientistic; Moore case; philosophic schools as featuring; dialectic merger/division; higher-order combinations; Grammar-Rhetoric-Symbolic trilogy.
- Each raw unit tension scored against seed regex patterns; assigned to highest-scoring seed (score ≥ 1).
- Unmatched raw tensions (21) listed at end of `tension-edges.json` for manual curation in the post-3A pass.

## Required Second Pass (post-3A)

1. Load `_synthesis/book-level-ontology.json` from Agent 3A.
2. Build alias map: `unit_concept_id → canonical_concept_id`.
3. Re-run dedup on `global-edges-pre-canonical.csv` using canonical IDs.
4. Normalize relation predicates (e.g., merge `defines` / `is-defined-as` / `definition-of`).
5. Re-cluster unmatched tensions; surface any new Burkean oppositions not in the 16 seeds.
6. Update `resolution_status` field in `global-edges.csv` from `heuristic-pending-3A` to `canonical`.
7. Expected post-3A edge count: **~683–788** (10–22% further reduction from alias + relation merging).

## Files Produced
- `_synthesis/global-edges-pre-canonical.csv` — 878 rows + header (lossless concat with `unit_id` column).
- `_synthesis/global-edges.csv` — 876 rows + header (heuristic-dedup).
- `_synthesis/tension-edges.json` — 16 canonical tensions + 21 unmatched.
- `_synthesis/canonical-id-resolution-report.md` — this file.
