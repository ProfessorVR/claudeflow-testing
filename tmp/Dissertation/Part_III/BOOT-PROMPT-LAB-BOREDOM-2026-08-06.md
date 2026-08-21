We are resuming the LABORATORY BOREDOM section of Part III of my dissertation. Stage 2 is finished. The v5
analysis tree is current and verified, the claim-level index has been rebuilt, Step A's reading is done but its
verification has a tail, and no prose exists. You are picking up at the pre-drafting step.

**Read these before doing anything else, in this order:**

1. `tmp/Dissertation/Part_III/HANDOFF-LAB-BOREDOM-X07-X08-COMPLETE-2026-08-05.md` — full state. Read it in full
   first. Its §0 carries the three requirements that govern everything you do this session, and §0.1 carries an
   index-ownership change that will send you to the wrong tree if you miss it.
2. `tmp/Dissertation/Part_III/PART-III-LAB-BOREDOM-SECTION-OUTLINE-v6-2026-08-05.md` — **an amendments layer,
   read WITH v5, not instead of it.** Then `…-OUTLINE-v5-2026-08-05.md` for the module-by-module spec.
   Consolidating these into v7 is an approved early task.
3. `tmp/Dissertation/Part_III/DECISIONS-REGISTER-v8-2026-08-05.md` — every ruling. §§0–5 binding; §6 is the three
   still-open decisions.
4. `plans/fable-console-drafting-protocol-v2.md` — the drafting method of record. §0 roles and invariants, §9
   invocation checklist.
5. `PROSE-METHODS-CRITERION-VALIDITY-v2-2026-08-05.md` and `PROSE-METHODS-GAZE-BASELINE-v2-2026-08-05.md` — two
   drafting-ready methodological statements. Paste where the outline says; do not rewrite. **The v1 files are
   superseded and carry inverted signs — never paste from them.**
6. From `tmp/Dissertation/Part_III/boredom-analysis-v5-2026-08-05/`: `FINDINGS.md`, `METHODS.md`,
   `APPENDIX-CRITERION-VALIDITY.md` (including §6b), `QC-REPORT.md`, `EXCLUSIONS.log`, `figures/INDEX.md`.
   **v5 is current and is the only tree you may quote numbers from.** v4 is the untouched audit artifact.
7. `STEP-A-QUOTE-VERIFICATION-LEDGER-2026-08-05.md` + `STEP-A-GATED-QUOTES-2026-08-05.tsv` — what is verified and
   what is not. `X-08-INDEX-COMPLETION-SPEC-2026-08-05.md` — the index work and its tail.
8. From `tmp/Dissertation/Part_III/drafts/`: `DESKTOP-M4-DRAFT-v1.tex` ¶¶4–7 of M4.1 — the three-forms exposition
   this section inherits and never re-derives — and `DESKTOP-M7-DRAFT-v1.tex` M7.1, the hand-forward it redeems.

---

## THREE REQUIREMENTS, NON-NEGOTIABLE

**1. Drafting runs under FCDP.** Pack → D1 → D1.5 → D2 with `«Qnn»` markers → `substitute-quote-ids.py` → the
seven-gate gauntlet → targeted revision (≤3 cycles) → my review. Prose and judge steps run on Fable 5 at xhigh;
judge passes are separate lean-context calls. **Tell me before drafting starts so I switch the model myself.**

**2. All source retrieval, analysis and verification comes from the WSL `archon-cli-v3` project and nowhere
else** — binary `/home/dalton/projects/archon-cli-v3/target/release/archon`, store `.archon/`, corpus `corpus/`,
and **index `index/` at the project root, NOT `corpus/index/`.**

**★ v3 is now the AUTHORING HOME as well as the read source (ruled 2026-08-05). Never sync from
`claudeflow-testing/corpus/index` in either direction — it is the stale replica. `INDEX-OWNERSHIP.md` still says
the opposite and has not been rewritten; do not follow it.** Do not touch `projects/archon-cli`, the Mac replica,
ChromaDB, LEANN, god-learn, or any web search. Retrieval order is index entry → `docs search` →
`docs verify-quote`, **gated on EXACT MATCH, never on "found" and never on a fuzzy hit.** The shell resets its
working directory between calls, so `cd` to the v3 project inside every command.

**Two archon behaviors produce FALSE failures — rule both out before calling a quotation wrong:** hyphens break
the FTS query parser (`FTS search failed … capped at 2000 chunks`), and unrestricted search can miss a quotation
that is present. **Both are fixed by `--doc <document_id>`.**

**Reconcile 1 and 2 correctly.** FCDP says the pack is authoritative and there is no retrieval during drafting.
So retrieval happens **only** at pack assembly and at the optional post-gauntlet verification stage, and only
from archon-cli-v3. During D1, D1.5, D2 and the gauntlet there is no retrieval at all — a missing quotation
becomes `******` and waits for a pack revision.

**3. Do these before any drafting, in this order.**

- **Finish the index tail** (`X-08-INDEX-COMPLETION-SPEC` §4 and handoff §1.1): `corpus_groups` did not move, so
  the three group entries have no home yet — tell me whether that was deliberate. Ingest **VanderWerf et al.
  (2003)**, which is not in the store at all and licenses the 500 ms blink ceiling. Then regenerate the synthesis
  artifacts.
