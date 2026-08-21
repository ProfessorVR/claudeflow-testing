# HANDOFF — Lab Boredom: Stage P complete, L1 drafting not begun (2026-08-06)

**Supersedes `HANDOFF-LAB-BOREDOM-X07-X08-COMPLETE-2026-08-05.md`.** Read this one for state.

**Status in one line: the L1 pack is assembled and gate-G-P clean, the index is green end to end, outline v7 is
consolidated and standalone, Step A is closed — and not one word of prose exists.**

---

## 0. THE AUTHORITATIVE DOC SET — everything else is superseded

| what | file |
|---|---|
| **Drafting spec** | `tmp/Dissertation/Part_III/PART-III-LAB-BOREDOM-SECTION-OUTLINE-v7-2026-08-06.md` — **standalone** |
| **Rulings ledger** | `tmp/Dissertation/Part_III/DECISIONS-REGISTER-v8-2026-08-05.md` |
| **The pack** | `plans/packs/lab-boredom-L1-pack-v1.md` + `…-quotes.json` |
| **Quotation closure** | `tmp/Dissertation/Part_III/STEP-A-TAIL-CLOSURE-2026-08-06.md` |
| **Method prose** | `PROSE-METHODS-CRITERION-VALIDITY-v2-2026-08-05.md` · `PROSE-METHODS-GAZE-BASELINE-v2-2026-08-05.md` |
| **Analysis tree** | `tmp/Dissertation/Part_III/boredom-analysis-v5-2026-08-05/` |
| **Protocol** | `plans/fable-console-drafting-protocol-v2.md` |
| **Boot prompt for the drafting session** | `tmp/Dissertation/Part_III/BOOT-PROMPT-LAB-BOREDOM-L1-DRAFTING-2026-08-06.md` |

### ★ NEVER OPEN — superseded, and several would actively corrupt a draft

- **Outline v1–v6.** v7 folds them all in. v6 was an amendments layer and is no longer valid alone.
- **Register v3–v7.** v8 supersedes.
- **`PROSE-METHODS-*-v1-2026-08-04.md`** — both carry the **eye-closure signs inverted** and call the per-file
  baseline the strongest predictor. Pasting from them puts the reverse of the finding into the section.
- **`boredom-analysis-v4-2026-08-04/`** — the frozen audit artifact. **v5 is the only tree numbers come from.**
- **`BOOT-PROMPT-LAB-BOREDOM-STAGE3-2026-08-05.md`** and **`BOOT-PROMPT-LAB-BOREDOM-2026-08-06.md`** — both
  predate this handoff. The 08-05 one names v4 as current, tells you to paste the v1 method files, and reopens
  O-03 while stating an identifying detail that D-38 withdrew.

---

## 1. WHAT IS DONE

### 1.1 Outline v7 — consolidated, standalone

Folds v5 + v6 and repairs four things the two-document arrangement was hiding:

- **D-37 propagated to L4.3.** v6 fixed sleep-fight to 10-of-12 in L3.2 but its §F affirmatively preserved L4.3,
  where "12 of 12" still stood in the first-form paragraph.
- **D-11 propagated to L3.10.** The order-control figures were still in the openness direction. Recomputed and
  checked against QC: S01 closure 0.074 against 0.096, S05 0.148 against 0.788; boring sits **above** interesting
  on closure in 12 of 12. L4.2's arousal objection flipped with it — clinical closure is far **below** boring's.
- **DA-12's anchors are in**, with 077 and 085 distinguished by the work each does, plus the division of labor:
  **DA-04 carries the measurement half, DA-12 the definitional half, and the exclusion operates before
  self-report's validity is in question.**
- **VanderWerf enters twice** — a third instance of L1 ¶6's dual-measure structure, and a new L2.5 limit, since
  the 500 ms ceiling is a duration threshold and blink duration varies with vertical gaze position.

### 1.2 Step A — closed

`STEP-A-TAIL-CLOSURE-2026-08-06.md`. Of the eight unverified candidates: one verifies as written, four recovered
with corrected wording, **three must not be used**. Two attribution hazards were caught before prose (§3 below).
The twelve-ellipsis item is superseded by `archon-cli-v3/reports/ellipsis-classification-2026-08-06.jsonl` —
34 boredom-family rows, **none `source-own-ellipsis`**, so none quotable as it stands; scoped to on-demand
re-cutting for the three entries that could become load-bearing.

### 1.3 Stage P — the L1 pack, gate G-P clean

25 quotations, **every one verified `match_kind == exact` in-session**, each carrying source, locus, verdict and
where applicable clause id, claim anchor and caveat. JSON parses; P4a and P4b keys match; no missing cite or
locus. P7 is empty **by construction** — L1 is new prose, so the foundation-disposition table has nothing in it
and G-E's RETAIN/CORRECT battery has nothing to check.

### 1.4 ★ A citation finding that governs every FCM reference

**The FCM scan is a two-page spread (813 × 612 pts), so archon's page index is not the printed page.** Every
`pp.NNN–NNN` in this project's older FCM records is a **PDF-page range**, not a citation. Printed pages were read
from the running head this session:

