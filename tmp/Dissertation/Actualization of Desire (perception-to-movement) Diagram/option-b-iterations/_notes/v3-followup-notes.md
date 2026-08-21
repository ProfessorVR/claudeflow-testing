# Option B v3 — Follow-up Notes (Open Questions for Future Sessions)

**Generated**: 2026-05-20T13:00
**Iteration**: v3 (post-v2 spacing fix + content corrections)
**Decisions captured this round**: Q1=C (T23 multi-modal duration), Q4=Fix A (Hexeis rename)
**Deferred for textual investigation**: Q2, Q3

---

## v3 changes applied (this iteration)

| Q | User decision | What changed in v3 |
|---|---|---|
| (spacing) | "More space, both axes, no A4 limit" | `\nodesep` 3.8→5.0; `\motionoff` 1.9→2.5; `\detailoff` 10.8→13.5; `\loopoff` 10.2→12.8; `\kinoff` 5.8→6.5; `\timeoff` 5.6→6.5; `\mxextra` 3.0→3.5; A3 sub-node x: NOESIS −2.6→−3.5, DISC +2.6→+3.5; EMO x 6.8→7.5; DOXA width 7→8 |
| (DISC frame) | "Bounding dashed bubble overlapped by internal bubbles; should be named Discursive" | A3-DISC parent height 1.0→1.6cm; removed redundant "synthetic operation" sub-label that was overlapping SPEC sub-node; "Discursive" title positioned at top of taller parent (no overlap with sub-nodes); sub-node heights 0.4→0.35; offsets adjusted (SPEC +0.25→+0.20, DELIB −0.25→−0.30) |
| Q1 | Option C: Multi-modal duration | T23 headline "variable by mode" → "multi-modal duration"; T23 detail box rewritten to emphasize structural temporal uniqueness without re-listing modes |
| Q4 | Fix A: Rename to "Hexeis (Standing Dispositions)" | hexis-band frame's above-label changed; "Settled Doxai (Hexeis)" → "Hexeis (Standing Dispositions)"; below-label citation retained (Met. Δ 20, 1022b 4 · GA 18 §17) |

---

## Open / Deferred Items for Future Sessions

### Q1 follow-up: Rethink ALL temporal bubble naming

Current v3 state:
- **T01**: "medium transmits" *(unchanged from v0)*
- **T12**: "trace persists & settles" *(unchanged)*
- **T23**: "multi-modal duration" *(v3 Option C — provisional)*
- **T34**: "desire → motor act" *(unchanged)*

**Question to resolve**: Per Phys. IV.11 (219b1), time IS the number of motion. Each Tₙ should describe the temporal character of its motion Mₙ. Do T01/T12/T34 actually capture pure temporal character, or do they describe content?

**Audit notes**:
- **T01** "medium transmits" describes WHAT moves (the form via the medium), not the temporal character. Alternative: "Instantaneous–propagated" or "Co-extensive with sensible exercise" or "Fast: limited by medium speed"
- **T12** "trace persists & settles" describes residue dynamics (content), not pure temporal character. Alternative: "Settlement-time" or "From immediate to indefinitely persistent"
- **T23** "multi-modal duration" *(v3)* — structurally describes the temporal variability of M₂→A₃
- **T34** "desire → motor act" describes desire-to-action transformation (content), not temporal character. Alternative: "Virtually simultaneous" (per MA 702a15–17) or "Compressed: active-passive natural correspondence"

**Action**: Dedicated session to redesign all 4 temporal bubbles together, ensuring each captures pure temporal character per the Phys. IV principle. Consider whether T23 itself should be revised to match the new pattern.

---

### Q2 follow-up: Universal vs conditional vs graded A₄→Hexeis feedback

**Status**: DEFERRED for textual investigation. v3 retains the single solid A₄→hexis-band arrow inherited from v2.

**Texts to pull**:
- **Aristotle**:
  - NE II.1, 1103a14–26 (ἕξις acquired via repeated action — voluntary character)
  - NE II.5, 1105b19–1106a13 (hexis vs pathē vs dynameis; virtues as hexeis)
  - MA 701a32–33 (pure appetitive bypass: "I want to drink, says appetite; this is drink, says sense or imagination: straightaway I drink")
  - NE VI.5, 1140a24–b30 (φρόνησις requires deliberation; distinguishing from technē + empeiria)
  - Met. A.1, 980b25–981a30 (empeiria as accumulation from many memories; distinguishing from technē)
  - NE VII.10, 1152a30–34 (akrasia and the failure of hexis to govern action)
- **Heidegger**:
  - GA 18 §17 (hexis bivalence — technē-hexis reduces deliberation; praxis-hexis holds open)
  - Possibly GA 19 (Sophist lectures) on appropriation and habituation

**Key question**: Does pure appetitive action (Type 1 chain — "see drink, I drink") feed back into the doxastic-practical repertoire at all? Or does it bypass hexis formation entirely? If feedback exists, is it strong or weak?

