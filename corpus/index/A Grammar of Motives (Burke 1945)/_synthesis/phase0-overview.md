# Phase 0 — Volume Overview: Kenneth Burke, *A Grammar of Motives* (1945; UC Press 1969 ed.)

**Date generated**: 2026-05-11
**Plan reference**: `plans/grammar-of-motives-burke-1945-analysis.md` (v1, 2026-05-11)
**Source PDF**: `corpus/rhetorical_ontology/Burke, Kenneth - A Grammar of Motives_(1945)_[My Copy].pdf` (551 PDF pp.)
**Output root**: `corpus/index/A Grammar of Motives (Burke 1945)/`
**Agent role**: single-agent sequential Phase 0 per plan §6 orchestration table; methodology mirrors the Calleja In-Game Phase 0 (`corpus/index/In-Game (Calleja 2011)/_synthesis/phase0-overview.md` + `manifest.json`).

This overview is the load-bearing scaffold for fourteen Phase 1 metadata extractions, fourteen Phase 2 deep-analysis runs, six Phase 3 Wave-1 synthesis agents, and one Phase 3 Wave-2 graphing agent. Its function is capture-grade preparation, not interpretation: every claim below is keyed to verifiable PDF-page evidence; per-unit deep analysis is deferred to Phase 2, and the standalone synthesis deliverables (pentad operationalization manual, ratio catalog, substance vocabulary, philosophic-school mapping, four-tropes manual) are deferred to Phase 3.

---

## 1. Volume identity and bibliographic identity

Kenneth Burke (1897–1993) published *A Grammar of Motives* in 1945 with Prentice-Hall (New York) as the first volume of a projected trilogy whose announced second volume was *A Rhetoric of Motives* (eventually published 1950, Prentice-Hall) and whose third "Symbolic of Motives" remained incomplete in Burke's lifetime (recovered as the posthumous *The War of Words*, University of California Press 2018, edited by Anthony Burke and Kyle Jensen). World Publishing (Meridian Books) issued a paperback edition in 1962, and the University of California Press took over the *Grammar* (and the *Rhetoric*) for an authoritative paperback edition in 1969 — the edition reproduced in this PDF. The UC Press 1969 pagination is the one Burke scholarship has cited as standard for over half a century; this pipeline follows it throughout.

The PDF preserves twenty-two of the twenty-four nominal front-matter pages (book pages i–xxiv), losing the outer wrapper / advertising leaves; the body pagination is intact (book pp. 1–518), followed by a twelve-page Index (book pp. 519–530). The volume contains no standalone bibliography or references section — Burke's apparatus is entirely footnote-internal plus the Index. This is a methodological signature of his interwar generation: references travel with the local argument rather than living in a separate bibliographic exoskeleton. The Phase 3 deliverable `gm-bibliography-extracted` will reconstruct a ≥150-entry bibliography from the footnote and Index pointers; Baldwin's *Dictionary of Philosophy and Psychology* (cited at the opening of every Part 2 chapter — eight hits total) is the principal reference resource Burke himself names and is a Type-D bibliography category in its own right.

The work's purpose is announced in its first sentence: "What is involved, when we say what people are doing and why they are doing it?" (book p. xv / PDF p. 12). The answer Burke develops over 518 pages is *dramatism* — the analysis of human action via five irreducible terms (Act, Scene, Agent, Agency, Purpose) and the dyadic ratios formed among them. Burke insists throughout that dramatism is *grammatical*, not psychological or empirical: the pentad is a structural feature of any statement about motive, not a hypothesis about how minds work. Different philosophical schools, Burke argues in Part 2, are recognizable by which pentad term each features as the locus of motive — and the whole second part of the book is organized to exhibit this systematic distribution.

---

## 2. Verified offset and landmark table

**Offset formula**: book page *n* = PDF page *n* + 21. Verified via PyMuPDF text-extraction on fifteen distinct landmarks (one per unit plus the Index). All fifteen produced exact matches to expected chapter-opening headers; the offset is constant throughout the volume, with no insert-page or rotated-page anomalies.

| # | Landmark | Book p. | PDF p. | First line(s) extracted (verbatim, first 12–18 words) |
|---|---|---|---|---|
| 1 | Introduction opening | xv | 12 | "INTRODUCTION: THE FIVE KEY TERMS / OF DRAMATISM" |
| 2 | Part 1.I (Container) opening | 3 | 24 | "I / CONTAINER AND THING CONTAINED / The Scene-Act Ratio" |
| 3 | Part 1.II (Antinomies) opening | 21 | 42 | "ANTINOMIES OF DEFINITION / Paradox of Substance" |
| 4 | Part 1.III (Scope) opening | 59 | 80 | "III / SCOPE AND REDUCTION / The Representative Anecdote" |
| 5 | Part 2.I (Scene) opening | 127 | 148 | "I / SCENE / The Featuring of the Terms" |
| 6 | Part 2.II (Agent) opening | 171 | 192 | "II / AGENT IN GENERAL / IDEALISM, in the Baldwin dictionary, is described thus" |
| 7 | Part 2.III (Act) opening | 227 | 248 | "III / ACT / Aristotle and Aquinas" |
| 8 | Part 2.IV (Agency-Purpose) opening | 275 | 296 | "IV / AGENCY AND PURPOSE / The Philosophy of Means" |
| 9 | Part 3.I (Constitutions) opening | 323 | 344 | "I / THE DIALECTIC OF CONSTITUTIONS / Necessity for Representative Case" |
| 10 | Part 3.II (Dialectic in General) opening | 402 | 423 | "II / DIALECTIC IN GENERAL / The Transformation of Terms" |
| 11 | Appendix A (Keats) opening | 447 | 468 | "SYMBOLIC ACTION IN A POEM / BY KEATS" |
| 12 | Appendix B (Intrinsic) opening | 465 | 486 | "THE PROBLEM OF THE INTRINSIC / (as reflected in the Neo-Aristotelian School)" |
| 13 | Appendix C (Moore) opening | 485 | 506 | "MOTIVES AND MOTIFS IN THE POETRY / OF MARIANNE MOORE" |
| 14 | Appendix D (Tropes) opening | 503 | 524 | "FOUR MASTER TROPES / I REFER to metaphor, metonymy, synecdoche, and irony" |
| 15 | Index opening | 519 | 540 | "INDEX / American way, 310 / Anarchism, 268, 345 ..." |

