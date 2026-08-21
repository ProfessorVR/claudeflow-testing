# PACK — Part III Laboratory Boredom, module L1 (The Three Literatures) — v2, 2026-08-06

**v2 supersedes v1. Same 25 quotations, same texts byte-identical, eight loci resolved from archon page
indexes to PRINTED pages read from running heads — and one quotation BARRED. See the v1 to v2 delta at the
foot of this file. Substitution bank is now `lab-boredom-L1-pack-v2-quotes.json`.**

**FCDP Stage P artifact. Field order is load-bearing: HEAD → MIDDLE → TAIL.**
Companion: `lab-boredom-L1-pack-v2-quotes.json` (the substitution bank).

**Gate G-P status:** every field present; every P4b quotation verified `match_kind == exact` **in this session**
against `archon-cli-v3` at HEAD `75d8c210`; every P5 item graded; JSON parses; P4a and P4b keys match.

---

# HEAD — critical constraints

## P1 TASK

Draft **L1, The Three Literatures**, of the Laboratory Boredom section of Part III.

- **Spec:** `tmp/Dissertation/Part_III/PART-III-LAB-BOREDOM-SECTION-OUTLINE-v7-2026-08-06.md` §L1. **v7 is
  standalone and supersedes v5 and v6. Do not open v1–v6.**
- **Length:** 12 ¶¶ at first draft, **4–5 pp** (D-14). Compression map if it runs long: load-bearing ¶1, ¶8, ¶9,
  ¶10, ¶11; foldable ¶2→¶3, ¶7→¶5, ¶4 to two sentences, ¶12 to a footnote — landing at about eight ¶¶.
- **Register:** scientific-direct, the Part III desktop register. Concrete device and instrument names. MLA.
  *Rhetorica* only inside Aristotle parentheticals (not relevant to L1).
- **Insertion point:** after L0, before L2. L1 supplies the warrant — bibliographic (¶9) and definitional (¶10) —
  that the rest of the section spends.
- **LaTeX:** `` `` … '' `` for quotes, zero Unicode quote marks. No `\textbf{}` run-in heads. No module labels in
  rendered text.
- **Batch protocol:** 1–3 ¶¶ per batch, approval gate on each batch, **bare ¶-numbers when presenting**.

## P2 STYLE TARGET

Part III desktop scientific-direct register. Per-movement numeric targets are set in D1; the band is the
MA-applications fingerprint with the register's plainer diction:

| metric | target | band |
|---|---|---|
| avg sentence length | 33.7 | ±3.5 |
| short(<15) / long(>30) share | 0.23 / 0.45 | ±0.06 / ±0.08 |
| nominalizationDensity | 5.0 | ±1.5 /100w |
| beVerbRatio | 0.15 | ±0.05 |
| periodicRunningRatio | 0.44 | ±0.12 |
| preMainVerbClauseCount | 0.21 | ±0.10 |
| voiceScore / dynamicRange | 0.41 / 0.74 | ±0.12 each |
| latinateGermanicRatio | ≤0.14 | ceiling |
| opacityScore | 0.76 | ±0.10 |
| categorical labels | exact match | — |

Runner: `python3 scripts/strip-latex-for-lanham.py <draft> <plain.txt>` → `npx tsx tmp/analyze-style-lanham.ts <plain.txt>`.

## P3 TERMINOLOGY AND STYLE LOCKS

Copied in, not referenced.

- **American spelling throughout** — "center," never "centre." The whole `-our` / `-ise` / `artefact` family.
  *analysis / analyses* are already American; "analyzes" would be the error.
- *hexis* ≠ habit ≠ *doxa*. "emotion," not *pathē*, for Rhetorica emotions. Greek faculty-names italic.
- Bare "incorporation" = Calleja only; ours is **always** "rhetorical incorporation."
- Retired stem: "phantasmatic" → "phantasmic."
- The union's poles are named **world-disclosedness / co-disclosedness** — and the word "pole" itself is banned
  in rendered prose. **DA-12's own vocabulary uses "poles"; do not carry that word across into the draft.**
- Ungendered prose throughout. Participants are `S01`–`S08` and `R2-01`–`R2-04`, never named, never described in
  a way that could identify them.
- **Own publications (King & Salvo) in the FIRST PERSON.**
- No explicit back-references. No "supplies the canonical anchor." Coined-compound restraint.
- Missing source → `******`; marathon form `****** UNVERIFIED:`.
- **"demonstrated," never "prove."**

