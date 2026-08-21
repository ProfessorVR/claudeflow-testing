#!/usr/bin/env python3
"""Phase 4 Tier B — run all 7 gap queries + 3 deep-analysis source digests.

Writes results as JSON to ./results/ for downstream markdown synthesis.
"""

import json
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))
import query as Q

OUT = os.path.join(os.path.dirname(__file__), "results")
os.makedirs(OUT, exist_ok=True)

# 7 Tier B gaps with their query specs.
# Each spec is a list of (label, fn, args) triples; we run them all and store.
TIER_B_GAPS = [
    {
        "gap_id": "DISS-04-G-C190",
        "claim_id": "DISS-04-C190",
        "section": "DISS-04-EMOTION",
        "missing_locus": "Caston 2021 Cartesian Theatre — controlling sense / faculty differentiation",
        "claim_text": (
            "Aristotle traces the impairment to a structural fact of the cognitive apparatus: the faculty by which "
            "the controlling sense judges is not identical with the faculty by which images come before the mind, "
            "and the latter can override the former when sufficiently agitated."
        ),
        "queries": [
            ("dpc-caston-q1", "Caston 2021 Cartesian Theatre faculty differentiation phantasia controlling sense judgement",
             "query_dpc", {"author_filter": "Caston, Victor", "n_results": 5}),
            ("dpc-caston-q2", "phantasia overrides controlling sense agitation distinct faculty non-identity",
             "query_dpc", {"author_filter": "Caston, Victor", "n_results": 5}),
            ("dpc-caston-q3", "On Dreams 460b3-16 controlling sense judgement faculty separate phantasia",
             "query_dpc", {"author_filter": "Caston, Victor", "n_results": 5}),
            ("meta-on-dreams", "On Dreams 460b3-16 controlling sense judgement faculty separate phantasia",
             "query_metaphysics", {"n_results": 3}),
        ],
    },
    {
        "gap_id": "DISS-05-G-C013",
        "claim_id": "DISS-05-C013",
        "section": "DISS-05-A4",
        "missing_locus": "Corcilius 2013 (MA somatic preparation)",
        "claim_text": (
            "Aristotle locates the somatic preparation of the organic parts internal to this transition rather than "
            "as a discrete subsequent stage. (MA 702a17-19)"
        ),
        "queries": [
            ("dpc-corcilius-q1", "MA 702a17-19 somatic preparation organic parts internal transition Aristotle animal motion",
             "query_dpc", {"author_filter": "Corcilius, Klaus", "n_results": 5}),
            ("dpc-corcilius-q2", "somatic preparation internal stage continuous motion organa pneumatic Corcilius",
             "query_dpc", {"author_filter": "Corcilius, Klaus", "n_results": 5}),
            ("dpc-corcilius-q3", "De Motu Animalium pneuma symphyton organic parts preparation locomotion",
             "query_dpc", {"author_filter": "Corcilius, Klaus", "n_results": 5}),
        ],
    },
    {
        "gap_id": "DISS-05-G-C031",
        "claim_id": "DISS-05-C031",
        "section": "DISS-05-A4",
        "missing_locus": "Sheehan 2015 — Heidegger Aristotle technē / praxis",
        "claim_text": (
            "The three-types distinction this section develops tracks the technē/praxis distinction: simple appetition "
            "does not engage hexis in either mode; habitual-procedural action operates through technē-hexis; "
            "evaluatively complex action — when the agent has cultivated the relevant aretē — operates through praxis-hexis."
        ),
        "queries": [
            ("dpc-sheehan-q1", "Heidegger Aristotle technē praxis distinction hexis Bewegtheit GA 18 paradigm shift",
             "query_dpc", {"author_filter": "Sheehan, Thomas", "n_results": 5}),
            ("dpc-sheehan-q2", "praxis-hexis technē-hexis bivalence character formation aretē habituation Heidegger",
             "query_dpc", {"author_filter": "Sheehan, Thomas", "n_results": 5}),
            ("dpc-sheehan-q3", "phronēsis technē praxis distinction Nicomachean Ethics VI Heidegger reading",
             "query_dpc", {"author_filter": "Sheehan, Thomas", "n_results": 5}),
        ],
    },
    {
        "gap_id": "DISS-05-G-C053",
        "claim_id": "DISS-05-C053",
        "section": "DISS-05-A4",
        "missing_locus": "Sheehan 2015 (same as C031) — unreflective-action structural condition",
        "claim_text": (
            "The structural condition for 'what we do without reflection' is not the absence of doxa but the presence "
            "of hexis-grounded doxa."
        ),
        "queries": [
            ("dpc-sheehan-q1", "Heidegger unreflective action hexis-grounded doxa pre-reflective comportment",
             "query_dpc", {"author_filter": "Sheehan, Thomas", "n_results": 5}),
            ("dpc-sheehan-q2", "absence of reflection presence of hexis settled doxa action without deliberation Aristotle",
             "query_dpc", {"author_filter": "Sheehan, Thomas", "n_results": 5}),
            ("dpc-sheehan-q3", "habit virtue automaticity practical knowledge implicit understanding habituated comportment",
             "query_dpc", {"author_filter": "Sheehan, Thomas", "n_results": 5}),
        ],
    },
    {
        "gap_id": "DISS-05-G-C070",
        "claim_id": "DISS-05-C070",
        "section": "DISS-05-A4",
        "missing_locus": "Costache 2013 — Heidegger pathos / discourse / idle talk",
        "claim_text": (
            "Where Type 2 hexis is technē-hexis (settled doxa furnishing the universal premise of the practical syllogism, "
            "fired routinely), Type 3 hexeis are praxis-hexeis: sedimented dispositions of emotional comportment, the "
            "diachronic residue of repeated pathos-actualizations (cf. §1.7), cultivated as the standing capacity for "
            "rightly-disposed comportment toward the pathē the situation demands."
        ),
        "queries": [
            ("dpc-costache-q1", "Heidegger pathos discourse idle talk Aristotle rhetoric sedimented disposition",
             "query_dpc", {"author_filter": "Costache, Adrian", "n_results": 5}),
            ("dpc-costache-q2", "praxis-hexis emotional comportment habituation pathē Aristotelian rhetoric Heidegger GA 18",
             "query_dpc", {"author_filter": "Costache, Adrian", "n_results": 5}),
        ],
    },
    {
        "gap_id": "DISS-05-G-C085",
        "claim_id": "DISS-05-C085",
        "section": "DISS-05-A4",
        "missing_locus": "Papachristou 2013 three grades of phantasia (cross-ref)",
        "claim_text": (
            "Phantasia operates in all three action types, but differently in each: as the immediate phantasma "
            "identifying the present object in Type 1; as the settled phantasma informing the universal premise "
            "of the practical syllogism in Type 2; and as the projected phantasma over which doxa operates in Type 3."
        ),
        "queries": [
            ("rh-papachristou-q1", "three kinds grades phantasia Aristotle De Anima Papachristou immediate settled projected",
             "query_rhetorical_ontology", {"n_results": 5}),
            ("rh-papachristou-q2", "phantasia tri-modal distinction perceptual recollective deliberative Aristotle DA III",
             "query_rhetorical_ontology", {"n_results": 5}),
            ("rh-papachristou-q3", "phantasia practical syllogism deliberation projected phantasma future action Aristotle",
             "query_rhetorical_ontology", {"n_results": 5}),
        ],
    },
    {
        "gap_id": "DISS-01-G01-fallback",
        "claim_id": "DISS-01-C042",
        "section": "DISS-01-A0",
        "missing_locus": "BCAP / GA 18 Bewegtheit fallback if corpus/index miss",
        "claim_text": (
            "The qua-structure governs everything: what is actualized in motion is actualized as potential, not as "
            "achieved completion."
        ),
        "queries": [
            ("meta-q1", "Bewegtheit kinēsis Seinscharakter GA 18 Heidegger ontology motion qua-structure",
             "query_metaphysics", {"n_results": 5}),
            ("meta-q2", "potentiality actualization qua structure motion incompleteness ousia Aristotle Physics",
             "query_metaphysics", {"n_results": 5}),
            ("rh-q1", "motion qua potential actualized incomplete energeia entelecheia Aristotle being-character",
             "query_rhetorical_ontology", {"n_results": 5}),
        ],
    },
]


