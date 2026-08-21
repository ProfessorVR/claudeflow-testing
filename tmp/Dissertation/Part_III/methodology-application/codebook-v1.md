# Survey Coding Codebook v1 — VLE Open-Text Corpus (Q5/Q6/Q9/Q10, three terms, ≈870 responses)

**Phase 1A deliverable → GATE G1.** Governs the Phase 2B two-pass coding. Built 2026-07-06.
**Unit of coding:** the response *segment* (a clause or sentence carrying one codable idea); a response may carry multiple codes. **Multi-coding allowed across families; within a family, choose the best fit.**
**Every code application records:** respondent code (e.g. `W25-R014`), item (Q5/Q6/Q9/Q10), segment text, code ID, pass (1/2).
**Provenance:** all form-mappings are PROJECTED readings of self-report; codes name *signatures in talk*, never certified attunements. Category caution in force.
**Procedure:** Pass 1 full-corpus → codebook revision memo (new/merged codes) → Pass 2 full-corpus with frozen codebook → adjudication log for disagreements between passes → negative-case search (segments resisting all codes) → saturation statement → counts + co-occurrence matrices (per term, per Q7×Q8 stratum) → exemplar bank (verbatim-verified).

## Family A — Boredom-form signatures
- **A1-CULPRIT** · Form-1 signature: a *determinate* thing named as the problem. Include: named frictions (crashes, bugs, lag, buffering, dark rooms, navigation, proximity, controls, audio, installation). Exclude: diffuse dissatisfaction with no object (→ A2-DIFFUSE). Ex: "The VR platform needs to be able to work. There are so many bugs that it makes it hard to use."
  - Sub-tags (for the friction-prediction test): `A1.dark` darkness/legibility · `A1.nav` navigation/wayfinding · `A1.crash` crash/bug/glitch · `A1.lag` latency/buffering/optimization · `A1.occl` avatar occlusion/bodies-in-way · `A1.prox` must-stand-close · `A1.install` install/download/compatibility · `A1.hw` hardware/headset access · `A1.other`
- **A2-DIFFUSE** · Form-2-adjacent talk: dissatisfaction/emptiness WITHOUT a determinate culprit ("I don't know, it just didn't do much for me"). Rare in feedback surveys; do not force.
- **A3-MONOTONY** · Boredom/tedium words about the *offering*: "monotonous," "boring," "repetitive," "dry," "tedious." Ex: "The videos could be a bit remodeled because it tends to be monotonous and boring."
- **A4-DIV** · **Divergence candidate**: within ONE respondent, surface-positive signal ∧ hollowness signal (see app-memo §4.2 for the three admissible pairs). Applied at the *respondent* level during analysis, flagged at segment level during coding. Ex: "The actual idea of having the VR clinic is amazing, the videos and images that come with it not so much."
- **A5-WITHDRAWN** · Cessation/abandonment talk: gave up, stopped using, "can't give feedback, never used it" *after* trying. Exclude pure non-access (→ B1). Analogy discipline: never reported as form 3, only as exit/withdrawal.

## Family B — *Zeitvertreib* / flight patterns
- **B1-FALLBACK** · Flight to the easier modality: used YouTube/videos instead of the app (any reason). Ex: "…most students just resort to the online videos."
- **B2-MINIMAL** · Minimal-compliance use: did the least required, skimmed, "just for the quiz."
- **B3-PASSTIME** · Off-task self-occupation during materials (multitasking, phone, second screen) — expect rare; keep for comportment-read symmetry.

