# DISS-04-G33 — Placeholder Resolution (BCAP p. ?? — pathē and hexeis as fundamental concepts of being)

**Gap ID**: DISS-04-G33
**Section**: DISS-04-EMOTION (§1.4 Emotion is Motion)
**Line**: 174 (.md of `1.4 - Emotion is Motion.md`)
**Anchor in prose**: BCAP — *pathē* and *hexeis* as "fundamental concepts" articulating the being-structure of speaking-with-one-another
**Tier**: A_corpus_index + ****** placeholder
**Severity**: MEDIUM
**Support tier**: T5-under-supported
**Special note**: This placeholder has TWO `\textbf{******}` markers — one for the verbatim, one for the page number. The user has not yet specified the BCAP page.

## 1. Named locus (partially confirmed; page TBD)

Heidegger, *Basic Concepts of Aristotelian Philosophy*. **Page is currently TBD per the dissertation's own placeholder.** The dissertation prose:

> The *pathē*, moreover, are co-original with *hexeis*. Both are fundamental concepts of being, articulating the being-structure of beings whose way of being is "******" (BCAP, p. ******).

The author's footnote says: "Verbatim text and page reference to be supplied manually for the BCAP / GA 18 passage on *pathē* and *hexeis* as fundamental concepts of speaking-with-one-another."

## 2. Corpus/index pipeline route — TWO candidate units

The phrase "speaking-with-one-another" + "*pathē* and *hexeis* as fundamental concepts" maps to two candidate loci in the BCAP corpus/index:

### Candidate A — U-FP3c §17–§18 (Hexis and Pathos, pp. 116–139)

**Pipeline**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/`
**Unit**: **U-FP3c** (`bcap-structured/u-fp3c.json` + `bcap-analysis/phase2-u-fp3c.md`)
- **Pages**: 116–139 (PDF 131–154); two-pass MANDATORY
- This is the section where Heidegger develops *hexis* and *pathos* as basic ontological determinations of human being-in-the-world.

From `phase2-u-fp3c.md` §17a:

> **Conclusion of §17a**: "Hexis is *the determination of the genuineness of being-there in a moment of being-composed as to something*" (p. 119). The various *hexeis* are the various modes of being able to be composed. **Praxis as the how of being-in-the-world appears as the being-context that we can also designate as *existence*** (p. 119). Being-composed is not optional or indeterminate; in *hexis* lies the primary orientation toward the *kairos*: "I am there, come what may!" (p. 119). *Hexis* is "related in itself to another possibility, to the possibility of my being, *that within my being something comes over me, which brings me out of composure*" (p. 119).

And from `phase2-u-fp3c.md` §18a:

> Hexis cannot be understood as completeness in the sense of routine. **From *hexis* we see clearly that the *pathē* "in their way, more proximately determine being-in-the-world, being-in-the-moment" (p. 129).** The *pathē* do not concern "spiritual states" or "bodily symptoms"; they characterize the entire human being in its *disposition in the world* (p. 129). The entire human being is the primary object of the Aristotelian psychology of *De Anima*, Book 1. The entire human being must be understood with regard to its being as *zoē*, as being-in-a-world — "a genuine topic not of psychology but of the *discussion of the being of this being*" (p. 129).

### Candidate B — U-FP3e §21–§22 (Phobos, Supplements to Being-in-the-World, pp. 167–181)

**Unit**: **U-FP3e** (`bcap-structured/u-fp3e.json` + `bcap-analysis/phase2-u-fp3e.md`)
- Specifically **p. 174** contains a closely-related but narrower claim: "Two aspects of *tarachē*: *diōxis* and *phygē* — both 'basic determinations of the genuine being-moved of being-there'" (p. 174). This is fear-specific rather than hexis-pathos-general.

## 3. Status of the verbatim

**Best-candidate verbatim from corpus/index for the hexis-pathē co-original claim**:

Option 1 (recommended — clean hexis-pathē co-original formula, p. 129):
> The *pathē* "in their way, more proximately determine being-in-the-world, being-in-the-moment"; they characterize "the entire human being in its disposition in the world" (BCAP, p. 129).

Option 2 (hexis-as-being-composed-as-to, p. 119):
> *Hexis* is "the determination of the genuineness of being-there in a moment of being-composed as to something"; *pathē* and *hexeis* together articulate "the being-context that we can also designate as existence" (BCAP, p. 119).

Option 3 (narrower fear-as-basic-determination, p. 174):
> Both *diōxis* and *phygē* are "basic determinations of the genuine being-moved of being-there" (BCAP, p. 174).

## 4. Recommended action

**Option A (recommended)**: Use Candidate A / Option 1 (p. 129), which most directly matches the dissertation's hexis-pathē co-original claim:

```latex
NEW:
The \textit{pathē}, moreover, are co-original with \textit{hexeis}. Both 
are fundamental concepts of being, articulating the being-structure of 
beings whose way of being is one in which the \textit{pathē} ``in their 
way, more proximately determine being-in-the-world, being-in-the-moment'' 
(BCAP, p.~129) --- they ``characterize the entire human being in its 
disposition in the world'' (BCAP, p.~129).
```

**Option B**: Use Candidate B / Option 3 (p. 174). This matches the placeholder's locus per the user's earlier inclination ("BCAP page TBD" in the inconsistencies-and-fallacies.json marker mentioned p. 174), but the content is narrower and fear-specific.

**Option C (per `feedback-missing-source-placeholder.md`)**: Leave `******` for user manual fill against Metcalf-Tanzer Indiana 2009 edition. The user should specify which of the two candidate loci (p. 129 hexis-pathē co-original vs. p. 174 fear-as-basic-determination) is intended.

## 5. Patch-template for user (Option A — p. 129, recommended)

```latex
OLD:
The \textit{pathē}, moreover, are co-original with \textit{hexeis}. Both 
are fundamental concepts of being, articulating the being-structure of 
beings whose way of being is ``\textbf{******}'' (BCAP, p.~\textbf{******}).

NEW (Option A, p. 129):
The \textit{pathē}, moreover, are co-original with \textit{hexeis}. Both 
are fundamental concepts of being, articulating the being-structure of 
beings whose way of being is one in which the \textit{pathē} ``in their 
way, more proximately determine being-in-the-world, being-in-the-moment'' 
(BCAP, p.~129).
```

## 6. Note on terminology alignment

Per `terminology-decisions-final.md`, the surrounding §1.4 prose (Feedback Loop, lines 86–115) should be reviewed for `resonant pathē` insertion sites. The hexis-pathē co-originality claim at line 174 articulates the architectural ground for the `resonant pathē` notion: when memory- or expectation-*phantasmata* elicit *pathē*, the `resonant pathē` are articulationally-concrete emotions sedimented as *hexis* through repeated chain-actualization. This connection should be made explicit in the post-migration Phase 5 revision.

## 7. Provenance footer

- Pipeline manifest: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-structured/manifest.json` (U-FP3c §17–§18 covers hexis-pathos; U-FP3e §21 covers phobos)
- Corpus/index narratives: `phase2-u-fp3c.md` §17–§18 (recommended); `phase2-u-fp3e.md` §21 (alternative)
- Bekker cross-anchors: *Metaphysics* Δ.20–23 (hexis); *DA* I.1 (pathē of soul); *NE* B 2–5 (hexis-as-arete)
