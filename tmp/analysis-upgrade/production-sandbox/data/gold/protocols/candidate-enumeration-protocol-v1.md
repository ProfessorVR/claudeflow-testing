# Candidate-Enumeration Protocol — v1 (pre-item-25 working version)

**Status:** v1 working version, pre-item-25 formalization. Established 2026-04-28 during Remediation Phase 1.
**Authority:** plan-critique convergence at v4 (4 cycles); see `remediation-2026-04-28.md` Phase 1 audit-summary for the establishment work.
**Scope:** annotation candidate-enumeration discipline used during gold-set authoring (dev annotation, holdout annotation, future re-annotations).
**Versioning:** v1 stays as historical reference; item-25 (or other codification cycle) produces v2 that supersedes via cross-reference. v1 is the document that informs the formalization.

---

## Operative ontology source

**Path:** `data/corpus/index/compiled-index.json` (symlinked to `compiled-index.v2.json`)
**Node count:** 7,389 nodes
**Per-node fields:** `name`, `greek`, `transliteration`, `definition`, `aliases`, `centralityTier`, `type`, `text`, `translation`, `units`
**Centrality tiers:**
- `core` (~100 nodes): rich canonicals (Substance, Form, Matter, Actuality, Potentiality, Thought / Intellect, Nature, etc.)
- `important` (~112 nodes): mid-tier rich canonicals
- `medium` (~3 nodes): rare
- `peripheral` (~7,168 nodes): thin slugs introduced from author corpora ("Concept introduced via [Author]" definitions)

The 277-node `data/corpus/index/ontology-embeddings.jsonl` is an embedding-included subset for resolver fuzzy-matching, NOT the operative ontology.

---

## Reading C (governing ontology-as-operative interpretation)

Authoring references the full 7,389-node compiled-index. The README §1's "most authoring will reference the ~200 most-connected nodes" describes attention-concentration (cognitive workload of recognizing relevant concepts is concentrated in core+important tiers), not a labeling rule. Thin slugs in the broader ontology are valid labels per §3.2 ontology-synonymy when concept-match obtains.

§3.0 rich-preferred + concept-match-at-correct-abstraction governs label choice. Rich canonicals win when both rich and thin concept-match. Thin slugs win when (a) no rich canonical name-matches OR (b) rich canonical fails concept-match per the three-test sub-protocol below.

---

## §3.0 application three-test sub-protocol

For each rich canonical that name-matches a surface concept:

### Test 1 — Concept-match
Does the rich canonical's `definition` field denote the same concept as `claim_text`'s surface, or something broader/narrower?
- Same → passes Test 1
- Broader/narrower → fails Test 1; rich rejected; fall through to thin slug
- §3.0 example (i) common sensibles: thin slug denotes the exact concept named in claim_text → legitimate label
- §3.0 example (ii) number rejected for "two": number is broader than numerical-duality concept → fails Test 1
- §3.0 example (iii) point/unity/divisible: thin slugs denote exactly the claim's referent at correct level → legitimate labels

### Test 2 — No-richer-alternative
Is there a richer alternative (higher centralityTier, more inclusive compound, or aliasing-equivalent) that ALSO concept-matches per Test 1?
- Yes → prefer the richer alternative (rich-rich-duplication-trace handling per drift-log line 115/117)
- No → current rich is the candidate; proceed

### Test 3 — Thinness-as-corroborative
If rejecting a rich canonical, is thinness corroborative or determinative?
- Thinness alone never determines rejection
- Determinative requires concept-mismatch (Test 1 failure) or scope-exceedance (six-check protocol Check 3) or wrong-context (Check 4)

---

## Six-check candidate-enumeration protocol

For each surface concept in `claim_text`:

### Check 1 — Presence in 7,389-node compiled-index
```bash
jq -r --arg q "$SURFACE_CONCEPT" '
  .ontologyNodes[] |
  select(.name == $q or (.aliases // [])[]? == $q or .greek == $q or .transliteration == $q) |
  {name, greek, transliteration, definition, aliases, centralityTier}
' data/corpus/index/compiled-index.json
```
- Found → enumerate all matches (synonymy / surface-variants); proceed to Check 2
- Not found → AF4 candidate (concept absent from operative ontology)

### Check 2 — Rich-canonical existence + concept-match per §3.0
- Filter Check-1 matches by `centralityTier in {core, important, medium}`
- For each rich match: apply three-test sub-protocol
- If any rich passes all three tests: rich-preferred (record in candidate set)
- If no rich passes: fall through to Check 5 (thin-slug-only labeling)

### Check 3 — §3.0 corollary scope-exceedance test
For rich canonicals that pass Check 2: does `claim_text`'s deployment exceed the rich canonical's `definition` scope?
- Yes (deployment exceeds rich scope) → reject rich; fall back to thin slug per §3.0 corollary
- No → rich-preferred holds

§3.0 corollary precedent: holdout claim-091 used `human being` thin slug rather than rich `Dasein` because the claim's deployment was at general-organism level, not Dasein-as-existential-structure level.

### Check 4 — §3.2 wrong-context-rich-canonical genre-mismatch test
For rich canonicals passing Check 3: does the rich canonical's framework (Heideggerian / Aristotelian / Scholastic / etc.) align with `claim_text`'s argumentative framework?
- Aligned → rich-preferred holds
- Mismatched → reject rich per §3.2 wrong-context-rich-canonical row; label thin slug

