# Q4 — *Hexis* ≠ Settled *Doxai* Prose Audit (review list)

**Generated:** 2026-05-28. **Scope:** all 6 v3 files (`Working tex versions/*-v3.tex`). **Status:** ANALYSIS ONLY — nothing edited; user to manually review and verify.

## Q4 rule (from `DISSERTATION-CLEANUP-TODO.md` L554–584)
*Hexis* is the broader genus (per *Cat.* 8b27ff: virtues, crafts, knowledge, bodily states are all *hexeis*). Settled *doxai* are ONE SPECIES of *hexis* (the doxastic-cognitive species, per *MA* 701a7–25, where the practical syllogism's universal premise is a settled *doxa*). *Technē-hexis* and *praxis-hexis* are character/craft dispositions, NOT primarily doxastic.

**Canonical correct formulation in §1.5 L186** (use as model for any rewrites):
> The universal premises of the practical syllogism … are *held doxai* that an agent's *hexeis* may incline him to hold; they are not themselves *hexeis*, for a *doxa* is a taking-as-true, not a disposition. *Hexis* proper is the broader dispositional ground within which bodily, affective, and practical-rational states belong.

## Method

For each plural-or-singular *hexis*/*hexeis* occurrence across all 6 v3 files, scanned ±200-char window for *doxa*/*doxai* proximity. Each proximity match is classified below as **NEEDS FIX** (active conflation) or **KEEP** (proper distinction maintained or no conflation).

## Summary

| # | File | Line | Status | Notes |
|--:|---|---:|---|---|
| 1 | §1.0 | L328 | **NEEDS FIX** | TikZ display label inside K23 kineticbox: "settled *doxai* as *hexeis*" — explicit equation |
| 2 | §1.0 | L346 | **NEEDS FIX** | LaTeX comment header: "SETTLED DOXAI (HEXEIS) — Step 7 bisected band" — stale band name |
| 3 | §1.0 | L381 | **NEEDS FIX** | TikZ fit-band label annotation: "above:Settled Doxai (*Hexeis*)" — stale label |
| 4 | §1.3 | L93 | KEEP | "dispositional ground (cultivated *hexeis*…) within which… *doxai* can come into view" — distinct roles |
| 5 | §1.4 | L201 (×2) | KEEP | "*doxa* is *technē*-grounded, the chain runs through *hexis*-mediated practical inference" — distinguishes doxa-content from hexis-mediation |
| 6 | §1.5 | L179 | KEEP | "settled *doxai* and cultivated *hexeis*" — parallel listing as distinct unmoved originators |
| 7 | §1.5 | L186 | KEEP | **Canonical correct formulation** — explicit "they are not themselves *hexeis*" statement |
| 8 | §1.5 | L202 | KEEP | "*hexis* through which an agent meets a situation in fresh evaluative resolution" — hexis-only, no conflation |
| 9 | §1.5 | L210 | KEEP | "the ethical *hexis*, *doxa* ratifying the *phantasma*" — distinguishes hexis (disposition) from doxa (act of ratification) |

**Total**: 3 NEEDS FIX (all §1.0 diagram code); 6 KEEP (prose treatments are correct).

**Observation**: The active conflations are confined to §1.0's TikZ diagram (display labels + comment). The dissertation PROSE in §§1.3/1.4/1.5 already maintains the *hexis* ≠ settled-*doxai* distinction correctly, with the canonical statement at §1.5 L186 (newly recovered as the model formulation).

---

# Item 1 — §1.0 L328 (TikZ K23 kineticbox display label)

**Verbatim passage** (LaTeX source, L325–332):
```latex
\node[kineticbox] (K23) at (-\kinoff, -2*\nodesep - \motionoff) {
  \textbf{Unmoved}: $A_2$ (\textit{phantasma}) +\\
  \quad settled \textit{doxai} as \textit{hexeis}\\
  \textbf{Moved mover}: rational cognitive\\
  \quad apparatus (unified)\\
  \textbf{Moved}: rational animal
};
```

**Issue**: "settled *doxai* **as** *hexeis*" reads as identity equation — *doxai* qua *hexeis*. Per Q4 rule, settled *doxai* are ONE SPECIES of *hexis*, not the genus itself.

**Proposed fix (Option A — tight, preserves diagram economy)**:
```latex
  \quad settled \textit{doxai} (doxastic species of \textit{hexis})\\
```

**Proposed fix (Option B — parallel-listing)**:
```latex
  \quad settled \textit{doxai} + cultivated \textit{hexeis}\\
```

**Proposed fix (Option C — broader genus first)**:
```latex
  \quad \textit{hexeis} (incl.\ settled \textit{doxai})\\
```

**Recommended**: **Option A** (preserves the genus-species relation explicitly; tightest fit for the kineticbox layout).

---

# Item 2 — §1.0 L346 (LaTeX section-divider comment)

**Verbatim passage** (LaTeX source, L345–352):
```latex
% ============================================================
%  SETTLED DOXAI (HEXEIS) — Step 7 bisected band
%  Renders the technē/praxis bivalence as additional unmoved
%  originators of M_2→A_3 (alongside A_2). PRAXIS-hexis
%  additionally reaches upstream to A_1: Type 3 two-level
%  modulation (input-to-doxa AND doxa-gate).
%  Anchored: Met. Δ 20, 1022b 4; GA 18 §17; NE II.1.
% ============================================================
```

**Issue**: Comment header band name "SETTLED DOXAI (HEXEIS)" is stale; per the Q4 description ("Diagram v3+ fixed: outer label 'Settled Doxai (Hexeis)' → 'Hexeis (Standing Dispositions)' per Fix A"), this should match the diagram label.

**Proposed fix**:
```latex
% ============================================================
%  HEXEIS (Standing Dispositions) — Step 7 bisected band
%  Renders the technē/praxis bivalence as additional unmoved
%  originators of M_2→A_3 (alongside A_2). PRAXIS-hexis
%  additionally reaches upstream to A_1: Type 3 two-level
%  modulation (input-to-doxa AND doxa-gate).
%  Anchored: Met. Δ 20, 1022b 4; GA 18 §17; NE II.1.
% ============================================================
```

**Note**: The comment body's mention of "Type 3 two-level modulation (input-to-doxa AND doxa-gate)" references the legacy *doxa-gate* term (retired in §1.5 D10 → "doxastic ratification"). Recommend updating to "(input-to-doxa AND doxastic ratification)" for terminological consistency with §1.5 v3.

---

# Item 3 — §1.0 L381 (TikZ fit-band label annotation)

**Verbatim passage** (LaTeX source, L374–384):
```latex
\node[rectangle, rounded corners=4pt,
      draw=pathoscolor!75, fill=pathoscolor!4,
      line width=0.6pt, dash pattern=on 3pt off 2pt,
      fit=(techne-hexis)(praxis-hexis),
      inner sep=4pt,
      label={[font=\sffamily\tiny\bfseries,
              text=pathoscolor!90!black, label distance=1pt]
             above:Settled Doxai (\textit{Hexeis})},
      label={[font=\sffamily\tiny\itshape,
              text=pathoscolor!65!black, label distance=1pt]
             below:Met.\ $\Delta$ 20, 1022b\,4 \,$\cdot$\, GA 18 \S 17}]
```

**Issue**: Top label "Settled Doxai (*Hexeis*)" is the OLD labeling. Per Q4 description, the diagram (v3+) was supposed to be fixed to "Hexeis (Standing Dispositions)" per Fix A — but §1.0-v3.tex still has the old labeling.

**Proposed fix**:
```latex
             above:\textit{Hexeis} (Standing Dispositions)},
```

**Recommendation**: Apply consistently across Items 1–3 to remove all "Settled Doxai (Hexeis)" framing from the §1.0 diagram code.

---

# Item 4 — §1.3 L93 (KEEP — proper distinction)

**Verbatim passage** (excerpt from L93):
> rational deliberation is constitutively informed by the dispositional ground (cultivated *hexeis* and active civic passions) within which alone the relevant *doxai* can come into view

**Status**: KEEP — *hexeis* named as the dispositional ground; *doxai* named as what "comes into view" within that ground. The two are clearly distinguished as different ontological categories (disposition vs. propositional commitment). No conflation.

**Proposed fix**: NONE NEEDED.

---

# Item 5 — §1.4 L201 (KEEP — proper distinction, ×2 occurrences)

**Verbatim passage** (excerpt from L201):
> where the operative *doxa* is *technē*-grounded, the chain runs through *hexis*-mediated practical inference without engaging the higher-order *pathē*, since the universal premise is craft-procedural; where the operative *doxa* is *praxis*-grounded, the *praxis-hexis* modulates the chain on two registers — biasing the basic affective valence that enters perception, and conditioning which determinate *pathos* the *doxa*-mediated articulational concretion produces.

**Status**: KEEP — *doxa* is the propositional content (the operative universal premise); *hexis* is the dispositional structure that grounds/mediates the doxa. Distinct categories properly distinguished.

**Proposed fix**: NONE NEEDED.

---

# Item 6 — §1.5 L179 (KEEP — parallel listing)

**Verbatim passage** (excerpt from L179):
> Whether the content [doxa ratifies] is evaluatively complex is itself conditioned by the dispositional ground upon which *doxa* forms — by the settled *doxai* and cultivated *hexeis* that function as additional unmoved originators feeding the motion toward $A_3$ (Aristotle, *Categories*, 8b25–9a13).

**Status**: KEEP — "settled *doxai* AND cultivated *hexeis*" listed as parallel-but-distinct unmoved originators. The conjunction "and" explicitly marks them as two different things, not equated.

**Proposed fix**: NONE NEEDED.

---

# Item 7 — §1.5 L186 (KEEP — canonical correct formulation; MODEL for any rewrites)

**Verbatim passage** (excerpt from L186):
> *Hexis* names a stable, settled disposition encompassing virtues, crafts, knowledge, and bodily states alike … (*Categories* 8, 8b25–9a13). … The universal premises of the practical syllogism — as when one holds that "every man ought to walk" and recognizes oneself as a man (*De Motu Animalium* 7, 701a7–16) — are ***held doxai* that an agent's *hexeis* may incline him to hold; they are not themselves *hexeis*, for a *doxa* is a taking-as-true, not a disposition. *Hexis* proper is the broader dispositional ground within which bodily, affective, and practical-rational states belong.**

**Status**: KEEP — this is the **canonical correct formulation** of the Q4 rule, already in place in §1.5 v3. The passage:
1. Names *hexis* as the broader genus (citing *Cat.* 8b25–9a13)
2. Explicitly states that *held doxai* are NOT themselves *hexeis*
3. Distinguishes the kinds: *doxa* is a "taking-as-true," *hexis* is a "disposition"
4. Names *hexis* as the "broader dispositional ground"

This passage should be referenced as the model for any future rewrite that needs to clarify the relation elsewhere.

**Proposed fix**: NONE NEEDED. This is the standard.

---

# Item 8 — §1.5 L202 (KEEP — no conflation)

**Verbatim passage** (excerpt from L202):
> The ethical *hexis*, then, is the cultivation of a readiness that does not destroy the moment (*Augenblick*) but sustains it; it is the *hexis* through which an agent meets a situation in fresh evaluative resolution — neither bypassing *doxa*, as appetite may, nor running it on routine, but holding oneself open for fresh *kairos*-resolution.

**Status**: KEEP — *hexis* (the ethical disposition) and *doxa* (what may be bypassed or run on routine) are distinct categories. Hexis is the disposition; doxa is what the disposition relates to (bypasses, runs on routine, etc.). Distinction properly maintained.

**Proposed fix**: NONE NEEDED.

---

# Item 9 — §1.5 L210 (KEEP — distinct roles)

**Verbatim passage** (excerpt from L210):
> Where the chain runs on settled procedural *doxa* — a craft-directive drawn upon as routine — it routes through *technē*, its passage through $A_3$ effectively transparent. And where the agent meets the situation in fresh evaluative resolution, it routes through the ethical *hexis*, *doxa* ratifying the *phantasma* in a genuine encounter with the particular *kairos*. Subsequently, every completed action at $A_4$ sediments back into the agent's *hexeis* …

**Status**: KEEP — Three distinct mentions, each in a distinct role:
1. "settled procedural *doxa*" = the content the chain runs on (procedural directive)
2. "the ethical *hexis*" = the disposition through which the agent routes
3. "*doxa* ratifying the *phantasma*" = the act of ratification (the moment, not the disposition)
4. "sediments back into the agent's *hexeis*" = what completed action contributes to (the dispositional sediment)

Each occurrence has a clear, distinct role. No conflation.

**Proposed fix**: NONE NEEDED.

---

# Recommended action sequence

If user approves the 3 NEEDS-FIX items above (all in §1.0 diagram code):

1. Apply Item 1 (Option A recommended) at §1.0 L328
2. Apply Item 2 at §1.0 L346 (incl. "doxa-gate" → "doxastic ratification" cleanup)
3. Apply Item 3 at §1.0 L381
4. Compile §1.0-v3.tex to verify diagram still renders cleanly
5. Spot-check the rendered PDF to confirm the bisected-band label changes match intent

**Estimated effort**: 10–15 minutes once approved.

**Bonus**: The §1.5 L186 canonical formulation is excellent and should be cross-referenced if any future hexis/doxa discussion is added to §§1.0/1.3/1.4 (e.g., when the diagram cross-references the prose).
