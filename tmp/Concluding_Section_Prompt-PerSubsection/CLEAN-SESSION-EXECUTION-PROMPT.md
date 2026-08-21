Execute the subsection-mode implementation plan for /god-write.

## What you're doing

The plan adds a new `--subsection-mode` flag to `/god-write` that enables high-quality generation of single focused LaTeX subsections at 400-1500 words, while leaving the existing gold-standard pipeline (3000-3500w multi-section documents) untouched. The plan is fully designed; you're executing it.

## Read first (in this order, before any action)

1. **The plan itself:** `plans/subsection-mode-design.md` — 9 phases, 4 approval gates, ~7-10 hours of work
2. **The associated memory note:** `~/.claude/projects/-home-dalton-projects-claudeflow-testing/memory/project-analysis-upgrade-subsection-mode-integration.md` — explains how subsection-mode integrates with the (not-yet-promoted) analysis-upgrade work
3. **The failed-attempt evidence** (do not re-run; just understand what broke and why):
   - `tmp/Dissertation/Working tex versions/persubsection-runs/failures/01-A4-attempt1-prelude-first.tex` + `.log`
   - `tmp/Dissertation/Working tex versions/persubsection-runs/01-A4.tex` (delta-first failure)
4. **The reference working output (versionB):** `tmp/Dissertation/Working tex versions/1.5 - A4 - Three Types of Action-v2-versionB.tex` — this is the rolling-context baseline that regression tests must not break
5. **The updated per-subsection workflow:** `tmp/Concluding_Section_Prompt-PerSubsection/00-MASTER-WORKFLOW.md` — this is what subsection-mode will eventually be tested against (Phase 9 of the plan)

Your auto-loaded MEMORY.md already has the entry "Subsection-mode design (2026-05-25, PLAN AWAITING APPROVAL)" pointing to these files. The advisor-rigor rule for Gross, backup-before-changes convention, and `/god-write` routing rule are also in your memory.

## Hard rules

- **Phase 0 is non-negotiable.** Do not modify any source file before Phase 0 (comprehensive backup) is complete, manifested, and the user has cleared Gate B. The plan's Phase 0 lists every file that must be backed up, every reference output that must be snapshotted, the two golden-test runs that must be captured pre-change, and the git tag that must be created.
- **Stop at every gate.** Gate A (plan review — already cleared by the user before this session), Gate B (after Phase 0 backup), Gate C (after Phase 7 smoke test), Gate D (after Phase 9 coherence pass). Wait for explicit user approval to proceed past each gate. Do not chain phases through gates.
- **Additive only.** The plan branches new behavior behind `if (options.subsectionMode)` checks. The default (no-flag) path must produce byte-identical output to pre-change. Phase 8 regression tests verify this; if they fail, roll back and diagnose before continuing.
- **Smoke-test before bulk.** Phase 7 runs subsection-mode on subsection 1 ONLY. Do not run Phase 9 (all 9 subsections + coherence pass) until Phase 7 passes its acceptance criteria AND the user clears Gate C.
- **One commit per phase.** If a phase breaks regression, revert that single commit cleanly.
- **The user's MEMORY.md feedback files are load-bearing.** Honor `[[feedback-backup-before-changes]]`, `[[feedback-plan-review-process]]`, `[[feedback-gross-advisor-citation-rigor]]`, and `[[feedback-major-iterations-on-copies]]`. Do not assume — read them if unsure.

## Working environment

- Branch: `writing-pipeline-v2` (current HEAD will be captured in Phase 0)
- Main branch for eventual merge: `main`
- Project dir: `/home/dalton/projects/claudeflow-testing`
- `/god-write` is the CLI at `src/god-agent/universal/cli.ts`
- Services (vLLM 8002, Embedding 8000, ChromaDB 8001, Observe 3847) may need to be running for golden-test runs in Phase 0; check status with `./scripts/god-launch status`

## What to do FIRST in this session

1. Read `plans/subsection-mode-design.md` end-to-end. Do not skim.
2. Read the two related files listed above (memory note + master workflow).
3. Confirm to the user: "I've read the plan and ancillary docs. Ready to execute Phase 0 (comprehensive backup). Phase 0 will create `backups/subsection-mode-pre-impl-<timestamp>/` with all listed files + 2 golden-test JSON outputs + git tag + RESTORE.sh + MANIFEST.md. No source files will be modified in Phase 0. Approve to proceed?"
4. Wait for explicit user approval before starting Phase 0.
5. After Phase 0 completes, present the MANIFEST.md to the user and wait for Gate B clearance before starting Phase 1.

## What to do if you get stuck or uncertain

- Re-read the relevant phase section of the plan
- If still uncertain, ASK the user — do not improvise on the design
- If a phase's acceptance criteria fail, STOP and report — do not chain failures forward
- If a regression test (Phase 8) fails, ROLL BACK to the backup tag (`git reset --hard pre-subsection-mode-<date>` + restore TypeScript files from `backups/.../typescript-files/`) and diagnose before retrying

## Out of scope for this session

- The analysis-upgrade promotion (separate work stream; see the memory note)
- The dissertation §1.5 final-version production (that's Phase 9 / versionC, which depends on subsection-mode being live)
- Any changes to the rolling-context code path (versionB must remain reproducible)

Begin by reading the four "Read first" docs. Then confirm and request approval to start Phase 0.
