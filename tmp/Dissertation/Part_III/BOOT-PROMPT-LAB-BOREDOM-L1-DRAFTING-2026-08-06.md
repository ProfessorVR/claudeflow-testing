You are drafting **L1, The Three Literatures** — the opening literature module of the Laboratory Boredom section of Part III of my dissertation. Stage P is complete: the evidence pack is assembled and gate-clean. No prose exists yet. You are writing the first words of this section.

Assume you have nothing but this prompt, the handoff, and the pack. That is by design.

---

## MODEL PRECONDITION — confirm before you start

Prose and judge steps must run on **Fable 5 at xhigh**, and **judge passes are separate calls with lean contexts** — the draft, the rubric, and only the pack fields the rubric names, never the drafting conversation. I set this before pasting this prompt. If you are not on that configuration, say so and stop.

---

## READ THESE, IN THIS ORDER

1. `tmp/Dissertation/Part_III/HANDOFF-LAB-BOREDOM-STAGE-P-COMPLETE-2026-08-06.md` — full state. Its §0 lists the authoritative doc set and the superseded files; §3 is the banned set.
2. `plans/packs/lab-boredom-L1-pack-v1.md` — **the pack. This is your evidence source.** Its companion `lab-boredom-L1-pack-v1-quotes.json` is the substitution bank.
3. `tmp/Dissertation/Part_III/PART-III-LAB-BOREDOM-SECTION-OUTLINE-v7-2026-08-06.md` §L1 — the module spec, paragraph by paragraph. **v7 is standalone.**
4. `tmp/Dissertation/Part_III/DECISIONS-REGISTER-v8-2026-08-05.md` — every ruling. §§0–5 binding, §6 the three open decisions.
5. `plans/fable-console-drafting-protocol-v2.md` — the drafting method of record. §0 roles and invariants, §9 the invocation checklist.

**Never open these. Several would actively corrupt the draft:** outline v1–v6 · register v3–v7 · `PROSE-METHODS-*-v1-2026-08-04.md` (both carry the eye-closure signs **inverted**) · `boredom-analysis-v4-2026-08-04/` (v5 is the only tree numbers come from) · `BOOT-PROMPT-LAB-BOREDOM-STAGE3-2026-08-05.md` and `BOOT-PROMPT-LAB-BOREDOM-2026-08-06.md` (both predate the handoff; the first names v4 as current, tells you to paste the v1 method files, and reopens a question that was ruled closed).

---

## THE PACK IS THE SOLE EVIDENCE SOURCE

FCDP's central rule: **no retrieval during drafting.** Not in D1, not in D1.5, not in D2, not in the gauntlet. Corpus retrieval overrode the pack with junk in the run that established this protocol, which is why it is banned rather than discouraged.

Not in the pack → not in the draft. It becomes `******` and waits for a pack revision. **A missing quotation is never a reason to look something up mid-draft.**

Store verification happens at exactly two moments: pack assembly, which is already done, and the optional post-gauntlet citation check, which runs on the finished draft in a separate context. If you need retrieval at either, it comes only from `archon-cli-v3` (binary `target/release/archon`, store `.archon/`, index `index/` at the project root — never `corpus/index/`), gated on **EXACT MATCH**, never on "found" and never on a fuzzy hit.

**Quotations are never generated.** Emit `«Qnn»` where a quote belongs and write the prose around it. The words enter only by substitution:

```
python3 scripts/substitute-quote-ids.py <draft.tex> plans/packs/lab-boredom-L1-pack-v1-quotes.json <out.tex>
```

A non-zero exit is an automatic gate failure. Anything quote-like outside the bank becomes a paraphrase without quotation marks.

---

## THE PROTOCOL

`P (done) → D1 → D1.5 → D2 → substitute → G (7 gates) → R (≤3 cycles) → my review`

