# Plan — Comprehensive Corpus/Index Entry: Wendt, *Design for Dasein* (2015)

**Status:** DECISIONS LOCKED 2026-06-23; VLE videos provided + RODA name confirmed + methodology-freeze noted (2026-06-23) — awaiting user "go" for execution (Phase 0).
**Target text:** Thomas Wendt, *Design for Dasein: Understanding the Design of Experiences* (self-published, 2015). ISBN 978-1506166537. 186 pp.
**Source PDF:** `corpus/new_media/Wendt, Thomas - Design for Dasein - Understanding the Design of Experience_(2015)_[Clean_Copy].pdf` (single-page scan, clean OCR).
**Output root:** `corpus/index/Wendt - Design for Dasein/` — Calleja Pattern A (`_synthesis/` + `units/` + `bridge-sources/`). Prefix `dfd-`.
**Ultimate purpose:** an **interpretive design lens** — translate Wendt's phenomenological/post-phenomenological theory of *designing experience* into an instrument that, **alongside the analytical rhetorical ontology (the actualization-of-desire chain)**, analyzes and guides the design of virtual environments — primarily the author's virtual *learning* environments (Part III goal #3, "design more effective VLEs"; cross-cutting to engagement #1 and boredom #2), and secondarily the game environments analyzed by the RODA method (G&G VR / RDR2).

---

## 0. Locked decisions (user, 2026-06-23)

1. **Depth → comprehensive-deep (all units).** Deep triple-pass on dfd-00, dfd-01, dfd-03, dfd-04, dfd-05, dfd-06; `map` on dfd-02 (Design Thinking) + dfd-07 (Bibliography/Notes).
2. **Payload → full build.** RO-mapping bridge + VLE reading grid + drafted interpretive essay + a prescriptive (re)design playbook ("what to design next").
3. **Application target → general + seed + game VLEs.** General virtual-environment design instrument; **seed** against the undergraduate BME VR environment (now via three provided videos, §7a); **also fold in** the G&G (VR) / RDR2 game analyses and **crosswalk to the RODA method**.
4. **Register → seed-either** (default, pending one-word confirm): register-neutral so the entry can feed both a Part III dissertation chapter and a standalone paper without rework. (See §12 for what "register" means.)
5. **Method name → RODA** ("for now," user 2026-06-23). Use RODA in the crosswalk.
6. **RODA / Burke × Calleja methodology entry is FROZEN** (user 2026-06-23): read-only — draw from it and crosswalk to it, **never modify** `corpus/index/Game-Behavior Analysis Method (Burke × Calleja)/`.
7. **BME VR seed case = three provided videos**, analyzed via the established RDR2/G&G video pipeline (whisper transcript + tiered ffmpeg frames + RODA-style read). Source: `/mnt/d/PhD/Dissertation/Media/VLE/` (≈21 min total). See §7a.

---

## 1. Why this text, why now

Wendt's book is the missing *application* layer for Part III. The RO culminates in emotion/action as "the affective architecture of **being-in-the-world**"; Wendt's entire project is **designing for being-in-the-world (Dasein)**. Three structural fits:

- **Heideggerian register** — directly cognate with the RO's Heidegger strand (BCAP/BT/FCM), so it bridges without translation friction.
- **Post-phenomenology / technological mediation** (Ihde, Verbeek, OOO — his longest chapter) is the hinge to **VR/digital environments**, and dovetails with the Part II virtual/phantasmic-object metaphysics.
- **Embodiment & meaning-formation** (Merleau-Ponty) maps onto the aisthēsis → *phantasma* → *doxa* → emotion chain — i.e., *how a designed environment constitutes significance*.

Complementarity with existing assets: **FCM-boredom** diagnoses *how the chain stalls* (boredom); **RODA** analyzes *the chain in motion* (player/agent behavior); **Wendt** prescribes *how to design the conditions* so the chain runs (engagement). Behavior-analysis ↔ design-analysis.

## 2. Volume profile (confirm in Phase 0)

- **Page offset (inferred, single-page scan): `book_page = pdf_page − 2`** (copyright "2" = pdf 4; Contents "5" = pdf 7; Intro "6" = pdf 8). Verify with 2 more anchors in Phase 0; if confirmed, never recompute per page. **Locus format: `(p.NN / pdf NN)` double locus.**
- Structure: Introduction (6) · Phenomenology and Experience Design (15) · Design Thinking and Practice (49) · The Problem-Solution Paradox (72) · Phenomenology to Post-Phenomenology to Object Studies (84) · Embodiment and Meaning Formation (123) · Concluding Remarks (153) · About the Author (165) · Bibliography (166) · Notes (177).

## 3. Folder layout

```
corpus/index/Wendt - Design for Dasein/
  _synthesis/   phase0-overview.md · page-offset-verification.md · manifest.json
                book-level-ontology.{md,json} · dfd-terminology-appendix.md
                dfd-bibliography.md · concept-matrix.csv · global-edges.csv · tension-edges.json
                dfd-vle-design-manual.md           <- payload (a)
                dfd-rhetorical-ontology-bridge.md  <- payload (b), keystone
  units/        dfd-NN-<slug>.{md,json} · dfd-NN-<slug>-edges.csv   (00–07)
  bridge-sources/
                bme-vr-env-analysis/  transcript-*.md · frames/ · bme-vle-read.md   (§7a)
                king-salvo-digest-pointer.md   (points to FCM bridge-sources; no re-digest)
                roda-crosswalk.md              (read-only crosswalk; methodology FROZEN)
                game-vle-pointers.md           (G&G / RDR2)
```

## 4. Unit map (8 units)

| Unit | Coverage | book pp | pdf pp | depth |
|---|---|---|---|---|
| dfd-00 | **Introduction** — embodied philosophy ("design = doing philosophy with the hands"); phenomenological design thinking; Cross's 3 facets; Mitcham (design vs craft; "no Greek word for design"); "ship or die" | 6–14 | 8–16 | **deep** |
| dfd-01 | **Phenomenology and Experience Design** — Husserl→Heidegger→Merleau-Ponty; praxis-as-knowledge applied to XD | 15–48 | 17–50 | **deep** |
| dfd-02 | **Design Thinking and Practice** — theory/practice dualism; critique of "design thinking"/best-practices | 49–71 | 51–73 | map |
| dfd-03 | **The Problem-Solution Paradox** — problems & solutions co-evolve (anti-linear) | 72–83 | 74–85 | **deep** |
| dfd-04 | **Phenomenology → Post-Phenomenology → Object Studies** — Ihde (mediation relations), Verbeek, OOO/Harman; technological mediation | 84–122 | 86–124 | **deep** |
| dfd-05 | **Embodiment and Meaning Formation** — Merleau-Ponty; embodied/enacted meaning | 123–152 | 125–154 | **deep** |
| dfd-06 | **Concluding Remarks** — synthesis into a phenomenological design methodology | 153–164 | 155–166 | **deep** |
| dfd-07 | **Bibliography + Notes** — interlocutor/source extraction | 166–186 | 168–188 | map |

## 5. Five-phase pipeline

- **Phase 0** — volume overview, page-offset verification (2 anchors), scaffold, concept inventory, reuse-asset audit; **VLE-video pre-flight** (probe ✓; confirm whisper availability).
- **Phase 1** — per-unit metadata JSON (sections, loci, key terms, interlocutors, design-principles).
- **Phase 2** — per-unit deep MD (numbered §sections) + `-edges.csv`. Deep units ≥1,500 words.
- **Phase 2b (parallel track)** — **VLE video analysis** per §7a → `bridge-sources/bme-vr-env-analysis/`.
- **Phase 3** — synthesis: book-level ontology, terminology appendix, bibliography/interlocutor map, concept-matrix, global + tension edges, **+ the two payload deliverables (§6), which consume the §7a video read + the crosswalks (§7)**.
- **Phase 4** — register in `corpus/index/compiled-index.json`; verify against quality gates (§9).

## 6. The two payload deliverables (full build)

**(a) `_synthesis/dfd-vle-design-manual.md`** — operational reading/design grid:
- **A.** Wendt's design principles distilled as criteria (embodied philosophy; problem-solution co-evolution; technological mediation; embodiment/meaning-formation; design-as-enacted-being-in-the-world).
- **B.** A **virtual-environment reading grid** — diagnostic questions per principle; **demonstrated on the BME VLE video read (§7a)** and on one G&G design element.
- **C.** **Ihde's mediation typology** (embodiment / hermeneutic / alterity / background relations) applied to VR/VLE interfaces.
- **D.** **(Re)design playbook** — "what to design next," organized by chain node (§6b).
- **E.** Open problems / limits of the lens.

**(b) `_synthesis/dfd-rhetorical-ontology-bridge.md`** — keystone. Maps Wendt's design concepts onto the actualization chain so any design decision is locatable at the node it intervenes on:

| RO node | Wendt design correlate | environment design lever |
|---|---|---|
| **A0/A1** sensible object + medium → *aisthēsis* | technological mediation; artifact-as-medium | sensory/interface fidelity; presence/immersion |
| **A2** *phantasma* (taking-as / making-present-as) | embodiment & meaning-formation ("designing the *as*") | how the environment presents objects as meaningful/usable |
| **A3** *doxa* + emotion (being-moved) | experience as disclosure | engagement vs boredom (→ FCM bridge) |
| **A4** action + *hexis* | design-as-enacted-plan; problem-solution co-evolution in use | task/learning-loop design; skill habituation |

**Keystone thesis:** *designing a virtual environment = designing the conditions under which the participant's actualization-of-desire chain runs (engaged) or stalls (bored).* The BME VLE video read (§7a) is the seed application. Every RO-mapping / design-application claim tagged `provenance: anticipatory-application` (interpretive construction, not Wendt's claim). Keep three registers strictly separate: **Wendt-says / RO-mapping / environment-application.**

