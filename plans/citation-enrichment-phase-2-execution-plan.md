# Citation Enrichment Phase 2 — Execution Plan

**Created**: 2026-05-20T2105 | **Revised**: 2026-05-20T2115 with v2-copy + minimal-change + Rickert-report constraints
**Working directory**: `/home/dalton/projects/claudeflow-testing/`
**Target documents**: §§1.0–1.4 in `tmp/Dissertation/Working tex versions/` — **copies will be made with `-v2` suffix; originals untouched**
**Predecessor work**: Citation Marathon (2026-05-19), Polish + User-Judgment phase (2026-05-20T0829/0908). All blocking structural items resolved.
**Trigger**: User request 2026-05-20 — increase secondary-scholarship citation density in §§1.0–1.4 with priority for **Heidegger and Rhetoric** (Gross & Kemmann 2005), **Uncomfortable Situations** (Gross 2017), and (for §§1.3–1.4) **Aristotelian Phantasia Secondary (1985–2017)**.

---

## 0. Top-level constraints (user-locked 2026-05-20)

1. **v2 copies only.** All edits go to fresh `<name>-v2.tex` files in `tmp/Dissertation/Working tex versions/`. Originals MUST remain byte-identical.
2. **Minimum-touch policy.** The goal is to add scholarly engagement WITHOUT requiring re-analysis from scratch. Prefer:
   - New footnotes appended to existing prose
   - Existing footnotes extended with cf./and additional references
   - Inline parenthetical citations only where unavoidable for argumentative clarity
   - **Avoid** rephrasing existing prose, restructuring sections, changing claim-content
3. **Concluding report.** A line-by-line change log (`v2-change-log.md`) listing every modification with:
   - Section + line number(s) in the v2 file
   - Change type: `footnote-new` / `footnote-extended` / `intext-citation-new` / `intext-citation-extended` / `bib-entry-added` / `inlinenote-resolved`
   - Brief description of the citation added
   - Source corpus (HR / US / Phantasia-Secondary / Pathe-cache / corpus/download / etc.)
4. **Rickert analysis = REPORT ONLY.** Run as final phase AFTER v2 is complete. No edits to any document. Output is a stand-alone report mapping Rickert's *Ambient Rhetoric* (2013) attunement / affordance / ambience material to specific ontological-expansion opportunities in the dissertation.

---

## 1. The empirical picture (why this is a real gap)

### 1.1 Citation density by section

| Section | Words | Footnotes | Density (fn/1k w) | `\cite{}` cmds | Quality |
|---|---:|---:|---:|---:|---|
| §1.0 Introduction | 8,721 | 19 | 2.18 | 12 | Densest; uses bib + prose |
| §1.1 A₀ Motion/Time | 7,618 | 9 | 1.18 | 1 | Heidegger-dominated; primary-heavy |
| §1.2 M₀→A₁ Aisthesis | 8,679 | 8 | 0.92 | 0 | Rich prose-citation; mixed authors |
| §1.3 A₃ Orientational Modes | 12,266 | 13 | 1.06 | 1 | Phantasia-secondary-leaning; sparse HR/US/Burke |
| §1.4 Emotion is Motion | 14,378 | 11 | **0.77** | **0** | **Heidegger-monoculture (60 mentions); no Phantasia secondaries; minimal HR; no US** |
| §1.5 A₄ Three Action Types | 3,933 | 2 | 0.51 | 0 | (out of scope) |

### 1.2 Author engagement tallies (prose mentions, all forms)

```
            HEIDEGGER  PHANTASIA-SEC  HR-volume  US-Gross-2017  OTHER (Burke/Gibson/Uexk/Rickert/etc.)
§1.0           4           15             0           0             9
§1.1          42            4             0           0             8
§1.2          15           21             0           0            12
§1.3          25           21             0           0             5
§1.4          60            0             4           0             0  ← the problem
```

**Diagnostic**: §1.4 cites Heidegger 60 times but engages zero authors from the Phantasia Secondary corpus and only Struever + Gross (4 total) from HR. §§1.0–1.2 mix Phantasia secondaries well but engage zero HR or US.

### 1.3 Bibliography state (`docs/references.bib`)

Only **14 entries**, all already cited. Bib file lags the prose by ~30–50 entries (Caston, Papachristou, Gonzalez, 7 of 8 HR essays, all US, Burke RoM/GoM, Rickert, Costache, Corcilius, Withy, Agosta, Dow, Sheehan, Sorabji, Burnyeat, Gibson, Uexküll, etc.).

### 1.4 Pre-existing assets (huge leverage available)

Previous marathon produced **244 verbatim quotations from 17 secondary sources** keyed to insertion sites in old Pathe §§1.1–1.9 (= current §1.4). Most remain UN-applied. Asset locations:

- `tmp/Dissertation/Pathe/citations/MASTER-CITATION-REPORT.md` (master)
- 6 harvest files (`quotes-*.md`) — total 244 entries with verbatims + insertion notes
- `corpus/download/` — 20 already-ingested external PDFs (Corcilius 2013, Agosta 2010, Costache 2013, Withy 2023, Frede 1992, Dow 2011, Caston 2021, Sheehan, plus 12 extras)
- `corpus/index/Dissertation/_run-history/2026-05-20T0058/_synthesis/master-citation-report-parsed.json` (135 KB pre-parsed)

### 1.5 Existing corpus indexes (zero query-cost for HR/US/Phantasia work)

All three priority corpora are fully indexed:
- `corpus/index/Heidegger and Rhetoric/_synthesis/` (8 essays, 33 concepts, 6 contested concepts, full extracted bibliography, Heidegger/Aristotle loci concordance ~280K JSON)
- `corpus/index/Uncomfortable Situations/_synthesis/` (6 chapters, 36 concepts, 18 positions, full extracted bibliography)
- `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/_synthesis/` (8 essays, 41 concepts, 22 reading-theses, 4 debate axes, Aristotle-loci concordance ~165K, terminology appendix ~128K, secondary-literature citation network)

### 1.6 Stylistic finding (constrains the work)

The author uses **prose citation as default** for secondary scholarship; only canonical Phantasia + Heidegger + Aristotle primaries get `\cite{key}`. The plan respects this — most new citations are prose-rendered in extended footnotes, NOT injected via `\cite{}` mid-paragraph.

---

## 2. Phase −1 — V2 copy creation (FIRST STEP — 5 min)

Before any edit work begins:

```bash
TS=$(date +%Y-%m-%dT%H%M)
mkdir -p "tmp/Dissertation/.backups/${TS}-pre-v2-creation"
SRC="tmp/Dissertation/Working tex versions"
cp "$SRC"/*.tex "tmp/Dissertation/.backups/${TS}-pre-v2-creation/"

# Create v2 copies in the same directory
cd "$SRC"
for f in "1.0 - Introduction.tex" \
         "1.1 - A0 - Motion and Time as Ontological Horizon.tex" \
         "1.2 - M0 to A1 - The Actualization of Aisthesis.tex" \
         "1.3 - A3 - Completed Cognitive Actuality and the Three Orientational Modes.tex" \
         "1.4 - Emotion - The Form of Desire Under Evaluative Disclosure.tex"; do
  base="${f%.tex}"
  cp "$f" "${base}-v2.tex"
done
cp ../../../docs/references.bib ../../../docs/references-v2.bib
```

After this step, the directory listing shows pairs:
```
1.0 - Introduction.tex             (original — frozen)
1.0 - Introduction-v2.tex          (working copy — edits go here)
1.1 - A0 - Motion and Time as Ontological Horizon.tex
1.1 - A0 - Motion and Time as Ontological Horizon-v2.tex
...
references.bib                     (original — frozen)
references-v2.bib                  (working copy)
```

All subsequent phases edit ONLY the `-v2` files. Originals are byte-frozen and untouched. The pipeline (when re-run) can diff `-v2` vs. original to compute the change-set without re-analyzing from scratch.

**Initialize the change-log file**:

```bash
mkdir -p tmp/Dissertation/.work/citation-enrichment-2026-05-21
touch tmp/Dissertation/.work/citation-enrichment-2026-05-21/v2-change-log.md
```

Header:
```markdown
# Citation Enrichment Phase 2 — v2 Change Log

**v2 created**: 2026-05-21T<HHMM>
**Original SHA-256** (per file):
- 1.0: <sha>
- 1.1: <sha>
- 1.2: <sha>
- 1.3: <sha>
- 1.4: <sha>

| # | Section | v2 Line(s) | Type | Source | Description |
|---|---|---|---|---|---|
| 1 | ... | ... | ... | ... | ... |
```

Every insertion in Phases 0–5 appends a row here.

---

## 3. Targets (constrained by minimum-touch policy)

### 3.1 Quantitative targets (revised for minimum-touch)

| Section | Current fn | Target fn (v2) | Net new | Change-types allowed |
|---|---:|---:|---:|---|
| §1.0 | 19 | 22–24 | +3–5 | Prefer footnote-extended (cf.); 1–2 new footnotes max |
| §1.1 | 9 | 13–15 | +4–6 | New footnotes appended to existing prose; minimal prose edits |
| §1.2 | 8 | 15–18 | +7–10 | New footnotes; one possible inlinenote→footnote conversion |
| §1.3 | 13 | 22–27 | +9–14 | New footnotes; G05 Burke RoM placeholder resolution (1 site); minimal prose edits |
| §1.4 | 11 | 24–30 | **+13–19** | **Primary phase**: new footnotes; Pathe-cache integration; minimal prose edits |