All Phase 2 page-anchors throughout the pipeline can therefore use the simple +21 conversion without verification overhead, except in the front matter (which is absent from this pipeline's scope) where the partial preservation introduces minor irregularity.

---

## 3. Unit table (14 units, with internal-section verification spot-checks)

The plan §2.1 enumerates fourteen units (Introduction + three Part-1 chapters + four Part-2 chapters + two Part-3 chapters + four Appendix essays). All fourteen are confirmed in their expected page ranges; their PDF folders are already created on disk under `corpus/index/A Grammar of Motives (Burke 1945)/`. Internal-section verification: I sampled at least one mid-chapter page per unit. Burke's typographic conventions hold throughout: roman-numeral chapter heads (I / II / III for sections within a Part); italic-and-small-caps subsection heads (e.g., "Paradox of Substance," "The Scene-Act Ratio," "Aristotle and Aquinas," "The Philosophy of Means"); body-paragraph small-caps opening words on chapter-first paragraphs (e.g., "OUR PROGRAM" at the top of Part 2.I; "TENDER PRAGMATISM" at the top of Part 2.IV; "BY DIALECTICS in the most general sense" at the top of Part 3.II). The structured manifest's `units[]` array carries the page ranges and pre-tagged pentad spine for every unit; Phase 1 metadata agents will populate exhaustive internal-section heading lists.

| Unit ID | Title | Book pp. | PDF pp. | Body pp. | Pentad term(s) primarily developed | Edge target | Triple-pass |
|---|---|---|---|---|---|---|---|
| GM-00-INTRO | Introduction: The Five Key Terms of Dramatism | xv–xxiii | 12–21 | 9 | **all five** (canonical statement) | 45 | yes |
| GM-01-CONTAINER | Part 1.I — Container and Thing Contained | 3–20 | 24–41 | 18 | **all 10 ratios** | 45 | yes |
| GM-02-ANTINOMIES | Part 1.II — Antinomies of Definition | 21–58 | 42–79 | 38 | substance vocabulary (Act–Agent via actus/status) | 40 | no |
| GM-03-SCOPE | Part 1.III — Scope and Reduction | 59–126 | 80–147 | 68 | Act (as locus of motives), Scene (as circumference) | 40 | no |
| GM-04-SCENE | Part 2.I — Scene | 127–170 | 148–191 | 44 | **Scene** (featured in materialism) | 40 | yes |
| GM-05-AGENT | Part 2.II — Agent in General | 171–226 | 192–247 | 56 | **Agent** (featured in idealism) | 40 | yes |
| GM-06-ACT | Part 2.III — Act | 227–274 | 248–295 | 48 | **Act** (featured in realism; **EXEGETICAL** Aristotle/Aquinas bridge) | 40 | yes |
| GM-07-AGENCY-PURPOSE | Part 2.IV — Agency and Purpose | 275–322 | 296–343 | 48 | **Agency** (pragmatism) + **Purpose** (mysticism) | 40 | yes |
| GM-08-CONSTITUTIONS | Part 3.I — Dialectic of Constitutions | 323–401 | 344–422 | 79 | applied dramatism (all five terms deployed) | 40 | no (extended time) |
| GM-09-DIALECTIC-GEN | Part 3.II — Dialectic in General | 402–444 | 423–465 | 43 | transformation-of-terms (all five) | 40 | no |
| GM-10-KEATS | App A — Keats's Grecian Urn | 447–464 | 468–485 | 18 | Act, Scene, Agent, Purpose (worked Ode) | 35 | no (full unit) |
| GM-11-INTRINSIC | App B — Problem of the Intrinsic | 465–484 | 486–505 | 20 | scene-act meta-clarification (intrinsic/extrinsic) | 35 | no (full unit) |
| GM-12-MOORE | App C — Marianne Moore | 485–502 | 506–523 | 18 | Act, Scene, Agent (worked oeuvre) | 35 | no (full unit) |
| GM-13-TROPES | App D — Four Master Tropes | 503–518 | 524–539 | 16 | trope-deployments cross-cut all five | 35 | no (full unit) |

Total body coverage: 518 pp. across fourteen units. The two longest units are GM-08 (Constitutions, 79 pp.) and GM-03 (Scope, 68 pp.); these receive extended wall-time in Phase 2. The two shortest body units are GM-00 (Introduction, 9 pp.) and GM-13 (Four Master Tropes, 16 pp.); both punch above their weight (GM-00 is the load-bearing pentad statement; GM-13 generates its own standalone synthesis deliverable).

A note on Part 2's architecture, since it determines the pipeline's most distinctive synthesis deliverable (`gm-philosophic-school-mapping`): Burke distributes the five pentad terms across five philosophic schools, treating each chapter as both a term-explication and a school-diagnosis. The mapping Burke himself constructs is:

- **Materialism features Scene** — Hobbes, Spinoza, Darwin, Lucretius, Epicurus, Stoicism (Part 2.I, GM-04)
- **Idealism features Agent** — Berkeley, Hume, Leibniz, Kant, Hegel, plus the Marxism subsection treating Marxism as an *Agent*-featuring extension of idealism via class-as-agent (Part 2.II, GM-05)
- **Realism features Act** — Aristotle, Aquinas (Part 2.III, GM-06)
- **Pragmatism features Agency** — William James, Dewey, G. H. Mead (Part 2.IV first half, GM-07)
- **Mysticism features Purpose** — Plotinus, Bonaventura, Christian mystics (Part 2.IV second half, GM-07)

The crucial feature of this mapping is that Burke does not claim the mappings are exclusive or exhaustive. A philosophic school *features* one pentad term as motive-locus but typically deploys all five; the mapping is diagnostic ("which term is featured?"), not classificatory ("which term is mentioned?"). This is one of the points the dissertation will deploy: a game-studies theory can be characterized by which pentad term it features, even if it deploys all five.

---

## 4. Pentad architecture overview

The five terms — Act, Scene, Agent, Agency, Purpose — are introduced together at the top of the Introduction (book pp. xv–xvi). Burke offers immediate question-form glosses: *what was done?* (Act), *where or when was it done?* (Scene), *who did it?* (Agent), *how did he do it?* (Agency), *why?* (Purpose). The terms are deliberately interrogative-grammatical, not metaphysical-substantial. Burke emphasizes that any complete statement of motive must "have a clear answer for all five" — but the centrality of any one term in a given motive-statement is exactly what reveals the philosophic idiom of the speaker.

The pentad's analytical power emerges most fully in the ten **dyadic ratios** developed in Part 1.I (GM-01): scene-act, scene-agent, scene-agency, scene-purpose, act-agent, act-agency, act-purpose, agent-agency, agent-purpose, agency-purpose. A ratio is a question: how does one term inflect or constrain another? Burke devotes the bulk of GM-01 to scene-act (the chapter's titular *Container and Thing Contained*) and scene-agent ratios, working through *Enemy of the People* (Ibsen) and *Mourning Becomes Electra* (O'Neill) as paradigm-cases. The remaining eight ratios are developed in sequence; Burke also notes selected higher-order combinations (scene-act-agent triadic; scene-purpose-agency in mystical exegesis). The Phase 3 deliverable `gm-ratio-catalog` will produce a queryable catalog of all ten dyads plus higher-order combinations.

The systematic distribution across philosophic schools in Part 2 (see §3 above) is the pentad's second analytical engine. Burke's diagnostic move is: identify which pentad term a philosophy treats as the *originating ground* of motive, and the philosophy's structure becomes legible. Materialism (Hobbes, Spinoza, Darwin) treats motive as arising from environmental ground (Scene); idealism (Berkeley → Kant → Hegel) treats motive as arising from the constituting subject (Agent); realism (Aristotle, Aquinas) treats motive as arising from the act-itself in its actualization (Act); pragmatism (James, Dewey, Mead) treats motive as arising from the instrumental means by which an act is brought about (Agency); mysticism (Plotinus, Bonaventura) treats motive as arising from the end toward which all action tends (Purpose). The mapping is one-to-many in both directions — a school features one term but engages all five; a term is featured by one canonical school but appears in all five chapters — and this non-bijection is part of what gives the apparatus its dissertation-utility for game-theory diagnosis (ludology features Act; narratology features Scene+Purpose; embodied-cognition game studies features Agency).

A third architectural feature of the pentad is its claim to **grammatical universality at the level of expression** combined with **philosophic openness at the level of idiom**. Burke insists (Introduction, book pp. xv–xxiii) that *every* coherent statement about human motive must have determinate values for all five terms — this is the grammatical universality. But *which* term is featured, and *which* ratios are emphasized, varies with philosophic idiom — this is the openness. The two-level claim is part of why Burke calls the work a "grammar" rather than a "theory" of motives: a grammar describes the rules under which statements get made, not the empirical truth of what is stated.

---

## 5. OCR confidence assessment (per-chapter sample)

I sampled one mid-chapter page per unit (fourteen pages total) via PyMuPDF text-extraction and assessed three OCR pathologies: ligature crashes (residue of `ﬁ`/`ﬂ` Unicode ligatures appearing as separate characters), period-substitution / consonant-cluster mangling in italic technical terms (the ABBYY FineReader 11 italic-tl pattern), and two-column-merge artifacts in body text.

**Overall verdict**: high. No ligature residue detected on any of the fourteen sampled pages. No two-column-merge artifacts in body prose (the body is single-column; only the Index is two-column and extracts cleanly). No rotated pages on the sampled landmarks. The UC Press 1969 typography is clean and produces extraction that flows continuously across paragraph boundaries.

**Per-chapter OCR flags**:

- **GM-00 (Intro)** — high. Sampled PDF p. 13 (book p. xvi): 2,585 chars, clean prose flow.
- **GM-01 (Container)** — high. Sampled PDF p. 30 (book p. 9): clean.
- **GM-02 (Antinomies)** — **medium-high; flagged for OCR-cleanup pass in Phase 2**. Sampled PDF p. 42 (book p. 21) shows the chapter-opening Indo-Germanic etymology of the Stance-family. The italic root "stā" OCRs as `std` (a known ABBYY pattern when an italic short technical term sits at line-end with a macron); the body-text words "explicitly" and "sufficiently" render as `explicidy` and `sufficiendy` (italic-tl character cluster confusion); "elementarism" elsewhere renders `elementaiism`; "Coriolanus" in the Index renders `Cariolanus`. None of these is catastrophic — context-driven Phase 2 cleanup handles them — but they are concentrated in GM-02 because that chapter does the heaviest italic-technical-term work in the volume. Phase 2 agent for GM-02 should normalize via context before downstream concept-extraction.
- **GM-03 (Scope)** — high. Sampled PDF p. 110 (book p. 89): clean.
- **GM-04 (Scene)** — high. Sampled PDF p. 165 (book p. 144): clean. Despite the Hellenistic-materialism subsection (Lucretius / Epicurus) containing many transliterated terms, no italic-cluster issues observed at the sampled page.
- **GM-05 (Agent)** — high. Sampled PDF p. 215 (book p. 194): clean. The chapter's German philosophical vocabulary (e.g., the *Vorstellung* family from GM-02 echoed in GM-05) does not produce visible OCR issues at the sampled page.
- **GM-06 (Act)** — high. Sampled PDF p. 265 (book p. 244): clean. The chapter has Latin (Aristotle/Aquinas) and selected Greek transliterations; no OCR issues at the sampled page; Phase 2 should verify Greek/Latin term-extraction across the full chapter.
- **GM-07 (Agency-Purpose)** — high. Sampled PDF p. 315 (book p. 294): clean. Pragmatist vocabulary OCRs cleanly.
- **GM-08 (Constitutions)** — high. Sampled PDF p. 380 (book p. 359): clean. Despite the chapter's length (79 pp.), the typography is regular.
- **GM-09 (Dialectic in General)** — high. Sampled PDF p. 445 (book p. 424): clean.
- **GM-10 (Keats)** — high. Sampled PDF p. 475 (book p. 454): clean. Phase 2 agent should preserve verse line-breaks (the chapter quotes the entire Ode in segments).
- **GM-11 (Intrinsic)** — high. Sampled PDF p. 495 (book p. 474): clean.
- **GM-12 (Moore)** — high but **chapter caveat**. Sampled PDF p. 515 (book p. 494) yielded only 1,531 characters — about 60% of the volume average. This is not an OCR fault but an artifact of the chapter's heavy verse-quotation: pages alternating between Burke's prose and indented Moore-poetry blocks produce lower character density per page. Phase 2 agent must preserve poetry-line-break structure.
- **GM-13 (Four Master Tropes)** — high. Sampled PDF p. 530 (book p. 509): clean.

**Additional cross-chapter flags**:
- Footnote markers (`*`, `†`, `‡`) preserved; Phase 1 metadata should verify attachment to body-text references.
- Chapter-opening pages include a single capital roman numeral (e.g., "I" for Part 1.I) prepended to the chapter title; tag as header during Phase 2 chunking.
- The Index (book pp. 519–530 / PDF pp. 540–551) extracts as paired two-column streams that interleave correctly when concatenated; Phase 3 terminology-extraction can treat the Index as a flat lemma-list without column-disentanglement.

---

## 6. Cite-presence checks

**Method**: PyMuPDF text extraction across all 551 PDF pages, with case-insensitive regex pattern matching for each target name. Aggregate hit counts and per-page hit-tables generated; results summarized below and stored in `manifest.json[cite_check]`. Hit counts include all surface forms (e.g., "Aristotle" + "Aristotelian"). Per-page hits are reported as book-page numbers (PDF page − 21).

### 6.1 Expected positive results — Tier-A (heavy)

These are the philosopher/interlocutor names the plan's §2.1 unit table and §4.1 controlled vocabulary predict will appear with substantial density. All confirmed.

- **Aristotle** — **112 total hits across 63 pages.** First book-page locus 25 (substance discussion in GM-02); densest concentration GM-06 (pp. 227–274). Index entry (book pp. 519–520): "Aristotle, 118, 242–243, 252–254, 275–276, 340, 427–428 / and Aquinas, 227–232 / basic principles of nature, 273 / definition of man, 410 / elementarism of, 57 / idea of God, 35, 68, 245, 254, 428 / Neo-Aristotelian School, 465–484 / on a dramatic plot, 308 / on business utility and science, 215 / on drama and the epic, 409 / on freedom, 267 / on geometry, 261 / on nature, 76 / on substance, 25 / on the physician, 407 / purpose in, 292–293." This is the densest single-author entry in the Index. **The Burke-Aristotle bridge to the existing corpus index for Aristotle's Complete Works is therefore EXEGETICAL** (Burke himself reads Aristotle in GM-06) rather than anticipatory.

- **Spinoza** — **114 hits across 53 pages.** First locus book p. 24 (GM-01 ratio discussion); concentrated in GM-04 (Scene-as-materialism), particularly the "alignment of terms" subsection in the Spinoza section. Spinoza is, by hit-count, the single most-cited philosopher in the volume.

- **Marx** — **105 hits across 48 pages.** First substantive locus book p. 13 (Introduction); concentrated in GM-05 (Agent-as-idealism), specifically the *Marxism / Hegel / Communist Manifesto* subsections (book pp. 201–215 region). Burke's reading places Marxism as an *Agent*-featuring tradition (the class-as-agent) extending and inverting Hegelian idealism.

- **Kant** — **76 hits across 38 pages.** First locus book p. 70 (briefly in GM-03); concentrated in GM-05 with all three Critiques engaged (especially the moral-transcendence subsection).

- **Plato** — **64 hits across 32 pages.** Distributed; concentrated in idealism-context (GM-05) and the Purpose-Platonist subsection of GM-07.

- **Hegel** — **49 hits across 27 pages.** Concentrated in GM-05 (Hegel and post-Kant idealism subsections).

- **Coleridge** — **48 hits across 33 pages.** Coleridge is the most-cited literary interlocutor in the volume. Burke treats Coleridge dually: as theorist (*Biographia Literaria* cited at book pp. 105, 192, 325) and as poet (the Ancient Mariner discussion in GM-08 + GM-09). The Index entry runs over a dozen sub-headings including "on poetry, 68, 105, 174, 224, 338" and "pantisocracy project of, 368–371."

- **Santayana** — **42 hits across 21 pages.** Concentrated in GM-05 (Hegel-and-after) plus scattered throughout. Santayana is more central than the plan §4.1 anticipates and should be elevated to Tier-A in Phase 1 metadata.

- **Korzybski** — **36 hits across 19 pages.** This is the surprise Tier-A philosopher. Korzybski's *Science and Sanity* general-semantics framework pervades Burke's discussions of action and abstracting (book pp. 47, 57, 173, 238–240). The plan does not pre-flag Korzybski; Phase 1 metadata should elevate. He also generates a dedicated Index entry.

- **Keats** — **34 hits across 17 pages.** Concentrated in GM-10 (Appendix A) but cited earlier as well (book p. 246).

### 6.2 Expected positive results — Tier-B (moderate)

- **Hobbes** — 26 hits, 15 pages; concentrated in GM-04 materialism opening (book pp. 131ff).
- **Aquinas** — 25 hits, 14 pages; concentrated in GM-06 Realism (paired with Aristotle).
- **Hume** — 27 hits, 15 pages; concentrated in GM-05 idealism (book pp. 181–185).
- **Berkeley** — 27 hits, 14 pages; opens the GM-05 idealism sequence.
- **Darwin** — 27 hits, 16 pages; GM-04 materialism + scattered.
- **Leibniz** — 32 hits, 17 pages; GM-05 idealism + scene-act discussion.
- **Lucretius** — 11 hits, 6 pages; concentrated in GM-04 Hellenistic-materialism subsection (book pp. 159–165).
- **Epicurus / Epicurean** — 16 hits, 6 pages; same locus as Lucretius.
- **Bergson** — 10 hits, 5 pages; scattered, especially action/time discussions.
- **Dewey** — 8 hits, 7 pages; GM-07 pragmatism.
- **Mead (G. H.)** — 12 hits, 9 pages; GM-06 Act + GM-07 Agency.
- **William James (explicit form)** — only 5 hits as "William James" phrase, but the bare "James" form is much more frequent — Phase 1 metadata must disambiguate. The pragmatism-Agency role places James as Tier-A in Burke's apparatus.
- **Plotinus** — 4 hits, 4 pages; concentrated in GM-07 Purpose-mysticism (book p. 293).
- **Bonaventura** — 2 hits; same locus as Plotinus.
- **Engels** — 7 hits, 6 pages; alongside Marx in GM-05 + GM-08.
- **Lenin** — 10 hits, 10 pages; alongside Marx/Engels in GM-05.
- **Ibsen** — 18 hits across 8 pages; the worked example in GM-01.
- **O'Neill** — 6 hits (regex must use curly-apostrophe U+2019); *Mourning Becomes Electra* worked example in GM-01.
- **Shakespeare** — 15 hits, 10 pages; scattered literary-allusion.
- **Marianne Moore** — 11 hits; concentrated in GM-12 (Appendix C).
- **Wordsworth** — 6 hits, 6 pages; literary-example.
- **Shelley** — 15 hits, 10 pages.
- **I. A. Richards** — 11 hits, 10 pages; the principal contemporary critic-interlocutor (book pp. 32, 235–238).

### 6.3 Expected positive results — Tier-C (minor)

- **Yvor Winters** — 2 hits; GM-11 Neo-Aristotelian context.
- **Allen Tate** — 2 hits; GM-13 Four Master Tropes context.
- **T. S. Eliot** — 3 hits; GM-12 Marianne Moore context.
- **Empson** — 3 hits; scattered.
- **Augustine** — 7 hits, 6 pages; mysticism + theology.
- **Locke** — 11 hits, 10 pages; substance discussion (book pp. 21–23).
- **Bentham** — 8 hits, 7 pages; ethics + pragmatism predecessor.
- **Pascal** — 5 hits, 3 pages.
- **Schopenhauer** — 4 hits, 3 pages; GM-05 post-Kant context.
- **Nietzsche** — 3 hits, 2 pages.
- **Freud** — 13 hits, 8 pages; psychological-motive discussions.
- **Cassirer** — 1 hit; symbolic-form theorist (front matter).
- **Croce** — 1 hit (book p. 171).
- **Veblen** — 1 hit; front-matter only.
- **Ogden** — 1 hit; co-author-of-Richards reference.
- **Baldwin** — 8 hits, 8 pages; **the principal philosophical reference resource** (cited at the opening of every Part 2 chapter as "the Baldwin dictionary"). Phase 3 bibliography deliverable should treat as Type-D.

### 6.4 Negative-result checks (critical for Manual Section E provenance)

The plan §5 Phase 0 hypothesizes that Burke 1945 predates English-language reception of three phenomenological traditions: Heidegger, Merleau-Ponty, and Uexküll. All three predictions are confirmed.

- **Heidegger**: **0 hits across 551 pages.** Patterns searched: `Heidegger`. Wholly absent. Burke 1945 predates the Macquarrie & Robinson translation of *Sein und Zeit* (1962) by seventeen years and predates even the early English-language essays on Heidegger by Werner Brock and others. **Implication**: every Heidegger-Burke edge in this pipeline (BCAP-Burke, *Being and Time*-Burke, *Heidegger and Rhetoric* secondary-Burke) must carry provenance `anticipatory-projection (dissertation)`. The bridges in Manual Section E for Scene ↔ *In-der-Welt-sein* / *Befindlichkeit*, Agent ↔ *Dasein*, Agency ↔ *technē*-tradition-Heidegger-reading, and Purpose ↔ *Worumwillen* are all anticipatory.

- **Merleau-Ponty**: **0 hits.** Patterns searched: `Merleau`, `Merleau-Ponty`. Wholly absent. *Phénoménologie de la perception* was published in 1945 — the same year as the *Grammar* — and was not English-translated until 1962 (Colin Smith). Burke had no plausible access. **Implication**: every Merleau-Ponty-Burke edge (typically anchored at scene-agent ratio + kinesthetic embodiment) is anticipatory.

- **Uexküll / *Funktionskreis* / *Umwelt* / *Merkwelt* / *Wirkwelt***: **0 hits.** Patterns searched: `Uexk`, `Umwelt`, `Funktionskreis`, `Merkwelt`, `Wirkwelt`. Wholly absent. Uexküll's 1934 *Streifzüge durch die Umwelten von Tieren und Menschen* was not English-translated until 1957 (Schiller, in Schiller ed. *Instinctive Behavior*) and a full standalone translation did not appear until 2010 (O'Neil, *A Foray into the Worlds of Animals and Humans*, University of Minnesota Press). **Implication**: Layer C (Uexküll) is wholly **anticipatory-projection (dissertation)**. The Scene ↔ *Umwelt* convergence between Burke's containing-Scene and Uexküll's biosemiotic environment is a theoretically-interesting independent triangulation — two thinkers arriving at structurally similar pictures of "motive-locus as bounded subjectively-constituted environment" from non-overlapping traditions — but it is NOT an exegetical bridge. Manual Section E must flag this convergence as parallel-discovery, not influence, and must flag the risk of forcing the parallel.

