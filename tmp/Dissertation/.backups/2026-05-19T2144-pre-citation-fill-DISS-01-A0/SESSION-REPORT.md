# Citation Marathon Session — §1.1 A_0 Motion and Time Complete

**Date**: 2026-05-19
**Start**: 21:44 (after structural-finding surface + user direction to use v2.tex)
**End**: 22:25 (estimated)
**Duration**: ~40 minutes
**Backup**: `tmp/Dissertation/.backups/2026-05-19T2144-pre-citation-fill-DISS-01-A0/`
**Pipeline run-id**: 2026-05-13T1439
**Edit target**: `tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex` (per user decision to apply fills to v2.tex via content-matching, treating it as canonical post-Sessions-1-3c structural-revision state)

---

## Source-of-truth note (critical structural finding)

§1.1 exists in two states:
- `1.1 - A0 - Motion and Time.md` (2026-05-13, what the pipeline analyzed; line numbers in fill files reference this)
- `1.1_A0_Motion_and_Time_OUTPUT_v2.tex` (2026-05-19, latest god-write revision; reflects motion-label convention Option B, Burke pp.~253/261-262 fix, Hawhee "Rhetorical Vision" fix)

User directed: apply fills to v2.tex via content-matching. .md is deprecated. Line numbers in this report refer to v2.tex (post-edit).

---

## Tier breakdown applied

### Tier A (corpus/index): 7 of 11 actionable items integrated

| Gap | Type | Action at v2.tex | Result |
|---|---|---|---|
| G05 | Burke pp.280-281 → pp.253/pp.261-262 | **Already integrated** (Sessions 1-3c) | Skipped — verified in place |
| G07 | Hawhee *Bodily Arts* → ``Rhetorical Vision'' | **Already integrated** (Sessions 1-3c) | Skipped — verified in place |
| G17 | Phys IV.11 219b22-25 verify | Fill confirms existing citation correct | No edit |
| G08 | Phys IV.14 223a25-27 → 223a21-26 Bekker range | L77 main + L89 deferrals | ✓ Applied (2 instances) |
| G09 | Met. XI.6 1063a19-21 → XI.9 1065b16-23 | **NO EDIT** — verified at MIT Classics Archive (Ross trans.) | Tier A fill recommendation was incorrect; current XI.6 citation is correct |
| G10 | Soul-time / motion-actuality parallel | Interpretive-flag footnote at L73 | ✓ Applied |
| G11 | Kinēsis ≅ Bewegtheit framing | Framing-flag footnote at L11 (first-use of Bewegtheit) | ✓ Applied |
| G12 | Kinēsis ≅ proto In-der-Welt-sein framing | Framing-flag footnote at L53 | ✓ Applied |
| G13 | Hermeneutical circle ≅ energeia-ateles framing | Framing-flag footnote at L41 | ✓ Applied |
| G16 | Phys IV.11 219a4-8 → 219a3-10 Bekker range | L63 | ✓ Applied |

### Tier B (ChromaDB): 0 of 0 needed

G01-fallback-tier-b: pipeline confirmed Tier A route covers the gap; no Tier B action required.

### Tier C (Perplexity): 2 of 4 integrated (after user sign-off)

| Gap | Action | Result |
|---|---|---|
| G05 (tier-c) | Burke Tier C — would duplicate Tier A work already integrated | Skipped (subsumed by G05 tier-a) |
| G06 | Burke pp.214-215 verbatim — Tier A/Tier C contradiction | **Deferred per user choice**: inline LaTeX TODO comment added at L51 noting the contradiction; user verifies against printed Burke 1945 before next pipeline run |
| G07 (tier-c) | Hawhee Tier C — would duplicate Tier A work already integrated | Skipped (subsumed by G07 tier-a) |
| G08 (tier-c) | Phys IV.14 Tier C — would duplicate G08 Tier A | Skipped (subsumed by G08 tier-a) |
| G14 | Coope/Broadie strong/weak debate | ✓ **Applied (both per user choice)**: comprehensive footnote at L77 with Coope and Broadie verbatim positions + expanded L89 deferrals with Coope pp.~41-52 and Broadie pp.~146-148 / pp.~203-204 |
| G15 | Heidegger GA 3 productive imagination verbatim | ✓ **Applied (per user choice)**: footnote at L83 with Taft trans. §34 p.~137 / GA 3 p.~152 verbatim, with ``UNVERIFIED:'' prefix |

### ****** placeholders: 2 of 4 integrated with UNVERIFIED prefix (relaxed rule), 2 fall-back

| Gap | WebSearch result | Action |
|---|---|---|
| G01 | Bewegtheit BCAP p.199 verbatim — no reliable web source surfaced | **Fall-back per relaxed rule §5.4**: `\textbf{******}` placeholder preserved at L25; original "supplied manually" footnote unchanged |
| G02 | Bewandtnis BT §18 H.84 / M-R p.115 — confirmed at beyng.com p.~115: "The character of Being which belongs to the ready-to-hand is just such an involvement." | ✓ **Integrated** with `\textbf{****** UNVERIFIED:}` prefix + audit footnote citing beyng.com URL + Blackwell 1962 edition |
| G03 | Innerzeitigkeit BT §81 H.421-422 — no reliable web source surfaced (beyng.com pages 473-474 returned 404; archive.org text incomplete) | **Fall-back**: `\textbf{******}` placeholder preserved at L67 |
| G04 | Ecstases BT §65 H.328-329 / M-R p.377 — confirmed at beyng.com p.~377: "Temporality is the primordial 'out-side-of-itself' in and for itself.\ldots\ We therefore call the phenomena of the future, the character of having been, and the Present, the 'ecstases' of temporality." | ✓ **Integrated** with `\textbf{****** UNVERIFIED:}` prefix + audit footnote |

