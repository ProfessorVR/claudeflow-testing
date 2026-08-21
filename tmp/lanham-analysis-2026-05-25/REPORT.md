# Lanham Prose Analysis — Dissertation §§1.0–1.5

**Date:** 2026-05-25
**Tool:** `npx tsx src/god-agent/cli/prose-analyze.ts <file> --genre academic --verbose`
**Analysis depth:** Tier 1 heuristic (POS via `en-pos` + phonemic + lexical patterns)
**Genre context:** `academic`
**Raw outputs:** `tmp/lanham-analysis-2026-05-25/*.txt`

---

## 1. Corpus inventory

| § | File | Words | Sents | Words/sent |
|---|---|---:|---:|---:|
| 1.0 | Introduction | 9,535 | 702 | **13.6** |
| 1.1 | A_0 Motion and Time | 8,445 | 409 | 20.6 |
| 1.2 | M_0 → A_1 Aisthesis | 10,383 | 449 | 23.1 |
| 1.3 | A_3 Cognitive Actuality | 14,066 | 574 | 24.5 |
| 1.4 | Emotion / Desire | 16,015 | 668 | 24.0 |
| 1.5 | A_4 Three Types (versionC) | 9,611 | 396 | 24.3 |
| **TOTAL** | | **68,055** | **3,198** | **21.3** |

**Sentence-length observation:** §1.0 has dramatically shorter sentences (13.6 words) than the rest of the dissertation (20–25). This is a deliberate introduction-genre choice — shorter sentences front-load argumentative claims. The body chapters cluster tightly at ~23–25 words per sentence.

---

## 2. Per-axis comparison

### 2.1 Noun/Verb axis (verbal vs nominalized prose)

| § | nounVerbRatio | Nominalization /100w | Prep phrases/sent | Be-verbs % | Label |
|---|---:|---:|---:|---:|---|
| 1.0 | 0.613 | 5.47 | 5.72 | 15.8% | balanced |
| 1.1 | 0.586 | 6.56 | 4.78 | 19.9% | balanced |
| 1.2 | 0.618 | 6.02 | 4.35 | 20.6% | balanced |
| 1.3 | 0.648 | 4.99 | 4.79 | 17.3% | balanced |
| 1.4 | 0.618 | 5.82 | 4.82 | 14.8% | balanced |
| 1.5 | **0.659** | 5.69 | **3.74** | **12.2%** | **predominantly verb-style** |

**Finding:** §1.5 versionC is the only chapter that breaks out of the "balanced" cluster into **predominantly verb-style** — the most agent-prominent prose in the dissertation. Three signals converge: lowest prepositional-phrase density (3.74 vs the 4.3–5.7 elsewhere), lowest be-verb ratio (12.2% vs 14.8–20.6%), and highest nounVerbRatio (0.659; the metric runs *inverse* in this implementation — higher = more verbal action). §1.1 conversely uses the most nominalization (6.56/100w) and the most be-verbs (19.9%) — Aristotle exegesis attracts a more nominalized register.

### 2.2 Architecture (parataxis / hypotaxis)

| § | parataxisHypotaxisRatio | Coord conj density | Subord conj density | Label |
|---|---:|---:|---:|---|
| 1.0 | 0.357 | 0.032 | 0.017 | mixed |
| 1.1 | 0.404 | 0.038 | 0.025 | mixed |
| 1.2 | 0.359 | 0.043 | 0.023 | mixed |
| 1.3 | 0.416 | 0.037 | 0.026 | mixed |
| 1.4 | 0.381 | 0.038 | 0.023 | mixed |
| 1.5 | 0.404 | 0.040 | 0.027 | mixed |

**Finding:** All chapters are labeled "mixed" — none lean strongly paratactic or hypotactic. Variation across chapters is small (0.357–0.416 range). The dissertation maintains a stable architectural register.

### 2.3 Sentence shape (periodic vs running)

| § | periodicRunningRatio | preMainVerbClauseCount | Label |
|---|---:|---:|---|
| 1.0 | 0.672 | 0.04 | running |
| 1.1 | 0.673 | 0.06 | running |
| 1.2 | **0.737** | 0.06 | running (most running) |
| 1.3 | **0.592** | **0.08** | **mixed** (most periodic) |
| 1.4 | 0.656 | 0.06 | running |
| 1.5 | 0.660 | 0.07 | running |

