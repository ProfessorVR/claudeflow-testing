# Numbering Audit — Run 2026-05-13T1439

**Phase 3 Wave 1, Agent 3B**
**Output for**: Phase 3 Wave 2 synthesis + user-facing remediation pass.
**Sources**: phase0-preflight.md §3, DISS-DIAG-V7/phase2-node-audit.json, and direct verification of all six source files.

---

## 1. Migration target

**OLD form**: $M_n \rightarrow M_{n+1}$ (motions named by their initial state).
**NEW form**: $M_n \rightarrow A_{n+1}$ (motions named by their *terminus* — the actuality they produce).

**Aristotelian warrant**: *Physics* V.1, 224b7–8 — motion is named by what it issues in (the *enérgeia* that the *kínēsis* effects; motion is the actualization of the potential *as* potential, but the motion as a whole takes its name from the actuality it produces). The chain $A_0 \to A_4$ is therefore properly traversed by motions $M_1 \to A_1$, $M_2 \to A_2$, $M_3 \to A_3$, $M_4 \to A_4$, where each subscript is the *terminus*'s ordinal.

The diagram's `motionDisplayId()` function (HTML line 1522 of `actualization-chain-v7.html`) implements this convention at the SVG arrow labels: `M01 → M₁→A₁`, `M12 → M₂→A₂`, `M23 → M₃→A₃`, `M34 → M₄→A₄`. The migration this audit catalogs aligns the prose and the diagram's developer comments with that same convention.

---

## 2. Per-section summary

| Section | OLD occurrences | NEW occurrences | Status | Total patches |
|---------|-----------------|-----------------|--------|---------------|
| DISS-00-INTRO | 4 (TikZ block only) | 4 (prose) | ⚠️ MIXED (prose-NEW vs TikZ-OLD) | 4 |
| DISS-01-A0 | 2 | 0 | ❌ OLD-ONLY | 2 |
| DISS-02-A1A2 | 2* | 3 | ⚠️ MIXED — substantively-distinct review* | 0–2 (user review) |
| DISS-03-A3 | 5 | 2 | ⚠️ MIXED + self-acknowledged | 5 |
| DISS-04-EMOTION ★ | 4 | 2 | ⚠️ MIXED (gold standard) | 4 |
| DISS-05-A4 | 4 | 0 | ❌ OLD-ONLY | 4 |

| DISS-DIAG-V7 | 9 dev-comments + 1 user-visible inconsistency | runtime-correct | ⚠️ COMMENTS | 9 + 1 |
| **TOTAL** | **30** | **11** | | **28 + 2 user-review** |

\* §1.2's 2 OLD instances both occur in the phrase "downstream of *doxa*'s ratification at $M_2 \rightarrow M_3$" — Phase 2b flagged these as potentially **substantively distinct** from the NEW phantastic-motion $M_2 \rightarrow A_3$. **Surfaced for user review** in §3 below.

**Phase 0 vs Phase 3B reconciliation**:
- Phase 0 reported §1.5 as having 4 OLD occurrences; direct re-verification by `grep` confirms **4** (lines 1, 3, 5, 23 — one OLD-form pattern per line). The task brief's interim claim of "line 5 has 2 OLD" was incorrect on re-inspection: line 5 contains `$M_3 \rightarrow M_4$` once, followed by `$A_0 \rightarrow A_4$` (which is the macro-skeleton chain notation, not an OLD-form motion).
- Phase 0 reported §1.4 as having 3 OLD occurrences; direct re-verification confirms **4** (line 118 contains the chapter-notation declaration `$M_n \rightarrow M_{n+1}$` plus two narrative invocations of `$M_3 \rightarrow M_4$`; line 144 contains the fourth instance). Phase 0 undercounted by one.
- Phase 0 reported §1.0 as `0 OLD / 4 NEW` in the prose body, which is correct — but the section's *embedded TikZ block* (lines 184–200, identical to the reference TikZ source) still uses the OLD form. The TikZ block is in-scope for the migration (matches plan §9.1.2 point 6's reference to a §1.x inline TikZ block), and adds 4 patches.
- Phase 0's prose grand total of 16 OLD is therefore revised to **17 prose OLD** (§1.1=2, §1.2=2, §1.3=5, §1.4=4 [corrected from 3], §1.5=4); plus 4 §1.0 TikZ + 9 diagram dev-comments = **30 OLD total** across the dissertation system.

