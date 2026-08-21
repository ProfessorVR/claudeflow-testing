# SOURCES

Works cited by the analysis, MLA form. Every entry was verified against the source
during the run that produced these results.

## Methodological sources

VanderWerf, Frans, Petra Brassinga, Dirk Reits, Majid Aramideh, and Bram Ongerboer
de Visser. "Eyelid Movements: Behavioral Studies of Blinking in Humans Under
Different Stimulus Conditions." *Journal of Neurophysiology*, vol. 89, no. 5, 2003,
pp. 2784-96. doi:10.1152/jn.00557.2002.

> Source of the blink-duration ceiling in `config.BLINK_MAX_MS`. Quoted verbatim
> from the full text: "The total duration of spontaneous blinks was 334 +/- 67 ms,
> the down phase duration was 92 +/- 17 ms, and the up phase duration lasted 242 +/-
> 55 ms." Those blinks were recorded **while subjects watched a video**, which
> matches this paradigm closely. The 500 ms threshold is the mean plus roughly 2.5
> standard deviations, rounded.

King, et al. ASEE 2023, paper #37129.

> The F3/F4/P3/P4 montage and the DMN alpha+theta boredom marker, implemented by
> `ch_eeg.py`.

King, et al. ASEE 2024, paper #44685.

> The gaze-deviation-variance feature implemented by `ch_hmd.py`.

## Note on the two ASEE entries

**These two entries are incomplete and need the author's own records before they
reach the works cited.** Only the paper numbers and their methodological roles were
verified here; the full author lists, first names and paper titles were not.

The omission is deliberate rather than an oversight. Several co-author surnames are
also participant surnames - the studies were run within the lab, and members of the
author team appear in the participant pool. The PII guard caught this when the full
lists were first written into a working document.

Nothing about citing the papers is improper: those author lists are already
published and public, and the crosswalk is not recoverable from them, since subject
labels come from sorted folder order and are never persisted. But a works-cited
entry sits a few pages from a per-subject results matrix, and the two together
narrow the pool a reader is choosing from. That is a narrowing risk, not an
identification.

**Recommendation:** cite both papers in full and normally in the works cited, which
is required and correct, and keep the per-subject matrix label-keyed as it already
is. Take no further action. The decision is the author's, and it is better made now
than noticed at review.
