# bor-sec-31 — Seo, Jungryul, Teemu H. Laine, and Kyung-Ah Sohn, "Machine Learning Approaches for Boredom Classification Using EEG" (2019)

**Type:** empirical biomedical-signal-processing / affective-computing experiment (single-modality EEG + ML classification) · **Discipline:** biomedical signal processing and machine learning applied to emotion/boredom recognition · **Depth:** deep · **Corpus role:** Strand D — the cluster's central STEM/ML-classification unit; the only source here reporting a validated, cross-validated, multi-participant accuracy figure for EEG-based boredom classification (86.73%). Reuses the boredom-evoking stimulus from sibling unit bor-sec-28 (Kim, Seo & Laine 2018) and claims methodological improvement over it. Strongest current candidate for a `grounds-measure` bridge to the not-yet-built Boredom Experiment (VR Attention Study) dataset's ML-classification channel.

## 1. Thesis/Aim

Seo, Laine, and Sohn (*Journal of Ambient Intelligence and Humanized Computing* 10, 2019, pp.3831-3846) note that of 26 prior EEG emotion-classification studies they reviewed, only three (Shen et al. 2009; Katahira et al. 2018; Kim et al. 2018) targeted boredom at all, and none produced a validated, multi-participant classification model with a reported accuracy (FE, p.3833-3834, 3836). To close this gap they collect EEG from 28 Korean adults via a two-electrode consumer headband during video stimuli designed to evoke boredom and non-boredom, extract five families of spectral-power/asymmetry features, and train k-nearest neighbors (k-NN), multilayer perceptron (MLP), and random forest (RF) classifiers, validated by 10-fold cross-validation (FAITHFUL-Seo et al., p.3831). Their best result — 86.73% accuracy with k-NN — is framed as comparable to studies using far denser electrode montages, demonstrating boredom classification is feasible from a low-cost, wearable two-electrode sensor (FAITHFUL-Seo et al., p.3831, 3843).

The abstract states the trained algorithms were "support vector machine, random forest, and k-nearest neighbors" (FE, p.3831), but §3.6, §4.5, and Tables 8-9 explain and report only k-NN, MLP, and RF — SVM is never trained, tuned, or reported anywhere. This is a genuine internal inconsistency in the published article, flagged here rather than silently corrected (FE).

## 2. Structure

16 pages across six sections plus references; pagination is reconstructed from embedded page markers and is approximate — the source's two-column layout causes pdftotext to interleave content out of visual order (e.g., Table 6 appears well after its logical §2.2.7 discussion; §§2.2.4/2.2.5 and §§4.2/4.3 are transposed).

1. **Abstract** (p.3831) — task, sample, features, algorithms, CV, 86.73% headline result.
2. **§1 Introduction** (p.3831-3832) — motivates EEG-based emotion recognition and boredom's educational relevance (Kanevsky 1994; Oroujlou & Vahedi 2011; Yeager et al. 2014); reviews prior non-EEG boredom-detection work before narrowing to the EEG gap.
3. **§2 Background** (p.3832-3836) — §2.1 Boredom: Russell's (1980) circumplex placement (third quadrant, low arousal/low valence); trait (Fahlman et al. 2013) vs. state (Eastwood et al. 2012) definitions, with state explicitly adopted; Vogel-Walcutt et al.'s (2012) 37-definition survey. §2.2 Related work: structured review of 26 prior EEG-emotion studies by participants, electrode count, auxiliary signals, target emotions, feature extraction, frequency bands, and models/accuracies (Table 6).
4. **§3 Methodology** (p.3836-3841) — participants, the Muse EEG sensor, video-stimulus protocol, data-collection system, feature extraction (ABP/NABP/DE/DASM/RASM), classification models (k-NN/MLP/RF).
5. **§4 Results** (p.3841-3842) — questionnaire results, watching-time variability, window-size ablation, Wrapper Subset Evaluator (WSE) feature refinement, final model evaluation (Table 9).
6. **§5 Discussion** (p.3842-3844) — overfitting risk of small windows; gamma/beta finding against Katahira et al. (2018); novelty claims against Shen et al. (2009) and Kim et al. (2018).
7. **§6 Conclusion** (p.3843-3844) — restates 86.73% result; proposes future EEG+GSR fusion.
8. **Acknowledgements/References** (p.3844-3846) — Korea MSIT/ITRC funding; ~65 references.

## 3. Constructs