---

## 3. The substantively-distinct §1.2 question (user-review-required)

### 3.1 The two §1.2 occurrences

Both §1.2 OLD-form instances appear in semantically identical sentences:

| Line | Sentence |
|------|----------|
| 83 | "The higher-order *pathē* arise only downstream of *doxa*'s ratification **at $M_2 \rightarrow M_3$**, where the cognitive apparatus articulates the perceptual basic valence into the determinate evaluative concretions the emotion section develops." |
| 99 | "...the higher-order *pathē* arise only downstream of *doxa*'s ratification **at $M_2 \rightarrow M_3$**, requiring the rational cognitive apparatus and the committal dimension of opinion that this section's animals do not necessarily possess." |

### 3.2 The substantive question

§1.2 establishes the chain through $A_2$ (completed perception with dual residual trace) and forward-points to the *phantastic motion* $M_2 \rightarrow A_3$ (which it uses three times under NEW form: lines 61, 87, 95). The *phantastic motion* is the motion through which the *resonant kinēsis* is taken up by *phantasia* and rendered as the *phantasma* proper. Under the NEW convention, that motion is $M_2 \rightarrow A_3$ (terminating in $A_3$ = *phantasma* proper).

The two OLD-form occurrences at lines 83 and 99, however, are framed around a different operation: ***doxa*'s ratification** of the content. This operation belongs structurally to a *committal dimension* over the cognitive engagement, not to the constitutive phantastic motion. §1.3 develops *doxa* as the **orthogonal** committal dimension that operates over the three orientational modes (intellection, memory, discursive); *doxa* is not itself one of the modes, and §1.3 explicitly distinguishes "*phantasia*'s *taking-as*" (pre-propositional, accomplished by *phantasia* alone, level: $M_2 \rightarrow A_3$) from "*doxa*'s propositional *taking-as-true*" (logos-dependent, ratifying what *phantasia* has presented).

So the §1.2 OLD-form references may be saying one of three things:

**Option (a) — Same motion under different name**: $M_2 \rightarrow M_3$ in §1.2 lines 83/99 is meant to denote *the same motion* as the phantastic $M_2 \rightarrow A_3$, with the OLD numbering simply unmigrated. The "downstream of *doxa*'s ratification" framing is a temporal/structural marker (after *doxa* ratifies, the higher-order *pathē* arise) but the motion-name still refers to $M_2 \rightarrow A_3$.

→ **Patch**: replace both with $M_2 \rightarrow A_3$.

**Option (b) — Two distinct motions**: There is a *phantastic motion* $M_2 \rightarrow A_3$ (phantasma constitutes from resonant kinēsis; *phantasia*'s work) and a structurally distinct *doxastic-ratification motion* somewhere downstream. The diagram's `M23` motion ("Cognitive Engagement") covers both, but the chain's internal articulation has two sub-motions: the phantasma-constituting one (covered by §1.2's NEW-form $M_2 \rightarrow A_3$ at lines 61/87/95) and a doxa-ratifying one (covered by §1.2's OLD-form $M_2 \rightarrow M_3$ at lines 83/99). Under the NEW convention, the doxa-ratifying motion would terminate in a distinct actuality ($A_{3-\text{doxa}}$? $A_{3'}$?).

→ **Patch**: leave §1.2 lines 83/99 unchanged pending a chapter-wide redesign that introduces and names the doxastic actuality as a distinct terminus, or assign it a clarified subscript.

