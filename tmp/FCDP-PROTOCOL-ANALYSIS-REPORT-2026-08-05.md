# FCDP — Analysis Report and Operator's Guide

**Subject:** The Fable Console Drafting Protocol (FCDP)
**Date:** 2026-08-05
**Scope:** purpose · mechanism · a working how-to guide · verified defects
**Method:** read of both protocol documents, both real-run SITREPs, the four tool scripts, the
stored style profile, the archon port plan, and the current Lab Boredom boot prompt. Every command
and file path below was checked against the working tree on 2026-08-05.

---

## 1. Executive summary

FCDP is a **gate-enforced, human-in-the-loop drafting protocol** for producing dissertation prose
in the Claude Code console. It is not a program you run; it is a document the assistant is told to
follow, which walks a fixed sequence of stages with approval points and mechanical checks.

Its purpose is narrow and worth stating plainly: **it makes the two failure modes that matter in
academic drafting structurally impossible rather than merely discouraged.** Fabricated quotations
are impossible because the drafting model never writes quoted text — it writes an ID marker that a
script substitutes afterward. Fabricated citations are impossible because retrieval is banned
during drafting, so anything not in the pre-assembled evidence pack becomes a `******` placeholder
instead of a plausible invention. Everything else in the protocol — the style gate, the skeleton
stage, the judge calls — is quality machinery layered on top of those two guarantees.

It has been run end-to-end twice, on real dissertation sections, and both runs caught real defects
that a straight drafting pass would have shipped. It works. It also has four verified defects of
its own, listed in §8, one of which (a broken command in the public-facing document) will stop a
new user at the first step.

---

## 2. Purpose — what problem it solves

### 2.1 The origin

FCDP was created 2026-07-02 to replace `/god-write` for dissertation prose. `god-write` was a
fire-and-forget pipeline: one command, a multi-step internal orchestration, prose out the far end.
Two things were learned from it, and both are load-bearing in FCDP's design:

1. **The embedded pack is what made god-write work.** The winning god-write configuration was
   *no-corpus, no-multistep, embedded-pack*. The material handed in explicitly outperformed
   anything the system retrieved for itself.
2. **Corpus retrieval actively harmed the drafts.** Retrieval overrode the pack with junk. This is
   why RAG is *banned* from FCDP's drafting context — not deprioritized, banned.

FCDP therefore keeps god-write's two proven assets (the embedded pack; style-profile targeting)
and adds the enforcement the pipeline never actually performed.

### 2.2 What it is for

| It is for | It is not for |
|---|---|
| Drafting or redrafting a dissertation section in a trained voice | Research, retrieval, or discovery |
| Prose that must carry verified quotations and loci | Quick notes, code, correspondence |
| Work where authorship provenance must be auditable | Anything you'd accept unreviewed |
| Building on an existing draft without silently losing its content | Generating claims you haven't already evidenced |

The protocol's own framing: *the model contributes phrasing, structure, and analysis of
pack-supplied evidence; it may not introduce claims beyond the evidence bank, may not invent or
recall citations, and every quotation enters by ID substitution only.* That sentence lives in the
pack itself as field P9, and doubles as the source text for the dissertation's eventual LLM-use
disclosure statement.

### 2.3 The four invariants

These are the rules that do not bend, in either version of the protocol:

1. **The pack is authoritative.** No corpus retrieval, no ChromaDB, no god-learn context during
   drafting. Not in the pack → not in the draft → it becomes `******`.
2. **Quotations are never generated.** They enter by mechanical ID substitution only.
3. **Source documents are never modified.** New prose to fresh `*-DRAFT-vN` files; revisions on
   copies; timestamped backups; commits only after sign-off.
4. **The stored fingerprint is the style target.** Every draft is measured against it before the
   author sees it.

---

## 3. The two documents — which one is canonical

There are two FCDP documents, and they are not the same protocol. **This is the first thing to get
right**, because they disagree on tooling and on where the style target comes from.

| | `plans/fable-console-drafting-protocol-v2.md` | `FCDP-DRAFTING-PROTOCOL.md` (repo root) |
|---|---|---|
| Last modified | 2026-07-20 | 2026-07-24 |
| Audience | This dissertation | Any user, any project |
| Length | 22 KB, 10 sections | 10 KB, 8 sections |
| Style target | Hardcoded fingerprints in §8 (MA voice, Part-I voice) | A trained profile key you supply |
| G-A command | `strip-latex-for-lanham.py` → `tmp/analyze-style-lanham.ts` | `scripts/analyze-lanham.ts <file> <profileKey>` |
| Carries the lock list | Yes (§7 — 12 terminology locks) | No (P3 is "whatever rules you set") |
| Carries intro structure defaults | Yes (§10, added 2026-07-20) | No |
| Judge-gate detail | Full binary batteries specified | Summarized |

**Verdict: `plans/fable-console-drafting-protocol-v2.md` is canonical for dissertation work.** It
is the version both real runs used, the version the current Lab Boredom boot prompt invokes, and
the only version carrying the terminology locks and the voice fingerprints. The root document is a
generalized, portable rewrite of the same protocol — genuinely useful as an onboarding text or for
a different project, but it strips out precisely the project-specific content that makes the gates
bite here.

