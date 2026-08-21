# Writing Pipeline v2 Completion Plan

Branch: `writing-pipeline-v2`
Created: 2026-04-09
Predecessor: `tmp/next-session-plan.md`

## Prerequisites

Rollback anchor: `d249301de` (logging cleanup + multi-prompt harness), parent `d6986c803` (comprehensive hardening). Confirm HEAD matches before running tests:

```bash
git log --oneline -1  # expect d249301de
curl -sf http://localhost:8000/ && echo "Embedding OK"
curl -sf http://localhost:8001/api/v2/tenants/default_tenant/databases/default_database/collections && echo "ChromaDB OK"
npx tsx scripts/verify-hardening.ts
```

All 77 verification tests must pass before proceeding. If HEAD differs from the anchor, reconcile before continuing.

## Dependency Graph

```
Task 1 (multi-prompt completion)
  |
  v
Task 3 (citation coverage assessment)  <-- BLOCKED on Task 1; do not start until all 4 profiles are in the matrix
  |
  v
Task 4 (optional backlog) <-- only if Task 3 or regression results surface a need

Task 2 (god-write parity) -- independent of Tasks 1/3, can run in any order
  |
  v
Task 2b (god-write regression matrix schema) <-- columns finalized only after Task 2 determines which quality gates fire
```

---

## Task 1: Complete Multi-Prompt Regression Matrix

**Goal**: Run the remaining 2 profiles to produce a complete 4-profile regression matrix.

**Commands**:
```bash
npx tsx scripts/icp-multi-prompt-test.ts multi
npx tsx scripts/icp-multi-prompt-test.ts secondary
```

**Results append to**: `tmp/prompt-regression-matrix.md`

**What to watch — multi (Burke + Rickert + Heidegger)**:
- Do bridges fire between all 3 authors?
- Does citation coverage stay within the 1.8–10.9% band established by the first 2 profiles, or diverge?
- Any unauthorized author hallucinations beyond the 0–2 range already seen?

**What to watch — secondary (Frede + Caston + Nussbaum)**:
- Does SOURCE_PRIORITY correctly rank these as secondary scholarship?
- Does the authority-tier distinction hold (secondary authors cited differently from primary)?
- Does citation coverage spike or collapse relative to the existing band? This is the profile most likely to stress authority tiers differently.

**Pass criteria**:
- Edge coherence = 1.00 (consistent with prior runs)
- Unauthorized authors <= 2
- No crashes or timeouts
- Citation coverage recorded (value itself is assessed in Task 3, not here)

**Fail response**: If either profile crashes or shows edge coherence < 1.00, diagnose before proceeding. Do not move to Task 3 with incomplete data.

---

## Task 2: God-Write Path Parity Check

**Goal**: Verify that shared infrastructure (cross-author-utils, jsonl-loaders, quality-integration) is correctly wired in the god-write path.

**Test prompt**: "The role of phantasia and Erschlossenheit in disclosing the environment"

**Method**: Run `/god-write` with the above prompt, then inspect logs and output.

**Checklist**:

1. **Query expansion** — logs should show `[SmartRetrievalLayer] Query expanded:` with canonical terms from `cross-author-utils.ts`
2. **Hook injection** — the assembled prompt should contain the `[6d] MANDATORY THEORETICAL SYNTHESIS` block from `gold-standard-prompt-builder.ts`
3. **Final directive** — `<final_directive>` should appear at the end of the prompt
4. **Output quality** — generated prose should contain:
   - Parenthetical citations (Author, Year) format
   - Cross-author references (the prompt spans Aristotle + Heidegger)
   - Tension acknowledgment where sources disagree

**Determine**:
- Does `quality-integration.ts` (validateEdgeCoherence, validateTensionAwareness, detectUnanchoredEdges) run in the god-write path?
- If yes: edge coherence and tension columns belong in the god-write regression matrix.
- If no: document the gap. Assess whether adding these gates is warranted or whether [6d] static hook injection is sufficient for god-write's use case.

**Note**: God-write does NOT have ICP Stage 6b (bridge enforcement) or Stage 8a (preventive coherence). This is expected. The question is whether the existing infrastructure is sufficient, not whether ICP-specific stages should be ported.

### Task 2b: God-Write Regression Matrix Schema

**Blocked on**: Task 2 findings (which quality gates fire in god-write).

**Create**: `tmp/god-write-regression-matrix.md`

**Confirmed columns** (present regardless of Task 2 findings):
| Column | Source |
|--------|--------|
| Prompt | test identifier |
| Word count | section word targets |
| Sections | structural completeness |
| Citations (count + %) | parenthetical citation count / total sentences |
| Cross-author refs | bridge presence in prose |
| Unauthorized authors | authors not in manifest |
| Query expansion terms | canonical boosting from SmartRetrievalLayer |
| Time | wall-clock seconds |

**Conditional columns** (add only if Task 2 confirms the gate runs in god-write):
| Column | Gate |
|--------|------|
| Edge coherence | validateEdgeCoherence |
| Tension | validateTensionAwareness |
| Unanchored edges | detectUnanchoredEdges |

---

## Task 3: Citation Coverage Assessment

**BLOCKED ON TASK 1** — Do not begin until all 4 profiles are recorded in `tmp/prompt-regression-matrix.md`.

**Goal**: Decide whether 10–20% parenthetical citation coverage is acceptable for draft-stage output that will be manually enriched.

**Inputs**:
- All 4 rows from `tmp/prompt-regression-matrix.md`
- Qualitative review of generated prose from regression runs (not just the numbers)

**Questions to answer**:
1. Is the 1.8–10.9% band (or whatever the final 4-profile range is) adequate for a draft that gets manual citation enrichment?
2. Does the secondary-scholarship profile materially differ from the others? If coverage collapses below 1% or spikes above 25%, that signals a tier-specific issue worth investigating.
3. Is the distribution of citations even across sections, or clustered in introductory/concluding paragraphs?

**If coverage is acceptable**: Document the decision and rationale. No tuning needed.

**If coverage is too low**: Consider these levers in order of invasiveness:
1. Lower `claimMinTopicOverlap` from 0.3 to 0.15 (least invasive)
2. Add a per-paragraph citation injection pass (moderate)
3. Revisit closed-book constraint strictness (most invasive, highest risk of hallucination)

Do not apply any tuning without first running a single-profile A/B comparison to measure the delta.

---

## Task 4: Optional Backlog (Evidence-Gated)

**Only execute if regression results or god-write testing surface a concrete need.**

| Item | Trigger |
|------|---------|
| Task #47: Levenshtein fuzzy matching | Regression runs show title-matching failures in logs |
| Per-chunk OCR scoring | Only when ingesting new texts into the corpus |

If no trigger surfaces during Tasks 1–3, these remain deferred. Do not execute speculatively.

---

## Artifacts Produced

| Artifact | Task | Location |
|----------|------|----------|
| Complete 4-profile regression matrix | 1 | `tmp/prompt-regression-matrix.md` |
| God-write parity findings | 2 | Logged in session; summarize in plan update |
| God-write regression matrix (empty template) | 2b | `tmp/god-write-regression-matrix.md` |
| Citation coverage decision | 3 | Logged in session; update this plan |

## Session End

Update `tmp/next-session-plan.md` with:
- Which tasks completed
- Any findings that change the plan
- What to do next