**Option (c) — Shorthand for the doxastic aspect of $M_2 \rightarrow A_3$**: §1.2's prose uses $M_2 \rightarrow M_3$ as a shorthand for "the doxa-ratifying aspect within the broader cognitive engagement," without committing to a distinct motion. Under this reading, the *phantastic* aspect of the cognitive engagement is $M_2 \rightarrow A_3$ (§1.2 lines 61/87/95) and the *doxastic-ratifying* aspect is also part of $M_2 \rightarrow A_3$, with the OLD-form notation at lines 83/99 simply not yet revised to the NEW convention.

→ **Patch**: replace both with $M_2 \rightarrow A_3$ and treat the local "downstream of *doxa*'s ratification" prose as a temporal qualifier within the same motion.

### 3.3 Recommended remediation

**Tag both §1.2 patches with `user-review-required`** and surface to the user for a one-paragraph clarifying decision before mechanically replacing. The pipeline's recommended position (most consonant with §1.3's later orthogonal-committal-dimension framing) is **Option (c)**: the OLD-form occurrences refer to the same single $M_2 \rightarrow A_3$ motion under its doxastic aspect, and should be migrated to $M_2 \rightarrow A_3$. But Option (a) and (c) are observationally equivalent (same patch); Option (b) requires a chapter-wide architectural decision.

The patch list in §4 below therefore includes the §1.2 entries with `flag: user-review-required` and a `recommended_replacement: $M_2 \rightarrow A_3$` field.

---

## 4. Per-file patch list (Edit-ready)

### 4.1 DISS-00-INTRO — `1.0 - Introduction/1.0 - Introduction.md` (4 patches; TikZ block only)

Prose body uses NEW form correctly (lines 62, 68: $M_2 \rightarrow A_3$, $M_3 \rightarrow A_4$). Only the embedded TikZ block at lines 184–200 carries OLD-form labels.

| # | Line | OLD | NEW | Context |
|---|------|-----|-----|---------|
| 1 | 186 | `$M_0 \!\to\! M_1$: Perceptual Motion` | `$M_1 \!\to\! A_1$: Perceptual Motion` | TikZ `\node[motionnode] (M01)` — perceptual motion arrow label |
| 2 | 190 | `$M_1 \!\to\! M_2$: Phantastic Motion` | `$M_2 \!\to\! A_2$: Phantastic Motion` | TikZ `\node[motionnode] (M12)` — phantastic motion arrow label |
| 3 | 194 | `$M_2 \!\to\! M_3$: Cognitive Engagement` | `$M_3 \!\to\! A_3$: Cognitive Engagement` | TikZ `\node[motionnode] (M23)` — cognitive engagement arrow label |
| 4 | 198 | `$M_3 \!\to\! M_4$: \textit{Orektikon} Motion` | `$M_4 \!\to\! A_4$: \textit{Orektikon} Motion` | TikZ `\node[motionnode] (M34)` — orektikon motion arrow label |

**Note on motion-subscript renumbering**: this is **NOT** a simple `M_n / M_{n+1} → M_n / A_{n+1}` substitution. The OLD form for the perceptual motion was $M_0 \!\to\! M_1$ (from-state $M_0$ ≡ "before perception"; to-state $M_1$ ≡ "completed perception" = $A_1$). The NEW form names the motion by its *terminus* alone, so $M_0$ becomes $M_1 \to A_1$: the motion is the *first* motion, terminating in $A_1$. Per the diagram convention at HTML 1522, **the motion subscript matches the terminus subscript**: $M_1 \to A_1$, $M_2 \to A_2$, $M_3 \to A_3$, $M_4 \to A_4$.

### 4.2 DISS-01-A0 — `1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex` (2 patches)

