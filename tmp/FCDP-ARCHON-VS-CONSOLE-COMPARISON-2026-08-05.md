# FCDP in archon-cli vs FCDP in claudeflow-testing — Comparative Analysis

**Date:** 2026-08-05
**Subjects:**
- **Console FCDP** — `claudeflow-testing/plans/fable-console-drafting-protocol-v2.md` (+ 4 helper scripts)
- **Archon FCDP** — `archon-cli/crates/archon-draft/` (+ `archon-evidence`, `archon draft` subcommand)

**Method:** full read of all 9 Rust source files (3,736 LOC), the gate config, the CLI surface, the
gauntlet decision docs, and the crate's git history. `cargo test -p archon-draft` was run on
2026-08-05: **45 tests, 45 passed, 0 failed** (22 unit · 14 golden · 9 orchestrator).

---

## 1. The headline

These are not two versions of the same artifact. They are **a protocol and its implementation** —
and the implementation has since grown past its specification.

| | Console FCDP | Archon FCDP |
|---|---|---|
| **What it is** | A Markdown document an assistant is told to follow | A compiled Rust engine that executes the protocol |
| **Who executes it** | You + the assistant, turn by turn | `archon draft <pack.json> <workdir>` — one command, no human in the loop |
| **Substrate** | 22 KB prose + 4 scripts (~185 lines Python/TS) | 3,736 lines of tested Rust across 9 files + 2 crates |
| **Determinism** | The assistant's judgment at every step | Gate logic is deterministic and golden-tested; only the drafting/judging calls are model-dependent |
| **Git** | **Untracked**, no history | **Committed**, 11 commits, 2026-07-08 → 2026-07-29 |
| **Tests** | None | 45, all passing |
| **Human control points** | D1 plan approval (default-ON) + read everything | **Zero** — see §6.1 |

The Rust port was never a translation exercise. Three of the seven gates were re-engineered on the
way across, one new gate was added, one was effectively replaced by something stronger, and the
G-A style gate — the console version's known weak point — was rebuilt from scratch on a variance
derivation. The port also **dropped** things the console protocol treats as non-negotiable.

**Where they live matters.** `archon-cli` (branch `feat/wraith-retrieval`) has the FCDP engine.
**`archon-cli-v3` does not** — it has no `archon-draft` and no `archon-evidence` crate at all. Since
the current Lab Boredom boot prompt mandates retrieval from `archon-cli-v3` *only* and drafting under
FCDP, those two mandates necessarily resolve to two different checkouts: v3 for evidence, and either
the console protocol or `archon-cli` for drafting.

---

## 2. Inventory — what actually exists in archon-cli

```
crates/archon-draft/
  src/lib.rs           739   Pack schema · G-P validation · «Qnn» substitution · G-A comparator · repair hints
  src/orchestrator.rs  617   D1→G-1→D1.5→D2→gauntlet→R-loop · prompt assembly · resume
  src/judge.rs         398   G-E + G-G · seeded battery shuffle · fail-closed verdict extraction
  src/fable.rs         394   Model client · FCDP request contract · retry/degrade ladder
  src/provenance.rs    363   SHA-256 hash chain · disclosure-declaration generator
  src/gauntlet.rs      359   G-B/G-C/G-D/G-F mechanical gates · exemplar-leak detection
  src/bin/archon_fcdp.rs 229 Standalone CLI: measure · gp-validate · substitute · ga-gate · run
  tests/golden.rs      315   Python-parity fixtures
  tests/orchestrator.rs 322  Gate/stop-rule/repair-context behaviour
  data/ga-gate-locked-v2.json  Variance-derived two-tier band config (embedded in the binary)

crates/archon-evidence/    3,257 LOC — pack assembly, quote verification, locus re-anchoring
src/command/draft.rs       1,584 LOC — `archon draft` + the guided wizard
src/command/curate.rs      1,004 LOC — evidence-curation → pack bridge
src/command/evidence.rs      604 LOC — `archon evidence find|curate`
```

Two entry points exist: the standalone `archon-fcdp` binary, and `archon draft` as a first-class
subcommand of the main CLI (with a no-argument guided wizard: question → evidence → shape → draft).

---

## 3. Where they agree

The port kept the load-bearing design intact. Everything in this list is materially identical:

- **The pipeline shape** — P → D1 → G-1 → D1.5 → D2 → substitute → gauntlet → R-loop.
- **The pack as sole authority** — no retrieval in the drafting context. The Rust `build_head`
  assembles P1/P3/P8/P9 + quote index + graded evidence + semantics + foundation, in that order.
