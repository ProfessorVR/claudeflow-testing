# Pre-staged codification — load-bearing-modifier

**Status:** Draft, pre-staged 2026-04-28 (Unit C step 7). Awaiting fire at item-25 checkpoint (overall item 45 = dev-25 per locked execution plan Decision 8).
**Destination:** new §3.2 row OR new §4 PL code (see "Codification path" below).
**Acceptance criteria (per locked plan Decision 4):** validator-passing (em-dash discipline, scanned by `scripts/validate-gold-notes.sh` Check 5); `Triggered by:` line with specific item IDs and instance counts; exact back-sweep anchor strings.

---

## Rule (diagnostic-clarity emphasis)

A modifier in a `claim_text` is **load-bearing** when removing it changes what the claim *asserts as its thesis* — not what it *describes about the operative concept*. Load-bearing modifiers must be reflected in labeling decisions; non-load-bearing modifiers (predicate-work / decorative) are dropped from the label set.

### Diagnostic test (the THESIS-CHANGE TEST)

Apply the test in two steps for any candidate modifier:

1. **Construct the modifier-removed claim.** Mentally delete the modifier and read the resulting `claim_text`.
2. **Compare thesis vs. predicate-work**, where THESIS = what the claim asserts (the proposition's content), including which referents are involved AND what is predicated of them:
   - If the modifier-removed claim asserts a **different thesis** → modifier is **load-bearing**. The modifier carries the claim's referential weight; reflect it in the labeling.
   - If the modifier-removed claim asserts the **same thesis** with **less precision about what the operative concept does** → modifier is **predicate-work** (decorative). Drop from the label set.

The five precedents below illustrate how thesis-difference can manifest at different syntactic loci (referent identity, conceptual carving, argumentative move, argumentative target). These are not separate criteria — they are illustrations of the single thesis-difference criterion at different positions in the claim's grammar. The annotator's job is to determine whether the modifier-removed claim asserts a different thesis; HOW the thesis differs (which locus) is a secondary description, not a separate test.

### Distinguishing principle (vs. predicate-work)

The distinction is *thesis-modifier* vs. *predicate-modifier*:
- **Thesis-modifier** answers "what claim is being made?" — removing it changes what's being asserted.
- **Predicate-modifier** answers "how does the operative concept behave?" — removing it leaves the same assertion with reduced descriptive richness.

Item-100 ("sizing up") is the canonical non-example: "sizing up" describes what the cognitive-operation concept does, not which concept is being deployed. The thesis stays the same if "sizing up" is replaced with "comparing" or "evaluating relative magnitudes" — the operative concept (comparison) is unchanged. So "sizing up" is predicate-work, not load-bearing.

### Application protocol

When the test fires positive:
- **If the modifier picks out an ontology-distinguished sub-type** (e.g., 314 `psychophysical supervenience` vs umbrella `supervenience`): label the sub-type, drop the umbrella.
- **If the modifier picks out a thin-slug surface variant** (e.g., 062 `necessary connection` as an ontology slug): label the rich form (modifier + head noun) as the concept-match.
- **If the modifier excludes a wrong-context-rich-canonical** (e.g., 053 `actual sensation` excluding latent-faculty Perception): use the modifier as the wrong-context-rejection trigger; label per §3.2 wrong-context-rich-canonical rule.
- **If the modifier is dialectical-thesis-marking** (e.g., 049 `motivating` for `phantasia` as motivating cause vs. mere image): the modifier is the claim's load-bearing thesis-frame; reflect it in the concept slot.

---

## Five precedents (instance count: 5; illustrating thesis-difference at distinct syntactic loci)

| # | Item | Modifier | Syntactic position | Why load-bearing |
|---|---|---|---|---|
| 1 | `claim-aristotle-da-3.3-049` | `motivating` | claim-content modifier on object (`potentially motivating content`) | Removing `motivating` changes the thesis from "phantasia as motivating-cause-of-action" to "phantasia as content-bearing" — different argumentative move. |
| 2 | `claim-heidegger-bcap-036` | `visible` | predicate-modifier on subject-position predicate (`not yet visible`) | Removing `visible` changes the thesis from "hermeneutic-disclosure-pending" to "non-existence" — different referent (Disclosedness vs. nothing). |
| 3 | `claim-aristotle-da-3.3-053` | `actual` | adjective on object noun (`actual sensation`) | Removing `actual` collapses the contrast with latent-faculty perception; the thesis shifts from "operative perceiving" to "perceiving-faculty" — different ontology node (Perception-as-act vs. Perception-as-faculty). |
| 4 | `claim-frede-1992-138` | `persist` | adverbial modifier on the predicate verb (`persist independently`) | Removing `persist` changes the thesis from "phantasiai as enduring traces" to "phantasiai as occurrent images" — different conceptual carving (the persistence-claim is what makes Frede's reading distinct). |
| 5 | `claim-kim-1988-062` | `necessary` | predicate-adjective on noun-phrase modifier (`necessary connection`) | Removing `necessary` changes the thesis from "Humean denial of necessary connection" to "Humean denial of connection" — different argumentative target (modal denial vs. ontological denial). |

### Coverage of syntactic positions

The five precedents cover all major modifier-syntactic positions: claim-content modifier on object (049), predicate-modifier on subject-position predicate (036), adjective on object noun (053), adverbial modifier on the predicate verb (138), predicate-adjective on noun-phrase modifier (062). Variation sufficient to attempt formalization rather than wait for additional cases.

---

## Codification path

§3.2 PL row, Decided status. Concept slot = the modifier itself (e.g., `PL:load-bearing-modifier — motivating`). Rule encoded in the row's Decided-status text.

**Escalation handling:** if dev annotation surfaces a structural reason to escalate to flag-class status (e.g., load-bearing-modifier handling becomes annotation-decision-defining rather than labeling-refinement, paralleling AF4/AF5/AF6 semantics), log a drift-log observation with the specific structural reason; the observation triggers re-evaluation. No pre-specified escalation horizon — escalation is evidence-driven, not date-driven.

---

## Triggered by

instance count: 5 across 5 syntactic positions; precedents at items 049 (motivating), 036 (visible), 053 (actual), 138 (persist), 062 (necessary). drift-log lineage: `2026-04-22 | observation — load-bearing-modifier-applied-to-functional-characterization | triggered by 049 + 036 + 053 + 138 + 062`. The five-precedent threshold satisfies the pre-specified "consider promotion to §3 sub-rule at item-25" condition; codification locked on agenda since the 138 update.

---

## Back-sweep anchors (exact substrings to add codified flag)

When the codification fires at item-25, the following items' notes-field substrings are the anchor points where `PL:load-bearing-modifier — MODIFIER_NAME` should be appended (compound-flag separator: ` | `).

The anchor strings below are verbatim from existing notes; they identify the precedent items in case the rule's `Triggered by:` line needs to cross-reference per-item context.

| Item | Anchor substring (from notes) |
|---|---|
| `claim-aristotle-da-3.3-049` | (notes empty in holdout file; flag will be added as the sole notes-field flag) |
| `claim-heidegger-bcap-036` | `PL:ontology-synonymy ` (existing first flag; append `\| PL:load-bearing-modifier ` visible after) |
| `claim-aristotle-da-3.3-053` | `PL:ontology-synonymy ` (existing first flag; append `\| PL:load-bearing-modifier ` actual after) |
| `claim-frede-1992-138` | `PL:ontology-synonymy ` (existing first flag; append `\| PL:load-bearing-modifier ` persist after) |
| `claim-kim-1988-062` | `PL:wrong-context-rich-canonical ` (existing first flag; append `\| PL:load-bearing-modifier ` necessary after) |

(The `\|` notation above is the literal compound-flag separator ` | ` rendered with a backslash for markdown-table-readability; actual notes-field text will use ` | ` per validator pipe-padding rule.)

**Back-sweep procedure** (per §7.1 governance, ≥3-instance + back-sweep + CONVENTIONS edit for promotion):
1. Apply the codification edit to CONVENTIONS.md (add §3.2 row or §4 AF code per Option A/B).
2. For each anchor item above, append the flag to the notes field maintaining ` | ` separator discipline.
3. Run `scripts/validate-gold-notes.sh` to confirm em-dash + pipe-padding compliance after back-sweep.
4. Log Type B CONVENTIONS-edit drift-log entry recording the codification + back-sweep with item count.
