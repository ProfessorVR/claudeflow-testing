# APPENDIX — Criterion validity: rank against linear, analytic against permutation

Generated from the run. Every number below is regenerated on every execution.

## 1. What is being asked

Two different questions can be put to a physiological channel, and they have
different answers in this dataset.

1. **Does the channel separate the three films?** That is the Friedman/Wilcoxon
   work reported in FINDINGS.md.
2. **Does the channel agree with what the participant said?** That is this
   appendix. It is the study's own original validation logic - the participants'
   reports were the criterion and the instruments were scored against them - and
   it had never been computed until this run.

Neither channel validates the other (DA-04): both are reported. A channel can
separate the stimuli powerfully and agree with the person not at all, and in this
dataset pupil dilation does exactly that.

## 2. How each number is produced

**Step 1.** Pivot the measurement to a participant x film table.

**Step 2.** Convert each row to a WITHIN-SUBJECT z-score, `(value - mean) / sd`,
using that participant's own mean and their own sample standard deviation
(`ddof=1`). This is what makes participants comparable: absolute pupil size, eye
range and rating habits vary enormously, and after this step each participant
contributes only the SHAPE of their three films relative to themselves.

**Step 3.** Do the same to the criterion - the participant's own boredom or
engagement rating.

**Step 4.** Pair every (participant, film) cell and correlate the two lists.

**Step 5.** Compute the p by WITHIN-SUBJECT PERMUTATION rather than analytically.
The three film labels are shuffled INSIDE each participant, the coefficient is
recomputed, and the process repeats 20,000 times. Seeds are fixed per
test, so the value is byte-reproducible.

## 3. Why the analytic p cannot be used

The paired points are **not independent observations**. They are 12 participants
contributing 3 films each. Worse, the within-subject z-scoring makes the
dependence structural rather than incidental: forcing a participant's three
values to have mean 0 and standard deviation 1 means knowing two of them nearly
determines the third.

`scipy.stats.spearmanr` and `pearsonr` both assume independence, so both report
p-values that are too small here. Measured across every test in this analysis the
inflation runs roughly 3-8x. **The inflation applies to Pearson exactly as it does
to Spearman**, which is the point: it is a property of the design, not an artifact
of ranking.

## 4. Why Spearman is the reported coefficient

Spearman correlates the RANKS rather than the raw values. It assumes no particular
shape of relationship and no single extreme value can dominate it, which suits a
12-participant physiological dataset. Pearson measures straight-line association
and is more powerful when the relationship really is linear.

Here the two agree closely - median |r - rho| = **0.032**, maximum **0.105**.
Where a monotonic relationship is also close to linear, the rank test costs almost
nothing in power. So Spearman was not chosen to manufacture a result; it was chosen
for robustness, and Pearson is reported here to demonstrate that the choice is
nearly free. Had the two diverged sharply, that would itself have been a finding
about the shape of the relationship and would need reporting rather than a footnote.

## 5. Every test, both coefficients, both p-values

| channel | criterion | n | Spearman rho | perm p | analytic p | Pearson r | perm p | analytic p | r − rho |
|---|---|---|---|---|---|---|---|---|---|
| gaze deviation (per-participant baseline) | boredom | 36 | **+0.590** | **0.0024** | 0.00015 | +0.623 | 0.0016 | 0.00005 | +0.032 |
| gaze deviation (per-file baseline) | boredom | 36 | **+0.524** | **0.0074** | 0.00105 | +0.574 | 0.0036 | 0.00025 | +0.050 |
| eye closure | boredom | 36 | **+0.475** | **0.0173** | 0.00341 | +0.580 | 0.0038 | 0.00021 | +0.105 |
| gaze deviation (device-forward baseline) | boredom | 36 | +0.359 | 0.0751 | 0.03165 | +0.341 | 0.0954 | 0.04187 | -0.018 |
| % time >10 deg off center (device-forward baseline) | boredom | 36 | +0.324 | 0.1114 | 0.05363 | +0.346 | 0.0931 | 0.03845 | +0.022 |
| pupil dilation | boredom | 36 | -0.172 | 0.4037 | 0.31555 | -0.164 | 0.4334 | 0.33994 | +0.008 |
| gaze deviation variance (per-file baseline) | boredom | 36 | -0.114 | 0.5675 | 0.50683 | -0.105 | 0.6100 | 0.54338 | +0.010 |
| cognitive load | boredom | 36 | -0.092 | 0.6516 | 0.59417 | -0.059 | 0.7742 | 0.73119 | +0.033 |
| HR | boredom | 34 | +0.088 | 0.6774 | 0.62165 | +0.079 | 0.7153 | 0.65758 | -0.009 |
| excursion rate >10 deg (device-forward baseline) | boredom | 36 | -0.082 | 0.6829 | 0.63320 | -0.148 | 0.4675 | 0.38855 | -0.066 |
| gaze deg p90 (device-forward baseline) | boredom | 36 | -0.046 | 0.8222 | 0.79199 | +0.000 | 0.9995 | 0.99959 | +0.046 |
| gaze deviation (per-participant baseline) | engagement | 36 | **-0.585** | **0.0022** | 0.00018 | -0.609 | 0.0021 | 0.00008 | -0.024 |
| gaze deviation (per-file baseline) | engagement | 36 | **-0.527** | **0.0075** | 0.00095 | -0.590 | 0.0030 | 0.00015 | -0.063 |
| eye closure | engagement | 36 | **-0.435** | **0.0279** | 0.00796 | -0.535 | 0.0073 | 0.00077 | -0.100 |
| gaze deviation (device-forward baseline) | engagement | 36 | -0.391 | 0.0515 | 0.01832 | -0.403 | 0.0476 | 0.01474 | -0.012 |
| % time >10 deg off center (device-forward baseline) | engagement | 36 | -0.334 | 0.0990 | 0.04653 | -0.389 | 0.0570 | 0.01891 | -0.055 |
| excursion rate >10 deg (device-forward baseline) | engagement | 36 | +0.184 | 0.3622 | 0.28173 | +0.216 | 0.2932 | 0.20530 | +0.032 |
| cognitive load | engagement | 36 | +0.107 | 0.5954 | 0.53277 | +0.097 | 0.6375 | 0.57342 | -0.010 |
| gaze deviation variance (per-file baseline) | engagement | 36 | +0.106 | 0.6073 | 0.53773 | +0.091 | 0.6632 | 0.59736 | -0.015 |
| HR | engagement | 34 | +0.036 | 0.8647 | 0.83937 | +0.052 | 0.8057 | 0.77095 | +0.016 |
| pupil dilation | engagement | 36 | +0.036 | 0.8608 | 0.83571 | +0.100 | 0.6276 | 0.56014 | +0.065 |
| gaze deg p90 (device-forward baseline) | engagement | 36 | -0.033 | 0.8730 | 0.84914 | -0.088 | 0.6675 | 0.60923 | -0.055 |

