# §13 — Workflow D: API outage, exact state, and resume instructions

*Appendix to `00-SESSION-LOG.md`. Written 2026-07-29 ~20:45 UTC.*

## 13.1 The incident

The user reported API errors and a **529 overloaded** response, and **paused the remaining multi-agent workload**. This is the likely cause of the incomplete agents below. No agent failure in workflow D is attributable to a schema or prompt defect on my side — unlike the workflow C failure recorded in §2.1, which was mine.

## 13.2 Exact state — captured and safe

Workflow `archon-first-index-assessment` · task `wvvjgtsq1` · run `wf_d1b488a2-eed`

| | |
|---|---|
| Agents started | **48** |
| Agents with a result on disk | **42** |
| Outstanding (started, no result) | **6** |
| Synthesis agent | **never started** — it runs after all verification completes |

**All 8 top-level assessors completed.** The substantive work survived the outage. Only 6 of roughly 40 verification agents and the final synthesis are missing.

Outstanding agent keys (for reference; a resume matches on these):

```
v2:9ed7bc87c93bab5760255…  af3d658abb458eb45
v2:72f8d2220e494fbf43084…  a69f736d63ea216b4
v2:bb307aa4c4cf3b28fb212…  a70408e0909543f62
v2:d3a12a9eb01ffc08af1ce…  abe24f9457244c5b8
v2:c08edc049935a97485e13…  ab32ae9b61ec2b06f
v2:904c6825c393b779baa61…  a48f7ea770bc99a37
```

Everything is captured in `raw/workflow-journals/D-archon-first.journal.jsonl` (synced 20:41 UTC). The user's observation that the on-the-fly sync would have caught it is correct — the 42 results were already durable before this was written.

## 13.3 Resume — cheap, and safe to defer

**Do not re-run until the user confirms the API is healthy.** When it is:

```
Workflow({
  scriptPath: "plans/index-overhaul-2026-07-29/raw/workflow-scripts/archon-first-index-assessment-wf_d1b488a2-eed.js",
  resumeFromRunId: "wf_d1b488a2-eed"
})
```

Agents whose `(prompt, opts)` are unchanged **replay from cache instantly**. The cost is therefore the 6 outstanding verifiers plus the synthesis — roughly one-seventh of the original run. Nothing needs re-authoring.

Note the script must be run from a path the tool can read; the copy in `raw/workflow-scripts/` is a verbatim duplicate of the session-directory original, which is the one the runtime will resolve.

## 13.4 The 8 assessor verdicts, from disk

| Verdict | Scope |
|---|---|
| STRONGLY-FAVOURS | FCDP drafting-protocol trace — the value side |
| STRONGLY-FAVOURS | `archon-evidence/src/index.rs` reader → producer |
| STRONGLY-FAVOURS | CozoDB storage feasibility at claim/clause scale |
| STRONGLY-FAVOURS | Incumbent consumer impact and the legacy-view shim |
| STRONGLY-FAVOURS | Corpus adapter costing |
| FAVOURS | Evidence-curation state |
| FAVOURS | Engineering health comparison |
| **STRONGLY-OPPOSES** | **Adversarial critic** |

Seven favourable verdicts against one opposed reads as decisive until the opposed one is read. It is not. Its evidence is the strongest in the set, and it refutes an argument I personally made to the user.

## 13.5 The opponent's case — and a claim of mine it refutes

**A build-ready spec for this exact port already exists and has produced nothing in 35 days.** `plans/archon-corpus-index-migration-spec.md` (2026-06-24) specifies `corpus/index` → archon Cozo across nine phases and was endorsed "high confidence." Today `grep -rn 'corpus_entries|corpus_concepts|ensure_corpus_schema' crates/` returns empty, and archon's 942 MB store holds **227 documents, all PDFs, zero index entries**. This is the best available predictor of an archon-first outcome.

**That spec's own framing undercuts the rationale.** At `:19` — *"The substrate is the easy part; ADAPTER COVERAGE is the long pole. The build is gated not by CozoDB mechanics (verified trivial) but by the heterogeneity of ~19 hand-authored entries."* Rust and Cozo buy nothing on the critical path. The long pole is irregular hand-authored markdown, which is where Rust is slowest, and which the 231-agent review explicitly recommended keeping in Python as adapters.

