# Tier B Citation Fill Proposal — DISS-05-G-C053

**Run-id**: 2026-05-13T1439 / Phase 4 Agent 2 (Tier B ChromaDB)
**Generated**: 2026-05-13T18:30 (local)
**Section**: DISS-05-A4
**Claim id**: DISS-05-C053
**Severity**: HIGH (architectural-substantive)
**Load-bearing**: false (T4-interpretive-but-unflagged)
**Support tier (original)**: T4-interpretive-but-unflagged
**Routing tier final**: Tier B (Sheehan 2015 ChromaDB-medium); Tier A primary (corpus/index/Heidegger and Rhetoric — Gross/Kemmann 2005) remains the load-bearing complement.
**Vetting tag**: `chromadb-medium-strong / unvetted-against-PDF`

## Claim

> "The structural condition for 'what we do without reflection' is not the absence of doxa but the presence of hexis-grounded doxa."

DISS-05 line 21. Shifts the explanatory burden from "absence of doxa" to "hexis-grounded doxa."

## Source identification (Sheehan 2015 — shared with DISS-05-G-C031)

- **Author**: Sheehan, Thomas
- **Year**: 2015
- **Title**: *Making Sense of Heidegger: A Paradigm Shift*
- **PDF**: `corpus/download/_extra_making-sense-of-heidegger-a-paradigm-shift.pdf`
- **Chunks ingested**: 524 (Phase 4.0)

## Top-relevance ChromaDB hits (vetted)

### Hit 1 — practical-order disclosure: "we also make sense of [things in] existentiel acts" (chunk 320, p.230)

**Distance (cosine)**: 0.3486

> "Underlying the whole of Heidegger's philosophy is the fact that we cannot encounter anything outside the parameters that define us as human — as a thrown-open, socially and historically embodied λόγος. But granted that much, we also cannot not make sense of anything we meet, whether in practice or in theory. In the theoretical order, we make sense of things in existentiel acts of λέγειν as ἀποϕαίνεσθαι: showing things in the way we claim (rightly or wrongly) that they are. In the practical order we also make sense of [...]"

— Sheehan (2015), p. 230 (ChromaDB chunk index 320).

**Why relevant**: Sheehan distinguishes theoretical sense-making (λόγος-as-ἀποϕαίνεσθαι, claim-making) from practical sense-making — exactly the level at which the dissertation's hexis-grounded-doxa claim operates. Pre-reflective action is not the absence of meaning-disclosure but a different mode of it.

### Hit 2 — phronēsis as habitual capability of foresightful knowing-how (chunk 426, p.301)

**Distance (cosine, via DISS-05-G-C031 query)**: 0.43

> "In 'The Question of Technik' Heidegger is focused only on knowing-how: calculative thinking or instrumental/means-ends rationality. [...] The habitual capabilities of foresightful knowing-how are distinguished as follows. The first instance, φρόνησις, is the capability to act well in human affairs both individual and social [...] This calculative virtue of φρόνησις is what Being and Time calls Umsicht, the existential capability to look ahead to both an existentiel goal and the means to attain it."

— Sheehan (2015), p. 301 (ChromaDB chunk index 426).

**Why relevant**: Sheehan calls φρόνησις a "habitual capability" — the structural feature DISS-05-C053 names hexis-grounded doxa. Foresightful knowing-how is precisely doxa-with-hexis, not absence of doxa.

### Hit 3 — habituation, hexis, NE II.1-5 (chunk 425, p.300, footnote 28)

**Distance (cosine, via shared retrieval)**: ~0.34

> "ἕξις = habitus, a way of 'having oneself' (i.e., a way of being oneself). Cf. GA 18: 172-80 = 116-22, commenting on Metaphysics V.20 and 23 and Nicomachean Ethics II.1-5."

— Sheehan (2015), p. 300 fn 28 (ChromaDB chunk index 425).

