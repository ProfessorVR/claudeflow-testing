# bor-sec-41 — Wang, Ruijie, Yuanchen Xu, and Liming Chen, "GazeMotive: A Gaze-Based Motivation-Aware E-Learning Tool for Students with Learning Difficulties" (2019)

**Type:** demonstration/system paper (HCI, assistive e-learning) · **Discipline:** user modeling and personalisation for assistive learning technology · **Depth:** map (5pp extracted, book pp.544-548, INTERACT 2019, LNCS 11749, DOI 10.1007/978-3-030-29390-1_34) · **Corpus role:** Strand E — gaze-based motivation-assessment demo system for students with learning difficulties (dyslexia); thematically adjacent to bor-sec-35 (Charoenpit & Ohkura) and bor-sec-39 (Sharma et al.), both possibly built in this batch and not yet checked on disk.

## 1. Thesis/Aim

GazeMotive is a working Windows-desktop demonstration of applying eye tracking to real-time motivation assessment for students with learning difficulties (FE, p.544). It introduces no new theory or validation study; it *implements* a motivation model and gaze-based prediction models the same author group already developed and validated (refs [1],[2],[5]): a Tobii eye tracker records gaze during learning, gaze features plus self-report feed previously-built logistic-regression models to infer motivational states, and a pedagogical agent delivers personalised text/picture feedback to sustain motivation and engagement (FE, p.544-545). "Boredom" is never named; the paper's own vocabulary is uniformly "motivation" and "engagement," with disengagement gestured at only indirectly via "dropouts" and "low levels of engagement" (FE, p.544).

## 2. Structure

1. **Abstract/keywords** (p.544) — system, architecture, aim.
2. **1 Introduction — 1.1 Background** (p.544-545) — motivates personalised learning for students with learning difficulties; prior assistive personalisation targeted emotion/cognition/attention, not motivation.
3. **1.2 Motivation Assessment** (p.545) — the prior multi-factor motivation model and prior gaze-prediction study (ref [5], 81.3% accuracy).
4. **1.3 The Demonstration System** (p.545-546) — gaze + self-report feeding the existing regression models.
5. **2 GazeMotive Walkthrough** (p.546-547) — expert interface (materials, quizzes, AOIs, Fig.1) and learner interface (agent feedback, Fig.2).
6. **3 Conclusion** (p.547) — restates contribution; future work.
7. **References** (p.547-548) — 7 items, five of them the authors' own prior/companion work.

## 3. Constructs

This is honestly a motivation-assessment demonstration, not a boredom study, and the construct axis maps thinly, mostly by inference.

- **flow / engagement (contrast pole)** — the paper's real organizing construct: the system exists to detect and remediate low motivation/engagement and sustain "motivation-enhanced learning experience and better learning performance" (FE, p.545-546); "motivation and engagement" are named together as the target outcome (FE, p.544).
- **attentional disengagement / meta-awareness** — treated only indirectly, via two gaze-detected proxies rather than the paper's own vocabulary: a "negative reading experience" flagged during a learning page, and a user "detected... as having not put enough effort" during a quiz (FE, p.546-547, Fig.2) (P/anticipatory-application for the mapping).
- **situational vs. trait/state boredom** — not treated as boredom, but the motivation model draws a parallel stability split: Self-Efficacy and Attitudes Toward School are trait-like and "usually remain stable in a short-term period," assessed once via self-report, while Confirmed Fit and Reading Experience vary dynamically and are assessed continuously from gaze (FE, p.546) — a motivation-domain analogue, not a boredom claim.
- **boredom proneness, mind-wandering/task-unrelated thought, monotony/meaninglessness, temporality of boredom, boredom-as-regulatory-signal, profound/deep boredom, being-bored-by, being-bored-with** — none treated; no phenomenological or boredom-specific vocabulary appears in the extracted text.

## 4. Measures & methods

GazeMotive's contribution is architectural, not empirical: it reuses sample and accuracy figures from a companion study (ref [5]) rather than reporting a new N. The application runs on a **Tobii Eye Tracker 4C**, computing gaze features over expert-defined **Areas of Interest (AOIs)** marked per page by clicking polygon corners (FE, p.546). Two gaze features carry prediction weight — average pupil diameter and fixation number — drawn from the cited prior experiment (ref [5]), which reported **accuracy up to 81.3%** via **logistic regression**; GazeMotive states it "improved the prediction models by including only the gaze features that have significant prediction power," reporting no new accuracy figure of its own (FE, p.545-546). Factors like Confirmed Fit and Reading Experience are assessed purely from gaze via these models; Attitudes Toward School and Self-Efficacy are assessed from **self-input data** at session start, since intrinsic-motivation factors are treated as short-term stable (FE, p.546). Materials (adapted from an Open University course, ref [6]) use 16-40pt Verdana on light-yellow background per dyslexia-oriented design guidance (ref [7]) (FE, p.546). Output is a pedagogical agent delivering text/picture feedback at two points — learning pages and quizzes, where quiz-answer correctness (behavioral) combines with gaze-detected effort (FE, p.546-547, Fig.2).

