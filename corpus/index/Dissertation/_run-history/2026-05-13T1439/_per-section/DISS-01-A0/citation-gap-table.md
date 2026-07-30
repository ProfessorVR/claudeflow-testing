# Citation Gap Table — DISS-01-A0 (§1.1 A₀: Motion and Time as Ontological Horizon)

**Run**: 2026-05-13T1439
**Source**: phase2-claims.json
**Total gaps**: 18
**By tier**: T4×4, T5×8, T6×0, T7×1, T8×5
**By effort**: small×9, medium×7, large×2

Sorted by severity (HIGH → MEDIUM → LOW), then by remediation effort (small → large). The four asterisk-six (`\textbf{******}`) placeholders are routed to corpus/index pipelines per `feedback-missing-source-placeholder.md`; the verified Burke / Hawhee / Bekker mismatches are routed for user-confirmed correction.

---

## HIGH SEVERITY

### G05 — Burke pp. 280-281 ↔ corpus-attested pp. 253, 261-262 mismatch
- **Claim**: DISS-01-C016 (line 7)
- **Tier**: T7-overreach
- **Brief**: Burke page-number citation mismatch — the dissertation cites *Grammar* pp. 280-281 for the priority-of-actuality material, but corpus/index Burke pipeline (GM-06 Burke — Act chapter) has the priority-of-actuality discussion anchored at **pp. 253 and 261-262** (entries C34, C04). Page 280-281 in the volume corresponds to the Hegel-Marx reversal in the Agent chapter (per corpus concordance), which is unrelated.
- **Quoted material**: "one actuality always precedes another in time right back to the actuality of the eternal prime move"; "man is 'prior' to boy because man has already attained its complete form whereas boy has not"; "the entelechy 'allowed [Aristotle] to introduce another kind of priority, namely the principle involved in a given form'"
- **Remediation**: CORRECT_PAGE_NUMBERS to pp. 261-262 (the corpus-attested locus) OR user-confirm 280-281 is intentional
- **Effort**: small (5 min)
- **Candidate corpus**: `corpus/index/A Grammar of Motives (Burke 1945)/Burke - Act (Aristotle and Aquinas)/gm-06-deep.{md,json}` (entries C04, C34)

### G08 — Physics IV.14 strong-reading Bekker mismatch
- **Claim**: DISS-01-C141 (line 77)
- **Tier**: T5-under-supported
- **Brief**: The dissertation cites **Phys. IV.14, 223a25-27** for the time-without-soul passage. Per corpus/index Aristotle pipeline, the standard Bekker range is **223a21-26** (corpus Bekker-index line 236; phase2-phys-04 lines 162-165, 217; Bowin 2017 also uses 223a21-26). The dissertation's range is shifted by 4 lines.
- **Remediation**: VERIFY_OR_CORRECT to 223a21-26 (standard) or 223a25-26 (conditional-clause-only)
- **Effort**: small (5 min)
- **Note**: This is the locus for the section's most consequential interpretive move (strong reading of Phys. IV.14). The interpretive flag is present and explicit (lines 77, 87-89) — see "Strong-reading verification" below.

### G14 — Coope and Broadie secondary citations missing for strong-reading defense
- **Claim**: DISS-01-C144 (lines 77, 87-89)
- **Tier**: T8-secondary-needed
- **Brief**: The Deferrals subsection gestures at Coope and Broadie as 'principal interlocutors' for the strong-reading defense. No specific page references provided. Both works are required for gold-standard treatment.
- **Remediation**: ADD_SECONDARY_CITATIONS (Coope, *Time for Aristotle* 2005; Broadie commentary)
- **Effort**: large (30-60 min)
- **Candidate corpus**: `corpus/index/Aristotelian Motion and Time Secondary/Bowin - Perception and Cognition of Time (2017)/amt-01-bowin.md` (Bowin cites Coope/Broadie throughout — extract bibliography entries)

---

## MEDIUM SEVERITY

### G01 — line 25: Bewegtheit verbatim placeholder
- **Claim**: DISS-01-C042
- **Tier**: T5-under-supported
- **Locus named**: *Basic Concepts of Aristotelian Philosophy* (GA 18), p. ******
- **Expected content**: Heidegger's articulation of *kinēsis* as *Seinscharakter* / *Bewegtheit*
- **Remediation**: Query `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-structured/` (12 fingerprint units; primary candidate `u-fp2a`/`u-fp2b` on kinēsis-as-Seinscharakter, secondary `u-fp1a`/`u-fp1b` on Aristotelian categorial framework)
- **Effort**: medium (15-30 min)

