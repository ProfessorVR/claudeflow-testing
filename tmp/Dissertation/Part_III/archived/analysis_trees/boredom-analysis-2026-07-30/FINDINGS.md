# FINDINGS

Every result the analysis produced, with n, test, statistic, effect size and an
explicit poolability statement. **Nothing is omitted for being non-significant.**
Results below n=6 are labelled descriptive.

## 0. The reproduction gate

Four results are locked. They are checked twice per run - once against the
canonical code path, once through this tree's own extractors - and the run aborts
on failure.

| gate | check | n | direction | Friedman | Wilcoxon | rb | passed |
|---|---|---|---|---|---|---|---|
| canonical | Round 1 pupil dilation | 8 | 8/8 | 0.0302 | 0.0078 | -1.000 | PASS |
| canonical | Round 1 eye-closure | 8 | 7/8 | 0.0076 | 0.0156 | -0.944 | PASS |
| canonical | Pooled pupil | 12 | 10/12 | 0.0458 | 0.0093 | -0.821 | PASS |
| canonical | Pooled eye-closure | 12 | 11/12 | 0.0004 | 0.0010 | -0.974 | PASS |
| this-tree | Round 1 pupil dilation | 8 | 8/8 | 0.0302 | 0.0078 | -1.000 | PASS |
| this-tree | Round 1 eye-closure | 8 | 7/8 | 0.0076 | 0.0156 | -0.944 | PASS |
| this-tree | Pooled pupil | 12 | 10/12 | 0.0458 | 0.0093 | -0.821 | PASS |
| this-tree | Pooled eye-closure | 12 | 11/12 | 0.0004 | 0.0010 | -0.974 | PASS |

## 1. Headline

- 87 pairwise contrasts were computed across the whole analysis.
- **9 survive Holm correction**, and every one of them is on eye openness or pupil dilation.
- The result is carried by the eye-tracking surfaces. It is NOT spread across the
  channel set, and the honest form of the claim is the directional convergence
  across channels plus these specific surfaces - not per-channel significance for
  channels that do not reach it.

| surface | scope | pair | n | Wilcoxon p | Holm p | rb | direction |
|---|---|---|---|---|---|---|---|
| eye openness | POOLED N=12 | BORvCLC | 12 | 0.0009766 | 0.001953 | -0.974 | 11/12 |
| eye openness | POOLED N=12 | BORvINT | 12 | 0.0004883 | 0.001465 | -1.000 | 12/12 |
| eye openness | POOLED N=12 trimmed | BORvCLC | 12 | 0.0009766 | 0.001953 | -0.974 | 11/12 |
| eye openness | POOLED N=12 trimmed | BORvINT | 12 | 0.0004883 | 0.001465 | -1.000 | 12/12 |
| eye openness | R1-unified | BORvCLC | 8 | 0.01562 | 0.03125 | -0.944 | 7/8 |
| eye openness | R1-unified | BORvINT | 8 | 0.007812 | 0.02344 | -1.000 | 8/8 |
| pupil dilation | POOLED N=12 | BORvCLC | 12 | 0.009277 | 0.02783 | -0.821 | 10/12 |
| pupil dilation | R1-asis | BORvCLC | 8 | 0.007812 | 0.02344 | -1.000 | 8/8 |
| pupil dilation | R1-unified | BORvCLC | 8 | 0.007812 | 0.02344 | -1.000 | 8/8 |

## 2. Every surface, significant or not

### % time eyes closed - R2 only

- n=4; Friedman chi2=6.000, p=0.04979
- **NOT poolable** - episode segmentation depends on sampling rate
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.125 | 0.375 | +1.000 | 0/4 | +7.84 | no |
| BORvINT | 4 | 0.125 | 0.375 | +1.000 | 0/4 | +6.754 | no |
| CLCvINT | 4 | 0.625 | 0.625 | -0.400 | 2/4 | -0.944 | no |

### EEG DMN power (alpha+theta) - R1 only (N=8)

- n=8; Friedman chi2=3.250, p=0.1969
- poolability not classified - not classified
- note: Round 2 has no EEG; this channel is N=8 permanently

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.07812 | 0.2344 | +0.722 | 2/8 | +6.013 | no |
| BORvINT | 8 | 0.07812 | 0.2344 | +0.722 | 2/8 | +7.014 | no |
| CLCvINT | 8 | 0.5469 | 0.5469 | +0.278 | 3/8 | +1.686 | no |

### EEG frontal alpha - R1 only (N=8)

