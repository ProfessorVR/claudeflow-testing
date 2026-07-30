# DISS-03-G01 — Tier A Citation-Fill (§1.3 Papachristou three-grades + Aquinas Sentencia citation)

**Gap ID**: DISS-03-G01
**Section**: DISS-03-A3 (§1.3 A_3 Orientational Modes)
**Severity**: **CRITICAL (Plan §8.2 special instruction b)**
**Support tier**: T5-under-supported
**Tier**: A_corpus_index
**Load-bearing**: YES — user-acknowledged `\inlinenote{have to cite/quote papacrhistoou three grades}`

## 1. Claim and anchor

§1.3 line 7 contains the user's own *inlinenote* acknowledging the missing Papachristou citation. The claim is that Aristotle distinguishes **three kinds of *phantasia*** (indeterminate/sensitive/calculative), not two. The textus-receptus passage is Thomas Aquinas's *Sentencia libri De Anima*, Liber II — specifically the *motus phantasiae* / *phantasia indeterminata* passage that Papachristou quotes at footnote 57 of her article.

## 2. Tier A loci confirmed in corpus/index

**Pipeline**: `corpus/index/Aristotelian Phantasia Secondary (1985-2017)/`
**Unit**: **PHX-08** (`Papachristou - Three Kinds of Phantasia (2013)/phx-08-papachristou.md`)
- Article: Christina S. Papachristou, "On the Notion of *Phantasia* in Aristotle's *De Anima*," *Journal of Ancient Philosophy* 7.2 (2013): 19–48.
- Footnote 57 (pdf p. 16) contains the verbatim Aquinas Latin + Kocourek English translation
- Methodological backbone: the Latin commentary tradition (Aquinas) rather than the Greek (which is binary calculative/sensitive only)

### Three-grades scheme (Papachristou's tripartite synthesis):

| Grade | Greek term | Animal class | Aristotelian locus |
|---|---|---|---|
| (a) | *aoristos phantasia* (indeterminate/indefinite) | Imperfect animals (zoophytes, molluscs; touch only) | DA III.11, 433b31–434a5 |
| (b) | *aisthētikē phantasia* (sensitive) | Non-rational animals with multiple senses | DA III.10, 433b29 |
| (c) | *logistikē* / *bouleutikē phantasia* (calculative/deliberative) | Rational animals | DA III.10, 433b29; DA III.11, 434a5–10 |

## 3. Verbatim from corpus/index — Aquinas Latin (Papachristou fn. 57)

From `phx-08-papachristou.md`:

> Aquinas, *Sentencia libri De anima*, Liber II:
>
> "*Videtur tamen hoc esse contrarium ei quod supra dixerat: quia si pars decisa habet sensum et appetitum, habet etiam phantasiam; si tamen phantasia est idem cum imaginatione, ut videtur. Dicendum est igitur, quod **animalia imperfecta**, ut in tertio dicetur, habent quidem phantasiam, sed **indeterminatam**, quia scilicet **motus phantasiae** non remanet in eis post apprehensionem sensus: in **animalibus autem perfectis** remanet **motus phantasiae**, etiam abeuntibus sensibilibus.*"

### Kocourek English translation (Papachristou fn. 67):

> "Nevertheless, this seems to be contrary to what he said above: because if a part cut off has sense and appetite, it also has phantasy; provided that phantasy is the same as imagination, as it seems. It must be said, therefore, that **imperfect animals**, as is said in the third book, do really have phantasy, but it is one which is **indeterminate** because the **motion of phantasy** does not remain in them after the apprehension of the sense; however in **perfect animals** the motion of phantasy remains even after the sensible thing is gone."

## 4. Recommended footnote/inlinenote replacement

The §1.3 line 7 `\inlinenote{have to cite/quote papacrhistoou three grades}` should be replaced by:

```latex
\footnote{Papachristou (2013) argues that Aristotle in \textit{De Anima} 
III distinguishes three, not two, kinds of \textit{phantasia}: 
indeterminate (\textgreek{ἀόριστος φαντασία}) in imperfect animals 
(zoophytes, molluscs) that possess only the contact sense (\textit{DA} 
III.11, 433b31--434a5); sensitive (\textgreek{αἰσθητική φαντασία}) in 
non-rational animals with multiple senses; and calculative or deliberative 
(\textgreek{λογιστικὴ φαντασία} or \textgreek{φαντασία βουλευτική}) in 
rational beings (\textit{DA} III.10, 433b29; III.11, 434a5--10). The 
textus receptus is Thomas Aquinas, \textit{Sentencia libri De Anima}, 
Liber II: ``Dicendum est igitur, quod \textit{animalia imperfecta}, ut 
in tertio dicetur, habent quidem phantasiam, sed \textit{indeterminatam}, 
quia scilicet \textit{motus phantasiae} non remanet in eis post 
apprehensionem sensus: in \textit{animalibus autem perfectis} remanet 
\textit{motus phantasiae}, etiam abeuntibus sensibilibus'' (Aquinas, 
\textit{Sent. De an.} II, in Papachristou 2013, p.~16, fn.~57; trans. 
Kocourek). Papachristou's tripartite scheme is the textual ground for 
the chapter's distinction of orientational modes among sensory, 
deliberative, and (where the imperfect-animal limit-case is relevant) 
indeterminate \textit{phantasia}.}
```

## 5. Relevance to §1.3's three-orientational-modes structure

Per `inconsistencies-and-fallacies.json` INCONS-012, §1.3 lines 29 vs. 31 oscillate between **three orientational modes** (with *doxa* orthogonal) and **four orientational modes** (with *doxa* as fourth). Papachristou's three-kinds-of-*phantasia* scheme is structurally analogous but operates at a different axis:
- Papachristou's three grades = animal-class-stratified (imperfect / non-rational sensitive / rational calculative)
- §1.3's three orientational modes = within-rational-animal modes (intellection, memory, deliberative phantasia)

**The Papachristou citation supports the existence of three-mode taxonomies in the Aristotelian phantasia tradition but does NOT directly license §1.3's specific three-mode scheme.** The dissertation may want to acknowledge this distinction by adding a brief clarifying note that the chapter's three-mode scheme is internal to the rational-animal case, where Papachristou's three-grade scheme is animal-class-comparative.

## 6. Cross-section sweep

The Papachristou three-kinds-of-*phantasia* thesis is forward-promised in §1.0 (per INCONS finding §1.0_promises_vs_§§1.1-1.5_delivery: "Papachristou three-grades framework (§1.0 forward-promise; §1.3 inlinenote-flagged)"). The §1.0 forward-promise should be cross-referenced with the §1.3 footnote insertion, and the §1.0 prose may need its own cross-reference to §1.3's Papachristou treatment.

## 7. Status

Citation-fill ready for user adoption. Full Aquinas Latin + Kocourek English verbatim available in `phx-08-papachristou.md` fn. 57. The dissertation's `\inlinenote{}` flag can be resolved into the substantive footnote template above.
