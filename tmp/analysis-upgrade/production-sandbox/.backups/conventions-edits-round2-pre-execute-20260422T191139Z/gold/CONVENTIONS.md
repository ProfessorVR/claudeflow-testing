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

## 3. Parking lot — named patterns, decisions deferred

This section is first-class. **Hitting a parking-lot pattern is an event:** it triggers a `PL:` notes flag, NOT an ad-hoc decision. Do not silently pick a reading. Flag it, move on, and surface it at the next review checkpoint.

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

**Triggered by:** recognition during spec iteration that optional back-sweeps accumulate mixed-convention dreck at scale and are the single largest source of unmaintainable annotation corpora.

### 7.2 Removing a rule

A rule marked `Prospective` that has not triggered within its reconsideration horizon is eligible for removal. Removal requires a commit citing the horizon-expiration and a grep sweep confirming zero committed uses.

### 7.3 Rule trigger citation

Every rule added to CONVENTIONS.md carries a `Triggered by:` line identifying the concrete case or spec-iteration argument that motivated it. Prospective rules additionally carry an expected trigger condition and a reconsideration horizon. No rule is added without a citation.

---

## 8. Review cadence

### 8.1 Item-25 convention-validation checkpoint

A one-time full-spec validation, performed after 25 items are committed (across any combination of dev and holdout).

- Re-read CONVENTIONS.md front-to-back.
- Check all 25 committed items against the current rules.
- Record findings in `data/gold/drift-log.md`.
- Promote eligible parking-lot patterns if the ≥3-instance threshold has been crossed.
- Revisit deferrals (§9) for triggers that have fired.

This is distinct from the final 15-item spot-check described in `README.md` §7. This is convention *validation* (are the rules holding up?), not label *validation* (are the labels consistent?).

**Triggered by:** recognition that conventions are provisional-in-practice until stressed by real annotations; item 25 is the earliest point where a rule's real-world fit can be honestly assessed.

### 8.2 Every-25-items drift check (running)

At every 25-item increment beyond the first (items 50, 75, ...), perform a running drift check on the most recent 25 items. Three-item checklist:

1. **Flag-code slot semantics.** Do the `AF` and `PL` codes used in the last 25 items match their slot-semantics definitions (§4, §3)? Any code been stretched into a borderline case it wasn't designed for?
2. **Notes prose length.** Do any prose tails exceed what is useful to another annotator? Drift-toward-narrative is a signal to tighten.
3. **Concept-slot consistency.** Has any single concept been filled with inconsistent strings across the 25 items (e.g., `doxa` in one place, `opinion` in another)?

Findings — including "no drift found" — go into `data/gold/drift-log.md`. The log is the mechanism that surfaces structural problems: if the same drift type appears at items 50, 75, and 100, that's a CONVENTIONS issue, not annotator sloppiness.

**Triggered by:** recognition during spec iteration that discipline degrades over a session and across sessions without a forcing function; "spot-check every 25" is lightweight enough to actually happen while large enough to catch accumulating drift.

### 8.3 Final pre-lock consistency check

Per `README.md` §7: re-review 15 randomly-chosen dev items after all 50 are labeled. Distinct from §8.1 and §8.2; this is the label-validation pass that gates lock.

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