**Use the root document's tooling, though.** `scripts/analyze-lanham.ts` is strictly better than
the two-step path v2 documents — see §8.2.

Also note: **v1** (`plans/fable-console-drafting-protocol-v1.md`, 2026-07-02) is retained read-only
and superseded. The v2 changelog lists eight research-driven changes over it, the substantive ones
being the quote-ID mechanism, the HEAD/MIDDLE/TAIL pack ordering, the new D1.5 skeleton stage, and
the separation of judge calls from the drafter.

---

## 4. How it functions — the pipeline

```
P (pack)  ──> D1 (movement plan + numeric style targets) ──> [author approval, default ON]
          ──> D1.5 (skeleton: nucleus/satellite + counterarguments — no prose)
          ──> D2 (draft with «Qnn» markers) ──> substitute-quote-ids.py
          ──> G (gauntlet: 5 mechanical gates + 2 judge gates)
          ──> R (targeted revision, loop to G, ≤3 cycles) ──> author review
```

Each stage has an exit gate. Nothing advances on a failed gate.

### 4.1 Stage P — the pack

One contiguous block of material, assembled **before any prose exists**. Field order is
load-bearing, because long-context models attend most reliably to the head and tail of a context
and least reliably to the middle:

**HEAD (critical constraints, always first):**

| Field | Content |
|---|---|
| **P1 TASK** | Section identity, insertion point, target length, register, audience, format conventions |
| **P2 STYLE TARGET** | The full Lanham fingerprint for the register + tolerance bands + runner invocation |
| **P3 LOCKS** | The enumerated terminology/style lock list — *copied in, not referenced* |
| **P8 NEGATIVE CONSTRAINTS** | Forbidden-phrase blacklist, stated greppably |
| **P9 USAGE STATEMENT** | The role boundary quoted in §2.2 above |

**MIDDLE (working material):**

| Field | Content |
|---|---|
| **P4a QUOTE INDEX** | `ID · source · locus · one-line description` for each quote. **Drafting reasons over this, not the quote text.** |
| **P5 EVIDENCE BANK** | Facts, figures, timestamps — each graded `AUTHOR-CONFIRMED` / `CONFIRMED` / `[UNCERTAIN]` |
| **P6 CONCEPTUAL SEMANTICS** | The operative apparatus in its locked formulations |
| **P7 FOUNDATION TEXT** | The existing draft being built on, verbatim and complete |

**TAIL (bulk reference):**

| Field | Content |
|---|---|
| **P4b QUOTATION BANK** | Every quote, character-exact, PDF-verified, keyed by ID, **also saved as JSON** for the substitution script |

The evidence *grades* are not decoration — they set assertion strength downstream, and gate G-E
enforces that the draft never asserts past its grade.

**Stage-specific sub-packs.** Each stage gets a tailored slice, never the monolith. D1 = P1–P3,
P8–P9, P5 grades, P6, P7, P4a. D1.5 = that slice plus the approved plan. D2 per movement = HEAD
fields + that movement's skeleton, its assigned evidence, its P4a entries, and the relevant P7
passages — *not* the full quote text, which the marker mechanism makes unnecessary. Judge calls =
the draft + the rubric + only the fields the rubric names.

**Gate G-P:** every field present or N/A; every quote verified against a PDF *this session*; every
evidence item graded; correct fingerprint in P2; JSON parses; P4a and P4b keys match.

### 4.2 Stage D1 — the plan, no prose

Produces an ordered list of **movements**, each with its one-sentence claim, assigned evidence and
quote IDs, foundation anchors, target word share, and **numeric style targets for that movement**
derived from P2 — exposition movements run longer and more periodic; close-reading movements
shorter and more paratactic. Style is thus specified up front, not only corrected afterward.

Plus two ledgers that make omission impossible to do silently:
- **Foundation disposition table** — every P7 beat marked RETAIN / EXPAND / CORRECT (correction
  stated) / OMIT (reason surfaced).
- **Quote/evidence ledger** — every P4a and P5 item marked ASSIGNED or UNUSED (with reason).

**Gate G-1:** no orphan claims; no unmapped foundation beats; ledger closed. **Author approval is
default-ON.**

### 4.3 Stage D1.5 — the skeleton, still no prose

Added in v2 on the strength of rhetorical-structure-theory and skeleton-of-thought findings. For
each movement: **nucleus claims** in order, each with **satellites labeled by rhetorical relation**
(evidence / elaboration / concession / contrast / restatement), and every assigned quote and
evidence item attached to the satellite it serves, with its function stated.

Then the **counterargument pass**: for each major claim, the strongest fair objection generated
*from the pack*, plus a disposition — ANSWER / CONCEDE-AND-LIMIT / SURFACE-TO-AUTHOR. Nothing is
silently dropped. Straw-man objections count as a defect.

Then transitions (the discourse relation each movement boundary performs) and rhythm placement
(where the short punches land, where the long periodic builds run).

**Gate G-1.5:** every nucleus has a satellite; every assigned item sits on one; every major claim
has a disposition; no new claims beyond the plan. The skeleton is shown to the author only if the
counterargument pass produced a SURFACE-TO-AUTHOR item.