| # | Line | OLD | NEW | Context |
|---|------|-----|-----|---------|
| 1 | 51 | `$M_3 \rightarrow M_4$` | `$M_4 \rightarrow A_4$` | "...the realizable good moves at $M_3 \rightarrow M_4$ is *orexis*, the moved mover..." |
| 2 | 89 | `$M_2 \rightarrow M_3$` | `$M_3 \rightarrow A_3$` | "...the orientational modes at $M_2 \rightarrow M_3$. Third, the entelechial..." |

**Section-level note**: §1.1 line 5 declares the OLD convention as the chapter's notation standard: "$A_n$ names actualization stages (nodes), and $M_n \rightarrow M_{n+1}$ names the transitions between them." This **chapter-level declaration must also be revised** as part of the §1.1 migration. The replacement should harmonize with the NEW convention. **Surface to user**: should line 5's declaration become `$A_n$ names actualization stages (nodes), and $M_n \rightarrow A_n$ names the transitions terminating in them (per *Physics* V.1, 224b7–8)`?

Additional patch entry (declaration-level):

| # | Line | OLD | NEW (recommended) | Context |
|---|------|-----|-------------------|---------|
| 3 | 5 | `$M_n \rightarrow M_{n+1}$ names the transitions between them` | `$M_n \rightarrow A_n$ names the transitions terminating in them (per *Physics* V.1, 224b7–8)` | Chapter notation declaration |

(Counted as 3 patches with line 5 being a notation-standard declaration.)

### 4.3 DISS-02-A1A2 — `1.2 - A1-A2 - Aisthesis/1.2_A1-A2_Aisthesis_OUTPUT_v1.tex` (0–2 patches, USER REVIEW)

| # | Line | OLD | Recommended NEW | Flag | Context |
|---|------|-----|-----------------|------|---------|
| 1 | 83 | `$M_2 \rightarrow M_3$` | `$M_2 \rightarrow A_3$` | `user-review-required` | "...downstream of *doxa*'s ratification at $M_2 \rightarrow M_3$, where the cognitive apparatus articulates..." |
| 2 | 99 | `$M_2 \rightarrow M_3$` | `$M_2 \rightarrow A_3$` | `user-review-required` | "...downstream of *doxa*'s ratification at $M_2 \rightarrow M_3$, requiring the rational cognitive apparatus..." |

Both contingent on §3 above. NEW-form occurrences at lines 61, 87, 95 (the *phantastic motion* sense) are correct as-is.

### 4.4 DISS-03-A3 — `1.3 - A3 - Orentational Modes/1.3 A3 - Orientational Modes.md` (5 patches)

| # | Line | OLD | NEW | Context |
|---|------|-----|-----|---------|
| 1 | 59 | `$M_3 \to M_4$` | `$M_4 \to A_4$` | "...no *orektikon* motion is initiated at $M_3 \to M_4$ on its basis. Practical deliberation..." |
| 2 | 65 | `$M_2 \rightarrow M_3$` | `$M_3 \rightarrow A_3$` | "...common structural role within $M_2 \rightarrow M_3$: in each mode, the unmoved originator is $A_2$..." |
| 3 | 67 | `$M_2 \to M_3$` | `$M_3 \to A_3$` | "...completed cognitive actualities that $M_2 \to M_3$ \hl{(double check numbering)} produces..." |
| 4 | 114 | `$M_2 \rightarrow M_3$` | `$M_3 \rightarrow A_3$` | "...structure of taking-as that governs $M_2 \rightarrow M_3$ as a whole. *Phantasia*'s *taking-as*..." |
| 5 | 117 | `$M_3 \rightarrow M_4$` | `$M_4 \rightarrow A_4$` | "...unmoved originator of the subsequent motion at $M_3 \rightarrow M_4$, and the condition..." |