- n=8; Friedman chi2=1.750, p=0.4169
- poolability not classified - not classified
- note: Round 2 has no EEG; this channel is N=8 permanently

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.25 | 0.75 | -0.500 | 5/8 | -0.1593 | no |
| BORvINT | 8 | 0.25 | 0.75 | -0.500 | 6/8 | -0.1756 | no |
| CLCvINT | 8 | 0.6406 | 0.75 | +0.222 | 4/8 | +0.08974 | no |

### EEG frontal theta - R1 only (N=8)

- n=8; Friedman chi2=0.250, p=0.8825
- poolability not classified - not classified
- note: Round 2 has no EEG; this channel is N=8 permanently

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.7422 | 1 | +0.167 | 4/8 | +0.3465 | no |
| BORvINT | 8 | 0.8438 | 1 | +0.111 | 5/8 | -0.8084 | no |
| CLCvINT | 8 | 0.3125 | 0.9375 | +0.444 | 3/8 | +0.893 | no |

### EEG parietal alpha - R1 only (N=8)

- n=8; Friedman chi2=3.000, p=0.2231
- poolability not classified - not classified
- note: Round 2 has no EEG; this channel is N=8 permanently

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.03906 | 0.1172 | +0.833 | 2/8 | +2.948 | no |
| BORvINT | 8 | 0.03906 | 0.1172 | +0.833 | 2/8 | +4.784 | no |
| CLCvINT | 8 | 0.7422 | 0.7422 | -0.167 | 4/8 | +0.4084 | no |

### EEG parietal theta - R1 only (N=8)

- n=8; Friedman chi2=0.750, p=0.6873
- poolability not classified - not classified
- note: Round 2 has no EEG; this channel is N=8 permanently

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.7422 | 1 | +0.167 | 4/8 | +0.8559 | no |
| BORvINT | 8 | 0.4609 | 1 | +0.333 | 3/8 | +1.548 | no |
| CLCvINT | 8 | 0.6406 | 1 | +0.222 | 3/8 | +2.357 | no |

### HR - POOLED N=12

- n=10; Friedman chi2=0.800, p=0.6703
- poolable - mean of a vendor index; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 10 | 0.4316 | 1 | +0.309 | 4/10 | +1.444 | no |
| BORvINT | 10 | 1 | 1 | +0.018 | 4/10 | +1.558 | no |
| CLCvINT | 12 | 0.9097 | 1 | -0.051 | 5/12 | +1.082 | no |

### HR - R1-asis

- n=8; Friedman chi2=3.250, p=0.1969
- poolable - mean of a vendor index; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.5469 | 0.75 | +0.278 | 3/8 | +1.732 | no |
| BORvINT | 8 | 0.3125 | 0.75 | +0.444 | 2/8 | +2.393 | no |
| CLCvINT | 8 | 0.25 | 0.75 | +0.500 | 2/8 | +1.494 | no |

### HR - R1-unified

- n=8; Friedman chi2=3.250, p=0.1969
- poolable - mean of a vendor index; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.5469 | 0.75 | +0.278 | 3/8 | +1.732 | no |
| BORvINT | 8 | 0.3125 | 0.75 | +0.444 | 2/8 | +2.39 | no |
| CLCvINT | 8 | 0.25 | 0.75 | +0.500 | 2/8 | +1.494 | no |

### HR - R2

- n=2; Friedman not computed
- poolable - mean of a vendor index; robust to sampling rate
- **DESCRIPTIVE** (n < 6)
- note: n=2 too few complete cases

### blink rate - R2 only

- n=4; Friedman chi2=0.500, p=0.7788
- **NOT poolable** - Round 1's 334 ms sampling interval equals the mean blink duration, so blinks are unresolvable there; Round 2 only
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.375 | 1 | +0.600 | 1/4 | +2.305 | no |
| BORvINT | 4 | 1 | 1 | +0.000 | 2/4 | -0.3175 | no |
| CLCvINT | 4 | 0.875 | 1 | -0.200 | 2/4 | -0.8802 | no |

### cognitive load - POOLED N=12

- n=12; Friedman chi2=1.500, p=0.4724
- poolable - mean of a vendor index; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 12 | 0.4238 | 1 | -0.282 | 7/12 | -0.01533 | no |
| BORvINT | 12 | 0.5186 | 1 | -0.231 | 8/12 | -0.006979 | no |
| CLCvINT | 12 | 1 | 1 | +0.000 | 7/12 | -0.02082 | no |