# Deep-analysis source digests — 5-10 top-relevance chunks each per dissertation key terms
DEEP_ANALYSIS = [
    {
        "source_label": "Caston 2021 (Cartesian Theatre)",
        "author_filter": "Caston, Victor",
        "queries": [
            ("phantasia-content-theory", "phantasia content theory representation appearance image cognitive faculty"),
            ("controlling-sense-judgement", "controlling sense kyrion aisthēterion judgement faculty separation"),
            ("non-identity-faculties", "non-identity of faculties phantasia perception judgement distinct"),
            ("cartesian-theatre-critique", "Cartesian Theatre inner stage representation phantasma mental image"),
            ("phantasia-doxa-relation", "phantasia doxa belief relation Aristotle De Anima III"),
        ],
    },
    {
        "source_label": "Agosta 2010 (Heidegger's 1924 Clearing of the Affects)",
        "author_filter": "Agosta, Lou",
        "queries": [
            ("befindlichkeit-clearing", "Befindlichkeit state-of-mind clearing Heidegger 1924 pathos affect"),
            ("aristotle-rhetoric-book-ii", "Aristotle Rhetoric Book II pathē catalog Heidegger reading 1924"),
            ("bcap-pathos-disclosure", "BCAP GA 18 pathos disclosure Erschlossenheit Befindlichkeit"),
            ("emotion-attunement-world", "emotion attunement Stimmung world disclosure being-in-the-world"),
            ("hexis-comportment-affect", "hexis comportment affect disposition character Heidegger Aristotle"),
        ],
    },
    {
        "source_label": "Dow 2011 (Aristotle's Theory of the Emotions: Emotions as Pleasures)",
        "author_filter": "Dow, Jamie",
        "queries": [
            ("emotions-as-pleasures-pains", "emotions as pleasures pains Aristotle Rhetoric II definition"),
            ("doxa-belief-emotion", "doxa belief judgement emotion necessary condition Aristotle anger fear"),
            ("phantasia-emotion-elicitation", "phantasia emotion elicitation memory prospect anticipation"),
            ("rhetoric-ii-catalog", "Rhetoric II.2-11 catalog anger fear pity shame envy emulation"),
            ("epithymia-orexis-pathē", "epithymia orexis pathē appetite desire pleasure pain Aristotle"),
            ("emotion-arousal-art", "emotion arousal art rhetoric proof depraved audience listener"),
        ],
    },
]