**Self-acknowledged**: line 67 contains `\hl{(double check numbering)}` — user is already aware that this passage's numbering needs verification. The user's instinct is correct: $M_2 \to M_3$ at line 67 is the OLD form and should be $M_3 \to A_3$. The `\hl{(double check numbering)}` marker should be **removed** along with the migration. **Recommended**: after the regex substitution at line 67, also strip the `\hl{(double check numbering)}` annotation.

### 4.5 DISS-04-EMOTION ★ — `1.4 - Emotion is Motion/1.4 - Emotion is Motion.md` (4 patches)

Direct `grep` verification: **4 OLD-form patterns** total, with **line 118 containing 3 patterns** (1 notation declaration + 2 narrative invocations) and line 144 containing the fourth.

| # | Line | OLD | NEW | Context |
|---|------|-----|-----|---------|
| 1 | 118 (notation declaration) | `$M_n \rightarrow M_{n+1}$` | `$M_n \rightarrow A_n$` | "...transitions $M_n \rightarrow M_{n+1}$ for the moments between nodes..." |
| 2 | 118 (first narrative) | `$M_3 \rightarrow M_4$` | `$M_4 \rightarrow A_4$` | "...with $M_3 \rightarrow M_4$ designating the conversion that emotion *is*." |
| 3 | 118 (second narrative) | `$M_3 \rightarrow M_4$` | `$M_4 \rightarrow A_4$` | "What the chain requires at $M_3 \rightarrow M_4$, under evaluatively complex conditions..." |
| 4 | 144 | `$M_3 \rightarrow M_4$` | `$M_4 \rightarrow A_4$` | "§1.8's analysis of the chain at $M_3 \rightarrow M_4$ specified the mechanism..." |

NEW-form instances at lines 114 (`$M_3 \rightarrow A_4$`) and 124 (`$M_3 \rightarrow A_4$`) are correct as-is and require no patch.

**Gold-standard caveat**: §1.4 is the dissertation's gold-standard section. The fact that it is itself mixed (both OLD and NEW forms within the same section) suggests the user was **actively migrating during writing** — the chapter-notation declaration at line 118 is the OLD form, the chapter then narrates in mixed form, and lines 114/124 use the NEW form. The user has not yet retroactively revised the line-118 declaration; this audit recommends doing so.

### 4.6 DISS-05-A4 — `1.5 - A4 - Completed Action/1.5 - A4 - Completed Action.md` (4 patches)

Direct `grep` verification: **4 OLD-form patterns** total. The task brief's interim claim of "line 5 has 2 OLD" was incorrect — line 5 contains `$M_3 \rightarrow M_4$` once (at "moments within…") and then `$A_0 \rightarrow A_4$`, which is the *macro-skeleton chain notation* spanning the entire chain and is **not an OLD-form motion to migrate**.

| # | Line | OLD | NEW | Context |
|---|------|-----|-----|---------|
| 1 | 1 | `$M_3 \rightarrow M_4$` | `$M_4 \rightarrow A_4$` | Subsection title: "\subsection{$M_3 \rightarrow M_4$ and $A_4$: The Three Types of Action}" |
| 2 | 3 | `$M_3 \rightarrow M_4$` | `$M_4 \rightarrow A_4$` | "...reached through the *orektikon* transition $M_3 \rightarrow M_4$ in which desire..." |
| 3 | 5 | `$M_3 \rightarrow M_4$` | `$M_4 \rightarrow A_4$` | "...functionally distinguishable moments within $M_3 \rightarrow M_4$, not separate macro-nodes..." |
| 4 | 23 | `$M_3 \rightarrow M_4$` | `$M_4 \rightarrow A_4$` | "...somatic preparation internal to $M_3 \rightarrow M_4$ taking the specific form..." |

Note: line 5's $A_0 \rightarrow A_4$ (chain macro-skeleton) and line 1's $A_4$ (in the subsection title) are correctly named under the NEW convention and are **not** patches.

---

## 5. Diagram patches (HTML developer comments + 1 user-facing inconsistency)