### G02 — line 53: In-der-Welt-sein / Bewandtnis verbatim placeholder
- **Claim**: DISS-01-C089
- **Tier**: T5-under-supported
- **Locus named**: SZ §18, H.84 (Involvement and Significance: the Worldhood of the World)
- **Expected content**: Heidegger's articulation of *Bewandtnis* and *Bewandtnisganzheit* grounded in *Worumwillen*
- **Remediation**: Query `corpus/index/Heidegger - Being and Time/bt-structured/` for §18 H.84 unit
- **Effort**: medium (15-30 min)

### G03 — line 67: Innerzeitigkeit verbatim placeholder
- **Claim**: DISS-01-C124
- **Tier**: T5-under-supported
- **Locus named**: SZ §81, H.421-422 (Within-time-ness and the genesis of the ordinary conception of time)
- **Expected content**: Heidegger's engagement with Aristotle's definition of time as number of motion
- **Remediation**: Query `corpus/index/Heidegger - Being and Time/bt-structured/` for §81 H.421-422 unit
- **Effort**: medium (15-30 min)

### G04 — line 79: Zeitlichkeit / three-ecstases verbatim placeholder
- **Claim**: DISS-01-C148
- **Tier**: T5-under-supported
- **Locus named**: SZ §65, H.328-329 (Temporality as the ontological meaning of care)
- **Expected content**: Heidegger's introduction of three ecstases (Gewesenheit, Gegenwart, Zukunft)
- **Remediation**: Query `corpus/index/Heidegger - Being and Time/bt-structured/` for §65 H.328-329 unit
- **Effort**: medium (15-30 min)
- **Note**: Phase 1 metadata originally guessed In-der-Welt-sein verbatim for this line; the actual locus per the footnote is SZ §65 three-ecstases (Zeitlichkeit). G02 covers In-der-Welt-sein (which is line 53, not line 79).

### G06 — Burke pp. 214-215 'conditions of an organism's existence' quote — verify
- **Claim**: DISS-01-C088 (line 51)
- **Tier**: T7-overreach
- **Brief**: Cited at pp. 214-215 (Agent chapter section on Santayana per corpus). Corpus has the conditions-of-organism phrasing on Darwin/Conditions-of-Existence at pp. 152-159 (Scene chapter). Verbatim phrasing 'conditions are likewise contextual, as with the conditions of an organism's existence' has not been confirmed in corpus at pp. 214-215.
- **Remediation**: VERIFY_OR_CORRECT page numbers
- **Effort**: small (5-10 min)

### G07 — Hawhee *Bodily Arts* p. 154 attribution — likely *Rhetorical Vision* (2011) p. 154
- **Claim**: DISS-01-C033 (line 21)
- **Tier**: T7-overreach
- **Brief**: Corpus has the exact verbatim "Energeia means the presence of the thing" indexed at Hawhee 2011 *Rhetorical Vision* p. 154 (`corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Hawhee - Rhetorical Vision (2011)/phx-07-hawhee.{md,json}` line 31, 191). Hawhee *Bodily Arts* (2004) p. 154 may have different formulation.
- **Remediation**: CORRECT_WORK_TITLE to *Rhetorical Vision* (2011)
- **Effort**: small (5-10 min)

### G09 — Met. XI.6, 1063a19-21 motion-as-passage — verify chapter
- **Claim**: DISS-01-C081 (line 41)
- **Tier**: T5-under-supported
- **Brief**: Cited at Met. XI.6, 1063a19-21 (which is within K.6 Protagoras refutation per corpus). The motion-as-passage formulation in the quoted verbatim is more typically at Met XI K.12 (1067b1-1068b25) or the kinēsis-recapitulation at K.9 (1065b5-1066a34). Bekker 1063a19-21 falls in K.6.
- **Remediation**: VERIFY_BEKKER_RANGE_AND_CHAPTER
- **Effort**: medium (15-30 min)

### G10 — Soul/time proportional analogy is interpretive (line 73)
- **Claim**: DISS-01-C129
- **Tier**: T4-interpretive-but-unflagged
- **Brief**: 'Just as motion is the actuality of the potential... so the soul is the actuality of the body's potential' — interpretive four-term proportional bridge; flag as the chapter's synthesis.
- **Remediation**: ADD_INTERPRETIVE_FLAG
- **Effort**: small (5-10 min)

