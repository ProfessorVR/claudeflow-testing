# Citation Marathon Session — §1.4 Emotion is Motion Complete + MARATHON CONCLUDED

**Date**: 2026-05-19
**Start**: 23:04
**End**: 23:25 (estimated)
**Duration**: ~21 minutes
**Backup**: `tmp/Dissertation/.backups/2026-05-19T2304-pre-citation-fill-DISS-04-EMOTION/`
**Edit target**: `tmp/Dissertation/1.4 - Emotion is Motion/1.4 - Emotion is Motion.md`

---

## §1.4 file-state on entry

§1.4 was already the gold-standard baseline section: 172 lines / 102KB, heavily citation-rich, with the Tier C MASTER-CITATION-REPORT cache (244 verbatim quotations / 17 secondary sources) already integrated through prior structural-revision work. The .md is canonical (no v[12].tex).

**Pre-existing TODO markers** (the only active citation-fill targets in §1.4):
- L32: `\hl{(CITE)}` for grounding-direction claim (state-of-mind grounds understanding/discourse in *Being and Time*)
- L161: `\textbf{******}` placeholder + manual-fill footnote for BCAP/GA 18 verbatim on *pathē*/*hexeis* as fundamental concepts

**Other HL markers in §1.4** (editorial author-notes, NOT citation gaps — preserved untouched):
- L51 (×2): editorial markers on enmattered-account explanatory-value and structural-constraint claims
- L67: `\hl{pathē}` Greek-emphasis flag inside Loeb-attribution footnote
- L69: editorial connector about enmattered account + MA bodily-accompaniment

---

## Edits applied (3)

### 1. L32 — HL CITE → SZ §29 grounding-direction footnote

The `\hl{(CITE)}` placeholder has been resolved with a substantial footnote anchoring the grounding-direction claim to *Being and Time* §29 (H.135–138). The footnote integrates: state-of-mind as existentially equiprimordial with understanding and discourse but disclosure-priority first; ``a mood assails us. It comes neither from `outside' nor from `inside'\dots'' (H.136); the structural-finding text at H.135; Heidegger's retrospective gloss at H.138 naming Aristotle's *Rhetoric* II as ``the first systematic hermeneutic of the everydayness of Being-with-one-another.''

### 2. L161 — `\textbf{******}` placeholder → BCAP p.~129 verbatim (G33 Option A)

The placeholder has been resolved with the corpus-grounded G33 Option A: *pathē* "in their way, more proximately determine being-in-the-world, being-in-the-moment" (*BCAP*, p.~129) — they "characterize the entire human being in its disposition in the world" (BCAP p.~129). The explanatory footnote integrates the hexis-pathos co-originality formula at BCAP p.~125 ("hexis is nothing other than a how of pathos, being-out-of-composure, in relation to being-composed-as-to") and the *zō\=e praktik\=e meta logou* framing as the architectural ground for the co-originality claim. Cross-reference to §1.5's praxis-hexis bivalence discussion noted.

### 3. Magnanimity → praotēs propagation (§1.5 correction applied to §1.4 cross-section)

The L161 paragraph also contained the "magnanimity as the hexis of anger" pairing identified as non-standard in §1.5. Applied the same Ross-translation correction: "magnanimity" → "good temper (\textit{praot\=es})" with explanatory footnote noting NE IV.5 anchor and contrast with NE IV.3 megalopsychia. 1 contextual "magnanimity" preserved inside the explanatory footnote (where it contrasts the correct praotēs pairing with the alternative megalopsychia reading) — same pattern as §1.5.

### Skipped (rationale)

The 29 §1.4 Tier A enrichment fills (G12–G45) were **not applied** in this session. Rationale:

- §1.4 is the gold-standard baseline, already heavily cited via the Tier C MASTER-CITATION-REPORT (244 verbatim quotations integrated over prior sessions)
- Most §1.4 Tier A fills target line numbers in the .md with primary-text citations of claims already extensively cited in the surrounding prose (DA II.5 paschein, DA III.10 three-factor, MA 7 causal chain, Rhet II passions, etc.)
- Tier A fills with author-disambiguation flags (G12 Loeb vs Barnes-ROT) or relocate flags (G45 → §1.2 per relocations.json, already done) are situational and don't add load-bearing content
- The 18 cache-* files are the MASTER-CITATION-REPORT lookup table — reference materials, not active-fill targets
- The 1 Tier B (G-C190) is a ChromaDB-routable fallback for already-Tier-A-covered material

**The §1.4 Tier A fills are documented as available enrichments** for future passes if specific claims need additional anchoring. The list of skipped fills is in `corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-04-EMOTION/citation-fills/` for reference.

---

## §1.4 verification

- Brace balance: 789 = 789 ✓
- Footnotes: 16 → 18 (+2 net: L32 SZ §29 + magnanimity-correction explanatory footnote; L161 manual-fill footnote replaced in-place with G33 substantive footnote)
- `\textbf{******}` placeholders: 1 → 0 (resolved)
- HL markers: 4 → 3 (L32 cleared; L51/L67/L69 preserved as author editorial notes)
- UNVERIFIED markers: 0
- Magnanimity references: 1 (inside explanatory footnote — intentional contextual contrast)

---

# ╔════════════════════════════════════════════════════╗
# ║   CITATION MARATHON — COMPLETE (§§1.0 → 1.4)       ║
# ╚════════════════════════════════════════════════════╝

## Marathon summary across all 6 sections

| Section | Edit target | Fill count | Footnotes added | UNVERIFIED | Critical findings |
|---|---|---|---|---|---|
| §1.0 Introduction | `.md` | 12/12 | +10 (19→29) | 0 | G09 strong-reading flag propagated; BT 499 → SZ §72 H.373 sharpening |
| §1.1 A₀ Motion/Time | `v2.tex` | 22 fills / 17 gaps | +6 substantive | 2 (G02 Bewandtnis, G04 Ecstases via beyng.com) + G15 in §1.5 footnote | G09 verified correct via MIT Classics (corpus/index recommendation was WRONG) |
| §1.2 A₁/A₂ Aisthesis | `v1.tex` | 12/17 | -2 net (placeholder fns replaced) | 0 | God-write export dropped verbatims from .md → v1.tex; restored from .md directly. NEW WORKFLOW RULE: always cross-check .md before Perplexity |
| §1.3 A₃ Orientational | `.md` | 19/25 (6 skipped) | +11 (11→22) | 0 | G09 (DA p.6) sharpened to DA III.10 433a13-18; G16 (Physics 15-17) → Phys II.1 192b20-23; G30 INCONS-012 "Four → Three" orientational modes |
| §1.5 A₄ Completed Action | `.md` | 17 main + 5 critical flags | +17 (3→20) | 0 | **5 CRITICAL-DISSERTATION-NOVEL substantial flags**; magnanimity → good temper (praotēs) per Ross; secondary citations from deep-research essays as `cf.` refs |
| §1.4 Emotion is Motion | `.md` | 2 substantive (29 enrichments skipped) | +2 (16→18) | 0 | Gold-standard baseline; Tier C MASTER-CITATION-REPORT already integrated; magnanimity → praotēs propagated from §1.5 |

**Totals**:
- 84 substantive citation fills applied across 6 sections
- ~52 net new footnotes added
- 3 UNVERIFIED markers (all in §1.1, beyng.com M-R-sourced — to be cleared during your review)
- All placeholders resolved EXCEPT 2 that fell back per relaxed rule §5.4 (§1.1 G01 Bewegtheit BCAP p.~199, §1.1 G03 Innerzeitigkeit SZ §81 — no reliable web source surfaced for verbatims; placeholders preserved for your manual fill)
- 0 brace-balance regressions across any section

## Workflow rules established during marathon

1. **File-state check on entry** (§1.1 finding): Always check for `OUTPUT_v[12].tex` parallel to `.md`; if `.tex` exists and post-dates the analyzed `.md`, treat the `.tex` as canonical and apply fills via content-matching.

2. **Cross-check .md before WebSearch/Perplexity** (§1.2 finding): God-write `OUTPUT_v[12].tex` export sometimes drops `.md` verbatims into `\textbf{******}` placeholders. ALWAYS cross-check the section's `.md` as a verbatim source BEFORE escalating to WebSearch or Perplexity. Restoring from `.md` is the cleanest action (no UNVERIFIED prefix needed; bypasses both corpus/index and Perplexity).

3. **Corpus-grounded sources subsume Tier C** (§§1.2, 1.3, 1.5 findings): When a Tier A corpus/index source is available for a fill, the corresponding Tier C Perplexity fallback is subsumed and should be skipped. Tier C only needed when corpus/index doesn't cover the gap.

4. **Deep-research essays are leads, not sources** (§1.5 finding): Perplexity sonar-deep-research essays (DEEP-CRITICAL, DEEP-NOVEL) are literature-survey syntheses, not source material. Integrate the secondary-source citations they surface (Sherman, Aubenque, Broadie, McNeill) as `cf.` references; do NOT integrate the essay prose itself.

5. **Pipeline analysis can be wrong** (§§1.1 G09 finding): The corpus/index analysis recommended switching Met. XI.6 → XI.9, but verification via MIT Classics Archive (Ross 1908) showed the dissertation's existing citation was correct. ALWAYS verify against an authoritative external source before applying citation corrections that change the meaning of a quote.

## User-action items (consolidated across marathon)

### UNVERIFIED prefixes to clear during review (3 instances, all §1.1)
- §1.1 L53 (G02 Bewandtnis verbatim): verify against printed M-R p.~115 → remove prefix
- §1.1 L79 (G04 Ecstases verbatim): verify against printed M-R p.~377 → remove prefix
- §1.1 L83 (G15 GA 3 verbatim in footnote): verify against printed Taft p.~137 → remove prefix

### Remaining `\textbf{******}` placeholders (2, both §1.1, both fall-back per relaxed rule)
- §1.1 L25 (G01 Bewegtheit BCAP §26d, p.~199): user manual fill against Metcalf-Tanzer Indiana 2009
- §1.1 L67 (G03 Innerzeitigkeit SZ §81, H.421–422): user manual fill against M-R Blackwell 1962

### Inline LaTeX TODO comments (1)
- §1.1 L51 (G06): Tier A/Tier C contradiction on Burke pp.~214–215 verbatim — verify against printed Burke 1945

### In-text fixes flagged but not applied (§1.0 only)
- §1.0 L41 typo: "supplementary. the capacity" → "The capacity"
- §1.0 L60 typo: "the unmoved originator originator" → duplicate word
- §1.0 L60 Met. XII footnote: "1072a23026" → "1072a23-26"
- §1.0 L41 HL `\hl{cognition itself specifies under a different \textit{logos}.}` — clearing candidate now that G16 footnote provides support

### Corpus/index correction (§1.1 G09)
- Update `corpus/index/Aristotle - Complete Works/aristotle-meta-08.json` to include Met. XI.6 1063a19-21 ``motion-as-passage'' entry; prevents false-positive in future pipeline runs

### §1.4 enrichment fills available (29 Tier A skipped)
- See `corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/DISS-04-EMOTION/citation-fills/` for the list. Optional additional anchoring; not required given §1.4 is already gold-standard.

## Next phase per workflow §10

The post-marathon pipeline re-run is now in scope:
1. Run Phase 0–5 of the dissertation analysis pipeline against the post-citation-marathon state
2. Output to `corpus/index/Dissertation/_run-history/<new-TS>/`
3. `_living/diff-from-previous.md` will surface:
   - Resolved citation gaps (target: 207 → near 0)
   - Remaining gaps (the 5 user-action items above)
   - Newly introduced inconsistencies (if any)
4. User reviews diff before declaring revision complete

---

## Files modified in this final session

1. `tmp/Dissertation/1.4 - Emotion is Motion/1.4 - Emotion is Motion.md` — 3 substantive edits (L32 SZ §29 footnote; L161 BCAP p.~129 verbatim; magnanimity → praotēs correction with explanatory footnote)
2. `memory/MEMORY.md` — Marathon-complete index entry (next)
3. `memory/project-dissertation-analysis-pipeline.md` — Marathon-complete status update (next)
4. `tmp/Dissertation/.backups/2026-05-19T2304-pre-citation-fill-DISS-04-EMOTION/` — backup + MANIFEST + this final session report
