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

2026-04-22 | pattern-watch — analogical-target-AF5 | triggered by claim-aristotle-da-3.3-007 | analogical-target-AF5 is structurally distinct from elided-contrast-AF5 (033); both currently flagged AF5. Pattern-watch: if ≥2 more analogical-target cases appear by item 20, consider splitting AF5 into AF5a (elided contrast) and AF5b (analogical target), with back-sweep of 033 and 007.

2026-04-22 | observation — slug-graveyard | triggered by claim-aristotle-da-3.3-033 | second slug-graveyard cluster discovered: opinion/belief/hupolepsis concept family (13 thin sibling slugs: belief, beliefs, conviction, doxa, doxastic state, doxastic states, doxazein, episteme, hupolepsis, hypolepsis, judgement, judgment, opinion, pistis — all "Concept introduced via [author]" with no Greek, no aliases, no cross-linking). Counts against the item-007 slug-graveyard pattern-watch trigger. Current observation count: 1 (of 2 needed to fire the trigger); one more instance by item 20 → promote to PL code via §7.1 governance.

2026-04-22 | §8.0 (middle-field rule + canonical recipe), drift-log.md entries 3, 6, 7 normalized, drift-log.md header template updated | triggered by question raised during item-033 commit review | §8.0 step 3 rewritten to specify middle-field canonical format (`pattern-watch — <name>` for registration, `observation — <name>` for additional instances) plus concrete grep recipe; three existing pattern-related entries retroactively normalized so the canonical grep recipe yields correct counts; drift-log.md Type B subtype description updated to match.
