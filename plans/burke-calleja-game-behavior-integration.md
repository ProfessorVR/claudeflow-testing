# Analysis & Integration Plan: Burke Pentad × Calleja PIM → A Unified Method for Analyzing User Behavior in Video-Game Environments

**Date**: 2026-05-27
**Plan version**: v1
**Models on**: `plans/grammar-of-motives-burke-1945-analysis.md` (v1) + `plans/in-game-calleja-2011-analysis.md` (v3)
**Prerequisite pipeline output root**: `corpus/index/A Rhetoric of Motives (Burke 1950)/`
**Core deliverable output root**: `corpus/index/Game-Behavior Analysis Method (Burke × Calleja)/`
**Final artifact**: a reading-formatted **PDF** of the unified method + worked example

**User-locked decisions (2026-05-27)**:
- **Build the integration (not a re-analysis).** The Burke pentad and Calleja PIM are already analyzed; their reciprocal mapping already exists at the *anticipatory* level. This plan promotes the parked cross-pipeline integration into a **single, validated, runnable method** for analyzing user behavior in a video-game environment.
- **Frame narrowly by use.** The integration is framed end-to-end by its application: *analyzing user behavior in games.* It must yield (a) a **detailed method of analysis** and (b) an **explicit real-world worked example** showing how it is applied and to what ends.
- **Rhetoric of Motives (1950) pipeline FIRST** (prerequisite). It unlocks *Attitude* as the 6th dramatistic term and — decisively — *identification / consubstantiality*, the motive-mechanism underlying Calleja's *incorporation*. Without it the keystone bridge stays blocked.
- **Output = corpus-index synthesis manual + a polished PDF.**
- **Ontological-hierarchy wiring DEFERRED.** The A₀→A₄ "Actualization of Desire" chain is still in development; the framework leaves an explicit, stubbed hook for that wiring but does not attempt it now.

---

## 0. Provenance — what already exists (do NOT rebuild)

| Asset | Location | Status |
|---|---|---|
| Calleja *In-Game* PIM pipeline (6 dims × macro/micro + incorporation) | `corpus/index/In-Game (Calleja 2011)/` | ✅ complete; `ig-pim-operationalization-manual.md` carries Burke as "Layer B" |
| Burke *Grammar of Motives* pentad pipeline (5 terms + 10 ratios + tropes) | `corpus/index/A Grammar of Motives (Burke 1945)/` | ✅ complete; `gm-pentad-operationalization-manual.md` carries Calleja-PIM mappings in Section E |
| Anticipatory pentad↔PIM crosswalk | Both manuals' Section E | ⚠️ **one-directional, `provenance="anticipatory-projection"`, declared "COMPLEMENTARY rather than UNIFIED"** |
| *Rhetoric of Motives* (1950) | `corpus/.../A Rhetoric of Motives_(1950)_[My Copy].pdf` (+ text-cache) | ❌ **no index** — this plan builds it |
| *War of Words* (2018) | `corpus/.../The War of Words_(2018)_[My Copy].pdf` | ❌ no index — out of scope (future) |

**The three deltas this plan closes:**
1. **Validation.** Promote the anticipatory crosswalk to a **bidirectionally validated** crosswalk (warranted against both source texts), turning "complementary" into "unified."
2. **The keystone.** Build the *Rhetoric* pipeline so *incorporation↔consubstantiation* and *Attitude* enter the apparatus as real, text-anchored constructs rather than `pending-future-pipeline` stubs.
3. **A runnable method + proof.** Produce a step-by-step analytic procedure and apply it to a real game episode end-to-end.

---

## 1. Why this work, why now

Calleja's PIM answers **"what is the player doing — structurally?"** (six involvement dimensions × macro/micro phase: a phenomenology of engagement). Burke's pentad answers **"why — under what grammar of motive?"** (Act/Scene/Agent/Agency/Purpose [+Attitude] + the dyadic ratios: a grammar of motives). Each is incomplete for **behavioral** analysis:

- PIM can say a player is intensely *ludically + kinesthetically* involved, but not toward what motive or why the behavior takes the shape it does.
- The pentad can name the motive grammar (e.g. a dominant *agency-purpose* ratio where means become ends), but not the structural texture of involvement through which that motive is lived.

Fused, they yield a **behavioral diagnosis neither produces alone** — e.g. *"this player's grind (high ludic-micro involvement) is driven by an agency-purpose collapse (the grind became its own purpose), afforded by a scene of endlessly repeatable acts, and sustained by consubstantial identification with the guild (shared involvement)."* That is the payoff the dissertation's game-analysis layer needs, and it is precisely what does not yet exist.