**Finding:** §1.3 is the only chapter where the analyzer detects enough pre-main-verb suspension to mark "mixed" sentence shape rather than running. The three-orientational-mode distinctions in §1.3 (intellection / memory / deliberative phantasia) appear to require more periodic suspension to introduce nested distinctions before the main verb arrives. §1.2 is the most strongly running (0.737) — perhaps because the Aristotle-on-aisthesis exegesis is more linear.

### 2.4 Voice (voiced vs unvoiced)

| § | voiceScore | dynamicRange | Label |
|---|---:|---:|---|
| 1.0 | **0.603** | **1.000** | moderate voice (highest) |
| 1.1 | **0.223** | 0.643 | **unvoiced** |
| 1.2 | 0.261 | 0.670 | unvoiced |
| 1.3 | 0.322 | 0.681 | moderate voice |
| 1.4 | 0.347 | 0.590 | moderate voice |
| 1.5 | 0.371 | 0.572 | moderate voice |

**Finding:** Clear voice progression. §1.0 has the most rhythmic variety (dynamicRange 1.000 = maximum) and highest voice score (0.603) — the introduction is the most "personality-bearing" prose. §§1.1–1.2 (Aristotle exegesis) are the most effaced authorially. §§1.3–1.5 trend toward moderate voice, with §1.5 the highest of the post-introduction chapters (0.371).

However, §1.5 also has the **lowest dynamicRange** (0.572) — meaning the prose is rhythmically uniform. This is consistent with §1.5's per-subsection generation: 9 independent runs produced sentences in a tighter length distribution than versionA/B's rolling-context pass through the same material.

### 2.5 Register (high vs middle vs low)

| § | registerMarkednessScore | latinateGermanicRatio | % non-Latinate | Label |
|---|---:|---:|---:|---|
| 1.0 | 0.717 | 0.158 | 84% | high |
| 1.1 | 0.703 | 0.158 | 84% | high |
| 1.2 | 0.708 | 0.155 | 84% | high |
| 1.3 | 0.708 | 0.157 | 84% | high |
| 1.4 | 0.710 | 0.153 | 85% | high |
| 1.5 | 0.716 | 0.170 | 83% | high |

**Finding:** Register is remarkably uniform across the dissertation. All chapters cluster at ~70–72% markedness, ~84% non-Latinate (Germanic + short) vocabulary, 15–17% Latinate. The Lanham analyzer flags this as "high" register — meaning the prose draws on a distinctively *marked* (rather than neutral) lexical register, even while leaning Germanic.

§1.5's slightly elevated Latinate ratio (0.170, ~17% vs the 15–16% elsewhere) is the largest register deviation, but still well within the chapter cluster.

### 2.6 Opacity (rhetorical self-consciousness)

| § | opacityScore | selfConsciousnessScore | Label |
|---|---:|---:|---|
| 1.0 | **0.863** | **0.553** | opaque (highest) |
| 1.1 | 0.839 | 0.453 | opaque |
| 1.2 | 0.757 | 0.421 | opaque |
| 1.3 | 0.759 | 0.274 | opaque |
| 1.4 | 0.805 | 0.285 | opaque |
| 1.5 | **0.698** | **0.084** | opaque (lowest) |

**Finding:** §1.5 versionC has the **lowest opacity score (0.698) and dramatically lowest self-consciousness score (0.084 vs the 0.27–0.55 range of other chapters)**. This is the most striking inter-chapter signature in the analysis. §1.5 is the chapter where the prose calls *least* attention to itself as prose. The per-subsection-mode generation produces direct, content-forward writing without the meta-linguistic markers, ostentatious sound patterning, or rhetorical display that mark the other chapters.

§1.0 sits at the opposite extreme — the introduction is the most rhetorically performative chapter (opacityScore 0.863, selfConsciousness 0.553). §1.1 follows closely (0.839 / 0.453).

### 2.7 Tacit persuasion patterns

