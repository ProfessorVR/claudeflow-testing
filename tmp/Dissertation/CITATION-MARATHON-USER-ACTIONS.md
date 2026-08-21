# Citation Marathon — Consolidated User-Action Items

**Created**: 2026-05-19
**Source**: Per-section session reports across §§1.0–1.5
**Status**: Marathon complete; these items are user-bottlenecked, not assistant-actionable
**Purpose**: Single review document. Clear these before triggering the post-marathon pipeline re-run.

---

## Quick summary (counts)

| Priority | Type | Count | Sections |
|---|---|---|---|
| **HIGH** | `\textbf{****** UNVERIFIED:}` prefix to verify + clear | 3 | §1.1 only |
| **HIGH** | `\textbf{******}` fall-back placeholder needing manual fill | 2 | §1.1 only |
| **MEDIUM** | Inline LaTeX TODO comment (Tier A/Tier C contradiction) | 1 | §1.1 |
| **MEDIUM** | `\footnote{X CITE}` placeholder needing manual fill | 1 | §1.3 |
| **MEDIUM** | In-text typo / Bekker correction | 3 | §1.0 |
| **LOW** | HL marker clearing candidate | 1 | §1.0 |
| **LOW** | HL author-TODO marker (intentional, no action needed) | 1 | §1.3 |
| **LOW** | Corpus/index data correction (prevents future false-positive) | 1 | corpus/index, not section file |
| **LOW** | Bibliographic / translation verification | 3 | §1.5 |
| **OPTIONAL** | §1.4 Tier A enrichments (29 available, applied 0) | 29 | §1.4 |

**Total blocking items**: 10 (HIGH + MEDIUM)
**Total review items**: ~13 (incl. LOW)

---

## HIGH priority — must clear before clean pipeline re-run

### 1. `\textbf{****** UNVERIFIED:}` prefixes to verify + clear (3 items, all §1.1)

The relaxed-rule §5.4 fills in §1.1 inserted Heidegger verbatims from beyng.com (web-mirror of the M-R translation) with explicit `UNVERIFIED:` prefixes pending your verification against printed editions. After verification, remove the `\textbf{****** UNVERIFIED:}` prefix from the prose.

**File**: `tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex`

| Line | Verbatim | Edition to verify against |
|---|---|---|
| L53 | "The character of Being which belongs to the ready-to-hand is just such an involvement" (Bewandtnis, SZ §18, H.84) | Macquarrie & Robinson 1962 Blackwell, p.~115 |
| L79 | "Temporality is the primordial 'out-side-of-itself' in and for itself.\ldots\ We therefore call the phenomena of the future, the character of having been, and the Present, the 'ecstases' of temporality" (SZ §65, H.328–329) | M-R p.~377 |
| L83 | "The pure imagination is the fundamental faculty of human finitude. It is originally a temporalizing (\textit{Zeitigung}).\ldots" (Heidegger GA 3, §34) | Taft trans. 1997 Indiana, p.~137 / Klostermann pp.~152 |

**Grep**: `grep -n "UNVERIFIED" "tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex"`

### 2. `\textbf{******}` fall-back placeholders (2 items, both §1.1)

WebSearch did not surface reliable verbatims for these; per the relaxed-rule §5.4 fall-back, the placeholders were preserved for your manual fill against printed editions.

**File**: `tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex`

| Line | Topic | Suggested locus |
|---|---|---|
| L25 | Bewegtheit verbatim — Heidegger's *kinēsis* gloss | Metcalf-Tanzer 2009 Indiana, BCAP §26d ≈ p.~199 (the announcement that the task is "making beings as moved visible in their being-there") |
| L67 | Innerzeitigkeit verbatim — Heidegger on Aristotle's time definition | M-R 1962 Blackwell, SZ §81, H.421–422 ≈ M-R pp.~473–474 |

**Grep**: `grep -n "textbf{\*\*\*\*\*\*}" "tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex"`

---

## MEDIUM priority — should clear before pipeline re-run

### 3. Inline LaTeX TODO comment — Burke pp.214–215 contradiction (§1.1)