**Total net new footnotes target (v2)**: 36–54 across §§1.0–1.4 (down from the prior plan's 45–66 to honor minimum-touch).

### 3.2 What WILL change in v2 (allowed change-types)

- **footnote-new**: A new `\footnote{…}` appended to an existing sentence. Default change-type. Uses parenthetical `(Author Year, p. X)` form inside the footnote body, NOT `\cite{}` commands.
- **footnote-extended**: An existing `\footnote{…}` extended with additional `cf.` citations or supporting verbatim. Preserves existing content. Parenthetical form.
- **intext-citation-new**: A parenthetical citation `(Author Year, p. XX)` inserted directly into the body prose — used sparingly when a footnote would be too heavy. Parenthetical form (no `\cite{}`).
- **bib-entry-added**: New entry in `references-v2.bib`. Tracked separately in the change-log. NOT cross-referenced via `\cite{}` in v2 prose — bib populates the file for future use; in-text citations stay parenthetical.

### 3.3 What WILL NOT change in v2 (USER-LOCKED forbidden)

- Existing prose paragraphs (no rewording)
- Section ordering or sub-section structure
- Existing footnotes' core content (only `cf.` additions allowed)
- **The 5 `\inlinenote{…}` TODOs — STRICT NO-TOUCH** (user-locked Q4)
- Bib keys for existing entries
- Diagram TikZ code or figure placements
- The 3 `\hl{…}` author-highlighted spans (those are TODO markers for the user)
- **`\cite{}` commands — not introduced in v2 prose** (user-locked Q5; parenthetical form used instead)

---

## 4. Execution phases

### Phase 0 — Preparation (target: 1.5–2 hours; no user-checkpoints)

**P0.1 Re-key the Pathe MASTER report to current §1.4-v2 line numbers.**

Pathe cache references insertion sites in OLD §§1.1–1.9. Current §1.4 is consolidated. For each of the 244 entries, locate the structural anchor in `1.4-v2.tex` and produce `tmp/Dissertation/.work/citation-enrichment-2026-05-21/pathe-rekeyed.json`. Output schema as before.

**P0.2 Build §1.3-v2 candidate list** from corpus/index/Aristotelian Phantasia Secondary + HR. Produce `diss-03-candidates.json`.

**P0.3 Build §§1.0–1.2-v2 HR/US candidate list.** Produce `diss-00-01-02-hr-us-candidates.json`.

**P0.4 Inventory the bib gap.** Scan `references.bib` against all prose-cited authors across §§1.0–1.4. Produce `references-v2.bib.gap-report.md` with proposed BibTeX stubs (categories per prior version of this plan).

### Phase 1 — §1.4-v2 systematic enrichment (target: 3.5–5 hours; user-checkpoint after first 5 insertions)

**The biggest leverage.** §1.4 has the most pre-prepared material (244-entry Pathe cache), the highest deficit, the most identifiable insertion sites.

Workflow per insertion:

1. Read rekeyed candidate from `pathe-rekeyed.json`.
2. Open `1.4-v2.tex` at the current anchor line.
3. Verify the prose still supports the cited claim.
4. Compose footnote that integrates the secondary citation as load-bearing scholarly anchor.
5. **Insert as `\footnote{...}` appended to existing sentence — DO NOT rewrite the sentence.**
6. Verify brace balance unchanged.
7. **Log to `v2-change-log.md`**: row with section, line number(s) in v2, type, source, description.
8. Update the rekeyed candidate's `applied=true` + timestamp.

**Priority order (high-value first, +13–19 footnotes total)**:

A. **Pathē-grounds-logos thesis** — anchor in scholarly reception via HR Gross-Intro p. 4 + Hyde HR-Ch4 + Struever HR-Ch5. Insertion targets: L52, L78, L197–199, L202–205, L215. ~3–4 new footnotes.

B. **Emotion-is-kinēsis etymology** — ADD Hawhee 2011 p. 154 ("*energeia is motion*") + Caston 1995 *causal powers*. Insertion target: L52 after OED footnotes. ~1–2 new footnotes.

C. **BCAP "*pathē* are not psychic experiences"** — ADD Withy 2023, Agosta 2010, Costache 2013 (all in `corpus/download/`). Insertion target: L52. ~1 new extended footnote (combines 3 short verbatims).

D. **Four-senses-of-pathos / fourfold** — ADD Gross 2017 US Intro Q-GRO-05 + Caston 1995. Insertion target: L54 or L82. ~1–2 new footnotes.

E. **Articulational-concretion thesis** at L60–L70 — ADD Caston 1995 *causal-powers* + Gonzalez 2006 *phantasia-with-pistis*. Insertion target: L62. ~1 new footnote.

F. **Enmattered-accounts** at L95–L98 — ADD Q-GRO-04 (HR Intro pp. 26–27 *eidos of fear*) + Dow 2011. Insertion target: L97. ~1–2 new footnotes.

G. **Doxa-gates-emotion** at L101–L109 — ADD Hyde HR-Ch4 on call-of-conscience-as-epideictic. Insertion target: L107. ~1 new footnote.

H. **De Insomniis feedback loop** at L127–L131 — extend existing footnote with Corcilius 2013 + Caston 1996. Insertion target: L133 (footnote-extended). ~1 footnote-extended.

I. **Hexis bivalence + technē/praxis** at L207–L209 — ADD Sherman 1989 + Broadie 1991 cf. references. Insertion target: L207–L209. ~1 footnote-extended or new.

J. **BT §29 retrospective citation of Rhetoric** at L72 — ADD HR essays' takes on BT-178 pivot (Gross-A, Pöggeler, Hyde, Struever). Insertion target: L72, L205. ~2 new footnotes.

**User-checkpoint at end of Phase 1**: present `v2-change-log.md` rows + ~5 sample diff snippets. User approves before proceeding.

### Phase 2 — §1.3-v2 systematic enrichment (target: 2.5–3.5 hours; user-checkpoint after Burke G05)

Workflow same as Phase 1.

**Priority A — Burke RoM coverage verification at §1.3 L9**. Per user Q2 decision: existing §1.3 prose already integrates Burke RoM at L55 footnote (pp. 24–25 identification-division + pp. 83–84 Hazlitt). Assistant FIRST verifies coverage adequacy by reading the L9 + L55 footnote block in v2. If adequate → log "G05 verified-already-resolved" in change-log, no fill. If inadequate → `\textbf{****** UNVERIFIED:}` relaxed-rule fill with audit footnote; user verifies later.

**Priority B — Phantasia-secondary on orientational modes** (~5–8 new footnotes):
- L65 *taking-as-something* — Nussbaum 1985; Hawhee 2011
- L67 drinking case — Caston 1995 *problem of error*
- L75–L77 three modes — Frede 1992 *supervenience* + *two-functions*
- L83 intellection — Caston 1995 *non-propositional intentionality*; White 1985 *preparation for noein*
- L89 memory — White 1985 *temporal mediator*; Frede 1992 *aisthetikon/noeton*
- L97–L101 discursive — Gonzalez 2006 *lexis as phantasia-medium*; Hawhee 2011 *rhetorical vision*
- L117–L150 doxa — Gonzalez 2006 *phantasia-with-pistis*; Nussbaum 1985 *animal-phantasia*

**Priority C — HR engagement** (~3–5 new footnotes):
- L51 — Michalski 2005 (philology of GA 18); Pöggeler 2005 (restriction)
- L83 — Hyde 2005 *epideictic-as-showing-forth*
- L91 — Struever 2005 *timefulness colonizes BT's temporal program*
- L101 — Kisiel 2005 *rhetorical protopolitics*; Gadamer 2005 *dynamis-not-technē*
- L154 — Burke RoM (post-G05 bib entry) "proves opposites" cross-ref §1.4

**Priority D — Contested-readings sidebars** (optional, judgment-required, surface for user): 2–3 substantial footnotes mapping §1.3's positions onto the Phantasia cluster's 4 debate axes. May be skipped under minimum-touch policy.

### Phase 3 — §§1.0–1.2-v2 HR/US opportunistic enrichment (target: 1.5–2.5 hours; light-touch)

Less critical than Phases 1–2. Focus on **foreshadowing Chapter X** with strategic HR + US drop-ins.

**§1.0-v2 (Introduction)** — 3–5 new footnotes:
- L65 — Gross HR-Intro p. 4 social-ontology; Rickert 2018 ecology (Q-RIC-01)
- L70 — Struever 2005 *timefulness*
- L85 — strengthen with Q-HRH-02 (cleanest single-sentence thesis-statement)

**§1.1-v2 (A₀ Motion/Time)** — 4–6 new footnotes:
- L51 — Struever 2005 biology-rhetoric intrication (major missing reference)
- HR Gross-Intro p. 1 + Gadamer pp. 47–62 on SS 1923–24 seminars
- Pöggeler 2005 on motion-restriction
- Struever *Alltäglichkeit-as-timefulness* cross-ref §1.1 G03 fill

**§1.2-v2 (M₀→A₁ Aisthesis)** — 6–10 new footnotes:
- L53 — Hawhee 2011 *rhetorical vision*; Hyde 2005 Aufzeigen
- L57 — Gross 2017 US Intro extension of Gibson (Q-GRO-04, Q-GRO-05); Rickert 2018 ecology
- L67 — Hawhee 2011 *kritikon* + bodily ratios
- L69 — Michalski 2005; Gonzalez 2006
- L83–L94 *paschein*/fourfold — Hyde 2005 Befindlichkeit-Aufzeigen; Struever *kinesis-as-Da-Charakter*
- L99–L101 *resonant kinēsis* — Hawhee 2011; Caston 1995
- L105 von Uexküll — extend with Gross 2017 US Intro hostile-environment
- L109+ dual-trace — Caston 1995 *non-propositional intentionality*

### Phase 4 — External Perplexity for genuine gaps (target: 1–3 hours; variable user-checkpoints; $10.00 budget)

**Most candidates already in `corpus/download/`. With the $10.00 budget (user-locked Q3), the assistant has headroom for ~30–60 queries** (typical query ~$0.15–$0.30). Likely targets:

**Required**:
1. **Gross 2017 *Uncomfortable Situations*** — verify ingestion; if missing, query Introduction pp. 1–27 + Ch1 (Darwin) pp. 30–60 + Epilogue pp. 200ff. (3–5 queries).
2. **Heidegger GA 29/30** — verify Withy 2023 GA 29/30 p. 101 locus + the *Stimmung*-as-melody quote (1–2 queries).
3. **Caston 1995 vs. 1996 date** — fast fix; verify against the corpus/index folder's PDF metadata (no query needed; metadata check).

**Conditional (use budget headroom)**:
4. Sherman 1989, Aubenque 1963, Broadie 1991, McNeill 1999 — page-number verification for cf. references if §1.4 cross-refs require them (4–6 queries).
5. Hyde 2005 HR Ch4 — full page-locus verification for the call-of-conscience-as-epideictic quotations (1–2 queries).
6. Struever 2005 HR Ch5 — full page-locus verification for *Alltäglichkeit-as-timefulness* + biology-rhetoric quotations (1–2 queries).
7. Kisiel 2005 HR Ch6 — page-locus verification for *rhetorical protopolitics* + arendt-recovery passages (1–2 queries).
8. Pöggeler 2005 HR Ch7 — page-locus verification for the restriction-thesis (1–2 queries).
9. Michalski 2005 HR Ch3 — page-locus verification for the philology-of-GA-18 (1 query).
10. Any unexpected gaps that emerge during Phases 1–3 application (reserve budget).

Workflow per query: per CITATION-MARATHON-WORKFLOW §3 Tier-C. User-checkpoint at each query result before integrating. Cumulative spend logged to `v2-change-log.md`.

### Phase 5 — Bib file + final consistency (target: 1.5–2 hours; light user-checkpoint)

**P5.1** Apply all bib stubs from P0.4 to `references-v2.bib`. Proper biblatex MLA-style fields. Verify against actual citation usage. Populates the file for future `\cite{}` use (handled by user as separate task per Q5).

**P5.2 — SKIPPED per user Q5 decision.** No `\cite{}` conversions in v2. All in-text citations stay parenthetical `(Author Year, p. X)`. User handles future `\cite{}` migration as a separate task.

**P5.3** Compile each `*-v2.tex` with `xelatex` (XeLaTeX per polyglossia + fontspec setup). Confirm zero new compile errors.

**P5.4** Generate the concluding report (see §5 below — this is the user-facing deliverable).

**P5.5** Run pipeline (per CITATION-MARATHON-WORKFLOW §10). Output to `corpus/index/Dissertation/_run-history/<new-TS>/`. Confirm:
- Citation gap count further reduced
- Author-engagement balance improved
- Lanham profile matrix moves toward baseline
- No new inconsistencies introduced

**P5.6** Update memory:
- `MEMORY.md`: dissertation revision status updated
- `project-dissertation-analysis-pipeline.md`: append Phase-2 metrics

### Phase 6 — Rickert *Ambient Rhetoric* analysis report (REPORT ONLY, NO EDITS — target: 2–3 hours)

**Run only AFTER Phases 0–5 complete.** No edits to any document.

Source material:
- Original PDF: `corpus/rhetorical_ontology/Rickert, Thomas - Ambient Rhetoric- The Attunements of Rhetorical Being_(2013)_[My Copy].pdf`
- Indexed corpus: `corpus/index/Rickert - Ambient Rhetoric/`
  - `rickert-analysis/book-level-ontology.md` (concept-matrix)
  - `rickert-analysis/phase2-{introduction,ch1-ch8,conclusion}.md` (chapter-level unit notes)
  - `rickert-analysis/concept-matrix.csv` + `global-edges.csv`
  - `rickert-structured/{ch1-chora.json … conclusion.json}` (per-chapter JSON)
  - `rickert-analysis/rickert-graph-{global,part1,part2}.{mmd,svg}` (mermaid concept-graphs)

Target concepts (user-specified):
1. **Attunement** — Heideggerian *Stimmung* / *Befindlichkeit* lineage; how Rickert extends/transforms
2. **Environmental affordances** — Gibson-inflected affordance theory; Rickert's "ambient" reformulation
3. **Ambience** — the book's central category; "ambient rhetoric" as the dissertation-relevant construct

Output: `plans/rickert-ambient-rhetoric-ontology-integration-report.md`

Report structure (proposed):

1. **Executive summary** (1 page) — top 5–8 ontological-expansion opportunities ranked by impact + insertion location
2. **Rickert concept map** (per topic) — for each of {attunement, affordance, ambience}:
   - 3–5 key Rickert concepts (Tier 1 / 2)
   - For each: the canonical verbatim quotation (full context, with page locus)
   - Cross-reference to the dissertation's existing concept-network (which §1.0–§1.4 paragraph would the quotation expand?)
3. **Integration opportunities** — section-by-section:
   - **§1.0**: where Rickert's framing could expand the introduction's rhetorical-grounding (with full verbatims)
   - **§1.1**: where ambient/dwelling could enrich the motion-time analysis
   - **§1.2**: where ambient-affordance + Gibson extension could enrich the aisthesis analysis (PROBABLY the densest opportunity)
   - **§1.3**: where attunement could enrich the orientational-modes analysis (esp. memory + discursive modes)
   - **§1.4**: where ambient-rhetoric could enrich the emotion-as-being-moved analysis (PROBABLY very dense — Rickert's attunement work is directly cognate)
4. **Discussion** (1–2 pages):
   - How Rickert's framework relates to Heidegger (the close-second priority)
   - How Rickert's framework relates to Aristotle (the priority)
   - Where Rickert AGREES with the dissertation's current ontology vs. where Rickert EXTENDS it vs. where Rickert MIGHT CHALLENGE it
5. **Recommendations** — ranked list of integration moves (none applied; future implementation by user's discretion):
   - High-impact, low-touch (footnote addition only)
   - High-impact, medium-touch (extended discussion paragraph)
   - High-impact, high-touch (potentially section-level expansion — deferred to Chapter X if needed)
6. **Per-quotation worksheet** — for each candidate quote:
   - Verbatim (full context, ≤120 words)
   - Page locus + chapter/section
   - The dissertation paragraph it would expand
   - 2–3 sentences explaining what new analytic purchase it adds (does it confirm? deepen? trouble? extend?)
   - Recommended integration mode (footnote / cf. reference / extended paragraph / Chapter X deferred)

Rickert reading priority (user-specified): "Rickert, and eventually Uexkull, will be used to a much lesser extent for specific elements." → Recommend **selective, surgical use**: 5–10 concrete ontological-expansion moves, NOT a wholesale incorporation. Each recommendation should be tied to a specific paragraph in §§1.0–1.4 and a specific Rickert quotation.

**This phase is report-only and does not modify any .tex or .bib file.**

---

### Phase 1–2 user-checkpoint discipline (REVISED per locked decisions)

Given user-locked decisions, the user-checkpoint protocol simplifies:

- **Phase 1 mid-checkpoint** (after first 5 §1.4-v2 insertions): present diff snippets + change-log rows. User confirms tone + parenthetical-citation form match preference, then assistant proceeds.
- **Phase 2 mid-checkpoint** (after Burke G05 verification): assistant reports verification outcome + first 3 Phantasia-secondary insertions. User confirms, then assistant proceeds.
- **No mid-checkpoints in Phase 3** (light-touch HR/US opportunistic).
- **Phase 4 per-query checkpoint** retained (each Perplexity result reviewed before integration).
- **Phase 5 final checkpoint**: present `v2-change-log.md` + xelatex compile-clean status + pipeline re-run delta. User approves; v2 ready for promotion (when user chooses) or remains as v2 alongside originals.

## 5. Concluding report deliverable (Phase 5.4)

**Path**: `tmp/Dissertation/.work/citation-enrichment-2026-05-21/v2-change-log.md`

This is the user-facing deliverable. Living document throughout Phases 0–5; final version after Phase 5.5.

**Section structure**:

```markdown
# Citation Enrichment Phase 2 — v2 Change Log

## 0. Run metadata
- v2 created: 2026-05-21T<HHMM>
- v2 completed: 2026-05-2X T<HHMM>
- Duration: X hours
- Backup: tmp/Dissertation/.backups/<TS>-pre-v2-creation/
- Original file SHA-256 (frozen): [5 hashes]
- v2 file SHA-256 (post-enrichment): [5 hashes]

## 1. Per-section summary

| Section | Original fn | v2 fn | Net new | Brace balance preserved | Compile clean |
|---|---:|---:|---:|---|---|
| §1.0 | 19 | XX | +X | ✓ | ✓ |
| §1.1 | 9 | XX | +X | ✓ | ✓ |
| §1.2 | 8 | XX | +X | ✓ | ✓ |
| §1.3 | 13 | XX | +X | ✓ | ✓ |
| §1.4 | 11 | XX | +X | ✓ | ✓ |

## 2. Per-change log (sorted by section then line)

| # | Section | v2 Line(s) | Type | Source | Description |
|---|---|---|---|---|---|
| 1 | §1.0 | 51 | footnote-extended | Phantasia/HR | Added cf. Gross 2005 HR-Intro p. 4 to existing Frede 1992 footnote on phantasia's three functions |
| 2 | §1.0 | 65 | footnote-new | HR | New footnote citing Struever 2005 timefulness on the kinetic-narrative thesis |
| ... | ... | ... | ... | ... | ... |
| N | §1.4 | 215 | intext-citation-new | HR | Parenthetical (Gross 2005, p. 1) added to existing inline mention |

## 3. Bib entries added (`references-v2.bib`)

| # | Bib key | Author | Year | Title (abbrev) | Used in §§ |
|---|---|---|---|---|---|
| 1 | caston1995imagination | Caston, Victor | 1995 | Why Aristotle Needs Imagination | 1.3, 1.4 |
| 2 | papachristou2013three | Papachristou, C. | 2013 | Three Kinds or Grades of Phantasia | 1.3 |
| ... | ... | ... | ... | ... | ... |

## 4. Author-engagement balance shift

| Author/cluster | Mentions before | Mentions after | Delta |
|---|---:|---:|---:|
| Heidegger (all) | 156 | 156 | 0 |
| Phantasia-secondaries | 61 | XX | +XX |
| HR essays | 4 | XX | +XX |
| Uncomfortable Situations | 0 | XX | +XX |
| Burke RoM/GoM | 18 | XX | +XX |
| External Pathe-cache | XX | XX | +XX |

## 5. Inlinenotes resolved (if any)

| Section | Original L | v2 L | Inlinenote text | Resolution |
|---|---|---|---|---|
| §1.4 | 171 | XXX | "need to develop the social aspects Heidegger notes…" | Converted to footnote with Gross HR-Intro p. 4 + Hyde HR-Ch4 + cf. references |

## 6. Items NOT changed (user-deferred)

- §1.4 inlinenote L181 (worked-example thirst illustration) — author design intent; not pre-empted
- §1.4 inlinenote L195 (disclosive function expansion) — author design intent; not pre-empted
- §1.4 \hl{} highlights — author TODO markers
- (etc.)

## 7. Pipeline re-run results (post-v2)

Path: `corpus/index/Dissertation/_run-history/<new-TS>/`

| Metric | Pre-v2 (2026-05-20T0058) | Post-v2 | Delta |
|---|---:|---:|---:|
| Citation gaps (detailed) | 154 / 0 REMAINING | XX / XX | -XX |
| Footnotes (§§1.0-1.4) | XX | XX | +XX |
| Word count (§§1.0-1.4) | XX | XX | +XX |
| Lanham profile (§1.4 baseline) | (qualitative) | (qualitative) | (closer/further) |

## 8. User-action items (post-Phase-2)

- Verify any UNVERIFIED placeholders introduced (if Burke G05 went via relaxed-rule path)
- Review inlinenotes-resolved (if any) for prose-fit
- Approve bib-v2 → bib promotion to canonical (when ready to promote v2 → canonical)
- Run Phase 6 (Rickert analysis) on user's signal
```

---

## 6. Backup discipline (per `feedback-backup-before-changes.md`)

Before EACH phase:

```bash
TS=$(date +%Y-%m-%dT%H%M)
mkdir -p "tmp/Dissertation/.backups/${TS}-pre-citation-enrichment-phase-N"
cp tmp/Dissertation/Working\ tex\ versions/*-v2.tex "tmp/Dissertation/.backups/${TS}-pre-citation-enrichment-phase-N/"
cp docs/references-v2.bib "tmp/Dissertation/.backups/${TS}-pre-citation-enrichment-phase-N/"
```

After Phase 0 v2 creation, all backups capture v2-state. Originals are byte-frozen and don't need re-backup.

---

## 7. Critical risks + mitigations (revised)

| Risk | Likelihood | Mitigation |
|---|---|---|
| v2 edits accidentally hit original file | LOW | Phase −1 explicit naming; verify byte-identity of originals post-each-phase via SHA-256 |
| Minimum-touch violated by impulse rewording | MEDIUM | Per-insertion discipline; user-checkpoint after first 5 §1.4 insertions to align on the threshold |
| Pathe cache insertion-points obsolete after marathon | HIGH | Phase 0 re-keying (P0.1) verifies each anchor exists in current v2 .tex |
| Bib-file consolidation introduces compile errors | LOW | Phase 5.3 xelatex compile gate |
| User-judgment-needed claim emerges mid-Phase-1 | MEDIUM-HIGH | Pause-trigger per workflow §7; surface for sign-off |
| Brace-balance instability | LOW | Verify after each insertion |
| Concluding report drifts from actual change-set | LOW | Live append (not retroactive); SHA-256 + diff verification at Phase 5.5 |
| Rickert report becomes a sprawling re-analysis | MEDIUM | Report scope locked to {attunement, affordance, ambience}; 5–10 surgical opportunities ceiling |

---

## 8. Sequencing recommendation

**Recommended pacing** (conservative, 5–6 sessions):

1. **Session 1** (~2 hours): Phase −1 (v2 creation, 5 min) + Phase 0 (preparation, 1.5–2 hr)
2. **Session 2** (~3 hours): Phase 1 first half (§1.4-v2 top 6–8 footnotes; user-checkpoint at end)
3. **Session 3** (~2 hours): Phase 1 second half + Phase 2 Burke G05 user-decision + Phantasia-secondary first batch
4. **Session 4** (~2 hours): Phase 2 second half + Phase 3 (§§1.0–1.2-v2 enrichment)
5. **Session 5** (~2 hours): Phase 4 (Perplexity) + Phase 5 (bib + compile + change-log finalization + pipeline re-run)
6. **Session 6** (~2–3 hours): Phase 6 (Rickert *Ambient Rhetoric* analysis report)

**Total wall-clock**: 13–16 hours across 5–6 sessions. Sessions can be merged if pacing allows.

---

## 9. Pre-execution decisions (USER-LOCKED 2026-05-20)

1. **§1.4 enrichment scope**: **+13–19 footnotes** (substantial Heidegger-monoculture rebalancing). Heidegger count itself unchanged; scholarly contextualization around Heidegger expands via new appended footnotes only.

2. **G05 Burke RoM placeholder**: Existing §1.3 prose already integrates Burke RoM pp. 24–25 (identification-division) + pp. 83–84 (Hazlitt) — verified at L55 footnote during analysis. Assistant FIRST verifies coverage adequacy; if adequate → no new Burke RoM fills. If inadequate → `\textbf{****** UNVERIFIED:}` relaxed-rule fill with audit footnote, user verifies later.

3. **Perplexity budget**: **$10.00 ceiling** (~30–60 queries available; headroom for Sherman/Aubenque/Broadie/McNeill page verification + any unexpected gaps).

4. **Inlinenote conversion**: **STRICT NO-TOUCH.** All 5 existing `\inlinenote{…}` blocks across §§1.0–1.4 remain byte-identical. User resolves all inlinenotes themselves.

5. **Citation form in v2**: **Parenthetical prose form `(Author Year, p. X)`** as default. NOT `\cite{key}` commands. Bib expansion (Phase 5.1) still happens — populates `references-v2.bib` for future use — but in-text references in v2 stay parenthetical. User handles `\cite{}` migration later as separate task.

6. **Rickert Phase 6 scope**: **Surgical (5–10 ontological-expansion opportunities)**. User can add more later if desired.

7. **Pacing**: **Conservative (5–6 sessions)**.

---

## 10. Cross-references + memory updates

- Workflow precedent: `tmp/Dissertation/CITATION-MARATHON-WORKFLOW.md` (this plan EXTENDS, not replaces)
- Pathe cache: `tmp/Dissertation/Pathe/citations/MASTER-CITATION-REPORT.md`
- Corpus indexes:
  - `corpus/index/Heidegger and Rhetoric/_synthesis/`
  - `corpus/index/Uncomfortable Situations/_synthesis/`
  - `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/_synthesis/`
  - `corpus/index/Rickert - Ambient Rhetoric/` (Phase 6 only)
- Pipeline run-history (Phase 5.5 output): `corpus/index/Dissertation/_run-history/<new-TS>/`
- Memory:
  - `project-dissertation-analysis-pipeline.md` — append Phase-2 metrics
  - `MEMORY.md` — flip "Dissertation Revision" status to reflect Phase-2
- Standing rules respected:
  - `feedback-backup-before-changes.md` (timestamped backups per phase)
  - `feedback-corpus-index-first.md` (corpus indexes consulted before external query)
  - `feedback-per-paragraph-revision-protocol.md` (user-checkpoint discipline)
  - `feedback-missing-source-placeholder.md` (relaxed version per workflow §5)
  - `feedback-major-iterations-on-copies.md` (v2 copy discipline)

---

**END OF PLAN**

Total estimated effort (Phases −1 through 6, conservative pacing): 13–16 hours across 5–6 sessions.
Net new footnotes target: 36–54 across §§1.0–1.4 (minimum-touch compatible).
Net new bib entries target: 25–40.
Net Perplexity spend: ≤$1.50.
Backup count: 6–8 timestamped directories.
Deliverables: (1) 5 `-v2.tex` files; (2) `references-v2.bib`; (3) `v2-change-log.md` (concluding report); (4) `rickert-ambient-rhetoric-ontology-integration-report.md`; (5) pipeline re-run output.
Originals: byte-frozen — zero edits.