def run_gap_queries(gap):
    out = {**gap, "results": []}
    for label, text, fn_name, kwargs in gap["queries"]:
        fn = getattr(Q, fn_name)
        try:
            res = fn(text, **kwargs)
        except Exception as e:
            out["results"].append({"label": label, "text": text, "error": str(e)})
            continue
        ids = res.get("ids", [[]])[0]
        docs = res.get("documents", [[]])[0]
        metas = res.get("metadatas", [[]])[0]
        dists = res.get("distances", [[]])[0]
        hits = []
        for cid, doc, meta, dist in zip(ids, docs, metas, dists):
            hits.append({
                "id": cid,
                "distance": dist,
                "metadata": meta,
                "document": doc,
            })
        out["results"].append({
            "label": label,
            "query_text": text,
            "fn": fn_name,
            "kwargs": kwargs,
            "hits": hits,
        })
    return out


def run_deep_analysis(src):
    out = {**src, "results": []}
    for label, text in src["queries"]:
        try:
            res = Q.query_dpc(text, n_results=5, author_filter=src["author_filter"])
        except Exception as e:
            out["results"].append({"label": label, "text": text, "error": str(e)})
            continue
        ids = res.get("ids", [[]])[0]
        docs = res.get("documents", [[]])[0]
        metas = res.get("metadatas", [[]])[0]
        dists = res.get("distances", [[]])[0]
        hits = []
        for cid, doc, meta, dist in zip(ids, docs, metas, dists):
            hits.append({
                "id": cid,
                "distance": dist,
                "metadata": meta,
                "document": doc,
            })
        out["results"].append({
            "label": label,
            "query_text": text,
            "hits": hits,
        })
    return out


def main():
    gap_results = []
    for gap in TIER_B_GAPS:
        print(f"[gap] {gap['gap_id']}: {gap['missing_locus']}")
        r = run_gap_queries(gap)
        gap_results.append(r)
        with open(os.path.join(OUT, f"{gap['gap_id']}.json"), "w") as f:
            json.dump(r, f, indent=2)
    deep_results = []
    for src in DEEP_ANALYSIS:
        print(f"[deep] {src['source_label']}")
        r = run_deep_analysis(src)
        deep_results.append(r)
        slug = src["author_filter"].split(",")[0].lower()
        with open(os.path.join(OUT, f"deep-{slug}.json"), "w") as f:
            json.dump(r, f, indent=2)
    with open(os.path.join(OUT, "_all.json"), "w") as f:
        json.dump({"gaps": gap_results, "deep": deep_results}, f, indent=2)
    print(f"\nDone. Wrote {len(gap_results)} gap result files + {len(deep_results)} deep-analysis files to {OUT}")


if __name__ == "__main__":
    main()
