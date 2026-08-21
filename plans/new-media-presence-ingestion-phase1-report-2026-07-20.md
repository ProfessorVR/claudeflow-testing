# Phase 1 Report — New-Media Presence / Second-Life Ingestion & Index-Entry Plan

**Date:** 2026-07-20
**Scope:** Phase 1 ONLY (audit → ingest missing → snapshot rebuild → validate → analyze 9 sources → propose index-entry plan). No index entries created. No commits/pushes. STOP after this report; Phase 2+ gated on user go-ahead.
**Repos:** `~/projects/archon-cli` (retrieval backbone) · `~/projects/claudeflow-testing` (index entries)
**Purpose these sources serve:** revising the Part III "social interior" claim (few deployed pedagogical VEs had a social interior; multiplayer + spatial proximity-voice rare in credit-bearing deployments) — Boellstorff's *Second Life* work is the named counterexample domain. Sources bear on social presence in virtual worlds, presence theory, interactive-learning pedagogy, and (Lepecq) Part II world-disclosedness.

---

## 1. Ingestion audit

Baseline before this session: **224/224 Ingested, 0 Failed** (HNSW snapshot `doc-text-20260717T194332Z`). All 9 target PDFs exist under `corpus/new_media/`. **7 of 9 were already ingested** in a prior pass; only **Boellstorff** and **Davis & Boellstorff** were missing.

| # | File (corpus/new_media/) | Exists | Already ingested? | Ingested this session | doc id | chunks (all `embed=indexed`) | pages |
|---|---|---|---|---|---|---|---|
| 1 | Boellstorff — For Whom the Ontology Turns (2016) | yes | no | **yes (partial state — see §2)** | doc-4b73b5d8 | 36 | 21 |
| 2 | Davis & Boellstorff — Compulsive Creativity (2016) | yes | no | **yes (fully Ingested)** | doc-b9c33b90 | 20 | 23 |
| 3 | Champion — Social Presence & Cultural Presence in Oblivion | yes | yes (prior) | — | doc-17cd5ead | 37 | 10 |
| 4 | Golliher — Go Ahead Touch this Dinosaur Fossil | yes | yes (prior) | — | doc-f7e39d1b | 21 | 47 |
| 5 | Lepecq — Afforded actions… physical presence in VEs | yes | yes (prior) | — | doc-0a0d3290 | 27 | 11 |
| 6 | Mantovani & Riva — 'Real' Presence | yes | yes (prior) | — | doc-e2a3f7ab | 11 | 11 |
| 7 | Riva — Is presence a technology issue? | yes | yes (prior) | — | doc-b9c0d254 | 20 | 11 |
| 8 | Spagnolli — Mediated presence (editorial) | yes | yes (prior) | — | doc-8106c761 | 3 | 3 |
| 9 | Ulrich — Seeing is Believing (rhetoric of VR) | yes | yes (prior) | — | doc-0a3bfc1a | 13 | 14 |