## P8 NEGATIVE CONSTRAINTS — greppable

Banned outright:

- sentence-initial **"And"**
- **"the record"** as a name for evidence (say "the survey data," "the corpus," "the published papers")
- **"pole" / "poles"** in rendered prose
- **"ladder," "stall," "stalled"** as figures — the chain **NO-STALL** doctrine means the chain always runs
- **cost / price / spend** metaphors
- vague paragraph openers and closers ("It is important to note," "In this section we will," "Overall,")
- metatextual signposting; self-referential gap-framing ("this section enters the gap")
- gambling vocabulary ("wager," "stakes")
- bold run-in heads
- **"stillness"** or any claim that the boring film produced stillness rather than restlessness (see P6)

## P9 USAGE STATEMENT

The model contributes phrasing, structure, and analysis of pack-supplied evidence. It may not introduce claims
beyond this evidence bank, may not invent or recall citations or page numbers, and every quotation enters by
`«Qnn»` ID substitution only. Anything quote-like outside the bank becomes a paraphrase without quotation marks,
or `****** UNVERIFIED:`. This statement is also the source text for the dissertation's LLM-disclosure statement.

---

# MIDDLE — working material

## P4a QUOTE INDEX

Reason over this. Full texts are in the TAIL and in the JSON; the draft emits `«Qnn»` and never the words.

| ID | source | locus | content and intended use |
|---|---|---|---|
| **Q01** | Eastwood et al. (2012) | **printed p. 482 — ABSTRACT PAGE** | the definition of boredom. **BARRED: abstract-only occurrence, excluded by the no-abstract-quotations lock. UNUSED in L1** |
| **Q02** | Eastwood et al. (2012) | **printed p. 484 (body)** | **condition (c)** — environmental attribution. The DA-12 pole. ¶10, rendered beside Q03. Also occurs at 482 in the abstract; cite **484** |
| **Q03** | FCM | **printed p. 109** | "nothing at all to be found" — defeats (c) **on its own terms**. ¶10 |
| **Q04** | FCM | **printed p. 128** | "arises from out of Dasein itself" — the ontological counter. ¶10 |
| **Q05** | King & Salvo P1 (2023) | **unpaginated (ASEE)** | the adopted definition. ¶8. **First person** for our own paper — but the sentence is **Fahlman's**, verified exact in the MSBS 2013 document, so the prose names Fahlman |
| **Q06** | King & Salvo P1 (2023) | pp. 2–3 | the stimulus rationale. L2.3 mainly; ¶8 may reference |
| **Q07** | Elpidorou & Freeman | vol. pp. 207–208 | "cannot be seamlessly assimilated." ¶2 |
| **Q08** | Elpidorou & Freeman | ch. pp. 1–3 | E&F **prohibiting the move this section must avoid**. ¶2 or ¶10 |
| **Q09** | Elpidorou & Freeman | ch. pp. 10–11 | the psychological construct, "short-lived, flexible." ¶2 |
| **Q10** | Elpidorou & Freeman | vol. pp. 218–219 | "does not shake us up." ¶2 |
| **Q11** | Elpidorou & Freeman | ch. pp. 1–3 | their stated aim. ¶2. **Entry gave a paraphrase in quote marks** |
| **Q12** | Slaby (2010) | **printed p. 101** | "the other side of cognition." ¶2 |
| **Q13** | Slaby (2010) | RE-PIN | attunement/understanding. **Inner quote marks load-bearing; Slaby's, cited to *Being and Time*** |
| **Q14** | Slaby, qtd. Pessoa | RE-PIN | "to be no more, have no more, want no more." ¶2 |
| **Q15** | FCM 156, qtd. E&F | 3 resolutions | first form rooted in the third. **Choose FCM or E&F deliberately** |
| **Q16** | Yuvaraj et al. (2025) | **printed p. 11** | "internally directed attention or mindwandering." ¶5 |
| **Q17** | Yakobi et al. (2021) | **printed p. 10** | misses rather than false-alarms. ¶7 |
| **Q18** | VanderWerf et al. (2003) | **printed p. 2786** | blink duration. **Recommend reporting, not quoting** |
| **Q19** | VanderWerf et al. (2003) | **printed p. 2785** | blinks sampled to avoid attention to the setting. ¶6 |
| **Q20** | Elpidorou (2018) | **printed p. 330** | "unstuck when we find ourselves stuck." ¶12. **Elpidorou citing Fahlman** |
| **Q21** | Csikszentmihalyi, qtd. Nacke | pp. 1–2 | flow as holistic sensation. ¶7 |
| **Q22** | FCM | **printed p. 65** | attunement ought not be ascertained. **Displayed; 0b** |
| **Q23** | FCM | **printed p. 65** | "all making conscious means destroying." Paired with Q22 |
| **Q24** | FCM | **printed p. 87** | "holds us in limbo and yet leaves us empty." **Inherited from desktop M4.1** |
| **Q25** | qtd. in Perone et al. | pp. 4–5 | a boredom-scale item. ¶7, optional |