### 6.5 Other notable absences

- **Whitehead** — 0 hits. Surprising for a 1945 work that does serious process-philosophy work in Part 3.II (transformation of terms, dissolution of drama). Flag for Phase 2 examination of how Burke handles process-thinking without Whitehead as anchor.
- **Mannheim** — 0 hits. Surprising given Burke's sociology-of-knowledge work in GM-08 Constitutions.
- **Sophocles** — 0 hits. Burke's tragedy interlocutors are Aeschylus (2 hits) and modern (Ibsen, O'Neill); not classical-Greek-tragic.
- **Empedocles** — 0 hits. Burke's pre-Socratic engagement is limited (despite the Lucretius-Epicurus work).
- **Csikszentmihalyi**, **Biocca**, **Gibson** — all anachronistic (post-1945); no need to search but flagged for completeness against the Calleja pipeline's parallel cite-check.

### 6.6 Cite-check summary

POSITIVE-CHECK SUCCESS for all 28 expected names; NEGATIVE-CHECK SUCCESS for all 3 anticipated phenomenological absences (Heidegger 0 / Merleau-Ponty 0 / Uexküll 0); plus four other notable absences flagged for Phase 2 attention (Whitehead, Mannheim, Sophocles, Empedocles). The volume's pre-phenomenological-reception horizon is structurally significant: it determines that every Layer A (Heidegger), most of Layer B (Burke-Calleja anticipation), and all of Layer C (Uexküll) bridges are **anticipatory-projection (dissertation)** rather than exegetical. The one Layer A bridge that *is* exegetical is **Act ↔ Aristotelian *energeia/dynamis* via Burke GM-06 Part 2.III** — and this exegetical bridge is the pipeline's strongest cross-pipeline edge, anchoring directly to the existing Aristotle Complete Works + Phantasia Cluster + Bowin AMT indices.