---

## 2. The integration thesis (the two-axis apparatus)

The method is a **dual-axis grid** — call it **Dramatistic-Involvement Analysis (DIA)**:

- **Axis M (Motive — Burke):** 6 terms = Act · Scene · Agent · Agency · Purpose · **Attitude** (the *Rhetoric*/1962 6th term) + the 10 dyadic ratios as the **dynamics layer** + **identification/consubstantiation** as the integrative keystone.
- **Axis I (Involvement — Calleja):** 6 dimensions = Kinesthetic · Spatial · Shared · Narrative · Affective · Ludic, each × **macro/micro** phase.
- **The crosswalk (validated in Phase 2)** binds each motive term to the involvement dimension(s) through which it is enacted. The cell `(M-term × I-dimension × phase)` is the atomic unit of analysis; the **ratios** describe motion *between* cells; **incorporation = the consubstantiation of player-substance with the gameworld**, readable across the whole grid.

```
                 INVOLVEMENT (Calleja) →
                 Kines.  Spatial  Shared  Narr.  Affect.  Ludic   (× macro/micro)
MOTIVE   Act      ·        ·         ·       ●       ·        ●
(Burke)  Scene    ·        ●         ·       ·       ·        ·
   ↓     Agent    ·        ·         ●       ·       ·        ·
         Agency   ●        ·         ·       ·       ·        ●
         Purpose  ·        ·         ·       ●       ●        ●
         Attitude ·        ·         ·       ·       ●        ·    ← from Rhetoric pipeline
         (●  = primary anticipated binding, to be validated/revised in Phase 2)
```

---

## 3. Inputs inventory

- **Existing manuals (read-only inputs):** `gm-pentad-operationalization-manual.{md,json}`; `gm-ratio-catalog.{md,json}`; `ig-pim-operationalization-manual.{md,json}`; both Section E integration tables.
- **New primary source:** *A Rhetoric of Motives* (1950), 356 PDF pp.; plain-text cache at `tmp/Dissertation/Pathe/citations/text-cache/Burke__Kenneth_-_A_Rhetoric_of_Motives__1950___My_Copy_.txt` (usable for offset-free structure mining).
- **Tooling (verified present):** `pdftotext`, `pdfinfo`, `pdflatex`, `xelatex`, `mmdc`, `weasyprint`; repo scripts `scripts/html-to-pdf.mjs`, `scripts/generate-dissertation-pdf.mjs`, `scripts/compile-corpus-index.py`.

---

## 4. Phase 1 — *Rhetoric of Motives* (1950) pipeline (PREREQUISITE)

Same 5-sub-phase FENRIR pipeline as the Grammar/Calleja plans, scoped to what the integration needs: **identification, consubstantiality, and Attitude.** (This is a prerequisite, not the centerpiece — kept proportionate.)

### 4.1 Volume profile (offsets to be verified in sub-phase 0)
| Item | Value |
|---|---|
| Author / Year | Kenneth Burke / 1950 (UC Press ed.) |
| PDF pages | 356 |
| Structure | Intro + **Part I: The Range of Rhetoric** + **Part II: Traditional Principles of Rhetoric** + **Part III: Order** |
| Keystone locus | Part I — "Identification and 'Consubstantiality'" |
| Density check | "identification" ≈157 hits; "consubstantial*" ≈17 hits (text-cache) |

### 4.2 Provisional unit table (Phase-0 verifies titles + offsets)
| Unit | Heading | Role |
|---|---|---|
| RM-00 | Introduction | Rhetoric as identification; "old" vs "new" rhetoric |
| RM-01 | Part I — Identification & "Consubstantiality" | **LOAD-BEARING / triple-pass** — the keystone for incorporation↔consubstantiation |
| RM-02 | Part I — Property / "Autonomy" / Rhetoric of Address / Primitive Magic | identification's reach; the "autonomous"; address-to-the-individual-soul |
| RM-03 | Part II — Rhetoric redefined; Rhetorical Form in the Large | persuasion, the "you and I," form as appeal |
| RM-04 | Part II — Bentham / Marx / Veblen / Empire applications | Burke's applied rhetorical analyses (method templates) |
| RM-05 | Part II/III — Courtship (Castiglione / Kafka); "Mystery"; Hierarchy | **courtship + mystery + social hierarchy** = the social-motive apparatus |
| RM-06 | Part III — Order: Positive / Dialectical / Ultimate Terms; the Negative | terministic hierarchy of motive |
| RM-07 | Part III — Order, the Secret, and the Kill; Pure Persuasion | the culmination; "pure persuasion" limit-case |

