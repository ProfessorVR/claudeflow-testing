# REPORT — Desktop Section: Version Verification + Drafting Protocol (2026-08-06)

Prepared for author review. Two questions answered: (1) is
`drafts/DESKTOP-SECTION-OVERLEAF-v1.tex` the final and most recent version of the Part III
desktop section? (2) what protocol was used to draft it?

---

## 1. Version verification — YES, with one structural caveat

**`DESKTOP-SECTION-OVERLEAF-v1.tex` is the most recent complete rendition of the desktop
section.** Evidence:

- Last modified **2026-07-31 19:30**, minutes before `HANDOFF-DESKTOP-READTHROUGH-COMPLETE-2026-07-31.md`
  was written (19:42). Nothing in `drafts/` touching the desktop section has changed since —
  the only later file is `LAB-BOREDOM-L1-DRAFT-v1.tex` (2026-08-06, different section).
- It is **committed in `1247697f8`** ("draft(part-iii): desktop section full readthrough
  revision pass (batches 1-8)", local only, not pushed), and `git status` shows the working
  copy is **identical to the commit** — no uncommitted edits.
- It contains the full readthrough state: all eight user-ruled revision batches (M0–M7),
  the intro/thesis/close alignment pass, and the doctrine sweeps. Compiles clean at 40 pages.

**The caveat:** the Overleaf file is a *generated* artifact, not the editing source of record.
The canonical sources are the eight module files `DESKTOP-M0-DRAFT-v2.tex` /
`DESKTOP-M1..M7-DRAFT-v1.tex` (same 07-31 state, same commit). The build workflow (readthrough
handoff §5) is: edit module files → re-flatten (`flatten.py`, archived at
`drafts/.backups/20260731T-pre-M0-readthrough-batch1/`) → XeLaTeX. Its twin
`DESKTOP-SECTION-ASSEMBLED-v1.tex` is the `\input`-based wrapper of the same modules; both
compile to byte-identical 40-page PDFs. So: **read/ship the Overleaf file; edit the module
files.**

**"Final" means final-as-of-the-readthrough.** The file deliberately carries marked open
items (all listed in the 07-31 handoff §3 and in the file's own header comments):

1. Two USER MANUAL REWRITES pending (M2 coding ¶ + coding-passes fn; M3.6 keyword-sweep fn).
2. M3.5 figure placeholder (group co-watching screenshot).
3. Works Cited pagination pins (Boellstorff 2023, Mark, Tu, Parong & Mayer 2018; `******` kept
   per user order).
4. M1 Merchant "semester of SL chemistry" flag — ruling pending.
5. STALE-1/STALE-2 lab-keystone passages (M3.6, M4.1 ¶6) — banner at the top of the Overleaf
   file; queued for after the lab boredom section by author ruling 2026-07-29.
6. BLOCKED: M4.4 revision (← Part II closing differential); M2.3 + O-11 + three-state
   harmonization (← arc decision ← lab section).

---

## 2. Protocol finding — Stage-3 guided drafting (FCDP-adjacent, not FCDP-proper)

**The desktop section was NOT drafted by the full FCDP pipeline** (Stage P pack → D1 → D1.5 →
D2 with «Qnn» markers → seven-gate gauntlet). Direct evidence: `plans/packs/` contains **no
desktop-M packs at all** — the `part-iii-0..5` packs there (Jul 6–7) belong to the earlier,
superseded "Stalled Chain" III-0–III-5 full-run drafts, and the only FCDP-proper packs since
are the current lab-boredom L1 ones (Aug 6).

What actually produced the section is the **three-stage guided protocol** with FCDP v2 as a
convention layer and archon-cli as the evidence backbone. Canonical statement:
`HANDOFF-DESKTOP-SECTION-STAGE3-DRAFTING-2026-07-16.md` §4 ("Stage 3 protocol (established,
canonical)"), restated in the completion handoff (07-28) §1.

### 2.1 The three stages, as run

| Stage | What | When |
|---|---|---|
| Stage 1 | Orientation/hypotheses: H1 completion-hypothesis spine + H3 clause; WE elevated as author focus | complete by 2026-07-15/16 |
| Stage 2 | Modular outline (M0–M7) walked through and approved module-by-module; LIT-SLOT fill pass approved slot-by-slot against the VR Pedagogy Secondary entry (34 units) | walkthrough + fill 2026-07-16; approved 2026-07-19 |
| Stage 3 | Guided drafting, M0 → M7 in order | 2026-07-20 → 2026-07-28 |
| (post) | Assembly pass (stitch + Works Cited + checks) | 2026-07-29 |
| (post) | Author readthrough, 8 revision batches, all user-ruled → commit `1247697f8` | 2026-07-31 |

### 2.2 Stage 3 mechanics (the process you were pleased with)

1. **Paragraph-level plans first; 1–3 ¶ batches.** Present the batch plan in prose → user
   approval → draft → present → revise on feedback → next batch. One module at a time.
2. **Role definition:** Claude as *senior research collaborator / writing partner, not
   autonomous drafter*. User drives pacing; no autonomous full runs. Prose decision points,
   never polls.
3. **Approval gate at every batch** — nothing advanced unapproved; edits applied immediately
   on approval; timestamped backups to `.backups/` before touching approved files.
4. **Register control specified up front:** Part-II applied register ("figured-but-plain");
   band structure per module header — M2/M3 Band R with exactly ONE Band-G hinge sentence per
   M3 sub-module; M4 Band G throughout.
5. **Verification-gated evidence:** quotes char-exact against CSV/PDF *before* entering prose;
   corpus/index entries FIRST, then PDFs; Gross rigor on every citation; anything unverifiable
   → `****** UNVERIFIED:`.
6. **Archon tandem division of labor (decided 2026-07-17):** Fable in-session manages the
   drafting loop and all analytic-layer work; **archon-cli supplies literature verbatims
   only** — `evidence find --mode exact|hybrid` against the 224-doc corpus, accepting only
   `exact-1.00 · bbox ✓` spans; quoted text enters prose only as the retrieved span, never
   retyped. Archon never drafted.
7. **Model policy:** drafting on Fable @ max effort; ultracode OFF.

### 2.3 FCDP v2's actual role

- **Conventions "where invoked," not machinery.** The 07-16 handoff (§4.7) states it exactly:
  "FCDP v2 conventions apply where invoked … But the per-paragraph guided protocol above
  governs this section." What carried over: the lock list (§7), `******` placeholder
  discipline, verification-before-prose, the no-corpus-retrieval-in-drafting rule, style/voice
  targeting. What did NOT run: packs, D1/D1.5 artifacts, «Qnn» substitution, the G-A…G-G
  gauntlet, judge calls.
- **Influence also ran the other way:** FCDP v2 §10 ("Structural defaults," added 2026-07-20,
  author-directed) was written OUT of the desktop M0 session — the six-move introduction
  structure and the M0.4 seven-part roadmap as the gold-standard signpost exemplar
  (`reference-gold-standard-roadmap`).

### 2.4 Placement among the three drafting modes used on Part III

| Run | Mode | Outcome |
|---|---|---|
| III-0…III-5 "Stalled Chain" (Jul 6–7) | FCDP-proper (packs + D1 + substitution) | Superseded by the M-module section |
| **Desktop M0–M7 (Jul 20–31)** | **Stage-3 guided drafting + archon evidence backbone + FCDP conventions** | **The section you approved — this report's subject** |
| Lab Boredom L1 (Aug 6, in progress) | FCDP-proper (L1 pack v2, D1 plan, D1.5 skeleton) — tandem: archon-cli FCDP vs. primary console, same pack | Running; 0 movements accepted at last handoff |

**Implication worth noting:** the process that produced the result you were pleased with is
the *guided-batch* protocol, not FCDP-proper. The current lab-boredom tandem run is precisely
the experiment that will show whether FCDP-proper (pack-driven, gate-enforced) matches it. If
the tandem result disappoints, the desktop recipe is fully reproducible from:
`HANDOFF-DESKTOP-SECTION-STAGE3-DRAFTING-2026-07-16.md` (§4 protocol + §5a archon backbone)
→ outline walkthrough first, then batch drafting.

---

## 3. Source documents consulted

- `drafts/` directory state + `git log --follow` / `git status` on the section files.
- `HANDOFF-DESKTOP-READTHROUGH-COMPLETE-2026-07-31.md` (version + build workflow).
- `HANDOFF-DESKTOP-SECTION-DRAFTING-COMPLETE-2026-07-28.md` (protocol summary, §1).
- `HANDOFF-DESKTOP-SECTION-STAGE3-DRAFTING-2026-07-16.md` (canonical Stage-3 protocol + archon tandem).
- `plans/fable-console-drafting-protocol-v2.md` (FCDP v2, incl. §10 added 2026-07-20).
- `plans/packs/` inventory (absence of desktop packs; presence of part-iii-* and L1 packs).
- File headers of `DESKTOP-SECTION-ASSEMBLED-v1.tex` and `DESKTOP-SECTION-OVERLEAF-v1.tex`.
