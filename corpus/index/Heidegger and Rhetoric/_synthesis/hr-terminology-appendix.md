# Heidegger and Rhetoric — Volume Terminology Appendix

**Volume**: Daniel M. Gross & Ansgar Kemmann (eds.), *Heidegger and Rhetoric* (SUNY 2005)
**Pipeline phase**: 3F
**Sources**:
1. `section_9_*` of all 8 phase-2 unit JSONs (HR-01-GROSS-A, HR-01-GROSS-B, HR-02-GADAMER, HR-03-MICHALSKI, HR-04-HYDE, HR-05-STRUEVER, HR-06-KISIEL, HR-07-POGGELER) — 448 raw term entries.
2. Editor-curated **Index of Subject Matter** (book pp. 193–195 / PDF pp. 199–201) — provides ~80 tri-lingual heads with German/Greek parentheticals, used as Phase 3F seed and as `in_subject_index` ground truth.
3. Cross-pipeline linkage against `bt-german-appendix`, `bcap-greek-appendix`, and `aristotle-greek-appendix`.

## Method

Raw term variants (e.g., `kinesis`, `kinēsis`, `kinēsis (Bewegung)`) are merged into a single **canonical lemma** (`kinēsis`). For each canonical lemma the appendix records:

- `primary_english_in_volume` — the most frequently used English rendering across contributors
- `alternative_renderings` — other English renderings used or noted by contributors
- `raw_variants_in_units` — the morphological/lexical-cluster variants actually encountered
- `in_subject_index` — whether the lemma (or one of its variants) is attested in the editor's Subject Index, with page list
- `aristotelian_correlate` — Greek correlate per Subject Index parenthetical (where applicable)
- `key_contributors` — the unit IDs of contributors who deploy this lemma
- `pages_by_unit` — page locations within each contributor's essay
- `translation_contested_in_volume` — whether any contributor flagged the translation as contested
- `cross_pipeline_links` — pointers to corresponding entries in BT german, BCAP greek, and Aristotle greek appendices
- `contributor_notes` — verbatim per-unit notes (preserving each contributor's framing)

**Filter rule**: A lemma is **main** if it appears in ≥2 contributor essays OR is attested in the volume Subject Index OR has a verified cross-pipeline link (BT german / BCAP greek / Aristotle greek appendix). Otherwise it is filed under **singletons**.

## Totals

| Bucket | Count |
|---|---|
| Main German | 59 |
| Main Greek | 57 |
| Main Latin | 2 |
| Main other / composite | 5 |
| **Main total** | **123** |
| Singletons German | 87 |
| Singletons Greek | 35 |
| Singletons Latin | 16 |
| Singletons other / composite | 11 |
| **Singletons total** | **149** |
| **GRAND TOTAL canonical lemmas** | **272** |

Raw input: 448 term entries (Gross-A: 77, Gross-B: 41, Gadamer: 25, Michalski: 55, Hyde: 47, Struever: 66, Kisiel: 81, Pöggeler: 56).

---

## Part I — Main Entries (lemma appears in ≥2 contributors OR attested in volume Subject Index)

### A. German lemmas — 59 entries

### Befindlichkeit

- **Language**: German
- **Primary English in volume**: attunement
- **Alternative renderings**: Sich-Befinden (the SS 1924 form), attunement / one's feeling of attunement, attunement / state-of-mind / findingness, attunement / state-of-mind / findingness / Sichbefinden, disposition (preferred), disposition / state-of-mind / find-oneself, disposition of the living in his world (per Gross's gloss of GA 18 122), dispositivity, being-in / disposed-toward (= disposedness), feeling [im Befinden], findingness, state-of-mind, state-of-mind (M/R)
- **Variants encountered**: Befindlichkeit, Befindlichkeit / Befindlichkeiten / sich-befindet
- **In Subject Index (book pp. 193–195)**: YES — head *Attunement*, pages: 27, 37, 59, 75, 109, 169
- **Aristotelian correlate (per Subject Index)**: *Befindlichkeit*
- **Contributors**: HR-01-GROSS-A, HR-01-GROSS-B, HR-02-GADAMER, HR-03-MICHALSKI, HR-05-STRUEVER, HR-06-KISIEL, HR-07-POGGELER (7 units)
- **Pages by unit**: HR-01-GROSS-A: 27; HR-01-GROSS-B: 27, 34, 37, 38; HR-02-GADAMER: 57, 59; HR-03-MICHALSKI: 75; HR-05-STRUEVER: 109, 112, 114; HR-06-KISIEL: 144; HR-07-POGGELER: 169
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Befindlichkeit
- **Contributor notes**:
  - **HR-01-GROSS-A**: Heidegger renders pathe as 'Befindlichkeit des Lebenden in seiner Welt' at GA 18.122; cross-link to BT §29.
  - **HR-01-GROSS-B**: Gross renders flexibly — 'disposition' on p. 27 (translating GA 18 122), 'finding-oneself' on p. 38 (translating Sichbefinden GA 18 262), 'Befindlichkeit, die zum Sprengen bringt' kept German on p. 37.
  - **HR-02-GADAMER**: Brackets at p. 59: '[Befindlichkeit]' is Kemmann's gloss for 'attunement.' Note the SS 1924 form (Sich-Befindens, p. 57) precedes the BT form (Befindlichkeit, p. 59) — Kemmann uses both, signaling continuity across the 1924-1927 divide.
  - **HR-03-MICHALSKI**: Heidegger's translation of pathos. The historical impulse for the existential-ontological thematization in BT §29.
  - **HR-05-STRUEVER**: Struever uses 'dispositions' as her preferred English; aligns with Heidegger's GA 18 232 and BT §29.
  - **HR-06-KISIEL**: Kisiel renders as 'dispositivity' (lining up with three modes of being-in: dispositivity/understanding/discursivity).
  - **HR-07-POGGELER**: Heidegger's existential gloss for pathos in GA 18; the translator-substitution that Pöggeler reads as the moment of restriction

### Mitsein / Miteinandersein

- **Language**: German
- **Primary English in volume**: being-with / being-with-one-another
- **Alternative renderings**: Being-with-one-another / speaking-with-one-another / negotiating-with-one-another, being-with / self-speech, being-with-one-another, being-with-one-another / speaking-with-one-another / everyday speaking-with-one-another, being-with-one-another in the world, koinonia (Greek correlate), speaking-with-one-another
- **Variants encountered**: Miteinandersein, Miteinandersein / Miteinanderreden / Miteinanderverhandeln / Miteinandersprechen, Miteinandersein / Miteinandersprechen / alltägliches Miteinanderreden, Miteinandersein-in-der-Welt, Miteinandersprechen, Mitsein / Mit-sich-Sprechen, Mitsein / Miteinandersein / Miteinanderdasein
- **In Subject Index (book pp. 193–195)**: YES — head *Being-with*, pages: 2, 4, 11, 13, 14-18, 27, 30, 40, 106, 113, 114, 120, 133, 141, 148
- **Aristotelian correlate (per Subject Index)**: *Mitsein, Miteinandersein / koinonia*
- **Contributors**: HR-01-GROSS-A, HR-01-GROSS-B, HR-03-MICHALSKI, HR-04-HYDE, HR-05-STRUEVER, HR-06-KISIEL (6 units)
- **Pages by unit**: HR-01-GROSS-A: 10-11, 14-17, 2; HR-01-GROSS-B: 27, 30, 31, 32 (German verbatim), 38, 40; HR-03-MICHALSKI: 77; HR-04-HYDE: 85; HR-05-STRUEVER: 105, 109, 110, 113, 115, 122; HR-06-KISIEL: 132, 133, 134
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Mitsein
- **Contributor notes**:
  - **HR-01-GROSS-A**: Gross treats Mitsein and koinonia as effectively equivalent (p.11).
  - **HR-01-GROSS-B**: Standard volume rendering. From GA 18 149, 151, 262.
  - **HR-03-MICHALSKI**: The basic possibility Dasein has whose surveying gives the Rhetoric its content. Translator's German parenthetical.
  - **HR-03-MICHALSKI**: The interpretation of concrete Dasein that results from the Rhetoric's surveying. Translator's German parenthetical. Cognate of Mitsein.
  - **HR-04-HYDE**: Quoted from GA 18 [149]; bridges to BT's Mitsein.
  - **HR-05-STRUEVER**: Cluster preserved as a German lexical family — Struever moves between the three forms following Heidegger's GA 18 usage.
  - **HR-05-STRUEVER**: Implicit; volume-level term.
  - **HR-06-KISIEL**: Used as standard BT/GA 18 term; equiprimordial = speech-with.

### Stimmung

- **Language**: German
- **Primary English in volume**: mood
- **Alternative renderings**: affect, mood / frame of mind, mood / moods, pathos (Greek correlate)
- **Variants encountered**: Stimmung, Stimmung / Stimmungen
- **In Subject Index (book pp. 193–195)**: YES — head *Mood*, pages: 2, 4, 7, 84-85, 136, 167, 169
- **Aristotelian correlate (per Subject Index)**: *Stimmung / pathos*
- **Contributors**: HR-01-GROSS-A, HR-04-HYDE, HR-06-KISIEL, HR-07-POGGELER (4 units)
- **Pages by unit**: HR-01-GROSS-A: 2; HR-04-HYDE: 84, 85; HR-06-KISIEL: 145; HR-07-POGGELER: 167, 169
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Stimmung
- **Contributor notes**:
  - **HR-01-GROSS-A**: Listed in the BT-glossary at p.2 paired with pathos.
  - **HR-04-HYDE**: Quoted in the German GA 18 [163] passage: 'Möglichkeiten der Stimmung' = 'possibilities of moods.' Aligned with Aristotle's pathē.
  - **HR-06-KISIEL**: Standard rendering.
  - **HR-07-POGGELER**: Heidegger 'analyzed fear and anxiety as feelings, moods (Stimmungen), or affects'

### Bodenständigkeit / Boden

- **Language**: German
- **Primary English in volume**: ground
- **Alternative renderings**: native-soil-rootedness, autochthony, rootedness/autochthony of conceptuality, the ground and soil of the logos itself
- **Variants encountered**: Boden, Bodenständigkeit, Bodenständigkeit der Begrifflichkeit, den Boden des logos selbst
- **In Subject Index**: no
- **Contributors**: HR-03-MICHALSKI, HR-04-HYDE, HR-05-STRUEVER, HR-06-KISIEL (4 units)
- **Pages by unit**: HR-03-MICHALSKI: 70; HR-04-HYDE: 89, 95; HR-05-STRUEVER: 109, 113; HR-06-KISIEL: 140, 158
- **Translation contested in volume**: yes
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Heidegger's guiding question that orders his concept-discussions. Translator's German parenthetical (per note 2).
  - **HR-04-HYDE**: GA 18 [169]; central Heideggerian-rhetorical-ontological gloss.
  - **HR-05-STRUEVER**: GA 18 199, 276. Imagination as Boden of noein; phobos as Boden.
  - **HR-06-KISIEL**: Two registers: (1) Heidegger's Greek-philological method; (2) Heidegger's Nazi-period mythology of landed gentry. Contested across the essay.

### Affektenlehre

- **Language**: German
- **Primary English in volume**: doctrine of affections
- **Alternative renderings**: Lehre von den Affekten, doctrine of affections / theology of emotion, doctrine of affects / theory of affections
- **In Subject Index (book pp. 193–195)**: YES — head *Doctrine of affections*, pages: 8, 33, 44 n.47, 116, 121
- **Aristotelian correlate (per Subject Index)**: *Affektenlehre*
- **Contributors**: HR-01-GROSS-A, HR-01-GROSS-B, HR-05-STRUEVER (3 units)
- **Pages by unit**: HR-01-GROSS-A: 8; HR-01-GROSS-B: 33, 34, 44 (note 47); HR-05-STRUEVER: 116
- **Contributor notes**:
  - **HR-01-GROSS-A**: The Lutheran-Schleiermacherian tradition Gadamer declines to reclaim.
  - **HR-01-GROSS-B**: Used as a tradition-name (Luther, then Thomas, then medieval theology). Gross renders it 'doctrine of affections' implicitly via context.
  - **HR-05-STRUEVER**: Patristic-medieval-Stoic tradition; cited in Note 22.

### Augenblick

- **Language**: German
- **Primary English in volume**: moment
- **Alternative renderings**: kairos, kairos (Greek correlate)
- **In Subject Index (book pp. 193–195)**: YES — head *Moment*, pages: 2, 33-34, 37, 110-111, 112, 120, 123, 125, 143, 149, 150
- **Aristotelian correlate (per Subject Index)**: *Augenblick / kairos*
- **Contributors**: HR-01-GROSS-A, HR-05-STRUEVER, HR-06-KISIEL (3 units)
- **Pages by unit**: HR-01-GROSS-A: 2; HR-05-STRUEVER: 112; HR-06-KISIEL: 146, 150
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Augenblick
- **Contributor notes**:
  - **HR-01-GROSS-A**: BT-glossary entry.
  - **HR-05-STRUEVER**: Used standardly; cf. *kairos* in transliteration.
  - **HR-06-KISIEL**: Glossed as 'momentous decision' = kairos.

### Gerede

- **Language**: German
- **Primary English in volume**: idle chatter
- **Alternative renderings**: idle chatter / chatter, idle talk, idle talk / falling
- **Variants encountered**: Gerede, Gerede / Verfallen
- **In Subject Index (book pp. 193–195)**: YES — head *Idle chatter, idle talk*, pages: 76, 77, 85, 96, 137
- **Aristotelian correlate (per Subject Index)**: *Gerede*
- **Contributors**: HR-03-MICHALSKI, HR-04-HYDE, HR-05-STRUEVER (3 units)
- **Pages by unit**: HR-03-MICHALSKI: 76, 77; HR-04-HYDE: 85, 96; HR-05-STRUEVER: 121
- **Cross-pipeline links**:
  - `bcap_pipeline`: bcap-greek-appendix.md → Gerede
  - `bt_pipeline`: bt-german-appendix.md → Gerede
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Logos in its third sense — what just pops into one's head; generally available public property. Becomes prominent and obscures genuine meaning. Philology must delimit authentic conceptual speaking from this.
  - **HR-04-HYDE**: Used in negative-pole-of-publicness contexts and in §V (chatter that drowns out call of Being).
  - **HR-05-STRUEVER**: BT vocabulary used in Blattner-erosion discussion.

### In-der-Welt-sein

- **Language**: German
- **Primary English in volume**: being-in-the-world
- **Alternative renderings**: attuned and comprehending being-in-the-world
- **Variants encountered**: In-der-Welt-Sein / Sein-in-der-Welt, befindlich-verstehendes In-der-Welt-sein, in-der-Welt-sein
- **In Subject Index (book pp. 193–195)**: YES — head *Being-in-the-world*, pages: 15, 16, 20, 26, 27, 30, 69, 75, 131, 169
- **Aristotelian correlate (per Subject Index)**: *In-der-Welt-sein*
- **Contributors**: HR-01-GROSS-A, HR-03-MICHALSKI, HR-07-POGGELER (3 units)
- **Pages by unit**: HR-01-GROSS-A: 13, 15, 27; HR-03-MICHALSKI: 75; HR-07-POGGELER: 169
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → In-der-Welt-sein
- **Contributor notes**:
  - **HR-01-GROSS-A**: BT-glossary entry; central to GA 18.241 (the doppeldeutig argument).
  - **HR-03-MICHALSKI**: The mode of being from which the philologist's question of cognition of speech is posed.
  - **HR-07-POGGELER**: BT §12 / GA 18 close: praxis as in-der-Welt-sein

### Rede / Gespräch

