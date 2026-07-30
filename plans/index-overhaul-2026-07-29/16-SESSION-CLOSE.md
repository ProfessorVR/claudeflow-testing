# §16 — Session close: final state and handoff to Phase 1 (Fable)

*Written 2026-07-29 at session end. This is the last entry. Everything below is verified as of writing.*

---

## 16.1 State of the world

**Nothing was committed. Nothing was pushed. No branch was created.** Both repositories remain on `feat/wraith-retrieval` (last checkout in each: 2026-07-17, before this session).

| | |
|---|---|
| `claudeflow-testing` HEAD | `6cb0f563b` |
| `archon-cli` HEAD | `8758f2fa` (binary used for measurement: `archon 1.3.11 (7b44c665)`) |
| Files modified by this session under `corpus/index` | **none** |
| Files modified by this session under `scripts/` or `src/` | **none** |
| Archon store writes | **none** — read-only subcommands only |
| Deletions performed | 2, by explicit instruction: the duplicate plan and review at `plans/` root |

The `corpus/index` changes present in `git status` are the user's own concurrent anchor repair (§11), not mine.

---

## 16.2 Deliverables

All in `plans/index-overhaul-2026-07-29/`.

| File | What it is |
|---|---|
| `index-entry-creation-plan-CLAIM-LEVEL-2026-07-29.md` | **The plan.** Opens with a HANDOFF block: the three decisions, the provenance caveat, reading order, corrections to apply |
| `index-system-ADVERSARIAL-REVIEW-2026-07-29.md` | Consolidated findings across all four workflows, including §6, the honest record of what did not survive verification |
| `00-SESSION-LOG.md` | Narrative and state. §10 corrects a drift-testing error I repeated several times |
| `11-ANCHOR-REPAIR-2026-07-29.md` | The user's concurrent repair, recorded verbatim, and why it demonstrates requirements E10 and G19 |
| `12-STALENESS-SWEEP-2026-07-29.md` | The G19 gate run by hand: 10 stale files found where memory found 3 |
| `13-WORKFLOW-D-INCIDENT-AND-STATE.md` | The API outage, exact recovery position, and the opponent's case |
| `14-WORKFLOW-D-RESUME.md` | The resume, and the blocked-`sleep` method note |
| `15-ARCHON-FIRST-VERDICT.md` | The repo decision, its refutations, and corrections to my own reporting |
| `16-SESSION-CLOSE.md` | This file |
| `raw/`, `extracted/`, `sync-evidence.sh`, `sync.log` | Verbatim agent returns, prompts, parsed data, and the re-sync script |

`13-BOOT-PROMPT-STALENESS-REPAIR-2026-07-29.md` is the user's, from a parallel session. Left untouched. Note the `13-` prefix collision, and several `:Zone.Identifier` files from the Windows file move — both harmless.

---

## 16.3 Corrected totals — use these, not the earlier ones

The figure "231 agents / 16.6M tokens / 1,111 findings / 145 verified" appears in earlier drafts and in the first version of the Phase 1 prompt. It covers three of four workflows. Correct:

| Workflow | Agents | Tokens | Findings | Verified | Refuted |
|---|---|---|---|---|---|
| A — 27 entries | 106 | 9.18M | 551 | 93 | 4 |
| B — index code | 73 | 5.61M | 353 | 63 | 7 |
| C — creation plans | 52 | 3.10M | 207 | 43 | 13 |
| D — archon-first | 49 | 2.92M | 181 | 40 | 16 |
| **Total** | **280** | **20.81M** | **1,292** | **239** | **40** |

199 confirmed, 40 refuted. A traceability matrix scoped to 145 would omit 94 findings including all of workflow D, which is where the repository decision lives.

Workflow E (ingestion production-readiness) was **cancelled by the user mid-flight**: 8 agents started, 0 returned. Its journal is empty by cause, not by loss.

---

## 16.4 What changed after the audit closed

Recorded because a finalising session will otherwise read the plan as if it were the audit's direct output. It is not — five user directives reshaped it.