### cognitive load - R1-asis

- n=8; Friedman chi2=1.750, p=0.4169
- poolable - mean of a vendor index; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.3828 | 1 | -0.389 | 6/8 | -0.04338 | no |
| BORvINT | 8 | 0.8438 | 1 | -0.111 | 4/8 | +0.01443 | no |
| CLCvINT | 8 | 0.3828 | 1 | +0.389 | 3/8 | +0.01723 | no |

### cognitive load - R1-unified

- n=8; Friedman chi2=1.750, p=0.4169
- poolable - mean of a vendor index; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.3828 | 1 | -0.389 | 6/8 | -0.04338 | no |
| BORvINT | 8 | 0.8438 | 1 | -0.111 | 4/8 | +0.01455 | no |
| CLCvINT | 8 | 0.3828 | 1 | +0.389 | 3/8 | +0.01723 | no |

### cognitive load - R2

- n=4; Friedman chi2=6.500, p=0.03877
- poolable - mean of a vendor index; robust to sampling rate
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.25 | 0.375 | +0.800 | 1/4 | +0.006541 | no |
| BORvINT | 4 | 0.125 | 0.375 | -1.000 | 4/4 | -0.02349 | no |
| CLCvINT | 4 | 0.125 | 0.375 | -1.000 | 4/4 | -0.03179 | no |

### eye openness - POOLED N=12

- n=12; Friedman chi2=15.500, p=0.0004307
- poolable - time-fraction/mean; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 12 | 0.0009766 | 0.001953 | -0.974 | 11/12 | -0.099 | YES |
| BORvINT | 12 | 0.0004883 | 0.001465 | -1.000 | 12/12 | -0.07518 | YES |
| CLCvINT | 12 | 0.2036 | 0.2036 | +0.436 | 4/12 | +0.0185 | no |

### eye openness - POOLED N=12 trimmed

- n=12; Friedman chi2=15.500, p=0.0004307
- poolable - time-fraction/mean; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 12 | 0.0009766 | 0.001953 | -0.974 | 11/12 | -0.099 | YES |
| BORvINT | 12 | 0.0004883 | 0.001465 | -1.000 | 12/12 | -0.06581 | YES |
| CLCvINT | 12 | 0.2036 | 0.2036 | +0.436 | 4/12 | +0.01463 | no |

### eye openness - R1-unified

- n=8; Friedman chi2=9.750, p=0.007635
- poolable - time-fraction/mean; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.01562 | 0.03125 | -0.944 | 7/8 | -0.099 | YES |
| BORvINT | 8 | 0.007812 | 0.02344 | -1.000 | 8/8 | -0.096 | YES |
| CLCvINT | 8 | 0.3125 | 0.3125 | +0.444 | 2/8 | +0.0185 | no |

### eye openness - R2

- n=4; Friedman chi2=6.000, p=0.04979
- poolable - time-fraction/mean; robust to sampling rate
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.125 | 0.375 | -1.000 | 4/4 | -0.09036 | no |
| BORvINT | 4 | 0.125 | 0.375 | -1.000 | 4/4 | -0.07471 | no |
| CLCvINT | 4 | 0.625 | 0.625 | +0.400 | 2/4 | +0.009634 | no |

### eye openness - R2-trimmed

- n=4; Friedman chi2=6.000, p=0.04979
- poolable - time-fraction/mean; robust to sampling rate
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.125 | 0.375 | -1.000 | 4/4 | -0.09859 | no |
| BORvINT | 4 | 0.125 | 0.375 | -1.000 | 4/4 | -0.06023 | no |
| CLCvINT | 4 | 0.625 | 0.625 | +0.400 | 2/4 | +0.006134 | no |

### gaze deviation median - R1-asis

- n=8; Friedman chi2=4.000, p=0.1353
- **NOT poolable** - windowed statistic over a 5-point rolling median; the window spans ~42 ms at 120 Hz and ~1.5 s at 3 Hz

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.9453 | 1 | +0.056 | 3/8 | +0.01401 | no |
| BORvINT | 8 | 0.1484 | 0.4453 | +0.611 | 1/8 | +0.01599 | no |
| CLCvINT | 8 | 0.6406 | 1 | +0.222 | 3/8 | +0.0008707 | no |

### gaze deviation median - R1-unified