### 4.4 Stage D2 — drafting with quote markers

Full prose, movement by movement, from the skeleton. Four rules:

1. **Quotes are markers.** `«Q1»` where a quote belongs. The prose is written *around* each quote
   using only the P4a one-line description. The words themselves enter by substitution.
2. **Evidence asserted per grade.** `AUTHOR-CONFIRMED` flatly; `CONFIRMED` with its
   timestamp/measure; `[UNCERTAIN]` hedged or omitted. Anything quote-like outside the bank →
   paraphrase without quotation marks, or `****** UNVERIFIED:`.
3. **Rhythm directives restated per movement** from the skeleton — G-A will measure the result.
4. **RETAIN passages carried verbatim** and marked in the footer for the author's diff.

Output: the body in `*-DRAFT-vN`, header comment recording pack + plan version + correction list,
footer comment recording retained/new/omitted material.

### 4.5 Stage G — the seven-gate gauntlet

Mechanical gates first (cheap, deterministic), judge gates after. Failures produce a **named defect
list** that drives Stage R. The report is appended to the draft file as a comment.

| Gate | Kind | What it enforces |
|---|---|---|
| **G-A · Style** | mechanical | Lanham metrics inside tolerance bands; all categorical labels exact match |
| **G-B · Quote fidelity** | mechanical | Substitution exits 0; every quoted span matches a bank entry; no quote marks outside bank coverage; no unused ASSIGNED quotes |
| **G-C · Citation rigor** | mechanical + read | Every citation carries a locus; every locus traces to P4/P5/P7; **no locus from model memory, ever** |
| **G-D · Terminology locks** | greps + read | The P3/P8 lock list, mechanically where possible |
| **G-E · Foundation fidelity** | **judge, lean context** | Every RETAIN beat present; no claim asserted beyond its evidence grade; every CORRECT applied; nothing asserted without warrant; every OMIT surfaced |
| **G-F · Degradation** | checklist | The 7-step pre-output protocol; blacklist consulted; one section per cycle |
| **G-G · Consistency** | **judge, lean context** | Locked terms used per their locked definitions; no movement contradicts another; evidence cited with the same value everywhere; no incompatible characterizations |

**The judge/drafter separation is the important architectural move.** G-E and G-G are *separate
model calls with lean contexts* — the draft plus the rubric plus only what the rubric names, never
the drafting conversation. This is deliberate: a model critiquing its own work inside its own
context rationalizes rather than judges. Both judge gates earned their keep on the first run (§7).

Rubrics are **binary question batteries** answered claim-by-claim with stated reasons, not open
"review this" prompts.

**G-A bands** (both documents agree):

| Metric | Pass band |
|---|---|
| avg sentence length | ± 3.5 words |
| short(<15) / long(>30) shares | ± 0.06 / ± 0.08 |
| periodicRunningRatio | ± 0.12 |
| preMainVerbClauseCount | ± 0.10 |
| voiceScore / dynamicRange | ± 0.12 each |
| beVerbRatio | ± 0.05 |
| nominalizationDensity | ± 1.5 per 100w |
| latinateGermanicRatio | ≤ target + 0.06 (more Germanic always passes) |
| opacityScore | ± 0.10 |
| all categorical labels | exact match |

A G-A repair pass touches **sentence architecture only** — never claims, quotes, or evidence.

**G-C+ (optional, post-gauntlet, secondary literature only):** parse secondary citations, query
Crossref/WorldCat, label Exact/Minor/Major. Runs on the finished draft in a separate context, so
the drafting RAG-ban is untouched. Primary and classical loci are exempt — they were PDF-verified
at pack time, which is stronger. Default-off is the protocol's own recommendation.

### 4.6 Stage R — revision and handoff

1. Fix only what a gate named. One cycle addresses all failed gates at once, then re-run the full
   gauntlet.
2. **≤ 3 gauntlet↔revision cycles.** Returns diminish and over-regularization begins past two or
   three passes. Each cycle is guided by *fresh* judge calls. Still failing → stop and surface the
   conflict, which is usually a spec conflict (e.g. quote density fighting the sentence-length
   band).
3. **Provenance log:** every version diffed against its predecessor, each diff recorded in the
   footer tagged with cycle number, triggering gates, and the judge findings it answered. The log
   plus the saved pack reconstruct the lineage of every passage.
4. **Handoff:** draft + gauntlet report + correction/omission list + provenance log, explicitly
   awaiting review. Nothing committed until sign-off.

---

## 5. Tooling — verified inventory

All four exist and were read on 2026-08-05.

| Tool | Status | Notes |
|---|---|---|
| `scripts/substitute-quote-ids.py` | **Working**, 43 lines | The G-B enforcement mechanism |
| `scripts/analyze-lanham.ts` | **Working**, 131 lines | The G-A runner. Self-contained stripper + profile comparison |
| `tmp/analyze-style-lanham.ts` | Working, 133 lines | Older twin of the above; same signature |
| `scripts/strip-latex-for-lanham.py` | **Working but crude**, 10 lines | See §8.2 — do not use |
| `scripts/style-status.mjs` | **BROKEN** | See §8.1 |
| `plans/packs/` | Populated | 8 pack sets from real runs — the best templates available |

