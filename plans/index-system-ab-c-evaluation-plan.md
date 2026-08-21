# Index System A/B/C Evaluation Plan

**Created:** 2026-05-01
**Status:** Designed, not yet executed
**Owner:** Dalton
**Working dir for execution:** `/home/dalton/projects/claudeflow-testing/tmp/heidegger-pathos-report/` (or a new `tmp/index-ab-c-evaluation/` directory — TBD at execution time)

---

## 1. Purpose and Background

### What this plan is for

The goal is to evaluate the design and capabilities of two corpus indexing systems by running a controlled three-way comparison (A/B/C) on the same source passage:

- **Index A — Original (document-oriented).** Phase-2-style markdown analysis files (`phase2-*.md`) plus structured JSON manifests (`*-da-04.json`, etc.), Mermaid graph files, Greek appendices, Bekker indexes. Located at `corpus/index/Aristotle - Complete Works/` and `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/`.
- **Index B — New (atom-oriented).** Three JSONL streams per work: `claims.jsonl`, `concept-mentions.jsonl`, `bridge-candidates.jsonl`. Located at `tmp/analysis-upgrade/production-sandbox/data/corpus/index/`.

### Why an A/B/C and not just an A/B

A binary A/B comparison would only reveal that the two indexes are different (which we already know) and would penalize the new index for not doing what it wasn't designed to do (within-work prose synthesis). The three-way design instead reveals:

- What each index can produce *alone*
- What the **fusion** of both indexes uniquely enables
- The *delta* A→C (what the new index adds to a Phase-2-style report) and *delta* B→C (what the original index adds to a new-index-driven output)
- Concrete diagnostic information for next-generation system design — specifically, whether the next-gen original-index pipeline should *consume* the new-index claims as input substrate

### Reframing of the new index's design intent

