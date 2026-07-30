# HR Heidegger Loci Concordance

**Volume**: *Heidegger and Rhetoric*, ed. Gross & Kemmann, SUNY Press 2005.

**Phase**: 3D — Cross-Pipeline Citation Concordance (Heidegger primary loci)

**Methodology**: Aggregated the `heidegger_loci` array from each of the 8 Phase 2 unit JSONs (Gross-A, Gross-B, Gadamer, Michalski, Hyde, Struever, Kisiel, Pöggeler). De-duplicated by canonical (Heidegger text, primary page/section) key. For *Sein und Zeit* citations, dedup is keyed by primary BT-pipeline unit so distinct §-references within (e.g.) §§54-60 collapse to a single BT-D2-U2 locus. For GA 18 citations, dedup is keyed by lowest page in the range, with the BCAP-pipeline unit derived from the page range.

**Bridge resolution**:
- **GA 18** → BCAP pipeline (Heidegger - Basic Concepts of Aristotelian Philosophy, SS 1924)
- **GA 2 (Sein und Zeit)** → BT pipeline (Heidegger - Being and Time)
- Other GA volumes → no existing pipeline unit (Phase-4 expansion candidates)

**Counts**: 162 distinct Heidegger loci; 31 multi-cited (≥2 distinct contributors); 4 volume-pillars (≥4 distinct contributors).

---

## Volume Pillars (≥4 distinct contributors)

These are the most-cited Heidegger loci in the volume. They are the highest-priority cross-references for the dissertation; every dissertation chapter that engages this volume's argument should reckon with at least one of them.

### HL-VOL-004 — *Being and Time (Sein und Zeit, GA 2)* — p./§: — §: (end of §29 / beginning of §30 area)

- **GA volume**: GA 2
- **H-page**: 179-182, 228-235
- **English page**: 178
- **Edition/translation noted**: BT (Macquarrie/Robinson trans., 1962)
- **Concordance role**: Volume-pillar (5 distinct contributors) — high-priority dissertation cross-reference
- **Bridge target**: BT pipeline → BT-D1-U5 (§§28–31, H.148-D1: Da-sein, Befindlichkeit, Furcht, Verstehen)
- **Bridge path**: `corpus/index/Heidegger - Being and Time/bt-analysis/phase2-bt-d1-u5.md`
- **Cited by** (6 citations from 5 distinct contributors):
  - **HR-01-GROSS-A** (essay p. 27 (closing of Section III) — also referenced p.6): Quote (cited in text and via n.41 for Section IV): Aristotle's Rhetoric II 'must be taken as the first systematic hermeneutic of the everydayness of Being with one another.'
    - *Role in essay*: central — Heidegger's own canonical statement of Rhetoric-as-hermeneutic-of-everydayness
  - **HR-04-HYDE** (essay p. 88, Note 15): Note 15 — fear and anxiety analyses, the primordial vs. derivative pair.
    - *Role in essay*: Central — Heidegger continues Aristotle's pathē-analysis here.
  - **HR-06-KISIEL** (essay p. 148): Speaking-against-one-another (Verhandeln) as built-in possibility of being-with-one-another (re-keyed with German pagination, see Note 2).
    - *Role in essay*: supporting — anchor for negotiation/parley reading of doxa
  - **HR-07-POGGELER** (essay p. 168): Pöggeler's KEY critical citation: BT §29 — 'Contrary to the traditional orientation of the concept of rhetoric to something like a subject, Aristotle's work must be regarded as the first systematic he
    - *Role in essay*: CENTRAL counter-evidence: the very passage Hyde/Struever/Gross/Kisiel read as positive, Pöggeler reads as the moment of 
  - **HR-07-POGGELER** (essay p. 167): n. 32: cited for fear-anxiety analysis (BT block at H-pages 32, 165) and for following 'the Christian tradition, Heidegger links fear with anxiety (Angst)'
    - *Role in essay*: supporting — anchors Pöggeler's read of BT's pathos-to-anxiety move
  - **HR-05-STRUEVER** (essay p. p. 105 (epigraph); cited extensively throughout): Epigraph: 'Rhetorik [ist]... die erste systematische Hermeneutik der Alltäglichkeit des Miteinanderseins.' BT 178 → Struever's title 'Alltäglichkeit, Timefulness, in the Heideggerian Program.'
    - *Role in essay*: central — anchors the entire essay's claim that rhetoric defines BT's hermeneutic register

### HL-VOL-007 — *Being and Time (Sein und Zeit, GA 2)* — p./§: — §: BT §27 — half-hearted suggestion of authentic Being-with through devotion to 'the same affair in common'