### 5.1 The substitution script — exact behaviour

```
python3 scripts/substitute-quote-ids.py <draft> <bank.json> <out>
```

Bank format: `{"Q1": {"text": "...", "cite": "(Gross 4)"}, ...}`

Marker grammar is `«([A-Z]\d+)([+@]?)»` — **one uppercase letter followed by digits**. `«Q1»`,
`«Q12»`, `«E3»` all parse; `«Q1a»` and `«QA1»` do not.

Three modes:

| Marker | Substitutes |
|---|---|
| `«Q1»` | the text |
| `«Q1+»` | the text, then a space, then the cite |
| `«Q1@»` | **the cite only** — for `\footnote{«Q1@».}` constructions |

Exit 1 on any unknown ID (= automatic G-B failure), with the offending IDs on stderr. Unused bank
entries are reported to stderr but do **not** fail the run — that check belongs to G-B's read
component, since an unused ASSIGNED quote means the plan was not executed.

Note that the `@` mode is implemented but documented in **neither** protocol version. The script is
ahead of its specification.

### 5.2 The style analyzer — exact behaviour

```
npx tsx scripts/analyze-lanham.ts <file> [profileKey]
```

It strips LaTeX and Markdown internally (balanced-brace scanning — it correctly *removes* footnote,
cite, ref, label, caption and includegraphics content, and *unwraps* textit, emph, textbf, gk,
textsc, underline), computes the fifteen Lanham axes plus avg sentence length and short/long
shares, and — if given a profile key — prints each metric next to the profile's stored target and
the Δ between them. It reads targets from `.agentdb/universal/style-profiles.json` at
`profiles.<key>.characteristics.lanhamMetrics`.

Run it from the repo root.

---

## 6. Calibration — the stored fingerprints

Two sources of style targets exist, and **they disagree**.

**Source A — protocol v2 §8, the hardcoded fingerprints.** This is what the real runs used.

*MA-applications voice* (Part II §4+, game analyses; measured 2026-07-01 on 21,323 words):
avg 33.7 (band 29–36) · short/long 0.23/0.45 · nounVerb 0.65 · nominalization 5.0 · prep ≤5.4 ·
beVerb 0.15 · parataxis 0.38 · periodicRunning 0.44 · preMainVerb 0.21 · voice/dynamic 0.41/0.74 ·
latinate ≤0.14 · opacity 0.76.

**⚠ The §8 MA numbers are contaminated by citation apparatus** — a calibration correction recorded
at the end of the first run and carried into the second. Use the **clean-MA reference** measured on
analysis prose only (MA pp. 29–47): **avg 35.0 · short .151 · long .45 · periodicRunning .416 ·
preMainVerb .222 · voiceScore .323 · dynamicRange .633 · opaque · ~92% Germanic.**

*Part-I voice* (frozen): ~31w · 85% Germanic · voice 0.39 · opacity 0.74 · dynamicRange 0.90.
**Needs a refresh against the current `-v3.tex` before first Part-I-register use** — still pending.

**Source B — the trained AgentDB profile.** Exactly one profile exists,
`dalton-philosophical-mo2fmhy2`, and its stored fingerprint does **not** match the MA target:
voiceScore 0.289 against 0.323–0.41, label `unvoiced` against the MA's strongly-voiced reading,
dynamicRange 0.807 against 0.633, opacity 0.870 against 0.76. It also records `samples: 0` and
`analysisDepth: heuristic`.

**Operational consequence:** for dissertation work, put the §8 clean-MA numbers in P2 by hand and
gate against those. Do **not** pass `dalton-philosophical-mo2fmhy2` as the profile key and treat
the Δ column as authoritative — it is measuring against a different voice. The root document's
profile-key workflow is correct in principle but has no correctly-trained profile to point at yet.

### 6.1 The standing G-A residual — suspension density

Across both runs, drafts land `periodicRunningRatio` around **.60** against the MA's **.416**. The
MA front-loads suspended modifiers roughly **twice** as densely, on longer sentences. Three repair
cycles did not close it on run 1, and the protocol's 3-cycle cap was hit.

The remedy is preventive, and it is the single highest-value adjustment to make: **D2 prompts must
front-load suspended and subordinate openers from the first sentence**, rather than leaving it to
post-hoc G-A repair.

Analyzer mechanics, useful for targeted repairs: periodic credit comes from sentence-initial
subordinators/participles plus `earlyCommas > lateCommas`; short sentences count 1.2× running;
voiceScore is penalized by "The/It/This" sentence-starts; dynamicRange is the coefficient of
variation of sentence lengths.

---

## 7. Field record — what two real runs proved

**Run 1 — Part II §4, *Gnomes & Goblins*, 2026-07-02.** First full-dress run. ~6,700 words. Full
analytical redraft, not a register fix. Foundation: 36/36 beats retained, judge-verified. Outcome:
complete through gauntlet and handoff, then an author manual pass, then interactive per-paragraph
revision, then a gauntlet re-clean, then spliced into the combined document — compiles clean,
39 pp, 0 errors.

