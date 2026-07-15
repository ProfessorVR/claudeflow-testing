# External Literature Network — Boredom Secondary (Part III)

The **hubs outside the cluster** that its 55 units converge on. Intra-cluster citations are in `citation-network.md`.

**Counting method.** Hub frequencies below are **full-text occurrence counts across each unit's `.json` + `-edges.csv`**,
not raw `interlocutors`-array counts. The array counts undercount badly — an author can be cited in a unit's edges and
notes without being listed as a formal interlocutor. Every number in §1 was verified by direct search; three of this
document's own first-draft claims were **wrong** and are corrected in §5.

Naming variants are normalized: "Martin Heidegger", "Heidegger, Martin — *Being and Time*", and "Heidegger, Martin --
Fundamental Concepts of Metaphysics" are one person with three works.

---

## 1. The hub tiers (verified counts)

### Tier 1 — the shared spine

| Hub | Units | Role |
|---|---|---|
| **Martin Heidegger** (all works) | 24+ across A, B, F, G | The cluster's centre of gravity — but cited as **four distinct objects** (§2). |
| **Andreas Elpidorou** | 11 (external hub in 08, 16, 20, 22, 32; in-cluster author in 02–06, 25, 26) | Uniquely **both** an external hub and the cluster's structural centre (`citation-network.md` §2). |

### Tier 2 — disciplinary anchors

| Hub | Units | Strands reached | Role |
|---|---|---|---|
| **John Eastwood** | **15** | A(2), C(5), D(5), E(2) | The **most-cited external psychologist** in the cluster — more frequent than Danckert. Boredom-as-attention-failure. |
| **Mihaly Csikszentmihalyi** | **14** | A, B, C, D, E, F | The **most cross-cutting hub of all** — the only one reaching six of seven strands (§3). |
| **James Danckert** (usu. with Merrifield) | **10** | C, D | DMN/anterior-insula fMRI; the "Goldilocks zone"; boredom's empirical anchor. |
| **Farmer & Sundberg (1986)** | **10** | A, C, D, E | The **Boredom Proneness Scale** — the cluster's single most-used instrument, and the one bor-sec-04 argues cannot reach profound boredom. |
| **Lars Svendsen** | **7** | A, C | *A Philosophy of Boredom* — the standing target: Mihačević rejects his uniform loss-of-meaning reading (CR-01); Hughes adopts his situative/existential distinction. |
| **Reinhard Pekrun** | **6** | B, C, E | Academic emotions; the source of the mood/emotion collapse DA-09 turns on. |
| **Oswald (1962)** | **4** | C, D | The alpha hypothesis — the oldest measurement lineage in the cluster. |
| **Lauren Freeman** | 4 | A, G | Co-author within the cluster; independent hub in Strand G. |
| **Jan Slaby** | 4 | A, C (+ in-cluster 12, 13, 55) | Like Elpidorou, both hub and in-cluster author. |
| **Matthew Ratcliffe** | 3 | A, G | Phenomenology-of-affect anchor. |

### Tier 3 — the *Being and Time* translation-and-commentary bloc

Cited **only** by Strands A and G, almost entirely in service of the *Befindlichkeit* problem (CR-04):
**Taylor Carman** (02, 03, 48) · **Daniel Dahlstrom** (02, 03, 48 — also in-cluster author bor-sec-49) ·
**William Blattner** (02, 03, 51) · **Charles Guignon** (02, 03, 50) · **John Haugeland** (02, 12, 13, 50, 55) ·
**Hubert Dreyfus** (02, 07, 17, 42) · **Stephen Mulhall** (03, 48) · **Katherine Withy** (47, 48, 50 — also
bor-sec-51) · **Steven Crowell** (17, 48).

### Tier 4 — the philosophical canon

Unit numbers here are **indicative** (drawn from formal `interlocutors` entries, i.e. where a unit treats the figure as a
named interlocutor). Full-text occurrence counts — which are higher, because these figures are also cited in passing
throughout the edge notes — are in `boredom-secondary-literature-network.json` under `hubUnitCounts`. Where the two
disagree, **the JSON is authoritative**.

