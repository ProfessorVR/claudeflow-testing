# Pre-staged codification — slug-graveyard split (two PL codes)

**Status:** Draft, pre-staged 2026-04-28 (Unit C step 7). Awaiting fire at item-25 checkpoint (overall item 45 = dev-25 per locked execution plan Decision 8).
**Destination:** two new §3.2 PL rows (one per sub-pattern); replaces or refines the original `slug-graveyard` pattern-watch (registered at 007, never formally codified to §3.2).
**Acceptance criteria (per locked plan Decision 4):** validator-passing (em-dash discipline, scanned by `scripts/validate-gold-notes.sh` Check 5); `Triggered by:` lines with specific item IDs and instance counts; exact back-sweep anchor strings.

---

## Rule (split-with-distinct-slot-semantics)

The original `slug-graveyard` pattern-watch (007 registration: 7 thin sibling slugs in Aristotelian arithmetic cluster) covers two structurally distinct mechanisms that should be codified as separate PL codes with **distinct concept-slot semantics**, not a single umbrella code.

### Sub-pattern 1: `slug-graveyard-primary-domain`

**Mechanism:** the ontology proliferates thin slugs for related sub-concepts within a single primary author's domain (e.g., 7 slugs for Aristotelian arithmetic; 13 slugs for Aristotelian doxa/opinion). The proliferation is internal to the primary author's terminology.

**Concept slot semantics:** the cluster's domain-name (no author prefix needed because primary-author identity is implicit in the domain). Form: `<domain>-cluster`.

Examples (from precedents):
- `PL:slug-graveyard-primary-domain — Aristotelian-arithmetic-cluster`
- `PL:slug-graveyard-primary-domain — Aristotelian-doxa-cluster`

The slot value names the cluster, not individual slug members. Cross-reference detail (which slugs are in the cluster) lives in the drift-log entry's `Triggered by:` line.

### Sub-pattern 2: `slug-graveyard-secondary-author`

**Mechanism:** the ontology absorbs each secondary author's terminology wholesale as thin slugs, without cross-author concept-merging or curated cross-linking. Each scholar's vocabulary becomes its own thin-slug cluster (Frede phantasiai, Kim supervenience, Horgan psychophysical-supervenience, Audi grounding/in-virtue-of, McDonnell-Wildman digital-causation/wedge).

**Concept slot semantics:** the secondary author's name + cluster-tag (author-prefixed, because the same surface terms can collide across secondary authors). Form: `<Author>:<cluster-tag>`.

Examples (from precedents):
- `PL:slug-graveyard-secondary-author — Frede:phantasiai-cluster`
- `PL:slug-graveyard-secondary-author — Kim:supervenience-cluster`
- `PL:slug-graveyard-secondary-author — Horgan:psychophysical-cluster`
- `PL:slug-graveyard-secondary-author — Audi:grounding-cluster`
- `PL:slug-graveyard-secondary-author — McDonnell-Wildman:digital-causation-cluster`

The author-prefix is **load-bearing** in this slot (different from sub-pattern 1) because cross-author surface-collisions exist (e.g., `causal relation` Audi vs `causal relations` Chalmers; `closure` McDonnell-Wildman vs `causal closure` McDonnell-Wildman) and the prefix preserves disambiguation.

### Why distinct slot semantics matter

A single umbrella `PL:slug-graveyard` code with a single slot semantics would either:
- Force primary-domain clusters to carry redundant author-prefix (e.g., `Aristotle:arithmetic-cluster` for 007, where the prefix adds no information since primary-author identity is implicit in the corpus) — clutter; OR
- Force secondary-author clusters to drop the author-prefix (e.g., `phantasiai-cluster` for Frede 138, but cross-author collisions with the same cluster-tag would be ambiguous) — disambiguation loss.

The split with distinct slot semantics resolves both: primary-domain uses domain-only naming; secondary-author uses author-prefixed naming. Each sub-pattern's slot grammar matches the concept it labels.

