# Tier B Citation Fill Proposal — DISS-05-G-C085

**Run-id**: 2026-05-13T1439 / Phase 4 Agent 2 (Tier B ChromaDB)
**Generated**: 2026-05-13T18:30 (local)
**Section**: DISS-05-A4
**Claim id**: DISS-05-C085
**Severity**: MEDIUM
**Load-bearing**: false (T4-interpretive-but-unflagged)
**Support tier (original)**: T4-interpretive-but-unflagged
**Source priority order**: corpus/index FIRST → ChromaDB → Perplexity
**Routing tier final**: Tier B confirmed via `knowledge_chunks` (rhetorical_ontology); **also Tier A available** via `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Papachristou - Three Kinds of Phantasia (2013)/`. Recommended: cite via Tier A entry (already-indexed) and use this Tier B fill as supplementary anchor-text source.
**Vetting tag**: `chromadb-medium / corpus-index-Tier-A-preferred`

## Claim

> "Phantasia operates in all three action types, but differently in each: as the immediate phantasma identifying the present object in Type 1; as the settled phantasma informing the universal premise of the practical syllogism in Type 2; and as the projected phantasma over which doxa operates in Type 3."

DISS-05 line 27. The tri-modal-phantasia thesis.

## Source identification

- **Author**: Papachristou, Christina S.
- **Year**: 2013
- **Title**: "Three Kinds or Grades of Phantasia in Aristotle's *De Anima*"
- **Venue**: *Journal of Ancient Philosophy* (English ed.) 7(1): 19-48
- **DOI**: http://dx.doi.org/10.11606/issn.1981-9471.v7i1p19-48
- **PDF**: `corpus/rhetorical_ontology/Papachristou, Christina - Three Kinds or Grades of Phantasia in Aristotle's De Anima_(2013)_[Clean Copy].pdf`
- **Tier A entry**: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Papachristou - Three Kinds of Phantasia (2013)/phx-08-papachristou.{md,json,edges.csv}`
- **ChromaDB**: 17 chunks in `knowledge_chunks` (collection metadata `{"collection": "rhetorical_ontology", "author_raw": "Papachristou, Christina"}`)

## Top-relevance ChromaDB hits (vetted via author-filter direct retrieval)

The Phase 4 cosine-similarity queries surfaced Papachristou as a softer-similarity hit (dist > 0.7); direct author-filtered retrieval over the 17 Papachristou chunks gives the canonical passages.

### Hit 1 — paper title and abstract (chunk 0, pp.1-3)

> "Three Kinds or Grades of Phantasia in Aristotle's *De Anima*. Christina S. Papachristou. Phantasia/imagination (φαντασία) in Aristotle is one of the parts (μόρια) or faculties/powers (δυνάμεις) of the soul that cannot exist apart from sensation (αἴσθησις) and thought (διάνοια). The function of phantasia and its connection with phantasmata (φαντάσματα), the products of this faculty, [...]"

— Papachristou (2013), pp. 19-21 (ChromaDB chunk 0).

**Why relevant**: Establishes that Papachristou's central thesis is the "three kinds or grades of phantasia" — exactly the tri-modal architecture the dissertation deploys.

### Hit 2 — the second kind: sensitive phantasia in animals (chunk 10, pp.16-18)

> "Aristotle, *De Anima* III, 11, 434 a 5-7: 'Sensitive phantasia, then, as it has been said, exists also in the other animals'. [...] In order to fully understand what the Stageirite philosopher is saying about sensitive phantasia (αἰσθητικὴ φαντασία) and as we shall examine later about calculative or deliberative phantasia (λογιστικὴ ἢ βουλευτικὴ φαντασία), it is necessary first to explain some of [...]"

— Papachristou (2013), pp. 17-18 (ChromaDB chunk 10).

**Why relevant**: Papachristou's first explicit naming of the contrast: αἰσθητικὴ φαντασία ("sensitive phantasia") versus λογιστικὴ ἢ βουλευτικὴ φαντασία ("calculative or deliberative phantasia"). This is the Aristotelian textual ground for the Type 1 / Type 3 distinction in DISS-05-C085.

### Hit 3 — the third kind: deliberative phantasia in rational beings (chunk 13, pp.22-24)

> "The third kind or grade of phantasia is found in those animals, which possess reason, or, as Sir David Ross asserts, 'the deliberative imagination, the rational imagination…is monopoly of reasoning beings, i.e. of men.' For whether a person will do this or that is the work of calculation, of reasoning. Of course, rational beings do not always act according to a plan (use of calculative or deliberative phantasia), but they can also act according to the awareness of the moment (use of sensitive phantasia). What the philosopher meant by saying 'καὶ αἴτιον τοῦτο τοῦ δόξαν μὴ δοκεῖν ἔχειν, ὅτι τὴ[ν]...'"

— Papachristou (2013), pp. 22-24 (ChromaDB chunk 13).

**Why relevant**: DIRECT anchor for the dissertation's Type 3 "projected phantasma over which doxa operates" — Papachristou's third kind. The footnoted contrast that rational beings "do not always act according to a plan" but "can also act according to the awareness of the moment" maps exactly onto the dissertation's Type 1 (live phantasma) vs Type 3 (projected/deliberative phantasma) distinction.

### Hit 4 — the residual/memory mode: Aquinas on motus phantasiae (chunk 9, pp.15-16)

> "Thomas Aquinas explains that imperfect animals (animalia imperfecta) possess an indeterminate phantasia (phantasia indeterminata). This phantasia is indeterminate because the motion of phantasia (motus phantasiae) does not remain in this kind of creatures after the sense object is gone: 'Videtur tamen hoc esse contrarium ei quod supra dixerat: quia si pars decisa habet sensum et a[ppetitum...]'"

— Papachristou (2013), pp. 15-16 (ChromaDB chunk 9).

**Why relevant**: The motus phantasiae (kinetic persistence of phantasma after the sense-object is gone) is the canonical Aquinas+Aristotle source for the dissertation's `resonant aisthēma` / `resonant epithymia` apparatus AND for the "settled phantasma informing the universal premise" reading at Type 2.

### Hit 5 — conclusion: phantasia as intermediate faculty (chunk 14, pp.24-26)

> "On the basis of the analysis undertaken above it appears that Aristotle's treatment of phantasia/imagination is a complicated subject. Phantasia is a faculty of the soul, the imaginative (φανταστικόν), that is placed between sensation (αἴσθησις) and thought (διάνοια). On the one hand it depends on sensation, is a kind of affection (πάθος), and on the other is a necessary condition for memory, motion, dreaming [...]"

— Papachristou (2013), pp. 24-26 (ChromaDB chunk 14).

**Why relevant**: Papachristou's conclusion: phantasia as intermediate-faculty between αἴσθησις and διάνοια, "necessary condition for memory, motion, dreaming." This frames the tri-modal structure: live (αἴσθησις-attached, Type 1), residual (memory/motion, Type 2), and deliberative (διάνοια-attached, Type 3).

## Routing

- **Tier A (PREFERRED)**: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Papachristou - Three Kinds of Phantasia (2013)/phx-08-papachristou.md` — already pipelined; user-curated entry.
- **Tier B (this fill)**: `corpus/rhetorical_ontology/Papachristou, Christina - Three Kinds or Grades of Phantasia in Aristotle's De Anima_(2013)_[Clean Copy].pdf`, indexed in `knowledge_chunks` (collection metadata `rhetorical_ontology`).
- The corpus-routing-plan's Tier B route lists `corpus/download/Papachristou-2013`, but **the source is actually already indexed in `corpus/rhetorical_ontology/` AND in `corpus/index/`**, not in `corpus/download/`. This Tier B fill leverages ChromaDB to surface verbatim text; final user citation should reference the Tier A entry.