- n=8; Friedman chi2=4.000, p=0.1353
- **NOT poolable** - windowed statistic over a 5-point rolling median; the window spans ~42 ms at 120 Hz and ~1.5 s at 3 Hz

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.8438 | 1 | +0.111 | 3/8 | +0.01401 | no |
| BORvINT | 8 | 0.1484 | 0.4453 | +0.611 | 1/8 | +0.01599 | no |
| CLCvINT | 8 | 0.6406 | 1 | +0.222 | 3/8 | +0.0008707 | no |

### gaze deviation median - R2

- n=4; Friedman chi2=6.000, p=0.04979
- **NOT poolable** - windowed statistic over a 5-point rolling median; the window spans ~42 ms at 120 Hz and ~1.5 s at 3 Hz
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.125 | 0.375 | +1.000 | 0/4 | +0.01148 | no |
| BORvINT | 4 | 0.125 | 0.375 | +1.000 | 0/4 | +0.02796 | no |
| CLCvINT | 4 | 1 | 1 | +0.000 | 2/4 | -0.0005896 | no |

### gaze deviation variance - R1-asis

- n=8; Friedman chi2=1.000, p=0.6065
- **NOT poolable** - variance of a 5-point rolling median: rate-dependent. Decimating Round 2 from 120 Hz to Round 1's ~3.3 Hz moves it by 0.65-0.84x (mean 0.74)

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.4609 | 0.9375 | +0.333 | 4/8 | +9.676e-05 | no |
| BORvINT | 8 | 0.3828 | 0.9375 | +0.389 | 2/8 | +0.001169 | no |
| CLCvINT | 8 | 0.3125 | 0.9375 | -0.444 | 6/8 | -0.0008525 | no |

### gaze deviation variance - R1-unified

- n=8; Friedman chi2=2.250, p=0.3247
- **NOT poolable** - variance of a 5-point rolling median: rate-dependent. Decimating Round 2 from 120 Hz to Round 1's ~3.3 Hz moves it by 0.65-0.84x (mean 0.74)

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.1953 | 0.5859 | +0.556 | 3/8 | +0.002155 | no |
| BORvINT | 8 | 0.25 | 0.5859 | +0.500 | 2/8 | +0.001787 | no |
| CLCvINT | 8 | 0.1953 | 0.5859 | -0.556 | 6/8 | -0.0008525 | no |

### gaze deviation variance - R2

- n=4; Friedman chi2=1.500, p=0.4724
- **NOT poolable** - variance of a 5-point rolling median: rate-dependent. Decimating Round 2 from 120 Hz to Round 1's ~3.3 Hz moves it by 0.65-0.84x (mean 0.74)
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.375 | 1 | +0.600 | 1/4 | +0.001355 | no |
| BORvINT | 4 | 0.625 | 1 | -0.400 | 2/4 | -0.0001051 | no |
| CLCvINT | 4 | 0.625 | 1 | -0.400 | 3/4 | -0.001612 | no |

### head motion (gyro magnitude) - R2 only

- n=1; Friedman not computed
- **NOT poolable** - Round 2 only; no Round 1 equivalent
- **DESCRIPTIVE** (n < 6)
- note: n=1 too few complete cases

### pupil dilation - POOLED N=12

- n=12; Friedman chi2=6.167, p=0.04581
- poolable - mean of a per-sample value; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 12 | 0.009277 | 0.02783 | -0.821 | 10/12 | -0.1548 | YES |
| BORvINT | 12 | 0.09229 | 0.1846 | -0.564 | 9/12 | -0.2075 | no |
| CLCvINT | 12 | 0.9697 | 0.9697 | +0.026 | 7/12 | -0.05784 | no |

### pupil dilation - R1-asis

- n=8; Friedman chi2=7.000, p=0.0302
- poolable - mean of a per-sample value; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.007812 | 0.02344 | -1.000 | 8/8 | -0.1797 | YES |
| BORvINT | 8 | 0.25 | 0.5 | -0.500 | 6/8 | -0.1623 | no |
| CLCvINT | 8 | 0.7422 | 0.7422 | +0.167 | 4/8 | +0.0006657 | no |

### pupil dilation - R1-unified

- n=8; Friedman chi2=7.000, p=0.0302
- poolable - mean of a per-sample value; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.007812 | 0.02344 | -1.000 | 8/8 | -0.1811 | YES |
| BORvINT | 8 | 0.25 | 0.5 | -0.500 | 6/8 | -0.1623 | no |
| CLCvINT | 8 | 0.7422 | 0.7422 | +0.167 | 4/8 | +0.0006657 | no |