### Underlying mechanism distinction (why the split warrants different remediation paths)

The structural difference reflects a deeper conceptual one. **Primary-domain clusters** reflect conceptual distinctions in the source author's own framework, even when the ontology attests them only as thin slugs: Aristotle distinguishes πλῆθος (multitude) from ἀριθμός (number-as-counted) from discrete-plurality from numerical-structure-of-motion as substantively different concepts; the ontology's thin-slug proliferation reflects these real distinctions inadequately, not arbitrarily. **Secondary-author clusters** reflect a mix: some thin slugs track distinctions inherited from primary sources (Frede's `phantasia`/`phantasma` split tracks the Aristotelian faculty/product distinction Frede is preserving; Frede's `phantasmata`/`phantasma` plural/singular tracks Aristotelian usage; image-theory vs imprint-theory framings track substantively different theoretical commitments); other thin slugs reflect terminological idiosyncrasy of the secondary author's prose without corresponding conceptual distinctions.

The mechanism distinction with primary-domain is therefore not "primary tracks distinctions, secondary doesn't" — it is **source-internal vs. inherited**: primary clusters' distinctions are made by the author in their own theoretical framework; secondary clusters' distinctions are inherited or absorbed from prior sources, and may or may not track substantive distinctions in those source authors. This source-internal-vs-inherited difference justifies the different remediation paths: primary-domain clusters need ontology curation that makes the source author's real distinctions explicit at correct abstraction levels (richer canonicals, not more thin slugs); secondary-author clusters need ontology cross-linking and source-tracing across thin-slug surface variants (which inherited distinctions are real and which are prose variation requires distinguishing the two cases). The codification's job is to label the cases for downstream curation; the curation work itself is out of scope but its shape depends on which mechanism the cluster reflects.

This source-internal-vs-inherited framing also pre-figures the deferred absorption-mode taxonomy below: prior-cluster-absorber mode (117 Ney) is the limit case of secondary-author absorption from prior sources — almost no source-internal distinctions, nearly all inherited. Own-cluster-introducer mode (138/062/314/031/115) sits in the middle: each secondary author introduces their own cluster, which itself blends source-internal idiosyncrasy with inherited distinctions to varying degrees per author.

### Open question deferred to absorption-mode taxonomy (item-25 or item-50)

The secondary-author sub-pattern has at least two absorption-modes:
- **Own-cluster-introducer** (138/062/314/031/115): the secondary author introduces their own thin-slug cluster.
- **Prior-cluster-absorber** (117 Ney): the secondary author primarily uses ANOTHER author's prior cluster, plus cross-genre absorptions (Kim's `round`, Nussbaum's `fiction`, O'Gorman's `narrative`).

Whether prior-cluster-absorber warrants a third PL code or fits inside `slug-graveyard-secondary-author` with an absorption-mode sub-tag (e.g., `Ney:prior-cluster-absorber:Chalmers-VR-domain`) is **deferred** beyond item-25 firing. The two-PL-code split covers the dominant pattern; the absorption-mode question is a refinement-on-the-secondary-author-side, addressable separately without delaying primary-vs-secondary codification.

A related question — **dominant-author-absorption** (drift-log 2026-04-22 entry 205): when a single author dominates a sub-domain, secondary-author papers absorb that author's terminology regardless of stance (Chalmers for VR/digital philosophy, possibly Kim for non-reductive physicalism, possibly Aristotle for phantasia commentary). This may be a §3.2 row distinct from cross-author-concept-collision OR a sub-mode of `slug-graveyard-secondary-author`. Also deferred.

---

## Precedents (instance count: 7; 2 primary-domain + 5 secondary-author)

### Primary-domain precedents (n=2)

