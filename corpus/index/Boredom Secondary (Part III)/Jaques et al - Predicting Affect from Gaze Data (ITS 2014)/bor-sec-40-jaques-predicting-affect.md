# bor-sec-40 — Jaques, Natasha, Cristina Conati, Jason M. Harley, and Roger Azevedo, "Predicting Affect from Gaze Data during Interaction with an Intelligent Tutoring System" (2014)

**Type:** empirical HCI/affective-computing experiment (gaze-only affect classification) · **Discipline:** ITS/affective computing (ML on eye-tracking features) · **Depth:** map (haystack-derived, 10pp from a 727pp ITS-2014 proceedings volume) · **Corpus role:** Strand E's founding gaze-only affect-prediction study, already cited by Kim et al. (bor-sec-28) as the eye-tracker-only precedent their dual-modality design responds to; strongest candidate for a `grounds-measure` bridge to the not-yet-built VR Attention Study dataset's eye-tracking channel.

## 1. Thesis/Aim

Jaques, Conati, Harley, and Azevedo ask whether eye-tracking data alone — without pupil dilation or other physiological/facial/dialog features — can predict boredom and curiosity during MetaTutor interaction, an ITS teaching the circulatory system while scaffolding self-regulated learning (FE, p.29). Their gap is twofold: prior gaze-affect work used hand-engineered heuristics rather than learned classifiers (Wang, Chignell, and Ishizuka's empathic tutor; D'Mello, Olney, Williams, and Hays's GazeTutor), or treated pupil dilation rather than fixation/saccade features as the informative signal (Muldner, Christopherson, Atkinson, and Burleson) (FAITHFUL-Jaques et al., p.29). Curiosity is a second named contribution, called rarely studied in affective computing (FE, p.29-30). The stated aim, "insight into how to detect when students disengage from MetaTutor" (FAITHFUL-Jaques et al., p.29), is instrumental and detection-oriented rather than theoretical.

## 2. Structure

Extracted range = the article's own pagination, pp.29-38 (10pp); internal boundaries reconstructed from running-head tokens, approximate.

Abstract (p.29): aim/findings preview. §1 Introduction (p.29-30): two gaps; curiosity via Pekrun. §2 Related Work (p.30-31): DBN/dialog affect modeling; multi-sensor detection (Sabourin, Mott, and Lester: 75%/85%; D'Mello and colleagues: 60-70%); gaze-specific prior work (Smilek, Carriere, and Cheyne; Muldner et al.; GazeTutor); companion MetaTutor/FaceReader study (Harley, Bouchet, and Azevedo). §3 MetaTutor User Study (p.31-32): interface, N=67, Tobii T60, EVQ protocol. §4 Eye Tracking Data Analysis (p.32): EMDAT extraction, pupil-dilation exclusion. §5 Machine Learning Experiments (p.32-33): binary classification, EP/EA labeling, Weka, PCA-vs-WFS. §6 Results (p.34-36): window-length (Fig.2), important features (Fig.3), time-dependent prediction (Figs.4-5). §7 Conclusions (p.36-37) restates findings, proposes EDA. References (p.37-38): 32 items.

## 3. Constructs

Honest accounting: this detection-oriented HCI/ML paper never theorizes boredom or curiosity — both are operationalized purely as EVQ Likert items ("Right now I feel bored") — so several controlled-axis rows apply only partially.

- **Attentional disengagement / meta-awareness** — organizing construct in all but name: the abstract's payoff is detecting "when students disengage" (p.29); §6.2 entirely characterizes engaged vs. disengaged gaze across seven AOIs.
- **Flow / engagement (contrast pole)** — boredom/low-curiosity's antonym throughout ("engagement is associated with user satisfaction," citing Forbes-Riley et al., p.30), never tied to Csikszentmihalyi, a looser usage than Kim et al.'s (bor-sec-28).
- **Situational vs. trait/state boredom** — implicitly state-oriented (repeated "right now" items); no proneness scale (p.32).
- **Mind-wandering / task-unrelated thought** — never named; disengaged students' "scattered gaze transitions, without remaining focused on a single AOI" (p.35) is the closest analogue *(P/anticipatory-application)*.
- **Temporality of boredom (time-drag)** — not phenomenological; the paper's "temporality" is methodological (window/report timing as predictors), worth flagging rather than conflating.
- **Boredom-as-regulatory-signal; boredom proneness; monotony/meaninglessness; FCM forms** — not treated/not applicable; MetaTutor is content-rich, not a monotony paradigm, and no phenomenological vocabulary appears.

## 4. Measures & methods

**Participants and protocol.** Sixty-seven undergraduates (varied programs, unrelated to MetaTutor's content) used MetaTutor wired with several sensors including a **Tobii T60** eye tracker (p.31-32). The source states session length inconsistently — "approximately 90 minutes" (p.31) vs. "the one hour learning session" (p.32) — a discrepancy reported rather than silently resolved. Affect self-report used the 19-item **Emotions-Value Questionnaire (EVQ)**, a modified Pekrun Academic Emotions Questionnaire subscale (McGill), 5-point Likert, at baseline and every 14 minutes (5 reports/student). Boredom (M=2.60, SD=0.69) and curiosity (M=2.93, SD=0.71) are cited to the companion Harley, Bouchet, and Azevedo (2013) study on the same dataset (p.32).

**Gaze processing.** Following Bondareva et al.'s (2013) validation procedure, low-quality participants were dropped, leaving **N=51**. Fixation/saccade data were processed via **EMDAT** into application-independent features (fixation count/duration, saccade length, relative/absolute path angle) plus features for seven **AOIs** — Text, Image, Overall Learning Goal (OLG), Subgoals, Learning Strategies Palette (LSP), Agent, Table of Contents (TOC) — covering longest fixation, proportion of fixations/time, AOI-pair transitions, and first/last-fixation timing: **166 features** total. Pupil dilation was explicitly excluded: testing occurred in a room with a window, a luminance confound flagged via footnote (p.32).

**Classification design.** Boredom and curiosity were separate binary problems (Emotion Present ≥3 / Absent <3, Harley et al.'s convention), not one joint category, since an imperfect negative correlation (r=-.333, p<.001) still left 18% of reports rating both present and 13% both absent (p.32-33). Four Weka algorithms (Random Forest, Naive Bayes, Logistic Regression, SVM) ran via 10-fold CV against a majority-class baseline (accuracy + kappa); PCA and Wrapper Feature Selection (WFS, nested 10-fold CV) were compared, WFS preferred throughout. Two Bonferroni-corrected GLM experiments followed: 4-classifier × 6-window-length (100% [14 min] to 1% [8s]), then, at the best window, 4-classifier × 4-report-time (p.33-34).

## 5. Findings/Claims

- Longer windows beat short ones for both emotions (significant window-length effects, both p<.001); curiosity beat baseline only at the full 100% window (M=63.45%); boredom at 100% and 75% — contradicting the field's common ~20-second window convention (citing Gutica and Conati), though Random Forest tolerates small intervals better (p.34-35).
- Engaged (curious/not-bored) students show more TOC-TOC transitions, longer TOC fixations, and more image/OLG attention; disengaged students show scattered transitions without sustained AOI focus, except frequent subgoal fixations (p.34-35, Fig.3).
- Curious students fixate shorter on the Agent AOI — notable since a companion study (Bondareva et al.) found Agent the only AOI *not* predictive of learning gains (p.35).
- Per-report-time classification improved results: boredom peaked at report 1 (Logistic Regression, 68.83%, kappa=.330); curiosity showed a significant report-time effect, report 3 significantly best (Random Forest, 73.17%, kappa=.416) (p.36).
- Feature importance shifts across report times (e.g., subgoal features relevant to curiosity only at report 3), unexplained by the authors (p.36, Fig.5).
- Conclusion: gaze alone usefully predicts both emotions (~69%/kappa=.33 boredom, ~73%/kappa=.42 curiosity) despite typically needing multimodal fusion for higher accuracy (citing Sabourin et al.'s 75%/85%); future work proposes adding EDA (p.36-37).

## 6. Constructs-treated & Measures-operationalized (page-anchored)

| Item | Axis | Treatment | Locus |
|---|---|---|---|
| Attentional disengagement / meta-awareness | construct | organizing construct; §6.2 = engaged vs. disengaged gaze | p.29, 34-35 |
| Flow / engagement (contrast pole) | construct | boredom/low-curiosity's antonym (Forbes-Riley et al.); no flow theory | p.30 |
| Situational vs. trait/state boredom | construct | implicitly state-oriented ("right now" items); no trait scale | p.32 |
| Mind-wandering / task-unrelated thought | construct (analogical) | never named; scattered AOI transitions the closest analogue | p.35 |
| Temporality of boredom (time-drag) | construct (not phenomenological) | "temporality" = window/report timing as predictors | p.33-36 |
| Boredom-as-regulatory-signal; boredom proneness; monotony/meaninglessness | construct | not treated | — |
| Gaze variance / fixation dispersion | measure | Tobii T60; EMDAT 166 features (application-independent + 7-AOI); N=51/67 | p.31-32, 34-35 |
| Pupil dilation / pupillometry | measure | explicitly excluded (luminance confound) | p.32 (fn.) |
| Self-report / survey scale | measure | 19-item EVQ, 5-pt Likert, 5x/student; M=2.60 boredom, M=2.93 curiosity | p.32 |
| ML classification | measure | Weka RF/NB/LR/SVM; 10-fold CV; PCA vs. WFS; best .330/.416 kappa | p.32-34, 36 |
| EEG; heart rate/HRV; predictive-processing; behavioral RT/errors; blink/eye-closure | measure | not treated — gaze-only design | — |

## 7. Analytical role

*(P/anticipatory-application — interpretive links to the future dataset entry and Part III, not claims Jaques et al. make themselves.)*

This source is the strongest available candidate for a `grounds-measure` bridge to the not-yet-built Boredom Experiment (VR Attention Study) dataset's eye-tracking channel: its Tobii T60 apparatus, seven-AOI/EMDAT schema, and WFS-plus-classifier pipeline offer a concrete gaze-only template. **`****** UNVERIFIED:`** no such dataset entry exists as of 2026-07-14, and VR headset-integrated eye tracking would likely differ in geometry (3D gaze vectors, headset-relative AOIs) from this fixed, seven-region, 2D screen-based schema.

Second, the central finding — longer windows beat the field's ~20-second convention, and per-timepoint classification beats pooling — cautions Part III's survey design: momentary self-reports may not correspond to short behavioral windows, and attentional correlates may shift across a session. Relatedly, this gaze-only approach, benchmarked against Sabourin et al.'s higher-accuracy multimodal fusion, models the single-modality-vs-multimodal trade-off recurring across this cluster's STEM units (e.g., Kim et al., bor-sec-28) — useful for calibrating realistic accuracy expectations for any future gaze-only or self-report-only Part III instrument.
