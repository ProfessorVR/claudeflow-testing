# Citation Marathon Workflow — Dissertation §§1.0–1.5

**Created**: 2026-05-19
**Trigger**: All structural critical-path revisions complete. Citation-fill pass is the next major work-block.
**Total estimated effort**: 12–18 hours across 6 sections
**Pipeline run-id**: `2026-05-13T1439`
**Output root**: `corpus/index/Dissertation/_run-history/2026-05-13T1439/`

---

## 1. Scope

Integrate the Phase 4 citation-fill proposals into §§1.0–1.5, working section by section, tier by tier.

**Phase 4 fills already produced** (locations):
```
corpus/index/Dissertation/_run-history/2026-05-13T1439/_per-section/
├── DISS-00-INTRO/citation-fills/         (12 fill files)
├── DISS-01-A0/citation-fills/            (~? files)
├── DISS-02-A1A2/citation-fills/          (~? files; expanded after REL-001/002/003 relocation work)
├── DISS-03-A3/citation-fills/            (25 fill files; 1 Tier-C Perplexity)
├── DISS-04-EMOTION/citation-fills/       (49 fill files; densest section)
└── DISS-05-A4/citation-fills/            (33 fill files; 5 Tier-C + 2 deep-research essays)
```

**Master cache asset**: `tmp/Dissertation/Pathe/citations/MASTER-CITATION-REPORT.md` (244 verbatim quotations / 17 secondary sources; predecessor work for old `Pathe/§§1.1-1.9` → current §1.4). Phase 3.5 parsed this as a Tier C cache; 92% of §1.4 corpus-routable gaps are cache-hit.

---

## 2. Per-section execution order

Recommended: **§1.0 → §1.1 → §1.2 → §1.3 → §1.5 → §1.4**.

| Order | Section | Fills | Why this position |
|---|---|---|---|
| 1 | §1.0 Introduction | 12 | Lightest; validates workflow before scaling up |
| 2 | §1.1 A_0 Motion/Time | ~? | Foundational, mostly Aristotelian primary-source citations |
| 3 | §1.2 A_1/A_2 Aisthesis | ~? (+1450 words post-REL) | Includes relocated content needing citation coverage |
| 4 | §1.3 A_3 Orientational Modes | 25 | Lanham-aligned; 1 Tier-C Perplexity (Papachristou/Aquinas) |
| 5 | §1.5 A_4 Completed Action | 33 | Has 2 Tier-C deep-research essays — user-mediated sign-off |
| 6 | §1.4 Emotion is Motion | 49 | DENSEST; gold-standard baseline; defer to last so all upstream is settled |

Skip ahead if a section turns out to be blocking-easier and you want a different rhythm.

---

## 3. Per-fill processing — the five tiers

| Tier | Count (overall) | Description | Workflow |
|---|---|---|---|
| **A** | 143 (~69%) | corpus/index routable; verbatim is in local corpus | Read fill proposal → locate target claim → grep corpus/index for verbatim → insert citation + verbatim → verify quote fidelity (70%+ match required per `QuotationFidelityValidator`) |
| **B** | 7 (~3%) | ChromaDB / corpus/download routable | ChromaDB query (collections: `metaphysics`, `new_media`, `rhetorical_ontology`) → extract verbatim → insert |
| **C** | 17 fresh + ~24 cache (~17%) | Perplexity-sourced; not in local corpus | Read Perplexity proposal → **verify against authoritative source (Google Books / JSTOR / publisher site)** → present candidate to user → wait for user verify-and-approve → insert |
| **placeholder ******** | 11 (~5%) | NOT in corpus; user manual fill (RELAXED — see §5 below) | Per relaxed rule: assistant attempts WebSearch fill, inserts with `\textbf{****** UNVERIFIED:}` prefix + audit footnote; user verifies during review |
| **in-text fix** | 29 (~14%) | Typos, Bekker corrections, numbering migrations | Pure mechanical; no external lookup |

---

## 4. Backup discipline (MANDATORY)

Before each section's citation-fill pass:

```bash
TS=$(date +%Y-%m-%dT%H%M)
mkdir -p "tmp/Dissertation/.backups/${TS}-pre-citation-fill-<SECTION_ID>"
cp "<section-file>" "tmp/Dissertation/.backups/${TS}-pre-citation-fill-<SECTION_ID>/"
```

The `MANIFEST.md` in each backup dir records: section ID, fill count expected, batch context.