## Recommended LaTeX form

> Papachristou (2013) provides scholarly support for the tri-modal reading of phantasia developed here. Aristotle distinguishes "sensitive phantasia" (αἰσθητικὴ φαντασία), which "exists also in the other animals" (DA III.11, 434a5-7), from "calculative or deliberative phantasia" (λογιστικὴ ἢ βουλευτικὴ φαντασία), the "monopoly of reasoning beings" (Papachristou 2013, p. 22, citing Ross). On Papachristou's three-kinds reading, deliberative phantasia governs cases in which "a person will do this or that" by "calculation" (p. 23); sensitive phantasia governs cases in which one acts "according to the awareness of the moment" (p. 23). The three-types architecture developed in this section refines this distinction: Type 1 operates via the immediate phantasma identifying the present object (sensitive phantasia); Type 2 via the settled phantasma informing the universal premise of the practical syllogism (the kinetic-persistent phantasma, cf. Aquinas's motus phantasiae, Papachristou 2013, p. 15); Type 3 via the projected phantasma over which doxa operates (deliberative phantasia).

## Remediation action

Per the gap table: `ADD_INTERPRETIVE_FLAG+ADD_CROSSREF`. The cross-reference to Papachristou's three-kinds reading is discharged via this Tier B fill (and the existing Tier A entry).

## Vetting checklist (user review required)

- [ ] Verify pagination — Papachristou is paginated 19-48 within the journal volume; chunk metadata uses internal-PDF pagination
- [ ] Verify transcription of Greek terms against Tier A entry `phx-08-papachristou.md`
- [ ] Cross-check with existing DISS-03 Papachristou tier-c fill: `_per-section/DISS-03-A3/citation-fills/DISS-03-G-PAPACHRISTOU-AQUINAS-tier-c.md`
- [ ] Apply new terminology where contextually relevant: cross-references to `resonant epithymia` (residual phase) and `resonant pathē` (phantasma-attached articulationally-concrete emotion)

## Note on hidden-Tier-A status

The corpus-routing-plan classified this gap as Tier B because the cache citation chain referenced "Papachristou 2013 (corpus/download)." Phase 4.0 investigation confirms that Papachristou is *already* in corpus/index AND in corpus/rhetorical_ontology — it is not in corpus/download/. This Tier B fill is provided for completeness; the operationally-strongest route remains Tier A via `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Papachristou - Three Kinds of Phantasia (2013)/phx-08-papachristou.md`.

## Provenance

- Phase 4 query scripts: `tmp/Dissertation/phase4-tier-b/run_all.py` + `papachristou_retry.py`
- Raw result JSON: `tmp/Dissertation/phase4-tier-b/results/DISS-05-G-C085.json` + `DISS-05-G-C085-papachristou-author-filter.json`
- corpus/index entry: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Papachristou - Three Kinds of Phantasia (2013)/`
