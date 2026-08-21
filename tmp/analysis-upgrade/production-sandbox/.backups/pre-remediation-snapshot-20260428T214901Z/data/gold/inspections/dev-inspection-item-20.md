# Dev-Candidate Inspection — Item-25 Deferred-Decision Evidence Map

**Trigger:** item-20 §8.0 trigger scan (logged as Type A drift-log entry); item-25 deferred-decision evidence-availability question
**Inspection date:** 2026-04-22 (full content originally produced this date)
**Migration date:** 2026-04-28 (Unit A step 2 of dev-annotation execution plan)
**Provenance note:** Body content below (sections (a) and (b)) is verbatim from original inspection extracted from session transcript `~/.claude/projects/-home-dalton-projects-claudeflow-testing/5226329c-349b-4645-b462-2509e369aeca.jsonl` (line 1081, parentUuid 5c11fd1d-bac9-43ac-87b5-7d3eb5681dfa). The framework-maturity meta-observation footer was added later (2026-04-28) during the plan-critique loop and is *not* part of the original inspection.

---

Inspection covered all 150 dev candidates across 4 files (45 primary_aristotle + 30 primary_heidegger + 45 secondary_phantasia + 30 secondary_non_phantasia). Lightweight pass on metadata + claim-text only, no annotation. Findings per item-25 deferred decision:

---

## (a) Per-Decision Evidence Availability

### 1. AF5 subtype-proliferation

**Current state at holdout-close:** 7 instances / 5 items / 3 confirmed subtypes + 1 candidate 4th subtype (framework-specificity at 115 causal closure). Splitting evaluation forced doubly per criteria (1) and (2).

**Dev evidence available:**
- **Elided-contrast** (subtype well-supported): 15+ candidates with explicit negation/contrast cues — aristotle 047/049/029/028/040/080/051/026/020, heidegger 097, nussbaum 077, frede 030, caston 016, horgan 136/325, ney 043. Subtype is robustly attested across genres.
- **Analogical-target:** 2-3 candidates — aristotle 068 ("If thinking is like perceiving"), 016 ("regard thinking as a bodily process analogous to perceiving"), 020 ("knowing like by like"). Less common, marginal evidence-base extension.
- **Definitional-target:** 5+ candidates — aristotle 060 (phantasia definition), 044 (opinion-belief-conviction chain), heidegger 064 (species predicable), 067 (accidens), nussbaum 084 (aisthesis def). Subtype well-supported.
- **Framework-specificity (4th candidate, n=1 currently):** 8+ candidates with umbrella-named-explicitly + framework-variant-implicit shape — horgan 091 (Davidson/Morgan supervenience-as-framework), 213 (emergentism-framework), oconnor-wong 114 (strong supervenience-as-sub-type), fodor 021 (reduction-framework), chalmers 491 (structuralism), mcdonnell-wildman 146 (strong/weak virtual digitalism), 213 (VWF framework), audi 249 (physicalism-as-framework). Multiple plausible candidates that would push framework-specificity past n=1 if confirmed.

**Verdict:** dev set has ABUNDANT evidence for elided-contrast/definitional-target stability and AT LEAST 3-4 plausible framework-specificity candidates that could confirm the 4th subtype.

### 2. Slug-graveyard primary-vs-secondary + absorption-modes

**Current state:** 5 secondary-author own-cluster instances (Frede 138, Kim 062, Horgan 314, Audi 031, McDonnell-Wildman 115) + 1 prior-cluster-absorber instance (Ney 117). Pattern-watch deferred per ontology-curation framing.

**New secondary authors in dev pools:**
- secondary_phantasia: Caston (1995), Bowin (2017) — 2 NEW authors
- secondary_non_phantasia: O'Connor & Wong (2005), Fodor (1974), Chalmers (2016), Metzinger (2018), Barnes (2012), Raven (2016) — 6 NEW authors

**8 NEW secondary authors total** that would extend own-cluster pattern from n=5 toward n=13. Each likely contributes its own thin-slug cluster (Audi/Kim/Horgan-style pattern).