### ★ Locus warning that governs every FCM citation

**The FCM scan is a two-page spread (813 × 612 pts), so archon's page index is not the printed page.** Every
`pp.NNN–NNN` in this project's older FCM records is a **PDF-page range**. The printed pages above were read from
the running head this session, per the standing rule. Q24 (p. 87) and Q04 (p. 128) agree with desktop M4.1; **Q03
does not — the running head says 109 where desktop M4.1 ¶6 cites 110.** Flag it; do not silently diverge.

## P5 EVIDENCE BANK — graded

Only graded evidence may be asserted. `AUTHOR-CONFIRMED` flatly; `CONFIRMED` with its measure; `[UNCERTAIN]`
hedged or omitted.

| # | evidence | grade |
|---|---|---|
| E01 | Two literatures under one word for twenty-four years; the only connection is one author citing himself across his own two programs, plus a single critical footnote | CONFIRMED |
| E02 | Route 1 — 22 units treat profound boredom, 19 carry a hard instrument, **intersection empty** | CONFIRMED — **RE-PIN against the regenerated synthesis layer** |
| E03 | Route 2 — 21 carry an FCM bridge edge, 19 a hard-instrument edge, **intersection empty**; the ID ranges barely touch | CONFIRMED — **RE-PIN** |
| E04 | The concordance's hole: the three forms are reachable by self-report and nothing else; the most important populated cell is a negative | CONFIRMED |
| E05 | Kim — no significant correlation between questionnaire scores and any physiological feature, at thirteen analyzed participants | CONFIRMED (A-06) |
| E06 | Barry — alpha indexes global arousal rather than topography, **and eyes-closed / eyes-open are non-equivalent baselines** | CONFIRMED (A-07) |
| E07 | Yuvaraj — no resting baseline of any kind; both conditions are active, eyes-open video-viewing | CONFIRMED (A-08) |
| E08 | Scharinger is **2015, not 2019**, and is not a boredom source | CONFIRMED (A-03) |
| E09 | Scharinger — pupil dilation and EEG alpha both registered the load manipulation and **did not correlate with each other** (r = −.16, −.14, ns); alpha alone tracked comprehension | CONFIRMED (A-04) |
| E10 | Thomson contains **zero** occurrences of "bored," "boredom," "Langeweile" | CONFIRMED (A-02) |
| E11 | Mansikka's second form maps onto engaged-but-inauthentic learning — invisible to behavioral-engagement metrics **because engagement and hollow boredom are compatible rather than opposed** | CONFIRMED (A-09) |
| E12 | Miyauchi carries no multi-word source quotations at all | CONFIRMED (A-10) |
| E13 | VanderWerf — blink duration and amplitude vary systematically with vertical gaze position; any blink corpus during stimulus presentation is an unknown mixture of elicitation classes | CONFIRMED |
| E14 | `VR-PHEN` — the three VR-phenomenology sources are cited at refs [13–15] as **one undifferentiated gesture; invoked but inert**, no proposition applied, quoted, engaged or contested | CONFIRMED (machine record) |
| E15 | `PROG-LINEAGE` — the program read as a body of work: **extension rather than resolution**, on a warrant identical across five years; published position is that viability is settled and learner experience favorable **while what the immersion does to attention and engagement remains open in its own record** | CONFIRMED (machine record) |
| E16 | P1 sits deliberately **outside** the lineage set, because it is quoted rather than characterized | CONFIRMED |
| E17 | **DA-12 division of labor:** DA-04 carries the measurement half of the argument, DA-12 the definitional half — the exclusion operates **before** self-report's validity is in question | CONFIRMED (debate map) |
| E18 | The section's costs, stated: eleven Hadjioannou chapters get a footnote at most; ~35 of 55 units appear as citations without discussion | AUTHOR-CONFIRMED |
| E19 | `bor-sec-11` is dropped — Spanish-language, the only non-English source of the eighteen; ¶3 rests on Quaranta alone; **no works-cited entry needed** | AUTHOR-CONFIRMED |
| E20 | Mugon is joined to the existing DA-01 regulatory-account group rather than seeding a new axis | CONFIRMED |

