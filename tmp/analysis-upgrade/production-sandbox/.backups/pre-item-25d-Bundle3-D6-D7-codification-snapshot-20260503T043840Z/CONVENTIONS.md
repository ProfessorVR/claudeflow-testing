# Gold-Set Annotation Conventions

**Scope:** Rules and grammar for annotating `resolver-gold-dev.jsonl` and `resolver-gold-holdout.jsonl`. Companion to `data/gold/README.md`; this doc governs the `notes` field and annotation discipline specifically.

**Status:** Drafted 2026-04-22. Provisional until item-25 convention-validation checkpoint (see §8).

---

## 1. How this document is written

Every rule below carries a `Triggered by:` line stating the concrete case that produced it. Rules without a concrete trigger are marked `Prospective` and carry an expected trigger condition plus a reconsideration horizon.

- A rule with a cited trigger is load-bearing — it exists because a specific annotation case forced a decision.
- A rule marked prospective is pre-emptive — it exists on reasoning alone. Prospective rules are the first candidates for removal if their expected trigger never materializes.

This discipline is itself a rule. **Triggered by:** the recognition during spec iteration (conversation 2026-04-22) that CONVENTIONS.md will otherwise accrete rules whose origin is lost within six months, making the doc ossify rather than evolve.

---

## 2. Flag grammar

The `notes` field of any gold-set JSONL entry may carry annotation-metadata flags. When present, they follow this grammar:

```
notes ::= flag-block (" | " flag-block)*  |  free-prose
flag-block ::= code ":" concept " — " prose
code ::= "AF" digit+  |  "PL:" pattern-name
concept ::= <ontology-node name, verbatim, spaces allowed>
prose ::= <free text, single clause or short paragraph>
```

### 2.1 Syntax rules

1. **Flag → concept separator:** `:` (colon, no padding).
2. **Concept → prose separator:** ` — ` (U+2014 em-dash, single space on each side).
3. **Compound-flag separator:** ` | ` (pipe, single space on each side). Used when an item carries multiple flags.
4. **Concept slot contents:** verbatim ontology-node name (for `AF4`/`AF5`) or verbatim parking-lot pattern name (for `PL`). Spaces allowed; no transformation, no casing change.
5. **Pattern — compound-flag prose:** each flag-block carries its own prose tail, OR a single shared prose tail applies to all preceding flags if rationales are genuinely unified. Choose whichever is more truthful; the validator does not enforce a choice.

**Triggered by:** the initial annotation of `claim-aristotle-da-3.3-037` (worked example) and subsequent review of compound-flag edge cases during spec iteration (2026-04-22).

### 2.2 Non-metadata notes are legal

Unflagged prose in the `notes` field is permitted for pure descriptive annotation that is not intended for cross-item grep/query. Example: `"notes":"paraphrases 429a1; Ross edition substitutes 'mind' for 'thought'"`.

Rule of thumb: if you would ever want to grep across items for this condition later, flag it. If it's a one-off reading note, leave it unflagged.

**Triggered by:** recognition during spec iteration that mandatory-flag rule would force annotators to invent codes for purely descriptive notes, producing noise.

---

## 3. Parking lot — named patterns

This section is first-class. **Hitting a parking-lot pattern is an event:** it triggers a `PL:` notes flag.

PL entries come in two flavors, both legitimate:

- **Decided.** A documented convention exists for how to handle the pattern. The annotator follows the convention; the flag enables cross-corpus tracking of pattern frequency and signals candidates for PL→AF promotion under §7.1. Applies when the pattern recurs frequently enough to warrant naming, even after its decision is settled.
- **Deferred.** No convention exists yet. The annotator flags, moves on, and surfaces the case at the next review checkpoint. Do NOT silently pick a reading for a deferred pattern.

PL rows with **decided** status and contextually-applied conventions must state the application criterion inline in the row description — rows without such a criterion produce re-derivation cost at every annotation instance and invite silent drift across the corpus.

**Triggered by:** recognition during item-058 annotation (2026-04-22) that recurring patterns with settled decisions (ontology-synonymy, object-of-type-canonicalization) warrant the same grep-ability affordance as deferred patterns, so long as the decision is stated in the row.

### 3.0 Node-choice principle

The following principle governs label selection for `expected_ontology_nodes` and motivates the parking-lot patterns in §3.2 that codify specific sub-cases.

**Principle.** Prefer rich canonical nodes when multiple nodes denote the same concept. A thin slug is a legitimate label if and only if:

(a) it denotes the specific concept named in `claim_text`, at the correct level of abstraction, AND
(b) no richer alternative exists.

Reject a node when it is broader, narrower, or otherwise mis-denoting the concept — regardless of whether it is rich or thin. **Thinness is corroborative in rejection decisions, not determinative**; the primary test is concept-match at the correct level of abstraction. A rich node can be rejected (concept-mismatch), and a thin slug can be labeled (concept-match with no richer alternative available).

**Corollary — rich-vs-strict concept-match tension.** When a concept's surface name has both a rich framework-specific canonical AND a thin generic/surface slug, the rich-preferred default applies (§3.2 ontology-synonymy) unless the claim's deployment clearly exceeds the rich node's definitional scope. Default: label the rich canonical. Override: if the claim uses the concept in a sense that goes beyond what the rich definition covers (e.g., a generic "human being" discussion that does not engage Heidegger's Dasein-specific features), fall back to the thin slug. This corollary distinguishes from the `wrong-context-rich-canonical` pattern-watch (§3.2), which addresses genre-mismatch (a Heideggerian rich node deployed on an Aristotelian claim where it mis-denotes the concept); the corollary addresses scope-exceedance within the right genre (e.g., a generic "human being" claim in a Heideggerian text that does not engage the rich Dasein structure). **Triggered by:** item 091 (heidegger-bcap-091) — "human being" canonicalized to rich Dasein per rich-preferred default; user flagged the need to preserve thin-slug options (like `human being`) for genuinely-broader deployments that do not engage the framework-specific rich structure.

**Application examples.**

- (i) Item 058's `common sensibles` is a thin slug but denotes the exact concept named in `claim_text` → legitimate label under criteria (a)+(b).
- (ii) Item 007 rejected `number` for the claim's "two" despite `number` being thin (corroborative) because `number` is broader than the claim's concept of numerical duality — determinative failure on criterion (a).
- (iii) Item 007's `point`, `unity`, `divisible` are all thin slugs but each denotes exactly the claim's referent at the correct level of abstraction → legitimate labels under (a)+(b), since no richer alternative exists for any of them.

**Why this principle matters.** The alternative reading — "reject all thin slugs" — is internally consistent but collapses the gold set. Under the strict-rejection rule, ~80% of primary_aristotle items would receive empty `expected_ontology_nodes`, converting the gold from a resolver-quality measurement into an ontology-coverage measurement. That is a different project. The resolver is a claim-to-node mapping tool; grading it against empty-label sets because the nodes are thin grades it against ontology curation, not resolution quality.

**Triggered by:** item-007 annotation (2026-04-22) surfaced the need to explicitly distinguish thinness (corroborative) from concept-mismatch (determinative) when rejecting nodes. Prior to codification, the rule risked silently drifting toward "reject all thin slugs" under pressure toward consistency, which would collapse the gold set.

### 3.1 PL: flag grammar

Same as `AF` flags, but with `PL:` prefix and a pattern name drawn from §3.2:

```
PL:<pattern-name> — <brief description of the specific case>
```

Example: `"notes":"PL:mereological-sub-part — claim references 'the perceptive part of the soul'; Soul is in ontology but perceptive-part-of-Soul is not; held pending convention decision."`

The `PL:` prefix makes parking-lot instances greppable (`grep -c "PL:mereological-sub-part" data/gold/*.jsonl`), which is the back-pressure signal that drives codification under the governance rule (§7): at ≥3 instances, a pattern is eligible for promotion to an `AF` code.

### 3.2 Named patterns