The new index's primary design goal (clarified during planning) is **cross-author conceptual matching** — identifying when one author's concept (e.g., Aristotle's φαντασία) appears in another author's work under different vocabulary (e.g., Heidegger's *Vergegenwärtigung*, Husserl's *Vergegenwärtigung*/*Bildbewusstsein*, Uexküll's *Merkwelt* construction, Kant's *Einbildungskraft*, modern philosophy-of-mind concepts of mental representation).

This design intent is visible in three structural features of the new index:

- **`bridge-candidates.jsonl`** — the explicit cross-author / cross-claim matching layer
- **`concept-mentions.jsonl`** with `ontology_node` + `ontology_greek` + similarity `score` — concepts hung on a shared ontology so authors using different vocabularies match on the shared node
- **`grounding` + `faithfulness` per claim** — necessary infrastructure for *trust* in cross-author claims (provenance at character level + supported/partial/unsupported verdict)

The new index is therefore *not* a competitor to the original on within-work synthesis. It is **complementary infrastructure for cross-author matching** with grounded, auditable claim chains.

---

## 2. Source Selection

**Primary passage:** *De anima* Γ 3 (the phantasia chapter), Bekker **427a17–429a9**.

### Why Γ 3

- **Self-contained dialectical structure:**
  - Opening aporia (427a17–b27): how to distinguish phantasia from sense, opinion, knowledge
  - Polemical middle (427b27–428b9): phantasia is not any of those
  - Positive definition (428b10–429a9): phantasia as a movement-resulting-from-actual-perception
- **Both indexes cover it:**
  - Original: `phase2-da-04.md` §2.2 (Phantasia, "THE FOCAL CHAPTER" in the original index's own labeling)
  - New: `aristotle-da-3-3/` with claims spanning Bekker 427a1 through 429b1
- **Cross-author potential is high.** Phantasia is one of the most productive bridge concepts in the corpus.

### Cross-author bridge targets (from new-index corpus survey)

**Direct phantasia scholarship (strong coverage):**
- Papachristou 2013 — *Three Kinds or Grades of Phantasia in Aristotle's De Anima*
- Caston 1995
- Nussbaum 1985
- Frede 1992
- Bowin 2017

**Conceptual bridge candidates from analytic philosophy of mind:**
- Fodor 1974 — mental representation
- Chalmers 2016 — qualia / imagination
- Horgan 1993
- Metzinger 2018 — self-models
- Ney 2019

**Limited coverage:**
- Heidegger BCAP — only PDF pp. 25–30 (the Kant intro), *not* the §18c phantasia material

**Absent from new index (would not be available for B/C):**
- Uexküll, Husserl, Kant

### Primary text PDF (read on-the-fly during all three phases)

`corpus/rhetorical_ontology/Aristotle - On The Soul (De Anima)_(2014)_[My Copy].pdf`

---

## 3. Three-Phase Experimental Design

### Process firewall (critical)

To make the comparison honest:

1. **Phase A first.** Build a complete section report using only original-index sources + PDF. Draft fully before opening any new-index file.
2. **Phase B second, with deliberate refusal** to re-read `phase2-da-04.md` during B. Use only new-index JSONL streams + PDF.
3. **Phase C third.** Use both indexes together, with explicit annotation of which index supplied each load-bearing piece.

The firewall between A and B is the most important methodological feature. Without it, B would unconsciously inherit interpretive moves from the Phase-2 prose just internalized in A.

### Phase A — Original-index-only

**Inputs:**
- `corpus/index/Aristotle - Complete Works/phase2-da-04.md` §2.2 (Phantasia)
- `corpus/index/Aristotle - Complete Works/aristotle-da-04.json` (manifest)
- `corpus/index/Aristotle - Complete Works/aristotle-graph-phantasia.mmd` (thematic graph)
- `corpus/index/Aristotle - Complete Works/aristotle-greek-appendix.json` if needed
- The De Anima PDF (PDF pp. ~26–30, corresponding to Bekker 427a–429a)

**Output:** `Report-A-Phantasia-OriginalIndex.pdf`

**Style:** Match the §15/§17/§18 GA 18 PDFs (polytonic Greek + transliteration in parens, italics for transliterations / Latin / German / book titles, curly quotes, blockquotes for primary text, page-citation pages-class).

**Scope:** Within-Γ 3 analysis only. Hierarchical breakdown follows Aristotle's own structure: opening aporia → polemical middle → positive definition. No cross-author lineage in Phase A (the original index does not pre-stage cross-author concept matching).

**Logging:** Record in `AB-C-comparison-log.md` (think-aloud protocol):
- Which sources drawn on at each step
- Where the index let me move quickly
- Where it left gaps I had to fill from PDF or general knowledge
- Where I had to make interpretive judgments the index didn't pre-stage
- Total elapsed time

### Phase B — New-index-only

**Inputs:**
- `tmp/analysis-upgrade/production-sandbox/data/corpus/index/aristotle-da-3-3/claims.jsonl` (79 claims, Bekker 427a1–429b1, PDF pp. 41–44)
- `tmp/analysis-upgrade/production-sandbox/data/corpus/index/aristotle-da-3-3/concept-mentions.jsonl` (319 mentions)
- `tmp/analysis-upgrade/production-sandbox/data/corpus/index/aristotle-da-3-3/bridge-candidates.jsonl` (23 candidates)
- The De Anima PDF
- For Phase B's cross-author layer (see below): `claims.jsonl` and `concept-mentions.jsonl` for each of the bridge-target authors named in §2

**Hard exclusion:** No reading of `phase2-da-04.md` during B. The Phase 2 prose must not be in context when drafting B.

**Output:** `Report-B-Phantasia-NewIndex.pdf` (two parts in one PDF)

**Two-part structure:**
1. *Within-Γ 3 analysis* — synthesized from the atomic claim stream + concept-mentions, with grounding/faithfulness traces preserved as marginal annotations or footnotes
2. *Cross-author phantasia lineage* — the test of the new index's primary design intent. Pull concept-mentions for "phantasia" / "imagination" / "mental representation" / "self-model" / etc. across the bridge-target authors. Surface bridge-candidates that link Γ 3 claims to claims in the bridge-target authors. Where bridges exist, present them with both ends grounded textually.

**Logging:**
- Same think-aloud protocol as Phase A
- Specifically: where the absence of a narrative scaffold forces synthesis effort that would have been pre-staged in Phase A
- Specifically: which bridge-candidates were genuinely useful vs. which had `needsReview: true` flagged correctly
- Faithfulness audit — count claims per faithfulness verdict (supported/partial/unsupported); flag any case where the verdict seems wrong

### Phase C — Fused

**Inputs:** All of A's inputs plus all of B's inputs.

**Output:** `Report-C-Phantasia-Fused.pdf`

**Structure:**
- Same hierarchical narrative shape as A (within-Γ 3 analysis with subsection structure derived from Aristotle's own dialectic)
- Cross-author lineage from B grafted onto the within-Γ 3 narrative at the points where each concept first becomes load-bearing
- Every load-bearing claim in the prose audited against the new-index `faithfulness` field where one is available, so the prose is traceable down to character-level provenance
- Marginal or footnoted annotations indicating which index supplied each load-bearing piece (this is the diagnostic data for the post-mortem)

**Logging:** Where the fusion *uniquely enables* something neither A nor B could produce alone. (Hypothesis: cross-author lineage *with* hierarchical narrative coherence; auditable claim chains in flowing prose.)

### Phase D — Post-mortem

**Output:** `Report-D-Postmortem-AB-C.pdf` and the working log `AB-C-comparison-log.md`

**Five-axis comparison:**

| Axis | What to measure |
|------|-----------------|
| 1. Time to first draft | Elapsed time per phase; where each phase showed slowdowns |
| 2. Citation density and traceability | % of claims in each report that can be traced to (a) a page citation, (b) an exact textual span (Bekker line + matched quote), (c) a faithfulness verdict |
| 3. Narrative coherence | Does each report read as a coherent argument? Can a reader follow the dialectical structure without prior knowledge? Where does each show stress? |
| 4. Cross-author bridge richness | How many cross-author conceptual links surfaced in each? Quality of those links (genuine vs. cosmetic)? |
| 5. Tension / aporia surfacing | How well does each surface genuine philosophical tensions (e.g., the phantasia/aisthesis dependency aporia, the "phantasia is and is not a kind of belief" puzzle)? |

**Concrete recommendations section:** Based on the deltas A→C and B→C, recommend specifically what the next-generation original-index pipeline should consume from the new index, and what (if anything) the new-index pipeline should consume from the original.

---

## 4. Hypotheses to Test

These are predictions to make explicit *before* running the experiment, so the post-mortem can confirm or disconfirm:

### H1 — Phase A will be fastest to draft

The Phase 2 file pre-stages the hierarchical structure, key concepts, and tensions. Drafting should be largely a matter of expanding and quoting from a pre-curated skeleton. *Predicted ratio: A ≈ 0.4× B in elapsed time.*

### H2 — Phase B will be hardest to make narratively coherent

The atomic claim stream has no narrative scaffold. Synthesis effort is pushed onto the writer. *Predicted: B will require the most structural reorganization mid-draft.*

### H3 — Phase B will have the highest citation traceability

Every claim in B has character-level grounding and a faithfulness verdict. A's citations are page-level and unscored. *Predicted: B traceability ≈ 100% at character level; A traceability ≈ 100% at page level only.*

### H4 — Phase B will surface the richest cross-author lineage

This is the test the new index was designed for. *Predicted: B cross-author bridges > A cross-author bridges by an order of magnitude.*

### H5 — Phase C will be uniquely enabled, not just additively better

The C report should produce something neither A nor B could produce alone — specifically, a hierarchically-organized within-work synthesis with grounded cross-author lineage embedded at the points where each concept becomes load-bearing. *Predicted: C delivers cross-author lineage in narrative form, which A cannot do (no atoms) and B cannot do (no narrative).*

### H6 — The next-gen index recommendation will be: feed B atoms into A's narrative pipeline

If the hypotheses above hold, the natural design recommendation is that the next-generation original-index pipeline should *consume* new-index claims as input substrate, with the prose synthesizer pointing to specific high-faithfulness claims rather than to general page citations. This gives prose hierarchy on top, atomic provenance underneath, with programmatic verifiability of every assertion in the prose.

---

## 5. Deliverables

At the end of execution, this directory should contain:

- `Report-A-Phantasia-OriginalIndex.pdf`
- `Report-B-Phantasia-NewIndex.pdf`
- `Report-C-Phantasia-Fused.pdf`
- `Report-D-Postmortem-AB-C.pdf`
- `AB-C-comparison-log.md` — raw think-aloud protocol with timing data
- Source HTML files for each report (so they can be re-rendered)

Total expected size: 4 PDFs at ~150 KB each, plus working log ≈ 30 KB. Roughly 600–700 KB of new artifacts.

---

## 6. Execution Estimates

Rough estimates for execution effort (will be refined during execution):

- Phase A: ~1 hour of synthesis effort (Phase 2 file pre-stages most structure)
- Phase B: ~2.5 hours (no narrative scaffold; cross-author bridge pulls require querying 5–10 author indexes)
- Phase C: ~1 hour on top of A and B (mostly grafting B's lineage layer onto A's hierarchy + provenance audit)
- Phase D: ~30 minutes for the post-mortem given the working log will already capture most of the diagnostic data

Total: ~5 hours of execution time, plus PDF rendering and final review.

---

## 7. Open Questions to Resolve at Execution Time

1. **Output expectation.** Four separate PDFs + working log (preferred for independent comparison artifacts), or one master document interleaving all three reports for easier side-by-side reading?
2. **Scope confirmation.** Full Γ 3 (427a17–429a9), or tighter scope (just the polemical middle 427b27–428b9, where most of the conceptual-distinction work happens)?
3. **Cross-author bridge corpus.** Should B/C draw on all available bridge-target authors, or a curated subset (e.g., direct phantasia scholarship only: Papachristou, Caston, Nussbaum, Frede, Bowin)? More authors = richer comparison but more execution time.
4. **Working directory.** Use existing `tmp/heidegger-pathos-report/` or create new `tmp/index-ab-c-evaluation/`? (Preference: new directory, to keep evaluation artifacts cleanly separated from the §15/§17/§18 deliverables.)
5. **Should the post-mortem include concrete code recommendations** for what the next-generation original-index pipeline should ingest from the new index, or stay at the design-level only?

---

## 8. Prerequisites

Before execution:

- Verify all source files still exist at the paths named in §2 (some files in `tmp/analysis-upgrade/` are in the production sandbox, which may or may not be stable across system updates)
- Confirm the new index's coverage of all bridge-target authors (Papachristou, Caston, Nussbaum, Frede, Bowin, Fodor, Chalmers, Horgan, Metzinger, Ney) hasn't been truncated
- Decide on open questions in §7

---

## 9. Connection to Larger System Improvement Work

This A/B/C is a focused diagnostic, not a replacement for broader index-system review. Its specific output — the post-mortem in §3 Phase D — is intended to feed into the next-generation original-index pipeline design. The deltas A→C and B→C are the actionable diagnostic data.

If H6 confirms (next-gen pipeline should ingest B atoms as substrate for A narrative), the next plan to write would be a *specification* for that fused pipeline: claim-extraction at ingestion time, hierarchical narrative synthesis on top, with the synthesizer pointing to specific high-faithfulness claims.

If H6 disconfirms — if Phase B turns out to be unable to support the cross-author task it was designed for, or if A turns out to be more useful for cross-author bridges than expected — then the recommendations would shift accordingly.

Either way, the experiment yields actionable design data for the system improvement work.

---

## 10. References to Other Plans

- `plans/corpus-index-usage-plan.md` — broader corpus usage strategy
- `plans/aristotle-corpus-analysis.md` — corpus-level Aristotle analysis approach
- `plans/heidegger-bcap-analysis.md` — Heidegger BCAP indexing context
- `plans/god-agent-system-audit.md` — system-level architectural audit (referenced in MEMORY.md)

---

*Plan saved 2026-05-01. To execute: open this file, resolve §7 open questions, then proceed phase by phase with the firewall in §3 strictly enforced.*