## P6 CONCEPTUAL SEMANTICS — locked formulations

**The three forms.** Inherited from desktop M4.1 ¶¶4–7 in rendered prose. **L1 never re-derives them.** First
form: bored *by* a nameable culprit, the fight visible, one channel suffices. Second form: bored *with*, no
culprit, an occupied surface over a hollow depth, requiring two channels that can disagree. Third form:
impersonal, "boring for one," passing the time powerless.

**Channel.** Any independent way an experience shows itself in evidence — what a person says, what behavior
shows, what an instrument reads.

**The definitional substitution — the section's spine.** The published studies had a frame, named it, and built
on it. Eastwood's condition (c) makes environmental attribution constitutive. The second form denies it twice:
Q03 defeats it *on the instrument's own terms* (nothing to attribute to), Q04 supplies the *ontological counter*
(it arises from Dasein). **Consequence: the studies could only ever have detected the first form, so the keystone
is a demonstration rather than a measurement.**

**Machine anchors — cite, do not re-derive:** `ten-eastwood-unengaged-2012-01` (condition (c) ↔ 085) ·
`ten-eastwood-unengaged-2012-02` (condition (c) ↔ 077) · `ten-fahlman-msbs-2013-01` ·
`ten-king-salvo-physio-2023-04` · `cl-heidegger-fcm-1929-007`.

**Category caution (0b).** No measurement evidences profound boredom and none is claimed to. This is a
requirement of the frame, not modesty — Q22 and Q23 say so in Heidegger's own words. What the instruments show
are episodic structures resembling parts of its anatomy, **named as resemblances every time.**

**Head movement (0d).** Present in the data, **not instrumented in this pass** — gaze is eye-in-head, and Round 1
participants were instructed not to move. **Never write that the boring film produced stillness rather than
restlessness.** Permitted form: *the eye channels show withdrawal, and the search behavior visible in the session
video was not instrumented in this pass.*

**Potentiality (0c).** The situation narrows the field of potentialities rather than furnishing a single act.
Sleep is an actualized potentiality, not an absence.

**Doctrine locks.** Chain-node walkthrough is the analytical form · **NO-STALL**, the chain always runs ·
**GREATEST-DESIRE**, never "a better route" · "demonstrated," never "prove" · potentiality always actualized
within a narrowed field.

## P7 FOUNDATION TEXT

**There is none. L1 is new prose.** No paragraph of this module exists in any prior draft, so the D1 foundation
disposition table is empty by construction and G-E's RETAIN/CORRECT/OMIT battery has nothing to check against.

What L1 inherits rather than builds on is listed in outline v7 §A, and is **never re-derived**: the three forms
(desktop M4.1 ¶¶4–7), the *channel* term, the chain A₀→A₄, rhetorical incorporation, world-/co-disclosedness,
veri(dis)similitude, the two-channel rule (M2.3), and the layer assignment.

---

# TAIL — bulk reference

## P4b QUOTATION BANK

**Full character-exact texts live in `lab-boredom-L1-pack-v2-quotes.json`,** which is the file
`scripts/substitute-quote-ids.py` consumes. Every entry carries `text`, `cite`, `source`, `locus`, `verdict`, and
where applicable `clause_id`, `claim_anchor`, and `caveat`.

**Substitution is mechanical and non-negotiable:**

```
python3 scripts/substitute-quote-ids.py <draft.tex> plans/packs/lab-boredom-L1-pack-v2-quotes.json <out.tex>
```

Non-zero exit on an unknown ID is an automatic **G-B fail**.

### Caveats that must surface at quote-selection time

