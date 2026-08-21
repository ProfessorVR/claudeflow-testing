# Gold-Set Drift Log

Chronological log of convention-validation findings AND CONVENTIONS-edit events. Populated at the item-25 convention-validation checkpoint and at every subsequent every-25-items drift check (Type A), and at the time of CONVENTIONS.md edits triggered by annotation work (Type B).

Entries come in two types. Use the template matching the entry's purpose; do not mix the formats in a single entry.

---

## Entry Type A — Checkpoint findings

Used at item-25 convention-validation checkpoints (§8.1) and every-25-items drift checks (§8.2). One entry per checkpoint. Records drift findings, pattern-watch observations, and (at §8.1 only) edit-velocity review.

Format:

```
## YYYY-MM-DD — <item-N checkpoint | every-25 drift check>

- Finding: <description; link to file:line if possible>
- Action: <in-place correction | parking-lot escalation | CONVENTIONS edit | none>
- Pattern watch: <note if this is the Nth recurrence of a prior finding>
- Edit velocity (§8.1 only): <count and trend observation>
```

## Entry Type B — CONVENTIONS-edit event OR pattern watch

Used in two cases, both using the same pointer format:

- **CONVENTIONS-edit subtype.** A CONVENTIONS.md edit was made in response to annotation work. One entry per edit event (an "event" is a single batch of coordinated edits, not necessarily a single section change). Middle field = §-section refs.
- **Pattern-watch subtype.** An annotation surfaced a pattern considered for PL promotion but resisted (typically at n=1 or n=2, below the §7.1 ≥3-instance threshold), with a pre-registered re-evaluation trigger. Two middle-field subtypes per CONVENTIONS §8.0 step 3:
  - `pattern-watch — <pattern-name>` — registration entry; records the pattern and sets the trigger condition; does NOT count toward trigger.
  - `observation — <pattern-name>` — additional instance entry; counts toward trigger.
  
  Scanned at every checkpoint per `CONVENTIONS.md` §8.0 so trigger-firing is detected passively rather than by annotator memory. Re-evaluation triggers should take an explicit form such as "if ≥N additional cases by item M, promote to PL."

Pointer-style — records *what happened and why*, not the content of the change itself; canonical detail lives in the §3.2 row `Triggered by:` line, the git diff, or the annotation's notes field.

Format:

```
YYYY-MM-DD | <§-section-refs | pattern-watch — PATTERN_NAME | observation — PATTERN_NAME> | triggered by <item-id or description> | <one-line summary>
```

See `CONVENTIONS.md` §8 for checkpoint procedures (including §8.0 for the pattern-watch trigger scan with the canonical grep recipe) and §3.2 for parking-lot pattern rows.

---

<!-- Log entries begin below this line -->

2026-04-22 | §3.1, §3.2 (×2 rows), §7.1 | triggered by claim-aristotle-da-3.3-058 | parking-lot framing broadened for decided-vs-deferred PL entries; ontology-synonymy and object-of-type-canonicalization PL patterns added; umbrella-consolidation consideration added to PL→AF promotion governance.

2026-04-22 | §3.2 (×1 row), §5.4, §8.1, drift-log.md template | triggered by claim-aristotle-da-3.3-058 review | paraphrase-distortion PL pattern added (decided-deferred, prospective); §5.4 partial-faithfulness verification procedure added with two-file jq snippets and slug→path mapping note; §8.1 edit-velocity counter added to item-25 checkpoint; drift-log template split into Type A (checkpoint findings) and Type B (CONVENTIONS-edit events).

2026-04-22 | pattern-watch — slug-graveyard | triggered by claim-aristotle-da-3.3-007 | slug-graveyard pattern observed in ontology's Aristotelian arithmetic cluster (7 thin sibling slugs: number, numbers, plurality, discrete plurality, number of motion, number perception, perceiving number — all "Concept introduced via [author]" with no Greek, no aliases, no cross-linking); considered for PL promotion as candidate `ontology-slug-cluster` but resisted at n=1. No §3.2 edit made yet. **Re-evaluation trigger: if ≥2 more slug-graveyard cases surface by item 20, promote to PL pattern.** Likely recurrence loci: magnitude, continuity, motion (in Aristotelian-technical sense), quantity broadly.

