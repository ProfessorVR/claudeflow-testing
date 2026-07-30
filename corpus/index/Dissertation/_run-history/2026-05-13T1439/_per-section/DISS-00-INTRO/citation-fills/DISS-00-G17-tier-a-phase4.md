# DISS-00-G17 — Tier A Citation-Fill (Phase 4 — §1.0 A_n-naming canonical-convention adoption per INCONS-001)

**Gap ID**: DISS-00-G17 (new — addresses INCONS-001 / INCONS-004 cascade)
**Section**: DISS-00-INTRO (§1.0)
**Severity**: CRITICAL (per INCONS-001 architectural)
**Support tier**: T4 / T5
**Tier**: A_corpus_index (cross-section reconciliation, not external corpus)

## 1. Claim and anchor

Per `inconsistencies-and-fallacies.json` INCONS-001 and INCONS-004, §1.0 has three inconsistent A_n labelings co-existing:
- (a) §1.0 PROSE: A_3 = phantasma proper, A_4 = completed cognitive actuality (line 45)
- (b) §1.0 DIAGRAM + §1.5 + canonical HTML: A_2 = phantasma proper, A_3 = branching cognitive actualities, A_4 = completed action (praxis)
- (c) A covert third convention introduced by §1.0 line 64's internal contradiction

The remediation: adopt convention (b) — the DIAGRAM convention — chapter-wide.

## 2. Tier A loci — the canonical diagram structure

**Pipeline**: `corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-DIAG-V7/`
**Unit**: `phase2-node-audit.json`

The canonical_diagram_structure.actuality_nodes specification:
- A_0 = Motion and Time horizon
- A_1 = Completed Perception
- A_2 = Phantasma Proper
- A_3 = Branching Cognitive Actualities
- A_4 = Completed Action (praxis)

## 3. Patches (edit-ready) — per INCONS-001 remediation

### Patch 1: §1.0 line 45 prose

```latex
OLD:
A_4 = completed cognitive actuality produced when the rational cognitive 
apparatus engages the phantasma

NEW:
A_3 = completed cognitive actuality (phantasma under three orientational 
modes + doxa); A_4 = completed action (praxis)
```

### Patch 2: §1.0 line 64

```latex
OLD:
A_2 → A_3 = the actualization of the completed cognitive actuality (C080)

NEW:
A_2 → A_3 = the cognitive engagement of the phantasma (its actualization 
under the three orientational modes — intellection, memory, deliberative 
phantasia — with doxa-orthogonal-committal-layer; cf. §1.3)
```

### Patch 3: §1.0 line 68

```latex
OLD:
M_3 → A_4 = the cognitive engagements of the phantasma (C091)

NEW:
M_3 → A_4 = the orectic motion to action (the transition from completed 
cognitive actuality at A_3 through orexis-discharge to overt bodily 
action at A_4)
```

### Patch 4: §1.3 cascade fix

§1.3 prose has shifted numbering by +1 relative to the diagram (per INCONS-001 finding). After §1.0 lines 45/64/68 are corrected, §1.3 references to A_n should be swept for consistency with the diagram convention.

## 4. Cascade to §§1.1, 1.2, 1.4, 1.5

Convention (b) is already used by §1.5 (per its explicit narrative). Once §1.0 prose is fixed, §§1.1–1.4 should be swept for any remaining (a)-convention references and updated to (b).

## 5. Diagram-prose verification

Per INCONS-001 remediation step (5): verify that §1.0 embedded TikZ labels match the rewritten prose. The diagram is already at (b); the prose just needs to be migrated.

## 6. Affected claims

Per INCONS-001 affected_claims list: DISS-00-C074, DISS-00-C080, DISS-00-C091, DISS-00-C092, DISS-03-C026, DISS-03-C076, DISS-05-C017, DISS-05-C033.

## 7. Status

Tier A "fill" is architectural rather than citation-bearing: the resolution is a coordinated edit of §1.0 prose to align with the canonical diagram convention. The patches above are edit-ready for Phase 5.