**The two-repo split is not hypothetical — it exists and has already lost data.** `archon-cli/index/` is a checked-in duplicate of `corpus/index/`, 1,731 tracked files, **missing three entire entries** (Presence Theory, Rhetoric of Interactivity and VR, Social Presence in Virtual Worlds — 25 files). Its `compiled-index.json` is 643,548 bytes from Jul 16 against the incumbent's 664,494 from Jul 20, different md5. Sync is manual.

**Archon has no demonstrated delivery capacity right now.** HEAD `8758f2fa` is on **no remote at all** (`git branch -r --contains` → empty), 186 commits unlanded, `origin/main` frozen since 2026-06-13. Last archon commit 2026-07-18, eleven days ago. Meanwhile dissertation drafting touched **26 files on 2026-07-29** and 6 on 07-28. An archon-first decision pauses the active workstream for the dormant one.

**Completion history is poor.** Port #2 was declared COMPLETE on 06-25; an adversarial review then found 21 defects, 17 confirmed, including a byte-versus-code-point token estimator that shifted every chunk boundary on the Greek corpus. The comparable `quote_verify.rs` work, scoped "M–L", took 7 commits across 15 days and is still incomplete on three axes.

**Archon's own pieces are not connected to each other.** `crates/archon-draft` has **no dependency on `archon-docs`** — the drafting protocol cannot call `locate_quote` at all. Two crates, same repo, still unconnected. "Archon already has the pieces" overstates readiness; it argues for calling archon as a *verification service*, not for relocating the overhaul into it.

### The claim of mine that is refuted

I told the user the incumbent is a poor foundation partly because *"157 type errors so `npm run build` cannot succeed"*. The error count is right and the build genuinely cannot succeed — but **zero of those errors are in the index layer**: `corpus-index-provider.ts` 0, `cross-author-utils.ts` 0, `smart-retrieval-layer.ts` 0, `jsonl-loaders.ts` 0. They concentrate in `section-orchestrator.ts` (26) and `__experimental__/*` (45). Fixing the build is an orchestrator cleanup, independent of this overhaul and available without any port. **The index layer being overhauled is type-clean.** That was a load-bearing argument and it does not hold.

### And a sharpening of the cheap path

The char-offset change is **four lines, not two struct fields plus emitters**: `local_range: Option<(usize, usize)>` is already a parameter of `fragment_for` at `quote_verify.rs:371`, destructured at `:374`, and consumed at `:375` and `:391` for page and bbox. The `QuoteFragment` literal at `:405-411` simply omits it.

## 13.6 What the opponent concedes

Recorded for fairness, in its own framing:

- Archon's substrate is genuinely ahead: `doc_chunk_blocks` carries char offsets, `quote_verify` resolves sub-span page and bbox, `archon-evidence/index.rs` is 977 working lines. If the end state truly needs clause anchoring for ~450,000 records, the incumbent must eventually acquire what archon has.
- Doing nothing is not the alternative being argued for. The incumbent's defects are severe, and *"if the cheap-fix path is chosen and then not actually executed, the incumbent degrades further while archon also stalls — the worst outcome of the three."*
- The port-cost estimate extrapolates from one comparable feature and uncalibrated T-shirt sizes. In W29 the user carried 93 commits; with continuous focused time the elapsed figure could compress substantially.
- **Neither repo is an authoritative home for the index today.** The incumbent tracks 335 of 1,759 files with no `.gitignore` rule for `corpus/index`; archon tracks 1,731 but stale. That argues against adding a second compiler, not for either repo as-is.

## 13.7 Status of the recommendation

**My earlier lean toward archon-first should be treated as provisional and probably wrong as stated.** It rested partly on the 157-error argument, which is refuted, and partly on "archon already has the pieces", which is weakened by `archon-draft` having no path to `archon-docs`.

The synthesis has not run and 6 verifiers are outstanding, including verifiers of the opponent's own load-bearing claims. **No recommendation should be issued until the resume completes.** The most likely shape, on current evidence, is not archon-first but *incumbent-first with archon called as a verification service* — but that is an impression from one unverified agent, not a finding.
