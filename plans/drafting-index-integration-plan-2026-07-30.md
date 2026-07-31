# PLAN (DRAFT for review) — Drafting-System Upgrade on the New Index
**Date:** 2026-07-30 · **Status:** future plan, NOT scheduled; queued behind the index-overhaul closure
**Depends on:** F1 full re-ingest (running), Phase-F prose extractors (~5,600 spans), F2 entry regeneration
**Implementation repo:** `/home/dalton/projects/archon-cli` (branch policy + private-remote rules apply)
**Relation to existing systems:** upgrades the FCDP-v2/`archon draft` path; the Phase-B verify gate
(fabricated quotes rejected at the engine boundary) is the foundation this builds on, not a thing this replaces.

## Goal

Move the drafting system from *quote-verified* to *argument-verified*: packs that carry the
dialectical structure of the index (claims, warrants, edges, tensions), and a gauntlet that checks
argumentative construction as machine queries, not narration. The index's granularity (byte-anchored
clauses, typed reasoning edges, 119 tensions, debate axes) makes each of these a traversal problem.

## Phase 1 — Argument-scaffold packs

Replace the flat evidence pack with a structured argument pack assembled from `corpus_*`:

- Input: a section brief (topic, thesis move, target sources). Assembler queries claims for the
  scoped sources/entries, orders them by locator, attaches each claim's anchored clauses (exact
  anchors only; near-verbatim flagged), and includes the reasoning edges among included claims.
- Include the *opposition*: tensions and counter-claims touching the scoped claims, explicitly
  marked as must-address-or-waive.
- Emit in chain-node form (A₁→A₄ walkthrough skeleton) — the fundamental analytical form per the
  user's standing Note to System — so the model drafts inside the scaffold, never inventing structure.
- Rights: rendering respects `rights_tier` + `redact_on_render`; word ceilings on rendered output only.
- Acceptance: a pack for a known section (e.g., a Lab Boredom subsection) round-trips — every pack
  quote re-verifies exact; every included edge resolves; opposition list matches a hand query.

## Phase 2 — Argument gates in the gauntlet

Extend `scripts/checkers/` + the drafting gauntlet with three typed gates (config-thresholded,
missing checker = FAIL, same discipline as the D-phase suite):

1. **Claim-mapping gate:** every asserted claim in a draft maps to a store claim id OR is flagged
   `novel` (novel is allowed; unflagged is the failure).
2. **Tension-coverage gate:** every tension whose scope intersects the pack must be addressed in
   the draft or carry an explicit waiver line in the section header.
3. **Warrant-completeness gate:** every draft sentence that cites does so via an anchor that
   re-verifies (`match_kind=="exact"`; near-verbatim requires the annotation to be rendered).
- Acceptance: gates run red on seeded violations (fabricated claim, ignored tension, drifted quote)
  and green on a compliant draft; wired into `emit_gates.py` output.

## Phase 3 — Draft→index round-trip

- Post-draft extraction: parse the accepted draft's asserted claims; `novel` claims become
  *candidate index rows* (quarantined authoring queue, not auto-committed — entry authoring
  happens in archon per INDEX-OWNERSHIP.md, but through the D-gates, never silently).
- This closes the loop: drafting thickens the index; the index disciplines drafting.
- Acceptance: one full cycle on a real section with zero manual JSON authoring.

## Phase 4 (second-order, optional) — Local extractor model

- Fine-tune (QLoRA, 7–14B, RTX 5090-local) an *extractor*, not a drafter: claim identification,
  quote span extraction, locator emission. Training data mined from the index's verified pairs
  (claim ↔ exact-anchored clause ↔ locator); synthetic examples generated then **filtered by the
  verify gate** — only samples whose quotes re-anchor exactly enter the training set
  (hallucination-free by construction).
- Role boundary (BINDING, per LLM-routing directive): academic prose stays on Anthropic Claude;
  the local model serves extraction/verification/mechanical middle only. Model artifacts are
  local-research-only (trained on copyrighted corpus texts — never distributed).
- Acceptance: extractor ≥ parity with the Phase-F script extractors on a held-out entry, measured
  by exact-anchor rate after C8-style verification.

## Constraints (standing)

- No WRAITH anything; no reranker relitigation. Ultracode OFF; no multi-agent Workflows without
  per-run permission. Commits/pushes: WSL only, ProfessorVR/archon-cli-private only.
- Verification-gated workflow: evidence shown, user signs off before commits.
- The gauntlet's existing 7 gates and the Phase-B engine-boundary verify gate are floors, not
  replaceable parts.

## Open questions for the review round

- Q1: Pack scoping unit — per-section brief vs per-entry vs per-tension? (Recommend: section brief.)
- Q2: Where does the candidate-claim queue live — `corpus_claims` with a `status=candidate` column
  vs a separate relation? (Recommend: separate relation, promoted by D-gate pass.)
- Q3: Does Phase 4 wait for F2 completion (thicker training set) or start on the current 3,181
  exact anchors? (Recommend: wait; the extractors themselves generate more training pairs.)
