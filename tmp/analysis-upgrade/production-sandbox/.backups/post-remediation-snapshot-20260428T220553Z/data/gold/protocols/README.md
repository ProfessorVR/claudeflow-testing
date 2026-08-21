# `protocols/` — Artifact-type contract

**Status:** Created 2026-04-28 (Remediation Phase 1; v4 plan-critique convergence).

---

## Purpose

The `protocols/` directory holds two distinct artifact types:

1. **Persistent discipline documents** (versioned): general-purpose annotation/methodology disciplines used across multiple events. Versioned via `-v1`, `-v2`, ... suffix; each version stays as historical reference; new versions supersede via cross-reference linkage.
2. **One-time event records** (dated): records of specific events such as remediations, governance reviews, or methodology corrections. Named with date suffix (e.g., `remediation-2026-04-28.md`); each is its own event record; no superseding.

---

## Discipline-document version protocol

- Pre-codification working version: `<discipline-name>-v1.md`
- Item-25 (or other codification cycle) produces `<discipline-name>-v2.md` (or extracts the discipline into CONVENTIONS § with v1 retained as the working draft that informed the codification)
- v1 stays as historical reference; v2 supersedes via cross-reference linkage in v2's header
- v1 is NOT deleted — it remains as the document that informed the formalization

---

## Event-record naming convention

`{event-kind}-YYYY-MM-DD.md` where:
- `{event-kind}` is the event's nature (`remediation`, `governance-review`, etc.)
- `YYYY-MM-DD` is the event's start date

Each event record is one-time. Future events of the same kind produce new dated files. No superseding.

---

## Index

| File | Type | Date / Version | Purpose |
|---|---|---|---|
| `README.md` | artifact-type contract | n/a | this document |
| `candidate-enumeration-protocol-v1.md` | persistent discipline | v1 (pre-item-25 working version) | six-check protocol for candidate enumeration during annotation |
| `remediation-2026-04-28.md` | one-time event record | 2026-04-28 | dev-3/4/5 ontology-source error remediation; methodology-error documentation + verification audit summary |

---

## Relationship to other artifact-type directories

- `data/gold/inspections/` — structured pre-execution evidence reviews (whole-pool inspections at trigger scans)
- `data/gold/drafts/` — pre-staged CONVENTIONS-destined codification language (with em-dash discipline per validator Check 5)
- `data/gold/protocols/` — persistent disciplines + one-time event records (this directory)

The three directories partition by purpose: inspections are evidence, drafts are codification candidates, protocols are operative disciplines + their event-records.

---

## Validator interaction

The validator (`scripts/validate-gold-notes.sh`) currently does NOT scan `protocols/`. Consider extending Check 5 (or adding Check 6) to scan `protocols/*.md` for em-dash discipline at item-25 codification. For now, em-dash discipline applied by hand during protocol authoring.
