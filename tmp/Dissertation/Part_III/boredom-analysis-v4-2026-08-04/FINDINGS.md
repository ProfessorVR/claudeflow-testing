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
| this-tree | Pooled pupil | 12 | 10/12 | 0.0970 | 0.0049 | -0.872 | PASS |
| this-tree | Pooled eye-closure | 12 | 11/12 | 0.0004 | 0.0010 | -0.974 | PASS |

## 1. Headline

- 99 pairwise contrasts were computed across the whole analysis.
- **9 survive Holm correction**, and every one of them is on excursions >10 deg per min or eye openness or pupil dilation.
- The result is carried by the eye-tracking surfaces. It is NOT spread across the
  channel set, and the honest form of the claim is the directional convergence
  across channels plus these specific surfaces - not per-channel significance for
  channels that do not reach it.

| surface | scope | pair | n | Wilcoxon p | Holm p | rb | direction |
|---|---|---|---|---|---|---|---|
| excursions >10 deg per min | R1 fixed-forward | BORvCLC | 8 | 0.02344 | 0.04688 | -0.889 | 7/8 |
| excursions >10 deg per min | R1 fixed-forward | BORvINT | 8 | 0.01562 | 0.04688 | -0.944 | 7/8 |
| eye openness | POOLED N=12 | BORvCLC | 12 | 0.0009766 | 0.001953 | -0.974 | 11/12 |
| eye openness | POOLED N=12 | BORvINT | 12 | 0.0004883 | 0.001465 | -1.000 | 12/12 |
| eye openness | R1-unified | BORvCLC | 8 | 0.01562 | 0.03125 | -0.944 | 7/8 |
| eye openness | R1-unified | BORvINT | 8 | 0.007812 | 0.02344 | -1.000 | 8/8 |
| pupil dilation | POOLED N=12 | BORvCLC | 12 | 0.004883 | 0.01465 | -0.872 | 10/12 |
| pupil dilation | R1-asis | BORvCLC | 8 | 0.007812 | 0.02344 | -1.000 | 8/8 |
| pupil dilation | R1-unified | BORvCLC | 8 | 0.007812 | 0.02344 | -1.000 | 8/8 |

## 2. Every surface, significant or not

### % time beyond 10 deg off centre - R1 fixed-forward

- n=8; Friedman chi2=1.750, p=0.4169
- **NOT poolable** - windowed statistic over a 5-point rolling median; the window spans ~42 ms at 120 Hz and ~1.5 s at 3 Hz

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.1484 | 0.4453 | +0.611 | 3/8 | +16.35 | no |
| BORvINT | 8 | 0.1953 | 0.4453 | +0.556 | 2/8 | +6.538 | no |
| CLCvINT | 8 | 0.5469 | 0.5469 | -0.278 | 5/8 | -18.29 | no |

### % time beyond 10 deg off centre - R2 fixed-forward

- n=4; Friedman chi2=3.500, p=0.1738
- **NOT poolable** - windowed statistic over a 5-point rolling median; the window spans ~42 ms at 120 Hz and ~1.5 s at 3 Hz
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.125 | 0.375 | +1.000 | 0/4 | +8.964 | no |
| BORvINT | 4 | 0.625 | 1 | +0.400 | 1/4 | +5.446 | no |
| CLCvINT | 4 | 0.875 | 1 | -0.200 | 2/4 | -1.984 | no |

### % time eyes closed - R2 only

- n=4; Friedman chi2=6.000, p=0.04979
- **NOT poolable** - episode segmentation depends on sampling rate
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.125 | 0.375 | +1.000 | 0/4 | +8.993 | no |
| BORvINT | 4 | 0.125 | 0.375 | +1.000 | 0/4 | +7.413 | no |
| CLCvINT | 4 | 0.875 | 0.875 | -0.200 | 2/4 | -0.1355 | no |

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

- n=10; Friedman chi2=1.400, p=0.4966
- poolable - mean of a vendor index; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 10 | 0.3223 | 0.9668 | +0.382 | 3/10 | +1.728 | no |
| BORvINT | 10 | 0.9219 | 1 | +0.055 | 4/10 | +1.558 | no |
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
| BORvCLC | 4 | 0.375 | 1 | +0.600 | 1/4 | +2.462 | no |
| BORvINT | 4 | 1 | 1 | +0.000 | 2/4 | -0.08483 | no |
| CLCvINT | 4 | 1 | 1 | +0.000 | 2/4 | +0.3016 | no |

### cognitive load - POOLED N=12

- n=12; Friedman chi2=0.667, p=0.7165
- poolable - mean of a vendor index; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 12 | 0.4238 | 1 | -0.282 | 7/12 | -0.01549 | no |
| BORvINT | 12 | 0.5693 | 1 | -0.205 | 7/12 | -0.007011 | no |
| CLCvINT | 12 | 0.9697 | 1 | +0.026 | 7/12 | -0.01111 | no |

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

