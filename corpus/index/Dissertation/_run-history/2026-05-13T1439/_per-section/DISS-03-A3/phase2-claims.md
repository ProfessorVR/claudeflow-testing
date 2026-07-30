# Phase 2 Claims — DISS-03-A3 (§1.3: A_3, Completed Cognitive Actuality and the Three Orientational Modes)

**Run**: 2026-05-13T1439
**Source**: `tmp/Dissertation/1.3 - A3 - Orentational Modes/1.3 A3 - Orientational Modes.md`
**Claim count**: 156 (target 140–180)
**JSON file**: `phase2-claims.json`

## Support tier distribution

| Tier | Count | %    |
|------|-------|------|
| T1-textually-confirmed     | 56 | 35.9% |
| T2-textually-supported     | 18 | 11.5% |
| T3-interpretive-but-flagged | 31 | 19.9% |
| T4-interpretive-but-unflagged | 9 | 5.8% |
| T5-under-supported         | 32 | 20.5% |
| T6-unsupported             | 3  | 1.9% |
| T7-overreach               | 2  | 1.3% |
| T8-secondary-needed        | 5  | 3.2% |
| **TOTAL**                  | **156** | **100%** |

Note: support_tier counts in JSON include some claims tagged at multiple tiers (e.g., a claim with both T3 + T8 reinforcement-need); the primary tier is used in the distribution above. Cross-tabulation in citation-gap-table.

## User-acknowledged markers (13 total)

| # | Marker | Line | Type | Attached claim | Resolution path |
|---|--------|------|------|----------------|-----------------|
| 1 | `\hl{CITE}` | 7 | hl | C006 | corpus/index Papachristou + Frede |
| 2 | `\hl{Heidegger logos/speech quote}` | 37 | hl | C038 | corpus/index BCAP |
| 3 | `\hl{conceptual}` | 37 | hl | C039 | editorial lexical review |
| 4 | `\hl{(I need quotations for ecstatic temporality and gewesenheit)}` | 43 | hl | C052, C053 | corpus/index BT §65 |
| 5 | `\hl{(Repeat quote in the final settled disposition section.)}` | 45 | hl | C055 | hexeis-development task |
| 6 | `\hl{(CITE)}` | 65 | hl | C082 | corpus/index BT (ecstases of Zeitlichkeit) |
| 7 | `\hl{(double check numbering)}` | 67 | hl | C084 | §3 Wave 1 numbering audit |
| 8 | `\hl{(Expand)}` | 77 | hl | C090 | additional BCAP development |
| 9 | `\inlinenote{...Frede on uncontrolled status of phantasiai...}` | 1 | inlinenote | (section-opening editorial; integrates into C001/dual-trace) | already-integrated reference; verify Frede citation accuracy |
| 10 | `\inlinenote{...bracket-disambiguation issue...}` | 33 | inlinenote | C031 | editorial disambiguation footnote |
| 11 | `\inlinenote{have to cite/quote papacrhistoou three grades}` | 61 | inlinenote | C076 | **CRITICAL — Papachristou index entry corpus-routed** |
| 12 | `\inlinenote{Heidegger reads doxa through the lens of his analysis...BCAP 124}` | 123 | inlinenote | C155 | user-decision integration |
| 13 | `\inlinenote` at line 125 | 125 | inlinenote | C156 | phase-1-metadata artifact (file ends line 124) |
| **NOTE on (CITE) bare** | `\hl{CITE}` at line 7 | already counted as #1 | | | |

The phase-1-metadata recorded 7 `\hl` markers (lines 7, 37, 43, 45, 65, 67, 77) + 5 `\inlinenote` markers (lines 1, 33, 61, 123, 125) + 1 bare `(CITE)` placeholder (line 65). Total = 13. Marker #1 (`\hl{CITE}` at line 7) IS the bare-CITE placeholder for line 65 that phase-1-metadata also tracks; cross-reference shows the bare-CITE-at-line-65 of phase-1-metadata IS the `\hl{(CITE)}` of line 65 here = marker #6. So we have **13 distinct markers** attached to claims (some markers attach to multiple claims; e.g., C052+C053 both attach to marker #4).

Additionally, the section has 2 in-text `\footnote{... CITE ...}` placeholders inside line 7 (footnote{DA CITE} + footnote{CITE}) that are content-placeholders for the sensory/deliberative phantasia distinction (C008) — these are tracked separately as remediation tasks since they're inside footnotes, not in the user's `\hl` or `\inlinenote` macros.

