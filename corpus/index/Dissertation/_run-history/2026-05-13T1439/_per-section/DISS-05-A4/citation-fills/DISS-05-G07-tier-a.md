# DISS-05-G07 — Tier A Citation-Fill (§1.5 Three-types tracks technē/praxis-hexis bivalence)

**Gap ID**: DISS-05-G07
**Section**: DISS-05-A4 (§1.5 A_4 Completed Action)
**Severity**: **CRITICAL-DISSERTATION-NOVEL**
**Support tier**: T4-interpretive-but-unflagged
**Tier**: A_corpus_index
**Load-bearing**: YES — §1.5 master synthesis (per `citation-gap-master.json` rank 3)

## 1. Claim and anchor

The §1.5 narrative claims that Aristotle's three types of action (MA 7, 701a31–b1) **track the technē-hexis vs praxis-hexis bivalence** — Type 1 = simple appetition (no doxa); Type 2 = habitual-procedural (technē-hexis with doxa); Type 3 = evaluatively complex (praxis-hexis with doxa + evaluative content). This is a **dissertation-novel interpretive synthesis**: Aristotle does not catalog by technē/praxis bivalence; Heidegger does not catalog three types of action. The alignment is the user's.

Per Special Instruction (d) in Plan §8.2, this gap requires:
1. **Substantial interpretive flag** ("This is a dissertation-novel reading…")
2. **Aristotle anchor** for the technē/praxis distinction (NE VI.4–5)
3. **Heidegger anchor** for the hexis-as-existential-ontological reading (GA 18 §17–§18)
4. Secondary literature support (Sherman 1989 OR Aubenque 1963 — Tier C fallback)

## 2. Tier A loci confirmed in corpus/index

### 2.1 Aristotle anchor — NE VI.4–5

**Pipeline**: `corpus/index/Aristotle - Complete Works/`
**Unit**: `aristotle-ne-06.json` (Nicomachean Ethics Book VI)
**Bekker loci**: 
- NE VI.4 1140a1–23 (technē definition: "a state concerned with making, involving a true course of reasoning")
- NE VI.5 1140a24–b30 (phronēsis distinct from technē; phronēsis as practical-deliberative; concerned with action, not making)

### 2.2 Heidegger anchor — GA 18 §17–§18

**Pipeline**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/`
**Unit**: **U-FP3c** (`bcap-structured/u-fp3c.json` + `bcap-analysis/phase2-u-fp3c.md`)
- §17a: Hexis as "the determination of the genuineness of being-there in a moment of being-composed as to something" (p. 119)
- §17b-alpha: NE B.3, 1105a–b on the three aspects of "how" of *prattein* — these determinations "are not ascribed to a *technē*" (Heidegger, BCAP, p. 124)
- §18a: "Hexis is nothing other than a how of *pathos*, being-out-of-composure, in relation to being-composed-as-to" (p. 125)

## 3. Verbatim from corpus/index (key support)

### From BCAP §17a (p. 119), the existence/praxis hexis-identification:

> Praxis is characterized through *aretē*, and *aretē* through the proairetic *hexis*. **Praxis as the how of being-in-the-world appears as the being-context that we can also designate as *existence*** (p. 119).

### From BCAP §17b-alpha (p. 124), Heidegger's explicit technē-praxis differentiation:

> These determinations [of *prattein*: knowing, deliberating, choosing-because-of-itself, settled cultivation] are **"not ascribed to a *technē*"** (NE B 3, 1105b 1). Heidegger reads Aristotle's polemic against the sophists and moralizers as "a sharp contrast between *legein* about ethics-related problems and real philosophizing — an advance against the misuse of Socratic method" (p. 124).

### From BCAP §17b-beta (p. 125):

> Hexis is itself a basic determination of *aretē*: "according to its being-origin, *aretē* is a *hexis*, a being-composed as to..., in terms of the moment" (NE B 5, 1106a 13).

## 4. Recommended interpretive-flag insertion

The §1.5 prose at the three-types-of-action introduction should be prefixed with a **substantial interpretive flag** along these lines:

```latex
The chapter here advances a dissertation-novel interpretive synthesis: 
Aristotle's three-fold MA 7 catalog of action-types (the drinking case, 
the habituated-procedural case, and the evaluatively-complex case) tracks 
the technē/praxis-hexis bivalence that Aristotle himself develops at 
\textit{NE} VI.4--5 (1140a1--b30) and that Heidegger reads as 
existential-ontological at \textit{Basic Concepts of Aristotelian 
Philosophy} \S 17 (pp.~119--127). The alignment is the chapter's: Aristotle 
does not catalog by technē/praxis bivalence, and Heidegger does not 
catalog three types of action. The interpretive bridge claims that the 
three MA 7 types are differentiated by which kind of hexis-bivalence is 
operative --- simple-appetitive (no hexis-modulation), technē-hexis 
(habitual-procedural with skill-acquired modulation), or praxis-hexis 
(evaluatively complex with character-formed modulation).
```

## 5. Aristotle primary-text citations to ADD

```latex
... three types of action [INSERT: \textit{Movement of Animals} 7, 
701a31--b1] track the technē/praxis-hexis bivalence Aristotle develops 
at [INSERT: \textit{Nicomachean Ethics} VI.4--5, 1140a1--b30] and 
Heidegger develops at [INSERT: BCAP, \S 17, pp.~119--127]...
```

## 6. Secondary literature (Tier C fallback)

If the user wants secondary anchoring beyond GA 18 / BCAP:
- **Sherman 1989** (*The Fabric of Character: Aristotle's Theory of Virtue*, Oxford) — develops hexis-as-praxis-formed-character in NE-aligned terms
- **Aubenque 1963** (*La prudence chez Aristote*, PUF) — classic exposition of phronēsis-praxis-hexis as distinct from technē
- See `DISS-05-G-C031-tier-c.md` (existing Tier C cache) for Perplexity Q-002 fallback specifications

## 7. Terminology alignment (per `terminology-decisions-final.md`)

§1.5's three-types analysis intersects the terminology migration as follows:
- **Type 1** (simple appetition, no doxa) = the case where the chain is driven by `basic affective valence` (= *epithymia* / `resonant epithymia`)
- **Type 2** (technē-hexis with doxa) = the case where *doxa* engages but the *pathē* are technical-skilled rather than character-evaluative
- **Type 3** (praxis-hexis with doxa + evaluative content) = the case where `resonant pathē` are the articulationally-concrete sediment that the praxis-hexis modulates

The cross-reference at §1.4 line 174 (hexis-pathē co-originality, see `DISS-04-G33-placeholder.md`) is the upstream architectural anchor for §1.5's Type 3 case.

## 8. Status

Citation-fill ready for user adoption. Primary anchors in `corpus/index/Aristotle - Complete Works/aristotle-ne-06.json` and `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3c.md`. The substantial interpretive flag is the load-bearing addition; primary loci provide the warrant.
