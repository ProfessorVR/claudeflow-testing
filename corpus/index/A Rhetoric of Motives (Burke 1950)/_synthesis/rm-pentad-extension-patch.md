# RM Pentad-Extension Patch (deltas for the Grammar pentad manual)

**Pipeline**: Burke, *A Rhetoric of Motives* (1950).
**Generated**: 2026-05-27
**Target file (DO NOT EDIT from this pipeline)**: `corpus/index/A Grammar of Motives (Burke 1945)/_synthesis/gm-pentad-operationalization-manual.{md,json}`.
**Status**: **PATCH SPEC ONLY.** This document specifies the deltas to fold into the Grammar pentad manual when the Burke × Calleja integration is assembled (Plan Phase 2). It does **not** modify the Grammar manual file. Apply at integration time.

**Provenance.** Burke claims = `burke-direct` (book-page anchored, *Rhetoric of Motives*). Game/PIM/pentad mappings = `anticipatory-projection`.

**Three deltas:**
- **§I** — new **Attitude 6th-term entry** (to add to Grammar Section A, as A.6).
- **§II** — per-term updated **`forward_reference_to_rhetoric_of_motives_attitude`** content (now available; replaces the Grammar manual's forecast stubs in A.1–A.5 and the Section-E "Rhetoric-Attitude (future pipeline)" column).
- **§III** — **`consubstantiation_pipeline_status` → `"consolidated-via-RM-01"`** + the consolidated bridge replacing the Section-E `pending` stub.

Full detail for §I lives in `rm-attitude-as-sixth-term`; full detail for §III lives in `rm-identification-consubstantiation-manual` §D.

---

## §I — New Attitude 6th-term entry (add as Grammar Section A.6)

**Insertion point**: `gm-pentad-operationalization-manual.md`, after A.5 PURPOSE, as a new subsection **A.6 ATTITUDE (6th term)**. Mirrors the A.1–A.5 entry template (operational definition / question / paradigm examples / decision rules / Calleja mapping / Uexküll mapping / ontological target).

### A.6 ATTITUDE (6th term) — proposed entry

**Operational definition (≤70 w, burke-direct).** Attitude is the sixth dramatistic term — added by Burke himself (GM-09 1962 Addendum; operationalized in *A Rhetoric of Motives*). It names an **incipient act**: a disposition, leaning, or orientation toward action, not yet (or not necessarily) carried into overt conduct. It is the suspended/symbolic-rehearsal mode mediating between potency (*dynamis*) and full actualization (*energeia*), and it carries the affective/evaluative tone with which an act is (or would be) done.

**Question answered.** *In what disposition / with what orientation?* (a transverse question askable of any of the five placement-terms).

**Paradigm examples (burke-direct).**
- "attitude being an incipient act" — the poetic/scientific/rhetorical triad (RM-01 p.42).
- Avarice as the scenic word "property" translated into an agent's attitude (RM-01 p.24).
- Acting-together's shared "attitudes" that make men consubstantial (RM-01 p.21).
- Persuasion-to-attitude vs persuasion-to-action; attitude as "leaning or inclination" (RM-02 pp.50–51).
- "renunciation and advance fused in one attitude" — perpetual courtship (RM-06 p.251).
- Mountain-climbing as an "attitude" literally enacted (RM-07 p.302).
- Mystic "attitudinal glow" / "half-way status nascendi" (RM-07 pp.331–332).
- Standoffishness of pure persuasion as an attitudinal stance (RM-07 pp.269–271).
- (Grammar seeds) attitude as beginning of acts (GM-06 p.236, Mead); incipient action (GM-06 p.235, Richards); Urn-as-Attitude (GM-10 p.458).

**Decision rules (burke-direct).**
1. Disposition/orientation not yet issued in completed external conduct → Attitude (else Act). (RM-02 pp.50–51.)
2. Disposition deliberately or constitutively *held* without consummation → Attitude in the **suspended-act** sense (RM-06 p.251; RM-07 pp.331–332).
3. Vocabulary supplies the *disposition-with-which* rather than the *end-toward-which* → Attitude, not Purpose.
4. Term carries affective/evaluative tone coloring an act → Attitude as tonal modifier (RM-01 p.24; RM-03 p.91 censorial appellative).
5. Rhetoric/poetic aims at orientation only, demanding no overt act → persuasion-to-attitude (the more general target).

**Status as modifier, not box (burke-direct architecture).** Attitude is **transverse** to the five placement-terms — a *dispositional modifier* (the disposition-with-which) that can be asked of Act, Scene, Agent, Agency, or Purpose. Hence it is best represented as a **column across all five** (as in Grammar Section E) rather than as a sixth row in the ratio matrix. The per-term modifier content is in §II below.

**Calleja PIM mapping (anticipatory-projection).** **AFFECTIVE** (primary). Attitude captures the emotional-dispositional coloring of action; Calleja's Affective dimension is precisely the response-state dimension and already carries the Layer-B target "ATTITUDE (Burke's later sixth term)" (`ig-pim-operationalization-manual` §A.5/§E.1). Player-attitude register (competitive / completionist / explorer / devotional / ironic-meta) maps to Affective involvement (full table in `rm-attitude-as-sixth-term` §E).