## 7. Cross-linking map (per locked decision #3)

- **BME VR learning environment (seed case):** anchored on **three provided videos** (≈21 min) analyzed via the pipeline (§7a) → `bridge-sources/bme-vr-env-analysis/`. Also point to the existing `corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/bridge-sources/king-salvo-*-digest.md` (phenomenological/physiological/eye-tracking) — do not re-digest. *Empirical-outcomes* application still deferred until the 4 quarters of student data arrive (post-Part-II); the video analysis supplies the *design* evidence now.
- **RODA game-behavior method (FROZEN — read-only):** crosswalk in `bridge-sources/roda-crosswalk.md` against `…/CANONICAL-METHODOLOGY-v5.md` + `ontological-wiring-A0-A4.md` — **draw from, never modify**. Framing: Wendt = design-conditions lens; RODA = behavior-in-motion method; both keyed to the same A0–A4 chain.
- **Game VLEs (G&G VR / RDR2):** pointers in `bridge-sources/game-vle-pointers.md` to the Part II worked analyses + `gg-frames/`; the reading grid (§6a.B) demonstrated on one G&G design element.
- **FCM-boredom + King–Salvo engagement:** the A3 row of the bridge cross-references both, unifying Part III goals #1–#3.

## 7a. VLE video-analysis sub-pipeline (seed-case evidence base)

