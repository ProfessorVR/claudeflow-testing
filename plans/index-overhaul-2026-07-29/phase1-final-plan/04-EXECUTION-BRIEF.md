# 04 — Execution brief (paste this into the execution session)

You are executing the index/ingestion overhaul for `/home/dalton/projects/claudeflow-testing` (incumbent) and `/home/dalton/projects/archon-cli` (target). The plan is final and authoritative. Your job is **do, verify, proceed** — never redesign, never decide "how."

## Read, in this order

1. `plans/index-overhaul-2026-07-29/phase1-final-plan/01-FINAL-OVERHAUL-PLAN.md` — the plan you execute. Read the Assumptions Register (§AR) and the DO-NOT-TOUCH list before anything else.
2. `plans/index-overhaul-2026-07-29/phase1-final-plan/03-OPEN-QUESTIONS.md` — confirm which decisions I have answered. Phase C1 is blocked on Decision 1; Phase D1 on Decisions 2 and 3; P0.5 on N1. If a blocked phase is next and its decision is unanswered, STOP and ask.
3. `plans/index-overhaul-2026-07-29/phase1-final-plan/02-FINDINGS-TRACEABILITY.md` — the 239-finding matrix. You need it for Phase F2's per-entry defect checklists and whenever a step cites a finding ID.
4. `plans/index-overhaul-2026-07-29/phase1-final-plan/00-REVIEW-OF-DRAFT-PLAN.md` — context for why the plan deviates from the draft; consult when something looks surprising.
5. Only if a step's rationale needs source detail: the draft plan (`../index-entry-creation-plan-CLAIM-LEVEL-2026-07-29.md`, §3–§9 are the record-model spec of record) and the adversarial review (`../index-system-ADVERSARIAL-REVIEW-2026-07-29.md`).

## Standing rules (non-negotiable)

- **Phase 0 (Preserve) runs first, completely, before any other step in any phase.**
- Timestamped backup before any change. Commits/pushes from WSL only. Explicit sign-off with evidence before each commit. **No push without asking.** No multi-agent workflow without explicit per-run permission.
- **Verify every gate.** Every gate in the plan is a command or procedure that CAN FAIL. Run it, capture the output into your session log, and do not proceed past a gate you cannot show passing. If a gate fails, stop and report — do not improvise a fix beyond the step's stated rollback.
- **Execute steps exactly as written.** If the tree does not match a step's precondition (AR1: check the cited line contains the cited text; AR2: `git status corpus/index` vs the recorded snapshot; AR10: concurrent-session drift), STOP and ask before deviating. Any deviation, however small, gets reported before it happens.
- **DO-NOT-TOUCH is absolute:** WRAITH components (removal steps A5/A6 only — never call, revive, or plan around wraith-infer :8100 or the bge-reranker; the eval loss is accepted, do not relitigate), `crates/archon-coder/**` and the coding-agent branches, the user's out-of-band repair files (listed in 01), source PDFs (read-only; A11 may add one), the incumbent compiler beyond step A2.
- **Wraith gate discipline:** G-A5 must run with wraith-infer actually stopped or unreachable — verify with `curl -m 3 http://192.168.50.22:8100/health` failing first. It was still online when the plan was written; do not assume it is off.
- Archon store figures in the plan are **spot measurements** (AR4) — re-measure with the read-only commands given before relying on them.
- Log everything: each step's command, output, gate result, and commit hash goes in a running execution log in this folder (`execution-log-<date>.md`).

## Sequence

Phase 0 (Preserve) → A (stop corruption, wraith removal, transfer) → B (verification path) → C (schema + imports; C1 needs Decision 1) → D (creation-system lock; D1 needs Decisions 2+3) → E (ingestion hardening; E0 measurement first) → F (re-ingest, regenerate, programme acceptance F3). Gates: G0, G-A5, G-A7, G-A, G-B, G-C, G-D, G-E, F3 — in that order, no skipping, each logged.

Report at every phase boundary: what ran, what the gates showed, what is next, and anything that did not match the plan's assumptions.