Tier A corpus/index said the verbatim "conditions are likewise contextual, as with the conditions of an organism's existence" does NOT appear at Burke 1945 pp.~214–215 (which is the Marxism subsection). Tier C Perplexity said it DOES appear there (Santayana section, Agent chapter). The two sources contradict.

**File**: `tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex` — L51 area
**Grep**: `grep -n "TODO \[G06" "tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex"`

**Resolution path**: Verify against printed Burke 1945 *Grammar of Motives*; resolve to one of:
- (a) Keep pp.~214–215 (trust Tier C — Santayana section verbatim)
- (b) Move to pp.~152–156 (trust Tier A — Darwin/Scene chapter)
- (c) Supply correct page if neither matches your copy

Delete the LaTeX comment block (lines beginning `% TODO [G06...`) once resolved.

### 4. `\footnote{Quotation, definition, point.}` placeholder (§1.3)

The §1.3 L9 footnote was deliberately left as a TODO for user to fill with Burke's own RoM definition of *identification*. The adjacent footnote already contains the Hazlitt RoM 83–84 verbatim.

**File**: `tmp/Dissertation/1.3 - A3 - Orentational Modes/1.3 A3 - Orientational Modes.md` — L9 area

**Resolution path**: Supply Burke's own RoM definition of identification (RoM pp.~19–46 region or pp.~55–59 region per G05 fill suggestion), OR restructure to merge with the existing adjacent footnote if a single combined footnote is preferred.

### 5. §1.0 in-text typo / Bekker corrections (3 items)

These were flagged during the §1.0 citation marathon but explicitly deferred as out-of-scope for citation-fill work.

**File**: `tmp/Dissertation/1.0 - Introduction/1.0 - Introduction.md`

| Line | Current | Fix |
|---|---|---|
| L41 | "supplementary. **the** capacity for being-affected" | "supplementary. **The** capacity for being-affected" (capitalize after period) |
| L60 | "the unmoved **originator originator** relative to that particular motion-event" | "the unmoved **originator** relative to that particular motion-event" (delete duplicate) |
| L60 footnote | `\footnote{XII, 1072a23026.}` | `\footnote{XII, 1072a23--26.}` (insert missing dash) |

---

## LOW priority — review opportunities, non-blocking

### 6. §1.0 L41 HL marker — clearing candidate

`\hl{cognition itself specifies under a different \textit{logos}.}` at L41. The G16 footnote inserted during the marathon now provides primary-text support (DA I.1 + II.5 + III.2). The HL marker may have been "needs citation" flagging — now potentially clearable. **Your judgment call**: clear the `\hl{}` wrapping, or preserve as conceptual-development flag.

**File**: `tmp/Dissertation/1.0 - Introduction/1.0 - Introduction.md` — L41

### 7. §1.3 L45 HL marker — author TODO (intentional, NO action needed)

`\hl{(Repeat quote in the final settled disposition section.)}` at L45 is an author's note-to-self to repeat the *hexis*-quote in a later section. Not a citation gap. **Preserved untouched** — listed here only so you know it's intentional, not an oversight.

**File**: `tmp/Dissertation/1.3 - A3 - Orentational Modes/1.3 A3 - Orientational Modes.md` — L45

### 8. Corpus/index correction — `aristotle-meta-08.json` Met. XI.6 entry

The §1.1 G09 fill recommended changing Met. XI.6 1063a19-21 → XI.9 1065b16-23. I verified against MIT Classics Archive (Ross 1908) that the dissertation's existing XI.6 citation IS correct — the verbatim does appear at that locus. The corpus/index analysis was a false positive.

**File**: `corpus/index/Aristotle - Complete Works/aristotle-meta-08.json`
**Action**: Add an entry recording the Met. XI.6 1063a19-21 "motion-as-passage" passage so future pipeline runs don't re-flag this as a missing citation.

Not blocking for the pipeline re-run but cleans up data quality long-term.

### 9. §1.5 bibliographic / translation verifications

