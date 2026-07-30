# Phase 2 — Bidirectional Crosswalk Validation

**Burke pentad (Grammar 1945 + Rhetoric 1950) × Calleja PIM (2011)**
**Date**: 2026-05-27 · **Plan**: `plans/burke-calleja-game-behavior-integration.md` Phase 2
**Output**: this report (warrants) + `validated-crosswalk.json` (canonical machine-readable grid consumed by the DIA method).

## 1. Inputs and method

Two independent anticipatory mappings already existed, each generated **one-directionally and without coordination**:
- **Burke → PIM** — `gm-pentad-operationalization-manual.md` §E (each pentad term → Calleja dimensions), plus the *Rhetoric* additions (`rm-attitude-as-sixth-term.md`; `rm-identification-consubstantiation-manual.md` §D–E).
- **PIM → Burke** — `ig-pim-operationalization-manual.md` §E.1 (each PIM dimension → pentad term).

Validation cross-checks the **two directions against each other** and against the source texts, classifying every candidate binding:

| Status | Meaning |
|---|---|
| `validated` | both directions assert the binding (or one asserts and the other's text plainly supports it) |
| `revised` | binding holds but must be rescoped (e.g. demoted primary→secondary) |
| `extended` | the *Rhetoric* pipeline adds a binding the Grammar-only pass could not |
| `rejected` | not warranted by either text |

## 2. Headline finding — independent convergence on a four-binding core

The two pipelines, authored separately, **converge on a stable bijective core of four primary bindings.** Convergence from incommensurable starting points (Burke's grammar of motives; Calleja's phenomenology of involvement) is strong evidence these bindings are *structural*, not projection artifacts:

| Burke motive term | Calleja involvement dim. | Both directions? | Strength |
|---|---|:--:|---|
| **Scene** | **Spatial** | ✅ ✅ | primary — strongest |
| **Agent** | **Shared** | ✅ ✅ | primary (deepened by consubstantiation) |
| **Agency** | **Kinesthetic** | ✅ ✅ | primary |
| **Attitude** | **Affective** | ✅ ✅ | primary — `extended` (new term from *Rhetoric*) |

That **Attitude↔Affective** appears in *both* tables is notable: the Calleja pipeline assigned its Affective dimension the Layer-B target "ATTITUDE (Burke's later sixth term)" **before** the *Rhetoric* pipeline existed to supply it; the *Rhetoric* pipeline then independently derived Attitude as the disposition-term mapping to Affective. The two halves of the bridge were built toward each other blind and met exactly.

## 3. Full validation table

`B→C` = asserted in the Burke→PIM table; `C→B` = asserted in the PIM→Burke table.

| # | Binding | B→C | C→B | Status | Warrant (Burke `burke-direct` / Calleja) |
|---|---|:--:|:--:|---|---|
| 1 | Scene ↔ Spatial | ✅ (primary) | ✅ | **validated** | Scene = "container of the act"/place-as-inhabited (GM §A.2); Spatial = environment internalized as habitable place (IG §A.2, §E.1 "place-as-inhabited is the Burkean Scene") |
| 2 | Agent ↔ Shared | ✅ | ✅ | **validated** | Agent + co/counter-agent (GM §A.3); Shared = cohabitation/cooperation/competition (IG §A.3, §E.1 "other agents populate the dramatistic field") |
| 3 | Agency ↔ Kinesthetic | ✅ (primary) | ✅ | **validated** | Agency = means/instrument (GM §A.4); Kinesthetic = control as motor-mediation (IG §E.1 "cleanest pentad mapping … symbolic/mimetic/symbiotic continuum is a typology of Agency") |
| 4 | Attitude ↔ Affective | ✅ (RM) | ✅ | **validated + extended** | Attitude = incipient act / disposition-with-which (RM-01 p.42; `rm-attitude` §A); Affective = emotional-dispositional response-state (IG §A.5, §E.1) |
| 5 | Act ↔ Ludic | ✅ | ✅ | **validated** | Act = actualization of a plan into an executed doing (GM §A.1); Ludic = choice-and-repercussion (IG §A.6 / §E.1 "Ludic → Purpose + Act") |
| 6 | Act ↔ Narrative | ✅ | ✅ | **validated** | Act/plot as foremost element (GM §A.1, Burke on *Poetics*); Narrative = scripted + alterbiographic sequence of acts (IG §E.1 "Narrative → Act + Purpose") |
| 7 | Purpose ↔ Ludic | ✅ | ✅ | **validated** | Purpose = the *why*/telos (GM §A.5); Ludic goals (IG §E.1 "Ludic → Purpose + Act") |
| 8 | Purpose ↔ Narrative | ✅ | ✅ | **validated** | Purpose as end pursued through act (GM §A.5); Narrative arc/teleological closure (IG §E.1 "Narrative → Act + Purpose") |
| 9 | **Agency ↔ Ludic** | ✅ (rules-as-means) | ✗ (routes Ludic→Purpose+Act) | **revised → split** | See §4. Genuine divergence, resolved by splitting the Ludic dimension. |
| 10 | Act ↔ Kinesthetic | ✅ (secondary, "physical-input pole") | ✗ (routes Kinesthetic→Agency) | **revised → secondary** | Kinesthetic is *primarily* Agency (binding 3); its tie to Act is the secondary execution-pole only. |
| 11 | Scene ↔ Kinesthetic | ✅ (secondary, "body-in-space") | ✗ | **revised → secondary** | Weak; retained only as the bodily-orientation residue of Scene. |
| 12 | Purpose ↔ Affective | ✅ | ✗ (routes Affective→Attitude) | **revised → secondary** | Affective is *primarily* Attitude (binding 4); Purpose's affective tie (mastery/regulation drive) is secondary. |

## 4. The one productive divergence — the Ludic split (binding 9)

The single genuine disagreement: Burke maps **Agency → Ludic** ("rules-as-means," GM §A.4), while Calleja routes **Ludic → Purpose + Act** ("choice-and-repercussion," IG §E.1). Both are textually warranted, so neither is rejected. The integration **resolves the divergence by splitting the Ludic dimension along Burke's own Agency/Act distinction**:

- The **rule-*system*** (mechanics, cooldowns, economy, the instrument the player wields) = **Agency** — Burke is right that rules are *means*.
- The **act of choosing-under-repercussion** (the player's weighed decision and its consequence) = **Act + Purpose** — Calleja is right that the *lived ludic experience* is choosing toward ends.

This is not a contradiction patched over but a **refinement the fusion produces that neither framework states alone**: Calleja's single "Ludic" dimension is dramatistically *two* moments (instrument vs. choosing), and Burke's pentad supplies the cut. The DIA method (Phase 3) operationalizes this as two distinct grid cells.

## 5. Secondary-tie demotions (bindings 10–12)

Three Burke→PIM ties are asserted in only one direction and are demoted to `secondary` rather than rejected, because the source text supports a weak version:
- **Act ↔ Kinesthetic** — kept as the *physical-execution pole* of Act (motor output), subordinate to Agency↔Kinesthetic.
- **Scene ↔ Kinesthetic** — kept as the *bodily-orientation residue* of Scene (the body as it is positioned in space), weak.
- **Purpose ↔ Affective** — kept as the *mastery/affect-regulation* drive behind a goal, subordinate to Attitude↔Affective.

Secondary ties remain in the grid (the DIA method may invoke them) but never as a cell's primary reading.

## 6. Rejected bindings: none

**No candidate binding was rejected.** Every anticipatory mapping in both tables found at least partial textual warrant. Zero rejections across ~15 candidate bindings — generated independently from two directions — is itself the strongest single piece of evidence that the pentad×PIM crosswalk tracks a real structure rather than a forced analogy.

## 7. The keystone binding — Consubstantiation ↔ Incorporation

Beyond the term-by-dimension grid sits the **synthesis-level binding** that the whole integration turns on:

- **Consubstantiation** (Burke, RM-01 p.21: "substantially one … yet a distinct locus of motives — both joined and separate") ↔ **Incorporation** (Calleja, IG-10 p.169: assimilation axis R1 + embodiment axis R2 + simultaneity R3).
- **Status: `validated` — and now `burke-direct` grounded.** Previously this bridge was flagged `pending-future-rhetoric-of-motives-pipeline` (Grammar side) and "exegetically inadmissible" (Calleja side). The *Rhetoric* pipeline (RM-01) supplies the missing `burke-direct` text; `rm-identification-consubstantiation-manual.md` §D consolidates the three-alignment homology (substantially-one→assimilation; distinct-locus/avatar→embodiment; both-joined-and-separate→simultaneity) and the **five divergences** (medium / ontological status / grounding theory / directionality / scope) that keep it a homology, not an equation.
- The keystone is the **vertical** binding (synthesis-construct level); bindings 1–8 are the **horizontal** term-by-dimension grid. The DIA method reads both.

## 8. Canonical output

The machine-readable grid the DIA method consumes is `validated-crosswalk.json` (this directory): the four-binding core, the four-validated Act/Purpose↔Ludic/Narrative cluster, the Ludic split, the secondary ties, and the keystone — each with status and both-side warrants.

*Provenance: the pentad↔PIM bindings are `anticipatory-projection` (neither author makes the cross-claim); the validation upgrades their epistemic status from "one-directional guess" to "bidirectionally warranted," but they remain dissertation projections, not claims by Burke or Calleja.*