Data-quality notes on the 7 prior ingests:
- **Mantovani & Riva (doc-e2a3f7ab)** is a **scanned/image PDF** (pdftotext yields 66 words; page-level `text_hash` is identical across all 11 pages — a cosmetic OCR-layer artifact). However its **11 chunks are distinct, all `embed=indexed`, and retrievable** at meaningful semantic scores (0.4–0.6) with correct OCR content ("'Real' Presence: How Different Ontologies Generate Different Criteria…"; "From the viewpoint of ingenuous realism…"; "…reality as socially constructed…"). Retrieval-healthy, but **run `verify-quote` before trusting any verbatim** from it (OCR'd source).
- The other 6 prior docs extract cleanly and chunk normally.

---

## 2. Ingestion of the 2 missing docs + the VLM/GPU blocker (transparency)

**Environmental blocker encountered.** The box's 32 GB GPU was saturated (~31 GB used) by god-agent services — vLLM Qwen-Coder (`--gpu-memory-utilization 0.85` ≈ 27 GB, persistent) plus a separate god-agent `marker_server` on :8003. These are **not mine to stop** (out of scope; would disrupt god-agent). Only ~1 GB VRAM was free.

**What this broke, and what it did NOT.** The Marker text/bbox provenance layer (the citation-critical layer the plan §3 and the hard rules protect) ran fine — Marker completed for Boellstorff (21 pages, all distinct hashes). The stall was in the **separately-gated, optional VLM image-description enrichment** (`[policy.docs.vlm]`): Ollama's `qwen2.5vl:7b` could not load into VRAM (`size_vram: 0`), fell back to CPU, and the streaming connection kept the per-call `timeout_secs = 120` from ever tripping. The first Boellstorff ingest hung indefinitely in the VLM stage.

**Resolution (no forbidden ops; no citation-quality loss).**
1. Killed the hung ingest process (single, backgrounded, mine).
2. Backed up `.archon/policy.toml` → `.archon/.backups/policy.toml.20260720T074047Z.bak`.
3. Temporarily set `[policy.docs.vlm] enabled = false` — this disables ONLY figure-description enrichment; it does **not** touch the Marker text/page/bbox layer, which is the entire basis of text-verbatim citation. This is materially different from the "ingested-without-Marker" degradation the hard rule forbids.
4. Re-ran the two single-file ingests. **Davis completed fully in 65 s → state `Ingested`, 20/20 chunks indexed.**
5. **Restored `policy.toml` from the backup** (`[policy.docs.vlm] enabled = true` confirmed).

**Boellstorff residual state — important.** The *first* (hung) Boellstorff run had already pushed the doc through Marker → chunk → **embed/index** before it stalled on VLM. So `doc-4b73b5d8` is **functionally complete for retrieval**: 36/36 chunks `embed=indexed`, top semantic hit at **score 1.000**. Only the optional VLM pass (1 born-digital figure) and the final state-flag flip to `Ingested` did not occur, so `docs status` shows it as **"Ingesting."** Because content-hash dedup then blocks a clean re-ingest ("Skipped: duplicate"), and because flipping the flag would require `reprocess`/`delete` (**both forbidden by the hard rules**), the doc is left as-is. **It is fully usable as evidence now**; the "Ingesting" label is cosmetic.

**Recommended cleanup for a later phase (needs user go-ahead — involves a forbidden-by-this-task op):** when the GPU is free (or with VLM disabled), run `docs delete` + fresh `docs ingest` on the Boellstorff file to get a clean `Ingested` state + the 1 figure's VLM description. Not required for citation use.

Final `docs status`: **226 sources — 225 Ingested, 1 "Ingesting" (Boellstorff, retrieval-complete), 0 Failed.**

---

## 3. Snapshot rebuild (OP RULE — after any new ingest)

`archon docs vector-compact` (EXIT 0, ~8m6s build over 60,548 raw RocksDB vectors):

| | Before | After (this session) |
|---|---|---|
| Snapshot basename | `doc-text-20260717T194332Z` | **`doc-text-20260720T145233Z`** |
| Vectors | 21,852 | **21,908** (+56) |
| Provider / dim | fastembed-onnx / 768 | fastembed-onnx / 768 |

The +56 delta = 36 (Boellstorff) + 20 (Davis) new text chunks — exactly the two ingests. Stale-snapshot omission risk cleared.

## 4. Validation — PASS

- **Semantic search speed:** query "virtual world Second Life social presence disability community" returned 10 results in **~6.8 s** (well under the 65–100 s no-snapshot fallback), top hit = Davis chunk `doc-b9c33b90…-0` at score 0.739. Confirms the fresh snapshot is live and includes the new docs.
- **`evidence find --mode exact` on the 2 newly ingested docs — both `exact-1.00 · bbox ✓`:**
  - **Boellstorff** (`--source "Boellstorff"`), query "the false opposition of the digital and the real": 3 candidates, all `provenance: exact-1.00 (sim 1.00) · bbox ✓` (top hit p.1).
  - **Davis** (`--source "Compulsive"`), query "we analyze the intersection of creativity and agency by examining": `provenance: exact-1.00 (sim 1.00) · bbox ✓` (pp.1-2).

Both new docs are retrievable with sentence-tight bbox + page-exact provenance — the citation backbone the Part III drafting needs is live for these sources.

---

## 5. The 9 source analyses

### 5.1 Boellstorff, Tom — "For Whom the Ontology Turns: Theorizing the Digital Real" (*Current Anthropology* 57(4), 2016)
Sociocultural anthropology / digital anthropology, working the "ontological turn." Boellstorff's target is the **false opposition of the "digital" (virtual/online) to the "real."** He argues this opposition misrepresents the online–offline relation in both directions: it obscures the myriad ways the online *is* real (learn German online, speak it in Germany; lose money gambling online, have fewer dollars), and it wrongly implies everything physical is real (ignoring physical-world play and fantasy). Drawing on ontological-turn scholarship, his own *Second Life* ethnography, and Tarde, he presses toward an account of the digital that "problematizes both similitude and difference," treating the virtual as a genuine modality of the real rather than a deficient copy. **Relevance:** the load-bearing *theoretical* warrant for treating a virtual world (Second Life) as a real place with a real social interior — directly underwriting the counterexample to the Part III "social interior" hedge. Also a conceptual bridge to Part II's ontology of the virtual (the virtual as real, not un-real). This is theory, not a deployment case; it licenses the claim rather than instancing it.

### 5.2 Davis, Donna & Tom Boellstorff — "Compulsive Creativity: Virtual Worlds, Disability, and Digital Capital" (*International Journal of Communication* 10, 2016)
Digital anthropology / ethnography of virtual worlds. An ethnographic study of people living with Parkinson's disease who are active in **Second Life** — the "Creations for Parkinson's" community. The authors coin **"compulsive creativity"** and introduce **"digital embodied states"** and **"digital objectified states"** to extend Bourdieu's social/cultural capital into virtual worlds, arguing online technologies do more than *compensate* for disability: they open new possibilities for selfhood and community. **Relevance:** the strongest *empirical* instance of Second Life functioning as an inhabited social world — a persistent place where users are together, form community, and build cultural capital. This is precisely the "social interior" the Part III claim says was rare: a virtual world used as durable social space (though not itself a credit-bearing pedagogical deployment). Anchors the social-presence-in-virtual-worlds cluster with Boellstorff's theory (5.1).

### 5.3 Champion, Erik — "Social Presence and Cultural Presence in Oblivion" (PerthDAC 2007)
Game studies / virtual-heritage / VE design. Champion asks whether a **single-player** game (*Elder Scrolls IV: Oblivion*) can evoke a **social** or **cultural** world, and builds a framework distinguishing world, social presence, and **cultural presence** (hermeneutic richness). Oblivion partly succeeds as a *social* world (NPC interaction, communal identity, role mimicry) but **fails as a rich cultural world**; he proposes improvements (enhanced embodiment, dynamic cognitive artifacts, social role mimicry, staggered multiplayer questing, cultural-learning tools). **Relevance:** supplies the **social presence / cultural presence** vocabulary for virtual worlds and shows social presence is not simply equivalent to multiplayer — nuancing the Part III claim that a "social interior" requires multiplayer + proximity-voice. Bridges the social-presence cluster to game studies (and to the Part II RDR2/game-analysis material). Note the companion file `Champion — When Windmills Turn Into Giants` is also already in the DB (doc-da6a0458) — not in the 9 but a natural sibling.

### 5.4 Golliher, Steffanie — "'Go Ahead Touch this Dinosaur Fossil': The Rhetoric of Interactivity in Museum Culture" (MA thesis, Clemson, 2013)
Rhetoric / museum studies. **Not a social-presence source** (per user note). Golliher problematizes the Creation Museum's "interactive" exhibits, arguing they are **sensational rather than genuinely interactive**: sensory triggers presented under a guise of visitor empowerment/agency actually foreclose experimentation and impose a predetermined (creationist) narrative; she extends the critique to mainstream science centers, which likewise preclude visitor agency by supplying answers. **Relevance:** a rhetoric-of-interactivity lens — the pedagogical *value* of genuinely interactive, agency-granting learning experiences vs. mere sensation. Bears on the interactivity/agency dimension of learning environments (adjacent to, not part of, the presence/social-interior argument). Best kept out of the social-presence grouping; pairs conceptually with Ulrich (rhetoric) more than with the presence sources.

### 5.5 Lepecq, Jean-Claude, et al. — "Afforded actions as a behavioral assessment of physical presence in virtual environments" (*Virtual Reality* 13, 2009)
Cognitive science / psychophysics of presence. **Not social presence** (per user note). Subjects walk through virtual apertures of varying width; most **rotate the shoulders when the aperture is narrow relative to their body**, reproducing a behavioral transition documented in real environments (Warren & Whang 1987). Lepecq argues this afforded action is an **objective behavioral index of physical presence** — any affordance could serve as a sensorimotor presence measure. **Relevance:** presence-theory cluster (physical/spatial presence, measurement). Its deeper significance is for **Part II world-disclosedness**: presence is indexed by the body's attunement to what the environment *affords* — a Gibsonian affordance framing that maps onto disclosedness/Umwelt (the virtual environment discloses possibilities for action to which the lived body responds). **Flag for Part II bridge** (see §6/§7); natural sibling of the Von Uexküll entry.

### 5.6 Mantovani, Giuseppe & Giuseppe Riva — "'Real' Presence: How Different Ontologies Generate Different Criteria for Presence" (*Presence: Teleoperators & Virtual Environments* 8(5), 1999)
Cultural psychology / presence theory (foundational). Argues the criterion of "real" presence depends on one's **ontology**. Against **naive ("ingenuous") realism** — which treats presence as faithful reproduction of a mind-independent physical state — they advance a **cultural-constructivist, situated-action** ontology: reality (and thus presence) is socially and culturally mediated, always an interpretation, and the reference point for presence is not the physical environment but the **ecology of relations between actor and (culturally mediated) environment**. **Relevance:** the ontological hinge of the presence-theory cluster and a strong bridge to Part II — presence is disclosedness within a mediated world, not photographic copy. (Scanned/OCR source: retrieval-healthy; verify-quote before verbatim.)

### 5.7 Riva, Giuseppe — "Is presence a technology issue? Some insights from cognitive sciences" (*Virtual Reality* 13, 2009)
Cognitive science / neuropsychology of presence. Riva broadens presence **beyond technology**: presence is a **core neuropsychological phenomenon whose function is to produce a sense of agency and control** — subjects are "present" when they can **enact their intentions** in an external world (virtual or real). An environment does not offer undifferentiated, ready-made objects equal for all; it offers **differential opportunities** and produces presence to the degree it supports users' intentions. **Relevance:** presence-theory cluster (intentional/enactive account); pairs with Mantovani & Riva (same intellectual program) and bridges to Part II (presence as enacted intention-in-a-world; affordance/opportunity structure echoes Lepecq and Gibson/Uexküll).

### 5.8 Spagnolli, Anna, Matthew Lombard & Luciano Gamberini — "Mediated presence: virtual reality, mixed environments and social networks" (editorial, *Virtual Reality* 13, 2009)
Presence research (editorial framing a special issue from PRESENCE 2008). Surveys **mediated/technology-mediated presence** across VR, mixed environments, and social networks; frames presence and *social* presence as investigable through the **analysis of participants' action** (three of the issue's papers share this action-based method). Brief (3 pp.). **Relevance:** a connective/overview source for the presence cluster; usefully links the physical-presence action-based approach (Lepecq) to *social* presence and situates the whole field. Low standalone citation weight (editorial) but good scaffolding/context; could sit in the Presence-Theory entry as a framing note or bridge rather than a full unit.

