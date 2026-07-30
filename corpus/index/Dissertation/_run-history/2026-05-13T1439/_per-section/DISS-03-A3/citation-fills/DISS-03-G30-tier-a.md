# DISS-03-G30 — Tier A Citation-Fill (§1.3 INCONS-012 three-vs-four orientational modes remediation)

**Gap ID**: DISS-03-G30 (new — addresses INCONS-012)
**Section**: DISS-03-A3 (§1.3)
**Severity**: MAJOR (per INCONS-012)
**Support tier**: T4-interpretive-but-unflagged
**Tier**: A_corpus_index

## 1. Claim and anchor

Per `inconsistencies-and-fallacies.json` INCONS-012, §1.3 lines 29 vs. 31 oscillate between:
- **Three orientational modes** (intellection, memory, deliberative phantasia) + *doxa* as orthogonal layer (line 29 — correct)
- **Four orientational modes** (with *doxa* as fourth, but also orthogonal) (line 31 — outlier; the explanatory follow-up flips back to three+orthogonal)

The line 31 prose "Four orientational modes must be distinguished" must be rewritten to "Three orientational modes must be distinguished."

## 2. Tier A loci for the canonical three-mode structure

**Pipeline**: `corpus/index/Aristotle - Complete Works/`

The three orientational modes track three distinct Aristotelian capacities:
1. **Intellection (*nous*)** — DA III.4–8 (the nous-analysis)
2. **Memory** — *On Memory* 1, 449b9–450a25 (memory as preserved phantasma)
3. **Deliberative phantasia (*phantasia bouleutikē*)** — DA III.10–11, 434a5–11

### Doxa as orthogonal layer

Doxa's structural orthogonality is established at DA III.3, 428a19–24:
> "Imagination differs from any other form of cognition; it is not perception, science, nor opinion. For everyone who has an opinion believes (*pisteuei*) what he opines; but no one who imagines an object believes anything about that object."

The DA III.3 passage establishes that *doxa* is structurally distinct from *phantasia* (and therefore distinct from the orientational modes that operate via *phantasma*), entering as the apophantic-uptake layer. This is the canonical Aristotelian warrant for treating *doxa* as orthogonal rather than as a fourth orientational mode.

## 3. Patch (edit-ready)

```latex
OLD (line 31):
Four orientational modes must be distinguished: intellection (\textit{nous}), 
memory, and that mode which Aristotle designates deliberative phantasia... 
Alongside the three orientational modes, a fourth and structurally distinct 
dimension enters the engagement: \textit{doxa}... operate not as a fourth 
parallel mode but as an orthogonal committal layer

NEW (line 31):
Three orientational modes must be distinguished: intellection 
(\textit{nous}), memory, and that mode which Aristotle designates 
deliberative phantasia. Alongside these three orientational modes, a 
structurally distinct committal dimension enters the engagement: 
\textit{doxa} operates as an orthogonal layer over the three modes rather 
than as a fourth parallel mode (\textit{De Anima} III.3, 428a19--24 on 
\textit{doxa} as entailing \textit{pistis} where \textit{phantasia} 
does not).
```

## 4. Cross-section propagation

After resolving INCONS-012 line 31, sweep §1.3 downstream prose (especially line 112) to confirm consistent three-modes+orthogonal-doxa usage. The line 112 prose already uses three+orthogonal correctly; only line 31 is the outlier.

## 5. Status

Tier A locus confirmed. Citation-fill ready. The INCONS-012 fix is trivial-effort (single-paragraph rewrite) but is load-bearing for §1.3's architectural coherence.