- **Finish Step A's tail** (ledger §4): read the four now-indexed documents (Eastwood 2012, Fahlman 2013, Mugon
  2020, van den Brink 2016), read the regenerated `_synthesis` layer, and resolve ~8 unverified quotation
  candidates plus 12 ellipsis-elided ones.
- **Assemble consolidated outline v7** from v5 + v6 + whatever the regenerated debate map changes. Drafting from
  two outline documents is a defect waiting to happen.

---

## WHAT THE SECTION ARGUES

Applied philosophy: a phenomenological and rhetorical-ontological frame interpreting quantitative data collection
and analysis. The two published studies did not lack a frame — they had a different one, named it, and built the
study on it. They adopted Fahlman's definition of boredom, which is Eastwood's, and which requires that the bored
person attribute the cause to the environment. Heidegger's second form denies exactly that condition. So the
published studies could only ever have detected the first form; the keystone shows up as a **divergence rather
than a measurement**; and the self-report channel is itself a first-form instrument, which is both a limit and
the condition that makes the divergence legible.

---

## FOUR THINGS THAT MUST NOT BE VIOLATED

**Head movement.** Present in this data and **not instrumented in this pass** — gaze is eye-in-head, and Round 1
participants were instructed not to move because it would corrupt the EEG. **Never write that the boring film
produced stillness rather than restlessness.** The accurate form: the eye channels show withdrawal, and the
search behavior visible in the session video was not instrumented here.

**Profound boredom cannot be measured, and this is the frame's own rule, not our modesty.** Heidegger: *"Not only
can an attunement not be ascertained, it ought not to be ascertained, even if it were possible to do so,"* since
*"all making conscious means destroying, altering in each case."* No measurement here evidences profound boredom
and none is claimed to. What the instruments show are episodic structures resembling parts of its anatomy, named
as resemblances every time. Display this note wherever the third form appears.

**Every criterion probability is a within-subject permutation p.** Three associations clear alpha analytically
and not under permutation; they are reported as non-significant.

**Potentiality.** The situation does not furnish a single act; it **narrows the field** of potentialities
available for actualization. Sleep is an actualized potentiality, not an absence.

---

## WHAT CHANGED SINCE THE LAST BOOT PROMPT — do not draft from stale numbers

- **Eye closure signs are INVERTED (D-11 executed).** Criterion **+0.460** vs boredom, **−0.416** vs engagement;
  separation rb **+0.974** / **+1.000**, direction 11/12 and 12/12. Probabilities unchanged to the last digit,
  and the composite is provably unchanged — the keystone is byte-identical to v4.
- **D-12 REVISED:** the criterion gaze measure is the **per-participant** baseline (+0.590 / −0.585), per-file
  reported alongside, separation still on device-forward. Every gaze number names its baseline.
- **Sleep-fight is 10 of 12, not 12 of 12** — 10 higher, 0 lower, **2 tied** (S04 1/1, S06 6/6).
- **Thomson (`bor-sec-19`) is NOT a boredom source** — zero occurrences of the word. Keep him for the
  paideia/enframing frame only. **Scharinger is 2015, not 2019**, also not a boredom source — but he is a
  published precedent for this section's oppositional ranking.
- **`bor-sec-11` (Hernández Albarracín) is DROPPED** — Spanish-language, per your ruling; the only non-English
  source of the eighteen. L1 ¶3 rests on Quaranta alone.
- **O-03 is CLOSED:** the co-author/participant overlap is **not stated** in this section, and no
  hypothesis-awareness account is added to L4.2 or L6.

---

## STANDING RULES, ALL IN FORCE — detailed in handoff §3 and register v8 §7

Verification-gated: quotes EXACT before entering prose; index entries first, then archon, then PDFs; FCM page
loci read from the running head, never computed. Backups to `.backups/` before touching any approved file.
Doctrine locks: chain-node walkthrough is the analytical form · NO-STALL, the chain runs always · GREATEST-DESIRE,
never "better route" · "demonstrated" never "prove" · potentiality always actualized within a narrowed field.
Standing sweeps before every batch: sentence-initial *And* · "record" as an evidence-name · "pole" · ladder ·
stall · cost/price/spend metaphors · bare "incorporation" · vague paragraph frames. Scientific-direct register,
MLA, *Rhetorica* in Aristotle parentheticals, no module labels in rendered text, bare paragraph numbers when
presenting. **American spelling — "center," never "centre."** Statistics reported as directional convergence plus
the surfaces that actually reach significance; anything n < 6 labelled descriptive. Category caution: episodic
structural grammar, never a *Grundstimmung* claim. PII: `S01`–`S08` and `R2-01`–`R2-04` only, in any file; the
crosswalk is never persisted; Round 1 source filenames carry participant names, so never reproduce file paths in
output. I may use real names in conversation and they must never reach an output. Discuss forks in prose, never
polls. Ultracode off. **Nothing gets committed without my explicit sign-off — nothing across any of these
sessions has been committed.**

---

**Start by reading the handoff and the two outline documents, then tell me where we are, confirm the three
requirements above, and propose what to do first.**