- **Quotations never generated.** `substitute_quote_ids` in Rust is a faithful port of the Python,
  including all three modes (`«Q1»`, `«Q1+»`, `«Q1@»`) and the same `«([A-Z]\d+)([+@]?)»` grammar.
  The Rust tests pin the exact substitution output.
- **Evidence grades set assertion strength** — the same three grades, enforced by the same G-E
  questions.
- **≤3 revision cycles** — `MAX_CYCLES: usize = 3`, with a `stop_rule_fires_after_three_cycles` test.
- **Judge/drafter separation** — G-E and G-G run with lean per-gate contexts (`build_ctx` builds a
  different context per gate; G-G additionally receives the D1 plan, exactly as FCDP v2 §5 specifies).
- **STOP-AND-SURFACE** as a legitimate terminal outcome rather than a failure — the CLI exits 0 on it.

---

## 4. Gate-by-gate comparison

| Gate | Console | Archon | Verdict |
|---|---|---|---|
| **G-P** | A 6-item checklist you tick | `gp_validate()` — typed, returns (errors, warnings); enforces P4a↔P4b key parity both ways, non-empty lock list, present P9, and **same-day quote verification** (`quotes_verified_at != today` is a hard error) | **Archon far stronger.** The console's "verified this session" is an honor system; Rust makes it a hard gate. |
| **G-1** | Read the plan; ledger closed; no orphan claims | `g1_pass()` — every quote ID and evidence ID must literally appear in the plan text, and "MOVEMENT 3" must be present | **Different, not better.** Archon's is a substring check — mechanical but shallow; it cannot detect an orphan *claim*. |
| **G-A** | 10 fixed ± bands, all hard | Two-tier variance-derived: 5 hard per-section, 9 advisory until 2,500 accumulated words | **Archon substantially better.** See §5. |
| **G-B** | Script exit 0 + your read-through | Exit 0 **plus** four mechanical checks: literal quoted spans in the *pre*-substitution draft, post-substitution spans traced to the bank, leftover markers, unused assigned quotes — with a foundation-allowance for the author's own ≤3-word spans | **Archon far stronger.** The pre-substitution literal-quote check has no console counterpart and closes the one hole the marker mechanism leaves. |
| **G-C** | Read every citation | `cite_re` extracts parenthetical loci, tokenizes on digits, requires each to trace to the pack (index, bank cites, foundation, or evidence), with `--`/en-dash normalization | **Archon mechanizes what was manual**, though it only catches numeric loci in parentheses. |
| **G-D** | ~7 greps + read-through | 7 hardcoded matchers (using `fancy-regex` for the gendered-pronoun negative-lookahead that exempts appositives) **plus** P8 constraints as full regex with quoted-literal back-compat and fail-open on bad patterns | **Archon better and subtler** — the appositive exemption fixes a false-positive class the raw greps produce. |
| **G-E** | A judge call with a 5-question battery | Same 5 questions, **seeded Fisher-Yates shuffle** keyed to `sha256(section_id)`, **fail-closed extraction** (no clean verdict = defect), full transcript recorded | **Archon far stronger.** Order-bias neutralization and fail-closed parsing are real hardening. |
| **G-F** | The 7-step pre-output protocol + forbidden-phrase blacklist + turn-weight gate | Word count vs target band, and an unusual-Unicode check — **both advisories that cannot fail the gate** | **Console far stronger.** See §6.2. |
| **G-G** | A judge call with a 4-question battery | Same 4 questions, same shuffle + fail-closed extraction, and the D1 plan supplied as context | **Archon stronger.** |
| **G-C+** | Optional Crossref/WorldCat check, default-off | Not implemented — **replaced** by `archon evidence verify-bank` running *before* drafting | **Archon's substitute is stronger** (exact-match, source-scoped, pre-draft) but covers primary sources, not the secondary-literature case G-C+ targeted. |

---

## 5. The G-A gate — the biggest substantive divergence

This is where the port diverges most, and where it is most clearly right.

**Console:** ten metrics, each with a fixed ± width, all hard-failing, at any text length.

**Archon:** bands derived empirically from 137 sliding 1,000-word windows across the calibration
corpus, leave-one-out validated, split into two tiers:

| | Metrics | Enforcement |
|---|---|---|
| **Tier 1** (per-section, hard) | `avg_sentence_length`, `nounVerbRatio`, `nominalizationDensity`, `beVerbRatio`, `opacityScore` | Hard fail at any scale |
| **Tier 2** (chapter-scale) | `short_share_lt15`, `long_share_gt30`, `prepositionalPhraseDensity`, `latinateGermanicRatio`, `parataxisHypotaxisRatio`, `periodicRunningRatio`, `preMainVerbClauseCount`, `voiceScore`, `dynamicRange` | Advisory below 2,500 words; hard at chapter scale |