**Prior-cluster-absorber candidates (extending Ney n=1):**
- Ney 043 (additional Ney case — solidifies her absorber profile but doesn't add second author)
- Bowin candidates (Bowin extending Aristotle/Frede/Bowin's-own framework — possibly absorber-mode)
- Some chalmers self-cluster cases vs Chalmers absorbed by McDonnell-Wildman/Ney (already attested at 115/117) — adds Chalmers-as-source data

**Verdict:** dev set would MASSIVELY extend own-cluster evidence (5 → up to 13). Prior-cluster-absorber mode evidence stays at n=1-2 unless multiple authors-as-extenders surface; weaker extension. Codification at item-25 with current evidence is ALREADY sufficient for primary-vs-secondary distinction; absorption-mode taxonomy needs more data on the absorber side.

### 3. Heidegger-technical-upgrade-default

**Current state:** 4 BCAP accepts, 0 rejections. Trigger condition (1) genuine rejection on primary_heidegger, OR (2) item-25 checkpoint.

**Dev primary_heidegger inventory:** 30 candidates, **ALL with `slug: heidegger-bcap`** — zero non-BCAP material available. Scope question (rule applies all primary_heidegger or specifically BCAP?) CANNOT be tested with dev material.

**Genuine-rejection candidates (predecessor_report items where context is scholastic-not-Heideggerian):**
- bcap-001 "Intuition is a singular representation" — describes scholastic intuition concept; English `intuition`/`representation` available; technical-upgrade may NOT fire if context is scholastic-reportive not Heideggerian-thetic
- bcap-002 "concept is a representation through common marks" — pure scholastic-Latin paraphrase
- bcap-006 "savage forms no concept of house" — predecessor critique
- bcap-007 "Knowing what something is for enables..." — descriptive predecessor view
- bcap-031/032 "genuine definition" — describes scholastic definitions, English+Latin

These 5+ predecessor_report items are STRONG candidates for the first genuine rejection (technical-upgrade rule's preconditions present BUT context establishes scholastic-not-Heideggerian framework).

**Verdict:** scope question UNTESTABLE in dev (BCAP-only). But genuine-rejection trigger has 5+ candidates that could fire (1) before item-25 checkpoint (2) auto-fires. Strong reason to wait at least until 2-3 BCAP predecessor_report items annotated to test the rule's edge.

### 4. Attribution-scope joint-eval

**Current state across 4 sub-watches:**
- 079 broad: 3 instances (2 preventive: Greeks/Hume; 1 observational: Aristotle)
- 069 possessive: 1 reg, 0 observations
- 049 prepositional-individual-author: 1 reg, 0 observations
- (newly proposed verbal-individual sub-form?)

**Dev attribution-scope candidates by syntactic form:**

- **Verbal-individual (parallel to 127 "Aristotle characterizes"):** papachristou 198/282/280/175/061, bowin 135, ogorman 187, frede 030/077 — 8+ candidates
- **Verbal-collective (parallel to 079):** aristotle 014/016/019 ("Some thinkers hold," "ancient philosophers"), heidegger 083 ("The Greeks understood"), 062 ("medieval controversy") — 5+ candidates
- **Prepositional-individual (parallel to 049 "for Aristotle"):** white 283 ("According to Aristotle"), caston 016 ("For Aristotle's inference"), nussbaum 077 ("in Aristotle's De Anima"), heidegger 100 ("for the Greeks and for Aristotle"), 055 (combined), 062 (Porphyry's) — 6+ candidates
- **Possessive (parallel to 069 "Aristotle's analysis"):** chalmers 491 (Chalmers's own — first-person), ney 043 (Chalmers's behalf), nussbaum 105 (phantasia's role), white 283, audi 249 — 5+ candidates
- **NEW shape: temporal-prepositional ("In the Middle Ages"):** heidegger-bcap-032 — 1 candidate, possibly new sub-form

**Preventive cases** (attributed author IS in ontology):
- Aristotle (preventive): EVERY aristotle-attribution candidate is preventive since `Aristotle` is presumably in ontology — 20+ candidates
- Aquinas (papachristou 175) — likely preventive
- Loraux (ogorman 187) — possibly in ontology
- Davidson, Morgan (horgan 091) — likely in ontology
- Plato, Porphyry, Empedocles — likely in ontology

**Verdict:** dev has VERY rich attribution-scope evidence — multiple syntactic forms across all 4 sub-watches, abundant preventive cases. Item-25 joint-eval would benefit substantially. The preventive-vs-observational threshold-weighting question would have firm empirical grounding (current ratio 2:1 preventive:observational; dev would likely shift the count significantly).

### 5. Load-bearing-modifier

**Current state:** 5 precedents (motivating, visible, actual, persist, necessary) across 5 distinct syntactic positions; codification locked for item-25.

**Dev evidence available:**
- **Borderline modifier candidates:** aristotle 040 ("precisely"), 056 ("minimal"), 057 ("incidental"), 050 ("only when"), heidegger 097 ("concretely"), nussbaum 077 ("always"/"but"), horgan 146 ("not fully resolved"), oconnor-wong 056 ("only a consequence... not its defining characteristic"), mcdonnell-wildman 146 ("at least two forms"), chalmers 218 ("experienced user"/"who know"), ney 043 ("provided," "relevant similarity")
- **Scope-restricting (parallel to 115 "genuine"):** aristotle 074 ("no nature... except the capacity"), nussbaum 084 ("not insofar as... but insofar as"), caston 016 ("not s[omething]"), ogorman 149 ("do not suppress... but instead aspire to"), chalmers 491 ("a form of"), oconnor-wong 023 ("commonly dismissed... weak or underdeveloped")

**Verdict:** dev has 15+ borderline modifier candidates and 6+ scope-restricting cases. The 5-precedent rule would solidify with broader genre coverage (currently most precedents from primary_aristotle + Heidegger; dev adds modern_philosophy and secondary_phantasia precedents). Codification could fire now with adequate evidence; dev would test edge cases.

### 6. Cross-author-concept-collision

**Current state:** 2 attestations — 115 refuting-mode (McDonnell-Wildman → Chalmers), 117 porting-mode (Ney → Chalmers/Kim/Nussbaum/O'Gorman). Both sub-modes attested at n=1.

**Dev candidates by sub-mode:**

- **Porting-mode (extending 117):** bowin candidates (extending Aristotle), nussbaum candidates, white candidates, papachristou candidates, mcdonnell-wildman 146/188 (extending virtual digitalism), chalmers 491 (own structuralism), Ney 043 — 10+ candidates
- **Refuting-mode (extending 115):** frede 030 ("Aristotle fails to provide"), caston 016/032 (critical), oconnor-wong 023 ("commonly dismissed... weak"), 056 ("not its defining characteristic, despite dominating"), horgan 136 ("merely shifts the problem"), nussbaum 077 (slight critique) — 6+ candidates
- **NEW potential sub-modes:**
  - **Multi-author-concept-attribution** ("Both Morgan and Davidson share the position" — horgan 091; "Fortenbaugh and Nussbaum argue" — ogorman 149) — multi-author attribution to a SHARED concept; structurally distinct from one-author-uses-another's-term
  - **Self-attribution-with-author-name** ("Chalmers's own basis" — chalmers 491 in Chalmers's own paper; "Papachristou concludes" — papachristou 035 in Papachristou's own paper) — first-person possessive attribution to self; novel sub-mode

**Verdict:** dev has 16+ cases plus 2 NEW potential sub-modes (multi-author-shared-concept, self-attribution-with-author-name). Codification at item-25 with current evidence (2 attestations) is thin; dev would push to 5-10+ instances with sub-mode taxonomy genuinely populated. Strong case for waiting.

### 7. Surface-variant taxonomy

**Current state:** 4 mechanisms (English-English same-sense, plural/singular cross-author, intra-author orthographic, adjective/noun).

**Dev candidates for 5th mechanism:**
- **Multi-foreign-language synonymy** (Greek + Latin + English triplet — beyond binary English-Greek already attested at 053/058/127): heidegger-bcap-067 ("Accidens... συμβεβηκός" Latin+Greek), bcap-074 ("Ὁρισμός is a making known of οὐσία" Greek-Greek), bcap-062 ("Porphyry's Εἰσαγωγή" Greek + scholastic context), papachristou 175 (Aquinas's "animalia imperfecta" Latin scholastic). 4+ candidates with multi-foreign-language pattern.
- **Verb-form vs noun-form** (parallel to adjective/noun but different morphology): aristotle 070 ("potentially" adverb vs "potentiality" noun), 074 (similar)
- **Hyphenation patterns vs concatenation** (extending 031): not strongly visible in dev
- **Singular concept named via two different etymologies** (e.g., Latin-derived English vs Greek-derived English): nous (Greek) / mind (Anglo-Saxon English) / intellect (Latin English) — likely surfaces in heidegger candidates

**Verdict:** dev has 4-5 plausible 5th mechanism candidates (multi-foreign-language synonymy strongest; verb/noun + multi-etymology weaker). Surface-variant taxonomy could expand from 4 to 5-6 mechanisms with dev evidence.

---

## (b) Recommendation: fire item-25 NOW vs wait for dev evidence

| Decision | Current evidence | Dev would add | **Recommendation** |
|---|---|---|---|
| AF5 subtype-proliferation | 7 inst / 3 confirmed + 1 candidate subtype, BOTH criteria met | Multiple framework-specificity candidates would confirm 4th subtype | **WAIT** — fire after 2-3 dev items confirm framework-specificity (otherwise risk locking 4th subtype on n=1) |
| Slug-graveyard primary-vs-secondary | 5 own-cluster + 1 absorber, primary-vs-secondary clear | 8 new secondary authors → up to n=13 own-cluster; absorber-mode evidence limited | **FIRE NOW on primary-vs-secondary** (already overwhelming evidence); **WAIT on absorption-mode** taxonomy |
| Heidegger-technical-upgrade scope | 4 BCAP accepts, 0 non-BCAP, 0 rejections | NO non-BCAP available; 5+ predecessor_report rejection candidates | **WAIT** — at least 2-3 predecessor_report items needed; codify BCAP-only or accept untested-non-BCAP risk |
| Attribution-scope joint-eval | 3+1+1 across 3 sub-watches, mixed strength | 20+ preventive cases across all 4 syntactic forms + new temporal-prepositional shape | **STRONG WAIT** — current evidence is thinnest where stakes highest; dev triples the data |
| Load-bearing-modifier | 5 precedents across diverse syntactic positions | 15+ borderline + 6+ scope-restricting cases for edge-testing | **FIRE NOW** — 5 precedents sufficient; codify rule with current scope, refine via dev edge cases at every-25 drift checks |
| Cross-author-concept-collision | 2 attestations (1 each sub-mode) | 16+ cases + 2 new potential sub-modes (multi-author-shared, self-attribution) | **STRONG WAIT** — n=1 per sub-mode is too thin; dev would populate sub-mode taxonomy |
| Surface-variant taxonomy | 4 mechanisms | 4-5 candidates for 5th mechanism (strongest: multi-foreign-language) | **FIRE NOW with current 4** — codify the 4 attested; track 5th mechanism for next codification cycle if it surfaces |

### Aggregate recommendation

**Mixed strategy** for item-25:
- **FIRE at item-25:** load-bearing-modifier formalization, slug-graveyard primary-vs-secondary distinction, surface-variant 4-mechanism codification — these have sufficient evidence now and dev would only add edge cases.
- **WAIT through partial dev for:** AF5 splitting (especially framework-specificity 4th subtype confirmation — needs 2-3 more cases); attribution-scope joint-eval (needs preventive-count expansion to settle threshold-weighting question); cross-author-concept-collision sub-mode taxonomy (n=1 per mode currently too thin); heidegger-technical-upgrade scope question (needs first rejection-fire on predecessor_report material).

### Operational implication for dev annotation

Suggested dev-set composition to maximize item-25 evidence:
- **Heavy weight on heidegger predecessor_report items** (bcap-001/002/006/007/031/032) — fastest path to genuine-rejection trigger fire on heidegger-technical-upgrade
- **Mix of secondary_modern_philosophy authors** (especially the 6 new secondary_non_phantasia authors: O'Connor-Wong, Fodor, Chalmers, Metzinger, Barnes, Raven) to populate slug-graveyard absorption-mode taxonomy + cross-author-concept-collision sub-modes
- **Aristotle items with explicit attribution structures** (multi-author "Both Morgan and Davidson," collective "Some thinkers hold") to populate attribution-scope joint-eval with preventive cases and potentially new sub-form (temporal-prepositional, multi-author-shared)
- **Items with framework-specificity candidates** (horgan 091/213, oconnor-wong 114, chalmers 491, fodor 021, mcdonnell-wildman 146/213) to confirm or refute AF5 4th subtype before splitting evaluation

Item-25 would then fire 3 codifications (load-bearing-modifier, slug-graveyard primary-vs-secondary, surface-variant 4-mechanism); defer 4 to item-50 or interim checkpoint pending dev evidence (AF5 splitting, attribution-scope joint-eval, cross-author-concept-collision sub-modes, heidegger-technical-upgrade-scope).

---

## Reconciliation note (added 2026-04-28)

The original inspection's aggregate recommendation specified **3 codifications fire at item-25** (load-bearing-modifier + slug-graveyard primary-vs-secondary + **surface-variant 4-mechanism**). The plan-critique loop on 2026-04-28 revised this to **2 codifications fire** (load-bearing-modifier + slug-graveyard primary-vs-secondary), with **surface-variant deferred with explicit early-trigger** (5th mechanism surfacing during dev → promote immediately; hard horizon item-50 §8.2 every-25 drift check).

Reason for revision: surface-variant 4-mechanism codification, while ready by evidence count, was judged not load-bearing for resolver behavior in the same way as load-bearing-modifier and slug-graveyard primary-vs-secondary. The deferral-with-explicit-trigger pattern (vs immediate codification) reduces premature lock-in risk; if no 5th mechanism surfaces by item-50, the 4-mechanism taxonomy fires then.

The locked plan's Decision 2 (`tmp/dev-annotation-execution-plan-2026-04-28.md`) supersedes the original inspection's aggregate recommendation. This artifact preserves the original recommendation for audit traceability.

---

## Footer — Framework-maturity meta-observation (logged 2026-04-28, plan-critique convergence; NOT part of original inspection)

The plan-critique loop converged in two iterations across the 2026-04-28 session. By round 2's end, no further iteration would have been productive. The notable observation: **the spec has become structural enough to constrain meta-work, not just object-level work.**

Specifically, the plan-critique caught structural slips in *the plan itself* (item-as-recitation vs verification-action; front-loading-as-bias-by-another-name; resolver-gold-dev.jsonl factual gap) using §1 trigger-citation discipline and §8.1 forward-looking trigger patterns as evaluative tools. The discipline isn't just rules in CONVENTIONS — it's now an evaluative framework that catches *plan-level* issues, not just *annotation-level* issues.

Three corollaries:

1. **Deferral-with-explicit-trigger is now the dominant codification approach.** §8.1 interim-checkpoint trigger, slug-graveyard horizon-extension, item-25 codification locks, surface-variant early-trigger — all use the forward-looking-trigger-condition shape rather than open-ended deferrals. This is the spec's evolution from horizon-only to horizon-or-condition deferrals.

2. **Pre-staging discipline is novel for this project.** `drafts/` directory + acceptance criteria (validator-passing + `Triggered by:` lines + back-sweep anchors) is introduced for the first time at item-25. If it works, may generalize to future codification cycles.

3. **Cognitive-unit batching matters.** Folding the 12-step procedure into 4 units (A-D) acknowledges that pre-dev infrastructure shouldn't dominate cognitive attention — Unit D is the deliverable; A-C are necessary scaffolding.

This footer is logged at n=1 (first inspection artifact) per the locked plan's Decision 1; future inspection-level meta-observations live in their own footers if generated, not as separate artifacts.
