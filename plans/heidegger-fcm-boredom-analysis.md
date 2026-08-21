# Plan — Comprehensive Corpus/Index Entry: Heidegger, *The Fundamental Concepts of Metaphysics* (boredom-focused)

**Status:** APPROVED — in execution (2026-06-19)
**Target text:** Martin Heidegger, *The Fundamental Concepts of Metaphysics: World, Finitude, Solitude* (GA 29/30, 1929–30 lecture course), trans. William McNeill & Nicholas Walker, Indiana UP 1995. ISBN 0-253-21429-7 (pbk).
**Source PDF:** `corpus/metaphysics/Heidegger, Martin - The Fundamental Concepts of Metaphysics.pdf` (200 pp., 833×612pt landscape **2-up scan**).
**Output root:** `corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/` (Calleja Pattern A: `_synthesis/` + `units/` + `bridge-sources/`). Prefix `fcm-`.
**Ultimate purpose:** an interpretive instrument for reading boredom in the author's published VR/physiological work (King & Salvo), seeding *either* a dissertation chapter *or* a follow-up paper.

---

## 0. Locked decisions (user, 2026-06-19)

1. **Part Two depth** → *comprehensive map* (broad structural coverage of §§45–76; lighter per-unit; reuse the existing Uexküll/BT asset for the animal strand).
2. **Bridge scope** → *full build*: mapping instrument + drafted interpretive essay + "what to measure next" experimental redesign.
3. **Bridge inputs** → *three* King–Salvo papers (physiological 2023 + eye-tracking 2024 + phenomenological-evaluation), with a stated lineage.
4. **Register** → *seed-either*: index entry kept register-neutral so it can feed both a dissertation chapter and a follow-up paper.

## 1. Why now / rationale

Boredom in FCM is not a mood among moods: it is Heidegger's worked example of a *Grundstimmung* (fundamental attunement) that discloses beings as a whole and opens the three metaphysical questions (world, finitude, individuation). The author's empirical record contains an unresolved tension — a "clinical immersion" stimulus that reads boredom-like on EEG yet engaged on gaze, with subjects reporting high engagement *and* dragging time. FCM's tripartite structure of boredom is the instrument that can represent (and dissolve) that tension; a bipolar engaged↔bored scale cannot.

## 2. Volume profile (verified Phase 0)

- 76 sections across Preliminary Appraisal (§§1–15), Part One (§§16–38, "Awakening a Fundamental Attunement"), Part Two (§§39–76, "What Is World?"); + Fink Appendix (p.367), Editor's Epilogue (p.370), Postscript (p.374), Glossary (p.375).
- **Page-offset (VERIFIED, 4 anchors):** `book_page = 2·pdf_page − 24`; `pdf_page = ⌊(book_page+24)/2⌋`. Running heads also print the German **GA 29/30 (Klostermann) pagination** in brackets → capture a **triple locus** `{book_page, ga_page, pdf_page}` on every citation. See `_synthesis/page-offset-verification.md`.
- **Boredom spine = Prelim §18c (p.74, first naming) + Part One §§16–38 + Part Two Ch.1–2 §§39–44.**

## 3. Folder layout

```
corpus/index/Heidegger - The Fundamental Concepts of Metaphysics/
  _synthesis/   page-offset-verification.md · phase0-overview.md · manifest.json
                book-level-ontology.{md,json} · fcm-terminology-appendix.md
                fcm-german-appendix.md · fcm-bibliography.md
                fcm-boredom-attunement-manual.md · fcm-king-salvo-bridge.md
                concept-matrix.csv · global-edges.csv · tension-edges.json
  units/        fcm-NN-<slug>.{md,json} · fcm-NN-<slug>-edges.csv   (00–14)
  bridge-sources/  king-salvo-{physiological,eyetracking,phenomenological}-digest.md
```

## 4. Unit map (15 units; deep = triple-pass, map = condensed)