Three consequences worth understanding:

**5.1 The bands are much wider where variance is real.** Console `avg sentence length` is ±3.5 —
a 7-word window. Archon's is `[26.384, 44.756]` — an 18.4-word window. That is not laxity; it is the
correction for the defect the port plan disclosed, namely that the console's fixed widths **reject
three of three of their own calibration documents**. The LOO record in the config is explicit that
holding out the MA document fails `avg_sentence_length` at 38.57 because of genuine 2019-vs-2026
drift, not window noise.

**5.2 The calibration is the *corrected* one.** Archon's `periodicRunningRatio` target is **0.416** —
exactly the clean-MA reference measured after the run-1 discovery that the whole-thesis fingerprint
was contaminated by citation apparatus. The console protocol's §8 still carries the contaminated
0.44/33.7 numbers with a warning note; archon carries the corrected numbers *as data*.

**5.3 Labels are tiered too.** The config's `label_tiering` note records a real bug fix: exact-match
labels had been "smuggling T2 metrics into the T1 hard gate," since `voice`, `parataxisHypotaxis`,
and `periodicRunning` are derived from Tier-2 metrics. Those three now gate only at chapter scale.
The console protocol still says **all categorical labels: exact match**, at every scale — which means
the console gate fails sections on labels the archon gate knows are unreliable at that length.

**5.4 Failures come with instructions.** `ga_repair_hint()` translates a band failure into a
deterministic prose instruction with no model call — e.g. `avg_sentence_length` below floor →
"combine short sentences; add subordinate clauses and appositives to lengthen." The `beVerbRatio`
row even carries a worked example and an explicit warning that state verbs (`exists`, `remains`)
do not move the metric. It fails open: an unrecognized metric yields no hint but never suppresses
the defect. The console has nothing equivalent — the assistant infers the repair each time.

---

## 6. What the console has that archon dropped

### 6.1 Human approval — the significant one

FCDP v2 §2 states that **user approval of the D1 plan is default-ON**, skipped only on an explicit
"draft straight through." The archon orchestrator has **no approval point at all**. `run()` goes
D1 → `g1_pass` → D1.5 → D2 → gauntlet → R-loop → outcome, without ever pausing.

The D1.5 prompt even opens with the literal header `APPROVED MOVEMENT PLAN:` — but nothing approved
it. The label is aspirational; the only thing standing between the plan and the prose is the
substring-matching G-1 check.

The `SURFACE-TO-USER` counterargument disposition survives only as a boolean in the outcome JSON
(`surface_to_user_in_skeleton`), reported *after* the run finishes. In the console protocol, a
SURFACE-TO-USER item stops the pipeline and asks you; in archon it is a note in the receipt.

This is a deliberate trade — a batch engine cannot block on a human — but it means **archon FCDP
enforces the mechanical invariants of the protocol while dropping its deliberative ones.** The
guided wizard (`archon draft` with no pack) restores interactivity at pack-assembly time, but not
at plan approval.

### 6.2 G-F is nearly hollow

The console G-F is the session-degradation defense: the 7-step pre-output protocol, the
forbidden-phrase blacklist, and the turn-weight gate — the machinery specifically built to catch
drift into generic AI phrasing. Archon's G-F is a word-count band and a Unicode-block check, and
**both are advisories** (`pass = defects.is_empty()`, and advisories never enter `defects`). The
blacklist function partly survives via P8 negative constraints under G-D, but the degradation
protocol itself did not cross over.

### 6.3 Three movements, hardcoded

The D1 prompt says "use 3 movements"; `split_movements` takes the first 3; the movement-type array
`["theoretical-exposition", "theoretical-exposition", "transition-argument"]` is fixed. A section
needing four movements, or two, cannot be expressed. The console protocol places no such limit.

### 6.4 Repair is whole-draft, not per-movement

D2 drafts movement by movement, but the R-loop feeds the **entire** assembled draft back for
revision. `repair_prompt` compensates by restating the complete movement plan and warning that a
repair dropping any commitment is a failed repair — but the surface area of each repair is the whole
section, not the defective passage.

### 6.5 Content that stayed behind

Protocol v2 §10 (the six-move introduction structure; the gold-standard roadmap exemplar), the full
twelve-item lock list as prose, and the Part-I register fingerprint have no archon counterpart. G-D
implements only the greppable subset of the locks; the read-through half (*hexis* ≠ habit,
"emotion" not *pathē*, Greek faculty-names italic, no unauthorized coinages) has no mechanization
and no place to live in a pack beyond P3 free text.