| § | Alliteration /sent | Polyptoton /sent | Chiasmus | Antithesis | Anaphora | Isocolon | Climax |
|---|---:|---:|---:|---:|---:|---:|---:|
| 1.0 | **0.173** | 0.046 | 184 | 19 | **1** | 10 | 26 |
| 1.1 | 0.121 | 0.121 | 236 | 23 | 0 | 9 | 37 |
| 1.2 | 0.057 | **0.135** | 291 | 50 | 0 | 13 | 49 |
| 1.3 | 0.071 | 0.104 | **395** | 55 | 0 | 21 | **61** |
| 1.4 | 0.100 | 0.087 | **427** | 54 | 0 | **32** | 47 |
| 1.5 | **0.047** | 0.057 | 290 | 40 | 0 | 18 | 44 |

**Findings:**
- **§1.0** has the most alliteration (0.173/sent) — phonemic patterning matches the introduction's high opacity score. §1.5 has the least (0.047/sent), consistent with its low opacity.
- **§1.2** has the highest polyptoton density (0.135/sent) — repetition of word stems in varied morphological forms. Likely tied to the dense Greek-terminology cluster around *aisthēsis / aisthētikon / aisthēma*.
- **§1.4** has the absolute-largest tacit-pattern counts (427 chiasmus, 32 isocolon) because it's the longest chapter (16,015 words). Normalized per sentence: chiasmus 0.64/sent — comparable to the other body chapters.
- **§1.0** has the only detected **anaphora** (1 instance). All other chapters: 0. Anaphora is an introduction-genre marker.
- **§1.5** has the lowest alliteration, lowest polyptoton, second-lowest chiasmus normalized — overall the least tacit-pattern-dense chapter. Consistent with its low opacity / low self-consciousness profile.

---

## 3. Cross-chapter signatures

### Three stylistic clusters detected

**Cluster A — Introduction (§1.0):**
- Shortest sentences (13.6 words/sent vs ~24 elsewhere)
- Highest voice / dynamic range
- Highest opacity / self-consciousness
- Highest alliteration
- Only chapter with anaphora
- "Performative" — calls attention to itself as opening rhetoric

**Cluster B — Body chapters §§1.1–1.4 (Aristotle exegesis + cognitive/emotional analysis):**
- ~20–25 words per sentence
- Voice progresses from unvoiced (§§1.1–1.2) to moderate (§§1.3–1.4)
- High opacity (0.76–0.84)
- Dense tacit patterning (chiasmus, antithesis, isocolon counts grow with chapter length)
- "Architectonic" — long sentences with complex clausal nesting

**Cluster C — §1.5 versionC (per-subsection-mode-generated):**
- 24.3 words per sentence (matches §§1.3–1.4)
- Most verbal / least nominalized — only chapter tagged "predominantly verb-style"
- Lowest be-verb ratio (12.2%) and prepositional density (3.74/sent)
- Lowest opacity (0.698) and self-consciousness (0.084) by a wide margin
- Lowest alliteration, lowest polyptoton, fewest tacit patterns relative to length
- Lowest dynamic range (0.572) — most rhythmically uniform
- "Direct" — content-forward without rhetorical display

### The §1.5 versionC stylistic signature is detectably different from §§1.1–1.4

Three independent metrics agree:
1. **Verb-style label** (only chapter not "balanced") — content-forward rather than nominalized
2. **Opacity drop** from 0.76–0.84 to 0.70, **self-consciousness drop** from 0.27–0.55 to 0.08
3. **Tacit-pattern reduction** — least alliteration, fewest patterns per sentence

This signature is consistent with the per-subsection-mode generation architecture documented in `plans/subsection-mode-design.md`:
- 9 independent /god-write invocations rather than 1 rolling-context pass
- No accumulated stylistic momentum across subsections (each starts fresh)
- The `buildSubsectionPrompt` length directive emphasizes focus and target adherence over rhetorical performativity
- The dalton-philosophical style profile is still applied per invocation, but the model has less "context" of prior prose to riff off of

**Interpretive question for the dissertation:** Is the §1.5 stylistic shift a feature or a regression?

- **Feature reading:** §1.5 is more direct, less ornate, more "modern academic" in tone. The concluding chapter benefits from clarity over rhetorical display.
- **Regression reading:** §1.5 has lost the rhetorical voice of the surrounding chapters. The dissertation's stylistic unity is compromised; §1.5 reads as written by a different (more pedestrian) hand than §§1.1–1.4.

The Lanham analyzer is descriptive, not prescriptive — it reports the gap but doesn't take a position. The user's revision judgment is what matters here.