### pupil dilation - R2

- n=4; Friedman chi2=1.500, p=0.4724
- poolable - mean of a per-sample value; robust to sampling rate
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.625 | 1 | -0.400 | 2/4 | -0.01213 | no |
| BORvINT | 4 | 0.25 | 0.75 | -0.800 | 3/4 | -0.2225 | no |
| CLCvINT | 4 | 0.875 | 1 | -0.200 | 3/4 | -0.2133 | no |

## 3. Self-report instrument

- **self-report boredom** (n=12): Friedman chi2=8.553, p=0.01389
  - BORvCLC: n=12, Wilcoxon p=0.07568, Holm p=0.1514, rb=+0.577 (2/12)
  - BORvINT: n=12, Wilcoxon p=0.02051, Holm p=0.06152, rb=+0.744 (2/12)
  - CLCvINT: n=12, Wilcoxon p=0.2129, Holm p=0.2129, rb=+0.455 (4/12)
- **self-report engagement** (n=12): Friedman chi2=10.533, p=0.005161
  - BORvCLC: n=12, Wilcoxon p=0.06934, Holm p=0.07031, rb=-0.590 (10/12)
  - BORvINT: n=12, Wilcoxon p=0.005859, Holm p=0.01758, rb=-0.894 (10/12)  **Holm-significant**
  - CLCvINT: n=12, Wilcoxon p=0.03516, Holm p=0.07031, rb=-0.727 (7/12)
- **sleep-fight** (n=11): Friedman chi2=10.683, p=0.004789
  - BORvCLC: n=11, Wilcoxon p=0.0293, Holm p=0.05859, rb=+0.764 (1/11)
  - BORvINT: n=12, Wilcoxon p=0.001953, Holm p=0.005859, rb=+1.000 (0/12)  **Holm-significant**
  - CLCvINT: n=11, Wilcoxon p=0.9912, Holm p=0.9912, rb=-0.015 (5/11)
- **felt duration** (n=12): Friedman chi2=2.279, p=0.32
  - BORvCLC: n=12, Wilcoxon p=0.7578, Holm p=1, rb=-0.133 (5/12)
  - BORvINT: n=12, Wilcoxon p=0.605, Holm p=1, rb=+0.179 (4/12)
  - CLCvINT: n=12, Wilcoxon p=0.2734, Holm p=0.8203, rb=+0.418 (3/12)
- **felt-duration dilation ratio** (n=12): Friedman chi2=2.279, p=0.32
  - BORvCLC: n=12, Wilcoxon p=0.7578, Holm p=1, rb=-0.133 (5/12)
  - BORvINT: n=12, Wilcoxon p=0.5562, Holm p=1, rb=+0.205 (4/12)
  - CLCvINT: n=12, Wilcoxon p=0.2266, Holm p=0.6797, rb=+0.455 (3/12)
- **depletion (fatigue after - prior)** (n=12): Friedman chi2=1.850, p=0.3965
  - BORvCLC: n=12, Wilcoxon p=0.248, Holm p=0.7441, rb=+0.436 (3/12)
  - BORvINT: n=12, Wilcoxon p=0.5049, Holm p=1, rb=+0.242 (4/12)
  - CLCvINT: n=12, Wilcoxon p=0.6641, Holm p=1, rb=-0.194 (4/12)
- **minutes until bored** (n=9): Friedman chi2=7.943, p=0.01885 - subjects who never became bored are absent by design, not by missingness; n is reduced accordingly and the test is on those who did become bored
  - BORvCLC: n=11, Wilcoxon p=0.009766, Holm p=0.0293, rb=-0.891 (8/11)  **Holm-significant**
  - BORvINT: n=9, Wilcoxon p=0.01562, Holm p=0.03125, rb=-0.889 (8/9)  **Holm-significant**
  - CLCvINT: n=9, Wilcoxon p=0.3477, Holm p=0.3477, rb=-0.378 (6/9)

## 4. The keystone at N=12

Physiology-engaged versus self-report-bored on the clinical stimulus, all 12
subjects. The composite is the mean within-subject z of pupil dilation, cognitive
load and eye openness.

| category | n | subjects |
|---|---|---|
| divergent | 5/12 | R2-02, S02, S04, S07, S08 |
| concordant-engaged | 3/12 | R2-04, S01, S03 |
| concordant-bored | 3/12 | R2-01, S05, S06 |
| reverse | 1/12 | R2-03 |

### The zero-reverse asymmetry does NOT hold at N=12