| quotation | old record | **printed (running head)** | desktop M4.1 |
|---|---|---|---|
| "holds us in limbo and yet leaves us empty" | pp. 84–85 | **87** | 87 ✓ |
| "nothing at all to be found…" | pp. 107–108 | **109** | 110 ✗ |
| "arises from out of Dasein itself" | pp. 126–127 | **128** | 128 ✓ |
| attunement passages (×2) | pp. 62–63 | **65** | — |

The desktop draft is right on two and disagrees on one. **Do not silently diverge — flag it.**

---

## 2. MACHINE-INDEX FACTS — do not re-derive these

- Repo `archon-cli-v3` at **HEAD `75d8c210`**, working tree clean, pushed.
- Binary **rebuilt this session**; stamp now `archon 1.3.11 (75d8c210)`, matching HEAD. The FTS hyphen fix is
  compiled in and was confirmed **functionally** (a hyphenated `verify-quote` returns EXACT with no FTS error).
- **All ten new-format entries PASS E1–E14, 0 fail 0 warn.** E11 is at zero across all ten, with FCM's eleven
  `behaviour` occurrences declared as `style_lock_exceptions` (McNeill & Walker's rendering of *Benehmen*) and
  reported by name on every run.
- **FCM is fully evidenced:** 330 exact-anchored clauses, 181/182 claims with verbatim refs.
- **DA-12 is live** in `debate-map.{md,json}` with machine anchors. Mugon joined DA-01.
- Store census: sources 89 · clauses 8,553 · claims 5,571 · edges 21,319 · tensions 133 · groups 52. The
  dissertation namespace was removed by author order and archived.
- New retrieval surface: `corpus-index search "<q>" [--kind clauses|claims]` and
  `corpus-index clauses-for-chunk <id>`. **`dump clauses --entry` errors by design** — clauses key by
  `source_id`; dump all and filter by the manifest.

---

## 3. THE BANNED SET — carry this into every drafting session

**Three quotations that must never be reconstructed** (`STEP-A-TAIL-CLOSURE` §1):

1. *slipping away from ourselves toward whatever is happening* — a **splice across two authors**. The first half
   is a **diagram label** in Mansikka; the second half is **Slaby's**. Not a quotation at all.
2. *lower alpha = cortical activation* — a reading gloss, never a quotation.
3. *without relying on any specific genre of content* — **no hit anywhere in the store.**

**Two attribution hazards, by name:**

- **Q20 / Elpidorou** — *Boredom strives to get us unstuck when we find ourselves stuck* carries
  *(Fahlman et al., 2013, p. 68)*. The substance is **Fahlman's**, and Fahlman is the definitional middle term
  this section's spine runs through, so misattributing it lands **inside** the argument.
- **Q13 / Slaby** — the attunement/understanding sentence is **Slaby's**, cited to ***Being and Time***, not FCM.
  Using it as an FCM gloss misattributes. Its **inner quotation marks are load-bearing** and must nest in LaTeX.

**Two backfill caveats on FCM rows** (embedded in the pack so they surface at selection):

- `claim-146`'s clause preserves an OCR corruption, ***entelectly*** — never carry it into prose unmarked.
- `claim-133`'s locus cites p. 233 while the passage sits at p. 223.

---

## 4. WHAT IS OPEN, WITH OWNERS

| # | item | owner |
|---|---|---|
| **O-06** | How much of the published studies to re-present against cite — L1 ¶8, under the 4–5 pp cap | **author**, at drafting |
| **O-14** | Multiplicity in the criterion family; recommendation is a footnote, not a computed correction — L2.8 `******` | **author**, at drafting |
| **O-15** | IRB-facing wording of the survey instrument — L2.2, L2.8 `******` | **author**, at drafting |
| E02 / E03 | L1 ¶9's six route counts — `RE-PIN` against the regenerated synthesis layer | drafting session |
| Loci | Q02, Q12, Q13, Q14, Q19, Q20 printed pages — `RE-PIN` from running heads | drafting session, at use |
| Ellipsis | On-demand re-cuts for E&F (¶2), Gibbs (¶4), Elpidorou *Good of Boredom* (¶12) | drafting session, only if quoted |
| Desktop debt | M4.1 ¶6 and M3.6 `STALE-2` markers; **plus M4.1 ¶7's "stillest episodes,"** a stillness claim 0d forbids; **plus the FCM 109/110 disagreement** | after this section is drafted |

**N-04 and N-07 are findings, not open items.** N-04 (closure window-invariant; pupil cleaner on the matched
window, 0.097 → 0.017) is carried in outline v7 §L3.4. **N-07 is superseded in its operative role**: it recorded
the per-file baseline as correlating better than fixed-forward (0.52 vs 0.36), which remains true, but D-12 as
revised and N-18 assign the criterion question to the **per-participant** baseline at +0.590 / −0.585. Do not act
on N-07 as though it set the assignment.

**Parked, do not touch:** the Mac divergence (`63a0ff56`) and the Group C promotion question. **Never push to the
`mac` remote.**

---

## 5. NEXT — and the one precondition

**L1 drafting, in a clean session, from the boot prompt.** The pack is self-contained by design; the drafting
session needs the pack, not this session's history.

**Model precondition: Fable 5 at xhigh, with judge passes as separate lean-context calls. The author sets this
before pasting the boot prompt.** Stage P ran on the prior model; the switch applies from D1 onward.

**Nothing on the dissertation side has been committed, across any session of this work.** The `archon-cli-v3`
index work is committed and pushed; the dissertation tree is not.