### G11 — Kinēsis ≅ Bewegtheit chapter-level framing flag (line 25)
- **Claim**: DISS-01-C051
- **Tier**: T4-interpretive-but-unflagged
- **Brief**: The dissertation's specific framing of Bewegtheit as proto-form of energeia ateles and as bridge to the iterated chain structure is the user's interpretive synthesis; flag at the framing level.
- **Remediation**: ADD_INTERPRETIVE_FLAG_AT_FRAMING_LEVEL
- **Effort**: small (5-10 min)

### G13 — Hermeneutical circle ≅ proto-form of chain iteration is interpretive (line 41)
- **Claim**: DISS-01-C113
- **Tier**: T4-interpretive-but-unflagged
- **Brief**: 'The chain's iterated structure is the proto-form of the hermeneutical circle Heidegger generalizes' — interpretive directional claim (Aristotelian PRIOR to Heideggerian); flag.
- **Remediation**: ADD_INTERPRETIVE_FLAG
- **Effort**: small (5-10 min)

---

## LOW SEVERITY

### G12 — Dyadic kinēsis ≅ In-der-Welt-sein proto-form (line 53)
- **Claim**: DISS-01-C094
- **Tier**: T4-interpretive-but-unflagged
- **Brief**: Weak flag ('on this reading') should be strengthened.
- **Remediation**: STRENGTHEN_INTERPRETIVE_FLAG
- **Effort**: small (5 min)

### G15 — Heidegger Kant book (GA 3) needs specific locus
- **Claim**: DISS-01-C158 (line 83)
- **Tier**: T8-secondary-needed
- **Brief**: GA 3 named; no specific page.
- **Remediation**: ADD_SPECIFIC_PAGE_LOCUS
- **Effort**: medium (15-30 min)

### G16 — Phys. IV.11, 219a4-8 Bekker — verify
- **Claim**: DISS-01-C098 (line 55)
- **Tier**: T5-under-supported
- **Brief**: 'We perceive movement and time together' verbatim; verify Bekker line. Corpus has 219a14 indexed.
- **Effort**: small (5 min)

### G17 — Phys. IV.11, 219b22-25 body-carried-along Bekker — verify
- **Claim**: DISS-01-C104 (line 65)
- **Tier**: T5-under-supported
- **Brief**: Verify Bekker line for body-carried-along analogy. Corpus has 219b12-15 indexed for now-discussion.
- **Effort**: small (5 min)

### G18 — Hexis/settled-doxai forward-reference to §1.4 (line 89)
- **Claim**: DISS-01-C166
- **Tier**: T8-secondary-needed
- **Brief**: Optional footnote pointing to §1.4 rhetorical-theory development.
- **Effort**: small (5 min)

---

## Citation Gap Split Summary

| Category | Count | Tier-A Corpus | Tier-B Chroma | Tier-C Perplexity |
|----------|------:|--------------:|--------------:|------------------:|
| T4 — interpretive but unflagged | 4 | 4 | — | — |
| T5 — under-supported (4 placeholders + 4 Bekker) | 8 | 6 | 2 | — |
| T7 — overreach (page-number / work-title corrections) | 3 | 3 | — | — |
| T8 — secondary needed | 3 | 1 | — | 2 |
| **TOTAL** | **18** | **14** | **2** | **2** |

## Corpus Routing Summary (primary targets)

1. `corpus/index/Heidegger - Being and Time/bt-structured/` — 3 of 4 ****** placeholders (G02, G03, G04)
2. `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-structured/` — line-25 Bewegtheit (G01)
3. `corpus/index/A Grammar of Motives (Burke 1945)/Burke - Act (Aristotle and Aquinas)/` — Burke pp. 280-281 correction (G05)
4. `corpus/index/Aristotle - Complete Works/aristotle-phys-04.{json,md}` — Bekker corrections (G08, G16, G17) + Met XI verification (G09)
5. `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/Hawhee - Rhetorical Vision (2011)/` — Hawhee work-title correction (G07)
6. `corpus/index/Aristotelian Motion and Time Secondary/Bowin - Perception and Cognition of Time (2017)/` — Coope/Broadie secondary engagement (G14)