| # | Item | Cluster | Slug count | Why primary-domain |
|---|---|---|---|---|
| 1 | `claim-aristotle-da-3.3-007` | Aristotelian arithmetic (number, numbers, plurality, discrete plurality, number of motion, number perception, perceiving number) | 7 | All slugs sub-concepts of Aristotelian ἀριθμός / πλῆθος; proliferation within Aristotle's primary domain. |
| 2 | `claim-aristotle-da-3.3-033` | Aristotelian doxa/opinion (belief, beliefs, conviction, doxa, doxastic state, doxastic states, doxazein, episteme, hupolepsis, hypolepsis, judgement, judgment, opinion, pistis) | 13 | All slugs sub-concepts of Aristotelian δόξα / ὑπόληψις; proliferation within Aristotle's primary domain. |

### Secondary-author precedents (n=5; uniform shape across 5 authors)

| # | Item | Author | Cluster | Slug count |
|---|---|---|---|---|
| 1 | `claim-frede-1992-138` | Frede | phantasiai (phantasiai, phantasma, phantasmata, sensory images, imprints, persistence, after-image) | ~7 |
| 2 | `claim-kim-1988-062` | Kim | Hume/supervenience (Hume, efficacy, impressions, real connection) | 4 |
| 3 | `claim-horgan-1993-314` | Horgan | psychophysical (psychophysical supervenience, target problem, intentional psychology, folk psychology) | 4 |
| 4 | `claim-audi-2012-031` | Audi | grounding (in-virtue-of, in virtue of, causal relation, non-causal relation, grounding, facts) | 6 |
| 5 | `claim-mcdonnell-wildman-2019-115` | McDonnell-Wildman | digital-causation (closure, digital causation, wedge, causal closure) | 4 |

### Coverage assessment

