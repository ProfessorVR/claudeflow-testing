# `inspections/` — Artifact-type contract

**Status:** Created 2026-04-28 (Unit A, step 3b of dev-annotation execution plan)

---

## Purpose

The `inspections/` directory holds **structured pre-execution evidence reviews** of the dev-candidate pool (or any future structured pool of items requiring whole-pool inspection before annotation begins).

An inspection is distinct from:
- **An annotation** — which lives in `resolver-gold-{holdout,dev}.jsonl` and is per-item.
- **A drift-log entry** — which is a single observation/event recorded chronologically in `drift-log.md`.
- **A draft** — which lives in `drafts/` and stages CONVENTIONS-edit language pre-execution.

An inspection is a **whole-pool, decision-conditioned snapshot** taken at a §8.0 trigger scan or comparable structural moment, whose purpose is to inform a deferred-decision firing scope or to defend against selection bias before ordering is locked.

---

## When produced

- At a §8.0 trigger scan when the trigger is "evidence availability across the future pool" (e.g., item-20 trigger scan asking which item-25 codifications have sufficient precedent).
- At any comparable mid-stream moment when a deferred decision requires full-pool inspection rather than just trigger-count.
- Optionally, post-dev-50 final inspection comparable to the README §7 15-item spot-check (separate artifact, separate purpose).

---

## What counts as an inspection

A document with the following minimal shape:
1. **Trigger header** — date, trigger source, scope, purpose.
2. **Per-decision evidence availability** — for each deferred decision in scope, a structured summary of evidence count, type, and disposition (fire / defer-with-trigger / continue-waiting).
3. **Recommendation** — fire-list and defer-list with explicit trigger conditions for each deferral.
4. *(Optional)* **Footer meta-observations** — framework-level observations that arose during inspection. At n=1, footer is preferred over separate artifact (per Decision 1 of the locked execution plan).

---

## Naming convention

`inspections/{kind}-inspection-item-{N}.md` where:
- `{kind}` is the pool inspected (`dev-candidate`, `dev`, `holdout`, etc.)
- `{N}` is the item number that triggered the inspection (or `final` for post-completion)

Examples:
- `dev-inspection-item-20.md` — dev-candidate inspection triggered by item-20 §8.0 scan (current entry)
- *(future)* `dev-inspection-item-45.md` — mid-dev inspection if triggered
- *(future)* `dev-inspection-final.md` — post-dev-50 final inspection

---

## Retention policy

- Inspections are **append-only and permanent** within the gold-set artifact stack. They document the state-of-evidence at decision-firing time and are part of the audit trail.
- Updates to an inspection's findings (e.g., evidence count changed after re-inspection) use `[UPDATED YYYY-MM-DD: ...]` inline appendices, never overwrites.
- An inspection is *not* superseded by later inspections; multiple inspections coexist as historical decision-context.

---

## Index

| File | Date | Trigger | Scope |
|---|---|---|---|
| `dev-inspection-item-20.md` | 2026-04-22 (migrated 2026-04-28) | item-20 §8.0 trigger scan | All 150 dev candidates (45 primary_aristotle + 30 primary_heidegger + 45 secondary_phantasia + 30 secondary_non_phantasia); 7 deferred decisions |

---

## Relationship to validator

The validator (`scripts/validate-gold-notes.sh`) does not currently scan `inspections/`. Inspections are reference artifacts, not annotation-format artifacts; their format is structured-prose, not jsonl-with-fields. If validator extension to scan `inspections/` is later considered, it would check trigger-header completeness + recommendation presence, not annotation-level rules.

---

## Relationship to §8.1 edit-velocity counter

Inspection creation does **not** increment the §8.1 CONVENTIONS-edit velocity counter. Inspections are observational artifacts, not framework changes. Per the locked plan's Decision 5, this assumption will be grep-verified before extending the validator to scan `drafts/` (where the same assumption applies).
