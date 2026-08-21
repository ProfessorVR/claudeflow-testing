# Boredom Secondary (Part III) Cluster — Topic Audit + VLE Pedagogical-Evaluation Mapping

**Date:** 2026-07-15 · **Purpose:** self-contained report for a fresh session with no prior context. Answers two
questions about the `corpus/index/Boredom Secondary (Part III)/` cluster (55 units, built 2026-07-14/15):
(1) which units don't actually deal with boredom, and (2) which units would be useful for a phenomenological
evaluation of student experience in a virtual learning environment (VLE), extending the methodology of
King & Salvo (2024), *Phenomenological Evaluation of an Undergraduate Clinical Needs Finding Skills Through a
Virtual Reality Clinical Immersion Platform* (*Biomed Eng Educ* 4:381–397, DOI 10.1007/s43683-024-00139-5).

**Source location:** `corpus/index/Boredom Secondary (Part III)/` — 55 units (`bor-sec-01` through `bor-sec-55`,
7 strands A–G), each with a `.md` synthesis + `.json` metadata + `-edges.csv`. Cluster-level synthesis lives in
`_synthesis/` (ontology, debate map, contested readings, terminology appendix, citation network, 5 Mermaid graphs)
and `bridge-sources/anchor-pointers.md` (pointer-only cross-links to the FCM entry and Part III). All claims below
were independently re-verified against the unit files themselves (grep counts, direct reads), not recalled from
memory of having built them.

---

## Part 1 — Which units don't actually deal with boredom

Every unit below carries its **own self-disclosed honesty flag** in its `.md` file — these aren't
inferences, the deep-read units say this about themselves. Presented in three tiers by how thin the connection is.

### Tier 1 — Zero boredom content, included only for a transferable methodological analogy

- **`bor-sec-24`** — Clark & Hassert, "Undecidability and Opacity of Metacognition in Animals and Humans" (2013).
  Its own file: *"this three-page piece never once uses the word 'boredom' or any cognate... A full-text search
  confirms zero hits. Its presence in this cluster is not warranted by direct boredom content — there is none —
  but by a general epistemological argument, transferable to boredom research by analogy only, about why
  self-report and implicit behavioral/physiological measures of an opaque internal state can and do diverge."*

### Tier 2 — Same edited volume, different chapter topic (9 of 11 chapters in Hadjioannou (ed.), *Heidegger on Affect*, 2019 — Strand G)

Only 2 of the volume's 11 extracted chapters substantively engage boredom:
- **`bor-sec-55`** (Slaby & Thonhauser) has a dedicated "Profound Boredom" section (pp.274–281) reconstructing
  FCM's tripartite typology directly.