§3.2 wrong-context-rich-canonical precedents: holdout 033 (Fear → Heideggerian Furcht rejected on Aristotelian opinion claim); 037 (animal → Heideggerian rejected on Aristotelian θηρία/brutes claim); 039 (Truth → Heideggerian alētheia/disclosure rejected on Aristotelian phantasia true-or-false claim); 062 (Cause → Aristotelian aitia rejected on Humean modern-empiricist causation claim).

### Check 5 — Thin-slug variants + §3.2 surface-variant convention
For thin slugs in the candidate set:
- Check for plural/singular variants (mechanism #2 surface-variant)
- Check for orthographic variants (mechanism #3, e.g., judgement/judgment)
- Check for adjective/noun variants (mechanism #4)
- Apply §3.2 surface-variant convention: prefer surface-form-in-claim_text where multiple variants concept-match

### Check 6 — Compound-vs-compositional decision
If `claim_text` has a compound surface concept (e.g., "physical predicates"):
- Check whether compound exists as ontology node (`physical predicates`)
- Check whether components exist separately (`physical` + `predicates`)
- If compound exists → label compound (preferred)
- If only components → label compositional (multiple thin slugs)

---

## Flagging-disposition vs. labeling-disposition (§1.4d)

Checks 1-6 are LABELING-disposition checks: each produces a labeling outcome (rich-preferred / thin-preferred / rejected / fallback). They determine `expected_ontology_nodes`.

§3.2 has additional rows with FLAGGING disposition (flag-and-move-on, no labeling-decision impact):
- `cross-author-concept-collision` (decided-deferred per §3.2 row)
- `paraphrase-distortion` (handled via PL grammar; §5.4 partial-faithfulness)
- `voice-switching` (deferred)
- `compound-claim-split` (deferred)
- `translation-ambiguity` (deferred)
- `logical-or-in-prose` (prospective)

These are flagging-disposition rules running ALONGSIDE the labeling protocol, not within it. Per-item annotation applies both: the labeling protocol (six checks → `expected_ontology_nodes`) AND a flagging review (which §3.2 rows apply by their own criteria → `notes` flags).

If item-25 codification produces labeling-disposition criteria for any currently-flag-only rule, that rule may get promoted to a 7th-or-Nth labeling check at that codification cycle.

---

## §1.5 Primary-referent-vs-predicate-content discipline

Surface-fidelity (per README §6) and primary-referent-vs-predicate-content are independent axes:
- Surface-fidelity: label what `claim_text` names, not what's only inferrable from passage context
- Primary-referent-vs-predicate-content: among surface concepts, distinguish referents from predicate-content

After candidate-enumeration (Checks 1-6) yields candidates, classify each candidate by role:

| Role | Definition | Labeling disposition |
|---|---|---|
| Primary referent | The claim is about this concept | Include in `expected_ontology_nodes` |
| Load-bearing predicate | Predication-content essential to the claim's thesis | Include in `expected_ontology_nodes` |
| Decorative predicate | Predication-content not essential; modifier-removable per load-bearing test | Exclude unless flagging-disposition rule applies |
| Setting / framing | Meta-reference, not subject of the claim | Exclude unless flagging-disposition rule applies |

**Holdout audit basis (2026-04-28):** holdout average is 3.45 labels/item; range 1-8; mode 3-4. Implicit discipline IS primary-referent + load-bearing predicates, NOT every surface concept.

If §1.5 surfaces ambiguity in README §6 / CONVENTIONS regarding the discipline, flag as item-25 §6-codification-clarification candidate alongside §8.4 cluster.

---

## Application order (per surface concept)

1. **Check 1** — presence in compiled-index → if absent, AF4 (skip 2-6)
2. **Check 2** — rich-canonical concept-match
3. **Check 3** — §3.0 corollary scope-exceedance (sequential rejection test on rich)
4. **Check 4** — §3.2 wrong-context (sequential rejection test on rich)
5. **Check 5** — thin-slug variants + surface-variant convention (operates on thin-slug fallback OR on rich-survived-passes)
6. **Check 6** — compound-vs-compositional decision
7. **Flagging review** (§1.4d) — which §3.2 flag-only rules apply (independent of labeling outcome)
8. **§1.5 classification** — primary referent / load-bearing predicate / decorative / setting → include or exclude in `expected_ontology_nodes`

---

## Cross-references

- CONVENTIONS §3.0 node-choice principle
- CONVENTIONS §3.0 corollary rich-vs-strict tension
- CONVENTIONS §3.2 ontology-synonymy
- CONVENTIONS §3.2 wrong-context-rich-canonical
- CONVENTIONS §3.2 cross-author-concept-collision (flagging-disposition)
- CONVENTIONS §4 AF4 / AF5 / AF6 flag codes
- CONVENTIONS §5.4 partial-faithfulness verification procedure
- README §1 ontology size + line 138 retrieval recipe
- README §6 gold-set methodology surface-fidelity
- drift-log lines 115 / 117 rich-rich-duplication-trace handling
- holdout precedents: 033/037/039/062 (wrong-context-rich-canonical); 091 (scope-exceedance human-being-not-Dasein); 058 (thin-slug-when-no-rich-concept-matches)

---

## Pre-codification version note

This is v1 of the candidate-enumeration protocol. Item-25 codification will formalize as CONVENTIONS §7-class governance (per pattern-watch `annotation-methodology-must-reference-compiled-index`). v2 will supersede; v1 retained as the working draft that informed formalization.