## 5. Findings/Claims

- The system implements the prior motivation model and prediction models inside a working expert/learner application, using Tobii 4c gaze plus self-report to assess motivational factors and trigger real-time feedback (FE, p.545-547).
- The 81.3% accuracy figure is a **cited result from the authors' own prior study** (ref [5]), not newly generated here (FE, p.545-546).
- Two concrete feedback triggers: "negative reading experience" from gaze on a learning page, and "not put enough effort" from gaze co-occurring with an incorrect quiz answer (FE, p.546-547, Fig.2).
- Future work named: continued model/algorithm validation, improved interface design, more motivational dimensions, more diverse feedback formats (speech, animation) (FE, p.547).
- No new statistics, effect sizes, or sample are reported for GazeMotive itself; quantitative claims trace to ref [5].

## 6. Constructs-treated & Measures-operationalized (page-anchored)

| Item | Axis | Treatment | Locus |
|---|---|---|---|
| flow / engagement (contrast pole) | construct | organizing goal-construct: detect/remediate low motivation-engagement, sustain the positive pole | p.544-546 |
| attentional disengagement / meta-awareness | construct | indirect proxy only — "negative reading experience," "not put enough effort," gaze-detected, unnamed as such (P/anticipatory-application) | p.546-547 |
| situational vs. trait/state boredom | construct | motivation-domain analogue: stable self-report factors vs. dynamic gaze-assessed factors, not a boredom claim | p.546 |
| gaze variance / fixation dispersion | measure | Tobii Eye Tracker 4C; AOI-based features incl. fixation number; accuracy figure borrowed from ref [5] | p.545-546 |
| pupil dilation / pupillometry | measure | average pupil diameter, cited from ref [5] as a significant predictor | p.545-546 |
| self-report / survey scale | measure | self-input for stable intrinsic factors; multi-item questionnaire underlying the model (refs [1],[2]) | p.545-546 |
| ML classification | measure | logistic regression (from ref [5]) mapping gaze to motivational scores; feature-pruned, no new accuracy reported | p.545-546 |
| behavioral (RT / errors / performance-monitoring) | measure | quiz-answer correctness combined with gaze-detected effort, quiz-stage feedback trigger (Fig.2b) | p.546-547 |

Not treated: EEG (any form), heart rate/HRV, blink/eye-closure, predictive-processing modeling, and every boredom-specific construct on the controlled axis.

## 7. Analytical role

*(P/anticipatory-application — the following are our interpretive links to Part III and the future dataset entry, not claims Wang, Xu & Chen make themselves.)*

GazeMotive is directly relevant to Part III's student-boredom/engagement frame despite never naming boredom: it is a working instance of the intervention logic Part III's VLE analysis gestures toward — real-time gaze-based detection of a negative learning state feeding a personalised remediation loop — offering a concrete existence-proof that motivation/engagement decline is operationally detectable from gaze features (pupil diameter, AOI fixation counts) without self-report alone, at a reported 81.3% accuracy in the companion study it draws on. Because the system is a demonstration rather than a validation, that accuracy figure belongs to ref [5], not to GazeMotive itself, and the demo's existence should not read as independent confirmation of it.

This unit is the strongest available candidate for a `grounds-measure` bridge to the not-yet-built *Boredom Experiment (VR Attention Study)* dataset entry's prospective gaze-based motivation/engagement channel: the AOI-plus-pupil-diameter-plus-fixation-count feature set, and the trait/state-like split between self-report- and gaze-assessed factors, sketch a plausible template for a future engagement channel — unconfirmed until that entry specifies its own instrumentation (`****** UNVERIFIED:`).

GazeMotive likely sits in a small thematic cluster with bor-sec-35 (Charoenpit & Ohkura) and bor-sec-39 (Sharma et al.), both e-learning eye-tracking-for-motivation units; if those exist on disk, cross-reference is worth checking for shared apparatus (Tobii-class trackers), shared AOI methodology, or convergent/divergent accuracy claims — not verified here.