---

## 7. Cross-pipeline bridge candidates

Building on plan §1.4, I verified which target corpora exist on disk under `corpus/index/`. The full bridge-candidate table is in `manifest.json[cross_pipeline_bridge_candidates]`; key findings:

**On-disk indices** (full pipelines, cross-pipeline edges feasible immediately):
- **In-Game (Calleja 2011)** — primary reciprocal pipeline; pentad × PIM-dimensions bidirectional cross-map; ≥30 edges expected. Calleja contains ZERO Burke references (verified in Calleja Phase 0 manifest), so the bridge is creative/anticipatory from *both* sides; the dissertation move builds the bridge from outside both authors.
- **Aristotle - Complete Works** — direct EXEGETICAL bridge via Burke GM-06.
- **Aristotelian Phantasia Secondary (1985-2017)** — anticipatory bridge via Burke's primary-Aristotle exegesis in GM-06 (8 secondary monographs: Nussbaum, White, Frede, Caston, O'Gorman, Gonzalez, Hawhee *Looking Into Aristotle's Eyes*, Papachristou).
- **Aristotelian Motion and Time Secondary** (Bowin) — anticipatory; Act ↔ kinēsis/energeia.
- **Heidegger - Basic Concepts of Aristotelian Philosophy** (BCAP) — anticipatory only (Burke=0 Heidegger hits).
- **Heidegger - Being and Time** — anticipatory only.
- **Heidegger and Rhetoric** — anticipatory secondary-anchor.
- **Rickert - Ambient Rhetoric** — anticipatory; scene-act ratio ↔ ambient-rhetorical environment.
- **Uncomfortable Situations (Gross 2017)** — anticipatory; incipient-acts ↔ situated emotion.
- **Von Uexkull - A Foray into the Worlds of Animals and Humans** — anticipatory Layer C; Scene ↔ *Umwelt* strongest anchor.

