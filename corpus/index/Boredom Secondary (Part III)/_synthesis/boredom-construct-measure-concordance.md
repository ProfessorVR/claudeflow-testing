# Boredom Construct × Measure Concordance — the cluster's primary-object anchor

Where the RDR2 cluster concords sources to *game elements* and the phantasia cluster to *Bekker loci*, this cluster
concords sources to a **two-axis grid**: 11 **boredom constructs** (rows) × 12 **physiological/behavioural measures**
(columns). Rows map to FCM units; columns map to the Boredom Experiment dataset's channels.

This is the document Part III cites. **It is also the document that reports a gap rather than a mapping** — read §2 before
using the grid.

---

## 1. The grid

Cell values are counts of units that both **treat the construct** (source's own treatment, `X` in `concept-matrix.csv`)
and **operationalize or survey the measure**. `·` = empty.

| Construct ↓ / Measure → | FEA | α/θ | conn | EO/EC | pupil | gaze | blink | HR | self‑rep | behav | PP | ML |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **profound/deep boredom (3rd form)** | · | · | · | · | · | · | · | 1 | **5** | 1 | · | · |
| **being-bored-by (1st form)** | · | · | · | · | · | · | · | · | **4** | · | · | · |
| **being-bored-with (2nd form)** | · | · | · | · | · | · | · | · | **3** | · | · | · |
| situational vs. trait/state | 2 | 8 | 3 | 2 | 4 | 4 | 3 | 8 | 18 | 10 | · | 4 |
| boredom proneness | 2 | 8 | 3 | 2 | 1 | 1 | 2 | 7 | 14 | 7 | · | 2 |
| mind-wandering / TUT | · | 5 | 2 | 1 | 3 | 3 | 3 | 6 | 12 | 10 | · | 2 |
| attentional disengagement | 2 | 8 | 3 | 2 | 5 | 6 | 4 | 8 | 19 | 12 | · | 6 |
| boredom-as-regulatory-signal | 1 | 5 | 2 | 2 | 1 | 1 | 2 | 5 | 12 | 7 | · | · |
| flow / engagement | 2 | 6 | 2 | 2 | 6 | 7 | 4 | 7 | 18 | 11 | · | 7 |
| monotony / meaninglessness | 2 | 6 | 3 | 1 | 3 | 4 | 2 | 8 | 16 | 8 | · | 4 |
| temporality / time-drag | 2 | 6 | 2 | 1 | 1 | 1 | 1 | 7 | 12 | 5 | · | 2 |

**91 of 132 cells populated.** No construct row is entirely empty. One column is empty — see §5.

---

## 2. The central finding: the grid has a hole exactly where Part III needs it filled

Look at the **top three rows**. Heidegger's three forms of boredom — the constructs the entire humanities half of this
cluster exists to analyse — are reachable by **self-report and nothing else**. Every hard instrument column (frontal
asymmetry, alpha/theta, connectivity, eyes-open/closed, pupillometry, gaze, blink, ML) is **empty** for all three.

This is not an artifact of coding. It was verified by two independent routes:

- **Route 1 (construct-based).** 22 units treat profound boredom. 19 units carry a hard instrument (EEG / pupillometry /
  gaze / blink / ML). **Intersection: empty.**
- **Route 2 (bridge-based).** 21 units carry a `bridges-to-fcm` edge. 19 units carry a hard-instrument
  `operationalizes-measure` edge. **Intersection: empty.** The unit-ID ranges barely even touch: the FCM-bridging units
  are bor-sec-01–18 (plus 23, 48, 51, 54, 55); the hard-instrumented units are bor-sec-21–41.

**The two literatures in this cluster are disjoint at the instrument boundary.** Not merely under-connected — *disjoint*.
No source in 55 both reads FCM and measures with EEG or eye-tracking.

### Why this is worse than it looks

The one instrument that *does* reach the FCM forms — **self-report** — is precisely the instrument that:

1. the phenomenological tradition says **cannot in principle** access an attunement, because a *Grundstimmung* is
   **awakened, not ascertained** (fcm-03), and reflective access distorts the affect it targets (bor-sec-48, FE); and
2. the empirical literature shows **does not correlate** with any physiological signature of boredom (bor-sec-28: N=13,
   no significant correlation with any physiological feature, FE).

And the single most important cell in the grid is a **negative result**: `profound boredom × self-report` is populated by
bor-sec-04 — Elpidorou & Freeman — whose entire argument is that the Boredom Proneness Scale and the Zuckerman Boredom
Susceptibility Scale **do not measure profound boredom at all** (pp.9–15, FE). The cell exists because they discuss the
instruments, not because the instruments work.

*(P/anticipatory-application)* **The honest reading of this concordance is that it documents a gap, not a bridge.** Part III
cannot cite this grid as showing that the phenomenological and physiological literatures converge on boredom. They do not
meet. Part III's own contribution — instrumenting a Heideggerian construct — has no precedent in these 55 sources, and
the concordance is the evidence for that claim.

### What is instrumented instead

The richly populated rows are the **psychological** constructs: attentional disengagement (19 self-report + 12 behavioural
+ 6 ML), flow/engagement (18 + 11 + 7), situational/trait (18 + 10 + 4). These are measurable because they are *defined*
as measurable. The cluster's operationalization effort has gone almost entirely into constructs that were built to be
operationalized — which is exactly what one would predict, and exactly what leaves the third form untouched.

---

## 3. Row → FCM node mapping (gate: every construct row maps to ≥1 FCM node)

| Construct row | FCM unit(s) | Mapping quality |
|---|---|---|
| profound/deep boredom (3rd form) | `fcm-06-third-form`, `fcm-07-particular-profound` | **direct** — the same object |
| being-bored-by (1st form) | `fcm-04-first-form` | **direct** |
| being-bored-with (2nd form) | `fcm-05-second-form` | **direct** |
| situational vs. trait/state boredom | `fcm-04-first-form` ↔ `fcm-05-second-form`/`fcm-06-third-form` | **structural** — FCM's own first-form (caused from outside) vs. second/third (arising from Dasein itself) asymmetry is the nearest thing to the situational/dispositional split (see DA-07). Not a trait concept. |
| boredom proneness | `fcm-07-particular-profound` | **analogical, weak** *(P/anticipatory-application)* — FCM has **no trait/disposition concept**. fcm-07's "profound boredom as the *Grundstimmung* of contemporary Dasein" is an epochal, not individual-difference, claim. Elpidorou & Freeman argue explicitly that profound boredom is **not** identical to trait boredom (bor-sec-04). Recorded as the nearest node, not as an equivalence. |
| mind-wandering / task-unrelated thought | `fcm-04-first-form` (*Zeitvertreib*) | **analogical** *(P/anticipatory-application)* — passing-the-time is the phenomenological description of the flight from boredom that TUT operationalizes cognitively. |
| attentional disengagement / meta-awareness | `fcm-06-third-form` (*Leergelassenheit*, telling refusal) | **structural** — being-left-empty is beings' refusal *of* engagement; the closest FCM structure to disengagement, though FCM's is disclosive, not attentional. |
| boredom-as-regulatory-signal | `fcm-06-third-form` (*Versagen*, "telling refusal is a telling") | **structural** — Heidegger's own message-bearing structure; Slaby's faithful reconstruction (bor-sec-13) is the bridge. |
| flow / engagement (contrast pole) | `fcm-05-second-form` | **structural** — the dinner-party's outward lively participation masking underlying boredom is FCM's own surface-engagement/depth-emptiness structure, and the sharpest phenomenological caution against reading engagement measures as boredom's absence. |
| monotony / meaninglessness | `fcm-06-third-form` (indifference of beings as a whole) | **direct-ish** — FCM's "telling refusal" of beings as a whole is the ontological form of what monotony/meaninglessness names ontically. |
| temporality of boredom (time-drag) | `fcm-06-third-form` (*Gebanntheit*, *Augenblick*, §§32–33) | **direct** — *Langeweile* as "the lengthening of the while" is FCM's own thesis. |

**Gate satisfied**: 11/11 rows map to ≥1 FCM node. **But note the honest distribution**: only 4 rows map *directly*; 5 map
*structurally*; 2 are *analogical and weak*. The mapping degrades exactly as the constructs become psychological — which
is the same finding as §2, seen from the row axis.

---

## 4. Column → dataset channel mapping (gate: every measure column maps to ≥1 dataset channel)

**RESOLVED 2026-07-29.** The `corpus/index/Boredom Experiment (VR Attention Study)/` entry — absent at Phase 0 and
Phase 3, which is why every row below carried a `****** UNVERIFIED:` placeholder — now exists, with seven
DATASET-CHANNEL nodes (`ch-selfreport`, `ch-eeg`, `ch-gaze`, `ch-hmd`, `ch-obs`, `ch-fig`, `ch-stimulus`), and three of
its four raw channels were processed at O-9 (2026-07-16, full N=8). All twelve pointers are resolved below against the
built entry.

**The resolution is not twelve confirmations.** Five columns resolve to a channel that exists *and* was computed; one
resolves to a channel that exists but whose measure was never computed; five resolve to **documented non-coverage** —
this dataset has no instrument for them; and one was always a category error (§5). Recording the non-coverage is the
more useful half: it states precisely what this study cannot speak to, which is directly reusable as a limitations
statement rather than a gap to be apologized for.

| Measure column | Dataset channel — status 2026-07-29 | Cluster's methodological authority |
|---|---|---|
| EEG frontal alpha asymmetry | **`ch-eeg` — channel exists, measure NOT computed.** The montage carries the frontal pair (F3/F4), so FEA is computable, but O-9 computed DMN alpha+theta and parietal alpha instead. Any future FEA index needs DA-05's arousal control. | bor-sec-30 (method), **bor-sec-27 + bor-sec-31 (caution — DA-05)** |
| EEG alpha/theta power | **`ch-eeg` — VERIFIED, computed at O-9.** DMN power in alpha (8–12) + theta (4–8), per P1's own definition; N=8. Directional only (DMN p=0.20, parietal α p=0.22). | bor-sec-29, bor-sec-27 |
| EEG functional connectivity | **NON-COVERAGE.** Four electrodes (F3/F4/P3/P4); connectivity is not meaningfully estimable at this montage and was not computed. bor-sec-33's approach has no counterpart here. | **bor-sec-33** (only first-party study; educational context) |
| EEG eyes-open vs eyes-closed | **NON-COVERAGE.** No resting baseline was recorded; all three conditions are active eyes-open viewing. (The stimulus corpus carries `EC` = eyes-closed *clip labels*, which are exemplar categories, not a resting protocol.) This dataset sidesteps Barry's caution the same way bor-sec-33 does. | **bor-sec-27** (the two are not equivalent baselines) |
| pupil dilation / pupillometry | **`ch-hmd` + `ch-fig` — VERIFIED, computed at O-9, and the dataset's one statistically robust surface** (Boring < Clinical in all 8, p=0.008 Holm, rank-biserial −1.0). `ch-fig` additionally holds a five-level denoise cascade unavailable in the raw CSV. NB CR-10's sign contradiction: this dataset's sign runs *pupil up = engaged*. | bor-sec-38 (research-grade apparatus detail); **bor-sec-40 (excludes pupil over luminance confound)**; bor-sec-35 (sign contradiction — CR-10) |
| gaze variance / fixation dispersion | **`ch-gaze` (P2 published, N=12) + `ch-hmd`/`ch-fig` (reprocessed, N=8) — VERIFIED, computed at O-9** using P2's own definition: variance of the 5-point-median Euclidean deviation from centre. Directional at N=8 (p=0.61). | **bor-sec-36** (reporting standard); bor-sec-28 (AOI/heat-map method) |
| blink / eye-closure | **NON-COVERAGE.** `ch-hmd` carries per-eye *validity* flags and a −1 invalid sentinel, which mark tracking loss rather than scored blinks; no blink measure was derived. Consistent with bor-sec-30's treatment of blinks as artifact. | bor-sec-36, bor-sec-37; **bor-sec-30 (treats blinks as artifact, not data)** |
| heart rate / HRV | **`ch-hmd` — VERIFIED, computed at O-9**, vendor-derived (Omnicept). Secondary evidence only: HRV's algorithm (RMSSD vs SDNN) is undocumented vendor black-box, S08 has heavy dropout, and both run n.s. (HR p=0.20, HRV p=0.61) — precisely bor-sec-21's directional-fractionation caution. | bor-sec-21 (**directional fractionation** — the reason HR alone will not settle anything) |
| self-report / survey scale | **`ch-selfreport` — VERIFIED.** 7-item per-video instrument, N=8 × 3 stimuli = 24 episodes, including a felt-duration probe. Critically it asks boredom **and** engagement as two separate items rather than one bipolar axis, which is what let S07 return boredom-6 ∧ engagement-7 on one stimulus — DA-04's dissociation appearing *within* a single instrument. | bor-sec-04 (**what it cannot reach**); bor-sec-28 (**null correlation**); DA-04 |
| behavioral (RT / errors) | **NON-COVERAGE.** No performance task: subjects watched, they did not respond. bor-sec-32's commission/omission dissociation has no counterpart in this design. | **bor-sec-32** (commission ≠ omission errors; P3/ERN dissociation) |
| predictive-processing model | **N/A — category error, see §5.** A modelling formalism, not an instrument; belongs in a THEORY-MODEL register. | bor-sec-20 |
| ML classification | **NON-COVERAGE.** No classifier was trained on this dataset. The three-state classifier remains a *proposed* redesign (FCM bridge §7.3), not an implemented channel — do not read bor-sec-31's 86.73% as transferable. | **bor-sec-31** (86.73%, the only validated first-party accuracy); bor-sec-41 (**borrowed-accuracy caution**) |

**Gate satisfied, and now in the stronger form:** 12/12 columns are resolved against a built entry — 5 verified and
computed, 1 channel-present-but-uncomputed, 5 documented non-coverage, 1 category error. No correspondence is
fabricated, and no placeholder remains.

---

## 5. The empty column, and why it is empty

**`predictive-processing model` has no populated cell.** This is a **category error inherited from the plan's own measure
axis**, not a gap in the literature.

Predictive processing is a **modelling formalism**, not an instrument: it does not measure anything, it explains. Darling
(bor-sec-20) is the cluster's home source and encodes it — correctly — as a `THEORY-MODEL` via a `defines` edge, not as an
`operationalizes-measure` edge. The column is therefore empty by construction.

Two notes for anyone reading the grid mechanically:

1. **bor-sec-20 is the PP home**, and the column should be read as populated by it through a `defines` relation. The count
   of `·` reflects edge-type, not absence of content.
2. **Do not confuse this column with ML "predictive analytics"** (bor-sec-39, bor-sec-41). A first pass of this
   concordance wrongly attributed the PP column to bor-sec-39 on a substring match of "predictive". Sharma et al. do
   VGG-19 feature extraction + LASSO regression — predictive *analytics*, a different thing sharing a word. The
   attribution was corrected by hand.

*(P/anticipatory-application)* Recommendation: in any successor grid, move `predictive-processing model` out of the
measure axis and into a THEORY-MODEL register, where it belongs alongside the regulatory theory and the Boredom Feedback
Model.

---

## 6. Selected cells with source-authored pairings

The strongest cells are those where a source states the construct↔measure pairing **itself** (`construct-measured-by`
edges, 32 in the cluster). These are the defensible ones:

| Construct × Measure | Unit | The source's own pairing |
|---|---|---|
| situational/trait × FEA | bor-sec-30 | The trait/state distinction is operationalized via baseline FEA (trait test) vs. FEA slope during the peg-turning task (state test) — Hypothesis 1 **not supported** (FE). |
| mind-wandering × α/θ | bor-sec-29 | Tonic theta (6–8 Hz, frontal/temporal, peak) differentiated boredom from dislike (p<.01); phasic alpha did **not** differ, so alpha indexes shared appraisal rather than boredom (FE). |
| temporality × behavioural | bor-sec-29 | Self-paced key-press RT: 35.33 ± 3.01 s for boredom vs. 8.81 ± 1.62 s for dislike, **uncorrelated** (FE). |
| attentional disengagement × ERP | bor-sec-32 | P3 = attentional-resource allocation; ERN = performance monitoring; the two are **mutually uncorrelated**, which the authors use to reject "a simple mechanism of reduced attention" (FE). |
| regulatory-signal × connectivity | bor-sec-33 | The functional/non-deficit reading is grounded in gamma-band connectivity patterns in an **educational** context (FE) — the closest any unit comes to Part III's own setting. |
| attentional disengagement × pupil+blink+fixation | bor-sec-36 | Van Orden et al.'s (2000) regression model combines fixation duration, blink duration, and pupil diameter — *(P/anticipatory-application)*, since Holmqvist et al. never frame it as boredom. |
| flow × EMG+GSR | bor-sec-44 | Flow's positive-valence/high-arousal profile operationalized via facial EMG + GSR; the GEQ flow subscale **did not** separate the conditions (FE). |
| arousal × global alpha | bor-sec-27 | Arousal operationalized via alpha's **uniform, non-topographic** reduction; activation via **regionally focal** delta/theta/beta change. The decomposition underwriting DA-05 (FE). |
| regulatory-signal × behavioural proxy | bor-sec-25 | Self-administered-shock studies (Wilson et al. 2014; Havermans et al. 2015; Nederkoorn et al. 2016) as behavioural evidence that boredom motivates action (FE). |

---

## 7. What Part III should take from this document

1. **Do not claim the literatures converge.** They are disjoint at the instrument boundary (§2). Part III's cross-cutting
   design is *novel*, and this concordance is the evidence for that novelty rather than a precedent for it.
2. **Do not validate physiology against self-report.** DA-04. The one instrument that reaches the FCM forms is the one
   with both a principled objection against it and an empirical null behind it.
3. **Report the third form as un-instrumented.** If Part III instruments profound boredom, it is doing something no source
   in this cluster does. That should be stated as a contribution and defended methodologically, not assumed.
4. **Use the psychological rows for measurement and the FCM rows for interpretation** — and keep the seam visible rather
   than papering it with a claimed equivalence the grid does not support.
5. ~~Re-verify all twelve column mappings once the entry exists.~~ **DONE 2026-07-29** — see §4. The result sharpens
   recommendation 3 rather than softening it: this dataset instruments roughly half the measure space the literature
   uses, and the half it lacks (connectivity, resting baselines, blink, behavioural performance, ML classification) is
   worth stating explicitly wherever Part III's instrumentation is compared to the field's.