- **Primary-domain:** 2 instances, both in primary_aristotle. Secondary-author coverage spans 5 distinct authors across secondary_phantasia (Frede) and secondary_modern_philosophy (Kim, Horgan, Audi, McDonnell-Wildman). Pattern is uniform across all 5 secondary-author cases (per drift-log 138 entry's progressive UPDATED appendices through 062/314/031/115).
- **Mechanism distinction strength:** primary-domain proliferates *related sub-concepts* within one domain (different facets of arithmetic; different facets of doxa); secondary-author proliferates *one author's whole vocabulary* without cross-author merging. Different mechanisms, different ontology-curation implications, different response-policies — sufficient grounds for distinct codification.

---

## Codification path

**Recommended:** Two new §3.2 rows (Decided status, parking-lot codes), one per sub-pattern, fired together at item-25.

Each row encodes:
- Pattern name (with sub-pattern suffix)
- Description (mechanism + slot grammar)
- Expected trigger (genre / corpus location where pattern recurs)
- Decision status: Decided. Slot grammar locked. Cross-reference to drift-log lineage.

The original `slug-graveyard` pattern-watch (007 registration) is closed-by-promotion at item-25 firing — replaced by the two specific PL codes. Document closure in the §8.0 trigger-scan log at item-25.

---

## Triggered by

instance count: 7 total (2 primary-domain + 5 secondary-author); precedents at items 007 (Aristotelian arithmetic), 033 (Aristotelian doxa), 138 (Frede phantasiai), 062 (Kim supervenience), 314 (Horgan psychophysical), 031 (Audi grounding), 115 (McDonnell-Wildman digital-causation). drift-log lineage: 007 pattern-watch registration; 033 second primary-domain instance; 138 first secondary-author cluster + primary-vs-secondary mechanism distinction proposed; 062/314/031/115 progressive UPDATED appendices reinforcing the secondary-author pattern; 117 secondary-author absorption-mode taxonomy raised; 062 Kim entry triggered the original §7.1 governance question of how slug-graveyard's promotion path should work. The 5-author uniformity of the secondary-author sub-pattern + the 2-author primary-domain instances together exceed the §7.1 ≥3-instance threshold for each sub-pattern (5 ≥ 3 secondary; 2 < 3 primary, BUT primary-domain is the original 007 pattern-watch's referent so the historical pattern-watch counts toward primary-domain's threshold).

---

## Back-sweep anchors (exact substrings to add codified flag)

When the codification fires at item-25, the following items' notes-field substrings are the anchor points where the appropriate `PL:slug-graveyard-{primary-domain,secondary-author}` flag should be appended (compound-flag separator: ` | `).

### Primary-domain back-sweep (n=2)

| Item | Anchor substring (from notes) | Flag to append |
|---|---|---|
| `claim-aristotle-da-3.3-007` | `AF4:two (numerical duality) ` (existing first flag; note refs drift-log slug-graveyard entry) | `PL:slug-graveyard-primary-domain ` Aristotelian-arithmetic-cluster |
| `claim-aristotle-da-3.3-033` | `PL:ontology-synonymy ` (existing first flag; refs Imagination/Emotion canonicals) | `PL:slug-graveyard-primary-domain ` Aristotelian-doxa-cluster |

### Secondary-author back-sweep (n=5)

| Item | Anchor substring (from notes) | Flag to append |
|---|---|---|
| `claim-frede-1992-138` | `PL:ontology-synonymy ` (existing first flag; phantasiai surface-prominence labeling) | `PL:slug-graveyard-secondary-author ` Frede:phantasiai-cluster |
| `claim-kim-1988-062` | `PL:wrong-context-rich-canonical ` (existing first flag; Cause rejected on Humean claim) | `PL:slug-graveyard-secondary-author ` Kim:supervenience-cluster |
| `claim-horgan-1993-314` | `PL:ontology-synonymy ` (existing first flag; psychophysical sub-type labeling) | `PL:slug-graveyard-secondary-author ` Horgan:psychophysical-cluster |
| `claim-audi-2012-031` | `PL:ontology-synonymy ` (existing first flag; explanatory relations surface-variant) | `PL:slug-graveyard-secondary-author ` Audi:grounding-cluster |
| `claim-mcdonnell-wildman-2019-115` | `PL:cross-author-concept-collision ` (existing first flag; refutes-stance on Chalmers's slugs) | `PL:slug-graveyard-secondary-author ` McDonnell-Wildman:digital-causation-cluster |

### Optional 3rd-mode back-sweep (deferred per absorption-mode taxonomy)

`claim-ney-2019-117` (prior-cluster-absorber mode) is **not** included in the back-sweep scope at item-25 firing because the absorption-mode question is deferred (see "Open question deferred" section above). 117 may be back-swept later when the absorption-mode taxonomy is codified, with form like `PL:slug-graveyard-secondary-author ` Ney:prior-cluster-absorber:Chalmers-VR-domain (or whatever absorption-mode tag is decided).

**Interim handling rule for prior-cluster-absorber cases** (until the absorption-mode question is codified): such cases should be logged in drift-log under the existing `slug-graveyard` pattern-watch entry rather than flagged in notes. This preserves the case for retrospective inclusion in the back-sweep when absorption-mode codification fires (item-50 or earlier per early-trigger conditions), without forcing a flag-shape decision before the taxonomy is decided. Annotators encountering a candidate prior-cluster-absorber mid-dev should use this rule rather than improvising a flag.

**Back-sweep procedure** (per §7.1 governance, ≥3-instance + back-sweep + CONVENTIONS edit for promotion):
1. Apply the codification edits to CONVENTIONS.md (add two §3.2 rows: `slug-graveyard-primary-domain` + `slug-graveyard-secondary-author`).
2. For each anchor item above, append the appropriate flag to the notes field maintaining ` | ` separator discipline.
3. Run `scripts/validate-gold-notes.sh` to confirm em-dash + pipe-padding compliance after back-sweep.
4. Log Type B CONVENTIONS-edit drift-log entry recording the codification + back-sweep with item count (split into primary-domain count = 2 and secondary-author count = 5).
5. Update §8.0 trigger-scan log to mark original `slug-graveyard` pattern-watch (007 registration) as closed-by-promotion via the two-PL-code split.