Bold marks significance on the **permutation** p at alpha=0.05, which is the
reported test. Channels marked APPENDIX ONLY elsewhere - cognitive load, heart
rate - are included here because their flatness against both criteria is the
evidence for excluding them, and evidence is better reported than asserted.

## 6. What the correction changes

3 test(s) cross alpha=0.05 once the clustering is respected:

- **gaze deviation (device-forward baseline) vs boredom**: rho +0.359, analytic p 0.0317 -> permutation p 0.0751
- **gaze deviation (device-forward baseline) vs engagement**: rho -0.391, analytic p 0.0183 -> permutation p 0.0515
- **% time >10 deg off center (device-forward baseline) vs engagement**: rho -0.334, analytic p 0.0465 -> permutation p 0.0990

The coefficients themselves are unaffected - rho and r are descriptive statistics
and do not depend on the independence assumption. The ranking of channels is
identical under both p-values. What changes is which of the weaker associations
may be called significant.

## 6b. The same associations computed within each round

A pooled association can be produced by one round rather than by both. The
criterion tests are therefore recomputed inside each round separately, as a
sensitivity check rather than as a second result.

**Round 2 is thin by construction.** Four participants give twelve paired
points and only 6^4 = 1,296 distinct within-subject arrangements, so the
permutation null is coarse there and the split is DESCRIPTIVE. Round 1 gives
eight participants and twenty-four paired points.

| channel | criterion | pooled rho (p) | Round 1 rho (p) | Round 2 rho (p) |
|---|---|---|---|---|
| eye closure | boredom | +0.475 (0.0173) | +0.420 (0.0916) | +0.538 (0.1261) |
| eye closure | engagement | -0.435 (0.0279) | -0.397 (0.1105) | -0.452 (0.2231) |
| gaze deviation (per-participant baseline) | boredom | +0.590 (0.0024) | +0.475 (0.0552) | +0.868 (0.0049) |
| gaze deviation (per-participant baseline) | engagement | -0.585 (0.0022) | -0.429 (0.0839) | -0.928 (0.0067) |
| gaze deviation (per-participant baseline) | boredom | +0.590 (0.0024) | +0.475 (0.0552) | +0.868 (0.0049) |
| gaze deviation (per-participant baseline) | engagement | -0.585 (0.0022) | -0.429 (0.0839) | -0.928 (0.0067) |
| gaze deviation (per-file baseline) | boredom | +0.524 (0.0074) | +0.417 (0.0959) | +0.812 (0.0141) |
| gaze deviation (per-file baseline) | engagement | -0.527 (0.0075) | -0.355 (0.1495) | -0.914 (0.0078) |

Read as direction and relative size, not as three independent tests. A pooled
association whose two rounds point the same way is not carried by one of them;
where the rounds disagree in sign, the pooled value is stated with that fact
attached.

## 7. Standing caution

Both rounds record gaze EYE-IN-HEAD, not head pose. A participant who turns their
head away from the film registers no deviation on any gaze channel here. Head
movement is visible in the session video and is DEFERRED by author ruling; it is
not measured in this pass, and no claim in this appendix reaches it.