See companion `_synthesis/diagram-renumbering-patch.md` for full HTML patch details. Summary here:

### 5.1 Developer-comment OLD-form references (9 patches; not user-visible)

| # | HTML Line | OLD string | NEW string |
|---|-----------|------------|------------|
| 1 | 734 | `M3→M4 INPUT PATHS (three styles)` | `M4→A4 INPUT PATHS (three styles)` |
| 2 | 825 | `Connector arcs up to M2→M3.` | `Connector arcs up to M3→A3.` |
| 3 | 1185 | `Settled doxai as hexeis — additional unmoved originator at M2→M3` | `Settled doxai as hexeis — additional unmoved originator at M3→A3` |
| 4 | 1997 | `(M23 → a3Nodes) and via the three M3→M4 input paths.` | `(M23 → a3Nodes) and via the three M4→A4 input paths.` |
| 5 | 2114 | `Width is sized to fit before the leftmost M2→M3` | `Width is sized to fit before the leftmost M3→A3` |
| 6 | 2425 | `SETTLED DOXAI — sits below kinetic-M23 box, feeds into M2→M3` | `SETTLED DOXAI — sits below kinetic-M23 box, feeds into M3→A3` |
| 7 | 2498 | `THREE PATHS INTO M3→M4 (distinct visual styles)` | `THREE PATHS INTO M4→A4 (distinct visual styles)` |
| 8 | 2577 | `PURE-APPETITIVE BYPASS (A2 east → right column → over the top of T-box → M3→M4 north face)` | `PURE-APPETITIVE BYPASS (A2 east → right column → over the top of T-box → M4→A4 north face)` |
| 9 | 2584 | `well above M34/T-box AND above all three M3→M4 path labels` | `well above M34/T-box AND above all three M4→A4 path labels` |

### 5.2 User-facing inconsistency (1 patch; same paragraph mixes both conventions)

| # | HTML Line | Context | Form |
|---|-----------|---------|------|
| 10 | 1185 (comment) vs 1193 (tooltip) | Line 1185 dev-comment uses OLD `M2→M3`; line 1193 user-visible tooltip uses NEW `M₃→A₃`. Patch #3 above resolves the comment side; line 1193 is correct and **should not be changed**. |

After all 9 patches, the diagram's developer comments and the user-visible tooltip will both use the NEW convention. The SVG arrow labels at runtime already use NEW (via `motionDisplayId()` at line 1522) and require no patch.

---

## 6. Cross-reference with prose: orphan node/motion references

From the diagram audit's `orphan_analysis` section, the following orphans require user-decided fate (not mechanical patches):

### 6.1 Orphan prose-references (4 distinct patterns)

