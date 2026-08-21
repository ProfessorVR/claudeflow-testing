# HANDOFF — Part II Methodology, DRAFT-v2 per-paragraph revision · 2026-06-26

**Purpose.** Pick up, in a clean session at **max effort**, the per-paragraph revision of the RODA methodology **justification layer**. The A/B is done; the winning base is saved as DRAFT-v2. Submit this doc at the top of the new session. Do NOT re-derive the prior work.

---

## 0. TL;DR
- **The task:** revise **DRAFT-v2** paragraph-by-paragraph toward Part I's voice, graft in two improvements, verify all loci against the PDFs. That's it.
- **The draft (base):** `tmp/Dissertation/Part_II/methodology/Rhetorical-Ontological Diachronic Analysis (RODA) - DRAFT-v2.md` (3,115 words incl. footnotes; 5 movements). This is the **console-max** winner of a 3-way A/B (console-max 9.23 > god-write-patched 8.88 > ultracode 8.03).
- **Scope:** the **justification layer only** — five movements: (1) orientation, (2) the ontological frame by reference, (3) the spine + rhetorical incorporation, (4) why Calleja, (5) why Burke. NOT the instruments/differential/protocol/appendices (those are later — see §6).

---

## 1. First moves in the clean session
1. **Set effort to max** (user to apply): `effortLevel: "max"` in `~/.claude/settings.json` (currently "medium"), or via `/config`.
2. Read this handoff, then the draft (`…DRAFT-v2.md`).
3. Skim the A/B results + grounding pack (§4) so the revision is grounded.
4. Begin the per-paragraph revision (§3), movement by movement.

---

## 2. Read-first set (in order)
1. **This handoff.**
2. **The draft:** `tmp/Dissertation/Part_II/methodology/Rhetorical-Ontological Diachronic Analysis (RODA) - DRAFT-v2.md`.
3. **Why this is the base + what to graft:** `tmp/Dissertation/Part_II/methodology/AB-RESULTS - methodology justification layer.md`.
4. **The grounding pack** (every verbatim quote + locus, the A₀–A₄ node semantics, terminology locks, provenance rules): `tmp/Dissertation/Part_II/methodology/godwrite-prompt - RODA methodology.md`.
5. **The other two contestants** (graft sources): `godwrite-run4-content.md`, `ultracode-content.md` (same folder).
6. **The plan + locked decisions (D1–D7):** `plans/part-ii-methodology-section-draft-plan-2026-06-25.md`.
7. **The review/criticism report:** `tmp/Dissertation/Part_II/methodology/REPORT - Draft Review, Grounding, and God-Write A-B Plan.md`.
8. **Memories auto-load** — note: `project-part-i-lanham-style-fingerprint`, `project-godwrite-embedded-pack-and-model-patch`, `feedback-ungendered-language-use-player`, `feedback-per-paragraph-revision-protocol`, `project-game-analysis-methodology`.

---

## 3. The revision task
Use the **per-paragraph revision protocol** (`feedback-per-paragraph-revision-protocol`, user-first 10-step). Per paragraph:

**(a) Lift the voice toward Part I.** DRAFT-v2 sits at ~0.94 Lanham conformance; the gaps vs Part I are: voice **0.242 → 0.39** (too effaced — let the modest "I" show a touch more), **dynamic range 0.642 → 0.90** (Part I punctuates long architectural sentences with short punchy ones — add that rhythm), **lat/ger 0.098 → 0.149** (slightly over-Germanic; a few more Latinate/technical terms are fine), opacity 0.673 → 0.74. Check after edits: `npx tsx tmp/analyze-style-lanham.ts "<file>"` (the runner strips markdown/LaTeX; compare to the Part I fingerprint in memory).

**(b) Graft the two improvements** (from `AB-RESULTS`): ultracode's higher dynamic range / punchier rhythm; and ultracode's observation that **"the shared dimension already anticipates the with-others pole"** (in its movement 4) — a clean bridge from Calleja's Shared channel to the consubstantiation pole. Pull any cleaner phrasings from god-write run 4 where they beat the base. (If reusing ultracode phrasing, note it wrote **"Brian Calleja"** — his name is **Gordon**; do not carry that error.)

**(c) Verify every locus against the PDFs** (Gross advisor-rigor) — see the provenance ledger §5. Do not assert a page not checked.

**(d) Hold all locks** (§4 below).

---