**Aristotle** (13, 46, 47, 49) · **Husserl** (14, 16, 42, 45) · **Kant** (19, 49, 54) · **Plato** (19, 46) ·
**Descartes** (48, 49, 52, 54) · **Nietzsche** (14, 16, 19, 52) · **Sartre** (05, 06, 46, 50) · **Derrida** (19, 53, 54) ·
**Arendt** (09, 55) · **Agamben** (53, 54) · **Scheler** (49, 53) · **Bergson** (55) · **Kierkegaard** (55) ·
**Adorno** (14) · **Benjamin** (07, 23) · **Simmel** (07) · **Medard Boss** (07, 09) · **Feenberg** (17, 19) ·
**Ihde / Verbeek** (15) · **Bill Readings** (19).

*(Counting note: "Readings" and "Russell" required disambiguated matching — a naive search for "Readings" matches the
`readings[]` JSON field in every unit and returns a spurious 55.)*

### Tier 5 — measurement lineage

**Davidson & Fox (1982) / Davidson (1992)** — frontal asymmetry and emotion (31) · **Pope, Bogart & Bartolome** — the
beta/(alpha+theta) engagement index (21) · **London, Schubert & Washburn (1972)** vs. **Pattyn et al. (2008)** — the
contradictory HR findings underwriting DA-04 (16, 21, 25, 26) · **Fahlman et al. (2013)** — MSBS (22, 25) ·
**Zuckerman (1979)** — ZBS (04, 25, 26) · **Goetz et al. (2014)** — five-category taxonomy, experience sampling
(21, 25) · **Götz & Frenzel (2006)** — the four-type taxonomy Feldges attacks (16) · **Russell (1980)** — circumplex
model of affect (35, 37) · **Van Orden et al. (2000)** — the fixation+blink+pupil regression model (36).

---

## 2. Heidegger is not one hub but four

Treating "Heidegger" as a single node hides the cluster's real fault line. He is cited as **four distinct objects**, and
which one a unit cites predicts almost everything about that unit:

| Object | Cited by | What it supplies |
|---|---|---|
| **FCM** (GA 29/30, 1929–30) | 01, 07, 08, 09, 10, 11, 12, 13, 14, 16, 18, 23, 51, 55 | The three forms, the structural moments, *Zeitvertreib*, the *Grundstimmung* claim — the cluster's **entire boredom content** |
| **Being and Time** (1927) | 01, 02, 03, 05, 11, 12, 13, 20, 45, 47, 48, 49, 50, 51, 55 | *Befindlichkeit*, angst, *das Man*, authenticity — mood's architecture, but **almost no boredom** |
| **The later technology essays** | 15, 17, 19 | *Gestell*, *Bestand*, *Gelassenheit* — the education strand's frame, with **no boredom at all** |
| **The 1924 Aristotle lectures** (GA 18) | 47 | πάθος, *hedone*, the *Rhetoric* rehabilitation — predates FCM by five years, **no boredom** |

*(P/anticipatory-application)* Three of Heidegger's four cluster-presences contain **no boredom analysis**. Strand B's
"Heidegger and education" units mostly cite the *technology* Heidegger, not the *boredom* Heidegger — which is exactly
why bor-sec-15, 17, and 19 came back with near-zero boredom content despite their titles. **The Heidegger hub is a
homonym, not a shared reference point.**

## 3. Where the hubs overlap — and where they don't

**They don't, mostly.** The Tier-3 *Being and Time* bloc (Carman, Blattner, Guignon, Haugeland, Dreyfus, Mulhall) is
cited **only** by Strands A and G. The Tier-5 measurement lineage (Davidson, Pope, London/Pattyn, Russell, Van Orden) is
cited **only** by Strands C, D, and E. **These two blocs share zero authors.** The external-hub network is partitioned as
cleanly as the internal one (`citation-network.md` §1) — the same wall, seen from outside.

Four hubs do cross. They cross in instructively different ways:

| Hub | How it crosses |
|---|---|
| **Elpidorou** | *Is* the bridge, by self-citation (`citation-network.md` §2). |
| **Eastwood** (15 units) | Reaches Strand A **only via bor-sec-04 and bor-sec-05 — both Elpidorou & Freeman papers.** *(P/anticipatory-application)* Eastwood does not independently bridge the divide; he is carried across it by Elpidorou. This **reinforces** the sole-bridge finding rather than weakening it. |
| **Farmer & Sundberg** (10 units) | Same pattern: reaches Strand A only via bor-sec-04 — and there as the instrument E&F argue **cannot** measure profound boredom. |
| **Csikszentmihalyi** (14 units) | **The genuine exception.** Reaches A(06), **B(18)**, C(20, 21, 25, 26), D(28, 33), E(34, 40), **F(42, 44)** — six of seven strands, and its Strand-B and Strand-F presences are **independent of Elpidorou** (Mansikka, Haj-Bolouri, Nacke & Lindley). |

**But Csikszentmihalyi crosses asymmetrically.** Strands C/D/E cite him for the *operationalizable* four-channel model, in
which boredom is a measurable quadrant. Mansikka (bor-sec-18) cites him as the **contrast case** — the "flow" ideal
against which Heideggerian boredom is precisely *not* to be measured, opening his paper with exactly that opposition.
Same hub, opposite uses. *(P/anticipatory-application)* Flow is the one concept both halves of this cluster hold — and
they hold it for opposite reasons.

## 4. Same-author, different-paper links (verified; easy to miscount)

Cases where two units share an author but cite **different works** — recorded so nobody collapses them into a citation:

| Units | Shared author | The trap |
|---|---|---|
| bor-sec-36 ↔ bor-sec-37 | Holmqvist | bor-sec-37 cites Holmqvist & Blignaut (2020), a **different paper** from bor-sec-36. |
| bor-sec-34 ↔ bor-sec-37 | Cheval / Bolmont / Boisgontier | bor-sec-37 cites a different paper by the same group. |
| bor-sec-17 ↔ bor-sec-19 | Thomson | Mertel cites Thomson's **2019** "Technology, Ontotheology, Education" — **not** the 2001 paper that is bor-sec-19. |
| bor-sec-32 ↔ bor-sec-25/26 | Elpidorou | Yakobi cites Elpidorou **2020** "Is Boredom One or Many?" — **not** the regulatory papers. A plausible-looking bridge that isn't one. |
| bor-sec-18 ↔ bor-sec-19 | Thomson | Mansikka's "Thomson 2003" is very likely a reprint of bor-sec-19's 2001 paper (identical title) — recorded with a confidence caveat. |
| bor-sec-40 ↔ bor-sec-41 | "Wang…Chen" | A **name collision**, not the same authors. bor-sec-40's builder correctly declined the match. |

## 5. Corrections to the Phase-0 hub guesses — and to this document's own first draft

The Phase-0 plan guessed five hubs. Verified against the corpus:

| Guessed hub | Verdict |
|---|---|
| **Heidegger** | ✔ confirmed — but as **four distinct objects** (§2) |
| **Elpidorou** | ✔ confirmed, and **stronger** than guessed: the cluster's structural centre, not merely a hub |
| **Eastwood & Danckert** | ✔ confirmed — **both**, at 15 and 10 units. |
| **Csikszentmihalyi** | ✔ confirmed — and the **most cross-cutting hub in the cluster** (six of seven strands) |
| **Mann & Robinson** | ✘ **not a hub** — 2 units only (bor-sec-07, bor-sec-33), and in bor-sec-07 only as a **target of rejection** (Gibbs rejects their framing that boredom is a flaw solvable by more entertaining teaching). |

**Three errors in this document's own first draft, corrected after direct verification:**

1. I wrote that **Eastwood** "appears far less often than the pairing implies" and that Danckert was the real anchor.
   **Wrong** — Eastwood appears in **15** units, *more* than Danckert's 10. The plan's pairing was right and my
   correction to it was not.
2. I wrote that **Mann & Robinson** appears in "exactly one" unit. **Wrong** — it appears in **two** (bor-sec-07 and
   bor-sec-33). The conclusion (not a hub) survives; the count did not.
3. I listed **Csikszentmihalyi** in 5 units. **Wrong** — **14**, and the correct figure changes the finding: he is the
   cluster's most cross-cutting hub, not a minor one.

All three errors came from counting the `interlocutors` arrays instead of searching the full unit records. Hence the
counting-method note at the head of this document.