| Pattern name | Description | Expected trigger | Decision status |
|---|---|---|---|
| `mereological-sub-part` | Claim references a part of an ontology-present whole, where the part is not itself in the ontology (e.g., "the perceptive part of the soul" — Soul is present, perceptive-part-of-Soul is not). | Primary-Aristotle material; expected in first 20 items. | Deferred — AF4 vs. whole-node-label-with-part-held-implicit is the real question. |
| `bekker-oct-variant` | The claim relies on textual material where Bekker and OCT editions diverge, and the divergence affects the referent identification. | Primary-Aristotle, occasional. | Deferred — no convention yet for which edition is authoritative. |
| `compound-claim-split` | A single `claim_text` conjoins two referentially distinct claims that would better be annotated as two separate items. | Any genre; more common in secondary material. | Deferred — currently out of scope (we do not re-split candidate claims); flag and move on. |
| `translation-ambiguity` | English rendering in `claim_text` collapses a Greek/German distinction that matters for ontology mapping (e.g., hupolepsis vs. doxa both rendered "belief"). | Primary-Heidegger, primary-Aristotle occasionally. | Deferred — may become `AF7` once convention is decided. |
| `cross-author-concept-collision` | Two authors use the same term (e.g., "phantasia") in distinguishable technical senses; ontology has one node and annotator must decide which author-sense the node covers. | Cross-genre items; expected in secondary material referencing multiple authors. | Deferred. |
| `voice-switching` | Claim switches between first-person and third-person framing in a way that affects referent identification (common in phenomenological prose). | Primary-Heidegger, secondary_phantasia. | Deferred. |
| `logical-or-in-prose` | Annotator prose in a notes tail requires ASCII `|` in the sense of logical-OR, colliding with the compound-flag separator. | Phenomenology-of-mind or formal-logic material; expected zero on primary_aristotle. | Prospective rule; codify as "prose must use `∨` not `\|`" only if triggered in actual annotations. Reconsideration horizon: item 50. |
| `ontology-synonymy` | The ontology contains two or more nodes denoting the same concept under different names — typically an English canonical + Greek transliteration slug (e.g., `common sensibles` and `koina` and `koina aistheta` all denote τὰ κοινὰ αἰσθητά). | Primary-Aristotle material, very common; expected on any claim mentioning phantasia / aisthesis / doxa / nous / hupolepsis / koina / idia / pistis / episteme. | **Decided — English form preferred.** When the claim_text names a concept in English, label with the English-named node; do not add Greek-slug nodes as additional labels. When the claim_text uses Greek directly, label with the Greek node. The flag records the synonymy observation for eventual ontology-hygiene review. Criterion: applies whenever ≥2 ontology nodes denote the same concept under different surface forms. **Triggered by:** `claim-aristotle-da-3.3-058` labeling `common sensibles` rather than `koina` / `koina aistheta`. |
| `object-of-type-canonicalization` | The `claim_text` names the objects of a perceptual/cognitive type rather than the type itself (e.g., "incidental objects" rather than "incidental perception"). The labeling move is to canonicalize to the type. | Primary-Aristotle; secondary_phantasia constructions like "objects of vision," "what is perceptible," "the forms received." | **Decided with contextual-application caveat — canonicalize to the type when the claim's argumentative structure concerns the type's role, not when it concerns the objects as individuals.** Criterion: if the claim makes a claim about how the perceptual/cognitive type functions (e.g., the type is accompanied by another, the type is reliable/fallible, the type has a particular domain), canonicalize; if the claim concerns properties of the objects themselves (e.g., deception involving incidental objects qua objects), do not canonicalize — label the object-level concept if one exists. **Triggered by:** `claim-aristotle-da-3.3-058` labeling `incidental perception` (the type) for a claim_text referencing "incidental objects." |
| `paraphrase-distortion` | The extractor's paraphrase (`claim_text`) shifts or introduces a referent not present in or inferrable from the source `.quote` field at the cited Bekker location. Distinct from `faithfulness: "partial"` (which encodes *elaboration* — added framing that preserves the label set); distortion *changes* the label set. | Any partial-faithfulness item across any genre; prospective — no instance yet observed. Reconsideration horizon: item 50. | **Decided-deferred: flag and move on.** Labels remain against the paraphrase text per README §6 gold-set methodology; the PL flag surfaces the extraction-quality issue for upstream review rather than concealing it in the label. Criterion: label based on the quote alone — if the label set differs from a label set based on the paraphrase, it is distortion; if the label set is the same, it is elaboration (not flagged; handled via the §5.4 partial-faithfulness procedure). **Triggered by:** prospective; see §5.4 hand-off. |
| `wrong-context-rich-canonical` | Ontology has both a rich Aristotelian/Heideggerian canonical AND a thin/contextually-appropriate slug for the same English surface term; the claim's argumentative context engages a different framework than the rich canonical's definition presupposes, so the rich canonical mis-denotes the claim's concept. | Cross-genre items where surface terms are shared between authors with distinguishable technical senses ("Truth", "fear", "animal", "cause"). Common in primary_aristotle vs primary_heidegger contrasts; expected to surface heavily on secondary_modern_philosophy. | **Decided — reject the rich canonical when its definition's framework is incompatible with the claim's deployment; label the thin/contextually-appropriate slug instead.** **Genre-sensitive, not genre-blind:** the rule is about framework-mismatch, not rich-canonical-aversion. The same rich canonicals are correct on claims native to their framework (091 inverse-confirmation: rich Heideggerian canonicals correct on primary_heidegger after rejection on primary_aristotle items 033/037/039; 127 inverse-confirmation: rich Aristotelian canonicals correct on secondary_phantasia about Aristotle). Criterion: rich node exists with English-name match; rich node's definition explicitly or implicitly invokes a framework (Heideggerian, Aristotelian, Scholastic) that the claim's argumentative deployment doesn't engage. **Triggered by:** four-instance preventive pattern (uniformly preventive — rule rejected an available rich canonical that would have mis-denoted the claim's concept in each case): 039 registration (Truth → Heideggerian alētheia/disclosure rejected on Aristotelian phantasia true-or-false claim), 033 retrospective (Fear → Heideggerian Furcht rejected on Aristotelian opinion/doxa claim), 037 retrospective (animal → Heideggerian-context rich canonical rejected on Aristotelian θηρία/brutes claim), 062 (Cause → rich Aristotelian aitia/four-causes rejected on Humean modern-empiricist causation claim). Inverse-confirmation cases at 091 and 127 integral to rule scope. |
| `session-boundary-history-flattening` | Process-level pattern (NOT an annotation pattern — atypical for this table). Cross-session content loss produces silent history-flattening: when high-value generated content (inspections, multi-paragraph analyses, draft language) is held only in conversation context across a session boundary, reconstruction from surviving summaries tends to align with *subsequent* locked decisions rather than preserve the *original* state those decisions were made against. The failure mode is distinct from generic content loss — it specifically erases the evidence that made revisions defensible, severing audit traceability. | Any cross-session annotation work where high-value generated content lives in conversation context rather than persisted to file. Expected on every multi-session work cycle producing inspection-class artifacts, multi-round critique outputs, or pre-staged codification language. | **Deferred — formalization to item-25 checkpoint.** Provisional protocol pending formalization: high-value generated content must be persisted to file *as generated* (not as a session-end ritual; session-end persistence is too late if context-window pressure or session interruption intervenes between generation and end-of-session). Three-dimension specification awaiting item-25: (a) *what* — inspections, multi-paragraph analyses, draft codification language, recommendation tables produced mid-session; (b) *where* — file in working tree, not transcript or conversation cache; (c) *when* — at moment of generation, with future sessions referencing the file rather than the conversation. Possible relocation at item-25 from §3.2 (annotation patterns) to a new §8-class governance subsection (session-discipline rules), since the pattern is process-level rather than annotation-level. **Triggered by:** Unit A inspection reconstruction on 2026-04-28 (drift-log entry `2026-04-28 | observation — session-boundary-history-flattening`): original 150-candidate inspection produced 2026-04-22 was held only in conversation context; on session boundary, conversation was cleared; Unit A reconstruction from plan-summary aligned with locked-2-codifications decision rather than preserving original-3-codifications recommendation; original retrieved from transcript line 1081 of session jsonl; reconciliation note added to artifact. The retrieval succeeded only because Claude Code persists session transcripts under `~/.claude/projects/`; the failure mode would have been irreversible without that fallback. |

Each row is a *pattern*, not a code. Codes (`AF7`, `AF8`, ...) are created only via the governance rule in §7.

**Triggered by:** recognition during spec iteration that ad-hoc resolution of recurring-but-unnamed patterns is the single largest source of convention drift in multi-session annotation.

---

### 3.3 SURFACE-DRIVEN cluster

**SURFACE-DRIVEN-rule scope specification.** When the source `claim_text` references a concept that has multiple ontology nodes denoting it under different surface forms (English / Greek-transliterated / Greek-glyph), label choice is driven by the **surface form actually appearing in the claim_text**, not by author-vocabulary-mechanism or framework-membership. Three surface tiers operative:

- **Tier (a) English surface** → label with the **English-name rich** ontology node. Empirical anchors: holdout 049 'perception' → `Perception`; dev-13 'sensation' → `Perception`; dev-15 'sensation' → `Perception`. jq verification at item-25d Bundle 1 codification confirms `Perception` (Aristotle - Complete Works, type=core, centralityTier=core) + `Logos` (Aristotle - Complete Works, type=core, centralityTier=core) exist as English-name rich nodes.

- **Tier (b) Greek-transliterated surface** → label with the **thin Greek-transliterated** ontology node (transliterated form). The thin node may be primary-author-attributed (Aristotle c. 350 BCE for `phantasia`, `aisthesis`) or secondary-author-attributed (Frede 1992 for `phantasma`); operative criterion is *surface-form-driven label choice between rich English-name vs thin Greek-transliterated form*, not author-vocabulary-of-node. Empirical examples (jq-verified at item-25d Bundle 1 codification):
  - dev-9 Frede claim, source surface 'phantasma' → label `phantasma` (Frede 1992 thin node)
  - dev-14 Frede claim, source surface 'phantasia' → label `phantasia` (Aristotle thin node)
  - dev-19 Nussbaum claim, source surfaces 'aisthesis' + 'phantasia' → labels `aisthesis` + `phantasia` (both Aristotle thin nodes)

  **Inheritance from dev-19 Entry F:** drift-log original framing "thin author-vocabulary" was a labeling-disposition shorthand; jq verification at Bundle 1 codification confirms the operative criterion lives at surface-tier level (Greek-transliterated form drives label choice) rather than node-attribution level (which-author-introduced-the-node).

- **Tier (c) Greek-glyph surface** → label with the **English-name rich** ontology node (per §3.2 ontology-synonymy decided rule for Greek-glyph → English-canonical mapping). Empirical anchor: dev-11 'Λόγος' → `Logos`.

**Rule precedence:** SURFACE-DRIVEN tiers govern label selection across author-vocabulary-mechanisms; apparent author-vocabulary inconsistencies (e.g., Frede-vs-Nussbaum) RESOLVE via tier classification of the actual claim_text surface form. The rule is **single coherent surface-form-driven**, NOT author-specific precedence.

**Cross-word boundary cases:** cross-word-semantic-synonymy framework codified separately at item-25d Bundle 2 D.3 (parent framework registering 3 dispositions across noun-noun / adj-adj / verb-noun word-class pairs); SURFACE-DRIVEN-rule operates as one of the 3 dispositions within D.3 framework scope (per dev-21 verb-noun SKIPPED-VIA-SURFACE-DRIVEN disposition). D.3 codification at Bundle 2 enumerates the disposition framework; D.1 here codifies the surface-tier framework that SURFACE-DRIVEN-rule operates within. See §3.3 Cross-references below.

**Edge cases handled:**
- **Plural-singular surface differentiation:** dev-21 Aristotle plural 'sense organs' fires `sense organs` (Aristotle plural exact-match per jq: text="Aristotle c. 350 BCE", type="primary-citation"); Frede-introduced singular `sense-organ` (hyphenated; jq: text="Frede, Dorothea 1992", type="secondary-lit") skipped via cross-author-collision-avoidance default-skip + SURFACE-DRIVEN jointly. Surface differentiation at plurality-+-orthography level governs.
- **Multi-cross-author scope** (dev-22 ternary): SURFACE-DRIVEN extends to multi-author single-claim case per dev-22 Entry C (PROVISIONAL APPLICATION → D.5 standalone codification at item-25d PHASE 2 step 2). Bundle 1 references the multi-cross-author extension with forward-reference to D.5 standalone codification.

**Cross-author-collision-avoidance sub-mechanism distinction.** The cross-author-collision-avoidance framework (operating per §3.2 cross-author-concept-collision row-criterion gate) operates via **two distinct sub-mechanisms**, each with distinct trigger criteria, procedural implications, and empirical anchors:

- **Sub-mechanism (1) — COLLISION-FLAG-FIRING.** Trigger: claim references a concept that has **a single ontology node carrying multiple author-senses** (one node, distinguishable technical senses from multiple authors), AND the claim's argumentative deployment activates the cross-author concept-collision (e.g., one author's paper engages another author's technical sense of the same node). **Procedural implication:** label fires for the single ontology node + **PL:cross-author-concept-collision flag** records the cross-author multi-sense in metadata per §3.2 row-criterion gate (separate non-collided cross-author nodes NOT added to label set; collision flag operates on the single multi-sense node only). **Empirical anchor:** dev-12 (claim-kim-1990-213): single ontology node `supervenience` (Kim 1990-introduced) covers both Lloyd Morgan emergentism-supervenience and Davidson nonreductive-materialism-supervenience author-senses; PL:cross-author-concept-collision flag fires per §3.2 row criterion; label stays against `supervenience` (single node) per §3.2 decided-deferred policy. **Note:** AF5:reducibility flag at dev-12 is a **distinct elided-contrast flag** (claim explicit-negation 'irreducible' → implicit positive `reducibility` Audi-introduced; notes flag only) — orthogonal to D.4 sub-mechanism (1) COLLISION-FLAG-FIRING which operates on `supervenience` collision flag. dev-21 Entry E sub-mechanism distinction text inherited; jq verification at Bundle 1 codification clarifies the flag-anchor specification.

- **Sub-mechanism (2) — SURFACE-DRIVEN-DISAMBIGUATION.** Trigger: claim references a concept that has **surface-form-differentiated** ontology nodes from multiple authors (different surface forms, e.g., singular vs plural / English vs Greek / different spelling / different word-class), AND surface-form selection itself disambiguates label choice. **Procedural implication:** SURFACE-DRIVEN rule (D.1 above) governs label fire on surface-matching node + cross-author non-matching nodes skipped via cross-author-collision-avoidance default-skip. No collision-flag fires (disambiguation operates at surface-form level not concept-collision level). **Empirical anchor:** dev-21 (claim-aristotle-da-3.3-063): Aristotle plural 'sense organs' fires `sense organs` (Aristotle plural exact-match); Frede-introduced singular `sense-organ` (hyphenated) skipped jointly via SURFACE-DRIVEN + cross-author-collision-avoidance.

**Sub-mechanism selection criterion:** SURFACE-DRIVEN-DISAMBIGUATION applies when surface forms are **structurally distinct** (different surface-form across authors — different orthography / pluralization / word-class / language register). COLLISION-FLAG-FIRING applies when surface forms are **identical but technical senses differ** across authors (cross-author concept-collision proper). The criterion's definitional structure produces sub-mechanism selection per claim's cross-author-pair configuration; mutual exclusion follows from criterion logic (a configuration cannot be simultaneously surface-form-distinct AND surface-form-identical). Future evidence surfacing apparent both-trigger configuration would surface criterion-refinement question (criterion specification incompleteness) rather than rule-revision question.

**Multi-cross-author scope.** D.4 sub-mechanism (2) SURFACE-DRIVEN-DISAMBIGUATION extends from binary-scope to multi-author single-claim scope when claim references concepts having surface-form-differentiated ontology nodes from ≥3 distinct authors. **Predicate clean scope-extension** (no ternary-specific specification beyond binary-scope predicate): SURFACE-DRIVEN rule per D.1 governs label fire on each surface-matching node independently per cross-author-pair; cross-author non-matching nodes skipped via cross-author-collision-avoidance default-skip; selection criterion (surface-form-distinct vs surface-form-identical-different-sense per D.4) applies pairwise across all author-pairs in the cross-author scope.

**Source-paper-author exact-match precedence (operative under multi-cross-author scope; inherited from D.4 + §3.2).** When the source-paper author lacks exact-surface-match ontology nodes for the surface forms referenced (per dev-22 Horgan partial-match case: Horgan has supervenience compounds — `bare supervenience`, `co-instantiation supervenience`, `conceptual supervenience`, etc. — but not bare `supervenience`; has `Moorean moral properties` but not `non-natural moral properties` exactly), exact-surface-match cross-author nodes fire per SURFACE-DRIVEN precedence (D.4 sub-mechanism (2)); source-paper-author partial-matches (component-decompositions) skipped as redundant components per surface-form-driven precedence per §3.2 ontology-synonymy decided rule (English form preferred / surface-form drives label). **Inheritance provenance:** rule is logically downstream of (a) D.4 sub-mechanism (2) SURFACE-DRIVEN-DISAMBIGUATION (surface-form drives label fire) + (b) §3.2 ontology-synonymy decided rule (surface-form is operative criterion when ≥2 nodes denote same concept). At binary cross-author scope, exact-match-vs-partial-match distinction is less salient (binary configuration typically yields one exact-match per author); multi-cross-author scope at dev-22 surfaced the rule operationally. D.5 codification makes the inheritance explicit; rule operates implicitly under binary scope per D.4 + §3.2 framework.

**Empirical anchor:** dev-22 (claim-horgan-1993-136) — ternary cross-author scope (Audi×2 + Kim×1 + Barnes×1) plus same-paper Horgan source-paper-author partial-match within single secondary-paper claim. 4 cross-author labels fire (`supervenience` Audi 2012 + `physical properties` Audi 2012 + `non-natural moral properties` Kim 1990 + `mystery` Barnes 2012; all type=secondary-lit per jq verification at item-25d D.5 codification); source-paper-author fires `primitive relation` (Horgan 1993, type=secondary-lit per jq); Horgan partial-matches (supervenience-compounds + Moorean moral properties + etc.) skipped per surface-form-driven precedence. jq verification at item-25d D.5 codification confirms all 5 fired nodes + Horgan partial-match patterns.

**§1-compliant Prospective deferral.** D.5 codification grounds clean scope-extension predicate at ternary cross-author scope per dev-22 Entry C anchor (n=1). Higher-scope-specific predicates DEFERRED PROSPECTIVE per §1: (i) ≥quaternary cross-author scope predicate (4+ cross-authors single-claim); (ii) per-author-weighting predicates (non-uniform fire dispositions across cross-authors based on author-introduction-rank or author-corpus-prominence); (iii) specific-author-count-threshold predicates (e.g., distinct rule at n≥5 cross-authors). Reconsideration horizon: next §8.2 every-25-items cycle, OR item-50 dev-set completion if not triggered earlier. Expected triggers: ≥quaternary multi-cross-author single-claim AF4-relevant or SURFACE-DRIVEN-relevant case fires; per-author-weighting needed at n≥3 to disambiguate dev-set; specific-author-count threshold case fires.

**Pattern-watch maintenance.** Multi-cross-author SURFACE-DRIVEN-DISAMBIGUATION cases tracked within existing umbrella pattern-watch via sub-variant tagging (tag: `multi-cross-author`) per item-25c.1 C.2 UMBRELLA-WITH-REFINED-TRIGGER precedent (sub-variant tagging within umbrella; no migration required at codification time). n=1 multi-cross-author evidence insufficient for separate pattern-watch establishment; sub-variant tag accommodates evidence accumulation toward potential future split-decision at next §8.2 cycle if multi-cross-author cases reach n≥3 threshold.

**Orthogonal to C.3 tertiary-tier deferral.** D.5 codifies multi-cross-author scope at SURFACE-DRIVEN label-selection level (which label fires when surface-form-differentiated nodes from ≥3 cross-authors exist). C.3 §AF4 tertiary-tier deferral concerns multi-cross-author scope at gap-affirmation level (whether tertiary-tier requires distinct gap-affirmation predicate beyond binary primary/secondary tier framework). These are orthogonal subsystems sharing dev-22 evidence anchor (disposed at SURFACE-DRIVEN level; NOT disposed at AF4 level — no AF4 fire at dev-22; tertiary-tier evidence for C.3 remains n=0 dev-set AF4 multi-cross-author fires through dev-24). D.5 codification operates within its subsystem scope; C.3 tertiary-tier deferral remains in place independently, awaiting AF4-specific evidence.

**Cross-reference to D.7 reported-speech-provenance (Bundle 3 dev-12 evidentiary anchor):** dev-12 collision-flag-firing precedent doubles as **citation-reported sub-mechanism precedent** for D.7 reported-speech-provenance unification (Bundle 3 codification at item-25d PHASE 2 step 4). Cross-reference: D.4 sub-mechanism (1) COLLISION-FLAG-FIRING handles the cross-author concept-collision dimension of dev-12 (`supervenience` Kim-introduced single-node-multi-author-sense); D.7 citation-reported sub-mechanism handles the speaker/reporter attribution dimension. Same evidentiary anchor, two distinct codification surfaces (D.4 = annotation-decision sub-mechanism; D.7 = metadata attribution rule). Both surfaces apply jointly at dev-12 commit per dev-22 Entry I lineage.

**Cross-references.** §AF4 (tier-stratified GENUINE-GAP rule — cross-tier non-defeat referenced at Tier framework discussion); §3.2 ontology-synonymy decided rule (Greek-glyph → English-canonical mapping referenced at Tier (c)); §3.2 cross-author-concept-collision row-criterion gate (referenced at D.4 sub-mechanism (2) procedural implication; row Decision-status Deferred but operates as STANDING via row-criterion gate per dev-23 Entry F); item-25d Bundle 2 D.3 cross-word-semantic-synonymy framework (forward-reference for cross-word boundary cases; D.3 inherits D.1 three-tier framework + enumerates SURFACE-DRIVEN-as-disposition-3 within D.3 scope); item-25d D.5 standalone (forward-reference for multi-cross-author SURFACE-DRIVEN-DISAMBIGUATION scope extension); item-25d Bundle 3 D.7 reported-speech-provenance unification (forward-reference for citation-reported sub-mechanism dev-12 cross-reference).

**Triggered by:** dev-19 Decision 13 founding of SURFACE-DRIVEN rule (claim-nussbaum-1985-077; Frede-vs-Nussbaum framework-inconsistency RESOLVES via surface-form classification not author-specific precedence) + cumulative D.1 applications dev-19/20/21/22/23/24 across English/Greek-transliterated/Greek-glyph surface tiers + edge cases (plural-singular dev-21; multi-cross-author dev-22 forward-deferred to D.5); dev-12 (collision-flag-firing first instance via Kim/Davidson/Morgan supervenience single-node-multi-author-sense) + dev-21 Entry E (SURFACE-DRIVEN-DISAMBIGUATION first dev-set instance via Aristotle vs Frede; sub-mechanism distinction explicitly registered as item-25 candidate) + dev-22 Entry C (multi-cross-author SURFACE-DRIVEN-DISAMBIGUATION extension; PROVISIONAL APPLICATION pending D.5) for D.4 sub-mechanism distinction. STANDING since dev-23 Entry F (declared standing-rule application at dev-23 commit; SURFACE-DRIVEN rule + cross-author-collision-avoidance default-skip both listed under "STANDING RULES APPLIED this commit"); CONVENTIONS-codified at item-25d Bundle 1 sub-session post-HALT-pre-codification jq verification empirical correction cycle (5 jq tests fired; 2 corrections applied at v3 [Tier (b) framing per dev-19 Entry F language inheritance vs ontology metadata reality + sub-mechanism (1) anchor disambiguating PL:cross-author-concept-collision from AF5:reducibility orthogonal-flag]; 3 confirmations recorded). Pushback rounds v1→v2→v3 (round 2 of 2 substantive at Bundle 1 budget; within Concern D HALT-tracking bounds; v3 narrowed to textual corrections within unchanged structural framework).

---

### 3.4 Cross-word-semantic-synonymy

**Cross-word-semantic-synonymy framework.** When source `claim_text` surface form has cross-word counterpart in ontology (different word-class; e.g., adjective↔noun nominalization, noun-noun synonymy, verb-noun nominalization), label-fire disposition operates per word-class-pair via 3-disposition framework grounded in dev-set evidence. Three dispositions empirically anchored at 3 word-class-pair anchor cases (n=1 per word-class-pair; sufficient for principle-codification per line 658 single-dispositive-case + §5.4.2 negative-boundary-codification precedents):

- **Disposition (1) — LABELED-via-§3.2-cross-word-semantic-synonymy-convention.** Trigger: noun-noun cross-word pair where both surface forms denote same concept. Procedural implication: label fires for surface-matching ontology node per §3.2 row criterion. Empirical anchor: dev-16 (claim-frede-1992-019) — claim_text 'basic' (noun); ontology node `fundamental` (Audi 2012, secondary-lit, peripheral) is cross-word counterpart denoting same concept; LABELED via §3.2 convention. **Interaction profile:**
  - **§3.2** ontology-synonymy decided rule: **POSITIVE** (authoritative; cross-word semantic-synonymy convention applies)
  - **§5.4** paraphrase-modifications taxonomy: **NEGATIVE** (no §5.4 escalation)
  - **§AF4** tier-stratified GENUINE-GAP rule: **NEGATIVE** (no GENUINE-GAP affirmation; cross-word counterpart present in ontology forecloses gap)
  - **§AF5** elided-contrast: **NEGATIVE** (no elided-contrast structure)
  - **Pattern-watch:** observation-entry tracking only per §8.4 (no escalating pattern-watch)

- **Disposition (2) — FIRED-AS-PARAPHRASE-ARTIFACT-pattern-watch-escalation.** Trigger: adj-adj cross-word pair where source surface form has near-synonym ontology node under different surface form AND extractor paraphrase introduced surface mismatch. Procedural implication: label fires + PL:paraphrase-distortion flag pattern-watch-escalation. Empirical anchor: dev-17 (claim-bowin-2017-035) — claim_text 'specific' (adjective); ontology node `particular` (Frede 1992, secondary-lit, peripheral) is cross-word counterpart with subtle semantic shift via paraphrase-substitution; FIRED-AS-PARAPHRASE-ARTIFACT escalation. **Interaction profile:**
  - **§3.2** ontology-synonymy decided rule: **NEGATIVE** (cross-word counterpart present but paraphrase-introduced shift defeats §3.2 simple LABEL disposition)
  - **§5.4** paraphrase-modifications taxonomy mechanism (1) PARAPHRASE-SUBSTITUTION: **POSITIVE** (operative)
  - **§AF4** tier-stratified GENUINE-GAP rule: **NEGATIVE** (no GENUINE-GAP affirmation)
  - **§AF5** elided-contrast: **NEGATIVE** (no elided-contrast structure)
  - **Pattern-watch:** PL:paraphrase-distortion escalating per §8.0 / §8.4 infrastructure (PARAPHRASE-SUBSTITUTION mechanism): **POSITIVE**

- **Disposition (3) — SKIPPED-VIA-SURFACE-DRIVEN-RULE.** Trigger: verb-noun cross-word pair where source surface form (verb) has nominalization counterpart in ontology AND tier-stratification + SURFACE-DRIVEN-rule (D.1 / Bundle 1) jointly preclude cross-word fire. Procedural implication: SKIP per SURFACE-DRIVEN per D.1 three-tier framework (Bundle 1) — claim_text surface form is the operative criterion; cross-word counterpart in different word-class doesn't satisfy surface-tier match. Empirical anchor: dev-21 (claim-aristotle-da-3.3-063) — claim_text 'remain' (verb); ontology near-synonyms `persistence` + `endurance` + `enduring states` (secondary-lit; verb→noun cross-word counterparts); SKIPPED-VIA-SURFACE-DRIVEN per D.1 three-tier framework + tier-stratified GENUINE-GAP per C.3 §AF4 (no primary-author-introduced near-synonym + cross-tier non-defeat). **Interaction profile (NORMALIZED):**
  - **§3.2** cross-author-concept-collision row-criterion gate: **POSITIVE** (cross-author-collision-avoidance default-skip operative when cross-author near-synonyms involved)
  - **§5.4** paraphrase-modifications taxonomy: **NEGATIVE** (no §5.4 escalation)
  - **§AF4** tier-stratified GENUINE-GAP rule: **POSITIVE** — §AF4 tier-stratified GENUINE-GAP supplements at primary-author coverage gap when SURFACE-DRIVEN SKIP fires AND no primary-author-introduced near-synonym exists per C.3 inheritance. dev-21 fired joint disposition: SKIPPED-VIA-SURFACE-DRIVEN at label-selection level + tier-stratified GENUINE-GAP affirmed at gap-affirmation level (n=4 verified-GENUINE-GAP cases per C.3 inheritance includes dev-21 'remain'). Joint disposition operates orthogonally: SURFACE-DRIVEN at Disposition 3 governs label-fire decision (SKIP); §AF4 at C.3 governs gap-affirmation decision (verified-GENUINE-GAP) when conditions concurrently hold.
  - **§AF5** elided-contrast: **NEGATIVE** (no elided-contrast structure)
  - **Pattern-watch:** `surface-driven-disambiguation` umbrella per Bundle 1 D.4 + D.5 sub-variant tagging: **POSITIVE** (Disposition 3 cases tracked within umbrella pattern-watch with sub-variant tag)

**SURFACE-DRIVEN-as-disposition-3 inheritance from Bundle 1 → Bundle 2 D.3 outbound handoff:** Disposition 3 inherits D.1 three-tier surface framework from Bundle 1 (§3.3 D.1 SURFACE-DRIVEN-rule scope specification); D.3 enumerates SURFACE-DRIVEN as one of 3 dispositions within cross-word framework scope per outbound handoff disposition. Cross-reference inline (read-only inheritance) per Concern G v2 hybrid: D.3 framework specification text references Bundle 1 §3.3 D.1 framework; no direct edit to Bundle 1 §3.3 content.

**§1-compliant Prospective deferral.** D.3 codification grounds 3-disposition framework at 3 observed word-class-pair anchors (dev-16 noun-noun + dev-17 adj-adj + dev-21 verb-noun; n=1 per word-class-pair). Predicates not empirically anchored DEFERRED PROSPECTIVE per §1: (i) **Additional word-class-pairs** not surfaced in dev-set (adverb-verb cross-word; preposition-noun cross-word; verb-verb cross-word; adj-noun beyond Audi-031 nominalization scope); (ii) **Cumulative effects** when multiple word-class-pairs co-occur in single claim (no dev-set instance through dev-24); (iii) **Disposition-precedence ordering** when multiple dispositions could fire (no dev-set ambiguity instance through dev-24). Reconsideration horizon: next §8.2 every-25-items cycle, OR item-50 dev-set completion if not triggered earlier. Expected triggers: ≥1 dev-set case fires non-anchored word-class-pair / cumulative effect / disposition-precedence ambiguity.

**Audi-031 nominalization extension** (within D.3 framework; nominalization-extension broader scope encompassing verb→noun and adj→noun). Audi-031 nominalization extension fires under D.3 framework Disposition 1/2/3 depending on word-class-pair and tier-stratification context:

- **adj→noun fires under D.3 Disposition 1** (LABELED via §3.2 cross-word semantic-synonymy convention) when secondary-author-introduced peripheral exists with cross-word match. Empirical anchor: dev-19 'accurate' (adj) → `accuracy` (noun; Nussbaum 1985 secondary-lit peripheral; first_speaker Aristotle per jq verification at item-25c.2 C.3).
- **verb→noun fires under D.3 Disposition 3** (SKIPPED-VIA-SURFACE-DRIVEN when cross-author near-synonyms only; FIRES if same-tier ontology coverage exists). Empirical anchor: dev-21 'resemble' (verb) → `resemblance` (noun; Aristotle c. 350 BCE primary-citation peripheral; first_speaker Aristotle per jq verification at item-25d Bundle 2). Aristotle-claim labeling Aristotle-introduced ontology node via verb→noun extension is consistent with primary-tier coverage; Audi-031 fires under primary-tier same-author-introduced match.

**Empirical grounding at two distinct levels (per D.5 Q4 ground 3 distinction precedent):**
- **(i) Anchor case verification:** dev-21 fire substantively correct per jq verification — `resemblance` node confirmed (Aristotle c. 350 BCE primary-citation peripheral); Aristotle-claim labeling Aristotle-introduced ontology node via verb→noun extension is consistent with primary-tier coverage. dev-19 fire anchor: `accuracy` node confirmed (Nussbaum 1985 secondary-lit peripheral; first_speaker Aristotle). dev-18 anchor presumed; not directly probed at v2.
- **(ii) Rule empirical-groundedness — distinct empirical-grounding types:**
  - **n=3 cumulative FIRES** (dev-18 + dev-19 + dev-21) covering both adj→noun and verb→noun word-class-pairs within Audi-031 nominalization extension scope. Sufficient for STANDING disposition per principle-codification class.
  - **n=2 cumulative negative-boundary SKIPs** (dev-23 'presence' + dev-24 'knowledge'/'knowing') establishing scope-discipline post-dev-23 procedural protocol. Negative-boundary SKIPs reinforce rule via §5.4.2 negative-boundary-codification precedent — different empirical-grounding type than fires (fires establish rule operates; negative-boundary SKIPs establish rule's operative scope by distinguishing in-scope vs out-of-scope cases). The two empirical-grounding types are complementary: fires ground rule's operability; negative-boundary SKIPs ground rule's scope-discipline.

**A.2 FIRE #1 reconciliation closure** (parallel to D.5 Concern C structure for FIRE #2): A.2 disposition was PRESERVE-WITH-FLAG SCOPE-COMPLICATION DOCUMENT-ONLY (drift-log line 508; PHASE 0 reconciliation HOLD outcome 2026-05-02); Bundle 2 D.2 codification substantive review CONFIRMS PRESERVE disposition holds (no REVERT/REVISE grounds surfaced); PROVISIONAL APPLICATION → STANDING RULE; retroactive conditional-application flag from drift-log line 508 ([item-25 candidate: Audi-031 verb→noun extension; provisional application until next codification cycle]) SUPERSEDED by D.2 STANDING RULE codification; dev-21 fire substantively ratified per D.2 STANDING RULE codification. **A.2 reconciliation cycle COMPLETES at Bundle 2 codification** (FIRE #2 closed at D.5; FIRE #1 closes here).

**Cross-references.** §3.3 SURFACE-DRIVEN cluster (D.1 three-tier framework inheritance per Disposition 3; D.4 sub-mechanism (2) per cross-author scope) + §3.2 ontology-synonymy decided rule (Disposition 1) + §3.2 cross-author-concept-collision row-criterion gate (Disposition 3) + §5.4.7 paraphrase-modifications taxonomy mechanism (1) PARAPHRASE-SUBSTITUTION (Disposition 2) + §AF4 tier-stratified GENUINE-GAP rule (Disposition 3 supplement at primary-author coverage gap; joint disposition with C.3) + §8.0 / §8.4 pattern-watch infrastructure (Disposition 2 escalation; Disposition 3 sub-variant tagging within `surface-driven-disambiguation` umbrella).

**Triggered by:** dev-16 Entry D (cross-word noun-noun first dev-set instance: 'basic'↔`fundamental` LABELED via §3.2 convention) → dev-17 (cross-word adj-adj: 'specific'↔`particular` FIRED-AS-PARAPHRASE-ARTIFACT) → dev-21 Entry D (cross-word verb-noun third instance with distinct disposition: 'remain'↔`persistence` SKIPPED-VIA-SURFACE-DRIVEN; explicit registration of cross-word semantic-synonymy framework as item-25 substantial sub-task) → dev-22 Entry D continuation. Audi-031 nominalization extension provenance: dev-21 (provisional fire 'resemble'→`resemblance` verb→noun; PROVISIONAL APPLICATION via A.2) → dev-22 Entry H (formalization candidate registration) → dev-23 Entry F (Concern B procedural protocol establishment; subsequent applications require conditional-application flag OR SKIP; dev-23 'presence' SKIP first concrete labeling-decision impact) → dev-24 Entry E (dev-24 'knowledge'/'knowing' SKIP second concrete impact; negative-boundary scope-discipline established). CONVENTIONS-codified at item-25d Bundle 2 sub-session (PHASE 2 step 3; 2-element hierarchical bundle = D.3 parent framework + D.2 child instance; second hierarchical-bundle landing under (γ) framework extension; pre-codification jq operational test PASSED at v1 — 5 tests run with no discrepancies; pushback rounds v1→v2 round 1 substantive within Concern D HALT-tracking bounds; v2 normalized cross-disposition interaction profiles + D.2 broader nominalization scope + cumulative-instance-count distinction + section title parsimony per pushback resolutions).

---

## 4. Flag codes

Initial vocabulary. Each code carries: definition, concept-slot semantics, trigger rule, example, non-example, and a `Triggered by:` line.

### AF4 — No canonical ontology node

**Definition:** The claim's primary referent is a concept that should exist in the ontology but does not. Used when `expected_ontology_nodes: []` is the label, or when at least one referent is missing from the ontology even if others are present.

**Concept slot:** the missing concept (the one that ought to have a node).

**Trigger rule:** apply when grep/jq of `ontologyNodes[].name` returns no match, and no near-synonym canonical node exists either. Do not apply when a slug-only node like `phantasia` is the only canonical (that concept *is* in the ontology, even if the definition is thin).

**Example:**
```
"notes":"AF4:supervenience — no matching ontology node; candidate for future modern-node curation pass."
```

**Non-example (this is NOT AF4):**
```
"notes":"AF4:phantasia — ..."
```
Wrong: `phantasia` is in the ontology as a slug node (with the richer `Imagination` as its canonical companion). The concept is present. AF4 is for concepts that are absent.

**Triggered by:** first modern-philosophy secondary items (Kim on supervenience, Chalmers on qualia) surfaced in candidate sampling for the holdout `secondary_modern_philosophy` genre.

**Tier-stratified GENUINE-GAP rule.** AF4 candidate evaluation under load-bearing-modifier conditions tier-stratifies the gap-affirmation predicate by claim genre + ontology-node author-introduction-status. Two operative tiers:

- **Primary tier** — claim genre ∈ {primary_aristotle, primary_heidegger}. Gap-affirmation predicate: no **same-primary-author-introduced** near-synonym exists in the ontology for the load-bearing modifier or its referent. Cross-tier near-synonyms (secondary-author-introduced) DO NOT defeat primary-tier gap-affirmation per dev-21 Q5 standing.
- **Secondary tier** — claim genre ∈ {secondary_phantasia, secondary_non_phantasia, secondary_modern_philosophy}. Gap-affirmation predicate: no **same-secondary-author-introduced** near-synonym exists in the ontology for the load-bearing modifier or its referent. Cross-tier near-synonyms (primary-author-introduced) DO NOT defeat secondary-tier gap-affirmation by parity-of-reasoning extension of dev-21 Q5.

**Within-tier cross-author behavior:** within-tier same-author-introduced defeats; within-tier cross-author behavior empirically grounded only for secondary-tier (dev-19 Nussbaum 'reproductive' verified-GENUINE-GAP affirmed despite White 1985 + Papachristou 2013 secondary-author-introduced near-synonyms in ontology — within-tier cross-author near-synonyms did not defeat). Primary-tier within-tier cross-author behavior **DEFERRED PROSPECTIVE** per §1 (n=0 dev-set evidence; expected trigger: Heidegger primary-claim AF4 verified-GENUINE-GAP fire OR Aristotle-near-synonym-defeats-Heidegger case OR vice versa; reconsideration horizon: next §8.2 every-25-items cycle, or item-50 dev-set completion if not triggered earlier; line 114 wrong-context-rich-canonical rule cited as relevant precedent-of-analogy without codifying it as operative AF4 rule).

**Tier-membership criterion:** claim's `genre` field per dev jsonl / holdout jsonl.

**Provenance criterion (operational derivation per item-25c.2 C.3 jq verification — empirically tested against all 4 verified-GENUINE-GAP anchors):**

```
First filter: exclude type == "primary-citation" (bibliographic-only nodes;
              not conceptual; n=175 edge cases handled)
Then classify:
  secondary-author-introduced iff type == "secondary-lit"
    (single-field test; corpus-extension-stable; covers n≈6,548 conceptual
     secondary-author-introduced nodes)
  primary-author-introduced iff (type != "secondary-lit") AND
                                 (text matches /Aristotle|Heidegger/)
    (AND clause prevents bibliographic-citation noise; no Aristotle/Heidegger
     text nodes typed secondary-lit per edge probe n=0)
  unclassifiable fallback iff neither test matches
    → annotator-discretionary disposition with drift-log entry
      (rather than silent mis-classification)
```

**Operational jq command pattern:**

```bash
jq --arg pat "<near-synonym-regex>" \
  '.ontologyNodes[]
   | select(.type != "primary-citation")
   | select(.name | test($pat; "i"))
   | {name, text, type,
      primary_introduced: ((.type != "secondary-lit") and (.text | test("Aristotle|Heidegger"))),
      secondary_introduced: (.type == "secondary-lit"),
      unclassifiable: ((.type != "secondary-lit") and (.text | test("Aristotle|Heidegger") | not))}' \
  data/corpus/index/compiled-index.json
```

**Asymmetry rationale:** primary-tier claims operate within Aristotle/Heidegger canonical conceptual frameworks; primary-author-claim load-bearing modifier without primary-author-introduced canonical coverage represents a substantive primary-corpus gap (curation candidate). Secondary-tier claims operate within their respective secondary-author frameworks; secondary-author-claim load-bearing modifier without secondary-author-introduced coverage represents a secondary-literature ontology-coverage gap. Cross-tier near-synonym presence does NOT defeat in either direction (dev-21 Q5 codifies primary→secondary asymmetry; v3 secondary→primary symmetry extends by parity-of-reasoning).

**Tertiary-tier deferral note:** multi-cross-author scope (per dev-22 Entry C ternary-scope precedent: Audi+Kim+Barnes+Horgan partial-coverage) is SURFACE-DRIVEN-DISAMBIGUATION-relevant (label-selection precedence) but NOT AF4-scope-relevant (gap-affirmation predicate). dev-22 multi-cross-author claim was disposed via SURFACE-DRIVEN label-selection, not AF4 GENUINE-GAP affirmation; no AF4 case has fired under multi-cross-author scope through dev-24. Tertiary-tier under multi-cross-author scope deferred pending dev-set evidence accumulation; reconsideration at next §8.2 every-25-items cycle if multi-cross-author AF4 cases fire (current state: zero dev-set multi-cross-author AF4 fires).

**Verified-vs-raw count distinction.** Load-bearing-modifier pattern-watch entries proceed through a 4-criteria verification pipeline before promoting to verified-GENUINE-GAP status:

- **Raw count (n_raw)** — cumulative pattern-watch entries surfaced during annotation (currently n_raw = 10 across dev-9/17/19/20/21/23 et al per drift-log running-count).
- **Verified count (n_verified)** — entries that pass all 4 criteria of the dev-19 Concern D GENUINE-GAP test (currently n_verified = 4: dev-19 Nussbaum 'reproductive' + dev-20 + dev-21 'remain' + dev-23 'always').

**4-criteria GENUINE-GAP test (operative per dev-19 Concern D + dev-21 Q5 tier-stratified refinement + item-25c.2 C.3 codification):**

1. **Ontology absence verified** — jq lookup of `compiled-index.json` confirms no canonical node exists for the surface modifier or any near-synonym under tier-stratified provenance per Tier-stratified GENUINE-GAP rule above (primary-tier: no same-primary-author-introduced near-synonym; secondary-tier: no same-secondary-author-introduced near-synonym; cross-tier near-synonyms do not defeat per dev-21 Q5 + parity extension; within-tier cross-author per option (b) same-author-defeats with primary-tier cross-author Prospective-deferred).
2. **Related-but-distinct concept presence verified** — jq lookup confirms presence of related-but-distinct concept(s) in the ontology for the modified head concept, distinguishing GENUINE-GAP from absent-head-also-absent (which would be a different AF4 surface).
3. **Source-text uses surface modifier verified** — paragraph-scope check **PERFORMED INDEPENDENT of §5.4 activation status — faithfulness=supported short-circuiting §5.4 doesn't preclude paragraph-scope check for GENUINE-GAP-vs-paraphrase-artifact distinction; AF4 paragraph-scope check is not a §5.4 invocation; it is a parallel verification for a different purpose** (load-bearing-modifier pattern-watch GENUINE-GAP affirmation per item-25b sub-session B.5 §5.4.5 audit independence affirmation; verbatim incorporation per C.3 codification).
4. **Modifier load-bearing confirmed** — annotator-discretionary determination that the modifier's omission would change the claim's argumentative target (load-bearing) versus the modifier being decorative/elaborative (non-load-bearing).

**Status entitlement:** verified-GENUINE-GAP entries enter the §7.1 promotion-eligibility evaluation pool at item-25e sub-session E.1 (`§7.1-load-bearing-modifier-promotion-decision` candidate registry row at §7.5 row consuming C.3 outcome per Path C Phase 4 plan Protocol 5 outbound handoff). Raw entries that fail one or more criteria remain in pattern-watch as paraphrase-artifact / load-bearing-not-confirmed / candidate-pending-criterion-N.

**Status requirement:** verified-GENUINE-GAP entries require drift-log Type B entry recording per-criterion verification with jq-output excerpts for criteria (1) + (2), paragraph-scope-check excerpt for criterion (3), and load-bearing-rationale prose for criterion (4).

**Triggered by (tier-stratified rule + verified-vs-raw count distinction):** dev-9 → dev-17 → dev-19 Concern D 4-criteria GENUINE-GAP test → dev-21 Q5 tier-stratified primary-claim asymmetry standing → item-25b sub-session B.5 §5.4.5 audit independence affirmation handoff → item-25c.2 sub-session C.3 codification (2026-05-02). RATIFY-FORMALIZE per Path C Phase 4 plan: existing dev-19 Concern D 4-criteria test + dev-21 Q5 tier-stratified primary-claim asymmetry standing formalized as STANDING RULE; v3 codification empirically grounds derivation rule against 4 verified-GENUINE-GAP anchors via Concern A.1 jq verification (4/4 correct classification + 175 primary-citation edge cases handled by exclusion filter). Pushback rounds v1→v2→v3 (round 2 of 2 substantive; within Concern D HALT-tracking bounds; v3 narrowed to derivation-rule simplification + Prospective-marked deferral for primary-tier within-tier cross-author + tertiary-tier cross-reference completeness).

---

### AF5 — Implicit referent

**Definition:** The claim has a conceptual referent that is evident from the surrounding passage context but is NOT named in the `claim_text` as frozen in the gold entry. Under strict-surface labeling (see `README.md` §6), such referents are excluded from `expected_ontology_nodes` but recorded here for traceability.

**Concept slot:** the implicit referent (the concept that is present-but-unnamed).

**Trigger rule:** apply when the claim's argumentative structure clearly references a concept (via contrast words like "merely," "only," explicit negation, or dialectical setup) and that concept is in the ontology, but the concept's name or an unambiguous denotation does not appear in the `claim_text`.

**Example:**
```
"notes":"AF5:doxa — contrast supplied by 3.3 context via 'merely imagine'; held back under strict-surface rule."
```

**Non-example (this is NOT AF5):**
```
"notes":"AF5:supervenience — ..."
```
Wrong: supervenience is not in the ontology. AF5 requires the concept to exist as a node; if it doesn't, the correct flag is `AF4`. AF4 and AF5 are mutual non-examples by construction.

**Triggered by:** analysis of `claim-aristotle-da-3.3-033` where "merely imagine" implicitly contrasts with doxa/opinion, but doxa is not named in the single-line claim_text.

**4-disposition fire-disposition taxonomy.** AF5 candidate evaluation classifies into 4 disposition types per the candidate's elided-content profile. The 4-disposition framework was provisionally codified at dev-15 Entry C (drift-log 2026-04-29 af5-disposition-taxonomy-emerging-across-dev-12-13-14-15 observation) and ratified at item-25b sub-session C.4 per cumulative empirical pattern through dev-24 (12 dev cases distributed across 4 types).

- **type (1) tight-fire** — clean elided-contrast trigger. The candidate has identifiable elided content with a clear contrast structure (polarity-pair, dialectical setup, "merely"/"only" contrast word pointing to elided counterpart). AF5 FIRES per the standard trigger rule above. Empirical anchor: holdout 033 `AF5:doxa` ("merely imagine" pointing to elided doxa/opinion); dev-12 `AF5:reducibility` (clean polarity-pair irreducible↔reducibility).

  **Trigger criterion:** elided polarity-pair counterpart does argumentative work in the claim (per dev-19 Entry C refinement). Tight-fire holds when the elided counterpart's absence would change the claim's argumentative structure. The dev-19 refinement is the operative rule per cumulative empirical work; supersedes dev-15 Entry C original "ELIDED-CONTENT-PRESENT + LABELABLE + TIGHT-POLARITY-PAIR → FIRE" specification by adding the argumentative-work requirement that distinguishes type-(1) from type-(4) standalone-asymmetric-contrast cases.

- **type (2) loose-tracking** — substrate-relationship loose-fit. The candidate has a substrate-relationship to elided content (constitutive relation, sub-type relation, part-whole relation) rather than a tight polarity-pair. AF5 FIRES with loose-tracking flag (pattern-watch `af5-elided-contrast-substrate-relationship-loose-fit`). Empirical anchor: dev-6 `AF5:belief` (belief constitutive of opinion; substrate-relationship); dev-7 `AF5:nominal-definition` + `AF5:real-definition` (sub-types of definition; substrate-relationship).

  **Trigger criterion:** elided content stands in substrate-relationship (not tight contrast) to the candidate; pattern-watch tracks cumulative cases for future taxonomic refinement (cumulative n=3 through dev-24).

  **Note: dev-15 Entry C reconciliation.** dev-15 Entry C's "no fires yet" parenthetical referenced a sub-category-pending-future-instances framing that did not match the cumulative empirical record (dev-6/7 fired type-(2) substrate-relationship cases predating dev-15). Type-(2) disposition is FIRE-with-loose-tracking-flag per cumulative empirical evidence; future sub-category emergence may warrant refinement at next §8.2 cycle.

- **type (3) abstract-implicit-skip** — abstract concept cases. The candidate is an abstract concept where elided-contrast trigger is implicit not explicit (chapter-arc-supplied detail; chapter-arc-too-broad scope). AF5 SKIPS with abstract-implicit-skip rationale. Empirical anchor: dev-13 `AF5:Being-in-the-world` + `AF5:ζῷον λόγον ἔχον` skips per chapter-arc-too-broad; dev-14 AF5 verification + skip per chapter-arc-supplied-detail loose-fit; dev-19/20 Greek-vocabulary candidates (theōrēma/noēma/mnēmoneuma) skipped per chapter-arc-too-broad.

  **Trigger criterion:** candidate's elided-contrast operates at chapter-arc-scope (broader than claim's argumentative target); claim's argumentative work doesn't engage the elided counterpart at chapter-arc-scope distance. SKIP disposition with documented rationale ("chapter-arc-too-broad" / "chapter-arc-supplied-detail loose-fit").

- **type (4) no-elided-content-skip** — no elided content present. The candidate has no elided content; the trigger condition (elided contrast) doesn't apply because the claim's verbal-predicates structurally capture the substantive content. AF5 SKIPS per trigger-condition-not-met. Empirical anchor: cumulative n=9 through dev-24 (dev-15 + dev-17 + dev-18 + dev-19 + dev-20 + dev-21 + dev-22 + dev-23 + dev-24).

  **Trigger criterion:** no elided polarity-pair counterpart does argumentative work. Either (i) **two-pole-explicit case** — both contrast poles are STRUCTURALLY EXPLICIT in claim_text via verbal-predicates (covers sub-variants 4a negation-without-X, 4b concession, 4d explicit-but-contrast); or (ii) **positive-thetic-single-pole case** — claim presents a positive thetic structure with no implicit contrast pole; verbal-predicates structurally capture the propositional content (covers sub-variant 4c). SKIP disposition with documented rationale ("no-elided-content"; sub-variant per type-(4) internal taxonomy below).

  **Type-(4) sub-variant taxonomy.** Within type-(4), four sub-variants distinguished by the structural mechanism of explicit-content capture:

  - **4a negation-without-X** — verbal-predicate captures negation structurally (e.g., 'X does not occur without Y'). Cumulative n=1 (dev-15).
  - **4b concession** — concession structure makes both contrast poles structurally explicit (e.g., 'may mean only that [narrow], not that [broad]'). Cumulative n=1 (dev-17).
  - **4c positive-thetic** — positive thetic claim with verbal-predicate structurally capturing propositional content; no implicit contrast pole. Cumulative n=4 PAST split-threshold (dev-18 + dev-21 + dev-22 + dev-24).
  - **4d explicit-but-contrast** — explicit but-conjunction with structurally-explicit-both-poles via negation pole. Cumulative n=3 AT split-threshold (dev-19 + dev-20 + dev-23).
  - **4e rhetorical-intensifier** — candidate-only observation per dev-22 Q4 future-evaluation; not active sub-variant.

  Sub-variant taxonomy split-decision RESOLVED at item-25c.1 sub-session C.2 (2026-05-02): **UMBRELLA-WITH-REFINED-TRIGGER** disposition. Sub-variants 4a/4b/4c/4d retained as mechanism descriptors within unified type-(4) (no promotion to separate AF5 types); trigger criterion refined to make {two-pole-explicit OR positive-thetic-single-pole} accommodation explicit per the trigger criterion above. Umbrella pattern-watch `af5-no-elided-content-skip` retains unified cumulative tracking n=9 with no migration. dev-22 Concern D split-threshold criterion (n≥3 per single sub-variant) registered as necessary-but-not-sufficient at C.2: 4c n=4 PAST and 4d n=3 AT both meet threshold but structural argument (sub-variant mechanism distinction is tagging-level not type-level given trigger criterion already accommodates single-pole case via the (i)/(ii) bifurcation as refined) governs umbrella-retention disposition. C.4 codification provided the type-(4) framework + sub-variant emergence enumeration; C.2 codification renders the disposition above. Pushback rounds v1→v2→v3 (round 2 of 2 substantive; within Concern D HALT-tracking bounds; v3 narrowed to evidence-count notation + candidate-name retention + prose-conversion redundancy resolution).

**Pattern-watch maintenance.** Each disposition type has its own pattern-watch tracking per §8.0 / §8.4 infrastructure: `af5-elided-contrast-substrate-relationship-loose-fit` (type 2 cumulative n=3); `af5-no-elided-content-skip` (type 4 cumulative n=9 through dev-24); type-(1) tight-fire and type-(3) abstract-implicit-skip track via observation entries without dedicated pattern-watch (per §8.0 convention; pattern-watch dedicated to refinement-tracking categories where taxonomic emergence is uncertain). Type-(2) refinement threshold deferred to next §8.2 cycle if pattern accumulates.

**Cross-references.**

- **§AF4** — AF5 and AF4 are mutual non-examples by construction (existing §AF5 framing); 4-disposition taxonomy applies to AF5 only.
- **§5.4.6 sub-pattern taxonomy** — AF5 4-disposition framework operates on candidate ontology-node fire-disposition decisions; §5.4.6 sub-pattern taxonomy operates on §5.4 step-4 paraphrase-distortion-fire decisions. The two taxonomies are independent subsystems (different flag codes; different trigger-rule surfaces). Explicit independence cross-reference per overlap-confusion-mitigation rationale (dev-22 Q4 user pushback on rhetorical-mode disposition-distinction relevance precedent).
- **§8.0 / §8.4** — pattern-watch maintenance per existing infrastructure; per-type cumulative tracking via observation entries. C.4 codification triggers no explicit §8.0 reconciliation pass at codification time; defer to next §8.0 trigger scan per existing convention.

**Triggered by (4-disposition taxonomy codification):** dev-15 Entry C (claim-aristotle-da-3.3-028, 2026-04-29) provisional codification of 4-disposition framework as AF5 disposition taxonomy emerging across dev-12/13/14/15 → cumulative empirical ratification through dev-24 (12 dev cases distributed across 4 types: type-(1) holdout 033 + dev-12; type-(2) dev-6 + dev-7; type-(3) dev-13 + dev-14 + dev-19 + dev-20; type-(4) dev-15/17/18/19/20/21/22/23/24). RATIFY-REFINE per Path C Phase 4 plan C.4: existing 4-disposition framework ratified per cumulative empirical pattern; refinement formalizes per-type trigger criteria + pattern-watch maintenance + sub-variant taxonomy forward-reference to item-25c.1 C.2. Codified at item-25b sub-session C.4 (2026-05-02; standalone terminal increment per (γ) 5-increment plan; final increment for item-25b).

---

### AF6 — Pronoun rewrite

**Definition:** The `claim_text` as presented in the gold entry was rewritten to substitute an antecedent for a pronoun or deictic present in the source, so that the claim is interpretable standalone without surrounding context.

**Concept slot:** the original anaphor, mapped to its substitute, using `→` (e.g., `it→phantasia`).

**Trigger rule:** apply when (a) the source claim uses an irreducible pronoun (`it`, `this`, `they`, `that`) or bare deictic (`such`, `so`), (b) no natural definite-description substitute exists in the immediate claim context, and (c) rewriting the `claim_text` to substitute the antecedent is necessary for standalone interpretability.

**Example:**
```
"notes":"AF6:it→phantasia — source claim read 'it is not found in bees or grubs'; rewritten to substitute the antecedent from the prior sentence for standalone interpretability."
```

**Non-example (this is NOT AF6):**
```
"notes":"AF6:the-faculty→Perception — ..."
```
Wrong: "the faculty" is definite-description anaphora, not pronoun anaphora. Definite descriptions are resolved by canonicalization (at labeling time, you map "the faculty" to `Perception` in `expected_ontology_nodes`) rather than by rewriting the claim_text. AF6 is reserved strictly for pronouns and bare deictics where no natural definite-description substitute exists.

**Decision procedure:**
1. Does the anaphor have a definite-description substitute that canonically names an ontology node? → NOT AF6. Resolve at label time; do not rewrite.
2. Is the anaphor an irreducible pronoun or deictic with no natural substitute? → AF6. Rewrite `claim_text` and flag.

**Triggered by:** anticipated frequency of pronoun anaphora in Aristotelian Greek-to-English translations and Heidegger's BCAP, where rewriting is the only route to standalone claim interpretability.

---

## 5. Retrieval paths

`jq` is the supported retrieval path. `grep` recipes are convenience shortcuts for named common queries.

### 5.1 jq (recommended)

```bash
# Count by flag type
jq -s 'map(select(.notes | test("^AF4:"))) | length' data/gold/resolver-gold-dev.jsonl

# Find all items carrying a specific flag + concept combination
jq 'select(.notes | test("AF5:doxa"))' data/gold/resolver-gold-dev.jsonl

# List all AF4 concepts (the set of missing ontology nodes)
jq -r 'select(.notes | test("AF4:")) | .notes | capture("AF4:(?<c>[^ |]+(?: [^ |]+)*) —") | .c' \
    data/gold/resolver-gold-dev.jsonl | sort -u

# Find all items with any flag (vs. pure-prose notes)
jq 'select(.notes | test("^(AF|PL):"))' data/gold/resolver-gold-dev.jsonl
```

### 5.2 grep (convenience; single-word concept slots only)

```bash
# Subset by flag
grep -c "AF5:"     data/gold/resolver-gold-dev.jsonl

# Subset by flag + specific concept (single-word concepts only)
grep    "AF5:doxa" data/gold/resolver-gold-dev.jsonl
grep -c "AF4:"     data/gold/resolver-gold-dev.jsonl
```

### 5.3 When to use which

`grep` works correctly when the concept slot is a single word (no internal whitespace). For multi-word concepts like `common sensibles` or `incidental perception`, `grep` is unreliable in pipeline contexts and ad-hoc shells. Use `jq` for those.

<!-- BEGIN auto-generated:single-word-slots -->
**Currently-safe single-word concept slots (hand-maintained until item 50):**

This list enumerates concept slots currently used in the committed annotations that are safe for `grep` retrieval. It is hand-maintained for the first 50 annotations. At item 50, evaluate whether automated regeneration is warranted (see deferral §9).

- (No annotations committed yet; list will populate as annotation progresses)

<!-- END auto-generated:single-word-slots -->

**Triggered by:** recognition during spec iteration that annotators under time pressure will grep multi-word slots and silently get wrong results; `jq`-first framing is a behavioral nudge toward the correct default.

### 5.4 Partial-faithfulness verification procedure

On items with `_candidate_metadata.faithfulness: "partial"`, the extractor has acknowledged that the paraphrase in `claim_text` departs from the source quote in some way. Before labeling such items:

1. Look up the source record in `data/corpus/index/<slug>/claims.jsonl` and read the `.quote` field, the `.nearby_provenance` (Bekker anchor), the `.faithfulness_note`, and the source paragraph containing the quote (per §5.4.1 paragraph-scope methodology below).
2. Verify that each proposed label in `expected_ontology_nodes` is grounded in the quote itself, not solely in the extractor's paraphrase.
3. If the grounding is non-obvious (e.g., the paraphrase added taxonomic framing or illustrative examples beyond the quote), document the verification in the `rationale` field in one clause of the form: `"...referents are grounded in the quote's X and Y at <Bekker>, with Z being extractor-supplied framing."`
4. **Hand-off to PL:paraphrase-distortion (§3.2):** if the lookup reveals that the paraphrase shifts or introduces a referent not present in or inferrable from the source quote — so that labeling from the quote alone would yield a different label set than labeling from the paraphrase — flag the item with `PL:paraphrase-distortion`. Labels remain against the paraphrase text (per the gold-set methodology in README §6); the PL flag surfaces the extraction-quality issue for upstream review rather than concealing it in the label.

**Slug → filesystem path mapping.** The candidate's `.source.slug` uses dots (e.g., `aristotle-da-3.3`); the filesystem directory name uses dashes (e.g., `aristotle-da-3-3`). When constructing a lookup path, translate the last dot-separated component accordingly. A partial-faithfulness lookup failing to find records likely has its slug-to-path translation wrong rather than a missing file.

**Lookup snippets.**

```bash
# Corpus survey — run once per session to see how many partial-faithfulness items to expect:
jq -r 'select(._candidate_metadata.faithfulness == "partial") | .claim_id' \
    data/gold/candidates/holdout-primary_aristotle.sample.jsonl

# Per-item verification — run when labeling a specific partial-faithfulness item:
# (substitute the claim-id and derive the dash-form slug from the candidate's .source.slug)
jq --arg id "claim-aristotle-da-3.3-058" '
  select(.id == $id) | {
    quote,
    nearby_provenance,
    faithfulness_note,
    matched_span: .grounding.matched_span
  }
' data/corpus/index/aristotle-da-3-3/claims.jsonl
```

**Triggered by:** `claim-aristotle-da-3.3-058` review (2026-04-22) — the faithfulness-awareness gap surfaced when inspecting that the "third type" taxonomic framing in the paraphrase is extractor-supplied beyond the 428b quote, prompting the question of how annotators are meant to verify grounding for partial-faithfulness claims.

#### 5.4.1 Paragraph-scope methodology

§5.4 verification operates at **source-paragraph scope**, not quote-field-only scope. The verification unit for grounding-checks (step 2), grounding-rationale (step 3), and PL:paraphrase-distortion-firing (step 4) is the source paragraph containing the `.quote` field — i.e., the paragraph in which the quote is embedded as it appears in the corpus source text.

**Why paragraph-scope.** Paraphrase elements that surface as new-referent-introduction at quote-field scope frequently resolve via preceding-sentence anaphora within the same paragraph (sub-pattern (a) anaphoric-resolution-substitute). Without paragraph-scope expansion, such cases mis-classify as new-referent-introduction (sub-pattern (b)) and over-fire §5.4 step 4. With paragraph-scope, anaphoric-resolution-substitute correctly resolves at the sub-pattern (a) NON-FIRE level rather than escalating to (b) FIRE.

**Definition: source paragraph.** The contiguous block of source-text sentences that includes the `.quote` field's text, bounded by paragraph breaks in the corpus source text. Paragraph identification follows the corpus source's paragraph structure (typically derived from PDF/EPUB layout or Bekker-page paragraph breaks).

**Paragraph-identification edge cases (layered protocol).** Where paragraph identification is ambiguous (mid-paragraph chunk-splits in the corpus index produce sub-paragraph chunks), apply the following protocol in order:

1. **Default** — use the corpus source's paragraph structure as authoritative; chunk boundaries are not paragraph boundaries.
2. **Expand-to-paragraph-break** — if the chunk boundary cuts a paragraph mid-stream, expand the verification scope outward to the nearest paragraph breaks before and after the chunk's content, reading the full paragraph as the verification unit.
3. **Flag-ambiguity-as-fallback** — if paragraph breaks themselves are ambiguous in the source (e.g., extended block with no clear paragraph structure; OCR-degraded layout), flag the ambiguity in the `rationale` field with a clause of the form `"...paragraph-scope verification at <Bekker> uses <expanded-bound> per §5.4.1 layered protocol step 3 (paragraph-identification ambiguous)."` and use the source-text PDF as authoritative-fallback.

**Application criterion.** Paragraph-scope methodology engages at step 1 of the §5.4 procedure: reading the source paragraph alongside the quote field is the operational entry point, chronologically prior to step-2 grounding-checks and step-4 sub-pattern classification. Reading the paragraph informs sub-pattern classification rather than being invoked atemporally as a co-equal procedure-step. Faithfulness=supported items short-circuit the §5.4 procedure by default per §5.4.4 entry-criterion and do not invoke paragraph-scope verification (faithfulness=supported assumes quote-grounded labeling without paragraph-context grounding-check requirements). The default short-circuit is non-absolute: annotator-detected substantive paraphrase-modifications trigger the §5.4.4 paraphrase-modification-detection exception, invoking §5.4 (and paragraph-scope verification) despite the supported flag. Faithfulness=supported reliability audit at §5.4.5 documents 6 cumulative supported-accommodation cases (dev-17/19/20/21/22/24 through dev-24); 4 cleanly accommodated, 2 triggered the exception (33% exception rate; supported-as-default-prior / non-absolute).

**WARRANT-≠-SOURCE-TEXT principle (warrant-metadata exclusion).** Warrant metadata (`.warrant` field on corpus claim records, when present) is **excluded** from §5.4 verification scope across all four procedure steps. Warrant is extractor-supplied interpretation generated during the extraction process; it is not source-text. Grounding-verification at step 2 must trace each proposed label to the source paragraph (quote + surrounding paragraph sentences), not to warrant metadata. Step-3 grounding-rationale documentation cites source-paragraph content, not warrant. PL:paraphrase-distortion at step 4 fires when paraphrase introduces referent not present in or inferrable from the source paragraph — warrant alignment with the paraphrase does NOT prevent the fire.

**Boundary specifications.** The boundary between paragraph-scope (in-scope for §5.4) and chapter-arc-scope (out-of-scope for §5.4 sub-pattern (a) NON-FIRE licensing) is specified at §5.4.2 paragraph-vs-chapter-arc-scope boundary. The cluster-vs-paragraph-scope verification methodology distinction (§5.4 operates at claim-level, not cluster-level) is specified at §5.4.3 cluster-vs-paragraph-scope methodology.

**Triggered by:** dev-18 Entry E methodology principle establishment (claim-chalmers-2016-218 Instruction 6, 2026-04-29) — paragraph-scope surfaced when chapter-arc-context-check on dev-18 217-218 sequence revealed that `experienced user` + `virtual reality` paraphrase elements resolve via preceding-sentence anaphora at 217 source quote rather than as new-referent-introduction. Five cumulative applications post-establishment (4 fires + 1 NON-FIRE result, distinguishing application from result): dev-18 mixed-case fire, dev-21 c-causal fire, dev-22 c-parallel fire, dev-23 b-single disambiguation fire, dev-24 NON-FIRE (Path A rhetorical-frame stripping + presupposition-to-assertion conversion). All five applications confirm methodology operationally sound — both fire and NON-FIRE outcomes register paragraph-scope as the verification unit; result-distribution is incidental to application-pattern. RATIFY-PRINCIPLE-WITH-FORMALIZATION per Path C Phase 4 plan B.1: existing principle ratified; scope-unit definition + WARRANT-exclusion + step-1-paragraph-reading application-criterion + paragraph-identification layered-protocol formalized from informal practice. Codified at item-25b sub-session B.1 (2026-05-02).

#### 5.4.2 Paragraph-vs-chapter-arc-scope boundary

§5.4 paragraph-scope methodology (§5.4.1) operates at source-paragraph scope. The boundary between paragraph-scope (in-scope for §5.4 verification) and chapter-arc-scope (out-of-scope for §5.4 sub-pattern (a) NON-FIRE licensing) is specified here.

**Rule.** Sub-pattern (a) anaphoric-resolution-substitute NON-FIRE licensing extends only to anaphoric antecedents within the source paragraph (per §5.4.1 scope-unit definition). Sub-pattern (a) is the only NON-FIRE-licensing mechanism affected by this boundary; sub-patterns (b)/(c) classification is governed by claim-level rule per §5.4.3. Anaphoric antecedents at chapter-arc-scope distance (cluster-spanning anaphora; preceding-or-succeeding-paragraph anaphora; cross-chapter anaphora per §5.5 cluster-spanning-slug naming) do NOT license sub-pattern (a) NON-FIRE. When the paraphrase introduces a referent recoverable only at chapter-arc-scope, §5.4 step 4 fires per sub-pattern (b) new-referent-introduction (or applicable sub-pattern) — not sub-pattern (a) NON-FIRE.

**Why the boundary.** Paragraph-scope is the methodologically tractable verification unit: paragraph boundaries are stable in source text; paragraph content is bounded; annotators can read the paragraph in finite time. Chapter-arc-scope is methodologically unbounded — extending NON-FIRE licensing to chapter-arc anaphora would require reading the full chapter-arc cluster as the verification unit, which conflates §5.4 (claim-level partial-faithfulness verification) with §5.6 (chapter-arc-context-check methodology). The two methodologies have distinct application criteria and distinct deliverables; their scope-units must remain distinct.

**Interaction with §5.6 chapter-arc-context-check.** §5.6 criterion (b) engages §5.4 paragraph-scope methodology when arc-context-check is applied; arc-context-check informs label-fire/skip decisions and rationale framing, but does NOT cross-license §5.4 sub-pattern (a) NON-FIRE. An annotator who applies §5.6 arc-context-check and discovers chapter-arc-anaphoric antecedent for a paraphrase referent should still classify §5.4 step 4 disposition by paragraph-scope criterion: if the referent is not recoverable within the source paragraph, §5.4 step 4 fires regardless of chapter-arc recovery. The chapter-arc finding may be documented in the rationale (per §5.4 step 3 grounding-rationale form) but does not change §5.4 step 4 disposition.

**Empirical precedent.** dev-23 (claim-aristotle-da-3.3-036) Q1/Concern C: source paragraph 428a5-15 (cluster 035-038) did not establish 'animals that have sense' qualifier; broader paragraph-scope cluster 023/025 establishes universal-perception thesis at chapter-arc-scope distance from 036 source paragraph. Per Q1 disposition: cluster 023/025 anaphoric recovery would require chapter-arc-scope methodological extension not licensed by §5.4 paragraph-scope methodology; §5.4 step 4 fires per sub-pattern (b-single) DISAMBIGUATION directionality variant. dev-23 is the empirical evidentiary case for this boundary specification (n=1; sufficient for negative-boundary codification per single-dispositive-case rationale).

**Triggered by:** dev-23 Entry B + Entry H (iii) (claim-aristotle-da-3.3-036 Q1/Concern C, 2026-05-01) — boundary specification surfaced when sub-pattern (a) NON-FIRE candidate (chapter-arc cluster 023/025 anaphoric recovery for 'animals that have sense' qualifier) was considered and rejected per paragraph-scope-as-methodological-boundary disposition. Codified at item-25b sub-session B.2 (2026-05-02; bundled with B.7 §5.4.3 cluster-vs-paragraph-scope methodology per criterion (i) thematic coordination).

#### 5.4.3 Cluster-vs-paragraph-scope methodology

§5.4 verification operates at **claim-level**, not cluster-level. The methodology distinction between cluster-scope (out-of-scope for §5.4 verification) and paragraph-scope (in-scope per §5.4.1) is specified here.

**Rule.** §5.4 partial-faithfulness verification fires per individual claim based on the claim's own paraphrase against its own source paragraph (§5.4.1 scope-unit definition). The rule applies to all four §5.4 procedure steps (step 1 source-record lookup; step 2 grounding-verification; step 3 grounding-rationale documentation; step 4 PL:paraphrase-distortion firing) — cluster-vs-claim-level is a verification-unit question affecting the entire procedure, not step 4 alone. Cluster-level extraction patterns — where a multi-claim cluster collectively distributes the source paper's argumentative content across constituent claims (e.g., a 4-claim cluster distributing a bipartite argument; a 6-claim cluster decomposing an extended argument) — do NOT compensate for individual-claim §5.4 fires. If claim N's paraphrase strips substantive content from claim N's source paragraph, §5.4 step 4 fires for claim N regardless of whether claim N+1 or claim N-1 in the cluster recovers the stripped content.

**Why claim-level.** §5.4 verification is per-claim quality assurance: the gold-set labels claim N against claim N's text + source paragraph; the resolver under evaluation is asked to label claim N's text in isolation (resolver does not see neighboring claims). Cluster-level content-recovery would mask claim-level extraction-quality issues that the resolver cannot mitigate operationally. The PL:paraphrase-distortion flag's purpose is surfacing extraction-quality issues for upstream review per §5.4 step 4; cluster-level compensation would conceal what the flag exists to surface.

**Boundary with §5.6 chapter-arc-context-check.** §5.6 arc-context-check (when applied per §5.6 trigger criteria) inspects the surrounding cluster of claims to inform label-fire/skip decisions for the current claim's labels. Arc-context-check may surface that claim N+1 covers content absent from claim N's paraphrase. This finding may inform claim N's labeling rationale (e.g., establishing that claim N is the third claim in a 4-claim cluster decomposing a bipartite argument), but does NOT compensate for claim N's §5.4 fire if claim N's paraphrase strips substantive content from claim N's source paragraph. §5.4 disposition remains claim-level; arc-context informs framing not §5.4 disposition.

**Empirical precedent.** dev-22 (claim-horgan-1993-136) Entry B Q1 + Entry H (i): cluster 134-137 distributes Schiffer's bipartite reductio across 4 claims (134 tough-minded physicalists / 135 Moore positive thesis / 136 mystery-mystery THIS CLAIM / 137 irony-of-coherence). Claim 136's paraphrase strips coordinate-parallel appositive clause (', to cover one obscurantist move with another') from source paragraph; claim 137 partially recovers obscurantist-charge via softer 'ironic' framing. Per Q1 disposition: cluster-level coverage by claim 137 does NOT compensate for claim 136's individual-claim distortion; §5.4 step 4 fires for claim 136 per sub-pattern (c-parallel) per Decision 22. dev-22 is the empirical evidentiary case for this claim-level rule (n=1; sufficient for negative-boundary codification per single-dispositive-case rationale).

**Triggered by:** dev-22 Entry B + Entry H (i) (claim-horgan-1993-136 Q1, 2026-05-01) — cluster-level vs paragraph-scope verification methodology question surfaced when the bipartite-cluster distribution pattern (claims 134-137 collectively recovering Schiffer's reductio) was considered as potential compensating mechanism for claim 136's parallel-clause-drop. Per Q1 user disposition: NO; §5.4 framework operates at claim-level. Codified at item-25b sub-session B.7 (2026-05-02; bundled with B.2 §5.4.2 paragraph-vs-chapter-arc-scope boundary per criterion (i) thematic coordination).

#### 5.4.4 Faithfulness=partial vs supported §5.4 entry-criterion

§5.4 verification is conditionally invoked per `_candidate_metadata.faithfulness` flag. The entry-criterion governing invocation vs short-circuit is specified here.

**Default entry-criterion.**

- **`faithfulness: "partial"`** — §5.4 verification REQUIRED. The extractor has flagged the paraphrase as departing from the source quote; §5.4 procedure steps 1-4 invoke unconditionally.
- **`faithfulness: "supported"`** — §5.4 verification SHORT-CIRCUITS by default. The extractor has flagged the paraphrase as quote-grounded; §5.4 procedure is skipped absent an exception per the paraphrase-modification-detection exception below.

**Paraphrase-modification-detection exception (faithfulness=supported items).** When an annotator detects substantive paraphrase-modifications in a faithfulness=supported item — using the paraphrase-modifications taxonomy codified at §5.4.7 (8 mechanisms: substitution / addition / omission / modal-shift / causal-frame-collapse / parallel-clause-drop / rhetorical-frame-stripping / presupposition-to-assertion conversion) — §5.4 verification SHALL be invoked despite the supported flag. The supported flag is treated as default-not-absolute: the extractor's flag is the prior, but annotator-detected substantive paraphrase-modifications override the prior and trigger §5.4 procedure. Exception fires per §5.4 step 4 sub-pattern classification (a/b/c per §5.4 step 4 framework).

**Distinguishing accommodation from substantive modification.** Not every faithfulness=supported paraphrase modification triggers the exception. The substantive-vs-trivial threshold is annotator-discretionary per the paraphrase-modifications taxonomy criteria — mechanisms alone do not predict disposition (empirically the dev-set pattern is messier than per-mechanism rules: dev-21 c-causal-frame-collapse FIRES + dev-22 c-parallel-clause-drop FIRES while dev-24 rhetorical-frame-stripping + presupposition-to-assertion NON-FIRES; substantive-vs-trivial requires per-instance annotator judgment). Trivial modifications (synonym substitution where source word + paraphrase word are both in or near ontology — e.g., dev-17 'specific'←'particular' where both gloss καθ' ἕκαστον — accommodate cleanly without §5.4 invocation). Substantive modifications (paraphrase introduces new referent not in source paragraph; paraphrase frame-collapses subordinate or coordinate structure with substantive content-stripping; paraphrase modal-shifts beyond ordinary synonym range with argumentative-weight-bearing implication) trigger the exception. Cumulative dev-set empirical pattern (per §5.4.5 audit) provides reference cases.

**Empirical precedent.**

- **Entry-criterion default for faithfulness=partial:** dev-23 (claim-aristotle-da-3.3-036) — first dev-set faithfulness=partial item; §5.4 verification REQUIRED-not-discretionary per Q1 disposition; step 4 fires per sub-pattern (b-single) DISAMBIGUATION variant. Confirms partial → §5.4 invoke default.
- **Exception fires (supported with substantive modifications):** dev-21 (claim-aristotle-da-3.3-063) faithfulness=supported with §5.4 step 4 FIRE per sub-pattern (c-causal); dev-22 (claim-horgan-1993-136) faithfulness=supported with §5.4 step 4 FIRE per sub-pattern (c-parallel). Both demonstrate supported flag's non-absolute character — substantive paraphrase-modifications warrant §5.4 invocation despite supported flag.
- **Default short-circuit holds (supported with trivial-or-accommodated modifications):** dev-17 (substitution), dev-19 (omission), dev-20 (modal shift + addition), dev-24 (rhetorical-frame stripping + presupposition-to-assertion). All four faithfulness=supported items where paraphrase modifications were detected but assessed as accommodating-without-§5.4-fire; §5.4 short-circuit holds. (See §5.4.5 audit for per-case dispositions.)

**Triggered by:** dev-23 Entry B + Entry H (ii) (claim-aristotle-da-3.3-036 Q1, 2026-05-01) — first dev-set faithfulness=partial item explicitly bypassed faithfulness=supported short-circuit + dev-20 Concern B (claim-nussbaum-1985-061, 2026-04-29) — faithfulness=supported reliability question surfaced when 3 cumulative supported-accommodation cases (dev-17/19/20) showed substantive paraphrase-modifications accommodated by metadata without §5.4 invocation, prompting reliability question. Codified at item-25b sub-session B.4 (2026-05-02; bundled with B.5 §5.4.5 reliability audit per criterion (ii) interdependence per (γ) plan).

#### 5.4.5 Faithfulness=supported reliability audit

The faithfulness=supported short-circuit (§5.4.4) rests on the prior that the extractor's supported flag indicates no substantive paraphrase modifications warranting §5.4 verification. Reliability of this prior is audited here per cumulative dev-set evidence through dev-24.

**Audit findings (n=6 faithfulness=supported items with paraphrase-modifications detected through dev-24).**

| Item | Paraphrase-modification mechanism | §5.4 outcome | Disposition |
|---|---|---|---|
| dev-17 (claim-bowin-2017-129) | Substitution ('specific'←'particular') | NON-FIRE (accommodation) | DOCUMENT-ONLY (synonym-shift within ontology range) |
| dev-19 (claim-nussbaum-1985-077) | Omission (comparative-framing drop) | NON-FIRE (accommodation) | DOCUMENT-ONLY (omission did not change label set) |
| dev-20 (claim-nussbaum-1985-061) | Modal-shift + Addition ('may use'←'depend rather heavily on'; 'pictorial' added) | NON-FIRE (accommodation) | DOCUMENT-ONLY (modal-shift + addition accommodated; addition surfaced from chapter-arc context) |
| dev-21 (claim-aristotle-da-3.3-063) | Causal-frame-collapse | FIRE per sub-pattern (c-causal) | EXCEPTION FIRED (now codified per §5.4.4 paraphrase-modification-detection exception; original Decision 19 interim judgment retrospectively grounded in standing rule) |
| dev-22 (claim-horgan-1993-136) | Parallel-clause-drop | FIRE per sub-pattern (c-parallel) | EXCEPTION FIRED (now codified per §5.4.4 paraphrase-modification-detection exception; original Decision 22 interim judgment retrospectively grounded in standing rule) |
| dev-24 (claim-aristotle-da-3.3-066) | Rhetorical-frame-stripping + Presupposition-to-assertion | NON-FIRE (accommodation) | DOCUMENT-ONLY (rhetorical/grammatical mechanisms accommodated per dev-19 omission precedent) |

**Aggregate finding.** Of 6 faithfulness=supported items with paraphrase-modifications detected, 4 (67%) accommodated cleanly (NON-FIRE; dev-17/19/20/24); 2 (33%) triggered exception (FIRE per §5.4.4 paraphrase-modification-detection exception; dev-21/22). Faithfulness=supported flag is reliable as default-prior but non-absolute — the 33% exception rate confirms that annotator-detected substantive paraphrase-modifications must override the prior. **Reliability assessment: SUPPORTED-AS-DEFAULT-PRIOR / NON-ABSOLUTE.**

**Standing rule.** Faithfulness=supported short-circuit is the default behavior per §5.4.4; annotator-detected substantive paraphrase-modifications trigger the §5.4.4 paraphrase-modification-detection exception. Audit finding integrates with §5.4.4 entry-criterion specification: §5.4.4 default + exception together specify the operational rule; §5.4.5 audit provides the empirical basis for the exception's necessity (33% exception rate confirms exception is not a corner case). Future audit cycles per §8.2 every-25-items framework may revisit reliability assessment if exception rate trends materially upward (would warrant more substantive §5.4 framework revision); current 33% rate calibrates to default-prior / non-absolute framing without supported-flag deprecation.

**Coordination handoff to item-25c.2 C.3 (AF4 verified-vs-raw count formalization).** dev-17 paraphrase-artifact distinction (paraphrase-artifact gaps vs genuine ontology gaps for load-bearing-modifier pattern-watch) per dev-19 Concern D 4-criteria GENUINE-GAP test: criterion (3) paragraph-scope verification "PERFORMED INDEPENDENT of §5.4 activation status — faithfulness=supported short-circuiting §5.4 doesn't preclude paragraph-scope check for GENUINE-GAP-vs-paraphrase-artifact distinction" (per dev-19 drift-log Entry). This independent paragraph-scope verification (for AF4 GENUINE-GAP test) operates separately from §5.4.4 entry-criterion: AF4 paragraph-scope check is not a §5.4 invocation; it is a parallel verification for a different purpose (load-bearing-modifier pattern-watch GENUINE-GAP affirmation). item-25c.2 sub-session C.3 codifies AF4 verified-vs-raw count formalization; C.3 inherits B.5 audit's affirmation that paragraph-scope verification can operate independent of §5.4.4 entry-criterion.

**Coordination back to §5.4.1.** §5.4.1 short-circuit framing revised at this codification per B.1 B.4/B.5-coordination-revisable flag: §5.4.1's "faithfulness=supported items short-circuit the procedure per existing §5.4 framing" qualified with reference to §5.4.4 entry-criterion exception. §5.4.1 revision is forward-pointer-update only (no substantive change to §5.4.1's positive paragraph-scope methodology codification).

**Triggered by:** dev-20 Concern B (claim-nussbaum-1985-061, 2026-04-29) + dev-23/24 strengthened evidence (cumulative 6-case faithfulness=supported-accommodation pattern through dev-24). Audit performs per-case disposition rendering across the 6 cumulative cases + aggregate-finding standing rule. Codified at item-25b sub-session B.5 (2026-05-02; bundled with B.4 §5.4.4 entry-criterion per criterion (ii) interdependence).

#### 5.4.6 §5.4 step-4 sub-pattern taxonomy

§5.4 step 4 (PL:paraphrase-distortion firing) classifies paraphrase-vs-source divergence per a 3-sub-pattern taxonomy. Each sub-pattern has trigger criteria and disposition (FIRE / NON-FIRE). Sub-pattern (b) has internal directionality-variant taxonomy. Sub-pattern (c) is an umbrella covering three named frame-collapse variants.

**Sub-pattern (a) anaphoric-resolution-substitute (NON-FIRE).** Paraphrase elements that surface as new-referent-introduction at quote-field scope resolve via preceding-sentence anaphora within the source paragraph. NON-FIRE-licensing scope is paragraph-bounded per §5.4.2 boundary rule (chapter-arc-scope antecedents do NOT license sub-pattern (a) NON-FIRE). Empirical: dev-11/13/15 full non-fires + dev-18 mixed-case partial non-fire on `experienced user` + `virtual reality` elements.

**Sub-pattern (b) new-referent-introduction (FIRE).** Paraphrase introduces a referent not present in or inferrable from the source paragraph. Two quantification variants:

- **(b-single)** — new referent introduced on a single element
- **(b-multiple)** — new referents introduced on multiple elements where none resolve via preceding-sentence anaphora (theoretical category; no genuine dev-set instance through dev-24; preserved per dev-18 Q5 pending-instances disposition; if no genuine instances by dev-50 dev annotation completes, deprecation candidate at next §8.2 cycle)

**Sub-pattern (b-single) directionality-variant taxonomy.** Within sub-pattern (b-single), three directionality variants are distinguished by how the new referent shifts source-claim semantics:

- **(1) STRENGTHENING** — claim makes source-claim stronger via predicate-shift. Empirical: dev-14 'any further depiction' → 'fails to provide' (claim-frede-1992-030).
- **(2) WEAKENING** — claim makes source-claim weaker via predicate-shift. Empirical: dev-18 'will know' → 'form accurate beliefs that' (claim-chalmers-2016-218; knowledge ⊃ accurate-belief; entailment direction).
- **(3) DISAMBIGUATION** — claim clarifies implicit-subject of source-claim without semantic shift; neither weakens nor strengthens. Empirical: dev-23 'animals that have it' qualifier on 'sense is always present' temporal-modal predicate (claim-aristotle-da-3.3-036).

Trigger criteria distinguish variants at codification time: (1) STRENGTHENING + (2) WEAKENING share predicate-shift directionality (entailment-direction analysis identifies which); (3) DISAMBIGUATION trigger criterion is clarifying-without-semantic-shift (dialectical-refutation logic / argumentative-target holds either way; the qualifier merely makes implicit-subject explicit). Brief-criteria framing per annotator-discretionary (B.4+B.5 precedent); detailed per-variant trigger algorithms premature pre-deprecation-or-promotion of (b-multiple). All three variants FIRE §5.4 step 4; directionality classification informs rationale framing not disposition.

**Sub-pattern (c) selective-representation-via-frame-collapse (FIRE; umbrella with three named variants).** Paraphrase strips substantive content via frame-collapse — extracting subordinate or coordinate clause as standalone content while dropping the framing structure. Three named variants share dispositive mechanism (selective-representation through clause-stripping while preserving substantive content); grammatical distinction (subordinate vs coordinate) operates at sub-variant level not sub-pattern level.

- **(c-conditional)** — subordinating conditional protasis-collapse (e.g., 'if/insofar as' subordinating conjunction stripped). Empirical: dev-16 (claim-heidegger-bcap-094) — Heidegger BCAP conditional-frame collapse.
- **(c-causal)** — subordinating causal-clause collapse (e.g., 'because' subordinating conjunction stripped; subordinate causal-clause extracted as standalone thesis). Empirical: dev-21 (claim-aristotle-da-3.3-063) — Aristotle's similarity/persistence causal frame collapsed.
- **(c-parallel)** — coordinate-parallel appositive-clause drop (e.g., ', to cover one obscurantist move with another' coordinate-parallel appositive stripped). Empirical: dev-22 (claim-horgan-1993-136) — Schiffer reductio's coordinate-parallel obscurantist-characterization stripped.

**Umbrella vs split decision (current).** Sub-pattern (c) is codified as UMBRELLA with three named variants per dev-22 Concern D split-criterion (split warranted if any single variant accumulates to n≥3). Cumulative state through dev-24: c-conditional n=1 / c-causal n=1 / c-parallel n=1 — criterion not met; umbrella appropriate. Each variant tracks separately in pattern-watch; if any variant reaches n=3 cumulative across dev-set work, split-decision revisits at next §8.2 cycle.

**Pattern-watch maintenance protocol.** Pattern-watch §5.4-step-4-trigger-criteria-sub-pattern-emergence continues at umbrella-level (cumulative §5.4 step-4 fires); per-variant attribution recorded in observation entries. Per-variant cumulative state visible via drift-log inspection. If any single variant reaches n=3 cumulative across dev-set work, split-decision revisits per §5.4.6 (c) umbrella criterion at next §8.2 cycle.

**Cross-reference to §5.4.7 paraphrase-modifications taxonomy.** §5.4.6 sub-pattern taxonomy classifies §5.4 step-4 DISPOSITION (FIRE/NON-FIRE + sub-pattern); §5.4.7 paraphrase-modifications taxonomy classifies the underlying MECHANISM (what paraphrase did to the source). The two taxonomies are orthogonal:

- Sub-pattern (a) NON-FIRE may co-occur with mechanisms #1 (substitution), #3 (omission), #7 (rhetorical-frame stripping) when the modifications accommodate without introducing new referents.
- Sub-pattern (b-single) FIRE typically involves mechanisms #1-4 (substitution, addition, omission, modal-shift) producing new-referent-introduction effect.
- Sub-pattern (c) variants map 1:1 to mechanisms #5 (causal-frame-collapse → c-causal) and #6 (parallel-clause-drop → c-parallel); mechanism #5+#6 are the mechanisms IMPLEMENTING the c-causal/c-parallel variants. c-conditional has no exclusive mechanism currently enumerated in §5.4.7 (see §5.4.7 cautious-gap note).

The orthogonality means §5.4 step 4 classifies disposition while paraphrase-modifications taxonomy classifies mechanism; disposition classification need not enumerate all mechanisms (mechanisms #7+#8 had NON-FIRE outcome at dev-24 demonstrating mechanisms can fire without sub-pattern classifying to FIRE).

**Empirical case mapping.** Cumulative §5.4 step-4 fires through dev-24: n=7 (dev-4 + dev-14 strengthening + dev-16 c-conditional + dev-18 b-single mixed weakening + dev-21 c-causal + dev-22 c-parallel + dev-23 b-single disambiguation). Pattern-watch §5.4-step-4-trigger-criteria-sub-pattern-emergence: n=9 (cumulative tracking).

**Triggered by:** B.3 — dev-21 Decision 19 (c-causal first variant) + dev-22 Decision 22 (c-parallel second variant; (c) umbrella confirmed with three named variants); B.6 — dev-23 Entry C (DISAMBIGUATION third directionality variant within sub-pattern (b-single)). Sub-pattern taxonomy formalization integrates B.3 umbrella RATIFY + B.6 directionality variants per Phase 4 plan REFINE-with-criterion-formalization disposition. Codified at item-25b sub-session B.3+B.6+B.8 triple-bundle (2026-05-02; criterion (i) thematic coherence per (γ) plan).

#### 5.4.7 Paraphrase-modifications taxonomy

The paraphrase-modifications taxonomy classifies what the extractor's paraphrase did to source content. The taxonomy is orthogonal to the §5.4.6 sub-pattern taxonomy: paraphrase-modifications classify the MECHANISM (what was modified); sub-patterns classify the §5.4 step-4 DISPOSITION (FIRE/NON-FIRE per the modification's effect on referent introduction or content stripping). The taxonomy is referenced from §5.4.4 entry-criterion (substantive-vs-trivial threshold for paraphrase-modification-detection exception in faithfulness=supported items).

**Eight-mechanism taxonomy.** Cumulative through dev-24:

| # | Mechanism | Definition | Empirical case |
|---|---|---|---|
| 1 | PARAPHRASE-SUBSTITUTION | Source word replaced by paraphrase synonym; both in or near ontology | dev-17 'specific'←'particular' (claim-bowin-2017-129; both gloss καθ' ἕκαστον) |
| 2 | PARAPHRASE-ADDITION | Paraphrase adds modifier not in source quote, sourced from chapter-arc context | dev-20 'pictorial' added to 'image-theory' (claim-nussbaum-1985-061; anaphoric reference 'image-theory as I have described it') |
| 3 | PARAPHRASE-OMISSION | Paraphrase drops qualification or content present in source | dev-19 comparative-framing drop (claim-nussbaum-1985-077; 'always true, while imaginations are mostly false' qualification) |
| 4 | PARAPHRASE-MODAL-SHIFT | Paraphrase shifts modal force | dev-20 'may use'←'does depend rather heavily on' (claim-nussbaum-1985-061; modal force weakened) |
| 5 | PARAPHRASE-CAUSAL-FRAME-COLLAPSE | Subordinating causal conjunction + principal consequent stripped; subordinate causal-clause extracted as standalone thesis | dev-21 (claim-aristotle-da-3.3-063); maps 1:1 to §5.4.6 sub-pattern (c-causal) |
| 6 | PARAPHRASE-PARALLEL-CLAUSE-DROP | Coordinate-parallel appositive clause stripped; substantive characterization-content stripped while primary thesis-content preserved | dev-22 (claim-horgan-1993-136); maps 1:1 to §5.4.6 sub-pattern (c-parallel) |
| 7 | PARAPHRASE-RHETORICAL-FRAME-STRIPPING | Transitional/meta-discursive/topic-introduction scaffolding removed without semantic shift in core content | dev-22+24 cumulative n=2 (claim-horgan-1993-136 'On the contrary, invoking [...]' + claim-aristotle-da-3.3-066 'Turning now to') |
| 8 | PARAPHRASE-PRESUPPOSITION-TO-ASSERTION CONVERSION | Source presupposes existence via topic-introduction-presupposition grammar; claim makes EXPLICIT as existential-thetic assertion | dev-24 (claim-aristotle-da-3.3-066) |

**Per-mechanism §5.4-disposition implications.**

- **Mechanisms #1-4** (substitution / addition / omission / modal-shift): may produce sub-pattern (b-single) FIRE or NON-FIRE accommodation depending on substantive-vs-trivial threshold (per §5.4.4). Empirical: #1 dev-17 NON-FIRE, #2 dev-20 NON-FIRE, #3 dev-19 NON-FIRE, #4 dev-20 NON-FIRE; all four cleanly accommodated in faithfulness=supported items.
- **Mechanisms #5-6** (causal-frame-collapse / parallel-clause-drop): map 1:1 to §5.4.6 sub-pattern (c) variants (c-causal / c-parallel). Empirical: #5 dev-21 FIRE, #6 dev-22 FIRE; both fired §5.4 step 4 per §5.4.4 paraphrase-modification-detection exception (despite faithfulness=supported flag).
- **Mechanism #7** (rhetorical-frame stripping): typically NON-FIRE accommodation (transitional scaffolding removal does not introduce new referents or strip substantive content). Empirical: dev-22 folded into c-parallel for that commit per Concern A; dev-24 standalone NON-FIRE per dev-19 omission precedent.
- **Mechanism #8** (presupposition-to-assertion conversion): typically NON-FIRE accommodation (grammatical mode shift without semantic shift). Empirical: dev-24 NON-FIRE per faithfulness=supported short-circuit.

**Substantive-vs-trivial determination is annotator-discretionary** per §5.4.4. Mechanisms alone do not predict disposition — the paraphrase-modifications taxonomy classifies the MECHANISM applied; whether the mechanism's substantive impact warrants §5.4 invocation requires per-instance judgment. Reference cases above provide empirical anchors for similar future cases.

**Coordination with §5.4.6 sub-pattern taxonomy.** The two taxonomies operate in parallel: an annotator detects paraphrase-modifications (this taxonomy) and classifies §5.4 step-4 disposition (§5.4.6 sub-pattern). The coordination is most direct for mechanisms #5+#6 which map 1:1 to (c-causal)/(c-parallel) variants; less direct for mechanisms #1-4 which may produce sub-pattern (b-single) FIRE or sub-pattern (a) NON-FIRE accommodation; mechanisms #7+#8 typically short-circuit at faithfulness=supported entry-criterion (§5.4.4). Bidirectional orthogonality codification (this section + §5.4.6 cross-reference paragraph) preserves discoverability per documentation-symmetry principle (B.2+B.7 codification precedent).

**Cautious-gap note: §5.4.6 sub-pattern (c-conditional) mechanism enumeration.** §5.4.6 sub-pattern (c-conditional) variant (dev-16 evidence) operates via subordinating-conditional collapse mechanism not enumerated in this 8-mechanism taxonomy. The mechanism is empirically demonstrated but has not been formally enumerated as mechanism #9 because the structural-parallel-to-mechanism #5 codification decision requires more empirical evidence (dev-16 single instance insufficient for mechanism-level codification). If future cycles surface additional conditional-frame-collapse instances, mechanism #9 codification at next §8.2 cycle.

**Triggered by:** dev-17 + dev-19 + dev-20 cumulative emergence (drift-log 2026-04-29 Entry F dev-20 4-mechanism taxonomy) → dev-21 Entry G 5-mechanism extension → dev-22 Entry G 6-mechanism extension → dev-24 Entry F 7-mechanism + Entry G 8-mechanism extension. CONVENTIONS codification consolidates drift-log STANDING records into formal taxonomy. Codified at item-25b sub-session B.3+B.6+B.8 triple-bundle (2026-05-02; criterion (i) thematic coherence per (γ) plan; bundled with B.3 sub-pattern taxonomy + B.6 directionality variants per Protocol 3 coordination).

### 5.5 Cluster-spanning-slug naming convention

Corpus extraction units (identified by source-data slug, e.g., `aristotle-da-3.3`) may span multiple canonical chapters of the source work under a single slug. The slug name reflects the topical-anchor chapter — typically the chapter where the discussion most central to the extraction unit's thematic focus resides — rather than indicating cross-chapter span. Cluster numbering (e.g., `claim-aristotle-da-3.3-001` through `claim-aristotle-da-3.3-080`) is continuous across chapter boundaries within the extraction unit.

**Source-data interpretation rule.** When a claim_id slug-prefix references a chapter that does not match the substantive chapter-attribution of the source quote (verifiable by consulting Bekker provenance against canonical chapter boundaries), this is NOT a source-data integrity error. The slug-prefix preserves the corpus extraction-unit identifier; substantive chapter-attribution is determined by the claim's `nearby_provenance` field cross-referenced against canonical chapter boundaries.

**Annotation methodology rule (chapter-arc-context-check).** When chapter-arc-context-check methodology is applied to a cluster that spans chapter boundaries within a single extraction unit, the cluster framing must reference the actual Bekker chapter break (not the slug-prefix-implied chapter). Argumentative-arc context spans the full cluster scope, but chapter-attribution of individual claims is determined by Bekker provenance per the source-data interpretation rule above. Future cross-chapter claims surfaced during annotation work are documented in the annotation rationale + notes fields with explicit Bekker chapter-attribution when methodologically significant — including but not limited to: (i) when chapter-arc-context-check methodology spans chapter boundaries; (ii) when other methodology references the cross-chapter span; (iii) when slug-prefix-based assumptions could mislead future annotators.

**Verification recipe** (for confirming whether a claim's slug-prefix matches its substantive chapter-attribution):

```bash
# Identify Bekker provenance range within an extraction unit
jq -r '.nearby_provenance' data/corpus/index/<extraction-unit-slug>/claims.jsonl | sort -u

# Cross-reference against canonical chapter boundaries from authoritative source
# (e.g., a Bekker reference table or scholarly edition); claims at provenance values
# falling outside the slug-prefix-implied chapter range are cross-chapter cluster members
```

**Triggered by:** dev-21 + dev-24 cross-chapter cluster phenomenon (chunk `primary-p44-p44` cluster 060–080 spans DA 3.3 + DA 3.4 per Bekker range 427a1 → 429b1; dev-21 commit applied cluster framing without recognition of cross-chapter span; dev-24 Procedural Flag surfaced the convention via screenshot evidence at `claim-aristotle-da-3.3-066` source quote opening DA 3.4 — "Turning now to the part of the soul..."). Investigation confirmed the corpus extraction unit `aristotle-da-3.3` covers Bekker range 427a1 → 429b1, spanning DA 3.3 (427b14–429a9) + DA 3.4 (429a10–430a9). Cluster 060–065 is DA 3.3 phantasia-introduction; cluster 066–077 is DA 3.4 noetic-faculty discussion opening. NOT source-data integrity error; cluster-spanning convention is operative. Codified at item-25a sub-session A.3 (2026-05-01) per Path C Phase 4 decomposition plan.

### 5.6 Chapter-arc-context-check methodology

When labeling a claim, the proposed label set may depend on understanding the claim's role in a larger argumentative arc — the surrounding cluster of claims that establish the source text's dialectical, definitional, or evidential structure. Chapter-arc-context-check is the methodology of inspecting this surrounding arc to inform label-fire / label-skip decisions.

**Two-tier framework.**

**BCAP tier (STANDING DISCIPLINE — mandatory application).** Big Concept Aristotle Primary claims (Heidegger-BCAP claim slugs `heidegger-bcap-*` per current corpus) require chapter-arc-context-check on every claim. The mandatory tier was established at dev-8 pattern-watch and confirmed by dev-7/dev-8/dev-11/dev-16 BCAP applications (cumulative n=4). Triggered by recognition that BCAP claims are passages from extended Heidegger arguments where isolated-claim labeling without arc-context routinely produces wrong-context-rich-canonical errors per dev-7 commit precedent.

**Non-BCAP tier (DISCRETIONARY application — trigger-criteria specified below).** Non-BCAP claims (primary-Aristotle and all secondary-author claims) apply chapter-arc-context-check discretionarily when one or more of the trigger criteria below holds. Pattern-watch `chapter-arc-check-substantive-refinement-on-non-BCAP` tracks substantive refinements cumulatively across non-BCAP applications. Established at dev-12 pattern-watch escalation after dev-10 non-BCAP application produced substantive refinement; cumulative pattern-watch state through dev-24: n=16 with 13 substantive refinements (high yield rate).

**Discretionary trigger criteria for non-BCAP applications.** Single sufficient condition triggers application (disjunctive criteria):

(a) **Cluster-context required for resolution** — the claim's proposed labels depend on understanding the surrounding cluster of claims (e.g., dialectical-refutation series; multi-claim argument; analogical-target chain). Most common trigger (9 cases through dev-24).

(b) **§5.4 paragraph-scope methodology engaged** — when §5.4 partial-faithfulness verification requires paragraph-scope context (per §5.4 + dev-18 Entry E paragraph-scope methodology). Arc-context-check provides the paragraph-scope grounding (5 cases through dev-24).

(c) **Faithfulness=partial flag on the claim** — when extractor flags `_candidate_metadata.faithfulness: "partial"`, arc-context-check verifies proposed labels against the claim's arc position rather than relying on paraphrase-only labeling. Frequently co-occurs with criteria (a) or (b) (8 cases through dev-24).

(d) **Cross-chapter cluster spans** — when slug-prefix and substantive chapter-attribution diverge per §5.5 cluster-spanning-slug naming convention; arc-context-check informed by actual Bekker chapter break rather than slug-prefix-implied chapter (4 cases through dev-24: dev-21/22/23/24).

(e) **Argumentative-arc-dependent label-disposition (catch-all)** — applies when the proposer cannot confidently render label-fire / skip decisions without arc-context inspection AND the case does not cleanly map to criteria (a)–(d). This catch-all preserves discretionary application for cases that are genuinely arc-context-dependent but don't fit the four specific trigger patterns. Use sparingly: if (e) recurs frequently, the empirical pattern may indicate a missing specific criterion that warrants codification at the next §8.2 every-25-items cycle.

**Substantive refinement (definition for pattern-watch counting).** A substantive refinement is a label-set or rationale change that meaningfully differs from the arc-blind labeling — e.g., a label added or skipped per arc-context; rationale framing materially changed; sub-pattern fire reclassified. Trivial wording adjustments without disposition impact are NOT substantive refinements. Pattern-watch counting follows §8.0 / §8.4 existing infrastructure; "substantive refinement" determination is annotator-discretionary per the discretionary-application nature of the methodology.

**Application produces drift-log pattern-watch / observation entries.** Substantive refinements are recorded as `observation — chapter-arc-check-substantive-refinement-on-non-BCAP` drift-log Type B pattern-watch-subtype entries; cumulative count is the pattern-watch trigger count per §8.0.

**Cross-references.**

- **§5.4 partial-faithfulness verification** engages arc-context per criterion (b) above.
- **§5.4.2 paragraph-vs-chapter-arc-scope boundary (reciprocal)** — arc-context-check (when applied per criterion (b)) does NOT cross-license §5.4 sub-pattern (a) NON-FIRE; chapter-arc-anaphoric antecedents do not extend §5.4 paragraph-scope per §5.4.2 boundary rule.
- **§5.4.3 cluster-vs-paragraph-scope methodology (reciprocal)** — arc-context-check informs claim-level rationale framing but does NOT compensate for individual-claim §5.4 fires per §5.4.3 claim-level rule.
- **§5.5 cluster-spanning-slug naming convention** specifies that arc-context references the actual Bekker chapter break for cross-chapter clusters per criterion (d).
- **§7.6 codification-decomposition framework** references this methodology as one of the review-protocols underlying per-decision review pattern.
- **§8.5 open-questions review discipline** — Arc-context-check applications surface during proposal review as Q-entries or Concern entries per §8.5 Format A. Pattern-watch n updates are typically Q-entries (e.g., "Q: chapter-arc-check applied; pattern-watch n=N→N+1"); substantive refinements producing label-set changes are typically Q-entries with disposition explanation; trigger-criteria recognition (e.g., "Concern A — criterion (a) cluster-context required for resolution") may surface as Concern entries.

**Triggered by:** dev-10 first non-BCAP discretionary application → dev-12 pattern-watch escalation (formalized escalated-pattern-watch as the tracking structure for non-BCAP applications) → dev-14/16/17/19/20/21/22/23/24 cumulative substantive refinements (n=16 total with 13 substantive refinements through dev-24). RATIFY-WITH-MINOR-REFINE per Path C Phase 4 plan: existing two-tier framework ratified; discretionary-trigger-criteria formalized from informal practice into 5 explicit criteria per empirical pattern observed across dev-7 through dev-24. Codified at item-25a sub-session C.1 (2026-05-01).

**Empirical-pattern caveat.** The 4 specific trigger criteria (a)–(d) are codified per dev-7 through dev-24 empirical pattern; criterion (e) catch-all preserves room for legitimate discretionary applications outside specific criteria. Future codification cycles (per §8.2 every-25-items framework) may extend criteria taxonomy if (e) usage pattern reveals additional trigger types warranting specific codification.

---

## 6. Validator

`scripts/validate-gold-notes.sh` enforces mechanical conventions. Day-one scope:

| Check | Violation |
|---|---|
| Em-dash character | `--`, single-hyphen ` - `, en-dash `–`, horizontal bar `―` where `—` (U+2014) is required |
| Em-dash padding | Exactly one space on each side of `—` in flag-block position |
| Pipe padding | Exactly one space on each side of `\|` when used as compound-flag separator |
| Sentinel brackets | `BEGIN`/`END` HTML-comment markers bracketing any auto-generated region in CONVENTIONS.md must pair with matching labels (see §5.3 for the single instance currently in use) |

**Failing validator = hard block on commit.** No quarantine file; fix in place before commit.

**Output format (day-one minimum):** `file:line — one-line violation description`.
Structured found-vs-expected-vs-fix format is deferred to item 50 or first non-self annotator (see §9).

**Triggered by:** fragility analysis during spec iteration; typographic drift (`--`, `–`) is validator-checkable and silent failure without it is high.

---

## 7. Governance

### 7.1 Adding a new AF code (promotion from parking lot)

Required conditions — all three:

1. **≥3 instances** of the pattern exist in committed annotations (check via `grep -c "PL:<pattern-name>" data/gold/*.jsonl`).
2. **Back-sweep, required not optional.** All prior prose-described or `PL:`-flagged instances of the pattern are converted to the new `AF` code in a single commit accompanying the CONVENTIONS.md edit. Partial back-sweeps are not permitted.
3. **CONVENTIONS edit** adds the new code with full slot semantics, trigger rule, example, non-example, and `Triggered by:` line citing the three (or more) instances that drove promotion.

**Umbrella consolidation.** Before promoting a PL pattern to an AF code, consider whether related PL patterns (e.g., `ontology-synonymy` and `object-of-type-canonicalization` as sibling denotation-collapsing cases) suggest a shared umbrella pattern that would warrant a single AF code covering both, rather than two separate sibling codes that would later need merging under a subsequent promotion sweep.

**Triggered by:** recognition during spec iteration that optional back-sweeps accumulate mixed-convention dreck at scale and are the single largest source of unmaintainable annotation corpora; umbrella-consolidation was added 2026-04-22 after item-058 surfaced two sibling patterns (`ontology-synonymy`, `object-of-type-canonicalization`) that may share an umbrella not yet named.

### 7.2 Removing a rule

A rule marked `Prospective` that has not triggered within its reconsideration horizon is eligible for removal. Removal requires a commit citing the horizon-expiration and a grep sweep confirming zero committed uses.

### 7.3 Rule trigger citation

Every rule added to CONVENTIONS.md carries a `Triggered by:` line identifying the concrete case or spec-iteration argument that motivated it. Prospective rules additionally carry an expected trigger condition and a reconsideration horizon. No rule is added without a citation.

### 7.4 Standing-rule-vs-candidate status tracking

Annotation rules surface in two ways: codified directly into CONVENTIONS via §7.1 / §7.2 / §7.3 governance, or registered during annotation as candidates pending codification at the next §8.1 item-25 convention-validation checkpoint or §8.2 every-25-items drift check. Without explicit status-tracking, candidates drift into provisional standing through repeated mid-cycle application — a failure mode named at item-23 (dev-23 drift-log entry F: "premature application of item-25 codification candidates as standing rules"). This section codifies the status-tracking protocol that distinguishes the two and gates application accordingly.

**Status taxonomy (5 statuses):**

| Status | Definition | Application protocol |
|---|---|---|
| **STANDING RULE** | Codified via prior CONVENTIONS edit (§7.1 promotion, §7.2 removal, or general §7.3 trigger-cited addition) OR explicit decision-lock recorded in drift-log Type B CONVENTIONS-edit entry. | Apply directly in annotation work without flag. Cite per §7.3 trigger citation when the rule's application is non-obvious. |
| **ITEM-25 CANDIDATE** | Registered for future codification at the next §8.1 item-25 convention-validation checkpoint or §8.2 every-25-items drift check, but NOT yet codified as standing rule. Lives in §7.5 candidate registry. | Do NOT apply as if standing rule. May inform observation-tracking and pattern-watch counting (§8.0) but does not justify labeling decisions on its own. |
| **PROVISIONAL APPLICATION** | An item-25 candidate applied provisionally for a specific labeling decision because no standing rule covers the case AND deferring would block annotation. | Annotation rationale MUST include conditional-application flag (format below). Subject to retroactive-review at next codification cycle (§8.1 or §8.2). |
| **DEPRECATED** | Rule formerly considered (as candidate, provisional standing, or §7.2-eligible standing rule) but rejected at codification. | Do not apply. Recorded with rejection rationale in drift-log Type B entry citing the codification cycle that rejected it. |
| **DEFERRED-POST-ITEM-25** | Codification candidate explicitly deferred beyond the current codification cycle to a later cycle (per §8.2 every-25-items framework: items 50, 75, etc.). | Do not apply as standing rule. May be re-evaluated at next §8.2 checkpoint. |

**Conditional-application flag format (mandatory for PROVISIONAL APPLICATION status):**

Annotation rationale must include exactly:

```
[item-25 candidate: <candidate-name>; provisional application until next codification cycle]
```

Where `<candidate-name>` references the registered candidate name in §7.5 candidate registry. Flag scope is the specific labeling decision in that annotation; broader provisional applications require separate flags per decision.

**Retroactive-application rule.** When a §8.1 item-25 codification cycle codifies the standing-rule-vs-candidate status tracking protocol, prior provisional applications (those made before the protocol was codified) are subject to retroactive review:

(a) Identify all provisional fires made between protocol-establishment-trigger (the drift-log entry that first named the protocol; for the initial codification this is the dev-23 Concern B procedural-protocol entry) and protocol-codification (the §7.4 codification entry).

(b) For each, render disposition: **PRESERVE-WITH-FLAG** (apply conditional-application flag retroactively to the prior annotation rationale via drift-log addendum entry); **REVISE** (modify disposition to align with codified protocol via re-annotation entry); **REVERT** (undo provisional application as if SKIP applied originally via re-annotation entry).

(c) Document retroactive dispositions in drift-log codification record entry per the codification sub-session that processes them. Subsequent codification sub-sessions that depend on retroactively-reviewed candidates open with explicit reconciliation referencing the disposition handoff (per Path C Phase 4 coordination protocol).

**Audit window for retroactive-review.** All provisional applications of uncodified item-25 candidates made BEFORE the codification cycle that codifies the relevant standing rule. The audit identifies provisional fires by tracing back through drift-log entries from the codification commit to identify candidates applied without standing-rule basis.

**Audit scope.** Provisional applications are fires that applied uncodified candidates (extensions beyond original codified rule scope) — fires that applied standing rules within their codified scope are NOT in audit scope, even if the standing rule itself is later refined.

**Retroactive flag storage location.** For retroactive flag application, the flag is documented in drift-log retroactive-review-disposition-handoff entry; JSONL annotation rationale fields are NOT modified retroactively to preserve commit-history integrity.

**Codification-decomposition framework.** See §7.6 for the framework codification. Item-25 codification cycles may decompose into multiple sub-sessions when codification load exceeds single-session capacity; decomposition trigger criteria, phase structure, and cross-sub-session coordination protocol are codified at §7.6.

**Triggered by:** dev-23 Entry F drift-log codification of Concern B procedural protocol — recognition that mid-cycle codification candidates were operating as de-facto standing rules without explicit status-tracking, producing two concrete labeling-decision divergences (dev-23 `presence` SKIP and dev-24 `knowledge` SKIP) that demonstrated the absence of a codified protocol was producing real annotation impact rather than abstract concern. Codified at item-25a sub-session (2026-05-01) per Path C Phase 4 decomposition plan. Audit-window / audit-scope / retroactive-flag-storage subsections added at item-25a sub-session A.2 (2026-05-01) to close §7.4 specification gaps surfaced by retroactive-review of dev-21 + dev-22 provisional fires; closes Q1+Q3+Q4 from A.2 sub-session deliverable review.

### 7.5 Item-25 candidate registry

Maintained list of all active item-25 codification candidates with status, evidentiary basis, registration trigger, and sub-cluster classification. Updated on candidate registration (per drift-log Type B observation entry that introduces a new candidate) and at each item-25 codification sub-session (status updates as candidates resolve).

**Table structure:**

| Candidate name | Status | Trigger commit | Evidence count (n) | Last update | Sub-cluster |
|---|---|---|---|---|---|
| standing-rule-vs-candidate-status-tracking | STANDING RULE | dev-23 Entry F | 2 (dev-23 `presence` SKIP + dev-24 `knowledge` SKIP concrete impacts) | 2026-05-01 | A |
| retroactive-review-of-provisional-fires (audit operation per §7.4 retroactive-application rule; not new rule codification) | STANDING RULE (audit completed; rule-status reflects §7.4 retroactive-application rule's standing-status) | dev-23 Entry F + dev-24 Entry E | 2 fires reviewed (dev-21 resemblance + dev-22 multi-cross-author) | 2026-05-01 | A |
| cluster-spanning-slug-naming-convention | STANDING RULE | dev-24 Procedural Flag | 1 (dev-21 + dev-24 cross-chapter cluster phenomenon) | 2026-05-01 | A |
| codification-decomposition-framework | STANDING RULE | dev-23 Concern D / dev-24 Concern D | 1 (item-25 cycle itself) | 2026-05-01 | A |
| open-questions-discipline-format-specification | ITEM-25 CANDIDATE | dev-22 Concern B / dev-23+24 continuation | 4 (dev-21 PUSHBACK + dev-22+23+24 explicit format) | 2026-05-01 | A |
| §5.4-paragraph-scope-methodology-formalization | STANDING RULE | dev-18 Entry E (Decision 10) | 5 (dev-18 establishment + dev-21/22/23/24 applications: 4 fires + 1 NON-FIRE) | 2026-05-02 | B |
| sub-pattern-(a)-paragraph-vs-chapter-arc-scope-boundary | STANDING RULE | dev-23 Q1/Concern C | 1 (dev-23 evidentiary case; n=1 sufficient for negative-boundary codification) | 2026-05-02 | B |
| sub-pattern-(c)-umbrella-vs-split-decision | STANDING RULE | dev-21 Decision 19 / dev-22 Decision 22 | 3 variants (c-conditional dev-16 + c-causal dev-21 + c-parallel dev-22; each at n=1; umbrella RATIFIED per dev-22 Concern D split-criterion not met at n≥3 threshold) | 2026-05-02 | B |
| faithfulness-partial-vs-supported-§5.4-entry-criterion | STANDING RULE | dev-23 Q1 (first faithfulness=partial) | 2 (entry-criterion default + paraphrase-modification-detection exception; cumulative empirical: dev-23 partial-fire + 6 supported-accommodation cases) | 2026-05-02 | B |
| faithfulness-supported-reliability-audit | STANDING RULE | dev-20 Concern B | 6 (dev-17 + dev-19 + dev-20 + dev-21 + dev-22 + dev-24 supported-accommodation cumulative; 4 NON-FIRE accommodation + 2 EXCEPTION FIRED; reliability assessment SUPPORTED-AS-DEFAULT-PRIOR / NON-ABSOLUTE at 33% exception rate) | 2026-05-02 | B |
| DISAMBIGUATION-third-directionality-variant-(b-single) | STANDING RULE | dev-23 Entry C | 1 (dev-23 evidentiary case; codified within §5.4.6 sub-pattern (b-single) directionality-variant taxonomy alongside STRENGTHENING dev-14 + WEAKENING dev-18) | 2026-05-02 | B |
| cluster-level-vs-paragraph-scope-§5.4-verification-methodology | STANDING RULE | dev-22 Entry B Q1 | 1 (dev-22 evidentiary case; n=1 sufficient for negative-boundary codification) | 2026-05-02 | B |
| paraphrase-modifications-taxonomy-formalization | STANDING RULE | dev-17 + dev-19 + dev-20 → dev-22 → dev-24 | 8 mechanisms cumulative (substitution / addition / omission / modal-shift / causal-frame-collapse / parallel-clause-drop / rhetorical-frame stripping / presupposition-to-assertion conversion); codified at §5.4.7 with cautious-gap note for §5.4.6 (c-conditional) mechanism #9 candidate | 2026-05-02 | B |
| chapter-arc-check-standing-discipline-scope-extension | ITEM-25 CANDIDATE (provisional standing pending RATIFY-WITH-MINOR-REFINE at item-25a C.1) | dev-10 → dev-12 escalated | n=16 cumulative (13 substantive refinements through dev-24) | 2026-05-01 | C |
| AF5-type-(4)-sub-variant-taxonomy-split-decision | STANDING RULE | dev-15 Entry C / dev-19 Entry E | 9 cases distributed across 4 sub-variants within type-(4) umbrella (4a negation-without-X dev-15 / 4b concession dev-17 / 4c positive-thetic dev-18 + dev-21 + dev-22 + dev-24 / 4d explicit-but-contrast dev-19 + dev-20 + dev-23); umbrella retained per UMBRELLA-WITH-REFINED-TRIGGER disposition; trigger criterion refined to make {two-pole-explicit OR positive-thetic-single-pole} accommodation explicit per item-25c.1 C.2 codification | 2026-05-02 | C |
| AF4-load-bearing-modifier-tier-stratified-GENUINE-GAP-formalization | STANDING RULE | dev-9 → dev-19 Concern D → dev-21 Q5 | raw n=10 cumulative pattern-watch entries (dev-9/17/19/20/21/23 et al per drift-log running-count); verified n=4 GENUINE-GAP entries passing 4-criteria test (dev-19 Nussbaum reproductive + dev-20 + dev-21 remain + dev-23 always; all empirically classified secondary-author-introduced near-synonyms via type=="secondary-lit" derivation per item-25c.2 C.3 Concern A.1 v3 jq verification); tier-stratified GENUINE-GAP rule operative per dev-21 Q5 standing extended to within-tier same-author-introduced defeat predicate + cross-tier symmetric non-defeat (secondary-tier within-tier cross-author empirically anchored at dev-19 White 1985 + Papachristou 2013 non-defeat; primary-tier within-tier cross-author DEFERRED PROSPECTIVE per §1 with reconsideration horizon next §8.2 cycle / item-50); provenance derivation per compiled-index.json type field with primary-citation exclusion filter (corpus-extension-stable; replaces v2 hardcoded 22-author regex); verified-vs-raw pipeline + 4-criteria test codified per item-25c.2 C.3 codification; tertiary-tier under multi-cross-author scope deferred (zero dev-set AF4 fires through dev-24; SURFACE-DRIVEN-relevant only per dev-22 Entry C precedent) | 2026-05-02 | C |
| AF5-4-disposition-taxonomy-specification | STANDING RULE | dev-15 Entry C | 12 cases distributed across 4 types (type-(1) tight-fire holdout 033 + dev-12 / type-(2) loose-tracking dev-6 + dev-7 / type-(3) abstract-implicit-skip dev-13 + dev-14 + dev-19 + dev-20 / type-(4) no-elided-content-skip dev-15/17/18/19/20/21/22/23/24); type-(4) sub-variant split-decision deferred to item-25c.1 C.2 (4c past + 4d at split-threshold) | 2026-05-02 | C |
| SURFACE-DRIVEN-rule-scope-specification | STANDING RULE | dev-19 Decision 13 | three-tier surface framework codified at §3.3 (Tier (a) English surface → English-name rich node empirically anchored at holdout 049 perception → Perception jq-verified Aristotle Complete Works core; Tier (b) Greek-transliterated surface → thin Greek-transliterated node empirically anchored at dev-9 Frede phantasma + dev-14 Frede phantasia + dev-19 Nussbaum aisthesis+phantasia jq-verified phantasma=Frede 1992 / phantasia+aisthesis=Aristotle c. 350 BCE — node-attribution varies but operative criterion is surface-tier-driven not node-attribution; v3 correction retired dev-19 Entry F "thin author-vocabulary" framing per jq verification; Tier (c) Greek-glyph surface → English-name rich per §3.2 ontology-synonymy decided rule empirically anchored at dev-11 Λόγος → Logos); edge cases (plural-singular dev-21 sense organs / multi-cross-author dev-22 forward-deferred to D.5 standalone); cross-word boundary deferred to Bundle 2 D.3 cross-word-semantic-synonymy framework codification (SURFACE-DRIVEN-rule operates as one of 3 dispositions within D.3 scope); STANDING-since-dev-23 Entry F STANDING-RULES-APPLIED declaration; CONVENTIONS-codified at item-25d Bundle 1 sub-session post-HALT-pre-codification jq verification (5 tests fired; 2 corrections at v3; 3 confirmations); cumulative D.1 applications dev-19/20/21/22/23/24 across English/Greek-transliterated/Greek-glyph surface tiers | 2026-05-02 | D |
| Audi-031-nominalization-rule-extension | STANDING RULE | dev-21 (provisional fire) → dev-22 Entry H (formalization candidate) | Audi-031 nominalization extension codified at §3.4 within D.3 cross-word-semantic-synonymy framework as broader nominalization scope (verb→noun + adj→noun) per Pushback Q2.1 v2 path (b); fires under D.3 Disposition 1 (LABELED via §3.2 convention) for adj→noun secondary-author-introduced cases (dev-19 'accurate'→`accuracy` Nussbaum 1985 secondary-lit) and under D.3 Disposition 3 (verb→noun primary-tier same-author-introduced) for dev-21 'resemble'→`resemblance` (Aristotle c. 350 BCE primary-citation peripheral; jq-verified at Bundle 2); empirical grounding at two distinct levels per D.5 Q4 ground 3 distinction precedent — (i) anchor case verification dev-21 + dev-19 fires substantively correct per jq verification; (ii) rule empirical-groundedness n=3 cumulative FIRES (dev-18 + dev-19 + dev-21) sufficient for STANDING per principle-codification class + n=2 cumulative negative-boundary SKIPs (dev-23 'presence' + dev-24 'knowledge'/'knowing') reinforcing rule via §5.4.2 negative-boundary-codification precedent (distinct empirical-grounding type — scope-discipline establishment via in-scope-vs-out-of-scope distinction); A.2 FIRE #1 PRESERVE-WITH-FLAG SCOPE-COMPLICATION DOCUMENT-ONLY reconciliation closure (PHASE 0 HOLD outcome confirmed; PROVISIONAL APPLICATION → STANDING RULE; retroactive conditional-application flag drift-log line 508 superseded by D.2 STANDING RULE codification; A.2 reconciliation cycle COMPLETES at Bundle 2 — FIRE #2 closed at D.5; FIRE #1 closes here); CONVENTIONS-codified at item-25d Bundle 2 sub-session post-pre-codification jq operational test PASSED (5/5 anchor tests verified; no discrepancies; no HALT-pre-codification cycle) | 2026-05-02 | D |
| cross-word-semantic-synonymy-framework | STANDING RULE | dev-16 Entry D → dev-21 Entry D → dev-22 Entry D | 3-disposition framework codified at §3.4 — Disposition (1) LABELED-via-§3.2-cross-word-semantic-synonymy-convention (noun-noun anchor dev-16 'basic'↔`fundamental` Audi 2012 secondary-lit) + Disposition (2) FIRED-AS-PARAPHRASE-ARTIFACT-pattern-watch-escalation (adj-adj anchor dev-17 'specific'↔`particular` Frede 1992 secondary-lit; §5.4.7 mechanism (1) PARAPHRASE-SUBSTITUTION operative) + Disposition (3) SKIPPED-VIA-SURFACE-DRIVEN-RULE (verb-noun anchor dev-21 'remain'↔`persistence`+`endurance`+`enduring states` secondary-lit; SURFACE-DRIVEN per Bundle 1 D.1 three-tier framework + tier-stratified GENUINE-GAP per C.3 §AF4 joint disposition); cross-disposition interaction profiles NORMALIZED v2 with explicit positive/negative declarations across §3.2/§5.4/§AF4/§AF5/pattern-watch subsystems per Pushback Q1.1 (Disposition 3 §AF4 explicit-positive — joint disposition with C.3 at primary-author coverage gap when SURFACE-DRIVEN SKIP fires AND no primary-author-introduced near-synonym exists); Bundle 1 → Bundle 2 D.3 outbound handoff consumed (D.3 inherits D.1 three-tier framework + enumerates SURFACE-DRIVEN-as-disposition-3 within D.3 scope); §1-compliant Prospective deferral for predicates not empirically anchored (additional word-class-pairs adverb-verb/preposition-noun/verb-verb/adj-noun-beyond-Audi-031 + cumulative effects + disposition-precedence ordering) reconsideration horizon next §8.2 cycle / item-50; cycle-internal cross-codification edit second type per Concern G v2 (cross-reference pattern; D.3 references Bundle 1 §3.3 D.1 inline read-only inheritance; distinct from D.5 direct-edit pointer-text-replacement); CONVENTIONS-codified at item-25d Bundle 2 sub-session as second hierarchical-bundle landing under (γ) framework extension (parent framework + child instance D.2; pre-codification jq operational test PASSED at v1 — 5 tests run with no discrepancies; v2 pushback round 1 substantive narrowed to interaction profile normalization + D.2 broader nominalization scope + cumulative-instance-count distinction + section title parsimony) | 2026-05-02 | D |
| cross-author-collision-avoidance-sub-mechanism-distinction | STANDING RULE | dev-12 (collision-flag-firing) → dev-21 Entry E (surface-driven-disambiguation) | two-sub-mechanism framework codified at §3.3 — sub-mechanism (1) COLLISION-FLAG-FIRING (single ontology node carrying multiple author-senses; PL:cross-author-concept-collision flag fires per §3.2 row-criterion gate; empirical anchor dev-12 Kim-introduced supervenience covering Lloyd Morgan + Davidson author-senses with PL:cross-author-concept-collision firing on supervenience — v3 correction disambiguated PL:cross-author-concept-collision flag from AF5:reducibility orthogonal-flag per jq verification; v2 conflation retired) + sub-mechanism (2) SURFACE-DRIVEN-DISAMBIGUATION (surface-form-differentiated nodes; SURFACE-DRIVEN rule per D.1 governs label fire; empirical anchor dev-21 Aristotle plural sense organs vs Frede hyphenated singular sense-organ jq-verified); selection criterion (surface-form-distinct vs surface-form-identical-different-sense; mutual exclusion as derived consequence of criterion logic NOT stipulated rule per pushback Q2.1 path b); multi-cross-author scope forward-reference to D.5 standalone (dev-22 Entry C ternary scope PROVISIONAL APPLICATION → STANDING per D.5 codification); D.7 cross-reference text pre-staged at §3.3 D.4 sub-subsection (dev-12 collision-flag-firing doubles as citation-reported sub-mechanism precedent for D.7 reported-speech-provenance unification at Bundle 3); CONVENTIONS-codified at item-25d Bundle 1 sub-session | 2026-05-02 | D |
| multi-cross-author-SURFACE-DRIVEN-DISAMBIGUATION-considerations | STANDING RULE | dev-22 Entry C | clean scope-extension predicate codified at §3.3 D.4 sub-subsection — D.4 sub-mechanism (2) SURFACE-DRIVEN-DISAMBIGUATION extends from binary to multi-author single-claim scope when claim references surface-form-differentiated ontology nodes from ≥3 distinct authors (no ternary-specific predicate beyond binary; SURFACE-DRIVEN per D.1 governs pairwise; selection criterion D.4 applies pairwise across all cross-author-pairs); source-paper-author exact-match precedence operative under multi-cross-author scope as inheritance from D.4 + §3.2 ontology-synonymy made explicit (rule logically downstream of D.4 surface-form-drives-label-fire + §3.2 surface-form-is-operative-criterion; operates implicitly under binary scope; surfaced operationally at dev-22 multi-cross-author scope per Horgan partial-match case); empirical anchor n=1 dev-22 (claim-horgan-1993-136) ternary scope (Audi×2 + Kim×1 + Barnes×1 + same-paper Horgan partial-match) with 5 fired nodes jq-verified all type=secondary-lit (mystery Barnes 2012 + non-natural moral properties Kim 1990 + physical properties + supervenience Audi 2012 cross-authors + primitive relation Horgan 1993 source-paper-author); Horgan partial-match patterns (supervenience compounds + Moorean moral properties etc.) skipped per surface-form-driven precedence; §1-compliant Prospective deferral for higher-scope-specific predicates ((i) ≥quaternary scope (ii) per-author-weighting (iii) specific-author-count-threshold) reconsideration horizon next §8.2 cycle / item-50; pattern-watch sub-variant tagging within existing umbrella per item-25c.1 C.2 precedent (no separate pattern-watch establishment at n=1); orthogonal to C.3 tertiary-tier deferral (D.5 = label-selection level; C.3 = gap-affirmation level; subsystems share dev-22 evidence anchor but operate at distinct rule-surfaces); A.2 FIRE #2 PRESERVE-WITH-FLAG SCOPE-COMPLICATION DOCUMENT-ONLY reconciliation closure (PHASE 0 HOLD outcome confirmed; PROVISIONAL APPLICATION → STANDING RULE; retroactive conditional-application flag drift-log line 508 superseded by D.5 STANDING RULE codification); CONVENTIONS-codified at item-25d D.5 standalone sub-session post-pre-codification jq operational test PASSED (5/5 anchor nodes verified; no discrepancies; no HALT-pre-codification cycle) | 2026-05-02 | D |
| definitional-context-distinction | ITEM-25 CANDIDATE | dev-22 Entry D / Q3 | 1 (`bare supervenience` Horgan 1993 evidentiary case) | 2026-05-01 | D |
| reported-speech-provenance-unification | ITEM-25 CANDIDATE | dev-12 + dev-22 Entry I | 2 sub-mechanisms (citation-reported dev-12 + block-quote-reported dev-22) | 2026-05-01 | D |
| §7.1-load-bearing-modifier-promotion-decision | ITEM-25 CANDIDATE | dev-9 → dev-17 → dev-20 Concern C | raw n=10 / verified n=4 | 2026-05-01 | E |
| slug-graveyard-frede-cluster-handling | DEFERRED-POST-ITEM-25 | dev-9 → dev-14/19/20 | 4 informal extensions (dev-9 + dev-14 + dev-19 + dev-20) | 2026-05-01 | E |
| inflection-match-vs-nominalization-extension-distinction | ITEM-25 CANDIDATE | dev-24 Entry E | 1 (dev-24 `knowing` borderline case) | 2026-05-01 | E |
| §8.0-grep-vs-narrative-reconciliation-methodology | ITEM-25 CANDIDATE | dev-20 §8.0 trigger scan | 1 (chapter-arc-check n=12 narrative vs grep 10 variance) | 2026-05-01 | E |

Column specifications:

- **Candidate name** — short hyphenated descriptor matching drift-log middle-field convention (per §8.0 canonical middle-field format) where the candidate first surfaced.
- **Status** — one of the 5 statuses defined in §7.4 (STANDING RULE / ITEM-25 CANDIDATE / PROVISIONAL APPLICATION / DEPRECATED / DEFERRED-POST-ITEM-25).
- **Trigger commit** — the dev-N (or other commit identifier) where the candidate was first registered.
- **Evidence count (n)** — cumulative count of supporting instances across committed annotations and drift-log observation entries.
- **Last update** — date of most recent status change or evidence-count update.
- **Sub-cluster** — Phase 2 cluster classification (Cluster A procedural-meta / Cluster B §5.4 codification / Cluster C AF taxonomy / Cluster D ontology-rule / Cluster E tracker-cleanup) for codification-decomposition coordination.

**Triggered by:** §7.4 codification at item-25a sub-session — recognition that the §7.4 status-tracking protocol requires a centralized candidate registry to operate against, distinct from drift-log entries (which are chronological pointer-index per §8.4 Type B subtype distinction). Initial population deferred to item-25a sub-task A.4 (codification-decomposition framework) where the Phase 2 audit-derived 28 sub-tasks are entered into the registry. Population executed at item-25a sub-session A.4 (2026-05-01).

### 7.6 Codification-decomposition framework

Item-25 codification cycles (§8.1 item-25 convention-validation checkpoint) and §8.2 every-25-items drift checks may decompose into multiple sub-sessions when codification load exceeds single-session capacity. This section codifies the decomposition framework: when decomposition applies, what phases structure the work, and how cross-sub-session coordination preserves codification integrity.

**Decomposition trigger criteria.** Single-session execution is the default. Decomposition is warranted when one or more of the following conditions hold (disjunctive — any single criterion sufficient):

(a) **Sub-task count threshold** — codification load is ≥6 coordinated sub-tasks. Below this threshold, a single session can typically maintain coherent context; at or above it, working memory and dependency-tracking degrade.

(b) **Cross-cluster dependency density** — sub-tasks span multiple natural clusters (procedural-meta / methodology / ontology-rule / tracker-cleanup) with hard-dependency edges across clusters. Cluster-internal codification can usually fit single-session; cross-cluster coordination benefits from explicit inter-session handoffs.

(c) **High-stakes coordinated decisions** — codification includes decisions whose outcome substantively affects multiple downstream sub-tasks (e.g., split-decisions, status changes for provisional applications). High-stakes decisions warrant scoping-session-determined isolation rather than mid-session adjudication.

(d) **Retroactive-review obligations** — codification cycle includes retroactive-review of prior provisional applications per §7.4 retroactive-application rule. Retroactive-review results often produce sequencing-gates for downstream codification (e.g., a retroactive disposition handoff between item-Na and item-Nd within the same cycle); isolation in dedicated sub-session preserves discipline.

If none of (a)–(d) hold, single-session execution is appropriate.

**Decomposition phase structure.** When decomposition is triggered, the codification cycle proceeds through 7 phases:

1. **Anchor verification** — pre-cycle state checks (validator + holdout md5 + dev jsonl line count + drift-log entries + §8.1 counter + relevant backups + CONVENTIONS document location confirmation).

2. **Codification load audit** — systematic review of accumulated sub-tasks since the prior codification cycle. Per sub-task: trigger commit, current status (per §7.4 status taxonomy), evidentiary basis (n cumulative across committed annotations and drift-log entries), cross-sub-task dependencies (forward and backward).

3. **Dependency mapping** — dependency graph construction with hard / soft / parallel edges; provisional-standing-rule ratify-vs-refine assessment; cluster-level dependency analysis; critical-path codification order; cycle-dependency detection; parallelizable-sub-task identification.

4. **Decomposition decision** — final decomposition plan: sub-session count, sub-session order per critical path, per-sub-session specification (scope / sub-tasks / dependencies / ratify-vs-refine / artifacts / completion criteria / coordination handoffs), cross-sub-session coordination protocol formalization.

5. **Authorization** — explicit user authorization of decomposition plan before substantive codification work begins. Sub-session authorization gates apply at each sub-session boundary (each sub-session authorizes sequentially upon completion-record acceptance of prior sub-session).

6. **Decomposed session execution** — sub-sessions fire sequentially per dependency order. Within each sub-session: sub-session-specific anchor verification, per-codification-decision review pattern (proposal → review/pushback → confirm), codification artifacts produced (CONVENTIONS edits with §8.1 counter increments; drift-log codification record entries), sub-session completion record with explicit handoff to next sub-session.

7. **Resume** — after final sub-session, cumulative completion record produced; standing rules in effect; CONVENTIONS updated; drift-log codification record entries serve as future precedent; annotation work resumes with new codified framework.

**Per-decision review pattern within sub-sessions.** Each codification decision within a sub-session follows the proposal → review/pushback → confirm pattern that has served per-item review across the dev-set annotation cycle. Codification work does not bypass per-decision review just because it is codification rather than annotation. Each codification proposal surfaces explicit Q1–Qn open questions for review per the open-questions discipline.

**Codification artifact production.** Each codification decision produces:

- **CONVENTIONS edit** (when standing-rule codification is the action) — §8.1 counter increments per coordinated edit batch; bundled refinements that close multiple specification gaps count as single coordinated batch with single increment.

- **Drift-log Type B CONVENTIONS-edit-subtype entry** (per §8.4 template) when CONVENTIONS edit is applied; entry records date, §-section refs, trigger-by, summary, precedent chain, disposition.

- **Drift-log audit-handoff entry** when sub-task is audit-not-codification (e.g., retroactive-review per §7.4); §8.1 counter NOT incremented for audit-handoff entries. Audit-handoff entries use session-commit-record-style format: `YYYY-MM-DD | item-N<sub-session-id> sub-session <sub-task-id> | <handoff-name> | triggered by <trigger> | <content with handoff-format details>`.

- **Cross-sub-session coordination handoff** when forward-dependency exists (per coordination-protocol format below) — registered in the source sub-session's drift-log entry and consumed at the target sub-session's mandatory opening reconciliation.

**Cross-sub-session coordination protocol.** When decomposed codification produces handoffs between sub-sessions, coordination protocol entries specify:

- **Source sub-session** (origin) and **source sub-task** (the codification decision producing the handoff)
- **Target sub-session** and **target sub-task** (which downstream sub-session consumes the handoff)
- **Format specification** (what information transfers — e.g., per-fire retroactive-disposition handoff format with fields: identifier / substantive review / procedural review / retroactive disposition / downstream impact / target action required)
- **Mandatory-vs-optional consumption rule** (whether target sub-session must explicitly reference handoff before proceeding, vs informational reference only)
- **Escalation path** (e.g., HALT-FOR-USER-REVIEW when downstream codification surfaces complications not anticipated by handoff disposition)

This section codifies an abstract framework. Specific protocol templates (e.g., retroactive-disposition handoff format; reliability-audit handoff format) are case-specific to a given codification cycle's decomposition plan and emerge per cycle. If a protocol template recurs across multiple codification cycles, future codification may promote it to a named standing template; until then, protocol templates are documented in the cycle's drift-log entries and Phase 4 decomposition plan.

**Triggered by:** item-25 codification cycle (2026-04-30 / 2026-05-01) — cumulative item-25 codification load reached n=28 coordinated sub-tasks across 5 natural clusters per Phase 2 audit (item-25a sub-session A.1 / A.2 / A.3 codification work cumulatively confirmed n=28 sub-tasks via Phase 2 cluster-decomposition refinement). Single-session execution risk (Path A) was rejected per dev-23 Concern D / dev-24 Concern D framing; decomposition into 6 sub-sessions (item-25a / item-25b / item-25c.1 / item-25c.2 / item-25d / item-25e) was authorized per Path C plan with 7-phase scoping session preceding substantive codification work. This section formalizes the framework so future item-N codification cycles (per §8.2 every-25-items framework) have explicit reference rather than ad-hoc reconstruction. Codified at item-25a sub-session A.4 (2026-05-01) per Path C Phase 4 decomposition plan.

---

## 8. Review cadence

### 8.0 Pattern-watch trigger scans

Lightweight procedural checks independent of the full convention-validation checkpoint in §8.1. Triggered at **items 10 and 20** (before the first full checkpoint) and again as part of every subsequent §8.1 or §8.2 checkpoint.

Purpose: pattern-watch entries in drift-log.md (Type B, pattern-watch subtype per drift-log.md header) carry pre-registered re-evaluation triggers of the form "if ≥N additional cases by item M, promote to PL." Without a scheduled scan, annotator memory is the sole mechanism for noticing trigger-firing — which fails under session fatigue and is not recoverable once the horizon passes. This scan is the passive detection mechanism.

Procedure (~2 minutes per scan):

1. Grep drift-log.md for Type B pattern-watch entries: `grep -E "pattern watch|Re-evaluation trigger" data/gold/drift-log.md`.
2. For each pattern watch, read the trigger condition. Conditions typically take the form "≥N additional cases by item M."
3. Evaluate whether the trigger has fired. **The scan counts Type B entries by middle-field match, not by prose reference** — an entry that mentions the pattern name only in its summary field does not count. This rule prevents divergent counting recipes from producing inconsistent trigger assessments, which would undermine the passive-detection discipline §8.0 is designed to enable.

   **Canonical middle-field format for pattern-related Type B entries:**
   - **Pattern-watch registration entry** — first occurrence; records the pattern and sets the trigger condition, does NOT count toward the trigger: middle field = `pattern-watch — <pattern-name>`
   - **Observation entry** — additional instance of the watched pattern; counts toward the trigger: middle field = `observation — <pattern-name>`

   **Canonical grep recipe — count observations of a prospective pattern:**
   ```bash
   grep -c "| observation — <pattern-name> |" data/gold/drift-log.md
   ```

   **For patterns already promoted to a PL code,** count instances via the flag in committed annotations instead:
   ```bash
   grep -c "PL:<code-name>" data/gold/resolver-gold-*.jsonl
   ```

   An entry whose middle field contains a pattern name but does not start with `pattern-watch —` or `observation —` is non-canonical; flag it for normalization at the next checkpoint before running the trigger scan.

   **Recipe hardening: prose references use ALL_CAPS PLACEHOLDER tokens.** Drift-log and CONVENTIONS prose that references a pattern name, a canonical-recipe literal, or any grep-target string must use ALL_CAPS PLACEHOLDER tokens (e.g., PATTERN_NAME, CONCEPT_SLOT, SENTINEL_LITERAL, RECIPE_LITERAL) rather than the literal target. Writing PATTERN_NAME in prose — rather than the literal lowercase-hyphenated pattern — keeps canonical recipes free from prose-match false positives. Real pattern names and middle-field tokens use lowercase-hyphenated form; the two styles are disjoint by convention, so ALL_CAPS tokens appearing in prose cannot collide with real recipe targets. **Triggered by:** three instances of prose-grep-collision — §6 validator description embedding a literal SENTINEL_LITERAL string that the sentinel-pair checker matched (caught during first validator run 2026-04-22); drift-log header template embedding a literal observation-middle-field form that §8.0 recipes matched (caught during §8.0 formalization 2026-04-22); item-091 rename entry embedding a literal recipe string that the pattern-count recipe matched (caught during count-semantics flag 2026-04-22). Same mechanism (literal grep-target strings appearing in prose that the recipe is supposed to scan), same fix (PLACEHOLDER substitution). This rule is written in compliance with itself: every reference to a specific recipe or sentinel is given via ALL_CAPS PLACEHOLDER rather than the literal.
4. **If any trigger has fired:** escalate per §7.1 governance (≥3-instance + back-sweep + CONVENTIONS edit for promotion) or re-open the locked decision if the trigger concerns reconsideration rather than promotion.
5. **Whether or not triggers fired:** record the scan result in drift-log.md as a Type A entry. Explicit "scanned at item-10 / item-20; no triggers fired" is the audit signal that the scan ran.

**Horizon management.** Pattern-watch entries whose trigger-horizon item-count passes without the trigger firing (e.g., "if ≥2 more cases by item 20" at item 21) should be explicitly resolved: either close out the watch (add a Type B entry noting the watch expired without firing; the original watched pattern is abandoned) or extend the horizon with a new trigger condition (Type B entry amending the original watch). Unresolved expired watches accumulate silently — the scan procedure at item 20 and every §8.1/§8.2 checkpoint thereafter must include this closure check.

**Triggered by:** item-007 annotation (2026-04-22) surfaced the slug-graveyard pattern with a "≥2 more cases by item 20" trigger, which revealed that without a scheduled scan the system has no mechanism for noticing trigger-firing other than annotator memory.

### 8.1 Item-25 convention-validation checkpoint

A one-time full-spec validation, performed after 25 items are committed (across any combination of dev and holdout).

- Re-read CONVENTIONS.md front-to-back.
- Check all 25 committed items against the current rules.
- Record findings in `data/gold/drift-log.md`.
- Promote eligible parking-lot patterns if the ≥3-instance threshold has been crossed.
- Revisit deferrals (§9) for triggers that have fired.
- **Review edit velocity.** Count Type B CONVENTIONS-edit entries in `drift-log.md` since item 1 — only the CONVENTIONS-edit subtype, NOT pattern-watch entries (per drift-log.md header, Type B now covers both subtypes; counting pattern watches in velocity would conflate "spec evolved" with "pattern observed but not acted on"). Observe the trend:
  - **Raw count > 15 CONVENTIONS-edit entries** suggests spec evolution is outpacing annotation work.
  - **Marginal rate** — edits per item, trending. If items 10–25 produce edits at a rate comparable to items 1–10, that is the framework-instability signal and warrants stopping to review whether the spec is underspecified in some dimension. If edits cluster in items 1–10 and taper sharply thereafter (expected pattern under the "latent patterns surfacing early" reading), that is normal edge-case discovery and no action is needed.
  - **Distribution review** — same raw count means different things under different shapes. 15 edits clustered in items 1–5 then tapering to zero by item 15 diagnoses "framework settled into contact with corpus" (healthy). 15 edits spread uniformly across items 1–25 diagnoses "chronic underspecification" (unhealthy). 15 edits backloaded toward items 20–25 diagnoses "late-surfacing edge cases outside the spec's anticipated scope" (investigate which dimension is under-covered). Compute a simple distribution at the checkpoint: edits per 5-item window (1–5, 6–10, 11–15, 16–20, 21–25) and record the shape alongside raw count.
  - Either way, record the observation in the drift-log entry for the checkpoint.

This is distinct from the final 15-item spot-check described in `README.md` §7. This is convention *validation* (are the rules holding up?), not label *validation* (are the labels consistent?).

**Triggered by:** recognition that conventions are provisional-in-practice until stressed by real annotations; item 25 is the earliest point where a rule's real-world fit can be honestly assessed. Edit-velocity counter added 2026-04-22 as an early-warning signal for framework instability versus normal edge-case discovery.

**Interim-checkpoint trigger (forward-looking).** If the CONVENTIONS-edit count (§8.1 velocity counter; Type B CONVENTIONS-edit subtype entries only, excluding pattern-watch entries) reaches **10 or more before item 20 is committed**, run an interim convention-validation checkpoint *immediately* — do not defer to item 25. The interim checkpoint follows the same procedure as the scheduled §8.1 checkpoint (full-spec re-read, all committed items checked against current rules, findings recorded in drift-log as a Type A entry, edit-velocity trend review). Purpose: prevent the failure mode where the spec drifts for 10-15 additional items under an increasingly unstable framework before the scheduled item-25 checkpoint catches it. Edit-velocity running substantially ahead of annotation velocity is itself the signal to evaluate now, not at an arbitrary item-count horizon.

**Triggered by:** session edit-velocity as of 2026-04-22 (7 CONVENTIONS-edit events across items 1–7, ratio ≈1.0 edit/item, trending toward the §8.1 raw-count threshold of >15 before item 15). The velocity counter alone was retrospective — it reported the drift at item-25. The interim-checkpoint trigger makes the counter forward-looking by defining a pre-item-25 condition that forces evaluation.

### 8.2 Every-25-items drift check (running)

At every 25-item increment beyond the first (items 50, 75, ...), perform a running drift check on the most recent 25 items. Three-item checklist:

1. **Flag-code slot semantics.** Do the `AF` and `PL` codes used in the last 25 items match their slot-semantics definitions (§4, §3)? Any code been stretched into a borderline case it wasn't designed for?
2. **Notes prose length.** Do any prose tails exceed what is useful to another annotator? Drift-toward-narrative is a signal to tighten.
3. **Concept-slot consistency.** Has any single concept been filled with inconsistent strings across the 25 items (e.g., `doxa` in one place, `opinion` in another)?

Findings — including "no drift found" — go into `data/gold/drift-log.md`. The log is the mechanism that surfaces structural problems: if the same drift type appears at items 50, 75, and 100, that's a CONVENTIONS issue, not annotator sloppiness.

**Triggered by:** recognition during spec iteration that discipline degrades over a session and across sessions without a forcing function; "spot-check every 25" is lightweight enough to actually happen while large enough to catch accumulating drift.

### 8.3 Final pre-lock consistency check

Per `README.md` §7: re-review 15 randomly-chosen dev items after all 50 are labeled. Distinct from §8.1 and §8.2; this is the label-validation pass that gates lock.

### 8.4 Drift-log entry types

`data/gold/drift-log.md` carries two entry types:

- **Type A — Checkpoint findings.** Written at §8.1 and §8.2 checkpoints. Records drift findings, pattern-watch observations, and (at §8.1) edit-velocity review.
- **Type B — CONVENTIONS-edit events.** Written whenever CONVENTIONS.md is edited in response to annotation work. Pointer-style entries: `YYYY-MM-DD | §refs | triggered by <item-id> | one-line summary`. Canonical detail (the content of the edit) lives in the §3.2 row's `Triggered by:` line or the git diff; drift-log is the chronological index, not a restatement.

Templates for both types live in `drift-log.md`'s header. Use the template matching the entry's purpose; do not mix formats in a single entry.

**Triggered by:** recognition during 2026-04-22 spec iteration that reconstructing the CONVENTIONS edit history required either full-doc section-by-section re-reading or git archaeology; a chronological pointer-index in drift-log resolves both without duplicating the edit content.

### 8.5 Open-questions review discipline

Annotation work (per-item review during dev-set commit cycle) and codification work (per-codification-decision review during item-25 codification sub-sessions per §7.6) use a proposal → review/pushback → confirm pattern. The open-questions review discipline structures the review step by surfacing explicit questions and concerns for the reviewer's per-question consideration rather than implicit-confirmation prompts.

**Format A — Explicit Q1–Qn list with Concern A–N parallel structure (DEFAULT).**

The proposal surfaces:

- **Q1–Qn open questions** — numbered explicit questions for the reviewer, each tagged with the decision-point it surfaces (e.g., "Q1 — disposition path A vs path B?", "Q2 — insertion location?", "Q3 — verification scope?"). Each question identifies the alternatives the proposer has weighed and (typically) a recommendation with rationale.
- **Concern A–N parallel structure** — lettered concerns running parallel to the Q-list. Concerns surface considerations that affect the proposal but may not require explicit per-question disposition (e.g., "Concern A — verification gap"; "Concern B — procedural protocol applicability"; "Concern C — downstream impact"). Concerns may be raised by the proposer (anticipating reviewer concern) or surfaced by the reviewer in pushback.
- **Pre-edit / pre-commit checklist** — checklist rendering the open-questions resolution state and the actions awaiting confirmation.

Format A is the default for any proposal with substantive judgment-call content — including but not limited to: (i) multiple viable disposition paths; (ii) verification gaps the reviewer needs to authorize closing; (iii) cross-cluster or downstream impact requiring explicit handoff disposition; (iv) any case where the proposer cannot confidently anticipate a single confirmation outcome.

**Format B — Closing-prompt-confirm (RESTRICTED to genuinely non-substantive items).**

The proposal surfaces a single closing-prompt requesting reviewer confirmation. Used only when:

- The disposition is clear-cut with no viable alternatives requiring weighting
- No verification gaps; no downstream-impact uncertainty
- The proposer can confidently anticipate single confirmation outcome
- The work is mechanical execution of an already-confirmed decision (e.g., applying an already-confirmed CONVENTIONS edit to a specified location)

**When in doubt, Format A.** Format B is restricted, not preferred — its use is reserved for genuinely non-substantive items where Format A's structure would add review-overhead without value. If the reviewer surfaces pushback against a Format-B-presented item, the proposer reverts to Format A and re-presents with explicit Q1–Qn (per the pushback-re-presents rule below — Format B's pushback-failure is itself the escape-hatch back to Format A).

**Pushback re-presents in Format A with prescriptive Q-list mapping.** When a reviewer issues PUSHBACK on a proposal (regardless of original format), the proposer's revised-proposal response uses Format A AND explicitly addresses each pushback point as Q-entries (Q1 addresses pushback point 1, Q2 addresses pushback point 2, etc.). Concerns raised in pushback are addressed as Concern entries in the revised-proposal Concern A–N structure. This ensures pushback points have explicit per-point disposition rather than implicit aggregate confirmation. The dev-21 PUSHBACK → revised-proposal pattern (where PUSHBACK Q1/Q2/Q3 became revised-proposal Q1/Q2/Q3 disposition addresses) is the precedent.

**Concerns surface verification + procedural concerns.** Concern A–N entries are typically used for: (i) verification requirements (e.g., "Concern A — jq verification required for ontology coverage"); (ii) procedural protocol applicability (e.g., "Concern B — §7.4 status-tracking applies; conditional-application flag required"); (iii) cumulative tracking notes (e.g., "Concern C — §8.1 trajectory monitoring"). Concerns are NOT a substitute for Q1–Qn — they parallel the Q-list rather than replace it (integrated dual-track structure).

**Triggered by:** dev-22 Concern B (open-questions explicit-format restoration commitment after dev-21 closing-prompt-confirm format produced PUSHBACK requiring re-revised proposal) → dev-22/23/24 explicit Q1–Qn + Concern A–N format consistent application. Refinement 3 (Path C Phase 4 plan) elevated this from RATIFY (already de-facto standing) to NEW-codification-of-format-rules due to actual format variability across dev-19 through dev-24 warranting explicit specification rather than de-facto-standing assumption. Format A also includes empirically-observed Concern A–N parallel structure (cumulative dev-19 through dev-24 all used both Q-refs and Concern-refs). Codified at item-25a sub-session A.5 (2026-05-01) per Path C Phase 4 decomposition plan.

**Retroactive ratification (nuanced scope per Q4 refinement):** dev-19/20 Format A standing application (pre-deviation); dev-21 Format A application incomplete with PUSHBACK-revision retrospectively expanded to Format A (restored mid-cycle); dev-22/23/24 Format A standing application (post-restoration). The dev-21 pattern is itself the precedent for the pushback-re-presents-in-Format-A rule above. Empirical scan scope is dev-19 through dev-24 — earlier dev items (dev-1 through dev-18) pre-date the dual-track Q1–Qn + Concern A–N structure as standing practice; §8.5 codification applies from dev-19 forward.

---

## 9. Deferrals

Day-one scope is deliberately narrow. The following items are deferred with explicit trigger conditions:

| Deferred item | Day-one state | Promotion trigger |
|---|---|---|
| Auto-generation of single-word-safe-slots list | Hand-maintained inside sentinel brackets in §5.3 | Item 50 reached; evaluate empirically whether list is stable (auto-generation earns its keep) or volatile/unused (keep hand-maintained or remove entirely). |
| Structured error output from validator (file/line/field/flag/violation/found/expected/fix) | Single-line `file:line — violation` | Item 50 reached, OR first non-self annotator onboarded, whichever is first. |
| Incremental validation | Full-scan every run | Never, unless corpus exceeds 1000 items and full-scan exceeds 5s. |
| Quarantine file for unresolvable annotations | Not implemented; fix-in-place or WIP-marker in notes | Never, unless a genuinely unresolvable annotation blocks progress. WIP marker convention: `"notes":"WIP: <description of blocker>; awaiting convention decision on <pattern-name>"`. |
| `AF7+` codes | Not created | Governance rule §7.1 (≥3 instances + back-sweep + CONVENTIONS edit). |
| Ban on ASCII `\|` for logical-OR in prose | Not codified | Parking-lot pattern `logical-or-in-prose`; codify if triggered, reconsideration horizon item 50. |

**Triggered by:** deliberate deferral during spec iteration to avoid building infrastructure ahead of evidence. Each deferral was decided with its trigger condition pre-specified so that the promotion path is auditable rather than rediscovered.

---

## 10. Quick reference

```
Flag:         AF<n>:concept — prose
Parking:      PL:pattern-name — case description
Compound:     AF4:x — ... | AF5:y — ...
Separator:    " — " (em-dash, padded)    " | " (pipe, padded)
Retrieve:     jq (default)               grep (single-word concepts only)
Review:       item 25 = validation       every 25 after = drift check
Governance:   new code = ≥3 instances + back-sweep (required) + CONVENTIONS edit
```