## 4. Terminology + style locks (hard — violating any is a failure)
- The object the method traces = **"the actualization-of-desire chain" / "the actualization chain"** — NOT "RODA" (RODA is the *method*, not the chain).
- The two sides of the union = **"the world-pole" / "the with-others pole"** — NEVER "world-face/other-face".
- The union structure = **"one in substrate, different in being"** — do not call it "the keystone".
- **"residue"** is reserved for the within-pass *resonant kinēsis* (A₁); cross-pass build-up is **"temporal sedimentation"** (*hexis*). Do not conflate.
- **Ungendered**; the in-game subject is **"the player"** (never she/he/they) — `feedback-ungendered-language-use-player`.
- **No bold run-in heads**; Greek italicized + glossed + Bekker inline; secondary lit cited inline `(Author Page)` / `(\textit{ShortTitle} Page)`; Aristotle via Bekker.
- Name = **RODA = Rhetorical-Ontological Diachronic Analysis**.
- A₀–A₄ node semantics (keep faithful): A₀ horizon/*Umwelt* · M₀→A₁ perception + *resonant kinēsis* (*resonant aisthēma* + *resonant epithymia*) · M₁→A₂ the *phantasma* proper · M₂→A₃ cognition + *doxa* + emotion · M₃→A₄ completed action → *hexis*. Central event at **A₃→A₄**. Read forward, understood backward from the *orekton*.

---

## 5. Provenance ledger (verify in the citation pass)
**Verbatim in hand — verify the page against the PDF before final:**
- Calleja, *In-Game*: pp.43–44 (six PIM dimensions), 169 (incorporation + double-axis), 169–170 (spatial-kinesthetic cornerstone), 5 ("ultimately a metaphor"), 168 ("experientialist ontology" + Lakoff/Johnson/Damasio/Dennett). R1–R7 = pp.169–173, 178. PDF: `corpus/new_media/Calleja, Gordon - In-Game-…[My Copy].pdf`.
- Burke: *Rhetoric* 21 (consubstantiation "both joined and separate"; "acting-together"), 22 ("compensatory to division"), 42 (attitude "incipient act"); *Grammar* xv (pentad), xvi ("grammar of motives… terms alone"), 21 (concealment), 292 (seven causes). PDFs: `corpus/rhetorical_ontology/Burke… A Grammar/A Rhetoric of Motives…pdf`.
- Heidegger, *Being and Time*: 405 ("characteristic absorption of concern in its equipmental world"; "circumspective concern"), 98 (hammer "disappears into the hammering"). PDF: `corpus/rhetorical_ontology/Heidegger… Being and Time…pdf`.
- Aristotle: *DA* III.2 425b26–27 ("one in substrate, different in being"); *Phys.* II.2 194a36–b8 (producing/using art). Verified in Part I `verbatim_passages.md`.

**Un-ingested (ingest + quote only if you decide to cite directly):** Murray (*Hamlet on the Holodeck*), Ryan (*Narrative as VR* 1&2) — `corpus/new_media`; Perelman (*The New Rhetoric*), Bitzer ("The Rhetorical Situation") — `corpus/rhetorical_ontology`. DRAFT-v2 currently routes around them (good).

**Absent — do NOT cite; route around:** Huizinga (*Homo Ludens*), Salen & Zimmerman (*Rules of Play*) — the magic-circle/immersive-fallacy move goes through **Calleja's own excision** (in-corpus), not these primaries.

**Declare as the dissertation's own constructions** (provenance honesty, already in the draft): the Heidegger concernful-absorption ↔ incorporation bridge; the two-pole fusion; the seven-causes→pentad crosswalk (Burke's explicit map is the *four* causes).

---

## 6. Scope, and what's deferred (NOT this revision)
- **This task = the justification layer (5 movements) only.**
- **Still to draft later:** §M.5 the emergent instruments + dwelling (Group-A instruments derived + forward-referenced); §M.6 the VR↔screen differential module; §M.7 the protocol in brief; **Appendix C** the full RODA brawl walkthrough (the advisor demo, v8-updated: *prohairesis* = bouletic's completion not a coordinate Type 4; phantasm*ic* not phantasm*atic*; no bold run-in heads; restored Step 3 = Burke motive-rhetoric).
- **Appendices to populate** (verbatim already in hand, see §5) in `tmp/Dissertation/Appendices/`: Calleja PIM + R1–R7; Burke pentad; Burke×Calleja crosswalk.
- **Phase 2 (parked):** G&G VR miniaturization; RDR2 Sonny capstone.
- **Format:** DRAFT-v2 is markdown. Port to XeLaTeX (shared preamble from `…DRAFT-v1.tex`) either before or after the per-paragraph revision — your call in the clean session.

---

## 7. Key file map
**Methodology —** `tmp/Dissertation/Part_II/methodology/`
- `Rhetorical-Ontological Diachronic Analysis (RODA) - DRAFT-v2.md` ← **the draft to revise**
- `AB-RESULTS - methodology justification layer.md` · `REPORT - Draft Review, Grounding, and God-Write A-B Plan.md`
- `godwrite-prompt - RODA methodology.md` (grounding pack) · `godwrite-run4-content.md` · `ultracode-content.md` · `console-max-content.md` (= DRAFT-v2 source)
- `Rhetorical-Ontological Diachronic Analysis (RODA) - DRAFT-v1.tex` (LaTeX preamble for the port)

**Style tooling —** `tmp/analyze-style-lanham.ts` (`npx tsx tmp/analyze-style-lanham.ts "<file>"`); target = `Part I - Complete.md` fingerprint (in memory).
**Plan —** `plans/part-ii-methodology-section-draft-plan-2026-06-25.md`.
**Appendices —** `tmp/Dissertation/Appendices/` (GLOSSARY.md + 3 stubs).
**Method (v8 canonical) —** `corpus/index/Game-Behavior Analysis Method (Burke × Calleja)/CANONICAL-METHODOLOGY-v8.md`.

---

## 8. Constraints (point of truth = `MEMORY.md`)
Academic writing → Anthropic Claude. corpus/index FIRST. Backup before changes (timestamped `.backups/`); major iterations on copies (`*-iterations/`). Discuss conceptual forks in prose — don't poll. Gross citation rigor. The style/terminology locks in §4.