**Not on disk** (deferred to future pipelines):
- **Hawhee — *Moving Bodies: Kenneth Burke at the Edges of Language* (2009)**. Plan §1.4 names Hawhee as an "already-cited corpus Burke anchor," but verification on disk (2026-05-11) shows that `corpus/index/` contains no Hawhee Moving Bodies index. What *is* on disk is Hawhee's *Looking Into Aristotle's Eyes* (2011, in the Phantasia Cluster) — a different work focused on Aristotelian *phantasia* and rhetorical vision, not on Burke. **Implication**: the Burke-Hawhee bridge cannot be built in Phase 3; it must be flagged in Manual Section E as `hawhee_moving_bodies_pipeline_status = pending-future-pipeline` (analogous to the `consubstantiation_pipeline_status = pending-future-rhetoric-of-motives-pipeline` flag). The Hawhee 2011 *Looking Into Aristotle's Eyes* may serve as a partial Burke-Hawhee surrogate via shared Aristotelian-vision thematics anchoring GM-06, but it does not substitute for the Moving Bodies thematics (moving-bodies thesis ↔ scene-agent ratio + agency-as-embodiment).

- **Burke — *A Rhetoric of Motives* (1950)**. PDF is on disk at `corpus/rhetorical_ontology/Burke, Kenneth - A Rhetoric of Motives_(1950)_[My Copy].pdf`; no index built yet. This is the most-anticipated forward pipeline because *Rhetoric* introduces (a) Attitude as a 6th pentad term (modifying every Section A entry of the Pentad Operationalization Manual), (b) *consubstantiation* and *identification* as the apparatus that completes the dissertation's "incorporation ↔ consubstantiation" bridge to Calleja, and (c) the deployment of dramatism toward persuasion-analysis specifically. Manual Section E will flag this as `consubstantiation_pipeline_status = pending-future-rhetoric-of-motives-pipeline`.