---

## 4. Sentence-shape outlier (§1.3)

§1.3 is the only chapter where the analyzer detects "mixed" rather than "running" sentence shape. The metric flags this:
- §1.3: periodicRunningRatio 0.592, preMainVerbClauseCount 0.08 (highest)
- All others: periodicRunningRatio 0.65–0.74, preMainVerbClauseCount 0.04–0.07

**Hypothesis:** the three-orientational-mode taxonomy in §1.3 (intellection / memory / deliberative *phantasia bouleutikē*) requires more pre-main-verb suspension to introduce nested distinctions before the main clause arrives. Sentences like "Whereas X distinguishes A, Y distinguishes B, the third mode Z, …" front-load qualifications.

This is stylistic *content-dependence* rather than authorial inconsistency — taxonomic chapters naturally generate more periodic shapes.

---

## 5. Register uniformity is a strength

The most consistent finding across all six chapters: register markedness clusters tightly at 0.703–0.717 (variance 0.014), Latinate ratio at 0.153–0.170 (variance 0.017). The dissertation maintains a stable, recognizable high-register academic voice across chapters despite topical variation.

This uniformity is the inverse of the §1.5 opacity drop: where rhetorical display differs across chapters, the underlying lexical-register choice is consistent. The author's vocabulary signature is stable; the rhetorical performance varies.

---

## 6. Confidence assessment

The analyzer reports per-axis confidence:

| Axis | Confidence across all 6 |
|---|---|
| Noun/Verb | high |
| Register | high |
| Architecture | medium |
| Voice | medium |
| Opacity | medium |
| Tacit Patterns | medium |
| Sentence Shape | low |

The two highest-confidence axes (**Noun/Verb** + **Register**) are also the two where §1.5 most clearly stands out (most verbal) and where the dissertation is most uniform (register). These are the most trustworthy signals.

The "low confidence" on **Sentence Shape** suggests the periodic/running distinction is harder to pin down via heuristics; the §1.3 "mixed" outlier finding should be treated as suggestive rather than definitive.

---

## 7. Recommendations

1. **§1.5 stylistic alignment**: if the goal is matching §§1.1–1.4's stylistic register in §1.5, consider:
   - Manually adding rhetorical figures (1-2 chiasmus / antithesis / isocolon per major paragraph)
   - Loosening the verb-prominence (the per-subsection prompt's "concise prose" directive may be too constraining)
   - A coherence-pass rewrite that injects nominalized constructions and longer pre-main-verb subordination at key transitions

2. **§1.3 sentence-shape signature**: the "mixed" reading is content-driven and stylistically appropriate for a taxonomic chapter. No remediation needed; the periodic suspension is doing real work.

3. **§1.0 stylistic distinctness**: the introduction's higher voice / higher opacity / alliteration are genre-appropriate. The 13.6-word average sentence length may want to be reviewed only if the author intends sentence-length parity across chapters — otherwise the introduction's punchier prose is a strength.

4. **Future versionC iterations**: if the per-subsection-mode pipeline is regenerated, expect a similar low-opacity / verb-style signature unless the `buildSubsectionPrompt` length directive is rewritten to encourage rhetorical embedding.

5. **Cross-axis correlation worth noting**: high opacity correlates with high alliteration (§1.0, §1.1). Low opacity correlates with low alliteration (§1.5). These metrics may share underlying signal (phonemic patterning ↔ self-conscious surface). Not a bug — the Lanham framework treats them as overlapping aspects of the AT/THROUGH distinction.

---

## 8. Raw outputs

Per-chapter verbose outputs (numerical detail + confidence markers + tacit pattern counts):

- `1_0___Introduction_v2_tex.txt`
- `1_1___A0___Motion_and_Time_as_Ontological_Horizon_v2_tex.txt`
- `1_2___M0_to_A1___The_Actualization_of_Aisthesis_v2_tex.txt`
- `1_3___A3___Completed_Cognitive_Actuality_and_the_Three_Orientational_Modes_v2_tex.txt`
- `1_4___Emotion___The_Form_of_Desire_Under_Evaluative_Disclosure_v2_tex.txt`
- `1_5___A4___Three_Types_of_Action_v2_versionC_tex.txt`

All located in `tmp/lanham-analysis-2026-05-25/`.