The specification asks whether the asymmetry - divergence in one direction and
never the other - survives at N=12. **It does not.** There is 1 reverse case: R2-03. Three things must
travel with that number.

**1. It is sensitive to how the engaged composite is built.** The whole
decomposition was recomputed under all seven non-empty subsets of the three
poolable engagement channels:

| composite definition | reverse | subjects |
|---|---|---|
| cognitive load | 2 | R2-03;R2-04 |
| eye openness | 0 | (none) |
| pupil dilation | 3 | R2-03;R2-04;S03 |
| cognitive load + eye openness | 1 | R2-03 |
| pupil dilation + cognitive load | 2 | R2-03;R2-04 |
| pupil dilation + eye openness | 1 | R2-03 |
| pupil dilation + cognitive load + eye openness **[baseline]** | 1 | R2-03 |

R2-03 is reverse under **6 of 7** definitions, so it is not an artefact of
one choice.

**2. It survives the non-wear trim** (R2-03 composite -0.510 untrimmed, -0.451 trimmed).

**3. 'Reverse' is a within-subject relative statement, not an absolute
one.**
R2-03 reported boredom 3/1/2 across Boring/Clinical/Interesting and engagement 8 on clinical.
They never reported being bored by anything and never became bored on
any stimulus - `minutes until bored` is blank on all three by design,
not by missingness.
Their clinical episode is simply their own relative physiological
minimum. That is materially different from 'physiologically bored while
reporting engagement', and the honest form of the finding says so without
making the case disappear.

### Prior-exposure moderation

Descriptive only - the strata are 4 and 8.

| stratum | n | boredom | engagement | felt duration | engaged composite |
|---|---|---|---|---|---|
| no prior exposure | 8 | 5.12 | 4.50 | 22.1 | 0.277 |
| prior exposure to medical footage | 4 | 6.00 | 4.25 | 21.2 | 0.286 |

The strata remain near-indistinguishable on clinical, so the prior-exposure
objection is still answered at N=12.

## 5. Round 1 versus Round 2 replication

Cohort mean within-subject z per channel and stimulus. Round 2 is n=4 and
DESCRIPTIVE throughout.

| surface | stimulus | R1 z | R2 z | delta | poolable |
|---|---|---|---|---|---|
| pupil dilation | BOR | -0.692 | -0.541 | +0.151 | yes |
| pupil dilation | CLC | +0.398 | -0.122 | -0.519 | yes |
| pupil dilation | INT | +0.294 | +0.662 | +0.368 | yes |
| cognitive load | BOR | -0.190 | -0.183 | +0.007 | yes |
| cognitive load | CLC | +0.348 | -0.830 | -1.178 | yes |
| cognitive load | INT | -0.158 | +1.013 | +1.171 | yes |
| HR | BOR | +0.456 | -0.512 | -0.968 | yes |
| HR | CLC | +0.078 | -0.318 | -0.396 | yes |
| HR | INT | -0.534 | +0.574 | +1.108 | yes |
| eye openness | BOR | -1.004 | -1.025 | -0.021 | yes |
| eye openness | CLC | +0.628 | +0.721 | +0.093 | yes |
| eye openness | INT | +0.376 | +0.304 | -0.072 | yes |
| gaze deviation variance | BOR | +0.390 | +0.208 | -0.182 | **NO** |
| gaze deviation variance | CLC | -0.429 | -0.519 | -0.090 | **NO** |
| gaze deviation variance | INT | +0.039 | +0.311 | +0.272 | **NO** |

## 6. EEG - the negative result, reported in full

- N=8 permanently; Round 2 has no EEG.
- **0 of 5 surfaces reach Friedman p<0.05.**
- **0 of 15 pairwise contrasts survive Holm.**
- Keystone concordance 4/8, which is exactly chance.
- Epoch retention mean 62.3% (range 36.3-74.4%), 3 of 24 cells below 50%.

This is the evidence for the ruling that EEG was dropped because it was too
noisy, and it is reported rather than asserted. No cell was excluded for being
noisy, because doing so would have removed the justification.

## 7. Standing caveats

- No rate-dependent feature is pooled across rounds anywhere in this document.
- HRV is excluded from both rounds by author ruling and is recoverable.
- No learning-outcome claim is made anywhere.
- Category caution: episodic structural grammar only, never a *Grundstimmung*
  claim.
- All findings are reportable label-keyed under the governing IRB protocol; the
  subject's name is not, and never enters any output.