- **Burke — *The War of Words* (2018, posthumous)**. PDF is on disk at `corpus/rhetorical_ontology/Burke, Kenneth - The War of Words_(2018)_[My Copy].pdf`; no index built yet. This is the recovered "Symbolic of Motives" material, extending dramatism into conflict-analysis and complementing *Grammar*'s constitutional analysis (GM-08) and *Grammar*'s scapegoat-dialectic (GM-09).

**Dissertation**: every pentad term, every ratio, every trope, every substance-type, every methodological apparatus (representative anecdote, circumference, intrinsic/extrinsic) is a candidate operationalizable construct for the dissertation's game-user-motive-analysis chapter.

---

## 8. Pre-tagged pentad spine

The full per-unit pentad-spine pre-tagging is stored in `manifest.json[pentad_spine_pre_tag]`; reproduced compactly:

- **GM-00 (Intro)**: all 5 terms canonically stated.
- **GM-01 (Container)**: all 10 dyadic ratios developed.
- **GM-02 (Antinomies)**: substance-vocabulary cross-cut, especially actus/status ↔ Act-Agent ratio.
- **GM-03 (Scope)**: Act (as locus of motives, book pp. 64–69) + Scene (as circumference, book pp. 77–85); plus representative anecdote as cross-cutting methodological apparatus.
- **GM-04 (Scene)**: Scene featured in materialism.
- **GM-05 (Agent)**: Agent featured in idealism (extending into Marxism as class-as-agent).
- **GM-06 (Act)**: Act featured in realism — EXEGETICAL bridge to Aristotle.
- **GM-07 (Agency-Purpose)**: Agency featured in pragmatism + Purpose featured in mysticism.
- **GM-08 (Constitutions)**: applied dramatism with all five terms deployed; methodological template.
- **GM-09 (Dialectic in General)**: transformation-of-terms across all five; first-class dialectical apparatuses.
- **GM-10 (Keats)**: worked Ode-dramatism on Act + Scene + Agent + Purpose.
- **GM-11 (Intrinsic)**: scene-act meta-clarification via intrinsic/extrinsic.
- **GM-12 (Moore)**: worked oeuvre-dramatism on Act + Scene + Agent.
- **GM-13 (Four Master Tropes)**: trope-deployments cross-cut all five pentad terms.

