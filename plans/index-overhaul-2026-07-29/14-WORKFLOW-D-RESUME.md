# §14 — Workflow D resumed after the API outage

*Appendix to `00-SESSION-LOG.md`. Written 2026-07-29 ~20:55 UTC.*

## 14.1 Resume executed

The user confirmed the API was healthy and instructed a resume.

Pre-flight: `TaskStop wvvjgtsq1` returned `Task wvvjgtsq1 is not running (status: paused)` — confirming the run was paused rather than live, so a resume could not collide with an in-flight execution.

```
Workflow({
  scriptPath: ".../workflows/scripts/archon-first-index-assessment-wf_d1b488a2-eed.js",
  resumeFromRunId: "wf_d1b488a2-eed"
})
```

| | |
|---|---|
| New task ID | `w2gad09s2` |
| Run ID | `wf_d1b488a2-eed` (unchanged — same journal, appended) |
| Prior results replayed from cache | 42 |
| New agents started on resume | 10 |

The journal moved from 48 `started` / 42 `result` to 58 `started` / 42 `result` within seconds of launch. Cached agents do not re-emit a `started` entry, so the +10 is genuinely new work: the 6 verifiers outstanding at the time of the outage, plus 4 that had never been reached because the pipeline stage they belonged to had not yet run. The synthesis agent runs after all of them.

**Cost of the resume is therefore ~10 agents plus the synthesis, against 48 in the original run.** Nothing was re-authored and no assessor re-ran.

## 14.2 Method note recorded for future sessions

An attempt to poll progress with `sleep 20` between samples failed — **foreground `sleep` is blocked in this environment**. The three samples were taken instantaneously and returned identical figures, which could have been misread as a stalled workflow. The correct approaches are the `Monitor` tool with an until-condition, or simply waiting for the completion notification. Polling a harness-tracked background task is wasted effort in any case, since completion is signalled automatically.

## 14.3 What is still pending on this workflow

- 10 verification agents in flight.
- The synthesis agent, which produces the decision document: recommendation, the case for and against ranked by force, what refuted, an exists-versus-must-be-built table, the migration shape, the cheapest thing that could possibly work, and a sequenced recommendation.

## 14.4 Standing caution carried forward from §13

The eight assessor verdicts are already on disk (7 favourable, 1 strongly opposed), but **the opposed one carries the strongest evidence in the set** and refutes an argument previously given to the user — that the incumbent's 157 TypeScript errors make it a poor foundation. Zero of those errors are in the index layer.

No recommendation should be issued from the verdict tally alone. The pending verifiers were specifically checking the load-bearing claims on both sides, and the synthesis is the artifact to read.