These are bibliographic spot-checks rather than gap-fills. The marathon integrated these from secondary literature (mostly via the deep-research essays' surfaced citations).

**File**: `tmp/Dissertation/1.5 - A4 - Completed Action/1.5 - A4 - Completed Action.md`

- Verify Sherman 1989 / Aubenque 1963 / Broadie 1991 / McNeill 1999 bibliographic entries against your reference library
- Verify Ross-translation "good temper" rendering against your printed Ross edition (alternatives: "mildness" / "patience")
- Verify Bekker line-numbering at Rhet. II.1 (footnote L29 area): §1.5 prose used 1378a24; corpus/index recorded 1378a20–22; the discrepancy is edition-specific to Loeb / Barnes / Ross numbering schemes

### 10. §1.5 architectural observation — footnote density

§1.5 is now substantially more footnote-heavy. The 5 substantial critical-flag footnotes at L7 + L25 (×3) + L29 average ~150–200 words each. Combined with 12 supporting Tier A footnotes (3 → 20 total, +17 net), the chapter's footnote-to-prose ratio has shifted significantly.

If your dissertation house style prefers lighter footnote density, the 5 critical flags can be merged into a single section-opening "interpretive-frame" footnote. Per your direction during the §1.5 session, the maximum-transparency approach was applied — but this is reversible if you reconsider.

---

## OPTIONAL — §1.4 Tier A enrichment fills (29 available, none applied)

§1.4 is the gold-standard baseline; the 244-entry MASTER-CITATION-REPORT was already integrated through prior structural-revision sessions. The 29 §1.4 Tier A fills target line numbers in the .md with primary-text citations of claims already extensively cited.

If a specific §1.4 claim needs additional anchoring during your review, the fill files are available at:
`corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-04-EMOTION/citation-fills/DISS-04-G{12,13,17-21,22-31,33-45}-tier-a.md`

---

## Quote-fidelity items flagged during marathon (no action required, FYI only)

These verbatims were applied per the fill files but flagged in session reports because the fidelity is paraphrastic rather than strict-verbatim. They will not block the pipeline re-run; they're recorded for your awareness in case you want to revise the wording during your final read-through.

### §1.0 G09 — DA I.4, 408b5–7 verbatim

The fill file's proposed verbatim "Being pained or pleased, or thinking, are themselves modes of motion of the ensouled being" reads more like an interpretive paraphrase than a direct quote from standard Smith/Barnes DA I.4 408b5-18. The §1.0 L60 footnote hedges the locus reference to avoid asserting the disputed verbatim.

**Action (optional)**: Verify against printed Smith/Barnes DA and decide whether to retain the hedged form or use the direct standard translation.

### §1.0 G09 — Phys VII.3, 245b1–13 verbatim

The fill quote is truncated with ellipsis (`"Now alterations also occur, for the same reason, in inanimate things… But all the alterations that are alterations in respect of an affection of the soul, such as perceiving and thinking…"`). The continuous passage is faithfully represented but the ellipsis splicing is unusual.

**Action (optional)**: Decide if the ellipsis-spliced form is acceptable or if you'd prefer to either quote contiguously or paraphrase.

---

## Marathon-complete workflow reminders

- **5 workflow rules** were established during the marathon and are logged in `memory/project-dissertation-analysis-pipeline.md`. Most consequential for future runs: ALWAYS cross-check `.md` for verbatims before escalating to WebSearch/Perplexity (the §1.2 finding that god-write exports sometimes drop verbatims into placeholders).
- **Backup directories** for each section's pre-edit state exist at `tmp/Dissertation/.backups/2026-05-19T*-pre-citation-fill-DISS-*/` if you need to restore any section to pre-marathon state.
- **Per-section session reports** exist in each backup directory with full session-by-session detail.
- **Final consolidated session report** at `tmp/Dissertation/.backups/2026-05-19T2304-pre-citation-fill-DISS-04-EMOTION/SESSION-REPORT.md`.

---

## After clearing these items

Once the HIGH and MEDIUM items above are cleared, ping me with "run pipeline" or similar and I'll kick off the Phase 0–5 pipeline re-run per `DISSERTATION-ANALYSIS-PIPELINE-PLAN.md` against the post-marathon state.

Expected diff output (per workflow §10):
- **Resolved**: ~84 citation gaps closed (target: 207 → near 0)
- **Remaining**: whatever LOW-priority items you choose to defer (#6 HL clearing, #8 corpus/index update, #9 bibliographic verifications, #10 footnote-density review)
- **New flags**: surfaced if any edit introduced new inconsistencies (unexpected — brace-balance was preserved across all sections)