Apply the **established** RDR2/G&G video pipeline (do not rebuild it) to the three provided VLE videos → concrete seed evidence the Wendt lens + RO bridge analyze.

**Sources** (`/mnt/d/PhD/Dissertation/Media/VLE/`):
- `Virtual Space - Group.mp4` — 16.5 min, 4K HEVC, audio (main group session in the VR space)
- `MediaPlayer.mp4` — 2.1 min, 4K H.264, audio
- `Windows 2024.02.20 - 20.35.14.01.mp4` — 2.4 min, 3440×1440 H.264, audio (desktop/screen capture)
- Total ≈21 min — small; the whole set is tractable.

**Pipeline (mirrors the master plan's tiers; tooling already validated):**
1. **Transcribe** all three audio tracks (whisper large-v3 / faster-whisper, established setup) → narration/dialogue backbone (`transcript-*.md`). Pre-flight: confirm whisper availability at execution.
2. **Extract frames** with ffmpeg, 1280px, tiered by analytical load: baseline ~1/5 s on the group session; denser (1/1–1/2 s) at load-bearing design moments (onboarding, object interaction, task beats); lighter on idle/traversal. Store under `bme-vr-env-analysis/frames/`.
3. **Read a curated frame subset** (~150–300 frames; binding cost ≈1.2K tokens/frame) + transcript → `bme-vr-env-analysis/bme-vle-read.md`: a design+chain description — *what is designed* (space, objects, mediation, interactions) for the Wendt lens, and *how the participant's A0→A4 chain runs* (engagement/boredom signatures) for the RO bridge.

**Use:** feeds (a) the seed case in the RO bridge (§6b), (b) the worked example in the design manual (§6a.B/D), (c) a cross-reference point for the RODA crosswalk and FCM-boredom.

**Provenance discipline (per master plan):** keep three voices distinct — Wendt-says / RO-mapping / VLE-application; tag all design+chain readings `provenance: anticipatory-application`. The videos are primary evidence of *the user's own VLE design*, not of Wendt.

**Defaults to confirm at go:** frame-density (rec: 1/5 s baseline + 1/2 s at key moments), resolution (1280px), transcription engine (established whisper). All adjustable.

## 8. Controlled vocabulary (extensions)

- **Object types (+ base TERM/CLAIM/INTERLOCUTOR/GREEK/GERMAN):** DESIGN-PRINCIPLE, MEDIATION-RELATION, DESIGN-CONCEPT, PHENOM-LINEAGE, VLE-LEVER.
- **Edge relations (base + new):** applies-to-design, mediates, co-evolves-with, discloses, maps-to-chain-node, designs-for, complements-method.
- **Locus:** `(p.NN / pdf NN)` double locus on every citation.

## 9. Quality gates (calibrated to a ~160pp accessible book)

≥120 global edges · ≥60 bibliography/interlocutor entries (Wendt cites Heidegger, Merleau-Ponty, Ihde, Verbeek, Harman, Cross, Mitcham, Dourish, et al.) · ≥60 terminology lemmas · every deep unit ≥1,500 words with numbered sections · **no ≥25-word verbatim** (in-copyright 2015 — anchor-phrases only) · every bridge/application claim tagged `provenance: anticipatory-application` · double locus on every citation · registered in `compiled-index.json`.

## 10. Risks

1. **Applied/secondary text.** Wendt is design theory, not primary philosophy — keep his claims distinct from the primary phenomenologists he cites (Heidegger/Merleau-Ponty/Ihde) *and* from the RO.
2. **Bridge over-reach.** Strictly separate Wendt-says / RO-mapping / environment-application; the RO is the user's; Wendt is a lens onto its application.
3. **Aristotle-primary core.** The RO spine is Aristotelian; Wendt is Heidegger/phenomenology — frame him as a **design-application lens for Part III**, not a competitor to the Aristotelian core.
4. **Scope creep.** Book is short; resist padding. Cross-linking (game VLEs + RODA) is real added work — keep crosswalks tight (pointers, not re-indexing). RODA entry is FROZEN.
5. **Video read cost.** Frames-read is the binding token cost; curate the subset, don't read every extracted frame.

## 11. Orchestration

~8 unit agents (parallel) + the §7a video track (transcribe → extract → curated read) + author-led synthesis (overview, manual, bridge, crosswalks authored in-loop for quality). Agent tool, not Workflow. Verify every artifact on disk before Phase 4. New entry — no existing files touched; RODA entry read-only.

## 12. Status of the §12 open items (updated 2026-06-23)

- **BME VR design materials → PROVIDED.** Three VLE videos at `/mnt/d/PhD/Dissertation/Media/VLE/`; analyzed via §7a. (Optional extra: a curriculum / learning-objectives doc would sharpen the "what to design next" playbook — not blocking.)
- **Method name → RESOLVED: RODA** (for now).
- **Register tilt → pending one-word confirm.** "Register" = the genre/voice the entry's synthesis prose is pitched for. **seed-either** (recommended) = write it neutrally so it can later become *either* a Part III dissertation chapter *or* a standalone paper with no rework. A "tilt" would instead pre-shape the manual/bridge prose toward one destination now. Recommend keeping seed-either.
