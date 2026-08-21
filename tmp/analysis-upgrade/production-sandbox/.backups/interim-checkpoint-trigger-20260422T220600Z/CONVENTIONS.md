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

Each row is a *pattern*, not a code. Codes (`AF7`, `AF8`, ...) are created only via the governance rule in §7.

**Triggered by:** recognition during spec iteration that ad-hoc resolution of recurring-but-unnamed patterns is the single largest source of convention drift in multi-session annotation.

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

1. Look up the source record in `data/corpus/index/<slug>/claims.jsonl` and read the `.quote` field, the `.nearby_provenance` (Bekker anchor), and the `.faithfulness_note`.
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
  - Either way, record the observation in the drift-log entry for the checkpoint.

This is distinct from the final 15-item spot-check described in `README.md` §7. This is convention *validation* (are the rules holding up?), not label *validation* (are the labels consistent?).

**Triggered by:** recognition that conventions are provisional-in-practice until stressed by real annotations; item 25 is the earliest point where a rule's real-world fit can be honestly assessed. Edit-velocity counter added 2026-04-22 as an early-warning signal for framework instability versus normal edge-case discovery.

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