1. **archon-cli is the target repository.** The user is migrating to archon as their primary agent. This **supersedes `15-ARCHON-FIRST-VERDICT.md`'s recommendation** to keep authoring adapters in Python.
2. **Index first, ingestion second.** Interim errors accepted.
3. **Full re-ingestion and full regeneration are sanctioned**, provided the result is a better entry. Recorded as the regeneration contract at §0.2.1 — it converts the Cozo column set from a one-way door into a redo cost, and leaves the hand-authored judgment as the only irreversible asset.
4. **Transfer the current index into archon** before work starts there — §12.1, one-way and manifest-verified, because the existing `archon-cli/index/` fork is 13 days stale and missing three entire entries.
5. **Preserve the hand-authored entries and the half-completed gold set** — §12.0, now step A1.

---

## 16.5 The three decisions

Stated in full at §13.1–13.3 and summarised in the plan's HANDOFF block.

| # | Decision | Blocks |
|---|---|---|
| 1 | Does a rights-tiered storage/display split replace the blanket 25-word verbatim ban? | Phase C1 — `rights_tier` and `redact_on_render` are columns |
| 2 | Confirm the density band of 15–35 records per 1,000 source words | Phase D1 — every gate threshold derives from it |
| 3 | Confirm debates, intra-cluster citations and the evolution arc move to an optional GROUP layer | Phase D1 — it is what lets a single-article entry pass |

---

## 16.6 Review of the Phase 1 prompt — recommendations, recorded

The user drafted a prompt for the Fable session and asked for review. The recommendations, so they survive this session:

**Must fix.** The agent/token/finding counts are the three-strand figures and the "145 verified" completion gate would stop Fable at ~60% of the set (§16.3). And the five binding directives in §16.4 exist **only inside the draft plan**, which the prompt tells Fable to critically review — they need to be stated in the prompt as settled, or Fable will plan for the wrong repository.

**Should fix.** Ingestion reads as out of scope but is in scope and merely sequenced later; archon's ingestion has never been audited and every figure about it is my own spot measurement, which should be labelled as such. Pre-flag the one real Wraith ambiguity: **archon's retrieval uses the wraith-infer service at `:8100` and `bge-reranker-v2-m3`**, and the recorded eval says the reranker was the win while raw 1536 embeddings were a regression — so "Wraith in its entirety" needs a ruling on whether the inference service goes too. Tighten "Everything in ARCHON relating to the agent-coding stack" so it cannot be read as abandoning archon-cli. And state that preservation must be step 1 of the *execution* plan, since a read-only phase cannot perform it.

**Worth adding.** Point Fable at the 40 refutations as high-value reading — 13 were causal inversions and one corrected a bbox-coverage figure I had reported as 40/40 to a true 68%. Restate the dirty-tree caveat. Note the cancelled workflow E, the `13-` prefix collision and the `:Zone.Identifier` files. And tell Fable the three decisions already exist so `03-OPEN-QUESTIONS.md` starts from them rather than rediscovering them.

**One push-back.** "Trust the verified findings; reanalyze only where they conflict" is sound except for archon's ingestion and live store, where the archive contains spot checks rather than audited findings. Carve out an exception permitting read-only measurement there, logged as such.

---

## 16.7 First actions for the execution session, whenever it comes

Independent of every open decision, and none of them performed here:

1. **Preserve.** `git add corpus/index` (1,522 untracked files); secure `data/gold/` mid-annotation and the 4,961-claim corpus; get one copy off this machine. The only irreversible losses in the programme.
2. **Transfer** the index into archon, manifest-verified, replacing the stale fork.
3. **Stop the fabrication.** `gold-standard-prompt-builder.ts:712-716` currently emits a bridge naming an author called `Unknown` followed by an instruction that both authors must be cited with direct textual evidence, firing on most topics because `t.includes('')` is always true.
4. **Fix `ig-10-incorporation.json`** — one character, and it is the last unparseable JSON of 494.

Standing rules throughout: timestamped backup before any change, commits and pushes from WSL only, explicit sign-off with evidence before each commit, no push without asking, and **no multi-agent workflow without explicit per-run permission**.
