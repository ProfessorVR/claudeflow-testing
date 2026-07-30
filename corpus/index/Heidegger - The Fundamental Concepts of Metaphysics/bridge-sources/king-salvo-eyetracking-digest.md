# Bridge Source Digest — Eye-Tracking Engagement (King, Lo, Das & Salvo, ASEE 2024)

**Citation:** C. E. King, M. Lo, M. Das, D. Salvo. "Assessment of Student Engagement in Virtual Reality Clinical Immersion Environments through Eye Tracking." *2024 ASEE Annual Conference & Exposition*. Paper ID #44685. UCI IRB Exempt No. 2023-2678. 11 pp.
**Role in bridge:** the **high/low-arousal boredom distinction** — decisively — and gaze as one of the surfaces that read outward comportment. *(Revised 2026-07-29: gaze is no longer "the" surface channel standing against an EEG depth channel. Under the corrected layer assignment the whole physiology, gaze included, constitutes the occupied surface, and the depth is the subject's retrospective self-report — see the bridge §4.)* The most quantitatively mature boredom paper of the three; the direct sequel to the 2023 physiological pilot (cited there as [11]).

## Lineage (matters for the bridge)
2022 platform paper [10] → **2023 physiological pilot (N=3, multi-modal)** → **2024 eye-tracking (N=12)**. The team's own methodological arc: HR/HRV dropped as inconclusive; **EEG demoted as too noisy**; **eye tracking elevated** because its "signal-to-noise ratio … was much higher than the EEG." Convergence on gaze is significant for the bridge: gaze is exactly where Heidegger's *Zeitvertreib* (restless looking-around) becomes visible.

## Design
**N = 12** (headset eye tracking) + **4** (webcam sub-study). Same three videos. **Order changed** to (1) interesting, (2) clinical, (3) boring — because "early experiments revealed that the boring video increased levels of exhaustion, negatively impacting participants' subsequent experiences." *(Note: boredom has carryover/depleting after-effects — a boredom-relevant datum in itself.)*

## Measures
Pupil dilation; X/Y pupil location; eye-movement deviation from neutral center; **variance of gaze deviation from center** (5-point sliding-window median, Euclidean distance), 120 Hz. ANOVA at α = 0.05.

## Findings (with reliability flags)
- **[N=12] Pupil dilation:** 6/12 greater dilation for engaging vs boring (light-confound noted).
- **[N=12] Gaze-variance:** 8/12 **lower** variance for engaging vs boring.
- **[statistically significant] ANOVA:** gaze-variance **clinical vs boring p = 0.0004** — the clinical video is distinct from boring and **resembles the *engaging* video** on this feature. All other feature×video comparisons p > 0.05.
- **[clean, qualitative] Clinical "in between":** corroborated by self-report (scored more boring than the exciting sample, less boring than the boring sample).
- **★ [the windfall] Two kinds of boredom by arousal:**
  - **High-arousal boredom** — the bored participant "look[s] around the screen trying to find something to attend to in order to increase their engagement" → **high gaze-variance**.
  - **Low-arousal boredom** — a "**zombie stare**," **low gaze-variance**, observed in only **Subjects 1 & 2**.
- **[N=4] Webcam eye tracking:** avg cross-correlation 0.874 at 0.03 s lag; 0.80–0.91 across distance (1/2/3 ft), glasses, lighting (lower in dark, n.s.).

## ★ The contradiction to resolve (keystone)
**[SUPERSEDED 2026-07-29 — preserved for the record]** *On the clinical video the two instruments point opposite ways: 2023 EEG → clinical ≈ boring; 2024 gaze-variance → clinical ≈ engaging … the surface comportment (gaze) looks occupied while the underlying attunement (DMN/alpha proxy) is hollow.*

**As revised.** The O-9 reprocessing at N=8 withdrew the 2023 EEG reading (it came from one clean subject and does not replicate; clinical DMN is low, boring-like in 4/8 = chance), and with it the two-instrument split. It also exposed a prior error: assigning DMN/alpha to the *depth* treats a body signal as the attunement, which `fcm-05` C13 forbids. The divergence that survives — and it is sharper — runs between **the physiology as a whole, reading the clinical stimulus as engaged**, and **the post-video self-report, rating it 6.0/9**. A bipolar engaged↔bored scale still cannot hold both, and S07 proved it from inside one instrument: boredom-6 *and* engagement-7 on the same stimulus.

## Bridge hooks (→ `fcm-king-salvo-bridge.md`)
1. **High-arousal boredom ↔ first form** (restless *Zeitvertreib*; gaze searching for occupation). *Their* observation (faithful); the mapping is `provenance: anticipatory-application`.
2. **Low-arousal "zombie stare" ↔ third form** (profound boredom's stillness; *Zeitvertreib* fallen away).
3. **Clinical "in-between" ↔ second form** (surface/depth divergence — physiology occupied over a retrospectively empty episode; revised 2026-07-29, no longer a cross-instrument split).
4. **"What to measure next":** instrument the **divergence** of composite physiological engagement (surface) vs retrospective self-report (depth) as the second-form marker *(re-specified 2026-07-29; the old gaze-minus-DMN formula differences two measures of the same layer)*; add a time-perception probe (*Hingehaltenheit*); use the three-form grid rather than a bipolar scale; the planned Fisher's-LDA feature model is the natural place to encode form-specific signatures.