Triple-pass: **RM-01** (+ RM-05/RM-07 extended budget). Appendix/notes mined for terminology only.

### 4.3 Controlled-vocabulary additions (cluster-specific)
`RHETORIC-CONCEPT` (identification, consubstantiality, courtship, mystery, hierarchy, the negative, pure persuasion, terministic screen) · `RHETORICAL-MOTIVE` · reuse `PENTAD-TERM` for **Attitude** as first-class 6th term · new edges `identifies-with`, `consubstantial-with`, `mediates-pentad-as-attitude`, plus the standard `bridges-to-pipeline`.

### 4.4 Core deliverables (Phase-3 synthesis)
- **`rm-identification-consubstantiation-manual.{md,json}`** — operationalizes identification + consubstantiality **for player behavior**: identification with avatar / character / guild / faction / playerbase; consubstantiation as the **motive-mechanism of Calleja's incorporation**; courtship/mystery/hierarchy as the social-motive engine of multiplayer behavior.
- **`rm-attitude-as-sixth-term.{md,json}`** — *Attitude* as incipient/suspended act; how it modifies each of the 5 Grammar terms; the player-attitude register (competitive / completionist / explorer / devotional / ironic-meta).
- **`rm-pentad-extension-patch.{md,json}`** — the deltas to fold back into the Grammar pentad manual (Attitude entries + the now-unblocked consubstantiation bridge).
- Standard set (book-level ontology, global edges, terminology, cross-pipeline graph incl. Calleja PIM + Grammar nodes).