| Unit | Coverage | §§ | book pp. | pdf pp. | depth |
|---|---|---|---|---|---|
| fcm-00 | Prelim Ch.1 — Novalis/homesickness, philosophy as *Grundstimmung* | 1–3 | 1–10 | 12–17 | map |
| fcm-01 | Prelim Ch.2 — ambiguity of philosophizing | 4–7 | 11–24 | 17–24 | map |
| fcm-02 | Prelim Ch.3 — *physis*/*logos*, history of "metaphysics" | 8–15 | 25–58 | 24–41 | map |
| fcm-03 | Part One Ch.1 — awakening attunement; **§18c first names profound boredom** | 16–18 | 59–77 | 41–50 | **deep** |
| fcm-04 | **First form** — becoming bored *by* something (train station) | 19–23 | 78–105 | 51–64 | **deep** |
| fcm-05 | **Second form** — being bored *with* something (dinner party) | 24–28 | 106–131 | 65–77 | **deep** |
| fcm-06 | **Third form** — profound boredom, "it is boring for one" | 29–36 | 132–159 | 78–91 | **deep** |
| fcm-07 | Particular profound boredom of contemporary Dasein | 37–38 | 160–168 | 92–96 | **deep** |
| fcm-08 | Part Two Ch.1 — three questions; **time as root** | 39–41 | 169–175 | 96–99 | **deep** |
| fcm-09 | Part Two Ch.2 — world-question begins; three theses; post-vacation recap | 42–44 | 176–185 | 100–104 | **deep** |
| fcm-10 | Animal poor-in-world (*weltarm*) | 45–48 | 186–200 | 105–112 | map |
| fcm-11 | The organism / capacity / captivation prelude | 49–57 | 201–235 | 112–129 | map |
| fcm-12 | Captivation (*Benommenheit*); Driesch & Uexküll | 58–63 | 236–273 | 130–148 | map |
| fcm-13 | World-forming (*weltbildend*); apophantic *logos*; the "as" | 64–76 | 274–366 | 149–195 | map |
| fcm-14 | Fink Appendix · Epilogue · Postscript · Glossary | — | 367–end | 195–200 | map |

## 5. Five-phase pipeline

- **Phase 0** — volume overview, offset verification, scaffold, 3 paper digests. *(done/in progress)*
- **Phase 1** — per-unit metadata JSON (section list, loci, key terms, interlocutors).
- **Phase 2** — per-unit deep MD (numbered §sections) + edges CSV. Triple-pass on fcm-03…fcm-09.
- **Phase 3** — synthesis: book-level ontology, terminology + German appendices, bibliography, **boredom-attunement manual** (A–E), **King–Salvo bridge**, concept-matrix, global + tension edges.
- **Phase 4** — register in `corpus/index/compiled-index.json`; verification pass against quality gates.

## 6. Two payload deliverables

**(a) `fcm-boredom-attunement-manual.md`** — Sections A–E. A: the three forms as a structural progression. B: the four structural moments (*Leergelassenheit*, *Hingehaltenheit*, *Zeitvertreib*, *Langeweile*) + temporal moments (*Augenblick*, *Gebanntheit*). C: boredom as *Grundstimmung* disclosing beings-as-a-whole → the three questions. D *(projected)*: an operational reading grid. E *(projected)*: open problems.

**(b) `fcm-king-salvo-bridge.md`** — spine = the three-way mapping:

| FCM form | phenomenal signature | empirical correlate (King–Salvo) |
|---|---|---|
| First (bored *by*) | restless *Zeitvertreib*; scanning for occupation | **high-arousal boredom**: high gaze-variance, "looking around to find something to attend to" |
| Second (bored *with*) | outwardly occupied, hollow underneath; time drags | **clinical "in-between"**: gaze≈engaged yet EEG/DMN≈boring; 8/8 self-reported engagement *yet* 17 min felt 25–30 |
| Third (profound) | *Zeitvertreib* falls away; stillness; beings withdraw | **low-arousal "zombie stare"**: collapsed gaze-variance (S1, S2) |

Keystone subsection: *cross-instrument contradiction → second-form resolution* (2023-EEG-says-boring vs 2024-gaze-says-engaged is exactly what being-bored-*with* predicts: surface occupied, depth hollow). Plus "what to measure next": instrument the second-form divergence (gaze surface vs DMN/alpha depth), add a time-perception probe (*Hingehaltenheit*), disambiguate high/low-arousal as first/third form.

## 7. Controlled vocabulary (extensions)

- **Object types:** ATTUNEMENT, BOREDOM-FORM, STRUCTURAL-MOMENT, TEMPORAL-STRUCTURE, METAPHYSICAL-QUESTION, WORLD-THESIS (+ existing TERM, CLAIM, INTERLOCUTOR, GREEK, GERMAN).
- **Edge relations (base 11 + new):** defines, cites, extends, contests, concedes, qualifies, glosses-greek, glosses-german, instances-in-text, marginal-note, bridges-to-pipeline, **discloses, deepens-into, temporalizes-as, grounds-question, interprets-experiment-finding**.
- **Locus format:** `(p.NN / GA pp.NN / pdf NN)` triple.

## 8. Quality gates

≥220 global edges · ≥120 bibliography/interlocutor entries · ≥100 terminology lemmas · ≥40 German-appendix lemmas · every deep unit ≥2,000 words with numbered sections · **no ≥25-word verbatim** from the McNeill–Walker translation (anchor-phrases only) · every projected/bridge claim tagged `provenance: anticipatory-application` · every citation carries the triple locus.

## 9. Risks

- **2-up OCR noise** (stray marginal glyphs) — mitigated by column-split extraction + anchor-phrase-only quoting.
- **GA pagination drift** — never compute; read the bracket per page.
- **Bridge over-reach** — keep faithful (their findings) vs projected (the form-mapping) strictly separated; compromised EEG (N=3, artifacts) treated as suggestive only; lean on clean self-report (time-perception, engagement) + the N=12 gaze data.
- **Part Two scope creep** — held to "map," reusing `tmp/heidegger-uexkull-bt-report/`.

## 10. Orchestration

~16 unit/digest agents (parallel) + author-led synthesis (overview, digests, manual, bridge, appendices authored in-loop for quality). Agent tool (not Workflow). Verify every artifact on disk before Phase 4 registration.