- **Language**: German
- **Primary English in volume**: speeches
- **Alternative renderings**: discussing / speaking, speech / discourse / dialogue / conversation
- **Variants encountered**: Rede / Gesprach, Reden
- **In Subject Index (book pp. 193–195)**: YES — head *Speech*, pages: 10, 108, 118, 131, 134, 144, 167
- **Aristotelian correlate (per Subject Index)**: *Rede / legein, logos*
- **Contributors**: HR-01-GROSS-A, HR-02-GADAMER, HR-06-KISIEL (3 units)
- **Pages by unit**: HR-01-GROSS-A: 22, 3; HR-02-GADAMER: 54, 58; HR-06-KISIEL: 135, 159
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Rede
- **Contributor notes**:
  - **HR-01-GROSS-A**: GA 18.108: 'der Mensch ist ein Lebendes, das im Gesprach und in der Rede sein eigentliches Dasein hat.'
  - **HR-02-GADAMER**: Used twice with brackets: 'discussing [Reden] is similar' (p. 54); 'true discussion [Reden]' (p. 58). The German *Reden* connotes substantive speaking, distinct from 'Diskussion' (rejected at p. 52 as Latin).
  - **HR-06-KISIEL**: Heidegger's collected speeches GA 16 = Reden und andere Zeugnisse.

### Sorge

- **Language**: German
- **Primary English in volume**: care
- **Alternative renderings**: care / solicitude / concern (taking-care-of), welfare-state Fürsorge
- **Variants encountered**: Sorge, Sorge / Fürsorge / Besorgen
- **In Subject Index (book pp. 193–195)**: YES — head *Care*, pages: 2, 40, 120, 145
- **Aristotelian correlate (per Subject Index)**: *Sorge*
- **Contributors**: HR-01-GROSS-A, HR-05-STRUEVER, HR-06-KISIEL (3 units)
- **Pages by unit**: HR-01-GROSS-A: 2; HR-05-STRUEVER: 120; HR-06-KISIEL: 146
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Sorge
- **Contributor notes**:
  - **HR-01-GROSS-A**: Listed in the BT-glossary at p.2.
  - **HR-05-STRUEVER**: Used in BT-cite mode.
  - **HR-06-KISIEL**: Fürsorge specifically tied to leaping-ahead vs. leaping-in distinction.

### das Man

- **Language**: German
- **Primary English in volume**: the Anyone
- **Alternative renderings**: Anyone, as anyone / the Anyone, the 'they', the 'they' (alternative rendering noted by contributor)
- **Variants encountered**: als Man / das Man, das Man
- **In Subject Index**: no
- **Contributors**: HR-03-MICHALSKI, HR-06-KISIEL, HR-07-POGGELER (3 units)
- **Pages by unit**: HR-03-MICHALSKI: 76; HR-06-KISIEL: 141, 142; HR-07-POGGELER: 168
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → das Man
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Mode of average understanding in which Dasein comports itself in everyday self-expression (GA 18 55f, 63f).
  - **HR-06-KISIEL**: Kisiel uses 'Anyone' rather than 'they-self'; emphasizes universal-of-averageness reading.
  - **HR-07-POGGELER**: Heidegger's BT term; Pöggeler reads its conjunction with Öffentlichkeit as the moment of political restriction

### Jeweiligkeit

- **Language**: German
- **Primary English in volume**: what in each case obtains
- **Alternative renderings**: particular while / temporal particularity / respective Dasein, particular-while, temporal particularity / 'in each instantiation' / 'as the case may be'
- **Variants encountered**: Jeweiliges, Jeweiligkeit / je nach dem, Jeweiligkeit / jeweiliges Dasein
- **In Subject Index**: no
- **Contributors**: HR-03-MICHALSKI, HR-05-STRUEVER, HR-06-KISIEL (3 units)
- **Pages by unit**: HR-03-MICHALSKI: 71; HR-05-STRUEVER: 111, 123, 125; HR-06-KISIEL: 140, 146, 153
- **Translation contested in volume**: yes
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Heidegger's German rendering of hekaston. Translator's German parenthetical (per note 2).
  - **HR-05-STRUEVER**: Struever explicitly translates Jeweiligkeit as 'particular while' or 'temporal particularity' — emphasis on temporal aspect, contra a more spatial 'each-each-time' reading. GA 18 201.
  - **HR-06-KISIEL**: Kisiel coins 'jeweilige Universalia' = 'temporally particularizing universals.'

### Lage

- **Language**: German
- **Primary English in volume**: situation / being-in
- **Alternative renderings**: situation / state of affairs, situation / state of the state
- **Variants encountered**: Lage, Lage / Lage des Staates
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-04-HYDE, HR-06-KISIEL (3 units)
- **Pages by unit**: HR-01-GROSS-A: 14, 2; HR-04-HYDE: 84; HR-06-KISIEL: 134
- **Contributor notes**:
  - **HR-01-GROSS-A**: Cited via BT 420 at p.14: 'Lage bzw. situation'.
  - **HR-04-HYDE**: Quoted in GA 18 [163]: 'die jeweilige Lage der Dinge' (the particular state of affairs).
  - **HR-06-KISIEL**: Aristotle's deliberative-speech topic on 'present condition of the state.'

### Alltäglichkeit

