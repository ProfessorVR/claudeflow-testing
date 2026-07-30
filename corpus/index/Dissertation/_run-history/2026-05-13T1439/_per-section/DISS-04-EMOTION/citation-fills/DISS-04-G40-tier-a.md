# DISS-04-G40 — Tier A Citation-Fill (§1.4 Pathos five-register catalog with footnote — INCONS-005 remediation)

**Gap ID**: DISS-04-G40 (new — addresses INCONS-005 equivocation-RISK)
**Section**: DISS-04-EMOTION (§1.4 line 11, the canonical *pathos*-disambiguation site)
**Severity**: CRITICAL (per INCONS-005)
**Support tier**: T5-under-supported
**Tier**: A_corpus_index

## 1. Claim and anchor

Per `inconsistencies-and-fallacies.json` INCONS-005, the dissertation uses *pathos* in at least five registers without propagating the disambiguation upstream/downstream:
1. **Ontological** — *Met.* Δ.21 (alterability)
2. **Perceptual-affective** — *DA* III.7 (pleasure/pain valence)
3. **Rhetorical-emotional** — *Rhet.* II.1 (anger/fear/pity/shame)
4. **Bodily-physiological** — *DA* I.1 (boiling blood)
5. **Coined: *pathos simpliciter*** — now retired in favor of *epithymia* per `terminology-decisions-final.md`

The §1.4 line 11 catalog is already in place but needs cross-references for the upstream propagation.

## 2. Tier A loci

**Pipeline**: `corpus/index/Aristotle - Complete Works/`

| Register | Aristotelian locus | Bekker | Unit file |
|---|---|---|---|
| Ontological (alterability) | *Met.* Δ.21 | 1022b15–20 | `aristotle-meta-05.json` |
| Perceptual-affective (pursue/avoid) | *DA* III.7 | 431a8–12 | `aristotle-da-03.json` |
| Rhetorical-emotional (catalog) | *Rhet.* II.1–11 | 1378a20–1388a30 | `aristotle-rhet-02.json` |
| Bodily-physiological (boiling blood) | *DA* I.1 | 403a16–b19 | `aristotle-da-01.json` |
| Coined (*epithymia*) | *DA* II.3 | 414b1–6 | `aristotle-da-02.json` |

## 3. Recommended footnote insertion at §1.0 first *pathos* occurrence

Per INCONS-005 remediation (1):

```latex
\footnote{Aristotle deploys \textit{pathos} in multiple registers across 
the corpus, and this dissertation distinguishes them carefully. The 
ontological register (\textit{Metaphysics} \(\Delta\).21, 1022b15--20) 
names the structural-alterability character of any being capable of 
becoming-otherwise. The perceptual-affective register (\textit{De Anima} 
III.7, 431a8--12) names the pursue/avoid charge of perception. The 
rhetorical-emotional register (\textit{Rhetoric} II.1--11, 1378a20--1388a30) 
catalogues the determinate emotions --- anger, fear, shame, pity, pity, 
envy, indignation, etc. --- as articulationally-concrete \textit{pathē}. 
The bodily-physiological register (\textit{De Anima} I.1, 403a16--b19) 
names the somatic correlate (the dialectical-vs-physical-scientist 
double-definition: anger as ``boiling of the blood and warm stuff 
around the heart''). The terminology of \S 1.2--\S 1.4 reserves 
\textit{epithymia} (after \textit{De Anima} II.3, 414b1--6) for the 
basic hedonic valence dimension, with \textit{resonant epithymia} for 
its residual phase and \textit{resonant pathē} for memory- or expectation-
phantasma-attached articulationally-concrete emotions. The full 
disambiguation apparatus is at \S 1.4 \(\P\) 2.}
```

## 4. Cross-section propagation

Per INCONS-005 remediation:
1. **§1.0 first pathos-occurrence**: insert footnote pointing forward to §1.4 ¶2 — done above
2. **§1.2 first pathos-occurrence**: annotate register (Met. Δ.21 fourfold treatment = ontological-alterability)
3. **§1.3 first pathos-occurrence**: annotate register
4. **§1.4 line 120 pathe/pathos? marker**: resolve per DISS-04-G39

## 5. Terminology alignment

The footnote above incorporates the post-migration terminology from `terminology-decisions-final.md`:
- `pathos simpliciter` → *epithymia*
- `resonant orexis` → `resonant epithymia`
- New: `resonant pathē` for articulationally-concrete phantasma-attached emotion

## 6. Status

Tier A loci confirmed for all five registers. Citation-fill ready for adoption as a propagated footnote across §§1.0, 1.2, 1.3, 1.4.