**The gates caught real defects:**
- **G-G** caught a *prohairesis* terminology-lock violation — which had been **inherited from the
  foundation text**, meaning the gate found an error the author had already shipped.
- **G-E** caught an invented player-behaviour claim, excluded-comparator vocabulary that had leaked
  in, and a dropped signature sentence (restored).
- **G-C** caught three real citation errors: Salvo 41 not 41–42; Rickert 225 not 199–201; and
  Being and Time "marvelling" not "marveling".
- **One G-E flag was a false positive** — the judge lacked the D1.5 verification record.
  *Remedy adopted: pass the verification record into the G-E context.*

**Run 2 — Part II §5, RDR2.** Pack built on the same pattern; the SITREP records the scope decision
and the carried-forward calibration.

**Current status.** FCDP is the mandated drafting method for the Lab Boredom section (Stage 3),
per the boot prompt dated 2026-08-05, which states three non-negotiables: FCDP for drafting; Fable 5
at xhigh for prose and judge steps with lean-context judge calls; and all retrieval from
`archon-cli-v3` only.

**That boot prompt also flags the likeliest process failure, and it is worth repeating here.** FCDP
says the pack is authoritative and there is no retrieval during drafting. The project also mandates
archon-cli-v3 as the sole retrieval source. These reconcile in exactly one way: **retrieval happens
only at pack assembly and at the optional post-gauntlet verification stage.** During D1, D1.5, D2
and the gauntlet there is no retrieval at all — a missing quotation becomes `******` and waits for a
pack revision, never a mid-draft lookup.

---

## 8. Verified defects and cautions

### 8.1 `scripts/style-status.mjs` is broken — blocks the documented first step

The root document tells the user to find their profile key with `node scripts/style-status.mjs`.
It fails:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module
  '/home/dalton/projects/claudeflow-testing/src/god-agent/universal/index.js'
  imported from /home/dalton/projects/claudeflow-testing/scripts/style-status.mjs
```

The `/god-style-status` slash command shares the same backend and is likely affected. **Workaround:**
read the keys directly —

```bash
python3 -c "import json;print(list(json.load(open('.agentdb/universal/style-profiles.json'))['profiles']))"
```

### 8.2 `strip-latex-for-lanham.py` reintroduces the exact contamination the calibration warns about

The v2 G-A path is `strip-latex-for-lanham.py` → analyzer. The stripper is ten lines and its
command-removal is `re.sub(r'\\[a-zA-Z]+', '', t)` — this deletes command *names* but leaves braces
and their contents. `\footnote{Gross 4}` becomes `{Gross 4}`, and the footnote text stays in the
measured prose.

That is precisely the citation-apparatus contamination the run-1 calibration lesson identified in
the §8 MA fingerprint. Using this stripper means measuring drafts with the same distortion the
targets were corrected for.

**Use `scripts/analyze-lanham.ts` directly instead.** It strips internally with balanced-brace
scanning, genuinely removes footnote and cite content, handles `\gk{}`, and needs no pre-pass.

### 8.3 The entire FCDP apparatus is untracked in git

Both protocol documents, both tool scripts, and the pack archive are **untracked and not
gitignored**:

```
plans/fable-console-drafting-protocol-v2.md    UNTRACKED
plans/fable-console-drafting-protocol-v1.md    UNTRACKED
scripts/substitute-quote-ids.py                UNTRACKED
scripts/analyze-lanham.ts                      UNTRACKED
FCDP-DRAFTING-PROTOCOL.md                      UNTRACKED
```

There is one copy of each, no history, and no recovery from an accidental deletion. Given that the
protocol's own §6.3 makes the provenance log the evidentiary basis for the dissertation's LLM-use
disclosure, having the protocol itself outside version control undercuts the audit trail it exists
to produce. **Recommend committing the lot.**

### 8.4 Documentation lags the tooling

The `«Qnn@»` cite-only mode is implemented and useful for footnote constructions; neither protocol
document mentions it. Minor, but it means capability is being left unused.

### 8.5 Open items carried from the protocol's own review list

1. G-A tolerance bands remain first-pass calibrations — tighten after two or three more sections.
   (The archon port work went further: it found **all three calibration documents fail the locked
   `avg_sentence_length` band**, and concluded that fixed ± widths ignore real within-author
   variance. A variance-derived, feature-tiered band scheme is the proposed replacement. If a
   metric keeps failing on prose you consider good, this is why.)
2. The Part-I fingerprint refresh is still pending.
3. G-C+ default-off remains the recommendation; flip it on if secondary-literature density rises.
4. The trained authorship-verification scorer stays deferred. **Trigger: any draft that passes the
   G-A bands but reads off-voice to you.**

---

## 9. HOW-TO GUIDE

What follows is a complete working procedure. It assumes you are in the Claude Code console at
`/home/dalton/projects/claudeflow-testing`.

### Step 0 — Prerequisites

Confirm these before you start. Two minutes now saves a wasted drafting pass.

```bash
# tools present
ls -l scripts/substitute-quote-ids.py scripts/analyze-lanham.ts

# analyzer runs (any prose file will do as a smoke test)
npx tsx scripts/analyze-lanham.ts <some-existing-draft>