**Three readings still on the table** (from prior discussion):
1. **Universal**: All A₄ → hexeis. Single arrow.
2. **Conditional**: Only Type 2/3 chains feed hexeis. Type 1 bypasses.
3. **Graded** *(my prior recommendation)*: All voluntary action feeds back, but Type 2/3 → strong hexis (technē/praxis), Type 1 → weak empeiria-only. Dual arrows + new empeiria node.

**Dependency**: Outcome will inform whether the diachronic feedback channel needs restructuring (add empeiria node, conditional gating, or stay single-arrow).

---

### Q3 follow-up: Deliberative → M₃→A₄ "bypass" of DOXA (Path 1)

**Status**: DEFERRED for textual investigation. v3 retains the Path 1 teal arrow from DELIB.south to M34.north-west inherited from v2.

**Texts to pull**:
- **Aristotle**:
  - DA III.10, 433a13–15 (practical thought "calculates means to an end"; speculative "moves nothing")
  - DA III.11, 434a5–11 (deliberative phantasia synthesizes; doxa requires inference, phantasia doesn't)
  - MA 701a7–25 (practical syllogism: universal premise = doxa held in rational soul as standing disposition)
  - DA III.3, 427b17–24 + 428a19–24 (doxa requires belief, conviction, λόγος — only rational animals)
  - NE VI.5 (φρόνησις deliberation; distinguishing means-end calculation from belief-formation)
- **Heidegger**:
  - GA 18 §15 on Aristotle's distinction between θεωρεῖν and διαλέγεσθαι
  - GA 19 (Sophist) on the structure of practical reasoning

**Key question**: Can deliberation issue in action without engaging doxa (either episodically OR via settled-universal-as-doxa-in-hexis)? Or is doxa always present in some form?

**Three interpretations still on the table** (from prior discussion):
1. **Path 1 is wrong, remove it**: Per MA 701a7–25, deliberation's universal IS a doxa. No genuine bypass.
2. **No new EPISODIC doxa formed** *(my prior recommendation)*: Universal in hexis is doxastic; deliberation doesn't form a new episodic doxa but draws on standing one.
3. **Follow-through-on-prior-decision**: Doxa engaged earlier (off-frame); current execution doesn't re-engage doxa.

**Dependency on Q4**: If Q4 = Fix A (hexis distinct from doxa), then "settled doxa in hexis" needs careful unpacking. Interpretation 2 may need rewording to: "Deliberation draws on universal DOXASTIC HEXIS (a specific species of hexis, not hexis-as-such); no new episodic doxa formed." This makes Q3 effectively pre-requisite on Q4 settled in dissertation prose.

---

### Q4 follow-up: Dissertation text needs Hexeis/Doxai clarification

**Status**: v3 diagram updated (Fix A applied: "Hexeis (Standing Dispositions)"). DISSERTATION TEXT must also be updated to reflect the distinction.

**Action items for dissertation text review**:
1. **§1.0 Introduction**: Where the diagram is discussed (specifically the Settled Doxai / Hexeis region), prose must clarify:
   - Hexis is the broader genus (per Cat. 8b27ff)
   - Settled doxai are one SPECIES of hexis (the doxastic-cognitive species, per MA 701a7–25 practical syllogism's universal premise)
   - Technē-hexis and praxis-hexis are NOT primarily doxastic but are character/craft dispositions (per NE II.1, II.5; GA 18 §17)
2. **§1.4 Emotion is Motion**: Check for any conflation in:
   - Discussion of doxa-as-habituated-disposition
   - Treatment of praxis-hexis and its relation to doxa-gating of pathē
3. **§1.5 Completed Action**: Check for any conflation in:
   - Type 2 chain (technē-hexis) treatment — is it cast as "settled doxai" or as "settled craft dispositions"?
   - Type 3 chain (praxis-hexis) treatment — same audit
4. **Cross-section consistency**: §1.3 introduces orientational modes; §1.4 introduces the bivalence; §1.5 catalogs operational types. The terminology must be consistent across all three.

**Search pattern**: grep for "settled doxa", "doxa-as-hexis", "hexis = doxa", "hexis is doxa", "doxai as hexeis" in the dissertation `.md` and `.tex` files.

**Suggested rewrite formula**: where the current text equates settled doxai with hexeis, refactor to: "settled doxai operate as a doxastic species of hexis (the universal premise of the practical syllogism); technē-hexis and praxis-hexis as dispositional states are broader, including but not reducible to their doxastic components."

---

## Summary Table

| Item | Status | Next Step |
|---|---|---|
| Q1 (T23) | Provisional fix in v3 | Revisit in dedicated temporal-bubble session |
| Q2 (A₄→hexis feedback) | Deferred — diagram retains v2 single-arrow | Pull Aristotle/Heidegger texts; decide between Universal/Conditional/Graded |
| Q3 (Path 1 doxa bypass) | Deferred — diagram retains v2 Path 1 | Pull Aristotle/Heidegger texts; resolve interpretation; depends on Q4 settled in prose |
| Q4 (Hexis ≠ Doxa) | Diagram fixed in v3 | Dissertation prose audit + update across §§1.0/1.4/1.5 |
| Spacing | Fixed in v3 | User review |
| Discursive frame | Fixed in v3 | User review |

---

**End v3 follow-up notes.**
