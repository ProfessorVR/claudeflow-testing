# DISS-01-G05 — Tier A Citation-Fill (Burke pp.280–281 → pp.253, 261–262)

**Gap ID**: DISS-01-G05
**Section**: DISS-01-A0 (§1.1)
**Severity**: HIGH (T7-overreach: misattribution propagating across 3 citation sites)
**Tier**: A_corpus_index
**Inconsistency cross-ref**: INCONS-002 (CRITICAL)

## 1. Claim and anchor

§1.1 contains three citations of "Burke, *Grammar*, pp. 280–281" for priority-of-actuality / entelechy / man-prior-to-boy material. Per `inconsistencies-and-fallacies.json` INCONS-002 and the corpus/index Burke *Grammar* unit GM-06-ACT, the material is NOT at pp. 280–281 but at **pp. 253 and 261–262** within the "Further Remarks on Act and Potency" subsection.

## 2. Locus confirmed in corpus/index

- **Unit**: `corpus/index/A Grammar of Motives (Burke 1945)/Burke - Act (Aristotle and Aquinas)/gm-06-act.json`
- **Narrative**: `gm-06-deep.md` § (vi) "Further remarks on act and potency"
- **Edges anchoring the priority-of-actuality claim**: C34 (pp. 253, 261), C04 (pp. 231, 249, 261–262), C09 (pp. 230–231, 253) — all flagged `exegetical-direct`

See `/home/dalton/projects/claudeflow-testing/corpus/index/Dissertation/_run-history/2026-05-13T1439/_synthesis/burke-correction-evidence.md` for full evidence file with all 3 edit-ready patches.

## 3. Patches (edit-ready)

### Instance 1: §1.1 .md line 5 / .tex line 7 — "one actuality always precedes another in time"

```latex
OLD: (Burke, \textit{Grammar}, pp.~280--281, glossing \textit{Metaphysics} IX.8)
NEW: (Burke, \textit{Grammar}, p.~253, glossing \textit{Metaphysics} IX.8)
```

### Instance 2: §1.1 .md line 5 / .tex line 7 — "man is 'prior' to boy"

```latex
OLD: (Burke, \textit{Grammar}, pp.~280--281)
NEW: (Burke, \textit{Grammar}, pp.~261--262)
```

### Instance 3: §1.1 .md line 31 / .tex line 33 — entelechy "another kind of priority"

```latex
OLD: (Burke, \textit{Grammar}, pp.~280--281)
NEW: (Burke, \textit{Grammar}, pp.~261--262)
```

## 4. Verbatim source from corpus/index

From `gm-06-deep.md` § (vi) lines 61–63:

> Aristotle's actuality-prior-to-potency is then unfolded in two senses: temporally (one actuality always precedes another in time, ultimately back to the eternal prime mover) and in the form-and-substantiality sense (the man is prior to the boy because the man has attained complete form). *Entelechy* — having its end within itself — is treated as a synonym for actuality, and *teleios* — perfect, complete, having attributes of an end — connects the completed man with the infinite God.

## 5. Status

CONFIRMED correction. Phase 3 hypothesis verified against corpus/index `gm-06-act.json` (which shows that pp. 280–281 are in the "Psychology of Action" subsection, topically unrelated) and `gm-06-deep.md` (which places priority-of-actuality content at pp. 252–262).

## 6. PROMPT-template sweep also required

`1.1_A0_Motion_and_Time_PROMPT.md` lines 43, 47, 127, 172 hard-code the wrong pp. 280–281 reference. Phase 5 mechanical sweep needed.