- **`bor-sec-51`** (Withy) has "one narrow but load-bearing bridge" to FCM (own file's language).

The other 9 are chapters about a *different* Heideggerian affect, included only because they share a book with
the boredom-relevant chapters:
- `bor-sec-45` (O'Brien) — uses *anxiety*, not boredom, as its exemplar.
- `bor-sec-46` (Sheehan) — "never mentions boredom" (pathos/rhetoric chapter).
- `bor-sec-47` (Keane) — "essentially no boredom content" (Heidegger's reading of Aristotle's *Rhetoric*).
- `bor-sec-48` (Hadjioannou) — "no boredom-specific material whatsoever" (angst-as-evidence; methodological
  parallel to FCM's own approach only).
- `bor-sec-49` (Dahlstrom) — the word "boredom" appears exactly once, inside a footnote citing a *different*
  paper's title.
- `bor-sec-50` (McManus) — "never mentions boredom... anywhere in its twenty-five pages" (authenticity).
- `bor-sec-52` (Vallega-Neu) — "barely touches boredom" (truth/errancy/bodily disposition).
- `bor-sec-53` (Tömmel) — "exactly one explicit mention... a brief, negative/contrastive aside" (Heidegger's
  theory of *love*).
- `bor-sec-54` (Raffoul) — "never once mentions boredom" (ethics of moods generally).

### Tier 3 — Same philosopher's adjacent themes, not boredom itself (3 Strand-B units)

- **`bor-sec-15`** (Aroles & Küpers, "Towards an Integral Pedagogy in the Age of Digital Gestell," 2022) — about
  Gestell/digital pedagogy/telepresence; never uses the word "boredom."
- **`bor-sec-17`** (Mertel, "Heidegger, Technology and Education," 2020) — about technology/authenticity/de-worlding
  in education; never cites FCM.
- **`bor-sec-19`** (Thomson, "Heidegger on Ontological Education," 2001) — about *paideia*/ontological education;
  no boredom engagement.

These three are also the units that triggered a documented plan-internal gate contradiction (see
`manifest.json` → `planCorrections` #7): the plan's Phase-2 spec scopes the `bridges-to-fcm` edge requirement to
Strand A only, but the Phase-8 checklist's wording said "Strand A/B." Rather than fabricate an FCM bridge edge
these three sources don't support, the gate was resolved in favor of the more specific rule and the
inconsistency was documented, not silently patched.

### Everything else (44 of 55 units)

Genuinely deals with boredom directly, or with its explicit contrast pole (flow/engagement, Strand F) — a real
construct relationship, not incidental inclusion.

---

## Part 2 — Relevance to a King–Salvo-style phenomenological VLE evaluation

### What King & Salvo (2024) actually did (read directly from the PDF, not assumed)

- Pilot undergraduate BME course, VR clinical-immersion platform (Unreal Engine) vs. 2D video, N=22 pilot cohort.
- **Method:** post-course survey + follow-up semi-structured interviews, asking about felt **presence** and
  **embodiment** and emotional response to the immersion.
- Their own methods section: *"we utilized a phenomenological approach, a frequent choice among VR
  researchers... Phenomenology acknowledges and attempts to address how not only our body but also our
  environments... play a role in shaping conscious thought and behavior."* Presence is defined by citing
  Lombard & Ditton (a communication-studies definition), **not** Heidegger, Calleja, or any Heideggerian source.
  No boredom construct appears anywhere in the paper.
- Their own later work (per the existing `Virtual Learning Environments (King–Salvo)` corpus-index entry,
  `_synthesis/manifest.json`) already extended this to eye-tracking: King et al., ASEE 2024 #44685, "Assessment
  of Student Engagement in VR Clinical Immersion Environments through Eye Tracking."

**The gap this creates:** "phenomenological approach" here is loose (borrowed VR-research convention), and
boredom/disengagement — presence's natural failure mode — is entirely unaddressed. That gap is where the
boredom cluster earns its keep, in four distinct roles.

### Role 1 — Make "phenomenological" actually Heideggerian, not just colloquial

- **`bor-sec-07`** (Gibbs, "The Concept of Profound Boredom," 2011) — the standout. Gibbs already extends
  Heidegger's *Augenblick*/third-form analysis into "ontological pedagogy" and classroom/workplace edification —
  the same domain (curriculum, immersive instruction) King–Salvo are in, worked out by someone else first.
- **`bor-sec-18`** (Mansikka, "Can Boredom Educate Us?," 2008/2009) and **`bor-sec-16`** (Feldges, "Boredom in
  Educational Contexts," 2020) — the two units in the whole cluster actually about boredom in educational
  settings specifically, not Heideggerian boredom in general.
- **`bor-sec-02`–`bor-sec-05`** (Elpidorou & Freeman, "Affectivity in Heidegger I/II," "Is Profound Boredom
  Boredom," "Fear, Anxiety, and Boredom") — the cleanest analytic reconstructions of the first/second/third
  forms; good methods-section citations for precisely defining profound boredom without re-deriving it from FCM
  directly.

### Role 2 — Add boredom as presence's natural failure mode

- **`bor-sec-42`** (Haj-Bolouri), **`bor-sec-43`** (Lin), **`bor-sec-44`** (Nacke & Lindley, 2008 — corrected
  authorship, see below) — flow/immersion-in-VR research from the games-studies tradition, a different
  intellectual lineage than King–Salvo's communication-studies presence citation (Lombard & Ditton). Useful for
  triangulating or sharpening the presence construct itself.
- **`bor-sec-25`/`bor-sec-26`** (Elpidorou, "The Bored Mind is a Guiding Mind" / "The Good of Boredom," both 2018)
  — important corrective: a student reporting boredom mid-module isn't necessarily reporting failure.
  Elpidorou's regulatory-signal account gives a principled way to avoid over-reading episodic disengagement as
  design failure.

### Role 3 — Avoid misattributing design gaps to students (most practically important)

Already flagged in this cluster's own bridge edges, not newly noticed for this report:
- **`bor-sec-17`** (Mertel) — its edge note states this "corroborates Part III's VLE proximity-voice/grouping
  correction against misreading design gaps as student deficits." If survey/interview data shows disengagement,
  Mertel's de-worlding critique gives philosophical grounds to ask whether the *platform* individualized the
  experience before concluding students weren't trying.
- **`bor-sec-15`** (Aroles & Küpers) — Gestell/telepresence critique of "reductionist curricula reproducing more
  of the same" — relevant if clinical-immersion modules are templated/repetitive across procedures.
- **`bor-sec-19`** (Thomson) — a sharper standard than "did they feel present": what distinguishes genuine
  ontological education from behaviorally-engaged-but-substantively-hollow instruction.

Note: these three are the *same* units flagged in Part 1, Tier 3, as not being "about boredom." They're relevant
here for a different reason — Heideggerian critique of technologized/individualized education generally, not
boredom specifically.

### Role 4 — Triangulate self-report with physiological measures

This is literally where King's own research program is already headed (per the existing ASEE eye-tracking
follow-up).
- **`bor-sec-40`** (Jaques et al., "Predicting Affect from Gaze Data," ITS 2014) — gaze-based affect prediction
  in an Intelligent Tutoring System — nearly the same setting as the VLE, the closest existing methodological
  precedent.
- **`bor-sec-28`** (Kim et al., "Detecting Boredom from Eye Gaze and EEG," 2018) — combined EEG+gaze boredom
  detection.
- **`bor-sec-36`** (Holmqvist et al., eye-tracking empirical foundations/reporting guideline) — useful as a
  methods-rigor citation if adding eye-tracking.
- **`bor-sec-32`** (Yakobi et al.) and **`bor-sec-38`** (Scharinger et al.) — both dissociate *state*
  (task-induced) from *trait* boredom-proneness, which matters so a single physiological signature isn't
  conflated with two different constructs.

### The honest limitation (this cluster's central finding, and it applies directly here)

No source in this 55-unit cluster combines FCM-grounded profound-boredom phenomenology with hard
instrumentation (EEG/eye-tracking/pupillometry) — confirmed by direct inspection, not estimated: of the 15
units that ground a specific hard channel (exactly Strand D + Strand E, `bor-sec-27`–`bor-sec-41`), **zero**
carry an FCM bridge edge. Two FCM-bridged units (`bor-sec-06`, `bor-sec-16`) *cite* a hard-instrument finding
secondhand but never operate one first-party.

**Consequence:** a future King–Salvo-style study combining rich phenomenological interview (about profound vs.
situational boredom, not just presence) *and* EEG/eye-tracking would have no existing combined protocol to
adapt — it would be building that bridge itself. That cuts both ways: a legitimate, literature-supported
contribution claim, but also a real design risk with no established precedent to lean on.

---

## Cross-references already built into the cluster (don't re-derive these)

- `corpus/index/Boredom Secondary (Part III)/bridge-sources/anchor-pointers.md` — pointer-only map from every
  FCM-bridged and dataset-grounded unit to the FCM entry and to the (unbuilt) Boredom Experiment dataset entry.
- `corpus/index/Boredom Secondary (Part III)/_synthesis/manifest.json` → `planCorrections` #7 — the Strand-B
  `bridges-to-fcm` gate resolution referenced in Part 1, Tier 3.
- `corpus/index/Virtual Learning Environments (King–Salvo)/_synthesis/manifest.json` — the existing empirical
  corpus entry for the King–Salvo publication line itself (survey data W25/S25/W26, raw VR dataset, exemplar
  bank), already registered in the compiler's `TEXT_DIRS`.
- `tmp/Dissertation/Part_III/methodology-application/` — the existing construct-crosswalk, codebook, and
  application memo for Part III's empirical analysis; this report's Role 1–4 mapping should be read alongside
  those, not instead of them.