- **situational vs. trait/state boredom** — explicitly adopted: "This study treats boredom as a state of emotion" (FAITHFUL-Seo et al., ~p.3832), against Fahlman et al.'s (2013) trait view.
- **boredom proneness** — not measured; cited only as the trait pole set aside by the state framing (FE, ~p.3832).
- **attentional disengagement / meta-awareness** — reviewed, not adopted: Eastwood et al.'s (2012) three-part attentional definition is summarized as one of several surveyed accounts, but the authors' own operational grounding is Russell's arousal/valence placement plus physiological-change detection, not attention-failure (FAITHFUL-Seo et al., ~p.3832-3833).
- **flow / engagement (contrast pole)** — treated only via citation of Katahira et al. (2018), whose frontal-theta-during-flow finding is used as interpretive support for Seo et al.'s own theta result; flow is not itself measured (FAITHFUL-Seo et al., ~p.3842).
- **monotony / meaninglessness** — operationalized without being named: the boredom stimulus (a small circle tracing a larger circle's boundary at constant slow speed, 90s/rotation, looping until manually stopped) is a de facto monotony induction (FE, ~p.3838-3839); "monotony" itself never appears in the text.
- **temporality of boredom (time-drag)** — cited only, via Fahlman et al.'s "experiencing a slow passage of time" (FAITHFUL-Seo et al., ~p.3832); not independently developed.
- **boredom-as-regulatory-signal (functional account) / mind-wandering / task-unrelated thought** — not treated; neither term nor comparable construct appears anywhere. Boredom is framed purely as a classification target for adaptive systems, not a construct with adaptive/regulatory value.
- **profound/deep boredom (FCM 3rd form) / being-bored-by (1st form) / being-bored-with (2nd form)** — not treated; a purely empirical biomedical-signal article, Heidegger never cited.

## 4. Measures & Methods

**Apparatus.** The Muse headband (2014, four electrodes — FP1, FP2, TP9, TP10, 10-20 system) provided raw EEG at 220 Hz and band powers at 10 Hz (FAITHFUL-Seo et al., ~p.3837). TP9/TP10 attached unreliably and caused significant data loss, so all reported features derive only from FP1/FP2 (FE, ~p.3839). A Grove GSR sensor + Arduino recorded galvanic skin response throughout but was explicitly not analyzed here, reserved for future work (FAITHFUL-Seo et al., ~p.3837-3838, 3844). A custom .NET/C# system with camera, microphone, and OBS screen capture ran the dual-monitor experiment (FE, ~p.3839).

**Sample.** N=28 Korean students/staff (13 male, 15 female; ages 20-34, mean 23.62), across two sessions (18 participants, then 10) (FAITHFUL-Seo et al., ~p.3836-3837).

**Protocol.** Neutralization (30s IAPS cloud image) alternated with non-boredom stages (StarCraft II trailer, max 155s; or a Korean comedy clip, max 232s) and a boredom stage (the infinitely-looping rotating-circle video reused from Kim et al. 2018) (FAITHFUL-Seo et al., ~p.3838-3839). Non-boredom videos auto-advanced; the boredom video replayed until manually stopped; actual watch times across 56 playbacks ranged 7.3-287.9s (FAITHFUL-Seo et al., ~p.3841).

**Ground-truth labeling.** A five-point Likert item (None/Little/Somewhat/Much/Very Much) per stage was dichotomized into weak-boredom (30/56 answers) and strong-boredom (28/56) groups, which supplied class labels for every classifier — not the raw EEG signal (FAITHFUL-Seo et al., ~p.3841-3842).

**Feature extraction (MATLAB).** From the last seven seconds of each stage's FP1/FP2 data, per five Muse-defined bands (delta 1-4, theta 4-8, alpha 7.5-13, beta 13-30, gamma 30-44 Hz): absolute band power (ABP, 10 features), normalized ABP (NABP, 10, per Aksoy & Haralick 2001), differential entropy (DE, 10, per Zheng et al. 2017), differential asymmetry (DASM = DE_left − DE_right, 5) and rational asymmetry (RASM = DE_left/DE_right, 5) — the latter two grounded in Davidson & Fox's (1982) and Davidson's (1992) frontal-asymmetry theory (FAITHFUL-Seo et al., ~p.3839-3840). Total: 40 features; Zheng et al.'s vertical-symmetry features could not be computed with only two electrodes (FE, ~p.3839). One-second windows yielded 392 labeled samples (28 × 2 stages × 7 windows) (FAITHFUL-Seo et al., ~p.3841-3842).

**Classification (Weka).** k-NN (Aha et al. 1991; three weighting options), MLP (Rosenblatt 1961; one hidden layer, four node-count formulas), RF (Ho 1995; Barandiaran 1998; Weka defaults) — each with 10-fold cross-validation (FAITHFUL-Seo et al., ~p.3840-3841).

**Window-size ablation.** 1s/0.5s/0.1s windows: accuracy rose sharply as window shrank (0.1s k-NN reaching ~99.9%), attributed to overfitting (near-identical adjacent samples split across folds) rather than genuine signal; the 1-second window was deliberately reported despite lower raw accuracy (FAITHFUL-Seo et al., ~p.3842-3843).

**Feature refinement (WSE, 10-fold CV).** RASM, DASM, and DE were rarely selected as informative — frontal-asymmetry features underperformed for boredom specifically, in tension with their prominence in the broader emotion-EEG literature (e.g., Zheng et al. 2017). Gamma-band features dominated the top selections; theta was never selected; beta was selected less than gamma. Read as convergent with Katahira et al.'s (2018) flow-theta/boredom-beta findings (FAITHFUL-Seo et al., ~p.3841-3842).

**Result.** Best model: k-NN, "1/distance" weighting, WSE-refined "10-2" feature subset, 1s window, 10-fold CV — **86.73% accuracy**, an 11.2-point gain over the unrefined 40-feature baseline (75.51%) (FAITHFUL-Seo et al., ~p.3842-3843). MLP and RF each peaked at 78.57% accuracy (AUC 0.858 and 0.866 respectively, feature group "10-6") (FAITHFUL-Seo et al., ~p.3842-3843). Lin et al. (2009) reported 92.57% for a different task using 30+ electrodes; Seo et al. read their own two-electrode result as a favorable usability/accuracy trade-off (FAITHFUL-Seo et al., ~p.3843).

## 5. Findings/Claims

- Among 26 reviewed EEG emotion-classification studies, only Shen et al. (2009) and Kim et al. (2018) targeted boredom, and neither produced a validated, adequately powered classifier: Shen et al. used one participant with no clearly reported validation; Kim et al. established only an EEG-gaze correlation with no prediction model or accuracy. Katahira et al. (2018) examined EEG correlates of flow (vs. boredom) but likewise produced no classifier (FAITHFUL-Seo et al., ~p.3833-3834, 3836, 3843-3844).
- k-NN with WSE-refined features and "1/distance" weighting achieved the study's best result: 86.73% accuracy at a one-second window, 10-fold CV (FAITHFUL-Seo et al., ~p.3842-3843).
- WSE feature refinement improved accuracy by 11.2 points over the unrefined baseline (FAITHFUL-Seo et al., ~p.3843).
- Gamma-band features were most informative for boredom specifically; theta was never selected; beta was selected less than gamma; frontal-asymmetry features (DASM, RASM) and DE were rarely selected — a tension with their prominence in the general emotion-EEG literature (FAITHFUL-Seo et al., ~p.3841-3842).
- Smaller windows produced much higher raw accuracy but this is interpreted as overfitting, not genuine signal; the authors chose the 1-second window on methodological grounds despite the accuracy cost (FAITHFUL-Seo et al., ~p.3842-3843).
- Three claimed novelties over prior boredom-EEG work: a substantially larger sample than Shen et al. (2009)'s single participant; validated 10-fold cross-validation, unlike Shen et al.'s unreported method; and a two-electrode wearable sensor versus the ten-plus-electrode montages used by most reviewed studies, trading a small accuracy cost against Lin et al. (2009)'s 92.57%/30+-electrode result for substantially greater usability (FAITHFUL-Seo et al., ~p.3843-3844).
- The abstract's claim of training an SVM is unsupported by the Methods/Results, which explain and report only k-NN, MLP, and RF — an internal inconsistency in the source (FE).
- Future work proposed: fuse the already-collected but unanalyzed GSR data with EEG for higher accuracy, and address k-NN's residual overfitting risk (FAITHFUL-Seo et al., ~p.3844).

## 6. Constructs-treated & Measures-operationalized

| Item | Axis | Treatment | Locus |
|---|---|---|---|
| situational vs. trait/state boredom | construct | explicitly adopted state framing against Fahlman et al.'s (2013) trait view | ~p.3832 |
| boredom proneness | construct | not measured; cited only as the trait pole set aside by design | ~p.3832 |
| attentional disengagement / meta-awareness | construct | Eastwood et al.'s (2012) definition reviewed among several; not adopted as the operative construct | ~p.3832-3833 |
| flow / engagement (contrast pole) | construct | treated only via citation of Katahira et al. (2018)'s flow-vs.-boredom EEG comparison | ~p.3842 |
| monotony / meaninglessness | construct | operationalized (unnamed) via the looping, slow-motion circle stimulus reused from Kim et al. (2018) | ~p.3838-3839 |
| temporality of boredom (time-drag) | construct | cited only, via Fahlman et al.'s "slow passage of time" manifestation | ~p.3832 |
| EEG alpha/theta power | measure | ABP/NABP alpha and theta sub-bands computed but WSE-uninformative; theta never selected; convergent with Katahira et al.'s theta-flow finding | ~p.3839-3842 |
| EEG frontal alpha asymmetry | measure | DASM/RASM computed per band (incl. alpha) from FP1-FP2 DE, grounded in Davidson & Fox (1982)/Davidson (1992); rarely selected by WSE | ~p.3839-3840, 3841-3842 |
| EEG functional connectivity | measure | structurally precluded — Zheng et al.'s (2017) connectivity-adjacent symmetry features require >2 electrode pairs, unavailable here | ~p.3839 |
| EEG eyes-open vs. eyes-closed | measure | not treated; protocol is continuous eyes-open video viewing | n/a |
| heart rate / HRV | measure | not treated; GSR (a related autonomic channel) collected via Grove sensor + Arduino but explicitly unanalyzed, reserved for future work | ~p.3837-3838, 3844 |
| self-report / survey scale | measure | 5-point Likert boredom item per stage; dichotomized (weak n=30/strong n=28) to generate all ground-truth class labels | ~p.3841-3842 |
| ML classification | measure | Weka k-NN/MLP/RF, 10-fold CV, WSE refinement; best result k-NN 86.73% (10-2, 1/distance, 1s); abstract's SVM claim unsupported by Methods/Results | ~p.3840-3843 |
| pupil dilation, gaze variance, blink/eye-closure, behavioral (RT/errors), predictive-processing model | measure | not treated; no eye-tracking, performance-task, or predictive-coding instrumentation anywhere in this study | n/a |

## 7. Analytical role

*(anticipatory-application)* This source is the strongest candidate in the currently-built portion of Strand D for a `grounds-measure` bridge to the not-yet-built Boredom Experiment (VR Attention Study) dataset's plausible "EEG-based ML boredom classifier" channel: it is the only source here reporting a validated, cross-validated, multi-participant boredom-classification accuracy, and its feature-selection result (gamma/beta informative; theta/alpha/frontal-asymmetry comparatively uninformative for boredom specifically) is the most direct source-grounded guidance in this corpus for which spectral features a future EEG channel should prioritize. The dataset entry does not yet exist and its instrumentation is unknown, and this finding derives from a two-electrode consumer sensor on passive video-watching rather than a VR task; any linkage requires independent confirmation and is flagged `****** UNVERIFIED:` below *(P/anticipatory-application)*.

*(anticipatory-application)* The ground-truth method — collapsing a five-point Likert item into a binary weak/strong label to supervise the classifiers, discarding ordinal information — is a design trade-off worth weighing deliberately, not by default, if Part III ever pairs self-report boredom items with a physiological channel *(P/anticipatory-application)*.

*(anticipatory-application)* The electrode-count/accuracy trade-off (86.73% with two electrodes vs. Lin et al.'s 92.57% with 30+) suggests that a low-cost, wearable EEG channel could retain substantial classification performance if a future dataset entry favors ecological validity (e.g., VR-headset-integrated sensing) over a marginal accuracy gain from a dense-array system *(P/anticipatory-application)*.

*(anticipatory-application)* Because this study's stimulus and rationale are inherited directly from sibling unit bor-sec-28 (Kim, Seo & Laine 2018), and Seo et al. explicitly position their larger sample, validated cross-validation, and lower-burden sensor as improvements over that earlier study, Part III should treat bor-sec-28 and bor-sec-31 as one evolving research program rather than two independent evidentiary sources — both derive from the same authorship group and induction stimulus, tempering any impression of independent convergence *(P/anticipatory-application)*.

*(anticipatory-application)* Findings derive from N=28 healthy young Korean adults exposed to a single rotating-circle stimulus — limitations the authors themselves flag. Generalizing the gamma/beta feature-selection result to Part III's own populations or to VR-native (rather than 2D-screen) boredom induction should be treated as a hypothesis for replication, not an established fact *(P/anticipatory-application)*.
