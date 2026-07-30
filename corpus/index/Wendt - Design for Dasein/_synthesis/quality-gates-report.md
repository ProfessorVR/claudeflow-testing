# dfd — Quality Gates & Registration Status (Phase 4)

## Quality gates — verified 2026-06-23
| Gate | Target | Actual | Pass |
|---|---|---|---|
| Units | 8 (6 deep + 2 map) | 8 | ✓ |
| Deep-unit length | ≥1,500 words | dfd-00 3,908 · 01 6,793 · 03 4,176 · 04 5,096 · 05 7,244 · 06 3,564 | ✓ |
| Map-unit length | concise | dfd-02 1,019 · dfd-07 2,312 | ✓ |
| Global edges | ≥120 | **307** | ✓ |
| Terminology lemmas | ≥60 | ~95 (`dfd-terminology-appendix.md`) | ✓ |
| Bibliography / interlocutors | ≥60 | **120** sources (`dfd-07`) + 57 consolidated interlocutor entries | ✓ |
| Double locus `(p / pdf)` | every citation | yes; offset `book = pdf − 2` (4 anchors) | ✓ |
| No ≥25-word verbatim | required (in-copyright) | per-unit agents verified; longest runs split to ≤24 words; anchor-phrases only | ✓ |
| Provenance discipline | every RO/application claim tagged | bridge + manual + RO-hooks tagged `anticipatory-application`; three voices (Wendt-says / RO-mapping / environment-application) kept distinct | ✓ |
| Payloads | manual + bridge | both built (manual A–E; bridge A0–A4 + keystone) | ✓ |
| Seed case | BME VLE video read | built (3 transcripts + curated frames + design+chain read) | ✓ |
| Crosswalks | RODA (read-only) + King–Salvo + game-VLE | built; **RODA entry untouched (frozen)** | ✓ |

## Registration status — `corpus/index/compiled-index.json`
`compiled-index.json` is a **generated, concept-centric ontology index** (top-level keys: `ontologyNodes`, `crossPipelineHooks`, `tensionEdges`, `canonicalTerms`; each node lists the source entries that support it). It is built **selectively** by the compile pipeline: Aristotle, Heidegger (BT / FCM / BCAP), Rickert, and Uexküll are present, but **Calleja/In-Game, Gross/Uncomfortable, and Veri(dis)similitude are not** — so being in it is an enrichment, not a prerequisite for an entry to function.

It is therefore **not a hand-edited registry.** Injecting Wendt nodes by hand would be fragile, would be overwritten on the next compile, and cannot faithfully replicate the compiler's node-merging. **Not done by hand.**

**Status:** the Wendt entry is fully built, manifest-declared, and quality-gate-verified — **ready to be compiled in.** Inclusion in `compiled-index.json` should be done by running the index compile pipeline (e.g. `/god-learn-compile`) over this entry. That pipeline was **not** run here (heavy reindex; may require running services; should not be faked by hand).