This pre-tagging feeds Phase 1 metadata (each unit metadata file inherits the expected pentad-term and ratio lists) and Phase 3 ontology-deduplication (the pentad terms + 10 ratios + 4 tropes + ≥13 substance-types are all Tier-1 by default).

---

## 9. Hawhee 2009 anchor note

The plan §1 mentions Hawhee's *Moving Bodies: Kenneth Burke at the Edges of Language* (2009) as an "already-cited corpus Burke anchor." Verification 2026-05-11 against `corpus/index/` directory listing shows that **no Hawhee Moving Bodies index exists**. The corpus does contain Hawhee's *Looking Into Aristotle's Eyes: Toward a Theory of Rhetorical Vision* (2011) — included in the Phantasia Cluster — but that is a different work on Aristotelian *phantasia*, not on Burke. The PDF for *Moving Bodies* may or may not exist in the source corpus; this Phase 0 has not searched the raw PDF roots beyond `corpus/rhetorical_ontology/`, which contains the Burke PDFs but does not contain a Hawhee *Moving Bodies* PDF.

**Recommendation**: in Phase 3 Wave 1 (3D.i pentad manual + 3E cross-pipeline edges), the Burke-Hawhee bridge is documented as `pending-future-hawhee-moving-bodies-pipeline` and the cross-pipeline Mermaid graph (Phase 3 Wave 2 deliverable 5) does NOT include Hawhee Moving Bodies nodes. If the plan's intended Burke-Hawhee anchor is via Hawhee 2011 *Looking Into Aristotle's Eyes*, that anchor IS available — but its thematic scope is Aristotelian-rhetorical-vision, not Burke-pentad-moving-bodies, so the bridge is partial.

