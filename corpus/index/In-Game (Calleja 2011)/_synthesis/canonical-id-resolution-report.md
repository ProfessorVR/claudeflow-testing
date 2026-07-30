# Canonical ID Resolution Report — In-Game (Calleja 2011) Phase 3

**Generated**: 2026-05-11
**Input**: `_synthesis/global-edges.csv` (pre-resolution, 736 edges)
**Output**: `_synthesis/global-edges.csv` (canonical IDs back-filled)
**Backup**: `_synthesis/global-edges-pre-canonical.csv` (same 9 original columns as the post-resolution CSV's first 9 columns; this is a snapshot after an intermediate resolution pass had already rewritten source_id/target_id, NOT a copy of the true raw pre-resolution input — the raw input was overwritten before backup could be captured on the first run. Re-running the resolver on the current state is a no-op for already-canonical rows, so the resolution outcome is correct and stable; only the specific *original unit-local synonym string* that each canonical ID replaced is no longer recoverable for the ~317 rows that were back-filled in the very first pass.)

## Lookup table

Built from `book-level-ontology.json` (38 CONCEPTs + 18 POSITIONs + 6 INVOLVEMENT-DIMENSIONs + 2 TEMPORAL-PHASEs).
Each canonical node contributes its `label` / `claim` plus every entry in `synonyms_merged`. The lookup map additionally tries these token variants:

- Parenthetical-stripped form (e.g., `"C-INV (IG-03)"` → `"C-INV"`)
- Unit-prefix stripped (`IG-NN:slug` → `slug`, with `-`/`_` → space variants)
- Concept-prefix stripped (`C-IG02-XXX` → `XXX`)
- Dimension-head alias expansion: each of the 6 `dimensions` records (which carry no `synonyms_merged`) gets aliases for its head word — `KINESTHETIC`, `kinesthetic`, `kinesthetic_involvement`, `IG-NN-KINESTHETIC`, `IG-NN:kinesthetic`, etc. — mapped to its `D-NNN`
- Temporal-phase head alias expansion: `MACRO` / `macro` / `macro-phase` etc. → `T-NNN`

Lookup is case-insensitive with case-sensitive priority.

## Summary

| Bucket | Count | Share |
|---|---|---|
| Fully resolved (source AND target canonical or already-canonical) | 59 | 8.0% |
| Partially resolved (one endpoint canonical) | 287 | 39.0% |
| Unresolved (both endpoints unit-local, no canonical match) | 390 | 53.0% |
| **Total edges processed** | **736** | 100% |

## Top 10 most-common unresolved unit-local IDs

Candidates for ontology expansion in a future Phase 3A pass — these unit-internal sub-concepts surfaced repeatedly in edge endpoints but were not promoted to canonical-ontology level.

| Rank | Unit-local ID | Edge endpoint count |
|---|---|---|
| 1 | `Calleja` | 15 |
| 2 | `World of Warcraft` | 10 |
| 3 | `Planetside` | 10 |
| 4 | `IG-00:six-dimensions-preview` | 8 |
| 5 | `C08-FIVE-ELEMENT-FRAMEWORK` | 8 |
| 6 | `C-IG02-IMMERSION-AS-ABSORPTION` | 8 |
| 7 | `C-APX-02` | 8 |
| 8 | `C-IG02-IMMERSION-AS-TRANSPORTATION` | 7 |
| 9 | `C-SPA` | 7 |
| 10 | `IG-05:five-spatial-structures-taxonomy` | 7 |


## Notes

- All provenance flags preserved (no rows dropped; the 9 original columns are untouched apart from canonical-ID rewrites in `source_id` / `target_id`).
- 4 mediated-exegetical edges from IG-07 (Sartre/Iser → Phantasia Cluster) preserved — only the Phantasia-cluster endpoints (where canonical) were back-filled; the Sartre/Iser endpoints remain as the original unit-local labels (no canonical Sartre/Iser node exists in the book-level ontology, which is correct — they are mediated external interlocutors).
- `book-level-ontology.json` and `tension-edges.json` not modified.
- Three new columns appended to `global-edges.csv`:
  - `source_id_original` — the pre-resolution unit-local token when `source_id` was rewritten; empty otherwise
  - `target_id_original` — same for `target_id`
  - `resolution_status` — `resolved` | `partial` | `unresolved`

## Interpretation

The 8% fully-resolved figure undercounts the volume-level signal: 39% of edges are *partially* resolved (one endpoint canonical, the other a unit-internal sub-concept). Combined, 47% of all 736 edges now have at least one canonical anchor — high enough for the canonical ontology to function as the navigational backbone for cross-unit cross-references while preserving the fine-grained unit-internal structure on the other endpoint.

The 53% fully-unresolved bucket is dominated by:

1. **Specific games** as edge endpoints (`World of Warcraft`, `Planetside`, `Bioshock`, etc.) — these are case-study referents, not concepts, and would not be promoted.
2. **Author names** (`Calleja`, others) — these are agent-of-claim tokens, not concept tokens.
3. **Sub-taxonomic items** (`IG-05:five-spatial-structures-taxonomy`, `C08-FIVE-ELEMENT-FRAMEWORK`, the IG-02 immersion-as-X distinctions) — these are unit-internal classificatory frameworks that the 3A consolidation legitimately kept below canonical-level.
4. **Preview-tier tokens** (`IG-00:six-dimensions-preview`, `IG-00:macro-micro-preview`) — these reference the IG-00 introduction's anticipatory gestures; arguably promotable in a future pass.

Candidates for canonical promotion in a future 3A revision (drawn from the top-10 above): `IG-02:immersion-as-absorption` and `IG-02:immersion-as-transportation` (each 7–8 edges, theoretically central to Calleja's volume-pillar incorporation argument); `C-APX-02` (8 edges, an Appendix-derived concept worth surfacing); the `IG-00:*-preview` tokens (if previews are treated as concepts in their own right rather than mere anticipations).

## Mechanical sweep — no invention

This pass replaced unit-local IDs ONLY when an exact (case-insensitive, multi-variant) match existed in a canonical node's `label`/`claim`/`synonyms_merged` list, with the variant expansions enumerated above. No new canonical IDs were minted. No edges were dropped, merged, or re-tiered. The 4 IG-07 mediated-exegetical edges were not specially handled — the standard lookup correctly preserved their external-interlocutor endpoints (Sartre, Iser) and back-filled only the Phantasia-cluster endpoints where canonical equivalents existed.