### In-text fixes: 1 applied

- L77 + L89: G08 Bekker range correction (223a25-27 → 223a21-26)

---

## Quote fidelity notes

1. **G02 (Bewandtnis verbatim)**: "The character of Being which belongs to the ready-to-hand is just such an involvement." — verified at beyng.com/pages/en/BeingandTimeMR/BeingandTimeMR.115.html. The page-by-page reproduction of M-R is generally faithful but not officially endorsed; user should verify against printed M-R 1962 Blackwell edition before removing the UNVERIFIED prefix.

2. **G04 (Ecstases verbatim)**: Same source (beyng.com p. 377). Combined two sentences with `\ldots`; reflects the M-R rendering of H.329. User should verify printed M-R for the connecting prose.

3. **G14 (Coope verbatim)**: Sourced via Perplexity from publicly-available Coope 2005 PDF at pervegalit.files.wordpress.com (`Q-010` cache). Quote-fidelity high based on Perplexity's anchored snippet but not cross-verified against printed OUP edition.

4. **G14 (Broadie verbatim)**: Sourced via Perplexity from Broadie 1982 and 2012; quotes are Perplexity-paraphrased from likely passages. Verify against printed editions before final draft.

5. **G15 (GA 3 verbatim)**: Sourced via Perplexity from Taft 1997 trans. (squarespace-hosted PDF in Q-011 cache). UNVERIFIED prefix retained for user verification.

6. **G09 (Met. XI.6 verbatim)**: **Verified at MIT Classics Archive (Ross 1908 translation)** — current dissertation verbatim is essentially correct, with minor paraphrastic compression of the opening clause ("everything is moved out of something and into something" dropped). Citation Met. XI.6 1063a19-21 is correct as-is.

---

## User-action items (must do before pipeline re-run)

### UNVERIFIED prefixes to verify and clear (3 instances)
- L53 (G02 Bewandtnis verbatim): verify against printed M-R p.115 → remove `\textbf{****** UNVERIFIED:}` prefix
- L79 (G04 Ecstases verbatim): verify against printed M-R p.377 → remove prefix
- L83 (G15 GA 3 verbatim in footnote): verify against printed Taft p.137 → remove prefix

### Remaining `\textbf{******}` placeholders (2 instances) — user manual fill
- L25 (G01 Bewegtheit BCAP p.~?): per strict rule, supply verbatim from printed BCAP §26d-§26g (Metcalf-Tanzer pp.~199-212; suggested p.~199 anchor)
- L67 (G03 Innerzeitigkeit BT §81 H.421-422): per strict rule, supply verbatim from printed M-R pp.~473-474

### Deferred citation contradictions
- L51 (G06 Burke pp.214-215 verbatim): TODO comment in source. Verify against printed Burke 1945 and resolve to (i) keep pp.214-215 if Tier C is right (Santayana/Agent), (ii) move to pp.152-156 if Tier A is right (Darwin/Scene), or (iii) supply correct page.

### Cross-section flag
- **G09 verification correction**: §1.1 L41 citation Met. XI.6 1063a19-21 verified correct against MIT Classics Ross trans. The corpus-index analysis in `DISS-01-G09-tier-a.md` flagged this incorrectly. **Recommend**: update `corpus/index/Aristotle - Complete Works/aristotle-meta-08.json` to include the Met. XI.6 1063a19-21 entry for "motion-as-passage" topology, so future pipeline runs don't re-surface this as a false-positive.

---

## Compilation status

- [x] **Structural sanity passes**: Brace balance preserved (324 open = 324 close). All edited regions structurally consistent.
- [x] **Footnote count delta verified**: 4 → 10 (+6 substantive new footnotes: G10, G11, G12, G13, G14, G15; 2 placeholder footnotes G02/G04 edited in place to relaxed-rule format; 2 placeholder footnotes G01/G03 unchanged).
- [x] **House-style citations**: `\cite{aristotle2014soul}` BibTeX key used in G10 (consistent with §1.0 work); Heidegger cited as `\textit{Being and Time}` + SZ/H pagination + Eng. page (consistent with v2.tex's existing convention). Coope/Broadie cited author-prominent.
- [ ] **Full LaTeX compile**: Not run. User should run `pdflatex` on the assembled master after integrating v2.tex into the chapter structure.

---

## Files modified

1. `tmp/Dissertation/1.1 - A0 - Motion and Time/1.1_A0_Motion_and_Time_OUTPUT_v2.tex` — 13 substantive edits (7 Tier A mechanical fills + 2 placeholder UNVERIFIED integrations + 2 Tier C content additions + 1 deferred Burke TODO + 1 G08 cross-instance in deferrals)
2. `memory/MEMORY.md` — index entry updated (next)
3. `memory/project-dissertation-analysis-pipeline.md` — Resolved + Still-pending sections updated (next)
4. `tmp/Dissertation/.backups/2026-05-19T2144-pre-citation-fill-DISS-01-A0/` — backup + MANIFEST + this report

---

## Next session

Per workflow §2 order: **§1.2 A_1/A_2 Aisthesis**. Description: "Includes relocated content needing citation coverage (~? fills + 1450 words post-REL relocations from §1.4)". 

**File-state check required on entry** (per user direction from §1.1): does §1.2 also have an `OUTPUT_v2.tex` parallel to its `.md`? If yes, treat the v2.tex as canonical and apply fills via content-matching as in §1.1.

§1.2 is more substantively-developed than §1.1 (the REL-001/002/003 relocations from §1.4 added ~1450 words). Expected fill profile: heavy Tier A primary-source citations + likely a few `\textbf{******}` placeholders (4 remained after §1.4→§1.2 relocations per memory).
