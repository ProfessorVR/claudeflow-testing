# Console Drafting Protocol (FCDP)

A reusable, gate-enforced protocol for drafting prose **interactively in the Claude Code
console**, in *your* trained writing style. You don't run a single command — you tell the
assistant to follow this file, and it walks the stages with you, checking each draft against
your trained style profile before handing it back.

> **What makes this different from `/god-write`:** `/god-write` is a fire-and-forget pipeline.
> FCDP is a conversation. You approve the plan, the assistant drafts against an *embedded pack*
> of your own material (no corpus retrieval — that's deliberate), quotes are never invented, and
> every draft passes a mechanical style gate keyed to your trained voice before you see it.

---

## 0. Invariants (the rules the assistant follows)

1. **The pack is authoritative.** During drafting there is **no corpus retrieval, no ChromaDB,
   no god-learn context** — only the material you put in the pack (Stage P). If it isn't in the
   pack, it doesn't go in the draft; it becomes a `******` placeholder for you to fill.
2. **Quotations are never generated.** Where a quote belongs, the draft emits a marker `«Q1»`,
   `«Q2»`, … and the real text is substituted mechanically afterward from a JSON bank you supply
   (`scripts/substitute-quote-ids.py`). This makes fabricated quotes structurally impossible.
3. **Your source files are never modified.** New prose goes to a fresh `*-DRAFT-v1.md`; revisions
   of existing prose happen on copies. Nothing is committed without your say-so.
4. **Your trained profile is the style target.** The style gate (G-A) measures each draft and
   compares it, metric by metric, to *your* profile's stored Lanham fingerprint.

**Pipeline shape:**

```
P  (pack)  → D1 (plan + numeric style targets)  → [you approve]
           → D1.5 (skeleton: nucleus/satellite + counterarguments, no prose)
           → D2 (draft with «Qnn» quote markers) → substitute-quote-ids.py
           → G  (gauntlet: mechanical gates + judge gates)
           → R  (targeted revision, loop to G, ≤3 cycles) → you review
```

---

## 1. Stage P — Assemble the pack

One block of material, assembled **before any prose exists**. Order matters (models attend best
to the head and tail), so:

**HEAD — constraints (first):**
- **P1 TASK** — what you're writing: section identity, where it goes, target length, register,
  audience, and any format convention (Markdown, LaTeX, etc.).
- **P2 STYLE TARGET** — *your trained profile key* (e.g. `my-style`). The assistant treats its
  stored `lanhamMetrics` as the fingerprint to hit. (See §3 for how it reads them.)
- **P3 LOCKS** *(optional)* — any terminology or phrasing rules you want enforced verbatim
  (preferred spellings, banned phrases, house style).

**MIDDLE — working material:**
- **P4a QUOTE INDEX** — a compact list of each quote you'll use: `ID · source · locus ·
  one-line description`. The drafting reasons over *this*, not the full quote text.
- **P5 EVIDENCE** — facts, figures, findings you want asserted, each graded `CONFIRMED` or
  `[UNCERTAIN]`. Only graded evidence may be asserted.
- **P6 FOUNDATION** *(optional)* — any existing draft you're building on, verbatim.

**TAIL — bulk reference:**
- **P4b QUOTE BANK** — every quotation, character-exact, keyed by ID, **also saved as JSON**:
  `{"Q1": {"text": "...", "cite": "..."}}`. This file feeds the substitution script.

**Gate G-P (before drafting):** every field present or marked N/A; every quote in the bank
verified against its real source *this session* (no "remembered" quotes); the JSON parses; the
index (P4a) and bank (P4b) keys match.

---

## 2. Stage D1 — The plan (no prose)

The assistant produces, from the pack:
- **Movements** — an ordered list; each with its one-sentence claim, assigned evidence + quote
  IDs, target word share, and **numeric style targets** for *that* movement (avg sentence length,
  short/long share, periodic-vs-running lean, diction note), derived from your P2 fingerprint —
  e.g. exposition runs longer and more periodic; close analysis shorter and more paratactic.
- **Evidence/quote ledger** — every P4a/P5 item marked ASSIGNED (to a movement) or UNUSED (why).

**Gate G-1:** no orphan claims; ledger closed. **You approve the plan before any prose is
written** (this is the default — say "draft straight through" only if you want to skip it).

---

## 3. How your trained style drives the draft

Your style enters at two points, both keyed to the profile you built with `/god-learn-style`:

- **Up front (D1):** the per-movement numeric targets are derived from your profile's fingerprint,
  so the draft *aims* for your voice from the first sentence rather than being corrected afterward.
- **At the gate (G-A):** after each draft the assistant runs the mechanical style analyzer against
  your profile and repairs sentence architecture until the metrics land inside the tolerance bands.

**The command the assistant runs for G-A** (you can run it yourself too):

```bash
npx tsx scripts/analyze-lanham.ts <draft-file> <your-profile-key>
```

It prints each Lanham metric for the draft next to your profile's **target** and the **Δ**
between them. Metrics outside their band (below) are style defects the assistant fixes in a
G-A repair pass — touching sentence architecture only, never the claims, quotes, or evidence.

| Metric | Pass band (|Δ| within) |
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

> Find your profile key any time with `node scripts/style-status.mjs` (or `/god-style-status`
> in the console). Your profile only carries a Lanham fingerprint if it was trained on
> full-length prose samples (≥ 500 words each) — see the setup guide, Part H.

---

## 4. Stage D1.5 — Skeleton (structure, still no prose)

For each approved movement, before any sentence exists: list the **nucleus claims** in order,
each with its **satellites** labeled by relation (evidence / elaboration / concession / contrast /
restatement), with each quote and evidence item attached to the satellite it serves. Then a
**counterargument pass**: for each major claim, the strongest fair objection and its disposition
(ANSWER / CONCEDE-AND-LIMIT / SURFACE-TO-YOU — never silently dropped). **Gate G-1.5:** every
nucleus has a satellite; every assigned item sits on one; every major claim has a counterargument
disposition; no new claims beyond the plan.

---

## 5. Stage D2 — Draft with quote markers

Full prose, movement by movement, from the skeleton:
1. **Quotes are markers, not text.** The draft writes `«Q1»` where a quote goes (`«Q1+»` to also
   pull in its citation), writing the prose *around* the quote using only the P4a one-line
   description. Real text is inserted afterward:
   ```bash
   python3 scripts/substitute-quote-ids.py <draft> <quotes.json> <out>
   ```
   The script exits nonzero on any unknown ID — an automatic quote-fidelity failure.
2. **Evidence asserted by grade:** `CONFIRMED` stated plainly (with its figure); `[UNCERTAIN]`
   hedged or omitted. Anything quote-like that isn't in the bank → paraphrase without quotation
   marks, or a `****** UNVERIFIED:` placeholder.

Output: the body in `<section>-DRAFT-v1.md`, with a header comment recording the pack version.

---

## 6. Stage G — The gauntlet

Mechanical gates first (cheap, deterministic), judge gates after. Failures produce a named
defect list that drives Stage R.

- **G-A · Style** *(mechanical)* — `analyze-lanham.ts` vs your profile; bands + labels (§3).
- **G-B · Quote fidelity** *(mechanical)* — substitution exits 0; every quoted span matches a bank
  entry; no quotation marks outside the bank; every ASSIGNED quote actually used.
- **G-C · Citation rigor** *(mechanical + read)* — every citation has a locus that traces to your
  P4/P5 or foundation; **no citation from model memory**; missing source → `******`.
- **G-D · Locks** *(optional)* — greps for any banned phrases / terminology rules you set in P3.
- **G-E · Foundation fidelity** *(judge call, lean context)* — a *separate* assistant call whose
  context is only the draft + the relevant evidence/foundation, answering a binary battery: is
  every RETAIN beat present? is any claim asserted beyond its evidence grade? is anything asserted
  with no warrant in the pack? Any failure → named defect.
- **G-F · Degradation** *(checklist)* — one section per cycle; no filler; no drift into generic AI
  phrasing.
- **G-G · Consistency** *(judge call)* — a separate call checking that locked terms are used
  consistently and no movement contradicts another. For multi-section work, run it across the
  assembled document.

---

## 7. Stage R — Revise, then hand off

1. Fix only what a gate named; one cycle clears all failed gates at once; then re-run the full
   gauntlet.
2. **≤ 3 gauntlet↔revision cycles** — returns diminish past two or three passes. Each cycle is
   guided by *fresh* judge calls, never the drafter critiquing itself in its own context. Still
   failing → stop and surface the conflict (usually a spec conflict, e.g. quote density vs.
   sentence-length band).
3. **Handoff:** the draft + the gauntlet report + the list of what was retained/new/omitted,
   explicitly awaiting your review. Nothing is committed until you sign off.

---

## 8. The one-line way to start it

Paste something like this into the `claude` console (fill in the brackets):

> Follow `FCDP-DRAFTING-PROTOCOL.md` to draft **[what: e.g. "the introduction to my methods
> chapter, ~800 words"]**. My trained style profile is **[your-profile-key]** — use it as the
> G-A target. Here is my pack: **[paste P1 task, P4a quote index, P5 evidence, and any P6
> foundation; attach the quotes JSON for substitution]**. Start at Stage P, show me the D1 plan
> for approval before drafting, and run the G-A style gate on every draft before showing it to me.

The assistant will assemble the pack, show you the plan, and only draft after you approve —
producing prose measured against your own voice at every step.