## Numbering inconsistency (5 OLD + 2 NEW = MIXED)

Per phase-1-metadata:
- **NEW M→A convention** at lines 5 (claim C001's "M_2 \to A_3" formulation), 119 (C150)
- **OLD M→M convention** at lines 59 (C075: "M_3 \to M_4"), 65 (C078: "M_2 \to M_3"), 67 (C084: "M_2 \to M_3" — **user self-acknowledged**), 114 (C140: "M_2 \to M_3"), 117 (C142: "M_3 \to M_4")
- User self-acknowledged at line 67 with `\hl{(double check numbering)}` attached to claim C084
- Mechanical migration: replace all 5 OLD-convention occurrences with NEW. The line-119 occurrence (C150) is in correct new convention and serves as template.

## Coined-term occurrence audit (per phase-1-metadata + claim-level verification)

| Coined term | Occurrences in §1.3 | §1.4 baseline | §1.3 cross-section drift assessment |
|---|---|---|---|
| `basic affective valence` | 0 | many | Term not used in §1.3 directly; the underlying concept appears as "hedonic tonality" / "pleasant-or-painful orientation". No drift. |
| `pathos simpliciter` | 8 | many | Used consistently as "basic hedonic tonality co-given with present sensible". ALIGNED with §1.4 canonical glossary. Drift assessment: NO DRIFT. |
| `resonant kinēsis` | 6 | many | Used consistently as "dual-trace residual motion" (resonant aisthēma + resonant orexis). ALIGNED. Drift assessment: NO DRIFT. |
| `resonant aisthēma` | 5 | many | Used consistently as the formal-eidetic residue. ALIGNED. Drift assessment: NO DRIFT. |
| **`resonant orexis`** | **15** (HIGHEST in dissertation) | 6 | **CRITICAL CROSS-SECTION DRIFT CHECK** — see below |
| `articulational concretion` | 0 explicit | many | Term not used by name in §1.3; the mechanism is described (lines 93, 100, 108) as "articulationally concretizes" / "concretizes the generic resonant orexis...into the determinate pathē". The verbal form is used; the noun "articulational concretion" is not. ALIGNED. |

### Resonant orexis cross-section drift findings (load-bearing user Q3)

§1.3 uses `resonant orexis` 15 times across claims C001, C015, C020-C025 (thirst cases), C054 (memory), C107 (M_2→A_3 mechanism), C109 (co-given), C113 (what doxa adds), C115 (articulationally concretizes), C122 (from A_1 onward), C124 (load-bearing bridge to §1.4), C129 (doxa-function summary), C153 (concluding formulation).

**FINDING**: All 15 occurrences use `resonant orexis` in the **basic-affective-valence sense** consistent with §1.4's canonical glossary entry. The user's open Q3 (whether `resonant orexis` covers articulationally-concrete *pathē* when memory elicits anger/fear/shame) is answered IMPLICITLY by §1.3's prose in favor of **Option 1** from the metadata: `resonant orexis` = basic only; concrete *pathē* require `resonant orexis` + *doxa*-ratification; `resonant orexis` ITSELF remains basic-affective-valence's residual half.

The strongest evidence is in C115 (line 93) and C124 (line 100):
- C115: "Its propositional ratification of an evaluatively loaded presentation **articulationally concretizes the generic resonant orexis** that phantasia has co-presented into the **determinate pathē** that mobilizes higher-order evaluative action."
- C124: "The propositional taking-as-true-or-false is what concretizes the **generic resonant aisthema and orexis** that phantasia has presented into the **determinate pathē or emotion**..."

In both, `resonant orexis` is qualified as **generic** and is contrasted with the **determinate** *pathē*. This is decisive evidence for Option 1.

C129 (line 108) restates: "**generic resonant orexis** becomes the **determinate mobilization** of higher-order emotion." Same structure. NO DRIFT.

The thirst-case treatments (C020-C025) use `resonant orexis` only in the basic sense (drink-as-good); they do NOT extend the term to cover articulationally-concrete *pathē*. The memory-case treatment (C054 + line 47's "settled memory") also stays basic.

**Implication for terminology-reckoning §3 Wave 1**: §1.3 is the HEAVIEST user of `resonant orexis` (15 vs. §1.4's 6) and consistently maintains the basic-affective-valence scope. The user's Q3 should be resolved with Option 1, and the §3 terminology-reckoning deliverable should cite C115, C124, C129 as the load-bearing evidence.

## Hexeis / settled-doxai under-development findings

Per metadata special instruction (c): identify where in the prose this is also incomplete.

**Locations in §1.3 where the hexeis/settled-doxai region is GESTURED but NOT DEVELOPED**:

1. **Line 45 (claim C055)**: User has flagged with `\hl{(Repeat quote in the final settled disposition section.)}` — explicitly signaling that the BCAP 129 footnote on "the frequently of repetition...historicality" is intended for repetition in a final settled-disposition section that the section does not yet contain. This is the clearest signal.

2. **Line 47 (claim C059)**: "a settled memory may function, like a settled doxa, as an additional unmoved originator that shapes how a current phantasma is taken up in subsequent engagements." This is the section's clearest substantive gesture toward the hexeis architecture — but it stops at "may function...like" without developing the structure. The "settled doxa" comparison hints at a settled-doxai-as-hexeis treatment that never arrives.

3. **Line 65 (claim C081)**: The "single rational cognitive apparatus" passage promises that the three modes operate together but does not explicitly take up the question of how the apparatus is *constituted* by settled hexeis (the diachronic dimension of the cognitive life).

4. **Line 117 (claim C147)**: "the soul acts because it desires, and it desires because the phantasma presents an object of desire under a doxastic commitment to its goodness or badness." This invokes the doxastic commitment but does not ask whether such commitments harden into hexeis (settled doxai) over time.

The hexeis-treatment is properly a §1.4 / §1.5 task; §1.3's role is to open the door (esp. via line 45 + 47) which it does. Recommendation: §3 Wave 1 hexeis-development task uses C055 + C059 as the §1.3 anchor points.

## Claim-level entries (full)

(For human-readable, claim-by-claim review, see `phase2-claims.json` for the structured data. Each JSON entry contains: claim_id, location, claim_text, claim_type, logical_role, supports/supported_by, primary/secondary citations, implicit citations needed, support_tier, coined-term presence, interpretive-flag presence, cross-section drift checks where applicable, remediation actions, user-acknowledged markers where applicable.)

The most architecturally consequential claims (in order of structural importance):

- **C002**: A_3 designation as the phantasma (architectural thesis).
- **C009 + C013–C015**: Three characteristics of phantasma (determinate / available / representational) and Heideggerian recast.
- **C026–C029**: Three orientational modes + doxa-as-orthogonal-fourth.
- **C030**: Internal four-vs-three inconsistency (claim C026 says three modes + orthogonal-not-fourth; line 31 says four modes — see remediation).
- **C076**: Papachristou three-grades citation gap — **HIGHEST CRITICAL** (Papachristou index entry corpus-routed).
- **C091 + C105 + C115**: pre-propositional / propositional bifurcation — load-bearing architecture for §1.4.
- **C125–C128**: doxa-as-orthogonal formal statement.
- **C129–C131**: doxa-as-hinge-of-chain.
- **C140–C144**: A_3 as conditional unmoved originator (speculative terminates; practical continues).
- **C150**: A_3 as pivotal location in chain.

## Editorial findings (minor)

Numerous editorial typos surfaced during claim extraction:

| Line | Typo | Recommended fix | Claim |
|---|---|---|---|
| 19 | "what I will the taking-as-something" | "what I will **call** the taking-as-something" | C018 |
| 29 | "textit{memory}" | "\textit{memory}" (missing backslash) | C026 |
| 47 | "as point backward" | "as **pointing** backward" | C057 |
| 57 | "practical though moves" | "practical **thought** moves" | C072 |
| 65 | "WHat I have been calling" | "**What** I have been calling" | C081 |
| 71 | "bur rather" | "**but** rather" | C086 |
| 91 | "but lack of logos" | "but lack logos" | C110 |
| 100 | "resonant aisthema" (missing macron) | "resonant aisth**ē**ma" | C124 |
| 121 | "with is resonant orexis" | "with **its** resonant orexis" | C153 |
| 75 | "(](\textit{Dynatón..." (mismatched bracket) | clean up bracket structure | C089 |
| 7 | "footnote{DA CITE}" + "footnote{CITE}" (inside line 7) | resolve placeholder citations | C008 |
| 33 inlinenote | "phantastic" — verify intended | editorial review | (inlinenote-meta only) |
| 123 inlinenote | "rhetooric" + "prviacy" + "inenr" — typos | editorial review | C155 |

These are mechanical fixes that do not affect claim extraction but should be batched in revision.