**Uexküll mapping (anticipatory-projection).** ***Merktöne* / *Wirktöne*** (perception-tones / effect-tones) — consistent with the Calleja manual's Affective→Uexküll assignment; the dispositional/tonal coloring of perceived objects and effected actions.

**Ontological target (anticipatory-projection).** Aristotelian *pathē* (Rhetoric II) + the *hexis*/*dunamis* register (attitude as *dunamis-as-hexis*, a settled disposition-toward-act mediating potency and *energeia*). Cross-anchor: Gross 2017 *Uncomfortable Situations* (the Affective Layer-A bridge in the Calleja manual). Note: this is the ONE pentad term Burke himself supplements (GM-09 Addendum), so the Attitude entry is `burke-direct` in architecture even where its ontological grounding is anticipatory.

**Ratio note.** Attitude does not enter the Grammar's 10-ratio matrix as an eleventh term-pair; instead it modifies each existing ratio (an act-purpose ratio can be eager, reluctant, ironic, etc.). If the integration wants attitude-ratios, treat them as *modulations* of the existing ten, not as new pairs.

---

## §II — Per-term `forward_reference_to_rhetoric_of_motives_attitude` updates

The Grammar manual's Section A entries each carry a `forward_reference_to_rhetoric_of_motives_attitude` field written as a *forecast* ("the Rhetoric pipeline will require…"). Those forecasts are now **fulfilled**; replace each with the `burke-direct`-grounded content below. Likewise replace the Section-E integration table's "Rhetoric-Attitude (future pipeline)" column cells. (Source: `rm-attitude-as-sixth-term` §C.)

### II.1 ACT — replace forward-reference field with:

> **Attitude-modifier (fulfilled).** Attitude as **incipient-act sub-term / symbolic-rehearsal spectrum**. The Act is preceded and shadowed by its incipient form (RM-01 p.42); the same doing can be enacted in different attitudes, and some "acts" are attitudes literally enacted (mountain-climbing, RM-07 p.302; cf. GM-06 p.243 symbolic action as the incipient/attitudinal). `burke-direct` — Calleja: player readiness-to-move + theorycrafting/rehearsed play (Kinesthetic readiness; Ludic strategy-rehearsal). `anticipatory-projection`

### II.2 SCENE — replace forward-reference field with:

> **Attitude-modifier (fulfilled).** **Attitudinal-scene: situation-as-already-evaluated.** The scene is a *rhetorical scene of address* pre-loaded with evaluative tone — the "scenic word 'property'" carrying avarice (RM-01 p.24); the Urn-as-Attitude (GM-10 p.458). `burke-direct` — Calleja: gameworld encountered *as* already affectively coloured (atmospherics-as-affect; "I want to live there"). `anticipatory-projection`

### II.3 AGENT — replace forward-reference field with:

> **Attitude-modifier (fulfilled).** **Attitude as the agent's dispositional stance / identification-disposition.** Acting-together's shared *attitudes* make agents consubstantial (RM-01 p.21); the agent's stance toward co-agents is an incipient act of identification (RM-06 p.251). This term's forward-reference was already flagged the **LOAD-BEARING FORWARD-BRIDGE** to identification/consubstantiation — now consolidated (see §III). `burke-direct` — Calleja: player stance toward avatar/guild/co-players (Shared + Affective). `anticipatory-projection`

### II.4 AGENCY — replace forward-reference field with:

> **Attitude-modifier (fulfilled).** **Rhetorical-instrumentality of address (attitudinal use of means).** Means are deployed *in* an attitude — standoffish, eager, ceremonial; the censorial appellative is a tonal gesture (an attitude operating as instrument) (RM-03 pp.91, 98; RM-07 pp.269–271 standoffishness). `burke-direct` — Calleja: attitudinal coloring of control/rule-use; the standoffish element of skilled performance (Kinesthetic/Ludic; Performative). `anticipatory-projection`

### II.5 PURPOSE — replace forward-reference field with:

> **Attitude-modifier (fulfilled).** **Attitudinal-purpose: the end held in a disposition.** Ultimate vocabulary realigns "one's attitude toward the struggles of politics" (RM-05 p.188); a purpose is pursued *as* devotional, ironic, or completionist; pure persuasion is purpose held in perpetual standoffishness (RM-07 pp.269–274). The Grammar's "Calleja-incorporation parallel" note here is consolidated in §III. `burke-direct` — Calleja: the same goal pursued in different attitudinal registers (Ludic + Narrative + Affective). `anticipatory-projection`

### II.6 Section-E integration table — replace the "Rhetoric-Attitude (future pipeline)" column

| Pentad Term | Rhetoric-Attitude (CONSOLIDATED, replaces "future pipeline" cell) |
|---|---|
| **ACT** | Attitude as incipient-act sub-term; symbolic-rehearsal spectrum (RM-01 p.42; RM-07 p.302). `burke-direct` |
| **SCENE** | Attitudinal-scene: situation-as-already-evaluated (RM-01 p.24; GM-10 p.458). `burke-direct` |
| **AGENT** | Identification / consubstantiation as the agent's stance — **bridge CONSOLIDATED via RM-01** (see §III). `burke-direct` arch. / `anticipatory-projection` integration |
| **AGENCY** | Rhetorical-instrumentality of address; attitudinal use of means (RM-03 pp.91, 98; RM-07 pp.269–271). `burke-direct` |
| **PURPOSE** | Attitudinal-purpose; Calleja-incorporation parallel **CONSOLIDATED** (§III) (RM-05 p.188; RM-07 pp.269–274). `burke-direct` arch. |

Also update the Section-E "What each layer ADDS" row for "Rhetoric-Attitude (future)": its CONFLICTS cell ("none — supplementary by Burke himself") stays; change the label from "(future)" to "(consolidated — RM pipeline)".

---

## §III — `consubstantiation_pipeline_status` → `"consolidated-via-RM-01"`

The Grammar manual's Section E ("The incorporation ↔ consubstantiation bridge") carries:
- `consubstantiation_pipeline_status = "pending-future-rhetoric-of-motives-pipeline"`
- a **Blocker** note (the cell stating that *consubstantiation* is *Rhetoric of Motives* 1950 vocabulary rather than *Grammar* vocabulary, so the bridge could be flagged from the Grammar side but not consolidated until the Rhetoric pipeline was built).

**Delta.** The Rhetoric pipeline is now built. Apply the following replacement.

### III.1 Status flag

Set:
```
consubstantiation_pipeline_status = "consolidated-via-RM-01"
```

### III.2 Replace the Blocker note with a Consolidation note

> **Consolidation (RM-01 + RM-07).** The bridge is consolidated. RM-01 supplies the `burke-direct` textual ground the *Grammar* could only seed (GM-00 p.xix "A may become non-A … consubstantial with non-A"; GM-02 antinomy type-16 "consubstantial-substance"; GM-13 peripety): consubstantiation is defined at *Rhetoric* p.21 ("substantially one" yet "an individual locus of motives"; "both joined and separate"), act-grounded at p.21 ("substance … was an act; a way of life is an acting-together"), and declared compensatory to division at p.22. RM-07 supplies the apex (ultimate identification, pp.328–333). Full consolidated bridge: `rm-identification-consubstantiation-manual` §D. The Calleja-side "exegetically inadmissible" caveat (IG §B candidate bridge; §E.7) is **answered from the Burke side**: the bridge is now textually grounded in Burke even though Burke remains absent from Calleja — the homology is **functional, not lexical** (Burke's tension T2: substance abolished as term, retained as function).

### III.3 Replace/augment the bridge body with the consolidated homology + divergences

Replace the Grammar manual's three bullet-points ("Burke textual seeds / Calleja anchor / Blocker") with a pointer + the consolidated summary:

> **Consolidated homology (anticipatory-projection for the Calleja mapping; `burke-direct` for the Burke text).** Burke's consubstantiation is the rhetorical/symbolic homologue of Calleja's dual-axis incorporation (IG-10 p.169; rubric R1–R5):
> - Calleja **R1 assimilation** (environment INTO consciousness) ↔ Burke "A is substantially one with" the other (p.21).
> - Calleja **R2 embodiment** (player INTO environment via avatar = single systemically-upheld locus) ↔ Burke "yet remains an individual locus of motives … both joined and separate" (p.21).
> - Calleja **R3 simultaneity** ↔ Burke both-joined-AND-separate held simultaneously — one in act yet two in being (p.21).
> - Calleja **R4/R5 cornerstone + blending** ↔ Burke "acting-together makes men consubstantial" (consubstantiality is co-action, p.21).
> - Calleja **incorporation-at-its-fullest** ↔ Burke **ultimate identification** (RM-07 p.333).
>
> **Five divergences** (hold the bridge as homology not equation): (1) medium of union — symbolic-substance vs phenomenological-absorption; (2) ontological status — real-or-persuaded vs sustained-but-fleeting experiential state; (3) grounding theory — substance-metaphysics vs experientialist embodied cognition (NOT Merleau-Ponty/Heidegger); (4) directionality — asymmetrically-deployed vs insistently-bidirectional; (5) scope — society-wide + self-address + by-default vs bounded-to-ergodic-media. Detail: `rm-identification-consubstantiation-manual` §D.3.

### III.4 Update the Section-E "Forward-pipeline anchors" bullet

The Grammar manual lists:
> "**Rhetoric of Motives (1950) pipeline** will populate Manual Section A entries with Attitude-modifier slots; consolidate the consubstantiation bridge; activate the player-as-identifying-agent apparatus."

Change to (past tense, fulfilled):
> "**Rhetoric of Motives (1950) pipeline — DONE.** Section A entries' Attitude-modifier slots populated (§II); consubstantiation bridge consolidated (`consubstantiation_pipeline_status = "consolidated-via-RM-01"`, §III); player-as-identifying-agent apparatus active (`rm-identification-consubstantiation-manual` §A, §E). Sixth-term entry added as Grammar A.6 (§I)."

---

## Application note (for the integrator)

These three deltas are **non-destructive enrichments**: §I adds a subsection, §II replaces forecast text with fulfilled text in five existing fields + one table column, §III flips one status string and replaces one blocker note + bullet set. No Grammar pentad analysis (Sections B–D, ratios, worked examples, question battery) changes. Apply when assembling the integration (Plan Phase 2); until then the Grammar manual remains the v0 baseline and this file is the patch-of-record.

**Cross-references**: full Attitude detail → `rm-attitude-as-sixth-term`; full consolidated bridge → `rm-identification-consubstantiation-manual` §D.

---

*Content-filter compliance: PASS — all Burke prose paraphrased, no ≥25-word verbatim. Burke claims `burke-direct` (book-page anchored); all game/PIM/pentad mappings `anticipatory-projection`.*