- **D1** — movement plan with per-movement numeric style targets, plus the quote/evidence ledger closing every pack item to ASSIGNED or UNUSED-with-reason. **My approval on the plan is default-ON.** The foundation-disposition table is empty by construction: L1 is new prose and the pack's P7 is empty.
- **D1.5** — skeleton: nucleus claims with satellites labeled by rhetorical relation, and a counterargument pass. Every major claim gets ANSWER, CONCEDE-AND-LIMIT, or SURFACE-TO-ME. Show me the skeleton only if the counterargument pass produced something to surface.
- **D2** — prose, movement by movement, with `«Qnn»` markers.
- **G** — five mechanical gates then two judge gates: G-A Lanham style · G-B quote fidelity · G-C citation rigor · G-D terminology locks · G-E foundation fidelity (judge) · G-F degradation checklist · G-G consistency (judge).
- **R** — fix only what a gate named, then re-run the full gauntlet. Three cycles maximum; still failing means a spec conflict, so stop and surface it.

**Batch protocol: 1–3 paragraphs per batch, an approval gate on every batch, bare paragraph numbers when you present.** Do not run ahead of my approval.

---

## WHAT L1 HAS TO DO

Twelve paragraphs, 4–5 pages. It establishes the warrant the rest of the section spends — bibliographic in ¶9, definitional in ¶10 — and the definitional half is the section's spine.

The two published studies did not lack a frame. They had a different one, named it, and built the study on it: Fahlman's definition of boredom, which is Eastwood's, which requires that the bored person **attribute the cause to the environment**. Heidegger's second form denies that condition twice over, and the two denials do different work. One defeats it *on the instrument's own terms* — there is nothing to attribute the boredom to. The other supplies the *ontological counter* — it arises from Dasein instead. So the published studies could only ever have detected the first form, the keystone shows up as a **demonstration rather than a measurement**, and the self-report channel is itself a first-form instrument, which is both a limit and the condition that makes the divergence legible.

**Cite the machine anchors rather than re-deriving the chain**: `ten-eastwood-unengaged-2012-01` and `-02`, `ten-fahlman-msbs-2013-01`, `ten-king-salvo-physio-2023-04`, `cl-heidegger-fcm-1929-007`.

**Never re-derive the three forms.** They are rendered prose in the desktop section (M4.1 ¶¶4–7) and L1 inherits them. Outline v7 §A lists everything else that is inherited and never rebuilt.

---

## CONSTRAINTS THAT ARE NOT NEGOTIABLE

**Head movement.** It is present in this data and **not instrumented in this pass** — gaze is recorded eye-in-head, and Round 1 participants were instructed not to move because it would corrupt the EEG. **Never write that the boring film produced stillness rather than restlessness.** The permitted form: *the eye channels show withdrawal, and the search behavior visible in the session video was not instrumented in this pass.*

**Profound boredom cannot be measured, and that is the frame's own rule rather than our modesty.** No measurement evidences it and none is claimed to. What the instruments show are episodic structures resembling parts of its anatomy, named as resemblances every time. Category caution is episodic structural grammar, never a *Grundstimmung* claim.

**Three quotations are banned and must never be reconstructed** — one is a splice across two authors whose first half is a diagram label, one is a reading gloss, one has no hit anywhere in the store. Handoff §3 names all three.

**Two attribution hazards** — the Elpidorou sentence is Elpidorou citing Fahlman, and the Slaby sentence is Slaby citing *Being and Time*, not FCM. Both are flagged on their pack rows.

**Every FCM locus is read from the running head, never computed.** The FCM scan is a two-page spread, so archon's page index is not the printed page; older records in this project carry PDF-page ranges. The pack has the corrected printed pages.

**PII.** Participants are `S01`–`S08` and `R2-01`–`R2-04`, in any file, always. The crosswalk is never persisted. Round 1 source filenames carry participant names, so **never reproduce a file path in output.** I may use real names in conversation; they must never reach an output.

The standing prose locks — the terminology list, the forbidden-phrase blacklist, the standing sweeps — are in the pack at **P3** and **P8**, copied in rather than referenced. Run the sweeps before presenting every batch. American spelling throughout: "center," never "centre."

---

## HOW WE WORK

Discuss forks in prose; never poll me with options. Ultracode off. Back up any approved file to `.backups/` before touching it. Present proposed prose as flowing text, not code blocks.

**Verification-gated, and this is absolute: show me the evidence and wait for my sign-off. Nothing is committed without it — nothing on the dissertation side has been committed across any session of this work.**

---

**Start by reading the handoff and the pack, then tell me where we are, confirm the protocol and the model precondition, and give me the D1 movement plan for approval.**
