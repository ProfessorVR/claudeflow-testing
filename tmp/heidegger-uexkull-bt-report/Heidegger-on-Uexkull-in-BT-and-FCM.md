# Heidegger's Engagement with Jakob von Uexküll
## *Being and Time* (1927) Corpus Analysis — and the Necessary Pivot to *Fundamental Concepts of Metaphysics* (GA 29/30, 1929–30)

**Compiled**: 2026-05-25
**Sources surveyed**:
- `corpus/index/Heidegger - Being and Time/bt-analysis/` (38 files: 17 phase2 unit analyses, bt-german-appendix, book-level-ontology, graphs, etc.)
- `corpus/rhetorical_ontology/Heidegger, Martin - Being and Time_(1962)_[My Copy].pdf` (Macquarrie–Robinson trans., extracted to plain text)
- `corpus/index/Von Uexkull - A Foray into the Worlds of Animals and Humans/uex-analysis/` (32 files including cross-pipeline graph mapping Uexküll → Heidegger concepts)
- `tmp/uexkull-tones-report/Uexkull-Tones-and-Umwelt.md` (existing user report on Uexküll's tonal vocabulary)
- `tmp/Dissertation/Working tex versions/1.2-v2.tex` and `1.3-v2.tex` (user's existing dissertation engagements with Uexküll)
- Web sources on FCM (1995 McNeill–Walker trans.; Buchanan's *Onto-Ethologies*; Calarco; Mitchell)

---

## I. Bottom-Line Finding

**Being and Time (1927) contains zero direct citations of Jakob von Uexküll.**

Direct verification:
- `grep -iE "uex|uexkull|uexküll"` on the full PDF-extracted text returns **zero matches**.
- The corpus index files for BT (`bt-german-appendix.md`, `book-level-ontology.md`, `phase2-bt-*.md`, `concept-matrix.csv`, `global-edges.csv`, `contested-nodes.md`) likewise contain **zero references** to Uexküll.
- The Author's Notes / Footnotes appendix of the 1962 Macquarrie–Robinson translation cites Husserl, Scheler, Hartmann, Dilthey, Cassirer, Aquinas, Aristotle, Plato, Augustine, Calvin, Zwingli, Kant, Grimm — but **not Uexküll**.

The only adjacent biological-tradition reference in BT is to **Karl Ernst von Baer** (1792–1876), the embryologist, in §12 (H. 58 / M&R p. 84): Heidegger acknowledges that the term *Umwelt* "has been used in biology, especially since K. von Baer," and immediately distances his ontological use of the term from any "biologism." This passage will be quoted in full below.

**Note on user's prior TODO entry**: The user's `tmp/Dissertation/TODO_NOTES.md` (line 494) lists "Heidegger BT §10 (M&R fn, Uexküll reference)" among items to investigate. I verified §10 (H. 45–50, M&R pp. 71–77) and its footnotes (Authors' Notes ii–x): **no Uexküll citation appears**. The note appears to be either a misremembered claim or a pointer to an item the user wanted to verify; the verification falsifies it.

**Note on corpus-internal claim that BT cites Uexküll directly**: The cross-pipeline analysis in `corpus/index/Von Uexkull - A Foray into the Worlds of Animals and Humans/uex-analysis/uex-graph-cross-pipeline.mmd` (edge #1, "Umwelt ↔ In-der-Welt-sein") and `phase2-uex-f0.md` line 90 assert that "Heidegger explicitly cites Uexküll" in B&T §§14–18. **This is incorrect.** The corpus's own qualifier `[INTERP-high]` flags the edge as interpretively synthesized; the citation-claim itself appears to be an analyst's slip. Other Uexküll-corpus files correctly attribute the explicit engagement to GA 29/30 (`phase2-uex-f2.md` line 95, `phase2-uex-f4.md` line 93, `phase2-uex-f5.md` line 99, `phase2-uex-m1.md` line 109, `phase2-uex-m6.md` line 133).

---

## II. The One Passage in BT That Engages the Biological Umwelt-Tradition (§12, H. 58)

This is the only passage in BT that explicitly thematizes the biological lineage of the term *Umwelt*. It is BT's nearest neighbor to a Uexküll-engagement, but it conspicuously routes the genealogy through von Baer rather than through the more obvious contemporary candidate (Uexküll's *Umwelt und Innenwelt der Tiere*, 1909/1921, which had been in circulation for ~18 years when BT appeared).

> "Nowadays there is much talk about 'man's having an environment [*Umwelt*]'; but this says nothing ontologically as long as this 'having' is left indefinite. In its very possibility this 'having' is founded upon the existential state of Being-in. Because Dasein is essentially an entity with Being-in, it can explicitly discover those entities which it encounters environmentally, it can know them, it can avail itself of them, it can have the 'world'. To talk about 'having an environment' is ontically trivial, but ontologically it presents a problem. To solve it requires nothing else than defining the Being of Dasein, and doing so in a way which is ontologically adequate. **Although this state of Being is one of which use has been made in biology, especially since K. von Baer, one must not conclude that its philosophical use implies 'biologism'.** For the environment is a structure which even biology as a positive science can never find and can never define, but must presuppose and constantly employ. Yet, even as an a priori condition for the objects which biology takes for its theme, this structure itself can be explained philosophically only if it has been conceived beforehand as a structure of Dasein. Only in terms of an orientation towards the ontological structure thus conceived can 'life' as a state of Being be defined a priori, and this must be done in a privative manner."
>
> — Heidegger, *Being and Time*, §12 (H. 57–58; M&R 1962, p. 84). **Emphasis added.**

Three points worth noting:

1. **Heidegger acknowledges the biological tradition but neutralizes it.** The acknowledgment is single-named (von Baer) and immediately followed by a distancing move: the philosophical concept of environment must be conceived as a structure *of Dasein*, not as a biological feature of organisms.

2. **Heidegger does not name Uexküll** — even though Uexküll's *Umwelt und Innenwelt der Tiere* (1909, expanded 2nd ed. 1921) had been the most influential 20th-century elaboration of biological Umwelt-theory at the time of BT's composition. The omission is significant: Heidegger names a 19th-century embryologist (von Baer) rather than the living contemporary whose name was synonymous with Umwelt-discourse in 1927. Heidegger's silence here is best read as a deliberate distancing move — distancing his existential-ontological Umwelt-concept from the very biology that had popularized the term.

3. **The privative-method clause** ("life as a state of Being [must be defined] in a privative manner") foreshadows the move Heidegger will make in GA 29/30: animal life will be characterized *privatively* against Dasein's world-formation, as "poor in world" (*weltarm*). The same privative-methodological commitment that grounds BT §10's brief gesture toward biology becomes, two years later, the explicit framework for the engagement with Uexküll.

---

## III. BT's Umwelt-Analysis (§§12–24) — Conceptual Parallels Without Citation

Although Uexküll is uncited, BT's existential analytic of *Umwelt* (the environing-world) and *Bewandtnisganzheit* (the totality of involvements) develops a structure with significant conceptual parallels to Uexküll's biological theory. The corpus index's cross-pipeline graph maps ~13 such parallels, of which the most architecturally consequential are:

### 1. Closed meaning-world (Umwelt ↔ In-der-Welt-sein)

For Uexküll, the *Umwelt* is a closed, self-contained perceptual world composed of *Merkwelt* (perception-world) and *Wirkwelt* (effect-world), linked by the *Funktionskreis* (functional cycle). For Heidegger, *In-der-Welt-sein* (Being-in-the-world) is the closed existential structure within which entities can show up at all. Both reject the model of a subject-confronting-objects in a neutral space; both treat the meaning-totality as constitutive of, rather than derivative from, the encounter with individual entities.

### 2. Equipment ↔ Carrier of meaning (Zuhandenheit ↔ Bedeutungsträger)

BT §§15–18 develops the analysis of *Zeug* (equipment) and *Bewandtnis* (involvement): the hammer is what it is through its in-order-to (Um-zu) and for-the-sake-of (Worumwillen) relations, not through objective properties. Uexküll's *Bedeutungsträger* (carrier of meaning) is similarly constituted through its place in a *Funktionskreis*: the same physical object becomes a different "thing" in different functional cycles (Uexküll's "oak tree" example: forester's cordwood, ant's pathway, bark beetle's larval substrate, ichneumon wasp's host). The structural parallel is precise: meaning is *relationally constituted* in both frameworks.

### 3. Mood as world-disclosive (Stimmung ↔ Befindlichkeit)

In BT §29 *Befindlichkeit* (attunement/disposition) discloses how Dasein finds itself in the world *before* any determinate perception. Uexküll's *Stimmung* (in the hermit-crab/sea-anemone example, *Foray* p. 97) functions analogously at the biosemiotic level: the same object (the anemone) yields different *Wirktöne* (effect-tones) — protective, dwelling, feeding — depending on the crab's *Stimmung*. The crab does not first see the anemone as a neutral object and then "apply" a mood; the mood is constitutive of what the anemone shows up as.

**This parallel is the one your dissertation §1.3 L144 fn synthesizes**: "Heideggerian disclosure-withdrawal, Gibsonian affordance, and Uexküllian *Wirkton* each name the same architectonic feature of attuned engagement."

### 4. Spatial schema as projected (Raumschema ↔ Entwurf/de-severance)

BT §§22–24 rejects homogeneous Cartesian space in favor of existentially constituted *Raum* (de-severance, directionality, regionality). Uexküll's three spaces (*Wirkraum*, *Merkraum*, *Tastraum*) and his territory-analysis make the parallel biological argument: space is not a neutral receptacle but a subject-constituted structure.

### 5. Nature within the work-world ("environing Nature," *Umweltnatur*)

BT §15 (H. 100, M&R p. 100) provides a striking passage where Heidegger handles Nature within the equipment-totality. This is the BT passage that most resembles Uexküll's framework, though again Uexküll is uncited:

> "Even when goods are produced by the dozen, this constitutive assignment is by no means lacking… Along with the public world, the environing Nature [*die Umweltnatur*] is discovered and is accessible to everyone. In roads, streets, bridges, buildings, our concern discovers Nature as having some definite direction. A covered railway platform takes account of bad weather; an installation for public lighting takes account of the darkness… When we look at the clock, we tacitly make use of the 'sun's position'…"
>
> — Heidegger, *Being and Time*, §15 (H. 71; M&R 1962, p. 100).

This passage articulates a thoroughgoing ontological inseparability between the perceiving/acting subject and its meaningful environment that runs strictly parallel to Uexküll's *Funktionskreis*. The bridge "takes account of" the river; the platform "takes account of" the weather. This is not metaphor — it is Heidegger's claim that the worldhood of the work-world *is* the relational totality. Where Uexküll generalizes from the tick's perception of butyric acid to a universal biosemiotic principle (each organism's *Bauplan* shapes and is shaped by the *Bauplan* of its environing entities), Heidegger generalizes from clock-and-sun to the existential structure of Dasein's care-laden absorption in the world.

### 6. The "as"-structure (Als-Struktur ↔ perception-marks)

BT §32–33 develops the hermeneutic "as": an entity is encountered *as* something within its referential totality (the hammer is encountered *as* hammer-for-driving-nails). Uexküll's perception-marks function biosemiotically: the tick perceives butyric acid *as* mammal-approach-signal, not as a chemical with vapor pressure. The convergence is not accidental — both reject the model of bare sense-data plus interpretation.

---

## IV. The Real Engagement: *Fundamental Concepts of Metaphysics* (GA 29/30, 1929–30)

Heidegger's direct, sustained engagement with Uexküll occurs in the lecture course delivered the winter semester after BT was published — **Die Grundbegriffe der Metaphysik: Welt – Endlichkeit – Einsamkeit** (GA 29/30), first published in 1983, English trans. by McNeill and Walker as *The Fundamental Concepts of Metaphysics: World, Finitude, Solitude* (Indiana UP, 1995).

### Location of the engagement

FCM Chapter Four ("Clarification of the Essence of the Animal's Poverty in World"; English pp. 201–267) is the locus. The Uexküll-engagement is concentrated at:

| Section | Topic | Page (McNeill-Walker) |
|---------|-------|------------------------|
| §49 | Methodology of transposition into animal being | 209 |
| §50 | Having/not having world as deprivation | 212 |
| §51–57 | Organism essence, organs, capability | 215–235 |
| §58 | Behavior and captivation of the animal | 236 |
| §59 | Animal behavior structure | 241 |
| §60 | Openness of behavior and captivation | 249 |
| §61 | Concluding delimitation of the essential concept of the organism | 257 |
| **§61b** | **"Two essential steps in biology: Driesch and Uexküll"** | **261–267** |
| §62–63 | World-poverty conclusions | 267+ |

The Uexküll-by-name engagement clusters at **pp. 261–267** (per the Wikipedia/secondary literature citations confirmed via web search) and at scattered earlier references (especially pp. 224, 241).

### What Heidegger actually says about Uexküll (verbatim, FCM)

**On Uexküll's two major contributions to biology** (FCM §61b, p. 261ff., McNeill–Walker trans.):

> "The *first step* concerns the recognition of the holistic character of the organism."

> "The *second step* is the insight into the essential significance of research concerned with how the animal is bound to its environment."

**On the standing of Uexküll's work**:

> "His investigations are very highly valued today, but they have not yet acquired the fundamental significance they could have if a more radical interpretation of the organism were developed on their basis."

**On the philosophical importance of taking Uexküll seriously**:

> "It would be foolish if we attempted to impute or ascribe philosophical inadequacy to Uexküll's interpretations, instead of recognising that the engagement with concrete investigations like this is one of the most fruitful things that philosophy can learn from contemporary biology."

These four passages, taken together, are striking for their (rare) Heideggerian generosity toward a contemporary scientist. Heidegger does not patronize Uexküll the way he patronizes most modern biology; he treats Uexküll as a philosophical-ontological resource whose insights remain underdetermined because Uexküll lacked the ontological framework to draw them out.

### What concepts Heidegger draws from Uexküll

1. **The holistic character of the organism.** Heidegger affirms Uexküll's anti-mechanism: the organism is not a sum of parts but a structural whole.

2. **The organism–environment inseparability (*Umwelt*).** This is the operationally critical Uexküllian thesis for Heidegger. The animal is *bound to* its environment in such a way that the environment is internal to its mode of being, not an external space within which it happens to operate.

3. **The *Funktionskreis* (functional cycle) model.** Uexküll's diagrammatic schematization of the closed loop perception-organ → perception-mark → object → effect-mark → effect-organ (see *Foray* Fig. 3) supplies Heidegger with the biological-empirical material on which to build the *Enthemmungsring* (disinhibiting ring) account.

4. **The graduated structure of animal Umwelten.** Uexküll's hierarchy from the simplest organisms (paramecium with one functional cycle, sea urchin as "reflex republic") up through the tick (chemical-thermal-tactile cycle), the jackdaw, and the higher mammals supplies the differential biological material against which Heidegger develops his thesis that animals are "poor in world" — that they have access to entities but only within a closed disinhibiting structure, not as entities-as-such.

5. **Subject-constituted spatiality and temporality.** Uexküll's argument that "without a living subject, there can be neither space nor time" (*Foray* p. 48) parallels — though does not identify with — Heidegger's analysis of Dasein's spatiality and temporality as ontological structures, not Cartesian receptacles.

### How Heidegger transforms what he draws

Heidegger does not merely adopt Uexküll's framework; he transforms it through three operations:

1. **Renaming.** Heidegger renames Uexküll's *Umwelt* as the *Enthemmungsring* ("disinhibiting ring"). Where Uexküll's term suggests a positive perceptual–effectual world the animal "has," Heidegger's term emphasizes that the animal is *captivated* (*benommen*) within a circle of triggers that disinhibit its drives. The animal does not "have" its environment as a structure; it is "taken in by" (*be-nommen*) the disinhibiting ring.

2. **Reframing as deprivation.** Where Uexküll posits a positive equality among Umwelten ("All animal subjects are inserted into their environments to the same degree of perfection," *Foray* p. 46), Heidegger reframes the animal's mode of being as a *privation* relative to Dasein's world-formation. The famous tripartite thesis: the stone is *weltlos* (worldless); the animal is *weltarm* (poor in world); the human is *weltbildend* (world-forming).

3. **Ontologizing rather than biologizing.** Heidegger preserves Uexküll's biological insights but recasts them ontologically. The closed structure of the Funktionskreis becomes the closed structure of *Benommenheit* (captivation), which Heidegger then contrasts with the open structure of *Erschlossenheit* (disclosedness) characteristic of Dasein.

### The "captivation/disinhibiting ring" thesis in detail

In FCM §§58–61, Heidegger develops his most distinctive contribution. The animal's mode of being is *Benommenheit* — a captivation in which the animal is wholly taken up by the disinhibitors of its drives. The animal "behaves" (*benimmt sich*) rather than "comports itself" (*verhält sich zu*); it is absorbed in a circle of stimulus-response triggers that, taken together, constitute its disinhibiting ring. The Uexküllian *Umwelt* is, on this transformation, not a positive perceptual world the animal "has" but the closed disinhibiting structure within which the animal is captivated.

The dissertation's §1.2 footnote on Uexküll (Working tex versions / `1.2-v2.tex`) gets this correctly:

> "Heidegger directly engages Uexküll in *The Fundamental Concepts of Metaphysics* (GA 29/30, §§42–58), reading Uexküll's *Funktionskreis* model into the worldhood-analysis and distinguishing animal captivation (*Benommenheit*) from human world-formation (*Weltbildung*). This distinction handles the extension of the *Umwelt*-analogy to rational animals: at the basic hedonic-tonality stage of the chain, the perceptual world the animal inhabits is structured by Umwelt-relations whether or not the animal is capable of *doxa*-mediated articulation; the distinction between captivation and world-formation marks the divide at which higher-order rational operations transform the bare Umwelt-structure."

---

## V. Which Uexküll Texts Did Heidegger Know?

The biographical-chronological situation:

- **1909**: Uexküll, *Umwelt und Innenwelt der Tiere* (Berlin: Springer; expanded 2nd ed. 1921).
- **1920/1928**: Uexküll, *Theoretische Biologie* (Berlin: Borntraeger; 2nd ed. 1928).
- **1927**: Heidegger, *Sein und Zeit* (Jahrbuch für Philosophie und phänomenologische Forschung, vol. 8). **Uexküll uncited.**
- **1929–30 WS**: Heidegger delivers the *Die Grundbegriffe der Metaphysik* lecture course (Freiburg). Engages Uexküll's *Umwelt und Innenwelt der Tiere* (1909/1921) and *Theoretische Biologie* (1920/1928) extensively — these are the only two major Uexküll books available at the time.
- **1934**: Uexküll, *Streifzüge durch die Umwelten von Tieren und Menschen* (Berlin: Springer). **Postdates FCM.**
- **1940**: Uexküll, *Bedeutungslehre* (Leipzig: Barth). **Postdates FCM.**

Heidegger's FCM engagement is therefore with the **first two** Uexküll works — neither of which is in the local corpus (which holds the 1934 *Foray* and 1940 *Theory of Meaning* in the 2010 O'Neil translation). This is a critical bibliographic note for the dissertation: when discussing Heidegger's reading of Uexküll, the canonical texts are the 1909/1921 *Umwelt und Innenwelt der Tiere* and the 1920/1928 *Theoretische Biologie*, not the more famous *Foray* (which is what readers today most often cite).

The historical consensus (per Anne Harrington's *Reenchanted Science*, 1996, and Brett Buchanan's *Onto-Ethologies*, 2008) is that Heidegger had "studied and digested Uexküll's works at remarkable length" — referring specifically to those first two works — by the time of FCM. The depth of engagement in §§61b–62 (the named-Uexküll passages) corroborates this: Heidegger discusses the *Funktionskreis* model with technical accuracy, not in passing.

---

## VI. Why Heidegger Did Not Cite Uexküll in BT — A Hypothesis

Three readings of the citation-gap are defensible:

**(a) Chronological-genetic.** Heidegger had read Uexküll before BT but had not yet worked out an explicit philosophical position on him. The 1929–30 lectures represent Heidegger's first systematic engagement, and BT's 1927 publication anticipates that engagement only obliquely (the von Baer reference, the privative-method clause). On this reading, the citation-gap is a chronological accident: Heidegger needed the additional two years before he was prepared to engage Uexküll explicitly.

**(b) Strategic disambiguation.** Heidegger had read Uexküll and deliberately omitted reference to him in BT because citing Uexküll would have invited exactly the "biologism" charge that §12 specifically forecloses. By naming the dead 19th-century embryologist (von Baer) rather than the living-and-controversial biologist (Uexküll), Heidegger asserts that his ontological *Umwelt*-concept is independent of contemporary biological theory. On this reading, the silence is rhetorical: Heidegger is constructing a stance from which he can later engage Uexküll on his own terms (the FCM stance: "It would be foolish to ascribe philosophical inadequacy to Uexküll").

**(c) Buchanan/Harrington thesis (deep but unacknowledged influence).** Uexküll's *Umwelt* concept was so pervasive in the German-speaking philosophical biology of the 1920s that Heidegger could not have been unaware of it, and the architectural parallels between BT's *Umwelt*-analytic and Uexküll's biological *Umwelt*-theory are too close to be coincidental. Whether or not BT names Uexküll, his influence is present.

The three readings are not mutually exclusive. A defensible synthesis: Heidegger had read at least *Umwelt und Innenwelt der Tiere* (1909/1921) by the time of BT's composition; he deliberately did not cite Uexküll in BT because citing him would have complicated the existential-ontological reframing he was trying to perform; the FCM engagement two years later represents Heidegger working out, philosophically and explicitly, the position toward Uexküll that BT's §12 left implicit.

---

## VII. Why This Matters for the Dissertation

For your project (Aristotle-primary, Heidegger-close-second, Rickert-and-Uexküll lesser), the bibliographic-philological situation has three practical consequences:

1. **The §1.2-v2 footnote should be precise about the FCM location.** The footnote currently reads "§§42–58." Per the McNeill–Walker English edition the named-Uexküll engagement clusters at §61b (pp. 261–267) and §50 (p. 212), with scattered earlier references at pp. 224 and 241. Consider revising to "§§42–63 (especially §61b)" or "FCM Chapter Four, esp. §§50, 58–61."

2. **The §1.3 L144 synthesis footnote (Heideggerian disclosure-withdrawal / Gibsonian affordance / Uexküllian *Wirkton*) operates correctly at the conceptual level.** The architectural-homology argument does not require citation-of-Uexküll-by-BT — it requires only that the three frameworks name the same architectonic feature, which they do.

3. **If your Chapter X (announced at §1.0 L85 fn as "engagement with Heidegger, Rickert, Uexküll, and Burke") plans to treat Uexküll philosophically rather than biologically**, the canonical texts for the Heidegger-Uexküll relation are:
   - Uexküll, *Umwelt und Innenwelt der Tiere* (1909/1921) — **Heidegger's source**.
   - Uexküll, *Theoretische Biologie* (1920/1928) — **Heidegger's source**.
   - Heidegger, *FCM* (1929–30) §§42–63, esp. §50 and §61b — **the engagement**.
   - The *Foray* (1934) you have in corpus is structurally continuous with the earlier works but **was not available to Heidegger in 1927 or 1929**, so it cannot be cited *as Heidegger's source*. It can be cited as a Uexküll-canon source provided the chronology is stated explicitly.

The secondary literature that synthesizes the relationship (and would supply citations for Chapter X) includes:
- Buchanan, *Onto-Ethologies: The Animal Environments of Uexküll, Heidegger, Merleau-Ponty, and Deleuze* (SUNY 2008).
- Calarco, *Zoographies: The Question of the Animal from Heidegger to Derrida* (Columbia 2008).
- Agamben, *The Open: Man and Animal* (Stanford 2004), Chs. 11–13.
- Harrington, *Reenchanted Science* (Princeton 1996), Ch. 1 (Uexküll's reception).
- Mitchell, "Heidegger's Later Thinking of Animality: The End of World Poverty," *Gatherings* 1 (2011).
- Engelland, "Heidegger and the Human Difference," *Journal of the American Philosophical Association* (2015).

---

## VIII. Summary

| Claim | Verdict |
|-------|---------|
| BT (1927) directly cites Uexküll | **FALSE** (zero textual occurrences, zero corpus index references) |
| BT §12's "K. von Baer" passage acknowledges the biological Umwelt-tradition | TRUE, but routes the genealogy *around* Uexküll |
| BT's *Umwelt*-analytic (§§12–18, §15 *Umweltnatur*, §29 *Befindlichkeit*) develops parallel structures to Uexküll's *Funktionskreis* | TRUE — extensive architectural parallels, no citations |
| The corpus index claim "Heidegger explicitly cites Uexküll" at BT §§14–18 (`phase2-uex-f0.md` L90, cross-pipeline graph edge #1) | **FALSE** — corpus analyst error |
| The dissertation §1.2-v2 attribution of explicit engagement to FCM (GA 29/30) | TRUE and correctly cited |
| Heidegger's named, sustained engagement with Uexküll occurs in FCM (1929–30), esp. §50 and §§58–61b | TRUE |
| Heidegger transforms Uexküll's *Umwelt* → *Enthemmungsring* and reframes animal-being as *Benommenheit* / *weltarm* | TRUE — Heidegger's distinctive philosophical operation on Uexküll's biology |
| Heidegger's source-texts on Uexküll were *Umwelt und Innenwelt der Tiere* (1909/1921) and *Theoretische Biologie* (1920/1928), not *Foray* (1934) | TRUE — chronologically necessary |

The honest one-sentence answer to the user's question: **Heidegger does not reference Uexküll in Being and Time at all; the direct philosophical engagement (where Heidegger names Uexküll, draws on his Funktionskreis, transforms his Umwelt-concept into the Enthemmungsring, and articulates the famous "world-poverty" thesis) occurs two years later in The Fundamental Concepts of Metaphysics (GA 29/30, 1929–30), and an interpretation of BT's silent Umwelt-analytic in light of Uexküll's biology is reconstructive philosophical work, not exegesis of explicit textual citation.**