### 5.9 Ulrich, Mark — "Seeing Is Believing: Using the Rhetoric of Virtual Reality to Persuade" (Stanford, undergraduate/《Intersect》-style article)
Rhetoric of technology / media. Introduces **"virtual rhetoric"**: VR persuades through an augmented form of **visual rhetoric**, using vividness and immersion to heighten emotional impact, bypass analytical argument, and (via user data) customize itself to the viewer — giving world-creators "unparalleled influence." Ulrich warns of unconscious manipulation and urges rhetorical literacy about VR. Narrows VR to HMD + tracking; leans on visual-rhetoric and video-game-rhetoric scholarship, and Snow Crash / Second Life / WoW as touchstones. **Relevance:** rhetoric-of-VR — tangential to the social-interior claim but squarely in the dissertation's rhetoric tradition (persuasion, emotional impact, immersion). Pairs with Golliher under a rhetoric-of-interactive/virtual-media banner, or stands alone. Not a presence-theory or social-presence source.

---

## 6. Proposed index-entry grouping (PROPOSAL — not finalized; gated on user)

Checked against all existing entries in `corpus/index/`. The closest existing entry, **"VR Pedagogy Secondary (Part III)"**, already holds the *online-pedagogy* presence canon (Lombard & Ditton, Witmer & Singer, Biocca, Gunawardena, Tu, Terry & Doolittle, Richardson). The 9 here are a **distinct effort** (virtual-worlds social presence + foundational presence *ontology* + rhetoric/interactivity), so folding them into VR Pedagogy Secondary would blur that entry. Recommend **new entries**, with explicit cross-links, plus targeted **bridge-source** pointers into existing entries.

