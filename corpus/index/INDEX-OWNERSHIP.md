# INDEX OWNERSHIP — read before writing anything in this tree

**Declared 2026-07-29 (index-overhaul plan, step A7).**

| Period | Authoring home (writes) | Read replica |
|---|---|---|
| From 2026-07-29 until Phase C completes | `claudeflow-testing/corpus/index` (THIS tree) | `archon-cli/index/` — refreshed ONLY by re-running the A7 manifest-verified transfer |
| From the first entry authored under the locked schema in archon (Phase D) | `archon-cli` (Cozo relations + its index tree) | THIS tree — frozen as reference |

Rules:
1. **One-way, always.** Never edit the replica; never build a two-way sync. The previous
   `archon-cli/index/` fork drifted for 13 days, silently missing three entire entries,
   because it was hand-copied and never verified.
2. **Refresh = re-run the transfer** (rsync + SHA-256 manifest diff of every file, both
   sides). A refresh that skips the manifest diff does not count.
3. **When ownership moves (Phase D), update THIS file in both trees with the date** so no
   future session has to guess which copy is live.

Plan of record: `plans/index-overhaul-2026-07-29/phase1-final-plan/01-FINAL-OVERHAUL-PLAN.md` (§Phase A, step A7).