1. **§1.3 offset-numbering misalignment**: §1.3 prose uses $A_3$ to refer to what the diagram calls $A_2$ (phantasma proper). This is a **chapter-wide numbering offset**, not a per-occurrence patch. Resolution requires user decision: either (a) renumber §1.3 throughout to match diagram (every $A_3$ → $A_2$, every $A_4$ → $A_3$, etc.), or (b) renumber the diagram to match §1.3, or (c) accept the divergence as deliberate (e.g., §1.3 internally uses a finer-grained chain numbering than the diagram's coarse $A_0..A_4$).
2. **§1.3 off-by-one motion-form** (lines 65, 67): same offset issue applied to motions. Patched mechanically in §4.4 above under the assumption that the diagram convention is canonical; should be re-verified with the user under the §6.1.1 decision.
3. **§1.5 line-1 subsection title**: "$M_3 \rightarrow M_4$ and $A_4$" — the diagram convention would make this "$M_4 \rightarrow A_4$ and $A_4$". Patched mechanically in §4.6 above.
4. **§1.1 line-5 chapter-notation declaration**: declares OLD form as the chapter standard. Patched at the declaration level in §4.2.

### 6.2 Orphan diagram-elements (6 elements never referenced by HTML sub-node ID in prose)

These are **not** numbering issues but are coverage gaps requiring no migration patch:

1. **A3-NOESIS** (HTML line 946) — concept "noesis"/"intellection" discussed in §1.3 lines 39, 65, but never by sub-node ID.
2. **A3-MEMORY** (HTML line 985) — concept discussed in §1.3 line 47, but never by sub-node ID.
3. **A3-DISCURSIVE / A3-SPECULATIVE / A3-DELIBERATIVE** (HTML lines 1026, 1057, 1094) — concepts discussed in §1.3 lines 59, 67, 112, but never by sub-node ID.
4. **DOXA band** (HTML line 1138) — discussed in §1.3 lines 100, 112, 117, 119, and §1.4, but the orthogonal-band visual element is not named as such.
5. **SETTLED-DOXAI** (HTML line 1186) — discussed in §1.4 lines 17, 106, 174 and §1.5, but not as a diagram node. Diagram region flagged under-developed.
6. **EMO** (Emotion-Desire Composite, HTML line 1452) — concept central to §1.4 thesis, but the satellite EMO node and feedback-path are not referenced as diagrammatic elements.

These are tracked here for downstream Phase 3D (inconsistency/fallacy detection) and Phase 3E (relocations); they require Phase 3 user judgment, not Phase 3B mechanical patches.

---

## 7. Self-acknowledged numbering issues

| Section | Line | Marker | Status |
|---------|------|--------|--------|
| DISS-03-A3 | 67 | `\hl{(double check numbering)}` | User already aware. Patch #3 in §4.4 fixes the motion form. Recommend also stripping the `\hl{}` annotation as part of the same patch. |
| DISS-04-EMOTION ★ | 118 | Notation declaration uses OLD form within an otherwise NEW-leaning chapter | The user's gold-standard section is itself mixed. Patch in §4.5 revises the declaration. |
| DISS-01-A0 | 5 | Notation declaration explicitly mandates OLD as the chapter standard | Patch in §4.2 (entry #3) revises the declaration to align with the NEW chain-wide convention. |

---

## 8. Summary by patch class

| Patch class | Count | Files affected |
|-------------|-------|----------------|
| Mechanical prose migration | 15 | §1.1 (2 motion patches), §1.3 (5), §1.4 (3 narrative + 1 declaration), §1.5 (4) |
| Notation-declaration revision | 2 | §1.1 line 5, §1.4 line 118 first pattern |
| §1.0 embedded TikZ block | 4 | §1.0 lines 186, 190, 194, 198 |
| Diagram developer comments | 9 | HTML lines 734, 825, 1185, 1997, 2114, 2425, 2498, 2577, 2584 |
| User-review-required (§1.2) | 2 | §1.2 lines 83, 99 |
| `\hl{}` annotation removal | 1 | §1.3 line 67 (paired with patch #3 of §4.4) |
| **Total** | **30 mechanical + 2 user-review-required + 1 annotation cleanup = 33** | **6 files (5 prose + 1 HTML)** |

(The notation-declaration revisions in §1.1 line 5 and §1.4 line 118 first pattern are counted within the "Mechanical prose migration" tally — they appear as patch entries in §4.2 and §4.5 respectively.)

---

## 9. Estimated remediation effort

- **Mechanical regex pass** (entries marked clean): **~15 minutes** across all 6 files. Recommend a single scripted substitution after user confirmation, with one regex per pattern.
- **User-review-required entries** (§1.2): **~10 minutes of user reading** to confirm Option (a), (b), or (c) above before the §1.2 substitutions land.
- **Declaration-level revisions** (§1.1 line 5, §1.4 line 118 first occurrence): **~5 minutes of user reading** to confirm the recommended phrasing.
- **Total**: **~30 minutes** if user accepts the recommendations; **~60 minutes** if substantive re-reading of §1.2 is needed.

---

**End of numbering audit.**