**Group A — "Social Presence in Virtual Worlds (Part III)"** *(new)* — the direct counterexample cluster for the "social interior" claim.
- Boellstorff — For Whom the Ontology Turns (2016) [theory anchor]
- Davis & Boellstorff — Compulsive Creativity (2016) [Second Life empirical anchor]
- Champion — Social Presence & Cultural Presence in Oblivion (2007) [social/cultural presence vocabulary]
- *(optionally pull in the already-ingested `Champion — When Windmills Turn Into Giants` as a sibling/bridge)*

**Group B — "Presence Theory (Foundations)"** *(new)* — the overarching non-social PRESENCE folder the user described.
- Mantovani & Riva — 'Real' Presence (1999) [ontology-of-presence hinge]
- Riva — Is presence a technology issue? (2009) [enactive/intentional presence]
- Lepecq et al. — Afforded actions… physical presence (2009) [behavioral/affordance index] — **also bridge to Part II**
- Spagnolli et al. — Mediated presence (2009) [editorial framing/bridge — possibly a context note rather than a full unit]

**Group C — Golliher & Ulrich — rhetoric of interactivity / VR.** Two options:
- C1 (recommended): a small new entry **"Rhetoric of Interactivity & Virtual Reality"** holding both (shared rhetoric lens: agency/sensation vs. persuasion/immersion), or
- C2: Golliher standalone (museum/interactivity pedagogy) + Ulrich standalone (rhetoric-of-VR). Keep both **out of** the presence groupings per user guidance.

**Bridge-source pointers (into existing entries), not full new units:**
- **Lepecq** and **Mantovani & Riva** → `bridge-sources/` pointer in the Part II world-disclosedness neighborhood (**"Von Uexküll — A Foray…"** entry): presence-as-disclosedness / affordance ↔ Umwelt.
- **Group A** → cross-link from **"VR Pedagogy Secondary (Part III)"** social-presence strand (shared construct: social presence / co-presence) and from the **RDR2 / game-analysis** material (Champion is game studies).

Naming/structure follows the existing convention exactly: top-level entry folder → per-source subfolders `Author - Short Title (Year)/` each with one prefixed unit `.md` (e.g. `svw-01-boellstorff-ontology-turns.md`), plus `_synthesis/` (citation-network, cluster-ontology, concept-matrix, debate-map), `units/`, and `bridge-sources/anchor-pointers.md` — mirroring `VR Pedagogy Secondary (Part III)`.

## 7. Proposed phased execution (each phase gated on user go-ahead)

- **Phase 2 — Group A "Social Presence in Virtual Worlds (Part III)"** (highest value for the Part III revision): build the 3 (–4) units + `_synthesis/` + cross-links; verify every verbatim via `archon evidence find … --mode exact`.
- **Phase 3 — Group B "Presence Theory (Foundations)"**: 3 full units + Spagnolli as framing/bridge; add the **Lepecq + Mantovani&Riva → Part II / Von Uexküll** bridge pointers and record Lepecq's world-disclosedness relevance in its unit.
- **Phase 4 — Group C (Golliher + Ulrich)**: per the chosen C1/C2 option.
- **Cross-cutting (any phase):** decide fold-vs-link with **VR Pedagogy Secondary (Part III)**; add the Boellstorff clean-reingest cleanup (from §2) only if the user approves the delete+reingest.

Open decisions for the user: (a) new entries vs. fold into VR Pedagogy Secondary; (b) Group C as one entry or two; (c) whether to clean up Boellstorff's cosmetic "Ingesting" state now (requires a forbidden-by-this-task delete/reingest) or defer.

---

# PHASE 2 REPORT — Entry "Social Presence in Virtual Worlds (Part III)" (executed 2026-07-20)

Phase 2 go-ahead received (Phases 3–4 remain gated). Built the Group-A entry for the three sources. No git commits/pushes; no `docs delete`/`reprocess`.

## P2.1 Entry path + structure

`~/projects/claudeflow-testing/corpus/index/Social Presence in Virtual Worlds (Part III)/`

Structure matches convention (per-source subfolders → prefixed unit `.md`; compact `_synthesis/`), scaled to 3 sources — not the full 34-unit apparatus:

- `Boellstorff - For Whom the Ontology Turns (2016)/svw-01-boellstorff-ontology-turns.md`
- `Davis & Boellstorff - Compulsive Creativity (2016)/svw-02-davis-boellstorff-compulsive-creativity.md`
- `Champion - Social and Cultural Presence in Oblivion (2007)/svw-03-champion-oblivion-social-cultural-presence.md`
- `_synthesis/cluster-ontology.md` (header-format canonical node list — registration source, §3A), `concept-matrix.csv`, `citations.md`, `drafting-loci.md`, `README.md`

Each unit follows the existing digest shape (Thesis/Aim · Structure · Constructs · Findings/Claims · **Drafting loci** · **Relevance to the Part III passage**), with FE / FAITHFUL / P provenance tags as in the comparator entries.

## P2.2 Citation forms established (from the PDFs, not folder names)

- **svw-01** Boellstorff, Tom. "For Whom the Ontology Turns: Theorizing the Digital Real." *Current Anthropology*, vol. 57, no. 4, Aug. 2016, pp. 387–407. — printed page = PDF + 386 (heads: PDF p.1→387, p.21→407).
- **svw-02** Davis, Donna Z., and Tom Boellstorff. "Compulsive Creativity: Virtual Worlds, Disability, and Digital Capital." *International Journal of Communication*, vol. 10, 2016, pp. 2096–2118. — printed page = PDF + 2095 (heads: PDF p.1→2096, p.4→"Compulsive Creativity 2099").
- **svw-03** Champion, Erik. "Social Presence and Cultural Presence in Oblivion." *Proceedings of the 7th International Digital Arts and Culture Conference: The Future of Digital Media Culture (Perth DAC 2007)*, Curtin University of Technology, 2007. — **unpaginated** (PDF carries an unfilled ACM "Conference'04" template footer — boilerplate, not the venue; real venue fixed by in-text "PerthDAC 2007"); loci cited by section + PDF page.