## Family C — Temporal texture
- **C1-DRAG** · Time-drag talk: "long," "dragged," "took forever," "couldn't sit through." (The *Hingehaltenheit* thread's survey-side trace.)
- **C2-FLOW** · Time-vanishing talk: "flew by," "lost track of time." (Engagement-side temporal signature.)
- **C3-LENGTH** · Objective-length complaints/requests (videos too long/short) *without* drag phenomenology — keep distinct from C1.

## Family D — Wendt chain-node codes (design-facing; feeds the node scorecard + §III.5)
- **D0-A0A1** · Perceptual conditions: visibility, darkness, legibility, audio quality, image grain. (Overlaps A1.dark — double-code: A-family for form-diagnosis, D-family for design.)
- **D1-A2** · Image/content quality at the pivot: 360 footage quality, camera position, the "two views," what the image *gives*.
- **D2-A3** · Interest/meaning: content relevance, curiosity, wanting-to-know-more (or its absence).
- **D3-A3A4** · Action affordances: interactivity, navigation-as-agency, things to DO; absence = "just watching," no in-world tasks, no needs-capture. Ex: "It was very interesting to see different countries operation room in VR" (D2) vs "wish we could interact with the equipment" (D3).
- **D4-LOOP** · Return-use / habit: came back, would use again, used repeatedly (or one-and-done).

## Family E — Involvement-channel vocabulary (Calleja-derived; vocabulary only, no walkthroughs)
- **E-KIN** kinesthetic (movement/controls as felt) · **E-SPA** spatial (place, layout, exploring, getting lost) · **E-SHA** shared (others, avatars, multi-user, "WE") · **E-NAR** narrative (cases, stories, the patient) · **E-AFF** affective (mood, excitement, wonder, discomfort-as-feeling) · **E-LUD** ludic (goals, tasks, challenge, quiz-drive).

## Family F — Incorporation-positive signatures
- **F1-PRESENCE** · Being-there talk: "actually in the OR," "felt present," immersion praise. Ex: "I found the immersive VR helpful."
- **F2-WORLD** · World-language: the environment as a *place* dwelt in (rooms, moving through, "walking into").
- **F3-CARRY** · Carry-over talk: thinking about it after, applying it elsewhere, changed how they see clinical settings.

## Family G — Suggestion taxonomy (Q9/Q10 mostly)
- **G1-PROVISION** · Provide hardware/access (headsets, lab time). Ex: "This class should provide students with VR headsets."
- **G2-OPTIMIZE** · Performance/stability/compatibility work.
- **G3-CONTENT** · More/better/varied content (procedures, interviews, specialties).
- **G4-INTERACT** · Add interactivity/tasks/assessment in-world.
- **G5-GUIDE** · Onboarding, tutorials, navigation help, clearer instructions.
- **G6-USECASE** · Proposed VR use-cases beyond the course (Q10's remit: remote teamwork, avatar classes, museums, etc.) — sub-note the domain.

## Family H — Emergent (open)
- **H-NEW-<slug>** · Anything resisting A–G. Pass-1 H-codes are candidates for promotion into the frozen Pass-2 codebook (logged in the revision memo).

## Housekeeping codes
- **X-NONUSE** · Pure non-access without evaluation ("never used it," laptop couldn't run it — if friction named, also A1.*). · **X-EMPTY** · Contentless ("n/a," "nothing," "good"). · **X-OFFTOPIC** · Course-logistics talk unrelated to the VLE (grading, scheduling) — counted, not analyzed. · **[translated]** · Applied to any segment coded on a translation.

## Analysis contracts (what the coded corpus must yield)
1. Code counts per term × item × Q7/Q8 stratum; co-occurrence matrices (esp. A×D, A×B, F×E).
2. **Friction-prediction scorecard**: per Wendt-predicted friction (dark, occl, prox, lag, nav) — CONFIRMED / DISCONFIRMED / UNATTESTED with counts (from A1 sub-tags).
3. **DIV-candidate register**: every A4 respondent with the paired evidence quoted.
4. Wendt node scorecard: affords/neutral/forecloses per chain node with evidence counts (from D-family).
5. Channel-mention profile: E-family rates by stratum (esp. E-SHA's fade by W26).
6. Exemplar bank: 3–6 verbatim exemplars per major code, anonymized, verbatim-verified.
