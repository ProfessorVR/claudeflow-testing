# Phase 0 Overview — Burke, *A Rhetoric of Motives* (1950)

**Pipeline**: prerequisite pipeline for `plans/burke-calleja-game-behavior-integration.md` (Phase 1).
**Date**: 2026-05-27
**Source PDF**: `corpus/rhetorical_ontology/Burke, Kenneth - A Rhetoric of Motives_(1950)_[My Copy].pdf` (356 PDF pp.)
**Text cache** (offset-free mining): `tmp/Dissertation/Pathe/citations/text-cache/Burke__Kenneth_-_A_Rhetoric_of_Motives__1950___My_Copy_.txt`

## Verified offset
**book p. _n_ = PDF p. _n_ + 15.** Verified on 3 landmarks: book p.3 ("Range of Rhetoric" opening) → PDF p.18; book p.20 ("Consubstantiality") → PDF p.35; book p.183 ("Positive, Dialectical, and Ultimate Terms") → PDF p.198.

## Why this pipeline (scope discipline)
This is the **prerequisite** that unlocks the Burke × Calleja integration. It exists to capture three things the *Grammar* pipeline could not:
1. **Identification** — the master term of the *Rhetoric* (≈157 textual hits); rhetoric redefined from "persuasion" to "identification."
2. **Consubstantiality / consubstantiation** — the substance-theoretic ground of identification (≈17 hits, concentrated at book pp.19–23). **This is the motive-mechanism beneath Calleja's *incorporation*** — the keystone of the integration.
3. **Attitude** — the incipient/suspended act; Burke's later 6th dramatistic term (seeded in *Grammar* GM-06/GM-09 1962 addendum, operationalized via the *Rhetoric*'s rhetorical-stance material).

Secondary capture (social-motive apparatus for multiplayer behavior): **courtship, mystery, hierarchy, the negative, pure persuasion.**

## Canonical spine (pre-tag every unit against these)
`identification` · `consubstantiality` · `Attitude (6th term)` · `courtship` · `mystery` · `hierarchy` · `the negative` · `pure persuasion` · `terministic screen`. Every unit's metadata must flag which spine concepts it develops + which **Calleja-PIM dimension** and which **pentad term** each maps to (anticipatory).

## Unit table (8 units; PDF ranges = book + 15)
| Unit | Heading / coverage | Book pp. | PDF pp. | Role / integration relevance |
|---|---|---|---|---|
| **RM-00** | Introduction + Part I open: Milton's *Samson*, suicidal motive, Arnold, Imaging of Transformation, essence/personality terms | xi–18 | 12–33 | Sets up identification; "imaging of transformation" |
| **RM-01** | **Identification & "Consubstantiality"**; identifying nature of property; the "Autonomous"; rhetoric of address; primitive magic; realistic function | 19–48 | 34–63 | **KEYSTONE — TRIPLE-PASS.** consubstantiation↔incorporation bridge lives here |
| **RM-02** | Part II: Persuasion; Identification (redux); Formal Appeal; Rhetorical Form in the Large; Imagination; Image & Idea | 49–89 | 64–104 | Persuasion→identification; form-as-appeal |
| **RM-03** | Part II: Rhetorical Analysis in Bentham; Marx on "Mystification"; Cromwell; Carlyle on "Mystery" | 90–122 | 105–137 | **mystery** enters; ideology as rhetoric |
| **RM-04** | Part II: Empson; Veblen ("Invidious"); **Metaphorical View of Hierarchy**; Diderot; Rochefoucauld; Pascal; Machiavelli ("Administrative" rhetoric); Dante | 123–180 | 138–195 | **hierarchy** + applied-analysis templates |
| **RM-05** | Part III (Order) open: **Positive, Dialectical, Ultimate Terms**; Marxist persuasion; Sociology of Knowledge vs Platonic Myth; Mythic Ground | 183–207 | 198–222 | terministic hierarchy of motive |
| **RM-06** | Part III: **Courtship**; Venus & Adonis ("socioanagogic"); Paradigm of Courtship (Castiglione); Caricature (Kafka, *The Castle*); Kierkegaard | 208–251 | 223–266 | **courtship + social hierarchy = social-motive apparatus** (extended budget) |
| **RM-07** | Part III: The Kill and the Absurd; Order, the Secret, and the Kill; **Pure Persuasion**; Rhetorical Radiance of the "Divine" (Henry James, Hopkins, Yeats, Eliot, oxymoron, **Ultimate Identification**) | 252–333 | 267–348 | culmination; pure-persuasion limit-case (extended budget) |