| ID | caveat |
|---|---|
| **Q03** | Required `--doc`; unrestricted search returns only Slaby. Printed p. **109** by running head against desktop M4.1's **110** |
| **Q11** | The index entry gave a **paraphrase inside quotation marks**; this is the verbatim span |
| **Q13** | Slaby's **inner quotation marks are load-bearing** and must nest in LaTeX. Slaby's sentence, cited to *Being and Time* — **not** an FCM gloss |
| **Q14** | Slaby quoting **Pessoa** |
| **Q15** | Resolves in three documents. FCM directly, or E&F's *use* of it — different moves |
| **Q16** | Yuvaraj closes the compound: **mindwandering** |
| **Q17** | **Soft hyphen (U+00AD)** in the source; LaTeX needs a plain hyphen |
| **Q18** | The `(Fig. 3A)` parenthetical is inside the sentence and cannot be dropped silently. Plus-minus renders U+2AFE. **Prefer reporting the measurement over quoting it** |
| **Q19** | Capital T, curly apostrophe; bracketed capital if mid-sentence |
| **Q20** | **Elpidorou citing Fahlman et al. 2013 p. 68** — the substance is Fahlman's |
| **Q21** | The leading "the" is **outside** the quotation marks; Csikszentmihalyi quoted by Nacke |
| **Q25** | A **questionnaire item** Perone quotes, not Perone's claim |

### ★ Quotations that are BANNED from this draft

Established by `STEP-A-TAIL-CLOSURE-2026-08-06.md`. These are not in the bank and must not be reconstructed:

1. **"slipping away from ourselves toward whatever is happening"** — a **splice across two authors**. The first
   half is a **diagram label** in Mansikka; the second half is **Slaby's**. Not a quotation at all.
2. **"lower alpha = cortical activation"** — a reading gloss, never a quotation.
3. **"without relying on any specific genre of content"** — **no hit anywhere in the store.**

### ★ Backfill caveats on FCM rows

Carried into pack metadata so they surface at selection rather than at proofreading:

- **`claim-146`'s clause preserves an OCR corruption — *entelectly*.** Never carry it into prose unmarked. No Q
  in this bank draws on that clause; if drafting reaches for it, stop and re-cut against the source.
- **`claim-133`'s locus cites p. 233 while the passage sits at p. 223.** No Q in this bank draws on it; re-pin
  from the running head if it is ever needed.

## Ellipsis-bearing material — on-demand only

None of the 34 boredom-family ellipsis clauses is quotable as it stands; **zero** are `source-own-ellipsis`. The
three that could become load-bearing are Elpidorou & Freeman (¶2), Gibbs (¶4) and Elpidorou's *Good of Boredom*
(¶12). Re-cut against the source at the moment a paragraph calls for one — **and only then**, since re-cutting
requires retrieval, which is barred during drafting. A needed-but-unavailable quotation becomes `******` and
waits for a pack revision.

---

## ★ v1 → v2 DELTA — the Stage-P locus pass (2026-08-06)

Run in an isolated context against `archon-cli-v3` @ `75d8c210`, binary stamp `archon 1.3.11 (75d8c210)`, every
span re-verified `match_kind == exact`. **Quotation texts are byte-identical to v1 and were never retyped.**

| ID | v1 locus | v2 locus | how read |
|---|---|---|---|
| Q01 | pp. 3–5 (archon index) | **printed 482 — abstract page, BARRED** | folio from p. 2 (483); span absent from the body |
| Q02 | RE-PIN | **printed 484** | folio read directly on the body page |
| Q05 | pp. 1–2 (archon index) | **unpaginated** | ASEE paper carries no folio anywhere; MLA cites without a page |
| Q12 | RE-PIN | **printed 101** | chapter opening has no folio; pp. 102/103 folios plus the published 101–120 range |
| Q16 | pp. 10–11 (archon index) | **printed 11** | footer folio |
| Q17 | pp. 9–10 (archon index) | **printed 10** | article-internal pagination |
| Q19 | RE-PIN | **printed 2785** | running head; consistent with Q18 at 2786 |
| Q20 | RE-PIN | **printed 330** | running head |

**Three findings that change drafting, not just citation.**

1. **Q01 is barred.** Its span occurs only on Eastwood's title/abstract page and nowhere in the body. The
   no-abstract-quotations lock therefore excludes it, and v1's instruction to render it beside Q03 lapses.
   **This restores D-23 exactly as written:** the two definitional quotations rendered together at ¶10 are
   Eastwood's *condition* (Q02) and the FCM's "nothing at all to be found" (Q03). Eastwood's definition is
   paraphrased, and its verbatim content is already carried at ¶8 by Q05.