- **Language**: German
- **Primary English in volume**: everydayness
- **Alternative renderings**: everydayness (insufficient), ordinariness (rejected), timefulness (Struever's term) / everydayness
- **In Subject Index (book pp. 193–195)**: YES — head *Time dimension of Dasein*, pages: 106-107, 110-113
- **Aristotelian correlate (per Subject Index)**: *Alltäglichkeit*
- **Contributors**: HR-05-STRUEVER, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-05-STRUEVER: 105, 106, 108, 110, 111, 112, 113, 114, 115, 117, 121, 125, 126; HR-07-POGGELER: 168
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Alltäglichkeit
- **Contributor notes**:
  - **HR-05-STRUEVER**: Titular concept. Struever explicitly contests 'ordinariness' translation, coining 'timefulness' as proper rendering. Subject Index lists 12+ pages.
  - **HR-07-POGGELER**: BT §29 cited in n. 33 for Heidegger's gloss of Aristotle's Rhetoric: 'first systematic hermeneutic of the everydayness (Alltäglichkeit) of being amongst one another'

### Aussage / Aussagen

- **Language**: German
- **Primary English in volume**: statement / proposition
- **Alternative renderings**: articulation (preferred), articulation / speaking-out / enunciation
- **Variants encountered**: Aussage, Aussagen
- **In Subject Index (book pp. 193–195)**: YES — head *Articulation*, pages: 2, 107, 110, 125
- **Aristotelian correlate (per Subject Index)**: *Aussagen / logos*
- **Contributors**: HR-05-STRUEVER, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-05-STRUEVER: 109, 110, 118, 121, 126; HR-07-POGGELER: 167
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Aussage
- **Contributor notes**:
  - **HR-05-STRUEVER**: Heidegger's term for the structural mode of rhetorical/discursive speech — speaking-out for the community.
  - **HR-07-POGGELER**: Heidegger 'contends that the simple sentence must not be regarded as a statement or proposition (Aussage), and that the proposition cannot manage the distinction between truth and falsity'

### Bewegung / Bewegtsein

- **Language**: German
- **Primary English in volume**: motion / being-moved
- **Alternative renderings**: Being-moved / Being-in-motion, kinesis (Greek correlate), motion / being-moved / being-as-being-moved / changeable constitution
- **Variants encountered**: Bewegung / Bewegtsein, Bewegung / Bewegtsein / Sein-als-Bewegtsein / veränderliche Beschaffenheit / Veränderlichkeit, Sein-in-Bewegung
- **In Subject Index (book pp. 193–195)**: YES — head *Motion*, pages: 20-21, 78 n.8, 80 n.22, 108-109, 169
- **Aristotelian correlate (per Subject Index)**: *Bewegung / kinesis*
- **Contributors**: HR-01-GROSS-A, HR-05-STRUEVER (2 units)
- **Pages by unit**: HR-01-GROSS-A: 13, 17, 20-22, 25, subtitle of essay; HR-05-STRUEVER: 108, 109, 167
- **Contributor notes**:
  - **HR-01-GROSS-A**: Central concept; Heidegger morphs the verb stem extensively (bewegt wird, Bewegen, Bewegendes).
  - **HR-01-GROSS-A**: Gross's titular term; not a direct Heidegger phrase but extracted from his usage.
  - **HR-05-STRUEVER**: Heidegger's German rendering of Greek *kinēsis*/changeability.

### Furcht

- **Language**: German
- **Primary English in volume**: fear
- **Alternative renderings**: phobos (Greek correlate)
- **Variants encountered**: Furcht, Furcht / phobos
- **In Subject Index (book pp. 193–195)**: YES — head *Fear*, pages: 2, 35, 58, 87, 109, 169
- **Aristotelian correlate (per Subject Index)**: *Furcht / phobos*
- **Contributors**: HR-01-GROSS-A, HR-01-GROSS-B (2 units)
- **Pages by unit**: HR-01-GROSS-A: 2; HR-01-GROSS-B: 34, 35, 36, 37, 38, 44 (note 47)
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Furcht
- **Contributor notes**:
  - **HR-01-GROSS-A**: Listed in BT-glossary; cross-link to BT §30.
  - **HR-01-GROSS-B**: Gross uses 'fear' throughout; phobos noted parenthetically in 'Indeed this is precisely how Heidegger describes being overcome by fear (phobos)' p. 34.

### Glaube / Ansicht

- **Language**: German
- **Primary English in volume**: belief
- **Alternative renderings**: doxa (Greek correlate), perspective / nonreflective perspective
- **Variants encountered**: Ansicht, Glaube / Ansicht
- **In Subject Index (book pp. 193–195)**: YES — head *Belief*, pages: 2, 30-34, 40, 45 n.48, 85, 107, 112, 123, 134, 137, 141, 145, 147, 148, 155-156
- **Aristotelian correlate (per Subject Index)**: *Glaube, Ansicht / doxa*
- **Contributors**: HR-01-GROSS-A, HR-01-GROSS-B (2 units)
- **Pages by unit**: HR-01-GROSS-A: 2; HR-01-GROSS-B: 30, 43 (note 28)
- **Contributor notes**:
  - **HR-01-GROSS-A**: Paired with doxa at p.2.
  - **HR-01-GROSS-B**: From GA 18 136 and 125. Gross renders as 'protolinguistic disposition or nonreflective perspective.'

### Lebensphilosophie

- **Language**: German
- **Primary English in volume**: philosophy of life
- **Alternative renderings**: philosophy of life, philosophy of living
- **In Subject Index (book pp. 193–195)**: YES — head *Philosophy of life*, pages: 14, 16, 17, 170
- **Aristotelian correlate (per Subject Index)**: *Lebensphilosophie*
- **Contributors**: HR-01-GROSS-A, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-01-GROSS-A: 14, 16; HR-07-POGGELER: 170
- **Contributor notes**:
  - **HR-01-GROSS-A**: Heidegger's GA 18.241-242 polemic: ''Lebensphilosophie' ist wie: 'Botanik der Pflanzen'!'
  - **HR-07-POGGELER**: 'Would the prejudices of the church fathers have led to a philosophy of living (Lebensphilosophie) if the Greeks had not assumed a one-sided orientation toward sight?'

### Öffentlichkeit

- **Language**: German
- **Primary English in volume**: publicness
- **Alternative renderings**: dictatorship of publicness (Letter on Humanism), publicness, public-space
- **In Subject Index (book pp. 193–195)**: YES — head *Publicness*, pages: 83, 85, 168, 171
- **Aristotelian correlate (per Subject Index)**: *Öffentlichkeit*
- **Contributors**: HR-06-KISIEL, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-06-KISIEL: 132, 141; HR-07-POGGELER: 168, 171
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Öffentlichkeit
- **Contributor notes**:
  - **HR-06-KISIEL**: Implicit in 'public sphere' usage.
  - **HR-07-POGGELER**: Heidegger 'treats publicness (Öffentlichkeit) only as the mode of being for they (das Man)'; Letter on Humanism polemicizes against the 'dictatorship of publicness'

### Anwesen / Habe

- **Language**: German
- **Primary English in volume**: real estate / having
- **Alternative renderings**: Possession of completeness
- **Variants encountered**: Anwesen / Habe, Besitz der Vollkommenheit
- **In Subject Index**: no
- **Contributors**: HR-03-MICHALSKI, HR-06-KISIEL (2 units)
- **Pages by unit**: HR-03-MICHALSKI: 72; HR-06-KISIEL: 140
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Heidegger rejects this rendering for entelecheia as not conveying ontologically fundamental meaning. Translator's German parenthetical.
  - **HR-06-KISIEL**: Practical-roots gloss for Greek ousia. Contributor explicitly flags double meaning of Anwesen = real estate AND presence.

### Anwesen / Habe / Gegenwart

- **Language**: German
- **Primary English in volume**: presence
- **Alternative renderings**: present-being of the having-one / present-ing of the having-one
- **Variants encountered**: Gegenwart, Gegenwärtigsein des Habenden / Gegenwärtigen des Habenden
- **In Subject Index**: no
- **Contributors**: HR-05-STRUEVER, HR-06-KISIEL (2 units)
- **Pages by unit**: HR-05-STRUEVER: 111, 120; HR-06-KISIEL: 135
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Gegenwart
- **Contributor notes**:
  - **HR-05-STRUEVER**: GA 18 174–175, 192. 'energeia, das eigentliche Da' — habit's temporal mode.
  - **HR-06-KISIEL**: Aristotelian epideictic-speech telos: bringing the auditor to the presence of something admirable.

### Besorgen

- **Language**: German
- **Primary English in volume**: taking care of things
- **Alternative renderings**: cares, concern / care-taking-of / concerned speaking
- **Variants encountered**: Besorgen, Besorgen / besorgendes Sprechen
- **In Subject Index**: no
- **Contributors**: HR-04-HYDE, HR-05-STRUEVER (2 units)
- **Pages by unit**: HR-04-HYDE: 86; HR-05-STRUEVER: 107, 110, 120
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Besorgen
- **Contributor notes**:
  - **HR-04-HYDE**: BT vocabulary; Hyde uses it to describe the practical world of rhetorical exhortation.
  - **HR-05-STRUEVER**: Heidegger's term for practical concern; Struever links to *kairos* (140).

### Eigentlichkeit

- **Language**: German
- **Primary English in volume**: authenticity
- **Alternative renderings**: authentic / in the authentic kairos, most personal character
- **Variants encountered**: Eigentlich / im eigentlichen kairos, Eigentlichkeit
- **In Subject Index**: no
- **Contributors**: HR-05-STRUEVER, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-05-STRUEVER: 110, 124, 125; HR-07-POGGELER: 171
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Eigentlichkeit
- **Contributor notes**:
  - **HR-05-STRUEVER**: GA 18 59. Heidegger's concept of authenticity used in rhetoric-political register.
  - **HR-07-POGGELER**: Pöggeler's diagnostic phrase: 'isolated cabin dweller and Naples inhabit contradictory worlds, as do Heidegger's most personal character (Eigentlichkeit) and the public-spirited rhetorical tradition'

### Entschlossenheit / Entschluß

- **Language**: German
- **Primary English in volume**: decision / resoluteness
- **Alternative renderings**: krisis, krisis (Greek correlate), resoluteness / decision / resolute action
- **Variants encountered**: Entschlossenheit / Entschluss / entschlossenes Handeln, Entschluss / Entschlossenheit
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-06-KISIEL (2 units)
- **Pages by unit**: HR-01-GROSS-A: 2; HR-06-KISIEL: 146, 148
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Entschlossenheit
- **Contributor notes**:
  - **HR-01-GROSS-A**: Paired with krisis at p.2.
  - **HR-06-KISIEL**: Kisiel emphasizes Entschlossenheit as Heideggerian translation of Aristotelian ethos.

### Erkenntnis / Erkenntnistheorie

- **Language**: German
- **Primary English in volume**: cognition
- **Alternative renderings**: epistemology / theory of knowledge
- **Variants encountered**: Erkenntnis, Erkenntnistheorie
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-03-MICHALSKI (2 units)
- **Pages by unit**: HR-01-GROSS-A: 15-16; HR-03-MICHALSKI: 75
- **Contributor notes**:
  - **HR-01-GROSS-A**: GA 18.241-242 polemic against.
  - **HR-03-MICHALSKI**: 'Theoretical cognition' (theoretische Erkenntnis) — Heidegger's framing of philology as theoretical-yet-passion-bound. Translator's German parenthetical.

### Führer / Führerstaat

- **Language**: German
- **Primary English in volume**: leader / leader-state / guardians
- **Alternative renderings**: (untranslated — German political-historical referent)
- **Variants encountered**: Führer, Führer / Führerstaat / Hüter
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-B, HR-06-KISIEL (2 units)
- **Pages by unit**: HR-01-GROSS-B: 39; HR-06-KISIEL: 149-151
- **Contributor notes**:
  - **HR-01-GROSS-B**: 'adherence to the German Führer' — Hitler. Untranslated to preserve historical-political register.
  - **HR-06-KISIEL**: Plato Republic guardians (Hüter) translated into Nazi-state vocabulary.

### Gewissen

- **Language**: German
- **Primary English in volume**: Conscience
- **Alternative renderings**: conscience, willingness to have a conscience
- **Variants encountered**: Gewissen, Gewissen-haben-wollen
- **In Subject Index**: no
- **Contributors**: HR-04-HYDE, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-04-HYDE: 91; HR-07-POGGELER: 165, 169
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Gewissen
- **Contributor notes**:
  - **HR-04-HYDE**: Cited specifically in the Taminiaux gloss: 'phronesis is Gewissen [Conscience] set in motion which makes an action transparent [durchsichtig].' Bracketed translation supplied.
  - **HR-07-POGGELER**: Heidegger's 1922 Natorp-Bericht translation of phronēsis; later: Gewissen-haben-wollen (willingness-to-have-a-conscience)
  - **HR-07-POGGELER**: BT term; Pöggeler closes Section II with: 'Each one must confront this finitude in the authentic willingness to have a conscience (Gewissen-haben-wollen)'

### Ja-sagen

- **Language**: German
- **Primary English in volume**: yes-saying
- **Alternative renderings**: affirmation, kein Untersuchen, Reflektieren, yes-saying / affirmation
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-B, HR-05-STRUEVER (2 units)
- **Pages by unit**: HR-01-GROSS-B: 31; HR-05-STRUEVER: 107
- **Contributor notes**:
  - **HR-01-GROSS-B**: From GA 18 136-137. Doxa's protolinguistic structure.
  - **HR-05-STRUEVER**: GA 18 137. Heidegger's gloss for *doxa*.

### Kehre

- **Language**: German
- **Primary English in volume**: turning / turn
- **Alternative renderings**: elemental shift / turn
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-01-GROSS-A: 23; HR-07-POGGELER: 170
- **Contributor notes**:
  - **HR-01-GROSS-A**: p.23: 'Heidegger's Kehre' marks the periodization of pre/post.
  - **HR-07-POGGELER**: Letter on Humanism: 'the challenge of an elemental shift (Kehre) in thought and existence (Dasein) in general'

### Materialität / Stofflichkeit

- **Language**: German
- **Primary English in volume**: stuffiness
- **Alternative renderings**: corporeality / materiality / material-substance, materiality
- **Variants encountered**: Korperlichkeit / Stofflichkeit / Materialitat, Materialität, Stofflichkeit
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-03-MICHALSKI (2 units)
- **Pages by unit**: HR-01-GROSS-A: 24; HR-03-MICHALSKI: 71
- **Translation contested in volume**: yes
- **Contributor notes**:
  - **HR-01-GROSS-A**: Per Heidegger at GA 18.28 these are *not* what soma means; he proposes Aufdringlichkeit instead.
  - **HR-03-MICHALSKI**: Heidegger rejects this rendering for soma. Translator's German parenthetical.
  - **HR-03-MICHALSKI**: Heidegger rejects this rendering for soma. Translator's German parenthetical.

### Naturwissenschaft / Geisteswissenschaft

- **Language**: German
- **Primary English in volume**: natural sciences / human sciences
- **Alternative renderings**: natural science / nature-concepts
- **Variants encountered**: Naturwissenschaft / Geisteswissenschaft, Naturwissenschaft / Naturbegriffe
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-05-STRUEVER (2 units)
- **Pages by unit**: HR-01-GROSS-A: 12, 14, 24; HR-05-STRUEVER: 106
- **Contributor notes**:
  - **HR-01-GROSS-A**: Dilthey's distinction Heidegger 'overextended' (p.24).
  - **HR-05-STRUEVER**: GA 18 241. 'Die Begriffe vom Sein-in-der-polis haben ihre Grundlagen in den Naturbegriffen.'

### Sachlichkeit / Sachcharakter

- **Language**: German
- **Primary English in volume**: substantive character
- **Alternative renderings**: matter-of-fact / particular matter-of-fact
- **Variants encountered**: Sachcharakter, Sachlichkeit
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-B, HR-03-MICHALSKI (2 units)
- **Pages by unit**: HR-01-GROSS-B: 38; HR-03-MICHALSKI: 73
- **Contributor notes**:
  - **HR-01-GROSS-B**: From GA 18 262. Gross's striking translation as the world-prefigured-by-pathē.
  - **HR-03-MICHALSKI**: Heidegger's term for what philosophical teaching neglects to consider — the character of speaking, listeners, and discourse itself. Translator's German parenthetical.

### Sprache

- **Language**: German
- **Primary English in volume**: language
- **In Subject Index**: no
- **Contributors**: HR-04-HYDE, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-04-HYDE: Note 24; HR-07-POGGELER: 171
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Sprache
- **Contributor notes**:
  - **HR-04-HYDE**: Per Dastur quote: 'voice (Stimme) is necessary essentially articulated to be language (Sprache).'
  - **HR-07-POGGELER**: Late Heidegger's truth-of-language; Unterwegs zur Sprache (1959) cited

### Vorstellung / Vorstellen

- **Language**: German
- **Primary English in volume**: (primitive) impression
- **Alternative renderings**: representative consciousness / representation
- **Variants encountered**: Vorstellen, Vorstellung
- **In Subject Index**: no
- **Contributors**: HR-03-MICHALSKI, HR-05-STRUEVER (2 units)
- **Pages by unit**: HR-03-MICHALSKI: 80; HR-05-STRUEVER: 121
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Note 22: 'Today, we have only a primitive impression [Vorstellung] of speech.' Translator's German parenthetical.
  - **HR-05-STRUEVER**: Kantian term Dilthey rejects.

### Wesen

- **Language**: German
- **Primary English in volume**: essence
- **In Subject Index**: no
- **Contributors**: HR-03-MICHALSKI, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-03-MICHALSKI: 71; HR-07-POGGELER: 161
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Heidegger rejects this rendering for ousia. Translator's German parenthetical.
  - **HR-07-POGGELER**: Pöggeler glosses Heidegger: '"Essence," of course, is here understood verbally and historically'

### Angst

- **Language**: German
- **Primary English in volume**: anxiety
- **Alternative renderings**: phobos (Greek correlate)
- **In Subject Index (book pp. 193–195)**: YES — head *Anxiety*, pages: 88, 95, 167, 169
- **Aristotelian correlate (per Subject Index)**: *Angst*
- **Contributors**: HR-01-GROSS-A (1 unit)
- **Pages by unit**: HR-01-GROSS-A: 2
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Angst
- **Contributor notes**:
  - **HR-01-GROSS-A**: Paired with phobos at p.2.

### Begriff

- **Language**: German
- **Primary English in volume**: concept
- **In Subject Index (book pp. 193–195)**: YES — head *Concept*, pages: 3, 69, 70-72, 140
- **Aristotelian correlate (per Subject Index)**: *Begriff*
- **Contributors**: HR-01-GROSS-A (1 unit)
- **Pages by unit**: HR-01-GROSS-A: 3
- **Contributor notes**:
  - **HR-01-GROSS-A**: p.3: 'a trope, acting in concert with its staid manifestation as a concept (Begriff), marks the contours of contingency.'

### Dasein

- **Language**: German
- **Primary English in volume**: being-here, there-being, being-there
- **Alternative renderings**: Da-sein (hyphenated)
- **In Subject Index (book pp. 193–195)**: YES — head *Dasein*, pages: 5, 13, 14, 23, 31, 37-38, 40, 67, 71, 75-78, 79 n.19, 80, 92, 109, 115, 116, 120, 121, 122, 125, 142, 153, 154, 169
- **Contributors**: HR-06-KISIEL (1 unit)
- **Pages by unit**: HR-06-KISIEL: 131, 133, 138
- **Cross-pipeline links**:
  - `bcap_pipeline`: bcap-greek-appendix.md → Dasein
  - `bt_pipeline`: bt-german-appendix.md → Dasein
- **Contributor notes**:
  - **HR-06-KISIEL**: Kisiel uses both Dasein and Da-sein; the hyphen marks emphasis on locale ('being-here').

### Gelassenheit

- **Language**: German
- **Primary English in volume**: releasement / letting-be
- **In Subject Index (book pp. 193–195)**: YES — head *Gelassenheit*, pages: 3
- **Contributors**: HR-01-GROSS-A (1 unit)
- **Pages by unit**: HR-01-GROSS-A: 23, 3
- **Contributor notes**:
  - **HR-01-GROSS-A**: Late Heidegger 'attitude of "releasement" that accepts the contingency and partiality of our understanding of Being and just lets "beings be"' (p.3).

### Ruf des Gewissens

- **Language**: German
- **Primary English in volume**: call of conscience
- **In Subject Index (book pp. 193–195)**: YES — head *Call of conscience*, pages: 82, 88, 90-93, 95, 96, 97, 98, 145-146
- **Aristotelian correlate (per Subject Index)**: *Ruf des Gewissens*
- **Contributors**: HR-04-HYDE (1 unit)
- **Pages by unit**: HR-04-HYDE: 82, 91, 95-99
- **Contributor notes**:
  - **HR-04-HYDE**: Hyde uses Macquarrie/Robinson rendering throughout. Italicized at first introduction (p. 82, p. 91). Title concept.

### Sprachlichkeit

- **Language**: German
- **Primary English in volume**: linguisticality
- **In Subject Index (book pp. 193–195)**: YES — head *Linguisticality*, pages: 56, 59-60
- **Aristotelian correlate (per Subject Index)**: *Sprachlichkeit*
- **Contributors**: HR-02-GADAMER (1 unit)
- **Pages by unit**: HR-02-GADAMER: 55 (IV title), 59, 60
- **Contributor notes**:
  - **HR-02-GADAMER**: Titular term for Section IV. Carried in brackets in section heading: 'IV. THE PHILOSOPHY OF RHETORIC IN THE UNIVERSE OF LINGUISTICALITY [SPRACHLICHKEIT]'. Defined at p. 60: 'everything that can allow something to be understood. Therefore, hermeneutics; thereby its indefinability.'

### Verständigung

- **Language**: German
- **Primary English in volume**: coming-to-an-understanding-agreement
- **Alternative renderings**: hermeneia
- **Variants encountered**: Verstandigung
- **In Subject Index (book pp. 193–195)**: YES — head *Understanding*, pages: 7, 134
- **Aristotelian correlate (per Subject Index)**: *Verstehen, Verständigung*
- **Contributors**: HR-06-KISIEL (1 unit)
- **Pages by unit**: HR-06-KISIEL: 132
- **Contributor notes**:
  - **HR-06-KISIEL**: Glossed via Greek hermeneia.

### Wirkungsgeschichte

- **Language**: German
- **Primary English in volume**: effective history
- **In Subject Index (book pp. 193–195)**: YES — head *Wirkungsgeschichte*, pages: 67
- **Contributors**: HR-03-MICHALSKI (1 unit)
- **Pages by unit**: HR-03-MICHALSKI: 67
- **Contributor notes**:
  - **HR-03-MICHALSKI**: The history of the affects/Aristotle's pathē-doctrine traced through Stoics, church fathers, Aquinas, Luther — used by Heidegger to show influence, not for augmentation.

### Überlegung

- **Language**: German
- **Primary English in volume**: deliberation
- **Variants encountered**: Uberlegung
- **In Subject Index (book pp. 193–195)**: YES — head *Deliberation*, pages: 2, 90, 91, 110, 136, 148
- **Aristotelian correlate (per Subject Index)**: *Überlegung / Beratung*
- **Contributors**: HR-01-GROSS-A (1 unit)
- **Pages by unit**: HR-01-GROSS-A: 11, 2
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Überlegung
- **Contributor notes**:
  - **HR-01-GROSS-A**: BT-glossary entry; also p.11 in deliberative-rhetoric context.

### Aufdringlichkeit

- **Language**: German
- **Primary English in volume**: obtrusiveness
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A (1 unit)
- **Pages by unit**: HR-01-GROSS-A: 24-25
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Aufdringlichkeit
- **Contributor notes**:
  - **HR-01-GROSS-A**: Heidegger's preferred rendering of soma.

### Destruktion

- **Language**: German
- **Primary English in volume**: destructuring
- **In Subject Index**: no
- **Contributors**: HR-03-MICHALSKI (1 unit)
- **Pages by unit**: HR-03-MICHALSKI: 65
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Destruktion
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Heidegger's pre-1924 Destruktion of philosophical-theological systemicity. Translator's German parenthetical (per note 2).

### Faktizität

- **Language**: German
- **Primary English in volume**: facticity
- **In Subject Index**: no
- **Contributors**: HR-07-POGGELER (1 unit)
- **Pages by unit**: HR-07-POGGELER: 165
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Faktizität
- **Contributor notes**:
  - **HR-07-POGGELER**: Heidegger's reversal of Husserl's transcendentalism: 'the transcendental as facticity (Faktizität), which considers existence something to be taken up'

### Geschichtlichkeit

- **Language**: German
- **Primary English in volume**: historicity (implicit in 'historicality' / 'historical happening')
- **Alternative renderings**: historicality
- **In Subject Index**: no
- **Contributors**: HR-06-KISIEL (1 unit)
- **Pages by unit**: HR-06-KISIEL: 143
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Geschichtlichkeit
- **Contributor notes**:
  - **HR-06-KISIEL**: Standard SZ §74 vocabulary.

### Lichtung

- **Language**: German
- **Primary English in volume**: temporal clearing
- **In Subject Index**: no
- **Contributors**: HR-06-KISIEL (1 unit)
- **Pages by unit**: HR-06-KISIEL: 140
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Lichtung
- **Contributor notes**:
  - **HR-06-KISIEL**: Glossed as 'nous-surrogate.'

### Mitwelt

- **Language**: German
- **Primary English in volume**: interhuman world, with-world
- **In Subject Index**: no
- **Contributors**: HR-06-KISIEL (1 unit)
- **Pages by unit**: HR-06-KISIEL: 154
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Mitwelt
- **Contributor notes**:
  - **HR-06-KISIEL**: Section IX (Arendt) — radicalized as space of plurality and natality.

### Möglichkeit / Möglichsein

- **Language**: German
- **Primary English in volume**: possibility / being-possible
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-B (1 unit)
- **Pages by unit**: HR-01-GROSS-B: 37
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Möglichkeit
- **Contributor notes**:
  - **HR-01-GROSS-B**: From GA 18 253. Structural feature of fear.

### Nachsicht

- **Language**: German
- **Primary English in volume**: forbearance
- **In Subject Index**: no
- **Contributors**: HR-04-HYDE (1 unit)
- **Pages by unit**: HR-04-HYDE: 99
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Nachsicht
- **Contributor notes**:
  - **HR-04-HYDE**: BT 159; Hyde paired with Rücksicht.

### Rücksicht

- **Language**: German
- **Primary English in volume**: considerateness
- **In Subject Index**: no
- **Contributors**: HR-04-HYDE (1 unit)
- **Pages by unit**: HR-04-HYDE: 99
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Rücksicht
- **Contributor notes**:
  - **HR-04-HYDE**: BT 159 (Mitsein/Fürsorge); rhetorical-ethical disposition (cf. Hyde Call of Conscience 57-64).

### Schicksal / Geschick

- **Language**: German
- **Primary English in volume**: fate / destiny
- **In Subject Index**: no
- **Contributors**: HR-07-POGGELER (1 unit)
- **Pages by unit**: HR-07-POGGELER: 168
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Schicksal
- **Contributor notes**:
  - **HR-07-POGGELER**: BT historicity terms: 'Since individuals are called to their fates (Schicksal), the generation and the people should be delivered over to a common destiny (Geschick)'

### Unbestimmtheit

- **Language**: German
- **Primary English in volume**: indeterminacy / indeterminate
- **Variants encountered**: Unbestimmtheit / Unbestimmten
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-B (1 unit)
- **Pages by unit**: HR-01-GROSS-B: 37
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Unbestimmtheit
- **Contributor notes**:
  - **HR-01-GROSS-B**: From GA 18 253. The most-fearsome are most-indeterminate.

### Unheimlichkeit

- **Language**: German
- **Primary English in volume**: uncanniness / when uncanny
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-B (1 unit)
- **Pages by unit**: HR-01-GROSS-B: 37
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Unheimlichkeit
- **Contributor notes**:
  - **HR-01-GROSS-B**: From GA 18 261. 'Wenn uns unheimlich ist, fangen wir an zu reden.' German verbatim retained.

### Volk

- **Language**: German
- **Primary English in volume**: Folk, people
- **In Subject Index**: no
- **Contributors**: HR-06-KISIEL (1 unit)
- **Pages by unit**: HR-06-KISIEL: 152, 158
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Volk
- **Contributor notes**:
  - **HR-06-KISIEL**: Implicit in Folk-and-Earth diagnosis.

### Wirklichkeit

- **Language**: German
- **Primary English in volume**: reality / actuality
- **In Subject Index**: no
- **Contributors**: HR-03-MICHALSKI (1 unit)
- **Pages by unit**: HR-03-MICHALSKI: 71
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Wirklichkeit
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Heidegger rejects this rendering for energeia as too well-worn (GA 18 70). Translator's German parenthetical.

---

### B. Greek lemmas — 57 entries

### pathos / pathē

- **Language**: Greek
- **Primary English in volume**: passions / pathos
- **Alternative renderings**: Affekt (German), Affekte (German Lutheran tradition), Befindlichkeit (German correlate at GA 18.122), Befindlichkeit (German), Bewegtsein / bewegt wird (German correlate), Stimmung (German), affective desire (thymos = 'heart'), attunement (Befindlichkeit), attunement (Befindlichkeit) — Heidegger's preferred, capacity for feeling / pathic capacity, emotion / passion (sing. and pl.), fundamental possibilities by which Dasein primarily orients itself, is attuned (n. 18 = GA 18, 117), passion / emotion / affect / mood, passion / emotion / mood, passion / emotion / pathos, passions / fundamental possibilities of orientation, passive / undergoing / undergone, pathos / one's feeling of attunement
- **Variants encountered**: pathetikos / pathesis, pathos, pathos / pathe, pathos / pathē, pathē / pathos, pathē / pathos / pathē-tic, pathētikon
- **In Subject Index (book pp. 193–195)**: YES — head *Mood*, pages: 2, 4, 7, 84-85, 136, 167, 169
- **Contributors**: HR-01-GROSS-A, HR-01-GROSS-B, HR-02-GADAMER, HR-03-MICHALSKI, HR-04-HYDE, HR-05-STRUEVER, HR-06-KISIEL, HR-07-POGGELER (8 units)
- **Pages by unit**: HR-01-GROSS-A: 12-13, 2, 20, 25, 26-27, 4, 9; HR-01-GROSS-B: 27, 30, 33, 35, 36, 37, 38, 39, 40, 41, 44 (note 47); HR-02-GADAMER: 48, 57-59 (IV), 60 (hexis-formula); HR-03-MICHALSKI: 75; HR-04-HYDE: 83, 85, 88, 90, 91, 93, 95; HR-05-STRUEVER: 107, 108, 109, 112, 113, 116; HR-06-KISIEL: throughout; HR-07-POGGELER: 169
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → pathos
  - `bcap_pipeline`: bcap-greek-appendix.md → pathos
- **Contributor notes**:
  - **HR-01-GROSS-A**: Gross explicitly notes pathos is 'variously "passion," "affect," "mood," or "emotion"' (p.4) — flags translation as contested. Heidegger renders Aristotelian pathe as Befindlichkeit at GA 18.122.
  - **HR-01-GROSS-A**: Member of the kinesis-defining dyad with poietikos.
  - **HR-01-GROSS-B**: Volume's central Greek term. Gross retains Greek throughout.
  - **HR-02-GADAMER**: The interview's central Greek term in Section IV. Gadamer's 1923 confession (p. 48): 'the *pathē* doctrine ... that topic I did not understand at the time. I was still too immature for that.' The retrospective recovery in Section IV constitutes the interview's philosophical core.
  - **HR-03-MICHALSKI**: Heidegger translates Aristotle's pathos as Befindlichkeit (attunement) (GA 18 4, 120, 168). Designated as historical impulse for existential-ontological thematization of Dasein's attunement.
  - **HR-04-HYDE**: Often paired with parenthetical pathē in italics. Aligned with Stimmung.
  - **HR-05-STRUEVER**: GA 18 184 (hexis as Wie des pathos), 207 (eidos der pathē). Cf. *thymos* (128) as 'affective desire,' 'heart.'
  - **HR-06-KISIEL**: Most-cited Greek term in essay.
  - **HR-07-POGGELER**: Heidegger gloss: pathos = Befindlichkeit; Pöggeler reads this as the moment of restriction (rhetorical pathos dissolved into existential attunement)
  - **HR-07-POGGELER**: GA 18 close; the pathetic-as-relegated-to-attunement

### logos / legein

- **Language**: Greek
- **Primary English in volume**: speaking
- **Alternative renderings**: Rede (German correlate via Heidegger), language (Heidegger's translation Gadamer was 'completely puzzled' by), logos / speech / reason, reason (the Marburg Neo-Kantian translation, rejected), speech / reason / articulation / discourse, speech / reason / logos, speech / speaking / saying, speech / speaking; not reason, speech, reason, account, articulation, the spoken / that which has been expressed
- **Variants encountered**: legein, legomenon, logos, logos / legein, logos / legein / lēgein
- **In Subject Index (book pp. 193–195)**: YES — head *Articulation*, pages: 2, 107, 110, 125
- **Contributors**: HR-01-GROSS-A, HR-01-GROSS-B, HR-02-GADAMER, HR-03-MICHALSKI, HR-05-STRUEVER, HR-06-KISIEL, HR-07-POGGELER (7 units)
- **Pages by unit**: HR-01-GROSS-A: 11, 12-13, 2, 27, 3, 4, 9; HR-01-GROSS-B: 27, 30, 31, 32, 33, 34, 36, 37, 38; HR-02-GADAMER: 47, 57, 60; HR-03-MICHALSKI: 75; HR-05-STRUEVER: 108, 109, 118; HR-06-KISIEL: throughout; HR-07-POGGELER: 167
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → logos
  - `bcap_pipeline`: bcap-greek-appendix.md → logos
  - `bt_pipeline`: bt-german-appendix.md → Logos
- **Contributor notes**:
  - **HR-01-GROSS-A**: Gross uses 'articulation' as one rendering at p.2 (in BT-glossary list).
  - **HR-01-GROSS-B**: Volume's central Greek term.
  - **HR-02-GADAMER**: Explicitly contested. Marburg Neo-Kantianism translated logos as 'reason'; Heidegger translated as 'speaking/language'; Gadamer recapitulates at p. 57: 'I remember how he said, "logos," and I was completely puzzled that it should mean "language" and not "reason."'
  - **HR-03-MICHALSKI**: Logos in its first structural moment — speaking-as-accessing/addressing/showing-forth, including listening and self-expression.
  - **HR-03-MICHALSKI**: Logos in its second structural moment.
  - **HR-05-STRUEVER**: GA 18 165; logos as horismos (36) is non-alltäglich.
  - **HR-06-KISIEL**: Pervasive.
  - **HR-07-POGGELER**: Heidegger: 'Logos, as speech, makes something clear, lets something be seen; in contrast to a proposition — a request, for example — logos inserts us into a situation and makes it clear'

### phronēsis

- **Language**: Greek
- **Primary English in volume**: practical wisdom
- **Alternative renderings**: Gewissen (Heidegger 1922 translation), a whole virtue; not an ability, but a being, good sense, goodness, and good will (Rhetoric 2.1, 1378a10), practical wisdom / prudence, practical wisdom, prudence, the practically wise person, the statesman
- **Variants encountered**: phronesis, phronesis kai arete kai eunoia, phronimos, phronēsis
- **In Subject Index (book pp. 193–195)**: YES — head *Practical knowledge, reason, wisdom*, pages: 7, 12, 61, 80, 82, 90, 91, 111, 139, 144, 146, 149, 150, 151, 165
- **Contributors**: HR-01-GROSS-A, HR-02-GADAMER, HR-04-HYDE, HR-05-STRUEVER, HR-06-KISIEL, HR-07-POGGELER (6 units)
- **Pages by unit**: HR-01-GROSS-A: 12, 7; HR-02-GADAMER: 48 (1923 seminar), 61; HR-04-HYDE: 81, 84, 90, 91; HR-05-STRUEVER: 111; HR-06-KISIEL: 139, 144, 144-146, 150, 151, 157 (note 8); HR-07-POGGELER: 165
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → phronesis
  - `bcap_pipeline`: bcap-greek-appendix.md → phronēsis
- **Contributor notes**:
  - **HR-01-GROSS-A**: Vico-Gadamer-Heidegger recovery.
  - **HR-02-GADAMER**: Closing-section thesis: phronēsis is a virtue (hexis), not an ability (technē or dynamis-as-skill). Foundational to the rhetoric-ethics-politics tie.
  - **HR-04-HYDE**: Hyde activates the phronesis-phren etymology (phren = the heart). Identified by Heidegger with Gewissen (Taminiaux).
  - **HR-05-STRUEVER**: GA 18 183. Hexis-pivoted virtue.
  - **HR-06-KISIEL**: Central virtue across Sections I, V, VII.
  - **HR-06-KISIEL**: Standard.
  - **HR-06-KISIEL**: Aristotelian trio that returns in Arendt's Kantian-cosmopolitan ethos.
  - **HR-07-POGGELER**: 1922 Natorp-Bericht: phronēsis 'characterized as conscience (Gewissen), in so doing discrediting metaphysical reason'

### doxa

- **Language**: Greek
- **Primary English in volume**: opinions
- **Alternative renderings**: Ansicht / Ansehen (Arendt's German rendering), Glaube / Ansicht (German correlate), Glaube / Ansicht (German correlates), belief / opinion, belief / pretheoretical disposition, opinion, view, common sense (also: splendor, fame, repute), received opinion / belief
- **Variants encountered**: doxa, doxa / doxai / dokein
- **In Subject Index (book pp. 193–195)**: YES — head *Belief*, pages: 2, 30-34, 40, 45 n.48, 85, 107, 112, 123, 134, 137, 141, 145, 147, 148, 155-156
- **Contributors**: HR-01-GROSS-A, HR-01-GROSS-B, HR-04-HYDE, HR-06-KISIEL, HR-07-POGGELER (5 units)
- **Pages by unit**: HR-01-GROSS-A: 2; HR-01-GROSS-B: 30, 31, 32, 33; HR-04-HYDE: 85; HR-06-KISIEL: 134, 137, 147-148, 155; HR-07-POGGELER: 169
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `bcap_pipeline`: bcap-greek-appendix.md → doxa
- **Contributor notes**:
  - **HR-01-GROSS-A**: Paired with Glaube at p.2.
  - **HR-01-GROSS-B**: Gross emphatically resists 'opinion' — see paragraph re Thales-as-doxa-not-mind-set on p. 31.
  - **HR-04-HYDE**: Quoted in German alongside transliteration: 'Die doxa ist die eigentliche Entdecktheit des Miteinanderseins-in-der-Welt' (GA 18 [149]).
  - **HR-06-KISIEL**: Twofold sense critical for Section IX (Arendt): doxa as opinion AND doxa as space-of-appearance/repute.
  - **HR-07-POGGELER**: Aristotle Rhet.: 'an ability to share the opinions (doxa) of others'

### dynamis

- **Language**: Greek
- **Primary English in volume**: power / capacity / potentiality
- **Alternative renderings**: faculty / power / capacity, potential, potentiality / power / capacity, power, power, capacity, capacity-for-X, the human capacity for speaking-and-understanding
- **In Subject Index (book pp. 193–195)**: YES — head *dynamis*, pages: 16, 21, 49, 60, 84, 106, 108, 111, 112, 116, 120, 146
- **Contributors**: HR-01-GROSS-A, HR-02-GADAMER, HR-04-HYDE, HR-05-STRUEVER, HR-06-KISIEL (5 units)
- **Pages by unit**: HR-01-GROSS-A: 15, 20, 6; HR-02-GADAMER: 49 (II), 60 (IV), 61; HR-04-HYDE: 84; HR-05-STRUEVER: 106, 108, 111, 112, 120, 126; HR-06-KISIEL: 146
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → dynamis
- **Contributor notes**:
  - **HR-01-GROSS-A**: Gadamer's preferred Aristotelian definition of rhetoric (Ch 2 reference); also central to Physics 202b23.
  - **HR-02-GADAMER**: The volume's central Greek term. Gadamer's preferred Aristotelian definition of rhetoric. The phrase 'It is the same dynamis!' (p. 60) identifies rhetorical dynamis with hermeneutic understanding.
  - **HR-04-HYDE**: p. 84: rhetoric is 'a faculty or power (dynamis) in its nascent state, a potential for acting and doing.' Echoes Gadamer's volume-thesis.
  - **HR-05-STRUEVER**: Crucial to P3. *dynamis tou theoresai* (Rhet. 1355b26 / GA 18 122) glossed as 'potentiality for theorizing.' Aligns with Gadamer (HR-02) on *dynamis* vs. *technē*.
  - **HR-06-KISIEL**: Critical centrality: rhetoric is 'first not art but power, dynamis.' Cross-references Gadamer Ch 2 dynamis-vs-techne dispute.

### energeia

- **Language**: Greek
- **Primary English in volume**: actuality / being-at-work
- **Alternative renderings**: actuality / completion, being-at-work (Im-Werke-Sein), being-at-work (Im-Werke-Sein) — Heidegger's preferred, reality (Wirklichkeit) — rejected as too well-worn, vividness / actuality
- **Variants encountered**: energeia, energeia / entelecheia
- **In Subject Index (book pp. 193–195)**: YES — head *energeia*, pages: 35, 49, 71, 106, 111, 112
- **Contributors**: HR-01-GROSS-B, HR-02-GADAMER, HR-03-MICHALSKI, HR-05-STRUEVER, HR-06-KISIEL (5 units)
- **Pages by unit**: HR-01-GROSS-B: 35; HR-02-GADAMER: 49 (II); HR-03-MICHALSKI: 71, 79; HR-05-STRUEVER: 106, 108, 111, 112, 126; HR-06-KISIEL: [implicit]
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → energeia
  - `bcap_pipeline`: bcap-greek-appendix.md → energeia
- **Contributor notes**:
  - **HR-01-GROSS-B**: Used in Roman-rhetorical sense at p. 35: 'present a murder scenario with the proper energeia, or vividness.'
  - **HR-02-GADAMER**: Gadamer's gloss: 'Heidegger ... began emphatically using the concept of energeia. And so he associated the concept of dynamis with the concept of energeia, and missed the other one.' The energeia-dynamis pairing is from Met. Theta.
  - **HR-03-MICHALSKI**: Note 12 (GA 18 70): 'If our expression reality [Wirklichkeit] were not so well worn, it would be an excellent translation' — over-familiarity (Abgegriffenheit) of word as decisive criterion for rejecting translation. Heidegger substitutes Im-Werke-Sein in the sense of distinctive 'how' (ausgezeichneten Wie) of being.
  - **HR-05-STRUEVER**: GA 18 195; counter-term to dynamis in potency/act lexicon.
  - **HR-06-KISIEL**: Implicit in dynamis-context.

### kairos

- **Language**: Greek
- **Primary English in volume**: (opportune) moment
- **Alternative renderings**: Augenblick, Augenblick (German correlate), appropriate strategy, opportune moment, timely-moment, quod decet (Latin), the critical/opportune moment, the right moment / opportune moment, the right word at the right moment (per Plato Statesman, n. 28), timely moment (preferred), timely moment / authentic kairos / telos according to the kairos, to prepon (Greek)
- **Variants encountered**: kairos, kairos / im eigentlichen kairos / telos kata ton kairon
- **In Subject Index (book pp. 193–195)**: YES — head *Moment*, pages: 2, 33-34, 37, 110-111, 112, 120, 123, 125, 143, 149, 150
- **Contributors**: HR-01-GROSS-A, HR-01-GROSS-B, HR-02-GADAMER, HR-05-STRUEVER, HR-06-KISIEL (5 units)
- **Pages by unit**: HR-01-GROSS-A: 2; HR-01-GROSS-B: 33, 34, 37; HR-02-GADAMER: 60 (IV); HR-05-STRUEVER: 110, 111, 112, 119, 120, 123, 124, 125, 126; HR-06-KISIEL: 143, 146, 150
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `bcap_pipeline`: bcap-greek-appendix.md → kairos
- **Contributor notes**:
  - **HR-01-GROSS-A**: Paired with Augenblick at p.2 BT-glossary.
  - **HR-01-GROSS-B**: Gross binds to krisis and Augenblick; pathos provides logos with 'a critical moment, kairos.'
  - **HR-02-GADAMER**: Implicit Greek; named via Plato Statesman ('how to find the right word at the right moment'). The kairos-moment of speech is what rhetorical dynamis must see.
  - **HR-05-STRUEVER**: GA 18 140, 144, 189. Struever's signature term — 'rarely translated into Greek' but central to Heidegger's *Grundbegriffe* account.
  - **HR-06-KISIEL**: Standard.

### krisis / krinein

- **Language**: Greek
- **Primary English in volume**: decision / judgment
- **Alternative renderings**: (critical) judgement / decision, Entschluss (German correlate), discriminating, judging / decision, judgement / judgements, judgment / decisive moment
- **Variants encountered**: krinein / krisis, krisis, krisis / kriseis
- **In Subject Index (book pp. 193–195)**: YES — head *Decision*, pages: 2, 36
- **Contributors**: HR-01-GROSS-A, HR-01-GROSS-B, HR-04-HYDE, HR-05-STRUEVER, HR-06-KISIEL (5 units)
- **Pages by unit**: HR-01-GROSS-A: 2, 9; HR-01-GROSS-B: 30, 36; HR-04-HYDE: 82, 86, 95; HR-05-STRUEVER: 108, 123; HR-06-KISIEL: 133, 143, 146
- **Contributor notes**:
  - **HR-01-GROSS-A**: p.9: 'pathos provides the very ground for critical judgement (krisis)'.
  - **HR-01-GROSS-B**: GA 18 169 (krinein); 'krisis' as decisive moment p. 36. Gross binds krisis-and-kairos.
  - **HR-04-HYDE**: Used at p. 82 ('judgment'), p. 86 (rhetoric exhorting to 'an active krisis or decision') with GA 18 [122f] anchor.
  - **HR-05-STRUEVER**: Rhet. 1378a19–21.
  - **HR-06-KISIEL**: Standard.

### phobos

- **Language**: Greek
- **Primary English in volume**: fear
- **Alternative renderings**: Furcht (German correlate), Furcht (German), fear / fearsome ones / gentle / ironic, fear of death, timor (Latin)
- **Variants encountered**: phobos, phobos / phoberoi / praoi / eirōnes
- **In Subject Index (book pp. 193–195)**: YES — head *Fear*, pages: 2, 35, 58, 87, 109, 169
- **Contributors**: HR-01-GROSS-B, HR-02-GADAMER, HR-04-HYDE, HR-05-STRUEVER, HR-07-POGGELER (5 units)
- **Pages by unit**: HR-01-GROSS-B: 34; HR-02-GADAMER: 57 (GA 18, 289), 58 (GA 18, 261; uncanny-fear); HR-04-HYDE: 87; HR-05-STRUEVER: 109, 114; HR-07-POGGELER: 167
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → phobos
  - `bcap_pipeline`: bcap-greek-appendix.md → phobos
- **Contributor notes**:
  - **HR-01-GROSS-B**: Aristotle's Rhetoric II.5 term. Gross uses parenthetically.
  - **HR-02-GADAMER**: Implicit Greek; the Aristotelian phobos-doctrine (Rhet. II.5) is the substrate for Heidegger's GA 18, 289 'discussion of the being of beings out of a fear that it will at some point no longer be' — a striking claim that Greek ontology itself emerges from phobos.
  - **HR-04-HYDE**: Aristotle's pathos analyzed in detail.
  - **HR-05-STRUEVER**: GA 18 246–263. Most-developed Aristotelian pathos in SS 1924.
  - **HR-07-POGGELER**: Aristotle Rhet. II.5; Heidegger absorbs into BT §30

### technē

- **Language**: Greek
- **Primary English in volume**: art, craft
- **Alternative renderings**: a very general expression, if one did not mean mathematics specifically, art / craft / skill, art / craft / skill (rejected for rhetoric), art / craft / technique
- **Variants encountered**: techne, technē
- **In Subject Index (book pp. 193–195)**: YES — head *technē*, pages: 49, 61, 106, 108, 115, 118, 139
- **Contributors**: HR-01-GROSS-A, HR-02-GADAMER, HR-05-STRUEVER, HR-06-KISIEL (4 units)
- **Pages by unit**: HR-01-GROSS-A: 12, 8; HR-02-GADAMER: 49 (II), 61; HR-05-STRUEVER: 106, 108, 114, 115, 118, 126; HR-06-KISIEL: 139, 146
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → techne
- **Contributor notes**:
  - **HR-01-GROSS-A**: Cited in 'systematic treatise on rhetorical techne' (p.8) — Gadamer rejects this construal.
  - **HR-02-GADAMER**: Explicitly contested. Heidegger's GA 18, 114 calls the *technē*-designation of rhetoric 'incorrect.' Gadamer affirms but offers a subtle correction: technē as a 'very general expression' that Heidegger may have abandoned too cleanly.
  - **HR-05-STRUEVER**: Heidegger's 'inauthentic definition' of rhetoric (GA 18 114). Struever's P3 articulates the rejection.
  - **HR-06-KISIEL**: Rejected definition of rhetoric (per Gadamer, Aubenque, Kisiel).

### ēthos

- **Language**: Greek
- **Primary English in volume**: character
- **Alternative renderings**: Haltung (German), abode/dwelling place (Heidegger via Heraclitus), character / abode / dwelling place, character, bearing, comportment, abode/usage (later Heidegger), ethos / attitude
- **Variants encountered**: ethos
- **In Subject Index (book pp. 193–195)**: YES — head *ethos*, pages: 107, 108, 133, 135, 136, 138, 140, 144-146, 148, 149, 155, 169
- **Contributors**: HR-01-GROSS-A, HR-02-GADAMER, HR-06-KISIEL, HR-07-POGGELER (4 units)
- **Pages by unit**: HR-01-GROSS-A: 19; HR-02-GADAMER: 60 (n. 27 = GA 18, 165); HR-06-KISIEL: 133, 144-148; HR-07-POGGELER: 169
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → ethos
  - `bcap_pipeline`: bcap-greek-appendix.md → ēthos
- **Contributor notes**:
  - **HR-01-GROSS-A**: Heidegger Letter on Humanism: 'ethos means "abode" or "dwelling place" [Heraclitus Frag. 119]' — Gross flags this redefinition.
  - **HR-02-GADAMER**: In the hexis-formula: 'Ethos and pathē are constitutive of legein itself.' Ethos is paired with pathē under hexis.
  - **HR-06-KISIEL**: Two registers: Aristotelian-rhetorical (character of speaker) AND Heraclitean-late-Heidegger (haunt/abode/Brauch).
  - **HR-07-POGGELER**: Heidegger gloss: ethos = Haltung

### poiēsis / poiētikon

- **Language**: Greek
- **Primary English in volume**: production, making
- **Alternative renderings**: Bewegendes (German correlate), active / making / poetic, bringing-forth / poetic act, capacity for creativity / poetic capacity, production / creativity
- **Variants encountered**: poiesis, poietikos, poiēsis, poiētikon
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-04-HYDE, HR-06-KISIEL, HR-07-POGGELER (4 units)
- **Pages by unit**: HR-01-GROSS-A: 20, 25; HR-04-HYDE: 96; HR-06-KISIEL: 139; HR-07-POGGELER: 169, 171
- **Cross-pipeline links**:
  - `bcap_pipeline`: bcap-greek-appendix.md → poiēsis
- **Contributor notes**:
  - **HR-01-GROSS-A**: Member of the kinesis-defining dyad with pathetikos.
  - **HR-04-HYDE**: Late-Heideggerian alternative to epideixis (Hyde flags the contrast).
  - **HR-06-KISIEL**: Coupled with techne in NE VI.
  - **HR-07-POGGELER**: GA 18 close; capacity-of-kinēsis distinction
  - **HR-07-POGGELER**: BT's emphasis: 'practice for Aristotle is primarily poiesis or creativity'; Letter on Humanism's first sentence: Vollbringen as poiēsis

### praxis

- **Language**: Greek
- **Primary English in volume**: practice
- **Alternative renderings**: action / practice, in-der-Welt-sein (German), practical action, life of action, practice / action
- **Variants encountered**: praxis, praxis / praktike
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-05-STRUEVER, HR-06-KISIEL, HR-07-POGGELER (4 units)
- **Pages by unit**: HR-01-GROSS-A: 6, 7; HR-05-STRUEVER: 111, 118; HR-06-KISIEL: 139, 154; HR-07-POGGELER: 169
- **Cross-pipeline links**:
  - `bcap_pipeline`: bcap-greek-appendix.md → praxis
- **Contributor notes**:
  - **HR-01-GROSS-A**: Gadamer's T&M citation: 'theory is subsequent to praxis.'
  - **HR-05-STRUEVER**: GA 18 180. 'Life as praxis has nothing to do with technē' (183).
  - **HR-06-KISIEL**: Standard.
  - **HR-07-POGGELER**: Heidegger reads Aristotelian praxis as in-der-Welt-sein, but emphasizes poiesis

### rhētorikē

- **Language**: Greek
- **Primary English in volume**: rhetoric
- **Alternative renderings**: Rhetorik (German)
- **Variants encountered**: rhetorike / rhetorica, rhētorikē, rhētorikē / Rhetorik
- **In Subject Index**: no
- **Contributors**: HR-02-GADAMER, HR-03-MICHALSKI, HR-06-KISIEL, HR-07-POGGELER (4 units)
- **Pages by unit**: HR-02-GADAMER: throughout; HR-03-MICHALSKI: 66, 67, 77; HR-06-KISIEL: throughout; HR-07-POGGELER: 161 throughout
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → rhetorike
- **Contributor notes**:
  - **HR-02-GADAMER**: The volume's master term. In this essay translations across Greek/German/English are stable.
  - **HR-03-MICHALSKI**: Aristotle's rhetoric as the practical possibility of seeing what speaks for the subject matter for whoever is resolved to convince others (GA 18 114f); a predecessor of Heideggerian philology only insofar as it maintains theoretical character.
  - **HR-06-KISIEL**: Standard.
  - **HR-07-POGGELER**: The volume's titular concept; for Pöggeler the object Heidegger restricts

### endoxa / endoxon

- **Language**: Greek
- **Primary English in volume**: shared opinion
- **Alternative renderings**: good reputation, recognition, common opinion, opinion / shared opinions
- **Variants encountered**: doxa / endoxa, endoxon
- **In Subject Index (book pp. 193–195)**: YES — head *endoxa*, pages: 107, 112, 115, 123, 125, 143, 169
- **Contributors**: HR-05-STRUEVER, HR-06-KISIEL, HR-07-POGGELER (3 units)
- **Pages by unit**: HR-05-STRUEVER: 107, 108, 115, 120, 123; HR-06-KISIEL: 143; HR-07-POGGELER: 169
- **Cross-pipeline links**:
  - `bcap_pipeline`: bcap-greek-appendix.md → doxa
- **Contributor notes**:
  - **HR-05-STRUEVER**: GA 18 136–158 lectures. 'Die doxa ist die Weise, in der wir das Leben in seiner Alltäglichkeit da haben' (138).
  - **HR-06-KISIEL**: Telos of bios politikos.
  - **HR-07-POGGELER**: Aristotle Rhet.: 'The speaker must set out from a shared opinion (endoxon) and return to it'

### hexis

- **Language**: Greek
- **Primary English in volume**: (untranslated — kept as 'hexis')
- **Alternative renderings**: habit, disposition / virtue, excellence, settled disposition / way of being
- **Variants encountered**: hexis, hexis / arete
- **In Subject Index (book pp. 193–195)**: YES — head *hexis*, pages: 35, 60, 111-112, 139
- **Contributors**: HR-01-GROSS-B, HR-02-GADAMER, HR-06-KISIEL (3 units)
- **Pages by unit**: HR-01-GROSS-B: 35, 36 (in German verbatim); HR-02-GADAMER: 60 (n. 27 = GA 18, 165); HR-06-KISIEL: 139
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → hexis
  - `bcap_pipeline`: bcap-greek-appendix.md → hexis
- **Contributor notes**:
  - **HR-01-GROSS-B**: Kept untranslated; German renders unchanged. Latin tradition would say habitus.
  - **HR-02-GADAMER**: Heidegger SS 1924's framework for ethos+pathē as constitutive of legein. The hexis-formula bridges Aristotle Rhet. II to GA 18's Mitsein-thesis.
  - **HR-06-KISIEL**: NE VI five excellent habits framework.

### kinēsis

- **Language**: Greek
- **Primary English in volume**: motion / movement
- **Alternative renderings**: Bewegung (German correlate), Bewegung (German), motion / change / being-moved, movement / motion
- **Variants encountered**: kinesis, kinēsis, kinēsis (Bewegung)
- **In Subject Index (book pp. 193–195)**: YES — head *Motion*, pages: 20-21, 78 n.8, 80 n.22, 108-109, 169
- **Contributors**: HR-01-GROSS-A, HR-05-STRUEVER, HR-07-POGGELER (3 units)
- **Pages by unit**: HR-01-GROSS-A: 13, 20-22; HR-05-STRUEVER: 106, 108, 109, 286; HR-07-POGGELER: 169
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → kinesis
  - `bcap_pipeline`: bcap-greek-appendix.md → kinēsis
- **Contributor notes**:
  - **HR-01-GROSS-A**: Heidegger renders Physics 202b23 with German Bewegung-derivatives.
  - **HR-05-STRUEVER**: GA 18 286. Central concept; Physics 200b12 anchor.
  - **HR-07-POGGELER**: Heidegger at close of GA 18: 'movement as kinēsis possesses both a poiētikon (capacity for creativity) and a pathētikon (capacity for feeling)'

### pistis / pisteis

- **Language**: Greek
- **Primary English in volume**: proof
- **Alternative renderings**: belief / proofs / believing-toward, trust, persuasion, proof (the three modes of persuasion)
- **Variants encountered**: pisteis, pistis / pisteis, pistis / pisteis / pisteuein
- **In Subject Index (book pp. 193–195)**: YES — head *Proof*, pages: 107, 109, 123, 136, 150
- **Contributors**: HR-01-GROSS-B, HR-05-STRUEVER, HR-06-KISIEL (3 units)
- **Pages by unit**: HR-01-GROSS-B: 32; HR-05-STRUEVER: 107, 109; HR-06-KISIEL: 136, 144-145
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → pistis
  - `bcap_pipeline`: bcap-greek-appendix.md → pistis
- **Contributor notes**:
  - **HR-01-GROSS-B**: Standard Aristotelian term. 'Out of doxa we can articulate the common concerns of a community, and upon doxa we can build a proof (pisteis).'
  - **HR-05-STRUEVER**: GA 18 118.
  - **HR-06-KISIEL**: Equiprimordiality with aletheia is Section V's central thesis.

### polis

- **Language**: Greek
- **Primary English in volume**: city
- **Alternative renderings**: polis (city, state, historical site), polis / city
- **In Subject Index (book pp. 193–195)**: YES — head *polis*, pages: 14, 16-17, 84, 106, 114
- **Contributors**: HR-01-GROSS-A, HR-04-HYDE, HR-06-KISIEL (3 units)
- **Pages by unit**: HR-01-GROSS-A: 11, 13-15; HR-04-HYDE: 84, 85; HR-06-KISIEL: throughout, especially 132, 149, 151-152
- **Translation contested in volume**: yes
- **Contributor notes**:
  - **HR-01-GROSS-A**: Section II's titular term.
  - **HR-04-HYDE**: Standard usage; the political space in which rhetoric operates.
  - **HR-06-KISIEL**: Three phase-specific senses (Phenomenological/Metontological/Archaic-Poietic) — table on p. 149.

### entelecheia

- **Language**: Greek
- **Primary English in volume**: completion / fulfilment / actuality
- **Alternative renderings**: Possession of completeness (Besitz der Vollkommenheit) — rejected, completion / actuality-in-completion, holding-itself-in-completion (Sich-im-Fertigsein-Halten), holding-itself-in-completion (Sich-im-Fertigsein-Halten) — Heidegger's preferred
- **Variants encountered**: entelecheia, entelecheia / entelechia
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-03-MICHALSKI, HR-05-STRUEVER (3 units)
- **Pages by unit**: HR-01-GROSS-A: 20; HR-03-MICHALSKI: 72, 79; HR-05-STRUEVER: 106, 111
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → entelecheia
  - `bcap_pipeline`: bcap-greek-appendix.md → entelecheia
- **Contributor notes**:
  - **HR-01-GROSS-A**: Physics 202b23 quotation: 'Kinesis: entelecheia tou dynamei poietikou kai pathetikou'.
  - **HR-03-MICHALSKI**: Aristotelian neologism from enteles + echein (note 13 = GA 18 368). Heidegger rejects 'Possession of completeness' as failing to convey ontologically fundamental meaning. Diels consulted for etymology.
  - **HR-05-STRUEVER**: GA 18 195.

### enthymēma / enthymeisthai

- **Language**: Greek
- **Primary English in volume**: enthymeme
- **Alternative renderings**: enthymeme (literally 'to the heart'), enthymeme / premises, taking something to heart / giving consideration, taking to heart (cf. Heidegger sich etwas zu Herzen nehmen)
- **Variants encountered**: enthymeisthai, enthymema / en-thymos, enthymema / protaseis, enthymēma
- **In Subject Index**: no
- **Contributors**: HR-04-HYDE, HR-05-STRUEVER, HR-06-KISIEL (3 units)
- **Pages by unit**: HR-04-HYDE: 88-90, 89; HR-05-STRUEVER: 107; HR-06-KISIEL: 137
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → enthymema
- **Contributor notes**:
  - **HR-04-HYDE**: Section II concept.
  - **HR-04-HYDE**: Verbal form; Hyde reads it dually (cognitive AND emotional).
  - **HR-05-STRUEVER**: GA 18 133–134.
  - **HR-06-KISIEL**: Kisiel emphasizes etymology en-thymos = 'to the heart' = striking examples, sound bites, narrative arguments.

### telos

- **Language**: Greek
- **Primary English in volume**: end / goal
- **Alternative renderings**: end (Ende) in the sense of completion — Heidegger's preferred, end / completion, end, goal, completion, goal (Ziel) — rejected as primary, purpose (Zweck) — rejected as primary
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-03-MICHALSKI, HR-06-KISIEL (3 units)
- **Pages by unit**: HR-01-GROSS-A: 8; HR-03-MICHALSKI: 71; HR-06-KISIEL: throughout
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → telos
- **Contributor notes**:
  - **HR-01-GROSS-A**: p.8: 'theoretical telos upon the world'.
  - **HR-03-MICHALSKI**: Note 11 cites GA 18 39: 'The translation of telos by purpose or goal obviously has some basis... [but] one is permitted, at this level of the investigation into being, to mix up primary and derivative meanings.' Purpose and goal are founded on telos as end as primordial meaning (GA 18 85).
  - **HR-06-KISIEL**: Pervasive Aristotelian framing.

### apodeixis

- **Language**: Greek
- **Primary English in volume**: scientific proof
- **Alternative renderings**: the listener / the demonstrator
- **Variants encountered**: apodeixis, hypomenon / apodeiknys
- **In Subject Index (book pp. 193–195)**: YES — head *Demonstration*, pages: 120, 137, 169
- **Contributors**: HR-05-STRUEVER, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-05-STRUEVER: 114; HR-07-POGGELER: 169
- **Contributor notes**:
  - **HR-05-STRUEVER**: Met. 1006a24–26 per Cassin/Narcy.
  - **HR-07-POGGELER**: Rhetoric is 'a not a matter of scientific proof (apodeixis)'

### epistēmē

- **Language**: Greek
- **Primary English in volume**: rational knowledge
- **Alternative renderings**: scientific knowledge / science
- **In Subject Index (book pp. 193–195)**: YES — head *epistēmē*, pages: 112, 118, 139
- **Contributors**: HR-04-HYDE, HR-05-STRUEVER (2 units)
- **Pages by unit**: HR-04-HYDE: 84; HR-05-STRUEVER: 112, 117, 118
- **Cross-pipeline links**:
  - `bcap_pipeline`: bcap-greek-appendix.md → epistēmē
- **Contributor notes**:
  - **HR-04-HYDE**: Used at p. 84 contrasting Plato's noēsis-grounded epistēmē with rhetoric.
  - **HR-05-STRUEVER**: GA 18 324. Counter-term to rhetoric (which lacks Revisionsfähigkeit / has it). Cf. Wissen.

### koinōnia

- **Language**: Greek
- **Primary English in volume**: community
- **Alternative renderings**: Mitsein (German correlate), being-with / community
- **Variants encountered**: koinonia, koinōnia
- **In Subject Index (book pp. 193–195)**: YES — head *Being-with*, pages: 2, 4, 11, 13, 14-18, 27, 30, 40, 106, 113, 114, 120, 133, 141, 148
- **Contributors**: HR-01-GROSS-A, HR-06-KISIEL (2 units)
- **Pages by unit**: HR-01-GROSS-A: 11, 2; HR-06-KISIEL: [implicit, throughout]
- **Cross-pipeline links**:
  - `bcap_pipeline`: bcap-greek-appendix.md → koinōnia
- **Contributor notes**:
  - **HR-01-GROSS-A**: Aristotle Politics/Rhetoric term; rendered Mitsein.
  - **HR-06-KISIEL**: Implicit framework.

### phantasia

- **Language**: Greek
- **Primary English in volume**: imagination / vivid mental image
- **Alternative renderings**: thinking / imagination / sensation
- **Variants encountered**: noein / phantasia / aisthēsis, phantasia
- **In Subject Index (book pp. 193–195)**: YES — head *phantasia*, pages: 34, 109
- **Contributors**: HR-01-GROSS-B, HR-05-STRUEVER (2 units)
- **Pages by unit**: HR-01-GROSS-B: 34; HR-05-STRUEVER: 109, 113
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → phantasia
  - `bcap_pipeline`: bcap-greek-appendix.md → phantasia
- **Contributor notes**:
  - **HR-01-GROSS-B**: Quintilian Inst. or. 6.2.29. The Roman model Heidegger reverses.
  - **HR-05-STRUEVER**: GA 18 199, 202. 'Mind is not at all pure'; imagination is *Boden* of *noein*.

### physis / physei onta

- **Language**: Greek
- **Primary English in volume**: nature
- **Alternative renderings**: nature / nature-concepts, things-by-nature
- **Variants encountered**: physei onta, physis, physis / Naturbegriffe
- **In Subject Index (book pp. 193–195)**: YES — head *Nature*, pages: 14, 16-17, 25, 26, 106
- **Contributors**: HR-01-GROSS-A, HR-05-STRUEVER (2 units)
- **Pages by unit**: HR-01-GROSS-A: 12-15, 15-16; HR-05-STRUEVER: 106
- **Contributor notes**:
  - **HR-01-GROSS-A**: Heidegger reads Aristotle's physis as foundational; Gross thematizes.
  - **HR-01-GROSS-A**: GA 18.241 quotation.
  - **HR-05-STRUEVER**: Physics 200b12: archē kinēseōs kai metabolēs.

### topos / topoi

- **Language**: Greek
- **Primary English in volume**: places / topics
- **Alternative renderings**: Ort (German), commonplaces, loci (Latin), place, place / commonplaces / common topics, positions, Örter (German)
- **Variants encountered**: topoi, topoi / topos, topos, topos / topoi / koinoi topoi
- **In Subject Index (book pp. 193–195)**: YES — head *topos*, pages: 107, 146, 162-164, 173 n.6
- **Contributors**: HR-05-STRUEVER, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-05-STRUEVER: 107, 108; HR-07-POGGELER: 162, 163
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → topos
  - `bcap_pipeline`: bcap-greek-appendix.md → topos
- **Contributor notes**:
  - **HR-05-STRUEVER**: GA 18: topoi both as maxims and as principles of argument.
  - **HR-07-POGGELER**: Translator's note 6: 'Topos is "place" or "position" in Greek. "Topology" is the branch of mathematics which studies "positions on geometric configurations unaltered by elastic deformation." The metaphorical use of "topology" here suggests the search for those properties of Being unchanged by historical or other interpretation. Note that the appearance of "place" (Ort) in the German word for "discussion" (Erörterung) cannot be rendered in English. See footnote 46.' Pöggeler distinguishes Aristotelian topics (places-of-arguments) from Heidegger's Topologie (place of Being's properties)
  - **HR-07-POGGELER**: See entry on topoi/topos
  - **HR-07-POGGELER**: See entry on topoi/topos; central rhetorical-tradition term

### akouein / akroatēs

- **Language**: Greek
- **Primary English in volume**: hearing / hearer
- **Alternative renderings**: hearing / auditor
- **In Subject Index**: no
- **Contributors**: HR-05-STRUEVER, HR-06-KISIEL (2 units)
- **Pages by unit**: HR-05-STRUEVER: 114; HR-06-KISIEL: 141
- **Contributor notes**:
  - **HR-05-STRUEVER**: GA 18 104, 123.
  - **HR-06-KISIEL**: Standard.

### alētheia

- **Language**: Greek
- **Primary English in volume**: truth, unconcealment
- **Alternative renderings**: Unverborgenheit (German), truth (as unconcealment)
- **Variants encountered**: aletheia, alētheia
- **In Subject Index**: no
- **Contributors**: HR-06-KISIEL, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-06-KISIEL: 136, 138, 144; HR-07-POGGELER: 171
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → aletheia
  - `bt_pipeline`: bt-german-appendix.md → Aletheia
- **Contributor notes**:
  - **HR-06-KISIEL**: Three modes of trueing/unconcealment.
  - **HR-07-POGGELER**: Late Heidegger's truth-as-unconcealment; correlate of Unverborgenheit

### eidos

- **Language**: Greek
- **Primary English in volume**: appearance / form
- **Alternative renderings**: Aussehen (German correlate), Idea, Sichausnehmen (German), look / form / appearance
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-01-GROSS-A: 15, 21, 25-27; HR-07-POGGELER: 169, 170
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → eidos
- **Contributor notes**:
  - **HR-01-GROSS-A**: Heidegger renders eidos as Aussehen at GA 18.33; central to the 'house' passage.
  - **HR-07-POGGELER**: Heidegger: 'Wherever eidos, or appearance, must constantly be invoked, being is to be relegated to the horizon of the present'

### hoi aristoi / hoi polloi

- **Language**: Greek
- **Primary English in volume**: the many / the masses
- **Alternative renderings**: the few who excel / the many
- **Variants encountered**: hoi aristoi / hoi polloi, hoi polloi
- **In Subject Index**: no
- **Contributors**: HR-04-HYDE, HR-06-KISIEL (2 units)
- **Pages by unit**: HR-04-HYDE: 83; HR-06-KISIEL: 141
- **Contributor notes**:
  - **HR-04-HYDE**: p. 83 — 'the emotional outlook of the hoi polloi influences their judgment.'
  - **HR-06-KISIEL**: Distinguished from das Man as ontological-political categories.

### horismos / horizein

- **Language**: Greek
- **Primary English in volume**: definition
- **Alternative renderings**: verisimilar / true / visible / public-known / to define / definition
- **Variants encountered**: horismos, wahrscheinlich / Wahr / sichtbar / offenbar / horizein / horismos
- **In Subject Index**: no
- **Contributors**: HR-03-MICHALSKI, HR-05-STRUEVER (2 units)
- **Pages by unit**: HR-03-MICHALSKI: 67; HR-05-STRUEVER: 118
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → horismos
  - `bcap_pipeline`: bcap-greek-appendix.md → horismos
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Aristotelian definition: logos as horismos as logos ousias — what scholastic logic degenerated into mere thought-technique.
  - **HR-05-STRUEVER**: GA 18 36, 122, 136. Heidegger's discussion of definition in rhetorical-temporal mode.

### nous / noēsis

- **Language**: Greek
- **Primary English in volume**: intelligence / intellectual grasp
- **Alternative renderings**: pure intellect, contemplative seeing-of-being
- **Variants encountered**: nous, noēsis
- **In Subject Index**: no
- **Contributors**: HR-04-HYDE, HR-06-KISIEL (2 units)
- **Pages by unit**: HR-04-HYDE: 84; HR-06-KISIEL: 139, 141
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → nous
  - `bcap_pipeline`: bcap-greek-appendix.md → nous
- **Contributor notes**:
  - **HR-04-HYDE**: The Platonic high-level cognition contrasted with rhetoric.
  - **HR-06-KISIEL**: Aristotelian fifth excellent habit; Heidegger replaces with Lichtung (temporal clearing).

### ousia

- **Language**: Greek
- **Primary English in volume**: being, presence, real estate
- **Alternative renderings**: Anwesen / Habe, being / substance / existence, essence (Wesen) — rejected, existence (Dasein) in the sense of being available — Heidegger's preferred
- **In Subject Index**: no
- **Contributors**: HR-03-MICHALSKI, HR-06-KISIEL (2 units)
- **Pages by unit**: HR-03-MICHALSKI: 67, 69, 71; HR-06-KISIEL: 140
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → ousia
  - `bcap_pipeline`: bcap-greek-appendix.md → ousia
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Heidegger translates ousia 'not as essence (Wesen) but as existence (Dasein) in the sense of being available' (GA 18 25, 40). Bonitz's Index Aristotelicus consulted (GA 18 113f, 345).
  - **HR-06-KISIEL**: Heidegger's 'lifelong project' of replacing being-as-having with kairological language.

### politikē

- **Language**: Greek
- **Primary English in volume**: political (matters)
- **Alternative renderings**: politikē / political life
- **Variants encountered**: politike, politikē
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-01-GROSS-B (2 units)
- **Pages by unit**: HR-01-GROSS-A: 15-16; HR-01-GROSS-B: 40
- **Contributor notes**:
  - **HR-01-GROSS-A**: GA 18.241: 'man wandte sich ab auf die politike'.
  - **HR-01-GROSS-B**: Kept Greek. From GA 18 127.

### prohairesis

- **Language**: Greek
- **Primary English in volume**: choice
- **Alternative renderings**: prechoice, deliberate choice (a fundamental option in polity/policy)
- **In Subject Index**: no
- **Contributors**: HR-05-STRUEVER, HR-06-KISIEL (2 units)
- **Pages by unit**: HR-05-STRUEVER: 107, 123; HR-06-KISIEL: 146
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → prohairesis
- **Contributor notes**:
  - **HR-05-STRUEVER**: Aristotelian choice in NE III/Rhet.
  - **HR-06-KISIEL**: Aristotelian; ethos-translation in deliberative speech.

### rhētorikē dynamis tou theōrēsai

- **Language**: Greek
- **Primary English in volume**: rhetoric / rhetoric as potential for theorizing
- **Alternative renderings**: rhetoric, demiurge of persuasion / rhetoric: artificer of persuasion
- **Variants encountered**: rhetorike / rhetorike dynamis tou theoresai, rhetorike peithous demiourgos
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-05-STRUEVER (2 units)
- **Pages by unit**: HR-01-GROSS-A: 22; HR-05-STRUEVER: 108
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → rhetorike
- **Contributor notes**:
  - **HR-01-GROSS-A**: Plato's Gorgias formula Heidegger uses at GA 18.108.
  - **HR-05-STRUEVER**: Aristotle Rhet. 1355b26 / GA 18 122.

### soma

- **Language**: Greek
- **Primary English in volume**: body
- **Alternative renderings**: 'strange obtrusiveness' — Heidegger's preferred, Aufdringlichkeit (German rendering Heidegger proposes), Korperlichkeit (German rendering Heidegger flags as inadequate to soma), body / corporeality, materiality (Materialität) — rejected, stuffiness (Stofflichkeit) — rejected
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A, HR-03-MICHALSKI (2 units)
- **Pages by unit**: HR-01-GROSS-A: 13, 24; HR-03-MICHALSKI: 71
- **Translation contested in volume**: yes
- **Contributor notes**:
  - **HR-01-GROSS-A**: Heidegger explicitly contests 'Korper'-translation at GA 18.28 — Gross faithfully transmits the contestation.
  - **HR-03-MICHALSKI**: Heidegger refines body as not Stofflichkeit/Materialität but 'strange obtrusiveness' of a being detected in to son soma, su, soma = 'slave' or 'prisoner' (GA 18 28, 347).

### zōon logon echon / logon echein

- **Language**: Greek
- **Primary English in volume**: having-language / practical life with language
- **Alternative renderings**: having speech / animal possessing-and-possessed-by speech
- **Variants encountered**: logon echein / zoon logon echon, logon echon / zoē praktikē meta logon
- **In Subject Index**: no
- **Contributors**: HR-05-STRUEVER, HR-06-KISIEL (2 units)
- **Pages by unit**: HR-05-STRUEVER: 106; HR-06-KISIEL: 131, 153
- **Contributor notes**:
  - **HR-05-STRUEVER**: GA 18 105. Heidegger's defining phrase for human life.
  - **HR-06-KISIEL**: Aristotelian definition retained in transliteration.

### zōon politikon / bios politikos

- **Language**: Greek
- **Primary English in volume**: political animal / political life
- **Alternative renderings**: political existence / political life
- **Variants encountered**: bios politikos, zoon politikon
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-B, HR-06-KISIEL (2 units)
- **Pages by unit**: HR-01-GROSS-B: 40; HR-06-KISIEL: 131, 153
- **Contributor notes**:
  - **HR-01-GROSS-B**: Aristotle's term for political existence. P40 binds it to coordination of action in a common world.
  - **HR-06-KISIEL**: Aristotelian definition retained in transliteration.

### aisthēsis

- **Language**: Greek
- **Primary English in volume**: attending to (Vernehmen)
- **Alternative renderings**: attending to (Vernehmen) — Heidegger's preferred, sensation (Empfindung) — rejected
- **Variants encountered**: aisthesis
- **In Subject Index (book pp. 193–195)**: YES — head *aisthesis*, pages: 71, 109
- **Contributors**: HR-03-MICHALSKI (1 unit)
- **Pages by unit**: HR-03-MICHALSKI: 71
- **Translation contested in volume**: yes
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → aisthēsis
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Heidegger translates aisthesis as Vernehmen — attending to the world in the sense of having-it-there (GA 18 52).

### meson / mesotēs

- **Language**: Greek
- **Primary English in volume**: mean / middle
- **Variants encountered**: meson / mesotēs / Mitte
- **In Subject Index (book pp. 193–195)**: YES — head *Mitte*, pages: 111, 123, 124, 125
- **Contributors**: HR-05-STRUEVER (1 unit)
- **Pages by unit**: HR-05-STRUEVER: 111, 112, 123, 125
- **Translation contested in volume**: yes
- **Contributor notes**:
  - **HR-05-STRUEVER**: GA 18 144 (meson kata praxis = kairos), 185, 188 (Augenblick), 201 (Jeweiligkeit). Heidegger shifts meson from medicine to ethics.

### polis / politikē / zōon politikon

- **Language**: Greek
- **Primary English in volume**: city / political / political animal
- **In Subject Index (book pp. 193–195)**: YES — head *polis*, pages: 14, 16-17, 84, 106, 114
- **Contributors**: HR-05-STRUEVER (1 unit)
- **Pages by unit**: HR-05-STRUEVER: 105, 106, 114, 123
- **Contributor notes**:
  - **HR-05-STRUEVER**: GA 18 104, 134.

### apeiron

- **Language**: Greek
- **Primary English in volume**: the boundless / indefinite
- **In Subject Index**: no
- **Contributors**: HR-05-STRUEVER (1 unit)
- **Pages by unit**: HR-05-STRUEVER: 112
- **Cross-pipeline links**:
  - `bcap_pipeline`: bcap-greek-appendix.md → apeiron
- **Contributor notes**:
  - **HR-05-STRUEVER**: GA 18 292. 'Indefinite range of specific occasions.'

### dialektikē

- **Language**: Greek
- **Primary English in volume**: dialectic
- **Variants encountered**: Dialektikē / dialektikē
- **In Subject Index**: no
- **Contributors**: HR-03-MICHALSKI (1 unit)
- **Pages by unit**: HR-03-MICHALSKI: 78
- **Cross-pipeline links**:
  - `bcap_pipeline`: bcap-greek-appendix.md → dialektikē
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Closing formula (GA 18 7): 'Dialektikē has, to be sure, its seriousness (the same that has been lost by every philosophy that has become sophistry).' The direction in which philology exceeds rhetoric.

### eleos

- **Language**: Greek
- **Primary English in volume**: pity
- **In Subject Index**: no
- **Contributors**: HR-04-HYDE (1 unit)
- **Pages by unit**: HR-04-HYDE: 87
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → eleos
- **Contributor notes**:
  - **HR-04-HYDE**: Used inline; Aristotle's pathos.

### gnōmē

- **Language**: Greek
- **Primary English in volume**: maxims, proverbs, folk-wisdom
- **Variants encountered**: gnomé / gnomai
- **In Subject Index**: no
- **Contributors**: HR-06-KISIEL (1 unit)
- **Pages by unit**: HR-06-KISIEL: 137
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → gnome
- **Contributor notes**:
  - **HR-06-KISIEL**: Aristotle's Rhetoric 2.20-22; Note 5.

### hermeneia

- **Language**: Greek
- **Primary English in volume**: interpretation, communication-and-accord
- **Alternative renderings**: Verstandigung
- **In Subject Index**: no
- **Contributors**: HR-06-KISIEL (1 unit)
- **Pages by unit**: HR-06-KISIEL: 132, 134
- **Cross-pipeline links**:
  - `bt_pipeline`: bt-german-appendix.md → Hermeneia
- **Contributor notes**:
  - **HR-06-KISIEL**: Telos of fundamental speaking-with-one-another.

### hylē / logoi enyloi

- **Language**: Greek
- **Primary English in volume**: matter / material
- **Alternative renderings**: embodied/enmattered logoi
- **Variants encountered**: hyle, logoi enyloi
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A (1 unit)
- **Pages by unit**: HR-01-GROSS-A: 25, 26
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → hyle
- **Contributor notes**:
  - **HR-01-GROSS-A**: GA 18.205 — 'das Sein der Natur ist... nicht einfach durch die hyle, sondern primar durch das Bewegtsein.'
  - **HR-01-GROSS-A**: Heidegger's Aristotelian phrase: surface and pathe are 'both logoi enyloi, but in quite different senses.'

### metabolē

- **Language**: Greek
- **Primary English in volume**: abrupt transition
- **In Subject Index**: no
- **Contributors**: HR-06-KISIEL (1 unit)
- **Pages by unit**: HR-06-KISIEL: 144
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → metabolē
  - `bcap_pipeline`: bcap-greek-appendix.md → metabolē
- **Contributor notes**:
  - **HR-06-KISIEL**: Heidegger's reading of historical-transit-being.

### methexis

- **Language**: Greek
- **Primary English in volume**: participation
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-A (1 unit)
- **Pages by unit**: HR-01-GROSS-A: 21
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → methexis
- **Contributor notes**:
  - **HR-01-GROSS-A**: Platonic concept Heidegger refuses for kinesis — kinesis as Dasein's mode, not as participation in an Idea.

### orexis

- **Language**: Greek
- **Primary English in volume**: desire, care, concern
- **In Subject Index**: no
- **Contributors**: HR-06-KISIEL (1 unit)
- **Pages by unit**: HR-06-KISIEL: 145
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → orexis
- **Contributor notes**:
  - **HR-06-KISIEL**: Most rudimentary form of understanding.

### orgē

- **Language**: Greek
- **Primary English in volume**: anger
- **In Subject Index**: no
- **Contributors**: HR-04-HYDE (1 unit)
- **Pages by unit**: HR-04-HYDE: 86
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → orge
- **Contributor notes**:
  - **HR-04-HYDE**: Aristotle's pathos analyzed at length.

### paradeigma / enthymēma

- **Language**: Greek
- **Primary English in volume**: paradigm / enthymeme
- **Variants encountered**: paradeigma / enthymema
- **In Subject Index**: no
- **Contributors**: HR-03-MICHALSKI (1 unit)
- **Pages by unit**: HR-03-MICHALSKI: 80
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → paradeigma
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Note 23 (GA 18 127f): paradeigma/enthymema (rhetoric) parallel to epagoge/syllogismos (dialectic) as forms of speech.

### philia

- **Language**: Greek
- **Primary English in volume**: friendship
- **In Subject Index**: no
- **Contributors**: HR-06-KISIEL (1 unit)
- **Pages by unit**: HR-06-KISIEL: 156
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → philia
- **Contributor notes**:
  - **HR-06-KISIEL**: Arendtian-Aristotelian antidote to agonal spirit.

### phōnē

- **Language**: Greek
- **Primary English in volume**: voice (acoustic)
- **Variants encountered**: phonē
- **In Subject Index**: no
- **Contributors**: HR-04-HYDE (1 unit)
- **Pages by unit**: HR-04-HYDE: Note 24
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → phōnē
- **Contributor notes**:
  - **HR-04-HYDE**: Per Dastur — voice (Stimme) does NOT have the purely vocal sense of phonē in German.

---

### C. Latin lemmas — 2 entries

### elocutio / movere, delectare, docere (officia oratoris)

- **Language**: Latin
- **Primary English in volume**: (rhetorical) style / moving, delighting, teaching
- **Variants encountered**: elocutio / movere, delectare, docere
- **In Subject Index (book pp. 193–195)**: YES — head *elocutio*, pages: 3, 163
- **Contributors**: HR-01-GROSS-A (1 unit)
- **Pages by unit**: HR-01-GROSS-A: 26, 3
- **Contributor notes**:
  - **HR-01-GROSS-A**: p.3: Heidegger gives elocutio 'only modest attention.' p.26: 'a traditional goal of rhetoric, along with pleasing and teaching (movere, delectare, docere).'

### sensus communis / koinē aisthēsis

- **Language**: Latin
- **Primary English in volume**: common sense / shared sense / sense-that-founds-community
- **Variants encountered**: sensus communis
- **In Subject Index (book pp. 193–195)**: YES — head *Sensus communis*, pages: 7
- **Contributors**: HR-01-GROSS-A (1 unit)
- **Pages by unit**: HR-01-GROSS-A: 7
- **Contributor notes**:
  - **HR-01-GROSS-A**: Vico via Gadamer; Roman Stoic tradition.

---

### D. Composite / multilingual lemmas — 5 entries

### aei on (das Immerseiende)

- **Language**: Greek+German
- **Primary English in volume**: what is constantly there
- **Alternative renderings**: that which always is, eternal being, the eternal / the always-being
- **Variants encountered**: aei on, das Immerseiende
- **In Subject Index**: no
- **Contributors**: HR-03-MICHALSKI, HR-05-STRUEVER, HR-06-KISIEL (3 units)
- **Pages by unit**: HR-03-MICHALSKI: 75; HR-05-STRUEVER: 110, 118; HR-06-KISIEL: 139
- **Contributor notes**:
  - **HR-03-MICHALSKI**: The object of Aristotelian fear in Heidegger's reading: that what is constantly there could perhaps cease to be (GA 18 289f).
  - **HR-05-STRUEVER**: GA 18 140. The philosophic obsession with timeless truths Heidegger contrasts with rhetoric's *Zeitlichkeit*.
  - **HR-06-KISIEL**: Contrasted with endechomenon allos echein.

### Gefaßtsein / hexis

- **Language**: German+Greek
- **Primary English in volume**: state of being composed
- **Alternative renderings**: habit / disposition / state / having-grasped, having-been-grasped / fastening
- **Variants encountered**: Gefasstsein, hexis / Gefasstsein
- **In Subject Index (book pp. 193–195)**: YES — head *hexis*, pages: 35, 60, 111-112, 139
- **Contributors**: HR-03-MICHALSKI, HR-05-STRUEVER (2 units)
- **Pages by unit**: HR-03-MICHALSKI: 75; HR-05-STRUEVER: 111, 112
- **Cross-pipeline links**:
  - `aristotle_pipeline`: aristotle-greek-appendix.md → hexis
  - `bcap_pipeline`: bcap-greek-appendix.md → hexis
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Aristotelian theory as Gefasstsein against pathos of fear. Translator's German parenthetical.
  - **HR-05-STRUEVER**: GA 18 185. Heidegger's gloss for *hexis* as potential.
  - **HR-05-STRUEVER**: GA 18 184–185, 192. Hexis as dynamis.

### ressentiment

- **Language**: French (Nietzschean)
- **Primary English in volume**: resentment
- **Alternative renderings**: Ressentiment (German), ressentiment
- **In Subject Index**: no
- **Contributors**: HR-01-GROSS-B, HR-07-POGGELER (2 units)
- **Pages by unit**: HR-01-GROSS-B: 37; HR-07-POGGELER: 168
- **Contributor notes**:
  - **HR-01-GROSS-B**: Used at p. 37: 'when weak, I fear the ressentiment of the weak' — Heidegger via Nietzsche.
  - **HR-07-POGGELER**: n. 34: Pöggeler's own essay 'Ressentiment und Tugend bei Max Scheler' — analyzed by Nietzsche as ressentiment-with-virtue

### Ekstase / ekstasis

- **Language**: German+Greek
- **Primary English in volume**: ecstasy / standing-out
- **Variants encountered**: ekstasis
- **In Subject Index (book pp. 193–195)**: YES — head *Ekstase*, pages: 2, 19, 143
- **Contributors**: HR-01-GROSS-A (1 unit)
- **Pages by unit**: HR-01-GROSS-A: 2
- **Contributor notes**:
  - **HR-01-GROSS-A**: Listed at p.2.

### Vernehmen / aisthēsis

- **Language**: German+Greek
- **Primary English in volume**: attending to
- **Variants encountered**: Vernehmen
- **In Subject Index (book pp. 193–195)**: YES — head *aisthesis*, pages: 71, 109
- **Aristotelian correlate (per Subject Index)**: *Vernehmen*
- **Contributors**: HR-03-MICHALSKI (1 unit)
- **Pages by unit**: HR-03-MICHALSKI: 71
- **Contributor notes**:
  - **HR-03-MICHALSKI**: Heidegger's preferred rendering for aisthesis. Translator's German parenthetical.

---

## Part II — Appendix of Singletons (lemma appears in only one contributor's essay AND is not in the volume Subject Index)

Compact format. Each entry records the contributor and pages where the term occurs; cross-pipeline links shown where available.

### Singletons — German (87 entries)

- **Abhandeln / Abhandlung** — bargaining over opinions / theoretical treatise (HR-06-KISIEL, 148)
- **Affekt / Affekte** — affect / affects / emotion (HR-01-GROSS-A, 26-27, 4)
- **Aufzeigen** — exhibiting / showing (HR-04-HYDE, 86, 92, 95)
- **ausgezeichnetes Wie des Seins** — distinctive 'how' of being (HR-03-MICHALSKI, 71)
- **Be-wegen / weg** — way / to make-a-way / to move (HR-01-GROSS-A, 21)
- **Begegnung aus der Welt her** — encounter from out of the world (HR-01-GROSS-A, 15)
- **Betroffensein** — being-affected (HR-02-GADAMER, 57)
- **bewährt** — warranted (HR-02-GADAMER, 57)
- **Botanik der Pflanzen** — botany of plants (HR-01-GROSS-A, 16)
- **Brauch** — custom, usage, habit-of-habitat (HR-06-KISIEL, 146)
- **Dafürsein** — Being-there-for / pretheoretical being-for (HR-01-GROSS-B, 30, 36)
- **die politischen Ereignisse als gefährlich hinstellen** — Political events are characterized in a threatening manner (HR-01-GROSS-B, 37)
- **die Sprache spricht** — language speaks (HR-01-GROSS-A, 21)
- **Diskussion** — discussion (HR-02-GADAMER, 52)
- **doppeldeutig** — double-meaning / ambiguous (HR-01-GROSS-A, 15-16)
- **durchsichtig (Sichtbarkeit)** — transparent (HR-04-HYDE, 91)
- **eigentliche Entdecktheit** — authentic discoveredness (HR-04-HYDE, 85)
- **Empfindung** — sensation (HR-03-MICHALSKI, 71)
- **ent-sprechen** — respond / un-speak / speak-with (HR-01-GROSS-A, 22)
- **Erkennen des Sprechens** — cognition of speech (HR-03-MICHALSKI, 75)
- **Erörterung** — discussion / to discuss (HR-07-POGGELER, 161, 162, 171, 172)
- **es gibt** — (impersonal) there is / it gives (HR-01-GROSS-A, 21)
- **es könnte auch anders sein / endechomenon allōs echein (Heidegger gloss)** — It could be otherwise / yes that could always be otherwise (HR-01-GROSS-B, 31)
- **es sei alles in bester Ordnung** — things could not be better (HR-03-MICHALSKI, 73)
- **Freihalten** — freeholding / keeping-open (HR-05-STRUEVER, 112)
- **Frontgemeinschaft** — front community (HR-06-KISIEL, 149)
- **Füreinandersein / Füreinanderdasein** — being-for-one-another (HR-01-GROSS-A, 15)
- **Gesamtheit der Umstände** — totality of circumstances (HR-05-STRUEVER, 125)
- **Geviert** — fourfold (earth, sky, mortal, gods) (HR-07-POGGELER, 162)
- **Grundbegriffe / Grundbestimmung** — basic possibility / basic determination of Dasein (HR-05-STRUEVER, 105, 106, 109, 111, 115, 118)
- **Handeln** — action (HR-07-POGGELER, 170)
- **Heimat / Heimstatt** — homeland / homestead (HR-06-KISIEL, 151)
- **Hermeneutische Entwürfe** — Hermeneutic Sketches (HR-02-GADAMER, (n. 31))
- **Holzwege** — woodpaths (HR-07-POGGELER, 172)
- **Im-Werke-Sein** — being-at-work (HR-03-MICHALSKI, 71)
- **in der rechten Weise** — in a right and just manner / aright (HR-04-HYDE, 85, Note 10)
- **Innewerden** — inner becoming / inner awareness (HR-05-STRUEVER, 121)
- **Laute** — (physical) sounds / utterances (HR-01-GROSS-A, 23)
- **Leidenschaft der Erkenntnis des Ausgesprochenen (und des Sichaussprechens)** — passion for the knowledge of that which has been expressed and of its self-expression (HR-03-MICHALSKI, 66, 67, 74)
- **Leitworte** — guiding-words (HR-07-POGGELER, 161, 162)
- **letztbegründend** — having an ultimate foundation (HR-03-MICHALSKI, 73)
- **Lobrede (epideictic speech)** — a eulogy / a speech of praise (HR-04-HYDE, 95)
- **Mit-Teilung** — communication (literally 'with-sharing') (HR-06-KISIEL, 142)
- **Mitteilung und Kampf** — communication and struggle (HR-06-KISIEL, 142)
- **Nachreden** — speaking-after (with), contagious-attunement-utterance (HR-06-KISIEL, 145)
- **Offenheit** — openness (HR-01-GROSS-B, 31)
- **Orientierung** — orientation / being-oriented (HR-05-STRUEVER, 107, 112)
- **Ortschaft** — dwelling-place (HR-07-POGGELER, 161)
- **Philologie** — philology / philological (HR-01-GROSS-B, 41 (note 1 — Bröcker vs. Schalk))
- **Philosophische Lehrjahre** — Philosophical Apprentice Years (HR-02-GADAMER, (n. 14))
- **Rektorat (Rectoral Address)** — rectorship (HR-02-GADAMER, 55)
- **Revisionsfähigkeit** — revisability (HR-05-STRUEVER, 112)
- **Sage** — saying (HR-04-HYDE, 92)
- **Sein und Zeit (BT)** — Being and Time (HR-01-GROSS-A, 13, 2, 27)
- **Seyn (with strikethrough Geviert mark)** — Being (typeset with strikethrough) (HR-07-POGGELER, 161, 162)
- **sich etwas zu Herzen nehmen** — to take something to heart (HR-04-HYDE, 89)
- **Sich-Befinden** — findingness / how one feels (HR-02-GADAMER, 57)
- **Sich-im-Fertigsein-Halten** — holding-itself-in-completion (HR-03-MICHALSKI, 72)
- **Sichaussprechen / Ausgesprochenes** — self-expression (HR-03-MICHALSKI, 66, 75)
- **Sichverbergen / Entbergen** — self-concealment / disclosure of the self-concealed (HR-07-POGGELER, 162)
- **Sichverhalten** — comporting / disposing oneself (HR-01-GROSS-A, 27)
- **Speerspitze** — spearhead / vanishing point (HR-07-POGGELER, 172)
- **Sprachphilosophie** — philosophy of language (HR-05-STRUEVER, 106, 115, 117)
- **Sprechendsein** — being-spoken / being-in-speaking (HR-03-MICHALSKI, 80)
- **statt-finden / statt-haben / gestatten** — takes place / occupies place / permitted (HR-06-KISIEL, 151)
- **Stimme** — voice (HR-04-HYDE, Note 24)
- **Stätte / Spielraum** — site / leeway (HR-06-KISIEL, 151)
- **Tischreden** — Table Talk (HR-01-GROSS-B, 44 (note 48))
- **Topologie des Seins** — topology of being (HR-07-POGGELER, 161, 162, 163)
- **Toposforschung** — topical research / researching of topics (HR-07-POGGELER, 162)
- **Trommelnder** — drumming (the Führer's propagandizing-style) (HR-06-KISIEL, 150)
- **Umschlagen / Werden zu** — sudden change / transformation to (HR-01-GROSS-B, 35, 36)
- **Unruhe / Durcheinandergeraten** — unsettling / confusing / mixed-up (HR-01-GROSS-B, 35)
- **Unter-schied** — difference / dimension-divide (HR-01-GROSS-A, 22)
- **Unverborgenheit** — unconcealment (HR-07-POGGELER, 171)
- **Verhandeln** — negotiating-with-one-another (parley, deliberate, plead, discuss, debate) (HR-06-KISIEL, 148)
- **Verstellen** — distortion (HR-03-MICHALSKI, 79)
- **Vollbringen** — bringing-to-fulfillment (HR-07-POGGELER, 170, 171)
- **vom angesprochenen Seienden** — by the being that was addressed (HR-03-MICHALSKI, 75)
- **von schlechter Gesinnung** — ill disposed / always looking for the advantage / cowardly (HR-01-GROSS-B, 37)
- **Vorgabe** — [the giving in advance] (p. 84 quote: 'Es muß bei der Vorgabe...') (HR-04-HYDE, 84)
- **Wahrheit und Methode** — Truth and Method (HR-02-GADAMER, (implicit; n. 14 cites Philosophische Lehrjahre))
- **Wahrheitsfindung** — (untranslated — used by Engberg-Pedersen in original German) (HR-01-GROSS-B, 30)
- **Weltanschauung und Analyse des Menschen seit Renaissance und Reformation (Dilthey)** — Worldview and Analysis of the Human since Renaissance and Reformation (Dilthey title) (HR-01-GROSS-B, 33)
- **Weltzugehörigkeit** — world-belonging (HR-01-GROSS-A, 15)
- **Wissen / Wissenschaft** — knowledge / science (HR-05-STRUEVER, 108, 109, 118)
- **Zurückhaltende / Ironische** — the reserved / the ironic (HR-01-GROSS-B, 37)

### Singletons — Greek (35 entries)

- **aidōs** — shame, modesty, self-respect (HR-07-POGGELER, 167)
- **alogon** — non-rational (as in alogon of orexis) (HR-06-KISIEL, 145)
- **aneu logou** — without speech, beyond language (HR-06-KISIEL, 141)
- **antistrophē** — counterpart / offshoot (HR-05-STRUEVER, 117)
- **bios apolaustikos / politikos / theoretikos** — lives of pleasure / political / theoretical (HR-06-KISIEL, 143)
- **Daimon (implicit)** — (not directly cited, but adjacent in the Plato Symposium reference) (HR-02-GADAMER, 48 (Symposium last phase))
- **deiknynai / deixis** — showing, pointing out (= demonstration, = enthymeme-as-rhetorical-syllogism) (HR-06-KISIEL, 136, 137)
- **deina** — uncanny, dread (implicit in 'unhomely, uncanny') (HR-06-KISIEL, 152)
- **dikanikon** — judicial / forensic (HR-04-HYDE, 94 [rotated])
- **endechomenon allōs echein** — that which can also be otherwise (HR-06-KISIEL, 139, 143, 144)
- **epagōgē / syllogismos** — induction / deduction (HR-03-MICHALSKI, 80)
- **epideiktikon / epideixis** — epideictic / display rhetoric (HR-04-HYDE, 94 [rotated], 95, 95-99)
- **epideiktikon / sumbouleutikon / dikanikon** — epideictic / deliberative / judicial (HR-06-KISIEL, 134-135)
- **ergon** — work / function (HR-05-STRUEVER, 109)
- **exōterikoi logoi** — exoteric arguments (HR-03-MICHALSKI, 69)
- **hekaston** — what in each case obtains (HR-03-MICHALSKI, 71)
- **hypsipolis apolis** — lofty-city / no-city (Antigone) (HR-06-KISIEL, 152)
- **katastasis** — natural and normal settled state of well-being (HR-06-KISIEL, 143)
- **kerygma** — kerygma (proclamation) (HR-03-MICHALSKI, 65)
- **metapherein** — transference (HR-03-MICHALSKI, 71)
- **nomomachia** — battle-of-laws / law-fighting (HR-01-GROSS-A, 19)
- **nous poiētikos** — active intellect / poetic intellect (HR-01-GROSS-A, 13)
- **pathei mathos** — learning through experience / suffering (HR-02-GADAMER, 59 (IV), n. 24 = Aeschylus, Agamemnon, 177)
- **philologia** — philology / love of speaking (HR-03-MICHALSKI, 74)
- **phrēn** — the heart (HR-04-HYDE, 91)
- **physikos** — physicist / one of nature (HR-01-GROSS-A, 13-14)
- **pithanon** — the persuasive / probable (HR-05-STRUEVER, 108)
- **polemos** — war, struggle (combat-of-conversation) (HR-06-KISIEL, 152)
- **rhētōr poiētikos** — poetic rhetor (HR-01-GROSS-A, 25-26)
- **skepasma** — shelter (HR-01-GROSS-A, 25)
- **sumbouleutikon** — deliberative (HR-04-HYDE, 94 [rotated])
- **syneidēsis** — knowing together (HR-04-HYDE, 91)
- **thymos** — affective desire / heart / spirit (HR-05-STRUEVER, 107)
- **timē** — honor, recognition (HR-06-KISIEL, 143)
- **zētein peri physeōs** — investigation of nature (HR-01-GROSS-A, 14-16)

### Singletons — Latin (16 entries)

- **con-scientia** — knowing together / conscience (HR-04-HYDE, 91)
- **Dialectica docet, Rhetorica movet** — Dialectic teaches, Rhetoric moves (HR-01-GROSS-B, 44 (note 48))
- **differentia specifica (definiens / definiendum)** — specific difference (HR-01-GROSS-A, 21)
- **emovere** — to excite / to move out (HR-04-HYDE, 84)
- **ignoramus** — we do not know (HR-02-GADAMER, 59)
- **inter-esse** — in-between, public realm of equals (HR-06-KISIEL, 154)
- **Nec spe nec metu** — Neither expectation nor fear (HR-07-POGGELER, 167)
- **oratio** — art of eloquence (HR-04-HYDE, 98)
- **ornare** — to equip (HR-04-HYDE, 98)
- **ratio atque oratio** — powerful reasoning allied with powerful speech (HR-01-GROSS-B, 29)
- **rhetoricatur** — rhetorized (HR-01-GROSS-B, 45 (note 48))
- **Sermo de poenitentia** — (untranslated — Latin work title) (HR-01-GROSS-B, 33)
- **sola scriptura** — scripture alone (HR-03-MICHALSKI, 69)
- **sui ipsius interpres** — his own interpreter (Aristotle interpreting himself) (HR-03-MICHALSKI, 69)
- **timor castus / timor servilis** — holy fear / slavish fear (HR-07-POGGELER, 169)
- **vita activa** — active life (HR-04-HYDE, 98)

### Singletons — other / composite (11 entries)

- **daseinsmäßige genesis des Sprechens** — Dasein-grounded genesis of speech (HR-01-GROSS-B, 37)
- **differance / mouvance / partage des voix** — sharing of voices (HR-01-GROSS-A, 18-19, 9)
- **gigantomachia / Kampf** — struggle / Titans' battle / gigantomachia (HR-06-KISIEL, 138)
- **Haltung / hexis** — attitude (HR-07-POGGELER, 169)
- **Hören / akouein** — hearing / speaking / hearing / sensation (HR-05-STRUEVER, 114)
- **Ort / Örter / loci** — place / places (HR-07-POGGELER, 161, 171, 172)
- **reor / eirō (Heidegger 1951/52)** — Latin for 'speak through': reor; cf. the Greek eirō (Rhetorik) (HR-07-POGGELER, bibliography Section A locus 8 (1951/52 Was heißt Denken?))
- **Scheu / aidōs** — shame, modesty, self-respect (HR-07-POGGELER, 167)
- **Sein-in-der-polis** — being-in-the-polis (HR-05-STRUEVER, 106)
- **to prepon / quod decet** — the appropriate / what is fitting (HR-05-STRUEVER, 110, 111)
- **Öfter / pollakis** — frequency / often (HR-05-STRUEVER, 111, 125)

---

## Notes on Methodology

1. **Canonical-lemma normalization**: macron-bearing transliterations (e.g., `phronēsis`) are preferred to macron-stripped forms (`phronesis`) when both are encountered; Heideggerian compound clusters (e.g., `Mitsein / Miteinandersein / Miteinanderdasein`) are preserved as a single lemma reflecting the volume's lexical-family treatment.
2. **Subject Index match policy**: a lemma is marked `in_subject_index = true` if its canonical form matches a Subject Index head (case-insensitive, macron-folded) OR if a parenthetical German/Greek term in a Subject Index entry matches the canonical lemma. This catches both Subject Index-as-English-head (e.g., 'Attunement' with parenthetical *Befindlichkeit*) and Subject Index-as-Greek-head (e.g., *dynamis*).
3. **Cross-pipeline links** are resolved against the existing terminology appendices in BT, BCAP, and Aristotle pipelines. For a HR lemma with both German and Greek variants, the BT link points to the German pipeline entry and the BCAP/Aristotle links point to the Greek pipeline entry — preserving the volume's tri-lingual structure across pipelines.
4. **Aristotelian correlate** is recorded only for non-Greek canonical lemmas; the value is drawn from the Subject Index parenthetical (e.g., *Befindlichkeit* → 'pathos' via SI head 'Attunement (Befindlichkeit)' and SI head 'Mood (Stimmung / pathos)' juxtaposition).
5. **Translation contested**: defaults to `false`; flagged `true` only when a contributor or editor explicitly flags the translation as contested (e.g., Struever's coinage 'timefulness' for *Alltäglichkeit*).