---

## 10. Forward-pipeline anchors

Two Burke volumes in `corpus/rhetorical_ontology/` are future-pipeline candidates that this Grammar pipeline anticipates:

1. **Burke — *A Rhetoric of Motives* (1950)** (`Burke, Kenneth - A Rhetoric of Motives_(1950)_[My Copy].pdf`). The most-anticipated forward pipeline. Three load-bearing additions to *Grammar*'s apparatus: (a) Attitude as a 6th pentad term modifying every Section-A entry of the Pentad Operationalization Manual; (b) *consubstantiation* / *identification* as the rhetorical-theoretic apparatus that completes the Calleja-incorporation ↔ Burke-consubstantiation bridge; (c) the deployment of dramatism specifically for persuasion-analysis (extending *Grammar*'s grammatical project into a rhetorical project, per Burke's own trilogy plan). Manual Section A's `forward_reference_to_rhetoric_of_motives_attitude` field is pre-allocated for every pentad term entry; Manual Section E sets `consubstantiation_pipeline_status = pending-future-rhetoric-of-motives-pipeline`.

2. **Burke — *The War of Words* (2018, posthumous; ed. Anthony Burke + Kyle Jensen, UC Press)** (`Burke, Kenneth - The War of Words_(2018)_[My Copy].pdf`). The recovered "Symbolic of Motives" / late-Burke conflict-analytic material. Extends dramatism into the analysis of strategic war-rhetoric, complementing *Grammar*'s constitutional analysis (GM-08) and scapegoat-dialectic (GM-09). When indexed, this volume will provide a third forward-anchor for the Pentad Operationalization Manual.

Neither volume is currently indexed under `corpus/index/`. This Grammar pipeline's forward-references treat both as `pending-future-pipeline` and reserve named integration nodes in Manual Section A + E.

---

## 11. Operational readiness summary

**Phase 1 (14 unit metadata files, batches of 4/4/3/3)**: READY. All 14 unit folders exist; the manifest carries body-page counts, expected pentad-term tags, ratio expectations, philosophic-school assignments, edge targets, triple-pass flags, and per-chapter OCR-confidence flags. Phase 1 agents should additionally: (a) extract internal-section heading lists per chapter (Burke uses extensive subheads — Phase 0 has spot-checked but not exhausted); (b) verify Tier-A philosopher elevation for Korzybski (36 hits) and Santayana (42 hits); (c) disambiguate bare-surname pragmatist references in GM-07 (William James vs. Henry James; G. H. Mead vs. Margaret Mead).

**Phase 2 (14 deep-analysis runs)**: READY. Six chapters are triple-pass: GM-00 + GM-01 (load-bearing pentad + ratios) and GM-04 through GM-07 (per-pentad-term operationalization via philosophic-school chapters). Four Appendix essays are full-unit (≥35 edges). GM-08 receives extended wall-time (79-pp. chapter). GM-02 receives italic-term OCR-cleanup pass before downstream extraction.

**Phase 3 Wave 1 (6 synthesis agents)**: READY. Cite-check results determine Manual Section E framing: **Act-Aristotle/Aquinas bridge is EXEGETICAL** (Burke GM-06 direct); all other Layer A (Heidegger), Layer B (Calleja-anticipation from Burke side), and Layer C (Uexküll) bridges are **anticipatory-projection (dissertation)**. The Hawhee Moving Bodies bridge is also anticipatory due to absent corpus index. The Section E forward-pipeline flags are: `consubstantiation_pipeline_status = pending-future-rhetoric-of-motives-pipeline`, `hawhee_moving_bodies_pipeline_status = pending-future-pipeline`.

**Phase 3 Wave 2 (1 graphing agent)**: READY. Cross-pipeline Mermaid graph (hard cap 30 edges) excludes Hawhee Moving Bodies nodes (no on-disk pipeline); edge priority order is dissertation > Calleja-PIM > Aristotle (EXEGETICAL) > Heidegger BCAP > Uexküll > Rhetoric-of-Motives forward-ref placeholder.

**Phase 4 (cross-pipeline integration)**: PARKED per plan §5 Phase 4. Activation gates on dissertation framework + future-pipelines (Rhetoric of Motives, War of Words, Hawhee Moving Bodies).

**Blocking issues**: none.

**Non-blocking advisories**:
1. Hawhee Moving Bodies index does not exist on disk; plan §1.4 reference needs updating.
2. GM-07 metadata must disambiguate "James" and "Mead" bare-surname references.
3. GM-05 metadata should elevate Santayana to Tier-A.
4. Korzybski (not pre-flagged in plan §4.1) emerges as a Tier-A interlocutor and should be added to the controlled-vocabulary Tier-A philosopher list.
5. Whitehead, Mannheim, Sophocles, Empedocles absences are surprising; Phase 2 should flag how Burke handles each thematic space without these anchors.

---

*End of Phase 0 overview. Structured manifest companion file: `manifest.json` (same directory).*