(Index: book pp.~334+ / PDF ~349–356 — mined for terminology only.)

## Cross-pipeline anchors (for the integration, Plan Phases 2–4)
- **Burke *Grammar of Motives*** — `corpus/index/A Grammar of Motives (Burke 1945)/` — the 5-term pentad + ratios this pipeline extends with Attitude; consubstantiation bridge flagged `pending` there is consolidated here.
- **Calleja *In-Game*** — `corpus/index/In-Game (Calleja 2011)/` — incorporation (Ch.10) is the target of the consubstantiation bridge; Shared involvement (Ch.6) is the target of courtship/hierarchy.
- **Anticipatory pentad↔PIM mappings** — both manuals' Section E (to be validated in Plan Phase 2).

## Provenance discipline (MANDATORY, all units)
- `burke-direct` — Burke's own claim (identification, consubstantiality, courtship, hierarchy, pure persuasion).
- `anticipatory-projection` — application to game behavior / Calleja-PIM mapping (NOT Burke's claim).
- Never present game-application as Burke's claim. Every `maps-to-pim-dimension` / `maps-to-pentad-term` edge carries `provenance="anticipatory-projection"`.

## Content filter (MANDATORY)
Paraphrase only; **no ≥25-word verbatim** from Burke. Pithy term-glosses ≤15 words OK if attributed (e.g. identification as "consubstantiality"). Preserve Burke's signature moves (identification, consubstantiality, courtship, the negative, terministic screen) — paraphrase, do not "clean up."

---

## Appendix — Phase 2 deep-unit output specification (every deep agent follows this)

**Extract source text first:**
```
pdftotext -f <PDFstart> -l <PDFend> "corpus/rhetorical_ontology/Burke, Kenneth - A Rhetoric of Motives_(1950)_[My Copy].pdf" /tmp/<unit>.txt
```
Read `/tmp/<unit>.txt`. OCR is imperfect (UC Press 1950) — silently correct obvious ligature/scan errors when paraphrasing.

**Produce 3 files in** `corpus/index/A Rhetoric of Motives (Burke 1950)/<unit-folder>/`:

1. **`<unit>-deep.md`** — paraphrastic analytical narrative (word target per unit). Required sections:
   - **Overview** (what this unit argues, 1 para)
   - **Argument** — page-anchored walkthrough (cite *book* pages, e.g. "(p.20)")
   - **Key concepts** — each with a ≤60-word gloss; flag spine concepts (identification / consubstantiality / Attitude / courtship / mystery / hierarchy / the negative / pure persuasion)
   - **Identification & consubstantiation development** — how this unit advances the master term (even if only implicitly)
   - **Attitude (incipient-act) signals** — where the 6th-term material surfaces
   - **Game-behavior application (anticipatory)** — map this unit's concepts to Calleja-PIM dimension(s) + pentad term(s); label every mapping `[anticipatory-projection]`
   - **Cross-pipeline bridges** — to Grammar pentad + Calleja PIM (+ Shared involvement for courtship/hierarchy units)
2. **`<unit>-deep.json`** — `{unit_id, heading, book_pp, pdf_pp, outline[], concepts[≥15 each {id,label,gloss,tier,spine_tags[],provenance}], positions[≥4], pentad_term_tags[], calleja_pim_candidates[{pim_dimension,rationale,provenance:"anticipatory-projection"}], interlocutors[], tensions[≥2], edge_count}`
3. **`edges.csv`** — header `source,relation,target,domain,provenance,book_page`; relations ∈ {defines,cites,extends,contests,qualifies,identifies-with,consubstantial-with,bridges-to-pipeline,maps-to-pim-dimension,maps-to-pentad-term}; game/PIM/pentad mappings MUST carry `provenance=anticipatory-projection`.

**Return to orchestrator:** ONLY a brief summary — the 3 paths, .md word count, concept count, edge count, and 2–3 sentences on this unit's contribution to the consubstantiation↔incorporation keystone. **Do NOT paste file contents.**