Per `feedback-backup-before-changes.md` (user's standing rule).

---

## 5. ****** placeholder workflow (RELAXED RULE)

**Standing rule** (`feedback-missing-source-placeholder.md`): When source is NOT in corpus, use `\textbf{******}` as quotation body; user adds verbatim manually.

**Relaxation approved 2026-05-19**: Assistant MAY attempt verbatim fill via WebSearch, provided:

1. The `\textbf{****** UNVERIFIED:}` prefix is retained as a visible verification flag (grep-able + visible in rendered PDF).
2. The candidate verbatim is sourced from an *authoritative web location* (publisher's Google Books snippet, JSTOR DOI, archival edition site). **Never from training data alone.**
3. The audit footnote names the source URL/locus + date sourced + edition info + reminder to remove the `****** UNVERIFIED:` prefix after user verification.
4. If WebSearch surfaces no reliable verbatim, the placeholder remains unchanged (current `\textbf{******}` state) and the entry is flagged in the session-end report.

**Pattern**:

```latex
% Before (current placeholder):
``\textbf{******}'' (BCAP, p.~164).\footnote{Verbatim text to be supplied manually. The passage at BCAP p.~164 develops...}

% After (relaxed-rule fill):
``\textbf{****** UNVERIFIED:} [candidate verbatim sourced via WebSearch]'' (BCAP, p.~164).\footnote{Source: [URL or corpus locus]; candidate sourced on YYYY-MM-DD against [edition info, e.g., 2009 Bloomsbury / Metcalf \& Tanzer]. Verify against printed edition; remove the ``\textbf{****** UNVERIFIED:}'' prefix once confirmed. The passage at BCAP p.~164 develops [brief gloss for context, retained from original placeholder footnote].}
```

**User workflow for verification**: search the source `.md` / `.tex` files for `******` → for each hit, read the candidate + footnote source → verify against your printed edition → delete the `\textbf{****** UNVERIFIED:}` prefix and the source-audit portion of the footnote (keep the conceptual gloss if useful).

---

## 6. Tier-C deep-research essay sign-off

`DISS-05-G-DEEP-CRITICAL-tier-c.md` (Q-016) and `DISS-05-G-DEEP-NOVEL-tier-c.md` (Q-017) in `_per-section/DISS-05-A4/citation-fills/` are Perplexity-generated **philosophical syntheses**, not just citation lookups. Citations within these essays must be *independently verified*.

For Q-016 and Q-017:
1. Read the essay in full.
2. Present claim-by-claim summary to user.
3. Wait for philosophical sign-off before integrating into §1.5.
4. Verify each cited source in the essay before insertion.

---

## 7. Pause-for-user-input triggers

The assistant pauses and surfaces to user whenever:

- A citation-fill **changes the meaning** of a claim (not just supports it)
- A Tier-C deep-research essay claim needs philosophical sign-off
- A Tier-A corpus retrieval produces inconsistent verbatim across candidates (quotation fidelity issue)
- A `******` placeholder's candidate fill comes from a source with pagination uncertainty (e.g., variant editions of BCAP)
- A claim's citation-fill would orphan or contradict existing prose

---

## 8. Per-section completion checklist

Before marking a section's citation marathon complete:

- [ ] All Tier A fills integrated; quotation fidelity ≥70% verified
- [ ] All Tier B fills integrated (or flagged if ChromaDB returned no match)
- [ ] All Tier C fills either integrated (with user sign-off) or flagged for manual review
- [ ] All `******` placeholders either filled with `****** UNVERIFIED:` candidates or unchanged + reported
- [ ] All in-text fixes (typos, Bekker, numbering) applied
- [ ] Footnote count increased proportionally to fill count
- [ ] Section recompiles (user confirms or assistant runs sanity check)
- [ ] Backup created; MANIFEST.md updated with fill counts
- [ ] Memory updated: section's pending citation-fill status → completed

---

## 9. Session-end report template

```
## Citation Marathon Session — §<SECTION_ID> Complete

**Date**: YYYY-MM-DD
**Duration**: <minutes>
**Backup**: tmp/Dissertation/.backups/<TS>-pre-citation-fill-<SECTION_ID>/

### Tier breakdown applied
- Tier A (corpus): X/Y integrated, Z flagged
- Tier B (ChromaDB): X/Y integrated
- Tier C (Perplexity): X/Y integrated (user sign-off received), Z flagged for manual review
- ****** placeholders: X/Y filled with ****** UNVERIFIED:, Z unchanged
- In-text fixes: X applied

### User-action items (must do before pipeline re-run)
- Verify ****** UNVERIFIED: candidates at lines [list]
- Review Tier C deep-research integration (if §1.5)
- [Other section-specific items]

### Compilation status
- [ ] Compiled cleanly
- [ ] Compile errors (list)
- [ ] Compile warnings (list)
```

---

## 10. Final pipeline re-run (POST-marathon)

After all 6 sections complete:

1. Run Phase 0–5 of the dissertation analysis pipeline against the post-citation-marathon state
2. Output to: `corpus/index/Dissertation/_run-history/<new-TS>/`
3. `_living/diff-from-previous.md` will surface:
   - Resolved citation gaps (target: 207 → near 0)
   - Remaining gaps (user-mediated ****** that didn't get fills)
   - Newly introduced inconsistencies (if any)
4. User reviews diff before declaring revision complete.

---

## 11. Related files + memories

- Master roadmap: `corpus/index/Dissertation/_run-history/2026-05-13T1439/_synthesis/revision-roadmap.md`
- Per-section checklists: `_per-section/<id>/revision-checklist.md`
- Citation-gap master: `_synthesis/citation-gap-master.json`
- Tier-C cache: `tmp/Dissertation/Pathe/citations/MASTER-CITATION-REPORT.md`
- Memory: `project-dissertation-analysis-pipeline.md`
- Workflow preferences: `feedback-backup-before-changes.md`, `feedback-corpus-index-first.md`, `feedback-missing-source-placeholder.md` (RELAXED per §5 above)