2026-04-22 | §8.0 (new), §8.1 (velocity-counter clarification), drift-log.md Type B description | triggered by claim-aristotle-da-3.3-007 slug-graveyard pattern-watch | Type B broadened to cover two subtypes (CONVENTIONS-edit AND pattern-watch); new §8.0 "Pattern-watch trigger scans" added at items 10, 20, and every subsequent checkpoint with passive scan procedure + horizon-management closure rule; §8.1 edit-velocity counter clarified to exclude pattern-watch entries from the CONVENTIONS-edit count.

2026-04-22 | §3.0 (new) | triggered by claim-aristotle-da-3.3-007 | node-choice principle codified: prefer rich canonicals when available; thin slugs legitimate iff (a) concept-match at correct abstraction level and (b) no richer alternative; thinness is corroborative in rejection, not determinative. Motivates existing §3.2 patterns (ontology-synonymy, object-of-type-canonicalization) and provides the general rule behind the item-058 thin-slug acceptance and item-007 `number` rejection.

2026-04-22 | pattern-watch — AF5-subtype-proliferation | triggered by claim-aristotle-da-3.3-053 | AF5 surfaced three structurally-distinct subtypes in the first four items: elided-contrast (033:opinion — internal cue "merely" signals contrast with absent concept), analogical-target (007:Time, 007:discriminating-faculty — claim is freestanding assertion deployed analogically for concept elaborated elsewhere), definitional-target (053:Imagination — claim is one move in a definition whose definiendum is named in adjacent claims). AF5's slot-semantics ("concept implicit but not named") was correct but too abstract to anticipate these distinct mechanisms. Subtype proliferation in the first four items is expected behavior of a well-designed pattern-watch system — abstract flag definitions surface their hidden structure under corpus contact, which is what the re-evaluation trigger is for. Supersedes the item-007 analogical-target-AF5 pattern-watch. **Re-evaluation:** at item-25 convention-validation checkpoint, evaluate both parallel criteria: (1) structurally-distinct subtypes count (currently 3); if a fourth subtype emerges, splitting is forced. (2) total AF5 instances (currently 4 across 3 items); if ≥5, splitting evaluation is forced regardless of subtype count. If neither, evaluate whether the three stable subtypes warrant split anyway. **Candidate reconsiderations at checkpoint:** (i) split AF5 into AF5a/AF5b/AF5c with distinct slot-semantics per subtype; (ii) keep AF5 unified but require a subtype-tag in the concept slot (e.g., AF5:opinion(elided-contrast)); (iii) keep AF5 unified and introduce PL subtype markers as co-flags (e.g., AF5:opinion | PL:elided-contrast-af5) — architecturally distinct from (i) and (ii) in that subtype lives in the PL parking-lot layer rather than in the AF code structure, fits the locked PL semantics for "patterns that may or may not warrant their own codes later." **Back-sweep scope if split is adopted:** items currently carrying AF5 — 033 (elided-contrast:opinion), 007 (analogical-target:Time and analogical-target:discriminating-faculty), 053 (definitional-target:Imagination). Pre-computed now so back-sweep is mechanical rather than archaeological at item 25.

2026-04-22 | observation — slug-graveyard | triggered by claim-aristotle-da-3.3-033 | second slug-graveyard cluster discovered: opinion/belief/hupolepsis concept family (13 thin sibling slugs: belief, beliefs, conviction, doxa, doxastic state, doxastic states, doxazein, episteme, hupolepsis, hypolepsis, judgement, judgment, opinion, pistis — all "Concept introduced via [author]" with no Greek, no aliases, no cross-linking). Counts against the item-007 slug-graveyard pattern-watch trigger. Current observation count: 1 (of 2 needed to fire the trigger); one more instance by item 20 → promote to PL code via §7.1 governance.