- **GA volume**: GA 2
- **H-page**: 165
- **English page**: 159
- **Edition/translation noted**: Macquarrie/Robinson trans.
- **Concordance role**: Volume-pillar (4 distinct contributors) — high-priority dissertation cross-reference
- **Bridge target**: BT pipeline → BT-D1-U4 (§§22–27, H.130-D1: Spatiality + Mitsein + das Man)
- **Bridge path**: `corpus/index/Heidegger - Being and Time/bt-analysis/phase2-bt-d1-u4.md`
- **Cited by** (7 citations from 4 distinct contributors):
  - **HR-01-GROSS-B** (essay p. p. 40): Book p. 40: 'In Being and Time Heidegger does make the half-hearted suggestion that people can be authentically bound together "when they devote themselves to the same affair in common" (BT 159).'
    - *Role in essay*: central — supports P8 (BT's reduced political-rhetorical resources)
  - **HR-04-HYDE** (essay p. 85): BT averageness/publicness passage: 'In this averageness with which [publicness] prescribes what can and may be ventured, it keeps watch over everything exceptional that thrusts itself to the fore. Eve
    - *Role in essay*: Supporting — establishes the negative pole of publicness against which the positive (BT 167) is set.
  - **HR-04-HYDE** (essay p. 85): 'Publicness belongs to Dasein's positive constitution' — Hyde insists this positive pole authorizes rhetoric's ontological role.
    - *Role in essay*: Supporting — establishes the positive pole of publicness.
  - **HR-04-HYDE** (essay p. 99): Considerateness (Rücksicht) and forbearance (Nachsicht) — note 43 + Hyde's Call of Conscience 57-64 — the rhetorical-ethical dispositions Nazism violated.
    - *Role in essay*: Supporting — politicizes the conscience-rhetoric link.
  - **HR-06-KISIEL** (essay p. 139, 146): 'Leaping ahead and liberating' (SZ 122) authentic Fürsorge vs. 'leaping in and dominating' inauthentic Fürsorge (SZ 298). Politician projects self as authentic conscience for other.
    - *Role in essay*: central — SZ 122/298 anchor for the politics-and-pedagogy distinction
  - **HR-06-KISIEL** (essay p. 142): Everyday Dasein 'infinitely scattered in the average with-world and in the multiplicity of the surrounding world' (SZ 129); state-of-the-Anyone in average mode (389).
    - *Role in essay*: supporting — defines the leveling Anyone Heidegger seeks to escape
  - **HR-05-STRUEVER** (essay p. throughout, esp. p. 117 (Section II.2); p. 121 (Blattner contrast); p. 126 (closing)): BT continuously invoked as the work that *Alltäglichkeit* and *Befindlichkeit* genetically derive from SS 1924's rhetorical Aristotle. Specific section references are rare; the operative claim is SS 1
    - *Role in essay*: central — target of continuity-thesis (P8)

### HL-VOL-074 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 110 §: discussion of die Grundbestimmung eines Lebenden via pathē (the in-der-Welt-sein passage)

- **GA volume**: GA 18
- **Edition/translation noted**: GA 18
- **Concordance role**: Volume-pillar (4 distinct contributors) — high-priority dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3a.md`
- **Cited by** (5 citations from 4 distinct contributors):
  - **HR-01-GROSS-A** (essay p. 1 (epigraph and n.1)): Epigraph: 'Die Rhetorik ist nichts anderes als die Auslegung des konkreten Daseins, die Hermeneutik des Daseins selbst.' [Rhetoric is no less than the elaboration of Dasein in its concreteness, the he
    - *Role in essay*: central — the volume's load-bearing GA 18 quotation; ground of the rhetorical-ontology thesis
  - **HR-01-GROSS-B** (essay p. p. 27, p. 41 (note 1)): Top-of-page bridge from Section III to Section IV (book p. 27): 'Die Grundbestimmung eines Lebenden gewinnt nicht aus physiologischen Betrachtungen. Das eidos der pathē ist ein Sichverhalten zu andere
    - *Role in essay*: central — opens Section IV's positive thesis; Gross's philological correction of GA 18 editor Michalski
  - **HR-03-MICHALSKI** (essay p. p. 76; p. 80 (note 20)): Note 20 = on the use of the adjective 'hermeneutic' — including the famous identification of Aristotle's Rhetoric as the topic of 'hermeneutic of Dasein' (book p. 76).
    - *Role in essay*: central — anchors the rise of hermeneutics terminology in SS 1924.
  - **HR-03-MICHALSKI** (essay p. p. 77; p. 80 (note 22)): Note 22 = the central formula 'The Rhetoric is nothing else than the interpretation of concrete Dasein, the hermeneutic of Dasein itself.' This is the volume's most-cited single passage from GA 18 (pe
    - *Role in essay*: central — the load-bearing identification that frames the entire essay's pivot to rhetoric.
  - **HR-05-STRUEVER** (essay p. p. 105 (epigraph); cited again pp. 110, 115): Epigraph: 'Rhetorik ist nichts anderes als die Auslegung des konkreten Daseins, die Hermeneutik des Dasein selbst.' Volume's defining passage; shared with HR-01-GROSS-A.
    - *Role in essay*: central — anchors the entire essay's continuity-thesis (rhetoric IS hermeneutics of Dasein)

### HL-VOL-096 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 169f §: fundamental role of pathē in krinein

- **GA volume**: GA 18
- **Edition/translation noted**: Gesamtausgabe vol. 18
- **Concordance role**: Volume-pillar (6 distinct contributors) — high-priority dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3b (§§15–16; German GA 18 pp. 135-169 = English book pp. 93-115)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3b.md`
- **Cited by** (6 citations from 6 distinct contributors):
  - **HR-02-GADAMER** (essay p. p. 49 (III opening), n. 8): Heidegger SS 1924: 'I only wish to point out that it might be more appropriate if philosophers could decide to consider what speaking to others really means.' Kemmann's framing question for Section II
    - *Role in essay*: central — opens Section III's argument
  - **HR-01-GROSS-A** (essay p. 11-12): 'Ich weise nur darauf hin, dass es vielleicht angebracht ware, wenn die Philosophen sich entschliessen wurden, zu uberlegen, was es uberhaupt heisst, zu anderen zu sprechen.' [It would be welcome if t
    - *Role in essay*: supporting — sarcastic understatement Heidegger uses to introduce rhetorical primacy
  - **HR-01-GROSS-B** (essay p. p. 30): Book p. 30: 'pathos is a critical concern for nearly a month of Heidegger's lecture course, a topic opened with the following promise: "With the demonstration of the fundamental role that the pathē pl
    - *Role in essay*: central — opens Heidegger's GA 18 pathē investigation; quoted both in English and German
  - **HR-04-HYDE** (essay p. 89, 95): Quoted in German: 'den Boden des logos selbst' (the ground and soil of the logos itself) — the enthymeme's grounding role.
    - *Role in essay*: Central — Hyde's reading of enthymeme depends on this gloss.
  - **HR-03-MICHALSKI** (essay p. p. 73): Heidegger's critical aside to colleagues: 'it would perhaps be a good idea if philosophers would resolve to consider what it actually means to speak to others' (book p. 73).
    - *Role in essay*: supporting — anchors the philosopher-critique that motivates the philology-shift.
  - **HR-05-STRUEVER** (essay p. p. 114): 'Heidegger's frequent uses of the *Rhetoric* as offering analysis of the different possibilities of *Sich-befinden* of the hearer (169)' — phenomenology of hearing-disposition
    - *Role in essay*: supporting — sich-befinden of hearer


## Multi-cited Loci (2–3 distinct contributors)

### HL-VOL-003 — *Being and Time (Sein und Zeit, GA 2)* — p./§: — 

- **GA volume**: GA 2
- **English page**: 420
- **Edition/translation noted**: BT (Macquarrie/Robinson trans., 1962)
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BT pipeline → unit unresolved (no specific H-page or § parsed)
- **Bridge path**: `corpus/index/Heidegger - Being and Time/bt-analysis/`
- **Cited by** (3 citations from 2 distinct contributors):
  - **HR-01-GROSS-A** (essay p. 14): 'Because Dasein as temporality is ecstatico-horizonal in its Being, it can take along with it a space for which it has made room... With regard to that space which it has ecstatically taken in, the "h
    - *Role in essay*: supporting — Lage / situation as topological-not-positional; supports the 'where we care to be' framing
  - **HR-01-GROSS-A** (essay p. 2): Reference: 'Heidegger's general description of how we move from concernful understanding to theory, and back — a cornerstone of the Being and Time project traceable through the succession of these ter
    - *Role in essay*: central — Heidegger's own admission of the rhetorical genealogy of BT
  - **HR-03-MICHALSKI** (essay p. p. 76): Mentioned at book p. 76 as the place where Heidegger's hermeneutic-phenomenological project, pursued since War Emergency Semester 1919, was 'finally wound up being systematically drafted.' Specific Se
    - *Role in essay*: supporting — bookend for the genesis trajectory.

### HL-VOL-008 — *Being and Time (Sein und Zeit, GA 2)* — p./§: — §: BT §39-44 — primordial care reconstructs ethics; ordinary phenomena 'drop out'

- **GA volume**: GA 2
- **H-page**: 232
- **English page**: 238
- **Edition/translation noted**: Macquarrie/Robinson trans.
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BT pipeline → multi-unit (BT-D1-U8, BT-D1-U9); primary: BT-D1-U8 (§§39–42, H.200-D1: Care + reality + truth set-up)
- **Bridge path**: `corpus/index/Heidegger - Being and Time/bt-analysis/phase2-bt-d1-u8.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-01-GROSS-B** (essay p. p. 40 (cited twice)): Book p. 40: 'Within the horizon of hermeneutical understanding, "ethics" is reconstructed according to the more primordial structural totality of "care," which comes before every factical situation — 
    - *Role in essay*: central — supports P8 (BT's hermeneutic dropping of rhetorical-political resources)
  - **HR-04-HYDE** (essay p. 93): 'Anxiety makes manifest in Dasein its Being towards its ownmost potentiality-for-Being, a potentiality which it always is and that is spoken of directly with the saying of the call of conscience.' Con
    - *Role in essay*: Central — bridges anxiety to call of conscience.

### HL-VOL-009 — *Being and Time (Sein und Zeit, GA 2)* — p./§: — §: BT §60 — only resolute Being-their-Selves enables authentic Being-with

- **GA volume**: GA 2
- **H-page**: 289
- **English page**: 344
- **Edition/translation noted**: Macquarrie/Robinson trans.
- **Concordance role**: Multi-cited (3 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BT pipeline → BT-D2-U2 (§§54–60, H.301-D2: Conscience + Schuldigsein + resoluteness)
- **Bridge path**: `corpus/index/Heidegger - Being and Time/bt-analysis/phase2-bt-d2-u2.md`
- **Cited by** (8 citations from 3 distinct contributors):
  - **HR-01-GROSS-B** (essay p. p. 40): Book p. 40: 'Now "only by authentically Being-their-Selves in resoluteness can people authentically be with one another" (BT 344). This was Heidegger's other critical turn, and one that has significan
    - *Role in essay*: central — defining quote for P8 (BT's narrowing of authentic Mitsein to resoluteness)
  - **HR-04-HYDE** (essay p. 82 (frame), Section III throughout): Cited via note 23 (BT 49-58, 314, 310-325) — call-of-conscience grouped citations capturing §55 ('character of conscience as a call').
    - *Role in essay*: Central — anchors the call-of-conscience section (Section III).
  - **HR-04-HYDE** (essay p. 92): BT 316 — the call as 'abrupt arousal' that interrupts complacent everyday involvements; the 'voice' (Stimme) as juridical 'giving-to-understand' rather than phonē (cf. Dastur).
    - *Role in essay*: Central — captures the disruptive character of the call.
  - **HR-04-HYDE** (essay p. 92): BT 318 quote: 'The call dispenses with any kind of utterance. It does not put itself into words at all. . . . Conscience discourses solely and constantly in the mode of keeping silent.'
    - *Role in essay*: Central — Hyde's silent-call argument anchors here.
  - **HR-04-HYDE** (essay p. 93): BT 342 — 'the anxiety of conscience' — anxiety and conscience 'go hand in hand.'
    - *Role in essay*: Central — links the anxiety/conscience pair.
  - **HR-04-HYDE** (essay p. 93): Quoted at p. 93 in conjunction with BT 232 — the call's saying.
    - *Role in essay*: Central — block citation grounding the conscience analysis.
  - **HR-06-KISIEL** (essay p. 142): 'In the levelling of its essentially general state, the Anyone itself is not historical, just as the masses are rootless, homeless, and stateless, stripped of all uniqueness and credentials of histori
    - *Role in essay*: central — Kisiel's gloss against Bourdieu/Marcuse: das Man is NOT itself historical but path-out via SZ 384/298
  - **HR-06-KISIEL** (essay p. 142, 146): 'Authentic with-one-another only first arises from the authentic self-being of resolute openness' — also (in another sense) the conscience-for-the-other framework.
    - *Role in essay*: central — twice-cited (Section III as escape from Anyone; Section V as politician-as-conscience)

### HL-VOL-010 — *Being and Time (Sein und Zeit, GA 2)* — p./§: — §: BT §74 — historicity, the resolute Freeman, individual Dasein and historical destiny

- **GA volume**: GA 2
- **H-page**: 436
- **English page**: 434
- **Edition/translation noted**: Macquarrie/Robinson trans.
- **Concordance role**: Multi-cited (3 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BT pipeline → BT-D2-U5 (§§72–77, H.404-D2: Historicity)
- **Bridge path**: `corpus/index/Heidegger - Being and Time/bt-analysis/phase2-bt-d2-u5.md`
- **Cited by** (4 citations from 3 distinct contributors):
  - **HR-01-GROSS-B** (essay p. p. 40): Book p. 40: 'But Heidegger's conception of authentic Being had already moved decisively out of the emotional public sphere and into the rarefied domain of the resolute Freeman (BT 434).'
    - *Role in essay*: central — supports P8 (BT 434 = canonical pinpoint of the depoliticization)
  - **HR-04-HYDE** (essay p. 99): Note 44 — 'Only in communicating and struggling [with others] does the power of destiny become free.' Cited to support authentic-community claim.
    - *Role in essay*: Supporting — links communication/struggle (rhetoric/conscience) to Heidegger's authentic Mitsein.
  - **HR-06-KISIEL** (essay p. 142, 147): 'In communication and in struggle (Kampf)' (SZ 384, 'my emphasis of these two rhetorical dimensions'); 'fateful destiny of Dasein in and with its generation' (SZ 384f) = full authentic historical happ
    - *Role in essay*: central — Kisiel's emphasis: the two 'rhetorical dimensions' that lift Dasein out of leveling Anyone
  - **HR-06-KISIEL** (essay p. 135): Heidegger's vocabulary of 'true' (treu), 'constant,' 'faithful,' 'loyal' as virtue of resoluteness — used in Schlageter speech (May 1933) to highlight Schlageter's 'native roots of homeland.'
    - *Role in essay*: central — bridges SZ §74 vocabulary to political application 1933

### HL-VOL-011 — *Being and Time (Sein und Zeit, GA 2)* — p./§: — §: §34

- **GA volume**: GA 2
- **H-page**: 178
- **English page**: 178
- **Edition/translation noted**: Macquarrie/Robinson trans. (Harper & Row 1962)
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BT pipeline → BT-D1-U6 (§§32–34, H.166-D1: Auslegung, Aussage, Rede/Sprache)
- **Bridge path**: `corpus/index/Heidegger - Being and Time/bt-analysis/phase2-bt-d1-u6.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-04-HYDE** (essay p. 82, 88, 95): Heidegger declares: 'Contrary to the traditional [scholastic] orientation, according to which rhetoric is conceived as the kind of thing we learn in school, this work of Aristotle must be taken as the
    - *Role in essay*: Central — anchors the entire chapter; restated multiple times.
  - **HR-07-POGGELER** (essay p. 167): n. 32: 'for what follows, 54, 166, 383, 138' = SZ pages cited for Heidegger's demand that grammar be freed from logic and its orientation to the proposition; logos as speech making something clear (vs
    - *Role in essay*: supporting — anchors Pöggeler's reading of Heidegger's logos-vs-proposition move

### HL-VOL-039 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 3 §: introduction

- **GA volume**: GA 18
- **Edition/translation noted**: Gesamtausgabe vol. 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-INTRO (§§1–2; German GA 18 pp. 1-10 = English book pp. 3-7)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-intro.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-02-GADAMER** (essay p. p. 53 (III)): Heidegger SS 1924's opening: 'The lecture does not aim at something philosophical. It concerns the understanding of basic concepts in their conceptuality. The aim is philological and is to practice so
    - *Role in essay*: central — establishes the SS 1924 lecture's philological-rhetorical aim
  - **HR-03-MICHALSKI** (essay p. p. 69): Heidegger states the goal of the lecture: 'the understanding of some fundamental concepts of Aristotelian philosophy' to be gained 'by way of the study of the text of the Aristotelian treatises.' Conc
    - *Role in essay*: central — establishes that Heidegger's procedure is concept-centered + text-centered.

### HL-VOL-051 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 28 

- **GA volume**: GA 18
- **Edition/translation noted**: GA 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP1b (§6 (+ surrounds); German GA 18 pp. 24-47 = English book pp. 15-31)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp1b.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-01-GROSS-A** (essay p. 24-25): Parallel German: '"Wenn wir soma mit 'Korper' ubersetzen, so ist zu beachten, dass Korperlichkeit fur den Griechen nicht Stofflichkeit oder Materialitat bedeutet, sondern soma meint eine eigentumliche
    - *Role in essay*: supporting — anti-Cartesian body framing for P5
  - **HR-03-MICHALSKI** (essay p. p. 71): Soma example: Heidegger refines 'body' as not Stofflichkeit/Materialität but 'strange obtrusiveness' of a being (in to son soma, su, soma = 'slave' or 'prisoner') (book p. 71).
    - *Role in essay*: illustrative — example of fundamental-concept refinement.

### HL-VOL-062 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 61 

- **GA volume**: GA 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP2a (§§7–11; German GA 18 pp. 48-80 = English book pp. 32-54)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp2a.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-03-MICHALSKI** (essay p. p. 77; p. 80 (note 22)): Note 22 = 'The concrete instance of the primordiality of seeing is the entire Rhetoric.'
    - *Role in essay*: central — anchors the Rhetoric as primordial instance of the seeing of speech.
  - **HR-05-STRUEVER** (essay p. (implicit through framework)): 'Der konkrete Beleg für die Ursprünglichkeit des Sehens [des Logos] ist die ganze Rhetorik' [implicit via reference to Section A of Bibliography]
    - *Role in essay*: supporting — explicit Logos-Rhetorik connection

### HL-VOL-069 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 104, 123, 169 

- **GA volume**: GA 18
- **Edition/translation noted**: Klostermann 2002
- **Concordance role**: Multi-cited (3 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3a.md`
- **Cited by** (3 citations from 3 distinct contributors):
  - **HR-04-HYDE** (essay p. 95): p. 95 — block citation showing how 'rhetoric (like the call of conscience) demands a hearing from those whom the orator would move with his discourse.'
    - *Role in essay*: Central — supports the call-conscience-as-rhetoric bridge.
  - **HR-06-KISIEL** (essay p. 144, 145, 146): Hearing as component first of rhetor sizing up critical speech-situation (104); not-yet-logos appeal of orexis 'is itself a kind of speech' (105); rhetoric 'first not art but power, dynamis' (114).
    - *Role in essay*: central — three-fold support for equiprimordiality and dynamis-thesis
  - **HR-05-STRUEVER** (essay p. p. 114): 'Das akouein, "Hören," ist die eigentliche aisthesis' (104) — politics-of-hearing claim (P7)
    - *Role in essay*: central — hearing-as-eigentliche-aisthesis

### HL-VOL-076 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 114 

- **GA volume**: GA 18
- **Edition/translation noted**: Gesamtausgabe vol. 18, ed. Mark Michalski (Klostermann 2002)
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3a.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-02-GADAMER** (essay p. p. 49 (II)): The volume's locus classicus on tension VT2: 'Aristotle defined rhetoric (1.2) as *dynamis*. This definition is to be retained even though Aristotle often designates it as *technē*. This designation i
    - *Role in essay*: central — the volume's primary input on the rhetoric-as-dynamis claim
  - **HR-03-MICHALSKI** (essay p. p. 77): On rhetoric as the practical possibility of seeing what speaks for the subject matter for whoever is resolved to convince others of something (book p. 77).
    - *Role in essay*: central — defines the practical-versus-theoretical limit of the rhetoric/philology equation.

### HL-VOL-077 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 117 

- **GA volume**: GA 18
- **Edition/translation noted**: Gesamtausgabe vol. 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3a.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-02-GADAMER** (essay p. p. 55 (IV opening); p. 57 (IV)): Two Kemmann citations from this single page: (i) book p. 55 (n. 16): rhetoric concerns 'speaking as a basic mode of human being, as being with one another.' (ii) book p. 57 (n. 18): 'logos had its gro
    - *Role in essay*: central — the SS 1924 thesis on rhetoric-as-Mitsein-mode and pathē-as-ground-of-logos
  - **HR-01-GROSS-A** (essay p. 11): 'Dass wir die aristotelische Rhetorik haben, ist besser, als wenn wir eine Sprachphilosophie hatten.' [That we have the Aristotelian Rhetoric is better than if we had a philosophy of language.]
    - *Role in essay*: central — Heidegger's most explicit valorization of Rhetoric over philosophy-of-language

### HL-VOL-079 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 122 

- **GA volume**: GA 18
- **Edition/translation noted**: GA 18
- **Concordance role**: Multi-cited (3 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3a.md`
- **Cited by** (3 citations from 3 distinct contributors):
  - **HR-01-GROSS-B** (essay p. p. 27): Heidegger's German formulation of pathē as Befindlichkeit-des-Lebenden, quoted at top of book p. 27 in transitional paragraph: '[Diese pathē, "Affekte" sind nicht Zustände des Seelischen, es handelt s
    - *Role in essay*: central — anchors the Befindlichkeit=pathos identification
  - **HR-04-HYDE** (essay p. 86, 95): Hyde's gloss p. 86: rhetorical speech functions to 'exhort people to an active krisis or decision (122f)' — the Heideggerian active sense of krisis as Entschluss/Entschlossenheit.
    - *Role in essay*: Supporting — krisis/Entschluss bridge.
  - **HR-05-STRUEVER** (essay p. p. 108 (dynamis tou theoresai); p. 113 (whole-person attribution); p. 116 (Affektenlehre on Stoa)): Multiple uses: (i) *dynamis tou theoresai* (1355b26 glossed at GA 18 122) — rhetoric as potential, not technē; (ii) Aristotle's *Rhet.* 2 *pathē* and *Affektenlehre* on Stoa (122); (iii) passions to w
    - *Role in essay*: central — defines rhetoric as dynamis (P3) + locus for Affektenlehre genealogy

### HL-VOL-082 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 125 §: the judge formulating an Ansicht about what has happened

- **GA volume**: GA 18
- **Edition/translation noted**: GA 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3a.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-01-GROSS-B** (essay p. p. 43 (note 28)): Note 28 (book p. 43): 'Heidegger writes "Über das, was geschehen ist, soll sich der Richter eine Ansicht bilden" (125).' [Concerning what has happened, the judge should form an opinion (Ansicht) for h
    - *Role in essay*: supporting — connects doxa-Ansicht to judgment-formation
  - **HR-04-HYDE** (essay p. 95): p. 95 — Heidegger reportedly characterized epideictic speech as 'eine Lobrede' (a eulogy / speech-of-praise).
    - *Role in essay*: Central — pinpoints Heidegger's own brief acknowledgement of epideictic.

### HL-VOL-083 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 127 §: politikē grounds rhetoric; Being-with-one-another in politikē

- **GA volume**: GA 18
- **Edition/translation noted**: GA 18
- **Concordance role**: Multi-cited (3 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3a.md`
- **Cited by** (3 citations from 3 distinct contributors):
  - **HR-01-GROSS-B** (essay p. p. 40): Book p. 40 (English) with German parenthetical: 'without pathos, the community would remain mute: "The determination of Being-with-one-another in politikē founds that which rhetoric brings to language
    - *Role in essay*: central — defining quote for P7 (rhetorical pluralism of 1924)
  - **HR-03-MICHALSKI** (essay p. p. 78; p. 80 (note 23)): Note 23 = paradeigma/enthymema vs. epagoge/syllogismos as parallel forms of speech dealt with by rhetoric and dialectic respectively (book p. 78).
    - *Role in essay*: central — establishes the rhetoric/dialectic distinction that places philology beyond rhetoric in the dialectical direct
  - **HR-05-STRUEVER** (essay p. p. 106 (cf. 134); p. 123): 'Die Ethik gehört in die Politik' — paired with GA 18 134 to articulate ethics-belongs-to-politics vs. rhetoric-INSIDE-politics distinction
    - *Role in essay*: central — paired contrast in Politics First section

### HL-VOL-087 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 134, 138, 145, 149, 151, 152, 153, 161, 162 

- **GA volume**: GA 18
- **Edition/translation noted**: GA 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3a.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-06-KISIEL** (essay p. 147-148): Section V's chain of doxa-citations: doxa as authentic discoveredness (149); negotiating-with-one-another 'capable of revision' (151); change of opinion in state-of-city (161); doxic context out of wh
    - *Role in essay*: central — chain documents the doxa-as-rhetorical-political-substrate thesis
  - **HR-05-STRUEVER** (essay p. p. 106; p. 123 (Section II.4 Politics First; contrast with GA 18 127)): 'Die Rhetorik ist keine auf sich selbst gestellte technē, sondern steht innerhalb der politikē' — central to Position P1 (rhetoric inside politics)
    - *Role in essay*: central — defines rhetoric's disciplinary place

### HL-VOL-088 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 136 §: discussion of doxa as Ja-sagen and Es könnte auch anders sein

- **GA volume**: GA 18
- **Edition/translation noted**: GA 18
- **Concordance role**: Multi-cited (3 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3b (§§15–16; German GA 18 pp. 135-169 = English book pp. 93-115)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3b.md`
- **Cited by** (3 citations from 3 distinct contributors):
  - **HR-01-GROSS-A** (essay p. 11): 'die Philosophen sind die rechten Sophisten' [the philosophers are the real Sophists] — Heidegger's provocative response to Brocker's question mark of disbelief.
    - *Role in essay*: supporting — illustrates Heidegger's polemical anti-philosophy stance in 1924
  - **HR-01-GROSS-B** (essay p. p. 31): Doxa as protolinguistic disposition / nonreflective perspective (Ansicht), characterized by 'Ja-sagen ... kein Untersuchen, Reflektieren' (book p. 31, GA 18 136-137). The structural openness 'Es könnt
    - *Role in essay*: central — establishes doxa-as-pretheoretical disposition (P2)
  - **HR-05-STRUEVER** (essay p. p. 107 (doxa lectures); p. 109 (Aussagen)): 'His lectures on doxa (136–158) are crucial for the account of politics to be derived from discourse.' 'Die doxa ist die Weise, in der wir das Leben in seiner Alltäglichkeit da haben' (138).
    - *Role in essay*: central — Heidegger's doxa-as-Alltäglichkeit reading

### HL-VOL-091 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 149 §: doxa as eigentliche Entdecktheit des Miteinanderseins-in-der-Welt

- **GA volume**: GA 18
- **Edition/translation noted**: GA 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3b (§§15–16; German GA 18 pp. 135-169 = English book pp. 93-115)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3b.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-01-GROSS-B** (essay p. p. 30): 'Heidegger situates pathos in conjunction with doxa, a term usually translated into English as "belief." As Heidegger describes it, doxa reveals authentic being-with-one-another in the world ("Die dox
    - *Role in essay*: central — defining quote for doxa-as-rhetorical-ontology
  - **HR-04-HYDE** (essay p. 85): Quoted in German: 'Die doxa ist die eigentliche Entdecktheit des Miteinanderseins-in-der-Welt.' (Doxa is the authentic discoveredness of being-with-one-another in the world.)
    - *Role in essay*: Central — grounds doxa-Mitsein bridge.

### HL-VOL-095 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 165 

- **GA volume**: GA 18
- **Edition/translation noted**: Gesamtausgabe vol. 18
- **Concordance role**: Multi-cited (3 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3b (§§15–16; German GA 18 pp. 135-169 = English book pp. 93-115)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3b.md`
- **Cited by** (3 citations from 3 distinct contributors):
  - **HR-02-GADAMER** (essay p. p. 60 (IV), n. 27): Heidegger SS 1924: 'The interaction with the pathē is a question of hexis: "Ethos and pathē are constitutive of legein itself."' The hexis-formulation that ties ethos+pathē as constitutive of speech.
    - *Role in essay*: central — the hexis formulation is the operational link from Aristotle Rhet. II to GA 18's hermeneutic-of-Dasein thesis
  - **HR-04-HYDE** (essay p. Note 6): Cited in note 6 list of GA 18 references treated throughout the chapter.
    - *Role in essay*: Background.
  - **HR-06-KISIEL** (essay p. 145): 'Ethos and pathos are constitutive for legein itself' (165); speech finds deepest roots in mood (177).
    - *Role in essay*: central — equiprimordiality of ethos/pathos with logos at level of Befindlichkeit

### HL-VOL-097 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 171 §: Pathos as Umschlagen / Werden zu / hexis

- **GA volume**: GA 18
- **Edition/translation noted**: GA 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3c (§§17–18; German GA 18 pp. 170-205 = English book pp. 116-139)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3c.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-01-GROSS-B** (essay p. p. 35, p. 36 (German verbatim)): Long English-and-German parallel block-quote (book pp. 35-36): English on p. 35: 'Pathos is a sudden change and hence a transformation to ... out of a previous situation, but not a sudden change that 
    - *Role in essay*: central — defining quote for P4 (pathos as Umschlagen)
  - **HR-06-KISIEL** (essay p. 146): In deliberative speech, ethos translates into prohairesis (prechoice); Heidegger's framework: ethos translates into Entschlossenheit manifested in speaker's display of conviction; speaker's resolutene
    - *Role in essay*: central — bridges Aristotelian ethos to Heideggerian resoluteness/Entschlossenheit

### HL-VOL-098 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 177 

- **GA volume**: GA 18
- **Edition/translation noted**: Gesamtausgabe vol. 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3c (§§17–18; German GA 18 pp. 170-205 = English book pp. 116-139)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3c.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-02-GADAMER** (essay p. p. 57 (IV), n. 18): Footnote 18 cites GA 18, 177 for the pathē-as-fundamental-possibilities thesis (alongside GA 18, 117). The cited material connects pathē-doctrine to Dasein's primary orientation.
    - *Role in essay*: supporting — second locus for pathē-as-fundamental-possibilities thesis (with HL7)
  - **HR-03-MICHALSKI** (essay p. p. 67): On Stoic/patristic/Thomist/Lutheran Wirkungsgeschichte of Aristotle's pathē-doctrine — used to show influence, not for augmentation of understanding (book p. 67).
    - *Role in essay*: supporting — anchors the bracketing of effective-history as interpretive aid.

### HL-VOL-099 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 183 §: fear as Unruhe, Verwirrung, Durcheinandergeraten

- **GA volume**: GA 18
- **Edition/translation noted**: GA 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3c (§§17–18; German GA 18 pp. 170-205 = English book pp. 116-139)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3c.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-01-GROSS-B** (essay p. p. 35): Book p. 35: 'And indeed this is precisely how Heidegger describes being overcome by fear: it is fundamentally "unsettling" (Unruhe), "confusing" (Verwirrung), and "mixed-up" (Durcheinandergeraten) (18
    - *Role in essay*: central — phenomenology of fear's Befindlichkeit-character
  - **HR-05-STRUEVER** (essay p. p. 110–111 (Section I.3)): Lectures of June 27 and 30, 1924 (183–199): basic concepts of *Nicomachean Ethics* — *phronēsis* in domain of practical interactivity (180); 'Die Handlung selbst hat ihr telos im kairos' (189); kairos
    - *Role in essay*: central — kairos/phronesis/praxis NE reading

### HL-VOL-103 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 199, 237, 254 

- **GA volume**: GA 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3c (§§17–18; German GA 18 pp. 170-205 = English book pp. 116-139)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3c.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-03-MICHALSKI** (essay p. p. 76): One place where Heidegger criticizes phenomenology — asserting superiority of an Aristotelian insight over a claim of phenomenology (book p. 76).
    - *Role in essay*: supporting — evidence for the limited and oblique role of phenomenology-discourse in SS 1924.
  - **HR-05-STRUEVER** (essay p. p. 113): 'Imagination is the *Boden* of *noein* (199)' — imagination grounds thinking
    - *Role in essay*: central — Boden des noein (P6)

### HL-VOL-124 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 261 §: fear as Befindlichkeit-die-zum-Sprechen-bringt; Unheimlichkeit

- **GA volume**: GA 18
- **Edition/translation noted**: Gesamtausgabe vol. 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3e (§§20–22; German GA 18 pp. 236-267 = English book pp. 161-179)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3e.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-02-GADAMER** (essay p. p. 58 (IV), n. 22): Heidegger SS 1924: 'When we feel uncanny we begin to speak.' Kemmann reads as fear-uncanniness link; Gadamer reads as 'said in slight mockery' but with a genuine residue: 'the avoidance of the uncanny
    - *Role in essay*: central — the fear-as-speech-source thesis is read by Gadamer as both mockery and genuine philosophical claim
  - **HR-01-GROSS-B** (essay p. p. 37): Book p. 37: 'It is thus a critical factor in the formation of human Dasein. (Heidegger describes fear as "diejenige Befindlichkeit, die zum Sprechen bringt" [261].) Indeed the very lack of composure b
    - *Role in essay*: central — defining quote for P3 + P5 (pathos as origin of speech)

### HL-VOL-125 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 262 §: pathē as ground upon which language grows; Sachlichkeit prefigured by pathē

- **GA volume**: GA 18
- **Edition/translation noted**: Gesamtausgabe vol. 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-FP3e (§§20–22; German GA 18 pp. 236-267 = English book pp. 161-179)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-fp3e.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-02-GADAMER** (essay p. p. 57 (IV), n. 19): Heidegger on the pathē-context for speaking: 'The possibility to speak about things is first presented within the so-characterized attunement [Sich-Befindens] and being-in-the-world, to the extent tha
    - *Role in essay*: central — defines Sich-Befinden as the pre-linguistic ground of speaking
  - **HR-01-GROSS-B** (essay p. p. 38 (both English and German)): Long block-quote, book p. 38 (English) and same page (German verbatim): English: 'In what follows we will come to understand how fear and the pathē stand in relation to logos, insofar as logos is take
    - *Role in essay*: central — Heidegger's definitive statement of the pathos-as-ground-of-logos thesis (P1 + P5 + P10)

### HL-VOL-126 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 284 

- **GA volume**: GA 18
- **Edition/translation noted**: GA 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-SP1 (§§23–24; German GA 18 pp. 268-298 = English book pp. 183-191)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-sp1.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-01-GROSS-A** (essay p. 13): Citation for Aristotle Physics-grounded ontology of all Being: 'The shared ontology of all Being, claims Heidegger, is grounded in the categories of Aristotle's Physics (284).'
    - *Role in essay*: central — anchors P5 (pathos as Naturwissenschaft/Geisteswissenschaft transfer point)
  - **HR-05-STRUEVER** (essay p. p. 106; p. 108 (Section I.2)): 'Heidegger's *Rhetoric*'s account of political life as movement to gloss the *Physics*, with its account of nature as the principle of motion and change, *archē kinēseōs kai metabolēs* (200b12, GA 18 
    - *Role in essay*: central — bridges Aristotle Physics III to BT temporality

### HL-VOL-129 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 289 

- **GA volume**: GA 18
- **Edition/translation noted**: Gesamtausgabe vol. 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-SP1 (§§23–24; German GA 18 pp. 268-298 = English book pp. 183-191)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-sp1.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-02-GADAMER** (essay p. p. 57 (IV), n. 20): Heidegger on Greek ontology's pathos-origin: 'Greek ontology also took its beginning from a pathos. The discussion of the being of beings out of a fear that it will at some point no longer be.' This i
    - *Role in essay*: central — establishes that pathos-as-ground extends to ontology itself, not merely to rhetoric
  - **HR-03-MICHALSKI** (essay p. p. 75): Aristotelian theory as state of being composed (Gefasstsein) against pathos of fear: that what is constantly there [das Immerseiende] could perhaps cease to be (book p. 75).
    - *Role in essay*: central — anchors theoretical-attunement parallel between Aristotle and Heidegger.

### HL-VOL-140 — *GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924)* — p./§: 358, 276 

- **GA volume**: GA 18
- **Concordance role**: Multi-cited (2 distinct contributors) — flagged for dissertation cross-reference
- **Bridge target**: BCAP pipeline → U-SP2b (§§27–28; German GA 18 pp. 351-379 = English book pp. 213-222)
- **Bridge path**: `corpus/index/Heidegger - Basic Concepts of Aristotelian Philosophy/bcap-analysis/phase2-u-sp2b.md`
- **Cited by** (2 citations from 2 distinct contributors):
  - **HR-03-MICHALSKI** (essay p. p. 77; p. 80 (note 21)): Note 21 = 'The being of this dominance lies in logos' (GA 18 358). 'The dominance of the interpretedness has the logos. The logos is the authentic bearer of interpretedness' (GA 18 276).
    - *Role in essay*: central — anchors logos as bearer of interpretedness, the link between hermeneutic phenomenology and philology.
  - **HR-05-STRUEVER** (essay p. p. 109): Phobos as 'already there' (276) as *Boden*, 'ground' — phobos's ontological priority
    - *Role in essay*: supporting — phobos as Boden


## Single-cited Loci

Loci cited by only one contributor are listed by GA volume below in compact form. Each is still bridged to a pipeline unit where possible; flagged for dissertation use only when topically relevant.

### GA 2

- **HL-VOL-001** — Being and Time (Sein und Zeit, GA 2) — p./§: — / implicit → HR-02-GADAMER (essay p. p. 57, p. 58, p. 59 (IV)). Bridge: BT pipeline → unit unresolved (no specific H-page or § parsed)
- **HL-VOL-002** — Being and Time (Sein und Zeit, GA 2) — p./§: — / discussion of being-in-space in Division I → HR-01-GROSS-A (essay p. 13). Bridge: BT pipeline → unit unresolved (no specific H-page or § parsed)
- **HL-VOL-005** — Being and Time (Sein und Zeit, GA 2) — p./§: — / BT footnote on Aristotle's Rhetoric as 'first systematic hermeneutic of everydayness of Being-with-one-another' → HR-01-GROSS-B (essay p. p. 27, p. 41 (note 2)). Bridge: BT pipeline → unit unresolved (no specific H-page or § parsed)
- **HL-VOL-006** — Being and Time (Sein und Zeit, GA 2) — p./§: — / Heidegger's own explicit reference for SS 1924 protomethodology → HR-01-GROSS-B (essay p. p. 41 (note 5)). Bridge: BT pipeline → unit unresolved (no specific H-page or § parsed)
- **HL-VOL-012** — Being and Time (Sein und Zeit, GA 2) — p./§: — / §§7-8 (preparatory) → HR-04-HYDE (essay p. Note 23). Bridge: BT pipeline → BT-Intro-U2 (§§5–8, H.40-Introduction Part 2 (dissertation-critical))
- **HL-VOL-013** — Being and Time (Sein und Zeit, GA 2) — p./§: — / (closing of Division II) → HR-04-HYDE (essay p. Note 3). Bridge: BT pipeline → unit unresolved (no specific H-page or § parsed)
- **HL-VOL-014** — Being and Time (Sein und Zeit, GA 2) — p./§: 85 → HR-06-KISIEL (essay p. 133). Bridge: BT pipeline → BT-D1-U2 (§§14–18, H.63-88)

### GA 5

- **HL-VOL-015** — Der Ursprung des Kunstwerkes (Holzwege, GA 5) — p./§: — → HR-06-KISIEL (essay p. 136). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 5/13

- **HL-VOL-016** — Poetry, Language, Thought (Hofstadter translation, contains "Building Dwelling Thinking" / "Origin of the Work of Art" / "The Thinker as Poet") — p./§: — / Heidegger on poetic speech / 'poetic speech acts' → HR-01-GROSS-B (essay p. p. 44 (notes 42, 43)). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-017** — Poetry, Language, Thought (Hofstadter translation, contains "Building Dwelling Thinking" / "Origin of the Work of Art" / "The Thinker as Poet") — p./§: 62-74 → HR-04-HYDE (essay p. 96, Note 31). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 6.1

- **HL-VOL-018** — Nietzsche Volume I (1936–39 lectures, GA 6.1 / Neske 1961) — p./§: — / the long passage on Affect/Passion and great will / great passion → HR-01-GROSS-B (essay p. p. 39, p. 45 (note 49)). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 7

- **HL-VOL-019** — The Question Concerning Technology and Other Essays (GA 7) — p./§: 10-11 → HR-04-HYDE (essay p. 96, Note 31). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 8 (Niemeyer 1954)

- **HL-VOL-020** — What Is Called Thinking? (Was heißt Denken?, WS 1951/52) — p./§: 113-147 → HR-04-HYDE (essay p. Note 46). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 9

- **HL-VOL-021** — Letter on Humanism (Brief über den Humanismus, GA 9 Wegmarken) — p./§: — → HR-01-GROSS-A (essay p. 19). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-022** — Letter on Humanism (Brief über den Humanismus, GA 9 Wegmarken) — p./§: — / Letter on Humanism's distancing from rhetoric / political philosophy → HR-01-GROSS-B (essay p. p. 42 (note 13), p. 44 (notes 39, 40)). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-023** — Letter on Humanism (Brief über den Humanismus, GA 9 Wegmarken) — p./§: 145ff / first sentence + animal rationale section → HR-07-POGGELER (essay p. 170, 171). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-024** — Letter on Humanism (Brief über den Humanismus, GA 9 Wegmarken) — p./§: 210 → HR-04-HYDE (essay p. 96, Note 30). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-025** — Vom Wesen der Wahrheit (1930 lecture, GA 9 Wegmarken) — p./§: — → HR-06-KISIEL (essay p. 133). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-026** — Vom Wesen des Grundes (1929 Husserl Festschrift, GA 9 Wegmarken) — p./§: — → HR-07-POGGELER (essay p. 161). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-027** — Wegmarken (GA 9) — p./§: — → HR-07-POGGELER (essay p. 171). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 10

- **HL-VOL-028** — Der Satz vom Grund (GA 10, WS 1955/56) — p./§: — → HR-07-POGGELER (essay p. 161). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 12

- **HL-VOL-029** — Die Sprache (1950, GA 12) — p./§: 32 (Neske) → HR-02-GADAMER (essay p. p. 55 (IV opening), n. 17). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-030** — Georg Trakl essay (GA 12) — p./§: 37 → HR-07-POGGELER (essay p. 171, 172). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-031** — On the Way to Language (Unterwegs zur Sprache, GA 12) — p./§: 57-136 → HR-04-HYDE (essay p. 92, Note 23). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-032** — Sprache/Language (1959, GA 12) — p./§: — / essay 'Language' (1959) → HR-01-GROSS-A (essay p. 21-23). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 13

- **HL-VOL-033** — Aus der Erfahrung des Denkens (1947, GA 13) — p./§: 75ff → HR-07-POGGELER (essay p. 161). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 16

- **HL-VOL-034** — Rectoral Address 1933 ("Die Selbstbehauptung der deutschen Universität") — p./§: — / Heidegger's 1933 speeches/writings — withdrawal-from-League-of-Nations rhetoric, German Führer adherence → HR-01-GROSS-B (essay p. p. 39, p. 40). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-035** — Rectoral greeting to German Students! WS 1933/34 (GA 16) — p./§: 184 → HR-06-KISIEL (essay p. 151). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-036** — Schlageter speech 26 May 1933 (GA 16) — p./§: 759f → HR-06-KISIEL (essay p. 135). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 17

- **HL-VOL-037** — GA 17 (Einführung in die phänomenologische Forschung, WS 1923/24) — p./§: — / Heidegger's first Marburg lecture course on origins of modern philosophy (1923/24 WS) → HR-07-POGGELER (essay p. 166). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 18

- **HL-VOL-038** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: — / SS 1924; Pöggeler's only direct reference in n. 28; no specific pages cited → HR-07-POGGELER (essay p. 166, 167, 169, 170). Bridge: BCAP pipeline → unit unresolved (no specific GA 18 page; cite holistically)
- **HL-VOL-040** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 4, 333 → HR-03-MICHALSKI (essay p. p. 66 (text), p. 78 (note 1)). Bridge: BCAP pipeline → U-INTRO (§§1–2; German GA 18 pp. 1-10 = English book pp. 3-7)
- **HL-VOL-041** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 5, 333f → HR-03-MICHALSKI (essay p. p. 68 (text), p. 79 (note 5); also p. 73 (text), p. 79 (note 15) for six presuppositions). Bridge: BCAP pipeline → U-INTRO (§§1–2; German GA 18 pp. 1-10 = English book pp. 3-7)
- **HL-VOL-042** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 6 → HR-03-MICHALSKI (essay p. p. 73; p. 79 (note 14)). Bridge: BCAP pipeline → U-INTRO (§§1–2; German GA 18 pp. 1-10 = English book pp. 3-7)
- **HL-VOL-043** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 7 → HR-03-MICHALSKI (essay p. p. 78). Bridge: BCAP pipeline → U-INTRO (§§1–2; German GA 18 pp. 1-10 = English book pp. 3-7)
- **HL-VOL-044** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 9f, 15f, 335f → HR-03-MICHALSKI (essay p. p. 67). Bridge: BCAP pipeline → U-INTRO (§§1–2; German GA 18 pp. 1-10 = English book pp. 3-7)
- **HL-VOL-045** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 12 → HR-03-MICHALSKI (essay p. p. 70-71). Bridge: BCAP pipeline → U-FP1a (§§3–5; German GA 18 pp. 11-23 = English book pp. 9-14)
- **HL-VOL-046** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 13f, 270f, 338f, 354f → HR-03-MICHALSKI (essay p. p. 76-77). Bridge: BCAP pipeline → U-FP1a (§§3–5; German GA 18 pp. 11-23 = English book pp. 9-14)
- **HL-VOL-047** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 14, 339 → HR-03-MICHALSKI (essay p. p. 74; p. 79 (note 16)). Bridge: BCAP pipeline → U-FP1a (§§3–5; German GA 18 pp. 11-23 = English book pp. 9-14)
- **HL-VOL-048** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 17, 19f, 104f, 123f, 212, 216f, 276f, 304, 341, 358 → HR-03-MICHALSKI (essay p. p. 75-76). Bridge: BCAP pipeline → U-FP1a (§§3–5; German GA 18 pp. 11-23 = English book pp. 9-14)
- **HL-VOL-049** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: [GA 18 page corresponding to footnoted Heidegger gloss; Hyde gives English-only paraphrase] → HR-04-HYDE (essay p. 85, Note 10). Bridge: BCAP pipeline → U-FP1a (§§3–5; German GA 18 pp. 11-23 = English book pp. 9-14)
- **HL-VOL-050** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 25, 40 → HR-03-MICHALSKI (essay p. p. 71). Bridge: BCAP pipeline → U-FP1b (§6 (+ surrounds); German GA 18 pp. 24-47 = English book pp. 15-31)
- **HL-VOL-052** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 32 → HR-03-MICHALSKI (essay p. p. 71). Bridge: BCAP pipeline → U-FP1b (§6 (+ surrounds); German GA 18 pp. 24-47 = English book pp. 15-31)
- **HL-VOL-053** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 33 → HR-01-GROSS-A (essay p. 25). Bridge: BCAP pipeline → U-FP1b (§6 (+ surrounds); German GA 18 pp. 24-47 = English book pp. 15-31)
- **HL-VOL-054** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 35 → HR-01-GROSS-A (essay p. 8). Bridge: BCAP pipeline → U-FP1b (§6 (+ surrounds); German GA 18 pp. 24-47 = English book pp. 15-31)
- **HL-VOL-055** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 37 → HR-01-GROSS-A (essay p. 6). Bridge: BCAP pipeline → U-FP1b (§6 (+ surrounds); German GA 18 pp. 24-47 = English book pp. 15-31)
- **HL-VOL-056** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 39 → HR-03-MICHALSKI (essay p. p. 71; p. 79 (note 11)). Bridge: BCAP pipeline → U-FP1b (§6 (+ surrounds); German GA 18 pp. 24-47 = English book pp. 15-31)
- **HL-VOL-057** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 44 → HR-06-KISIEL (essay p. 141). Bridge: BCAP pipeline → U-FP1b (§6 (+ surrounds); German GA 18 pp. 24-47 = English book pp. 15-31)
- **HL-VOL-058** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 45f, 122f, 241 → HR-06-KISIEL (essay p. 132). Bridge: BCAP pipeline → U-FP1b (§6 (+ surrounds); German GA 18 pp. 24-47 = English book pp. 15-31)
- **HL-VOL-059** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 52 → HR-03-MICHALSKI (essay p. p. 71). Bridge: BCAP pipeline → U-FP2a (§§7–11; German GA 18 pp. 48-80 = English book pp. 32-54)
- **HL-VOL-060** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 55f, 63f → HR-03-MICHALSKI (essay p. p. 76). Bridge: BCAP pipeline → U-FP2a (§§7–11; German GA 18 pp. 48-80 = English book pp. 32-54)
- **HL-VOL-061** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 59 → HR-05-STRUEVER (essay p. p. 110; p. 125 (citing 59 again)). Bridge: BCAP pipeline → U-FP2a (§§7–11; German GA 18 pp. 48-80 = English book pp. 32-54)
- **HL-VOL-063** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 64, 73 → HR-06-KISIEL (essay p. 141-142). Bridge: BCAP pipeline → U-FP2a (§§7–11; German GA 18 pp. 48-80 = English book pp. 32-54)
- **HL-VOL-064** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 66 → HR-03-MICHALSKI (essay p. p. 69). Bridge: BCAP pipeline → U-FP2a (§§7–11; German GA 18 pp. 48-80 = English book pp. 32-54)
- **HL-VOL-065** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 68, 165 → HR-06-KISIEL (essay p. 145). Bridge: BCAP pipeline → U-FP2a (§§7–11; German GA 18 pp. 48-80 = English book pp. 32-54)
- **HL-VOL-066** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 70 → HR-03-MICHALSKI (essay p. p. 71; p. 79 (note 12)). Bridge: BCAP pipeline → U-FP2a (§§7–11; German GA 18 pp. 48-80 = English book pp. 32-54)
- **HL-VOL-067** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 83 → HR-03-MICHALSKI (essay p. p. 71). Bridge: BCAP pipeline → U-FP2b (§§11–12; German GA 18 pp. 81-102 = English book pp. 55-70)
- **HL-VOL-068** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 95-107 → HR-04-HYDE (essay p. 89). Bridge: BCAP pipeline → U-FP2b (§§11–12; German GA 18 pp. 81-102 = English book pp. 55-70)
- **HL-VOL-070** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 105 → HR-05-STRUEVER (essay p. p. 105–106). Bridge: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **HL-VOL-071** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 107, 296, 367f → HR-03-MICHALSKI (essay p. p. 69; p. 79 (note 13)). Bridge: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **HL-VOL-072** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 108 → HR-01-GROSS-A (essay p. 22). Bridge: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **HL-VOL-073** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 109 → HR-03-MICHALSKI (essay p. p. 68). Bridge: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **HL-VOL-075** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 113f, 345 → HR-03-MICHALSKI (essay p. p. 69). Bridge: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **HL-VOL-078** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 118 → HR-02-GADAMER (essay p. p. 60 (IV), n. 29). Bridge: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **HL-VOL-080** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 123 → HR-05-STRUEVER (essay p. p. 114). Bridge: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **HL-VOL-081** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 124-125 → HR-01-GROSS-A (essay p. 11). Bridge: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **HL-VOL-084** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 128 → HR-04-HYDE (essay p. 89). Bridge: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **HL-VOL-085** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 130f → HR-06-KISIEL (essay p. 147). Bridge: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **HL-VOL-086** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 131 → HR-05-STRUEVER (essay p. p. 110 (Section I.3)). Bridge: BCAP pipeline → U-FP3a (§§13–14; German GA 18 pp. 103-134 = English book pp. 71-92)
- **HL-VOL-089** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 137 → HR-04-HYDE (essay p. GA-18 background citations). Bridge: BCAP pipeline → U-FP3b (§§15–16; German GA 18 pp. 135-169 = English book pp. 93-115)
- **HL-VOL-090** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 146f → HR-04-HYDE (essay p. 89). Bridge: BCAP pipeline → U-FP3b (§§15–16; German GA 18 pp. 135-169 = English book pp. 93-115)
- **HL-VOL-092** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 151 / doxa as Boden, Quelle und Antrieb für das Miteinanderreden → HR-01-GROSS-B (essay p. p. 31, p. 32 (German verbatim)). Bridge: BCAP pipeline → U-FP3b (§§15–16; German GA 18 pp. 135-169 = English book pp. 93-115)
- **HL-VOL-093** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 155 → HR-05-STRUEVER (essay p. p. 110). Bridge: BCAP pipeline → U-FP3b (§§15–16; German GA 18 pp. 135-169 = English book pp. 93-115)
- **HL-VOL-094** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 163 → HR-04-HYDE (essay p. 84). Bridge: BCAP pipeline → U-FP3b (§§15–16; German GA 18 pp. 135-169 = English book pp. 93-115)
- **HL-VOL-100** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 184–185 → HR-05-STRUEVER (essay p. p. 111–112). Bridge: BCAP pipeline → U-FP3c (§§17–18; German GA 18 pp. 170-205 = English book pp. 116-139)
- **HL-VOL-101** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 194 → HR-05-STRUEVER (essay p. p. 111). Bridge: BCAP pipeline → U-FP3c (§§17–18; German GA 18 pp. 170-205 = English book pp. 116-139)
- **HL-VOL-102** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 195 → HR-05-STRUEVER (essay p. p. 106; p. 111 (hexis/dynamis); p. 126 (oscillation between potency/act)). Bridge: BCAP pipeline → U-FP3c (§§17–18; German GA 18 pp. 170-205 = English book pp. 116-139)
- **HL-VOL-104** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 201 → HR-05-STRUEVER (essay p. p. 111). Bridge: BCAP pipeline → U-FP3c (§§17–18; German GA 18 pp. 170-205 = English book pp. 116-139)
- **HL-VOL-105** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 202 → HR-05-STRUEVER (essay p. p. 113). Bridge: BCAP pipeline → U-FP3c (§§17–18; German GA 18 pp. 170-205 = English book pp. 116-139)
- **HL-VOL-106** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 203 → HR-02-GADAMER (essay p. p. 59 (IV), n. 25). Bridge: BCAP pipeline → U-FP3c (§§17–18; German GA 18 pp. 170-205 = English book pp. 116-139)
- **HL-VOL-107** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 205 → HR-01-GROSS-A (essay p. 25). Bridge: BCAP pipeline → U-FP3c (§§17–18; German GA 18 pp. 170-205 = English book pp. 116-139)
- **HL-VOL-108** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 206-207 → HR-01-GROSS-A (essay p. 26-27). Bridge: BCAP pipeline → U-FP3d (§19; German GA 18 pp. 206-235 = English book pp. 140-160)
- **HL-VOL-109** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 207–219 → HR-05-STRUEVER (essay p. p. 106; p. 113 (life capacities as continuum 194–219)). Bridge: BCAP pipeline → U-FP3d (§19; German GA 18 pp. 206-235 = English book pp. 140-160)
- **HL-VOL-110** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 216, 237 → HR-03-MICHALSKI (essay p. p. 69). Bridge: BCAP pipeline → U-FP3d (§19; German GA 18 pp. 206-235 = English book pp. 140-160)
- **HL-VOL-111** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 217, 276f → HR-03-MICHALSKI (essay p. p. 76; p. 79 (note 19)). Bridge: BCAP pipeline → U-FP3d (§19; German GA 18 pp. 206-235 = English book pp. 140-160)
- **HL-VOL-112** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 222, 226f → HR-03-MICHALSKI (essay p. p. 70). Bridge: BCAP pipeline → U-FP3d (§19; German GA 18 pp. 206-235 = English book pp. 140-160)
- **HL-VOL-113** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 226 → HR-01-GROSS-A (essay p. 13). Bridge: BCAP pipeline → U-FP3d (§19; German GA 18 pp. 206-235 = English book pp. 140-160)
- **HL-VOL-114** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 232 → HR-05-STRUEVER (essay p. p. 109). Bridge: BCAP pipeline → U-FP3d (§19; German GA 18 pp. 206-235 = English book pp. 140-160)
- **HL-VOL-115** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 233 → HR-01-GROSS-A (essay p. 14). Bridge: BCAP pipeline → U-FP3d (§19; German GA 18 pp. 206-235 = English book pp. 140-160)
- **HL-VOL-116** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 234f → HR-03-MICHALSKI (essay p. p. 69 (note ref); p. 78 (note 7)). Bridge: BCAP pipeline → U-FP3d (§19; German GA 18 pp. 206-235 = English book pp. 140-160)
- **HL-VOL-117** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 240-242 → HR-01-GROSS-A (essay p. 15-17). Bridge: BCAP pipeline → U-FP3e (§§20–22; German GA 18 pp. 236-267 = English book pp. 161-179)
- **HL-VOL-118** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 241 → HR-05-STRUEVER (essay p. p. 106). Bridge: BCAP pipeline → U-FP3e (§§20–22; German GA 18 pp. 236-267 = English book pp. 161-179)
- **HL-VOL-119** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 246–263 → HR-05-STRUEVER (essay p. p. 109 (Section I.2); p. 114 (phoberoi)). Bridge: BCAP pipeline → U-FP3e (§§20–22; German GA 18 pp. 236-267 = English book pp. 161-179)
- **HL-VOL-120** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 253 / fear as Möglichkeit / das Möglichsein → HR-01-GROSS-B (essay p. p. 37). Bridge: BCAP pipeline → U-FP3e (§§20–22; German GA 18 pp. 236-267 = English book pp. 161-179)
- **HL-VOL-121** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 256-257 / Aristotle Rhetoric II.5 typology of nine kinds of fearsome people in three categories → HR-01-GROSS-B (essay p. p. 36, p. 37). Bridge: BCAP pipeline → U-FP3e (§§20–22; German GA 18 pp. 236-267 = English book pp. 161-179)
- **HL-VOL-122** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 257 / Zurückhaltenden und Ironischen as most fearsome → HR-01-GROSS-B (essay p. p. 37). Bridge: BCAP pipeline → U-FP3e (§§20–22; German GA 18 pp. 236-267 = English book pp. 161-179)
- **HL-VOL-123** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 259 / Dafürsein, Glauben — Being-there-for → HR-01-GROSS-B (essay p. p. 36). Bridge: BCAP pipeline → U-FP3e (§§20–22; German GA 18 pp. 236-267 = English book pp. 161-179)
- **HL-VOL-127** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 286–287 → HR-05-STRUEVER (essay p. p. 108 (Section I.2 opening); p. 109). Bridge: BCAP pipeline → U-SP1 (§§23–24; German GA 18 pp. 268-298 = English book pp. 183-191)
- **HL-VOL-128** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 288 → HR-01-GROSS-A (essay p. 21). Bridge: BCAP pipeline → U-SP1 (§§23–24; German GA 18 pp. 268-298 = English book pp. 183-191)
- **HL-VOL-130** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 295 → HR-03-MICHALSKI (essay p. p. 70). Bridge: BCAP pipeline → U-SP1 (§§23–24; German GA 18 pp. 268-298 = English book pp. 183-191)
- **HL-VOL-131** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 299 → HR-03-MICHALSKI (essay p. p. 68). Bridge: BCAP pipeline → U-SP2a (§§25–26; German GA 18 pp. 299-350 = English book pp. 192-212)
- **HL-VOL-132** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 317–318 → HR-05-STRUEVER (essay p. p. 112). Bridge: BCAP pipeline → U-SP2a (§§25–26; German GA 18 pp. 299-350 = English book pp. 192-212)
- **HL-VOL-133** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 319, 369, 376, 381, 386, 394 → HR-03-MICHALSKI (essay p. p. 67). Bridge: BCAP pipeline → U-SP2a (§§25–26; German GA 18 pp. 299-350 = English book pp. 192-212)
- **HL-VOL-134** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 322 → HR-01-GROSS-A (essay p. 20-21). Bridge: BCAP pipeline → U-SP2a (§§25–26; German GA 18 pp. 299-350 = English book pp. 192-212)
- **HL-VOL-135** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 324 → HR-05-STRUEVER (essay p. p. 118). Bridge: BCAP pipeline → U-SP2a (§§25–26; German GA 18 pp. 299-350 = English book pp. 192-212)
- **HL-VOL-136** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 326 / (final lecture, last day of July 1924) → HR-01-GROSS-A (essay p. 13). Bridge: BCAP pipeline → U-SP2a (§§25–26; German GA 18 pp. 299-350 = English book pp. 192-212)
- **HL-VOL-137** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 329 / (very last utterance of SS 1924) → HR-01-GROSS-A (essay p. 23). Bridge: BCAP pipeline → U-SP2a (§§25–26; German GA 18 pp. 299-350 = English book pp. 192-212)
- **HL-VOL-138** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 333 → HR-03-MICHALSKI (essay p. p. 74-75; p. 79 (note 18)). Bridge: BCAP pipeline → U-SP2a (§§25–26; German GA 18 pp. 299-350 = English book pp. 192-212)
- **HL-VOL-139** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 339 → HR-03-MICHALSKI (essay p. p. 74; p. 79 (note 17)). Bridge: BCAP pipeline → U-SP2a (§§25–26; German GA 18 pp. 299-350 = English book pp. 192-212)
- **HL-VOL-141** — GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 1924) — p./§: 368 → HR-03-MICHALSKI (essay p. p. 72; p. 79 (note 13)). Bridge: BCAP pipeline → U-SP2b (§§27–28; German GA 18 pp. 351-379 = English book pp. 213-222)

### GA 19

- **HL-VOL-142** — GA 19 (Plato: Sophistes, WS 1924/25) — p./§: — / WS 1924/25 lecture course → HR-07-POGGELER (essay p. 166). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-143** — GA 19 (Plato: Sophistes, WS 1924/25) — p./§: 214-244 → HR-04-HYDE (essay p. Note 5). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 19 / GA 22

- **HL-VOL-144** — GA 19 / GA 22 (combined citation) — p./§: — → HR-04-HYDE (essay p. 91, Note 21). Bridge: BT pipeline → unit unresolved (no specific H-page or § parsed)

### GA 20

- **HL-VOL-145** — GA 20 (Prolegomena zur Geschichte des Zeitbegriffs, SS 1925) — p./§: 264, 264–265, 305, 321, 156 → HR-05-STRUEVER (essay p. p. 122 (Section II.3.C)). Bridge: BT pipeline → BT-D2-U1 (§§45–53, H.231-267)

### GA 26

- **HL-VOL-146** — GA 26 (Metaphysische Anfangsgründe der Logik, SS 1928) — p./§: — / Scheler obituary → HR-02-GADAMER (essay p. p. 52, n. 9). Bridge: BT pipeline → unit unresolved (no specific H-page or § parsed)

### GA 29/30

- **HL-VOL-147** — GA 29/30 (Die Grundbegriffe der Metaphysik, WS 1929/30) — p./§: 244 → HR-06-KISIEL (essay p. 147 (note 7)). Bridge: BT pipeline → BT-D2-U1 (§§45–53, H.231-267)

### GA 33

- **HL-VOL-148** — GA 33 (Aristoteles Metaphysik Theta 1–3, SS 1931) — p./§: 137f → HR-07-POGGELER (essay p. 170). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 36/37

- **HL-VOL-149** — "Über Wesen und Begriff von Natur, Geschichte und Staat" (WS 1933/34 seminar) — p./§: — → HR-06-KISIEL (essay p. 149-150). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 39

- **HL-VOL-150** — GA 39 (Hölderlins Hymnen "Germanien" und "Der Rhein", WS 1934/35) — p./§: 214, 51, 73 → HR-06-KISIEL (essay p. 152). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 53

- **HL-VOL-151** — GA 53 (Hölderlins Hymne "Der Ister", SS 1942) — p./§: 98f, 102 → HR-06-KISIEL (essay p. 152). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 56/57

- **HL-VOL-152** — GA 56/57 (Die Idee der Philosophie, KNS 1919) — p./§: — / Kriegsnotsemester 1919 → HR-07-POGGELER (essay p. 165). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 60

- **HL-VOL-153** — GA 60 (Einleitung in die Phänomenologie der Religion, WS 1920/21) — p./§: — / Wintersemester 1920/21 → HR-07-POGGELER (essay p. 165). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 62 Anhang / Dilthey-Jahrbuch 6

- **HL-VOL-154** — Natorp Report (Phänomenologische Interpretationen zu Aristoteles, 1922) — p./§: — → HR-03-MICHALSKI (essay p. p. 76). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-155** — Natorp Report (Phänomenologische Interpretationen zu Aristoteles, 1922) — p./§: — / 1922 Natorp-Bericht → HR-07-POGGELER (essay p. 165, 166). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-156** — Natorp Report (Phänomenologische Interpretationen zu Aristoteles, 1922) — p./§: 237-269 (the whole essay) / 1922 'Natorp Report' → HR-02-GADAMER (essay p. p. 47, n. 1). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 63

- **HL-VOL-157** — GA 63 (Ontologie. Hermeneutik der Faktizität, SS 1923) — p./§: 327 → HR-02-GADAMER (essay p. p. 53 (III)). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-158** — GA 63 (Ontologie. Hermeneutik der Faktizität, SS 1923) — p./§: 329 → HR-02-GADAMER (essay p. p. 53 (III)). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 80

- **HL-VOL-159** — GA 80 ("Dasein und Wahrsein nach Aristoteles", Köln Kant-Gesellschaft Dec 1924) — p./§: — → HR-06-KISIEL (essay p. 132, 133). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### GA 89

- **HL-VOL-160** — Zollikon Seminars (GA 89) — p./§: 215 → HR-04-HYDE (essay p. 92, Note 25). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

### (unspecified)

- **HL-VOL-161** — Aufenthalte / Sojourns (1962 prose, Klostermann) — p./§: — → HR-07-POGGELER (essay p. 171). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)
- **HL-VOL-162** — Heidegger letter to Pöggeler, 12 Dec 1958 (unpublished correspondence) — p./§: — → HR-07-POGGELER (essay p. 162). Bridge: no existing pipeline unit (Heidegger work outside BCAP/BT pipeline scope)

---

## Locus Counts by Heidegger Text

| Heidegger text | GA vol | Loci | Multi-cited | Pillars |
|---|---|---|---|---|
| "Über Wesen und Begriff von Natur, Geschichte und Staat" (WS | GA 36/37 | 1 | 0 | 0 |
| Aufenthalte / Sojourns (1962 prose, Klostermann) | — | 1 | 0 | 0 |
| Aus der Erfahrung des Denkens (1947, GA 13) | GA 13 | 1 | 0 | 0 |
| Being and Time (Sein und Zeit, GA 2) | GA 2 | 14 | 7 | 2 |
| Der Satz vom Grund (GA 10, WS 1955/56) | GA 10 | 1 | 0 | 0 |
| Der Ursprung des Kunstwerkes (Holzwege, GA 5) | GA 5 | 1 | 0 | 0 |
| Die Sprache (1950, GA 12) | GA 12 | 1 | 0 | 0 |
| GA 17 (Einführung in die phänomenologische Forschung, WS 192 | GA 17 | 1 | 0 | 0 |
| GA 18 (Grundbegriffe der aristotelischen Philosophie, SS 192 | GA 18 | 104 | 24 | 2 |
| GA 19 (Plato: Sophistes, WS 1924/25) | GA 19 | 2 | 0 | 0 |
| GA 19 / GA 22 (combined citation) | GA 19 / GA 22 | 1 | 0 | 0 |
| GA 20 (Prolegomena zur Geschichte des Zeitbegriffs, SS 1925) | GA 20 | 1 | 0 | 0 |
| GA 26 (Metaphysische Anfangsgründe der Logik, SS 1928) | GA 26 | 1 | 0 | 0 |
| GA 29/30 (Die Grundbegriffe der Metaphysik, WS 1929/30) | GA 29/30 | 1 | 0 | 0 |
| GA 33 (Aristoteles Metaphysik Theta 1–3, SS 1931) | GA 33 | 1 | 0 | 0 |
| GA 39 (Hölderlins Hymnen "Germanien" und "Der Rhein", WS 193 | GA 39 | 1 | 0 | 0 |
| GA 53 (Hölderlins Hymne "Der Ister", SS 1942) | GA 53 | 1 | 0 | 0 |
| GA 56/57 (Die Idee der Philosophie, KNS 1919) | GA 56/57 | 1 | 0 | 0 |
| GA 60 (Einleitung in die Phänomenologie der Religion, WS 192 | GA 60 | 1 | 0 | 0 |
| GA 63 (Ontologie. Hermeneutik der Faktizität, SS 1923) | GA 63 | 2 | 0 | 0 |
| GA 80 ("Dasein und Wahrsein nach Aristoteles", Köln Kant-Ges | GA 80 | 1 | 0 | 0 |
| Georg Trakl essay (GA 12) | GA 12 | 1 | 0 | 0 |
| Heidegger letter to Pöggeler, 12 Dec 1958 (unpublished corre | — | 1 | 0 | 0 |
| Letter on Humanism (Brief über den Humanismus, GA 9 Wegmarke | GA 9 | 4 | 0 | 0 |
| Natorp Report (Phänomenologische Interpretationen zu Aristot | GA 62 Anhang / Dilthey-Jahrbuch 6 | 3 | 0 | 0 |
| Nietzsche Volume I (1936–39 lectures, GA 6.1 / Neske 1961) | GA 6.1 | 1 | 0 | 0 |
| On the Way to Language (Unterwegs zur Sprache, GA 12) | GA 12 | 1 | 0 | 0 |
| Poetry, Language, Thought (Hofstadter translation, contains  | GA 5/13 | 2 | 0 | 0 |
| Rectoral Address 1933 ("Die Selbstbehauptung der deutschen U | GA 16 | 1 | 0 | 0 |
| Rectoral greeting to German Students! WS 1933/34 (GA 16) | GA 16 | 1 | 0 | 0 |
| Schlageter speech 26 May 1933 (GA 16) | GA 16 | 1 | 0 | 0 |
| Sprache/Language (1959, GA 12) | GA 12 | 1 | 0 | 0 |
| The Question Concerning Technology and Other Essays (GA 7) | GA 7 | 1 | 0 | 0 |
| Vom Wesen der Wahrheit (1930 lecture, GA 9 Wegmarken) | GA 9 | 1 | 0 | 0 |
| Vom Wesen des Grundes (1929 Husserl Festschrift, GA 9 Wegmar | GA 9 | 1 | 0 | 0 |
| Wegmarken (GA 9) | GA 9 | 1 | 0 | 0 |
| What Is Called Thinking? (Was heißt Denken?, WS 1951/52) | GA 8 (Niemeyer 1954) | 1 | 0 | 0 |
| Zollikon Seminars (GA 89) | GA 89 | 1 | 0 | 0 |

---

## Bibliography Section A Cross-Reference

Kemmann's Selected Bibliography Section A (book pp. 177–178) pre-curates 8 places where rhetoric is defined in Heidegger's work. The table below confirms how each of those 8 loci surfaces (or doesn't) in actual contributor citations:

| # | Kemmann locus | GA vol | Pages flagged by Kemmann | Confirmed by contributor citations? |
|---|---|---|---|---|
| 1 | Lecture manuscript 1923/24 "Wahrsein und Dasein nach Aristot | — | 3 | NO — not cited as primary locus by any HR contributor |
| 2 | GA 18 SS 1924 "Grundbegriffe der aristotelischen Philosophie | GA 18 | 103-267 / 110 / 61 / 113 / 123 | YES — 24 multi-cited locus/loci (top: HL-VOL-096 with 6 contributors) |
| 3 | GA 19 WS 1924/25 "Plato: Sophistes" | GA 19 | 200, 219, 337-339, 350-351, 16, 219, 294, 306-310, 307-351, 625-629 | YES — but only single-cited (3 loci) |
| 4 | GA 20 SS 1925 "Prolegomena zur Geschichte des Zeitbegriffs" | GA 20 | 346f | YES — but only single-cited (1 loci) |
| 5 | GA 21 WS 1925/26 "Logik: Die Frage nach der Wahrheit" | GA 21 | 130 | NO — not cited as primary locus by any HR contributor |
| 6 | GA 22 SS 1926 "Grundbegriffe der antiken Philosophie" | GA 22 | 86, 146 | YES — but only single-cited (1 loci) |
| 7 | Sein und Zeit (GA 2) | GA 2 | §§29-30, §68b | YES — 7 multi-cited locus/loci (top: HL-VOL-004 with 5 contributors) |
| 8 | GA 8 WS 1951/52 "Was heißt Denken?" | GA 8 | — | YES — but only single-cited (3 loci) |