**Provenance discipline:** identification/consubstantiation = **`burke-direct`** (Burke's own claims). Their *application to games* = **`anticipatory-projection`**. Same labeling as the existing manuals.

---

## 5. Phase 2 — Bidirectional crosswalk validation

The existing pentad↔PIM mappings are one-directional guesses. Validate each `(pentad-term → PIM-dimension)` and `(ratio → PIM-dimension-pair)` mapping **against both source texts** (Burke Grammar+Rhetoric *and* Calleja), classifying each:

- `validated` — both texts support the binding (cite both sides);
- `revised` — binding holds but needs re-scoping (record the correction);
- `rejected` — projection not warranted (record why);
- `extended` — Rhetoric adds a binding the anticipatory pass missed (esp. Attitude→Affective, identification→Shared/Narrative).

**Output:** `validation-report.md` (warrant per cell, both-sides citations) + `validated-crosswalk.json` (the canonical grid the method consumes). This is the step that earns the word "unified."

---

## 6. Phase 3 — Unified Game-Behavior Analysis Framework (CORE DELIVERABLE)

`corpus/index/Game-Behavior Analysis Method (Burke × Calleja)/game-behavior-analysis-method.{md,json}`. Six parts:

- **Part A — Theoretical integration.** The two-axis apparatus; what each axis contributes; why behavior needs both; the role of ratios (dynamics) and identification/consubstantiation (the integrative keystone). Explicit statement of where the frameworks *conflict* (Calleja phenomenological-experiential vs. Burke grammatical-rhetorical) and how the method holds the tension without collapsing it.
- **Part B — The unified grid.** The validated `6 motive terms × 6 involvement dimensions × macro/micro` matrix (from Phase 2), with the ratios as inter-cell dynamics and incorporation/consubstantiation as the cross-grid reading.
- **Part C — THE METHOD (step-by-step protocol).** The runnable procedure (see below). Inputs → steps → output (a structured "DIA report" + a filled grid).
- **Part D — Analytic-question battery.** Merged + de-duplicated from both manuals' Section D, reorganized by the unified grid, plus new integration- and identification-level questions.
- **Part E — Ends & use-cases.** What the method reveals that neither framework alone does: (1) game-design critique (diagnosing compulsion loops / dark patterns as agency-purpose collapse); (2) player-experience research; (3) explaining social/identity behavior (toxicity, guild attachment, betrayal) via identification/consubstantiation; (4) comparative analysis across games.
- **Part F — Ontological grounding [DEFERRED — STUB].** A reserved hook: a table of per-term `ontological_target` slots (Act↔*energeia*, Scene↔*In-der-Welt-sein*, …) left **empty/parked**, with a note that wiring into the A₀→A₄ Actualization-of-Desire chain is future work. No content generated now.

### The Method (Part C) — Dramatistic-Involvement Analysis (DIA)
**Input:** a documented player episode — play-trace/recording + observation; optional think-aloud/interview; community/forum context for the macro phase.

0. **Scope & circumference** — set the episode boundary (session / incident / campaign / career) and the "representative anecdote" (Burke's circumference × Calleja's unit-of-analysis).
1. **Involvement profile (Axis I)** — map the 6 dimensions × macro/micro: presence, intensity, internalization trajectory. *(What is the player doing, structurally?)*
2. **Motive grammar (Axis M)** — fill the 6 pentad terms for the episode; identify the **featured** term(s). *(Why — under what grammar?)*
3. **Ratio dynamics** — identify the operative ratios (scene-act, act-agent, agency-purpose…); name the **dominant** ratio and what the player attributes their behavior to.
4. **Crosswalk binding** — use `validated-crosswalk.json` to bind motive to involvement (the two axes fuse here into one account).
5. **Identification & consubstantiation** — analyze identifications (avatar / character / guild / faction / playerbase) and where consubstantiation occurs; read incorporation as its limit.
6. **Attitude** — identify the player's incipient/suspended acts and overall stance (the mediating 6th term).
7. **Diagnosis & ends** — synthesize into a behavioral diagnosis and apply to the chosen end (Part E).

**Output:** a structured DIA report + a filled grid + a one-paragraph diagnosis.

---

## 7. Phase 4 — Real-world worked example

Run the Part C method end-to-end on **one real game episode**, showing every step and the resulting diagnosis (the "explicit real-world example… and to what ends").

**Recommended primary:** *World of Warcraft* — a single, behaviorally-rich episode (e.g. a guild raid-progression night, or a guild collapse). Rationale: Calleja analyzed WoW directly, so the **Axis I (PIM) side is pre-grounded**, isolating the novelty to the Burke axis + the integration. **High-yield alternative:** *EVE Online* — the *Guiding Hand Social Club* heist (already an exemplar in the Grammar manual) spectacularly exercises Agent / identification / consubstantiation / betrayal / scene-act. (Confirm at execution — see §14.)

Deliverable: `worked-example-<game>.md` (becomes the PDF's showcase chapter).

---

## 8. Phase 5 — PDF compilation (formatted for easy reading)

Compile Parts A–E of the framework manual + the worked example into **one polished PDF**.

- **Toolchain:** Markdown → HTML (with a clean reading CSS: serif body, generous leading, numbered headings, styled tables) → `weasyprint` via `scripts/html-to-pdf.mjs`; **or** Markdown → LaTeX (article/memoir class) → `xelatex`. Mermaid grid/graph figures pre-rendered via `mmdc` → SVG/PNG and embedded.
- **Formatting requirements:** title page; auto TOC; the unified grid rendered as a clean table/figure; the worked example with step headers and a results callout; running heads; page numbers; a "how to use this method" quick-reference card.
- **Output:** `corpus/index/Game-Behavior Analysis Method (Burke × Calleja)/Game-Behavior-Analysis-Method.pdf` (+ copy to `tmp/`).

---

## 9. Deferred (explicit) — ontological-hierarchy wiring

Per user direction, **not in scope now.** The framework leaves Part F as an empty, clearly-labeled hook. When the A₀→A₄ chain is finalized, a future pass populates per-term ontological targets and situates DIA inside the Actualization-of-Desire hierarchy. Tracked, not executed.

---

## 10. Folder layout
```
corpus/index/A Rhetoric of Motives (Burke 1950)/        # Phase 1 (prerequisite)
├── _synthesis/
│   ├── rm-identification-consubstantiation-manual.{md,json}   # keystone
│   ├── rm-attitude-as-sixth-term.{md,json}
│   ├── rm-pentad-extension-patch.{md,json}
│   ├── book-level-ontology.{md,json} · global-edges.csv · gm-graph-cross-pipeline-bridge.mmd · …
└── Burke - <unit>/ × 8                                  # RM-00 … RM-07

corpus/index/Game-Behavior Analysis Method (Burke × Calleja)/   # Phases 2–5 (core)
├── validation-report.md · validated-crosswalk.json     # Phase 2
├── game-behavior-analysis-method.{md,json}             # Phase 3 (Parts A–F)
├── worked-example-<game>.md                            # Phase 4
├── figures/  (mermaid → svg/png)                       # Phase 5 inputs
└── Game-Behavior-Analysis-Method.pdf                   # Phase 5 (final artifact)
```

---

## 11. Orchestration
| Phase | Work | Agents / concurrency | Wall time |
|---|---|---|---|
| 1 — Rhetoric pipeline | overview → metadata → 8 deep (RM-01 triple-pass) → synthesis → graphs | 1 + 8 + 8 + 4 + 1 (background waves) | ~90–120 min |
| 2 — Validation | bidirectional crosswalk validation against 3 texts | 1–2 | ~25–35 min |
| 3 — Framework manual | Parts A–E (+ F stub) | 2 (one prose, one grid/JSON) | ~40–60 min |
| 4 — Worked example | end-to-end DIA on chosen game | 1 | ~30–45 min |
| 5 — PDF | render + format | 1 (scripted) | ~10–20 min |

**Total:** ~3.5–5 hrs end-to-end. Activation **on user's go-ahead**; phases gate sequentially (2 needs 1; 3 needs 2; 4 needs 3; 5 needs 3+4).

---

## 12. Quality gates
- *Rhetoric* pipeline: RM-01 triple-pass complete; `rm-identification-consubstantiation-manual` operationalizes identification + consubstantiality + courtship/mystery/hierarchy with player-behavior application; Attitude established as 6th term; consubstantiation↔incorporation bridge **consolidated** (no longer `pending-future-pipeline`).
- Validation: every anticipatory crosswalk cell classified `validated|revised|rejected|extended` with **both-sides** citations; `validated-crosswalk.json` complete.
- Framework manual: Parts A–E complete; the method (Part C) is a numbered, runnable protocol with defined inputs/outputs; question battery ≥40 items reorganized by the unified grid; Part F present but explicitly stubbed.
- Worked example: all 8 method steps shown on a real episode; ends a concrete diagnosis tied to a use-case.
- PDF: renders cleanly; TOC + grid figure + worked-example chapter + quick-reference card; reads well on screen and print.
- Content-filter: no ≥25-word verbatim from Burke or Calleja anywhere.

---

## 13. Risks & mitigations
| Risk | Mitigation |
|---|---|
| Scope creep back into ontological wiring | Part F is a **stub only**; gate explicitly closed this cycle |
| Forcing incorporation↔consubstantiation before *Rhetoric* is properly read | Keystone consolidated **only after** RM-01 triple-pass; flagged `burke-direct` vs `anticipatory` |
| Anticipatory mappings silently treated as validated | Phase 2 is a hard gate; each cell needs both-sides warrant before entering `validated-crosswalk.json` |
| "Integration" becomes two stapled frameworks | Part A must state the *fused* unit of analysis (grid cell); the method (Part C) must produce **one** account, not two parallel reports |
| Worked example cherry-picks a flattering game | Recommend WoW (PIM pre-grounded) to isolate novelty; alt EVE for social-motive richness; pick one **documented** episode |
| PDF toolchain (no pandoc) | Use present tooling: HTML→weasyprint (`html-to-pdf.mjs`) or LaTeX→xelatex; mermaid via mmdc |
| Burke's *Rhetoric* prose density / OCR | RM agents preserve Burke's moves (identification, courtship, mystery); per-unit OCR-cleanup budget |

---

## 14. Open questions (confirm at execution)
1. **Worked-example game + episode** — WoW raid-night/guild-collapse (recommended) vs EVE *Guiding Hand* heist (high-yield) vs other. *(Only true blocker for Phase 4.)*
2. **Rhetoric pipeline depth** — full 8-unit pipeline (recommended; reusable corpus asset) vs a lean "identification/consubstantiation + Attitude only" extraction (faster, less reusable)?
3. **PDF toolchain preference** — LaTeX/xelatex (typographically richer) vs HTML/weasyprint (faster, easier figures)?
4. **War of Words (2018)** — confirm out of scope for this cycle (assumed yes).

---

## 15. Ready-to-execute summary
- **Inputs:** the two existing operationalization manuals (read-only) + *A Rhetoric of Motives* (1950) PDF/text-cache.
- **Pipeline:** Phase 1 *Rhetoric* prerequisite → Phase 2 validation → Phase 3 unified framework manual → Phase 4 real-world worked example → Phase 5 polished PDF. Ontological wiring deferred (Part F stub).
- **Outputs:** a new *Rhetoric* corpus index; a **validated crosswalk**; the **Game-Behavior Analysis Method** synthesis manual (the runnable DIA method); a worked example on a real game; a **reading-formatted PDF**.
- **Activation:** on user's go-ahead; answer Q1 (game) to unblock Phase 4.