2026-04-22 | §8.0 (middle-field rule + canonical recipe), drift-log.md entries 3, 6, 7 normalized, drift-log.md header template updated | triggered by question raised during item-033 commit review | §8.0 step 3 rewritten to specify middle-field canonical format (`pattern-watch — <name>` for registration, `observation — <name>` for additional instances) plus concrete grep recipe; three existing pattern-related entries retroactively normalized so the canonical grep recipe yields correct counts; drift-log.md Type B subtype description updated to match.

2026-04-22 | observation | triggered by 037 | §3.0 concept-match rule applied against paraphrase-broadening (not ontology-synonymy): claim_text "animals" broadens source θηρία; labeled brutes. Confirms §3.0 extends cleanly to paraphrase-surface-vs-source-concept cases. Prior §3.0 triggering cases (058's common sensibles vs koina, 033's opinion vs doxa) were "two ontology names for the same concept, pick one"; 037 is "the paraphrase uses a broader term than the source, label the source-concept." Functionally the same §3.0 principle but different triggering condition. Not a pattern-watch — just a trace entry confirming rule scope.

2026-04-22 | observation | triggered by 037 | AF5 near-miss evaluated: claim is part of passage-level definitional work on phantasia (DA 3.3), which matched the definitional-target-AF5 shape (item 053). Distinguished because 037 names Imagination in claim_text as the subject of the refutation; the unnamed argumentative content is propositional warrant + empirical fact, not an unnamed definiendum. Recorded as a decision boundary for the AF5 subtype-proliferation pattern-watch: definitional-target-AF5 requires the definiendum to be unnamed in claim_text, not merely for the claim to occur within a definitional passage. No AF5 flag on 037 itself.

2026-04-22 | pattern-watch — wrong-context-rich-canonical | triggered by claim-aristotle-da-3.3-039 | ontology mixes Aristotelian and post-Aristotelian (especially Heideggerian) technical concepts under the same English names; annotators working primary_aristotle must reject the modern-philosophy rich canonical in favor of Aristotelian thin slugs when the rich node's definition reveals a non-Aristotelian concept. Criterion: rich node exists with English-name match to the claim's concept; node's definition explicitly or implicitly invokes post-Aristotelian (usually Heideggerian) framing incompatible with the claim's Aristotelian deployment. Re-evaluation: at item-25 convention-validation checkpoint; promote to PL code if total instances ≥ 3. Retrospective observations logged separately for items 033 and 037.

2026-04-22 | observation — wrong-context-rich-canonical | triggered by claim-aristotle-da-3.3-033 | retrospective: Fear rich canonical rejected during 033 annotation (Heideggerian Furcht, not Aristotelian fearful-object). Logged retrospectively to make the instance countable under the item-039 wrong-context-rich-canonical pattern-watch per §8.0 middle-field-match rule.

2026-04-22 | observation — wrong-context-rich-canonical | triggered by claim-aristotle-da-3.3-037 | retrospective: "animal" rich canonical rejected during 037 annotation (Heideggerian-context slug, not Aristotelian animals/brutes). Logged retrospectively to make the instance countable under the item-039 wrong-context-rich-canonical pattern-watch per §8.0 middle-field-match rule.

2026-04-22 | observation — retrospective-logging-mechanism | triggered by wrong-context-rich-canonical pattern registration | first use of retrospective observation entries to make prior-item instances countable under a newly-registered pattern-watch. Procedure: register the pattern-watch with triggering case; log separate Type B observation entries for each retrospective instance, with trigger field citing the original item and prose field flagging the retrospective logging. §8.0 counter rule counts these normally via middle-field-match. Preserves the rule; avoids retrospective-promotion ambiguity. Worth considering for CONVENTIONS §7 formalization if the mechanism recurs.