---

## 7. What archon adds that the console has no counterpart for

**7.1 A pre-draft verification gate that refuses to run.** Before any drafting, `archon draft`
shells out to `archon evidence verify-bank`, which re-verifies every bank quote against its *cited
source* — source-scoped, so a quote that exists in a different document fails as `WrongSource` — and
accepts **only** exact matches (`NearVerbatim` is rejected). If the archon binary can't be found, it
**refuses to draft** rather than proceeding unverified (exit 3). Bypass requires setting
`ARCHON_DRAFT_ALLOW_UNVERIFIED=1`, which prints a loud warning. The console's equivalent is you
remembering to check.

**7.2 Hash-chained provenance.** Every artifact is recorded as
`sha256(prev_chain_hash + content_sha256 + canonical_json(detail))`, with a `verify()` that
recomputes the whole chain. The canonical-JSON encoder reproduces Python's `json.dumps(sort_keys=True)`
byte-for-byte so a Rust verifier accepts a Python-written chain — pinned by a golden test against a
real 19-record chain. The console's provenance is footer comments and `git diff --no-index`.

**7.3 An auto-generated disclosure declaration.** `provenance::declare()` emits a Declaration of AI
Use from the chain: tools (naming the *resolved* model, with a regression test guarding against the
old hardcoded value), what the model contributed, what it was barred from, human control points,
cycle count, gates run, and the chain head. FCDP v2 §6.3 promises this document; archon actually
produces it.

**7.4 Exemplar-leak detection.** Archon adds P2b voice exemplars to the pack (the port plan's R3
move: exemplar conditioning is better-supported than numeric-target steering) and then gates on
them — any 8-gram shared between the draft and an exemplar is a defect, with bank quotes excluded
from the comparison so legitimate quotations can't trip it. This gate exists because the feature
exists; the console protocol has neither.

**7.5 Surgical repair context.** `repair_context()` maps each defect code to the *minimum* pack
slice that makes it fixable — E4 pulls that quote's index entry, G1 pulls the matching lock, G-D/P8
pulls the tripped constraint — explicitly refusing to dump the whole pack (that would reintroduce
the lost-in-the-middle problem). One deliberate exception is documented in the code with its
reasoning: **E3 pulls the entire evidence bank**, because you cannot show a *boundary* with a subset,
and a partial bank lets the reviser recast an unwarranted claim as an equally ungrounded one that
refires E3 next cycle.

**7.6 Resume.** A run that finds `draft-presub.md` on disk skips D1/D1.5/D2 and resumes at the
gauntlet, so an interruption doesn't re-spend the drafting calls.

**7.7 Pack assembly as software.** `archon evidence curate` / the `/curate` TUI turn corpus
retrieval into a `gp_validate`-clean pack, with locus re-anchoring that narrows a multi-page cite to
the sub-span's true page. In the console workflow, pack assembly is the longest manual step.

**7.8 Genre and length knobs.** `--draft-type section|subsection|chapter|article|note` adds a genre
instruction and a default word band; `--target-words` retunes P1. Both are pure metadata and
explicitly not `gp_validate` invariants.

---

## 8. Divergences that are risks

**8.1 The model default is different, and it contradicts the protocol.** FCDP v2 §0 says *every*
prose and judge step runs on Fable 5. Archon's `DEFAULT_MODEL` is `claude-opus-4-8`, with
`effort: medium` and adaptive thinking as the pinned request contract. The current Lab Boredom boot
prompt also mandates Fable 5 at **xhigh**. So an `archon draft` run left on defaults uses a
different model at a lower effort than the protocol and the live boot prompt both require. It is
overridable (`--model`, `$ARCHON_MODEL`, config), and the declaration honestly reports whichever
model actually ran — but the default is off-spec.

**8.2 Two G-A calibrations are live simultaneously.** The console gates against protocol §8 (or the
clean-MA correction); archon gates against `ga-gate-locked-v2.json`. They disagree on band widths, on
which metrics are hard, and on when labels apply. A section drafted in one and checked in the other
can pass and fail the "same" gate.

**8.3 The Rust FCDP is undocumented outside the code.** There is no `docs/fcdp/` in archon-cli —
despite `Cargo.toml` and `lib.rs` both pointing at `docs/fcdp/README.md`. The only prose is rustdoc
plus three `project-work/` decision documents. Anyone approaching `archon draft` without reading the
crate has no operator's guide.

**8.4 The G-1 gate is weaker than it reads.** Substring presence of every ID plus the literal string
"MOVEMENT 3" is not "no orphan claims; ledger closed." A plan can name every ID and still be
structurally wrong.

---

