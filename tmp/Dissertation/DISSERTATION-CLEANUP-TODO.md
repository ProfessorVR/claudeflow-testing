# Dissertation Cleanup TODO

**Generated**: 2026-05-20T14:55
**Last updated**: 2026-05-21T1129 — v2 files now canonical; C1 PARTIALLY DONE (user-applied)
**Status**: ACTIVE (§1.0 walkthrough resuming on `-v2`; diagram still paused at v7)
**Canonical source files** (as of 2026-05-21T0001-0016 — user produced `-v2.tex` siblings with C1 source-augmentation work; originals retained as v0 baseline):

| Section | Canonical file (use this) | v0 baseline (reference only) | Lines | v2 byte size |
|---|---|---|---:|---:|
| §1.0 | `1.0 - Introduction-v2.tex` | `1.0 - Introduction.tex` | 725 | 74925 |
| §1.1 | `1.1 - A0 - Motion and Time as Ontological Horizon-v2.tex` | `1.1 - …Horizon.tex` | 138 | 58993 |
| §1.2 | `1.2 - M0 to A1 - The Actualization of Aisthesis-v2.tex` | `1.2 - …Aisthesis.tex` | 147 | 67565 |
| §1.3 | `1.3 - A3 - Completed Cognitive Actuality and the Three Orientational Modes-v2.tex` | `1.3 - …Modes.tex` | 173 | 102206 |
| §1.4 | `1.4 - Emotion - The Form of Desire Under Evaluative Disclosure-v2.tex` | `1.4 - …Disclosure.tex` | 221 | 121524 |
| §1.5 | `1.5 - A4 - Three Types of Action.tex` (no v2 yet) | (same) | 77 | 30318 |

**Total**: 1,481 lines across 6 canonical files. All standalone `\documentclass{article}` so each can be compiled individually.

**Scope of v2 changes** (paragraph rewrites in place — line counts unchanged):
- §1.0: 3 paragraphs rewritten (Caston 1996, Gross 2005, Gross 2017 footnotes added)
- §1.1: 4 paragraphs rewritten (C1 — not yet inventoried)
- §1.2: 6 paragraphs rewritten (C1 — not yet inventoried)
- §1.3: 8 paragraphs rewritten (C1 — not yet inventoried; heavier surface area)
- §1.4: 13 paragraphs rewritten (Heidegger GA 18 expanded, OED etymology, etc.)
- §1.5: untouched (no v2 yet; C1 gap-check pending)

**NOT yet applied in v2 new content** (must catch during walkthrough): A1 (Greek `\=e` → Unicode `ē`), A2 (em-dash spacing), C2 (`\cite{...}` → `\autocite[locus]{key}`).

**Backups**:
- `.backups/2026-05-20T1933-pre-§1.0/` — pre-v2 snapshot of original §1.0 (stale; v0 in working dir is identical)
- `.backups/2026-05-21T1129-pre-walkthrough-v2/` — all 5 v2 files + §1.5 (fresh, pre-walkthrough)

**Workflow**: Items below will be worked through SECTION-BY-SECTION with user collaboration on `-v2.tex` files. The user has hand-edited the documents; bulk-running the TODO without joint review would require the user to re-read everything. Q-items (Q1-Q5) involve research that will be done jointly. Originals are read-only references for v0/v2 A/B comparison.

**Note on `:Zone.Identifier` files**: The directory contains six small `.tex:Zone.Identifier` files (25 bytes each) — these are NTFS alternate-data-stream metadata attached by Windows when files cross the WSL boundary. They're not real `.tex` files and should be ignored.

**Quick scan baseline** (counts against new Working tex versions):

| File | `kinesis` bad / `kinēsis` good | `aisthesis` bad / good | `--- ` with space / total `---` | trace / resonant |
|---|---:|---:|---:|---:|
| §1.0 | 1 / 5 | 2 / 6 | 8 / 14 | 8 / 6 |
| §1.1 | 0 / 8 | 0 / 2 | 21 / 21 | 2 / 0 |
| §1.2 | 0 / 11 | 0 / 3 | 25 / 25 | 20 / 17 |
| §1.3 | 2 / 4 | 2 / 3 | 7 / 38 | 3 / 17 |
| §1.4 | 2 / 2 | 0 / 3 | 20 / 48 | 3 / 6 |
| §1.5 | 0 / 0 | 0 / 0 | 3 / 12 | 0 / 1 |
| **Total** | **5 / 30** | **4 / 17** | **84 / 158** | **36 / 47** |

Scope essentially identical to the prior scan — hand-editing was content-focused, not format-focused. Items A1-A8 still apply at roughly the same scale.

---

## Section A — Formatting / Style Unification

### A1. Greek accent marks — kinēsis, aisthēsis, etc. [DONE: 2026-05-28, see SITREP UPDATE 4]

**Rule**: Every transliteration of a Greek term must use the correct accent / macron marks. The Greek long-e (eta, η) is rendered as `ē` in transliteration. Common terms requiring vigilance:

| Bare form (BAD) | Correct (GOOD) | Greek |
|---|---|---|
| `kinesis` | `kinēsis` | κίνησις |
| `aisthesis` | `aisthēsis` | αἴσθησις |
| `aistheton` | `aisthēton` | αἰσθητόν |
| `aisthema` | `aisthēma` | αἴσθημα |
| `phantasia` | `phantasía` (when accented) | φαντασία |
| `phantasma` | `phántasma` (when accented) | φάντασμα |
| `techne` | `technē` | τέχνη |
| `praxis` | `prâxis` (rarely accented) | πρᾶξις |
| `pathos` / `pathe` | `páthos` / `páthē` (when accented) | πάθος / πάθη |
| `apathos` | `apathōs` (adverb) | ἀπαθῶς |
| `nous` / `noesis` | `noēsis` (the verbal noun) | νόησις |
| `orexis` | `órexis` (when accented) | ὄρεξις |
| `hexis` / `hexeis` | `héxis` / `héxeis` (when accented) | ἕξις / ἕξεις |
| `euthus` | `euthús` | εὐθύς |
| `pistis` | `pístis` | πίστις |
| `prohairesis` | `prohaíresis` | προαίρεσις |
| `phronesis` | `phrónēsis` | φρόνησις |
| `empeiria` | `empeiría` | ἐμπειρία |
| `pepoithesis` / `pepeisthai` | `pepoíthēsis` / `pepeîsthai` | (Aristotle's) |
| `eph hemin` / `ouk eph hemin` | `eph' hēmîn` / `ouk eph' hēmîn` | ἐφ᾽ ἡμῖν / οὐκ ἐφ᾽ ἡμῖν |

**Approach**:
1. Generate exhaustive regex list of bare-form → corrected-form pairs
2. For each `.md` and `.tex` file, run a careful find-replace
3. Manual review of context-sensitive cases (e.g., `kinesis` inside a quoted passage from a specific translator might be intentional)
4. Verify Unicode handling in `.tex` files (UTF-8 encoding required)

**Files affected**: all 6 dissertation files
**Estimated effort**: 2-3 hours (initial sweep + manual disambiguation)
**Verification**: re-run pattern count grep; expect 0 bad / N good for each term

---

### A2. Em-dash spacing — remove spaces around `---` [DONE: 2026-05-28, see SITREP UPDATE 4]

**Rule**: LaTeX em-dash `---` should be flush against the words it joins. No spaces before or after. When LaTeX renders, `---` becomes `—` (em-dash) and spaces would create visible gaps.

**Examples**:
- BAD: `A single ontological pattern --- numerical identity under plural formal descriptions --- iterates across levels`
- GOOD: `A single ontological pattern---numerical identity under plural formal descriptions---iterates across levels`

**Counts** (from quick scan):
- §1.1 (tex): 20/20 (100% bad!)
- §1.2 (tex): 24/24 (100% bad!)
- §1.0, §1.3, §1.4, §1.5: mixed

**Approach**:
1. Global find-replace: ` --- ` → `---` (with spaces on both sides)
2. Then: `--- ` → `---` (space after only)
3. Then: ` ---` → `---` (space before only)
4. Manual verification for edge cases (e.g., literal text quoting another author who used spaced em-dashes, though rare)

**Caveat**: Be careful with `---` inside code blocks or verbatim environments (don't change those). Also, `--` (en-dash for ranges like `1378a20--22`) should NOT be touched.

**Sed command sketch** (run per-file with backup):
```bash
sed -E -i.bak 's/ --- /---/g; s/--- /---/g; s/ ---/---/g' "file.md"
```

**Files affected**: all 6 dissertation files (especially §1.1, §1.2 which are 100% bad)
**Estimated effort**: 30-60 minutes (sed + verification)
**Verification**: `grep -c -E '(\s---|---\s)' file` should return 0 after cleanup

---

### A3. Italicize Greek-derived modifiers

**Rule**: When a Greek-derived word functions as a load-bearing adjective or noun in argumentative prose, it must be italicized. Greek-derived adjectives that need consistent italicization:

| Term | Form |
|---|---|
| phantastic (of *phantasia*) | *phantastic* |
| phantasmatic | *phantasmatic* |
| doxastic (of *doxa*) | *doxastic* |
| kinetic | *kinetic* |
| noetic | *noetic* |
| mnemonic | *mnemonic* |
| aisthetic | *aisthetic* |
| orektikon | *orektikon* |
| pathic (of *pathos*) | *pathic* |
| hexic / hexis | *hexis* (noun); *hexic* (adj, if used) |
| technical (of *technē*) | *technē-based*, *technē-driven*, etc. |
| poietic (of *poiēsis*) | *poiētic* |
| epistemic (of *epistēmē*) | *epistemic* |
| theoretic (of *theōria*) | *theoretic* |

**Approach**:
1. Define authoritative list (above) — confirm with user before applying
2. For each term, grep the dissertation files for bare uses (not already in `\textit{}` or `*...*` or other italic markup)
3. Manual review: italicize where used as load-bearing technical adjective/noun; LEAVE BARE where used as ordinary English (e.g., "the kinetic energy of the ball" — common usage; vs. "the *kinetic* moment of *kinēsis*" — technical)

**Files affected**: all 6 dissertation files
**Estimated effort**: 3-4 hours (manual review for each term; context-sensitive)
**Verification**: spot-check before/after for each term

---

### A4. Multi-definition format — unified bracket notation (in-text only) + square-bracket convention inside quotations

**Rule**: When introducing a term with multiple definitional notes (Greek, transliteration, English gloss), use a unified bracket format. **The bracket type signals authorship**:
- **Parentheses `(...)`** — for IN-TEXT (author's own prose). The whole construction is the author's writing, so parentheses are appropriate.
- **Square brackets `[...]`** — for editorial additions INSIDE a direct quotation. Square brackets signal to the reader that this gloss is the author's addition, NOT part of the original quoted source.

**This square-bracket convention is non-negotiable** because:
- It is the standard scholarly convention for editorial insertions in quoted material
- It prevents the reader from incorrectly attributing the gloss to the quoted author
- It preserves the integrity of the quotation

---

**Pattern 1 — IN-TEXT usage (author's own prose; parentheses)**:

The order of forms inside the parenthetical depends on WHICH form is used in the surrounding prose:

- If Greek is used in text:
  ```latex
  \gk{ἀλλοίωσις} (``\textit{alloiōsis},'' ``alteration,'' ``qualitative change'')
  ```

- If transliteration is used in text:
  ```latex
  \textit{alloiōsis} (``\gk{ἀλλοίωσις},'' ``alteration,'' ``qualitative change'')
  ```

- If English is used in text:
  ```latex
  alteration (``\textit{alloiōsis},'' ``\gk{ἀλλοίωσις}'')
  ```

---

**Pattern 2 — INSIDE A DIRECT QUOTATION (author's editorial addition; square brackets)**:

Same organizational structure as Pattern 1, but **square brackets** signal the gloss is the author's editorial addition:

- If Greek appears in quoted text:
  ```latex
  ``\dots{} the soul's \gk{ἀλλοίωσις} [``\textit{alloiōsis},'' ``alteration,''
   ``qualitative change''] is itself \dots{}''
  ```

- If transliteration appears in quoted text:
  ```latex
  ``\dots{} the \textit{alloiōsis} [``\gk{ἀλλοίωσις},'' ``alteration,''
   ``qualitative change''] of the perceptual organ \dots{}''
  ```

- If English appears in quoted text:
  ```latex
  ``\dots{} this alteration [``\textit{alloiōsis},'' ``\gk{ἀλλοίωσις}''] is
   thus to be distinguished \dots{}''
  ```

**Critical**: When the quoted source ALREADY contains a parenthetical gloss (their own definition), do NOT replace their gloss with the author's. Either:
- Leave their gloss untouched (preferred); OR
- If the author's gloss is needed in addition, place it in square brackets adjacent to their parenthetical, e.g.:
  ```latex
  ``\dots{} \textit{alloiōsis} (i.e., a change in quality) [``\gk{ἀλλοίωσις},''
   also rendered ``qualitative transition''] \dots{}''
  ```

---

**Prerequisite**: Define `\gk{}` macro (probably already exists; if not, use `\textgreek{}` from `xgreek` or `polyglossia` package, or just `\fontspec` with a Greek font). Verify in preamble.

**Approach**:
1. Audit each dissertation file for definitional introductions
2. **Classify each definitional occurrence** as either (a) in-text author's prose OR (b) inside a direct quotation
3. For each occurrence, apply Pattern 1 (parens) or Pattern 2 (square brackets) accordingly
4. Ensure consistent ordering: the bracketed items always follow `(transliteration, English, [Greek])` or analogous structure depending on which form is in the surrounding text
5. **Verify quotation-context detection**: look for surrounding `"..."`, ``` ``...'' ```, `\textquote{}`, `\enquote{}`, `\begin{quote}...\end{quote}`, `\begin{quotation}...\end{quotation}`, blockquotes (markdown `>` lines), footnote citations, etc.

**Detection strategy for "inside a direct quotation"** (same as A7's logic):
- Markdown: text inside `"..."` or `> blockquote` lines
- LaTeX: text inside `\textquote{...}`, `\enquote{...}`, ``` ``...'' ```, `\begin{quote}...\end{quote}`, etc.
- Bibliographic block-quotes / footnote quoted text

**Files affected**: all 6 dissertation files (most likely §1.1, §1.4, §1.5 which introduce many technical terms)
**Estimated effort**: 3-5 hours (now includes classification step)
**Verification**:
- Spot-check 10+ instances of in-text definitions; ensure all use parentheses per Pattern 1
- Spot-check 5+ instances of quoted-text glosses; ensure all use square brackets per Pattern 2
- Confirm NO Pattern 1 parens appear inside quotations (would falsely suggest author's gloss is part of the source)
- Confirm NO Pattern 2 square brackets appear in plain in-text definitions (would falsely suggest an editorial insertion when none exists)

---

### A5. Glossary with citational support

**Rule**: A glossary should accompany the dissertation listing each technical term with:
1. Greek form (drawn from a canonical Greek edition of Aristotle, OR Heidegger's exact usage where applicable)
2. Transliteration
3. Multiple translation options with source citations (e.g., Nussbaum's "appearance" vs. Hawhee's "imagination" for *phantasia*)
4. German terms (e.g., Heidegger's *Stimmung*) also receive multiple translation options with citations

**Example entry**:
```markdown
## phantasia (φαντασία)

**Greek**: φαντασία (Bekker / Ross critical edition)

**Transliterations**: *phantasia* (standard); *phántasiā* (with accent)

**Translations**:
- "appearance" (Nussbaum 1978, *Aristotle's De Motu Animalium*, p. ___)
- "imagination" (Ross 1955, *Aristotle: De Anima*, p. ___)
- "mental image" / "imagination" (Hawhee 2002, *Bodily Arts: Rhetoric and Athletics in Ancient Greece*, p. ___)
- "Vorstellungsbild" / "imaginative presentation" (Heidegger GA 18 §17, p. ___)

**Adopted translation in this dissertation**: *phantasia* (transliterated; explicit definitional gloss as "imagination plus residual affective valence")

**See also**: phantasma, aisthēsis, doxa
```

**Terms requiring glossary entries** (initial list):
- *phantasia*, *phantasma*
- *kinēsis*
- *aisthēsis*, *aisthēma*, *aisthēton*
- *energeia*, *dynamis*, *entelecheia*
- *doxa*
- *hexis*, *hexeis*
- *technē*, *praxis*, *poiēsis*
- *pathos*, *páthē*
- *orexis*, *prohaíresis*
- *nous*, *noēsis*
- *phrónēsis*, *epistēmē*, *theōria*
- *empeiría*
- *eph' hēmîn*, *ouk eph' hēmîn*
- German: *Stimmung*, *Befindlichkeit*, *Sorge*, *Da-sein*, *Augenblick*, etc.

**Approach**:
1. Compile complete list of terms used in dissertation (grep all transliterations + Greek + German)
2. For each term: find canonical Greek (Bekker text) or German (Heidegger's GA volume) source
3. For each term: collect 3-5 standard English translations from major translators with citations
4. Decide on ADOPTED translation per term (consistent with usage in dissertation prose)
5. Write glossary entries in unified format
6. Cross-reference: terms referencing each other linked
7. Consider format: separate file (`GLOSSARY.md` or `glossary.tex`) — final dissertation could include as appendix

**Files affected**: NEW file `tmp/Dissertation/GLOSSARY.md` (or similar); maybe modify all 6 to use consistent terminology aligning with glossary
**Estimated effort**: 10-16 hours (research + writing)
**Verification**: every term used in dissertation prose has a glossary entry; every glossary entry has at least one citation

**Dependencies**: A1 (Greek accents), A3 (italicization), A4 (multi-def format)

---

### A8. Italicize coined "resonant X" compound terms

**Rule**: All uses of the user's coined compound terms must be italicized as a unit. These are the technical compounds the dissertation coins by joining "resonant" with a Greek noun to articulate the phenomenology of perception-as-affectively-charged. The whole compound (both English "resonant" and the Greek noun) goes into italics.

**Coined compound inventory** (from scope scan, sorted by frequency):

| Compound | Occurrences | Files (heaviest user → lightest) |
|---|---:|---|
| *resonant epithymia* | 48 | §1.2 + §1.3 + §1.4 + §1.5 + §1.0 |
| *resonant kinēsis* | 11 (+ 3 unaccented `kinesis`) | §1.2 + §1.3 + §1.4 + §1.0 |
| *resonant aisthēma* | 6 (+ 1 unaccented `aisthema`) | §1.0 + §1.2 + §1.3 + §1.4 |
| *resonant pathē* / *resonant pathos* | 3 + 1 singular | §1.2 + §1.4 + §1.5 |
| *resonant trace* | 2 | §1.2 + §1.3 (⚠ NB: if Q5 adopted, becomes *resonant tone* — this row becomes moot) |

**Total**: 75 compound instances (excluding Q5-affected "resonant trace") to italicize across all 6 files. **§1.2 (Aisthesis chapter) is the heaviest user** — natural since it's the chapter where these compounds are introduced and developed.

**Format target**:
- LaTeX (`.tex` files): `\textit{resonant kin\=esis}` (whole compound)
- Markdown (`.md` files): `*resonant kinēsis*` (whole compound)

**Italicization states to normalize**:
1. **Bare** (no italics anywhere): `resonant kinēsis` → italicize the whole thing
2. **Partial — Greek only italic**: `resonant *kinēsis*` → italicize the whole compound: `*resonant kinēsis*`
3. **Partial — only "resonant" italic**: `*resonant* kinēsis` → italicize the whole compound: `*resonant kinēsis*`
4. **Already correctly italicized**: `*resonant kinēsis*` → leave alone (already correct)
5. **Double-wrapped**: `*resonant *kinēsis**` (rare but possible) → normalize to single italics

**Approach**:
1. For each compound in the inventory, generate find-replace patterns covering all italicization states above
2. Per-file: scan for each pattern, classify state, apply normalization
3. Verify with `grep -E '\*?resonant\*? ?[\*a-zA-Zēōāī]+'` — every match should have the form `*resonant <Greek>*`

**Dependency on A1**: A1 (Greek accent fixes) should be done BEFORE A8 so that the compounds use the canonical Greek form (e.g., `kinēsis`, `aisthēma`) before italicization. If A8 is done first, it must additionally handle the unaccented variants (e.g., `kinesis`, `aisthema`) — extra work that A1 obviates.

**Files affected**: all 6 dissertation files (most heavily §1.2)
**Estimated effort**: 1-2 hours (finite term list; mostly pattern-based; per-occurrence italicization-state check needed)
**Verification**: post-cleanup, every occurrence of `resonant <Greek noun>` should be fully italicized as a single unit

---

### A7. Aristotle work titles — use Latin/Greek standardized form [DONE: 2026-05-28, see SITREP UPDATE 4 — 0 English titles found in v3 files; prior §1.4 walkthrough + earlier sweeps had already converted]

**Rule**: All in-text references to Aristotle's works must use the standardized Latin/transliterated-Greek title (e.g., *De Anima*, not *On the Soul*). **Exception**: if the English title appears INSIDE A DIRECT QUOTATION from a scholarly source, leave the quotation untouched.

**Examples**:
- "Aristotle's *On the Soul* discusses perception" → "Aristotle's *De Anima* discusses perception"
- "...as the *Physics* shows..." → unchanged (already Latin)
- "...Aristotle's *Metaphysics*..." → unchanged (already Latin)
- Quoted material: `Smith (2010, p. 47) argues that "Aristotle's On the Soul shows..."` → LEAVE AS IS (preserves quoted source's wording)

**Standard Latin/Greek titles for Aristotle's corpus** (with conventional abbreviations):

| English (replace) | Latin (use) | Abbreviation |
|---|---|---|
| On the Soul | *De Anima* | DA |
| On Memory and Reminiscence | *De Memoria et Reminiscentia* | Mem. |
| On Dreams | *De Insomniis* | De Insomn. |
| On Sense and Sensible Objects | *De Sensu* | Sens. |
| On Sleep and Waking | *De Somno et Vigilia* | Somn. |
| On Length and Shortness of Life | *De Longitudine et Brevitate Vitae* | Long. |
| On Youth and Old Age | *De Iuventute et Senectute* | Iuv. |
| On Respiration | *De Respiratione* | Resp. |
| On the Movement of Animals | *De Motu Animalium* | MA |
| On the Parts of Animals | *De Partibus Animalium* | PA |
| On the Progression of Animals | *De Incessu Animalium* | IA |
| On the Generation of Animals | *De Generatione Animalium* | GA |
| On the Heavens | *De Caelo* | DC / Cael. |
| On Generation and Corruption | *De Generatione et Corruptione* | GC |
| On Interpretation | *De Interpretatione* | De Int. |
| Posterior Analytics | *Posterior Analytics* (or *Analytica Posteriora*) | An. Post. |
| Prior Analytics | *Prior Analytics* (or *Analytica Priora*) | An. Pr. |
| Physics | *Physics* (or *Physica*) | Phys. |
| Metaphysics | *Metaphysics* (or *Metaphysica*) | Met. |
| Nicomachean Ethics | *Nicomachean Ethics* (or *Ethica Nicomachea*) | NE |
| Eudemian Ethics | *Eudemian Ethics* (or *Ethica Eudemia*) | EE |
| Politics | *Politics* (or *Politica*) | Pol. |
| Rhetoric | *Rhetoric* (or *Rhetorica*) | Rhet. |
| Poetics | *Poetics* (or *Poetica*) | Po. |
| Categories | *Categories* (or *Categoriae*) | Cat. |
| Topics | *Topics* (or *Topica*) | Top. |
| Sophistical Refutations | *Sophistical Refutations* (or *Sophistici Elenchi*) | SE |

**Approach**:
1. Build an authoritative map of English title → Latin title (table above; refine if needed)
2. For each title pair, grep the dissertation files for the ENGLISH form (outside of quoted material)
3. Replace with Latin form, italicized
4. Manual review: for each match, verify it's NOT inside a direct quotation block (look for surrounding `"..."` or ```...''` LaTeX quotes, blockquotes, or `\textquote{}`)
5. Leave quoted occurrences untouched

**Detection strategy for "inside a direct quotation"**:
- Markdown: text inside `"..."` or `> blockquote` lines
- LaTeX: text inside `\textquote{...}`, `\enquote{...}`, ``` ``...'' ```, `\begin{quote}...\end{quote}`, `\begin{quotation}...\end{quotation}`, footnote citations
- Cited inline text where the surrounding context names a specific author/year/page

This will require careful pattern matching — best to do as semi-automated with manual confirmation per match.

**Files affected**: all 6 dissertation files (most likely §1.0, §1.1, §1.4 where Aristotelian texts are introduced; potentially many footnotes)
**Estimated effort**: 1-2 hours (mostly verification; the title list is short and unambiguous outside quotations)
**Verification**: grep for known English titles ("On the Soul", "On Dreams", etc.) post-cleanup; only matches should be inside quotations

---

### A6. Time bubble re-labeling — Tₙ→Tₙ₊₁ pattern + clarifying note

**Rule**: Time bubbles in the diagram should mimic the motion notation:
- Motion: Mₙ → Aₙ₊₁ (motion FROM Mₙ TO Aₙ₊₁, named by its terminus)
- Time: Tₙ → Tₙ₊₁ (time interval bounded by the motion's start and end)

**Clarification needed in the diagram annotation**: Tₙ → Tₙ₊₁ is NOT a discrete temporal duration (not "1 hour" or "5 minutes"). It is the **count of motion** per Phys. IV.11, 219b1. The motion of building a house extends over a long duration; Tₙ → Tₙ₊₁ marks the boundaries of the motion from start to finish as a temporal sequence whose magnitude varies by the motion/actualization being indexed.

**Current diagram (v7) state**:
- Labels: τ₀→₁, τ₁→₂, τ₂→₃, τ₃→₄ (using subscript notation, lowercase tau)
- Top-right note: "TIME: number of motion (Phys. IV.11, 219b1)"

**Proposed update**:
- Use Tₙ rather than τₙ (capital T to mimic Mₙ/Aₙ)
- Each time bubble: Tₙ → Tₙ₊₁ with the existing per-motion descriptor
- Expand the top-right note: "TIME (Tₙ → Tₙ₊₁): number of motion (Phys. IV.11, 219b1) — NOT discrete clock duration; the temporal interval bounded by a motion's start and end, variable by motion-type"
- Possibly add a note that this connects to Q1 (rethinking all temporal bubble descriptors)

**Files affected**: diagram files (reference TikZ-in-MD; §1.0 inline once v7 is propagated; HTML if visual consistency wanted). NOT the dissertation prose unless time is discussed there.
**Estimated effort**: 30-60 minutes (in next diagram iteration)
**Dependency**: connects to Q1 below (full temporal-bubble redesign)

---

## Section B — Deferred Investigations (from diagram work)

These items were deferred during diagram iteration; documented in `tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/option-b-iterations/_notes/v3-followup-notes.md`.

### Q1. Rethink ALL temporal bubble descriptors (connects to A6)

**Status**: v3 made a provisional choice on T₂→₃ (Option C: "multi-modal duration"). v7 inherits this. The other 3 temporal bubbles (T₀→₁, T₁→₂, T₃→₄) still use v0-era descriptors that describe CONTENT, not pure temporal character per Phys. IV.11.

**Current state**:
- T₀→₁: "medium transmits" — describes WHAT moves, not temporal character
- T₁→₂: "trace persists & settles" — describes residue dynamics, not temporal character
- T₂→₃: "multi-modal duration" — structurally about temporal character (v3 Option C)
- T₃→₄: "desire → motor act" — describes content, not temporal character

**Investigation needed**:
- For each Tₙ→Tₙ₊₁, determine the pure TEMPORAL character (latency, duration, onset, etc.) following the Phys. IV principle
- Possible descriptors: "Instantaneous-propagated" (T01), "Settlement-time" (T12), "Multi-modal duration" (T23, current), "Virtually simultaneous" (T34, per MA 702a15-17)
- Discuss with user; pull Aristotelian texts on time per motion

**Estimated effort**: 1-2 hours (research) + 1-2 hours (diagram update)
**Dependency**: A6 (Tₙ→Tₙ₊₁ relabeling) is the implementation phase

---

### Q2. A₄→Hexeis feedback character — universal, conditional, or graded?

**Status**: Diagram (v4+) retains single solid arrow A₄→Hexis (Reading 1, universal by default). User asked: does every completed action feed into Hexeis, or do simple appetitive actions ("see drink, I drink") bypass hexis formation?

**Three readings on the table**:
1. **Universal**: All A₄ → hexeis. Single arrow.
2. **Conditional**: Only Type 2/3 chains feed hexeis. Type 1 (pure appetitive) bypasses.
3. **Graded** *(my prior recommendation)*: All voluntary action feeds back, but Type 2/3 → strong technē/praxis hexis; Type 1 → weak feedback to *empeiría* (experiential confirmation), not to ethical/technical hexis. Dual arrows + new empeiría node.

**Texts to pull**:
- **Aristotle**: NE II.1 (1103a14-26), NE II.5 (1105b19-1106a13), MA 701a32-33, NE VI.5 (1140a24-b30), Met. A.1 (980b25-981a30), NE VII.10 (1152a30-34)
- **Heidegger**: GA 18 §17 (hexis bivalence), possibly GA 19 (Sophist) on appropriation and habituation

**Estimated effort**: 4-8 hours (research + decision + diagram update if reading changes)
**Diagram impact**: if Reading 2 or 3 selected, add empeiría node + conditional/dual arrows

---

### Q3. Path 1 (Deliberative → M₃→A₄ bypassing DOXA) — what does it represent?

**Status**: Diagram (v4+) retains Path 1 teal arrow from DELIB.south to M34.north_west. v6 has interpretation "Deliberative (no doxa needed)" in label. User questions whether deliberation can ACTUALLY bypass doxa.

**Three interpretations on the table**:
1. **Path 1 is wrong, remove it**: Per MA 701a7-25, deliberation's universal premise IS a doxa. No genuine bypass.
2. **No new EPISODIC doxa formed** *(my prior recommendation)*: Universal in hexis is doxastic; deliberation doesn't form a new episodic doxa but draws on standing one.
3. **Follow-through-on-prior-decision**: Doxa engaged earlier (off-frame); current execution doesn't re-engage doxa.

**Texts to pull**:
- **Aristotle**: DA III.10 (433a13-15), DA III.11 (434a5-11), MA 701a7-25, DA III.3 (427b17-24, 428a19-24), NE VI.5
- **Heidegger**: GA 18 §15 on θεωρεῖν vs διαλέγεσθαι, GA 19 (Sophist) on practical reasoning structure

**Estimated effort**: 2-4 hours (research + decision + diagram update if interpretation changes)
**Dependency**: If Q4 prose audit determines hexis ≠ doxa strictly (likely), Interpretation 2 needs rewording: "Deliberation draws on universal DOXASTIC HEXIS (a specific species of hexis, not hexis-as-such); no new episodic doxa formed."

---

### Q5. Terminology investigation — change "trace" → "tone"

**Status**: PROPOSED for investigation. User considering this terminology change because:
- "Tone" is more thematically aligned with the existing "resonant" terminology (48 occurrences across dissertation)
- "Tone" connects to Uexküll's terminology (he uses *Merkmalton* / "perceptual tone" and *Wirktonus* / "effector tone" in his Umwelt theory)
- Possible overlap with Heidegger's reference to Uexküll that could provide additional theoretical anchorage

**Proposed renames**:
- "dual-trace thesis" → **"dual-tone thesis"**
- "residual trace" → **"residual tone"**
- (Probable) other "trace" → "tone" usages depending on context

**Investigation tasks**:

1. **Locate Uexküll's tonal vocabulary**:
   - Primary text: Uexküll, *Theoretical Biology* (*Theoretische Biologie*, 1920/1928) — *Funktionskreis* / functional cycle; *Merkmal*-*Wirkmal*; *Merkmalton* / *Wirktonus*
   - Secondary text: Uexküll, *A Foray into the Worlds of Animals and Humans* (*Streifzüge durch die Umwelten von Tieren und Menschen*, 1934)
   - Confirm whether "tone" is the most resonant English rendering or whether other translations exist (*qualitative tone*, *perceived character*, *affective tone*)

2. **Locate Heidegger's reference to Uexküll**:
   - **Being and Time §10** (footnote in the Macquarrie/Robinson edition): brief reference to Uexküll's *Umwelt* / "milieu" theory in the context of Dasein's environing world (*Umwelt*)
   - **GA 29/30 *The Fundamental Concepts of Metaphysics: World, Finitude, Solitude*** (1929-30 lecture course): extensive engagement with Uexküll, especially §§42-58 on animal "captivation" (*Benommenheit*) vs. human "world-formation" (*Weltbildung*). Heidegger discusses Uexküll's *Funktionskreis* model directly.
   - Possible secondary references in *Letter on Humanism*, lectures on Hölderlin, etc.

3. **Assess theoretical fit**:
   - Does Uexküll's *Merkmalton* (perceptual tone) align with the user's "residual tone" concept? Specifically: does "tone" in Uexküll signify a perceptual quality that persists or resonates within the perceiving organism's *Umwelt*? If yes, the connection is strong.
   - Does Heidegger's appropriation of Uexküll preserve the "tonal" vocabulary, or does Heidegger translate it into his own terms (*Stimmung* / mood, etc.)? Look for the German term used in GA 29/30.
   - Is the "resonant" terminology already implicitly tonal in the dissertation, such that "tone" makes the implicit explicit?

4. **Determine implementation scope**:
   - Quick scan (counts): §1.0 (8 trace) + §1.1 (2) + §1.2 (**20**) + §1.3 (3) + §1.4 (3) + §1.5 (1) = **37 total "trace" occurrences**
   - §1.2 (Aisthesis chapter) is the heaviest user — makes sense as the "dual-trace thesis" likely originates there
   - **Critical disambiguation needed**: distinguish noun "trace" (technical term, would change) from verb "to trace" (e.g., "Aristotle traces the impairment to...") — these MUST NOT change

5. **Decide and implement (if approved)**:
   - If terminology change is adopted: refactor 37 occurrences with manual review per occurrence
   - Update the diagram if any visual element uses "trace" terminology (check Option B v7)
   - Update v3-followup-notes.md if any deferred items mention "trace"
   - Cross-reference with A5 glossary: add "tone" with citational support pointing back to Uexküll + Heidegger

**Texts to pull**:
- Uexküll, J. von. *Theoretical Biology*. New York: Harcourt, Brace and Company, 1926. (Original German 1920/1928)
- Uexküll, J. von. *A Foray into the Worlds of Animals and Humans*. Trans. J.D. O'Neil. Minneapolis: U Minnesota Press, 2010.
- Heidegger, Martin. *Being and Time*. Trans. Macquarrie & Robinson. New York: Harper & Row, 1962. (§10 footnote)
- Heidegger, Martin. *The Fundamental Concepts of Metaphysics: World, Finitude, Solitude* (GA 29/30). Trans. McNeill & Walker. Bloomington: Indiana U Press, 1995. (§§42-58)

**Estimated effort**:
- Investigation phase: 3-6 hours (pull texts, read relevant sections, decide)
- Implementation phase (if approved): 2-4 hours (37 occurrences with disambiguation + diagram + cross-refs)
- **Total if implemented**: 5-10 hours

**Verification**: if implemented, `grep -c -E '\btrace\b|residual trace|dual-trace'` should return 0 (or only verb uses if any) in dissertation files; new "tone" usages should be consistent and traceable to Uexküll/Heidegger via glossary entry

**Dependencies**:
- Investigation phase is INDEPENDENT (do whenever)
- Implementation phase, if approved, should ideally precede A5 (glossary) so the glossary entry is correct
- If approved, may interact with A3 (italicize Greek-derived modifiers) — but "tone" is German/English, not Greek-derived, so no direct conflict

---

### Q4. Hexis ≠ Settled Doxai — dissertation prose audit [DONE: 2026-05-28, see SITREP UPDATE 4 + Q4-hexis-doxa-audit.md; rule updated: doxa is NOT a species of hexis (taking-as-true vs disposition); cross-file "settled doxa(i)" → "held doxa(i)" sweep applied; §1.0 diagram fixed + §1.3/§1.4/§1.5 prose corrections applied; §1.5 L186 canonical formulation preserved]

**Status**: Diagram (v3+) fixed: outer label "Settled Doxai (Hexeis)" → "Hexeis (Standing Dispositions)" per Fix A. DISSERTATION PROSE not yet audited.

**Rule established in diagram**: Hexis is the broader genus (per Cat. 8b27ff: virtues, crafts, knowledge, bodily states are all hexeis). Settled doxai are ONE SPECIES of hexis (the doxastic-cognitive species, per MA 701a7-25, where the practical syllogism's universal premise is a settled doxa). Technē-hexis and praxis-hexis are character/craft dispositions, NOT primarily doxastic.

**Action items for prose audit**:
1. **§1.0 Introduction** (where diagram is discussed): clarify hexis-doxai relationship in prose
2. **§1.4 Emotion is Motion**: check for any conflation in:
   - Discussion of doxa-as-habituated-disposition
   - Treatment of praxis-hexis and its relation to doxa-gating of *pathē*
3. **§1.5 Completed Action**: check for any conflation in:
   - Type 2 chain (technē-hexis) treatment — is it cast as "settled doxai" or as "settled craft dispositions"?
   - Type 3 chain (praxis-hexis) treatment — same audit
4. **Cross-section consistency**: §1.3 introduces orientational modes; §1.4 introduces the bivalence; §1.5 catalogs operational types. The terminology must be consistent across all three.

**Grep patterns to find conflations**:
```bash
grep -n -i "settled doxa.* hexis\|doxa-as-hexis\|hexis = doxa\|hexis is doxa\|doxai as hexeis" \
  "1.0 - Introduction/1.0 - Introduction.md" \
  "1.3 - A3 - Orentational Modes/1.3 A3 - Orientational Modes.md" \
  "1.4 - Emotion is Motion/1.4 - Emotion is Motion.md" \
  "1.5 - A4 - Completed Action/1.5 - A4 - Completed Action.md"
```

**Suggested rewrite formula**: where the current text equates settled doxai with hexeis, refactor to: "settled doxai operate as a doxastic species of hexis (the universal premise of the practical syllogism); *technē-hexis* and *praxis-hexis* as dispositional states are broader, including but not reducible to their doxastic components."

**Estimated effort**: 4-8 hours (grep + review + careful rewrite + cross-section consistency check)
**Dependency**: Affects Q3 (Path 1) interpretation; Q4 should be resolved before final Q3 decision

---

## Execution Sequence (ordered by ease of completion)

Ranked by combined ease: time required + cognitive complexity (mechanical vs. semantic vs. philosophical) + dependency burden (items blocked by prerequisites are harder).

| # | Item | Est. effort | Ease rationale |
|--:|---|---:|---|
| **1** | **A2** — Em-dash spacing | 30-60 min | Purely mechanical sed substitution. Lowest cognitive load. No dependencies. Biggest immediate visual cleanup. |
| **2** | **A6** — Time bubble re-labeling Tₙ→Tₙ₊₁ | 30-60 min | Single diagram update (touches only the TikZ time-bubble labels + clarifying note). Isolated change. No dependencies. Could pair with Q1 for full time-system overhaul. |
| **3** | **A7** — Aristotle work titles to Latin/Greek | 1-2 hr | Pattern-based replacement with quotation-context guard. Short title list (~30 titles), mostly mechanical. |
| **4** | **A1** — Greek accents (kinēsis, aisthēsis, etc.) | 2-3 hr | Pattern-based with manual disambiguation for quoted text. Well-defined term list. Quick scan shows scope: ~10 bare instances to fix. |
| **5** | **A8** — Italicize coined "resonant X" compounds | 1-2 hr | Finite compound list (75 total instances; *resonant epithymia* alone = 48). Pattern-based with italicization-state normalization. **Depends on A1** (canonical Greek accents first). |
| **6** | **Q1** — Rethink all temporal bubble descriptors | 2-4 hr | Limited research scope (only 4 bubbles). Pairs naturally with A6. Independent. |
| **7** | **A3** — Italicize Greek-derived modifiers | 3-4 hr | Context-sensitive review of each modifier (phantastic, doxastic, kinetic, etc.) across all 6 files. Manual judgment required. |
| **8** | **A4** — Multi-def format (parens vs. square brackets) | 3-5 hr | Each occurrence must be classified as in-text (parens) or inside-quotation (square brackets). Two-pattern complexity. |
| **9** | **Q4** — Hexis ≠ Doxa dissertation prose audit | 4-8 hr | Philosophical rewrites across §§1.0/1.4/1.5. **Prerequisite for Q3** + needed for A5 glossary entries. |
| **10** | **Q3** — Path 1 (Deliberative bypass DOXA) interpretation | 2-4 hr | Short duration but **blocked by Q4** until prose audit resolves the hexis/doxa distinction. Quick once Q4 done. |
| **11** | **Q2** — A₄→Hexeis feedback character | 4-8 hr | Deepest independent philosophical investigation. Texts: NE II.1, II.5, MA 701a32-33, NE VI.5, Met. A.1, NE VII.10 + Heidegger GA 18 §17, GA 19. |
| **12** | **Q5** — "trace" → "tone" terminology investigation (+ implementation if approved) | 5-10 hr | Investigation phase 3-6 hr (Uexküll *Merkmalton*/*Wirktonus*, Heidegger GA 29/30 §§42-58 on Uexküll, BT §10 fn). Implementation 2-4 hr if approved (37 occurrences across all 6 files, mostly in §1.2). |
| **13** | **A5** — Glossary with citational support | 10-16 hr | Largest deliverable. Compile all terms, find citations from canonical sources (Bekker/Ross for Greek; GA for Heidegger), curate 3-5 translation options per term. Depends on A1+A3+A4+A7+A8 (and ideally Q4 + Q5 for accurate hexis/tone entries). |

**Total estimated effort**: 42-74 hours of focused work, naturally splitting across 7-10 work sessions.

**Notes on ordering**:
- Items 1-5 are mechanical/pattern-based and provide quick momentum
- Item 6 (Q1) optionally combines with item 2 (A6) for a single time-system polish session
- Items 7-8 (A3, A4) are still mechanical-ish but require human judgment per occurrence
- Items 9-12 (Q-items) are philosophical and benefit from a dedicated research session
- Item 13 (A5 glossary) is the capstone, naturally last

**Dependency graph**:
```
A2  A6 ─┐
A7      ├─→ A5 (glossary)
A1 ─→ A8┤
A3  A4  │
Q1 ─────┘
Q4 ─→ Q3  (Q3 blocked until Q4 settles)
Q4 ─→ A5  (A5 needs Q4 settled for clean hexis entries)
Q5 ─→ A5  (A5 needs Q5 settled for clean "tone" entry IF adopted)
A8 ─→ A5  (A5 glossary entries for coined compounds reference normalized italic form)
Q2 independent
```

---

## Final Synthesis Phase (after all items above)

- Final cross-section consistency review
- Re-compile dissertation PDF
- (If desired) update diagram §1.0 inline copy + figure[p] wrapper (resumes paused diagram work from v7)

---

## How to Resume

1. Read this file (`tmp/Dissertation/DISSERTATION-CLEANUP-TODO.md`)
2. Read the diagram v7 design rationale (`tmp/Dissertation/Actualization of Desire (perception-to-movement) Diagram/option-b-iterations/_notes/v3-followup-notes.md`)
3. Pick a phase/item to begin
4. Use TaskCreate to track sub-tasks as work proceeds
5. Mark items in this TODO complete by appending `[DONE: 2026-XX-XX, see <ref>]` to each

---

**End of cleanup TODO.**