## P2.3 Key drafting loci found (all `exact-1.00 · bbox ✓`; pages offset-confirmed)

The target passage (hedged): social interior rare; "Second Life classrooms documented by anthropologists…"; "general-purpose social platform adapted to teaching rather than an environment authored for a curriculum."

Confirms the virtual world is a real inhabited place ("social interior" is literal):
- Boellstorff **p.387** — "the myriad ways that the online is real"; and "the false opposition of the digital and the real".
- Davis & Boellstorff **p.2099** — "Virtual worlds are places of human culture online" (strongest single locus).

Confirms an anthropologically-documented Second Life community on a general-purpose platform:
- Davis & Boellstorff **p.2096** — "we analyze the intersection of creativity and agency by examining" (→ a four-year ethnography of a Second Life Parkinson's community); **~p.2109** — "digital embodied states and digital objectified states".

Sharpens / challenges the multiplayer equation:
- Champion **abstract, PDF pp.1–2** — "convey the impression of shared worlds with social presence and social agency"; **§2, PDF pp.2–3** — "It is not clear that we can say social presence is a group of people"; **PDF pp.8–9** — "Oblivion to be considered as a social world".

Net disposition (full detail in `_synthesis/drafting-loci.md`): the cluster **confirms** the existence/inhabited-documented character of socially-capable virtual worlds and the "general-purpose platform adapted, not curriculum-authored" framing; it **sharpens** the equation of social interior with multiplayer + proximity-voice (Champion: social presence can be authored without multiplayer → a social interior = authored social presence + place-character, of which multiplayer + proximity-voice is the common but not the only route). Caution flagged: svw-02 is a support/creative community, not a credit-bearing classroom.

## P2.4 Registration status — DONE

- Backups (timestamped): `corpus/index/.backups/compiled-index.json.<TS>.bak` and `scripts/.backups/compile-corpus-index.py.<TS>.bak`.
- Added `TEXT_DIRS` entry for "Social Presence in Virtual Worlds (Part III)" (header format, `_synthesis`) to `scripts/compile-corpus-index.py`.
- Ran `python3 scripts/compile-corpus-index.py` (EXIT 0). Result: **ontologyNodes 670 → 680** (+10 = the entry's 10 canonical nodes); canonicalTerms 1663 → 1677; no regression to other entries. All 10 svw nodes verified present in `compiled-index.json` with correct type + units (parser strips node-name parentheticals as designed — names/types/units otherwise intact).
- No git commits or pushes.

## P2.5 STOP

Phase 2 complete. Phases 3 (Presence Theory Foundations) and 4 (Golliher/Ulrich rhetoric) remain gated on explicit user go-ahead.

---

# NEW-PAPER TASK — King, Diec & Salvo "Scalable Virtual Reality" (ASEE 2025 #49715) → vle-05 (executed 2026-07-20)

User-directed task (not gated). Ingested the new King–Salvo ASEE paper and added it as unit **vle-05** inside the EXISTING entry `Virtual Learning Environments (King–Salvo)`. No commits/pushes; no `docs delete`/`reprocess`.

## N.1 Ingestion — clean, full-quality (GPU was free)

- File confirmed present, not previously ingested. GPU had ~14–20 GB free this session, so **no VLM playbook was needed** — Marker + all figure VLM ran on-GPU.
- `archon docs ingest … --jobs auto` → **state `Ingested`** (clean, not "Ingesting"), **doc-4caaf4dc**, **21 chunks / 21 indexed**, `Marker coord: marker`, **5/5 figure VLM descriptions OK, 0 failures**. `[policy.docs.vlm]` left at its normal `enabled = true` (untouched).

## N.2 Snapshot rebuild (OP RULE)

- `archon docs vector-compact` (EXIT 0) → new snapshot basename **`doc-text-20260720T153656Z`**, **21,929 vectors** (prior `doc-text-20260720T145233Z` = 21,908; **+21 = vle-05 chunks**, exact match). fastembed-onnx / 768-dim.

## N.3 Validation — PASS

- **`evidence find --mode exact --source "scalable-virtual"`** on the coordinator's phrase **"enabling collaborative team viewing"** → `exact-1.00 (sim 1.00) · bbox ✓` (PDF pp.4–6). Five more loci below also verified exact-1.00 · bbox ✓.
- Semantic search (fresh snapshot): returned 10 hits in **~5.2 s** (well under the 65–100 s no-snapshot fallback), surfacing the King–Salvo VR-immersion corpus at the top — snapshot is live and includes the new doc.

## N.4 Citation form established (from the PDF title page)

> King, Christine E., Kadin Diec, and Dalton Salvo. "Scalable Virtual Reality Global Clinical Immersion for Culturally Responsive Engineering Design Skills." *ASEE Annual Conference & Exposition*, Paper ID #49715, American Society for Engineering Education, 2025.

- **Abbreviated title (parenthetical):** **"Scalable Virtual Reality"** (matches the drafting side's provisional usage).
- **Venue/year:** the body does not name the conference, but the **title-page copyright line reads "©American Society for Engineering Education, 2025"** → **year 2025 VERIFIED**; conference = ASEE Annual Conference & Exposition inferred from the ASEE Paper-ID format + copyright (the specific conference name/location is not printed in the body — recorded as inferred, not fabricated). Not flagged UNVERIFIED since the year is directly attested.
- **AUTHOR FLAG (needs user confirmation):** the PDF byline lists **three** authors — "Prof. Christine E King", "**kadin diec**" (lowercased in the PDF; normalized to *Kadin Diec*), and "Dalton Salvo" — not the two (King & Salvo) named in the task. MLA above lists all three per the PDF; confirm the middle author's name/spelling.
- **Pagination:** no journal pagination — cite **PDF pages 1–15** (stated in the unit). The file/folder name is a storage handle, not a citation.

## N.5 Key loci (all `exact-1.00 · bbox ✓`; PDF-page ranges)

Emphasis on Results/Discussion per the task; full digest in `units/vle-05-scalable-vr-global-immersion.md`.

- **Quantitative efficacy (Results, PDF pp.4–6):** N=121 enrolled / 113 surveyed (W25); "83.19% successfully used the virtual platform"; 62.83% increased immersion/presence/embodiment; 65.49% "substantially enhanced their ability to examine how healthcare is performed"; 64.6% recognized cross-country differences.
- **Five qualitative themes (PDF pp.4–6):** resource disparities · cultural/systemic factors · procedural understanding · importance of collaboration/team coordination · BME innovation connections — with student verbatims (e.g., "Vietnam's hospital was very cramped…"; "Seeing how medical teams adapt in different settings has helped me understand the real world needs for biomedical innovations.").
- **Barriers (PDF pp.4–6):** pixelation, 720p / low-bitrate 1080p streaming (bandwidth, esp. UCI campus), motion sickness, "lack of explanation"/narration; "I personally couldn't focus on the VR video because I get motion sickness."
- **Discussion (PDF pp.8–10):** "used YouTube due to MacOS compatibility or storage issues" (29.20%, N=33, p.8); the boredom line — **"engagement alerts will be integrated to address student feedback on boredom"** (pp.9–10); ABET SO2/SO7 alignment; storage 3.3 GB; mobile prioritized.
- **Platform / deployment facts:** "enabling collaborative team viewing" (pp.4–6); "It is now a prerequisite for the UCI BME senior capstone program" (pp.2–3); Unreal Engine; UCI MC + CHOC + Vietnam + Paraguay; 360° stereoscopic + head-mounted dual capture; voice chat + screen sharing; YouTube + vr.uci.design fallback.
- **Efficacy ↔ interactive VLE tie (user's stated interest):** the paper carries both sides — published efficacy percentages/themes AND the authors' own diagnosis that the ceiling is interactivity (the boredom/engagement-alerts remedy = vle-01's A₃→A₄ stall in the deployment's own voice). Marked in unit §6 and node 17 "Interactivity-remedy pivot."

## N.6 Registration delta — DONE

- Added unit `units/vle-05-scalable-vr-global-immersion.md`; updated `_synthesis/manifest.json` (units array + `ontology_nodes` 14→18 + publications list); appended **4 new canonical nodes** to `_synthesis/book-level-ontology.md` (Published efficacy percentages · Five learning themes · Interactivity-remedy pivot · Scaled ABET deployment) and cross-tagged **5 existing nodes** with `vle-05` (Video-only stratum, Two flight anatomies, A₃→A₄ stall, Screen-route presence, Optative co-disclosedness). Entry structure unchanged (not restructured).
- Backup: `corpus/index/.backups/compiled-index.json.20260720T082940Z.bak` (VLE entry already in `TEXT_DIRS` since 2026-07-06 — no script edit needed this time).
- Ran `python3 scripts/compile-corpus-index.py` (EXIT 0): **ontologyNodes 680 → 684** (+4); VLE entry **14 → 18 nodes**; **9 nodes now reference vle-05** (verified). No regression. No git commits/pushes.

---

# PHASE 3 REPORT — entry "Presence Theory (Foundations)" (executed 2026-07-20)

Go-ahead received for Phase 3 + Phase 4 in one run (no gate between). All sources already ingested; snapshot current (`doc-text-20260720T153656Z`) — entry creation only. No commits/pushes; no docs delete/reprocess.

## P3.1 Entry path + units
`corpus/index/Presence Theory (Foundations)/` — 4 units + compact `_synthesis/` (cluster-ontology, concept-matrix, citations, drafting-loci, **bridge-to-part-ii**, README):
- **ptf-01** — Mantovani & Riva, "'Real' Presence" (*Presence* 8.5, 1999) — ontology-dependence of presence criteria.
- **ptf-02** — Riva, "Is presence a technology issue?" (*Virtual Reality* 13, 2009) — presence as cognition, not technology.
- **ptf-03** — Lepecq et al., "Afforded actions…" (*Virtual Reality* 13, 2009) — behavioral/afforded-action presence measure; **PRIMARY Part II bridge**.
- **ptf-04** — Spagnolli, Lombard & Gamberini, "Mediated presence" (*Virtual Reality* 13, 2009) — mediated presence across environment types + action-based method (editorial).

## P3.2 OCR discipline — Mantovani & Riva (ptf-01)
The Mantovani & Riva PDF is a **scanned image with NO text layer** (`pdftotext` returns only "Copyright © 1999" ×11 pages). Per the rule, **its chunk text is NOT trusted as verbatim**: the unit reports the argument in paraphrase and marks **every** candidate quotation `****** UNVERIFIED:` (title, the ingenuous-realism definition, the social-construction line), with an instruction to re-verify against a clean copy before any dissertation use. Its printed range (pp. 540–550) is the established published range; the scanned copy's own page numbers are not text-extractable.

## P3.3 Citation forms + verified pagination offsets
- Mantovani & Riva, "'Real' Presence…", *Presence: Teleoperators and Virtual Environments* 8(5), 1999, pp. 540–550. Short: "'Real' Presence." (pagination not offset-verifiable — scanned.)
- Riva, "Is presence a technology issue? Some insights from cognitive sciences," *Virtual Reality* 13(3), 2009, pp. 159–169. Short: "Is presence a technology issue?" **Offset printed = PDF + 158** (verified).
- Lepecq, Bringoux, Pergandi, Coyle & Mestre, "Afforded actions…", *Virtual Reality* 13(3), 2009, pp. 141–151. Short: "Afforded actions." **Offset printed = PDF + 140** (verified).
- Spagnolli, Lombard & Gamberini, "Mediated presence…", *Virtual Reality* 13(3), 2009, pp. 137–139 [editorial]. Short: "Mediated presence." **Offset printed = PDF + 136** (verified).

## P3.4 Key loci (verified exact-1.00 · bbox ✓; ptf-01 excluded per OCR rule) — 7 verified quotes
- **Riva p.159:** "a core neuropsychological phenomenon whose goal is to produce a sense of agency and control"; "any environment, virtual or real, does not provide undifferentiated information"; "It offers different opportunities and produces presence according to its ability in supporting the users and their intentions."
- **Lepecq p.141:** "every afforded action could be a potential tool for sensorimotor assessment of physical presence"; "This behavioral adjustment is thus assumed to be an objective indication of presence."
- **Spagnolli:** "as a method to investigate presence and social presence" (p.138); "represents an important chance to enrich human" (p.137).
- Drafting relevance: **supports** the Part III framing (a scored feeling under-describes how a world opens — Riva relocates presence to enacted intention; Mantovani & Riva make the criterion ontology-relative; Spagnolli notes the field's turn to *action*); **complicates** it (Lepecq's afforded-action index *does* track world-openness for physical presence — so the introduction should target self-report scoring specifically).

## P3.5 Part II bridge markers (recorded, NOT built)
`_synthesis/bridge-to-part-ii.md` records the world-disclosedness bridge: **Lepecq (PRIMARY)** — afforded action = attunement of the lived body to a disclosed field (Gibsonian affordance ↔ Uexküllian Umwelt ↔ Heideggerian readiness-to-hand); **Mantovani & Riva (secondary)** — ontology-dependence of presence ↔ a world disclosed, not represented. Cross-reference target noted (`corpus/index/Von Uexkull - A Foray…/`). **No cross-entry edges built** this pass, per instruction.

## P3.6 Registration
Backup `corpus/index/.backups/compiled-index.json.20260720T090323Z.bak` + `scripts/.backups/compile-corpus-index.py.20260720T090323Z.bak`. Added `TEXT_DIRS` entry (header, `_synthesis`). Compile EXIT 0 → **10 nodes** registered (ptf-01..04), incl. the "World-disclosedness bridge" node.

---

# PHASE 4 REPORT — entry "Rhetoric of Interactivity and Virtual Reality (Part III)" (executed 2026-07-20)

## P4.1 Grouping decision — ONE combined entry (not two standalone)
**Decision: one combined entry.** Rationale: after reading both, they share a single load-bearing thread — **the authored environment as a rhetorical actor on its inhabitant (design-as-rhetoric)** — and divide its labor cleanly: **Golliher = the doing lever** (interactivity → agency), **Ulrich = the moving lever** (immersion → persuasion). Neither is social-presence/presence-theory; both are rhetoric-tradition analyses of how a designed environment acts on the person inside it, which is exactly the dissertation's design-as-rhetoric frame. Each is small (a thesis + a short article) and they compose one argument, so a combined entry is more faithful than two one-unit entries.

## P4.2 Entry path + units
`corpus/index/Rhetoric of Interactivity and Virtual Reality (Part III)/` — 2 units + `_synthesis/` (cluster-ontology, concept-matrix, citations, drafting-loci, README):
- **riv-01** — Golliher, "'Go Ahead Touch this Dinosaur Fossil': The Rhetoric of Interactivity in Museum Culture" (Clemson MA thesis, 2013) — the doing/task side.
- **riv-02** — Ulrich, "Seeing Is Believing: Using the Rhetoric of Virtual Reality to Persuade" (Stanford) — rhetoric of VR / design-as-rhetoric.

## P4.3 Citation forms + pagination
- Golliher, Steffanie. *"Go Ahead Touch this Dinosaur Fossil": The Rhetoric of Interactivity in Museum Culture.* 2013. Clemson University, MA thesis (TigerPrints, All Theses, Paper 1589). Short: "Rhetoric of Interactivity." Thesis body page ≈ PDF−4 (single-anchor: TOC "Rhetoric of Sensation" = thesis p.22 ↔ PDF pp.26–28); abstract quotes cited "(Abstract)".
- Ulrich, Mark. "Seeing Is Believing: Using the Rhetoric of Virtual Reality to Persuade." **`****** UNVERIFIED:` venue/year** — the PDF body does NOT print the journal/volume/year; author affiliation "Stanford University" + running heads "Ulrich 5…17" are printed, and internal photos are dated Sept–Oct 2011. Almost certainly *Intersect: The Stanford Journal of Science, Technology, and Society*, vol. 5, 2012, pp. 5–17 — **flagged, not asserted.** **Offset printed = PDF + 4** (verified; article starts printed p.5). Short: "Seeing Is Believing."

## P4.4 Key loci (all verified exact-1.00 · bbox ✓) — 6 verified quotes
- **Golliher (doing lever):** "sensational rather than interactive" (thesis ~pp.22–24); "sensation for AiG is not a conduit for visitor agency" (Abstract); "Interactivity allows visitors to touch, smell, taste, hear, feel" (thesis ~pp.2–4); "apparent use of interactivity is not fully interactive, as it does not demand that visitors" (thesis ~pp.31–33) — the last is the rhetorical statement of the **A₃→A₄ stall** (interactivity must *demand* action).
- **Ulrich (moving lever):** "The vividness of virtual reality can give an audience a sense of immersion, enhance the emotional impact of a message, and bypass analytical arguments" (p.5); "we can use rhetoric in virtual reality to convey arguments and change how individuals view the real world" (p.5) — the design-as-rhetoric frame.
- Drafting relevance: Golliher → the Part III interactivity material + A₃→A₄ remedy / design levers (give the inhabitant something to *do*); Ulrich → the VLE as an environment **authored to move** its inhabitant (with a manipulation caution).

## P4.5 Registration
Same backup set as P3.6 (`…090323Z`). Added `TEXT_DIRS` entry (header, `_synthesis`). Compile EXIT 0 → **7 nodes** registered (riv-01/riv-02).

---

# PHASES 3–4 REGISTRATION SUMMARY
- `scripts/compile-corpus-index.py`: added TWO `TEXT_DIRS` entries ("Presence Theory (Foundations)", "Rhetoric of Interactivity and Virtual Reality (Part III)"); backed up first.
- `python3 scripts/compile-corpus-index.py` (EXIT 0): **ontologyNodes 684 → 701** (+17 = 10 ptf + 7 riv); both entries' nodes verified present with correct type + units; no regression. No git commits/pushes; no docs delete/reprocess.

## STOP
Phases 3 and 4 complete. This concludes the multi-phase new-media presence ingestion-and-indexing task (Phase 1 audit/ingest/analyses → Phase 2 Social Presence in Virtual Worlds → King–Salvo vle-05 → Phase 3 Presence Theory Foundations → Phase 4 Rhetoric of Interactivity & VR). No further phases pending.

---

# BRIDGE-BUILD REPORT — Afforded-action ↔ Umwelt ↔ world-disclosedness (executed 2026-07-20)

Go-ahead: promote the recorded Part II bridge into a full artifact. One task. No commits/pushes; no docs delete/reprocess; Von Uexküll entry not restructured.

## B.1 Bridge path + form
`corpus/index/Presence Theory (Foundations)/_synthesis/bridge-to-part-ii.md` — promoted from a pointer stub to a **full 8-section artifact** (70 lines) following the house exemplar `Heidegger - The Fundamental Concepts of Metaphysics/_synthesis/fcm-king-salvo-bridge.md`: problem → two faithful records → primary-axis crosswalk table → keystone → secondary-axis meta-frame → Part II plug-in note → faithful/anticipatory ledger → category caution.

## B.2 Crosswalk summary
- **Primary axis (Lepecq, ptf-03):** afforded action ↔ Umwelt apparatus ↔ world-disclosedness / readiness-to-hand, as a 6-row table. Uexküll anchors chosen from the entry's own ontology: **Funktionskreis** (node 2; U-F0/F2/F3), **Wirkton/effect-tone** (node 17; U-F4 — "carriers of action-affordances perceived with the same assurance as shape or color"), **Wirkraum/subject-constituted space** (node 27; U-F1), **Merkwelt+Wirkwelt=Umwelt** (nodes 1/3/4; U-F0), **Stimmung** (node 22; U-F4 — the entry's own "structural parallel to Heidegger's Befindlichkeit").
- **Keystone (ANTICIPATORY):** Lepecq's aperture-crossing *is* a Funktionskreis (perception-mark → effect-mark closed loop), and a closed functional cycle is **world-disclosedness made behaviorally observable** — so his "objective indication of presence" (p.141) reads as an objective indication of *disclosure*. Converts a presence score into a behavioral signature of the world-pole.
- **Secondary axis (Mantovani & Riva, ptf-01):** ontology-dependence of presence criteria as the **meta-level license** — the disclosure reading is the correct *criterion* under a situated/disclosedness ontology, over-interpretation under naive realism. All Mantovani wording carried as `****** UNVERIFIED:` (scanned OCR).

## B.3 Loci / edges by provenance tag
- **FAITHFUL-LEPECQ:** 5 verified quotes, all `exact-1.00 · bbox ✓`, offset-confirmed pages — pp.141 (×2: "objective indication of presence"; "every afforded action…"), 147 ("adapted to the width of the aperture and to their own shoulder width"), 148–149 ("behavioral transition from frontal walking to body rotation"), 150 ("behaviorally objectivates physical presence in VR by the way of an afforded action").
- **FAITHFUL-UEXKÜLL:** 5 anchors cited by node # + unit id (nodes 2, 17, 27, 1/3/4, 22; units U-F0/F1/F2/F3/F4).
- **FAITHFUL-MANTOVANI `******`:** 1 paraphrase locus, UNVERIFIED (re-verify against a clean copy).
- **ANTICIPATORY-APPLICATION:** 6 crosswalk mappings + keystone + the §5 ontology-license = the bridge's hypotheses, none represented as established. Ledger table (§7) has 8 rows; category caution (§8) states the structural-grammar-not-metaphysical-scope limit.

## B.4 Part II purpose note (in the bridge, no prose drafted)
States where Lepecq plugs in: the **world-disclosedness pole** of rhetorical incorporation (Part II world-/co-disclosedness poles, BT 145+160) and the **RODA methodology's world-pole** (afforded-action index as a candidate operationalization of world-disclosedness). **Explicit limit recorded:** Lepecq reaches the **world-pole only** (solo, physical presence) — NOT co-disclosedness (the WE/being-with pole); do not stretch him there.

## B.5 Cross-references + registration delta
- **Von Uexküll entry NOT touched.** Checked its conventions: it has **no `bridge-sources/` inbound-pointer directory** (only the Wendt entry uses that convention). Per instruction, all bridge content stays in `Presence Theory (Foundations)/_synthesis/` and references the Uexküll entry read-only (by node # + unit id). No cross-entry edges built.
- **Registration delta: NONE.** Bridges are **synthesis artifacts, not ontology-node sources** under current conventions — `compile-corpus-index.py` harvests nodes only from each entry's `_synthesis/cluster-ontology.md` §3A, not from bridge files (same as the FCM exemplar, which adds no nodes). The bridge concept was already registered in Phase 3 as the node **"World-disclosedness bridge" (units ptf-01, ptf-03)**. Compiled index therefore unchanged at **701 nodes**; no re-run/backup required. No git commits/pushes.

## STOP
Bridge build complete.