# look at a real pack set before building your own — these are the best templates
ls plans/packs/
```

Decide three things and write them down:

- **The register.** MA-applications voice, or Part-I voice? Never mixed inside one section. If
  Part I, refresh the fingerprint first (§8.5, item 2).
- **The foundation.** Are you redrafting existing prose (P7 required) or writing new?
- **The retrieval source.** For current work this is `archon-cli-v3` and nothing else — binary at
  `/home/dalton/projects/archon-cli-v3/target/release/archon`, index at that project's root
  `index/`, **not** `corpus/index/`. The shell resets its working directory between calls, so `cd`
  inside every command.

### Step 1 — Assemble the pack (Stage P)

This is where most of the work is, and it is the work that determines the draft's quality. Budget
accordingly — pack assembly is typically longer than drafting.

Create two files:

```
plans/packs/<section>-pack-v1.md
plans/packs/<section>-quotes.json
```

If you have a foundation, snapshot it first so the pack is reproducible:

```bash
cp <the-live-doc> plans/packs/<section>-foundation-snapshot-$(date +%F).tex
```

Lay the pack out in **HEAD / MIDDLE / TAIL** order — this is not cosmetic, it is why the model
attends to your constraints:

```markdown
# <SECTION> — FCDP PACK v1

## HEAD
### P1 TASK
<section identity · insertion point · target length range · register · audience · LaTeX conventions>

### P2 STYLE TARGET
<the full fingerprint, numbers copied in — see §6; plus the tolerance bands; plus the runner command>

### P3 TERMINOLOGY & STYLE LOCKS
<the full lock list from protocol v2 §7, COPIED IN — never referenced by path>

### P8 NEGATIVE CONSTRAINTS
<forbidden-phrase blacklist, stated so it can be grepped>

### P9 USAGE STATEMENT
The model contributes phrasing, structure, and analysis of pack-supplied evidence; it may not
introduce claims beyond the evidence bank, may not invent or recall citations, and every
quotation enters by ID substitution only.

## MIDDLE
### P4a QUOTE INDEX
| ID | source | locus | one-line description and intended rhetorical use |
|----|--------|-------|--------------------------------------------------|
| Q1 | ...    | ...   | ...                                              |

### P5 EVIDENCE BANK
- E1 [AUTHOR-CONFIRMED] <fact, with its figure/timestamp>
- E2 [CONFIRMED] ...
- E3 [UNCERTAIN] ...

### P6 CONCEPTUAL SEMANTICS
<the operative apparatus in its locked formulations>

### P7 FOUNDATION TEXT
<the existing draft, verbatim and complete>

## TAIL
### P4b QUOTATION BANK
<every quote character-exact, with citation and locus, keyed by ID>
```

And the JSON bank, which must key-match P4a exactly:

```json
{
  "Q1": {"text": "``the exact words, in LaTeX quote markup''", "cite": "(Salvo 41)"},
  "Q2": {"text": "...", "cite": "..."}
}
```

**Verify every quote against its PDF this session.** Not from memory, not from a previous session's
notes. Run 1 caught three real page errors at exactly this step. Use `pdftotext`, or archon's
`docs verify-quote` **gated on EXACT MATCH — never on "found" and never on a fuzzy hit.**

**Gate G-P — do not proceed until all of these hold:**

```
[ ] every P-field present or explicitly marked N/A
[ ] every P4b quote verified against a PDF THIS SESSION
[ ] every P5 item carries a grade
[ ] P2 carries the right fingerprint for the register
[ ] the JSON parses:  python3 -m json.tool plans/packs/<section>-quotes.json > /dev/null
[ ] P4a and P4b key sets match exactly
```

### Step 2 — Start the run

In the console, with the model on Fable 5 at xhigh (the author switches this manually — **say so
before drafting starts**):

> Follow `plans/fable-console-drafting-protocol-v2.md` to draft **[section identity, target
> length]**. The pack is `plans/packs/<section>-pack-v1.md`, quote bank
> `plans/packs/<section>-quotes.json`. Register is **[MA-applications / Part-I]**; gate G-A against
> the **clean-MA reference** in protocol §8, not the contaminated whole-thesis numbers. Start at
> Stage P with gate G-P, show me the D1 plan for approval before any prose, and run the full
> seven-gate gauntlet before showing me a draft. No retrieval after pack assembly.

### Step 3 — Approve the plan (Gate G-1)

You will get movements, a foundation disposition table, and a ledger. **Read the disposition table
first** — it is where silent loss would happen if it happened. Check:

```
[ ] every movement's claim is one sentence, and is a claim
[ ] every foundation beat is RETAIN / EXPAND / CORRECT / OMIT, with reasons on the OMITs
[ ] every quote and evidence item is ASSIGNED or UNUSED-with-reason
[ ] no claim appears that has no evidence behind it
[ ] the per-movement style targets vary sensibly (exposition longer/periodic; close reading
    shorter/paratactic)