2026-04-22 | §3.0 (rich-vs-strict tension corollary) | triggered by claim-heidegger-bcap-091 | added §3.0 corollary on rich-vs-strict concept-match tension: when a concept's surface name has both a rich framework-specific canonical AND a thin generic slug, default to rich-preferred unless the claim's deployment clearly exceeds the rich node's scope. Distinguishes from wrong-context-rich-canonical pattern (genre-mismatch) by addressing scope-exceedance within the right genre. Preserves thin-slug options (e.g., `human being`) for genuinely-broader deployments that do not engage the framework-specific rich structure.

2026-04-22 | observation — wrong-context-rich-canonical-framework-validity | triggered by first primary_heidegger item (claim-heidegger-bcap-091) | framework-validity confirmation: rich Heideggerian canonicals (Dasein, Being-in-the-world, Discourse) that were REJECTED as wrong-context on Aristotle items 033 (Fear), 037 (animal), 039 (Truth) are concept-correct when appearing in primary_heidegger claims. Confirms the wrong-context-rich-canonical pattern's scope as "wrong-context" (genre-sensitive, rejection depends on which genre's claim is being annotated) rather than "rich Heideggerian always wrong" (genre-blind). Distinct middle-field token ("...-framework-validity") excludes this entry from the strict §8.0 canonical recipe count of `wrong-context-rich-canonical` observations — this evidence informs pattern scope, it is not a rejection-behavior instance. Relevant at item-25 checkpoint when pattern is evaluated for PL promotion: the correct code name is "wrong-context-rich-canonical," not "rich-heideggerian-rejection" or similar, to preserve the genre-sensitive semantics.

2026-04-22 | observation | triggered by claim-heidegger-bcap-091 | §5.4 slug→path mapping gap: source file for Heidegger claims is at `data/corpus/index/heidegger-bcap-4-5/` but candidate's `.source.slug` is `heidegger-bcap` (no `-4-5` suffix). §5.4's current mapping rule covers dots-to-dashes (Aristotle case `aristotle-da-3.3` → `aristotle-da-3-3`) but not arbitrary subdirectory suffixes. Per-item verification here required checking filesystem directly (`find data/corpus/index -type d -name "*heidegger*"`). Trace entry — no immediate §5.4 edit; revisit the mapping rule if a third slug→path divergence appears.

2026-04-22 | observation | triggered by claim-heidegger-bcap-091 | `nearby_provenance` for Heidegger BCAP claims uses Aristotelian Bekker numbers (e.g., `1017b22` = Metaphysics V.7) because BCAP is a lecture course commentary on Aristotle. Novel provenance-locator situation: when a partial-faithfulness Heidegger claim requires §5.4 per-item verification, the Bekker anchor locates the Aristotelian passage being commented on, not the Heidegger lecture section. May require cross-referencing Aristotelian text rather than Heidegger's German original. Not activated on item 091 (supported faithfulness); flagged for future Heidegger items where partial-faithfulness triggers the procedure.

2026-04-22 | observation — drift-log-middle-field-rename | triggered by item-091 count-semantics flag | middle field of 091 entry renamed from observation-PLACEHOLDER (the base pattern token) to observation-PLACEHOLDER with `-framework-validity` suffix, so as to distinguish scope-confirmation evidence from rejection-instance count. Effect on §8.0 canonical recipe (exact middle-field match): 091 is now correctly excluded from the base-pattern instance count — count stays at 2 (the 033 and 037 retrospective instances) rather than inflated to 3. Umbrella retrieval across the pattern plus its framework-validity evidence remains available via a prefix-match grep (same recipe minus the trailing pipe-space terminator). No back-sweep needed (only 091 affected). Worth tracking as candidate §8.0 refinement if a third internal-structure-needs-distinct-token case appears — if so, formalize both the suffix-qualifier convention (`BASE-QUALIFIER`) and the dual-recipe pattern (exact for strict count, prefix for umbrella). **Note on this entry's prose**: concrete recipe-literal strings are replaced with PLACEHOLDER tokens so the entry itself does not match grep recipes targeting those patterns — same failure mode that required the drift-log.md header placeholder rename earlier.