- n=4; Friedman chi2=4.500, p=0.1054
- poolable - mean of a vendor index; robust to sampling rate
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.25 | 0.5 | +0.800 | 1/4 | +0.006809 | no |
| BORvINT | 4 | 0.25 | 0.5 | -0.800 | 3/4 | -0.02571 | no |
| CLCvINT | 4 | 0.125 | 0.375 | -1.000 | 4/4 | -0.02926 | no |

### excursions >10 deg per min - R1 fixed-forward

- n=8; Friedman chi2=7.000, p=0.0302
- **NOT poolable** - windowed statistic over a 5-point rolling median; the window spans ~42 ms at 120 Hz and ~1.5 s at 3 Hz

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.02344 | 0.04688 | -0.889 | 7/8 | -6.597 | YES |
| BORvINT | 8 | 0.01562 | 0.04688 | -0.944 | 7/8 | -6.681 | YES |
| CLCvINT | 8 | 0.3828 | 0.3828 | -0.389 | 5/8 | -2.468 | no |

### excursions >10 deg per min - R2 fixed-forward

- n=4; Friedman chi2=0.500, p=0.7788
- **NOT poolable** - windowed statistic over a 5-point rolling median; the window spans ~42 ms at 120 Hz and ~1.5 s at 3 Hz
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.625 | 1 | +0.400 | 1/4 | +5.441 | no |
| BORvINT | 4 | 1 | 1 | +0.000 | 2/4 | -0.8885 | no |
| CLCvINT | 4 | 1 | 1 | +0.000 | 2/4 | +2.045 | no |

### eye openness - POOLED N=12

- n=12; Friedman chi2=15.500, p=0.0004307
- poolable - time-fraction/mean; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 12 | 0.0009766 | 0.001953 | -0.974 | 11/12 | -0.099 | YES |
| BORvINT | 12 | 0.0004883 | 0.001465 | -1.000 | 12/12 | -0.08148 | YES |
| CLCvINT | 12 | 0.2036 | 0.2036 | +0.436 | 4/12 | +0.01462 | no |

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
| BORvCLC | 4 | 0.125 | 0.375 | -1.000 | 4/4 | -0.103 | no |
| BORvINT | 4 | 0.125 | 0.375 | -1.000 | 4/4 | -0.08148 | no |
| CLCvINT | 4 | 0.625 | 0.625 | +0.400 | 2/4 | +0.003414 | no |

### gaze deviation from centre (deg) - R1 fixed-forward

- n=8; Friedman chi2=3.250, p=0.1969
- **NOT poolable** - windowed statistic over a 5-point rolling median; the window spans ~42 ms at 120 Hz and ~1.5 s at 3 Hz

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 8 | 0.03906 | 0.1172 | +0.833 | 2/8 | +2.394 | no |
| BORvINT | 8 | 0.07812 | 0.1562 | +0.722 | 2/8 | +2.525 | no |
| CLCvINT | 8 | 0.6406 | 0.6406 | -0.222 | 5/8 | -2.642 | no |

### gaze deviation from centre (deg) - R2 fixed-forward

- n=4; Friedman chi2=3.500, p=0.1738
- **NOT poolable** - windowed statistic over a 5-point rolling median; the window spans ~42 ms at 120 Hz and ~1.5 s at 3 Hz
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.125 | 0.375 | +1.000 | 0/4 | +1.067 | no |
| BORvINT | 4 | 0.875 | 1 | +0.200 | 1/4 | +1.245 | no |
| CLCvINT | 4 | 0.875 | 1 | -0.200 | 2/4 | -0.3358 | no |

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
| BORvCLC | 4 | 0.125 | 0.375 | +1.000 | 0/4 | +0.01146 | no |
| BORvINT | 4 | 0.125 | 0.375 | +1.000 | 0/4 | +0.02686 | no |
| CLCvINT | 4 | 0.875 | 0.875 | +0.200 | 2/4 | +0.002369 | no |

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
| BORvCLC | 4 | 0.375 | 1 | +0.600 | 1/4 | +0.00123 | no |
| BORvINT | 4 | 0.875 | 1 | -0.200 | 2/4 | -0.0001804 | no |
| CLCvINT | 4 | 0.625 | 1 | -0.400 | 3/4 | -0.001387 | no |

### pupil dilation - POOLED N=12

- n=12; Friedman chi2=4.667, p=0.09697
- poolable - mean of a per-sample value; robust to sampling rate

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 12 | 0.004883 | 0.01465 | -0.872 | 10/12 | -0.1548 | YES |
| BORvINT | 12 | 0.1514 | 0.3027 | -0.487 | 8/12 | -0.1492 | no |
| CLCvINT | 12 | 0.7334 | 0.7334 | +0.128 | 6/12 | +0.0006657 | no |

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