```

Iterate here rather than later. Run 1 went through **four** D1 versions before approval, and that
was the cheap place to do it.

### Step 4 — Skeleton (Gate G-1.5)

Usually passes through without your involvement. You will see it only if the counterargument pass
produced a **SURFACE-TO-AUTHOR** item — which means the model found an objection it could not
fairly answer from the pack. That is a signal worth taking seriously: it usually means either the
evidence base has a hole, or the claim is overreaching.

### Step 5 — Draft and substitute

The draft goes to `<section>-DRAFT-v1` carrying `«Qnn»` markers. Then:

```bash
python3 scripts/substitute-quote-ids.py \
  <section>-DRAFT-v1.tex \
  plans/packs/<section>-quotes.json \
  <section>-DRAFT-v1-SUBST.tex
```

Exit 0 is required. Nonzero = unknown marker = automatic G-B failure.

**The two-file discipline, and it matters:**

| File | Role |
|---|---|
| `*-DRAFT-vN.tex` (markers) | **The editable file.** Always edit this one. |
| `*-DRAFT-vN-SUBST.tex` | **Read-only rendering.** Regenerated, never edited. |

Edit the marker file, re-run substitution, re-read the SUBST. Editing the SUBST breaks the chain
and forfeits G-B on every subsequent pass.

### Step 6 — Run the gauntlet

**G-A · Style:**

```bash
npx tsx scripts/analyze-lanham.ts <section>-DRAFT-v1.tex
```

Compare each metric to your P2 targets using the §4.5 bands. Categorical labels must match
**exactly** — a "mixed" where you want "mixed" is a pass; "unvoiced" where you want "strongly
voiced" is a failure regardless of how close the numbers look.

**G-B · Quote fidelity:**

```bash
python3 scripts/substitute-quote-ids.py <draft> <bank.json> <out>   # must exit 0
grep -o '``[^']*''' <section>-DRAFT-v1-SUBST.tex | head -50          # every span must trace to the bank
```
Plus: no quotation marks outside bank coverage, and no ASSIGNED quote left unused.

**G-C · Citation rigor:** read every citation. Each needs a locus, and each locus must trace to
P4/P5/P7. **Any locus that came from model memory is a defect, always.** Missing source → `******`.

**G-D · Terminology locks:**

```bash
grep -n 'phantasmat' <draft>                    # retired stem
grep -n '\\textbf{' <draft>                     # no bold run-in heads
grep -n '[""'']' <draft>                        # Unicode quotes — must be zero
grep -n -E '\b(she|he|her|his)\b' <draft>       # gendered pronouns bound to "the player"
grep -n -i 'supplies the' <draft>               # banned advisor-prose pattern
grep -n -E '^And |[.!?] And ' <draft>           # no sentence-initial "And"
grep -n -i 'the record' <draft>                 # "record" never names the evidence
```
Then read for: *hexis* ≠ habit ≠ *doxa*; "emotion" not *pathē* for Rhetorica; Greek faculty-names
italic; no unauthorized coinages; American spelling.

**G-E · Foundation fidelity — a SEPARATE call.** Not a follow-up turn in the drafting conversation.
Context = the draft movement + the relevant P7 passages + the relevant P5 grades + the disposition
table **+ the D1.5 verification record** (this last one is the fix for run 1's false positive).
Rubric, answered claim-by-claim with stated reasons:

1. Is each RETAIN beat present?
2. Is any foundation claim altered in strength or modality beyond its evidence grade?
3. Is each CORRECT beat corrected exactly as specified, and flagged?
4. Does the draft assert anything with no P5/P7 warrant?
5. Is every OMIT surfaced in the footer?

YES on 2 or 4, or NO on 1, 3, or 5 → named defect.

**G-F · Degradation:** the 7-step pre-output protocol; blacklist consulted; one section per cycle.

**G-G · Consistency — also a SEPARATE call.** Context = the draft + P3/P6 + the D1 claim list:

1. Is every locked term used per its locked definition at every occurrence?
2. Does any movement contradict an earlier movement without explicit acknowledgment?
3. Is each evidence item cited with the same value and grade everywhere it appears?
4. Do any two passages characterize the same concept or interlocutor incompatibly?

For multi-section work, run G-G across the **assembled** document, not just the new section.

### Step 7 — Revise (≤ 3 cycles)

Fix only what a gate named. One cycle clears all failed gates, then re-run the whole gauntlet with
**fresh** judge calls. Record each diff in the footer, tagged with cycle number, triggering gates,
and the findings it answered.

**If you hit three cycles and something still fails, stop.** Do not spend a fourth. It is almost
always a spec conflict — quote density fighting the sentence-length band, or a fingerprint metric
that is mis-derived rather than a draft that is wrong. Surface it and decide.

### Step 8 — Handoff

You receive: the draft, the gauntlet report, the retained/new/omitted list, and the provenance log.
Read the **SUBST** file for the prose; edit the **marker** file. **Nothing is committed until you
sign off.**

On sign-off, splice into the live document — backing up the original span to `.backups/` with a
timestamp first, locating the section by its `\section*{...}` header rather than by line number
(other work shifts lines), converting to the target document's conventions (the combined Part II
doc uses Unicode subscripts A₀…A₄, not `\textsubscript{}`), and compiling:

```bash
xelatex -interaction=nonstopmode <doc>.tex     # expect exit 0
```

### Step 9 — The one-page checklist

```
[ ] P    pack assembled, HEAD/MIDDLE/TAIL, saved to plans/packs/ ....... gate G-P
[ ] D1   movement plan + per-movement numeric style targets ............ gate G-1 → YOUR APPROVAL
[ ] D1.5 skeleton: nucleus/satellite + counterargument pass ............ gate G-1.5
[ ] D2   draft with «Qnn» markers, per-movement sub-packs
[ ] substitute-quote-ids.py (exit 0 REQUIRED)
[ ] G-A  Lanham bands + exact label match .............. [mechanical]
[ ] G-B  quote fidelity, 100% bank-covered ............. [mechanical]
[ ] G-C  citation rigor, no memory loci ................ [mechanical + read]
[ ] G-D  terminology locks ............................. [greps + read]
[ ] G-E  foundation fidelity ........................... [JUDGE — separate lean-context call]
[ ] G-F  degradation checklist
[ ] G-G  consistency ................................... [JUDGE — separate lean-context call]
[ ] R    targeted revision + provenance diff, re-gauntlet (≤3 cycles)
[ ] (optional) G-C+ retrieval verification, secondary literature only
[ ] Handoff: draft + gauntlet report + provenance log — NO COMMIT until sign-off
```

### Step 10 — The seven mistakes that actually happen

1. **Editing the SUBST file.** It is a rendering. Edit the marker file and regenerate.
2. **Retrieving mid-draft** because a quote is missing. It becomes `******` and waits for a pack
   revision. This is the single likeliest process failure, and the boot prompt names it as such.
3. **Referencing the lock list by path instead of copying it in.** P3 must be *in* the pack.
4. **Gating against the contaminated §8 MA numbers.** Use the clean-MA reference (§6).
5. **Running judge gates as follow-up turns** in the drafting conversation. They must be separate
   calls with lean contexts, or they rationalize instead of judging.
6. **Skipping D1 approval to save time.** Run 1 needed four plan versions; fixing structure in D1
   costs a fraction of fixing it in D2.
7. **Spending a fourth revision cycle.** Three is the cap for a reason.

---

## 10. Assessment

FCDP is a genuinely well-designed protocol, and the two properties that make it so are worth naming
because they are transferable:

**It converts prohibitions into impossibilities.** "Do not fabricate quotations" is an instruction a
model can fail. Removing quoted text from the model's output space entirely is not. The same move
is made with citations by banning retrieval and forcing `******`. Everything downstream is quality
control; these two are correctness guarantees.

**It separates the judge from the drafter.** The gates that caught real defects on the first run
were the two judge gates, and they caught things the drafter could not have caught about itself —
including a lock violation the *author* had shipped in the foundation text. Lean-context judge
calls with binary rubrics are the load-bearing quality mechanism, not the mechanical gates.

The protocol's honest weak point is the one its own port plan states: **no institution has
empirically validated a gate-enforced dissertation pipeline end-to-end.** The composition is
principled and its components are individually supported, but the whole is unproven, and the G-A
bands in particular are known to be mis-derived (they reject three of three of their own calibration
documents on average sentence length). Treat G-A failures as information rather than verdicts, and
treat yourself as the arbiter — which is what the protocol says too.

Priority fixes, in order: commit the apparatus to git (§8.3); stop using the crude stripper (§8.2);
fix or replace `style-status.mjs` (§8.1); front-load suspended openers in D2 prompts to close the
standing periodicRunning residual (§6.1); refresh the Part-I fingerprint before any Part-I-register
run.

---

## Appendix — file map

| Artifact | Path |
|---|---|
| **Canonical protocol** | `plans/fable-console-drafting-protocol-v2.md` |
| Generalized/portable version | `FCDP-DRAFTING-PROTOCOL.md` |
| v1, superseded, read-only | `plans/fable-console-drafting-protocol-v1.md` |
| Research basis (Perplexity deep-research, 20 sources) | `plans/fable-console-drafting-protocol-research-2026-07-02.md` |
| Rust/archon port plan (band-derivation critique) | `plans/fcdp-archon-port-plan-v2-2026-07-07.md` |
| Orchestration port plan | `plans/fcdp-orchestration-rust-port-plan-2026-07-08.md` |
| Run 1 SITREP (G&G §4) | `tmp/SITREP-FCDP-GG-Section4-2026-07-02.md` |
| Run 2 SITREP (RDR2 §5) | `tmp/SITREP-FCDP-RDR2-Section5-2026-07-03.md` |
| Pack archive (8 sets — best templates) | `plans/packs/` |
| Quote substitution | `scripts/substitute-quote-ids.py` |
| Style analyzer (**use this one**) | `scripts/analyze-lanham.ts` |
| Legacy analyzer twin | `tmp/analyze-style-lanham.ts` |
| LaTeX stripper (**avoid** — see §8.2) | `scripts/strip-latex-for-lanham.py` |
| Profile store | `.agentdb/universal/style-profiles.json` |
| Standing constraints | `tmp/Dissertation/REVISION-PROTOCOL.md` · `tmp/Dissertation/TODO_NOTES.md` §H |
| Current mandated use | `tmp/Dissertation/Part_III/BOOT-PROMPT-LAB-BOREDOM-STAGE3-2026-08-05.md` |