**Why relevant**: Sheehan ties hexis to GA 18 (Heidegger's BCAP §17-18) and NE II.1-5 (Aristotle's habituation passages). This is the cross-reference for the dissertation's hexis-grounded-doxa thesis.

### Hit 4 — practical disclosure / Umsicht (chunk 170, pp.124-125)

**Distance (cosine)**: 0.3500

> "[A]n element of thrown-ahead- and-returning in terms of existential thrown-openness ('thrown projectedness': geworfener Entwurf) that makes possible the existentiel synthesizing of things with possible meanings. [...] Aquinas here draws on Proclus, The Elements of Theology, proposition 82 [...] 'All that is capable of self-knowledge is capable of completely returning to itself.'"

— Sheehan (2015), pp. 124-125 (ChromaDB chunk index 170).

**Why relevant**: Connects Heidegger's "thrown projection" (geworfener Entwurf) — the existential structure underlying unreflective action — to the medieval-Aristotelian habit/hexis tradition (Aquinas via Proclus). Supports the architectural reading that unreflective action operates through projected-but-not-thematized doxa.

## Note on retrieval quality

The dissertation's claim is a delicate interpretive thesis (structural condition = presence not absence of doxa). Sheehan 2015 does not directly assert it; he provides the broader framework (habituation, hexis, λέγειν / πρᾶξις distinction, foresightful knowing-how, Umsicht) in which the dissertation's thesis becomes intelligible. The strongest Tier A complement is `corpus/index/Heidegger and Rhetoric/Gross-A or Kemmann/Kisiel chapters` (which the existing gap-table routing recommended). The Tier C Perplexity fill at `_per-section/DISS-05-A4/citation-fills/DISS-05-G-C031-tier-c.md` (Sherman 1989) is shared between C031 and C053.

## Routing

- corpus/download path: `corpus/download/_extra_making-sense-of-heidegger-a-paradigm-shift.pdf`
- Key chunks: 170, 320, 425, 426 (Sheehan Ch.10 + thrown-projection material from Ch.4)
- Tier A primary route: `corpus/index/Heidegger and Rhetoric` (Gross/Kemmann 2005)
- ChromaDB filter: `{"author": "Sheehan, Thomas"}`

## Recommended LaTeX form

> Heidegger's analysis of phronēsis as Umsicht — "the existential capability to look ahead to both an existentiel goal and the means to attain it" (Sheehan 2015, p. 301) — establishes the framework within which the structural condition for unreflective action can be specified. As Sheehan emphasizes, we "cannot not make sense of anything we meet, whether in practice or in theory" (Sheehan 2015, p. 230). What disappears in unreflective action is not the doxa-mediated meaning-disclosure but the thematic articulation of it; the doxa remains operative as a hexis-grounded structural-condition of the action — a "habitual capability of foresightful knowing-how" (Sheehan 2015, p. 301), not its absence.

## Remediation action

Per the gap table: `ADD_INTERPRETIVE_FLAG_SUBSTANTIAL+ADD_SECONDARY`. This Tier B fill provides the secondary anchor; Tier A (Heidegger and Rhetoric) provides the load-bearing primary.

## Vetting checklist (user review required)

- [ ] Verify pagination (book pp. 124-125, 230, 300-301)
- [ ] Verify verbatim transcription against PDF
- [ ] Compare with Tier C Sherman 1989 fill (DISS-05-G-C031-tier-c.md)
- [ ] Decide whether to anchor primarily in Sheehan, Gross/Kemmann, or split (recommend split: Heidegger and Rhetoric for the primary anchor; Sheehan for the technē/praxis cross-reference)

## Provenance

- Phase 4.0 ingest log: `corpus/download/_ingest-logs/_extra_making-sense-of-heidegger-a-paradigm-shift-2026-05-13T1439.log`
- Phase 4 query scripts: `tmp/Dissertation/phase4-tier-b/run_all.py` + `sheehan_keyword.py`
- Raw result JSON: `tmp/Dissertation/phase4-tier-b/results/DISS-05-G-C053.json`
