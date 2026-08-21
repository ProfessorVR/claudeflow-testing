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

## Entry Type B — CONVENTIONS-edit event

Used whenever a CONVENTIONS.md edit is made in response to annotation work. One entry per edit event (an "event" is a single batch of coordinated edits, not necessarily a single section change). Pointer-style — records *what changed and why*, not the content of the change itself; canonical detail lives in the §3.2 row `Triggered by:` line or the git diff.

Format:

```
YYYY-MM-DD | <§-section-refs> | triggered by <item-id or description> | <one-line summary pointing at sections edited>
```

See `CONVENTIONS.md` §8 for checkpoint procedures and §3.2 for parking-lot pattern entries.

---

<!-- Log entries begin below this line -->

2026-04-22 | §3.1, §3.2 (×2 rows), §7.1 | triggered by claim-aristotle-da-3.3-058 | parking-lot framing broadened for decided-vs-deferred PL entries; ontology-synonymy and object-of-type-canonicalization PL patterns added; umbrella-consolidation consideration added to PL→AF promotion governance.

2026-04-22 | §3.2 (×1 row), §5.4, §8.1, drift-log.md template | triggered by claim-aristotle-da-3.3-058 review | paraphrase-distortion PL pattern added (decided-deferred, prospective); §5.4 partial-faithfulness verification procedure added with two-file jq snippets and slug→path mapping note; §8.1 edit-velocity counter added to item-25 checkpoint; drift-log template split into Type A (checkpoint findings) and Type B (CONVENTIONS-edit events).