- n=4; Friedman chi2=0.000, p=1
- poolable - mean of a per-sample value; robust to sampling rate
- **DESCRIPTIVE** (n < 6)
- n=4: the Wilcoxon floor is p=0.125, so perfect separation is the strongest obtainable result

| pair | n | Wilcoxon p | Holm p | rb | direction | median diff | Holm sig |
|---|---|---|---|---|---|---|---|
| BORvCLC | 4 | 0.625 | 1 | -0.400 | 2/4 | -0.03714 | no |
| BORvINT | 4 | 0.625 | 1 | -0.400 | 2/4 | -0.06857 | no |
| CLCvINT | 4 | 1 | 1 | +0.000 | 2/4 | -0.03858 | no |

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
- **minutes until bored** (n=8): Friedman chi2=7.000, p=0.0302 - subjects who never became bored are absent by design, not by missingness; n is reduced accordingly and the test is on those who did become bored
  - BORvCLC: n=10, Wilcoxon p=0.009766, Holm p=0.0293, rb=-0.891 (8/10)  **Holm-significant**
  - BORvINT: n=8, Wilcoxon p=0.03125, Holm p=0.0625, rb=-0.861 (7/8)
  - CLCvINT: n=9, Wilcoxon p=0.3477, Holm p=0.3477, rb=-0.378 (6/9)

## 4. The keystone at N=12

Physiology-engaged versus self-report-bored on the clinical stimulus, all 12
subjects. The composite is the mean within-subject z of pupil dilation, cognitive
load and eye openness.

| category | n | subjects |
|---|---|---|
| divergent | 8/12 | R2-01, R2-02, S02, S04, S05, S06, S07, S08 |
| concordant-engaged | 4/12 | R2-03, R2-04, S01, S03 |
| concordant-bored | 0/12 | - |
| reverse | 0/12 | - |

### The zero-reverse asymmetry does NOT hold at N=12

The specification asks whether the asymmetry - divergence in one direction and
never the other - survives at N=12. **It does not.** There are 0 reverse cases: . Three things must
travel with that number.

**1. It is sensitive to how the engaged composite is built.** The whole
decomposition was recomputed under all seven non-empty subsets of the three
poolable engagement channels:

| composite definition | reverse | subjects |
|---|---|---|
| cognitive load | 2 | R2-03;R2-04 |
| eye openness | 0 | (none) |
| pupil dilation | 2 | R2-04;S03 |
| cognitive load + eye openness | 1 | R2-03 |
| pupil dilation + cognitive load | 2 | R2-03;R2-04 |
| pupil dilation + eye openness **[baseline]** | 0 | (none) |
| pupil dilation + cognitive load + eye openness | 1 | R2-03 |

### Prior-exposure moderation

Descriptive only - the strata are 4 and 8.

| stratum | n | boredom | engagement | felt duration | engaged composite |
|---|---|---|---|---|---|
| no prior exposure | 8 | 5.12 | 4.50 | 22.1 | 0.622 |
| prior exposure to medical footage | 4 | 6.00 | 4.25 | 21.2 | 0.240 |

The strata remain near-indistinguishable on clinical, so the prior-exposure
objection is still answered at N=12.

## 5. Round 1 versus Round 2 replication

Cohort mean within-subject z per channel and stimulus. Round 2 is n=4 and
DESCRIPTIVE throughout.

| surface | stimulus | R1 z | R2 z | delta | poolable |
|---|---|---|---|---|---|
| pupil dilation | BOR | -0.692 | -0.267 | +0.425 | yes |
| pupil dilation | CLC | +0.398 | +0.180 | -0.218 | yes |
| pupil dilation | INT | +0.294 | +0.088 | -0.207 | yes |
| cognitive load | BOR | -0.190 | -0.008 | +0.182 | yes |
| cognitive load | CLC | +0.348 | -0.779 | -1.127 | yes |
| cognitive load | INT | -0.158 | +0.787 | +0.944 | yes |
| HR | BOR | +0.456 | -0.478 | -0.934 | yes |
| HR | CLC | +0.078 | -0.333 | -0.411 | yes |
| HR | INT | -0.534 | +0.572 | +1.106 | yes |
| eye openness | BOR | -1.004 | -1.057 | -0.053 | yes |
| eye openness | CLC | +0.628 | +0.735 | +0.107 | yes |
| eye openness | INT | +0.376 | +0.322 | -0.054 | yes |
| gaze deviation variance | BOR | +0.390 | +0.221 | -0.169 | **NO** |
| gaze deviation variance | CLC | -0.429 | -0.480 | -0.051 | **NO** |
| gaze deviation variance | INT | +0.039 | +0.259 | +0.220 | **NO** |

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