2. **Q05 is Fahlman's sentence.** It matches exact inside the Fahlman MSBS 2013 document as well as P1. The
   first-person lock governs how our own paper is referred to, not the ownership of the words, so the prose
   names Fahlman as the source of the definition P1 adopts. This is a **third attribution hazard**, alongside
   Q20 (Elpidorou citing Fahlman) and Q13 (Slaby citing *Being and Time*) — and all three run through Fahlman
   or through a misplaced source, which is the middle term of this section's spine.
3. **archon's page index is off by one against the physical PDF** for King & Salvo, Yuvaraj, Yakobi and
   Elpidorou, and correct for Eastwood, Slaby and VanderWerf. Every printed page above was folio-read, never
   offset-computed. Do not derive a locus by arithmetic from an archon page.

**Still open, unchanged by this pass:** Q03's printed 109 against desktop M4.1 ¶6's 110 (deferred to drafting by
author ruling) · E02/E03's six route counts (`RE-PIN` on the post-gauntlet queue) · Q14's locus (UNUSED in L1,
so not resolved).

---

## ★ E01 EXPANDED — the self-citation bridge, resolved (2026-08-06)

v1 and v2 stated E01 without naming anyone. Resolved in an isolated Stage-P pass against `archon-cli-v3`, from
the `Boredom Secondary (Part III)` entry's `_synthesis/citation-network.md` and its scholarly-evolution
analysis. **Verdict: E01 is fully supported, with one scope correction that makes it stronger.**

| field | value | evidence type |
|---|---|---|
| **The author** | **Andreas Elpidorou.** Seven of the eight phenomenology-to-psychology links in the 55-unit cluster are Elpidorou citing Elpidorou; six of the top eight most-cited units are Elpidorou, the only node with edges into both halves | stated in the index, in two independent synthesis artifacts |
| **Phenomenological program** | Elpidorou & Freeman, *Affectivity in Heidegger I* (2015) · *Is Profound Boredom Boredom?* (2019) · *Fear, Anxiety, and Boredom* (2020) · Elpidorou, *Boredom as a Concept in Phenomenology* (2023) | stated in the index (link table + title table, cross-checked against the entry manifest) |
| **Regulatory-psychology program** | Elpidorou, *The Bored Mind is a Guiding Mind* (2018) · *The Good of Boredom* (2018) | same |
| **The critical footnote** | **Emily Hughes, *Meaninglessness and Monotony in Pandemic Boredom* (2023), p. 6 n. 9**, distancing a strictly ontological reading from Elpidorou's drift toward normative, moral and psychological theorizing. Target: *The Bored Mind is a Guiding Mind* | stated in the index; corroborated by the unit entry — **NOT yet PDF-verified** |
| **The twenty-four-year span** | **2001 → 2025**, endpoints being the oldest and newest units *in the surveyed cluster*: Thomson (2001) and Yuvaraj et al. (2025) — not the first and last publications of the two literatures at large | stated in the index |

**★ Scope correction, and it sharpens the claim.** Elpidorou's bridge lands in the **regulatory-psychology**
strand, which is survey-based. It does **not** reach the instrumented strands — EEG and eye-tracking — which
the index shows carry **zero** citations to or from phenomenology in either direction. So read strictly against
the instrumented literature, the situation is starker than E01 states: no connection at all, self-citation
included. Read against the psychological-plus-measurement side collectively, E01 is exact as written.

**★ A collision the author's r1 deletion already avoided.** The span's 2001 endpoint is **Thomson**, whom A-02
and E10 establish is **not a boredom source** — zero occurrences of "bored," "boredom" or "Langeweile." A
twenty-four-year span anchored on a non-boredom work is not a claim this section should make. Batch 1 revision
r1 deleted that sentence on other grounds; it should not return without re-anchoring.

**Two caveats carried forward.** The index's strand-matrix zeros are described in its own §6 as mostly-verified
negative checks — strong, but not exhaustive proof of absence; the positive findings do not depend on that.
And **Hughes p. 6 n. 9 is index-attested rather than PDF-verified**, so it goes on the post-gauntlet
verification queue before it may carry a citation.