## 9. Which to use, and when

**Use the console protocol when** the work is deliberative — a section whose plan you want to argue
with, prose whose register you'll judge by ear, a foundation you need to watch beat by beat. That is
the entire current dissertation workload, and it is what the Lab Boredom boot prompt describes.
You keep the approval point, the full G-F degradation defense, and the §10 structural defaults.

**Use `archon draft` when** the work is batch-shaped and the pack is already solid: regenerating a
section after a pack revision, drafting several short subsections, or any run where you want the
verify-bank gate, the hash chain, and the auto-declaration more than you want a plan conversation.

**The hybrid is the strongest configuration available today**, and it needs no new code:

1. Assemble and verify the pack with archon (`archon evidence curate`, then `archon evidence
   verify-bank` — exact-match, source-scoped, which is stronger than any console-side check).
2. Run `archon-fcdp gp-validate` for typed pack validation.
3. Draft in the console under FCDP v2, keeping the D1 approval point and the full G-F protocol.
4. Gate style with `archon-fcdp ga-gate <text> <gate-config.json>` — the two-tier variance-derived
   bands are better calibrated than the console's fixed widths and carry the corrected clean-MA
   targets.
5. Substitute with either implementation; they are byte-equivalent.

---

## 10. Recommendations

**For the console protocol:**
1. **Adopt archon's gate config as the G-A source of truth.** Replace protocol §8's fixed ± bands
   with the two-tier scheme, and note that `periodicRunning`, `voice`, and `parataxisHypotaxis`
   labels are unreliable below ~2,500 words. This retires the standing "suspension density" residual
   as a *failure* — `periodicRunningRatio` is Tier 2, and the observed ~.60 sits just above the
   `[0.337, 0.536]` band rather than being a hard defect against a single point target.
2. **Document the `«Qnn@»` cite-only mode** — both implementations have it; neither doc mentions it.
3. **Adopt the pre-substitution literal-quote check.** It is a two-line grep for ` `` … '' ` in the
   marker file, and it closes a hole the marker mechanism alone does not.

**For archon:**
4. **Add an approval gate** — a `--interactive` flag that prints the D1 plan and waits, and that
   halts on any `SURFACE-TO-USER` in the skeleton. Without it, archon FCDP is not the protocol; it
   is the protocol's mechanical subset.
5. **Change the default model to `claude-fable-5`**, or make the mismatch loud at run start. The
   protocol and the live boot prompt both require it.
6. **Write `docs/fcdp/README.md`.** Two files already reference it and it does not exist.
7. **Make the movement count a pack field** rather than a hardcoded 3.
8. **Port G-F properly** — the forbidden-phrase blacklist and the degradation checklist are the part
   of the protocol most specific to how this project's prose actually goes wrong, and they crossed
   over as two advisories that cannot fail anything.

---

## Appendix — command surfaces

**Console:**
```bash
python3 scripts/substitute-quote-ids.py <draft> <bank.json> <out>
npx tsx scripts/analyze-lanham.ts <file> [profileKey]
```

**Archon standalone (`archon-fcdp`):**
```bash
archon-fcdp measure <file...>                              # sentence axes + Lanham metrics JSON
archon-fcdp gp-validate <pack.json>                        # gate G-P, exit 1 on errors
archon-fcdp substitute <draft> <pack.json> <out>           # «Qnn», exit 1 on unknown IDs
archon-fcdp ga-gate <text> <gate-config.json> [--chapter]  # gate G-A, exit 1 on hard fail
archon-fcdp run <pack.json> <workdir> [--model M] [--gate-config P]
```

**Archon integrated:**
```bash
archon draft <pack.json> [workdir] [--model M] [--gate-config P] [--target-words N|LO-HI] [--draft-type T]
archon draft                          # no pack → guided wizard: question → evidence → shape → draft
archon evidence find "<query>" [--collection C] [--mode M] [--limit N] [--json]
archon evidence curate "<query>" [...] [--target-words N] [--draft-type T] [--out P]
archon evidence verify-bank <pack.json>   # exact-match, source-scoped; the pre-draft gate
```

**Run artifacts** (written to `<workdir>`): `d1-plan.md`, `d15-skeleton.md`, `d2-m{1,2,3}.md`,
`draft-presub.md`, `draft.md`, `draft-presub-r{N}.md`, `draft-r{N}.md`, `provenance.jsonl`,
`declaration.md`, `outcome.json`.

**Build note:** cargo is not on the non-interactive `PATH`. Use
`export PATH="$HOME/.cargo/bin:$PATH"` (and `LIBCLANG_PATH=/usr/lib/llvm-18/lib` for the full
workspace).
